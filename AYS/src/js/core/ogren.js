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
        yazılmaz; «Yanlış defterine ekle» kaydı kullanıcının eliyle açar.
     5. YENİLENEN SORU ESKİ CEVABI TAŞIMAZ. Cevaplar sıra numarasıyla
        tutulur; bir soru yerinde yeniden yazılırsa içerik ona
        `yenilendi` (ISO zaman) yazar. O andan önce verilmiş cevap, yanlış
        defteri kaydı ya da test denemesi başka bir soruya aittir: ölçüm
        sayılmaz, silinmez de (gecerli()). */

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
  /* Söz 5: `at` anında verilen cevap bugünkü soruya mı ait? */
  function gecerli(q, at){ return !q || !q.yenilendi || !at || String(at) >= String(q.yenilendi); }
  /* Derinleştirme (data/derin-*.js): kazanımlar, ön koşullar, seviyeli
     çözümlü örnekler, sınav kalıpları, sık hatalar ve orta/ileri sorular. */
  function derin(topicId){ return (R.KONU_DERIN || {})[topicId] || null; }
  /* Akıllı öğrenme, kavramlar, resmi kaynaklar ve stratejiler (data/akilli.js). */
  function kavramlar(topicId){ return (R.KONU_KAVRAMLAR || {})[topicId] || []; }
  function akilliNot(topicId){ return (R.AKILLI_NOTLAR || {})[topicId] || null; }
  function kaynaklar(topicId){ return (R.KONU_KAYNAKLAR || {})[topicId] || []; }
  function stratejiler(){ return R.OGRENME_STRATEJILERI || []; }
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
  /* Tek soru: i sayıysa konunun sırası, 'p014' gibi bir kimlikse günlük
     paragraf havuzunun sorusu (core/paragraf.js). */
  function soru(topicId, i){
    if(typeof i === 'string') return R.Paragraf ? R.Paragraf.bul(i, topicId) : null;
    return sorular(topicId)[i] || null;
  }
  const SEVIYE = { temel:'Temel', orta:'Orta', ileri:'İleri' };
  /* Sorunun seviyesi yazarın değerlendirmesidir (ölçüm değil): temel
     sorular «temel», derin sorular kendi seviyesini taşır. */
  function seviye(topicId, i){
    if(typeof i !== 'string' && i < tabanSorular(topicId).length) return 'temel';
    const q = soru(topicId, i);
    return q && SEVIYE[q.seviye] ? q.seviye : 'orta';
  }

  /* ---------- örnek soru cevapları (söz 3) ---------- */
  function cevaplar(subjectId, topicId){
    const o = R.Model.topicState(subjectId, topicId).ornek;
    if(!o || typeof o !== 'object') return {};
    const l = sorular(topicId);
    /* Yenilenmiş sorunun eski cevabı süzülür (söz 5); yeni bir cevap
       yazıldığında kayıttan da düşer. */
    if(!l.some(q => q && q.yenilendi)) return o;
    const out = {};
    Object.keys(o).forEach(i => { if(gecerli(l[i], o[i] && o[i].at)) out[i] = o[i]; });
    return out;
  }
  /* i: sorunun sırası, harf: A–E, ip: ipucu açıldıktan sonra mı, sure: geçen saniye.
     İlk cevap kalır. → { ok, dogru?, neden? } */
  async function cevapla(subjectId, topicId, i, harf, ip, sure){
    const l = sorular(topicId), q = l[i];
    harf = String(harf || '').toUpperCase();
    if(!q || HARFLER.indexOf(harf) < 0) return { ok:false, neden:'gecersiz' };
    const eski = cevaplar(subjectId, topicId);
    if(eski[i]) return { ok:false, neden:'kilitli', dogru:eski[i].d };
    const kayit = { h:harf, d:harf === q.dogru, at:new Date().toISOString() };
    if(ip) kayit.ip = true;
    if(typeof sure === 'number' && sure > 0) kayit.sure = Math.round(sure);
    await R.Model.setTopicState(subjectId, topicId, { ornek:Object.assign({}, eski, { [i]:kayit }) });
    return { ok:true, dogru:kayit.d };
  }
  /* Cevaplamadan «Çözümü göster»: soru «çözüme bakıldı» diye kilitlenir;
     sonra verilen cevap ölçüm olmazdı (söz 3). */
  async function bak(subjectId, topicId, i, sure){
    const q = sorular(topicId)[i];
    if(!q) return { ok:false, neden:'gecersiz' };
    const eski = cevaplar(subjectId, topicId);
    if(eski[i]) return { ok:false, neden:'kilitli' };
    const kayit = { h:null, d:false, bak:true, at:new Date().toISOString() };
    if(typeof sure === 'number' && sure > 0) kayit.sure = Math.round(sure);
    await R.Model.setTopicState(subjectId, topicId, {
      ornek:Object.assign({}, eski, { [i]:kayit }) });
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
  /* Şekil ve tablonun düz metni (core/sekil.js söz 3); yoksa ''. */
  function ekMetni(q){ return R.Sekil ? R.Sekil.ekMetni(q) : ''; }
  function kartYuzu(topicId, i){
    const q = soru(topicId, i);
    if(!q) return null;
    const satir = duzMetin(q.soru).split('\n');
    const kok = satir.pop();
    const parca = [satir.join(' '), ekMetni(q)].filter(Boolean).join(' ');
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
    const q = soru(topicId, i);
    return (R.S.errors || []).find(e => e.kaynak && e.kaynak.tur === 'ogren'
      && e.subjectId === subjectId && e.topicId === topicId && e.kaynak.i === i && gecerli(q, e.createdAt)) || null;
  }
  /* senin: karma testte ya da yeniden çözümde verilen harf (core/ogrentest.js);
     verilmezse konunun ilk cevabı. */
  async function yanlisaEkle(subjectId, topicId, i, senin){
    const { subject, topic } = bul(subjectId, topicId);
    const q = soru(topicId, i);
    const havuz = typeof i === 'string';
    const c = havuz ? null : cevaplar(subjectId, topicId)[i];
    if(!subject || !topic || !q) return null;
    const var_ = deftere(subjectId, topicId, i);
    if(var_) return var_;
    const err = {
      id:R.U.uid('r'), createdAt:new Date().toISOString(), closedAt:null, repairDoneAt:null,
      examId:null, examDate:R.U.todayISO(), publisher:'Öğren',
      testName:((havuz ? 'Günlük paragraf · ' : 'Örnek soru · ') + topic.name).slice(0, 160),
      questionNo:havuz ? 'P' + Number(i.slice(1)) : String(i + 1),
      status:'Yanlış', tag:null, seconds:null, rootCause:'', principle:'', similar:'',
      recipe:'', topicRef:'', subjectId, topicId, topic:topic.name,
      soru:kisalt([duzMetin(q.soru), ekMetni(q)].filter(Boolean).join(' '), 600), senin:senin || (c ? c.h : null), anahtar:q.dogru,
      kaynak:{ tur:'ogren', i },
    };
    await R.Model.saveError(err);
    return err;
  }

  /* PUAN ÖNCELİĞİ (2026-10-19, depo sahibi: «gerçekten işimize yarayacak
     fikirler»; king.js söz 34). Hangi konu çalışılırsa en çok puan
     kurtarır: konunun sınavda çıkma sıklığı (yazarın değerlendirmesi:
     yüksek 3, orta 2, düşük 1) × kayıp (deneme yanlışları + son 45 günün
     pratik yanlışlarının dörtte biri). Sayıyı KOD üretir («hesaplandı»);
     net kazancı uydurulmaz, yalnız sıra ve nedeni söylenir. Hata ya da
     pratik verisi olmayan konu listeye girmez. */
  const SIKLIK = { high:3, mid:2, low:1 };
  const SIKLIK_AD = { high:'sık çıkar', mid:'orta sıklıkta çıkar', low:'seyrek çıkar' };
  function oncelikler(n){
    const hata = {};
    ((R.S && R.S.errors) || []).forEach(e => { if(e && e.topicId) hata[e.topicId] = (hata[e.topicId] || 0) + 1; });
    return konular().map(x => {
      const p = R.Calc && R.Calc.topicPractice ? R.Calc.topicPractice(x.subject.id, x.topic.id, 45) : { solved:0, correct:0 };
      const y = hata[x.topic.id] || 0, cozulen = p.solved || 0, dogru = p.correct || 0;
      const w = SIKLIK[x.topic.freq] || 1;
      return { x, y, cozulen, dogru, w, puan:w * (y + (cozulen - dogru) / 4) };
    }).filter(o => o.puan > 0).sort((a, b) => b.puan - a.puan || b.w - a.w).slice(0, n || 5).map(o => ({
      subjectId:o.x.subject.id, topicId:o.x.topic.id, ad:o.x.topic.name, ders:o.x.subject.name,
      puan:Math.round(o.puan * 10) / 10,
      neden:[o.y ? o.y + ' deneme yanlışı' : '', o.cozulen ? '%' + Math.round(o.dogru * 100 / o.cozulen) + ' doğru (' + o.cozulen + ' soru)' : '',
        SIKLIK_AD[o.x.topic.freq] || ''].filter(Boolean).join(' · '),
    }));
  }

  /* King'in soru kartı (king.js söz 32 ve 34): bankadan soru seçer.
     Konu verilmişse adı eşleşen konunun cevaplanmamış ilk sorusu. Verilmemişse
     sıra: (1) vadesi gelen tekrar (yanlış yaptığın soru 1, 3, 7 gün sonra),
     (2) öncelikli konuların cevaplanmamış sorusu, (3) son açılan konu. Tekrar
     turu ölçüm değildir (söz 3: ilk cevap kalır); tekrar takvimi bu cihazda. */
  const TEKRAR = 'ays.king.tekrar', TEKRAR_ARALIK = [1, 3, 7];
  function tekrarlar(){ try{ const v = JSON.parse(localStorage.getItem(TEKRAR) || '{}'); return v && typeof v === 'object' ? v : {}; }catch(e){ return {}; } }
  function tekrarYaz(v){ try{ localStorage.setItem(TEKRAR, JSON.stringify(v)); }catch(e){ /* yer yok */ } }
  function gunEkle(n){ return R.U.iso(R.U.addDays(R.U.today(), n)); }
  function soruNesnesi(x, i, not){
    const q = sorular(x.topic.id)[i];
    if(!q) return null;
    return { id:x.subject.id + '|' + x.topic.id + '|' + i, konu:x.topic.name,
      soru:duzMetin(q.soru) + (ekMetni(q) ? ' ' + ekMetni(q) : ''), sec:(q.sec || []).map(m => duzMetin(m)),
      kaynak:'AYS · Öğren · ' + x.subject.name + ' (elle yazıldı, doğrulanmadı)', not:not || '' };
  }
  function ilkCevapsiz(x, yalnizCevapsiz){
    const l = sorular(x.topic.id), c = cevaplar(x.subject.id, x.topic.id);
    const i = l.findIndex((q, k) => q && !c[k]);
    if(i >= 0) return soruNesnesi(x, i, '');
    return yalnizCevapsiz ? null : soruNesnesi(x, 0, 'Bu konudaki soruların hepsini cevapladın; bu cevap ölçüme yazılmaz.');
  }
  function kingSoru(konuMetni){
    const t = String(konuMetni || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
    const adaylar = konular().filter(x => sorular(x.topic.id).length);
    if(!adaylar.length) return null;
    const ad = x => String(x.topic.name || '').toLocaleLowerCase('tr');
    if(t){
      const x = adaylar.find(k => t.includes(ad(k)) || ad(k).includes(t))
        || adaylar.find(k => t.split(' ').some(w => w.length > 4 && !/^(konu|soru|hakkında|ilgili|konusunda)/.test(w) && ad(k).includes(w)));
      return x ? ilkCevapsiz(x) : null;
    }
    const tk = tekrarlar(), bugun = R.U.todayISO();
    /* Öğren'de yanlış verilmiş ama takvime girmemiş eski cevaplar da vadesi gelmiş sayılır. */
    adaylar.forEach(x => {
      const c = cevaplar(x.subject.id, x.topic.id);
      Object.keys(c).forEach(k => {
        const id = x.subject.id + '|' + x.topic.id + '|' + k;
        if(c[k] && c[k].d === false && !tk[id] && String(c[k].at || '').slice(0, 10) < bugun) tk[id] = { n:0, sonraki:bugun, eski:true };
      });
    });
    const vade = Object.keys(tk).filter(k => tk[k] && String(tk[k].sonraki) <= bugun)
      .sort((a, b) => String(tk[a].sonraki).localeCompare(String(tk[b].sonraki)));
    for(const k of vade){
      const p = k.split('|');
      const x = adaylar.find(a => a.subject.id === p[0] && a.topic.id === p[1]);
      const s = x ? soruNesnesi(x, Number(p[2]), 'Tekrar (' + (tk[k].n + 1) + '. tur): ilk cevabın ölçümde kaldı; bu tur hafızan için.') : null;
      if(s) return s;
    }
    for(const o of oncelikler(10)){
      const x = adaylar.find(a => a.topic.id === o.topicId);
      const s = x ? ilkCevapsiz(x, true) : null;
      if(s){ s.not = 'Öncelikli konundan: ' + o.neden + '.'; return s; }
    }
    const son = sonAcilan();
    return ilkCevapsiz((son && adaylar.find(k => k.topic.id === son.topic.id)) || adaylar[0]);
  }
  /* Cevabı Öğren'in kendi kaydı yazar (cevapla; ilk cevap ölçüm). Yanlışsa
     soru yarın yeniden gelir; tekrarda doğruysa 3 ve 7 gün sonra; üç doğru
     turdan sonra takvimden çıkar. */
  async function kingCevapla(id, harf){
    const p = String(id || '').split('|'), i = Number(p[2]);
    const q = sorular(p[1])[i];
    if(!q) return null;
    const r = await cevapla(p[0], p[1], i, harf, false, 0);
    const isabet = String(harf || '').toUpperCase() === q.dogru;
    const tk = tekrarlar(), kayit = tk[id];
    let not = '';
    if(!isabet){
      tk[id] = { n:0, sonraki:gunEkle(1) };
      not = 'Yarın bu soruyu yeniden soracağım.';
    }else if(kayit){
      const n = kayit.n + 1;
      if(n >= TEKRAR_ARALIK.length){ delete tk[id]; not = 'Tekrarları tamamladın; bu soru artık sorulmayacak.'; }
      else{ tk[id] = { n, sonraki:gunEkle(TEKRAR_ARALIK[n]) }; not = TEKRAR_ARALIK[n] + ' gün sonra bir kez daha soracağım.'; }
    }else if(r && r.neden === 'kilitli'){
      not = 'Bu soruyu daha önce cevaplamıştın; ilk cevabın ölçüm olarak kaldı.';
    }
    tekrarYaz(tk);
    return { dogru:q.dogru, cozum:[].concat(q.cozum || []).map(duzMetin), not };
  }
  return { HARFLER, SEVIYE, kingSoru, kingCevapla, oncelikler, TEKRAR, konular, bul, konuyuBul, secili, sonAcilan, yukle, sec, komsu, metinHtml, duzMetin, kartYuzu,
    derin, tabanSorular, seviye, gecerli, ekMetni, soru,
    anlatim, sorular, cevaplar, cevapla, bak, sifirla, skor, durum, dersOzeti, sirada, deftere, yanlisaEkle,
    kavramlar, akilliNot, kaynaklar, stratejiler };
})();
