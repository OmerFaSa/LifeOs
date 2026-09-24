/* Kütüphanem — BAM'ın SPİ için ürettikleri TEK yerde (ekip/CEKMECE-HARITASI.md).

   «Kütüphane» adı yalnız burada. Üç şey:
     Bilgi iste    besin değeri, market fiyatı ya da yer listesi HKM'nin
                   Araştırma Bürosu'ndan istenir (core/bilgi.js)
     Yerler        BAM'ın getirdiği yer listeleri (tahmin; tarihiyle)
     BAM ürünleri  onaylanmış özet, rapor, sunum (core/urun.js, ortak)

   Önce Mutfak'ta (bilgi, yerler) ve Ofis'te (ürünler) ayrı ayrı
   duruyorlardı. Onaylı besin kaydı Mutfak'taki kendi gıdalarına, tahmin
   fiyat Bütçe'ye girer: kullanıldıkları yerde kalırlar, burada yalnız
   istenir ve listelenir. HKM kapalıyken liste yine okunur; kayıtlar bu
   cihazdadır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.kutuphane = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, when, map } = SP.h;
  const K = SP.C;

  /* İsteğe sağlık verisi GİTMEZ: tür, ad, semt, şehir — o kadar. */
  function bilgiKart(){
    const tur = S.ui.bilgiTur || 'besin';
    return K.Card({
      title:'Bilgi iste', sub:'HKM · Araştırma Bürosu',
      body:html`
        ${K.Ayrinti({ ozet:'Besin değeri, market fiyatı ya da bir semtteki yerler kaynaktan araştırılır.',
          govde:'King önce maliyet ve süre teklifi yapar; sonuç Onaylar’a teklif olarak gelir ve SPİ '
            + 'kendi koduyla sınamadan hiçbir şey yazılmaz.' })}
        <div class="cols-2 mt-10">
          ${K.Field({ label:'Ne?', input:K.Select({ id:'bilgi-tur', value:tur, change:'bilgi-tur',
            options:[{ value:'besin', label:'Besin değerleri' }, { value:'fiyat', label:'Market fiyatı' },
              { value:'yer', label:'Yer listesi' }] }) })}
          ${K.Field({ label:tur === 'yer' ? 'Ne tür yer?' : 'Gıda', input:K.Input({ id:'bilgi-ad',
            placeholder:tur === 'yer' ? 'spor salonu' : 'kinoa' }) })}
        </div>
        ${when(tur !== 'besin', () => html`<div class="cols-2 mt-10">
          ${K.Field({ label:'Semt', hint:'isteğe bağlı', input:K.Input({ id:'bilgi-semt' }) })}
          ${K.Field({ label:'Şehir', hint:tur === 'yer' ? 'semt ya da şehir gerekli' : 'isteğe bağlı',
            input:K.Input({ id:'bilgi-sehir' }) })}
        </div>`)}`,
      foot:K.Button({ label:'King’e ilet', tone:'primary', act:'bilgi-iste' }),
    });
  }

  function yerKart(){
    const liste = SP.Bilgi ? SP.Bilgi.yerler() : [];
    if(!liste.length) return '';
    return K.Card({
      title:'Yerler', sub:liste.length + ' liste · tahmin',
      body:html`${map(liste, l => html`<div class="mt-10">
        <div class="row gap-8">
          <b class="small grow minw0">${l.baslik}${l.konum ? ' · ' + l.konum : ''}</b>
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Listeyi sil',
            act:'yer-sil', data:{ 'data-id':l.id } })}
        </div>
        ${(() => {
          /* Karşılaştırma (fikir 37): aylık karşılık koddan; çevrilemeyen sona. */
          const k = SP.Bilgi.yerKarsilastir(l);
          return html`${K.Table({ tight:true, headers:['Yer', 'Fiyat', { label:'Aylık karşılık', num:true }],
            rows:k.satirlar.map(y => [
              y.ad + (y.semt ? ' · ' + y.semt : ''),
              y.tl != null ? U.fmtNum(y.tl) + ' TL' + (y.donem ? ' / ' + y.donem : '') : 'bilinmiyor',
              y.aylik != null ? U.fmtNum(y.aylik) + ' TL' : html`<span class="dim">${y.not}</span>`]) })}
            ${when(k.enUcuz, () => html`<p class="tiny mt-4">Aylık karşılıkta en düşük: <b>${k.enUcuz}</b>
              (hesaplandı; yıllık fiyat 12'ye bölündü).</p>`)}`;
        })()}
        <p class="tiny dim">BAM araştırması, ${l.at}. Fiyat ve adres değişmiş olabilir; gitmeden teyit et.</p>
      </div>`)}`,
    });
  }

  /* BAM ürünleri: HKM'nin Üretim Bürosu'ndan gelen ve onaylanan özet,
     rapor, sunum, pankart. Basılı hâl bu modülün deposundadır: HKM
     kapalıyken de açılır. Liste boşsa kart çizilmez. */
  function urunKart(){
    const l = SP.Urunler ? SP.Urunler.liste() : [];
    if(!l.length) return '';
    return K.Card({ title:'BAM ürünleri', hint:'hkm', sub:l.length + ' ürün',
      body:html`<p class="tiny dim">Danışma’da «… hakkında özet hazırla» dersen King’e iletilir;
          bitince teklif olarak gelir.</p>
        <div class="stack-xs mt-8">${map(l, u => html`<div class="row gap-8 wrap">
          <span class="minw0 grow"><b>${u.baslik}</b> <span class="tiny dim">· ${u.urunAd}
            · ${LIFEOS.Urun.etiketAdi(u.dogruluk)}</span></span>
          ${K.Button({ label:'Aç', size:'sm', act:'urun-ac', data:{ 'data-id':u.id } })}
          ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'urun-sil', data:{ 'data-id':u.id } })}
        </div>`)}</div>` });
  }

  async function render(){
    return String(K.Stack([urunKart(), yerKart(), bilgiKart()].filter(Boolean)));
  }

  const handle = {
    async 'bilgi-iste'(){
      const v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
      const r = await SP.Bilgi.iste({ tur:S.ui.bilgiTur || 'besin', ad:v('bilgi-ad'),
        semt:v('bilgi-semt'), sehir:v('bilgi-sehir') });
      UI.toast(r.metin);
      if(r.ok) SP.App.render();
    },
    async 'yer-sil'(el){
      const l = SP.Bilgi.yerler().find(x => x.id === el.dataset.id);
      if(!l) return;
      await SP.Bilgi.yerSil(l.id);
      UI.toast(l.baslik + ' silindi', { undo:async () => { await SP.Bilgi.yerGeri(l); SP.App.render(); } });
      SP.App.render();
    },
    /* Ürün KUTUDA açılır: sandbox iframe, betik çalışmaz (core/urun.js). */
    async 'urun-ac'(el){
      const u = SP.Urunler && SP.Urunler.bul(el.dataset.id);
      if(!u) return;
      UI.sheet({ title:u.baslik, wide:true,
        subtitle:u.urunAd + ' · ' + LIFEOS.Urun.etiketAdi(u.dogruluk),
        note:u.dogruluk === 'dogrulanmadi' ? 'Doğrulanmadı: kaynaksız, modelin bilgisidir. '
          + 'Karar vermeden önce bir kaynağa bak.' : null,
        body:LIFEOS.Urun.cerceve(u) });
    },
    async 'urun-sil'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Ürünü sil', 'Ürün yalnız bu cihazdan silinir; HKM’deki kaydı durur.',
        async () => { await SP.Urunler.sil(id); UI.toast('Silindi'); SP.App.render(); }, true);
    },
  };

  const change = {
    async 'bilgi-tur'(el){ S.ui.bilgiTur = el.value; SP.App.render(); },
  };

  return {
    id:'kutuphane',
    title:'Kütüphanem',
    subtitle(){
      const n = (SP.Urunler ? SP.Urunler.liste().length : 0) + (SP.Bilgi ? SP.Bilgi.yerler().length : 0);
      return n ? n + ' kayıt' : 'BAM’dan bilgi ve ürün';
    },
    lede(){ return 'BAM’ın senin için araştırdığı ve ürettiği her şey burada durur.'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
