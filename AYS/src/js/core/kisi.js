/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/kisi.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* KİŞİ — King'in seni tanıdığı model (belgeler/ekip/KISI-PLANI.md).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kisi.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Depo sahibinin isteği (2026-10-17): «King kullanıcının psikolojisini,
   fizyolojisini, maddiyatını, maneviyatını, ne inandığını, nasıl
   düşündüğünü, sevdiklerini, sevmediklerini, hobilerini… her şeyini
   öğrensin.» Kararları: sohbetten KENDİLİĞİNDEN öğrensin; hassas alanlar
   dahil hepsi modele gidebilir.

   Bu dosya yeni bir depo KURMAZ: kişi modeli hafızanın (hafiza.js)
   kayıtlarıdır; her kayıt bir `alan` taşır. Sözler:

     1. SAHİBİ SENSİN. Her kayıt «Beni nasıl tanıyorsun»da görünür,
        silinir; kendiliğinden öğrenilen her şeyin yanında «Geri al» durur.
     2. KAYNAK YAZILI. Açık beyan «sohbetten» (kural motoru) katmanına,
        tanışma sorusuna verdiğin cevap «senin sözün»e yazılır. Model
        kalıcı kayıt yazamaz (hafiza.js, AGENTS §1.1).
     3. YALNIZ AÇIK BEYAN. «X'i severim», «hobim X», «X'e inanıyorum»,
        «hedefim X» gibi birinci tekil, olumlu ya da olumsuz AÇIK cümleler
        alınır. Soru («sever misin?»), başkası hakkındaki cümle ve geçici
        his («yorgunum») kalıcı kayıt olmaz. Belirsizse yazılmaz (§1.7).
     4. TEŞHİS YOK (§1.5). Ruh hâli ve kişilik senin sözündür; King
        bunlardan tanı ya da yetenek yargısı kurmaz.
     5. TANIŞMA GÜNDE BİR. King günde en çok bir kısa soru sorar, en az
        bildiği alandan; «Atla» her zaman var. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.KISI = (function(){
  /* ajan: hangi modülün ajanı bu alanı görür (Faz 5'te ayar olur); King hepsini. */
  const ALANLAR = Object.freeze([
    { id:'kimlik', ad:'Kimlik ve hayat planı', ajan:['ays', 'spi', 'esp'],
      sorular:['Beş yıl sonra kendini nerede görmek istiyorsun?', 'Şu an hayatında en çok neyi değiştirmek istiyorsun?'] },
    { id:'deger', ad:'Değerler ve inanç', ajan:[],
      sorular:['Hayatta senin için en önemli üç şey ne?', 'Zor bir günde sana ne güç verir?'] },
    { id:'gorus', ad:'Görüşler', ajan:[],
      sorular:['Çok kişinin aksine düşündüğün bir konu var mı?'] },
    { id:'kisilik', ad:'Kişilik', ajan:['ays', 'spi', 'esp'],
      sorular:['Kalabalıkta mı yoksa yalnızken mi daha çok dinlenirsin?', 'Plan yapmayı mı, akışına bırakmayı mı seversin?'] },
    { id:'ruh', ad:'Ruh hâli ve stres', ajan:['spi'],
      sorular:['Seni en çok ne strese sokar?', 'Kendini en iyi hissettiğin anlar hangileri?'] },
    { id:'fizyoloji', ad:'Fizyoloji', ajan:['spi'],
      sorular:['Bedeninde seni rahatsız eden ya da dikkat ettiğin bir şey var mı?'] },
    { id:'ogrenme', ad:'Öğrenme ve düşünme', ajan:['ays', 'esp'],
      sorular:['En iyi nasıl öğrenirsin: okuyarak, dinleyerek, yaparak mı?', 'Hangi derste kendini en güçlü hissediyorsun?'] },
    { id:'gelisim', ad:'Gelişim', ajan:['esp'],
      sorular:['Öğrenmek istediğin ama başlamadığın bir şey var mı?'] },
    { id:'maddiyat', ad:'Maddiyat', ajan:['spi'],
      sorular:['Para konusunda kendini nasıl tanımlarsın: biriktiren mi, harcayan mı?', 'Şu an neye para biriktiriyorsun?'] },
    { id:'iliski', ad:'İlişkiler', ajan:[],
      sorular:['Hayatında en çok kime güvenirsin?'] },
    { id:'sevgi', ad:'Sevdikleri ve sevmedikleri', ajan:['ays', 'spi', 'esp'],
      sorular:['En sevdiğin yemek ne?', 'Hiç sevmediğin, dayanamadığın bir şey var mı?', 'Hangi müziği dinlersin?'] },
    { id:'hobi', ad:'Hobiler ve ilgiler', ajan:['esp'],
      sorular:['Boş zamanında ne yapmayı seversin?'] },
    { id:'ritim', ad:'Günlük ritim', ajan:['ays', 'spi', 'esp'],
      sorular:['Sabah insanı mısın, gece insanı mı?', 'Günün hangi saatinde en verimlisin?'] },
    { id:'uslup', ad:'İletişim üslubu', ajan:['ays', 'spi', 'esp'],
      sorular:['Benimle nasıl konuşmamı istersin: kısa ve net mi, samimi ve uzun mu?'] },
  ]);
  const BY_ID = {};
  ALANLAR.forEach(a => { BY_ID[a.id] = a; });

  const kucuk = s => String(s || '').toLocaleLowerCase('tr').replace(/[’']/g, '\'').replace(/\s+/g, ' ').trim();
  const H = '[a-zçğıöşü]';
  const temiz = s => String(s || '').replace(/^[\s,.;:!-]+|[\s,.;:!-]+$/g, '').replace(/\s+/g, ' ').trim();
  const buyukBas = s => s ? s.charAt(0).toLocaleUpperCase('tr') + s.slice(1) : s;

  /* Açık beyan kalıpları: [desen, alan, tür]. Desen küçük harfli metinde
     aranır. Kayda CÜMLENİN KENDİSİ yazılır (ek atmak Türkçede güvenilir
     değil: «balığı» → «balık»); tür yalnız etikettir. */
  const KALIPLAR = [
    [new RegExp('^(.{2,60}?)\\s+(?:çok\\s+|hiç\\s+)?(?:sevmiyorum|sevmem|sevmezdim)$'), 'sevgi', 'Sevmediği'],
    [new RegExp('^(.{2,60}?)(?:dan|den|tan|ten)\\s+(?:çok\\s+)?nefret\\s+ediyorum$'), 'sevgi', 'Nefret ettiği'],
    [new RegExp('^(.{2,60}?)(?:dan|den|tan|ten)\\s+(?:hiç\\s+)?(?:hoşlanmıyorum|hoşlanmam)$'), 'sevgi', 'Sevmediği'],
    [new RegExp('^(.{2,60}?)\\s+(?:çok\\s+)?(?:seviyorum|severim|bayılırım|bayılıyorum)$'), 'sevgi', 'Sevdiği'],
    [new RegExp('^(.{2,60}?)(?:dan|den|tan|ten)\\s+(?:çok\\s+)?(?:hoşlanıyorum|hoşlanırım)$'), 'sevgi', 'Sevdiği'],
    [new RegExp('^en\\s+sevdiğim\\s+(.{2,40}?)\\s+(.{2,60})$'), 'sevgi', 'En sevdiği'],
    [new RegExp('^(?:hobim|hobilerim|ilgi alanım|ilgi alanlarım)\\s+(.{2,80})$'), 'hobi', 'Hobisi'],
    [new RegExp('^boş\\s+zamanlarımda\\s+(.{2,80})$'), 'hobi', 'Boş zamanında'],
    [new RegExp('^(.{2,60}?)(?:ya|ye|a|e)\\s+(?:çok\\s+)?inanıyorum$'), 'deger', 'İnandığı'],
    [new RegExp('^(?:inancım|dinim|felsefem)\\s+(.{2,80})$'), 'deger', 'İnancı'],
    [new RegExp('^benim\\s+için\\s+en\\s+önemli\\s+(?:şey|şeyler)\\s+(.{2,80})$'), 'deger', 'En önemli'],
    [new RegExp('^(?:hedefim|hayalim|amacım)\\s+(.{2,80})$'), 'kimlik', 'Hedefi'],
    [new RegExp('^(?:ileride\\s+)?(.{2,40}?)\\s+olmak\\s+istiyorum$'), 'kimlik', 'Olmak istediği'],
    [new RegExp('^(.{2,50}?)\\s+öğrencisiyim$'), 'kimlik', 'Öğrenci'],
    [new RegExp('^(?:mesleğim|işim)\\s+(.{2,60})$'), 'kimlik', 'Mesleği'],
    [new RegExp('^(\\d{1,2})\\s+yaşındayım$'), 'kimlik', 'Yaşı'],
    [new RegExp('^(?:ben\\s+)?(sabah|gece)\\s+insanıyım$'), 'ritim', 'Ritmi'],
    [new RegExp('^en\\s+verimli\\s+(?:olduğum\\s+)?(?:saat|zaman)(?:ım|lerim)?\\s+(.{2,40})$'), 'ritim', 'En verimli zamanı'],
    [new RegExp('^(.{2,60}?)\\s+için\\s+para\\s+biriktiriyorum$'), 'maddiyat', 'Biriktirdiği'],
    [new RegExp('^(?:aylık\\s+)?(?:gelirim|maaşım|bütçem|harçlığım)\\s+(.{1,40})$'), 'maddiyat', 'Aylık gelir/bütçe'],
    [new RegExp('^beni\\s+en\\s+çok\\s+(.{2,60}?)\\s+strese\\s+sokar$'), 'ruh', 'Stres kaynağı'],
    [new RegExp('^(.{2,60}?)\\s+beni\\s+(?:çok\\s+)?(?:strese\\s+sokuyor|geriyor|yoruyor)$'), 'ruh', 'Stres kaynağı'],
    [new RegExp('^(.{2,60}?)\\s+beni\\s+(?:çok\\s+)?(?:rahatlatıyor|dinlendiriyor|mutlu ediyor)$'), 'ruh', 'İyi gelen'],
    [new RegExp('^en\\s+iyi\\s+(.{2,60}?)\\s+öğrenirim$'), 'ogrenme', 'En iyi öğrenme yolu'],
    [new RegExp('^bence\\s+(.{8,160})$'), 'gorus', 'Görüşü'],
  ];
  /* Soru, başkası hakkında cümle, istek: beyan değil. */
  const SORU = new RegExp('\\?|(?<!' + H + ')(?:mı|mi|mu|mü|mısın|misin|musun|müsün|mıyım|miyim)(?!' + H + ')');
  const BASKASI = /^(?:o|onlar|annem|babam|kardeşim|arkadaşım|sevgilim|eşim|hocam)\s/;

  /* Cümle → { alan, tur, metin } ya da null. Birden çok cümle: ilk beyan. */
  function beyan(metin){
    const ham = String(metin || '').replace(/\s+/g, ' ').trim();
    if(!ham || ham.length > 220) return null;
    const parcalar = ham.split(/(?<=[.!])\s+|\s*;\s*/).map(temiz).filter(Boolean);
    for(const p of parcalar){
      const k = kucuk(p).replace(/[.!]+$/, '');
      if(SORU.test(k) || BASKASI.test(k)) continue;
      for(const [re, alan, tur] of KALIPLAR){
        const m = k.match(re);
        if(!m || temiz(m[1]).split(' ').length > 12) continue;
        return { alan, tur, metin:buyukBas(temiz(p).replace(/[.!]+$/, '')) };
      }
    }
    return null;
  }

  /* Kayıtlar → alan alan. Alanı olmayan eski hafıza kaydı «genel»de. */
  function grupla(kayitlar){
    const g = {};
    ALANLAR.forEach(a => { g[a.id] = []; });
    g.genel = [];
    (kayitlar || []).forEach(k => { (g[k.alan] ? g[k.alan] : g.genel).push(k); });
    return g;
  }

  /* Model istemine girecek özet (King: hepsi; ajan: `ajan` verilirse izinli alanlar). */
  const ETIKET = { soz:'senin sözün', sohbet:'sohbetten', cikarim:'tahmin' };
  function ozet(kayitlar, o){
    const opt = o || {};
    const g = grupla(kayitlar);
    const satir = [];
    ALANLAR.forEach(a => {
      if(opt.ajan && a.ajan.indexOf(opt.ajan) < 0) return;
      const l = g[a.id].slice(-(opt.limit || 8));
      if(l.length) satir.push(a.ad + ': ' + l.map(k => k.metin + ' (' + (ETIKET[k.katman] || 'kayıt') + ')').join('; '));
    });
    if(!opt.ajan && g.genel.length) satir.push('Genel: ' + g.genel.slice(-8).map(k => k.metin).join('; '));
    return satir.length ? 'KULLANICIYI TANIMA (etiketiyle; «tahmin» kesin değildir, teşhis ya da yargı kurma):\n' + satir.join('\n') : '';
  }

  /* Tanışma sorusu: en az kaydı olan alandan, güne göre sabit seçim.
     Bugün sorulduysa null. */
  function tanismaSorusu(kayitlar, gunISO, sonSorulanGun){
    if(sonSorulanGun === gunISO) return null;
    const g = grupla(kayitlar);
    const sira = ALANLAR.slice().sort((a, b) => g[a.id].length - g[b.id].length);
    const enAz = g[sira[0].id].length;
    const adaylar = sira.filter(a => g[a.id].length === enAz);
    let tohum = 0;
    for(const c of String(gunISO || '')) tohum = (tohum * 31 + c.charCodeAt(0)) >>> 0;
    const alan = adaylar[tohum % adaylar.length];
    const soru = alan.sorular[tohum % alan.sorular.length];
    return { alan:alan.id, soru };
  }

  /* Tanışma cevabı → kayıt metni (sorunun alanında, senin sözün). */
  function cevapMetni(soru, cevap){
    const c = temiz(cevap);
    if(!c || c.length > 300) return null;
    return temiz(String(soru).replace(/\?$/, '')) + ' → ' + c;
  }

  /* ---------------------------------------------------------- izinler (Faz 5)
     King hepsini görür. Modül ajanı yalnız izinli alanı görür: varsayılan
     ALANLAR[].ajan, senin değişikliğin `lifeos.kisi.izin`de (modüller
     arasında taşınır). Alanı olmayan kayıt herkese açıktır (eski hafıza). */
  const IZIN = 'lifeos.kisi.izin';
  function izinOku(){ try{ const v = JSON.parse(localStorage.getItem(IZIN) || 'null'); return v && typeof v === 'object' ? v : {}; }catch(e){ return {}; } }
  function gorenler(alan){
    if(!alan || !BY_ID[alan]) return null;
    const o = izinOku()[alan];
    return Array.isArray(o) ? o.filter(m => ['ays', 'spi', 'esp'].indexOf(m) >= 0) : BY_ID[alan].ajan.slice();
  }
  function izinli(alan, modul){ const g = gorenler(alan); return g == null || g.indexOf(modul) >= 0; }
  function izinDegistir(alan, modul, acik){
    if(!BY_ID[alan] || ['ays', 'spi', 'esp'].indexOf(modul) < 0) return false;
    const v = izinOku();
    const g = gorenler(alan).filter(m => m !== modul);
    if(acik) g.push(modul);
    v[alan] = g.sort();
    try{ localStorage.setItem(IZIN, JSON.stringify(v)); }catch(e){ return false; }
    return true;
  }

  return { ALANLAR, BY_ID, beyan, grupla, ozet, tanismaSorusu, cevapMetni, IZIN, gorenler, izinli, izinDegistir };
})();
