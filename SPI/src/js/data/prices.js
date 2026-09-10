/* Fiyat endeksi ve esdeger besin ikamesi — Modul 4'un tabani.

   ONEMLI — bu tablo bir piyasa verisi degildir.

   Uygulama cevrimdisi calisir ve hicbir market sitesini taramaz. Buradaki
   sayilar yalnizca bir BASLANGIC TAHMINIDIR; kullanici kendi fisinden ilk
   fiyati girene kadar sepet hesabinin bos kalmamasini saglar. Ekranda her
   zaman "tahmin" olarak isaretlenir ve kullanicinin girdigi fiyat tahmini
   ezer (bkz. SP.Money.priceOf).

   Bu, sistemin temel ilkesinin fiyat tarafindaki karsiligidir: uydurulmus
   sayi, olculmus sayi gibi gosterilmez.

   seededAt tahminlerin hangi aya ait oldugunu soyler. Aradan gecen her ay
   icin ekranda "X ay onceki tahmin" uyarisi cikar; eskidikce guven duser. */

window.SP = window.SP || {};

SP.PRICE_SEED = {
  seededAt:'2026-09',
  currency:'TL',
  unit:'kg',
  note:'Başlangıç tahmini — kendi fişinden güncelledikçe hesap gerçeğe yaklaşır.',

  /* TL / kg (yumurta ve konservede TL / kg net agirlik). */
  perKg:{
    'yumurta':180, 'tavuk-gogsu':280, 'kiyma':720, 'dana-eti':780, 'kuzu-eti':850, 'ciger':340,
    'somon':1150, 'hamsi':180, 'sardalya':240, 'ton-baligi':520, 'levrek':420,
    'yogurt':95, 'suzme-yogurt':190, 'ayran':70, 'beyaz-peynir':420, 'kasar':620, 'sut':60,
    'kirmizi-mercimek':95, 'nohut':105, 'kuru-fasulye':140, 'barbunya':150,
    'tam-bugday-ekmek':110, 'beyaz-ekmek':75, 'yulaf':160,
    'ispanak':60, 'brokoli':110, 'domates':55, 'biber':70, 'salata':60, 'patates':35, 'sogan':30,
    'elma':60, 'muz':110, 'portakal':50, 'kuru-kayisi':420,
    'ceviz':780, 'badem':720, 'keten-tohumu':220, 'findik':560,
    'zeytinyagi':780, 'tereyagi':950, 'zeytin':320,
    'cay':600, 'kahve':1400, 'su':6,
    'baklava':900, 'bisküvi':260, 'bal':800,
    /* ev yemekleri: pisirilmis kilogram maliyeti (malzeme toplami) */
    'kuru-fasulye-etli':190, 'mercimek-corbasi':55, 'nohut-yemegi':185, 'etli-sebze':210,
    'zeytinyagli-sebze':120, 'pilav':70, 'bulgur-pilavi':55, 'makarna':85, 'menemen':130,
    'kofte':560, 'tavuk-sote':240, 'karniyarik':160, 'yaprak-sarma':170,
  },
};

/* Esdeger besin ikamesi — "ayni isi goren ucuz muadil".

   `keeps` ikamenin hangi besin ogesini gercekten koruduğunu soyler. Bu alan
   pazarlama degil olcumdur: sardalya somonun omega-3'unu korur ama D vitamini
   icerigi daha dusuktur, bu yuzden `loses` alani da yazilir. Oneri ekranda
   daima ikisiyle birlikte cikar; kullanici neyi kazanip neyi kaybettigini
   gorerek karar verir. */
SP.SUBSTITUTES = [
  { forId:'somon', withId:'sardalya',
    keeps:['omega3','protein','b12'], loses:['vitd'],
    note:'Omega-3 içeriği somona yakın, kalsiyumu belirgin yüksek. D vitamini üçte bir kadar.' },

  { forId:'somon', withId:'hamsi',
    keeps:['omega3','protein','vitd'], loses:[],
    note:'Mevsiminde en ucuz omega-3 kaynağı. Kılçığıyla yendiğinde kalsiyum da gelir.' },

  { forId:'badem', withId:'findik',
    keeps:['magnesium','fat','fiber'], loses:['calcium'],
    note:'Yerel üretim olduğu için fiyat farkı belirgin. Kalsiyumu bademin yarısı kadar.' },

  { forId:'ceviz', withId:'keten-tohumu',
    keeps:['omega3','fiber','magnesium'], loses:['zinc'],
    note:'Gram başına bitkisel omega-3 daha yüksek ve kilogram fiyatı üçte bir. '
       + 'Öğütülmemiş keten sindirilmeden geçer.' },

  { forId:'dana-eti', withId:'kiyma',
    keeps:['protein','iron','zinc','b12'], loses:[],
    note:'Aynı hayvandan, aynı besin profili, kilogram fiyatı daha düşük.' },

  { forId:'dana-eti', withId:'ciger',
    keeps:['iron','b12','folate'], loses:['protein'],
    note:'Demir ve B12 bakımından etin birkaç katı. Haftada bir porsiyonu aşmamak gerekir: '
       + 'A vitamini birikir.' },

  { forId:'suzme-yogurt', withId:'yogurt',
    keeps:['calcium','b12','iodine'], loses:['protein'],
    note:'Süzme yoğurdun proteini iki katı; bütçe sıkışıksa normal yoğurt kalsiyumu yine karşılar.' },

  { forId:'kuru-fasulye', withId:'kirmizi-mercimek',
    keeps:['protein','fiber','iron','folate'], loses:[],
    note:'Aynı bakliyat ailesi, daha düşük kilogram fiyatı. Mercimek ıslatma da gerektirmez, '
       + 'yirmi dakikada pişer.' },

  { forId:'brokoli', withId:'ispanak',
    keeps:['folate','magnesium','iron'], loses:['vitc'],
    note:'Kilogram fiyatı yarısı. C vitamini brokolinin altıda biri; demir için '
       + 'yanına limon gerekir.' },

  { forId:'kuru-kayisi', withId:'elma',
    keeps:['fiber'], loses:['iron','potassium'],
    note:'Ucuz ama eşdeğer değil: kuru kayısının demir ve potasyumu yerine gelmez. '
       + 'Yalnızca tatlı ihtiyacını karşılamak için.' },
];

/* Hane duzeyinde toplu alim — kisi basi maliyeti dusuren kalemler.
   Yalnizca bozulmadan saklanabilen ve hane genelinde tuketilen kalemler
   listeye girer; taze urunde toplu alim israfa doner. */
SP.BULK_ITEMS = [
  { id:'kirmizi-mercimek', minKg:5,  saving:0.14, note:'Kapalı kapta 12 ay bozulmaz' },
  { id:'nohut',            minKg:5,  saving:0.15, note:'Kuru olarak alınır, gece ıslatılır' },
  { id:'kuru-fasulye',     minKg:5,  saving:0.13, note:'Kuru tanede fiyat farkı en yüksek kalem' },
  { id:'yulaf',            minKg:3,  saving:0.12, note:'Serin ve kuru yerde 6 ay' },
  { id:'zeytinyagi',       minKg:5,  saving:0.18, note:'Teneke alım; ışık görmeyen yerde saklanır' },
  { id:'ceviz',            minKg:2,  saving:0.16, note:'Kabuklu alınırsa daha ucuz ve daha uzun dayanır' },
  { id:'cay',              minKg:2,  saving:0.10, note:'Hane geneli tüketim kalemi' },
  { id:'ton-baligi',       minKg:2,  saving:0.11, note:'Konserve; koli alımında birim fiyat düşer' },
];

/* Bir kilogram tahmini fiyatin ne kadar eskidigini soyleyen esikler.
   Enflasyonun yuksek oldugu bir ekonomide 6 aylik bir tahmin artik tahmin
   bile sayilmaz; sistem bunu sessizce kullanmaz, acikca soyler. */
SP.PRICE_AGE = [
  { maxMonths:1,  tone:'ok',     label:'güncel' },
  { maxMonths:3,  tone:'info',   label:'yakın tarihli' },
  { maxMonths:6,  tone:'warn',   label:'eskimiş' },
  { maxMonths:999,tone:'danger', label:'çok eski — güncelle' },
];
