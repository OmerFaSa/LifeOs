/* Sifir surtunmeli giris — serbest metni yapiya cevirir.

   PDF'in "Zorluk Alani" tablosunun kod karsiligi burasidir:

     Onlarca parametreyi elle forma yazmak   →  raporu yapistir, ayiklansin
     Her lokmayi tartip gramaj girmek        →  "1 tabak etli kuru fasulye" yaz

   Iki ayristirici da AYNI ILKEYE uyar: emin olamadigi satiri sessizce ATMAZ
   ve uydurmaz. Eslesmeyen satir "eslesmedi" olarak geri doner, kullanici
   elle baglar. Sistemin en tehlikeli hatasi yanlis veriyi dogru sanmaktir. */

window.SP = window.SP || {};

SP.Parse = (function(){
  const U = SP.U;

  /* ------------------------------------------------------------ ortak yardim */

  /* Turkce sayilar hem "12,5" hem "12.5" yazilir. Ikisi de kabul edilir.
     Binlik ayraci olarak nokta kullanilan "1.200" gibi degerler
     laboratuvar raporlarinda nadirdir; virgul varsa nokta binlik sayilir. */
  function num(raw){
    if(raw == null) return null;
    let s = String(raw).trim();
    if(!s) return null;
    if(s.indexOf(',') >= 0 && s.indexOf('.') >= 0){
      s = s.replace(/\./g, '').replace(',', '.');
    }else{
      s = s.replace(',', '.');
    }
    const v = parseFloat(s);
    return isFinite(v) ? v : null;
  }

  /* ---------------------------------------------------------- tahlil metni

     Bir laboratuvar raporunun metni satir satir okunur. Her satirda once
     bilinen bir belirtec adi aranir, sonra o adin SAGINDA kalan ilk sayi
     alinir. Referans araligi da ayni satirda oldugu icin ("12,5  13.5-17.5")
     birden fazla sayi bulunur; ilki sonuc, kalani referanstir. */

  /* Aramayi hizlandirmak icin takma adlar tek tabloda toplanir.
     Uzun ad kisa adi gizlemesin diye uzunluga gore sirali aranir:
     "serbest t4" once denenir, "t4" sonra. */
  const ALIAS_INDEX = (function(){
    const rows = [];
    SP.BIOMARKERS.forEach(b => {
      const names = [b.name].concat(b.aliases || []);
      names.forEach(n => rows.push({ id:b.id, alias:U.norm(n), len:U.norm(n).length }));
    });
    return rows.sort((a, b) => b.len - a.len);
  })();

  /* Birim donusumleri. Laboratuvarlar ayni olcumu farkli birimde verebilir;
     bilinen donusumler uygulanir, BILINMEYEN birim donusturulmez ve
     kullaniciya bildirilir. */
  const CONVERT = {
    vitd:{ 'nmol/l':v => v / 2.496 },
    glucose:{ 'mmol/l':v => v * 18.016 },
    chol:{ 'mmol/l':v => v * 38.67 },
    ldl:{ 'mmol/l':v => v * 38.67 },
    hdl:{ 'mmol/l':v => v * 38.67 },
    trig:{ 'mmol/l':v => v * 88.57 },
    creat:{ 'µmol/l':v => v / 88.4, 'umol/l':v => v / 88.4 },
    b12:{ 'pmol/l':v => v / 0.738 },
    ferritin:{ 'µg/l':v => v, 'ug/l':v => v },   /* ng/mL ile ayni buyukluk */
    iron_s:{ 'µmol/l':v => v * 5.587, 'umol/l':v => v * 5.587 },
  };

  function convert(markerId, value, unitRaw){
    const b = SP.BIO_BY_ID[markerId];
    if(!b || value == null) return { value, converted:false };
    const unit = String(unitRaw || '').trim().toLowerCase();
    if(!unit) return { value, converted:false };
    const want = String(b.unit || '').toLowerCase();
    if(unit === want) return { value, converted:false };
    const table = CONVERT[markerId];
    if(table && table[unit]){
      return { value:U.round(table[unit](value), 3), converted:true, from:unitRaw, to:b.unit };
    }
    return { value, converted:false, mismatch:unit !== want ? unitRaw : null };
  }

  /* Bir satirda gecen belirteci bulur. En uzun eslesme kazanir. */
  function matchMarker(line){
    const n = U.norm(line);
    for(let i = 0; i < ALIAS_INDEX.length; i++){
      const row = ALIAS_INDEX[i];
      if(row.alias.length < 2) continue;
      const at = n.indexOf(row.alias);
      if(at < 0) continue;
      /* Kelime siniri: "hb" ararken "hba1c" icindeki hb eslesmemeli. */
      const before = at === 0 ? ' ' : n[at - 1];
      const after = n[at + row.alias.length] || ' ';
      if(/[a-z0-9]/.test(before) || /[a-z0-9]/.test(after)) continue;
      return { id:row.id, at, alias:row.alias };
    }
    return null;
  }

  const NUM_RE = /(-?\d+(?:[.,]\d+)?)/g;
  const UNIT_RE = /(mg\/dl|g\/dl|ng\/ml|pg\/ml|µg\/dl|ug\/dl|µg\/l|ug\/l|miu\/l|mIU\/L|µiu\/ml|uiu\/ml|mmol\/l|µmol\/l|umol\/l|pmol\/l|nmol\/l|mm\/saat|u\/l|mmhg|10\^3\/µl|10\^3\/ul|fl|%|ms|°c)/i;

  function parseLab(text){
    const lines = String(text || '').split(/\r?\n/);
    const rows = [], unmatched = [];

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if(!trimmed) return;

      const m = matchMarker(trimmed);
      if(!m){
        /* Sayi iceren ama eslesmeyen satirlar kullaniciya gosterilir;
           icinde hic sayi olmayan basliklar sessizce gecilir. */
        if(NUM_RE.test(trimmed)){ NUM_RE.lastIndex = 0; unmatched.push({ line:trimmed, i }); }
        NUM_RE.lastIndex = 0;
        return;
      }

      /* Sayi, eslesen adin SONRASINDA aranir. Adin kendisinde rakam
         gecebilir ("25-OH D", "B12", "hs-CRP") ve o rakam sonuc sanilirdi. */
      const tail = trimmed.slice(Math.min(trimmed.length, m.at + m.alias.length));
      NUM_RE.lastIndex = 0;
      const nums = (tail.match(NUM_RE) || []).map(num).filter(v => v != null);
      if(!nums.length){ unmatched.push({ line:trimmed, i, marker:m.id }); return; }

      const unitHit = tail.match(UNIT_RE);
      const conv = convert(m.id, nums[0], unitHit ? unitHit[1] : null);
      const b = SP.BIO_BY_ID[m.id];

      rows.push({
        markerId:m.id, marker:b,
        value:conv.value, raw:nums[0],
        unit:unitHit ? unitHit[1] : null,
        converted:!!conv.converted, from:conv.from, to:conv.to,
        mismatch:conv.mismatch || null,
        /* Referans araligi satirda genelde ikinci ve ucuncu sayidir;
           yalnizca bilgi olarak tasinir, hesaba girmez. */
        othersInLine:nums.slice(1),
        line:trimmed, i,
      });
    });

    /* Ayni belirtec birden fazla satirda gectiyse ilki tutulur;
       raporlarda ozet tablo ve ayrinti tablosu ayni degeri tekrarlar. */
    const seen = {}, unique = [];
    rows.forEach(r => {
      if(seen[r.markerId]) { r.duplicate = true; return; }
      seen[r.markerId] = true;
      unique.push(r);
    });

    return {
      rows:unique, duplicates:rows.filter(r => r.duplicate).length,
      unmatched, lines:lines.length,
      note:unique.length
        ? unique.length + ' değer eşleşti'
          + (unmatched.length ? ', ' + unmatched.length + ' satır eşleşmedi' : '') + '.'
        : 'Hiçbir değer eşleşmedi. Rapor metnini olduğu gibi yapıştırdığından emin ol.',
    };
  }

  /* ------------------------------------------------------------- ogun metni

     "1 tabak etli kuru fasulye, 2 dilim ekmek ve 1 bardak ayran"

     Parcalara ayrilir, her parcada miktar + ev olcusu + gida aranir.
     Gramaj dogrudan yazildiysa ("150 g tavuk") olcum kesinligi "olculdu",
     ev olcusunden geldiyse "tahmin" olur. */

  const WORD_NUM = {
    'yarim':0.5, 'yarım':0.5, 'bir':1, 'iki':2, 'uc':3, 'üç':3, 'dort':4, 'dört':4,
    'bes':5, 'beş':5, 'alti':6, 'altı':6, 'yedi':7, 'sekiz':8, 'dokuz':9, 'on':10,
  };

  /* Gida takma adlari ACILISTA kurulur ama SABIT DEGILDIR: kullanici
     kendi gidasini ekleyince tablo yeniden kurulur, yoksa yeni gida
     ayristiriciya gorunmez olurdu. */
  let FOOD_ALIAS = [];
  let PORTION_ALIAS = [];

  function buildFoodAlias(){
    const rows = [];
    SP.FOODS.forEach(f => {
      const names = [f.name].concat(f.aliases || []);
      names.forEach(n => {
        const a = U.norm(n);
        if(a) rows.push({ id:f.id, alias:a, len:a.length });
      });
    });
    return rows.sort((a, b) => b.len - a.len);
  }

  function buildPortionAlias(){
    /* Butun gidalarin ev olculeri tek tabloda; "tabak", "kase", "dilim" gibi
       sozcukler gidaya gore farkli gram tasir. */
    const rows = [];
    SP.FOODS.forEach(f => {
      (f.portions || []).forEach(p => {
        /* "1 tabak" -> olcunun sozcuk kismi */
        const word = U.norm(p.label).replace(/^\d+\s*/, '').replace(/\s*\(.*\)$/, '');
        rows.push({ foodId:f.id, word, g:p.g, label:p.label });
      });
    });
    return rows;
  }

  /* Kullanici bir gida ekleyince cagrilir: tablolar yeniden kurulur. */
  function rebuildFoodIndex(){
    FOOD_ALIAS = buildFoodAlias();
    PORTION_ALIAS = buildPortionAlias();
  }
  rebuildFoodIndex();

  function matchFood(chunk){
    const n = U.norm(chunk);
    for(let i = 0; i < FOOD_ALIAS.length; i++){
      const row = FOOD_ALIAS[i];
      if(row.alias.length < 3) continue;
      if(n.indexOf(row.alias) >= 0) return row.id;
    }
    return null;
  }

  function matchPortion(chunk, foodId){
    const n = U.norm(chunk);
    const own = PORTION_ALIAS.filter(p => p.foodId === foodId);
    for(let i = 0; i < own.length; i++){
      if(own[i].word && n.indexOf(own[i].word) >= 0) return own[i];
    }
    return null;
  }

  function parseMeal(text){
    const raw = String(text || '').trim();
    if(!raw) return { items:[], unmatched:[], note:'Metin boş.' };

    /* Ayiraclar: virgul, "ve", "+", satir sonu, noktali virgul.
       Ondalik virgul ayirac DEGILDIR: "0,2 kg" tek parcadir. Bolmeden once
       iki rakam arasindaki virgul gecici olarak korunur. */
    const GUARD = '\u0000';
    const guarded = raw.replace(/(\d),(\d)/g, '$1' + GUARD + '$2');
    const chunks = guarded.split(/\s*(?:,|;|\+|\bve\b|\n)\s*/i)
      .map(s => s.split(GUARD).join(',').trim()).filter(Boolean);

    const items = [], unmatched = [];

    chunks.forEach(chunk => {
      const foodId = matchFood(chunk);
      if(!foodId){ unmatched.push(chunk); return; }
      const food = SP.FOOD_BY_ID[foodId];

      /* miktar: once rakam, yoksa sayi sozcugu, yoksa 1 */
      let qty = null;
      const digit = chunk.match(/(\d+(?:[.,]\d+)?)/);
      if(digit) qty = num(digit[1]);
      if(qty == null){
        const words = U.norm(chunk).split(/\s+/);
        for(let i = 0; i < words.length; i++){
          if(WORD_NUM[words[i]] != null){ qty = WORD_NUM[words[i]]; break; }
        }
      }
      if(qty == null) qty = 1;

      /* Dogrudan gram yazilmis mi? "150 g", "200 gram", "0,3 kg" */
      const gramHit = chunk.match(/(\d+(?:[.,]\d+)?)\s*(kg|gr|gram|g)\b/i);
      if(gramHit){
        const v = num(gramHit[1]);
        const g = /kg/i.test(gramHit[2]) ? v * 1000 : v;
        items.push({ foodId, food, g:Math.round(g), qty:null, portion:null,
          cert:'measured', source:chunk });
        return;
      }

      /* Ev olcusu */
      const p = matchPortion(chunk, foodId);
      if(p){
        items.push({ foodId, food, g:Math.round(p.g * qty), qty, portion:p.label,
          cert:'estimated', source:chunk });
        return;
      }

      /* Olcu yoksa gidanin ilk ev olcusu varsayilir ve tahmin isaretlenir. */
      const first = (food.portions || [])[0];
      if(first){
        items.push({ foodId, food, g:Math.round(first.g * qty), qty, portion:first.label,
          cert:'estimated', assumed:true, source:chunk });
        return;
      }
      items.push({ foodId, food, g:Math.round(100 * qty), qty, portion:'100 g',
        cert:'estimated', assumed:true, source:chunk });
    });

    return {
      items, unmatched,
      note:items.length
        ? items.length + ' gıda eşleşti'
          + (unmatched.length ? ', ' + unmatched.length + ' parça eşleşmedi' : '') + '.'
        : 'Hiçbir gıda eşleşmedi. "1 tabak mercimek çorbası" gibi yazmayı dene.',
    };
  }

  /* Ayristirilmis satirlari bir tahlil oturumuna yazar. */
  function toLabRecord(parsed, dateISO, meta){
    const rec = SP.Model.newLab(dateISO);
    rec.source = 'paste';
    if(meta && meta.lab) rec.lab = meta.lab;
    parsed.rows.forEach(r => {
      if(r.skip) return;
      rec.values[r.markerId] = { v:r.value, cert:'measured',
        unit:r.unit || (r.marker ? r.marker.unit : null),
        converted:r.converted || false };
    });
    return rec;
  }

  return { num, parseLab, parseMeal, matchMarker, matchFood, matchPortion,
    convert, toLabRecord, ALIAS_INDEX, WORD_NUM, rebuildFoodIndex,
    get FOOD_ALIAS(){ return FOOD_ALIAS; } };
})();
