/* Barkod (core/barkod.js, fikir 4). Kanıtladığı sözler: kontrol hanesi
   tutmayan numara kaydedilmez; UPC-A ile EAN-13 aynı anahtardır; bilinmeyen
   barkod için gıda tahmin edilmez; silinmiş gıdaya bağlı barkod «yok»tur. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const B = () => SP.Barkod;

  describe('Barkod', () => {
    it('kontrol hanesi denetlenir; UPC-A başına 0 alır', () => {
      expect(B().gecerli('8690504000017')).toBe(false);
      expect(B().gecerli('4006381333931')).toBe(true);   // EAN-13
      expect(B().gecerli('96385074')).toBe(true);        // EAN-8
      expect(B().gecerli('036000291452')).toBe(true);    // UPC-A
      expect(B().normal('036000291452')).toBe('0036000291452');
      expect(B().gecerli('4006381333932')).toBe(false);
      expect(B().denetle('12345').why).toContain('5 haneli');
      expect(B().denetle('4006381333932').ok).toBe(false);
      expect(B().denetle(' 4006-3813-33931 ').kod).toBe('4006381333931');
    });

    it('bilinmeyen barkod gıda getirmez; bağlanınca gelir, silinmiş gıda gelmez', async () => {
      resetState();
      const r = await B().coz('4006381333931');
      expect([r.ok, r.foodId]).toEqual([true, null]);
      expect((await B().bagla('4006381333932', 'yumurta')).ok).toBe(false);
      expect((await B().bagla('4006381333931', 'olmayan-gida')).ok).toBe(false);
      expect((await B().bagla('4006381333931', 'yumurta')).ok).toBe(true);
      expect((await B().coz('4006381333931')).foodId).toBe('yumurta');
      /* UPC-A ve EAN-13 aynı ürün */
      await B().bagla('036000291452', 'yumurta');
      expect(B().bul('0036000291452')).toBe('yumurta');
      SP.S.barkodlar['96385074'] = 'silinmis-gida';
      expect(B().bul('96385074')).toBeNull();
    });
  });
})();
