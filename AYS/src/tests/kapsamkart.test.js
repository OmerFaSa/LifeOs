/* 127 Kapsam seçimi — AYS günlük süre önerisinde (kullanıcı kararı
   2026-09-25: «hedef değişikliklerine ekle»). Seçim öneriyi dönüştürür,
   uygulamaz: «Yalnız bugün» ve «Bu hafta» geçici süreye, «Kalıcı» günlük
   süreye döner; tarihler koddan gelir; başka öneride seçici çıkmaz. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };

  async function hazirla(){
    resetState();
    R.S.profile.setupDone = true;
    await R.Model.ensurePlan(true);
    await R.Model.ensureWeek(R.Model.currentWeek());
    const simdi = R.Istisna.temelDakika() || R.Istisna.sablonDakikasi();
    const dk = simdi + 30 <= R.Istisna.DAKIKA.max ? simdi + 30 : simdi - 30;
    R.S.officeProposals = [{ id:'k1', action:'gunluk-sure', agent:'patron', status:'pending', source:'kural',
      params:{ dakika:dk }, at:'2026-10-12T08:00:00Z', level:'orta' },
    { id:'k2', action:'block-add', agent:'patron', status:'pending', source:'kural',
      params:{}, at:'2026-10-12T08:00:00Z', level:'kucuk' }];
    return dk;
  }

  describe('127 Kapsam seçimi — AYS', () => {
    it('oz-127 günlük süre önerisinde süre seçilir; başka öneride seçici yok', async () => {
      await withTodayAsync('2026-10-14', async () => {
        await hazirla();
        const k = dom(await R.Screens.onaylar.render());
        const f = k.querySelectorAll('[data-oz="127"]');
        expect(f.length).toBe(1);
        expect(f[0].querySelector('input:checked').value).toBe('kalici');
        expect(f[0].querySelector('input:checked').getAttribute('name')).toBe('kapsam-k1');
        /* Canlı denemede bulundu: kart «orta», seçili «Kalıcı» «büyük» diyordu.
           Kartın seviyesi seçili kapsamın seviyesidir. */
        expect(k.querySelector('[data-oneri="k1"]').getAttribute('data-seviye')).toBe('buyuk');
        R.S.officeProposals = [];
      });
    });

    it('oz-127 bugün ve bu hafta geçici süreye, kalıcı günlük süreye döner; onaysız uygulanmaz', async () => {
      await withTodayAsync('2026-10-14', async () => {
        const dk = await hazirla();
        const temel = R.Istisna.temelDakika() || R.Istisna.sablonDakikasi();
        const h = R.Screens.onaylar.handle['oneri-kapsam'];
        const p = () => R.S.officeProposals.find(x => x.id === 'k1');
        await h({ name:'kapsam-k1', value:'bugun' });
        expect([p().action, p().params.from, p().params.to, p().params.dakika])
          .toEqual(['gecici-sure', '2026-10-14', '2026-10-14', dk]);
        expect(R.Proposals.kapsamOf(p())).toBe('bugun');
        expect(p().level).toBe('orta');
        await h({ name:'kapsam-k1', value:'hafta' });
        const gunler = R.Model.weekDates(R.Model.currentWeek());
        expect([p().action, p().params.from, p().params.to])
          .toEqual(['gecici-sure', '2026-10-14', R.U.iso(gunler[gunler.length - 1])]);
        expect(R.Proposals.preview(p()).ok).toBe(true);
        await h({ name:'kapsam-k1', value:'kalici' });
        expect([p().action, p().params]).toEqual(['gunluk-sure', { dakika:dk }]);
        expect(p().level).toBe('buyuk');
        expect(p().status).toBe('pending');
        expect(R.Istisna.temelDakika() || R.Istisna.sablonDakikasi()).toBe(temel);
        const blok = await R.Proposals.kapsamla('k2', 'bugun');
        expect(blok.ok).toBe(false);
        R.S.officeProposals = [];
      });
    });

    it('oz-127 haftanın son günü «Bu hafta» seçilince seçim «Bu hafta» kalır', async () => {
      /* Canlı denemede bulundu (pazar): «Bu hafta» bugün–bugün aralığına
         düşüyor, seçici «Yalnız bugün»e atlıyordu. Seçim kaydedilir. */
      await hazirla();
      const gunler = R.Model.weekDates(R.Model.currentWeek());
      await withTodayAsync(R.U.iso(gunler[gunler.length - 1]), async () => {
        await R.Screens.onaylar.handle['oneri-kapsam']({ name:'kapsam-k1', value:'hafta' });
        const p = R.S.officeProposals.find(x => x.id === 'k1');
        expect(R.Proposals.kapsamOf(p)).toBe('hafta');
        const k = dom(await R.Screens.onaylar.render());
        expect(k.querySelector('[data-oz="127"] input:checked').value).toBe('hafta');
      });
      R.S.officeProposals = [];
    });
  });
})();
