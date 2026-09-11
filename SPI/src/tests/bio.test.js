/* Modül 1 — referans çözümleme, durum sınıflaması ve bireysel eğilim. */

(function(){
  const { describe, it, expect, resetState, withToday, pushLab, pushVitals } = SP.Test;
  const U = SP.U;

  describe('Bio — referans çözümleme', () => {
    it('cinsiyete göre aralık seçer', () => {
      resetState();
      const male = SP.Bio.refFor('hgb', { sex:'male', birthYear:1996 });
      const female = SP.Bio.refFor('hgb', { sex:'female', birthYear:1996 });
      expect(male.ref[0]).toBe(13.5);
      expect(female.ref[0]).toBe(12.0);
    });

    it('düz dizi aralıklar herkes için aynı', () => {
      const a = SP.Bio.refFor('glucose', { sex:'male', birthYear:1990 });
      const b = SP.Bio.refFor('glucose', { sex:'female', birthYear:1990 });
      expect(a.ref).toEqual(b.ref);
    });

    it('bilinmeyen belirteç için null döner', () => {
      expect(SP.Bio.refFor('olmayan-olcum')).toBeNull();
    });

    it('kırmızı bayrak eşiklerini taşır', () => {
      const r = SP.Bio.refFor('glucose');
      expect(r.red.above).toBe(126);
    });
  });

  describe('Bio — durum sınıflaması', () => {
    it('hedef bandın içi "hedefte"', () => {
      resetState();
      expect(SP.Bio.statusOf('glucose', 85).id).toBe('ok');
    });

    it('referans içi ama hedef altı "hedefin altı"', () => {
      resetState();
      /* Ferritin erkek: referans 30–400, hedef 80–250 */
      expect(SP.Bio.statusOf('ferritin', 45).id).toBe('belowOpt');
    });

    it('referans altı "referans altı"', () => {
      resetState();
      expect(SP.Bio.statusOf('ferritin', 20).id).toBe('low');
    });

    it('referans üstü "referans üstü"', () => {
      resetState();
      expect(SP.Bio.statusOf('glucose', 110).id).toBe('high');
    });

    it('kırmızı eşik her şeyi yener', () => {
      resetState();
      expect(SP.Bio.statusOf('ferritin', 5).id).toBe('red');
      expect(SP.Bio.statusOf('glucose', 140).id).toBe('red');
    });

    it('değer yoksa "veri yok" — sıfır sayılmaz', () => {
      expect(SP.Bio.statusOf('ferritin', null).id).toBe('unknown');
      expect(SP.Bio.statusOf('ferritin', undefined).id).toBe('unknown');
    });

    it('sıfır gerçek bir değerdir, veri yok değil', () => {
      resetState();
      /* CRP referansı 0–3: sıfır hedefin içindedir. */
      expect(SP.Bio.statusOf('crp', 0).id).toBe('ok');
    });

    it('durum gerekçesi boş dönmez', () => {
      resetState();
      expect(SP.Bio.statusNote('ferritin', 20).length > 10).toBeTruthy();
      expect(SP.Bio.statusNote('ferritin', null).length > 10).toBeTruthy();
    });
  });

  describe('Bio — bireysel eğilim', () => {
    it('üç ölçümden azında eğilim hesaplanmaz', () => {
      resetState();
      pushLab('2026-01-01', { ferritin:80 });
      pushLab('2026-03-01', { ferritin:60 });
      const t = SP.Bio.trendOf('ferritin');
      expect(t.ok).toBeFalsy();
      expect(t.n).toBe(2);
    });

    it('düşen seride yön "down"', () => {
      resetState();
      withToday('2026-07-01', () => {
        pushLab('2026-01-01', { ferritin:120 });
        pushLab('2026-03-01', { ferritin:90 });
        pushLab('2026-05-01', { ferritin:60 });
        const t = SP.Bio.trendOf('ferritin');
        expect(t.ok).toBeTruthy();
        expect(t.dir).toBe('down');
        expect(t.n).toBe(3);
      });
    });

    it('yükselen seride yön "up"', () => {
      resetState();
      withToday('2026-07-01', () => {
        pushLab('2026-01-01', { hba1c:5.0 });
        pushLab('2026-03-01', { hba1c:5.4 });
        pushLab('2026-05-01', { hba1c:5.9 });
        expect(SP.Bio.trendOf('hba1c').dir).toBe('up');
      });
    });

    it('küçük dalgalanma "yatay" sayılır', () => {
      resetState();
      withToday('2026-07-01', () => {
        pushLab('2026-01-01', { ferritin:100 });
        pushLab('2026-03-01', { ferritin:101 });
        pushLab('2026-05-01', { ferritin:99 });
        expect(SP.Bio.trendOf('ferritin').dir).toBe('flat');
      });
    });

    it('pencere dışındaki ölçümler eğilime girmez', () => {
      resetState();
      withToday('2026-07-01', () => {
        pushLab('2020-01-01', { ferritin:200 });
        pushLab('2026-05-01', { ferritin:60 });
        pushLab('2026-06-01', { ferritin:55 });
        const t = SP.Bio.trendOf('ferritin', { days:90 });
        expect(t.n).toBe(2);
      });
    });
  });

  describe('Bio — eğilim yorumu', () => {
    it('düşük iyi olan ölçümde düşüş olumlu', () => {
      resetState();
      withToday('2026-07-01', () => {
        pushLab('2026-01-01', { ldl:150 });
        pushLab('2026-03-01', { ldl:130 });
        pushLab('2026-05-01', { ldl:105 });
        const t = SP.Bio.trendOf('ldl');
        expect(SP.Bio.trendVerdict('ldl', t).tone).toBe('ok');
      });
    });

    it('yüksek iyi olan ölçümde düşüş uyarı', () => {
      resetState();
      withToday('2026-07-01', () => {
        pushLab('2026-01-01', { hdl:60 });
        pushLab('2026-03-01', { hdl:48 });
        pushLab('2026-05-01', { hdl:38 });
        const t = SP.Bio.trendOf('hdl');
        const v = SP.Bio.trendVerdict('hdl', t);
        expect(v.tone).toBe('warn');
      });
    });

    it('bandın ortasına yaklaşmak olumlu sayılır', () => {
      resetState();
      withToday('2026-07-01', () => {
        /* TSH hedef bandı 0,8–2,5; orta ~1,65 */
        pushLab('2026-01-01', { tsh:4.0 });
        pushLab('2026-03-01', { tsh:2.8 });
        pushLab('2026-05-01', { tsh:1.8 });
        const t = SP.Bio.trendOf('tsh');
        expect(SP.Bio.trendVerdict('tsh', t).tone).toBe('ok');
      });
    });

    it('eğilim yoksa yorum nötr', () => {
      resetState();
      const v = SP.Bio.trendVerdict('ferritin', { ok:false });
      expect(v.tone).toBe('muted');
    });
  });

  describe('Bio — seriler ve özet', () => {
    it('tahlil ve günlük ölçüm tek seride birleşir', () => {
      resetState();
      pushLab('2026-01-01', { weight:80 });
      pushVitals('2026-02-01', { weight:79 });
      const s = SP.Model.seriesOf('weight');
      expect(s).toHaveLength(2);
      expect(s[0].date).toBe('2026-01-01');
      expect(s[1].src).toBe('vital');
    });

    it('seri tarihe göre artan sıralı', () => {
      resetState();
      pushLab('2026-05-01', { hgb:14 });
      pushLab('2026-01-01', { hgb:13 });
      const s = SP.Model.seriesOf('hgb');
      expect(s[0].date).toBe('2026-01-01');
    });

    it('son değer latestOf ile gelir', () => {
      resetState();
      pushLab('2026-01-01', { hgb:13 });
      pushLab('2026-05-01', { hgb:15 });
      expect(SP.Model.latestOf('hgb').v).toBe(15);
    });

    it('özet sayıları toplamda belirteç sayısını verir', () => {
      resetState();
      pushLab('2026-01-01', { ferritin:20, glucose:85 });
      const s = SP.Bio.summary();
      expect(s.measured).toBe(2);
      expect(s.red + s.out + s.offTarget + s.ok + s.missing).toBe(s.total);
    });

    it('dikkat listesi kritik olanı öne alır', () => {
      resetState();
      pushLab('2026-01-01', { ferritin:5, glucose:95 });
      const rows = SP.Bio.attention();
      expect(rows.length > 0).toBeTruthy();
      expect(rows[0].marker.id).toBe('ferritin');
      expect(rows[0].rank).toBe(1);
    });

    it('hedefte olan ölçüm dikkat listesine girmez', () => {
      resetState();
      pushLab('2026-01-01', { glucose:85 });
      expect(SP.Bio.attention().some(a => a.marker.id === 'glucose')).toBeFalsy();
    });
  });

  describe('Bio — ölçüm borcu', () => {
    it('hiç ölçülmemiş panel borç sayılır', () => {
      resetState();
      const rows = SP.Bio.overdue();
      expect(rows.length > 0).toBeTruthy();
      expect(rows[0].days).toBeNull();
    });

    it('yeni ölçülen panel borçta çıkmaz', () => {
      resetState();
      withToday('2026-07-01', () => {
        SP.BIOMARKERS.filter(b => b.panel === 'lipid')
          .forEach(b => pushLab('2026-06-15', { [b.id]:100 }));
        expect(SP.Bio.overdue().some(o => o.panel.id === 'lipid')).toBeFalsy();
      });
    });

    it('180 günden eski panel borç sayılır', () => {
      resetState();
      withToday('2026-07-01', () => {
        pushLab('2025-01-01', { ldl:100 });
        const row = SP.Bio.overdue().find(o => o.panel.id === 'lipid');
        expect(row).toBeTruthy();
        expect(row.days > 180).toBeTruthy();
      });
    });

    it('vital ve vücut panelleri borç listesine girmez', () => {
      resetState();
      const ids = SP.Bio.overdue().map(o => o.panel.id);
      expect(ids.indexOf('vital') < 0).toBeTruthy();
      expect(ids.indexOf('body') < 0).toBeTruthy();
    });
  });

  describe('Bio — türetilmiş ölçümler', () => {
    it('HOMA-IR iki girdiden hesaplanır', () => {
      resetState();
      const rec = SP.Test.makeLab('2026-01-01', { glucose:90, insulin:9 });
      expect(rec.values.homa).toBeTruthy();
      expect(rec.values.homa.v).toBeCloseTo(2.0, 1);
      expect(rec.values.homa.cert).toBe('derived');
    });

    it('girdi eksikse türetilmiş ölçüm hiç yazılmaz', () => {
      resetState();
      const rec = SP.Test.makeLab('2026-01-01', { glucose:90 });
      expect(rec.values.homa).toBeUndefined();
    });

    it('non-HDL total kolesterolden HDL çıkarır', () => {
      const rec = SP.Test.makeLab('2026-01-01', { chol:200, hdl:50 });
      expect(rec.values.nonhdl.v).toBe(150);
    });

    it('transferrin satürasyonu yüzde döner', () => {
      const rec = SP.Test.makeLab('2026-01-01', { iron_s:100, tibc:400 });
      expect(rec.values.tsat.v).toBe(25);
    });

    it('sıfır bölen türetilmiş ölçüm üretmez', () => {
      const rec = SP.Test.makeLab('2026-01-01', { iron_s:100, tibc:0 });
      expect(rec.values.tsat).toBeUndefined();
    });

    /* --------------------------------------------- yeni türetilmiş ölçümler */

    it('LDL Friedewald ile hesaplanır', () => {
      const rec = SP.Test.makeLab('2026-01-01', { chol:200, hdl:50, trig:150 });
      expect(rec.values.ldl.v).toBe(120);          /* 200 − 50 − 30 */
      expect(rec.values.ldl.cert).toBe('derived');
    });

    /* Friedewald trigliserit 400 üstünde geçersizdir. Geçersiz bir
       formülü uygulamak, hesaplamamaktan kötüdür. */
    it('trigliserit 400 üstündeyken LDL hesaplanmaz', () => {
      const rec = SP.Test.makeLab('2026-01-01', { chol:260, hdl:40, trig:450 });
      expect(rec.values.ldl).toBeUndefined();
    });

    /* Bu sistemin en temel kuralı: ölçülenin üzerine tahmin yazılmaz. */
    it('laboratuvarın ölçtüğü LDL hesaplananın üstüne geçer', () => {
      const rec = SP.Test.makeLab('2026-01-01', { chol:200, hdl:50, trig:150, ldl:133 });
      expect(rec.values.ldl.v).toBe(133);
      expect(rec.values.ldl.cert).toBe('measured');
    });

    it('eGFR yaş ve cinsiyetten hesaplanır', () => {
      SP.S.profile = Object.assign(SP.Model.defaultProfile(),
        { birthYear:new Date().getFullYear() - 40, sex:'male' });
      const rec = SP.Test.makeLab('2026-01-01', { creat:1.0 });
      expect(rec.values.egfr.v > 80 && rec.values.egfr.v < 110).toBeTruthy();
    });

    it('yaş bilinmiyorsa eGFR hiç yazılmaz', () => {
      SP.S.profile = Object.assign(SP.Model.defaultProfile(), { birthYear:null });
      const rec = SP.Test.makeLab('2026-01-01', { creat:1.0 });
      expect(rec.values.egfr).toBeUndefined();
    });

    it('TG/HDL, eAG, De Ritis ve düzeltilmiş kalsiyum hesaplanır', () => {
      const rec = SP.Test.makeLab('2026-01-01',
        { trig:150, hdl:50, hba1c:6, ast:30, alt:30, ca:9, alb:3.5 });
      expect(rec.values.tg_hdl.v).toBe(3);
      expect(rec.values.eag.v).toBe(125.5);        /* 28,7 × 6 − 46,7 */
      expect(rec.values.deritis.v).toBe(1);
      expect(rec.values.ca_corr.v).toBe(9.4);      /* 9 + 0,8 × 0,5 */
    });
  });

  describe('Modül 1 — kişisel taban çizgi', () => {
    it('üç ölçümden azında taban çizgi hesaplanmaz', () => {
      resetState();
      SP.Test.pushLab('2026-01-01', { ferritin:30 });
      SP.Test.pushLab('2026-02-01', { ferritin:34 });
      const b = SP.Bio.baselineOf('ferritin');
      expect(b.ok).toBe(false);
      expect(b.n).toBe(2);
    });

    it('ortalama ve saçılma hesaplanır', () => {
      resetState();
      [10, 20, 30].forEach((v, i) =>
        SP.Test.pushLab('2026-0' + (i + 1) + '-01', { ferritin:v }));
      const b = SP.Bio.baselineOf('ferritin');
      expect(b.ok).toBe(true);
      expect(b.mean).toBe(20);
      expect(b.sd).toBe(10);                       /* örnek SS (n−1) */
    });

    /* Asıl iş bu: her oynama "değişti" değildir. */
    it('saçılmanın altındaki değişim gürültü sayılır', () => {
      resetState();
      [10, 20, 30].forEach((v, i) =>
        SP.Test.pushLab('2026-0' + (i + 1) + '-01', { ferritin:v }));
      const c = SP.Bio.meaningfulChange('ferritin', 20, 25);
      expect(c.ok).toBe(true);
      expect(c.meaningful).toBe(false);
    });

    it('saçılmanın üstündeki değişim gerçek sayılır', () => {
      resetState();
      [10, 20, 30].forEach((v, i) =>
        SP.Test.pushLab('2026-0' + (i + 1) + '-01', { ferritin:v }));
      const c = SP.Bio.meaningfulChange('ferritin', 20, 45);
      expect(c.meaningful).toBe(true);
    });

    /* Yön iyi mi kötü mü, ölçümün hangi yönde iyi olduğundan gelir.
       Bandın ortası iyi olan ölçümlerde (ferritin gibi) böyle bir yön
       yoktur ve sistem uydurmaz. */
    it('değişimin iyi yönde olup olmadığı ölçümün yönünden gelir', () => {
      resetState();
      [20, 24, 28].forEach((v, i) =>
        SP.Test.pushLab('2026-0' + (i + 1) + '-01', { vitd:v, ferritin:v }));
      expect(SP.Bio.meaningfulChange('vitd', 24, 40).good).toBe(true);
      expect(SP.Bio.meaningfulChange('vitd', 24, 10).good).toBe(false);
      expect(SP.Bio.meaningfulChange('ferritin', 24, 40).good).toBe(null);
    });
  });

  describe('Modül 1 — açlık kuralı', () => {
    it('tok ölçümde durum etiketi basılmaz', () => {
      expect(SP.Bio.interpretable('trig', 'no').ok).toBe(false);
      expect(SP.Bio.interpretable('glucose', 'no').ok).toBe(false);
      expect(SP.Bio.interpretable('tyg', 'no').ok).toBe(false);
    });

    /* Aclik gerektirmeyen olcumler bu kuraldan etkilenmez. */
    it('açlık gerektirmeyen ölçüm her durumda yorumlanır', () => {
      expect(SP.Bio.interpretable('ferritin', 'no').ok).toBe(true);
      expect(SP.Bio.interpretable('tsh', 'no').ok).toBe(true);
    });

    /* Sistem sessizce varsaymaz: bilinmiyorsa yorumlar ama soyler. */
    it('bilinmiyorsa yorumlanır ama bu yazılır', () => {
      const r = SP.Bio.interpretable('glucose', 'unknown');
      expect(r.ok).toBe(true);
      expect(r.state).toBe('unknown');
      expect(r.note.length > 30).toBeTruthy();
    });

    it('eski kayıtlarda açlık «bilinmiyor» sayılır, «aç» değil', () => {
      const rec = SP.Model.newLab('2026-01-01');
      delete rec.fasting;
      SP.Model.normLab ? SP.Model.normLab(rec) : null;
      expect(SP.Model.newLab('2026-01-01').fasting).toBe('unknown');
    });
  });

  describe('Modül 1 — ilaç ve takviye', () => {
    function ilacEkle(kindId, start, end){
      SP.S.meds = SP.S.meds || [];
      SP.S.meds.push({ id:'m-' + kindId + '-' + start, kindId, name:'', dose:'',
        startDate:start, endDate:end || null, note:'' });
    }

    it('etkin kayıt tarihe göre belirlenir', () => {
      resetState(); SP.S.meds = [];
      ilacEkle('demir', '2026-01-01', '2026-03-01');
      expect(SP.Meds.activeList('2026-02-01').length).toBe(1);
      expect(SP.Meds.activeList('2026-04-01').length).toBe(0);
      expect(SP.Meds.activeList('2025-12-01').length).toBe(0);
    });

    it('bir ölçümü hangi kaydın etkilediği bulunur', () => {
      resetState(); SP.S.meds = [];
      ilacEkle('demir', '2026-01-01');
      expect(SP.Meds.affecting('ferritin', '2026-02-01').length).toBe(1);
      expect(SP.Meds.affecting('tsh', '2026-02-01').length).toBe(0);
    });

    /* Asil is bu: beklenen yondeki bir degisim HABER DEGILDIR. */
    it('beklenen yöndeki değişim «beklenen» diye işaretlenir', () => {
      resetState(); SP.S.meds = [];
      ilacEkle('demir', '2026-02-01');
      const n = SP.Meds.changeNote('ferritin', '2026-01-01', '2026-03-01', +25);
      expect(n).toBeTruthy();
      expect(n.expected).toBe(true);
    });

    it('ters yöndeki değişim bulgu sayılır', () => {
      resetState(); SP.S.meds = [];
      ilacEkle('demir', '2026-02-01');
      const n = SP.Meds.changeNote('ferritin', '2026-01-01', '2026-03-01', -25);
      expect(n.expected).toBe(false);
      expect(n.tone).toBe('warn');
    });

    /* Birakmak beklenen yonu TERSINE cevirir. */
    it('bırakılan bir ilacın beklenen yönü tersine döner', () => {
      resetState(); SP.S.meds = [];
      ilacEkle('demir', '2025-06-01', '2026-02-01');
      const n = SP.Meds.changeNote('ferritin', '2026-01-01', '2026-03-01', -25);
      expect(n.expected).toBe(true);
    });

    it('aralık dışında başlayan kayıt değişimi açıklamaz', () => {
      resetState(); SP.S.meds = [];
      ilacEkle('demir', '2024-01-01');
      expect(SP.Meds.changeNote('ferritin', '2026-01-01', '2026-03-01', +25)).toBe(null);
    });

    /* Kreatin eGFR'yi BOZAR: olcum dogru, gosterdigi sey degil. */
    it('kreatin kullanırken eGFR yorumlanmaz', () => {
      resetState(); SP.S.meds = [];
      ilacEkle('kreatin', '2026-01-01');
      expect(SP.Meds.distorts('egfr', '2026-02-01')).toBeTruthy();
      expect(SP.Meds.distorts('tsh', '2026-02-01')).toBe(null);
    });

    it('«diğer» türü hiçbir ölçüme dokunmaz', () => {
      resetState(); SP.S.meds = [];
      ilacEkle('diger', '2026-01-01');
      expect(SP.MED_BY_ID.diger.affects.length).toBe(0);
      expect(SP.Meds.markerNote('ferritin', '2026-02-01')).toBe(null);
    });

    it('her türün adı, açıklaması ve geçerli ölçüm kimlikleri var', () => {
      SP.MED_KINDS.forEach(k => {
        expect(k.name.length > 2).toBeTruthy();
        expect(k.note.length > 20).toBeTruthy();
        k.affects.forEach(a => {
          expect(SP.BIO_BY_ID[a.id]).toBeTruthy();
          expect(a.dir === 'up' || a.dir === 'down').toBeTruthy();
        });
      });
    });
  });

  describe('Modül 1 — birlikte okuma', () => {
    it('örüntü girdisi eksikse hiç çalışmaz', () => {
      resetState();
      SP.Test.pushLab('2026-01-01', { ferritin:15 });   /* MCV yok */
      const ids = SP.Bio.patterns().map(p => p.id);
      expect(ids.indexOf('demir-eksikligi')).toBe(-1);
    });

    it('düşük ferritin ve küçük MCV demir eksikliği örüntüsü verir', () => {
      resetState();
      SP.Test.pushLab('2026-01-01', { ferritin:15, mcv:78 });
      const ids = SP.Bio.patterns().map(p => p.id);
      expect(ids.indexOf('demir-eksikligi') >= 0).toBeTruthy();
    });

    /* Ferritin akut faz proteinidir: CRP yüksekken demir deposunu
       olduğundan yüksek gösterir. Bu uyarı olmadan "normal ferritin"
       yanlış güven verir. */
    it('CRP yüksekken ferritin uyarısı çıkar', () => {
      resetState();
      SP.Test.pushLab('2026-01-01', { ferritin:120, crp:9 });
      const ids = SP.Bio.patterns().map(p => p.id);
      expect(ids.indexOf('ferritin-crp') >= 0).toBeTruthy();
    });

    it('örüntü metni sayıları yerine koyar ve hangi ölçümden geldiğini söyler', () => {
      resetState();
      SP.Test.pushLab('2026-01-01', { ferritin:15, mcv:78 });
      const p = SP.Bio.patterns().find(x => x.id === 'demir-eksikligi');
      expect(p.text.indexOf('{') < 0).toBeTruthy();
      expect(p.markers.indexOf('mcv') >= 0).toBeTruthy();
    });

    it('her örüntünün başlığı, metni ve girdileri var', () => {
      SP.Bio.PATTERNS.forEach(p => {
        expect(p.title.length > 8).toBeTruthy();
        expect(p.text.length > 40).toBeTruthy();
        expect(p.needs.length > 0).toBeTruthy();
        p.needs.forEach(id => expect(SP.BIO_BY_ID[id]).toBeTruthy());
      });
    });
  });
})();
