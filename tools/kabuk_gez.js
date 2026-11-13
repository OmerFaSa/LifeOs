// KABUK GEZISI: tek kapiyi yalitilmis ortamda (gecici LOCALAPPDATA, HKM'siz, deneme portu) acar ve yeni kabukta
// Felsefe pilotunun ilk unitesini gercek tarayiciyla yurur: Bugun, ders, alistirma, «Okudum», unite kapisi, kayit.
// Kullanim: node tools/kabuk_gez.js [--goruntu]   (--goruntu: belgeler/ekip/sadelesme/kabuk-onizleme/ goruntulerini yeniler)
const kok = require('path').resolve(__dirname, '..'), GORUNTU = process.argv.includes('--goruntu');
const { chromium } = require(kok + '/SPI/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');

const PORT = 4397, T = 'http://127.0.0.1:' + PORT;
const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'kabuk-gez-'));
const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1', LOCALAPPDATA: gecici, APPDATA: gecici });
const srv = spawn(process.platform === 'win32' ? 'python' : 'python3', [path.join(kok, 'sistem/tekkapi.py'), '--port', String(PORT), '--hkm-ayri'], { env, stdio: 'ignore' });
const bekle = () => new Promise((res, rej) => {
  const son = Date.now() + 40000;
  (function dene() {
    http.get(T + '/kabuk/', r => { r.resume(); res(); }).on('error', () => Date.now() > son ? rej(new Error('sunucu açılmadı')) : setTimeout(dene, 300));
  })();
});
const cikti = path.join(kok, 'belgeler/ekip/sadelesme/kabuk-onizleme');
let kalan = 0;
const dene = (ad, kosul, ek) => { if (!kosul) kalan++; console.log((kosul ? '✓ ' : '✕ ') + ad + (kosul || ek == null ? '' : '  → ' + ek)); };

(async () => {
  const y = JSON.parse(fs.readFileSync(path.join(kok, 'alan/felsefe/asama-1.json'), 'utf8'));
  const u1 = y.uniteler[0], harf = 'ABCD';
  await bekle();
  const b = await chromium.launch();
  try {
    const c = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
    const p = await c.newPage(); const hata = [];
    p.on('pageerror', e => { hata.push(e.message); console.log('  sayfa hatası: ' + e.message); });
    p.on('console', m => { if (m.type() === 'error') hata.push(m.text()); });

    await p.goto(T + '/kabuk/');
    await p.waitForSelector('.karsila .dugme--ana');
    await p.waitForFunction(() => /ders\//.test(document.querySelector('.karsila .dugme--ana').getAttribute('href')));
    dene('Bugün: «Başla» ilk derse götürür', (await p.getAttribute('.karsila .dugme--ana', 'href')) === '#/alan/felsefe/ders/' + u1.dersler[0].id);

    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.unitekutu');
    dene('Felsefe: üç ünite + aşama kapısı çizildi', (await p.locator('.unitekutu').count()) === 4);
    dene('Felsefe: ikinci ünite kilitli', (await p.locator('.unitekutu').nth(1).locator('.satir--kilitli').count()) >= 3);
    dene('Felsefe: eski sayfa bağlantısı tek kapı yolunda', (await p.getAttribute('.eylemler .dugme--sade', 'href')) === '/esp/');
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'felsefe-masaustu-koyu.png'), fullPage: true });

    for (let i = 0; i < u1.dersler.length; i++) {
      const d = u1.dersler[i];
      await p.goto(T + '/kabuk/#/alan/felsefe/ders/' + d.id);
      await p.waitForSelector('article.ders h1');
      dene('ders ' + (i + 1) + ': başlık ve ' + d.metin.length + ' paragraf', (await p.textContent('article.ders h1')) === d.ad && (await p.locator('article.ders > p').count()) >= d.metin.length + 1);
      const a = d.alistirmalar[0], yanlis = harf[(harf.indexOf(a.dogru) + 1) % a.sec.length];
      const soru = p.locator('.soru[data-soru="' + a.id + '"]');
      if (i === 0) {
        await soru.locator('[data-cevap="' + yanlis + '"]').click();
        dene('ders 1: yanlış cevap «Yanlış.» der ve doğruyu işaretler', /Yanlış/.test(await soru.locator('.soru__sonuc').textContent()) && (await soru.locator('.secenek--dogru').getAttribute('data-cevap')) === a.dogru);
      }
      await soru.locator('[data-cevap="' + a.dogru + '"]').click();
      dene('ders ' + (i + 1) + ': doğru cevap «Doğru.» der', /Doğru/.test(await soru.locator('.soru__sonuc').textContent()));
      if (GORUNTU && i === 0) await p.screenshot({ path: path.join(cikti, 'ders-masaustu-koyu.png'), fullPage: true });
      await p.click('[data-ac="okudum"]');
      const beklenen = i < u1.dersler.length - 1 ? '#/alan/felsefe/ders/' + u1.dersler[i + 1].id : '#/alan/felsefe/kapi/' + u1.id;
      await p.waitForFunction(h => location.hash === h, beklenen).catch(() => {});
      dene('ders ' + (i + 1) + ': «Okudum» sıradaki adıma götürür', (await p.evaluate(() => location.hash)) === beklenen, await p.evaluate(() => location.hash));
    }

    await p.waitForSelector('form.kapi');
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'kapi-masaustu-koyu.png'), fullPage: true });
    await p.click('form.kapi button[type=submit]');
    await p.waitForSelector('.kapisonuc');
    dene('kapı: boş deneme geçirmez', /olmadı/.test(await p.textContent('.kapisonuc')) && /0\/4/.test(await p.textContent('.kapisonuc')));
    for (const q of u1.kapi.sorular) await p.check('input[name="' + q.id + '"][value="' + q.dogru + '"]');
    await p.click('form.kapi button[type=submit]');
    await p.waitForSelector('.kapisonuc--gecti');
    const metin = await p.textContent('.kapisonuc');
    dene('kapı: dört doğruyla geçilir, sonuç etiketli', /Geçtin/.test(metin) && /4\/4/.test(metin) && /ölçüldü/.test(metin) && /taslak/.test(metin), metin);
    dene('kapı: «Sıradaki» ikinci ünitenin ilk dersi', (await p.getAttribute('.kapisonuc .dugme--ana', 'href')) === '#/alan/felsefe/ders/' + y.uniteler[1].dersler[0].id);

    await p.reload();
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.unitekutu');
    dene('kayıt yenilemeden sonra duruyor: 3/9 ders, 1/3 kapı', /3\/9 ders okundu · 1\/3/.test(await p.textContent('.govde')));
    dene('ikinci ünite açıldı: ilk dersi ve kapısı bağlantı, sonraki iki ders kilitli', (await p.locator('.unitekutu').nth(1).locator('a.satir').count()) === 2 && (await p.locator('.unitekutu').nth(1).locator('.satir--kilitli').count()) === 2);
    await p.goto(T + '/kabuk/#/alan/felsefe/kapi/' + y.id);
    await p.waitForSelector('.yuva');
    dene('aşama kapısı üniteler bitmeden kilitli', /bütün ünite kapıları/.test(await p.textContent('.yuva')));
    await p.goto(T + '/kabuk/#/alan/felsefe/ders/yok.boyle');
    await p.waitForSelector('.yuva');
    dene('bilinmeyen ders açık bir iletiyle karşılanır', /Böyle bir ders yok/.test(await p.textContent('.yuva')));
    // ---- öteki taşınan alanlar: Tarih, Dil, Akademik ----
    for (const alan of ['tarih', 'dil', 'akademik']) {
      const v = JSON.parse(fs.readFileSync(path.join(kok, 'alan', alan, 'asama-1.json'), 'utf8')), d1 = v.uniteler[0].dersler[0];
      await p.goto(T + '/kabuk/#/alan/' + alan);
      await p.waitForSelector('.unitekutu');
      dene(alan + ': yol haritası ' + v.uniteler.length + ' ünite + aşama kapısı', (await p.locator('.unitekutu').count()) === v.uniteler.length + 1);
      dene(alan + ': ' + (v.uniteler.length > 4 ? 'yalnız ilk ünite açık gelir' : 'bütün üniteler açık gelir'),
        (await p.locator('details.unitekutu[open]').count()) === (v.uniteler.length > 4 ? 1 : v.uniteler.length));
      dene(alan + ': «Başla» ilk derse götürür', (await p.getAttribute('.eylemler .dugme--ana', 'href')) === '#/alan/' + alan + '/ders/' + d1.id);
      await p.click('.eylemler .dugme--ana');
      await p.waitForSelector('article.ders h1');
      dene(alan + ': ilk ders açılır', (await p.textContent('article.ders h1')) === d1.ad);
      const a = d1.alistirmalar.find(x => x.tur === 'secmeli');
      if (a) {
        await p.click('.soru[data-soru="' + a.id + '"] [data-cevap="' + a.dogru + '"]');
        dene(alan + ': alıştırma doğru cevabı tanır', /Doğru/.test(await p.textContent('.soru[data-soru="' + a.id + '"] .soru__sonuc')));
      }
      await p.click('[data-ac="okudum"]');
      await p.waitForFunction(h => location.hash !== h, '#/alan/' + alan + '/ders/' + d1.id);
      if (GORUNTU && alan === 'akademik') { await p.goto(T + '/kabuk/#/alan/akademik'); await p.waitForSelector('.unitekutu'); await p.screenshot({ path: path.join(cikti, 'akademik-masaustu-koyu.png') }); }
    }
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.unitekutu');
    dene('alanların kaydı ayrı: Felsefe hâlâ 3/9 ders, 1/3 kapı', /3\/9 ders okundu · 1\/3/.test(await p.textContent('.govde')));
    await p.goto(T + '/kabuk/#/alan/akademik');
    await p.waitForSelector('.unitekutu');
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForFunction(() => /Akademik/.test((document.querySelector('.karsila__sira') || {}).textContent || ''));
    dene('Bugün son çalışılan alanla karşılar (Akademik)', /akademik\/(ders|kapi)\//.test(await p.getAttribute('.karsila .dugme--ana', 'href')));
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.unitekutu');

    // ---- Not ----
    p.on('dialog', x => x.accept());
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('[data-arac="not"]');
    dene('not: boş defter öyle der', /Henüz not yok/.test(await p.textContent('#not-liste')));
    await p.click('a[href="#/motor/not/yeni"]');
    await p.waitForSelector('form.notform');
    await p.click('form.notform button[type=submit]');
    dene('not: boş not kaydedilmez, nedeni yazılır', /boş not kaydedilmez/.test(await p.textContent('.notform__ileti')));
    await p.fill('input[name=baslik]', 'Erdem');
    await p.fill('textarea[name=govde]', 'Erdem bilgi midir? #etik');
    await p.click('form.notform button[type=submit]');
    await p.waitForFunction(() => /^#\/motor\/not\/n\w+$/.test(location.hash) && /Kaydedildi/.test((document.querySelector('.notform__ileti') || {}).textContent || ''));
    dene('not: kaydedildi ve kendi adresine geçti', /Kaydedildi/.test(await p.textContent('.notform__ileti')));
    const erdem = await p.evaluate(() => location.hash);
    await p.goto(T + '/kabuk/#/motor/not/yeni');
    await p.waitForSelector('select[data-bag-ekle]');
    await p.fill('input[name=baslik]', 'Sokrates');
    await p.fill('textarea[name=govde]', 'Sorarak düşündü. ');
    await p.selectOption('select[data-bag-ekle]', { index: 1 });
    dene('not: bağ ekle gövdeye kimlikli bağ yazar', /\[\[not:n\w+\|Erdem\]\]/.test(await p.inputValue('textarea[name=govde]')), await p.inputValue('textarea[name=govde]'));
    await p.click('form.notform button[type=submit]');
    await p.waitForFunction(h => /^#\/motor\/not\/n\w+$/.test(location.hash) && location.hash !== h, erdem);
    dene('not: «Bu nottaki bağlar» Erdem notuna gider', (await p.getAttribute('.baglar a', 'href')) === erdem);
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'not-masaustu-koyu.png'), fullPage: true });
    await p.goto(T + '/kabuk/' + erdem);
    await p.waitForSelector('.baglar');
    dene('not: «Bu nota bağlananlar» Sokrates notunu gösterir', /Sokrates/.test(await p.textContent('.baglar')));
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('#not-liste a.satir');
    dene('not: iki not listede', (await p.locator('#not-liste a.satir').count()) === 2);
    await p.fill('[data-not-ara]', 'sokr');
    dene('not: arama «sokr» tek notu bulur', (await p.locator('#not-liste a.satir').count()) === 1 && /Sokrates/.test(await p.textContent('#not-liste')));
    await p.fill('[data-not-ara]', '#etik');
    dene('not: «#etik» etiketli notu süzer', (await p.locator('#not-liste a.satir').count()) === 1 && /Erdem/.test(await p.textContent('#not-liste')));
    await p.reload();
    await p.waitForSelector('#not-liste a.satir');
    dene('not: yenilemeden sonra iki not duruyor', (await p.locator('#not-liste a.satir').count()) === 2);

    // ---- Tekrar ----
    await p.goto(T + '/kabuk/#/motor/tekrar');
    await p.waitForSelector('form.kartform');
    dene('tekrar: kartsız açılış öyle der', /Henüz kart yok/.test(await p.textContent('[data-arac="tekrar"]')));
    await p.click('form.kartform button[type=submit]');
    dene('tekrar: boş kart eklenmez', /iki yüzü de dolu/.test(await p.textContent('.kartform .notform__ileti')));
    await p.fill('input[name=on]', 'Arkhe nedir?');
    await p.fill('textarea[name=arka]', 'Evrenin ilk maddesi.');
    await p.click('form.kartform button[type=submit]');
    await p.waitForSelector('.kart');
    dene('tekrar: kartın önü görünür, arkası gizli', /Arkhe/.test(await p.textContent('.kart__on')) && (await p.locator('.kart__arka').count()) === 0);
    await p.click('[data-arac-ac="kart-goster"]');
    await p.waitForSelector('.kart__arka');
    dene('tekrar: cevap ve dört not düğmesi aralıklarıyla', /ilk maddesi/.test(await p.textContent('.kart__arka')) && (await p.locator('.notlar .dugme').count()) === 4 && /şimdi/.test(await p.textContent('.notlar .dugme >> nth=0')) && /gün/.test(await p.textContent('.notlar .dugme >> nth=2')));
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'tekrar-masaustu-koyu.png'), fullPage: true });
    await p.click('[data-arac-ac="kart-not"][data-not="1"]');
    await p.waitForSelector('[data-arac-ac="kart-goster"]');
    dene('tekrar: «Yine» kartı aynı gün yeniden sorar', /Arkhe/.test(await p.textContent('.kart__on')));
    await p.click('[data-arac-ac="kart-goster"]');
    await p.click('[data-arac-ac="kart-not"][data-not="3"]');
    await p.waitForSelector('.kapisonuc--gecti');
    dene('tekrar: «İyi» sonrası bugünlük biter, iki cevap sayılır', /Bugünlük bitti/.test(await p.textContent('.kapisonuc')) && /2 cevap/.test(await p.textContent('.kapisonuc')));
    await p.click('details.kaynak summary');
    dene('tekrar: kart listesinde hatırlama tahmin etiketli', /\(tahmin\)/.test(await p.textContent('.kartliste')));
    await p.click('[data-arac-ac="kart-sil"]');
    await p.waitForFunction(() => /Henüz kart yok/.test(document.querySelector('[data-arac="tekrar"]').textContent));
    dene('tekrar: kart silinir', true);

    // ---- Kayıt ----
    await p.goto(T + '/kabuk/#/motor/kayit');
    await p.waitForSelector('form.kayitform');
    dene('kayıt: boş gün öyle der, sıfır göstermez', /Bugün için kayıt yok/.test(await p.textContent('[data-arac="kayit"]')));
    dene('kayıt: kural bölümü eksik profili adıyla söyler, sayı uydurmaz', /Enerji hedefi için eksik: .*boy/.test(await p.textContent('[data-kural]'))
      && !/kcal/.test(await p.textContent('[data-kural]')));
    await p.fill('input[name=ml]', '99999');
    await p.click('form.kayitform button[type=submit]');
    dene('kayıt: sınır dışı sayı motorun cümlesiyle reddedilir, yazılan durur', /1 ile 8000 ml/.test(await p.textContent('.kayitform .notform__ileti')) && (await p.inputValue('input[name=ml]')) === '99999');
    await p.fill('input[name=ml]', '500');
    await p.click('form.kayitform button[type=submit]');
    await p.waitForSelector('.ozet li');
    dene('kayıt: su toplamı özetinde «hesaplandı», kaydın kendisi «ölçüldü» etiketiyle', /500 ml/.test(await p.textContent('.ozet')) && /hesaplandı/.test(await p.textContent('.ozet')) && /500 ml \(ölçüldü\)/.test(await p.textContent('.kartliste')));
    await p.selectOption('select[data-kayit-tur]', 'uyku');
    await p.waitForSelector('input[name=saat]');
    await p.fill('input[name=saat]', '7,5');
    await p.check('input[name=tahmin]');
    await p.click('form.kayitform button[type=submit]');
    await p.waitForFunction(() => /Gece uykusu/.test(document.querySelector('.ozet').textContent));
    dene('kayıt: tahmin işaretli uyku «tahmin» etiketiyle', /7,5 saat/.test(await p.textContent('.ozet')) && /tahmin/.test(await p.textContent('.ozet')));
    dene('kayıt: uyku girilince günün antrenman kararı etiketli', /Bugünkü antrenman/.test(await p.textContent('[data-kural]')) && /hesaplandı/.test(await p.textContent('[data-kural]')));
    await p.goto(T + '/kabuk/#/ayarlar');
    await p.waitForSelector('[data-ayar-satir="lifeos.beden.boy"] input');
    await p.fill('[data-ayar-satir="lifeos.beden.boy"] input', '165');
    await p.fill('[data-ayar-satir="lifeos.beden.dogumYili"] input', '1990');
    await p.click('[data-ayar-satir="lifeos.beden.cinsiyet"] [data-deger="kadin"]');
    await p.fill('[data-ayar-satir="lifeos.beden.boy"] input', '999');
    await p.dispatchEvent('[data-ayar-satir="lifeos.beden.boy"] input', 'change');
    dene('ayarlar: Beden › boy aralık dışını yazmaz, alanı geçersiz işaretler', (await p.evaluate(() => localStorage.getItem('lifeos.beden.boy'))) === '165'
      && (await p.getAttribute('[data-ayar-satir="lifeos.beden.boy"] input', 'aria-invalid')) === 'true');
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
    await p.waitForFunction(() => document.querySelectorAll('.kartliste li').length === 2);
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'kayit-masaustu-koyu.png'), fullPage: true });
    await p.reload();
    await p.waitForSelector('.kartliste li');
    dene('kayıt: yenilemeden sonra iki kayıt duruyor', (await p.locator('.kartliste li').count()) === 2);
    await p.click('[data-arac-ac="kayit-sil"] >> nth=0');
    await p.waitForFunction(() => document.querySelectorAll('.kartliste li').length === 1);
    dene('kayıt: kayıt silinir, özet güncellenir', !/Gece uykusu/.test(await p.textContent('.ozet')));

    // ---- Plan ----
    await p.goto(T + '/kabuk/#/motor/plan');
    await p.waitForSelector('[data-arac="plan"]');
    dene('plan: boş zaman yokken önce onu ister', /Önce aşağıya/.test(await p.textContent('[data-arac="plan"]')) && (await p.locator('[data-arac-ac="plan-kur"]').count()) === 0);
    await p.fill('form[data-plan="aralik"] input[name=bas]', '12:00');
    await p.fill('form[data-plan="aralik"] input[name=bit]', '09:00');
    await p.click('form[data-plan="aralik"] button[type=submit]');
    dene('plan: ters aralık motorun cümlesiyle reddedilir', /başlamadan bitiyor/.test(await p.textContent('[data-arac="plan"] .notform__ileti')));
    await p.fill('form[data-plan="aralik"] input[name=bas]', '09:00');
    await p.fill('form[data-plan="aralik"] input[name=bit]', '12:00');
    await p.click('form[data-plan="aralik"] button[type=submit]');
    await p.waitForSelector('[data-arac-ac="plan-kur"]');
    await p.fill('form[data-plan="is"] input[name=ad]', 'Rapor');
    await p.fill('form[data-plan="is"] input[name=dk]', 'abc');
    await p.click('form[data-plan="is"] button[type=submit]');
    dene('plan: süresi sayı olmayan iş reddedilir', /süresi 1–720 dakika/.test(await p.textContent('[data-arac="plan"] .notform__ileti')));
    await p.fill('form[data-plan="is"] input[name=ad]', 'Rapor');
    await p.fill('form[data-plan="is"] input[name=dk]', '30');
    await p.click('form[data-plan="is"] button[type=submit]');
    await p.waitForSelector('[data-arac-ac="plan-is-sil"]');
    await p.click('[data-arac-ac="plan-kur"]');
    await p.waitForSelector('.bloklar .blok');
    const blokMetni = await p.textContent('.bloklar');
    dene('plan: iş 09:00\'da, dersler ve mola ardından yerleşir', /09:00–09:30/.test(blokMetni) && /Rapor/.test(blokMetni) && /Mola/.test(blokMetni) && (await p.locator('.blok--ders').count()) >= 1, blokMetni.slice(0, 200));
    dene('plan: özet etiketli (hesaplandı)', /Planlanan \d+ dk \(hesaplandı\)/.test(await p.textContent('[data-arac="plan"]')));
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'plan-masaustu-koyu.png'), fullPage: true });
    await p.click('.blok--is [data-durum="atlandi"]');
    dene('plan: nedensiz atlama motorun cümlesiyle reddedilir', /neden yazılmalı/.test(await p.textContent('[data-arac="plan"] .notform__ileti')));
    await p.click('.blok--is [data-durum="yapildi"]');
    await p.waitForSelector('.blok--is.blok--bitti');
    dene('plan: «Yapıldı» bloğu işaretler', /yapıldı/.test(await p.textContent('.blok--is')));
    await p.click('[data-arac-ac="plan-kur"]');
    await p.waitForSelector('.blok--is.blok--bitti');
    dene('plan: yeniden kurunca yapılan blok yerinde kalır', /09:00–09:30/.test(await p.textContent('.blok--is')));
    await p.reload();
    await p.waitForSelector('.bloklar .blok');
    dene('plan: yenilemeden sonra plan duruyor', (await p.locator('.blok--is.blok--bitti').count()) === 1);
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('.karsila__plan');
    dene('Bugün: planın sıradaki bloğunu gösterir', /Planda sırada: \d\d:\d\d/.test(await p.textContent('.karsila__plan')), await p.textContent('.karsila__plan'));

    // ---- Soru: karma test (etkin alan Felsefe) ----
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.unitekutu');
    await p.goto(T + '/kabuk/#/motor/soru');
    await p.waitForSelector('[data-arac-ac="soru-basla"]');
    dene('soru: başlangıçta alan ve havuz yazılı', /Felsefe alanının/.test(await p.textContent('[data-arac="soru"]')) && /Havuzda \d+ soru/.test(await p.textContent('[data-arac="soru"]')));
    await p.click('[data-arac-ac="soru-basla"]');
    await p.waitForSelector('.soru[data-sira="0"]');
    const felsefeSorular = {};
    y.uniteler.forEach(u => u.dersler.forEach(dd => dd.alistirmalar.forEach(a => { felsefeSorular[a.soru] = a; })));
    const soruMetni = async () => felsefeSorular[await p.textContent('.soru legend')];
    let sq = await soruMetni();
    await p.click('[data-arac-ac="soru-cevap"][data-h="' + sq.dogru + '"]');
    dene('soru: doğru cevap «Doğru.» der, şıklar kilitlenir', /Doğru/.test(await p.textContent('.soru__sonuc')) && (await p.locator('.secenek[disabled]').count()) === sq.sec.length);
    await p.click('[data-arac-ac="soru-sonraki"]');
    await p.waitForSelector('.soru[data-sira="1"]');
    sq = await soruMetni();
    await p.click('[data-arac-ac="soru-cevap"][data-h="' + 'ABCD'[('ABCD'.indexOf(sq.dogru) + 1) % sq.sec.length] + '"]');
    dene('soru: yanlış cevap «Yanlış.» der ve doğruyu işaretler', /Yanlış/.test(await p.textContent('.soru__sonuc')) && (await p.getAttribute('.secenek--dogru', 'data-h')) === sq.dogru);
    await p.click('[data-arac-ac="soru-sonraki"]');
    await p.waitForSelector('.soru[data-sira="2"]');
    await p.click('[data-arac-ac="soru-bak"]');
    dene('soru: çözüme bakınca doğru sayılmaz', /doğru sayılmaz/.test(await p.textContent('.soru__sonuc')));
    await p.reload();
    await p.waitForSelector('.soru[data-sira]');
    dene('soru: yenilemeden sonra test kaldığı yerden sürer', (await p.getAttribute('.soru[data-sira]', 'data-sira')) === '3');
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'soru-masaustu-koyu.png'), fullPage: true });
    await p.click('[data-arac-ac="soru-bitir"]');
    await p.waitForSelector('.kapisonuc');
    const sonucMetni = await p.textContent('.kapisonuc');
    dene('soru: sonuç 1 doğru, 1 yanlış, 1 bakıldı, kalanı boş; etiketli', /^1 \/ \d+ doğru/.test(sonucMetni) && /1 yanlış/.test(sonucMetni) && /1 çözüme bakıldı/.test(sonucMetni) && /ölçüldü/.test(sonucMetni), sonucMetni);
    await p.click('[data-arac-ac="soru-yeni"]');
    await p.waitForSelector('[data-arac-ac="soru-basla"]');
    dene('soru: biten test «Son testler»de', /1 doğru · 1 yanlış/.test(await p.textContent('[data-arac="soru"] .ozet')));

    // ---- Yol haritası listesi, komut çubuğu, Hesap ----
    await p.goto(T + '/kabuk/#/motor/yol');
    await p.waitForSelector('a.satir[href="#/alan/felsefe"]');
    dene('yol: Felsefe ilerlemesiyle listelenir', /3\/9 ders okundu/.test(await p.textContent('a.satir[href="#/alan/felsefe"]')));
    await p.waitForFunction(() => /1\/368 ders okundu/.test((document.querySelector('a.satir[href="#/alan/akademik"]') || {}).textContent || '')).catch(() => {});
    dene('yol: dört alan ilerlemesiyle listelenir', (await p.locator('[data-arac="yol"] a.satir').count()) === 4 && /1\/368 ders okundu/.test(await p.textContent('a.satir[href="#/alan/akademik"]')) && /1\/9 ders okundu/.test(await p.textContent('a.satir[href="#/alan/tarih"]')));
    await p.keyboard.press('Control+k');
    await p.fill('#komut input', 'yeni not');
    await p.keyboard.press('Enter');
    const acildi = await p.waitForSelector('form.notform[data-not="yeni"]', { timeout: 5000 }).then(() => true, () => false);
    dene('komut çubuğu: «Yeni not» boş not formunu açar', acildi && (await p.evaluate(() => location.hash)) === '#/motor/not/yeni');
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForFunction(() => window.LIFEOS && window.LIFEOS.HESAP);
    dene('Hesap yüklendi; oturum yokken selam adsız', await p.evaluate(() => LIFEOS.HESAP.durum().oturum === null && /^(Günaydın|İyi günler|İyi akşamlar|İyi geceler)\.$/.test(document.querySelector('.karsila__selam').textContent)), await p.textContent('.karsila__selam'));
    dene('konsolda hata yok', hata.length === 0, hata.join(' | '));
    await c.close();

    const t = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
    const tp = await t.newPage();
    await tp.goto(T + '/kabuk/#/alan/felsefe/ders/' + u1.dersler[0].id);
    await tp.waitForSelector('article.ders h1');
    dene('telefon: yatay taşma yok', await tp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await tp.evaluate(() => document.documentElement.scrollWidth));
    if (GORUNTU) await tp.screenshot({ path: path.join(cikti, 'ders-telefon-acik.png'), fullPage: true });
    await t.close();
  } finally {
    await b.close(); srv.kill();
    try { fs.rmSync(gecici, { recursive: true, force: true }); } catch (e) { /* geçici klasör kalabilir */ }
  }
  console.log(kalan ? kalan + ' kaldı' : 'hepsi geçti');
  process.exit(kalan ? 1 : 0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
