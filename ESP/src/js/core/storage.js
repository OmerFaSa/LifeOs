/* Depo sagligi — dokuz aylik kullanim icin.

   Bu dosya tek bir soruyla yazildi: bu sistem dokuz ay her gun
   kullanilirsa ne olur?

   Cevap hos degil. Tarayici deposu kaynak basina genelde ~5 MB'tir ve
   bu sinir sessizce gelir: bir gun kayit dusmemeye baslar. Mevcut
   uyari ("depo %80 dolu") ise iki seyi soylemiyordu:

     1. NEYIN buyudugunu. Toplam yuzde, hangi koleksiyonun sisdigini
        soylemez; kullanici ne silecegini bilemez.
     2. NE ZAMAN dolacagini. %80 bir hafta sonra mi dolacak, alti ay
        sonra mi? Ikisi bambaska kararlar gerektirir.

   Uc karar bu dosyayi yonetir:

   1. BUYUME OLCULUR, TAHMIN EDILMEZ. Her acilista toplam boyut bir
      ornekleme defterine yazilir. Gunluk buyume hizi bu defterden
      HESAPLANIR; iki ornekten az varsa hiz "bilinmiyor"dur — iki nokta
      her zaman bir dogru cizer ve o dogru bir egilim degildir.

   2. ICERIK ASLA KENDILIGINDEN SILINMEZ. Budanabilir olan yalnizca
      SISTEMIN KENDI URETTIGI kayitlardir: surtunme gunlugu, ofis sohbet
      gecmisi, uretilmis brifingler. Kullanicinin girdigi tek bir oturum,
      kart ya da not bu listede yer almaz — hicbir kosulda.

   3. UYARI EYLEME BAGLI OLMALIDIR. "Depo doluyor" demek yetmez; yaninda
      "su kadar yer su kadarda acilir" yazmayan bir uyari, kaygi uretir
      ve cozum uretmez. */

window.ESP = window.ESP || {};

ESP.Storage = (function(){
  const U = ESP.U, S = ESP.S;

  /* Ornekleme defterinde tutulacak en fazla kayit. Otuz gunluk pencere
     buyume hizi icin fazlasiyla yeter ve defterin kendisi kucuk kalir. */
  const ORNEK_LIMIT = 30;

  /* Projeksiyonun anlamli sayilmasi icin gereken en az gun araligi.
     Ayni gun icinde alinan iki ornek bir "gunluk hiz" vermez. */
  const ASGARI_ARALIK = 3;

  /* Budanabilir koleksiyonlar. Hicbiri kullanicinin girdigi icerik
     DEGILDIR; hepsi sistemin kendi urettigi kayitlardir. */
  const BUDANABILIR = [
    { collection:'usage', label:'Sürtünme günlüğü',
      note:'Sistemin kendi maliyet ölçümü. Silinince geçmiş sürtünme '
         + 'raporu kaybolur, hiçbir çalışma kaydı etkilenmez.' },
    { collection:'officeChats', label:'Ofis sohbet geçmişi',
      note:'Koçlarla yapılmış yazışmalar. Kararlar ve teklifler ayrı '
         + 'saklanır; onlar silinmez.' },
    { collection:'officeBriefings', label:'Üretilmiş brifingler',
      note:'Her gün yeniden üretilebilir; saklanmaları bir kolaylıktır.' },
    { collection:'officeMeetings', label:'Eski toplantı tutanakları',
      note:'Toplantıdan çıkan KARARLAR ayrı saklanır ve silinmez.' },
    { collection:'signals', label:'Kapanmış denetim soruları',
      note:'Kapanmış sinyaller. Fayda ölçüsü bu kayıtlardan hesaplandığı '
         + 'için silmek o ölçüyü sıfırlar.' },
  ];

  /* Kullanicinin girdigi icerik — ASLA budanmaz, yalnizca gosterilir. */
  const ICERIK = ['days', 'cards', 'notes', 'args', 'books', 'pieces',
    'recordings', 'drafts', 'goals', 'events', 'sources', 'chains',
    'assets', 'reminders', 'forecasts', 'decisions', 'proposals'];

  function bos(){ return { samples:[] }; }

  function state(){
    if(!S.storage) S.storage = bos();
    if(!Array.isArray(S.storage.samples)) S.storage.samples = [];
    return S.storage;
  }

  async function load(){
    const raw = await ESP.Store.get('storage');
    S.storage = Object.assign(bos(), raw || {});
    /* Depodan gelen `samples` bir DIZI olmayabilir: bozuk ya da elle
       duzenlenmis bir yedek buraya string de gonderebilir. Object.assign
       onu oldugu gibi tasir ve bir sonraki .filter cagrisi uygulamayi
       acilista oldururdu. Once sekil dogrulanir, sonra icerik. */
    if(!Array.isArray(S.storage.samples)) S.storage.samples = [];
    S.storage.samples = S.storage.samples
      .filter(x => x && U.isISO(x.date) && isFinite(Number(x.bytes)))
      .map(x => ({ date:x.date, bytes:Math.max(0, Math.round(Number(x.bytes))) }))
      .slice(-ORNEK_LIMIT);
    return S.storage;
  }

  /* Gunde bir ornek. Ayni gun icinde ikinci cagri yalnizca degeri
     GUNCELLER; iki ornek ayni gune yazilirsa hiz hesabi bozulur. */
  async function sample(){
    const st = state();
    const bugun = U.todayISO();
    const bytes = ESP.Store.localSize();
    const son = st.samples[st.samples.length - 1];
    if(son && son.date === bugun){
      son.bytes = bytes;
    } else {
      st.samples.push({ date:bugun, bytes });
      if(st.samples.length > ORNEK_LIMIT) st.samples = st.samples.slice(-ORNEK_LIMIT);
    }
    await ESP.Store.set('storage', st);
    return { date:bugun, bytes };
  }

  /* ------------------------------------------------------------ okuma */

  function breakdown(){
    const rows = ESP.Store.sizeByCollection ? ESP.Store.sizeByCollection() : [];
    const budaMap = {};
    BUDANABILIR.forEach(b => { budaMap[b.collection] = b; });
    return rows.map(r => Object.assign({}, r, {
      prunable:!!budaMap[r.collection],
      content:ICERIK.indexOf(r.collection) >= 0,
      label:(budaMap[r.collection] || {}).label || r.collection,
    }));
  }

  /* Gunluk buyume hizi ve doluluk projeksiyonu.

     `cert`:
       'missing'   iki ornekten az ya da aralik cok kisa — hiz BILINMIYOR
       'estimated' hesaplandi; az sayida ornege dayaniyor
       'measured'  en az on gunluk ornekle hesaplandi */
  function growth(){
    const st = state();
    const n = st.samples.length;
    const kota = ESP.Store.localQuota() || {};
    const bytes = ESP.Store.localSize();
    const base = { bytes, quota:kota, samples:n,
      perDay:null, daysLeft:null, cert:'missing' };

    if(n < 2){
      base.note = 'Büyüme hızı için en az iki ölçüm günü gerekir. '
        + 'Ölçülmemiş hız, sıfır hız değildir.';
      return base;
    }
    const ilk = st.samples[0], son = st.samples[n - 1];
    const gun = U.diffDays(ilk.date, son.date);
    if(gun == null || gun < ASGARI_ARALIK){
      base.note = 'Ölçümler arasında en az ' + ASGARI_ARALIK + ' gün olmalı; '
        + 'daha kısa aralık günlük hız vermez.';
      return base;
    }
    const perDay = (son.bytes - ilk.bytes) / gun;
    base.perDay = Math.round(perDay);
    base.cert = n >= 10 ? 'measured' : 'estimated';
    base.spanDays = gun;

    const kalan = (kota.limit || 0) - bytes;
    if(perDay <= 0){
      base.daysLeft = null;
      base.note = 'Depo bu pencerede büyümemiş. Hiç büyümeyen bir depo '
        + 'dolmaz — ama bu, büyümeyeceği anlamına gelmez.';
      return base;
    }
    base.daysLeft = Math.max(0, Math.floor(kalan / perDay));
    base.note = 'Son ' + gun + ' günde günde ~' + fmtBytes(Math.round(perDay))
      + ' büyüdü. Bu hızla ' + base.daysLeft + ' gün sonra dolar.';
    return base;
  }

  /* Dokuz aylik ufuk: bu hizla 270 gun sonra ne olur?

     Sistemin kendi yol haritasi dokuz aylik bir kullanim varsayiyor;
     projeksiyon da o ufka gore okunur. */
  const UFUK_GUN = 270;

  function horizon(){
    const g = growth();
    if(g.cert === 'missing' || g.perDay == null){
      return { cert:'missing', note:g.note, willFit:null };
    }
    const kota = g.quota || {};
    const tahmin = g.bytes + (g.perDay > 0 ? g.perDay * UFUK_GUN : 0);
    const sigar = tahmin < (kota.limit || Infinity);
    return {
      cert:g.cert, days:UFUK_GUN, projected:tahmin, limit:kota.limit || null,
      willFit:sigar, perDay:g.perDay,
      note:sigar
        ? 'Bu hızla dokuz ay sonunda ~' + fmtBytes(tahmin) + ' olur; '
          + 'sınıra takılmaz.'
        : 'Bu hızla dokuz ay dolmadan sınır aşılır (~' + fmtBytes(tahmin)
          + '). Yedek alıp budamak ya da eski dönemleri dışa aktarmak gerekir.',
    };
  }

  /* ------------------------------------------------------------ budama */

  /* Budanabilir kayitlarin listesi ve kazandiracagi yer.
     Icerik ASLA bu listede yer almaz. */
  function prunable(){
    const boyut = {};
    breakdown().forEach(r => { boyut[r.collection] = r; });
    return BUDANABILIR.map(b => {
      const r = boyut[b.collection];
      return Object.assign({}, b, {
        bytes:r ? r.bytes : 0, count:r ? r.count : 0, empty:!r || !r.count });
    }).filter(x => !x.empty);
  }

  function fmtBytes(n){
    const b = Number(n) || 0;
    if(b < 1024) return b + ' B';
    if(b < 1024 * 1024) return Math.round(b / 1024) + ' KB';
    return (Math.round(b / 1024 / 102.4) / 10) + ' MB';
  }

  /* Budama. Yalnizca BUDANABILIR listesindeki koleksiyonlar silinebilir;
     baska bir ad gelirse islem reddedilir ve sebebi soylenir.

     Bu bir savunma degil bir SOZDUR: kullanicinin girdigi veriyi sistem
     kendi yer acmak icin silmez. */
  async function prune(collections){
    const istenen = (collections || []).slice();
    const izinli = BUDANABILIR.map(b => b.collection);
    const yasak = istenen.filter(c => izinli.indexOf(c) < 0);
    if(yasak.length){
      return { ok:false, refused:yasak,
        error:'Bu kayıtlar budanamaz: ' + yasak.join(', ')
          + '. Kullanıcının girdiği veri, yer açmak için silinmez.' };
    }
    if(!istenen.length) return { ok:false, error:'Budanacak bir şey seçilmedi.' };

    const once = ESP.Store.localSize();
    for(const c of istenen){
      const rows = (await ESP.Store.list(c)) || [];
      for(const r of rows){
        if(r && r.id) await ESP.Store.remove(c + '/' + r.id);
      }
      /* Tek parcali kayitlar (usage gibi) dogrudan silinir. */
      await ESP.Store.remove(c);
    }
    const sonra = ESP.Store.localSize();

    /* Bellekteki kopyalar da temizlenir; yoksa ekran silinmis veriyi
       gostermeye devam eder. */
    if(istenen.indexOf('usage') >= 0){ S.usage = null; if(ESP.Friction) await ESP.Friction.load(); }
    if(istenen.indexOf('signals') >= 0){ S.signals = (S.signals || []).filter(x => x.status === 'open'); }
    if(istenen.indexOf('officeChats') >= 0) S.officeChats = {};
    if(istenen.indexOf('officeBriefings') >= 0) S.officeBriefings = {};
    if(istenen.indexOf('officeMeetings') >= 0) S.officeMeetings = [];

    return { ok:true, freed:Math.max(0, once - sonra), before:once, after:sonra };
  }

  /* Ekran icin tek cumle. */
  function verdict(){
    const g = growth();
    const h = horizon();
    const q = g.quota || {};
    if(q.full){
      return { level:'full', title:'Depo doldu',
        note:'Yeni kayıt düşmeyebilir. Önce yedek al, sonra buda.' };
    }
    if(q.near){
      return { level:'near', title:'Depo doluyor (%' + q.pct + ')',
        note:g.daysLeft != null
          ? 'Bu hızla ' + g.daysLeft + ' gün sonra dolar.'
          : 'Büyüme hızı henüz ölçülmedi.' };
    }
    if(h.cert !== 'missing' && h.willFit === false){
      return { level:'watch', title:'Dokuz ay sığmayabilir',
        note:h.note };
    }
    return { level:'ok', title:'Depo rahat',
      note:g.cert === 'missing' ? g.note : h.note };
  }

  return { load, sample, breakdown, growth, horizon, prunable, prune, verdict,
    fmtBytes, BUDANABILIR, ICERIK, UFUK_GUN, ORNEK_LIMIT };
})();
