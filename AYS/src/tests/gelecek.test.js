/* Gelecek simülatörü (core/gelecek.js, screens/gelecek.js).

   Kanıtlanan sözler:
     1. Gidiş Theil–Sen: tek aykırı deneme eğimi sürüklemez.
     2. Hep aralık: alt ≤ en olası ≤ üst; etiket «tahmin».
     3. Eksik veri: 4'ten az deneme ya da 14 günden kısa yayılım → çizilmez,
        nedeni söylenir.
     4. «Ne olursa» yalnız ölçülen etkiyle: az aralık ya da tutarsız bağ →
        kapalı; tutarlı bağ → en olası net etkiyle kayar.
     5. Net sınırda: TYT 120'yi aşmaz.
     Ek: boş defterde ekran bozulmaz, «NaN» yazmaz. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const Gl = () => R.Gelecek;
  const seri = (nets, adim) => nets.map((n, i) => ({ tarih:R.U.iso(R.U.addDays(R.U.parse('2026-09-01'), i * (adim || 7))), net:n }));

  describe('Gelecek — gidiş', () => {
    it('tek aykırı deneme eğimi sürüklemez (Theil–Sen)', () => {
      const ts = Gl().theilSen([{ x:0, y:40 }, { x:7, y:42 }, { x:14, y:44 }, { x:21, y:10 }, { x:28, y:48 }]);
      expect(Math.round(ts.egim * 7)).toBe(2);
    });

    it('aralık sıralı ve etiketli; en olası düzeyden gidişle', () => {
      const z = Gl().izdusum(seri([40, 42, 44, 46, 48]), 'TYT', '2026-10-01', '2026-12-31');
      expect(z.ok).toBe(true);
      expect(z.etiket).toBe('tahmin');
      expect(z.alt <= z.olasi && z.olasi <= z.ust).toBe(true);
      expect(z.egimHafta).toBe(2);
      /* Kusursuz doğru bile sıfır belirsizlik değildir: en dar aralık bugünkü
         sıra tahmininin bandından (R.SCORING.bandHalfWidth) gelir. */
      expect(z.ust - z.alt > 0).toBe(true);
      expect(z.olasi > 46).toBe(true);
    });

    it('4 denemeden az ya da 14 günden kısa yayılımda çizilmez, nedeni söylenir', () => {
      let z = Gl().izdusum(seri([40, 42, 44]), 'TYT', '2026-10-01', '2027-06-19');
      expect(z.ok).toBe(false);
      expect(z.why).toContain('en az 4');
      z = Gl().izdusum(seri([40, 42, 44, 46], 3), 'TYT', '2026-10-01', '2027-06-19');
      expect(z.ok).toBe(false);
      expect(z.why).toContain('14 güne');
    });

    it('kısa veri uzak ufka taşınmaz: gidiş ölçülen sürenin en çok 3 katı (3 haftalık düşüş 8 ay uzatılıp «0 net» olmaz)', () => {
      const z = Gl().izdusum(seri([48.5, 46.5, 44.5, 42.5]), 'TYT', '2026-10-16', '2027-06-19');
      expect(z.ok).toBe(true);
      expect(z.sinavaKadar).toBe(false);
      expect(z.ufukGun).toBe(3 * z.yayilim);
      expect(z.olasi > 20).toBe(true);
      expect(z.ufukTarih < '2027-06-19').toBe(true);
      expect(z.gerekGun > 0).toBe(true);
      const uzun = Gl().izdusum(seri([40, 42, 44, 46, 48, 50, 52, 54, 56, 58], 14), 'TYT', '2026-10-16', '2026-12-31');
      expect(uzun.sinavaKadar).toBe(true);
    });

    it('net sınırı aşmaz', () => {
      const z = Gl().izdusum(seri([100, 105, 110, 115, 118]), 'TYT', '2026-10-01', '2027-06-19');
      expect(z.ust <= 120 && z.olasi <= 120).toBe(true);
    });
  });

  describe('Gelecek — ne olursa', () => {
    const iz = () => Gl().izdusum(seri([40, 42, 44, 46, 48]), 'TYT', '2026-10-01', '2026-12-31');
    it('az aralıkta etki uydurulmaz', () => {
      const e = Gl().hacimEtkisi([{ haftaSoru:200, haftaNet:1 }, { haftaSoru:300, haftaNet:2 }]);
      expect(e.ok).toBe(false);
      expect(e.why).toContain('en az 5');
      expect(Gl().senaryo(iz(), e, 100).olasi).toBe(iz().olasi);
    });
    it('tutarsız bağda (aralık sıfırın iki yanında) kapalı', () => {
      const e = Gl().hacimEtkisi([100, 200, 300, 400, 500, 600].map((q, i) => ({ haftaSoru:q, haftaNet:i % 2 ? 2 : -2 })));
      expect(e.ok).toBe(false);
      expect(e.belirsiz).toBe(true);
    });
    it('tutarlı bağda en olası net etkiyle kayar', () => {
      const e = Gl().hacimEtkisi([100, 200, 300, 400, 500, 600].map(q => ({ haftaSoru:q, haftaNet:q / 100 })));
      expect(e.ok).toBe(true);
      const once = iz(), sonra = Gl().senaryo(once, e, 100);
      const hafta = once.h / 7;
      expect(Math.abs(sonra.olasi - Math.min(120, once.olasi + 1 * hafta)) < 0.2).toBe(true);
      expect(sonra.alt <= sonra.olasi && sonra.olasi <= sonra.ust).toBe(true);
    });
  });

  describe('Gelecek — ekran', () => {
    it('boş defterde bozulmaz, nedeni söyler, NaN yazmaz', async () => {
      resetState();
      const h = String(await R.Screens.gelecek.render());
      expect(h).toContain('Sınav günü');
      expect(h).toContain('en az 4');
      expect(h.indexOf('NaN') < 0).toBe(true);
    });
  });
})();
