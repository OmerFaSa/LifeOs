/* Tatil modu — AYS planı (core/tatil.js) + ortak seri dondurma (seri.js).

   Kanıtladığı sözler: tatil günleri dondurulur ve ARA günüdür; dönüşün
   ilk iki günü yarım süredir; erken bitirilince ara dünde biter, dönüş
   bugüne kayar ve eski dönüş kalkar. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const BUGUN = '2026-09-23';

  function seriKur(bugun){
    const m = {};
    R.Seri = window.LIFEOS.Seri.kur({ store:() => ({ get:async k => m[k] || null,
      set:async (k, v) => { m[k] = v; } }), bugun:() => bugun });
  }

  describe('Tatil modu (AYS)', () => {
    it('tatil ara günüdür, seri donar; dönüşte iki gün yarım süre', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        seriKur(BUGUN);
        try{
          const r = await R.Tatil.baslat(7);
          expect([r.ok, r.bas, r.bit, r.ara]).toEqual([true, BUGUN, '2026-09-29', true]);
          expect(R.Seri.donmusMu('2026-09-26')).toBe(true);
          expect(R.Seri.aktifTatil().bit).toBe('2026-09-29');
          const l = R.Istisna.liste();
          const ara = l.find(x => x.neden === R.Tatil.NEDEN_TATIL);
          const don = l.find(x => x.neden === R.Tatil.NEDEN_DONUS);
          expect([ara.tur, ara.from, ara.to]).toEqual(['ara', BUGUN, '2026-09-29']);
          expect([don.tur, don.from, don.to]).toEqual(['sure', '2026-09-30', '2026-10-01']);
          expect(don.dakika).toBe(R.Tatil.donusDakikasi('2026-09-30'));
          expect(don.dakika >= R.Istisna.DAKIKA.min).toBe(true);
          const gun = await R.Model.ensureDay('2026-09-25');
          expect(gun.ara).toBe(true);
        }finally{ delete R.Seri; }
      });
    });

    it('erken bitirilince ara dünde biter, dönüş bugüne kayar', async () => {
      resetState();
      const m = {};
      let bugun = BUGUN;
      R.Seri = window.LIFEOS.Seri.kur({ store:() => ({ get:async k => m[k] || null,
        set:async (k, v) => { m[k] = v; } }), bugun:() => bugun });
      try{
        await withTodayAsync(BUGUN, async () => { await R.Tatil.baslat(7); });
        bugun = '2026-09-26';
        await withTodayAsync(bugun, async () => {
          const r = await R.Tatil.bitir();
          expect(r.ok).toBe(true);
          const l = R.Istisna.liste();
          expect(l.find(x => x.neden === R.Tatil.NEDEN_TATIL).to).toBe('2026-09-25');
          expect(l.filter(x => x.neden === R.Tatil.NEDEN_DONUS).map(x => [x.from, x.to]))
            .toEqual([['2026-09-26', '2026-09-27']]);
          expect(R.Seri.aktifTatil()).toBe(null);
          expect(R.Seri.donmusMu('2026-09-25')).toBe(true);
        });
      }finally{ delete R.Seri; }
    });

    it('geçersiz süre reddedilir; seri yoksa söylenir', async () => {
      resetState();
      seriKur(BUGUN);
      try{
        expect((await R.Tatil.baslat(0)).ok).toBe(false);
        expect((await R.Tatil.baslat(30)).ok).toBe(false);
      }finally{ delete R.Seri; }
      expect((await R.Tatil.baslat(7)).why).toContain('yüklenmedi');
    });
  });
})();
