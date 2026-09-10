/* Kaynaklar (yayinlar) — zorluk kademesi ve tur katalogu.

   Bu dosya DEKLARATIFTIR. Olcum ve karar core/sources.js icindedir.

   TOHUM LISTE NEREDEN GELIYOR?
   Uydurulmadi. Uygulamanin ZATEN tasidigi iki yerden derlendi:
     - R.PUBLISHER_LADDER (data/reference.js) — yayin zorluk merdiveni
     - R.SUBJECTS[].sources (data/subjects.js) — ders basina kaynak mimarisi
   Yani kademeler benim yargim degil, sistemin kendi icerigidir. Listede
   olmayan yayini kullanici kendisi ekler.

   VE ASIL OLCU BU DEGIL.
   Etiket bir baslangic noktasidir. Bir kaynagin SANA gore zorlugu, o
   kaynaktan cozdugun sorularda kendi oranindir: genel olarak %75 cozen ama
   bir kitapta %45'te kalan biri icin o kitap zordur — etiketinde ne yazarsa
   yazsin. core/sources.js bunu olcer. */

window.R = window.R || {};

/* Zorluk kademeleri. Sira anlamlidir: merdiven asagidan yukari cikilir. */
R.SOURCE_LEVELS = {
  temel: { id:'temel', order:1, label:'Temel',      tone:'ok',
    note:'Konuyu yeni bitirdiğinde — anlaşılır dil, dengeli seçki.' },
  orta:  { id:'orta',  order:2, label:'Orta',       tone:'info',
    note:'Konu oturduktan sonra günlük çalışma bankası.' },
  ust:   { id:'ust',   order:3, label:'Üst',        tone:'warn',
    note:'Yalnız temel oturduktan sonra. Zor kaynağı bitirmek başarı ölçütü değildir.' },
  resmi: { id:'resmi', order:4, label:'Resmî (ÖSYM)', tone:'danger',
    note:'Sınavın kendi dili. Konu öğrenmek için erken tüketilmez; Mart–Mayıs arasında setlenir.' },
};
R.SOURCE_LEVEL_ORDER = ['temel', 'orta', 'ust', 'resmi'];

R.SOURCE_KINDS = {
  banka:  { id:'banka',  label:'Soru bankası' },
  konu:   { id:'konu',   label:'Konu anlatımı' },
  deneme: { id:'deneme', label:'Deneme' },
  foy:    { id:'foy',    label:'Föy / fasikül' },
};
R.SOURCE_KIND_ORDER = ['banka', 'konu', 'deneme', 'foy'];

/* Tohum liste — uygulamanin kendi kaynak mimarisinden derlendi.
   `from` alani nereden geldigini soyler; kullanici bir kademeyi
   degistirdiginde bunun bir TAHMIN degil, sistemin varsayilani oldugunu
   bilsin diye durur. */
R.SOURCE_SEED = [
  { name:'Hız ve Renk',              level:'temel', kind:'banka',  from:'yayın merdiveni' },
  { name:'Karekök',                  level:'temel', kind:'banka',  from:'TYT Türkçe / Matematik temel' },
  { name:'Antrenmanlarla Matematik', level:'temel', kind:'banka',  from:'TYT Matematik temel' },
  { name:'Palme',                    level:'temel', kind:'konu',   from:'Fen dersleri temel föy' },
  { name:'Acil',                     level:'temel', kind:'konu',   from:'AYT Matematik konu anlatımı' },
  { name:'Biyotik',                  level:'temel', kind:'konu',   from:'Biyoloji temel özet' },
  { name:'Aydın',                    level:'temel', kind:'foy',    from:'Kimya konu föyü' },

  { name:'345',                      level:'orta',  kind:'banka',  from:'yayın merdiveni' },
  { name:'Bilgi Sarmal',             level:'orta',  kind:'banka',  from:'yayın merdiveni' },

  { name:'Orijinal',                 level:'ust',   kind:'banka',  from:'yayın merdiveni' },
  { name:'3D',                       level:'ust',   kind:'banka',  from:'yayın merdiveni' },
  { name:'Endemik',                  level:'ust',   kind:'deneme', from:'yayın merdiveni' },
  { name:'Orbital',                  level:'ust',   kind:'banka',  from:'AYT Fizik seçilmiş test' },

  { name:'ÖSYM çıkmış sorular',      level:'resmi', kind:'deneme', from:'yayın merdiveni' },
];

/* Bir kaynak hakkinda konusmak icin en az kac cozulmus soru gerekir?
   Ev kurali: tek olcumle karar verilmez. Alti sorudan cikan bir oran
   gurultudur; kullaniciya "henuz yeterli kayit yok" denir. */
R.SOURCE_MIN_SAMPLE = 8;

/* Kendi genel oranindan bu kadar sapan bir kaynak "sana gore zor/kolay"
   sayilir. Daha dar bir esik her kaynagi bir yana savururdu. */
R.SOURCE_DELTA = 15;
