/* SPİ'nin isteğe bağlı 3B yüzü. Kararlar ve sağlık verisi SP.Office'te kalır.
   Sahneye yalnız katalog adları, kişi indisleri ve devir kimlikleri geçer. */
window.SP = window.SP || {};
SP.Ofis3B = (function(){
  const ids = ['lab','nutri','move','money','patron'];
  let enabled=false, root=null, api=null, loading=null, timer=null, error='';
  let pending=[], seen=new Set(), meetingRequested=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const button=(label,attr)=>String(SP.C.Button({label,size:'sm',data:attr}));
  function kadro(){return ids.map(id=>SP.AGENT_BY_ID[id]);}
  function devirler(rows){
    return (Array.isArray(rows)?rows:[]).filter(h=>h&&typeof h.id==='string'&&ids.includes(h.from)&&ids.includes(h.to)&&h.from!==h.to)
      .map(h=>({id:h.id,from:ids.indexOf(h.from),to:ids.indexOf(h.to)}));
  }
  function panel(){
    const {html,raw}=SP.h;
    return html`<section class="spi-campus" aria-label="Sağlık ve performans kampüsü">
      <div class="spi-campus__header"><div><b>Sağlık & performans kampüsü</b>
        <p class="small muted">5 agent · Laboratuvar, beslenme, hareket, ekonomi ve Patron.</p></div>
        ${SP.C.Button({label:enabled?'Hafif görünüme dön':'3B kampüsü aç',act:'office-3d',size:'sm'})}</div>
      ${error?html`<p role="status">${error}</p>`:''}
      ${enabled?raw('<div id="spi-campus-mount"><p role="status">Kampüs hazırlanıyor…</p></div>'):''}
    </section>`;
  }
  function kok(){
    const {html,raw,map}=SP.h,el=document.createElement('div');el.className='spi-campus__scene';
    const options=()=>map(kadro(),(a,i)=>html`<option value="${i}">${a.name}</option>`);
    el.innerHTML=String(html`
      <div class="spi-campus__tools" aria-label="Kamera">
      ${raw(button('Genel',{'data-view':'angle'}))}${raw(button('Üstten',{'data-view':'top'}))}
      ${raw(button('Patron',{'data-boss':''}))}${raw(button('Arşiv',{'data-area':'archive'}))}
      ${raw(button('Dinlenme',{'data-area':'phone'}))}${raw(button('Toplantı',{'data-area':'meeting'}))}
      ${raw(button('Yakınlaş',{'data-zoom':'in'}))}${raw(button('Uzaklaş',{'data-zoom':'out'}))}
      ${raw(button('Sola dön',{'data-turn':'left'}))}${raw(button('Sağa dön',{'data-turn':'right'}))}
      ${raw(button('Gece görünümü',{'data-night':''}))}</div>
      <div class="office-view" role="img" aria-label="Beş agentın sağlık ve spor kampüsü. Kamera ve masalar aşağıdaki düğmelerle de kullanılabilir."></div>
      <p class="small muted">Sürükle: döndür · Tekerlek: yakınlaş · Shift + sürükle: kaydır · Masaya tıkla: raporu aç.</p>
      <div class="spi-campus__tools" aria-label="Agent masaları">${map(kadro(),a=>SP.C.Button({label:a.name+' · '+a.role,size:'sm',act:'toggle-desk',data:{'data-id':a.id}}))}</div>
      <p data-status role="status" aria-live="polite">Kampüs hazır.</p>
      <p data-event class="small muted">Animasyon görseldir; bir devri tamamlanmış saymaz.</p>
      <details><summary>Temsili animasyonlar ve görünüm</summary>
      <div class="spi-campus__tools">
        <label>Çalışan <select data-actor>${options()}</select></label>
        <label>Hareket <select data-job><option value="deliver">Belge götür</option><option value="archive">Arşivden al</option><option value="break">Mola ver</option></select></label>
        <label>Alıcı <select data-recipient>${options()}</select></label>
        <label>Hız <select data-speed><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
        ${raw(button('Canlandır',{'data-run':''}))}${raw(button('Toplantıyı başlat',{'data-meeting':''}))}
        ${raw(button('Hareketi durdur',{'data-motion':''}))}
        <label><input type="checkbox" data-walls checked> Duvarlar</label>
        <label><input type="checkbox" data-call> Sedef dinlenmede konuşsun</label>
        <label><input type="checkbox" data-follow> Çalışanı takip et</label>
        <label><input type="checkbox" data-auto> Temsili dolaşım</label>
      </div></details>`);
    el.querySelector('[data-recipient]').value='1';return el;
  }
  function script(file){return new Promise((resolve,reject)=>{
    const el=document.createElement('script');el.src='ofis3d/'+file;
    const fail=()=>{clearTimeout(timeout);el.remove();reject(new Error('load'));};
    const timeout=setTimeout(fail,10000);
    el.onload=()=>{clearTimeout(timeout);resolve();};el.onerror=fail;document.head.appendChild(el);
  });}
  function load(){if(!loading)loading=(async()=>{if(!window.THREE)await script('three-0.160.1.min.js');if(!window.SpiOfis3B)await script('sahne.js');})().catch(e=>{loading=null;throw e;});return loading;}
  function finish(e){if(meetingRequested&&e.tur==='toplanti'&&e.durum==='seated'){
    meetingRequested=false;if(enabled&&SP.S.route==='office'){api.toplanti(false);SP.App.go('meeting');}
  }}
  function tick(){
    clearTimeout(timer);timer=null;
    if(!enabled||!root||!root.isConnected||SP.S.route!=='office'){meetingRequested=false;pending=[];return;}
    if(!reduced()&&api){
      const rows=devirler(SP.Office.handoffs());
      const active=new Set(rows.map(x=>x.id));pending=pending.filter(x=>active.has(x.id));
      for(const h of rows){if(!seen.has(h.id)&&!pending.some(x=>x.id===h.id)&&pending.length<3)pending.push(h);}
      if(!meetingRequested&&!api.mesgul()&&pending.length){const h=pending.shift();if(api.gorev('deliver',h.from,h.to)){
        seen.add(h.id);if(seen.size>128)seen.delete(seen.values().next().value);
        root.querySelector('[data-event]').textContent=kadro()[h.from].name+' → '+kadro()[h.to].name+': mevcut devir canlandırılıyor; tamamlanma kaydı değişmez.';
      }}
    }
    timer=setTimeout(tick,1000);
  }
  async function yerlestir(host){
    if(!enabled||!host)return;
    if(root&&api){host.replaceChildren(root);api.surdur();tick();return;}
    try{
      await load();if(!enabled||!host.isConnected)return;
      root=kok();host.replaceChildren(root);
      let saved=null;try{saved=JSON.parse(localStorage.getItem('spi-campus-view'));}catch(e){}
      api=window.SpiOfis3B.kur(root,{adlar:kadro().map(a=>a.name),durum:saved,
        kaydet(value){try{localStorage.setItem('spi-campus-view',JSON.stringify(value));}catch(e){}},
        secildi(i){if(!ids[i])return;SP.S.ui.officeDesk=ids[i];SP.App.render();},bitti:finish});
      if(!api.ok)throw new Error(api.why);
      tick();
    }catch(e){root=null;api=null;enabled=false;error='3B görünüm yüklenemedi. Hafif ofis ve tüm raporlar kullanılabilir.';if(SP.S.route==='office')SP.App.render();}
  }
  function acKapat(){enabled=!enabled;error='';if(!enabled){clearTimeout(timer);pending=[];meetingRequested=false;}SP.App.render();}
  function toplanti(){
    if(!enabled||!api||reduced()){SP.App.go('meeting');return;}
    if(api.mesgul()){SP.App.go('meeting');return;}
    meetingRequested=api.toplanti(true);
    if(!meetingRequested)SP.App.go('meeting');
  }
  function ayril(){clearTimeout(timer);timer=null;meetingRequested=false;pending=[];}
  return {panel,kadro,devirler,yerlestir,acKapat,toplanti,ayril,aktif:()=>enabled,durum:()=>api?api.durum():null};
})();
