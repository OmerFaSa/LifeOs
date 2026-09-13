/* Sinyal katmanı — mekanizma ile ekran ayrı şeylerdir. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = ESP.Test;
  const Sg = () => ESP.Signals;
  const S = ESP.S, U = ESP.U;

  const BUGUN = '2026-06-01';
  function once(n){ return U.iso(U.addDays(U.parse(BUGUN), -n)); }

  function oturum(gunGeri, disc, dk){
    const t = once(gunGeri);
    S.days[t] = S.days[t] || { date:t, sessions:[], note:'' };
    S.days[t].sessions.push({ id:'s' + Math.random(), disc, minutes:dk });
  }
  function not(gunGeri){
    S.notes.push({ id:'n' + Math.random(), text:'x', links:[], concepts:[],
      createdAt:once(gunGeri) + 'T10:00:00.000Z' });
  }

  /* Okuma dakikası artar, not çıkmaz → ayrışma. */
  function ayrismaKur(){
    oturum(40, 'reading', 200);
    oturum(10, 'reading', 600);
    not(40); not(40); not(40);
    not(10); not(10); not(10);
  }
  /* Çaba da sonuç da artar → ayrışma yok. */
  function ayrismaKapat(){
    S.days = {}; S.notes = [];
    oturum(40, 'reading', 200);
    oturum(10, 'reading', 500);
    not(40); not(40);
    not(10); not(10); not(10); not(10); not(10);
  }

  describe('sinyal · uretim', () => {

    it('ayrisma yoksa sinyal acilmaz', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        const r = await Sg().sync();
        expect(r.opened).toBe(null);
        expect(Sg().current()).toBe(null);
      });
    });

    it('ayrisma varsa tek soru acilir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        ayrismaKur();
        const r = await Sg().sync();
        expect(!!r.opened).toBeTruthy();
        expect(Sg().current().kind).toBe('goodhart');
        /* Sinyal bir SORUDUR, bir rapor degil. */
        expect(Sg().current().question.indexOf('?') > 0).toBeTruthy();
      });
    });

    /* Butun dosyanin en onemli kurali: uc soruyu ayni anda sormak, uc
       ekran acmakla ayni sey. */
    it('acik sinyal varken yenisi acilmaz', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        ayrismaKur();
        /* Ikinci bir ayrisma daha kur: kart tekrari artiyor, isabet artmiyor. */
        const kart = (g, grade, adet) => {
          const c = { id:'c' + Math.random(), lang:'en', front:'a', back:'b', history:[] };
          for(let i = 0; i < adet; i++) c.history.push({ at:once(g) + 'T10:00:00.000Z', grade });
          S.cards.push(c);
        };
        kart(40, 'good', 15); kart(40, 'again', 15);
        kart(10, 'good', 40); kart(10, 'again', 40);

        expect(ESP.Goodhart.flags().length >= 2).toBeTruthy();
        await Sg().sync();
        await Sg().sync();
        await Sg().sync();
        expect(Sg().open().length).toBe(1);
      });
    });

    /* Surtunme sinyali ancak nobetci sessizken siraya gelir. */
    it('surtunme sinyali yuksek surtunmede acilir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        S.usage = { days:{}, lastTick:null };
        for(let i = 0; i < 14; i++){
          const t = once(i);
          S.usage.days[t] = { date:t, adminMs:30 * 60000, ticks:60 };
          S.days[t] = { date:t, sessions:[{ id:'s' + i, disc:'lang', minutes:10 }], note:'' };
        }
        const r = await Sg().sync();
        expect(!!r.opened).toBeTruthy();
        expect(r.opened.kind).toBe('friction');
      });
    });
  });

  describe('sinyal · hayat dongusu', () => {

    it('gosterim farkindaligi damgalar ve bir kez yazilir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        ayrismaKur();
        const r = await Sg().sync();
        expect(r.opened.seenAt).toBe(null);
        expect((await Sg().markSeen(r.opened.id)).ok).toBeTruthy();
        expect((await Sg().markSeen(r.opened.id)).ok).toBeFalsy();
        expect(!!Sg().current().seenAt).toBeTruthy();
      });
    });

    /* Cevap sinyali KAPATMAZ: ayrismanin gercekten kapanip kapanmadigi
       bir sonraki pencerede olculecek. */
    it('cevap sinyali kapatmaz', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        ayrismaKur();
        const r = await Sg().sync();
        await Sg().answer(r.opened.id, 'Pasif okumaya kaymisim.');
        expect(Sg().current().status).toBe('open');
        expect(!!Sg().current().answeredAt).toBeTruthy();
      });
    });

    /* Sistemin her sorusunun hakli olmasi gerekmez. */
    it('kullanici soruyu gecersiz bulabilir ve bu kaydedilir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        ayrismaKur();
        const r = await Sg().sync();
        await Sg().dismiss(r.opened.id, 'Bilerek yeniden okuyordum.');
        expect(Sg().current()).toBe(null);
        expect(Sg().closed()[0].outcome).toBe('dismissed');
      });
    });

    it('ayrisma kapaninca sinyal sonucla birlikte kapanir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        ayrismaKur();
        const r = await Sg().sync();
        await Sg().answer(r.opened.id, 'Not almaya donuyorum.');
        ayrismaKapat();
        await Sg().sync();
        const k = Sg().closed()[0];
        expect(k.status).toBe('resolved');
        expect(k.outcome).toBe('realigned');
      });
    });

    it('omru dolan cevapsiz sinyal kendiliginden kapanir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        ayrismaKur();
        const r = await Sg().sync();
        r.opened.openedAt = once(30) + 'T10:00:00.000Z';
      });
      /* Ayni ayrisma surerken 30 gun sonra bakilir. */
      await withTodayAsync(BUGUN, async () => {
        await Sg().sync();
        const k = Sg().closed()[0];
        expect(k.status).toBe('expired');
        expect(k.outcome).toBe('still-decoupled');
      });
    });

    /* Ayni soruyu her hafta sormak, soru sormak degil dirtmektir. */
    it('kapanan sinyal soguma suresince yeniden acilmaz', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        ayrismaKur();
        const r = await Sg().sync();
        await Sg().dismiss(r.opened.id);
        const r2 = await Sg().sync();
        expect(r2.opened).toBe(null);
      });
    });
  });

  describe('sinyal · fayda olcusu', () => {

    function kapaliSinyal(cevapli, sonuc){
      S.signals.push(ESP.Signals.norm({
        kind:'goodhart', ref:'x' + Math.random(), title:'t', question:'s?',
        status:cevapli ? 'resolved' : 'expired',
        answeredAt:cevapli ? '2026-05-01T10:00:00.000Z' : null,
        seenAt:'2026-05-01T09:00:00.000Z',
        closedAt:'2026-05-20T10:00:00.000Z', outcome:sonuc }));
    }

    /* "Kac anomali yakaladi" bir fayda olcusu DEGILDIR. */
    it('az kayitta fayda olculmez', () => {
      resetState();
      kapaliSinyal(true, 'realigned');
      const e = Sg().efficacy();
      expect(e.cert).toBe('missing');
      expect(e.note.indexOf('ölçülmedi') > 0).toBeTruthy();
    });

    it('cevaplanan ve cevaplanmayan ayri sayilir', () => {
      resetState();
      kapaliSinyal(true, 'realigned');
      kapaliSinyal(true, 'realigned');
      kapaliSinyal(true, 'still-decoupled');
      kapaliSinyal(false, 'still-decoupled');
      kapaliSinyal(false, 'still-decoupled');
      const e = Sg().efficacy();
      expect(e.cert).toBe('observed');
      expect(e.answeredRate).toBe(67);
      expect(e.unansweredRate).toBe(0);
    });

    /* Nedensellik IDDIA EDILMEZ. */
    it('fayda notu nedensellik iddia etmez', () => {
      resetState();
      for(let i = 0; i < 3; i++) kapaliSinyal(true, 'realigned');
      for(let i = 0; i < 3; i++) kapaliSinyal(false, 'still-decoupled');
      const e = Sg().efficacy();
      expect(e.note.indexOf('NEDENSELLİK') > 0).toBeTruthy();
      expect(/sayesinde|nedeniyle/.test(e.note)).toBeFalsy();
    });

    /* Gorulmeyen bir denetim, denetim degildir — ve sistem bunu KENDISI
       soylemek zorunda. */
    it('hic gorulmeyen sinyal sayfayi savunmasiz birakir', () => {
      resetState();
      for(let i = 0; i < 4; i++){
        S.signals.push(ESP.Signals.norm({ kind:'goodhart', ref:'r' + i,
          title:'t', question:'s?', status:'expired', closedAt:'2026-05-20T10:00:00.000Z' }));
      }
      expect(Sg().screenVerdict().level).toBe('unused');
    });

    it('gorulup hic cevaplanmayan sinyal de isaretlenir', () => {
      resetState();
      for(let i = 0; i < 4; i++){
        S.signals.push(ESP.Signals.norm({ kind:'goodhart', ref:'r' + i,
          title:'t', question:'s?', status:'expired',
          seenAt:'2026-05-01T09:00:00.000Z', closedAt:'2026-05-20T10:00:00.000Z' }));
      }
      expect(Sg().screenVerdict().level).toBe('ignored');
    });
  });
})();
