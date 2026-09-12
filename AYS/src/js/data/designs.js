/* DÜZENLER — seçilebilir tasarım dilleri.

   Palet rengi değiştirir; düzen İSKELETİ değiştirir: gezinmenin nerede
   durduğunu, bir satırın kutu mu çizgi mi olduğunu, neyin büyük neyin
   küçük yazıldığını.

   Beşi de aynı DOM üzerinde çalışır. Ekranlar hangi düzenin seçili
   olduğunu bilmez ve bilmemelidir; yoksa her ekran beş kez yazılırdı.
   Düzen yalnız `:root[data-design]` altındaki CSS'tir (designs.css).

   İki değişmez düzenden düzene geçmez:
     · durum renkleri (referans altı / hedefte) hiçbir düzende değişmez
     · kesinlik etiketleri (ölçüldü / tahmin) hiçbir düzende gizlenmez */

window.R = window.R || {};

R.DESIGNS = [
  { id:'defter', name:'Defter',
    note:'Varsayılan — solda künye sütunu, kutusuz satırlar, ince çizgiler',
    swatch:'lines' },

  { id:'odak', name:'Odak',
    note:'Ekranda tek bir büyük sayı; gerisi ikinci planda durur',
    swatch:'single' },

  { id:'kraft', name:'Kraft',
    note:'Kâğıt dokusu ve daktilo künyesi — el defteri sıcaklığı',
    swatch:'paper' },

  { id:'katmanli', name:'Katmanlı',
    note:'Bölümler sol kenar çubuğuna iner; masaüstü yazılımı düzeni',
    swatch:'rail' },

  { id:'harita', name:'Harita',
    note:'Satırlar noktalı tuval üstünde düğüm kartlara döner',
    swatch:'nodes' },
];

R.DEFAULT_DESIGN = 'defter';

R.DESIGN_BY_ID = R.DESIGNS.reduce((m, d) => { m[d.id] = d; return m; }, {});
