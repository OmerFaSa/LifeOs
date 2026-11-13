// KABUK GEZISI: tek kapiyi yalitilmis ortamda (gecici LOCALAPPDATA, HKM'siz, deneme portu) acar ve yeni kabukta
// on alani ve arac ekranlarini gercek tarayiciyla yurur: Bugun, ders, alistirma, unite kapisi, Not, Tekrar, Kayit, Plan, Soru,
// sureli deneme ve prova, Tanisma, asamalar (Felsefe'nin ikinci asamasi; dosya yoksa yapay asama yalniz tarayiciya verilir).
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
// dört görünüm (1280/390 × açık/koyu) aynı sayfada; telefonda yatay taşma her koşuda denetlenir, görüntü yalnız --goruntu ile
async function goruntu(p, ad) {
  for (const [w, h, vad] of [[1280, 800, 'masaustu'], [390, 844, 'telefon']]) for (const tm of ['acik', 'koyu']) {
    await p.setViewportSize({ width: w, height: h }); await p.emulateMedia({ colorScheme: tm === 'koyu' ? 'dark' : 'light' });
    if (w === 390 && tm === 'acik') dene(ad + ': telefonda yatay taşma yok', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await p.evaluate(() => document.documentElement.scrollWidth));
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, ad + '-' + vad + '-' + tm + '.png'), fullPage: true });
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
    for (const alan of ['tarih', 'dil', 'muzik', 'okuma', 'beslenme', 'hareket', 'uyku', 'tahlil', 'akademik']) {
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

    // ---- Süreli deneme (Felsefe) ve sınav provası (Akademik) ----
    await p.click('a[href="#/motor/soru/deneme"]');
    await p.waitForSelector('[data-deneme="basla"]');
    dene('deneme: başlangıçta testler ve süre «hesaplandı» etiketiyle', /Felsefe ne sorar\?/.test(await p.textContent('[data-deneme-sayfa] .ozet')) && /Süre\s*\d+ dk\s*hesaplandı/.test(await p.textContent('[data-deneme-sayfa] .ozet')));
    dene('deneme: Felsefe\'de sınav provası yok', (await p.locator('[data-deneme="prova"]').count()) === 0);
    await goruntu(p, 'deneme-baslangic');
    await p.click('[data-deneme="basla"]');
    await p.waitForSelector('[data-deneme-sayfa] .sayac[role="timer"]');
    const sayac1 = await p.textContent('.sayac');
    await p.waitForFunction(s => document.querySelector('.sayac').textContent !== s, sayac1, { timeout: 3000 }).catch(() => {});
    dene('deneme: geri sayım görünür ve akar', /^\d\d:\d\d$/.test(sayac1) && (await p.textContent('.sayac')) !== sayac1, sayac1);
    let dq = await soruMetni();
    await p.keyboard.press(dq.dogru.toLowerCase());
    dene('deneme: klavyeyle (harf) cevap seçilir, doğru/yanlış söylenmez', (await p.getAttribute('[data-deneme="cevap"][data-h="' + dq.dogru + '"]', 'aria-pressed')) === 'true' && !/Doğru|Yanlış/.test(await p.textContent('.soru')));
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
    await p.waitForSelector('[data-deneme-sayfa] .kapisonuc');
    const dSonuc = (await p.textContent('[data-deneme-sayfa]')).replace(/\s+/g, ' ');
    dene('deneme: sonuç net «hesaplandı», doğru ve süre «ölçüldü», boş «hesaplandı»', /Deneme bitti\s*2 net\s*hesaplandı\s*2 doğru, 0 yanlış \(ölçüldü\)/.test(dSonuc) && /boş \(hesaplandı\)/.test(dSonuc) && /dk \(ölçüldü\)/.test(dSonuc), dSonuc.slice(0, 220));
    dene('deneme: Felsefe sonucunda sınav puanı tahmini yok', !/Puan ve sıra/.test(dSonuc));
    dene('deneme: biten deneme kaydedildi, süren silindi', await p.evaluate(() => JSON.parse(localStorage.getItem('lifeos.soru.denemeler')).length === 1 && !localStorage.getItem('lifeos.soru.deneme')));
    await goruntu(p, 'deneme-sonuc');
    await p.click('[data-deneme="yeni"]');
    await p.waitForSelector('[data-deneme="basla"]');
    dene('deneme: «Son denemeler»de net etiketiyle', /Felsefe · .*2 net\s*hesaplandı/.test(await p.textContent('[data-deneme-sayfa] section')));
    await p.click('[data-deneme="basla"]');
    await p.waitForSelector('.sayac');
    await p.evaluate(() => { const v = JSON.parse(localStorage.getItem('lifeos.soru.deneme')); v.oturum.bas -= (v.oturum.sure * 60 + 2) * 1000; localStorage.setItem('lifeos.soru.deneme', JSON.stringify(v)); });
    await p.waitForSelector('[data-deneme-sayfa] .kapisonuc', { timeout: 4000 }).catch(() => {});
    dene('deneme: süre dolunca kendiliğinden biter, «süre doldu» yazar', /süre doldu/.test(await p.textContent('[data-deneme-sayfa]').catch(() => '')));
    await p.goto(T + '/kabuk/#/alan/akademik');
    await p.waitForSelector('.unitekutu');
    await p.goto(T + '/kabuk/#/motor/soru/deneme');
    await p.waitForSelector('[data-deneme="prova"]');
    dene('prova: Akademik\'te TYT provası açık, AYT kilitli üniteler yüzünden kapalı', (await p.locator('[data-deneme="prova"][data-sinav="TYT"]').count()) === 2 && /açık soru yetmiyor/.test(await p.textContent('section')));
    await p.click('[data-deneme="prova"][data-sinav="TYT"][data-boy="20"]');
    await p.waitForSelector('.sayac');
    dene('prova: 20 soru, süre 28 dakikadan geri sayar', (await p.locator('.deneme__nobt').count()) === 20 && /^2[78]:\d\d$/.test(await p.textContent('.sayac')), await p.textContent('.sayac'));
    await p.click('[data-deneme="cevap"][data-h="A"]');
    await p.waitForSelector('[data-deneme="cevap"][disabled]');
    dene('prova: ilk cevap kilitlenir, doğru/yanlış söylenmez', (await p.locator('[data-deneme="cevap"][disabled]').count()) >= 2 && /kaydedildi/.test(await p.textContent('.soru')) && !/Doğru\.|Yanlış\./.test(await p.textContent('.soru')));
    await p.click('[data-deneme="bitir"]');
    await p.waitForSelector('[data-deneme-sayfa] .kapisonuc');
    const pSonuc = (await p.textContent('[data-deneme-sayfa]')).replace(/\s+/g, ' ');
    dene('prova: sonuç net «hesaplandı», ders ders, süre «ölçüldü»', /TYT provası bitti/.test(pSonuc) && /net hesaplandı/.test(pSonuc) && /Türkçe/.test(pSonuc) && /Fen bilimleri/.test(pSonuc) && /\/ 28 dk \(ölçüldü\)/.test(pSonuc), pSonuc.slice(0, 220));
    dene('prova: puan ve sıra tahmini motorun cümlesiyle «veri yok»', /Puan ve sıra\s*tahmin yok\s*veri yok/.test(pSonuc) && /En az 3 tam TYT denemesi gerekir/.test(pSonuc), pSonuc.slice(-400));
    await goruntu(p, 'deneme-prova-sonuc');
    await p.goto(T + '/kabuk/#/motor/soru');
    await p.waitForSelector('[data-arac="soru"] .ozet');
    dene('prova: «Son testler»de provası adıyla', /Akademik · TYT provası/.test(await p.textContent('[data-arac="soru"] .ozet')));
    await p.goto(T + '/kabuk/#/alan/felsefe');                 // aşağıdaki akışlar Felsefe'yi etkin alan bekler
    await p.waitForSelector('.unitekutu');

    // ---- Tanışma: onaydan önce kayıt yok, onayla yazılır ----
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('.tn-davet');
    dene('tanışma: kayıt yokken Bugün\'de davet satırı', /tanıyayım/.test(await p.textContent('.tn-davet')));
    await p.goto(T + '/kabuk/#/tanisma');
    await p.waitForSelector('#tn-yazi');
    await p.fill('#tn-yazi', 'Felsefe çalışmak istiyorum, günde 30 dakika ayırabilirim');
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => !!localStorage.getItem('lifeos.tanisma.taslak'));
    dene('tanışma: cevap taslakta, kayıt henüz yok', await p.evaluate(() => localStorage.getItem('lifeos.tanisma.kayit') === null));
    await p.click('[data-tn-ac="bitir"]');
    await p.waitForSelector('[data-tn-ac="onayla"]');
    dene('tanışma: onay adımında hâlâ kayıt yok', await p.evaluate(() => localStorage.getItem('lifeos.tanisma.kayit') === null));
    await p.click('[data-tn-ac="onayla"]');
    await p.waitForSelector('#tn-bitti');
    dene('tanışma: onayla kayıt yazılır', await p.evaluate(() => { const k = JSON.parse(localStorage.getItem('lifeos.tanisma.kayit')); return !!k && JSON.stringify(k).length > 20; }));
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForSelector('.karsila');
    dene('tanışma: kayıt varken davet gösterilmez', (await p.locator('.tn-davet').count()) === 0);

    // ---- Yol haritası listesi, komut çubuğu, Hesap ----
    await p.goto(T + '/kabuk/#/motor/yol');
    await p.waitForSelector('a.satir[href="#/alan/felsefe"]');
    dene('yol: Felsefe ilerlemesiyle listelenir', /3\/9 ders okundu/.test(await p.textContent('a.satir[href="#/alan/felsefe"]')));
    await p.waitForFunction(() => /1\/368 ders okundu/.test((document.querySelector('a.satir[href="#/alan/akademik"]') || {}).textContent || '')).catch(() => {});
    dene('yol: on alan ilerlemesiyle listelenir', (await p.locator('[data-arac="yol"] a.satir').count()) === 10 && /1\/368 ders okundu/.test(await p.textContent('a.satir[href="#/alan/akademik"]')) && /1\/9 ders okundu/.test(await p.textContent('a.satir[href="#/alan/tarih"]')));
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
    await p.waitForSelector('.asamalar');
    const kayit1 = await p.evaluate(() => localStorage.getItem('lifeos.yol.felsefe.1'));
    dene('aşama: alan sayfası iki aşamayı listeler, ikincisi kilitli ve nedenini söyler', (await p.locator('.asamalar .satir').count()) === 2 && (await p.locator('.asamalar .satir--kilitli').count()) === 1 && /önce Aşama 1 kapısı/.test(await p.textContent('.asamalar')), y2gercek ? 'gerçek asama-2.json' : 'yapay ikinci aşama');
    dene('aşama: birinci aşamanın eski anahtarlı kaydı aynen okunuyor (3/9 ders, 1/3 kapı)', /3\/9 ders okundu · 1\/3/.test(await p.textContent('.govde')) && !!kayit1 && (await p.evaluate(() => localStorage.getItem('lifeos.yol.felsefe.2'))) === null);
    await p.goto(T + '/kabuk/#/alan/felsefe/ders/' + y2.uniteler[0].dersler[0].id);
    await p.waitForSelector('.yuva');
    dene('aşama: kilitli aşamanın dersi açılmaz, neden aşama kilidi', /Bu aşama kilitli/.test(await p.textContent('.yuva')));
    await p.goto(T + '/kabuk/#/alan/felsefe/asama/2');
    await p.waitForSelector('.govde .yuva');
    dene('aşama: kilitli aşama sayfası listeyi ve kilidi gösterir', /Bu aşama kilitli/.test(await p.textContent('.govde .yuva')) && (await p.locator('.unitekutu').count()) === 0);
    if (GORUNTU) await p.screenshot({ path: path.join(cikti, 'asama-kilitli-masaustu-koyu.png'), fullPage: true });
    for (const sahip of y.uniteler.slice(1).concat([y])) {                   // ikinci ve üçüncü ünite kapısı, sonra aşama kapısı
      await p.goto(T + '/kabuk/#/alan/felsefe/kapi/' + sahip.id);
      await p.waitForSelector('form.kapi');
      for (const q of sahip.kapi.sorular) await p.check('input[name="' + q.id + '"][value="' + q.dogru + '"]');
      await p.click('form.kapi button[type=submit]');
      await p.waitForSelector('.kapisonuc--gecti');
    }
    dene('aşama: aşama kapısı geçilince «Sonraki aşama» ikinci aşamaya götürür', (await p.getAttribute('.kapisonuc .dugme--ana', 'href')) === '#/alan/felsefe/asama/2' && /Sonraki aşama/.test(await p.textContent('.kapisonuc .dugme--ana')));
    await p.click('.kapisonuc .dugme--ana');
    await p.waitForFunction(() => /Aşama 2/.test((document.querySelector('.govde .asama') || {}).textContent || ''));
    dene('aşama: ikinci aşama açıldı; birincisi «geçildi», ikincisi şu an burada', /geçildi/.test(await p.textContent('.asamalar .satir >> nth=0')) && (await p.getAttribute('.asamalar .satir >> nth=1', 'aria-current')) === 'page'
      && (await p.getAttribute('.eylemler .dugme--ana', 'href')) === '#/alan/felsefe/ders/' + y2.uniteler[0].dersler[0].id);
    await goruntu(p, 'asama-liste');
    const kayit1b = await p.evaluate(() => localStorage.getItem('lifeos.yol.felsefe.1'));
    await p.click('.eylemler .dugme--ana');
    await p.waitForSelector('article.ders h1');
    await p.click('[data-ac="okudum"]');
    await p.waitForFunction(() => !!localStorage.getItem('lifeos.yol.felsefe.2'));
    const k2 = await p.evaluate(() => JSON.parse(localStorage.getItem('lifeos.yol.felsefe.2')));
    dene('aşama: ikinci aşamanın kaydı kendi anahtarında; birincinin kaydı değişmedi', Object.keys(k2.dersler).length === 1 && Object.keys(k2.asamalar).length === 0 && (await p.evaluate(() => localStorage.getItem('lifeos.yol.felsefe.1'))) === kayit1b);
    await p.reload();
    await p.goto(T + '/kabuk/#/bugun');
    await p.waitForFunction(t => (document.querySelector('.karsila__sira') || {}).textContent.indexOf(t) >= 0, y2.ad, { timeout: 5000 }).catch(() => {});
    dene('aşama: Bugün yenilemeden sonra ikinci aşamayla karşılar', ((await p.textContent('.karsila__sira')) || '').indexOf(y2.ad) >= 0, await p.textContent('.karsila__sira'));
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
