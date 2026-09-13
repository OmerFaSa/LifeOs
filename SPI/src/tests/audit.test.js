/* Bakım borcu denetimi — beş alanda biriken bozukluk.

   SPİ'ye özgü ek kural: DENETİM TEŞHİS KOYMAZ. */

(function(){
  const { describe, it, expect, resetState, withToday, pushLab, pushVitals,
    pushMeal, pushWorkout } = SP.Test;
  const A = () => SP.Audit;
  const S = SP.S, U = SP.U;

  function bulgu(alan, id){ return A().of(alan).filter(f => f.id === id)[0]; }

  describe('denetim · veri esigi', () => {

    it('tahlil yoksa "olculmedi" denir, "temiz" degil', () => {
      resetState();
      const f = A().of('labs');
      expect(f.length).toBe(1);
      expect(f[0].cert).toBe('missing');
      expect(f[0].note.indexOf('ölçülmedi') > 0).toBeTruthy();
    });

    it('bilinmeyen alanda bulgu yok', () => {
      resetState();
      expect(A().of('astroloji').length).toBe(0);
    });
  });

  describe('denetim · tahlil', () => {

    it('alti aydan eski tahlil isaretlenir', () => {
      resetState();
      withToday('2026-09-01', () => {
        pushLab('2026-01-01', { hgb:14 });
        const f = bulgu('labs', 'lab-stale');
        expect(!!f).toBeTruthy();
        /* Degerin ne oldugu DEGIL, kaydin yasi soylenir. */
        expect(/tehlikeli|hastalık|düşük değer/i.test(f.note)).toBeFalsy();
      });
    });

    it('yeni tahlilde eskime uyarisi cikmaz', () => {
      resetState();
      withToday('2026-09-01', () => {
        pushLab('2026-08-20', { hgb:14 });
        expect(bulgu('labs', 'lab-stale')).toBeFalsy();
      });
    });

    /* Tek olcum bir degerdir, bir egilim degil. */
    it('tek noktali olcumler egilim sayilmaz', () => {
      resetState();
      withToday('2026-09-01', () => {
        pushLab('2026-08-20', { hgb:14, ferritin:60, glucose:90, ldl:110,
          crp:2, tsh:2.1 });
        const f = bulgu('labs', 'lab-single');
        expect(!!f).toBeTruthy();
        expect(f.note.indexOf('eğilim') > 0).toBeTruthy();
      });
    });
  });

  describe('denetim · ogun', () => {

    it('seyrek kayitta ortalama uzerine karar kurulmaz', () => {
      resetState();
      withToday('2026-09-10', () => {
        pushMeal('2026-09-09', 'ogle', [['yumurta', 100]]);
        pushMeal('2026-09-08', 'ogle', [['yumurta', 100]]);
        pushMeal('2026-09-07', 'ogle', [['yumurta', 100]]);
        const f = bulgu('meals', 'meal-sparse');
        expect(!!f).toBeTruthy();
        /* Girilmeyen gun SIFIR sayilmaz. */
        expect(f.note.indexOf('sıfır sayılmaz') > 0).toBeTruthy();
      });
    });
  });

  describe('denetim · hareket', () => {

    it('zorluk girilmemis seanslar isaretlenir', () => {
      resetState();
      withToday('2026-09-10', () => {
        for(let i = 0; i < 6; i++){
          const w = pushWorkout(U.iso(U.addDays(U.parse('2026-09-10'), -i)),
            { minutes:40 });
          w.rpe = null;
        }
        const f = bulgu('move', 'move-no-rpe');
        expect(!!f).toBeTruthy();
        expect(f.note.indexOf('Sıfır sayılmaz') > 0).toBeTruthy();
      });
    });

    it('uzun aradan sonra donus bir kayip olarak sunulmaz', () => {
      resetState();
      withToday('2026-09-10', () => {
        pushWorkout('2026-07-01', { minutes:40, rpe:6 });
        pushWorkout('2026-09-05', { minutes:40, rpe:6 });
        pushWorkout('2026-09-08', { minutes:40, rpe:6 });
        const f = bulgu('move', 'move-return');
        expect(!!f).toBeTruthy();
        expect(f.note.indexOf('kayıp değil') > 0).toBeTruthy();
      });
    });
  });

  describe('denetim · ilac', () => {

    function ilac(patch){
      const m = Object.assign({ id:U.uid('med'), kindId:'diger', name:'X',
        startDate:'2026-01-01', endDate:null }, patch || {});
      S.meds.push(m);
      return m;
    }

    it('bitisi gecmis kayitlar listeden cikarilmayi onerir', () => {
      resetState();
      withToday('2026-09-10', () => {
        ilac({ endDate:'2026-05-01' });
        const f = bulgu('meds', 'med-ended');
        expect(!!f).toBeTruthy();
        /* Kayit SILINMEZ, gecmise tasinir. */
        expect(f.note.indexOf('silinmez') > 0).toBeTruthy();
      });
    });

    it('adsiz kayit hakkinda hicbir sey soylenemez', () => {
      resetState();
      withToday('2026-09-10', () => {
        ilac({ name:'' });
        const f = bulgu('meds', 'med-unnamed');
        expect(!!f).toBeTruthy();
      });
    });

    it('kayit yoksa "etkilesim yok" denmez', () => {
      resetState();
      const f = A().of('meds')[0];
      expect(f.cert).toBe('missing');
      expect(f.note.indexOf('değildir') > 0).toBeTruthy();
    });
  });

  describe('denetim · gunluk olcum', () => {

    it('hep ayni deger dolgu olabilir', () => {
      resetState();
      withToday('2026-09-10', () => {
        for(let i = 0; i < 8; i++){
          pushVitals(U.iso(U.addDays(U.parse('2026-09-10'), -i)), { sleep:7 });
        }
        const f = bulgu('vitals', 'vital-flat');
        expect(!!f).toBeTruthy();
        expect(f.note.indexOf('dolgudur') > 0).toBeTruthy();
      });
    });

    it('degisken olcumde uyari cikmaz', () => {
      resetState();
      withToday('2026-09-10', () => {
        for(let i = 0; i < 8; i++){
          pushVitals(U.iso(U.addDays(U.parse('2026-09-10'), -i)),
            { sleep:6 + (i % 3) });
        }
        expect(bulgu('vitals', 'vital-flat')).toBeFalsy();
      });
    });
  });

  describe('denetim · kurallar', () => {

    /* Uyarilar listenin SONUNA dusmemeli (0 || 9 tuzagi). */
    it('ciddi bulgular once siralanir', () => {
      resetState();
      withToday('2026-09-10', () => {
        for(let i = 0; i < 6; i++){
          const w = pushWorkout(U.iso(U.addDays(U.parse('2026-09-10'), -i)),
            { minutes:40 });
          w.rpe = null;
        }
        const hepsi = A().all();
        expect(hepsi[0].severity !== 'none').toBeTruthy();
      });
    });

    /* DENETIM TESHIS KOYMAZ. */
    it('hicbir bulgu teshis koymaz ya da suclamaz', () => {
      resetState();
      withToday('2026-09-10', () => {
        pushLab('2026-01-01', { hgb:9 });
        for(let i = 0; i < 6; i++){
          const w = pushWorkout(U.iso(U.addDays(U.parse('2026-09-10'), -i)),
            { minutes:40 });
          w.rpe = null;
        }
        A().all().forEach(f => {
          expect(/hastalık|teşhis|tanı koy|tehlikeli|düzensizsin|tembel/i
            .test(f.note)).toBeFalsy();
        });
      });
    });

    it('sayac yalnizca ciddi bulgulari sayar', () => {
      resetState();
      expect(A().count()).toBe(0);
    });
  });
})();
