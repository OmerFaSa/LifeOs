/* Okuma yöntemi — dört düzey, not şablonları, okuma protokolü.

   «Okudum» cümlesi ölçülebilir bir şey söylemez: göz gezdirmek de okumaktır,
   bir bölümü üç kez dönüp çıkarmak da. Bu dosya ikisini ayıran dili tutar.

   Dört düzey Mortimer Adler'in ayrımından gelir ve burada bir OTORITE
   olarak değil bir ÖLÇEK olarak kullanılır: hangi düzeyde okuduğunu bilmek,
   ne kadar okuduğunu bilmekten daha çok şey söyler. */

window.ESP = window.ESP || {};

ESP.READING_LEVELS = [
  { id:'temel', rank:1, label:'Temel okuma',
    q:'Cümle ne diyor?',
    note:'Dili çözmek. Yabancı dilde okurken çoğu zaman buradadır.' },
  { id:'gozden', rank:2, label:'Gözden geçirme',
    q:'Bu kitap ne hakkında ve okumaya değer mi?',
    note:'İçindekiler, giriş, sonuç, rastgele iki paragraf. On beş dakika. '
       + 'Kitabı bırakma kararı burada verilir — yarısında değil.' },
  { id:'analitik', rank:3, label:'Analitik okuma',
    q:'Yazar ne iddia ediyor, nasıl savunuyor, nerede haklı?',
    note:'Tek kitabı sonuna kadar anlamak. Atomik notların çoğu buradan çıkar.' },
  { id:'sentopik', rank:4, label:'Sentopik okuma',
    q:'Bu soruya farklı yazarlar ne diyor?',
    note:'Kitap değil SORU merkezdedir. En zor ve en verimli düzey.' },
];

/* Analitik okumanın dört sorusu. Bir kitabı bitirdikten sonra cevaplanmayan
   soru, okunmamış bir bölüm kadar eksiktir. */
ESP.ANALYTIC_QUESTIONS = [
  { id:'ne', q:'Kitap bir bütün olarak ne hakkında?',
    note:'Tek cümlede söyleyemiyorsan henüz bitmemiştir.' },
  { id:'nasil', q:'Ayrıntıda ne söyleniyor ve nasıl?',
    note:'Ana savı ve onu taşıyan iskeleti çıkar.' },
  { id:'dogru', q:'Kitap doğru mu — tamamı mı, bir kısmı mı?',
    note:'Anlamadan katılmak da karşı çıkmak da okuma değildir.' },
  { id:'ne-olmus', q:'Ne olmuş yani?',
    note:'Doğruysa senin için ne değişiyor? Değişmiyorsa neden okudun?' },
];

/* Not şablonları. Her biri bir SORUYA cevap verir; şablonsuz not, sonradan
   ne için alındığı anlaşılmayan nottur. */
ESP.NOTE_TEMPLATES = [
  { id:'iddia', label:'İddia notu', form:'<yazar> şunu savunuyor: …',
    use:'Bir tezi kaydetmek.' },
  { id:'kanit', label:'Kanıt notu', form:'Bu iddianın dayanağı: …',
    use:'Bir iddiayı taşıyan veriyi ayrı tutmak.' },
  { id:'itiraz', label:'İtiraz notu', form:'Buna şöyle itiraz edilebilir: …',
    use:'Kendi karşı çıkışını kaydetmek.' },
  { id:'tanim', label:'Tanım notu', form:'<kavram> burada şu anlamda: …',
    use:'Kavramın bu metindeki kullanımını sabitlemek.' },
  { id:'baglanti', label:'Bağlantı notu', form:'Bu, <başka yazar>ın şu fikriyle …',
    use:'Sentopik bağın ham hâli.' },
  { id:'soru', label:'Soru notu', form:'Bu beni şunu sormaya götürüyor: …',
    use:'Cevabı henüz olmayan iyi soruyu kaybetmemek.' },
  { id:'alinti', label:'Alıntı notu', form:'«…» (s. …)',
    use:'Kelimesi önemli olan yerler. Az kullanılır: alıntı yığını not değildir.' },
];

/* Okuma protokolü — bir oturumun şekli. */
ESP.READING_PROTOCOL = [
  { step:1, label:'Amaç', do:'Bu oturumda hangi soruyu kovalıyorsun? Bir cümle yaz.' },
  { step:2, label:'Süre', do:'Zamanlayıcıyı kur. Telefon başka odada.' },
  { step:3, label:'İşaretle', do:'Okurken yalnızca işaretle; not yazmak için durma.' },
  { step:4, label:'Çıkar', do:'Oturum sonunda işaretlerinden 3–5 atomik not çıkar.' },
  { step:5, label:'Bağla', do:'Her yeni notu en az bir eski notla bağlamayı dene. '
    + 'Bağ bulamıyorsan zorlama — uydurulmuş bağ, matrisi görünür ama '
    + 'anlamsız yapar.' },
];

/* Kitabı bırakma izni. Bu maddenin varlığı kasıtlı: bitirme zorunluluğu,
   okuma saatinin en büyük düşmanıdır. */
ESP.ABANDON_RULE = 'Bir kitabı bırakmak bir başarısızlık değildir. Gözden '
  + 'geçirme düzeyinde verilen «bu kitap şu an bana gerekmiyor» kararı, '
  + 'yarısında sıkılıp suçluluk duymaktan daha iyidir. Bırakılan kitap '
  + 'kayıtta kalır; bir gün geri dönülür.';
