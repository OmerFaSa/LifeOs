// KABUK GEZISI: tek kapiyi yalitilmis ortamda (gecici LOCALAPPDATA, HKM'siz, deneme portu) acar ve yeni kabukta
// on alani ve arac ekranlarini gercek tarayiciyla yurur: Bugun, ders, alistirma, unite kapisi, Not, Tekrar, Kayit, Plan, Soru,
// sureli deneme ve prova, Tanisma, asamalar (Felsefe'nin ikinci asamasi; dosya yoksa yapay asama yalniz tarayiciya verilir).
// Kullanim: node tools/kabuk_gez.js [--goruntu | --goruntu=hafta,kayit-hafta]   (--goruntu: belgeler/ekip/sadelesme/kabuk-onizleme/ goruntulerini yeniler;
// =onekler: yalniz adi bu oneklerle baslayan goruntuler, otekilere dokunulmaz; yer-1..7 iki gorunumlu: masaustu-koyu, telefon-acik)
const kok = require('path').resolve(__dirname, '..'), GORUNTU = process.argv.includes('--goruntu');
const SECILI = ((process.argv.find(a => a.indexOf('--goruntu=') === 0) || '').slice(10)).split(',').filter(Boolean);
const { chromium } = require(kok + '/tools/node_modules/playwright');
const fs = require('fs'), os = require('os'), path = require('path');

// sunucu tools/gez_sunucu.js ile boş portta açılır (GEZ_PORT=NNNN sabitler); T ve srv açılınca dolar
const { sunucuAc } = require('./gez_sunucu.js');
let T = '', srv = { kill() {} };
const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'kabuk-gez-'));
const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1', LOCALAPPDATA: gecici, APPDATA: gecici, LIFEOS_TASIMA: '1',
  LIFEOS_HESAP_KLASOR: path.join(gecici, 'LifeOS', 'hesap') }); // hesap klasörü Linux'ta LOCALAPPDATA'ya bakmaz: göç paketleri onun yanındaki goc/paket'ten okunur // köken taşıması ucu: gerçekte yalnız tek kapı devredeyken açık
// Başlangıç paketi (tools/kabuk_baslangic.py çıktısının biçimi): eski modüllerin gerçek biçimindeki kayıtlar motorların göç
// bağdaştırıcılarından geçer (tools/kabuk_baslangic.js topla, tek depodan okuyan aracın kendi zinciri) + elle bir not ve bir ölçü
const AK = JSON.parse(fs.readFileSync(path.join(kok, 'alan/akademik/asama-1.json'), 'utf8'));
const AK_KAYNAK = AK.kaynaklar.filter(k => k.bolum === "R.KONU_ANLATIM['tr-01']")[0].id;
const AK_A0 = [].concat(...AK.uniteler.map(u => u.dersler)).filter(d => d.kaynak[0] === AK_KAYNAK)[0].alistirmalar[0];
const grup = (rota, alan, yol, govde) => ({ rota, alan, kayitlar: [{ yol, govde }] });
const eski = require(path.join(kok, 'tools/kabuk_baslangic.js')).topla({ baglam: { baslangic: '2026-09-07' }, gruplar: [
  grup('ays:days', 'ays/main', 'days/2026-10-21', { date: '2026-10-21', blocks: [{ id: 'b1', slot: 'Sabah', subject: 'Matematik', topic: 'Türev', targetMin: 50, actualMin: 45, status: 'done', actualQ: 28, correctQ: 20 }] }),
  grup('ays:weeks', 'ays/main', 'weeks/w02', { n: 2, title: 'Hafta iki', questionTarget: 400 }),
  grup('spi:haftaplan', 'spi/ben', 'haftaplan/h1', { id: 'h1', tur: 'hareket', ad: 'Yürüyüş', gunler: [{ ne: 'yürü', dk: 30 }, null, null, null, null, null, null] }),
  grup('ays:exams', 'ays/main', 'exams/d1', { id: 'd1', date: '2026-10-19', type: 'Tam TYT', family: 'TYT', kind: 'full', duration: 165, tests: [{ name: 'Türkçe', correct: 30, wrong: 8, blank: 2 }] }),
  grup('ays:cards', 'ays/main', 'cards/c1', { id: 'c1', front: 'Eski AYS kartı', back: 'Cevabı', dueAt: '2026-10-20', lastReviewedAt: '2026-10-13', history: [{ rating: 'good' }] }),
  grup('ays:topics', 'ays/main', 'topics/tyt-turkce', { subjectId: 'tyt-turkce', states: { 'tr-01': { state: 'practicing', ornek: { 0: { h: AK_A0.dogru, d: true, at: '2026-09-30T09:00:00.000Z' } } } } })] });
fs.mkdirSync(path.join(gecici, 'LifeOS', 'veri'), { recursive: true });
fs.writeFileSync(path.join(gecici, 'LifeOS', 'veri', 'kabuk-baslangic.json'), JSON.stringify({ lifeos_kabuk_baslangic: 1, kimlik: 'gezi-paketi', uretildi: 1,
  say: { notlar: 1, kayitlar: 1 + eski.kayitlar.length, kartlar: eski.kartlar.length, plan: 3, soru: 2, yol: 2 }, beden: { boy: 175, dogumYili: 2001 },
  notlar: [{ id: 'eski-not-1', baslik: 'Eski defterden', govde: 'Eski sistemde yazılmış not.', alan: '', etiketler: [], kaynak: { yapi: 'defter' }, olusturma: 1000, guncelleme: 1000,
    ozel: false, tur: 'not', klasor: '', sabit: false, baglam: null, ozellik: {} }],
  kayitlar: [{ id: 'kilo:2026-10-20:0', tur: 'kilo', gun: '2026-10-20', zaman: null, kaynak: 'goc', deger: { kg: { v: 70, k: 'eski' } }, ek: {} }].concat(eski.kayitlar),
  kartlar: eski.kartlar, plan: eski.plan, soru: eski.soru, yol: eski.yol }));
// Köken taşıması: eski AYS kökeninin göç paketi (biçim brand/ortak/gocpaket.js)
fs.mkdirSync(path.join(gecici, 'LifeOS', 'goc', 'paket'), { recursive: true });
fs.writeFileSync(path.join(gecici, 'LifeOS', 'goc', 'paket', 'ays-cGEZ-20261114-000000-abcdef.json'), JSON.stringify({ lifeos_goc: 1, kaynak: 'ays', cihaz: 'cGEZ', parca: 1,
  profiller: { main: { data: { gezi: { isaret: 'eski-kokenden' } } } }, anahtarlar: { 'lifeos.king.bas.ays': { x: 1 }, 'lifeos.gezi.metin': 'duz metin' }, bekleyen: {}, atlanan: { sir: 0, ornek: 0 }, medya: [] }));
const cikti = path.join(kok, 'belgeler/ekip/sadelesme/kabuk-onizleme');
const YER = ['masaustu-koyu', 'telefon-acik']; // yer-1..7 önizlemeleri (faz3-yer-ve-not-agi.md) bu iki görünümle çekilmişti
let kalan = 0;
const dene = (ad, kosul, ek) => { if (!kosul) kalan++; console.log((kosul ? '✓ ' : '✕ ') + ad + (kosul || ek == null ? '' : '  → ' + ek)); };
// alan sayfasının ilerleme çubukları «değer/toplam · …» (okunan ders, geçilen ünite kapısı)
// 2026-11-16b: alan genel bakışında tek ince çizgi (okunan ders); geçilen ünite yolun ✓ numaralarında
const ilerleme = s => s.$$eval('.govde [role=progressbar]', l => l.map(x => x.getAttribute('aria-valuenow') + '/' + x.getAttribute('aria-valuemax')).join(' · '));
// Ders «Bitir»: cevaplanmamış alıştırma varsa önce yumuşak onay çıkar; «Yine de bitir» geçer (onay da ayrıca sınanır)
const bitir = async s => { await s.click('[data-ac="okudum"]'); const y = s.locator('[data-ac="okudum"][data-yine]'); if (await y.count().catch(() => 0)) await y.click(); };
// Kapı/yerleştirme: boş soru varsa ilk basış «Yine de gönder?» der (.kapi__bos), ikinci basış gönderir
const gonder = async (s, f = 'form.kapi') => { await s.click(f + ' button[type=submit]'); if (await s.locator(f + ' .kapi__bos').count().catch(() => 0)) await s.click(f + ' button[type=submit]'); };
// dört görünüm (1280/390 × açık/koyu) aynı sayfada; telefonda yatay taşma her koşuda denetlenir, görüntü yalnız --goruntu ile.
// sec.yalniz: yalnız bu görünümler (ör. ['masaustu-koyu', 'telefon-acik']); sec.hazirla: her görünümde çekimden önce (açılır katmanı o boyda yeniden açmak gibi).
// Giriş animasyonları çekimde bitmiş sayılır (animations: 'disabled').
async function goruntu(p, ad, sec = {}) {
  for (const [w, h, vad] of [[1280, 800, 'masaustu'], [390, 844, 'telefon']]) for (const tm of ['acik', 'koyu']) {
    if (sec.yalniz && sec.yalniz.indexOf(vad + '-' + tm) < 0) continue;
    await p.setViewportSize({ width: w, height: h }); await p.emulateMedia({ colorScheme: tm === 'koyu' ? 'dark' : 'light' });
    if (sec.hazirla) await sec.hazirla();
    if (w === 390 && tm === 'acik') dene(ad + ': telefonda yatay taşma yok', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await p.evaluate(() => document.documentElement.scrollWidth));
    if (GORUNTU || SECILI.some(x => ad.indexOf(x) === 0)) await p.screenshot({ path: path.join(cikti, ad + '-' + vad + '-' + tm + '.png'), fullPage: true, animations: 'disabled' });
  }
  await p.setViewportSize({ width: 1280, height: 800 }); await p.emulateMedia({ colorScheme: 'dark' });
}

(async () => {
  const y = JSON.parse(fs.readFileSync(path.join(kok, 'alan/felsefe/asama-1.json'), 'utf8'));
  const u1 = y.uniteler[0], harf = 'ABCD';
  const S = await sunucuAc({ kok, env, ad: 'kabuk-gez' }); srv = S.srv; T = S.T; await S.hazir();
  const b = await chromium.launch();
  // Bu gezi işlevi sınar; hareket (görünüm geçişi, süzülme) tools/hareket_gez.js'in işi. Geçiş sürerken ekranda bir an eski sayfa durur:
  // her bağlam «hareket az» açılır ki adım, geçişin ortasında eski sayfayı okumasın.
  const yeniBaglam = b.newContext.bind(b);
  b.newContext = async o => { const c = await yeniBaglam(o); await c.addInitScript(() => { try { if (!localStorage.getItem('lifeos.hareket')) localStorage.setItem('lifeos.hareket', 'az'); } catch (e) {} }); return c; };
  try {
    const c = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
    const p = await c.newPage(); const hata = [];
    p.on('pageerror', e => { hata.push(e.message); console.log('  sayfa hatası: ' + e.message); });
    // dosyası henüz yazılmamış aşamanın 404u ve tek deposu olmayan bu ortamda eşitleme ucunun 404ü beklenir (kabuk eşitlemeyi kapatır; gerçek yol tools/kabuk_esit_gez.js); başka her hata sayılır
    p.on('console', m => { if (m.type() === 'error' && !/\/alan\/[a-z]+\/(asama-\d+|harita)\.json$|\/api\/hesap\/kabuk/.test(m.location().url || '')) hata.push(m.text()); });
    // Felsefe'nin ikinci aşaması: gerçek dosya varsa o, yoksa birinciden türetilmiş yapay aşama (yalnız bu tarayıcıya verilir)
    const y2yol = path.join(kok, 'alan/felsefe/asama-2.json'), y2gercek = fs.existsSync(y2yol);
    const y2 = y2gercek ? JSON.parse(fs.readFileSync(y2yol, 'utf8')) : Object.assign(JSON.parse(JSON.stringify(y).replace(/"felsefe\.1/g, '"felsefe.2')), { sira: 2, onKosul: ['felsefe.1'] });
    if (!y2gercek) await p.route('**/alan/felsefe/asama-2.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(y2) }));

    await p.goto(T + '/kabuk/');
    await p.waitForSelector('.b-karsilama__alanlar .b-karsilama__alan');
    await p.waitForFunction(() => /Sıradaki: /.test(document.querySelector('#b-k-alanlar + .b-karsilama__alanlar .b-karsilama__alan, .b-karsilama__alanlar .b-karsilama__alan').textContent));
    const kokCevap = await p.request.get(T + '/', { maxRedirects: 0 });
    dene('tek kapıda kök yeni kabuğa yönlenir', kokCevap.status() === 302 && kokCevap.headers().location === '/kabuk/', kokCevap.status());
    await p.waitForFunction(() => !!localStorage.getItem('lifeos.tasima'));
    dene('köken taşıması: eski modülün deposu bu kökene geri yazıldı (ana depo, nesne ve düz metin anahtar)', await p.evaluate(() =>
      localStorage.getItem('rota84285.v2') === '{"gezi":{"isaret":"eski-kokenden"}}' && localStorage.getItem('lifeos.king.bas.ays') === '{"x":1}' &&
      localStorage.getItem('lifeos.gezi.metin') === 'duz metin' && JSON.parse(localStorage.getItem('lifeos.tasima')).ays === 'ays-cGEZ-20261114-000000-abcdef.json'));
    const ilkAlan = () => p.evaluate(() => { const a = document.querySelector('#b-k-alanlar + .b-karsilama__alanlar .b-karsilama__alan, .b-karsilama__alanlar .b-karsilama__alan'); return { href: a.getAttribute('href'), metin: a.textContent }; });
    const ia = await ilkAlan();
    dene('Bugün: büyük iş kartı yok; «İlerleme» bölümünde çalışılan alan (Felsefe) en başta, sıradaki dersin adıyla', ia.href === '#/alan/felsefe' && ia.metin.indexOf('Sıradaki: ' + u1.dersler[0].ad) >= 0
      && (await p.locator('.b-karsilama__is').count()) === 0 && (await p.textContent('#b-k-alanlar')) === 'İlerleme', JSON.stringify(ia));
    dene('Bugün: karşılama taşı tek h1 selam ve özet cümlesi', (await p.locator('#sayfa h1.b-karsilama__selam').count()) === 1 && (await p.locator('#sayfa h1').count()) === 1
      && /^Bugün .* var\.$/.test(await p.textContent('.b-karsilama__ozet')));
    // Türk izleri (2026-11-18f): tarihte on iki hayvanlı Türk takviminin yılı, İlerleme'nin altında günün sözü (Göktürk harfleriyle «Türük», kaynak)
    dene('Bugün: tarih satırında Türk takvimi yılı, günün sözü kaynağıyla ve Göktürk harfleriyle', /· \S+ yılı$/.test((await p.textContent('.b-karsilama__tarih')).trim())
      && (await p.textContent('.soz .soz__runik')) === '\u{10C45}\u{10C07}\u{10C3C}\u{10C1C}' && (await p.textContent('.soz__metin')).length > 5 && (await p.textContent('.soz__kaynak')).length > 3,
      await p.textContent('.b-karsilama__tarih'));
    // 2026-11-18g: tarihî gün değilse en yakın gelen gün ve kalan gün («N gün sonra · 22 Kasım · …»); logoda al bayrak
    { const yk = (await p.locator('.soz__yakin').count()) ? await p.textContent('.soz__yakin') : '', ml = await p.locator('.soz__milli').count();
      dene('Bugün: söz üstünde bugünün tarihî günü ya da yaklaşan gün sayacı; logoda al bayrak', (ml === 1 || /^\d+ gün sonra · \d+ \S+ · .+/.test(yk))
        && (await p.locator('.ust__logo .ust__bayrak').count()) === 1, yk); }
    dene('Bugün: üst çubukta logo, beş bölüm (Bugün seçili), arama komut çubuğunu açar', (await p.locator('.ust--sahne .ust__sekmeler a').count()) === 5
      && (await p.getAttribute('.ust__sekmeler a[aria-current="page"]', 'href')) === '#/bugun' && (await p.getAttribute('.ust__ara', 'data-ac')) === 'komut');
    await goruntu(p, 'karsilama');
    // ---- Halka (taş 24): Ctrl . ile ortada açılır, menü/menuitem, ok tuşu gezer, Esc kapatır ve odak geri döner ----
    const halkaAcik = () => p.evaluate(() => !document.getElementById('halka').hidden); // halka kabı 0 × 0: görünürlüğü hidden niteliğinden
    const halkaAc = async () => { if (await halkaAcik()) await p.keyboard.press('Escape'); await p.keyboard.press('Control+.'); await p.waitForSelector('#halka.b-halka--acik .b-halka__oge'); };
    await p.focus('.b-karsilama__alan');
    await halkaAc();
    const halkaN = await p.locator('#halka[role=menu] button[role=menuitem].b-halka__oge').count();
    dene('halka: menü 3–6 yer, ilki odakta', halkaN >= 3 && halkaN <= 6 && (await p.evaluate(() => document.activeElement === document.querySelector('#halka .b-halka__oge'))), halkaN);
    await p.keyboard.press('ArrowRight');
    dene('halka: ok tuşu sonraki yere geçer', await p.evaluate(() => document.activeElement === document.querySelectorAll('#halka .b-halka__oge')[1]));
    await goruntu(p, 'halka', { hazirla: halkaAc });
    await p.keyboard.press('Escape');
    dene('halka: Esc kapatır, odak düğmeye döner', !(await halkaAcik()) && (await p.isHidden('#perde')) && await p.evaluate(() => document.activeElement === document.querySelector('.b-karsilama__alan')));
    await p.keyboard.press('Control+.');
    await p.waitForSelector('#halka.b-halka--acik .b-halka__oge');
    await p.keyboard.press('End');
    const halkaSon = await p.evaluate(() => document.activeElement.getAttribute('data-yol'));
    await p.keyboard.press('Enter');
    await p.waitForFunction(y => location.hash === y, halkaSon);
    dene('halka: Enter seçili yere gider ve halka kapanır', !(await halkaAcik()) && halkaSon.indexOf('#/') === 0, halkaSon);
    // ---- Komut çubuğu (taş 25): dialog + combobox, ok tuşu etkin seçeneği taşır, Esc kapatır ----
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('.b-karsilama');
    const komutAc = async () => { if (await p.isVisible('#komut')) await p.keyboard.press('Escape'); await p.keyboard.press('Control+k'); await p.fill('#komut input', 'not'); await p.waitForSelector('#komut-0'); };
    await komutAc();
    dene('komut çubuğu: dialog, combobox ilk seçeneği etkin, sonuç sayısı canlı satırda', (await p.getAttribute('#komut', 'role')) === 'dialog' && (await p.getAttribute('#komut input', 'aria-activedescendant')) === 'komut-0'
      && (await p.getAttribute('#komut-0', 'aria-selected')) === 'true' && /\d+ sonuç/.test(await p.textContent('#komut-durum')));
    await p.keyboard.press('ArrowDown');
    dene('komut çubuğu: ↓ ikinci seçeneği etkin yapar', (await p.getAttribute('#komut input', 'aria-activedescendant')) === 'komut-1' && (await p.getAttribute('#komut-1', 'aria-selected')) === 'true');
    await goruntu(p, 'komut', { hazirla: komutAc });
    await p.fill('#komut input', 'qqqzzz');
    dene('komut çubuğu: eşleşme yokken yalnız «Her şeyde ara» kalır', (await p.locator('#komut-liste [role=option]').count()) === 1 && /Her şeyde ara: qqqzzz/.test(await p.textContent('#komut-liste')));
    await p.keyboard.press('Escape');
    dene('komut çubuğu: Esc kapatır', (await p.isHidden('#komut')) && (await p.isHidden('#perde')));

    // ---- Gezinme sadeliği (2026-11-16b): ad Başbuğ, bilinmeyen adres, rıhtım ve basılı tut yok, kaydırınca üst çubuk gizlenir ----
    dene('ad: başlık «… · Başbuğ», logo «Başbuğ», ay (ambiyans) düğmesi ve «iki adımda» ipucu yok', (await p.title()) === 'Bugün · Başbuğ' && /Başbuğ/.test(await p.textContent('.ust__logo'))
      && (await p.locator('.ust__gece, [data-ac="gece"], #rihtim').count()) === 0 && !/iki adımda/.test(await p.textContent('#sayfa')));
    dene('üst çubuk: sekmeler halkanın yerleri (Sistem haritası hariç), aynı adla; seçili olmayan sekmenin adı yalnız ekran okuyucuda',
      JSON.stringify(await p.$$eval('.ust__sekmeler a', l => l.map(a => a.textContent))) === JSON.stringify(await p.$$eval('#halka .b-halka__oge', l => l.map(b => b.textContent.trim()).filter(t => t !== 'Sistem haritası')))
      && (await p.$$eval('.ust__sekmeler a:not([aria-current]) .ust__sekme-ad', l => l.every(x => x.getBoundingClientRect().width <= 1))));
    await p.goto(T + '/kabuk/#/boyle-bir-yer-yok');
    await p.waitForFunction(() => document.getElementById('sayfa').getAttribute('data-ciz') === 'yok');
    dene('bilinmeyen adres Bugün\'e düşmez: «Bu sayfa yok» ve Bugün\'e dönüş', /Bu sayfa yok/.test(await p.textContent('.b-bos')) && (await p.getAttribute('.b-bos a.b-dugme', 'href')) === '#/bugun'
      && (await p.title()) === 'Bu sayfa yok · Başbuğ');
    await p.goto(T + '/kabuk/#/ayarlar');
    await p.waitForSelector('.ayarlar');
    await p.waitForTimeout(150);
    dene('ayarlar: tek sütun; grup menüsü yok, arama ve yedi grup başlığı var', (await p.locator('.ayar-menu, .ayarlar .b-yanli').count()) === 0
      && (await p.locator('.ayarlar [data-ayar-ara]').count()) === 1 && (await p.locator('.ayarlar .b-bolum__ust h2[id^="grup-"]').count()) === 7);
    await p.mouse.move(640, 500);
    await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up();
    dene('basılı tutmak halkayı açmaz (masaüstünde yalnız sağ tık ve Ctrl .)', !(await halkaAcik()));
    await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(150);
    const gizli = await p.evaluate(() => document.documentElement.classList.contains('ust-gizli'));
    await p.evaluate(() => scrollTo(0, 800)); await p.waitForTimeout(150);
    const dondu = await p.evaluate(() => !document.documentElement.classList.contains('ust-gizli'));
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150);
    dene('üst çubuk: aşağı kaydırınca gizlenir, yukarı kaydırınca döner, başta görünür', gizli && dondu && !(await p.evaluate(() => document.documentElement.classList.contains('ust-gizli'))), [gizli, dondu]);
    await p.goto(T + '/kabuk/#/ayarlar?grup-hesap'); await p.waitForTimeout(150);
    const gHesap = await p.evaluate(() => { const r = document.getElementById('grup-hesap').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
    await p.goto(T + '/kabuk/#/ayarlar?lifeos.beden.boy'); await p.waitForTimeout(150);
    const gBeden = await p.evaluate(() => !!(document.activeElement && document.activeElement.closest('[data-ayar-satir="lifeos.beden.boy"]')));
    await p.evaluate(() => scrollTo(0, 0));
    await p.goto(T + '/kabuk/#/ayarlar?a%22b'); await p.waitForTimeout(150);
    const gBozuk = await p.locator('.ayarlar #grup-gorunum').count() === 1;
    dene('ayarlar: grup odağı başlığa kaydırır, satır odağı o satırı odaklar, geçersiz odak hata vermez', gHesap && gBeden && gBozuk, JSON.stringify({ gHesap, gBeden, gBozuk }));
    {
      const tc = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', hasTouch: true, isMobile: true }), tp = await tc.newPage();
      await tp.goto(T + '/kabuk/#/alan/tarih');
      await tp.waitForSelector('.asama-ozet');
      const alt = await tp.$$eval('#alt-cubuk a', l => l.map(a => [a.textContent, a.getAttribute('aria-current'), Math.round(a.getBoundingClientRect().height)]));
      dene('telefon: kalıcı alt çubuk 5 yer, Tarih\'te «Öğren» seçili, dokunma hedefi ≥ 44 px; üst sekmeler gizli', alt.length === 5 && alt[1][1] === 'page' && alt.every(x => x[2] >= 44)
        && (await tp.isVisible('#alt-cubuk')) && !(await tp.isVisible('.ust__sekmeler')), JSON.stringify(alt));
      dene('telefon: alan sayfasında sıradaki kartı yok; sıradaki ders listede işaretli, sorular kendiliğinden açılmaz', (await tp.locator('.sira').count()) === 0
        && (await tp.locator('a.b-ders--sira[aria-current="step"]').count()) === 1 && (await tp.locator('form.kapi').count()) === 0);
      await tc.close();
    }
    // ---- Çubuk kesişmesi (2026-11-17, sahip: «dar ekranda seçili sekme arama düğmesinin altına giriyor»): üst ve alt çubukta görünen
    // hiçbir öğe ötekiyle kesişmez, metni kutusundan taşmaz, çubuk ekrandan taşmaz; on genişlik × (varsayılan | piksel yazı + en büyük boy) ----
    {
      const kesisim = () => {
        const gor = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
        const l = [];
        for (const kap of document.querySelectorAll('.ust, .alt-cubuk')) {
          if (!gor(kap)) continue;
          const o = [...kap.querySelectorAll(':scope > :not(.ust__sekmeler), .ust__sekmeler > a, .alt-cubuk > a')].filter(gor);
          for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) {
            const a = o[i].getBoundingClientRect(), b = o[j].getBoundingClientRect();
            if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5) l.push(o[i].className + ' ⨯ ' + o[j].className);
          }
          for (const e of o.concat([...kap.querySelectorAll('.ust__sekme-ad, .alt-cubuk__oge-ad')].filter(gor))) if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 1) l.push('taşma ' + e.className);
          if (kap.getBoundingClientRect().right > innerWidth + 0.5) l.push('ekrandan taşıyor ' + kap.className);
        }
        const at = document.querySelector('.atla').getBoundingClientRect(); if (at.bottom > 0 && document.activeElement !== document.querySelector('.atla')) l.push('«İçeriğe geç» görünüyor');
        return l;
      };
      const bulgu = [];
      for (const [ad, ayar] of [['varsayılan', {}], ['piksel + en büyük', { 'lifeos.yazi': 'piksel', 'lifeos.boyut': 'enbuyuk' }]]) {
        const kc = await b.newContext({ viewport: { width: 1280, height: 800 } });
        await kc.addInitScript(a => { for (const k in a) localStorage.setItem(k, a[k]); }, ayar);
        const kp = await kc.newPage();
        for (const yer of ['bugun', 'ogren', 'alan/tarih']) for (const w of [320, 360, 390, 430, 600, 641, 700, 768, 900, 1024, 1280, 1440]) { // 641 ve 700: eski hatanın göründüğü genişlikler
          await kp.setViewportSize({ width: w, height: 800 }); await kp.goto(T + '/kabuk/#/' + yer + '?w' + w); await kp.waitForSelector('#sayfa[data-ciz] .ust');
          (await kp.evaluate(kesisim)).forEach(x => bulgu.push(ad + ' ' + yer + ' ' + w + ': ' + x));
        }
        await kc.close();
      }
      dene('çubuklar: 320…1440 px, varsayılan ve piksel + en büyük yazıda üst/alt çubukta kesişme, taşma yok', bulgu.length === 0, bulgu.slice(0, 6).join(' | '));
    }
    // ---- Kendi başlıkların (kabuk/konularim.js, 2026-11-18): başlık + konu ekleme, «Başbuğ'la çalış», «Konuya kaydet»; ayrı bağlamda, 390 px ----
    {
      const kc = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' }), kp = await kc.newPage();
      kp.on('pageerror', e => hata.push('konularim: ' + e.message));
      await kp.route('**/api/kabuk/king', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mode: 'model', text: 'Onlu düzen ordunun temelidir.' }) }));
      await kp.goto(T + '/kabuk/#/alan/tarih');
      await kp.waitForSelector('.konularim--bos [data-km-form="baslik"] input');
      dene('kendi başlıkların: boşken tek davetkâr satır', (await kp.locator('.konularim--bos form').count()) === 1 && (await kp.getAttribute('.konularim--bos input', 'placeholder')) === 'Kendi başlığını ekle');
      await kp.fill('[data-km-form="baslik"] input', 'Göktürk ordusu'); await kp.press('[data-km-form="baslik"] input', 'Enter');
      await kp.waitForSelector('.konularim__baslik [data-km-form="konu"] input:focus');
      await kp.keyboard.type('Onlu düzen'); await kp.keyboard.press('Enter');
      await kp.waitForSelector('.konularim__konu a[data-king-konu]');
      const ka = await kp.$eval('.konularim__konu a[data-king-konu]', a => [a.getAttribute('href'), a.getAttribute('data-king-konu'), a.getAttribute('data-alan'), /^[a-z0-9]+$/.test(a.getAttribute('data-king-kid') || '')]);
      dene('kendi başlıkların: başlık ve konu eklenir, kaydedilir; konuda başlıkla birlikte «Başbuğ’la çalış» bağlantısı; 390 px taşma yok',
        JSON.stringify(ka) === JSON.stringify(['#/king', 'Göktürk ordusu › Onlu düzen', 'tarih', true]) && (await kp.textContent('.konularim__ad')) === 'Göktürk ordusu'
        && JSON.parse(await kp.evaluate(() => LIFEOS.Kabuk.Depo.getItem('lifeos.not.konularim'))).tarih[0].konular[0].ad === 'Onlu düzen'
        && !(await kp.evaluate(() => document.documentElement.scrollWidth > innerWidth)), JSON.stringify(ka));
      await kp.click('.konularim__konu a[data-king-konu]');
      await kp.waitForSelector('form[data-king-sohbet]');
      dene('kendi başlıkların: «Başbuğ’la çalış» sohbeti konu bağlamıyla Öğretmen kipinde açar', /Göktürk ordusu › Onlu düzen/.test(await kp.textContent('.king-baglam__ad'))
        && (await kp.getAttribute('[data-king-kip="ogretmen"]', 'aria-pressed')) === 'true');
      await kp.fill('form[data-king-sohbet] [name="metin"]', 'Anlat'); await kp.press('form[data-king-sohbet] [name="metin"]', 'Enter');
      await kp.waitForSelector('[data-king-kaydet]'); await kp.click('[data-king-kaydet]');
      await kp.waitForSelector('[data-king-kaydet][aria-disabled="true"]');
      await kp.goto(T + '/kabuk/#/alan/tarih'); await kp.waitForSelector('.konularim__not');
      dene('kendi başlıkların: «Konuya kaydet» cevabı konunun altına «Başbuğ’un notu» olarak koyar', /Başbuğ’un notu/.test(await kp.textContent('.konularim__not summary'))
        && /Onlu düzen ordunun temelidir/.test(await kp.textContent('.konularim__not-metin')));
      await kp.click('.konularim__duzenle'); await kp.waitForSelector('form[data-king-sohbet]');
      const ist = await kp.inputValue('form[data-king-sohbet] [name="metin"]');
      dene('kendi başlıkların: «Başbuğ düzenlesin» başlığı ve konuları içeren isteği yazma kutusuna koyar (göndermez)', /«Göktürk ordusu»/.test(ist) && /1\. Onlu düzen/.test(ist)
        && /Konu: Göktürk ordusu/.test(await kp.textContent('.king-baglam__ad')), ist.slice(0, 80));
      await kc.close();
    }
    // ---- Konu listeleri (2026-11-17): konu haritası dalları, dal seçimi, Akademik grupları; ayrı bağlamda (seçim öbür adımlara sızmasın) ----
    {
      const TH = JSON.parse(fs.readFileSync(path.join(kok, 'alan/tarih/harita.json'), 'utf8'));
      const hc = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' }), hp = await hc.newPage();
      hp.on('pageerror', e => hata.push('konu: ' + e.message));
      await hp.goto(T + '/kabuk/#/alan/tarih');
      await hp.waitForSelector('.dallar > .b-acilir');
      // 2026-11-18c (sahip: «tek sayfa»): sekme yok; sırayla neredesin kartı, Dersler, Aşamalar, Konu haritası
      dene('alan sayfası tek sayfa: sekme yok; neredesin kartı, Dersler, Aşamalar, Konu haritası sırayla', (await hp.locator('.alan-bolum').count()) === 0
        && JSON.stringify(await hp.$$eval('.govde > .asama-ozet, .govde > .b-bolum > .b-bolum__ust h2', l => l.map(e => e.matches('.asama-ozet') ? 'kart' : e.textContent)))
        === JSON.stringify(['kart', 'Dersler', 'Aşamalar', 'Konu haritası']), JSON.stringify(await hp.$$eval('.govde > .asama-ozet, .govde > .b-bolum > .b-bolum__ust h2', l => l.map(e => e.textContent.slice(0, 20)))));
      const dallar = await hp.$$eval('.dallar > .b-acilir', l => l.map(d => [d.getAttribute('data-dal'), d.open]));
      dene('konu haritası: Tarih\'in dalları dosyadaki sırayla, hepsi kapalı başlar', JSON.stringify(dallar.map(x => x[0])) === JSON.stringify(TH.dallar.map(d => d.id)) && dallar.every(x => !x[1]), JSON.stringify(dallar));
      const ilkBag = TH.dallar[0].bolumler[0].konular.find(k => k.ders), bagsiz = TH.dallar[0].bolumler[0].konular.find(k => !k.ders && !k.unite);
      await hp.click('[data-dal="' + TH.dallar[0].id + '"] > summary');
      dene('konu haritası: derse bağlı konu dersin bağlantısı, bağsız konu «henüz ders yok» + Başbuğ bağlantısı (konu adı, alan)',
        (await hp.locator('[data-dal="' + TH.dallar[0].id + '"] a.konu[href="#/alan/tarih/ders/' + ilkBag.ders + '"]').count()) === 1
        && (await hp.locator('[data-dal="' + TH.dallar[0].id + '"] a[href="#/king"][data-king-konu="' + bagsiz.ad + '"][data-alan="tarih"]').count()) === 1
        && /henüz ders yok/.test(await hp.locator('[data-king-konu="' + bagsiz.ad + '"]').locator('xpath=ancestor::li').textContent()));
      const turk = TH.dallar.find(d => d.id === 'turk') || TH.dallar[1];
      await hp.click('[data-dal="' + turk.id + '"] > summary');
      await hp.click('[data-ac="dal-sec"][data-dal="' + turk.id + '"]');
      await hp.waitForSelector('.dallar > [data-dal="' + turk.id + '"][data-secili]');
      dene('dal seçimi: kaydedilir, seçili dal en üstte açık «Çalıştığın dal», başlığın altında adı',
        (await hp.evaluate(() => LIFEOS.Kabuk.Depo.getItem('lifeos.yol.tarih.dal'))) === JSON.stringify(turk.id) && (await hp.evaluate(() => localStorage.getItem('lifeos.yol.tarih.dal'))) === null && (await hp.getAttribute('.dallar > .b-acilir:first-child', 'data-dal')) === turk.id
        && (await hp.locator('.dallar > .b-acilir:first-child[open]').count()) === 1 && /Çalıştığın dal/.test(await hp.textContent('.dallar > .b-acilir:first-child summary'))
        && (await hp.textContent('.govde .b-baslik')).indexOf(turk.ad) >= 0);
      await hp.reload(); await hp.waitForSelector('.dallar > [data-secili]');
      dene('dal seçimi: yenilemede kalır', (await hp.getAttribute('.dallar > .b-acilir:first-child', 'data-dal')) === turk.id && (await hp.locator('.dallar > details[open]').count()) === 1);
      // seçim kayıttır (IndexedDB + tek depo, cihazlar arası eşitlenir); seçili dalda «Dal seçimini kaldır» var, kaldırınca sayfa seçimsiz döner
      await hp.click('.dallar > [data-secili] [data-ac="dal-birak"]');
      await hp.waitForSelector('.dallar > .b-acilir:not([data-secili]):first-child');
      dene('dal seçimi: kaldırılabilir (kayıt silinir, dallar kapalı, alt başlıkta dal yok)', (await hp.evaluate(() => LIFEOS.Kabuk.Depo.getItem('lifeos.yol.tarih.dal'))) === null
        && (await hp.locator('.dallar > [data-secili]').count()) === 0 && (await hp.locator('.dallar > details[open]').count()) === 0 && !/Çalıştığın dal/.test(await hp.textContent('.govde .b-baslik')));
      await hp.click('[data-dal="' + turk.id + '"] > summary');
      await hp.click('[data-ac="dal-sec"][data-dal="' + turk.id + '"]');
      await hp.waitForSelector('.dallar > [data-dal="' + turk.id + '"][data-secili]');
      await hp.goto(T + '/kabuk/#/bugun');
      await hp.waitForFunction(ad => ((document.querySelector('a[href="#/alan/tarih"]') || {}).textContent || '').indexOf(ad) >= 0, turk.ad, { timeout: 5000 }).catch(() => {});
      dene('dal seçimi: Bugün\'deki Tarih kartının alt başlığı dalın adı', (await hp.textContent('a[href="#/alan/tarih"]')).indexOf(turk.ad) >= 0, await hp.textContent('a[href="#/alan/tarih"]'));
      await hp.goto(T + '/kabuk/#/alan/akademik');
      await hp.waitForSelector('.konu-gruplari');
      const gr = await hp.$$eval('.konu-gruplari .ders-kart', l => l.map(g => [g.closest('.ders-bolum').getAttribute('aria-label'), g.querySelector('.ders-kart__ad').textContent, g.querySelectorAll(':scope .yol > .b-acilir').length, g.open]));
      dene('Akademik: 30 ünite sınava (TYT, AYT) ve derse göre kartlarda (Türkçe 3, Temel Matematik 5 …), ünite adı kısa, yalnız şu anki ders ve ünitesi açık',
        gr.length === 8 && gr[0][0] === 'TYT' && gr[0][1] === 'Türkçe' && gr[0][2] === 3 && gr[1][1] === 'Temel Matematik' && gr[1][2] === 5 && gr[4][0] === 'AYT' && gr.reduce((n, g) => n + g[2], 0) === 30
        && gr.filter(g => g[3]).length === 1 && gr[0][3] && (await hp.textContent('.konu-gruplari .yol > .b-acilir summary .b-acilir__baslik')) === 'Anlam' && (await hp.locator('.yol > details[open]').count()) === 1
        && (await hp.locator('.konu-gruplari [data-grup="simdi"]').count()) === 1, JSON.stringify(gr));
      await hp.click('.ders-kart:not([open]) > summary');
      dene('Akademik: kapalı ders kartı tıklayınca açılır, üniteleri görünür', (await hp.locator('.ders-kart[open]').count()) === 2 && (await hp.locator('.ders-kart[open] .yol > .b-acilir').count()) >= 4);
      await hc.close();
      const tc = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }), tp = await tc.newPage();
      await tp.goto(T + '/kabuk/#/alan/akademik');
      await tp.waitForSelector('.konu-gruplari');
      dene('telefon: Akademik\'te yalnız şu anki ders kartı açık', (await tp.locator('.konu-gruplari details.ders-kart[open]').count()) === 1
        && (await tp.locator('.konu-gruplari details.ders-kart[open][data-grup="simdi"]').count()) === 1);
      await tc.close();
    }
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.b-acilir');
    dene('Felsefe: genel bakış: sıradaki kartı yok; aşamanın özeti tek ilerleme çizgisiyle, sıradaki ders listede işaretli, aşamanın üniteleri altında',
      (await p.locator('.sira').count()) === 0 && (await p.locator('.govde [role=progressbar]').count()) === 1 && (await p.locator('.asama-ozet [role=progressbar]').count()) === 1
      && (await p.textContent('a.b-ders--sira .b-ders__baslik')).indexOf(u1.dersler[0].ad) >= 0 && /Aşama 1/.test(await p.textContent('#asama-ad')));
    // 2026-11-18c: kapılar (sınav) dersler bitmeden görünmez
    dene('Felsefe: üç ünite çizildi; ünite ve aşama kapısı dersler bitmeden görünmez', (await p.locator('.yol > .b-acilir').count()) === y.uniteler.length && (await p.locator('#b-asama-kapisi').count()) === 0
      && (await p.locator('.yol a[href^="#/alan/felsefe/kapi/"]').count()) === 0);
    dene('Felsefe: ikinci ünite kilitli', (await p.locator('.yol > .b-acilir').nth(1).locator('.b-ders--kilitli, .b-satir--kilitli').count()) >= 3);
    dene('Felsefe: eski modül bağlantısı yok (kapanış)', (await p.locator('a[href="/esp/"], a[href*="/dist/"]').count()) === 0);
    await goruntu(p, 'felsefe');

    for (let i = 0; i < u1.dersler.length; i++) {
      const d = u1.dersler[i];
      await p.goto(T + '/kabuk/#/alan/felsefe/ders/' + d.id);
      await p.waitForSelector('article.ders h1');
      dene('ders ' + (i + 1) + ': başlık ve ' + d.metin.length + ' paragraf', (await p.textContent('article.ders h1')) === d.ad && (await p.locator('article.ders > p').count()) >= d.metin.length + 1);
      const a = d.alistirmalar[0], yanlis = harf[(harf.indexOf(a.dogru) + 1) % a.sec.length];
      const soru = p.locator('.b-soru[data-soru="' + a.id + '"]');
      // öğrenme ekranı (2026-11-18c): girişte soru yok, uygulama çubuğu yok; sorular sondaki «Kendini dene» adımında (?dene)
      if (i === 0) dene('ders 1: öğrenme ekranı: soru yok, uygulama sekmeleri yok, sonda «Kendini dene» bağlantısı', (await p.locator('.b-soru').count()) === 0 && (await p.locator('.ust__sekmeler').count()) === 0
        && (await p.getAttribute('a.ders__dene', 'href')) === '#/alan/felsefe/ders/' + d.id + '?dene');
      await p.click('a.ders__dene');
      await p.waitForSelector('.b-soru[data-soru="' + a.id + '"]');
      if (i === 0) {
        // soru adımında hiç cevaplamadan «Bitir»: yumuşak onay çıkar, adres değişmez; «Alıştırmalara dön» soruları geri çizer (2026-11-16b)
        await p.click('[data-ac="okudum"]');
        await p.waitForSelector('.ders__sor');
        dene('ders 1: soru adımında cevaplanmadan «Bitir» önce sorar, geçmez', /henüz cevaplanmadı/.test(await p.textContent('.ders__sor')) && (await p.evaluate(() => location.hash)) === '#/alan/felsefe/ders/' + d.id + '?dene'
          && (await p.locator('[data-ac="okudum"][data-yine]').count()) === 1);
        await p.click('[data-ac="alistirmaya"]');
        await p.waitForSelector('[data-ac="okudum"]:not([data-yine])');
        dene('ders 1: konum satırı Alan › Ünite › Ders n/N', /^Felsefe\s*\/\s*.+\/\s*Ders 1 \/ \d+$/.test((await p.textContent('.konum')).replace(/‹\s*/, '').trim()), await p.textContent('.konum'));
        await soru.locator('[data-h="' + yanlis + '"]').click();
        dene('ders 1: yanlış cevap «Yanlış.» der ve doğruyu işaretler', /Yanlış/.test(await soru.locator('.b-soru__sonuc').textContent()) && (await soru.locator('.b-soru__sik--dogru').getAttribute('data-h')) === a.dogru);
      }
      await soru.locator('[data-h="' + a.dogru + '"]').click();
      dene('ders ' + (i + 1) + ': doğru cevap «Doğru.» der', /Doğru/.test(await soru.locator('.b-soru__sonuc').textContent()));
      if (i === 0) await goruntu(p, 'ders');
      // ders sonu (2026-11-18b): düğmenin üstünde özet (alıştırma k/m doğru) ve sıradaki adımın adı
      if (i === 0 && u1.dersler[1]) dene('ders 1: sonda özet ve sıradaki dersin adı', /Alıştırma 1 \/ \d+ doğru/.test(await p.textContent('.ders__son')) && (await p.textContent('.ders__sonraki')).indexOf(u1.dersler[1].ad) >= 0,
        await p.textContent('.ders__bitir'));
      await bitir(p);
      const beklenen = i < u1.dersler.length - 1 ? '#/alan/felsefe/ders/' + u1.dersler[i + 1].id : '#/alan/felsefe/kapi/' + u1.id;
      await p.waitForFunction(h => location.hash === h, beklenen).catch(() => {});
      dene('ders ' + (i + 1) + ': «Okudum» sıradaki adıma götürür', (await p.evaluate(() => location.hash)) === beklenen, await p.evaluate(() => location.hash));
    }

    await p.waitForSelector('form.kapi');
    await goruntu(p, 'kapi');
    await p.click('form.kapi button[type=submit]');
    await p.waitForSelector('form.kapi .kapi__bos');
    dene('kapı: boş soruyla gönderirken önce sorar («4 soru boş», düğme «Yine de gönder»), sonuç yazılmaz', /4 soru boş/.test(await p.textContent('.kapi__bos'))
      && (await p.textContent('form.kapi button[type=submit]')) === 'Yine de gönder' && (await p.locator('[data-sonuc]').count()) === 0);
    await p.click('form.kapi button[type=submit]');
    await p.waitForSelector('[data-sonuc]');
    dene('kapı: boş deneme geçirmez', /olmadı/.test(await p.textContent('[data-sonuc]')) && /0\/4/.test(await p.textContent('[data-sonuc]')));
    dene('kapıda kalınca: 4 soru Tekrar\'a düştü; kapıda doğru cevap gösterilmez', /4 soru Tekrar'a düştü/.test(await p.textContent('[data-sonuc]'))
      && (await p.locator('a.b-dugme[href="#/motor/tekrar"]').count()) === 1 && (await p.locator('.b-soru__sik--dogru, .b-soru__im').count()) === 0
      && !(await p.textContent('.govde')).includes('doğru cevap:'));
    for (const q of u1.kapi.sorular) await p.check('input[name="' + q.id + '"][value="' + q.dogru + '"]');
    await p.click('form.kapi button[type=submit]');
    await p.waitForSelector('[data-sonuc="gecti"]');
    const metin = await p.textContent('[data-sonuc]');
    dene('kapı: dört doğruyla geçilir, sonuç etiketli', /Geçtin/.test(metin) && /4\/4/.test(metin) && /ölçüldü/.test(metin) && /taslak/.test(metin), metin);
    dene('kapı: «Sıradaki» ikinci ünitenin ilk dersi', (await p.getAttribute('[data-sonuc] .b-dugme--ana', 'href')) === '#/alan/felsefe/ders/' + y.uniteler[1].dersler[0].id);

    await p.reload();
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.b-acilir');
    dene('kayıt yenilemeden sonra duruyor: 3/9 ders', (await ilerleme(p)) === '3/9');
    dene('ikinci ünite açıldı: ilk dersi bağlantı (kapısı dersler bitince), sonraki iki ders kilitli', (await p.locator('.yol > .b-acilir').nth(1).locator('a.b-ders, a.b-satir').count()) === 1 && (await p.locator('.yol > .b-acilir').nth(1).locator('.b-ders--kilitli').count()) === 2);
    // «Son çalıştıkların» (2026-11-18c): okunan dersler en yeni üstte, «bugün okundu» ve alıştırma sonucu
    dene('alan sayfası: «Son çalıştıkların» okunan üç dersi en yeni üstte listeler', (await p.locator('section[aria-labelledby="son-baslik"] li').count()) === 3
      && (await p.textContent('section[aria-labelledby="son-baslik"] li:first-child')).indexOf(u1.dersler[u1.dersler.length - 1].ad) >= 0 && /bugün okundu · alıştırma \d\/\d doğru/.test(await p.textContent('section[aria-labelledby="son-baslik"]')),
      await p.textContent('section[aria-labelledby="son-baslik"]').catch(() => 'yok'));
    await p.goto(T + '/kabuk/#/alan/felsefe/kapi/' + y.id);
    await p.waitForSelector('.b-bos');
    dene('aşama kapısı üniteler bitmeden kilitli', /bütün ünite kapıları/.test(await p.textContent('.b-bos')));
    await p.goto(T + '/kabuk/#/alan/felsefe/ders/yok.boyle');
    await p.waitForSelector('.b-bos');
    dene('bilinmeyen ders açık bir iletiyle karşılanır', /Böyle bir ders yok/.test(await p.textContent('.b-bos')));
    // ---- öteki taşınan alanlar: Tarih, Dil, Akademik ----
    for (const alan of ['tarih', 'dil', 'muzik', 'okuma', 'beslenme', 'hareket', 'uyku', 'tahlil', 'akademik']) {
      const v = JSON.parse(fs.readFileSync(path.join(kok, 'alan', alan, 'asama-1.json'), 'utf8')), d1 = v.uniteler[0].dersler[0];
      await p.goto(T + '/kabuk/#/alan/' + alan);
      // görünüm geçişi bitene kadar ekranda önceki sayfa da durur: yeni sayfa çizilmiş ve geçiş bitmiş olmalı
      await p.waitForFunction(a => document.getElementById('sayfa').getAttribute('data-ciz') === a && !document.documentElement.hasAttribute('data-gecis'), alan);
      await p.waitForSelector('.b-acilir');
      dene(alan + ': yol haritası ' + v.uniteler.length + ' ünite, aşama kapısı henüz görünmez', (await p.locator('.yol > .b-acilir').count()) === v.uniteler.length && (await p.locator('#b-asama-kapisi').count()) === 0);
      // kilitli üniteler kapalı gelir (2026-11-16 sadelik): yeni alanda yalnız üzerinde çalışılan ilk ünite açık
      // Dil'de Göktürk yazısı ünitesi (dil.1.4, 2026-11-18i) önkoşulsuz: ilk üniteyle birlikte o da açık gelir
      dene(alan + ': yalnız ilk ünite (Dil’de bir de Göktürk yazısı) açık gelir', (await p.locator('.yol > details.b-acilir[open]').count()) === (alan === 'dil' ? 2 : 1));
      dene(alan + ': ilk ders listede «sıradaki», ona götürür', (await p.getAttribute('a.b-ders--sira', 'href')) === '#/alan/' + alan + '/ders/' + d1.id);
      await p.click('a.b-ders--sira');
      await p.waitForSelector('article.ders h1');
      dene(alan + ': ilk ders açılır', (await p.textContent('article.ders h1')) === d1.ad);
      const a = d1.alistirmalar.find(x => x.tur === 'secmeli');
      if (a) {
        await p.click('a.ders__dene'); await p.waitForSelector('.b-soru[data-soru="' + a.id + '"]');
        await p.click('.b-soru[data-soru="' + a.id + '"] [data-h="' + a.dogru + '"]');
        dene(alan + ': alıştırma doğru cevabı tanır', /Doğru/.test(await p.textContent('.b-soru[data-soru="' + a.id + '"] .b-soru__sonuc')));
      }
      await bitir(p);
      await p.waitForFunction(h => location.hash !== h, '#/alan/' + alan + '/ders/' + d1.id);
      if (GORUNTU && alan === 'akademik') { await p.goto(T + '/kabuk/#/alan/akademik'); await p.waitForSelector('.b-acilir'); await p.screenshot({ path: path.join(cikti, 'akademik-masaustu-koyu.png') }); }
    }
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.b-acilir');
    dene('alanların kaydı ayrı: Felsefe hâlâ 3/9 ders', (await ilerleme(p)) === '3/9');
    await p.goto(T + '/kabuk/#/alan/akademik');
    await p.waitForSelector('.b-acilir');
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForFunction(() => (document.querySelector('#b-k-alanlar + .b-karsilama__alanlar .b-karsilama__alan, .b-karsilama__alanlar .b-karsilama__alan') || { getAttribute: () => '' }).getAttribute('href') === '#/alan/akademik', null, { timeout: 5000 }).catch(() => {});
    dene('Bugün son çalışılan alanla karşılar (İlerleme\'de Akademik en başta, sıradaki adımıyla)', JSON.stringify(await ilkAlan()).indexOf('#/alan/akademik') >= 0 && /Sıradaki: /.test((await ilkAlan()).metin));
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.b-acilir');

    // ---- Not ----
    p.on('dialog', x => x.accept());
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('[data-arac="not"]');
    dene('not: boş defter öyle der', /Henüz not yok/.test(await p.textContent('#not-liste')));
    dene('not: boş defterde süs yok (örnek kâğıt, tek başına «Hepsi» çipi), araç yokken tek sakin «Yeni araç» satırı', (await p.locator('.not-bos__ornek, .klasor-cip:not(.klasor-cip--ekle)').count()) === 0
      && (await p.locator('#not-liste a').count()) === 0 && (await p.locator('a.arac-ekle[href="#/motor/not/arac/yeni"]').count()) === 1 && (await p.locator('#araclar-baslik').count()) === 0);
    // hızlı not: üstteki kutuya yaz, Ctrl+Enter; ilk satır ad olur, kutu boşalır (sonra silinir: aşağıdaki sayımlar boş defterden)
    await p.fill('.nothizli textarea', 'Hızlı deneme\nikinci satır');
    await p.press('.nothizli textarea', 'Control+Enter');
    await p.waitForFunction(() => /Hızlı deneme/.test(document.getElementById('not-liste').textContent));
    dene('not: hızlı kutu Ctrl+Enter ile kaydeder, ilk satır ad olur, kutu boşalır', (await p.inputValue('.nothizli textarea')) === '' && /Kaydedildi/.test(await p.textContent('.nothizli')));
    await p.evaluate(() => LIFEOS.Kabuk.ic.depo.setItem('lifeos.not.kayit', '[]')); await p.reload(); await p.waitForSelector('#not-liste');
    await p.click('a[href="#/motor/not/yeni"]');
    await p.waitForSelector('form.notform');
    await p.click('form.notform button[type=submit]');
    dene('not: boş not kaydedilmez, nedeni yazılır', /boş not kaydedilmez/.test(await p.textContent('.notform .b-uyari')));
    await p.fill('input[name=baslik]', 'Erdem');
    await p.fill('textarea[name=govde]', 'Erdem bilgi midir? #etik');
    await p.click('form.notform button[type=submit]');
    await p.waitForFunction(() => /^#\/motor\/not\/n\w+$/.test(location.hash) && /Kaydedildi/.test((document.querySelector('.notform .b-uyari') || {}).textContent || ''));
    dene('not: kaydedildi ve kendi adresine geçti', /Kaydedildi/.test(await p.textContent('.notform .b-uyari')));
    const erdem = await p.evaluate(() => location.hash);
    await p.goto(T + '/kabuk/#/motor/not/yeni');
    await p.waitForSelector('select[data-bag-ekle]');
    await p.fill('input[name=baslik]', 'Sokrates');
    await p.fill('textarea[name=govde]', 'Sorarak düşündü. ');
    await p.selectOption('select[data-bag-ekle]', { index: 1 });
    dene('not: bağ ekle gövdeye kimlikli bağ yazar', /\[\[not:n\w+\|Erdem\]\]/.test(await p.inputValue('textarea[name=govde]')), await p.inputValue('textarea[name=govde]'));
    await p.click('form.notform button[type=submit]');
    await p.waitForFunction(h => /^#\/motor\/not\/n\w+$/.test(location.hash) && location.hash !== h, erdem);
    dene('not: «Bu nottaki bağlar» Erdem notuna gider', (await p.getAttribute('[aria-label="Bu nottaki bağlar"] a', 'href')) === erdem);
    await goruntu(p, 'not');
    await p.goto(T + '/kabuk/' + erdem);
    await p.waitForSelector('[aria-label="Bu nota bağlananlar"]');
    dene('not: «Bu nota bağlananlar» Sokrates notunu gösterir', /Sokrates/.test(await p.textContent('[aria-label="Bu nota bağlananlar"]')));
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('#not-liste a.b-satir');
    dene('not: iki not listede', (await p.locator('#not-liste a.b-satir').count()) === 2);
    // 2026-11-17d: satırda ad, metnin ilk satırı (ad tekrar etmez), etiket çipi ve kısa tarih; hızlı kutu boşken tek satır
    dene('not: satır özeti, #etik çipi ve tarih; hızlı kutu boşken tek satır', await p.evaluate(() => { const a = [...document.querySelectorAll('#not-liste a.notsatir')].find(x => /Erdem/.test(x.querySelector('.b-satir__ad').textContent));
      return !!a && a.querySelector('.b-satir__not').textContent === 'Erdem bilgi midir?' && /#etik/.test(a.querySelector('.notsatir__cipler').textContent) && !!a.querySelector('time.notsatir__tarih')
        && document.querySelector('.nothizli textarea').getBoundingClientRect().height < 60; }));
    await p.fill('[data-not-ara]', 'sokr');
    dene('not: arama «sokr» tek notu bulur', (await p.locator('#not-liste a.b-satir').count()) === 1 && /Sokrates/.test(await p.textContent('#not-liste')));
    await p.fill('[data-not-ara]', '#etik');
    dene('not: «#etik» etiketli notu süzer', (await p.locator('#not-liste a.b-satir').count()) === 1 && /Erdem/.test(await p.textContent('#not-liste')));
    await p.reload();
    await p.waitForSelector('#not-liste a.b-satir');
    dene('not: yenilemeden sonra iki not duruyor', (await p.locator('#not-liste a.b-satir').count()) === 2);
    // not ağı: iki düğüm, bir bağ; düğüm klavyeyle (Sekme + Enter) notu açar
    dene('not ağı: iki düğüm ve Sokrates→Erdem bağı çizildi', (await p.locator('[data-not-ag] svg a').count()) === 2 && (await p.locator('[data-not-ag] line.b-ag__duz').count()) === 1);
    await p.focus('[data-not-ag] svg a[aria-label^="Erdem"]');
    await p.keyboard.press('Enter');
    await p.waitForFunction(h => location.hash === h, erdem);
    dene('not ağı: düğüm klavyeyle açılır', (await p.inputValue('input[name=baslik]')) === 'Erdem');
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('[data-not-ag] svg');
    await goruntu(p, 'not-agi');
    await goruntu(p, 'yer-7-not-agi', { yalniz: YER });

    // ---- Not klasörleri (2026-11-18k): aç, hızlı notu klasöre yaz, notu taşı, klasörde ara, yeniden adlandır, sil (notlar kalır) + geri al ----
    const notYedek = await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.not.kayit'));
    const notKl = () => p.evaluate(() => JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.not.kayit')).map(n => n.klasor).sort().join('|'));
    await p.click('.klasor-yeni summary');
    await p.fill('.klasor-yeni input[name=klasorAd]', ' Felsefe ');
    await p.press('.klasor-yeni input[name=klasorAd]', 'Enter');
    // adres değişince ekran bir sonraki olayda çizilir: seçili çip ve boş metin gelene dek beklenir (CI'da yavaş makine kararsızlığı, 2026-11-19)
    await p.waitForFunction(() => { const c = document.querySelector('.klasor-cip[aria-current="page"]'), l = document.getElementById('not-liste');
      return location.hash === '#/motor/not?klasor=Felsefe' && c && /Felsefe/.test(c.textContent) && l && /Bu klasörde not yok/.test(l.textContent); }, null, { timeout: 5000 }).catch(() => {});
    dene('klasör: yeni klasör açılır, adreste seçili, boşken öyle der', /Bu klasörde not yok/.test(await p.textContent('#not-liste'))
      && /Felsefe\s*0/.test(await p.textContent('.klasor-cip[aria-current="page"]')));
    await p.fill('.nothizli textarea', 'Klasörde hızlı');
    await p.press('.nothizli textarea', 'Control+Enter');
    await p.waitForFunction(() => /Klasörde hızlı/.test(document.getElementById('not-liste').textContent));
    dene('klasör: seçili klasörde hızlı not o klasöre girer', (await notKl()) === '||Felsefe', await notKl());
    await p.goto(T + '/kabuk/' + erdem);
    await p.waitForSelector('form.notform input[name=klasor]');
    await p.fill('form.notform input[name=klasor]', 'Felsefe');
    await p.press('form.notform textarea[name=govde]', 'Control+Enter');
    await p.waitForFunction(() => /Kaydedildi/.test((document.querySelector('.notform .b-uyari') || {}).textContent || ''));
    dene('klasör: not düzenlenirken klasöre taşınır (Ctrl+Enter kaydeder), kırıntı klasörü gösterir', (await notKl()) === '|Felsefe|Felsefe'
      && (await p.locator('a.kirinti[href="#/motor/not?klasor=Felsefe"]').count()) === 1, await notKl());
    await p.goto(T + '/kabuk/#/motor/not?klasor=Felsefe');
    await p.waitForSelector('#not-liste a.notsatir');
    dene('klasör: klasör içinde yalnız onun notları', (await p.locator('#not-liste a.notsatir').count()) === 2 && !/Sokrates/.test(await p.textContent('#not-liste')));
    await p.fill('[data-not-ara]', 'sokr');
    dene('klasör: arama klasörün içinde kalır', /uyan not yok/.test(await p.textContent('#not-liste')));
    await goruntu(p, 'not-klasor');
    await p.click('.klasor-adlandir summary');
    await p.fill('.klasor-adlandir input[name=klasorAd]', 'Düşünceler');
    await p.press('.klasor-adlandir input[name=klasorAd]', 'Enter');
    await p.waitForFunction(() => decodeURIComponent(location.hash) === '#/motor/not?klasor=Düşünceler');
    dene('klasör: yeniden adlandırılınca notlar yeni adda', (await notKl()) === '|Düşünceler|Düşünceler', await notKl());
    await p.click('[data-arac-ac="klasor-sil"]');
    await p.waitForFunction(() => location.hash === '#/motor/not' && !!document.querySelector('[data-geri-al]'));
    dene('klasör: silinince notlar silinmez, Klasörsüz’e düşer; «Geri al» görünür', (await notKl()) === '||' && /2 not Klasörsüz/.test(await p.textContent('[data-geri-al]')), await notKl());
    await p.click('[data-geri-al] [data-arac-ac="geri-al"]');
    await p.waitForFunction(() => /Geri alındı/.test((document.querySelector('[data-geri-al]') || {}).textContent || ''));
    dene('klasör: geri al klasörü ve notlarını geri getirir', (await notKl()) === '|Düşünceler|Düşünceler' && (await p.locator('.klasor-cip[href="#/motor/not?klasor=D%C3%BC%C5%9F%C3%BCnceler"]').count()) === 1, await notKl());
    await p.evaluate(v => { LIFEOS.Kabuk.ic.depo.setItem('lifeos.not.kayit', v); LIFEOS.Kabuk.ic.depo.removeItem('lifeos.not.klasorler'); }, notYedek); // sonraki denetimler iki klasörsüz notla sürer
    await p.goto(T + '/kabuk/#/motor/not'); await p.reload(); await p.waitForSelector('#not-liste a.b-satir');

    // ---- Sisteme not: «Yeni araç», Başbuğ okuma izni varsayılan kapalı; kapalı aracın notu Başbuğ süzgecinden geçmez ----
    await p.click('a[href="#/motor/not/arac/yeni"]');
    await p.waitForSelector('form.aracform');
    dene('sisteme not: «Başbuğ okuyabilsin» varsayılan kapalı', !(await p.isChecked('form.aracform input[name=kingOkur]')));
    await p.click('form.aracform button[type=submit]');
    await p.waitForFunction(() => /adı yazılmalı/.test(document.querySelector('.aracform .b-uyari').textContent));
    dene('sisteme not: adsız araç motorun cümlesiyle reddedilir', true);
    await p.fill('form.aracform input[name=ad]', 'Düşünce defteri');
    await p.check('form.aracform input[name=gorunum][value=ag]');
    await p.fill('form.aracform textarea[name=anlam]', 'Aklıma gelen fikirleri buraya atıyorum.');
    await p.fill('form.aracform textarea[name=kullanim]', 'Yalnız birbirine bağlamak için oku, hakkımda çıkarım yapma.');
    await goruntu(p, 'sisteme-not-form');
    await p.click('form.aracform button[type=submit]');
    await p.waitForSelector('[data-arac-sayfa] [data-sistemnot]');
    const aracHash = await p.evaluate(() => location.hash);
    dene('sisteme not: araç sayfası notu ve «Başbuğ okumaz» gösterir', /Başbuğ okumaz/.test(await p.textContent('[data-sistemnot]')) && /hakkımda çıkarım yapma/.test(await p.textContent('[data-sistemnot]')), await p.textContent('[data-sistemnot]'));
    await p.click('a[href^="#/motor/not/yeni?arac="]');
    await p.waitForSelector('form.notform input[name=klasor]', { state: 'attached' });
    dene('sisteme not: araçta yeni not aracın adını ve iznini söyler', /Araç: Düşünce defteri · Başbuğ okumaz/.test(await p.textContent('form.notform')));
    await p.fill('input[name=baslik]', 'Kader');
    await p.fill('textarea[name=govde]', 'Kader ve çaba üzerine bir fikir.');
    await p.click('form.notform button[type=submit]');
    await p.waitForFunction(() => /^#\/motor\/not\/n\w+$/.test(location.hash));
    const kral = () => p.evaluate(() => { const N = LIFEOS.Motor.Not, l = JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.not.kayit')), a = JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.not.araclar'));
      return { klasor: l.find(n => n.baslik === 'Kader').klasor, okur: N.kingOkur(l, { araclar: a }).map(n => n.baslik), sistem: N.kingAraclar(a).length }; });
    let kr = await kral();
    dene('sisteme not: not aracın klasöründe; Başbuğ süzgeci onu ve sistem notunu dışarıda bırakır', kr.klasor === 'Düşünce defteri' && kr.okur.indexOf('Kader') < 0 && kr.okur.indexOf('Erdem') >= 0 && kr.sistem === 0, JSON.stringify(kr));
    await p.goto(T + '/kabuk/' + aracHash);
    await p.waitForSelector('[data-arac-sayfa] .b-liste a.b-satir');
    dene('sisteme not: araç sayfasında notu listelenir', /Kader/.test(await p.textContent('[data-arac-sayfa] .b-liste')));
    await goruntu(p, 'sisteme-not');
    await p.click('a[href$="/duzenle"]');
    await p.waitForSelector('form.aracform');
    dene('sisteme not: düzenlerken klasör değişmez (salt okunur)', (await p.getAttribute('form.aracform input[name=klasor]', 'readonly')) !== null);
    await p.check('form.aracform input[name=kingOkur]');
    await p.click('form.aracform button[type=submit]');
    await p.waitForFunction(() => /Başbuğ okur/.test((document.querySelector('[data-sistemnot]') || {}).textContent || ''));
    kr = await kral();
    dene('sisteme not: izin açılınca Başbuğ notu ve sistem notunu okur', kr.okur.indexOf('Kader') >= 0 && kr.sistem === 1, JSON.stringify(kr));
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('[aria-labelledby="araclar-baslik"] a.b-satir');
    dene('sisteme not: Not sayfasında araç, not sayısı ve Başbuğ izniyle listelenir', /Düşünce defteri.*1 not.*Başbuğ okur/.test((await p.textContent('[aria-labelledby="araclar-baslik"]')).replace(/\s+/g, ' ')));

    // ---- Tekrar ----
    await p.goto(T + '/kabuk/#/motor/tekrar');
    await p.waitForSelector('form.kartform');
    // kapıda kalınan taslak sorular varken boş sıra «kart yok» demez, onları gösterir (araclar.js, 2026-11-16b içerik paketi)
    dene('tekrar: kartsız açılış öyle der (sıra boş; kapıda kalınan sorular aşağıda)', /Bugün tekrar sırası boş/.test(await p.textContent('[data-arac="tekrar"]')));
    // kapıda kalınan dört soru: taslak olduğu için kuyruğa girmez, kendi listesinde kaynağıyla; açılınca doğru cevap
    const kk = u1.kapi.sorular[0];
    dene('kapıda kalınca: Tekrar\'da 4 kart, kaynağı «Felsefe · ' + u1.ad + ' kapısı», tekilleşmiş', (await p.locator('[data-kapi-kartlari] .b-acilir').count()) === 4
      && (await p.textContent('[data-kapi-kartlari]')).includes('Felsefe · ' + u1.ad + ' kapısı') && /taslak/.test(await p.textContent('[data-kapi-kartlari]')),
      await p.textContent('[data-kapi-kartlari]').catch(() => 'liste yok'));
    await p.click('[data-kapi-kartlari] summary >> nth=0');
    dene('kapıda kalınca: kart açılınca doğru cevap görünür', (await p.textContent('[data-kapi-kartlari] details[open] p')) === kk.sec[harf.indexOf(kk.dogru)]);
    await p.click('form.kartform button[type=submit]');
    dene('tekrar: boş kart eklenmez', /iki yüzü de dolu/.test(await p.textContent('.kartform .b-uyari')));
    await p.fill('input[name=on]', 'Arkhe nedir?');
    await p.fill('textarea[name=arka]', 'Evrenin ilk maddesi.');
    await p.click('form.kartform button[type=submit]');
    await p.waitForSelector('.b-kart');
    dene('tekrar: kartın önü görünür, arkası gizli', /Arkhe/.test(await p.textContent('.b-kart__on')) && (await p.locator('.b-kart__arka').count()) === 0);
    await p.click('[data-arac-ac="kart-goster"]');
    await p.waitForSelector('.b-kart__arka');
    dene('tekrar: cevap ve dört not düğmesi aralıklarıyla', /ilk maddesi/.test(await p.textContent('.b-kart__arka')) && (await p.locator('.b-kart__not').count()) === 4 && /şimdi/.test(await p.textContent('.b-kart__not >> nth=0')) && /gün/.test(await p.textContent('.b-kart__not >> nth=2')));
    await goruntu(p, 'tekrar');
    await p.click('[data-arac-ac="kart-not"][data-not="1"]');
    await p.waitForSelector('[data-arac-ac="kart-goster"]');
    dene('tekrar: «Yine» kartı aynı gün yeniden sorar', /Arkhe/.test(await p.textContent('.b-kart__on')));
    await p.click('[data-arac-ac="kart-goster"]');
    await p.click('[data-arac-ac="kart-not"][data-not="3"]');
    await p.waitForSelector('[data-sonuc="gecti"]');
    dene('tekrar: «İyi» sonrası bugünlük biter, iki cevap sayılır', /Bugünlük bitti/.test(await p.textContent('[data-sonuc]')) && /2 cevap/.test(await p.textContent('[data-sonuc]')));
    await p.click('[data-arac="tekrar"] .b-acilir summary');
    dene('tekrar: kart listesinde hatırlama tahmin etiketli', /\(tahmin\)/.test(await p.textContent('[aria-label="Kartlar"]')));
    await p.click('[data-arac-ac="kart-sil"]');
    await p.waitForFunction(() => /Bugün tekrar sırası boş/.test(document.querySelector('[data-arac="tekrar"]').textContent));
    dene('tekrar: kart silinir', true);

    // ---- Kayıt ----
    await p.goto(T + '/kabuk/#/motor/kayit');
    await p.waitForSelector('form.kayitform');
    dene('kayıt: boş gün öyle der, sıfır göstermez', /Bugün için kayıt yok/.test(await p.textContent('[data-arac="kayit"]')));
    dene('kayıt: kural bölümü eksik profili adıyla söyler, sayı uydurmaz', /Enerji hedefi için eksik: .*boy/.test(await p.textContent('[data-kural]'))
      && !/kcal/.test(await p.textContent('[data-kural]')));
    await p.fill('input[name=ml]', '99999');
    await p.click('form.kayitform button[type=submit]');
    dene('kayıt: sınır dışı sayı motorun cümlesiyle reddedilir, yazılan durur', /1 ile 8000 ml/.test(await p.textContent('.kayitform .b-uyari')) && (await p.inputValue('input[name=ml]')) === '99999');
    await p.fill('input[name=ml]', '500');
    await p.click('form.kayitform button[type=submit]');
    await p.waitForSelector('[aria-label="Gün özeti"] li');
    dene('kayıt: su toplamı özetinde «hesaplandı», kaydın kendisi «ölçüldü» etiketiyle', /500 ml/.test(await p.textContent('[aria-label="Gün özeti"]')) && /hesaplandı/.test(await p.textContent('[aria-label="Gün özeti"]')) && /500 ml \(ölçüldü\)/.test(await p.textContent('[aria-label="Kayıtlar"]')));
    await p.selectOption('select[data-kayit-tur]', 'uyku');
    await p.waitForSelector('input[name=saat]');
    await p.fill('input[name=saat]', '7,5');
    await p.check('input[name=tahmin]');
    await p.click('form.kayitform button[type=submit]');
    await p.waitForFunction(() => /Gece uykusu/.test(document.querySelector('[aria-label="Gün özeti"]').textContent));
    dene('kayıt: tahmin işaretli uyku «tahmin» etiketiyle', /7,5 saat/.test(await p.textContent('[aria-label="Gün özeti"]')) && /tahmin/.test(await p.textContent('[aria-label="Gün özeti"]')));
    dene('kayıt: uyku girilince günün antrenman kararı etiketli', /Bugünkü antrenman/.test(await p.textContent('[data-kural]')) && /hesaplandı/.test(await p.textContent('[data-kural]')));
    await p.goto(T + '/kabuk/#/ayarlar');
    await p.waitForSelector('[data-ayar-satir="lifeos.beden.boy"] input');
    await p.fill('[data-ayar-satir="lifeos.beden.boy"] input', '165');
    await p.fill('[data-ayar-satir="lifeos.beden.dogumYili"] input', '1990');
    await p.click('[data-ayar-satir="lifeos.beden.cinsiyet"] [data-deger="kadin"]');
    await p.fill('[data-ayar-satir="lifeos.beden.boy"] input', '999');
    await p.dispatchEvent('[data-ayar-satir="lifeos.beden.boy"] input', 'change');
    dene('ayarlar: Beden › boy aralık dışını yazmaz, alanı geçersiz işaretler', (await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.beden.boy'))) === '165'
      && (await p.getAttribute('[data-ayar-satir="lifeos.beden.boy"] input', 'aria-invalid')) === 'true');
    const grupSay = await p.evaluate(() => LIFEOS.Kabuk.Ayar.GRUPLAR.length);
    dene('ayarlar: yanlı düzende grup gezinmesi (her grup bir bağlantı, bölümü bulunur)', (await p.locator('.b-yanli--sol nav.b-gezinme[aria-label="Ayar grupları"] a.b-gezinme__oge').count()) === grupSay
      && (await p.$$eval('nav.b-gezinme a', l => l.every(a => document.getElementById(a.getAttribute('href').split('?')[1])))), grupSay);
    await p.goto(T + '/kabuk/#/ayarlar');
    await p.waitForSelector('nav.b-gezinme');
    await goruntu(p, 'ayarlar');
    { // 2026-11-18 (tur-20261118/ekranlar.md): telefonda tercih seçici sarınca hap biçimli yumağa dönüyor, «Yazı tipi» kesiliyordu
      const bulgu = [];
      for (const w of [320, 390]) {
        await p.setViewportSize({ width: w, height: 800 });
        bulgu.push(...await p.evaluate(w => [...document.querySelectorAll('.b-ayar .b-tercih')].flatMap(t => {
          const k = t.getBoundingClientRect(), a = t.closest('.b-ayar').getBoundingClientRect(), sec = [...t.children], ad = w + ' ' + t.getAttribute('aria-labelledby');
          const satir = new Set(sec.map(s => Math.round(s.getBoundingClientRect().top))).size;
          return [k.left < a.left - .5 || k.right > a.right + .5 ? ad + ' kutudan taşar' : '', satir > 1 && parseFloat(getComputedStyle(t).borderTopLeftRadius) > 24 ? ad + ' çok satırlı hap' : '']
            .concat(sec.map(s => { const q = s.getBoundingClientRect(); return q.left < k.left - .5 || q.right > k.right + .5 || s.scrollWidth > s.clientWidth + 1 ? ad + ' «' + s.textContent + '» kesik' : ''; })).filter(Boolean);
        }), w));
      }
      dene('ayarlar: 320/390 px\'te hiçbir tercih seçicisi kutusundan taşmaz, seçenek kesilmez, sarınca hap olmaz', bulgu.length === 0, bulgu.slice(0, 5).join(' | '));
      await p.setViewportSize({ width: 1280, height: 800 });
    }
    await p.goto(T + '/kabuk/#/motor/kayit');
    await p.waitForSelector('select[data-kayit-tur]');
    await p.selectOption('select[data-kayit-tur]', 'kilo');
    await p.waitForSelector('input[name=kg]');
    await p.fill('input[name=kg]', '60');
    await p.click('form.kayitform button[type=submit]');
    await p.waitForFunction(() => /Enerji hedefi/.test(document.querySelector('[data-kural]').textContent));
    dene('kayıt: profil ve tartı varken enerji hedefi ve bazal hesaplanır (kadın 60 kg 165 cm 36 yaş: bazal 1290)',
      /Bazal metabolizma\s*1290 kcal/.test((await p.textContent('[data-kural]')).replace(/\s+/g, ' ')));
    await p.click('[data-arac-ac="kayit-sil"][aria-label^="Kaydı sil: Kilo"]');            // aşağıdaki iki kayıt akışı aynen sürsün
    await p.waitForFunction(() => document.querySelectorAll('[aria-label="Kayıtlar"] li').length === 2);
    await goruntu(p, 'kayit');
    await p.reload();
    await p.waitForSelector('[aria-label="Kayıtlar"] li');
    dene('kayıt: yenilemeden sonra iki kayıt duruyor', (await p.locator('[aria-label="Kayıtlar"] li').count()) === 2);
    await p.click('[data-arac-ac="kayit-sil"] >> nth=0');
    await p.waitForFunction(() => document.querySelectorAll('[aria-label="Kayıtlar"] li').length === 1);
    dene('kayıt: kayıt silinir, özet güncellenir', !/Gece uykusu/.test(await p.textContent('[aria-label="Gün özeti"]')));
    // geçmiş güne kayıt: motorun penceresi (bugün + 7 gün geri), gelecek yok
    const kGunler = await p.$$eval('select[data-kayit-gun] option', o => o.map(x => x.value));
    const bugunK = await p.evaluate(() => { const d = new Date(), i = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + i(d.getMonth() + 1) + '-' + i(d.getDate()); });
    dene('kayıt: gün seçiminde bugün ve 7 gün geri var, gelecek yok', kGunler.length === 8 && kGunler[0] === bugunK && kGunler.every(g => g <= bugunK), kGunler.join(','));
    await p.selectOption('select[data-kayit-tur]', 'su');
    await p.waitForSelector('input[name=ml]');
    await p.fill('input[name=ml]', '300');
    await p.selectOption('select[data-kayit-gun]', kGunler[1]);
    await p.waitForFunction(() => /Dün/.test(document.querySelector('[data-arac="kayit"] section h2').textContent));
    dene('kayıt: gün değişince yazılan sayı kalır, özet o güne geçer', (await p.inputValue('input[name=ml]')) === '300' && /Dün için kayıt yok/.test(await p.textContent('[data-arac="kayit"]')));
    await p.click('form.kayitform button[type=submit]');
    await p.waitForFunction(() => /Kaydedildi \(Dün\)/.test(document.querySelector('.kayitform .b-uyari').textContent));
    dene('kayıt: düne kayıt yazıldı, özeti dünün', /300 ml/.test(await p.textContent('[aria-label="Gün özeti"]')));
    await p.click('a[href="#/motor/kayit/hafta"]');
    await p.waitForSelector('[data-kayit-hafta] .b-tablo table');
    const suSatir = await p.$$eval('[data-kayit-hafta] .b-tablo tbody tr', tr => tr.map(r => [...r.children].map(c => c.textContent.trim())).find(r => /^Su/.test(r[0])));
    dene('kayıt haftası: su satırında dün 300, bugün 500 (etiket ekran okuyucuya da), boş günler nokta (sıfır değil)', !!suSatir && suSatir[6] === '300 hesaplandı' && suSatir[7] === '500 hesaplandı' && suSatir.slice(1, 6).every(x => x === '·veri yok'), JSON.stringify(suSatir));
    dene('kayıt haftası: satır etiketi ve haftanın toplamı etiketli', /hesaplandı/.test(suSatir && suSatir[0]) && /400 ml · 2 günün ortalaması\s*hesaplandı/.test(await p.textContent('[aria-label="Haftanın toplamı"]')));
    dene('kayıt haftası: toparlanma ve yük motorun cümlesiyle (antrenman kaydı yok)', /Henüz antrenman kaydı yok/.test(await p.textContent('[data-yuk]')) && /Toparlanma puanı|toparlanma için kayıt yok/.test(await p.textContent('[data-yuk]')), await p.textContent('[data-yuk]'));
    await goruntu(p, 'kayit-hafta');

    // ---- Plan ----
    await p.goto(T + '/kabuk/#/motor/plan');
    await p.waitForSelector('[data-arac="plan"]');
    dene('plan: boş zaman yokken önce onu ister', /Önce boş zamanını yaz/.test(await p.textContent('[data-arac="plan"]')) && (await p.locator('[data-arac-ac="plan-kur"]').count()) === 0);
    await p.fill('form[data-plan="aralik"] input[name=bas]', '12:00');
    await p.fill('form[data-plan="aralik"] input[name=bit]', '09:00');
    await p.click('form[data-plan="aralik"] button[type=submit]');
    dene('plan: ters aralık motorun cümlesiyle reddedilir', /başlamadan bitiyor/.test(await p.textContent('[data-arac="plan"] .b-uyari--hata')));
    await p.fill('form[data-plan="aralik"] input[name=bas]', '09:00');
    await p.fill('form[data-plan="aralik"] input[name=bit]', '12:00');
    await p.click('form[data-plan="aralik"] button[type=submit]');
    await p.waitForSelector('[data-arac-ac="plan-kur"]');
    await p.fill('form[data-plan="is"] input[name=ad]', 'Rapor');
    await p.fill('form[data-plan="is"] input[name=dk]', 'abc');
    await p.click('form[data-plan="is"] button[type=submit]');
    dene('plan: süresi sayı olmayan iş reddedilir', /süresi 1–720 dakika/.test(await p.textContent('[data-arac="plan"] .b-uyari--hata')));
    await p.fill('form[data-plan="is"] input[name=ad]', 'Rapor');
    await p.fill('form[data-plan="is"] input[name=dk]', '30');
    await p.click('form[data-plan="is"] button[type=submit]');
    await p.waitForSelector('[data-arac-ac="plan-is-sil"]');
    await p.click('[data-arac-ac="plan-kur"]');
    await p.waitForSelector('[aria-label="Bugünün blokları"] [data-blok]');
    const blokMetni = await p.textContent('[aria-label="Bugünün blokları"]');
    dene('plan: iş 09:00\'da, dersler ve mola ardından yerleşir', /09:00–09:30/.test(blokMetni) && /Rapor/.test(blokMetni) && /Mola/.test(blokMetni) && (await p.locator('[data-blok="ders"]').count()) >= 1, blokMetni.slice(0, 200));
    dene('plan: özet etiketli (hesaplandı)', /Planlanan \d+ dk \(hesaplandı\)/.test(await p.textContent('[data-arac="plan"]')));
    await goruntu(p, 'plan');
    await p.click('[data-blok="is"] [data-durum="atlandi"]');
    dene('plan: nedensiz atlama motorun cümlesiyle reddedilir', /neden yazılmalı/.test(await p.textContent('[data-arac="plan"] .b-uyari--hata')));
    await p.click('[data-blok="is"] [data-durum="yapildi"]');
    await p.waitForSelector('[data-blok="is"]:not([data-blok-durum="bekliyor"])');
    dene('plan: «Yapıldı» bloğu işaretler', /yapıldı/.test(await p.textContent('[data-blok="is"]')));
    await p.click('[data-arac-ac="plan-kur"]');
    await p.waitForSelector('[data-blok="is"]:not([data-blok-durum="bekliyor"])');
    dene('plan: yeniden kurunca yapılan blok yerinde kalır', /09:00–09:30/.test(await p.textContent('[data-blok="is"]')));
    await p.reload();
    await p.waitForSelector('[aria-label="Bugünün blokları"] [data-blok]');
    dene('plan: yenilemeden sonra plan duruyor', (await p.locator('[data-blok="is"]:not([data-blok-durum="bekliyor"])').count()) === 1);
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('.b-karsilama__plan');
    dene('Bugün: günün planı saatli satırlar, yapılan blok «tamamlandı», «Planı aç» plana götürür', /^\d\d:\d\d$/.test(await p.textContent('.b-karsilama__blok .b-karsilama__saat'))
      && (await p.locator('.b-karsilama__blok--bitti').count()) >= 1 && (await p.getAttribute('#b-k-plan + .b-karsilama__tumu', 'href')) === '#/motor/plan', await p.textContent('.b-karsilama__plan'));

    // ---- Hafta planı ve sabit bloklar (şablon bir kez yazılır, her güne girer) ----
    await p.goto(T + '/kabuk/#/motor/plan');
    await p.click('a[href="#/motor/plan/hafta"]');
    await p.waitForSelector('[data-hafta] [data-gun]');
    dene('hafta: bugünden yedi gün çizildi, ilki «bugün»', (await p.locator('[data-gun]').count()) === 7 && /bugün/.test(await p.textContent('[data-gun] >> nth=0')));
    await p.waitForSelector('.hafta [data-blok="ders"]');
    // bugünün sütunu Gün sayfasındaki planın kendisi (araclar.js bugunPlani, içerik paketi 2026-11-16): «Rapor» yalnız bugünde, öbür günlere girmez
    const haftaGun = await p.locator('[data-gun]').allTextContents();
    dene('hafta: bugünün sütunu Gün planı («Rapor» orada), öbür günlere girmez; sıradaki ders öngörüde; özet etiketli', /Rapor/.test(haftaGun[0]) && haftaGun.slice(1).every(x => !/Rapor/.test(x))
      && /planlanan \d+ dk \(hesaplandı\)/.test(await p.textContent('[data-hafta]')), haftaGun.map(x => x.slice(0, 50)).join(' | '));
    await p.fill('form[data-plan="sabit"] input[name=bas]', '10:00');
    await p.fill('form[data-plan="sabit"] input[name=bit]', '11:00');
    await p.click('form[data-plan="sabit"] button[type=submit]');
    dene('hafta: adsız sabit blok reddedilir', /adı yazılmalı/.test(await p.textContent('[data-hafta] .b-uyari--hata')));
    await p.fill('form[data-plan="sabit"] input[name=ad]', 'Okul');
    await p.fill('form[data-plan="sabit"] input[name=bas]', '10:00');
    await p.fill('form[data-plan="sabit"] input[name=bit]', '11:00');
    await p.click('form[data-plan="sabit"] button[type=submit]');
    await p.waitForSelector('[data-arac-ac="plan-sabit-sil"]');
    await p.fill('form[data-plan="sabit"] input[name=ad]', 'Uyku');
    await p.fill('form[data-plan="sabit"] input[name=bas]', '23:00');
    await p.fill('form[data-plan="sabit"] input[name=bit]', '07:00');
    for (const g of ['5', '6']) await p.check('form[data-plan="sabit"] input[name=gun][value="' + g + '"]');
    await p.click('form[data-plan="sabit"] button[type=submit]');
    await p.waitForFunction(() => document.querySelectorAll('[data-arac-ac="plan-sabit-sil"]').length === 2);
    const gunMetni = await p.locator('[data-gun]').allTextContents();
    // bugünkü sütun önceden kurulmuş Gün planıdır (şablon onu değiştirmez); öbür altı günde okul yalnız hafta içine, uyku her güne girer
    const haftaIci = x => !/Cumartesi|Pazar(?!tesi)/.test(x); // «Cuma» «Cumartesi»nin içinde de geçer
    const gunTamam = x => /Okul/.test(x) === haftaIci(x) && /23:00–24:00\s*Uyku/.test(x) && /00:00–07:00\s*Uyku/.test(x);
    dene('hafta: okul yalnız hafta içi günlere, uyku her güne girdi (bugün hariç: kurulu plan)', gunMetni.slice(1).every(gunTamam), gunMetni.slice(1).filter(x => !gunTamam(x)).join(' | '));
    dene('hafta: gece yarısını geçen blok listede işaretli', /gece yarısını geçer/.test(await p.textContent('[data-hafta] [aria-label="Sabit bloklar"]')));
    await p.reload();
    await p.waitForSelector('[data-arac-ac="plan-sabit-sil"]');
    dene('hafta: şablon yenilemeden sonra duruyor', (await p.locator('[data-arac-ac="plan-sabit-sil"]').count()) === 2);
    await goruntu(p, 'hafta');
    await p.click('[data-arac-ac="plan-sabit-sil"][aria-label="Sabit bloğu sil: Okul"]');
    await p.waitForFunction(() => document.querySelectorAll('[data-arac-ac="plan-sabit-sil"]').length === 1);
    dene('hafta: sabit blok silinir, günlerden çıkar', !/Okul/.test(await p.textContent('.hafta')));

    // ---- Soru: karma test (etkin alan Felsefe) ----
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.b-acilir');
    await p.goto(T + '/kabuk/#/motor/soru');
    await p.waitForSelector('[data-arac-ac="soru-basla"]');
    dene('soru: başlangıçta alan ve havuz yazılı', /Felsefe · karma test/.test(await p.textContent('[data-arac="soru"]')) && /karışık \d+ soru/.test(await p.textContent('[data-arac="soru"]')));
    await p.click('[data-arac-ac="soru-basla"]');
    await p.waitForSelector('.b-soru[data-sira="0"]');
    const felsefeSorular = {};
    y.uniteler.forEach(u => u.dersler.forEach(dd => dd.alistirmalar.forEach(a => { felsefeSorular[a.soru] = a; })));
    const soruMetni = async () => felsefeSorular[await p.textContent('.b-soru legend')];
    let sq = await soruMetni();
    await p.click('[data-arac-ac="soru-cevap"][data-h="' + sq.dogru + '"]');
    dene('soru: doğru cevap «Doğru.» der, şıklar kilitlenir', /Doğru/.test(await p.textContent('.b-soru__sonuc')) && (await p.locator('.b-soru__sik[aria-disabled="true"]').count()) === sq.sec.length);
    await p.click('[data-arac-ac="soru-cevap"][data-h="' + 'ABCD'[('ABCD'.indexOf(sq.dogru) + 1) % sq.sec.length] + '"]', { force: true });
    dene('soru: kilitli şıklar Sekme sırasında kalır, tıklamak cevabı değiştirmez', (await p.$$eval('.b-soru__sik', l => l.length > 1 && l.every(b => !b.disabled && b.tabIndex === 0)))
      && /Doğru/.test(await p.textContent('.b-soru__sonuc')) && (await p.getAttribute('.b-soru__sik[aria-pressed="true"]', 'data-h')) === sq.dogru);
    await p.click('[data-arac-ac="soru-sonraki"]');
    await p.waitForSelector('.b-soru[data-sira="1"]');
    sq = await soruMetni();
    await p.click('[data-arac-ac="soru-cevap"][data-h="' + 'ABCD'[('ABCD'.indexOf(sq.dogru) + 1) % sq.sec.length] + '"]');
    dene('soru: yanlış cevap «Yanlış.» der ve doğruyu işaretler', /Yanlış/.test(await p.textContent('.b-soru__sonuc')) && (await p.getAttribute('.b-soru__sik--dogru', 'data-h')) === sq.dogru);
    await p.click('[data-arac-ac="soru-sonraki"]');
    await p.waitForSelector('.b-soru[data-sira="2"]');
    await p.click('[data-arac-ac="soru-bak"]');
    dene('soru: çözüme bakınca doğru sayılmaz', /doğru sayılmaz/.test(await p.textContent('.b-soru__sonuc')));
    await p.reload();
    await p.waitForSelector('.b-soru[data-sira]');
    dene('soru: yenilemeden sonra test kaldığı yerden sürer', (await p.getAttribute('.b-soru[data-sira]', 'data-sira')) === '3');
    await goruntu(p, 'soru');
    await p.click('[data-arac-ac="soru-bitir"]');
    await p.waitForSelector('[data-sonuc="soru"]');
    const sonucMetni = await p.textContent('[data-sonuc="soru"]');
    dene('soru: sonuç 1 doğru, 1 yanlış, 1 bakıldı, kalanı boş; etiketli', /^1 \/ \d+ doğru/.test(sonucMetni) && /1 yanlış/.test(sonucMetni) && /1 çözüme bakıldı/.test(sonucMetni) && /ölçüldü/.test(sonucMetni), sonucMetni);
    await p.click('[data-arac-ac="soru-yeni"]');
    await p.waitForSelector('[data-arac-ac="soru-basla"]');
    dene('soru: biten test «Son testler»de', /1 doğru · 1 yanlış/.test(await p.textContent('[data-arac="soru"] [aria-label="Son testler"]')));

    // ---- Süreli deneme (Felsefe) ve sınav provası (Akademik) ----
    await p.click('a[href="#/motor/soru/deneme"]');
    await p.waitForSelector('[data-deneme="basla"]');
    dene('deneme: başlangıçta testler ve süre «hesaplandı» etiketiyle', /Felsefe ne sorar\?/.test(await p.textContent('[aria-label="Deneme testleri"]')) && /Süre\s*\d+ dk\s*hesaplandı/.test(await p.textContent('[aria-label="Deneme testleri"]')));
    dene('deneme: Felsefe\'de sınav provası yok', (await p.locator('[data-deneme="prova"]').count()) === 0);
    await goruntu(p, 'deneme-baslangic');
    await p.click('[data-deneme="basla"]');
    await p.waitForSelector('[data-deneme-sayfa] .b-serit__sayac[role="timer"]');
    const sayac1 = await p.textContent('.b-serit__sayac');
    await p.waitForFunction(s => document.querySelector('.b-serit__sayac').textContent !== s, sayac1, { timeout: 3000 }).catch(() => {});
    dene('deneme: geri sayım görünür ve akar', /^\d\d:\d\d$/.test(sayac1) && (await p.textContent('.b-serit__sayac')) !== sayac1, sayac1);
    let dq = await soruMetni();
    await p.keyboard.press(dq.dogru.toLowerCase());
    dene('deneme: klavyeyle (harf) cevap seçilir, doğru/yanlış söylenmez', (await p.getAttribute('[data-deneme="cevap"][data-h="' + dq.dogru + '"]', 'aria-pressed')) === 'true' && !/Doğru|Yanlış/.test(await p.textContent('.b-soru')));
    await p.keyboard.press('ArrowRight');
    await p.waitForSelector('.b-adimlar__no[data-i="1"][aria-current]');
    dq = await soruMetni();
    await p.click('[data-deneme="cevap"][data-h="' + 'ABCD'[('ABCD'.indexOf(dq.dogru) + 1) % dq.sec.length] + '"]');
    await p.click('[data-deneme="cevap"][data-h="' + dq.dogru + '"]');
    dene('deneme: cevap bitirene kadar değişir', (await p.getAttribute('[data-deneme="cevap"][data-h="' + dq.dogru + '"]', 'aria-pressed')) === 'true' && (await p.locator('[data-deneme="cevap"][aria-pressed="true"]').count()) === 1);
    await p.reload();
    await p.waitForSelector('.b-serit__sayac');
    dene('deneme: yenilemeden sonra kaldığı sorudan, cevaplarıyla sürer', (await p.getAttribute('.b-adimlar__no[aria-current]', 'data-i')) === '1' && (await p.locator('.b-adimlar__no--dolu').count()) === 2);
    await goruntu(p, 'deneme-soru');
    await p.click('[data-deneme="bitir"]');
    await p.waitForSelector('[data-deneme-sayfa] [data-sonuc]');
    const dSonuc = (await p.textContent('[data-deneme-sayfa]')).replace(/\s+/g, ' ');
    dene('deneme: sonuç net «hesaplandı», doğru ve süre «ölçüldü», boş «hesaplandı»', /Deneme bitti\s*2 net\s*hesaplandı\s*2 doğru, 0 yanlış \(ölçüldü\)/.test(dSonuc) && /boş \(hesaplandı\)/.test(dSonuc) && /dk \(ölçüldü\)/.test(dSonuc), dSonuc.slice(0, 220));
    dene('deneme: Felsefe sonucunda sınav puanı tahmini yok', !/Puan ve sıra/.test(dSonuc));
    const vp = p.viewportSize();
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => document.documentElement.setAttribute('data-rozet', 'kapali'));
    const gizle = await p.evaluate(() => [...document.querySelectorAll('[data-deneme-sayfa] .b-pul')].filter(x => /^(ölçüldü|tahmin|hesaplandı|veri yok|eski kayıt)$/.test(x.textContent)).map(x => getComputedStyle(x).display));
    dene('«Sayaçlar ve noktalar: Gizle» kesinlik etiketlerini gizlemez (AGENTS §1.2)', gizle.length > 0 && gizle.every(x => x !== 'none'), gizle.join(','));
    const kesik = await p.evaluate(() => [...document.querySelectorAll('[aria-label="Testlere göre"] .b-satir__not, [aria-label="Testlere göre"] .b-satir__ad')].filter(x => x.scrollWidth > x.clientWidth + 1).length);
    dene('deneme: test notu 390 px\'te kesilmez (satır uzar)', kesik === 0 && (await p.locator('[aria-label="Testlere göre"] .b-satir--uzun').count()) > 0, String(kesik));
    await p.evaluate(() => document.documentElement.removeAttribute('data-rozet'));
    await p.setViewportSize(vp);
    dene('deneme: biten deneme kaydedildi, süren silindi', await p.evaluate(() => JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.soru.denemeler')).length === 1 && !LIFEOS.Kabuk.ic.depo.getItem('lifeos.soru.deneme')));
    await goruntu(p, 'deneme-sonuc');
    await p.click('[data-deneme="yeni"]');
    await p.waitForSelector('[data-deneme="basla"]');
    dene('deneme: «Son denemeler»de net etiketiyle', /Felsefe · .*2 net\s*hesaplandı/.test(await p.textContent('[data-deneme-sayfa] section')));
    await p.click('[data-deneme="basla"]');
    await p.waitForSelector('.b-serit__sayac');
    await p.evaluate(() => { const v = JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.soru.deneme')); v.oturum.bas -= (v.oturum.sure * 60 + 2) * 1000; LIFEOS.Kabuk.ic.depo.setItem('lifeos.soru.deneme', JSON.stringify(v)); });
    await p.waitForSelector('[data-deneme-sayfa] [data-sonuc]', { timeout: 4000 }).catch(() => {});
    dene('deneme: süre dolunca kendiliğinden biter, «süre doldu» yazar', /süre doldu/.test(await p.textContent('[data-deneme-sayfa]').catch(() => '')));
    await p.goto(T + '/kabuk/#/alan/akademik');
    await p.waitForSelector('.b-acilir');
    await p.goto(T + '/kabuk/#/motor/soru/deneme');
    await p.waitForSelector('[data-deneme="prova"]');
    dene('prova: Akademik\'te TYT provası açık, AYT kilitli üniteler yüzünden kapalı', (await p.locator('[data-deneme="prova"][data-sinav="TYT"]').count()) === 2 && /açık soru yetmiyor/.test(await p.textContent('section')));
    await p.click('[data-deneme="prova"][data-sinav="TYT"][data-boy="20"]');
    await p.waitForSelector('.b-serit__sayac');
    dene('prova: 20 soru, süre 28 dakikadan geri sayar', (await p.locator('.b-adimlar__no').count()) === 20 && /^2[78]:\d\d$/.test(await p.textContent('.b-serit__sayac')), await p.textContent('.b-serit__sayac'));
    await p.click('[data-deneme="cevap"][data-h="A"]');
    await p.waitForSelector('[data-deneme="cevap"][aria-disabled="true"]');
    dene('prova: ilk cevap kilitlenir, doğru/yanlış söylenmez', (await p.locator('[data-deneme="cevap"][aria-disabled="true"]').count()) >= 2 && /kaydedildi/.test(await p.textContent('.b-soru')) && !/Doğru\.|Yanlış\./.test(await p.textContent('.b-soru')));
    await p.click('[data-deneme="bitir"]');
    await p.waitForSelector('[data-deneme-sayfa] [data-sonuc]');
    const pSonuc = (await p.textContent('[data-deneme-sayfa]')).replace(/\s+/g, ' ');
    dene('prova: sonuç net «hesaplandı», ders ders, süre «ölçüldü»', /TYT provası bitti/.test(pSonuc) && /net hesaplandı/.test(pSonuc) && /Türkçe/.test(pSonuc) && /Fen bilimleri/.test(pSonuc) && /\/ 28 dk \(ölçüldü\)/.test(pSonuc), pSonuc.slice(0, 220));
    dene('prova: puan ve sıra tahmini motorun cümlesiyle «veri yok»', /Puan ve sıra\s*tahmin yok\s*veri yok/.test(pSonuc) && /En az 3 tam TYT denemesi gerekir/.test(pSonuc), pSonuc.slice(-400));
    await goruntu(p, 'deneme-prova-sonuc');
    await p.goto(T + '/kabuk/#/motor/soru');
    await p.waitForSelector('[data-arac="soru"] [aria-label="Son testler"]');
    dene('prova: «Son testler»de provası adıyla', /Akademik · TYT provası/.test(await p.textContent('[data-arac="soru"] [aria-label="Son testler"]')));
    await p.goto(T + '/kabuk/#/alan/felsefe');                 // aşağıdaki akışlar Felsefe'yi etkin alan bekler
    await p.waitForSelector('.b-acilir');

    // ---- Tanışma: onaydan önce kayıt yok, onayla yazılır ----
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('[data-tn-davet]');
    dene('tanışma: kayıt yokken Bugün\'de davet satırı', /tanıyayım/.test(await p.textContent('[data-tn-davet]')));
    await p.goto(T + '/kabuk/#/tanisma');
    await p.waitForSelector('#b-alan-metin');
    dene('tanışma: sohbet bölümü, canlı soru, gizli başlıklı çipler; panel yan sütunda (aside)', (await p.locator('.b-yanli--sag section.b-sohbet[aria-label="Sohbet"] form.b-sohbet__simdi[data-tn-soru]').count()) === 1
      && (await p.getAttribute('#tn-soru-metni', 'aria-live')) === 'polite' && (await p.locator('fieldset.b-cipler legend.gizli').count()) === 1
      && (await p.locator('aside.b-yanli__yan #tn-panel').count()) === 1);
    await goruntu(p, 'tanisma-ilk');
    await p.fill('#b-alan-metin', 'Felsefe çalışmak istiyorum, günde 30 dakika ayırabilirim');
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => !!LIFEOS.Kabuk.ic.depo.getItem('lifeos.tanisma.taslak'));
    dene('tanışma: cevap taslakta, kayıt henüz yok', await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.tanisma.kayit') === null));
    await p.waitForSelector('.b-sohbet__akis .b-sohbet__ben');
    dene('tanışma: cevap sohbet geçmişinde «Değiştir» düğmesiyle; anlaşılanlar canlı listede; yazma alanı odakta', /30 dakika/.test(await p.textContent('.b-sohbet__akis .b-sohbet__ben'))
      && (await p.locator('.b-sohbet__ben [data-tn-ac="degistir"]').count()) === 1 && (await p.locator('aside.b-yanli__yan ul.b-liste[aria-live="polite"] .b-satir').count()) >= 1
      && await p.evaluate(() => document.activeElement && document.activeElement.id === 'b-alan-metin'));
    await goruntu(p, 'tanisma-orta');
    const olguSil = await p.getAttribute('aside.b-yanli__yan [data-tn-ac="duzelt"] >> nth=0', 'data-id');
    await p.click('aside.b-yanli__yan [data-tn-ac="duzelt"] >> nth=0');
    await p.waitForSelector('aside.b-yanli__yan form.b-satir--form[data-tn-olgu] #b-alan-duzelt');
    dene('tanışma: «Düzelt» satırı yerinde forma çevirir, alan odakta', await p.evaluate(() => document.activeElement.id === 'b-alan-duzelt'));
    await p.click('[data-tn-ac="vazgec-duzelt"]');
    await p.waitForSelector('aside.b-yanli__yan [data-tn-ac="duzelt"][data-id="' + olguSil + '"]');
    dene('tanışma: «Vazgeç» satırı geri getirir, odak «Düzelt»e döner', await p.evaluate(id => document.activeElement === document.querySelector('[data-tn-ac="duzelt"][data-id="' + id + '"]'), olguSil));
    await p.click('[data-tn-ac="bitir"]');
    await p.waitForSelector('[data-tn-ac="onayla"]');
    dene('tanışma: onay adımında hâlâ kayıt yok', await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.tanisma.kayit') === null));
    dene('tanışma: onay sorusu bölümün başlığı ve odakta', (await p.locator('section.b-sohbet__simdi[aria-labelledby="tn-onay"] #tn-onay').count()) === 1 && await p.evaluate(() => document.activeElement.id === 'tn-onay'));
    await goruntu(p, 'tanisma-onay');
    await p.click('[data-tn-ac="onayla"]');
    await p.waitForSelector('#tn-bitti');
    dene('tanışma: onayla kayıt yazılır', await p.evaluate(() => { const k = JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.tanisma.kayit')); return !!k && JSON.stringify(k).length > 20; }));
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('.b-karsilama');
    dene('tanışma: kayıt varken davet gösterilmez', (await p.locator('[data-tn-davet]').count()) === 0);

    // ---- Başlangıç paketi: eski sistemdeki kayıtlar tek dokunuşla gelir, ikinci kez sorulmaz ----
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('[data-arac="not"]');
    const notOnce = await p.locator('#not-liste a').count();
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('[data-baslangic="teklif"]');
    // gezi bu alıştırmayı kabukta daha önce cevapladıysa o cevap kalır, paketten yalnız eski konu durumu gelir (Yol 1, yoksa 2)
    const yolCevap = () => p.evaluate(a0 => JSON.stringify((JSON.parse(window.LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.akademik.1') || '{}').cevaplar || {})[a0] || null), AK_A0.id);
    const cevapOnce = await yolCevap();
    const HEPSI = new RegExp('1 not, 2 kayıt, 1 kart, 3 plan, 2 soru kaydı, ' + (cevapOnce === 'null' ? 2 : 1) + ' Yol ilerlemesi');
    dene('başlangıç: Bugün\'de teklif yalnız gelecek olanı sayar (not, kayıt, kart, plan, soru, Yol)', HEPSI.test(await p.textContent('[data-baslangic="teklif"]')), await p.textContent('[data-baslangic="teklif"]'));
    await p.click('[data-arac-ac="baslangic-getir"]');
    await p.waitForSelector('[data-baslangic="bitti"]');
    const bitti = await p.textContent('[data-baslangic="bitti"]');
    dene('başlangıç: «Getir» sonucu ve görüneceği araçları söyler', /Getirildi: /.test(bitti) && HEPSI.test(bitti) && /Not, Kayıt, Tekrar, Plan, Soru ve Yol araçlarında/.test(bitti), bitti);
    dene('başlangıç: kabukta verilmiş Yol cevabının üstüne yazılmadı', cevapOnce === 'null' || (await yolCevap()) === cevapOnce);
    // beden alanları yalnız varsayılandaysa yazılır; bu gezide Beden daha önce elle girildi, o yüzden burada sayılmaz (kural birim testinde)
    dene('başlangıç: elle girilmiş Beden ayarının üstüne yazılmadı', await p.evaluate(() => window.LIFEOS.Kabuk.Ayar.oku(window.LIFEOS.Kabuk.Depo, 'lifeos.beden.boy') !== null).catch(() => false));
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForFunction(n => document.querySelectorAll('#not-liste a').length === n + 1, notOnce);
    dene('başlangıç: eski not Not aracında', /Eski defterden/.test(await p.textContent('#not-liste')));
    await p.reload();
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('.b-karsilama');
    await p.waitForTimeout(800);
    dene('başlangıç: aynı paket ikinci kez teklif edilmez', (await p.locator('[data-baslangic="teklif"]').count()) === 0);
    dene('başlangıç: eski kayıt deposunda, «eski kayıt» etiketiyle', await p.evaluate(async () => {
      const v = await window.LIFEOS.Kabuk.Depo.al('lifeos.kayit.kayitlar'); const l = JSON.parse(v || '[]');
      return l.some(r => r.id === 'kilo:2026-10-20:0' && r.deger.kg.k === 'eski'); }).catch(() => false));
    dene('başlangıç: AYS çalışması Kayıt deposunda, değeri kesinlik etiketiyle', await p.evaluate(async () => {
      const l = JSON.parse(await window.LIFEOS.Kabuk.Depo.al('lifeos.kayit.kayitlar') || '[]');
      return l.some(r => r.tur === 'calisma' && r.gun === '2026-10-21' && Object.values(r.deger).every(v => v && 'v' in v && 'k' in v)); }).catch(() => false));
    // her ekran kendi deposundan: Plan (gün planı, hafta hedefi, şablon), Soru (deneme, gün sorusu), Tekrar (kart), Yol (eski konu durumu)
    await p.goto(T + '/kabuk/#/motor/plan');
    await p.waitForSelector('[data-plan-eski]');
    const planEski = await p.textContent('[data-plan-eski]');
    dene('başlangıç: Plan\'da eski gün planı, hafta hedefi (başlangıç günüyle) ve şablon', /1\/1 blok yapıldı · planlanan 50 dk/.test(planEski) && /Hafta 2 · Hafta iki/.test(planEski)
      && /14 Eyl 2026 başlar · 400 soru hedefi/.test(planEski) && /Yürüyüş/.test(planEski) && /eski kayıt/.test(planEski), planEski);
    await goruntu(p, 'baslangic-plan-eski', { hazirla: () => p.$$eval('[data-plan-eski] details', l => l.forEach(x => { x.open = true; })) });
    await p.goto(T + '/kabuk/#/motor/soru');
    await p.waitForSelector('[data-soru-eski]');
    const soruEski = await p.textContent('[data-soru-eski]');
    dene('başlangıç: Soru\'da eski deneme neti (hesaplandı) ve gün sorusu', /Tam TYT · 19 Eki 2026/.test(soruEski) && /28 net \(hesaplandı\)/.test(soruEski) && /28 çözüldü · 20 doğru/.test(soruEski), soruEski);
    await p.goto(T + '/kabuk/#/motor/tekrar');
    await p.waitForSelector('[data-arac="tekrar"]');
    dene('başlangıç: Tekrar\'da eski AYS kartı', /Eski AYS kartı/.test(await p.textContent('[data-arac="tekrar"]')));
    await p.goto(T + '/kabuk/#/motor/yol');
    await p.waitForSelector('a.b-satir[href="#/alan/akademik"]');
    dene('başlangıç: Yol haritasında Akademik satırı eski konu durumunu sayar', /1 konu eski sistemden \(eski kayıt\)/.test(await p.textContent('a.b-satir[href="#/alan/akademik"]')), await p.textContent('a.b-satir[href="#/alan/akademik"]'));
    dene('başlangıç: Yol cevabı gerçek Akademik alıştırmasına, kapı geçmedi', await p.evaluate(a0 => {
      const k = JSON.parse(window.LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.akademik.1') || '{}');
      return !!(k.cevaplar && k.cevaplar[a0] && k.eski && Object.keys(k.kapilar || {}).every(id => !k.kapilar[id].gecti)); }, AK_A0.id));

    // ---- Eski panel (/kartlar/) kabuğun Hesap ekranına gider; açılış videosu ayarı orada (bilgisayarın kendisi, girişsiz) ----
    await p.goto(T + '/kartlar/');
    await p.waitForSelector('[aria-labelledby="ac-bolum"]');
    dene('eski panel: /kartlar/ Hesap ekranına yönlenir, eski panel bağlantısı yok', (await p.evaluate(() => location.pathname + location.hash)) === '/kabuk/#/hesap'
      && !(await p.locator('#sayfa a[href^="/kartlar"]').count()));
    await p.waitForFunction(() => /Henüz video yok/.test(document.querySelector('[aria-labelledby="ac-bolum"]').textContent));
    dene('açılış videosu: ayar ve video seçme Hesap ekranında, video yokken açma anahtarı yok (tek cümle)', !!(await p.locator('[aria-labelledby="ac-bolum"] input[type=file][data-ac-dosya]').count())
      && !(await p.locator('[data-ac-ac="ac"]').count()), await p.textContent('[aria-labelledby="ac-bolum"]'));

    // ---- Yol haritası listesi, komut çubuğu, Hesap ----
    await p.goto(T + '/kabuk/#/motor/yol');
    await p.waitForSelector('a.b-satir[href="#/alan/felsefe"]');
    dene('yol: Felsefe ilerlemesiyle listelenir', /3\/9 ders okundu/.test(await p.textContent('a.b-satir[href="#/alan/felsefe"]')));
    // her alanın içeriği ayrı yüklenir (iki aşama dosyası); denetlenen iki satır da dolana kadar beklenir
    await p.waitForFunction(() => ['akademik', 'tarih'].every(a => /ders okundu/.test((document.querySelector('a.b-satir[href="#/alan/' + a + '"]') || {}).textContent || ''))).catch(() => {});
    dene('yol: on alan ilerlemesiyle listelenir', (await p.locator('[data-arac="yol"] a.b-satir').count()) === 10 && /1\/368 ders okundu/.test(await p.textContent('a.b-satir[href="#/alan/akademik"]')) && /1\/9 ders okundu/.test(await p.textContent('a.b-satir[href="#/alan/tarih"]')));
    await p.keyboard.press('Control+k');
    await p.fill('#komut input', 'yeni not');
    await p.keyboard.press('Enter');
    const acildi = await p.waitForSelector('form.notform[data-not="yeni"]', { timeout: 5000 }).then(() => true, () => false);
    dene('komut çubuğu: «Yeni not» boş not formunu açar', acildi && (await p.evaluate(() => location.hash)) === '#/motor/not/yeni');

    // ---- «taşınıyor» rozeti yok: Öğren, Sağlık, Sistem haritası, Yol haritası listesi (yol sayfası yukarıda içerikle doldu) ----
    for (const [h, ad] of [['#/ogren', 'Öğren'], ['#/saglik', 'Sağlık'], ['#/harita', 'Sistem haritası'], ['#/motor/yol', 'Yol haritası']]) {
      await p.goto(T + '/kabuk/' + h);
      await p.waitForFunction(x => document.getElementById('sayfa').getAttribute('data-yer') === x && document.querySelector('#sayfa a.b-satir'), h.split('/').pop() === 'yol' ? 'yol' : h.slice(2));
      dene(ad + ': «taşınıyor» rozeti yok', !/taşınıyor/.test(await p.textContent('#sayfa')));
      // Sağlık Bugün (2026-11-17d): dört ölçü kutucuğu Kayıt'ın türüne gider; en çok bir ana eylem (ilk kayıtsız kutu), kayıtsız kutu «—»
      if (h === '#/saglik') dene('Sağlık: Bugün dört ölçü kutucuğu, en çok bir ana eylem', await p.evaluate(() => { const k = [...document.querySelectorAll('.sg-olcu__kutu')];
        return k.length === 4 && k.every(a => /^#\/motor\/kayit\/tur\/(ogun|hareket|uyku|kilo)$/.test(a.getAttribute('href')) && a.getAttribute('aria-label'))
          && document.querySelectorAll('.sg-olcu__kutu--ana').length <= 1 && k.filter(a => a.matches('.sg-olcu__kutu--bos')).every(a => a.querySelector('.sg-olcu__deger').textContent === '—'); }));
    }
    // Öğren'e tıklayınca hemen öğren (sahip, 2026-11-16b): en üstte etkin alanın sıradaki adımı tek ana düğmeyle
    await p.goto(T + '/kabuk/#/ogren');
    await p.waitForSelector('#sayfa .sira .b-dugme--ana');
    dene('Öğren: en üstte kaldığın adım tek ana düğmeyle (derse/kapıya gider)', /\/(ders|kapi)\//.test(await p.getAttribute('#sayfa .sira .b-dugme--ana', 'href'))
      && (await p.locator('#sayfa .sira .b-dugme--ana').count()) === 1, await p.textContent('#sayfa .sira'));
    // ---- Her şeyde arama: komut çubuğunun son öğesi; bilinen bir ders ve bilinen bir not bulunur ve açılır ----
    await p.keyboard.press('Control+k');
    await p.fill('#komut input', 'sokrates');
    dene('komut çubuğu: son öğe «Her şeyde ara: sokrates»', (await p.textContent('#komut-liste li:last-child')).indexOf('Her şeyde ara: sokrates') === 0, await p.textContent('#komut-liste li:last-child'));
    await p.click('#komut-liste li:last-child');
    // ders dizini ilk aramada kurulur (on alan, yirmi dosya): ders grubu dolana kadar beklenir
    await p.waitForSelector('[data-arama-grup="ders"]', { timeout: 20000 });
    const olcum1 = await p.evaluate(() => Object.assign({}, LIFEOS.Kabuk.Arama.olcum));
    dene('arama: adres ve alan sorguyu taşır', (await p.evaluate(() => location.hash)) === '#/motor/arama?sokrates' && (await p.inputValue('[data-her-ara]')) === 'sokrates');
    dene('arama: Sokrates dersi bulunur, taslak işaretli', (await p.locator('[data-arama-grup="ders"] a.b-satir[href="#/alan/felsefe/ders/felsefe.1.1.2"]').count()) === 1 &&
      /taslak/.test(await p.textContent('[data-arama-grup="ders"] a.b-satir[href="#/alan/felsefe/ders/felsefe.1.1.2"]')));
    dene('arama: Sokrates notu bulunur', /Sokrates/.test(await p.textContent('[data-arama-grup="not"]').catch(() => '')));
    dene('arama: on alanın dersleri dizinde', olcum1.ders > 500, JSON.stringify(olcum1));
    // bir sorgunun süresi: yazılan her harfte olduğu gibi (arama + çizim), beş sorgunun ortancası
    const sureler = await p.evaluate(() => ['tanım', 'kan şekeri', 'SORARAK DUSUNMEK', 'uyku', 'erdem'].map(q => {
      const g = document.querySelector('[data-her-ara]'), t0 = performance.now(); g.value = q; g.dispatchEvent(new Event('input', { bubbles: true })); return performance.now() - t0;
    }).sort((a, b) => a - b));
    console.log('  ölçüldü: ' + olcum1.ders + ' ders, dizin (yükleme dahil) ' + olcum1.dizinMs + ' ms, bir sorgu + çizim ortanca ' + sureler[2].toFixed(1) + ' ms (en çok ' + sureler[4].toFixed(1) + ' ms)');
    dene('arama: bir sorgu (arama + çizim) 100 ms altında', sureler[2] < 100, sureler.join(', '));
    await p.fill('[data-her-ara]', 'SORARAK DUSUNMEK');
    dene('arama: büyük harf ve aksansız yazım aynı dersi ilk sıraya koyar', (await p.getAttribute('[data-arama-grup="ders"] a.b-satir', 'href')) === '#/alan/felsefe/ders/felsefe.1.1.2');
    await p.click('[data-arama-grup="ders"] a.b-satir');
    await p.waitForSelector('article.ders h1');
    dene('arama: ders bağlantısı dersi açar', (await p.textContent('article.ders h1')) === 'Sorarak düşünmek: Sokrates', await p.textContent('article.ders h1'));
    await p.goBack();
    await p.waitForSelector('[data-arama-grup="ders"]');
    dene('arama: geri gelince sorgu duruyor', (await p.inputValue('[data-her-ara]')) === 'SORARAK DUSUNMEK');
    await p.fill('[data-her-ara]', 'erdem bilgi');
    await p.waitForSelector('[data-arama-grup="not"] a.b-satir');
    await p.click('[data-arama-grup="not"] a.b-satir');
    await p.waitForSelector('form.notform');
    dene('arama: not bağlantısı notu açar', (await p.inputValue('input[name=baslik]')) === 'Erdem');
    // ---- Her şeyde arama: Tekrar kartı (ön ve arka yüz) tek kartı, Plan bloğu ve işi günün planını, sabit blok hafta planını açar ----
    await p.goto(T + '/kabuk/#/motor/tekrar'); // yukarıdaki kart silindi: aranacak kart Tekrar formundan yeniden eklenir
    await p.waitForSelector('form.kartform');
    await p.fill('input[name=on]', 'Arkhe nedir?');
    await p.fill('textarea[name=arka]', 'Evrenin ilk maddesi.');
    await p.click('form.kartform button[type=submit]');
    await p.waitForSelector('.b-kart');
    await p.goto(T + '/kabuk/#/motor/arama?' + encodeURIComponent('ARKHE'));
    await p.waitForSelector('[data-arama-grup="kart"] a.b-satir');
    // Felsefe kapısında kalınan sorular da kart (taslak); Arkhe kartı kendi bağlantısıyla aranır
    const kartId = await p.evaluate(() => JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.tekrar.kartlar')).find(k => k.on === 'Arkhe nedir?').id), kartA = '[data-arama-grup="kart"] a.b-satir[href="#/motor/tekrar/kart/' + encodeURIComponent(kartId) + '"]';
    dene('arama: Tekrar kartı ön yüzünden bulunur, bağlantı o kartı açar', (await p.locator(kartA).count()) === 1 && /Arkhe nedir\?/.test(await p.textContent(kartA)), await p.textContent('[data-arama-grup="kart"]'));
    await p.fill('[data-her-ara]', 'evrenin maddesi');
    await p.waitForSelector(kartA);
    dene('arama: kart arka yüzünden de bulunur, «Cevap:» parçasıyla', /Cevap: Evrenin ilk maddesi/.test(await p.textContent(kartA)), await p.textContent('[data-arama-grup="kart"]'));
    await p.click(kartA);
    await p.waitForSelector('[data-kart-sayfa] .b-kart__on');
    dene('arama: kart sayfası tam o kartı gösterir, arka gizli, not düğmesi yok', (await p.textContent('[data-kart-sayfa] .b-kart__on')) === 'Arkhe nedir?' && (await p.locator('[data-kart-sayfa] .b-kart__arka, [data-kart-sayfa] .b-kart__not').count()) === 0
      && (await p.getAttribute('[data-kart-sayfa] .b-kart', 'data-kart')) === kartId);
    await p.click('[data-kart-sayfa] [data-arac-ac="kart-goster"]');
    await p.waitForSelector('[data-kart-sayfa] .b-kart__arka');
    dene('arama: kart sayfasında «Cevabı göster» arkayı açar ve odağa alır', (await p.textContent('[data-kart-sayfa] .b-kart__arka')) === 'Evrenin ilk maddesi.' && await p.evaluate(() => document.activeElement.classList.contains('b-kart__arka')));
    await goruntu(p, 'kart-sayfa'); // yeni ekran: taşma denetlenir, önizlemesi çekilmedi (yalnız değişen ekranlar çekildi)
    await p.goto(T + '/kabuk/#/motor/tekrar/kart/yok-boyle-kart');
    await p.waitForSelector('[data-arac="tekrar"] .b-bos');
    dene('arama: bilinmeyen kart «bulunamadı» der', /Bu kart bulunamadı/.test(await p.textContent('[data-arac="tekrar"] .b-bos')));
    await p.goto(T + '/kabuk/#/motor/arama?' + encodeURIComponent('rapor'));
    await p.waitForSelector('[data-arama-grup="plan"] a.b-satir');
    dene('arama: Plan bloğu bulunur, günün planını açar', (await p.getAttribute('[data-arama-grup="plan"] a.b-satir >> nth=0', 'href')) === '#/motor/plan'
      && /Rapor/.test(await p.textContent('[data-arama-grup="plan"] a.b-satir >> nth=0')) && /Bugünün planı · 09:00–09:30/.test(await p.textContent('[data-arama-grup="plan"]')),
      await p.textContent('[data-arama-grup="plan"]'));
    await p.click('[data-arama-grup="plan"] a.b-satir >> nth=0');
    await p.waitForSelector('[aria-label="Bugünün blokları"]');
    dene('arama: plan bağlantısı bugünün planını açar (Rapor bloğu orada)', /Rapor/.test(await p.textContent('[aria-label="Bugünün blokları"]')));
    await p.goto(T + '/kabuk/#/motor/arama?' + encodeURIComponent('uyku'));
    await p.waitForSelector('[data-arama-grup="plan"] a.b-satir[href="#/motor/plan/hafta"]');
    dene('arama: sabit blok bulunur, gün ve saatiyle', /Sabit blok · 23:00–07:00 · her gün/.test(await p.textContent('[data-arama-grup="plan"]')), await p.textContent('[data-arama-grup="plan"]'));
    await p.click('[data-arama-grup="plan"] a.b-satir[href="#/motor/plan/hafta"]');
    await p.waitForSelector('[data-hafta] [data-gun]');
    dene('arama: sabit blok bağlantısı hafta planını açar', /Uyku/.test(await p.textContent('[data-hafta]')));
    await p.goto(T + '/kabuk/#/motor/arama?' + encodeURIComponent('sokrates'));
    await p.waitForSelector('[data-arama-grup="not"]');
    await goruntu(p, 'arama');
    // soğuk açılış: sayfa doğrudan aramayla açılır; dizin on alanın yirmi dosyasını isteyerek kurulur
    const ap = await c.newPage();
    await ap.goto(T + '/kabuk/#/motor/arama?' + encodeURIComponent('tanım'));
    await ap.waitForSelector('[data-arama-grup="ders"]', { timeout: 20000 });
    const olcum2 = await ap.evaluate(() => Object.assign({}, LIFEOS.Kabuk.Arama.olcum));
    console.log('  ölçüldü (soğuk açılış): dizin yükleme dahil ' + olcum2.dizinMs + ' ms, ilk sorgu ' + olcum2.sorguMs + ' ms');
    dene('arama: doğrudan açılışta dizin kurulur ve dersler gelir', olcum2.ders === olcum1.ders && (await ap.locator('[data-arama-grup="ders"] a.b-satir').count()) > 0, JSON.stringify(olcum2));
    await ap.close();
    // ---- Başbuğ: açıklama sayfası + LifeOS içinden konuşma (kabuk/king-sohbet.js, 2026-11-15 sahibin isteği) ----
    await p.goto(T + '/kabuk/#/king');
    await p.waitForSelector('[data-sayfa="king"] form[data-king-sohbet]');
    const kingMetin = await p.textContent('#sayfa');
    dene('Başbuğ: nerede konuşulacağını, neyi gördüğünü ve sahibin adımını söyler', /Claude masaüstü uygulamasında/.test(kingMetin) && /Özel notlarını görmez/.test(kingMetin) && /tamamen kapat/.test(kingMetin) && !/hazırlanıyor/.test(kingMetin));
    const kingForm = await p.evaluate(() => { const f = document.querySelector('[data-sayfa="king"] form[data-king-sohbet]');
      return { tek: document.querySelectorAll('[data-king-bolum]').length, secenek: f.saglayici ? [...f.saglayici.options].map(o => o.value).join(',') : 'seçici yok', metin: !!f.metin }; });
    // cevaplayan seçimi sohbetten Ayarlar › Başbuğ'a taşındı (2026-11-16b içerik paketi): sohbette seçici yok, ayar şemada üç seçenekle
    const kingAyar = await p.evaluate(() => { const t = LIFEOS.Kabuk.Ayar.tanim('lifeos.king.saglayici'); return t ? Object.keys(t.secenekler || {}).join(',') : ''; });
    dene('Başbuğ: tek sohbet bölümü, sohbette seçici yok; Otomatik, Antigravity ve Claude Code Ayarlar › Başbuğ’te', kingForm.tek === 1 && kingForm.secenek === 'seçici yok' && kingForm.metin && kingAyar === 'oto,antigravity,claude', JSON.stringify(kingForm) + ' ' + kingAyar);
    // yazma kutusu: örnek sorular; Enter gönderir (Tanışma'nın Enter kısayolu Başbuğ'un kutusunu yakalamaz); hâl gelince yazılan silinmez
    dene('Başbuğ: ilk açılışta karşılama cümlesi ve üç örnek soru', (await p.locator('[data-king-oneri]').count()) === 3 && /Hoş geldin/.test(await p.textContent('.king-selam')));
    // bu yalıtılmış ortamda Merkez yok: gönderilen soruya sahte bir cevap (cevabın akışta göründüğü de sınanır)
    await p.route('**/api/kabuk/king', r => r.request().method() === 'POST'
      ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: 'Merhaba, buradayım.', mode: 'model', provider: 'deneme', seconds: 0.4 }) }) : r.continue());
    await p.fill('form[data-king-sohbet] textarea', 'Merhaba Başbuğ');
    await p.press('form[data-king-sohbet] textarea', 'Enter');
    await p.waitForSelector('.king-akis .king-msj--king', { timeout: 20000 }).catch(() => {});
    dene('Başbuğ: Enter soruyu gönderir, cevap akışa düşer, örnekler kalkar', /Merhaba Başbuğ/.test(await p.textContent('.king-msj--ben')) && /Merhaba, buradayım/.test(await p.textContent('.king-msj--king')) && (await p.locator('[data-king-oneri]').count()) === 0
      && (await p.textContent('.king-msj--king .king-kim')) === 'Başbuğ');
    await p.unroute('**/api/kabuk/king');
    // 2026-11-16: konuşma yenilemede kalır (lifeos.king.sohbet), «Yeni konuşma» temizler; ayrıntılı tur: belgeler/ekip/sadelesme/tur-20261116/king.md
    await p.reload(); await p.waitForSelector('.king-msj--king');
    await p.click('[data-king-yeni]');
    dene('Başbuğ: konuşma yenilemede kalır, «Yeni konuşma» temizler', (await p.locator('.king-msj').count()) === 0 && (await p.locator('[data-king-oneri]').count()) === 3);
    // 2026-11-19: Divan'da hükümdar seçimi sohbeti yeniden çizer; sahne payı (kapakPay) kaybolup kip şeridi sahnenin üstüne biniyordu
    await p.click('[data-king-kip="divan"]'); await p.click('[data-king-hukumdar="fatih"]'); await p.waitForTimeout(100);
    const divanPay = await p.evaluate(() => { const k = document.querySelector('#sayfa > .kapak'), s = document.querySelector('.king-sohbet'); return !k || innerWidth < 641 || s.getBoundingClientRect().top >= k.getBoundingClientRect().bottom; });
    await p.click('[data-king-kip="ortak"]');
    dene('Başbuğ: Divan’da hükümdar seçilince sohbet sahnenin altında kalır', divanPay);
    await goruntu(p, 'king');
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForFunction(() => window.LIFEOS && window.LIFEOS.HESAP && document.querySelector('.b-karsilama__selam')); // bölüm geçişinin çizimi bir kare sonra
    dene('Hesap yüklendi; oturum yokken selam adsız', await p.evaluate(() => LIFEOS.HESAP.durum().oturum === null && /^(Günaydın|İyi günler|İyi akşamlar|İyi geceler)\.$/.test(document.querySelector('.b-karsilama__selam').textContent)), await p.textContent('.b-karsilama__selam'));

    // ---- Aşamalar: Felsefe'nin ikinci aşaması (eski birinci aşama kaydı yerinde kalır) ----
    await p.goto(T + '/kabuk/#/alan/felsefe?b=asamalar');
    await p.waitForSelector('.asama-kartlar');
    const kayit1 = await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.1'));
    dene('aşama: «Aşamalar» bölümü iki aşamayı kart olarak listeler, ikincisi kilitli ve nedenini söyler', (await p.locator('.asama-kartlar .asama-kart').count()) === 2 && (await p.locator('.asama-kartlar .asama-kart--kilitli').count()) === 1 && /önce Aşama 1 kapısı/.test(await p.textContent('.asama-kartlar')), y2gercek ? 'gerçek asama-2.json' : 'yapay ikinci aşama');
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.asama-ozet');
    dene('aşama: birinci aşamanın eski anahtarlı kaydı aynen okunuyor (3/9 ders)', (await ilerleme(p)) === '3/9' && !!kayit1 && (await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.2'))) === null);
    await p.goto(T + '/kabuk/#/alan/felsefe/ders/' + y2.uniteler[0].dersler[0].id);
    await p.waitForSelector('.b-bos');
    dene('aşama: kilitli aşamanın dersi açılmaz, neden aşama kilidi', /Bu aşama kilitli/.test(await p.textContent('.b-bos')));
    await p.goto(T + '/kabuk/#/alan/felsefe/asama/2');
    await p.waitForSelector('.govde .b-bos');
    dene('aşama: kilitli aşama sayfası listeyi ve kilidi gösterir', /Bu aşama kilitli/.test(await p.textContent('.govde .b-bos')) && (await p.locator('.yol > .b-acilir').count()) === 0);
    await goruntu(p, 'asama-kilitli');
    for (const sahip of y.uniteler.slice(1).concat([y])) {                   // ikinci ve üçüncü ünite kapısı, sonra aşama kapısı
      await p.goto(T + '/kabuk/#/alan/felsefe/kapi/' + sahip.id);
      await p.waitForSelector('form.kapi');
      for (const q of sahip.kapi.sorular) await p.check('input[name="' + q.id + '"][value="' + q.dogru + '"]');
      await gonder(p);
      await p.waitForSelector('[data-sonuc="gecti"]');
    }
    dene('aşama: aşama kapısı geçilince «Sonraki aşama» ikinci aşamaya götürür', (await p.getAttribute('[data-sonuc] .b-dugme--ana', 'href')) === '#/alan/felsefe/asama/2' && /Sonraki aşama/.test(await p.textContent('[data-sonuc] .b-dugme--ana')));
    await p.click('[data-sonuc] .b-dugme--ana');
    await p.waitForFunction(() => /Aşama 2/.test((document.querySelector('#asama-ad') || {}).textContent || ''));
    dene('aşama: ikinci aşama açıldı; ilk dersi «sıradaki»', (await p.getAttribute('a.b-ders--sira', 'href')) === '#/alan/felsefe/ders/' + y2.uniteler[0].dersler[0].id);
    await p.goto(T + '/kabuk/#/alan/felsefe/asama/2?b=asamalar');
    await p.waitForSelector('.asama-kartlar');
    dene('aşama: «Aşamalar»da birincisi «geçildi», ikincisi şu an burada', /geçildi/.test(await p.textContent('.asama-kartlar .asama-kart >> nth=0')) && (await p.getAttribute('.asama-kartlar .asama-kart >> nth=1', 'aria-current')) === 'step');
    await goruntu(p, 'asama-liste');
    const kayit1b = await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.1'));
    await p.goto(T + '/kabuk/#/alan/felsefe/asama/2');
    await p.waitForSelector('a.b-ders--sira');
    await p.click('a.b-ders--sira');
    await p.waitForSelector('article.ders h1');
    await bitir(p);
    await p.waitForFunction(() => !!LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.2'));
    const k2 = await p.evaluate(() => JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.2')));
    dene('aşama: ikinci aşamanın kaydı kendi anahtarında; birincinin kaydı değişmedi', Object.keys(k2.dersler).length === 1 && Object.keys(k2.asamalar).length === 0 && (await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.1'))) === kayit1b);
    await p.reload();
    await p.goto(T + '/kabuk/#/bugun');
    const ad2 = y2.uniteler.flatMap(u => u.dersler.map(x => x.ad));
    await p.waitForFunction(l => { const a = document.querySelector('#b-k-alanlar + .b-karsilama__alanlar .b-karsilama__alan, .b-karsilama__alanlar .b-karsilama__alan'); return !!a && l.some(ad => a.textContent.indexOf('Sıradaki: ' + ad) >= 0); }, ad2, { timeout: 5000 }).catch(() => {});
    const ana2 = (await ilkAlan()).metin;
    dene('aşama: Bugün yenilemeden sonra ikinci aşamanın sıradaki dersiyle karşılar', ad2.some(ad => ana2.indexOf('Sıradaki: ' + ad) >= 0), ana2);
    // ---- Kayıt deposu (faz2-indexeddb.md): kayıt IndexedDB'de, ayar localStorage'da; yazıdan hemen sonra yenilense de kalır ----
    const idbOku = (sayfa, k) => sayfa.evaluate(k => new Promise((ok, red) => { const r = indexedDB.open('lifeos-kabuk'); r.onerror = () => red(r.error);
      r.onsuccess = () => { const q = r.result.transaction('kayit').objectStore('kayit').get(k); q.onsuccess = () => { r.result.close(); ok(q.result === undefined ? null : q.result); }; }; }), k);
    const yerelKayit = sayfa => sayfa.evaluate(() => Object.keys(localStorage).filter(k => LIFEOS.Kabuk.Depo.kayitMi(k)));
    await p.waitForFunction(() => typeof LIFEOS.Kabuk.Depo.kalici() === 'boolean', null, { timeout: 5000 }).catch(() => {});
    dene('depo: kip idb, kalıcı depolama soruldu ve yanıtlandı', (await p.evaluate(() => LIFEOS.Kabuk.Depo.kip() + ' ' + typeof LIFEOS.Kabuk.Depo.kalici())) === 'idb boolean',
      await p.evaluate(() => LIFEOS.Kabuk.Depo.kip() + ' ' + LIFEOS.Kabuk.Depo.kalici()));
    const k2son = await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.2'));
    dene('depo: yazıdan hemen sonra yenilenen kayıt kaldı, IndexedDB içinde; localStorage içinde hiç kayıt anahtarı yok, ayar orada',
      JSON.parse(k2son).dersler && Object.keys(JSON.parse(k2son).dersler).length === 1 && (await idbOku(p, 'lifeos.yol.felsefe.2')) === k2son
      && (await yerelKayit(p)).length === 0 && (await p.evaluate(() => localStorage.getItem('lifeos.kabuk.depo'))) === 'idb', JSON.stringify(await yerelKayit(p)));
    dene('konsolda hata yok', hata.length === 0, hata.join(' | '));
    await c.close();

    // ---- Taşıma: eski localStorage kaydı ilk açılışta IndexedDB'ye geçer, ekran onu okur, localStorage'dan silinir ----
    const mc = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }), mp = await mc.newPage(), mhata = [];
    mp.on('pageerror', e => mhata.push(e.message));
    mp.on('console', m => { if (m.type() === 'error' && !/\/alan\/[a-z]+\/(asama-\d+|harita)\.json$|\/api\/hesap\/kabuk/.test(m.location().url || '')) mhata.push(m.text()); });
    if (!y2gercek) await mp.route('**/alan/felsefe/asama-2.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(y2) }));
    await mp.goto(T + '/kabuk/harita.js'); // aynı köken, kabuk henüz açılmadı
    await mp.evaluate(k => { localStorage.setItem('lifeos.yol.felsefe.1', k); localStorage.setItem('lifeos.tema.secim', 'light'); }, kayit1);
    await mp.goto(T + '/kabuk/#/alan/felsefe');
    await mp.waitForSelector('.asama-ozet');
    dene('taşıma: eski localStorage kaydı ilk açılışta okunur (3/9 ders)', (await ilerleme(mp)) === '3/9');
    dene('taşıma: kayıt IndexedDB içinde aynen, localStorage içinden silindi; ayar yerinde ve uygulandı', (await idbOku(mp, 'lifeos.yol.felsefe.1')) === kayit1 && (await yerelKayit(mp)).length === 0
      && (await mp.evaluate(() => localStorage.getItem('lifeos.tema.secim') + ' ' + document.documentElement.getAttribute('data-theme'))) === 'light light');
    await mp.reload();
    await mp.waitForSelector('.asama-ozet');
    dene('taşıma: yenilemeden sonra kayıt IndexedDB içinden okunur', (await ilerleme(mp)) === '3/9');
    dene('taşıma: konsolda hata yok', mhata.length === 0, mhata.join(' | '));
    await mc.close();

    // ---- Seviyemi bul (icerik-hatti §4.3): boş kayıtlı Dil, iki aşama; birinci bilinir, ikincide kalınır ----
    const yc = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }), yp = await yc.newPage(), yhata = [];
    yp.on('pageerror', e => yhata.push(e.message));
    yp.on('console', m => { if (m.type() === 'error' && !/\/alan\/[a-z]+\/(asama-\d+|harita)\.json$|\/api\/hesap\/kabuk/.test(m.location().url || '')) yhata.push(m.text()); });
    const dil = [1, 2].map(n => JSON.parse(fs.readFileSync(path.join(kok, 'alan/dil/asama-' + n + '.json'), 'utf8'))), dogruHarf = {};
    dil.forEach(v => v.uniteler.forEach(u => u.kapi.sorular.forEach(q => { dogruHarf[q.id] = q.dogru; })));
    const yerCevapla = async dogru => {
      for (const ad of await yp.$$eval('form.kapi[data-yer] input[type=radio]', l => [...new Set(l.map(x => x.name))])) {
        await yp.check('input[name="' + ad + '"][value="' + (dogru ? dogruHarf[ad] : (dogruHarf[ad] === 'A' ? 'B' : 'A')) + '"]');
      }
      await gonder(yp, 'form.kapi[data-yer]');
    };
    await yp.goto(T + '/kabuk/#/alan/dil');
    await yp.waitForSelector('[data-yer-bul]');
    await goruntu(yp, 'yer-1-alan-secim', { yalniz: YER });
    // genel bakış: tek ana düğme «Öğrenmeye başla» ilk derse; «Seviyemi bul» düğme değil küçük bağlantı ve kendiliğinden açılmaz (2026-11-16b, 2026-11-18c)
    dene('yerleştirme: boş alanda ilk ders «sıradaki», tek düğme «Öğrenmeye başla», küçük «seviyemi bul» bağlantısı; sorular kendiliğinden açılmaz', (await yp.locator('.asama-ozet .b-dugme').count()) === 1
      && (await yp.getAttribute('.asama-ozet .b-dugme', 'href')) === '#/alan/dil/ders/' + dil[0].uniteler[0].dersler[0].id && /Öğrenmeye başla/.test(await yp.textContent('.asama-ozet .b-dugme'))
      && (await yp.getAttribute('[data-yer-bul]', 'href')) === '#/alan/dil/yer/1' && (await yp.evaluate(() => location.hash)) === '#/alan/dil' && (await yp.locator('form.kapi').count()) === 0
      && (await yp.getAttribute('a.b-ders--sira', 'href')) === '#/alan/dil/ders/' + dil[0].uniteler[0].dersler[0].id);
    await yp.setViewportSize({ width: 390, height: 800 });
    const ozetMob = await yp.evaluate(() => {
      const b = document.getElementById('asama-ad').getBoundingClientRect(), l = document.querySelector('[data-yer-bul]').getBoundingClientRect();
      return { altinda: l.top >= b.bottom - 2, h: Math.round(l.height), tasma: document.documentElement.scrollWidth <= window.innerWidth, sol: Math.round(l.left), sag: Math.round(l.right) };
    });
    dene('alan özeti (390 px): seviyemi bul bağlantısı başlığın altında, >= 40 px ve 390 px içinde kalır', ozetMob.altinda && ozetMob.h >= 40 && ozetMob.tasma && ozetMob.sol >= 0 && ozetMob.sag <= 390, JSON.stringify(ozetMob));
    await yp.setViewportSize({ width: 1280, height: 800 });
    await yp.click('[data-yer-bul]');
    await yp.waitForSelector('form.kapi[data-yer="1"]');
    const n1 = await yp.locator('form.kapi[data-yer="1"] fieldset').count();
    dene('yerleştirme: aşama 1, 5–8 soru, yalnız ünite kapılarından, doğru cevap yok', n1 >= 5 && n1 <= 8 && (await yp.locator('.b-soru__sik--dogru').count()) === 0
      && (await yp.$$eval('form.kapi[data-yer] input[type=radio]', l => l.map(x => x.name))).every(id => dil[0].uniteler.some(u => u.kapi.sorular.some(q => q.id === id))), n1);
    await goruntu(yp, 'yerlestirme-soru');
    await goruntu(yp, 'yer-2-yer-soru', { yalniz: YER });
    await yerCevapla(true);
    await yp.waitForSelector('form.kapi[data-yer="2"]');
    dene('yerleştirme: birinci aşama bilinince ikinciye geçer', /Aşama 2 \/ 2/.test(await yp.textContent('#asama-ad')));
    await yerCevapla(false);
    await yp.waitForSelector('[data-sonuc]');
    const ys = await yp.textContent('.govde');
    dene('yerleştirme: sonuç «Aşama 2», tahmin etiketli; birinci atlandı, ikinci buradan', /Başlangıç: Aşama 2/.test(ys) && /tahmin/.test(await yp.textContent('[data-sonuc]'))
      && /atlandı/.test(await yp.textContent('[aria-label="Yerleştirme sonucu"] li >> nth=0')) && /buradan/.test(await yp.textContent('[aria-label="Yerleştirme sonucu"] li >> nth=1')), ys);
    dene('yerleştirme: Dil beceri alanı, üretim görevi bekliyor', /üretim görevi bekliyor/.test(ys));
    await goruntu(yp, 'yerlestirme-sonuc');
    await goruntu(yp, 'yer-3-yer-sonuc', { yalniz: YER });
    const kd = await yp.evaluate(() => [1, 2].map(n => JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.dil.' + n))));
    dene('yerleştirme: kayıt atlandı/tahmin, «geçildi» yazılmadı', kd[0].yerlestirme.sonuc === 'atlandi' && kd[0].yerlestirme.etiket === 'tahmin' && kd[0].asamalar['dil.1'].gecti === undefined
      && kd[1].yerlestirme.sonuc === 'burada', JSON.stringify(kd));
    dene('yerleştirme: sonuçta «Başla» ikinci aşamanın ilk dersine', (await yp.getAttribute('.b-eylemler .b-dugme--ana', 'href')) === '#/alan/dil/ders/' + dil[1].uniteler[0].dersler[0].id);
    await yp.goto(T + '/kabuk/#/alan/dil/asama/1');
    await yp.waitForSelector('.b-acilir');
    const asamaKart1 = await yp.evaluate(() => { location.hash = '#/alan/dil/asama/1?b=asamalar'; return new Promise(ok => setTimeout(() => { const t = (document.querySelector('.asama-kartlar .asama-kart') || {}).textContent || ''; location.hash = '#/alan/dil/asama/1'; setTimeout(() => ok(t), 400); }, 600)); });
    await yp.waitForSelector('.asama-ozet');
    dene('yerleştirme: birinci aşama «Aşamalar»da «atlandı · tahmin», üniteleri atlandı ve açık', /atlandı · tahmin/.test(asamaKart1)
      && (await yp.locator('.b-acilir summary', { hasText: 'atlandı (tahmin)' }).count()) === dil[0].uniteler.length && (await yp.locator('[data-yer-bul]').count()) === 0
      && (await yp.locator('.b-acilir >> nth=2').locator('a.b-ders, a.b-satir').count()) >= 1);
    await goruntu(yp, 'yer-4-atlanan-asama', { yalniz: YER });
    await yp.goto(T + '/kabuk/#/alan/dil/yer/1');
    await yp.waitForSelector('.b-bos');
    dene('yerleştirme: kaydı olan alanda yeniden yapılmaz', /yalnız hiç başlanmamış/.test(await yp.textContent('.b-bos')));
    const du = dil[1].uniteler[0];
    await yp.goto(T + '/kabuk/#/alan/dil/kapi/' + du.id);
    await yp.waitForSelector('form.kapi');
    // önce boş gönderilir: kalınır, sorular Tekrar'ın «kapıda kalınan» bölümüne düşer (yer-5, yer-6 görüntüleri)
    await gonder(yp);
    await yp.waitForSelector('[data-sonuc="kaldi"]');
    dene('yerleştirme sonrası: boş kapı kalır, sorular Tekrar\'a düştü', new RegExp(du.kapi.sorular.length + ' soru Tekrar').test(await yp.textContent('[data-sonuc="kaldi"]')), await yp.textContent('[data-sonuc="kaldi"]'));
    await goruntu(yp, 'yer-5-kapi-kalinca', { yalniz: YER });
    await yp.goto(T + '/kabuk/#/motor/tekrar');
    await yp.waitForSelector('[data-kapi-kartlari] .b-acilir');
    dene('yerleştirme sonrası: kapıda kalınan sorular Tekrar\'da taslak bölümünde', (await yp.locator('[data-kapi-kartlari] .b-acilir').count()) === du.kapi.sorular.length);
    await goruntu(yp, 'yer-6-tekrar-kapi-kartlari', { yalniz: YER });
    await yp.goto(T + '/kabuk/#/alan/dil/kapi/' + du.id);
    await yp.waitForSelector('form.kapi');
    for (const q of du.kapi.sorular) await yp.check('input[name="' + q.id + '"][value="' + q.dogru + '"]');
    await yp.click('form.kapi button[type=submit]');
    await yp.waitForSelector('[data-sonuc="gecti"]');
    const kd2 = await yp.evaluate(() => [1, 2].map(n => JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.dil.' + n)).yerlestirme));
    dene('yerleştirme: ilk ölçülen ünite kapısı geçilince tahmin iki aşamada da silinir', kd2.every(x => x.etiket === undefined && x.olcum > 0), JSON.stringify(kd2));
    dene('yerleştirme: konsolda hata yok', yhata.length === 0, yhata.join(' | '));
    await yc.close();

    const t = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
    const tp = await t.newPage();
    await tp.goto(T + '/kabuk/#/alan/felsefe/ders/' + u1.dersler[0].id);
    await tp.waitForSelector('article.ders h1');
    dene('telefon: yatay taşma yok', await tp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await tp.evaluate(() => document.documentElement.scrollWidth));
    if (GORUNTU) await tp.screenshot({ path: path.join(cikti, 'ders-telefon-acik.png'), fullPage: true });
    await t.close();

    // ---- Onaylar (faz6-onay-ekrani.md): onay kayda yazılır, yenilemede kalır, ders ekranında taslak uyarısı kalkar, geri alınır, dosyaya iner ----
    const oc = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark', acceptDownloads: true }), op = await oc.newPage(), ohata = [];
    op.on('pageerror', e => ohata.push(e.message));
    // Etiket API'si gerçek mesaj taşır (kalite/veri/yerel, sunucu.ETIKET_DIZIN depo içinde, ortam değişkeni yok): gezide hiçbir istek sunucuya
    // gitmez, sahte cevap verilir; yazma tarafı (geçici klasör) tools/kalite_etiket_test.py'de.
    let etiketKip = 'bos'; const etiketPost = [], ET_SATIR = { anlama: [{ id: 'g1', metin: 'Yarın sabah koşuya çıkmalı mıyım?', adaylar: [] }, { id: 'g2', metin: 'Bugün iki litre su içtim', adaylar: [] }],
      arama: [{ id: 'q1', metin: 'Sokrates bilgi hakkında ne demişti?', adaylar: [{ no: 'a1', baslik: 'Sokrates', ozet: 'Bildiğim tek şey hiçbir şey bilmediğimdir.' }, { no: 'a2', baslik: 'Erdem', ozet: 'Erdem bilgidir.' }] }] };
    await oc.route(/\/api\/kalite\/etiket/, r => {
      if (etiketKip === 'kapali') return r.fulfill({ status: 403, contentType: 'application/json', body: '{"ok":false,"mesaj":"Yalnız bu bilgisayardan."}' });
      if (r.request().method() === 'POST') { etiketPost.push(r.request().postDataJSON()); return r.fulfill({ contentType: 'application/json', body: '{"ok":true}' }); }
      const set = new URL(r.request().url()).searchParams.get('set'), l = etiketKip === 'dolu' ? ET_SATIR[set].filter(x => !etiketPost.some(q => q.id === x.id)) : [];
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, set, bekleyen: l.length, satirlar: l }) });
    });
    // etiketin 403'ü gezinin kendi sınaması (sahte cevap); tarayıcı onu konsola yazar
    op.on('console', m => { if (m.type() === 'error' && !/\/alan\/[a-z]+\/(asama-\d+|harita)\.json$|\/api\/kalite\/etiket|\/api\/hesap\/kabuk/.test(m.location().url || '')) ohata.push(m.text()); });
    if (!y2gercek) await op.route('**/alan/felsefe/asama-2.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(y2) }));
    let bekleyen = 0; // dosyalardan sayılan taslak ders (haritadaki aşama sayısı kadar)
    require(kok + '/kabuk/harita.js').YERLER.filter(x => x.katman === 'alan' && x.asama).forEach(x => { for (let n = 1; n <= x.asama; n++) {
      const f = path.join(kok, 'alan', x.alan, 'asama-' + n + '.json'), v = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : x.alan === 'felsefe' && n === 2 ? y2 : null;
      if (v) v.uniteler.forEach(u => u.dersler.forEach(dd => { if (dd.durum !== 'onayli') bekleyen++; }));
    } });
    const onayKaydi = () => op.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.onay'));
    const taslakUyari = () => op.locator('.b-uyari', { hasText: 'Taslak: bu ders henüz onaylanmadı' }).count();
    const od = u1.dersler[0], odIds = [od.id].concat(od.alistirmalar.map(a => a.id));
    await op.goto(T + '/kabuk/#/bugun');
    // Yönetim (2026-11-16b içerik paketi): Bugün'deki «Onay bekleyen N ders» satırı kalktı; bekleyen sayısı yalnız Yönetim'de, düz cümle
    await op.waitForSelector('.b-karsilama');
    dene('onay: Bugün\'de onay satırı yok (sayı Yönetim\'de)', (await op.locator('[data-onay-bekleyen]').count()) === 0);
    await op.goto(T + '/kabuk/#/onay');
    await op.waitForSelector('[data-onay-sayfa="ana"]', { timeout: 20000 });
    const yonetimMetin = (await op.textContent('[data-onay-sayfa="ana"]')).replace(/\s+/g, ' ');
    dene('onay: on alan, aşama başına onaylı/toplam; bekleyen ders sayısı düz cümle', (await op.locator('a.b-satir[href^="#/onay/"]').count()) === 10
      && /Aşama 1: \d+\/\d+ onaylı · Aşama 2: \d+\/\d+ onaylı/.test(await op.textContent('a.b-satir[href="#/onay/felsefe"]'))
      && yonetimMetin.indexOf(bekleyen.toLocaleString('tr-TR') + ' ders onayını bekliyor') >= 0, yonetimMetin.slice(0, 200));
    dene('onay: «Senin adımların» üç satır; onay yokken dosya düğmesi kapalı, «hepsini onayla» yok', (await op.locator('[aria-label="Senin adımların"] li').count()) === 3
      && (await op.getAttribute('[data-onay-ac="disari"]', 'aria-disabled')) === 'true' && (await op.locator('button, a, [data-onay-ac]').filter({ hasText: /hepsini onayla/i }).count()) === 0);
    // etiketleme kapalı bölümde: önce açılır
    await op.click('[data-etiket] summary');
    await op.waitForSelector('[data-etiket-govde] .b-bos');
    dene('etiket: set boşken ne yapılacağını söyleyen tek boş durum, düğme yok', /İşaretlenecek mesaj yok/.test(await op.textContent('[data-etiket-govde]'))
      && (await op.locator('[data-etiket-govde] button').count()) === 0);
    await goruntu(op, 'onay');
    etiketKip = 'dolu'; await op.reload(); await op.click('[data-etiket] summary'); await op.waitForSelector('[data-onay-ac="etiket-bas"][data-set="anlama"]:not([aria-disabled])');
    await op.click('[data-onay-ac="etiket-bas"][data-set="anlama"]');
    await op.waitForSelector('[data-etiket-soru]');
    dene('etiket: Anlama bir mesaj, beş niyet düğmesi düz Türkçe açıklamalı, odak mesajda', (await op.textContent('[data-etiket-soru] legend')) === ET_SATIR.anlama[0].metin
      && (await op.locator('[data-onay-ac="etiket-niyet"]').count()) === 5 && /Kayıt: bir şeyi yazdırmak/.test(await op.textContent('[data-etiket-soru]'))
      && await op.evaluate(() => document.activeElement.matches('[data-etiket-soru]')));
    await goruntu(op, 'onay-etiket');
    await op.click('[data-onay-ac="etiket-niyet"][data-h="B"]');
    await op.waitForFunction(() => /Bugün iki litre/.test(document.querySelector('[data-etiket-soru] legend').textContent));
    dene('etiket: niyet aynı kökene JSON ile gider, sonraki mesaj gelir', JSON.stringify(etiketPost) === '[{"set":"anlama","id":"g1","etiket":"kayit"}]');
    await op.click('[data-onay-ac="etiket-atla"]');
    await op.waitForSelector('[data-etiket-govde] .b-uyari--tamam');
    dene('etiket: «Atla» yazmadan geçer; tur bitince sayı tazelenir', etiketPost.length === 1 && /1 işaret kaydedildi/.test(await op.textContent('[data-etiket-govde]'))
      && /1 mesaj ve \d+ arama sorusu bekliyor/.test(await op.textContent('[data-etiket-govde]')), await op.textContent('[data-etiket-govde]'));
    await op.click('[data-onay-ac="etiket-bas"][data-set="arama"]');
    await op.waitForSelector('[data-etiket-soru] input[name="etiket-aday"]');
    await op.click('[data-onay-ac="etiket-secili"]');
    dene('etiket: Arama adaylar onay kutusu, «hiçbiri» ve «arama değil» düğmeli; seçimsiz gönderilmez', (await op.locator('input[name="etiket-aday"]').count()) === 2
      && (await op.locator('[data-onay-ac="etiket-hicbiri"], [data-onay-ac="etiket-degil"]').count()) === 2 && etiketPost.length === 1 && /Bir sonuç seç/.test(await op.textContent('[data-etiket-govde] .b-uyari--hata')));
    await op.check('input[name="etiket-aday"][value="a2"]');
    await goruntu(op, 'onay-etiket-arama');
    await op.click('[data-onay-ac="etiket-secili"]');
    await op.waitForSelector('[data-etiket-govde] .b-uyari--tamam');
    dene('etiket: seçilen adaylar liste olarak yazılır; mesajlar tarayıcı deposuna girmez', JSON.stringify(etiketPost[1]) === '{"set":"arama","id":"q1","etiket":["a2"]}'
      && !(await op.evaluate(() => /koşuya|Sokrates bilgi/.test(JSON.stringify(Object.assign({}, localStorage, sessionStorage))))));
    etiketKip = 'kapali'; await op.reload(); await op.click('[data-etiket] summary'); await op.waitForSelector('[data-etiket-govde] .b-uyari--bilgi');
    dene('etiket: sunucu 403 ya da yoksa yalnız tek sakin satır', (await op.textContent('[data-etiket-govde]')) === 'BilgiBu iş yalnız bilgisayarın kendisinde açılır.'
      && (await op.locator('[data-etiket-govde] button, [data-etiket-govde] .b-sayi').count()) === 0);
    etiketKip = 'bos';
    await op.goto(T + '/kabuk/#/onay/felsefe/1/' + od.id);
    await op.waitForSelector('[data-onay-sayfa="ders"]');
    dene('onay: ders ekranı metni, açık kaynakları, «kaynaklar doğrulanmadı» notunu ve cevap anahtarını gösterir',
      (await op.textContent('article.ders h1')) === od.ad && (await op.locator('.b-uyari', { hasText: 'Kaynaklar doğrulanmadı' }).count()) === 1
      && (await op.locator('details.b-acilir[open]').count()) === 1 && (await taslakUyari()) === 1
      && (await op.locator('.b-soru__sik--dogru').count()) === od.alistirmalar.filter(a => a.tur === 'secmeli').length && (await op.locator('.b-soru[data-soru]').count()) === 0);
    await goruntu(op, 'onay-ders');
    await op.click('[data-onay-ac="onayla"]');
    await op.waitForSelector('#onay-durum');
    const ok1 = JSON.parse(await onayKaydi() || '{}');
    dene('onay: «Onayla» dersi alıştırmalarıyla kayda yazar (sahip, tarih)', JSON.stringify(Object.keys(ok1).sort()) === JSON.stringify(odIds.map(i => 'felsefe/1/' + i).sort())
      && Object.values(ok1).every(g => g.durum === 'onayli' && g.onaylayan === 'sahip' && /^\d{4}-\d{2}-\d{2}$/.test(g.onayTarihi)), JSON.stringify(ok1));
    await op.reload();
    await op.waitForSelector('[data-onay-sayfa="ders"]', { timeout: 20000 });
    dene('onay: yenilemeden sonra onaylı kalır (kayıt IndexedDB\'de)', (await op.locator('#onay-durum').count()) === 1 && (await taslakUyari()) === 0
      && (await idbOku(op, 'lifeos.onay')) === JSON.stringify(ok1));
    await op.goto(T + '/kabuk/#/alan/felsefe/ders/' + od.id);
    await op.waitForSelector('article.ders h1');
    dene('onay: öğrenenin ders ekranında taslak uyarısı yok', (await taslakUyari()) === 0);
    await op.goto(T + '/kabuk/#/onay');
    await op.waitForSelector('[data-onay-sayfa="ana"]');
    dene('onay: Yönetim\'deki bekleyen sayı bir azaldı', (await op.textContent('[data-onay-sayfa="ana"]')).indexOf((bekleyen - 1).toLocaleString('tr-TR') + ' ders onayını bekliyor') >= 0);
    await op.goto(T + '/kabuk/#/onay/felsefe/1/' + od.id);
    await op.click('[data-onay-ac="geri-al"]');
    await op.waitForSelector('[data-onay-ac="onayla"]');
    await op.goto(T + '/kabuk/#/alan/felsefe/ders/' + od.id);
    await op.waitForSelector('article.ders h1');
    dene('onay: «Geri al» kaydı siler, ders yeniden taslak', (await onayKaydi()) === null && (await taslakUyari()) === 1);
    // ünitenin hepsi: önce düz onay bloğu, Vazgeç hiçbir şey yazmaz
    await op.goto(T + '/kabuk/#/onay/felsefe/1/' + u1.id);
    await op.click('[data-onay-ac="sor"]');
    await op.waitForSelector('#onay-sor');
    dene('onay: «Ünitenin hepsini onayla» önce kaç ders olduğunu sorar, henüz yazmaz', (await op.textContent('#onay-sor')).indexOf(u1.dersler.length + ' ders onaylansın mı?') >= 0 && (await onayKaydi()) === null);
    await goruntu(op, 'onay-unite');
    await op.click('#onay-sor [data-onay-ac="vazgec"]');
    await op.waitForSelector('[data-onay-ac="sor"]');
    dene('onay: Vazgeç hiçbir şey onaylamaz', (await onayKaydi()) === null && (await op.locator('#onay-sor').count()) === 0);
    await op.click('[data-onay-ac="sor"]');
    await op.click('#onay-sor [data-onay-ac="onayla"]');
    await op.waitForSelector('[data-onay-ac="geri-al"]');
    const uIds = u1.dersler.reduce((l, dd) => l.concat([dd.id], dd.alistirmalar.map(a => a.id)), []).concat(u1.kapi.sorular.map(s => s.id));
    const ok2 = JSON.parse(await onayKaydi() || '{}');
    dene('onay: ünite onayı dersleri, alıştırmaları ve kapı sorularını yazar; her ders «onaylı»', Object.keys(ok2).length === uIds.length && uIds.every(i => ok2['felsefe/1/' + i])
      && (await op.locator('[data-onay-sayfa="unite"] .b-pul--altin').count()) === u1.dersler.length + 1);
    await op.goto(T + '/kabuk/#/onay');
    await op.waitForSelector('[data-onay-sayfa="ana"]');
    await op.click('[data-onay-sayfa="ana"] summary:has-text("Onayları sakla")'); // dosya düğmesi kapalı bölümde (onay.js, içerik paketi)
    const [indi] = await Promise.all([op.waitForEvent('download'), op.click('[data-onay-ac="disari"]')]);
    const indiYol = path.join(gecici, 'onay-indi.json');
    await indi.saveAs(indiYol);
    const indiVeri = JSON.parse(fs.readFileSync(indiYol, 'utf8'));
    dene('onay: «Onayları dosya olarak al» kaydın aynısını JSON indirir', /^lifeos-onay-\d{4}-\d{2}-\d{2}\.json$/.test(indi.suggestedFilename()) && JSON.stringify(indiVeri) === JSON.stringify(ok2), indi.suggestedFilename());
    const kuru = require('child_process').spawnSync(process.platform === 'win32' ? 'python' : 'python3', [path.join(kok, 'tools/onay_uygula.py'), indiYol], { env, encoding: 'utf8' });
    dene('onay: indirilen dosya onay_uygula.py kuru koşusunda birebir eşleşir (yazmaz)', kuru.status === 0 && kuru.stdout.indexOf('alan/felsefe/asama-1.json: ' + uIds.length + ' öğe yazılacak') >= 0, kuru.stdout + kuru.stderr);
    await op.goto(T + '/kabuk/#/onay/felsefe/1/' + u1.id);
    await op.click('[data-onay-ac="geri-al"]');
    await op.waitForSelector('[data-onay-ac="sor"]');
    dene('onay: «Ünitenin onayını geri al» kaydı boşaltır', (await onayKaydi()) === null);
    // aşamanın hepsi: önce sorar, vazgeç yazmaz; onay yalnız aşama 1'i yazar, aşama 2 taslak kalır; geri al boşaltır
    await op.goto(T + '/kabuk/#/onay/felsefe');
    await op.click('[data-onay-ac="asama-sor"][data-asama="1"]');
    await op.waitForSelector('#onay-asama-sor');
    await op.click('[data-onay-ac="asama-vazgec"]');
    await op.waitForSelector('[data-onay-ac="asama-sor"][data-asama="1"]');
    dene('onay: «Aşamanın hepsini onayla» önce sorar; vazgeçince hiçbir şey yazılmaz', (await onayKaydi()) === null);
    await op.click('[data-onay-ac="asama-sor"][data-asama="1"]');
    await op.click('[data-onay-ac="asama-onayla"]');
    await op.waitForSelector('[data-onay-ac="asama-geri-al"][data-asama="1"]');
    const asamaKayit = Object.keys(JSON.parse((await onayKaydi()) || '{}'));
    dene('onay: aşama onayı yalnız aşama 1\'i yazar, orada bekleyen ders kalmaz; aşama 2 taslak kalır', asamaKayit.length > 0
      && asamaKayit.every(x => x.indexOf('felsefe/1/') === 0) && (await op.locator('[data-onay-ac="asama-sor"][data-asama="1"]').count()) === 0
      && (await op.locator('[data-onay-ac="asama-sor"][data-asama="2"]').count()) === 1, asamaKayit.length);
    await op.click('[data-onay-ac="asama-geri-al"][data-asama="1"]');
    await op.waitForSelector('[data-onay-ac="asama-sor"][data-asama="1"]');
    dene('onay: «Aşamanın onayını geri al» kaydı boşaltır', (await onayKaydi()) === null);
    dene('onay: konsolda hata yok', ohata.length === 0, ohata.join(' | '));
    await oc.close();

    // ---- İlk kullanımda yüklenen ekranlar (tur-20261118/yuk.md): açılışta yoklar; derin bağlantı, geri tuşu ve yenileme onları yükler ----
    const dc = await b.newContext({ viewport: { width: 1280, height: 800 } }), dhata = [];
    const dsayfa = async yol => { const x = await dc.newPage(); x.on('pageerror', e => dhata.push(e.message)); await x.goto(T + '/kabuk/' + yol); return x; };
    const betikler = x => x.evaluate(() => [...document.scripts].map(s => s.src).filter(s => /\/kabuk\/(hesap|hesap-giris|hesap-baglanti|hesap-yonetim|arama|deneme)\.js$/.test(s)).map(s => s.replace(/^.*\//, '')));
    const dp = await dsayfa('#/bugun');
    await dp.waitForSelector('#sayfa[data-ciz="bugun"]');
    dene('ilk kullanım: Bugün açılışında hesap, arama ve deneme betiği yüklenmez', (await betikler(dp)).length === 0, (await betikler(dp)).join(','));
    await dp.waitForFunction(() => [...document.scripts].some(s => /\/kabuk\/hesap-yonetim\.js$/.test(s.src)) && !!LIFEOS.Kabuk.HesapYonetim, null, { timeout: 15000 });
    dene('ilk kullanım: açılıştan sonra boşta önceden çekilir (hesap dörtlüsü, arama, deneme)', (await betikler(dp)).length === 6 && !!(await dp.evaluate(() => LIFEOS.Kabuk.Arama && LIFEOS.Kabuk.Deneme)), (await betikler(dp)).join(','));
    await dp.close();
    const dh = await dsayfa('#/hesap');
    await dh.waitForSelector('[data-arac="hesap"]');
    dene('derin bağlantı: #/hesap doğrudan açılınca Hesap ekranı (giriş uzantısıyla) çizilir', (await dh.locator('[data-arac="hesap"] form[data-hg-form], #hs-oturum').count()) >= 1 && (await dh.title()).indexOf('Hesap') === 0);
    await dh.click('.ust__sekmeler a[href="#/bugun"]'); await dh.waitForSelector('#sayfa[data-ciz="bugun"]');
    await dh.goBack(); await dh.waitForSelector('[data-arac="hesap"]');
    dene('geri tuşu: Bugün\'den geri dönünce Hesap yeniden çizilir', (await dh.evaluate(() => location.hash)) === '#/hesap');
    await dh.close();
    const da = await dsayfa('#/motor/arama?' + encodeURIComponent('sokrates'));
    await da.waitForSelector('[data-arama-grup="ders"]', { timeout: 20000 });
    dene('derin bağlantı: #/motor/arama?sokrates doğrudan açılınca sorgu alanda, ders sonuçları gelir', (await da.inputValue('[data-her-ara]')) === 'sokrates');
    await da.close();
    const dd = await dsayfa('#/motor/soru/deneme');
    await dd.waitForSelector('[data-deneme-sayfa]');
    await dd.reload(); await dd.waitForSelector('[data-deneme-sayfa]');
    dene('derin bağlantı ve yenileme: #/motor/soru/deneme deneme ekranını çizer (Soru sayfasına düşmez)', (await dd.locator('[data-deneme-sayfa]').count()) === 1);
    await dd.close();
    const dy = await dc.newPage(); dy.on('pageerror', e => dhata.push(e.message));
    await dy.route('**/kabuk/arama.js', r => r.abort());
    await dy.goto(T + '/kabuk/#/motor/arama'); await dy.waitForSelector('.b-bos');
    dene('yükleme düşerse sade hata («Bu bölüm yüklenemedi»), iskelet takılı kalmaz', /yüklenemedi/.test(await dy.textContent('#sayfa')) && (await dy.locator('#sayfa [aria-busy="true"]').count()) === 0);
    await dy.close();
    dene('ilk kullanım: sayfa hatası yok', dhata.length === 0, dhata.join(' | '));
    await dc.close();
    // ---- Hesap (#/hesap, faz7-hesap-kabuk.md): girişsiz, uydurma sahip hesabıyla oturum, cihaz çıkarma, kodla bağlama, güncelleme, çıkış.
    // En sonda: hesap kurulunca öteki adımların ortamı değişmesin. Güncelleme yanıtı taklit edilir (ağ yok); «Güncelle»ye basılmaz.
    const hc = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }), hp = await hc.newPage(), hhata = [];
    hp.on('pageerror', e => hhata.push(e.message));
    hp.on('console', m => { if (m.type() === 'error' && !/\/api\/hesap\/kabuk/.test(m.location().url || '')) hhata.push(m.text()); });
    await hp.goto(T + '/kabuk/#/ayarlar');
    await hp.click('a[href="#/hesap"]');
    await hp.waitForSelector('[data-arac="hesap"]');
    await hp.waitForFunction(() => /giriş yapılmadı|henüz hesap yok/.test(document.querySelector('[data-arac="hesap"]').textContent));
    // giriş uzantısı (kabuk/hesap-giris.js) Oturum bölümünün yerine kendi formunu çizer: eski panele gitmeye gerek yok
    dene('hesap: Ayarlar › Hesap ve güvenlik ekranı açar; girişsiz cihaz giriş ya da kurulum formunu burada görür', (await hp.locator('[data-arac="hesap"] form[data-hg-form]').count()) >= 1
      && (await hp.locator('#hs-cihazlar').count()) === 0);
    const hk = { headers: { 'X-LifeOS': 'hesap' } };
    const kurul = await hp.request.post(T + '/api/hesap/kur', Object.assign({ data: { ad: 'sahip', parola: 'gezi-parolasi-1', cihaz: 'cihazGEZ00002', cihaz_ad: 'iPhone' } }, hk));
    await hp.evaluate(() => window.LIFEOS.HESAP.girisYap('sahip', 'gezi-parolasi-1'));
    await hp.reload();
    await hp.waitForSelector('[aria-label="Bağlı cihazlar"]');
    const cihazSay = () => hp.locator('[aria-label="Bağlı cihazlar"] > li').count();
    dene('hesap: oturumda hesap adı, rol ve iki cihaz (bu cihaz işaretli, çıkarılamaz)', kurul.ok() && /sahip/.test(await hp.textContent('[data-arac="hesap"]')) && (await cihazSay()) === 2
      && (await hp.locator('[aria-label="Bağlı cihazlar"] li:has-text("bu cihaz") [data-hs-ac]').count()) === 0);
    dene('hesap: jeton çerezde, sayfada değil', await hp.evaluate(() => { const m = document.cookie.match(/lifeos_hesap=([^;]*)/), j = m && JSON.parse(decodeURIComponent(m[1])).j; return !!j && document.documentElement.outerHTML.indexOf(j) < 0; }));
    await hp.click('[data-hs-ac="cikar-sor"]');
    await hp.click('[data-hs-ac="vazgec"]');
    dene('hesap: cihaz çıkarma önce sorar; vazgeçince cihaz kalır', (await cihazSay()) === 2);
    await hp.click('[data-hs-ac="cikar-sor"]');
    await hp.click('[data-hs-ac="cikar"]');
    await hp.waitForFunction(() => /iPhone çıkarıldı/.test(document.querySelector('[data-arac="hesap"]').textContent));
    dene('hesap: onaylanınca öteki cihaz çıkar', (await cihazSay()) === 1);
    await hp.click('[data-hs-ac="bag"]');
    await hp.waitForSelector('[data-hs-kod]');
    const bkod = await hp.getAttribute('[data-hs-kod]', 'data-hs-kod');
    dene('hesap: yeni cihaz için altı haneli kod ve geri sayım', /^\d{6}$/.test(bkod) && /\d:\d\d kaldı/.test(await hp.textContent('[data-hs-sure]')), bkod);
    await goruntu(hp, 'hesap');
    const bag = await hp.request.post(T + '/api/hesap/bagla', Object.assign({ data: { kod: bkod, cihaz: 'cihazGEZ00003', cihaz_ad: 'iPad' } }, hk));
    const baglandi = await hp.waitForFunction(() => /iPad bağlandı/.test(document.querySelector('[data-arac="hesap"]').textContent), null, { timeout: 10000 }).then(() => true, () => false);
    await hp.waitForFunction(() => document.querySelectorAll('[aria-label="Bağlı cihazlar"] > li').length === 2, null, { timeout: 5000 }).catch(() => {});
    dene('hesap: kod kullanılınca ekran «bağlandı» der, cihaz listeye girer', bag.ok() && baglandi && (await cihazSay()) === 2);
    await hp.route('**/api/guncelleme**', r => r.fulfill({ json: { durum: 'ok', geride: 2, ileride: 0, yeni: ['Yeni Hesap ekranı', 'Düzeltme'], ag: true, surum: { tarih: '14.11.2026', kisa: 'abc1234' } } }));
    await hp.click('[data-hs-sekme][data-deger="sistem"]');
    dene('hesap: Sistem sekmesi adreste, yalnız sistem bölümleri görünür', (await hp.evaluate(() => location.hash)) === '#/hesap?sistem'
      && (await hp.locator('.hs-govde > .b-bolum:visible:not([data-hs-grup="sistem"])').count()) === 0);
    await hp.click('[data-hs-ac="denetle"]');
    await hp.waitForSelector('[data-hs-ac="guncelle"]');
    const gm = await hp.textContent('[aria-labelledby="hs-guncel"]');
    dene('hesap: güncelleme denetlenir; kurulu sürüm, yenilikler ve bu bilgisayarda «Güncelle»', /14\.11\.2026 · abc1234/.test(gm) && /2 yenilik var/.test(gm) && /Yeni Hesap ekranı/.test(gm), gm);
    await hp.click('[data-hs-ac="cikis-sor"]');
    await hp.click('[data-hs-ac="cikis"]');
    await hp.waitForFunction(() => /giriş yapılmadı/.test(document.querySelector('[data-arac="hesap"]').textContent));
    dene('hesap: çıkış onaylanınca oturum kapanır, cihaz bölümü gider', (await hp.locator('#hs-cihazlar').count()) === 0 && !(await hp.evaluate(() => /lifeos_hesap=[^;]/.test(document.cookie))));
    dene('hesap: konsolda hata yok', hhata.length === 0, hhata.join(' | '));
    await hc.close();

    // ---- Ekran hatası tek kapının günlüğüne gider (kabuk.js → /api/kabuk/hata; yalnız yerel, sessiz) ----
    const ec = await b.newContext(), ep = await ec.newPage();
    await ep.goto(T + '/kabuk/#/bugun');
    await ep.waitForSelector('.b-karsilama');
    await ep.evaluate(() => setTimeout(() => { throw new Error('gezi deneme hatası'); }));
    const gunluk = path.join(gecici, 'LifeOS', 'kabuk-hata.log');
    let gm2 = '';
    for (let i = 0; i < 20 && !/gezi deneme hatası/.test(gm2); i++) { await ep.waitForTimeout(150); try { gm2 = fs.readFileSync(gunluk, 'utf8'); } catch (e) { /* henüz yok */ } }
    dene('hata ucu: ekran hatası iletisi, yığını ve sayfası günlüğe yazılır', /gezi deneme hatası/.test(gm2) && /"sayfa": "#\/bugun"/.test(gm2) && /"yigin": "Error/.test(gm2), gm2.slice(-300));
    // yakalanmamış söz reddi de gider (tur «soz»), aynı sayaçla
    await ep.evaluate(() => { Promise.reject(new Error('gezi söz reddi')); });
    for (let i = 0; i < 20 && !/gezi söz reddi/.test(gm2); i++) { await ep.waitForTimeout(150); try { gm2 = fs.readFileSync(gunluk, 'utf8'); } catch (e) { /* henüz yok */ } }
    dene('hata ucu: yakalanmamış söz reddi «soz» türüyle günlüğe yazılır', gm2.split(/\r?\n/).some(l => /gezi söz reddi/.test(l) && /"tur": "soz"/.test(l)), gm2.slice(-300));
    await ec.close();
  } finally {
    await b.close(); srv.kill();
    try { fs.rmSync(gecici, { recursive: true, force: true }); } catch (e) { /* geçici klasör kalabilir */ }
  }
  console.log(kalan ? kalan + ' kaldı' : 'hepsi geçti');
  process.exit(kalan ? 1 : 0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
