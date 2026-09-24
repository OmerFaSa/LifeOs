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

const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HKM_PORT = 4299;
const TOKEN = 'entegre-denetimi-icin-gecici-jeton';
/* GUN SINIRI (HATALAR KO-1): HKM gunu kullanicinin diliminde sayar
   (HKM/core/saat.py, varsayilan Europe/Istanbul) ve kabin TZ'sine bakmaz.
   Denetim de AYNI dilimde yasar: tarayici sayfalari o dilimde acilir ve
   «bugun» o dilimin gunudur. Yoksa UTC bir kapta 21:00-24:00 arasi HKM
   ertesi gunde, arayuzler onceki gunde kalir ve dokuz adim kirmizi olur. */
const DILIM = 'Europe/Istanbul';
const dilimGunu = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone:DILIM,
  year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(ms == null ? Date.now() : ms));
const BUGUN = dilimGunu();

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

    /* 0.5 — NIYET KUYRUGU: HKM is baslatir ama YAZMAZ.
       Patron'a dogal dille bir istek yazilir, kuyruga bir teklif duser,
       arayuz onu alir ve UYGULAYAN arayuzun kendi kodudur. */
    const istek = await (await hkmFetch('/api/message', {
      method:'POST',
      body:JSON.stringify({ text:'yarın 2 saat matematik çalışacağım',
        date:BUGUN }) })).json();
    if(istek.command !== 'istek') hatalar.push('Patron istegi niyete cevirmedi');
    const kuyruk = await (await hkmFetch('/api/intents/ays')).json();
    if(!(kuyruk.intents || []).length) hatalar.push('niyet kuyruga dusmedi');
    else console.log('  HKM → istek niyete cevrildi: ' + kuyruk.intents[0].kind
      + ' (' + kuyruk.intents[0].payload.minutes + ' dk)');

    /* 0.6 — AKSAM YOKLAMASI (Y7): yoklamanin cevabi sohbete yazilir. HKM
       cumleyi yalniz YONLENDIRIR — sayiyi okumaz, hicbir module yazmaz —
       her modulun kuyruguna `kayit.add` duser. Govdede tarih YOK: HKM yuzu
       disindaki istemci tarih yollamayabilir ve bu yol bir sure NameError
       ile dusuyordu. */
    const yoklama = await (await hkmFetch('/api/chat', {
      method:'POST',
      body:JSON.stringify({ text:'bugün 40 soru çözdüm, 7 saat uyudum ve 30 dakika gitar çaldım' }),
    })).json();
    if(yoklama.command !== 'kayit') hatalar.push('HKM yoklama cevabini kayit teklifine cevirmedi ('
      + yoklama.command + ')');
    else{
      const kayitlar = [];
      for(const s of SISTEMLER){
        const q = await (await hkmFetch('/api/intents/' + s.mod)).json();
        const n = (q.intents || []).find(x => x.kind === 'kayit.add');
        if(!n) hatalar.push(s.id + ': kayit teklifi kuyruga dusmedi');
        else kayitlar.push(s.id + ' «' + n.payload.metin + '»');
      }
      console.log('  HKM → yoklama cevabi uc kuyruga bolundu: ' + kayitlar.join(' · '));
    }


    /* 0.7 — BAM URUNU (W6): model gerektirmeden bir urun kaydi yazilir
       (Uretim Burosu'nun ciktisiyla ayni govde). Asil sinanan, modulun
       HKM'nin GERCEK basili halini kendi koduyla kabul edip etmedigidir. */
    let urunKaydi = null;
    try{
      urunKaydi = Number(execFileSync('python3', ['-c', [
        'import sys',
        'from core import db, bam',
        'con = db.connect(sys.argv[1])',
        'g = {"tur": "urun", "urun": "ozet", "aile": "belge", "urun_ad": "Konu özeti",',
        '     "baslik": "Türev", "kaynaklar": [], "bolumler": [{"baslik": "Giriş",',
        '     "bloklar": [{"t": "p", "metin": "Türev, bir değişim hızıdır."}]}]}',
        'k = bam.kayit_ekle(con, "materyal", "Türev", g)',
        'con.commit()',
        'print(k["id"])'].join('\n'), path.join(tmp, 'hkm.db')],
      { cwd:path.join(ROOT, 'HKM') }).toString().trim());
    }catch(e){ hatalar.push('urun kaydi yazilamadi: ' + e.message); }

    /* 0.8 — SPİ BILGISI (Part 8c-2): Arastirma Burosu'nun besin kaydiyla ayni
       govde, model gerektirmeden yazilir. Sinanan: SPİ kaydi HKM'den cekip
       KENDI koduyla sinar, onaydan once onizler, onayla yazar, geri alir. */
    let bilgiKaydi = null;
    try{
      bilgiKaydi = Number(execFileSync('python3', ['-c', [
        'import sys',
        'from core import db, bam',
        'con = db.connect(sys.argv[1])',
        'g = {"tur": "besin", "ad": "Kinoa (çiğ)", "istenen": "kinoa",',
        '     "deger": {"kcal": 368, "p": 14.1, "f": 6.1, "c": 64.2, "sat": 0.7, "fib": 7,',
        '               "sugar": None}, "micro": {"iron": 4.6}, "porsiyonlar": [],',
        '     "bilinmeyen_mikro": [], "kaynaklar": [{"n": 1, "url": "https://ornek.org"}]}',
        'k = bam.kayit_ekle(con, "arastirma", "Kinoa besin değerleri", g, dogruluk="kaynakli")',
        'con.commit()',
        'print(k["id"])'].join('\n'), path.join(tmp, 'hkm.db')],
      { cwd:path.join(ROOT, 'HKM') }).toString().trim());
    }catch(e){ hatalar.push('spi bilgi kaydi yazilamadi: ' + e.message); }

    /* 0.9 — ESP DIL UNITESI (Part 8d): Uretim Burosu'nun unite kaydiyla ayni
       govde. Sinanan: ESP kaydi KENDI koduyla sinar, onizler, onayla kartlari
       desteye koyar; pratik motoru sorusunu o desteden kurar. */
    let uniteKaydi = null;
    try{
      uniteKaydi = Number(execFileSync('python3', ['-c', [
        'import sys',
        'from core import db, bam',
        'con = db.connect(sys.argv[1])',
        'ogeler = [{"on": a, "arka": b} for a, b in [("Привет", "merhaba"), ("Спасибо", "teşekkürler"),',
        '          ("Пожалуйста", "lütfen"), ("До свидания", "hoşça kal"), ("Нет", "hayır"),',
        '          ("Извините", "affedersiniz"), ("Доброе утро", "günaydın")]]',
        'g = {"tur": "unite", "dil": "ru", "duzey": "A1", "konu": "selamlaşma",',
        '     "baslik": "Rusça A1 · selamlaşma", "uniteler": [{"baslik": "Selamlaşma",',
        '     "hedef": "Yedi selamlaşma kalıbını düşünmeden kurmak.", "gorev": None,',
        '     "ogeler": ogeler}]}',
        'k = bam.kayit_ekle(con, "materyal", "Rusça A1 · selamlaşma", g)',
        'con.commit()',
        'print(k["id"])'].join('\n'), path.join(tmp, 'hkm.db')],
      { cwd:path.join(ROOT, 'HKM') }).toString().trim());
    }catch(e){ hatalar.push('unite kaydi yazilamadi: ' + e.message); }

    /* 0.10 — ESP BELGESI (Part 8f): Arastirma Burosu'nun tarih kaydiyla ayni
       govde (kaynakli). Sinanan: ESP olaylari kaynaklariyla Kronoloji'ye
       koyar; kaynaksiz belgeyi almaz. */
    let belgeKaydi = null;
    try{
      belgeKaydi = Number(execFileSync('python3', ['-c', [
        'import sys',
        'from core import db, bam',
        'con = db.connect(sys.argv[1])',
        'g = {"tur": "tarih", "konu": "Osmanlı Beyliği", "kaynaklar": [{"n": 1, "baslik": "Osmanlı Beyliği",',
        '     "url": "https://tr.wikipedia.org/wiki/Osmanli", "tur": "ansiklopedi"}],',
        '     "olaylar": [{"baslik": "Osmanlı Beyliği’nin kuruluşu", "yil": 1299, "tur": "siyasi",',
        '     "bolge": "anadolu", "neden": "Başlangıç.", "kaynak": 1, "alinti": "1299"}]}',
        'k = bam.kayit_ekle(con, "arastirma", "Tarih belgesi: Osmanlı Beyliği", g, dogruluk="kaynakli")',
        'con.commit()',
        'print(k["id"])'].join('\n'), path.join(tmp, 'hkm.db')],
      { cwd:path.join(ROOT, 'HKM') }).toString().trim());
    }catch(e){ hatalar.push('belge kaydi yazilamadi: ' + e.message); }

    for(const s of SISTEMLER){
      const srv = spawn('python3', [path.join(ROOT, s.id, 'devserver.py'), String(s.port)],
        { cwd:path.join(ROOT, s.id), stdio:'ignore' });
      sunucular.push(srv);
      const base = 'http://127.0.0.1:' + s.port;
      if(!await waitForServer(base + '/index.html')){
        hatalar.push(s.id + ': devserver acilmadi');
        continue;
      }
      const page = await browser.newPage({ reducedMotion:'reduce', timezoneId:DILIM });
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

      /* 2.6 — HAFIZA: modulde «hatirla» denen sey King'e ulasir;
         modulde unutulan HKM'de de etkinligini yitirir. Anlik goruntu
         esitlemesi (HKM core/memory.py esitle). */
      const metin = s.id + ' hafıza denemesi';
      const hafiza = await page.evaluate(async ([ns, metin]) => {
        const H = window[ns].Hafizam;
        if(!H) return { yok:true };
        const e = await H.ekle(metin, { katman:'soz', kaynak:'kullanici' });
        const g = await H.hkmeGonder();
        return { ok:e.ok && g.ok, id:e.kayit && e.kayit.id, status:g.status };
      }, [s.ns, metin]);
      const kral = await (await hkmFetch('/api/memory?scope=king&limit=200')).json();
      const gorunen = (kral.memories || []).filter(m => m.text === metin && m.modul === s.mod);
      if(hafiza.yok) hatalar.push(s.id + ': hafiza kurulmamis');
      else if(!hafiza.ok || gorunen.length !== 1){
        hatalar.push(s.id + ': hafiza King\'e ulasmadi (' + hafiza.status + ')');
      }else{
        await page.evaluate(async ([ns, id]) => {
          await window[ns].Hafizam.unut(id);
          await window[ns].Hafizam.hkmeGonder();
        }, [s.ns, hafiza.id]);
        const sonra = await (await hkmFetch('/api/memory?scope=king&limit=200')).json();
        if((sonra.memories || []).some(m => m.text === metin)){
          hatalar.push(s.id + ': modulde unutulan hafiza HKM\'de etkin kaldi');
        }else{
          console.log('  ' + s.id + ' → hafiza King\'e ulasti, modulde unutulunca HKM\'de de dustu');
        }
      }

      /* 2.65 — KANAL: Patron brifingi oteki iki modulun bugunku hukmunu
         ve King'in onerisini HKM'den alir (brand/ortak/ofis.js). */
      const kanalS = await page.evaluate(async ([ns]) => {
        const N = window[ns];
        if(!N.Kanal) return { yok:true };
        await N.Kanal.cek();
        if(N.Office.resetBriefs) N.Office.resetBriefs();
        const b = N.Office.brief('patron');
        const k = (b.data && b.data.king) || b.king || null;
        return { king:!!k, moduller:k ? Object.keys(k.moduller).sort() : [] };
      }, [s.ns]);
      if(kanalS.yok) hatalar.push(s.id + ': kanal kurulmamis');
      else if(!kanalS.king || kanalS.moduller.length !== 2){
        hatalar.push(s.id + ': Patron brifingine King kanali girmedi (' + kanalS.moduller.join(',') + ')');
      }else{
        console.log('  ' + s.id + ' → Patron brifingi King kanalini tasiyor: ' + kanalS.moduller.join(', '));
      }

      /* 2.7 — NIYET: arayuz kuyrugu alir, UYGULAYAN kendi kodudur.
         Yalniz AYS icin denenir: teklif oraya birakildi. */
      if(s.id === 'AYS'){
        const niyet = await page.evaluate(async ([ns]) => {
          const B = window[ns].Beacon;
          /* Kuyrukta gunun kaydi (2.75) da bekliyor: burada yalniz plan
             teklifi sayilir. */
          const planlar = async () => (await B.intents()).filter(x => x.kind === 'plan.add');
          const liste = await planlar();
          if(!liste.length) return { alindi:0 };
          const n = liste[0];
          /* Gun kaydi henuz yoksa ensureDay() sablon bloklari da kurar;
             bu yuzden toplam sayi degil, TEKLIFTEN gelen blok sayilir. */
          const say = () => ((window[ns].S.days[n.payload.date] || {}).blocks || [])
            .filter(b => b.slot === 'HKM teklifi').length;
          const oncekiBlok = say();

          /* B04 — teklif yasam dongusu.

             Once burada dogrudan applyIntent + answerIntent cagriliyordu
             ve dis inceleme bunun dort deligini buldu. Simdi sirasiyla:

               a) CEVAP VERMEDEN kuyrugu tekrar sor (sayfa yenilemesi):
                  teklif KAYBOLMAMALI,
               b) tek kapidan cevapla,
               c) ayni teklifi tekrar cevapla (cift tiklama / yeniden
                  baglanma): ikinci kez UYGULANMAMALI,
               d) cevaptan sonra kuyrugu yine sor: teklif ARTIK
                  gosterilmemeli. */
          const yenilendi = (await planlar()).length;
          const r = await B.resolveIntent(n, 'apply');
          const sonrakiBlok = say();
          const tekrar = await B.resolveIntent(n, 'apply');
          const tekrarBlok = say();
          const kalan = (await planlar()).length;
          return { alindi:liste.length, ok:r.ok, oncekiBlok, sonrakiBlok,
            yenilendi, tekrarBlok, kalan, bildirildi:r.reported,
            tekrarUyguladi:tekrar.applied, not:r.note || r.error };
        }, [s.ns]);
        if(!niyet.alindi) hatalar.push('AYS: niyet kuyrugu bos geldi');
        else if(!niyet.ok) hatalar.push('AYS: niyet uygulanamadi — ' + niyet.not);
        else if(niyet.sonrakiBlok !== niyet.oncekiBlok + 1){
          hatalar.push('AYS: niyet uygulandi ama plan degismedi');
        }else{
          console.log('  AYS → niyeti KENDI kodu ile uyguladi (teklif blogu: '
            + niyet.oncekiBlok + ' → ' + niyet.sonrakiBlok + ')');
        }
        if(niyet.alindi){
          if(!niyet.yenilendi){
            hatalar.push('AYS: cevaplanmamis teklif ikinci soruşta kayboldu');
          }else{
            console.log('  AYS → cevaplanmadan yenilendi, teklif duruyor');
          }
          if(niyet.tekrarUyguladi || niyet.tekrarBlok !== niyet.sonrakiBlok){
            hatalar.push('AYS: ayni teklif IKINCI KEZ uygulandi');
          }else{
            console.log('  AYS → ikinci tiklama yeni is yaratmadi');
          }
          if(!niyet.bildirildi) hatalar.push('AYS: cevap merkeze bildirilemedi');
          if(niyet.kalan){
            hatalar.push('AYS: cevaplanan teklif hala gosteriliyor');
          }else{
            console.log('  AYS → cevaplanan teklif bir daha gosterilmedi');
          }
        }
      }

      /* 2.75 — GUNUN KAYDI (Y7): modul yoklama cevabini KENDI ayristiricisiyla
         okur, kart neyi yazacagini onaydan ONCE gosterir, «Kaydet» ile kendi
         kaydina yazar ve cevabi merkeze bildirir. */
      const kayit = await page.evaluate(async ([ns]) => {
        const N = window[ns];
        const B = N.Beacon;
        const n = (await B.intents()).find(x => x.kind === 'kayit.add');
        if(!n) return { yok:true };
        const okunan = ((n.okuma && n.okuma.yazilacak) || []).map(y => y.satirlar.join('; '));
        const r = await B.resolveIntent(n, 'apply');
        const bugun = N.U.todayISO();
        let yazildi = false;
        if(ns === 'R') yazildi = ((N.S.days[bugun] || {}).freeQ || 0) >= 40
          || ((N.S.days[bugun] || {}).blocks || []).some(b => Number(b.actualQ) >= 40);
        if(ns === 'SP') yazildi = (N.Model.vitalsOf(bugun) || {}).sleep === 7;
        if(ns === 'ESP') yazildi = N.Model.sessionsOf(bugun).some(x => x.disc === 'music' && x.minutes === 30);
        const kalan = (await B.intents()).filter(x => x.kind === 'kayit.add').length;
        return { okunan, ok:r.ok, uyguladi:r.applied, bildirildi:r.reported,
          not:r.note || r.error, yazildi, kalan };
      }, [s.ns]);
      if(kayit.yok) hatalar.push(s.id + ': gunun kaydi teklifi modulde gorunmedi');
      else if(!kayit.okunan.length) hatalar.push(s.id + ': gunun kaydini okuyamadi');
      else if(!kayit.ok || !kayit.uyguladi || !kayit.yazildi){
        hatalar.push(s.id + ': gunun kaydi yazilamadi — ' + kayit.not);
      }else{
        if(!kayit.bildirildi) hatalar.push(s.id + ': gunun kaydi cevabi merkeze bildirilemedi');
        if(kayit.kalan) hatalar.push(s.id + ': yazilan kayit teklifi hala gosteriliyor');
        console.log('  ' + s.id + ' → yoklama cevabini kendi okudu («' + kayit.okunan.join(' · ')
          + '»), onayla yazdi');
      }

      /* 2.76 — BAM URUNU (W6): `urun.add` teklifi modulun kendi koduyla
         sinanir, basili hal modulun deposuna yazilir ve Ofis ekraninda
         sandbox iframe'de acilir. */
      if(urunKaydi){
        const bir = await (await hkmFetch('/api/intents/' + s.mod, { method:'POST',
          body:JSON.stringify({ kind:'urun.add', source:'bam',
            payload:{ kayit_id:urunKaydi, urun:'ozet', baslik:'Türev' } }) })).json();
        if(!bir.ok) hatalar.push(s.id + ': urun teklifi birakilamadi — ' + (bir.errors || []).join('; '));
        const urun = await page.evaluate(async ([ns]) => {
          const N = window[ns];
          const n = (await N.Beacon.intents()).find(x => x.kind === 'urun.add');
          if(!n) return { yok:true };
          const r = await N.Beacon.resolveIntent(n, 'apply');
          const l = N.Urunler ? N.Urunler.liste() : [];
          return { ok:r.ok, not:r.note || r.error, bildirildi:r.reported, adet:l.length,
            id:l.length ? l[0].id : null };
        }, [s.ns]);
        if(urun.yok) hatalar.push(s.id + ': urun teklifi modulde gorunmedi');
        else if(!urun.ok || urun.adet !== 1) hatalar.push(s.id + ': urun eklenemedi — ' + urun.not);
        else{
          if(!urun.bildirildi) hatalar.push(s.id + ': urun cevabi merkeze bildirilemedi');
          /* Urunun ekrani modulden OKUNUR: `urun-ac` isleyicisini tasiyan
             ekran (AYS/ESP Ofis, SPİ Kutuphanem). Sabit yazilsaydi urun
             yer degistirince bu adim ya kirmizi ya da yanlis ekranda
             yesil olurdu. */
          const urunEkrani = await page.evaluate(([ns]) => {
            const E = window[ns].Screens;
            return Object.keys(E).find(k => E[k] && E[k].handle && E[k].handle['urun-ac']) || 'office';
          }, [s.ns]);
          await page.evaluate(([ns, r]) => window[ns].App.go(r), [s.ns, urunEkrani]);
          await wait(600);
          const dugme = await page.$('[data-act="urun-ac"][data-id="' + urun.id + '"]');
          if(!dugme) hatalar.push(s.id + ': ' + urunEkrani + ' ekraninda BAM urunu gorunmedi');
          else{
            await dugme.click();
            await wait(400);
            const kutu = await page.evaluate(() => {
              const f = document.querySelector('#sheet iframe.urun-cerceve');
              return f ? { sandbox:f.getAttribute('sandbox'), turev:(f.getAttribute('srcdoc') || '')
                .indexOf('Türev') >= 0 } : null;
            });
            if(!kutu || kutu.sandbox !== '' || !kutu.turev){
              hatalar.push(s.id + ': urun sandbox iframe’de acilmadi');
            }else{
              console.log('  ' + s.id + ' → BAM urunu kendi koduyla sinandi, depoya yazildi, '
                + urunEkrani + ' ekraninda sandbox iframe’de acildi');
            }
            await page.evaluate(([ns]) => window[ns].UI.closeSheet(), [s.ns]);
          }
          await page.evaluate(([ns]) => window[ns].App.go('today'), [s.ns]);
          await wait(300);
        }
      }
      /* Sohbetteki urun istegi: modulun on suzgeci tanir, HKM karar verir,
         King is emrini MODUL ADINA acar (brand/ortak/ofis.js → urun.js). */
      const sohbetUrun = await page.evaluate(async ([ns]) => {
        const O = window.LIFEOS.Ofis;
        if(!O.bamIstegi('Türev hakkında özet hazırla')) return { tanimadi:true };
        return await O.bamKur({ hkm:() => window[ns].Beacon }).ilet('Türev hakkında özet hazırla');
      }, [s.ns]);
      const adAd = { AYS:'AYS', SPI:'SPİ', ESP:'ESP' }[s.id];
      if(sohbetUrun.tanimadi) hatalar.push(s.id + ': sohbet urun istegini tanimadi');
      else if(!sohbetUrun.ok || sohbetUrun.metin.indexOf(adAd + '’ye teklif') < 0){
        hatalar.push(s.id + ': urun istegi King’e modul adina gitmedi — ' + sohbetUrun.metin);
      }else{
        console.log('  ' + s.id + ' → sohbetteki urun istegi King’e modul adina gitti');
      }

      /* 2.77 — KING TEKLIFI (Part 8a-3b): ucretli is King'in onay kapisinda
         bekler; modulun Bugun kartinda gorunur ve MODULDEN onaylanir. Onay
         HKM'nin tek kapisina gider (POST /api/king/emir/<id>/onayla). */
      const kt = await page.evaluate(async ([ns]) => {
        const N = window[ns];
        if(!N.KingTeklif) return { yok:true };
        const l = await N.KingTeklif.cek();
        N.S.ui.kingTeklifler = l;
        N.App.go('today');
        await new Promise(r => setTimeout(r, 500));
        const dugme = document.querySelector('[data-act="king-onayla"]');
        if(!dugme) return { kartYok:true, n:l.length };
        const id = dugme.getAttribute('data-id');
        dugme.click();
        await new Promise(r => setTimeout(r, 1500));
        return { n:l.length, id, kalan:(N.S.ui.kingTeklifler || []).length };
      }, [s.ns]);
      const ktEmir = kt.id ? (await (await hkmFetch('/api/king/emir/' + kt.id)).json()).emir : null;
      if(kt.yok) hatalar.push(s.id + ': King teklifi istemcisi kurulmamis');
      else if(kt.kartYok) hatalar.push(s.id + ': King teklifi kartta gorunmedi (' + kt.n + ' teklif)');
      else if(!ktEmir || ['onaylandi', 'kismen_onay'].indexOf(ktEmir.durum) < 0 || kt.kalan){
        hatalar.push(s.id + ': moduldeki onay isi acmadi (' + (ktEmir && ktEmir.durum) + ')');
      }else console.log('  ' + s.id + ' → King teklifi Bugun kartinda goruldu, modulden onaylandi, '
        + 'is #' + kt.id + ' BAM’da acildi');

      /* 2.78 — KISA KAYIT + TOPLU ONAY (fikir 8 ve 11): Telegram'dan tek kelime
         kayit («su 2») HKM'de kayit.add olur; modul iki kaydi TEK dugmeyle
         («Hepsini kaydet») kendi koduyla yazar. */
      const KISA = { AYS:['soru 40', 'paragraf 20'], SPI:['su 2', 'uyku 6'], ESP:['gitar 30', 'okuma 25'] }[s.id];
      let kisaOk = true;
      for(const t of KISA){
        const c = await (await hkmFetch('/api/chat', { method:'POST', body:JSON.stringify({ text:t }) })).json();
        if(c.command !== 'kayit'){ kisaOk = false; hatalar.push(s.id + ': «' + t + '» kisa kayit sayilmadi (' + c.command + ')'); }
      }
      if(kisaOk){
        const tk = await page.evaluate(async ([ns]) => {
          const N = window[ns];
          N.S.ui.hkmIntents = await N.Beacon.intents();
          /* Onaylar tek cekmecede: Bugun yalniz en ondeki karti gosterir. */
          N.App.go(N.Screens.onaylar ? 'onaylar' : 'today');
          await new Promise(r => setTimeout(r, 500));
          const d = document.querySelector('[data-act="hkm-toplu"]');
          if(!d) return { dugmeYok:true, n:N.S.ui.hkmIntents.length,
            okunan:N.S.ui.hkmIntents.map(x => x.kind + ':' + ((x.okuma && x.okuma.yazilacak) || []).length) };
          const etiket = d.textContent.trim();
          d.click();
          await new Promise(r => setTimeout(r, 1500));
          const bugun = N.U.todayISO();
          let yazildi = false;
          if(ns === 'R') yazildi = ((N.S.days[bugun] || {}).paragraphActual || 0) >= 20;
          if(ns === 'SP') yazildi = (N.Model.vitalsOf(bugun) || {}).water === 2000;
          if(ns === 'ESP') yazildi = N.Model.sessionsOf(bugun).some(x => x.disc === 'reading' && x.minutes === 25);
          const kalan = (await N.Beacon.intents()).filter(x => x.kind === 'kayit.add').length;
          return { etiket, yazildi, kalan };
        }, [s.ns]);
        if(tk.dugmeYok) hatalar.push(s.id + ': «Hepsini kaydet» dugmesi cikmadi (' + tk.n + ' teklif: '
          + (tk.okunan || []).join(', ') + ')');
        else if(!tk.yazildi || tk.kalan) hatalar.push(s.id + ': toplu onay yazmadi ya da teklif kaldi ('
          + tk.etiket + ', kalan ' + tk.kalan + ')');
        else console.log('  ' + s.id + ' → kisa kayitlar («' + KISA.join('», «') + '») tek dugmeyle yazildi ('
          + tk.etiket + ')');
      }

      /* 2.79 — YARIN (fikir 19): modul yarinin ilk islerini KENDI kodu secip
         HKM'ye yollar; aksam ozeti yalniz dizer. */
      await page.evaluate(async ([ns]) => { const N = window[ns]; if(N.Hedefler && N.Hedefler.ag) await N.Hedefler.ag.gonder(); }, [s.ns]);
      const yPano = await (await hkmFetch('/api/hedefler')).json();
      const yarinIs = ((yPano.yarin || {}).isler || {})[s.mod];
      if(!Array.isArray(yarinIs)) hatalar.push(s.id + ': yarinin isleri HKM\'ye ulasmadi');
      else if(s.id === 'AYS' && !yarinIs.length) hatalar.push('AYS: yarinin plan bloklari gelmedi');
      else console.log('  ' + s.id + ' → yarinin isleri HKM\'de (' + yarinIs.length + ' is'
        + (yarinIs[0] ? ': «' + yarinIs[0].metin + '»' : '') + ')');

      /* 2.80 — SPİ BILGISI (Part 8c-2): `besin.add` teklifi Bugun kartinda
         SPİ'nin KENDI onizlemesiyle gorunur; «Ekle» kaydi yeniden ceker,
         sinar ve kullanici gidasi yazar; «Geri al» siler. Mutfak'taki istek
         King'in onay kapisina `spi.bilgi` is emri olarak gider. */
      if(s.id === 'SPI' && bilgiKaydi){
        const bir = await (await hkmFetch('/api/intents/spi', { method:'POST',
          body:JSON.stringify({ kind:'besin.add', source:'bam',
            payload:{ kayit_id:bilgiKaydi, ad:'kinoa', baslik:'Kinoa besin değerleri' } }) })).json();
        if(!bir.ok) hatalar.push('SPI: besin teklifi birakilamadi — ' + (bir.errors || []).join('; '));
        const bi = await page.evaluate(async () => {
          const n = (await SP.Beacon.intents()).find(x => x.kind === 'besin.add');
          if(!n) return { yok:true };
          SP.S.ui.hkmIntents = [n];
          SP.App.go(SP.Screens.onaylar ? 'onaylar' : 'today');
          await new Promise(r => setTimeout(r, 400));
          const kart = document.body.textContent.indexOf('SPİ şunu ekleyecek') >= 0;
          const r = await SP.Beacon.resolveIntent(n, 'apply');
          const f = (SP.S.foods || []).find(x => x.bam && x.bam.kayitId === n.payload.kayit_id);
          const hesapta = !!(f && SP.FOOD_BY_ID[f.id]);
          if(r.geriAl) await SP.Bilgi.geriAl(r.geriAl);
          const kaldi = (SP.S.foods || []).some(x => x.bam && x.bam.kayitId === n.payload.kayit_id);
          const ist = await SP.Bilgi.iste({ tur:'yer', ad:'spor salonu', sehir:'Adana' });
          SP.S.ui.hkmIntents = [];
          return { onizleme:n.bilgi && n.bilgi.ok, kart, ok:r.ok, not:r.note || r.error,
            bildirildi:r.reported, hesapta, kaldi, istek:ist.ok, istMetin:ist.metin };
        });
        if(bi.yok) hatalar.push('SPI: besin teklifi modulde gorunmedi');
        else if(!bi.onizleme || !bi.kart) hatalar.push('SPI: besin teklifi onaydan once onizlenmedi');
        else if(!bi.ok || !bi.hesapta) hatalar.push('SPI: besin eklenemedi — ' + bi.not);
        else if(bi.kaldi) hatalar.push('SPI: besin geri alinamadi');
        else if(!bi.bildirildi) hatalar.push('SPI: besin cevabi merkeze bildirilemedi');
        else if(!bi.istek) hatalar.push('SPI: bilgi istegi King’e gitmedi — ' + bi.istMetin);
        else console.log('  SPI → BAM besin kaydi kendi koduyla sinandi, onizlendi, eklendi, geri alindi; '
          + 'Mutfak istegi King’e gitti');
      }

      /* 2.81 — ESP DIL UNITESI (Part 8d): `unite.add` teklifi Bugun kartinda
         ESP'nin KENDI onizlemesiyle gorunur; «Ekle» kaydi yeniden ceker,
         sinar, uniteyi Dil › Ogren'e ve kartlari desteye koyar; pratik
         sorusu o desteden kurulur; «Geri al» kaldirir. Istek King'e gider. */
      if(s.id === 'ESP' && uniteKaydi){
        const bir = await (await hkmFetch('/api/intents/esp', { method:'POST',
          body:JSON.stringify({ kind:'unite.add', source:'bam',
            payload:{ kayit_id:uniteKaydi, baslik:'Rusça A1 · selamlaşma', dil:'ru', unite:1, oge:7 } }) })).json();
        if(!bir.ok) hatalar.push('ESP: unite teklifi birakilamadi — ' + (bir.errors || []).join('; '));
        const un = await page.evaluate(async () => {
          const n = (await ESP.Beacon.intents()).find(x => x.kind === 'unite.add');
          if(!n) return { yok:true };
          ESP.S.ui.hkmIntents = [n];
          ESP.App.go(ESP.Screens.onaylar ? 'onaylar' : 'today');
          await new Promise(r => setTimeout(r, 400));
          const kart = document.body.textContent.indexOf('ESP şunu ekleyecek') >= 0;
          const r = await ESP.Beacon.resolveIntent(n, 'apply');
          const u = ESP.Lesson.units('lang', 'ru').find(x => x.bam && x.bam.kayitId === n.payload.kayit_id);
          const kartlar = ESP.S.cards.filter(c => (c.tags || []).indexOf('bam:' + n.payload.kayit_id) >= 0).length;
          const p = ESP.Lesson.start('ru', { length:5 });
          if(r.geriAl) await ESP.Unite.geriAl(r.geriAl);
          const kaldi = ESP.S.cards.some(c => (c.tags || []).indexOf('bam:' + n.payload.kayit_id) >= 0);
          const ist = await ESP.Unite.iste({ dil:'ru', duzey:'A2', konu:'yiyecekler' });
          ESP.S.ui.hkmIntents = [];
          return { onizleme:n.unite && n.unite.ok, kart, ok:r.ok, not:r.note || r.error,
            bildirildi:r.reported, unite:!!u, kartlar, pratik:p.ok && p.questions.length, kaldi,
            istek:ist.ok, istMetin:ist.metin };
        });
        if(un.yok) hatalar.push('ESP: unite teklifi modulde gorunmedi');
        else if(!un.onizleme || !un.kart) hatalar.push('ESP: unite teklifi onaydan once onizlenmedi');
        else if(!un.ok || !un.unite || un.kartlar !== 7) hatalar.push('ESP: unite eklenemedi — ' + un.not);
        else if(!un.pratik) hatalar.push('ESP: pratik unite destesinden soru kurmadi');
        else if(un.kaldi) hatalar.push('ESP: unite geri alinamadi');
        else if(!un.bildirildi) hatalar.push('ESP: unite cevabi merkeze bildirilemedi');
        else if(!un.istek) hatalar.push('ESP: unite istegi King’e gitmedi — ' + un.istMetin);
        else console.log('  ESP → BAM unitesi kendi koduyla sinandi, onizlendi, 7 kart desteye girdi, '
          + 'pratik ' + un.pratik + ' soru kurdu, geri alindi; unite istegi King’e gitti');
      }

      /* 2.82 — ESP BELGESI (Part 8f): `belge.add` teklifi ESP'nin KENDI
         onizlemesiyle gorunur; «Ekle» olayi kaynagiyla Kronoloji'ye koyar;
         «Geri al» kaldirir; felsefe istegi King'e gider. */
      if(s.id === 'ESP' && belgeKaydi){
        const bir = await (await hkmFetch('/api/intents/esp', { method:'POST',
          body:JSON.stringify({ kind:'belge.add', source:'bam',
            payload:{ kayit_id:belgeKaydi, baslik:'Tarih belgesi: Osmanlı Beyliği', alan:'tarih', adet:1 } }) })).json();
        if(!bir.ok) hatalar.push('ESP: belge teklifi birakilamadi — ' + (bir.errors || []).join('; '));
        const be = await page.evaluate(async () => {
          const n = (await ESP.Beacon.intents()).find(x => x.kind === 'belge.add');
          if(!n) return { yok:true };
          ESP.S.ui.hkmIntents = [n];
          ESP.App.go(ESP.Screens.onaylar ? 'onaylar' : 'today');
          await new Promise(r => setTimeout(r, 400));
          const kart = document.body.textContent.indexOf('ESP şunu ekleyecek') >= 0;
          const r = await ESP.Beacon.resolveIntent(n, 'apply');
          const ev = ESP.S.events.find(e => e.bam && e.bam.kayitId === n.payload.kayit_id);
          const kaynakli = !!(ev && ev.sourceIds.length && ESP.S.sources.some(s => s.id === ev.sourceIds[0]));
          if(r.geriAl) await ESP.Belge.geriAl(r.geriAl);
          const kaldi = ESP.S.events.some(e => e.bam && e.bam.kayitId === n.payload.kayit_id);
          const ist = await ESP.Belge.iste({ alan:'felsefe', konu:'Stoacılık' });
          ESP.S.ui.hkmIntents = [];
          return { onizleme:n.belge && n.belge.ok, kart, ok:r.ok, not:r.note || r.error,
            bildirildi:r.reported, olay:!!ev, kaynakli, kaldi, istek:ist.ok, istMetin:ist.metin };
        });
        if(be.yok) hatalar.push('ESP: belge teklifi modulde gorunmedi');
        else if(!be.onizleme || !be.kart) hatalar.push('ESP: belge teklifi onaydan once onizlenmedi');
        else if(!be.ok || !be.olay || !be.kaynakli) hatalar.push('ESP: belge eklenemedi — ' + be.not);
        else if(be.kaldi) hatalar.push('ESP: belge geri alinamadi');
        else if(!be.bildirildi) hatalar.push('ESP: belge cevabi merkeze bildirilemedi');
        else if(!be.istek) hatalar.push('ESP: belge istegi King’e gitmedi — ' + be.istMetin);
        else console.log('  ESP → BAM tarih belgesi kendi koduyla sinandi, onizlendi, olay kaynagiyla '
          + 'Kronoloji’ye girdi, geri alindi; felsefe istegi King’e gitti');
      }

      /* 2.8 — HEDEFTEN PLANA (ekip/PLAN.md Tur 2). Yalniz SPI: plan motoru
         orada. Zincir: SPI plani KENDI koduyla uygular -> King'e is emri ->
         King imkan kontrolu -> BAM Kayit + Planlama -> program kaydi ->
         King SPI'ye plan.apply teklifi birakir -> SPI programi HKM'den
         ceker, KENDI kontrol noktalariyla sinar ve ekler. Her halka
         bildirim yazar; SPI bildirimleri okur. */
      if(s.id === 'SPI'){
        const kur = await page.evaluate(async () => {
          const bugun = SP.U.todayISO();
          await SP.Model.saveProfile({ weightKg:84, heightCm:178, birthYear:1996, sex:'male',
            activity:'moderate', goal:'health', conditions:[] });
          await SP.Model.saveVitals(bugun, { weight:84 });
          const H = window.LIFEOS.Hedef;
          const h = Object.assign(H.yeni({ paket:'kilo', yon:'ulas', egilim:'azalt', hedefDeger:80,
            birim:'kg', son_tarih:H.gunEkle(bugun, 91), cumle:'3 ay içinde 80 kiloya inmek istiyorum' },
          'spi', bugun), { durum:'aktif', cevaplar:{ saglik:'yok' } });
          await SP.Hedefler.kaydet(h);
          const u = await SP.Plan.uygulaHedef(h.id);
          const k = await SP.Plan.kingeIlet(h.id);
          const p = SP.Plan.aktif(h.id);
          return { hedef:h.id, uyg:u.ok, why:u.why, king:k.ok, karar:k.karar, metin:k.metin,
            emir:p && p.emir ? p.emir.id : null, hafta:p ? p.hafta : null };
        });
        if(!kur.uyg) hatalar.push('SPI: plan uygulanamadi — ' + kur.why);
        else if(!kur.king || kur.karar !== 'onay') hatalar.push('SPI: King is emrini onaylamadi — ' + kur.metin);
        else{
          console.log('  SPI → plan uygulandi, King onayladi (is emri #' + kur.emir + ')');
          let emir = null;
          for(let i = 0; i < 6; i++){
            await hkmFetch('/api/bam/ilerlet', { method:'POST', body:'{}' });
            emir = (await (await hkmFetch('/api/king/emir/' + kur.emir)).json()).emir;
            if(emir && emir.durum === 'bitti') break;
          }
          if(!emir || emir.durum !== 'bitti'){
            hatalar.push('SPI: Planlama Ofisi isi bitirmedi (' + (emir && emir.durum) + ')');
          }else{
            const son = await page.evaluate(async hedefId => {
              const bildirim = await SP.Plan.bildirimleriCek();
              const liste = await SP.Beacon.intents();
              const n = liste.find(x => x.kind === 'plan.apply' && x.payload.hedef_id === hedefId);
              if(!n) return { bildirim:(bildirim || []).map(b => b.tur), teklif:false };
              const r = await SP.Beacon.resolveIntent(n, 'apply');
              const p = SP.Plan.aktif(hedefId);
              return { bildirim:(bildirim || []).map(b => b.tur), teklif:true, ok:r.ok,
                not:r.note || r.error, bildirildi:r.reported,
                hafta:p && p.program ? p.program.haftalar.length : 0 };
            }, kur.hedef);
            if(son.bildirim.indexOf('bitti') < 0 || son.bildirim.indexOf('onaylandi') < 0){
              hatalar.push('SPI: King bildirimleri gelmedi (' + son.bildirim.join(', ') + ')');
            }
            if(!son.teklif) hatalar.push('SPI: plan.apply teklifi kuyruga dusmedi');
            else if(!son.ok) hatalar.push('SPI: program eklenemedi — ' + son.not);
            else if(son.hafta !== kur.hafta) hatalar.push('SPI: program hafta sayisi tutmadi');
            else{
              if(!son.bildirildi) hatalar.push('SPI: program cevabi merkeze bildirilemedi');
              console.log('  SPI → Planlama Ofisi ' + son.hafta + ' haftalik programi kurdu, SPI '
                + 'kendi kontrol noktalariyla sinayip ekledi · bildirimler: ' + son.bildirim.join(' ← '));
            }
          }
        }
      }

      /* 2.9 — HEDEF AGI (brand/ortak/hedefag.js, HKM core/hedefag.py): modulun
         etkin hedefinin OZETI HKM'ye gider, zaman butcesinin cumlesi geri
         doner. HKM modulun hedefine yazmaz; hedefin cumlesi gitmez. */
      const ag = await page.evaluate(async ([ns, mod]) => {
        const N = window[ns];
        if(!N.Hedefler || !N.Hedefler.ag) return { yok:true };
        const H = window.LIFEOS.Hedef;
        const bugun = N.U.todayISO();
        const h = Object.assign(H.yeni({ paket:'deneme', yon:'ulas', cumle:mod + ' ağ denemesi',
          son_tarih:H.gunEkle(bugun, 60), kapasite:{ gunluk_dk:30 } }, mod, bugun), { durum:'aktif' });
        await N.Hedefler.kaydet(h);
        const r = await N.Hedefler.ag.gonder();
        return { ok:r.ok, metin:r.butce && r.butce.metin, id:h.id };
      }, [s.ns, s.mod]);
      const pano = await (await hkmFetch('/api/hedefler')).json();
      const vardi = (pano.hedefler || []).some(h => h.id === ag.id && h.modul === s.mod);
      if(ag.yok) hatalar.push(s.id + ': hedef agi kurulmamis');
      else if(!ag.ok || !vardi || !ag.metin) hatalar.push(s.id + ': hedef ozeti HKM\'ye ulasmadi');
      else console.log('  ' + s.id + ' → hedef ozeti HKM panosunda; butce cumlesi geri geldi');

      /* 2.95 — OTOMATIK YEDEK (brand/ortak/yedekag.js, HKM core/yedek.py):
         modulun yedegi HKM'nin klasorune yazilir, HKM geri okuyup baytini
         soyler; modul hatirlatmayi ancak ondan sonra kapatir. Taze profilde
         kayit az oldugu icin burada kayit sayisi elle verilir. */
      const yd = await page.evaluate(async ([ns, mod]) => {
        const N = window[ns];
        if(!window.LIFEOS.YedekAg) return { yok:true };
        const ag = window.LIFEOS.YedekAg.kur({ hkm:() => N.Beacon, modul:mod,
          disaAktar:() => N.Store.exportAll(), kayit:() => 99, yas:() => null,
          isaretle:() => N.Model.markBackup() });
        const r = await ag.dene();
        return { ok:r.ok, neden:r.neden, tarih:r.tarih, bayt:r.bayt, yas:N.Model.backupAgeDays() };
      }, [s.ns, s.mod]);
      const yl = await (await hkmFetch('/api/yedek')).json();
      const kayitli = ((yl.moduller || {})[s.mod] || []).find(x => x.tarih === yd.tarih);
      const inen = kayitli ? await (await hkmFetch('/api/yedek/' + s.mod + '/' + yd.tarih)).text() : '';
      if(yd.yok) hatalar.push(s.id + ': otomatik yedek kurulmamis');
      else if(!yd.ok) hatalar.push(s.id + ': otomatik yedek HKM\'ye yazilmadi (' + yd.neden + ')');
      else if(!kayitli || kayitli.bayt !== yd.bayt || Buffer.byteLength(inen) !== yd.bayt){
        hatalar.push(s.id + ': HKM\'deki yedek modulun yolladigiyla ayni degil');
      }else if(yd.yas !== 0) hatalar.push(s.id + ': yedek dogrulandi ama hatirlatma kapanmadi');
      else console.log('  ' + s.id + ' → yedek HKM\'ye yazildi, ' + yd.bayt + ' bayt geri okundu; '
        + 'hatirlatma kapandi');

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

    /* 4.5 — ZAMAN BUTCESI: uc modulun hedefleri tek resimde; karar ve
       cumle HKM'nin kodudur. Vakti bilinmeyen hedef (SPI kilo) adiyla
       soylenir, toplama 0 ile girmez. */
    await hkmFetch('/api/zaman', { method:'POST', body:JSON.stringify({ gunluk_dk:60, haftalik_gun:7 }) });
    const butce = (await (await hkmFetch('/api/hedefler')).json()).butce || {};
    const mods = Object.keys(butce.modul_saat || {}).sort().join(',');
    if(!butce.bant || mods !== 'ays,esp,spi') hatalar.push('zaman butcesi uc modulu toplamadi (' + mods + ')');
    else if((butce.bilinmeyen || []).length && butce.metin.indexOf('hesaba katılmadı') < 0){
      hatalar.push('vakti bilinmeyen hedef butce cumlesinde soylenmedi');
    }else console.log('  HKM → zaman butcesi: ' + butce.bant + ' · haftada ' + butce.talep
      + ' saat talep, ' + butce.vakit + ' saat vakit');

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
    /* Seri cizimi icin en az uc nokta gerekir; gercek arayuzlerden gelen
       bos profiller bunu uretmez. Bes gunluk SENTETIK seri, cizim kodunun
       kendisini dener — uc sistemin verisi degil, yuzun cizgisi. */
    for(let i = 5; i >= 1; i--){
      const t = dilimGunu(Date.now() - i * 86400000);
      await hkmFetch('/api/sync/spi', { method:'POST', body:JSON.stringify({
        date:t, metrics:{ sleep_hours:{ value:6 + (i % 3), cert:'measured' } } }) });
    }

    const b2 = await (await hkmFetch('/api/briefing?date=' + BUGUN)).json();
    if(!b2.proposal || b2.proposal.rank !== 1){
      hatalar.push('kirmizi bayrak birinci sirayi tetiklemedi');
    }else{
      console.log('  HKM → sentetik kirmizi bayrak: oncelik 1, oneri ' + b2.decision.id);
    }

    /* 7 — HKM'nin kendi yuzu: gercek tarayicida acilir, jeton girilir,
       brifing cizilir ve oneri varsa cevaplanabilir. Yuklenmeyen bir
       sayfa curur; bu yuzden denetim sayfayi da gezer. */
    const yuz = await browser.newPage({ timezoneId:DILIM });
    const yuzHata = [];
    yuz.on('pageerror', e => yuzHata.push(String(e.message)));
    await yuz.goto('http://127.0.0.1:' + HKM_PORT + '/', { waitUntil:'load' });
    await yuz.waitForSelector('#giris', { timeout:10000 });
    await yuz.fill('#token', TOKEN);
    await yuz.click('#gir');
    await wait(900);
    /* Sistemler sekmesi: ambardaki seri gercekten ciziliyor mu? */
    await yuz.click('#gez a[data-yol="sistemler"]');
    await wait(400);
    const sistemler = await yuz.evaluate(() => ({
      metin:(document.querySelector('#sistemler') || {}).textContent || '',
      cizgi:document.querySelectorAll('#sistemler svg.spark').length,
      satir:document.querySelectorAll('#sistemler .metric').length,
      gorunur:!document.querySelector('[data-bolme="sistemler"]').hidden,
      /* Seviye seridi: uc sistemin kademesi yan yana geldi mi? */
      seviye:(document.querySelector('#sistemler') || {}).textContent
        ? /Seviye/.test(document.querySelector('#sistemler').textContent) : false,
    }));
    if(!sistemler.gorunur) hatalar.push('HKM yuzu: Sistemler sekmesi acilmadi');
    if(sistemler.metin.indexOf('ölçüm') < 0){
      hatalar.push('HKM yuzu: sistem verisi cizilmedi');
    }else if(!sistemler.cizgi){
      hatalar.push('HKM yuzu: seri cizgisi cizilmedi (en az bir cift nokta vardi)');
    }else if(!sistemler.seviye){
      hatalar.push('HKM yuzu: seviye seridi cizilmedi — uc arayuz '
        + 'level_tier/level_sub gonderdi ama merkez gostermedi');
    }else{
      console.log('  HKM yuzu → sistemler sekmesi: ' + sistemler.satir
        + ' metrik, ' + sistemler.cizgi + ' seri cizgisi');
    }
    /* W6 — Ofis: depo denetimi olculur, kayit PDF olarak INDIRILIR (jetonla,
       adres satirina jeton yazilmadan), adimlarin ajan izi gorunur. */
    await yuz.click('#gez a[data-yol="ofis"]');
    await wait(500);
    await yuz.click('#depo-denetle');
    await wait(400);
    const depoMetin = await yuz.evaluate(() => (document.querySelector('#ofis-depo') || {}).textContent || '');
    if(!/kayıt/.test(depoMetin) || !/ölçüldü/.test(depoMetin)) hatalar.push('HKM yuzu: depo denetimi cizilmedi');
    if(urunKaydi){
      await yuz.evaluate(id => { const a = document.querySelector('[data-bam-kayit="' + id + '"]');
        if(a) a.click(); }, urunKaydi);
      await wait(500);
      const indir = await Promise.all([
        yuz.waitForEvent('download', { timeout:10000 }).catch(() => null),
        yuz.click('[data-kayit-indir="' + urunKaydi + '"][data-bicim="pdf"]').catch(() => null),
      ]);
      const ad = indir[0] ? indir[0].suggestedFilename() : '';
      if(!/\.pdf$/.test(ad)) hatalar.push('HKM yuzu: kayit PDF olarak indirilemedi (' + ad + ')');
      else console.log('  HKM yuzu → Ofis: depo denetlendi, kayit PDF indi (' + ad + ')');
    }
    const izVar = await yuz.evaluate(() => /Ajan izi/.test((document.querySelector('#ofis-isler') || {}).textContent || ''));
    if(!izVar) hatalar.push('HKM yuzu: islerde ajan izi gorunmedi');

    /* W6 — Web ayarlari: kaydedilir, anahtar MASKELI doner ve geri okunmaz. */
    await yuz.click('#ayar-bag');
    await wait(400);
    /* K7: Web paneli «Yapay zekâ ve bütçe» bölümünde (yedi sekme → dört bölüm). */
    await yuz.click('[data-ayar="yapayzeka"]');
    await wait(500);
    await yuz.fill('#web-sinir', '150');
    await yuz.fill('#web-k-brave', 'BSA-entegre-anahtar-9876');
    await yuz.click('[data-web-saglayici="brave"]');
    await yuz.click('#web-kaydet');
    await wait(600);
    const webAyar = await (await hkmFetch('/api/config')).json();
    const w = webAyar.web || {};
    const webAlan = await yuz.evaluate(() => (document.querySelector('#web-k-brave') || {}).value || '');
    if(w.gunluk_sinir !== 150 || (w.saglayicilar || []).indexOf('brave') < 0){
      hatalar.push('HKM yuzu: web ayari kaydedilmedi');
    }else if(webAlan.indexOf('9876') < 0 || webAlan.indexOf('entegre') >= 0
      || JSON.stringify(webAyar).indexOf('BSA-entegre') >= 0){
      hatalar.push('HKM yuzu: web anahtari maskelenmedi');
    }else{
      console.log('  HKM yuzu → Web: sınır 150, Brave sıraya girdi; anahtar maskeli (' + webAlan + ')');
    }

    /* Yonetim sekmesi: esik kaydi GERCEKTEN yaziliyor ve bozuk deger
       REDDEDILIYOR mu? */
    await yuz.click('#ayar-bag');
    await wait(400);
    await yuz.click('[data-ayar="esikler"]');
    await wait(400);
    await yuz.evaluate(t => { window.__jeton = t; }, TOKEN);
    const yonetim = await yuz.evaluate(async () => {
      const alan = document.querySelector('[data-esik="bio.sleep_hours_min"]');
      if(!alan) return { hata:'esik alani yok' };
      /* Sir kurulu degilse «girilmemis» yazar; olan sey ASLA degerin
         kendisi olmamali. Denetim, satirin varligini ve degerin
         YOKLUGUNU arar. Kanallar artik AYRI bir ayar sekmesinde ve
         gizli olsa bile DOM'da durur. */
      const metin = (document.querySelector('#kanallar') || {}).textContent || '';
      const maskeli = metin.indexOf('İzin listesi') >= 0
        && !!document.querySelector('[data-kanal-alan="whatsapp.app_secret"]')
        && !!document.querySelector('[data-kanal-alan="telegram.bot_token"]');
      alan.value = '40';                         /* aralik disi */
      document.querySelector('#esik-kaydet').click();
      await new Promise(r => setTimeout(r, 500));
      const red = document.querySelector('#esik-not').textContent;
      alan.value = '7.25';                       /* gecerli */
      document.querySelector('#esik-kaydet').click();
      await new Promise(r => setTimeout(r, 500));
      return { red, kabul:document.querySelector('#esik-not').textContent, maskeli,
        sirSizdi:document.body.textContent.indexOf(window.__jeton || '@@yok@@') >= 0 };
    });
    /* Saglayici katmani: anahtar YAZILIR ama GERI OKUNMAZ, ve atama
       kademe kademe MIRAS alir. */
    await yuz.click('[data-ayar="yapayzeka"]');
    await wait(400);
    const api = await yuz.evaluate(async () => {
      /* Bir saglayicinin BIRDEN COK anahtari olabilir: satir once
         eklenir, sonra doldurulur. Ikinci anahtar da eklenir ve kademe
         HANGISIYLE odeyecegini secer. */
      const ekle = document.querySelector('[data-ekle="anthropic"]');
      const sec = document.querySelector('[data-rol="king"]');
      if(!ekle || !sec) return { hata:'saglayici/gorev satiri yok' };
      const grup = document.querySelector('[data-grup="anthropic"]');
      const doldur = (ad, sahip, deger) => {
        ekle.click();
        const satir = grup.lastElementChild;
        satir.querySelector('[data-k-ad]').value = ad;
        satir.querySelector('[data-k-sahip]').value = sahip;
        satir.querySelector('[data-k-deger]').value = deger;
      };
      doldur('Benim', 'ben', 'sk-ant-entegre-denemesi');
      doldur('Kardesim', 'kardes', 'sk-ant-ikinci-anahtar');
      document.querySelector('#anahtar-kaydet').click();
      await new Promise(r => setTimeout(r, 700));
      const anahtarNotu = document.querySelector('#anahtar-not').textContent;
      const satirSayisi = document.querySelectorAll(
        '[data-grup="anthropic"] [data-kutu]').length;

      const sec2 = document.querySelector('[data-rol="king"]');
      sec2.value = 'anthropic';
      document.querySelector('[data-model="king"]').value = 'claude-opus-5';
      document.querySelector('#gorev-kaydet').click();
      await new Promise(r => setTimeout(r, 700));
      const gorevNotu = document.querySelector('#gorev-not').textContent;

      /* Iki anahtar varken kademe hangisini kullanacagini SECEBILMELI. */
      const anahtarSec = document.querySelector('[data-anahtarsec="king"]');
      let secim = '';
      if(anahtarSec){
        anahtarSec.value = anahtarSec.options[2].value;
        document.querySelector('#gorev-kaydet').click();
        await new Promise(r => setTimeout(r, 700));
        secim = (document.querySelector('[data-rol="king"]')
          .closest('.metric').textContent || '');
      }
      /* Atanmamis bir alt kademe, king'den MIRAS almali. */
      const miras = (document.querySelector('[data-rol="spi.gorsel"]')
        .closest('.metric').textContent || '');
      return { anahtarNotu, gorevNotu, miras, satirSayisi,
        secici:!!anahtarSec, secim,
        sizdi:(document.body.textContent.indexOf('sk-ant-entegre-denemesi') >= 0
               || document.body.textContent.indexOf('sk-ant-ikinci-anahtar') >= 0) };
    });
    if(api.hata) hatalar.push('HKM yuzu: ' + api.hata);
    else{
      if((api.anahtarNotu || '').indexOf('kaydedildi') < 0){
        hatalar.push('HKM yuzu: saglayici anahtari kaydedilmedi');
      }
      if((api.gorevNotu || '').indexOf('Kaydedildi') < 0){
        hatalar.push('HKM yuzu: gorev atamasi kaydedilmedi');
      }
      if(api.miras.indexOf('miras') < 0){
        hatalar.push('HKM yuzu: alt kademe king atamasini miras almadi');
      }
      if(api.satirSayisi !== 2){
        hatalar.push('HKM yuzu: iki anahtar kaydedilmedi (' + api.satirSayisi + ')');
      }
      if(!api.secici){
        hatalar.push('HKM yuzu: iki anahtar varken kademe secici cikmadi');
      }else if((api.secim || '').indexOf('Kardesim') < 0){
        hatalar.push('HKM yuzu: secilen anahtar kademede gorunmedi');
      }
      if(api.sizdi) hatalar.push('HKM yuzu: SAGLAYICI ANAHTARI EKRANA SIZDI');
      if(!api.hata){
        console.log('  HKM yuzu → iki anahtar yazildi, geri okunmadi; '
          + 'king hangisiyle odeyecegini secti; atama alt kademelere '
          + 'miras kaldi');
      }
    }

    if(yonetim.hata) hatalar.push('HKM yuzu: ' + yonetim.hata);
    else{
      if((yonetim.red || '').indexOf('Kaydedilmedi') < 0){
        hatalar.push('HKM yuzu: aralik disi esik kabul edildi');
      }
      if((yonetim.kabul || '').indexOf('Kaydedildi') < 0){
        hatalar.push('HKM yuzu: gecerli esik kaydedilmedi');
      }
      if(!yonetim.maskeli) hatalar.push('HKM yuzu: kanal ayar satiri cizilmedi');
      if(yonetim.sirSizdi) hatalar.push('HKM yuzu: jeton ekranda gorundu');
      console.log('  HKM yuzu → yonetim: bozuk esik reddedildi, gecerli esik kaydedildi');
    }

    await yuz.click('#gez a[data-yol="bugun"]');
    await wait(300);

    /* Icerik artik GORUNUME GORE cekiliyor: her sekmede butun ambari
       sorgulamak acilisi bekletmekten baska is yapmiyordu. Denetim de o
       yuzden gorunumleri gezerek okur. */
    const oku = sel => yuz.evaluate(
      s => (document.querySelector(s) || {}).textContent || '', sel);
    const ekran = {
      brifing:await oku('#brifing'),
      capraz:await oku('#capraz'),
      girisAcik:await yuz.evaluate(() => !document.querySelector('#giris').hidden),
    };
    await yuz.click('#gez a[data-yol="sistemler"]');
    await wait(700);
    ekran.ikiz = await oku('#ikiz');
    ekran.gecmis = await oku('#gecmis');
    ekran.etki = await oku('#etki');
    ekran.hafta = await oku('#hafta');
    await yuz.click('#ayar-bag');
    await wait(300);
    await yuz.click('[data-ayar="sunucu"]');
    await wait(700);
    ekran.kutu = await oku('#kutu');
    ekran.ritim = await oku('#ritim');
    await yuz.click('#gez a[data-yol="bugun"]');
    await wait(500);
    if(ekran.girisAcik) hatalar.push('HKM yuzu: dogru jetonla bile giris ekraninda kaldi');
    if(ekran.brifing.length < 40) hatalar.push('HKM yuzu: brifing cizilmedi');
    if(ekran.ikiz.indexOf('metriğe dayanıyor') < 0) hatalar.push('HKM yuzu: ikiz cizilmedi');
    if(ekran.gecmis.length < 20) hatalar.push('HKM yuzu: oneri gecmisi cizilmedi');
    if(ekran.capraz.indexOf('Çapraz bulgu') < 0) hatalar.push('HKM yuzu: capraz bulgu karti cizilmedi');
    /* Etki karti: olculmemis faydayi «fayda yok» diye sunmamali. */
    if(ekran.etki.indexOf('deney değildir') < 0){
      hatalar.push('HKM yuzu: etki kartinda secilim uyarisi yok');
    }
    if(ekran.hafta.indexOf('Kayıtlı gün') < 0){
      hatalar.push('HKM yuzu: haftalik rapor cizilmedi');
    }
    if(ekran.kutu.indexOf('Giden kutusu') < 0){
      hatalar.push('HKM yuzu: giden kutusu cizilmedi');
    }
    /* Baslik «Ritim»den «Otomatik mesajlar»a dondu: denetim METNI degil
       ISI aramali — sabah/aksam/haftalik alanlarinin varligini. */
    if(ekran.ritim.indexOf('Sabah brifingi') < 0
        || ekran.ritim.indexOf('Haftalık rapor') < 0){
      hatalar.push('HKM yuzu: otomatik mesaj karti cizilmedi');
    }
    if(yuzHata.length) hatalar.push('HKM yuzu: sayfa hatasi — ' + yuzHata[0]);
    else console.log('  HKM yuzu → brifing, ikiz ve oneri gecmisi cizildi');

    /* Oneri yuzden CEVAPLANABILIYOR mu? Cevaplanamayan bir oneri, oneri
       degil bildirimdir. Oneri karti «Genel» sekmesindedir. */
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
       gorunur. Kanal (WhatsApp) kapali olsa bile yerel kanal calisir.
       Patron kutusu «HKM» sekmesindedir. */
    await yuz.click('#gez a[data-yol="sohbet"]');
    await wait(300);
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
