/* Öğrenme üniteleri — «bir şey öğrenilecek yer».

   ESP şimdiye kadar ÖLÇTÜ ve YÖNLENDİRDİ ama hiçbir şey ÖĞRETMEDİ: kartı
   kullanıcı yazıyor, olayı kullanıcı giriyordu. Boş bir sistemin önündeki
   kullanıcı ise çoğu zaman «ne ekleyeceğim» diye takılır.

   Ünite bu boşluğu doldurur: bir konu, o konunun ölçülebilir hedefi ve
   kartlaşacak somut öğeler. Ünite bir DERS DEĞİLDİR — ESP öğretmen değildir
   (ESP.PEDAGOGIC) — bir BAŞLANGIÇ MALZEMESİDİR. Kullanıcı kendi kartını
   yazdığında sistem onu yeğler; ünite yalnızca boş ekranı kaldırır.

   İki dürüstlük kuralı:

   1. TOHUM, ÖLÇÜM DEĞİLDİR. Üniteden gelen kartlar `seed` etiketi taşır.
      «Bu kartları ben yazmadım» bilgisi kaybolmaz.
   2. OLMAYAN İÇERİK UYDURULMAZ. Sekiz dilin sekizine tam kelime listesi
      yazmak yerine, içeriği olmayan dilde ünite AÇIKÇA boş görünür ve
      kullanıcıdan kendi kartını ister. Yanlış çeviriyle dolu bir ünite,
      boş bir üniteden pahalıdır.

   Ünite ilerlemesi UYDURULMAZ da: «%60 tamamlandı» demek için o ünitenin
   kartlarının SRS'te ne durumda olduğuna bakılır (bkz. core/lesson.js). */

window.ESP = window.ESP || {};

/* --------------------------------------------------------------- dil üniteleri

   `items` yalnızca içeriği yazılabilmiş dillerde doludur. Boş olan ünite
   bir hata değil, dürüst bir boşluktur: konusu ve hedefi durur, malzemesi
   kullanıcıdan gelir. */
ESP.LANG_UNITS = [
  { id:'temel-fiil', level:1, band:'A1', title:'Temel fiiller',
    goal:'En sık kullanılan otuz fiili tanıyıp cümlede kullanmak.',
    task:'Beş fiili kendi cümlende kullan ve kartları «üretimde kullanıldı» işaretle.',
    items:{
      en:[
        { front:'to be', back:'olmak' }, { front:'to have', back:'sahip olmak' },
        { front:'to do', back:'yapmak' }, { front:'to go', back:'gitmek' },
        { front:'to come', back:'gelmek' }, { front:'to want', back:'istemek' },
        { front:'to need', back:'ihtiyaç duymak' }, { front:'to know', back:'bilmek' },
        { front:'to think', back:'düşünmek' }, { front:'to say', back:'söylemek' },
      ],
      de:[
        { front:'sein', back:'olmak' }, { front:'haben', back:'sahip olmak' },
        { front:'machen', back:'yapmak' }, { front:'gehen', back:'gitmek' },
        { front:'kommen', back:'gelmek' }, { front:'wollen', back:'istemek' },
        { front:'brauchen', back:'ihtiyaç duymak' }, { front:'wissen', back:'bilmek' },
        { front:'denken', back:'düşünmek' }, { front:'sagen', back:'söylemek' },
      ],
    } },

  { id:'gundelik', level:1, band:'A1', title:'Gündelik kalıplar',
    goal:'Selamlaşma, rica ve özür kalıplarını düşünmeden kurmak.',
    task:'Bir gün boyunca içinden bu kalıpları kur; akşam hangileri eksikti yaz.',
    items:{
      en:[
        { front:'How are you doing?', back:'Nasıl gidiyor?' },
        { front:'Could you help me?', back:'Yardım eder misin?' },
        { front:'I\'m sorry, I didn\'t catch that.', back:'Pardon, anlayamadım.' },
        { front:'Never mind.', back:'Boş ver.' },
        { front:'It depends.', back:'Duruma göre değişir.' },
        { front:'I\'m on my way.', back:'Yoldayım.' },
      ],
      de:[
        { front:'Wie geht es dir?', back:'Nasılsın?' },
        { front:'Könntest du mir helfen?', back:'Yardım eder misin?' },
        { front:'Entschuldigung, ich habe das nicht verstanden.', back:'Pardon, anlayamadım.' },
        { front:'Macht nichts.', back:'Boş ver.' },
        { front:'Das kommt darauf an.', back:'Duruma göre değişir.' },
      ],
    } },

  { id:'zaman', level:2, band:'A2', title:'Zaman ve sıklık',
    goal:'Geçmiş, şimdi ve gelecek arasında kayma yapmadan anlatmak.',
    task:'Dününü beş cümlede anlat; her cümlede farklı bir zaman kullan.',
    items:{
      en:[
        { front:'yesterday / today / tomorrow', back:'dün / bugün / yarın' },
        { front:'used to', back:'eskiden -erdi' },
        { front:'by the time', back:'-diğinde, o zamana kadar' },
        { front:'as soon as', back:'-er ermez' },
        { front:'hardly ever', back:'neredeyse hiç' },
        { front:'once in a while', back:'ara sıra' },
      ],
      de:[
        { front:'gestern / heute / morgen', back:'dün / bugün / yarın' },
        { front:'früher', back:'eskiden' },
        { front:'sobald', back:'-er ermez' },
        { front:'kaum', back:'neredeyse hiç' },
        { front:'ab und zu', back:'ara sıra' },
      ],
    } },

  { id:'baglac', level:2, band:'B1', title:'Bağlaçlar',
    goal:'İki cümleyi neden, karşıtlık ve koşulla bağlamak.',
    task:'Aynı iki cümleyi üç farklı bağlaçla birleştir; anlam nasıl kayıyor?',
    items:{
      en:[
        { front:'however', back:'ancak, ne var ki' },
        { front:'therefore', back:'bu yüzden' },
        { front:'although', back:'-e rağmen' },
        { front:'unless', back:'-medikçe' },
        { front:'whereas', back:'oysa ki' },
        { front:'in order to', back:'-mek için' },
      ],
      de:[
        { front:'jedoch', back:'ancak' },
        { front:'deshalb', back:'bu yüzden' },
        { front:'obwohl', back:'-e rağmen' },
        { front:'es sei denn', back:'-medikçe' },
        { front:'während', back:'oysa ki' },
      ],
    } },

  { id:'tartisma', level:3, band:'B2', title:'Tartışma dili',
    goal:'Katılmak, kısmen katılmak ve karşı çıkmak için ayrı kalıplar.',
    task:'Bir görüşe önce katıl, sonra aynı görüşe karşı çık; ikisini de yaz.',
    items:{
      en:[
        { front:'I see your point, but…', back:'Ne demek istediğini anlıyorum ama…' },
        { front:'That\'s a fair point.', back:'Haklı bir nokta.' },
        { front:'I\'d argue the opposite.', back:'Tam tersini savunurum.' },
        { front:'to be fair', back:'hakkını yemeyelim' },
        { front:'on the contrary', back:'aksine' },
        { front:'it doesn\'t follow that', back:'bundan şu çıkmaz ki' },
      ],
    } },

  { id:'akademik', level:4, band:'C1', title:'Akademik kayıt',
    goal:'Aynı fikri günlük ve akademik kayıtta ayrı ayrı söylemek.',
    task:'Bir paragrafı günlük dilden akademik kayda çevir, sonra geri çevir.',
    items:{
      en:[
        { front:'to put forward (an argument)', back:'öne sürmek' },
        { front:'with respect to', back:'-e ilişkin olarak' },
        { front:'this suggests that', back:'bu şunu düşündürüyor' },
        { front:'a body of evidence', back:'bir kanıt gövdesi' },
        { front:'to account for', back:'açıklamak, hesabını vermek' },
      ],
    } },
];

/* ------------------------------------------------------------ tarih üniteleri

   Tarih ünitesi kendi olay listesini TAŞIMAZ: tohum olaylardan (data/history.js)
   döneme ve alana göre süzer. İki yerde iki liste tutmak, birinin eskimesi
   demektir. */
ESP.HISTORY_UNITS = [
  { id:'ilkcag', level:1, era:'ilkcag', title:'İlk Çağ iskeleti',
    goal:'Yazıdan Roma\'nın bölünmesine kadar on dönüm noktasını yerine koymak.',
    ask:'Bu dönemde devletin işi neydi ve neden yazıya ihtiyaç duydu?' },
  { id:'ortacag', level:2, era:'ortacag', title:'Orta Çağ',
    goal:'Üç büyük dinin kurumsallaşması, feodalite ve İslam biliminin yükselişi.',
    ask:'Aynı yüzyılda Avrupa ile Orta Doğu arasında ne fark vardı?' },
  { id:'yenicag', level:2, era:'yenicag', title:'Yeni Çağ',
    goal:'Keşifler, matbaa, Reform ve bilim devriminin birbirini nasıl beslediği.',
    ask:'Kopyalama maliyeti düşünce hangi otorite bölündü?' },
  { id:'yakincag', level:3, era:'yakincag', title:'Yakın Çağ',
    goal:'Devrimler, sanayileşme, ulus-devlet ve iki dünya savaşı.',
    ask:'Egemenliğin kaynağı hanedandan ulusa nasıl geçti?' },
  { id:'cagdas', level:3, era:'cagdas', title:'Çağdaş dönem',
    goal:'Soğuk Savaş, dekolonizasyon ve bilgi çağı.',
    ask:'İki kutuplu dünyanın sonu hangi boşluğu bıraktı?' },
  { id:'anadolu', level:2, region:'anadolu', title:'Anadolu ve Türk tarihi',
    goal:'Malazgirt\'ten Cumhuriyet\'e kadarki çizgi.',
    ask:'Hangi kırılma noktasında yön değişti ve neden?' },
  { id:'ekonomi', level:3, kind:'ekonomik', title:'Ekonomi tarihi',
    goal:'Teknoloji, ticaret ve kriz: siyasetin altındaki zemin.',
    ask:'Bu olayların hangisi bir teknolojinin sonucuydu?' },
  { id:'dusunce', level:4, kind:'dusunsel', title:'Düşünce tarihi',
    goal:'Fikirlerin kendi kronolojisi: felsefe, din, bilim.',
    ask:'Bir fikir ne zaman kurum hâline geldi?' },
];

/* Pratik biçimleri — soru TİPLERİ. Motor bunları üretir (core/lesson.js);
   burada yalnızca ne oldukları ve neyi ölçtükleri yazar. */
ESP.PRACTICE_KINDS = [
  { id:'recall', label:'Hatırla', note:'Ön yüz gösterilir, arka yüz yazılır. '
    + 'En zoru ve en çok öğreteni: tanımak değil ÜRETMEK.' },
  { id:'choice', label:'Seç', note:'Dört seçenek arasından doğruyu bulmak. '
    + 'Tanıma ölçer; üretimden kolaydır ve öyle sayılır.' },
  { id:'reverse', label:'Ters', note:'Arka yüzden ön yüze. Aynı kart, ayrı beceri.' },
  { id:'order', label:'Sırala', note:'Dört olayı kronolojik sıraya dizmek. '
    + 'Yalnızca tarih destesinde.' },
  { id:'era', label:'Dönem', note:'Bir olayın hangi döneme düştüğü. '
    + 'Yalnızca tarih destesinde.' },
];

ESP.PRACTICE_BY_ID = ESP.PRACTICE_KINDS.reduce(function(m, k){ m[k.id] = k; return m; }, {});

/* Pratik oturumunun uzunluğu. Sabit ve kısa: bitmeyen bir oturum, yarıda
   bırakılan bir oturumdur ve yarıda bırakılan oturum ölçüm üretmez. */
ESP.PRACTICE_LENGTH = 10;
