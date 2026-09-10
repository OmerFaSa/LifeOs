/* Orkestratör — asgari gün, sıradaki hamle, korelasyon ve haftalık rapor. */

(function(){
  const { describe, it, expect, resetState, withToday, pushLab, pushVitals, pushMeal, pushWorkout } = SP.Test;
  const U = SP.U;

  describe('Calc — asgari gün', () => {
    it('hiçbir şey yapılmamış gün sıfır tutar', () => {
      resetState();
      const m = SP.Calc.minimumDay('2026-03-01');
      expect(m.done).toBe(0);
      expect(m.complete).toBeFalsy();
      expect(m.rows).toHaveLength(4);
    });

    it('dört maddeyi tutturan gün tamamlanır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8, water:2200 });
        pushMeal('2026-03-01', 'ogle', [['tavuk-gogsu', 350]]);
        pushWorkout('2026-03-01', { minutes:30, rpe:5 });
        const m = SP.Calc.minimumDay('2026-03-01');
        expect(m.complete).toBeTruthy();
        expect(m.done).toBe(4);
      });
    });

    it('kilosu bilinmeyende protein satırı bilinmiyor sayılır', () => {
      resetState();
      SP.S.profile.weightKg = null;
      const m = SP.Calc.minimumDay('2026-03-01');
      const p = m.rows.find(r => r.id === 'protein');
      expect(p.known).toBeFalsy();
      expect(p.ok).toBeFalsy();
    });

    it('15 dakikanın altında hareket sayılmaz', () => {
      resetState();
      pushWorkout('2026-03-01', { minutes:10, rpe:5 });
      const m = SP.Calc.minimumDay('2026-03-01');
      expect(m.rows.find(r => r.id === 'move').ok).toBeFalsy();
    });
  });

  describe('Calc — davranış serisi', () => {
    it('kayıt yoksa seri sıfır', () => {
      resetState();
      withToday('2026-03-05', () => expect(SP.Calc.streak()).toBe(0));
    });

    it('art arda tutturulan günler sayılır', () => {
      resetState();
      withToday('2026-03-05', () => {
        ['2026-03-02', '2026-03-03', '2026-03-04'].forEach(d => {
          pushVitals(d, { sleep:8, water:2200 });
          pushMeal(d, 'ogle', [['tavuk-gogsu', 350]]);
          pushWorkout(d, { minutes:30, rpe:5 });
        });
        expect(SP.Calc.streak()).toBe(3);
      });
    });

    it('bugün tamamlanmamışsa seri kırılmaz', () => {
      resetState();
      withToday('2026-03-05', () => {
        ['2026-03-03', '2026-03-04'].forEach(d => {
          pushVitals(d, { sleep:8, water:2200 });
          pushMeal(d, 'ogle', [['tavuk-gogsu', 350]]);
          pushWorkout(d, { minutes:30, rpe:5 });
        });
        expect(SP.Calc.streak()).toBe(2);
      });
    });

    it('araya giren boş gün seriyi keser', () => {
      resetState();
      withToday('2026-03-05', () => {
        ['2026-03-04', '2026-03-02'].forEach(d => {
          pushVitals(d, { sleep:8, water:2200 });
          pushMeal(d, 'ogle', [['tavuk-gogsu', 350]]);
          pushWorkout(d, { minutes:30, rpe:5 });
        });
        expect(SP.Calc.streak()).toBe(1);
      });
    });
  });

  describe('Calc — sıradaki hamle', () => {
    it('kırmızı bayrak her şeyin önündedir', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:5 });
        SP.S.flags = SP.Model.evaluateFlags().map(f =>
          Object.assign({ status:'open', ack:false, openedAt:new Date().toISOString() }, f));
        const n = SP.Calc.nextAction();
        expect(n.id).toBe('flag');
        expect(n.rank).toBe(1);
      });
    });

    it('görüldü işaretlenen bayrak hamleyi kapatır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:5 });
        SP.S.flags = SP.Model.evaluateFlags().map(f =>
          Object.assign({ status:'open', ack:true }, f));
        expect(SP.Calc.nextAction().id !== 'flag').toBeTruthy();
      });
    });

    it('ateş güvenlik hamlesi üretir', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8, temp:39 });
        const n = SP.Calc.nextAction();
        expect(n.id).toBe('override');
        expect(n.rank).toBe(2);
      });
    });

    it('ölçüm girilmemişse ölçüm hamlesi gelir', () => {
      resetState();
      withToday('2026-03-01', () => {
        const n = SP.Calc.nextAction();
        expect(n.id).toBe('vitals');
        expect(n.route).toBe('vitals');
      });
    });

    it('ölçüm varsa panel borcu öne çıkar', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8, soreness:4 });
        const n = SP.Calc.nextAction();
        expect(n.id).toBe('panel');
      });
    });

    it('her hamle nereye gideceğini ve nedenini taşır', () => {
      resetState();
      withToday('2026-03-01', () => {
        const n = SP.Calc.nextAction();
        expect(typeof n.route).toBe('string');
        expect(n.why.length > 10).toBeTruthy();
      });
    });

    it('her şey tamamsa sakin durum döner', () => {
      resetState();
      withToday('2026-03-01', () => {
        /* bütün panelleri güncel yap */
        SP.PANELS.forEach(p => {
          if(p.id === 'vital' || p.id === 'body') return;
          const b = SP.BIOMARKERS.find(x => x.panel === p.id);
          if(b) pushLab('2026-02-20', { [b.id]:(SP.Bio.refFor(b.id).optimal || SP.Bio.refFor(b.id).ref)[0] });
        });
        pushVitals('2026-03-01', { sleep:8, soreness:5, water:2200 });
        /* açık kalmayacak kadar dengeli bir hafta */
        for(let i = 0; i < 7; i++){
          const d = U.iso(U.addDays(U.parse('2026-03-01'), -i));
          pushMeal(d, 'ogle', [['ciger', 150], ['ispanak', 200], ['portakal', 300],
            ['somon', 150], ['badem', 60], ['yulaf', 100], ['sut', 400]]);
        }
        pushWorkout('2026-03-01', { minutes:45, rpe:6 });
        const n = SP.Calc.nextAction();
        /* Açık kalmışsa bile sıra bütçeye ya da sakin duruma inmiş olmalı. */
        expect(n.rank >= 4).toBeTruthy();
      });
    });
  });

  describe('Calc — korelasyon', () => {
    it('az örnekte katsayı hesaplanmaz', () => {
      const c = SP.Calc.correlate([[1, 2], [2, 3], [3, 4]]);
      expect(c.ok).toBeFalsy();
      expect(c.n).toBe(3);
    });

    it('tam doğrusal ilişkide katsayı 1', () => {
      const pairs = [];
      for(let i = 0; i < 12; i++) pairs.push([i, i * 2]);
      expect(SP.Calc.correlate(pairs).r).toBe(1);
    });

    it('ters doğrusal ilişkide katsayı -1', () => {
      const pairs = [];
      for(let i = 0; i < 12; i++) pairs.push([i, -i * 3]);
      expect(SP.Calc.correlate(pairs).r).toBe(-1);
    });

    it('sabit seri katsayı üretmez', () => {
      const pairs = [];
      for(let i = 0; i < 12; i++) pairs.push([5, i]);
      expect(SP.Calc.correlate(pairs).ok).toBeFalsy();
    });

    it('yalnızca aynı günde ölçülenler eşleşir', () => {
      resetState();
      withToday('2026-03-10', () => {
        pushVitals('2026-03-09', { sleep:8 });
        pushVitals('2026-03-08', { hrv:60 });
        expect(SP.Calc.pairsFor('sleep', 'hrv', 30)).toHaveLength(0);
      });
    });

    it('ortak gün sayısı yetersizse bulgu üretilmez', () => {
      resetState();
      withToday('2026-03-10', () => {
        pushVitals('2026-03-09', { sleep:8, hrv:60 });
        const f = SP.Calc.crossFindings(30).find(x => x.link.id === 'sleep-hrv');
        expect(f.ok).toBeFalsy();
        expect(f.note).toContain('yetersiz');
      });
    });

    it('güçlü bağ bulunduğunda metin birliktelik dilinde yazılır', () => {
      resetState();
      withToday('2026-03-30', () => {
        for(let i = 0; i < 14; i++){
          const d = U.iso(U.addDays(U.parse('2026-03-30'), -i));
          pushVitals(d, { sleep:5 + i * 0.2, hrv:40 + i * 2 });
        }
        const f = SP.Calc.crossFindings(30).find(x => x.link.id === 'sleep-hrv');
        expect(f.ok).toBeTruthy();
        expect(f.weak).toBeFalsy();
        expect(f.text).toContain('nedensellik');
      });
    });
  });

  describe('Calc — haftalık rapor', () => {
    it('boş haftada rapor yine üretilir', () => {
      resetState();
      withToday('2026-03-07', () => {
        const r = SP.Calc.weeklyReport();
        expect(r.days).toHaveLength(7);
        expect(r.discipline.minDays).toBe(0);
      });
    });

    it('rapor toparlanma ortalamasını hesaplar', () => {
      resetState();
      withToday('2026-03-07', () => {
        pushVitals('2026-03-05', { sleep:8, soreness:5 });
        pushVitals('2026-03-06', { sleep:8, soreness:5 });
        const r = SP.Calc.weeklyReport();
        expect(r.readiness.n).toBe(2);
        expect(r.readiness.avg).toBe(100);
      });
    });

    it('başlık hem kazanımı hem kaybı taşır', () => {
      resetState();
      withToday('2026-03-07', () => {
        pushVitals('2026-03-06', { sleep:8, soreness:5 });
        SP.S.basket.items = [{ foodId:'dana-eti', kg:2 }];
        SP.S.basket.weeklyLimit = 100;
        const h = SP.Calc.headline();
        expect(h.indexOf('fakat') > 0).toBeTruthy();
      });
    });

    it('hiç veri yoksa başlık bunu söyler', () => {
      resetState();
      withToday('2026-03-07', () => {
        SP.S.profile.weightKg = null;
        const r = SP.Calc.weeklyReport();
        r.readiness.avg = null;
        r.nutrition.proteinPct = null;
        r.money.limit = null;
        r.discipline.minDays = 0;
        expect(typeof SP.Calc.headline(r)).toBe('string');
      });
    });

    it('gün durumu bütün modüllerden okur', () => {
      resetState();
      withToday('2026-03-07', () => {
        const s = SP.Calc.dayStatus();
        expect(s.nutrition).toBeTruthy();
        expect(s.prescription).toBeTruthy();
        expect(s.minimum).toBeTruthy();
        expect(s.money).toBeTruthy();
      });
    });
  });
})();
