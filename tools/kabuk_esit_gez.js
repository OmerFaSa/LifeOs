// KABUK ESITLEME GEZISI: kabukta yazilan kayit bilgisayardaki tek depoya gidiyor ve ikinci cihazda gorunuyor mu.
// Yalitilmis ortam (gecici veri klasoru, bos tek depo, uydurma sahip hesabi, deneme portu), gercek tarayici, iki ayri
// tarayici baglami = iki cihaz. Sinanan: yazi tek depoya gider (dosyadan okunur), ikinci cihaz ceker, ikinci cihazin
// yazdigi birinciye gelir, silme yayilir, Ayarlar durumu soyler, gunluk yedek alinir.
// Kullanim: node tools/kabuk_esit_gez.js
const kok = require('path').resolve(__dirname, '..');
const { chromium } = require(kok + '/tools/node_modules/playwright');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');

const PORT = 4392, T = 'http://127.0.0.1:' + PORT, PY = process.platform === 'win32' ? 'python' : 'python3';
const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'kabuk-esit-'));
const hesapK = path.join(gecici, 'LifeOS', 'hesap'), veriK = path.join(gecici, 'LifeOS', 'veri');
const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1', LOCALAPPDATA: gecici, APPDATA: gecici,
  LIFEOS_HESAP_KLASOR: hesapK });
// Sahip hesabi (uydurma) ve bos tek depo: kopru ancak ikisi de varsa acilir (sistem/hesap.py _kopru_ac)
const kur = spawnSync(PY, ['-c', [
  'import sys, os', 'sys.dont_write_bytecode = True', 'sys.path.insert(0, sys.argv[1])', 'import hesap, veri',
  'os.makedirs(os.environ["LIFEOS_HESAP_KLASOR"], exist_ok=True)',
  'd = hesap.Depo()', 'd.kur("sahip", "gezi-parolasi-1", True, "cihazGEZ00001")',
  'veri.Depo(sys.argv[2]).kapat()', 'print("kuruldu")'].join('\n'), path.join(kok, 'sistem'), veriK], { env, encoding: 'utf8' });
if (!/kuruldu/.test(kur.stdout || '')) { console.error('kurulum olmadı: ' + (kur.stderr || '').split('\n').slice(-3).join(' ')); process.exit(1); }
const srv = spawn(PY, [path.join(kok, 'sistem/tekkapi.py'), '--port', String(PORT), '--hkm-ayri'], { env, stdio: 'ignore' });
const bekle = () => new Promise((res, rej) => {
  const son = Date.now() + 40000;
  (function dene() { http.get(T + '/kabuk/', r => { r.resume(); res(); }).on('error', () => Date.now() > son ? rej(new Error('sunucu açılmadı')) : setTimeout(dene, 300)); })();
});
// Tek depodaki kabuk kaydini dosyadan okur (sunucudan bagimsiz kanit)
const depoda = anahtar => {
  const r = spawnSync(PY, ['-c', 'import sqlite3, sys, json\nc = sqlite3.connect(sys.argv[1])\nr = c.execute("SELECT govde, silindi FROM kayit WHERE alan=? AND yol=?", ("kabuk", sys.argv[2])).fetchone()\nprint(json.dumps(None if r is None or r[1] else json.loads(r[0])))',
    path.join(veriK, 'lifeos.db'), anahtar], { encoding: 'utf8' });
  try { return JSON.parse(r.stdout); } catch (e) { return undefined; }
};
const bekleKi = async (f, ms) => { const son = Date.now() + (ms || 15000); while (Date.now() < son) { if (await f()) return true; await new Promise(r => setTimeout(r, 250)); } return false; };
let kalan = 0;
const dene = (ad, kosul, ek) => { if (!kosul) kalan++; console.log((kosul ? '✓ ' : '✕ ') + ad + (kosul || ek == null ? '' : '  → ' + ek)); };

(async () => {
  await bekle();
  const b = await chromium.launch();
  try {
    const hata = [];
    const cihaz = async ad => {
      const c = await b.newContext({ viewport: { width: 1280, height: 800 } }), p = await c.newPage();
      p.on('pageerror', e => { hata.push(ad + ': ' + e.message); console.log('  sayfa hatası (' + ad + '): ' + e.message); });
      p.on('dialog', x => x.accept());
      return p;
    };
    const esit = p => p.evaluate(() => window.LIFEOS.Kabuk.Depo.esitle());

    // ---- cihaz A: not yazar ----
    const A = await cihaz('A');
    await A.goto(T + '/kabuk/#/motor/not/yeni');
    await A.waitForSelector('form.notform');
    await A.fill('input[name=baslik]', 'Erdem');
    await A.fill('textarea[name=govde]', 'Birinci cihazda yazıldı.');
    await A.click('form.notform button[type=submit]');
    await A.waitForFunction(() => /^#\/motor\/not\/n\w+$/.test(location.hash));
    dene('A: not tek depoya gitti (dosyadan okundu)', await bekleKi(() => { const v = depoda('lifeos.not.kayit'); return typeof v === 'string' && /Erdem/.test(v); }), String(depoda('lifeos.not.kayit')).slice(0, 80));
    const d1 = await esit(A);
    dene('A: eşitleme durumu açık, hatasız, bekleyen yok', d1.acik && !d1.hata && d1.bekleyen === 0, JSON.stringify(d1));
    dene('A: ayar tek depoya gitmedi (yalnız kayıt gider)', depoda('lifeos.tema.secim') === null && depoda('lifeos.yol.son') === null);

    // ---- cihaz B: boş açılır, A'nın notunu çeker ----
    const B = await cihaz('B');
    await B.goto(T + '/kabuk/#/motor/not');
    await B.waitForSelector('[data-arac="not"]');
    dene('B: ikinci cihaz A\'nın notunu gösterir', await bekleKi(async () => /Erdem/.test(await B.textContent('#not-liste'))), await B.textContent('#not-liste'));
    await B.goto(T + '/kabuk/#/motor/tekrar');
    await B.waitForSelector('form.kartform');
    await B.fill('input[name=on]', 'Arkhe nedir?');
    await B.fill('textarea[name=arka]', 'İlk madde.');
    await B.click('form.kartform button[type=submit]');
    dene('B: kart tek depoya gitti', await bekleKi(() => /Arkhe/.test(String(depoda('lifeos.tekrar.kartlar')))));

    // ---- A: B'nin kartını alır (pencereye dönünce / elle eşitlemede) ----
    await esit(A);
    await A.goto(T + '/kabuk/#/motor/tekrar');
    dene('A: B\'nin kartı birinci cihazda', await bekleKi(async () => /Arkhe/.test(await A.textContent('#sayfa'))), (await A.textContent('#sayfa')).slice(0, 120));

    // ---- çakışma: iki cihaz aynı notu görmeden değiştirir; sonuncu kazanır, öteki değer sunucuda saklanır ----
    await esit(B);
    const yazNot = (p, govde) => p.evaluate(g => { const D = window.LIFEOS.Kabuk.Depo, l = JSON.parse(D.getItem('lifeos.not.kayit')); l[0].govde = g; l[0].guncelleme = l[0].guncelleme + 1; D.setItem('lifeos.not.kayit', JSON.stringify(l)); return D.esitle(); }, govde);
    await A.evaluate(() => { window.LIFEOS.Kabuk.Depo.ag = null; });
    await B.evaluate(g => { const D = window.LIFEOS.Kabuk.Depo, l = JSON.parse(D.getItem('lifeos.not.kayit')); l[0].govde = g; D.setItem('lifeos.not.kayit', JSON.stringify(l)); }, 'B değiştirdi');
    await esit(B);
    await yazNot(A, 'A değiştirdi');
    dene('çakışma: sonra yazan (A) tek depoda', await bekleKi(() => /A değiştirdi/.test(String(depoda('lifeos.not.kayit')))), String(depoda('lifeos.not.kayit')).slice(0, 120));
    const sakli = spawnSync(PY, ['-c', 'import sqlite3, sys\nc = sqlite3.connect(sys.argv[1])\nprint(c.execute("SELECT count(*) FROM kayit WHERE alan=? AND govde LIKE ?", ("kabuk-cakisma", "%B değiştirdi%")).fetchone()[0])', path.join(veriK, 'lifeos.db')], { encoding: 'utf8', env });
    dene('çakışma: üstüne yazılan B değeri kaybolmadı (kabuk-cakisma alanında)', Number((sakli.stdout || '').trim()) >= 1, (sakli.stdout || '') + (sakli.stderr || '').slice(-200));
    await esit(B);
    dene('çakışma: B sonra A\'nın sürümünü alır', await bekleKi(async () => /A değiştirdi/.test(await B.evaluate(() => window.LIFEOS.Kabuk.Depo.getItem('lifeos.not.kayit')))));

    // ---- silme yayılır ----
    await A.evaluate(() => { const D = window.LIFEOS.Kabuk.Depo; D.removeItem('lifeos.tekrar.kartlar'); return D.esitle(); });
    dene('silme: tek depoda silindi', await bekleKi(() => depoda('lifeos.tekrar.kartlar') === null));
    await esit(B);
    dene('silme: ikinci cihazda da yok', await bekleKi(async () => (await B.evaluate(() => window.LIFEOS.Kabuk.Depo.getItem('lifeos.tekrar.kartlar'))) === null));

    // ---- yenilemeden sonra ve Ayarlar ----
    await B.reload();
    await B.goto(T + '/kabuk/#/motor/not');
    await B.waitForSelector('[data-arac="not"]');
    dene('B: yenilemeden sonra not duruyor', await bekleKi(async () => /Erdem/.test(await B.textContent('#not-liste'))));
    await A.goto(T + '/kabuk/#/ayarlar');
    await A.waitForSelector('[data-ayar-satir="depo.esitleme"]');
    dene('Ayarlar: «Bilgisayardaki depo» eşit diyor', await bekleKi(async () => /Eşit/.test(await A.textContent('[data-ayar-satir="depo.esitleme"]'))), await A.textContent('[data-ayar-satir="depo.esitleme"]'));

    // ---- günlük yedek ----
    dene('günlük yedek: tek depo veri/yedek altında', await bekleKi(() => fs.existsSync(path.join(veriK, 'yedek')) && fs.readdirSync(path.join(veriK, 'yedek')).some(a => /^lifeos-gunluk-\d{8}\.db$/.test(a)), 20000),
      fs.existsSync(path.join(veriK, 'yedek')) ? fs.readdirSync(path.join(veriK, 'yedek')).join(',') : 'klasör yok');
    dene('konsolda sayfa hatası yok', hata.length === 0, hata.join(' | '));
  } finally {
    await b.close(); srv.kill();
    try { fs.rmSync(gecici, { recursive: true, force: true }); } catch (e) { /* geçici klasör kalabilir */ }
  }
  console.log(kalan ? kalan + ' kaldı' : 'hepsi geçti');
  process.exit(kalan ? 1 : 0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
