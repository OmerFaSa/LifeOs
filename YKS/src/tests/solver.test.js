/* Soru cozucu: kapali katalog eslesmesi, cikti ayrimi, dogrulama, kayit,
   ve tasima katmaninin gorsel destegi. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const Q = R.Solver;

  function reset(){
    resetState();
    R.S.solved = [];
  }

  /* ==================== kapali katalog ==================== */

  describe('Çözücü — kapalı katalog', () => {
    it('modele verilen liste bütün dersleri ve konuları taşır', () => {
      const t = Q.catalogText();
      R.SUBJECTS.forEach(s => {
        expect(t).toContain(s.name);
        expect(t).toContain(s.topics[0].name);
      });
    });

    it('tam ad eşleşir', () => {
      const s = R.SUBJECTS[0];
      const hit = Q.matchTopic(s.name, s.topics[0].name);
      expect(hit.subject.id).toBe(s.id);
      expect(hit.topic.id).toBe(s.topics[0].id);
    });

    it('Türkçe harf farkı eşleşmeyi bozmaz', () => {
      const s = R.SUBJECTS[0];
      const name = s.topics[0].name;
      /* Model "Sözcükte" yerine "sozcukte" yazabilir; eşleşme normalize
         edilmiş metin üzerinden yapılır. */
      const bozuk = R.U.norm(name).toUpperCase();
      const hit = Q.matchTopic(s.name, bozuk);
      expect(!!hit).toBeTruthy();
      expect(hit.topic.id).toBe(s.topics[0].id);
    });

    it('içeren ad eşleşir ama en dar konu seçilir', () => {
      const s = R.SUBJECTS[0];
      const t = s.topics[0];
      const hit = Q.matchTopic(s.name, t.name + ' (eş anlam)');
      expect(!!hit).toBeTruthy();
      expect(hit.topic.id).toBe(t.id);
    });

    it('listede olmayan konu için TAHMİN YÜRÜTÜLMEZ', () => {
      /* Uydurulmuş tek bir konu adı, konu takibini ve risk sıralamasını
         sessizce bozar. Eşleşme yoksa null döner ve kullanıcıya sorulur. */
      expect(Q.matchTopic('TYT Türkçe', 'Kuantum dolanıklığı')).toBeNull();
      expect(Q.matchTopic('', '')).toBeNull();
      expect(Q.matchTopic('Olmayan Ders', '')).toBeNull();
    });

    it('ders adı yanlışsa bile konu adı doğruysa bulunur', () => {
      const s = R.SUBJECTS[0];
      const hit = Q.matchTopic('Bilinmeyen Ders', s.topics[0].name);
      expect(!!hit).toBeTruthy();
      expect(hit.subject.id).toBe(s.id);
    });
  });

  /* ==================== çıktı ayrımı ==================== */

  describe('Çözücü — çıktı ayrımı', () => {
    const meta = '{"ders":"TYT Türkçe","konu":"Sözcükte anlam","zorluk":3,"cevap":"C","tuzak":"kök okumamak"}';

    it('anlatım ile makine kuyruğu ayrılır', () => {
      const out = Q.parse('Çözüm burada.\nCevap: C\n\n' + meta);
      expect(out.text).toBe('Çözüm burada.\nCevap: C');
      expect(out.meta.cevap).toBe('C');
      /* JSON kuyruğu ekrana ASLA sızmamalı. */
      expect(out.text.indexOf('{')).toBe(-1);
    });

    it('kod çerçevesine alınmış kuyruk da ayrılır', () => {
      const out = Q.parse('Anlatım.\n\n```json\n' + meta + '\n```');
      expect(out.text).toBe('Anlatım.');
      expect(out.meta.zorluk).toBe(3);
    });

    it('kuyruk yoksa metin olduğu gibi kalır', () => {
      const out = Q.parse('Sadece anlatım var.');
      expect(out.text).toBe('Sadece anlatım var.');
      expect(out.meta).toBeNull();
    });

    it('bozuk JSON metni yutmaz', () => {
      const out = Q.parse('Anlatım. {bu json değil}');
      expect(out.text).toContain('Anlatım.');
      expect(out.meta).toBeNull();
    });

    it('boş metin çökmez', () => {
      expect(Q.parse('').text).toBe('');
      expect(Q.parse(null).meta).toBeNull();
    });
  });

  /* ==================== doğrulama ==================== */

  describe('Çözücü — doğrulama', () => {
    it('tanınan konu kayda bağlanır', () => {
      const s = R.SUBJECTS[0];
      const v = Q.verify({ ders:s.name, konu:s.topics[0].name, zorluk:4, cevap:'B', tuzak:'x' });
      expect(v.matched).toBeTruthy();
      expect(v.subjectId).toBe(s.id);
      expect(v.topicId).toBe(s.topics[0].id);
      expect(v.difficulty).toBe(4);
      expect(v.rawTopic).toBe('');
    });

    it('tanınmayan konu kayda BAĞLANMAZ ama ham hâli saklanır', () => {
      const v = Q.verify({ ders:'X', konu:'Uydurma Konu', zorluk:2 });
      expect(v.matched).toBeFalsy();
      expect(v.topicId).toBeNull();
      expect(v.rawTopic).toBe('Uydurma Konu');
    });

    it('ölçek dışı zorluk kabul edilmez', () => {
      expect(Q.verify({ zorluk:9 }).difficulty).toBeNull();
      expect(Q.verify({ zorluk:0 }).difficulty).toBeNull();
      expect(Q.verify({ zorluk:'iki' }).difficulty).toBeNull();
      expect(Q.verify({ zorluk:'3' }).difficulty).toBe(3);
    });

    it('uzun alanlar kırpılır', () => {
      const v = Q.verify({ cevap:new Array(500).fill('a').join(''), tuzak:new Array(500).fill('b').join('') });
      expect(v.answer.length <= 80).toBeTruthy();
      expect(v.trap.length <= 240).toBeTruthy();
    });

    it('meta hiç yoksa çökmez', () => {
      const v = Q.verify(null);
      expect(v.matched).toBeFalsy();
      expect(v.difficulty).toBeNull();
    });
  });

  /* ==================== kayıt ve ölçüm ==================== */

  describe('Çözücü — kayıt', () => {
    it('kayıt eklenir, listelenir ve silinir', async () => {
      reset();
      const rec = await Q.save({ question:'soru', topicName:'Konu', result:'dogru' });
      expect(Q.all()).toHaveLength(1);
      expect(Q.all()[0].id).toBe(rec.id);
      await Q.remove(rec.id);
      expect(Q.all()).toHaveLength(0);
    });

    it('aynı kayıt iki kez eklenmez, güncellenir', async () => {
      reset();
      const rec = await Q.save({ question:'ilk' });
      await Q.save(Object.assign({}, rec, { question:'düzeltilmiş' }));
      expect(Q.all()).toHaveLength(1);
      expect(Q.all()[0].question).toBe('düzeltilmiş');
    });

    it('“çözüme baktım” çözülmüş sayılmaz', () => {
      /* Konu takibinin en değerli bilgisi bu ayrımdır. */
      expect(Q.solvedOk({ result:'dogru' })).toBeTruthy();
      expect(Q.solvedOk({ result:'zorla' })).toBeTruthy();
      expect(Q.solvedOk({ result:'bakarak' })).toBeFalsy();
      expect(Q.solvedOk({ result:'yanlis' })).toBeFalsy();
      expect(Q.solvedOk({ result:'bos' })).toBeFalsy();
    });

    it('konu başına oran hesaplanır ve en düşük üstte durur', async () => {
      reset();
      const s = R.SUBJECTS[0];
      const t1 = s.topics[0], t2 = s.topics[1];
      await Q.save({ subjectId:s.id, topicId:t1.id, topicName:t1.name, result:'dogru', difficulty:2 });
      await Q.save({ subjectId:s.id, topicId:t1.id, topicName:t1.name, result:'dogru', difficulty:4 });
      await Q.save({ subjectId:s.id, topicId:t2.id, topicName:t2.name, result:'bakarak', difficulty:5 });

      const rows = Q.byTopic();
      expect(rows).toHaveLength(2);
      expect(rows[0].topicId).toBe(t2.id);      // %0 üstte
      expect(rows[0].yuzde).toBe(0);
      expect(rows[1].yuzde).toBe(100);
      expect(rows[1].zorluk).toBe(3);           // (2+4)/2
    });

    it('konuya bağlanmamış kayıt konu tablosuna girmez ama sayılır', async () => {
      reset();
      await Q.save({ question:'konusuz', result:'dogru' });
      expect(Q.byTopic()).toHaveLength(0);
      expect(Q.summary().toplam).toBe(1);
      expect(Q.summary().etiketsiz).toBe(1);
    });

    it('özet yalnız sonucu işaretlenmiş kayıtlardan oran çıkarır', async () => {
      reset();
      await Q.save({ result:'dogru' });
      await Q.save({ result:'bakarak' });
      await Q.save({});                          // sonuç işaretlenmedi
      const s = Q.summary();
      expect(s.toplam).toBe(3);
      expect(s.cozumOrani).toBe(50);             // 3 değil 2 kayıt üzerinden
    });

    it('boş kayıtta özet çökmez', () => {
      reset();
      const s = Q.summary();
      expect(s.toplam).toBe(0);
      expect(s.cozumOrani).toBeNull();
      expect(s.ortZorluk).toBeNull();
    });
  });

  /* ==================== görsel taşıma ==================== */

  describe('Çözücü — görselli istek', () => {
    const realFetch = window.fetch;
    function done(){
      window.fetch = realFetch;
      R.LLM.setKey('groq', ''); R.LLM.setKey('gemini', '');
      R.Quota.reset(); R.Quota.clearOverrides();
    }
    function fresh(){
      R.Quota.reset(); R.Quota.clearOverrides();
      ['groq', 'gemini'].forEach(id => R.Quota.setOverride(id, { rpm:60000, rpd:99999 }));
    }
    const IMG = { mime:'image/jpeg', data:'AAAABBBBCCCC' };

    it('OpenAI uyumlu uçta görsel parça dizisi olarak gider', async () => {
      fresh();
      R.LLM.setKey('groq', 'gsk_test');
      let body = null;
      window.fetch = async (url, init) => {
        body = JSON.parse(init.body);
        return { ok:true, status:200, headers:{ get:() => 'application/json' },
          json:async () => ({ choices:[{ message:{ content:'Tamam.' } }] }) };
      };
      await R.LLM.chat({ provider:'groq', model:'x' },
        { messages:[{ role:'user', text:'oku', images:[IMG] }] });

      const c = body.messages[0].content;
      expect(Array.isArray(c)).toBeTruthy();
      expect(c[0].type).toBe('text');
      expect(c[1].type).toBe('image_url');
      expect(c[1].image_url.url).toBe('data:image/jpeg;base64,AAAABBBBCCCC');
      done();
    });

    it('görsel yokken gövde düz metin olarak kalır', async () => {
      fresh();
      R.LLM.setKey('groq', 'gsk_test');
      let body = null;
      window.fetch = async (url, init) => {
        body = JSON.parse(init.body);
        return { ok:true, status:200, headers:{ get:() => 'application/json' },
          json:async () => ({ choices:[{ message:{ content:'Tamam.' } }] }) };
      };
      await R.LLM.chat({ provider:'groq', model:'x' }, { messages:[{ role:'user', text:'merhaba' }] });
      /* Bazı küçük uçlar dizi biçimini hiç tanımıyor; görsel yoksa
         eski düz biçim korunur. */
      expect(typeof body.messages[0].content).toBe('string');
      done();
    });

    it('Gemini’ye görsel inline_data olarak gider', async () => {
      fresh();
      R.LLM.setKey('gemini', 'AQ.' + 'test_anahtar_ornegi');
      let body = null;
      window.fetch = async (url, init) => {
        body = JSON.parse(init.body);
        return { ok:true, status:200, headers:{ get:() => 'application/json' },
          json:async () => ({ candidates:[{ content:{ parts:[{ text:'Tamam.' }] }, finishReason:'STOP' }] }) };
      };
      await R.LLM.chat({ provider:'gemini', model:'gemini-2.5-flash' },
        { messages:[{ role:'user', text:'oku', images:[IMG] }] });

      const parts = body.contents[0].parts;
      expect(parts[0].text).toBe('oku');
      expect(parts[1].inline_data.mime_type).toBe('image/jpeg');
      expect(parts[1].inline_data.data).toBe('AAAABBBBCCCC');
      done();
    });

    it('yerleşik yetenek görsel almaz ve bunu açıkça söyler', () => {
      expect(R.LLM.supportsVision({ provider:'builtin', model:'default' })).toBeFalsy();
      expect(R.LLM.errorText('no_vision')).toContain('Gemini');
      /* Yeniden denenebilir: zincirde görsel okuyan bir model varsa
         istek oraya düşer. */
      expect(R.LLM.retryable('no_vision')).toBeTruthy();
    });

    it('görsel desteği bilinmiyorsa DENENİR', () => {
      /* Yanlış bir "hayır", çalışan bir modeli kullanıcıdan saklamak olurdu. */
      expect(R.LLM.supportsVision({ provider:'openrouter', model:'bilinmeyen/model' })).toBeTruthy();
      expect(R.LLM.supportsVision({ provider:'gemini', model:'gemini-2.5-flash' })).toBeTruthy();
      expect(R.LLM.supportsVision({ provider:'groq', model:'llama-3.3-70b-versatile' })).toBeFalsy();
    });

    it('görsel zinciri yalnız görsel okuyan modelleri taşır', () => {
      R.LLM.setKey('gemini', 'AQ.' + 'test_anahtar_ornegi');
      const chain = R.LLM.visionChain({ provider:'gemini', model:'gemini-2.5-flash' });
      expect(chain.length > 0).toBeTruthy();
      chain.forEach(c => expect(R.LLM.supportsVision(c)).toBeTruthy());
      R.LLM.setKey('gemini', '');
    });

    it('görsel okuyan model yokken çözücü açıkça söyler', async () => {
      reset();
      R.LLM.setKey('gemini', ''); R.LLM.setKey('groq', ''); R.LLM.setKey('openrouter', '');
      let code = null;
      try{
        await Q.solve({ image:IMG });
      }catch(err){ code = err.code; }
      expect(code).toBe('no_vision');
    });

    it('soru da fotoğraf da yoksa çağrı hiç yapılmaz', async () => {
      reset();
      const realReady = R.LLM.ready;
      R.LLM.ready = () => true;
      let code = null;
      try{ await Q.solve({ question:'   ' }); }catch(err){ code = err.code; }
      R.LLM.ready = realReady;
      expect(code).toBe('empty');
    });
  });
})();
