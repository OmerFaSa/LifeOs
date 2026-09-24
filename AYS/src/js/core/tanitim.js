/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/tanitim.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* TANITIM ŞERİDİ — ilk kurulumun üç adımı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/tanitim.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi
   `brand/ortak/tanitim.css`.

   ------------------------------------------------------------------
   NEDEN BURADA, HER UYGULAMANIN KENDİ `setup.js`'İNDE DEĞİL

   Üç adımın SIRASI ve SORUSU üçünde de aynı:

       1/3   ne ölçüyoruz
       2/3   neye karar VERMİYORUZ
       3/3   nasıl başlıyoruz

   Değişen yalnız cevaplar. Soruları üç dosyada ayrı ayrı yazmak, bir
   gün birinde ikinci adımın düşmesi demekti — ve düşecek olan adım,
   sistemin SINIRINI söyleyen adımdır (AGENTS.md §1.5).

   ------------------------------------------------------------------
   AFİŞ BİR SÜSTÜR

   Paneller `aria-hidden`: üzerlerindeki yazı ekran okuyucuya görünmez.
   Adımın cümlesi altta GERÇEK metin olarak durur ve her nokta kendi
   adını söyler. Bir resmin içindeki yazıya güvenmek, o yazıyı
   okuyamayan herkesi dışarıda bırakmaktır.

   ------------------------------------------------------------------
   ADIM DEĞİŞİMİ YENİDEN ÇİZMEZ

   `TANITIM_ADIM` doğrudan DOM'a dokunur. Sihirbazı yeniden çizmek,
   kullanıcının o ana kadar yazdığı ad, boy ve kiloyu silmek olurdu —
   bir süsü değiştirmek için formu sıfırlamak. */

window.LIFEOS = window.LIFEOS || {};

/* Üç adımın SORUSU ortak, CEVABI modüle ait. Cevaplar panellerin
   üzerinde yazan cümlelerin aynısıdır: resim ile yazı ayrışırsa
   kullanıcı iki farklı şey okur. */
LIFEOS.TANITIM = {
  sorular:['Ne ölçüyoruz?', 'Neye karar vermiyoruz?', 'Nasıl başlıyoruz?'],
  ays:[
    'Bilgiyi görür, gelişimi ölçeriz.',
    'Senin yerine karar vermeyiz: meslek seçmeyiz, üniversite önermeyiz, hayat planı kurmayız.',
    'Küçük adımlarla büyük sonuçlara — hesabını kur, verini gir, yola çık.',
  ],
  spi:[
    'Gerçek sağlık veride görünür.',
    'Teşhis koymayız, tedavi önermeyiz, ilaç tavsiye etmeyiz, acil müdahale sağlamayız.',
    'Küçük adımlarla büyük bir sen — verini bağla, profilini kur, yola çık.',
  ],
  esp:[
    /* «Potansiyeli keşfederiz» bir yetenek YARGISIDIR — bir sonraki
       cumle «etiketlemeyiz» diyor ve ikisi celisiyordu. Diger uc
       sistemin ilk cumlesi (AYS «gelisimi olceriz», SPI «veride
       gorunur», HKM «karara donusur») hicbiri bir HUKUM kurmuyor,
       yalniz OLCUYOR. ESP'ninki de oyle olmali: gorunmeyen sey
       potansiyel degil, ILERLEME — ve ilerleme olculur, tahmin
       edilmez. */
    'Görünmeyeni görür, gelişimini ölçeriz.',
    'Teşhis koymayız, sertifika vermeyiz, etiketlemeyiz, senin yerine karar almayız.',
    'Verini paylaş, keşfetmeye başla — bağla, çözümle, sonucu gör.',
  ],
  hkm:[
    'Veri, karara dönüşür.',
    'Her şeye değil, doğru şeye karar veririz: teşhis koymaz, sertifika vermez, mutlak doğru sunmaz.',
    'Verini bağla, seçeneklerini keşfet, uygulamaya başla.',
  ],
};

LIFEOS.TANITIM_ADIMLARI = function(mod){
  return LIFEOS.TANITIM[mod] || null;
};

LIFEOS.TANITIM_HTML = function(mod, secenekler){
  secenekler = secenekler || {};
  var kok = secenekler.kok || 'img/marka/';
  var cevaplar = LIFEOS.TANITIM_ADIMLARI(mod);
  /* Bilinmeyen modül için UYDURMA bir şerit çizilmez; hiç çizilmez. */
  if(!cevaplar) return '';
  var sorular = LIFEOS.TANITIM.sorular;
  var kac = function(t){
    return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c];
    });
  };

  var afisler = '', noktalar = '';
  for(var i = 0; i < cevaplar.length; i++){
    var no = i + 1;
    var acik = i === 0;
    afisler += '<img class="tanitim__afis' + (acik ? ' is-acik' : '') + '"'
      + ' data-adim="' + no + '"'
      + ' src="' + kac(kok + 'tanitim-' + mod + '-' + no) + '.webp"'
      + ' alt="" aria-hidden="true" loading="lazy"'
      /* Panel yoksa YALNIZ O PANEL kalkar: kalan ikisi ve noktalar
         durur, şerit çalışmaya devam eder. */
      + ' onerror="this.remove()">';
    noktalar += '<button type="button" class="tanitim__nokta" role="tab"'
      + ' aria-selected="' + (acik ? 'true' : 'false') + '"'
      + ' aria-label="' + no + '/' + cevaplar.length + ' — ' + kac(sorular[i]) + '"'
      + ' data-act="tanitim-adim" data-adim="' + no + '"></button>';
  }

  /* `data-mod` ŞERİDİN ÜZERİNDE durur: adım değişince alttaki cümleyi
     bu okur. Modülü çağıranın hatırlamasına bırakmak, iki yerde iki
     ayrı doğru demekti. */
  return '<div class="tanitim" data-tanitim data-mod="' + kac(mod) + '">'
    + '<div class="tanitim__kare">' + afisler + '</div>'
    + '<div class="tanitim__alt">'
    +   '<p class="tanitim__yazi" data-tanitim-yazi>' + kac(cevaplar[0]) + '</p>'
    +   '<div class="tanitim__noktalar" role="tablist"'
    +     ' aria-label="Tanıtım adımı">' + noktalar + '</div>'
    + '</div></div>';
};

/* Noktaya basınca: panel değişir, nokta işaretlenir, ALTTAKİ CÜMLE de
   değişir. Cümleyi değiştirmemek, resmi değiştirip anlamı sabit
   bırakmak olurdu — ekran okuyucu için hiçbir şey olmamış demektir. */
LIFEOS.TANITIM_ADIM = function(dugme){
  if(!dugme) return false;
  var kutu = dugme.closest ? dugme.closest('[data-tanitim]') : null;
  if(!kutu) return false;
  var no = Number(dugme.getAttribute('data-adim')) || 1;

  var afisler = kutu.querySelectorAll('.tanitim__afis');
  for(var i = 0; i < afisler.length; i++){
    var a = afisler[i];
    var benim = Number(a.getAttribute('data-adim')) === no;
    a.classList.toggle('is-acik', benim);
  }
  var noktalar = kutu.querySelectorAll('.tanitim__nokta');
  for(var j = 0; j < noktalar.length; j++){
    var n = noktalar[j];
    n.setAttribute('aria-selected',
      Number(n.getAttribute('data-adim')) === no ? 'true' : 'false');
  }
  var yazi = kutu.querySelector('[data-tanitim-yazi]');
  var mod = kutu.getAttribute('data-mod');
  var cevaplar = LIFEOS.TANITIM_ADIMLARI(mod);
  if(yazi && cevaplar && cevaplar[no - 1]) yazi.textContent = cevaplar[no - 1];
  return true;
};

/* ------------------------------------------------------------------
   KURULUM ADIMLARI (katalog 171, T5) — ilk açılış ÜÇ ADIMDIR ve üç adım
   tanıtımın kendi üç sorusudur: her adım TEK soru, ilerleme ÜSTTE.

     1/3  Ne ölçüyoruz?          → modülün anlattığı ilk bölüm
     2/3  Neye karar vermiyoruz? → sınır (AGENTS.md §1.5) — atlanamaz
     3/3  Nasıl başlıyoruz?      → form ve «Başla»

   Adım değişimi YENİDEN ÇİZMEZ (yukarıdaki kural): yazılmış ad, boy,
   kilo kaybolmasın diye bölümler baştan çizilir, yalnız görünürlükleri
   değişir. Sekme değildir: noktalar yok, «Devam» ve «Geri» var; ekran
   okuyucu ilerlemeyi `progressbar`dan duyar.

   o.adimlar: [html, html, html] — üç bölümün gövdesi.
   Pencerenin alt çubuğundaki düğmeler `data-kurulum-yalniz="3"` (yalnız
   son adımda) ya da `data-kurulum-degil="3"` (son adımda gizli) taşır. */
LIFEOS.KURULUM_HTML = function(mod, o){
  o = o || {};
  var cevaplar = LIFEOS.TANITIM_ADIMLARI(mod);
  if(!cevaplar) return '';
  var sorular = LIFEOS.TANITIM.sorular;
  var kok = o.kok || 'img/marka/';
  var adimlar = o.adimlar || [];
  var kac = function(t){
    return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c];
    });
  };
  var n = sorular.length;
  var afisler = '', bolumler = '';
  for(var i = 0; i < n; i++){
    var no = i + 1;
    afisler += '<img class="tanitim__afis' + (i === 0 ? ' is-acik' : '') + '" data-adim="' + no + '"'
      + ' src="' + kac(kok + 'tanitim-' + mod + '-' + no) + '.webp" alt="" aria-hidden="true"'
      + ' loading="lazy" onerror="this.remove()">';
    bolumler += '<section class="kurulum__adim" data-kurulum-adim="' + no + '"' + (i === 0 ? '' : ' hidden') + '>'
      + (adimlar[i] || '') + '</section>';
  }
  return '<div class="kurulum" data-kurulum data-mod="' + kac(mod) + '" data-adim="1" data-oz="171">'
    + '<div class="kurulum__ilerleme" role="progressbar" aria-label="Kurulum adımı"'
    +   ' aria-valuemin="1" aria-valuemax="' + n + '" aria-valuenow="1" aria-valuetext="Adım 1 / ' + n + '">'
    +   '<span class="kurulum__sayac" data-kurulum-sayac>Adım 1 / ' + n + '</span>'
    +   '<span class="kurulum__cubuk" aria-hidden="true"><i data-kurulum-cubuk style="width:' + Math.round(100 / n) + '%"></i></span>'
    + '</div>'
    + '<h2 class="kurulum__soru" data-kurulum-soru tabindex="-1">' + kac(sorular[0]) + '</h2>'
    + '<div class="tanitim tanitim--kurulum" data-mod="' + kac(mod) + '">'
    +   '<div class="tanitim__kare">' + afisler + '</div>'
    +   '<p class="tanitim__yazi" data-kurulum-yazi>' + kac(cevaplar[0]) + '</p>'
    + '</div>'
    + bolumler
    + '</div>';
};

/* yon: +1 ileri, -1 geri. Kök bulunamazsa false. */
LIFEOS.KURULUM_GIT = function(dugme, yon){
  var belge = (dugme && dugme.ownerDocument) || document;
  var kok = (dugme && dugme.closest && dugme.closest('[data-kurulum]'))
    || belge.querySelector('[data-kurulum]');
  if(!kok) return false;
  var sorular = LIFEOS.TANITIM.sorular;
  var n = sorular.length;
  var simdi = Number(kok.getAttribute('data-adim')) || 1;
  var no = Math.max(1, Math.min(n, simdi + (yon || 0)));
  kok.setAttribute('data-adim', String(no));

  var bolumler = kok.querySelectorAll('[data-kurulum-adim]');
  for(var i = 0; i < bolumler.length; i++){
    bolumler[i].hidden = Number(bolumler[i].getAttribute('data-kurulum-adim')) !== no;
  }
  var afisler = kok.querySelectorAll('.tanitim__afis');
  for(var j = 0; j < afisler.length; j++){
    afisler[j].classList.toggle('is-acik', Number(afisler[j].getAttribute('data-adim')) === no);
  }
  var cevaplar = LIFEOS.TANITIM_ADIMLARI(kok.getAttribute('data-mod')) || [];
  var soru = kok.querySelector('[data-kurulum-soru]');
  if(soru) soru.textContent = sorular[no - 1];
  var yazi = kok.querySelector('[data-kurulum-yazi]');
  if(yazi) yazi.textContent = cevaplar[no - 1] || '';
  var sayac = kok.querySelector('[data-kurulum-sayac]');
  if(sayac) sayac.textContent = 'Adım ' + no + ' / ' + n;
  var cubuk = kok.querySelector('[data-kurulum-cubuk]');
  if(cubuk) cubuk.style.width = Math.round(100 * no / n) + '%';
  var il = kok.querySelector('[role="progressbar"]');
  if(il){ il.setAttribute('aria-valuenow', String(no)); il.setAttribute('aria-valuetext', 'Adım ' + no + ' / ' + n); }

  /* Pencerenin alt çubuğu kökün DIŞINDA: aynı pencerede aranır. */
  var pencere = kok.closest('.sheet, .overlay, [role="dialog"]') || belge;
  var yalniz = pencere.querySelectorAll('[data-kurulum-yalniz]');
  for(var a = 0; a < yalniz.length; a++){
    yalniz[a].hidden = Number(yalniz[a].getAttribute('data-kurulum-yalniz')) !== no;
  }
  var degil = pencere.querySelectorAll('[data-kurulum-degil]');
  for(var b = 0; b < degil.length; b++){
    degil[b].hidden = Number(degil[b].getAttribute('data-kurulum-degil')) === no;
  }
  /* Odak sorunun başlığına: klavyeyle gelen yeni adımın başından okur. */
  if(soru && yon){ try{ soru.focus({ preventScroll:false }); }catch(e){} }
  return no;
};
