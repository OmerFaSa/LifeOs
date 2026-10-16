/* Hazır öğün ve hazır antrenman (core/hazir.js). Kanıtladığı sözler:
   kullanıcının kendi kaydından saklanır; eklemek bugünün kaydıdır, gıda
   etiketi korunur, RPE ve not kopyalanmaz; geri alınır; aynı ad tek kayıt;
   cümledeki adla bulunur (en uzun ad kazanır, fiil gerekir). */

(function(){
  const { describe, it, expect, resetState, pushMeal, pushWorkout } = SP.Test;
  const H = () => SP.Hazir;
  const GUN = '2026-03-05';

  describe('Hazır öğün', () => {
    it('öğünden saklanır, tek dokunuşla eklenir, geri alınır', async () => {
      resetState();
      const m = pushMeal('2026-03-04', 'kahvalti', [['tavuk-gogsu', 120, 'measured']]);
      const s = await H().ogunSakla(m, '  Sabah   tabağı ');
      expect([s.ok, s.kayit.ad]).toEqual([true, 'Sabah tabağı']);
      expect(H().ogunler()).toHaveLength(1);
      const r = await H().ogunEkle(s.kayit.id, GUN, 'aksam');
      const yeni = SP.Model.mealsOf(GUN).find(x => x.id === r.id);
      expect([yeni.slot, yeni.items[0].g, yeni.items[0].cert, yeni.note]).toEqual(['aksam', 120, 'measured', 'Sabah tabağı']);
      /* kopya bağımsız: hazır öğün değişmez */
      yeni.items[0].g = 999;
      expect(H().ogunler()[0].items[0].g).toBe(120);
      await r.geriAl();
      expect(SP.Model.mealsOf(GUN).some(x => x.id === r.id)).toBe(false);
    });
    it('boş öğün saklanmaz; aynı ad eskisinin yerine geçer; silinir', async () => {
      resetState();
      expect((await H().ogunSakla({ slot:'ogle', items:[] }, 'x')).ok).toBe(false);
      const a = pushMeal(GUN, 'ogle', [['tavuk-gogsu', 100]]);
      const b = pushMeal(GUN, 'aksam', [['tavuk-gogsu', 200]]);
      await H().ogunSakla(a, 'Akşam');
      await H().ogunSakla(b, 'akşam');
      expect(H().ogunler().map(x => x.items[0].g)).toEqual([200]);
      expect((await H().ogunSil(H().ogunler()[0].id)).ok).toBe(true);
      expect(H().ogunler()).toHaveLength(0);
    });
  });

  describe('Hazır antrenman', () => {
    it('seanstan saklanır; RPE ve not kopyalanmaz; bugün eklendi bilinir; geri alınır', async () => {
      resetState();
      const w = pushWorkout('2026-03-04', { name:'Bacak günü', minutes:50, rpe:8, note:'yorgundum' });
      const s = await H().antrenmanSakla(w, '');
      expect(s.kayit.ad).toBe('Bacak günü');
      expect([s.kayit.kayit.rpe, s.kayit.kayit.note, s.kayit.kayit.id]).toEqual([undefined, undefined, undefined]);
      expect(H().bugunVar(s.kayit, GUN)).toBe(false);
      const r = await H().antrenmanEkle(s.kayit.id, GUN);
      const wk = SP.Model.workoutsOf(GUN)[0];
      expect([wk.name, wk.minutes, wk.rpe, wk.date, wk.note]).toEqual(['Bacak günü', 50, null, GUN, '']);
      expect(H().bugunVar(s.kayit, GUN)).toBe(true);
      await r.geriAl();
      expect(SP.Model.workoutsOf(GUN)).toHaveLength(0);
    });
  });

  describe('Hazır — cümleden bul', () => {
    it('adı ve fiili olan cümle bulunur; en uzun ad kazanır; fiilsiz cümle bulunmaz', async () => {
      resetState();
      const m = pushMeal(GUN, 'kahvalti', [['tavuk-gogsu', 120]]);
      await H().ogunSakla(m, 'Menemen');
      await H().ogunSakla(m, 'Menemen tabağı');
      await H().antrenmanSakla(pushWorkout(GUN, { name:'Bacak günü', minutes:50 }), '');
      expect(H().bul('menemen tabağımı yedim').hazir.ad).toBe('Menemen tabağı');
      expect(H().bul('Bugün bacak günü yaptım').tur).toBe('antrenman');
      expect(H().bul('menemen nasıl yapılır')).toBe(null);
      expect(H().bul('bacak günü yedim')).toBe(null);
    });
  });
})();
