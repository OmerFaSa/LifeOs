/* Yeni eklenenler: yedekleme takibi, depolama saglik raporu,
   calisma yogunlugu izgarasi, test bazli seriler ve AI koc dogrulamasi. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync, makeExam } = R.Test;
  const U = R.U, M = R.Model, C = R.Calc, S = R.S;

  describe('Yedekleme takibi', function(){
    it('hic yedek alinmamissa yas null doner', function(){
      resetState();
      S.meta = { lastBackupAt:null };
      expect(M.backupAgeDays()).toBeNull();
    });
    it('yedek yasini gun olarak hesaplar', function(){
      resetState();
      withToday('2026-10-10', function(){
        S.meta = { lastBackupDate:'2026-10-03' };
        expect(M.backupAgeDays()).toBe(7);
      });
    });
    it('yerel tarih alani olmayan eski kayitta zaman damgasina duser', function(){
      resetState();
      withToday('2026-10-10', function(){
        S.meta = { lastBackupAt:'2026-10-05T09:00:00.000Z' };
        expect(M.backupAgeDays()).toBe(5);
      });
    });
    it('yedek alindigi gun yas sifirdir (saat dilimi kaymasi olmamali)', async function(){
      resetState();
      await M.markBackup();
      expect(M.backupAgeDays()).toBe(0);
    });
    it('kayda deger veri yokken hatirlatma yapmaz', function(){
      resetState();
      S.meta = { lastBackupAt:null };
      expect(M.backupDue()).toBeFalsy();
    });
    it('veri varken ve yedek yokken hatirlatir', function(){
      resetState();
      S.meta = { lastBackupAt:null };
      S.exams = [makeExam({}), makeExam({}), makeExam({}), makeExam({}), makeExam({}), makeExam({})];
      expect(M.backupDue()).toBeTruthy();
    });
    it('yedek 7 gunden yeniyse hatirlatmaz', function(){
      resetState();
      withToday('2026-10-10', function(){
        S.meta = { lastBackupDate:'2026-10-08' };
        S.exams = [makeExam({}), makeExam({}), makeExam({}), makeExam({}), makeExam({}), makeExam({})];
        expect(M.backupDue()).toBeFalsy();
      });
    });
    it('yedek alinca zaman damgasi guncellenir', async function(){
      resetState();
      await M.markBackup();
      expect(M.backupAgeDays()).toBe(0);
      const stored = await R.Store.get('meta/backup');
      expect(stored.schemaVersion).toBe(R.SCHEMA_VERSION);
    });
    it('veri ayak izini sayar', function(){
      resetState();
      S.exams = [makeExam({})];
      S.cards = [M.newCard({}), M.newCard({})];
      expect(M.dataFootprint().total).toBe(3);
    });
  });

  describe('Yedek dosyasi bicimi', function(){
    it('disa aktarim sema surumu ve zaman damgasi tasir', function(){
      const out = R.Test.realStore.exportAll();
      expect(out.__meta.schemaVersion).toBe(R.SCHEMA_VERSION);
      expect(typeof out.data).toBe('object');
    });
    it('gecerli yedegi kabul eder', function(){
      const ok = R.Test.realStore.readBackup({ __meta:{ schemaVersion:R.SCHEMA_VERSION }, data:{ 'profile/main':{} } });
      expect(ok.ok).toBeTruthy();
    });
    it('eski (duz sozluk) yedegi de kabul eder', function(){
      const ok = R.Test.realStore.readBackup({ 'profile/main':{ name:'x' }, 'days/2026-09-14':{} });
      expect(ok.ok).toBeTruthy();
      expect(ok.meta.legacy).toBeTruthy();
    });
    it('daha yeni semali yedegi reddeder', function(){
      const bad = R.Test.realStore.readBackup({ __meta:{ schemaVersion:R.SCHEMA_VERSION + 5 }, data:{} });
      expect(bad.ok).toBeFalsy();
      expect(bad.error).toContain('şema');
    });
    it('alakasiz dosyayi reddeder', function(){
      const bad = R.Test.realStore.readBackup({ hello:'world' });
      expect(bad.ok).toBeFalsy();
    });
    it('bos girdiyi reddeder', function(){
      expect(R.Test.realStore.readBackup(null).ok).toBeFalsy();
    });
  });

  describe('Calc.intensityGrid', function(){
    it('40 hafta x 7 gun = 280 hucre uretir', function(){
      resetState();
      withToday('2026-10-05', function(){
        expect(C.intensityGrid().cells).toHaveLength(280);
      });
    });
    it('gelecek gunleri future olarak isaretler', function(){
      resetState();
      withToday('2026-09-15', function(){
        const g = C.intensityGrid();
        const last = g.cells[g.cells.length-1];
        expect(last.future).toBeTruthy();
        expect(last.value).toBeNull();
      });
    });
    it('gerceklesen sureyi hedefe oranlar', function(){
      resetState();
      withToday('2026-09-20', function(){
        S.days['2026-09-15'] = { date:'2026-09-15', blocks:[
          { slot:'Ana ders', targetMin:100, actualMin:50, status:'partial' },
        ], paragraphActual:0, checklist:{} };
        const g = C.intensityGrid();
        const cell = g.cells.find(c => c.iso === '2026-09-15');
        expect(cell.value).toBe(0.5);
      });
    });
    it('yogunlugu 1 ile sinirlar', function(){
      resetState();
      withToday('2026-09-20', function(){
        S.days['2026-09-16'] = { date:'2026-09-16', blocks:[
          { slot:'Ana ders', targetMin:60, actualMin:180, status:'done' },
        ], paragraphActual:0, checklist:{} };
        const cell = C.intensityGrid().cells.find(c => c.iso === '2026-09-16');
        expect(cell.value).toBe(1);
      });
    });
    it('gecmis ve kayitsiz gunu missed isaretler', function(){
      resetState();
      withToday('2026-09-20', function(){
        const cell = C.intensityGrid().cells.find(c => c.iso === '2026-09-17');
        expect(cell.missed).toBeTruthy();
      });
    });
    it('program oncesi gunleri missed saymaz', function(){
      resetState();
      withToday('2026-09-20', function(){
        const cells = C.intensityGrid().cells;
        expect(cells[0].iso).toBe('2026-09-14');   // izgara program basinda baslar
      });
    });
    it('ay etiketlerini uretir', function(){
      resetState();
      withToday('2026-10-05', function(){
        const ticks = C.intensityGrid().ticks;
        expect(ticks.length).toBeGreaterThan(8);
        expect(ticks[0].label).toBe('Eyl');
      });
    });
  });

  describe('Calc.testSeries', function(){
    it('her test icin ayri seri uretir', function(){
      resetState();
      S.exams = [0,1].map(i => makeExam({
        date:'2026-09-1'+(i+1),
        tests:[
          { name:'Türkçe', correct:20+i*4, wrong:0, blank:0 },
          { name:'Temel Matematik', correct:10+i*2, wrong:4, blank:0 },
        ],
      }));
      const s = C.testSeries('TYT');
      expect(s).toHaveLength(2);
      expect(s[0].name).toBe('Türkçe');
      expect(s[0].data).toEqual([20, 24]);
      expect(s[1].data).toEqual([9, 11]);
    });
    it('o denemede olmayan testi null birakir', function(){
      resetState();
      S.exams = [
        makeExam({ date:'2026-09-11', tests:[{ name:'Türkçe', correct:20, wrong:0, blank:0 }] }),
        makeExam({ date:'2026-09-18', tests:[
          { name:'Türkçe', correct:24, wrong:0, blank:0 },
          { name:'Fen Bilimleri', correct:8, wrong:0, blank:0 },
        ]}),
      ];
      const fen = C.testSeries('TYT').find(s => s.name === 'Fen Bilimleri');
      expect(fen.data[0]).toBeNull();
      expect(fen.data[1]).toBe(8);
    });
    it('deneme yokken bos dizi verir', function(){
      resetState();
      expect(C.testSeries('AYT')).toHaveLength(0);
    });
  });

  describe('Ofis kural motoru dogrulamasi', function(){
    it('konu kapanisi dusukken yeni kaynak onerisini isaretler', function(){
      resetState();   // kapanis %0
      const v = R.Office.validate('Bence yeni bir kaynak açman iyi olur.');
      expect(v.warnings.length).toBeGreaterThan(0);
    });
    it('yerlesme garantisi iceren metni isaretler', function(){
      resetState();
      const v = R.Office.validate('Bu tempoyla kesinlikle kazanırsın.');
      expect(v.warnings.length).toBeGreaterThan(0);
    });
    it('gece calisma onerisini isaretler', function(){
      resetState();
      const v = R.Office.validate('Açığı kapatmak için gece çalışmayı deneyebilirsin.');
      expect(v.warnings.length).toBeGreaterThan(0);
    });
    it('kurallara uyan metni gecirir', function(){
      resetState();
      const v = R.Office.validate('Plan tamamlaman %78; en büyük sapma işlem hatası. Gelecek hafta üç gün 10 benzer soru çöz.');
      expect(v.warnings).toHaveLength(0);
      expect(v.text).toContain('işlem hatası');
    });
  });

})();
