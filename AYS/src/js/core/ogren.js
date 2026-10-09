/* ÖĞREN — konuyu uygulamanın içinde, teker teker öğrenmek.

   Kullanıcı (2026-10-09): «konu öğrenmek başlığı altında sol tarafa bölüm
   aç; ders notları, örnek sorular, daha detaylı anlatım olsun, koçla da
   orada iletişim olsun; konuları teker teker uygulamanın içinde öğreneyim».
   Sol kenarda «Öğren» çekmecesi: Konular · Anlatım · Sorular · Koç · Ders
   notları. Bu dosya dört ekranın ortak çekirdeğidir; ekranlar
   screens/ogren.js'te.

   Sözler:
     1. İÇERİK UYGULAMANIN İÇİNDE. Anlatım ve örnek sorular
        data/anlatim-*.js'te durur (R.KONU_ANLATIM); internetsiz ve
        modelsiz okunur. Elle yazıldı, doğrulanmadı: ekran bunu yazar.
     2. SEÇİLİ KONU TEK. Dört bölüm aynı konuya bakar; son açılan konu
        cihazda hatırlanır (meta/ogren) ki «Kaldığın yer» dönsün. Sıra
        R.SUBJECTS sırasıdır; «sonraki» dersin sonunda öbür derse geçer.
     3. CEVAP ÖLÇÜMDÜR, KARAR DEĞİLDİR. Örnek soruya verilen İLK cevap
        konunun durumuna yazılır (topicState.ornek) ve «ölçüldü» etiketiyle
        gösterilir. Cevap kilitlenir: çözümü gördükten sonra değiştirilen
        cevap ölçüm olmaz; «Baştan çöz» hepsini birlikte siler. Hiçbir plan,
        kapanış, risk ya da öğrenme yolu eşiği bu cevaplara bakmaz (yolun
        «Soru çöz» adımı bloklardan ölçülür; dört örnek soru yirmi soruluk
        eşiği şişirmesin).
     4. YANLIŞ KULLANICININ. Yanlış cevap kendiliğinden yanlış defterine
        yazılmaz; «Yanlış defterine ekle» kaydı kullanıcının eliyle açar. */

window.R = window.R || {};

R.Ogren = (function(){
  const STORE = 'meta/ogren';
  const HARFLER = ['A', 'B', 'C', 'D', 'E'];
  let son = null;            // { ders, konu, at } — meta/ogren

  /* Bütün konular, R.SUBJECTS sırasıyla tek dizi. */
  function konular(){
    const l = [];
    (R.SUBJECTS || []).forEach(s => s.topics.forEach(t => l.push({ subject:s, topic:t })));
    return l;
  }
  function bul(subjectId, topicId){
    const subject = (R.SUBJECTS || []).find(s => s.id === subjectId) || null;
    const topic = subject ? subject.topics.find(t => t.id === topicId) || null : null;
    return { subject, topic };
  }
  /* Konu kimliği bütün derslerde tektir (tm-04, ab-11…). */
  function konuyuBul(topicId){
    return konular().find(x => x.topic.id === topicId) || { subject:null, topic:null };
  }

  /* Seçili konu: ekranın seçimi, yoksa son açılan, yoksa ilk konu. */
  function secili(){
    const ui = (R.S && R.S.ui) || {};
    let x = bul(ui.ogrenDers, ui.ogrenKonu);
    if(!x.topic && son) x = bul(son.ders, son.konu);
    if(!x.topic){ const ilk = konular()[0]; x = ilk ? { subject:ilk.subject, topic:ilk.topic } : x; }
    return x;
  }
  function sonAcilan(){
    if(!son) return null;
    const x = bul(son.ders, son.konu);
    return x.topic ? Object.assign(x, { at:son.at }) : null;
  }

  async function yukle(){
    let doc = null;
    try{ doc = await R.Store.get(STORE); }catch(e){ doc = null; }
    son = doc && typeof doc.ders === 'string' && typeof doc.konu === 'string' ? doc : null;
    return son;
  }

  /* Konuyu seçer; değiştiyse son açılan olarak yazar. */
  async function sec(subjectId, topicId){
    const x = bul(subjectId, topicId);
    if(!x.topic) return null;
    const ui = R.S.ui;
    if(ui.ogrenDers !== x.subject.id || ui.ogrenKonu !== x.topic.id){
      /* Konu değişince o konuya ait geçici seçimler sıfırlanır. */
      ui.ogrenSoru = 0; ui.kocParca = null; ui.kocTaslak = '';
    }
    ui.ogrenDers = x.subject.id;
    ui.ogrenKonu = x.topic.id;
    if(!son || son.ders !== x.subject.id || son.konu !== x.topic.id){
      son = { ders:x.subject.id, konu:x.topic.id, at:new Date().toISOString() };
      try{ await R.Store.set(STORE, son); }catch(e){ /* hatırlanmasa da seçim çalışır */ }
    }
    return x;
  }

  /* Önceki (-1) / sonraki (+1) konu; uçta null. */
  function komsu(subjectId, topicId, yon){
    const l = konular();
    const i = l.findIndex(x => x.subject.id === subjectId && x.topic.id === topicId);
    const k = i < 0 ? null : l[i + (yon < 0 ? -1 : 1)];
    return k || null;
  }

  function anlatim(topicId){ return (R.KONU_ANLATIM || {})[topicId] || null; }
  function sorular(topicId){ const a = anlatim(topicId); return a && Array.isArray(a.sorular) ? a.sorular : []; }

  /* ---------- örnek soru cevapları (söz 3) ---------- */
  function cevaplar(subjectId, topicId){
    const o = R.Model.topicState(subjectId, topicId).ornek;
    return o && typeof o === 'object' ? o : {};
  }
  /* i: sorunun sırası, harf: A–E. İlk cevap kalır. → { ok, dogru?, neden? } */
  async function cevapla(subjectId, topicId, i, harf){
    const l = sorular(topicId), q = l[i];
    harf = String(harf || '').toUpperCase();
    if(!q || HARFLER.indexOf(harf) < 0) return { ok:false, neden:'gecersiz' };
    const eski = cevaplar(subjectId, topicId);
    if(eski[i]) return { ok:false, neden:'kilitli', dogru:eski[i].d };
    const kayit = { h:harf, d:harf === q.dogru, at:new Date().toISOString() };
    await R.Model.setTopicState(subjectId, topicId, { ornek:Object.assign({}, eski, { [i]:kayit }) });
    return { ok:true, dogru:kayit.d };
  }
  /* Cevaplamadan «Çözümü göster»: soru «çözüme bakıldı» diye kilitlenir;
     sonra verilen cevap ölçüm olmazdı (söz 3). */
  async function bak(subjectId, topicId, i){
    const q = sorular(topicId)[i];
    if(!q) return { ok:false, neden:'gecersiz' };
    const eski = cevaplar(subjectId, topicId);
    if(eski[i]) return { ok:false, neden:'kilitli' };
    await R.Model.setTopicState(subjectId, topicId, {
      ornek:Object.assign({}, eski, { [i]:{ h:null, d:false, bak:true, at:new Date().toISOString() } }) });
    return { ok:true };
  }
  async function sifirla(subjectId, topicId){
    await R.Model.setTopicState(subjectId, topicId, { ornek:{} });
  }
  /* { toplam, cevaplanan, dogru } — yalnız bugünkü sorulara bakılır. */
  function skor(subjectId, topicId){
    const l = sorular(topicId), c = cevaplar(subjectId, topicId);
    let cevaplanan = 0, dogru = 0;
    l.forEach((q, i) => { if(c[i]){ cevaplanan++; if(c[i].h === q.dogru) dogru++; } });
    return { toplam:l.length, cevaplanan, dogru };
  }

  /* Konunun Öğren'deki durumu: anlatım var mı, okundu mu, sorular, yol. */
  function durum(subjectId, topicId){
    const st = R.Model.topicState(subjectId, topicId);
    const a = anlatim(topicId);
    return {
      anlatim:!!a, ozet:!!(R.KONU_OZET || {})[topicId],
      okundu:!!st.okunduAt, skor:skor(subjectId, topicId),
      yol:R.OgrenYolu ? R.OgrenYolu.ozet(subjectId, topicId) : null,
    };
  }

  /* Bir dersin ilerlemesi: kaç konu okundu, kaç örnek soru doğru. */
  function dersOzeti(subjectId){
    const s = (R.SUBJECTS || []).find(x => x.id === subjectId);
    if(!s) return null;
    let okunan = 0, soru = 0, dogru = 0, anlatimli = 0;
    s.topics.forEach(t => {
      const d = durum(s.id, t.id);
      if(d.okundu) okunan++;
      if(d.anlatim) anlatimli++;
      soru += d.skor.cevaplanan; dogru += d.skor.dogru;
    });
    return { konu:s.topics.length, okunan, anlatimli, soru, dogru };
  }

  /* Kaldığın yerden sıradaki iş: okunmadıysa anlatım, sorular
     bitmediyse sorular, ikisi de tamamsa sonraki konu. Kodla seçilir. */
  function sirada(subjectId, topicId){
    const d = durum(subjectId, topicId);
    if(!d.okundu) return { route:'anlatim', ad:'Anlatımı oku' };
    if(d.skor.cevaplanan < d.skor.toplam) return { route:'sorular', ad:'Örnek soruları çöz' };
    const k = komsu(subjectId, topicId, 1);
    return k ? { route:'anlatim', ad:'Sonraki konu: ' + k.topic.name, sonraki:k } : null;
  }

  /* Yanlış defteri kaydı (söz 4): kök neden ve etiket boş, kullanıcı
     yazar (testkitabi.js ile aynı şema). Aynı soru iki kez eklenmez. */
  function deftere(subjectId, topicId, i){
    return (R.S.errors || []).find(e => e.kaynak && e.kaynak.tur === 'ogren'
      && e.subjectId === subjectId && e.topicId === topicId && e.kaynak.i === i) || null;
  }
  async function yanlisaEkle(subjectId, topicId, i){
    const { subject, topic } = bul(subjectId, topicId);
    const q = sorular(topicId)[i];
    const c = cevaplar(subjectId, topicId)[i];
    if(!subject || !topic || !q) return null;
    const var_ = deftere(subjectId, topicId, i);
    if(var_) return var_;
    const err = {
      id:R.U.uid('r'), createdAt:new Date().toISOString(), closedAt:null, repairDoneAt:null,
      examId:null, examDate:R.U.todayISO(), publisher:'Öğren',
      testName:('Örnek soru · ' + topic.name).slice(0, 160), questionNo:String(i + 1),
      status:'Yanlış', tag:null, seconds:null, rootCause:'', principle:'', similar:'',
      recipe:'', topicRef:'', subjectId, topicId, topic:topic.name,
      soru:String(q.soru).slice(0, 600), senin:c ? c.h : null, anahtar:q.dogru,
      kaynak:{ tur:'ogren', i },
    };
    await R.Model.saveError(err);
    return err;
  }

  return { HARFLER, konular, bul, konuyuBul, secili, sonAcilan, yukle, sec, komsu,
    anlatim, sorular, cevaplar, cevapla, bak, sifirla, skor, durum, dersOzeti, sirada, deftere, yanlisaEkle };
})();
