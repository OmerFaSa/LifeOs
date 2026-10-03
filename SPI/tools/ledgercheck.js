/* Defter duzeni denetimi.

   Uc seyi arar, on iki ekranin butun sekmelerinde:

     1. IC ICE defter satiri  — bir satirin icinde baska bir satir
     2. Defterde KUTU kart    — donusturulmemis bir kart kalmis
     3. YATAY TASMA           — icerik pencereden tasiyor

   Defter kipi `Card`'i satira cevirdigi icin, bir kartin govdesindeki
   ic karti isaretlemeyi unutmak (box:true) sessizce bozuk duzen uretir.
   Bu betik onu yakalar.

   Kullanim:  node tools/ledgercheck.js [port] */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
/* Kendi portu. Eskiden devserver'in varsayilani 4183'u kullaniyordu: o
   UYGULAMANIN portudur (sistem/sunucu.py). Uygulama aciksa denetim kendi
   sunucusunu acamiyor ve acik uygulamayi — baska bir kopyanin dosyalarini
   — olcuyordu. */
const PORT = Number(process.argv[2]) || 4181;
/* Sunucu, denetimin KENDI klasorunden acilir. Burada depo koku SABIT
   yaziliydi (`/home/user/LifeOs/...`): o yol yalnizca bir gelistirme
   makinesinde vardi, baska her yerde sunucu hic acilmiyor ve denetim
   bos sayfa olcuyordu. __dirname her yerde dogrudur. Sunucu muhafizdan
   SONRA acilir (asagida). */
let srv = null;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* PORT MUHAFIZI (2026-10-03). Port sabittir: ayni denetim baska bir
   worktree'de ayni anda kosarsa bu kosunun sunucusu portu alamaz, ama
   saglik denetimi OTEKININ sunucusundan cevap alir ve denetim baska bir
   kopyanin dosyalarini olcer. Port doluysa denetim HIC baslamaz — dosya
   yazmaz, sunucu acmaz: cikis 2 (kirmizi degil, kosulamadi). Desen
   tools/entegre.js'ten; tools/portmuhafiz.test.js sinar. */
function portDolu(port){
  const dene = host => new Promise(r => {
    const s = require('net').connect({ host, port });
    s.setTimeout(1000, () => { s.destroy(); r(false); });
    s.once('connect', () => { s.destroy(); r(true); });
    s.once('error', () => r(false));
  });
  return Promise.all([dene('127.0.0.1'), dene('::1')]).then(x => x.some(Boolean));
}
async function portMuhafizi(portlar, ipucu){
  const dolu = [];
  for(const p of portlar) if(await portDolu(p)) dolu.push(p);
  if(!dolu.length) return;
  console.error('Port dolu: ' + dolu.join(', ') + ' — başka bir koşu (belki başka bir worktree\'de) '
    + 'ya da açık bir sunucu kullanıyor.\nBu koşu kendi sunucusunu açamaz, ötekini ölçerdi; '
    + 'o bitince yeniden koş' + (ipucu ? ' ya da boş bir port ver: ' + ipucu : '') + '.');
  process.exit(2);
}

(async () => {
  await portMuhafizi([PORT], 'node tools/ledgercheck.js <port>');
  srv = spawn('python3', ['devserver.py', String(PORT)], { cwd:ROOT, stdio:'ignore' });
  await wait(1200);
  /* Tarayici ikilisi: CHROMIUM_PATH verilmisse O, verilmemisse
     Playwright'in kendi kurdugu. Burada bir yol SABIT yaziliydi ve o
     yol yalnizca bir gelistirme ortaminda vardi: denetim CI'da
     "Executable doesn't exist" ile duserdi — yani hicbir zaman
     kosmayacak bir denetimdi. */
  const b = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ reducedMotion:'reduce', viewport:{ width:1440, height:900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil:'load' });
  await wait(1400);
  const s = await p.$('[data-act="setup-skip"]'); if(s){ await s.click(); await wait(500); }
  await p.evaluate(async () => {
    await SP.Model.saveProfile({ name:'Ö', birthYear:1998, sex:'male', heightCm:178,
      weightKg:82, activity:'moderate', goal:'cut' });
    const r = SP.Model.newLab('2026-08-20');
    Object.entries({ ferritin:26, b12:288, hdl:44 }).forEach(([k,v]) => {
      const bb=SP.BIO_BY_ID[k]; r.values[k]={ v, cert:'measured', unit:bb?bb.unit:'' }; });
    await SP.Model.saveLab(r);
    await SP.Model.saveVitals(SP.U.todayISO(), { sleep:7, soreness:3, rhr:58 });
    const m = SP.Model.newMeal('ogle');
    m.items=[{foodId:'pilav', g:180, cert:'estimated'}];
    await SP.Model.addMeal(SP.U.todayISO(), m);
    await SP.Model.setBasketItem('pilav', 2);
  });
  const bad = [];
  let bakilan = 0;
  const routes = ['today','labs','meals','kitchen','move','basket','office','team','meeting','analytics','family','guide'];
  const tabs = { today:['giris','ozet','gecmis'], labs:['sonuc','giris','gecmis','trend'],
    meals:['gunluk','oneri','deger'], move:['bugun','kardiyo','kuvvet','esneklik','dinlenme','ilerleme'],
    basket:['butce','sepet','ikame','fiyat'], analytics:['capraz','hafta','seri'],
    guide:['kullanim','model','veri','sinir'] };
  for(const r of routes){
    for(const t of (tabs[r] || [null])){
      await p.evaluate(id => SP.App.go(id), r);
      await wait(200);
      if(t){ await p.evaluate(tt => { const el=document.querySelector(`[data-tab="${tt}"]`); if(el) el.click(); }, t); await wait(280); }
      const res = await p.evaluate(() => ({
        nested:document.querySelectorAll('.lrow .lrow').length,
        cardInLedger:document.querySelectorAll('.ledger > .card').length,
        overflow:document.documentElement.scrollWidth > window.innerWidth + 2,
      }));
      bakilan++;
      if(res.nested) bad.push(`${r}${t?'/'+t:''}  ic ice defter satiri: ${res.nested}`);
      if(res.cardInLedger) bad.push(`${r}${t?'/'+t:''}  defterde kutu kart: ${res.cardInLedger}`);
      if(res.overflow) bad.push(`${r}${t?'/'+t:''}  yatay tasma`);
    }
  }
  console.log(errs.length ? 'JS HATASI:\n'+errs.slice(0,5).join('\n') : 'js temiz');
  console.log(bad.length ? 'DUZEN SORUNU:\n' + bad.join('\n')
    : bakilan + ' ekran/sekmede defter düzeni temiz');
  await b.close(); srv.kill(); process.exit(0);
})().catch(e => { console.error(e); if(srv) srv.kill(); process.exit(1); });
