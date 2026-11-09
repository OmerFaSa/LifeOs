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
window.LIFEOS.PARCA.yazilar({
  'esp.core.parse.ne-disiplin-ne-sure-tanindi':'Ne disiplin ne süre tanındı.',
  'esp.core.parse.sure-var-ama-hangi-disiplin':'Süre var ama hangi disiplin olduğu anlaşılmadı.',
  'esp.core.parse.sayinin-birimi-yok':'Sayının birimi yok: «',
  'esp.core.parse.disiplin-tanindi-ama-sure-gi':'Disiplin tanındı ama süre girilmemiş.',
  'esp.core.parse.karsiligi-yok-tek-kelimelik':'Karşılığı yok; tek kelimelik satırdan kart üretilmez.',
  'esp.core.parse.ayrac-bulunamadi':'Ayraç bulunamadı (– , = ya da : bekleniyor).',
  'esp.core.parse.tez-destek-ya-da-itiraz':'Tez, destek ya da itiraz olduğu anlaşılmadı.',
});


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
      'fransızca çalıştım', 'dil', 'kelime',
      /* Kolay LifeOS Faz 0 (2026-10-16): yalniz dil adi da dil oturumudur
         («45 dk ingilizce»); en dogal cumle duşuyordu. */
      'ingilizce', 'almanca', 'fransızca', 'ispanyolca', 'italyanca', 'rusça',
      'arapça', 'japonca', 'korece', 'çince', 'portekizce'],
    philo:['felsefe okudum', 'felsefe çalıştım', 'tez yazdım', 'argüman kurdum',
      'primer metin okudum', 'felsefe', 'argüman', 'tez'],
    music:['gitar çalıştım', 'gitar çaldım', 'metronomla çalıştım', 'gam çalıştım',
      'parça çalıştım', 'enstrüman çalıştım', 'piyano çalıştım', 'keman çalıştım', 'gitar', 'piyano', 'keman', 'müzik'],
    diction:['diksiyon çalıştım', 'tekerleme söyledim', 'nefes çalıştım',
      'sunum provası yaptım', 'yüksek sesle okudum', 'diksiyon', 'tekerleme',
      'ses açma egzersizi yaptım', 'ses açma çalıştım', 'ses açma egzersizi', 'ses açma',
      'artikülasyon ve nefes çalıştım', 'artikülasyon çalıştım', 'artikülasyon ve nefes', 'artikülasyon'],
    reading:['derin okuma yaptım', 'kitap okudum', 'not çıkardım', 'okuma yaptım',
      'derin okuma', 'okudum', 'okuma'],
    writing:['yazı yazdım', 'taslak yazdım', 'deneme yazdım', 'revize ettim',
      'yazdım', 'yazı'],
    history:['tarih çalıştım', 'kronoloji çalıştım', 'tarih okudum', 'kronoloji okudum',
      'tarih', 'kronoloji'],
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
    { re:/(?:çeyrek\s+saat)\b/i, carpan:15, sabit:true },
    { re:/(?:yarım\s+saat)\b/i, carpan:30, sabit:true },
  ];

  const SAYIM = [
    { re:/(\d+)\s*(?:tane\s*)?(?:yeni\s*)?(?:kelime)\b/i, field:'count', what:'kelime' },
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
    /* Kitaptaki yer (King 5 tur 5): «Suç ve Ceza'da 120. sayfadayım» okunan sayfa sayısı değil KONUMdur;
       bölünmeden okunur («ve», «.» ayıraç değil). Bugün okunan sayfayı app.js kitabın önceki ilerlemesinden hesaplar. */
    const konum = U.norm(ham).match(/(\d{1,4})\s*\.\s*sayfa/);
    if(konum) return { rows:[{ disc:'reading', minutes:null, count:null, countWhat:'sayfa', konum:Number(konum[1]), note:ham }], unmatched:[] };

    /* Tek kaynak: brand/ortak/giris.js bol() (2026-10-19); yoksa yerel kural. */
    const G = window.LIFEOS && window.LIFEOS.GIRIS;
    let parcalar = G && typeof G.bol === 'function' ? G.bol(ham) : ham.split(AYRAC).map(p => p.trim()).filter(Boolean);
    const birlestir = [];
    for(let i = 0; i < parcalar.length; i++){
      if(i < parcalar.length - 1 && /artikülasyon/i.test(parcalar[i]) && /^nefes\b/i.test(parcalar[i + 1])){
        birlestir.push(parcalar[i] + ' ve ' + parcalar[i + 1]);
        i++;
      } else {
        birlestir.push(parcalar[i]);
      }
    }
    parcalar = birlestir;
    const rows = [], unmatched = [];

    parcalar.forEach(parca => {
      const n = U.norm(parca);

      /* Disiplin — uzundan kisaya ilk eslesme. */
      const hit = INDEX.find(x => n.indexOf(x.alias) >= 0);

      /* Sure — ortak TurkceSayi okuyucusu (cagri aninda); yoksa yerel kural yedek. */
      let dakika = null;
      const ts = window.LIFEOS && window.LIFEOS.TurkceSayi;
      const sBul = ts && typeof ts.sure === 'function' ? ts.sure(parca) : null;
      if(sBul && sBul.dakika != null){
        dakika = sBul.dakika;
      } else {
        SURE.forEach(s => {
          const m = parca.match(s.re);
          if(m){
            if(s.sabit){ dakika = (dakika || 0) + s.carpan; return; }
            const v = sayi(m[1]);
            if(v != null) dakika = (dakika || 0) + v * s.carpan;
          }
        });
      }

      /* Ikinci sayi — kelime / kart / sayfa / tekrar. */
      let count = null, countWhat = null;
      SAYIM.forEach(s => {
        if(count != null) return;
        const m = parca.match(s.re);
        if(m){ count = sayi(m[1]); countWhat = s.what; }
      });

      if(!hit && dakika == null){
        unmatched.push({ text:parca, why:yz('esp.core.parse.ne-disiplin-ne-sure-tanindi') });
        return;
      }
      if(!hit){
        unmatched.push({ text:parca, why:yz('esp.core.parse.sure-var-ama-hangi-disiplin'),
          minutes:dakika });
        return;
      }
      /* KISA KAYIT: «gitar 30» (HKM'den Telegram'la gelir). Birimsiz sayi
         yalniz disiplin + sayidan ibaret kisa parcada dakika sayilir; kayit
         yine onizlenir ve onayla yazilir. Takma ad bir SAYIM kelimesiyse
         («kelime 15») sayi dakika mi adet mi bilinmez: sorulur. */
      const kisa = dakika == null && count == null
        ? n.trim().match(/^([a-z ]{2,24}?)\s+(\d{1,3})$/) : null;
      if(kisa && hit.alias === kisa[1].trim()){
        if(/^(kelime|kart|sayfa|tekrar)$/.test(hit.alias)){
          unmatched.push({ text:parca, disc:hit.disc,
            why:yz('esp.core.parse.sayinin-birimi-yok') + kisa[2] + ' dakika» mı, «' + kisa[2] + ' ' + hit.alias + '» mı?' });
          return;
        }
        const dk = Number(kisa[2]);
        if(dk > 0 && dk <= 600) dakika = dk;
      }
      if(dakika == null && count == null){
        /* Disiplin taniniyor ama sure yok: satir ATILMAZ, suresi eksik bir
           oneri olarak doner. Kullanici sureyi yazar. */
        unmatched.push({ text:parca, why:yz('esp.core.parse.disiplin-tanindi-ama-sure-gi'),
          disc:hit.disc });
        return;
      }

      rows.push({
        disc:hit.disc,
        minutes:dakika != null ? Math.round(dakika) : null,
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
            ? yz('esp.core.parse.karsiligi-yok-tek-kelimelik')
            : yz('esp.core.parse.ayrac-bulunamadi') });
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
      unmatched.push({ text:c, why:yz('esp.core.parse.tez-destek-ya-da-itiraz') });
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
