/* BARKOD (fikir 4) — kişisel barkod defteri.

   Sözler:
     1. ÖNCE KİŞİSEL DEFTER. Bir barkod ilk okutulduğunda kullanıcı onu
        listeden bir gıdaya BAĞLAR; sonraki okutmada gıda doğrudan gelir.
        Bilinmeyen barkod için gıda TAHMİN EDİLMEZ (AGENTS §1.7): defterde
        yoksa ve kullanıcı King'den istediyse ücretsiz ve anahtarsız Open
        Food Facts'e sorulur (`disBul`; King 3.0 K5, 2026-10-21). Gelen değer
        ürün etiketinden derlenmiş açık veridir: kaynak etiketi «Open Food
        Facts · doğrulanmadı» yazılır, eksik alan sıfır değil boş kalır;
        ürün orada da yoksa «veri yok». Sorgu yalnız barkod numarasıdır.
     2. KONTROL HANESİ DENETLENİR. EAN-13, EAN-8 ve UPC-A'nın son hanesi
        öbürlerinden hesaplanır; tutmayan numara yanlış okunmuştur ve
        kaydedilmez. UPC-A (12 hane) başına 0 eklenerek EAN-13 olur: aynı
        ürün iki farklı anahtarla iki kez sorulmaz.
     3. FOTOĞRAFTAN OKUMA TARAYICIYA BAĞLIDIR. `BarcodeDetector` olan
        tarayıcıda (Chrome/Android) fotoğraftan okunur; olmayanda numara
        elle yazılır ve bu söylenir. Fotoğrafta birden çok farklı barkod
        varsa biri SEÇİLMEZ, yeniden çekmesi istenir. King'den gelen
        fotoğrafta ya da kamera karesinde BarcodeDetector yoksa Merkez'in
        görsel modeli numarayı okur (`modelden`); kontrol hanesi tutmayan
        okuma yine reddedilir: model numara uyduramaz. */

window.SP = window.SP || {};

SP.Barkod = (function(){
  const KEY = 'barkodlar';

  function liste(){
    if(!SP.S.barkodlar || typeof SP.S.barkodlar !== 'object') SP.S.barkodlar = {};
    return SP.S.barkodlar;
  }
  async function yukle(){
    const d = await SP.Store.get(KEY);
    SP.S.barkodlar = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
    return SP.S.barkodlar;
  }

  /* Rakam dışını at; 12 haneli UPC-A → 13 haneli EAN. */
  function normal(kod){
    const s = String(kod == null ? '' : kod).replace(/\D/g, '');
    return s.length === 12 ? '0' + s : s;
  }

  function gecerli(kod){
    const s = normal(kod);
    if(s.length !== 8 && s.length !== 13) return false;
    let t = 0;
    for(let i = s.length - 2, k = 3; i >= 0; i--, k = k === 3 ? 1 : 3) t += Number(s[i]) * k;
    return (10 - t % 10) % 10 === Number(s[s.length - 1]);
  }

  function denetle(kod){
    const s = normal(kod);
    if(!s) return { ok:false, why:'Barkod numarasını yaz.' };
    if(s.length !== 8 && s.length !== 13) return { ok:false, why:'Barkod 8, 12 ya da 13 haneli olur; «' + s + '» ' + s.length + ' haneli.' };
    if(!gecerli(s)) return { ok:false, why:'Bu numaranın kontrol hanesi tutmuyor; yanlış okunmuş olabilir. Yeniden okut ya da kontrol et.' };
    return { ok:true, kod:s };
  }

  /* Kayıtlı ve gıdası hâlâ duran eşleşme; silinmiş gıdaya bağlıysa yok. */
  function bul(kod){
    const id = liste()[normal(kod)];
    return id && SP.FOOD_BY_ID && SP.FOOD_BY_ID[id] ? id : null;
  }

  async function bagla(kod, foodId){
    const d = denetle(kod);
    if(!d.ok) return d;
    if(!SP.FOOD_BY_ID || !SP.FOOD_BY_ID[foodId]) return { ok:false, why:'Gıda bulunamadı.' };
    liste()[d.kod] = foodId;
    await SP.Store.set(KEY, liste());
    return { ok:true, kod:d.kod };
  }

  async function coz(kod){
    const d = denetle(kod);
    if(!d.ok) return d;
    const id = bul(d.kod);
    return { ok:true, kod:d.kod, foodId:id };
  }

  function fotoVar(){ return typeof window.BarcodeDetector === 'function'; }

  async function fotodan(dosya){
    if(!fotoVar()) return { ok:false, why:'Bu tarayıcı fotoğraftan barkod okuyamıyor; numarayı elle yaz.' };
    let bulunan;
    try{
      const det = new window.BarcodeDetector({ formats:['ean_13', 'ean_8', 'upc_a'] });
      bulunan = await det.detect(await createImageBitmap(dosya));
    }catch(e){
      return { ok:false, why:'Fotoğraf okunamadı; numarayı elle yaz.' };
    }
    const kodlar = [];
    (bulunan || []).forEach(b => {
      const s = normal(b && b.rawValue);
      if(gecerli(s) && kodlar.indexOf(s) < 0) kodlar.push(s);
    });
    if(!kodlar.length) return { ok:false, why:'Fotoğrafta okunabilir bir barkod bulunamadı; daha yakından çek ya da numarayı elle yaz.' };
    if(kodlar.length > 1) return { ok:false, why:'Fotoğrafta birden çok barkod var; yalnız birini çek.' };
    return coz(kodlar[0]);
  }

  /* Söz 3: görsel modelin cevabındaki rakam dizileri; tutan tek numara. */
  function metindenKod(metin){
    const adaylar = [];
    const t = String(metin || '');
    (t.match(/\d[\d -]{6,20}\d/g) || []).concat(t.match(/\d{8,13}/g) || []).forEach(m => {
      const s = normal(m);
      if(gecerli(s) && adaylar.indexOf(s) < 0) adaylar.push(s);
    });
    if(!adaylar.length) return { ok:false, why:'Barkodun numarasını okuyamadım; daha yakından çek ya da numarayı yaz.' };
    if(adaylar.length > 1) return { ok:false, why:'Görüntüde birden çok barkod var; yalnız birini göster.' };
    return { ok:true, kod:adaylar[0] };
  }
  async function modelden(gorsel){
    if(typeof gorsel !== 'function') return { ok:false, why:'Bu tarayıcı barkod okuyamıyor ve görüntü okuyan model bağlı değil; numarayı yaz.' };
    let r = null;
    try{ r = await gorsel('Görüntüdeki barkodun altındaki rakamları aynen yaz. Yalnız rakamlar; barkod yoksa «yok» yaz.', 'gorsel'); }catch(e){ r = null; }
    if(!r || !r.ok) return { ok:false, why:'Görsel model barkodu okuyamadı' + (r && r.note ? ' (' + r.note + ')' : '') + '; numarayı yaz.' };
    const k = metindenKod(r.text);
    return k.ok ? coz(k.kod) : k;
  }
  /* King'den: önce cihazın okuyucusu, olmazsa görsel model. */
  async function oku(dosya, gorsel){
    if(fotoVar()){
      const r = await fotodan(dosya);
      if(r.ok || !gorsel || /birden çok/.test(r.why || '')) return r;
    }
    return modelden(gorsel);
  }

  /* Söz 1: Open Food Facts (ücretsiz, anahtarsız). Değerler 100 g içindir. */
  const OFF = 'https://world.openfoodfacts.org/api/v2/product/';
  const OFF_ALAN = 'product_name,product_name_tr,brands,nutriments,serving_quantity,serving_size';
  const sayi = v => { const n = Number(v); return v == null || v === '' || !isFinite(n) || n < 0 ? null : Math.round(n * 10) / 10; };
  async function disBul(kod){
    const d = denetle(kod);
    if(!d.ok) return d;
    const f = api.ag || (typeof fetch === 'function' ? (u, o) => fetch(u, o) : null);
    if(!f) return { ok:false, why:'İnternete ulaşılamıyor.' };
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), 9000) : null;
    let j = null;
    try{
      const res = await f(OFF + d.kod + '.json?fields=' + OFF_ALAN, { headers:{ Accept:'application/json' }, signal:ctrl ? ctrl.signal : undefined });
      if(res.status === 404) return { ok:true, kod:d.kod, urun:null };
      if(!res.ok) return { ok:false, why:'Open Food Facts cevap vermedi (' + res.status + ').' };
      j = await res.json();
    }catch(e){
      return { ok:false, why:'Open Food Facts’e ulaşılamadı; internet bağlantını kontrol et.' };
    }finally{ if(t) clearTimeout(t); }
    const p = j && Number(j.status) === 1 ? j.product : null;
    const ad = p && String(p.product_name_tr || p.product_name || '').trim();
    if(!p || !ad) return { ok:true, kod:d.kod, urun:null };
    const n = p.nutriments || {};
    const kj = sayi(n['energy-kj_100g']);
    const v = { kcal:sayi(n['energy-kcal_100g']), p:sayi(n.proteins_100g), f:sayi(n.fat_100g), c:sayi(n.carbohydrates_100g),
      sat:sayi(n['saturated-fat_100g']), sugar:sayi(n.sugars_100g), fib:sayi(n.fiber_100g) };
    if(v.kcal == null && kj != null) v.kcal = Math.round(kj / 4.184);
    const g = sayi(p.serving_quantity);
    return { ok:true, kod:d.kod, urun:{ ad:ad.slice(0, 80), marka:String(p.brands || '').split(',')[0].trim().slice(0, 40),
      v, porsiyon:g && g > 0 && g <= 2000 ? { g, ad:String(p.serving_size || '').trim().slice(0, 30) } : null,
      kaynak:'Open Food Facts · doğrulanmadı' } };
  }
  /* Open Food Facts ürünü kişisel tabloya girecek gıda (kaydı çağıran yapar). */
  function gidaYap(urun, kod){
    const v = urun.v || {};
    return Object.assign(SP.Model.newFood(), { name:urun.ad + (urun.marka && urun.ad.indexOf(urun.marka) < 0 ? ' (' + urun.marka + ')' : ''),
      cat:'diger', kcal:v.kcal, p:v.p, f:v.f, c:v.c, sat:v.sat, sugar:v.sugar, fib:v.fib,
      portions:urun.porsiyon ? [{ label:'1 porsiyon' + (urun.porsiyon.ad ? ' (' + urun.porsiyon.ad + ')' : ''), g:urun.porsiyon.g }] : [],
      kaynak:{ ad:'Open Food Facts', barkod:kod, dogruluk:'dogrulanmadi', at:SP.U.todayISO() } });
  }

  const api = { yukle, liste, normal, gecerli, denetle, bul, bagla, coz, fotoVar, fotodan, metindenKod, modelden, oku, disBul, gidaYap, ag:null };
  return api;
})();
