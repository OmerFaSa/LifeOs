/* Planlayici — oncelik sirasi ve capraz bulgular.

   Bu paketin tek isi sudur: SIRA TARTISILMAZ. Ustteki kural alttakini her
   zaman yener ve bunu testler kilitler — bozmak isteyen once testi silmek
   zorunda kalir. */

(function(){
  const { describe, it, expect, resetState, withToday,
    pushSession, pushCard, pushPiece, pushNote, pushBook } = ESP.Test;
  const P = ESP.Planner, M = ESP.Model, S = ESP.S;

  describe('oncelik sirasi', () => {

    it('tikanmis temel her seyin onunde gelir', () => {
      withToday('2026-09-12', () => {
        resetState();
        /* Retansiyonu tabana dusur: eski vadeli, cok unutulmus kartlar.
           Bes tane cunku taban ancak yeteri kadar olcumle karar verir. */
        for(let i = 0; i < 6; i++){
          pushCard({ front:'k' + i, reps:4, lapses:3, box:1, interval:1, ease:1.4,
            due:'2026-08-01' });
        }
        const n = P.nextAction('2026-09-12');
        expect(n.rank).toBe(1);
      });
    });

    it('tek gecikmis kart temeli TIKANMIS ilan etmez', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushCard({ front:'a', reps:4, lapses:3, box:1, interval:1, ease:1.4,
          due:'2026-08-01' });
        /* Soylenebilecek tek sey "bir kart gecikti"dir; sira 3 devreye girer. */
        expect(P.nextAction('2026-09-12').rank).toBe(3);
      });
    });

    it('tikanma yoksa zamana bagli hedef one gecer', async () => {
      await ESP.Test.withTodayAsync('2026-09-12', async () => {
        resetState();
        await M.saveGoal(M.newGoal({ label:'Sunum', disc:'diction', date:'2026-09-18' }));
        const n = P.nextAction('2026-09-12');
        expect(n.rank).toBe(2);
      });
    });

    it('hedef yoksa vadesi gecmis kart one gecer', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushCard({ front:'a', due:'2026-09-05', reps:2, box:3, interval:3, ease:2.5 });
        const n = P.nextAction('2026-09-12');
        expect(n.rank).toBe(3);
      });
    });

    it('kart yoksa sentopik sentez one gecer', () => {
      withToday('2026-09-12', () => {
        resetState();
        const b1 = pushBook('Devlet', 'Platon');
        const b2 = pushBook('Etika', 'Spinoza');
        pushNote('A', b1.id, ['ozgurluk']);
        pushNote('B', b2.id, ['ozgurluk']);
        const n = P.nextAction('2026-09-12');
        expect(n.rank).toBe(4);
      });
    });

    it('hicbiri yoksa yeni icerik onerilir ve GEREKCESI yazilir', () => {
      withToday('2026-09-12', () => {
        resetState();
        const n = P.nextAction('2026-09-12');
        expect(n.rank).toBe(5);
        expect(!!n.why).toBe(true);
      });
    });

    it('siradaki is DAIMA bir gerekce tasir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushCard({ front:'a', due:'2026-09-01', reps:1, box:2, interval:1, ease:2.5 });
        const n = P.nextAction('2026-09-12');
        expect(typeof n.why).toBe('string');
        expect(n.why.length > 10).toBe(true);
      });
    });

    it('sira sabiti bes kuraldir ve rank\'leri 1..5 gider', () => {
      const r = ESP.PRECEDENCE.map(x => x.rank);
      expect(r).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('denge', () => {

    it('hic kayit yoksa denge «veri yok» doner', () => {
      withToday('2026-09-12', () => {
        resetState();
        expect(P.balance(7, '2026-09-12').cert).toBe('missing');
      });
    });

    it('tek disiplin yiginsa ve baskasi hic acilmamissa DENGESIZ sayilir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'music', 300);
        pushSession('2026-09-11', 'lang', 20);
        expect(P.balance(7, '2026-09-12').skewed).toBe(true);
      });
    });

    it('dokunulmamis disiplin yoksa dengesizlik bulgusu URETILMEZ', () => {
      withToday('2026-09-12', () => {
        resetState();
        ESP.DISCIPLINES.forEach(d => pushSession('2026-09-12', d.id, 30));
        expect(P.balance(7, '2026-09-12').skewed).toBe(false);
      });
    });

    it('dokunulmamis disiplin rotada ONE alinir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'music', 120);
        const r = P.weeklyRoute('2026-09-12');
        expect(r.rows[0].disc.id === 'music').toBe(false);
      });
    });
  });

  describe('capraz bulgular', () => {

    it('bulgu «birlikte hareket ediyor» dilindedir, «sebep oldu» demez', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'lang', 60);
        const c = P.crossFindings('2026-09-12');
        c.forEach(x => {
          expect(/sebep oldu|neden oldu|yol açtı/i.test(x.text)).toBe(false);
        });
      });
    });

    it('dil calisiliyor ama okuma hic yoksa devir cikar', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'lang', 60);
        const c = P.crossFindings('2026-09-12');
        expect(c.some(x => x.id === 'lang-no-reading')).toBe(true);
      });
    });

    it('iki masa da bossa devir URETILMEZ', () => {
      withToday('2026-09-12', () => {
        resetState();
        expect(P.crossFindings('2026-09-12').length).toBe(0);
      });
    });

    it('her devir iki AYRI masaya aittir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'lang', 60);
        pushSession('2026-09-12', 'music', 60);
        P.crossFindings('2026-09-12').forEach(c => {
          expect(c.from === c.to).toBe(false);
        });
      });
    });
  });
})();
