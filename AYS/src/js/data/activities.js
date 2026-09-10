/* Meşgale kataloğu — mola ve denge önerileri.

   Amac: molayi "telefonu ac" refleksinden cikarip, enerjiyi geri getiren
   kisa ve somut bir eyleme baglamak. Her ogenin uc etiketi vardir:

     minutes : tipik sure (5 / 10 / 15 / 25)
     energy  : 'low'  → yorgunken de yapilabilir, enerji verir
               'mid'  → notr, ritmi korur
               'high' → enerji ister, iyi hissedince yapilir
     kind    : 'beden' | 'zihin' | 'yaratici' | 'sosyal' | 'dinlenme'

   Kural: hicbiri ekran onunde gecen bir eylem degildir. Uyku bir mesgale
   degildir; uykudan feda edilerek calisma onerilmez (FORBIDDEN). */

window.R = window.R || {};

R.ACTIVITIES = [
  /* --- beden: kan dolasimini ve duruşu toparlar --- */
  { id:'walk-short',   name:'Kısa yürüyüş',            minutes:10, energy:'low',  kind:'beden',
    note:'Dışarı çık, telefonu bırak. Yürürken az önce çalıştığın konuyu kendine anlat.' },
  { id:'stretch',      name:'Boyun–omuz esnetme',      minutes:5,  energy:'low',  kind:'beden',
    note:'Masa başı ağrısının en ucuz ilacı. Beş hareket, her biri 30 saniye.' },
  { id:'stairs',       name:'Merdiven turu',           minutes:5,  energy:'high', kind:'beden',
    note:'Nabzı hızlıca yükseltir; uykulu hissettiğin blok arasında işe yarar.' },
  { id:'pushups',      name:'Şınav / squat seti',      minutes:5,  energy:'high', kind:'beden',
    note:'Tek set, zorlanmadan. Amaç antrenman değil, uyanmak.' },
  { id:'posture',      name:'Duruş sıfırlama',         minutes:5,  energy:'low',  kind:'beden',
    note:'Ayağa kalk, omuzları geriye al, 20 kez derin nefes alarak dolaş.' },
  { id:'eyes',         name:'Göz dinlendirme (20-20-20)', minutes:5, energy:'low', kind:'beden',
    note:'20 saniye boyunca 6 metre uzağa bak. Ekran ve kitap sonrası göz yorgunluğunu kırar.' },

  /* --- zihin: dikkati toplar, yeniden odaklanmayı kolaylaştırır --- */
  { id:'breathe',      name:'Nefes (4-7-8)',           minutes:5,  energy:'low',  kind:'zihin',
    note:'4 sayıda al, 7 tut, 8’de ver. Sınav kaygısı yükseldiğinde ilk basamak.' },
  { id:'brain-dump',   name:'Kafa boşaltma',           minutes:5,  energy:'low',  kind:'zihin',
    note:'Aklını kurcalayan ne varsa kağıda yaz. Yazınca çalışma bloğuna dönmek kolaylaşır.' },
  { id:'tidy',         name:'Masayı toparla',          minutes:5,  energy:'mid',  kind:'zihin',
    note:'Bir sonraki bloğun kaynağını hazırla, gerisini kaldır.' },
  { id:'recall-walk',  name:'Anlatarak tekrar',        minutes:10, energy:'mid',  kind:'zihin',
    note:'Son çalıştığın konuyu boş bir odaya yüksek sesle anlat. Takıldığın yer eksiğindir.' },
  { id:'plan-next',    name:'Sıradaki bloğu netleştir', minutes:5, energy:'low',  kind:'zihin',
    note:'“Ne çalışacağım?” sorusunu molada çöz ki blok başında zaman kaybetme.' },

  /* --- yaratici: zihni tamamen baska bir moda alir --- */
  { id:'instrument',   name:'Çalgı çal',               minutes:15, energy:'mid',  kind:'yaratici',
    note:'Ders dışı bir beceriye dokunmak, çalışma yorgunluğunu gerçekten sıfırlar.' },
  { id:'draw',         name:'Çizim / karalama',        minutes:10, energy:'low',  kind:'yaratici',
    note:'İyi çizmek gerekmiyor. Elin başka bir iş yapması dikkati tazeler.' },
  { id:'write',        name:'Serbest yazı',            minutes:10, energy:'low',  kind:'yaratici',
    note:'Günün nasıl geçtiğini üç cümleyle yaz. Pazar review’unda işine yarar.' },
  { id:'cook',         name:'Bir şeyler hazırla',      minutes:15, energy:'mid',  kind:'yaratici',
    note:'Çay, meyve, basit bir atıştırmalık. Ayakta geçen 15 dakika.' },
  { id:'music',        name:'Sözsüz müzik dinle',      minutes:10, energy:'low',  kind:'yaratici',
    note:'Sözlü müzik dil merkezini meşgul eder; molada sözsüz olan daha çok dinlendirir.' },

  /* --- sosyal: yalnizlasmayi engeller --- */
  { id:'call',         name:'Kısa telefon / sohbet',   minutes:10, energy:'mid',  kind:'sosyal',
    note:'Bir kişiyle konuş. Uzun sürmesin; molayı bitirme saatini önceden söyle.' },
  { id:'family',       name:'Evde sohbet',             minutes:10, energy:'low',  kind:'sosyal',
    note:'Aynı evdekilerle 10 dakika. Ders konuşulmaz.' },
  { id:'teach',        name:'Birine anlat',            minutes:15, energy:'high', kind:'sosyal',
    note:'Bugün öğrendiğin tek şeyi birine anlat. Hem mola hem tekrar.' },

  /* --- dinlenme: hicbir sey yapmamak da bir secenektir --- */
  { id:'nap',          name:'Kısa şekerleme',          minutes:25, energy:'low',  kind:'dinlenme',
    note:'En fazla 25 dakika ve 16:00’dan önce. Gece uykusunun yerine geçmez.' },
  { id:'sun',          name:'Güneş / balkon',          minutes:10, energy:'low',  kind:'dinlenme',
    note:'Gün ışığı uyku ritmini sabitler; özellikle sabah bloklarından sonra.' },
  { id:'water',        name:'Su ve atıştırmalık',      minutes:5,  energy:'low',  kind:'dinlenme',
    note:'Susuzluk dikkat kaybının en sık ve en kolay çözülen nedenidir.' },
  { id:'shower',       name:'Duş / yüz yıkama',        minutes:10, energy:'mid',  kind:'dinlenme',
    note:'Uzun bloklardan sonra zihni fiziksel olarak sıfırlar.' },
  { id:'nothing',      name:'Hiçbir şey yapma',        minutes:5,  energy:'low',  kind:'dinlenme',
    note:'Ekransız, sessiz, beş dakika. Boşluk da bir işlemdir.' },
];

R.ACTIVITY_KINDS = {
  beden:     { label:'Beden',     note:'Kan dolaşımı ve duruş' },
  zihin:     { label:'Zihin',     note:'Dikkati toplar' },
  yaratici:  { label:'Yaratıcı',  note:'Farklı bir moda geçirir' },
  sosyal:    { label:'Sosyal',    note:'Yalnızlaşmayı önler' },
  dinlenme:  { label:'Dinlenme',  note:'Gerçekten durmak' },
};

R.ENERGY_LEVELS = {
  low:  { label:'Düşük enerji', note:'Yorgunken de yapılabilir' },
  mid:  { label:'Orta',         note:'Ritmi korur' },
  high: { label:'Yüksek',       note:'İyi hissedince' },
};

/* Gunluk enerji girisi — 1..5 arasi tek soru. */
R.ENERGY_SCALE = [
  { value:1, label:'Bitkin',  note:'Minimum güne düş' },
  { value:2, label:'Düşük',   note:'Hedefi biraz kıs' },
  { value:3, label:'Normal',  note:'Plan uygulanabilir' },
  { value:4, label:'İyi',     note:'Zor konuyu buraya koy' },
  { value:5, label:'Yüksek',  note:'Tam deneme için uygun gün' },
];

/* Mola suresi, blok uzunluguna gore onerilir (Pomodoro degil, blok temelli). */
R.BREAK_RULE = {
  shortAfterMin: 50,    // 50 dk altindaki blok sonrasi
  shortMin: 5,
  longMin: 15,
  maxPerDay: 6,         // bunun ustunde mola, mola degil kacinmadir
};
