/* BAM DİL ÜNİTESİ — HKM'nin hazırladığı üniteyi ESP'ye almak (Part 8d).

   Kullanıcı Dil › Öğren'den «Rusça A1 selamlaşma» ister. İstek King'in
   teklifinden ve onaydan geçer; BAM üniteyi (başlık, ölçülebilir hedef,
   görev, ön/arka öğeler) yazar, öğeleri bağımsız yargıyla denetler
   (HKM/core/unite.py) ve HKM onu `unite.add` teklifi olarak bırakır.

   Sözler:
     1. HKM YAZMAZ, ESP YAZAR. Kayıt HKM'den ÇEKİLİR ve ESP'nin KENDİ
        koduyla yeniden sınanır (dil, yazı sistemi, öğe sayısı, tekrar);
        onay anında yeniden çekilir, yeniden sınanır.
     2. SORU MODELDEN GELMEZ. Ünite desteye kart olarak girer; pratik
        soruları ve çeldiricileri ESP'nin kendi motoru AYNI DESTEDEN kurar
        (core/lesson.js kural 3).
     3. TOHUM, ÖLÇÜM DEĞİLDİR. Kartlar `seed` ve `bam` etiketi taşır;
        ilerleme SRS'ten okunur, «tamamlandı» bayrağı tutulmaz.
     4. GERİ ALINIR. Ünite kalkar; hiç tekrar edilmemiş kartları da kalkar.
        Tekrar edilmiş kart kullanıcının emeğidir, silinmez — ve bu söylenir.
     5. İSTEĞE KİŞİSEL VERİ GİTMEZ: dil, düzey, konu. */

window.ESP = window.ESP || {};

ESP.Unite = (function(){
  const U = () => ESP.U;
  const ANAHTAR = 'meta/bamUniteler';
  const DUZEY = { A1:1, A2:2, B1:3, B2:4, C1:5, C2:5 };
  const OGE = [6, 20], MAX_UNITE = 4, MAX_ON = 120, MAX_ARKA = 160;
  const KIRIL = /[Ѐ-ӿ]/, ARAP = /[؀-ۿ]/, LATIN = /[A-Za-zÀ-ÿĀ-žḀ-ỿ]/;
  const SURE = 5000;

  function bosluk(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  /* Ön yüz dilin yazı sistemini taşıyor mu? (HKM'deki kuralın ESP kopyası
     değil, ESP'nin KENDİ kuralı: karşı tarafın süzgecine güvenilmez.) */
  function yaziTutar(dil, on){
    if(dil === 'ru') return KIRIL.test(on) && !ARAP.test(on);
    if(dil === 'ar') return ARAP.test(on) && !KIRIL.test(on);
    return LATIN.test(on) && !KIRIL.test(on) && !ARAP.test(on);
  }

  /* ------------------------------------------------------------ HKM */

  function baglanti(){
    const b = ESP.Beacon;
    const a = b && typeof b.settings === 'function' ? (b.settings() || {}) : {};
    if(!b || !a.enabled || !a.token || !b.urlOk(a.url)) return null;
    return { url:String(a.url).replace(/\/$/, ''), token:a.token };
  }

  async function istek(yol, govde){
    const k = baglanti();
    if(!k) return { ok:false, bagli:false };
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const zaman = ctrl ? setTimeout(() => ctrl.abort(), SURE) : null;
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

  function istekTemizle(o){
    const dil = o && o.dil;
    if(!ESP.LANG_BY_ID[dil]) return { ok:false, why:'Dil ESP’nin dillerinden biri olmalı.' };
    const duzey = bosluk(o.duzey).toUpperCase();
    if(!DUZEY[duzey]) return { ok:false, why:'Düzey A1–C2 olmalı.' };
    const konu = bosluk(o.konu);
    if(konu.length < 2 || konu.length > 80) return { ok:false, why:'Konu 2–80 karakter olmalı.' };
    return { ok:true, unite:{ dil, duzey, konu } };
  }

  async function iste(o){
    const t = istekTemizle(o);
    if(!t.ok) return { ok:false, metin:t.why };
    const r = await istek('/api/king/emir', { modul:'esp', tur:'esp.unite', konu:'',
      neden:'ESP Dil › Öğren’den ünite istendi.', govde:{ unite:t.unite } });
    if(!r.bagli) return { ok:false, metin:'Üniteyi HKM’deki Üretim Bürosu hazırlar ama HKM bağlı değil. '
      + 'Rehber › HKM’den bağlanınca yeniden iste.' };
    if(r.ag) return { ok:false, metin:'HKM’ye ulaşılamadı; iş emri açılmadı. HKM açıkken yeniden iste.' };
    const g = r.govde || {};
    if(!r.ok || !g.ok){
      return { ok:false, metin:'King iş emrini almadı: ' + ((g.errors || []).join('; ') || g.note || ('HTTP ' + r.status)) };
    }
    if(window.LIFEOS && LIFEOS.KingTeklif) LIFEOS.KingTeklif.haberVer();
    const e = g.emir || {};
    return { ok:true, emir:e.id, metin:g.yeni === false
      ? 'Bu istek zaten açık (iş emri #' + e.id + ').'
      : 'King teklif hazırladı (iş emri #' + e.id + '). Onaylarsan Üretim Bürosu başlar; ünite '
        + 'Bugün’e teklif olarak gelir.' };
  }

  async function kayitCek(kid){
    const r = await istek('/api/bam/kayit/' + kid);
    return r.ok && r.govde && r.govde.kayit ? r.govde.kayit : null;
  }

  /* ------------------------------------------------------------ sınama (saf) */

  function sina(kayit, p){
    const g = kayit && kayit.govde;
    const kid = Number(kayit && kayit.id);
    if(!g || !Number.isInteger(kid) || kid < 1 || kid !== Number(p && p.kayit_id)){
      return { ok:false, why:'Kayıt teklifle eşleşmiyor.' };
    }
    if(g.tur !== 'unite') return { ok:false, why:'Kayıt ünite biçiminde değil.' };
    const dil = g.dil, l = ESP.LANG_BY_ID[dil];
    if(!l) return { ok:false, why:'Ünitenin dili ESP’de yok.' };
    const duzey = String(g.duzey || '').toUpperCase();
    if(!DUZEY[duzey]) return { ok:false, why:'Ünitenin düzeyi geçersiz.' };
    if((ESP.S.bamUnits || []).some(u => u.bam && u.bam.kayitId === kid)){
      return { ok:false, why:'Bu ünite zaten eklenmiş.' };
    }
    const gorulen = {};
    let dusen = 0;
    const uniteler = [];
    (Array.isArray(g.uniteler) ? g.uniteler : []).slice(0, MAX_UNITE).forEach((u, i) => {
      if(!u) return;
      const title = bosluk(u.baslik).slice(0, 80), goal = bosluk(u.hedef).slice(0, 200);
      if(title.length < 2 || goal.length < 8) return;
      const ogeler = [];
      (Array.isArray(u.ogeler) ? u.ogeler : []).slice(0, OGE[1] * 2).forEach(x => {
        const on = bosluk(x && x.on), arka = bosluk(x && x.arka);
        const gecerli = on && arka && on.length <= MAX_ON && arka.length <= MAX_ARKA
          && yaziTutar(dil, on) && !KIRIL.test(arka) && !ARAP.test(arka)
          && U().norm(on) !== U().norm(arka);
        if(!gecerli){ dusen++; return; }
        if(gorulen[U().norm(on)] || ogeler.length >= OGE[1]) return;
        gorulen[U().norm(on)] = 1;
        ogeler.push({ front:on, back:arka });
      });
      if(ogeler.length < OGE[0]) return;
      uniteler.push({ id:'bam-' + kid + '-' + i, level:DUZEY[duzey], band:duzey, title, goal,
        task:bosluk(u.gorev).slice(0, 240) || null, items:{ [dil]:ogeler },
        bam:{ kayitId:kid, dil, at:String(kayit.created_at || '').slice(0, 10) || U().todayISO(),
          dogruluk:kayit.dogruluk === 'kaynakli' ? 'kaynakli' : 'dogrulanmadi' } });
    });
    if(!uniteler.length) return { ok:false, why:'Hiçbir ünite ESP’nin denetimini geçmedi (en az '
      + OGE[0] + ' geçerli öğe gerekir).' };
    const toplam = uniteler.reduce((n, u) => n + u.items[dil].length, 0);
    const uyari = ['Kaynaksız, model bilgisi: yanlış bulduğun kartı sil. Pratik sorularını ESP '
      + 'kendi destenden kurar.'];
    if(dusen) uyari.push(dusen + ' öğe ESP’nin denetimini geçmedi, eklenmeyecek.');
    return { ok:true, uniteler, dil,
      onizleme:{ baslik:l.label + ' ' + duzey + ' · ' + bosluk(g.konu) + ' — ' + uniteler.length
          + ' ünite, ' + toplam + ' öğe',
        satirlar:uniteler.map(u => u.title + ' (' + u.items[dil].length + ' öğe): ' + u.goal
          + ' Örnek: ' + u.items[dil].slice(0, 3).map(x => x.front + ' — ' + x.back).join('; ')),
        uyari } };
  }

  /* ------------------------------------------------------------ depo */

  async function yaz(){ await ESP.Store.set(ANAHTAR, { liste:ESP.S.bamUnits || [] }); }

  async function yukle(){
    let d = null;
    try{ d = await ESP.Store.get(ANAHTAR); }catch(e){ d = null; }
    ESP.S.bamUnits = d && Array.isArray(d.liste) ? d.liste.filter(u => u && u.id && u.items) : [];
  }

  function liste(dil){
    return (ESP.S.bamUnits || []).filter(u => !dil || (u.bam && u.bam.dil === dil));
  }

  async function onizle(n){
    if(!n || n.kind !== 'unite.add') return null;
    const kayit = await kayitCek(Number(n.payload && n.payload.kayit_id));
    if(!kayit) return { ok:false, why:'Ünite HKM’den alınamadı; HKM açıkken yeniden dene.' };
    return sina(kayit, n.payload || {});
  }

  /* Onay: YENİDEN çekilir, YENİDEN sınanır; ünite kaydedilir ve kartları
     desteye girer (Lesson.addUnit: aynı ön yüz iki kez eklenmez). */
  async function uygula(p){
    const kid = Number(p && p.kayit_id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, error:'Kayıt kimliği geçersiz.' };
    if(!baglanti()) return { ok:false, error:'HKM bağlantısı kurulmamış; ünite alınamaz.' };
    const kayit = await kayitCek(kid);
    if(!kayit) return { ok:false, error:'Ünite HKM’den alınamadı; HKM açıkken yeniden dene.' };
    const s = sina(kayit, p);
    if(!s.ok) return { ok:false, error:s.why };
    ESP.S.bamUnits = (ESP.S.bamUnits || []).concat(s.uniteler);
    await yaz();
    let eklenen = 0, atlanan = 0;
    for(const u of s.uniteler){
      const r = await ESP.Lesson.addUnit(Object.assign({ disc:'lang' }, u), s.dil);
      if(r.ok){ eklenen += r.added; atlanan += r.skipped; }
    }
    return { ok:true, note:s.uniteler.length + ' ünite eklendi; ' + eklenen + ' kart desteye girdi'
      + (atlanan ? ' (' + atlanan + ' kart zaten vardı)' : '') + '. Dil › Öğren’de.',
      geriAl:{ kayitId:kid } };
  }

  async function geriAl(g){
    const kid = g && g.kayitId;
    const ids = (ESP.S.bamUnits || []).filter(u => u.bam && u.bam.kayitId === kid).map(u => u.id);
    if(!ids.length) return { ok:false };
    ESP.S.bamUnits = (ESP.S.bamUnits || []).filter(u => ids.indexOf(u.id) < 0);
    await yaz();
    let kalan = 0;
    const etiketler = ids.map(id => 'unit:' + id);
    for(const c of (ESP.S.cards || []).slice()){
      if(!(c.tags || []).some(t => etiketler.indexOf(t) >= 0)) continue;
      if((c.reps || 0) > 0){ kalan++; continue; }
      await ESP.Model.deleteCard(c.id);
    }
    return { ok:true, kalan };
  }

  return { DUZEY, yaziTutar, istekTemizle, iste, kayitCek, sina, onizle, uygula, geriAl,
    yukle, liste };
})();
