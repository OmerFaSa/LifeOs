/* ÇIKMIŞ SORULAR — konuya bağlı ÖSYM soru kayıtları.

   Kullanıcı (2026-10-10): «internetten çıkmış soruları da ekle konulara».
   ÖSYM'nin soruları ÖSYM'nindir: soru metni bu depoya ve uygulamaya
   KOPYALANMAZ (izinsiz çoğaltma yasak; depo GitHub'a gider). Bunun yerine
   konuya bir KAYIT bağlanır: sınav, yıl, soru numarası, resmî kitapçığın
   bağlantısı ve (biliniyorsa) yayımlanmış cevap anahtarındaki harf. Soru
   kitapçıktan çözülür, cevap burada girilir.

   Sözler:
     1. METİN YOK, KAYIT VAR. Kayıt yalnız künyedir; bağlantı yalnız http(s)
        olabilir (javascript: gibi şemalar reddedilir).
     2. DOĞRULUK ANAHTARLA ÖLÇÜLÜR. Doğru harf girilmişse ilk cevap kodla
        doğru/yanlış diye yazılır ve kilitlenir («ölçüldü»). Anahtar yoksa
        cevap yalnız «işaretlendi» olarak durur: doğru ya da yanlış
        denmez (AGENTS §1.2: ölçülmemiş şey sayılmaz).
     3. YANLIŞ DEFTERE KULLANICININ ELİYLE. Yanlış çözülen kayıt «Yanlış
        defterine ekle» ile deftere yazılır (yayıncı ÖSYM, test «2023 TYT»,
        soru no); oradan Tamir kuyruğuna ve tekrara geçer.
     4. HİÇBİR KARAR BAKMAZ. Plan, kapanış, yol ve risk bu cevaplara bakmaz. */

window.R = window.R || {};

R.Cikmis = (function(){
  const STORE = 'meta/ogren-cikmis';
  const SINAVLAR = ['TYT', 'AYT'];
  let doc = { kayitlar:[] };
  const simdi = () => new Date().toISOString();
  const HARF = ['A', 'B', 'C', 'D', 'E'];

  async function yukle(){
    let d = null;
    try{ d = await R.Store.get(STORE); }catch(e){ d = null; }
    doc = { kayitlar:Array.isArray(d && d.kayitlar) ? d.kayitlar.filter(k => k && k.id && k.konu) : [] };
    return doc;
  }
  async function yaz(){
    try{ await R.Store.set(STORE, doc); }catch(e){ /* yazılamasa da bu açılışta çalışır */ }
  }

  /* Bağlantı yalnız http(s); boş olabilir. Geçersizse null. */
  function baglanti(u){
    const s = String(u == null ? '' : u).trim();
    if(!s) return '';
    return /^https?:\/\/[^\s<>"']+$/i.test(s) ? s.slice(0, 500) : null;
  }

  /* Girdiyi doğrular: { ok, kayit } ya da { ok:false, neden }. */
  function dogrula(g){
    const konu = String(g.konu || '');
    if(!R.Ogren || !R.Ogren.konuyuBul(konu).topic) return { ok:false, neden:'Konu bulunamadı.' };
    const sinav = SINAVLAR.indexOf(g.sinav) >= 0 ? g.sinav : null;
    if(!sinav) return { ok:false, neden:'Sınav TYT ya da AYT olmalı.' };
    const yil = Number(g.yil);
    if(!(yil >= 1990 && yil <= new Date().getFullYear() + 1)) return { ok:false, neden:'Yıl anlaşılmadı.' };
    const no = String(g.soruNo || '').trim();
    if(!/^\d{1,3}$/.test(no)) return { ok:false, neden:'Soru numarası sayı olmalı.' };
    const url = baglanti(g.url);
    if(url === null) return { ok:false, neden:'Bağlantı http:// ya da https:// ile başlamalı.' };
    const dogru = g.dogru ? String(g.dogru).toUpperCase() : null;
    if(dogru && HARF.indexOf(dogru) < 0) return { ok:false, neden:'Doğru cevap A–E olmalı.' };
    return { ok:true, kayit:{ konu, sinav, yil, soruNo:no, url, dogru,
      test:String(g.test || '').trim().slice(0, 60), not:String(g.not || '').trim().slice(0, 200) } };
  }

  async function ekle(g){
    const r = dogrula(g || {});
    if(!r.ok) return r;
    const ayni = doc.kayitlar.find(k => k.konu === r.kayit.konu && k.sinav === r.kayit.sinav && k.yil === r.kayit.yil
      && k.soruNo === r.kayit.soruNo && (k.test || '') === r.kayit.test);
    if(ayni) return { ok:false, neden:'Bu soru bu konuya zaten bağlı.' };
    const k = Object.assign({ id:R.U.uid('ck'), at:simdi(), cevap:null }, r.kayit);
    doc.kayitlar.push(k);
    await yaz();
    return { ok:true, kayit:k };
  }
  async function sil(id){
    const n = doc.kayitlar.length;
    doc.kayitlar = doc.kayitlar.filter(k => k.id !== id);
    if(doc.kayitlar.length === n) return { ok:false };
    await yaz();
    return { ok:true };
  }
  function bul(id){ return doc.kayitlar.find(k => k.id === id) || null; }
  /* Konunun kayıtları: yeni yıl önce, sonra soru numarası. */
  function konununki(konu){
    return doc.kayitlar.filter(k => k.konu === konu)
      .sort((a, b) => b.yil - a.yil || a.sinav.localeCompare(b.sinav) || Number(a.soruNo) - Number(b.soruNo));
  }
  /* Doğru harf sonradan girilebilir (anahtar yayımlanınca); cevap varsa
     doğruluk yeniden hesaplanır — ilk harf değişmez. */
  async function anahtarYaz(id, harf){
    const k = bul(id);
    harf = harf ? String(harf).toUpperCase() : null;
    if(!k || (harf && HARF.indexOf(harf) < 0)) return { ok:false };
    k.dogru = harf;
    await yaz();
    return { ok:true };
  }
  /* İlk cevap kilitli (söz 2). → { ok, durum:'dogru'|'yanlis'|'isaretlendi' } */
  async function cevapla(id, harf){
    const k = bul(id);
    harf = String(harf || '').toUpperCase();
    if(!k || HARF.indexOf(harf) < 0) return { ok:false, neden:'gecersiz' };
    if(k.cevap) return { ok:false, neden:'kilitli' };
    k.cevap = { h:harf, at:simdi() };
    await yaz();
    return { ok:true, durum:durum(k) };
  }
  async function cevapSil(id){
    const k = bul(id);
    if(!k || !k.cevap) return { ok:false };
    k.cevap = null;
    await yaz();
    return { ok:true };
  }
  function durum(k){
    if(!k || !k.cevap) return 'bos';
    if(!k.dogru) return 'isaretlendi';
    return k.cevap.h === k.dogru ? 'dogru' : 'yanlis';
  }
  const kunye = k => k.yil + ' ' + k.sinav + (k.test ? ' ' + k.test : '') + ' · Soru ' + k.soruNo;

  /* Yanlış defteri kaydı (söz 3); aynı kayıt iki kez eklenmez. */
  function defterde(k){
    return (R.S.errors || []).find(e => e.kaynak && e.kaynak.tur === 'cikmis' && e.kaynak.id === k.id) || null;
  }
  async function deftereEkle(id){
    const k = bul(id);
    if(!k || durum(k) !== 'yanlis') return null;
    const var_ = defterde(k);
    if(var_) return var_;
    const x = R.Ogren.konuyuBul(k.konu);
    const err = {
      id:R.U.uid('r'), createdAt:simdi(), closedAt:null, repairDoneAt:null,
      examId:null, examDate:R.U.todayISO(), publisher:'ÖSYM',
      testName:(k.yil + ' ' + k.sinav + (k.test ? ' ' + k.test : '')).slice(0, 160), questionNo:k.soruNo,
      status:'Yanlış', tag:null, seconds:null, rootCause:'', principle:'', similar:'', recipe:'', topicRef:'',
      subjectId:x.subject.id, topicId:x.topic.id, topic:x.topic.name,
      soru:'Çıkmış soru: ' + kunye(k) + (k.url ? ' — ' + k.url : '') + (k.not ? ' — ' + k.not : ''),
      senin:k.cevap.h, anahtar:k.dogru, kaynak:{ tur:'cikmis', id:k.id },
    };
    await R.Model.saveError(err);
    return err;
  }

  /* Konunun çıkmış soru özeti: { toplam, cevaplanan, dogru, yanlis }. */
  function ozet(konu){
    const r = { toplam:0, cevaplanan:0, dogru:0, yanlis:0 };
    konununki(konu).forEach(k => { r.toplam++; const d = durum(k); if(d !== 'bos') r.cevaplanan++; if(d === 'dogru') r.dogru++; if(d === 'yanlis') r.yanlis++; });
    return r;
  }

  return { STORE, SINAVLAR, yukle, baglanti, dogrula, ekle, sil, bul, konununki, anahtarYaz, cevapla, cevapSil, durum, kunye,
    defterde, deftereEkle, ozet };
})();
