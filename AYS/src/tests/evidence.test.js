/* Kanıt katmanı — deterministik olmak, pedagojik olarak doğru olmak değildir. */

(function(){
  const { describe, it, expect } = R.Test;
  const Ev = () => R.Ev;

  describe('Kanıt — dört eksen', () => {

    it('dört eksen de tanımlı', () => {
      expect(R.EVIDENCE_SOURCES.length).toBe(4);
      expect(R.EVIDENCE_CERTAINTY.length).toBe(4);
      expect(R.EVIDENCE_APPLICABILITY.length).toBe(3);
      expect(R.EVIDENCE_AUTHORITY.length).toBe(4);
    });

    /* Kaynak turu bir SIRALAMA tasimaz; siralama yalnizca yetkidedir. */
    it('kaynak türü sıralama taşımaz', () => {
      R.EVIDENCE_SOURCES.forEach(x => {
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

    it('sınavın kendi kuralı yönlendirebilir', () => {
      expect(Ev().mayDirect('exam.netFormula')).toBeTruthy();
      expect(Ev().of('exam.netFormula').authority).toBe('steer');
    });

    /* Adayin KENDI olcumu onun icin en gecerli veridir. */
    it('kendi verin yönlendirebilir ve yerel işaretlenir', () => {
      const r = Ev().of('exam.median');
      expect(r.authority).toBe('steer');
      expect(r.applicability).toBe('local');
    });

    /* Ogrenme arastirmasi genel bir yon verir ama kisiye uyarlanirken kayar. */
    it('araştırma bulgusu sınırlı yönlendirir', () => {
      const r = Ev().of('srs.spacing');
      expect(r.source).toBe('research');
      expect(r.authority).toBe('limited_steer');
      expect(Ev().cap('srs.spacing')).toBe(0.35);
    });

    /* %75 pedagojik bir bulgu DEGILDIR. */
    it('kapanış eşiği sistemin kendi seçimi sayılır', () => {
      const r = Ev().of('closure.first');
      expect(r.source).toBe('system_tuning');
      expect(r.authority).toBe('observe_only');
      expect(Ev().mayDirect('closure.first')).toBeFalsy();
    });

    it('ay kapıları bir norm değildir ve yönlendirmez', () => {
      expect(Ev().mayDirect('month.gates')).toBeFalsy();
      expect(Ev().of('month.gates').applicability).toBe('indirect');
    });

    it('kaynağı olmayan kural yönlendiremez', () => {
      expect(Ev().mayDirect('uydurma.kural')).toBeFalsy();
      expect(Ev().line('uydurma.kural').mayDirect).toBeFalsy();
      expect(Ev().cap('uydurma.kural')).toBe(0.2);
    });
  });

  describe('Kanıt — cümle kısma', () => {

    it('yeterli dayanakta cümle olduğu gibi kalır', () => {
      const t = Ev().temper('exam.median', 'act');
      expect(t.downgraded).toBeFalsy();
      expect(t.cap).toBe(null);
    });

    /* Sessizce zayiflatmak, yaniltmanin baska bir bicimidir. */
    it('yetersiz dayanakta cümle gözleme iner ve sebebi yazılır', () => {
      const t = Ev().temper('closure.first', 'act');
      expect(t.strength).toBe('observe');
      expect(t.downgraded).toBeTruthy();
      expect(t.why.length > 30).toBeTruthy();
    });

    it('zaten gözlem olan cümle kısılmaz', () => {
      expect(Ev().temper('month.gates', 'observe').downgraded).toBeFalsy();
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
      R.EVIDENCE.forEach(e => { g[e.rule] = (g[e.rule] || 0) + 1; });
      Object.keys(g).forEach(k => expect(g[k]).toBe(1));
    });

    it('her kayıt çözülebilir', () => {
      R.EVIDENCE.forEach(e => {
        const r = Ev().resolve(e);
        expect(!!r).toBeTruthy();
        expect(!!R.EVIDENCE_AUTHORITY.find(a => a.id === r.authority)).toBeTruthy();
      });
    });

    /* Sistem ayari olan her esik NEDEN oyle secildigini yazmali. */
    it('sistem ayarı olan her eşik gerekçe taşır', () => {
      R.EVIDENCE.filter(e => e.sourceType === 'system_tuning').forEach(e => {
        expect(String(e.note || '').length > 40).toBeTruthy();
      });
    });

    /* Kodda gercekten kullanilan esiklerin kaydi olmali. */
    it('anahtar eşiklerin hepsi kayıtlı', () => {
      ['closure.first', 'closure.second', 'kpi.planCompletion', 'kpi.cardDebt',
       'month.gates', 'exam.volume', 'exam.median', 'exam.base',
       'srs.spacing', 'srs.retrieval'].forEach(k => {
        expect(!!Ev().of(k)).toBeTruthy();
      });
    });
  });
})();
