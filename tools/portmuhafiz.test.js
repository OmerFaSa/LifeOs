#!/usr/bin/env node
/* Sabit portlu denetimler port doluysa HİÇ başlamaz.
 *
 * Denetim araçları sunucularını SABİT bir portta açar (duman 4176, yüz
 * 4296 …). İki worktree'de iki oturum aynı denetimi aynı anda koşunca
 * ikincinin sunucusu portu alamaz; ama sağlık denetimi BİRİNCİNİN
 * sunucusundan cevap alır ve ikinci koşu ötekinin dosyalarını, ötekinin
 * verisini ölçer. 2026-10-03'te entegre.js'te üç koşu böyle geçersiz çıktı
 * («iş emri #1 zaten hazırlanıyor», «niyet kuyruğu boş»). Port doluysa araç
 * hiçbir şey yazmadan ve başlatmadan 2 ile çıkar: kırmızı değil, koşulamadı.
 *
 * Bu test her aracı iki kez koşturur; tarayıcı, alt süreç, dosya yazımı ve
 * ağ isteği engellenmiştir (Playwright de python3 de gerekmez):
 *
 *   1. port DOLU  → çıkış 2, «Port dolu: <port>», hiçbir yan etki yok
 *   2. port BOŞ   → muhafız geçer; araç işine başlar ve ilk yan etkide
 *                   engele çarpar (her zaman 2 veren bir muhafız da 1'den
 *                   geçerdi)
 *
 * Bir de liste tamlığı: araç klasörlerinde sunucu başlatan her dosya
 * aşağıdaki listede olmalı — yeni bir denetim muhafızsız gelemesin.
 *
 *   node tools/portmuhafiz.test.js    (çıkış 0 temiz, 1 kırmızı)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const KOK = path.resolve(__dirname, '..');

/* Port argümanı alan araçlara boş bir port verilir (başka bir koşuya
   değmez); sabit portlu olanlarda o port tutulur. Çok portlularda SON port
   tutulur: muhafız ilkine bakıp susmasın. */
const ARG = p => [String(p)];
const DENETIMLER = [];
for(const s of ['AYS', 'SPI', 'ESP']){
  for(const a of ['runtests', 'smoke', 'a11ycheck', 'layoutcheck', 'perfcheck', 'loadcheck', 'palettecheck']){
    DENETIMLER.push({ dosya:s + '/tools/' + a + '.js', cwd:s, arg:ARG });
  }
}
DENETIMLER.push(
  { dosya:'AYS/tools/evalagents.js', cwd:'AYS', arg:() => [],
    env:p => ({ ROTA_PORT:String(p), ROTA_PROVIDER:'sahte', ROTA_MODEL:'sahte' }) },
  { dosya:'SPI/tools/designcheck.js', cwd:'SPI', arg:ARG },
  { dosya:'SPI/tools/ledgercheck.js', cwd:'SPI', arg:ARG },
  { dosya:'HKM/tools/yuz.js', cwd:'.', sabit:[4296] },
  { dosya:'tools/envanter.js', cwd:'.', sabit:[4391, 4392, 4393] },
  { dosya:'tools/tiklama.js', cwd:'.', sabit:[4394, 4395, 4396] },
  { dosya:'tools/kapsam.js', cwd:'.', sabit:[4601, 4602, 4603] },
  { dosya:'tools/nerede.js', cwd:'.', sabit:[4389], arg:() => ['AYS'] },
);

/* Sunucu başlatıp bu listede OLMAYAN dosyalar — gerekçesiyle. */
const LISTE_DISI = {
  /* Muhafızı ayrı bir işte yazıldı (2026-10-03, entegre koşuları
     karışınca). O iş main'e girince buraya değil DENETIMLER'e taşınır:
     { dosya:'tools/entegre.js', cwd:'.', sabit:[4299, 4271, 4272, 4273] } */
  'tools/entegre.js':'muhafızı ayrı işte',
};

/* --- engel: koşulan aracın içine yüklenir ------------------------------ */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'portmuhafiz-'));
const SAHTE = path.join(tmp, 'sahte-playwright.js');
const ENGEL = path.join(tmp, 'engel.js');
fs.writeFileSync(SAHTE,
  "module.exports = { chromium:{ launch(){ require(" + JSON.stringify(ENGEL) + ").ihlal('chromium.launch'); } } };\n");
fs.writeFileSync(ENGEL, `
const ihlal = ne => { process.stderr.write('\\nMUHAFIZ-IHLAL: ' + ne + '\\n'); process.exit(97); };
module.exports = { ihlal };
const cp = require('child_process');
for(const ad of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']){
  cp[ad] = () => ihlal('child_process.' + ad);
}
const fs = require('fs');
for(const ad of ['writeFileSync', 'appendFileSync', 'mkdirSync', 'mkdtempSync', 'rmSync',
  'unlinkSync', 'copyFileSync', 'renameSync', 'writeFile', 'mkdir', 'mkdtemp']){
  fs[ad] = a => ihlal('fs.' + ad + ' ' + a);
}
globalThis.fetch = u => ihlal('fetch ' + u);
const M = require('module'); const c = M._resolveFilename;
M._resolveFilename = function(r){
  if(/(^|[\\\\/])playwright([\\\\/]|$)/.test(String(r))) return ${JSON.stringify(SAHTE)};
  return c.apply(this, arguments);
};
`);

function koş(d, port){
  const r = spawnSync(process.execPath, ['--require', ENGEL, path.join(KOK, d.dosya)]
    .concat(d.arg ? d.arg(port) : []), {
    cwd:path.join(KOK, d.cwd), encoding:'utf8', timeout:20000,
    env:Object.assign({}, process.env, { NODE_PATH:'' }, d.env ? d.env(port) : {}),
  });
  return { kod:r.status, cikti:(r.stdout || '') + (r.stderr || '') };
}

/* Port tutucu: bağlanana kapıyı kapatır; muhafız için «biri dinliyor». */
function tut(port){
  return new Promise(coz => {
    const s = net.createServer(k => k.destroy());
    s.once('error', e => coz({ s:null, hata:e.code }));
    s.listen(port || 0, '127.0.0.1', () => coz({ s, port:s.address().port }));
  });
}
const kapat = t => new Promise(r => t && t.s ? t.s.close(() => r()) : r());

(async () => {
  let kirmizi = 0, atlanan = 0;
  const yaz = (ok, ad, not) => {
    if(!ok) kirmizi++;
    console.log((ok ? '  ✓ ' : '  ✕ ') + ad + (not ? ' — ' + not : ''));
  };
  const son = s => s.trim().split('\n').slice(-2).join(' | ');

  for(const d of DENETIMLER){
    if(!fs.existsSync(path.join(KOK, d.dosya))){ yaz(false, d.dosya, 'dosya yok'); continue; }
    const hedef = d.sabit ? d.sabit[d.sabit.length - 1] : 0;

    /* 1. DOLU */
    const t = await tut(hedef);
    const port = t.s ? t.port : hedef;          // EADDRINUSE: zaten dolu, yine dolu sayılır
    const r = koş(d, port);
    await kapat(t);
    const dogru = r.kod === 2 && new RegExp('Port dolu:.*\\b' + port + '\\b').test(r.cikti)
      && !/MUHAFIZ-IHLAL/.test(r.cikti);
    yaz(dogru, d.dosya + ' · ' + port + ' doluyken başlamaz',
      dogru ? '' : 'çıkış ' + r.kod + ': ' + son(r.cikti));

    /* 2. BOŞ — sabit port başka bir koşuda gerçekten doluysa ölçülemez. */
    const bos = await tut(port);
    if(!bos.s){
      atlanan++;
      console.log('  · ' + d.dosya + ' · ' + port + ' boşken: ÖLÇÜLMEDİ (port bu makinede şu an dolu)');
      continue;
    }
    await kapat(bos);
    const b = koş(d, port);
    const gecti = b.kod === 97 && /MUHAFIZ-IHLAL/.test(b.cikti);
    yaz(gecti, d.dosya + ' · ' + port + ' boşken işine başlar',
      gecti ? '' : 'çıkış ' + b.kod + ': ' + son(b.cikti));
  }

  /* Liste tamlığı */
  const SUNUCU = /spawn\(\s*['"]python3?['"]\s*,\s*\[[^\]]*(devserver\.py|http\.server|daemon\.py)/;
  const listede = new Set(DENETIMLER.map(d => d.dosya));
  for(const k of ['AYS/tools', 'SPI/tools', 'ESP/tools', 'HKM/tools', 'tools']){
    for(const f of fs.readdirSync(path.join(KOK, k))){
      if(!f.endsWith('.js') || f.endsWith('.test.js')) continue;
      const yol = k + '/' + f;
      if(!SUNUCU.test(fs.readFileSync(path.join(KOK, yol), 'utf8'))) continue;
      if(!listede.has(yol) && !LISTE_DISI[yol]) yaz(false, yol, 'sunucu başlatıyor ama bu testin listesinde yok');
    }
  }

  fs.rmSync(tmp, { recursive:true, force:true });
  console.log(kirmizi
    ? '\n' + kirmizi + ' sorun.'
    : '\n' + DENETIMLER.length + ' denetim: port doluyken hiçbiri başlamıyor.'
      + (atlanan ? ' (' + atlanan + ' «boşken» ölçümü atlandı: port şu an başka bir koşuda.)' : ''));
  process.exit(kirmizi ? 1 : 0);
})();
