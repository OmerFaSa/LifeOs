/* King araçları — AYS (core/kingarac.js, brand/ortak/arac.js).

   Kanıtlanan: okuma araçları ofisin veri araçlarıdır ve kişisel alan
   taşımaz; plan eylemi önizlenir, yalnız onayla Proposals.hemen'le
   uygulanır ve geri alınır; ölçüm yazan ve modele kapalı eylem katalogda
   yoktur. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const A = () => window.LIFEOS.ARAC;

  async function hazirla(){
    resetState();
    R.S.profile.setupDone = true;
    R.S.profile.name = 'Gizli Ad';
    await R.Model.ensurePlan(true);
    await R.Model.ensureWeek(R.Model.currentWeek());
    A()._sifirla();
    A().kur({ modul:'ays', araclar:() => R.KingArac.liste() });
  }

  describe('King araçları — AYS', () => {
    it('her araç katalogdan geçer; ölçüm ve modele kapalı eylem yok', async () => {
      await hazirla();
      const ham = R.KingArac.liste(), l = A().liste();
      expect(l.length).toBe(ham.length);
      const adlar = l.map(a => a.ad);
      expect(adlar).toContain('ays_denemeler');
      expect(adlar).toContain('ays_week_target');
      expect(adlar).toContain('ays_ara_ver');
      expect(adlar.indexOf('ays_soru_yaz')).toBe(-1);
      expect(adlar.indexOf('ays_hedef_plan')).toBe(-1);
      A()._sifirla();
    });

    it('okuma sonucu kişisel alan taşımaz; sayıyı AYS hesaplar', async () => {
      await hazirla();
      const r = await A().calistir('ays_hedef_ve_net_matrisi', {});
      expect(r.ok).toBe(true);
      expect(JSON.stringify(r.sonuc).indexOf('Gizli Ad')).toBe(-1);
      const d = await A().calistir('ays_denemeler', { limit:3 });
      expect(d.satirlar).toEqual(['Kayıtlı deneme yok.']);
      A()._sifirla();
    });

    it('haftalık hedef: önizleme, onayla uygulama ve geri alma', async () => {
      await hazirla();
      const n = R.Model.currentWeek(), w = R.S.weeks[R.Model.weekId(n)];
      const eski = w.questionTarget, yeni = eski === 900 ? 950 : 900;
      const o = await A().onizle('ays_week_target', { weekN:n, questionTarget:yeni });
      expect(o.ok).toBe(true);
      expect(o.seviye).toBe('orta');
      expect(o.onizle.satirlar[1]).toContain(yeni + ' soru');
      expect(w.questionTarget).toBe(eski);
      const u = await A().uygula({ arac:true, ad:'ays_week_target', param:{ weekN:n, questionTarget:yeni } });
      expect(u.ok).toBe(true);
      expect(R.S.weeks[R.Model.weekId(n)].questionTarget).toBe(yeni);
      await u.geriAl();
      expect(R.S.weeks[R.Model.weekId(n)].questionTarget).toBe(eski);
      /* AYS'nin kendi doğrulaması: plan dışı hafta önizlenmez. */
      const k = await A().onizle('ays_week_target', { weekN:999, questionTarget:900 });
      expect(k.ok).toBe(false);
      expect(k.hata).toBe('Hafta numarası plan dışında.');
      R.S.officeProposals = [];
      A()._sifirla();
    });
  });
})();
