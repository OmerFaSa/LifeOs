/* Ofis katmani testleri: ajan kaydi, kural motoru brifingleri, yetki ayrimi,
   gizlilik suzgeci, gundem secimi, toplanti orkestrasyonu ve model tasima. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync, withToday, makeExam } = R.Test;
  const O = R.Office;

  /* Ofis alanlarini da temizleyen sarmalayici. */
  function reset(){
    resetState();
    R.S.office = null;
    R.S.officeChats = {};
    R.S.officeMeetings = [];
    R.S.ui.officeAgent = 'patron';
    R.S.ui.meetingAgenda = 0;
    O.resetBriefs();
  }

  /* LLM'i sahte bir motorla degistirir; gercek ag cagrisi yapilmaz. */
  async function withStubLLM(reply, fn){
    const realReady = R.LLM.ready, realComplete = R.LLM.complete;
    const calls = [];
    R.LLM.ready = () => true;
    R.LLM.complete = async (chain, req) => {
      calls.push({ chain, req });
      const text = typeof reply === 'function' ? reply(req, calls.length) : reply;
      if(req.onText) req.onText({ text, delta:text });
      return { text, provider:'stub', model:'stub-model', ms:1 };
    };
    try{ return await fn(calls); }
    finally{ R.LLM.ready = realReady; R.LLM.complete = realComplete; }
  }

  /* ==================== ajan kaydi ==================== */

  describe('Ofis — ajan kaydı', () => {
    it('beş ajan tanımlıdır', () => {
      expect(R.AGENTS).toHaveLength(5);
      expect(R.AGENT_IDS).toEqual(['patron', 'tyt', 'ayt', 'rehber', 'analist']);
    });

    it('kimlikler benzersizdir', () => {
      const ids = {}, initials = {}, names = {};
      R.AGENTS.forEach(a => { ids[a.id] = 1; initials[a.initial] = 1; names[a.name] = 1; });
      expect(Object.keys(ids)).toHaveLength(5);
      expect(Object.keys(initials)).toHaveLength(5);
      expect(Object.keys(names)).toHaveLength(5);
    });

    it('her ajanın istemi, görev alanı ve örnek soruları vardır', () => {
      R.AGENTS.forEach(a => {
        expect(a.system.length > 80).toBeTruthy();
        expect(a.desk.length > 10).toBeTruthy();
        expect(a.scope.length > 10).toBeTruthy();
        expect(a.reads.length > 0).toBeTruthy();
        expect(a.ask.length >= 3).toBeTruthy();
        expect(a.maxSentences >= 3).toBeTruthy();
        expect(R.AGENT_BY_ID[a.id]).toBe(a);
      });
    });

    it('yalnız bir lider vardır ve toplantı sırası uzmanlardan oluşur', () => {
      expect(R.AGENTS.filter(a => a.lead)).toHaveLength(1);
      expect(R.AGENTS.filter(a => a.lead)[0].id).toBe('patron');
      expect(R.MEETING_ORDER).toHaveLength(4);
      R.MEETING_ORDER.forEach(id => {
        expect(!!R.AGENT_BY_ID[id]).toBeTruthy();
        expect(R.AGENT_BY_ID[id].lead).toBeFalsy();
      });
    });

    it('istem kurucuları ev kurallarını her ajana ekler', () => {
      const sys = R.OFFICE_PROMPTS.system(R.AGENT_BY_ID.tyt, 'dengeli');
      expect(sys.indexOf('OFİS KURALLARI') > 0).toBeTruthy();
      expect(sys.indexOf(R.PROMPTS.houseRules[0]) > 0).toBeTruthy();
      expect(sys.indexOf('en fazla') > 0 || sys.indexOf('En fazla') > 0).toBeTruthy();
    });
  });

  /* ==================== brifingler ==================== */

  describe('Ofis — kural motoru brifingleri', () => {
    it('boş veride bile beş brifing üretir', () => {
      reset();
      R.AGENT_IDS.forEach(id => {
        const b = O.brief(id);
        expect(b.agent).toBe(id);
        expect(typeof b.headline).toBe('string');
        expect(b.metrics).toHaveLength(3);
        expect(Array.isArray(b.findings)).toBeTruthy();
        expect(typeof b.data).toBe('object');
      });
    });

    it('her metrik etiket, değer ve ton taşır', () => {
      reset();
      R.AGENT_IDS.forEach(id => {
        O.brief(id).metrics.forEach(m => {
          expect(typeof m.label).toBe('string');
          expect(m.value != null).toBeTruthy();
          expect(['ok', 'warn', 'danger', 'info', 'muted'].indexOf(m.tone) >= 0).toBeTruthy();
        });
      });
    });

    it('TYT uzmanı yalnız TYT derslerini görür', () => {
      reset();
      const d = O.brief('tyt').data;
      expect(d.alan).toBe('TYT');
      expect(d.dersler.length > 0).toBeTruthy();
      d.dersler.forEach(s => {
        const subj = R.SUBJECTS.find(x => x.id === s.id);
        expect(subj.exam).toBe('TYT');
      });
      d.netMatrisi.forEach(b => expect(b.test.indexOf('TYT')).toBe(0));
    });

    it('AYT uzmanı yalnız AYT derslerini görür', () => {
      reset();
      const d = O.brief('ayt').data;
      expect(d.alan).toBe('AYT');
      d.dersler.forEach(s => {
        const subj = R.SUBJECTS.find(x => x.id === s.id);
        expect(subj.exam).toBe('AYT');
      });
      d.netMatrisi.forEach(b => expect(b.test.indexOf('AYT')).toBe(0));
    });

    it('rehber netleri değil davranışı raporlar', () => {
      reset();
      const d = O.brief('rehber').data;
      expect(d.uykuHedefi != null).toBeTruthy();
      expect(d.davranisSerisi != null).toBeTruthy();
      expect(d.medyan).toBeUndefined();
      expect(d.netMatrisi).toBeUndefined();
    });

    it('analist ölçüm ve borçları raporlar', () => {
      reset();
      const d = O.brief('analist').data;
      expect(Array.isArray(d.analizBorcu)).toBeTruthy();
      expect(d.tekrar.borcYuzdesi != null).toBeTruthy();
      expect(d.konuKapanisi.toplam > 0).toBeTruthy();
    });

    it('patron kendi hesabını yapmaz, dört raporu birleştirir', () => {
      reset();
      const d = O.brief('patron').data;
      expect(d.ekipRaporlari).toHaveLength(4);
      expect(d.kuralMotorununSectigiIs.baslik.length > 0).toBeTruthy();
      const names = d.ekipRaporlari.map(r => r.ajan);
      R.MEETING_ORDER.forEach(id => expect(names).toContain(R.AGENT_BY_ID[id].name));
    });

    it('analiz borcu analistin bulgusuna düşer', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [makeExam({ date:'2026-10-01', analysisCompletedAt:null })];
        O.resetBriefs();
        const b = O.brief('analist');
        expect(b.headline.indexOf('analiz borcu') > 0).toBeTruthy();
        expect(b.findings[0].tone).toBe('danger');
        expect(b.suggestion.route).toBe('exams');
      });
    });

    it('brifing önbelleği aynı çizimde tek hesap yapar', () => {
      reset();
      const a = O.brief('tyt');
      expect(O.brief('tyt')).toBe(a);
      O.resetBriefs();
      expect(O.brief('tyt') === a).toBeFalsy();
    });

    it('snapshot beş masayı ve modu verir', () => {
      reset();
      const s = O.snapshot();
      expect(s.agents).toHaveLength(5);
      expect(s.mode).toBe('kural');
      expect(s.action.title.length > 0).toBeTruthy();
    });
  });

  /* ==================== gizlilik ==================== */

  describe('Ofis — gizlilik süzgeci', () => {
    it('kişisel alanlar modele giden veriden çıkarılır', () => {
      reset();
      R.S.profile.name = 'Ömer Faruk';
      R.S.profile.city = 'Adana';
      O.resetBriefs();
      R.AGENT_IDS.forEach(id => {
        const json = JSON.stringify(R.Tools.sanitize(O.brief(id).data));
        expect(json.indexOf('Ömer Faruk')).toBe(-1);
        expect(json.indexOf('Adana')).toBe(-1);
      });
    });

    it('API anahtarı uygulama verisinden ayrı anahtarda durur', () => {
      expect(R.LLM.KEY_STORE.indexOf('rota84285')).toBe(-1);
      expect(R.LLM.KEY_STORE).toBe('rota.llm.keys');
    });
  });

  /* ==================== gündem ==================== */

  describe('Ofis — gündem seçimi', () => {
    it('boş veride genel durum gündemi kalır', () => {
      reset();
      const list = O.agendaCandidates();
      expect(list.length > 0).toBeTruthy();
      expect(list[list.length - 1].topic).toBe('Haftanın genel durumu');
    });

    it('analiz borcu gündemi öne çeker', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [
          makeExam({ date:'2026-10-01', analysisCompletedAt:null }),
          makeExam({ date:'2026-10-02', analysisCompletedAt:null }),
        ];
        O.resetBriefs();
        const list = O.agendaCandidates();
        const debtIdx = list.findIndex(c => c.topic.indexOf('analiz borcu') > 0);
        const generalIdx = list.findIndex(c => c.topic === 'Haftanın genel durumu');
        expect(debtIdx >= 0).toBeTruthy();
        expect(list[debtIdx].data.borc).toBe(2);
        /* Yalniz aylik karar kapisi bu basligin onune gecebilir. */
        expect(debtIdx <= 1).toBeTruthy();
        expect(debtIdx < generalIdx).toBeTruthy();
      });
    });

    it('her gündem adayının puanı, nedeni ve verisi vardır', () => {
      reset();
      O.agendaCandidates().forEach(c => {
        expect(typeof c.score).toBe('number');
        expect(c.why.length > 10).toBeTruthy();
        expect(typeof c.data).toBe('object');
      });
    });

    it('adaylar puana göre azalan sıradadır', () => {
      reset();
      const list = O.agendaCandidates();
      for(let i = 1; i < list.length; i++){
        expect(list[i - 1].score >= list[i].score).toBeTruthy();
      }
    });
  });

  /* ==================== toplanti ==================== */

  describe('Ofis — toplantı', () => {
    it('model yokken kural motoru moduyla altı tur üretir', async () => {
      reset();
      const m = await O.meet();
      expect(m.turns).toHaveLength(6);
      expect(m.turns[0].agent).toBe('patron');
      expect(m.turns[5].agent).toBe('patron');
      expect(m.turns[5].closing).toBeTruthy();
      expect(m.mode).toBe('kural');
      expect(m.turns.map(t => t.agent).slice(1, 5)).toEqual(R.MEETING_ORDER);
    });

    it('karar kural motorundan gelir, ajanlar değiştiremez', async () => {
      reset();
      const expected = O.nextAction();
      const m = await withStubLLM('Bence bunun yerine tatile çıkmalısın.', async () => O.meet());
      expect(m.action.title).toBe(expected.title);
      /* nextAction() bazı dallarda rota vermez (ekranda kalınır); tutanak 'today'e düşer. */
      expect(m.action.route).toBe(expected.route || 'today');
      expect(m.turns[5].text.indexOf('tatile') >= 0).toBeTruthy();
    });

    it('model bağlıyken her tur için bir çağrı yapılır', async () => {
      reset();
      await withStubLLM('Kısa bir bulgu.', async calls => {
        const m = await O.meet();
        expect(calls).toHaveLength(6);
        expect(m.mode).toBe('llm');
        m.turns.forEach(t => expect(t.text).toBe('Kısa bir bulgu.'));
      });
    });

    it('uzmanlara yalnız kendi brifingi ve önceki konuşmalar verilir', async () => {
      reset();
      await withStubLLM('bulgu', async calls => {
        await O.meet();
        const tytCall = calls[2].req.messages[0].text;   // 0 açılış, 1 analist, 2 tyt
        expect(tytCall.indexOf('"alan": "TYT"') > 0 || tytCall.indexOf('"alan":"TYT"') > 0).toBeTruthy();
        expect(tytCall.indexOf('AYT Fizik')).toBe(-1);
        expect(tytCall.indexOf('TOPLANTIDA ŞU ANA KADAR') > 0).toBeTruthy();
      });
    });

    it('model hata verirse tur kural motoru metnine düşer', async () => {
      reset();
      const realReady = R.LLM.ready, realComplete = R.LLM.complete;
      R.LLM.ready = () => true;
      R.LLM.complete = async () => { throw Object.assign(new Error('sınır'), { code:'rate_limited' }); };
      try{
        const m = await O.meet();
        expect(m.turns).toHaveLength(6);
        expect(m.mode).toBe('kural');
        expect(m.turns[0].error.length > 0).toBeTruthy();
      }finally{
        R.LLM.ready = realReady; R.LLM.complete = realComplete;
      }
    });

    it('tutanak kaydedilir ve son toplantı olarak okunur', async () => {
      reset();
      const m = await O.meet();
      expect(O.meetings()).toHaveLength(1);
      expect(O.lastMeeting().id).toBe(m.id);
      const doc = await R.Store.get('meetings/' + m.id);
      expect(doc.topic).toBe(m.topic);
    });

    it('tutanak sayısı sınırı aşmaz', async () => {
      reset();
      for(let i = 0; i < O.MEETING_MAX + 2; i++){
        await O.saveMeeting({ id:'m' + i, at:'2026-09-' + String(i + 1).padStart(2, '0') + 'T09:00:00Z',
          topic:'t' + i, turns:[], action:{ title:'x', route:'today' }, mode:'kural' });
      }
      expect(O.meetings()).toHaveLength(O.MEETING_MAX);
    });

    it('tutanak silinebilir', async () => {
      reset();
      const m = await O.meet();
      await O.deleteMeeting(m.id);
      expect(O.meetings()).toHaveLength(0);
      expect(await R.Store.get('meetings/' + m.id)).toBeNull();
    });
  });

  /* ==================== sohbet ==================== */

  describe('Ofis — ekip sohbeti', () => {
    it('mesajlar ajan başına ayrı durur', async () => {
      reset();
      await O.pushChat('tyt', 'user', 'merhaba');
      await O.pushChat('ayt', 'user', 'selam');
      expect(O.chatOf('tyt')).toHaveLength(1);
      expect(O.chatOf('ayt')).toHaveLength(1);
      expect(O.chatOf('rehber')).toHaveLength(0);
      expect(O.chatOf('tyt')[0].text).toBe('merhaba');
    });

    it('sohbet uzunluğu sınırı aşmaz', async () => {
      reset();
      for(let i = 0; i < O.CHAT_MAX + 5; i++) await O.pushChat('tyt', 'user', 'm' + i);
      expect(O.chatOf('tyt')).toHaveLength(O.CHAT_MAX);
      expect(O.chatOf('tyt')[0].text).toBe('m5');
    });

    it('sohbet temizlenebilir', async () => {
      reset();
      await O.pushChat('tyt', 'user', 'x');
      await O.clearChat('tyt');
      expect(O.chatOf('tyt')).toHaveLength(0);
    });

    it('ajan soruyu kendi brifingiyle yanıtlar', async () => {
      reset();
      await withStubLLM('TYT tarafında kapanış düşük.', async calls => {
        const res = await O.ask('tyt', 'Nerede geride kaldım?');
        expect(res.text).toBe('TYT tarafında kapanış düşük.');
        expect(res.mode).toBe('llm');
        expect(res.agent).toBe('tyt');
        expect(calls[0].req.messages[0].text.indexOf('Nerede geride kaldım?') > 0).toBeTruthy();
        expect(calls[0].req.system.indexOf('TYT uzmanısın') > 0).toBeTruthy();
      });
    });

    it('model yokken yanıt kural motorundan gelir', async () => {
      reset();
      const res = await O.ask('analist', 'Durum ne?');
      expect(res.mode).toBe('kural');
      expect(res.text.length > 20).toBeTruthy();
    });

    it('boş soru reddedilir', async () => {
      reset();
      let code = null;
      try{ await O.ask('tyt', '   '); }catch(e){ code = e.code; }
      expect(code).toBe('empty');
    });

    it('ev kurallarını ihlal eden yanıt işaretlenir', async () => {
      reset();
      await withStubLLM('Kesinlikle kazanırsın, garanti veriyorum.', async () => {
        const res = await O.ask('patron', 'Kazanır mıyım?');
        expect(res.warnings.length > 0).toBeTruthy();
      });
    });
  });

  /* ==================== ayarlar ve model tasima ==================== */

  describe('Ofis — model ayarları', () => {
    it('varsayılan ayar yerleşik sağlayıcıdır', () => {
      reset();
      const st = O.settings();
      expect(st.provider).toBe('builtin');
      expect(st.fallback).toBeTruthy();
    });

    it('ajan başına model ofis varsayılanını geçer', async () => {
      reset();
      await O.saveSettings({ provider:'openrouter', model:'a/b:free',
        perAgent:{ patron:{ provider:'openrouter', model:'guclu/model:free' } } });
      expect(O.agentConfig('patron').model).toBe('guclu/model:free');
      expect(O.agentConfig('tyt').model).toBe('a/b:free');
    });

    it('anahtar yokken zincir boştur ve mod kural motorudur', async () => {
      reset();
      R.LLM.setKey('openrouter', '');
      await O.saveSettings({ provider:'openrouter', model:'a/b:free' });
      expect(O.chainFor('tyt')).toHaveLength(0);
      expect(O.mode()).toBe('kural');
      expect(O.ready('tyt')).toBeFalsy();
    });

    it('anahtar girilince zincir yedek modellerle dolar', async () => {
      reset();
      R.LLM.setKey('openrouter', 'sk-or-test');
      await O.saveSettings({ provider:'openrouter', model:'deepseek/deepseek-chat-v3-0324:free' });
      const chain = O.chainFor('tyt');
      expect(chain.length > 1).toBeTruthy();
      expect(chain[0].model).toBe('deepseek/deepseek-chat-v3-0324:free');
      expect(O.mode()).toBe('llm');
      R.LLM.setKey('openrouter', '');
    });

    it('yedek kapalıyken zincirde tek model kalır', async () => {
      reset();
      R.LLM.setKey('groq', 'gsk-test');
      await O.saveSettings({ provider:'groq', model:'llama-3.3-70b-versatile', fallback:false });
      expect(O.chainFor('rehber')).toHaveLength(1);
      R.LLM.setKey('groq', '');
    });
  });

  describe('Ofis — sağlayıcı kataloğu', () => {
    it('sıralama kataloğun tamamını kapsar', () => {
      expect(R.PROVIDER_ORDER.slice().sort()).toEqual(Object.keys(R.PROVIDERS).sort());
    });

    it('her sağlayıcı taşıma biçimini ve etiketini bildirir', () => {
      R.PROVIDER_ORDER.forEach(id => {
        const p = R.PROVIDERS[id];
        expect(p.id).toBe(id);
        expect(['builtin', 'openai', 'gemini']).toContain(p.kind);
        expect(p.label.length > 2).toBeTruthy();
        expect(p.note.length > 10).toBeTruthy();
        if(p.kind !== 'builtin' && !p.editableEndpoint) expect(p.endpoint.indexOf('https://')).toBe(0);
      });
    });

    it('ücretsiz sağlayıcılar model listesiyle gelir', () => {
      ['openrouter', 'groq', 'gemini'].forEach(id => {
        const p = R.PROVIDERS[id];
        expect(p.models.length > 0).toBeTruthy();
        expect(p.needsKey).toBeTruthy();
        expect(p.keyUrl.indexOf('https://')).toBe(0);
        p.models.forEach(m => {
          expect(m.id.length > 2).toBeTruthy();
          expect(m.label.length > 2).toBeTruthy();
        });
      });
    });

    it('anahtar yazılıp okunur ve maskelenir', () => {
      R.LLM.setKey('openrouter', 'sk-or-v1-0123456789abcdef');
      expect(R.LLM.getKey('openrouter')).toBe('sk-or-v1-0123456789abcdef');
      const masked = R.LLM.maskKey('openrouter');
      expect(masked.indexOf('0123456789')).toBe(-1);
      expect(masked).toContain('…');
      R.LLM.setKey('openrouter', '');
      expect(R.LLM.getKey('openrouter')).toBe('');
    });

    it('hata kodları kullanıcı diline çevrilir', () => {
      ['unauthorized', 'rate_limited', 'no_credit', 'bad_model', 'network', 'timeout']
        .forEach(code => expect(R.LLM.errorText(code).length > 10).toBeTruthy());
      expect(R.LLM.errorText('bilinmeyen-kod').length > 10).toBeTruthy();
    });

    it('yalnız geçici hatalarda yedeğe geçilir', () => {
      expect(R.LLM.retryable('rate_limited')).toBeTruthy();
      expect(R.LLM.retryable('server')).toBeTruthy();
      expect(R.LLM.retryable('unauthorized')).toBeFalsy();
      expect(R.LLM.retryable('cancelled')).toBeFalsy();
    });

    it('yapılandırma eksikse hazır sayılmaz', () => {
      expect(R.LLM.ready({ provider:'yok', model:'x' })).toBeFalsy();
      expect(R.LLM.ready({ provider:'openrouter', model:'' })).toBeFalsy();
      expect(R.LLM.ready({ provider:'custom', model:'x', endpoint:'' })).toBeFalsy();
    });
  });


  /* ==================== istek siniri (kota) ==================== */

  describe('Ofis — istek sınırı yöneticisi', () => {
    function fresh(){
      reset();
      R.Quota.reset();
      R.Quota.clearOverrides();
    }

    it('katalogdaki sınırlar okunur ve güvenlik payı uygulanır', () => {
      fresh();
      const cfg = { provider:'groq', model:'llama-3.3-70b-versatile' };
      expect(R.Quota.limitsFor(cfg).rpm).toBe(30);
      const eff = R.Quota.effective(cfg);
      expect(eff.rpm < 30).toBeTruthy();           // dakikalık sınırda pay düşülür
      expect(eff.rpd).toBe(1000);                  // günlük hak tam kullanılır
      expect(eff.gapMs > 0).toBeTruthy();          // istekler arasına boşluk konur
    });

    it('sınırı bilinmeyen sağlayıcıda kuyruk devreye girmez', () => {
      fresh();
      expect(R.Quota.effective({ provider:'builtin', model:'default' })).toBeNull();
      expect(R.Quota.check({ provider:'builtin', model:'default' }).ok).toBeTruthy();
    });

    it('ilk istek hemen geçer, ikincisi boşluk kadar bekler', async () => {
      fresh();
      const cfg = { provider:'gemini', model:'gemini-2.0-flash' };
      expect(R.Quota.check(cfg).waitMs).toBe(0);
      await R.Quota.acquire(cfg);
      const next = R.Quota.check(cfg);
      expect(next.waitMs > 0).toBeTruthy();
      expect(next.waitMs <= R.Quota.effective(cfg).gapMs).toBeTruthy();
    });

    it('günlük sayaç tutulur ve dolunca bekletmeden hata verir', async () => {
      fresh();
      const cfg = { provider:'openrouter', model:'x:free' };
      R.Quota.setOverride('openrouter', { rpm:600, rpd:2 });   // rpm yüksek: bekleme olmasın
      await R.Quota.acquire(cfg);
      await R.Quota.acquire(cfg);
      let code = null;
      try{ await R.Quota.acquire(cfg); }catch(e){ code = e.code; }
      expect(code).toBe('daily_quota');
      expect(R.Quota.status(cfg).full).toBeTruthy();
      R.Quota.clearOverrides();
    });

    it('gönderilemeyen istek günlük haktan düşülmez', async () => {
      fresh();
      const cfg = { provider:'groq', model:'llama-3.1-8b-instant' };
      await R.Quota.acquire(cfg);
      expect(R.Quota.status(cfg).usedToday).toBe(1);
      R.Quota.release(cfg);
      expect(R.Quota.status(cfg).usedToday).toBe(0);
    });

    it('sağlayıcı yine de 429 derse pencere kapatılır', async () => {
      fresh();
      const cfg = { provider:'groq', model:'llama-3.3-70b-versatile' };
      R.Quota.penalize(cfg, 30);
      expect(R.Quota.check(cfg).waitMs > 20000).toBeTruthy();
    });

    it('kullanıcı düzeltmesi katalogdan üstündür', () => {
      fresh();
      R.Quota.setOverride('openrouter', { rpd:1000 });
      expect(R.Quota.limitsFor({ provider:'openrouter', model:'a:free' }).rpd).toBe(1000);
      R.Quota.clearOverrides();
      expect(R.Quota.limitsFor({ provider:'openrouter', model:'a:free' }).rpd).toBe(50);
    });

    it('kota anahtarı uygulama verisinden ayrıdır', () => {
      expect(R.Quota.STORE.indexOf('rota84285')).toBe(-1);
      expect(R.Quota.OVERRIDE_STORE.indexOf('rota84285')).toBe(-1);
    });

    it('bir tur ne kadar sürer diye hesaplanabilir', () => {
      fresh();
      const cfg = { provider:'gemini', model:'gemini-2.0-flash' };
      expect(R.Quota.estimateMs(cfg, 1)).toBe(0);
      expect(R.Quota.estimateMs(cfg, 4) > 0).toBeTruthy();
    });

    it('her sağlayıcının ücretsiz sınırı katalogda yazılıdır', () => {
      ['openrouter', 'groq', 'gemini'].forEach(id => {
        const p = R.PROVIDERS[id];
        expect(p.limits.rpm > 0).toBeTruthy();
        expect(p.limits.rpd > 0).toBeTruthy();
        expect(p.checked.length > 5).toBeTruthy();   // sayının kaynağı yazılı
      });
    });
  });

  /* ==================== turlu toplanti ==================== */

  describe('Ofis — turlu toplantı', () => {
    it('turlar tanımlıdır ve her turun ayrı sorusu vardır', () => {
      expect(O.ROUNDS.length >= 3).toBeTruthy();
      const asks = {};
      O.ROUNDS.forEach(r => {
        expect(r.title.length > 2).toBeTruthy();
        expect(r.ask.length > 20).toBeTruthy();
        asks[r.ask] = 1;
      });
      expect(Object.keys(asks).length).toBe(O.ROUNDS.length);   // tekrar yok
    });

    it('konuşma sırası uzmanlar arasında döner', () => {
      expect(O.speakerAt(0)).toBe(R.MEETING_ORDER[0]);
      expect(O.speakerAt(R.MEETING_ORDER.length)).toBe(R.MEETING_ORDER[0]);
      expect(O.roundDef(1).key).toBe(O.ROUNDS[0].key);
      expect(O.roundDef(99).key).toBe(O.ROUNDS[O.ROUNDS.length - 1].key);
    });

    it('oturum açılır, tur tur ilerler, kullanıcı bitirir', async () => {
      reset();
      const session = await O.openMeeting();
      expect(session.status).toBe('live');
      expect(session.turns).toHaveLength(1);
      expect(session.turns[0].agent).toBe('patron');

      for(let i = 0; i < 4; i++) await O.nextTurn(session, i);
      expect(session.turns).toHaveLength(5);
      expect(session.turns[1].round).toBe(1);

      const m = await O.closeMeeting(session);
      expect(m.status).toBe('closed');
      expect(m.turns[m.turns.length - 1].closing).toBeTruthy();
      expect(m.rounds).toBe(1);
    });

    it('ikinci turda tur başlığı değişir', async () => {
      reset();
      const session = await O.openMeeting();
      const n = R.MEETING_ORDER.length;
      for(let i = 0; i < n + 1; i++) await O.nextTurn(session, i);
      const first = session.turns[1];
      const second = session.turns[n + 1];
      expect(first.round).toBe(1);
      expect(second.round).toBe(2);
      expect(first.roundTitle === second.roundTitle).toBeFalsy();
    });

    it('kullanıcı araya girip söz alabilir', async () => {
      reset();
      const session = await O.openMeeting();
      const t = O.userTurn(session, 'Bu hafta hastaydım.');
      expect(t.agent).toBe('aday');
      expect(session.turns[session.turns.length - 1].text).toContain('hastaydım');
      expect(O.userTurn(session, '   ')).toBeNull();
    });

    it('kullanıcının sözü sonraki ajana bağlam olarak gider', async () => {
      reset();
      await withStubLLM('anlaşıldı', async calls => {
        const session = await O.openMeeting();
        O.userTurn(session, 'Sınav kaygım arttı.');
        await O.nextTurn(session, 0);
        const prompt = calls[calls.length - 1].req.messages[0].text;
        expect(prompt).toContain('Sınav kaygım arttı');
      });
    });

    it('ajan hafızası istemine geçmiş sözleri koyar', async () => {
      reset();
      await withStubLLM('yeni bulgu', async calls => {
        const s1 = await O.openMeeting();
        await O.nextTurn(s1, 0);
        await O.closeMeeting(s1);

        const s2 = await O.openMeeting();
        await O.nextTurn(s2, 0);
        const prompt = calls[calls.length - 1].req.messages[0].text;
        expect(prompt).toContain('DAHA ÖNCE SENİN SÖYLEDİKLERİN');
      });
    });

    it('açık karar varsa Patron açılışta hesap sorar', async () => {
      reset();
      const first = await O.meet();
      expect(first.decision.state).toBe('open');
      await withStubLLM('açıyorum', async calls => {
        await O.openMeeting();
        expect(calls[0].req.messages[0].text).toContain('HENÜZ KAPANMAYAN KARAR');
      });
    });
  });

  /* ==================== rapor ve karar takibi ==================== */

  describe('Ofis — rapor ve karar takibi', () => {
    it('toplantı sonunda rapor üretilir', async () => {
      reset();
      const m = await O.meet({ rounds:1 });
      const r = m.report;
      expect(r.topic).toBe(m.topic);
      expect(r.rounds).toBe(1);
      expect(Object.keys(r.byAgent)).toHaveLength(R.MEETING_ORDER.length);
      expect(r.decision.title).toBe(m.action.title);
      expect(r.basis.hafta > 0).toBeTruthy();
    });

    it('rapor düz metne çevrilebilir', async () => {
      reset();
      const m = await O.meet({ rounds:1 });
      const text = O.reportText(m);
      expect(text).toContain('TOPLANTI RAPORU');
      expect(text).toContain('KARAR:');
      expect(text).toContain(m.topic);
      R.MEETING_ORDER.forEach(id => expect(text).toContain(R.AGENT_BY_ID[id].name.toUpperCase()));
    });

    it('rapor kullanıcının sözlerini de taşır', async () => {
      reset();
      const session = await O.openMeeting();
      O.userTurn(session, 'Pazartesi denemem var.');
      await O.nextTurn(session, 0);
      const m = await O.closeMeeting(session);
      expect(m.report.userSaid).toContain('Pazartesi denemem var.');
      expect(O.reportText(m)).toContain('SENİN SÖZLERİN');
    });

    it('karar açık kalır ve kapatılabilir', async () => {
      reset();
      const m = await O.meet({ rounds:1 });
      expect(O.openDecisions()).toHaveLength(1);
      expect(O.pendingDecision().title).toBe(m.action.title);

      await O.closeDecision(m.id, 'done');
      expect(O.openDecisions()).toHaveLength(0);
      expect(O.decisions()[0].state).toBe('done');

      const doc = await R.Store.get('meetings/' + m.id);
      expect(doc.decision.state).toBe('done');
    });

    it('karar devredilebilir', async () => {
      reset();
      const m = await O.meet({ rounds:1 });
      await O.closeDecision(m.id, 'carried');
      expect(O.decisions()[0].state).toBe('carried');
      expect(O.openDecisions()).toHaveLength(0);
    });

    it('geçersiz durum kararı açık bırakır', async () => {
      reset();
      const m = await O.meet({ rounds:1 });
      await O.closeDecision(m.id, 'saçma');
      expect(O.openDecisions()).toHaveLength(1);
    });
  });

  /* ==================== devralinan yetenekler ==================== */

  describe('Ofis — kart üretimi ve doğrulama', () => {
    it('JSON kod çerçevesi içinden çıkarılır', () => {
      expect(O.parseJson('```json\n{"cards":[]}\n```').cards).toEqual([]);
      expect(O.parseJson('İşte kartlar: {"cards":[{"front":"a"}]} umarım olur').cards).toHaveLength(1);
      expect(O.parseJson('hiç json yok')).toBeNull();
    });

    it('geçersiz kartlar elenir', () => {
      reset();
      const note = { id:'n1', title:'Ders', subjectId:'tyt-turkce', segments:[{ ts:0, text:'x' }] };
      const res = O.validateCards({ cards:[
        { front:'', back:'x' },
        { front:'Soru?', back:'Cevap' },
        { front:'Soru?', back:'Tekrar' },
      ] }, note);
      expect(res.cards).toHaveLength(1);
      expect(res.dropped).toBe(2);
      expect(res.cards[0].source).toBe('note');
    });

    it('ev kurallarını çiğneyen metin işaretlenir', () => {
      reset();
      expect(O.validate('Bu tempoyla kesinlikle kazanırsın.').warnings.length > 0).toBeTruthy();
      expect(O.validate('Plan tamamlaman %78; işlem hatası baskın.').warnings).toHaveLength(0);
    });

    it('model yokken kart üretimi açıkça reddedilir', async () => {
      reset();
      R.S.videoNotes = [{ id:'n1', title:'Ders', subjectId:'tyt-turkce',
        segments:[{ ts:0, tag:'not', text:'içerik' }], createdAt:'2026-09-01' }];
      let code = null;
      try{ await O.generateCards('n1'); }catch(e){ code = e.code; }
      expect(code).toBe('unavailable');
    });
  });


  /* ==================== FAZ 3 — kalite guvencesi ==================== */

  describe('Ofis — sayı sadakati', () => {
    it('Türkçe sayı yazımını tanır', () => {
      const v = O.numbersIn('Medyan 19,50 net; plan %78; sıra 12.500; 3 gün kaldı.')
        .map(x => x.value);
      expect(v).toContain(19.5);
      expect(v).toContain(78);
      expect(v).toContain(12500);
      expect(v).toContain(3);
    });

    it('brifingde olmayan sayıyı yakalar', () => {
      reset();
      const brief = O.brief('analist');
      const bad = O.numberFidelity('Tekrar borcun %47 ve sıran 84.200 civarı.', brief);
      expect(bad.length > 0).toBeTruthy();
    });

    it('brifingdeki sayıyı yakalamaz', () => {
      reset();
      const brief = O.brief('analist');
      const text = brief.findings.map(f => f.text).join(' ');
      expect(O.numberFidelity(text, brief)).toHaveLength(0);
    });

    it('doğal dil sayıları ve yıllar elenir', () => {
      reset();
      const brief = O.brief('rehber');
      expect(O.numberFidelity('Üç gün, 2 blok ve 5 soru yeter; 2026 sınavı.', brief)).toHaveLength(0);
    });

    it('uydurulmuş sayı doğrulamada uyarıya döner', () => {
      reset();
      const v = O.validate('Sıralaman 84.200 olacak.', { agentId:'analist', brief:O.brief('analist') });
      expect(v.warnings.length > 0).toBeTruthy();
      expect(v.unsupported.length > 0).toBeTruthy();
    });

    it('brifing verilmezse sayı denetimi çalışmaz', () => {
      reset();
      expect(O.validate('Sıralaman 84.200 olacak.').unsupported).toHaveLength(0);
    });
  });

  describe('Ofis — alan ihlali', () => {
    it('TYT uzmanı AYT’den söz ederse işaretlenir', () => {
      reset();
      const v = O.validate('AYT matematiğe ağırlık ver.', { agentId:'tyt' });
      expect(v.warnings.length > 0).toBeTruthy();
    });

    it('AYT uzmanı TYT’den söz ederse işaretlenir', () => {
      reset();
      expect(O.validate('TYT tarafın zayıf.', { agentId:'ayt' }).warnings.length > 0).toBeTruthy();
    });

    it('rehber net yorumlarsa işaretlenir, "net olarak" işaretlenmez', () => {
      reset();
      expect(O.validate('Netin 24 civarında.', { agentId:'rehber' }).warnings.length > 0).toBeTruthy();
      expect(O.scopeBreaches('Bunu net olarak söyleyebilirim.', R.AGENT_BY_ID.rehber)).toHaveLength(0);
    });

    it('analist tavsiye verirse işaretlenir', () => {
      reset();
      expect(O.validate('Bu konuya dönmelisin.', { agentId:'analist' }).warnings.length > 0).toBeTruthy();
      expect(O.scopeBreaches('Hata dağılımında K başta.', R.AGENT_BY_ID.analist)).toHaveLength(0);
    });

    it('Patron bütün alanları konuşabilir', () => {
      reset();
      expect(R.AGENT_BY_ID.patron.taboo).toBeUndefined();
      expect(O.validate('TYT ve AYT birlikte değerlendirilmeli.', { agentId:'patron' }).warnings).toHaveLength(0);
    });

    it('toplantıda uydurulan sayı tutanağa uyarı olarak geçer', async () => {
      reset();
      await withStubLLM('Sıralaman kesin 84.200 olacak.', async () => {
        const m = await O.meet({ rounds:1 });
        const flagged = m.turns.filter(t => (t.warnings || []).length);
        expect(flagged.length > 0).toBeTruthy();
      });
    });
  });

  /* ==================== FAZ 6 — kota ve dayaniklilik ==================== */

  describe('Ofis — çoklu anahtar havuzu', () => {
    function fresh(){
      reset(); R.Quota.reset(); R.Quota.clearOverrides(); R.LLM.setKey('groq', '');
    }

    it('tek anahtar dizi olarak okunur, eski biçim korunur', () => {
      fresh();
      R.LLM.setKey('groq', 'gsk_bir');
      expect(R.LLM.getKeys('groq')).toEqual(['gsk_bir']);
      expect(R.LLM.getKey('groq')).toBe('gsk_bir');
      R.LLM.setKey('groq', '');
    });

    it('anahtar eklenir, tekrar eklenmez, silinir', () => {
      fresh();
      R.LLM.addKey('groq', 'gsk_a');
      R.LLM.addKey('groq', 'gsk_b');
      R.LLM.addKey('groq', 'gsk_a');
      expect(R.LLM.getKeys('groq')).toHaveLength(2);
      R.LLM.removeKeyAt('groq', 0);
      expect(R.LLM.getKeys('groq')).toEqual(['gsk_b']);
      R.LLM.setKey('groq', '');
    });

    it('kota her anahtar için ayrı sayılır', async () => {
      fresh();
      const base = { provider:'groq', model:'llama-3.3-70b-versatile' };
      R.Quota.setOverride('groq', { rpm:600, rpd:1 });
      await R.Quota.acquire(Object.assign({}, base, { keyId:0 }));
      expect(R.Quota.status(Object.assign({}, base, { keyId:0 })).full).toBeTruthy();
      expect(R.Quota.status(Object.assign({}, base, { keyId:1 })).full).toBeFalsy();
      R.Quota.clearOverrides();
    });

    it('dolu anahtar atlanır, boşta olan seçilir', async () => {
      fresh();
      R.LLM.setKey('groq', ['gsk_a', 'gsk_b']);
      const cfg = { provider:'groq', model:'llama-3.1-8b-instant' };
      R.Quota.setOverride('groq', { rpm:600, rpd:1 });
      expect(R.LLM.pickKey(cfg).index).toBe(0);
      await R.Quota.acquire(Object.assign({}, cfg, { keyId:0 }));
      expect(R.LLM.pickKey(cfg).index).toBe(1);
      R.Quota.clearOverrides();
      R.LLM.setKey('groq', '');
    });

    it('maskeleme anahtarı sızdırmaz', () => {
      fresh();
      R.LLM.setKey('groq', ['gsk_0123456789abcdef']);
      const masked = R.LLM.maskKeys('groq');
      expect(masked).toHaveLength(1);
      expect(masked[0].indexOf('0123456789')).toBe(-1);
      R.LLM.setKey('groq', '');
    });

    it('anahtar yoksa sağlayıcı hazır sayılmaz', () => {
      fresh();
      expect(R.LLM.ready({ provider:'groq', model:'llama-3.1-8b-instant' })).toBeFalsy();
      R.LLM.setKey('groq', 'gsk_x');
      expect(R.LLM.ready({ provider:'groq', model:'llama-3.1-8b-instant' })).toBeTruthy();
      R.LLM.setKey('groq', '');
    });
  });

  describe('Ofis — çevrimdışı ve yerel model', () => {
    it('devam edilebilir hatalar ayrılır', () => {
      expect(R.LLM.resumable('offline')).toBeTruthy();
      expect(R.LLM.resumable('network')).toBeTruthy();
      expect(R.LLM.resumable('unauthorized')).toBeFalsy();
      expect(R.LLM.resumable('daily_quota')).toBeFalsy();
    });

    it('çevrimdışı hatası kullanıcı diline çevrilir', () => {
      expect(R.LLM.errorText('offline').length > 20).toBeTruthy();
    });

    it('yerel sağlayıcılar anahtarsız ve sınırsızdır', () => {
      ['ollama', 'lmstudio'].forEach(id => {
        const p = R.PROVIDERS[id];
        expect(p.needsKey).toBeFalsy();
        expect(p.editableEndpoint).toBeTruthy();
        expect(p.endpoint.indexOf('localhost') > 0).toBeTruthy();
        expect(R.Quota.limitsFor({ provider:id, model:'x' })).toBeNull();
      });
    });

    it('yerel sağlayıcı uç adresi verilince hazır olur', () => {
      expect(R.LLM.ready({ provider:'ollama', model:'llama3.1:8b',
        endpoint:'http://localhost:11434/v1/chat/completions' })).toBeTruthy();
      expect(R.LLM.ready({ provider:'ollama', model:'llama3.1:8b', endpoint:'' })).toBeFalsy();
    });
  });

  describe('Ofis — brifing sıkıştırma', () => {
    it('küçük veriye dokunmaz', () => {
      const small = { a:1, b:'iki' };
      expect(O.compactData(small)).toEqual(small);
    });

    it('bütçeyi aşan veride ayrıntılı diziler kırpılır', () => {
      reset();
      const big = { son7Gun:[], dersler:[] };
      for(let i = 0; i < 40; i++){
        big.son7Gun.push({ tarih:'2026-09-0' + (i%9), tamamlanan:i, toplam:9, uyku:7, calisilanDakika:120 });
        big.dersler.push({ id:'d'+i, ders:'Ders '+i, kapanan:i, toplam:30, yuzde:i, hedefBant:'20–30 net' });
      }
      const before = JSON.stringify(big).length;
      const after = JSON.stringify(O.compactData(big, 800)).length;
      expect(after < before).toBeTruthy();
      expect(O.compactData(big, 800).son7Gun.length <= 4).toBeTruthy();
    });

    it('kırpılan kayıt sayısı metinde belirtilir', () => {
      reset();
      const big = { son7Gun:Array.from({ length:30 }, (_, i) => ({ tarih:'g'+i, uyku:7, calisilanDakika:100 })) };
      const out = O.compactData(big, 300);
      expect(String(out.son7Gun[out.son7Gun.length - 1])).toContain('kısaltıldı');
    });

    it('ajana giden veri sıkıştırılmış hâlde gider', async () => {
      reset();
      await withStubLLM('ok', async calls => {
        await O.ask('rehber', 'Durum ne?');
        expect(calls[0].req.messages[0].text.length < 12000).toBeTruthy();
      });
    });
  });

  /* ==================== yukleme ==================== */

  describe('Ofis — kalıcılık', () => {
    it('kaydedilen ayar, sohbet ve tutanaklar geri yüklenir', async () => {
      reset();
      await O.saveSettings({ provider:'gemini', model:'gemini-2.0-flash' });
      await O.pushChat('rehber', 'user', 'uyku düzenim bozuk');
      const m = await O.meet();

      R.S.office = null; R.S.officeChats = {}; R.S.officeMeetings = [];
      await O.load();

      expect(O.settings().provider).toBe('gemini');
      expect(O.chatOf('rehber')).toHaveLength(1);
      expect(O.meetings()).toHaveLength(1);
      expect(O.meetings()[0].id).toBe(m.id);
    });

    it('bilinmeyen ajanın sohbeti yüklenmez', async () => {
      reset();
      await R.Store.set('office/chat-hayalet', { messages:[{ role:'user', text:'x' }] });
      await O.load();
      expect(R.S.officeChats.hayalet).toBeUndefined();
    });
  });
})();
