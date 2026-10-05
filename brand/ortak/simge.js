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

/* SADE ÇİZGİ (kullanıcı, 2026-10-05: «görseller beyaz temada profesyonel
   gözükmüyor; renkler çok kötü; daha minimalist, daha sade»). Ölçüm, ders
   ve disiplin artık parlak rozet görseli DEĞİL, tek renk ince çizgi
   simgedir (24 px ızgara, 1,75 çizgi, yuvarlak uç): rengi ailenin modül
   mürekkebi (SPİ · AYS · ESP), temaya göre kendiliğinden değişir; dosya
   istenmez, 404 olmaz. Raster yalnız «simge» ailesinde kalır — o aile
   Rütbe ekranlarındadır ve Rütbe olduğu gibi kalır (kullanıcı kararı).
   Çizimler burada, kimlik → yol. Çizimi olmayan kimlik eski yola düşer. */
LIFEOS.SIMGE_CIZIM = {
  olcum:{
    sleep:'<path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z"/>',
    rhr:'<path d="M12 19.8s-7-4.2-7-9.8a4 4 0 0 1 7-2.7 4 4 0 0 1 7 2.7c0 5.6-7 9.8-7 9.8z"/><path d="M8.2 11.2h1.9l1.1-1.9 1.7 3.4 1.1-1.5h1.8"/>',
    hrv:'<path d="M3.5 12h3l2.2-5.5 3.3 11 3-8.5 1.8 3h3.7"/>',
    sbp:'<path d="M4.5 16.5a7.5 7.5 0 1 1 15 0"/><path d="M12 16.5l3.6-4.4"/><path d="M4.5 19.5h15"/>',
    dbp:'<path d="M4.5 16.5a7.5 7.5 0 1 1 15 0"/><path d="M12 16.5l-4.2-2.2"/><path d="M4.5 19.5h15"/>',
    spo2:'<path d="M12 3.6s-6 6.4-6 10.9a6 6 0 0 0 12 0c0-4.5-6-10.9-6-10.9z"/><circle cx="12" cy="14.6" r="2.3"/>',
    temp:'<path d="M10 13.6V5.5a2 2 0 0 1 4 0v8.1a4 4 0 1 1-4 0z"/><path d="M12 9.5v6.2"/>',
    lab:'<path d="M8.5 3.8h7"/><path d="M14.3 3.8v12a2.3 2.3 0 0 1-4.6 0v-12"/><path d="M9.7 11h4.6"/>',
    ogun:'<path d="M7.5 3.8v5.4a2 2 0 0 0 4 0V3.8"/><path d="M9.5 3.8v16.4"/><path d="M17 20.2V3.8c-2 .9-3 3.4-3 6.4v3.3h3"/>',
    train:'<path d="M6.5 7.5v9M17.5 7.5v9M3.8 9.8v4.4M20.2 9.8v4.4M6.5 12h11"/>',
    weight:'<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M8.3 10.2a5.2 5.2 0 0 1 7.4 0"/><path d="M12 11l1.6-1.9"/>',
    waist:'<rect x="3.5" y="8.5" width="17" height="7" rx="1.8"/><path d="M7.2 8.5v2.6M10.4 8.5v2.6M13.6 8.5v2.6M16.8 8.5v2.6"/>',
    water:'<path d="M6.4 4.6h11.2l-1.5 14.1a2 2 0 0 1-2 1.8H9.9a2 2 0 0 1-2-1.8z"/><path d="M7.3 10.4h9.4"/>',
    bodyfat:'<circle cx="12" cy="12" r="8.3"/><path d="M9 15l6-6"/><circle cx="9.4" cy="9.4" r="1"/><circle cx="14.6" cy="14.6" r="1"/>',
  },
  ders:{
    'tyt-turkce':'<path d="M12 6.6C10.2 5.3 7.7 4.6 4.5 4.6v13c3.2 0 5.7.7 7.5 2 1.8-1.3 4.3-2 7.5-2v-13c-3.2 0-5.7.7-7.5 2z"/><path d="M12 6.6v13"/>',
    'tyt-matematik':'<path d="M7.2 4.8v6M4.2 7.8h6M13.8 7.8h6M4.6 15.6l3.6 3.6M8.2 15.6l-3.6 3.6M13.8 15.8h6M13.8 19h6"/>',
    'tyt-fen':'<path d="M9.4 3.8h5.2M10.4 3.8v5.4L5.6 17.8a1.8 1.8 0 0 0 1.6 2.6h9.6a1.8 1.8 0 0 0 1.6-2.6l-4.8-8.6V3.8"/><path d="M7.6 14.6h8.8"/>',
    'tyt-sosyal':'<circle cx="12" cy="12" r="8.3"/><path d="M3.7 12h16.6"/><path d="M12 3.7c2.4 2.5 3.5 5.3 3.5 8.3s-1.1 5.8-3.5 8.3c-2.4-2.5-3.5-5.3-3.5-8.3s1.1-5.8 3.5-8.3z"/>',
    'ayt-matematik':'<path d="M15.6 4.6c-1.7-.6-3.2.3-3.6 2.2l-2 10.4c-.4 1.9-1.9 2.8-3.6 2.2"/><path d="M8.2 11.2h7"/>',
    'ayt-fizik':'<circle cx="12" cy="12" r="1.3"/><ellipse cx="12" cy="12" rx="8.4" ry="3.4"/><ellipse cx="12" cy="12" rx="8.4" ry="3.4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="8.4" ry="3.4" transform="rotate(-60 12 12)"/>',
    'ayt-kimya':'<path d="M12 3.8l7 4v8.4l-7 4-7-4V7.8z"/><circle cx="12" cy="12" r="2.8"/>',
    'ayt-biyoloji':'<path d="M19.4 4.6C10.2 4.6 4.6 9 4.6 15.4c0 1.5.4 2.8 1 3.8 6.6 0 13.8-4 13.8-14.6z"/><path d="M5.6 19.2c2.8-3.9 5.9-6.6 9.8-8.6"/>',
  },
  disiplin:{
    diction:'<rect x="9" y="3.6" width="6" height="10.8" rx="3"/><path d="M5.6 11a6.4 6.4 0 0 0 12.8 0M12 17.4v3"/>',
    history:'<path d="M3.6 9.4L12 4.2l8.4 5.2"/><path d="M5.8 10.2v7.4M9.9 10.2v7.4M14.1 10.2v7.4M18.2 10.2v7.4M3.6 20h16.8"/>',
    lang:'<path d="M3.8 6.4h9M8.3 4.4v2M5.9 6.4c.7 3 2.6 5.3 5.5 6.6M10.9 6.4c-.8 3.3-3 6-6.6 7.6"/><path d="M12.6 20l3.5-8.6 3.5 8.6M13.9 17h4.4"/>',
    philo:'<path d="M9.2 17.8h5.6M10.2 20.6h3.6"/><path d="M12 3.6a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v1.3h5v-1.3c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.6z"/>',
    reading:'<path d="M5.6 4.6h10a3 3 0 0 1 3 3v12.6H8.6a3 3 0 0 1-3-3z"/><path d="M5.6 17.2a3 3 0 0 1 3-3h10"/>',
    writing:'<path d="M15.4 4.6l4 4L8 20H4v-4z"/><path d="M12.9 7.1l4 4"/>',
    music:'<path d="M9 18V5.6l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  },
};

LIFEOS.SIMGE_HTML = function(aile, id, secenekler){
  secenekler = secenekler || {};
  var cizim = LIFEOS.SIMGE_CIZIM[aile];
  var kimlik = String(id == null ? '' : id).toLowerCase();
  if(cizim && LIFEOS.SIMGE_AILE[aile] && SIMGE_KIMLIK.test(kimlik) && cizim[kimlik]){
    var olcu = secenekler.boy === 'lg' ? ' simge--lg' : secenekler.boy === 'sm' ? ' simge--sm' : '';
    return '<svg class="simge simge--cizgi simge--' + aile + olcu + '" viewBox="0 0 24 24" aria-hidden="true"'
      + ' focusable="false">' + cizim[kimlik] + '</svg>';
  }
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
