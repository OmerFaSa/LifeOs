/* Serbest metin ayristiricilari.

   Uc kazanilmis ders bu dosyanin tamamini belirler (devir notu §11):

     1. INSANLAR FIIL SOYLER, ISIM DEGIL. "Shadowing oturumu" degil
        "shadowing yaptim". Her disiplin takma ad listesi tasir.

     2. TAKMA AD DIZINI UZUNDAN KISAYA SIRALANIR. Yoksa "okuma" kelimesi
        "derin okuma"dan once eslesir ve yanlis disipline yazilir.

     3. SAYI ICINDEKI VIRGUL CUMLE AYRACI DEGILDIR. "7,5 saat" tek
        parcadir; "7" ve "5 saat" degil.

   Ve degismez kural: EMIN OLUNAMAYAN SATIR ATILMAZ VE UYDURULMAZ.
   "Eşleşmedi" olarak isaretlenir, kullanici elle baglar. Sessizce atilan
   bir satir, kullanicinin girdigini sandigi ama sistemde olmayan bir veri
   demektir — en pahali hata turu. */

window.ESP = window.ESP || {};

ESP.Parse = (function(){
  const U = ESP.U;

  /* Cumle ayraci. Virgul YALNIZCA ardindan rakam GELMEDIGINDE ayracdir:
     "7,5 saat" tek parcadir, "7" ve "5 saat" degil. */
  const AYRAC = /\s+(?:ve|ayrıca|bir de|sonra|artı)\s+|[;]|,(?!\d)/gi;

  /* ---------------------------------------------------- disiplin takma adlari

     Her disiplin icin kullanicinin gercekte soyleyecegi sozler. Liste
     uzundan kisaya siralanir (asagida) ve normalize edilmis halde aranir. */
  const ALIASES = {
    lang:['dil çalıştım', 'kelime çalıştım', 'shadowing yaptım', 'shadowing',
      'kart çözdüm', 'tekrar yaptım', 'ingilizce çalıştım', 'almanca çalıştım',
      'fransızca çalıştım', 'dil', 'kelime'],
    philo:['felsefe okudum', 'felsefe çalıştım', 'tez yazdım', 'argüman kurdum',
      'primer metin okudum', 'felsefe', 'argüman', 'tez'],
    music:['gitar çalıştım', 'gitar çaldım', 'metronomla çalıştım', 'gam çalıştım',
      'parça çalıştım', 'enstrüman çalıştım', 'gitar', 'müzik'],
    diction:['diksiyon çalıştım', 'tekerleme söyledim', 'nefes çalıştım',
      'sunum provası yaptım', 'yüksek sesle okudum', 'diksiyon', 'tekerleme'],
    reading:['derin okuma yaptım', 'kitap okudum', 'not çıkardım', 'okuma yaptım',
      'derin okuma', 'okudum', 'okuma'],
    writing:['yazı yazdım', 'taslak yazdım', 'deneme yazdım', 'revize ettim',
      'yazdım', 'yazı'],
  };

  /* Uzundan kisaya: "derin okuma" once denenir, "okuma" sonra.
     Tersi olsaydi her derin okuma kaydi genel okumaya duserdi. */
  const INDEX = (function(){
    const rows = [];
    Object.keys(ALIASES).forEach(disc => {
      ALIASES[disc].forEach(a => rows.push({ disc, alias:U.norm(a), len:a.length }));
    });
    return rows.sort((a, b) => b.len - a.len);
  })();

  /* Birim kaliplari. Sira ozgulden genele: "45 dakika" once, "45" sonra. */
  const SURE = [
    { re:/(\d+(?:[.,]\d+)?)\s*(?:saat|sa)\b/i, carpan:60 },
    { re:/(\d+(?:[.,]\d+)?)\s*(?:dakika|dk|dak)\b/i, carpan:1 },
  ];

  const SAYIM = [
    { re:/(\d+)\s*(?:kelime)\b/i, field:'count', what:'kelime' },
    { re:/(\d+)\s*(?:kart)\b/i, field:'count', what:'kart' },
    { re:/(\d+)\s*(?:sayfa)\b/i, field:'count', what:'sayfa' },
    { re:/(\d+)\s*(?:tekrar)\b/i, field:'count', what:'tekrar' },
  ];

  function sayi(s){
    const n = Number(String(s).replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  /* ---------------------------------------------------------- oturum ayristirma

     «bugün 45 dakika gitar çalıştım ve 20 dakika kelime tekrarı yaptım»
       → iki oturum: music 45 dk, lang 20 dk

     Donus: { rows:[…], unmatched:[…] }
     `unmatched` bos DEGILSE ekran onu gosterir ve kullanici elle baglar. */
  function parseSession(text){
    const ham = String(text || '').trim();
    if(!ham) return { rows:[], unmatched:[] };

    const parcalar = ham.split(AYRAC).map(p => p.trim()).filter(Boolean);
    const rows = [], unmatched = [];

    parcalar.forEach(parca => {
      const n = U.norm(parca);

      /* Disiplin — uzundan kisaya ilk eslesme. */
      const hit = INDEX.find(x => n.indexOf(x.alias) >= 0);

      /* Sure — saat once, dakika sonra. Ikisi de varsa toplanir
         ("1 saat 20 dakika"). */
      let dakika = null;
      SURE.forEach(s => {
        const m = parca.match(s.re);
        if(m){
          const v = sayi(m[1]);
          if(v != null) dakika = (dakika || 0) + v * s.carpan;
        }
      });

      /* Ikinci sayi — kelime / kart / sayfa / tekrar. */
      let count = null, countWhat = null;
      SAYIM.forEach(s => {
        if(count != null) return;
        const m = parca.match(s.re);
        if(m){ count = sayi(m[1]); countWhat = s.what; }
      });

      if(!hit && dakika == null){
        unmatched.push({ text:parca, why:'Ne disiplin ne süre tanındı.' });
        return;
      }
      if(!hit){
        unmatched.push({ text:parca, why:'Süre var ama hangi disiplin olduğu anlaşılmadı.',
          minutes:dakika });
        return;
      }
      if(dakika == null){
        /* Disiplin taniniyor ama sure yok: satir ATILMAZ, suresi eksik bir
           oneri olarak doner. Kullanici sureyi yazar. */
        unmatched.push({ text:parca, why:'Disiplin tanındı ama süre girilmemiş.',
          disc:hit.disc });
        return;
      }

      rows.push({
        disc:hit.disc,
        minutes:Math.round(dakika),
        count, countWhat,
        note:parca,
      });
    });

    return { rows, unmatched };
  }

  /* ------------------------------------------------------- kelime ayristirma

     Yapistirilan listeden SRS karti uretir. Uc yaygin bicim taninir
     (data/lexicon.js → VOCAB_SEPARATORS); taninmayan satir "eşleşmedi"
     olarak doner.

     Tek kelimelik satir da eslesmez: karsiligi olmayan bir kart soru
     soramaz. Bos birakip kullaniciya yazdirmak, yanlis karsilik uydurmaktan
     iyidir. */
  function parseVocab(text, lang){
    const satirlar = String(text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const rows = [], unmatched = [];

    satirlar.forEach(satir => {
      let bulundu = null;
      for(const sep of ESP.VOCAB_SEPARATORS){
        const m = satir.match(sep.re);
        if(m && m[1].trim() && m[2].trim()){
          bulundu = { front:m[1].trim(), back:m[2].trim(), via:sep.id };
          break;
        }
      }
      if(!bulundu){
        unmatched.push({ text:satir,
          why:satir.split(/\s+/).length === 1
            ? 'Karşılığı yok; tek kelimelik satırdan kart üretilmez.'
            : 'Ayraç bulunamadı (– , = ya da : bekleniyor).' });
        return;
      }
      rows.push({
        front:bulundu.front, back:bulundu.back,
        lang:lang || 'en',
        kind:bulundu.front.split(/\s+/).length > 1 ? 'phrase' : 'word',
        via:bulundu.via,
      });
    });

    /* Ayni on yuzden iki kart uretmek destede ikiz olusturur ve ikisi de
       ayri ayri sorulur. Ayikla, ama SESSIZCE DEGIL: kac tane atildigi
       doner. */
    const gorulen = {}, tekil = [], ikiz = [];
    rows.forEach(r => {
      const k = U.norm(r.front);
      if(gorulen[k]){ ikiz.push(r); return; }
      gorulen[k] = true; tekil.push(r);
    });

    return { rows:tekil, unmatched, duplicates:ikiz };
  }

  /* --------------------------------------------------------- tez ayristirma

     «X doğrudur çünkü Y. Ama Z olabilir.»
       tez     → X doğrudur
       destek  → Y
       itiraz  → Z

     Kaba bir ayirmadir ve oyle kalmalidir: sistem metni ANLAMAZ, yalnizca
     baglaclara bakar. Cikan sey bir ONERIDIR; kullanici duzeltir. */
  /* Baglaclar Turkce sinirla kurulur: /\bçünkü\b/ hicbir Turkce cumlede
     eslesmez cunku `ç` JavaScript'te kelime karakteri sayilmaz. Ayrintisi
     data/rules.js icindeki ESP.trRe yorumunda. */
  const DESTEK = ESP.trRe('çünkü|zira|nitekim|şu sebeple|dolayısıyla');
  const ITIRAZ = ESP.trRe('ama|fakat|ancak|oysa|ne var ki|buna karşın|yine de');

  function parseArgument(text){
    const ham = String(text || '').trim();
    if(!ham) return { thesis:'', supports:[], objections:[], unmatched:[] };

    const cumleler = ham.split(/(?<!\d)[.!?]+(?!\d)/).map(s => s.trim()).filter(Boolean);
    if(!cumleler.length) return { thesis:ham, supports:[], objections:[], unmatched:[] };

    const supports = [], objections = [], unmatched = [];
    let thesis = '';

    cumleler.forEach((c, i) => {
      if(ITIRAZ.test(c)){
        objections.push(c.replace(ITIRAZ, '').trim());
        return;
      }
      if(DESTEK.test(c)){
        /* split ayraci geri vermesi icin YAKALAYAN grup gerekir; trRe ic
           grubu yakalamaz, bu yuzden burada kendi desenimizi kurariz. */
        const parcali = c.split(new RegExp('(' + DESTEK.source + ')', 'i'));
        /* Ilk cumle hem tez hem destek tasiyabilir:
           "X doğrudur çünkü Y" → tez X, destek Y. */
        if(!thesis && parcali[0].trim()) thesis = parcali[0].trim();
        const d = parcali.slice(2).join(' ').trim() || parcali[parcali.length - 1].trim();
        if(d) supports.push(d);
        return;
      }
      if(!thesis && i === 0){ thesis = c; return; }
      /* Ne tez ne destek ne itiraz: kullaniciya sorulur. */
      unmatched.push({ text:c, why:'Tez, destek ya da itiraz olduğu anlaşılmadı.' });
    });

    return { thesis, supports, objections, unmatched };
  }

  /* ------------------------------------------------------- kavram ayikama

     Metindeki kanonik kavramlari bulur. Kanonda olmayan kelime UYDURULMAZ;
     yalnizca ESP.CONCEPTS listesindekiler doner. Kullanici kendi kavramini
     elle ekleyebilir. */
  function extractConcepts(text){
    const n = U.norm(text || '');
    if(!n) return [];
    const out = [];
    ESP.CONCEPTS.forEach(c => {
      const adaylar = [c.id, c.label].concat(c.same);
      if(adaylar.some(a => n.indexOf(U.norm(a)) >= 0)) out.push(c);
    });
    return out;
  }

  return { AYRAC, ALIASES, parseSession, parseVocab, parseArgument, extractConcepts };
})();
