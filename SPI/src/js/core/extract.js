/* Belge ve fotograftan veri cikarma.

   Ekranlar modeli TANIMAZ. Hepsi bu modulden gecer; saglayici degisince,
   model kapaliyken ya da cevrimdisiyken ekranlara dokunulmaz.

   Uc degismez:

     1. Uygulama modelsiz calismaya devam eder. Metin dosyasi ve
        yapistirilan metin modelsiz ayristirilir; model yalnizca metin
        ayristiricinin cozemedigi yerde devreye girer.

     2. Model dogrudan depoya YAZMAZ. Cikan her sonuc, tahlil
        yapistirmadaki "ayiklandi -> gozden gecir -> kaydet" adimina
        baglanir. Kullanici gormeden hicbir sey kaydedilmez.

     3. Model uydurma kimlik dondurmez. Cikti bizim tablolarimiza
        (SP.BIOMARKERS, SP.FOODS) eslenir; eslesmeyen satir atilmaz,
        "eslesmedi" olarak gosterilir.

   Kesinlik eslemesi yeni etiket icat etmez:

     tahlil belgesi -> olculdu   (laboratuvar olctu, biz okuduk)
     market fisi    -> olculdu   (fiyat fiste yazili)
     yemek fotografi-> tahmin    (porsiyonu model tahmin ediyor)

   MAHREMIYET DIKISI: disari cikan her istek `send()` icinden gecer.
   Sistem su an aile ici kullanildigi icin arindirma yapilmiyor; genele
   acilirken PDF'ten kimlik alanlarini kesme ve fotograftan EXIF silme
   adimi TEK BIR YERE, oraya takilir. */

window.SP = window.SP || {};

SP.Extract = (function(){
  const U = SP.U;

  const MAX_BYTES = 8 * 1024 * 1024;   /* 8 MB: buyuk dosya modele gitmez */

  function isImage(file){ return /^image\//.test(file.type); }
  function isPdf(file){ return file.type === 'application/pdf' || /\.pdf$/i.test(file.name); }
  function isText(file){
    return /^text\//.test(file.type)
      || /\.(txt|csv|md|json)$/i.test(file.name)
      || file.type === 'application/json';
  }

  function readText(file){
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = () => reject(new Error('Dosya okunamadı.'));
      fr.readAsText(file, 'utf-8');
    });
  }

  function readDataUrl(file){
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = () => reject(new Error('Dosya okunamadı.'));
      fr.readAsDataURL(file);
    });
  }

  /* data:image/png;base64,XXXX  ->  { mime, b64 } */
  function splitDataUrl(url){
    const m = /^data:([^;,]+)(?:;base64)?,(.*)$/.exec(url || '');
    if(!m) return null;
    return { mime:m[1], b64:m[2] };
  }

  function modelReady(){
    try{
      const s = SP.Office.settings();
      return SP.LLM.ready({ provider:s.provider, model:s.model });
    }catch(e){ return false; }
  }

  /* ---------------------------------------------------------- gonderim

     Disari cikan TEK nokta. Arindirma buraya takilacak. */
  async function send(req){
    const s = SP.Office.settings();
    return SP.LLM.chat(Object.assign({
      provider:s.provider,
      model:s.model,
      temperature:0,
      maxTokens:2000,
    }, req));
  }

  /* Modelin JSON dondurmesi istenir ama dondurmeyebilir; metnin icindeki
     ilk JSON blogu ayiklanir. Bulunamazsa hata degil BOS sonuc doner:
     kullanici elle girmeye devam eder. */
  function parseJson(text){
    if(!text) return null;
    const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
    const body = fenced ? fenced[1] : text;
    const start = body.search(/[[{]/);
    if(start < 0) return null;
    const end = Math.max(body.lastIndexOf(']'), body.lastIndexOf('}'));
    if(end <= start) return null;
    try{ return JSON.parse(body.slice(start, end + 1)); }
    catch(e){ return null; }
  }

  /* ------------------------------------------------------------ tahlil

     Once METIN ayristiricisi denenir (modelsiz, aninda, bedava). Yalniz
     o hicbir sey bulamazsa ve elimizde bir goruntu varsa model devreye
     girer. Bu sira kasitlidir: calisan bir ayristiriciyi varken modele
     para ve saniye harcamak dogru degil. */
  const LAB_PROMPT =
    'Asagidaki tahlil raporundan olcum adi, degeri ve birimini cikar. '
    + 'Yalniz JSON dizisi dondur, baska hicbir sey yazma. Bicim: '
    + '[{"ad":"Ferritin","deger":26,"birim":"ng/mL"}]. '
    + 'Emin olmadigin satiri ATLA. Deger okunamiyorsa o satiri hic yazma. '
    + 'Tarihi, hasta bilgisini ve yorumu dondurme.';

  async function fromLabFile(file){
    if(!file) return empty('Dosya seçilmedi.');
    if(file.size > MAX_BYTES) return empty('Dosya çok büyük (en fazla 8 MB).');

    /* 1. Metin dosyasi: dogrudan ayristirici. */
    if(isText(file)){
      const text = await readText(file);
      const res = SP.Parse.parseLab(text);
      res.source = 'file';
      return res;
    }

    /* 2. Goruntu ya da PDF: model gerekir. */
    if(!isImage(file) && !isPdf(file)){
      return empty('Bu dosya türü okunamıyor. PDF, görüntü ya da metin dosyası ver.');
    }
    if(!modelReady()){
      return empty('Görüntü ve PDF okumak için Ayarlar → Rehber → Model bölümünden '
        + 'bir model bağlaman gerekiyor. Rapor metnini yapıştırarak modelsiz de girebilirsin.');
    }
    if(isPdf(file)){
      return empty('PDF doğrudan okunamıyor. Raporun ekran görüntüsünü ver ya da '
        + 'metnini yapıştır.');
    }

    const parts = splitDataUrl(await readDataUrl(file));
    if(!parts) return empty('Görüntü okunamadı.');

    let out;
    try{
      out = await send({
        system:'Sen bir tahlil raporu okuyucususun. Yalniz JSON dondurursun.',
        messages:[{ role:'user', text:LAB_PROMPT, images:[parts] }],
      });
    }catch(e){
      return empty('Model yanıt vermedi: ' + (e && e.message ? e.message : 'bilinmeyen hata'));
    }

    const rows = parseJson(out && out.text);
    if(!Array.isArray(rows) || !rows.length){
      return empty('Görüntüden ölçüm çıkarılamadı. Rapor metnini yapıştırmayı dene.');
    }

    /* Model satirlarini BIZIM ayristiricimiza geri veriyoruz: takma ad
       eslemesi, birim cevirimi ve esiklerin hepsi orada tanimli. Boylece
       modelin ciktisi da ayni denetimden geciyor. */
    const text = rows
      .map(r => [r.ad, r.deger, r.birim].filter(x => x != null && x !== '').join(' '))
      .join('\n');
    const res = SP.Parse.parseLab(text);
    res.source = 'photo';
    res.note = res.note + ' · görüntüden okundu';
    return res;
  }

  /* ------------------------------------------------------------- ogun

     Fotograf tek basina zayif bir kaynaktir: porsiyon buyuklugu
     fotograftan guvenilir cikmaz. Bu yuzden uc kisa not sorulur --
     ne kadari yendi, kabin olcusu, gizli malzeme. Tahmini guclendiren
     sey bu uc bilgidir ve sorulmadan verilmez. */
  function mealPrompt(hints){
    const names = SP.FOODS.map(f => f.id + '=' + f.name).join(', ');
    let p = 'Fotograftaki yemegi asagidaki listeden SEC ve gram olarak tahmin et. '
      + 'Yalniz JSON dizisi dondur: [{"id":"pilav","gram":180}]. '
      + 'Listede olmayan bir sey icin id yerine ad yaz: [{"ad":"lahmacun","gram":120}]. '
      + 'Emin olmadigin seyi yazma.\n\nListe: ' + names;
    const h = [];
    if(hints && hints.amount) h.push('Tabagin ' + hints.amount + ' kadari yendi.');
    if(hints && hints.vessel) h.push('Kabin olcusu: ' + hints.vessel + '.');
    if(hints && hints.extra)  h.push('Ek bilgi: ' + hints.extra + '.');
    if(h.length) p += '\n\nKullanicinin notu: ' + h.join(' ');
    return p;
  }

  async function fromMealPhoto(file, hints){
    if(!file) return { ok:false, items:[], unmatched:[], note:'Fotoğraf seçilmedi.' };
    if(file.size > MAX_BYTES){
      return { ok:false, items:[], unmatched:[], note:'Fotoğraf çok büyük (en fazla 8 MB).' };
    }
    if(!isImage(file)){
      return { ok:false, items:[], unmatched:[], note:'Bu bir görüntü dosyası değil.' };
    }
    if(!modelReady()){
      return { ok:false, items:[], unmatched:[],
        note:'Fotoğraftan öğün okumak için bir model bağlaman gerekiyor. '
          + 'Öğünü tek satır yazarak modelsiz de girebilirsin.' };
    }

    const parts = splitDataUrl(await readDataUrl(file));
    if(!parts) return { ok:false, items:[], unmatched:[], note:'Fotoğraf okunamadı.' };

    let out;
    try{
      out = await send({
        system:'Sen bir yemek fotografi okuyucususun. Yalniz JSON dondurursun.',
        messages:[{ role:'user', text:mealPrompt(hints), images:[parts] }],
      });
    }catch(e){
      return { ok:false, items:[], unmatched:[],
        note:'Model yanıt vermedi: ' + (e && e.message ? e.message : 'bilinmeyen hata') };
    }

    const rows = parseJson(out && out.text);
    if(!Array.isArray(rows) || !rows.length){
      return { ok:false, items:[], unmatched:[],
        note:'Fotoğraftan yemek çıkarılamadı. Öğünü yazarak girebilirsin.' };
    }

    /* Kimlik eslemesi: model uydurursa oraya DUSMEZ, "eslesmedi" olur. */
    const items = [], unmatched = [];
    rows.forEach(r => {
      const g = Number(r.gram);
      if(!isFinite(g) || g <= 0){ unmatched.push({ line:String(r.ad || r.id || '') }); return; }
      let food = r.id ? SP.FOOD_BY_ID[r.id] : null;
      if(!food && r.ad){
        const q = U.norm(String(r.ad));
        food = SP.FOODS.find(f => U.norm(f.name) === q)
          || SP.FOODS.find(f => (f.aliases || []).some(a => U.norm(a) === q));
      }
      if(!food){ unmatched.push({ line:String(r.ad || r.id || '') + ' · ' + g + ' g' }); return; }
      /* Fotograftan gelen gramaj her zaman TAHMINDIR. Kullanici tartip
         duzeltirse "olculdu" olur; bu zaten var olan davranis. */
      items.push({ foodId:food.id, g:Math.round(g), cert:'estimated', portion:'fotoğraf' });
    });

    return {
      ok:items.length > 0, items, unmatched,
      note:items.length
        ? items.length + ' gıda tanındı · gramaj tahmin'
        : 'Tanınan gıda listemizde yok.',
    };
  }

  /* -------------------------------------------------------------- fis

     Market fisi fiyat tablosunun curumesini cozer: tohum tahminler
     kullanicinin gercek fiyatiyla degisir ve "olculdu" olur. */
  const RECEIPT_PROMPT =
    'Asagidaki market fisinden urun adi ve KILOGRAM BASINA fiyati cikar. '
    + 'Yalniz JSON dizisi dondur: [{"ad":"kuru fasulye","tlKg":120}]. '
    + 'Fis toplam fiyat ve agirlik veriyorsa kilogram fiyatini hesapla. '
    + 'Emin olmadigin satiri atla. Toplam, kdv ve kasa satirlarini yazma.';

  async function fromReceipt(file){
    if(!file) return { ok:false, rows:[], unmatched:[], note:'Dosya seçilmedi.' };
    if(file.size > MAX_BYTES){
      return { ok:false, rows:[], unmatched:[], note:'Dosya çok büyük (en fazla 8 MB).' };
    }

    let userText = null;
    if(isText(file)) userText = await readText(file);
    else if(!isImage(file)){
      return { ok:false, rows:[], unmatched:[],
        note:'Fiş için görüntü ya da metin dosyası ver.' };
    }
    if(!modelReady()){
      return { ok:false, rows:[], unmatched:[],
        note:'Fiş okumak için bir model bağlaman gerekiyor. Fiyatları Finans → Fiyat '
          + 'sayfasından elle de girebilirsin.' };
    }

    const msg = { role:'user', text:RECEIPT_PROMPT + (userText ? '\n\n' + userText : '') };
    if(!userText){
      const parts = splitDataUrl(await readDataUrl(file));
      if(!parts) return { ok:false, rows:[], unmatched:[], note:'Görüntü okunamadı.' };
      msg.images = [parts];
    }

    let out;
    try{
      out = await send({ system:'Sen bir market fisi okuyucususun. Yalniz JSON dondurursun.',
        messages:[msg] });
    }catch(e){
      return { ok:false, rows:[], unmatched:[],
        note:'Model yanıt vermedi: ' + (e && e.message ? e.message : 'bilinmeyen hata') };
    }

    const parsed = parseJson(out && out.text);
    if(!Array.isArray(parsed) || !parsed.length){
      return { ok:false, rows:[], unmatched:[], note:'Fişten fiyat çıkarılamadı.' };
    }

    const rows = [], unmatched = [];
    parsed.forEach(r => {
      const tl = Number(r.tlKg);
      if(!isFinite(tl) || tl <= 0){ unmatched.push({ line:String(r.ad || '') }); return; }
      const q = U.norm(String(r.ad || ''));
      const food = SP.FOODS.find(f => U.norm(f.name) === q)
        || SP.FOODS.find(f => (f.aliases || []).some(a => U.norm(a) === q))
        || SP.FOODS.find(f => U.norm(f.name).indexOf(q) >= 0 && q.length >= 4);
      if(!food){ unmatched.push({ line:String(r.ad || '') + ' · ' + tl + ' TL/kg' }); return; }
      rows.push({ food, tl:Math.round(tl * 100) / 100, skip:false });
    });

    return {
      ok:rows.length > 0, rows, unmatched,
      note:rows.length ? rows.length + ' ürün eşleşti' : 'Eşleşen ürün yok.',
    };
  }

  function empty(note){
    return { rows:[], unmatched:[], note, date:U.todayISO(), lab:'' };
  }

  return {
    supported:modelReady, modelReady,
    isImage, isPdf, isText,
    readText, readDataUrl,
    fromLabFile, fromMealPhoto, fromReceipt,
    parseJson, send, MAX_BYTES,
  };
})();
