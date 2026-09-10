/* Ev kurallari — sistemin bozulmaz sinirlari.

   Bu dosya SPI'nin anayasasidir. Ajanlar, ekranlar ve kural motoru buradan
   okur; hicbiri kendi basina bir siniri gevsetemez. Bir kural degisecekse
   burada degisir, tek yerde.

   Uc sinif kural vardir:

     CLINICAL   tibbi sinir. Sistem teshis koymaz, ilac ve doz onermez.
     GROUNDING  halusinasyon engeli. Model serbest sayi uretmez.
     PRIVACY    veri mahremiyeti. Saglik verisi disari cikmaz.

   Ayrica kirmizi bayrak protokolu ve ajanlar arasi celiski cozum sirasi
   burada tanimlidir. */

window.SP = window.SP || {};

SP.CLINICAL = {
  disclaimer:'SPİ bir hekim ya da tıp merkezi değildir. Buradaki her çıktı '
    + '«yaşam kalitesi ve zindelik rehberliği» statüsündedir. Teşhis ve tedavide '
    + 'karar hekimindir.',

  /* Sistemin asla yapmayacagi seyler. Ajan ciktisi bunlardan birini yaparsa
     SP.Office.validate() ciktiyi reddeder ve kural motorunun cumlesini basar. */
  never:[
    { id:'diagnose', label:'Teşhis koymak',
      note:'"Sende şu hastalık var" denmez. Bulgu bildirilir, hekime yönlendirilir.' },
    { id:'prescribe', label:'İlaç ya da doz önermek',
      note:'Reçeteli ilaç, doz değişikliği ve takviye dozu önerilmez. '
         + 'Gıda ve öğün düzeni önerilebilir.' },
    { id:'stop-treatment', label:'Tedaviyi bırakmayı önermek',
      note:'Hekimin başlattığı hiçbir tedavi hakkında "bırak" ya da "azalt" denmez.' },
    { id:'guarantee', label:'Sonuç garantisi vermek',
      note:'"Bu değer 3 ayda düzelir" denmez. Yön ve olasılık söylenir, garanti verilmez.' },
    { id:'invent-number', label:'Ölçülmemiş sayı üretmek',
      note:'Girilmemiş bir tahlil değeri, tartılmamış bir gramaj ya da '
         + 'sorulmamış bir fiyat uydurulmaz.' },
  ],

  /* Takviye konusundaki tek tutum. */
  supplement:'Takviye önerisi doz içermez. Sistem yalnızca «bu öğe hedefin altında '
    + 'kalıyor, gıdadan şu kaynaklarla kapatılabilir» der. Doz kararı hekime aittir.',
};

/* -------------------------------------------------------- kirmizi bayrak

   Kirmizi bayrak yorumlanmaz, iletilir. Bir olcum bu esikleri gectiginde
   sistem oneri uretmeyi birakir ve tek bir sey soyler: hekime basvur.

   `window` bayragin kac gun boyunca acik kalacagini soyler; kullanici
   "gordum" dese bile kayit silinmez, gecmiste durur. */
SP.RED_FLAGS = {
  window:30,
  title:'Hekime başvur',
  lead:'Aşağıdaki ölçüm, sistemin yorum yapmayı bıraktığı eşiğin ötesinde. '
     + 'Bu bir teşhis değil, bir yönlendirmedir.',

  /* Tek olcumle tetiklenen bayraklar biomarkers.js icindeki `red` alanindan
     gelir. Burada yalnizca BIRDEN FAZLA olcumun birlikte anlam kazandigi
     ornuntuler tanimlidir. */
  patterns:[
    { id:'anemi-tablosu', label:'Anemi örüntüsü',
      needs:['hgb', 'ferritin'],
      test:function(v){ return v.hgb != null && v.ferritin != null && v.hgb < 11 && v.ferritin < 15; },
      detail:'Hemoglobin ve ferritin birlikte düşük. Demir eksikliği anemisi '
           + 'örüntüsüne benziyor; kaynağının araştırılması gerekir.' },

    { id:'diyabet-esigi', label:'Kan şekeri eşiği',
      needs:['glucose', 'hba1c'],
      test:function(v){ return (v.glucose != null && v.glucose >= 126) || (v.hba1c != null && v.hba1c >= 6.5); },
      detail:'Açlık glukozu ya da HbA1c tanı eşiğinde. Tek ölçüm tanı koymaz '
           + 'ama hekim değerlendirmesi gerektirir.' },

    { id:'karaciger-yuku', label:'Karaciğer enzim yüksekliği',
      needs:['alt', 'ast'],
      test:function(v){ return v.alt != null && v.ast != null && v.alt > 80 && v.ast > 80; },
      detail:'İki karaciğer enzimi birlikte belirgin yüksek. Ağır antrenman sonrası '
           + 'geçici yükselmeden farklı bir tablo olabilir.' },

    { id:'tansiyon-krizi', label:'Tansiyon eşiği',
      needs:['sbp', 'dbp'],
      test:function(v){ return (v.sbp != null && v.sbp >= 180) || (v.dbp != null && v.dbp >= 110); },
      detail:'Tansiyon acil değerlendirme eşiğinde. Ölçümü tekrarla; '
           + 'aynı sonuç geliyorsa beklemeden başvur.' },

    { id:'tiroid-sapmasi', label:'Tiroid sapması',
      needs:['tsh'],
      test:function(v){ return v.tsh != null && (v.tsh > 10 || v.tsh < 0.1); },
      detail:'TSH belirgin sapmış. Tiroid fonksiyonunun hekimce değerlendirilmesi gerekir.' },

    { id:'bobrek-suzme', label:'Böbrek süzme hızı',
      needs:['egfr'],
      test:function(v){ return v.egfr != null && v.egfr < 60; },
      detail:'Tahmini süzme hızı 60 altında. Bu değer tek başına tanı değildir '
           + 'ama izlenmesi gerekir.' },
  ],
};

/* ----------------------------------------------------------- grounding

   Modelin ne yapip ne yapamayacagi. Kural motoru otoritedir: sayiyi Calc
   uretir, model yalnizca cumleye cevirir.

       Calc / Nutri / Move / Money   →  brief(agentId)  →  model  →  ekran
          (hesap, esik, karar)          (rapor, JSON)     (yorum)

   Model kapali olsa da sistem calisir: brifing dogrudan cumleye cevrilir
   (SP.Office.ruleText) ve ajanlar "kural motoru" rozetiyle konusur. */
SP.GROUNDING = {
  authority:'Sayı kural motorundan gelir. Ajan hesap yapmaz, geldiği gibi kullanır.',
  decision:'Karar SP.Calc.nextAction() içinden gelir. Patron kararı gerekçelendirir, değiştiremez.',
  sources:'Besin değeri data/foods.js, referans aralığı data/biomarkers.js, '
        + 'fiyat kullanıcının girdiği fiş ya da açıkça «tahmin» etiketli seed verisidir.',
  noModel:'Model yoksa ofis kapanmaz; brifing doğrudan cümleye çevrilir.',

  /* Cikti denetimi — SP.Office.validate() bu desenleri arar. */
  banned:[
    { id:'dose', re:/\b\d+\s?(mg|mcg|µg|iu|ünite)\b.*\b(al|kullan|başla|iç)\b/i,
      why:'Doz önerisi' },
    { id:'diagnosis', re:/\b(sende|sizde)\b.*\b(hastalığı|hastalık|sendrom|tanısı)\s*(var|mevcut)/i,
      why:'Teşhis ifadesi' },
    { id:'guarantee', re:/\b(kesinlikle|garanti|mutlaka)\b.*\b(düzelir|geçer|iyileşir)\b/i,
      why:'Sonuç garantisi' },
    { id:'stop', re:/\bilac(ı|ini)?\s*(bırak|kes|azalt)/i,
      why:'Tedaviyi bırakma önerisi' },
  ],
};

/* ------------------------------------------------------------- mahremiyet */
SP.PRIVACY = {
  storage:'Tahlil sonuçları ve kimlik bilgileri bu cihazda tutulur. Hesaba bağlı '
        + 'kopya açıldığında yalnızca kullanıcının kendi özel alanına yazılır.',
  training:'Hiçbir veri ticari model eğitimine gönderilmez.',
  model:'Bir dil modeli bağlandığında ajana yalnızca ÖZET brifing gider: '
       + 'sayılar ve durum etiketleri. Ad, doğum tarihi ve ham tahlil belgesi gönderilmez.',
  export:'Yedek dosyası şifresizdir; paylaşılan bir dizine konmaz.',
};

/* --------------------------------------------------- celiski cozum sirasi

   Iki uzman ters seyler soyledigi zaman Patron'un uydugu sira. Ustteki
   alttakini her zaman yener; bu tartisilmaz.

   Ornek: Finans "bu hafta balik alma, butce asildi" derken Lab "trigliserit
   yuksek, omega-3 sart" diyorsa — saglik butceyi yener, ama Finans'in isi
   biter demek degildir: ucuz muadili (sardalya/hamsi) bulmak onun gorevidir. */
SP.PRECEDENCE = [
  { rank:1, id:'red-flag', label:'Kırmızı bayrak',
    note:'Hekime yönlendirme her şeyin önündedir. Bayrak açıkken plan tartışılmaz.' },
  { rank:2, id:'safety', label:'Güvenlik',
    note:'Sakatlık riski, aşırı antrenman ve elektrolit sapması. Yük ve hedef buna göre iner.' },
  { rank:3, id:'lab', label:'Laboratuvar bulgusu',
    note:'Ölçülmüş bir eksiklik, tahmin edilmiş bir tercihi yener.' },
  { rank:4, id:'nutrition', label:'Beslenme hedefi',
    note:'Protein ve mikro besin tabanı korunur.' },
  { rank:5, id:'training', label:'Antrenman hedefi',
    note:'İlerleme önemlidir ama toparlanmanın ve beslenmenin önüne geçmez.' },
  { rank:6, id:'budget', label:'Bütçe',
    note:'En son gelir — ama en son gelmesi «yok sayılır» demek değildir: '
       + 'üstteki hedefi bozmadan en ucuz yolu bulmak Finans\'ın işidir.' },
];

/* Gunluk asgari standart — kotu gunun alt siniri.
   Mukemmel gun yerine "hicbir sey yapmamak" secilmesin diye vardir. */
SP.MINIMUM_DAY = {
  protein:'Vücut ağırlığının kilogramı başına 1,2 gram protein',
  water:'2 litre su',
  move:'15 dakika yürüyüş',
  sleep:'7 saat yatakta kalma',
  note:'Kötü bir gün bunu yapıp bitirdiğinde kayıp yoktur. Zincir kopmaz, borç birikmez.',
};

/* Olcum kesinligi — bir sayinin nereden geldigini ekranda daima soyleriz. */
SP.CERTAINTY = {
  measured:{ label:'ölçüldü', tone:'ok',
    note:'Laboratuvar sonucu ya da cihaz ölçümü. Doğrudan girilmiş.' },
  estimated:{ label:'tahmin', tone:'warn',
    note:'Porsiyon tahmini ya da seed fiyat. Düzeltilebilir.' },
  derived:{ label:'hesaplandı', tone:'info',
    note:'Girilen iki ölçümden formülle üretildi.' },
  missing:{ label:'veri yok', tone:'muted',
    note:'Hiç ölçülmemiş. Sıfır sayılmaz.' },
};
