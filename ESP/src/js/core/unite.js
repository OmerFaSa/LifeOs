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
     5. İSTEĞE KİŞİSEL VERİ GİTMEZ: dil, düzey, konu.

   GİTAR PAKETİ (Part 8d-2): aynı teklif (`unite.add`, dili yok) bir alıştırma
   listesi taşır ve Stüdyo'nun `pieces` şemasına girer (data/guitar_tabs.js).
   Hedef tempo «referans»tır (`targetRef`); eşik kullanıcının kendi temiz
   tekrarından açılır (core/acoustic.js). Geri almada, üzerinde deneme
   kaydı olan alıştırma kalır: o kayıt kullanıcının ölçümüdür. */
window.LIFEOS.PARCA.yazilar({
  'esp.core.unite.bearer':'Bearer ',
  'esp.core.unite.esp-studyo-dan-gitar-alistir':'ESP Stüdyo’dan gitar alıştırma paketi istendi.',
  'esp.core.unite.esp-dil-ogren-den-unite':'ESP Dil › Öğren’den ünite istendi.',
  'esp.core.unite.rehber-hkm-den-baglaninca-ye':'Rehber › HKM’den bağlanınca yeniden iste.',
  'esp.core.unite.bu-istek-zaten-acik-is':'Bu istek zaten açık (iş emri #',
  'esp.core.unite.king-teklif-hazirladi-is-emr':'King teklif hazırladı (iş emri #',
  'esp.core.unite.bugun-e-teklif-olarak-gelir':'Bugün’e teklif olarak gelir.',
  'esp.core.unite.tempolar-referanstir-esik-se':'Tempolar referanstır: eşik senin temiz tekrarından açılır. Kaynaksız, model bilgisi.',
  'esp.core.unite.kaynaksiz-model-bilgisi-yanl':'Kaynaksız, model bilgisi: yanlış bulduğun kartı sil. Pratik sorularını ESP ',
  'esp.core.unite.kayit-kimligi-gecersiz':'Kayıt kimliği geçersiz.',
  'esp.core.unite.hkm-baglantisi-kurulmamis-un':'HKM bağlantısı kurulmamış; ünite alınamaz.',
});

window.LIFEOS.PARCA.yazilar({
  'esp.core.unite.duzey-baslangic-orta-ya-da':'Düzey başlangıç, orta ya da ileri olmalı.',
  'esp.core.unite.konu-2-80-karakter-olmali':'Konu 2–80 karakter olmalı.',
  'esp.core.unite.dil-esp-nin-dillerinden-biri':'Dil ESP’nin dillerinden biri olmalı.',
  'esp.core.unite.duzey-a1-c2-olmali':'Düzey A1–C2 olmalı.',
  'esp.core.unite.uniteyi-hkm-deki-uretim-buro':'Üniteyi HKM’deki Üretim Bürosu hazırlar ama HKM bağlı değil. ',
  'esp.core.unite.hkm-ye-ulasilamadi-is-emri-a':'HKM’ye ulaşılamadı; iş emri açılmadı. HKM açıkken yeniden iste.',
  'esp.core.unite.king-is-emrini-almadi':'King iş emrini almadı: ',
  'esp.core.unite.bu-gitar-paketi-zaten-eklenm':'Bu gitar paketi zaten eklenmiş.',
  'esp.core.unite.paketten-studyo-ya-eklenecek':'Paketten Stüdyo’ya eklenecek yeni alıştırma çıkmadı.',
  'esp.core.unite.gitar':'Gitar ',
  'esp.core.unite.kayit-teklifle-eslesmiyor':'Kayıt teklifle eşleşmiyor.',
  'esp.core.unite.kayit-unite-biciminde-degil':'Kayıt ünite biçiminde değil.',
  'esp.core.unite.unitenin-dili-esp-de-yok':'Ünitenin dili ESP’de yok.',
  'esp.core.unite.unitenin-duzeyi-gecersiz':'Ünitenin düzeyi geçersiz.',
  'esp.core.unite.bu-unite-zaten-eklenmis':'Bu ünite zaten eklenmiş.',
  'esp.core.unite.hicbir-unite-esp-nin-denetim':'Hiçbir ünite ESP’nin denetimini geçmedi (en az ',
  'esp.core.unite.unite-hkm-den-alinamadi-hkm':'Ünite HKM’den alınamadı; HKM açıkken yeniden dene.',
});


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
        headers:{ 'Content-Type':'application/json', 'Authorization':yz('esp.core.unite.bearer') + k.token },
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
    if(o && o.alan === 'gitar'){
      const duzey = bosluk(o.duzey).toLocaleLowerCase('tr-TR');
      if(GITAR_DUZEY.indexOf(duzey) < 0) return { ok:false, why:yz('esp.core.unite.duzey-baslangic-orta-ya-da') };
      const konu = bosluk(o.konu);
      if(konu.length < 2 || konu.length > 80) return { ok:false, why:yz('esp.core.unite.konu-2-80-karakter-olmali') };
      return { ok:true, unite:{ alan:'gitar', duzey, konu } };
    }
    const dil = o && o.dil;
    if(!ESP.LANG_BY_ID[dil]) return { ok:false, why:yz('esp.core.unite.dil-esp-nin-dillerinden-biri') };
    const duzey = bosluk(o.duzey).toUpperCase();
    if(!DUZEY[duzey]) return { ok:false, why:yz('esp.core.unite.duzey-a1-c2-olmali') };
    const konu = bosluk(o.konu);
    if(konu.length < 2 || konu.length > 80) return { ok:false, why:yz('esp.core.unite.konu-2-80-karakter-olmali') };
    return { ok:true, unite:{ dil, duzey, konu } };
  }

  async function iste(o){
    const t = istekTemizle(o);
    if(!t.ok) return { ok:false, metin:t.why };
    const r = await istek('/api/king/emir', { modul:'esp', tur:'esp.unite', konu:'',
      neden:t.unite.alan === 'gitar' ? yz('esp.core.unite.esp-studyo-dan-gitar-alistir')
        : yz('esp.core.unite.esp-dil-ogren-den-unite'), govde:{ unite:t.unite } });
    if(!r.bagli) return { ok:false, metin:yz('esp.core.unite.uniteyi-hkm-deki-uretim-buro')
      + yz('esp.core.unite.rehber-hkm-den-baglaninca-ye') };
    if(r.ag) return { ok:false, metin:yz('esp.core.unite.hkm-ye-ulasilamadi-is-emri-a') };
    const g = r.govde || {};
    if(!r.ok || !g.ok){
      return { ok:false, metin:yz('esp.core.unite.king-is-emrini-almadi') + ((g.errors || []).join('; ') || g.note || ('HTTP ' + r.status)) };
    }
    if(window.LIFEOS && LIFEOS.KingTeklif) LIFEOS.KingTeklif.haberVer();
    const e = g.emir || {};
    return { ok:true, emir:e.id, metin:g.yeni === false
      ? yz('esp.core.unite.bu-istek-zaten-acik-is') + e.id + ').'
      : yz('esp.core.unite.king-teklif-hazirladi-is-emr') + e.id + '). Onaylarsan Üretim Bürosu başlar; ünite '
        + yz('esp.core.unite.bugun-e-teklif-olarak-gelir') };
  }

  async function kayitCek(kid){
    const r = await istek('/api/bam/kayit/' + kid);
    return r.ok && r.govde && r.govde.kayit ? r.govde.kayit : null;
  }

  /* ------------------------------------------------------------ sınama (saf) */

  const BPM = [30, 240];
  const DERECE = /^b?(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(°|7|maj7|m7|sus4)?$/;
  const GITAR_DUZEY = ['başlangıç', 'orta', 'ileri'];

  function bpm(x){ return typeof x === 'number' && isFinite(x) && x >= BPM[0] && x <= BPM[1] ? Math.round(x) : null; }

  function gitarSina(g, kid, kayit){
    if((ESP.S.pieces || []).some(x => (x.tags || []).indexOf('bam:' + kid) >= 0)){
      return { ok:false, why:yz('esp.core.unite.bu-gitar-paketi-zaten-eklenm') };
    }
    const var_ = {};
    (ESP.S.pieces || []).forEach(x => { var_[U().norm(x.name)] = 1; });
    let dusen = 0, atlanan = 0;
    const pieces = [];
    (Array.isArray(g.alistirmalar) ? g.alistirmalar : []).slice(0, 20).forEach(x => {
      const ad = bosluk(x && x.ad).slice(0, 80);
      const kind = x && (x.tur === 'technique' || x.tur === 'piece') ? x.tur : null;
      const bas = bpm(x && x.baslangic_bpm), hedef = bpm(x && x.hedef_bpm);
      const il = Array.isArray(x && x.ilerleyis) ? x.ilerleyis : [];
      const ilOk = il.length <= 16 && il.every(t => typeof t === 'string' && DERECE.test(t.trim()));
      if(ad.length < 2 || !kind || bas == null || hedef == null || bas > hedef || !ilOk){ dusen++; return; }
      if(var_[U().norm(ad)]){ atlanan++; return; }
      var_[U().norm(ad)] = 1;
      let ton = bosluk(x.ton) || '';
      if(ton && ESP.NOTES.indexOf(ton.replace(/m$/, '')) < 0) ton = '';
      pieces.push(ESP.Model.newPiece({ name:ad, kind, key:ton, targetBpm:hedef, targetRef:true,
        startBpm:bas, progression:il.map(t => t.trim()), note:bosluk(x.not).slice(0, 200) || null,
        tags:['bam', 'bam:' + kid] }));
    });
    if(!pieces.length) return { ok:false, why:yz('esp.core.unite.paketten-studyo-ya-eklenecek') };
    const uyari = [yz('esp.core.unite.tempolar-referanstir-esik-se')];
    if(dusen) uyari.push(dusen + ' alıştırma ESP’nin denetimini geçmedi (tempo, ton ya da derece).');
    if(atlanan) uyari.push(atlanan + ' alıştırma Stüdyo’da zaten var; yeniden eklenmeyecek.');
    const duzey = GITAR_DUZEY.indexOf(g.duzey) >= 0 ? g.duzey : '';
    return { ok:true, tur:'gitar', pieces, kayitId:kid,
      onizleme:{ baslik:yz('esp.core.unite.gitar') + duzey + ' · ' + bosluk(g.konu) + ' — ' + pieces.length + ' alıştırma',
        satirlar:pieces.map(x => x.name + ' (' + (x.kind === 'technique' ? 'teknik' : 'parça')
          + (x.key ? ', ' + x.key : '') + ')' + (x.progression.length ? ': ' + x.progression.join('–') : '')
          + ' · ' + x.startBpm + ' → ' + x.targetBpm + ' BPM (referans)'),
        uyari } };
  }

  function sina(kayit, p){
    const g = kayit && kayit.govde;
    const kid = Number(kayit && kayit.id);
    if(!g || !Number.isInteger(kid) || kid < 1 || kid !== Number(p && p.kayit_id)){
      return { ok:false, why:yz('esp.core.unite.kayit-teklifle-eslesmiyor') };
    }
    if(g.tur === 'gitar') return gitarSina(g, kid, kayit);
    if(g.tur !== 'unite') return { ok:false, why:yz('esp.core.unite.kayit-unite-biciminde-degil') };
    const dil = g.dil, l = ESP.LANG_BY_ID[dil];
    if(!l) return { ok:false, why:yz('esp.core.unite.unitenin-dili-esp-de-yok') };
    const duzey = String(g.duzey || '').toUpperCase();
    if(!DUZEY[duzey]) return { ok:false, why:yz('esp.core.unite.unitenin-duzeyi-gecersiz') };
    if((ESP.S.bamUnits || []).some(u => u.bam && u.bam.kayitId === kid)){
      return { ok:false, why:yz('esp.core.unite.bu-unite-zaten-eklenmis') };
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
    if(!uniteler.length) return { ok:false, why:yz('esp.core.unite.hicbir-unite-esp-nin-denetim')
      + OGE[0] + ' geçerli öğe gerekir).' };
    const toplam = uniteler.reduce((n, u) => n + u.items[dil].length, 0);
    const uyari = [yz('esp.core.unite.kaynaksiz-model-bilgisi-yanl')
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
    if(!kayit) return { ok:false, why:yz('esp.core.unite.unite-hkm-den-alinamadi-hkm') };
    return sina(kayit, n.payload || {});
  }

  /* Onay: YENİDEN çekilir, YENİDEN sınanır; ünite kaydedilir ve kartları
     desteye girer (Lesson.addUnit: aynı ön yüz iki kez eklenmez). */
  async function uygula(p){
    const kid = Number(p && p.kayit_id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, error:yz('esp.core.unite.kayit-kimligi-gecersiz') };
    if(!baglanti()) return { ok:false, error:yz('esp.core.unite.hkm-baglantisi-kurulmamis-un') };
    const kayit = await kayitCek(kid);
    if(!kayit) return { ok:false, error:yz('esp.core.unite.unite-hkm-den-alinamadi-hkm') };
    const s = sina(kayit, p);
    if(!s.ok) return { ok:false, error:s.why };
    if(s.tur === 'gitar'){
      for(const x of s.pieces) await ESP.Model.savePiece(x);
      return { ok:true, note:s.pieces.length + ' alıştırma Stüdyo › Müzik’e eklendi. Tempolar '
        + 'referans; eşik senin temiz tekrarından açılır.', geriAl:{ kayitId:kid, gitar:true } };
    }
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
    if(g && g.gitar){
      let kalan = 0, silinen = 0;
      for(const x of (ESP.S.pieces || []).slice()){
        if((x.tags || []).indexOf('bam:' + kid) < 0) continue;
        if((x.attempts || []).length){ kalan++; continue; }
        await ESP.Model.deletePiece(x.id);
        silinen++;
      }
      return { ok:silinen + kalan > 0, kalan };
    }
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
