const { spawn } = require('child_process');
const { chromium } = require('playwright');
const PORT = 4509; const wait = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:'/home/user/LifeOs/SPI',stdio:'ignore'});
  await wait(900);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const page = await b.newPage();
  await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
  await page.waitForSelector('.site'); await wait(500);
  const r = await page.evaluate(() => ({
    gida:SP.FOODS.length, besin:SP.NUTRIENTS.length, biyobelirtec:SP.BIOMARKERS.length,
    turetilmis:Object.keys(SP.DERIVED).length, panel:SP.PANELS.length,
    hareket:SP.EXERCISES.length,
    basamak:SP.EXERCISES.reduce((n,e)=>n+((e.levels||[]).length),0),
    kalip:SP.PATTERNS.length, sablon:SP.SESSION_TEMPLATES.length,
    ilac:SP.MED_KINDS.length, semptom:SP.SYMPTOMS.length, ajan:SP.AGENTS.length,
    palet:SP.PALETTES.length, duzen:SP.DESIGNS.length, ipucu:Object.keys(SP.HINTS).length,
    ekran:Object.keys(SP.Screens).length, bolum:SP.App.SECTIONS.length,
    oruntu:SP.Bio.PATTERNS.length, caprazBag:8,
    besinBagliOlcum:SP.BIOMARKERS.filter(x=>x.nutrients&&x.nutrients.length).length,
    kirmiziEsikli:SP.BIOMARKERS.filter(x=>x.red&&Object.keys(x.red).length).length,
    gunluk:SP.BIOMARKERS.filter(x=>x.daily).length,
  }));
  console.log(JSON.stringify(r,null,1));
  await b.close(); srv.kill();
})();
