/* Hatırlatmalar (core/hatirlat.js, fikir 34 + 35). Kanıtladığı sözler:
   saat anlaşılmazsa tahmin edilmez; ilaç hatırlatması ilaç kaydına bağlıdır
   ve ilaç bırakılınca susar; işaretleme günün kaydıdır; bildirim izni
   yokken hiçbir şey gösterilmez. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const H = () => SP.Hatirlat;
  const saat = (iso, hhmm) => { const p = iso.split('-'), q = hhmm.split(':');
    return new Date(+p[0], +p[1] - 1, +p[2], +q[0], +q[1]); };

  describe('Hatırlatmalar', () => {
    it('saatler okunur, sıralanır; anlaşılmayan parça tahmin edilmez', () => {
      expect(H().saatOku('21.30, 8:00 13:15').saatler).toEqual(['08:00', '13:15', '21:30']);
      expect(H().saatOku('8:00, 8.00').saatler).toEqual(['08:00']);
      const r = H().saatOku('08:00, sabah');
      expect(r.ok).toBe(false);
      expect(r.why).toContain('sabah');
      expect(H().saatOku('25:00').ok).toBe(false);
      expect(H().saatOku('').ok).toBe(false);
    });

    it('ilaç hatırlatması kayda bağlıdır; ilaç bırakılınca susar', async () => {
      resetState();
      const m = SP.Model.newMed();
      m.name = 'Demir'; m.dose = 'günde 1×'; m.startDate = '2026-09-01';
      await SP.Model.saveMed(m);
      expect((await H().ekle({ tur:'ilac', medId:'yok', saatler:'08:00' })).ok).toBe(false);
      expect((await H().ekle({ tur:'ilac', medId:m.id, saatler:'21:00, 08:00' })).ok).toBe(true);
      const sabah = H().bugun(saat('2026-09-20', '09:00'));
      expect(sabah.map(r => [r.saat, r.ad, r.durum])).toEqual([['08:00', 'Demir', 'vakti'], ['21:00', 'Demir', 'sonra']]);
      /* doz notu hatırlatmada görünmez */
      expect(JSON.stringify(sabah).indexOf('günde')).toBe(-1);
      await SP.Model.stopMed(m.id, '2026-09-19');
      expect(H().bugun(saat('2026-09-20', '09:00'))).toHaveLength(0);
    });

    it('aynı tür ikinci kez eklenince saatleri güncellenir; işaret günün kaydıdır', async () => {
      resetState();
      await H().ekle({ tur:'su', saatler:'10:00' });
      await H().ekle({ tur:'su', saatler:'10:00, 14:00' });
      expect(H().durum().liste).toHaveLength(1);
      const r = H().bugun(saat('2026-09-20', '15:00'));
      expect(r.map(x => x.durum)).toEqual(['vakti', 'vakti']);
      await H().isaretle(r[0].anahtar, true, '2026-09-20');
      expect(H().bugun(saat('2026-09-20', '15:00')).map(x => x.durum)).toEqual(['yapildi', 'vakti']);
      expect(H().bugun(saat('2026-09-21', '15:00')).map(x => x.durum)).toEqual(['vakti', 'vakti']);
      await H().isaretle(r[0].anahtar, false, '2026-09-20');
      expect(H().bugun(saat('2026-09-20', '15:00'))[0].durum).toBe('vakti');
    });

    it('silinen hatırlatma geri konur', async () => {
      resetState();
      await H().ekle({ tur:'hareket', saatler:'11:00' });
      const id = H().durum().liste[0].id;
      const s = await H().sil(id);
      expect(H().durum().liste).toHaveLength(0);
      await H().geriKoy(s.geri);
      expect(H().durum().liste.map(h => h.tur)).toEqual(['hareket']);
    });

    it('bildirim kapalıyken ya da izin yokken hiçbir şey gösterilmez', async () => {
      resetState();
      await H().ekle({ tur:'su', saatler:'10:00' });
      expect(H().tik(saat('2026-09-20', '10:05'))).toBe(0);
    });
  });
})();
