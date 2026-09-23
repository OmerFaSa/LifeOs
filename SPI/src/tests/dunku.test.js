/* Dünkünün aynısı (core/dunku.js). Kanıtladığı sözler: yalnız bugün olmayan
   öğün/antrenman önerilir; kopya bugüne yazılır, gıda etiketi korunur, RPE
   kopyalanmaz; geri alınır. */

(function(){
  const { describe, it, expect, resetState, pushMeal, pushWorkout } = SP.Test;
  const D = () => SP.Dunku;
  const BUGUN = '2026-03-05', DUN = '2026-03-04';

  describe('Dünkünün aynısı', () => {
    it('bugün olmayan öğün ve antrenman önerilir; kopyalanır ve geri alınır', async () => {
      resetState();
      const k = pushMeal(DUN, 'kahvalti', [['tavuk-gogsu', 120, 'measured']]);
      pushMeal(DUN, 'ogle', [['tavuk-gogsu', 200]]);
      pushMeal(BUGUN, 'ogle', [['tavuk-gogsu', 150]]);
      const w = pushWorkout(DUN, { name:'Tüm vücut', minutes:40, rpe:7 });
      const a = D().adaylar(BUGUN);
      expect(a.ogunler.map(x => x.slot)).toEqual(['kahvalti']);
      expect(a.ogunler[0].ozet).toContain('120 g');
      expect(a.antrenmanlar.map(x => [x.ad, x.dk])).toEqual([['Tüm vücut', 40]]);
      const r = await D().ogunKopyala(BUGUN, k.id);
      expect(r.ok).toBe(true);
      const kopya = SP.Model.mealsOf(BUGUN).find(m => m.id === r.id);
      expect([kopya.slot, kopya.items[0].g, kopya.items[0].cert, kopya.note])
        .toEqual(['kahvalti', 120, 'measured', 'Dünün aynısı']);
      expect(D().adaylar(BUGUN).ogunler.length).toBe(0);
      expect((await D().ogunKopyala(BUGUN, k.id)).ok).toBe(false);
      const t = await D().antrenmanKopyala(BUGUN, w.id);
      const wk = SP.Model.workoutsOf(BUGUN)[0];
      expect([t.ok, wk.minutes, wk.rpe, wk.date]).toEqual([true, 40, null, BUGUN]);
      await D().geriAl(BUGUN, 'ogun', r.id);
      await D().geriAl(BUGUN, 'antrenman', t.id);
      expect(SP.Model.mealsOf(BUGUN).some(m => m.id === r.id)).toBe(false);
      expect(SP.Model.workoutsOf(BUGUN).length).toBe(0);
    });
  });
})();
