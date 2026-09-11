/* Gida kompozisyon tablosu — Modul 2'nin hesap tabani.

   Butun degerler 100 gram icindir. Kaynak olarak TURKOMP (Turkiye Ulusal Gida
   Kompozisyon Veri Tabani) ve USDA FoodData Central degerleri esas alinmis,
   ev yemekleri Turk mutfagindaki standart tarif oranlarina gore hesaplanmistir.

   Sema:
     id        kararli anahtar (degistirilmez; kayitlar buna baglanir)
     name      ekranda gorunen ad
     cat       kategori (SP.FOOD_CATS)
     kcal      enerji
     p f c     protein / yag / karbonhidrat (g)
     sat       doymus yag (g)
     fib       lif (g)
     micro     mikro besinler — anahtarlar data/nutrients.js ile ayni
     ironType  'heme' (hayvansal, iyi emilen) | 'nonheme' (bitkisel)
     flags     emilimi etkileyen ozellikler (SP.ABSORB_FACTORS anahtarlari)
     portions  ev olcusu — sifir surtunmeli girisin can damari.
               "1 tabak etli kuru fasulye" dendiginde gramaj buradan gelir.
     aliases   serbest metin ayristirmasi icin esleme anahtarlari

   Mikro besin alani eksik birakilan gidalarda o oge sifir sayilmaz, "bilinmiyor"
   sayilir ve SP.Nutri.sum() bunu ayrica raporlar: olmayan veri sifir gibi
   gosterilirse eksiklik oldugundan buyuk gorunur. */

window.SP = window.SP || {};

SP.FOOD_CATS = [
  { id:'yemek',     label:'Ev yemeği' },
  { id:'et',        label:'Et ve yumurta' },
  { id:'balik',     label:'Balık ve deniz' },
  { id:'sut',       label:'Süt ürünleri' },
  { id:'bakliyat',  label:'Bakliyat' },
  { id:'tahil',     label:'Tahıl ve ekmek' },
  { id:'sebze',     label:'Sebze' },
  { id:'meyve',     label:'Meyve' },
  { id:'kuruyemis', label:'Kuruyemiş ve tohum' },
  { id:'yag',       label:'Yağ' },
  { id:'icecek',    label:'İçecek' },
  { id:'tatli',     label:'Tatlı ve atıştırmalık' },
];

SP.FOODS = [

  /* ------------------------------------------------------------- ev yemegi */
  { id:'kuru-fasulye-etli', name:'Etli kuru fasulye', cat:'yemek',
    kcal:132, p:8.1, f:4.6, sat:1.6, c:14.2, fib:5.1,
    micro:{ iron:1.9, calcium:52, magnesium:44, zinc:1.1, potassium:390, b12:0.3, folate:60,
            vitc:1, vitd:0.1, omega3:0.04, selenium:4, iodine:2, sodium:340 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 tabak', g:250 }, { label:'1 kepçe', g:120 }],
    aliases:['kuru fasulye','etli kuru fasulye','fasulye','kurufasulye'] },

  { id:'mercimek-corbasi', name:'Mercimek çorbası', cat:'yemek',
    kcal:68, p:3.4, f:1.9, sat:0.5, c:9.8, fib:2.4,
    micro:{ iron:1.2, calcium:22, magnesium:24, zinc:0.6, potassium:210, b12:0, folate:52,
            vitc:2, vitd:0, omega3:0.02, selenium:2, iodine:1, sodium:320 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 kase', g:250 }, { label:'1 kepçe', g:120 }],
    aliases:['mercimek corbasi','mercimek çorbası','corba','çorba'] },

  { id:'nohut-yemegi', name:'Nohut yemeği (etli)', cat:'yemek',
    kcal:145, p:8.4, f:5.2, sat:1.7, c:16.1, fib:4.6,
    micro:{ iron:2.1, calcium:48, magnesium:40, zinc:1.2, potassium:300, b12:0.3, folate:78,
            vitc:2, vitd:0.1, omega3:0.05, selenium:4, iodine:2, sodium:330 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 tabak', g:250 }, { label:'1 kepçe', g:120 }],
    aliases:['nohut','nohut yemegi','etli nohut'] },

  { id:'etli-sebze', name:'Etli sebze yemeği', cat:'yemek',
    kcal:96, p:6.2, f:5.1, sat:1.8, c:6.4, fib:2.2,
    micro:{ iron:1.4, calcium:38, magnesium:24, zinc:1.4, potassium:330, b12:0.6, folate:28,
            vitc:12, vitd:0.1, omega3:0.04, selenium:5, iodine:2, sodium:310 },
    ironType:'heme', flags:[],
    portions:[{ label:'1 tabak', g:250 }, { label:'1 kepçe', g:120 }],
    aliases:['etli sebze','sebze yemegi','turlu','güveç'] },

  { id:'zeytinyagli-sebze', name:'Zeytinyağlı sebze', cat:'yemek',
    kcal:88, p:2.1, f:6.2, sat:0.9, c:6.8, fib:2.8,
    micro:{ iron:0.9, calcium:44, magnesium:22, zinc:0.4, potassium:290, b12:0, folate:32,
            vitc:14, vitd:0, omega3:0.06, selenium:1, iodine:1, sodium:260 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 tabak', g:200 }, { label:'1 kepçe', g:110 }],
    aliases:['zeytinyagli','zeytinyağlı','zeytinyaglı sebze'] },

  { id:'pilav', name:'Pirinç pilavı', cat:'yemek',
    kcal:158, p:3.1, f:3.8, sat:1.4, c:27.6, fib:0.6,
    micro:{ iron:0.4, calcium:12, magnesium:14, zinc:0.6, potassium:52, b12:0, folate:8,
            vitc:0, vitd:0, omega3:0.01, selenium:6, iodine:1, sodium:290 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 porsiyon', g:180 }, { label:'1 kepçe', g:100 }],
    aliases:['pilav','pirinc pilavi','pirinç pilavı','pirinc'] },

  { id:'bulgur-pilavi', name:'Bulgur pilavı', cat:'yemek',
    kcal:134, p:4.2, f:3.4, sat:0.9, c:22.8, fib:4.1,
    micro:{ iron:1.1, calcium:16, magnesium:38, zinc:0.9, potassium:120, b12:0, folate:18,
            vitc:2, vitd:0, omega3:0.02, selenium:4, iodine:1, sodium:280 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 porsiyon', g:180 }, { label:'1 kepçe', g:100 }],
    aliases:['bulgur','bulgur pilavi','bulgur pilavı'] },

  { id:'makarna', name:'Makarna (soslu)', cat:'yemek',
    kcal:164, p:5.2, f:4.6, sat:1.2, c:25.4, fib:1.8,
    micro:{ iron:1.0, calcium:26, magnesium:22, zinc:0.7, potassium:140, b12:0, folate:14,
            vitc:6, vitd:0, omega3:0.02, selenium:12, iodine:1, sodium:300 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 tabak', g:220 }],
    aliases:['makarna','spagetti','erişte','eriste'] },

  { id:'menemen', name:'Menemen', cat:'yemek',
    kcal:118, p:6.4, f:8.2, sat:2.2, c:4.2, fib:1.2,
    micro:{ iron:1.1, calcium:38, magnesium:16, zinc:0.7, potassium:210, b12:0.5, folate:34,
            vitc:38, vitd:1.1, omega3:0.06, selenium:12, iodine:14, sodium:290 },
    ironType:'heme', flags:['vitc'],
    portions:[{ label:'1 porsiyon', g:220 }],
    aliases:['menemen','yumurtali biber'] },

  { id:'kofte', name:'Izgara köfte', cat:'yemek',
    kcal:212, p:18.4, f:14.2, sat:5.6, c:3.1, fib:0.4,
    micro:{ iron:2.4, calcium:22, magnesium:22, zinc:4.2, potassium:290, b12:2.2, folate:8,
            vitc:0, vitd:0.2, omega3:0.08, selenium:14, iodine:3, sodium:480 },
    ironType:'heme', flags:['protein'],
    portions:[{ label:'1 porsiyon (4 köfte)', g:150 }, { label:'1 köfte', g:38 }],
    aliases:['kofte','köfte','izgara kofte'] },

  { id:'tavuk-sote', name:'Tavuk sote', cat:'yemek',
    kcal:142, p:17.2, f:6.4, sat:1.6, c:4.2, fib:1.0,
    micro:{ iron:0.9, calcium:18, magnesium:26, zinc:1.4, potassium:310, b12:0.4, folate:12,
            vitc:22, vitd:0.1, omega3:0.05, selenium:18, iodine:4, sodium:360 },
    ironType:'heme', flags:['protein','vitc'],
    portions:[{ label:'1 porsiyon', g:200 }],
    aliases:['tavuk sote','tavuk','sote'] },

  { id:'karniyarik', name:'Karnıyarık', cat:'yemek',
    kcal:126, p:5.8, f:8.4, sat:2.4, c:7.2, fib:3.2,
    micro:{ iron:1.2, calcium:30, magnesium:24, zinc:1.2, potassium:320, b12:0.5, folate:26,
            vitc:10, vitd:0.1, omega3:0.05, selenium:5, iodine:2, sodium:330 },
    ironType:'heme', flags:[],
    portions:[{ label:'1 porsiyon', g:220 }],
    aliases:['karniyarik','karnıyarık','patlican yemegi'] },

  { id:'yaprak-sarma', name:'Zeytinyağlı yaprak sarma', cat:'yemek',
    kcal:152, p:2.8, f:8.6, sat:1.2, c:16.4, fib:2.6,
    micro:{ iron:1.4, calcium:52, magnesium:22, zinc:0.5, potassium:210, b12:0, folate:24,
            vitc:6, vitd:0, omega3:0.07, selenium:2, iodine:1, sodium:420 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 porsiyon (6 adet)', g:150 }, { label:'1 adet', g:25 }],
    aliases:['sarma','yaprak sarma','dolma'] },

  /* ------------------------------------------------------- et ve yumurta */
  { id:'yumurta', name:'Yumurta (haşlanmış)', cat:'et',
    kcal:155, p:12.6, f:10.6, sat:3.3, c:1.1, fib:0,
    micro:{ iron:1.2, calcium:50, magnesium:12, zinc:1.1, potassium:126, b12:1.1, folate:44,
            vitc:0, vitd:2.0, omega3:0.10, selenium:31, iodine:24, sodium:124 },
    ironType:'heme', flags:['protein','fat'],
    portions:[{ label:'1 yumurta', g:55 }, { label:'2 yumurta', g:110 }],
    aliases:['yumurta','haslanmis yumurta','haşlanmış yumurta'] },

  { id:'dana-eti', name:'Dana eti (yağsız, pişmiş)', cat:'et',
    kcal:214, p:27.8, f:11.2, sat:4.4, c:0, fib:0,
    micro:{ iron:2.9, calcium:12, magnesium:24, zinc:6.2, potassium:330, b12:2.6, folate:8,
            vitc:0, vitd:0.2, omega3:0.05, selenium:22, iodine:2, sodium:64 },
    ironType:'heme', flags:['protein'],
    portions:[{ label:'1 porsiyon', g:150 }],
    aliases:['dana','dana eti','kirmizi et','kırmızı et','biftek'] },

  { id:'kuzu-eti', name:'Kuzu eti (pişmiş)', cat:'et',
    kcal:258, p:25.2, f:17.4, sat:7.4, c:0, fib:0,
    micro:{ iron:2.0, calcium:14, magnesium:22, zinc:4.8, potassium:310, b12:2.7, folate:6,
            vitc:0, vitd:0.3, omega3:0.12, selenium:20, iodine:2, sodium:72 },
    ironType:'heme', flags:['protein'],
    portions:[{ label:'1 porsiyon', g:150 }],
    aliases:['kuzu','kuzu eti'] },

  { id:'tavuk-gogsu', name:'Tavuk göğsü (ızgara)', cat:'et',
    kcal:165, p:31.0, f:3.6, sat:1.0, c:0, fib:0,
    micro:{ iron:0.9, calcium:15, magnesium:29, zinc:1.0, potassium:256, b12:0.3, folate:4,
            vitc:0, vitd:0.1, omega3:0.04, selenium:27, iodine:6, sodium:74 },
    ironType:'heme', flags:['protein'],
    portions:[{ label:'1 porsiyon', g:150 }, { label:'1 bonfile', g:120 }],
    aliases:['tavuk gogsu','tavuk göğsü','izgara tavuk','pilic'] },

  { id:'kiyma', name:'Dana kıyma (%15 yağlı)', cat:'et',
    kcal:250, p:24.6, f:16.4, sat:6.4, c:0, fib:0,
    micro:{ iron:2.6, calcium:18, magnesium:20, zinc:5.6, potassium:290, b12:2.4, folate:7,
            vitc:0, vitd:0.2, omega3:0.06, selenium:18, iodine:2, sodium:78 },
    ironType:'heme', flags:['protein'],
    portions:[{ label:'1 porsiyon', g:150 }],
    aliases:['kiyma','kıyma','dana kiyma'] },

  { id:'ciger', name:'Dana ciğeri', cat:'et',
    kcal:175, p:26.5, f:4.9, sat:1.9, c:3.9, fib:0,
    micro:{ iron:6.5, calcium:11, magnesium:22, zinc:5.2, potassium:352, b12:70.6, folate:253,
            vitc:1.9, vitd:1.2, omega3:0.03, selenium:40, iodine:14, sodium:78 },
    ironType:'heme', flags:['protein'],
    portions:[{ label:'1 porsiyon', g:120 }],
    aliases:['ciger','ciğer','dana cigeri','karaciger'] },

  /* ---------------------------------------------------------------- balik */
  { id:'somon', name:'Somon (fırında)', cat:'balik',
    kcal:208, p:22.1, f:13.4, sat:3.1, c:0, fib:0,
    micro:{ iron:0.4, calcium:15, magnesium:29, zinc:0.6, potassium:363, b12:3.2, folate:26,
            vitc:0, vitd:13.1, omega3:2.26, selenium:36, iodine:14, sodium:59 },
    ironType:'heme', flags:['protein','fat'],
    portions:[{ label:'1 porsiyon', g:150 }],
    aliases:['somon','salmon'] },

  { id:'hamsi', name:'Hamsi (fırında)', cat:'balik',
    kcal:180, p:20.4, f:10.6, sat:2.6, c:0, fib:0,
    micro:{ iron:1.6, calcium:147, magnesium:41, zinc:1.7, potassium:383, b12:0.6, folate:9,
            vitc:0, vitd:11.0, omega3:2.05, selenium:36, iodine:32, sodium:104 },
    ironType:'heme', flags:['protein','fat'],
    portions:[{ label:'1 porsiyon', g:150 }],
    aliases:['hamsi','anchovy'] },

  { id:'sardalya', name:'Sardalya', cat:'balik',
    kcal:208, p:24.6, f:11.4, sat:1.5, c:0, fib:0,
    micro:{ iron:2.9, calcium:382, magnesium:39, zinc:1.3, potassium:397, b12:8.9, folate:10,
            vitc:0, vitd:4.8, omega3:1.48, selenium:52, iodine:35, sodium:307 },
    ironType:'heme', flags:['protein','fat'],
    portions:[{ label:'1 porsiyon', g:120 }, { label:'1 konserve', g:90 }],
    aliases:['sardalya','sardalye','sardine'] },

  { id:'ton-baligi', name:'Ton balığı (konserve, suda)', cat:'balik',
    kcal:116, p:25.5, f:0.8, sat:0.2, c:0, fib:0,
    micro:{ iron:1.0, calcium:11, magnesium:33, zinc:0.6, potassium:237, b12:2.2, folate:2,
            vitc:0, vitd:1.7, omega3:0.28, selenium:80, iodine:12, sodium:320 },
    ironType:'heme', flags:['protein'],
    portions:[{ label:'1 konserve', g:80 }],
    aliases:['ton','ton baligi','ton balığı','tuna'] },

  { id:'levrek', name:'Levrek (ızgara)', cat:'balik',
    kcal:124, p:23.4, f:2.8, sat:0.7, c:0, fib:0,
    micro:{ iron:0.4, calcium:14, magnesium:41, zinc:0.5, potassium:328, b12:2.4, folate:6,
            vitc:0, vitd:2.6, omega3:0.65, selenium:38, iodine:22, sodium:88 },
    ironType:'heme', flags:['protein'],
    portions:[{ label:'1 porsiyon', g:180 }],
    aliases:['levrek','cipura','çipura','beyaz balik'] },

  /* ---------------------------------------------------------- sut urunleri */
  { id:'yogurt', name:'Yoğurt (tam yağlı)', cat:'sut',
    kcal:61, p:3.5, f:3.3, sat:2.1, c:4.7, fib:0,
    micro:{ iron:0.1, calcium:121, magnesium:12, zinc:0.6, potassium:155, b12:0.4, folate:7,
            vitc:0.5, vitd:0.1, omega3:0.02, selenium:2, iodine:16, sodium:46 },
    ironType:'nonheme', flags:['calcium'],
    portions:[{ label:'1 kase', g:200 }, { label:'1 kaşık', g:20 }],
    aliases:['yogurt','yoğurt'] },

  { id:'suzme-yogurt', name:'Süzme yoğurt', cat:'sut',
    kcal:97, p:10.0, f:5.0, sat:3.2, c:3.6, fib:0,
    micro:{ iron:0.1, calcium:110, magnesium:11, zinc:0.5, potassium:141, b12:0.8, folate:12,
            vitc:0, vitd:0.1, omega3:0.02, selenium:9, iodine:14, sodium:36 },
    ironType:'nonheme', flags:['calcium','protein'],
    portions:[{ label:'1 kase', g:200 }],
    aliases:['suzme yogurt','süzme yoğurt','yunan yogurdu','labne'] },

  { id:'ayran', name:'Ayran', cat:'sut',
    kcal:38, p:1.9, f:1.8, sat:1.2, c:3.2, fib:0,
    micro:{ iron:0.1, calcium:72, magnesium:8, zinc:0.3, potassium:104, b12:0.2, folate:4,
            vitc:0, vitd:0, omega3:0.01, selenium:1, iodine:10, sodium:210 },
    ironType:'nonheme', flags:['calcium'],
    portions:[{ label:'1 bardak', g:250 }],
    aliases:['ayran'] },

  { id:'beyaz-peynir', name:'Beyaz peynir', cat:'sut',
    kcal:264, p:17.6, f:21.0, sat:13.4, c:1.4, fib:0,
    micro:{ iron:0.2, calcium:493, magnesium:20, zinc:2.4, potassium:62, b12:1.2, folate:32,
            vitc:0, vitd:0.4, omega3:0.10, selenium:14, iodine:22, sodium:1120 },
    ironType:'nonheme', flags:['calcium'],
    portions:[{ label:'1 dilim', g:30 }, { label:'1 kibrit kutusu', g:40 }],
    aliases:['beyaz peynir','peynir'] },

  { id:'kasar', name:'Kaşar peyniri', cat:'sut',
    kcal:330, p:24.0, f:25.4, sat:16.2, c:1.6, fib:0,
    micro:{ iron:0.4, calcium:720, magnesium:28, zinc:3.1, potassium:98, b12:1.4, folate:18,
            vitc:0, vitd:0.5, omega3:0.12, selenium:16, iodine:20, sodium:680 },
    ironType:'nonheme', flags:['calcium'],
    portions:[{ label:'1 dilim', g:25 }],
    aliases:['kasar','kaşar','kasar peyniri'] },


  /* -------------------------------------------------------------- bakliyat */
  { id:'kirmizi-mercimek', name:'Kırmızı mercimek (pişmiş)', cat:'bakliyat',
    kcal:116, p:9.0, f:0.4, sat:0.1, c:20.1, fib:7.9,
    micro:{ iron:3.3, calcium:19, magnesium:36, zinc:1.3, potassium:369, b12:0, folate:181,
            vitc:1.5, vitd:0, omega3:0.04, selenium:3, iodine:1, sodium:2 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 kase', g:200 }],
    aliases:['mercimek','kirmizi mercimek','kırmızı mercimek'] },

  { id:'nohut', name:'Nohut (haşlanmış)', cat:'bakliyat',
    kcal:164, p:8.9, f:2.6, sat:0.3, c:27.4, fib:7.6,
    micro:{ iron:2.9, calcium:49, magnesium:48, zinc:1.5, potassium:291, b12:0, folate:172,
            vitc:1.3, vitd:0, omega3:0.04, selenium:4, iodine:1, sodium:7 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 kase', g:180 }],
    aliases:['nohut haslanmis','haslanmis nohut','leblebi'] },

  { id:'kuru-fasulye', name:'Kuru fasulye (haşlanmış)', cat:'bakliyat',
    kcal:127, p:8.7, f:0.5, sat:0.1, c:22.8, fib:6.4,
    micro:{ iron:2.2, calcium:62, magnesium:53, zinc:1.0, potassium:405, b12:0, folate:130,
            vitc:1.2, vitd:0, omega3:0.11, selenium:2, iodine:1, sodium:2 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 kase', g:180 }],
    aliases:['haslanmis fasulye','kuru fasulye haslanmis'] },

  { id:'barbunya', name:'Barbunya (pişmiş)', cat:'bakliyat',
    kcal:127, p:9.0, f:0.5, sat:0.1, c:22.8, fib:8.6,
    micro:{ iron:2.9, calcium:50, magnesium:50, zinc:1.1, potassium:387, b12:0, folate:130,
            vitc:1.2, vitd:0, omega3:0.10, selenium:1, iodine:1, sodium:2 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 kase', g:180 }],
    aliases:['barbunya'] },

  /* ---------------------------------------------------------------- tahil */
  { id:'tam-bugday-ekmek', name:'Tam buğday ekmeği', cat:'tahil',
    kcal:247, p:13.0, f:3.4, sat:0.7, c:41.0, fib:7.0,
    micro:{ iron:2.5, calcium:107, magnesium:82, zinc:1.8, potassium:248, b12:0, folate:42,
            vitc:0, vitd:0, omega3:0.06, selenium:28, iodine:2, sodium:450 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 dilim', g:35 }],
    aliases:['tam bugday ekmegi','tam buğday ekmeği','kepekli ekmek'] },

  { id:'beyaz-ekmek', name:'Beyaz ekmek', cat:'tahil',
    kcal:265, p:9.0, f:3.2, sat:0.7, c:49.0, fib:2.7,
    micro:{ iron:3.6, calcium:144, magnesium:23, zinc:0.7, potassium:115, b12:0, folate:34,
            vitc:0, vitd:0, omega3:0.03, selenium:22, iodine:2, sodium:490 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 dilim', g:30 }],
    aliases:['ekmek','beyaz ekmek'] },

  { id:'yulaf', name:'Yulaf ezmesi (kuru)', cat:'tahil',
    kcal:379, p:13.2, f:6.5, sat:1.1, c:67.7, fib:10.1,
    micro:{ iron:4.3, calcium:52, magnesium:138, zinc:3.6, potassium:362, b12:0, folate:32,
            vitc:0, vitd:0, omega3:0.11, selenium:28, iodine:1, sodium:6 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 su bardağı', g:80 }, { label:'1 kaşık', g:12 }],
    aliases:['yulaf','yulaf ezmesi','oatmeal'] },

  /* ---------------------------------------------------------------- sebze */
  { id:'ispanak', name:'Ispanak (haşlanmış)', cat:'sebze',
    kcal:23, p:3.0, f:0.3, sat:0.1, c:3.8, fib:2.4,
    micro:{ iron:3.6, calcium:136, magnesium:87, zinc:0.8, potassium:466, b12:0, folate:146,
            vitc:9.8, vitd:0, omega3:0.14, selenium:1, iodine:12, sodium:70 },
    ironType:'nonheme', flags:['oxalate','phytate'],
    portions:[{ label:'1 porsiyon', g:200 }],
    aliases:['ispanak','spinach'] },

  { id:'brokoli', name:'Brokoli (buharda)', cat:'sebze',
    kcal:35, p:2.4, f:0.4, sat:0.1, c:7.2, fib:3.3,
    micro:{ iron:0.7, calcium:40, magnesium:21, zinc:0.4, potassium:293, b12:0, folate:63,
            vitc:65, vitd:0, omega3:0.12, selenium:2, iodine:2, sodium:41 },
    ironType:'nonheme', flags:['vitc'],
    portions:[{ label:'1 porsiyon', g:150 }],
    aliases:['brokoli','broccoli'] },

  { id:'domates', name:'Domates', cat:'sebze',
    kcal:18, p:0.9, f:0.2, sat:0, c:3.9, fib:1.2,
    micro:{ iron:0.3, calcium:10, magnesium:11, zinc:0.2, potassium:237, b12:0, folate:15,
            vitc:14, vitd:0, omega3:0.003, selenium:0, iodine:2, sodium:5 },
    ironType:'nonheme', flags:['vitc'],
    portions:[{ label:'1 adet', g:120 }],
    aliases:['domates'] },

  { id:'biber', name:'Yeşil biber', cat:'sebze',
    kcal:20, p:0.9, f:0.2, sat:0, c:4.6, fib:1.7,
    micro:{ iron:0.3, calcium:10, magnesium:10, zinc:0.1, potassium:175, b12:0, folate:10,
            vitc:80, vitd:0, omega3:0.01, selenium:0, iodine:1, sodium:3 },
    ironType:'nonheme', flags:['vitc'],
    portions:[{ label:'1 adet', g:60 }],
    aliases:['biber','yesil biber','yeşil biber','carliston'] },

  { id:'salata', name:'Mevsim salatası', cat:'sebze',
    kcal:32, p:1.2, f:1.8, sat:0.3, c:3.4, fib:1.6,
    micro:{ iron:0.6, calcium:32, magnesium:14, zinc:0.2, potassium:220, b12:0, folate:38,
            vitc:24, vitd:0, omega3:0.04, selenium:0, iodine:2, sodium:120 },
    ironType:'nonheme', flags:['vitc'],
    portions:[{ label:'1 tabak', g:150 }],
    aliases:['salata','mevsim salatasi','yesillik'] },

  { id:'patates', name:'Patates (haşlanmış)', cat:'sebze',
    kcal:87, p:1.9, f:0.1, sat:0, c:20.1, fib:1.8,
    micro:{ iron:0.3, calcium:5, magnesium:22, zinc:0.3, potassium:379, b12:0, folate:10,
            vitc:13, vitd:0, omega3:0.01, selenium:0, iodine:2, sodium:4 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 adet', g:150 }],
    aliases:['patates'] },

  { id:'sogan', name:'Soğan', cat:'sebze',
    kcal:40, p:1.1, f:0.1, sat:0, c:9.3, fib:1.7,
    micro:{ iron:0.2, calcium:23, magnesium:10, zinc:0.2, potassium:146, b12:0, folate:19,
            vitc:7.4, vitd:0, omega3:0.004, selenium:0, iodine:1, sodium:4 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 adet', g:110 }],
    aliases:['sogan','soğan'] },

  /* ---------------------------------------------------------------- meyve */
  { id:'elma', name:'Elma', cat:'meyve',
    kcal:52, p:0.3, f:0.2, sat:0, c:13.8, fib:2.4,
    micro:{ iron:0.1, calcium:6, magnesium:5, zinc:0, potassium:107, b12:0, folate:3,
            vitc:4.6, vitd:0, omega3:0.009, selenium:0, iodine:1, sodium:1 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 adet', g:180 }],
    aliases:['elma'] },

  { id:'muz', name:'Muz', cat:'meyve',
    kcal:89, p:1.1, f:0.3, sat:0.1, c:22.8, fib:2.6,
    micro:{ iron:0.3, calcium:5, magnesium:27, zinc:0.2, potassium:358, b12:0, folate:20,
            vitc:8.7, vitd:0, omega3:0.03, selenium:1, iodine:2, sodium:1 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 adet', g:120 }],
    aliases:['muz'] },

  { id:'portakal', name:'Portakal', cat:'meyve',
    kcal:47, p:0.9, f:0.1, sat:0, c:11.8, fib:2.4,
    micro:{ iron:0.1, calcium:40, magnesium:10, zinc:0.1, potassium:181, b12:0, folate:30,
            vitc:53, vitd:0, omega3:0.007, selenium:0, iodine:1, sodium:0 },
    ironType:'nonheme', flags:['vitc'],
    portions:[{ label:'1 adet', g:160 }],
    aliases:['portakal'] },

  { id:'kuru-kayisi', name:'Kuru kayısı', cat:'meyve',
    kcal:241, p:3.4, f:0.5, sat:0, c:62.6, fib:7.3,
    micro:{ iron:2.7, calcium:55, magnesium:32, zinc:0.4, potassium:1162, b12:0, folate:10,
            vitc:1, vitd:0, omega3:0.01, selenium:2, iodine:1, sodium:10 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 avuç (6 adet)', g:40 }],
    aliases:['kuru kayisi','kuru kayısı','kayisi'] },

  /* ------------------------------------------------------------ kuruyemis */
  { id:'ceviz', name:'Ceviz', cat:'kuruyemis',
    kcal:654, p:15.2, f:65.2, sat:6.1, c:13.7, fib:6.7,
    micro:{ iron:2.9, calcium:98, magnesium:158, zinc:3.1, potassium:441, b12:0, folate:98,
            vitc:1.3, vitd:0, omega3:9.08, selenium:5, iodine:2, sodium:2 },
    ironType:'nonheme', flags:['phytate','fat'],
    portions:[{ label:'1 avuç', g:30 }, { label:'1 adet (iç)', g:5 }],
    aliases:['ceviz','walnut'] },

  { id:'badem', name:'Badem', cat:'kuruyemis',
    kcal:579, p:21.2, f:49.9, sat:3.8, c:21.6, fib:12.5,
    micro:{ iron:3.7, calcium:269, magnesium:270, zinc:3.1, potassium:733, b12:0, folate:44,
            vitc:0, vitd:0, omega3:0.003, selenium:4, iodine:2, sodium:1 },
    ironType:'nonheme', flags:['phytate','fat'],
    portions:[{ label:'1 avuç', g:30 }],
    aliases:['badem','almond'] },

  { id:'keten-tohumu', name:'Keten tohumu (öğütülmüş)', cat:'kuruyemis',
    kcal:534, p:18.3, f:42.2, sat:3.7, c:28.9, fib:27.3,
    micro:{ iron:5.7, calcium:255, magnesium:392, zinc:4.3, potassium:813, b12:0, folate:87,
            vitc:0.6, vitd:0, omega3:22.8, selenium:25, iodine:1, sodium:30 },
    ironType:'nonheme', flags:['phytate','fat'],
    portions:[{ label:'1 kaşık', g:10 }],
    aliases:['keten tohumu','keten','flaxseed'] },

  { id:'findik', name:'Fındık', cat:'kuruyemis',
    kcal:628, p:15.0, f:60.8, sat:4.5, c:16.7, fib:9.7,
    micro:{ iron:4.7, calcium:114, magnesium:163, zinc:2.5, potassium:680, b12:0, folate:113,
            vitc:6.3, vitd:0, omega3:0.09, selenium:2, iodine:2, sodium:0 },
    ironType:'nonheme', flags:['phytate','fat'],
    portions:[{ label:'1 avuç', g:30 }],
    aliases:['findik','fındık','hazelnut'] },

  /* ------------------------------------------------------------------ yag */
  { id:'zeytinyagi', name:'Zeytinyağı', cat:'yag',
    kcal:884, p:0, f:100, sat:13.8, c:0, fib:0,
    micro:{ iron:0.6, calcium:1, magnesium:0, zinc:0, potassium:1, b12:0, folate:0,
            vitc:0, vitd:0, omega3:0.76, selenium:0, iodine:0, sodium:2 },
    ironType:'nonheme', flags:['fat'],
    portions:[{ label:'1 yemek kaşığı', g:14 }, { label:'1 çay kaşığı', g:5 }],
    aliases:['zeytinyagi','zeytinyağı','olive oil'] },

  { id:'tereyagi', name:'Tereyağı', cat:'yag',
    kcal:717, p:0.9, f:81.1, sat:51.4, c:0.1, fib:0,
    micro:{ iron:0, calcium:24, magnesium:2, zinc:0.1, potassium:24, b12:0.2, folate:3,
            vitc:0, vitd:1.5, omega3:0.32, selenium:1, iodine:38, sodium:11 },
    ironType:'nonheme', flags:['fat'],
    portions:[{ label:'1 yemek kaşığı', g:14 }],
    aliases:['tereyagi','tereyağı','butter'] },

  { id:'zeytin', name:'Siyah zeytin', cat:'yag',
    kcal:115, p:0.8, f:10.7, sat:1.4, c:6.3, fib:3.2,
    micro:{ iron:3.3, calcium:88, magnesium:4, zinc:0.2, potassium:8, b12:0, folate:0,
            vitc:0.9, vitd:0, omega3:0.06, selenium:1, iodine:1, sodium:735 },
    ironType:'nonheme', flags:['fat'],
    portions:[{ label:'1 porsiyon (8 adet)', g:40 }],
    aliases:['zeytin','siyah zeytin'] },

  /* -------------------------------------------------------------- icecek */
  { id:'cay', name:'Çay (demli, şekersiz)', cat:'icecek',
    kcal:1, p:0, f:0, sat:0, c:0.3, fib:0,
    micro:{ iron:0, calcium:0, magnesium:3, zinc:0, potassium:37, b12:0, folate:5,
            vitc:0, vitd:0, omega3:0, selenium:0, iodine:0, sodium:3 },
    ironType:'nonheme', flags:['tannin'],
    portions:[{ label:'1 bardak', g:120 }],
    aliases:['cay','çay','tea'] },

  { id:'kahve', name:'Türk kahvesi (şekersiz)', cat:'icecek',
    kcal:4, p:0.2, f:0, sat:0, c:0.6, fib:0,
    micro:{ iron:0, calcium:3, magnesium:5, zinc:0, potassium:60, b12:0, folate:1,
            vitc:0, vitd:0, omega3:0, selenium:0, iodine:0, sodium:3 },
    ironType:'nonheme', flags:['tannin'],
    portions:[{ label:'1 fincan', g:70 }],
    aliases:['kahve','turk kahvesi','türk kahvesi','coffee'] },

  { id:'su', name:'Su', cat:'icecek',
    kcal:0, p:0, f:0, sat:0, c:0, fib:0,
    micro:{ iron:0, calcium:8, magnesium:3, zinc:0, potassium:1, b12:0, folate:0,
            vitc:0, vitd:0, omega3:0, selenium:0, iodine:0, sodium:4 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 bardak', g:250 }, { label:'1 şişe', g:500 }],
    aliases:['su','water'] },

  /* ------------------------------------------------------- tatli/atistirmalik */
  { id:'baklava', name:'Baklava', cat:'tatli',
    kcal:428, p:6.1, f:24.2, sat:6.8, c:47.2, fib:1.9,
    micro:{ iron:1.2, calcium:52, magnesium:38, zinc:0.9, potassium:180, b12:0.1, folate:22,
            vitc:0.3, vitd:0.1, omega3:0.04, selenium:6, iodine:2, sodium:190 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 dilim', g:60 }],
    aliases:['baklava'] },

  { id:'bisküvi', name:'Bisküvi', cat:'tatli',
    kcal:460, p:6.8, f:17.4, sat:8.9, c:68.2, fib:2.1,
    micro:{ iron:2.2, calcium:48, magnesium:20, zinc:0.6, potassium:120, b12:0, folate:24,
            vitc:0, vitd:0, omega3:0.02, selenium:8, iodine:2, sodium:420 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 paket', g:80 }, { label:'1 adet', g:8 }],
    aliases:['biskuvi','bisküvi','kurabiye'] },

  { id:'bal', name:'Bal', cat:'tatli',
    kcal:304, p:0.3, f:0, sat:0, c:82.4, fib:0.2,
    micro:{ iron:0.4, calcium:6, magnesium:2, zinc:0.2, potassium:52, b12:0, folate:2,
            vitc:0.5, vitd:0, omega3:0, selenium:1, iodine:1, sodium:4 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 yemek kaşığı', g:21 }],
    aliases:['bal','honey'] },

  /* ------------------------------------------- disarida yenen / sokak
     Bu bolum bilerek eklendi: tablo ev mutfagini kapsiyordu ama
     disarida yenen ogunu kapsamiyordu ve kullanici «lahmacun yedim»
     dediginde sistem HICBIR SEY anlamiyordu. Anlasilmayan ogun,
     girilmemis ogun demektir. */
  { id:'lahmacun', name:'Lahmacun', cat:'yemek',
    kcal:239, p:10.4, f:7.8, sat:2.4, c:32.0, fib:2.1,
    micro:{ iron:2.2, calcium:48, magnesium:30, zinc:1.3, potassium:220, b12:0.4, folate:34,
            vitc:6, vitd:0.1, omega3:0.03, selenium:12, iodine:3, sodium:520 },
    ironType:'heme', flags:[],
    portions:[{ label:'1 adet', g:130 }, { label:'yarım', g:65 }],
    aliases:['lahmacun','lahmacun yedim'] },

  { id:'iskender', name:'İskender kebap', cat:'yemek',
    kcal:214, p:13.5, f:12.8, sat:5.6, c:11.4, fib:0.9,
    micro:{ iron:2.0, calcium:78, magnesium:26, zinc:2.6, potassium:280, b12:1.6, folate:14,
            vitc:3, vitd:0.2, omega3:0.05, selenium:16, iodine:6, sodium:610 },
    ironType:'heme', flags:[],
    portions:[{ label:'1 porsiyon', g:280 }, { label:'yarım porsiyon', g:140 }],
    aliases:['iskender','iskender kebap','kebap','döner'] },

  { id:'cig-kofte', name:'Çiğ köfte (etsiz)', cat:'yemek',
    kcal:178, p:5.2, f:3.1, sat:0.5, c:32.6, fib:4.4,
    micro:{ iron:2.4, calcium:30, magnesium:58, zinc:1.2, potassium:300, b12:0, folate:36,
            vitc:14, vitd:0, omega3:0.05, selenium:5, iodine:1, sodium:480 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 porsiyon', g:150 }, { label:'1 dürüm', g:200 }],
    aliases:['çiğ köfte','cig kofte','çiğköfte'] },

  { id:'pide-kiymali', name:'Kıymalı pide', cat:'yemek',
    kcal:248, p:11.2, f:9.4, sat:3.6, c:30.2, fib:1.8,
    micro:{ iron:2.1, calcium:62, magnesium:28, zinc:1.8, potassium:210, b12:0.8, folate:30,
            vitc:2, vitd:0.1, omega3:0.03, selenium:14, iodine:4, sodium:560 },
    ironType:'heme', flags:[],
    portions:[{ label:'1 dilim', g:90 }, { label:'1 pide', g:320 }],
    aliases:['pide','kıymalı pide','kiymali pide'] },

  { id:'tost', name:'Kaşarlı tost', cat:'yemek',
    kcal:295, p:13.8, f:14.2, sat:7.8, c:28.4, fib:1.6,
    micro:{ iron:1.4, calcium:290, magnesium:24, zinc:1.6, potassium:150, b12:0.9, folate:22,
            vitc:0, vitd:0.3, omega3:0.02, selenium:15, iodine:14, sodium:680 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 adet', g:120 }],
    aliases:['tost','kaşarlı tost','sandviç'] },

  { id:'simit', name:'Simit', cat:'tahil',
    kcal:307, p:9.1, f:5.4, sat:1.0, c:54.6, fib:2.6,
    micro:{ iron:2.6, calcium:44, magnesium:34, zinc:1.4, potassium:150, b12:0, folate:42,
            vitc:0, vitd:0, omega3:0.04, selenium:18, iodine:2, sodium:430 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 adet', g:100 }, { label:'yarım', g:50 }],
    aliases:['simit','gevrek'] },

  { id:'borek', name:'Peynirli börek', cat:'yemek',
    kcal:296, p:9.4, f:16.8, sat:6.2, c:26.8, fib:1.2,
    micro:{ iron:1.3, calcium:180, magnesium:20, zinc:1.1, potassium:120, b12:0.5, folate:26,
            vitc:0, vitd:0.4, omega3:0.03, selenium:12, iodine:12, sodium:590 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 dilim', g:110 }],
    aliases:['börek','borek','peynirli börek','su böreği'] },

  /* --------------------------------------------------- takviye ve toz
     Takviye bir GIDA olarak girilir; ilac kaydiyla karistirilmaz.
     Ilac kaydi «neyi kullaniyorsun» sorusunun cevabidir ve olcumu
     bozar; burasi «bugun ne aldin» sorusunun cevabidir ve makroya
     girer. Ikisi ayri sorulardir. */
  { id:'protein-tozu', name:'Protein tozu (whey)', cat:'kuruyemis',
    kcal:377, p:78.0, f:5.5, sat:2.8, c:7.2, fib:0.8,
    micro:{ iron:1.0, calcium:480, magnesium:80, zinc:2.4, potassium:520, b12:1.2, folate:20,
            vitc:0, vitd:0.6, omega3:0.02, selenium:20, iodine:10, sodium:290 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 ölçek', g:30 }, { label:'2 ölçek', g:60 }],
    aliases:['protein tozu','whey','protein shake','protein içtim'] },

  /* ------------------------------------------------------ kuru meyve */
  { id:'kuru-uzum', name:'Kuru üzüm', cat:'meyve',
    kcal:299, p:3.1, f:0.5, sat:0.1, c:79.2, fib:3.7,
    micro:{ iron:1.9, calcium:50, magnesium:32, zinc:0.2, potassium:749, b12:0, folate:5,
            vitc:2, vitd:0, omega3:0.01, selenium:1, iodine:1, sodium:11 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 avuç', g:30 }, { label:'1 çay kaşığı', g:8 }],
    aliases:['kuru üzüm','üzüm kurusu','kuruüzüm'] },


  { id:'hurma', name:'Hurma', cat:'meyve',
    kcal:277, p:1.8, f:0.2, sat:0.0, c:75.0, fib:6.7,
    micro:{ iron:0.9, calcium:64, magnesium:54, zinc:0.4, potassium:696, b12:0, folate:15,
            vitc:0, vitd:0, omega3:0.01, selenium:3, iodine:1, sodium:2 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'1 adet', g:24 }, { label:'3 adet', g:72 }],
    aliases:['hurma','tarih'] },

  /* --------------------------------------------------------- kahvalti */

  { id:'tahin-pekmez', name:'Tahin pekmez', cat:'tatli',
    kcal:490, p:9.2, f:26.4, sat:3.8, c:54.0, fib:4.2,
    micro:{ iron:6.8, calcium:320, magnesium:180, zinc:3.6, potassium:520, b12:0, folate:38,
            vitc:0, vitd:0, omega3:0.15, selenium:12, iodine:2, sodium:26 },
    ironType:'nonheme', flags:['phytate'],
    portions:[{ label:'1 yemek kaşığı', g:22 }],
    aliases:['tahin pekmez','tahin','pekmez'] },

  { id:'zeytin-siyah', name:'Siyah zeytin', cat:'yag',
    kcal:115, p:0.8, f:10.7, sat:1.4, c:6.3, fib:3.2,
    micro:{ iron:3.3, calcium:88, magnesium:4, zinc:0.2, potassium:8, b12:0, folate:0,
            vitc:0, vitd:0, omega3:0.06, selenium:1, iodine:1, sodium:735 },
    ironType:'nonheme', flags:[],
    portions:[{ label:'5 adet', g:20 }, { label:'10 adet', g:40 }],
    aliases:['zeytin','siyah zeytin'] },

  /* ------------------------------------------------------------ icecek */
  { id:'turk-kahvesi', name:'Türk kahvesi', cat:'icecek',
    kcal:9, p:0.3, f:0.1, sat:0.0, c:1.6, fib:0.2,
    micro:{ iron:0.1, calcium:4, magnesium:6, zinc:0.0, potassium:60, b12:0, folate:0,
            vitc:0, vitd:0, omega3:0, selenium:0, iodine:0, sodium:2 },
    ironType:'nonheme', flags:['tannin'],
    portions:[{ label:'1 fincan', g:70 }],
    aliases:['türk kahvesi','kahve','türk kahvesi içtim'] },

  { id:'sut', name:'Süt (tam yağlı)', cat:'sut',
    kcal:61, p:3.2, f:3.3, sat:1.9, c:4.8, fib:0,
    micro:{ iron:0, calcium:113, magnesium:10, zinc:0.4, potassium:143, b12:0.5, folate:5,
            vitc:0, vitd:0.1, omega3:0.02, selenium:2, iodine:20, sodium:43 },
    ironType:'nonheme', flags:['calcium'],
    portions:[{ label:'1 bardak', g:200 }],
    aliases:['sut','süt'] },

  { id:'kefir', name:'Kefir', cat:'sut',
    kcal:56, p:3.3, f:2.0, sat:1.2, c:5.4, fib:0,
    micro:{ iron:0.1, calcium:120, magnesium:12, zinc:0.4, potassium:160, b12:0.3, folate:8,
            vitc:0.9, vitd:0.1, omega3:0.02, selenium:2, iodine:15, sodium:40 },
    ironType:'nonheme', flags:['calcium'],
    portions:[{ label:'1 bardak', g:200 }],
    aliases:['kefir'] },
];

SP.FOOD_BY_ID = SP.FOODS.reduce(function(acc, f){ acc[f.id] = f; return acc; }, {});

/* Ogun tipleri — gun icindeki dagilimi okumak icin. */
SP.MEAL_SLOTS = [
  { id:'kahvalti', label:'Kahvaltı',   icon:'today' },
  { id:'ara1',     label:'Ara öğün',   icon:'meal' },
  { id:'ogle',     label:'Öğle',       icon:'meal' },
  { id:'ara2',     label:'İkindi',     icon:'meal' },
  { id:'aksam',    label:'Akşam',      icon:'meal' },
  { id:'gece',     label:'Gece',       icon:'moon' },
];
