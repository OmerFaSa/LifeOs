/* Kötü gün modu (core/kotugun.js, fikir 16). Kanıtladığı sözler: vadesi
   gelen tekrar kötü günde de önde; genişleme yerine asgari gün gelir;
   geçmiş güne konmaz; geri alınır. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync, pushCard } = ESP.Test;
  const K = () => ESP.KotuGun, P = () => ESP.Planner;
  const BUGUN = '2026-09-12';

  describe('Kötü gün modu (ESP)', () => {
    it('genişleme yerine asgari gün gelir; geri alınınca döner', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        expect(P().nextAction(BUGUN).rank).toBe(5);
        expect((await K().ac()).ok).toBe(true);
        const n = P().nextAction(BUGUN);
        expect([n.id, n.rank]).toEqual(['kotu-gun', 0]);
        expect((await K().ac()).ok).toBe(false);
        expect((await K().kapat()).ok).toBe(true);
        expect(P().nextAction(BUGUN).rank).toBe(5);
      });
    });

    it('vadesi gelen tekrar kötü günde de önde; geçmiş güne konmaz', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        pushCard({ front:'a', reps:1, box:1, interval:1, due:BUGUN });
        await K().ac();
        expect(P().nextAction(BUGUN).rank).toBe(3);
        expect((await K().ac('2026-09-11')).ok).toBe(false);
      });
    });
  });
})();
