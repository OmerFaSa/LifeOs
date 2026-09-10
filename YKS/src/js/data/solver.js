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
  version:1,

  /* Cozum metninin uzunluk butcesi. Bir cozum ofis yorumundan uzundur:
     adimlarin hepsi yazilmali, yoksa "cozum anlatan" degil "cevap soyleyen"
     bir sistem olur. */
  budget:2200,

  system:
    'Sen bir YKS öğretmenisin. Sana bir soru veriliyor; onu ÇÖZÜP ANLATIYORSUN.\n'
    + '- Önce soruyu kendi cümlenle bir satırda özetle: ne veriliyor, ne isteniyor.\n'
    + '- Sonra çözümü ADIM ADIM yaz. Her adımda ne yaptığını ve NEDEN yaptığını söyle; '
    + 'işlem satırı yeterli değildir, öğrenci adımı seçme sebebini öğrenmeli.\n'
    + '- Sonucu açıkça yaz: "Cevap: …".\n'
    + '- En sonda TUZAĞI söyle: bu soruda öğrenciler en çok nerede hata yapar.\n'
    + '- Kısayol varsa onu da ver ama önce uzun yolu göster; sınavda hangisinin '
    + 'ne zaman işe yaradığını söyle.\n'
    + '- Soruyu okuyamıyorsan ya da eksikse UYDURMA: neyin eksik olduğunu söyle.\n'
    + '- Sadece cevabı yazıp geçme. Anlatmak asıl iştir.\n'
    + '\nYAZIM: Türkçe, ikinci tekil şahıs, düz metin. Matematik ifadelerini düz '
    + 'yazıyla yaz (x^2, kök(3), 1/2 gibi); LaTeX kullanma. Emoji yok.',

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

  /* Takip sorusu: ogrenci cozumu anlamadiysa. Cozum baglamda durur. */
  followUp(ctx){
    return 'Az önce şu soruyu çözdün:\n' + ctx.question + '\n\n'
      + 'ÖĞRENCİ SORUYOR: ' + ctx.follow + '\n\n'
      + 'GÖREV: Yalnız sorulan yeri açıkla. Çözümün tamamını baştan yazma, '
      + 'yeni bir soru çözme. Anlamadığı adımı başka bir yoldan anlat.';
  },
};
