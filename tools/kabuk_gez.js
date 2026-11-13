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
    p.on('pageerror', e => hata.push(e.message));
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
