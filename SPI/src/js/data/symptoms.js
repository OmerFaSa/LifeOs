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
  { id:'yorgunluk', name:'Olağandışı yorgunluk', group:'genel',
    markers:['ferritin', 'hgb', 'tsh', 'vitd', 'b12'],
    hint:'Demir deposu, tiroit ve B12 ile birlikte okunur.' },
  { id:'bas-agrisi', name:'Baş ağrısı', group:'genel',
    markers:['sbp', 'dbp', 'hgb'],
    hint:'Tansiyon ve hemoglobin ile birlikte okunur.' },
  { id:'bas-donmesi', name:'Baş dönmesi', group:'genel',
    markers:['hgb', 'ferritin', 'sbp'],
    hint:'Ayağa kalkarken oluyorsa tansiyonla birlikte okunur.' },
  { id:'carpinti', name:'Çarpıntı', group:'genel',
    markers:['tsh', 'ft4', 'hgb', 'rhr'],
    hint:'Tiroit ve hemoglobin ile birlikte okunur.' },
  { id:'nefes-darligi', name:'Nefes darlığı', group:'genel',
    markers:['hgb', 'spo2'],
    hint:'Hemoglobin ve oksijen satürasyonu ile birlikte okunur.' },
  { id:'sogua-hassasiyet', name:'Üşüme', group:'genel',
    markers:['tsh', 'ft4', 'ferritin'],
    hint:'Tiroit ve demir deposu ile birlikte okunur.' },
  { id:'sac-dokulmesi', name:'Saç dökülmesi', group:'genel',
    markers:['ferritin', 'tsh', 'zinc', 'vitd'],
    hint:'Ferritin, tiroit ve çinko ile birlikte okunur.' },

  { id:'sisme', name:'Şişkinlik', group:'sindirim',
    markers:['crp'],
    hint:'Öğün kayıtlarıyla birlikte okunur.' },
  { id:'mide-yanmasi', name:'Mide yanması', group:'sindirim',
    markers:['b12', 'ferritin'],
    hint:'Mide koruyucu kullanımı B12 ve demir emilimini etkiler.' },
  { id:'kabizlik', name:'Kabızlık', group:'sindirim',
    markers:['tsh', 'mg'],
    hint:'Tiroit, lif alımı ve magnezyum ile birlikte okunur.' },
  { id:'ishal', name:'İshal', group:'sindirim',
    markers:['crp', 'alb'],
    hint:'Süreklilik kazanırsa inflamasyon belirteçleriyle okunur.' },

  { id:'kramp', name:'Kas krampı', group:'kas',
    markers:['mg', 'k', 'ca_corr', 'ferritin'],
    hint:'Magnezyum, potasyum ve kalsiyum ile birlikte okunur.' },
  { id:'eklem-agrisi', name:'Eklem ağrısı', group:'kas',
    markers:['crp', 'esr', 'uric', 'vitd'],
    hint:'İnflamasyon belirteçleri ve ürik asit ile birlikte okunur.' },
  { id:'kas-agrisi', name:'Kas ağrısı', group:'kas',
    markers:['vitd', 'crp'],
    hint:'Antrenman yükü ve D vitamini ile birlikte okunur.' },
  { id:'guc-kaybi', name:'Güç kaybı', group:'kas',
    markers:['ferritin', 'vitd', 'testo'],
    hint:'Antrenman kayıtlarıyla birlikte okunur.' },

  { id:'uykusuzluk', name:'Uykuya dalamama', group:'zihin',
    markers:['cortisol', 'mg', 'tsh'],
    hint:'Uyku süresi kaydı ve kortizol ile birlikte okunur.' },
  { id:'dikkat', name:'Dikkat dağınıklığı', group:'zihin',
    markers:['b12', 'ferritin', 'vitd', 'tsh'],
    hint:'B12, demir ve tiroit ile birlikte okunur.' },
  { id:'moral', name:'Moral düşüklüğü', group:'zihin',
    markers:['vitd', 'b12', 'tsh'],
    hint:'D vitamini ve tiroit ile birlikte okunur. Sürekliyse hekime.' },
];

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
