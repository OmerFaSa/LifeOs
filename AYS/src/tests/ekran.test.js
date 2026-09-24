/* Ekran sözleşmesi (borç 17; SPİ'deki «Ekranlar — sözleşme» paketinin AYS'si,
   NOTLAR §2.2). Önceden test sayfası 20 ekranın 4'ünü yüklüyordu. Kanıtladığı
   sözler: bütün ekranlar kayıtlı ve sözleşmeyi taşır; gezinmedeki her yol bir
   ekrana gider ve her ekran tam bir bölümdedir; boş ve dolu durumda hiçbir
   ekran çizerken çökmez. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const ids = ['today', 'week', 'exams', 'cards', 'learn', 'quiz', 'solve', 'subjects', 'topic',
    'plan', 'target', 'progress', 'analytics', 'protocols', 'rutbe', 'guide', 'profiles',
    'office', 'team', 'meeting'];

  describe('Ekranlar — sözleşme', () => {
    it('bütün ekranlar kayıtlı; id, başlık ve render var', () => {
      ids.forEach(id => {
        const sc = R.Screens[id];
        expect(!!sc).toBe(true);
        expect(sc.id).toBe(id);
        expect(typeof sc.title).toBe('string');
        expect(typeof sc.render).toBe('function');
      });
    });

    it('gezinmedeki her yol bir ekrana gider; her ekran tam bir bölümde', () => {
      const gorulen = {};
      R.App.NAV.forEach(g => g.items.forEach(v => {
        expect(!!R.Screens[v.id]).toBe(true);
        expect(gorulen[v.id]).toBe(undefined);
        gorulen[v.id] = g.id;
      }));
      /* «topic» bir konunun ayrıntısıdır; menüde değil Dersler'den açılır. */
      ids.filter(id => id !== 'topic').forEach(id => expect(!!gorulen[id]).toBe(true));
    });

    it('hero metinleri metin döndürür', () => {
      ids.forEach(id => {
        const sc = R.Screens[id];
        if(sc.headline) expect(typeof sc.headline()).toBe('string');
        if(sc.lede) expect(typeof sc.lede()).toBe('string');
      });
    });

    it('boş ve dolu durumda hiçbir ekran çökmez', async () => {
      for(const dolu of [false, true]){
        resetState();
        await withTodayAsync('2026-10-12', async () => {
          if(dolu){
            await R.Model.ensurePlan(true);
            await R.Model.ensureWeek(R.Model.currentWeek());
            await R.Model.ensureDay(R.U.today());
          }
          for(const id of ids){
            const out = String(await R.Screens[id].render());
            expect(out.length > 20).toBe(true);
          }
        });
      }
    });
  });
})();
