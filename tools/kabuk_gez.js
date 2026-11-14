// KABUK GEZISI: tek kapiyi yalitilmis ortamda (gecici LOCALAPPDATA, HKM'siz, deneme portu) acar ve yeni kabukta
// on alani ve arac ekranlarini gercek tarayiciyla yurur: Bugun, ders, alistirma, unite kapisi, Not, Tekrar, Kayit, Plan, Soru,
// sureli deneme ve prova, Tanisma, asamalar (Felsefe'nin ikinci asamasi; dosya yoksa yapay asama yalniz tarayiciya verilir).
// Kullanim: node tools/kabuk_gez.js [--goruntu | --goruntu=hafta,kayit-hafta]   (--goruntu: belgeler/ekip/sadelesme/kabuk-onizleme/ goruntulerini yeniler;
// =onekler: yalniz adi bu oneklerle baslayan dort gorunumlu goruntuler, otekilere dokunulmaz)
const kok = require('path').resolve(__dirname, '..'), GORUNTU = process.argv.includes('--goruntu');
const SECILI = ((process.argv.find(a => a.indexOf('--goruntu=') === 0) || '').slice(10)).split(',').filter(Boolean);
const { chromium } = require(kok + '/SPI/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');

const PORT = 4397, T = 'http://127.0.0.1:' + PORT;
const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'kabuk-gez-'));
const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1', LOCALAPPDATA: gecici, APPDATA: gecici, LIFEOS_TASIMA: '1',
  LIFEOS_HESAP_KLASOR: path.join(gecici, 'LifeOS', 'hesap') }); // hesap klasörü Linux'ta LOCALAPPDATA'ya bakmaz: göç paketleri onun yanındaki goc/paket'ten okunur // köken taşıması ucu: gerçekte yalnız tek kapı devredeyken açık
// Başlangıç paketi (tools/kabuk_baslangic.py çıktısının biçimi): eski sistemden bir not ve bir kayıt
fs.mkdirSync(path.join(gecici, 'LifeOS', 'veri'), { recursive: true });
fs.writeFileSync(path.join(gecici, 'LifeOS', 'veri', 'kabuk-baslangic.json'), JSON.stringify({ lifeos_kabuk_baslangic: 1, kimlik: 'gezi-paketi', uretildi: 1,
  say: { notlar: 1, kayitlar: 1, kartlar: 0 }, beden: { boy: 175, dogumYili: 2001 },
  notlar: [{ id: 'eski-not-1', baslik: 'Eski defterden', govde: 'Eski sistemde yazılmış not.', alan: '', etiketler: [], kaynak: { yapi: 'defter' }, olusturma: 1000, guncelleme: 1000,
    ozel: false, tur: 'not', klasor: '', sabit: false, baglam: null, ozellik: {} }],
  kayitlar: [{ id: 'kilo:2026-10-20:0', tur: 'kilo', gun: '2026-10-20', zaman: null, kaynak: 'goc', deger: { kg: { v: 70, k: 'eski' } }, ek: {} }], kartlar: [] }));
// Köken taşıması: eski AYS kökeninin göç paketi (biçim brand/ortak/gocpaket.js)
fs.mkdirSync(path.join(gecici, 'LifeOS', 'goc', 'paket'), { recursive: true });
fs.writeFileSync(path.join(gecici, 'LifeOS', 'goc', 'paket', 'ays-cGEZ-20261114-000000-abcdef.json'), JSON.stringify({ lifeos_goc: 1, kaynak: 'ays', cihaz: 'cGEZ', parca: 1,
  profiller: { main: { data: { gezi: { isaret: 'eski-kokenden' } } } }, anahtarlar: { 'lifeos.king.bas.ays': { x: 1 }, 'lifeos.gezi.metin': 'duz metin' }, bekleyen: {}, atlanan: { sir: 0, ornek: 0 }, medya: [] }));
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
// alan sayfasının ilerleme çubukları «değer/toplam · …» (okunan ders, geçilen ünite kapısı)
const ilerleme = s => s.$$eval('.govde [role=progressbar]', l => l.map(x => x.getAttribute('aria-valuenow') + '/' + x.getAttribute('aria-valuemax')).join(' · '));
// dört görünüm (1280/390 × açık/koyu) aynı sayfada; telefonda yatay taşma her koşuda denetlenir, görüntü yalnız --goruntu ile
async function goruntu(p, ad) {
  for (const [w, h, vad] of [[1280, 800, 'masaustu'], [390, 844, 'telefon']]) for (const tm of ['acik', 'koyu']) {
    await p.setViewportSize({ width: w, height: h }); await p.emulateMedia({ colorScheme: tm === 'koyu' ? 'dark' : 'light' });
    if (w === 390 && tm === 'acik') dene(ad + ': telefonda yatay taşma yok', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await p.evaluate(() => document.documentElement.scrollWidth));
    if (GORUNTU || SECILI.some(x => ad.indexOf(x) === 0)) await p.screenshot({ path: path.join(cikti, ad + '-' + vad + '-' + tm + '.png'), fullPage: true });
  }
  await p.setViewportSize({ width: 1280, height: 800 }); await p.emulateMedia({ colorScheme: 'dark' });
}

(async () => {
  const y = JSON.parse(fs.readFileSync(path.join(kok, 'alan/felsefe/asama-1.json'), 'utf8'));
  const u1 = y.uniteler[0], harf = 'ABCD';
  await bekle();
  const b = await chromium.launch();
  try {
    const c = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
    const p = await c.newPage(); const hata = [];
    p.on('pageerror', e => { hata.push(e.message); console.log('  sayfa hatası: ' + e.message); });
    // dosyası henüz yazılmamış aşamanın 404'ü beklenir (kabuk o aşamayı göstermez); başka her hata sayılır
    p.on('console', m => { if (m.type() === 'error' && !/\/alan\/[a-z]+\/asama-\d+\.json$/.test(m.location().url || '')) hata.push(m.text()); });
    // Felsefe'nin ikinci aşaması: gerçek dosya varsa o, yoksa birinciden türetilmiş yapay aşama (yalnız bu tarayıcıya verilir)
    const y2yol = path.join(kok, 'alan/felsefe/asama-2.json'), y2gercek = fs.existsSync(y2yol);
    const y2 = y2gercek ? JSON.parse(fs.readFileSync(y2yol, 'utf8')) : Object.assign(JSON.parse(JSON.stringify(y).replace(/"felsefe\.1/g, '"felsefe.2')), { sira: 2, onKosul: ['felsefe.1'] });
    if (!y2gercek) await p.route('**/alan/felsefe/asama-2.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(y2) }));

    await p.goto(T + '/kabuk/');
    await p.waitForSelector('.karsila .b-dugme--ana');
    await p.waitForFunction(() => /ders\//.test(document.querySelector('.karsila .b-dugme--ana').getAttribute('href')));
    const kokCevap = await p.request.get(T + '/', { maxRedirects: 0 });
    dene('tek kapıda kök yeni kabuğa yönlenir', kokCevap.status() === 302 && kokCevap.headers().location === '/kabuk/', kokCevap.status());
    await p.waitForFunction(() => !!localStorage.getItem('lifeos.tasima'));
    dene('köken taşıması: eski modülün deposu bu kökene geri yazıldı (ana depo, nesne ve düz metin anahtar)', await p.evaluate(() =>
      localStorage.getItem('rota84285.v2') === '{"gezi":{"isaret":"eski-kokenden"}}' && localStorage.getItem('lifeos.king.bas.ays') === '{"x":1}' &&
      localStorage.getItem('lifeos.gezi.metin') === 'duz metin' && JSON.parse(localStorage.getItem('lifeos.tasima')).ays === 'ays-cGEZ-20261114-000000-abcdef.json'));
    dene('Bugün: «Başla» ilk derse götürür', (await p.getAttribute('.karsila .b-dugme--ana', 'href')) === '#/alan/felsefe/ders/' + u1.dersler[0].id);

    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.b-acilir');
    dene('Felsefe: üç ünite + aşama kapısı çizildi', (await p.locator('.b-acilir').count()) === y.uniteler.length && (await p.locator('#b-asama-kapisi').count()) === 1);
    dene('Felsefe: ikinci ünite kilitli', (await p.locator('.b-acilir').nth(1).locator('.b-ders--kilitli, .b-satir--kilitli').count()) >= 3);
    dene('Felsefe: eski sayfa bağlantısı tek kapı yolunda', (await p.getAttribute('.b-eylemler .b-dugme--sade', 'href')) === '/esp/');
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'felsefe-masaustu-koyu.png'), fullPage: true });

    for (let i = 0; i < u1.dersler.length; i++) {
      const d = u1.dersler[i];
      await p.goto(T + '/kabuk/#/alan/felsefe/ders/' + d.id);
      await p.waitForSelector('article.ders h1');
      dene('ders ' + (i + 1) + ': başlık ve ' + d.metin.length + ' paragraf', (await p.textContent('article.ders h1')) === d.ad && (await p.locator('article.ders > p').count()) >= d.metin.length + 1);
      const a = d.alistirmalar[0], yanlis = harf[(harf.indexOf(a.dogru) + 1) % a.sec.length];
      const soru = p.locator('.b-soru[data-soru="' + a.id + '"]');
      if (i === 0) {
        await soru.locator('[data-h="' + yanlis + '"]').click();
        dene('ders 1: yanlış cevap «Yanlış.» der ve doğruyu işaretler', /Yanlış/.test(await soru.locator('.b-soru__sonuc').textContent()) && (await soru.locator('.b-soru__sik--dogru').getAttribute('data-h')) === a.dogru);
      }
      await soru.locator('[data-h="' + a.dogru + '"]').click();
      dene('ders ' + (i + 1) + ': doğru cevap «Doğru.» der', /Doğru/.test(await soru.locator('.b-soru__sonuc').textContent()));
      if (GORUNTU && i === 0) await p.screenshot({ path: path.join(cikti, 'ders-masaustu-koyu.png'), fullPage: true });
      await p.click('[data-ac="okudum"]');
      const beklenen = i < u1.dersler.length - 1 ? '#/alan/felsefe/ders/' + u1.dersler[i + 1].id : '#/alan/felsefe/kapi/' + u1.id;
      await p.waitForFunction(h => location.hash === h, beklenen).catch(() => {});
      dene('ders ' + (i + 1) + ': «Okudum» sıradaki adıma götürür', (await p.evaluate(() => location.hash)) === beklenen, await p.evaluate(() => location.hash));
    }

    await p.waitForSelector('form.kapi');
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'kapi-masaustu-koyu.png'), fullPage: true });
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
    dene('kayıt yenilemeden sonra duruyor: 3/9 ders, 1/3 kapı', (await ilerleme(p)) === '3/9 · 1/3');
    dene('ikinci ünite açıldı: ilk dersi ve kapısı bağlantı, sonraki iki ders kilitli', (await p.locator('.b-acilir').nth(1).locator('a.b-ders, a.b-satir').count()) === 2 && (await p.locator('.b-acilir').nth(1).locator('.b-ders--kilitli').count()) === 2);
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
      await p.waitForSelector('.b-acilir');
      dene(alan + ': yol haritası ' + v.uniteler.length + ' ünite + aşama kapısı', (await p.locator('.b-acilir').count()) === v.uniteler.length && (await p.locator('#b-asama-kapisi').count()) === 1);
      dene(alan + ': ' + (v.uniteler.length > 4 ? 'yalnız ilk ünite açık gelir' : 'bütün üniteler açık gelir'),
        (await p.locator('details.b-acilir[open]').count()) === (v.uniteler.length > 4 ? 1 : v.uniteler.length));
      dene(alan + ': «Başla» ilk derse götürür', (await p.getAttribute('.b-eylemler .b-dugme--ana', 'href')) === '#/alan/' + alan + '/ders/' + d1.id);
      await p.click('.b-eylemler .b-dugme--ana');
      await p.waitForSelector('article.ders h1');
      dene(alan + ': ilk ders açılır', (await p.textContent('article.ders h1')) === d1.ad);
      const a = d1.alistirmalar.find(x => x.tur === 'secmeli');
      if (a) {
        await p.click('.b-soru[data-soru="' + a.id + '"] [data-h="' + a.dogru + '"]');
        dene(alan + ': alıştırma doğru cevabı tanır', /Doğru/.test(await p.textContent('.b-soru[data-soru="' + a.id + '"] .b-soru__sonuc')));
      }
      await p.click('[data-ac="okudum"]');
      await p.waitForFunction(h => location.hash !== h, '#/alan/' + alan + '/ders/' + d1.id);
      if (GORUNTU && alan === 'akademik') { await p.goto(T + '/kabuk/#/alan/akademik'); await p.waitForSelector('.b-acilir'); await p.screenshot({ path: path.join(cikti, 'akademik-masaustu-koyu.png') }); }
    }
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.b-acilir');
    dene('alanların kaydı ayrı: Felsefe hâlâ 3/9 ders, 1/3 kapı', (await ilerleme(p)) === '3/9 · 1/3');
    await p.goto(T + '/kabuk/#/alan/akademik');
    await p.waitForSelector('.b-acilir');
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForFunction(() => /Akademik/.test((document.querySelector('.karsila__sira') || {}).textContent || ''));
    dene('Bugün son çalışılan alanla karşılar (Akademik)', /akademik\/(ders|kapi)\//.test(await p.getAttribute('.karsila .b-dugme--ana', 'href')));
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('.b-acilir');

    // ---- Not ----
    p.on('dialog', x => x.accept());
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('[data-arac="not"]');
    dene('not: boş defter öyle der', /Henüz not yok/.test(await p.textContent('#not-liste')));
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
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'not-masaustu-koyu.png'), fullPage: true });
    await p.goto(T + '/kabuk/' + erdem);
    await p.waitForSelector('[aria-label="Bu nota bağlananlar"]');
    dene('not: «Bu nota bağlananlar» Sokrates notunu gösterir', /Sokrates/.test(await p.textContent('[aria-label="Bu nota bağlananlar"]')));
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('#not-liste a.b-satir');
    dene('not: iki not listede', (await p.locator('#not-liste a.b-satir').count()) === 2);
    await p.fill('[data-not-ara]', 'sokr');
    dene('not: arama «sokr» tek notu bulur', (await p.locator('#not-liste a.b-satir').count()) === 1 && /Sokrates/.test(await p.textContent('#not-liste')));
    await p.fill('[data-not-ara]', '#etik');
    dene('not: «#etik» etiketli notu süzer', (await p.locator('#not-liste a.b-satir').count()) === 1 && /Erdem/.test(await p.textContent('#not-liste')));
    await p.reload();
    await p.waitForSelector('#not-liste a.b-satir');
    dene('not: yenilemeden sonra iki not duruyor', (await p.locator('#not-liste a.b-satir').count()) === 2);
    // not ağı: iki düğüm, bir bağ; düğüm klavyeyle (Sekme + Enter) notu açar
    dene('not ağı: iki düğüm ve Sokrates→Erdem bağı çizildi', (await p.locator('[data-not-ag] svg a').count()) === 2 && (await p.locator('[data-not-ag] line.notag__bag').count()) === 1);
    await p.focus('[data-not-ag] svg a[aria-label^="Erdem"]');
    await p.keyboard.press('Enter');
    await p.waitForFunction(h => location.hash === h, erdem);
    dene('not ağı: düğüm klavyeyle açılır', (await p.inputValue('input[name=baslik]')) === 'Erdem');
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('[data-not-ag] svg');
    await goruntu(p, 'not-agi');

    // ---- Sisteme not: «Yeni araç», King okuma izni varsayılan kapalı; kapalı aracın notu King süzgecinden geçmez ----
    await p.click('a[href="#/motor/not/arac/yeni"]');
    await p.waitForSelector('form.aracform');
    dene('sisteme not: «King okuyabilsin» varsayılan kapalı', !(await p.isChecked('form.aracform input[name=kingOkur]')));
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
    dene('sisteme not: araç sayfası notu ve «King okumaz» gösterir', /King okumaz/.test(await p.textContent('[data-sistemnot]')) && /hakkımda çıkarım yapma/.test(await p.textContent('[data-sistemnot]')), await p.textContent('[data-sistemnot]'));
    await p.click('a[href^="#/motor/not/yeni?arac="]');
    await p.waitForSelector('form.notform input[name=klasor]', { state: 'attached' });
    dene('sisteme not: araçta yeni not aracın adını ve iznini söyler', /Araç: Düşünce defteri · King okumaz/.test(await p.textContent('form.notform')));
    await p.fill('input[name=baslik]', 'Kader');
    await p.fill('textarea[name=govde]', 'Kader ve çaba üzerine bir fikir.');
    await p.click('form.notform button[type=submit]');
    await p.waitForFunction(() => /^#\/motor\/not\/n\w+$/.test(location.hash));
    const kral = () => p.evaluate(() => { const N = LIFEOS.Motor.Not, l = JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.not.kayit')), a = JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.not.araclar'));
      return { klasor: l.find(n => n.baslik === 'Kader').klasor, okur: N.kingOkur(l, { araclar: a }).map(n => n.baslik), sistem: N.kingAraclar(a).length }; });
    let kr = await kral();
    dene('sisteme not: not aracın klasöründe; King süzgeci onu ve sistem notunu dışarıda bırakır', kr.klasor === 'Düşünce defteri' && kr.okur.indexOf('Kader') < 0 && kr.okur.indexOf('Erdem') >= 0 && kr.sistem === 0, JSON.stringify(kr));
    await p.goto(T + '/kabuk/' + aracHash);
    await p.waitForSelector('[data-arac-sayfa] .b-liste a.b-satir');
    dene('sisteme not: araç sayfasında notu listelenir', /Kader/.test(await p.textContent('[data-arac-sayfa] .b-liste')));
    await goruntu(p, 'sisteme-not');
    await p.click('a[href$="/duzenle"]');
    await p.waitForSelector('form.aracform');
    dene('sisteme not: düzenlerken klasör değişmez (salt okunur)', (await p.getAttribute('form.aracform input[name=klasor]', 'readonly')) !== null);
    await p.check('form.aracform input[name=kingOkur]');
    await p.click('form.aracform button[type=submit]');
    await p.waitForFunction(() => /King okur/.test((document.querySelector('[data-sistemnot]') || {}).textContent || ''));
    kr = await kral();
    dene('sisteme not: izin açılınca King notu ve sistem notunu okur', kr.okur.indexOf('Kader') >= 0 && kr.sistem === 1, JSON.stringify(kr));
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('[aria-labelledby="araclar-baslik"] a.b-satir');
    dene('sisteme not: Not sayfasında araç, not sayısı ve King izniyle listelenir', /Düşünce defteri.*1 not.*King okur/.test((await p.textContent('[aria-labelledby="araclar-baslik"]')).replace(/\s+/g, ' ')));

    // ---- Tekrar ----
    await p.goto(T + '/kabuk/#/motor/tekrar');
    await p.waitForSelector('form.kartform');
    dene('tekrar: kartsız açılış öyle der', /Henüz kart yok/.test(await p.textContent('[data-arac="tekrar"]')));
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
    await p.waitForSelector('.kart');
    dene('tekrar: kartın önü görünür, arkası gizli', /Arkhe/.test(await p.textContent('.kart__on')) && (await p.locator('.kart__arka').count()) === 0);
    await p.click('[data-arac-ac="kart-goster"]');
    await p.waitForSelector('.kart__arka');
    dene('tekrar: cevap ve dört not düğmesi aralıklarıyla', /ilk maddesi/.test(await p.textContent('.kart__arka')) && (await p.locator('.notlar .b-dugme').count()) === 4 && /şimdi/.test(await p.textContent('.notlar .b-dugme >> nth=0')) && /gün/.test(await p.textContent('.notlar .b-dugme >> nth=2')));
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'tekrar-masaustu-koyu.png'), fullPage: true });
    await p.click('[data-arac-ac="kart-not"][data-not="1"]');
    await p.waitForSelector('[data-arac-ac="kart-goster"]');
    dene('tekrar: «Yine» kartı aynı gün yeniden sorar', /Arkhe/.test(await p.textContent('.kart__on')));
    await p.click('[data-arac-ac="kart-goster"]');
    await p.click('[data-arac-ac="kart-not"][data-not="3"]');
    await p.waitForSelector('[data-sonuc="gecti"]');
    dene('tekrar: «İyi» sonrası bugünlük biter, iki cevap sayılır', /Bugünlük bitti/.test(await p.textContent('[data-sonuc]')) && /2 cevap/.test(await p.textContent('[data-sonuc]')));
    await p.click('[data-arac="tekrar"] .b-acilir summary');
    dene('tekrar: kart listesinde hatırlama tahmin etiketli', /\(tahmin\)/.test(await p.textContent('[aria-label="Kartlar"]')));
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
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'kayit-masaustu-koyu.png'), fullPage: true });
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
    await p.waitForSelector('[data-kayit-hafta] .khafta__tablo');
    const suSatir = await p.$$eval('.khafta__tablo tbody tr', tr => tr.map(r => [...r.children].map(c => c.textContent.trim())).find(r => /^Su/.test(r[0])));
    dene('kayıt haftası: su satırında dün 300, bugün 500 (etiket ekran okuyucuya da), boş günler nokta (sıfır değil)', !!suSatir && suSatir[6] === '300 hesaplandı' && suSatir[7] === '500 hesaplandı' && suSatir.slice(1, 6).every(x => x === '·veri yok'), JSON.stringify(suSatir));
    dene('kayıt haftası: satır etiketi ve haftanın toplamı etiketli', /hesaplandı/.test(suSatir && suSatir[0]) && /400 ml · 2 günün ortalaması\s*hesaplandı/.test(await p.textContent('[aria-label="Haftanın toplamı"]')));
    dene('kayıt haftası: toparlanma ve yük motorun cümlesiyle (antrenman kaydı yok)', /Henüz antrenman kaydı yok/.test(await p.textContent('[data-yuk]')) && /Toparlanma puanı|toparlanma için kayıt yok/.test(await p.textContent('[data-yuk]')), await p.textContent('[data-yuk]'));
    await goruntu(p, 'kayit-hafta');

    // ---- Plan ----
    await p.goto(T + '/kabuk/#/motor/plan');
    await p.waitForSelector('[data-arac="plan"]');
    dene('plan: boş zaman yokken önce onu ister', /Önce aşağıya/.test(await p.textContent('[data-arac="plan"]')) && (await p.locator('[data-arac-ac="plan-kur"]').count()) === 0);
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
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'plan-masaustu-koyu.png'), fullPage: true });
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
    await p.waitForSelector('.karsila__plan');
    dene('Bugün: planın sıradaki bloğunu gösterir', /Planda sırada: \d\d:\d\d/.test(await p.textContent('.karsila__plan')), await p.textContent('.karsila__plan'));

    // ---- Hafta planı ve sabit bloklar (şablon bir kez yazılır, her güne girer) ----
    await p.goto(T + '/kabuk/#/motor/plan');
    await p.click('a[href="#/motor/plan/hafta"]');
    await p.waitForSelector('[data-hafta] [data-gun]');
    dene('hafta: bugünden yedi gün çizildi, ilki «bugün»', (await p.locator('[data-gun]').count()) === 7 && /bugün/.test(await p.textContent('[data-gun] >> nth=0')));
    await p.waitForSelector('.hafta [data-blok="ders"]');
    dene('hafta: sıradaki ders öngörüde; bugün yapılan «Rapor» girmez; özet etiketli', !/Rapor/.test(await p.textContent('.hafta')) && /planlanan \d+ dk \(hesaplandı\)/.test(await p.textContent('[data-hafta]')));
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
    dene('hafta: okul yalnız hafta içi beş güne, uyku her güne girdi', gunMetni.filter(x => /Okul/.test(x)).length === 5 && gunMetni.every(x => /23:00–24:00\s*Uyku/.test(x) && /00:00–07:00\s*Uyku/.test(x)), gunMetni.map(x => x.slice(0, 60)).join(' | '));
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
    dene('soru: başlangıçta alan ve havuz yazılı', /Felsefe alanının/.test(await p.textContent('[data-arac="soru"]')) && /Havuzda \d+ soru/.test(await p.textContent('[data-arac="soru"]')));
    await p.click('[data-arac-ac="soru-basla"]');
    await p.waitForSelector('.b-soru[data-sira="0"]');
    const felsefeSorular = {};
    y.uniteler.forEach(u => u.dersler.forEach(dd => dd.alistirmalar.forEach(a => { felsefeSorular[a.soru] = a; })));
    const soruMetni = async () => felsefeSorular[await p.textContent('.b-soru legend')];
    let sq = await soruMetni();
    await p.click('[data-arac-ac="soru-cevap"][data-h="' + sq.dogru + '"]');
    dene('soru: doğru cevap «Doğru.» der, şıklar kilitlenir', /Doğru/.test(await p.textContent('.b-soru__sonuc')) && (await p.locator('.b-soru__sik[disabled]').count()) === sq.sec.length);
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
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'soru-masaustu-koyu.png'), fullPage: true });
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
    await p.waitForSelector('[data-deneme-sayfa] .sayac[role="timer"]');
    const sayac1 = await p.textContent('.sayac');
    await p.waitForFunction(s => document.querySelector('.sayac').textContent !== s, sayac1, { timeout: 3000 }).catch(() => {});
    dene('deneme: geri sayım görünür ve akar', /^\d\d:\d\d$/.test(sayac1) && (await p.textContent('.sayac')) !== sayac1, sayac1);
    let dq = await soruMetni();
    await p.keyboard.press(dq.dogru.toLowerCase());
    dene('deneme: klavyeyle (harf) cevap seçilir, doğru/yanlış söylenmez', (await p.getAttribute('[data-deneme="cevap"][data-h="' + dq.dogru + '"]', 'aria-pressed')) === 'true' && !/Doğru|Yanlış/.test(await p.textContent('.b-soru')));
    await p.keyboard.press('ArrowRight');
    await p.waitForSelector('.deneme__nobt[data-i="1"][aria-current]');
    dq = await soruMetni();
    await p.click('[data-deneme="cevap"][data-h="' + 'ABCD'[('ABCD'.indexOf(dq.dogru) + 1) % dq.sec.length] + '"]');
    await p.click('[data-deneme="cevap"][data-h="' + dq.dogru + '"]');
    dene('deneme: cevap bitirene kadar değişir', (await p.getAttribute('[data-deneme="cevap"][data-h="' + dq.dogru + '"]', 'aria-pressed')) === 'true' && (await p.locator('[data-deneme="cevap"][aria-pressed="true"]').count()) === 1);
    await p.reload();
    await p.waitForSelector('.sayac');
    dene('deneme: yenilemeden sonra kaldığı sorudan, cevaplarıyla sürer', (await p.getAttribute('.deneme__nobt[aria-current]', 'data-i')) === '1' && (await p.locator('.deneme__nobt--cevapli').count()) === 2);
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
    await p.waitForSelector('.sayac');
    await p.evaluate(() => { const v = JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.soru.deneme')); v.oturum.bas -= (v.oturum.sure * 60 + 2) * 1000; LIFEOS.Kabuk.ic.depo.setItem('lifeos.soru.deneme', JSON.stringify(v)); });
    await p.waitForSelector('[data-deneme-sayfa] [data-sonuc]', { timeout: 4000 }).catch(() => {});
    dene('deneme: süre dolunca kendiliğinden biter, «süre doldu» yazar', /süre doldu/.test(await p.textContent('[data-deneme-sayfa]').catch(() => '')));
    await p.goto(T + '/kabuk/#/alan/akademik');
    await p.waitForSelector('.b-acilir');
    await p.goto(T + '/kabuk/#/motor/soru/deneme');
    await p.waitForSelector('[data-deneme="prova"]');
    dene('prova: Akademik\'te TYT provası açık, AYT kilitli üniteler yüzünden kapalı', (await p.locator('[data-deneme="prova"][data-sinav="TYT"]').count()) === 2 && /açık soru yetmiyor/.test(await p.textContent('section')));
    await p.click('[data-deneme="prova"][data-sinav="TYT"][data-boy="20"]');
    await p.waitForSelector('.sayac');
    dene('prova: 20 soru, süre 28 dakikadan geri sayar', (await p.locator('.deneme__nobt').count()) === 20 && /^2[78]:\d\d$/.test(await p.textContent('.sayac')), await p.textContent('.sayac'));
    await p.click('[data-deneme="cevap"][data-h="A"]');
    await p.waitForSelector('[data-deneme="cevap"][disabled]');
    dene('prova: ilk cevap kilitlenir, doğru/yanlış söylenmez', (await p.locator('[data-deneme="cevap"][disabled]').count()) >= 2 && /kaydedildi/.test(await p.textContent('.b-soru')) && !/Doğru\.|Yanlış\./.test(await p.textContent('.b-soru')));
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
    await p.fill('#b-alan-metin', 'Felsefe çalışmak istiyorum, günde 30 dakika ayırabilirim');
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => !!LIFEOS.Kabuk.ic.depo.getItem('lifeos.tanisma.taslak'));
    dene('tanışma: cevap taslakta, kayıt henüz yok', await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.tanisma.kayit') === null));
    await p.click('[data-tn-ac="bitir"]');
    await p.waitForSelector('[data-tn-ac="onayla"]');
    dene('tanışma: onay adımında hâlâ kayıt yok', await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.tanisma.kayit') === null));
    await p.click('[data-tn-ac="onayla"]');
    await p.waitForSelector('#tn-bitti');
    dene('tanışma: onayla kayıt yazılır', await p.evaluate(() => { const k = JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.tanisma.kayit')); return !!k && JSON.stringify(k).length > 20; }));
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('.karsila');
    dene('tanışma: kayıt varken davet gösterilmez', (await p.locator('[data-tn-davet]').count()) === 0);

    // ---- Başlangıç paketi: eski sistemdeki kayıtlar tek dokunuşla gelir, ikinci kez sorulmaz ----
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForSelector('[data-arac="not"]');
    const notOnce = await p.locator('#not-liste a').count();
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('[data-baslangic="teklif"]');
    dene('başlangıç: Bugün\'de teklif sayılarıyla çıkar', /1 not, 1 kayıt/.test(await p.textContent('[data-baslangic="teklif"]')));
    await p.click('[data-arac-ac="baslangic-getir"]');
    await p.waitForSelector('[data-baslangic="bitti"]');
    dene('başlangıç: «Getir» sonucu söyler', /Getirildi: 1 not, 1 kayıt/.test(await p.textContent('[data-baslangic="bitti"]')), await p.textContent('[data-baslangic="bitti"]'));
    // beden alanları yalnız varsayılandaysa yazılır; bu gezide Beden daha önce elle girildi, o yüzden burada sayılmaz (kural birim testinde)
    dene('başlangıç: elle girilmiş Beden ayarının üstüne yazılmadı', await p.evaluate(() => window.LIFEOS.Kabuk.Ayar.oku(window.LIFEOS.Kabuk.Depo, 'lifeos.beden.boy') !== null).catch(() => false));
    await p.goto(T + '/kabuk/#/motor/not');
    await p.waitForFunction(n => document.querySelectorAll('#not-liste a').length === n + 1, notOnce);
    dene('başlangıç: eski not Not aracında', /Eski defterden/.test(await p.textContent('#not-liste')));
    await p.reload();
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('.karsila');
    await p.waitForTimeout(800);
    dene('başlangıç: aynı paket ikinci kez teklif edilmez', (await p.locator('[data-baslangic="teklif"]').count()) === 0);
    dene('başlangıç: eski kayıt deposunda, «eski kayıt» etiketiyle', await p.evaluate(async () => {
      const v = await window.LIFEOS.Kabuk.Depo.al('lifeos.kayit.kayitlar'); const l = JSON.parse(v || '[]');
      return l.some(r => r.id === 'kilo:2026-10-20:0' && r.deger.kg.k === 'eski'); }).catch(() => false));

    // ---- Eski sistem: kontrol paneli ve üç modül yeni kabuktan bir adım ----
    await p.goto(T + '/kabuk/#/eski');
    await p.waitForSelector('a[href="/kartlar/"]');
    dene('eski sistem: kabuktan eski kontrol paneline bağlantı', /Eski sistem/.test(await p.textContent('#sayfa')));
    const kartlar = await p.request.get(T + '/kartlar/');
    dene('eski sistem: /kartlar/ eski giriş sayfasını verir, kartlar modül yoluna bağlı', kartlar.status() === 200 && /href="\/ays\/"/.test(await kartlar.text()));

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
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForFunction(() => window.LIFEOS && window.LIFEOS.HESAP);
    dene('Hesap yüklendi; oturum yokken selam adsız', await p.evaluate(() => LIFEOS.HESAP.durum().oturum === null && /^(Günaydın|İyi günler|İyi akşamlar|İyi geceler)\.$/.test(document.querySelector('.karsila__selam').textContent)), await p.textContent('.karsila__selam'));

    // ---- Aşamalar: Felsefe'nin ikinci aşaması (eski birinci aşama kaydı yerinde kalır) ----
    await p.goto(T + '/kabuk/#/alan/felsefe');
    await p.waitForSelector('ul[aria-label="Aşamalar"]');
    const kayit1 = await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.1'));
    dene('aşama: alan sayfası iki aşamayı listeler, ikincisi kilitli ve nedenini söyler', (await p.locator('ul[aria-label="Aşamalar"] .b-satir').count()) === 2 && (await p.locator('ul[aria-label="Aşamalar"] .b-satir--kilitli').count()) === 1 && /önce Aşama 1 kapısı/.test(await p.textContent('ul[aria-label="Aşamalar"]')), y2gercek ? 'gerçek asama-2.json' : 'yapay ikinci aşama');
    dene('aşama: birinci aşamanın eski anahtarlı kaydı aynen okunuyor (3/9 ders, 1/3 kapı)', (await ilerleme(p)) === '3/9 · 1/3' && !!kayit1 && (await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.2'))) === null);
    await p.goto(T + '/kabuk/#/alan/felsefe/ders/' + y2.uniteler[0].dersler[0].id);
    await p.waitForSelector('.b-bos');
    dene('aşama: kilitli aşamanın dersi açılmaz, neden aşama kilidi', /Bu aşama kilitli/.test(await p.textContent('.b-bos')));
    await p.goto(T + '/kabuk/#/alan/felsefe/asama/2');
    await p.waitForSelector('.govde .b-bos');
    dene('aşama: kilitli aşama sayfası listeyi ve kilidi gösterir', /Bu aşama kilitli/.test(await p.textContent('.govde .b-bos')) && (await p.locator('.b-acilir').count()) === 0);
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'asama-kilitli-masaustu-koyu.png'), fullPage: true });
    for (const sahip of y.uniteler.slice(1).concat([y])) {                   // ikinci ve üçüncü ünite kapısı, sonra aşama kapısı
      await p.goto(T + '/kabuk/#/alan/felsefe/kapi/' + sahip.id);
      await p.waitForSelector('form.kapi');
      for (const q of sahip.kapi.sorular) await p.check('input[name="' + q.id + '"][value="' + q.dogru + '"]');
      await p.click('form.kapi button[type=submit]');
      await p.waitForSelector('[data-sonuc="gecti"]');
    }
    dene('aşama: aşama kapısı geçilince «Sonraki aşama» ikinci aşamaya götürür', (await p.getAttribute('[data-sonuc] .b-dugme--ana', 'href')) === '#/alan/felsefe/asama/2' && /Sonraki aşama/.test(await p.textContent('[data-sonuc] .b-dugme--ana')));
    await p.click('[data-sonuc] .b-dugme--ana');
    await p.waitForFunction(() => /Aşama 2/.test((document.querySelector('#asama-ad') || {}).textContent || ''));
    dene('aşama: ikinci aşama açıldı; birincisi «geçildi», ikincisi şu an burada', /geçildi/.test(await p.textContent('ul[aria-label="Aşamalar"] .b-satir >> nth=0')) && (await p.getAttribute('ul[aria-label="Aşamalar"] .b-satir >> nth=1', 'aria-current')) === 'true'
      && (await p.getAttribute('.b-eylemler .b-dugme--ana', 'href')) === '#/alan/felsefe/ders/' + y2.uniteler[0].dersler[0].id);
    await goruntu(p, 'asama-liste');
    const kayit1b = await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.1'));
    await p.click('.b-eylemler .b-dugme--ana');
    await p.waitForSelector('article.ders h1');
    await p.click('[data-ac="okudum"]');
    await p.waitForFunction(() => !!LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.2'));
    const k2 = await p.evaluate(() => JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.2')));
    dene('aşama: ikinci aşamanın kaydı kendi anahtarında; birincinin kaydı değişmedi', Object.keys(k2.dersler).length === 1 && Object.keys(k2.asamalar).length === 0 && (await p.evaluate(() => LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.felsefe.1'))) === kayit1b);
    await p.reload();
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForFunction(t => (document.querySelector('.karsila__sira') || {}).textContent.indexOf(t) >= 0, y2.ad, { timeout: 5000 }).catch(() => {});
    dene('aşama: Bugün yenilemeden sonra ikinci aşamayla karşılar', ((await p.textContent('.karsila__sira')) || '').indexOf(y2.ad) >= 0, await p.textContent('.karsila__sira'));
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
    mp.on('console', m => { if (m.type() === 'error' && !/\/alan\/[a-z]+\/asama-\d+\.json$/.test(m.location().url || '')) mhata.push(m.text()); });
    if (!y2gercek) await mp.route('**/alan/felsefe/asama-2.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(y2) }));
    await mp.goto(T + '/kabuk/harita.js'); // aynı köken, kabuk henüz açılmadı
    await mp.evaluate(k => { localStorage.setItem('lifeos.yol.felsefe.1', k); localStorage.setItem('lifeos.tema.secim', 'light'); }, kayit1);
    await mp.goto(T + '/kabuk/#/alan/felsefe');
    await mp.waitForSelector('ul[aria-label="Aşamalar"]');
    dene('taşıma: eski localStorage kaydı ilk açılışta okunur (3/9 ders, 1/3 kapı)', (await ilerleme(mp)) === '3/9 · 1/3');
    dene('taşıma: kayıt IndexedDB içinde aynen, localStorage içinden silindi; ayar yerinde ve uygulandı', (await idbOku(mp, 'lifeos.yol.felsefe.1')) === kayit1 && (await yerelKayit(mp)).length === 0
      && (await mp.evaluate(() => localStorage.getItem('lifeos.tema.secim') + ' ' + document.documentElement.getAttribute('data-theme'))) === 'light light');
    await mp.reload();
    await mp.waitForSelector('ul[aria-label="Aşamalar"]');
    dene('taşıma: yenilemeden sonra kayıt IndexedDB içinden okunur', (await ilerleme(mp)) === '3/9 · 1/3');
    dene('taşıma: konsolda hata yok', mhata.length === 0, mhata.join(' | '));
    await mc.close();

    // ---- Seviyemi bul (icerik-hatti §4.3): boş kayıtlı Dil, iki aşama; birinci bilinir, ikincide kalınır ----
    const yc = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }), yp = await yc.newPage(), yhata = [];
    yp.on('pageerror', e => yhata.push(e.message));
    yp.on('console', m => { if (m.type() === 'error' && !/\/alan\/[a-z]+\/asama-\d+\.json$/.test(m.location().url || '')) yhata.push(m.text()); });
    const dil = [1, 2].map(n => JSON.parse(fs.readFileSync(path.join(kok, 'alan/dil/asama-' + n + '.json'), 'utf8'))), dogruHarf = {};
    dil.forEach(v => v.uniteler.forEach(u => u.kapi.sorular.forEach(q => { dogruHarf[q.id] = q.dogru; })));
    const yerCevapla = async dogru => {
      for (const ad of await yp.$$eval('form.kapi[data-yer] input[type=radio]', l => [...new Set(l.map(x => x.name))])) {
        await yp.check('input[name="' + ad + '"][value="' + (dogru ? dogruHarf[ad] : (dogruHarf[ad] === 'A' ? 'B' : 'A')) + '"]');
      }
      await yp.click('form.kapi[data-yer] button[type=submit]');
    };
    await yp.goto(T + '/kabuk/#/alan/dil');
    await yp.waitForSelector('#yer-baslik');
    dene('yerleştirme: boş alanda iki seçenek', (await yp.textContent('[aria-labelledby="yer-baslik"] .b-dugme--ana')) === 'Baştan başla' && (await yp.getAttribute('[aria-labelledby="yer-baslik"] a.b-dugme >> nth=1', 'href')) === '#/alan/dil/yer/1'
      && (await yp.getAttribute('[aria-labelledby="yer-baslik"] .b-dugme--ana', 'href')) === '#/alan/dil/ders/' + dil[0].uniteler[0].dersler[0].id);
    await yp.click('[aria-labelledby="yer-baslik"] a.b-dugme >> nth=1');
    await yp.waitForSelector('form.kapi[data-yer="1"]');
    const n1 = await yp.locator('form.kapi[data-yer="1"] fieldset').count();
    dene('yerleştirme: aşama 1, 5–8 soru, yalnız ünite kapılarından, doğru cevap yok', n1 >= 5 && n1 <= 8 && (await yp.locator('.b-soru__sik--dogru').count()) === 0
      && (await yp.$$eval('form.kapi[data-yer] input[type=radio]', l => l.map(x => x.name))).every(id => dil[0].uniteler.some(u => u.kapi.sorular.some(q => q.id === id))), n1);
    await goruntu(yp, 'yerlestirme-soru');
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
    const kd = await yp.evaluate(() => [1, 2].map(n => JSON.parse(LIFEOS.Kabuk.ic.depo.getItem('lifeos.yol.dil.' + n))));
    dene('yerleştirme: kayıt atlandı/tahmin, «geçildi» yazılmadı', kd[0].yerlestirme.sonuc === 'atlandi' && kd[0].yerlestirme.etiket === 'tahmin' && kd[0].asamalar['dil.1'].gecti === undefined
      && kd[1].yerlestirme.sonuc === 'burada', JSON.stringify(kd));
    dene('yerleştirme: «Başla» ikinci aşamanın ilk dersine', (await yp.getAttribute('.b-eylemler .b-dugme--ana', 'href')) === '#/alan/dil/ders/' + dil[1].uniteler[0].dersler[0].id);
    await yp.goto(T + '/kabuk/#/alan/dil/asama/1');
    await yp.waitForSelector('.b-acilir');
    dene('yerleştirme: birinci aşama listede «atlandı · tahmin», üniteleri atlandı ve açık', /atlandı · tahmin/.test(await yp.textContent('ul[aria-label="Aşamalar"] .b-satir >> nth=0'))
      && (await yp.locator('.b-acilir summary', { hasText: 'atlandı (tahmin)' }).count()) === dil[0].uniteler.length && (await yp.locator('#yer-baslik').count()) === 0
      && (await yp.locator('.b-acilir >> nth=2').locator('a.b-ders, a.b-satir').count()) >= 1);
    await yp.goto(T + '/kabuk/#/alan/dil/yer/1');
    await yp.waitForSelector('.b-bos');
    dene('yerleştirme: kaydı olan alanda yeniden yapılmaz', /yalnız hiç başlanmamış/.test(await yp.textContent('.b-bos')));
    const du = dil[1].uniteler[0];
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
  } finally {
    await b.close(); srv.kill();
    try { fs.rmSync(gecici, { recursive: true, force: true }); } catch (e) { /* geçici klasör kalabilir */ }
  }
  console.log(kalan ? kalan + ' kaldı' : 'hepsi geçti');
  process.exit(kalan ? 1 : 0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
