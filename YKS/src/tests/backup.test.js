/* Otomatik yedek — kaza kurtarma katmanı.

   Bu paketin asıl işi bir sözü tutturmaktır: geri yükleme HER ZAMAN
   mümkün olmalı ve geri yüklemenin kendisi de geri alınabilmeli. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const B = R.Backup, M = R.Model, S = R.S, U = R.U;

  const TODAY = '2026-11-10';

  function reset(){
    resetState();
    B.clear();
  }

  /* Goruntu alinmasi icin "korunacak veri" esigi asilmali. */
  async function seed(n){
    for(let i = 0; i < (n || 6); i++){
      await M.saveCard(M.newCard({ id:'c' + i, front:'Ön ' + i, back:'Arka ' + i }));
    }
  }

  describe('Yedek — anlık görüntü', () => {
    it('korunacak veri yokken görüntü alınmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const res = B.take('elle');
        expect(res.ok).toBeFalsy();
        expect(B.list()).toHaveLength(0);
      });
    });

    it('veri birikince görüntü alınır ve kayıt sayısını taşır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await seed(6);
        const res = B.take('elle');
        expect(res.ok).toBeTruthy();
        expect(res.records >= 6).toBeTruthy();
        expect(B.list()).toHaveLength(1);
        expect(B.list()[0].reason).toBe('elle');
      });
    });

    it('en fazla iki görüntü tutulur, eskisi düşer', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await seed(6);
        const first = B.take('bir');
        B.take('iki');
        B.take('üç');
        const list = B.list();
        expect(list).toHaveLength(B.MAX_SNAPSHOTS);
        /* En yenisi basta, en eskisi atilmis olmali. */
        expect(list[0].reason).toBe('üç');
        expect(list.some(x => x.id === first.id)).toBeFalsy();
      });
    });

    it('görüntü zamanı gelmeden otomatik alım tekrarlamaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await seed(6);
        expect(B.maybeTake().ok).toBeTruthy();
        /* Ikinci cagri araligi doldurmadigi icin bir sey yapmamali. */
        expect(B.maybeTake().ok).toBeFalsy();
        expect(B.list()).toHaveLength(1);
      });
    });

    it('görüntü silinebilir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await seed(6);
        const res = B.take('elle');
        expect(B.remove(res.id)).toBeTruthy();
        expect(B.list()).toHaveLength(0);
      });
    });
  });

  describe('Yedek — geri yükleme', () => {
    it('geri yükleme o andaki veriyi geri getirir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await seed(6);
        const snap = B.take('elle');

        /* Goruntuden SONRA veri degisiyor. */
        await M.saveCard(M.newCard({ id:'sonradan', front:'Yeni', back:'Kart' }));
        expect(S.cards.some(c => c.id === 'sonradan')).toBeTruthy();

        const res = await B.restore(snap.id);
        expect(res.ok).toBeTruthy();
        await M.loadAll();
        /* Goruntude olmayan kart geri yuklemeyle gitmis olmali. */
        expect(S.cards.some(c => c.id === 'sonradan')).toBeFalsy();
        expect(S.cards.some(c => c.id === 'c0')).toBeTruthy();
      });
    });

    it('geri yüklemeden önce şu anki hâlin görüntüsü alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await seed(6);
        const snap = B.take('elle');
        await M.saveCard(M.newCard({ id:'sonradan', front:'Yeni', back:'Kart' }));

        await B.restore(snap.id);
        /* Yanlis goruntuyu secmek de bir kazadir: ondan da donulebilmeli. */
        expect(B.list().some(x => x.reason === 'geri yükleme öncesi')).toBeTruthy();
      });
    });

    it('olmayan görüntü geri yüklenemez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const res = await B.restore('yok');
        expect(res.ok).toBeFalsy();
        expect(res.why.length > 5).toBeTruthy();
      });
    });
  });

  describe('Yedek — durum', () => {
    it('durum iki katmanı ayrı ayrı bildirir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await seed(6);
        B.take('elle');
        const st = B.status();
        /* Kaza kurtarma katmani. */
        expect(st.count).toBe(1);
        expect(st.lastAgeHours).toBe(0);
        /* Disari alinan gercek yedek AYRI bir sey ve henuz alinmadi. */
        expect(st.exportAgeDays).toBe(null);
        expect(st.quota.pct >= 0).toBeTruthy();
      });
    });

    it('dışarı yedek alınınca yaşı sıfırlanır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await seed(6);
        await M.markBackup();
        expect(B.status().exportAgeDays).toBe(0);
        expect(B.status().exportDue).toBeFalsy();
      });
    });
  });
})();
