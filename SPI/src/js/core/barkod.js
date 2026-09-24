/* BARKOD (fikir 4) — kişisel barkod defteri.

   Sözler:
     1. DIŞ VERİTABANI YOK. SPİ sıfır bağımlılıklıdır ve markete ya da bir
        ürün veritabanına sormaz. Bir barkod ilk okutulduğunda kullanıcı onu
        listeden bir gıdaya BAĞLAR; sonraki okutmada gıda doğrudan gelir.
        Bilinmeyen barkod için gıda TAHMİN EDİLMEZ, sorulur (AGENTS §1.7).
     2. KONTROL HANESİ DENETLENİR. EAN-13, EAN-8 ve UPC-A'nın son hanesi
        öbürlerinden hesaplanır; tutmayan numara yanlış okunmuştur ve
        kaydedilmez. UPC-A (12 hane) başına 0 eklenerek EAN-13 olur: aynı
        ürün iki farklı anahtarla iki kez sorulmaz.
     3. FOTOĞRAFTAN OKUMA TARAYICIYA BAĞLIDIR. `BarcodeDetector` olan
        tarayıcıda (Chrome/Android) fotoğraftan okunur; olmayanda numara
        elle yazılır ve bu söylenir. Fotoğrafta birden çok farklı barkod
        varsa biri SEÇİLMEZ, yeniden çekmesi istenir. */

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

  return { yukle, liste, normal, gecerli, denetle, bul, bagla, coz, fotoVar, fotodan };
})();
