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
window.LIFEOS.PARCA.yazilar({
  'spi.core.storage.buyume-hizi-icin-en-az':'Büyüme hızı için en az iki ölçüm günü gerekir. ',
  'spi.core.storage.olculmemis-hiz-sifir-hiz-deg':'Ölçülmemiş hız, sıfır hız değildir.',
  'spi.core.storage.olcumler-arasinda-en-az':'Ölçümler arasında en az ',
  'spi.core.storage.depo-bu-pencerede-buyumemis':'Depo bu pencerede büyümemiş. Hiç büyümeyen bir depo ',
  'spi.core.storage.son':'Son ',
  'spi.core.storage.bu-hizla-dokuz-ay-sonunda':'Bu hızla dokuz ay sonunda ~',
  'spi.core.storage.bu-hizla-dokuz-ay-dolmadan':'Bu hızla dokuz ay dolmadan sınır aşılır (~',
  'spi.core.storage.bu-kayitlar-budanamaz':'Bu kayıtlar budanamaz: ',
  'spi.core.storage.budanacak-bir-sey-secilmedi':'Budanacak bir şey seçilmedi.',
  'spi.core.storage.bu-hizla':'Bu hızla ',
  'spi.core.storage.buyume-hizi-henuz-olculmedi':'Büyüme hızı henüz ölçülmedi.',
});

window.LIFEOS.PARCA.yazilar({
  'spi.core.storage.surtunme-gunlugu':'Sürtünme günlüğü',
  'spi.core.storage.sistemin-kendi-maliyet-olcum':'Sistemin kendi maliyet ölçümü. Silinince geçmiş sürtünme ',
  'spi.core.storage.ofis-sohbet-gecmisi':'Ofis sohbet geçmişi',
  'spi.core.storage.uzmanlarla-yapilmis-yazismal':'Uzmanlarla yapılmış yazışmalar. Kararlar ve öneriler ayrı ',
  'spi.core.storage.uretilmis-brifingler':'Üretilmiş brifingler',
  'spi.core.storage.her-gun-yeniden-uretilebilir':'Her gün yeniden üretilebilir; saklanmaları bir kolaylıktır.',
  'spi.core.storage.eski-toplanti-tutanaklari':'Eski toplantı tutanakları',
  'spi.core.storage.toplantidan-cikan-kararlar-a':'Toplantıdan çıkan KARARLAR ayrı saklanır ve silinmez.',
  'spi.core.storage.kapanmis-denetim-sorulari':'Kapanmış denetim soruları',
  'spi.core.storage.kapanmis-sinyaller-fayda-olc':'Kapanmış sinyaller. Fayda ölçüsü bu kayıtlardan hesaplandığı ',
  'spi.core.storage.depo-doldu':'Depo doldu',
  'spi.core.storage.yeni-kayit-dusmeyebilir-once':'Yeni kayıt düşmeyebilir. Önce yedek al, sonra buda.',
  'spi.core.storage.depo-doluyor':'Depo doluyor (%',
  'spi.core.storage.dokuz-ay-sigmayabilir':'Dokuz ay sığmayabilir',
  'spi.core.storage.depo-rahat':'Depo rahat',
});


window.SP = window.SP || {};

SP.Storage = (function(){
  const U = SP.U, S = SP.S;

  /* Ornekleme defterinde tutulacak en fazla kayit. Otuz gunluk pencere
     buyume hizi icin fazlasiyla yeter ve defterin kendisi kucuk kalir. */
  const ORNEK_LIMIT = 30;

  /* Projeksiyonun anlamli sayilmasi icin gereken en az gun araligi.
     Ayni gun icinde alinan iki ornek bir "gunluk hiz" vermez. */
  const ASGARI_ARALIK = 3;

  /* Budanabilir koleksiyonlar. Hicbiri kullanicinin girdigi icerik
     DEGILDIR; hepsi sistemin kendi urettigi kayitlardir. */
  const BUDANABILIR = [
    { collection:'usage', label:yz('spi.core.storage.surtunme-gunlugu'),
      note:yz('spi.core.storage.sistemin-kendi-maliyet-olcum')
         + 'raporu kaybolur, hiçbir çalışma kaydı etkilenmez.' },
    { collection:'officeChats', label:yz('spi.core.storage.ofis-sohbet-gecmisi'),
      note:yz('spi.core.storage.uzmanlarla-yapilmis-yazismal')
         + 'saklanır; onlar silinmez.' },
    { collection:'officeBriefings', label:yz('spi.core.storage.uretilmis-brifingler'),
      note:yz('spi.core.storage.her-gun-yeniden-uretilebilir') },
    { collection:'officeMeetings', label:yz('spi.core.storage.eski-toplanti-tutanaklari'),
      note:yz('spi.core.storage.toplantidan-cikan-kararlar-a') },
    { collection:'signals', label:yz('spi.core.storage.kapanmis-denetim-sorulari'),
      note:yz('spi.core.storage.kapanmis-sinyaller-fayda-olc')
         + 'için silmek o ölçüyü sıfırlar.' },
  ];

  /* Kullanicinin girdigi icerik — ASLA budanmaz, yalnizca gosterilir. */
  const ICERIK = ['labs', 'vitals', 'meals', 'workouts', 'meds', 'foods',
    'progress', 'basket', 'prices', 'flags', 'decisions', 'proposals',
    'forecasts'];

  function bos(){ return { samples:[] }; }

  function state(){
    if(!S.storage) S.storage = bos();
    if(!Array.isArray(S.storage.samples)) S.storage.samples = [];
    return S.storage;
  }

  async function load(){
    const raw = await SP.Store.get('storage');
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
    const bytes = SP.Store.localSize();
    const son = st.samples[st.samples.length - 1];
    if(son && son.date === bugun){
      son.bytes = bytes;
    } else {
      st.samples.push({ date:bugun, bytes });
      if(st.samples.length > ORNEK_LIMIT) st.samples = st.samples.slice(-ORNEK_LIMIT);
    }
    await SP.Store.set('storage', st);
    return { date:bugun, bytes };
  }

  /* ------------------------------------------------------------ okuma */

  function breakdown(){
    const rows = SP.Store.sizeByCollection ? SP.Store.sizeByCollection() : [];
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
    const kota = SP.Store.localQuota() || {};
    const bytes = SP.Store.localSize();
    const base = { bytes, quota:kota, samples:n,
      perDay:null, daysLeft:null, cert:'missing' };

    if(n < 2){
      base.note = yz('spi.core.storage.buyume-hizi-icin-en-az')
        + yz('spi.core.storage.olculmemis-hiz-sifir-hiz-deg');
      return base;
    }
    const ilk = st.samples[0], son = st.samples[n - 1];
    const gun = U.diffDays(ilk.date, son.date);
    if(gun == null || gun < ASGARI_ARALIK){
      base.note = yz('spi.core.storage.olcumler-arasinda-en-az') + ASGARI_ARALIK + ' gün olmalı; '
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
      base.note = yz('spi.core.storage.depo-bu-pencerede-buyumemis')
        + 'dolmaz — ama bu, büyümeyeceği anlamına gelmez.';
      return base;
    }
    base.daysLeft = Math.max(0, Math.floor(kalan / perDay));
    base.note = yz('spi.core.storage.son') + gun + ' günde günde ~' + fmtBytes(Math.round(perDay))
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
        ? yz('spi.core.storage.bu-hizla-dokuz-ay-sonunda') + fmtBytes(tahmin) + ' olur; '
          + 'sınıra takılmaz.'
        : yz('spi.core.storage.bu-hizla-dokuz-ay-dolmadan') + fmtBytes(tahmin)
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
        error:yz('spi.core.storage.bu-kayitlar-budanamaz') + yasak.join(', ')
          + '. Kullanıcının girdiği veri, yer açmak için silinmez.' };
    }
    if(!istenen.length) return { ok:false, error:yz('spi.core.storage.budanacak-bir-sey-secilmedi') };

    const once = SP.Store.localSize();
    for(const c of istenen){
      const rows = (await SP.Store.list(c)) || [];
      for(const r of rows){
        if(r && r.id) await SP.Store.remove(c + '/' + r.id);
      }
      /* Tek parcali kayitlar (usage gibi) dogrudan silinir. */
      await SP.Store.remove(c);
    }
    const sonra = SP.Store.localSize();

    /* Bellekteki kopyalar da temizlenir; yoksa ekran silinmis veriyi
       gostermeye devam eder. */
    if(istenen.indexOf('usage') >= 0){ S.usage = null; if(SP.Friction) await SP.Friction.load(); }
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
      return { level:'full', title:yz('spi.core.storage.depo-doldu'),
        note:yz('spi.core.storage.yeni-kayit-dusmeyebilir-once') };
    }
    if(q.near){
      return { level:'near', title:yz('spi.core.storage.depo-doluyor') + q.pct + ')',
        note:g.daysLeft != null
          ? yz('spi.core.storage.bu-hizla') + g.daysLeft + ' gün sonra dolar.'
          : yz('spi.core.storage.buyume-hizi-henuz-olculmedi') };
    }
    if(h.cert !== 'missing' && h.willFit === false){
      return { level:'watch', title:yz('spi.core.storage.dokuz-ay-sigmayabilir'),
        note:h.note };
    }
    return { level:'ok', title:yz('spi.core.storage.depo-rahat'),
      note:g.cert === 'missing' ? g.note : h.note };
  }

  return { load, sample, breakdown, growth, horizon, prunable, prune, verdict,
    fmtBytes, BUDANABILIR, ICERIK, UFUK_GUN, ORNEK_LIMIT };
})();
