/* Evdekinden yemek (core/evdeki.js, fikir 29). Kanıtladığı sözler: tanınmayan
   malzeme geri söylenir; gerekli malzemesi tam olan önce, eksikli olan
   eksiğinin ADIYLA gelir; hiç malzemesi olmayan yemek önerilmez; listedeki
   her yemek gerçek bir gıda kaydıdır. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const E = () => SP.Evdeki;

  describe('Evdekinden yemek', () => {
    it('metinden malzeme okunur; tanınmayan parça geri söylenir', () => {
      const r = E().oku('Yumurta, 2 domates ve sivri biber; uçan halı');
      expect(r.var.sort()).toEqual(['biber', 'domates', 'yumurta']);
      expect(r.taninmayan).toEqual(['uçan halı']);
      expect(E().oku('taze fasulye, kuru fasulye').var.sort()).toEqual(['fasulye', 'taze_fasulye']);
    });

    it('tam olan önce; eksikli olan eksiğin adıyla; hiç malzemesi olmayan yok', () => {
      resetState();
      const l = E().oner(['yumurta', 'domates', 'biber', 'sogan']);
      expect(l[0].yemek.id).toBe('menemen');
      expect(l[0].eksik).toEqual([]);
      const tavuk = l.find(r => r.yemek.id === 'tavuk-sote');
      expect(tavuk.eksik).toEqual(['tavuk']);
      expect(l.some(r => r.yemek.id === 'pilav')).toBe(false);
      expect(l.every(r => r.eksik.length <= 2)).toBe(true);
    });

    it('«birini» isteyen yemek o gruptan biri yoksa eksik yazar', () => {
      resetState();
      const z = E().oner(['sogan', 'domates']).find(r => r.yemek.id === 'zeytinyagli-sebze');
      expect(z.eksik).toEqual(['taze fasulye / kabak / ıspanak']);
    });

    it('her yemek gerçek bir gıda kaydı; her malzeme sözlükte', () => {
      E().YEMEK.forEach(y => {
        expect(!!SP.FOOD_BY_ID[y.id]).toBe(true);
        y.gerek.concat(y.ister, y.birini || []).forEach(m => expect(!!E().MALZEME[m]).toBe(true));
      });
    });

    it('sepetteki gıdalar malzemeye çevrilir', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'yumurta', kg:1 }, { foodId:'kirmizi-mercimek', kg:1 }, { foodId:'elma', kg:1 }];
      expect(E().sepettenMalzeme().sort()).toEqual(['mercimek', 'yumurta']);
    });
  });
})();
