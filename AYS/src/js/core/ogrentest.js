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
        konular ya da hepsi; bütün seviyeler ya da yalnız sınav tarzı
        (orta ve ileri); 10 ya da 20 soru. Seçim rastgeledir, aynı
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
        hesaplanır: düzeltilen bir soru eski «doğru»yu taşımaz. Yerinde
        yeniden yazılan sorunun (`yenilendi`) eski denemeleri bu soruya
        sayılmaz (core/ogren.js söz 5).
     6. HATA BİLDİRİMİ KULLANICININ NOTUDUR. «Bu soruda hata var» cevap
        anahtarını değiştirmez (kod otoritedir). İşaretli soru karma test
        ve günlük paragraf havuzundan çıkar, Yanlışlarım'ın altında
        «Bildirdiğin hatalar» olarak durur, kopyalanıp iletilebilir. Soru
        sonradan yenilenirse işaret kendiliğinden kapanır.
     7. SINAV PROVASI (kullanıcı, 2026-10-22: «canlı sınav simülatörü»). TYT
        ya da AYT (sayısal) biçiminde: dersler ÖSYM'nin test sırasıyla ve
        soru oranıyla (R.SUBJECTS.questions) gelir, süre gerçek sınavın
        soru başına süresiyle ölçeklenir (TYT 165 dk / 120 soru, AYT 180 dk /
        80 soru; ÖSYM kılavuzu). Sınav süresince doğru/yanlış gösterilmez,
        çözüme bakılmaz; süre dolunca test kendiliğinden biter. Sonuçta net
        ÖSYM kuralıyla hesaplanır (doğru − yanlış / 4; «hesaplandı»), ders
        ders ve konu konu. Ölçüm kuralları karma testle aynıdır (söz 3–5):
        ilk işaret kilitlenir, boş yanlış sayılmaz, yanlışlar Yanlışlarım'a
        düşer, plan ve kapanış bu sonuca bakmaz. */

window.R = window.R || {};

R.OgrenTest = (function(){
  const STORE = 'meta/ogren-test';
  const BOYLAR = [10, 20];
  const EN_AZ = 5;
  const GECMIS = 30;
  /* Söz 7: ÖSYM süreleri ve test sırası (kılavuz); yalnız ölçek için. */
  const PROVA = {
    TYT:{ ad:'TYT', dk:165, soru:120, sira:['tyt-turkce', 'tyt-sosyal', 'tyt-matematik', 'tyt-fen'] },
    AYT:{ ad:'AYT · sayısal', dk:180, soru:80, sira:['ayt-matematik', 'ayt-fizik', 'ayt-kimya', 'ayt-biyoloji'] },
  };
  const PROVA_BOY = [20, 40];
  let doc = bos();

  function bos(){ return { aktif:null, gecmis:[], tekrar:{}, isaret:{} }; }
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
      if(d.isaret && typeof d.isaret === 'object') doc.isaret = d.isaret;
      if(d.aktif && Array.isArray(d.aktif.sorular) && d.aktif.sorular.length) doc.aktif = d.aktif;
    }
    return doc;
  }
  async function yaz(){
    try{ await R.Store.set(STORE, doc); }catch(e){ /* yazılamasa da bu açılışta çalışır */ }
  }

  /* 'tm-05#2' → { k, subject, topic, i, q }; soru artık yoksa null.
     Günlük paragraf havuzunun soruları 'tr-09#p014' biçimindedir
     (core/paragraf.js): i sayı değil havuz kimliğidir. at verilirse o
     anda verilen bir cevap için bakılır: soru sonradan yenilendiyse null. */
  function soruOf(k, at){
    const p = String(k || '').split('#');
    const x = O().konuyuBul(p[0]);
    if(!x.topic) return null;
    let q = null, i = null;
    if(/^p\d+$/.test(p[1] || '')){
      q = R.Paragraf ? R.Paragraf.bul(p[1], x.topic.id) : null;
      i = p[1];
    }else{
      i = Number(p[1]);
      q = O().sorular(x.topic.id)[i] || null;
    }
    if(!q || (at && !O().gecerli(q, at))) return null;
    return { k, subject:x.subject, topic:x.topic, i, q, havuz:typeof i === 'string' };
  }
  const dogruMu = (q, v) => !!(v && !v.bak && v.h && v.h === q.dogru);

  /* ---------- havuz ve kurulum (söz 2) ---------- */

  /* kapsam: { ders:'hepsi'|subjectId, konular:'okunan'|'hepsi', seviye:'hepsi'|'sinav' } */
  function havuz(kapsam){
    const k = kapsam || {};
    const l = [];
    O().konular().forEach(x => {
      if(k.ders && k.ders !== 'hepsi' && x.subject.id !== k.ders) return;
      if(k.konular === 'okunan' && !R.Model.topicState(x.subject.id, x.topic.id).okunduAt) return;
      O().sorular(x.topic.id).forEach((q, i) => {
        if(k.seviye === 'sinav' && O().seviye(x.topic.id, i) === 'temel') return;
        const ak = anahtar(x.topic.id, i);
        if(!isaretOf(ak)) l.push({ k:ak, tid:x.topic.id });
      });
      /* Günlük paragraf havuzu konusunun sorusudur (söz 1). */
      if(R.Paragraf) R.Paragraf.konuSorulari(x.topic.id).forEach(q => {
        if(k.seviye === 'sinav' && q.seviye === 'temel') return;
        const ak = anahtar(x.topic.id, q.id);
        if(!isaretOf(ak)) l.push({ k:ak, tid:x.topic.id });
      });
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
    const k = { ders:kapsam && kapsam.ders || 'hepsi', konular:kapsam && kapsam.konular === 'okunan' ? 'okunan' : 'hepsi',
      seviye:kapsam && kapsam.seviye === 'sinav' ? 'sinav' : 'hepsi' };
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

  /* Söz 7: sınav provası. Ders kotası soru oranıyla (en büyük kalan yöntemi);
     ders havuzunda yeterli soru yoksa olanla yetinilir, eksik söylenir. */
  /* Provanın planı: ders kotaları ve süre (kurulum ekranı da bunu gösterir). */
  function provaPlani(sinav, boy){
    const P = PROVA[sinav];
    if(!P) return null;
    const n = PROVA_BOY.indexOf(Number(boy)) >= 0 ? Number(boy) : PROVA_BOY[0];
    const dersler = P.sira.map(id => (R.SUBJECTS || []).find(s => s.id === id)).filter(Boolean);
    const top = dersler.reduce((a, s) => a + (s.questions || 0), 0) || 1;
    const kota = dersler.map(s => ({ s, ham:n * (s.questions || 0) / top }));
    kota.forEach(x => { x.n = Math.floor(x.ham); });
    let kalan = n - kota.reduce((a, x) => a + x.n, 0);
    kota.slice().sort((a, b) => (b.ham - b.n) - (a.ham - a.n)).forEach(x => { if(kalan > 0){ x.n++; kalan--; } });
    return { sinav, ad:P.ad, n, sureDk:Math.max(1, Math.round(P.dk * n / P.soru)),
      dersler:kota.map(x => ({ id:x.s.id, ad:x.s.name, n:x.n, havuz:havuz({ ders:x.s.id, konular:'hepsi', seviye:'hepsi' }).length })) };
  }
  async function provaBaslat(sinav, boy, simdiMs){
    const P = PROVA[sinav];
    if(!P) return { ok:false, neden:'sinav', metin:'Böyle bir sınav yok.' };
    const plan = provaPlani(sinav, boy), n = plan.n;
    const kota = plan.dersler.map(d => ({ s:(R.SUBJECTS || []).find(s => s.id === d.id), n:d.n }));
    const secilen = [], eksik = [];
    kota.forEach(x => {
      const sinavTarzi = havuz({ ders:x.s.id, konular:'hepsi', seviye:'sinav' });
      const h = sinavTarzi.length >= x.n ? sinavTarzi : havuz({ ders:x.s.id, konular:'hepsi', seviye:'hepsi' });
      const al = serpistir(karistir(h).slice(0, x.n));
      if(al.length < x.n) eksik.push(x.s.name + ' ' + al.length + '/' + x.n);
      al.forEach(y => secilen.push(y.k));
    });
    if(secilen.length < Math.ceil(n / 2)){
      return { ok:false, neden:'az', n:secilen.length, metin:'Bu prova için yeterli soru yok (' + secilen.length + ' / ' + n + ').' };
    }
    const sureDk = Math.max(1, Math.round(P.dk * secilen.length / P.soru));
    const bas = typeof simdiMs === 'number' ? simdiMs : Date.now();
    doc.aktif = { id:R.U.uid('ot'), kapsam:{ prova:sinav }, prova:{ sinav, sureDk, bitis:new Date(bas + sureDk * 60000).toISOString() },
      sorular:secilen, cevaplar:{}, sira:0, basladi:new Date(bas).toISOString() };
    await yaz();
    return { ok:true, n:secilen.length, sureDk, eksik };
  }
  /* Kalan saniye; prova değilse null. Süre dolduysa 0. */
  function kalanSn(simdiMs){
    const a = doc.aktif;
    if(!a || !a.prova) return null;
    const ms = Date.parse(a.prova.bitis) - (typeof simdiMs === 'number' ? simdiMs : Date.now());
    return Math.max(0, Math.round(ms / 1000));
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
  async function cevapla(sira, harf, ip, sure){
    const a = doc.aktif;
    harf = String(harf || '').toUpperCase();
    const s = a ? soruOf(a.sorular[sira]) : null;
    if(!s || O().HARFLER.indexOf(harf) < 0) return { ok:false, neden:'gecersiz' };
    if(a.cevaplar[sira]) return { ok:false, neden:'kilitli' };
    if(a.prova && kalanSn() === 0) return { ok:false, neden:'sure' };
    const kayit = ip ? { h:harf, ip:true, at:simdi() } : { h:harf, at:simdi() };
    if(typeof sure === 'number' && sure > 0) kayit.sure = Math.round(sure);
    a.cevaplar[sira] = kayit;
    await yaz();
    return a.prova ? { ok:true } : { ok:true, dogru:harf === s.q.dogru };
  }
  async function bak(sira, sure){
    const a = doc.aktif;
    if(a && a.prova) return { ok:false, neden:'prova' };            // söz 7: sınavda çözüme bakılmaz
    if(!a || !soruOf(a.sorular[sira])) return { ok:false, neden:'gecersiz' };
    if(a.cevaplar[sira]) return { ok:false, neden:'kilitli' };
    const kayit = { h:null, bak:true, at:simdi() };
    if(typeof sure === 'number' && sure > 0) kayit.sure = Math.round(sure);
    a.cevaplar[sira] = kayit;
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
      id:a.id, at:simdi(), basladi:a.basladi, kapsam:a.kapsam, prova:a.prova || null,
      sorular:a.sorular.map((k, j) => {
        const v = a.cevaplar[j];
        return v ? Object.assign({ k, h:v.h || null, bak:!!v.bak, at:v.at }, v.ip ? { ip:true } : {}, v.sure ? { sure:v.sure } : {}) : { k, h:null, bos:true };
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
    const r = { id:t.id, at:t.at, kapsam:t.kapsam, toplam:0, dogru:0, yanlis:0, bakildi:0, bos:0, konular:[], ortSure:null };
    const kon = {};
    let topSure = 0, saySure = 0;
    t.sorular.forEach(x => {
      /* Yenilenmiş ya da kalkmış soru bu testin sonucuna sayılmaz. */
      const s = soruOf(x.k, x.at || t.at);
      if(!s) return;
      r.toplam++;
      const v = x.bos ? null : x;
      const d = v && dogruMu(s.q, v);
      if(!v) r.bos++; else if(v.bak) r.bakildi++; else if(d) r.dogru++; else r.yanlis++;
      if(v && v.sure){ topSure += v.sure; saySure++; }
      const y = kon[s.topic.id] || (kon[s.topic.id] = { subject:s.subject, topic:s.topic, n:0, dogru:0 });
      y.n++; if(d) y.dogru++;
    });
    r.ortSure = saySure ? Math.round(topSure / saySure) : null;
    /* Söz 7: provada net ÖSYM kuralıyla (doğru − yanlış/4), ders ders; çözüme bakılan yok. */
    if(t.prova){
      const net = x => Math.round((x.dogru - x.yanlis / 4) * 100) / 100;
      const ders = {};
      t.sorular.forEach(x => {
        const s = soruOf(x.k, x.at || t.at);
        if(!s) return;
        const y = ders[s.subject.id] || (ders[s.subject.id] = { id:s.subject.id, ad:s.subject.name, n:0, dogru:0, yanlis:0, bos:0 });
        y.n++;
        if(x.bos) y.bos++; else if(dogruMu(s.q, x)) y.dogru++; else y.yanlis++;
      });
      const P = PROVA[t.prova.sinav] || { sira:[] };
      r.prova = { sinav:t.prova.sinav, ad:(P.ad || t.prova.sinav), sureDk:t.prova.sureDk, net:net(r),
        kullanilanDk:t.basladi ? Math.max(0, Math.round((Date.parse(t.at) - Date.parse(t.basladi)) / 60000)) : null,
        dersler:Object.values(ders).sort((a, b) => P.sira.indexOf(a.id) - P.sira.indexOf(b.id)).map(y => Object.assign(y, { net:net(y) })) };
    }
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
      if(!soruOf(k, v.at)) return;
      if(!son[k] || son[k].at <= v.at) son[k] = { h:v.h || null, bak:!!v.bak, at:v.at, kaynak };
    };
    O().konular().forEach(x => {
      const c = O().cevaplar(x.subject.id, x.topic.id);
      Object.keys(c).forEach(i => koy(anahtar(x.topic.id, i), c[i], 'konu'));
    });
    doc.gecmis.slice().reverse().forEach(t => t.sorular.forEach(x => koy(x.k, x, 'test')));
    if(R.Paragraf) R.Paragraf.denemeler().forEach(x => koy(x.k, x, 'paragraf'));
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
  async function tekrarCevapla(k, harf, ip, sure){
    const s = soruOf(k);
    harf = String(harf || '').toUpperCase();
    if(!s || O().HARFLER.indexOf(harf) < 0) return { ok:false, neden:'gecersiz' };
    const kayit = ip ? { h:harf, ip:true, at:simdi() } : { h:harf, at:simdi() };
    if(typeof sure === 'number' && sure > 0) kayit.sure = Math.round(sure);
    doc.tekrar[k] = kayit;
    await yaz();
    return { ok:true, dogru:harf === s.q.dogru };
  }

  /* ---------- hata bildirimi (söz 6) ---------- */

  /* Geçerli işaret ya da null: soru kalktıysa ya da işaretten sonra
     yenilendiyse işaret kapanmıştır. */
  function isaretOf(k){
    const v = doc.isaret[k];
    if(!v || !v.at) return null;
    const s = soruOf(k);
    if(!s || (s.q.yenilendi && String(s.q.yenilendi) > String(v.at))) return null;
    return v;
  }
  async function isaretle(k, not){
    if(!soruOf(k)) return { ok:false, neden:'gecersiz' };
    doc.isaret[k] = { at:simdi(), not:String(not || '').replace(/\s+/g, ' ').trim().slice(0, 300) };
    await yaz();
    return { ok:true };
  }
  async function isaretKaldir(k){
    if(!doc.isaret[k]) return { ok:false };
    delete doc.isaret[k];
    await yaz();
    return { ok:true };
  }
  /* Geçerli işaretler, en yenisi önce: [{ k, subject, topic, i, q, isaret }]. */
  function isaretliler(){
    return Object.keys(doc.isaret).map(k => {
      const v = isaretOf(k), s = v ? soruOf(k) : null;
      return s ? Object.assign(s, { isaret:v }) : null;
    }).filter(Boolean).sort((a, b) => b.isaret.at.localeCompare(a.isaret.at));
  }
  /* İletmek için düz metin: konu, soru, doğru cevap, kullanıcının notu. */
  function isaretMetni(){
    const d = O().duzMetin;
    return isaretliler().map((x, j) => (j + 1) + '. ' + x.subject.name + ' · ' + x.topic.name + ' · ' + x.k + '\n'
      + d(x.q.soru).replace(/\n/g, ' ') + (O().ekMetni(x.q) ? ' ' + O().ekMetni(x.q) : '') + '\n'
      + x.q.sec.map((m, i) => O().HARFLER[i] + ') ' + d(m)).join('  ') + '\n'
      + 'Uygulamadaki cevap: ' + x.q.dogru + (x.isaret.not ? '\nNot: ' + x.isaret.not : '')).join('\n\n');
  }

  return { STORE, BOYLAR, EN_AZ, PROVA, PROVA_BOY, provaPlani, provaBaslat, kalanSn, yukle, soruOf, havuz, baslat, aktif, siradaki, git, cevapla, bak, say,
    bitir, vazgec, ozet, gecmis, sonDenemeler, yanlislar, tekrarCevapla,
    isaretOf, isaretle, isaretKaldir, isaretliler, isaretMetni };
})();
