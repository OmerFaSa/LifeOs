/* Sürtünme, kalibrasyon ve Goodhart nöbetçisi — sistemin kendi denetimi. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync } = R.Test;
  const S = R.S, U = R.U;
  const F = () => R.Friction, K = () => R.Calib, G = () => R.Goodhart;

  function zaman(bas, fn){
    const gercek = Date.now;
    let t = bas;
    Date.now = () => t;
    const ilerle = n => { t += n; };
    return Promise.resolve(fn(ilerle)).finally(() => { Date.now = gercek; });
  }

  function gun(tarih, bloklar){
    S.days[tarih] = { date:tarih, blocks:bloklar || [], paragraphActual:0,
      problemActual:0, freeQ:0, checklist:{}, note:'' };
    return S.days[tarih];
  }
  function blok(dk, soru, dogru){
    return { id:'b', slot:'', subject:'', targetMin:dk, targetQ:soru,
      status:'done', actualMin:dk, actualQ:soru, correctQ:dogru };
  }

  /* ------------------------------------------------------------ sürtünme */

  describe('Sürtünme — ölçüm', () => {

    it('ilk dokunuş süre üretmez', async () => {
      resetState();
      await zaman(1000000, async () => { expect(F().tick().counted).toBe(0); });
    });

    it('ardışık dokunuşlar arasındaki süre sayılır', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick(); ilerle(30000); F().tick(); ilerle(30000); F().tick();
          expect(F().day().admin).toBe(1);
        });
      });
    });

    /* Açık unutulmuş sekme sürtünme değildir. */
    it('uzun boşluk sayılmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick(); ilerle(2 * 60 * 60 * 1000);
          expect(F().tick().reason).toBe('away');
        });
      });
    });

    it('geriye giden saat süre üretmez', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick(); ilerle(-9000);
          expect(F().tick().reason).toBe('nonmonotonic');
        });
      });
    });

    /* Çalışma süresi PLANLANAN değil GERÇEKLEŞEN süredir. */
    it('çalışma süresi gerçekleşenden okunur', () => {
      resetState();
      withToday('2026-03-10', () => {
        const d = gun('2026-03-10', [blok(40, 30, 25)]);
        d.blocks.push({ id:'b2', targetMin:60, actualMin:null, status:'pending' });
        expect(F().workMinutes('2026-03-10')).toBe(40);
      });
    });
  });

  describe('Sürtünme — hüküm', () => {

    it('veri yoksa sıfır değil bilinmiyor', () => {
      resetState();
      withToday('2026-03-10', () => {
        expect(F().verdict().level).toBe('unknown');
        expect(F().verdict().cert).toBe('missing');
      });
    });

    /* Payda VERİ YOK ise oran hesaplanmaz. */
    it('gerçekleşen süre girilmemişse oran hesaplanmaz', () => {
      resetState();
      withToday('2026-03-10', () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:30 * 60000, ticks:60 } } };
        gun('2026-03-10', [{ id:'b', targetMin:60, actualMin:null, status:'pending' }]);
        expect(F().day().ratio).toBe(null);
        expect(F().verdict(1).level).toBe('unknown');
      });
    });

    it('bütçe ve oran birlikte aşılınca yüksek sayılır', () => {
      resetState();
      withToday('2026-03-10', () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:30 * 60000, ticks:60 } } };
        gun('2026-03-10', [blok(40, 30, 25)]);
        expect(F().verdict(1).level).toBe('high');
      });
    });

    it('tek eşik aşılınca yalnızca izlenir', () => {
      resetState();
      withToday('2026-03-10', () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:20 * 60000, ticks:40 } } };
        gun('2026-03-10', [blok(300, 200, 160)]);
        expect(F().verdict(1).level).toBe('watch');
      });
    });

    it('bol çalışma varsa bütçede kalır', () => {
      resetState();
      withToday('2026-03-10', () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:8 * 60000, ticks:16 } } };
        gun('2026-03-10', [blok(240, 180, 150)]);
        expect(F().verdict(1).level).toBe('ok');
      });
    });

    /* Sistem kendi yükünü AZALTMAYI önerir. */
    it('öneriler yalnızca yük azaltır', () => {
      resetState();
      withToday('2026-03-10', () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:40 * 60000, ticks:80 } } };
        gun('2026-03-10', [blok(30, 20, 15)]);
        const r = F().relief();
        expect(r.length > 0).toBeTruthy();
        r.forEach(x => expect(/daha çok veri|daha fazla gir/i.test(x.note)).toBeFalsy());
      });
    });

    it('bozuk kayıt sıfırlanır, NaN taşınmaz', async () => {
      resetState();
      await R.Store.set('usage', { days:{ '2026-03-10':{ adminMs:'x', ticks:null } } });
      await F().load();
      expect(S.usage.days['2026-03-10'].adminMs).toBe(0);
    });
  });

  /* --------------------------------------------------------- kalibrasyon */

  function kapali(kind, guess, actual){
    S.forecasts.push(R.Calib.norm({ kind, guess, actual,
      at:'2026-03-01T10:00:00.000Z', settledAt:'2026-03-08T10:00:00.000Z' }));
  }

  describe('Kalibrasyon — kayıt', () => {

    it('geçersiz tür ve değer reddedilir', async () => {
      resetState();
      expect((await K().open('astroloji', 5)).ok).toBeFalsy();
      expect((await K().open('exam-net', 'çok')).ok).toBeFalsy();
      expect((await K().open('week-plan', 1.5)).ok).toBeFalsy();
    });

    /* Erken kapanış tahmini kolaylaştırır. */
    it('vadesinden önce kapanmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        const a = await K().open('week-minutes', 900, { dueAt:'2026-03-17' });
        const r = await K().settle(a.forecast.id, 800);
        expect(r.ok).toBeFalsy();
        expect(r.early).toBeTruthy();
      });
    });

    it('bir tahmin iki kez kapanmaz', async () => {
      resetState();
      const a = await K().open('exam-net', 62);
      expect((await K().settle(a.forecast.id, 58)).ok).toBeTruthy();
      expect((await K().settle(a.forecast.id, 60)).ok).toBeFalsy();
    });

    it('denemeye bağlı açık tahmin bulunur', async () => {
      resetState();
      await K().open('exam-net', 62, { ref:'e1' });
      expect(K().forExam('e1')).toBeTruthy();
      expect(K().forExam('e2')).toBe(null);
    });
  });

  describe('Kalibrasyon — puan', () => {

    it('beşten az kayıtta puan verilmez', () => {
      resetState();
      kapali('exam-net', 60, 55);
      expect(K().score().cert).toBe('missing');
    });

    it('kusursuz tahminde sapma sıfır', () => {
      resetState();
      for(let i = 0; i < 6; i++) kapali('exam-net', 60, 60);
      const p = K().score();
      expect(p.ape).toBe(0);
      expect(p.grade).toBe('keskin');
    });

    /* Düşük netlerde aynı mutlak sapma DAHA BÜYÜK bir hatadır. */
    it('sapma gerçek değere göre ölçülür', () => {
      resetState();
      for(let i = 0; i < 5; i++) kapali('exam-net', 10, 5);
      expect(K().score().ape).toBe(1);
      resetState();
      for(let i = 0; i < 5; i++) kapali('exam-net', 65, 60);
      expect(Math.round(K().score().ape * 100)).toBe(8);
    });

    it('sistemli abartma yanlılık olarak görünür', () => {
      resetState();
      for(let i = 0; i < 6; i++) kapali('exam-net', 70, 55);
      expect(K().score().bias.direction).toBe('over');
    });

    it('kör olmayan kayıt puana girmez', () => {
      resetState();
      for(let i = 0; i < 6; i++){
        S.forecasts.push(R.Calib.norm({ kind:'exam-net', guess:60, actual:60,
          blind:false, settledAt:'2026-03-08T10:00:00.000Z' }));
      }
      expect(K().score().cert).toBe('missing');
    });

    it('ikili tahmin Brier ile ayrı hesaplanır', () => {
      resetState();
      for(let i = 0; i < 5; i++) kapali('week-plan', 1, 1);
      const p = K().score();
      expect(p.brier).toBe(0);
      expect(p.ape).toBe(null);
    });
  });

  /* -------------------------------------------------------------- Goodhart */

  describe('Goodhart — ayrışma', () => {

    const BUGUN = '2026-06-01';
    function once(n){ return U.iso(U.addDays(U.parse(BUGUN), -n)); }
    function cift(id){ return G().scan().filter(p => p.id === id)[0]; }

    it('iki pencere bitişik ve örtüşmez', () => {
      withToday(BUGUN, () => {
        const w = G().windows();
        expect(w.prev.to).toBe(w.now.from);
      });
    });

    /* Ölçülmemiş sonuç, sıfır sonuç değildir. */
    it('sonuç ölçülmediyse bilinmiyor döner', () => {
      resetState();
      withToday(BUGUN, () => {
        gun(once(40), [blok(300, 400, 300)]);
        gun(once(10), [blok(600, 900, 700)]);
        expect(cift('questions-vs-net').status).toBe('unknown');
      });
    });

    it('çaba düşerken uyarı üretilmez', () => {
      resetState();
      withToday(BUGUN, () => {
        gun(once(40), [blok(600, 900, 700)]);
        gun(once(10), [blok(200, 300, 240)]);
        expect(cift('questions-vs-accuracy').status).toBe('idle');
      });
    });

    it('çaba ve sonuç birlikte artınca gösterge sağlam', () => {
      resetState();
      withToday(BUGUN, () => {
        gun(once(40), [blok(300, 400, 200)]);
        gun(once(10), [blok(600, 900, 630)]);
        expect(cift('questions-vs-accuracy').status).toBe('aligned');
      });
    });

    it('soru artıp doğruluk yerinde sayarsa ayrışma işaretlenir', () => {
      resetState();
      withToday(BUGUN, () => {
        gun(once(40), [blok(300, 400, 280)]);
        gun(once(10), [blok(600, 900, 630)]);
        const p = cift('questions-vs-accuracy');
        expect(p.status).toBe('decoupled');
        expect(G().flags().length > 0).toBeTruthy();
      });
    });

    /* Az sayıda soruda doğruluk oranı gürültüdür: ölçüm sayılmaz ve
       sonuç tarafı 'unknown' döner — sıfır doğruluk varsayılmaz. */
    it('az soruda doğruluk oranı ölçülmez', () => {
      resetState();
      withToday(BUGUN, () => {
        gun(once(40), [blok(20, 20, 15)]);
        gun(once(10), [blok(40, 60, 45)]);
        expect(cift('questions-vs-accuracy').status).toBe('unknown');
      });
    });

    /* Sonuç ölçülebiliyor ama çaba hacmi küçükse nöbetçi susar. */
    it('eşiğin altındaki hacim değerlendirilmez', () => {
      resetState();
      withToday(BUGUN, () => {
        gun(once(40), [blok(20, 10, 8)]);
        gun(once(10), [blok(40, 20, 16)]);
        expect(cift('minutes-vs-closed').status).toBe('idle');
      });
    });

    /* Nöbetçinin konuşmadığı gün, iyi gündür. */
    it('bayrak yoksa brifing sessizdir', () => {
      resetState();
      withToday(BUGUN, () => { expect(G().brief()).toBe(null); });
    });

    it('her çiftin sorusu gerçekten soru', () => {
      G().PAIRS.forEach(p => expect(p.question.indexOf('?') > 0).toBeTruthy());
    });

    it('çift kimlikleri benzersiz', () => {
      const m = {};
      G().PAIRS.forEach(p => { m[p.id] = (m[p.id] || 0) + 1; });
      Object.keys(m).forEach(k => expect(m[k]).toBe(1));
    });
  });
})();
