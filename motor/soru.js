/* SORU MOTORU — soru, alıştırma, süreli deneme ve puanlama tek yerde (sadeleşme Faz 3, plan A6).

   Birleştirdiği AYS parçaları (rapor: belgeler/ekip/sadelesme/faz3-soru.md; test: motor/soru.test.js):
     net, medyan, taban, OBP, ham puan, sıra tahmini   AYS/src/js/core/calc.js + core/state.js
     süreli deneme oturumu (165 dk)                    AYS/src/js/core/examrun.js
     karma test, sınav provası, Yanlışlarım            AYS/src/js/core/ogrentest.js
     cevap anahtarı → soru soru analiz                 AYS/src/js/core/denemeanaliz.js
     deneme karşılaştırma, gidiş (Theil–Sen)           AYS/src/js/core/analytics.js, core/gelecek.js
   Formüller ve sabitler birebir taşındı; test eski testlerin beklenen değerlerini yeniden üretir ve
   sabitleri eski kaynak dosyadan okuyup karşılaştırır.

   Sözler:
   1. SAF. Saat ve rastgelelik okunmaz: `simdi` (ms) ve `rnd` (0–1 üreten işlev) hep dışarıdan gelir,
      yoksa TypeError. Girdi kayıt değiştirilmez, yenisi döner.
   2. ETİKETSİZ SAYI ÇIKMAZ (AGENTS §1.2). Dışarı verilen her sayı { deger, etiket } ya da etiketli
      bir sonucun içindedir: ölçüldü / hesaplandı / tahmin / veri yok. Sıra tahmini hep 'tahmin'.
      Yapı taşı formüller (testNet, hamPuan, siraTahmini…) çıplak sayı döndürür; etiketleri ETIKETLER'de.
   3. SÜRE DUVAR SAATİNDEN (sahibin 2026-11-01 kararı, tools/ays_sinav_sure_kabul_test.py): deneme
      sürerken sekme kapalı geçen süre sınav süresine sayılır; yalnız elle duraklatma durdurur.
   4. KARAR YOL'UN, KART TEKRAR'IN. Soru motoru kapı eşiğine karar vermez (Yol.kapiDene'ye cevap
      verir) ve kart planlamaz (Tekrar.yeniKart'a öneri verir). Taslak içerikten kart önerilmez. */
(function(kok){
  'use strict';

  const ETIKET = Object.freeze({ OLCULDU:'ölçüldü', TAHMIN:'tahmin', HESAPLANDI:'hesaplandı', VERI_YOK:'veri yok' });
  const E = ETIKET;
  const dondur = o => { Object.values(o).forEach(v => { if(v && typeof v === 'object') dondur(v); }); return Object.freeze(o); };

  /* ---------------------------------------------------------- sabitler (kaynak satırları) */
  const YANLIS_BOLEN = 4;                         // state.js:530-533 — net = doğru − yanlış/4
  /* data/scoring.js:16-89 R.SCORING (base, tyt, ayt, bandHalfWidth, sayRankTable) birebir. */
  const PUAN = dondur({
    base:100,
    tyt:{ questions:120, perNet:3.33, maxRaw:500 },
    ayt:{ questions:80, perNet:5, tytWeight:0.40, aytWeight:0.60 },
    bandHalfWidth:{ few:18, some:12, many:8 },
    sayRankTable:[
      { score:560, rank:1 }, { score:550, rank:60 }, { score:530, rank:1900 }, { score:510, rank:7000 },
      { score:490, rank:16000 }, { score:470, rank:29000 }, { score:450, rank:46000 }, { score:430, rank:64000 },
      { score:410, rank:87000 }, { score:390, rank:111000 }, { score:370, rank:139000 }, { score:350, rank:174000 },
      { score:330, rank:217000 }, { score:310, rank:274000 }, { score:290, rank:345000 }, { score:270, rank:435000 },
      { score:250, rank:545000 }, { score:200, rank:900000 },
    ],
  });
  /* data/scoring.js:93-104 positions (anahtar ve etiket; açıklama cümlesi ekranındır). */
  const KONUMLAR = dondur({ above:'Hedefin üstünde', inband:'Hedef bandında', near:'Bandın kıyısında',
    below:'Bandın altında', unknown:'Veri yetersiz' });
  const OBP = dondur({ multiplier:5, coefFirst:0.12, coefRepeat:0.06, min:250, max:500 });   // data/reference.js:43
  const HEDEF_SIRA = 84285;                       // data/curriculum.js:13 R.PROGRAM.refRank
  /* data/reference.js:119-125 R.ERROR_TAGS (renk ekranındır). */
  const HATA_TURLERI = dondur({
    K:{ ad:'Konu eksiği', recete:'20 dk konu anlatımı + 20 soru' },
    'İ':{ ad:'İşlem hatası', recete:'3 gün boyunca 10 benzer soru' },
    Y:{ ad:'Yorum / kök okuma', recete:'Kökü işaretle + 10 soru' },
    S:{ ad:'Süre', recete:'Süreli 20 soruluk branş seti' },
    D:{ ad:'Dikkat', recete:'Somut tetikleyici belirle + kontrol rutini' },
  });
  /* core/ogrentest.js:62-76 — karma test boyları, en az havuz, ÖSYM süre ölçeği ve test sırası. */
  const BOYLAR = Object.freeze([10, 20]), EN_AZ = 5, PROVA_BOY = Object.freeze([20, 40]);
  const PROVA = dondur({
    TYT:{ dk:165, soru:120, sira:['tyt-turkce', 'tyt-sosyal', 'tyt-matematik', 'tyt-fen'] },
    AYT:{ dk:180, soru:80, sira:['ayt-matematik', 'ayt-fizik', 'ayt-kimya', 'ayt-biyoloji'] },
  });
  /* core/gelecek.js:49-54 */
  const GIDIS = dondur({ MIN_DENEME:4, MIN_GUN:14, MAX_NET:{ TYT:120, AYT:80 }, UFUK_KAT:3 });
  /* core/examrun.js MARKS ve summary(): ilk 20 dakika ısınma, 15 puanlık fark. */
  const ISARET = dondur({ ok:'Yaptım', slow:'Zorlandım', skip:'Atladım' });
  const ISINMA = dondur({ sn:20 * 60, fark:15 });
  const HARF = 'ABCDE';
  const DK = 60000, GUN = 864e5;
  /* Yapı taşlarının etiketi (söz 2). */
  const ETIKETLER = dondur({ testNet:E.HESAPLANDI, denemeNet:E.HESAPLANDI, obp:E.HESAPLANDI, hamPuan:E.TAHMIN,
    siraTahmini:E.TAHMIN, theilSen:E.HESAPLANDI, provaPlani:E.HESAPLANDI });

  /* ---------------------------------------------------------- yardımcılar (brand/ortak/bicim.js:22-38) */
  function median(arr){
    const s = arr.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if(!s.length) return null;
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function round(x, d){ if(!isFinite(x)) return 0; const f = Math.pow(10, d == null ? 1 : d); return Math.round(x * f) / f; }
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const pct = (a, b) => (!b || !isFinite(b) || !isFinite(a)) ? 0 : round(100 * a / b, 0);
  const kopya = o => JSON.parse(JSON.stringify(o));
  const sayi = (deger, etiket, ek) => Object.assign({ deger, etiket }, ek || {});
  const hesap = (v, d) => v == null ? sayi(null, E.VERI_YOK) : sayi(d == null ? v : round(v, d), E.HESAPLANDI);
  function zaman(simdi){
    if(typeof simdi !== 'number' || !isFinite(simdi)) throw new TypeError('Soru: simdi (ms) verilmeli: motor saati kendisi okumaz');
    return simdi;
  }
  function rndDenetle(rnd){
    if(typeof rnd !== 'function') throw new TypeError('Soru: rnd (0–1 üreten işlev) verilmeli: motor rastgeleyi kendisi seçmez');
  }
  const gunMs = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof s === 'string' ? s : '');
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const gunFarki = (a, b) => Math.round((gunMs(b) - gunMs(a)) / GUN);   // tarih.js diffDays: b − a
  const isoGun = ms => new Date(ms).toISOString().slice(0, 10);

  /* ---------------------------------------------------------- soru modeli
     Soru: { id, tur:'secmeli'|'acik', soru, sec?, dogru, olcut?, cozum?, ipucu?, seviye?, konu?, ders?, durum? }
     Biçim alan/SEMA.md «Alıştırma» ile aynı. AYS içeriği (anlatım, derin, paragraf) `tur` taşımaz;
     `sec` dizisi olan tür yazmamış soru seçmelidir. Doğru/yanlış sorusu iki seçenekli seçmelidir. */
  const turOf = s => s ? (s.tur || (Array.isArray(s.sec) ? 'secmeli' : null)) : null;
  function soruDenetle(s){
    if(!s || typeof s !== 'object') return 'soru yok';
    const t = turOf(s);
    if(t !== 'secmeli' && t !== 'acik') return 'bilinmeyen tür: ' + (s.tur || '—') + ' (secmeli | acik)';
    if(!s.soru) return 'soru metni yok';
    if(t === 'secmeli'){
      if(!Array.isArray(s.sec) || s.sec.length < 2 || s.sec.length > 5) return 'seçmeli soru 2–5 seçenek ister';
      if(typeof s.dogru !== 'string' || s.dogru.length !== 1 || HARF.slice(0, s.sec.length).indexOf(s.dogru) < 0) return 'cevap anahtarı seçeneklerde yok: ' + s.dogru;
    }else if(!Array.isArray(s.olcut) || !s.olcut.length) return 'açık uçlu soru öz değerlendirme ölçütü ister';
    return null;
  }
  /* Cevap denetimi. Açık uçlu puanlanmaz (SEMA): dogru null, ölçütler döner. */
  function kontrol(s, cevap){
    const neden = soruDenetle(s);
    if(neden) return { ok:false, neden };
    if(turOf(s) === 'acik') return { ok:true, dogru:null, olcut:s.olcut.slice() };
    const h = String(cevap == null ? '' : cevap).toUpperCase();
    if(h.length !== 1 || HARF.slice(0, s.sec.length).indexOf(h) < 0) return { ok:false, neden:'geçersiz şık: ' + cevap };
    return { ok:true, dogru:h === s.dogru };
  }
  const dogruMu = (s, v) => !!(v && !v.bak && v.h && turOf(s) === 'secmeli' && v.h === s.dogru);   // ogrentest.js dogruMu

  /* ---------------------------------------------------------- alıştırma ve prova (ogrentest.js)
     Oturum: { tur:'alistirma'|'prova', sorular:[id], cevaplar:{sira:{h, at, bak?, ip?, sure?}}, basladi,
               sinav?, sureDk?, bitis? }. Sözlük: { id: Soru }. */
  function karistir(l, rnd){
    const a = l.slice();
    for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  /* Aynı konudan iki soru mümkünse ard arda gelmez (ogrentest.js:174-185). */
  function serpistir(l){
    const out = [], kalan = l.slice();
    let son = null;
    while(kalan.length){
      let j = kalan.findIndex(x => x.konu !== son);
      if(j < 0) j = 0;
      const y = kalan.splice(j, 1)[0];
      son = y.konu;
      out.push(y);
    }
    return out;
  }
  /* Sırası verilmiş set: ders alıştırması, ustalık kapısı soruları, yeniden çözüm. */
  function oturumKur(idler, simdi){
    zaman(simdi);
    return { tur:'alistirma', sorular:(idler || []).slice(), cevaplar:{}, basladi:simdi };
  }
  /* Karma test (ogrentest.js:186-202). havuz: [{ id, konu }], kapsamı alan seçer. */
  function alistirmaKur(havuz, boy, simdi, rnd){
    zaman(simdi); rndDenetle(rnd);
    const n = BOYLAR.indexOf(Number(boy)) >= 0 ? Number(boy) : BOYLAR[0];
    const h = (havuz || []).filter(x => x && x.id);
    if(h.length < EN_AZ) return { ok:false, neden:'az', n:h.length };
    return { ok:true, oturum:{ tur:'alistirma', sorular:serpistir(karistir(h, rnd).slice(0, n)).map(x => x.id), cevaplar:{}, basladi:simdi } };
  }
  /* Prova planı (ogrentest.js:208-219): kota soru oranıyla, en büyük kalan yöntemi; süre ÖSYM ölçeğiyle.
     dersSorulari: { dersId: sınavdaki soru sayısı } (AYS data/subjects.js `questions`). */
  function provaPlani(sinav, dersSorulari, boy){
    const P = PROVA[sinav];
    if(!P) return null;
    const n = PROVA_BOY.indexOf(Number(boy)) >= 0 ? Number(boy) : PROVA_BOY[0];
    const ds = P.sira.filter(id => dersSorulari && dersSorulari[id] != null);
    const top = ds.reduce((a, id) => a + (dersSorulari[id] || 0), 0) || 1;
    const kota = ds.map(id => ({ id, ham:n * (dersSorulari[id] || 0) / top }));
    kota.forEach(x => { x.n = Math.floor(x.ham); });
    let kalan = n - kota.reduce((a, x) => a + x.n, 0);
    kota.slice().sort((a, b) => (b.ham - b.n) - (a.ham - a.n)).forEach(x => { if(kalan > 0){ x.n++; kalan--; } });
    return { sinav, n, sureDk:Math.max(1, Math.round(P.dk * n / P.soru)), dersler:kota.map(x => ({ id:x.id, n:x.n })) };
  }
  /* Prova kurulumu (ogrentest.js:221-243). havuzlar: { dersId: [{ id, konu, seviye }] }; sınav tarzı
     (temel olmayan) yeterse o, yoksa hepsi. Bitiş duvar saatidir (söz 3). */
  function provaKur(plan, havuzlar, simdi, rnd){
    zaman(simdi); rndDenetle(rnd);
    const P = plan && PROVA[plan.sinav];
    if(!P) return { ok:false, neden:'sinav' };
    const secilen = [], eksik = [];
    plan.dersler.forEach(d => {
      const hepsi = (havuzlar && havuzlar[d.id]) || [], tarz = hepsi.filter(x => x.seviye !== 'temel');
      const al = serpistir(karistir(tarz.length >= d.n ? tarz : hepsi, rnd).slice(0, d.n));
      if(al.length < d.n) eksik.push({ ders:d.id, var:al.length, gerek:d.n });
      al.forEach(y => secilen.push(y.id));
    });
    if(secilen.length < Math.ceil(plan.n / 2)) return { ok:false, neden:'az', n:secilen.length };
    const sureDk = Math.max(1, Math.round(P.dk * secilen.length / P.soru));
    return { ok:true, eksik, oturum:{ tur:'prova', sinav:plan.sinav, sureDk, bitis:simdi + sureDk * DK, sorular:secilen, cevaplar:{}, basladi:simdi } };
  }
  /* Kalan saniye; prova değilse null, süre dolduysa 0 (ogrentest.js:245-250). */
  function kalanSn(o, simdi){
    zaman(simdi);
    return o && o.tur === 'prova' ? Math.max(0, Math.round((o.bitis - simdi) / 1000)) : null;
  }
  /* İlk cevap kilitlenir; provada doğru/yanlış dönmez, süre dolunca cevap alınmaz (ogrentest.js:266-278). */
  function cevapla(o, sira, cevap, sozluk, simdi, ek){
    zaman(simdi);
    const s = o && sozluk && sozluk[o.sorular[sira]];
    if(!s) return { ok:false, neden:'gecersiz' };
    if(o.cevaplar[sira]) return { ok:false, neden:'kilitli' };
    if(o.tur === 'prova' && kalanSn(o, simdi) === 0) return { ok:false, neden:'sure' };
    const k = kontrol(s, cevap);
    if(!k.ok) return { ok:false, neden:'gecersiz' };
    const kayit = { h:k.dogru === null ? String(cevap) : String(cevap).toUpperCase(), at:simdi };
    if(ek && ek.ipucu) kayit.ip = true;
    if(ek && typeof ek.sure === 'number' && ek.sure > 0) kayit.sure = Math.round(ek.sure);
    const yeni = kopya(o);
    yeni.cevaplar[sira] = kayit;
    return o.tur === 'prova' ? { ok:true, oturum:yeni } : Object.assign({ ok:true, oturum:yeni, dogru:k.dogru }, k.olcut ? { olcut:k.olcut } : {});
  }
  /* Çözüme bakmak: soru kilitlenir, doğru sayılmaz. Provada çözüme bakılmaz. */
  function bak(o, sira, simdi){
    zaman(simdi);
    if(!o || o.sorular[sira] == null) return { ok:false, neden:'gecersiz' };
    if(o.tur === 'prova') return { ok:false, neden:'prova' };
    if(o.cevaplar[sira]) return { ok:false, neden:'kilitli' };
    const yeni = kopya(o);
    yeni.cevaplar[sira] = { h:null, bak:true, at:simdi };
    return { ok:true, oturum:yeni };
  }
  /* Bitir: cevapsız soru BOŞ (yanlış değil). Sonuç geçmişe yazılacak kayıttır; özet ondan hesaplanır. */
  function oturumBitir(o, sozluk, simdi){
    zaman(simdi);
    const sonuc = { tur:o.tur, sinav:o.sinav || null, sureDk:o.sureDk || null, basladi:o.basladi, bitti:simdi,
      sorular:o.sorular.map((id, j) => o.cevaplar[j] ? Object.assign({ id }, o.cevaplar[j]) : { id, h:null, bos:true }) };
    return { sonuc, ozet:sonucOzeti(sonuc, sozluk) };
  }
  const net2 = x => Math.round((x.dogru - x.yanlis / YANLIS_BOLEN) * 100) / 100;   // ogrentest.js:342
  /* Doğruluk her okumada bugünkü anahtarla (ogrentest.js söz 5); kalkmış soru sayılmaz. */
  function sonucOzeti(t, sozluk){
    const r = { toplam:0, dogru:0, yanlis:0, bakildi:0, bos:0, acik:0 }, kon = {}, ders = {};
    let topSure = 0, saySure = 0;
    t.sorular.forEach(x => {
      const s = sozluk && sozluk[x.id];
      if(!s) return;
      r.toplam++;
      const v = x.bos ? null : x, d = dogruMu(s, v);
      if(!v) r.bos++; else if(v.bak) r.bakildi++; else if(turOf(s) === 'acik') r.acik++; else if(d) r.dogru++; else r.yanlis++;
      if(v && v.sure){ topSure += v.sure; saySure++; }
      const k = s.konu || '—', y = kon[k] || (kon[k] = { konu:k, ders:s.ders || null, n:0, dogru:0 });
      y.n++; if(d) y.dogru++;
      if(t.tur === 'prova'){
        const z = ders[s.ders] || (ders[s.ders] = { ders:s.ders, n:0, dogru:0, yanlis:0, bos:0 });
        z.n++; if(!v) z.bos++; else if(d) z.dogru++; else z.yanlis++;
      }
    });
    const out = { etiket:E.OLCULDU, sayilar:r,
      ortSure:saySure ? sayi(Math.round(topSure / saySure), E.OLCULDU) : sayi(null, E.VERI_YOK),
      konular:Object.keys(kon).map(k => kon[k]).sort((a, b) => (b.n - b.dogru) - (a.n - a.dogru) || (a.konu < b.konu ? -1 : 1)) };
    if(t.tur === 'prova'){
      const P = PROVA[t.sinav] || { sira:[] };
      out.prova = { sinav:t.sinav, sureDk:t.sureDk, net:sayi(net2(r), E.HESAPLANDI),
        kullanilanDk:sayi(Math.max(0, Math.round((t.bitti - t.basladi) / DK)), E.OLCULDU),
        dersler:Object.keys(ders).map(k => ders[k]).sort((a, b) => P.sira.indexOf(a.ders) - P.sira.indexOf(b.ders))
          .map(y => Object.assign(y, { net:sayi(net2(y), E.HESAPLANDI) })) };
    }
    return out;
  }
  /* Yanlışlarım: son denemesi doğru olmayan sorular, en yenisi önce (ogrentest.js:370-394).
     denemeler: bütün kaynaklardan { id, h, bak, at } (test sonuçları, yeniden çözümler). */
  function yanlislarim(denemeler, sozluk){
    const son = {};
    (denemeler || []).forEach(v => {
      if(!v || v.at == null || (!v.h && !v.bak) || !sozluk[v.id]) return;
      if(!son[v.id] || son[v.id].at <= v.at) son[v.id] = v;
    });
    return Object.keys(son).filter(id => turOf(sozluk[id]) === 'secmeli' && !dogruMu(sozluk[id], son[id]))
      .map(id => ({ id, son:son[id] })).sort((a, b) => (b.son.at - a.son.at) || (a.id < b.id ? -1 : 1));
  }

  /* ---------------------------------------------------------- süreli deneme (examrun.js)
     Şablon: { id, ad, aile, tur, sure (dk), testler:[{ ad, q }] } (AYS data/reference.js EXAM_TEMPLATES; GOC.aysSablon). */
  function denemeBaslat(sablon, simdi, ek){
    zaman(simdi);
    if(!sablon || !Array.isArray(sablon.testler) || !sablon.testler.length || !(sablon.sure > 0)) return { ok:false, neden:'şablon bulunamadı' };
    const o = { sablon:sablon.id, ad:sablon.ad, aile:sablon.aile, tur:sablon.tur, sure:sablon.sure,
      tarih:(ek && ek.tarih) || isoGun(simdi), yayin:(ek && ek.yayin) || '',
      testler:sablon.testler.map(t => ({ ad:t.ad, q:t.q, sn:0, bas:null, bitti:false })),
      sira:0, isaretler:[], bas:simdi, durakMs:0, durakBas:null };
    o.testler[0].bas = simdi;
    return { ok:true, oturum:o };
  }
  const simdikiTest = o => o ? o.testler[o.sira] : null;
  /* Duvar saati: başlangıçtan beri geçen, yalnız elle duraklatılan süre düşülür (söz 3). */
  function gecenSn(o, simdi){
    zaman(simdi);
    const d = o.durakBas != null ? simdi - o.durakBas : 0;
    return Math.max(0, Math.floor((simdi - o.bas - o.durakMs - d) / 1000));
  }
  function testSn(o, t, simdi){
    zaman(simdi);
    if(!t) return 0;
    if(t.bas == null || o.durakBas != null) return t.sn;
    return t.sn + Math.floor((simdi - t.bas) / 1000);
  }
  const kalanSure = (o, simdi) => Math.max(0, o.sure * 60 - gecenSn(o, simdi));
  function saatiDurdur(t, simdi){ if(t && t.bas != null){ t.sn += Math.floor((simdi - t.bas) / 1000); t.bas = null; } }
  function duraklat(o, simdi){
    zaman(simdi);
    const y = kopya(o);
    if(y.durakBas != null) return y;
    saatiDurdur(simdikiTest(y), simdi);
    y.durakBas = simdi;
    return y;
  }
  function surdur(o, simdi){
    zaman(simdi);
    const y = kopya(o);
    if(y.durakBas == null) return y;
    y.durakMs += simdi - y.durakBas;
    y.durakBas = null;
    const t = simdikiTest(y);
    if(t) t.bas = simdi;
    return y;
  }
  /* Soru işareti: hangi testte, kaçıncı soru, o soruya kaç saniye (examrun.js mark). */
  function isaretle(o, tur, simdi){
    zaman(simdi);
    if(!ISARET[tur]) return { ok:false, neden:'bilinmeyen işaret: ' + tur };
    const y = kopya(o), t = simdikiTest(y), sn = testSn(y, t, simdi);
    const once = y.isaretler.filter(m => m.test === t.ad), son = once.length ? once[once.length - 1].at : 0;
    const isaret = { test:t.ad, no:once.length + 1, tur, at:sn, sure:Math.max(0, sn - son) };
    y.isaretler.push(isaret);
    return { ok:true, oturum:y, isaret };
  }
  function isaretGeriAl(o){ const y = kopya(o); y.isaretler.pop(); return y; }
  function sonrakiTest(o, simdi){
    zaman(simdi);
    const y = kopya(o), t = simdikiTest(y);
    saatiDurdur(t, simdi);
    if(t) t.bitti = true;
    if(y.sira >= y.testler.length - 1) return { oturum:y, test:null };
    y.sira++;
    if(y.durakBas == null) y.testler[y.sira].bas = simdi;
    return { oturum:y, test:y.testler[y.sira] };
  }
  function testeGit(o, i, simdi){
    zaman(simdi);
    if(!(i >= 0 && i < o.testler.length)) return null;
    const y = kopya(o);
    saatiDurdur(simdikiTest(y), simdi);
    y.sira = i;
    if(y.durakBas == null) y.testler[i].bas = simdi;
    return y;
  }
  /* Oturum özeti: süre dağılımı, yavaş sorular, ısınma (examrun.js summary). */
  function denemeOzeti(o, simdi){
    const toplam = gecenSn(o, simdi);
    const topQ = o.testler.reduce((a, t) => a + (Number(t.q) || 0), 0) || 1;
    const testler = o.testler.map(t => {
      const sn = testSn(o, t, simdi), plan = Math.round(o.sure * 60 * (t.q / topQ));
      return { ad:t.ad, q:sayi(t.q, E.OLCULDU), sn:sayi(sn, E.OLCULDU), plan:sayi(plan, E.HESAPLANDI), sapma:sayi(sn - plan, E.HESAPLANDI) };
    });
    const im = o.isaretler, med = median(im.map(m => m.sure).filter(x => x > 0));
    const oran = l => l.length ? sayi(pct(l.filter(m => m.tur === 'ok').length, l.length), E.HESAPLANDI) : sayi(null, E.VERI_YOK);
    const erken = oran(im.filter(m => m.at <= ISINMA.sn)), gec = oran(im.filter(m => m.at > ISINMA.sn));
    return {
      toplamSn:sayi(toplam, E.OLCULDU), asimSn:sayi(toplam - o.sure * 60, E.HESAPLANDI), testler,
      isaret:sayi(im.length, E.OLCULDU), zor:sayi(im.filter(m => m.tur === 'slow').length, E.OLCULDU),
      atlanan:sayi(im.filter(m => m.tur === 'skip').length, E.OLCULDU),
      medyanSn:med == null ? sayi(null, E.VERI_YOK) : sayi(Math.round(med), E.HESAPLANDI),
      enYavas:im.slice().sort((a, b) => b.sure - a.sure).slice(0, 5).map(m => Object.assign({}, m, { etiket:E.OLCULDU })), erkenOran:erken, gecOran:gec,
      isinma:erken.deger != null && gec.deger != null && gec.deger - erken.deger >= ISINMA.fark,
    };
  }
  /* Bitir: deneme kaydı + oturum kaydı. Dakika ölçülür; boş yazılmadıysa sorudan türetilir (examrun.js finish). */
  function denemeBitir(o, skorlar, simdi){
    const y = duraklat(o, simdi), oz = denemeOzeti(y, simdi);
    const testler = y.testler.map((t, i) => {
      const sc = (skorlar && skorlar[i]) || {}, c = Number(sc.dogru) || 0, w = Number(sc.yanlis) || 0, b = bosBelirle(c, w, sc.bos, t.q);
      return { ad:t.ad, dogru:c, yanlis:w, bos:b.bos, bosEtiket:b.etiket, dakika:Math.round(oz.testler[i].sn.deger / 60) };
    });
    return {
      deneme:{ tarih:y.tarih, ad:y.ad, aile:y.aile, tur:y.tur, yayin:y.yayin, sure:y.sure, sablon:y.sablon, testler, sureli:true },
      oturum:{ sablon:y.sablon, tarih:y.tarih, durum:'bitti', toplamSn:oz.toplamSn.deger, asimSn:oz.asimSn.deger, isaretler:y.isaretler, ozet:oz },
    };
  }

  /* ---------------------------------------------------------- deneme kaydı, net, analiz
     Deneme: { id, tarih, aile:'TYT'|'AYT', tur:'tam'|'kesit'|'brans'|'mini', yayin, sure, sablon?,
               testler:[{ ad, dogru, yanlis, bos, bosEtiket, dakika }], anahtar?:{test:dizi}, cevaplar?:{test:dizi} }
     Hata: { id, tur:'K'|'İ'|'Y'|'S'|'D'|null, denemeId?, ders?, konu?, zaman (ISO) }. */
  const testNet = t => Number(t.dogru || 0) - Number(t.yanlis || 0) / YANLIS_BOLEN;            // state.js:533
  const denemeNet = d => (d.testler || []).reduce((s, t) => s + testNet(t), 0);                // state.js:530-532
  /* Boş sayısı: yazıldıysa ölçüldü; yazılmadıysa soru − doğru − yanlış (hesaplandı); tutmazsa veri yok
     — sıfır uydurulmaz (state.js:505-520 blankCertainty). */
  function bosBelirle(dogru, yanlis, ham, q){
    if(ham != null && String(ham).trim() !== ''){
      const n = Number(ham);
      if(isFinite(n) && n >= 0) return { bos:Math.round(n), etiket:E.OLCULDU };
    }
    const kalan = Number(q) - (Number(dogru) || 0) - (Number(yanlis) || 0);
    if(isFinite(Number(q)) && Number(q) > 0 && kalan >= 0) return { bos:kalan, etiket:E.HESAPLANDI };
    return { bos:null, etiket:E.VERI_YOK };
  }
  const tamlar = (denemeler, aile) => (denemeler || []).filter(e => e.aile === aile && e.tur === 'tam')
    .sort((a, b) => a.tarih < b.tarih ? -1 : a.tarih > b.tarih ? 1 : 0);                        // calc.js:105-109
  /* Son 3 tam denemenin medyanı ve önceki 3'le farkı (calc.js:113-124). */
  function medyanGidis(denemeler, aile){
    const l = tamlar(denemeler, aile).map(denemeNet);
    const son3 = l.length >= 3 ? round(median(l.slice(-3)), 1) : null;
    const onceki3 = l.length >= 6 ? round(median(l.slice(-6, -3)), 1) : null;
    return { adet:sayi(l.length, E.OLCULDU), son3:hesap(son3), onceki3:hesap(onceki3),
      fark:hesap(son3 != null && onceki3 != null ? round(son3 - onceki3, 1) : null),
      seri:sayi(l.map(v => round(v, 1)), E.HESAPLANDI) };
  }
  /* Taban: son 4 tam denemenin en düşüğü (calc.js:125-129). */
  function taban(denemeler, aile){
    const l = tamlar(denemeler, aile).map(denemeNet);
    return hesap(l.length ? round(Math.min.apply(null, l.slice(-4)), 1) : null);
  }
  /* Test bazlı medyan, son 4 tam deneme (calc.js:131-139). */
  function testMedyan(denemeler, testAd, aile){
    const v = tamlar(denemeler, aile).slice(-4).map(e => (e.testler || []).find(t => t.ad === testAd)).filter(Boolean).map(testNet);
    const m = median(v);
    return hesap(m == null ? null : round(m, 2));
  }
  /* Hata türü dağılımı ve paretosu (calc.js:162-176). gunden: 'YYYY-AA-GG'. */
  function hataDagilimi(hatalar, gunden){
    const c = { K:0, 'İ':0, Y:0, S:0, D:0 };
    (hatalar || []).forEach(h => {
      // shortcut: gün ISO zamanın ilk 10 harfi (UTC); AYS yerel günü alıyordu, gece yarısına yakın kayıtta bir gün kayabilir.
      if(gunden && h.zaman && String(h.zaman).slice(0, 10) < gunden) return;
      if(c[h.tur] !== undefined) c[h.tur]++;
    });
    return c;
  }
  function hataPareto(hatalar, gunden){
    const d = hataDagilimi(hatalar, gunden), top = Object.keys(d).reduce((a, k) => a + d[k], 0);
    return Object.keys(d).map(k => ({ tur:k, ad:HATA_TURLERI[k].ad, recete:HATA_TURLERI[k].recete, adet:d[k], pay:top ? pct(d[k], top) : 0, etiket:E.HESAPLANDI }))
      .sort((a, b) => b.adet - a.adet);
  }

  /* Cevap anahtarı ve cevap ayrıştırma (denemeanaliz.js ayristir, söz 3): belirsiz girdi tahmin edilmez.
     tur: 'anahtar' (A–E, iptal «*») ya da 'cevap' (A–E, boş «.»; «-» ve «_» de boş). */
  function ayristir(metin, q, tur){
    const cevap = tur === 'cevap';
    const ham = String(metin == null ? '' : metin);
    const s = ham.toUpperCase();
    if(!s.trim()) return { ok:false, hata:'boş' };
    const CIFT = /(\d{1,3})\s*[-.):=]?\s*([A-E*.\-_])(?![A-ZÇĞİÖŞÜ])/g;
    const cifts = [];
    let m;
    while((m = CIFT.exec(s)) !== null) cifts.push([Number(m[1]), m[2]]);
    let beklenen = Number(q) || 0;
    let dizi;
    if(/\d/.test(s)){
      const artik = s.replace(CIFT, ' ').replace(/[\s,;|/]+/g, ' ').trim();
      if(!cifts.length || /[A-Z0-9ÇĞİÖŞÜ*]/.test(artik)){
        const parca = artik.split(' ').filter(x => /[A-Z0-9ÇĞİÖŞÜ*]/.test(x)).slice(0, 3).join(' ');
        return { ok:false, hata:'numaralı yazımda yalnız «1-A 2-C» gibi çiftler olmalı; şu kısım okunmadı: «' + parca + '»' };
      }
      if(!beklenen && !cevap) beklenen = Math.max.apply(null, cifts.map(c => c[0]));
      if(!beklenen) return { ok:false, hata:'soru sayısı bilinmiyor' };
      const l = new Array(beklenen).fill(null);
      for(const [no, h] of cifts){
        if(no < 1 || no > beklenen) return { ok:false, hata:no + '. soru yok (bu testte ' + beklenen + ' soru var)' };
        if(l[no - 1] != null && l[no - 1] !== h) return { ok:false, hata:no + '. soru iki kez farklı yazılmış' };
        l[no - 1] = h;
      }
      const eksik = l.map((h, i) => h == null ? i + 1 : null).filter(Boolean);
      if(eksik.length && !cevap) return { ok:false, hata:'şu soruların harfi yok: ' + eksik.slice(0, 6).join(', ') + (eksik.length > 6 ? '…' : '') };
      dizi = l.map(h => h == null ? '.' : h).join('');
    }else{
      const sade = ham.replace(/[\s,;|]+/g, '');
      const izinli = cevap ? /^[A-E.\-_]$/ : /^[A-E*]$/;
      const kotu = Array.from(sade).find(c => !izinli.test(c.toUpperCase()));
      if(kotu){
        const neden = !cevap && /[.\-_]/.test(kotu) ? 'anahtarda boş olmaz; iptal soru için * yaz'
          : cevap && kotu === '*' ? 'cevapta * olmaz; boş için nokta yaz' : '«' + kotu + '» geçersiz';
        return { ok:false, hata:neden };
      }
      dizi = sade.toUpperCase();
      if(beklenen && dizi.length !== beklenen) return { ok:false, hata:beklenen + ' soru bekleniyordu, ' + dizi.length + ' harf yazıldı' };
    }
    if(cevap) dizi = dizi.replace(/[\-_]/g, '.');
    if(!cevap && /[.\-_]/.test(dizi)) return { ok:false, hata:'anahtarda boş olmaz; iptal soru için * yaz' };
    return { ok:true, dizi };
  }
  /* Anahtar × cevap → soru soru D/Y/B; iptal D/Y/B'ye girmez (denemeanaliz.js karsilastir). */
  function karsilastir(anahtar, cevap){
    const sorular = [];
    let d = 0, y = 0, b = 0, iptal = 0;
    for(let i = 0; i < anahtar.length; i++){
      const a = anahtar[i], c = (cevap || '')[i] || '.';
      let durum;
      if(a === '*'){ durum = 'iptal'; iptal++; }
      else if(c === '.'){ durum = 'bos'; b++; }
      else if(c === a){ durum = 'dogru'; d++; }
      else{ durum = 'yanlis'; y++; }
      sorular.push({ no:i + 1, anahtar:a, cevap:c, durum });
    }
    return { sorular, d, y, b, iptal, net:testNet({ dogru:d, yanlis:y }), etiket:E.HESAPLANDI };
  }
  /* Tek deneme analizi — Deneme › Özet, Netler, Neden? hata/konu tek görünüm. Kayıt kendiliğinden
     değişmez: anahtardan çıkan D/Y/B kayıttakinden farklıysa yalnız `fark` söylenir (denemeanaliz.js söz 2). */
  function denemeAnalizi(d, hatalar){
    const testler = (d.testler || []).map(t => {
      const a = (d.anahtar || {})[t.ad], c = (d.cevaplar || {})[t.ad];
      const sonuc = a && c && a.length === c.length ? karsilastir(a, c) : null;
      return { ad:t.ad, net:hesap(testNet(t), 2), dogru:sayi(Number(t.dogru) || 0, E.OLCULDU), yanlis:sayi(Number(t.yanlis) || 0, E.OLCULDU),
        bos:t.bos == null ? sayi(null, E.VERI_YOK) : sayi(t.bos, t.bosEtiket || E.OLCULDU),
        dakika:t.dakika == null ? sayi(null, E.VERI_YOK) : sayi(t.dakika, E.OLCULDU), anahtarli:sonuc,
        fark:!!sonuc && (sonuc.d !== Number(t.dogru) || sonuc.y !== Number(t.yanlis) || (t.bos != null && sonuc.b !== Number(t.bos))) };
    });
    const bagli = (hatalar || []).filter(h => h.denemeId === d.id), kon = {};
    bagli.forEach(h => {
      const k = (h.ders || '—') + '::' + (h.konu || '—'), x = kon[k] || (kon[k] = { ders:h.ders || null, konu:h.konu || null, adet:0, turler:{} });
      x.adet++;
      if(h.tur) x.turler[h.tur] = (x.turler[h.tur] || 0) + 1;
    });
    return { id:d.id, tarih:d.tarih, net:hesap(denemeNet(d), 2), testler, fark:testler.some(t => t.fark),
      konular:Object.keys(kon).map(k => kon[k]).sort((a, b) => b.adet - a.adet), hata:hataPareto(bagli), etiket:E.HESAPLANDI };
  }
  /* İki denemenin test test farkı (analytics.js:83-121). */
  function denemeFarki(a, b){
    const adlar = [];
    [a, b].forEach(e => (e.testler || []).forEach(t => { if(adlar.indexOf(t.ad) < 0) adlar.push(t.ad); }));
    const isabet = t => (t && (t.dogru + t.yanlis)) ? pct(t.dogru, t.dogru + t.yanlis) : null;
    const satirlar = adlar.map(ad => {
      const ta = (a.testler || []).find(t => t.ad === ad), tb = (b.testler || []).find(t => t.ad === ad);
      const na = ta ? round(testNet(ta), 2) : null, nb = tb ? round(testNet(tb), 2) : null;
      return { ad, netA:na, netB:nb, fark:na != null && nb != null ? round(nb - na, 2) : null,
        bosA:ta ? ta.bos : null, bosB:tb ? tb.bos : null, isabetA:isabet(ta), isabetB:isabet(tb),
        dakikaA:ta ? ta.dakika : null, dakikaB:tb ? tb.dakika : null };
    });
    const oynayan = satirlar.filter(r => r.fark != null).sort((x, y) => Math.abs(y.fark) - Math.abs(x.fark));
    return { etiket:E.HESAPLANDI, netA:round(denemeNet(a), 2), netB:round(denemeNet(b), 2),
      fark:round(denemeNet(b) - denemeNet(a), 2), satirlar, enBuyuk:oynayan[0] || null };
  }

  /* ---------------------------------------------------------- puan ve sıra tahmini (calc.js:814-950)
     Kural: tek denemeyle konuşulmaz, medyan esas; sonuç bant + 'tahmin' etiketiyle. Tek sayı vaadi yok. */
  function obp(profil){
    const p = profil || {};
    const deger = clamp(p.diploma * OBP.multiplier, OBP.min, OBP.max);
    const katsayi = p.yerlesti ? OBP.coefRepeat : OBP.coefFirst;
    return { deger:round(deger, 0), katsayi, katki:round(deger * katsayi, 1) };
  }
  function yarimGenislik(n){
    const w = PUAN.bandHalfWidth;
    return n >= 8 ? w.many : n >= 5 ? w.some : w.few;
  }
  /* Ham net → 500'lük ölçekte yaklaşık puan, OBP hariç (calc.js:834-841). */
  function hamPuan(tytNet, aytNet){
    const tytPay = PUAN.base + (Number(tytNet) || 0) * PUAN.tyt.perNet;
    if(aytNet == null) return { tur:'TYT', deger:clamp(tytPay, PUAN.base, PUAN.tyt.maxRaw) };
    const aytPay = PUAN.base + (Number(aytNet) || 0) * PUAN.ayt.perNet;
    return { tur:'SAY', deger:clamp(PUAN.ayt.tytWeight * tytPay + PUAN.ayt.aytWeight * aytPay, PUAN.base, PUAN.tyt.maxRaw) };
  }
  /* Puan → sıra: referans noktaları arasında log-lineer aradeğer, uçlarda kırpılır (calc.js:844-858). */
  function siraTahmini(puan){
    const t = PUAN.sayRankTable;
    if(!isFinite(puan)) return null;
    if(puan >= t[0].score) return t[0].rank;
    if(puan <= t[t.length - 1].score) return t[t.length - 1].rank;
    for(let i = 0; i < t.length - 1; i++){
      const hi = t[i], lo = t[i + 1];
      if(puan <= hi.score && puan >= lo.score){
        const oran = (puan - lo.score) / (hi.score - lo.score);
        return Math.round(Math.exp(Math.log(lo.rank) + oran * (Math.log(hi.rank) - Math.log(lo.rank))));
      }
    }
    return null;
  }
  /* Profil: { diploma, yerlesti, hedefSira }. Girdi son 3 tam denemenin medyanı (calc.js:862-916). */
  function puanTahmini(denemeler, profil){
    const tyt = medyanGidis(denemeler, 'TYT'), ayt = medyanGidis(denemeler, 'AYT');
    const ornek = tamlar(denemeler, 'TYT').length, o = obp(profil);
    if(tyt.son3.deger == null){
      return { ok:false, konum:'unknown', ornek:sayi(ornek, E.OLCULDU), etiket:E.VERI_YOK,
        neden:'En az 3 tam TYT denemesi gerekir; öncesinde tahmin yanıltıcı olur.' };
    }
    const ham = hamPuan(tyt.son3.deger, ayt.son3.deger);
    const puan = round(ham.deger + o.katki, 1), yarim = yarimGenislik(ornek);
    const alt = round(puan - yarim, 1), ust = round(puan + yarim, 1);
    const enIyi = siraTahmini(ust), enKotu = siraTahmini(alt);     // sıra bandı ters yönlü: yüksek puan küçük sıra
    const hedef = (profil && profil.hedefSira) || HEDEF_SIRA;
    const konum = enKotu == null ? 'unknown' : enKotu <= hedef ? 'above' : enIyi <= hedef ? 'inband' : enIyi <= hedef * 1.35 ? 'near' : 'below';
    return {
      ok:true, etiket:E.TAHMIN, ornek:sayi(ornek, E.OLCULDU), tur:ham.tur, tytMedyan:tyt.son3, aytMedyan:ayt.son3,
      obp:sayi(o.katki, profil && profil.diploma != null ? E.HESAPLANDI : E.VERI_YOK),
      puan:sayi(puan, E.TAHMIN, { alt, ust, yarim }), sira:sayi(siraTahmini(puan), E.TAHMIN, { enIyi, enKotu }),
      hedefSira:hedef, konum, konumAd:KONUMLAR[konum],
      /* AYT denemesi yokken sıra yine SAY tablosundan: AYT'nin TYT ile aynı düzeyde geleceği varsayılır (calc.js:897-905). */
      varsayim:ham.tur === 'TYT' ? 'Bu bant yalnız TYT netinden çıktı; AYT netinin TYT ile aynı düzeyde geleceği varsayıldı. AYT denemesi eklenince bant gerçek karşılığını alır.' : null,
    };
  }
  /* Hedef sıra için gereken puan ve net farkı — yön göstergesi (calc.js:919-950). */
  function hedefFarki(tahmin){
    if(!tahmin || !tahmin.ok) return null;
    const hedef = tahmin.hedefSira, t = PUAN.sayRankTable;
    let gerek = null;
    for(let i = 0; i < t.length - 1; i++){
      const hi = t[i], lo = t[i + 1];
      if(hedef >= hi.rank && hedef <= lo.rank){
        gerek = lo.score + (Math.log(hedef) - Math.log(lo.rank)) / (Math.log(hi.rank) - Math.log(lo.rank)) * (hi.score - lo.score);
        break;
      }
    }
    if(gerek == null) return null;
    const fark = gerek - tahmin.puan.deger;
    const netBasina = tahmin.tur === 'SAY'
      ? PUAN.ayt.perNet * PUAN.ayt.aytWeight + PUAN.tyt.perNet * PUAN.ayt.tytWeight : PUAN.tyt.perNet;
    return { etiket:E.TAHMIN, gerekPuan:round(gerek, 1), puanFarki:round(fark, 1), netFarki:round(fark / netBasina, 1), ulasti:fark <= 0 };
  }

  /* ---------------------------------------------------------- gidiş (gelecek.js:57-131) */
  function ceyrek(l, q){
    const s = l.filter(v => isFinite(v)).sort((a, b) => a - b);
    if(!s.length) return null;
    const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
    return s[lo] + (s[hi] - s[lo]) * (i - lo);
  }
  function theilSen(nokta){
    const e = [];
    for(let i = 0; i < nokta.length; i++) for(let j = i + 1; j < nokta.length; j++){
      const dx = nokta[j].x - nokta[i].x;
      if(dx) e.push((nokta[j].y - nokta[i].y) / dx);
    }
    return e.length ? { egim:ceyrek(e, .5), alt:ceyrek(e, .25), ust:ceyrek(e, .75), n:e.length } : null;
  }
  const sapma = l => { const m = ceyrek(l, .5); return 1.4826 * ceyrek(l.map(v => Math.abs(v - m)), .5); };
  /* seri: [{ tarih, net }] tarihe göre; bugun, sinav: 'YYYY-AA-GG'. Hep aralık, etiket 'tahmin'. */
  function izdusum(seri, aile, bugun, sinav){
    const n = seri.length, G = GIDIS;
    if(n < G.MIN_DENEME) return { ok:false, aile, n, etiket:E.VERI_YOK, neden:'Gidiş için en az ' + G.MIN_DENEME + ' tam ' + aile + ' denemesi gerekir (şu an ' + n + ').' };
    const ilk = seri[0].tarih, yayilim = gunFarki(ilk, seri[n - 1].tarih);
    if(yayilim < G.MIN_GUN) return { ok:false, aile, n, etiket:E.VERI_YOK, neden:aile + ' denemeleri en az ' + G.MIN_GUN + ' güne yayılmalı (şu an ' + yayilim + ' gün).' };
    const kalan = gunFarki(bugun, sinav);
    if(!(kalan > 0)) return { ok:false, aile, n, etiket:E.VERI_YOK, neden:'Sınav tarihi geçmiş ya da yok.' };
    const nokta = seri.map(s => ({ x:gunFarki(ilk, s.tarih), y:Number(s.net) }));
    const ts = theilSen(nokta), son = nokta.slice(-3);
    const duzey = ceyrek(son.map(p => p.y), .5), tDuzey = ceyrek(son.map(p => p.x), .5);
    const hSinav = gunFarki(ilk, sinav) - tDuzey, h = Math.min(hSinav, G.UFUK_KAT * yayilim), sinavaKadar = h >= hSinav;
    const ufukTarih = sinavaKadar ? sinav : isoGun(gunMs(ilk) + Math.round(tDuzey + h) * GUN);
    const gerekGun = sinavaKadar ? 0 : Math.ceil((hSinav - G.UFUK_KAT * yayilim) / (G.UFUK_KAT + 1));
    const s = sapma(nokta.map(p => p.y - (duzey + ts.egim * (p.x - tDuzey)))) || 0;
    const max = G.MAX_NET[aile] || 120, kis = v => Math.max(0, Math.min(max, v));
    const duyarlilik = aile === 'AYT' ? PUAN.ayt.perNet * PUAN.ayt.aytWeight : PUAN.tyt.perNet;
    const tabanNet = yarimGenislik(n) / duyarlilik, olasi0 = duzey + ts.egim * h;
    const alt0 = Math.min(duzey + ts.alt * h - 1.5 * s, olasi0 - tabanNet), ust0 = Math.max(duzey + ts.ust * h + 1.5 * s, olasi0 + tabanNet);
    return { ok:true, etiket:E.TAHMIN, aile, n, yayilim, kalanGun:kalan, ufukGun:h, sinavaKadar, ufukTarih, gerekGun,
      duzey:round(duzey), egimHafta:round(ts.egim * 7, 2), sapma:round(s),
      alt:round(kis(alt0)), olasi:round(kis(olasi0)), ust:round(kis(ust0)), max };
  }
  const gidisSerisi = (denemeler, aile) => tamlar(denemeler, aile).map(e => ({ tarih:e.tarih, net:denemeNet(e) }));   // gelecek.js:172-174

  /* ---------------------------------------------------------- Yol ve Tekrar bağları */
  /* Yol.kapiDene girdisi: { soruId: harf }. Çözüme bakılan ve boş soru yazılmaz (Yol'da yanlış sayılır).
     Eşik ve geçiş kararı Yol'undur; burada yalnız ölçüm. */
  function yolGirdisi(sonuc){
    const cevaplar = {};
    (sonuc.sorular || []).forEach(x => { if(x.h && !x.bak && !x.bos) cevaplar[x.id] = x.h; });
    return { cevaplar, toplam:sayi((sonuc.sorular || []).length, E.OLCULDU), cevapli:sayi(Object.keys(cevaplar).length, E.OLCULDU) };
  }
  /* Yanlış ya da çözüme bakılmış seçmeli sorudan kart önerisi (Tekrar.yeniKart(id, ek)). Yalnız onaylı
     içerik; taslak ve kaynaksız soru dışarıda kalır, nedeni söylenir. */
  function tekrarOnerileri(sonuc, sozluk){
    const oneriler = [], disarida = [], gorulen = {};
    (sonuc.sorular || []).forEach(x => {
      const s = sozluk && sozluk[x.id];
      if(!s || gorulen[x.id] || x.bos || turOf(s) !== 'secmeli' || dogruMu(s, x)) return;
      gorulen[x.id] = true;
      if(s.durum !== 'onayli') return disarida.push({ id:x.id, neden:'içerik onaylı değil: taslak tekrara girmez' });
      oneriler.push({ id:'soru:' + x.id, ek:{ icerik:'onayli', kaynak:'soru:' + x.id, on:s.soru,
        arka:s.dogru + ') ' + s.sec[HARF.indexOf(s.dogru)], konu:s.konu || null } });
    });
    return { oneriler, disarida };
  }

  /* ---------------------------------------------------------- göç (AYS kayıtları → bu motorun biçimi) */
  const AYS_TUR = { full:'tam', partial:'kesit', branch:'brans', mini:'mini' };
  const AYS_BOS = { measured:E.OLCULDU, derived:E.HESAPLANDI, missing:E.VERI_YOK };
  const GOC = Object.freeze({
    /* AYS exams/<id> (state.js saveExam; blankCert v5 göçünden). Etiketsiz boş «eski kayıt» olur (AGENTS §0.1). */
    aysDeneme(e){
      if(!e || !e.id) return null;
      return { id:e.id, tarih:String(e.date || '').slice(0, 10), aile:e.family, tur:AYS_TUR[e.kind] || e.kind, ad:e.type,
        yayin:e.publisher || '', sure:e.duration, sablon:e.templateId || null, sureli:!!e.timed, kaynak:'ays:exams/' + e.id,
        testler:(e.tests || []).map(t => ({ ad:t.name, dogru:Number(t.correct) || 0, yanlis:Number(t.wrong) || 0,
          bos:t.blank == null ? null : t.blank, bosEtiket:t.blank == null ? E.VERI_YOK : (AYS_BOS[t.blankCert] || 'eski kayıt'),
          dakika:t.minutes == null ? null : t.minutes })),
        anahtar:e.anahtar, cevaplar:e.cevaplar };
    },
    /* AYS errors/<id>: tag K/İ/Y/S/D (etiketsiz hata dağılıma girmez). */
    aysHata(h){
      return h && h.id ? { id:h.id, tur:h.tag || null, denemeId:h.examId || null, ders:h.subjectId || null,
        konu:h.topicId || null, zaman:h.createdAt || null, kaynak:'ays:errors/' + h.id } : null;
    },
    /* AYS data/reference.js EXAM_TEMPLATES. */
    aysSablon(t){
      return t ? { id:t.id, ad:t.name, aile:t.family, tur:AYS_TUR[t.kind] || t.kind, sure:t.duration,
        testler:(t.tests || []).map(x => ({ ad:x.name, q:x.q })) } : null;
    },
    /* AYS içerik sorusu (KONU_ANLATIM/KONU_DERIN/PARAGRAF_HAVUZU): onay alanı yok → taslak. */
    aysSoru(q, id, konu, ders){
      return q ? { id, tur:'secmeli', soru:q.soru, sec:(q.sec || []).slice(), dogru:q.dogru, cozum:q.cozum, ipucu:q.ipucu,
        seviye:q.seviye || null, konu:konu || q.konu || null, ders:ders || null, durum:'taslak' } : null;
    },
    /* AYS days/<gün> soru sayıları (state.js:379-412 defaultDay; calc.js:224 gunSorusu) → günlük soru kaydı:
       { id, tarih, kaynak, etiket, kalemler:[{ kalem:'blok'|'paragraf'|'problem'|'serbest', hedef, cozulen, dogru, … }] }.
       Yalnız çözülmüş kalem yazılır (gunSorusu 0 ile boşu aynı sayar); hiç kalem yoksa null. */
    aysGun(d){
      if(!d || !/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) return null;
      const n = v => Number(v) > 0 ? Number(v) : null, kalemler = [];
      const ekle = (o, coz, dog) => { if(n(coz) || n(dog)) kalemler.push(Object.assign(o, { cozulen:n(coz), dogru:n(dog) })); };
      (Array.isArray(d.blocks) ? d.blocks : []).forEach(b => {
        if(b && b.slot !== 'Dinlenme') ekle({ kalem:'blok', blok:String(b.id), ad:b.topic || b.subject || b.slot || '', ders:b.subjectId || null, konu:b.topicId || null, hedef:n(b.targetQ) }, b.actualQ, b.correctQ);
      });
      ekle({ kalem:'paragraf', hedef:n(d.paragraphTarget) }, d.paragraphActual, null);
      ekle({ kalem:'problem', hedef:n(d.problemTarget) }, d.problemActual, null);
      ekle({ kalem:'serbest', hedef:null }, d.freeQ, d.freeCorrect);
      return kalemler.length ? { id:'ays:gun:' + d.date, tarih:d.date, kaynak:'ays:days/' + d.date, etiket:'eski kayıt', kalemler } : null;
    },
  });
  const EKSIK = Object.freeze({
    aysGun:['yalnız hedefi olan kalem (paragraphTarget, problemTarget, blok targetQ; çözülen boş ya da 0): soru kaydı değil, yazılmaz; günün planı Plan motorunda (Plan.GOC.aysGun)',
      'kötü gün hedefleri (badDayTargets, badDaySoruYok): Plan motorunun listesinde, taşınmaz',
      'blokta çözülen soru (actualQ) Kayıt çalışma kaydının sayısında da durur (Kayit.GOC.aysGun): günün toplamı buradan alınır, ikisi toplanmaz',
      'sayılar etiketsiz: hepsi «eski kayıt» (karar 11); doğru sayısı çözülenden büyük olsa da düzeltilmez'],
  });

  const Soru = Object.freeze({
    ETIKET, ETIKETLER, PUAN, KONUMLAR, OBP, HEDEF_SIRA, HATA_TURLERI, BOYLAR, EN_AZ, PROVA_BOY, PROVA, GIDIS, ISARET, ISINMA, YANLIS_BOLEN,
    // soru
    turOf, soruDenetle, kontrol,
    // alıştırma ve prova
    oturumKur, alistirmaKur, provaPlani, provaKur, kalanSn, cevapla, bak, oturumBitir, sonucOzeti, yanlislarim,
    // süreli deneme
    denemeBaslat, gecenSn, testSn, kalanSure, duraklat, surdur, isaretle, isaretGeriAl, sonrakiTest, testeGit, denemeOzeti, denemeBitir,
    // net ve analiz
    testNet, denemeNet, bosBelirle, medyanGidis, taban, testMedyan, hataDagilimi, hataPareto, ayristir, karsilastir, denemeAnalizi, denemeFarki,
    // puan, sıra, gidiş
    obp, yarimGenislik, hamPuan, siraTahmini, puanTahmini, hedefFarki, theilSen, izdusum, gidisSerisi,
    // bağlar ve göç
    yolGirdisi, tekrarOnerileri, GOC, EKSIK,
  });
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Motor = kok.LIFEOS.Motor || {};
  kok.LIFEOS.Motor.Soru = Soru;
  if(typeof module !== 'undefined' && module.exports) module.exports = Soru;
})(typeof window !== 'undefined' ? window : globalThis);
