/* Tasarım örneklerini gerçek tarayıcıda açar ve düzen hatası arar.

   Örnekler çalışan sistem değil ama yine de doğru çizilmeleri gerekir:
   yatay taşma, boş sayfa, tanımsız sınıf yüzünden biçimsiz kalan metin
   ve konsol hatası. Üç genişlikte bakar; masaüstü, tablet ve telefon. */

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const DIR = path.join(__dirname, '..', 'tasarim');
const WIDTHS = [[1280, 'masaüstü'], [900, 'tablet'], [420, 'telefon']];

// Bu örnekler bilerek geniş: kendi kaydırma kabını taşırlar.
const SCROLLS_OK = { '13-yogun.html':[900,420], '20-harita.html':[1280,900,420] };

(async () => {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const problems = [];

  for(const f of files){
    const page = await browser.newPage();
    // Yazi tipleri agdan gelmesin: olcum cevrimdisi da ayni olsun.
    await page.route('**fonts.googleapis.com**', r => r.abort());
    await page.route('**fonts.gstatic.com**', r => r.abort());
    const errs = [];
    // Yazi tipi isteklerini biz kestik; onun hatasi sayilmaz.
    const gurultu = t => /ERR_FAILED|fonts\.(googleapis|gstatic)/.test(t);
    page.on('pageerror', e => errs.push(String(e.message)));
    page.on('requestfailed', () => {});
    page.on('console', m => { if(m.type() === 'error' && !gurultu(m.text())) errs.push(m.text()); });

    for(const [w, adi] of WIDTHS){
      await page.setViewportSize({ width:w, height:900 });
      await page.goto('file://' + path.join(DIR, f), { waitUntil:'domcontentloaded' });
      await page.waitForTimeout(f === 'index.html' ? 1200 : 250);

      const r = await page.evaluate(() => {
        const d = document.documentElement, b = document.body;
        const over = [];
        for(const el of document.querySelectorAll('body *')){
          const box = el.getBoundingClientRect();
          if(box.width === 0 && box.height === 0) continue;
          if(box.right > d.clientWidth + 2 || box.left < -2){
            // kendi yatay kaydırma kabı içindeyse sorun değil
            let p = el.parentElement, kapali = false;
            while(p && p !== b){
              const ov = getComputedStyle(p).overflowX;
              if(ov === 'auto' || ov === 'scroll' || ov === 'hidden'){ kapali = true; break; }
              p = p.parentElement;
            }
            if(!kapali) over.push(el.tagName.toLowerCase() + '.' + (el.className || '?'));
          }
        }
        return {
          scrollW:d.scrollWidth, clientW:d.clientWidth,
          height:d.scrollHeight, text:(b.innerText || '').trim().length,
          bg:getComputedStyle(b).backgroundColor,
          font:getComputedStyle(b).fontFamily,
          over:[...new Set(over)].slice(0, 6),
        };
      });

      const izin = (SCROLLS_OK[f] || []).includes(w);
      if(r.scrollW > r.clientW + 2 && !izin)
        problems.push(`${f} @${adi}: yatay taşma ${r.scrollW}>${r.clientW}` +
          (r.over.length ? ` — ${r.over.join(', ')}` : ''));
      if(r.over.length && !izin)
        problems.push(`${f} @${adi}: kaba sığmayan öge — ${r.over.join(', ')}`);
      if(r.height < 400) problems.push(`${f} @${adi}: sayfa çok kısa (${r.height}px)`);
      if(r.text < 160 && f !== 'index.html') problems.push(`${f} @${adi}: metin yok (${r.text} karakter)`);
      if(/^(Times|serif)/.test(r.font)) problems.push(`${f}: gövde yazı tipi uygulanmamış (${r.font})`);
    }

    if(errs.length) problems.push(`${f}: konsol — ${[...new Set(errs)].slice(0,2).join(' | ')}`);
    await page.close();
  }

  await browser.close();
  if(problems.length){
    console.log(problems.join('\n'));
    console.log('\n' + problems.length + ' sorun');
    process.exit(1);
  }
  console.log(files.length + ' tasarım örneği temiz');
})().catch(e => { console.error(e); process.exit(1); });
