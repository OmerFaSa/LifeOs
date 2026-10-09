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

  /* ---------- metin işaretleri ----------
     Anlatım ve sorularda üç işaret var: **kalın**, x^{2} üst simge, H_{2}O
     alt simge. İç içe gelebilir (5^{log_{5} 7}): süslü parantez derinlikle
     eşlenir, ilk «}» ile değil. Tek ayrıştırıcı iki çıktı verir: ekrana
     HTML (yazı önce kaçırılır) ve karta, yanlış defterine, koça giden düz
     metin (x², H₂O, Na⁺). Unicode karşılığı olmayan simge düz metinde
     şapkayla kalır: 5^(log₅ 7). Kapanmayan işaret yazı olarak kalır. */
  function esBul(s, ac){
    let d = 0;
    for(let k = ac; k < s.length; k++){
      if(s[k] === '{') d++;
      else if(s[k] === '}' && --d === 0) return k;
    }
    return -1;
  }
  function ayristir(s){
    s = String(s == null ? '' : s);
    const l = [];
    let yazi = '', i = 0;
    const it = () => { if(yazi){ l.push({ t:'yazi', v:yazi }); yazi = ''; } };
    while(i < s.length){
      const c = s[i];
      if((c === '^' || c === '_') && s[i + 1] === '{'){
        const j = esBul(s, i + 1);
        if(j > 0){ it(); l.push({ t:c === '^' ? 'ust' : 'alt', c:ayristir(s.slice(i + 2, j)) }); i = j + 1; continue; }
      }
      if(c === '*' && s[i + 1] === '*'){
        const j = s.indexOf('**', i + 2);
        if(j > i + 2){ it(); l.push({ t:'kalin', c:ayristir(s.slice(i + 2, j)) }); i = j + 2; continue; }
      }
      yazi += c; i++;
    }
    it();
    return l;
  }
  const ETIKET = { kalin:'b', ust:'sup', alt:'sub' };
  function htmlOf(l){
    return l.map(d => d.t === 'yazi' ? R.U.esc(d.v) : '<' + ETIKET[d.t] + '>' + htmlOf(d.c) + '</' + ETIKET[d.t] + '>').join('');
  }
  function metinHtml(s){ return htmlOf(ayristir(s)); }
  const UST = { 0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹',
    '+':'⁺', '-':'⁻', '−':'⁻', '=':'⁼', '(':'⁽', ')':'⁾', n:'ⁿ' };
  const ALT = { 0:'₀', 1:'₁', 2:'₂', 3:'₃', 4:'₄', 5:'₅', 6:'₆', 7:'₇', 8:'₈', 9:'₉',
    '+':'₊', '-':'₋', '−':'₋', '=':'₌', '(':'₍', ')':'₎' };
  function simge(ic, tablo, isaret){
    const ch = Array.from(ic);
    if(ch.length && ch.every(x => tablo[x])) return ch.map(x => tablo[x]).join('');
    return isaret + (ch.length === 1 ? ic : '(' + ic + ')');
  }
  function duzOf(l){
    return l.map(d => d.t === 'yazi' ? d.v : d.t === 'kalin' ? duzOf(d.c)
      : simge(duzOf(d.c), d.t === 'ust' ? UST : ALT, d.t === 'ust' ? '^' : '_')).join('');
  }
  function duzMetin(s){ return duzOf(ayristir(s)); }

  function anlatim(topicId){ return (R.KONU_ANLATIM || {})[topicId] || null; }
  /* Derinleştirme (data/derin-*.js): kazanımlar, ön koşullar, seviyeli
     çözümlü örnekler, sınav kalıpları, sık hatalar ve orta/ileri sorular. */
  function derin(topicId){ return (R.KONU_DERIN || {})[topicId] || null; }
  function tabanSorular(topicId){ const a = anlatim(topicId); return a && Array.isArray(a.sorular) ? a.sorular : []; }
  /* Konunun bütün soruları: önce temel sorular, ardından derin sorular.
     Derin sorular SONA eklenir: kayıtlı cevaplar sıra numarasıyla
     tutulur (topicState.ornek, karma test 'tm-05#2'); eski sıralar kaymaz. */
  function sorular(topicId){
    const d = derin(topicId);
    const ek = d && Array.isArray(d.sorular) ? d.sorular : [];
    const t = tabanSorular(topicId);
    return ek.length ? t.concat(ek) : t;
  }
  const SEVIYE = { temel:'Temel', orta:'Orta', ileri:'İleri' };
  /* Sorunun seviyesi yazarın değerlendirmesidir (ölçüm değil): temel
     sorular «temel», derin sorular kendi seviyesini taşır. */
  function seviye(topicId, i){
    const n = tabanSorular(topicId).length;
    if(i < n) return 'temel';
    const q = sorular(topicId)[i];
    return q && SEVIYE[q.seviye] ? q.seviye : 'orta';
  }

  /* ---------- örnek soru cevapları (söz 3) ---------- */
  function cevaplar(subjectId, topicId){
    const o = R.Model.topicState(subjectId, topicId).ornek;
    return o && typeof o === 'object' ? o : {};
  }
  /* i: sorunun sırası, harf: A–E, ip: ipucu açıldıktan sonra mı. İlk
     cevap kalır. → { ok, dogru?, neden? } */
  async function cevapla(subjectId, topicId, i, harf, ip){
    const l = sorular(topicId), q = l[i];
    harf = String(harf || '').toUpperCase();
    if(!q || HARFLER.indexOf(harf) < 0) return { ok:false, neden:'gecersiz' };
    const eski = cevaplar(subjectId, topicId);
    if(eski[i]) return { ok:false, neden:'kilitli', dogru:eski[i].d };
    const kayit = { h:harf, d:harf === q.dogru, at:new Date().toISOString() };
    if(ip) kayit.ip = true;
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

  /* Örnek sorudan tekrar kartı: ön yüz düz metin (kart ekranı işaret
     okumaz). Paragraflı soruda kök kesilmez; uzun paragraf kısalır. Şıklar
     ön yüzde kalır: «hangisi» sorusu şıksız sorulamaz. */
  function kisalt(s, n){
    s = String(s || '');
    if(s.length <= n) return s;
    const k = s.lastIndexOf(' ', n - 1);
    return s.slice(0, k > n * 0.6 ? k : n - 1).replace(/[\s,;:]+$/, '') + '…';
  }
  function kartYuzu(topicId, i){
    const q = sorular(topicId)[i];
    if(!q) return null;
    const satir = duzMetin(q.soru).split('\n');
    const kok = satir.pop();
    const parca = satir.join(' ');
    const sec = (q.sec || []).map((m, k) => HARFLER[k] + ') ' + kisalt(duzMetin(m), 80)).join('  ');
    const dogru = (q.sec || [])[HARFLER.indexOf(q.dogru)];
    return {
      front:(parca ? kisalt(parca, 260) + ' ' : '') + kok + (sec ? '  ' + sec : ''),
      back:kisalt(q.dogru + ') ' + duzMetin(dogru) + ' — ' + [].concat(q.cozum || []).map(duzMetin).join(' '), 400),
    };
  }

  /* Yanlış defteri kaydı (söz 4): kök neden ve etiket boş, kullanıcı
     yazar (testkitabi.js ile aynı şema). Aynı soru iki kez eklenmez. */
  function deftere(subjectId, topicId, i){
    return (R.S.errors || []).find(e => e.kaynak && e.kaynak.tur === 'ogren'
      && e.subjectId === subjectId && e.topicId === topicId && e.kaynak.i === i) || null;
  }
  /* senin: karma testte ya da yeniden çözümde verilen harf (core/ogrentest.js);
     verilmezse konunun ilk cevabı. */
  async function yanlisaEkle(subjectId, topicId, i, senin){
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
      soru:kisalt(duzMetin(q.soru), 600), senin:senin || (c ? c.h : null), anahtar:q.dogru,
      kaynak:{ tur:'ogren', i },
    };
    await R.Model.saveError(err);
    return err;
  }

  return { HARFLER, SEVIYE, konular, bul, konuyuBul, secili, sonAcilan, yukle, sec, komsu, metinHtml, duzMetin, kartYuzu,
    derin, tabanSorular, seviye,
    anlatim, sorular, cevaplar, cevapla, bak, sifirla, skor, durum, dersOzeti, sirada, deftere, yanlisaEkle };
})();
