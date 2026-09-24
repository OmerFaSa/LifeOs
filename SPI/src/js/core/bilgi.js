/* SPİ BİLGİSİ — BAM'ın besin, fiyat ve yer kayıtlarını SPİ'ye almak (Part 8c-2).

   Kullanıcı Mutfak'tan «kinoanın besin değerleri», «tavuk göğsü kaç lira»,
   «Kadıköy'de spor salonları» ister. İstek King'in teklifinden ve onaydan
   geçer; BAM kaynaktan tipli bir kayıt yazar (HKM/core/spibilgi.py) ve HKM
   onu `besin.add` / `fiyat.add` / `yer.add` teklifi olarak bırakır.

   Sözler:
     1. HKM YAZMAZ, SPİ YAZAR. Kayıt HKM'den ÇEKİLİR ve SPİ'nin KENDİ
        koduyla yeniden sınanır; HKM'nin süzgecine güvenmek sözleşmeyi karşı
        tarafa devretmek olurdu. Onay anında yeniden çekilir, yeniden sınanır.
     2. EKSİK SIFIR DEĞİLDİR. Kaynakta olmayan mikro besin, doymuş yağ, şeker
        ya da lif BOŞ kalır; SPİ'nin hesabı onu «bilinmiyor» sayar.
     3. FİYAT VE YER TAHMİNDİR. Kullanıcının fişi her zaman önce gelir
        (core/money.js priceOf); BAM fiyatı ancak fiş yoksa, «tahmin» etiketiyle
        ve tarihiyle görünür. TL/kg'yi ve ortancayı SPİ kendisi hesaplar.
     4. GERİ ALINIR. Her yazım kimliğiyle silinir.
     5. İSTEĞE SAĞLIK VERİSİ GİTMEZ: tür, ad, semt, şehir — o kadar. */

window.SP = window.SP || {};

SP.Bilgi = (function(){
  const U = () => SP.U;
  const NIYET = { 'besin.add':'besin', 'fiyat.add':'fiyat', 'yer.add':'yer' };
  const TUR_AD = { besin:'besin değerleri', fiyat:'market fiyatı', yer:'yer listesi' };
  const MAKRO = { kcal:[0, 900], p:[0, 100], f:[0, 100], c:[0, 100], sat:[0, 100],
    fib:[0, 100], sugar:[0, 100] };
  const MIKRO = { iron:[0, 100], calcium:[0, 3000], magnesium:[0, 1000], zinc:[0, 100],
    potassium:[0, 6000], b12:[0, 100], folate:[0, 3000], vitc:[0, 2000], vitd:[0, 100],
    omega3:[0, 40], selenium:[0, 2000], iodine:[0, 5000], sodium:[0, 40000] };
  const FIYAT = [0.5, 100000], MIKTAR = [1, 100000], PORSIYON = [1, 2000];
  const DONEM = ['aylık', 'yıllık', 'günlük', 'seans', 'tek giriş'];
  const FIYAT_ANAHTAR = 'meta/bamFiyat';
  const YER_ANAHTAR = 'meta/yerler';
  const SURE = 5000;

  function bosluk(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function metin(x, az, cok){ const t = bosluk(x); return t.length >= az && t.length <= cok ? t : null; }
  function sayi(x, a){
    if(typeof x !== 'number' || !isFinite(x) || x < a[0] || x > a[1]) return null;
    return Math.round(x * 1000) / 1000;
  }
  function yaz(x){ return U().fmtNum(x); }

  /* ------------------------------------------------------------ HKM */

  function baglanti(){
    const b = SP.Beacon;
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

  /* İstek girdisi KAPALIDIR (HKM spibilgi.temizle ile aynı kural). */
  function istekTemizle(o){
    const tur = o && o.tur;
    if(!TUR_AD[tur]) return { ok:false, why:'Tür besin, fiyat ya da yer olmalı.' };
    const ad = bosluk(o.ad);
    if(ad.length < 2 || ad.length > 60) return { ok:false, why:'Ad 2–60 karakter olmalı.' };
    const bilgi = { tur, ad };
    ['semt', 'sehir'].forEach(k => { const v = bosluk(o[k]); if(v) bilgi[k] = v.slice(0, 60); });
    if(tur === 'yer' && !bilgi.semt && !bilgi.sehir){
      return { ok:false, why:'Yer listesi için semt ya da şehir gerekli.' };
    }
    if(tur === 'besin'){ delete bilgi.semt; delete bilgi.sehir; }
    return { ok:true, bilgi };
  }

  async function iste(o){
    const t = istekTemizle(o);
    if(!t.ok) return { ok:false, metin:t.why };
    const r = await istek('/api/king/emir', { modul:'spi', tur:'spi.bilgi',
      konu:'', neden:'SPİ Mutfak’tan ' + TUR_AD[t.bilgi.tur] + ' istendi.', govde:{ bilgi:t.bilgi } });
    if(!r.bagli) return { ok:false, metin:'Bunu HKM’deki Araştırma Bürosu hazırlar ama HKM bağlı değil. '
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
      : 'King teklif hazırladı (iş emri #' + e.id + '). Onaylarsan Araştırma Bürosu başlar; '
        + 'sonuç Bugün’e teklif olarak gelir.' };
  }

  async function kayitCek(kid){
    const r = await istek('/api/bam/kayit/' + kid);
    return r.ok && r.govde && r.govde.kayit ? r.govde.kayit : null;
  }

  /* ------------------------------------------------------------ sınama (saf) */

  function besinSina(g){
    const d = g.deger || {};
    const v = {};
    Object.keys(MAKRO).forEach(k => { v[k] = sayi(d[k], MAKRO[k]); });
    if(v.kcal == null || v.p == null || v.f == null || v.c == null){
      return { ok:false, why:'Enerji, protein, yağ ve karbonhidratın dördü de gerekli.' };
    }
    if(v.p + v.f + v.c > 101) return { ok:false, why:'Makroların toplamı 100 gramı aşıyor; değerler tutarsız.' };
    const hesap = 4 * v.p + 4 * v.c + 9 * v.f;
    if(Math.abs(hesap - v.kcal) > Math.max(40, 0.25 * v.kcal)){
      return { ok:false, why:'Enerji makrolarla tutmuyor (yazılan ' + Math.round(v.kcal)
        + ' kcal, makrolardan ' + Math.round(hesap) + ' kcal).' };
    }
    const uyari = [];
    if(v.sat != null && v.sat > v.f + 0.5){ v.sat = null; uyari.push('Doymuş yağ toplam yağı aşıyordu; boş bırakıldı.'); }
    if(v.sugar != null && v.sugar > v.c + 0.5){ v.sugar = null; uyari.push('Şeker karbonhidratı aşıyordu; boş bırakıldı.'); }
    const ham = g.micro && typeof g.micro === 'object' ? g.micro : {};
    const micro = {};
    Object.keys(MIKRO).forEach(k => { const x = sayi(ham[k], MIKRO[k]); if(x != null) micro[k] = x; });
    const portions = [], gorulen = {};
    (Array.isArray(g.porsiyonlar) ? g.porsiyonlar : []).slice(0, 12).forEach(p => {
      const label = p && metin(p.ad, 2, 40), gr = p && sayi(p.g, PORSIYON);
      if(label && gr && !gorulen[U().norm(label)] && portions.length < 6){
        gorulen[U().norm(label)] = 1; portions.push({ label, g:gr });
      }
    });
    const ad = metin(g.ad, 2, 60) || metin(g.istenen, 2, 60);
    if(!ad) return { ok:false, why:'Gıdanın adı yok.' };
    const eksik = Object.keys(MIKRO).filter(k => micro[k] == null).length;
    return { ok:true, ad, v, micro, portions, uyari, eksikMikro:eksik };
  }

  function fiyatSina(g){
    const satir = [];
    (Array.isArray(g.fiyatlar) ? g.fiyatlar : []).slice(0, 16).forEach(x => {
      if(!x) return;
      const tl = sayi(x.tl, FIYAT), gr = sayi(x.miktar_g, MIKTAR);
      if(tl == null || gr == null) return;
      const tarih = /^\d{4}-\d{2}(-\d{2})?$/.test(String(x.tarih || '')) ? String(x.tarih) : null;
      satir.push({ market:metin(x.market, 2, 60), tl, g:gr,
        tlKg:U().round(tl / gr * 1000, 2), tarih });
    });
    if(!satir.length) return { ok:false, why:'Kayıtta miktarıyla birlikte geçerli bir fiyat yok.' };
    const orta = U().round(U().median(satir.map(x => x.tlKg)), 2);
    const tarihler = satir.map(x => x.tarih).filter(Boolean).sort();
    return { ok:true, satir, tlKg:orta, tarih:tarihler.length ? tarihler[tarihler.length - 1] : null };
  }

  function yerSina(g){
    const yerler = [], gorulen = {};
    (Array.isArray(g.yerler) ? g.yerler : []).slice(0, 20).forEach(x => {
      const ad = x && metin(x.ad, 2, 80);
      if(!ad || gorulen[U().norm(ad)] || yerler.length >= 10) return;
      gorulen[U().norm(ad)] = 1;
      const tl = sayi(x.fiyat_tl, FIYAT);
      yerler.push({ ad, semt:metin(x.semt, 2, 60), adres:metin(x.adres, 4, 160), tl,
        donem:tl != null && DONEM.indexOf(x.donem) >= 0 ? x.donem : null });
    });
    if(!yerler.length) return { ok:false, why:'Kayıtta geçerli bir yer yok.' };
    return { ok:true, yerler };
  }

  /* `sina(kind, kayit, payload)` — { ok, why } ya da { ok, tur, onizleme, yazilacak }.
     Ağa ÇIKMAZ ve hiçbir şey YAZMAZ; önizleme de onay da bunu çağırır. */
  function sina(kind, kayit, p){
    const tur = NIYET[kind];
    if(!tur) return { ok:false, why:'Bilinmeyen teklif türü.' };
    const g = kayit && kayit.govde;
    const kid = Number(kayit && kayit.id);
    if(!g || !Number.isInteger(kid) || kid < 1 || kid !== Number(p && p.kayit_id)){
      return { ok:false, why:'Kayıt teklifle eşleşmiyor.' };
    }
    if(g.tur !== tur) return { ok:false, why:'Kayıt ' + TUR_AD[tur] + ' biçiminde değil.' };
    const dogrulandi = kayit.dogruluk === 'kaynakli';
    const at = String(kayit.created_at || '').slice(0, 10) || U().todayISO();
    const kaynak = (Array.isArray(g.kaynaklar) ? g.kaynaklar : []).length;

    if(tur === 'besin'){
      const s = besinSina(g);
      if(!s.ok) return s;
      if((SP.S.foods || []).some(f => f.bam && f.bam.kayitId === kid)){
        return { ok:false, why:'Bu besin kaydı zaten eklenmiş.' };
      }
      const uyari = s.uyari.slice();
      const ayni = (SP.FOODS || []).find(f => U().norm(f.name) === U().norm(s.ad));
      if(ayni) uyari.push('Tabloda aynı adlı «' + ayni.name + '» var; bu ayrı bir gıda olarak eklenir.');
      if(!dogrulandi) uyari.push('Kaynaksız ya da doğrulanmadı: ambalajdaki besin etiketiyle karşılaştır.');
      const food = Object.assign(SP.Model.newFood(), { name:s.ad, cat:'diger',
        kcal:s.v.kcal, p:s.v.p, f:s.v.f, c:s.v.c, sat:s.v.sat, sugar:s.v.sugar, fib:s.v.fib,
        micro:s.micro, portions:s.portions,
        bam:{ kayitId:kid, dogruluk:dogrulandi ? 'kaynakli' : 'dogrulanmadi', at, kaynak } });
      /* DİYETE İŞLEME (8c-3): hedef payını nutri.js hesaplar; profil eksikse
         pay yazılmaz, uydurulmaz. */
      const t = SP.Nutri && SP.Nutri.targets ? SP.Nutri.targets() : null;
      const pay = t && t.ok && t.protein && t.protein.min
        ? ['100 g, günlük protein hedefinin (' + Math.round(t.protein.min) + ' g) %'
          + Math.round(s.v.p / t.protein.min * 100) + '’ini karşılar (hesaplandı)'] : [];
      return { ok:true, tur, yazilacak:{ food },
        onizleme:{ baslik:s.ad + ' — 100 g', satirlar:pay.concat([
          yaz(s.v.kcal) + ' kcal · protein ' + yaz(s.v.p) + ' g · yağ ' + yaz(s.v.f)
            + ' g · karbonhidrat ' + yaz(s.v.c) + ' g',
          (Object.keys(s.micro).length + ' mikro besin kaynaklı; ' + s.eksikMikro
            + ' tanesi bilinmiyor (sıfır sayılmaz)'),
          dogrulandi ? 'Etiket: BAM · kaynaklı (' + kaynak + ' kaynak)' : 'Etiket: BAM · doğrulanmadı']),
        uyari } };
    }

    if(tur === 'fiyat'){
      const s = fiyatSina(g);
      if(!s.ok) return s;
      const ad = metin(g.ad, 2, 60) || '';
      const foodId = SP.Parse && SP.Parse.matchFood ? SP.Parse.matchFood(ad) : null;
      const food = foodId && SP.FOOD_BY_ID[foodId];
      if(!food){
        return { ok:false, why:'«' + ad + '» SPİ’nin gıda tablosunda yok; fiyat bir gıdaya '
          + 'bağlanmadan yazılmaz. Önce gıdayı ekle (besin değerlerini de isteyebilirsin).' };
      }
      const uyari = [];
      const kendi = SP.S.prices && SP.S.prices[foodId];
      if(kendi && kendi.tl) uyari.push('Kendi fişin (' + yaz(kendi.tl) + ' TL/kg) önce gelir; bu tahmin onun altında durur.');
      /* Gram protein başına maliyet (8c-3): «en ucuz protein» listesiyle aynı
         formül (money.js costPerNutrient): TL/kg ÷ (100 g'daki protein × 10). */
      const proteinTl = food.p > 0 ? ['Gram protein başına ' + U().fmtNet(U().round(s.tlKg / (food.p * 10), 3))
        + ' TL (hesaplandı; fiyat tahmin)'] : [];
      return { ok:true, tur, yazilacak:{ foodId, fiyat:{ tl:s.tlKg, at:s.tarih || at, kayitId:kid,
          n:s.satir.length, source:'bam' } },
        onizleme:{ baslik:food.name + ' — ortanca ' + yaz(s.tlKg) + ' TL/kg (tahmin)',
          satirlar:proteinTl.concat(s.satir.map(x => (x.market || 'market') + ': ' + yaz(x.tl) + ' TL / '
            + yaz(x.g) + ' g = ' + yaz(x.tlKg) + ' TL/kg' + (x.tarih ? ' · ' + x.tarih : ''))),
          uyari } };
    }

    const s = yerSina(g);
    if(!s.ok) return s;
    if((SP.S.yerler || []).some(y => y.kayitId === kid)) return { ok:false, why:'Bu yer listesi zaten eklenmiş.' };
    const baslik = metin(g.ad, 2, 60) || 'Yer listesi';
    const konum = [metin(g.semt, 2, 60), metin(g.sehir, 2, 60)].filter(Boolean).join(', ');
    return { ok:true, tur, yazilacak:{ yer:{ id:'bam-' + kid, kayitId:kid, baslik, konum,
        yerler:s.yerler, at, etiket:'tahmin' } },
      onizleme:{ baslik:baslik + (konum ? ' · ' + konum : '') + ' — ' + s.yerler.length + ' yer (tahmin)',
        satirlar:s.yerler.map(y => y.ad + (y.semt ? ' · ' + y.semt : '')
          + (y.tl != null ? ' · ' + yaz(y.tl) + ' TL' + (y.donem ? ' ' + y.donem : '') : ' · fiyat bilinmiyor')),
        uyari:[] } };
  }

  /* ------------------------------------------------------------ depo */

  async function fiyatYaz(){ await SP.Store.set(FIYAT_ANAHTAR, SP.S.bamPrices || {}); }
  async function yerYaz(){ await SP.Store.set(YER_ANAHTAR, { liste:SP.S.yerler || [] }); }

  async function yukle(){
    let f = null, y = null;
    try{ f = await SP.Store.get(FIYAT_ANAHTAR); }catch(e){ f = null; }
    try{ y = await SP.Store.get(YER_ANAHTAR); }catch(e){ y = null; }
    SP.S.bamPrices = f && typeof f === 'object' ? f : {};
    SP.S.yerler = y && Array.isArray(y.liste) ? y.liste.filter(x => x && x.id) : [];
  }

  async function yazSonuc(s){
    const y = s.yazilacak;
    if(s.tur === 'besin'){
      await SP.Model.saveFood(y.food);
      return { tur:'besin', id:y.food.id, note:y.food.name + ' kendi gıdaların arasına eklendi; '
        + 'öğün girişinde ve hesaplarda görünür.' };
    }
    if(s.tur === 'fiyat'){
      SP.S.bamPrices = SP.S.bamPrices || {};
      const onceki = SP.S.bamPrices[y.foodId] || null;
      SP.S.bamPrices[y.foodId] = y.fiyat;
      await fiyatYaz();
      return { tur:'fiyat', id:y.foodId, onceki, note:(SP.FOOD_BY_ID[y.foodId] || {}).name
        + ' için ' + yaz(y.fiyat.tl) + ' TL/kg tahmin yazıldı; kendi fişin her zaman önce gelir.' };
    }
    SP.S.yerler = (SP.S.yerler || []).concat([y.yer]);
    await yerYaz();
    return { tur:'yer', id:y.yer.id, note:y.yer.baslik + ' Mutfak › Yerler’e eklendi (' + y.yer.yerler.length + ' yer).' };
  }

  /* Teklif kartındaki önizleme — HKM'den çeker, sınar, YAZMAZ. */
  async function onizle(n){
    if(!n || !NIYET[n.kind]) return null;
    const kayit = await kayitCek(Number(n.payload && n.payload.kayit_id));
    if(!kayit) return { ok:false, why:'Kayıt HKM’den alınamadı; HKM açıkken yeniden dene.' };
    return sina(n.kind, kayit, n.payload || {});
  }

  /* Onay: YENİDEN çekilir, YENİDEN sınanır, sonra yazılır. */
  async function uygula(kind, p){
    if(!NIYET[kind]) return { ok:false, error:'Bilinmeyen teklif türü.' };
    const kid = Number(p && p.kayit_id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, error:'Kayıt kimliği geçersiz.' };
    if(!baglanti()) return { ok:false, error:'HKM bağlantısı kurulmamış; kayıt alınamaz.' };
    const kayit = await kayitCek(kid);
    if(!kayit) return { ok:false, error:'Kayıt HKM’den alınamadı; HKM açıkken yeniden dene.' };
    const s = sina(kind, kayit, p);
    if(!s.ok) return { ok:false, error:s.why };
    const r = await yazSonuc(s);
    return { ok:true, note:r.note, geriAl:{ tur:r.tur, id:r.id, onceki:r.onceki || null } };
  }

  async function geriAl(g){
    if(!g) return { ok:false };
    if(g.tur === 'besin'){ await SP.Model.deleteFood(g.id); return { ok:true }; }
    if(g.tur === 'fiyat'){
      SP.S.bamPrices = SP.S.bamPrices || {};
      if(g.onceki) SP.S.bamPrices[g.id] = g.onceki; else delete SP.S.bamPrices[g.id];
      await fiyatYaz();
      return { ok:true };
    }
    return await yerSil(g.id);
  }

  function yerler(){ return (SP.S.yerler || []).slice(); }

  /* Yer karşılaştırması (fikir 37): aylık karşılık HESAPLANIR; yalnız
     çevrilebilen çevrilir (yıllık/12). Günlük, seans ve tek giriş kullanım
     sıklığı bilinmeden aylığa çevrilmez — «karşılaştırılamaz». */
  const AYLIK_CARPAN = { 'aylık':1, 'yıllık':1 / 12 };
  function yerKarsilastir(l){
    const satirlar = ((l && l.yerler) || []).map(y => {
      const c = AYLIK_CARPAN[y.donem];
      const aylik = y.tl != null && c != null ? Math.round(y.tl * c) : null;
      return { ad:y.ad, semt:y.semt || null, tl:y.tl, donem:y.donem || null, aylik,
        not:y.tl == null ? 'fiyat bilinmiyor' : (aylik == null ? 'karşılaştırılamaz' : 'hesaplandı') };
    });
    satirlar.sort((a, b) => (a.aylik == null) - (b.aylik == null) || (a.aylik || 0) - (b.aylik || 0)
      || (a.tl == null) - (b.tl == null));
    const ilk = satirlar.find(x => x.aylik != null);
    return { satirlar, enUcuz:ilk ? ilk.ad : null };
  }
  async function yerSil(id){
    const once = (SP.S.yerler || []).length;
    SP.S.yerler = (SP.S.yerler || []).filter(y => y.id !== id);
    await yerYaz();
    return { ok:SP.S.yerler.length < once };
  }
  async function yerGeri(kayit){
    if(!kayit || (SP.S.yerler || []).some(y => y.id === kayit.id)) return;
    SP.S.yerler = (SP.S.yerler || []).concat([kayit]);
    await yerYaz();
  }

  return { yerKarsilastir, NIYET, TUR_AD, istekTemizle, iste, kayitCek, sina, onizle, uygula, geriAl,
    yukle, yerler, yerSil, yerGeri };
})();
