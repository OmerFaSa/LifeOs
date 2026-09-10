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

  /* ==================== kaynak zorluğu ====================
     İki ayrı şey vardır ve karıştırılmamalıdır:
       ETİKET — kaynağın kademesi. Bir başlangıç noktasıdır.
       ÖLÇÜM  — o kaynaktan çözdüğün sorularda SENİN oranın. Asıl bilgi bu.
     Genel olarak %75 çözüp bir kitapta %45'te kalan biri için o kitap
     zordur — etiketinde ne yazarsa yazsın. */

  describe('Kaynak — gerçek zorluk ölçümü', () => {
    const Src = R.Sources;

    function fresh(){
      resetState();
      R.S.solved = [];
      R.S.sources = [];
    }

    /* n soruyu verilen kaynağa, verilen başarı oranıyla yazar. */
    async function seedSolved(sourceId, n, okCount, diff){
      for(let i = 0; i < n; i++){
        await Q.save({
          sourceId,
          result:i < okCount ? 'dogru' : 'yanlis',
          difficulty:diff || null,
        });
      }
    }

    it('tohum liste uygulamanın kendi kaynak mimarisinden gelir', () => {
      /* Kademeler uydurulmadı: yayın merdiveni ve ders başına kaynak
         listesi zaten uygulamanın içindeydi. */
      const names = R.SOURCE_SEED.map(x => x.name);
      expect(names).toContain('345');
      expect(names).toContain('Bilgi Sarmal');
      expect(names).toContain('3D');
      R.SOURCE_SEED.forEach(x => {
        expect(!!R.SOURCE_LEVELS[x.level]).toBeTruthy();
        expect(!!R.SOURCE_KINDS[x.kind]).toBeTruthy();
        expect(x.from.length > 3).toBeTruthy();
      });
    });

    it('kaynak eklenir, güncellenir ve silinir', async () => {
      fresh();
      const s = await Src.save({ name:'  345 TYT Matematik  ', level:'orta', kind:'banka' });
      expect(s.name).toBe('345 TYT Matematik');       // kırpılır
      expect(Src.all()).toHaveLength(1);
      await Src.save(Object.assign({}, s, { level:'ust' }));
      expect(Src.all()).toHaveLength(1);
      expect(Src.byId(s.id).level).toBe('ust');
      await Src.remove(s.id);
      expect(Src.all()).toHaveLength(0);
    });

    it('adsız kaynak kaydedilmez', async () => {
      fresh();
      let code = null;
      try{ await Src.save({ name:'   ' }); }catch(e){ code = e.code; }
      expect(code).toBe('empty');
    });

    it('bilinmeyen kademe ve tür varsayılana düşer', async () => {
      fresh();
      const s = await Src.save({ name:'X', level:'uydurma', kind:'uydurma' });
      expect(s.level).toBe('orta');
      expect(s.kind).toBe('banka');
    });

    it('yeterli kayıt yokken oran HİÇ hesaplanmaz', async () => {
      fresh();
      const s = await Src.save({ name:'Kitap' });
      await seedSolved(s.id, 5, 1);
      const m = Src.measure(s.id);
      /* Altı sorudan çıkan bir oran gürültüdür; uydurma bir zorluk
         etiketi, etiketsiz bırakmaktan kötüdür. */
      expect(m.soru).toBe(5);
      expect(m.oran).toBeNull();
      expect(m.yeterli).toBeFalsy();
      expect(m.eksik).toBe(R.SOURCE_MIN_SAMPLE - 5);
      expect(Src.relative(s.id).durum).toBe('bilinmiyor');
      expect(Src.sentence(s.id)).toContain('en az');
    });

    it('yeterli kayıt varken oran çıkar', async () => {
      fresh();
      const s = await Src.save({ name:'Kitap' });
      await seedSolved(s.id, 10, 7, 3);
      const m = Src.measure(s.id);
      expect(m.oran).toBe(70);
      expect(m.ortZorluk).toBe(3);
      expect(m.yeterli).toBeTruthy();
    });

    it('kaynak SENİN genel oranınla karşılaştırılır', async () => {
      fresh();
      const kolay = await Src.save({ name:'Kolay Kitap' });
      const zor = await Src.save({ name:'Zor Kitap' });
      /* Genel oran ~%70; zor kitapta %20 → sana göre ZOR. */
      await seedSolved(kolay.id, 20, 18);
      await seedSolved(zor.id, 10, 2);

      const genel = Src.overallRate();
      expect(genel > 60).toBeTruthy();
      const r = Src.relative(zor.id);
      expect(r.durum).toBe('zor');
      expect(r.fark < -R.SOURCE_DELTA).toBeTruthy();
      expect(Src.sentence(zor.id)).toContain('ZOR');

      const k = Src.relative(kolay.id);
      expect(k.durum).toBe('kolay');
    });

    it('genel orana yakın kaynak "denk" sayılır', async () => {
      fresh();
      const a = await Src.save({ name:'A' });
      const b = await Src.save({ name:'B' });
      await seedSolved(a.id, 10, 7);
      await seedSolved(b.id, 10, 7);
      expect(Src.relative(a.id).durum).toBe('dengeli');
    });

    it('“çözüme baktım” kaynağın oranını yükseltmez', async () => {
      fresh();
      const s = await Src.save({ name:'Kitap' });
      for(let i = 0; i < 10; i++) await Q.save({ sourceId:s.id, result:'bakarak' });
      expect(Src.measure(s.id).oran).toBe(0);
    });

    it('tablo en zoru üste koyar, ölçümsüzleri sona atar', async () => {
      fresh();
      const zor = await Src.save({ name:'Zor' });
      const kolay = await Src.save({ name:'Kolay' });
      const bos = await Src.save({ name:'Boş' });
      await seedSolved(kolay.id, 12, 11);
      await seedSolved(zor.id, 12, 3);

      const rows = Src.table();
      expect(rows[0].src.id).toBe(zor.id);
      expect(rows[rows.length - 1].src.id).toBe(bos.id);
    });

    it('kaynağı silinen kayıt yine de ada göre sayılır', async () => {
      fresh();
      const s = await Src.save({ name:'345' });
      await Q.save({ sourceName:'345', result:'dogru' });
      /* Kayıt sourceId taşımıyor ama sourceName eşleşiyor. */
      expect(Src.recordsOf(s.id)).toHaveLength(1);
    });

    it('merdiven uyarısı yalnız VERİ destekliyorsa çıkar', async () => {
      fresh();
      /* Kapanış zaten %0; üst seviye kaynaktan üç soru gerekiyor. */
      const ust = await Src.save({ name:'3D', level:'ust' });
      expect(Src.ladderWarning()).toBeNull();      // henüz kayıt yok
      await seedSolved(ust.id, 3, 1);
      const w = Src.ladderWarning();
      expect(!!w).toBeTruthy();
      expect(w.text).toContain('temel oturmadan');
    });

    it('temel seviye kaynaktan çözmek uyarı üretmez', async () => {
      fresh();
      const temel = await Src.save({ name:'Karekök', level:'temel' });
      await seedSolved(temel.id, 10, 5);
      expect(Src.ladderWarning()).toBeNull();
    });

    it('tohum bir kez yüklenir, silinen kaynak geri gelmez', async () => {
      fresh();
      await Src.seed();
      const n = Src.all().length;
      expect(n).toBe(R.SOURCE_SEED.length);
      await Src.remove(Src.all()[0].id);
      await Src.seed();
      /* İkinci çağrı hiçbir şey eklememeli. */
      expect(Src.all()).toHaveLength(n - 1);
    });
  });


  /* ==================== cevap karşılaştırma ====================
     İki bağımsız çözümün aynı cevaba çıkıp çıkmadığını anlamak göründüğü
     kadar basit değil. Yanlış bir "farklı cevap" kararı, öğrenciyi
     OLMAYAN bir hataya bakmaya gönderir — bu yüzden önce biçim farkları
     elenir, emin olunamayan yerde FARKLI denir. */

  describe('Çözücü — cevap karşılaştırma', () => {
    it('şık harfi biçimden bağımsız eşleşir', () => {
      expect(Q.sameAnswer('C', 'c)')).toBeTruthy();
      expect(Q.sameAnswer('C şıkkı', 'cevap: C')).toBeTruthy();
      expect(Q.sameAnswer('A', 'B')).toBeFalsy();
    });

    it('sayı kümesi sırasız eşleşir', () => {
      expect(Q.sameAnswer('2 ve 3', '3, 2')).toBeTruthy();
      expect(Q.sameAnswer('12', '12,0')).toBeTruthy();
      expect(Q.sameAnswer('1.500', '1500')).toBeTruthy();
      expect(Q.sameAnswer('2 ve 3', '2 ve 4')).toBeFalsy();
      /* Sayı adedi farklıysa aynı değildir. */
      expect(Q.sameAnswer('2 ve 3', '2')).toBeFalsy();
    });

    it('düz metin aynıysa eşleşir, Türkçe harf farkı bozmaz', () => {
      expect(Q.sameAnswer('artar', 'ARTAR')).toBeTruthy();
      expect(Q.sameAnswer('İkisi de', 'ikisi de')).toBeTruthy();
      expect(Q.sameAnswer('artar', 'azalır')).toBeFalsy();
    });

    it('biri şık harfi diğeri değilse karşılaştırılamaz', () => {
      /* "C" ile "5" aynı olabilir de olmayabilir de; emin olamadığımız
         yerde FARKLI demek doğru olandır. */
      expect(Q.sameAnswer('C', '5')).toBeFalsy();
    });

    it('boş cevap hiçbir şeyle eşleşmez', () => {
      expect(Q.sameAnswer('', 'C')).toBeFalsy();
      expect(Q.sameAnswer('C', '')).toBeFalsy();
      expect(Q.sameAnswer(null, null)).toBeFalsy();
    });

    it('şık harfi ve sayı çıkarıcıları tek başına da doğru çalışır', () => {
      expect(Q.optionLetter('D şıkkı')).toBe('d');
      expect(Q.optionLetter('cevap 12')).toBeNull();
      expect(Q.numbersOf('x = -3,5 ve y = 1.200')).toEqual([-3.5, 1200]);
    });
  });

  /* ==================== bağımsız denetim ====================
     "Modele kendi çözümünü kontrol ettir" işe yaramaz: aynı modele aynı
     bağlamda sorunca kendi hatasını onaylar. Soru SIFIRDAN, ilk çözüm
     GÖRÜLMEDEN, tercihen BAŞKA bir modele yeniden çözdürülür. */

  describe('Çözücü — denetim turu', () => {
    function withModels(fn, plan){
      const realComplete = R.LLM.complete, realReady = R.LLM.ready;
      const seen = [];
      R.LLM.ready = () => true;
      R.LLM.complete = async (chain, req) => {
        seen.push({ system:req.system, chain });
        return plan(req, seen.length);
      };
      return Promise.resolve(fn(seen)).finally(() => {
        R.LLM.complete = realComplete; R.LLM.ready = realReady;
      });
    }

    it('aynı cevaba çıkarsa "aynı" döner ve hakem hiç çağrılmaz', async () => {
      await withModels(async seen => {
        const r = await Q.verifyRun({ question:'x?', answerA:'2 ve 3', solutionA:'…' });
        expect(r.durum).toBe('ayni');
        /* Hakem turu boşuna kota harcamamalı. */
        expect(seen).toHaveLength(1);
      }, () => ({ text:'ok\n{"cevap":"3, 2","emin":true}', model:'B', provider:'s', ms:1 }));
    });

    it('cevaplar ayrılırsa hakem çağrılır ve hatanın yeri gösterilir', async () => {
      await withModels(async seen => {
        const r = await Q.verifyRun({ question:'x?', answerA:'2', solutionA:'birinci çözüm' });
        expect(r.durum).toBe('ayrildi');
        expect(r.second.answer).toBe('5');
        expect(r.judge.winner).toBe('B');
        expect(r.judge.answer).toBe('5');
        expect(r.judge.step).toContain('Adım 2');
        expect(seen).toHaveLength(2);
        /* Hakem birinci çözümü GÖRÜR (karşılaştırabilmesi için), denetim
           turu GÖRMEZ (bağımsız olması için). */
        expect(seen[0].system.indexOf('KENDİ BAŞINA çöz') > 0).toBeTruthy();
      }, (req, n) => n === 1
        ? { text:'x\n{"cevap":"5","emin":true}', model:'B', provider:'s', ms:1 }
        : { text:'İkinci doğru.\n{"dogru":"B","dogruCevap":"5","hataAdimi":"Adım 2 işaret hatası"}',
            model:'C', provider:'s', ms:1 });
    });

    it('denetim cevap üretemezse "emin değil" denir — yanlış demez', async () => {
      await withModels(async () => {
        const r = await Q.verifyRun({ question:'x?', answerA:'2', solutionA:'…' });
        /* Cevapsız bir denetim, çözümün yanlış olduğu anlamına GELMEZ. */
        expect(r.durum).toBe('emin_degil');
      }, () => ({ text:'bilemedim', model:'B', provider:'s', ms:1 }));
    });

    it('denetim çağrısı düşerse toplam sonuç "yapılamadı" olur', async () => {
      const realComplete = R.LLM.complete, realReady = R.LLM.ready;
      R.LLM.ready = () => true;
      R.LLM.complete = async () => { throw Object.assign(new Error('x'), { code:'rate_limited' }); };
      try{
        const r = await Q.verifyRun({ question:'x?', answerA:'2', solutionA:'…' });
        expect(r.durum).toBe('yapilamadi');
        expect(r.neden).toBe('rate_limited');
      }finally{
        R.LLM.complete = realComplete; R.LLM.ready = realReady;
      }
    });

    it('hakem düşse bile ayrılık bildirilir', async () => {
      await withModels(async () => {
        const r = await Q.verifyRun({ question:'x?', answerA:'2', solutionA:'…' });
        expect(r.durum).toBe('ayrildi');
        expect(r.judge).toBeNull();
      }, (req, n) => {
        if(n === 1) return { text:'x\n{"cevap":"5","emin":true}', model:'B', provider:'s', ms:1 };
        throw Object.assign(new Error('x'), { code:'server' });
      });
    });

    it('denetim bütçesi çözüm bütçesinden küçüktür', () => {
      /* Ücretsiz katmanda her çağrı bir günlük hak; denetim ucuz olmalı. */
      const realComplete = R.LLM.complete, realReady = R.LLM.ready;
      R.LLM.ready = () => true;
      let budget = null;
      R.LLM.complete = async (chain, req) => {
        budget = req.maxTokens;
        return { text:'{"cevap":"1","emin":true}', model:'B', provider:'s', ms:1 };
      };
      return Q.check({ question:'x' }).then(() => {
        expect(budget < R.SOLVER.budget).toBeTruthy();
      }).finally(() => { R.LLM.complete = realComplete; R.LLM.ready = realReady; });
    });
  });

  /* ==================== sohbet ==================== */

  describe('Çözücü — çözümden sonra sohbet', () => {
    it('geçmiş her turda modele geri verilir', async () => {
      const realComplete = R.LLM.complete, realReady = R.LLM.ready;
      R.LLM.ready = () => true;
      let sent = null;
      R.LLM.complete = async (chain, req) => { sent = req; return { text:'cevap', model:'A', provider:'s', ms:1 }; };
      try{
        await Q.talk({
          solution:'çözüm metni',
          follow:'peki ya ikinci adım?',
          thread:[{ role:'user', text:'ilk adım?' }, { role:'agent', text:'şöyle' }],
        });
        /* Geçmiş + yeni soru: konuşma devam ediyor, tek seferlik değil. */
        expect(sent.messages).toHaveLength(3);
        expect(sent.messages[0].role).toBe('user');
        expect(sent.messages[1].role).toBe('assistant');
        expect(sent.messages[2].text).toBe('peki ya ikinci adım?');
        expect(sent.system).toContain('BAŞKA bir');
      }finally{
        R.LLM.complete = realComplete; R.LLM.ready = realReady;
      }
    });

    it('ilk turda çözüm bağlama konur', async () => {
      const realComplete = R.LLM.complete, realReady = R.LLM.ready;
      R.LLM.ready = () => true;
      let sent = null;
      R.LLM.complete = async (chain, req) => { sent = req; return { text:'x', model:'A', provider:'s', ms:1 }; };
      try{
        await Q.talk({ solution:'ÇÖZÜM BURADA', follow:'anlamadım' });
        expect(sent.messages).toHaveLength(1);
        expect(sent.messages[0].text).toContain('ÇÖZÜM BURADA');
      }finally{
        R.LLM.complete = realComplete; R.LLM.ready = realReady;
      }
    });

    it('boş soru gönderilmez', async () => {
      const realReady = R.LLM.ready;
      R.LLM.ready = () => true;
      let code = null;
      try{ await Q.talk({ solution:'x', follow:'  ' }); }catch(e){ code = e.code; }
      R.LLM.ready = realReady;
      expect(code).toBe('empty');
    });
  });

  /* ==================== öğretmen üslubu ==================== */

  describe('Çözücü — öğretmen üslubu', () => {
    it('istem adımın biçimini dayatır', () => {
      /* "Adım adım yaz" demek yetmedi: model üç satır işlem döküp
         "adım adım yazdım" sayıyordu. Öğretmen ile çözüm makinesi
         arasındaki fark adım sayısı değil, her adımda NEDEN'dir. */
      const sys = R.SOLVER.system;
      expect(sys).toContain('NEDEN');
      expect(sys).toContain('Kontrol');
      expect(sys).toContain('Tuzak');
      expect(sys).toContain('Nereden başlanır');
      expect(sys).toContain('Buradan görülüyor ki');   // yasaklanan kalıp
    });

    it('denetim istemi ilk çözümü göstermez', () => {
      const sys = R.SOLVER.checkSystem;
      expect(sys).toContain('Başka birinin çözümünü görmüyorsun');
    });

    it('hakem istemi hatanın yerini ister', () => {
      const p = R.SOLVER.arbiter({ question:'s', solutionA:'a', answerA:'1', answerB:'2' });
      expect(p).toContain('hangi adımda');
      expect(p).toContain('hataAdimi');
    });
  });

})();
