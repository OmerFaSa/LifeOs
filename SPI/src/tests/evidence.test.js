/* Kanıt katmanı — deterministik olmak, bilimsel olarak doğru olmak değildir. */

(function(){
  const { describe, it, expect } = SP.Test;
  const Ev = () => SP.Ev;

  describe('Kanıt — derece ve yetki', () => {

    it('dört derece tanımlı ve sıralı', () => {
      const g = SP.EVIDENCE_GRADES;
      expect(g.length).toBe(4);
      for(let i = 1; i < g.length; i++){
        expect(g[i - 1].rank > g[i].rank).toBeTruthy();
      }
    });

    /* Sistemin cümlesinin ağırlığı, dayanağının ağırlığını aşamaz. */
    it('yalnızca kılavuz ve uzlaşı yönlendirebilir', () => {
      expect(SP.GRADE_BY_ID.guideline.mayDirect).toBeTruthy();
      expect(SP.GRADE_BY_ID.consensus.mayDirect).toBeTruthy();
      expect(SP.GRADE_BY_ID.observational.mayDirect).toBeFalsy();
      expect(SP.GRADE_BY_ID.convention.mayDirect).toBeFalsy();
    });

    it('kaynağı olmayan eşik yönlendiremez', () => {
      expect(Ev().mayDirect('uydurma_belirtec', 'ref')).toBeFalsy();
      expect(Ev().line('uydurma_belirtec', 'ref').mayDirect).toBeFalsy();
    });

    it('kılavuz dayanaklı eşik yönlendirebilir', () => {
      expect(Ev().mayDirect('hba1c', 'ref')).toBeTruthy();
      expect(Ev().mayDirect('egfr', 'ref')).toBeTruthy();
    });

    /* HOMA-IR bir ARASTIRMA gostergesidir; evrensel tani esigi yoktur. */
    it('gözlemsel gösterge yönlendiremez', () => {
      expect(Ev().gradeOf('homa', 'ref').id).toBe('observational');
      expect(Ev().mayDirect('homa', 'ref')).toBeFalsy();
    });

    /* "Optimal TSH" bandi kilavuzlarda tanimli DEGILDIR. */
    it('sistemin kendi seçtiği bant karar eşiği sayılmaz', () => {
      expect(Ev().gradeOf('tsh', 'optimal').id).toBe('convention');
      expect(Ev().mayDirect('tsh', 'optimal')).toBeFalsy();
      /* Ama TSH referans araligi kilavuza dayanir: ikisi karismaz. */
      expect(Ev().mayDirect('tsh', 'ref')).toBeTruthy();
    });
  });

  describe('Kanıt — cümle kısma', () => {

    it('yeterli dayanakta cümle olduğu gibi kalır', () => {
      const t = Ev().temper('hba1c', 'ref', 'refer');
      expect(t.downgraded).toBeFalsy();
      expect(t.strength).toBe('refer');
    });

    /* Sessizce zayiflatmak, yaniltmanin baska bir bicimidir. */
    it('yetersiz dayanakta cümle gözleme iner ve sebebi yazılır', () => {
      const t = Ev().temper('tsh', 'optimal', 'act');
      expect(t.strength).toBe('observe');
      expect(t.downgraded).toBeTruthy();
      expect(t.why.length > 20).toBeTruthy();
    });

    it('kaynağı olmayan eşikte de sebep yazılır', () => {
      const t = Ev().temper('yok', 'ref', 'refer');
      expect(t.downgraded).toBeTruthy();
      expect(t.why.indexOf('kaynağı') >= 0).toBeTruthy();
    });

    it('zaten gözlem olan cümle kısılmaz', () => {
      expect(Ev().temper('tsh', 'optimal', 'observe').downgraded).toBeFalsy();
    });
  });

  describe('Kanıt — denetim', () => {

    /* Sistemin EN SERT cumlesi ("hekime basvur") en zayif dayanaktan
       cikamaz. Bu testin kirilmasi, yeni bir kirmizi bayrak eklenip
       kaynaginin yazilmadigi anlamina gelir. */
    it('her kırmızı bayrak yeterli dayanağa oturur', () => {
      const sorunlar = Ev().audit();
      if(sorunlar.length){
        throw new Error('Dayanaksız kırmızı bayrak: '
          + sorunlar.map(s => s.marker + ' (' + s.kind + ')').join(', '));
      }
      expect(sorunlar.length).toBe(0);
    });

    it('kapsam ölçülür ve boşluklar gizlenmez', () => {
      const k = Ev().coverage();
      expect(k.total > 0).toBeTruthy();
      expect(k.sourced + k.missing.length).toBe(k.total);
      expect(k.pct >= 0 && k.pct <= 100).toBeTruthy();
    });

    /* Kilavuzlarin ayristigi yerler kullaniciya gosterilir. */
    it('ayrışan eşikler listelenir', () => {
      const d = Ev().disputed();
      expect(d.length > 0).toBeTruthy();
    });
  });

  describe('Kanıt — veri bütünlüğü', () => {

    it('her kayıt bilinen bir belirtece ve bilinen bir dereceye bağlı', () => {
      SP.EVIDENCE.forEach(e => {
        expect(!!SP.BIO_BY_ID[e.marker]).toBeTruthy();
        expect(!!SP.GRADE_BY_ID[e.grade]).toBeTruthy();
        expect(['ref', 'optimal', 'red'].indexOf(e.field) >= 0).toBeTruthy();
        expect(String(e.source || '').length > 5).toBeTruthy();
      });
    });

    it('aynı eşik iki kez kayıtlı değil', () => {
      const g = {};
      SP.EVIDENCE.forEach(e => {
        const k = e.marker + '/' + e.field;
        g[k] = (g[k] || 0) + 1;
      });
      Object.keys(g).forEach(k => expect(g[k]).toBe(1));
    });

    /* "Bu sistemin secimi" diyen her kayit, NEDEN sectigini yazmak
       zorundadir: gerekcesiz bir secim, gizlenmis bir keyfilik olur. */
    it('seçim dereceli her kayıt gerekçe taşır', () => {
      SP.EVIDENCE.filter(e => e.grade === 'convention').forEach(e => {
        expect(String(e.note || '').length > 40).toBeTruthy();
      });
    });
  });
})();

/* Kanıt katmanının kural motoruna DOKUNDUĞU yer: hedef düzeltmeleri. */
(function(){
  const { describe, it, expect, resetState, pushLab } = SP.Test;

  describe('Kanıt — hedef düzeltmesini kısar', () => {

    /* Ferritin HEDEF BANDI bu sistemin seçimidir; referans aralığı değil.
       Seçilmiş bir banttan çıkan düzeltme zayıflatılır. */
    it('seçim dereceli banttan çıkan çarpan kısılır ve işaretlenir', () => {
      resetState();
      SP.S.profile.sex = 'male';
      /* 50 ng/mL: erkekte referans içinde (30–400), hedef bandın altında (80–250). */
      pushLab('2026-01-10', { ferritin:50 });
      const t = SP.Nutri.targets(SP.S.profile);
      const d = t.adjustments.iron;
      expect(!!d).toBeTruthy();
      expect(d.soft).toBeTruthy();
      expect(d.mult <= 1.2).toBeTruthy();
      expect(d.why.indexOf('gözlem') > 0 || d.why.length > 40).toBeTruthy();
    });

    /* Referans aralığının ALTI kılavuz/uzlaşı dayanaklıdır: kısılmaz. */
    it('kılavuz dayanaklı düzeltme tam güçte uygulanır', () => {
      resetState();
      SP.S.profile.sex = 'male';
      pushLab('2026-01-10', { vitd:12 });
      const d = SP.Nutri.targets(SP.S.profile).adjustments.vitd;
      expect(!!d).toBeTruthy();
      expect(d.soft).toBeFalsy();
      expect(d.mult).toBe(2.0);
    });

    /* Zayiflatma SESSIZ olamaz. */
    it('kısılan düzeltme sebebini gerekçeye yazar', () => {
      resetState();
      SP.S.profile.sex = 'male';
      pushLab('2026-01-10', { ferritin:50 });
      const d = SP.Nutri.targets(SP.S.profile).adjustments.iron;
      expect(d.why.length > (SP.Nutri.LAB_LINKS.find(l =>
        l.when[0] === 'ferritin' && l.when[1] === 'belowOpt').why.length)).toBeTruthy();
    });
  });

  describe('Kanıt — türetilmiş gösterge yönlendirmez', () => {

    /* HOMA-IR, TyG, TG/HDL, De Ritis ve eAG birer ARAŞTIRMA göstergesidir:
       evrensel karar eşikleri yoktur, dolayısıyla «hekime başvur» diyen bir
       kırmızı bayrak taşıyamazlar. */
    it('araştırma göstergelerinde kırmızı bayrak yok', () => {
      ['homa', 'tyg', 'tg_hdl', 'deritis', 'eag'].forEach(id => {
        const b = SP.BIO_BY_ID[id];
        expect(!!b).toBeTruthy();
        const red = b.red || {};
        expect(red.below == null && red.above == null).toBeTruthy();
      });
    });
  });
})();
