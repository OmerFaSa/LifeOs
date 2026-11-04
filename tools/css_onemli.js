#!/usr/bin/env node
/* !important DENETIMI — hangisi gercekten bir seye yariyor, olcerek bulur.

     node tools/css_onemli.js              her modulu gezer, ozeti yazar
     node tools/css_onemli.js --sil        KANITLI gereksizleri kaynaktan siler (sonra ortak.py --yay + build)
     --modul AYS                           yalniz o modul

   Bir bildirim ancak su uc sey birlikte dogruysa «gereksiz» sayilir:
     1. Taranan durumlarin en az birinde bir ogeye uydu.
     2. O ogelerin HICBIRINDE !important kalkinca hesaplanan stil degismedi.
     3. Ayni ogeye ayni ozelligi yazan baska bir durum kurali yok (:hover, baska ekran boyu...):
        bu durumlar taranamaz, o yuzden bildirim tutulur.
   Hic uymayan bildirim «gorulmedi»dir: «gereksiz» diye raporlanmaz (AGENTS §1.7).
   Durumlar: butun ekranlar, acik ve koyu, Yumusak ve Sade zemin, masaustu ve 390 piksel, King ve Gorunum acik. */
const fs = require('fs'), path = require('path');
const KOK = path.resolve(__dirname, '..');
const anaKok = path.resolve(KOK, require('child_process').execSync('git rev-parse --git-common-dir', { cwd:KOK, encoding:'utf8' }).trim(), '..');
const { chromium } = require(path.join(anaKok, 'AYS', 'node_modules', 'playwright'));
const { DOLDUR_KAYNAK } = require('./envanter.js');
const NS = { AYS:'R', SPI:'SP', ESP:'ESP' };
const arg = ad => { const i = process.argv.indexOf(ad); return i < 0 ? null : (process.argv[i + 1] || ''); };
const MODULLER = arg('--modul') ? [arg('--modul')] : Object.keys(NS);

/* Kaynak metni: yorumlar ayni uzunlukta bosluk olur, konumlar degismez. */
function bildirimler(metin){
  const t = metin.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  const out = [], yigin = [];
  let bas = 0;
  for(let i = 0; i < t.length; i++){
    const c = t[i];
    if(c === '{'){ yigin.push(t.slice(bas, i).trim()); bas = i + 1; }
    else if(c === '}'){
      const sec = yigin.pop();
      if(sec != null && sec[0] !== '@' && !yigin.some(a => /keyframes/.test(a))){
        const govde = t.slice(bas, i), re = /([\w-]+)\s*:\s*((?:[^;"']|"[^"]*"|'[^']*')*?)\s*!important/g;
        let m;
        while((m = re.exec(govde))){
          const dizi = bas + m.index + m[0].lastIndexOf('!important');
          let k = dizi; while(k > 0 && /\s/.test(metin[k - 1])) k--;
          out.push({ secici:sec, ozellik:m[1], deger:m[2], medya:yigin.join(' '), bas:k, son:dizi + '!important'.length });
        }
      }
      bas = i + 1;
    } else if(c === ';' && !yigin.length){ bas = i + 1; }
  }
  return out;
}

/* Sayfada kosar: her bildirimi bu durumda sinar. */
const SINA = liste => {
  const say = s => s.replace(/\s+/g, '').replace(/'/g, '"').toLowerCase();
  const DURUM = /:(hover|focus|focus-visible|focus-within|active|checked|disabled|visited|target|open|placeholder-shown|empty)\b/g;
  const tum = [];
  const gez = (kurallar, medyaAcik) => { for(const r of kurallar){
    if(r.type === 1) tum.push({ r, medyaAcik });
    else if(r.cssRules) gez(r.cssRules, medyaAcik && (!r.media || matchMedia(r.media.mediaText).matches));
  } };
  for(const s of document.styleSheets){ try{ gez(s.cssRules, true); }catch(e){ /* erisilemeyen sayfa */ } }
  const dizin = {};
  tum.forEach(k => { (dizin[say(k.r.selectorText)] = dizin[say(k.r.selectorText)] || []).push(k); });
  const sonuc = {};
  liste.forEach(b => {
    const adaylar = (dizin[say(b.secici)] || []).filter(k => k.medyaAcik && k.r.style.getPropertyPriority(b.ozellik) === 'important' || (k.medyaAcik && k.r.style.cssText.includes('!important')));
    const k = adaylar[0];
    if(!k) return;
    const parca = b.secici.split(',').map(x => x.trim());
    let gorunen = 0, gerekli = false;
    for(const p of parca){
      const oz = (p.match(/::?(before|after)\b/) || [])[1];
      let els = [];
      const duz = p.replace(/::?(before|after)\b/g, '');
      if(/:(hover|focus|active|checked)/.test(duz)) continue;
      try{ els = Array.from(document.querySelectorAll(duz)).slice(0, 30); }catch(e){ continue; }
      for(const el of els){
        gorunen++;
        const cs = getComputedStyle(el, oz ? '::' + oz : null);
        const once = cs.cssText || Array.from(cs).map(a => a + ':' + cs.getPropertyValue(a)).join(';');
        k.r.style.setProperty(b.ozellik, b.deger, '');
        const c2 = getComputedStyle(el, oz ? '::' + oz : null);
        const sonra = c2.cssText || Array.from(c2).map(a => a + ':' + c2.getPropertyValue(a)).join(';');
        k.r.style.setProperty(b.ozellik, b.deger, 'important');
        if(once !== sonra){ gerekli = true; break; }
        /* Soz 3: baska bir durumda ayni ozelligi yazan kural. */
        const onekli = new RegExp('(^|[;\\s])' + b.ozellik.split('-')[0]);
        for(const o of tum){
          if(o.r === k.r || !onekli.test(o.r.style.cssText)) continue;
          const yalin = o.r.selectorText.replace(DURUM, '').replace(/::?(before|after)\b/g, '');
          if(yalin === o.r.selectorText && o.medyaAcik) continue;
          try{ if(el.matches(yalin)){ gerekli = true; break; } }catch(e){ /* tarayicinin bilmedigi secici */ }
        }
        if(gerekli) break;
      }
      if(gerekli) break;
    }
    sonuc[b.anahtar] = { gorunen, gerekli };
  });
  return sonuc;
};

async function modulTara(t, modul, liste){
  const birlesik = {};
  const kat = o => Object.keys(o).forEach(k => {
    const b = birlesik[k] = birlesik[k] || { gorunen:0, gerekli:false };
    b.gorunen += o[k].gorunen; b.gerekli = b.gerekli || o[k].gerekli;
  });
  for(const v of [{ width:1280, height:800 }, { width:390, height:844 }]){
    const c = await t.newContext({ viewport:v, reducedMotion:'reduce' });
    const p = await c.newPage();
    await p.goto('file:///' + path.join(KOK, modul, 'src', 'index.html').replace(/\\/g, '/'));
    await p.waitForFunction(n => window[n] && window[n].Screens && window[n].S && window[n].S.profile !== undefined, NS[modul], { timeout:25000 });
    await p.evaluate(DOLDUR_KAYNAK[modul]);
    await p.addStyleTag({ content:'*,*::before,*::after{transition:none!important;animation:none!important}' });
    const yollar = await p.evaluate(n => Object.keys(window[n].Screens).filter(k => window[n].Screens[k] && window[n].Screens[k].render), NS[modul]);
    const tema = v.width > 500 ? [['light', null], ['dark', null], ['light', 'sade'], ['dark', 'sade']] : [['light', null], ['dark', null]];
    for(const [th, zm] of tema){
      await p.evaluate(([a, b]) => { document.documentElement.setAttribute('data-theme', a); if(b) document.documentElement.setAttribute('data-zemin', b); }, [th, zm]);
      for(const y of yollar){
        await p.evaluate(([n, r]) => Promise.resolve(window[n].App.go(r)).catch(() => {}), [NS[modul], y]).catch(() => {});
        await p.waitForTimeout(120);
        kat(await p.evaluate(SINA, liste));
      }
    }
    for(const sec of ['[data-king-ac]', '[data-act="open-appearance"]']){
      await p.evaluate(s => { const e = document.querySelector(s); if(e) e.click(); }, sec).catch(() => {});
      await p.waitForTimeout(400);
      kat(await p.evaluate(SINA, liste));
    }
    await c.close();
  }
  return birlesik;
}

(async () => {
  /* Kaynak dosyalar: ortak kopya varsa kaynagi brand/ortak'tadir. */
  const kaynak = {};
  MODULLER.forEach(m => {
    const k = path.join(KOK, m, 'src', 'css');
    fs.readdirSync(k).filter(f => f.endsWith('.css') && f !== 'vitrin.css').forEach(f => {   // vitrin.css uretilir (tools/vitrin.py)
      const ortak = path.join(KOK, 'brand', 'ortak', f), seviye = path.join(KOK, 'brand', 'seviye', f);
      const yol = fs.existsSync(ortak) ? ortak : fs.existsSync(seviye) ? seviye : path.join(k, f);
      (kaynak[yol] = kaynak[yol] || { moduller:[] }).moduller.push(m);
    });
  });
  const hepsi = [];
  Object.keys(kaynak).forEach(y => bildirimler(fs.readFileSync(y, 'utf8')).forEach((b, i) => hepsi.push(Object.assign(b, { yol:y, moduller:kaynak[y].moduller, anahtar:path.basename(y) + '#' + i }))));
  const t = await chromium.launch({ args:['--allow-file-access-from-files', '--disable-web-security'] });
  const sonuc = {};
  for(const m of MODULLER){
    const liste = hepsi.filter(b => b.moduller.includes(m)).map(({ secici, ozellik, deger, anahtar }) => ({ secici, ozellik, deger, anahtar }));
    sonuc[m] = await modulTara(t, m, liste);
    console.log(m + ': ' + liste.length + ' bildirim tarandi');
  }
  await t.close();
  const say = { gereksiz:0, gerekli:0, gorulmedi:0 };
  const sil = [];
  hepsi.forEach(b => {
    const l = b.moduller.filter(m => sonuc[m]).map(m => sonuc[m][b.anahtar] || { gorunen:0, gerekli:false });
    /* Olcumun goremedigi: JS'in sonradan yazdigi satir ici konum, [hidden] gibi anahtar, taramanin kapattigi hareket ve onun yazdigi ozellikler. */
    if(l.some(x => x.gerekli) || /^(display|left|right|top|bottom|inset|animation|transition|transform|translate|scale|rotate|opacity|backdrop-filter|-webkit-)/.test(b.ozellik)){ say.gerekli++; b.durum = 'gerekli'; }
    else if(l.some(x => x.gorunen)){ say.gereksiz++; b.durum = 'gereksiz'; sil.push(b); }
    else{ say.gorulmedi++; b.durum = 'gorulmedi'; }
  });
  console.log('Toplam ' + hepsi.length + ': gerekli ' + say.gerekli + ' · gereksiz ' + say.gereksiz + ' · gorulmedi ' + say.gorulmedi);
  if(process.argv.includes('--sil')){
    const dosya = {};
    sil.forEach(b => (dosya[b.yol] = dosya[b.yol] || []).push(b));
    Object.keys(dosya).forEach(y => {
      let s = fs.readFileSync(y, 'utf8');
      dosya[y].sort((a, b) => b.bas - a.bas).forEach(b => { s = s.slice(0, b.bas) + s.slice(b.son); });
      fs.writeFileSync(y, s);
      console.log('  ' + path.relative(KOK, y) + ': ' + dosya[y].length + ' silindi');
    });
  } else {
    sil.slice(0, 15).forEach(b => console.log('  ' + path.basename(b.yol) + ' · ' + b.secici.slice(0, 50) + ' { ' + b.ozellik + ' }'));
  }
})().catch(e => { console.error(e); process.exit(2); });
