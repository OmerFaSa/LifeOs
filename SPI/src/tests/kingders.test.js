/* Öğretmen (King, 2026-10-22): SP.KingDers kavramı ders olarak verir. */
(function(){
  const { describe, it, expect } = SP.Test;
  describe('King dersi (SPİ kavramı)', () => {
    it('«set» kavramı ders olur; metin kavramın kendisi, inceleme durumu etikette', () => {
      const c = SP.OGRENME_KAVRAMLAR.find(x => x.id === 'concept-set');
      const d = SP.KingDers.ders('set');
      expect(d.baslik).toBe('Set');
      expect(d.bolumler.map(b => b.metin)).toEqual([c.definition, c.watch, c.example]);
      expect(d.etiket).toContain('doğrulanmadı');
    });
    it('kavramı olmayan konuda ders yok', () => {
      expect(SP.KingDers.ders('kuantum alan kuramı')).toBe(null);
    });
  });
})();
