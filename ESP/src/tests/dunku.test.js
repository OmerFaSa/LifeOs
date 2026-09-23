/* Dünkünün aynısı (core/dunku.js): yalnız bugün olmayan disiplin önerilir;
   kopya bugüne yazılır, kalite kopyalanmaz; geri alınır. */

(function(){
  const { describe, it, expect, resetState, withToday, pushSession } = ESP.Test;
  const D = () => ESP.Dunku;

  describe('Dünkünün aynısı', () => {
    it('dünün oturumu önerilir, bugüne kopyalanır ve geri alınır', async () => {
      resetState();
      const g = pushSession('2026-09-11', 'music', 30, { quality:4, qualityCert:'estimated' });
      pushSession('2026-09-11', 'lang', 20);
      pushSession('2026-09-12', 'lang', 15);
      const a = D().adaylar('2026-09-12');
      expect(a.oturumlar.map(x => [x.disc, x.dk])).toEqual([['music', 30]]);
      const r = await D().kopyala('2026-09-12', g.id);
      expect(r.ok).toBe(true);
      const k = ESP.Model.sessionsOf('2026-09-12').find(s => s.id === r.id);
      expect([k.disc, k.minutes, k.quality, k.note]).toEqual(['music', 30, null, 'Dünün aynısı']);
      expect((await D().kopyala('2026-09-12', g.id)).ok).toBe(false);
      await D().geriAl('2026-09-12', r.id);
      expect(ESP.Model.sessionsOf('2026-09-12').some(s => s.id === r.id)).toBe(false);
    });
  });
})();
