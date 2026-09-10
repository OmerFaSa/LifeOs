/* Veri bütünlüğü — tablolar birbirine tutarlı mı?

   Bu paket mantık test etmez; VERİYİ test eder. Bir gıdaya olmayan bir
   mikro besin anahtarı yazmak ya da bir biyobelirtece ters referans aralığı
   koymak sessiz bir hatadır: ekran çizilir, sayı çıkar, ama yanlıştır.
   Bu yüzden tablolar en baştan denetlenir. */

(function(){
  const { describe, it, expect } = SP.Test;

  describe('Veri — biyobelirteçler', () => {
    it('her belirtecin id, ad, birim ve panel alanı var', () => {
      SP.BIOMARKERS.forEach(b => {
        expect(typeof b.id).toBe('string');
        expect(b.id.length > 0).toBeTruthy();
        expect(typeof b.name).toBe('string');
        expect(typeof b.unit).toBe('string');
        expect(SP.PANELS.some(p => p.id === b.panel)).toBeTruthy();
      });
    });

    it('id\'ler benzersiz', () => {
      const seen = {};
      SP.BIOMARKERS.forEach(b => {
        expect(seen[b.id]).toBeUndefined();
        seen[b.id] = true;
      });
    });

    it('dir alanı yalnızca low, high ya da mid', () => {
      SP.BIOMARKERS.forEach(b => {
        expect(['low', 'high', 'mid'].indexOf(b.dir) >= 0).toBeTruthy();
      });
    });

    it('referans aralığında alt sınır üst sınırdan küçük', () => {
      SP.BIOMARKERS.forEach(b => {
        const ranges = Array.isArray(b.ref) ? [b.ref] : Object.keys(b.ref).map(k => b.ref[k]);
        ranges.forEach(r => {
          expect(r.length).toBe(2);
          expect(r[0] < r[1]).toBeTruthy();
        });
      });
    });

    it('hedef bant referans aralığının içinde kalır', () => {
      SP.BIOMARKERS.forEach(b => {
        if(!b.optimal) return;
        const keys = Array.isArray(b.optimal) ? [null] : Object.keys(b.optimal);
        keys.forEach(k => {
          const opt = k == null ? b.optimal : b.optimal[k];
          const ref = k == null ? b.ref : (Array.isArray(b.ref) ? b.ref : b.ref[k]);
          if(!ref || !opt) return;
          expect(opt[0] >= ref[0]).toBeTruthy();
          expect(opt[1] <= ref[1]).toBeTruthy();
        });
      });
    });

    it('kırmızı bayrak eşikleri referans aralığının dışında', () => {
      SP.BIOMARKERS.forEach(b => {
        if(!b.red) return;
        const ref = Array.isArray(b.ref) ? b.ref : b.ref.male;
        if(!ref) return;
        if(b.red.below != null) expect(b.red.below <= ref[0]).toBeTruthy();
        if(b.red.above != null) expect(b.red.above >= ref[1]).toBeTruthy();
      });
    });

    it('takma adlar benzersiz — iki belirteç aynı adı paylaşmaz', () => {
      const seen = {};
      SP.BIOMARKERS.forEach(b => {
        [b.name].concat(b.aliases || []).forEach(n => {
          const key = SP.U.norm(n);
          expect(seen[key] === undefined || seen[key] === b.id).toBeTruthy();
          seen[key] = b.id;
        });
      });
    });

    it('türetilmiş ölçümlerin girdileri gerçek belirteç', () => {
      Object.keys(SP.DERIVED).forEach(id => {
        expect(SP.BIO_BY_ID[id]).toBeTruthy();
        SP.DERIVED[id].inputs.forEach(k => expect(SP.BIO_BY_ID[k]).toBeTruthy());
      });
    });

    it('beslenme bağı olan belirteçler gerçek besin öğesine işaret eder', () => {
      SP.BIOMARKERS.forEach(b => {
        (b.nutrients || []).forEach(n => {
          expect(SP.NUTRI_BY_ID[n] !== undefined || n === 'protein' || n === 'fat').toBeTruthy();
        });
      });
    });
  });

  describe('Veri — besin öğeleri', () => {
    it('her öğenin adı, birimi ve emilim notu var', () => {
      SP.NUTRIENTS.forEach(n => {
        expect(typeof n.name).toBe('string');
        expect(typeof n.unit).toBe('string');
        expect(typeof n.absorb.note).toBe('string');
      });
    });

    it('üst sınır günlük referansın üstünde', () => {
      SP.NUTRIENTS.forEach(n => {
        if(!n.ul || !n.rda || n.id === 'magnesium' || n.id === 'sodium') return;
        const base = n.rda.male || n.rda.female;
        if(base == null) return;
        expect(n.ul > base).toBeTruthy();
      });
    });

    it('işaretlenen ilgili ölçüm gerçek bir belirteç', () => {
      SP.NUTRIENTS.forEach(n => {
        if(!n.marker) return;
        expect(SP.BIO_BY_ID[n.marker]).toBeTruthy();
      });
    });

    it('emilim etkenleri sözlükte tanımlı', () => {
      SP.NUTRIENTS.forEach(n => {
        (n.absorb.boost || []).concat(n.absorb.block || []).forEach(f => {
          expect(SP.ABSORB_FACTORS[f]).toBeTruthy();
        });
      });
    });
  });

  describe('Veri — gıdalar', () => {
    it('her gıdanın id, ad, kategori ve makroları var', () => {
      SP.FOODS.forEach(f => {
        expect(typeof f.id).toBe('string');
        expect(SP.FOOD_CATS.some(c => c.id === f.cat)).toBeTruthy();
        ['kcal', 'p', 'f', 'c'].forEach(k => expect(typeof f[k]).toBe('number'));
      });
    });

    it('id\'ler benzersiz', () => {
      const seen = {};
      SP.FOODS.forEach(f => {
        expect(seen[f.id]).toBeUndefined();
        seen[f.id] = true;
      });
    });

    it('kalori makrolarla tutarlı — %20 sapma payı içinde', () => {
      /* Atwater katsayıları: protein ve karbonhidrat 4, yağ 9. Lif emilmez,
         bu yüzden karbonhidrattan düşülür ve 2 kcal/g ile sayılır — aksi hâlde
         ıspanak gibi yüksek lifli gıdalar olduğundan kalorili görünür. */
      SP.FOODS.forEach(f => {
        const net = Math.max(0, f.c - (f.fib || 0));
        const calc = f.p * 4 + f.f * 9 + net * 4 + (f.fib || 0) * 2;
        if(calc < 20) return;   /* su, çay gibi neredeyse sıfır kalorili gıdalar */
        const diff = Math.abs(calc - f.kcal) / f.kcal;
        expect(diff < 0.20).toBeTruthy();
      });
    });

    it('doymuş yağ toplam yağı geçmez', () => {
      SP.FOODS.forEach(f => {
        expect((f.sat || 0) <= f.f + 0.01).toBeTruthy();
      });
    });

    it('lif karbonhidratı geçmez', () => {
      SP.FOODS.forEach(f => {
        if(f.cat === 'kuruyemis') return;   /* keten tohumunda lif ölçümü ayrı yapılır */
        expect((f.fib || 0) <= f.c + 0.01).toBeTruthy();
      });
    });

    it('mikro besin anahtarları tanımlı öğelerden', () => {
      const known = {};
      SP.Nutri.MICROS.forEach(id => { known[id] = true; });
      SP.FOODS.forEach(f => {
        Object.keys(f.micro || {}).forEach(k => expect(known[k]).toBeTruthy());
      });
    });

    it('porsiyonların gramı pozitif ve etiketi var', () => {
      SP.FOODS.forEach(f => {
        (f.portions || []).forEach(p => {
          expect(p.g > 0).toBeTruthy();
          expect(typeof p.label).toBe('string');
        });
      });
    });

    it('demir tipi heme ya da nonheme', () => {
      SP.FOODS.forEach(f => {
        expect(['heme', 'nonheme'].indexOf(f.ironType) >= 0).toBeTruthy();
      });
    });

    it('emilim bayrakları sözlükte tanımlı', () => {
      SP.FOODS.forEach(f => {
        (f.flags || []).forEach(fl => expect(SP.ABSORB_FACTORS[fl]).toBeTruthy());
      });
    });
  });

  describe('Veri — fiyat ve ikame', () => {
    it('seed fiyatların hepsi gerçek gıdaya ait', () => {
      Object.keys(SP.PRICE_SEED.perKg).forEach(id => {
        expect(SP.FOOD_BY_ID[id]).toBeTruthy();
      });
    });

    it('seed fiyatlar pozitif', () => {
      Object.keys(SP.PRICE_SEED.perKg).forEach(id => {
        expect(SP.PRICE_SEED.perKg[id] > 0).toBeTruthy();
      });
    });

    it('ikame önerileri gerçek gıdalar arasında', () => {
      SP.SUBSTITUTES.forEach(s => {
        expect(SP.FOOD_BY_ID[s.forId]).toBeTruthy();
        expect(SP.FOOD_BY_ID[s.withId]).toBeTruthy();
        expect(s.forId !== s.withId).toBeTruthy();
      });
    });

    it('ikamenin koruduğu ve kaybettiği öğeler tanımlı', () => {
      SP.SUBSTITUTES.forEach(s => {
        expect(s.keeps.length > 0).toBeTruthy();
        s.keeps.concat(s.loses || []).forEach(id => {
          expect(SP.NUTRI_BY_ID[id] !== undefined || id === 'protein' || id === 'fat').toBeTruthy();
        });
      });
    });

    it('ikame gerçekten ucuz — seed fiyatta muadil daha düşük', () => {
      SP.SUBSTITUTES.forEach(s => {
        const a = SP.PRICE_SEED.perKg[s.forId], b = SP.PRICE_SEED.perKg[s.withId];
        if(a == null || b == null) return;
        expect(b < a).toBeTruthy();
      });
    });

    it('toplu alım kalemleri gerçek gıda ve tasarruf oranı makul', () => {
      SP.BULK_ITEMS.forEach(b => {
        expect(SP.FOOD_BY_ID[b.id]).toBeTruthy();
        expect(b.saving > 0 && b.saving < 0.5).toBeTruthy();
        expect(b.minKg > 0).toBeTruthy();
      });
    });
  });

  describe('Veri — hareket', () => {
    it('her hareketin merdiveni en az bir basamak', () => {
      SP.EXERCISES.forEach(e => {
        expect(e.levels.length > 0).toBeTruthy();
        e.levels.forEach(l => {
          expect(typeof l.id).toBe('string');
          expect(typeof l.name).toBe('string');
        });
      });
    });

    it('kalıplar tanımlı listeden', () => {
      SP.EXERCISES.forEach(e => {
        if(!e.pattern) return;
        expect(SP.PATTERNS.some(p => p.id === e.pattern)).toBeTruthy();
      });
    });

    it('MET değerleri makul aralıkta', () => {
      SP.EXERCISES.forEach(e => {
        expect(e.met >= 1.5 && e.met <= 15).toBeTruthy();
      });
    });

    it('seans şablonlarındaki hareketler gerçek', () => {
      SP.SESSION_TEMPLATES.forEach(t => {
        t.items.forEach(id => expect(SP.EX_BY_ID[id]).toBeTruthy());
      });
    });

    it('toparlanma girdilerinin ağırlıkları toplamı 1', () => {
      const sum = SP.U.sum(SP.READINESS_INPUTS.map(i => i.weight));
      expect(sum).toBeCloseTo(1, 2);
    });

    it('toparlanma bantları azalan eşikle sıralı', () => {
      for(let i = 1; i < SP.READINESS_BANDS.length; i++){
        expect(SP.READINESS_BANDS[i].min < SP.READINESS_BANDS[i - 1].min).toBeTruthy();
      }
      expect(SP.READINESS_BANDS[SP.READINESS_BANDS.length - 1].min).toBe(0);
    });
  });

  describe('Veri — kurallar ve ajanlar', () => {
    it('öncelik sırası 1\'den başlar ve boşluksuz artar', () => {
      SP.PRECEDENCE.forEach((p, i) => expect(p.rank).toBe(i + 1));
    });

    it('beş ajan var ve id\'leri benzersiz', () => {
      expect(SP.AGENTS).toHaveLength(5);
      const seen = {};
      SP.AGENTS.forEach(a => {
        expect(seen[a.id]).toBeUndefined();
        seen[a.id] = true;
      });
    });

    it('her ajanın alanı ve alan dışı tanımı var', () => {
      SP.AGENTS.forEach(a => {
        expect(a.scope.length > 10).toBeTruthy();
        expect(a.notScope.length > 10).toBeTruthy();
        expect(typeof a.brief).toBe('string');
      });
    });

    it('gündem sahipleri gerçek ajan', () => {
      SP.AGENDA_KINDS.forEach(k => expect(SP.AGENT_BY_ID[k.owner]).toBeTruthy());
    });

    it('kırmızı bayrak örüntülerinin girdileri gerçek belirteç', () => {
      SP.RED_FLAGS.patterns.forEach(p => {
        p.needs.forEach(id => expect(SP.BIO_BY_ID[id]).toBeTruthy());
      });
    });

    it('yasaklı desenler geçerli düzenli ifade', () => {
      SP.GROUNDING.banned.forEach(b => {
        expect(b.re instanceof RegExp).toBeTruthy();
        expect(typeof b.why).toBe('string');
      });
    });

    it('ölçüm kesinliği dört durumu tanımlar', () => {
      ['measured', 'estimated', 'derived', 'missing'].forEach(k => {
        expect(SP.CERTAINTY[k]).toBeTruthy();
        expect(typeof SP.CERTAINTY[k].label).toBe('string');
      });
    });
  });

  describe('Veri — ipuçları', () => {
    it('her ipucunun başlığı ve açıklaması var', () => {
      Object.keys(SP.HINTS).forEach(k => {
        const h = SP.HINTS[k];
        expect(typeof h.t).toBe('string');
        expect(h.b.length > 10).toBeTruthy();
      });
    });
  });
})();
