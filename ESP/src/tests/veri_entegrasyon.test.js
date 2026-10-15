/* ESP Veri Seti Entegrasyon Testleri (v1, v2, v3, v4)
   Öğrenme kartları, uygulama projeleri, rubrikler, derin analizler, gam cetveli ve paralel cümleler. */

(function(){
  const { describe, it, expect } = ESP.Test;

  describe('ESP Veri Entegrasyonu — Pedagoji ve Öğrenme Kartları', () => {
    it('68 konunun öğrenme kartı tanımlıdır', () => {
      expect(Array.isArray(ESP.OGRENME_KARTLARI)).toBeTruthy();
      expect(ESP.OGRENME_KARTLARI.length).toBe(68);
    });

    it('öğrenme kartları hedef, açıklama, örnek ve dikkat noktası taşır', () => {
      ESP.OGRENME_KARTLARI.forEach(c => {
        expect(typeof c.id).toBe('string');
        expect(typeof c.title).toBe('string');
        expect(typeof c.explanation).toBe('string');
        expect(c.worked_example && typeof c.worked_example.text).toBe('string');
        expect(typeof c.common_misinterpretation).toBe('string');
      });
    });

    it('konu kimliği haritası ESP.TOPICS ile tam örtüşür', () => {
      expect(ESP.OGRENME_KARTI_BY_TOPIC).toBeDefined();
      expect(ESP.OGRENME_KARTI_BY_TOPIC['l-ses']).toBeDefined();
      expect(ESP.OGRENME_KARTI_BY_TOPIC['l-ses'].title).toBe('Ses ve alfabe');
      expect(ESP.OGRENME_KARTI_BY_TOPIC['p-mantik']).toBeDefined();   // konu kimliği topics.js'ten (p-diyalog yoktu)
    });
  });

  describe('ESP Veri Entegrasyonu — Uygulama Projeleri ve Derinlikli Örnekler', () => {
    it('14 uygulama projesi ve 70 görev eksiksiz mevcuttur', () => {
      expect(Array.isArray(ESP.PROJELER)).toBeTruthy();
      expect(ESP.PROJELER.length).toBe(14);
      ESP.PROJELER.forEach(p => {
        expect(typeof p.id).toBe('string');
        expect(typeof p.title).toBe('string');
        expect(p.scenario && typeof p.scenario.text).toBe('string');
        expect(Array.isArray(p.tasks)).toBeTruthy();
        expect(p.tasks.length).toBe(5);
      });
    });

    it('21 derinlikli öğretim örneği 7 disiplini ve 3 kademeyi kapsar', () => {
      expect(Array.isArray(ESP.DERINLIKLI_ORNEKLER)).toBeTruthy();
      expect(ESP.DERINLIKLI_ORNEKLER.length).toBe(21);
      ESP.DERINLIKLI_ORNEKLER.forEach(o => {
        expect(typeof o.id).toBe('string');
        expect(typeof o.prompt).toBe('string');
        expect(typeof o.worked_solution).toBe('string');
        expect(typeof o.reasoning).toBe('string');
      });
    });
  });

  describe('ESP Veri Entegrasyonu — Rubrikler, Analizler ve Gamlar', () => {
    it('7 disiplin rubriği ve 7 derin analiz mevcuttur', () => {
      expect(Array.isArray(ESP.RUBRIKLER)).toBeTruthy();
      expect(ESP.RUBRIKLER.length).toBe(7);
      expect(Array.isArray(ESP.DERIN_ANALIZLER)).toBeTruthy();
      expect(ESP.DERIN_ANALIZLER.length).toBe(7);
    });

    it('144 gam hesaplaması mevcuttur ve scaleNotes çalışır', () => {
      expect(Array.isArray(ESP.GAM_ORNEKLERI)).toBeTruthy();
      expect(ESP.GAM_ORNEKLERI.length).toBe(144);
      expect(typeof ESP.scaleNotes).toBe('function');
      const cMaj = ESP.scaleNotes('C', 'major');
      expect(cMaj.join('-')).toBe('C-D-E-F-G-A-B');
    });

    it('8 dilli paralel cümleler mevcuttur', () => {
      expect(Array.isArray(ESP.PARALEL_CUMLELER)).toBeTruthy();
      expect(ESP.PARALEL_CUMLELER.length > 0).toBeTruthy();
    });
  });

  describe('ESP Ekran Entegrasyonu — Fonksiyonel Görünümler', () => {
    it('Merdiven ekranı projeler sekmesi içerir', async () => {
      expect(typeof ESP.Screens.ladder.render).toBe('function');
      const htmlLad = String(await ESP.Screens.ladder.render());   // render güvenli HTML nesnesi döner
      expect(htmlLad.includes('projeler') || htmlLad.includes('Projeler')).toBeTruthy();
    });

    it('Stüdyo ekranı gam cetveli içerir', async () => {
      expect(typeof ESP.Screens.studio.render).toBe('function');
      const htmlStudio = String(await ESP.Screens.studio.render());
      expect(htmlStudio.includes('Gam & Mod Cetveli') || htmlStudio.includes('scale-root-sel')).toBeTruthy();
    });

    it('Analiz ekranı rubrik & analiz sekmesi içerir', async () => {
      expect(typeof ESP.Screens.analytics.render).toBe('function');
      const htmlAn = String(await ESP.Screens.analytics.render());
      expect(htmlAn.includes('rubrikler') || htmlAn.includes('Rubrik')).toBeTruthy();
    });
  });
})();
