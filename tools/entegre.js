#!/usr/bin/env node
/* Butunlesme denetimi — uc arayuz ile HKM gercekten konusuyor mu?
 *
 * Birim testleri iki tarafi AYRI AYRI denetler: {NS}.Beacon'un sozlesmesi
 * kendi testinde, HKM'nin validate()'i kendi testinde gecer. Ikisi de
 * gecerken yine de konusamayabilirler — iki taraf ayni sozlesmeyi
 * BIRBIRINDEN BAGIMSIZ yazdigi surece, aralarindaki fark yalniz burada
 * gorunur.
 *
 * Bu betik:
 *   1. HKM daemon'unu gecici bir veritabani ve jetonla ayaga kaldirir,
 *   2. her sistemi gercek tarayicida acar, isareti acar ve GERCEKTEN gonderir,
 *   3. HKM'nin 202 dondugunu ve brifingin uc modulu de gordugunu dogrular,
 *   4. HKM kapaliyken ayni akisin arayuzu BOZMADIGINI dogrular.
 *
 *   node tools/entegre.js
 *
 * Cikis kodu: 0 temiz, 1 sorun, 2 arac eksik.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HKM_PORT = 4299;
const TOKEN = 'entegre-denetimi-icin-gecici-jeton';
const BUGUN = new Date().toISOString().slice(0, 10);

const SISTEMLER = [
  { id:'AYS', ns:'R',   port:4271, mod:'ays' },
  { id:'SPI', ns:'SP',  port:4272, mod:'spi' },
  { id:'ESP', ns:'ESP', port:4273, mod:'esp' },
];

let chromium;
try{ ({ chromium } = require(path.join(ROOT, 'ESP', 'node_modules', 'playwright'))); }
catch(e){
  console.error('Playwright bulunamadi (ESP/node_modules). Kurulum: cd ESP && npm i -D playwright');
  process.exit(2);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function waitForServer(url, tries){
  for(let i = 0; i < (tries || 60); i++){
    try{ await fetch(url); return true; }catch(e){ await wait(200); }
  }
  return false;
}

function hkmFetch(yol, opt){
  return fetch('http://127.0.0.1:' + HKM_PORT + yol, Object.assign({
    headers:{ 'Authorization':'Bearer ' + TOKEN, 'Content-Type':'application/json' },
  }, opt || {}));
}

async function main(){
  const hatalar = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hkm-entegre-'));
  const cfg = path.join(ROOT, 'HKM', 'config.json');
  const cfgVardi = fs.existsSync(cfg);
  const cfgYedek = cfgVardi ? fs.readFileSync(cfg, 'utf8') : null;

  /* HKM'nin kendi config'i varsa DOKUNULMAZ: denetim, kullanicinin
     jetonunu degistirmez — yedeklenir ve sonunda geri konur. */
  fs.writeFileSync(cfg, JSON.stringify({
    host:'127.0.0.1', port:HKM_PORT, local_token:TOKEN,
    db_path:path.join(tmp, 'hkm.db'),
  }, null, 2));

  const daemon = spawn('python3', [path.join(ROOT, 'HKM', 'daemon.py')],
    { cwd:path.join(ROOT, 'HKM'), stdio:'ignore' });
  const sunucular = [];
  let browser;

  function kapat(){
    try{ daemon.kill(); }catch(e){}
    sunucular.forEach(s => { try{ s.kill(); }catch(e){} });
    if(cfgVardi) fs.writeFileSync(cfg, cfgYedek);
    else { try{ fs.unlinkSync(cfg); }catch(e){} }
    try{ fs.rmSync(tmp, { recursive:true, force:true }); }catch(e){}
  }

  try{
    if(!await waitForServer('http://127.0.0.1:' + HKM_PORT + '/api/health')){
      console.error('HKM ayaga kalkmadi.');
      kapat();
      process.exit(1);
    }
    browser = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});

    for(const s of SISTEMLER){
      const srv = spawn('python3', [path.join(ROOT, s.id, 'devserver.py'), String(s.port)],
        { cwd:path.join(ROOT, s.id), stdio:'ignore' });
      sunucular.push(srv);
      const base = 'http://127.0.0.1:' + s.port;
      if(!await waitForServer(base + '/index.html')){
        hatalar.push(s.id + ': devserver acilmadi');
        continue;
      }
      const page = await browser.newPage();
      const konsol = [];
      page.on('pageerror', e => konsol.push(String(e.message)));
      await page.goto(base + '/index.html', { waitUntil:'load' });
      await page.waitForSelector('.site', { timeout:15000 });
      await wait(700);
      for(let i = 0; i < 3; i++){
        const skip = await page.$('[data-act="setup-skip"]');
        if(!skip) break;
        await skip.click({ force:true }).catch(() => {});
        await wait(250);
      }

      /* 1 — kapaliyken hicbir sey gonderilmez. */
      const kapali = await page.evaluate(async ([ns, url, token]) => {
        const B = window[ns].Beacon;
        await B.save({ enabled:false, token, url });
        const r = await B.send();
        return { reason:r.reason, ok:r.ok };
      }, [s.ns, 'http://127.0.0.1:' + HKM_PORT, TOKEN]);
      if(kapali.ok || kapali.reason !== 'off'){
        hatalar.push(s.id + ': isaret kapaliyken gonderim denendi (' + kapali.reason + ')');
      }

      /* 1.5 — ESLEME: jeton hicbir yere ELLE yazilmadan baglanabiliyor mu?
         Bu, kurulumun en pahali surtunmesiydi; calistigini gormeden
         «tek tik kurulum» demek, denenmemis bir onay isareti basmaktir. */
      const kapaliPencere = await page.evaluate(async ([ns, url]) => {
        const B = window[ns].Beacon;
        await B.save({ enabled:false, token:'', url });
        const r = await B.pair(url);
        return { ok:r.ok, enabled:B.settings().enabled };
      }, [s.ns, 'http://127.0.0.1:' + HKM_PORT]);
      if(kapaliPencere.ok || kapaliPencere.enabled){
        hatalar.push(s.id + ': pencere kapaliyken esleme basarili gorundu');
      }

      const ac = await hkmFetch('/api/pair/open', { method:'POST', body:'{}' });
      if(ac.status !== 200) hatalar.push(s.id + ': esleme penceresi acilamadi');
      const esleme = await page.evaluate(async ([ns, url]) => {
        const B = window[ns].Beacon;
        const r = await B.pair(url);
        const a = B.settings();
        return { ok:r.ok, note:r.note, enabled:a.enabled, jetonVar:!!a.token };
      }, [s.ns, 'http://127.0.0.1:' + HKM_PORT]);
      if(!esleme.ok || !esleme.enabled || !esleme.jetonVar){
        hatalar.push(s.id + ': esleme basarisiz — ' + esleme.note);
      }else{
        console.log('  ' + s.id + ' → esleme ile baglandi (jeton elle yazilmadi)');
      }
      /* Pencere TEK KULLANIMLIK: ikinci cihaz ayni pencereden gecemez. */
      const ikinci = await page.evaluate(async ([ns, url]) => {
        const B = window[ns].Beacon;
        const r = await B.pair(url);
        return r.ok;
      }, [s.ns, 'http://127.0.0.1:' + HKM_PORT]);
      if(ikinci) hatalar.push(s.id + ': esleme penceresi ikinci kez de jeton verdi');

      /* 2 — acikken gercekten gonderir ve HKM 202 doner. */
      const acik = await page.evaluate(async ([ns, url, token]) => {
        const B = window[ns].Beacon;
        await B.save({ enabled:true, token, url });
        const on = B.preview();
        const r = await B.send({ force:true });
        return { ok:r.ok, status:r.status, note:r.note,
          keys:Object.keys(on.payload.metrics), errors:on.errors };
      }, [s.ns, 'http://127.0.0.1:' + HKM_PORT, TOKEN]);

      if(acik.errors.length) hatalar.push(s.id + ': kendi sozlesmesini gecemedi — ' + acik.errors[0]);
      if(!acik.ok) hatalar.push(s.id + ': HKM gonderimi basarisiz (' + acik.status + ') ' + acik.note);
      else console.log('  ' + s.id + ' → HKM 202 · ' + acik.keys.length + ' alan: ' + acik.keys.join(', '));

      /* 2.5 — GELISMIS kapsam ve GECMIS: HKM'nin korlugu kapaniyor mu?
         Ambar genislemeden brifing, veri gorunturuleme ve capraz bulgu
         icin veri yok demektir. */
      const genis = await page.evaluate(async ([ns]) => {
        const B = window[ns].Beacon;
        await B.save({ level:'gelismis' });
        const p = B.payload();
        const r = await B.send({ force:true });
        return { ok:r.ok, keys:Object.keys(p.metrics).length,
          hata:B.contract(p).length };
      }, [s.ns]);
      if(genis.hata) hatalar.push(s.id + ': gelismis govde kendi sozlesmesini gecemedi');
      if(!genis.ok) hatalar.push(s.id + ': gelismis govde HKM tarafindan kabul edilmedi');
      else console.log('  ' + s.id + ' → gelismis kapsam: ' + genis.keys + ' alan');

      const gecmis = await page.evaluate(async ([ns]) => {
        const B = window[ns].Beacon;
        const r = await B.backfill(20);
        return { ok:r.ok, sent:r.sent, empty:r.empty, status:r.status };
      }, [s.ns]);
      if(!gecmis.ok) hatalar.push(s.id + ': gecmis gonderimi basarisiz (' + gecmis.status + ')');
      else console.log('  ' + s.id + ' → gecmis: ' + gecmis.sent + ' gun gonderildi, '
        + gecmis.empty + ' gun olcumsuz (dogru davranis)');

      /* 3 — jeton yanlisken 401, ve bu arayuzu bozmaz. */
      const yanlis = await page.evaluate(async ([ns, url]) => {
        const B = window[ns].Beacon;
        await B.save({ enabled:true, token:'yanlis-jeton', url });
        const r = await B.send({ force:true });
        return { ok:r.ok, status:r.status };
      }, [s.ns, 'http://127.0.0.1:' + HKM_PORT]);
      if(yanlis.ok || yanlis.status !== 401){
        hatalar.push(s.id + ': yanlis jetonla 401 beklenirdi, gelen ' + yanlis.status);
      }

      /* 4 — HKM yokken (kapali port) arayuz bozulmaz. */
      const yok = await page.evaluate(async ([ns]) => {
        const B = window[ns].Beacon;
        await B.save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4998' });
        const r = await B.send({ force:true });
        const cizildi = document.querySelector('#main')
          && document.querySelector('#main').innerHTML.length > 50;
        return { ok:r.ok, status:r.status, cizildi };
      }, [s.ns]);
      if(yok.ok) hatalar.push(s.id + ': kapali HKM\'ye gonderim basarili gorundu');
      if(!yok.cizildi) hatalar.push(s.id + ': HKM ulasilamazken ekran bozuldu');
      if(konsol.length) hatalar.push(s.id + ': sayfa hatasi — ' + konsol[0]);

      await page.close();
    }

    /* 5 — HKM tarafi: uc modul de ambarda mi, brifing ayakta mi? */
    const b = await (await hkmFetch('/api/briefing?date=' + BUGUN)).json();
    const gorulen = Object.keys(b.audits || {}).sort().join(',');
    if(gorulen !== 'academic,bio,intellect'){
      hatalar.push('HKM brifingi uc modulu gormedi: ' + (gorulen || 'hicbiri'));
    }
    const buyurgan = (b.lines || []).filter(l => /(?:^|\s)(zorunlu|kapat|yasak|mecbur)(?:$|\s|\.)/i.test(l.text));
    if(buyurgan.length) hatalar.push('HKM brifinginde emir kipi: ' + buyurgan[0].text);
    const ikiz = await (await hkmFetch('/api/twin?date=' + BUGUN)).json();
    const kapsam = (ikiz.coverage || {}).total || 0;
    if(!kapsam) hatalar.push('HKM ikizi bos: hicbir etiketli metrik ambara girmedi');
    else console.log('  HKM → brifing ' + (b.lines || []).length + ' satir · ikiz '
      + kapsam + ' metrik · oneri: ' + (b.proposal ? 'rank ' + b.proposal.rank : 'yok'));
    /* 6 — Tam dongu: veri → oneri → KULLANICININ CEVABI.
       Gercek arayuzlerden gelen bos profiller bulgu uretmez (ve uretmemeli:
       veri yoklugu anomali degildir). Donguyu uctan uca denemek icin
       SENTETIK bir kirmizi bayrak gonderilir — bu, uc sistemin verisi
       degil, HKM'nin kendi yolunu denemek icindir. */
    const sentetik = await hkmFetch('/api/sync/spi', {
      method:'POST',
      body:JSON.stringify({ date:BUGUN, metrics:{
        sleep_hours:{ value:4.0, cert:'measured' },
        recovery:{ value:30, cert:'computed' } } }),
    });
    if(sentetik.status !== 202) hatalar.push('sentetik kirmizi bayrak yutulmadi: ' + sentetik.status);
    const b2 = await (await hkmFetch('/api/briefing?date=' + BUGUN)).json();
    if(!b2.proposal || b2.proposal.rank !== 1){
      hatalar.push('kirmizi bayrak birinci sirayi tetiklemedi');
    }else{
      console.log('  HKM → sentetik kirmizi bayrak: oncelik 1, oneri ' + b2.decision.id);
    }

    /* 7 — HKM'nin kendi yuzu: gercek tarayicida acilir, jeton girilir,
       brifing cizilir ve oneri varsa cevaplanabilir. Yuklenmeyen bir
       sayfa curur; bu yuzden denetim sayfayi da gezer. */
    const yuz = await browser.newPage();
    const yuzHata = [];
    yuz.on('pageerror', e => yuzHata.push(String(e.message)));
    await yuz.goto('http://127.0.0.1:' + HKM_PORT + '/', { waitUntil:'load' });
    await yuz.waitForSelector('#giris', { timeout:10000 });
    await yuz.fill('#token', TOKEN);
    await yuz.click('#gir');
    await wait(900);
    const ekran = await yuz.evaluate(() => ({
      brifing:(document.querySelector('#brifing') || {}).textContent || '',
      ikiz:(document.querySelector('#ikiz') || {}).textContent || '',
      gecmis:(document.querySelector('#gecmis') || {}).textContent || '',
      capraz:(document.querySelector('#capraz') || {}).textContent || '',
      girisAcik:!document.querySelector('#giris').hidden,
    }));
    if(ekran.girisAcik) hatalar.push('HKM yuzu: dogru jetonla bile giris ekraninda kaldi');
    if(ekran.brifing.length < 40) hatalar.push('HKM yuzu: brifing cizilmedi');
    if(ekran.ikiz.indexOf('metriğe dayanıyor') < 0) hatalar.push('HKM yuzu: ikiz cizilmedi');
    if(ekran.gecmis.length < 20) hatalar.push('HKM yuzu: oneri gecmisi cizilmedi');
    if(ekran.capraz.indexOf('Çapraz bulgu') < 0) hatalar.push('HKM yuzu: capraz bulgu karti cizilmedi');
    if(yuzHata.length) hatalar.push('HKM yuzu: sayfa hatasi — ' + yuzHata[0]);
    else console.log('  HKM yuzu → brifing, ikiz ve oneri gecmisi cizildi');

    /* Oneri yuzden CEVAPLANABILIYOR mu? Cevaplanamayan bir oneri, oneri
       degil bildirimdir. */
    const buton = await yuz.$('[data-cevap="accept"]');
    if(!buton){
      hatalar.push('HKM yuzu: oneri cevaplanabilir degil (kabul dugmesi yok)');
    }else{
      await buton.click();
      await wait(700);
      const kabul = await (await hkmFetch('/api/decisions?date=' + BUGUN)).json();
      if(!kabul.current) hatalar.push('HKM yuzu: kabul kaydedilmedi');
      else console.log('  HKM yuzu → oneri kabul edildi (karar ' + kabul.current.id + ')');
      const kalan = (kabul.decisions || []).filter(d => d.state === 'declined');
      if(kalan.length) console.log('  · reddedilen ' + kalan.length + ' oneri kaydi da duruyor');
    }
    /* 8 — Buyuk Patron: yuzden komut gonderilir ve cevap ayni sayfada
       gorunur. Kanal (WhatsApp) kapali olsa bile yerel kanal calisir. */
    await yuz.fill('#mesaj', 'neden');
    await yuz.click('#gonder');
    await wait(900);
    const konusma = await yuz.evaluate(() =>
      (document.querySelector('#konusmalar') || {}).textContent || '');
    if(konusma.indexOf('neden') < 0) hatalar.push('HKM yuzu: komut kaydi gorunmedi');
    else if(konusma.indexOf('Öncelik') < 0 && konusma.indexOf('öneri yok') < 0){
      hatalar.push('HKM yuzu: Patron cevabi gorunmedi');
    }else{
      console.log('  HKM yuzu → Patron komutu cevaplandi');
    }

    await yuz.close();
  }catch(err){
    hatalar.push('kosum hatasi: ' + (err && err.message ? err.message : err));
  }finally{
    if(browser) await browser.close().catch(() => {});
    kapat();
  }

  if(hatalar.length){
    console.log('\n' + hatalar.length + ' sorun:');
    hatalar.forEach(h => console.log('  ✕ ' + h));
    process.exit(1);
  }
  console.log('\nButunlesme temiz: uc arayuz de HKM ile konustu, HKM kapaliyken hicbiri bozulmadi.');
  process.exit(0);
}

main();
