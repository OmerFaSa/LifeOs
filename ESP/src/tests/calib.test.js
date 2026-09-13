/* Kalibrasyon defteri — sistem söylemeden önce sen söyle. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = ESP.Test;
  const K = () => ESP.Calib;
  const S = ESP.S;

  /* Kapanmis tahminleri dogrudan kurar: konusu puan olan bir testin
     girdisi tek satir olmali. */
  function kapali(kind, guess, actual){
    S.forecasts.push(ESP.Calib.norm({
      kind, guess, actual, at:'2026-03-01T10:00:00.000Z',
      settledAt:'2026-03-08T10:00:00.000Z',
    }));
  }

  describe('kalibrasyon · kayit', () => {

    it('bilinmeyen tur ve sayi olmayan tahmin reddedilir', async () => {
      resetState();
      expect((await K().open('astroloji', 5)).ok).toBeFalsy();
      expect((await K().open('minutes', 'çok')).ok).toBeFalsy();
      expect((await K().open('minutes', -3)).ok).toBeFalsy();
    });

    it('ikili tahminde olasilik 0–1 disina cikamaz', async () => {
      resetState();
      expect((await K().open('gate', 1.4)).ok).toBeFalsy();
      expect((await K().open('gate', 0.7)).ok).toBeTruthy();
    });

    /* Vadesi gelmemis tahmin kapanmaz: erken kapanis tahmini kolaylastirir. */
    it('vadesinden once kapanmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        const a = await K().open('minutes', 200, { dueAt:'2026-03-20' });
        const r = await K().settle(a.forecast.id, 180);
        expect(r.ok).toBeFalsy();
        expect(r.early).toBeTruthy();
      });
    });

    it('vadesi gelen tahmin kapanir ve iki kez kapanmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-21', async () => {
        const a = await K().open('minutes', 200, { dueAt:'2026-03-20' });
        expect((await K().settle(a.forecast.id, 180)).ok).toBeTruthy();
        expect((await K().settle(a.forecast.id, 190)).ok).toBeFalsy();
      });
    });

    it('acik tahmin listesi kapaninca bosalir', async () => {
      resetState();
      const a = await K().open('sessions', 10);
      expect(K().openList().length).toBe(1);
      await K().settle(a.forecast.id, 8);
      expect(K().openList().length).toBe(0);
      expect(K().settled().length).toBe(1);
    });
  });

  describe('kalibrasyon · puan', () => {

    /* Az sayida kayit hukum vermez. */
    it('bes kayittan az ise puan yok', () => {
      resetState();
      kapali('minutes', 100, 100);
      kapali('minutes', 100, 90);
      const p = K().score();
      expect(p.cert).toBe('missing');
      expect(p.ape).toBe(null);
    });

    it('kusursuz tahminlerde sapma sifir', () => {
      resetState();
      for(let i = 0; i < 6; i++) kapali('minutes', 120, 120);
      const p = K().score();
      expect(p.cert).toBe('measured');
      expect(p.ape).toBe(0);
      expect(p.grade).toBe('keskin');
    });

    it('sapma yuzdesi gercek degere gore olculur', () => {
      resetState();
      for(let i = 0; i < 5; i++) kapali('minutes', 120, 100);
      expect(Math.round(K().score().ape * 100)).toBe(20);
    });

    /* Sistemli abartma, rastgele sapmadan FARKLI bir bulgudur. */
    it('yanlilik yonu ayri olculur', () => {
      resetState();
      for(let i = 0; i < 6; i++) kapali('minutes', 150, 100);
      const b = K().score().bias;
      expect(b.cert).toBe('measured');
      expect(b.direction).toBe('over');
    });

    it('rastgele sapmada yanlilik gorunmez', () => {
      resetState();
      kapali('minutes', 120, 100); kapali('minutes', 80, 100);
      kapali('minutes', 130, 100); kapali('minutes', 70, 100);
      kapali('minutes', 100, 100); kapali('minutes', 100, 100);
      expect(K().score().bias.direction).toBe('even');
    });

    /* Yuzde sapma ile Brier ayni olcek degildir; ortalanmazlar. */
    it('ikili tahminler Brier ile ayri hesaplanir', () => {
      resetState();
      for(let i = 0; i < 5; i++) kapali('gate', 1, 1);
      const p = K().score();
      expect(p.brier).toBe(0);
      expect(p.ape).toBe(null);
    });

    it('tam ters ikili tahmin en kotu Brier verir', () => {
      resetState();
      for(let i = 0; i < 5; i++) kapali('gate', 1, 0);
      expect(K().score().brier).toBe(1);
    });

    /* Kor olmayan tahmin puana katilmaz: gercek deger ekrandayken yazilan
       sayi bir tahmin degil, kopyadir. */
    it('kor olmayan kayit puana girmez', () => {
      resetState();
      for(let i = 0; i < 6; i++){
        S.forecasts.push(ESP.Calib.norm({ kind:'minutes', guess:100, actual:100,
          blind:false, settledAt:'2026-03-08T10:00:00.000Z' }));
      }
      expect(K().score().cert).toBe('missing');
    });

    it('sifir gercek degerde sapma patlamaz', () => {
      resetState();
      for(let i = 0; i < 5; i++) kapali('minutes', 3, 0);
      const p = K().score();
      expect(isFinite(p.ape)).toBeTruthy();
    });
  });

  describe('kalibrasyon · vade', () => {

    it('vadesi gelen tahminler listelenir', async () => {
      resetState();
      await withTodayAsync('2026-03-15', async () => {
        await K().open('minutes', 100, { dueAt:'2026-03-10' });
        await K().open('minutes', 100, { dueAt:'2026-03-20' });
        await K().open('sessions', 5);
        expect(K().due().length).toBe(2);
      });
    });

    it('depodan yuklenen kayit normallesir', async () => {
      resetState();
      await ESP.Store.set('forecasts/x1', { id:'x1', kind:'bilinmeyen', guess:'5' });
      await K().load();
      expect(S.forecasts[0].kind).toBe('minutes');
      expect(S.forecasts[0].guess).toBe(5);
    });
  });
})();
