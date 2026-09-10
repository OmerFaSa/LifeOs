/* Sıfır sürtünmeli giriş — tahlil ve öğün metni ayrıştırıcıları.

   Ayrıştırıcının en tehlikeli hatası yanlış veriyi doğru sanmaktır.
   Bu yüzden testler yalnızca "doğru satırı buluyor mu" diye değil,
   "emin olamadığında susup bildiriyor mu" diye de bakar. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;

  describe('Parse — sayı okuma', () => {
    it('virgüllü ondalık okunur', () => {
      expect(SP.Parse.num('12,5')).toBe(12.5);
    });

    it('noktalı ondalık okunur', () => {
      expect(SP.Parse.num('12.5')).toBe(12.5);
    });

    it('binlik nokta ve ondalık virgül birlikte çözülür', () => {
      expect(SP.Parse.num('1.200,5')).toBe(1200.5);
    });

    it('sayı olmayan metin null döner', () => {
      expect(SP.Parse.num('abc')).toBeNull();
      expect(SP.Parse.num('')).toBeNull();
      expect(SP.Parse.num(null)).toBeNull();
    });
  });

  describe('Parse — tahlil metni', () => {
    it('basit bir satırı eşler', () => {
      const r = SP.Parse.parseLab('Hemoglobin   14,2   g/dL');
      expect(r.rows).toHaveLength(1);
      expect(r.rows[0].markerId).toBe('hgb');
      expect(r.rows[0].value).toBe(14.2);
    });

    it('referans aralığı sonuçla karıştırılmaz', () => {
      const r = SP.Parse.parseLab('Ferritin   28   ng/mL   30 - 400');
      expect(r.rows[0].value).toBe(28);
      expect(r.rows[0].othersInLine).toEqual([30, 400]);
    });

    it('çok satırlı raporu ayıklar', () => {
      const text = [
        'TAM KAN SAYIMI',
        'Hemoglobin      14,2   g/dL    13.5 - 17.5',
        'Hematokrit      42,1   %       40 - 52',
        'BİYOKİMYA',
        'Açlık glukozu   92     mg/dL   70 - 99',
        'Ferritin        28     ng/mL   30 - 400',
      ].join('\n');
      const r = SP.Parse.parseLab(text);
      const ids = r.rows.map(x => x.markerId);
      expect(ids).toContain('hgb');
      expect(ids).toContain('hct');
      expect(ids).toContain('glucose');
      expect(ids).toContain('ferritin');
    });

    it('uzun ad kısa adı gizlemez', () => {
      const r = SP.Parse.parseLab('Serbest T4   1,2   ng/dL');
      expect(r.rows[0].markerId).toBe('ft4');
    });

    it('kelime sınırı korunur — HbA1c içindeki "hb" eşleşmez', () => {
      const r = SP.Parse.parseLab('HbA1c   5,4   %');
      expect(r.rows[0].markerId).toBe('hba1c');
    });

    it('eşleşmeyen ama sayı içeren satır bildirilir', () => {
      const r = SP.Parse.parseLab('Bilinmeyen Parametre   42   birim');
      expect(r.rows).toHaveLength(0);
      expect(r.unmatched.length).toBe(1);
    });

    it('sayısız başlık satırı sessizce geçilir', () => {
      const r = SP.Parse.parseLab('TAM KAN SAYIMI\nHemoglobin 14 g/dL');
      expect(r.unmatched).toHaveLength(0);
      expect(r.rows).toHaveLength(1);
    });

    it('aynı ölçüm iki kez geçerse ilki tutulur', () => {
      const r = SP.Parse.parseLab('Hemoglobin 14,2 g/dL\nHemoglobin 14,2 g/dL');
      expect(r.rows).toHaveLength(1);
      expect(r.duplicates).toBe(1);
    });

    it('boş metin hiçbir şey eşleştirmez ve nedenini söyler', () => {
      const r = SP.Parse.parseLab('');
      expect(r.rows).toHaveLength(0);
      expect(r.note).toContain('eşleşmedi');
    });
  });

  describe('Parse — birim çevirimi', () => {
    it('D vitamini nmol/L\'den ng/mL\'ye çevrilir', () => {
      const r = SP.Parse.parseLab('25-OH D   75   nmol/L');
      expect(r.rows[0].converted).toBeTruthy();
      expect(r.rows[0].value).toBeCloseTo(30, 0);
    });

    it('glukoz mmol/L\'den mg/dL\'ye çevrilir', () => {
      const r = SP.Parse.parseLab('Glukoz   5   mmol/L');
      expect(r.rows[0].value).toBeCloseTo(90, 0);
    });

    it('doğru birimde çevirim yapılmaz', () => {
      const r = SP.Parse.parseLab('Glukoz   92   mg/dL');
      expect(r.rows[0].converted).toBeFalsy();
    });

    it('bilinmeyen birim çevrilmez ve uyumsuzluk bildirilir', () => {
      const out = SP.Parse.convert('glucose', 92, 'garip/birim');
      expect(out.converted).toBeFalsy();
      expect(out.value).toBe(92);
    });
  });

  describe('Parse — öğün metni', () => {
    it('tek kalemi ev ölçüsüyle çözer', () => {
      const r = SP.Parse.parseMeal('1 tabak etli kuru fasulye');
      expect(r.items).toHaveLength(1);
      expect(r.items[0].foodId).toBe('kuru-fasulye-etli');
      expect(r.items[0].g).toBe(250);
      expect(r.items[0].cert).toBe('estimated');
    });

    it('virgül ve "ve" ile ayrılmış kalemleri böler', () => {
      const r = SP.Parse.parseMeal('1 tabak mercimek çorbası, 2 dilim ekmek ve 1 bardak ayran');
      expect(r.items.length).toBe(3);
      const ids = r.items.map(i => i.foodId);
      expect(ids).toContain('mercimek-corbasi');
      expect(ids).toContain('ayran');
    });

    it('miktar ev ölçüsüyle çarpılır', () => {
      const r = SP.Parse.parseMeal('2 dilim beyaz ekmek');
      expect(r.items[0].g).toBe(60);
    });

    it('gram doğrudan yazılınca "ölçüldü" olur', () => {
      const r = SP.Parse.parseMeal('150 g tavuk göğsü');
      expect(r.items[0].g).toBe(150);
      expect(r.items[0].cert).toBe('measured');
    });

    it('kilogram grama çevrilir', () => {
      const r = SP.Parse.parseMeal('0,2 kg dana eti');
      expect(r.items[0].g).toBe(200);
    });

    it('sayı sözcüğü okunur', () => {
      const r = SP.Parse.parseMeal('iki yumurta');
      expect(r.items[0].g).toBe(110);
    });

    it('yarım da okunur', () => {
      const r = SP.Parse.parseMeal('yarım tabak pilav');
      expect(r.items[0].g).toBe(90);
    });

    it('miktar yoksa bir varsayılır', () => {
      const r = SP.Parse.parseMeal('elma');
      expect(r.items[0].g).toBe(180);
    });

    it('ölçü yoksa ilk ev ölçüsü varsayılır ve işaretlenir', () => {
      const r = SP.Parse.parseMeal('3 muz');
      expect(r.items[0].assumed).toBeTruthy();
      expect(r.items[0].g).toBe(360);
    });

    it('eşleşmeyen parça atılmaz, bildirilir', () => {
      const r = SP.Parse.parseMeal('1 tabak pilav, uzaylı yemeği');
      expect(r.items).toHaveLength(1);
      expect(r.unmatched).toHaveLength(1);
    });

    it('hiçbir şey eşleşmezse nedeni söylenir', () => {
      const r = SP.Parse.parseMeal('zzz qqq');
      expect(r.items).toHaveLength(0);
      expect(r.note).toContain('eşleşmedi');
    });

    it('boş metin boş sonuç verir', () => {
      const r = SP.Parse.parseMeal('   ');
      expect(r.items).toHaveLength(0);
    });

    it('Türkçe karakter farkı eşleşmeyi bozmaz', () => {
      const a = SP.Parse.parseMeal('1 kase mercimek corbasi');
      const b = SP.Parse.parseMeal('1 kase mercimek çorbası');
      expect(a.items[0].foodId).toBe(b.items[0].foodId);
    });
  });

  describe('Parse — tahlil kaydına çevirme', () => {
    it('eşleşen satırlar oturuma yazılır', () => {
      resetState();
      const p = SP.Parse.parseLab('Hemoglobin 14,2 g/dL\nFerritin 28 ng/mL');
      const rec = SP.Parse.toLabRecord(p, '2026-01-10', { lab:'Test Lab' });
      expect(rec.date).toBe('2026-01-10');
      expect(rec.lab).toBe('Test Lab');
      expect(rec.values.hgb.v).toBe(14.2);
      expect(rec.values.hgb.cert).toBe('measured');
      expect(rec.source).toBe('paste');
    });

    it('işaretlenmemiş satır kayda girmez', () => {
      resetState();
      const p = SP.Parse.parseLab('Hemoglobin 14,2 g/dL\nFerritin 28 ng/mL');
      p.rows[1].skip = true;
      const rec = SP.Parse.toLabRecord(p, '2026-01-10');
      expect(rec.values.ferritin).toBeUndefined();
      expect(rec.values.hgb).toBeTruthy();
    });

    it('kayda yazılan değerler türetilmiş ölçümü tetikler', () => {
      resetState();
      const p = SP.Parse.parseLab('Açlık glukozu 90 mg/dL\nİnsülin 9 µIU/mL');
      const rec = SP.Model.applyDerived(SP.Parse.toLabRecord(p, '2026-01-10'));
      expect(rec.values.homa).toBeTruthy();
    });
  });
})();
