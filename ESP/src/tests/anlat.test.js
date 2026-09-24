/* Öğrendiğini anlat (core/anlat.js, fikir 42). Kanıtladığı sözler: model
   notlamaz, kavram sayılır; az kavramda ölçü yok; Türkçe ek tolere edilir
   ama başka kelimenin içinden eşleşme yapılmaz; metin kaydedilmez. */

(function(){
  const { describe, it, expect, resetState, pushBook, pushNote } = ESP.Test;
  const A = () => ESP.Anlat;
  const UZUN = 'Bu kitapta yazar demokrasinin temelini anlatıyor ve özgürlüğün seçebilme kapasitesi '
    + 'olduğunu söylüyor, bunu da uzun uzun örneklerle açıklıyor ve okura sorular soruyor.';

  describe('Öğrendiğini anlat', () => {
    it('az kavramda ya da kısa anlatımda ölçü yok', () => {
      resetState();
      const b = pushBook('Toplum Sözleşmesi', 'Rousseau');
      pushNote('Not', b.id, ['demokrasi', 'özgürlük']);
      expect(A().kapsam(UZUN, A().kavramlar(b.id)).ok).toBe(false);
      pushNote('Not 2', b.id, ['genel irade']);
      expect(A().kapsam('kısa', A().kavramlar(b.id)).why).toContain('kısa');
    });

    it('geçen ve geçmeyen kavram sayılır; ek tolere edilir', () => {
      resetState();
      const b = pushBook('Toplum Sözleşmesi', 'Rousseau');
      pushNote('Not', b.id, ['demokrasi', 'özgürlük']);
      pushNote('Not 2', b.id, ['genel irade', 'Demokrasi']);
      const k = A().kapsam(UZUN, A().kavramlar(b.id));
      expect(k.ok).toBe(true);
      expect(k.toplam).toBe(3);
      expect(k.gecen).toEqual(['demokrasi', 'özgürlük']);
      expect(k.gecmeyen).toEqual(['genel irade']);
      expect(k.oran).toBe(67);
    });

    it('kavram başka kelimenin içinden eşleşmez', () => {
      expect(A().gecer(ESP.U.norm('ahlaksızlık üzerine'), 'ahlak')).toBe(true);
      expect(A().gecer(ESP.U.norm('mahlak diye bir şey'), 'ahlak')).toBe(false);
    });

    it('kayıtta anlatımın metni yok, yalnız sayılar', async () => {
      resetState();
      const b = pushBook('Devlet', 'Platon');
      ['adalet', 'erdem', 'ruh'].forEach(k => pushNote('n', b.id, [k]));
      const k = A().kapsam('Platon adaletin ne olduğunu soruyor, erdemi ve ruhu üç parçaya ayırıyor, '
        + 'devleti de buna benzetiyor, her sınıfın kendi işini yapmasını adalet sayıyor ve bunu savunuyor.', A().kavramlar(b.id));
      await A().kaydet(b.id, k);
      const s = A().son(b.id);
      expect([s.gecen, s.toplam]).toEqual([3, 3]);
      expect(JSON.stringify(ESP.S.anlatim).indexOf('Platon')).toBe(-1);
    });
  });
})();
