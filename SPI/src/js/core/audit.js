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
window.LIFEOS.PARCA.yazilar({
  'spi.core.audit.tahlil-yok':'Tahlil yok',
  'spi.core.audit.hic-tahlil-girilmemis-bu-her':'Hiç tahlil girilmemiş. Bu "her şey yolunda" demek değil, ',
  'spi.core.audit.son-tahlil':'Son tahlil ',
  'spi.core.audit.kayittaki-en-yeni-tahlil-alt':'Kayıttaki en yeni tahlil altı aydan eski. Sistem buradan bir ',
  'spi.core.audit.bu-bayraklar-hekime-yonlendi':'Bu bayraklar hekime yönlendirme içindir ve sistem onları ',
  'spi.core.audit.tek-olcum-bir-degerdir-bir':'Tek ölçüm bir değerdir, bir eğilim değil. Sistem bunlardan ',
  'spi.core.audit.ogun-kaydi-az':'Öğün kaydı az',
  'spi.core.audit.denetim-icin-en-az':'Denetim için en az ',
  'spi.core.audit.son-iki-haftanin':'Son iki haftanın ',
  'spi.core.audit.beslenme-hedefleri-ortalamad':'Beslenme hedefleri ortalamadan okunur; dört günlük bir ',
  'spi.core.audit.taninmayan-gida-hesaba-gi-rm':'Tanınmayan gıda hesaba GİRMEZ: toplam sessizce eksik çıkar. ',
  'spi.core.audit.kalemlerin':'Kalemlerin %',
  'spi.core.audit.cesitlilik-bir-hedef-degildi':'Çeşitlilik bir hedef değildir ve az çeşit hatalı da değildir. ',
  'spi.core.audit.antrenman-kaydi-az':'Antrenman kaydı az',
  'spi.core.audit.akut-yuk-kronik-yukun-cok':'Akut yük, kronik yükün çok üstünde',
  'spi.core.audit.oran':'Oran',
  'spi.core.audit.yuk-sure-zorluk':'Yük = süre × zorluk. Zorluk girilmeyen seans yük hesabına ',
  'spi.core.audit.aradan-sonra-ilk-haftalarda':'Aradan sonra ilk haftalarda kapasite düşer ve bu bir kayıp ',
  'spi.core.audit.i-lac-takviye-kaydi-yok':'İlaç/takviye kaydı yok',
  'spi.core.audit.kayit-yoksa-etkilesim-ve-emi':'Kayıt yoksa etkileşim ve emilim uyarıları da üretilemez. ',
  'spi.core.audit.bitmis-kayitlar-gunluk-liste':'Bitmiş kayıtlar günlük listede yer kaplar ve etkileşim ',
  'spi.core.audit.adi-olmayan-kayit-icin-etkil':'Adı olmayan kayıt için etkileşim ve emilim kuralı ',
  'spi.core.audit.adsiz':'(adsız)',
  'spi.core.audit.bir-yildir-bitis-tarihi-giri':'Bir yıldır bitiş tarihi girilmemiş kayıtlar. Gerçekten ',
  'spi.core.audit.gunluk-olcum-az':'Günlük ölçüm az',
  'spi.core.audit.toparlanma-skoru-kendi-temel':'Toparlanma skoru KENDİ temel çizgine göre hesaplanır; o çizgi ',
  'spi.core.audit.uyku-suresi':'Uyku süresi ',
  'spi.core.audit.ayni-degerin-tekrar-etmesi-m':'Aynı değerin tekrar etmesi mümkündür ama nadirdir. Varsayılan ',
  'spi.core.audit.uyku':'Uyku',
  'spi.core.audit.tahlil':'Tahlil',
  'spi.core.audit.ogun':'Öğün',
  'spi.core.audit.hareket':'Hareket',
  'spi.core.audit.i-lac-ve-takviye':'İlaç ve takviye',
  'spi.core.audit.gunluk-olcum':'Günlük ölçüm',
  'spi.core.audit.bu-alanin-denetimi-bir-hatay':'Bu alanın denetimi bir hatayla durdu: ',
});


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
        title:yz('spi.core.audit.tahlil-yok'),
        note:yz('spi.core.audit.hic-tahlil-girilmemis-bu-her')
           + '"ölçülmedi" demektir.' })];
    }

    const son = tahliller[tahliller.length - 1];
    const yas = gunFark(son.date);

    /* 1 — Eskimis tahlil. Degerin ne oldugu degil, KAYDIN yasi soylenir. */
    if(yas != null && yas >= TAHLIL_ESKI_GUN){
      out.push(bul('lab-stale', { severity:'warn', route:'labs',
        title:yz('spi.core.audit.son-tahlil') + yas + ' gün önce',
        note:yz('spi.core.audit.kayittaki-en-yeni-tahlil-alt')
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
        note:yz('spi.core.audit.bu-bayraklar-hekime-yonlendi')
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
        note:yz('spi.core.audit.tek-olcum-bir-degerdir-bir')
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
        title:yz('spi.core.audit.ogun-kaydi-az'),
        note:yz('spi.core.audit.denetim-icin-en-az') + ASGARI + ' günlük öğün kaydı gerekir.' })];
    }

    const son14 = U.lastDays(14);
    const kayitli = son14.filter(d => (S.meals[d] || []).length);

    /* 1 — Seyrek kayit: ortalama bir seyi olcmuyorsa uzerine karar kurulmaz. */
    if(kayitli.length <= 4){
      out.push(bul('meal-sparse', { severity:'info', route:'meals',
        title:yz('spi.core.audit.son-iki-haftanin') + kayitli.length + ' gününde kayıt var',
        note:yz('spi.core.audit.beslenme-hedefleri-ortalamad')
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
        note:yz('spi.core.audit.taninmayan-gida-hesaba-gi-rm')
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
          title:yz('spi.core.audit.kalemlerin') + Math.round(100 * yemekSay[enCok] / toplam)
            + '\'i tek gıdadan',
          note:yz('spi.core.audit.cesitlilik-bir-hedef-degildi')
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
        title:yz('spi.core.audit.antrenman-kaydi-az'),
        note:yz('spi.core.audit.denetim-icin-en-az') + ASGARI + ' seans gerekir.' })];
    }

    /* 1 — Yuk orani. Kural motoru zaten hesapliyor; burada EYLEME baglaniyor.
       Sistem yuku kendiliginden AZALTABILIR ama ARTIRAMAZ. */
    const acwr = SP.Move.loadRatio ? SP.Move.loadRatio() : null;
    if(acwr && acwr.ok && acwr.zone === 'high'){
      out.push(bul('move-load-high', { severity:'warn', route:'move',
        title:yz('spi.core.audit.akut-yuk-kronik-yukun-cok'),
        note:acwr.note + ' Bu bir yasak değil bir uyarıdır: yükü artırma '
           + 'kararı senin, ama sistem artırmayı önermez.',
        items:[{ id:'acwr', label:yz('spi.core.audit.oran'), meta:String(acwr.ratio) }] }));
    }

    /* 2 — RPE girilmemis seanslar: zorluk olculmezse yuk de olculmez. */
    const rpesiz = seanslar.slice(-14).filter(w => w.rpe == null);
    if(rpesiz.length >= 5){
      out.push(bul('move-no-rpe', { severity:'info', route:'move',
        title:rpesiz.length + ' seansta zorluk girilmemiş',
        note:yz('spi.core.audit.yuk-sure-zorluk')
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
        note:yz('spi.core.audit.aradan-sonra-ilk-haftalarda')
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
        title:yz('spi.core.audit.i-lac-takviye-kaydi-yok'),
        note:yz('spi.core.audit.kayit-yoksa-etkilesim-ve-emi')
           + 'Bu "etkileşim yok" demek değildir.' })];
    }

    /* 1 — Bitis tarihi gecmis ama listede duran kayit. */
    const bitmis = ilaclar.filter(m => m.endDate && m.endDate < U.todayISO());
    if(bitmis.length){
      out.push(bul('med-ended', { severity:'info', route:'today',
        title:bitmis.length + ' kaydın bitiş tarihi geçmiş',
        note:yz('spi.core.audit.bitmis-kayitlar-gunluk-liste')
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
        note:yz('spi.core.audit.adi-olmayan-kayit-icin-etkil')
           + 'çalıştırılamaz. Sistem bu kaydı görür ama hakkında hiçbir '
           + 'şey söyleyemez.',
        items:adsiz.slice(0, 5).map(m => ({ id:m.id, label:yz('spi.core.audit.adsiz'),
          meta:m.kindId || '' })) }));
    }

    /* 3 — Uzun suredir surmekte olan kayit: bitisi yazilmamis olabilir. */
    const uzun = ilaclar.filter(m => !m.endDate
      && (gunFark(m.startDate) || 0) >= 365);
    if(uzun.length){
      out.push(bul('med-long', { severity:'info', route:'today',
        title:uzun.length + ' kayıt bir yıldır açık',
        note:yz('spi.core.audit.bir-yildir-bitis-tarihi-giri')
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
        title:yz('spi.core.audit.gunluk-olcum-az'),
        note:yz('spi.core.audit.denetim-icin-en-az') + ASGARI + ' günlük ölçüm gerekir.' })];
    }

    const son14 = U.lastDays(14);
    const dolu = son14.filter(d => S.vitals[d]);

    /* 1 — Seyrek olcum: toparlanma skoru kendi temel cizgine gore
       hesaplanir ve o cizgi ancak duzenli olcumle kurulur. */
    if(dolu.length <= 4){
      out.push(bul('vital-sparse', { severity:'info', route:'today',
        title:yz('spi.core.audit.son-iki-haftanin') + dolu.length + ' gününde ölçüm var',
        note:yz('spi.core.audit.toparlanma-skoru-kendi-temel')
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
          title:yz('spi.core.audit.uyku-suresi') + uykular.length + ' gündür aynı',
          note:yz('spi.core.audit.ayni-degerin-tekrar-etmesi-m')
             + 'değer kaydedilmiş olabilir; öyleyse o sayı bir ölçüm değil '
             + 'bir dolgudur ve hesaba öyle girer.',
          items:[{ id:'sleep', label:yz('spi.core.audit.uyku'), meta:ilk + ' saat' }] }));
      }
    }

    return out;
  }

  /* ---------------------------------------------------------- toplama */

  const AREAS = [
    { id:'labs', label:yz('spi.core.audit.tahlil'), fn:labFindings },
    { id:'meals', label:yz('spi.core.audit.ogun'), fn:mealFindings },
    { id:'move', label:yz('spi.core.audit.hareket'), fn:moveFindings },
    { id:'meds', label:yz('spi.core.audit.i-lac-ve-takviye'), fn:medFindings },
    { id:'vitals', label:yz('spi.core.audit.gunluk-olcum'), fn:vitalFindings },
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
        note:yz('spi.core.audit.bu-alanin-denetimi-bir-hatay')
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
