/* Bölüm açma–kapama. En önemli iki kural: kapatmak SİLMEZ ve son bölüm
   kapatılamaz. */

(function(){
  const { describe, it, expect, resetState, withToday,
    pushCard, pushSession, pushEvent } = ESP.Test;
  const Mod = () => ESP.Mod;

  async function kapat(id){ return Mod().set(id, false); }

  describe('bolum · varsayilan', () => {

    it('hicbir tercih yokken hepsi aciktir', () => {
      resetState();
      expect(Mod().count()).toBe(ESP.DISCIPLINES.length);
      ESP.DISCIPLINES.forEach(d => expect(Mod().isOn(d.id)).toBeTruthy());
    });

    it('bozuk kayit arayuzu kullanilamaz yapmaz', () => {
      resetState();
      ESP.S.prefs.modules = { lang:false, philo:false, music:false, diction:false,
        reading:false, writing:false, history:false };
      /* Hicbiri acik degilse liste yok sayilir: kullanilamaz bir arayuz
         cizmektense tercihi yok saymak yegdir. */
      expect(Mod().active().length).toBe(ESP.DISCIPLINES.length);
    });
  });

  describe('bolum · kapatma', () => {

    it('kapatilan bolum listeden duser', async () => {
      resetState();
      await kapat('music');
      expect(Mod().isOn('music')).toBeFalsy();
      expect(Mod().activeIds().indexOf('music')).toBe(-1);
    });

    it('kapatmak VERIYI SILMEZ', async () => {
      resetState();
      pushCard({ front:'a', back:'b' });
      pushEvent(1071, 'Malazgirt');
      await kapat('lang');
      await kapat('history');
      expect(ESP.S.cards.length).toBe(1);
      expect(ESP.S.events.length).toBe(1);
      /* Kademe de durur: geri acan kullanici kaldigi yerde bulur. */
      expect(ESP.Curriculum.levelOf('lang') != null).toBeTruthy();
    });

    it('son acik bolum kapatilamaz', async () => {
      resetState();
      const hepsi = ESP.DISCIPLINES.map(d => d.id);
      for(let i = 0; i < hepsi.length - 1; i++) await kapat(hepsi[i]);
      const res = await kapat(hepsi[hepsi.length - 1]);
      expect(res.ok).toBeFalsy();
      expect(Mod().count()).toBe(1);
    });

    it('bilinmeyen bolum kapatilamaz', async () => {
      resetState();
      expect((await Mod().set('yok', false)).ok).toBeFalsy();
    });

    it('toplu secim bos olamaz', async () => {
      resetState();
      expect((await Mod().setAll([])).ok).toBeFalsy();
    });
  });

  describe('bolum · hesaplara etkisi', () => {

    it('kapali disiplin denge hesabina girmez', async () => {
      resetState();
      await kapat('music');
      const rows = ESP.Planner.balance(7).rows.map(r => r.disc.id);
      expect(rows.indexOf('music')).toBe(-1);
    });

    it('kapali disiplin «hic dokunulmamis» diye raporlanmaz', async () => {
      resetState();
      await kapat('diction');
      const d = ESP.Planner.balance(7);
      expect(d.untouched.map(x => x.id).indexOf('diction')).toBe(-1);
    });

    it('kapali disiplin siradaki is olarak cikmaz', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const hepsi = ESP.DISCIPLINES.map(d => d.id).filter(id => id !== 'writing');
        for(const id of hepsi) await kapat(id);
        const n = ESP.Planner.nextAction();
        expect(n.disc === null || n.disc === 'writing').toBeTruthy();
      });
    });

    it('kapali destenin vadesi gecmis karti one cikmaz', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        pushCard({ front:'a', back:'b', lang:'en', due:'2026-09-01', reps:2, interval:3 });
        await kapat('lang');
        const n = ESP.Planner.nextAction();
        expect(n.id.indexOf('srs') === 0).toBeFalsy();
      });
    });

    it('kapali disiplin merdiven ortalamasina girmez', async () => {
      resetState();
      await kapat('music');
      const idler = ESP.Curriculum.all().map(x => x.disc);
      expect(idler.indexOf('music')).toBe(-1);
    });

    it('recete yalniz acik disiplinlere yazilir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        for(const id of ['music', 'diction', 'reading', 'writing', 'history', 'philo']){
          await kapat(id);
        }
        const p = ESP.Coach.plan();
        p.prescriptions.forEach(r => expect(r.disc).toBe('lang'));
      });
    });

    it('kapali disiplinin ajani toplantiya cagrilmaz', async () => {
      resetState();
      await kapat('music');
      const idler = ESP.Mod.activeAgents().map(a => a.id);
      expect(idler.indexOf('maestro')).toBe(-1);
      /* Patron ve koc her zaman acik: ikisi de bir disiplinin degil bir ISIN
         sahibi. */
      expect(idler.indexOf('patron') >= 0).toBeTruthy();
      expect(idler.indexOf('mnemosyne') >= 0).toBeTruthy();
    });

    it('stüdyo masasi iki disiplinden biri acikken acik kalir', async () => {
      resetState();
      await kapat('music');
      expect(ESP.Mod.agentOn('demosthenes')).toBeTruthy();
      await kapat('diction');
      expect(ESP.Mod.agentOn('demosthenes')).toBeFalsy();
    });

    it('kapali masanin bulgusu ofiste gorunmez', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        ESP.Memo.bitir();
        const once = ESP.Office.notes().filter(n => n.agent === 'demosthenes').length;
        expect(once > 0).toBeTruthy();      // "son 30 gunde kayit yok" notu
        await kapat('diction');
        ESP.Memo.bitir();
        expect(ESP.Office.notes().filter(n => n.agent === 'demosthenes').length).toBe(0);
      });
    });
  });

  describe('bolum · gezinme', () => {

    it('serit numaralari bosluk birakmaz', async () => {
      resetState();
      await kapat('music');
      await kapat('diction');
      const nums = ESP.Nav.sections().map(s => s.num);
      const beklenen = nums.map((x, i) => (i + 1 < 10 ? '0' : '') + (i + 1));
      expect(nums.join(',')).toBe(beklenen.join(','));
    });

    it('tarih kendi bolumudur', () => {
      resetState();
      const sec = ESP.Nav.sections().filter(s => s.id === 'tarih')[0];
      expect(sec != null).toBeTruthy();
      expect(sec.views[0].route).toBe('history');
    });

    it('kapali bolumun ekrani yonlendirmeden kalkar', async () => {
      resetState();
      await kapat('history');
      expect(ESP.Nav.routeOn('history')).toBeFalsy();
      expect(ESP.Nav.sections().some(s => s.id === 'tarih')).toBeFalsy();
    });

    it('gunluk, ofis ve ayarlar hicbir zaman kapanmaz', async () => {
      resetState();
      const hepsi = ESP.DISCIPLINES.map(d => d.id);
      for(let i = 0; i < hepsi.length - 1; i++) await kapat(hepsi[i]);
      const idler = ESP.Nav.sections().map(s => s.id);
      ['gunluk', 'ofis', 'ayarlar'].forEach(id => expect(idler.indexOf(id) >= 0).toBeTruthy());
    });
  });

  const { withTodayAsync } = ESP.Test;
})();
