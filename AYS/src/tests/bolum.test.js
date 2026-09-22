/* Bölüm gizleme — sistemi kullanıcının hayatına göre daraltmak.

   Herkes her bölümü kullanmaz: video izlemeyen biri için «Öğrenme»,
   sınama yapmayan biri için «Sınama» yalnızca gezinmeyi uzatır. Gizlenen
   bölüm gezinmeden kalkar ama VERİSİ SİLİNMEZ; geri açıldığında her şey
   yerindedir. Çekirdek bölümler (Bugün, Hafta, Plan, Deneme, Tekrar,
   Ofis…) gizlenemez: sistemi kullanılamaz hâle getirirdi. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync, withToday } = R.Test;
  const B = R.Bolum, P = R.Proposals, S = R.S;

  function reset(){
    resetState();
    S.bolumGizli = {};
    S.officeProposals = [];
    S.officeProposalKeys = [];
    S.office = null;
  }

  describe('Bölüm — gizleme', () => {
    it('gizlenebilir bölümler çekirdeği içermez', () => {
      const ids = B.GIZLENEBILIR.map(b => b.id);
      ['today', 'week', 'plan', 'exams', 'cards', 'office', 'team', 'guide']
        .forEach(id => expect(ids.indexOf(id)).toBe(-1));
    });

    it('gizlenen bölüm gizli görünür, veri silinmez, geri açılır', async () => {
      reset();
      expect(B.gizli('quiz')).toBe(false);
      const r = await B.set('quiz', false);
      expect(r.ok).toBeTruthy();
      expect(B.gizli('quiz')).toBe(true);
      await B.set('quiz', true);
      expect(B.gizli('quiz')).toBe(false);
    });

    it('çekirdek bölüm gizlenemez', async () => {
      reset();
      const r = await B.set('today', false);
      expect(r.ok).toBeFalsy();
      expect(B.gizli('today')).toBe(false);
    });

    it('bozuk kayıt hiçbir şeyi gizlemez', async () => {
      reset();
      await R.Store.set(B.STORE, { gizli:'bozuk' });
      await B.yukle();
      expect(B.gizli('quiz')).toBe(false);
    });

    it('palette gizli bölümün «Git» komutu görünmez', async () => {
      reset();
      await B.set('quiz', false);
      const git = R.Palette.commands().filter(c => c.group === 'Git').map(c => c.route);
      expect(git.indexOf('quiz')).toBe(-1);
      expect(git.indexOf('today') >= 0).toBeTruthy();
    });
  });

  describe('Bölüm — aksiyon olarak', () => {
    it('bölüm açıp kapamak orta seviyedir: istense de onay bekler', async () => {
      await withTodayAsync('2026-11-10', async () => {
        reset();
        expect(R.ACTION_BY_ID['bolum-ac-kapa'].level).toBe('orta');
        const t = await P.talep({ action:'bolum-ac-kapa', agent:'patron', source:'istek',
          params:{ bolum:'learn', acik:0 } });
        expect(t.otomatik).toBe(false);
        expect(B.gizli('learn')).toBe(false);
        await P.approve(t.row.id);
        expect(B.gizli('learn')).toBe(true);
        await P.undo(t.row.id);
        expect(B.gizli('learn')).toBe(false);
      });
    });

    it('zaten kapalı bölümü kapatmak ve bilinmeyen bölüm reddedilir', async () => {
      reset();
      await B.set('learn', false);
      expect(P.check({ action:'bolum-ac-kapa', agent:'patron', params:{ bolum:'learn', acik:0 } }).ok).toBeFalsy();
      expect(P.check({ action:'bolum-ac-kapa', agent:'patron', params:{ bolum:'yok', acik:0 } }).ok).toBeFalsy();
      expect(P.check({ action:'bolum-ac-kapa', agent:'patron', params:{ bolum:'today', acik:0 } }).ok).toBeFalsy();
    });
  });

  describe('Bölüm — konuşarak', () => {
    const K = R.Komut;
    it('«sınama bölümünü kapat» ve «öğrenmeyi geri aç» anlaşılır', () => {
      withToday('2026-11-10', () => {
        const a = K.anla('sınama bölümünü kapat', { date:'2026-11-10' });
        expect(a.oneriler).toHaveLength(1);
        expect(a.oneriler[0].action).toBe('bolum-ac-kapa');
        expect(a.oneriler[0].params).toEqual({ bolum:'quiz', acik:0 });
        const b = K.anla('öğrenme bölümünü geri aç', { date:'2026-11-10' });
        expect(b.oneriler[0].params).toEqual({ bolum:'learn', acik:1 });
        expect(K.anla('rütbeyi gizle', { date:'2026-11-10' }).oneriler[0].params)
          .toEqual({ bolum:'rutbe', acik:0 });
      });
    });

    it('hangi bölüm olduğu belli değilse sorulur', () => {
      withToday('2026-11-10', () => {
        const r = K.anla('bu bölümü kapat', { date:'2026-11-10' });
        expect(r.oneriler).toHaveLength(0);
        expect(r.sorular.length).toBe(1);
      });
    });

    it('bölüm hakkında konuşmak istek değildir', () => {
      withToday('2026-11-10', () => {
        expect(K.anla('sınamada neden düşük çıkıyorum', { date:'2026-11-10' }).komut).toBe(false);
      });
    });
  });
})();
