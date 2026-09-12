/* Koç motoru — reçete tavsiye değildir: her egzersiz bir kapıya bağlıdır. */

(function(){
  const { describe, it, expect, resetState, withToday,
    pushCard, pushSession, pushEvent } = ESP.Test;
  const Co = () => ESP.Coach;

  describe('koç · katalog butunlugu', () => {

    it('her disiplinin egzersizi vardir', () => {
      const eksik = ESP.DISCIPLINES.filter(d => !ESP.DRILLS_OF(d.id).length);
      expect(eksik.map(d => d.id).join(',')).toBe('');
    });

    it('her egzersizin hedefi bir gercek olcudur', () => {
      const bilinen = ESP.Curriculum.metricNames();
      const kotu = [];
      ESP.DRILLS.forEach(d => {
        (d.targets || []).forEach(t => {
          if(bilinen.indexOf(t) < 0) kotu.push(d.id + ':' + t);
        });
      });
      expect(kotu.join(',')).toBe('');
    });

    it('sure kapisini her egzersiz ilerletir, icerik kapisini herkes degil', () => {
      const d = ESP.DRILL_BY_ID['hist-kaynak'];
      expect(ESP.Coach.advances(d, 'history.minutes30')).toBeTruthy();
      expect(ESP.Coach.advances(d, 'lang.minutes30')).toBeFalsy();
      expect(ESP.Coach.advances(d, 'history.sources')).toBeTruthy();
      expect(ESP.Coach.advances(d, 'history.schools')).toBeFalsy();
    });

    it('hedefi olmayan egzersiz yoktur', () => {
      const bos = ESP.DRILLS.filter(d => !(d.targets || []).length);
      expect(bos.map(d => d.id).join(',')).toBe('');
    });

    it('her egzersizin suresi ve kademesi vardir', () => {
      const kotu = ESP.DRILLS.filter(d =>
        !(d.minutes > 0) || !(d.level >= 1 && d.level <= 5));
      expect(kotu.map(d => d.id).join(',')).toBe('');
    });

    it('her egzersiz kendi disiplininin egzersizidir', () => {
      const idler = ESP.DISCIPLINES.map(d => d.id);
      const kotu = ESP.DRILLS.filter(d => idler.indexOf(d.disc) < 0);
      expect(kotu.map(d => d.id).join(',')).toBe('');
    });
  });

  describe('koç · reçete', () => {

    it('kademe sifir olsa da recete yazilir', () => {
      resetState();
      const r = Co().prescribe('lang');
      expect(r.rank).toBe(1);
      expect(r.items.length > 0).toBeTruthy();
    });

    it('recete gunluk tabandan tasmaz', () => {
      resetState();
      ESP.S.profile.dailyMinutes = 20;
      const r = Co().prescribe('lang');
      expect(r.minutes <= 20 || r.items.length === 1).toBeTruthy();
    });

    it('zorlanma egzersizi yalniz BIR ust kademeden gelir', () => {
      resetState();
      const r = Co().prescribe('music');
      const stretch = r.items.filter(x => x.kind === 'stretch');
      stretch.forEach(x => expect(x.drill.level).toBe(r.rank + 1));
    });

    it('isinma ve asil is kullanicinin kademesinden yukari cikmaz', () => {
      resetState();
      const r = Co().prescribe('reading');
      r.items.filter(x => x.kind !== 'stretch')
        .forEach(x => expect(x.drill.level <= r.rank).toBeTruthy());
    });

    /* Sure kapilarini («30 gunde 180 dakika») her egzersiz ilerletir; bunu
       katalogda tek tek etiketlemek hedef alanini anlamsizlastirirdi.
       Motorun kendi olcutuyle sinariz. */
    it('asil is acik olan kapiyi ilerletir', () => {
      resetState();
      const r = Co().prescribe('history');
      const kapi = r.metric;
      const core = r.items.filter(x => x.kind === 'core');
      expect(core.length > 0).toBeTruthy();
      expect(core.some(x => Co().advances(x.drill, kapi))).toBeTruthy();
    });

    it('ayni gun iki kez cizilince recete degismez', () => {
      resetState();
      withToday('2026-09-12', () => {
        const a = Co().prescribe('lang').items.map(x => x.drill.id).join(',');
        const b = Co().prescribe('lang').items.map(x => x.drill.id).join(',');
        expect(a).toBe(b);
      });
    });

    it('ayni egzersiz recetede iki kez gecmez', () => {
      resetState();
      ESP.DISCIPLINES.forEach(d => {
        const ids = Co().prescribe(d.id).items.map(x => x.drill.id);
        expect(ids.length).toBe(ids.filter((x, i) => ids.indexOf(x) === i).length);
      });
    });
  });

  describe('koç · isleme', () => {

    it('islenen egzersiz gun kaydina OTURUM olarak yazilir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const res = await Co().logDrill('lang-10kart');
        expect(res.ok).toBeTruthy();
        expect(ESP.Model.minutesOf('2026-09-12', 'lang')).toBe(10);
      });
    });

    it('bilinmeyen egzersiz islenmez', async () => {
      resetState();
      const res = await Co().logDrill('yok-boyle');
      expect(res.ok).toBeFalsy();
    });

    it('islenen egzersiz recetede isaretli gorunur', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await Co().logDrill('hist-serit');
        expect(Co().doneToday('history').indexOf('hist-serit') >= 0).toBeTruthy();
      });
    });

    it('egzersiz gecmisi olculmus dakikadan gelir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await Co().logDrill('read-atomik', { minutes:25 });
        const h = Co().historyOf('read-atomik');
        expect(h.times).toBe(1);
        expect(h.minutes).toBe(25);
        expect(h.cert).toBe('measured');
      });
    });

    it('hic yapilmamis egzersizin gecmisi sifir degil «veri yok»tur', () => {
      resetState();
      expect(Co().historyOf('read-atomik').cert).toBe('missing');
    });
  });

  describe('koç · günün planı', () => {

    it('plan en fazla iki disiplin tasir', () => {
      resetState();
      withToday('2026-09-12', () => {
        expect(ESP.Coach.plan().prescriptions.length <= 2).toBeTruthy();
      });
    });

    it('plandaki her disipline en az on dakika kalir', () => {
      resetState();
      ESP.S.profile.dailyMinutes = 10;
      withToday('2026-09-12', () => {
        ESP.Coach.plan().prescriptions.forEach(r => expect(r.budget >= 10).toBeTruthy());
      });
    });

    it('asgari gun kotu gunun alt siniridir ve recete degildir', () => {
      resetState();
      withToday('2026-09-12', () => {
        const m = ESP.Coach.minimumDay();
        expect(m.metToday).toBeFalsy();
        pushSession('2026-09-12', 'lang', 5);
        expect(ESP.Coach.minimumDay().metToday).toBeTruthy();
      });
    });
  });

  const { withTodayAsync } = ESP.Test;
})();
