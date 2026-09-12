/* Akustik katman — temiz esik, plato ve WPM. */

(function(){
  const { describe, it, expect, resetState, withToday, pushPiece } = ESP.Test;
  const A = ESP.Acoustic, S = ESP.S, U = ESP.U;

  describe('metronom zamanlamasi', () => {

    it('60 BPM saniyede bir vurustur', () => {
      expect(A.beatMs(60)).toBe(1000);
    });

    it('gecersiz tempo null doner — uydurulmus bir aralik uretilmez', () => {
      expect(A.beatMs(0)).toBe(null);
      expect(A.beatMs('abc')).toBe(null);
    });

    it('olcunun ilk vurusu vurguludur', () => {
      const b = A.beatsOfBar(120, 4);
      expect(b.length).toBe(4);
      expect(b[0].accent).toBe(true);
      expect(b[1].accent).toBe(false);
    });
  });

  describe('temiz esik', () => {

    it('uc temiz tekrar olmadan esik ACILMAZ', () => {
      withToday('2026-09-12', () => {
        resetState();
        const p = pushPiece('Gam');
        p.attempts = [
          { date:'2026-09-12', bpm:100, clean:true },
          { date:'2026-09-11', bpm:100, clean:true },
        ];
        expect(A.cleanThreshold(p, '2026-09-12').cert).toBe('missing');
      });
    });

    it('ayni tempoda uc temiz tekrar esigi acar', () => {
      withToday('2026-09-12', () => {
        resetState();
        const p = pushPiece('Gam');
        p.attempts = [
          { date:'2026-09-12', bpm:100, clean:true },
          { date:'2026-09-11', bpm:100, clean:true },
          { date:'2026-09-10', bpm:100, clean:true },
        ];
        const t = A.cleanThreshold(p, '2026-09-12');
        expect(t.cert).toBe('measured');
        expect(t.value).toBe(100);
      });
    });

    it('hatali tekrarlar esige SAYILMAZ', () => {
      withToday('2026-09-12', () => {
        resetState();
        const p = pushPiece('Gam');
        p.attempts = [
          { date:'2026-09-12', bpm:120, clean:false },
          { date:'2026-09-11', bpm:120, clean:false },
          { date:'2026-09-10', bpm:120, clean:false },
        ];
        expect(A.cleanThreshold(p, '2026-09-12').cert).toBe('missing');
      });
    });

    it('esik KENDILIGINDEN DUSMEZ — kotu hafta kazanimi silmez', () => {
      withToday('2026-10-30', () => {
        resetState();
        const p = pushPiece('Gam', { cleanBpm:120 });
        p.attempts = [{ date:'2026-08-01', bpm:120, clean:true }];
        const t = A.cleanThreshold(p, '2026-10-30');
        expect(t.value).toBe(120);
        expect(t.fresh).toBe(false);
      });
    });

    it('pencere disindaki temiz tekrar yeni esik ACMAZ', () => {
      withToday('2026-10-30', () => {
        resetState();
        const p = pushPiece('Gam');
        p.attempts = [
          { date:'2026-08-01', bpm:140, clean:true },
          { date:'2026-08-02', bpm:140, clean:true },
          { date:'2026-08-03', bpm:140, clean:true },
        ];
        expect(A.cleanThreshold(p, '2026-10-30').cert).toBe('missing');
      });
    });

    it('siradaki basamak esikten turetilir; esik yoksa oneri de yok', () => {
      resetState();
      const p = pushPiece('Gam');
      expect(A.nextStep(p).cert).toBe('missing');
    });
  });

  describe('plato', () => {

    it('hic calisilmamis parca PLATO SAYILMAZ', () => {
      withToday('2026-09-12', () => {
        resetState();
        const p = pushPiece('Gam', { cleanBpm:100, thresholdAt:'2026-06-01' });
        p.attempts = [{ date:'2026-06-01', bpm:100, clean:true }];
        expect(A.plateaus('2026-09-12').length).toBe(0);
      });
    });

    it('calisilan ama esigi ilerlemeyen parca platodur', () => {
      withToday('2026-09-12', () => {
        resetState();
        const p = pushPiece('Gam', { cleanBpm:100, thresholdAt:'2026-08-20' });
        p.attempts = [{ date:'2026-09-11', bpm:100, clean:true }];
        const pl = A.plateaus('2026-09-12');
        expect(pl.length).toBe(1);
        expect(pl[0].bpm).toBe(100);
      });
    });

    it('esigi hic olculmemis parca plato sayilmaz', () => {
      withToday('2026-09-12', () => {
        resetState();
        const p = pushPiece('Gam');
        p.attempts = [{ date:'2026-09-11', bpm:100, clean:false }];
        expect(A.plateaus('2026-09-12').length).toBe(0);
      });
    });
  });

  describe('hedefe ulasma', () => {

    it('hedefi girilmemis parca paydaya GIRMEZ', () => {
      resetState();
      pushPiece('Gam', { cleanBpm:100 });
      pushPiece('Etüt', { cleanBpm:100, targetBpm:120 });
      const r = A.progressRatio();
      expect(r.n).toBe(1);
    });

    it('hic hedefli parca yoksa oran URETILMEZ', () => {
      resetState();
      pushPiece('Gam', { cleanBpm:100 });
      expect(A.progressRatio().cert).toBe('missing');
    });
  });

  describe('diksiyon', () => {

    it('WPM icin hem sure hem kelime OLCULMUS olmali', () => {
      const r = A.wpmOf({ seconds:30, secondsCert:'measured', words:null, wordsCert:'missing' });
      expect(r.cert).toBe('missing');
    });

    it('WPM dakikadaki kelimedir', () => {
      const r = A.wpmOf({ seconds:30, secondsCert:'measured', words:70, wordsCert:'measured' });
      expect(r.value).toBe(140);
    });

    it('hata orani DAIMA tahmin etiketi tasir', () => {
      const r = A.errorRateOf({ errors:2, errorsCert:'estimated', words:40, wordsCert:'measured' });
      expect(r.cert).toBe('estimated');
    });

    it('kayit yoksa durum «veri yok» doner', () => {
      withToday('2026-09-12', () => {
        resetState();
        expect(A.dictionStatus(30, '2026-09-12').cert).toBe('missing');
      });
    });

    it('iki pencerede de olcum yoksa egilim URETILMEZ', () => {
      withToday('2026-09-12', () => {
        resetState();
        expect(A.dictionTrend('2026-09-12').cert).toBe('missing');
      });
    });
  });
})();
