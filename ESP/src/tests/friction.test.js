/* Sürtünme ölçer — sistemin kendi maliyeti de bir ölçümdür. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = ESP.Test;
  const F = () => ESP.Friction;
  const S = ESP.S;

  function zaman(bas, fn){
    const gercek = Date.now;
    let t = bas;
    Date.now = () => t;
    const ilerle = n => { t += n; };
    return Promise.resolve(fn(ilerle, () => t)).finally(() => { Date.now = gercek; });
  }

  function oturum(tarih, disc, dk){
    S.days[tarih] = S.days[tarih] || { date:tarih, sessions:[], note:'' };
    S.days[tarih].sessions.push({ id:'s' + Math.random(), disc, minutes:dk });
  }

  describe('surtunme · olcum', () => {

    it('ilk dokunus sure uretmez', async () => {
      resetState();
      await zaman(1000000, async () => {
        expect(F().tick().counted).toBe(0);
        expect(F().adminMinutes()).toBe(0);
      });
    });

    it('ardisik dokunuslar arasindaki sure sayilir', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick();
          ilerle(30000); F().tick();
          ilerle(30000); F().tick();
          expect(F().adminMinutes()).toBe(1);
        });
      });
    });

    /* Acik unutulmus sekme surtunme degildir: kimse onunla ugrasmiyordur. */
    it('uzun bosluk sayilmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick();
          ilerle(3 * 60 * 60 * 1000);
          const r = F().tick();
          expect(r.counted).toBe(0);
          expect(r.reason).toBe('away');
          expect(F().adminMinutes()).toBe(0);
        });
      });
    });

    /* Sayac calisirken gecen sure CALISMADIR, yonetim degil. */
    it('pratik sayaci acikken sure sayilmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick();
          ilerle(20000); F().tick();
          await ESP.Timer.start('lang');
          ilerle(20000);
          const r = F().tick();
          expect(r.reason).toBe('practice');
          expect(F().adminMinutes()).toBe(0);
        });
      });
    });

    it('arkaya giden sekmede zincir kesilir', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick();
          ilerle(20000); F().tick();
          F().blur();
          ilerle(20000);
          expect(F().tick().reason).toBe('first');
        });
      });
    });

    /* Geriye giden saat (yaz saati, elle ayar) sure URETMEZ. */
    it('geriye giden saat sure uretmez', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          F().tick();
          ilerle(-5000);
          expect(F().tick().reason).toBe('nonmonotonic');
        });
      });
    });
  });

  describe('surtunme · hukum', () => {

    it('veri yoksa sifir degil, bilinmiyor', () => {
      resetState();
      const v = F().verdict();
      expect(v.level).toBe('unknown');
      expect(v.cert).toBe('missing');
    });

    /* Payda VERI YOK ise oran hesaplanmaz — sifir calisma varsayilmaz. */
    it('oturum girilmemisse oran hesaplanmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await zaman(1000000, async (ilerle) => {
          for(let i = 0; i < 40; i++){ F().tick(); ilerle(30000); }
          const d = F().day();
          expect(d.cert).toBe('partial');
          expect(d.ratio).toBe(null);
          expect(F().verdict().level).toBe('unknown');
        });
      });
    });

    it('butce ve oran birlikte asilinca yuksek sayilir', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        /* 20 dk yonetim, 10 dk calisma → hem butce hem oran asildi. */
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:20 * 60000, ticks:40 } },
          lastTick:null };
        oturum('2026-03-10', 'lang', 10);
        const v = F().verdict(1);
        expect(v.level).toBe('high');
        expect(v.cert).toBe('measured');
      });
    });

    /* Tek esik asilmak hukum degildir: kurulum gunu olabilir. */
    it('tek esik asilinca yalnizca izlenir', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        /* Oran yuksek ama toplam kucuk: 5 dk yonetim, 2 dk calisma. */
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:5 * 60000, ticks:10 } },
          lastTick:null };
        oturum('2026-03-10', 'lang', 2);
        expect(F().verdict(1).level).toBe('watch');
      });
    });

    it('bol calisma varsa surtunme butcede kalir', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:6 * 60000, ticks:12 } },
          lastTick:null };
        oturum('2026-03-10', 'lang', 90);
        expect(F().verdict(1).level).toBe('ok');
      });
    });

    /* Sistem kendi yukunu AZALTMAYI onerir; hicbir madde "daha cok veri gir" demez. */
    it('rahatlama onerileri yalnizca yuk azaltir', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:30 * 60000, ticks:60 } },
          lastTick:null };
        oturum('2026-03-10', 'lang', 5);
        const r = F().relief();
        expect(r.length > 0).toBeTruthy();
        r.forEach(x => {
          expect(/daha çok|daha fazla gir/i.test(x.note)).toBeFalsy();
        });
      });
    });

    it('surtunme dusukse oneri uretilmez', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:60000, ticks:5 } },
          lastTick:null };
        oturum('2026-03-10', 'lang', 60);
        expect(F().relief().length).toBe(0);
      });
    });
  });

  describe('surtunme · dayaniklilik', () => {

    it('bozuk kayit sifirlanir, NaN tasinmaz', async () => {
      resetState();
      await ESP.Store.set('usage', { days:{ '2026-03-10':{ adminMs:'abc', ticks:'x' } } });
      await F().load();
      expect(S.usage.days['2026-03-10'].adminMs).toBe(0);
      expect(S.usage.days['2026-03-10'].ticks).toBe(0);
    });

    /* Surtunme kaydi da bir yuktur ve kendi kuralina uyar. */
    it('cok eski gunler yazarken atilir', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        S.usage = { days:{
          '2020-01-01':{ date:'2020-01-01', adminMs:60000, ticks:2 },
          '2026-03-10':{ date:'2026-03-10', adminMs:60000, ticks:2 },
        }, lastTick:null };
        await F().save();
        expect(S.usage.days['2020-01-01']).toBeFalsy();
        expect(S.usage.days['2026-03-10']).toBeTruthy();
      });
    });
  });
})();
