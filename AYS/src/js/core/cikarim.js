/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/cikarim.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* ÇIKARIM — King'in senin hakkında kurduğu tahminler; sana sorulur.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/cikarim.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Depo sahibinin isteği (2026-10-17, KISI-PLANI Faz 3): «Okuduğum
   kitaplardan, dinlediğim ve çaldığım müzikten, sevdiğim dersten, sağlığımdan,
   yediklerimden, hedeflerimden psikolojik çıkarım yapsın. Birazcık sohbet
   ederek: King ‹senin üzerine böyle bir çıkarım yaptım, sence doğru mu?›
   desin; doğruysa sistem kaydetsin.»

   Sözler:
     1. ÖLÇÜLENDEN, KANITIYLA. Her çıkarım modülün kayıtlı verisinden bir
        KURALLA çıkar ve kanıtını taşır («30 günde 12 saatin 7'si felsefe»).
        Model çıkarım üretmez; cümleyi kod yazar (AGENTS §1.1).
     2. EŞİĞİN ALTINDA SUSAR. Az veride çıkarım yoktur (§1.7). Eşikler
        bilerek düşük (depo sahibi, 2026-10-17: «o kadar sıkı tutulmasın,
        her şeyden çıkarım yapılsın»): çıkarım zaten sorulur; yanlışsa
        «Yanlış» bir daha sordurmaz.
     3. SORU OLARAK SORULUR. Hiçbir çıkarım kendiliğinden hafızaya girmez:
        «Doğru» dersen senin onayınla yazılır, «Yanlış» dersen bir daha
        sorulmaz, «Kısmen» dersen kendi cümlen yazılır.
     4. TEŞHİS VE YARGI YOK (§1.5). Dil «gibi görünüyor», «olabilir mi?»;
        «yeteneksiz», «bağımlı», «depresif» gibi hüküm kurulmaz.
     5. KİMLİK VERİYE BAĞLI. Çıkarımın kimliği kuralı ve vardığı sonucu
        taşır («esp-disiplin:philo»): veri değişip sonuç değişirse yeni
        çıkarım olur; aynı sonuç ikinci kez sorulmaz. */
window.LIFEOS.PARCA.yazilar({
  'ortak.cikarim.son-30-gunde-gelisim-zamanin':'Son 30 günde gelişim zamanının en büyük payı ',
  'ortak.cikarim.basladigin':'Başladığın ',
  'ortak.cikarim.basladigi-kitabi-bitirir-isi':'Başladığı kitabı bitirir; işi sonuna götürür (onayladı)',
  'ortak.cikarim.bircok-kitaba-baslayip-ara-v':'Birçok kitaba başlayıp ara vermişsin (',
  'ortak.cikarim.meraki-genis-bircok-kitaba-b':'Merakı geniş; birçok kitaba başlar, odağı dağılabilir (onayladı)',
  'ortak.cikarim.en-cok':'En çok ',
  'ortak.cikarim.son-30-gunde':'Son 30 günde ',
  'ortak.cikarim.muzik-calmak-hayatinin-duzen':'Müzik çalmak hayatının düzenli bir parçası; onu dinlendirir (onayladı)',
  'ortak.cikarim.son-45-gunde-en-cok':'Son 45 günde en çok ',
  'ortak.cikarim.son-gecelerinde-yatis-saatin':'Son gecelerinde yatış saatin genelde ',
  'ortak.cikarim.gece-insani-gec-yatar-onayla':'Gece insanı; geç yatar (onayladı)',
  'ortak.cikarim.sabah-insani-erken-yatar-ona':'Sabah insanı; erken yatar (onayladı)',
  'ortak.cikarim.son-30-gunde-yediklerin-icin':'Son 30 günde yediklerin içinde ',
  'ortak.cikarim.duzenli-hareket-eder-bedenin':'Düzenli hareket eder; bedenini önemser (onayladı)',
  'ortak.cikarim.i-kinci-buyuk-ilgin':'İkinci büyük ilgin ',
  'ortak.cikarim.cok-yonlu-ve-merakli-bircok':'Çok yönlü ve meraklı; birçok alanla ilgilenir (onayladı)',
  'ortak.cikarim.hatalarinin-icinde-en-buyuk':'Hatalarının içinde en büyük pay «',
  'ortak.cikarim.hatalarinin-cogu':'Hatalarının çoğu ',
  'ortak.cikarim.denemelerin-istikrarla-yukse':'Denemelerin istikrarla yükseliyor (ilk yarıdan son yarıya +',
  'ortak.cikarim.sabirli-ve-kararli-denemeler':'Sabırlı ve kararlı; denemeleri istikrarla yükselir (onayladı)',
  'ortak.cikarim.son-denemelerin-oncekilerden':'Son denemelerin öncekilerden biraz düşük (',
  'ortak.cikarim.son-zamanlarda-yorgun-ya-da':'Son zamanlarda yorgun ya da kafası dolu (onayladı)',
  'ortak.cikarim.gecelerin-genelde':'Gecelerin genelde ',
  'ortak.cikarim.uykusunu-onemser-uzun-uyur-o':'Uykusunu önemser; uzun uyur (onayladı)',
  'ortak.cikarim.yogun-bir-donemde-az-uyuyor':'Yoğun bir dönemde; az uyuyor (onayladı)',
  'ortak.cikarim.i-yi-uyudugun-gunlerde-kendi':'İyi uyuduğun günlerde kendini belirgin şekilde daha zinde işaretlemişsin. Uyku senin ruh hâlinin anahtarı gibi; sence de öyle mi?',
  'ortak.cikarim.i-yi-uyudugunda-kendini-daha':'İyi uyuduğunda kendini daha zinde hisseder (onayladı)',
  'ortak.cikarim.kahveyi-sever-neredeyse-her':'Kahveyi sever; neredeyse her gün içer (onayladı)',
  'ortak.cikarim.ruh-hali-modelim':'Ruh hâli modelim ',
  'ortak.cikarim.bana-genelde':'Bana genelde ',
  'ortak.cikarim.i-letisim-uslubu':'İletişim üslubu: ',
  'ortak.cikarim.calisirken-genelde':'Çalışırken genelde ',
  'ortak.cikarim.sakin-bir-ortam-odaklanmana':'Sakin bir ortam odaklanmana yardım ediyor olabilir mi?',
  'ortak.cikarim.ritimli-bir-ortam-seni-canli':'Ritimli bir ortam seni canlı tutuyor olabilir mi?',
  'ortak.cikarim.calisirken':'Çalışırken ',
});


window.LIFEOS = window.LIFEOS || {};

LIFEOS.CIKARIM = (function(){
  const yuzde = (a, b) => b ? Math.round(100 * a / b) : 0;
  const saatYaz = h => { const t = ((h % 24) + 24) % 24; const s = Math.floor(t), d = Math.round((t - s) * 60); return String(s).padStart(2, '0') + ':' + String(d === 60 ? 0 : d).padStart(2, '0'); };
  /* Yönelme eki ünlü uyumuyla: Felsefe'ye, Gitar'a, Derin Okuma'ya, Tarih'e. */
  function yone(ad){
    const a = String(ad || '').trim();
    const sesli = (a.toLocaleLowerCase('tr').match(/[aıoueiöü]/g) || []).pop() || 'e';
    const kalin = 'aıou'.indexOf(sesli) >= 0;
    const sonSesli = /[aıoueiöü]$/i.test(a);
    return a + '\'' + (sonSesli ? 'y' : '') + (kalin ? 'a' : 'e');
  }
  const medyan = l => { const s = l.slice().sort((a, b) => a - b); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };

  /* ESP disiplininden eğilim cümlesi. */
  const DISIPLIN_EGILIM = {
    philo:'soyut ve derin düşünmeyi seviyor gibisin',
    music:'müzik senin için bir ifade ve dinlenme yolu gibi',
    lang:'yeni kültürlere ve insanlara açılmayı önemsiyor gibisin',
    history:'geçmişi anlayarak bugünü yorumlamayı seviyor gibisin',
    diction:'kendini iyi ifade etmek senin için önemli görünüyor',
    reading:'derinlemesine okumak sana iyi geliyor gibi',
    writing:'düşüncelerini yazarak düzenlemeyi seviyor gibisin',
  };
  /* SPİ yemek kategorisinden cümle (yalnız belirgin olanlar). */
  const YEMEK_EGILIM = {
    tatli:'tatlıya düşkün gibisin; yorgun ya da stresli günlerde artıyor olabilir mi?',
    et:'protein ağırlıklı besleniyorsun; güç ve dayanıklılık senin için önemli görünüyor',
    sebze:'sebzeyi seviyorsun; sağlığına dikkat eden biri gibisin',
    meyve:'meyveyi seviyorsun; sağlığına dikkat eden biri gibisin',
    yemek:'ev yemeğini seviyorsun; düzenli ve tanıdık olan sana iyi geliyor gibi',
    tahil:'beslenmende tahıl ve ekmek ağır basıyor; doyurucu ve pratik olanı seviyor gibisin',
  };

  /* Her kural: veri → aday ya da null.
     Aday: { id, alan, soru (sana sorulan cümle), kanit, kayit (onaylanınca hafızaya giden) } */
  const KURALLAR = [
    /* ESP: zamanın en çok gittiği disiplin. */
    function espDisiplin(v){
      const d = v.esp && v.esp.disiplin;
      if(!d) return null;
      const ids = Object.keys(d.dakika || {});
      const toplam = ids.reduce((a, k) => a + (d.dakika[k] || 0), 0);
      if((d.gun || 0) < 5 || toplam < 120) return null;
      const ust = ids.sort((a, b) => d.dakika[b] - d.dakika[a])[0];
      const pay = yuzde(d.dakika[ust], toplam);
      if(pay < 30) return null;
      const ad = (d.adlar && d.adlar[ust]) || ust;
      const eg = DISIPLIN_EGILIM[ust] || 'bu alan senin için önemli görünüyor';
      return { id:'esp-disiplin:' + ust, alan:'gelisim',
        soru:yz('ortak.cikarim.son-30-gunde-gelisim-zamanin') + ad + ': %' + pay + '. Buradan şunu çıkardım: ' + eg + '.',
        kanit:d.gun + ' gün, toplam ' + Math.round(toplam / 60) + ' saat',
        kayit:yone(ad) + ' çok zaman ayırıyor; ' + eg.replace(/ gibisin$/, '') + ' (onayladı)' };
    },
    /* ESP: başladığı kitabı bitirme. */
    function espKitapBitirme(v){
      const k = (v.esp && v.esp.kitaplar) || [];
      const baslanan = k.filter(b => b.startedAt);
      if(baslanan.length < 3) return null;
      const biten = baslanan.filter(b => b.finishedAt).length;
      const oran = biten / baslanan.length;
      if(oran >= 0.75) return { id:'esp-kitap:bitiren', alan:'kisilik',
        soru:yz('ortak.cikarim.basladigin') + baslanan.length + ' kitaptan ' + biten + ' tanesini bitirmişsin. Başladığı işi sonuna kadar götüren biri gibisin.',
        kanit:biten + '/' + baslanan.length + ' kitap', kayit:yz('ortak.cikarim.basladigi-kitabi-bitirir-isi') };
      if(baslanan.length >= 4 && oran <= 0.34) return { id:'esp-kitap:merakli', alan:'kisilik',
        soru:yz('ortak.cikarim.bircok-kitaba-baslayip-ara-v') + biten + '/' + baslanan.length + ' bitti). Merakın geniş, ama odağın kolay dağılıyor olabilir mi?',
        kanit:biten + '/' + baslanan.length + ' kitap', kayit:yz('ortak.cikarim.meraki-genis-bircok-kitaba-b') };
      return null;
    },
    /* ESP: en çok okunan yazar. */
    function espYazar(v){
      const k = (v.esp && v.esp.kitaplar) || [];
      const say = {};
      k.forEach(b => { const a = String(b.author || '').trim(); if(a) say[a] = (say[a] || 0) + 1; });
      const ust = Object.keys(say).sort((a, b) => say[b] - say[a])[0];
      if(!ust || say[ust] < 2) return null;
      return { id:'esp-yazar:' + ust.toLocaleLowerCase('tr'), alan:'sevgi',
        soru:yz('ortak.cikarim.en-cok') + ust + ' okumuşsun (' + say[ust] + ' kitap). Onun düşünceleri sana yakın geliyor olabilir mi?',
        kanit:say[ust] + ' kitap', kayit:ust + ' okumayı seviyor; düşünceleri ona yakın (onayladı)' };
    },
    /* ESP: müzik çalma düzeni. */
    function espMuzik(v){
      const g = v.esp && v.esp.muzikGun;
      if(!(g >= 6)) return null;
      return { id:'esp-muzik:duzenli', alan:'hobi',
        soru:yz('ortak.cikarim.son-30-gunde') + g + ' gün müzik çalışmışsın. Müzik hayatının düzenli bir parçası; seni dinlendiren bir şey gibi görünüyor.',
        kanit:g + ' gün', kayit:yz('ortak.cikarim.muzik-calmak-hayatinin-duzen') };
    },
    /* AYS: en çok çalışılan ve en isabetli ders. */
    function aysDers(v){
      const l = ((v.ays && v.ays.dersler) || []).filter(d => d.solved > 0);
      const toplam = l.reduce((a, d) => a + d.solved, 0);
      if(toplam < 150) return null;
      const cok = l.slice().sort((a, b) => b.solved - a.solved)[0];
      const isabetli = l.filter(d => d.solved >= 60).sort((a, b) => (b.correct / b.solved) - (a.correct / a.solved))[0];
      if(!isabetli) return null;
      const ib = yuzde(isabetli.correct, isabetli.solved);
      if(cok.id === isabetli.id) return { id:'ays-ders:' + cok.id, alan:'ogrenme',
        soru:yz('ortak.cikarim.son-45-gunde-en-cok') + cok.ad + ' çalışmışsın (' + cok.solved + ' soru) ve en isabetli olduğun ders de bu (%' + ib + '). Bu dersi seviyor gibisin.',
        kanit:cok.solved + ' soru, %' + ib + ' doğru', kayit:cok.ad + ' dersini seviyor ve bu derste güçlü (onayladı)' };
      return { id:'ays-isabet:' + isabetli.id, alan:'ogrenme',
        soru:yz('ortak.cikarim.en-cok') + cok.ad + ' çalışıyorsun ama en isabetli olduğun ders ' + isabetli.ad + ' (%' + ib + '). ' + yone(isabetli.ad) + ' yatkın, belki onu daha çok seviyor olabilir misin?',
        kanit:isabetli.solved + ' soru, %' + ib + ' doğru', kayit:yone(isabetli.ad) + ' yatkın; o dersi seviyor (onayladı)' };
    },
    /* SPİ: yatış saatinden kronotip. */
    function spiKronotip(v){
      const y = ((v.spi && v.spi.yatis) || []).filter(x => typeof x === 'number');
      if(y.length < 6) return null;
      const m = medyan(y);
      if(m >= 24.5) return { id:'spi-kronotip:gece', alan:'ritim',
        soru:yz('ortak.cikarim.son-gecelerinde-yatis-saatin') + saatYaz(m) + '. Gece insanı gibisin; akşamları zihnin daha mı açık oluyor?',
        kanit:y.length + ' gece, ortanca ' + saatYaz(m), kayit:yz('ortak.cikarim.gece-insani-gec-yatar-onayla') };
      if(m <= 23.25) return { id:'spi-kronotip:sabah', alan:'ritim',
        soru:yz('ortak.cikarim.son-gecelerinde-yatis-saatin') + saatYaz(m) + '. Sabah insanı gibisin; günün ilk saatleri sana daha verimli mi geliyor?',
        kanit:y.length + ' gece, ortanca ' + saatYaz(m), kayit:yz('ortak.cikarim.sabah-insani-erken-yatar-ona') };
      return null;
    },
    /* SPİ: yediklerinde ağır basan kategori. */
    function spiYemek(v){
      const k = (v.spi && v.spi.yemekKat) || {};
      const toplam = Object.keys(k).reduce((a, x) => a + k[x], 0);
      if(toplam < 15) return null;
      const sira = Object.keys(k).filter(x => YEMEK_EGILIM[x]).sort((a, b) => k[b] - k[a]);
      const tatliPay = yuzde(k.tatli || 0, toplam);
      const sec = tatliPay >= 15 ? 'tatli' : sira.find(x => yuzde(k[x], toplam) >= 20);
      if(!sec) return null;
      const ad = (v.spi.katAd && v.spi.katAd[sec]) || sec;
      return { id:'spi-yemek:' + sec, alan:'sevgi',
        soru:yz('ortak.cikarim.son-30-gunde-yediklerin-icin') + ad.toLocaleLowerCase('tr') + ' payı %' + yuzde(k[sec], toplam) + '. Buradan şunu çıkardım: ' + YEMEK_EGILIM[sec],
        kanit:k[sec] + '/' + toplam + ' kalem', kayit:ad + ' ağırlıklı besleniyor; ' + YEMEK_EGILIM[sec].split(';')[0].replace(/ gibisin$/, '') + ' (onayladı)' };
    },
    /* SPİ: hareket düzeni. */
    function spiHareket(v){
      const n = v.spi && v.spi.antrenman30;
      if(!(n >= 5)) return null;
      return { id:'spi-hareket:duzenli', alan:'fizyoloji',
        soru:yz('ortak.cikarim.son-30-gunde') + n + ' antrenman yapmışsın. Hareket senin için bir alışkanlık ve düzen; bedenini önemsiyorsun gibi görünüyor.',
        kanit:n + ' antrenman', kayit:yz('ortak.cikarim.duzenli-hareket-eder-bedenin') };
    },
    /* ESP: ikinci büyük ilgi. */
    function espIkinci(v){
      const d = v.esp && v.esp.disiplin;
      if(!d || (d.gun || 0) < 5) return null;
      const ids = Object.keys(d.dakika || {}).sort((a, b) => d.dakika[b] - d.dakika[a]);
      const toplam = ids.reduce((a, k) => a + d.dakika[k], 0);
      if(ids.length < 2 || toplam < 120 || yuzde(d.dakika[ids[1]], toplam) < 20) return null;
      const ad = (d.adlar && d.adlar[ids[1]]) || ids[1];
      const eg = DISIPLIN_EGILIM[ids[1]] || 'bu alan da senin için önemli görünüyor';
      return { id:'esp-ikinci:' + ids[1], alan:'hobi',
        soru:yz('ortak.cikarim.i-kinci-buyuk-ilgin') + ad + ' görünüyor (payı %' + yuzde(d.dakika[ids[1]], toplam) + '). ' + eg.charAt(0).toLocaleUpperCase('tr') + eg.slice(1) + '.',
        kanit:d.gun + ' gün', kayit:ad + ' da ilgisini çekiyor (onayladı)' };
    },
    /* ESP: çok yönlülük. */
    function espCesit(v){
      const d = v.esp && v.esp.disiplin;
      if(!d) return null;
      const n = Object.keys(d.dakika || {}).filter(k => d.dakika[k] > 0).length;
      if(n < 4) return null;
      return { id:'esp-cesit:' + n, alan:'kisilik',
        soru:yz('ortak.cikarim.son-30-gunde') + n + ' ayrı alanda çalışmışsın. Çok yönlü ve meraklı birisin gibi; tek bir şeyle yetinmiyorsun.',
        kanit:n + ' alan', kayit:yz('ortak.cikarim.cok-yonlu-ve-merakli-bircok') };
    },
    /* AYS: seni zorlayan ders. */
    function aysZor(v){
      const l = ((v.ays && v.ays.dersler) || []).filter(d => d.solved >= 40);
      if(l.length < 2) return null;
      const zor = l.slice().sort((a, b) => (a.correct / a.solved) - (b.correct / b.solved))[0];
      const z = yuzde(zor.correct, zor.solved);
      if(z >= 65) return null;
      return { id:'ays-zor:' + zor.id, alan:'ogrenme',
        soru:zor.ad + ' seni en çok zorlayan ders gibi görünüyor (doğru oranı %' + z + '). Bu derse oturmak sana ağır mı geliyor?',
        kanit:zor.solved + ' soru', kayit:zor.ad + ' dersi onu zorluyor (onayladı)' };
    },
    /* AYS: hata tiplerinin ağırlığı. */
    function aysHata(v){
      const h = (v.ays && v.ays.hatalar) || {};
      const toplam = Object.keys(h).reduce((a, k) => a + h[k].n, 0);
      if(toplam < 8) return null;
      const ust = Object.keys(h).sort((a, b) => h[b].n - h[a].n)[0];
      const pay = yuzde(h[ust].n, toplam);
      if(pay < 35) return null;
      const yorum = { D:'acele ediyor ya da yorgunken çalışıyor olabilir misin?', 'İ':'işlem yaparken hızlanıyor olabilir misin?',
        Y:'soruyu okurken aceleci davranıyor olabilir misin?', S:'süre baskısı seni geriyor olabilir mi?', K:'bazı konular henüz eksik; sırayla tamamlamayı seviyor musun?' }[ust]
        || 'bunun bir nedeni var mı?';
      return { id:'ays-hata:' + ust, alan:'ogrenme',
        soru:yz('ortak.cikarim.hatalarinin-icinde-en-buyuk') + h[ust].ad + '» türünde: %' + pay + '. Buradan şunu düşündüm: ' + yorum,
        kanit:toplam + ' hata kaydı', kayit:yz('ortak.cikarim.hatalarinin-cogu') + h[ust].ad.toLocaleLowerCase('tr') + ' (onayladı)' };
    },
    /* AYS: deneme gidişi. */
    function aysGidis(v){
      const n = ((v.ays && v.ays.denemeNet) || []).filter(x => typeof x === 'number');
      if(n.length < 4) return null;
      const ilk = medyan(n.slice(0, Math.floor(n.length / 2))), son = medyan(n.slice(-Math.floor(n.length / 2)));
      if(son - ilk >= 3) return { id:'ays-gidis:yukari', alan:'kisilik',
        soru:yz('ortak.cikarim.denemelerin-istikrarla-yukse') + Math.round(son - ilk) + ' net). Sabırlı ve kararlı birisin gibi.',
        kanit:n.length + ' deneme', kayit:yz('ortak.cikarim.sabirli-ve-kararli-denemeler') };
      if(ilk - son >= 3) return { id:'ays-gidis:asagi', alan:'ruh',
        soru:yz('ortak.cikarim.son-denemelerin-oncekilerden') + Math.round(ilk - son) + ' net). Son zamanlarda yorgun ya da kafan dolu olabilir mi?',
        kanit:n.length + ' deneme', kayit:yz('ortak.cikarim.son-zamanlarda-yorgun-ya-da') };
      return null;
    },
    /* SPİ: uyku süresi. */
    function spiUyku(v){
      const u = ((v.spi && v.spi.uyku) || []).filter(x => typeof x === 'number' && x > 0);
      if(u.length < 6) return null;
      const m = medyan(u);
      if(m >= 8) return { id:'spi-uyku:uzun', alan:'fizyoloji',
        soru:yz('ortak.cikarim.gecelerin-genelde') + (Math.round(m * 10) / 10) + ' saat. Uykunu önemsiyorsun; dinlenmiş olmak senin için öncelik gibi.',
        kanit:u.length + ' gece', kayit:yz('ortak.cikarim.uykusunu-onemser-uzun-uyur-o') };
      if(m <= 6.25) return { id:'spi-uyku:kisa', alan:'ruh',
        soru:yz('ortak.cikarim.gecelerin-genelde') + (Math.round(m * 10) / 10) + ' saat. Yoğun ya da stresli bir dönemden geçiyor olabilir misin?',
        kanit:u.length + ' gece', kayit:yz('ortak.cikarim.yogun-bir-donemde-az-uyuyor') };
      return null;
    },
    /* SPİ: uyku ile günün hissi (birliktelik, neden değil). */
    function spiHisUyku(v){
      const p = ((v.spi && v.spi.hisUyku) || []).filter(x => x && typeof x.his === 'number' && typeof x.uyku === 'number');
      if(p.length < 6) return null;
      const mu = medyan(p.map(x => x.uyku));
      const iyi = p.filter(x => x.uyku >= mu).map(x => x.his), kotu = p.filter(x => x.uyku < mu).map(x => x.his);
      if(iyi.length < 2 || kotu.length < 2) return null;
      const fark = medyan(iyi) - medyan(kotu);
      if(fark < 0.5) return null;
      return { id:'spi-his-uyku:pozitif', alan:'ruh',
        soru:yz('ortak.cikarim.i-yi-uyudugun-gunlerde-kendi'),
        kanit:p.length + ' gün (birliktelik, neden değil)', kayit:yz('ortak.cikarim.i-yi-uyudugunda-kendini-daha') };
    },
    /* SPİ: kahve. */
    function spiKahve(v){
      const k = v.spi && v.spi.kahveGun;
      if(!(k >= 8)) return null;
      return { id:'spi-kahve:sik', alan:'sevgi',
        soru:yz('ortak.cikarim.son-30-gunde') + k + ' gün kahve içmişsin. Kahvesiz bir gün sana eksik gibi mi geliyor?',
        kanit:k + ' gün', kayit:yz('ortak.cikarim.kahveyi-sever-neredeyse-her') };
    },
    /* SPİ: kişisel tahmin ağının en etkili özelliği (yalnız model tabanı geçtiyse). */
    function spiModel(v){
      const m = v.spi && v.spi.model;
      if(!m || !m.iyi || !(m.onem || []).length) return null;
      const x = m.onem[0];
      const yon = x.yon > 0 ? 'arttıkça kendini daha iyi hissediyorsun' : x.yon < 0 ? 'arttıkça kendini daha kötü hissediyorsun' : 'ruh hâlinle birlikte değişiyor';
      return { id:'spi-model:' + x.ozellik + ':' + x.yon, alan:'ruh',
        soru:yz('ortak.cikarim.ruh-hali-modelim') + m.n + ' gününden şunu öğrendi: «' + x.ad + '» ' + yon + '. Ruh hâlini en çok etkileyen şeylerden biri bu gibi.',
        kanit:'model tabandan %' + m.kazanc + ' iyi; birliktelik, neden değil',
        kayit:x.ad + ' ruh hâlini etkiliyor: ' + yon.replace('hissediyorsun', 'hissediyor') + ' (onayladı)' };
    },
    /* King'e yazış biçimi (envanter.js üslup sayacı). */
    function uslup(v){
      const u = v.uslup;
      if(!u) return null;
      return { id:'uslup:' + (u.kisa ? 'kisa' : 'uzun') + ':' + (u.samimi ? 'samimi' : 'olculu'), alan:'uslup',
        soru:yz('ortak.cikarim.bana-genelde') + u.ozet + ' yazıyorsun. Benimle de böyle konuşmamı ister misin?',
        kanit:'mesaj başına ortalama ' + u.ort + ' karakter',
        kayit:yz('ortak.cikarim.i-letisim-uslubu') + u.ozet + '; King de böyle konuşsun (onayladı)' };
    },
    /* Radyo: çalışırken dinlenen tür (zayıf kanıt: soru olarak). */
    function sesTur(v){
      const s = v.ses;
      if(!s || !s.tur || !s.dinlendi) return null;
      const sakin = /chill|lofi|klasik|jazz|piyano|ambient/i.test(s.tur);
      return { id:'ses-tur:' + s.tur, alan:'sevgi',
        soru:yz('ortak.cikarim.calisirken-genelde') + s.turAd + ' açıyorsun. ' + (sakin ? yz('ortak.cikarim.sakin-bir-ortam-odaklanmana') : yz('ortak.cikarim.ritimli-bir-ortam-seni-canli')),
        kanit:'radyo tercihi', kayit:yz('ortak.cikarim.calisirken') + s.turAd + ' dinler (onayladı)' };
    },
  ];

  /* Veri → adaylar (sorulmuş olanlar `karar` ile süzülür: { id:'dogru'|'yanlis'|'kismen' }). */
  function uret(veri, karar){
    const k = karar || {};
    const out = [];
    KURALLAR.forEach(f => {
      let a = null;
      try{ a = f(veri || {}); }catch(e){ a = null; }
      if(a && !k[a.id]) out.push(a);
    });
    return out;
  }

  /* Radyo tercihinden veri (her modülde aynı; LIFEOS.SES). */
  function sesVerisi(){
    const S = (window.LIFEOS || {}).SES;
    if(!S || typeof S.tercih !== 'function') return null;
    try{
      const t = S.tercih(), d = S.durum ? S.durum() : {};
      return { tur:t.tur, turAd:d.turAd || t.tur, dinlendi:!!(t.son && t.son[t.tur]) };
    }catch(e){ return null; }
  }

  /* Cevap metni → karar (sohbetle cevap). */
  function cevapOku(metin){
    const t = String(metin || '').toLocaleLowerCase('tr').replace(/[.!]+$/, '').trim();
    if(/^(doğru|evet|aynen|kesinlikle|çok doğru|tam olarak|öyle|evet doğru|bence de)( |$|[,!])/.test(t)) return 'dogru';
    if(/^(yanlış|hayır|değil|hiç değil|alakası yok|yok)( |$|[,!])/.test(t)) return 'yanlis';
    if(/^(kısmen|biraz|bazen|yarı yarıya|tam değil|pek değil)( |$|[,!])/.test(t)) return 'kismen';
    return null;
  }

  return { KURALLAR, uret, sesVerisi, cevapOku, yone, DISIPLIN_EGILIM, YEMEK_EGILIM };
})();
