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
     2. EŞİĞİN ALTINDA SUSAR. Az veride çıkarım yoktur (§1.7).
     3. SORU OLARAK SORULUR. Hiçbir çıkarım kendiliğinden hafızaya girmez:
        «Doğru» dersen senin onayınla yazılır, «Yanlış» dersen bir daha
        sorulmaz, «Kısmen» dersen kendi cümlen yazılır.
     4. TEŞHİS VE YARGI YOK (§1.5). Dil «gibi görünüyor», «olabilir mi?»;
        «yeteneksiz», «bağımlı», «depresif» gibi hüküm kurulmaz.
     5. KİMLİK VERİYE BAĞLI. Çıkarımın kimliği kuralı ve vardığı sonucu
        taşır («esp-disiplin:philo»): veri değişip sonuç değişirse yeni
        çıkarım olur; aynı sonuç ikinci kez sorulmaz. */

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
      if((d.gun || 0) < 8 || toplam < 240) return null;
      const ust = ids.sort((a, b) => d.dakika[b] - d.dakika[a])[0];
      const pay = yuzde(d.dakika[ust], toplam);
      if(pay < 40) return null;
      const ad = (d.adlar && d.adlar[ust]) || ust;
      const eg = DISIPLIN_EGILIM[ust] || 'bu alan senin için önemli görünüyor';
      return { id:'esp-disiplin:' + ust, alan:'gelisim',
        soru:'Son 30 günde gelişim zamanının en büyük payı ' + ad + ': %' + pay + '. Buradan şunu çıkardım: ' + eg + '.',
        kanit:d.gun + ' gün, toplam ' + Math.round(toplam / 60) + ' saat',
        kayit:yone(ad) + ' çok zaman ayırıyor; ' + eg.replace(/ gibisin$/, '') + ' (onayladı)' };
    },
    /* ESP: başladığı kitabı bitirme. */
    function espKitapBitirme(v){
      const k = (v.esp && v.esp.kitaplar) || [];
      const baslanan = k.filter(b => b.startedAt);
      if(baslanan.length < 4) return null;
      const biten = baslanan.filter(b => b.finishedAt).length;
      const oran = biten / baslanan.length;
      if(oran >= 0.75) return { id:'esp-kitap:bitiren', alan:'kisilik',
        soru:'Başladığın ' + baslanan.length + ' kitaptan ' + biten + ' tanesini bitirmişsin. Başladığı işi sonuna kadar götüren biri gibisin.',
        kanit:biten + '/' + baslanan.length + ' kitap', kayit:'Başladığı kitabı bitirir; işi sonuna götürür (onayladı)' };
      if(baslanan.length >= 5 && oran <= 0.3) return { id:'esp-kitap:merakli', alan:'kisilik',
        soru:'Birçok kitaba başlayıp ara vermişsin (' + biten + '/' + baslanan.length + ' bitti). Merakın geniş, ama odağın kolay dağılıyor olabilir mi?',
        kanit:biten + '/' + baslanan.length + ' kitap', kayit:'Merakı geniş; birçok kitaba başlar, odağı dağılabilir (onayladı)' };
      return null;
    },
    /* ESP: en çok okunan yazar. */
    function espYazar(v){
      const k = (v.esp && v.esp.kitaplar) || [];
      const say = {};
      k.forEach(b => { const a = String(b.author || '').trim(); if(a) say[a] = (say[a] || 0) + 1; });
      const ust = Object.keys(say).sort((a, b) => say[b] - say[a])[0];
      if(!ust || say[ust] < 3) return null;
      return { id:'esp-yazar:' + ust.toLocaleLowerCase('tr'), alan:'sevgi',
        soru:'En çok ' + ust + ' okumuşsun (' + say[ust] + ' kitap). Onun düşünceleri sana yakın geliyor olabilir mi?',
        kanit:say[ust] + ' kitap', kayit:ust + ' okumayı seviyor; düşünceleri ona yakın (onayladı)' };
    },
    /* ESP: müzik çalma düzeni. */
    function espMuzik(v){
      const g = v.esp && v.esp.muzikGun;
      if(!(g >= 10)) return null;
      return { id:'esp-muzik:duzenli', alan:'hobi',
        soru:'Son 30 günde ' + g + ' gün müzik çalışmışsın. Müzik hayatının düzenli bir parçası; seni dinlendiren bir şey gibi görünüyor.',
        kanit:g + ' gün', kayit:'Müzik çalmak hayatının düzenli bir parçası; onu dinlendirir (onayladı)' };
    },
    /* AYS: en çok çalışılan ve en isabetli ders. */
    function aysDers(v){
      const l = ((v.ays && v.ays.dersler) || []).filter(d => d.solved > 0);
      const toplam = l.reduce((a, d) => a + d.solved, 0);
      if(toplam < 300) return null;
      const cok = l.slice().sort((a, b) => b.solved - a.solved)[0];
      const isabetli = l.filter(d => d.solved >= 100).sort((a, b) => (b.correct / b.solved) - (a.correct / a.solved))[0];
      if(!isabetli) return null;
      const ib = yuzde(isabetli.correct, isabetli.solved);
      if(cok.id === isabetli.id) return { id:'ays-ders:' + cok.id, alan:'ogrenme',
        soru:'Son 45 günde en çok ' + cok.ad + ' çalışmışsın (' + cok.solved + ' soru) ve en isabetli olduğun ders de bu (%' + ib + '). Bu dersi seviyor gibisin.',
        kanit:cok.solved + ' soru, %' + ib + ' doğru', kayit:cok.ad + ' dersini seviyor ve bu derste güçlü (onayladı)' };
      return { id:'ays-isabet:' + isabetli.id, alan:'ogrenme',
        soru:'En çok ' + cok.ad + ' çalışıyorsun ama en isabetli olduğun ders ' + isabetli.ad + ' (%' + ib + '). ' + yone(isabetli.ad) + ' yatkın, belki onu daha çok seviyor olabilir misin?',
        kanit:isabetli.solved + ' soru, %' + ib + ' doğru', kayit:yone(isabetli.ad) + ' yatkın; o dersi seviyor (onayladı)' };
    },
    /* SPİ: yatış saatinden kronotip. */
    function spiKronotip(v){
      const y = ((v.spi && v.spi.yatis) || []).filter(x => typeof x === 'number');
      if(y.length < 10) return null;
      const m = medyan(y);
      if(m >= 24.75) return { id:'spi-kronotip:gece', alan:'ritim',
        soru:'Son gecelerinde yatış saatin genelde ' + saatYaz(m) + '. Gece insanı gibisin; akşamları zihnin daha mı açık oluyor?',
        kanit:y.length + ' gece, ortanca ' + saatYaz(m), kayit:'Gece insanı; geç yatar (onayladı)' };
      if(m <= 23) return { id:'spi-kronotip:sabah', alan:'ritim',
        soru:'Son gecelerinde yatış saatin genelde ' + saatYaz(m) + '. Sabah insanı gibisin; günün ilk saatleri sana daha verimli mi geliyor?',
        kanit:y.length + ' gece, ortanca ' + saatYaz(m), kayit:'Sabah insanı; erken yatar (onayladı)' };
      return null;
    },
    /* SPİ: yediklerinde ağır basan kategori. */
    function spiYemek(v){
      const k = (v.spi && v.spi.yemekKat) || {};
      const toplam = Object.keys(k).reduce((a, x) => a + k[x], 0);
      if(toplam < 30) return null;
      const sira = Object.keys(k).filter(x => YEMEK_EGILIM[x]).sort((a, b) => k[b] - k[a]);
      const tatliPay = yuzde(k.tatli || 0, toplam);
      const sec = tatliPay >= 18 ? 'tatli' : sira.find(x => yuzde(k[x], toplam) >= 25);
      if(!sec) return null;
      const ad = (v.spi.katAd && v.spi.katAd[sec]) || sec;
      return { id:'spi-yemek:' + sec, alan:'sevgi',
        soru:'Son 30 günde yediklerin içinde ' + ad.toLocaleLowerCase('tr') + ' payı %' + yuzde(k[sec], toplam) + '. Buradan şunu çıkardım: ' + YEMEK_EGILIM[sec],
        kanit:k[sec] + '/' + toplam + ' kalem', kayit:ad + ' ağırlıklı besleniyor; ' + YEMEK_EGILIM[sec].split(';')[0].replace(/ gibisin$/, '') + ' (onayladı)' };
    },
    /* SPİ: hareket düzeni. */
    function spiHareket(v){
      const n = v.spi && v.spi.antrenman30;
      if(!(n >= 8)) return null;
      return { id:'spi-hareket:duzenli', alan:'fizyoloji',
        soru:'Son 30 günde ' + n + ' antrenman yapmışsın. Hareket senin için bir alışkanlık ve düzen; bedenini önemsiyorsun gibi görünüyor.',
        kanit:n + ' antrenman', kayit:'Düzenli hareket eder; bedenini önemser (onayladı)' };
    },
    /* Radyo: çalışırken dinlenen tür (zayıf kanıt: soru olarak). */
    function sesTur(v){
      const s = v.ses;
      if(!s || !s.tur || !s.dinlendi) return null;
      const sakin = /chill|lofi|klasik|jazz|piyano|ambient/i.test(s.tur);
      return { id:'ses-tur:' + s.tur, alan:'sevgi',
        soru:'Çalışırken genelde ' + s.turAd + ' açıyorsun. ' + (sakin ? 'Sakin bir ortam odaklanmana yardım ediyor olabilir mi?' : 'Ritimli bir ortam seni canlı tutuyor olabilir mi?'),
        kanit:'radyo tercihi', kayit:'Çalışırken ' + s.turAd + ' dinler (onayladı)' };
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
