/* DÜZENLER — seçilebilir tasarım dilleri.

   Palet rengi değiştirir; düzen İSKELETİ değiştirir: gezinmenin nerede
   durduğunu, bir kartın kutu mu çizgi mi olduğunu, neyin büyük neyin
   küçük yazıldığını.

   Beşi de aynı DOM üzerinde çalışır. Ekranlar hangi düzenin seçili
   olduğunu bilmez ve bilmemelidir; yoksa her ekran beş kez yazılırdı.
   Düzen yalnız `:root[data-design]` altındaki CSS'tir (designs.css).

   ─────────────────────────────────────────────────────────────────

   SPİ ile AYNI BEŞ İSİM, AYRI GÖVDE.

   İki uygulamanın kabuğu farklıdır: SPİ defter düzeninde (solda künye
   sütunu), AYS kenar çubuğu düzeninde. Bu yüzden CSS ortak DEĞİLDİR —
   her biri kendi sınıf sözlüğüne yazılır. Ortak olan şey isimler,
   karakterler ve seçim mekanizmasıdır: kullanıcı iki uygulamada aynı
   beş düzeni bulur ve aynı yerden değiştirir.

   İki değişmez düzenden düzene geçmez:
     · durum renkleri (geride / hedefte / riskli) hiçbir düzende değişmez
     · kesinlik ve kaynak etiketleri hiçbir düzende gizlenmez */

window.R = window.R || {};

R.DESIGNS = [
  { id:'panel', name:'Panel',
    note:'Varsayılan — solda kenar çubuğu, kartlı içerik',
    swatch:'panel' },

  { id:'odak', name:'Odak',
    note:'Tek sütun, kenar çubuğu ince şeride iner, başlıklar büyür',
    swatch:'focus' },

  { id:'kraft', name:'Kraft',
    note:'Daktilo harfleri, tek mürekkep, kâğıt zemini',
    swatch:'paper' },

  { id:'katmanli', name:'Katmanlı',
    note:'Koyu kenar çubuğu, açık çalışma alanı',
    swatch:'layers' },

  { id:'harita', name:'Harita',
    note:'Kartlar akan sütunlarda, noktalı zemin',
    swatch:'map' },
];

R.DEFAULT_DESIGN = 'panel';

R.DESIGN_BY_ID = R.DESIGNS.reduce(function(acc, d){ acc[d.id] = d; return acc; }, {});
