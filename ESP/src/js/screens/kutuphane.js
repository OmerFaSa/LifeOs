/* Kütüphanem — BAM'ın ürettikleri ve kendi kaynakların (CEKMECE-HARITASI).

   «Kütüphane» adı Okuma'nın kendi bölümünde kalır (ad çakışması yok):
   burası BAM'dan gelenlerin dizinidir. Ürünler (özet, rapor, sunum) Ofis'ten
   taşındı; dil üniteleri burada listelenir, üzerinde çalışmak Dil'dedir. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.kutuphane = (function(){
  const { html, when, map } = ESP.h;
  const K = ESP.C;

  /* ---------- BAM ürünleri (core/urun.js, ortak) ----------
     HKM'nin Üretim Bürosu'ndan gelen ve onaylanan özet, rapor, sunum,
     pankart. Basılı hâl bu modülün deposundadır: HKM kapalıyken de açılır.
     Liste boşsa bölüm çizilmez. */
  function urunlerKart(){
    const l = ESP.Urunler ? ESP.Urunler.liste() : [];
    if(!l.length) return '';
    const govde = html`<div class="stack-xs">${map(l, u => html`<div class="row gap-8 wrap">
      <span class="minw0"><b>${u.baslik}</b> <span class="tiny dim">· ${u.urunAd}
        · ${LIFEOS.Urun.etiketAdi(u.dogruluk)}</span></span>
      ${K.Button({ label:'Aç', size:'sm', act:'urun-ac', data:{ 'data-id':u.id } })}
      ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'urun-sil', data:{ 'data-id':u.id } })}
    </div>`)}</div>`;
    return K.Entry({ label:'BAM ürünleri', hint:'hkm', meta:l.length + ' ürün', wide:true,
      note:'Sohbette «… hakkında özet hazırla» dersen King’e iletilir; bitince teklif olarak gelir.',
      body:html`${govde}` });
  }

  function uniteKart(){
    const l = ESP.Unite ? ESP.Unite.liste() : [];
    if(!l.length) return '';
    return K.Entry({ label:'Dil üniteleri', meta:l.length + ' ünite', wide:true,
      body:html`<div class="stack-xs">${map(l, u => html`<div class="row gap-8 wrap">
        <span class="minw0"><b>${u.title || u.baslik || u.id}</b> <span class="tiny dim">·
          ${(u.bam && u.bam.dil) || ''} · ${(u.items || []).length} madde</span></span>
        ${K.Button({ label:'Dil’de aç', size:'sm', act:'go', data:{ 'data-route':'lang' } })}
      </div>`)}</div>` });
  }

  const handle = {
    /* Ürün KUTUDA açılır: sandbox iframe, betik çalışmaz (core/urun.js). */
    async 'urun-ac'(el){
      const u = ESP.Urunler && ESP.Urunler.bul(el.dataset.id);
      if(!u) return;
      ESP.UI.sheet({ title:u.baslik, wide:true,
        subtitle:u.urunAd + ' · ' + LIFEOS.Urun.etiketAdi(u.dogruluk),
        note:u.dogruluk === 'dogrulanmadi' ? 'Doğrulanmadı: kaynaksız, modelin bilgisidir. '
          + 'Karar vermeden önce bir kaynağa bak.' : null,
        body:LIFEOS.Urun.cerceve(u) });
    },
    async 'urun-sil'(el){
      const id = el.dataset.id;
      ESP.UI.confirmSheet('Ürünü sil', 'Ürün yalnız bu cihazdan silinir; HKM’deki kaydı durur.',
        async () => { await ESP.Urunler.sil(id); ESP.UI.toast('Silindi'); ESP.App.render(); }, true, 'Ürünü bu cihazdan sil');
    },
  };

  function render(){
    const kartlar = [urunlerKart(), uniteKart()].filter(Boolean);
    if(!kartlar.length){
      return K.Kutu({ ad:'Kütüphanen henüz boş', govde:html`
        <p class="small muted">BAM bir özet, rapor ya da ünite ürettiğinde burada durur.</p>
        <div class="mt-10">${K.Button({ label:'Danışma’ya git', size:'sm', act:'go',
          data:{ 'data-route':'team' } })}</div>` });
    }
    return K.Ledger(() => kartlar);
  }

  return {
    id:'kutuphane',
    title:'Kütüphanem',
    subtitle(){ return 'BAM’ın ürettikleri'; },
    lede(){ return 'BAM’dan gelen ürün ve üniteler; kaynağı ve doğruluğu yanında yazar.'; },
    actions(){ return ''; },
    render, handle,
  };
})();

/* Notlar — Kütüphanem'in ilk bölümü (kullanıcı, 2026-10-17: «kütüphanenin
   içinde yeni not, belge oluşturma, dosya ekleme olsun; yazdıklarımızı
   oraya yazacağız»). Defter'in rafı (brand/ortak/defter.js rafHtml):
   Yeni not, Yeni belge, Dosya ekle; en yeni beş kayıt; satır Defter'i
   o kayıtta açar. Dosya cihazda kalır, kaydın metni eşitlenir. */
ESP.Screens.notlar = (function(){
  const K = ESP.C;
  const { raw } = ESP.h;
  const D = () => (window.LIFEOS || {}).DEFTER;
  const hazir = () => !!(D() && D().kuruluMu && D().kuruluMu());
  function render(){
    if(!hazir()) return String(K.Kutu({ ad:'Notlar', govde:raw('<p class="small muted">Defter bu açılışta yüklenemedi.</p>') }));
    return String(K.Kutu({ ad:'Notlar ve belgeler', govde:raw('<div data-defter-raf-yer>' + D().rafHtml() + '</div>') }));
  }
  function afterRender(){
    const el = document.querySelector('[data-defter-raf-yer]');
    if(el && hazir()) D().rafBagla(el);
  }
  return {
    id:'notlar',
    title:'Kütüphanem',
    subtitle(){ const n = hazir() ? D().notlar().length : 0; return n ? n + ' kayıt' : 'henüz not yok'; },
    lede(){ return ''; },
    actions(){ return ''; },
    render, afterRender, handle:{},
  };
})();
