/* Bölüm denetimi — her disiplinde "bir şey ters gidiyor mu?"

   Merdiven NEREDE olduğunu söyler, reçete NE yapılacağını söyler. Ama
   ikisi de bir şeyi göremez: bir disiplinin İÇİNDE biriken bozukluğu.
   Yüz kart biriktirip on tanesini hiç hatırlayamamak, kırk taslak açıp
   hiçbirini ikinci kez okumamak, iki yüz not alıp hiçbirini bağlamamak —
   bunların hepsi kademe tablosunda "ilerleme" gibi görünür.

   Bu dosya o boşluğu tarar. Her disiplin için üç–dört bulgu üretir ve
   her bulgu ÜÇ şeyi birden taşır: ne olduğu, neden önemli olduğu ve tek
   dokunuşla nereye gidileceği.

   Dört kural:

   1. BULGU EYLEME BAĞLI OLMAK ZORUNDADIR. "Notlarının %60'ı bağsız"
      cümlesi tek başına kaygı üretir. Yanında "en eski üçü şunlar" ve
      "bağla" düğmesi yoksa o bulgu yazılmaz.

   2. VERİ YOKSA BULGU DA YOKTUR. Hiç kart girilmemiş bir destede "sülük
      kart yok" demek, ölçülmemiş bir şeyi temiz göstermektir. Eşiğin
      altında veri varsa bulgu 'unknown' döner ve öyle etiketlenir.

   3. BULGU SUÇLAMAZ. ESP.PEDAGOGIC sınırı burada da geçerli: "dağınık
      çalışıyorsun" denmez, "şu kayıtlar şu durumda" denir.

   4. AYNI ŞEY İKİ KEZ SÖYLENMEZ. Nöbetçi (core/goodhart.js) zaten
      çaba–sonuç ayrışmasını arar; burada aranan şey farklıdır: birikmiş
      BAKIM borcu. */

window.ESP = window.ESP || {};

ESP.Audit = (function(){
  const U = ESP.U, S = ESP.S;

  /* Bir bulgunun "ciddi" sayilmasi icin gereken en az kayit sayisi.
     Uc karttan cikan bir "sülük orani" bir olcu degil bir izlenimdir. */
  const ASGARI = 5;

  /* Sülük kart esigi: bu kadar kez unutulmus kart, kartin kendisinde
     bir sorun oldugunu dusundurur — kisinin hafizasinda degil. */
  const SULUK_LAPSE = 4;

  /* Bir taslagin "bayat" sayilmasi icin gecmesi gereken gun. */
  const BAYAT_GUN = 21;

  /* Bir argumanin "uzun suredir acik" sayilmasi icin gereken gun. */
  const ACIK_GUN = 45;

  function bul(id, o){
    return Object.assign({ id, severity:'info', cert:'measured', items:[] }, o);
  }

  function gunFark(iso){
    const d = U.diffDays(String(iso || '').slice(0, 10), U.todayISO());
    return d == null ? null : d;
  }

  /* ------------------------------------------------------------- dil */

  function langFindings(){
    const out = [];
    const kartlar = (S.cards || []);

    if(kartlar.length < ASGARI){
      return [bul('lang-veri', { severity:'none', cert:'missing',
        title:'Deste küçük', route:'lang',
        note:'Denetim için en az ' + ASGARI + ' kart gerekir. Ölçülmemiş '
           + 'bir deste "temiz" değildir, yalnızca ölçülmemiştir.' })];
    }

    /* 1 — Sülük kartlar. Kartin kendisi bozuk olabilir: cok uzun,
       belirsiz ya da iki anlami birden tasiyor. */
    const suluk = kartlar.filter(c => (c.lapses || 0) >= SULUK_LAPSE)
      .sort((a, b) => (b.lapses || 0) - (a.lapses || 0));
    if(suluk.length){
      out.push(bul('lang-leech', { severity:'warn', route:'lang',
        title:suluk.length + ' sülük kart',
        note:'Bu kartlar ' + SULUK_LAPSE + ' kez ya da daha fazla unutuldu. '
           + 'Bu kadar tekrar eden unutma genelde hafızanın değil KARTIN '
           + 'sorunudur: çok uzun, belirsiz ya da tek kartta iki şey soruyor. '
           + 'Bölmek ya da yeniden yazmak, tekrar etmekten hızlıdır.',
        items:suluk.slice(0, 5).map(c => ({ id:c.id,
          label:(c.front || '(boş)').slice(0, 40),
          meta:(c.lapses || 0) + ' kez unutuldu' })) }));
    }

    /* 2 — Yarinki yuk. Tekrar kuyrugu bir gun patlarsa o gun hic
       calisilmaz; onceden gormek, yaymayi mumkun kilar. */
    const tahmin = dueForecast(14);
    const zirve = tahmin.reduce((m, g) => g.count > m.count ? g : m, { count:0 });
    const ortalama = tahmin.reduce((a, g) => a + g.count, 0) / tahmin.length;
    if(zirve.count >= 30 && zirve.count > ortalama * 2){
      out.push(bul('lang-spike', { severity:'warn', route:'lang',
        title:'Tekrar kuyruğunda zirve var',
        note:U.relativeDay(zirve.date) + ' ' + zirve.count + ' kart birden '
           + 'gelecek (günlük ortalama ' + Math.round(ortalama) + '). '
           + 'Bir günde biriken kuyruk çoğu zaman hiç çalışılmaz. Bugün '
           + 'birkaçını erken çevirmek zirveyi düzler.',
        items:[{ id:zirve.date, label:U.fmtShort(zirve.date),
          meta:zirve.count + ' kart' }] }));
    }

    /* 3 — Yeni kart hizi. Retansiyon dususe gecmisse yeni kart eklemek
       kuyrugu buyutur; yukselmisse yer vardir. */
    const langs = (S.profile && S.profile.langs) || ['en'];
    langs.forEach(function(l){
      const r = ESP.SRS.retention(l);
      if(!r || r.cert === 'missing') return;
      const aktif = ESP.SRS.activeCount(l);
      if(aktif < 20) return;
      if(r.value < 0.70){
        out.push(bul('lang-rate-' + l, { severity:'warn', route:'lang',
          title:'Yeni kart hızını düşür (' + l + ')',
          note:'Retansiyon %' + Math.round(r.value * 100) + '. Bu düzeyde '
             + 'yeni kart eklemek, hatırlanmayan kartların üstüne yenisini '
             + 'koymaktır. Önce mevcut deste toparlansın.' }));
      } else if(r.value > 0.90 && aktif >= 50){
        out.push(bul('lang-rate-up-' + l, { severity:'info', route:'lang',
          title:'Yeni kart için yer var (' + l + ')',
          note:'Retansiyon %' + Math.round(r.value * 100) + ' ve deste '
             + 'rahat. Bu, hız artırmak için bir İZİNDİR, bir hedef değil.' }));
      }
    });

    /* 4 — Yarim kartlar: arka yuzu bos ya da on yuzuyle ayni. */
    const bozuk = kartlar.filter(c => {
      const on = String(c.front || '').trim(), arka = String(c.back || '').trim();
      return !arka || U.norm(on) === U.norm(arka);
    });
    if(bozuk.length){
      out.push(bul('lang-broken', { severity:'warn', route:'lang',
        title:bozuk.length + ' kart eksik',
        note:'Arka yüzü boş ya da ön yüzüyle aynı olan kartlar her tekrarda '
           + 'karşına çıkar ve hiçbir şey öğretmez.',
        items:bozuk.slice(0, 5).map(c => ({ id:c.id,
          label:(c.front || '(boş)').slice(0, 40), meta:'arka yüz eksik' })) }));
    }

    return out;
  }

  /* Onumuzdeki N gunun tekrar kuyrugu. Mevcut `due` tarihlerinden
     sayilir; gelecekteki cevaplarin araligi DEGISTIRECEGI bilinir ve
     bu yuzden tahmin 'estimated' etiketlidir. */
  function dueForecast(days){
    const n = Math.max(1, days || 14);
    const bugun = U.todayISO();
    const sayac = {};
    for(let i = 0; i < n; i++){
      sayac[U.iso(U.addDays(U.parse(bugun), i))] = 0;
    }
    (S.cards || []).forEach(c => {
      const d = c.due || bugun;
      if(d <= bugun){ sayac[bugun]++; return; }
      if(sayac[d] != null) sayac[d]++;
    });
    return Object.keys(sayac).sort().map(d => ({ date:d, count:sayac[d] }));
  }

  /* --------------------------------------------------------- felsefe */

  function philoFindings(){
    const out = [];
    const args = (S.args || []);
    if(args.length < 3){
      return [bul('philo-veri', { severity:'none', cert:'missing',
        title:'Argüman az', route:'symposium',
        note:'Denetim için en az üç argüman gerekir.' })];
    }

    /* 1 — Karsi-argumani olmayan arguman. Itirazsiz bir tez, sinanmamis
       bir tezdir. */
    const itirazsiz = args.filter(a => a.status === 'open'
      && !(a.objections || []).length);
    if(itirazsiz.length){
      out.push(bul('philo-no-objection', { severity:'warn', route:'symposium',
        title:itirazsiz.length + ' argümanın itirazı yok',
        note:'İtirazsız bir tez, sınanmamış bir tezdir. En güçlü karşı '
           + 'argümanı yazmadan bir tez kapanmaz — kendi tezine yapılabilecek '
           + 'en iyi itirazı sen bulamazsan başkası bulur.',
        items:itirazsiz.slice(0, 5).map(a => ({ id:a.id,
          label:(a.thesis || '(boş)').slice(0, 50), meta:'itiraz yok' })) }));
    }

    /* 2 — Cok uzun suredir acik arguman. */
    const bayat = args.filter(a => a.status === 'open'
      && (gunFark(a.updatedAt) || 0) >= ACIK_GUN)
      .sort((a, b) => (gunFark(b.updatedAt) || 0) - (gunFark(a.updatedAt) || 0));
    if(bayat.length){
      out.push(bul('philo-stale', { severity:'info', route:'symposium',
        title:bayat.length + ' argüman uzun süredir açık',
        note:'Açık kalan argüman bir düşünce değil bir niyettir. Kapatmak '
           + 'haklı çıkmak demek değildir: "şu an bu konuda karar veremiyorum" '
           + 'da bir kapanıştır.',
        items:bayat.slice(0, 5).map(a => ({ id:a.id,
          label:(a.thesis || '(boş)').slice(0, 50),
          meta:gunFark(a.updatedAt) + ' gündür açık' })) }));
    }

    /* 3 — Kavramsiz arguman: hicbir kavrama baglanmamis tez, ileride
       hicbir seyle kesismez. */
    const kavramsiz = args.filter(a => !(a.concepts || []).length);
    if(kavramsiz.length >= 3){
      out.push(bul('philo-no-concept', { severity:'info', route:'symposium',
        title:kavramsiz.length + ' argüman kavramsız',
        note:'Kavram etiketi olmayan argüman, notlarınla ve öteki '
           + 'argümanlarınla kesişmez. Tek bir kavram bile sonradan '
           + 'bulunmasını sağlar.',
        items:kavramsiz.slice(0, 5).map(a => ({ id:a.id,
          label:(a.thesis || '(boş)').slice(0, 50), meta:'kavram yok' })) }));
    }

    return out;
  }

  /* ---------------------------------------------------------- okuma */

  function readingFindings(){
    const out = [];
    const notlar = (S.notes || []);
    if(notlar.length < ASGARI){
      return [bul('reading-veri', { severity:'none', cert:'missing',
        title:'Not az', route:'library',
        note:'Denetim için en az ' + ASGARI + ' not gerekir.' })];
    }

    /* 1 — Yetim notlar: hicbir seye baglanmamis ve uzerinden zaman
       gecmis. Baglanmayan not, ikinci kez okunmayan nottur. */
    const yetim = notlar.filter(n => !(n.links || []).length
      && (gunFark(n.createdAt) || 0) >= 14)
      .sort((a, b) => (gunFark(b.createdAt) || 0) - (gunFark(a.createdAt) || 0));
    if(yetim.length >= 3){
      out.push(bul('reading-orphan', { severity:'warn', route:'library',
        title:yetim.length + ' yetim not',
        note:'İki haftadır hiçbir şeye bağlanmamış notlar. Bağlanmayan not '
           + 'ikinci kez okunmaz; not almanın amacı arşiv değil ağdır.',
        items:yetim.slice(0, 5).map(n => ({ id:n.id,
          label:(n.text || '').slice(0, 50),
          meta:gunFark(n.createdAt) + ' gündür bağsız' })) }));
    }

    /* 2 — Verimsiz kaynak: okunan ama not cikmamis kitap. */
    const kitapNot = {};
    notlar.forEach(n => { if(n.bookId) kitapNot[n.bookId] = (kitapNot[n.bookId] || 0) + 1; });
    const kisir = (S.books || []).filter(b => !kitapNot[b.id]
      && (gunFark(b.createdAt) || 0) >= 21);
    if(kisir.length){
      out.push(bul('reading-barren', { severity:'info', route:'library',
        title:kisir.length + ' kaynaktan not çıkmamış',
        note:'Üç haftadır kayıtlı ama tek not çıkmamış kaynaklar. Kitap '
           + 'kötü olabilir, sıra henüz gelmemiş olabilir ya da okuma '
           + 'pasifleşmiş olabilir — üçü farklı şeyler.',
        items:kisir.slice(0, 5).map(b => ({ id:b.id,
          label:(b.title || '(başlıksız)').slice(0, 40),
          meta:(b.author || '') })) }));
    }

    /* 3 — Kavram tekeli: tek bir kavram butun notlari yutmussa,
       etiketleme cozunurlugunu kaybetmis demektir. */
    const kavram = {};
    notlar.forEach(n => (n.concepts || []).forEach(c => {
      const k = U.norm(c);
      kavram[k] = (kavram[k] || 0) + 1;
    }));
    const adlar = Object.keys(kavram);
    if(adlar.length >= 3){
      const enBuyuk = adlar.reduce((m, k) => kavram[k] > kavram[m] ? k : m, adlar[0]);
      const pay = kavram[enBuyuk] / notlar.length;
      if(pay > 0.5){
        out.push(bul('reading-monopoly', { severity:'info', route:'library',
          title:'«' + enBuyuk + '» notların yarısından fazlasında',
          note:'Bir kavram notların %' + Math.round(pay * 100) + '\'ini '
             + 'kaplıyor. Bu kadar geniş bir etiket, arama sırasında hiçbir '
             + 'şeyi daraltmaz — alt kavramlara bölmek işe yarar.',
          items:[{ id:enBuyuk, label:enBuyuk, meta:kavram[enBuyuk] + ' not' }] }));
      }
    }

    return out;
  }

  /* ----------------------------------------------------------- yazı */

  function writingFindings(){
    const out = [];
    const taslaklar = (S.drafts || []);
    if(taslaklar.length < 2){
      return [bul('writing-veri', { severity:'none', cert:'missing',
        title:'Taslak az', route:'writing',
        note:'Denetim için en az iki taslak gerekir.' })];
    }

    /* 1 — Hic elden gecmemis taslak. Ilk yazim bir tastir, yazi degil. */
    const hamlar = taslaklar.filter(d => !(d.revisions > 0)
      && String(d.text || '').length > 200);
    if(hamlar.length){
      out.push(bul('writing-unrevised', { severity:'warn', route:'writing',
        title:hamlar.length + ' taslak hiç elden geçmemiş',
        note:'İlk yazım bir taslak değil bir taştır. Üzerinden bir kez '
           + 'geçilmemiş metin, düşüncenin değil klavyenin ürünüdür.',
        items:hamlar.slice(0, 5).map(d => ({ id:d.id,
          label:(d.title || '(başlıksız)').slice(0, 40),
          meta:String(d.text || '').split(/\s+/).length + ' kelime' })) }));
    }

    /* 2 — Bayat taslak: uzun suredir dokunulmamis. */
    const bayat = taslaklar.filter(d => (gunFark(d.updatedAt) || 0) >= BAYAT_GUN)
      .sort((a, b) => (gunFark(b.updatedAt) || 0) - (gunFark(a.updatedAt) || 0));
    if(bayat.length >= 2){
      out.push(bul('writing-stale', { severity:'info', route:'writing',
        title:bayat.length + ' taslak beklemede',
        note:BAYAT_GUN + ' gündür dokunulmamış taslaklar. Bir yazıyı '
           + 'bırakmak da bir karardır — ama karar verilmeden bekleyen '
           + 'taslak her açılışta zihinsel yük üretir.',
        items:bayat.slice(0, 5).map(d => ({ id:d.id,
          label:(d.title || '(başlıksız)').slice(0, 40),
          meta:gunFark(d.updatedAt) + ' gün' })) }));
    }

    /* 3 — Tekrar eden kelime: uslubun en kolay gorunen kusuru. */
    const enUzun = taslaklar.filter(d => String(d.text || '').length > 400)
      .sort((a, b) => String(b.text).length - String(a.text).length)[0];
    if(enUzun){
      const tekrar = repeatedWords(enUzun.text);
      if(tekrar.length){
        out.push(bul('writing-repeat', { severity:'info', route:'writing',
          title:'«' + enUzun.title + '» metninde tekrar var',
          note:'Bir kelimenin sık dönmesi üslubun en kolay görünen kusurudur '
             + 've çoğu zaman yazar onu hiç fark etmez. Bunlar bir hata '
             + 'değildir; kasıtlıysa öyle kalır.',
          items:tekrar.slice(0, 5).map(t => ({ id:t.word,
            label:t.word, meta:t.count + ' kez' })) }));
      }
    }

    return out;
  }

  /* Bir metinde ANLAMLI bicimde tekrar eden kelimeler.

     Islevsel kelimeler (bag, zamir, edat) elenir: "ve" kelimesinin yuz kez
     gecmesi bir uslup kusuru degildir. Turkce sondan eklemeli oldugu icin
     kok bazli sayim yapilmaz — govde ayirmak ayri bir istir ve yanlis
     yapildiginda gurultuyu artirir. */
  const ISLEVSEL = ('ve veya ama fakat ancak ile de da ki bu şu o bir her hiç '
    + 'için gibi kadar daha en çok az sonra önce göre yani ise ne mi mı mu mü '
    + 'olarak olan olduğu değil var yok ben sen biz siz onlar')
    .split(' ');

  function repeatedWords(text){
    const kelimeler = String(text || '').toLocaleLowerCase('tr-TR')
      .split(/[^a-zçğıöşü]+/i).filter(w => w.length >= 5);
    if(kelimeler.length < 80) return [];
    const say = {};
    kelimeler.forEach(w => {
      if(ISLEVSEL.indexOf(w) >= 0) return;
      say[w] = (say[w] || 0) + 1;
    });
    const esik = Math.max(4, Math.round(kelimeler.length / 100));
    return Object.keys(say).filter(w => say[w] >= esik)
      .map(w => ({ word:w, count:say[w] }))
      .sort((a, b) => b.count - a.count);
  }

  /* ---------------------------------------------------------- müzik */

  function musicFindings(){
    const out = [];
    const parcalar = (S.pieces || []);
    if(parcalar.length < 2){
      return [bul('music-veri', { severity:'none', cert:'missing',
        title:'Parça az', route:'studio',
        note:'Denetim için en az iki parça gerekir.' })];
    }

    /* 1 — Plato: mevcut motor zaten buluyor, burada EYLEME baglaniyor. */
    const plato = ESP.Acoustic.plateaus ? ESP.Acoustic.plateaus() : [];
    if(plato.length){
      out.push(bul('music-plateau', { severity:'warn', route:'studio',
        title:plato.length + ' parçada tıkanma',
        note:'Temiz eşik uzun süredir yerinde. Tempoyu düşürüp temizliği '
           + 'geri kazanmak, aynı tempoda tekrar etmekten hızlıdır.',
        items:plato.slice(0, 5).map(x => ({ id:(x.piece || {}).id,
          label:String((x.piece || {}).name || '').slice(0, 40),
          meta:x.days != null ? x.days + ' gündür aynı eşikte' : 'tıkanma' })) }));
    }

    /* 2 — Terk edilmis parca: uzun suredir denenmemis. */
    const terk = parcalar.map(p => {
      const son = (p.attempts || []).map(a => a.date).sort().pop();
      return { p, son, gun:son ? gunFark(son) : null };
    }).filter(x => x.gun != null && x.gun >= 30);
    if(terk.length){
      out.push(bul('music-abandoned', { severity:'info', route:'studio',
        title:terk.length + ' parça bir aydır çalışılmadı',
        note:'Bir parçayı bırakmak meşrudur; ama listede durmaya devam '
           + 'ederse her açılışta bir borç gibi görünür. Arşive almak da '
           + 'bir karardır.',
        items:terk.slice(0, 5).map(x => ({ id:x.p.id,
          label:(x.p.name || '').slice(0, 40), meta:x.gun + ' gün' })) }));
    }

    /* 3 — Hedefsiz parca: hedef tempo yoksa "ilerleme" olculemez. */
    const hedefsiz = parcalar.filter(p => !(p.targetBpm > 0)
      && (p.attempts || []).length >= 3);
    if(hedefsiz.length){
      out.push(bul('music-no-target', { severity:'info', route:'studio',
        title:hedefsiz.length + ' parçanın hedef temposu yok',
        note:'Hedef tempo yazılmadan "ilerleme" ölçülemez: sistem neye göre '
           + 'yaklaştığını bilmiyor. Hedef bir taahhüt değil, bir ölçü '
           + 'çizgisidir.',
        items:hedefsiz.slice(0, 5).map(p => ({ id:p.id,
          label:(p.name || '').slice(0, 40),
          meta:p.cleanBpm ? 'temiz ' + p.cleanBpm : 'ölçüm var' })) }));
    }

    return out;
  }

  /* -------------------------------------------------------- diksiyon */

  function dictionFindings(){
    const out = [];
    const kayitlar = (S.recordings || []);
    if(kayitlar.length < ASGARI){
      return [bul('diction-veri', { severity:'none', cert:'missing',
        title:'Kayıt az', route:'studio',
        note:'Denetim için en az ' + ASGARI + ' kayıt gerekir. Beyana '
           + 'dayalı bir ölçümde az kayıt, ölçüm değil izlenimdir.' })];
    }

    /* 1 — Eksik olculu kayit: kelime ya da hata sayisi girilmemis. */
    const eksik = kayitlar.filter(r => r.wordsCert === 'missing'
      || r.errorsCert === 'missing');
    if(eksik.length >= 2){
      out.push(bul('diction-incomplete', { severity:'warn', route:'studio',
        title:eksik.length + ' kayıtta ölçüm eksik',
        note:'Kelime ya da hata sayısı girilmemiş kayıtlar hiçbir kapıya '
           + 'katkı vermez ve ortalamaya da girmez. Sıfır sayılmazlar — '
           + 'yalnızca yok sayılırlar.',
        items:eksik.slice(0, 5).map(r => ({ id:r.id,
          label:U.fmtShort(r.date),
          meta:r.wordsCert === 'missing' ? 'kelime yok' : 'hata yok' })) }));
    }

    /* 2 — Tek metin tekrari: ayni metinle olcum, metni ezberlemeyi
       olcer, diksiyonu degil. */
    const metin = {};
    kayitlar.forEach(r => { if(r.textId) metin[r.textId] = (metin[r.textId] || 0) + 1; });
    const adlar = Object.keys(metin);
    if(adlar.length){
      const enCok = adlar.reduce((m, k) => metin[k] > metin[m] ? k : m, adlar[0]);
      const pay = metin[enCok] / kayitlar.length;
      if(pay > 0.7 && kayitlar.length >= 8){
        out.push(bul('diction-same-text', { severity:'info', route:'studio',
          title:'Ölçümlerin çoğu aynı metinle',
          note:'Kayıtların %' + Math.round(pay * 100) + '\'i tek bir metinden. '
             + 'Aynı metni tekrar ölçmek bir noktadan sonra diksiyonu değil '
             + 'o metni ezberlemeyi ölçer.',
          items:[{ id:enCok, label:enCok, meta:metin[enCok] + ' kayıt' }] }));
      }
    }

    /* 3 — Egilim kotuye gidiyor mu? Mevcut motor hesapliyor. */
    const tr = ESP.Acoustic.dictionTrend ? ESP.Acoustic.dictionTrend() : null;
    if(tr && tr.cert !== 'missing' && tr.direction === 'kotu'){
      out.push(bul('diction-worse', { severity:'warn', route:'studio',
        title:'Hata oranı yükseliyor',
        note:'Son iki pencerede hata oranı arttı. Aynı hatayı tekrar etmek '
           + 'onu pekiştirir: kaydı dinleyip hatayı işaretlemeden tekrar '
           + 'etmemek gerekir.' }));
    }

    return out;
  }

  /* ---------------------------------------------------------- tarih */

  function historyFindings(){
    const out = [];
    const olaylar = (S.events || []);
    if(olaylar.length < ASGARI){
      return [bul('history-veri', { severity:'none', cert:'missing',
        title:'Olay az', route:'history',
        note:'Denetim için en az ' + ASGARI + ' olay gerekir.' })];
    }

    /* 1 — Cag bosluklari: hic olay yerlestirilmemis donemler. */
    const cagSayim = {};
    olaylar.forEach(e => {
      /* Cag, yilin hangi araliga dustugune gore bulunur. Sinir yili
         SONRAKI caga aittir (data/history.js: araliklar ortusmez). */
      const c = (ESP.ERAS || []).filter(function(x){
        return e.year != null && e.year >= x.from && e.year <= x.to;
      })[0];
      if(c) cagSayim[c.id] = (cagSayim[c.id] || 0) + 1;
    });
    const bos = (ESP.ERAS || []).filter(c => !cagSayim[c.id]);
    if(bos.length && bos.length < (ESP.ERAS || []).length){
      out.push(bul('history-gaps', { severity:'info', route:'history',
        title:bos.length + ' çağda hiç olay yok',
        note:'Kronolojide boş kalan dönemler. Boşluk bir eksiklik olmak '
           + 'zorunda değil — bilerek çalışılmamış olabilir. Ama görünür '
           + 'olması, farkında olmadan atlanmış olanı ortaya çıkarır.',
        items:bos.slice(0, 5).map(c => ({ id:c.id, label:c.label,
          meta:c.from + '–' + c.to })) }));
    }

    /* 2 — Kaynak dengesi: yalnizca ikincil kaynakla kurulmus tarih,
       baskasinin yorumunun tarihidir. */
    const kaynaklar = (S.sources || []);
    if(kaynaklar.length >= 3){
      const birincil = kaynaklar.filter(k => k.kind === 'primary').length;
      const pay = birincil / kaynaklar.length;
      if(pay < 0.2){
        out.push(bul('history-secondary', { severity:'info', route:'history',
          title:'Birincil kaynak az',
          note:'Kaynakların %' + Math.round(pay * 100) + '\'i birincil. '
             + 'Yalnızca yorumla kurulan tarih, başkasının tarihidir. '
             + 'Bir belgeye doğrudan bakmak, on yorumdan farklı bir şey '
             + 'öğretir.',
          items:[{ id:'oran', label:birincil + '/' + kaynaklar.length,
            meta:'birincil/toplam' }] }));
      }
    }

    /* 3 — Dengesiz zincir: yalnizca kivilcim var, zemin yok.

       Kural motoru zaten hesapliyor (ESP.Model.chainBalance); burada
       EYLEME baglaniyor. Yapisal ya da kurumsal bir kosul icermeyen
       nedensellik zinciri, bir aciklama degil bir hikayedir. */
    const dengesiz = (S.chains || []).map(function(z){
      return { z:z, b:ESP.Model.chainBalance(z) };
    }).filter(function(x){ return x.b.links >= 2 && !x.b.balanced; });
    if(dengesiz.length){
      out.push(bul('history-unbalanced', { severity:'warn', route:'history',
        title:dengesiz.length + ' zincirde zemin yok',
        note:'Bu zincirlerde yapısal ya da kurumsal bir koşul yok: yalnızca '
           + 'tetikleyici var. Kıvılcımla yangını açıklamak, kibriti suçlayıp '
           + 'kuru otu görmemektir.',
        items:dengesiz.slice(0, 5).map(function(x){
          return { id:x.z.id,
            label:String(x.z.question || '(soru yok)').slice(0, 50),
            meta:x.b.links + ' halka, zemin yok' };
        }) }));
    }

    /* 4 — Kaynaksiz halka: iddia var, dayanak yok. */
    const kaynaksiz = (S.chains || []).map(function(z){
      return { z:z, b:ESP.Model.chainBalance(z) };
    }).filter(function(x){ return x.b.links >= 2 && x.b.sourced === 0; });
    if(kaynaksiz.length >= 2){
      out.push(bul('history-unsourced', { severity:'info', route:'history',
        title:kaynaksiz.length + ' zincirde kaynak yok',
        note:'Hiçbir halkası bir kaynağa bağlanmamış zincirler. Kaynaksız '
           + 'nedensellik, hatırladığın bir anlatıdır — yanlış olmak '
           + 'zorunda değil ama sınanabilir de değil.',
        items:kaynaksiz.slice(0, 5).map(function(x){
          return { id:x.z.id,
            label:String(x.z.question || '(soru yok)').slice(0, 50),
            meta:x.b.links + ' halka' };
        }) }));
    }

    return out;
  }

  /* --------------------------------------------------------- toplama */

  const BY_DISC = {
    lang:langFindings, philo:philoFindings, reading:readingFindings,
    writing:writingFindings, music:musicFindings, diction:dictionFindings,
    history:historyFindings,
  };

  function of(discId){
    const fn = BY_DISC[discId];
    if(!fn) return [];
    return ESP.Memo.of('audit:' + discId, function(){
      try{ return fn(); }
      catch(e){ return []; }
    });
  }

  /* Acik butun bolumlerin bulgulari — en ciddiden baslayarak. */
  function all(){
    const siralama = { warn:0, info:1, none:2 };
    const out = [];
    (ESP.Mod ? ESP.Mod.active() : []).forEach(function(d){
      of(d.id).forEach(function(f){
        out.push(Object.assign({ disc:d.id, discLabel:d.label }, f));
      });
    });
    return out.sort(function(a, b){
      return (siralama[a.severity] || 9) - (siralama[b.severity] || 9);
    });
  }

  function count(discId){
    return of(discId).filter(function(f){ return f.severity !== 'none'; }).length;
  }

  return { of, all, count, dueForecast, repeatedWords,
    ASGARI, SULUK_LAPSE, BAYAT_GUN, ACIK_GUN };
})();
