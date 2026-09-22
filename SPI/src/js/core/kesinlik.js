/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/kesinlik.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* KESİNLİK ETİKETİ — dört etiketin adı, görseli ve işaretlemesi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kesinlik.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   `python3 tools/ortak.py --denetle` ayrışmayı yakalar ve CI'da koşar.

   ------------------------------------------------------------------
   NEDEN BU DOSYA VAR

   «Eksik veri sıfır değildir» bu deponun en çok tekrarlanan kuralı
   (AGENTS.md §1.2) ve dört etiketi var:

       ölçüldü · tahmin · hesaplandı · veri yok

   Etiketler üç arayüzün `core/beacon.js` dosyalarında AYRI AYRI
   yazılıydı. Üçü de bugün aynıydı; aynı kalacaklarını söyleyen
   hiçbir şey yoktu. Aynı `measured` birinde «ölçüldü», öbüründe
   başka bir şey gösterseydi, deponun en çok tekrarlanan kuralı
   ekranda ikiye ayrılmış olurdu — ve bu ancak iki ekran yan yana
   konunca fark edilirdi.

   ------------------------------------------------------------------
   GÖRSEL ANLAMI TAŞIR, SÜSLEMEZ

   Dört görselin biçimi tesadüf değil; okunacak şey tam olarak şu:

       ölçüldü      KESİKSİZ halka, dolu yıldız — sayı gerçekten
                    ölçüldü, arkasında bir kayıt var
       tahmin       KESİK halka ve «~» — yaklaşıklık işareti;
                    kullanıcının kendi kestirimi
       hesaplandı   katmanlar — başka sayılardan TÜREDİ, kendisi
                    ölçülmedi
       veri yok     BOŞ merkez, kesik halka — burada bir şey YOK;
                    sıfır değil, yokluk

   Bu yüzden «veri yok» görseli boş bırakılamaz: yokluğu göstermek,
   yokluğu göstermemekten başka bir şeydir. Sıfır ile yokluğu aynı
   çizen bir ekran, kuralın kendisini bozar.

   ------------------------------------------------------------------
   DOSYA YOKSA YAZI KALIR

   `onerror` düğümü kaldırır ve etiketin YAZISI olduğu gibi görünür.
   Görsel bir ektir; anlamı taşıyan şey hâlâ kelimedir. */

window.LIFEOS = window.LIFEOS || {};

/* Sözleşmedeki kimlikler İNGİLİZCEDİR ve öyle kalır: `sync_engine.py`
   ile `certainty.py` bu dört dizeyi bekler. Türkçe olan, ekrana çıkan
   karşılıklarıdır. */
LIFEOS.KESINLIK = [
  { id:'measured',  ad:'ölçüldü',
    ozet:'Gerçekten ölçüldü — arkasında bir kayıt var.',
    gorsel:'etiket-olculdu' },
  { id:'estimated', ad:'tahmin',
    ozet:'Kullanıcının kendi kestirimi; ölçüm değil.',
    gorsel:'etiket-tahmin' },
  { id:'computed',  ad:'hesaplandı',
    ozet:'Başka sayılardan türedi; kendisi ölçülmedi.',
    gorsel:'etiket-hesaplandi' },
  { id:'missing',   ad:'veri yok',
    ozet:'Burada bir şey YOK. Sıfır değil, yokluk.',
    gorsel:'etiket-veri-yok' },
];

LIFEOS.KESINLIK_ILE = function(id){
  for(var i = 0; i < LIFEOS.KESINLIK.length; i++){
    if(LIFEOS.KESINLIK[i].id === id) return LIFEOS.KESINLIK[i];
  }
  return null;
};

/* Etiketin ekrandaki hâli. Bilinmeyen bir kimlik gelirse — sözleşme
   bir gün beşinci bir etiket eklerse — kimliğin KENDİSİ yazılır:
   uydurma bir karşılık göstermek, anlamadığını anlamış gibi yapmaktır
   (AGENTS.md §1.7). */
LIFEOS.KESINLIK_HTML = function(id, secenekler){
  secenekler = secenekler || {};
  var kok = secenekler.kok || 'img/marka/';
  var e = LIFEOS.KESINLIK_ILE(id);
  var ad = e ? e.ad : String(id == null ? '' : id);
  var kac = function(t){
    return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c];
    });
  };
  var gorsel = e
    ? '<img class="kesinlik__im" src="' + kac(kok + e.gorsel) + '.webp"'
      + ' alt="" aria-hidden="true" loading="lazy" onerror="this.remove()">'
    : '';
  return '<span class="kesinlik' + (e ? ' kesinlik--' + kac(e.id) : '') + '"'
    + (e ? ' title="' + kac(e.ozet) + '"' : '') + '>'
    + gorsel + '<span class="kesinlik__ad">' + kac(ad) + '</span></span>';
};
