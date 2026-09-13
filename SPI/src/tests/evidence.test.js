/* Kanıt katmanı — deterministik olmak, bilimsel olarak doğru olmak değildir. */

(function(){
  const { describe, it, expect } = SP.Test;
  const Ev = () => SP.Ev;

  describe('Kanıt — dört eksen', () => {

    /* Eksenler AYRI seylerdir: kaynak turu bir siralama TASIMAZ.
       Tek eksene dizmek, bir belgeyi bir arastirma tasarimiyla ayni
       olcege koymak olurdu. */
    it('dört eksen de tanımlı', () => {
      expect(SP.EVIDENCE_SOURCES.length).toBe(4);
      expect(SP.EVIDENCE_CERTAINTY.length).toBe(4);
      expect(SP.EVIDENCE_APPLICABILITY.length).toBe(3);
      expect(SP.EVIDENCE_AUTHORITY.length).toBe(4);
    });

    /* Kaynak turunde rank/sira alani OLMAMALI: siralama iddiasi yalnizca
       yetki politikasinda, ve orasi bilimsel degil operasyonel. */
    it('kaynak türü bir sıralama taşımaz', () => {
      SP.EVIDENCE_SOURCES.forEach(x => {
        expect(x.rank == null).toBeTruthy();
        expect(x.mayDirect == null).toBeTruthy();
      });
    });

    it('yetki politikası sürümlü ve gerekçeli', () => {
      const p = SP.Ev.policy();
      expect(p.version >= 2).toBeTruthy();
      expect(p.rationale.length > 50).toBeTruthy();
      expect(p.history.length >= 2).toBeTruthy();
      /* Politikanin kendisi bir kanit degil bir KARAR oldugunu yazmali. */
      expect(p.disclaimer.indexOf('hiyerarşi') >= 0).toBeTruthy();
      expect(p.disclaimer.indexOf('DEĞİLDİR') >= 0).toBeTruthy();
    });

    it('her kaynak türünün varsayılan yetkisi tanımlı', () => {
      SP.EVIDENCE_SOURCES.forEach(x => {
        const y = SP.Ev.policy().defaults[x.id];
        expect(!!SP.AUTHORITY_BY_ID[y]).toBeTruthy();
      });
    });

    it('kaynağı olmayan eşik yönlendiremez', () => {
      expect(SP.Ev.mayDirect('uydurma_belirtec', 'ref')).toBeFalsy();
      expect(SP.Ev.line('uydurma_belirtec', 'ref').mayDirect).toBeFalsy();
      /* Kaynaksiz esikte en dar tavan uygulanir. */
      expect(SP.Ev.cap('uydurma_belirtec', 'ref')).toBe(0.2);
    });

    it('kılavuz dayanaklı eşik yönlendirebilir ve tavansızdır', () => {
      expect(SP.Ev.mayDirect('hba1c', 'ref')).toBeTruthy();
      expect(SP.Ev.of('hba1c', 'ref').authority).toBe('steer');
      expect(SP.Ev.cap('hba1c', 'ref')).toBe(null);
    });

    /* HOMA-IR bir ARASTIRMA gostergesidir; evrensel tani esigi yoktur. */
    it('gözlemsel gösterge yönlendiremez', () => {
      expect(SP.Ev.of('homa', 'ref').source).toBe('observational');
      expect(SP.Ev.mayDirect('homa', 'ref')).toBeFalsy();
    });

    /* "Optimal TSH" bandi kilavuzlarda tanimli DEGILDIR. */
    it('sistem ayarı karar eşiği sayılmaz', () => {
      const r = SP.Ev.of('tsh', 'optimal');
      expect(r.source).toBe('system_tuning');
      expect(r.authority).toBe('observe_only');
      expect(SP.Ev.mayDirect('tsh', 'optimal')).toBeFalsy();
      /* Ama TSH referans araligi kilavuza dayanir: ikisi karismaz. */
      expect(SP.Ev.mayDirect('tsh', 'ref')).toBeTruthy();
    });

    /* Kesinlik, kaynak turunden BAGIMSIZ bir eksendir. */
    it('kesinlik kaynak türünden ayrı okunur', () => {
      const g = SP.Ev.of('hba1c', 'ref');
      const t = SP.Ev.of('tsh', 'optimal');
      expect(g.certainty).toBe('high');
      expect(t.certainty).toBe('unknown');
      /* Ikisi de kendi kaynagindan degil, kendi eksenlerinden gelir. */
      expect(g.certainty !== g.source).toBeTruthy();
    });

    /* Popülasyonu "DEĞİŞİR" diyen esik dogrudan uygulanabilir sayilamaz. */
    it('popülasyona göre kayan eşik dolaylı işaretlenir', () => {
      expect(SP.Ev.of('ldl', 'optimal').applicability).toBe('indirect');
      expect(SP.Ev.of('waist', 'ref').applicability).toBe('indirect');
    });

    /* Kayitlardaki `source` alani ATIF METNIDIR, kaynak turu degil.
       Ikisini karistirmak butun esikleri sessizce yetkisiz birakirdi. */
    it('atıf metni ile kaynak türü karışmaz', () => {
      const r = SP.Ev.of('sbp', 'ref');
      expect(r.source).toBe('guideline');
      expect(r.citation.indexOf('ACC/AHA') >= 0).toBeTruthy();
    });
  });

  describe('Kanıt — cümle kısma', () => {

    it('yeterli dayanakta cümle olduğu gibi kalır', () => {
      const t = Ev().temper('hba1c', 'ref', 'refer');
      expect(t.downgraded).toBeFalsy();
      expect(t.strength).toBe('refer');
      expect(t.cap).toBe(null);
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

    it('her kayıt bilinen bir belirtece ve çözülebilir bir kaynağa bağlı', () => {
      SP.EVIDENCE.forEach(e => {
        expect(!!SP.BIO_BY_ID[e.marker]).toBeTruthy();
        expect(['ref', 'optimal', 'red'].indexOf(e.field) >= 0).toBeTruthy();
        expect(String(e.source || '').length > 5).toBeTruthy();
        const r = SP.Ev.resolve(e);
        expect(!!r).toBeTruthy();
        expect(!!SP.SOURCE_BY_ID[r.source]).toBeTruthy();
        expect(!!SP.CERTAINTY_BY_ID[r.certainty]).toBeTruthy();
        expect(!!SP.APPLICABILITY_BY_ID[r.applicability]).toBeTruthy();
        expect(!!SP.AUTHORITY_BY_ID[r.authority]).toBeTruthy();
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
    /* "Sistemin kendi ayari" diyen her kayit NEDEN oyle sectigini yazmak
       zorundadir: gerekcesiz bir secim, gizlenmis bir keyfiliktir. */
    it('sistem ayarı olan her kayıt gerekçe taşır', () => {
      SP.EVIDENCE.filter(e => SP.Ev.resolve(e).source === 'system_tuning')
        .forEach(e => {
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
