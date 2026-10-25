/* HIZLI GIRIS — komut paletine yazilan tek satirin veriye donusmesi.

   `ferritin 26`  ·  `45 dk yuruyus`  ·  `uyku 7,2`  ·  `2 yumurta 1 cay`

   Bu modul YENI BIR AYRISTIRICI DEGILDIR. Sistemin zaten yazilmis
   ayristiricilarini (parseLab, parseMeal) ve olcum sozlugunu kullanir;
   tek isi bir satirin HANGI ayristiriciya gidecegine karar vermek.

   Neden onemli: gunde bes kez birkac saniye, dokuz ay boyunca. Bir
   olcumu girmek icin bolume gitmek, sekme secmek, alan bulmak ve
   kaydetmek gerekiyordu. Simdi Ctrl+K ve bir satir.

   ─────────────────────────────────────────────────────────────────

   IKI DEGISMEZ:

   1. HICBIR SEY DOGRUDAN KAYDEDILMEZ. Palet bir ONIZLEME dondurur;
      kaydetme kullanicinin onayiyla olur. Yanlis anlasilmis bir satirin
      sessizce depoya yazilmasi, elle girmekten kotudur.

   2. ANLASILMAYAN SATIR UYDURULMAZ. Eslesme yoksa `null` doner ve palet
      o satiri komut olarak gostermez. Yaklasik bir eslesme «buldum»
      diye sunulmaz.

   ─────────────────────────────────────────────────────────────────

   2026-10-25 · kullanici: «spi için daha işlevli veri girişi, sürtünmeyi
   azaltacak teknikler ile daha güzel yap». Bu turda eklenenler:
     · su TOPLANIR («2 bardak su içtim» günün toplamına +500);
     · «7 saat 30 dk», «7 buçuk saat» uykudur;
     · tansiyon, ateş, oksijen, bel/yağ/boyun/kalça günlüğe yazılır;
     · şikâyet işaretleme (şiddet yalnız açık sözle; teşhis yok);
     · «dün» günü, «kahvaltıda / öğlen / akşam / ara öğün» öğünü belirler;
     · birimi uyuşmayan tahlil satırı sessizce yazılmaz (SP.Parse.rowsToSave). */

window.SP = window.SP || {};

SP.Quick = (function(){
  const U = SP.U;

  /* Gunluk olcum alanlari — bunlar tahlil degil, gunun kaydidir ve
     ayri bir yere yazilir. */
  const VITAL_FIELDS = {
    sleep:{ id:'sleep', label:'Uyku', unit:'saat', min:0, max:20,
      aliases:['uyku', 'uyudum', 'sleep'] },
    rhr:{ id:'rhr', label:'İstirahat nabzı', unit:'atım/dk', min:25, max:200,
      aliases:['nabiz', 'istirahat nabzi', 'rhr'] },
    hrv:{ id:'hrv', label:'HRV', unit:'ms', min:1, max:300,
      aliases:['hrv', 'rmssd'] },
    weight:{ id:'weight', label:'Kilo', unit:'kg', min:20, max:300,
      aliases:['kilo', 'agirlik', 'weight'] },
    /* `ekle`: yazilan deger gunun toplamina EKLENIR (asagida BARDAK_ML). */
    water:{ id:'water', label:'Su', unit:'ml', min:0, max:10000, ekle:true,
      aliases:['su', 'water'] },
    /* ÖLÜ ALAN OLARAK BAŞLAMIŞTI: id `mood` idi, ama gunun tek gunluk
       "his" alani `state.js`'te `soreness` adiyla duruyor (Today ekrani
       "Bugun nasil hissediyorsun?" → SORENESS 1-5, 5 zinde) ve yalniz
       `move.js readiness()` BUNU okuyor. Ctrl+K'ya "enerji 4" yazan
       kullanici bir "kaydedildi" bildirimi goruyor, sayi `vitals.mood`a
       yaziliyor — hicbir ekranda gorunmuyor, toparlanmaya hic girmiyor.
       Ayni olcek (1-5, buyuk = iyi) oldugu icin dogru duzeltme yeni bir
       alan acmak degil, VAR OLAN alana baglamaktı. */
    soreness:{ id:'soreness', label:'Enerji', unit:'/5', min:1, max:5,
      aliases:['enerji', 'mod', 'ruh hali'] },
    /* YAŞAMSAL ÖLÇÜM VE VÜCUT ÖLÇÜSÜ GÜNLÜĞE (2026-10-25). «bel 84», «ateş
       37,8», «spo2 97» tahlil oturumu açıyordu; Bugün formu (screens/today.js
       FIELDS) ve vücut analizi (core/vucut.js, move.js vucutVerisi) bunları
       GÜNLÜKTE okur. Alan adları ve sınırlar oradakiyle aynı; boyun ve kalça
       move.js'in vücut formundaki sınırla. */
    sbp:{ id:'sbp', label:'Büyük tansiyon', unit:'mmHg', min:60, max:250,
      aliases:['buyuk tansiyon', 'sistolik', 'sbp'] },
    dbp:{ id:'dbp', label:'Küçük tansiyon', unit:'mmHg', min:30, max:160,
      aliases:['kucuk tansiyon', 'diyastolik', 'dbp'] },
    spo2:{ id:'spo2', label:'Oksijen', unit:'%', min:70, max:100,
      aliases:['oksijen saturasyonu', 'spo2', 'oksijen', 'saturasyon'] },
    temp:{ id:'temp', label:'Ateş', unit:'°C', min:33, max:43,
      aliases:['vucut sicakligi', 'ates', 'atesim'] },
    waist:{ id:'waist', label:'Bel çevresi', unit:'cm', min:40, max:200,
      aliases:['bel cevresi', 'bel', 'belim'] },
    bodyfat:{ id:'bodyfat', label:'Yağ oranı', unit:'%', min:3, max:60,
      aliases:['yag orani', 'yag oranim', 'vucut yagi', 'bodyfat'] },
    neck:{ id:'neck', label:'Boyun çevresi', unit:'cm', min:20, max:70,
      aliases:['boyun cevresi', 'boyun'] },
    hip:{ id:'hip', label:'Kalça çevresi', unit:'cm', min:50, max:200,
      aliases:['kalca cevresi', 'kalca'] },
  };

  /* SU TOPLANIR (2026-10-25). Alan günün TOPLAMIdır; yazılan su ona eklenir.
     1000 ml varken «2 bardak su içtim» 400 yazıyordu (üstüne). Bir bardak
     tek sabittir: Bugün'deki bardak düğmesi de bunu okur. */
  const BARDAK_ML = 250;

  /* Sure birimleri — «45 dk yuruyus» ve «1 saat kosu» ayni sey. */
  const SURE_RE = /(\d+(?:[.,]\d+)?)\s*(dk|dakika|dakka|sa|saat|s)\b/i;

  function sayi(x){
    if(x == null) return null;
    const n = Number(String(x).replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  /* U.norm «â/î/û»yu katlamaz: «şikâyet» → «sikâyet». */
  function katla(s){ return U.norm(s).replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u'); }

  /* ------------------------------------------------------- gun sozu

     «dün 2 bardak su» bugüne yaziliyordu (2026-10-25). Gun sozu kaydin
     GUNUNU belirler; «yarın» olcum degildir, LIFEOS.Olumsuz engeller.
     «dün gece» / «dün akşam» UYKU icin bugunun kaydidir: `vitals.sleep`
     uyanilan gunun gece uykusudur (core/uyku.js soz 1). */
  const GUN_SOZ = [
    { re:/(^|[\s,;])(evvelsi gün|evvelki gün|önceki gün)(?=$|[\s,;.!])/, gun:-2 },
    { re:/(^|[\s,;])(dün)(?=$|[\s,;.!])/, gun:-1 },
    { re:/(^|[\s,;])(bugün)(?=$|[\s,;.!])/, gun:0 },
  ];
  function gunSozu(text){
    const t = String(text || '');
    const k = t.toLocaleLowerCase('tr-TR');
    for(const g of GUN_SOZ){
      const m = k.match(g.re);
      if(!m) continue;
      const bas = m.index + m[1].length, son = bas + m[2].length;
      return { gun:g.gun, kelime:m[2], gece:g.gun === -1 && /^\s+(gece|akşam)/.test(k.slice(son)),
        metin:(t.slice(0, bas) + t.slice(son)).replace(/\s+/g, ' ').trim() };
    }
    return { gun:null, kelime:null, gece:false, metin:t };
  }

  /* Kaydin gunu: cumlenin gun sozu `base`e (yoksa bugune) gore. */
  function tarih(parsed, base){
    const b = base || U.todayISO();
    const g = parsed && parsed.gun;
    return g ? U.iso(U.addDays(U.parse(b), g)) : b;
  }

  /* ----------------------------------------------------- ogun sozu

     «kahvaltıda 2 yumurta» saatin ogunune yaziliyordu (2026-10-25). Soz
     yalniz kullanicinin ACIK tuttugu ogunlerden birine baglanir; ogun
     kapatilmissa ya da yoksa eski kural (saatin ogunu) gecer. */
  const OGUN_SOZ = [
    { re:/(^|[^a-z])ara ogun/, id:'ara' },
    { re:/(^|[^a-z])kahvalti/, id:'kahvalti' },
    { re:/(^|[^a-z])ogle(n|yin|nde|de|ye)?([^a-z]|$)/, id:'ogle' },
    { re:/(^|[^a-z])ikindi/, id:'ara2' },
    { re:/(^|[^a-z])aksam/, id:'aksam' },
    { re:/(^|[^a-z])gece([^a-z]|$)/, id:'gece' },
  ];
  function ogunSozu(text){
    const n = katla(text);
    const s = OGUN_SOZ.find(x => x.re.test(n));
    if(!s) return null;
    const acik = SP.Ogun ? SP.Ogun.liste().map(x => x.id) : (SP.MEAL_SLOTS || []).map(x => x.id);
    if(s.id === 'ara'){
      const simdi = SP.Ogun ? SP.Ogun.simdiki() : null;
      if(/^ara/.test(simdi || '') && acik.indexOf(simdi) >= 0) return simdi;
      const sira = new Date().getHours() < 15 ? ['ara1', 'ara2'] : ['ara2', 'ara1'];
      return sira.find(id => acik.indexOf(id) >= 0) || null;
    }
    return acik.indexOf(s.id) >= 0 ? s.id : null;
  }

  /* Baştaki öğün sözünü (ve «yemeğinde», «öğünü» gibi eşini) atar; besin
     ayrıştırıcısı yalnız besinleri görür. */
  const OGUN_SOZ_BAS = /^(kahvalti\S*|ogle\S*|aksam\S*|ikindi\S*|gece\S*|ara)$/;
  const OGUN_SOZ_EK = /^(ogun\S*|yemeg\S*|yemek\S*)$/;
  function ogunSozunuAt(text){
    const k = String(text).trim().split(/\s+/);
    let i = 0;
    while(i < k.length && (OGUN_SOZ_BAS.test(katla(k[i])) || (i > 0 && OGUN_SOZ_EK.test(katla(k[i]))))) i++;
    return i ? k.slice(i).join(' ') : text;
  }

  /* ------------------------------------------------------------ gunluk */

  /* SU BIRIMIYLE OKUNUR. Alan ml tutar; «su 2» eskiden 2 ml yaziliyordu ve
     «2 litre su ictim» hic okunmuyordu (sayi kelimeden once). Kural: ml
     oldugu gibi, litre x1000, bardak x BARDAK_ML (2026-10-25: 200'du, Bugun
     dugmesi 250 ekliyordu); birimsiz sayi 20'den kucukse litre, 50 ve
     ustuyse ml. Aradaki (20-49) ne makul litre ne makul ml: okunmaz, sorulur. */
  const SU_BIRIM = { ml:1, mililitre:1, litre:1000, lt:1000, l:1000, bardak:BARDAK_ML };
  const SU_BIRIM_RE = '(ml|mililitre|litre|lt|l|bardak)';

  function suMiktari(n, at, alias){
    const sonra = n.slice(at + alias.length)
      .match(new RegExp('^\\s*(\\d+(?:[.,]\\d+)?)\\s*' + SU_BIRIM_RE + '?(?![a-z])'));
    const once = n.slice(0, at)
      .match(new RegExp('(\\d+(?:[.,]\\d+)?)\\s*' + SU_BIRIM_RE + '\\s+(?:[a-z]+\\s+)?$'));
    const m = sonra || once;
    if(!m) return null;
    const v = sayi(m[1]);
    if(v == null || v <= 0) return null;
    if(m[2]) return Math.round(v * SU_BIRIM[m[2]]);
    if(v < 20) return Math.round(v * 1000);
    return v >= 50 ? Math.round(v) : null;
  }

  /* UYKU SÜRESİ SÖYLEYİŞLERİ (2026-10-25): «7 saat 30 dk uyudum» 420
     dakikalık seans oluyordu (saatten sonraki dakika okunmuyordu), «7 buçuk
     saat uyudum» hiç okunmuyordu. Süre saat cinsine ÇEVRİLİR (30 dk = 0,5);
     sayı uydurulmaz: birimi «saat» olmayan sayı bu yoldan okunmaz. */
  const UYKU_SURE = '(\\d+(?:[.,]\\d+)?)\\s*(bucuk\\s*)?(?:saat|sa)(?:lik)?(?:\\s*(?:ve\\s+)?(\\d{1,2})\\s*(?:dk|dakika|dakka))?';
  function uykuSaati(m){
    const v = sayi(m[1]);
    if(v == null) return null;
    const dk = m[3] ? Number(m[3]) : 0;
    if(dk >= 60 || (m[2] && dk)) return null;
    return Math.round((v + (m[2] ? 0.5 : 0) + dk / 60) * 100) / 100;
  }

  /* TANSİYON ÇİFTİ (2026-10-25): «tansiyon 120/80» hiç okunmuyordu. İki
     sayı iki alana yazılır; büyük küçükten büyük değilse ya da sınır
     dışıysa okunmaz («12/8» cmHg söyleyişi çevrilmez: sorulur). */
  const TANSIYON_RE = /(^|[^a-z])(tansiyon(?:um)?|kan basinci(?:m)?)\s*(?:[:=]\s*)?(\d{2,3})\s*[\/\-]\s*(\d{2,3})(?!\d)/;
  function parseTansiyon(n){
    const m = n.match(TANSIYON_RE);
    if(!m) return null;
    const b = Number(m[3]), k = Number(m[4]);
    const fb = VITAL_FIELDS.sbp, fk = VITAL_FIELDS.dbp;
    if(b < fb.min || b > fb.max || k < fk.min || k > fk.max || b <= k) return null;
    return { field:fb, value:b, ikinci:{ field:fk, value:k } };
  }

  function parseVital(text){
    const n = U.norm(text);
    const tn = parseTansiyon(n);
    if(tn) return tn;
    for(const key of Object.keys(VITAL_FIELDS)){
      const f = VITAL_FIELDS[key];
      for(const a of f.aliases){
        const at = n.indexOf(U.norm(a));
        if(at < 0) continue;
        /* Kelime siniri: «su» ararken «sut» eslesmemeli. */
        const once = at === 0 ? ' ' : n[at - 1];
        const sonra = n[at + a.length] || ' ';
        if(/[a-z0-9]/.test(once) || /[a-z0-9]/.test(sonra)) continue;
        if(f.id === 'water'){
          const ml = suMiktari(n, at, U.norm(a));
          if(ml == null || ml < f.min || ml > f.max) continue;
          return { field:f, value:ml, ekle:true };
        }
        /* SAYI KENDİ PARÇASINDAN (2026-10-16): «7 saat uyudum, 2 yumurta
           yedim» uykuyu 2 okuyordu. Kuyruk ilk ayıraçta (virgül — ondalık
           değil —, noktalı virgül, «ve», satır sonu) kesilir. */
        const kuyruk = text.slice(Math.min(text.length, at + a.length))
          .split(/(?<!\d),|,(?!\d)|;|\n|\s+ve\s+|\+/i)[0];
        let v = null;
        if(f.id === 'sleep'){
          const s = U.norm(kuyruk).match(new RegExp('^\\s*(?:[:=]\\s*)?' + UYKU_SURE));
          if(s) v = uykuSaati(s);
        }
        let m = v == null ? kuyruk.match(/(\d+(?:[.,]\d+)?)/) : null;
        /* SAYI KELIMEDEN ONCE DE GELIR: «7 saat uyudum». Yalniz ardinda
           aranirsa bu cumle «7 saat» sureli bir ANTRENMAN oluyordu (420
           dakikalik serbest seans). Onde yalniz UYKU ve yalniz «saat»
           birimiyle okunur: «20 dakika uyudum» ya da «72 kilo kaldirdim»
           gibi birimi baska olan sayiyi bu alana yazmak uydurmak olurdu. */
        if(v == null && !m && f.id === 'sleep'){
          const s = n.slice(0, at).match(new RegExp(UYKU_SURE + '\\s+(?:[a-z]+\\s+){0,2}$'));
          if(s) v = uykuSaati(s);
        }
        if(v == null && m) v = sayi(m[1]);
        if(v == null || v < f.min || v > f.max) continue;
        return { field:f, value:v };
      }
    }
    /* Fiilin öteki çekimleri («7 buçuk saat uyumadım», «uyuyabildim»):
       süre saatle söylendiyse uyku diye OKUNUR ki olumsuzluk kapısı
       (LIFEOS.Olumsuz) engelini söylesin; okunmasaydı cümle sessizce
       «anlaşılmadı» olurdu (2026-10-25). */
    const s = n.match(new RegExp(UYKU_SURE + '\\s+(?:[a-z]+\\s+){0,2}(?:uyu|uyku)[a-z]*(?![a-z])'));
    if(s){
      const f = VITAL_FIELDS.sleep, v = uykuSaati(s);
      if(v != null && v >= f.min && v <= f.max) return { field:f, value:v };
    }
    return null;
  }

  /* VİRGÜLSÜZ ÇOK ÖLÇÜM (2026-10-25): «uyku 7.5 nabız 56 kilo 72» yalnız
     uykuyu yazıyordu (parseVital ilk alanı döndürür); geri kalanı ne
     önizlemede ne «anlaşılmadı»da görünüyordu. Ardından sayı gelen iki ya da
     daha çok ölçüm adı ayıraçsız yan yanaysa cümle adlardan bölünür; gün
     sözü («dün») her parçaya geçer. Bölünecek bir şey yoksa null. Bölünen
     parçalar virgülle birleşince her ad çiftinin arasında ayıraç vardır:
     yeniden bölünmez. */
  const AYIRAC_RE = /(?<!\d),|,(?!\d)|;|\n|\s+ve\s+|\s+sonra\s+/i;
  function vitalBol(text){
    const z = gunSozu(text);
    const t = z.metin, n = U.norm(t);
    const adlar = [];
    Object.keys(VITAL_FIELDS).forEach(k => VITAL_FIELDS[k].aliases.forEach(a => adlar.push(U.norm(a))));
    adlar.sort((x, y) => y.length - x.length);
    const yer = [];
    for(let i = 0; i < n.length; i++){
      if(i > 0 && /[a-z0-9]/.test(n[i - 1])) continue;
      const a = adlar.find(x => n.startsWith(x, i) && !/[a-z0-9]/.test(n[i + x.length] || ' ')
        && /^\s*(?:[:=]\s*)?\d/.test(n.slice(i + x.length)));
      if(a){ yer.push(i); i += a.length - 1; }
    }
    const kes = yer.filter((p, j) => j > 0 && !AYIRAC_RE.test(t.slice(yer[j - 1], p)));
    if(!kes.length) return null;
    const bas = [0].concat(kes);
    return bas.map((p, j) => t.slice(p, bas[j + 1]).trim()).filter(Boolean)
      .map(x => z.kelime ? z.kelime + ' ' + x : x);
  }

  /* ------------------------------------------------------------ hareket */

  function parseMove(text){
    const m = String(text).match(SURE_RE);
    if(!m) return null;
    let dk = sayi(m[1]);
    if(dk == null) return null;
    if(/^s(a|aat)?$/i.test(m[2])) dk = dk * 60;
    if(dk <= 0 || dk > 600) return null;

    /* Hangi hareket?

       Once yalnizca TAM AD araniyordu ve bu sessiz bir kayiptı: tabloda
       «Tempolu yuruyus» diye duran hareket, «45 dakika yurudum» cumlesiyle
       eslesmiyordu. Sure dogru kaydediliyor, hareket «serbest seans»
       oluyordu — yani yuk hesabina giriyor ama kalip dengesine, MET
       degerine ve ilerleme merdivenine girmiyordu.

       Insanlar isim degil FIIL konusur. Artik takma ad indeksi kullanilir
       ve UZUNDAN KISAYA denenir: «tempolu yuruyus» once, «yuruyus» sonra.
       Kisa olan once denenseydi ozgul ad hic eslesmezdi.

       Ad gecmiyorsa yine serbest seans olur: sure kaybolmaz. */
    const n = U.norm(text);
    let ex = null;
    (SP.EX_ALIASES || []).some(x => {
      const a = U.norm(x.alias);
      if(a.length >= 3 && n.indexOf(a) >= 0){ ex = x.ex; return true; }
      return false;
    });
    return { minutes:Math.round(dk), exercise:ex };
  }

  /* ------------------------------------------------------------ kestirme

     «öğlen 30 dakika uyudum», «20 dk şekerleme», «yarım saat kestirdim».
     Bunlar SERBEST SEANS DEĞİLDİR (eskiden 30 dakikalık antrenman
     yazılıyordu) ve gece uykusu da değildir (core/uyku.js söz 1).
     Kısa uyku sözü varsa süre dakika ya da saat olabilir; yalnız «uyudum»
     varsa süre DAKİKA olmalı («7 saat uyudum» gece uykusudur). */
  const KESTIRME_RE = /(kestirme|kestird|sekerleme|ogle uykusu|oglen uyu|ogle uyu|kisa uyku|\bnap\b)/;
  function parseNap(text){
    const n = U.norm(text);
    const soz = KESTIRME_RE.test(n);
    /* Kelime BAŞINDA: «yuruyus» içinde de «uyu» geçer. */
    if(!soz && !/(^|[^a-z])(uyu|uyku)/.test(n)) return null;
    let dk = null, birim = null;
    const m = n.match(/(\d+(?:[.,]\d+)?)\s*(dk|dakika|dakka|sa|saat)\b/);
    if(m){
      birim = /^s/.test(m[2]) ? 'saat' : 'dk';
      const x = sayi(m[1]);
      dk = x == null ? null : birim === 'saat' ? x * 60 : x;
    }else if(/yarim saat/.test(n)){ dk = 30; birim = 'saat'; }
    if(dk == null) return null;
    if(!soz && birim !== 'dk') return null;
    if(dk <= 0 || dk > 240) return null;
    const s = String(text).match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
    const bas = s ? (s[1].length === 1 ? '0' + s[1] : s[1]) + ':' + s[2] : null;
    return { dk:Math.round(dk), bas };
  }

  /* ------------------------------------------------------------ sikayet

     «başım ağrıyor», «baş ağrısı orta», «şikâyetim yok» (2026-10-25).
     Yalniz ISARETLEME: sozlukteki (data/symptoms.js) bir sikayet ya da
     «bugun sikayet yok». Teshis yok. SIDDET YALNIZ ACIK SOZDEN gelir
     (hafif / orta / şiddetli); soz yoksa siddet `null` kalir ve kayit
     yazilmaz, «şiddet belirtilmedi» denir — tahmin edilmez. */
  const SIDDET = { hafif:1, orta:2, siddetli:3 };
  const SIKAYET_YOK_RE = /(^|[^a-z])(hicbir\s+)?sikayet(im|imiz)?\s+(yok|olmadi)(?=[^a-z]|$)/;

  function parseSymptom(text){
    const n = katla(text);
    if(SIKAYET_YOK_RE.test(n)) return { yok:true, symptom:null, severity:null };
    let en = null;
    (SP.SYMPTOMS || []).forEach(s => {
      (s.aliases || []).concat([s.name]).forEach(a => {
        const an = katla(a);
        if(an.length < 3) return;
        let at = n.indexOf(an);
        while(at >= 0){
          /* Kelime BAŞINDA; sonu ek alabilir («baş ağrı» → «baş ağrısı»). */
          if(at === 0 || /[^a-z0-9]/.test(n[at - 1])){
            if(!en || an.length > en.uzunluk) en = { s, uzunluk:an.length };
            return;
          }
          at = n.indexOf(an, at + 1);
        }
      });
    });
    if(!en) return null;
    const sm = n.match(/(^|[^a-z])(hafif|orta|siddetli)(?=[^a-z]|$)/);
    return { yok:false, symptom:en.s, severity:sm ? SIDDET[sm[2]] : null };
  }

  /* ------------------------------------------------------------ tahlil

     BİRİMİ UYUŞMAYAN SATIR SESSİZCE YAZILMAZ (2026-10-25, Tahliller
     ajanından devir). Satırlar `skip`/`mismatch`e bakılmadan yazılıyordu:
     «ferritin 28 qux/zud» kanonik birimin (ng/mL) altına giriyordu. Kayda
     yalnız SP.Parse.rowsToSave'in geçirdiği satır girer; uyuşmayan satır
     `uyusmaz`ta taşınır ve önizlemede söylenir. */
  function parseLabLine(text){
    const r = SP.Parse.parseLab(text);
    if(!r.rows.length) return null;
    const kayit = SP.Parse.rowsToSave ? SP.Parse.rowsToSave(r)
      : r.rows.filter(x => !x.skip && !x.mismatch);
    const uyusmaz = r.rows.filter(x => kayit.indexOf(x) < 0 && x.mismatch);
    if(!kayit.length && !uyusmaz.length) return null;
    return { rows:kayit, uyusmaz };
  }

  /* Uyuşmayan satırın ekrandaki notu (Tahliller'deki uyarının sözüyle). */
  function uyusmazNotu(rows){
    return (rows || []).map(r => r.marker.name + ' birimi uyuşmuyor (' + r.mismatch + ')').join(', ')
      + '; birimi Tahliller’de kendin denetleyip işaretlersen yazılır';
  }

  /* ------------------------------------------------------------- ogun */

  function parseMealLine(text){
    const r = SP.Parse.parseMeal(text);
    if(!r.items.length) return null;
    return { items:r.items, unmatched:r.unmatched };
  }

  /* ============================================================ karar

     Sira onemlidir: en OZGUL olan once denenir. «uyku 7,2» hem gunluk
     alanidir hem de bir gidaya benzeyebilir; gunluk once bakilir.

     «45 dk yuruyus» once hareket olarak denenir cunku icinde sure
     birimi var; tahlil ve ogun ayristiricilari sure birimi tanimaz.
     Sikayet hareketten ONCE: «başım ağrıyor 2 saattir» 120 dakikalik
     seans degildir.

     `parse` OLCUM olmayan cumleyi hic tanimaz: «7 saat uyumadim» 420
     dakikalik seans, «2 bardak su icmedim» 400 ml su oluyordu
     (belgeler/ekip/HATALAR.md KR-1). `parseHam` suzgecsiz halidir; yalniz
     engelin NEDENINI soylemek isteyen `Proposals.fromText` kullanir. */
  function parse(text){
    const r = parseHam(text);
    return r && !olcumEngeli(text, r) ? r : null;
  }

  /* Olumsuzluk kapisi. «şikâyetim yok»un «yok»u olumsuzluk degil cumlenin
     KENDISIdir: o soz cikarilip geri kalanina bakilir («yarın şikâyetim
     yok» yine engellenir). */
  function olcumEngeli(text, parsed){
    let t = String(text || '');
    if(parsed && parsed.kind === 'symptom' && parsed.data.yok){
      t = t.replace(/(hiçbir\s+|hicbir\s+)?şik[âa]yet(im|imiz)?\s+(yok|olmadı|olmadi)/gi, ' ');
    }
    return LIFEOS.Olumsuz.olcumEngeli(t);
  }

  function parseHam(text){
    const t0 = String(text || '').trim();
    if(t0.length < 2) return null;
    const z = gunSozu(t0);
    const t = z.metin;
    if(t.length < 2) return null;
    const r = parseIc(t);
    if(!r) return null;
    r.gun = z.gun;
    r.gunSozu = z.kelime;
    /* «dün gece … uyudum» bugünün gece uykusudur; bu «dün» bileşik cümlenin
       sonraki parçasına taşınmaz (Proposals.fromText). */
    r.gunSurer = true;
    if(z.gece && r.kind === 'vital' && r.data.field.id === 'sleep'){ r.gun = 0; r.gunSurer = false; }
    return r;
  }

  function parseIc(t){
    const kz = parseNap(t);
    if(kz) return { kind:'nap', data:kz, label:'Kısa uyku · ' + kz.dk + ' dk' + (kz.bas ? ' (' + kz.bas + ')' : ''),
      hint:'Uyku' };

    const v = parseVital(t);
    if(v) return { kind:'vital', data:v,
      label:v.ikinci ? 'Tansiyon ' + v.value + '/' + v.ikinci.value + ' ' + v.field.unit
        : v.field.label + ' ' + (v.ekle ? '+' : '') + U.fmtNum(v.value) + ' ' + v.field.unit,
      hint:'Günlük ölçüm' };

    const sk = parseSymptom(t);
    if(sk) return { kind:'symptom', data:sk,
      label:sk.yok ? 'Şikâyet yok'
        : sk.symptom.name + ' · ' + (sk.severity ? SP.SYMPTOM_SEVERITY[sk.severity - 1].label : 'şiddet belirtilmedi'),
      hint:'Şikâyet' };

    const mv = parseMove(t);
    if(mv) return { kind:'move', data:mv,
      label:(mv.exercise ? mv.exercise.name : 'Serbest seans') + ' · ' + mv.minutes + ' dk',
      hint:'Antrenman' };

    const lb = parseLabLine(t);
    if(lb) return { kind:'lab', data:lb,
      label:lb.rows.length ? lb.rows.map(r => r.marker.name + ' ' + U.fmtNum(r.value)).join(', ')
        : lb.uyusmaz.map(r => r.marker.name + ' ' + U.fmtNum(r.value) + ' ' + r.mismatch).join(', ') + ' · yazılmaz',
      hint:lb.rows.length ? lb.rows.length + ' ölçüm' + (lb.uyusmaz.length ? ' · ' + uyusmazNotu(lb.uyusmaz) : '')
        : uyusmazNotu(lb.uyusmaz) };

    /* Öğün sözü besinden ÖNCE ayrılır (2026-10-25): «kahvaltıda 2 yumurta 1
       çay» besin ayrıştırıcısına olduğu gibi gidince «1 çay» sessizce
       düşüyordu. Baştaki söz («kahvaltıda», «öğlen», «akşam yemeğinde»,
       «ara öğün») yuvayı söyler; besinler sözsüz metinden okunur. */
    const slot = ogunSozu(t);
    const ml = parseMealLine(slot ? ogunSozunuAt(t) : t);
    if(ml) return { kind:'meal', data:Object.assign(ml, { slot }),
      label:ml.items.map(i => i.food.name).join(', '),
      hint:ml.items.length + ' gıda' };

    return null;
  }

  /* Bugün kutusunun önizleme cümlesi: ne YAZILACAĞI. Su için ekleme ve
     günün yeni toplamı («Su +500 ml · toplam 1.500 ml»). */
  function onizleme(parsed, date){
    if(!parsed) return '';
    if(parsed.kind === 'vital' && parsed.data.ekle){
      const f = parsed.data.field, v = SP.Model.vitalsOf(date || tarih(parsed));
      const once = v && v[f.id] != null ? Number(v[f.id]) : 0;
      return f.label + ' +' + U.fmtNum(parsed.data.value) + ' ' + f.unit
        + ' · toplam ' + U.fmtNum(once + parsed.data.value) + ' ' + f.unit;
    }
    return parsed.label;
  }

  /* ========================================================== uygulama

     Onaylanan bir onizlemeyi depoya yazar. Palet bunu DOGRUDAN
     cagirmaz: once kullaniciya gosterir. */
  async function apply(parsed, opts){
    const o = opts || {};
    const gun = o.date || tarih(parsed);

    if(parsed.kind === 'vital'){
      const d = parsed.data, f = d.field;
      const patch = {};
      if(d.ekle){
        const v = SP.Model.vitalsOf(gun);
        const toplam = (v && v[f.id] != null ? Number(v[f.id]) : 0) + d.value;
        if(toplam > f.max) return { ok:false, text:f.label + ' için toplam ' + U.fmtNum(toplam) + ' ' + f.unit + ' çok yüksek.' };
        patch[f.id] = toplam;
      }else patch[f.id] = d.value;
      if(d.ikinci) patch[d.ikinci.field.id] = d.ikinci.value;
      await SP.Model.saveVitals(gun, patch);
      return { ok:true, text:(d.ikinci ? 'Tansiyon' : f.label) + ' kaydedildi', route:'today' };
    }

    if(parsed.kind === 'nap'){
      const r = await SP.Uyku.ekle(gun, parsed.data);
      return r.ok ? { ok:true, text:'Kısa uyku kaydedildi', route:'today', kayit:r.kayit } : { ok:false, text:r.why };
    }

    if(parsed.kind === 'symptom'){
      const d = parsed.data;
      if(d.yok){
        await SP.Model.saveVitals(gun, { symptoms:{}, symptomsLogged:true });
        return { ok:true, text:'Şikâyet yok olarak kaydedildi', route:'today' };
      }
      if(!d.severity) return { ok:false, text:SIDDET_YOK };
      await SP.Symptom.setSymptom(gun, d.symptom.id, d.severity);
      await SP.Model.saveVitals(gun, { symptomsLogged:true });
      return { ok:true, text:d.symptom.name + ' işaretlendi', route:'today' };
    }

    if(parsed.kind === 'move'){
      const w = SP.Model.newWorkout(gun);
      w.minutes = parsed.data.minutes;
      if(parsed.data.exercise){
        w.name = parsed.data.exercise.name;
        w.kind = parsed.data.exercise.kind || 'strength';
        w.items = [{ exId:parsed.data.exercise.id, levelId:null, sets:null,
          reps:null, minutes:parsed.data.minutes }];
      }
      await SP.Model.saveWorkout(w);
      return { ok:true, text:'Seans kaydedildi', route:'move' };
    }

    if(parsed.kind === 'lab'){
      /* Yalniz rowsToSave'in gecirdigi satir (yukarida parseLabLine). */
      const rows = SP.Parse.rowsToSave ? SP.Parse.rowsToSave(parsed.data) : parsed.data.rows;
      if(!rows.length) return { ok:false, text:'Yazılmadı: ' + uyusmazNotu(parsed.data.uyusmaz) + '.' };
      /* Ayni gune ikinci bir oturum acilmaz; var olanin ustune yazilir. */
      const mevcut = (SP.S.labs || []).find(l => l.date === gun);
      const rec = mevcut || SP.Model.newLab(gun);
      rows.forEach(r => {
        rec.values[r.marker.id] = { v:r.value, cert:'measured', unit:r.marker.unit };
      });
      await SP.Model.saveLab(rec);
      return { ok:true, text:rows.length + ' ölçüm kaydedildi', route:'labs' };
    }

    if(parsed.kind === 'meal'){
      const meal = SP.Model.newMeal(parsed.data.slot || o.slot || (SP.Ogun ? SP.Ogun.simdiki() : 'ara1'));
      /* Ayristirici gram degerini `g` alaninda uretir. Burada `i.grams`
         okunuyordu ve boyle bir alan yok: komut paletinden girilen HER
         ogun gramsiz kaydediliyordu. Sessiz bir kayipti — ogun listede
         gorunuyor ama kalorisi, makrosu ve mikro besini sifir. */
      meal.items = parsed.data.items.map(i => ({ foodId:i.food.id, g:i.g,
        cert:i.cert || 'estimated' }));
      await SP.Model.addMeal(gun, meal);
      return { ok:true, text:'Öğün eklendi', route:'meals' };
    }

    return { ok:false, text:'Anlaşılmadı' };
  }

  const SIDDET_YOK = 'Şiddet belirtilmedi: «hafif», «orta» ya da «şiddetli» diye ekle.';

  return { parse, parseHam, apply, parseVital, vitalBol, parseMove, parseNap, parseSymptom, VITAL_FIELDS,
    BARDAK_ML, gunSozu, ogunSozu, tarih, onizleme, olcumEngeli, uyusmazNotu, SIDDET_YOK };
})();
