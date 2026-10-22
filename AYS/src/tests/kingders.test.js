/* Öğretmen (King, 2026-10-22): R.Ogren.kingDers konu anlatımını ders olarak verir. */
(function(){
  const { describe, it, expect } = R.Test;
  describe('King dersi (Öğren)', () => {
    it('«türevi» Türev konusunu bulur; bölümler anlatımdan, etiket ve soru bankası doğru', () => {
      const d = R.Ogren.kingDers('türevi');
      expect(d.id).toBe('am-11');
      expect(d.baslik).toBe('Türev');
      expect(d.etiket).toBe('elle yazıldı · doğrulanmadı');
      const a = R.Ogren.anlatim('am-11');
      expect(d.bolumler.length).toBe(a ? a.bolumler.length : d.bolumler.length);
      d.bolumler.forEach(b => expect(typeof b.metin === 'string' && Array.isArray(b.liste)).toBe(true));
      expect(d.soruVar).toBe(R.Ogren.sorular('am-11').length > 0);
    });
    it('konusu olmayan metinde ders yok', () => {
      expect(R.Ogren.kingDers('kuantum alan kuramı')).toBe(null);
      expect(R.Ogren.kingDers('')).toBe(null);
    });
  });
})();
