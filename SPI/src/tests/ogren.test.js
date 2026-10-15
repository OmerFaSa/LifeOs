/* Öğren, Egzersiz Atlası, Programlar, Sınama ve MET testleri. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;

  describe('Öğren — kavramlar ve analizler', () => {
    it('30 öğrenme kavramı eksiksiz tanımlıdır', () => {
      expect(Array.isArray(SP.OGRENME_KAVRAMLAR)).toBeTruthy();
      expect(SP.OGRENME_KAVRAMLAR.length).toBe(30);
    });

    it('her kavram başlık, derinlik, tanım ve dikkat edilecekler taşır', () => {
      SP.OGRENME_KAVRAMLAR.forEach(c => {
        expect(typeof c.id).toBe('string');
        expect(typeof c.title).toBe('string');
        expect(typeof c.definition).toBe('string');
        expect(typeof c.watch).toBe('string');
        expect(['basit', 'orta', 'ileri']).toContain(c.content_depth);
      });
    });

    it('6 derin analiz modülü eksiksiz mevcuttur', () => {
      expect(Array.isArray(SP.DERIN_ANALIZLER)).toBeTruthy();
      expect(SP.DERIN_ANALIZLER.length).toBe(6);
    });

    it('22 kanıt kartı ve 12 spor-beslenme senaryosu mevcuttur', () => {
      expect(Array.isArray(SP.KANIT_KARTLARI)).toBeTruthy();
      expect(SP.KANIT_KARTLARI.length).toBe(22);
      expect(Array.isArray(SP.SPOR_BESLENME)).toBeTruthy();
      expect(SP.SPOR_BESLENME.length).toBe(12);
    });
  });

  describe('Öğren — hareket atlası ve programlar', () => {
    it('57 egzersiz kartı (50 pilot + 7 denge/başlangıç) eksiksiz mevcuttur', () => {
      expect(Array.isArray(SP.PILOT_EGZERSIZLER)).toBeTruthy();
      expect(SP.PILOT_EGZERSIZLER.length).toBe(57);
    });

    it('kartlar Türkçe ad, adımlar ve kurulum kontrolü taşır', () => {
      SP.PILOT_EGZERSIZLER.forEach(c => {
        expect(typeof c.id).toBe('string');
        expect(typeof c.name_tr).toBe('string');
        expect(Array.isArray(c.steps_tr)).toBeTruthy();
        expect(c.steps_tr.length > 0).toBeTruthy();
        expect(typeof c.setup_check).toBe('string');
      });
    });

    it('kart kimliği haritası doğru çalışır', () => {
      expect(SP.EXERCISE_CARD_BY_ID).toBeDefined();
      expect(SP.EXERCISE_CARD_BY_ID['pilot-Pushups']).toBeDefined();
      expect(SP.EXERCISE_CARD_BY_ID['pilot-Pushups'].name_tr).toBe('Şınav');
      expect(SP.EXERCISE_CARD_BY_ID['nhs-sit-stand']).toBeDefined();
      expect(SP.EXERCISE_CARD_BY_ID['nhs-sit-stand'].name_tr).toBe('Sandalyeden kalkma');
    });

    it('20 program açıklaması mevcuttur ve hareket kartlarına bağlanır', () => {
      expect(Array.isArray(SP.PROGRAMLAR)).toBeTruthy();
      expect(SP.PROGRAMLAR.length).toBe(20);
      SP.PROGRAMLAR.forEach(p => {
        expect(typeof p.id).toBe('string');
        expect(typeof p.title).toBe('string');
        expect(typeof p.goal).toBe('string');
        expect(Array.isArray(p.card_ids)).toBeTruthy();
      });
    });
  });

  describe('Öğren — sınama soruları', () => {
    it('50 teknik ve form kontrol sorusu mevcuttur', () => {
      expect(Array.isArray(SP.OGRENME_SORULAR)).toBeTruthy();
      expect(SP.OGRENME_SORULAR.length).toBe(50);
    });

    it('her soru soru metni, beklenen cevap ve ölçüt taşır', () => {
      SP.OGRENME_SORULAR.forEach(q => {
        expect(typeof q.id).toBe('string');
        expect(typeof q.question).toBe('string');
        expect(typeof q.answer).toBe('string');
        expect(typeof q.rubric).toBe('string');
      });
    });
  });

  describe('Öğren — MET referansları ve enerji hesabı', () => {
    it('1.111 MET referans kaydı eksiksiz mevcuttur', () => {
      expect(Array.isArray(SP.MET_RECORDS)).toBeTruthy();
      expect(SP.MET_RECORDS.length).toBe(1111);
    });

    it('kod ile MET kaydı hızlı taranabilir', () => {
      expect(SP.MET_BY_CODE).toBeDefined();
      const r = SP.MET_BY_CODE['03005'];
      expect(r).toBeDefined();
      expect(r.m).toBe(6.0);
      expect(r.cat).toBe('dancing');
    });

    it('SP.metKcal formülü doğru hesaplar', () => {
      /* 6.0 MET × 75 kg × (60 / 60) = 450 kcal */
      expect(SP.metKcal(6.0, 75, 60)).toBe(450);
      /* 4.0 MET × 80 kg × (30 / 60) = 160 kcal */
      expect(SP.metKcal(4.0, 80, 30)).toBe(160);
      expect(SP.metKcal(null, 75, 60)).toBeNull();
    });
  });

  describe('Nutri — referans kalibrasyonu (NIH ODS bulguları)', () => {
    it('Demir: 50 yaş kadın 18 mg, 51 yaş kadın 8 mg (menopoz ayrımı)', () => {
      resetState();
      const p50 = { sex:'female', birthYear: 2026 - 50, weightKg:60, heightCm:165 };
      const p51 = { sex:'female', birthYear: 2026 - 51, weightKg:60, heightCm:165 };
      expect(SP.Nutri.targets(p50).micro.iron.target).toBe(18);
      expect(SP.Nutri.targets(p51).micro.iron.target).toBe(8);
    });

    it('Kalsiyum: 50 yaş kadın 1000 mg, 51 yaş kadın 1200 mg', () => {
      resetState();
      const p50 = { sex:'female', birthYear: 2026 - 50, weightKg:60, heightCm:165 };
      const p51 = { sex:'female', birthYear: 2026 - 51, weightKg:60, heightCm:165 };
      expect(SP.Nutri.targets(p50).micro.calcium.target).toBe(1000);
      expect(SP.Nutri.targets(p51).micro.calcium.target).toBe(1200);
    });

    it('Kalsiyum: 60 yaş erkek 1000 mg (70 üstüne dek 1000)', () => {
      resetState();
      const p60 = { sex:'male', birthYear: 2026 - 60, weightKg:75, heightCm:175 };
      expect(SP.Nutri.targets(p60).micro.calcium.target).toBe(1000);
    });

    it('Kalsiyum: 17 yaş ergen 1300 mg', () => {
      resetState();
      const p17m = { sex:'male', birthYear: 2026 - 17, weightKg:65, heightCm:175 };
      const p17f = { sex:'female', birthYear: 2026 - 17, weightKg:55, heightCm:165 };
      expect(SP.Nutri.targets(p17m).micro.calcium.target).toBe(1300);
      expect(SP.Nutri.targets(p17f).micro.calcium.target).toBe(1300);
    });

    it('D vitamini: 70 yaş erkek 15 µg, 71+ yaş 20 µg', () => {
      resetState();
      const p70 = { sex:'male', birthYear: 2026 - 70, weightKg:75, heightCm:175 };
      const p75 = { sex:'male', birthYear: 2026 - 75, weightKg:75, heightCm:175 };
      expect(SP.Nutri.targets(p70).micro.vitd.target).toBe(15);
      expect(SP.Nutri.targets(p75).micro.vitd.target).toBe(20);
    });
  });

  describe('Move — genişletilmiş takma adlar (EX_ALIASES)', () => {
    it('SP.EX_ALIASES temel ve pilot egzersizleri içerir', () => {
      expect(Array.isArray(SP.EX_ALIASES)).toBeTruthy();
      expect(SP.EX_ALIASES.length > 50).toBeTruthy();
      const hasPushup = SP.EX_ALIASES.some(x => x.alias === 'şınav' || x.alias === 'Pushups');
      expect(hasPushup).toBeTruthy();
    });
  });

  describe('Dağıtık Entegrasyon — Öğün, Hareket ve Analiz', () => {
    it('SPİ çekmecelerinde Öğren sekmesi yoktur (fonksiyonel alanlara dağıtılmıştır)', () => {
      const hasOgren = (SP.App.SECTIONS || []).some(s => s.id === 'ogren');
      expect(hasOgren).toBe(false);
    });

    it('Öğün ekranı akıllı tahmin çipleri ve spor beslenme kartı içerir', async () => {
      expect(typeof SP.Screens.meals.render).toBe('function');
      const htmlMeals = await SP.Screens.meals.render();
      expect(typeof htmlMeals).toBe('string');
      expect(htmlMeals.includes('Akıllı öneri')).toBeTruthy();
      expect(htmlMeals.includes('quick-add-food')).toBeTruthy();
    });

    it('Hareket ekranı 20 program ve MET kalori butonları içerir', async () => {
      expect(typeof SP.Screens.move.render).toBe('function');
      const htmlMove = await SP.Screens.move.render();
      expect(typeof htmlMove).toBe('string');
      expect(htmlMove.includes('open-programs')).toBeTruthy();
      expect(htmlMove.includes('open-met-calc')).toBeTruthy();
    });

    it('Analiz ekranı fizyoloji & kavramlar sekmesi içerir', async () => {
      expect(typeof SP.Screens.analytics.render).toBe('function');
      const htmlAn = await SP.Screens.analytics.render();
      expect(typeof htmlAn).toBe('string');
      expect(htmlAn.includes('kavramlar') || htmlAn.includes('Fizyoloji')).toBeTruthy();
    });

    it('Besin kataloğu yeni spor ve Türk mutfağı öğelerini içerir', () => {
      const newItems = ['lor-peyniri', 'hindi-fume', 'chia-tohumu', 'kazein-protein', 'omlet'];
      newItems.forEach(id => {
        expect(SP.FOOD_BY_ID[id]).toBeDefined();
        expect(SP.FOOD_BY_ID[id].name).toBeDefined();
        expect(typeof SP.FOOD_BY_ID[id].kcal).toBe('number');
      });
    });
  });
})();
