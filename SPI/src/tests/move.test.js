/* Modül 3 — toparlanma, yük, akut/kronik oran ve kademeli ilerleme. */

(function(){
  const { describe, it, expect, resetState, withToday, pushVitals, pushWorkout } = SP.Test;
  const U = SP.U;

  /* Taban cizgi icin gecmis gunlere olcum serper. */
  function baseline(endISO, key, value, days){
    for(let i = 1; i <= (days || 30); i++){
      pushVitals(U.iso(U.addDays(U.parse(endISO), -i)), { [key]:value });
    }
  }

  describe('Move — alt skorlar', () => {
    it('hedef bandındaki uyku tam puan alır', () => {
      expect(SP.Move.sleepScore(7.5)).toBe(100);
    });

    it('yetersiz uyku puan kaybettirir', () => {
      expect(SP.Move.sleepScore(5) < SP.Move.sleepScore(7)).toBeTruthy();
    });

    it('çok uzun uyku da tam puan vermez', () => {
      expect(SP.Move.sleepScore(11) < 100).toBeTruthy();
    });

    it('uyku girilmemişse null döner — sıfır değil', () => {
      expect(SP.Move.sleepScore(null)).toBeNull();
    });

    it('HRV taban çizgisi olmadan hesaplanmaz', () => {
      resetState();
      expect(SP.Move.hrvScore(60)).toBeNull();
    });

    it('HRV ortalamanın üstündeyse skor yükselir', () => {
      resetState();
      withToday('2026-03-01', () => {
        baseline('2026-03-01', 'hrv', 50);
        expect(SP.Move.hrvScore(65) > SP.Move.hrvScore(50)).toBeTruthy();
      });
    });

    it('nabız yükselince skor düşer', () => {
      resetState();
      withToday('2026-03-01', () => {
        baseline('2026-03-01', 'rhr', 55);
        expect(SP.Move.rhrScore(65) < SP.Move.rhrScore(55)).toBeTruthy();
      });
    });

    it('taban çizgi için en az üç gün gerekir', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-02-28', { hrv:50 });
        pushVitals('2026-02-27', { hrv:52 });
        expect(SP.Move.baseline('hrv')).toBeNull();
      });
    });

    it('taban çizgi bugünü içermez', () => {
      resetState();
      withToday('2026-03-01', () => {
        baseline('2026-03-01', 'hrv', 50, 5);
        pushVitals('2026-03-01', { hrv:200 });
        expect(SP.Move.baseline('hrv').mean).toBe(50);
      });
    });
  });

  describe('Move — toparlanma skoru', () => {
    it('hiç ölçüm yoksa skor üretilmez', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Move.readiness();
        expect(r.ok).toBeFalsy();
        expect(r.score).toBeNull();
      });
    });

    it('yalnız uykuyla bile skor çıkar', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8 });
        const r = SP.Move.readiness();
        expect(r.ok).toBeTruthy();
        expect(r.score).toBe(100);
      });
    });

    it('eksik girdinin ağırlığı kalanlara dağıtılır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8, soreness:5 });
        const r = SP.Move.readiness();
        /* iki girdi de tam puan: skor 100 olmalı, eksik girdiler cezalandırmamalı */
        expect(r.score).toBe(100);
        expect(r.missing).toContain('HRV');
      });
    });

    it('kötü uyku bandı düşürür', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:4, soreness:1 });
        const r = SP.Move.readiness();
        expect(r.score < 50).toBeTruthy();
        expect(r.band.factor < 1).toBeTruthy();
      });
    });

    it('ateş her şeyi yener — yük sıfırlanır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8, soreness:5, temp:38.8 });
        const r = SP.Move.readiness();
        expect(r.override).toBeTruthy();
        expect(r.band.factor).toBe(0);
      });
    });

    it('düşük oksijen satürasyonu da yükü sıfırlar', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8, spo2:88 });
        expect(SP.Move.readiness().band.factor).toBe(0);
      });
    });

    it('skor her zaman 0–100 arasında', () => {
      resetState();
      withToday('2026-03-01', () => {
        baseline('2026-03-01', 'rhr', 50);
        pushVitals('2026-03-01', { sleep:1, rhr:120, soreness:1 });
        const r = SP.Move.readiness();
        expect(r.score >= 0 && r.score <= 100).toBeTruthy();
      });
    });
  });

  describe('Move — seans yükü', () => {
    it('yük süre × algılanan zorluktur', () => {
      expect(SP.Move.sessionLoad({ minutes:45, rpe:7 })).toBe(315);
    });

    it('zorluk yoksa MET ortalamasından hesaplanır', () => {
      const w = { minutes:30, rpe:null, items:[{ exId:'kosu' }] };
      expect(SP.Move.sessionLoad(w)).toBe(Math.round(30 * 9));
    });

    it('süre yoksa yük sıfır', () => {
      expect(SP.Move.sessionLoad({ minutes:0, rpe:8 })).toBe(0);
    });

    it('ne zorluk ne hareket varsa yük üretilmez', () => {
      expect(SP.Move.sessionLoad({ minutes:40, rpe:null, items:[] })).toBe(0);
    });

    it('günün yükü seansların toplamıdır', () => {
      resetState();
      pushWorkout('2026-03-01', { minutes:30, rpe:5 });
      pushWorkout('2026-03-01', { minutes:20, rpe:6 });
      expect(SP.Move.loadOn('2026-03-01')).toBe(150 + 120);
    });
  });

  describe('Move — akut/kronik oran', () => {
    it('kayıt yoksa oran hesaplanmaz', () => {
      resetState();
      expect(SP.Move.acwr().ok).toBeFalsy();
    });

    it('üç haftadan kısa geçmişte oran hesaplanmaz', () => {
      resetState();
      withToday('2026-03-15', () => {
        pushWorkout('2026-03-10', { minutes:40, rpe:6 });
        pushWorkout('2026-03-12', { minutes:40, rpe:6 });
        expect(SP.Move.acwr().ok).toBeFalsy();
      });
    });

    it('düzenli yükte oran 1 civarında ve güvenli bölgede', () => {
      resetState();
      withToday('2026-04-01', () => {
        for(let i = 0; i < 28; i++){
          pushWorkout(U.iso(U.addDays(U.parse('2026-04-01'), -i)), { minutes:40, rpe:6 });
        }
        const a = SP.Move.acwr();
        expect(a.ok).toBeTruthy();
        expect(a.zone).toBe('ok');
        expect(a.ratio).toBeCloseTo(1, 1);
      });
    });

    it('son hafta ani yüklenirse yüksek bölgeye çıkar', () => {
      resetState();
      withToday('2026-04-01', () => {
        for(let i = 7; i < 28; i++){
          pushWorkout(U.iso(U.addDays(U.parse('2026-04-01'), -i)), { minutes:20, rpe:4 });
        }
        for(let i = 0; i < 7; i++){
          pushWorkout(U.iso(U.addDays(U.parse('2026-04-01'), -i)), { minutes:90, rpe:9 });
        }
        const a = SP.Move.acwr();
        expect(a.zone).toBe('high');
        expect(a.ratio > 1.5).toBeTruthy();
      });
    });

    it('son hafta boş geçerse düşük bölgeye iner', () => {
      resetState();
      withToday('2026-04-01', () => {
        for(let i = 8; i < 28; i++){
          pushWorkout(U.iso(U.addDays(U.parse('2026-04-01'), -i)), { minutes:60, rpe:7 });
        }
        expect(SP.Move.acwr().zone).toBe('low');
      });
    });
  });

  describe('Move — indirme haftası ve büyüme', () => {
    it('beşinci haftada indirme gelir', () => {
      resetState();
      withToday('2026-02-05', () => {
        pushWorkout('2026-01-01', { minutes:40, rpe:6 });
        const dl = SP.Move.deloadWeek();
        expect(dl.week).toBe(6);
        expect(dl.inCycle).toBe(1);
      });
    });

    it('döngünün son haftasında indirme işaretlenir', () => {
      resetState();
      withToday('2026-01-29', () => {
        pushWorkout('2026-01-01', { minutes:40, rpe:6 });
        expect(SP.Move.deloadWeek().due).toBeTruthy();
      });
    });

    it('haftalık büyüme %10\'u aşarsa işaretlenir', () => {
      resetState();
      withToday('2026-04-01', () => {
        for(let i = 7; i < 14; i++){
          pushWorkout(U.iso(U.addDays(U.parse('2026-04-01'), -i)), { minutes:30, rpe:5 });
        }
        for(let i = 0; i < 7; i++){
          pushWorkout(U.iso(U.addDays(U.parse('2026-04-01'), -i)), { minutes:60, rpe:7 });
        }
        const g = SP.Move.weeklyGrowth();
        expect(g.ok).toBeTruthy();
        expect(g.over).toBeTruthy();
      });
    });
  });

  describe('Move — günün emri', () => {
    it('ölçüm yoksa yük planlandığı gibi kabul edilir', () => {
      resetState();
      withToday('2026-03-01', () => {
        const rx = SP.Move.prescription();
        expect(rx.factor).toBe(1);
        expect(rx.kind).toBe('full');
      });
    });

    it('iyi toparlanma tam yük verir', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8, soreness:5 });
        expect(SP.Move.prescription().factor >= 1).toBeTruthy();
      });
    });

    it('kötü toparlanma yükü düşürür', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:4, soreness:1 });
        const rx = SP.Move.prescription();
        expect(rx.factor < 1).toBeTruthy();
        expect(rx.reasons.length > 0).toBeTruthy();
      });
    });

    it('ateşliyken seans önerisi mobiliteye iner', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8, temp:39 });
        const rx = SP.Move.prescription();
        expect(rx.kind).toBe('rest');
        expect(rx.suggest[0].id).toBe('mobilite');
      });
    });

    it('aşırı yük toparlanma iyi olsa bile çarpanı düşürür', () => {
      resetState();
      withToday('2026-04-01', () => {
        pushVitals('2026-04-01', { sleep:8, soreness:5 });
        for(let i = 7; i < 28; i++){
          pushWorkout(U.iso(U.addDays(U.parse('2026-04-01'), -i)), { minutes:20, rpe:4 });
        }
        for(let i = 0; i < 7; i++){
          pushWorkout(U.iso(U.addDays(U.parse('2026-04-01'), -i)), { minutes:90, rpe:9 });
        }
        const rx = SP.Move.prescription();
        expect(rx.factor <= 0.7).toBeTruthy();
      });
    });

    it('sistem yükü kendiliğinden artırmaz', () => {
      resetState();
      withToday('2026-04-01', () => {
        pushVitals('2026-04-01', { sleep:8, soreness:5 });
        /* En iyi durumda bile çarpan bandın üst sınırını aşmaz. */
        expect(SP.Move.prescription().factor <= 1.1).toBeTruthy();
      });
    });
  });

  describe('Move — kademeli ilerleme', () => {
    it('yeni kullanıcı ilk basamaktan başlar', () => {
      resetState();
      expect(SP.Model.currentLevel('sinav')).toBe('duvar');
      expect(SP.Model.levelIndex('sinav')).toBe(0);
    });

    it('yeterli seans olmadan üst basamak açılmaz', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushWorkout('2026-02-28', { items:['sinav'] });
        const p = SP.Move.progressionCheck('sinav');
        expect(p.ready).toBeFalsy();
        expect(p.sessions).toBe(1);
      });
    });

    it('üç seans sonrası üst basamak açılır', () => {
      resetState();
      withToday('2026-03-05', () => {
        ['2026-03-01', '2026-03-03', '2026-03-05'].forEach(d =>
          pushWorkout(d, { items:['sinav'] }));
        expect(SP.Move.progressionCheck('sinav').ready).toBeTruthy();
      });
    });

    it('pencere dışındaki seanslar sayılmaz', () => {
      resetState();
      withToday('2026-03-20', () => {
        ['2026-03-01', '2026-03-02', '2026-03-03'].forEach(d =>
          pushWorkout(d, { items:['sinav'] }));
        expect(SP.Move.progressionCheck('sinav').ready).toBeFalsy();
      });
    });

    it('son basamakta üst basamak yok', () => {
      resetState();
      const ex = SP.EX_BY_ID.sinav;
      SP.S.progress.sinav = { levelId:ex.levels[ex.levels.length - 1].id };
      const p = SP.Move.progressionCheck('sinav');
      expect(p.next).toBeNull();
      expect(p.ready).toBeFalsy();
    });

    it('kalıp dengesi eksik kalıpları bildirir', () => {
      resetState();
      withToday('2026-03-05', () => {
        pushWorkout('2026-03-04', { items:['sinav'] });
        const rows = SP.Move.patternBalance();
        expect(rows.find(r => r.pattern.id === 'push').count).toBe(1);
        expect(rows.find(r => r.pattern.id === 'pull').missing).toBeTruthy();
      });
    });
  });
})();
