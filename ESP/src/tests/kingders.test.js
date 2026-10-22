/* Öğretmen (King, 2026-10-22): ESP öğrenme kartı King dersi olarak (ESP.Lesson.kingDers). */
(function(){
  const { describe, it, expect } = ESP.Test;
  describe('King dersi (öğrenme kartı)', () => {
    it('«ses ve alfabe» kartı ders olur; metin kartın kendisi, sınırı etikette', () => {
      const c = ESP.OGRENME_KARTI_BY_TOPIC['l-ses'];
      const d = ESP.Lesson.kingDers('ses ve alfabe');
      expect(d.baslik).toBe(c.title);
      expect(d.bolumler[0]).toEqual({ baslik:'Açıklama', metin:c.explanation });
      expect(d.etiket).toContain('doğrulanmadı');
      expect(d.soruVar).toBe(false);
    });
    it('kartı olmayan konuda ders yok', () => {
      expect(ESP.Lesson.kingDers('kuantum alan kuramı')).toBe(null);
      expect(ESP.Lesson.kingDers('ab')).toBe(null);
    });
  });
})();
