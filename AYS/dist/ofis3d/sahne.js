/* ROTA 3B OFIS — STUDIO / 06 sahnesinin AYS uyarlamasi.

   Kaynak: studio-ofis-paketi (scene.js, sha256 9366c79a…). Sahne, isikler,
   karakterler ve gorev animasyonlari DEGISMEDI. Degisenler yalniz sinirlar:
     · kendi kendine kurulmaz: window.RotaOfis3B.kur(kok, secenek) -> api;
     · adlar AYS ajanlarindan gelir (Patron + bes uzman);
     · gorunum tercihi uygulamanin deposuna yazilir (secenek.kaydet);
     · cizim dongusu kok sayfadan ayrilinca ve sekme gizliyken DURUR,
       bostayken saniyede ~20 kare cizer (telefon pili);
     · dokunus surukleme degilse karakteri/masayi secer (secenek.secildi);
     · tuvale satir ici boyut yazilmaz (setSize(..., false)): kutunun boyunu
       CSS orani belirler, tuval onu izler;
     · «Canli ofis» ve elle verilen gorevler ekranda «Temsili:» diye
       yazilir: gercek bir olay olmadan dolasan belge gercekmis gibi sunulmaz;
     · gorev ve toplanti bitince secenek.bitti cagrilir.
   Sahne KARAR VERMEZ, veri okumaz, ag istegi yapmaz (AGENTS.md §1.3 istisnasi).
   Uyarlama bu dosyanin ilk surumunde yapildi; sonraki degisiklikler burada
   kucuk tutulur ve `git log` ile izlenir. */
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
box(25.4,.42,13.6,cream,2.5,-.23,0,room,.14);box(25,.08,13.2,dark,2.5,-.47,0,room,.02);
for(let row=0;row<21;row++){const z=-6.4+row*.64;for(let j=0;j<13;j++){const x=-9+j*1.92;box(1.9,.045,.621,(row+j)%5===0?wood:woodLight,x,.002,z,room,.01);}}
const back=box(25.4,3.9,.18,cream,2.5,1.91,-6.76,room,.045),left=box(.18,3.9,7.0,cream,-10.1,1.91,-3.3,room,.045);
box(25,.1,.10,walnut,2.5,.11,-6.63);box(.1,.1,6.9,walnut,-9.98,.11,-3.3);
// The lounge occupies its own western wing, far from the executive desk.
const lounge=new T.Group();lounge.name='lounge-wing';room.add(lounge);
box(7.1,.42,6.5,cream,-13.65,-.23,3.52,lounge,.14);box(6.95,.08,6.3,dark,-13.65,-.47,3.52,lounge,.02);
for(let r=0;r<10;r++)for(let j=0;j<5;j++)box(1.38,.045,.621,(r+j)%4?woodLight:wood,-16.43+j*1.39,.002,.61+r*.64,lounge,.008);
const loungeWalls=[box(7.1,2.9,.14,mint,-13.65,1.47,.29,lounge,.04),box(.14,2.9,6.5,cream,-17.15,1.47,3.52,lounge,.04)];
box(.12,1.55,1.55,cream,-10.1,.8,1.05,lounge,.03);box(.12,1.55,1.35,cream,-10.1,.8,6.02,lounge,.03);
box(5.52,.028,4.75,mat('#acb9ae'),-13.68,.042,3.55,lounge,.012);
const strip=mat('#fff0cf',{emissive:'#ffe4aa',emissiveIntensity:.65});box(25,.045,.12,strip,2.5,3.72,-6.635,room,.01);
// Layered scenery, recessed frames and softly folded linen curtains.
const sky=mat('#c5dadd',{emissive:'#adcbd1',emissiveIntensity:.3});
const windowViews=[],curtains=[];
function panorama(night,seed){const c=document.createElement('canvas');c.width=768;c.height=640;const x=c.getContext('2d');let n=seed+41;const rand=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};const skyGrad=x.createLinearGradient(0,0,0,640);skyGrad.addColorStop(0,night?'#142339':'#83b5c5');skyGrad.addColorStop(.62,night?'#465778':'#e7e6d3');skyGrad.addColorStop(1,night?'#798197':'#c9d6b9');x.fillStyle=skyGrad;x.fillRect(0,0,768,640);
if(night){for(let i=0;i<42;i++){x.fillStyle='rgba(241,240,219,'+(.2+rand()*.6)+')';x.beginPath();x.arc(rand()*768,rand()*280,.5+rand()*1.1,0,Math.PI*2);x.fill();}x.fillStyle='#f2ebd4';x.beginPath();x.arc(575,112,23,0,Math.PI*2);x.fill();}else{for(let i=0;i<6;i++){x.fillStyle='rgba(255,251,235,.28)';x.beginPath();x.ellipse(rand()*768,70+rand()*160,70+rand()*100,8+rand()*15,-.07,0,Math.PI*2);x.fill();}}
for(let layer=0;layer<3;layer++){x.fillStyle=night?['#52657a','#384e62','#30434b'][layer]:['#b2c9c3','#9bb6a9','#7d9c88'][layer];x.beginPath();x.moveTo(0,640);for(let i=0;i<=16;i++)x.lineTo(i*48,350+layer*47+Math.sin(i*.8+seed+layer)*25+rand()*14);x.lineTo(768,640);x.fill();}
for(let i=0;i<13;i++){const bx=i*66-14,bh=50+rand()*125,by=516-bh,bw=35+rand()*22;x.fillStyle=night?(i%2?'#253442':'#334454'):(i%2?'#94aaad':'#b2beba');x.fillRect(bx,by,bw,bh);x.fillStyle=night?'#657082':'#c7d1c9';x.fillRect(bx,by,bw,3);for(let yy=by+12;yy<509;yy+=14)for(let xx=bx+7;xx<bx+bw-4;xx+=11){const lit=rand()>.45;x.fillStyle=night?(lit?'#efc989':'#465566'):'#dbe4da';x.fillRect(xx,yy,4,6);}}
for(let i=0;i<22;i++){const px=i*38+rand()*12,py=537+rand()*39,r=18+rand()*24;x.fillStyle=night?(i%2?'#263f3e':'#304947'):(i%2?'#577f65':'#739873');x.fillRect(px-2,py,4,80);for(let j=0;j<3;j++){x.beginPath();x.ellipse(px+(j-1)*r*.42,py-j*10,r*.7,r*.9,0,0,Math.PI*2);x.fill();}}
const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;}
const curtainMat=mat('#d7d5c5',{roughness:1,side:T.DoubleSide});curtainMat.bumpMap=weave;curtainMat.bumpScale=.025;
for(const [wi,wx] of [-7.55,-3.7,.15,7.65].entries()){const w=new T.Group();w.position.set(wx,1.98,-6.54);room.add(w);box(3.53,3.2,.16,walnut,0,0,-.04,w,.025);const day=panorama(false,wi*17),night=panorama(true,wi*17),material=new T.MeshBasicMaterial({map:day});const view=mesh(new T.PlaneGeometry(3.34,2.98),material,0,0,.055,w);view.castShadow=false;view.receiveShadow=false;windowViews.push({material,day,night});for(const px of [-1.69,0,1.69])box(.045,3.03,.12,dark,px,0,.095,w,.01);for(const py of [-1.5,1.5,.69])box(3.4,.045,.12,dark,0,py,.095,w,.01);box(3.68,.11,.48,stone,0,-1.57,.13,w,.018);box(.027,.23,.055,brass,.08,-.12,.18,w,.008);
const glass=mesh(new T.PlaneGeometry(3.3,2.94),new T.MeshBasicMaterial({color:'#d7eeee',transparent:true,opacity:.075,depthWrite:false}),0,0,.16,w);glass.castShadow=false;const sheen=mesh(new T.PlaneGeometry(.19,2.76),new T.MeshBasicMaterial({color:'#f2f4e8',transparent:true,opacity:.15,depthWrite:false}),-.92,0,.17,w);sheen.rotation.z=-.13;sheen.castShadow=false;
rod([-1.92,1.64,.24],[1.92,1.64,.24],.028,brass,w);for(const side of [-1,1]){const geo=new T.PlaneGeometry(.38,3.02,16,18),a=geo.attributes.position;for(let j=0;j<a.count;j++){const u=(a.getX(j)+.19)/.38,v=(a.getY(j)+1.51)/3.02;a.setZ(j,Math.sin(u*Math.PI*5)*.065);a.setX(j,a.getX(j)+side*(1-v)*.075);}geo.computeVertexNormals();const curtain=mesh(geo,curtainMat,side*1.77,-.01,.24,w);curtain.userData.phase=wi+side;curtains.push(curtain);}}
function plant(x,y,z,s=1,p=room){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(s);p.add(g);cyl(.22,.16,.36,pink,0,.18,0,g);cyl(.19,.19,.025,soil,0,.365,0,g);for(let i=0;i<7;i++){const a=i*2.4,hh=.7+(i%3)*.17;rod([0,.35,0],[Math.cos(a)*.25,hh,Math.sin(a)*.25],.017,green,g);const l=ell(i%2?green:greenLight,Math.cos(a)*.28,hh,Math.sin(a)*.28,.13,.29,.075,g);l.rotation.z=Math.cos(a)*.7;l.rotation.y=-a;}return g;}
plant(-9.13,0,-5.9,1.7);plant(7.35,0,5.55,1.6);plant(-7.55,.5,-6.48,.48);
// A small bookcase and a coffee counter furnish the back corner.
box(2,2.15,.5,walnut,6.68,1.12,-6.36);box(1.8,1.97,.08,cream,6.68,1.12,-6.07);
for(let k=0;k<3;k++){box(1.94,.065,.57,woodLight,6.68,.23+k*.63,-6.09);for(let j=0;j<7;j++){const m=[mint,cream,walnut,yellow,blue,cream][(j+k)%6];const b=box(.15,.32+(j%3)*.06,.3,m,5.96+j*.23,.44+k*.63,-6.06,room,.012);b.rotation.z=j===4?.12:0;}}
plant(6.7,2.21,-6.36,.63);
box(.85,.83,2.7,mint,-7.4,.45,2.38);box(1,.12,2.85,stone,-7.4,.92,2.38);
for(const zz of [1.52,2.37,3.22])box(.025,.55,.015,brass,-6.96,.53,zz);
box(.52,.6,.54,dark,-7.37,1.27,1.68);box(.32,.27,.035,cream,-7.37,1.29,1.97);cyl(.075,.065,.14,white,-7.37,1.065,1.99);plant(-7.4,.99,3.2,.48);
// An oval rug softens the central aisle without adding another desk.
box(7.05,.025,6.4,mat('#c0c8c0'),-2.75,.04,-.55,room,.012);
box(4.9,.03,5.6,mat('#9baead'),5.04,.04,-1.65,room,.013);
// Clear partition, thin bronze frames and an open entrance to the executive area.
const glass=mat('#b8dce0',{transparent:true,opacity:.11,roughness:.15,metalness:.08,depthWrite:false,side:T.DoubleSide});
for(const z of [-6.54,-3.7,-.86])box(.055,3.35,.055,brass,2.52,1.72,z,room,.012);
for(const z of [-5.12,-2.28]){const p=box(.018,3.26,2.76,glass,2.52,1.72,z,room,.005);p.castShadow=false;}
box(.055,.055,5.74,brass,2.52,3.39,-3.7,room,.012);
for(let i=0;i<28;i++)box(.045,3.65,.12,walnut,2.85+i*.1,1.87,-6.61,room,.009);
function label(text,x,y,z,w,h,p=room){const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#e9e2d4';ctx.fillRect(0,0,768,192);ctx.fillStyle='#344646';ctx.font='500 62px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,100);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}),x,y,z,p);o.castShadow=false;return o;}
label('STUDIO / 06',4.18,2.85,-6.51,2.4,.6);
const archiveFiles=[];
// Secure paper archive, labeled binders and a ventilated data rack.
const archive=new T.Group();archive.position.set(-9.4,0,-2.65);archive.rotation.y=Math.PI/2;room.add(archive);
for(const cx of [-1.15,.55]){box(1.52,2.35,.68,stone,cx,1.23,0,archive,.035);for(const dx of [-.37,.37]){box(.72,1.05,.045,cream,cx+dx,.65,.366,archive,.02);box(.035,.22,.04,brass,cx+dx+(dx<0?.25:-.25),.68,.408,archive,.008);}box(1.38,1.02,.04,dark,cx,1.78,.366,archive,.01);for(let j=0;j<7;j++){const binder=box(.15,.58,.33,[mint,blue,cream,walnut][j%4],cx-.58+j*.19,1.57,.38,archive,.01);archiveFiles.push(binder);const tag=box(.075,.17,.009,white,cx-.58+j*.19,1.68,.555,archive,.003),hole=ell(dark,cx-.58+j*.19,1.48,.559,.022,.022,.009,archive);binder.userData.tags=[tag,hole];}box(1.42,.05,.5,woodLight,cx,1.24,.15,archive);box(.055,.055,.02,dark,cx,1.03,.402,archive,.01);}
label('DOSYA ARŞİVİ',-.28,2.66,.37,2.65,.42,archive);
const rack=new T.Group();rack.position.set(-9.38,0,.42);rack.rotation.y=Math.PI/2;room.add(rack);box(1.05,2.04,.83,dark,0,1.08,0,rack,.035);box(.92,1.89,.03,leather,0,1.08,.436,rack,.008);
const led=mat('#89d6bb',{emissive:'#72bca4',emissiveIntensity:1});for(let k=0;k<8;k++){box(.82,.16,.035,dark,0,.35+k*.2,.46,rack,.005);for(let j=0;j<7;j++)box(.045,.07,.012,stone,-.34+j*.08,.35+k*.2,.484,rack,.003);ell(led,.32,.35+k*.2,.484,.016,.016,.008,rack);}
label('VERİ',0,2.31,.46,.96,.28,rack);
// Dedicated archive room, with a door opening toward the service aisle.
const archiveRoom=new T.Group();archiveRoom.name='archive-room';room.add(archiveRoom);
box(3.42,.027,6.85,stone,-8.15,.047,-2.18,archiveRoom,.01);
const archiveWalls=[];archiveWalls.push(box(.13,3.1,6.9,cream,-6.42,1.6,-2.18,archiveRoom,.03));archiveWalls.push(box(3.53,3.1,.13,cream,-8.15,1.6,-5.63,archiveRoom,.03));
archiveWalls.push(box(1.1,3.1,.12,cream,-9.36,1.6,1.27,archiveRoom,.03));archiveWalls.push(box(1.04,3.1,.12,cream,-6.97,1.6,1.27,archiveRoom,.03));
for(const x of [-8.78,-7.5])box(.065,2.45,.15,walnut,x,1.26,1.28,archiveRoom,.01);box(1.36,.12,.15,walnut,-8.14,2.51,1.28,archiveRoom,.015);
const archiveDoor=new T.Group();archiveDoor.position.set(-8.78,0,1.28);archiveDoor.rotation.y=-1.23;archiveRoom.add(archiveDoor);box(1.18,2.35,.065,woodLight,.61,1.23,0,archiveDoor,.025);box(.03,.16,.06,brass,1.08,1.26,.055,archiveDoor,.009);
label('ARŞİV',-8.14,2.83,1.35,1.18,.31,archiveRoom);
// Small lounge armchairs replace the separate phone pod.
const loungeSeats=[{x:-13.3,z:3.4,a:Math.PI/3},{x:-15.4,z:2.1,a:-Math.PI/3}];
for(const s of loungeSeats){const c=new T.Group();c.position.set(s.x,0,s.z);c.rotation.y=s.a;room.add(c);box(.79,.16,.72,mint,0,.55,0,c,.07);box(.88,.62,.16,leather,0,.89,.32,c,.065);for(const x of [-.43,.43]){box(.15,.38,.82,leather,x,.66,.01,c,.06);for(const z of [-.25,.27])cyl(.022,.028,.34,brass,x,.23,z,c);}}
plant(-16.45,0,.95,1.15);plant(-11.05,0,5.8,1.4);label('DİNLENME',-13.6,2.25,.38,3.2,.48,lounge);box(1.5,.76,.55,walnut,-16.5,.43,4.0,lounge);plant(-16.5,.84,4,.48,lounge);
// Named destinations and independent furniture/character groups support later scenarios.
const destinations={archive:{x:-8.3,z:-2.65},archiveDoor:{x:-8.14,z:1.8},lounge:{x:-13.3,z:3.4},boss:{x:5,z:-.7},meetingDoor:{x:12.4,z:-.05}};
const meetingRoom=new T.Group();meetingRoom.name='meeting-room';room.add(meetingRoom);
box(5.12,.035,5.92,mat('#b8c3bf'),12.4,.055,-3.61,meetingRoom,.015);
const meetingGlass=[];
for(const x of [9.85,14.94]){const wall=box(.02,3.25,5.9,glass,x,1.72,-3.61,meetingRoom,.005);wall.castShadow=false;meetingGlass.push(wall);for(const z of [-6.56,-3.61,-.66])box(.055,3.34,.055,brass,x,1.73,z,meetingRoom,.012);box(.055,.055,5.95,brass,x,3.4,-3.61,meetingRoom,.012);}
for(const x of [10.55,14.22]){const p=box(1.32,3.25,.02,glass,x,1.72,-.66,meetingRoom,.005);p.castShadow=false;meetingGlass.push(p);}
for(const x of [11.22,13.56])box(.055,3.34,.055,brass,x,1.73,-.66,meetingRoom,.012);
label('TOPLANTI',12.4,3.52,-.65,2.75,.36,meetingRoom);
box(1.4,.13,3.38,walnut,12.4,.94,-3.78,meetingRoom,.065);
for(const z of [-4.8,-2.75])box(.67,.86,.2,leather,12.4,.46,z,meetingRoom,.045);
box(1.22,.017,3.14,leather,12.4,1.013,-3.78,meetingRoom,.008);
const seats=[{x:11.04,z:-4.52,a:-Math.PI/2},{x:13.76,z:-4.52,a:Math.PI/2},{x:11.04,z:-2.91,a:-Math.PI/2},{x:13.76,z:-2.91,a:Math.PI/2},{x:12.4,z:-5.81,a:Math.PI},{x:12.4,z:-1.18,a:0}];
for(const s of seats){const chair=new T.Group();chair.position.set(s.x,0,s.z);chair.rotation.y=s.a;meetingRoom.add(chair);box(.64,.14,.59,leather,0,.55,0,chair,.06);box(.64,.62,.1,leather,0,.91,.3,chair,.045);cyl(.045,.055,.46,brass,0,.28,0,chair);for(const dx of [-.22,.22])for(const dz of [-.2,.2])rod([0,.13,0],[dx,.09,dz],.025,dark,chair);}
for(const z of [-4.45,-2.98])for(const x of [11.96,12.84]){box(.25,.02,.36,cream,x,1.039,z,meetingRoom,.008);rod([x+.15,1.04,z-.1],[x+.15,1.04,z+.13],.012,brass,meetingRoom);cyl(.043,.043,.12,white,x,1.095,z+.35,meetingRoom);}
box(3.36,1.76,.13,dark,12.4,2.28,-6.53,meetingRoom,.035);box(3.16,1.56,.02,sky,12.4,2.28,-6.448,meetingRoom,.009);label('EKİP TOPLANTISI',12.4,2.68,-6.427,2.62,.36,meetingRoom);
for(let i=0;i<4;i++)box(.34,.22+i*.16,.025,[mint,blue,walnut,brass][i],11.6+i*.54,1.8+i*.08,-6.421,meetingRoom,.008);
plant(14.3,0,-5.97,.8);
const staff=[],deskGroups=[];
const outfits=[lilac,blue,pink,mint,yellow,blue],skins=[mat('#e7b48e'),mat('#b98060'),mat('#f0c7a8'),mat('#cd9875'),mat('#e9b99b'),mat('#cc9670')],hair=[mat('#65504b'),mat('#383e47'),mat('#a87950'),mat('#4d454b'),mat('#b68c60'),mat('#3f3836')];
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
desk(-4.75,-2.52,0,0);desk(-.95,-2.52,0,1);desk(-4.75,.62,.05,2);desk(-.95,.62,-.05,3);desk(5,-1.82,Math.PI,4,true);desk(5.8,2.35,0,5);
// Pinboard on the left wall, plus a round clock above the shelves.
box(.07,1.26,2.9,walnut,-9.975,2.05,-1.2);box(.04,1.14,2.78,white,-9.927,2.05,-1.2);
for(let j=0;j<8;j++)box(.025,.22,.27,[mint,yellow,blue,cream][j%4],-9.897,1.83+(j%2)*.4,-2.35+j*.32,room,.008);
const clock=cyl(.28,.28,.06,white,1.94,2.5,-6.615);clock.rotation.x=Math.PI/2;rod([1.94,2.5,-6.57],[1.94,2.68,-6.57],.013,dark);rod([1.94,2.5,-6.56],[2.08,2.45,-6.56],.013,dark);
// Lounge furnishings live in the separate western wing.
box(4.2,.03,2.4,cream,-14.4,.05,4.25,room,.014);
box(2.6,.36,.86,leather,-14.8,.38,5.4,room,.14);box(2.72,.58,.25,leather,-14.8,.77,5.72,room,.12);
for(const dx of [-1.25,1.25])box(.25,.49,.95,leather,-14.8+dx,.58,5.38,room,.10);
for(const dx of [-.64,0,.64])box(.59,.15,.63,mint,-14.8+dx,.61,5.33,room,.065);
box(.4,.36,.13,cream,-15.58,.87,5.48,room,.06).rotation.z=-.2;
cyl(.65,.65,.075,stone,-14.7,.5,3.75);cyl(.18,.25,.44,walnut,-14.7,.25,3.75);box(.3,.025,.4,walnut,-14.9,.55,3.7);cyl(.065,.06,.12,white,-14.44,.6,3.74);
plant(1.87,0,-4.35,.88);plant(2.55,0,1.03,1.05);
// Desk lamps use slender bent stems and a warm shade.
for(const g of deskGroups){cyl(.12,.12,.025,brass,.92,1.03,-.33,g);rod([.92,1.04,-.33],[.92,1.65,-.33],.018,brass,g);rod([.92,1.65,-.33],[.67,1.65,-.33],.018,brass,g);mesh(new T.ConeGeometry(.14,.15,24),dark,.67,1.63,-.33,g);}
// A sleeping office cat by the coffee corner.
ell(mat('#c3a583'),-5.7,.2,5.8,.36,.16,.23);const catmat=materials[materials.length-1];ell(catmat,-5.43,.28,5.73,.17,.15,.15);for(const x of [-5.53,-5.34])mesh(new T.ConeGeometry(.07,.15,3),catmat,x,.44,5.73);
// Local contact shadows add depth without hiding the cutaway interior.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),gradient=sc.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,'rgba(30,39,33,.27)');gradient.addColorStop(.55,'rgba(30,39,33,.11)');gradient.addColorStop(1,'rgba(30,39,33,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);const shadowTexture=new T.CanvasTexture(shadowCanvas),shadowMat=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
function contact(x,z,w,d){const s=mesh(new T.PlaneGeometry(w,d),shadowMat,x,.079,z);s.rotation.x=-Math.PI/2;s.castShadow=false;}
for(const g of deskGroups){contact(g.position.x,g.position.z,2.65,1.8);const p=g.localToWorld(new T.Vector3(0,0,1.04));contact(p.x,p.z,1.02,.92);}
contact(-14.8,5.4,3.1,1.4);contact(-14.7,3.75,1.7,1.5);contact(12.4,-3.78,2.2,4);
// Planters, upholstery seams, desk accessories and floor lamps finish the room.
box(.48,.5,1.5,stone,2.55,.31,2.15);for(const z of [1.67,2.15,2.63])plant(2.55,.57,z,.43);
for(const s of loungeSeats){const c=new T.Group();c.position.set(s.x,0,s.z);c.rotation.y=s.a;room.add(c);box(.5,.045,.47,cream,0,.66,-.015,c,.022);box(.33,.29,.1,woodLight,.05,.94,.19,c,.04).rotation.z=.12;}
const lampGlow=mat('#f0deba',{emissive:'#f1d49c',emissiveIntensity:.45});for(const p of [[-11.8,1.15],[7.75,-5.1]]){cyl(.24,.28,.05,leather,p[0],.09,p[1]);cyl(.026,.026,1.95,brass,p[0],1.08,p[1]);mesh(new T.CylinderGeometry(.3,.44,.4,32,1,true),lampGlow,p[0],2.1,p[1]);}
for(const s of staff){const g=s.home;box(.25,.13,.19,leather,-.77,1.074,-.03,g,.024);for(let k=0;k<3;k++)rod([-.83+k*.06,1.11,-.03],[-.85+k*.06,1.31,-.025],.009,[brass,dark,blue][k],g);box(.09,.012,.19,dark,.95,1.02,.34,g,.009);box(.068,.006,.14,blue,.95,1.03,.34,g,.004);}
const hemi=new T.HemisphereLight('#e1eff6','#958266',1.28);scene.add(hemi);const sun=new T.DirectionalLight('#fff0d5',2.8);sun.position.set(-7,14,8);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-21,right:21,top:19,bottom:-19});sun.shadow.normalBias=.008;sun.shadow.bias=-.00008;sun.shadow.radius=4;scene.add(sun);const fill=new T.DirectionalLight('#b9d9dc',1.05);fill.position.set(7,7,-6);scene.add(fill);
const warmLights=[],lightPools=[],lightSource=mat('#fff0cd',{emissive:'#ffd590',emissiveIntensity:.6});
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gx=glowCanvas.getContext('2d'),gg=gx.createRadialGradient(64,64,2,64,64,64);gg.addColorStop(0,'rgba(255,218,146,.52)');gg.addColorStop(.4,'rgba(255,199,109,.22)');gg.addColorStop(1,'rgba(255,192,93,0)');gx.fillStyle=gg;gx.fillRect(0,0,128,128);const glowTexture=new T.CanvasTexture(glowCanvas);glowTexture.colorSpace=T.SRGBColorSpace;
function lightPool(x,y,z,w,d,parent=room){const m=new T.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});const o=mesh(new T.PlaneGeometry(w,d),m,x,y,z,parent);o.rotation.x=-Math.PI/2;o.castShadow=false;lightPools.push(m);}
for(const g of deskGroups){cyl(.108,.108,.015,lightSource,.67,1.563,-.33,g);lightPool(.55,1.004,-.23,1.9,1.25,g);}
for(const [x,z,power] of [[-3,-.5,34],[5,-2.1,24],[5.8,2.4,18],[12.4,-3.4,30],[-13.7,3.2,24],[-8.1,-2.3,14]]){const l=new T.PointLight('#ffd9a0',0,11,2);l.position.set(x,3.25,z);l.userData.power=power;room.add(l);warmLights.push(l);lightPool(x,.084,z,5.7,4.8);}
for(const [x,z,w] of [[-2.9,-1,3.3],[12.4,-3.5,1.55],[-13.7,3.7,1.4]]){box(w,.10,.2,brass,x,3.47,z);box(w-.08,.025,.14,lightSource,x,3.409,z);for(const dx of [-w*.34,w*.34])rod([x+dx,3.53,z],[x+dx,3.88,z],.009,dark);}
let nightMode=false,nightBlend=0,hostDark=matchMedia('(prefers-color-scheme: dark)').matches;
const nightBtn=root.querySelector('[data-night]'),daySun=new T.Color('#fff0d5'),moonSun=new T.Color('#9bb7ed'),daySky=new T.Color('#e1eff6'),nightSky=new T.Color('#8199c0');
function setNight(value){nightMode=value;nightBtn.textContent=value?'Gündüz görünümü':'Gece görünümü';nightBtn.setAttribute('aria-pressed',String(value));for(const w of windowViews){w.material.map=value?w.night:w.day;w.material.needsUpdate=true;}stage.style.background=value?'radial-gradient(ellipse at 50% 58%, rgba(33,53,84,.25), transparent 72%)':'';if(matchMedia('(prefers-reduced-motion: reduce)').matches)nightBlend=value?1:0;}
function lighting(dt){nightBlend+=(Number(nightMode)-nightBlend)*(1-Math.exp(-dt*3.8));const n=nightBlend;sun.intensity=2.8*(1-n)+.34*n;sun.color.copy(daySun).lerp(moonSun,n);hemi.intensity=(hostDark?1.12:1.28)*(1-n)+.46*n;hemi.color.copy(daySky).lerp(nightSky,n);fill.intensity=1.05*(1-n)+.3*n;renderer.toneMappingExposure=(hostDark?.91:1.02)*(1-n)+1.05*n;strip.emissiveIntensity=.65+n*2.8;lampGlow.emissiveIntensity=.45+n*1.4;lightSource.emissiveIntensity=.6+n*2;for(const l of warmLights)l.intensity=l.userData.power*n;for(const m of lightPools)m.opacity=n*.62;}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',e=>hostDark=e.matches);
const phoneAnchor=new T.Group();phoneAnchor.position.set(-13.3,0,3.4);phoneAnchor.rotation.y=Math.PI/3;room.add(phoneAnchor);
let az=.44,el=.83,zoom=1,panX=0,panZ=0,view='angle',onCall=false,showWalls=true,moving=!matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,last=0,motionDt=.016,meetingState='idle',mission=null,autoMode=false,followActor=false,speed=1,idleClock=0,taskSerial=0;
const angleBtn=root.querySelector('[data-view="angle"]'),topBtn=root.querySelector('[data-view="top"]'),bossBtn=root.querySelector('[data-boss]'),archiveBtn=root.querySelector('[data-area="archive"]'),phoneBtn=root.querySelector('[data-area="phone"]'),meetingViewBtn=root.querySelector('[data-area="meeting"]'),callCheck=root.querySelector('[data-call]'),wallsCheck=root.querySelector('[data-walls]'),motionBtn=root.querySelector('[data-motion]'),meetingBtn=root.querySelector('[data-meeting]'),status=root.querySelector('[data-status]');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const actorSelect=root.querySelector('[data-actor]'),jobSelect=root.querySelector('[data-job]'),recipientSelect=root.querySelector('[data-recipient]'),speedSelect=root.querySelector('[data-speed]'),runBtn=root.querySelector('[data-run]'),autoCheck=root.querySelector('[data-auto]'),followCheck=root.querySelector('[data-follow]');
const names=(o.adlar&&o.adlar.length===6)?o.adlar.map(String):['Deniz','Ece','Can','Ada','Selin','Mert'];
for(const s of staff){s.person.name=s.index===4?'boss':'employee-'+(s.index+1);s.home.name='desk-'+(s.index+1);s.walkArms=new T.Group();s.person.add(s.walkArms);s.walkArms.visible=false;s.legPivots=[];const parts=[...s.standingLegs.children];for(let k=0;k<2;k++){const pivot=new T.Group();pivot.position.set(0,.68,1.025);s.standingLegs.add(pivot);for(const p of parts.slice(k*3,k*3+3)){p.position.y-=.68;p.position.z-=1.025;pivot.add(p);}s.legPivots.push(pivot);const side=k?1:-1;rod([side*.21,1.21,1.015],[side*.26,.94,1.04],.062,s.index===4?dark:outfits[s.index],s.walkArms);rod([side*.26,.94,1.04],[side*.23,.74,1.01],.043,skins[s.index],s.walkArms);ell(skins[s.index],side*.23,.72,1.01,.035,.065,.03,s.walkArms);}}
for(const s of staff){s.armPivots=[];s.gait=0;for(const hip of s.legPivots){const lower=[...hip.children].slice(1),knee=new T.Group();knee.position.set(0,-.49,-.01);hip.add(knee);for(const part of lower){part.position.y+=.49;part.position.z+=.01;knee.add(part);}hip.userData.knee=knee;}const arms=[...s.walkArms.children];for(let i=0;i<2;i++){const pivot=new T.Group();pivot.position.set(i?.21:-.21,1.21,1.015);s.walkArms.add(pivot);for(const part of arms.slice(i*3,i*3+3)){part.position.x-=pivot.position.x;part.position.y-=pivot.position.y;part.position.z-=pivot.position.z;pivot.add(part);}s.armPivots.push(pivot);}}
function gait(s,phase){s.gait=phase;s.walkStamp=time;}
function pose(s,kind){s.poseKind=kind;s.standing=['walk','carry','search'].includes(kind);s.seatedLegs.visible=false;s.standingLegs.visible=true;s.walkArms.visible=kind==='walk';s.typingArms.visible=kind==='desk'||kind==='meeting';s.phoneArms.visible=kind==='phone';if(s.carryArms)s.carryArms.visible=kind==='carry'||kind==='search';}
function animatePerson(s,dt){const target=s.standing?1:0,walking=s.standing&&time-(s.walkStamp??-10)<.09;s.posture+=(target-s.posture)*(1-Math.exp(-dt*7));s.stride+=(Number(walking)-s.stride)*(1-Math.exp(-dt*9));const t=s.posture,phase=s.gait;s.visual.position.y=(t-target)*.32;s.visual.rotation.x=Math.sin(t*Math.PI)*.06;s.visual.rotation.z=Math.sin(phase)*.013*s.stride;s.legPivots.forEach((p,i)=>{const a=phase+i*Math.PI;p.rotation.x=(1-t)*1.36+Math.sin(a)*.35*t*s.stride;p.userData.knee.rotation.x=(1-t)*-1.4+Math.max(0,-Math.sin(a))*.55*t*s.stride;});s.armPivots.forEach((p,i)=>p.rotation.x=-Math.sin(phase+i*Math.PI)*.23*s.stride);s.head.rotation.z=Math.sin(time*.75+s.index)*.017;s.head.rotation.y=Math.sin(time*.4+s.index)*.04+(s.poseKind==='meeting'?Math.sin(time*.55+s.index)*.1:0);s.head.position.y=s.head.userData.restY+Math.sin(time*1.8+s.index)*.004;s.hands.forEach((h,j)=>h.position.y=1.072+Math.max(0,Math.sin(time*(6.1+s.index*.22)+s.index+j*2))*.009);}
function callPose(){if(meetingState!=='idle'||mission)return;const s=staff[3];(onCall?phoneAnchor:s.home).add(s.person);s.person.position.set(0,0,onCall?-1.01:0);s.person.rotation.set(0,0,0);pose(s,onCall?'phone':'desk');callCheck.checked=onCall;}
function controls(){for(const [v,b] of [['angle',angleBtn],['top',topBtn],['boss',bossBtn],['archive',archiveBtn],['phone',phoneBtn],['meeting',meetingViewBtn]])b.setAttribute('aria-pressed',String(view===v));motionBtn.textContent=moving?'Hareketi durdur':'Hareketi başlat';motionBtn.setAttribute('aria-pressed',String(moving));wallsCheck.checked=showWalls;const busy=meetingState!=='idle'||!!mission;callCheck.disabled=busy;runBtn.disabled=busy||autoMode;actorSelect.disabled=busy;jobSelect.disabled=busy;recipientSelect.disabled=busy||jobSelect.value!=='deliver';meetingBtn.disabled=!!mission||meetingState==='walking'||meetingState==='returning';meetingBtn.textContent=meetingState==='idle'?'Toplantıyı başlat':meetingState==='walking'?'Ekip toplantıya gidiyor…':meetingState==='returning'?'Ekip geri dönüyor…':'Toplantıyı bitir';}
function save(){if(o.kaydet)try{o.kaydet({modelContent:{scene:'studio-garden',view,nightMode,onCall,meeting:meetingState,task:mission?mission.type:null,actor:mission?names[mission.actor.index]:null,employees:5,boss:1},privateContent:{az,el,zoom,panX,panZ,moving,showWalls,speed,followActor}});}catch(e){}}
function restore(s){if(s?.modelContent?.scene!=='studio-garden')return;const p=s.privateContent||{};setNight(s.modelContent.nightMode===true);view=['top','boss','archive','phone','meeting'].includes(s.modelContent.view)?s.modelContent.view:'angle';if(typeof s.modelContent.onCall==='boolean')onCall=s.modelContent.onCall;for(const key of ['az','el','zoom','panX','panZ'])if(!Number.isFinite(p[key]))p[key]=({az:.44,el:.83,zoom:1,panX:0,panZ:0})[key];az=p.az;el=clamp(p.el,.10,1.565);zoom=clamp(p.zoom,.4,5);panX=clamp(p.panX,-30,30);panZ=clamp(p.panZ,-30,30);if(typeof p.moving==='boolean')moving=p.moving;if(typeof p.showWalls==='boolean')showWalls=p.showWalls;if([1,2,4].includes(p.speed))speed=p.speed;if(typeof p.followActor==='boolean')followActor=p.followActor;speedSelect.value=String(speed);followCheck.checked=followActor;controls();callPose();}
function preset(v,a,e){view=v;az=a;el=e;zoom=1;panX=panZ=0;controls();save();}
angleBtn.onclick=()=>preset('angle',.44,.83);topBtn.onclick=()=>preset('top',0,1.565);bossBtn.onclick=()=>preset('boss',.28,.83);archiveBtn.onclick=()=>preset('archive',.68,.78);phoneBtn.onclick=()=>preset('phone',.2,.71);meetingViewBtn.onclick=()=>preset('meeting',.3,.92);
for(const b of root.querySelectorAll('[data-zoom]'))b.onclick=()=>{zoom=clamp(zoom*(b.dataset.zoom==='in'?1.3:1/1.3),.4,5);save();};for(const b of root.querySelectorAll('[data-turn]'))b.onclick=()=>{az+=(b.dataset.turn==='left'?-1:1)*Math.PI/6;save();};
nightBtn.onclick=()=>{setNight(!nightMode);save();};
motionBtn.onclick=()=>{moving=!moving;controls();save();};wallsCheck.onchange=()=>{showWalls=wallsCheck.checked;save();};callCheck.onchange=()=>{onCall=callCheck.checked;callPose();save();status.textContent=onCall?'Çalışan dinlenme koltuğunda telefonla görüşüyor.':'Çalışan kendi masasına döndü.';};
function place(s,x,z,a,y=.32,smooth=false){room.add(s.person);const old=s.person.rotation.y;if(smooth)a=old+Math.atan2(Math.sin(a-old),Math.cos(a-old))*(1-Math.exp(-motionDt*10));s.person.rotation.set(0,a,0);s.person.position.set(x-Math.sin(a)*1.01,y,z-Math.cos(a)*1.01);}
function startMeeting(){meetingState='walking';autoMode=false;autoCheck.checked=false;moving=true;room.updateMatrixWorld(true);staff.forEach((s,i)=>{const w=s.person.localToWorld(new T.Vector3(0,0,1.01));s.departure={x:w.x,z:w.z};const lane=5.15+i*.13;let points;if(i===4)points=[[w.x,w.z],[7.2,w.z],[7.2,-.2],[8.3,.2],[10.65,1.1]];else if(i===3&&onCall)points=[[w.x,w.z],[-12.1,4.5],[-8.3,4.5],[-3.05,4.5],[1.1,5.5],[8.2,5.5],[10.65,5.5],[10.65,1.1]];else{const aisle=i%2?1.1:-3.05;points=[[w.x,w.z],[aisle,w.z],[aisle,2.65],[1.1,2.65],[1.1,lane],[8.2,lane],[10.65,lane],[10.65,1.1]];}const seat=seats[i],side=i%2===0&&i!==4?10.45:14.42;points.push([12.4,.15],[side,-1.15],[side,i===4?-6.06:seat.z],[seat.x,seat.z]);s.route=softenRoute(points);s.segment=0;s.delay=i*.9;s.routeBack=s.route.slice().reverse();pose(s,'walk');place(s,w.x,w.z,0);});status.textContent='Altı kişi toplantı odasına yürüyor.';controls();save();}
meetingBtn.onclick=()=>{if(mission)return;if(meetingState==='idle')startMeeting();else if(meetingState==='seated'){meetingState='returning';moving=true;staff.forEach((s,i)=>{s.route=s.routeBack;s.segment=0;s.delay=(staff.length-1-i)*.7;pose(s,'walk');const seat=seats[i];place(s,seat.x,seat.z,seat.a);});status.textContent='Toplantı bitti; ekip çalışma alanlarına dönüyor.';controls();save();}};
function updateMeeting(dt){if(!['walking','returning'].includes(meetingState))return;let done=0;for(const s of staff){if(s.delay>0){s.delay-=dt;continue;}if(s.segment>=s.route.length-1){done++;continue;}const target=s.route[s.segment+1];const current=s.person.localToWorld(new T.Vector3(0,0,1.01)),dx=target[0]-current.x,dz=target[1]-current.z,d=Math.hypot(dx,dz),step=dt*1.75;if(d<=step){place(s,...target,s.person.rotation.y);s.segment++;if(s.segment===s.route.length-1){if(meetingState==='walking'){const seat=seats[s.index];place(s,seat.x,seat.z,seat.a,0);pose(s,'meeting');}else{s.home.add(s.person);s.person.position.set(0,0,0);s.person.rotation.set(0,0,0);pose(s,'desk');}}}else{place(s,current.x+dx/d*step,current.z+dz/d*step,Math.atan2(-dx,-dz),.32+Math.abs(Math.sin(s.gait))*.014,true);gait(s,s.gait+step*4.5);}s.person.updateMatrixWorld(true);}if(done===staff.length){meetingState=meetingState==='walking'?'seated':'idle';if(meetingState==='idle')callPose();status.textContent=meetingState==='seated'?'Toplantı başladı. Altı kişi masada.':'Ekip çalışma alanlarına döndü.';controls();save();if(o.bitti)try{o.bitti({tur:'toplanti',durum:meetingState});}catch(e){}}}
function documentModel(parent){const g=new T.Group();parent.add(g);box(.35,.045,.46,brass,0,0,0,g,.012);box(.313,.021,.414,white,0,.033,0,g,.006);box(.1,.012,.03,leather,-.085,.048,-.15,g,.003);for(let k=0;k<4;k++)box(.24-k%2*.065,.009,.012,blue,-.015,.049,-.065+k*.048,g,.003);return g;}
for(const s of staff){s.carryArms=new T.Group();s.person.add(s.carryArms);s.carryArms.visible=false;for(const side of [-1,1]){rod([side*.21,1.21,1.015],[side*.24,1.035,.79],.062,s.index===4?dark:outfits[s.index],s.carryArms);rod([side*.24,1.035,.79],[side*.13,1.06,.59],.043,skins[s.index],s.carryArms);ell(skins[s.index],side*.13,1.058,.575,.039,.024,.066,s.carryArms);}s.document=documentModel(s.person);s.document.position.set(0,1.075,.55);s.document.visible=false;s.tray=documentModel(s.home);s.tray.position.set(s.index===4?0:.85,1.035,s.index===4?-.55:.12);s.tray.visible=false;const nameTag=label(names[s.index],0,1.14,-.52,.65,.16,s.home);nameTag.rotation.y=Math.PI;const children=[...s.person.children];s.visual=new T.Group();s.person.add(s.visual);for(const child of children)s.visual.add(child);s.posture=0;s.stride=0;s.head.userData.restY=s.head.position.y;pose(s,'desk');animatePerson(s,0);}
function slideDocument(m,destination,progress){const s=m.actor;if(!m.paperFlight){room.updateMatrixWorld(true);room.attach(s.document);m.paperFlight={from:s.document.position.clone(),to:destination.getWorldPosition(new T.Vector3()),rotation:s.document.quaternion.clone(),endRotation:destination.getWorldQuaternion(new T.Quaternion())};}const f=m.paperFlight,t=clamp(progress,0,1),u=t*t*(3-2*t);s.document.position.copy(f.from).lerp(f.to,u);s.document.position.y+=Math.sin(t*Math.PI)*.14;s.document.quaternion.copy(f.rotation).slerp(f.endRotation,u);if(t>=1){s.document.visible=false;destination.visible=true;}}
function resetDocument(s){s.visual.add(s.document);s.document.position.set(0,1.075,.55);s.document.rotation.set(0,0,0);}
// Reusable routes keep each task in the corridors and through the archive doorway.
const hub=[1.1,2.65];
function bodyPosition(s){const v=s.person.localToWorld(new T.Vector3(0,0,1.01));return [v.x,v.z];}
function homeExit(i){const s=staff[i],p=s.home.localToWorld(new T.Vector3(0,0,1.01));if(i===4)return [[p.x,p.z],[7.2,p.z],[7.2,-.15],[1.8,.15],hub];const aisle=i===5?1.1:i%2?1.1:-3.05;return [[p.x,p.z],[aisle,p.z],[aisle,2.65],hub];}
function recipientPath(i){if(i===4)return [hub,[1.8,.15],[5,.15],[5,-.73]];if(i===5)return [hub,[1.1,4.45],[8.05,4.45],[8.05,2.5],[7.42,2.5]];const z=staff[i].home.position.z+.18,aisle=i%2?1.1:-3.05,x=staff[i].home.position.x+1.56;return [hub,[aisle,2.65],[aisle,z],[x,z]];}
const archivePath=[hub,[-3.05,2.65],[-3.05,4.6],[-8.2,4.6],[-8.2,1.84],[-8.14,.66],[-8.14,-1.49]];
const loungePath=[hub,[-3.05,2.65],[-3.05,4.6],[-11.65,4.6],[-13.2,4.6],[-14.25,2.75],[-15.4,2.1]];
function softenRoute(points){if(points.length<3)return points;const result=[points[0]];for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],d1=Math.hypot(b[0]-a[0],b[1]-a[1]),d2=Math.hypot(c[0]-b[0],c[1]-b[1]);if(d1<.03||d2<.03){result.push(b);continue;}const r=Math.min(.19,d1*.2,d2*.2),p=[b[0]-(b[0]-a[0])/d1*r,b[1]-(b[1]-a[1])/d1*r],q=[b[0]+(c[0]-b[0])/d2*r,b[1]+(c[1]-b[1])/d2*r];result.push(p);for(const t of [.33,.67,1])result.push([(1-t)**2*p[0]+2*(1-t)*t*b[0]+t*t*q[0],(1-t)**2*p[1]+2*(1-t)*t*b[1]+t*t*q[1]]);}result.push(points.at(-1));return result;}
function joinRoute(...parts){const out=[];for(const p of parts.flat())if(!out.length||Math.hypot(p[0]-out.at(-1)[0],p[1]-out.at(-1)[1])>.025)out.push(p);return out;}
function message(t){status.textContent=(mission&&mission.temsili?'Temsili: ':'')+t;}
function newMission(type,i,target,temsili){if(mission||meetingState!=='idle')return false;if(!['deliver','archive','break'].includes(type)||!(i>=0&&i<staff.length)||(type==='deliver'&&!(target>=0&&target<staff.length)))return false;const s=staff[i];const availableFile=archiveFiles.findIndex(b=>b.visible!==false);if(type==='archive'&&availableFile<0){message('Arşivde alınacak dosya kalmadı.');return false;}if(type==='deliver'&&i===target){message('Gönderen ve alıcı için farklı kişileri seç.');return false;}if((i===3||target===3)&&onCall){onCall=false;callPose();}s.document.visible=false;s.carryArms.position.set(0,0,0);s.tray.visible=false;const exit=homeExit(i),back=exit.slice().reverse();const archiveRoute=archivePath.map(p=>p.slice());if(type==='archive'){const location=archiveFiles[availableFile].localToWorld(new T.Vector3());archiveRoute[archiveRoute.length-1]=[-8.14,location.z];}const walk=(points,carry=false)=>({kind:'walk',points:softenRoute(points),carry});let steps;
if(type==='deliver'){const end=recipientPath(target);steps=[{kind:'prepare',duration:1.4},walk(joinRoute(exit,end),true),{kind:'deliver',duration:1.9,target},walk(joinRoute(end.slice().reverse(),back)),{kind:'home'}];}
else if(type==='archive'){steps=[walk(joinRoute(exit,archiveRoute)),{kind:'search',duration:3.2},walk(joinRoute(archiveRoute.slice().reverse(),back),true),{kind:'file',duration:1.4},{kind:'home'}];}
else{steps=[walk(joinRoute(exit,loungePath)),{kind:'relax',duration:7},walk(joinRoute(loungePath.slice().reverse(),back)),{kind:'home'}];}
mission={type,actor:s,target,fileIndex:availableFile,archiveRoute,steps,step:0,elapsed:0,entered:false,id:++taskSerial,temsili:!!temsili};moving=true;idleClock=0;controls();save();return true;}
function enterStep(m,step){const s=m.actor;m.entered=true;m.elapsed=0;m.took=false;if(step.kind==='walk'){m.segment=0;pose(s,step.carry?'carry':'walk');s.document.visible=step.carry;place(s,...step.points[0],s.person.rotation.y);message(names[s.index]+(step.carry?' dosyayı taşıyor.':m.step>=2?' masasına dönüyor.':m.type==='archive'?' arşiv odasına yürüyor.':m.type==='break'?' dinlenme alanına yürüyor.':' çalışma alanına dönüyor.'));}
else if(step.kind==='prepare'){pose(s,'desk');s.document.visible=true;message(names[s.index]+' belgeyi hazırlıyor → '+names[m.target]+'.');}
else if(step.kind==='deliver'){pose(s,'carry');const p=bodyPosition(s);place(s,...p,step.target===4?0:Math.PI/2);staff[step.target].tray.visible=false;message(names[s.index]+' belgeyi '+names[step.target]+' adlı kişiye teslim ediyor.');}
else if(step.kind==='search'){pose(s,'search');place(s,...m.archiveRoute.at(-1),Math.PI/2);s.document.visible=false;message(names[s.index]+' arşiv rafında dosya arıyor.');}
else if(step.kind==='relax'){pose(s,'phone');place(s,-15.4,2.1,-Math.PI/3,0);message(names[s.index]+' ayrı dinlenme salonunda mola veriyor.');}
else if(step.kind==='file'){s.home.add(s.person);s.person.position.set(0,0,0);s.person.rotation.set(0,0,0);pose(s,'desk');message(names[s.index]+' arşiv dosyasını kendi masasına bırakıyor.');}
else if(step.kind==='home'){s.home.add(s.person);s.person.position.set(0,0,0);s.person.rotation.set(0,0,0);pose(s,'desk');s.document.visible=false;s.carryArms.position.set(0,0,0);message(m.type==='deliver'?'Teslim tamamlandı: '+names[s.index]+' → '+names[m.target]+'.':m.type==='archive'?names[s.index]+' arşiv dosyasını aldı; dosya masasında.':names[s.index]+' moladan masasına döndü.');const biten={tur:m.type,kim:s.index,kime:m.target,temsili:!!m.temsili};mission=null;idleClock=0;controls();save();if(o.bitti)try{o.bitti(biten);}catch(e){}}}
function updateMission(dt){if(!mission){if(autoMode&&meetingState==='idle'){idleClock+=dt;if(idleClock>3){const i=Math.floor(Math.random()*staff.length),r=Math.random(),type=r<.58?'deliver':r<.85&&archiveFiles.some(b=>b.visible!==false)?'archive':'break',target=(i+1+Math.floor(Math.random()*(staff.length-1)))%staff.length;newMission(type,i,target,true);}}return;}const m=mission,step=m.steps[m.step],s=m.actor;if(!m.entered)enterStep(m,step);if(!mission)return;m.elapsed+=dt;
if(step.kind==='walk'){const target=step.points[m.segment+1];if(!target){m.step++;m.entered=false;return;}const p=bodyPosition(s),dx=target[0]-p[0],dz=target[1]-p[1],d=Math.hypot(dx,dz),move=dt*1.7;if(d<=move){place(s,...target,s.person.rotation.y);m.segment++;}else{place(s,p[0]+dx/d*move,p[1]+dz/d*move,Math.atan2(-dx,-dz),.32+Math.abs(Math.sin(s.gait))*.014,true);gait(s,s.gait+move*4.5);}return;}
if(step.kind==='search'){const reach=Math.sin(clamp(m.elapsed/2.2,0,1)*Math.PI/2);s.carryArms.position.set(0,.13*reach,-.24*reach);s.document.position.set(0,1.075+.13*reach,.55-.24*reach);s.person.rotation.y=Math.PI/2+Math.sin(m.elapsed*2)*.055;if(m.elapsed>2.3&&!m.took){m.took=true;const b=archiveFiles[m.fileIndex];b.visible=false;for(const t of b.userData.tags||[])t.visible=false;s.document.visible=true;message(names[s.index]+' klasörü raftan aldı.');}}
if(step.kind==='deliver'){const reach=Math.sin(clamp(m.elapsed/1.8,0,1)*Math.PI);s.carryArms.position.z=-.23*reach;if(m.elapsed<.6)s.document.position.z=.55-.23*reach;else slideDocument(m,staff[step.target].tray,(m.elapsed-.6)/.85);}
if(step.kind==='file'&&m.elapsed>.2)slideDocument(m,s.tray,(m.elapsed-.2)/.85);
if(m.elapsed>step.duration){s.carryArms.position.set(0,0,0);resetDocument(s);m.paperFlight=null;m.step++;m.entered=false;}}
function selectionChanged(){if(actorSelect.value===recipientSelect.value)recipientSelect.value=String((Number(actorSelect.value)+1)%staff.length);controls();}
actorSelect.onchange=selectionChanged;recipientSelect.onchange=selectionChanged;jobSelect.onchange=controls;runBtn.onclick=()=>newMission(jobSelect.value,Number(actorSelect.value),Number(recipientSelect.value),true);speedSelect.onchange=()=>{speed=Number(speedSelect.value);save();};followCheck.onchange=()=>{followActor=followCheck.checked;save();};autoCheck.onchange=()=>{autoMode=autoCheck.checked;idleClock=3;if(autoMode)moving=true;controls();message(autoMode?'Canlı ofis açık: belge, arşiv ve mola görevleri sırayla başlayacak.':mission?'Canlı ofis kapalı; mevcut görev tamamlanıyor.':'Canlı ofis durduruldu.');};
restore(o.durum||null);if(!o.durum&&typeof o.gece==='boolean')setNight(o.gece);controls();callPose();
const pointers=new Map();let spanNow=10;function pan(dx,dy){const scale=2*spanNow/stage.clientHeight;panX=clamp(panX+(-dx*Math.cos(az)+dy*Math.sin(az))*scale,-30,30);panZ=clamp(panZ+(dx*Math.sin(az)+dy*Math.cos(az))*scale,-30,30);}
stage.oncontextmenu=e=>e.preventDefault();stage.onpointerdown=e=>{tik={x:e.clientX,y:e.clientY,id:e.pointerId,n:pointers.size};pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey});stage.setPointerCapture(e.pointerId);};stage.onpointermove=e=>{const old=pointers.get(e.pointerId);if(!old)return;const before=[...pointers.values()];pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:old.pan});const after=[...pointers.values()];if(after.length>=2){const dist=a=>Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);zoom=clamp(zoom*dist(after)/Math.max(1,dist(before)),.4,5);pan((after[0].x+after[1].x-before[0].x-before[1].x)/2,(after[0].y+after[1].y-before[0].y-before[1].y)/2);}else if(old.pan||e.shiftKey)pan(e.clientX-old.x,e.clientY-old.y);else{az-=(e.clientX-old.x)*.006;el=clamp(el+(e.clientY-old.y)*.006,.10,1.565);} };stage.onpointerup=e=>{const t=tik;tik=null;pointers.delete(e.pointerId);save();if(t&&t.id===e.pointerId&&t.n===0&&Math.hypot(e.clientX-t.x,e.clientY-t.y)<6)sec(e);};stage.onpointercancel=e=>pointers.delete(e.pointerId);let wheelTimer;stage.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.0012),.4,5);clearTimeout(wheelTimer);wheelTimer=setTimeout(save,200);},{passive:false});
const meetingBack=meetingRoom.children.filter(o=>o.position.z<-6.4&&o.position.y>.2);const backDecor=room.children.filter(o=>o.position.z<-6.4&&o.position.y>.2),leftDecor=room.children.filter(o=>o.position.x<-9.8&&o.position.y>.2);
function cutaway(){loungeWalls[0].visible=showWalls&&camera.position.z>.29;loungeWalls[1].visible=showWalls&&camera.position.x>-17.15;for(const o of meetingBack)o.visible=showWalls&&camera.position.z>-6.65;for(const o of backDecor)o.visible=showWalls&&camera.position.z>-6.65;for(const o of leftDecor)o.visible=showWalls&&camera.position.x>-10;back.visible=showWalls&&camera.position.z>-6.65;left.visible=showWalls&&camera.position.x>-10;archiveWalls.forEach((w,i)=>w.visible=showWalls&&(i===0?camera.position.x<-6.42:i===1?camera.position.z>-5.63:camera.position.z<1.27));for(const w of meetingGlass)w.visible=showWalls;}
function resize(){if(stage.clientWidth&&stage.clientHeight)renderer.setSize(stage.clientWidth,stage.clientHeight,false);}new ResizeObserver(resize).observe(stage);resize();
function followFocus(s){const p=bodyPosition(s);return [p[0],p[1],3.8,4.5];}
let cameraReady=false,cameraSpan=10;const cameraAim=new T.Vector3();
function frame(ms){if(!root.isConnected||document.hidden){calisiyor=false;return;}requestAnimationFrame(frame);if(!stage.clientWidth||!stage.clientHeight)return;if(!mission&&meetingState==='idle'&&!autoMode&&!pointers.size&&ms-sonCizim<48)return;sonCizim=ms;const dt=Math.min(Math.max(0,(ms-last)/1000),.04);last=ms;lighting(dt);motionDt=dt*speed;if(moving){time+=dt*speed;updateMeeting(dt*speed);updateMission(dt*speed);}const aspect=stage.clientWidth/stage.clientHeight,presets={boss:[5,-2,4.9,5.3],archive:[-8.1,-1.85,4.5,4.4],phone:[-13.7,3.5,4.1,4.7],meeting:[12.4,-3.6,4.8,4.5]},focus=followActor&&mission?[...followFocus(mission.actor)]:presets[view]||[-.8,.2,11.5,18.7],span=Math.max(focus[2],focus[3]/aspect)/zoom,tx=focus[0]+panX,tz=focus[1]+panZ;const ease=1-Math.exp(-dt*8);cameraSpan=cameraReady?cameraSpan+(span-cameraSpan)*ease:span;spanNow=cameraSpan;camera.left=-cameraSpan*aspect;camera.right=cameraSpan*aspect;camera.top=cameraSpan;camera.bottom=-cameraSpan;camera.updateProjectionMatrix();const goalPosition=new T.Vector3(tx+Math.sin(az)*Math.cos(el)*40,.7+Math.sin(el)*40,tz+Math.cos(az)*Math.cos(el)*40),goalAim=new T.Vector3(tx,.7,tz);if(!cameraReady){camera.position.copy(goalPosition);cameraAim.copy(goalAim);cameraReady=true;}else{camera.position.lerp(goalPosition,ease);cameraAim.lerp(goalAim,ease);}camera.lookAt(cameraAim);cutaway();for(const s of staff)animatePerson(s,moving?dt*speed:0);for(const c of curtains)c.rotation.z=Math.sin(time*.65+c.userData.phase)*.007;renderer.render(scene,camera);}
let calisiyor=false,sonCizim=0,tik=null;
function surdur(){if(calisiyor||!root.isConnected)return;calisiyor=true;last=performance.now();resize();requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)surdur();});
const ray=new T.Raycaster(),ndc=new T.Vector2();
function sec(e){if(!o.secildi)return;const r=stage.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);const hedef=[];for(const k of staff)hedef.push(k.person,k.home);for(const v of ray.intersectObjects(hedef,true)){let x=v.object;while(x){const k=staff.find(q=>q.person===x||q.home===x);if(k){try{o.secildi(k.index);}catch(err){}return;}x=x.parent;}}}
surdur();
return {ok:true,
  gorev(tur,i,j){return newMission(tur,i,j)===true;},
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
window.RotaOfis3B={kur,SURUM:'0.160.1'};
})();
