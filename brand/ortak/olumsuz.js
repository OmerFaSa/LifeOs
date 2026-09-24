/* OLUMSUZLUK ve KİP SÜZGECİ — cümle ayrıştırıcılarının önündeki kapı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/olumsuz.js`; `tools/ortak.py --yay` ile üç arayüzün
   `src/js/core/` klasörüne birebir kopyalanır.

   Üç arayüzün cümle ayrıştırıcısı sayıyı ve anahtar kelimeyi bulup eylem
   kuruyordu; «bugün 40 soru çözmedim» 40 soru, «7 saat uyumadım» 7 saatlik
   uyku, «diksiyonu kapatma» bölümü kapat oluyordu (ekip/HATALAR.md KR-1).
   HKM bunu `core/dil.py olumsuz()` ile çözmüştü; modüller çözmemişti.

   Sözler:
     1. ÖLÇÜM YALNIZ OLMUŞ BİR ŞEYDİR. Olumsuz («çözmedim», «uyuyamadım»),
        ileriye dönük («çözeceğim», «yarın»), istek ya da hedef
        («istiyorum», «lazım», «hedefim»), soru («çözdüm mü») ya da
        belirsiz («belki») bir cümle ölçüm diye yazılmaz: sorulur
        (AGENTS.md §1.2, §1.7). `olcumEngeli`.
     2. OLUMSUZ BİR İSTEK TERSİNE ÇEVRİLMEZ. «ara vermek istemiyorum»,
        «diksiyonu kapatma» bir değişiklik isteği değildir. Ama bazı
        komutların KENDİSİ olumsuzdur («bugün çalışmayacağım» bir ara
        isteğidir): çağıran o sözleri `haric` ile bildirir. `eylemEngeli`.
     3. EMİN DEĞİLSE ENGELLER. Yanlış bir engel bir soru kadar pahalıdır;
        yanlış bir geçiş sahte bir ölçümdür. Sözlük bu yüzden geniş tutuldu.
     4. SAYI ÜRETMEZ. Yalnız «dur» der ve nedenini söyler; ne yazılacağını
        yine ayrıştırıcı bulur.

   Dönüş: engel yoksa `null`; varsa `{ neden, kelime, soru }`.
   `neden`: 'olumsuz' | 'gelecek' | 'istek' | 'soru' | 'belirsiz'.
   `kelime` cümlede geçtiği biçimiyle (küçük harf); `soru` kullanıcıya
   gidecek cümledir. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Olumsuz = (function(){
  const HARF = 'a-zçğıöşüâîû';
  const KATLA = { 'ç':'c', 'ğ':'g', 'ı':'i', 'ö':'o', 'ş':'s', 'ü':'u', 'â':'a', 'î':'i', 'û':'u' };

  function kucult(s){ return String(s == null ? '' : s).toLocaleLowerCase('tr'); }
  /* Harf harf katlar; uzunluk DEĞİŞMEZ, böylece bulunan kelimenin cümlede
     geçtiği biçimi de geri verilebilir. */
  function katla(s){ return String(s).replace(/[çğıöşüâîû]/g, function(c){ return KATLA[c]; }); }

  function kelimeler(kucuk){
    const out = [];
    const re = new RegExp('[' + HARF + ']+', 'g');
    let m;
    while((m = re.exec(kucuk))) out.push({ ham:m[0], k:katla(m[0]) });
    return out;
  }

  /* ---------------------------------------------------------- olumsuzluk

     Desenler KATLANMIŞ kelimenin tamamında aranır. */
  const OLUMSUZ_EK = [
    /m[ae]d[iu]/,                  /* çözmedim, uyumadım, gelmedi, çözemedik */
    /m[ae]m[iu]s/,                 /* yapmamış, gelmemiş */
    /m[iu]yor/,                    /* çalışmıyorum, istemiyorum */
    /m[ae]y[ae]c[ae][kg]/,         /* çalışmayacağım, gelmeyecek */
    /m[ae]y[ae]c[ae]m$/,           /* çalışmayacam */
    /m[iu]y?c[ae]m$/,              /* çalışmıcam, çalışmıycam */
    /m[ae]zs[ae]/,                 /* yapmazsam */
    /m[ae]z$/,                     /* yapmaz, gelmez */
    /m[ae]y[iu]n$/,                /* kapatmayın */
    /m[ae]s[iu]n$/,                /* kapanmasın, gizlenmesin */
    /m[ae]y[ae]l[iu]m$/,           /* kapatmayalım */
    /^[a-z]{3,}m[ae]m$/,           /* yapamam, istemem, vermem (bkz. IHTIYAC) */
  ];
  /* Desene uyan ama olumsuz olmayan kelimeler. */
  const OLUMSUZ_DEGIL = ['komedi', 'trajikomedi', 'namaz', 'yilmaz', 'hamam', 'tamam', 'imam',
    'yumuyor', 'emiyor', 'gecem', 'hecem'];
  /* «hiç» listede YOK: «hiç ara vermeden 3 saat çalıştım» olumludur;
     «hiç çözmedim»in olumsuzluğu zaten fiildedir. */
  const OLUMSUZ_KELIME = ['degil', 'degilim', 'degildi', 'yok', 'yoktu', 'asla',
    'hayir', 'olmaz', 'olmadi', 'vazgectim', 'vazgec', 'istemem', 'istemez'];
  /* «-mem/-mam» hem olumsuz geniş zaman hem ad olabilir: «ara vermem» ile
     «ara vermem lazım» ayrı şeylerdir. Ardından ihtiyaç sözü gelen
     «-mam/-mem» olumsuz sayılmaz. */
  const IHTIYAC = ['lazim', 'lazimdi', 'gerek', 'gerekiyor', 'gerekli', 'sart'];
  const MAM_RE = /^[a-z]{3,}m[ae]m$/;

  /* Cümle SONUNDAKİ olumsuz emir: «diksiyonu kapatma», «bu hafta ara verme».
     Yalnız sonda aranır, çünkü aynı biçim bir addır da: «okuma», «yazma».
     O yüzden bu iki kelime listede YOK. */
  const EMIR = ['kapatma', 'kapama', 'gizleme', 'kaldirma', 'silme', 'acma', 'degistirme', 'ekleme',
    'verme', 'uygulama', 'yapma', 'koyma', 'baslatma', 'durdurma', 'dokunma', 'ayarlama', 'cikarma',
    'dusurme', 'artirma', 'azaltma', 'getirme', 'tasima', 'erteleme', 'kurma', 'bozma', 'etme'];
  /* Sonda durabilecek dolgu sözleri: «kapatma lütfen», «kapatma sakın». */
  const DOLGU = ['lutfen', 'ha', 'e', 'mi', 'tamam', 'olur', 'mu'];

  function olumsuzEk(k){
    if(OLUMSUZ_DEGIL.indexOf(k) >= 0) return false;
    if(OLUMSUZ_KELIME.indexOf(k) >= 0) return true;
    return OLUMSUZ_EK.some(function(re){ return re.test(k); });
  }

  /* Kelime listesinde ilk olumsuz kelime. */
  function olumsuzBul(ks, emirDe){
    for(let i = 0; i < ks.length; i++){
      const w = ks[i];
      /* «sakın» katlanınca «sakin» olur; katlamadan bakılır. */
      if(w.ham === 'sakın') return w;
      if(!olumsuzEk(w.k)) continue;
      if(MAM_RE.test(w.k) && ks[i + 1] && IHTIYAC.indexOf(ks[i + 1].k) >= 0) continue;
      return w;
    }
    if(emirDe){
      let j = ks.length - 1;
      while(j >= 0 && DOLGU.indexOf(ks[j].k) >= 0) j--;
      if(j >= 0 && EMIR.indexOf(ks[j].k) >= 0) return ks[j];
    }
    return null;
  }

  /* ------------------------------------------------------- kip ve zaman */
  const GELECEK_EK = [
    /[ae]c[ae]g[iu][mz]/,          /* çözeceğim, yapacağız */
    /[ae]c[ae]ks[iu]n/,            /* yapacaksın */
    /[ae]c[ae][mz]$/,              /* yapacam, çözecez */
    /[iu]c[ae][mz]$/,              /* yapıcam, çözücem */
  ];
  const GELECEK_KELIME = ['yarin', 'haftaya', 'birazdan'];
  const ISTEK_KELIME = ['lazim', 'lazimdi', 'gerek', 'gerekiyor', 'sart', 'olsun', 'keske',
    'zorundayim', 'hedef', 'hedefim', 'hedefi', 'hedefimiz', 'hedefliyorum', 'planliyorum', 'planladim'];
  const ISTEK_EK = [/^ist(?:iyor|er|ed|ek)/, /m[ae]l[iu](?:y[iu][mz]|s[iu]n)?$/];
  const SORU_KELIME = /^m[iu](?:y[iu][mz]|s[iu]n|s[iu]n[iu]z|d[iu]r|yd[iu])?$/;
  const BELIRSIZ = ['belki'];

  const SORULAR = {
    olumsuz:function(k){
      return '«' + k + '» olumsuz bir söz; bunu ölçüm diye yazmadım. Yaptığın bir şeyi '
        + 'kaydetmemi istiyorsan «yaptım» biçiminde söyler misin?';
    },
    gelecek:function(k){
      return '«' + k + '» ileriye dönük; henüz olmamış bir şeyi ölçüm diye yazmam. '
        + 'Yaptıktan sonra söylersen kaydederim.';
    },
    istek:function(k){
      return '«' + k + '» bir istek ya da hedef; bunu ölçüm diye yazmadım. '
        + 'Yaptıktan sonra söylersen kaydederim.';
    },
    soru:function(){
      return 'Bu bir soru gibi duruyor; ölçüm diye yazmadım. Kaydetmemi istiyorsan '
        + 'düz bir cümleyle söyler misin?';
    },
    belirsiz:function(k){
      return '«' + k + '» dedin; emin olmadığın bir sayıyı ölçüm diye yazmam. '
        + 'Emin olunca söyler misin?';
    },
    eylem:function(k){
      return '«' + k + '» olumsuz bir söz; istediğinin tersini yapmamak için hiçbir şeyi '
        + 'değiştirmedim. Ne istediğini olumlu bir cümleyle söyler misin?';
    },
  };

  function engel(neden, w, soruAnahtari){
    return { neden:neden, kelime:w ? w.ham : '', soru:SORULAR[soruAnahtari || neden](w ? w.ham : '') };
  }

  /* Ölçüm yazacak bir cümlenin önündeki kapı. */
  function olcumEngeli(metin){
    const kucuk = kucult(metin);
    const ks = kelimeler(kucuk);
    if(!ks.length) return null;
    const ol = olumsuzBul(ks, false);
    if(ol) return engel('olumsuz', ol);
    for(let i = 0; i < ks.length; i++){
      const k = ks[i].k;
      if(GELECEK_KELIME.indexOf(k) >= 0 || GELECEK_EK.some(function(re){ return re.test(k); })){
        if(OLUMSUZ_DEGIL.indexOf(k) < 0) return engel('gelecek', ks[i]);
      }
    }
    for(let i = 0; i < ks.length; i++){
      const k = ks[i].k;
      if(ISTEK_KELIME.indexOf(k) >= 0 || ISTEK_EK.some(function(re){ return re.test(k); })){
        return engel('istek', ks[i]);
      }
    }
    for(let i = 0; i < ks.length; i++){
      if(BELIRSIZ.indexOf(ks[i].k) >= 0) return engel('belirsiz', ks[i]);
    }
    if(/\?\s*$/.test(kucuk) || ks.some(function(w){ return SORU_KELIME.test(w.k); })){
      return engel('soru', null);
    }
    return null;
  }

  /* Tercih değiştirecek bir komutun önündeki kapı. `haric`: komutun
     KENDİSİ olan olumsuz sözler (RegExp ya da dize, ya da ikisinin listesi);
     cümleden çıkarılıp geri kalanına bakılır. */
  function eylemEngeli(metin, opts){
    const o = opts || {};
    let kucuk = kucult(metin);
    const haric = [].concat(o.haric || []);
    haric.forEach(function(h){
      const re = h instanceof RegExp ? new RegExp(h.source, h.flags.indexOf('g') >= 0 ? h.flags : h.flags + 'g')
        : new RegExp('(?<![' + HARF + '])' + kucult(h).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          + '(?![' + HARF + '])', 'g');
      kucuk = kucuk.replace(re, function(m){ return ' '.repeat(m.length); });
    });
    const ks = kelimeler(kucuk);
    if(!ks.length) return null;
    const ol = olumsuzBul(ks, true);
    return ol ? engel('olumsuz', ol, 'eylem') : null;
  }

  return { olcumEngeli, eylemEngeli, katla };
})();
