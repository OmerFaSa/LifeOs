/* Puan ve sıra tahmini — referans veriler.

   UYARI — bu bir tahmindir, hesap değildir.
   ÖSYM puanı ham netten değil, standart sapmaya göre normalize edilmiş
   standart puanlardan üretir. Aday dağılımı her yıl değişir; aynı net
   farklı yıllarda farklı puana ve sıraya karşılık gelir. Buradaki katsayılar
   ve sıra tablosu, son yılların açıklanmış sonuçlarından çıkarılmış
   KOÇLUK BANDI'dır. Tek sayı olarak sunulmaz; her zaman bir aralık ve
   kesinlik etiketiyle gösterilir (bkz. R.CERTAINTY).

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
     SAY puani TYT'nin %40'i + AYT'nin %60'i agirligiyla olusur. */
  ayt: {
    questions: 80,
    perNet: 3.75,
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

  /* Sıra referans noktaları — SAY sıralaması (yaklaşık, 2024–2026 ortalaması).
     Aradaki değerler log-lineer aradeğerleme ile bulunur; uçlarda kırpılır. */
  sayRankTable: [
    { score: 500, rank: 1 },
    { score: 480, rank: 200 },
    { score: 460, rank: 1200 },
    { score: 440, rank: 4000 },
    { score: 420, rank: 10000 },
    { score: 400, rank: 21000 },
    { score: 380, rank: 40000 },
    { score: 360, rank: 68000 },
    { score: 340, rank: 105000 },
    { score: 320, rank: 155000 },
    { score: 300, rank: 220000 },
    { score: 280, rank: 305000 },
    { score: 260, rank: 410000 },
    { score: 240, rank: 540000 },
    { score: 220, rank: 700000 },
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
