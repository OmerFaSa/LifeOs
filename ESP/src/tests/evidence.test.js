/* Kanıt katmanı — deterministik olmak, pedagojik olarak doğru olmak değildir. */

(function(){
  const { describe, it, expect } = ESP.Test;
  const Ev = () => ESP.Ev;

  describe('Kanıt — dört eksen', () => {

    it('dört eksen de tanımlı', () => {
      expect(ESP.EVIDENCE_SOURCES.length).toBe(4);
      expect(ESP.EVIDENCE_CERTAINTY.length).toBe(4);
      expect(ESP.EVIDENCE_APPLICABILITY.length).toBe(3);
      expect(ESP.EVIDENCE_AUTHORITY.length).toBe(4);
    });

    /* Kaynak turu bir SIRALAMA tasimaz; siralama yalnizca yetkidedir. */
    it('kaynak türü sıralama taşımaz', () => {
      ESP.EVIDENCE_SOURCES.forEach(x => {
        expect(x.rank == null).toBeTruthy();
        expect(x.mayDirect == null).toBeTruthy();
      });
    });

    it('yetki politikası sürümlü ve gerekçeli', () => {
      const p = Ev().policy();
      expect(p.version >= 1).toBeTruthy();
      expect(p.rationale.length > 50).toBeTruthy();
      expect(p.disclaimer.indexOf('DEĞİLDİR') >= 0).toBeTruthy();
      expect(p.disclaimer.indexOf('hiyerarşi') >= 0).toBeTruthy();
    });

    it('yayımlanmış çerçeve kapı açabilir', () => {
      expect(Ev().mayDirect('writing.readability')).toBeTruthy();
      expect(Ev().of('writing.readability').authority).toBe('steer');
    });

    /* Kullanicinin KENDI olcumu onun icin en gecerli veridir. */
    it('kendi ölçümün kapı açabilir ve yerel işaretlenir', () => {
      const r = Ev().of('srs.retention');
      expect(r.authority).toBe('steer');
      expect(r.applicability).toBe('local');
    });

    /* Ogrenme arastirmasi genel bir yon verir ama kisiye uyarlanirken kayar. */
    it('araştırma bulgusu sınırlı katkı verir', () => {
      const r = Ev().of('srs.spacing');
      expect(r.source).toBe('research');
      expect(r.authority).toBe('limited_steer');
      expect(Ev().cap('srs.spacing')).toBe(0.35);
    });

    /* Bulgu "araya zaman koy" der, "yedi gun" demez. */
    it('aralıklı tekrar bulgusu ile kutu aralıkları ayrı kayıtlar', () => {
      expect(Ev().of('srs.spacing').source).toBe('research');
      expect(Ev().of('srs.boxes').source).toBe('system_tuning');
    });

    /* Kapi esikleri pedagojik bir bulgu DEGILDIR. */
    it('kapı eşikleri sistemin kendi seçimi sayılır', () => {
      const r = Ev().of('ladder.gates');
      expect(r.source).toBe('system_tuning');
      expect(r.authority).toBe('observe_only');
      expect(Ev().mayDirect('ladder.gates')).toBeFalsy();
    });

    /* Bes kademe bir bulgu degil bir anlati cercevesidir. */
    it('beş kademe bir norm değildir', () => {
      expect(Ev().mayDirect('ladder.levels')).toBeFalsy();
      expect(Ev().of('ladder.levels').source).toBe('system_tuning');
    });

    /* CEFR'in ALTI bandi ile ESP'nin BES basamagi farkli olceklerdir. */
    it('CEFR dolaylı işaretlenir ve ölçek farkı yazılıdır', () => {
      const r = Ev().of('lang.cefr');
      expect(r.applicability).toBe('indirect');
      expect(r.note.indexOf('ALTI') > 0).toBeTruthy();
    });

    it('kaynağı olmayan kural yönlendiremez', () => {
      expect(Ev().mayDirect('uydurma.kural')).toBeFalsy();
      expect(Ev().line('uydurma.kural').mayDirect).toBeFalsy();
      expect(Ev().cap('uydurma.kural')).toBe(0.2);
    });
  });

  describe('Kanıt — cümle kısma', () => {

    it('yeterli dayanakta cümle olduğu gibi kalır', () => {
      const t = Ev().temper('srs.retention', 'act');
      expect(t.downgraded).toBeFalsy();
      expect(t.cap).toBe(null);
    });

    /* Sessizce zayiflatmak, yaniltmanin baska bir bicimidir. */
    it('yetersiz dayanakta cümle gözleme iner ve sebebi yazılır', () => {
      const t = Ev().temper('ladder.gates', 'act');
      expect(t.strength).toBe('observe');
      expect(t.downgraded).toBeTruthy();
      expect(t.why.length > 30).toBeTruthy();
    });

    it('zaten gözlem olan cümle kısılmaz', () => {
      expect(Ev().temper('ladder.gates', 'observe').downgraded).toBeFalsy();
    });
  });

  describe('Kanıt — veri bütünlüğü', () => {

    it('denetim temiz', () => {
      const s = Ev().audit();
      if(s.length){
        throw new Error('Kanıt kaydı sorunlu: '
          + s.map(x => x.rule + ' (' + x.kind + ')').join(', '));
      }
      expect(s.length).toBe(0);
    });

    it('aynı kural iki kez kayıtlı değil', () => {
      const g = {};
      ESP.EVIDENCE.forEach(e => { g[e.rule] = (g[e.rule] || 0) + 1; });
      Object.keys(g).forEach(k => expect(g[k]).toBe(1));
    });

    it('her kayıt çözülebilir', () => {
      ESP.EVIDENCE.forEach(e => {
        const r = Ev().resolve(e);
        expect(!!r).toBeTruthy();
        expect(!!ESP.EVIDENCE_AUTHORITY.find(a => a.id === r.authority)).toBeTruthy();
      });
    });

    /* Sistem ayari olan her esik NEDEN oyle secildigini yazmali. */
    it('sistem ayarı olan her eşik gerekçe taşır', () => {
      ESP.EVIDENCE.filter(e => e.sourceType === 'system_tuning').forEach(e => {
        expect(String(e.note || '').length > 40).toBeTruthy();
      });
    });

    /* Kodda gercekten kullanilan esiklerin kaydi olmali. */
    it('anahtar eşiklerin hepsi kayıtlı', () => {
      ['ladder.levels', 'ladder.gates', 'srs.boxes', 'srs.spacing',
       'srs.retention', 'lang.cefr', 'writing.readability',
       'music.cleanBpm', 'diction.errorRate', 'friction.budget'].forEach(k => {
        expect(!!Ev().of(k)).toBeTruthy();
      });
    });
  });
})();
