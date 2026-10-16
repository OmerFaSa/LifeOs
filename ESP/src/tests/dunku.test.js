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

  describe('Sık oturumlar', () => {
    it('14 günde iki kez aynı disiplin ve süre: tek dokunuş; sayım ve kalite kopyalanmaz; geri alınır', async () => {
      resetState();
      pushSession('2026-09-10', 'lang', 45, { count:30, countCert:'measured', quality:4 });
      pushSession('2026-09-11', 'lang', 45);
      pushSession('2026-09-11', 'music', 20);            // bir kez: sık değil
      pushSession('2026-08-20', 'music', 20);            // 14 günden eski
      const l = D().sik('2026-09-12');
      expect(l.map(x => [x.disc, x.dk, x.n, x.bugun])).toEqual([['lang', 45, 2, false]]);
      const r = await D().sikEkle('2026-09-12', 'lang', 45);
      const k = ESP.Model.sessionsOf('2026-09-12').find(s => s.id === r.id);
      expect([k.disc, k.minutes, k.count, k.quality]).toEqual(['lang', 45, null, null]);
      expect(D().sik('2026-09-12')[0].bugun).toBe(true);
      expect((await D().sikEkle('2026-09-12', 'music', 20)).ok).toBe(false);
      await D().geriAl('2026-09-12', r.id);
      expect(ESP.Model.sessionsOf('2026-09-12')).toHaveLength(0);
    });
  });
})();
