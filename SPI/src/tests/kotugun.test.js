/* Kötü gün modu (core/kotugun.js, fikir 16). Kanıtladığı sözler: yalnız
   hafifletir (dinlenme dinlenme kalır, tam gün hafife iner), geçmiş güne
   konmaz, geri alınır. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = SP.Test;
  const K = () => SP.KotuGun;
  const BUGUN = '2026-03-10';

  describe('Kötü gün modu (SPİ)', () => {
    it('antrenman yükünü hafife indirir, geri alınınca döner', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        const once = SP.Move.prescription(BUGUN);
        expect(once.kind).toBe('full');
        expect((await K().ac()).ok).toBe(true);
        const r = SP.Move.prescription(BUGUN);
        expect(r.kind).toBe('light');
        expect(r.reasons.some(x => x.id === 'kotu-gun')).toBe(true);
        expect((await K().ac()).ok).toBe(false);
        expect((await K().kapat()).ok).toBe(true);
        expect(SP.Move.prescription(BUGUN).kind).toBe('full');
      });
    });

    it('geçmiş güne konmaz; yükü asla artırmaz', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        expect((await K().ac('2026-03-09')).ok).toBe(false);
        SP.S.kotuGun = { [BUGUN]:{ at:'x' } };
        const r = SP.Move.prescription(BUGUN);
        expect(r.factor <= K().CARPAN).toBe(true);
      });
    });
  });
})();
