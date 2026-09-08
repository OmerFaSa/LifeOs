/* R.Model — hafta/gun uretimi, SRS zamanlamasi, konu kapanisi ve normalizasyon */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync } = R.Test;
  const U = R.U, M = R.Model, S = R.S;

  describe('Model hafta takvimi', function(){
    it('program ilk gunu 1. haftaya duser', function(){
      expect(M.weekOf('2026-09-14')).toBe(1);
    });
    it('ilk haftanin son gunu hala 1. haftadir', function(){
      expect(M.weekOf('2026-09-20')).toBe(1);
    });
    it('sekizinci gun 2. haftaya gecer', function(){
      expect(M.weekOf('2026-09-21')).toBe(2);
    });
    it('program oncesi tarihleri 1. haftaya kirpar', function(){
      expect(M.weekOf('2026-08-01')).toBe(1);
    });
    it('program sonrasi tarihleri 40. haftaya kirpar', function(){
      expect(M.weekOf('2027-08-01')).toBe(40);
    });
    it('hafta baslangici her zaman Pazartesidir', function(){
      for(const n of [1, 7, 20, 40]){
        expect(U.weekdayIndex(M.weekStart(n))).toBe(0);
      }
    });
    it('40. hafta 20 Haziran 2027 pazar gunu biter', function(){
      expect(U.iso(M.weekEnd(40))).toBe('2027-06-20');
    });
    it('hafta 7 gun surer', function(){
      expect(M.weekDates(5)).toHaveLength(7);
      expect(U.diffDays(M.weekStart(5), M.weekEnd(5))).toBe(6);
    });
    it('hafta kimligi sifirla doldurulur', function(){
      expect(M.weekId(1)).toBe('w01');
      expect(M.weekId(40)).toBe('w40');
    });
  });

  describe('Model.defaultWeek', function(){
    it('mufredattan baslik ve soru hedefini alir', function(){
      const w = M.defaultWeek(1);
      expect(w.questionTarget).toBe(250);
      expect(w.title).toContain('Kalibrasyon');
    });
    it('en fazla 3 ana konu olusturur', function(){
      const w = M.defaultWeek(39);   // mufredatta 4 konu var
      expect(w.mainTopics.length).toBeLessThan(4);
    });
    it('imzasiz ve revizyonsuz baslar', function(){
      const w = M.defaultWeek(3);
      expect(w.signedAt).toBeNull();
      expect(w.revisions).toHaveLength(0);
    });
    it('kapasiteyi profil varsayilanindan alir', function(){
      expect(M.defaultWeek(1).capacityMin).toBe(21*60);
    });
  });

  describe('Model.defaultDay', function(){
    it('gun sablonundan 3 blok uretir', function(){
      const w = M.defaultWeek(1);
      const d = M.defaultDay(U.parse('2026-09-15'), w);   // Sali
      expect(d.blocks).toHaveLength(3);
      expect(d.blocks[0].slot).toBe('Ana ders');
      expect(d.blocks[0].targetMin).toBe(75);
    });
    it('Pazartesi gunune sozlesme rituelini atar', function(){
      const d = M.defaultDay(U.parse('2026-09-14'), M.defaultWeek(1));
      expect(d.ritual).toBe('contract');
    });
    it('Cumartesi gunune deneme rituelini atar', function(){
      const d = M.defaultDay(U.parse('2026-09-19'), M.defaultWeek(1));
      expect(d.ritual).toBe('exam');
    });
    it('Pazar gunune review rituelini atar', function(){
      const d = M.defaultDay(U.parse('2026-09-20'), M.defaultWeek(1));
      expect(d.ritual).toBe('review');
    });
    it('calisma gununde bloklara haftanin ana konularini yazar', function(){
      const w = M.defaultWeek(1);
      const d = M.defaultDay(U.parse('2026-09-15'), w);
      expect(d.blocks[0].topic).toBe(w.mainTopics[0].name);
    });
    it('checklist ve not alanlarini bos baslatir', function(){
      const d = M.defaultDay(U.parse('2026-09-15'), M.defaultWeek(1));
      expect(d.checklist).toEqual({});
      expect(d.note).toBe('');
    });
  });

  describe('Model.schedule (SRS)', function(){
    function card(stage){
      return M.newCard({ stage:stage || 0, dueAt:'2026-09-20' });
    }
    it('hatirladim ilk asamada +1 gune planlar', function(){
      withToday('2026-09-20', function(){
        const c = M.schedule(card(0), 'remembered');
        expect(c.stage).toBe(1);
        expect(c.dueAt).toBe('2026-09-21');
      });
    });
    it('hatirladim ikinci asamada +3 gune planlar', function(){
      withToday('2026-09-20', function(){
        const c = M.schedule(card(1), 'remembered');
        expect(c.stage).toBe(2);
        expect(c.dueAt).toBe('2026-09-23');
      });
    });
    it('hatirladim ucuncu asamada +1 haftaya planlar', function(){
      withToday('2026-09-20', function(){
        const c = M.schedule(card(2), 'remembered');
        expect(c.stage).toBe(3);
        expect(c.dueAt).toBe('2026-09-27');
      });
    });
    it('hatirladim dorduncu asamada +1 aya planlar', function(){
      withToday('2026-09-20', function(){
        const c = M.schedule(card(3), 'remembered');
        expect(c.stage).toBe(4);
        expect(c.dueAt).toBe('2026-10-20');
      });
    });
    it('son asamada kalir, tasmaz', function(){
      withToday('2026-09-20', function(){
        const c = M.schedule(card(4), 'remembered');
        expect(c.stage).toBe(4);
      });
    });
    it('hatirlamadim donguyu +1 gunden baslatir', function(){
      withToday('2026-09-20', function(){
        const c = M.schedule(card(4), 'forgot');
        expect(c.stage).toBe(1);
        expect(c.dueAt).toBe('2026-09-21');
      });
    });
    it('zorlandim bir sonraki araligi acmaz, ayni araligi tekrarlar', function(){
      withToday('2026-09-20', function(){
        const c = M.schedule(card(2), 'hard');
        expect(c.stage).toBe(2);
        expect(c.dueAt).toBe('2026-09-23');
      });
    });
    it('zorlandim yeni kartta en az 1. asamaya cikarir', function(){
      withToday('2026-09-20', function(){
        const c = M.schedule(card(0), 'hard');
        expect(c.stage).toBe(1);
      });
    });
    it('gecmisi kaydeder', function(){
      withToday('2026-09-20', function(){
        const c = M.schedule(card(0), 'remembered');
        expect(c.history).toHaveLength(1);
        expect(c.history[0].rating).toBe('remembered');
        expect(c.lastReviewedAt).toBe('2026-09-20');
      });
    });
  });

  describe('Model.setTopicState (kapanis kurali)', function(){
    it('75 ve 70 esiklerini gecince kapanir', async function(){
      resetState();
      const st = await M.setTopicState('tyt-turkce','tr-01', { first:75, firstAt:'2026-09-20', second:70, secondAt:'2026-09-27' });
      expect(st.state).toBe('closed');
    });
    it('ilk olcum 74 ise kapanmaz', async function(){
      resetState();
      const st = await M.setTopicState('tyt-turkce','tr-01', { first:74, firstAt:'2026-09-20', second:90, secondAt:'2026-09-27' });
      expect(st.state).toBe('practicing');
    });
    it('ikinci olcum 69 ise kapanmaz', async function(){
      resetState();
      const st = await M.setTopicState('tyt-turkce','tr-01', { first:90, firstAt:'2026-09-20', second:69, secondAt:'2026-09-27' });
      expect(st.state).toBe('practicing');
    });
    it('yalniz ilk olcum varsa ve 75+ ise gecici kapali olur', async function(){
      resetState();
      const st = await M.setTopicState('tyt-turkce','tr-01', { first:80, firstAt:'2026-09-20' });
      expect(st.state).toBe('provisional');
    });
    it('yalniz ilk olcum varsa ve 75 altiysa pratik olur', async function(){
      resetState();
      const st = await M.setTopicState('tyt-turkce','tr-01', { first:60, firstAt:'2026-09-20' });
      expect(st.state).toBe('practicing');
    });
    it('elle secilen durum otomatik kurali ezer', async function(){
      resetState();
      const st = await M.setTopicState('tyt-turkce','tr-01', { first:90, second:90, state:'reopened' });
      expect(st.state).toBe('reopened');
    });
    it('durumu kalici olarak saklar', async function(){
      resetState();
      await M.setTopicState('tyt-turkce','tr-01', { first:80, firstAt:'2026-09-20' });
      expect(M.topicState('tyt-turkce','tr-01').first).toBe(80);
    });
    it('kaydi olmayan konu icin varsayilan durum verir', function(){
      resetState();
      const st = M.topicState('ayt-fizik','af-01');
      expect(st.state).toBe('not_started');
      expect(st.first).toBeNull();
    });
  });

  describe('Model.newCard', function(){
    it('yeni kart yarina planlanir', function(){
      withToday('2026-09-20', function(){
        expect(M.newCard({}).dueAt).toBe('2026-09-21');
      });
    });
    it('varsayilan asama sifirdir', function(){
      expect(M.newCard({}).stage).toBe(0);
    });
    it('verilen alanlari korur', function(){
      const c = M.newCard({ front:'soru', topic:'Paragraf' });
      expect(c.front).toBe('soru');
      expect(c.topic).toBe('Paragraf');
    });
  });

  describe('Model normalizasyon (sema evrimi)', function(){
    it('checklist alani eksik gun kaydini onarir', async function(){
      resetState();
      await withTodayAsync('2026-09-14', async function(){
        const w = await M.ensureWeek(1);
        const broken = M.defaultDay(U.parse('2026-09-14'), w);
        delete broken.checklist;
        delete broken.note;
        await R.Store.set('days/2026-09-14', broken);
        delete S.days['2026-09-14'];

        const fixed = await M.ensureDay('2026-09-14');
        expect(fixed.checklist).toEqual({});
        expect(fixed.note).toBe('');
      });
    });
    it('bloklari bos gelen gunu sablondan yeniden kurar', async function(){
      resetState();
      await withTodayAsync('2026-09-15', async function(){
        const w = await M.ensureWeek(1);
        const broken = M.defaultDay(U.parse('2026-09-15'), w);
        broken.blocks = [];
        await R.Store.set('days/2026-09-15', broken);
        delete S.days['2026-09-15'];

        const fixed = await M.ensureDay('2026-09-15');
        expect(fixed.blocks).toHaveLength(3);
      });
    });
    it('revisions alani eksik haftayi onarir', async function(){
      resetState();
      const broken = M.defaultWeek(2);
      delete broken.revisions;
      delete broken.carryIn;
      await R.Store.set('weeks/w02', broken);
      const fixed = await M.ensureWeek(2);
      expect(fixed.revisions).toHaveLength(0);
      expect(fixed.carryIn).toHaveLength(0);
    });
    it('states alani eksik konu belgesini onarir', async function(){
      resetState();
      await R.Store.set('topics/ayt-kimya', { subjectId:'ayt-kimya' });
      const fixed = await M.ensureTopics('ayt-kimya');
      expect(fixed.states).toEqual({});
    });
  });

  describe('Model kalicilik', function(){
    it('hafta kaydi depoya yazilir ve geri okunur', async function(){
      resetState();
      const w = await M.ensureWeek(3);
      w.questionTarget = 999;
      await M.saveWeek(3);
      delete S.weeks['w03'];
      const again = await M.ensureWeek(3);
      expect(again.questionTarget).toBe(999);
    });
    it('deneme kaydi listeye ve depoya eklenir', async function(){
      resetState();
      const ex = R.Test.makeExam({ id:'e-test-1' });
      await M.saveExam(ex);
      expect(S.exams).toHaveLength(1);
      const stored = await R.Store.get('exams/e-test-1');
      expect(stored.type).toBe('Tam TYT');
    });
    it('deneme silinince bagli hatalar da silinir', async function(){
      resetState();
      const ex = R.Test.makeExam({ id:'e-test-2' });
      await M.saveExam(ex);
      await M.saveError({ id:'r-test-1', examId:'e-test-2', tag:'K' });
      await M.deleteExam('e-test-2');
      expect(S.exams).toHaveLength(0);
      expect(S.errors).toHaveLength(0);
    });
  });
})();
