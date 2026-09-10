/* Ofis — brifing üretimi, kural motoru metni, çıktı denetimi ve gündem.

   En kritik test: model kapalıyken ofis kapanmamalı. İkincisi: model açıkken
   bile ev kurallarını çiğneyen bir çıktı ekrana basılmamalı. */

(function(){
  const { describe, it, expect, resetState, withToday, pushLab, pushVitals, pushMeal, pushWorkout } = SP.Test;
  const U = SP.U;

  describe('Ofis — brifingler', () => {
    it('her ajanın brifingi kendi id\'sini taşır', () => {
      resetState();
      ['lab', 'nutri', 'move', 'money', 'patron'].forEach(id => {
        expect(SP.Office.brief(id).agent).toBe(id);
      });
    });

    it('laboratuvar brifingi açık bayrakları taşır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:5 });
        SP.S.flags = SP.Model.evaluateFlags().map(f =>
          Object.assign({ status:'open', ack:false }, f));
        const b = SP.Office.labBrief();
        expect(b.flags.length > 0).toBeTruthy();
      });
    });

    it('beslenme brifingi profil eksikse bunu bildirir', () => {
      resetState();
      SP.S.profile.heightCm = null;
      const b = SP.Office.nutriBrief();
      expect(b.targetsOk).toBeFalsy();
      expect(b.missingProfile.length > 0).toBeTruthy();
    });

    it('hareket brifingi ölçüm yoksa toparlanmayı null verir', () => {
      resetState();
      withToday('2026-03-01', () => {
        expect(SP.Office.moveBrief().readiness).toBeNull();
      });
    });

    it('ekonomi brifingi boş sepette sıfır kalem gösterir', () => {
      resetState();
      expect(SP.Office.moneyBrief().itemCount).toBe(0);
    });

    it('patron brifingi dört uzmanı birden taşır', () => {
      resetState();
      const b = SP.Office.patronBrief();
      ['lab', 'nutri', 'move', 'money'].forEach(k => expect(b[k]).toBeTruthy());
      expect(typeof b.headline).toBe('string');
    });

    it('brifing JSON\'a çevrilebilir — modele giden şey budur', () => {
      resetState();
      SP.AGENTS.forEach(a => {
        const s = JSON.stringify(SP.Office.brief(a.id));
        expect(typeof s).toBe('string');
        expect(s.length > 2).toBeTruthy();
      });
    });

    it('brifingde ad ve doğum tarihi geçmez', () => {
      resetState();
      SP.S.profile.name = 'GizliAd';
      SP.S.profile.birthYear = 1991;
      const s = JSON.stringify(SP.Office.patronBrief());
      expect(s.indexOf('GizliAd') < 0).toBeTruthy();
      expect(s.indexOf('1991') < 0).toBeTruthy();
    });
  });

  describe('Ofis — kural motoru metni', () => {
    it('her ajan model olmadan cümle üretir', () => {
      resetState();
      withToday('2026-03-01', () => {
        SP.AGENTS.forEach(a => {
          const t = SP.Office.ruleText(a.id);
          expect(typeof t).toBe('string');
          expect(t.length > 15).toBeTruthy();
        });
      });
    });

    it('bayrak varsa laboratuvar cümlesi onunla başlar', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:5 });
        SP.S.flags = SP.Model.evaluateFlags().map(f => Object.assign({ status:'open' }, f));
        const t = SP.Office.ruleText('lab');
        expect(t.indexOf('kırmızı bayrak')).toBe(2);
      });
    });

    it('beslenme cümlesi profil eksikliğini açıkça söyler', () => {
      resetState();
      SP.S.profile.weightKg = null;
      expect(SP.Office.ruleText('nutri')).toContain('eksik');
    });

    it('ekonomi cümlesi boş sepeti söyler', () => {
      resetState();
      expect(SP.Office.ruleText('money')).toContain('boş');
    });

    it('hareket cümlesi yük emrini taşır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:8, soreness:5 });
        expect(SP.Office.ruleText('move')).toContain('Toparlanma');
      });
    });

    it('patron cümlesi asgari günü ve seriyi taşır', () => {
      resetState();
      withToday('2026-03-01', () => {
        expect(SP.Office.ruleText('patron')).toContain('Asgari gün');
      });
    });
  });

  describe('Ofis — çıktı denetimi', () => {
    it('temiz metin geçer', () => {
      const v = SP.Office.validate('Ferritin düşük görünüyor; demir kaynaklarını artırmak yardımcı olabilir.');
      expect(v.ok).toBeTruthy();
      expect(v.violations).toHaveLength(0);
    });

    it('doz önerisi reddedilir', () => {
      const v = SP.Office.validate('Günde 5000 IU D vitamini al.');
      expect(v.ok).toBeFalsy();
      expect(v.violations[0].id).toBe('dose');
    });

    it('teşhis ifadesi reddedilir', () => {
      const v = SP.Office.validate('Sende demir eksikliği anemisi hastalığı var.');
      expect(v.ok).toBeFalsy();
    });

    it('sonuç garantisi reddedilir', () => {
      const v = SP.Office.validate('Bu değer kesinlikle üç ayda düzelir.');
      expect(v.ok).toBeFalsy();
    });

    it('tedaviyi bırakma önerisi reddedilir', () => {
      const v = SP.Office.validate('Doktorun verdiği ilacı bırak.');
      expect(v.ok).toBeFalsy();
    });

    it('ihlal nedeni okunabilir metinle döner', () => {
      const v = SP.Office.validate('Günde 5000 IU D vitamini al.');
      expect(v.note.length > 5).toBeTruthy();
    });
  });

  describe('Ofis — model yokken', () => {
    it('ask kural motoru cümlesiyle döner', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      const res = await SP.Office.ask('lab', 'Durum nedir?');
      expect(res.source).toBe('rules');
      expect(res.text.length > 15).toBeTruthy();
    });

    it('sohbet yine kaydedilir', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      await SP.Office.send('nutri', 'En büyük açığım ne?');
      const msgs = SP.S.officeChats.nutri;
      expect(msgs).toHaveLength(2);
      expect(msgs[0].role).toBe('user');
      expect(msgs[1].source).toBe('rules');
    });

    it('sohbet temizlenebilir', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      await SP.Office.send('nutri', 'soru');
      await SP.Office.clearChat('nutri');
      expect(SP.S.officeChats.nutri).toHaveLength(0);
    });

    it('günlük brifing günde bir kez üretilir', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      await SP.Test.withTodayAsync('2026-03-01', async () => {
        const a = await SP.Office.dailyBriefing();
        const b = await SP.Office.dailyBriefing();
        expect(a.at).toBe(b.at);
      });
    });

    it('zorlanınca brifing yeniden üretilir', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      await SP.Test.withTodayAsync('2026-03-01', async () => {
        const a = await SP.Office.dailyBriefing();
        await new Promise(r => setTimeout(r, 5));
        const b = await SP.Office.dailyBriefing(true);
        expect(a.at !== b.at).toBeTruthy();
      });
    });
  });

  describe('Ofis — sistem istemi', () => {
    it('istem ajanın alanını ve alan dışını taşır', () => {
      resetState();
      const p = SP.Office.systemPrompt('lab', SP.Office.labBrief());
      expect(p).toContain('Kerem');
      expect(p).toContain('BRİFİNG');
      expect(p).toContain('Sayı üretme');
    });

    it('istem klinik sınırı içerir', () => {
      resetState();
      const p = SP.Office.systemPrompt('patron', SP.Office.patronBrief());
      expect(p).toContain('Teşhis koyma');
    });
  });

  describe('Ofis — masa notları', () => {
    it('sorun yoksa not az olur', () => {
      resetState();
      withToday('2026-03-01', () => {
        const n = SP.Office.notes();
        expect(Array.isArray(n)).toBeTruthy();
      });
    });

    it('kırmızı bayrak laboratuvar masasına not bırakır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:5 });
        SP.S.flags = SP.Model.evaluateFlags().map(f => Object.assign({ status:'open' }, f));
        const n = SP.Office.notes().filter(x => x.agent === 'lab' && x.kind === 'flag');
        expect(n.length > 0).toBeTruthy();
      });
    });

    it('sepet aşımı ekonomi masasına not bırakır', () => {
      resetState();
      withToday('2026-03-01', () => {
        SP.S.basket.items = [{ foodId:'dana-eti', kg:3 }];
        SP.S.basket.weeklyLimit = 100;
        expect(SP.Office.notes().some(x => x.agent === 'money' && x.kind === 'debt')).toBeTruthy();
      });
    });

    it('açık kalan karar patrona not bırakır', () => {
      resetState();
      withToday('2026-03-10', () => {
        SP.S.decisions = [{ id:'d1', title:'Test kararı', at:'2026-03-01T10:00:00.000Z', status:'open' }];
        expect(SP.Office.notes().some(x => x.agent === 'patron' && x.kind === 'debt')).toBeTruthy();
      });
    });

    it('her notun tonu tanımlı bir tondan gelir', () => {
      resetState();
      withToday('2026-03-01', () => {
        SP.S.basket.items = [{ foodId:'dana-eti', kg:3 }];
        SP.S.basket.weeklyLimit = 100;
        SP.Office.notes().forEach(n => {
          expect(['ok', 'warn', 'danger', 'info', 'muted'].indexOf(n.tone) >= 0).toBeTruthy();
        });
      });
    });
  });

  describe('Ofis — gündem', () => {
    it('gündem her zaman en az bir aday üretir', () => {
      resetState();
      withToday('2026-03-01', () => {
        expect(SP.Office.agendaCandidates().length > 0).toBeTruthy();
      });
    });

    it('kırmızı bayrak gündemin başına geçer', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:5 });
        SP.S.flags = SP.Model.evaluateFlags().map(f => Object.assign({ status:'open' }, f));
        expect(SP.Office.agendaCandidates()[0].id).toBe('red-flag');
      });
    });

    it('gündem puana göre azalan sıralı', () => {
      resetState();
      withToday('2026-03-01', () => {
        const rows = SP.Office.agendaCandidates();
        for(let i = 1; i < rows.length; i++){
          expect(rows[i].score <= rows[i - 1].score).toBeTruthy();
        }
      });
    });

    it('her gündem maddesinin sahibi bir ajandır', () => {
      resetState();
      withToday('2026-03-01', () => {
        SP.Office.agendaCandidates().forEach(a => {
          expect(SP.AGENT_BY_ID[a.owner]).toBeTruthy();
        });
      });
    });
  });

  describe('Ofis — toplantı', () => {
    it('toplantı beş turluk tutanak üretir', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      await SP.Test.withTodayAsync('2026-03-01', async () => {
        const rec = await SP.Office.runMeeting(null);
        expect(rec.turns).toHaveLength(4);
        expect(typeof rec.closing).toBe('string');
        expect(rec.closing.length > 15).toBeTruthy();
      });
    });

    it('turlar sırasıyla dört uzmandan gelir', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      await SP.Test.withTodayAsync('2026-03-01', async () => {
        const rec = await SP.Office.runMeeting(null);
        expect(rec.turns.map(t => t.agent)).toEqual(['lab', 'nutri', 'move', 'money']);
      });
    });

    it('tutanak duruma yazılır', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      await SP.Test.withTodayAsync('2026-03-01', async () => {
        await SP.Office.runMeeting(null);
        expect(SP.S.officeMeetings.length).toBe(1);
      });
    });

    it('tutanaktaki karar kural motorundan gelir', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      await SP.Test.withTodayAsync('2026-03-01', async () => {
        const rec = await SP.Office.runMeeting(null);
        expect(rec.decision.id).toBe(SP.Calc.nextAction().id);
      });
    });

    it('her tur geldiğinde geri çağrı tetiklenir', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });
      await SP.Test.withTodayAsync('2026-03-01', async () => {
        const seen = [];
        await SP.Office.runMeeting(null, t => seen.push(t.agent));
        expect(seen).toHaveLength(4);
      });
    });
  });

  describe('Ofis — ayarlar', () => {
    it('varsayılan sağlayıcı yerleşik yetenektir', () => {
      resetState();
      SP.S.office = null;
      expect(SP.Office.settings().provider).toBe('builtin');
    });

    it('ajan başına ayar genel ayarı ezer', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'builtin', model:'default',
        perAgent:{ lab:{ provider:'groq', model:'x' } } });
      expect(SP.Office.cfgFor('lab').provider).toBe('groq');
      expect(SP.Office.cfgFor('nutri').provider).toBe('builtin');
    });
  });
})();
