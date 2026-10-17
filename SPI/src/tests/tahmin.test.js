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
    it('tohumlu eğitim tekrarlanabilir', () => {
      const a = T().egit(sentetik(40, true)), b = T().egit(sentetik(40, true));
      expect(a.maeModel).toBe(b.maeModel);
    });
  });
})();
