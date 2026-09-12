/* Ofis — brifing, mahremiyet siniri ve cikti denetimi.

   Bu paketteki en onemli test «brifingde ad ve ham metin gecmez»dir:
   mahremiyet bir niyet degil, bir DENETIMDIR. */

(function(){
  const { describe, it, expect, resetState, withToday,
    pushSession, pushCard, pushNote, pushBook, pushPiece, pushArgument } = ESP.Test;
  const O = ESP.Office, M = ESP.Model, S = ESP.S;

  describe('brifing', () => {

    it('yedi ajanin yedisinin de brifingi vardir', () => {
      resetState();
      ESP.AGENTS.forEach(a => {
        const b = O.brief(a.id);
        expect(typeof b).toBe('object');
        expect(b.agent).toBe(a.id);
      });
    });

    it('brifingde profil ADI GECMEZ', () => {
      resetState();
      S.profile.name = 'Ömer Faruk';
      const json = JSON.stringify(O.patronBrief());
      expect(json.indexOf('Ömer') >= 0).toBe(false);
    });

    it('brifingde atomik notun METNI gecmez', () => {
      resetState();
      const b = pushBook('Devlet', 'Platon');
      pushNote('Gizli kalması gereken özel bir düşünce.', b.id, ['adalet']);
      const json = JSON.stringify(O.readingBrief());
      expect(json.indexOf('Gizli kalması') >= 0).toBe(false);
    });

    it('brifingde taslak METNI gecmez', async () => {
      resetState();
      await M.saveDraft(M.newDraft({ title:'Deneme',
        text:'Bu cümle brifinge sızmamalı. Uzun bir metnin parçası.' }));
      const json = JSON.stringify(O.writingBrief());
      expect(json.indexOf('sızmamalı') >= 0).toBe(false);
    });

    it('brifingde tezin METNI gecmez — tez yalnizca sayilir', () => {
      resetState();
      pushArgument('Bu tez brifinge girmemeli.', ['İtiraz']);
      const json = JSON.stringify(O.philoBrief());
      expect(json.indexOf('girmemeli') >= 0).toBe(false);
    });

    it('her metrik KESINLIK etiketi tasir', () => {
      resetState();
      const b = O.langBrief();
      expect(!!b.retention.cert).toBe(true);
      expect(!!b.practice.cert).toBe(true);
      expect(!!b.cards.cert).toBe(true);
    });
  });

  describe('kural motorunun cumlesi', () => {

    it('model kapaliyken her ajan konusabilir', () => {
      withToday('2026-09-12', () => {
        resetState();
        ESP.AGENTS.forEach(a => {
          const t = O.ruleText(a.id);
          expect(typeof t).toBe('string');
          expect(t.length > 10).toBe(true);
        });
      });
    });

    it('bos sistemde bile cumle uretilir — ofis kapanmaz', () => {
      withToday('2026-09-12', () => {
        resetState();
        expect(O.ruleText('patron').length > 10).toBe(true);
      });
    });

    it('olculmemis metrik «veri yok» diye yazilir, sifir diye degil', () => {
      withToday('2026-09-12', () => {
        resetState();
        const t = O.ruleText('polyglot');
        expect(/0 kart|%0/.test(t)).toBe(false);
      });
    });
  });

  describe('cikti denetimi', () => {

    it('metni YENIDEN YAZMAZ — oldugu gibi geri verir', () => {
      resetState();
      const metin = 'Artık C1 seviyesindesin, sertifikaya hazırsın.';
      const r = O.validate(metin, { agentId:'polyglot' });
      expect(r.text).toBe(metin);
    });

    it('sahte sertifikasyon yakalanir', () => {
      resetState();
      const r = O.validate('Sertifikaya hazırsın, başvurabilirsin.', { agentId:'polyglot' });
      expect(r.ok).toBe(false);
      expect(r.violations.some(v => v.id === 'certify')).toBe(true);
    });

    it('mutlak yetenek yargisi yakalanir', () => {
      resetState();
      const r = O.validate('Bu alanda yeteneksizsin.', { agentId:'maestro' });
      expect(r.violations.some(v => v.id === 'talent')).toBe(true);
    });

    it('sonuc garantisi yakalanir', () => {
      resetState();
      const r = O.validate('Bu tempoyla kesinlikle üç ayda konsere çıkarsın.',
        { agentId:'maestro' });
      expect(r.violations.some(v => v.id === 'guarantee')).toBe(true);
    });

    it('estetik otorite iddiasi yakalanir', () => {
      resetState();
      const r = O.validate('Bu deneme yayımlanmaya hazır.', { agentId:'montaigne' });
      expect(r.violations.some(v => v.id === 'aesthetic')).toBe(true);
    });

    it('dogru bicimli seviye cumlesi TAKILMAZ', () => {
      resetState();
      const r = O.validate('Son 30 günlük üretimin B2 bandının kriterlerini karşılıyor '
        + '— bu bir öz-değerlendirmedir, resmî sınav yerine geçmez.',
        { agentId:'polyglot' });
      expect(r.violations.length).toBe(0);
    });

    it('brifingde olmayan sayi «desteksiz» olarak isaretlenir', () => {
      withToday('2026-09-12', () => {
        resetState();
        const b = O.langBrief();
        const r = O.validate('Retansiyonun %87 seviyesinde.', { agentId:'polyglot', brief:b });
        expect(r.unsupported.length > 0).toBe(true);
      });
    });

    it('kucuk sayilar desteksiz sayilmaz — dilin kendisidir', () => {
      withToday('2026-09-12', () => {
        resetState();
        const b = O.langBrief();
        const r = O.validate('Bugün iki kart çözdün, üç gün oldu.',
          { agentId:'polyglot', brief:b });
        expect(r.unsupported.length).toBe(0);
      });
    });
  });

  describe('masa notlari', () => {

    it('not bir BULGU\'dur: kosul yoksa not da yok', () => {
      withToday('2026-09-12', () => {
        resetState();
        const n = O.notes('maestro');
        expect(n.length).toBe(0);
      });
    });

    it('plato bulgusu Maestro\'nun masasina duser', () => {
      withToday('2026-09-12', () => {
        resetState();
        const p = pushPiece('Gam', { cleanBpm:100, thresholdAt:'2026-08-20' });
        p.attempts = [{ date:'2026-09-11', bpm:100, clean:true }];
        ESP.Memo.bitir();
        const n = O.notes('maestro');
        expect(n.some(x => x.kind === 'blocked')).toBe(true);
      });
    });

    it('her notun bir tonu ve etiketi vardir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushCard({ front:'a', due:'2026-09-01', reps:1, box:2, interval:1, ease:2.5 });
        ESP.Memo.bitir();
        O.notes().forEach(n => {
          expect(!!n.tone).toBe(true);
          expect(!!n.label).toBe(true);
        });
      });
    });
  });

  describe('devir', () => {

    it('devir iki AYRI masayi baglar', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'lang', 60);
        ESP.Memo.bitir();
        O.handoffs().forEach(h => expect(h.from === h.to).toBe(false));
      });
    });

    it('bir masanin kendi defteri gelen ve gideni ayirir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'lang', 60);
        ESP.Memo.bitir();
        const d = O.handoffsFor('polyglot');
        expect(Array.isArray(d.in)).toBe(true);
        expect(Array.isArray(d.out)).toBe(true);
      });
    });
  });

  describe('gundem', () => {

    it('gundem PUANLAMA ile secilir, model secmez', () => {
      withToday('2026-09-12', () => {
        resetState();
        const a = O.agendaCandidates();
        expect(a.length > 0).toBe(true);
        for(let i = 1; i < a.length; i++){
          expect(a[i - 1].score >= a[i].score).toBe(true);
        }
      });
    });

    it('hicbir sey yoksa haftalik gozden gecirme kalir', () => {
      withToday('2026-09-12', () => {
        resetState();
        const a = O.agendaCandidates();
        expect(a[a.length - 1].id).toBe('review');
      });
    });
  });

  describe('sistem istemi', () => {

    it('istem brifingi TASIR — ajan baska kaynaktan sayi alamaz', () => {
      withToday('2026-09-12', () => {
        resetState();
        const b = O.langBrief();
        const p = O.systemPrompt('polyglot', b);
        expect(p.indexOf('BRİFİNG') >= 0).toBe(true);
        expect(p.indexOf('Sayı üretme') >= 0).toBe(true);
      });
    });

    it('istem pedagojik siniri yazar', () => {
      resetState();
      const p = O.systemPrompt('polyglot', O.langBrief());
      expect(/sertifika|seviye/i.test(p)).toBe(true);
    });
  });
})();
