const { spawn } = require('child_process');
const { chromium } = require('playwright');
const PORT = 4505; const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:'/home/user/LifeOs/SPI',stdio:'ignore'});
  await wait(900);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const page = await b.newPage();
  await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
  await page.waitForSelector('.site'); await wait(500);
  const r = await page.evaluate(() => {
    const F = SP.FOODS, N = SP.NUTRIENTS, B = SP.BIOMARKERS;
    const mikroAlan = N.map(n=>n.id);
    const eksikMikro = {};
    mikroAlan.forEach(id => { eksikMikro[id] = F.filter(f => !f.micro || f.micro[id] == null).length; });
    return {
      sayilar:{ gida:F.length, besin:N.length, biyobelirtec:B.length,
        turetilmis:Object.keys(SP.DERIVED||{}).length, panel:SP.PANELS.length,
        hareket:(SP.EXERCISES||[]).length, ilac:SP.MED_KINDS.length,
        semptom:SP.SYMPTOMS.length, ipucu:Object.keys(SP.HINTS||{}).length,
        palet:SP.PALETTES.length, duzen:SP.DESIGNS.length },
      gidaEksik:{ lifsiz:F.filter(f=>f.fib==null).length, doymusYok:F.filter(f=>f.sat==null).length,
        mikroYok:F.filter(f=>!f.micro||!Object.keys(f.micro).length).length },
      enCokEksikMikro:Object.entries(eksikMikro).sort((a,b)=>b[1]-a[1]).slice(0,8)
        .map(([id,n])=>id+': '+n+'/'+F.length),
      biyoEksik:{ refYok:B.filter(x=>!x.ref).length, optYok:B.filter(x=>!x.optimal).length,
        notYok:B.filter(x=>!x.note).length, aliasYok:B.filter(x=>!x.aliases||!x.aliases.length).length,
        besinBagiYok:B.filter(x=>!x.nutrients||!x.nutrients.length).length },
      ipucuEksik:(function(){
        /* ekranlarda gecen hint anahtarlari sozlukte var mi? */
        return Object.keys(SP.HINTS||{}).length;
      })(),
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close(); srv.kill();
})();
