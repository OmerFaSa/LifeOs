/* KATALOG SİMGESİ — bir kimliği, o kimliğin görseline çeviren tek yer.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/simge.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Biçimi `brand/ortak/simge.css`.

   ------------------------------------------------------------------
   NE YAPAR

   Üç ailenin görselleri KATALOGTAKİ KİMLİKLE adlandırıldı:

       olcum-sbp.webp        SPİ  `xpsayim.js` → OLCUM
       disiplin-lang.webp    ESP  `rules.js`   → DISCIPLINES
       ders-tyt-turkce.webp  AYS  `subjects.js` → SUBJECTS

   Yani ekranın yapması gereken tek şey kimliği vermek. Dosya adını
   ekranın kurması, aynı kuralı her ekranda yeniden yazmak olurdu ve
   biri bir gün `ders_tyt_turkce` yazardı.

   ------------------------------------------------------------------
   BİLİNMEYEN AİLE İÇİN GÖRSEL İSTENMEZ

   `aile` tanınmıyorsa ya da kimlik bir dosya adı olamayacak
   karakterler taşıyorsa BOŞ döner. Var olmayacağı bilinen bir dosyayı
   istemek, her açılışta bir 404 demektir — bu depoda bir kez yaşandı
   (`rozet-N.png`, altı istek, hiç üretilmemiş dosya).

   ------------------------------------------------------------------
   SİMGE BİR SÜSTÜR

   `aria-hidden` ve `alt=""`: yanında duran YAZI zaten aynı şeyi
   söylüyor. Ekran okuyucuya ikinci kez okutmak, listeyi iki katı
   uzatmaktan başka bir şey yapmazdı. Dosya yoksa `onerror` düğümü
   kaldırır ve yazı olduğu gibi kalır. */

window.LIFEOS = window.LIFEOS || {};

/* Tanınan aileler ve ne oldukları. `tools/marka.py` içindeki AILELER
   ile aynı adlar; oradaki liste dosyayı NEREYE koyacağını, buradaki
   ekranın NEYİ isteyebileceğini söyler. */
LIFEOS.SIMGE_AILE = {
  olcum:    'SPİ ölçüm alanları',
  disiplin: 'ESP disiplinleri',
  ders:     'AYS dersleri',
  simge:    'genel ikon seti',
};

/* Dosya adı olabilecek kimlik: küçük harf, rakam ve tire. Nokta,
   eğik çizgi ve boşluk YOK — `img/marka/` ucu bir dizin gezinme
   kapısı değildir (bkz. `_ortak_marka_yolu`). */
var SIMGE_KIMLIK = /^[a-z0-9]+(-[a-z0-9]+)*$/;

LIFEOS.SIMGE_ADI = function(aile, id){
  if(!LIFEOS.SIMGE_AILE[aile]) return null;
  var k = String(id == null ? '' : id).toLowerCase();
  if(!SIMGE_KIMLIK.test(k)) return null;
  /* KÜNYE — dosya GERÇEKTEN var mı.

     Katalogda olup görseli gelmemiş bir kimlik, her açılışta bir 404
     demektir. Bir kez yaşandı: ESP katalogunda yedi disiplin var,
     teslimatta altı geldi ve `disiplin-music.webp` her açılışta
     arandı. Tek tek istisna yazmak çözüm değildi — görsel geldiği gün
     o istisnanın kaldırılmasını kimse hatırlamaz.

     Künye `brand/medya/` altında ne varsa onu yazar ve
     `tools/marka.py --kunye` üretir. Künye hiç yüklenmemişse eski
     davranış sürer: isteyen ister, `onerror` toplar. */
  var kunye = LIFEOS.MEDYA;
  if(kunye && kunye[aile] && kunye[aile].indexOf(k) < 0) return null;
  return aile + '-' + k;
};

LIFEOS.SIMGE_HTML = function(aile, id, secenekler){
  secenekler = secenekler || {};
  var ad = LIFEOS.SIMGE_ADI(aile, id);
  if(!ad) return '';
  var kok = secenekler.kok || 'img/marka/';
  var boy = secenekler.boy === 'lg' ? ' simge--lg'
    : secenekler.boy === 'sm' ? ' simge--sm' : '';
  var kac = function(t){
    return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c];
    });
  };
  return '<img class="simge simge--' + kac(aile) + boy + '"'
    + ' src="' + kac(kok + ad) + '.webp"'
    + ' alt="" aria-hidden="true" loading="lazy" onerror="this.remove()">';
};

/* Simge + yazı, yan yana. Yazı KAÇIRILIR; simge yoksa yalnız yazı
   kalır ve hizalama bozulmaz (`.simgeli` bir esnek kutudur). */
LIFEOS.SIMGELI = function(aile, id, yazi, secenekler){
  var kac = function(t){
    return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c];
    });
  };
  return '<span class="simgeli">' + LIFEOS.SIMGE_HTML(aile, id, secenekler)
    + '<span class="simgeli__yazi">' + kac(yazi) + '</span></span>';
};
