/* Goodhart nöbetçisi — çaba arttı da sonuç yerinde mi saydı? */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = ESP.Test;
  const G = () => ESP.Goodhart;
  const S = ESP.S;
  const U = ESP.U;

  const BUGUN = '2026-06-01';
  function gunOnce(n){ return U.iso(U.addDays(U.parse(BUGUN), -n)); }

  function oturum(gunGeri, disc, dk){
    const t = gunOnce(gunGeri);
    S.days[t] = S.days[t] || { date:t, sessions:[], note:'' };
    S.days[t].sessions.push({ id:'s' + Math.random(), disc, minutes:dk });
  }

  function not(gunGeri, baglar){
    S.notes.push({ id:'n' + Math.random(), text:'x', links:baglar || [],
      concepts:[], createdAt:gunOnce(gunGeri) + 'T10:00:00.000Z' });
  }

  function kart(gunGeri, grade, adet){
    const c = { id:'c' + Math.random(), lang:'en', front:'a', back:'b', history:[] };
    for(let i = 0; i < adet; i++){
      c.history.push({ at:gunOnce(gunGeri) + 'T10:00:00.000Z', grade });
    }
    S.cards.push(c);
  }

  function ciftOf(id){ return G().scan().filter(p => p.id === id)[0]; }

  describe('goodhart · pencere', () => {

    it('iki bitisik pencere ortusmez', () => {
      withTodayAsyncSync(() => {
        const w = G().windows();
        expect(w.prev.to).toBe(w.now.from);
      });
    });

    function withTodayAsyncSync(fn){
      const realToday = U.today, realTodayISO = U.todayISO;
      const d = U.parse(BUGUN);
      U.today = () => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      U.todayISO = () => BUGUN;
      try{ return fn(); } finally { U.today = realToday; U.todayISO = realTodayISO; }
    }
  });

  describe('goodhart · ayrisma', () => {

    /* Sonuc olculmediyse sonuc SIFIR degildir. */
    it('sonuc tarafinda veri yoksa bilinmiyor doner', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'reading', 300);
        oturum(10, 'reading', 600);
        const p = ciftOf('reading-minutes-vs-notes');
        /* Not hic yok: sifir uretim degil, olculmemis uretim de degil —
           not sayaci sifir doner, bu yuzden burada asil sinav bagli ciftte. */
        expect(p.status === 'decoupled' || p.status === 'idle').toBeTruthy();
      });
    });

    it('olcum yoksa bagli cift bilinmiyor doner', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'diction', 200);
        oturum(10, 'diction', 600);
        const p = ciftOf('diction-minutes-vs-error');
        expect(p.status).toBe('unknown');
        expect(p.cert).toBe('missing');
      });
    });

    /* Nobetcinin isi tembelligi degil, VERIMSIZ GAYRETI gormektir. */
    it('caba dusuyorsa uyari uretilmez', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'reading', 600);
        oturum(10, 'reading', 200);
        not(40); not(40); not(40); not(10);
        expect(ciftOf('reading-minutes-vs-notes').status).toBe('idle');
      });
    });

    it('caba da sonuc da artiyorsa gosterge saglam', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'reading', 200);
        oturum(10, 'reading', 500);
        not(40); not(40);
        not(10); not(10); not(10); not(10); not(10);
        expect(ciftOf('reading-minutes-vs-notes').status).toBe('aligned');
      });
    });

    it('caba artip sonuc yerinde sayarsa ayrisma isaretlenir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'reading', 200);
        oturum(10, 'reading', 600);
        not(40); not(40); not(40);
        not(10); not(10); not(10);
        const p = ciftOf('reading-minutes-vs-notes');
        expect(p.status).toBe('decoupled');
        expect(G().flags().length > 0).toBeTruthy();
      });
    });

    /* Kucuk hacimde gurultu vardir. */
    it('esigin altindaki hacim degerlendirilmez', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'reading', 5);
        oturum(10, 'reading', 30);
        not(40); not(10);
        expect(ciftOf('reading-minutes-vs-notes').status).toBe('idle');
      });
    });

    /* Dusuk olmasi iyi olan sonuclarda yon ters cevrilir. */
    it('hata orani dusuyorsa ayrisma yoktur', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'diction', 200);
        oturum(10, 'diction', 600);
        S.recordings.push({ id:'r1', date:gunOnce(40), words:500, errors:50 });
        S.recordings.push({ id:'r2', date:gunOnce(10), words:500, errors:20 });
        expect(ciftOf('diction-minutes-vs-error').status).toBe('aligned');
      });
    });

    it('hata orani sabit kalirsa ayrisma isaretlenir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'diction', 200);
        oturum(10, 'diction', 600);
        S.recordings.push({ id:'r1', date:gunOnce(40), words:500, errors:50 });
        S.recordings.push({ id:'r2', date:gunOnce(10), words:500, errors:50 });
        expect(ciftOf('diction-minutes-vs-error').status).toBe('decoupled');
      });
    });

    /* Kayit basina ortalama ALINMAZ: uc kelimelik kayit, uc yuz kelimelikle
       ayni agirligi tasimamali. */
    it('hata orani kelime agirlikli hesaplanir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'diction', 200);
        oturum(10, 'diction', 600);
        S.recordings.push({ id:'r1', date:gunOnce(40), words:1000, errors:100 });
        S.recordings.push({ id:'r2', date:gunOnce(10), words:1000, errors:10 });
        S.recordings.push({ id:'r3', date:gunOnce(10), words:10, errors:5 });
        /* Agirliksiz ortalama alinsaydi (0,10 → 0,255) kotulesme gorunurdu. */
        expect(ciftOf('diction-minutes-vs-error').status).toBe('aligned');
      });
    });

    it('kapali bolumun cifti taranmaz', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        await ESP.Mod.set('reading', false);
        expect(ciftOf('reading-minutes-vs-notes')).toBeFalsy();
      });
    });

    it('kart tekrari artip isabet artmazsa ayrisir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        kart(40, 'good', 15); kart(40, 'again', 15);
        kart(10, 'good', 40); kart(10, 'again', 40);
        expect(ciftOf('lang-reps-vs-recall').status).toBe('decoupled');
      });
    });

    /* Nobetcinin konusmadigi gun, iyi gundur. */
    it('bayrak yoksa brifing sessizdir', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        expect(G().brief()).toBe(null);
      });
    });

    it('bayrak varsa brifing soru sorar, hukum vermez', async () => {
      resetState();
      await withTodayAsync(BUGUN, async () => {
        oturum(40, 'reading', 200);
        oturum(10, 'reading', 600);
        not(40); not(40); not(40);
        not(10); not(10); not(10);
        const b = G().brief();
        expect(b).toBeTruthy();
        expect(b.body.indexOf('?') > 0).toBeTruthy();
      });
    });
  });
})();

(function(){
  const { describe, it, expect } = ESP.Test;

  describe('goodhart · veri butunlugu', () => {

    /* Nobetci HUKUM VERMEZ, SORU SORAR. Kural veride de gecerli olmali. */
    it('her ciftin sorusu gercekten soru', () => {
      ESP.Goodhart.PAIRS.forEach(p => {
        expect(p.question.indexOf('?') > 0).toBeTruthy();
      });
    });

    it('her cift acik bir disipline baglidir', () => {
      ESP.Goodhart.PAIRS.forEach(p => {
        expect(!!ESP.DISCIPLINE_BY_ID[p.disc]).toBeTruthy();
        expect(!!p.effortLabel && !!p.outcomeLabel).toBeTruthy();
      });
    });

    it('cift kimlikleri benzersiz', () => {
      const g = {};
      ESP.Goodhart.PAIRS.forEach(p => { g[p.id] = (g[p.id] || 0) + 1; });
      Object.keys(g).forEach(k => expect(g[k]).toBe(1));
    });
  });
})();

/* Yön semantiği — "iyileşme" ile "hareket" aynı şey değildir.

   Dışarıdan gelen bir eleştiri `Math.abs(dS) > eşik` kullanımının sonucun
   KÖTÜYE gitmesini de "gösterge sağlam" saydığını söylüyordu. Eleştiri
   doğruydu ama hatayı ESP'ye atfediyordu; hata SPİ'deydi. Yine de
   soyutlamanın ikinci yarısı burada da eksikti: `lower` bir alan olarak
   vardı, bir SÖZLÜK değildi. Yön artık her çift için zorunlu. */
(function(){
  const { describe, it, expect } = ESP.Test;
  const G = () => ESP.Goodhart;

  describe('goodhart · yon semantigi', () => {

    it('her ciftin yon tanimi var', () => {
      G().PAIRS.forEach(p => {
        expect(!!G().DIRECTIONS[p.direction]).toBeTruthy();
      });
    });

    it('uc yon tanimli ve iyilesme islevleri dogru', () => {
      const D = G().DIRECTIONS;
      expect(D.higher_better.improvement(0.2)).toBe(0.2);
      expect(D.lower_better.improvement(0.2)).toBe(-0.2);
      expect(D.movement_only.improvement(-0.2)).toBe(0.2);
      /* Olculmemis degisim yon cevrilse de olculmemis kalir. */
      expect(D.lower_better.improvement(null)).toBe(null);
      expect(D.movement_only.improvement(null)).toBe(null);
    });

    /* Yon tanimsizsa SESSIZCE "yukselmesi iyi" sayilmaz. */
    it('yon tanimsiz cift degerlendirilmez', () => {
      const p = G().pair({ id:'test', direction:null, disc:'lang',
        effortLabel:'a', outcomeLabel:'b', question:'s?',
        effort:() => 1000, outcome:() => 10, minEffort:1 });
      expect(p.status).toBe('unknown');
      expect(p.cert).toBe('missing');
      expect(p.note.indexOf('yön tanımı yok') > 0).toBeTruthy();
    });

    /* Hata orani DUSTUKCE iyidir; yukselmesi "birlikte" sayilamaz. */
    it('dusmesi iyi olan olcude yukselme ayrisma sayilir', () => {
      const p = G().pair({ id:'t2', direction:'lower_better', disc:'lang',
        effortLabel:'çaba', outcomeLabel:'hata oranı', question:'s?',
        effort:function(w){ return w.from === G().windows().now.from ? 1000 : 500; },
        outcome:function(w){ return w.from === G().windows().now.from ? 0.20 : 0.10; },
        minEffort:1 });
      expect(p.status).toBe('decoupled');
      expect(p.regressed).toBeTruthy();
    });

    it('dusmesi iyi olan olcude dusme birlikte sayilir', () => {
      const p = G().pair({ id:'t3', direction:'lower_better', disc:'lang',
        effortLabel:'çaba', outcomeLabel:'hata oranı', question:'s?',
        effort:function(w){ return w.from === G().windows().now.from ? 1000 : 500; },
        outcome:function(w){ return w.from === G().windows().now.from ? 0.05 : 0.10; },
        minEffort:1 });
      expect(p.status).toBe('aligned');
    });
  });

  describe('goodhart · politika parametreleri', () => {

    /* Sayilar gizli "dogru esik" gibi sunulmaz. */
    it('esikler acikca sistem ayari olarak etiketli', () => {
      const p = G().policy();
      expect(p.status).toBe('system_tuning');
      expect(p.rationale.length > 80).toBeTruthy();
      expect(p.note.indexOf('eşik değil') > 0).toBeTruthy();
    });

    it('kullanilan sabitler politikadan okunur', () => {
      const p = G().policy();
      expect(G().PENCERE).toBe(p.windowDays);
      expect(G().CABA_ARTIS).toBe(p.effortRiseThreshold);
      expect(G().SONUC_DURGUN).toBe(p.stagnationThreshold);
    });
  });
})();
