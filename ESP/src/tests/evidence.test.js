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
      /* Tavan «sınırlı» — ama bulgu bu kişiye DOLAYLI uyuyor, o yüzden
         etkin yetki bir basamak iner ve üst sınır 0.35 değil 0.20 olur. */
      expect(r.authority).toBe('limited_steer');
      expect(Ev().effectiveOf('srs.spacing').authority).toBe('inform');
      expect(Ev().cap('srs.spacing')).toBe(0.20);
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

  /* ---------------------------------------------------------- etkin yetki
     `authority` bir sonuc degil bir TAVANDIR. Dort eksen birlikte
     nihai yetkiyi belirler ve tavani asamaz. */
  describe('Kanıt — etkin yetki', () => {

    it('etkin yetki tavanı hiçbir zaman aşmaz', () => {
      const sira = ['steer', 'limited_steer', 'inform', 'observe_only'];
      Ev().rules().forEach(k => {
        const r = Ev().of(k);
        const e = Ev().effectiveOf(k);
        expect(sira.indexOf(e.authority) >= sira.indexOf(r.authority)).toBeTruthy();
        expect(e.ceiling).toBe(r.authority);
      });
    });

    it('dolaylı uygulanabilirlik bir basamak indirir', () => {
      const dolayli = ESP.EVIDENCE
        .map(e => Ev().of(e.rule))
        .filter(r => r && r.applicability === 'indirect');
      expect(dolayli.length > 0).toBeTruthy();
      dolayli.forEach(r => {
        const e = Ev().effectiveOf(r.rule);
        expect(e.steps >= 1).toBeTruthy();
        /* Zaten tabandaysa daha asagi inemez; o hâlde de tavani asmamistir. */
        expect(e.capped || r.authority === 'observe_only').toBeTruthy();
      });
    });

    /* Zayiflatma SESSIZ olamaz: her inisin yazili bir sebebi var. */
    it('her iniş gerekçesini yazar', () => {
      Ev().rules().forEach(k => {
        const e = Ev().effectiveOf(k);
        expect(e.reasons.length).toBe(e.steps);
        e.reasons.forEach(x => {
          expect(String(x.reason || '').length > 10).toBeTruthy();
          expect(!!x.axis).toBeTruthy();
        });
      });
    });

    it('eksenleri temiz olan eşik tavanında kalır', () => {
      const temiz = ESP.EVIDENCE
        .map(e => Ev().of(e.rule))
        .filter(r => r && r.applicability === 'direct'
          && (r.certainty === 'high' || r.certainty === 'moderate'));
      expect(temiz.length > 0).toBeTruthy();
      temiz.forEach(r => {
        const e = Ev().effectiveOf(r.rule);
        expect(e.capped).toBeFalsy();
        expect(e.authority).toBe(r.authority);
      });
    });

    /* «Yerel» genellenebilirligi olcer, bu kullaniciya uygunlugu degil:
       kendi verin baskasiyla karsilastirilamaz ama sana tam uyar. */
    it('kendi verinde «yerel» bir zayıflık sayılmaz', () => {
      const kendi = ESP.EVIDENCE
        .map(e => Ev().of(e.rule))
        .filter(r => r && r.source === 'personal_data' && r.applicability === 'local');
      expect(kendi.length > 0).toBeTruthy();
      kendi.forEach(r => {
        const e = Ev().effectiveOf(r.rule);
        const kesinlikten = (r.certainty === 'low' || r.certainty === 'unknown') ? 1 : 0;
        expect(e.steps).toBe(kesinlikten);
      });
    });

    it('mayDirect ve cap etkin yetkiden okunur', () => {
      Ev().rules().forEach(k => {
        const e = Ev().effectiveOf(k);
        expect(Ev().mayDirect(k)).toBe(!!e.info.mayDirect);
        expect(Ev().cap(k)).toBe(e.info.cap);
      });
    });

    /* Kisma cumlesi, indigi basamaklari da anlatmali. */
    it('kısılmış cümle indiği basamakları da söyler', () => {
      const kisik = Ev().rules().filter(k => {
        const e = Ev().effectiveOf(k);
        return e.capped && !e.info.mayDirect;
      });
      expect(kisik.length > 0).toBeTruthy();
      const t = Ev().temper(kisik[0], 'act');
      expect(t.downgraded).toBeTruthy();
      expect(t.capped).toBeTruthy();
      expect(t.reasons.length > 0).toBeTruthy();
      expect(t.why.indexOf(t.reasons[0]) >= 0).toBeTruthy();
    });

    /* Etkin yetki devreye girince kayit butunlugu bozulmamali. */
    it('etkin yetki altında denetim hâlâ temiz', () => {
      expect(Ev().audit().length).toBe(0);
    });
  });

})();
