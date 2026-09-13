/* Sürtünme, kalibrasyon, Goodhart ve sinyal — SPİ'nin kendi denetimi. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync,
    pushVitals, pushWorkout } = SP.Test;
  const S = SP.S, U = SP.U;
  const F = () => SP.Friction, K = () => SP.Calib,
    G = () => SP.Goodhart, Sg = () => SP.Signals;

  function zaman(bas, fn){
    const gercek = Date.now;
    let t = bas;
    Date.now = () => t;
    const ilerle = n => { t += n; };
    return Promise.resolve(fn(ilerle)).finally(() => { Date.now = gercek; });
  }

  /* ------------------------------------------------------------ sürtünme */

  describe('Sürtünme — ölçüm', () => {

    it('ardışık dokunuşlar arasındaki süre sayılır', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick(); ilerle(30000); F().tick(); ilerle(30000); F().tick();
          expect(F().day().admin).toBe(1);
        });
      });
    });

    it('uzun boşluk sayılmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick(); ilerle(3 * 60 * 60 * 1000);
          expect(F().tick().reason).toBe('away');
        });
      });
    });

    /* SPİ'de ORAN hesaplanmaz: sağlıklı yaşamak bir saat işi değildir. */
    it('genel oran hesaplanmaz, yalnızca mutlak süre', () => {
      resetState();
      withToday('2026-03-10', () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:20 * 60000, ticks:40 } } };
        const w = F().window(1);
        expect(w.perDay).toBe(20);
        /* Antrenman yoksa antrenman oranı da yok — uydurulmaz. */
        expect(w.trainingRatio).toBe(null);
      });
    });

    it('antrenman günlerinde ikincil oran hesaplanır', () => {
      resetState();
      withToday('2026-03-10', () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:10 * 60000, ticks:20 } } };
        pushWorkout('2026-03-10', { minutes:30 });
        const w = F().window(1);
        expect(w.trainingDays).toBe(1);
        expect(Math.round(w.trainingRatio * 100)).toBe(25);
      });
    });

    it('bütçe aşılınca yüksek sayılır', () => {
      resetState();
      withToday('2026-03-10', () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:25 * 60000, ticks:50 } } };
        expect(F().verdict(1).level).toBe('high');
      });
    });

    it('veri yoksa sıfır değil bilinmiyor', () => {
      resetState();
      withToday('2026-03-10', () => {
        expect(F().verdict().level).toBe('unknown');
        expect(F().verdict().cert).toBe('missing');
      });
    });

    /* Sistem kendi yükünü AZALTMAYI önerir. */
    it('öneriler yalnızca yük azaltır', () => {
      resetState();
      withToday('2026-03-10', () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:40 * 60000, ticks:80 } } };
        const r = F().relief();
        expect(r.length > 0).toBeTruthy();
        r.forEach(x => expect(/daha çok veri|daha fazla gir/i.test(x.note)).toBeFalsy());
      });
    });
  });

  /* --------------------------------------------------------- kalibrasyon */

  function kapali(kind, guess, actual){
    S.forecasts.push(SP.Calib.norm({ kind, guess, actual,
      at:'2026-03-01T10:00:00.000Z', settledAt:'2026-03-08T10:00:00.000Z' }));
  }

  describe('Kalibrasyon — sağlık', () => {

    it('sağlığa özgü tahmin türleri tanımlı', () => {
      const ids = SP.CALIB_KINDS.map(k => k.id);
      expect(ids.indexOf('lab-value') >= 0).toBeTruthy();
      expect(ids.indexOf('readiness') >= 0).toBeTruthy();
      expect(ids.indexOf('weight') >= 0).toBeTruthy();
    });

    it('beşten az kayıtta puan verilmez', () => {
      resetState();
      kapali('weight', 80, 79);
      expect(K().score().cert).toBe('missing');
    });

    it('sapma gerçek değere göre ölçülür', () => {
      resetState();
      for(let i = 0; i < 5; i++) kapali('weight', 84, 80);
      expect(K().score().ape).toBe(0.05);
    });

    /* Kendini sürekli iyi okuyan ile kötü okuyan farklı şeyler yapmalı. */
    it('sistemli yanlılık ayrı ölçülür', () => {
      resetState();
      for(let i = 0; i < 6; i++) kapali('readiness', 85, 60);
      const b = K().score().bias;
      expect(b.direction).toBe('over');
      /* Bu bir SAĞLIK yargısı değildir; metinde öyle sunulmaz. */
      expect(/hasta|sağlıksız|kötüsün/i.test(b.note)).toBeFalsy();
    });

    it('kör olmayan kayıt puana girmez', () => {
      resetState();
      for(let i = 0; i < 6; i++){
        S.forecasts.push(SP.Calib.norm({ kind:'weight', guess:80, actual:80,
          blind:false, settledAt:'2026-03-08T10:00:00.000Z' }));
      }
      expect(K().score().cert).toBe('missing');
    });

    it('tahlile bağlı açık tahmin bulunur', async () => {
      resetState();
      await K().open('lab-value', 45, { ref:'lab1' });
      expect(!!K().forLab('lab1')).toBeTruthy();
      expect(K().forLab('lab2')).toBe(null);
    });
  });

  /* -------------------------------------------------------------- Goodhart */

  describe('Goodhart — sağlıkta gürültü', () => {

    const BUGUN = '2026-06-01';
    function once(n){ return U.iso(U.addDays(U.parse(BUGUN), -n)); }
    function cift(id){ return G().scan().filter(p => p.id === id)[0]; }

    /* Sağlık verisi gürültülü: pencere 56 gün, eşik %35. */
    it('pencere ve eşik diğer sistemlerden muhafazakâr', () => {
      expect(G().PENCERE).toBe(56);
      expect(G().CABA_ARTIS > 0.3).toBeTruthy();
    });

    it('iki pencere bitişik ve örtüşmez', () => {
      withToday(BUGUN, () => {
        const w = G().windows();
        expect(w.prev.to).toBe(w.now.from);
      });
    });

    /* Tek tahlille eğilim çıkarmak, iki noktadan doğru geçirmektir. */
    it('tek ölçümde biyobelirteç çifti değerlendirilmez', () => {
      resetState();
      withToday(BUGUN, () => {
        pushVitals(once(70), { weight:80 });
        pushVitals(once(10), { weight:79 });
        expect(cift('weighins-vs-weight').status).toBe('unknown');
      });
    });

    it('çaba düşerken uyarı üretilmez', () => {
      resetState();
      withToday(BUGUN, () => {
        for(let i = 0; i < 8; i++) pushWorkout(once(70 + i), { minutes:60 });
        for(let i = 0; i < 2; i++) pushWorkout(once(10 + i), { minutes:30 });
        for(let i = 0; i < 12; i++){
          pushVitals(once(70 + i), { sleep:7, hrv:60, rhr:60, soreness:3 });
          pushVitals(once(10 + i), { sleep:7, hrv:60, rhr:60, soreness:3 });
        }
        expect(cift('training-vs-readiness').status).toBe('idle');
      });
    });

    it('çaba artıp sonuç yerinde sayarsa ayrışma işaretlenir', () => {
      resetState();
      withToday(BUGUN, () => {
        for(let i = 0; i < 8; i++) pushWorkout(once(70 + i), { minutes:60 });
        for(let i = 0; i < 20; i++) pushWorkout(once(10 + i), { minutes:60 });
        for(let i = 0; i < 12; i++){
          pushVitals(once(70 + i), { sleep:7, hrv:60, rhr:60, soreness:3 });
          pushVitals(once(10 + i), { sleep:7, hrv:60, rhr:60, soreness:3 });
        }
        expect(cift('training-vs-readiness').status).toBe('decoupled');
      });
    });

    it('her çiftin sorusu gerçekten soru', () => {
      G().PAIRS.forEach(p => expect(p.question.indexOf('?') > 0).toBeTruthy());
    });

    it('bayrak yoksa brifing sessizdir', () => {
      resetState();
      withToday(BUGUN, () => { expect(G().brief()).toBe(null); });
    });
  });

  /* ---------------------------------------------------------------- sinyal */

  describe('Sinyal — tek soru kuralı', () => {

    it('sinyal yoksa soru yok', async () => {
      resetState();
      await withTodayAsync('2026-06-01', async () => {
        expect((await Sg().sync()).opened).toBe(null);
      });
    });

    it('yüksek sürtünmede tek soru açılır ve ikincisi açılmaz', async () => {
      resetState();
      await withTodayAsync('2026-06-01', async () => {
        S.usage = { days:{}, lastTick:null };
        for(let i = 0; i < 14; i++){
          const t = U.iso(U.addDays(U.parse('2026-06-01'), -i));
          S.usage.days[t] = { date:t, adminMs:30 * 60000, ticks:60 };
        }
        const r = await Sg().sync();
        expect(r.opened.kind).toBe('friction');
        await Sg().sync();
        expect(Sg().open().length).toBe(1);
      });
    });

    it('«bana uymuyor» da bir cevaptır', async () => {
      resetState();
      await withTodayAsync('2026-06-01', async () => {
        S.usage = { days:{}, lastTick:null };
        for(let i = 0; i < 14; i++){
          const t = U.iso(U.addDays(U.parse('2026-06-01'), -i));
          S.usage.days[t] = { date:t, adminMs:30 * 60000, ticks:60 };
        }
        const r = await Sg().sync();
        await Sg().dismiss(r.opened.id, 'Tahlil dönemindeydim.');
        expect(Sg().current()).toBe(null);
        expect(Sg().closed()[0].outcome).toBe('dismissed');
      });
    });

    it('fayda notu nedensellik iddia etmez', () => {
      resetState();
      for(let i = 0; i < 6; i++){
        S.signals.push(SP.Signals.norm({ kind:'goodhart', ref:'r' + i, title:'t',
          question:'s?', status:i < 3 ? 'resolved' : 'expired',
          answeredAt:i < 3 ? '2026-05-01T10:00:00.000Z' : null,
          seenAt:'2026-05-01T09:00:00.000Z',
          closedAt:'2026-05-20T10:00:00.000Z',
          outcome:i < 3 ? 'realigned' : 'still-decoupled' }));
      }
      const e = Sg().efficacy();
      expect(e.note.indexOf('NEDENSELLİK') > 0).toBeTruthy();
      expect(/sayesinde|nedeniyle/.test(e.note)).toBeFalsy();
    });
  });
})();
