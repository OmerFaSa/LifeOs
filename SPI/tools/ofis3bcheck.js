#!/usr/bin/env node
/* Actual browser integration plus deterministic full-route simulation.
 * node tools/ofis3bcheck.js [base-url]  (default http://127.0.0.1:4199)
 * Serve SPI with python3 -m http.server 4199 --bind 127.0.0.1.
 * CHROMIUM_PATH optionally chooses an installed browser. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:4199';
async function ready(page){
 await page.waitForFunction(()=>window.SP&&SP.App&&SP.S.ready);
 await page.waitForTimeout(750);
 const skip=page.locator('[data-act="setup-skip"]');if(await skip.count())await skip.click();
 await page.evaluate(()=>SP.UI.closeSheet());
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--enable-unsafe-swiftshader']});
 try{
 let sceneHTML;
 for(const target of ['/src/index.html','/dist/spi.html']){
  const page=await browser.newPage({viewport:{width:1440,height:1080},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+target);await ready(page);
  await page.evaluate(()=>SP.App.go('office'));await page.waitForSelector('[data-act="office-3d"]');
  assert.equal(await page.evaluate(()=>typeof window.THREE),'undefined');
  await page.evaluate(()=>SP.Ofis3B.acKapat());await page.waitForFunction(()=>SP.Ofis3B.durum()?.calisiyor);
  assert.equal(await page.locator('.office-view canvas').count(),1);
  await page.evaluate(()=>{window.originalCampusCanvas=document.querySelector('.office-view canvas');SP.S.ui.officeDesk='lab';SP.App.render();});
  await page.waitForFunction(()=>document.querySelector('.office-view canvas')===window.originalCampusCanvas);
  await page.locator('[data-night]').click();assert.equal(await page.evaluate(()=>SP.Ofis3B.durum().gece),true);
  await page.locator('.spi-campus [data-act="toggle-desk"][data-id="money"]').click();
  await page.waitForFunction(()=>SP.S.ui.officeDesk==='money');
  await page.locator('[data-view="top"]').click();await page.locator('[data-zoom="in"]').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('spi-campus-view')).modelContent.view),'top');
  await page.locator('[data-view="angle"]').click();await page.locator('[data-zoom="out"]').click();
  sceneHTML=await page.locator('.spi-campus__scene').evaluate(el=>el.outerHTML);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.spi-campus').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await page.evaluate(()=>{SP.App.go('today')});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>SP.Ofis3B.durum().calisiyor),false);
  await page.evaluate(()=>SP.App.go('office'));await page.waitForFunction(()=>SP.Ofis3B.durum().calisiyor);
  await page.evaluate(()=>SP.Ofis3B.toplanti());await page.waitForFunction(()=>SP.S.route==='meeting');
  assert.deepEqual(errors,[]);await page.close();console.log('OK integration, reduced motion, selection, night, mobile, lifecycle:',target);
 }
 // Host bridge: real handoffs are deduplicated; route changes cancel navigation.
 {
  const page=await browser.newPage({serviceWorkers:'block',reducedMotion:'no-preference'});
  await page.goto(base+'/src/index.html');await ready(page);
  await page.evaluate(()=>{
   window.calls=[];window.fakeBusy=false;window.ends=null;
   window.SpiOfis3B={kur(root,o){ends=o.bitti;return {ok:true,surdur(){},durum(){return{};},mesgul(){return fakeBusy;},gorev(...args){calls.push(args);return true;},toplanti(v){fakeBusy=v;return true;}};}};
   SP.Office.handoffs=()=>[{id:'one',from:'lab',to:'nutri',privateValue:999},{id:'two',from:'move',to:'patron'},{id:'three',from:'money',to:'lab'},{id:'four',from:'nutri',to:'money'}];
   SP.App.go('office');
  });
  await page.waitForSelector('[data-act="office-3d"]');await page.evaluate(()=>SP.Ofis3B.acKapat());
  await page.waitForFunction(()=>calls.length===4);await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(()=>calls.length),4);
  assert.equal(await page.evaluate(()=>calls.every(c=>c.length===3&&c[0]==='deliver'&&Number.isInteger(c[1]))),true);
  await page.evaluate(()=>{SP.Ofis3B.toplanti();SP.App.go('today');ends({tur:'toplanti',durum:'seated'});});
  assert.equal(await page.evaluate(()=>SP.S.route),'today');
  await page.close();console.log('OK real devir deduplication, payload boundary, cancelled meeting navigation');
 }
 // Failed local asset must restore the existing light office.
 for(const failure of ['asset','webgl']){
  const page=await browser.newPage({serviceWorkers:'block'});
  if(failure==='asset')await page.route('**/ofis3d/**',r=>r.abort());
  else await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
  await page.goto(base+'/src/index.html');await ready(page);
  await page.evaluate(()=>SP.App.go('office'));await page.waitForSelector('[data-act="office-3d"]');
  await page.evaluate(()=>SP.Ofis3B.acKapat());await page.waitForFunction(()=>!SP.Ofis3B.aktif());
  assert.match(await page.locator('.spi-campus').innerText(),/Hafif ofis/);
  assert.ok(await page.locator('.vofis').count());await page.close();console.log('OK fallback:',failure);
 }
 // Geometry, skeletal animation, routes and projection use real Three.js.
 // Only rasterization and the wall clock are replaced for exhaustive traversal.
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 await page.goto(base+'/src/ofis3d/LICENSE-THREE.txt');
 await page.setContent('<style>.office-view{width:1100px;height:700px}</style>'+sceneHTML);
 await page.addScriptTag({url:base+'/src/ofis3d/three-0.160.1.min.js'});
 await page.evaluate(()=>{
  window.frames=[];window.now=performance.now();window.requestAnimationFrame=cb=>{frames.push(cb);return frames.length;};
  THREE.WebGLRenderer=function(){this.domElement=document.createElement('canvas');this.shadowMap={};this.setPixelRatio=()=>{};this.setSize=()=>{};this.render=()=>{};};
 });
 await page.addScriptTag({url:base+'/src/ofis3d/sahne.js'});
 const result=await page.evaluate(()=>{
  const events=[],api=SpiOfis3B.kur(document.querySelector('.spi-campus__scene'),{adlar:['Kerem','Nesrin','Barış','Sedef','Patron'],bitti:e=>events.push(e)});
  api.hiz(4);let count=0;
  const pump=predicate=>{for(let i=0;i<6000;i++){const cbs=frames.splice(0);now+=40;cbs.forEach(cb=>cb(now));if(predicate())return;}throw new Error('route timed out '+JSON.stringify(api.durum()));};
  const check=(v,msg)=>{if(!v)throw new Error(msg);};
  check(!api.gorev('deliver',.5,1),'fractional actor');check(!api.gorev('deliver',1,1.5),'fractional recipient');check(!api.gorev('deliver',0,0),'self delivery');check(!api.gorev('archive',5),'unknown actor');
  for(let i=0;i<5;i++)for(let j=0;j<5;j++)if(i!==j){check(api.gorev('deliver',i,j),'delivery start');pump(()=>!api.mesgul());check(events.at(-1).kime===j,'recipient mismatch');count++;}
  for(const type of ['archive','break'])for(let i=0;i<5;i++){check(api.gorev(type,i,0),'mission start');pump(()=>!api.mesgul());count++;}
  // Repeated archive retrieval must not exhaust a visual-only shelf.
  for(let i=0;i<15;i++){check(api.gorev('archive',i%5),'reusable archive');pump(()=>!api.mesgul());count++;}
  api.telefon(true);check(api.durum().telefonda,'lounge phone');check(api.toplanti(true),'meeting start');pump(()=>api.durum().toplanti==='seated');
  check(api.toplanti(false),'meeting return');pump(()=>api.durum().toplanti==='idle');check(api.durum().telefonda,'phone restored');
  api.telefon(false);check(!api.durum().telefonda,'phone return');
  for(let i=0;i<5;i++){const p=api.konum(i);check(Number.isFinite(p.x)&&Number.isFinite(p.y),'projection');}
  document.querySelector('.spi-campus__scene').remove();pump(()=>!api.durum().calisiyor);
  return {missions:count,meetings:1,events:events.length};
 });
 console.log('OK full simulation:',JSON.stringify(result));await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
