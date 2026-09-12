/* Siradaki hamle motoru, davranis serisi ve bilgi katmani. */

(function(){
  const { describe, it, expect, resetState, withToday, makeExam } = R.Test;
  const U = R.U, M = R.Model, C = R.Calc, S = R.S;

  function seedToday(iso, blocks, extra){
    S.days[iso] = Object.assign({
      date:iso, dow:U.weekdayIndex(iso), ritual:R.WEEKDAYS[U.weekdayIndex(iso)].ritual || null,
      paragraphTarget:18, paragraphActual:18, problemTarget:18, problemActual:18,
      checklist:{}, note:'', sleepHours:null,
      blocks:(blocks || []).map((b,i) => Object.assign({
        id:'b'+i, slot:'Ana ders', subject:'X', topic:'Konu '+i, targetMin:75, targetQ:20,
        status:'pending', actualMin:null, actualQ:null, correctQ:null, skipReason:null, startedAt:null,
      }, b)),
    }, extra || {});
    return S.days[iso];
  }

  describe('Calc.nextAction önceliği', function(){
    it('analiz borcu her şeyin önüne geçer', function(){
      resetState();
      withToday('2026-09-21', function(){
        S.exams = [makeExam({ date:'2026-09-19', analysisCompletedAt:null })];
        S.cards = [{ id:'c1', dueAt:'2026-09-10' }];
        seedToday('2026-09-21', [{}]);
        expect(C.nextAction().key).toBe('analysis');
      });
    });
    it('borç yokken gecikmiş kartlar öne geçer', function(){
      resetState();
      withToday('2026-09-21', function(){
        S.cards = [1,2,3,4,5,6].map(i => ({ id:'c'+i, dueAt:'2026-09-10' }));
        seedToday('2026-09-21', [{}]);
        expect(C.nextAction().key).toBe('cards');
      });
    });
    it('pazartesi imzasız haftada sözleşmeyi ister', function(){
      resetState();
      withToday('2026-09-21', function(){          // Pazartesi
        S.weeks['w02'] = M.defaultWeek(2);
        seedToday('2026-09-21', [{}]);
        const a = C.nextAction();
        expect(a.key).toBe('contract');
        expect(a.route).toBe('week');
      });
    });
    it('imzalı haftada sözleşme istemez', function(){
      resetState();
      withToday('2026-09-21', function(){
        const w = M.defaultWeek(2); w.signedAt = new Date().toISOString();
        S.weeks['w02'] = w;
        seedToday('2026-09-21', [{}]);
        expect(C.nextAction().key).toBe('block');
      });
    });
    it('cumartesi deneme girilmemişse denemeyi ister', function(){
      resetState();
      withToday('2026-09-19', function(){          // Cumartesi
        S.weeks['w01'] = M.defaultWeek(1);
        seedToday('2026-09-19', [{}]);
        expect(C.nextAction().key).toBe('exam');
      });
    });
    it('pazar review yoksa review ister', function(){
      resetState();
      withToday('2026-09-20', function(){          // Pazar
        S.weeks['w01'] = M.defaultWeek(1);
        seedToday('2026-09-20', [{}]);
        const a = C.nextAction();
        expect(a.key).toBe('review');
        expect(a.act).toBe('open-review');
      });
    });
    it('gecikmiş ikinci ölçümü bloktan önce gösterir', function(){
      resetState();
      withToday('2026-09-22', function(){
        const w = M.defaultWeek(2); w.signedAt = new Date().toISOString();
        S.weeks['w02'] = w;
        S.topics['tyt-turkce'] = { subjectId:'tyt-turkce', states:{
          'tr-01':{ state:'provisional', first:80, firstAt:'2026-09-10', second:null },
        }};
        seedToday('2026-09-22', [{}]);
        expect(C.nextAction().key).toBe('second-check');
      });
    });
    it('çalışan blok varsa odağa yönlendirir', function(){
      resetState();
      withToday('2026-09-22', function(){
        S.weeks['w02'] = M.defaultWeek(2);
        seedToday('2026-09-22', [{ startedAt:new Date().toISOString() }]);
        const a = C.nextAction();
        expect(a.key).toBe('running');
        expect(a.act).toBe('focus-open');
      });
    });
    it('bekleyen blok varsa onu başlatmayı önerir', function(){
      resetState();
      withToday('2026-09-22', function(){
        S.weeks['w02'] = M.defaultWeek(2);
        seedToday('2026-09-22', [{ status:'done' }, { status:'pending', topic:'Paragraf' }]);
        const a = C.nextAction();
        expect(a.key).toBe('block');
        expect(a.title).toBe('Paragraf');
        expect(a.blockId).toBe('b1');
      });
    });
    it('bloklar bitince eksik çıpayı ister', function(){
      resetState();
      withToday('2026-09-22', function(){
        S.weeks['w02'] = M.defaultWeek(2);
        seedToday('2026-09-22', [{ status:'done' }], { paragraphActual:4 });
        expect(C.nextAction().key).toBe('anchor');
      });
    });
    it('her şey bitince sakin bir kapanış verir', function(){
      resetState();
      withToday('2026-09-22', function(){
        S.weeks['w02'] = M.defaultWeek(2);
        seedToday('2026-09-22', [{ status:'done' }]);
        const a = C.nextAction();
        expect(a.key).toBe('done');
        expect(a.tone).toBe('calm');
      });
    });
    it('dinlenme bloğunu iş olarak saymaz', function(){
      resetState();
      withToday('2026-09-22', function(){
        S.weeks['w02'] = M.defaultWeek(2);
        seedToday('2026-09-22', [{ status:'done' }, { slot:'Dinlenme', status:'pending' }]);
        expect(C.nextAction().key).toBe('done');
      });
    });
  });

  describe('Calc.behaviorStreak', function(){
    function met(iso){
      seedToday(iso, [{ status:'done', actualMin:60 }]);
      S.days[iso].paragraphActual = 18;
    }
    it('kayıt yokken seri sıfırdır', function(){
      resetState();
      withToday('2026-09-22', function(){
        expect(C.behaviorStreak().streak).toBe(0);
      });
    });
    it('ardışık günleri sayar', function(){
      resetState();
      withToday('2026-09-24', function(){
        ['2026-09-22','2026-09-23','2026-09-24'].forEach(met);
        expect(C.behaviorStreak().streak).toBe(3);
      });
    });
    it('bugün henüz tamamlanmadıysa seriyi kırmaz', function(){
      resetState();
      withToday('2026-09-24', function(){
        ['2026-09-22','2026-09-23'].forEach(met);
        seedToday('2026-09-24', [{ status:'pending' }], { paragraphActual:0 });
        const s = C.behaviorStreak();
        expect(s.streak).toBe(2);
        expect(s.pendingToday).toBeTruthy();
      });
    });
    it('pazar dinlenmesi seriyi kırmaz', function(){
      resetState();
      withToday('2026-09-22', function(){          // Sali
        met('2026-09-21');                          // Pazartesi
        // 20 Eylul Pazar: kayit yok — seri kirilmamali
        met('2026-09-19');                          // Cumartesi
        met('2026-09-22');
        expect(C.behaviorStreak().streak).toBe(3);
      });
    });
    it('hafta içi boşluk seriyi kırar', function(){
      resetState();
      withToday('2026-09-24', function(){
        met('2026-09-24');
        // 23 Eylul Carsamba bos
        met('2026-09-22');
        expect(C.behaviorStreak().streak).toBe(1);
      });
    });
    it('son 14 günü görsel şerit için döndürür', function(){
      resetState();
      withToday('2026-10-10', function(){
        const s = C.behaviorStreak();
        expect(s.days.length).toBeLessThan(15);
        expect(s.days[s.days.length-1].today).toBeTruthy();
      });
    });
  });

  describe('Bilgi katmanı (ipucu ve ray)', function(){
    it('her ipucu başlık ve kısa açıklama taşır', function(){
      const keys = Object.keys(R.HINTS);
      expect(keys.length).toBeGreaterThan(30);
      keys.forEach(k => {
        const h = R.HINTS[k];
        if(!h.t || !h.b) throw new Error(k+' eksik alan');
        if(h.t.length > 26) throw new Error(k+' başlığı çok uzun: '+h.t);
        if(h.b.length > 130) throw new Error(k+' açıklaması çok uzun ('+h.b.length+')');
      });
    });
    it('ipucu düğmesi anahtarı taşır', function(){
      expect(R.UI.hint('srs')).toContain('data-hint="srs"');
    });
    it('bilinmeyen anahtar için boş döner', function(){
      expect(R.UI.hint('boyle-bir-sey-yok')).toBe('');
    });
    it('ray kartları başlık ve açıklamayı gösterir', function(){
      const html = R.UI.rail(['srs','median']);
      expect(html).toContain('railcard');
      expect(html).toContain('Aralıklı tekrar');
    });
    /* SEKME ŞERİDİ NEREDE OLDUĞUNU DOĞRU SÖYLEMELİ.

       `S.ui.analyticsTab` varsayılanı 'overview' idi; o adda bir sekme
       kalmamıştı. Şeritte hiçbir sekme seçili görünmüyor, gövdede ise
       karşılaştırma çiziliyordu — ekran nerede olduğunu yanlış söylüyordu.
       Bu test adı tek tek bilmez; her sekmeli ekranda TAM BİR sekmenin
       seçili olmasını ister, böylece aynı hata başka ekranda da yakalanır. */
    it('sekmeli ekranlarda tam bir sekme seçilidir', async function(){
      for(const route of ['analytics','guide']){
        const out = await R.Screens[route].render();
        const say = (String(out).match(/aria-selected="true"/g) || []).length;
        if(say !== 1) throw new Error(route+' ekranında seçili sekme sayısı: '+say);
      }
    });
    it('ekranlarda kullanılan tüm ipucu anahtarları tanımlı', function(){
      // ekran modulleri UI.hint('x') ve UI.rail([...]) ile cagirir
      const used = ['next-action','anchor','minimum-day','timer','streak','skip-reason',
        'contract','capacity','review','carry','plan-completion',
        'net','analysis-debt','error-tags','exam-volume','publisher','analysis-protocol','time-drift',
        'srs','card-debt','recall','notebook',
        'closure','second-check','source-arch',
        'median','base-score','bands','gate','pareto','test-trend','intensity',
        'rank','tiers','net-matrix','obp','preferences','certainty',
        'protocol','trigger','sleep','anxiety','backup','offline','ai-coach','command','block'];
      used.forEach(k => { if(!R.HINTS[k]) throw new Error('tanımsız ipucu: '+k); });
    });
  });
})();
