/* Soru cozucu — soruyu okur, cozer, anlatir ve olcer.

   Bu dosya DEKLARATIFTIR: istemler, zorluk olcegi ve cikti sozlesmesi
   burada durur. Kayit, dogrulama ve istatistik core/solver.js icindedir.

   ILKE (ofisle ayni): model UYDURAMAZ, kural motoru dogrular.
   Cozum metni modelden gelir — orada mecburuz, bir soruyu cozmek hesap
   isidir — ama modelin bildirdigi ders/konu KAPALI KATALOGDAN secilir
   (R.SUBJECTS), zorluk KAPALI OLCEKTEN gelir, ve ikisi de kural
   motorunda dogrulanir. Uydurma konu adi kayda GIRMEZ.

   Neden bu onemli: bu kayitlar konu takibini, risk siralamasini ve kaynak
   zorlugunu besliyor. Uydurulmus tek bir konu adi, butun o hesabi sessizce
   bozar. */

window.R = window.R || {};

/* Zorluk olcegi. Bes kademe: modelden gelen tahmin de, kullanicinin kendi
   isareti de bu olcege oturur; ikisi ayni dilde konusmali ki karsilastirma
   anlamli olsun. */
R.DIFFICULTY = {
  1:{ n:1, label:'Çok kolay', short:'ÇK', note:'Tanım/doğrudan uygulama' },
  2:{ n:2, label:'Kolay',     short:'K',  note:'Tek adımlı' },
  3:{ n:3, label:'Orta',      short:'O',  note:'İki-üç adım, standart kalıp' },
  4:{ n:4, label:'Zor',       short:'Z',  note:'Çok adımlı ya da kurulum isteyen' },
  5:{ n:5, label:'Çok zor',   short:'ÇZ', note:'Ayırt edici; sınavda az sayıda çıkar' },
};
R.DIFFICULTY_ORDER = [1, 2, 3, 4, 5];

/* Sorunun cozulup cozulmedigi. "Bakmadan cozdum" ile "cozume baktim"
   arasindaki fark, konu takibi icin en degerli bilgidir. */
R.SOLVE_RESULTS = {
  dogru:  { id:'dogru',  label:'Kendim çözdüm',      tone:'ok' },
  zorla:  { id:'zorla',  label:'Zorlanarak çözdüm',  tone:'warn' },
  yanlis: { id:'yanlis', label:'Yanlış yaptım',      tone:'danger' },
  bos:    { id:'bos',    label:'Boş bıraktım',       tone:'danger' },
  bakarak:{ id:'bakarak',label:'Çözüme baktım',      tone:'info' },
};
R.SOLVE_RESULT_ORDER = ['dogru', 'zorla', 'yanlis', 'bos', 'bakarak'];

R.SOLVER = {
  version:2,

  /* Cozum metninin uzunluk butcesi. Bir cozum ofis yorumundan uzundur:
     adimlarin hepsi yazilmali, yoksa "cozum anlatan" degil "cevap soyleyen"
     bir sistem olur. */
  budget:2200,

  /* ---------- ogretmen ustubu ----------

     Ilk surumde "adim adim yaz" demek yetmedi: model uc satirlik islem
     dokuyor ve "adim adim yazdim" sayiyordu. Ogretmen ile cozum makinesi
     arasindaki fark ADIM SAYISI degil, her adimda NEDEN'in soylenmesidir.

     Bu yuzden istem artik adimin BICIMINI dayatiyor: her adim bir baslikla
     baslar, once niye o adimin atildigi soylenir, sonra islem yapilir.
     Bicim zorlamasi olmadan model en kisa yoldan cevaba kosuyor. */
  system:
    'Sen deneyimli bir YKS öğretmenisin. Karşındaki öğrenci soruyu ÇÖZEMEDİ; '
    + 'senin işin cevabı söylemek değil, onu çözebilir hâle getirmek.\n\n'
    + 'ÇÖZÜMÜN BİÇİMİ — buna harfiyen uy:\n'
    + '1) "Soru ne diyor?" — tek cümlede: ne veriliyor, ne isteniyor.\n'
    + '2) "Nereden başlanır?" — bu soruyu görünce ilk hangi bilgi akla gelmeli, '
    + 'neden o. Öğrencinin en çok takıldığı yer burasıdır.\n'
    + '3) "Adım 1", "Adım 2", … — her adım kendi başlığıyla başlar ve İKİ parça '
    + 'taşır: önce NEDEN bu adımı attığın (tek cümle), sonra işlemin kendisi. '
    + 'Sadece işlem yazan bir adım eksiktir.\n'
    + '4) "Cevap: …" — sonucu tek satırda, açıkça.\n'
    + '5) "Kontrol" — sonucu soruya geri koyup tutup tutmadığına bak. Tutmuyorsa '
    + 'bunu SÖYLE ve nerede hata yaptığını ara.\n'
    + '6) "Tuzak" — bu soruda öğrenciler en çok nerede, neden hata yapar.\n'
    + '7) "Kısayol" — varsa. Önce uzun yolu gösterdin; kısayolun ne zaman '
    + 'güvenli olduğunu da söyle. Yoksa bu başlığı hiç yazma.\n\n'
    + 'KURALLAR:\n'
    + '- Bir adımı atlama. "Buradan görülüyor ki" diye geçme — öğrenci göremiyor, '
    + 'zaten o yüzden soruyor.\n'
    + '- Soruyu okuyamıyorsan ya da eksikse UYDURMA: neyin eksik olduğunu söyle.\n'
    + '- Emin olmadığın bir yer varsa bunu açıkça yaz; sessizce tahmin etme.\n'
    + '\nYAZIM: Türkçe, ikinci tekil şahıs, düz metin. Başlıklar düz satır olarak '
    + 'yazılır (yıldız, kare işareti yok). Matematik ifadelerini düz yazıyla yaz '
    + '(x^2, kök(3), 1/2 gibi); LaTeX kullanma. Emoji yok.',

  /* ---------- bagimsiz denetim ----------

     Modelin kendi cozumunu "kontrol et" demek ise yaramaz: ayni modele ayni
     baglamda sorunca kendi hatasini onaylar (dogrulama yanliligi). Ise
     yarayan tek yol, soruyu SIFIRDAN, ilk cozumu GORMEDEN yeniden
     cozdurmektir — tercihen BASKA bir modele.

     Iki bagimsiz cozum ayni cevaba cikiyorsa guven artar. Cikmiyorsa
     ortada bir hata vardir ve hangisinin hatali oldugunu bulmak icin ucuncu
     bir tur (hakem) gerekir.

     Bu bir GARANTI DEGILDIR: iki model ayni hatayi da yapabilir. Ekran bunu
     "dogrulandi" diye degil, "iki bagimsiz cozum ayni cevaba cikti" diye
     soylemelidir. */
  checkSystem:
    'Sen bir YKS öğretmenisin. Sana bir soru veriliyor. Onu KENDİ BAŞINA çöz.\n'
    + '- Başka birinin çözümünü görmüyorsun; kendi yolundan git.\n'
    + '- Kısa çalış: uzun anlatım isteyen yok, doğru sonuç isteniyor.\n'
    + '- Sonuca ulaşamıyorsan ya da soru eksikse "emin değilim" de. Uydurma.',

  check(ctx){
    return (ctx.question ? 'SORU:\n' + ctx.question + '\n\n'
      : 'Fotoğraftaki soruyu oku ve çöz.\n\n')
      + 'GÖREV: Bu soruyu çöz. Kısa çalışabilirsin ama sonucu doğru bul.\n\n'
      + 'EN SONA, ayrı bir satıra, SADECE şu JSON’u ekle:\n'
      + '{"cevap":"…","emin":true}\n'
      + '- "cevap": yalnız sonuç (şık harfi ya da değer). Emin değilsen yine yaz.\n'
      + '- "emin": sonuçtan emin misin (true/false).';
  },

  /* ---------- hakem ----------
     Iki cozum farkli cevaba ciktiginda hangisinin dogru oldugunu ve
     digerinin TAM OLARAK NEREDE saptigini soyler. Ogrenciye asil ogreten
     kisim burasidir: hatanin nerede oldugunu gormek, dogru cozumu
     okumaktan daha degerlidir. */
  arbiterSystem:
    'Sen bir YKS öğretmenisin ve iki farklı çözüm önüne kondu. İkisi farklı '
    + 'cevaba çıkıyor; en az biri hatalı.\n'
    + '- Soruyu kendin de çöz, sonra karşılaştır.\n'
    + '- Hatalı çözümde hatanın TAM OLARAK hangi adımda başladığını göster.\n'
    + '- "Şurada hata var" demek yetmez: o adımda ne yapılması gerektiğini yaz.\n'
    + '- İkisi de yanlışsa bunu söyle ve doğrusunu sen ver.\n'
    + '- Emin olamıyorsan "karar veremiyorum" de; uydurma bir hakemlik en kötüsüdür.\n'
    + '\nYAZIM: Türkçe, ikinci tekil şahıs, düz metin, kısa. LaTeX ve emoji yok.',

  arbiter(ctx){
    return (ctx.question ? 'SORU:\n' + ctx.question + '\n\n'
      : 'Soru fotoğrafta.\n\n')
      + 'BİRİNCİ ÇÖZÜM (cevabı: ' + ctx.answerA + '):\n' + ctx.solutionA + '\n\n'
      + 'İKİNCİ ÇÖZÜMÜN CEVABI: ' + ctx.answerB + '\n\n'
      + 'GÖREV: Hangi cevap doğru? Yanlış olanda hata hangi adımda başlıyor ve '
      + 'orada ne yapılmalıydı? Kısa yaz.\n\n'
      + 'EN SONA, ayrı bir satıra, SADECE şu JSON’u ekle:\n'
      + '{"dogru":"A|B|hicbiri","dogruCevap":"…","hataAdimi":"…"}\n'
      + '- "dogru": A birinci çözüm, B ikinci cevap, "hicbiri" ikisi de yanlışsa.\n'
      + '- "dogruCevap": senin bulduğun doğru sonuç.\n'
      + '- "hataAdimi": hatanın başladığı adım, tek cümle. Karar veremiyorsan "".';
  },

  /* Cikti sozlesmesi: once ANLATIM, en sonda tek satirlik JSON.
     Ayni desen oneri kutusunda da kullaniliyor (R.Proposals.splitAction):
     ekranda konusma kalir, makine okunacak kisim ayrilir. */
  tail(subjects){
    return '\n\nEN SONA, ayrı bir satıra, SADECE şu JSON’u ekle (başka hiçbir şey yazma):\n'
      + '{"ders":"…","konu":"…","zorluk":1-5,"cevap":"…","tuzak":"…"}\n'
      + '- "ders" ve "konu" AŞAĞIDAKİ LİSTEDEN seçilir; listede yoksa "" bırak, uydurma.\n'
      + '- "zorluk": 1 çok kolay, 3 orta, 5 çok zor.\n'
      + '- "cevap": yalnız sonuç (şık harfi ya da değer).\n'
      + '- "tuzak": en sık yapılan hata, tek cümle.\n\n'
      + 'DERS VE KONU LİSTESİ:\n' + subjects;
  },

  /* Soru metinle geldiginde. */
  ask(ctx){
    const q = String(ctx.question || '').trim();
    return 'SORU:\n' + q + '\n\n'
      + (ctx.note ? 'ÖĞRENCİNİN NOTU: ' + ctx.note + '\n\n' : '')
      + 'GÖREV: Bu soruyu çöz ve anlat.'
      + R.SOLVER.tail(ctx.subjects);
  },

  /* Soru fotografla geldiginde. Gorsel ayri gonderilir; buradaki metin
     yalnizca ne yapilacagini soyler. */
  askImage(ctx){
    return 'Sana bir soru fotoğrafı gönderildi.\n\n'
      + (ctx.note ? 'ÖĞRENCİNİN NOTU: ' + ctx.note + '\n\n' : '')
      + 'GÖREV: Önce fotoğraftaki soruyu OKU ve metnini aynen yaz ("Soru: …" diye). '
      + 'Fotoğrafta birden çok soru varsa yalnız ilkini al. Okuyamadığın bir yer '
      + 'varsa uydurma, "şu kısım okunmuyor" de. Sonra soruyu çöz ve anlat.'
      + R.SOLVER.tail(ctx.subjects);
  },

  /* ---------- sohbet ----------
     Cozum bittiginde is bitmez: ogrenci anlamadigini sormali ve konusma
     DEVAM etmelidir. Tek seferlik "takip sorusu" yetmiyordu; artik bir
     sohbet basligi var ve gecmis her turda modele geri veriliyor. */
  chatSystem:
    'Sen bir YKS öğretmenisin. Az önce bir soruyu çözüp anlattın; şimdi öğrenci '
    + 'anlamadığı yeri soruyor.\n'
    + '- Yalnız sorulan yeri açıkla. Çözümün tamamını baştan yazma.\n'
    + '- Aynı anlatımı tekrarlama: anlamadıysa demek ki o yol tutmadı, BAŞKA bir '
    + 'yoldan anlat (somut sayı ver, benzer basit bir örnek kur, şekil tarif et).\n'
    + '- Öğrenci "anladım" derse yeni anlatım açma; kısa bir kontrol sorusu sor.\n'
    + '- Konu dışına çıkma, yeni soru çözme.\n'
    + '\nYAZIM: Türkçe, ikinci tekil şahıs, düz metin, en fazla 5 cümle. '
    + 'LaTeX ve emoji yok.',

  chat(ctx){
    return 'ÇÖZDÜĞÜN SORU VE ANLATIMIN:\n' + ctx.solution + '\n\n'
      + 'ÖĞRENCİ SORUYOR: ' + ctx.follow;
  },

  /* Geriye donuk uyumluluk: eski cagiranlar icin. */
  followUp(ctx){
    return R.SOLVER.chat({ solution:ctx.question, follow:ctx.follow });
  },
};
