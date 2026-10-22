/* ÜRETİLMİŞ DOSYA — BURAYI DÜZENLEME. Kaynak: veri/temiz/ays/konu_dagilimi.jsonl,
   üreten: python tools/veri_ays_siklik.py

   TYT Matematik'te konu başına yıllık soru sayısı (ikincil kaynak, «tahmin»).
   null = kaynakta yok; sıfır sayılmaz. Öncelik hesabına GİRMEZ (calc.js
   konunun freq alanını kullanır); konu ekranında kanıt olarak çizilir. */

window.R = window.R || {};

R.SORU_SIKLIK = {
  kaynak:"https://www.ozeldersalani.com/yks-tyt-ayt-soru-dagilimi",
  etiket:'tahmin',
  sinav:'TYT Matematik',
  yillar:[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
  konular:{
    'tm-01':[{"ad":"Temel Kavramlar","seri":[4,4,1,3,3,2,1,2],"ortak":false}],
    'tm-02':[{"ad":"Sayı Basamakları","seri":[1,2,1,2,1,1,2,1],"ortak":false}],
    'tm-03':[{"ad":"Bölünebilme Kuralları","seri":[null,1,1,1,1,1,1,2],"ortak":false}],
    'tm-05':[{"ad":"Rasyonel Sayılar","seri":[null,1,3,null,2,2,2,1],"ortak":false}],
    'tm-07':[{"ad":"Mutlak Değer","seri":[1,1,1,1,1,1,2,null],"ortak":false}],
    'tm-08':[{"ad":"Üslü – Köklü Sayılar","seri":[1,2,2,2,2,2,2,2],"ortak":true}],
    'tm-09':[{"ad":"Üslü – Köklü Sayılar","seri":[1,2,2,2,2,2,2,2],"ortak":true}],
    'tm-11':[{"ad":"Oran – Orantı","seri":[null,null,1,1,1,1,null,1],"ortak":false}],
    'tm-13':[{"ad":"Problemler (toplam)","seri":[11,12,13,11,13,10,11,14],"ortak":true}],
    'tm-14':[{"ad":"Problemler (toplam)","seri":[11,12,13,11,13,10,11,14],"ortak":true}],
    'tm-15':[{"ad":"Problemler (toplam)","seri":[11,12,13,11,13,10,11,14],"ortak":true}],
    'tm-16':[{"ad":"Problemler (toplam)","seri":[11,12,13,11,13,10,11,14],"ortak":true}],
    'tm-17':[{"ad":"Problemler (toplam)","seri":[11,12,13,11,13,10,11,14],"ortak":true}],
    'tm-18':[{"ad":"Problemler (toplam)","seri":[11,12,13,11,13,10,11,14],"ortak":true}],
    'tm-19':[{"ad":"Problemler (toplam)","seri":[11,12,13,11,13,10,11,14],"ortak":true}],
    'tm-20':[{"ad":"Problemler (toplam)","seri":[11,12,13,11,13,10,11,14],"ortak":true}],
    'tm-21':[{"ad":"Kümeler","seri":[2,1,1,1,1,1,1,1],"ortak":false}],
    'tm-22':[{"ad":"Mantık","seri":[null,null,null,1,1,1,1,1],"ortak":false}],
    'tm-23':[{"ad":"Fonksiyonlar","seri":[1,2,2,1,1,1,1,1],"ortak":false}],
    'tm-26':[{"ad":"Permütasyon – Kombinasyon","seri":[1,1,2,null,null,1,3,2],"ortak":false},{"ad":"Olasılık","seri":[2,1,1,1,1,1,1,1],"ortak":false}],
    'tm-27':[{"ad":"Veri – İstatistik","seri":[null,1,null,1,1,1,1,1],"ortak":false}],
  },
};
