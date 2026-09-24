/* İlk kurulum (core/setup.js, borç 16). Kapsam %13'tü; bir kez görülen ekran
   ama yanlış kurulum bütün planı eğriltir. Kanıtladığı sözler: takvim önizlemesi
   hafta sayısını, sıkıştırmayı ve kısa takvimi doğru söyler; sınav başlangıçtan
   önceyse takvim adımı ilerlemez; hedef sırası olmadan kaydedilmez ve sihirbaz
   o adıma döner; kaydedilince AYT günü TYT'nin ertesi günü olur, kurulum biter,
   plan üretilir. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const St = () => R.Setup;

  /* Test sayfasında kabuk yok: çizim susturulur, alt sayfa ve bildirim kökü geçici kurulur. */
  async function sessiz(fn){
    const eski = R.App;
    R.App = Object.assign({}, eski || {}, { render:function(){} });
    const kokler = ['overlay-root', 'toast-root'].filter(id => !document.getElementById(id)).map(id => {
      const d = document.createElement('div'); d.id = id; document.body.appendChild(d); return d; });
    try{ return await fn(); }finally{
      R.App = eski; R.UI.closeSheet();
      kokler.forEach(d => d.remove());
    }
  }
  function yaz(id, v){ const el = document.getElementById(id); if(el) el.value = v; return !!el; }
  function baslik(){ const s = document.querySelector('#sheet h3'); return s ? s.textContent : ''; }

  describe('İlk kurulum', () => {
    it('takvim önizlemesi: hafta, sıkıştırma, kısa takvim, pazartesi', () => {
      const tam = St().preview('2026-01-05', '2026-12-31');
      expect([tam.weeks <= R.PROGRAM.totalWeeks, tam.days > 300]).toEqual([true, true]);
      const kisa = St().preview('2026-06-01', '2026-06-15');
      expect([kisa.weeks, kisa.tooShort, kisa.compressed]).toEqual([3, true, true]);
      expect(St().preview('2026-06-15', '2026-06-01').days < 0).toBe(true);
    });

    it('yanlış takvim ilerlemez; hedef sırası yoksa kaydedilmez; doğru kurulum planı üretir', async () => {
      resetState();
      R.S.profile.setupDone = false;
      R.S.profile.targetRank = null;
      expect(St().needed()).toBe(true);
      await withTodayAsync('2026-09-24', async () => {
        await sessiz(async () => {
          St().open({ step:0 });
          expect(baslik()).toBe('Seni tanıyalım');
          yaz('sw-name', 'Ömer');
          St().next();
          expect(baslik()).toBe('Hedefin ne?');
          St().next();
          expect(baslik()).toBe('Takvimin');
          yaz('sw-start', '2026-10-05'); yaz('sw-exam', '2026-09-30');   /* sınav önce */
          St().next();
          expect(baslik()).toBe('Takvimin');                            /* ilerlemedi */
          yaz('sw-exam', '2027-06-19');
          St().next(); St().next();
          expect(baslik()).toBe('Şu anki seviyen');
          await St().save();
          expect(R.S.profile.setupDone).toBe(false);                    /* hedef sırası yok */
          expect(baslik()).toBe('Hedefin ne?');
          yaz('sw-rank', '25000');
          St().next(); St().next(); St().next();
          await St().save();
        });
      });
      const p = R.S.profile;
      expect([p.name, p.targetRank, p.startDate, p.examTytISO, p.examAytISO, p.setupDone])
        .toEqual(['Ömer', 25000, '2026-10-05', '2027-06-19', '2027-06-20', true]);
      expect(St().needed()).toBe(false);
      expect(!!(R.S.plan && R.S.plan.meta && R.S.plan.meta.total > 0)).toBe(true);
    });
  });
})();
