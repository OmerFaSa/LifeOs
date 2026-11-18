// HAREKET GEZISI: kabugun hareket dilini gercek tarayicida sinar (yalitilmis ortam: gecici veri klasoru, HKM'siz, kendi portu).
// Sinanan: hareket aciksa yeni sayfa bir kez suzulur, gecis yonu sekme sirasina uyar, ayni sayfanin yeniden cizimi suzulmeyi
// yeniden oynatmaz, tiklanan kart acilan sayfanin basina akar (paylasilan oge), dogru/yanlis cevap, ilerleme ve tercih
// gostergesi yalniz goruntude oynar (metin ve aria-valuenow aninda dogru); hareket «az» ve sistemin «hareketi azalt»i her seyi kapatir.
// Kare olcumu (gecislerde 50 ms'yi asan kare) bilgi verir; --kati ile kapiya doner.
// Kullanim: node tools/hareket_gez.js [--kati]
const kok = require('path').resolve(__dirname, '..'), KATI = process.argv.includes('--kati');
const { chromium } = require(kok + '/tools/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');

const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'hareket-gez-'));
const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1', LOCALAPPDATA: gecici, APPDATA: gecici,
  LIFEOS_HESAP_KLASOR: path.join(gecici, 'LifeOS', 'hesap') });
let srv, T, PORT;   // tools/gez_sunucu.js: boş port, çıktı hata anında gösterilir
const { sunucuAc } = require(kok + '/tools/gez_sunucu.js');
let kalan = 0;
const dene = (ad, kosul, ek) => { if (!kosul) kalan++; console.log((kosul ? '✓ ' : '✕ ') + ad + (kosul || ek == null ? '' : '  → ' + ek)); };

// sayfada: süresi sıfırdan büyük, şu an oynayan animasyonlar (görünüm geçişinin sözde öğeleri dahil)
const OYNAYAN = () => document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().duration > 0)
  .map(a => (a.animationName || a.transitionProperty || a.id || 'wa') + (a.effect.pseudoElement ? a.effect.pseudoElement : '') + '@' + ((a.effect.target && (a.effect.target.className.baseVal != null ? a.effect.target.className.baseVal : a.effect.target.className)) || '?'));
// sayfada: verilen işi yapar, o sırada rAF aralıklarını toplar (ilk kare atılır)
async function kareOlc(p, isFn, arg) {
  return p.evaluate(async ([kod, arg]) => {
    const l = []; let son = performance.now(), dur = false;
    (function f(t) { l.push(t - son); son = t; if (!dur) requestAnimationFrame(f); })(performance.now());
    await (new Function('arg', 'return (' + kod + ')(arg)'))(arg);
    dur = true; l.shift();
    return { n: l.length, enUzun: Math.round(Math.max.apply(null, l.concat(0))), uzun: l.filter(x => x > 50).length };
  }, [isFn.toString(), arg]);
}
const bekleGecis = p => p.waitForFunction(() => !document.documentElement.hasAttribute('data-gecis'), null, { timeout: 5000 }).catch(() => {});

(async () => {
  const S = await sunucuAc({ kok, env, ad: 'hareket-gez' }); srv = S.srv; T = S.T; PORT = S.port; await S.hazir();
  const b = await chromium.launch();
  const y = JSON.parse(fs.readFileSync(path.join(kok, 'alan/felsefe/asama-1.json'), 'utf8'));
  const d1 = y.uniteler[0].dersler[0], a1 = d1.alistirmalar.filter(a => a.tur === 'secmeli' || a.sec)[0], harf = 'ABCDEFGH';
  const kareler = {};
  try {
    const hata = [];
    for (const [ad, hareket, azalt] of [['açık', 'sistem', false], ['az', 'az', false], ['hareketi azalt', 'sistem', true]]) {
      const kapali = ad !== 'açık';
      const c = await b.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: azalt ? 'reduce' : 'no-preference' }), p = await c.newPage();
      p.on('pageerror', e => hata.push(ad + ': ' + e.message));
      // tek deposu ve başlangıç paketi olmayan bu ortamda eşitleme ve başlangıç uçlarının 404'ü, yazılmamış aşamanın 404'ü beklenir; başka her hata sayılır
      p.on('console', m => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) hata.push(ad + ': ' + m.text()); });
      p.on('response', r => { if (r.status() >= 400 && !/\/api\/hesap\/kabuk|\/api\/kabuk\/baslangic|\/alan\/[a-z]+\/(asama-\d+|harita)\.json$/.test(r.url())) hata.push(ad + ': ' + r.status() + ' ' + r.url()); });
      await p.addInitScript(h => { try { localStorage.setItem('lifeos.hareket', h); } catch (e) { /* yok */ } }, hareket);
      // görünüm geçişlerini say (hareket kapalıyken hiç başlamamalı)
      await p.addInitScript(() => { window.__vt = 0; const o = document.startViewTransition; if (o) document.startViewTransition = function (f) { window.__vt++; return o.call(document, f); }; });

      // 1 · giriş: Öğren listesi bir kez süzülür
      await p.goto(T + '/kabuk/#/ogren');
      await p.waitForSelector('.b-liste > li:nth-child(3)');
      const giris = await p.evaluate(() => ({ sure: getComputedStyle(document.documentElement).getPropertyValue('--sure').trim(),
        anim: getComputedStyle(document.querySelector('.b-liste > li:nth-child(3)')).animationName }));
      if (kapali) dene(ad + ': --sure 0', giris.sure === '0s', JSON.stringify(giris));
      else dene(ad + ': yeni sayfada liste süzülür', /suzul/.test(giris.anim) && giris.sure !== '0s', JSON.stringify(giris));
      await p.waitForTimeout(1500);

      // 2 · geçiş yönü: sekme sırasına göre ileri/geri, bitince iz kalmaz
      const g = await p.evaluate(async () => {
        const sekme = [].map.call(document.querySelectorAll('.ust__sekmeler a'), a => a.getAttribute('href'));
        const iz = [], bek = [], mo = new MutationObserver(() => { const v = document.documentElement.getAttribute('data-gecis'); if (v) iz.push(v); });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gecis'] });
        let once = location.hash;
        for (const h of ['#/bugun', '#/saglik', '#/ogren']) {
          bek.push(sekme.indexOf(h) > sekme.indexOf(once) ? 'ileri' : 'geri'); once = h;
          document.querySelector('.ust__sekmeler a[href="' + h + '"]').click(); await new Promise(r => setTimeout(r, 900));
        }
        mo.disconnect();
        return { iz, bek, son: document.documentElement.getAttribute('data-gecis'), isaret: !!document.querySelector('.ust__sekmeler a[aria-current] .ust__isaret') };
      });
      if (kapali) dene(ad + ': görünüm geçişi başlamaz', !g.iz.length && (await p.evaluate(() => window.__vt)) === 0, JSON.stringify(g));
      else dene(ad + ': geçiş yönü sekme sırasına uyar, bitince iz kalmaz, sekme işareti yerinde', JSON.stringify(g.iz) === JSON.stringify(g.bek) && g.son === null && g.isaret, JSON.stringify(g));

      // 2a · üstte parlama ve çakışma yok (2026-11-17c): eski ve yeni sayfa aynı zamanlamada (opaklık toplamı 1, krem zemin görünmez),
      // üst çubuğun eski görüntüsü çizilmez (sekme adları üst üste binmiyordu)
      if (!kapali) {
        const z = await p.evaluate(async () => {
          document.querySelector('.ust__sekmeler a[href="#/saglik"]').click();
          let an = [];   // geçişin hareketleri güncelleme bitince başlar: kısa süre beklenir
          for (let i = 0; i < 40 && !an.some(a => a.effect.pseudoElement === '::view-transition-new(root)'); i++) { await new Promise(r => setTimeout(r, 10)); an = document.getAnimations().filter(a => a.effect && a.effect.pseudoElement); }
          const t = s => an.filter(a => a.effect.pseudoElement === s).map(a => a.effect.getComputedTiming());
          const ustEski = document.documentElement.hasAttribute('data-gecis') ? getComputedStyle(document.documentElement, '::view-transition-old(ust)').display : 'yok';
          const o = t('::view-transition-old(root)')[0], n = t('::view-transition-new(root)')[0];
          return { o: o && [o.duration, o.delay, o.easing], n: n && [n.duration, n.delay, n.easing], ustEski, ustAnim: t('::view-transition-old(ust)').length + t('::view-transition-new(ust)').length };
        });
        await bekleGecis(p);
        await p.click('.ust__sekmeler a[href="#/ogren"]'); await bekleGecis(p);   // 2b Öğren'den başlar
        dene(ad + ': geçişte eski ve yeni sayfa aynı zamanlamada, üst çubuk çapraz sönmez', !!z.o && JSON.stringify(z.o) === JSON.stringify(z.n) && z.ustEski === 'none' && z.ustAnim === 0, JSON.stringify(z));
      }

      // 2b · geçiş türü: ana bölümler arası «buyuk», derse başlamak «ders», dersten alana dönüş «kucuk» (geri)
      if (!kapali) {
        const tur = await p.evaluate(async () => {
          const iz = [], mo = new MutationObserver(() => { const t = document.documentElement.getAttribute('data-gecis-tur'); if (t) iz.push(t + ':' + document.documentElement.getAttribute('data-gecis')); });
          mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gecis-tur'] });
          const git = async h => { location.hash = h; await new Promise(r => setTimeout(r, 1100)); };
          await git('#/saglik'); await git('#/alan/felsefe'); await git('#/alan/felsefe/ders/felsefe.1.1.1'); await git('#/alan/felsefe');
          mo.disconnect(); return iz;
        });
        dene(ad + ': geçiş türü bölüm değişiminde büyük, derse başlarken ders, dersten dönüşte küçük ve geri',
          JSON.stringify(tur) === JSON.stringify(['buyuk:ileri', 'buyuk:geri', 'ders:ileri', 'kucuk:geri']), JSON.stringify(tur));
        await p.goto(T + '/kabuk/#/ogren'); await p.waitForTimeout(1500);
      }

      // 3 · aynı sayfanın yeniden çizimi süzülmeyi yeniden oynatmaz
      await p.waitForTimeout(1300);
      const tekrar = await p.evaluate(async () => {
        dispatchEvent(new HashChangeEvent('hashchange'));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { canlan: document.getElementById('sayfa').classList.contains('canlan') };
      });
      const oyn3 = await p.evaluate(OYNAYAN);
      dene(ad + ': yeniden çizimde hiçbir şey yeniden oynamaz', !tekrar.canlan && !oyn3.some(x => /suzul|gir|belir|kapak/.test(x)), JSON.stringify(oyn3));

      // 4 · paylaşılan öğe: Bugün'deki alan kartı açtığı sayfanın kapak simgesine akar
      await p.click('.ust__sekmeler a[href="#/bugun"]'); await bekleGecis(p); await p.waitForTimeout(1200);
      const kart = p.locator('.b-karsilama__alanlar a.b-karsilama__alan').first();
      if (await kart.count()) {
        const hedef = await kart.getAttribute('href');
        await kart.click();
        const pay = await p.evaluate(async () => { // geçiş hazır olana dek (en çok 0,8 sn) paylaşılan grubun animasyonu aranır
          for (const son = performance.now() + 800; performance.now() < son;) {
            const n = document.getAnimations().filter(a => /paylasilan/.test(a.effect && a.effect.pseudoElement || '')).length; if (n) return n;
            await new Promise(r => requestAnimationFrame(r));
          } return 0; });
        await bekleGecis(p); await p.waitForTimeout(300);
        dene(ad + ': uçan simge yok, geçiş tek hareket (' + hedef + ')', pay === 0, pay); // sahibin isteği 2026-11-16: geçiş tek ve sakin
        dene(ad + ': geçişten sonra geçici ad kalmaz', await p.evaluate(() => ![].some.call(document.querySelectorAll('#sayfa *'), e => e.style.viewTransitionName)));
      } else dene(ad + ': Bugün\'de alan kartı var', false);

      // 5 · cevap: metin anında doğru; yanlışta sarsma, doğruda işaret çizilir (yalnız görüntü)
      await p.goto(T + '/kabuk/#/alan/felsefe'); await p.waitForSelector('.govde [role=progressbar]'); await p.waitForTimeout(1200);
      const ilkDeger = await p.$$eval('.govde [role=progressbar]', l => l.map(x => x.getAttribute('aria-valuenow')).join(','));
      await p.evaluate(h => { location.hash = h; }, '#/alan/felsefe/ders/' + d1.id + '?dene'); await p.waitForSelector('article.ders .b-soru'); await bekleGecis(p); await p.waitForTimeout(1200);
      const soru = '.b-soru[data-soru="' + a1.id + '"]', yanlis = harf[(harf.indexOf(a1.dogru) + 1) % a1.sec.length];
      const yn = await p.evaluate(([s, h]) => { document.querySelector(s + ' [data-h="' + h + '"]').click();
        const metin = document.querySelector(s + ' .b-soru__sonuc').textContent;
        return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r({ metin, anim: document.getAnimations().filter(a => a.effect.target && a.effect.target.closest && a.effect.target.closest(s)).map(a => a.animationName) })))); }, [soru, yanlis]);
      dene(ad + ': yanlış cevap metni anında', /Yanlış/.test(yn.metin), yn.metin);
      if (kapali) dene(ad + ': yanlışta sarsma yok', !yn.anim.length, JSON.stringify(yn.anim));
      else dene(ad + ': yanlışta şık hafifçe sarsılır', yn.anim.indexOf('sars') >= 0, JSON.stringify(yn.anim));
      await p.waitForTimeout(700);
      const dg = await p.evaluate(([s, h]) => { document.querySelector(s + ' [data-h="' + h + '"]').click();
        const metin = document.querySelector(s + ' .b-soru__sonuc').textContent;
        return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r({ metin, anim: document.getAnimations().filter(a => a.effect.target && a.effect.target.closest && a.effect.target.closest(s)).map(a => a.animationName) })))); }, [soru, a1.dogru]);
      dene(ad + ': doğru cevap metni anında', /Doğru/.test(dg.metin), dg.metin);
      if (kapali) dene(ad + ': doğruda çizim yok', !dg.anim.length, JSON.stringify(dg.anim));
      else dene(ad + ': doğruda onay işareti çizilir', dg.anim.indexOf('ciz') >= 0, JSON.stringify(dg.anim));

      // 6 · ders bitince ilerleme çubuğu dolar; aria-valuenow anında yeni değerde
      await p.click('[data-ac="okudum"]'); if (await p.locator('[data-ac="okudum"][data-yine]').count()) await p.click('[data-ac="okudum"][data-yine]'); // cevaplanmamış alıştırma: yumuşak onay
      await p.waitForFunction(h => location.hash !== h, '#/alan/felsefe/ders/' + d1.id + '?dene'); await bekleGecis(p); await p.waitForTimeout(600);
      await p.evaluate(() => { location.hash = '#/alan/felsefe'; }); await p.waitForSelector('.govde [role=progressbar]');
      const il = await p.evaluate(() => new Promise(r => requestAnimationFrame(() => r({
        deger: [].map.call(document.querySelectorAll('.govde [role=progressbar]'), x => x.getAttribute('aria-valuenow')).join(','),
        anim: document.getAnimations().filter(a => a.effect.target && a.effect.target.closest && a.effect.target.closest('.b-ilerleme')).length }))));
      dene(ad + ': ilerleme değeri anında yeni (' + ilkDeger + ' → ' + il.deger + ')', il.deger !== ilkDeger, il.deger);
      if (kapali) dene(ad + ': ilerleme çubuğu oynamaz', il.anim === 0, il.anim);
      else dene(ad + ': ilerleme çubuğu dolar, sayı kayar', il.anim > 0, il.anim);
      await bekleGecis(p); await p.waitForTimeout(900);

      // 7 · ayar değişince seçili gösterge kayar; aria-checked anında
      await p.evaluate(() => { location.hash = '#/ayarlar'; }); await p.waitForSelector('[data-ayar-satir="lifeos.kontrast"]'); await bekleGecis(p); await p.waitForTimeout(1200);
      const ay = await p.evaluate(() => { const b = document.querySelector('[data-ayar-satir="lifeos.kontrast"] [role=radio][aria-checked="false"]'), v = b.getAttribute('data-deger'); b.click();
        const ok = document.querySelector('[data-ayar-satir="lifeos.kontrast"] [data-deger="' + v + '"]').getAttribute('aria-checked');
        return new Promise(r => requestAnimationFrame(() => r({ ok, kayan: document.getAnimations().filter(a => a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('tercih-kayan')).length }))); });
      dene(ad + ': ayar seçimi anında yazılır', ay.ok === 'true', JSON.stringify(ay));
      if (kapali) dene(ad + ': tercih göstergesi kaymaz', ay.kayan === 0, JSON.stringify(ay));
      else dene(ad + ': tercih göstergesi yeni seçime kayar', ay.kayan > 0, JSON.stringify(ay));
      await p.waitForTimeout(600);

      // 8 · hareket kapalıyken hiçbir şey oynamaz (gezinti ve tıklamadan hemen sonra)
      if (kapali) {
        const oyn = await p.evaluate(async () => { const l = []; for (const h of ['#/bugun', '#/ogren', '#/motor/not']) { location.hash = h; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          l.push(...document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().duration > 0).map(a => a.animationName || a.transitionProperty)); } return l; });
        dene(ad + ': gezintide oynayan animasyon yok', !oyn.length, JSON.stringify(oyn));
      }

      // 9 · kare ölçümü: sekmeler ve alt sayfalar arası geçişler (bilgi; --kati ile kapı)
      await p.evaluate(() => { location.hash = '#/bugun'; }); await bekleGecis(p); await p.waitForTimeout(1200);
      kareler[ad] = await kareOlc(p, async () => {
        for (const h of ['#/ogren', '#/saglik', '#/motor/not', '#/motor/plan', '#/alan/felsefe', '#/ayarlar', '#/bugun']) { location.hash = h; await new Promise(r => setTimeout(r, 650)); }
      });
      console.log('  kareler (' + ad + '): ' + JSON.stringify(kareler[ad]));
      if (KATI) dene(ad + ': geçişlerde 50 ms\'yi aşan kare yok', kareler[ad].uzun === 0, JSON.stringify(kareler[ad]));
      await c.close();
    }
    dene('sayfa ve konsol hatası yok', hata.length === 0, hata.join(' | '));
  } finally { await b.close(); srv.kill(); try { fs.rmSync(gecici, { recursive: true, force: true }); } catch (e) { /* Windows kilidi */ } }
  console.log(kalan ? kalan + ' kaldı' : 'hepsi geçti'); process.exit(kalan ? 1 : 0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
