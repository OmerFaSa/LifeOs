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
    R.S.journal = {};
    R.S.officeBriefings = {};
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
        expect(tytCall.indexOf('ŞU ANA KADAR KONUŞULANLAR') > 0).toBeTruthy();
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


  /* ==================== yanit butunlugu ====================
     "Ajanlar yazilari yarim yaziyor" sikayetinin dort ayri sebebi vardi ve
     hepsi burada kilitlenir: akisin son karesinin dusmesi, token sinirinin
     sessizce vurmasi, Gemini'nin dusunme butcesini yemesi, ve butce yine
     yetmediginde kesik cumlenin oldugu gibi gosterilmesi. */

  describe('Ofis — yanıt bütünlüğü', () => {
    const realFetch = window.fetch;

    function fresh(){
      R.Quota.reset(); R.Quota.clearOverrides();
      /* Devam istekleri arasinda dakikalik aralik beklenmesin. */
      R.Quota.setOverride('groq', { rpm:60000, rpd:99999 });
      R.Quota.setOverride('gemini', { rpm:60000, rpd:99999 });
      R.LLM.setKey('groq', 'gsk_test');
    }
    function done(){
      window.fetch = realFetch;
      R.LLM.setKey('groq', '');
      R.LLM.setKey('gemini', '');
      R.Quota.reset(); R.Quota.clearOverrides();
    }

    /* Gercek bir SSE govdesi taklit eder: parcalar verildigi gibi akitilir. */
    function sse(chunks){
      const enc = new TextEncoder();
      let i = 0;
      return {
        ok:true, status:200,
        headers:{ get:k => (String(k).toLowerCase() === 'content-type' ? 'text/event-stream' : null) },
        body:{ getReader:() => ({
          read(){
            return Promise.resolve(i >= chunks.length
              ? { done:true, value:undefined }
              : { done:false, value:enc.encode(chunks[i++]) });
          },
          cancel(){ return Promise.resolve(); },
        }) },
      };
    }
    function frame(text, finish){
      const ch = { delta:{ content:text } };
      if(finish) ch.finish_reason = finish;
      return 'data: ' + JSON.stringify({ choices:[ch] });
    }

    it('akış son satırı yeni satırla kapanmadan bitse de metin tam gelir', async () => {
      fresh();
      /* Son kare \n ile kapanmiyor ve [DONE] gelmiyor: eski okuyucu bu
         kareyi tamponda birakip atiyordu, cumlenin sonu kayboluyordu. */
      window.fetch = async () => sse([
        frame('Bu hafta ') + '\n',
        frame('matematiğe dön.', 'stop'),
      ]);
      const res = await R.LLM.chat({ provider:'groq', model:'test-model' },
        { messages:[{ role:'user', text:'x' }], onText(){} });
      expect(res.text).toBe('Bu hafta matematiğe dön.');
      done();
    });

    it('çok baytlı harf iki parçaya bölünse de bozulmaz', async () => {
      fresh();
      /* 'ğ' iki bayttir; parca siniri ortasina duserse eski kod son
         baytlari bosaltmadigi icin harf kayboluyordu. */
      const enc = new TextEncoder();
      const line = enc.encode(frame('doğru', 'stop') + '\n');
      const cut = 24;                       // 'ğ'nin baytlarinin arasi
      let i = 0;
      const parts = [line.slice(0, cut), line.slice(cut)];
      window.fetch = async () => ({
        ok:true, status:200,
        headers:{ get:() => 'text/event-stream' },
        body:{ getReader:() => ({
          read(){
            return Promise.resolve(i >= parts.length
              ? { done:true, value:undefined }
              : { done:false, value:parts[i++] });
          },
          cancel(){ return Promise.resolve(); },
        }) },
      });
      const res = await R.LLM.chat({ provider:'groq', model:'test-model' },
        { messages:[{ role:'user', text:'x' }], onText(){} });
      expect(res.text).toBe('doğru');
      done();
    });

    it('token sınırında kesilen yanıt devam isteğiyle tamamlanır', async () => {
      fresh();
      const bodies = [];
      let call = 0;
      window.fetch = async (url, init) => {
        bodies.push(JSON.parse(init.body));
        call++;
        return call === 1
          ? sse([frame('TYT matematikte üslü sayılardan net kaybı', 'length') + '\n'])
          : sse([frame('kaybı var; önce o konuyu kapat.', 'stop') + '\n']);
      };
      const res = await R.LLM.chat({ provider:'groq', model:'test-model' },
        { messages:[{ role:'user', text:'x' }], onText(){} });
      expect(call).toBe(2);
      expect(res.rounds).toBe(2);
      expect(res.truncated).toBeFalsy();
      expect(res.text).toBe('TYT matematikte üslü sayılardan net kaybı var; önce o konuyu kapat.');
      /* Devam istegi modele yazdigini ve nerede kesildigini gosterir. */
      const second = bodies[1].messages;
      expect(second[second.length - 1].content).toContain('KESİLDİĞİ YER');
      expect(second[second.length - 2].role).toBe('assistant');
      done();
    });

    it('devam hakkı yokken sarkan yarım cümle atılır', async () => {
      fresh();
      window.fetch = async () => sse([
        frame('Birinci cümle tamam. İkinci cümle yarıda kal', 'length') + '\n',
      ]);
      const res = await R.LLM.chat({ provider:'groq', model:'test-model' },
        { messages:[{ role:'user', text:'x' }], maxContinuations:0, onText(){} });
      expect(res.truncated).toBeTruthy();
      expect(res.text).toBe('Birinci cümle tamam.');
      done();
    });

    it('kesilme tek uzun cümledeyse metin atılmaz', async () => {
      fresh();
      const uzun = 'Son üç denemenin medyanı düşerken analiz borcunun birikmesi '
        + 'net kaybının asıl nedenini gösteriyor ve bu hafta';
      window.fetch = async () => sse([frame('Kısa. ' + uzun, 'length') + '\n']);
      const res = await R.LLM.chat({ provider:'groq', model:'test-model' },
        { messages:[{ role:'user', text:'x' }], maxContinuations:0, onText(){} });
      /* Kirpmak govdeyi goturecekti: eksik cumle gostermek daha iyidir. */
      expect(res.text).toContain('analiz borcunun');
      done();
    });

    it('devam isteği başarısız olursa eldeki metin verilir', async () => {
      fresh();
      let call = 0;
      window.fetch = async () => {
        call++;
        if(call === 1) return sse([frame('Bu hafta matematiğe dön ve tekrar yap.', 'length') + '\n']);
        throw new TypeError('baglanti koptu');
      };
      const res = await R.LLM.chat({ provider:'groq', model:'test-model' },
        { messages:[{ role:'user', text:'x' }], onText(){} });
      expect(res.text).toBe('Bu hafta matematiğe dön ve tekrar yap.');
      done();
    });

    it('Gemini 2.5 Flash’ta düşünme bütçesi kapatılır', async () => {
      fresh();
      R.LLM.setKey('gemini', 'AIzaTest');
      let sent = null;
      window.fetch = async (url, init) => {
        sent = JSON.parse(init.body);
        return {
          ok:true, status:200,
          headers:{ get:() => 'application/json' },
          json:async () => ({ candidates:[
            { content:{ parts:[{ text:'Hazır.' }] }, finishReason:'STOP' },
          ] }),
        };
      };
      const res = await R.LLM.chat({ provider:'gemini', model:'gemini-2.5-flash' },
        { messages:[{ role:'user', text:'x' }] });
      expect(res.text).toBe('Hazır.');
      expect(sent.generationConfig.thinkingConfig.thinkingBudget).toBe(0);
      done();
    });

    it('düşünme alanı desteklemeyen Gemini modeline gönderilmez', async () => {
      fresh();
      R.LLM.setKey('gemini', 'AIzaTest');
      let sent = null;
      window.fetch = async (url, init) => {
        sent = JSON.parse(init.body);
        return {
          ok:true, status:200,
          headers:{ get:() => 'application/json' },
          json:async () => ({ candidates:[
            { content:{ parts:[{ text:'Hazır.' }] }, finishReason:'STOP' },
          ] }),
        };
      };
      await R.LLM.chat({ provider:'gemini', model:'gemini-2.0-flash' },
        { messages:[{ role:'user', text:'x' }] });
      expect(sent.generationConfig.thinkingConfig).toBe(undefined);
      done();
    });

    it('Gemini düşünme parçaları cevaba karışmaz', async () => {
      fresh();
      R.LLM.setKey('gemini', 'AIzaTest');
      window.fetch = async () => ({
        ok:true, status:200,
        headers:{ get:() => 'application/json' },
        /* thought:true tasiyan parca modelin ic sesidir, cevap degildir. */
        json:async () => ({ candidates:[{ content:{ parts:[
          { text:'Kullanıcı TYT soruyor, önce medyana bakayım…', thought:true },
          { text:'Türkçede net kaybın var.' },
        ] }, finishReason:'STOP' }] }),
      });
      const res = await R.LLM.chat({ provider:'gemini', model:'gemini-2.0-flash' },
        { messages:[{ role:'user', text:'x' }] });
      expect(res.text).toBe('Türkçede net kaybın var.');
      done();
    });

    it('sağlayıcıların kesilme adları tanınır', () => {
      ['length', 'max_tokens', 'MAX_TOKENS'].forEach(f => expect(R.LLM.truncated(f)).toBeTruthy());
      ['stop', 'STOP', '', null, undefined].forEach(f => expect(R.LLM.truncated(f)).toBeFalsy());
    });

    it('sayı içindeki nokta cümle sonu sayılmaz', () => {
      const s = 'Hedefin 1.500 puan ve bu hafta net kaybı yaşan';
      expect(R.LLM.trimToSentence(s)).toBe(s);
    });

    it('devam parçası önceki metinle örtüşürse tekrar yazılmaz', () => {
      expect(R.LLM.joinContinuation('Bu hafta matematiğe dön', 'matematiğe dön ve tekrar yap.'))
        .toBe('Bu hafta matematiğe dön ve tekrar yap.');
      expect(R.LLM.joinContinuation('Bu hafta', 'matematiğe dön.'))
        .toBe('Bu hafta matematiğe dön.');
    });

    it('yarım kalan son kelime devam isteğinden önce atılır', () => {
      expect(R.LLM.dropLastWord('net kaybı yaşan')).toBe('net kaybı');
      expect(R.LLM.dropLastWord('tek')).toBe('tek');
    });

    it('varsayılan token bütçesi kısa yanıtları kesmeyecek kadar geniştir', () => {
      expect(R.LLM.DEFAULT_MAX_TOKENS >= 1000).toBeTruthy();
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


  /* ==================== FAZ 2 — ajan defteri ==================== */

  describe('Ofis — doğrulanabilir gözlem', () => {
    it('ölçüt listesi kapalıdır, uydurma ölçüt reddedilir', () => {
      reset();
      expect(R.Journal.verify({ metric:'uydurma', op:'lt', value:5 }).ok).toBeFalsy();
      expect(R.Journal.verify({ metric:'analizBorcu', op:'yok', value:1 }).ok).toBeFalsy();
      expect(R.Journal.verify({ metric:'analizBorcu', op:'lt', value:'çok' }).ok).toBeFalsy();
    });

    it('veriye uyan gözlem doğrulanır, uymayan reddedilir', () => {
      reset();
      expect(R.Journal.verify({ metric:'analizBorcu', op:'lt', value:5 }).ok).toBeTruthy();
      expect(R.Journal.verify({ metric:'analizBorcu', op:'gt', value:5 }).ok).toBeFalsy();
    });

    it('verisi olmayan ölçüt gözlem üretmez', () => {
      reset();
      const v = R.Journal.verify({ metric:'tytMedyan', op:'gt', value:50 });
      expect(v.ok).toBeFalsy();
      expect(v.actual).toBeNull();
    });

    it('doğrulanmayan gözlem deftere girmez', async () => {
      reset();
      const res = await R.Journal.record('analist', { metric:'analizBorcu', op:'gt', value:99 });
      expect(res.ok).toBeFalsy();
      expect(R.Journal.forAgent('analist')).toHaveLength(0);
    });

    it('doğrulanan gözlem saklanır ve geri okunur', async () => {
      reset();
      const res = await R.Journal.record('analist',
        { metric:'analizBorcu', op:'lt', value:3, note:'borç birikmiyor' });
      expect(res.ok).toBeTruthy();
      const list = R.Journal.forAgent('analist');
      expect(list).toHaveLength(1);
      expect(list[0].metric).toBe('analizBorcu');
      const doc = await R.Store.get('journal/analist');
      expect(doc.entries).toHaveLength(1);
    });

    it('veri değişince gözlem kendiliğinden düşer', async () => {
      reset();
      await R.Journal.record('analist', { metric:'analizBorcu', op:'lt', value:1 });
      expect(R.Journal.forAgent('analist')).toHaveLength(1);
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [makeExam({ date:'2026-10-01', analysisCompletedAt:null })];
        expect(R.Journal.forAgent('analist')).toHaveLength(0);   // artık doğru değil
      });
    });

    it('aynı gözlem iki kez yazılmaz', async () => {
      reset();
      await R.Journal.record('rehber', { metric:'davranisSerisi', op:'lt', value:3 });
      await R.Journal.record('rehber', { metric:'davranisSerisi', op:'lt', value:3 });
      expect(R.Journal.forAgent('rehber')).toHaveLength(1);
    });

    it('gözlem cümlesi kural motorundan üretilir', () => {
      reset();
      const t = R.Journal.say({ metric:'tekrarBorcu', op:'gt', value:10 }, 24);
      expect(t).toContain('tekrar borcu');
      expect(t).toContain('>');
      expect(t).toContain('24');
    });

    it('bilinmeyen ajanın defteri olmaz', async () => {
      reset();
      const res = await R.Journal.record('hayalet', { metric:'analizBorcu', op:'lt', value:5 });
      expect(res.ok).toBeFalsy();
    });
  });

  describe('Ofis — bulunan gözlemler', () => {
    it('boş veride örüntü uydurmaz', () => {
      reset();
      expect(R.Journal.detect()).toHaveLength(0);
    });

    it('plan üst üste düşükse örüntü bulunur', async () => {
      reset();
      await withTodayAsync('2026-12-01', async () => {
        const M = R.Model, U = R.U;
        const cur = M.currentWeek();
        for(let n = cur - 2; n <= cur; n++){
          await M.ensureWeek(n);
          for(const d of M.weekDates(n)){
            if(U.iso(d) > U.todayISO()) continue;
            await M.ensureDay(d);
            const day = R.S.days[U.iso(d)];
            day.blocks.forEach(b => { b.status = 'skipped'; b.skipReason = 'Süre yoktu'; });
          }
        }
        const found = R.Journal.detect('rehber');
        expect(found.length > 0).toBeTruthy();
        expect(found.some(o => o.id === 'plan-streak')).toBeTruthy();
      });
    });

    it('tekrar eden atlama nedeni bulunur', async () => {
      reset();
      await withTodayAsync('2026-12-01', async () => {
        const M = R.Model, U = R.U;
        const cur = M.currentWeek();
        for(let n = cur - 1; n <= cur; n++){
          await M.ensureWeek(n);
          for(const d of M.weekDates(n)){
            if(U.iso(d) > U.todayISO()) continue;
            await M.ensureDay(d);
            R.S.days[U.iso(d)].blocks.forEach(b => { b.status = 'skipped'; b.skipReason = 'Sağlık / enerji'; });
          }
        }
        const found = R.Journal.detect('rehber');
        expect(found.some(o => o.id === 'repeated-skip')).toBeTruthy();
      });
    });

    it('bulunan gözlemler ajanın alanına düşer', () => {
      reset();
      R.Journal.detect().forEach(o => {
        expect(!!R.AGENT_BY_ID[o.agent]).toBeTruthy();
        expect(o.text.length > 20).toBeTruthy();
        expect(typeof o.evidence).toBe('object');
      });
    });

    it('defter brifinge girer', async () => {
      reset();
      await R.Journal.record('analist', { metric:'analizBorcu', op:'lt', value:3 });
      O.resetBriefs();
      const b = O.brief('analist');
      expect(b.journal.length > 0).toBeTruthy();
      expect(b.data.defterim.length > 0).toBeTruthy();
    });
  });

  describe('Ofis — güven skoru', () => {
    it('veri yokken oran hesaplanmaz', () => {
      reset();
      expect(R.Journal.trust('analist').yuzde).toBeNull();
    });

    it('kararın sahibi iş anahtarından bulunur', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [makeExam({ date:'2026-10-01', analysisCompletedAt:null })];
        O.resetBriefs();
        const m = await O.meet({ rounds:1 });
        expect(m.decision.key).toBe('analysis');
        expect(m.decision.owner).toBe('analist');
      });
    });

    it('uygulanan karar güven skorunu yükseltir', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [makeExam({ date:'2026-10-01', analysisCompletedAt:null })];
        O.resetBriefs();
        const m = await O.meet({ rounds:1 });
        await O.closeDecision(m.id, 'done');
        const t = R.Journal.trust('analist');
        expect(t.toplam).toBe(1);
        expect(t.uygulanan).toBe(1);
        expect(t.yuzde).toBe(100);
      });
    });

    it('her ajan için skor üretilir', () => {
      reset();
      const all = R.Journal.trustAll();
      R.AGENT_IDS.forEach(id => expect(typeof all[id].toplam).toBe('number'));
    });
  });

  /* ==================== FAZ 1 — proaktiflik ==================== */

  describe('Ofis — masa notları', () => {
    it('sakin veride not üretmez', () => {
      reset();
      expect(O.notes()).toHaveLength(0);
    });

    it('analiz borcu analistin masasına not bırakır', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [
          makeExam({ date:'2026-10-01', analysisCompletedAt:null }),
          makeExam({ date:'2026-10-02', analysisCompletedAt:null }),
        ];
        const n = O.notes();
        expect(n.some(x => x.id === 'analiz-borcu' && x.agent === 'analist')).toBeTruthy();
        expect(O.notes('analist').length > 0).toBeTruthy();
        expect(O.notes('tyt')).toHaveLength(0);
      });
    });

    it('uyku düşünce rehber not bırakır', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        const U = R.U, M = R.Model;
        await M.ensureWeek(M.currentWeek());
        for(let i = 0; i < 7; i++){
          const d = U.addDays(U.today(), -i);
          await M.ensureDay(d);
          R.S.days[U.iso(d)].sleepHours = 5;
        }
        expect(O.notes('rehber').some(x => x.id === 'uyku')).toBeTruthy();
      });
    });

    it('notlar önem sırasına dizilir', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [
          makeExam({ date:'2026-10-01', analysisCompletedAt:null }),
          makeExam({ date:'2026-10-02', analysisCompletedAt:null }),
        ];
        R.S.cards = [];
        const list = O.notes();
        const rank = { danger:0, warn:1, ok:2 };
        for(let i = 1; i < list.length; i++){
          expect(rank[list[i-1].tone] <= rank[list[i].tone]).toBeTruthy();
        }
      });
    });

    it('açık karar Patron’un masasına düşer', async () => {
      reset();
      await O.meet({ rounds:1 });
      expect(O.notes('patron').some(n => n.id === 'karar')).toBeTruthy();
    });

    it('her notun rotası geçerli bir ekrandır', () => {
      reset();
      /* Test sayfasi ekranlari yuklemez; rota adlari acikca listelenir. */
      const ROUTES = ['today', 'week', 'plan', 'subjects', 'target', 'learn', 'exams',
        'cards', 'quiz', 'progress', 'analytics', 'protocols', 'guide', 'profiles',
        'office', 'team', 'meeting', 'topic'];
      O.WATCHERS.forEach(w => {
        expect(ROUTES).toContain(w.route);
        expect(!!R.AGENT_BY_ID[w.agent]).toBeTruthy();
        expect(['danger', 'warn', 'ok', 'info']).toContain(w.tone);
      });
    });
  });

  describe('Ofis — günlük brifing', () => {
    it('günde bir kez üretilir, ikinci çağrı önbellekten gelir', async () => {
      reset();
      const a = await O.dailyBriefing();
      const b = await O.dailyBriefing();
      expect(b.at).toBe(a.at);
      expect(O.briefingOf().text).toBe(a.text);
    });

    it('zorlanınca yeniden üretilir', async () => {
      reset();
      await O.dailyBriefing();
      const forced = await O.dailyBriefing({ force:true });
      expect(forced.id).toBe(R.U.todayISO());
    });

    it('model yokken kural motoru metni gelir', async () => {
      reset();
      const b = await O.dailyBriefing();
      expect(b.mode).toBe('kural');
      expect(b.text.length > 20).toBeTruthy();
    });

    it('model bağlıyken tek çağrı yapar', async () => {
      reset();
      await withStubLLM('Bugün analiz borcu öncelikli.', async calls => {
        const b = await O.dailyBriefing({ force:true });
        expect(calls).toHaveLength(1);
        expect(b.mode).toBe('llm');
      });
    });

    it('notlar değişince brifing bayat işaretlenir', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        await O.dailyBriefing();
        expect(O.briefingOf().stale).toBeFalsy();
        R.S.exams = [
          makeExam({ date:'2026-10-01', analysisCompletedAt:null }),
          makeExam({ date:'2026-10-02', analysisCompletedAt:null }),
        ];
        O.resetBriefs();
        expect(O.briefingOf().stale).toBeTruthy();
      });
    });

    it('kural motoru modunda bayat brifing kendiliğinden tazelenir', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        const first = await O.dailyBriefing();
        R.S.exams = [
          makeExam({ date:'2026-10-01', analysisCompletedAt:null }),
          makeExam({ date:'2026-10-02', analysisCompletedAt:null }),
        ];
        const second = await O.dailyBriefing();
        expect(second.text === first.text).toBeFalsy();
        expect(second.text).toContain('analizsiz');
      });
    });

    it('brifing kaydedilir ve yüklemede geri gelir', async () => {
      reset();
      const b = await O.dailyBriefing();
      R.S.officeBriefings = {};
      await O.load();
      expect(O.briefingOf().text).toBe(b.text);
    });
  });

  describe('Ofis — haftalık kapanış gündemi', () => {
    it('pazar günü kapanış gündemi öne geçer', async () => {
      reset();
      await withTodayAsync('2026-09-20', async () => {   // pazar
        const list = O.agendaCandidates();
        const idx = list.findIndex(c => c.topic === 'Haftanın kapanışı');
        expect(idx >= 0).toBeTruthy();
        expect(idx <= 1).toBeTruthy();
      });
    });

    it('hafta içi kapanış gündemi çıkmaz', async () => {
      reset();
      await withTodayAsync('2026-09-16', async () => {   // çarşamba
        expect(O.agendaCandidates().some(c => c.topic === 'Haftanın kapanışı')).toBeFalsy();
      });
    });
  });


  /* ==================== FAZ 4 — gercek tartisma ==================== */

  describe('Ofis — çapraz soru', () => {
    it('çelişki yokken soru sorulmaz', () => {
      reset();
      expect(O.conflicts()).toHaveLength(0);
    });

    it('ölçüm ile davranış çelişince rehbere sorulur', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        const M = R.Model, U = R.U;
        await M.ensureWeek(M.currentWeek());
        for(const d of M.weekDates(M.currentWeek())){
          if(U.iso(d) > U.todayISO()) continue;
          await M.ensureDay(d);
          R.S.days[U.iso(d)].blocks.forEach(b => { b.status = 'done'; });
        }
        R.S.exams = [makeExam({ date:'2026-10-01', analysisCompletedAt:null })];
        const list = O.conflicts();
        expect(list.some(c => c.id === 'olcum-davranis' && c.target === 'rehber')).toBeTruthy();
        expect(list[0].question.length > 30).toBeTruthy();
      });
    });

    it('çelişki kural motorundan gelir, her birinin hedefi bir ajandır', () => {
      reset();
      O.CONFLICTS.forEach(c => {
        expect(!!R.AGENT_BY_ID[c.target]).toBeTruthy();
        expect(typeof c.when).toBe('function');
        expect(typeof c.ask).toBe('function');
      });
    });

    it('sorulan çelişki bir daha sorulmaz', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [makeExam({ date:'2026-10-01', analysisCompletedAt:null })];
        const M = R.Model, U = R.U;
        await M.ensureWeek(M.currentWeek());
        for(const d of M.weekDates(M.currentWeek())){
          if(U.iso(d) > U.todayISO()) continue;
          await M.ensureDay(d);
          R.S.days[U.iso(d)].blocks.forEach(b => { b.status = 'done'; });
        }
        const session = await O.openMeeting();
        const first = O.nextConflict(session);
        expect(first).toBeTruthy();
        await O.askCross(session);
        expect(session.turns.filter(t => t.roundKey === 'capraz')).toHaveLength(2);
        const after = O.nextConflict(session);
        expect(after && after.id === first.id).toBeFalsy();
      });
    });

    it('çapraz soruda Patron sorar, hedef ajan yanıtlar', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [makeExam({ date:'2026-10-01', analysisCompletedAt:null })];
        const M = R.Model, U = R.U;
        await M.ensureWeek(M.currentWeek());
        for(const d of M.weekDates(M.currentWeek())){
          if(U.iso(d) > U.todayISO()) continue;
          await M.ensureDay(d);
          R.S.days[U.iso(d)].blocks.forEach(b => { b.status = 'done'; });
        }
        const session = await O.openMeeting();
        const res = await O.askCross(session);
        expect(res.question.agent).toBe('patron');
        expect(res.answer.agent).toBe(res.conflict.target);
      });
    });
  });

  describe('Ofis — oylama', () => {
    it('fikir turu oylamanın seçeneklerini üretir', async () => {
      reset();
      const session = await O.openMeeting();
      const n = R.MEETING_ORDER.length;
      for(let i = 0; i < 2 * n; i++) await O.nextTurn(session, i);
      const opts = O.voteOptions(session);
      expect(opts).toHaveLength(n);
      expect(opts[0].n).toBe(1);
    });

    it('oy numarası metinden okunur, geçersiz numara sayılmaz', () => {
      expect(O.parseVote('2. fikri destekliyorum', 4)).toBe(2);
      expect(O.parseVote('Hiçbirini seçmiyorum', 4)).toBeNull();
      expect(O.parseVote('9. fikir', 4)).toBeNull();
    });

    it('kural motoru modunda her ajan oy verir', async () => {
      reset();
      const session = await O.openMeeting();
      const n = R.MEETING_ORDER.length;
      for(let i = 0; i < 4 * n; i++) await O.nextTurn(session, i);
      const votes = session.turns.filter(t => t.roundKey === 'oylama');
      expect(votes).toHaveLength(n);
      votes.forEach(v => expect(v.vote != null).toBeTruthy());
    });

    it('oy tablosu kural motoru tarafından sayılır', async () => {
      reset();
      const session = await O.openMeeting();
      const n = R.MEETING_ORDER.length;
      for(let i = 0; i < 4 * n; i++) await O.nextTurn(session, i);
      const t = O.tally(session);
      expect(t.oyVeren).toBe(n);
      expect(t.kazanan).toBeTruthy();
      expect(R.U.sum(t.rows.map(r => r.oy))).toBe(n);
    });

    it('oylama yapılmadan tablo çıkmaz', async () => {
      reset();
      const session = await O.openMeeting();
      expect(O.tally(session)).toBeNull();
    });

    it('oylama sonucu rapora ve tutanağa girer', async () => {
      reset();
      const session = await O.openMeeting();
      const n = R.MEETING_ORDER.length;
      for(let i = 0; i < 4 * n; i++) await O.nextTurn(session, i);
      const m = await O.closeMeeting(session);
      expect(m.vote.kazanan).toBeTruthy();
      expect(m.report.vote.kazanan).toBeTruthy();
      expect(O.reportText(m)).toContain('OYLAMA');
    });

    it('güven skoru oy ağırlığını değiştirir', async () => {
      reset();
      await withTodayAsync('2026-10-05', async () => {
        R.S.exams = [makeExam({ date:'2026-10-01', analysisCompletedAt:null })];
        O.resetBriefs();
        const first = await O.meet({ rounds:1 });
        await O.closeDecision(first.id, 'done');       // analist güven kazanır
        expect(R.Journal.trust('analist').yuzde).toBe(100);

        const session = await O.openMeeting();
        const n = R.MEETING_ORDER.length;
        for(let i = 0; i < 4 * n; i++) await O.nextTurn(session, i);
        const t = O.tally(session);
        const analistVote = session.turns.find(x => x.roundKey === 'oylama' && x.agent === 'analist');
        const row = t.rows.find(r => r.n === analistVote.vote);
        expect(row.agirlik > row.oy).toBeTruthy();     // ağırlık 1'den büyük
      });
    });

    it('turlar oylamayı içerir ve her turun sorusu ayrıdır', () => {
      expect(O.ROUNDS.some(r => r.vote)).toBeTruthy();
      const keys = O.ROUNDS.map(r => r.key);
      expect(keys.indexOf('fikir') < keys.indexOf('oylama')).toBeTruthy();
      expect(keys.indexOf('itiraz') < keys.indexOf('oylama')).toBeTruthy();
    });
  });


  /* ==================== API bağlantısı ====================
     "API ekleme kısmı komple bozuk" şikâyetinin altında tek bir hata değil,
     birbirinden bağımsız altı arıza vardı. Her biri burada kilitlenir:

       1) Google Eylül 2026'da anahtar biçimini değiştirdi ("AQ."); ekran
          yalnız "AIza" kabul ediyordu ve yeni anahtar alan herkes kapıda
          kalıyordu.
       2) Google anahtarı adres satırında gidiyordu; artık başlıkla gider.
       3) Adres alanı olmayan sağlayıcıya, önceki sağlayıcının adresi
          sızıyordu: Groq istekleri localhost'a gidiyordu.
       4) Eksik yazılmış uç adresi (…/v1) tamamlanmıyor, 404 veriyordu.
       5) Akıl yürüten modellerin iç sesi (<think>…</think>, reasoning)
          "ajanın yanıtı" diye ekrana çiziliyordu — "yanlış yanıt" buydu.
       6) Hata gövdesi okunmadan sınıflanıyordu: geçersiz anahtar
          "istek reddedildi" diye görünüyordu. */

  describe('Ofis — API bağlantısı', () => {
    const realFetch = window.fetch;

    /* Sahte ama BİÇİMİ gerçek bir Google "auth key". Parça parça kurulur;
       bkz. aşağıdaki biçim testinin gerekçesi. */
    const AQ_KEY = 'AQ.' + 'Ab8RN6IOenow' + 'Q8_ornek_anahtar_' + 'gercek_degildir';

    function fresh(){
      R.Quota.reset(); R.Quota.clearOverrides();
      R.LLM.clearCatalog();
      /* Sıra beklemesi testleri yavaşlatmasın. */
      ['groq', 'gemini', 'openrouter'].forEach(id =>
        R.Quota.setOverride(id, { rpm:60000, rpd:99999 }));
    }
    function done(){
      window.fetch = realFetch;
      ['groq', 'gemini', 'openrouter', 'custom'].forEach(id => R.LLM.setKey(id, ''));
      R.LLM.clearCatalog();
      R.Quota.reset(); R.Quota.clearOverrides();
    }

    /* Tek karelik düz JSON yanıtı; istekleri kaydeder. */
    function jsonOnce(payload, sink, status){
      return async (url, init) => {
        if(sink) sink.push({ url:String(url), init });
        return {
          ok:status == null || status < 400, status:status || 200,
          headers:{ get:() => 'application/json' },
          json:async () => payload,
          text:async () => JSON.stringify(payload),
        };
      };
    }

    /* ---------- 1. anahtar biçimi ---------- */

    it('Google’ın yeni "AQ." anahtarı kabul edilir', () => {
      /* Gerçek biçim: "AQ." + nokta, alt çizgi ve tire içerebilen uzun bir
         gövde; "AIza" ile başlamaz. Gövde burada BİRLEŞTİRİLEREK üretilir:
         kaynağa gerçeğe benzeyen bütün bir anahtar yazmak, depo tarafındaki
         gizli tarayıcılarını boşuna tetikler ve o an geçerli bir anahtarın
         yanlışlıkla depoya girmesini kolaylaştırır. */
      const aq = AQ_KEY;
      expect(aq.length > 40).toBeTruthy();
      expect(R.LLM.keyProblem('gemini', aq)).toBeNull();
      expect(R.LLM.keyOwner(aq)).toBe('gemini');
    });

    it('eski "AIza" anahtarı da kabul edilmeye devam eder', () => {
      const old = 'AIzaSyD-0123456789abcdefghijklmnopqrstu';
      expect(R.LLM.keyProblem('gemini', old)).toBeNull();
      expect(R.LLM.keyOwner(old)).toBe('gemini');
    });

    it('başka sağlayıcının anahtarı kesin hatadır, tanımadığı biçim yalnız uyarıdır', () => {
      const wrong = R.LLM.keyProblem('gemini', 'sk-or-v1-0123456789abcdef');
      expect(wrong.level).toBe('wrong');
      expect(wrong.owner).toBe('openrouter');
      /* Hiçbir bilinen biçime uymayan anahtar engellenmez: sağlayıcılar
         önek değiştirebilir ve geçerli anahtarı reddetmek en kötü arızadır. */
      const soft = R.LLM.keyProblem('gemini', 'bilinmeyen-bicim-123456');
      expect(soft.level).toBe('shape');
    });

    /* ---------- 2. Google anahtarı başlıkla gider ---------- */

    it('Gemini anahtarı adres satırında değil başlıkta gider', async () => {
      fresh();
      R.LLM.setKey('gemini', AQ_KEY);
      const calls = [];
      window.fetch = jsonOnce({ candidates:[
        { content:{ parts:[{ text:'Hazır.' }] }, finishReason:'STOP' } ] }, calls);

      await R.LLM.chat({ provider:'gemini', model:'gemini-2.5-flash' },
        { messages:[{ role:'user', text:'x' }] });

      expect(calls[0].url.indexOf('key=')).toBe(-1);
      expect(calls[0].init.headers['x-goog-api-key'])
        .toBe(AQ_KEY);
      /* Google Bearer kabul etmez; yanlış başlık gönderilmemeli. */
      expect(calls[0].init.headers.Authorization).toBeUndefined();
      done();
    });

    it('OpenAI uyumlu uçlarda anahtar Bearer olarak gider', async () => {
      fresh();
      R.LLM.setKey('groq', 'gsk_test123');
      const calls = [];
      window.fetch = jsonOnce({ choices:[
        { message:{ content:'Hazır.' }, finish_reason:'stop' } ] }, calls);

      await R.LLM.chat({ provider:'groq', model:'llama-3.1-8b-instant' },
        { messages:[{ role:'user', text:'x' }] });

      expect(calls[0].init.headers.Authorization).toBe('Bearer gsk_test123');
      done();
    });

    /* ---------- 3. adres sızıntısı ---------- */

    it('başka sağlayıcının adresi isteğe sızmaz', async () => {
      fresh();
      R.LLM.setKey('groq', 'gsk_test123');
      const calls = [];
      window.fetch = jsonOnce({ choices:[{ message:{ content:'Hazır.' } }] }, calls);

      /* Ollama'dan Groq'a geçen kullanıcının ayarında localhost adresi
         kalıyordu ve bütün Groq istekleri oraya gidiyordu. */
      await R.LLM.chat(
        { provider:'groq', model:'llama-3.1-8b-instant',
          endpoint:'http://localhost:11434/v1/chat/completions' },
        { messages:[{ role:'user', text:'x' }] });

      expect(calls[0].url).toBe('https://api.groq.com/openai/v1/chat/completions');
      done();
    });

    it('kendi adresini düzenleyebilen sağlayıcıda adres kullanılır', () => {
      expect(R.LLM.endpointFor(R.PROVIDERS.ollama, { endpoint:'http://192.168.1.5:11434/v1' }))
        .toBe('http://192.168.1.5:11434/v1/chat/completions');
    });

    /* ---------- 4. eksik adres tamamlanır ---------- */

    it('eksik yazılmış uç adresi tamamlanır', () => {
      const n = R.LLM.normalizeOpenAI;
      expect(n('https://api.x.example/v1')).toBe('https://api.x.example/v1/chat/completions');
      expect(n('https://api.x.example/v1/')).toBe('https://api.x.example/v1/chat/completions');
      expect(n('localhost:11434')).toBe('http://localhost:11434/v1/chat/completions');
      expect(n('https://api.x.example/v1/chat/completions'))
        .toBe('https://api.x.example/v1/chat/completions');
      expect(n('')).toBe('');
      /* Sorgu dizesi korunur (Azure gibi uçlar sürümü orada taşır). */
      expect(n('https://a.example/openai/v1?api-version=2026-01-01'))
        .toBe('https://a.example/openai/v1/chat/completions?api-version=2026-01-01');
    });

    it('Gemini taban adresi /models ile biter', () => {
      expect(R.LLM.normalizeGemini('https://generativelanguage.googleapis.com/v1beta'))
        .toBe('https://generativelanguage.googleapis.com/v1beta/models');
      expect(R.LLM.normalizeGemini('https://generativelanguage.googleapis.com/v1beta/models/'))
        .toBe('https://generativelanguage.googleapis.com/v1beta/models');
    });

    /* ---------- 5. akıl yürütmenin iç sesi ---------- */

    it('<think> bloğu ajanın yanıtına karışmaz', () => {
      const t = R.LLM.stripThinking;
      expect(t('<think>Önce medyana bakayım…</think>Türkçede net kaybın var.'))
        .toBe('Türkçede net kaybın var.');
      /* Kapanmamış açılış: sonrası henüz cevap değil. */
      expect(t('Kısa cevap. <think>hmm, acaba')).toBe('Kısa cevap.');
      /* Açılış hiç gelmediyse kapanışa kadarki her şey iç sestir. */
      expect(t('düşünüyorum…</think>Cevap bu.')).toBe('Cevap bu.');
      expect(t('Etiketi olmayan düz metin.')).toBe('Etiketi olmayan düz metin.');
    });

    it('yalnız düşünme döndüren model "boş yanıt" değil, ayrı bir hata verir', async () => {
      fresh();
      R.LLM.setKey('openrouter', 'sk-or-v1-test');
      window.fetch = jsonOnce({ choices:[
        { message:{ content:'<think>uzun uzun düşündüm ama yazmadım</think>' } } ] });

      let code = null;
      try{
        await R.LLM.chat({ provider:'openrouter', model:'deepseek/deepseek-r1-0528:free' },
          { messages:[{ role:'user', text:'x' }] });
      }catch(err){ code = err.code; }
      /* "Tekrar dene" yanlış tavsiyedir: aynı model aynı şeyi yapar.
         Yedek modele geçilebilmesi için yeniden denenebilir sayılır. */
      expect(code).toBe('thinking_only');
      expect(R.LLM.retryable('thinking_only')).toBeTruthy();
      expect(R.LLM.errorText('thinking_only').length > 40).toBeTruthy();
      done();
    });

    it('ayrı reasoning alanı cevaba karışmaz', async () => {
      fresh();
      R.LLM.setKey('openrouter', 'sk-or-v1-test');
      window.fetch = jsonOnce({ choices:[{ message:{
        reasoning:'Kullanıcı TYT soruyor, önce medyana bakayım…',
        content:'Türkçede net kaybın var.' } }] });

      const res = await R.LLM.chat({ provider:'openrouter', model:'x/y:free' },
        { messages:[{ role:'user', text:'x' }] });
      expect(res.text).toBe('Türkçede net kaybın var.');
      done();
    });

    /* ---------- 6. hata sınıflaması ---------- */

    it('gövde okunmadan yapılan sınıflama kullanıcıyı yanlış yere göndermez', () => {
      const c = R.LLM.classify;
      /* Google geçersiz anahtarı 400 ile bildirir; "istek reddedildi" demek
         anahtarı yenilemesi gereken kullanıcıya hiçbir şey söylemez. */
      expect(c(400, 'API key not valid. Please pass a valid API key.')).toBe('unauthorized');
      expect(c(401, 'ACCESS_TOKEN_TYPE_UNSUPPORTED')).toBe('key_type');
      expect(c(400, 'The model `x/y:free` does not exist')).toBe('bad_model');
      expect(c(404, '')).toBe('bad_model');
      expect(c(429, 'Rate limit exceeded: free-models-per-day')).toBe('daily_quota');
      expect(c(429, 'too many requests')).toBe('rate_limited');
      expect(c(402, '')).toBe('no_credit');
      expect(c(503, '')).toBe('server');
    });

    it('anahtar türü desteklenmiyorsa ne yapılacağı söylenir', () => {
      const text = R.LLM.errorText('key_type');
      expect(text).toContain('AI Studio');
      expect(text.length > 60).toBeTruthy();
    });

    it('yerel sunucuya erişilemezse sebep CORS olarak söylenir', async () => {
      fresh();
      window.fetch = async () => { throw new TypeError('Failed to fetch'); };
      let code = null;
      try{
        await R.LLM.chat({ provider:'ollama', model:'llama3.1:8b',
          endpoint:'http://localhost:11434/v1/chat/completions' },
          { messages:[{ role:'user', text:'x' }] });
      }catch(err){ code = err.code; }
      expect(code).toBe('local_cors');
      expect(R.LLM.errorText('local_cors')).toContain('OLLAMA_ORIGINS');
      done();
    });

    /* ---------- 7. parametre onarımı ---------- */

    it('max_tokens kabul etmeyen uç için istek kendiliğinden düzeltilir', async () => {
      fresh();
      R.LLM.setKey('groq', 'gsk_test123');
      const bodies = [];
      let call = 0;
      window.fetch = async (url, init) => {
        bodies.push(JSON.parse(init.body));
        call++;
        if(call === 1) return {
          ok:false, status:400,
          headers:{ get:() => 'application/json' },
          text:async () => JSON.stringify({ error:{ message:
            "Unsupported parameter: 'max_tokens' is not supported. Use 'max_completion_tokens' instead." } }),
        };
        return {
          ok:true, status:200,
          headers:{ get:() => 'application/json' },
          json:async () => ({ choices:[{ message:{ content:'Hazır.' } }] }),
        };
      };

      const res = await R.LLM.chat({ provider:'groq', model:'yeni-model' },
        { messages:[{ role:'user', text:'x' }] });
      expect(res.text).toBe('Hazır.');
      expect(bodies[0].max_tokens > 0).toBeTruthy();
      expect(bodies[1].max_completion_tokens > 0).toBeTruthy();
      expect(bodies[1].max_tokens).toBeUndefined();
      done();
    });

    it('Gemini 3 ailesinde düşünme seviyesi gönderilir', async () => {
      fresh();
      R.LLM.setKey('gemini', AQ_KEY);
      const calls = [];
      window.fetch = jsonOnce({ candidates:[
        { content:{ parts:[{ text:'Hazır.' }] }, finishReason:'STOP' } ] }, calls);

      await R.LLM.chat({ provider:'gemini', model:'gemini-3-flash-preview' },
        { messages:[{ role:'user', text:'x' }] });

      const body = JSON.parse(calls[0].init.body);
      /* 3.x thinkingBudget değil thinkingLevel bekler; yanlışı 400 verir. */
      expect(body.generationConfig.thinkingConfig.thinkingLevel).toBe('low');
      expect(body.generationConfig.thinkingConfig.thinkingBudget).toBeUndefined();
      done();
    });

    /* ---------- 8. canlı model listesi ---------- */

    it('Gemini listesinden sohbet edemeyen modeller ayıklanır', async () => {
      fresh();
      R.LLM.setKey('gemini', AQ_KEY);
      window.fetch = jsonOnce({ models:[
        { name:'models/gemini-2.5-flash', displayName:'Gemini 2.5 Flash',
          supportedGenerationMethods:['generateContent', 'countTokens'] },
        { name:'models/text-embedding-004', displayName:'Embedding',
          supportedGenerationMethods:['embedContent'] },
        { name:'models/gemini-3-flash-preview', displayName:'Gemini 3 Flash',
          supportedGenerationMethods:['generateContent'] },
      ] });

      const res = await R.LLM.listModels({ provider:'gemini' });
      const ids = res.models.map(m => m.id);
      expect(ids).toContain('gemini-2.5-flash');
      expect(ids).toContain('gemini-3-flash-preview');
      expect(ids.indexOf('text-embedding-004')).toBe(-1);
      done();
    });

    it('OpenRouter listesinden ücretli modeller ayıklanır ve liste saklanır', async () => {
      fresh();
      R.LLM.setKey('openrouter', 'sk-or-v1-test');
      window.fetch = jsonOnce({ data:[
        { id:'deepseek/deepseek-chat-v3-0324:free' },
        { id:'openai/gpt-5', pricing:{ prompt:'0.00001', completion:'0.00003' } },
        { id:'meta-llama/llama-4-scout:free' },
      ] });

      const res = await R.LLM.listModels({ provider:'openrouter' });
      const ids = res.models.map(m => m.id);
      expect(ids).toHaveLength(2);
      expect(ids.indexOf('openai/gpt-5')).toBe(-1);

      /* Liste tarayıcıda saklanır: ekran bir daha çekmeden canlı listeyi görür. */
      window.fetch = realFetch;
      expect(R.LLM.cachedModels('openrouter').models).toHaveLength(2);
      expect(R.LLM.modelsFor('openrouter').map(m => m.id)).toContain('meta-llama/llama-4-scout:free');
      done();
    });

    it('canlı liste katalogdaki okunabilir etiketi korur', async () => {
      fresh();
      R.LLM.setKey('groq', 'gsk_test123');
      window.fetch = jsonOnce({ data:[
        { id:'llama-3.3-70b-versatile' },
        { id:'yepyeni-model' },
      ] });
      await R.LLM.listModels({ provider:'groq' });
      window.fetch = realFetch;

      const list = R.LLM.modelsFor('groq');
      const known = list.find(m => m.id === 'llama-3.3-70b-versatile');
      const fresh_ = list.find(m => m.id === 'yepyeni-model');
      expect(known.label).toBe('Llama 3.3 70B');
      /* Katalogda olmayan modelin etiketi yoktur; ekran kimliği gösterir. */
      expect(!fresh_.label).toBeTruthy();
      done();
    });

    it('model listesi çekmek günlük kotadan düşmez', async () => {
      fresh();
      R.Quota.clearOverrides();
      R.LLM.setKey('groq', 'gsk_test123');
      window.fetch = jsonOnce({ data:[{ id:'llama-3.1-8b-instant' }] });
      const before = R.Quota.status({ provider:'groq', model:'llama-3.1-8b-instant' }).usedToday;
      await R.LLM.listModels({ provider:'groq' });
      const after = R.Quota.status({ provider:'groq', model:'llama-3.1-8b-instant' }).usedToday;
      expect(after).toBe(before);
      done();
    });

    /* ---------- 9. tanılama ---------- */

    it('tanılama zincirin ilk kırılan halkasını gösterir', async () => {
      fresh();
      R.LLM.setKey('gemini', AQ_KEY);
      window.fetch = jsonOnce({ models:[
        { name:'models/gemini-2.5-flash', supportedGenerationMethods:['generateContent'] },
      ] });

      /* Seçili model listede yok: kullanıcıya "bağlanamadı" değil, tam
         olarak hangi adımın kırıldığı söylenir. */
      const res = await R.LLM.diagnose({ provider:'gemini', model:'gemini-2.0-flash' });
      const step = res.steps.find(x => x.name === 'Seçili model');
      expect(step.ok).toBeFalsy();
      expect(step.code).toBe('bad_model');
      expect(res.ok).toBeFalsy();
      done();
    });

    it('anahtar gerekmeyen sağlayıcıda anahtar girilirse yine de kullanılır', async () => {
      fresh();
      R.LLM.setKey('custom', 'kendi-anahtarim');
      const calls = [];
      window.fetch = jsonOnce({ choices:[{ message:{ content:'Hazır.' } }] }, calls);

      await R.LLM.chat({ provider:'custom', model:'yerel', endpoint:'https://uc.example/v1' },
        { messages:[{ role:'user', text:'x' }] });

      expect(calls[0].url).toBe('https://uc.example/v1/chat/completions');
      expect(calls[0].init.headers.Authorization).toBe('Bearer kendi-anahtarim');
      done();
    });
  });



  /* ==================== sohbet edilebilirlik ====================
     Şikâyet neti: "merhaba yazıyorum, adam direkt masamdaki rapor diyor."
     Sebep tek bir hata değil, istemin kendisiydi: her çağrıda ajanın önüne
     JSON rapor konup "bunu yorumla" deniyordu — model de doğal olarak raporu
     sesli okuyordu.

     Çözüm: gelen mesaj önce SINIFLANIR (kural motorunda, deterministik) ve
     sınıf neyin gönderileceğini belirler. Selamlaşmaya rapor gönderilmez;
     gönderilirse model onu okur. */

  describe('Ofis — sohbet edilebilirlik', () => {

    it('selamlaşma selamlaşma olarak tanınır', () => {
      ['merhaba', 'Selam', 'slm', 'günaydın', 'naber', 'nasılsın?', 'hey',
       'teşekkürler', 'sağ ol', 'eyvallah', 'sen kimsin?']
        .forEach(q => expect(O.chatKind(q)).toBe('selam'));
    });

    it('selamla başlayan ama içinde gerçek soru olan mesaj selamlaşma sayılmaz', () => {
      /* Uzun mesaj bir hâl hatır sorusu değildir; içindeki soru cevaplanmalı. */
      expect(O.chatKind('merhaba, TYT matematik netim neden düşüyor acaba bu hafta?'))
        .toBe('veri');
      expect(O.chatKind('selam, üslü sayılar nasıl çalışılır?')).toBe('konu');
    });

    it('ders sorusu konu turudur', () => {
      ['üslü sayılar nasıl çalışılır', 'paragraf mantığı nedir',
       'türev ne demek', 'bu konuyu anlamadım', 'çemberde açı konusunda takıldım',
       'bir örnek ver']
        .forEach(q => expect(O.chatKind(q)).toBe('konu'));
    });

    it('kendi durumu sorulduğunda veri turudur', () => {
      ['TYT matematikte hangi konuya dönmeliyim?', 'netim kaç oldu',
       'analiz borcum ne durumda', 'planım hedefime yetiyor mu', 'bu hafta nasıl gidiyor']
        .forEach(q => expect(O.chatKind(q)).toBe('veri'));
    });

    it('dert yanma veri sorusundan önce gelir', () => {
      /* "Moralim bozuk, netlerim düşüyor" diyen birine önce tablo okumak,
         sorulan soruya değil sorulmayan soruya cevap vermektir. */
      expect(O.chatKind('moralim çok bozuk')).toBe('hal');
      expect(O.chatKind('moralim bozuk, netlerim de düşüyor')).toBe('hal');
      expect(O.chatKind('çok yoruldum artık')).toBe('hal');
    });

    it('sınıflandırılamayan mesaj veri sayılır', () => {
      /* Uygulama bir çalışma sistemi: varsayılan soru adayın kendi durumudur. */
      expect(O.chatKind('şey')).toBe('veri');
      expect(O.chatKind('')).toBe('veri');
    });

    /* ---------- ne gönderiliyor ---------- */

    it('selamlaşmaya ve dert yanmaya RAPOR GÖNDERİLMEZ', () => {
      reset();
      /* Bu testin tamamı şu tek cümle içindir: bir modelin önüne JSON koyup
         "yorumla" demek, ona onu sesli okutmaktır. */
      expect(O.chatPayload('tyt', 'selam')).toBeNull();
      expect(O.chatPayload('rehber', 'hal')).toBeNull();
      expect(O.chatPayload('tyt', 'veri')).toBeTruthy();
    });

    it('konu turunda ham tablo değil, düz cümleden özet gider', () => {
      reset();
      /* JSON görmüş bir model onu okur; düz cümle okunacak bir şey değil,
         bilinen bir şeydir. */
      const konu = O.chatPayload('tyt', 'konu');
      expect(typeof konu.ozet).toBe('string');
      expect(Array.isArray(konu.aklindakiler)).toBeTruthy();
      expect(JSON.stringify(konu).length < JSON.stringify(O.chatPayload('tyt', 'veri')).length)
        .toBeTruthy();

      /* İstemde tek bir süslü parantez bile geçmemeli. */
      const p = R.OFFICE_PROMPTS.chat(R.AGENT_BY_ID.tyt, konu, 'türev nedir', 'konu');
      expect(p.indexOf('{')).toBe(-1);
    });

    it('selamlaşma isteminde rapor da görev olarak "yorumla" da geçmez', () => {
      const agent = R.AGENT_BY_ID.tyt;
      const p = R.OFFICE_PROMPTS.chat(agent, null, 'merhaba', 'selam');
      expect(p).toContain('merhaba');
      expect(p.indexOf('MASANDAKİ')).toBe(-1);
      expect(p.indexOf('{')).toBe(-1);          // hiç JSON yok
      expect(p).toContain('Rapor okuma');
    });

    it('konu isteminde ders bilgisinin serbest olduğu açıkça söylenir', () => {
      const agent = R.AGENT_BY_ID.tyt;
      const p = R.OFFICE_PROMPTS.chat(agent, { ozet:'x', aklindakiler:[] },
        'üslü sayılar nasıl çalışılır', 'konu');
      expect(p).toContain('tabloya ihtiyacın yok');
      /* Adayın kendi sayıları hâlâ korumalı. */
      expect(p).toContain('uydurma');
    });

    it('selamlaşma sistemde değişiklik önermez ve sayı denetimine girmez', async () => {
      reset();
      await withStubLLM('Merhaba, buradayım.', async calls => {
        await O.ask('tyt', 'merhaba');
        const req = calls[0].req;
        /* Öneri kataloğu istemde olmamalı: "merhaba"nın karşılığı bir
           sistem değişikliği önerisi olamaz. */
        expect(req.system.indexOf('EYLEM')).toBe(-1);
      });
    });

    /* ---------- konuşma kaydı ---------- */

    it('her istem raporu ele veren kalıpları yasaklar', () => {
      const sys = R.OFFICE_PROMPTS.system(R.AGENT_BY_ID.tyt, 'dengeli');
      expect(sys).toContain('raporuma göre');
      expect(sys).toContain('Rapor okumuyorsun');
    });

    it('tur uzunluğu istemde ajanın varsayılanının yerine geçebilir', () => {
      const agent = R.AGENT_BY_ID.tyt;
      const uzun = R.OFFICE_PROMPTS.system(agent, 'dengeli');
      const kisa = R.OFFICE_PROMPTS.system(agent, 'dengeli', { sentences:2 });
      expect(uzun).toContain('En fazla ' + agent.maxSentences + ' cümle');
      expect(kisa).toContain('En fazla 2 cümle');
    });

    it('toplantı turları sohbetten kısadır', () => {
      /* Beş kişi sırayla dört cümle kurunca toplantı okunmaz hâle geliyordu. */
      O.ROUNDS.forEach(r => {
        expect(r.sentences <= 2).toBeTruthy();
      });
      expect(R.AGENT_BY_ID.tyt.maxSentences > 2).toBeTruthy();
    });

    it('toplantı isteminde önce konuşulanlar, sonra tablo gelir', () => {
      const agent = R.AGENT_BY_ID.tyt;
      const p = R.OFFICE_PROMPTS.turn(agent, { topic:'Gündem' }, { a:1 },
        [{ name:'Deniz', role:'Analist', text:'bir bulgu' }], O.ROUNDS[0], null, null);
      /* Tersi, ajana "önce raporunu oku" demek oluyordu. */
      expect(p.indexOf('ŞU ANA KADAR KONUŞULANLAR') < p.indexOf('ÖNÜNDEKİ TABLO')).toBeTruthy();
      expect(p).toContain('arka plan');
      expect(p).toContain('Konuşur gibi yaz');
    });

    /* ---------- model yokken ---------- */

    it('model bağlı değilken bile selamlaşmaya rapor okunmaz', async () => {
      reset();
      /* Kullanıcının gördüğü tam olarak buydu: model yokken NE yazılırsa
         yazılsın aynı tablo dönüyordu. */
      const res = await O.ask('tyt', 'merhaba');
      expect(res.mode).toBe('kural');
      expect(res.text.indexOf('Merhaba')).toBe(0);
      expect(res.text.indexOf('Masamdaki rapor')).toBe(-1);
      expect(res.text).toContain('model');
    });

    it('model bağlı değilken konu sorusunda durum dürüstçe söylenir', async () => {
      reset();
      const res = await O.ask('tyt', 'üslü sayılar nasıl çalışılır');
      expect(res.mode).toBe('kural');
      expect(res.text).toContain('model');
      expect(res.text.indexOf('anlatmayı isterdim')).toBeGreaterThan(-1);
    });

    it('"model bağla" notu sohbet başına bir kez verilir', async () => {
      reset();
      const first = await O.ask('tyt', 'merhaba');
      await O.pushChat('tyt', 'user', 'merhaba');
      await O.pushChat('tyt', 'agent', first.text);
      const second = await O.ask('tyt', 'selam');
      /* Her mesajda tekrarlamak sohbet değil uyarı yağmurudur. */
      expect(first.text.length > second.text.length).toBeTruthy();
    });
  });

  /* ==================== 3B oda ====================
     Ofis ekranı iki görünüm taşır: düz kat planı ve 3B oda. İkisi de AYNI
     veriden çizilir ve ikisinde de masa bir <button>'dur — 3B görünüm bir
     resim değil, aynı arayüzün başka bir çizimidir. */

  describe('Ofis — 3B oda', () => {
    async function draw(){
      reset();
      return String(await R.Screens.office.render());
    }

    it('varsayılan görünüm 3B odadır', async () => {
      reset();
      expect(O.settings().room3d).toBe(true);
    });

    it('odada beş masa vardır ve her masa tıklanabilir bir düğmedir', async () => {
      const out = await draw();
      expect(out).toContain('class="room3d"');
      const desks = out.match(/class="desk3d /g) || [];
      expect(desks).toHaveLength(5);
      R.AGENT_IDS.forEach(id => {
        expect(out).toContain('data-act="office-desk" data-agent="' + id + '"');
      });
      /* Kimlik rengi kat planıyla AYNI kaynaktan gelir. */
      expect(out).toContain('seat--patron');
    });

    it('her masanın odada bir yeri vardır', async () => {
      const out = await draw();
      const spots = out.match(/--x:\d+%; --y:\d+%/g) || [];
      expect(spots).toHaveLength(5);
    });

    it('durum metni yalnız söylenecek bir şey varken çıkar', async () => {
      reset();
      /* Kural motoru modunda hepsi aynı durumdadır: oda ad kartlarını
         gereksiz metinle doldurmaz, ışık yeter. */
      const quiet = String(await R.Screens.office.render());
      expect(quiet.indexOf('desk3d__state')).toBe(-1);
    });

    it('kat planına geçilince oda kalkar, masalar kalır', async () => {
      reset();
      await O.saveSettings({ room3d:false });
      const out = String(await R.Screens.office.render());
      expect(out.indexOf('class="room3d"')).toBe(-1);
      expect((out.match(/class="seat /g) || []).length).toBe(5);
      expect(out).toContain('data-act="office-desk"');
      await O.saveSettings({ room3d:true });
    });

    it('ekranın ürettiği her office- eylemi bir işleyiciye bağlıdır', async () => {
      const out = await draw();
      const acts = (out.match(/data-act="office-[a-z-]+"/g) || [])
        .map(m => m.slice(10, -1));
      expect(acts.length > 3).toBeTruthy();
      acts.forEach(act => {
        expect(typeof R.Screens.office.handle[act]).toBe('function');
      });
    });

    it('ayarlar sayfasındaki eylemler de bağlıdır', () => {
      ['office-models', 'office-diagnose', 'office-test', 'office-save', 'office-view', 'office-turn']
        .forEach(act => expect(typeof R.Screens.office.handle[act]).toBe('function'));
      ['office-provider', 'office-key', 'office-model']
        .forEach(act => expect(typeof R.Screens.office.change[act]).toBe('function'));
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
