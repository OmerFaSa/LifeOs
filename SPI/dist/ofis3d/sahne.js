/* SPI sağlık kampüsü. AYS sahne motorundan uyarlanmıştır.
 * Yalnız görselleştirme: sağlık verisi okumaz, karar üretmez, ağ isteği yapmaz.
 * Kadro, seçim ve gerçek devirler js/core/ofis3b.js üzerinden gelir. */
(function(){
function kur(root,o){
o=o||{};
const stage=root.querySelector('.office-view');
if(!window.THREE)return {ok:false,why:'3B kütüphanesi yüklenemedi.'};
const T=window.THREE,scene=new T.Scene(),camera=new T.OrthographicCamera(-8,8,8,-8,.1,100);
let renderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true});}catch(e){return {ok:false,why:'Bu cihazda WebGL yok; hafif görünüm kullanılıyor.'};}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;stage.appendChild(renderer.domElement);
// The diorama keeps its pastel materials; lighting follows the host appearance.
const materials=[];function mat(c,extra={}){const m=new T.MeshStandardMaterial({color:c,roughness:.72,...extra});materials.push(m);return m;}
const cream=mat('#dfded5'),wood=mat('#b9a082'),woodLight=mat('#c4af93'),mint=mat('#76968a'),pink=mat('#b88473'),lilac=mat('#9992ae'),blue=mat('#628e9a'),yellow=mat('#b7a078'),dark=mat('#25383b'),white=mat('#e5e4dc'),green=mat('#3c6c58'),greenLight=mat('#84a17a'),soil=mat('#554b43');
const walnut=mat('#684a36',{roughness:.52}),brass=mat('#b6985d',{metalness:.55,roughness:.32}),leather=mat('#3b5e59',{roughness:.9}),stone=mat('#b6bdb9');
function surfaceTexture(type){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle=type==='wood'?'#e0d0b6':'#bcbcbc';x.fillRect(0,0,128,128);let seed=19;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<750;i++){const a=rand()*.12;x.fillStyle='rgba(55,40,20,'+a+')';const px=rand()*128,py=rand()*128;x.fillRect(px,py,type==='wood'?8+rand()*90:1,type==='wood'?.35:1);}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;return t;}
const grain=surfaceTexture('wood'),weave=surfaceTexture('fabric');woodLight.map=grain;wood.map=grain;walnut.map=grain;leather.bumpMap=weave;leather.bumpScale=.025;mint.bumpMap=weave;mint.bumpScale=.018;
const room=new T.Group();scene.add(room);
const roundCache=new Map();function roundGeo(w,h,d,r=.08){r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);const key=[w,h,d,r].join();if(roundCache.has(key))return roundCache.get(key);const s=new T.Shape(),x=-w/2+r,y=-h/2+r,a=w-2*r,b=h-2*r;s.moveTo(x,y);s.lineTo(x+a,y);s.lineTo(x+a,y+b);s.lineTo(x,y+b);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:4});geo.translate(0,0,-d/2+r);geo.computeVertexNormals();roundCache.set(key,geo);return geo;}
function mesh(geo,m,x,y,z,p=room){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function box(w,h,d,m,x,y,z,p=room,r=.06){return mesh(roundGeo(w,h,d,r),m,x,y,z,p);}
const sphere=new T.SphereGeometry(1,16,12);function ell(m,x,y,z,sx,sy,sz,p=room){const o=mesh(sphere,m,x,y,z,p);o.scale.set(sx,sy,sz);return o;}
function cyl(rt,rb,h,m,x,y,z,p=room){return mesh(new T.CylinderGeometry(rt,rb,h,20),m,x,y,z,p);}
function rod(a,b,r,m,p=room){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=cyl(r,r,av.distanceTo(bv),m,...av.clone().add(bv).multiplyScalar(.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
// U-shaped wellness campus: three wings surrounding an open planted court.
const strip=mat('#fff0cf',{emissive:'#ffe4aa',emissiveIntensity:.65});
const sky=mat('#c5dadd',{emissive:'#adcbd1',emissiveIntensity:.3});
const glass=mat('#b8dce0',{transparent:true,opacity:.12,roughness:.15,depthWrite:false,side:T.DoubleSide});
const windowViews=[],curtains=[],outerWalls=[],archiveFiles=[],meetingGlass=[];
const plaster=mat('#e6e7df'),rubber=mat('#71948a'),pathMat=mat('#cfcec1'),turf=mat('#6d8970');
function wing(w,d,x,z){box(w,.45,d,plaster,x,-.25,z,room,.13);box(w-.1,.06,d-.1,dark,x,-.50,z);box(w-.15,.035,d-.15,pathMat,x,0,z);}
wing(26,7,0,-6.5);wing(7.5,12.5,-9.25,3.25);wing(7.5,12.5,9.25,3.25);
box(11,.28,8.8,plaster,0,-.17,1.4);box(11,.04,8.8,pathMat,0,.002,1.4);
// Round, freestanding meeting pavilion replaces the old rectangular room.
const meetingRoom=new T.Group();meetingRoom.name='meeting-pavilion';room.add(meetingRoom);
cyl(4.1,4.1,.42,plaster,0,-.23,8.4,meetingRoom);cyl(4,4,.035,woodLight,0,.008,8.4,meetingRoom);
for(let i=0;i<25;i++){const a=i*Math.PI*2/25;if(Math.abs(a-Math.PI)<.42)continue;const x=Math.sin(a)*3.85,z=8.4+Math.cos(a)*3.85;const p=box(.055,1.1,.055,brass,x,.59,z,meetingRoom);const pane=box(.90,1.02,.018,glass,x,.60,z,meetingRoom,.004);pane.rotation.y=a;pane.castShadow=false;meetingGlass.push(pane,p);}
const back=box(26,3.65,.18,plaster,0,1.82,-10);
outerWalls.push(back);
for(const x of [-13,13]){const wall=box(.16,2.8,18.5,plaster,x,1.4,-.75);wall.userData.side=x;outerWalls.push(wall);}
box(25.8,.045,.14,strip,0,3.52,-9.87);
// Floor-to-ceiling windows with a day/night landscape and slender mullions.
function panorama(night,seed){const c=document.createElement('canvas');c.width=640;c.height=512;const q=c.getContext('2d'),g=q.createLinearGradient(0,0,0,512);g.addColorStop(0,night?'#15233d':'#7baebd');g.addColorStop(1,night?'#738295':'#e4e6d1');q.fillStyle=g;q.fillRect(0,0,640,512);q.fillStyle=night?'#f8ebcb':'#fff1ca';q.beginPath();q.arc(470,90,night?18:32,0,Math.PI*2);q.fill();for(let l=0;l<3;l++){q.fillStyle=(night?['#455d70','#354d57','#253f3c']:['#a4beb2','#7a9e8b','#557c65'])[l];q.beginPath();q.moveTo(0,512);for(let j=0;j<=20;j++)q.lineTo(j*32,280+l*67+Math.sin(j*.48+seed+l)*48);q.lineTo(640,512);q.fill();}if(night){q.fillStyle='#dddfd3';for(let j=0;j<28;j++)q.fillRect((j*137+seed*11)%640,(j*53)%210,1.5,1.5);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
for(let k=0;k<6;k++){const x=-10.8+k*4.3,g=new T.Group();g.position.set(x,1.93,-9.86);room.add(g);outerWalls.push(g);const day=panorama(false,k),night=panorama(true,k),material=new T.MeshBasicMaterial({map:day});const p=mesh(new T.PlaneGeometry(3.75,2.87),material,0,0,.04,g);p.castShadow=false;windowViews.push({material,day,night});for(const xx of [-1.93,0,1.93])box(.045,3.05,.12,dark,xx,0,.10,g);for(const yy of [-1.52,1.52])box(3.9,.045,.12,dark,0,yy,.10,g);box(4.05,.11,.48,stone,0,-1.56,.16,g);const sheen=mesh(new T.PlaneGeometry(.18,2.78),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.17,depthWrite:false}),-.9,0,.16,g);sheen.rotation.z=-.12;sheen.castShadow=false;}
function plant(x,y,z,s=1,p=room){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(s);p.add(g);cyl(.22,.16,.36,stone,0,.18,0,g);cyl(.19,.19,.025,soil,0,.365,0,g);for(let i=0;i<7;i++){const a=i*2.4,h=.7+i%3*.17;rod([0,.35,0],[Math.cos(a)*.25,h,Math.sin(a)*.25],.017,green,g);const leaf=ell(i%2?green:greenLight,Math.cos(a)*.28,h,Math.sin(a)*.28,.13,.29,.075,g);leaf.rotation.z=Math.cos(a)*.7;leaf.rotation.y=-a;}return g;}
function label(text,x,y,z,w,h,p=room){const c=document.createElement('canvas');c.width=1024;c.height=192;const q=c.getContext('2d');q.fillStyle='#e8e9df';q.fillRect(0,0,1024,192);q.fillStyle='#294c42';q.font='500 66px sans-serif';q.textAlign='center';q.textBaseline='middle';q.fillText(text,512,100);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const m=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t}),x,y,z,p);m.castShadow=false;return m;}
label('SPİ / SAĞLIK & PERFORMANS',0,3.05,-9.67,6.7,.5);
label('LABORATUVAR',-8.8,2.7,-9.66,3.2,.42);label('BESLENME',8.8,2.7,-9.66,3,.42);
// Central garden: low ring bench, stones, meadow and an olive-like tree.
cyl(3.25,3.25,.16,stone,0,.08,1.25);cyl(2.95,2.95,.17,turf,0,.1,1.25);
const ring=mesh(new T.TorusGeometry(3.12,.13,8,72),woodLight,0,.37,1.25);ring.rotation.x=Math.PI/2;
rod([0,.1,1.25],[.1,2.7,1.25],.105,walnut);for(let i=0;i<9;i++){const a=i*2.4;rod([0,1.6,1.25],[Math.cos(a)*1.25,2.8+i%2*.3,1.25+Math.sin(a)*1.1],.038,walnut);ell(i%2?green:greenLight,Math.cos(a)*1.14,2.85+i%2*.3,1.25+Math.sin(a)*.95,.76,.44,.65);}
for(let i=0;i<12;i++){const a=i*2.4;ell(stone,Math.cos(a)*2.2,.23,1.25+Math.sin(a)*2.2,.20,.12,.15);if(i%2===0)plant(Math.cos(a)*2.5,.1,1.25+Math.sin(a)*2.5,.5);}
// Consulting suite with two curved glass screens, open to the north aisle.
for(const side of [-1,1])for(let i=0;i<5;i++){const z=-8.8+i*.65;const pane=box(.018,2.65,.6,glass,side*(3.4-.08*i*i),1.38,z);pane.castShadow=false;box(.04,2.7,.04,brass,side*(3.4-.08*i*i),1.38,z-.32);}
// Laboratory: worktop, instrument, specimen rack and measuring station.
box(4.5,.86,.85,mint,-9.4,.45,-8.8);box(4.6,.12,.95,white,-9.4,.94,-8.8);
box(.65,.09,.48,dark,-9.8,1.04,-8.7);rod([-9.8,1.09,-8.8],[-9.8,1.56,-8.8],.06,white);rod([-9.8,1.56,-8.8],[-9.55,1.74,-8.8],.09,dark);box(.36,.05,.32,stone,-9.6,1.3,-8.7);
box(.74,.06,.3,wood,-8.8,1.05,-8.75);for(let i=0;i<6;i++){cyl(.035,.035,.24,glass,-9.05+i*.1,1.2,-8.75);cyl(.04,.04,.045,blue,-9.05+i*.1,1.34,-8.75);}
box(.7,.65,.48,white,-10.9,1.3,-8.85);box(.43,.29,.02,blue,-10.9,1.36,-8.595);
// Nutrition kitchen: preparation island, fruit, jars, sink and herb pots.
box(4.5,.86,.85,woodLight,9.2,.45,-8.8);box(4.6,.12,.95,stone,9.2,.94,-8.8);
box(.75,.025,.49,dark,10.5,1.01,-8.75);rod([10.7,1,-8.98],[10.7,1.4,-8.98],.025,brass);rod([10.7,1.4,-8.98],[10.7,1.4,-8.75],.025,brass);
cyl(.27,.18,.14,white,8.5,1.08,-8.65);for(let i=0;i<5;i++)ell(i%2?yellow:pink,8.32+i*.085,1.21+(i%2)*.07,-8.65,.09,.08,.08);
for(let i=0;i<3;i++){cyl(.11,.11,.3,glass,7.5+i*.3,1.17,-8.8);cyl(.12,.12,.04,wood,7.5+i*.3,1.34,-8.8);}plant(11.05,1,-8.8,.48);
// Movement studio with treadmills, yoga mats and a strength rack.
box(6.4,.04,6.1,rubber,-9.3,.04,5.55);label('HAREKET / TOPARLANMA',-9.3,2.55,2.6,4.3,.4);
for(const x of [-11,-8.9]){box(1.15,.2,2.25,dark,x,.2,6.5);box(.83,.025,1.8,leather,x,.32,6.55);for(const xx of [-.48,.48]){rod([x+xx,.3,5.55],[x+xx,1.3,5.4],.035,stone);rod([x+xx,1.3,5.4],[x+xx,1.05,6],.035,dark);}box(.94,.13,.42,dark,x,1.37,5.37);box(.38,.015,.23,blue,x,1.445,5.4);}
for(const z of [4.3,7.5])box(1.3,.04,2.2,z<5?mint:lilac,-6.6,.12,z,room,.018);
rod([-12.2,.4,3.5],[-10,.4,3.5],.045,stone);rod([-12.2,.9,3.5],[-10,.9,3.5],.045,stone);for(let i=0;i<5;i++){const x=-12+i*.43;rod([x,.94,3.28],[x,.94,3.7],.03,brass);for(const z of [3.3,3.68]){const w=cyl(.105,.105,.11,dark,x,.94,z);w.rotation.x=Math.PI/2;}}
ell(blue,-11.8,.48,8.4,.45,.45,.45);plant(-12.25,0,.8,1.6);
// Archive room on the east wing. The entry faces the court, not the director.
box(5.7,.035,3.4,stone,9.4,.05,4.65);
const archiveWalls=[box(4.45,1.6,.12,plaster,10.175,.83,2.9),box(.35,1.6,.12,plaster,6.5,.83,2.9),box(.12,1.6,3.5,plaster,12.4,.83,4.65)];
for(const x of [6.68,7.93])box(.045,2.35,.10,brass,x,1.2,2.9);box(1.3,.065,.10,brass,7.3,2.4,2.9);
const archive=new T.Group();archive.position.set(11.9,0,4.7);archive.rotation.y=-Math.PI/2;room.add(archive);
for(const cx of [-.85,.85]){box(1.5,2.3,.6,woodLight,cx,1.2,0,archive);for(const yy of [.35,1.1,1.9])box(1.42,.06,.63,white,cx,yy,.05,archive);for(let j=0;j<7;j++){const xx=cx-.56+j*.18;const b=box(.14,.59,.3,[mint,cream,blue,walnut][j%4],xx,1.43,.2,archive,.01);const tag=box(.075,.17,.012,white,xx,1.53,.358,archive,.003);b.userData.tags=[tag];archiveFiles.push(b);}}
label('ARŞİV / SAĞLIK EKONOMİSİ',9.45,1.45,2.98,4.7,.35);
// Separate, quiet lounge, with phone conversations in ordinary armchairs.
box(6.3,.035,2.5,mat('#b8c4b3'),9.25,.04,8.05);
const loungeSeats=[{x:8.35,z:8,a:Math.PI/2},{x:10.45,z:8,a:Math.PI/2}];
function chair(s,p=room){const c=new T.Group();c.position.set(s.x,0,s.z);c.rotation.y=s.a;p.add(c);box(.79,.16,.72,mint,0,.55,0,c);box(.86,.62,.14,leather,0,.89,.32,c);for(const x of [-.43,.43]){box(.14,.33,.8,leather,x,.68,0,c);for(const z of [-.25,.27])cyl(.024,.026,.34,brass,x,.23,z,c);}return c;}
loungeSeats.forEach(s=>chair(s));cyl(.4,.4,.06,wood,9.4,.55,8);cyl(.12,.18,.48,brass,9.4,.29,8);plant(12,0,8.5,1.2);label('DİNLENME',10,1.7,9.1,2.5,.38).rotation.y=Math.PI;
// Five equal meeting seats; physical furniture carries no fabricated metrics.
cyl(1.45,1.45,.13,walnut,0,.95,8.4,meetingRoom);cyl(.5,.64,.9,leather,0,.46,8.4,meetingRoom);
const seats=Array.from({length:5},(_,i)=>{const a=Math.PI+i*Math.PI*2/5;return{x:Math.sin(a)*2.25,z:8.4+Math.cos(a)*2.25,a};});
for(const s of seats){chair(s,meetingRoom);const x=Math.sin(s.a)*1.05,z=8.4+Math.cos(s.a)*1.05;box(.3,.025,.38,cream,x,1.03,z,meetingRoom);cyl(.055,.05,.12,white,x+.25,1.09,z,meetingRoom);}
for(const p of [[-4.6,-8.8],[4.6,-8.8],[-5.9,8.7],[5.9,8.7]])plant(p[0],0,p[1],1.1);

const staff=[],deskGroups=[];
const outfits=[white,mint,blue,lilac,yellow],skins=[mat('#e7b48e'),mat('#b98060'),mat('#f0c7a8'),mat('#cd9875'),mat('#e9b99b'),mat('#cc9670')],hair=[mat('#65504b'),mat('#383e47'),mat('#a87950'),mat('#4d454b'),mat('#b68c60'),mat('#3f3836')];
function desk(x,z,angle,index,boss=false){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;room.add(g);deskGroups.push(g);g.userData.kind=boss?'executive-desk':'desk';
box(boss?3.25:2.4,.13,boss?1.3:1.1,boss?walnut:white,0,.94,0,g,.06);
if(boss){box(2.9,.48,.065,walnut,0,.66,-.46,g);box(1.4,.018,.62,leather,-.12,1.014,.02,g,.007);box(.8,.66,1.22,walnut,1.12,.58,0,g);box(.8,.055,1.25,brass,1.12,.91,0,g,.01);const sign=label('PATRON',-.75,1.13,-.565,.68,.17,g);sign.rotation.y=Math.PI;box(.72,.19,.04,brass,-.75,1.13,-.53,g,.008);}
for(const dx of [-.83,.83])for(const dz of [-.34,.34])box(.09,.88,.09,cream,dx,.46,dz,g,.025);
box(.43,.59,.71,index%2?mint:cream,.67,.6,.04,g);for(let j=0;j<2;j++){box(.34,.025,.035,wood,.67,.51+j*.22,.41,g);}
// Screens face each employee seated on the positive local z side.
cyl(.19,.19,.035,dark,-.16,1.03,-.17,g);box(.055,.32,.05,dark,-.16,1.17,-.2,g);
box(.89,.56,.065,dark,-.16,1.48,-.23,g,.04);const sm=mat('#b9d8d6',{emissive:'#a5cecc',emissiveIntensity:.35});box(.79,.45,.013,sm,-.16,1.48,-.188,g,.015);
box(.18,.31,.009,index%2?lilac:blue,-.405,1.49,-.177,g,.005);for(let l=0;l<4;l++)box(.34-(l%2)*.12,.021,.01,white,-.06,1.62-l*.075,-.175,g,.004);
box(.67,.035,.23,cream,-.14,1.025,.27,g,.035);for(let a=0;a<3;a++)for(let b=0;b<9;b++)box(.041,.006,.027,wood,-.4+b*.064,1.046,.2+a*.063,g,.003);
ell(white,.39,1.05,.3,.068,.029,.094,g);
cyl(.075,.065,.16,index%2?pink:yellow,-.77,1.075,.25,g);const handle=mesh(new T.TorusGeometry(.055,.014,6,12),index%2?pink:yellow,-.685,1.095,.25,g);handle.rotation.x=Math.PI/2;
box(.23,.035,.31,index%2?blue:lilac,.72,1.025,-.16,g,.014);box(.21,.012,.285,white,.72,1.044,-.16,g,.008);plant(-.8,1.01,-.28,.24,g);
// Soft swivel chair and a little, individually styled colleague.
cyl(.055,.065,.48,dark,0,.3,1.04,g);for(let k=0;k<5;k++){const a=k*Math.PI*2/5;rod([0,.13,1.04],[Math.cos(a)*.34,.13,1.04+Math.sin(a)*.34],.027,dark,g);ell(dark,Math.cos(a)*.34,.09,1.04+Math.sin(a)*.34,.055,.06,.055,g);}
box(.62,.14,.61,boss?leather:outfits[index],0,.55,1.02,g,.065);box(.64,boss?1.08:.58,.12,boss?leather:outfits[index],0,boss?1.1:.91,1.33,g,.06);
if(boss){for(const dx of [-.37,.37])box(.1,.08,.44,leather,dx,.88,1.03,g,.038);}
const person=new T.Group();g.add(person);person.userData.kind=boss?'boss':'employee';
const shirt=boss?dark:outfits[index];
const torso=mesh(new T.CylinderGeometry(.225,.177,.49,12),shirt,0,1.035,1.025,person);torso.scale.z=.67;
ell(shirt,0,.795,1.04,.182,.13,.135,person);box(.34,.035,.245,dark,0,.76,1.035,person,.012);
cyl(.063,.069,.15,skins[index],0,1.35,1.018,person);
for(const side of [-1,1]){const collar=box(.074,.095,.019,white,side*.052,1.269,.864,person,.008);collar.rotation.z=side*.35;}
box(.018,.38,.01,boss?white:cream,0,1.03,.866,person,.004);
for(let k=0;k<3;k++)ell(brass,0,.9+k*.092,.858,.009,.009,.006,person);
if(boss){box(.038,.235,.021,brass,0,1.145,.843,person,.008);for(const side of [-1,1]){const lapel=box(.075,.27,.021,leather,side*.11,1.13,.864,person,.01);lapel.rotation.z=-side*.3;}}
const seatedLegs=new T.Group(),standingLegs=new T.Group();person.add(seatedLegs,standingLegs);standingLegs.visible=false;
for(const side of [-1,1]){rod([side*.12,.67,1.04],[side*.13,.59,.62],.076,dark,seatedLegs);ell(dark,side*.13,.59,.62,.08,.085,.08,seatedLegs);rod([side*.13,.57,.62],[side*.13,.14,.66],.063,dark,seatedLegs);ell(boss?walnut:cream,side*.13,.095,.585,.075,.065,.145,seatedLegs);rod([side*.12,.68,1.025],[side*.13,.19,1.015],.075,dark,standingLegs);rod([side*.13,.19,1.015],[side*.15,-.22,.99],.062,dark,standingLegs);ell(cream,side*.15,-.268,.925,.075,.052,.15,standingLegs);}
const head=new T.Group();head.position.set(0,1.535,1.01);person.add(head);ell(skins[index],0,0,0,.151,.202,.157,head);ell(skins[index],0,-.1,-.033,.112,.103,.118,head);
const cap=mesh(new T.SphereGeometry(1,24,16,0,Math.PI*2,0,Math.PI*.57),hair[index],0,.047,.018,head);cap.scale.set(.157,.173,.157);
for(const side of [-1,1]){ell(skins[index],side*.15,-.012,.006,.025,.046,.027,head);ell(white,side*.055,.011,-.143,.027,.012,.012,head);ell(dark,side*.055,.009,-.154,.010,.011,.005,head);rod([side*.033,.043,-.146],[side*.076,.041,-.135],.008,hair[index],head);}
ell(skins[index],0,-.025,-.157,.025,.045,.028,head);rod([-.03,-.083,-.138],[.03,-.083,-.138],.006,pink,head);
if(index===0||index===3){ell(hair[index],0,-.015,.13,.146,.2,.065,head);ell(hair[index],.08,.11,.151,.072,.072,.074,head);}
if(index===1||boss){for(const side of [-1,1]){const lens=mesh(new T.TorusGeometry(.042,.005,6,20),dark,side*.054,.011,-.16,head);lens.scale.y=.72;}rod([-.014,.012,-.16],[.014,.012,-.16],.005,dark,head);}
if(index===2){const band=mesh(new T.TorusGeometry(.174,.016,8,24,Math.PI),dark,0,.015,0,head);for(const side of [-1,1])ell(dark,side*.158,0,0,.026,.047,.04,head);}
const hands=[],typingArms=new T.Group(),phoneArms=new T.Group();person.add(typingArms,phoneArms);phoneArms.visible=false;
for(const side of [-1,1]){rod([side*.21,1.22,1.015],[side*.28,1.03,.74],.062,shirt,typingArms);ell(shirt,side*.28,1.03,.74,.064,.064,.064,typingArms);rod([side*.28,1.03,.74],[side*.18,1.066,.43],.043,skins[index],typingArms);const palm=ell(skins[index],side*.18,1.072,.395,.043,.024,.065,typingArms);hands.push(palm);for(let f=0;f<4;f++)rod([side*.18-.024+f*.015,1.072,.367],[side*.18-.024+f*.015,1.07,.315],.008,skins[index],typingArms);}
rod([-.21,1.22,1.015],[-.28,.96,1.04],.062,shirt,phoneArms);rod([-.28,.96,1.04],[-.21,.73,.94],.043,skins[index],phoneArms);ell(skins[index],-.21,.72,.93,.043,.067,.03,phoneArms);
rod([.21,1.22,1.015],[.37,1.02,.99],.062,shirt,phoneArms);rod([.37,1.02,.99],[.21,1.51,.99],.043,skins[index],phoneArms);ell(skins[index],.20,1.51,.97,.033,.067,.04,phoneArms);box(.026,.18,.087,dark,.177,1.53,.969,phoneArms,.012);
staff.push({person,home:g,head,hands,index,seatedLegs,standingLegs,typingArms,phoneArms});
}
desk(-8.8,-6.2,0,0);desk(8.7,-6.2,0,1);desk(-9.2,.8,Math.PI/2,2);desk(9.3,.8,-Math.PI/2,3);desk(0,-6.5,0,4,true);
// Local lights and task lamps use the same palette as the campus.
const lampGlow=mat('#f0deba',{emissive:'#f1d49c',emissiveIntensity:.45});
for(const g of deskGroups){cyl(.12,.12,.025,brass,.92,1.03,-.33,g);rod([.92,1.04,-.33],[.92,1.65,-.33],.018,brass,g);rod([.92,1.65,-.33],[.67,1.65,-.33],.018,brass,g);mesh(new T.ConeGeometry(.14,.15,24),dark,.67,1.63,-.33,g);}
const hemi=new T.HemisphereLight('#e1eff6','#958266',1.28);scene.add(hemi);const sun=new T.DirectionalLight('#fff0d5',2.8);sun.position.set(-7,14,8);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-21,right:21,top:19,bottom:-19});sun.shadow.normalBias=.008;sun.shadow.bias=-.00008;sun.shadow.radius=4;scene.add(sun);const fill=new T.DirectionalLight('#b9d9dc',1.05);fill.position.set(7,7,-6);scene.add(fill);
const warmLights=[],lightPools=[],lightSource=mat('#fff0cd',{emissive:'#ffd590',emissiveIntensity:.6});
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gx=glowCanvas.getContext('2d'),gg=gx.createRadialGradient(64,64,2,64,64,64);gg.addColorStop(0,'rgba(255,218,146,.52)');gg.addColorStop(.4,'rgba(255,199,109,.22)');gg.addColorStop(1,'rgba(255,192,93,0)');gx.fillStyle=gg;gx.fillRect(0,0,128,128);const glowTexture=new T.CanvasTexture(glowCanvas);glowTexture.colorSpace=T.SRGBColorSpace;
function lightPool(x,y,z,w,d,parent=room){const m=new T.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});const o=mesh(new T.PlaneGeometry(w,d),m,x,y,z,parent);o.rotation.x=-Math.PI/2;o.castShadow=false;lightPools.push(m);}
for(const g of deskGroups){cyl(.108,.108,.015,lightSource,.67,1.563,-.33,g);lightPool(.55,1.004,-.23,1.9,1.25,g);}
for(const [x,z,power] of [[-9,-6,30],[9,-6,30],[0,-6,24],[-9,5,24],[9,6,26],[0,8.4,30]]){const l=new T.PointLight('#ffd9a0',0,11,2);l.position.set(x,3.25,z);l.userData.power=power;room.add(l);warmLights.push(l);lightPool(x,.084,z,5.7,4.8);}
for(const [x,z,w] of [[-9,-6,2.6],[9,-6,2.6],[0,-6,2.6]]){box(w,.10,.2,brass,x,3.47,z);box(w-.08,.025,.14,lightSource,x,3.409,z);for(const dx of [-w*.34,w*.34])rod([x+dx,3.53,z],[x+dx,3.88,z],.009,dark);}
let nightMode=false,nightBlend=0,hostDark=matchMedia('(prefers-color-scheme: dark)').matches;
const nightBtn=root.querySelector('[data-night]'),daySun=new T.Color('#fff0d5'),moonSun=new T.Color('#9bb7ed'),daySky=new T.Color('#e1eff6'),nightSky=new T.Color('#8199c0');
function setNight(value){nightMode=value;nightBtn.textContent=value?'Gündüz görünümü':'Gece görünümü';nightBtn.setAttribute('aria-pressed',String(value));for(const w of windowViews){w.material.map=value?w.night:w.day;w.material.needsUpdate=true;}stage.style.background=value?'radial-gradient(ellipse at 50% 58%, rgba(33,53,84,.25), transparent 72%)':'';if(matchMedia('(prefers-reduced-motion: reduce)').matches)nightBlend=value?1:0;}
function lighting(dt){nightBlend+=(Number(nightMode)-nightBlend)*(1-Math.exp(-dt*3.8));const n=nightBlend;sun.intensity=2.8*(1-n)+.34*n;sun.color.copy(daySun).lerp(moonSun,n);hemi.intensity=(hostDark?1.12:1.28)*(1-n)+.46*n;hemi.color.copy(daySky).lerp(nightSky,n);fill.intensity=1.05*(1-n)+.3*n;renderer.toneMappingExposure=(hostDark?.91:1.02)*(1-n)+1.05*n;strip.emissiveIntensity=.65+n*2.8;lampGlow.emissiveIntensity=.45+n*1.4;lightSource.emissiveIntensity=.6+n*2;for(const l of warmLights)l.intensity=l.userData.power*n;for(const m of lightPools)m.opacity=n*.62;}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',e=>hostDark=e.matches);
const phoneAnchor=new T.Group();phoneAnchor.position.set(10.45,0,8);phoneAnchor.rotation.y=Math.PI/2;room.add(phoneAnchor);
let az=.44,el=.83,zoom=1,panX=0,panZ=0,view='angle',onCall=false,showWalls=true,moving=!matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,last=0,motionDt=.016,meetingState='idle',mission=null,autoMode=false,followActor=false,speed=1,idleClock=0,taskSerial=0;
const angleBtn=root.querySelector('[data-view="angle"]'),topBtn=root.querySelector('[data-view="top"]'),bossBtn=root.querySelector('[data-boss]'),archiveBtn=root.querySelector('[data-area="archive"]'),phoneBtn=root.querySelector('[data-area="phone"]'),meetingViewBtn=root.querySelector('[data-area="meeting"]'),callCheck=root.querySelector('[data-call]'),wallsCheck=root.querySelector('[data-walls]'),motionBtn=root.querySelector('[data-motion]'),meetingBtn=root.querySelector('[data-meeting]'),status=root.querySelector('[data-status]');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const actorSelect=root.querySelector('[data-actor]'),jobSelect=root.querySelector('[data-job]'),recipientSelect=root.querySelector('[data-recipient]'),speedSelect=root.querySelector('[data-speed]'),runBtn=root.querySelector('[data-run]'),autoCheck=root.querySelector('[data-auto]'),followCheck=root.querySelector('[data-follow]');
const names=(o.adlar&&o.adlar.length===5)?o.adlar.map(String):['Kerem','Nesrin','Barış','Sedef','Patron'];
for(const s of staff){s.person.name=s.index===4?'boss':'employee-'+(s.index+1);s.home.name='desk-'+(s.index+1);s.walkArms=new T.Group();s.person.add(s.walkArms);s.walkArms.visible=false;s.legPivots=[];const parts=[...s.standingLegs.children];for(let k=0;k<2;k++){const pivot=new T.Group();pivot.position.set(0,.68,1.025);s.standingLegs.add(pivot);for(const p of parts.slice(k*3,k*3+3)){p.position.y-=.68;p.position.z-=1.025;pivot.add(p);}s.legPivots.push(pivot);const side=k?1:-1;rod([side*.21,1.21,1.015],[side*.26,.94,1.04],.062,s.index===4?dark:outfits[s.index],s.walkArms);rod([side*.26,.94,1.04],[side*.23,.74,1.01],.043,skins[s.index],s.walkArms);ell(skins[s.index],side*.23,.72,1.01,.035,.065,.03,s.walkArms);}}
for(const s of staff){s.armPivots=[];s.gait=0;for(const hip of s.legPivots){const lower=[...hip.children].slice(1),knee=new T.Group();knee.position.set(0,-.49,-.01);hip.add(knee);for(const part of lower){part.position.y+=.49;part.position.z+=.01;knee.add(part);}hip.userData.knee=knee;}const arms=[...s.walkArms.children];for(let i=0;i<2;i++){const pivot=new T.Group();pivot.position.set(i?.21:-.21,1.21,1.015);s.walkArms.add(pivot);for(const part of arms.slice(i*3,i*3+3)){part.position.x-=pivot.position.x;part.position.y-=pivot.position.y;part.position.z-=pivot.position.z;pivot.add(part);}s.armPivots.push(pivot);}}
function gait(s,phase){s.gait=phase;s.walkStamp=time;}
function pose(s,kind){s.poseKind=kind;s.standing=['walk','carry','search'].includes(kind);s.seatedLegs.visible=false;s.standingLegs.visible=true;s.walkArms.visible=kind==='walk';s.typingArms.visible=kind==='desk'||kind==='meeting';s.phoneArms.visible=kind==='phone';if(s.carryArms)s.carryArms.visible=kind==='carry'||kind==='search';}
function animatePerson(s,dt){const target=s.standing?1:0,walking=s.standing&&time-(s.walkStamp??-10)<.09;s.posture+=(target-s.posture)*(1-Math.exp(-dt*7));s.stride+=(Number(walking)-s.stride)*(1-Math.exp(-dt*9));const t=s.posture,phase=s.gait;s.visual.position.y=(t-target)*.32;s.visual.rotation.x=Math.sin(t*Math.PI)*.06;s.visual.rotation.z=Math.sin(phase)*.013*s.stride;s.legPivots.forEach((p,i)=>{const a=phase+i*Math.PI;p.rotation.x=(1-t)*1.36+Math.sin(a)*.35*t*s.stride;p.userData.knee.rotation.x=(1-t)*-1.4+Math.max(0,-Math.sin(a))*.55*t*s.stride;});s.armPivots.forEach((p,i)=>p.rotation.x=-Math.sin(phase+i*Math.PI)*.23*s.stride);s.head.rotation.z=Math.sin(time*.75+s.index)*.017;s.head.rotation.y=Math.sin(time*.4+s.index)*.04+(s.poseKind==='meeting'?Math.sin(time*.55+s.index)*.1:0);s.head.position.y=s.head.userData.restY+Math.sin(time*1.8+s.index)*.004;s.hands.forEach((h,j)=>h.position.y=1.072+Math.max(0,Math.sin(time*(6.1+s.index*.22)+s.index+j*2))*.009);}
function callPose(){if(meetingState!=='idle'||mission)return;const s=staff[3];(onCall?phoneAnchor:s.home).add(s.person);s.person.position.set(0,0,onCall?-1.01:0);s.person.rotation.set(0,0,0);pose(s,onCall?'phone':'desk');callCheck.checked=onCall;}
function controls(){for(const [v,b] of [['angle',angleBtn],['top',topBtn],['boss',bossBtn],['archive',archiveBtn],['phone',phoneBtn],['meeting',meetingViewBtn]])b.setAttribute('aria-pressed',String(view===v));motionBtn.textContent=moving?'Hareketi durdur':'Hareketi başlat';motionBtn.setAttribute('aria-pressed',String(moving));wallsCheck.checked=showWalls;const busy=meetingState!=='idle'||!!mission;callCheck.disabled=busy;runBtn.disabled=busy||autoMode;actorSelect.disabled=busy;jobSelect.disabled=busy;recipientSelect.disabled=busy||jobSelect.value!=='deliver';meetingBtn.disabled=!!mission||meetingState==='walking'||meetingState==='returning';meetingBtn.textContent=meetingState==='idle'?'Toplantıyı başlat':meetingState==='walking'?'Ekip toplantıya gidiyor…':meetingState==='returning'?'Ekip geri dönüyor…':'Toplantıyı bitir';}
function save(){if(o.kaydet)try{o.kaydet({modelContent:{scene:'spi-health-campus',view,nightMode,onCall,meeting:meetingState,task:mission?mission.type:null,actor:mission?names[mission.actor.index]:null,employees:4,boss:1},privateContent:{az,el,zoom,panX,panZ,moving,showWalls,speed,followActor}});}catch(e){}}
function restore(s){if(s?.modelContent?.scene!=='spi-health-campus')return;const p=s.privateContent||{};setNight(s.modelContent.nightMode===true);view=['top','boss','archive','phone','meeting'].includes(s.modelContent.view)?s.modelContent.view:'angle';if(typeof s.modelContent.onCall==='boolean')onCall=s.modelContent.onCall;for(const key of ['az','el','zoom','panX','panZ'])if(!Number.isFinite(p[key]))p[key]=({az:.44,el:.83,zoom:1,panX:0,panZ:0})[key];az=p.az;el=clamp(p.el,.10,1.565);zoom=clamp(p.zoom,.4,5);panX=clamp(p.panX,-30,30);panZ=clamp(p.panZ,-30,30);if(typeof p.moving==='boolean')moving=p.moving;if(typeof p.showWalls==='boolean')showWalls=p.showWalls;if([1,2,4].includes(p.speed))speed=p.speed;if(typeof p.followActor==='boolean')followActor=p.followActor;speedSelect.value=String(speed);followCheck.checked=followActor;controls();callPose();}
function preset(v,a,e){view=v;az=a;el=e;zoom=1;panX=panZ=0;controls();save();}
angleBtn.onclick=()=>preset('angle',.44,.83);topBtn.onclick=()=>preset('top',0,1.565);bossBtn.onclick=()=>preset('boss',.28,.83);archiveBtn.onclick=()=>preset('archive',.68,.78);phoneBtn.onclick=()=>preset('phone',.2,.71);meetingViewBtn.onclick=()=>preset('meeting',.3,.92);
for(const b of root.querySelectorAll('[data-zoom]'))b.onclick=()=>{zoom=clamp(zoom*(b.dataset.zoom==='in'?1.3:1/1.3),.4,5);save();};for(const b of root.querySelectorAll('[data-turn]'))b.onclick=()=>{az+=(b.dataset.turn==='left'?-1:1)*Math.PI/6;save();};
nightBtn.onclick=()=>{setNight(!nightMode);save();};
motionBtn.onclick=()=>{moving=!moving;controls();save();};wallsCheck.onchange=()=>{showWalls=wallsCheck.checked;save();};callCheck.onchange=()=>{onCall=callCheck.checked;callPose();save();status.textContent=onCall?'Temsili: Çalışan dinlenme koltuğunda telefonla görüşüyor.':'Çalışan kendi masasına döndü.';};
function place(s,x,z,a,y=.32,smooth=false){room.add(s.person);const old=s.person.rotation.y;if(smooth)a=old+Math.atan2(Math.sin(a-old),Math.cos(a-old))*(1-Math.exp(-motionDt*10));s.person.rotation.set(0,a,0);s.person.position.set(x-Math.sin(a)*1.01,y,z-Math.cos(a)*1.01);}
function startMeeting(){
 meetingState='walking';autoMode=false;autoCheck.checked=false;moving=true;room.updateMatrixWorld(true);
 staff.forEach((s,i)=>{const w=bodyPosition(s),seat=seats[i];
 const exit=i===3&&onCall?[[...w],[6.7,8],[4.7,5.4],[4.7,-2.4],hub]:homeExit(i);
 const points=joinRoute(exit,[hub,[-4.7,-2.4],[-4.7,4.8],[0,5.4]]);
 for(let a=Math.PI+.15;a<seat.a;a+=.15)points.push([Math.sin(a)*3,8.4+Math.cos(a)*3]);
 points.push([Math.sin(seat.a)*3,8.4+Math.cos(seat.a)*3],[seat.x,seat.z]);
 s.route=softenRoute(points);s.segment=0;s.delay=i*.9;s.routeBack=s.route.slice().reverse();pose(s,'walk');place(s,...w,0);
 });status.textContent='Temsili: Beş kişi toplantı pavyonuna yürüyor.';controls();save();
}
meetingBtn.onclick=()=>{if(mission)return;if(meetingState==='idle')startMeeting();else if(meetingState==='seated'){meetingState='returning';moving=true;staff.forEach((s,i)=>{s.route=s.routeBack;s.segment=0;s.delay=(staff.length-1-i)*.7;pose(s,'walk');const seat=seats[i];place(s,seat.x,seat.z,seat.a);});status.textContent='Toplantı bitti; ekip çalışma alanlarına dönüyor.';controls();save();}};
function updateMeeting(dt){if(!['walking','returning'].includes(meetingState))return;let done=0;for(const s of staff){if(s.delay>0){s.delay-=dt;continue;}if(s.segment>=s.route.length-1){done++;continue;}const target=s.route[s.segment+1];const current=s.person.localToWorld(new T.Vector3(0,0,1.01)),dx=target[0]-current.x,dz=target[1]-current.z,d=Math.hypot(dx,dz),step=dt*1.75;if(d<=step){place(s,...target,s.person.rotation.y);s.segment++;if(s.segment===s.route.length-1){if(meetingState==='walking'){const seat=seats[s.index];place(s,seat.x,seat.z,seat.a,0);pose(s,'meeting');}else{s.home.add(s.person);s.person.position.set(0,0,0);s.person.rotation.set(0,0,0);pose(s,'desk');}}}else{place(s,current.x+dx/d*step,current.z+dz/d*step,Math.atan2(-dx,-dz),.32+Math.abs(Math.sin(s.gait))*.014,true);gait(s,s.gait+step*4.5);}s.person.updateMatrixWorld(true);}if(done===staff.length){meetingState=meetingState==='walking'?'seated':'idle';if(meetingState==='idle')callPose();status.textContent=meetingState==='seated'?'Toplantı başladı. Beş kişi masada.':'Ekip çalışma alanlarına döndü.';controls();save();if(o.bitti)try{o.bitti({tur:'toplanti',durum:meetingState});}catch(e){}}}
function documentModel(parent){const g=new T.Group();parent.add(g);box(.35,.045,.46,brass,0,0,0,g,.012);box(.313,.021,.414,white,0,.033,0,g,.006);box(.1,.012,.03,leather,-.085,.048,-.15,g,.003);for(let k=0;k<4;k++)box(.24-k%2*.065,.009,.012,blue,-.015,.049,-.065+k*.048,g,.003);return g;}
for(const s of staff){s.carryArms=new T.Group();s.person.add(s.carryArms);s.carryArms.visible=false;for(const side of [-1,1]){rod([side*.21,1.21,1.015],[side*.24,1.035,.79],.062,s.index===4?dark:outfits[s.index],s.carryArms);rod([side*.24,1.035,.79],[side*.13,1.06,.59],.043,skins[s.index],s.carryArms);ell(skins[s.index],side*.13,1.058,.575,.039,.024,.066,s.carryArms);}s.document=documentModel(s.person);s.document.position.set(0,1.075,.55);s.document.visible=false;s.tray=documentModel(s.home);s.tray.position.set(s.index===4?0:.85,1.035,s.index===4?-.55:.12);s.tray.visible=false;const nameTag=label(names[s.index],0,1.14,-.52,.65,.16,s.home);nameTag.rotation.y=Math.PI;const children=[...s.person.children];s.visual=new T.Group();s.person.add(s.visual);for(const child of children)s.visual.add(child);s.posture=0;s.stride=0;s.head.userData.restY=s.head.position.y;pose(s,'desk');animatePerson(s,0);}
function slideDocument(m,destination,progress){const s=m.actor;if(!m.paperFlight){room.updateMatrixWorld(true);room.attach(s.document);m.paperFlight={from:s.document.position.clone(),to:destination.getWorldPosition(new T.Vector3()),rotation:s.document.quaternion.clone(),endRotation:destination.getWorldQuaternion(new T.Quaternion())};}const f=m.paperFlight,t=clamp(progress,0,1),u=t*t*(3-2*t);s.document.position.copy(f.from).lerp(f.to,u);s.document.position.y+=Math.sin(t*Math.PI)*.14;s.document.quaternion.copy(f.rotation).slerp(f.endRotation,u);if(t>=1){s.document.visible=false;destination.visible=true;}}
function resetDocument(s){s.visual.add(s.document);s.document.position.set(0,1.075,.55);s.document.rotation.set(0,0,0);}
// Reusable routes keep each task in the corridors and through the archive doorway.
const hub=[0,-2.4];
function bodyPosition(s){const v=s.person.localToWorld(new T.Vector3(0,0,1.01));return [v.x,v.z];}
function homeExit(i){const s=staff[i],p=s.home.localToWorld(new T.Vector3(0,0,1.01));const x=i===4?2.4:i===0?-6:i===1?6:i===2?-4.7:4.7;return [[p.x,p.z],[x,p.z],[x,-2.4],hub];}
function recipientPath(i){if(i===2)return [hub,[-4.7,-2.4],[-4.7,.8],[-7.6,.8]];if(i===3)return [hub,[4.7,-2.4],[4.7,.8],[7.7,.8]];const x=staff[i].home.position.x+1.6,z=staff[i].home.position.z+.18;return [hub,[x,-2.4],[x,z]];}
const archivePath=[hub,[4.7,-2.4],[4.7,1.9],[7,1.9],[7,4.7],[10.8,4.7]];
const loungePath=[hub,[4.7,-2.4],[4.7,5.4],[6.7,5.4],[6.7,8],[8.35,8]];
function softenRoute(points){if(points.length<3)return points;const result=[points[0]];for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],d1=Math.hypot(b[0]-a[0],b[1]-a[1]),d2=Math.hypot(c[0]-b[0],c[1]-b[1]);if(d1<.03||d2<.03){result.push(b);continue;}const r=Math.min(.19,d1*.2,d2*.2),p=[b[0]-(b[0]-a[0])/d1*r,b[1]-(b[1]-a[1])/d1*r],q=[b[0]+(c[0]-b[0])/d2*r,b[1]+(c[1]-b[1])/d2*r];result.push(p);for(const t of [.33,.67,1])result.push([(1-t)**2*p[0]+2*(1-t)*t*b[0]+t*t*q[0],(1-t)**2*p[1]+2*(1-t)*t*b[1]+t*t*q[1]]);}result.push(points.at(-1));return result;}
function joinRoute(...parts){const out=[];for(const p of parts.flat())if(!out.length||Math.hypot(p[0]-out.at(-1)[0],p[1]-out.at(-1)[1])>.025)out.push(p);return out;}
function message(t){status.textContent=(mission&&mission.temsili?'Temsili: ':'')+t;}
function newMission(type,i,target,temsili){if(mission||meetingState!=='idle')return false;if(!['deliver','archive','break'].includes(type)||!(Number.isInteger(i)&&i>=0&&i<staff.length)||(type==='deliver'&&!(Number.isInteger(target)&&target>=0&&target<staff.length)))return false;const s=staff[i];const availableFile=archiveFiles.findIndex(b=>b.visible!==false);if(type==='archive'&&availableFile<0){message('Arşivde alınacak dosya kalmadı.');return false;}if(type==='deliver'&&i===target){message('Gönderen ve alıcı için farklı kişileri seç.');return false;}if((i===3||target===3)&&onCall){onCall=false;callPose();}s.document.visible=false;s.carryArms.position.set(0,0,0);s.tray.visible=false;const exit=homeExit(i),back=exit.slice().reverse();const archiveRoute=archivePath.map(p=>p.slice());if(type==='archive'){const location=archiveFiles[availableFile].localToWorld(new T.Vector3());archiveRoute[archiveRoute.length-1]=[10.8,location.z];}const walk=(points,carry=false)=>({kind:'walk',points:softenRoute(points),carry});let steps;
if(type==='deliver'){const end=recipientPath(target);steps=[{kind:'prepare',duration:1.4},walk(joinRoute(exit,end),true),{kind:'deliver',duration:1.9,target},walk(joinRoute(end.slice().reverse(),back)),{kind:'home'}];}
else if(type==='archive'){steps=[walk(joinRoute(exit,archiveRoute)),{kind:'search',duration:3.2},walk(joinRoute(archiveRoute.slice().reverse(),back),true),{kind:'file',duration:1.4},{kind:'home'}];}
else{steps=[walk(joinRoute(exit,loungePath)),{kind:'relax',duration:7},walk(joinRoute(loungePath.slice().reverse(),back)),{kind:'home'}];}
mission={type,actor:s,target,fileIndex:availableFile,archiveRoute,steps,step:0,elapsed:0,entered:false,id:++taskSerial,temsili:!!temsili};moving=true;idleClock=0;controls();save();return true;}
function enterStep(m,step){const s=m.actor;m.entered=true;m.elapsed=0;m.took=false;if(step.kind==='walk'){m.segment=0;pose(s,step.carry?'carry':'walk');s.document.visible=step.carry;place(s,...step.points[0],s.person.rotation.y);message(names[s.index]+(step.carry?' dosyayı taşıyor.':m.step>=2?' masasına dönüyor.':m.type==='archive'?' arşiv odasına yürüyor.':m.type==='break'?' dinlenme alanına yürüyor.':' çalışma alanına dönüyor.'));}
else if(step.kind==='prepare'){pose(s,'desk');s.document.visible=true;message(names[s.index]+' belgeyi hazırlıyor → '+names[m.target]+'.');}
else if(step.kind==='deliver'){pose(s,'carry');const p=bodyPosition(s);place(s,...p,step.target===3?-Math.PI/2:Math.PI/2);staff[step.target].tray.visible=false;message(names[s.index]+' belgeyi '+names[step.target]+' adlı kişiye teslim ediyor.');}
else if(step.kind==='search'){pose(s,'search');place(s,...m.archiveRoute.at(-1),-Math.PI/2);s.document.visible=false;message(names[s.index]+' arşiv rafında dosya arıyor.');}
else if(step.kind==='relax'){pose(s,'phone');place(s,8.35,8,Math.PI/2,0);message(names[s.index]+' ayrı dinlenme salonunda mola veriyor.');}
else if(step.kind==='file'){s.home.add(s.person);s.person.position.set(0,0,0);s.person.rotation.set(0,0,0);pose(s,'desk');message(names[s.index]+' arşiv dosyasını kendi masasına bırakıyor.');}
else if(step.kind==='home'){s.home.add(s.person);s.person.position.set(0,0,0);s.person.rotation.set(0,0,0);pose(s,'desk');s.document.visible=false;s.carryArms.position.set(0,0,0);message(m.type==='deliver'?'Teslim tamamlandı: '+names[s.index]+' → '+names[m.target]+'.':m.type==='archive'?names[s.index]+' arşiv dosyasını aldı; dosya masasında.':names[s.index]+' moladan masasına döndü.');if(m.type==='archive'){const f=archiveFiles[m.fileIndex];f.visible=true;for(const t of f.userData.tags||[])t.visible=true;}const biten={tur:m.type,kim:s.index,kime:m.target,temsili:!!m.temsili};mission=null;idleClock=0;controls();save();if(o.bitti)try{o.bitti(biten);}catch(e){}}}
function updateMission(dt){if(!mission){if(autoMode&&meetingState==='idle'){idleClock+=dt;if(idleClock>3){const i=Math.floor(Math.random()*staff.length),r=Math.random(),type=r<.58?'deliver':r<.85&&archiveFiles.some(b=>b.visible!==false)?'archive':'break',target=(i+1+Math.floor(Math.random()*(staff.length-1)))%staff.length;newMission(type,i,target,true);}}return;}const m=mission,step=m.steps[m.step],s=m.actor;if(!m.entered)enterStep(m,step);if(!mission)return;m.elapsed+=dt;
if(step.kind==='walk'){const target=step.points[m.segment+1];if(!target){m.step++;m.entered=false;return;}const p=bodyPosition(s),dx=target[0]-p[0],dz=target[1]-p[1],d=Math.hypot(dx,dz),move=dt*1.7;if(d<=move){place(s,...target,s.person.rotation.y);m.segment++;}else{place(s,p[0]+dx/d*move,p[1]+dz/d*move,Math.atan2(-dx,-dz),.32+Math.abs(Math.sin(s.gait))*.014,true);gait(s,s.gait+move*4.5);}return;}
if(step.kind==='search'){const reach=Math.sin(clamp(m.elapsed/2.2,0,1)*Math.PI/2);s.carryArms.position.set(0,.13*reach,-.24*reach);s.document.position.set(0,1.075+.13*reach,.55-.24*reach);s.person.rotation.y=-Math.PI/2+Math.sin(m.elapsed*2)*.055;if(m.elapsed>2.3&&!m.took){m.took=true;const b=archiveFiles[m.fileIndex];b.visible=false;for(const t of b.userData.tags||[])t.visible=false;s.document.visible=true;message(names[s.index]+' klasörü raftan aldı.');}}
if(step.kind==='deliver'){const reach=Math.sin(clamp(m.elapsed/1.8,0,1)*Math.PI);s.carryArms.position.z=-.23*reach;if(m.elapsed<.6)s.document.position.z=.55-.23*reach;else slideDocument(m,staff[step.target].tray,(m.elapsed-.6)/.85);}
if(step.kind==='file'&&m.elapsed>.2)slideDocument(m,s.tray,(m.elapsed-.2)/.85);
if(m.elapsed>step.duration){s.carryArms.position.set(0,0,0);resetDocument(s);m.paperFlight=null;m.step++;m.entered=false;}}
function selectionChanged(){if(actorSelect.value===recipientSelect.value)recipientSelect.value=String((Number(actorSelect.value)+1)%staff.length);controls();}
actorSelect.onchange=selectionChanged;recipientSelect.onchange=selectionChanged;jobSelect.onchange=controls;runBtn.onclick=()=>newMission(jobSelect.value,Number(actorSelect.value),Number(recipientSelect.value),true);speedSelect.onchange=()=>{speed=Number(speedSelect.value);save();};followCheck.onchange=()=>{followActor=followCheck.checked;save();};autoCheck.onchange=()=>{autoMode=autoCheck.checked;idleClock=3;if(autoMode)moving=true;controls();message(autoMode?'Canlı ofis açık: belge, arşiv ve mola görevleri sırayla başlayacak.':mission?'Canlı ofis kapalı; mevcut görev tamamlanıyor.':'Canlı ofis durduruldu.');};
restore(o.durum||null);if(!o.durum&&typeof o.gece==='boolean')setNight(o.gece);controls();callPose();
const pointers=new Map();let spanNow=10;function pan(dx,dy){const scale=2*spanNow/stage.clientHeight;panX=clamp(panX+(-dx*Math.cos(az)+dy*Math.sin(az))*scale,-30,30);panZ=clamp(panZ+(dx*Math.sin(az)+dy*Math.cos(az))*scale,-30,30);}
stage.oncontextmenu=e=>e.preventDefault();stage.onpointerdown=e=>{tik={x:e.clientX,y:e.clientY,id:e.pointerId,n:pointers.size};pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey});stage.setPointerCapture(e.pointerId);};stage.onpointermove=e=>{const old=pointers.get(e.pointerId);if(!old)return;const before=[...pointers.values()];pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:old.pan});const after=[...pointers.values()];if(after.length>=2){const dist=a=>Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);zoom=clamp(zoom*dist(after)/Math.max(1,dist(before)),.4,5);pan((after[0].x+after[1].x-before[0].x-before[1].x)/2,(after[0].y+after[1].y-before[0].y-before[1].y)/2);}else if(old.pan||e.shiftKey)pan(e.clientX-old.x,e.clientY-old.y);else{az-=(e.clientX-old.x)*.006;el=clamp(el+(e.clientY-old.y)*.006,.10,1.565);} };stage.onpointerup=e=>{const t=tik;tik=null;pointers.delete(e.pointerId);save();if(t&&t.id===e.pointerId&&t.n===0&&Math.hypot(e.clientX-t.x,e.clientY-t.y)<6)sec(e);};stage.onpointercancel=e=>pointers.delete(e.pointerId);let wheelTimer;stage.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.0012),.4,5);clearTimeout(wheelTimer);wheelTimer=setTimeout(save,200);},{passive:false});
function cutaway(){for(const w of outerWalls)w.visible=showWalls&&(w.userData.side?camera.position.x*w.userData.side<169:camera.position.z>-10);for(const w of archiveWalls)w.visible=showWalls;for(const w of meetingGlass)w.visible=showWalls;}
function resize(){if(stage.clientWidth&&stage.clientHeight)renderer.setSize(stage.clientWidth,stage.clientHeight,false);}new ResizeObserver(resize).observe(stage);resize();
function followFocus(s){const p=bodyPosition(s);return [p[0],p[1],3.8,4.5];}
let cameraReady=false,cameraSpan=10;const cameraAim=new T.Vector3();
function frame(ms){if(!root.isConnected||document.hidden){calisiyor=false;return;}requestAnimationFrame(frame);if(!stage.clientWidth||!stage.clientHeight)return;if(!mission&&meetingState==='idle'&&!autoMode&&!pointers.size&&ms-sonCizim<48)return;sonCizim=ms;const dt=Math.min(Math.max(0,(ms-last)/1000),.04);last=ms;lighting(dt);motionDt=dt*speed;if(moving){time+=dt*speed;updateMeeting(dt*speed);updateMission(dt*speed);}const aspect=stage.clientWidth/stage.clientHeight,presets={boss:[0,-6,4.4,4.8],archive:[10,4.7,3.9,4],phone:[9.4,8,3.4,4],meeting:[0,8.4,4.5,5]},focus=followActor&&mission?[...followFocus(mission.actor)]:presets[view]||[0,.2,13.4,17.5],span=Math.max(focus[2],focus[3]/aspect)/zoom,tx=focus[0]+panX,tz=focus[1]+panZ;const ease=1-Math.exp(-dt*8);cameraSpan=cameraReady?cameraSpan+(span-cameraSpan)*ease:span;spanNow=cameraSpan;camera.left=-cameraSpan*aspect;camera.right=cameraSpan*aspect;camera.top=cameraSpan;camera.bottom=-cameraSpan;camera.updateProjectionMatrix();const goalPosition=new T.Vector3(tx+Math.sin(az)*Math.cos(el)*40,.7+Math.sin(el)*40,tz+Math.cos(az)*Math.cos(el)*40),goalAim=new T.Vector3(tx,.7,tz);if(!cameraReady){camera.position.copy(goalPosition);cameraAim.copy(goalAim);cameraReady=true;}else{camera.position.lerp(goalPosition,ease);cameraAim.lerp(goalAim,ease);}camera.lookAt(cameraAim);cutaway();for(const s of staff)animatePerson(s,moving?dt*speed:0);for(const c of curtains)c.rotation.z=Math.sin(time*.65+c.userData.phase)*.007;renderer.render(scene,camera);}
let calisiyor=false,sonCizim=0,tik=null;
function surdur(){if(calisiyor||!root.isConnected)return;calisiyor=true;last=performance.now();resize();requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)surdur();});
const ray=new T.Raycaster(),ndc=new T.Vector2();
function sec(e){if(!o.secildi)return;const r=stage.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);const hedef=[];for(const k of staff)hedef.push(k.person,k.home);for(const v of ray.intersectObjects(hedef,true)){let x=v.object;while(x){const k=staff.find(q=>q.person===x||q.home===x);if(k){try{o.secildi(k.index);}catch(err){}return;}x=x.parent;}}}
surdur();
return {ok:true,
  gorev(tur,i,j,temsili=false){return newMission(tur,i,j,temsili)===true;},
  toplanti(ac){if(mission)return false;if(ac&&meetingState==='idle'){startMeeting();return true;}if(!ac&&meetingState==='seated'){meetingBtn.onclick();return true;}return false;},
  gece(v){setNight(!!v);save();},
  koyu(v){hostDark=!!v;},
  hiz(n){if([1,2,4].includes(n)){speed=n;speedSelect.value=String(n);}},
  telefon(v){if(mission||meetingState!=='idle')return false;onCall=!!v;callPose();return true;},
  mesgul(){return !!mission||meetingState!=='idle';},
  konum(i){const k=staff[i];if(!k)return null;const v=k.person.localToWorld(new T.Vector3(0,1.1,1.0)).project(camera);return {x:(v.x+1)/2*stage.clientWidth,y:(1-v.y)/2*stage.clientHeight};},
  durum(){return {gorev:mission?{tur:mission.type,kim:mission.actor.index,kime:mission.target,temsili:!!mission.temsili}:null,toplanti:meetingState,gece:nightMode,hareket:moving,calisiyor,telefonda:staff[3].person.parent===phoneAnchor};},
  surdur};
}
window.SpiOfis3B={kur,SURUM:'0.160.1'};
})();
