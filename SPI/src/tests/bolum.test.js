/* Bölüm gizleme — SPİ.

   Herkes her alanı izlemez: bütçe tutmayan birine Finans'ı, mutfakla
   ilgilenmeyene Mutfak'ı göstermek gezinmeyi uzatır. Gizlenen bölümün
   VERİSİ SİLİNMEZ. Günlük, Testler, Ofis, Hane ve Rehber çekirdektir,
   gizlenemez. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = SP.Test;
  const B = () => SP.Bolum, P = () => SP.Proposals;

  function reset(){ resetState(); SP.S.bolumGizli = {}; }

  describe('Bölüm — gizleme', () => {
    it('çekirdek bölümler gizlenemez', async () => {
      reset();
      const ids = B().GIZLENEBILIR.map(b => b.id);
      ['today', 'labs', 'office', 'team', 'family', 'guide']
        .forEach(id => expect(ids.indexOf(id)).toBe(-1));
      expect((await B().set('labs', false)).ok).toBeFalsy();
    });

    it('gizlenen bölüm geri açılır', async () => {
      reset();
      await B().set('basket', false);
      expect(B().gizli('basket')).toBe(true);
      await B().set('basket', true);
      expect(B().gizli('basket')).toBe(false);
    });

    it('palette gizli bölümün sayfası ve eylemi görünmez', async () => {
      reset();
      await B().set('move', false);
      const hedefler = SP.Palette.commands().map(c => c.route).filter(Boolean);
      expect(hedefler.indexOf('move')).toBe(-1);
      expect(hedefler.indexOf('today') >= 0).toBeTruthy();
    });
  });

  describe('Bölüm — aksiyon ve konuşma', () => {
    it('açıp kapamak orta seviyedir; onaylanınca gizlenir, geri alınır', async () => {
      reset();
      await withTodayAsync('2026-03-01', async () => {
        expect(P().eylem('bolum-ac-kapa').level).toBe('orta');
        const t = await P().talep({ action:'bolum-ac-kapa', source:'istek',
          params:{ bolum:'basket', acik:0 } });
        expect(t.otomatik).toBe(false);
        expect(B().gizli('basket')).toBe(false);
        await P().approve(t.row.id);
        expect(B().gizli('basket')).toBe(true);
        await P().undo(t.row.id);
        expect(B().gizli('basket')).toBe(false);
      });
    });

    it('«finans bölümünü kapat» ve «hareketi geri aç» anlaşılır', () => {
      expect(B().anla('finans bölümünü kapat').oneriler[0])
        .toEqual({ action:'bolum-ac-kapa', params:{ bolum:'basket', acik:0 }, metin:'finans bölümünü kapat' });
      expect(B().anla('hareket bölümünü geri aç').oneriler[0].params)
        .toEqual({ bolum:'move', acik:1 });
    });

    it('belirsiz istek sorulur, konuşma istek değildir', () => {
      const r = B().anla('bu bölümü kapat');
      expect(r.oneriler).toHaveLength(0);
      expect(r.sorular.length).toBe(1);
      expect(B().anla('hareket nasıl gidiyor').komut).toBe(false);
      expect(B().anla('uyku 7 saat').komut).toBe(false);
    });
  });
})();
