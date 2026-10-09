/* ÖĞREN › KARMA TEST ve YANLIŞLARIM.

   Kullanıcı (2026-10-09): «kullanıcının o konu ile alakalı her şeyi
   uygulamanın içinde öğrenmesini istiyorum» — okuyup tek tek çözmek
   yetmez; konular karışık sorulunca bilinip bilinmediği görünür, yanlış
   çözülen soru da yeniden çözülmeden kapanmaz.

   Sözler:
     1. HAVUZ UYGULAMANIN SORULARI. Karma test yalnız Öğren'in elle yazılmış
        örnek sorularından çeker (R.KONU_ANLATIM). Sınama (core/quiz.js)
        başka bir şeydir: senin kartların, yanlış defterin ve notların
        üstünden «hatırlıyor muyum» diye sorar ve cevabı sen puanlarsın.
        Burada cevap anahtarı var: doğru/yanlış kodla ölçülür.
     2. KAPSAM KODLA SEÇİLİR. Bir ders ya da bütün dersler; okuduğun
        konular ya da hepsi; 10 ya da 20 soru. Seçim rastgeledir, aynı
        konudan iki soru mümkünse ard arda gelmez; sıra test boyunca sabit.
        Havuzda 5'ten az soru varsa test kurulmaz, nedeni söylenir.
     3. TEST ÖLÇÜMDÜR, KARAR DEĞİLDİR. Her sorunun ilk cevabı kilitlenir
        (core/ogren.js söz 3). Biten test geçmişe yazılır (son 30) ve
        «ölçüldü» diye gösterilir. Konunun örnek soru kaydını
        (topicState.ornek) değiştirmez; plan, kapanış, risk ve öğrenme yolu
        bu sonuçlara bakmaz; kart açılmaz, yanlış defterine yazılmaz.
     4. YARIM TEST KALIR. Test cihazda durur (meta/ogren-test); uygulama
        kapansa da kaldığın sorudan devam eder. «Bitir» cevapsız soruları
        BOŞ sayar: boş yanlış değildir, sonuçta ayrı yazılır. «Vazgeç»
        testi siler; geçmişe hiçbir şey yazılmaz.
     5. YANLIŞLARIM = SON DENEMESİ DOĞRU OLMAYAN SORULAR. Bir sorunun
        denemeleri üç yerden gelir: konu ekranındaki ilk cevap, biten karma
        testler ve buradaki yeniden çözümler. En son deneme yanlışsa ya da
        çözüme bakıldıysa soru listededir; yeniden doğru çözülünce düşer.
        Eski ölçüm silinmez. Doğruluk her okumada bugünkü cevap anahtarıyla
        hesaplanır: düzeltilen bir soru eski «doğru»yu taşımaz. */

window.R = window.R || {};

R.OgrenTest = (function(){
  const STORE = 'meta/ogren-test';
  const BOYLAR = [10, 20];
  const EN_AZ = 5;
  const GECMIS = 30;
  let doc = bos();

  function bos(){ return { aktif:null, gecmis:[], tekrar:{} }; }
  const O = () => R.Ogren;
  const anahtar = (tid, i) => tid + '#' + i;
  const simdi = () => new Date().toISOString();

  async function yukle(){
    let d = null;
    try{ d = await R.Store.get(STORE); }catch(e){ d = null; }
    doc = bos();
    if(d && typeof d === 'object'){
      if(Array.isArray(d.gecmis)) doc.gecmis = d.gecmis.filter(t => t && Array.isArray(t.sorular)).slice(0, GECMIS);
      if(d.tekrar && typeof d.tekrar === 'object') doc.tekrar = d.tekrar;
      if(d.aktif && Array.isArray(d.aktif.sorular) && d.aktif.sorular.length) doc.aktif = d.aktif;
    }
    return doc;
  }
  async function yaz(){
    try{ await R.Store.set(STORE, doc); }catch(e){ /* yazılamasa da bu açılışta çalışır */ }
  }

  /* 'tm-05#2' → { k, subject, topic, i, q }; soru artık yoksa null. */
  function soruOf(k){
    const p = String(k || '').split('#');
    const i = Number(p[1]);
    const x = O().konuyuBul(p[0]);
    const q = x.topic ? O().sorular(x.topic.id)[i] : null;
    return q ? { k, subject:x.subject, topic:x.topic, i, q } : null;
  }
  const dogruMu = (q, v) => !!(v && !v.bak && v.h && v.h === q.dogru);

  /* ---------- havuz ve kurulum (söz 2) ---------- */

  /* kapsam: { ders:'hepsi'|subjectId, konular:'okunan'|'hepsi' } */
  function havuz(kapsam){
    const k = kapsam || {};
    const l = [];
    O().konular().forEach(x => {
      if(k.ders && k.ders !== 'hepsi' && x.subject.id !== k.ders) return;
      if(k.konular === 'okunan' && !R.Model.topicState(x.subject.id, x.topic.id).okunduAt) return;
      O().sorular(x.topic.id).forEach((q, i) => l.push({ k:anahtar(x.topic.id, i), tid:x.topic.id }));
    });
    return l;
  }
  function karistir(l){
    const a = l.slice();
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  /* Aynı konudan ard arda gelmesin (core/quiz.js interleave ile aynı ilke). */
  function serpistir(l){
    const out = [], kalan = l.slice();
    let son = null;
    while(kalan.length){
      let j = kalan.findIndex(x => x.tid !== son);
      if(j < 0) j = 0;
      const y = kalan.splice(j, 1)[0];
      son = y.tid;
      out.push(y);
    }
    return out;
  }

  async function baslat(kapsam, boy){
    const k = { ders:kapsam && kapsam.ders || 'hepsi', konular:kapsam && kapsam.konular === 'okunan' ? 'okunan' : 'hepsi' };
    const n = BOYLAR.indexOf(Number(boy)) >= 0 ? Number(boy) : BOYLAR[0];
    const h = havuz(k);
    if(h.length < EN_AZ){
      return { ok:false, neden:'az', n:h.length,
        metin:k.konular === 'okunan'
          ? (h.length ? 'Okuduğun konularda yalnız ' + h.length + ' soru var; «bütün konular»ı seç ya da birkaç konu daha oku.'
            : 'Henüz «Okudum» dediğin konu yok; «bütün konular»ı seç ya da önce bir konu oku.')
          : 'Bu seçimde yeterli soru yok.' };
    }
    const secilen = serpistir(karistir(h).slice(0, n));
    doc.aktif = { id:R.U.uid('ot'), kapsam:k, sorular:secilen.map(x => x.k), cevaplar:{}, sira:0, basladi:simdi() };
    await yaz();
    return { ok:true, n:secilen.length };
  }

  /* ---------- test sırasında (söz 3, 4) ---------- */

  function aktif(){ return doc.aktif; }
  function siradaki(){
    const a = doc.aktif;
    if(!a) return null;
    const sira = Math.max(0, Math.min(a.sorular.length - 1, a.sira || 0));
    return { sira, toplam:a.sorular.length, s:soruOf(a.sorular[sira]), v:a.cevaplar[sira] || null };
  }
  async function git(sira){
    if(!doc.aktif) return;
    doc.aktif.sira = Math.max(0, Math.min(doc.aktif.sorular.length - 1, Number(sira) || 0));
    await yaz();
  }
  async function cevapla(sira, harf){
    const a = doc.aktif;
    harf = String(harf || '').toUpperCase();
    const s = a ? soruOf(a.sorular[sira]) : null;
    if(!s || O().HARFLER.indexOf(harf) < 0) return { ok:false, neden:'gecersiz' };
    if(a.cevaplar[sira]) return { ok:false, neden:'kilitli' };
    a.cevaplar[sira] = { h:harf, at:simdi() };
    await yaz();
    return { ok:true, dogru:harf === s.q.dogru };
  }
  async function bak(sira){
    const a = doc.aktif;
    if(!a || !soruOf(a.sorular[sira])) return { ok:false, neden:'gecersiz' };
    if(a.cevaplar[sira]) return { ok:false, neden:'kilitli' };
    a.cevaplar[sira] = { h:null, bak:true, at:simdi() };
    await yaz();
    return { ok:true };
  }

  /* Anlık sayım: { toplam, cevaplanan, dogru, yanlis, bakildi, bos }. */
  function say(t){
    const r = { toplam:t.sorular.length, cevaplanan:0, dogru:0, yanlis:0, bakildi:0, bos:0 };
    t.sorular.forEach((k, j) => {
      const v = t.cevaplar[j], s = soruOf(k);
      if(!v){ r.bos++; return; }
      r.cevaplanan++;
      if(v.bak) r.bakildi++;
      else if(s && dogruMu(s.q, v)) r.dogru++;
      else r.yanlis++;
    });
    return r;
  }

  async function bitir(){
    const a = doc.aktif;
    if(!a) return null;
    const sonuc = {
      id:a.id, at:simdi(), basladi:a.basladi, kapsam:a.kapsam,
      sorular:a.sorular.map((k, j) => {
        const v = a.cevaplar[j];
        return v ? { k, h:v.h || null, bak:!!v.bak, at:v.at } : { k, h:null, bos:true };
      }),
    };
    doc.gecmis.unshift(sonuc);
    doc.gecmis = doc.gecmis.slice(0, GECMIS);
    doc.aktif = null;
    await yaz();
    return ozet(sonuc);
  }
  async function vazgec(){ doc.aktif = null; await yaz(); }

  /* Biten testin özeti: sayılar ve konu konu sonuç (yanlışı çok olan önce).
     Doğruluk bugünkü cevap anahtarıyla hesaplanır (söz 5). */
  function ozet(t){
    const r = { id:t.id, at:t.at, kapsam:t.kapsam, toplam:t.sorular.length, dogru:0, yanlis:0, bakildi:0, bos:0, konular:[] };
    const kon = {};
    t.sorular.forEach(x => {
      const s = soruOf(x.k);
      if(!s) return;
      const v = x.bos ? null : x;
      const d = v && dogruMu(s.q, v);
      if(!v) r.bos++; else if(v.bak) r.bakildi++; else if(d) r.dogru++; else r.yanlis++;
      const y = kon[s.topic.id] || (kon[s.topic.id] = { subject:s.subject, topic:s.topic, n:0, dogru:0 });
      y.n++; if(d) y.dogru++;
    });
    r.konular = Object.values(kon).sort((a, b) => (a.dogru / a.n) - (b.dogru / b.n) || b.n - a.n
      || a.topic.name.localeCompare(b.topic.name, 'tr'));
    return r;
  }
  function gecmis(){ return doc.gecmis.map(ozet); }

  /* ---------- yanlışlarım (söz 5) ---------- */

  /* Her sorunun en son denemesi: { k: { h, bak, at, kaynak } }. Aynı
     milisaniyede eşitlikte sonra gelen kazanır: konu → test (eskiden
     yeniye) → yeniden çözüm; yeniden çözüm her zaman ötekilerin ardından
     yapılır. */
  function sonDenemeler(){
    const son = {};
    const koy = (k, v, kaynak) => {
      if(!v || !v.at || (!v.h && !v.bak)) return;
      if(!son[k] || son[k].at <= v.at) son[k] = { h:v.h || null, bak:!!v.bak, at:v.at, kaynak };
    };
    O().konular().forEach(x => {
      const c = O().cevaplar(x.subject.id, x.topic.id);
      Object.keys(c).forEach(i => koy(anahtar(x.topic.id, i), c[i], 'konu'));
    });
    doc.gecmis.slice().reverse().forEach(t => t.sorular.forEach(x => koy(x.k, x, 'test')));
    Object.keys(doc.tekrar).forEach(k => koy(k, doc.tekrar[k], 'tekrar'));
    return son;
  }
  /* Son denemesi doğru olmayan sorular, en yenisi önce. ders: süzgeç. */
  function yanlislar(ders){
    const son = sonDenemeler();
    return Object.keys(son).map(k => {
      const s = soruOf(k);
      return s && !dogruMu(s.q, son[k]) && (!ders || ders === 'hepsi' || s.subject.id === ders)
        ? Object.assign(s, { son:son[k] }) : null;
    }).filter(Boolean).sort((a, b) => b.son.at.localeCompare(a.son.at) || a.k.localeCompare(b.k));
  }
  /* Yeniden çözüm: yeni bir deneme. İlk cevap kalır; aynı açılışta
     ikinci kez cevaplanmaz (ekran kilitler), sonraki açılışta yeniden
     denenebilir. */
  async function tekrarCevapla(k, harf){
    const s = soruOf(k);
    harf = String(harf || '').toUpperCase();
    if(!s || O().HARFLER.indexOf(harf) < 0) return { ok:false, neden:'gecersiz' };
    doc.tekrar[k] = { h:harf, at:simdi() };
    await yaz();
    return { ok:true, dogru:harf === s.q.dogru };
  }

  return { STORE, BOYLAR, EN_AZ, yukle, soruOf, havuz, baslat, aktif, siradaki, git, cevapla, bak, say,
    bitir, vazgec, ozet, gecmis, sonDenemeler, yanlislar, tekrarCevapla };
})();
