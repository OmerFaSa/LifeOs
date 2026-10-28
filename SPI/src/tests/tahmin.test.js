/* Kişisel tahmin ağı (core/tahmin.js).
   Kanıtlanan: 20 günden az eğitilmez; gerçek bir ilişkiyi (uyku → his)
   zamana göre ayrılmış sınavda tabandan iyi öğrenir ve en önemli özellik
   olarak bulur; ilişki yokken tabanı geçmez ve tahmin göstermez; tohumlu
   eğitim tekrarlanabilir; tahmin 1–5 aralığında. */
(function(){
  const { describe, it, expect } = SP.Test;
  const T = () => SP.Tahmin;
  function sentetik(n, iliski, tohum){
    const r = T().rng(tohum || 3), out = [];
    for(let i = 0; i < n; i++){
      const uyku = 5 + r() * 4, kahve = Math.floor(r() * 3), dow = i % 7;
      const x = { uyku, kahve, antrenman:r() < 0.4 ? 1 : 0, haftasonu:dow >= 5 ? 1 : 0, tatli:Math.floor(r() * 2) };
      const y = iliski ? Math.max(1, Math.min(5, Math.round(1 + (uyku - 5) * 1 + (r() - 0.5) * 0.6))) : 1 + Math.floor(r() * 5);
      out.push({ tarih:'g' + i, x, y });
    }
    return out;
  }
  describe('Kişisel tahmin ağı', () => {
    it('20 günden az eğitilmez', () => {
      const m = T().egit(sentetik(15, true));
      expect(m.ok).toBe(false);
      expect(m.why).toContain('en az 20');
    });
    it('gerçek ilişkiyi tabandan iyi öğrenir; en önemli özellik uyku, yönü artı', () => {
      const m = T().egit(sentetik(80, true));
      expect(m.ok && m.iyi).toBe(true);
      expect(m.maeModel < m.maeTaban).toBe(true);
      expect([m.onem[0].ozellik, m.onem[0].yon]).toEqual(['uyku', 1]);
      const t = m.tahminEt({ uyku:8.5, kahve:1, antrenman:0, haftasonu:0, tatli:0 });
      expect(t >= 1 && t <= 5 && t > m.tahminEt({ uyku:5.2, kahve:1, antrenman:0, haftasonu:0, tatli:0 })).toBe(true);
    });
    it('ilişki yokken tabanı geçmez (ezber yok)', () => {
      const m = T().egit(sentetik(80, false, 11));
      expect(m.iyi).toBe(false);
    });
    it('öbür modüllerin günü girdi olur; yayın yoksa sütun hiç girmez', () => {
      const U = SP.U, eskiV = SP.S.vitals;
      try{
        SP.S.vitals = {};
        const gunler = {};
        for(let i = 0; i < 40; i++){
          const d = U.iso(U.addDays(U.today(), -i));
          const muz = (i * 7) % 60;
          SP.S.vitals[d] = { soreness:Math.max(1, Math.min(5, Math.round(1 + muz / 15))) };
          gunler[d] = { toplam:muz, music:muz };
        }
        T()._dis({});
        const x0 = T().gunOzellik(U.todayISO());
        expect(x0.espMuzik).toBe(null);
        T()._dis({ esp:gunler });
        expect(T().gunOzellik(U.todayISO()).espMuzik).toBe(0);
        const m = T().egit(T().veriSeti(60));
        expect(m.ok && m.iyi).toBe(true);
        expect(m.kaynaklar).toEqual(['SPİ', 'ESP']);
        expect(['espMuzik', 'espToplam'].indexOf(m.onem[0].ozellik) >= 0).toBe(true);
      }finally{ SP.S.vitals = eskiV; T()._dis({}); }
    });
    /* Başarım (2026-10-29): durum() her çizimde (Onaylar sayacı) çağrılır; önbellek
       anahtarı için bile 365 günün özelliği (öğünler, besin toplamı) hesaplanıyordu
       (~45 ms). Etiketler değişmedikçe özellik hesaplanmaz; etiket değişince yeniden. */
    it('etiketler değişmedikçe durum() özellik hesaplamaz; etiket değişince hesaplar', () => {
      const eskiV = SP.S.vitals, eskiM = SP.Model.mealsOf; let say = 0;
      try{
        SP.S.vitals = {};
        for(let i = 0; i < 25; i++){ const d = SP.U.iso(SP.U.addDays(SP.U.today(), -i)); SP.S.vitals[d] = { sleep:6 + (i % 3), soreness:1 + (i % 5) }; }
        SP.Model.mealsOf = d => { say++; return eskiM.call(SP.Model, d); };
        T().durum(); const ilk = say;
        T().durum();
        expect(ilk > 0).toBe(true);
        expect(say).toBe(ilk);
        SP.S.vitals[SP.U.todayISO()].soreness = 5;
        T().durum();
        expect(say > ilk).toBe(true);
      }finally{ SP.S.vitals = eskiV; SP.Model.mealsOf = eskiM; }
    });
    it('tohumlu eğitim tekrarlanabilir', () => {
      const a = T().egit(sentetik(40, true)), b = T().egit(sentetik(40, true));
      expect(a.maeModel).toBe(b.maeModel);
    });
  });
})();
