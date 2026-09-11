/* Defter duzeni denetimi.

   Uc seyi arar, on iki ekranin butun sekmelerinde:

     1. IC ICE defter satiri  — bir satirin icinde baska bir satir
     2. Defterde KUTU kart    — donusturulmemis bir kart kalmis
     3. YATAY TASMA           — icerik pencereden tasiyor

   Defter kipi `Card`'i satira cevirdigi icin, bir kartin govdesindeki
   ic karti isaretlemeyi unutmak (box:true) sessizce bozuk duzen uretir.
   Bu betik onu yakalar.

   Kullanim:  node tools/ledgercheck.js */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const srv = spawn('python3', ['devserver.py'], { cwd:'/home/user/LifeOs/SPI', stdio:'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await wait(1200);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1440, height:900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:4183/index.html', { waitUntil:'load' });
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
      if(res.nested) bad.push(`${r}${t?'/'+t:''}  ic ice defter satiri: ${res.nested}`);
      if(res.cardInLedger) bad.push(`${r}${t?'/'+t:''}  defterde kutu kart: ${res.cardInLedger}`);
      if(res.overflow) bad.push(`${r}${t?'/'+t:''}  yatay tasma`);
    }
  }
  console.log(errs.length ? 'JS HATASI:\n'+errs.slice(0,5).join('\n') : 'js temiz');
  console.log(bad.length ? 'DUZEN SORUNU:\n' + bad.join('\n') : 'duzen temiz');
  await b.close(); srv.kill(); process.exit(0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
