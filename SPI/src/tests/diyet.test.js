/* Diyete otomatik işleme (Part 8c-3). Eklenen (BAM ya da elle) gıda SPİ'nin
   hesaplarına kendiliğinden girer; hesap nutri.js ve money.js'tedir, model
   değil. Kanıtladığı sözler:
     1. Protein ve lif «en yoğun kaynak» ve «en ucuz kaynak» listelerinde
        vardır (önceden `micro` altında arandıkları için boş dönüyordu).
     2. Bilinmeyen doymuş yağ ve lif SIFIR sayılmaz; «bilinmiyor» sayılır.
     3. «Tanınmadı» denetimi tanınmayan GIDAYI sayar, değeri bilinmeyen mikro
        besini değil. */

(function(){
  const { describe, it, expect, resetState, pushMeal } = SP.Test;
  const N = () => SP.Nutri;

  async function kinoa(patch){
    const f = Object.assign(SP.Model.newFood(), { name:'Kinoa (çiğ)', kcal:368, p:14.1, f:6.1,
      c:64.2, sat:null, fib:null, micro:{ iron:4.6 } }, patch || {});
    await SP.Model.saveFood(f);
    return f;
  }

  describe('Diyete otomatik işleme', () => {
    it('protein ve lif en yoğun ve en ucuz kaynaklarda var', async () => {
      resetState();
      const p = N().sourcesFor('protein', 5);
      expect(p.length).toBe(5);
      expect(p[0].per100).toBe(Math.max.apply(null, SP.FOODS.map(f => f.p)));
      expect(N().sourcesFor('fiber', 3)[0].per100 > 0).toBe(true);
      const ucuz = SP.Money.costPerNutrient('protein', 50);
      expect(ucuz.length > 0).toBe(true);
      const t = ucuz.find(r => r.food.id === 'tavuk-gogsu');
      expect(t.tlPerUnit).toBe(SP.U.round(t.price.tl / (31 * 10), 3));
      /* BAM'dan eklenen gıda ve tahmin fiyatı listeye kendiliğinden girer. */
      const k = await kinoa();
      SP.S.bamPrices = { [k.id]:{ tl:120, at:'2026-09-15' } };
      const r = SP.Money.costPerNutrient('protein', 200).find(x => x.food.id === k.id);
      expect([r.per100, r.cert, r.price.source]).toEqual([14.1, 'estimated', 'bam']);
    });

    it('bilinmeyen doymuş yağ ve lif sıfır sayılmaz', async () => {
      resetState();
      const k = await kinoa();
      const c = N().contribution(k.id, 200);
      expect([c.sat, c.fiber]).toEqual([null, null]);
      const a = N().absorbMeal([{ foodId:k.id, g:200 }, { foodId:'tavuk-gogsu', g:100 }]);
      expect(a.unknown.sat).toBe(1);
      expect(a.unknown.fiber).toBe(1);
      expect(a.raw.fiber).toBe(0);              /* tavuğun lifi 0, kinoanınki bilinmiyor */
      expect(a.raw.sat).toBe(1);                /* yalnız tavuk */
      expect(N().contribution('tavuk-gogsu', 100).sat).toBe(1);
    });

    it('teklif önizlemesi hedef payını ve gram protein maliyetini söyler', () => {
      resetState();
      const t = N().targets();
      const k = { id:7, dogruluk:'kaynakli', govde:{ tur:'besin', ad:'Kinoa',
        deger:{ kcal:368, p:14.1, f:6.1, c:64.2 } } };
      const s = SP.Bilgi.sina('besin.add', k, { kayit_id:7 });
      expect(s.onizleme.satirlar[0]).toContain('%' + Math.round(14.1 / t.protein.min * 100));
      const f = { id:8, dogruluk:'kaynakli', govde:{ tur:'fiyat', ad:'tavuk göğsü',
        fiyatlar:[{ market:'A', tl:310, miktar_g:1000 }] } };
      expect(SP.Bilgi.sina('fiyat.add', f, { kayit_id:8 }).onizleme.satirlar[0])
        .toContain('Gram protein başına ' + SP.U.fmtNet(SP.U.round(310 / 310, 3)) + ' TL');
      /* Profil eksikse pay UYDURULMAZ. */
      SP.S.profile = Object.assign({}, SP.S.profile, { weightKg:null });
      expect(SP.Bilgi.sina('besin.add', k, { kayit_id:7 }).onizleme.satirlar[0]).toContain('kcal');
    });

    it('«tanınmadı» denetimi gıdayı sayar, bilinmeyen mikroyu değil', async () => {
      resetState();
      const k = await kinoa();
      const gunler = SP.U.lastDays(14).slice(-6);
      gunler.forEach(d => pushMeal(d, 'ogle', [[k.id, 150]]));
      const bul = () => SP.Audit.of('meals').filter(f => f.id === 'meal-unknown')[0];
      expect(bul()).toBe(undefined);
      expect(N().dayTotals(gunler[0]).unknownFoods).toEqual([]);
      gunler.slice(0, 3).forEach(d => pushMeal(d, 'aksam', [['silinmis-gida', 100]]));
      expect(N().dayTotals(gunler[0]).unknownFoods).toEqual(['silinmis-gida']);
      const f = bul();
      expect(f.title).toContain('3 kalem');
      expect(f.items[0].id).toBe('silinmis-gida');
    });
  });
})();
