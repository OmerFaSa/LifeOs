/* Kütüphanem — BAM'ın ürettikleri ve kendi kaynakların (CEKMECE-HARITASI).

   «Kütüphane» adı yalnız burada durur. Önce test kitapları Sınama
   ekranının içinde «Kütüphanem · test kitapları» kartıydı; şimdi kendi
   çekmecesindeler. Kitabı ÇÖZMEK hâlâ Sınama'nın işidir (sınav biçimi,
   core/testkitabi.js): «Çöz» Sınama'ya geçer ve o ekranın kendi
   işleyicisini çağırır — iki ekranda iki ayrı çözme akışı yoktur. */

window.R = window.R || {};
R.Screens = R.Screens || {};

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
    return c.Card({ title:'Test kitapları',
      sub:'BAM üretti, her soru bağımsız çözümle denetlendi',
      body:html`<div class="stack-sm">${map(l, k => {
        const il = TK().ilerleme(k);
        return html`<div>
        <div class="row between wrap"><b class="small">${k.baslik}</b>
          ${c.Badge({ label:k.dogruluk === 'kaynakli' ? 'kaynaklı' : 'kaynaksız · doğrulanmadı',
            tone:k.dogruluk === 'kaynakli' ? 'ok' : 'warn' })}</div>
        <div class="tiny dim">${il.bolum}/${il.toplamBolum} bölüm çözüldü · ${il.soru}/${il.toplamSoru}
          soru (%${il.yuzde}, hesaplandı) · ${maliyetYazi(k.maliyet)}${k.eklenme
          ? ' · eklendi ' + U.fmtShort(k.eklenme) : ''}</div>
        ${map(k.bolumler, b => {
          const s = (k.sonuclar || {})[b.no];
          const y = TK().yarim();
          const yarimBu = y && y.kitapId === k.id && y.no === b.no;
          return html`<div class="row between wrap mt-6">
            <span class="small">${b.no}. ${b.ad} · ${b.sorular.length} soru${s
              ? ' · son: ' + s.dogru + ' doğru, ' + s.yanlis + ' yanlış, ' + s.bos + ' boş' : ''}</span>
            <span class="row-sm wrap">${when(s, () => c.Button({ label:'Gözden geçir', size:'sm',
              tone:'ghost', act:'kitap-ozet', data:{ 'data-id':k.id, 'data-no':String(b.no) } }))}
            ${when(yarimBu, () => c.Button({ label:'Devam et (soru ' + (y.index + 1) + '/' + y.toplam + ')',
              size:'sm', tone:'primary', act:'kitap-devam' }))}
            ${c.Button({ label:yarimBu ? 'Baştan başla' : s ? 'Yeniden çöz' : 'Çöz', size:'sm', act:'kitap-baslat',
              data:{ 'data-id':k.id, 'data-no':String(b.no) } })}</span></div>`;
        })}</div>`;
      })}</div>` });
  }

  async function render(){
    const kart = kitapKarti();
    if(!kart){
      /* Boş durum (10): yalnız veri yokken; tek eylem. */
      return String(c.Grid([c.Span(12, c.Kutu({ ad:'Kütüphanen henüz boş', govde:html`
        <p class="small muted">BAM bir test kitabı ürettiğinde burada durur: kaynağı, maliyeti
          ve ne kadarını çözdüğün.</p>
        <div class="mt-10">${c.Button({ label:'Ofis\u2019e sor', size:'sm', act:'go',
          data:{ 'data-route':'team' } })}</div>` }))]));
    }
    return String(c.Grid([c.Span(12, kart)]));
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
    title:'Kütüphanem',
    subtitle(){
      const n = TK() ? TK().kitaplar().length : 0;
      return n ? n + ' test kitabı' : 'henüz kitap yok';
    },
    lede(){ return 'BAM\u2019ın ürettikleri ve kendi kaynakların; kaynağı ve maliyeti yanında yazar.'; },
    actions(){ return ''; },
    render, handle,
  };
})();
