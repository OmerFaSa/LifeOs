/* KONUNUN İÇİNDE «ANLAMADIM / SORU SOR».

   Kullanıcı (2026-10-09): «kullanıcının o konu ile alakalı her şeyi
   uygulamanın içinde öğrenmesini istiyorum» → «Konunun içinde Anlamadım /
   soru sor». Konu ekranında öğrenci anlamadığı yeri yazar (ya da
   anlatımdan yapıştırır); koçun modeli o konunun bağlamında açıklar.

   Sözler:
     1. MODEL YALNIZ ANLATIR. Hiçbir sayıya, plana, konu durumuna ya da
        kayda dokunmaz (AGENTS §1.1). Cevap «doğrulanmadı» etiketiyle
        gösterilir; konuşma yalnız bu açılışta durur.
     2. MODEL YOKSA SÖYLENİR. Zincir boşsa hiçbir şey uydurulmaz; ekran
        Ofis ayarlarına yönlendirir (ücretsiz sağlayıcılar orada).
     3. BAĞLAM YALNIZ KONUDUR: ders, bölüm, konu adı, uygulamanın kendi
        kısa özeti (data/ozetler.js; anlatım aynı dili konuşsun) ve
        öğrencinin yapıştırdığı parça (Öğren › Sorular'dan «Koça sor» o
        sorunun metnini ve çözümünü verir). Ad, puan, sıralama gibi kişisel
        veri gitmez.
     4. KART KULLANICININ. «Karta çevir» soruyu ön yüze, cevabın başını
        arka yüze yazar (kaynak «konusor»); kart düzeltilir ya da silinir.
   Çağrı soru çözümündeki koç zinciriyle yapılır (core/solver.js talk). */

window.R = window.R || {};

R.KonuSor = (function(){
  const SISTEM = 'Sen bir YKS öğretmenisin. Öğrenci aşağıdaki konuda anlamadığı yeri soruyor.\n'
    + '- Yalnız sorulan yeri açıkla; somut bir sayı ya da kısa bir örnekle göster.\n'
    + '- Öğrenci aynı yeri yeniden sorarsa aynı anlatımı tekrarlama: başka bir yoldan anlat.\n'
    + '- Emin olmadığın bilgiyi söyle; formül, tarih ya da tanım uydurma.\n'
    + '- Puan, sıralama ya da sınav sonucu tahmini ve garantisi verme.\n'
    + '- Konu dışına çıkma.\n'
    + '\nYAZIM: Türkçe, ikinci tekil şahıs, düz metin, en fazla 8 cümle.';
  const BUTCE = 700;
  const GECMIS = 6;
  const konusma = {};          // 'ders/konu' → [{ rol, metin }] — yalnız bu açılış

  function bul(subjectId, topicId){
    const subject = (R.SUBJECTS || []).find(s => s.id === subjectId);
    const topic = subject ? subject.topics.find(t => t.id === topicId) : null;
    return { subject, topic };
  }
  function zincir(){ return R.Office && R.Office.chainFor ? R.Office.chainFor('koc') : []; }
  function hazir(){ return zincir().length > 0; }
  function baglam(subject, topic, parca){
    const oz = (R.KONU_OZET || {})[topic.id];
    const ozet = oz ? oz.ana.map(m => '- ' + m).join('\n').slice(0, 900) : '';
    return 'Ders: ' + subject.name + (topic.group ? '\nBölüm: ' + topic.group : '') + '\nKonu: ' + topic.name
      + (ozet ? '\nUygulamadaki kısa özet (bununla aynı dili kullan):\n' + ozet : '')
      + (parca ? '\nAnlamadığım parça:\n«' + String(parca).slice(0, 1200) + '»' : '');
  }

  /* o: { parca?, signal?, onText? } → { ok, metin, neden? } */
  async function sor(subjectId, topicId, soru, o){
    o = o || {};
    const { subject, topic } = bul(subjectId, topicId);
    if(!topic) return { ok:false, neden:'konu', metin:'Konu bulunamadı.' };
    const q = String(soru || '').trim();
    if(q.length < 3) return { ok:false, neden:'bos', metin:'Neyi anlamadığını bir cümleyle yaz.' };
    const chain = zincir();
    if(!chain.length){
      return { ok:false, neden:'model', metin:'Model bağlı değil. Ofis › Ofis ayarlarından ücretsiz bir sağlayıcı '
        + 'bağlarsan burada anlatır.' };
    }
    const anahtar = subjectId + '/' + topicId;
    const gecmis = (konusma[anahtar] || []).slice(-GECMIS);
    const ilk = baglam(subject, topic, o.parca) + '\n\nSorum: ' + (gecmis.length ? '(aşağıdaki konuşma bunun üzerine)' : q);
    const messages = [{ role:'user', text:ilk }]
      .concat(gecmis.map(m => ({ role:m.rol, text:m.metin })), gecmis.length ? [{ role:'user', text:q }] : []);
    try{
      const res = await R.LLM.complete(chain, { system:SISTEM, messages, maxTokens:BUTCE, temperature:0.3,
        signal:o.signal, onText:o.onText });
      const metin = String((res && res.text) || '').trim();
      if(!metin) return { ok:false, neden:'bos-cevap', metin:'Model boş cevap verdi; yeniden sor.' };
      konusma[anahtar] = gecmis.concat([{ rol:'user', metin:q }, { rol:'assistant', metin }]);
      return { ok:true, metin, model:res.model };
    }catch(err){
      const kod = err && err.code;
      if(kod === 'cancelled') return { ok:false, neden:'iptal', metin:'Vazgeçildi.' };
      return { ok:false, neden:'hata', metin:R.LLM.errorText ? R.LLM.errorText(kod) : 'Model şu an yanıt veremedi.' };
    }
  }

  function konusmaOf(subjectId, topicId){ return (konusma[subjectId + '/' + topicId] || []).slice(); }
  function unut(subjectId, topicId){ delete konusma[subjectId + '/' + topicId]; }

  /* Söz 4: i, konuşmadaki cevabın sırası (0'dan). */
  async function kartYap(subjectId, topicId, i){
    const { topic } = bul(subjectId, topicId);
    const l = konusmaOf(subjectId, topicId);
    const cevap = l[2 * i + 1], soru = l[2 * i];
    if(!topic || !cevap || !soru) return null;
    const card = R.Model.newCard({ front:soru.metin.slice(0, 200), back:cevap.metin.slice(0, 300),
      subjectId, topic:topic.name, source:'konusor' });
    await R.Model.saveCard(card);
    return card;
  }

  return { sor, hazir, konusmaOf, unut, kartYap, baglam, SISTEM };
})();
