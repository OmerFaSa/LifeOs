#!/usr/bin/env node
/* Android kurulum sayfasi: calisan adresi kendisi bulur (Tailscale, .local, IP), kod varsa hesaba
   baglar, yoksa modul baglantilarini o adrese cevirir. iPhone akisi degismez.

     node tools/android_kurulum_test.js     (cikis 0 temiz, 1 kirmizi)

   Sayfa sistem/sunucu.py'den uretilir; ag page.route ile taklit edilir, sunucu acilmaz (sabit port yok).
   Gercek Android cihazda DENENMEDI: Chrome'un ana ekrana kurmasi burada olculemez. */
const path = require('path');
const { execFileSync } = require('child_process');

const KOK = path.resolve(__dirname, '..');
const { chromium } = require(path.join(KOK, 'ESP', 'node_modules', 'playwright'));

const TS = 'https://pc.tail1.ts.net', LOCAL = 'https://pc.local', IP = 'https://192.168.1.5';
const SAYFA = 'http://192.168.1.5:5180/';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';
const TABLET = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1';

const html = uzak => execFileSync('python3', ['-c', [
  'import sys, os',
  'sys.path.insert(0, os.path.join(sys.argv[1], "sistem"))',
  'sys.stdout.reconfigure(encoding="utf-8")',
  'import sunucu',
  'print(sunucu.telefon_kurulum_html("pc", ["192.168.1.5"], "AA", sys.argv[2]))',
].join('\n'), KOK, uzak], { encoding:'utf8', env:Object.assign({}, process.env, { PYTHONUTF8:'1' }) });

let kirmizi = 0;
function dogru(ad, kosul, gelen){
  console.log((kosul ? '  ✓ ' : '  ✕ ') + ad + (kosul ? '' : ' (gelen ' + JSON.stringify(gelen) + ')'));
  if(!kosul) kirmizi++;
}

(async () => {
  const b = await chromium.launch({ headless:true });
  const tsli = html('pc.tail1.ts.net'), tssiz = html('');

  /* acik: ulasilan kokenler (degistirilebilir); denenen: sw.js sorulan kokenler. */
  async function ac(o){
    const c = await b.newContext({ userAgent:o.ua, hasTouch:o.ua !== 'pc', viewport:{ width:390, height:844 } });
    await c.addInitScript(n => Object.defineProperty(navigator, 'maxTouchPoints', { get:() => n }), o.dokunma == null ? 5 : o.dokunma);
    const p = await c.newPage(), durum = { acik:o.acik, denenen:[] };
    await p.route('**/*', r => {
      const u = new URL(r.request().url());
      if(u.protocol === 'http:') return r.fulfill({ contentType:'text/html; charset=utf-8', body:o.sayfa || tsli });
      if(u.pathname === '/sw.js'){
        durum.denenen.push(u.origin.replace(/:\d+$/, ''));
        return durum.acik.includes(u.origin.replace(/:\d+$/, '')) ? r.fulfill({ status:200, body:'' }) : r.abort('namenotresolved');
      }
      return r.fulfill({ contentType:'text/html', body:'<title>modul</title>' });
    });
    await p.goto(SAYFA + (o.kod ? '?bagla=482913' : ''));
    return { c, p, durum };
  }
  const kapi = (p, s) => p.waitForURL(s, { timeout:8000 }).then(() => true, () => false);

  try{
    let t = await ac({ ua:ANDROID, kod:true, acik:[TS, LOCAL, IP] });
    dogru('Tailscale aciksa once o: sertifika gerekmez', await kapi(t.p, TS + ':5183/?bagla=482913'), t.p.url());
    await t.c.close();

    t = await ac({ ua:ANDROID, kod:true, acik:[LOCAL, IP] });
    dogru('Tailscale yoksa .local (IP degisince koken degismesin)', await kapi(t.p, LOCAL + ':5183/?bagla=482913'), t.p.url());
    await t.c.close();

    t = await ac({ ua:ANDROID, kod:true, acik:[IP] });
    dogru('.local cozulmezse IP (bazi Android\'ler)', await kapi(t.p, IP + ':5183/?bagla=482913'), t.p.url());
    await t.c.close();

    t = await ac({ ua:ANDROID, kod:true, acik:[], sayfa:tssiz });
    await t.p.waitForFunction(() => /adımlardan birini/.test(document.getElementById('bagla-durum').textContent));
    dogru('ulasilamazsa adresten kod silinir, adimlar gorunur',
      t.p.url() === SAYFA && await t.p.locator('#android-kur').isVisible(), t.p.url());
    dogru('Tailscale acik degilse Tailscale adresi denenmez', !t.durum.denenen.includes(TS), t.durum.denenen);
    t.durum.acik = [IP];
    dogru('sertifika kurulunca kendiliginden baglanir', await kapi(t.p, IP + ':5183/?bagla=482913'), t.p.url());
    await t.c.close();

    t = await ac({ ua:TABLET, acik:[TS] });
    await t.p.locator('#android-hazir').waitFor({ state:'visible', timeout:8000 });
    dogru('masaustu sitesi isteyen tablet Android sayilir, adimlar kalkar', !await t.p.locator('#android-kur').isVisible());
    dogru('modul baglantilari calisan adrese doner', await t.p.locator('a[data-kapi]').evaluateAll(l => l.map(a => a.getAttribute('href')).join()) ===
      [5173, 5183, 5193].map(k => TS + ':' + k + '/').join());
    dogru('yedek adres gizlenir (koken hep ayni)', !await t.p.locator('.yedek').first().isVisible());
    await t.c.close();

    t = await ac({ ua:IPHONE, kod:true, acik:[TS, IP] });
    await t.p.locator('#bagla-uygulama').waitFor({ state:'visible', timeout:8000 });
    dogru('iPhone yerinde kalir, uygulamaya acma dugmesi cikar', t.p.url() === SAYFA, t.p.url());
    dogru('iPhone yalniz sayfanin adresini dener', t.durum.denenen.every(a => a === IP), t.durum.denenen);
    await t.c.close();

    t = await ac({ ua:TABLET, dokunma:0, acik:[TS] });
    await t.p.waitForTimeout(400);
    dogru('kodsuz masaustu tarayicisi hic yoklama yapmaz', t.durum.denenen.length === 0, t.durum.denenen);
    await t.c.close();
  }finally{ await b.close(); }

  console.log(kirmizi ? 'kirmizi: ' + kirmizi : 'temiz');
  process.exit(kirmizi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
