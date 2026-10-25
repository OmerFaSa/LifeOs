/* SEMPTOM SOZLUGU — gunun tarif edilebilir hali.

   Gunlukte serbest metin bir not vardi, YAPI YOKTU. Oysa hekim
   ciktisinin en cok isine yarayacak bolum budur ve sistemin kendi veri
   sozlugunde su cumle zaten yazili:

     «Ferritin kan degeri deponun yalnizca %1'ini gosterir;
      kramp ve uyku sikayeti degerden onemlidir.»

   Serbest metin arama yapilamaz, sayilamaz, egilime donmez. Yapili
   semptom uc sey kazandirir:

     1. Hekim ciktisinda «son 30 gunde 12 gun bas agrisi» yazar.
     2. Bir olcumle BIRLIKTE okunabilir: dusuk ferritin + yorgunluk.
     3. Bir ilac baslangicindan SONRA artan sikayet gorunur olur.

   ─────────────────────────────────────────────────────────────────

   DEGISMEZLER:

   · Sistem TESHIS KOYMAZ. Bir semptom bir bulgudur, bir hastalik degil.
     Sozlukteki `hint` alani «su olcumle birlikte okunur» der, «su
     hastaliktir» demez.
   · Semptom yoklugu VERI DEGILDIR. Isaretlenmemis bir gun «sikayet
     yok» demek degil «girilmemis» demektir — eksik veri sifir
     sayilmaz kuralinin semptom tarafi.
   · Siddet KULLANICININDIR. 1-3 arasi bir sayi; sistem bunu baska bir
     olcumden turetmez. */

window.SP = window.SP || {};

SP.SYMPTOM_GROUPS = [
  { id:'genel',   name:'Genel' },
  { id:'sindirim', name:'Sindirim' },
  { id:'kas',     name:'Kas ve eklem' },
  { id:'zihin',   name:'Zihin ve uyku' },
];

SP.SYMPTOMS = [
  { id:'yorgunluk', name:'Olağandışı yorgunluk', aliases:['olağandışı yorgun', 'aşırı yorgun', 'halsiz'], group:'genel',
    markers:['ferritin', 'hgb', 'tsh', 'vitd', 'b12'],
    hint:'Demir deposu, tiroit ve B12 ile birlikte okunur.' },
  { id:'bas-agrisi', name:'Baş ağrısı', aliases:['baş ağrı', 'başım ağrı'], group:'genel',
    markers:['sbp', 'dbp', 'hgb'],
    hint:'Tansiyon ve hemoglobin ile birlikte okunur.' },
  { id:'bas-donmesi', name:'Baş dönmesi', aliases:['baş dön', 'başım dön'], group:'genel',
    markers:['hgb', 'ferritin', 'sbp'],
    hint:'Ayağa kalkarken oluyorsa tansiyonla birlikte okunur.' },
  { id:'carpinti', name:'Çarpıntı', aliases:['çarpıntı', 'kalbim çarp'], group:'genel',
    markers:['tsh', 'ft4', 'hgb', 'rhr'],
    hint:'Tiroit ve hemoglobin ile birlikte okunur.' },
  { id:'nefes-darligi', name:'Nefes darlığı', aliases:['nefes darl', 'nefesim daral'], group:'genel',
    markers:['hgb', 'spo2'],
    hint:'Hemoglobin ve oksijen satürasyonu ile birlikte okunur.' },
  { id:'sogua-hassasiyet', name:'Üşüme', aliases:['üşüme', 'üşüyor', 'üşüdüm'], group:'genel',
    markers:['tsh', 'ft4', 'ferritin'],
    hint:'Tiroit ve demir deposu ile birlikte okunur.' },
  { id:'sac-dokulmesi', name:'Saç dökülmesi', aliases:['saç dökül', 'saçım dökül', 'saçlarım dökül'], group:'genel',
    markers:['ferritin', 'tsh', 'zinc', 'vitd'],
    hint:'Ferritin, tiroit ve çinko ile birlikte okunur.' },

  { id:'sisme', name:'Şişkinlik', aliases:['şişkin', 'karnım şiş'], group:'sindirim',
    markers:['crp'],
    hint:'Öğün kayıtlarıyla birlikte okunur.' },
  { id:'mide-yanmasi', name:'Mide yanması', aliases:['mide yanma', 'midem yan'], group:'sindirim',
    markers:['b12', 'ferritin'],
    hint:'Mide koruyucu kullanımı B12 ve demir emilimini etkiler.' },
  { id:'kabizlik', name:'Kabızlık', aliases:['kabız'], group:'sindirim',
    markers:['tsh', 'mg'],
    hint:'Tiroit, lif alımı ve magnezyum ile birlikte okunur.' },
  { id:'ishal', name:'İshal', aliases:['ishal'], group:'sindirim',
    markers:['crp', 'alb'],
    hint:'Süreklilik kazanırsa inflamasyon belirteçleriyle okunur.' },

  { id:'kramp', name:'Kas krampı', aliases:['kramp'], group:'kas',
    markers:['mg', 'k', 'ca_corr', 'ferritin'],
    hint:'Magnezyum, potasyum ve kalsiyum ile birlikte okunur.' },
  { id:'eklem-agrisi', name:'Eklem ağrısı', aliases:['eklem ağrı', 'eklemlerim ağrı'], group:'kas',
    markers:['crp', 'esr', 'uric', 'vitd'],
    hint:'İnflamasyon belirteçleri ve ürik asit ile birlikte okunur.' },
  { id:'kas-agrisi', name:'Kas ağrısı', aliases:['kas ağrı', 'kaslarım ağrı'], group:'kas',
    markers:['vitd', 'crp'],
    hint:'Antrenman yükü ve D vitamini ile birlikte okunur.' },
  { id:'guc-kaybi', name:'Güç kaybı', aliases:['güç kayb', 'güçsüzlük'], group:'kas',
    markers:['ferritin', 'vitd', 'testo'],
    hint:'Antrenman kayıtlarıyla birlikte okunur.' },

  { id:'uykusuzluk', name:'Uykuya dalamama', aliases:['uykuya dalama', 'uykusuzluk'], group:'zihin',
    markers:['cortisol', 'mg', 'tsh'],
    hint:'Uyku süresi kaydı ve kortizol ile birlikte okunur.' },
  { id:'dikkat', name:'Dikkat dağınıklığı', aliases:['dikkat dağın', 'dikkatim dağı'], group:'zihin',
    markers:['b12', 'ferritin', 'vitd', 'tsh'],
    hint:'B12, demir ve tiroit ile birlikte okunur.' },
  { id:'moral', name:'Moral düşüklüğü', aliases:['moral düşük', 'moralim bozuk', 'moralim düşük'], group:'zihin',
    markers:['vitd', 'b12', 'tsh'],
    hint:'D vitamini ve tiroit ile birlikte okunur. Sürekliyse hekime.' },
];

/* TAKMA ADLAR (2026-10-25; kullanıcı: «spi için daha işlevli veri girişi,
   sürtünmeyi azaltacak teknikler ile daha güzel yap»). Hızlı giriş
   (core/quickentry.js parseSymptom) «başım ağrıyor», «midem yanıyor» gibi
   günlük sözü buradan tanır. Takma ad KÖKTÜR, kelime başında aranır ve ek
   alabilir («baş ağrı» → «baş ağrısı», «baş ağrım»). Yalnız işaretleme
   içindir: söz hiçbir zaman teşhis ya da şiddet üretmez; şiddet yalnız
   kullanıcının «hafif / orta / şiddetli» sözünden gelir. */

SP.SYMPTOM_BY_ID = SP.SYMPTOMS.reduce(function(acc, s){ acc[s.id] = s; return acc; }, {});

/* Siddet: uc basamak yeter. Daha ince bir olcek kullanicidan olmayan
   bir kesinlik ister ve gunluk giris yukunu artirir. */
SP.SYMPTOM_SEVERITY = [
  { value:1, label:'hafif' },
  { value:2, label:'orta' },
  { value:3, label:'şiddetli' },
];

/* Hangi olcumu hangi semptomlar ilgilendirir? Ters indeks. */
SP.SYMPTOM_FOR_MARKER = (function(){
  const m = {};
  SP.SYMPTOMS.forEach(function(s){
    (s.markers || []).forEach(function(id){ (m[id] = m[id] || []).push(s); });
  });
  return m;
})();
