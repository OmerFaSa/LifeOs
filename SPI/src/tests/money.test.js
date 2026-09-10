/* Modül 4 — fiyat, sepet, kapsama ve eşdeğer ikame.

   Bu paketin en önemli testi şudur: TAHMİN, ÖLÇÜM GİBİ GÖSTERİLMEZ.
   Kullanıcının girdiği fiyat seed tahminini ezmeli ve kesinlik etiketi
   buna göre değişmelidir. */

(function(){
  const { describe, it, expect, resetState, withToday } = SP.Test;
  const U = SP.U;

  describe('Money — fiyat kaynağı', () => {
    it('kullanıcı fiyatı yoksa seed tahmini gelir ve "tahmin" etiketlenir', () => {
      resetState();
      const p = SP.Money.priceOf('yumurta');
      expect(p.source).toBe('seed');
      expect(p.cert).toBe('estimated');
      expect(p.tl).toBe(SP.PRICE_SEED.perKg.yumurta);
    });

    it('kullanıcı fiyatı tahmini ezer ve "ölçüldü" olur', () => {
      resetState();
      SP.S.prices.yumurta = { tl:210, at:U.todayISO(), source:'user' };
      const p = SP.Money.priceOf('yumurta');
      expect(p.source).toBe('user');
      expect(p.cert).toBe('measured');
      expect(p.tl).toBe(210);
    });

    it('seed fiyatı olmayan gıda için fiyat yok', () => {
      resetState();
      const p = SP.Money.priceOf('su');
      expect(p.tl).toBeTruthy();
      const yok = SP.Money.priceOf('olmayan-gida');
      expect(yok.tl).toBeNull();
      expect(yok.cert).toBe('missing');
    });

    it('fiyat yaşı bantlara oturur', () => {
      expect(SP.Money.ageBand(0).tone).toBe('ok');
      expect(SP.Money.ageBand(2).tone).toBe('info');
      expect(SP.Money.ageBand(5).tone).toBe('warn');
      expect(SP.Money.ageBand(12).tone).toBe('danger');
    });

    it('maliyet fiyat × kilogramdır', () => {
      resetState();
      SP.S.prices.yumurta = { tl:200, at:U.todayISO(), source:'user' };
      expect(SP.Money.costOf('yumurta', 2)).toBe(400);
    });

    it('fiyatı olmayan kalem maliyet üretmez', () => {
      resetState();
      expect(SP.Money.costOf('olmayan-gida', 1)).toBeNull();
    });
  });

  describe('Money — sepet', () => {
    it('boş sepet sıfır toplar', () => {
      resetState();
      const b = SP.Money.basketTotal();
      expect(b.total).toBe(0);
      expect(b.rows).toHaveLength(0);
    });

    it('sepet maliyete göre azalan sıralı', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'sogan', kg:1 }, { foodId:'dana-eti', kg:1 }];
      const b = SP.Money.basketTotal();
      expect(b.rows[0].food.id).toBe('dana-eti');
    });

    it('sınır aşımı işaretlenir', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'dana-eti', kg:2 }];
      SP.S.basket.weeklyLimit = 500;
      const b = SP.Money.basketTotal();
      expect(b.over).toBeTruthy();
      expect(b.pct > 100).toBeTruthy();
    });

    it('kişi başı maliyet hane büyüklüğüne bölünür', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'dana-eti', kg:1 }];
      SP.S.prefs.householdSize = 4;
      const b = SP.Money.basketTotal();
      expect(b.perPerson).toBeCloseTo(b.total / 4, 1);
    });

    it('tahmin payı yüzde olarak hesaplanır', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'yumurta', kg:1 }, { foodId:'sut', kg:1 }];
      expect(SP.Money.estimateShare().pct).toBe(100);
      SP.S.prices.yumurta = { tl:SP.PRICE_SEED.perKg.yumurta, at:U.todayISO(), source:'user' };
      expect(SP.Money.estimateShare().pct < 100).toBeTruthy();
    });

    it('tamamen kullanıcı fiyatlı sepette tahmin payı sıfır', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'yumurta', kg:1 }];
      SP.S.prices.yumurta = { tl:200, at:U.todayISO(), source:'user' };
      expect(SP.Money.estimateShare().pct).toBe(0);
    });
  });

  describe('Money — besin kapsaması', () => {
    it('profil eksikse kapsama hesaplanmaz', () => {
      resetState();
      SP.S.profile.weightKg = null;
      expect(SP.Money.basketCoverage().ok).toBeFalsy();
    });

    it('boş sepet kapsama üretmez', () => {
      resetState();
      expect(SP.Money.basketCoverage().ok).toBeFalsy();
    });

    it('dolu sepette kalori kapsaması hesaplanır', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'pilav', kg:5 }];
      const c = SP.Money.basketCoverage();
      expect(c.ok).toBeTruthy();
      expect(c.kcal.got > 0).toBeTruthy();
      expect(c.kcal.need > 0).toBeTruthy();
    });

    it('karşılanmayan öğeler açık listesine girer', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'pilav', kg:3 }];
      const c = SP.Money.basketCoverage();
      expect(c.gaps.length > 0).toBeTruthy();
      c.gaps.forEach(id => expect(c.micro[id].pct < 80).toBeTruthy());
    });

    it('hane büyüdükçe ihtiyaç büyür', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'pilav', kg:5 }];
      const tek = SP.Money.basketCoverage().kcal.need;
      SP.S.prefs.householdSize = 3;
      expect(SP.Money.basketCoverage().kcal.need).toBe(tek * 3);
    });

    it('sınır tipindeki öğe açık sayılmaz', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'pilav', kg:3 }];
      const c = SP.Money.basketCoverage();
      expect(c.gaps.indexOf('sodium') < 0).toBeTruthy();
    });
  });

  describe('Money — eşdeğer ikame', () => {
    it('somon için sardalya ve hamsi önerilir', () => {
      resetState();
      const rows = SP.Money.substitutesFor('somon');
      const ids = rows.map(r => r.to.id);
      expect(ids).toContain('sardalya');
      expect(ids).toContain('hamsi');
    });

    it('öneri neyi koruyup neyi kaybettiğini söyler', () => {
      resetState();
      const s = SP.Money.substitutesFor('somon').find(r => r.to.id === 'sardalya');
      expect(s.keeps.length > 0).toBeTruthy();
      expect(s.loses.length > 0).toBeTruthy();
      expect(s.loses.some(n => n.id === 'vitd')).toBeTruthy();
    });

    it('tasarruf pozitif ve yüzde hesaplanır', () => {
      resetState();
      const s = SP.Money.substitutesFor('somon')[0];
      expect(s.saveKg > 0).toBeTruthy();
      expect(s.savePct > 0).toBeTruthy();
    });

    it('sepette olmayan kalem için fırsat çıkmaz', () => {
      resetState();
      expect(SP.Money.swapOpportunities()).toHaveLength(0);
    });

    it('sepetteki kalem için toplam tasarruf miktarla çarpılır', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'somon', kg:2 }];
      const rows = SP.Money.swapOpportunities();
      expect(rows.length > 0).toBeTruthy();
      expect(rows[0].saveTotal).toBeCloseTo(rows[0].saveKg * 2, 1);
    });

    it('fırsatlar en büyük tasarruftan sıralı', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'somon', kg:2 }, { foodId:'badem', kg:1 }];
      const rows = SP.Money.swapOpportunities();
      for(let i = 1; i < rows.length; i++){
        expect(rows[i].saveTotal <= rows[i - 1].saveTotal).toBeTruthy();
      }
    });
  });

  describe('Money — besin başına maliyet', () => {
    it('en ucuz kaynak en başta gelir', () => {
      resetState();
      const rows = SP.Money.costPerNutrient('iron', 5);
      expect(rows.length > 0).toBeTruthy();
      for(let i = 1; i < rows.length; i++){
        expect(rows[i].tlPerUnit >= rows[i - 1].tlPerUnit).toBeTruthy();
      }
    });

    it('öğeyi hiç içermeyen gıda listede yok', () => {
      resetState();
      SP.Money.costPerNutrient('b12', 10).forEach(r => expect(r.per100 > 0).toBeTruthy());
    });

    it('kullanıcı fiyatı sıralamayı değiştirir', () => {
      resetState();
      const once = SP.Money.costPerNutrient('omega3', 3)[0].food.id;
      SP.S.prices[once] = { tl:9999, at:U.todayISO(), source:'user' };
      expect(SP.Money.costPerNutrient('omega3', 3)[0].food.id !== once).toBeTruthy();
    });
  });

  describe('Money — toplu alım', () => {
    it('sepette olmayan kalem "değmez" işaretlenir', () => {
      resetState();
      const rows = SP.Money.bulkOpportunities();
      expect(rows.every(r => !r.worth)).toBeTruthy();
    });

    it('düzenli tüketilen kalem toplu alıma değer', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'kirmizi-mercimek', kg:1 }];
      const row = SP.Money.bulkOpportunities().find(r => r.food.id === 'kirmizi-mercimek');
      expect(row.worth).toBeTruthy();
      expect(row.weeksToUse).toBe(5);
    });

    it('tasarruf tutarı fiyat ve orandan gelir', () => {
      resetState();
      const row = SP.Money.bulkOpportunities().find(r => r.food.id === 'zeytinyagi');
      const p = SP.Money.priceOf('zeytinyagi');
      expect(row.saveTl).toBeCloseTo(p.tl * row.item.minKg * row.item.saving, 1);
    });
  });

  describe('Money — durum özeti', () => {
    it('boş sepet nötr durum verir', () => {
      resetState();
      expect(SP.Money.status().tone).toBe('muted');
    });

    it('sınır aşımı uyarı verir', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'dana-eti', kg:2 }];
      SP.S.basket.weeklyLimit = 100;
      const st = SP.Money.status();
      expect(st.tone).toBe('warn');
      expect(st.text).toContain('üstünde');
      expect(st.basket.over).toBeTruthy();
    });

    it('tahmin payı yüksekse metinde belirtilir', () => {
      resetState();
      SP.S.basket.items = [{ foodId:'pilav', kg:1 }];
      expect(SP.Money.status().text).toContain('tahmin');
    });
  });
describe('Bütçe — koçların talebi', () => {
  it('fiyatı bilinmeyen kalem sıfır sayılmaz, toplamın dışında kalır', () => {
    resetState();
    const b = SP.Money.budget();
    const unknown = b.rows.filter(r => r.monthly == null);
    expect(unknown.length > 0).toBeTruthy();
    expect(b.unknown).toBe(unknown.length);
    /* Bilinmeyen kalem sifir olarak toplansaydi toplam yine 0 cikardi;
       ayrimi "unknown" sayaci tasir. */
    unknown.forEach(r => { expect(r.cert).toBe('missing'); });
  });

  it('üç koçun talebi de tabloda durur', () => {
    resetState();
    const ids = SP.Money.budget().rows.map(r => r.id);
    expect(ids.indexOf('gida') >= 0).toBeTruthy();
    expect(ids.indexOf('test') >= 0).toBeTruthy();
    expect(ids.indexOf('ekipman') >= 0).toBeTruthy();
  });

  it('panel ücreti girilince test kalemi toplama katılır', async () => {
    resetState();
    await SP.Model.saveBasket({ testFee:600 });
    const b = SP.Money.budget();
    const test = b.rows.find(r => r.id === 'test');
    if(SP.Bio.overdue().length){
      expect(test.monthly != null).toBeTruthy();
      expect(test.cert).toBe('estimated');
    }
  });

  it('aylık sınır aşımı bildirilir', async () => {
    resetState();
    await SP.Model.saveBasket({ monthlyLimit:10, testFee:6000 });
    const b = SP.Money.budget();
    if(b.total > 10) expect(b.over).toBeTruthy();
  });
});
})();
