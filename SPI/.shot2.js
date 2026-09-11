const {spawn}=require('child_process');const {chromium}=require('playwright');
const ROOT='/home/user/LifeOs/SPI';const PORT=4287;
const OUT='/tmp/claude-0/-home-user-LifeOs/68ec324d-2785-542a-a285-3a592372ca0c/scratchpad/shots/';
(async()=>{const s=spawn('python3',[ROOT+'/devserver.py',String(PORT)],{cwd:ROOT,stdio:'ignore'});
await new Promise(r=>setTimeout(r,1300));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
await p.goto('http://127.0.0.1:'+PORT+'/index.html',{waitUntil:'load'});
await new Promise(r=>setTimeout(r,900));
const sk=await p.$('[data-act="setup-skip"]'); if(sk) await sk.click();
await new Promise(r=>setTimeout(r,400));
await p.evaluate(async()=>{await SP.Model.saveProfile({name:'Ömer',birthYear:1998,sex:'male',
  heightCm:178,weightKg:74,activity:'moderate',goal:'health'});});
for(const r of (process.argv[2]||'office').split(',')){
  await p.evaluate(x=>SP.App.go(x),r);
  await new Promise(r2=>setTimeout(r2,900));
  await p.screenshot({path:OUT+'z-'+r+'.png',fullPage:true});
}
await b.close();s.kill();console.log('ok');})();
