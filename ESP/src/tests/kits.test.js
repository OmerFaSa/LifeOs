/* Bölüm kitleri — veri bütünlüğü.

   Bu dosyadaki testlerin hepsi aynı işi yapar: bir listeye yeni satır
   eklerken zorunlu alanı unutmayı hata hâline getirir. Eksik alan ekranda
   «undefined» diye çizilir ve kimse fark etmez; burada ise test kalır. */

(function(){
  const { describe, it, expect } = ESP.Test;

  function alanlar(list, keys){
    return (list || []).filter(x => keys.some(k => !String(x[k] || '').trim()))
      .map(x => x.id || x.label).join(',');
  }

  describe('kit · dilbilgisi', () => {
    it('her konunun bandi, yapabilirim cumlesi ve tuzagi var', () => {
      expect(alanlar(ESP.GRAMMAR_TOPICS, ['id', 'band', 'label', 'can', 'trap'])).toBe('');
    });
    it('her bant gercek bir CEFR bandidir', () => {
      const bantlar = ESP.CEFR.map(b => b.label);
      const kotu = ESP.GRAMMAR_TOPICS.filter(t => bantlar.indexOf(t.band) < 0);
      expect(kotu.map(t => t.id).join(',')).toBe('');
    });
    it('her CEFR bandinda en az bir konu var', () => {
      const bos = ESP.CEFR.filter(b => !(ESP.GRAMMAR_BY_BAND[b.label] || []).length);
      expect(bos.map(b => b.label).join(',')).toBe('');
    });
    it('hata taksonomisinde kacinma satiri vardir', () => {
      expect(ESP.PRODUCTION_ERRORS.some(e => e.id === 'atlama')).toBeTruthy();
    });
  });

  describe('kit · yazi araclari', () => {
    it('her figurun ne yaptigi, nedeni ve ornegi var', () => {
      expect(alanlar(ESP.RHETORIC, ['id', 'label', 'what', 'why', 'ex'])).toBe('');
    });
    it('revizyon gecisleri tekil ve sirali', () => {
      const s = ESP.REVISION_PASSES.map(r => r.order);
      expect(s.join(',')).toBe(s.slice().sort((a, b) => a - b).join(','));
      expect(s.length).toBe(s.filter((x, i) => s.indexOf(x) === i).length);
    });
    it('yapi geçişi birinci sirada: yapi duzelmeden cumle cilalanmaz', () => {
      expect(ESP.REVISION_PASSES.filter(r => r.order === 1)[0].id).toBe('yapi');
    });
    it('okunabilirlik olcumu cumle gecisinden SONRA alinir', () => {
      const cumle = ESP.REVISION_PASSES.filter(r => r.id === 'cumle')[0];
      expect(cumle.note.indexOf('SONRA') > 0).toBeTruthy();
    });
    it('her yapi kalibinin adimlari var', () => {
      const kotu = ESP.STRUCTURES.filter(s => !(s.shape || []).length);
      expect(kotu.map(s => s.id).join(',')).toBe('');
    });
  });

  describe('kit · kulak egitimi', () => {
    it('araliklar yarim ses sayisina gore sirali ve tekil', () => {
      const n = ESP.INTERVALS.map(i => i.semitones);
      expect(n.join(',')).toBe(n.slice().sort((a, b) => a - b).join(','));
      expect(n.length).toBe(n.filter((x, i) => n.indexOf(x) === i).length);
    });
    it('oktav on iki yarim sestir', () => {
      expect(ESP.INTERVAL_BY_ID.ok.semitones).toBe(12);
    });
    it('her kulak egzersizi NE OLCULDUGUNU soyler', () => {
      expect(alanlar(ESP.EAR_DRILLS, ['id', 'label', 'task', 'measures'])).toBe('');
    });
    it('CAGED bes sekildir', () => {
      expect(ESP.CAGED.length).toBe(5);
      expect(ESP.CAGED.map(c => c.shape).join('')).toBe('CAGED');
    });
    it('repertuarda «bitti» diye bir hal yoktur', () => {
      expect(ESP.REPERTOIRE_STATES.some(s => /bitti/i.test(s.label))).toBeFalsy();
    });
  });

  describe('kit · okuma yontemi', () => {
    it('dort duzey sirali', () => {
      expect(ESP.READING_LEVELS.map(l => l.rank).join(',')).toBe('1,2,3,4');
    });
    it('analitik okumanin dort sorusu var', () => {
      expect(ESP.ANALYTIC_QUESTIONS.length).toBe(4);
      expect(alanlar(ESP.ANALYTIC_QUESTIONS, ['id', 'q', 'note'])).toBe('');
    });
    it('protokol adimlari sirali', () => {
      const n = ESP.READING_PROTOCOL.map(p => p.step);
      expect(n.join(',')).toBe('1,2,3,4,5');
    });
    it('her not sablonunun bicimi ve kullanimi var', () => {
      expect(alanlar(ESP.NOTE_TEMPLATES, ['id', 'label', 'form', 'use'])).toBe('');
    });
  });

  describe('kit · dusunce deneyleri', () => {
    it('her deneyin kurgusu ve zorladigi ayrim var', () => {
      expect(alanlar(ESP.EXPERIMENTS, ['id', 'label', 'field', 'setup', 'tests'])).toBe('');
    });
    it('her deneyin alani tanimli bir alandir', () => {
      const idler = ESP.EXPERIMENT_FIELDS.map(f => f.id);
      const kotu = ESP.EXPERIMENTS.filter(x => idler.indexOf(x.field) < 0);
      expect(kotu.map(x => x.id).join(',')).toBe('');
    });
    /* Cevabi yazilmis bir deney, deneyi bilgi yarismasi sorusuna cevirir. */
    it('hicbir deneyin «dogru cevabi» yazili degildir', () => {
      const kotu = ESP.EXPERIMENTS.filter(x => x.answer != null);
      expect(kotu.map(x => x.id).join(',')).toBe('');
    });
    it('arguman alistirmalarinda celik adam vardir', () => {
      expect(ESP.ARGUMENT_DRILLS.some(d => d.id === 'steelman')).toBeTruthy();
    });
  });

  describe('kit · tarih verisi', () => {
    it('donemler ortusmez ve sirali', () => {
      for(let i = 1; i < ESP.ERAS.length; i++){
        expect(ESP.ERAS[i].from > ESP.ERAS[i - 1].from).toBeTruthy();
        expect(ESP.ERAS[i].from > ESP.ERAS[i - 1].to).toBeTruthy();
      }
    });
    it('her donemin sinir tartismasi yazilidir', () => {
      expect(alanlar(ESP.ERAS, ['id', 'label', 'note', 'disputed'])).toBe('');
    });
    it('her tohum olayin NEDEN donum noktasi oldugu yazar', () => {
      expect(alanlar(ESP.SEED_EVENTS, ['title', 'why', 'kind', 'region'])).toBe('');
    });
    it('tohum olaylarin alani ve bolgesi tanimlidir', () => {
      const k = ESP.EVENT_KINDS.map(x => x.id), b = ESP.REGIONS.map(x => x.id);
      const kotu = ESP.SEED_EVENTS.filter(e =>
        k.indexOf(e.kind) < 0 || b.indexOf(e.region) < 0);
      expect(kotu.map(e => e.title).join(',')).toBe('');
    });
    it('kaynak elestirisi sekiz sorudur ve suskunluk sorusu vardir', () => {
      expect(ESP.SOURCE_CRITIQUE.length).toBe(8);
      expect(ESP.SOURCE_CRITIQUE.some(q => q.id === 'suskunluk')).toBeTruthy();
    });
    it('neden turleri arasinda yapisal ve tetikleyici ayri durur', () => {
      const idler = ESP.CAUSE_KINDS.map(k => k.id);
      expect(idler.indexOf('yapisal') >= 0 && idler.indexOf('tetikleyici') >= 0).toBeTruthy();
    });
  });

  describe('kit · merdiven metinleri', () => {
    it('hicbir kademe sure vaat etmez', () => {
      const kotu = [];
      Object.keys(ESP.LADDERS).forEach(id => {
        ESP.LADDERS[id].levels.forEach(s => {
          const metin = [s.title, s.proof].concat(s.study).join(' ');
          if(/\b(ay|hafta|gün)\s*(içinde|sonra)\b/i.test(metin)) kotu.push(id + ':' + s.rank);
        });
      });
      expect(kotu.join(',')).toBe('');
    });
    it('her kademenin kapanis isi vardir', () => {
      const kotu = [];
      Object.keys(ESP.LADDERS).forEach(id => {
        ESP.LADDERS[id].levels.forEach(s => {
          if(!String(s.proof || '').trim()) kotu.push(id + ':' + s.rank);
          if(!(s.study || []).length) kotu.push(id + ':' + s.rank + ':study');
        });
      });
      expect(kotu.join(',')).toBe('');
    });
  });
})();
