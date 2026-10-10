/* GÜNLÜK PARAGRAF — paragraf çıpasının uygulama içindeki hâli.

   Kullanıcı (2026-10-10): «paragrafta soru sayısı az; soru sayısını
   arttır, sistemin içindeki özelliklerle entegre et». Paragraf dokuz ay
   her gün çalışılan bir beceridir (tr-09, «9 ay rutin»); Bugün'de bunun
   bir çıpası zaten var (day.paragraphTarget / paragraphActual). Bu dosya
   o çıpayı uygulamanın içinde çözülebilir kılar: her gün birkaç paragraf
   sorusu, ayrı bir havuzdan (data/paragraf.js).

   Sözler:
     1. HAVUZ AYRI, KONUSU BELLİ. Her soru bir paragraf konusuna (tr-05…
        tr-09) bağlıdır ve kalıcı bir kimlik taşır (p001…). Kimlik bir kez
        verilir, başka soruya verilmez; soru düzeltilirse `yenilendi` yazılır
        (core/ogren.js söz 5). Sorunun kimliği her yerde 'tr-07#p012'dir:
        karma test, Yanlışlarım, yanlış defteri ve hata bildirimi bu
        kimlikle aynı soruyu bulur.
     2. GÜNÜN SETİ KODLA SEÇİLİR, GÜN BOYUNCA SABİTTİR. İlk açılışta kurulur
        ve o güne yazılır. Sıra: önce son denemesi doğru olmayan ve en az
        iki gün önce denenmiş sorular (setin en çok yarısı), sonra hiç
        görülmemişler (konular sırayla serpiştirilmiş sabit düzende), en son
        en uzun süredir görülmeyenler. Hata bildirilmiş soru seçilmez.
        Cevap verilmeden önce set boyu değiştirilebilir; sonra değişmez.
     3. İLK CEVAP KİLİTLİ, ÖLÇÜMDÜR. Karma testteki gibi; konunun örnek soru
        kaydına yazılmaz; hiçbir plan, kapanış ya da yol eşiği bakmaz.
        Yanlışlarım'a «günlük paragraf» kaynağıyla girer.
     4. GÜN KAYDINA YAZMAK KULLANICININ İŞİ. Set bitince «Günün paragraf
        sayısına ekle» önerilir; dokunulursa katalogdaki 'paragraf-yaz'
        eylemiyle (core/proposals.js hemen) yazılır: doğrulama, önizleme
        ve Onaylar'da geri alma aynı yoldan. Sayılan, harf verilerek
        çözülen sorudur (çözümüne bakılan sayılmaz). Uygulanmış bir yazım
        varken aynı gün ikinci kez yazılmaz; Onaylar'dan geri alınırsa
        yazım düşer ve yeniden yazılabilir (her yazımın öneri anahtarı
        ayrıdır: 'ogren-paragraf:<gün>:<setin kurulduğu an>:<sıra>'). */

window.R = window.R || {};

R.Paragraf = (function(){
  const STORE = 'meta/ogren-paragraf';
  const BOYLAR = [3, 5, 10];
  const KONULAR = ['tr-05', 'tr-06', 'tr-07', 'tr-08', 'tr-09'];
  const SAKLA_GUN = 400;
  let doc = bos();

  function bos(){ return { boy:5, gunler:{} }; }
  const HAVUZ = () => R.PARAGRAF_HAVUZU || [];
  const simdi = () => new Date().toISOString();
  const bugunISO = () => R.U.todayISO();
  const anahtar = q => q.konu + '#' + q.id;

  async function yukle(){
    let d = null;
    try{ d = await R.Store.get(STORE); }catch(e){ d = null; }
    doc = bos();
    if(d && typeof d === 'object'){
      if(BOYLAR.indexOf(d.boy) >= 0) doc.boy = d.boy;
      if(d.gunler && typeof d.gunler === 'object') doc.gunler = d.gunler;
    }
    return doc;
  }
  async function yaz(){
    try{ await R.Store.set(STORE, doc); }catch(e){ /* yazılamasa da bu açılışta çalışır */ }
  }

  /* ---------- havuz (söz 1) ---------- */
  function bul(id, konu){
    const q = HAVUZ().find(x => x.id === id) || null;
    return q && (!konu || q.konu === konu) ? q : null;
  }
  function konuSorulari(konu){ return HAVUZ().filter(q => q.konu === konu); }

  /* Sabit serpiştirilmiş sıra: konular sırayla, her konuda kimlik sırası. */
  function sabitSira(){
    const kuyruk = KONULAR.map(k => HAVUZ().filter(q => q.konu === k).sort((a, b) => a.id.localeCompare(b.id)));
    const out = [];
    let kaldi = true;
    while(kaldi){
      kaldi = false;
      kuyruk.forEach(l => { if(l.length){ out.push(l.shift()); kaldi = true; } });
    }
    return out;
  }

  /* Bütün denemeler, düz liste: { k, id, h, bak, ip?, at, gun }. */
  function denemeler(){
    const l = [];
    Object.keys(doc.gunler).forEach(gun => {
      const g = doc.gunler[gun];
      Object.keys(g.cevaplar || {}).forEach(id => {
        const v = g.cevaplar[id], q = bul(id);
        if(q && v && v.at) l.push(Object.assign({ k:anahtar(q), id, gun }, v));
      });
    });
    return l;
  }
  /* Her sorunun en son geçerli denemesi: { id: deneme }. */
  function sonlar(){
    const son = {};
    denemeler().forEach(x => {
      const q = bul(x.id);
      if(!R.Ogren.gecerli(q, x.at)) return;
      if(!son[x.id] || son[x.id].at <= x.at) son[x.id] = x;
    });
    return son;
  }
  const dogruMu = (q, v) => !!(v && !v.bak && v.h && v.h === q.dogru);
  const isaretli = q => !!(R.OgrenTest && R.OgrenTest.isaretOf && R.OgrenTest.isaretOf(anahtar(q)));

  /* ---------- günün seti (söz 2) ---------- */
  function gunFarki(a, b){ return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000); }
  function sec(gun, boy){
    const son = sonlar();
    const aday = HAVUZ().filter(q => !isaretli(q));
    const secilen = [];
    const al = q => { if(secilen.length < boy && secilen.indexOf(q.id) < 0) secilen.push(q.id); };
    /* 1. Yanlışı olan ve en az iki gün önce denenmiş; en eskisi önce. */
    aday.filter(q => son[q.id] && !dogruMu(q, son[q.id]) && gunFarki(son[q.id].gun, gun) >= 2)
      .sort((a, b) => son[a.id].at.localeCompare(son[b.id].at))
      .slice(0, Math.floor(boy / 2)).forEach(al);
    /* 2. Hiç görülmemiş, sabit serpiştirilmiş sırayla. */
    const gorulen = id => Object.keys(doc.gunler).some(g => g !== gun && (doc.gunler[g].sorular || []).indexOf(id) >= 0);
    sabitSira().filter(q => !isaretli(q) && !gorulen(q.id)).forEach(al);
    /* 3. En uzun süredir görülmeyen. */
    aday.filter(q => son[q.id]).sort((a, b) => son[a.id].at.localeCompare(son[b.id].at)).forEach(al);
    return secilen;
  }
  function gunu(gun){ return doc.gunler[gun || bugunISO()] || null; }
  /* Günün setini kurar (yoksa) ve döndürür. Havuz boşsa null. */
  async function hazirla(gun){
    gun = gun || bugunISO();
    if(doc.gunler[gun]) return doc.gunler[gun];
    const l = sec(gun, doc.boy);
    if(!l.length) return null;
    doc.gunler[gun] = { sorular:l, cevaplar:{}, kuruldu:simdi(), yazildi:null };
    budama();
    await yaz();
    return doc.gunler[gun];
  }
  /* Çok eski günler silinir; Yanlışlarım ve «görüldü» bilgisi son
     SAKLA_GUN günden okunur (dokuz aylık ufkun rahatça üstü). */
  function budama(){
    const bugun = bugunISO();
    Object.keys(doc.gunler).forEach(g => { if(gunFarki(g, bugun) > SAKLA_GUN) delete doc.gunler[g]; });
  }
  /* Set boyu (tercih): bugünün setine henüz cevap yoksa set yeniden kurulur. */
  async function boyAyarla(n){
    n = Number(n);
    if(BOYLAR.indexOf(n) < 0) return { ok:false, neden:'gecersiz' };
    doc.boy = n;
    const g = gunu();
    if(g && !Object.keys(g.cevaplar || {}).length && !g.yazildi){ delete doc.gunler[bugunISO()]; }
    await yaz();
    await hazirla();
    return { ok:true };
  }

  /* ---------- cevap (söz 3) ---------- */
  async function cevapla(id, harf, ip){
    const g = gunu(), q = bul(id);
    harf = String(harf || '').toUpperCase();
    if(!g || !q || g.sorular.indexOf(id) < 0 || R.Ogren.HARFLER.indexOf(harf) < 0) return { ok:false, neden:'gecersiz' };
    if(g.cevaplar[id]) return { ok:false, neden:'kilitli' };
    g.cevaplar[id] = ip ? { h:harf, ip:true, at:simdi() } : { h:harf, at:simdi() };
    await yaz();
    return { ok:true, dogru:harf === q.dogru };
  }
  async function bak(id){
    const g = gunu();
    if(!g || g.sorular.indexOf(id) < 0 || !bul(id)) return { ok:false, neden:'gecersiz' };
    if(g.cevaplar[id]) return { ok:false, neden:'kilitli' };
    g.cevaplar[id] = { h:null, bak:true, at:simdi() };
    await yaz();
    return { ok:true };
  }
  /* { toplam, cevaplanan, cozulen, dogru, yanlis, bakildi, bitti } */
  function ozet(gun){
    const g = gunu(gun);
    const r = { toplam:0, cevaplanan:0, cozulen:0, dogru:0, yanlis:0, bakildi:0, bitti:false };
    if(!g) return r;
    g.sorular.forEach(id => {
      const q = bul(id);
      if(!q) return;
      r.toplam++;
      const v = g.cevaplar[id];
      if(!v) return;
      r.cevaplanan++;
      if(v.bak) r.bakildi++;
      else{ r.cozulen++; if(v.h === q.dogru) r.dogru++; else r.yanlis++; }
    });
    r.bitti = r.toplam > 0 && r.cevaplanan === r.toplam;
    return r;
  }
  /* Bugünün seti açık mı (kurulmamış ya da bitmemiş)? Bugün'ün önerisi
     buna bakar (core/calc.js): bitmiş setin «Başla»sı olmaz. */
  function acikMi(){
    if(!HAVUZ().length) return false;
    const g = gunu();
    return !g || !ozet().bitti;
  }

  /* ---------- gün kaydına yazma (söz 4) ---------- */
  /* Uygulanmış (geri alınmamış) yazım ya da null. Öneri satırı Onaylar'da
     geri alındıysa yazım düşmüştür. */
  function yazim(gun){
    const g = gunu(gun);
    const y = g && g.yazildi;
    if(!y) return null;
    const row = y.row && R.Proposals && R.Proposals.all ? R.Proposals.all().find(r => r.id === y.row) : null;
    if(row && row.status !== 'applied') return null;
    return y;
  }
  async function gunKaydinaYaz(){
    const gun = bugunISO(), g = gunu(gun), o = ozet(gun);
    if(!g || !o.bitti) return { ok:false, why:'Set bitmeden yazılmaz.' };
    if(yazim(gun)) return { ok:false, why:'Bugünün seti zaten yazıldı.' };
    if(!o.cozulen) return { ok:false, why:'Çözülen soru yok: çözümüne bakılan sorular sayılmaz.' };
    if(!R.Proposals || !R.Proposals.hemen) return { ok:false, why:'Öneri sistemi yok.' };
    if(R.Model.ensureDay) await R.Model.ensureDay(R.U.today());
    const sira = (Number(g.yazimSayisi) || 0) + 1;
    const r = await R.Proposals.hemen({ action:'paragraf-yaz', params:{ count:o.cozulen, date:gun },
      anahtar:'ogren-paragraf:' + gun + ':' + (g.kuruldu || '') + ':' + sira, reason:'Öğren › Günlük paragraf: ' + o.cozulen + ' soru çözüldü (ölçüldü)',
      iz:[{ tur:'ogren-paragraf', id:gun }] });
    if(!r || !r.ok) return { ok:false, why:(r && r.why) || 'Yazılamadı.' };
    g.yazimSayisi = sira;
    g.yazildi = { at:simdi(), n:o.cozulen, row:r.row && r.row.id };
    await yaz();
    return { ok:true, n:o.cozulen, row:r.row };
  }

  /* Havuzun durumu: kaç soru, kaçı hiç görülmedi. */
  function durum(){
    const gorulen = new Set();
    Object.keys(doc.gunler).forEach(g => (doc.gunler[g].sorular || []).forEach(id => gorulen.add(id)));
    const toplam = HAVUZ().length;
    return { toplam, gorulen:gorulen.size, yeni:Math.max(0, toplam - HAVUZ().filter(q => gorulen.has(q.id)).length), boy:doc.boy };
  }

  return { STORE, BOYLAR, KONULAR, get HAVUZ(){ return HAVUZ(); }, yukle, bul, konuSorulari, anahtar, denemeler,
    gunu, hazirla, boyAyarla, cevapla, bak, ozet, acikMi, yazim, gunKaydinaYaz, durum, sec };
})();
