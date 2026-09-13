/* Zamanlayıcı — süre ÖLÇÜLÜR, tahmin edilmez. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = ESP.Test;
  const T = () => ESP.Timer;

  /* Duvar saatini sahtele: gerçek zamanı beklemek testi yavaş ve kırılgan
     yapar. Ölçülen şey zaten `Date.now()` farkı. */
  function zaman(ms, fn){
    const gercek = Date.now;
    let t = ms;
    Date.now = () => t;
    const ilerle = n => { t += n; };
    return Promise.resolve(fn(ilerle)).finally(() => { Date.now = gercek; });
  }

  describe('sayac · temel', () => {

    it('bos sayac calismıyor', () => {
      resetState();
      expect(T().active()).toBeFalsy();
      expect(T().running()).toBeFalsy();
      expect(T().minutes()).toBe(0);
    });

    it('bilinmeyen ya da kapali bolumde baslamaz', async () => {
      resetState();
      expect((await T().start('astroloji')).ok).toBeFalsy();
      await ESP.Mod.set('music', false);
      expect((await T().start('music')).ok).toBeFalsy();
    });

    /* Sure DUVAR SAATINDEN gelir: arka plan sekmesinde tik durur, saat
       durmaz. */
    it('gecen sure duvar saatinden okunur', async () => {
      resetState();
      await zaman(1000000, async (ilerle) => {
        await T().start('lang');
        ilerle(25 * 60 * 1000);
        expect(T().minutes()).toBe(25);
      });
    });

    it('duraklatilan sayac akmaz', async () => {
      resetState();
      await zaman(1000000, async (ilerle) => {
        await T().start('lang');
        ilerle(10 * 60 * 1000);
        await T().pause();
        ilerle(60 * 60 * 1000);
        expect(T().minutes()).toBe(10);
      });
    });

    it('surdurulen sayac kaldigi yerden devam eder', async () => {
      resetState();
      await zaman(1000000, async (ilerle) => {
        await T().start('lang');
        ilerle(10 * 60 * 1000);
        await T().pause();
        await T().resume();
        ilerle(5 * 60 * 1000);
        expect(T().minutes()).toBe(15);
      });
    });

    it('saat bicimi saati de gosterir', async () => {
      resetState();
      await zaman(1000000, async (ilerle) => {
        await T().start('lang');
        ilerle(65 * 1000);
        expect(T().clock()).toBe('01:05');
        ilerle(60 * 60 * 1000);
        expect(T().clock().indexOf('1:') === 0).toBeTruthy();
      });
    });
  });

  describe('sayac · kayit', () => {

    it('bitirince gun kaydina OLCULMUS oturum yazilir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await zaman(1000000, async (ilerle) => {
          await T().start('music');
          ilerle(40 * 60 * 1000);
          const res = await T().stop();
          expect(res.ok).toBeTruthy();
          expect(res.minutes).toBe(40);
          expect(ESP.Model.minutesOf('2026-09-12', 'music')).toBe(40);
          expect(ESP.S.days['2026-09-12'].sessions[0].minutesCert).toBe('measured');
        });
      });
    });

    /* "0 dakika oturum" diye bir sey yok: sifir yazmak, girilmemis gunu
       girilmis gostermektir. */
    it('bir dakikanin altindaki sayac kaydedilmez', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await zaman(1000000, async (ilerle) => {
          await T().start('lang');
          ilerle(20 * 1000);
          const res = await T().stop();
          expect(res.ok).toBeFalsy();
          expect(res.discarded).toBeTruthy();
          expect(ESP.Model.dayOf('2026-09-12')).toBeNull();
        });
      });
    });

    /* Uydurulmus buyuk bir sayi, hic sayi olmamasindan kotudur. */
    it('unutulmus sayac kendiliginden yazilmaz', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await zaman(1000000, async (ilerle) => {
          await T().start('reading');
          ilerle(9 * 60 * 60 * 1000);
          const res = await T().stop();
          expect(res.ok).toBeFalsy();
          expect(res.suspicious).toBeTruthy();
          expect(ESP.Model.dayOf('2026-09-12')).toBeNull();
          /* Israr edilirse yazilir — ama kullanici ne yazdigini gormus olur. */
          const zorla = await T().stop({ force:true });
          expect(zorla.ok).toBeTruthy();
          expect(ESP.Model.minutesOf('2026-09-12', 'reading')).toBe(540);
        });
      });
    });

    it('bitince sayac sifirlanir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await zaman(1000000, async (ilerle) => {
          await T().start('lang');
          ilerle(30 * 60 * 1000);
          await T().stop();
          expect(T().active()).toBeFalsy();
          expect(T().minutes()).toBe(0);
        });
      });
    });
  });

  describe('sayac · devir ve kalicilik', () => {

    /* Baska bir disipline gecmek olculmus sureyi SESSIZCE silmemeli. */
    it('bolum degisince eski sayacin suresi cagirana soylenir', async () => {
      resetState();
      await zaman(1000000, async (ilerle) => {
        await T().start('lang');
        ilerle(12 * 60 * 1000);
        const res = await T().start('music');
        expect(res.ok).toBeTruthy();
        expect(res.handedOver.disc).toBe('lang');
        expect(res.handedOver.minutes).toBe(12);
        expect(T().disc()).toBe('music');
        expect(T().minutes()).toBe(0);
      });
    });

    it('sayac sayfa kapanınca olmez', async () => {
      resetState();
      await zaman(1000000, async (ilerle) => {
        await T().start('writing');
        ilerle(8 * 60 * 1000);
        /* Yeniden yukleme: durum sifirlanir, depo kalir. */
        ESP.S.timer = null;
        await T().load();
        expect(T().disc()).toBe('writing');
        expect(T().minutes()).toBe(8);
        expect(T().running()).toBeTruthy();
      });
    });

    it('bozuk kayit calisir sayac gibi yuklenmez', async () => {
      resetState();
      await ESP.Store.set('timer', { disc:'lang', running:true, startedAt:'birazonce',
        accumulatedMs:'cok' });
      await T().load();
      expect(T().running()).toBeFalsy();
      expect(T().minutes()).toBe(0);
    });

    it('silinmis bolumun sayaci yuklenmez', async () => {
      resetState();
      await ESP.Store.set('timer', { disc:'astroloji', running:true,
        startedAt:Date.now(), accumulatedMs:0 });
      await T().load();
      expect(T().active()).toBeFalsy();
    });
  });
})();
