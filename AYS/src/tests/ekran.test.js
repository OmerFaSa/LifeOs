/* Ekran sözleşmesi (borç 17; SPİ'deki «Ekranlar — sözleşme» paketinin AYS'si,
   NOTLAR §2.2). Önceden test sayfası 20 ekranın 4'ünü yüklüyordu. Kanıtladığı
   sözler: bütün ekranlar kayıtlı ve sözleşmeyi taşır; gezinmedeki her yol bir
   ekrana gider ve her ekran tam bir bölümdedir; boş ve dolu durumda hiçbir
   ekran çizerken çökmez. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const ids = ['today', 'week', 'exams', 'cards', 'learn', 'quiz', 'solve', 'subjects', 'topic',
    'plan', 'target', 'progress', 'analytics', 'protocols', 'rutbe', 'guide', 'profiles',
    'office', 'team', 'meeting'];

  describe('Ekranlar — sözleşme', () => {
    it('bütün ekranlar kayıtlı; id, başlık ve render var', () => {
      ids.forEach(id => {
        const sc = R.Screens[id];
        expect(!!sc).toBe(true);
        expect(sc.id).toBe(id);
        expect(typeof sc.title).toBe('string');
        expect(typeof sc.render).toBe('function');
      });
    });

    it('gezinmedeki her yol bir ekrana gider; her ekran tam bir bölümde', () => {
      const gorulen = {};
      R.App.NAV.forEach(g => g.items.forEach(v => {
        expect(!!R.Screens[v.id]).toBe(true);
        expect(gorulen[v.id]).toBe(undefined);
        gorulen[v.id] = g.id;
      }));
      /* «topic» bir konunun ayrıntısıdır; menüde değil Dersler'den açılır. */
      ids.filter(id => id !== 'topic').forEach(id => expect(!!gorulen[id]).toBe(true));
    });

    it('hero metinleri metin döndürür', () => {
      ids.forEach(id => {
        const sc = R.Screens[id];
        if(sc.headline) expect(typeof sc.headline()).toBe('string');
        if(sc.lede) expect(typeof sc.lede()).toBe('string');
      });
    });

    it('boş ve dolu durumda hiçbir ekran çökmez', async () => {
      for(const dolu of [false, true]){
        resetState();
        await withTodayAsync('2026-10-12', async () => {
          if(dolu){
            await R.Model.ensurePlan(true);
            await R.Model.ensureWeek(R.Model.currentWeek());
            await R.Model.ensureDay(R.U.today());
          }
          for(const id of ids){
            const out = String(await R.Screens[id].render());
            expect(out.length > 20).toBe(true);
          }
        });
      }
    });

    /* EKSİK (2026-09-24): «soru 40» (Telegram kısa kayıt, derssiz giriş)
       günün serbest sorusuna yazılıyor ama HİÇBİR ekranda görünmüyordu. */
    /* Fikir 26: yanlışın yanında o konunun ders notu (aynı ders+konu). */
    it('yanlış defterinde konunun notu bağlanır', async () => {
      resetState();
      R.S.errors = [{ id:'e1', topic:'Türev', subjectId:'tyt-mat', topicId:'t1', tag:'K',
        closedAt:null, createdAt:'2026-10-01T10:00:00.000Z', recipe:'', rootCause:'' }];
      R.S.videoNotes = [{ id:'n1', title:'Türev — giriş', subjectId:'tyt-mat', topicId:'t1',
        segments:[], url:'' }, { id:'n2', title:'Başka konu', subjectId:'tyt-mat', topicId:'t9', segments:[] }];
      R.S.ui.cardTab = 'notebook';
      const out = String(await R.Screens.cards.render());
      expect(out.indexOf('Türev — giriş') >= 0).toBe(true);
      expect(out.indexOf('data-act="note-goto"') >= 0).toBe(true);
      expect(out.indexOf('Başka konu') < 0).toBe(true);
    });

    /* HATALAR D-8: doğru ve yanlışı 0 olan test (hepsi boş ya da girilmemiş)
       «Doğruluk %0» gösteriyordu; cevaplanmamış test ölçülmemiştir. */
    it('cevaplanmamış testin doğruluğu «%0» değil «—»', async () => {
      resetState();
      const ex = R.Test.makeExam({ tests:[
        { name:'Türkçe', correct:0, wrong:0, blank:40, minutes:null },
        { name:'Matematik', correct:30, wrong:10, blank:0, minutes:null }] });
      R.S.exams = [ex];
      R.S.ui.examOpen = ex.id;
      const out = String(await R.Screens.exams.render());
      expect(out.indexOf('>%0<') < 0).toBe(true);
      expect(out.indexOf('>%75<') >= 0).toBe(true);
      expect(out.indexOf('title="veri yok"') >= 0).toBe(true);
    });

    it('plan dışı çözülen soru Bugün ekranında görünür', async () => {
      resetState();
      await withTodayAsync('2026-10-12', async () => {
        await R.Model.ensurePlan(true);
        await R.Model.ensureWeek(R.Model.currentWeek());
        const gun = await R.Model.ensureDay(R.U.today());
        let out = String(await R.Screens.today.render());
        expect(out.indexOf('Plan dışı') < 0).toBe(true);
        gun.freeQ = 40; gun.freeCorrect = 31;
        out = String(await R.Screens.today.render());
        expect(out.indexOf('Plan dışı: 40 soru') >= 0).toBe(true);
        expect(out.indexOf('31 doğru') >= 0).toBe(true);
      });
    });
  });

  /* Kullanıcı kararı (2026-09-24): yıllık tatil sınırı değiştirilebilir.
     «Tatil modu» açılınca sınır ve bu yıl kalan gün görünür. */
  describe('Tatil sınırı alanı', () => {
    it('tatil seçiminde yıllık sınır ve kalan gün görünür', async () => {
      resetState();
      /* Uygulamada state.js kurar; test ortamında kurulmamış olabilir. */
      const kurduk = !R.Seri;
      if(kurduk) R.Seri = LIFEOS.Seri.kur({ store:() => R.Store, bugun:() => R.U.todayISO() });
      await R.Seri.yukle();
      R.S.ui.tatilSec = true;
      /* Seri kartı tek tasarımda Bugün'den «Bugün › Ayrıntı»ya (R.Screens.gun)
         taşınıyor; alan hangisindeyse orada aranır. */
      const out = String(await R.Screens.today.render())
        + (R.Screens.gun ? String(await R.Screens.gun.render()) : '');
      R.S.ui.tatilSec = false;
      if(kurduk) delete R.Seri;
      expect(out.indexOf('id="seri-tatil-sinir"') >= 0).toBe(true);
      expect(out.indexOf('data-act="seri-tatil-sinir"') >= 0).toBe(true);
      expect(out.indexOf('Yıllık tatil sınırı') >= 0).toBe(true);
    });
  });
})();
