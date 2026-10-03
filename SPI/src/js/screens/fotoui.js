/* FOTO KARESİ — kayıtların yanındaki 40 piksellik minik fotoğraf.
   Boşsa silik bir kamera simgesidir: dokununca geri sayımlı kamera açılır
   (core/kamera.js). Doluysa küçük resimdir: dokununca büyük açılır;
   oradan yeniden çekilir ya da silinir. Depo `core/foto.js`.

   Eylemler her ekranda çalışsın diye geneldir (app.js bağlar), Hatırlat
   kalıbıyla aynı: `SP.FotoUI.handle`. */

window.SP = window.SP || {};

SP.FotoUI = (function(){
  const { html, raw, cls } = SP.h;

  /* o: { sahip, ad, yon:'user'|'environment', sinif } — depo yoksa hiç
     çizilmez (boş bir düğme, çalışmayan bir söz olurdu). */
  function kutu(o){
    if(!SP.Foto.var()) return '';
    const u = SP.Foto.url(o.sahip), yon = o.yon || 'environment';
    return u
      ? html`<button type="button" class="${cls('foto-kutu', o.sinif)}" data-act="foto-ac"
          data-sahip="${o.sahip}" data-ad="${o.ad}" data-yon="${yon}"
          aria-label="${o.ad + ': fotoğrafı aç'}"><img src="${u}" alt="" decoding="async"/></button>`
      : html`<button type="button" class="${cls('foto-kutu foto-kutu--bos', o.sinif)}" data-act="foto-cek"
          data-sahip="${o.sahip}" data-ad="${o.ad}" data-yon="${yon}"
          aria-label="${o.ad + ': fotoğraf çek'}">${raw(SP.UI.icon('camera'))}</button>`;
  }

  async function cekVeKaydet(d){
    const b = await SP.Kamera.cek({ baslik:d.ad, yon:d.yon });
    if(!b) return false;
    const r = await SP.Foto.kaydet(d.sahip, b);
    if(!r.ok){ SP.UI.toast(r.why); return false; }
    return true;
  }

  function goster(d){
    const u = SP.Foto.url(d.sahip);
    if(!u) return;
    const K = SP.C, veri = { 'data-sahip':d.sahip, 'data-ad':d.ad, 'data-yon':d.yon };
    SP.UI.sheet({
      title:d.ad, wide:true,
      body:String(html`<img class="foto-buyuk" src="${u}" alt="${d.ad}"/>`),
      footer:String(html`${K.Button({ label:'Sil', tone:'ghost', act:'foto-sil', data:veri })}
        <span class="grow"></span>
        ${K.Button({ label:'Yeniden çek', icon:'camera', act:'foto-yeniden', data:veri })}
        ${K.Button({ label:'Kapat', act:'sheet-close' })}`),
      noFocus:true,
    });
  }

  const handle = {
    async 'foto-cek'(el){ if(await cekVeKaydet(el.dataset)) SP.App.render(); },
    async 'foto-ac'(el){ goster(el.dataset); },
    async 'foto-yeniden'(el){
      const d = Object.assign({}, el.dataset);
      SP.UI.closeSheet();
      if(await cekVeKaydet(d)) SP.App.render();
    },
    /* Silme geri alınabilir: blob bellekte tutulur, «Geri al» yerine koyar. */
    async 'foto-sil'(el){
      const d = Object.assign({}, el.dataset);
      const blob = await SP.Foto.al(d.sahip);
      await SP.Foto.sil(d.sahip);
      SP.UI.closeSheet();
      if(blob) SP.S.ui.undo = { restore:() => SP.Foto.kaydet(d.sahip, blob) };
      SP.UI.toast('Fotoğraf silindi', { undo:!!blob });
      SP.App.render();
    },
  };

  return { kutu, goster, handle };
})();
