/* Puan ve sıra tahmini — referans veriler.

   UYARI — bu bir tahmindir, hesap değildir.
   ÖSYM puanı ham netten değil, standart sapmaya göre normalize edilmiş
   standart puanlardan üretir. Aday dağılımı her yıl değişir; aynı net
   farklı yıllarda farklı puana ve sıraya karşılık gelir. Buradaki katsayılar
   ve sıra tablosu, son yılların açıklanmış sonuçlarından çıkarılmış
   KOÇLUK BANDI'dır. Tek sayı olarak sunulmaz; her zaman bir aralık ve
   kesinlik etiketiyle gösterilir (bkz. R.PROVENANCE).

   Kural motoru bu tabloyu okur; LLM okumaz ve sıra vaadi veremez
   (R.PROMPTS.forbidden → 'rank-promise'). */

window.R = window.R || {};

R.SCORING = {
  /* Taban puan: hiç soru yapılmasa bile verilen puan. */
  base: 100,

  /* TYT ham puan yaklasimi: net basina katsayi.
     40 Türkçe + 20 Sosyal + 40 Matematik + 20 Fen = 120 soru.
     Yaklasik olarak 500'lük olcekte net basina ~3.3 puan. */
  tyt: {
    questions: 120,
    perNet: 3.33,
    maxRaw: 500,
  },

  /* AYT SAY ham puan yaklasimi: 40 Matematik + 14 Fizik + 13 Kimya + 13 Biyoloji = 80 soru.
     SAY puani TYT'nin %40'i + AYT'nin %60'i agirligiyla olusur.

     perNet 5: 0,6 x 5 = AYT neti basina 3,0 puan (OSYM SAY katsayilari
     AYT Mat 3,0 · Fizik 2,85 · Kimya/Biyoloji 3,07); 0,4 x 3,33 = TYT neti
     basina 1,33 (OSYM 1,32–1,36). Tam net (120 + 80) ~500 eder.
     Duzeltme (2026-10-17, analiz denetimi): perNet 3,75 idi; AYT neti basina
     2,25 puan veriyordu, tam net 440'ta kaliyordu ve AYT denemesi EKLEMEK
     ayni duzeydeki adayin tahminini dusuruyordu (TYT 90 yalniz: 400; TYT 90
     + AYT 60: 355 → sira ~21 bin yerine ~75 bin). */
  ayt: {
    questions: 80,
    perNet: 5,
    tytWeight: 0.40,
    aytWeight: 0.60,
  },

  /* Belirsizlik: tahmin bandinin yarim genisligi (puan).
     Veri arttikca daralir; 3 denemenin altinda konusmayiz. */
  bandHalfWidth: {
    few: 18,      // 3–4 tam deneme
    some: 12,     // 5–7
    many: 8,      // 8+
  },

  /* Sıra referans noktaları — SAY YERLEŞTİRME puanı (OBP dahil) → kümülatif
     başarı sırası, 2025-YKS yaklaşık değerleri. Aradaki değerler log-lineer
     aradeğerleme ile bulunur; uçlarda kırpılır.
     Kaynak (analiz denetimi, 2026-10-17): 2025 yerleştirme taban puanı/sıra
     eşleşmeleri — ykskocum.com «sayısal puan yığılması» ve testyurdu.com
     sıralama tablosu (birbiriyle tutarlı; ör. İÜC Bilgisayar 455,7 → 41.051).
     310'un altı kaynakta yok: 290–200 arası eğimin UZATMASIDIR (tahmin).
     Eski tablo bu değerlerin ~20 katı iyimserdi (480 → 200, 440 → 4.000);
     eski AYT katsayısı hatası ile birbirini kısmen örtüyordu.
     Her yıl değişir: yeni yılın verisiyle tazelenmeli. */
  sayRankTable: [
    { score: 560, rank: 1 },
    { score: 550, rank: 60 },
    { score: 530, rank: 1900 },
    { score: 510, rank: 7000 },
    { score: 490, rank: 16000 },
    { score: 470, rank: 29000 },
    { score: 450, rank: 46000 },
    { score: 430, rank: 64000 },
    { score: 410, rank: 87000 },
    { score: 390, rank: 111000 },
    { score: 370, rank: 139000 },
    { score: 350, rank: 174000 },
    { score: 330, rank: 217000 },
    { score: 310, rank: 274000 },
    { score: 290, rank: 345000 },
    { score: 270, rank: 435000 },
    { score: 250, rank: 545000 },
    { score: 200, rank: 900000 },
  ],

  /* Yerlesme olasiligi degil, "bant konumu" etiketi.
     Yuzde vermiyoruz; oran vaadi FORBIDDEN kapsamindadir. */
  positions: [
    { key:'above',  label:'Hedefin üstünde', tone:'ok',
      note:'Bu tempoda hedef sıranın üstündesin. Bandı korumak yeni konu açmaktan önce gelir.' },
    { key:'inband', label:'Hedef bandında',  tone:'ok',
      note:'Hedef sıranın etrafındasın. Karar tek denemeyle değil, medyanla verilir.' },
    { key:'near',   label:'Bandın kıyısında', tone:'warn',
      note:'Hedefe yakınsın ama bandın altındasın. En büyük tek net kaybını kapatmak yeterli olabilir.' },
    { key:'below',  label:'Bandın altında',  tone:'warn',
      note:'Şu an hedefin altındasın. Panik değil: konu kapanışı ve hata dağılımı bu farkın nedenini söyler.' },
    { key:'unknown', label:'Veri yetersiz',  tone:'muted',
      note:'En az 3 tam deneme gerekir. Öncesinde tahmin üretmek yanıltıcıdır.' },
  ],

  /* Konu risk skoru agirliklari — 0..100 arasi tek sayi uretilir.
     Amac: "once neye calisayim" sorusunu veriyle cevaplamak. */
  riskWeights: {
    freq:     30,   // konunun sinavdaki agirligi (yuksek frekans daha riskli)
    closure:  28,   // kapanmamis konu riskli
    errors:   22,   // bu konudan gelen acik yanlis sayisi
    cards:    12,   // gecikmis tekrar karti
    stale:     8,   // uzun suredir dokunulmamis
  },
  riskBands: [
    { min:70, key:'high', label:'Yüksek risk', tone:'danger' },
    { min:45, key:'mid',  label:'Orta risk',   tone:'warn' },
    { min:0,  key:'low',  label:'Düşük risk',  tone:'ok' },
  ],

  /* Konuya "uzun suredir dokunulmadi" esigi (gun). */
  staleDays: 21,
};
