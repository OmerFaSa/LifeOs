/* Palet denetimi — yedi palet x iki tema x yedi bolum x bes duzen.

   Bir rengin okunup okunmadigi goz kararina birakilmaz. Bu betik her
   kombinasyonda WCAG AA kontrast oranini olcer ve gecemeyeni yazar:

     metin/zemin, ikincil metin/zemin, bolum rengi/zemin,
     dugme yazisi/bolum rengi, alt bant yazilari, cetvel cizgisi/yuzey

   Kullanim:  node tools/palettecheck.js
   Cikti:     "butun paletler AA gecti"  ya da  sorunlu kombinasyonlar

   Ayrica /tmp/pal altina her paletin ekran goruntusunu birakir. */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const OUT = '/tmp/pal'; fs.mkdirSync(OUT, { recursive:true });
const srv = spawn('python3', ['devserver.py'], { cwd:process.cwd(), stdio:'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));

/* WCAG kontrast — arayuzun okunabilirligi goz kararina birakilmaz. */
function lum(c){ const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]); }
function ratio(a,b){ const l1=lum(a),l2=lum(b); return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05); }

/* Olcum ve denetim listesi TEK YERDE: ekran, palet ve duzen donguleri
   ayni tanimi kullansin, biri guncellenip digeri unutulmasin diye. */
async function measure(p){
  return p.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const g = n => cs.getPropertyValue(n).trim();
    /* Renk tuvale boyanip gercek sRGB degeri okunur. Hesaplanmis renk
       her zaman `rgb()` olarak gelmez: `color-mix(in oklab, …)`
       Chromium'da `oklab(…)` diye serilesir ve sayilari 0–1
       araligindadir. Metni dogrudan ayristirmak sessizce yanlis olcum
       uretir — nitekim uretiyordu. */
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently:true });
    const px = v => { cx.clearRect(0,0,1,1); cx.fillStyle='#000'; cx.fillStyle=v;
      cx.fillRect(0,0,1,1); const d=cx.getImageData(0,0,1,1).data;
      return [d[0], d[1], d[2]]; };
    const foot = document.querySelector('.sitefoot');
    const fb = foot ? getComputedStyle(foot).backgroundColor : 'rgb(0,0,0)';
    return { sec:px(g('--sec')), bg:px(g('--bg')), surf:px(g('--surface')),
      text:px(g('--text')), text2:px(g('--text-2')), text3:px(g('--text-3')),
      rule:px(g('--rule')),
      footBg:px(fb),
      footFg:px(g('--ink-on')), footFg2:px(g('--ink-on-2')),
      primInk:px(g('--primary-ink')) };
  });
}

function checksOf(m){
  return [
    ['metin/zemin', ratio(m.text, m.bg), 4.5],
    ['ikincil/zemin', ratio(m.text2, m.bg), 4.5],
    ['ucuncul/zemin', ratio(m.text3, m.bg), 4.5],
    ['metin/yuzey', ratio(m.text, m.surf), 4.5],
    ['ucuncul/yuzey', ratio(m.text3, m.surf), 4.5],
    ['bölüm rengi/zemin', ratio(m.sec, m.bg), 3.0],
    ['düğme yazısı/bölüm rengi', ratio(m.primInk, m.sec), 4.5],
    ['alt bant yazısı', ratio(m.footFg, m.footBg), 4.5],
    ['alt bant ikincil', ratio(m.footFg2, m.footBg), 4.5],
    ['cetvel çizgisi/yüzey', ratio(m.rule, m.surf), 1.25],
    /* Metin merdiveni SIRALI kalmali: ikincil metin, ucunculden her
       zaman guclu olmali. Bir duzen jetonlari yeniden turetirken bu
       siranin bozulmasi kolaydir ve gozle fark edilmez. */
    ['metin merdiveni sırası', ratio(m.text2, m.bg) / ratio(m.text3, m.bg), 1.0],
  ];
}

(async () => {
  await wait(1200);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.goto('http://127.0.0.1:4193/index.html', { waitUntil:'load' });
  await wait(1500);
  const skip = await p.$('[data-act="setup-skip"]'); if(skip){ await skip.click(); await wait(500); }
  /* Bos bir uygulama duzen ve kontrast hatalarini GIZLER: satirlar cizilmez,
     olculecek metin kalmaz. Denetim dolu veriyle gezer. */
  await p.evaluate(async () => {
    await ESP.Model.saveProfile({ name:'Palet', langs:['en'] });
    const bugun = ESP.U.todayISO();
    for(const [disc, dk] of [['lang', 25], ['music', 45], ['reading', 30]]){
      await ESP.Model.addSession(bugun, { disc, minutes:dk });
    }
    for(const [f, b] of [['nevertheless', 'yine de'], ['to grasp', 'kavramak'],
        ['make a point', 'bir noktaya değinmek']]){
      await ESP.Model.saveCard(ESP.Model.newCard({ front:f, back:b, lang:'en' }));
    }
    await ESP.SRS.answer(ESP.S.cards[0].id, 'good');
    await ESP.Model.saveBook(ESP.Model.newBook({ title:'Devlet', author:'Platon' }));
    await ESP.Model.saveNote(ESP.Model.newNote({ text:'Adalet, herkesin kendi işini yapmasıdır.',
      bookId:ESP.S.books[0].id, concepts:['adalet'] }));
    await ESP.Model.saveArgument(ESP.Model.newArgument({
      thesis:'Özgürlük yalnızca seçenek çokluğu değildir.',
      objections:[{ id:'o1', text:'Ölçütü kim koyar?', answered:false }] }));
    await ESP.Model.savePiece(ESP.Model.newPiece({ name:'Dönüşümlü mızrap',
      targetBpm:140, cleanBpm:96 }));
    await ESP.Model.saveDraft(ESP.Model.newDraft({ title:'Deneme',
      text:'Yazmak düşünmenin kendisidir. Bir cümle kurmak, o cümleyi savunmaktır.' }));
  });

  const pals = ['kagit','indigo','grafit','okyanus','mor','bordo','orman'];
  const secs = ['today','lang','symposium','studio','library','writing','office','profile'];
  const bad = [];
  /* Devir notu §14.3: hicbir sey olcmeyen bir betik de "gecti" yazar.
     Bu yuzden gecerken bile kac kombinasyon olculdugu ve EN DAR PAY
     yazilir — sayi gorunmedikce gectigine guvenilmez. */
  let olculen = 0;
  let enDar = null;
  for(const theme of ['light','dark']){
    for(const pal of pals){
      await p.evaluate(async ([pl, th]) => {
        await ESP.Model.saveProfile({ palette:pl, theme:th });
        ESP.App.applyTheme();
      }, [pal, theme]);
      for(const route of secs){
        await p.evaluate(id => ESP.App.go(id), route);
        await wait(180);
        const m = await measure(p);
        checksOf(m).forEach(([name, r, min]) => {
          olculen++;
          const pay = r / min;
          if(enDar == null || pay < enDar.pay){
            enDar = { pay, name, r, min, where:`${theme}/${pal}/${route}` };
          }
          if(r < min) bad.push(`${theme}/${pal}/${route}  ${name}  ${r.toFixed(2)} < ${min}`);
        });
      }
      /* DUZENLER. Bazi duzenler jeton yeniden tanimliyor (ornegin kraft
         kagit rengini turetiyor); o yuzden kontrast varsayilan duzende
         gectigi icin diger dortte de gecmis sayilmaz. Tek temsilci ekran
         yeter: olculen sey ekranin icerigi degil, kokteki jetonlar. */
      for(const design of ['odak', 'kraft', 'katmanli', 'harita']){
        await p.evaluate(async d => {
          await ESP.Model.saveProfile({ design:d });
          ESP.App.applyTheme();
          await ESP.App.render();
        }, design);
        await p.evaluate(id => ESP.App.go(id), 'lang');
        await wait(220);
        const m = await measure(p);
        checksOf(m).forEach(([name, r, min]) => {
          olculen++;
          const pay = r / min;
          if(enDar == null || pay < enDar.pay){
            enDar = { pay, name, r, min, where:`${theme}/${pal}/${design}` };
          }
          if(r < min) bad.push(`${theme}/${pal}/${design}  ${name}  ${r.toFixed(2)} < ${min}`);
        });
      }
      await p.evaluate(async () => {
        await ESP.Model.saveProfile({ design:ESP.DEFAULT_DESIGN });
        ESP.App.applyTheme();
        await ESP.App.render();
      });

      /* Her palet icin bir ekran goruntusu birak. */
      await p.evaluate(id => ESP.App.go(id), 'lang');
      await wait(250);
      await p.screenshot({ path:`${OUT}/${theme}-${pal}.png` });
    }
  }
  if(bad.length){
    console.log('KONTRAST SORUNU (' + bad.length + '):\n' + bad.join('\n'));
  }else{
    console.log('butun paletler AA gecti — ' + olculen + ' olcum');
    if(enDar){
      console.log('en dar pay: ' + enDar.name + ' ' + enDar.r.toFixed(2)
        + ' (asgari ' + enDar.min + ') — ' + enDar.where);
    }
  }
  await b.close(); srv.kill(); process.exit(0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
