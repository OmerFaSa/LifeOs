/* SORU KARTI — Bugün'deki «Bir soru» (gösterge ya da sürtünme sinyali); üç
   arayüzde aynı, sade kart.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sorukart.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `sorukart.css`.
   ==================================================================

   Kullanıcı (2026-10-16): «her yeri çok daha anlaşılır ve minimalist yap».
   Önce üç modülde üç kopya vardı ve hepsi aynı kalabalığı gösteriyordu:
   «Bir soru» başlığı, «gösterge/sürtünme» etiketi, iç gösterge adı
   («çalışma dakikası → kapanan konu»), uyarı kutusu, etiketli alan ve iki
   düğme. Şimdi: soru, tek satırda kısa cevap, «Kaydet» ve «Uymuyor».
   İç ad başlığın ipucunda (title) durur; hiçbir bilgi kalkmadı.

   Eylem adları modüllerin var olan işleyicileridir: signal-answer
   (cevap #sig-answer'dan okunur) ve signal-dismiss. Sinyalin kendisini ve
   «görüldü» damgasını modül yönetir; bu dosya yalnız çizer.

   2026-10-16 («kalabalık, kafa karıştırıyor»): Bugün'de ikinci bir yazı
   kutusu açık durmaz. Soru ve iki düğme görünür: «Cevapla» kutuyu açar,
   «Uymuyor» kapatır. Cevap yine isteğe bağlıdır. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.SORUKART = (function(){
  'use strict';
  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  /* sig: { id, title, question, kind, answeredAt, answer } */
  function kartHtml(sig){
    if(!sig || !sig.question) return '';
    const ipucu = (sig.kind === 'friction' ? 'Sürtünme' : 'Gösterge') + (sig.title ? ': ' + sig.title : '');
    const id = kac(sig.id || '');
    return '<div class="sorukart" data-sorukart="' + id + '">'
      + '<div class="sorukart__bas" title="' + kac(ipucu) + '">Sana bir soru</div>'
      + '<p class="sorukart__soru">' + kac(sig.question) + '</p>'
      + (sig.answeredAt
        ? '<p class="sorukart__cevap">Cevabın: ' + kac(sig.answer || '—') + '</p>'
          + '<p class="sorukart__not">Bir sonraki ölçümde bu ayrışmanın kapanıp kapanmadığına bakılacak.</p>'
        : '<div class="sorukart__satir">'
          + '<details class="sorukart__ac"><summary class="btn btn--sm btn--primary"><span class="btn__label">Cevapla</span></summary>'
          + '<div class="sorukart__acik">'
          + '<input class="sorukart__girdi" id="sig-answer" type="text" autocomplete="off" placeholder="Kısa cevabın (isteğe bağlı)" aria-label="Kısa cevabın"/>'
          + '<button type="button" class="btn btn--sm btn--primary" data-act="signal-answer" data-id="' + id + '"><span class="btn__label">Kaydet</span></button>'
          + '</div></details>'
          + '<button type="button" class="btn btn--sm btn--ghost" data-act="signal-dismiss" data-id="' + id + '"><span class="btn__label">Uymuyor</span></button>'
          + '</div>')
      + '</div>';
  }
  return { kartHtml };
})();
