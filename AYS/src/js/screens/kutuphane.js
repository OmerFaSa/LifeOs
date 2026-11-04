/* Kütüphanem — BAM'ın ürettikleri ve kendi kaynakların (CEKMECE-HARITASI).

   «Kütüphane» adı yalnız burada durur. Önce test kitapları Sınama
   ekranının içinde «Kütüphanem · test kitapları» kartıydı; şimdi kendi
   çekmecesindeler. Kitabı ÇÖZMEK hâlâ Sınama'nın işidir (sınav biçimi,
   core/testkitabi.js): «Çöz» Sınama'ya geçer ve o ekranın kendi
   işleyicisini çağırır — iki ekranda iki ayrı çözme akışı yoktur. */
window.LIFEOS.PARCA.yazilar({
  'ays.kutuphane.bastan-basla':'Baştan başla',
  'ays.kutuphane.yeniden-coz':'Yeniden çöz',
  'ays.kutuphane.defter-bu-acilista-yukleneme':'Defter bu açılışta yüklenemedi.',
});


window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:80, group:'Git', label:'Notlarım — bütün notların', icon:'list', run(){ const L = window.LIFEOS || {}; if(L.DEFTER && L.DEFTER.kuruluMu()) L.DEFTER.ac(); else if(L.NOTUM) L.NOTUM.panelAc(); } });
window.LIFEOS.PARCA.yazilar({
  'ays.kutuphane.test-kitaplari':'Test kitapları',
  'ays.kutuphane.bam-uretti-her-soru-bagimsiz':'BAM üretti, her soru bağımsız çözümle denetlendi',
  'ays.kutuphane.bolum-cozuldu':'bölüm çözüldü ·',
  'ays.kutuphane.soru':'soru (%',
  'ays.kutuphane.hesaplandi':', hesaplandı) ·',
  'ays.kutuphane.gozden-gecir':'Gözden geçir',
  'ays.kutuphane.devam-et-soru':'Devam et (soru ',
  'ays.kutuphane.bam-bir-test-kitabi-urettigi':'BAM bir test kitabı ürettiğinde burada durur: kaynağı, maliyeti ve ne kadarını çözdüğün.',
  'ays.kutuphane.ofis-u2019e-sor':'Ofis\u2019e sor',
  'ays.kutuphane.kutuphanem':'Kütüphanem',
  'ays.kutuphane.notlar':'Notlar',
  'ays.kutuphane.notlar-ve-belgeler':'Notlar ve belgeler',
});
window.LIFEOS.PARCA.sayfa({ id:'notlar', modul:'ays', cekmece:'kutuphane', ad:'Notlar', ikon:'edit', sira:10 });
window.LIFEOS.PARCA.sayfa({ id:'kutuphane', modul:'ays', cekmece:'kutuphane', ad:'Kitaplar', ikon:'book', sira:20 });

R.Screens.kutuphane = (function(){
  const U = R.U, UI = R.UI;
  const { html, when, map } = R.h;
  const c = R.C;
  const TK = () => R.TestKitabi;

  /* Kütüphanem: BAM'ın ürettiği kitaplar, kaynağı, ölçülen maliyeti ve
     ne kadarının çözüldüğü. Maliyet HKM'nin ölçümü (kitap eklenirken
     alınır); kullanım AYS'nin hesabı. İkisi de etiketiyle yazılır. */
  function maliyetYazi(m){
    if(!m || m.etiket === 'veri_yok' || m.usd == null) return 'maliyet: veri yok';
    const d = m.usd < 0.01 ? 4 : 2;
    return 'maliyet ' + m.usd.toLocaleString('tr-TR', { minimumFractionDigits:d, maximumFractionDigits:d }) + ' USD'
      + (m.cagri ? ' · ' + m.cagri + ' çağrı' : '') + (m.etiket === 'tahmin' ? ' (tahmin)' : ' (ölçüldü)');
  }

  function kitapKarti(){
    const l = TK() ? TK().kitaplar() : [];
    if(!l.length) return null;
    return c.Card({ title:yz('ays.kutuphane.test-kitaplari'),
      sub:yz('ays.kutuphane.bam-uretti-her-soru-bagimsiz'),
      body:html`<div class="stack-sm">${map(l, k => {
        const il = TK().ilerleme(k);
        return html`<div>
        <div class="row between wrap"><b class="small">${k.baslik}</b>
          ${c.Badge({ label:k.dogruluk === 'kaynakli' ? 'kaynaklı' : 'kaynaksız · doğrulanmadı',
            tone:k.dogruluk === 'kaynakli' ? 'ok' : 'warn' })}</div>
        <div class="tiny dim">${il.bolum}/${il.toplamBolum} ${yz('ays.kutuphane.bolum-cozuldu')} ${il.soru}/${il.toplamSoru}
          ${yz('ays.kutuphane.soru')}${il.yuzde}${yz('ays.kutuphane.hesaplandi')} ${maliyetYazi(k.maliyet)}${k.eklenme
          ? ' · eklendi ' + U.fmtShort(k.eklenme) : ''}</div>
        ${map(k.bolumler, b => {
          const s = (k.sonuclar || {})[b.no];
          const y = TK().yarim();
          const yarimBu = y && y.kitapId === k.id && y.no === b.no;
          return html`<div class="row between wrap mt-6">
            <span class="small">${b.no}. ${b.ad} · ${b.sorular.length} soru${s
              ? ' · son: ' + s.dogru + ' doğru, ' + s.yanlis + ' yanlış, ' + s.bos + ' boş' : ''}</span>
            <span class="row-sm wrap">${when(s, () => c.Button({ label:yz('ays.kutuphane.gozden-gecir'), size:'sm',
              tone:'ghost', act:'kitap-ozet', data:{ 'data-id':k.id, 'data-no':String(b.no) } }))}
            ${when(yarimBu, () => c.Button({ label:yz('ays.kutuphane.devam-et-soru') + (y.index + 1) + '/' + y.toplam + ')',
              size:'sm', tone:'primary', act:'kitap-devam' }))}
            ${c.Button({ label:yarimBu ? yz('ays.kutuphane.bastan-basla') : s ? yz('ays.kutuphane.yeniden-coz') : 'Çöz', size:'sm', act:'kitap-baslat',
              data:{ 'data-id':k.id, 'data-no':String(b.no) } })}</span></div>`;
        })}</div>`;
      })}</div>` });
  }

  /* Boş durum (10): yalnız veri yokken; tek eylem. */
  LIFEOS.PARCA.blok({ id:'kutuphane.bos', sayfa:'kutuphane', yer:'ana', ad:'Kütüphanen henüz boş', kosul:b => !b.kart, ciz:() => c.Kutu({ ad:'Kütüphanen henüz boş', govde:html`
        <p class="small muted">${yz('ays.kutuphane.bam-bir-test-kitabi-urettigi')}</p>
        <div class="mt-10">${c.Button({ label:yz('ays.kutuphane.ofis-u2019e-sor'), size:'sm', act:'go',
          data:{ 'data-route':'team' } })}</div>` }) });
  LIFEOS.PARCA.blok({ id:'kutuphane.kitap', sayfa:'kutuphane', yer:'ana', ad:'Test kitapları', kosul:b => !!b.kart, ciz:b => b.kart });
  async function render(){
    return String(c.Grid([c.Span(12, LIFEOS.PARCA.yer('kutuphane', 'ana', c, { kart:kitapKarti() }))]));
  }

  /* Çözme Sınama'da olur: önce oraya geçilir, sonra onun işleyicisi. */
  const sinamada = ad => async el => {
    R.App.go('quiz');
    await R.Screens.quiz.handle[ad](el);
  };

  const handle = {
    'kitap-baslat':sinamada('kitap-baslat'),
    'kitap-devam':sinamada('kitap-devam'),
    'kitap-ozet':sinamada('kitap-ozet'),
  };

  return {
    id:'kutuphane',
    title:yz('ays.kutuphane.kutuphanem'),
    subtitle(){
      const n = TK() ? TK().kitaplar().length : 0;
      return n ? n + ' test kitabı' : 'henüz kitap yok';
    },
    lede(){ return 'BAM\u2019ın ürettikleri ve kendi kaynakların; kaynağı ve maliyeti yanında yazar.'; },
    actions(){ return ''; },
    render, handle,
  };
})();

/* Notlar — Kütüphanem'in ilk bölümü (kullanıcı, 2026-10-17: «kütüphanenin
   içinde yeni not, belge oluşturma, dosya ekleme olsun; yazdıklarımızı
   oraya yazacağız»). Defter'in rafı (brand/ortak/defter.js rafHtml):
   Yeni not, Yeni belge, Dosya ekle; en yeni beş kayıt; satır Defter'i
   o kayıtta açar. Dosya cihazda kalır, kaydın metni eşitlenir. */
R.Screens.notlar = (function(){
  const K = R.C;
  const { raw } = R.h;
  const D = () => (window.LIFEOS || {}).DEFTER;
  const hazir = () => !!(D() && D().kuruluMu && D().kuruluMu());
  LIFEOS.PARCA.blok({ id:'notlar.kapali', sayfa:'notlar', yer:'ana', ad:'Notlar', kosul:() => !hazir(),
    ciz:() => String(K.Kutu({ ad:yz('ays.kutuphane.notlar'), govde:raw(('<p class="small muted">' + yz('ays.kutuphane.defter-bu-acilista-yukleneme') + '</p>')) })) });
  LIFEOS.PARCA.blok({ id:'notlar.pano', sayfa:'notlar', yer:'ana', sira:10, ad:'Defter özeti', kosul:() => hazir(),
    ciz:() => '<div data-defter-pano>' + (D().panoHtml ? D().panoHtml() : '') + '</div>' });
  LIFEOS.PARCA.blok({ id:'notlar.raf', sayfa:'notlar', yer:'ana', sira:20, ad:'Notlar ve belgeler', kosul:() => hazir(),
    ciz:() => String(K.Kutu({ ad:yz('ays.kutuphane.notlar-ve-belgeler'), govde:raw('<div data-defter-raf-yer>' + D().rafHtml() + '</div>') })) });
  function render(){ return LIFEOS.PARCA.yer('notlar', 'ana', K); }
  function afterRender(){
    const el = document.querySelector('[data-defter-raf-yer]');
    if(el && hazir()) D().rafBagla(el);
    const pano = document.querySelector('[data-defter-pano]');
    if(pano && hazir() && D().panoBagla) D().panoBagla(pano);
  }
  return {
    id:'notlar',
    title:yz('ays.kutuphane.kutuphanem'),
    subtitle(){ const n = hazir() ? D().notlar().length : 0; return n ? n + ' kayıt' : 'henüz not yok'; },
    lede(){ return ''; },
    actions(){ return ''; },
    render, afterRender, handle:{},
  };
})();
