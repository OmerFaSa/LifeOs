/* R.Calc — KPI, trend, karar kapisi ve telafi tetikleyicileri */

(function(){
  const { describe, it, expect, resetState, withToday, makeExam, examWithNet } = R.Test;
  const U = R.U, M = R.Model, C = R.Calc, S = R.S;

  /* Bir haftanin gunlerini verilen blok durumlariyla doldurur */
  function seedWeek(n, statuses){
    M.weekDates(n).forEach((d, i) => {
      const iso = U.iso(d);
      S.days[iso] = {
        date:iso, dow:i, ritual:null,
        paragraphTarget:18, paragraphActual:0, problemTarget:18, problemActual:0,
        checklist:{}, note:'', sleepHours:null,
        blocks:(statuses[i] || []).map((st, bi) => ({
          id:'b'+bi, slot:'Ana ders', subject:'X', topic:'X',
          targetMin:75, targetQ:20, status:st,
          actualMin:null, actualQ:null, correctQ:null, skipReason:null, startedAt:null,
        })),
      };
    });
  }

  describe('Calc.examNet', function(){
    it('dogru − yanlis/4 formulunu uygular', function(){
      expect(M.examNet(makeExam({ correct:20, wrong:4 }))).toBe(19);
    });
    it('yanlis yoksa dogru sayisini verir', function(){
      expect(M.examNet(makeExam({ correct:30, wrong:0 }))).toBe(30);
    });
    it('negatif net uretebilir', function(){
      expect(M.examNet(makeExam({ correct:0, wrong:8 }))).toBe(-2);
    });
    it('cok testli denemede testleri toplar', function(){
      const ex = makeExam({ tests:[
        { name:'Türkçe', correct:28, wrong:8, blank:4 },
        { name:'Temel Matematik', correct:20, wrong:4, blank:16 },
      ]});
      expect(M.examNet(ex)).toBe(45);   // 26 + 19
    });
    it('bos test dizisinde 0 verir', function(){
      expect(M.examNet({ tests:[] })).toBe(0);
    });
  });

  describe('Calc.medianTrend', function(){
    it('deneme yokken null doner', function(){
      resetState();
      const t = C.medianTrend('TYT');
      expect(t.last3).toBeNull();
      expect(t.delta).toBeNull();
      expect(t.count).toBe(0);
    });
    it('2 denemede henuz medyan vermez', function(){
      resetState();
      S.exams = [examWithNet('2026-09-19', 40), examWithNet('2026-09-26', 44)];
      expect(C.medianTrend('TYT').last3).toBeNull();
    });
    it('3 denemede son 3 medyanini verir', function(){
      resetState();
      S.exams = [examWithNet('2026-09-19', 40), examWithNet('2026-09-26', 50), examWithNet('2026-10-03', 44)];
      expect(C.medianTrend('TYT').last3).toBe(44);
    });
    it('6 denemede yukselen delta hesaplar', function(){
      resetState();
      S.exams = [
        examWithNet('2026-09-05', 30), examWithNet('2026-09-12', 32), examWithNet('2026-09-19', 34),
        examWithNet('2026-09-26', 40), examWithNet('2026-10-03', 42), examWithNet('2026-10-10', 44),
      ];
      const t = C.medianTrend('TYT');
      expect(t.prev3).toBe(32);
      expect(t.last3).toBe(42);
      expect(t.delta).toBe(10);
    });
    it('duz seride delta sifirdir', function(){
      resetState();
      S.exams = [40,40,40,40,40,40].map((v,i) => examWithNet('2026-09-0'+(i+1), v));
      expect(C.medianTrend('TYT').delta).toBe(0);
    });
    it('dusen seride negatif delta verir', function(){
      resetState();
      S.exams = [
        examWithNet('2026-09-05', 50), examWithNet('2026-09-12', 50), examWithNet('2026-09-19', 50),
        examWithNet('2026-09-26', 44), examWithNet('2026-10-03', 44), examWithNet('2026-10-10', 44),
      ];
      expect(C.medianTrend('TYT').delta).toBe(-6);
    });
    it('yalniz tam denemeleri sayar, brans denemelerini haric tutar', function(){
      resetState();
      S.exams = [
        examWithNet('2026-09-19', 40),
        makeExam({ date:'2026-09-20', kind:'branch', type:'Branş — Türkçe', tests:[{name:'Türkçe',correct:38,wrong:0,blank:2}] }),
        examWithNet('2026-09-26', 44), examWithNet('2026-10-03', 48),
      ];
      const t = C.medianTrend('TYT');
      expect(t.count).toBe(3);
      expect(t.last3).toBe(44);
    });
    it('TYT ve AYT ailelerini ayri izler', function(){
      resetState();
      S.exams = [
        examWithNet('2026-09-19', 40, 'TYT'), examWithNet('2026-09-26', 44, 'TYT'), examWithNet('2026-10-03', 48, 'TYT'),
        examWithNet('2026-09-20', 12, 'AYT'), examWithNet('2026-09-27', 14, 'AYT'), examWithNet('2026-10-04', 16, 'AYT'),
      ];
      expect(C.medianTrend('TYT').last3).toBe(44);
      expect(C.medianTrend('AYT').last3).toBe(14);
    });
  });

  describe('Calc.examBase', function(){
    it('deneme yokken null verir', function(){
      resetState();
      expect(C.examBase('TYT')).toBeNull();
    });
    it('4ten az denemede mevcutlarin en dususunu verir', function(){
      resetState();
      S.exams = [examWithNet('2026-09-19', 40), examWithNet('2026-09-26', 36)];
      expect(C.examBase('TYT')).toBe(36);
    });
    it('yalniz son 4 denemeye bakar, daha eskisini yok sayar', function(){
      resetState();
      S.exams = [
        examWithNet('2026-09-05', 10),   // eski ve cok dusuk — sayilmamali
        examWithNet('2026-09-12', 40), examWithNet('2026-09-19', 44),
        examWithNet('2026-09-26', 42), examWithNet('2026-10-03', 46),
      ];
      expect(C.examBase('TYT')).toBe(40);
    });
  });

  describe('Calc.testMedian', function(){
    it('test bazinda son 4 denemenin medyanini verir', function(){
      resetState();
      S.exams = [1,2,3,4].map((i, idx) => makeExam({
        date:'2026-09-0'+(idx+1),
        tests:[
          { name:'Türkçe', correct:20+idx*2, wrong:0, blank:0 },
          { name:'Temel Matematik', correct:10, wrong:4, blank:0 },
        ],
      }));
      expect(C.testMedian('Türkçe','TYT')).toBe(23);
      expect(C.testMedian('Temel Matematik','TYT')).toBe(9);
    });
    it('bilinmeyen test adinda null verir', function(){
      resetState();
      S.exams = [examWithNet('2026-09-19', 40)];
      expect(C.testMedian('Yok Böyle Test','TYT')).toBeNull();
    });
  });

  describe('Calc.analysisDebt', function(){
    it('24 saati asmis analizsiz denemeyi borc sayar', function(){
      resetState();
      withToday('2026-09-21', function(){
        S.exams = [makeExam({ date:'2026-09-19', analysisCompletedAt:null })];
        expect(C.analysisDebt()).toHaveLength(1);
      });
    });
    it('analizi tamamlanmis denemeyi borc saymaz', function(){
      resetState();
      withToday('2026-09-21', function(){
        S.exams = [makeExam({ date:'2026-09-19' })];
        expect(C.analysisDebt()).toHaveLength(0);
      });
    });
    it('bugun girilen denemeyi henuz borc saymaz', function(){
      resetState();
      withToday('2026-09-19', function(){
        S.exams = [makeExam({ date:'2026-09-19', analysisCompletedAt:null })];
        expect(C.analysisDebt()).toHaveLength(0);
      });
    });
  });

  describe('Calc.errorPareto / topTags', function(){
    it('etiketleri azalan sirada dagitir', function(){
      resetState();
      S.errors = ['K','K','K','İ','İ','Y'].map(tag => ({ id:U.uid('r'), tag, createdAt:'2026-09-19T10:00:00Z' }));
      const p = C.errorPareto();
      expect(p[0].tag).toBe('K');
      expect(p[0].count).toBe(3);
      expect(p[0].pct).toBe(50);
      expect(p[1].tag).toBe('İ');
    });
    it('hata yokken tum sayaclar sifirdir', function(){
      resetState();
      const p = C.errorPareto();
      expect(p).toHaveLength(5);
      expect(p[0].count).toBe(0);
    });
    it('topTags yalniz sifir olmayanlari verir', function(){
      resetState();
      S.errors = [{ id:'r1', tag:'S', createdAt:'2026-09-19T10:00:00Z' }];
      expect(C.topTags(2)).toHaveLength(1);
    });
  });

  describe('Calc kart borcu', function(){
    it('gecikmis kart yoksa borc sifirdir', function(){
      resetState();
      withToday('2026-09-20', function(){
        S.cards = [{ id:'c1', dueAt:'2026-09-20' }];
        expect(C.cardDebt()).toBe(0);
      });
    });
    it('gecikmis / due oranini yuzde verir', function(){
      resetState();
      withToday('2026-09-20', function(){
        S.cards = [
          { id:'c1', dueAt:'2026-09-18' },   // gecikmis
          { id:'c2', dueAt:'2026-09-20' },   // bugun
          { id:'c3', dueAt:'2026-09-25' },   // gelecek — due degil
        ];
        expect(C.dueCards()).toHaveLength(2);
        expect(C.overdueCards()).toHaveLength(1);
        expect(C.cardDebt()).toBe(50);
      });
    });
    it('kart yokken borc sifirdir (bolme hatasi yok)', function(){
      resetState();
      expect(C.cardDebt()).toBe(0);
    });
  });

  describe('Calc.planCompletion', function(){
    it('gun kaydi yoksa null verir', function(){
      resetState();
      withToday('2026-09-21', function(){
        expect(C.planCompletion(1)).toBeNull();
      });
    });
    it('tamamlanan 1, yarim 0.5, atlanan 0 puan sayar', function(){
      resetState();
      withToday('2026-09-21', function(){
        seedWeek(1, [['done','done','skipped'], [], [], [], [], [], []]);
        expect(C.planCompletion(1)).toBe(67);
      });
    });
    it('yarim bloklari yarim puan sayar', function(){
      resetState();
      withToday('2026-09-21', function(){
        seedWeek(1, [['done','partial'], [], [], [], [], [], []]);
        expect(C.planCompletion(1)).toBe(75);
      });
    });
    it('gelecek gunleri hesaba katmaz', function(){
      resetState();
      withToday('2026-09-15', function(){
        seedWeek(1, [['done','done'], ['pending','pending'], ['pending','pending'], [], [], [], []]);
        expect(C.planCompletion(1)).toBe(100);
      });
    });
    it('gecmiste kalan bekleyen bloklari basarisiz sayar', function(){
      resetState();
      withToday('2026-09-16', function(){
        seedWeek(1, [['done','pending'], [], [], [], [], [], []]);
        expect(C.planCompletion(1)).toBe(50);
      });
    });
  });

  describe('Calc.subjectClosure', function(){
    it('hicbir konu baslanmamissa yuzde sifirdir', function(){
      resetState();
      const c = C.subjectClosure('tyt-turkce');
      expect(c.closed).toBe(0);
      expect(c.total).toBe(21);
      expect(c.pct).toBe(0);
    });
    it('yalniz closed durumundakileri sayar, provisional sayilmaz', function(){
      resetState();
      S.topics['tyt-turkce'] = { subjectId:'tyt-turkce', states:{
        'tr-01':{ state:'closed' },
        'tr-02':{ state:'provisional' },
        'tr-03':{ state:'practicing' },
      }};
      const c = C.subjectClosure('tyt-turkce');
      expect(c.closed).toBe(1);
      expect(c.started).toBe(3);
    });
    it('bilinmeyen ders icin sifir doner', function(){
      resetState();
      expect(C.subjectClosure('yok-boyle-ders').total).toBe(0);
    });
    it('TYT ve AYT kapanisini ayri hesaplar', function(){
      resetState();
      S.topics['ayt-biyoloji'] = { subjectId:'ayt-biyoloji', states:{ 'ab-01':{ state:'closed' } } };
      expect(C.examClosure('AYT').closed).toBe(1);
      expect(C.examClosure('TYT').closed).toBe(0);
    });
  });

  describe('Calc.pendingSecondChecks', function(){
    it('ilk olcum sonrasi 7 gunu gecmisse gecikmis isaretler', function(){
      resetState();
      withToday('2026-09-30', function(){
        S.topics['tyt-turkce'] = { subjectId:'tyt-turkce', states:{
          'tr-01':{ state:'provisional', first:80, firstAt:'2026-09-20', second:null },
        }};
        const p = C.pendingSecondChecks();
        expect(p).toHaveLength(1);
        expect(p[0].dueISO).toBe('2026-09-27');
        expect(p[0].overdue).toBeTruthy();
      });
    });
    it('henuz vakti gelmemis olcumu gecikmis saymaz', function(){
      resetState();
      withToday('2026-09-22', function(){
        S.topics['tyt-turkce'] = { subjectId:'tyt-turkce', states:{
          'tr-01':{ state:'provisional', first:80, firstAt:'2026-09-20', second:null },
        }};
        expect(C.pendingSecondChecks()[0].overdue).toBeFalsy();
      });
    });
    it('ikinci olcumu girilmis konuyu listelemez', function(){
      resetState();
      withToday('2026-09-30', function(){
        S.topics['tyt-turkce'] = { subjectId:'tyt-turkce', states:{
          'tr-01':{ state:'closed', first:80, firstAt:'2026-09-20', second:75, secondAt:'2026-09-27' },
        }};
        expect(C.pendingSecondChecks()).toHaveLength(0);
      });
    });
  });

  describe('Calc.gateStatus', function(){
    it('bant altini below olarak isaretler', function(){
      expect(C.gateStatus(28, [30,40], [38,43])).toBe('below');
    });
    it('bant icini inband olarak isaretler', function(){
      expect(C.gateStatus(35, [30,40], [38,43])).toBe('inband');
    });
    it('guvenli bandi safe olarak isaretler', function(){
      expect(C.gateStatus(39, [30,40], [38,43])).toBe('safe');
    });
    it('bant ustunu above olarak isaretler (guvenli bant yoksa)', function(){
      expect(C.gateStatus(45, [30,40], null)).toBe('above');
    });
    it('veri yoksa unknown verir', function(){
      expect(C.gateStatus(null, [30,40], [38,43])).toBe('unknown');
    });
    it('bant sinirinda inband kabul eder', function(){
      expect(C.gateStatus(30, [30,40], null)).toBe('inband');
    });
  });

  describe('Calc.protocolTriggers', function(){
    it('program baslamadan once tetiklenmez', function(){
      resetState();
      withToday('2026-09-07', function(){
        expect(C.protocolTriggers()).toHaveLength(0);
      });
    });
    it('iki hafta ust uste %80 altinda telafi tetikler', function(){
      resetState();
      withToday('2026-11-02', function(){          // Hafta 8 Pazartesi
        seedWeek(6, [['skipped','skipped','done'], [], [], [], [], [], []]);
        seedWeek(7, [['skipped','skipped','done'], [], [], [], [], [], []]);
        const ids = C.protocolTriggers().map(t => t.id);
        expect(ids).toContain('two-weeks-behind');
      });
    });
    it('yeterli tamamlamada telafi tetiklemez', function(){
      resetState();
      withToday('2026-11-02', function(){
        seedWeek(6, [['done','done','done'], [], [], [], [], [], []]);
        seedWeek(7, [['done','done','done'], [], [], [], [], [], []]);
        const ids = C.protocolTriggers().map(t => t.id);
        expect(ids.indexOf('two-weeks-behind')).toBe(-1);
      });
    });
    it('3+ gun kayit yoksa kopus protokolu tetikler', function(){
      resetState();
      withToday('2026-11-02', function(){
        const ids = C.protocolTriggers().map(t => t.id);
        expect(ids).toContain('illness-break');
      });
    });
    it('Ekim ayinda TYT matematik 8 netin altindaysa tetikler', function(){
      resetState();
      withToday('2026-10-26', function(){
        S.exams = [1,2,3].map((v,i) => makeExam({
          date:'2026-10-0'+(i+1),
          tests:[{ name:'Temel Matematik', correct:8, wrong:4, blank:28 }],   // net 7
        }));
        const ids = C.protocolTriggers().map(t => t.id);
        expect(ids).toContain('math-weak');
      });
    });
    it('netler dort hafta duzse flat-nets tetikler', function(){
      resetState();
      withToday('2026-11-02', function(){
        S.exams = [45,45,45,45,45,45].map((v,i) => examWithNet('2026-10-0'+(i+1), v));
        const ids = C.protocolTriggers().map(t => t.id);
        expect(ids).toContain('flat-nets');
      });
    });
    it('ayni protokol aktifken yeniden tetiklenmez', function(){
      resetState();
      withToday('2026-11-02', function(){
        S.protocols = [{ id:'p1', protoId:'illness-break', status:'active', steps:{} }];
        const ids = C.protocolTriggers().map(t => t.id);
        expect(ids.indexOf('illness-break')).toBe(-1);
      });
    });
  });

  describe('Calc.obp', function(){
    it('diploma 70 icin +42 katki verir', function(){
      const o = C.obp({ diplomaGrade:70, previouslyPlaced:false });
      expect(o.value).toBe(350);
      expect(o.contribution).toBe(42);
    });
    it('diploma 85 icin +51 katki verir', function(){
      expect(C.obp({ diplomaGrade:85, previouslyPlaced:false }).contribution).toBe(51);
    });
    it('diploma 100 icin +60 katki verir', function(){
      expect(C.obp({ diplomaGrade:100, previouslyPlaced:false }).contribution).toBe(60);
    });
    it('daha once yerlesmisse katsayi 0.06 olur', function(){
      const o = C.obp({ diplomaGrade:70, previouslyPlaced:true });
      expect(o.coef).toBe(0.06);
      expect(o.contribution).toBe(21);
    });
    it('OBP alt sinirini 250 olarak kirpar', function(){
      expect(C.obp({ diplomaGrade:10, previouslyPlaced:false }).value).toBe(250);
    });
    it('OBP ust sinirini 500 olarak kirpar', function(){
      expect(C.obp({ diplomaGrade:150, previouslyPlaced:false }).value).toBe(500);
    });
  });

  describe('Calc.questionRealization', function(){
    it('cozulen / hedef oranini verir', function(){
      resetState();
      withToday('2026-09-21', function(){
        S.weeks['w01'] = M.defaultWeek(1);
        seedWeek(1, [['done','done'], [], [], [], [], [], []]);
        S.days['2026-09-14'].blocks[0].actualQ = 50;
        S.days['2026-09-14'].blocks[1].actualQ = 75;
        const q = C.questionRealization(1);
        expect(q.solved).toBe(125);
        expect(q.target).toBe(250);
        expect(q.pct).toBe(50);
      });
    });
  });

  describe('Calc.minimumDayMet', function(){
    it('45 dk + 15 paragraf saglanmadan false verir', function(){
      resetState();
      withToday('2026-09-15', function(){
        S.days['2026-09-15'] = { date:'2026-09-15', blocks:[{ actualMin:30, status:'partial' }], paragraphActual:10, checklist:{} };
        expect(C.minimumDayMet('2026-09-15')).toBeFalsy();
      });
    });
    it('esikler saglandiginda true verir', function(){
      resetState();
      withToday('2026-09-15', function(){
        S.days['2026-09-15'] = { date:'2026-09-15', blocks:[{ actualMin:50, status:'done' }], paragraphActual:15, checklist:{} };
        expect(C.minimumDayMet('2026-09-15')).toBeTruthy();
      });
    });
  });
})();
