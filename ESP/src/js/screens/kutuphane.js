/* Kütüphanem — BAM'ın ürettikleri ve kendi kaynakların (CEKMECE-HARITASI).

   «Kütüphane» adı Okuma'nın kendi bölümünde kalır (ad çakışması yok):
   burası BAM'dan gelenlerin dizinidir. Ürünler (özet, rapor, sunum) Ofis'ten
   taşındı; dil üniteleri burada listelenir, üzerinde çalışmak Dil'dedir. */
window.LIFEOS.PARCA.yazilar({
  'esp.kutuphane.dogrulanmadi-kaynaksiz-model':'Doğrulanmadı: kaynaksız, modelin bilgisidir. ',
  'esp.kutuphane.karar-vermeden-once-bir-kayn':'Karar vermeden önce bir kaynağa bak.',
  'esp.kutuphane.urunu-sil':'Ürünü sil',
  'esp.kutuphane.urun-yalniz-bu-cihazdan-sili':'Ürün yalnız bu cihazdan silinir; HKM’deki kaydı durur.',
  'esp.kutuphane.urunu-bu-cihazdan-sil':'Ürünü bu cihazdan sil',
  'esp.kutuphane.bam-in-urettikleri':'BAM’ın ürettikleri',
  'esp.kutuphane.bam-dan-gelen-urun-ve-unitel':'BAM’dan gelen ürün ve üniteler; kaynağı ve doğruluğu yanında yazar.',
  'esp.kutuphane.defter-bu-acilista-yukleneme':'Defter bu açılışta yüklenemedi.',
});


window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'esp', sira:10, id:'act:notlar', kind:'Eylem', label:'Notlarım — bütün notların', hint:'Notum',
  run:() => { if(window.LIFEOS && window.LIFEOS.NOTUM) window.LIFEOS.NOTUM.panelAc(); } });
window.LIFEOS.PARCA.yazilar({
  'esp.kutuphane.ac':'Aç',
  'esp.kutuphane.sil':'Sil',
  'esp.kutuphane.bam-urunleri':'BAM ürünleri',
  'esp.kutuphane.sohbette-hakkinda-ozet-hazir':'Sohbette «… hakkında özet hazırla» dersen King’e iletilir; bitince teklif olarak gelir.',
  'esp.kutuphane.dil-uniteleri':'Dil üniteleri',
  'esp.kutuphane.dil-de-ac':'Dil’de aç',
  'esp.kutuphane.silindi':'Silindi',
  'esp.kutuphane.kutuphanen-henuz-bos':'Kütüphanen henüz boş',
  'esp.kutuphane.bam-bir-ozet-rapor-ya':'BAM bir özet, rapor ya da ünite ürettiğinde burada durur.',
  'esp.kutuphane.danisma-ya-git':'Uzmana sor',
  'esp.kutuphane.kutuphanem':'Kütüphanem',
  'esp.kutuphane.notlar':'Notlar',
  'esp.kutuphane.notlar-ve-belgeler':'Notlar ve belgeler',
});
window.LIFEOS.PARCA.sayfa({ id:'notlar', modul:'esp', cekmece:'kutuphane', ad:'Notlar', sira:10 });
window.LIFEOS.PARCA.sayfa({ id:'kutuphane', modul:'esp', cekmece:'kutuphane', ad:'Ürünler', sira:30 });

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
      ${K.Button({ label:yz('esp.kutuphane.ac'), size:'sm', act:'urun-ac', data:{ 'data-id':u.id } })}
      ${K.Button({ label:yz('esp.kutuphane.sil'), size:'sm', tone:'ghost', act:'urun-sil', data:{ 'data-id':u.id } })}
    </div>`)}</div>`;
    return K.Entry({ label:yz('esp.kutuphane.bam-urunleri'), hint:'hkm', meta:l.length + ' ürün', wide:true,
      note:yz('esp.kutuphane.sohbette-hakkinda-ozet-hazir'),
      body:html`${govde}` });
  }

  function uniteKart(){
    const l = ESP.Unite ? ESP.Unite.liste() : [];
    if(!l.length) return '';
    return K.Entry({ label:yz('esp.kutuphane.dil-uniteleri'), meta:l.length + ' ünite', wide:true,
      body:html`<div class="stack-xs">${map(l, u => html`<div class="row gap-8 wrap">
        <span class="minw0"><b>${u.title || u.baslik || u.id}</b> <span class="tiny dim">·
          ${(u.bam && u.bam.dil) || ''} · ${(u.items || []).length} madde</span></span>
        ${K.Button({ label:yz('esp.kutuphane.dil-de-ac'), size:'sm', act:'go', data:{ 'data-route':'lang' } })}
      </div>`)}</div>` });
  }

  const handle = {
    /* Ürün KUTUDA açılır: sandbox iframe, betik çalışmaz (core/urun.js). */
    async 'urun-ac'(el){
      const u = ESP.Urunler && ESP.Urunler.bul(el.dataset.id);
      if(!u) return;
      ESP.UI.sheet({ title:u.baslik, wide:true,
        subtitle:u.urunAd + ' · ' + LIFEOS.Urun.etiketAdi(u.dogruluk),
        note:u.dogruluk === 'dogrulanmadi' ? yz('esp.kutuphane.dogrulanmadi-kaynaksiz-model')
          + yz('esp.kutuphane.karar-vermeden-once-bir-kayn') : null,
        body:LIFEOS.Urun.cerceve(u) });
    },
    async 'urun-sil'(el){
      const id = el.dataset.id;
      ESP.UI.confirmSheet(yz('esp.kutuphane.urunu-sil'), yz('esp.kutuphane.urun-yalniz-bu-cihazdan-sili'),
        async () => { await ESP.Urunler.sil(id); ESP.UI.toast(yz('esp.kutuphane.silindi')); ESP.App.render(); }, true, yz('esp.kutuphane.urunu-bu-cihazdan-sil'));
    },
  };

  LIFEOS.PARCA.blok({ id:'kutuphane.urunler', sayfa:'kutuphane', yer:'ana', sira:10, ad:'Ürünler', ciz:() => urunlerKart() });
  LIFEOS.PARCA.blok({ id:'kutuphane.unite', sayfa:'kutuphane', yer:'ana', sira:20, ad:'Üniteler', ciz:() => uniteKart() });
  function render(){
    const kartlar = LIFEOS.PARCA.liste('kutuphane', 'ana', K).filter(Boolean);
    if(!kartlar.length){
      return K.Kutu({ ad:yz('esp.kutuphane.kutuphanen-henuz-bos'), govde:html`
        <p class="small muted">${yz('esp.kutuphane.bam-bir-ozet-rapor-ya')}</p>
        <div class="mt-10">${K.Button({ label:yz('esp.kutuphane.danisma-ya-git'), size:'sm', act:'go',
          data:{ 'data-route':'team' } })}</div>` });
    }
    return K.Ledger(() => kartlar);
  }

  return {
    id:'kutuphane',
    title:yz('esp.kutuphane.kutuphanem'),
    subtitle(){ return yz('esp.kutuphane.bam-in-urettikleri'); },
    lede(){ return yz('esp.kutuphane.bam-dan-gelen-urun-ve-unitel'); },
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
  LIFEOS.PARCA.blok({ id:'notlar.kapali', sayfa:'notlar', yer:'ana', ad:'Notlar', kosul:() => !hazir(),
    ciz:() => String(K.Kutu({ ad:yz('esp.kutuphane.notlar'), govde:raw(('<p class="small muted">' + yz('esp.kutuphane.defter-bu-acilista-yukleneme') + '</p>')) })) });
  LIFEOS.PARCA.blok({ id:'notlar.pano', sayfa:'notlar', yer:'ana', sira:10, ad:'Defter özeti', kosul:() => hazir(),
    ciz:() => '<div data-defter-pano>' + (D().panoHtml ? D().panoHtml() : '') + '</div>' });
  LIFEOS.PARCA.blok({ id:'notlar.raf', sayfa:'notlar', yer:'ana', sira:20, ad:'Notlar ve belgeler', kosul:() => hazir(),
    ciz:() => String(K.Kutu({ ad:yz('esp.kutuphane.notlar-ve-belgeler'), govde:raw('<div data-defter-raf-yer>' + D().rafHtml() + '</div>') })) });
  function render(){ return LIFEOS.PARCA.yer('notlar', 'ana', K); }
  function afterRender(){
    const el = document.querySelector('[data-defter-raf-yer]');
    if(el && hazir()) D().rafBagla(el);
    const pano = document.querySelector('[data-defter-pano]');
    if(pano && hazir() && D().panoBagla) D().panoBagla(pano);
  }
  return {
    id:'notlar',
    title:yz('esp.kutuphane.kutuphanem'),
    subtitle(){ const n = hazir() ? D().notlar().length : 0; return n ? n + ' kayıt' : 'henüz not yok'; },
    lede(){ return ''; },
    actions(){ return ''; },
    render, afterRender, handle:{},
  };
})();
