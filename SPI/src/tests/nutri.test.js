/* Modül 2 — hedefler, öğün hesabı, biyoyararlanım ve hane paylaştırması. */

(function(){
  const { describe, it, expect, resetState, withToday, pushLab, pushMeal } = SP.Test;
  const U = SP.U;

  describe('Nutri — enerji hesabı', () => {
    it('BMR Mifflin-St Jeor ile hesaplanır', () => {
      resetState();
      /* 78 kg, 178 cm, 30 yaş, erkek → 10*78 + 6.25*178 - 5*30 + 5 = 1747,5 */
      expect(SP.Nutri.bmr()).toBe(1748);
    });

    it('kadın için sabit farklıdır', () => {
      resetState();
      const p = Object.assign({}, SP.S.profile, { sex:'female' });
      expect(SP.Nutri.bmr(p)).toBe(1748 - 5 - 161);
    });

    it('profil eksikse hesap yapılmaz — tahmin üretilmez', () => {
      resetState();
      SP.S.profile.weightKg = null;
      expect(SP.Nutri.bmr()).toBeNull();
      expect(SP.Nutri.tdee()).toBeNull();
    });

    it('günlük ihtiyaç hareket çarpanıyla büyür', () => {
      resetState();
      const base = SP.Nutri.tdee();
      SP.S.profile.activity = 'athlete';
      expect(SP.Nutri.tdee() > base).toBeTruthy();
    });
  });

  describe('Nutri — hedefler', () => {
    it('eksik alanlar açıkça bildirilir', () => {
      resetState();
      SP.S.profile.heightCm = null;
      const t = SP.Nutri.targets();
      expect(t.ok).toBeFalsy();
      expect(t.missing).toContain('boy');
    });

    it('protein hedefi kilogram başına banttan gelir', () => {
      resetState();
      const t = SP.Nutri.targets();
      /* health hedefi: 1,2–1,6 g/kg × 78 kg */
      expect(t.protein.min).toBe(Math.round(1.2 * 78));
      expect(t.protein.max).toBe(Math.round(1.6 * 78));
    });

    it('kilo verme hedefinde protein bandı yükselir', () => {
      resetState();
      const before = SP.Nutri.targets().protein.min;
      SP.S.profile.goal = 'cut';
      expect(SP.Nutri.targets().protein.min > before).toBeTruthy();
    });

    it('kilo verme hedefinde kalori düşer', () => {
      resetState();
      const before = SP.Nutri.targets().kcal;
      SP.S.profile.goal = 'cut';
      expect(SP.Nutri.targets().kcal < before).toBeTruthy();
    });

    it('lif hedefi 1000 kalori başına 14 gram', () => {
      resetState();
      const t = SP.Nutri.targets();
      const beklenen = U.clamp(Math.round(t.kcal * 14 / 1000), 25, 50);
      expect(t.fiber).toBe(beklenen);
    });

    it('yağ alt sınırı kilogram başına 0,6 gramın altına inmez', () => {
      resetState();
      const t = SP.Nutri.targets();
      expect(t.fat.min >= Math.round(0.6 * 78)).toBeTruthy();
    });

    it('mikro hedefler cinsiyete göre değişir', () => {
      resetState();
      const male = SP.Nutri.targets().micro.iron.target;
      SP.S.profile.sex = 'female';
      const female = SP.Nutri.targets().micro.iron.target;
      expect(female > male).toBeTruthy();
    });

    it('sodyum sınır olarak işaretlenir', () => {
      resetState();
      expect(SP.Nutri.targets().micro.sodium.limit).toBeTruthy();
    });
  });

  describe('Nutri — laboratuvara bağlı hedef', () => {
    it('düşük ferritin demir hedefini yükseltir', () => {
      resetState();
      const before = SP.Nutri.targets().micro.iron.target;
      pushLab('2026-01-01', { ferritin:20 });
      const after = SP.Nutri.targets().micro.iron.target;
      expect(after > before).toBeTruthy();
    });

    it('yükseltmenin gerekçesi taşınır', () => {
      resetState();
      pushLab('2026-01-01', { ferritin:20 });
      const t = SP.Nutri.targets();
      expect(t.micro.iron.why.length > 10).toBeTruthy();
      expect(t.adjustments.iron.marker).toBe('ferritin');
    });

    it('hedef bandın altı, referans altından daha az yükseltir', () => {
      resetState();
      pushLab('2026-01-01', { ferritin:45 });   /* referans içi, hedef altı */
      const mild = SP.Nutri.targets().micro.iron.mult;
      resetState();
      pushLab('2026-01-01', { ferritin:20 });   /* referans altı */
      const strong = SP.Nutri.targets().micro.iron.mult;
      expect(strong > mild).toBeTruthy();
    });

    it('çarpanlar üst üste binmez — en güçlüsü geçerli', () => {
      resetState();
      pushLab('2026-01-01', { ferritin:20, hgb:11.5 });
      const t = SP.Nutri.targets();
      expect(t.micro.iron.mult).toBe(1.6);
    });

    it('yüksek LDL lif hedefini yükseltir', () => {
      resetState();
      const before = SP.Nutri.targets().fiber;
      pushLab('2026-01-01', { ldl:160 });
      expect(SP.Nutri.targets().fiber > before).toBeTruthy();
    });

    it('yüksek tansiyon sodyum sınırını daraltır', () => {
      resetState();
      const before = SP.Nutri.targets().micro.sodium.target;
      pushLab('2026-01-01', { sbp:145 });
      expect(SP.Nutri.targets().micro.sodium.target < before).toBeTruthy();
    });

    it('hedefteki ölçüm hiçbir hedefi değiştirmez', () => {
      resetState();
      const before = SP.Nutri.targets().micro.iron.target;
      pushLab('2026-01-01', { ferritin:150 });
      expect(SP.Nutri.targets().micro.iron.target).toBe(before);
    });
  });

  describe('Nutri — porsiyon ve katkı', () => {
    it('katkı gram oranına göre ölçeklenir', () => {
      const c = SP.Nutri.contribution('yumurta', 110);
      expect(c.kcal).toBeCloseTo(155 * 1.1, 1);
      expect(c.protein).toBeCloseTo(12.6 * 1.1, 1);
    });

    it('bilinmeyen gıda null döner', () => {
      expect(SP.Nutri.contribution('olmayan-gida', 100)).toBeNull();
    });

    it('ev ölçüsü grama çevrilir', () => {
      expect(SP.Nutri.portionGrams('kuru-fasulye-etli', '1 tabak')).toBe(250);
    });

    it('tanınmayan ölçü null döner', () => {
      expect(SP.Nutri.portionGrams('kuru-fasulye-etli', '1 kova')).toBeNull();
    });
  });

  describe('Nutri — biyoyararlanım', () => {
    it('hayvansal demir bitkiselden daha çok emilir', () => {
      const heme = SP.Nutri.absorbMeal([{ foodId:'dana-eti', g:150 }]);
      const nonHeme = SP.Nutri.absorbMeal([{ foodId:'kirmizi-mercimek', g:200 }]);
      const hemeOran = heme.absorbed.iron / heme.raw.micro.iron;
      const bitkiOran = nonHeme.absorbed.iron / nonHeme.raw.micro.iron;
      expect(hemeOran > bitkiOran).toBeTruthy();
    });

    it('C vitamini bitkisel demir emilimini artırır', () => {
      const yalin = SP.Nutri.absorbMeal([{ foodId:'kirmizi-mercimek', g:200 }]);
      const limonlu = SP.Nutri.absorbMeal([
        { foodId:'kirmizi-mercimek', g:200 },
        { foodId:'biber', g:60 },
      ]);
      expect(limonlu.iron.nonHemeFactor > yalin.iron.nonHemeFactor).toBeTruthy();
      expect(limonlu.notes.some(n => n.key === 'vitc' && n.kind === 'boost')).toBeTruthy();
    });

    it('çay aynı öğünde demir emilimini düşürür', () => {
      const yalin = SP.Nutri.absorbMeal([{ foodId:'kirmizi-mercimek', g:200 }]);
      const cayli = SP.Nutri.absorbMeal([
        { foodId:'kirmizi-mercimek', g:200 },
        { foodId:'cay', g:240 },
      ]);
      expect(cayli.iron.nonHemeFactor < yalin.iron.nonHemeFactor).toBeTruthy();
      expect(cayli.notes.some(n => n.key === 'tannin' && n.kind === 'block')).toBeTruthy();
    });

    it('yağsız öğünde D vitamini emilimi düşer', () => {
      const yagsiz = SP.Nutri.absorbMeal([{ foodId:'sut', g:200 }]);
      expect(yagsiz.notes.some(n => n.key === 'fat')).toBeTruthy();
    });

    it('yağlı öğün D vitamini taşınmasını artırır', () => {
      const yagli = SP.Nutri.absorbMeal([
        { foodId:'yumurta', g:110 }, { foodId:'zeytinyagi', g:14 },
      ]);
      expect(yagli.notes.some(n => n.key === 'fat' && n.kind === 'boost')).toBeTruthy();
    });

    it('emilim oranı hiçbir zaman %20\'yi geçmez', () => {
      const asiri = SP.Nutri.absorbMeal([
        { foodId:'kirmizi-mercimek', g:400 },
        { foodId:'biber', g:300 },
        { foodId:'portakal', g:300 },
      ]);
      expect(asiri.iron.nonHemeFactor <= 0.20).toBeTruthy();
    });

    it('emilen değer alınandan büyük olamaz', () => {
      const m = SP.Nutri.absorbMeal([{ foodId:'ciger', g:120 }]);
      SP.Nutri.MICROS.forEach(id => {
        if(id === 'sodium') return;
        expect(m.absorbed[id] <= m.raw.micro[id] + 0.001).toBeTruthy();
      });
    });

    it('bilinmeyen mikro besin sıfır sayılmaz, ayrıca raporlanır', () => {
      const özel = { id:'test-gida', name:'Test', cat:'yemek', kcal:100, p:5, f:2, c:12,
        micro:{ iron:1 }, ironType:'nonheme', flags:[], portions:[] };
      SP.FOODS.push(özel);
      SP.FOOD_BY_ID[özel.id] = özel;
      const m = SP.Nutri.absorbMeal([{ foodId:'test-gida', g:100 }]);
      expect(m.unknown.calcium).toBe(1);
      SP.FOODS.pop();
      delete SP.FOOD_BY_ID[özel.id];
    });
  });

  describe('Nutri — gün toplamı ve açıklar', () => {
    it('öğün girilmemiş gün "boş" işaretlenir', () => {
      resetState();
      const t = SP.Nutri.dayTotals('2026-01-01');
      expect(t.empty).toBeTruthy();
      expect(t.kcal).toBe(0);
    });

    it('gün toplamı öğünleri toplar', () => {
      resetState();
      pushMeal('2026-01-01', 'ogle', [['yumurta', 110]]);
      pushMeal('2026-01-01', 'aksam', [['yumurta', 110]]);
      const t = SP.Nutri.dayTotals('2026-01-01');
      expect(t.meals).toBe(2);
      expect(t.kcal).toBeCloseTo(155 * 2.2, 0);
    });

    it('girilmemiş gün ortalamaya katılmaz', () => {
      resetState();
      withToday('2026-01-07', () => {
        pushMeal('2026-01-07', 'ogle', [['yumurta', 110]]);
        const avg = SP.Nutri.windowAverage(7);
        expect(avg.days).toBe(1);
        expect(avg.kcal).toBeCloseTo(155 * 1.1, 0);
      });
    });

    it('hiç kayıt yoksa ortalama boş döner', () => {
      resetState();
      expect(SP.Nutri.windowAverage(7).empty).toBeTruthy();
    });

    it('açık listesi en büyük eksikten başlar', () => {
      resetState();
      withToday('2026-01-07', () => {
        pushMeal('2026-01-07', 'ogle', [['pilav', 180]]);
        const g = SP.Nutri.gaps(7);
        expect(g.ok).toBeTruthy();
        expect(g.rows.length > 0).toBeTruthy();
        for(let i = 1; i < g.rows.length; i++){
          expect(g.rows[i].pct >= g.rows[i - 1].pct).toBeTruthy();
        }
      });
    });

    it('sodyum aşımı "over" olarak işaretlenir', () => {
      resetState();
      withToday('2026-01-07', () => {
        pushMeal('2026-01-07', 'ogle', [['beyaz-peynir', 400], ['zeytin', 200]]);
        const g = SP.Nutri.gaps(7);
        const na = g.rows.find(r => r.id === 'sodium');
        expect(na).toBeTruthy();
        expect(na.kind).toBe('over');
      });
    });

    it('kaynak önerisi demir için hayvansalı öne alır', () => {
      const rows = SP.Nutri.sourcesFor('iron', 5);
      expect(rows.length).toBe(5);
      expect(rows[0].food.ironType).toBe('heme');
    });

    it('kaynak önerisi hiç içermeyen gıdayı listelemez', () => {
      const rows = SP.Nutri.sourcesFor('b12', 10);
      rows.forEach(r => expect(r.per100 > 0).toBeTruthy());
    });
  });

  describe('Nutri — hane paylaştırması', () => {
    function uye(name, kg, cm, yil, hedef){
      return { id:name, name, weightKg:kg, heightCm:cm, birthYear:yil,
        sex:'male', activity:'moderate', goal:hedef || 'health' };
    }

    it('eksik profil paylaştırmaya girmez', () => {
      resetState();
      const res = SP.Nutri.householdSplit('kuru-fasulye-etli', 1000,
        [{ id:'x', name:'Eksik', weightKg:null }]);
      expect(res.ok).toBeFalsy();
    });

    it('payların toplamı tencerenin tamamını verir', () => {
      resetState();
      const res = SP.Nutri.householdSplit('kuru-fasulye-etli', 1000,
        [uye('A', 80, 180, 1996), uye('B', 55, 162, 2000)]);
      expect(res.ok).toBeTruthy();
      const toplam = SP.U.sum(res.rows.map(r => r.share));
      expect(Math.abs(toplam - 1000) <= 2).toBeTruthy();
    });

    it('daha çok ihtiyacı olan daha büyük pay alır', () => {
      resetState();
      const res = SP.Nutri.householdSplit('kuru-fasulye-etli', 1000,
        [uye('Büyük', 95, 188, 1990), uye('Küçük', 48, 155, 2005)]);
      expect(res.rows[0].share > res.rows[1].share).toBeTruthy();
    });

    it('tencere yetersizse eksik gram bildirilir', () => {
      resetState();
      const res = SP.Nutri.householdSplit('kuru-fasulye-etli', 200,
        [uye('A', 80, 180, 1996), uye('B', 75, 175, 1998)]);
      expect(res.short > 0).toBeTruthy();
    });

    it('protein yetmezse yan gıda önerilir', () => {
      resetState();
      /* Pilav kalori taşır ama protein taşımaz: tencere tam ihtiyaç kadar
         olduğunda bile porsiyon protein hedefinin altında kalır. */
      const olcu = SP.Nutri.householdSplit('pilav', 1000, [uye('A', 80, 180, 1996)]);
      const res = SP.Nutri.householdSplit('pilav', olcu.wanted, [uye('A', 80, 180, 1996)]);
      expect(res.rows[0].addons.length > 0).toBeTruthy();
      expect(res.rows[0].addons[0].need).toBe('protein');
    });

    it('öğün payı oranı açıkça taşınır', () => {
      resetState();
      const res = SP.Nutri.householdSplit('kuru-fasulye-etli', 1000, [uye('A', 80, 180, 1996)]);
      expect(res.mealShare).toBe(0.35);
    });
  });
})();
