/* Entelektuel skor motoru — EHS, SSK, okunabilirlik ve arguman denetimi.

   Uc metrik ve iki denetim burada, TEK KAYNAKTAN hesaplanir. Ekranlar ve
   ajan brifingleri ayni fonksiyonu cagirir; kopya hesap yapmaz. Bir formul
   degisecekse burada degisir ve her yerde ayni anda degisir.

   Her fonksiyon sonucu KESINLIK ETIKETIYLE doner. Bir skorun "hesaplandi"
   olmasi onun guvenilir oldugunu degil, girilmis olculerden turetildigini
   soyler; "veri yok" ise hesabin hic yapilamadigini. Ikisi ayri seydir ve
   ekranda ayri gorunur. */

window.ESP = window.ESP || {};

ESP.Intellect = (function(){
  const U = ESP.U;
  const S = ESP.S;

  /* ==================================================================== EHS

     Entelektuel Hacim Skoru:  EHS = Σ (D_i × H_i × K_i)

       D_i  disiplin agirligi — data/rules.js icindeki sabit
       H_i  OLCULEN pratik saati. "Veri yok" gunler toplama GIRMEZ.
       K_i  kalite katsayisi — asagida.

     H_i'nin "olculen" olmasi sartinin sebebi doktrindir: bir haftalik
     bosluk "0 saat" diye toplama girseydi EHS duserdi ve sistem calisilmis
     ama girilmemis bir haftayi gerileme gibi gosterirdi. Girilmemis gun
     paydada da yoktur; EHS bir ORTALAMA degil bir HACIM olcusudur.

     Bu yuzden EHS tek basina okunmaz: yaninda daima kac gunden hesaplandigi
     yazar. "40 EHS" bir sey soylemez; "14 gunun 9'undan hesaplandi, 40 EHS"
     soyler. */

  /* Kalite katsayisi.

     Disiplinin kendi OLCULMUS kalite sinyalinden gelir; olculemiyorsa 1.0
     kalir ve bunu soyler. Kullanicinin "bugun iyiydi" degerlendirmesi buraya
     GIRMEZ: o bir tahmindir ve tahmin, olculmus bir hacmi buyutemez.

     Aralik [0.85, 1.15] ile sinirlidir. Genis birakilsaydi kalite hacmi
     ezer ve az ama iyi calisan biri cok calisan birinden yuksek hacim
     gosterirdi — oysa olculen sey hacim. */
  function qualityCoef(discId){
    const yok = { k:1, cert:'missing', why:'Bu disiplinde ölçülmüş kalite sinyali yok; katsayı 1,0 alındı.' };

    if(discId === 'lang'){
      const r = ESP.SRS.retention();
      if(r.cert === 'missing') return yok;
      /* %80 retansiyon notrdur: SRS'in hedefledigi bant odur. */
      return { k:clampK(0.85 + (r.value - 0.5) * 0.6), cert:'derived',
        why:'Retansiyon %' + Math.round(r.value * 100) + ' (' + r.n + ' karttan).' };
    }

    if(discId === 'reading'){
      const ss = syntopic();
      if(ss.cert === 'missing') return yok;
      const oran = ss.linkedRatio;
      return { k:clampK(0.85 + oran * 0.3), cert:'derived',
        why:'Notların %' + Math.round(oran * 100) + '\'i bağlanmış.' };
    }

    if(discId === 'music'){
      const p = ESP.Acoustic ? ESP.Acoustic.progressRatio() : { value:null, cert:'missing' };
      if(p.cert === 'missing') return yok;
      return { k:clampK(0.85 + p.value * 0.3), cert:'derived',
        why:'Parçaların %' + Math.round(p.value * 100) + '\'i hedef tempoda.' };
    }

    if(discId === 'writing'){
      const w = draftRatio();
      if(w.cert === 'missing') return yok;
      return { k:clampK(0.85 + Math.min(1, w.value) * 0.3), cert:'derived',
        why:'Taslak başına ' + U.fmtNum(Math.round(w.value * 10) / 10) + ' revizyon.' };
    }

    return yok;
  }

  function clampK(v){ return Math.min(1.15, Math.max(0.85, v)); }

  /* Bir disiplinin son N gundeki olculmus saati.

     `days` kac gun geriye bakildigini, `entered` o araliktaki KAC GUNDE
     kayit bulundugunu soyler. Ikisi farkliysa ekran bunu yazar. */
  function hoursOf(discId, days){
    return ESP.Memo.of('int.hours:' + (discId || '') + ':' + (days || ''), function(){
      return hoursOfRaw(discId, days);
    });
  }

  function hoursOfRaw(discId, days){
    const n = days || 14;
    const gunler = U.lastDays(n);
    let dakika = 0, girilen = 0;
    gunler.forEach(d => {
      const m = ESP.Model.minutesOf(d, discId);
      if(m == null) return;                    // veri yok — sifir sayilmaz
      dakika += m; girilen++;
    });
    return {
      hours:dakika / 60,
      minutes:dakika,
      enteredDays:girilen,
      windowDays:n,
      cert:girilen ? 'measured' : 'missing',
    };
  }

  function ehs(days){
    const n = days || 14;
    /* Kapali disiplin hacme girmez: kullanicinin hic calismayacagini
       soyledigi bir alan, "dokunulmamis" diye hesabi asagi cekmemeli. */
    const rows = ESP.Mod.active().map(d => {
      const h = hoursOf(d.id, n);
      const k = qualityCoef(d.id);
      return {
        disc:d, hours:h.hours, enteredDays:h.enteredDays, cert:h.cert,
        k:k.k, kCert:k.cert, kWhy:k.why,
        score:h.cert === 'missing' ? null : d.weight * h.hours * k.k,
      };
    });
    const olculen = rows.filter(r => r.score != null);
    const gunler = new Set();
    U.lastDays(n).forEach(d => { if(ESP.Model.dayHasEntry(S.days[d])) gunler.add(d); });

    return {
      value:olculen.length ? olculen.reduce((a, r) => a + r.score, 0) : null,
      cert:olculen.length ? 'derived' : 'missing',
      rows,
      windowDays:n,
      enteredDays:gunler.size,
      /* Hic dokunulmamis disiplinler ayrica doner: EHS'nin dusuk olmasi ile
         bir disiplinin hic acilmamis olmasi ayri iki bulgudur. */
      untouched:rows.filter(r => r.cert === 'missing').map(r => r.disc.id),
    };
  }

  /* ==================================================================== SSK

     Sentopik Sentez Katsayisi:

       SSK = (Baglantili_Notlar / Toplam_Kitap) × log(1 + Yazar_Sayisi)

     Orijinal formul log(Yazar_Sayisi) idi ve tek yazarda log(1) = 0 tum
     sentezi sifirliyordu: bir kitabi derinlemesine analiz eden kullanici
     cezalandiriliyordu. log(1 + n) bu tekilligi giderir ve n = 0 (henuz
     kitap yok) durumunda da tanimli kalir.

     Payda "toplam kitap"tir, "toplam not" degil: olcuyu buyuten sey nota
     bolunmus bir kitap degil, kitaplar ARASI baglardir. */
  function syntopic(){
    return ESP.Memo.of('int.syn', syntopicRaw);
  }

  function syntopicRaw(){
    const notlar = S.notes || [];
    const kitaplar = S.books || [];
    if(!notlar.length && !kitaplar.length){
      return { value:null, cert:'missing', linked:0, total:0, books:0, authors:0, linkedRatio:0 };
    }
    const baglantili = notlar.filter(n => (n.links || []).length > 0).length;
    const yazarlar = new Set(kitaplar.map(b => U.norm(b.author || '')).filter(Boolean));
    const kitapSayisi = kitaplar.length;

    if(!kitapSayisi){
      /* Kitap yokken bolme yapilamaz. "0" demek yerine hesabin neden
         yapilamadigi soylenir. */
      return { value:null, cert:'missing', linked:baglantili, total:notlar.length,
        books:0, authors:yazarlar.size, linkedRatio:notlar.length ? baglantili / notlar.length : 0,
        why:'Henüz kaynak girilmemiş; katsayının paydası kitap sayısıdır.' };
    }

    const value = (baglantili / kitapSayisi) * Math.log(1 + yazarlar.size);
    return {
      value, cert:'derived',
      linked:baglantili, total:notlar.length,
      books:kitapSayisi, authors:yazarlar.size,
      linkedRatio:notlar.length ? baglantili / notlar.length : 0,
    };
  }

  /* Hic baglanmamis notlar — okunmus ama yerlesmemis. */
  function unlinkedNotes(){
    return (S.notes || []).filter(n => !(n.links || []).length);
  }

  /* Iki notu birlestirebilecek ortak kavramlar. Oneri URETIR, bag KURMAZ:
     bagin nedenini kullanici yazar, sistem uyduramaz. */
  function linkSuggestions(limit){
    return ESP.Memo.of('int.sugg:' + (limit || ''), function(){
      return linkSuggestionsRaw(limit);
    });
  }

  /* Bag onerisi — KAVRAM DIZINI uzerinden.

     Ilk surum butun not ciftlerini dolasiyordu: n notta n(n-1)/2 cift ve her
     ciftte kavramlar yeniden normalize ediliyordu. 400 notta 80 bin cift,
     olculen sure 62 ms; 2000 notta bu saniyelere cikiyor ve her cizimde
     tekrar ediyordu.

     Cozum, ciftleri degil KAVRAMLARI dolasmak: her kavram bir kova, kova
     icindeki notlar zaten o kavrami paylasiyor. Kavram tasimayan not hic
     dokunulmadan eliniyor — ki notlarin cogu oyle.

     Kovalar KUCUKTEN BUYUGE islenir ve bu bir siralama tercihi degil bir
     ANLAM tercihi: nadir bir kavramda bulusan iki not, "zaman" gibi her
     yerde gecen bir kavramda bulusan iki nottan daha cok sey soyler. Kesme
     noktasi (asagidaki tavan) bu yuzden once en zayif onerileri atar.

     Oneri listesi bir DIZIN DEGILDIR: kullaniciya gosterilecek ilk birkac
     satirdir. Tavan, o satirlarin kalitesini degil yalnizca tarama
     maliyetini sinirlar. */
  const MAX_PAIRS = 20000;

  function linkSuggestionsRaw(limit){
    const notlar = S.notes || [];
    if(notlar.length < 2) return [];

    /* Kavramlar bir kez normalize edilir; ic dongude bir daha degil. */
    const dizin = new Map();
    notlar.forEach(function(n, i){
      (n.concepts || []).forEach(function(c){
        const k = U.norm(c);
        if(!k) return;
        if(!dizin.has(k)) dizin.set(k, []);
        const kova = dizin.get(k);
        if(kova[kova.length - 1] !== i) kova.push(i);
      });
    });

    const kovalar = Array.from(dizin.entries())
      .filter(function(e){ return e[1].length > 1; })
      .sort(function(a, b){ return a[1].length - b[1].length; });

    const ciftler = new Map();
    let sayac = 0;
    for(const [kavram, kova] of kovalar){
      for(let x = 0; x < kova.length && sayac < MAX_PAIRS; x++){
        for(let y = x + 1; y < kova.length && sayac < MAX_PAIRS; y++){
          const i = kova[x], j = kova[y];
          const a = notlar[i], b = notlar[j];
          if((a.links || []).some(function(l){ return l.to === b.id; })) continue;
          const anahtar = i + '|' + j;
          const kayit = ciftler.get(anahtar);
          if(kayit){ kayit.concepts.push(kavram); }
          else{ ciftler.set(anahtar, { a:a, b:b, concepts:[kavram] }); sayac++; }
        }
      }
      if(sayac >= MAX_PAIRS) break;
    }

    const out = [];
    ciftler.forEach(function(p){
      /* Ayni kaynaktan iki not zaten ayni yazari paylasir; sentopik olan
         FARKLI kaynaklar arasindaki bagdir ve once o onerilir. */
      const farkliKaynak = p.a.bookId && p.b.bookId && p.a.bookId !== p.b.bookId;
      out.push({ a:p.a, b:p.b, concepts:p.concepts, cross:farkliKaynak,
        score:p.concepts.length + (farkliKaynak ? 2 : 0) });
    });
    return out.sort(function(x, y){ return y.score - x.score; }).slice(0, limit || 8);
  }

  /* ============================================================ arguman

     Bir tez ACIK kalir: cevaplanmamis itirazi varsa kapanmaz. */

  function openArguments(){
    return (S.args || []).filter(a => a.status === 'open');
  }

  /* 14+ gundur dokunulmamis acik tezler. Bu bir suclama degil bir
     hatirlatmadir: dusunce askida kalmis demektir. */
  function stalledArguments(days, todayISO){
    const n = days || 14;
    const today = todayISO || U.todayISO();
    return openArguments().filter(a => {
      const at = (a.updatedAt || a.createdAt || '').slice(0, 10);
      return at && U.diffDays(at, today) >= n;
    });
  }

  /* Safsata denetimi.

     Kalip tabanlidir ve KESIN DEGILDIR: "bulgu" olarak isaretler, yargi
     vermez. Bir kalibin yakalanmasi argumanin yanlis oldugunu gostermez,
     bakmaya deger oldugunu gosterir. Ekranda bu cumleyle birlikte durur. */
  const FALLACIES = [
    { id:'ad-hominem', label:'Kişiye saldırı',
      re:ESP.trRe('(cahil|aptal|salak)|zaten[^.!?]{0,20}(bilmiyor|anlamıyor)|sen kimsin'),
      note:'Tezin sahibine değil tezin kendisine bakılır.' },
    { id:'straw-man', label:'Korkuluk adam',
      re:ESP.trRe('(yani sen|demek ki sen|yani diyorsun ki)[^.!?]{0,40}'
        + '(diyorsun|savunuyorsun|istiyorsun)'),
      note:'Karşı tezin en güçlü hâli çürütülür, en zayıf hâli değil.' },
    { id:'slippery-slope', label:'Kaygan zemin',
      re:ESP.trRe('(sonunda|eninde sonunda|er geç)[^.!?]{0,50}'
        + '(gider|varır|döner|yol açar)'),
      note:'Her adımın kaçınılmaz olduğu ayrı ayrı gösterilmeli.' },
    { id:'false-dilemma', label:'Yanlış ikilem',
      re:ESP.trRe('ya [^.!?]{1,30} ya da |başka (bir )?(seçenek|yol) yok'),
      note:'Üçüncü bir seçenek var mı diye sorulur.' },
    { id:'appeal-authority', label:'Otoriteye başvuru',
      re:ESP.trRe('[' + ESP.TR_LETTERS + ']+ (böyle )?(dediği|söylediği) için'
        + '|bilim insanları diyor ki|herkes biliyor ki'),
      note:'Kimin söylediği değil, hangi gerekçeyle söylediği önemlidir.' },
    { id:'circular', label:'Döngüsel akıl yürütme',
      re:ESP.trRe('çünkü[^.!?]{0,40}doğru(dur)?[^.!?]{0,20}çünkü'),
      note:'Sonuç, kendi öncülü olarak kullanılmış olabilir.' },
  ];

  function checkFallacies(text){
    const s = String(text || '');
    if(!s.trim()) return [];
    return FALLACIES.filter(f => f.re.test(s))
      .map(f => ({ id:f.id, label:f.label, note:f.note }));
  }

  /* ====================================================== okunabilirlik

     Turkce icin Atesman formulu kullanilir:

       OS = 198,825 − 40,175 × (hece / kelime) − 2,610 × (kelime / cumle)

     Ingilizce icin gelistirilmis Flesch, Turkcede yanlis sonuc verir: Turkce
     sondan eklemeli bir dildir ve kelime basina hece sayisi dogal olarak
     yuksektir; Flesch her Turkce metni "cok zor" gosterir. Atesman ayni
     fikri Turkce uzerinde kalibre eder.

     Hece sayimi Turkce'de kolaydir: HECE SAYISI = SESLI HARF SAYISI.
     Kural istisnasizdir; bu yuzden hece sayaci bir tahmin degil bir
     olcumdur.

     Bu bir KALITE YARGISI DEGILDIR. Uzun cumle kotu degildir; farkinda
     olmadan uzayan cumle sorundur. Gosterge kullanicinin kendi gecmis
     metinleriyle karsilastirilir. */
  const SESLILER = 'aeıioöuüâîû';

  function syllables(word){
    let n = 0;
    const w = String(word).toLocaleLowerCase('tr-TR');
    for(let i = 0; i < w.length; i++) if(SESLILER.indexOf(w[i]) >= 0) n++;
    return n;
  }

  /* Okunabilirlik TASLAK BASINA onbelleklenir.

     Metnin kendisini anahtar yapmak yanlis olurdu (uzun metin, uzun
     anahtar); onun yerine cagiran taraf `id` verir. Vermezse onbellek
     devreye girmez ve hesap her seferinde yapilir — dogruluktan odun
     verilmez, yalnizca tekrar kalkar.

     Ayni taslagin okunabilirligi tek cizimde bes yerde isteniyordu: liste
     satiri, acik taslak, olcum sekmesi, kademe kapisi ve brifing. */
  function readability(text, id){
    if(id == null) return readabilityRaw(text);
    return ESP.Memo.of('int.read:' + id + ':' + String(text || '').length,
      function(){ return readabilityRaw(text); });
  }

  function readabilityRaw(text){
    const s = String(text || '').trim();
    if(!s){
      return { value:null, cert:'missing', words:0, sentences:0, syllables:0,
        band:null, why:'Metin boş.' };
    }
    /* Cumle ayraci: nokta, soru, unlem. Sayi icindeki nokta ayrac DEGILDIR
       ("1.500 lira" tek parcadir) — devir notundaki tuzagin ayni. */
    const cumleler = s.split(/(?<!\d)[.!?]+(?!\d)|\n{2,}/)
      .map(x => x.trim()).filter(Boolean);
    const kelimeler = s.split(/\s+/).map(w => w.replace(/[^\wçğıöşüÇĞİÖŞÜâîû]/gi, ''))
      .filter(Boolean);
    if(!kelimeler.length || !cumleler.length){
      return { value:null, cert:'missing', words:kelimeler.length,
        sentences:cumleler.length, syllables:0, band:null,
        why:'Ölçüm için en az bir tam cümle gerekir.' };
    }
    const hece = kelimeler.reduce((a, w) => a + syllables(w), 0);
    const hkOran = hece / kelimeler.length;
    const kcOran = kelimeler.length / cumleler.length;
    const ham = 198.825 - 40.175 * hkOran - 2.610 * kcOran;

    /* Atesman OLCEGI 0-100'dur ama FORMUL sinirsizdir: iki kelimelik bir
       cumle 113 uretir, cok uzun bir cumle eksiye duser. Olcegin disina
       tasan bir sayiyi oldugu gibi gostermek, bandi olmayan bir deger
       gostermektir — "%113 okunabilirlik" diye bir sey yok.

       Bu yuzden olcege kirpilir. Kirpma bir bilgi kaybi degil: 113 ile 100
       ayni banttadir (cok kolay) ve ikisi de "bu metin cok kisa cumlelerden
       kuruluyor" der. Kaybolan sey yalnizca olceksiz bir sayidir.

       Ham deger `raw` alaninda durur: kirpildigini gizlemek, kirpmaktan
       kotudur. */
    const os = Math.max(0, Math.min(100, ham));

    return {
      value:Math.round(os * 10) / 10,
      raw:Math.round(ham * 10) / 10,
      clamped:ham > 100 || ham < 0,
      cert:'derived',
      words:kelimeler.length, sentences:cumleler.length, syllables:hece,
      wordsPerSentence:Math.round(kcOran * 10) / 10,
      syllablesPerWord:Math.round(hkOran * 100) / 100,
      band:bandOf(os),
    };
  }

  /* Atesman'in kendi bant tablosu. Bant bir NOT degil bir tarif:
     "zor" kotu demek degildir — felsefi bir metnin zor olmasi beklenir. */
  function bandOf(os){
    if(os >= 90) return { id:'cok-kolay', label:'Çok kolay',  note:'İlkokul düzeyi.' };
    if(os >= 70) return { id:'kolay',     label:'Kolay',      note:'Ortaokul düzeyi.' };
    if(os >= 50) return { id:'orta',      label:'Orta güçlük', note:'Lise düzeyi; çoğu deneme burada.' };
    if(os >= 30) return { id:'zor',       label:'Zor',        note:'Üniversite düzeyi; akademik ve felsefi metinler burada.' };
    return { id:'cok-zor', label:'Çok zor', note:'Uzmanlık metni. Kasıtlı değilse cümleler kısaltılabilir.' };
  }

  /* Tekrarlanan kelimeler — uslup degil OLCUM. En sik gecen dolu kelimeler.
     Baglaclar ve edatlar sayilmaz; sayilsaydi her metnin basinda "ve" olurdu. */
  const DURAK = new Set(('ve veya ile bir bu şu o da de ki için gibi ama fakat ancak '
    + 'çünkü daha çok en her hiç ise ne mi mı mu mü olarak olan olduğu var yok '
    + 'ben sen biz siz onlar kadar sonra önce göre').split(' '));

  function repeats(text, limit){
    const s = String(text || '').toLocaleLowerCase('tr-TR');
    const say = {};
    s.split(/[^\wçğıöşüâîû]+/i).filter(Boolean).forEach(w => {
      if(w.length < 4 || DURAK.has(w)) return;
      say[w] = (say[w] || 0) + 1;
    });
    return Object.keys(say).filter(w => say[w] >= 3)
      .map(w => ({ word:w, count:say[w] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit || 6);
  }

  /* Taslak basina revizyon orani. Surekli yeni taslak acip hicbirini revize
     etmemek en yaygin yazi tikanmasidir. Oran bir hedef degil bir aynadir. */
  function draftRatio(){
    const d = S.drafts || [];
    if(!d.length) return { value:null, cert:'missing', drafts:0, revisions:0 };
    const rev = d.reduce((a, x) => a + (x.revisions || 0), 0);
    return { value:rev / d.length, cert:'derived', drafts:d.length, revisions:rev };
  }

  /* Son N gunde uretilen kelime. Taslagin kendi kelime sayisindan degil,
     gun kayitlarindaki yazi oturumlarindan gelir — yoksa eski bir taslagi
     acip kapatmak "uretim" sayilirdi. */
  function wordsWritten(days){
    const n = days || 7;
    let toplam = 0, gun = 0;
    U.lastDays(n).forEach(d => {
      const rows = ESP.Model.sessionsOf(d)
        .filter(s => s.disc === 'writing' && s.countCert !== 'missing' && s.count != null);
      if(!rows.length) return;
      toplam += rows.reduce((a, s) => a + s.count, 0);
      gun++;
    });
    return { value:gun ? toplam : null, cert:gun ? 'measured' : 'missing',
      enteredDays:gun, windowDays:n };
  }

  return {
    /* hacim */
    hoursOf, qualityCoef, ehs,
    /* sentez */
    syntopic, unlinkedNotes, linkSuggestions,
    /* arguman */
    openArguments, stalledArguments, checkFallacies, FALLACIES,
    /* yazi */
    readability, bandOf, syllables, repeats, draftRatio, wordsWritten,
  };
})();
