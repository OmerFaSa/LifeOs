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

    /* King 3.0 K5: görsel modelin okuduğu numara da kontrol hanesinden geçer;
       Open Food Facts değeri kaynak etiketiyle gelir, eksik alan boş kalır. */
    it('görsel modelin okuması: tutmayan numara reddedilir, iki barkod seçilmez', async () => {
      resetState();
      expect(B().metindenKod('Barkod: 4006 3813 3393 1').kod).toBe('4006381333931');
      expect(B().metindenKod('4006381333932').ok).toBe(false);
      expect(B().metindenKod('4006381333931 ve 96385074').why).toContain('birden çok');
      expect((await B().modelden(null)).ok).toBe(false);
      const r = await B().modelden(async () => ({ ok:true, text:'4006381333931' }));
      expect([r.ok, r.kod, r.foodId]).toEqual([true, '4006381333931', null]);
    });

    it('Open Food Facts: 100 g değerleri ve porsiyon; ürün yoksa veri yok; ağ hatası söylenir', async () => {
      const istek = [];
      B().ag = async u => { istek.push(u);
        if(/4006381333931/.test(u)) return { ok:true, status:200, json:async () => ({ status:1, product:{ product_name:'Yulaf ezmesi', brands:'Marka, Diğer',
          nutriments:{ 'energy-kcal_100g':372, proteins_100g:13.5, fat_100g:'7', carbohydrates_100g:58.7 }, serving_quantity:40, serving_size:'40 g' } }) };
        if(/96385074/.test(u)) return { ok:true, status:200, json:async () => ({ status:0 }) };
        throw new Error('ağ yok'); };
      try{
        const r = await B().disBul('4006381333931');
        expect(istek[0].indexOf('https://world.openfoodfacts.org/api/v2/product/4006381333931.json')).toBe(0);
        expect([r.urun.ad, r.urun.marka, r.urun.v.kcal, r.urun.v.f, r.urun.v.fib, r.urun.porsiyon.g, r.urun.kaynak])
          .toEqual(['Yulaf ezmesi', 'Marka', 372, 7, null, 40, 'Open Food Facts · doğrulanmadı']);
        expect((await B().disBul('96385074')).urun).toBeNull();
        expect((await B().disBul('036000291452')).why).toContain('ulaşılamadı');
        expect((await B().disBul('123')).ok).toBe(false);
        expect(istek.length).toBe(3);
      }finally{ B().ag = null; }
    });
  });
})();
