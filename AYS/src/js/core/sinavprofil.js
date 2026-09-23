/* SINAV PROFİLLERİ — AYS'nin tek bir sınava bağlı kalmaması
   (ekip/PLAN.md §3.L; Tur 4).

   Yerleşik profil YKS SAY'dır (data/subjects.js). Başka bir sınavın (KPSS,
   DGS, ALES, YDS…) müfredatı UYDURULMAZ: King'e iş emri gider, BAM
   Araştırma Ofisi ders → konu raporu yazar (HKM core/mufredat.py), rapor
   buraya TEKLİF (`mufredat.add`) olarak gelir; kullanıcı onaylarsa AYS
   onu KENDİ koduyla yeniden doğrulayıp saklar.

   Sözler:
   1. HKM'NİN DENETİMİNE GÜVENİLMEZ. Kayıt HKM'den çekilir; ders ve konu
      sayısı, uzunluk ve tekrar burada yeniden sınanır.
   2. KAYNAKSIZ PROFİL «DOĞRULANMADI»DIR ve bu her yerde görünür.
   3. PUAN HESABI YOK. Resmi puanlama bağlanmadan net → puan yazılmaz;
      profilde «puanlama: veri yok» durur.
   4. PROFİL EKLEMEK PLANI DEĞİŞTİRMEZ. Ek profil konu takibi ve materyal
      isteği içindir; YKS planına dokunmaz ve kaldırılabilir. */

window.R = window.R || {};

R.SinavProfil = (function(){
  const SINIR = { ders:20, konuDers:80, konuToplam:1000 };
  const YERLESIK = 'yks-say';

  function bosluk(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function kucuk(s){
    return bosluk(s).replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  }

  /* ------------------------------------------------------------ liste */

  function yerlesik(){
    return { id:YERLESIK, ad:'YKS · SAY', kaynak:'yerlesik', dogruluk:'yerlesik',
      dersler:(R.SUBJECTS || []).map(s => ({ id:s.id, ad:s.name, soru:s.questions || null,
        konular:s.topics.map(t => ({ id:t.id, ad:t.name })) })),
      puanlama:'Puan ekranındaki yerleşik hesap.', bitenler:null };
  }
  function ekler(){ return (R.S.sinavProfilleri || []).slice(); }
  function liste(){ return [yerlesik()].concat(ekler()); }
  function bul(id){ return liste().find(p => p.id === id) || null; }

  function sayilar(p){
    const konu = p.dersler.reduce((a, d) => a + d.konular.length, 0);
    return { ders:p.dersler.length, konu, biten:(p.bitenler || []).length };
  }

  /* ------------------------------------------------ kayıttan profil

     HKM kaydı AYS'nin kendi sınırlarıyla süzülür. Kimlikler burada verilir;
     HKM'nin gönderdiği kimliğe dayanılmaz. */
  function kayittan(kayit){
    const g = kayit && kayit.govde;
    if(!kayit || kayit.tur !== 'arastirma' || !g || g.tur !== 'mufredat'){
      return { ok:false, why:'Kayıt bir müfredat raporu değil.' };
    }
    const kid = Number(kayit.id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, why:'Kayıt kimliği geçersiz.' };
    const ad = bosluk(g.sinav);
    if(ad.length < 2 || ad.length > 80) return { ok:false, why:'Raporda sınav adı yok.' };
    const dersler = [], gorulen = new Set();
    let toplam = 0, dusen = 0;
    (Array.isArray(g.dersler) ? g.dersler : []).slice(0, SINIR.ders * 2).forEach(d => {
      const dad = bosluk(d && d.ad);
      if(dad.length < 2 || dad.length > 80 || gorulen.has(kucuk(dad)) || dersler.length >= SINIR.ders){
        dusen++; return;
      }
      const ks = new Set(), konular = [];
      (Array.isArray(d.konular) ? d.konular : []).slice(0, SINIR.konuDers * 2).forEach(k => {
        const t = bosluk(k);
        if(t.length < 2 || t.length > 120 || ks.has(kucuk(t)) || konular.length >= SINIR.konuDers
          || toplam + konular.length >= SINIR.konuToplam){ dusen++; return; }
        ks.add(kucuk(t));
        konular.push(t);
      });
      if(!konular.length){ dusen++; return; }
      gorulen.add(kucuk(dad));
      const no = dersler.length + 1;
      const soru = Number.isInteger(d.soru_sayisi) && d.soru_sayisi >= 1 && d.soru_sayisi <= 200
        ? d.soru_sayisi : null;
      dersler.push({ id:'d' + no, ad:dad, soru,
        konular:konular.map((t, j) => ({ id:'d' + no + '-k' + (j + 1), ad:t })) });
      toplam += konular.length;
    });
    if(!dersler.length) return { ok:false, why:'Raporun hiçbir dersi AYS’nin denetimini geçmedi.' };
    const acik = (Array.isArray(g.acik_kalanlar) ? g.acik_kalanlar : []).map(bosluk)
      .filter(x => x.length >= 2).map(x => x.slice(0, 300)).slice(0, 12);
    return { ok:true, profil:{
      id:'bam-' + kid, ad, bolum:bosluk(g.bolum).slice(0, 80) || null, kaynak:'bam', kayitId:kid,
      dogruluk:kayit.dogruluk === 'kaynakli' ? 'kaynakli' : 'dogrulanmadi',
      dersler, puanlama:null,
      puanlamaNotu:bosluk(g.puanlama_notu).slice(0, 600) || null,
      acikKalanlar:acik, bitenler:[], eklenme:R.U.todayISO(), dusen,
    } };
  }

  /* ------------------------------------------------------------ depo */

  async function kaydet(p){
    R.S.sinavProfilleri = ekler().filter(x => x.id !== p.id).concat([p]);
    await R.Store.set('sinavprofil/' + p.id, p);
    return p;
  }

  async function yukle(){
    const l = (await R.Store.list('sinavprofil')) || [];
    R.S.sinavProfilleri = l.filter(p => p && typeof p.id === 'string' && p.id !== YERLESIK
      && Array.isArray(p.dersler));
  }

  async function sil(id){
    if(id === YERLESIK) return { ok:false, why:'Yerleşik profil kaldırılamaz.' };
    if(!ekler().some(p => p.id === id)) return { ok:false, why:'Profil bulunamadı.' };
    R.S.sinavProfilleri = ekler().filter(p => p.id !== id);
    await R.Store.remove('sinavprofil/' + id);
    return { ok:true };
  }

  /* Ek profilde konu takibi: bitti / bitmedi. Yerleşik profilin konu
     durumu Dersler ekranının kendi kapanış ölçümüdür; buradan yazılmaz. */
  async function konuIsaretle(profilId, konuId){
    const p = ekler().find(x => x.id === profilId);
    if(!p) return { ok:false, why:'Profil bulunamadı.' };
    if(!p.dersler.some(d => d.konular.some(k => k.id === konuId))){
      return { ok:false, why:'Konu bu profilde yok.' };
    }
    const b = p.bitenler || [];
    const yeni = b.indexOf(konuId) >= 0 ? b.filter(x => x !== konuId) : b.concat([konuId]);
    await kaydet(Object.assign({}, p, { bitenler:yeni }));
    return { ok:true, bitti:yeni.indexOf(konuId) >= 0 };
  }

  /* ------------------------------------------------------ HKM istemcisi */

  function hkm(){
    const b = R.Beacon;
    const a = b && typeof b.settings === 'function' ? (b.settings() || {}) : {};
    if(!b || !a.token || !b.urlOk(a.url)) return null;
    return { url:String(a.url).replace(/\/$/, ''), token:a.token };
  }

  async function istek(yol, govde){
    const k = hkm();
    if(!k) return { ok:false, bagli:false };
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const zaman = ctrl ? setTimeout(() => ctrl.abort(), 5000) : null;
    try{
      const res = await fetch(k.url + yol, {
        method:govde === undefined ? 'GET' : 'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:govde === undefined ? undefined : JSON.stringify(govde),
        signal:ctrl ? ctrl.signal : undefined,
      });
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      return { ok:res.status === 200, status:res.status, bagli:true, govde:g };
    }catch(e){
      return { ok:false, bagli:true, ag:true };
    }finally{
      if(zaman) clearTimeout(zaman);
    }
  }

  async function kayitCek(kid){
    const r = await istek('/api/bam/kayit/' + kid);
    return r.ok && r.govde ? r.govde.kayit || null : null;
  }

  /* `mufredat.add` teklifi uygulanınca: kayıt çekilir, süzülür, eklenir.
     Aynı rapor iki kez eklenmez. `cek` testte yerine konur. */
  async function teklifUygula(p, cek){
    const kid = Number(p && p.kayit_id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, error:'Kayıt kimliği geçersiz.' };
    if(ekler().some(x => x.kayitId === kid)) return { ok:false, error:'Bu müfredat zaten eklenmiş.' };
    const kayit = await (cek || kayitCek)(kid);
    if(!kayit) return { ok:false, error:'Müfredat HKM’den alınamadı; HKM açıkken yeniden dene.' };
    const r = kayittan(kayit);
    if(!r.ok) return { ok:false, error:r.why };
    if(ekler().some(x => kucuk(x.ad) === kucuk(r.profil.ad) && x.bolum === r.profil.bolum)){
      return { ok:false, error:'«' + r.profil.ad + '» profili zaten var.' };
    }
    await kaydet(r.profil);
    const s = sayilar(r.profil);
    return { ok:true, note:'«' + r.profil.ad + '» sınav profili eklendi: ' + s.ders + ' ders, '
      + s.konu + ' konu. Kaynaksız — resmi kılavuzla karşılaştır. Dersler ekranında duruyor.' };
  }

  /* King'e iş emri: «şu sınavın müfredatını çıkar». HKM yoksa profil
     KURULMAZ: müfredat uydurulmaz. */
  const KARAR = { onay:'King onayladı', kismi:'King kısmen onayladı', ret:'King reddetti' };

  async function iste(sinav, bolum){
    const ad = bosluk(sinav);
    if(ad.length < 2 || ad.length > 80) return { ok:false, metin:'Hangi sınavın müfredatı? «KPSS genel kültür müfredatını çıkar» gibi yazabilirsin.' };
    if(ekler().some(p => kucuk(p.ad) === kucuk(ad))){
      return { ok:false, metin:'«' + ad + '» profili zaten var; Dersler ekranında duruyor.' };
    }
    const mf = { sinav:ad };
    if(bosluk(bolum)) mf.bolum = bosluk(bolum).slice(0, 80);
    const r = await istek('/api/king/emir', { modul:'ays', tur:'sinav.mufredat', govde:{ mufredat:mf },
      neden:'Kullanıcı bu sınavın müfredatını istedi.' });
    if(!r.bagli) return { ok:false, metin:'HKM bağlı değil; müfredat istenemedi. Müfredatı uydurmam: '
      + 'BAM çıkarmadan profil kurulmaz. Rehber › HKM’den bağlanınca yeniden iste.' };
    if(r.ag) return { ok:false, metin:'HKM’ye ulaşılamadı; HKM açıkken yeniden dene.' };
    const g = r.govde || {};
    if(!r.ok || !g.ok){
      return { ok:false, metin:'King iş emrini almadı: '
        + ((g.errors || []).join('; ') || g.note || ('HTTP ' + r.status)) };
    }
    const e = g.emir || {};
    const hazir = e.durum === 'bitti';
    const eksik = (e.kontrol || []).filter(m => !m.ok).map(m => m.not).join('; ');
    return { ok:g.karar !== 'ret', karar:g.karar, emirId:e.id,
      metin:(g.yeni === false ? 'Bu iş zaten açık (iş emri #' + e.id + ').'
        : (KARAR[g.karar] || 'King cevap verdi') + ' (iş emri #' + e.id + ').')
        + (hazir ? ' Müfredat depoda hazırdı; teklif olarak geliyor.'
          : (e.tahmin && e.tahmin.metin ? ' Tahmini süre ' + e.tahmin.metin + ' (tahmin).' : ''))
        + (eksik ? ' ' + eksik : '')
        + (g.karar !== 'ret' ? ' Rapor gelince Bugün’de teklif olarak görünür; onaylarsan profil eklenir.' : '') };
  }

  /* Sohbet: «KPSS genel kültür müfredatını çıkar», «DGS için müfredat
     hazırla». Tetik yoksa null döner ve sıradaki kurala geçilir. */
  const TETIK = /(müfredat|sınav profil)/;
  const DOLGU = /^(müfredat[a-zçğıöşü]*|sınav[a-zçğıöşü]*|profil[a-zçğıöşü]*|için|çıkar[a-zçğıöşü]*|hazırla[a-zçğıöşü]*|oluştur[a-zçğıöşü]*|ist[ei][a-zçğıöşü]*|getir[a-zçğıöşü]*|lütfen|bana|bir|de|da|mı|mi|misin|mısın)$/;

  function sinavAdi(metin){
    return String(metin || '').split(/\s+/)
      .map(t => t.replace(/[.,!?:;«»"()]/g, '').replace(/['’].*$/, ''))
      .filter(t => t && !DOLGU.test(kucuk(t)))
      .join(' ');
  }

  async function sohbet(metin){
    if(!TETIK.test(kucuk(metin))) return null;
    const r = await iste(sinavAdi(metin));
    return { text:r.metin };
  }

  return { YERLESIK, SINIR, liste, ekler, bul, sayilar, kayittan, yukle, kaydet, sil,
    konuIsaretle, teklifUygula, iste, sinavAdi, sohbet, istek };
})();
