/* Vücut analizi (core/vucut.js) — formüller elle hesaplanmış değerlerle.
   Kanıtlanan: BKİ ve DSÖ bandı; bel/boy eşiği; Donanma yöntemi (erkek,
   kadın); yağsız kütle ve FFMI; Theil–Sen kilo eğilimi tek aykırı tartıdan
   etkilenmez; eksik ölçü sıfır sayılmaz; enerji tahmini eşiği. */
(function(){
  const { describe, it, expect } = SP.Test;
  const V = () => SP.Vucut;
  const yakin = (a, b, t) => Math.abs(a - b) <= (t || 0.15);

  describe('Vücut analizi — formüller', () => {
    it('BKİ: 70 kg, 175 cm = 22,9, normal bant', () => {
      const b = V().bki(70, 175);
      expect([b.deger, b.bant]).toEqual([22.9, 'Normal (DSÖ)']);
      expect(V().bki(95, 175).bant).toBe('Obez bandı (DSÖ)');
      expect(V().bki(null, 175)).toBe(null);
    });
    it('bel/boy: 90/175 = 0,51 dikkat; 80/175 değil', () => {
      expect([V().belBoy(90, 175).deger, V().belBoy(90, 175).dikkat]).toEqual([0.51, true]);
      expect(V().belBoy(80, 175).dikkat).toBe(false);
    });
    it('Donanma yöntemi: erkek 178/38/85 ≈ %16,4; kadın 165/32/72/96 ≈ %26,4; kadında kalça yoksa yok', () => {
      expect(yakin(V().navyYag('male', 178, 38, 85).deger, 16.4)).toBe(true);
      expect(yakin(V().navyYag('female', 165, 32, 72, 96).deger, 26.4)).toBe(true);
      expect(V().navyYag('female', 165, 32, 72, null)).toBe(null);
      expect(V().navyYag('male', 178, 38, 85).etiket).toBe('tahmin');
    });
    it('yağsız kütle: 80 kg, %15, 180 cm → 68 kg, FFMI 21,0', () => {
      const y = V().yagsiz(80, 15, 180);
      expect([y.kutle, y.ffmi, y.ffmiDuz, y.yagKg]).toEqual([68, 21, 21, 12]);
    });
  });

  describe('Vücut analizi — eğilim ve eksik', () => {
    const seri = (kgs) => kgs.map((kg, i) => ({ tarih:SP.U.iso(SP.U.addDays(SP.U.parse('2026-09-01'), i * 3)), kg }));
    it('Theil–Sen: her 3 günde −0,1 kg ≈ −0,23 kg/hafta; tek aykırı tartı sürüklemez', () => {
      const e = V().egilim(seri([80, 79.9, 79.8, 79.7, 79.6, 79.5, 79.4]));
      expect([yakin(e.haftalik, -0.23, 0.02), e.yon]).toEqual([true, 'azalıyor']);
      const a = V().egilim(seri([80, 79.9, 79.8, 85, 79.6, 79.5, 79.4]));
      expect(yakin(a.haftalik, -0.23, 0.05)).toBe(true);
    });
    it('az tartı ya da kısa yayılım: eğilim söylenmez', () => {
      expect(V().egilim(seri([80, 79, 78])).ok).toBe(false);
      const kisa = [0, 1, 2, 3, 4, 5].map(i => ({ tarih:'2026-09-0' + (i + 1), kg:80 - i * 0.1 }));
      expect(V().egilim(kisa).ok).toBe(false);
    });
    it('eksik ölçü sıfır sayılmaz; ölçülen yağ Donanma tahmininden önce gelir; enerji eşiği', () => {
      const a = V().analiz({ profil:{ heightCm:180, sex:'male' }, son:{ weight:80 }, kilolar:[] });
      expect([a.belBoy, a.yag, a.yagsiz]).toEqual([null, null, null]);
      expect(a.eksik.indexOf('bel') >= 0).toBe(true);
      const b = V().analiz({ profil:{ heightCm:180, sex:'male' }, son:{ weight:80, waist:85, neck:38, bodyfat:18 }, kilolar:[] });
      expect([b.yag.deger, b.yag.etiket]).toEqual([18, 'ölçüldü']);
      const eg = { ok:true, haftalik:-0.5 };
      expect(V().enerji(2000, 10, eg)).toBe(null);
      expect(V().enerji(2000, 20, eg).harcama).toBe(2550);
    });
  });
})();
