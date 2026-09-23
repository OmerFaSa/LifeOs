/* Bölüm denetimi — her alanda "bir şey ters gidiyor mu?"

   ESP ve AYS'de kurulan denetimin SPİ'deki hali. Kurallar aynı, alan
   farklı — ve burada bir kural daha var, çünkü alan sağlık:

     DENETİM TEŞHİS KOYMAZ.

   Bir bulgu asla "şu hastalığın var" ya da "şu değerin tehlikeli" demez.
   Söyleyebileceği tek şey, KAYDIN durumudur: tahlil eskimiş, ölçüm
   girilmemiş, kırmızı bayrak açık kalmış. Değerin ne anlama geldiği
   hekimin işidir (SP.CLINICAL).

   Dört ortak kural:

   1. BULGU EYLEME BAĞLI OLMAK ZORUNDADIR.
   2. VERİ YOKSA BULGU DA YOKTUR — "ölçülmedi" ile "temiz" aynı şey değil.
   3. BULGU SUÇLAMAZ. "Düzensizsin" denmez, "şu kayıtlar şu durumda" denir.
   4. NÖBETÇİYLE AYNI ŞEY SÖYLENMEZ — o çaba–sonuç ayrışmasını arar,
      bu birikmiş bakım borcunu. */

window.SP = window.SP || {};

SP.Audit = (function(){
  const U = SP.U, S = SP.S, M = SP.Model;

  const ASGARI = 3;

  /* Bir tahlil paneli bu kadar gun sonra "eskimis" sayilir. Alti ay,
     ACIKCA SECILMIS bir siniridir — klinik bir takip araligi degildir
     ve oyle sunulmaz. */
  const TAHLIL_ESKI_GUN = 180;

  /* Bir kirmizi bayrak bu kadar gun acik kalirsa hatirlatilir. */
  const BAYRAK_GUN = 7;

  function bul(id, o){
    return Object.assign({ id, severity:'info', cert:'measured', items:[] }, o);
  }
  function gunFark(iso){
    const d = U.diffDays(String(iso || '').slice(0, 10), U.todayISO());
    return d == null ? null : d;
  }

  /* ------------------------------------------------------------ tahlil */

  function labFindings(){
    const out = [];
    const tahliller = (S.labs || []);
    if(!tahliller.length){
      return [bul('lab-veri', { severity:'none', cert:'missing', route:'labs',
        title:'Tahlil yok',
        note:'Hiç tahlil girilmemiş. Bu "her şey yolunda" demek değil, '
           + '"ölçülmedi" demektir.' })];
    }

    const son = tahliller[tahliller.length - 1];
    const yas = gunFark(son.date);

    /* 1 — Eskimis tahlil. Degerin ne oldugu degil, KAYDIN yasi soylenir. */
    if(yas != null && yas >= TAHLIL_ESKI_GUN){
      out.push(bul('lab-stale', { severity:'warn', route:'labs',
        title:'Son tahlil ' + yas + ' gün önce',
        note:'Kayıttaki en yeni tahlil altı aydan eski. Sistem buradan bir '
           + 'sağlık sonucu çıkarmaz; yalnızca üzerine karar kurduğu '
           + 'sayıların eskidiğini söyler. Tekrar zamanı hekimin kararıdır.',
        items:[{ id:son.id, label:U.fmtDate(son.date), meta:yas + ' gün' }] }));
    }

    /* 2 — Acik kirmizi bayrak. Sistem yorumlamaz, hatirlatir. */
    const bayraklar = (M.openFlags ? M.openFlags() : [])
      .filter(f => (gunFark(f.firstSeenAt || f.at) || 0) >= BAYRAK_GUN);
    if(bayraklar.length){
      out.push(bul('lab-flag-open', { severity:'warn', route:'labs',
        title:bayraklar.length + ' kırmızı bayrak bir haftadır açık',
        note:'Bu bayraklar hekime yönlendirme içindir ve sistem onları '
           + 'yorumlamaz. Açık kalmaları bir sonuç değil, bir hatırlatmadır: '
           + 'değerlendirildiyse kapatmak listeyi sadeleştirir.',
        items:bayraklar.slice(0, 5).map(f => ({ id:f.id,
          label:f.label || f.markerId || 'bayrak',
          meta:gunFark(f.firstSeenAt || f.at) + ' gün' })) }));
    }

    /* 3 — Tek ölçümlü belirtec: egilim iki noktadan cizilmez. */
    const tekli = [];
    (SP.BIOMARKERS || []).forEach(function(b){
      const seri = M.seriesOf(b.id) || [];
      if(seri.length === 1) tekli.push({ b:b, tarih:seri[0].date });
    });
    if(tekli.length >= 5){
      out.push(bul('lab-single', { severity:'info', route:'labs',
        title:tekli.length + ' ölçümün tek noktası var',
        note:'Tek ölçüm bir değerdir, bir eğilim değil. Sistem bunlardan '
           + 'yön çıkarmaz; ikinci ölçüm geldiğinde çıkarır.',
        items:tekli.slice(0, 5).map(x => ({ id:x.b.id, label:x.b.name,
          meta:U.fmtShort(x.tarih) })) }));
    }

    return out;
  }

  /* ------------------------------------------------------------- öğün */

  function mealFindings(){
    const out = [];
    const gunler = Object.keys(S.meals || {}).filter(d => (S.meals[d] || []).length);
    if(gunler.length < ASGARI){
      return [bul('meal-veri', { severity:'none', cert:'missing', route:'meals',
        title:'Öğün kaydı az',
        note:'Denetim için en az ' + ASGARI + ' günlük öğün kaydı gerekir.' })];
    }

    const son14 = U.lastDays(14);
    const kayitli = son14.filter(d => (S.meals[d] || []).length);

    /* 1 — Seyrek kayit: ortalama bir seyi olcmuyorsa uzerine karar kurulmaz. */
    if(kayitli.length <= 4){
      out.push(bul('meal-sparse', { severity:'info', route:'meals',
        title:'Son iki haftanın ' + kayitli.length + ' gününde kayıt var',
        note:'Beslenme hedefleri ortalamadan okunur; dört günlük bir '
           + 'ortalama iki haftayı temsil etmez. Girilmeyen gün sıfır '
           + 'sayılmaz — hesaba hiç girmez.' }));
    }

    /* 2 — Bilinmeyen kalem: tanimlanamayan gida hesaba GIRMEZ ve bu
       sessizce eksik bir toplam uretir. */
    let bilinmeyen = 0;
    const ornek = [];
    kayitli.forEach(function(d){
      /* `unknown` değeri bilinmeyen BESİN ÖĞESİDİR (BAM gıdasında boş kalan
         mikro); tanınmayan GIDA `unknownFoods`tadır. İkisini karıştırmak
         «calcium tanınmadı» gibi anlamsız bir uyarı üretiyordu. */
      const t = SP.Nutri.dayTotals(d);
      ((t && t.unknownFoods) || []).forEach(function(k){
        bilinmeyen++;
        if(ornek.indexOf(k) < 0 && ornek.length < 5) ornek.push(k);
      });
    });
    if(bilinmeyen >= 3){
      out.push(bul('meal-unknown', { severity:'warn', route:'kitchen',
        title:bilinmeyen + ' kalem tanınmadı',
        note:'Tanınmayan gıda hesaba GİRMEZ: toplam sessizce eksik çıkar. '
           + 'Mutfağa kendi gıdanı eklemek, bu boşluğu tek seferde kapatır.',
        items:ornek.map(k => ({ id:k, label:k, meta:'tanınmadı' })) }));
    }

    /* 3 — Tek yemek tekrari: cesitlilik bir hedef degil ama tek kaynaga
       bagimlilik bir riskitir. */
    const yemekSay = {};
    kayitli.forEach(function(d){
      (S.meals[d] || []).forEach(function(m){
        (m.items || []).forEach(function(it){
          const k = it.foodId || it.name;
          if(k) yemekSay[k] = (yemekSay[k] || 0) + 1;
        });
      });
    });
    const adlar = Object.keys(yemekSay);
    if(adlar.length >= 5){
      const toplam = adlar.reduce((a, k) => a + yemekSay[k], 0);
      const enCok = adlar.reduce((m, k) => yemekSay[k] > yemekSay[m] ? k : m, adlar[0]);
      if(yemekSay[enCok] / toplam > 0.3){
        out.push(bul('meal-monotony', { severity:'info', route:'meals',
          title:'Kalemlerin %' + Math.round(100 * yemekSay[enCok] / toplam)
            + '\'i tek gıdadan',
          note:'Çeşitlilik bir hedef değildir ve az çeşit hatalı da değildir. '
             + 'Ama tek kaynağa bağlı bir öğün düzeni, o kaynak kesildiğinde '
             + 'bütün hedefleri birden düşürür.',
          items:[{ id:enCok, label:enCok, meta:yemekSay[enCok] + ' kez' }] }));
      }
    }

    return out;
  }

  /* ---------------------------------------------------------- hareket */

  function moveFindings(){
    const out = [];
    const seanslar = (S.workouts || []);
    if(seanslar.length < ASGARI){
      return [bul('move-veri', { severity:'none', cert:'missing', route:'move',
        title:'Antrenman kaydı az',
        note:'Denetim için en az ' + ASGARI + ' seans gerekir.' })];
    }

    /* 1 — Yuk orani. Kural motoru zaten hesapliyor; burada EYLEME baglaniyor.
       Sistem yuku kendiliginden AZALTABILIR ama ARTIRAMAZ. */
    const acwr = SP.Move.loadRatio ? SP.Move.loadRatio() : null;
    if(acwr && acwr.ok && acwr.zone === 'high'){
      out.push(bul('move-load-high', { severity:'warn', route:'move',
        title:'Akut yük, kronik yükün çok üstünde',
        note:acwr.note + ' Bu bir yasak değil bir uyarıdır: yükü artırma '
           + 'kararı senin, ama sistem artırmayı önermez.',
        items:[{ id:'acwr', label:'Oran', meta:String(acwr.ratio) }] }));
    }

    /* 2 — RPE girilmemis seanslar: zorluk olculmezse yuk de olculmez. */
    const rpesiz = seanslar.slice(-14).filter(w => w.rpe == null);
    if(rpesiz.length >= 5){
      out.push(bul('move-no-rpe', { severity:'info', route:'move',
        title:rpesiz.length + ' seansta zorluk girilmemiş',
        note:'Yük = süre × zorluk. Zorluk girilmeyen seans yük hesabına '
           + 'girmez ve akut/kronik oranı eksik kalır. Sıfır sayılmaz, '
           + 'hiç sayılmaz.',
        items:rpesiz.slice(0, 5).map(w => ({ id:w.id,
          label:U.fmtShort(w.date), meta:(w.name || '') })) }));
    }

    /* 3 — Uzun aradan sonra donus: ilk hafta yuku duser, bu bir kayip degil. */
    const tarihler = seanslar.map(w => w.date).sort();
    let enUzunAra = 0, araBitis = null;
    for(let i = 1; i < tarihler.length; i++){
      const f = U.diffDays(tarihler[i - 1], tarihler[i]);
      if(f != null && f > enUzunAra){ enUzunAra = f; araBitis = tarihler[i]; }
    }
    const donusGun = araBitis ? gunFark(araBitis) : null;
    if(enUzunAra >= 21 && donusGun != null && donusGun <= 14){
      out.push(bul('move-return', { severity:'info', route:'move',
        title:enUzunAra + ' günlük aradan sonra dönüş',
        note:'Aradan sonra ilk haftalarda kapasite düşer ve bu bir kayıp '
           + 'değil bir gerçektir. Eski yükten değil, güncel kapasiteden '
           + 'başlamak sakatlanma riskini azaltır.',
        items:[{ id:araBitis, label:U.fmtShort(araBitis),
          meta:enUzunAra + ' gün ara' }] }));
    }

    return out;
  }

  /* ------------------------------------------------------------- ilaç */

  function medFindings(){
    const out = [];
    const ilaclar = (S.meds || []);
    if(!ilaclar.length){
      return [bul('med-veri', { severity:'none', cert:'missing', route:'today',
        title:'İlaç/takviye kaydı yok',
        note:'Kayıt yoksa etkileşim ve emilim uyarıları da üretilemez. '
           + 'Bu "etkileşim yok" demek değildir.' })];
    }

    /* 1 — Bitis tarihi gecmis ama listede duran kayit. */
    const bitmis = ilaclar.filter(m => m.endDate && m.endDate < U.todayISO());
    if(bitmis.length){
      out.push(bul('med-ended', { severity:'info', route:'today',
        title:bitmis.length + ' kaydın bitiş tarihi geçmiş',
        note:'Bitmiş kayıtlar günlük listede yer kaplar ve etkileşim '
           + 'uyarılarını gereksiz yere üretir. Kayıt silinmez, yalnızca '
           + 'geçmişe taşınır.',
        items:bitmis.slice(0, 5).map(m => ({ id:m.id,
          label:m.name || '(adsız)', meta:'bitiş ' + m.endDate })) }));
    }

    /* 2 — Adsiz kayit: neyin alindigi bilinmiyorsa etkilesim de bilinmez. */
    const adsiz = ilaclar.filter(m => !String(m.name || '').trim());
    if(adsiz.length){
      out.push(bul('med-unnamed', { severity:'warn', route:'today',
        title:adsiz.length + ' kayıt adsız',
        note:'Adı olmayan kayıt için etkileşim ve emilim kuralı '
           + 'çalıştırılamaz. Sistem bu kaydı görür ama hakkında hiçbir '
           + 'şey söyleyemez.',
        items:adsiz.slice(0, 5).map(m => ({ id:m.id, label:'(adsız)',
          meta:m.kindId || '' })) }));
    }

    /* 3 — Uzun suredir surmekte olan kayit: bitisi yazilmamis olabilir. */
    const uzun = ilaclar.filter(m => !m.endDate
      && (gunFark(m.startDate) || 0) >= 365);
    if(uzun.length){
      out.push(bul('med-long', { severity:'info', route:'today',
        title:uzun.length + ' kayıt bir yıldır açık',
        note:'Bir yıldır bitiş tarihi girilmemiş kayıtlar. Gerçekten '
           + 'sürüyor olabilir — ya da bitirilip kapatılmamış olabilir. '
           + 'Sistem hangisi olduğunu bilmez ve varsaymaz.',
        items:uzun.slice(0, 5).map(m => ({ id:m.id, label:m.name || '(adsız)',
          meta:gunFark(m.startDate) + ' gün' })) }));
    }

    return out;
  }

  /* ------------------------------------------------------ günlük ölçüm */

  function vitalFindings(){
    const out = [];
    const gunler = Object.keys(S.vitals || {});
    if(gunler.length < ASGARI){
      return [bul('vital-veri', { severity:'none', cert:'missing', route:'today',
        title:'Günlük ölçüm az',
        note:'Denetim için en az ' + ASGARI + ' günlük ölçüm gerekir.' })];
    }

    const son14 = U.lastDays(14);
    const dolu = son14.filter(d => S.vitals[d]);

    /* 1 — Seyrek olcum: toparlanma skoru kendi temel cizgine gore
       hesaplanir ve o cizgi ancak duzenli olcumle kurulur. */
    if(dolu.length <= 4){
      out.push(bul('vital-sparse', { severity:'info', route:'today',
        title:'Son iki haftanın ' + dolu.length + ' gününde ölçüm var',
        note:'Toparlanma skoru KENDİ temel çizgine göre hesaplanır; o çizgi '
           + 'ancak düzenli ölçümle kurulur. Seyrek ölçüm, skoru başkasının '
           + 'ortalamasına değil hiçbir şeye göre bırakır.' }));
    }

    /* 2 — Hep ayni deger: cihaz ya da alisikanlik sorunu olabilir. */
    const uykular = dolu.map(d => (S.vitals[d] || {}).sleep)
      .filter(v => v != null);
    if(uykular.length >= 7){
      const ilk = uykular[0];
      if(uykular.every(v => v === ilk)){
        out.push(bul('vital-flat', { severity:'info', route:'today',
          title:'Uyku süresi ' + uykular.length + ' gündür aynı',
          note:'Aynı değerin tekrar etmesi mümkündür ama nadirdir. Varsayılan '
             + 'değer kaydedilmiş olabilir; öyleyse o sayı bir ölçüm değil '
             + 'bir dolgudur ve hesaba öyle girer.',
          items:[{ id:'sleep', label:'Uyku', meta:ilk + ' saat' }] }));
      }
    }

    return out;
  }

  /* ---------------------------------------------------------- toplama */

  const AREAS = [
    { id:'labs', label:'Tahlil', fn:labFindings },
    { id:'meals', label:'Öğün', fn:mealFindings },
    { id:'move', label:'Hareket', fn:moveFindings },
    { id:'meds', label:'İlaç ve takviye', fn:medFindings },
    { id:'vitals', label:'Günlük ölçüm', fn:vitalFindings },
  ];

  /* Bir alanin taramasi patlarsa SESSIZCE bos donmez: denetim motorunun
     kendi hatasini gizlemesi, denetimin amacina aykiridir. */
  function of(areaId){
    const a = AREAS.filter(function(x){ return x.id === areaId; })[0];
    if(!a) return [];
    try{ return a.fn(); }
    catch(e){
      return [bul('audit-error-' + areaId, { severity:'warn', cert:'missing',
        title:a.label + ' taraması çalışmadı',
        note:'Bu alanın denetimi bir hatayla durdu: '
           + String((e && e.message) || e)
           + '. Bu bir sağlık bulgusu değil bir yazılım hatasıdır; '
           + 'kayıtların etkilenmez.' })];
    }
  }

  function all(){
    const siralama = { warn:0, info:1, none:2 };
    /* `||` kullanilamaz: warn degeri SIFIR ve `0 || 9` dokuz doner. */
    const sira = function(s){ return siralama[s] == null ? 9 : siralama[s]; };
    const out = [];
    AREAS.forEach(function(a){
      of(a.id).forEach(function(f){
        out.push(Object.assign({ area:a.id, areaLabel:a.label }, f));
      });
    });
    return out.sort(function(x, y){ return sira(x.severity) - sira(y.severity); });
  }

  function count(){ return all().filter(f => f.severity !== 'none').length; }

  return { of, all, count, AREAS, ASGARI, TAHLIL_ESKI_GUN, BAYRAK_GUN };
})();
