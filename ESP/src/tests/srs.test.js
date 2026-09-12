/* Aralikli tekrar motoru. */

(function(){
  const { describe, it, expect, resetState, withToday, pushCard } = ESP.Test;
  const SRS = ESP.SRS, S = ESP.S, U = ESP.U;

  describe('zamanlama', () => {

    it('dogru cevap araligi uzatir', () => {
      const c = ESP.Model.newCard({ box:2, ease:2.5, interval:1 });
      const n = SRS.schedule(c, 'good', '2026-09-12');
      expect(n.box).toBe(3);
      expect(n.interval > 1).toBe(true);
      expect(n.due > '2026-09-12').toBe(true);
    });

    it('yanlis cevap kutuyu basa dondurur ama ease\'i SIFIRLAMAZ', () => {
      const c = ESP.Model.newCard({ box:4, ease:2.5, interval:7, reps:6 });
      const n = SRS.schedule(c, 'again', '2026-09-12');
      expect(n.box).toBe(1);
      expect(n.ease > SRS.EASE_MIN).toBe(true);
      expect(n.lapses).toBe(1);
    });

    it('yanlis cevaplanan kart AYNI GUN tekrar sorulur', () => {
      const c = ESP.Model.newCard({ box:3 });
      const n = SRS.schedule(c, 'again', '2026-09-12');
      expect(n.due).toBe('2026-09-12');
    });

    it('«zor» kutuyu yukseltmez ama araligi dondurmaz', () => {
      const c = ESP.Model.newCard({ box:3, ease:2.5, interval:3 });
      const n = SRS.schedule(c, 'hard', '2026-09-12');
      expect(n.box).toBe(3);
      expect(n.interval >= 1).toBe(true);
    });

    it('«kolay» araligi «iyi»den daha cok uzatir', () => {
      const c = ESP.Model.newCard({ box:3, ease:2.5, interval:3 });
      const iyi = SRS.schedule(c, 'good', '2026-09-12');
      const kolay = SRS.schedule(c, 'easy', '2026-09-12');
      expect(kolay.interval >= iyi.interval).toBe(true);
    });

    it('ease alt sinirin altina inmez', () => {
      let c = ESP.Model.newCard({ ease:1.35 });
      for(let i = 0; i < 10; i++){
        const n = SRS.schedule(c, 'again', '2026-09-12');
        c = Object.assign(c, n);
      }
      expect(c.ease >= SRS.EASE_MIN).toBe(true);
    });

    it('bilinmeyen cevap null doner — uydurulmus bir zamanlama uretilmez', () => {
      expect(SRS.schedule(ESP.Model.newCard(), 'harika')).toBe(null);
    });
  });

  describe('kuyruk', () => {

    it('vadesi gecen kart once gelir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushCard({ front:'a', due:'2026-09-12' });
        pushCard({ front:'b', due:'2026-09-05' });
        const q = SRS.dueCards();
        expect(q[0].front).toBe('b');
      });
    });

    it('ileri tarihli kart kuyruga girmez', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushCard({ front:'a', due:'2026-09-20' });
        expect(SRS.dueCards().length).toBe(0);
      });
    });

    it('gecikme gun olarak olculur', () => {
      withToday('2026-09-12', () => {
        resetState();
        const c = pushCard({ front:'a', due:'2026-09-05' });
        expect(SRS.overdueDays(c)).toBe(7);
      });
    });
  });

  describe('retansiyon', () => {

    it('hic cevaplanmamis kart ortalamaya GIRMEZ', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushCard({ front:'a', reps:0 });
        pushCard({ front:'b', reps:0 });
        const r = SRS.retention();
        expect(r.cert).toBe('missing');
        expect(r.n).toBe(0);
        expect(r.total).toBe(2);
      });
    });

    it('kapsam ekranda yazilabilsin diye n ve total ayri doner', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushCard({ front:'a', reps:3, box:3, interval:3, ease:2.5, due:'2026-09-14' });
        pushCard({ front:'b', reps:0 });
        const r = SRS.retention();
        expect(r.n).toBe(1);
        expect(r.total).toBe(2);
        expect(r.cert).toBe('derived');
      });
    });

    it('gecen sure arttikca hatirlama olasiligi DUSER', () => {
      const c = ESP.Model.newCard({ reps:3, box:3, interval:6, ease:2.5, due:'2026-09-12' });
      const yakin = SRS.retentionOf(c, '2026-09-07');
      const uzak = SRS.retentionOf(c, '2026-09-30');
      expect(yakin > uzak).toBe(true);
    });

    it('retansiyon 0 ile 1 arasinda kalir', () => {
      const c = ESP.Model.newCard({ reps:1, box:2, interval:1, ease:2.5, due:'2026-09-12' });
      const r = SRS.retentionOf(c, '2026-12-31');
      expect(r >= 0 && r <= 1).toBe(true);
    });
  });

  describe('cevap islemek', () => {

    it('cevap gecmise tek satir dusurur ve vadeyi ilerletir', async () => {
      await ESP.Test.withTodayAsync('2026-09-12', async () => {
        resetState();
        const c = pushCard({ front:'a', due:'2026-09-12' });
        const res = await ESP.SRS.answer(c.id, 'good');
        expect(res.ok).toBe(true);
        expect(res.card.history.length).toBe(1);
        expect(res.card.due > '2026-09-12').toBe(true);
      });
    });

    it('gecmis 50 satirla sinirlidir', async () => {
      await ESP.Test.withTodayAsync('2026-09-12', async () => {
        resetState();
        const c = pushCard({ front:'a', due:'2026-09-12' });
        c.history = new Array(60).fill(0).map(() => ({ at:'2026-01-01T00:00:00Z', grade:'good' }));
        await ESP.SRS.answer(c.id, 'good');
        expect(S.cards[0].history.length).toBe(50);
      });
    });

    it('olmayan kart sessizce basarili donmez', async () => {
      resetState();
      const res = await ESP.SRS.answer('yok', 'good');
      expect(res.ok).toBe(false);
    });
  });

  describe('aktif kelime', () => {

    it('kutusu yuksek olmak karti AKTIF yapmaz', () => {
      resetState();
      pushCard({ front:'a', box:5, active:false });
      expect(SRS.activeCount()).toBe(0);
    });
  });
})();
