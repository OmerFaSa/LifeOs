/* Ölçü soruları (brand/ortak/olcu.js, King 5 tur 5): sayıyı kod üretir; kayıtsız gün sıfır değildir. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const O = () => window.LIFEOS.OLCU;
  const BUGUN = '2026-11-08';   // pazar
  function kur(){
    const soru = { '2026-11-03':40, '2026-11-04':60, '2026-11-08':20, '2026-10-28':30 };
    const kilo = { '2026-10-12':74.6, '2026-10-30':73.8, '2026-11-07':73.1 };
    O().kur({ modul:'deneme', olculer:[
      { id:'kalan', ad:'sınava kalan gün', es:/kaç gün kaldı/, tur:'anlik', anlik:() => ({ v:223, metin:'Sınava 223 gün kaldı.' }) },
      { id:'net', ad:'net', birim:'net', es:/\bnet/, tur:'olay', alt:[['Matematik', /matematik/]],
        olaylar:alt => [{ t:'2026-10-04', v:alt ? 18 : 60 }, { t:'2026-10-18', v:alt ? 20 : 64.5 }, { t:'2026-11-01', v:alt ? 23.25 : 70 }] },
      { id:'soru', ad:'çözülen soru', birim:'soru', es:/soru/, tur:'toplam', gun:g => soru[g] == null ? null : soru[g] },
      { id:'kilo', ad:'kilo', birim:'kg', es:/kilo/, tur:'son', ondalik:true, gun:g => kilo[g] == null ? null : kilo[g] },
    ] });
  }
  describe('Ölçü soruları (King 5 tur 5)', () => {
    it('dönem: bu hafta pazartesiden bugüne, geçen hafta, son N gün, son N deneme', () => {
      expect(O().donem('bu hafta kaç soru', BUGUN)).toEqual({ bas:'2026-11-02', son:'2026-11-08', ad:'bu hafta' });
      expect(O().donem('geçen hafta', BUGUN)).toEqual({ bas:'2026-10-26', son:'2026-11-01', ad:'geçen hafta' });
      expect(O().donem('son 3 gün', BUGUN).bas).toBe('2026-11-06');
      expect(O().donem('son 5 denemede', BUGUN).adet).toBe(5);
    });
    it('toplam kayıtlı günlerden; kayıtsız gün sıfır sayılmaz ve söylenir', () => {
      kur();
      try{
        const r = O().coz('bu hafta kaç soru çözdüm', BUGUN);
        expect(r.cevap).toBe('Bu hafta çözülen soru: 120 soru (3 günde kayıt var).');
        expect(O().coz('dün kaç soru çözdüm', BUGUN).cevap).toContain('kaydı yok');
        /* Kayıt cümlesi soru değildir: King onu veri olarak okur. */
        expect(O().coz('bugün 40 soru çözdüm', BUGUN)).toBe(null);
      }finally{ O()._sifirla(); }
    });
    it('değişim: kilo dönemin ilk ve son ölçümü; net olayları ve alt kırılım', () => {
      kur();
      try{
        expect(O().coz('kilom son bir ayda nasıl değişti', BUGUN).cevap).toBe('Son 1 ay kilo 74,6 → 73,1 kg (-1,5 kg, 3 ölçüm).');
        expect(O().coz('TYT net ortalamam kaç', BUGUN).cevap).toContain('ortalaman 64,83 net (3 deneme)');
        expect(O().coz('matematik netim son 2 denemede nasıl değişti', BUGUN).cevap).toContain('20 → 23,25 net (+3,25)');
        expect(O().coz('sınava kaç gün kaldı', BUGUN).cevap).toBe('Sınava 223 gün kaldı.');
        expect(O().coz('bu hafta soru sayım geçen haftaya göre arttı mı', BUGUN).cevap).toContain('geçen hafta 30 soru. Arttı (+90)');
      }finally{ O()._sifirla(); }
    });
  });
})();
