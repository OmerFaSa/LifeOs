/* KONUŞARAK VERİ GİRİŞİ — cümleden kayda.

   «Bugün matematikten 40 soru çözdüm, 32'si doğru ve 20 paragraf
   yaptım» bir cümle değil ÜÇ olgudur. Sistem bunu üç ayrı öneriye
   çevirir; hiçbiri onaysız yazılmaz.

   ─────────────────────────────────────────────────────────────────

   NEDEN KURAL MOTORU ÖNCE

   Cümleyi modele göndermek kolaydır ama üç bedeli vardır: kota harcar,
   çevrimdışı çalışmaz ve en önemlisi MODEL SAYI UYDURABİLİR. «40 soru»
   yerine «45» yazarsa kimse yakalayamaz.

   Bu yüzden önce burası dener. Kural motoru çözerse model hiç
   çağrılmaz. Çözemezse cümle modele gider ama model yine SAYI
   ÜRETMEZ: kapalı katalogdan bir eylem ve yapısal parametre döndürür,
   parametreler gerçek veriye karşı doğrulanır (bkz. core/proposals.js).

   ─────────────────────────────────────────────────────────────────

   BİLEŞİK CÜMLE

   Yan cümlelere bölünür. Ayraçlar dilin kendi bağlaçlarıdır; virgül de
   ayraçtır ama SAYININ İÇİNDEKİ virgül değildir — «7,5 saat uyudum»
   tek parçadır. */

window.R = window.R || {};

R.Entry = (function(){
  const U = R.U;

  /* ---------------------------------------------------------- sayı */

  const RAKAM = {
    'bir':1, 'iki':2, 'üç':3, 'uc':3, 'dört':4, 'dort':4, 'beş':5, 'bes':5,
    'altı':6, 'alti':6, 'yedi':7, 'sekiz':8, 'dokuz':9, 'on':10,
    'yirmi':20, 'otuz':30, 'kırk':40, 'kirk':40, 'elli':50, 'altmış':60,
    'altmis':60, 'yetmiş':70, 'yetmis':70, 'seksen':80, 'doksan':90, 'yüz':100, 'yuz':100,
  };

  const KESIR = { 'yarım':0.5, 'yarim':0.5, 'çeyrek':0.25, 'ceyrek':0.25 };

  function sayi(x){
    if(x == null) return null;
    const t = String(x).trim().replace(',', '.');
    if(/^\d+(\.\d+)?$/.test(t)) return Number(t);
    const k = U.norm ? U.norm(t) : t.toLocaleLowerCase('tr-TR');
    if(KESIR[k] != null) return KESIR[k];
    if(RAKAM[k] != null) return RAKAM[k];
    const bm = k.match(/^(.+?)\s+(?:buçuk|bucuk)$/);
    if(bm){
      const kok = sayi(bm[1]);
      if(kok != null) return kok + 0.5;
    }
    return null;
  }

  /* Metindeki ilk sayıyı bulur — yazıyla da olabilir. */
  const SAYI_RE = new RegExp(
    '(\\d+(?:[.,]\\d+)?(?:\\s+(?:buçuk|bucuk))?|'
    + Object.keys(RAKAM).join('|') + '(?:\\s+(?:buçuk|bucuk))?|yarım|yarim|çeyrek|ceyrek)', 'i');

  function ilkSayi(text){
    const m = String(text).match(SAYI_RE);
    return m ? sayi(m[1]) : null;
  }

  /* --------------------------------------------------------- ders */

  function dersBul(text){
    const n = U.norm(text);
    let bulunan = null;
    (R.SUBJECT_ALIASES || []).some(x => {
      const a = U.norm(x.alias);
      if(a.length >= 3 && n.indexOf(a) >= 0){ bulunan = x.subject; return true; }
      return false;
    });
    if(!bulunan && /geometri/i.test(n)){
      const sid = /ayt/i.test(n) ? 'ayt-matematik' : 'tyt-matematik';
      bulunan = (R.SUBJECTS || []).find(s => s.id === sid) || null;
    }
    return bulunan;
  }

  /* Konu adı geçiyor mu? Dersin kendi konu listesinde aranır — ders
     bilinmiyorsa bütün konularda. Uzun ad önce denenir. */
  function konuBul(text, subject){
    const n = U.norm(text);
    const havuz = [];
    (subject ? [subject] : (R.SUBJECTS || [])).forEach(s => {
      (s.topics || []).forEach(t => havuz.push({ s, t, ad:U.norm(t.name) }));
    });
    havuz.sort((a, b) => b.ad.length - a.ad.length);
    let bulunan = null;
    havuz.some(x => {
      if(x.ad.length >= 5 && n.indexOf(x.ad) >= 0){ bulunan = x; return true; }
      return false;
    });
    return bulunan;
  }

  /* ------------------------------------------------------ kalıplar

     Sıra önemlidir: en ÖZGÜL olan önce denenir. «20 paragraf çözdüm»
     hem paragraf sayacıdır hem genel soru sayısı gibi görünür;
     paragraf önce bakılır. */

  /* Sayaçta sayı kelimeden önce («40 soru») ya da SONRA («soru 40»: kısa
     kayıt, HKM'den Telegram'la gelir) durur. Sonra geliyorsa ardında süre
     birimi olmamalı: «soru 40 dakika» bir sayaç değildir. */
  const SONRA = '\\s+(\\d+)(?![\\d.,]|\\s*(?:dk|dakika|saat|sa)\\b)';
  const sayac = ad => new RegExp('(\\d+|[a-zçğıöşü]+)\\s*(?:tane\\s*)?' + ad + '|' + ad + SONRA, 'i');
  const PARAGRAF_RE = sayac('paragraf');
  const PROBLEM_RE  = sayac('problem');
  const SORU_RE     = sayac('soru');
  /* Önce «40 soru» biçimi; oradaki kelime sayı değilse («matematik soru
     30»da «matematik») sayı sonraki biçimden okunur. */
  function sayacSayisi(m, text, ad){
    const n = sayi(m[1] != null ? m[1] : m[2]);
    if(n != null) return n;
    const s = String(text).match(new RegExp(ad + SONRA, 'i'));
    if(s) return sayi(s[1]);
    /* «30 kimya sorusu çözmüştüm»: sayı, ders adı ve sayaç (King-Bench veri girişi paketi). */
    const a = String(text).match(new RegExp('(\\d+)\\s+[a-zçğıöşü]+\\s+' + ad, 'i'));
    return a ? sayi(a[1]) : null;
  }
  const DOGRU_RE    = /(\d+)\s*(?:'?[sy]i\s*)?(?:tane\s*)?(?:doğru|dogru|net)/i;
  /* «4 yanlış», «4 yanlışım var», «2 boş» (2026-10-19, depo sahibi: «konudan
     şu kadar sorum, şu kadar yanlışım var»). Doğru söylenmemişse doğru =
     çözülen − yanlış − boş; boş söylenmemişse yok sayılır ve önizleme bunu
     AÇIKÇA yazar (bosVarsayim) — kullanıcı onaylamadan yazılmaz. */
  const YANLIS_RE   = /(\d+)\s*(?:'?[sy]?[iıuü]\s*)?(?:tane\s*)?(?:yanlış|yanlis)/i;
  const BOS_RE      = /(\d+)\s*(?:'?[sy]?[iıuü]\s*)?(?:tane\s*)?(?:boş|bos)(?![a-zçğıöşü])/i;

  /* --------------------------------------------------------- süre */

  /* Ortak okuyucu (brand/ortak/turkcesayi.js): «7 saat 30 dk», «yedi buçuk saat», «yarım saat»
     dört modülde aynı kuralla okunur. */
  function sureOku(text){
    const T = window.LIFEOS && window.LIFEOS.TurkceSayi;
    const s = T ? T.sure(text) : null;
    return s ? { minutes:Math.round(s.dakika), hours:s.dakika / 60, birim:s.birim } : null;
  }

  function parseUyku(text){
    if(!/uyu/i.test(text)) return null;
    const s = sureOku(text);
    /* gece uykusu saatle söylenir: «30 dk uyudum» şekerlemedir, uyku verisine yazılmaz */
    if(!s || s.birim !== 'saat' || s.hours <= 0 || s.hours > 24) return null;
    return { kind:'uyku', hours:s.hours };
  }

  function parseParagraf(text){
    const m = String(text).match(PARAGRAF_RE);
    if(!m) return null;
    const n = sayacSayisi(m, text, 'paragraf');
    if(n == null || n < 0 || n > 500) return null;   // 0 ölçülmüş sıfırdır, boş değil
    return { kind:'paragraf', count:Math.round(n) };
  }

  function parseProblem(text){
    const m = String(text).match(PROBLEM_RE);
    if(!m) return null;
    const n = sayacSayisi(m, text, 'problem');
    if(n == null || n < 0 || n > 500) return null;   // 0 ölçülmüş sıfırdır, boş değil
    return { kind:'problem', count:Math.round(n) };
  }

  function parseSoru(text){
    const m = String(text).match(SORU_RE);
    if(!m) return null;
    const n = sayacSayisi(m, text, 'soru');
    if(n == null || n <= 0 || n > 1000) return null;

    const d = String(text).match(DOGRU_RE);
    let dogru = d ? sayi(d[1]) : null;
    let bosVarsayim = false;
    if(dogru == null){
      const y = String(text).match(YANLIS_RE), b = String(text).match(BOS_RE);
      const yanlis = y ? sayi(y[1]) : null, bos = b ? sayi(b[1]) : null;
      if(yanlis != null){ dogru = n - yanlis - (bos || 0); bosVarsayim = bos == null; }
    }
    /* King-Bench: «40 soru 32 doğru 12 yanlış» tutarsızdır (44 > 40); sessizce yazılmaz, sorulur. */
    if(d){ const y2 = String(text).match(YANLIS_RE), b2 = String(text).match(BOS_RE);
      const yan = y2 ? sayi(y2[1]) : null, bo = b2 ? sayi(b2[1]) : null;
      if(yan != null && dogru + yan + (bo || 0) > n) return { kind:'soru', tutarsiz:true, count:Math.round(n), dogru, yanlis:yan, bos:bo }; }
    /* Doğru sayısı çözülenden çok olamaz: yanlış okunmuştur. */
    if(dogru != null && (dogru < 0 || dogru > n)){ dogru = null; bosVarsayim = false; }

    const subject = dersBul(text);
    const konu = konuBul(text, subject);
    return {
      kind:'soru', count:Math.round(n),
      correct:dogru == null ? null : Math.round(dogru), bosVarsayim,
      subject:subject || (konu ? konu.s : null),
      topic:konu ? konu.t : null,
    };
  }

  function parseSure(text){
    /* «45 dakika matematik çalıştım» — soru sayısı yoksa süre kaydı. */
    if(SORU_RE.test(text) || PARAGRAF_RE.test(text) || PROBLEM_RE.test(text)) return null;
    if(/uyu/i.test(text)) return null;
    const s = sureOku(text);
    if(!s || s.minutes <= 0 || s.minutes > 960) return null;
    const subject = dersBul(text);
    /* King-Bench (tur 6): «bugün 2 saat ders çalıştım» — ders adı yoksa günün plan dışı süresine (ders ayrımsız). */
    if(!subject && !/(ders|çalıştım|çalıştık|çalışmıştım)/.test(R.U.norm ? R.U.norm(text) : String(text).toLowerCase()) && !/(ders|çalıştım)/i.test(text)) return null;
    return { kind:'sure', minutes:Math.round(s.minutes), subject:subject || null };
  }

  /* ------------------------------------------------------ deneme

     King 5 tur 5: «TYT denemesi: Türkçe 32 doğru 6 yanlış, Matematik 25/5,
     Fen 12 doğru 4 yanlış 4 boş» TEK kayıttır; yan cümlelere bölünmeden okunur.
     Yalnız net söylenirse («78 net: Türkçe 30, …») yazılmaz: doğru ve yanlış
     olmadan deneme kaydı uydurma olurdu; ne eksik olduğu sorulur (engel). */
  const DENEME_TEST = {
    TYT:[['Türkçe', /turkce/], ['Sosyal Bilimler', /sosyal/], ['Temel Matematik', /matematik|\bmat\b/], ['Fen Bilimleri', /\bfen\b/]],
    AYT:[['Matematik', /matematik|\bmat\b/], ['Fizik', /fizik/], ['Kimya', /kimya/], ['Biyoloji', /biyoloji|\bbiyo\b/]],
  };
  const EK = "(?:'?[sy]?[iu]\\s*)?";
  const DY_RE = new RegExp('^\\D{0,14}?(\\d+)\\s*' + EK + '(?:dogru|d)(?![a-z])\\D{0,8}?(\\d+)\\s*' + EK + '(?:yanlis|y)(?![a-z])'
    + '(?:\\D{0,8}?(\\d+)\\s*' + EK + '(?:bos|b)(?![a-z]))?');
  const CIFT_RE = /^\D{0,14}?(\d+)\s*[\/-]\s*(\d+)(?:\s*[\/-]\s*(\d+))?/;
  const NET_RE = /^\D{0,14}?(\d+(?:[.,]\d+)?)/;
  function parseDeneme(text){
    const n = U.norm(text);
    const anahtar = /deneme/.test(n), aileSoz = /\b(tyt|ayt)\b/.test(n);
    const aile = /\bayt\b|fizik|kimya|biyoloji/.test(n) ? 'AYT' : 'TYT';
    const yer = [];
    DENEME_TEST[aile].forEach(([ad, re]) => { const m = n.match(re); if(m) yer.push({ ad, i:m.index, son:m.index + m[0].length }); });
    if(!yer.length) return null;
    yer.sort((a, b) => a.i - b.i);
    const testler = yer.map((y, k) => {
      const parca = n.slice(y.son, k + 1 < yer.length ? yer[k + 1].i : n.length);
      const m = parca.match(DY_RE) || parca.match(CIFT_RE);
      if(m) return { ad:y.ad, d:Number(m[1]), y:Number(m[2]), b:m[3] != null ? Number(m[3]) : null };
      const nm = parca.match(NET_RE);
      return nm ? { ad:y.ad, net:Number(nm[1].replace(',', '.')) } : null;
    });
    if(testler.some(x => !x)) return null;
    const tam = testler.filter(x => x.d != null);
    const soruCumlesi = SORU_RE.test(text);
    if(!(anahtar || (aileSoz && !soruCumlesi) || tam.length >= 2)) return null;
    if(soruCumlesi && !tam.length) return null;          // «denemede 40 soru çözdüm» bir soru kaydıdır
    if(tam.length < testler.length){
      const ozet = testler.map(x => x.ad + ' ' + (x.net != null ? String(x.net).replace('.', ',') + ' net' : x.d + ' doğru ' + x.y + ' yanlış')).join(', ');
      return { engel:{ deneme:true, neden:'net', soru:'Deneme sonucunu okudum (' + aile + ': ' + ozet + '). Kaydetmem için her testin doğru ve '
        + 'yanlış sayısı gerekiyor; net tek başına yetmiyor. Şöyle yazabilirsin: «' + aile + ' denemesi: Türkçe 32 doğru 6 yanlış, Matematik 25 doğru 5 yanlış».' } };
    }
    const sablon = (R.EXAM_TEMPLATES || []).find(t => t.family === aile && t.kind === 'full');
    for(const x of tam){
      const t = sablon && sablon.tests.find(s => s.name === x.ad);
      if(t && x.d + x.y + (x.b || 0) > t.q){
        return { engel:{ deneme:true, neden:'fazla', soru:x.ad + ' testinde ' + t.q + ' soru var; ' + x.d + ' doğru ' + x.y + ' yanlış'
          + (x.b != null ? ' ' + x.b + ' boş' : '') + ' olamaz. Sayıları yeniden yazar mısın?' } };
      }
    }
    return { kind:'deneme', aile, testler:tam };
  }

  /* Sıra: özgülden genele. */
  function parseOne(text){
    const t = String(text || '').trim();
    if(t.length < 3) return null;
    return parseUyku(t) || parseParagraf(t) || parseProblem(t)
        || parseSoru(t) || parseSure(t) || null;
  }

  /* ------------------------------------------------- bileşik cümle */

  const AYRAC = /\s+(?:ve|ayrıca|bir de|sonra|artı)\s+|[;]|,(?!\d)/gi;

  /* «40 soru çözdüm, 32'si doğru», «…, 4 yanlışım var» bir olgudur: sayı +
     doğru/yanlış/boş ile başlayan parça öncekine bağlanır (2026-10-19). */
  const DEVAM_RE = /^(?:\d+\s*(?:'?[sy]?[iıuü]\s*)?(?:tane\s*)?(?:doğru|dogru|yanlış|yanlis|boş|bos|net)|(?:doğru|yanlış|boş)\w*\s+\d+)/i;
  function yanCumleler(text){
    /* Tek kaynak: brand/ortak/giris.js bol(); yoksa (test, eski kabuk) aynı kural burada. */
    const G = window.LIFEOS && window.LIFEOS.GIRIS;
    if(G && typeof G.bol === 'function') return G.bol(text);
    const out = [];
    String(text || '').split(AYRAC).map(x => String(x || '').trim()).filter(x => x.length > 2).forEach(x => {
      if(out.length && DEVAM_RE.test(x)) out[out.length - 1] += ', ' + x; else out.push(x);
    });
    return out;
  }

  /* Virgülsüz arka arkaya iki sayaç ya da iki ders (King 5 tur 5, klon simülasyonu, veri bütünlüğü denetimi):
     «paragraf 20 problem 15» → yalnız paragraf yazılıyor, «problem 15» sessizce düşüyordu; «mat 35 türkçe 40 soru
     çözdüm» → matematik 35 kayboluyordu. Sayının ardından yeni bir sayaç ya da ders adı gelirse parça orada bölünür;
     sayaç sözü olmayan sol parça cümledeki «soru»yu alır. */
  const KW = '(?:paragraf|problem|türkçe|turkce|matematik|mat|geometri|fizik|kimya|biyoloji|tarih|coğrafya|cografya|felsefe)';
  const ARKA = new RegExp('(\\d+)\\s+(?=' + KW + '\\b)', 'gi');
  const AD_SAYI = new RegExp('^\\D*' + KW + '\\D*\\d+$', 'i');     // «paragraf 20», «mat 35»: önce ad, sonra sayı
  function arkaArkaya(p){
    const t = String(p), out = [];
    let bas = 0, m;
    ARKA.lastIndex = 0;
    while((m = ARKA.exec(t))){
      const son = m.index + m[1].length, sol = t.slice(bas, son).trim();
      if(AD_SAYI.test(sol)){ out.push(sol); bas = son; }
    }
    if(!out.length) return [p];
    out.push(t.slice(bas).trim());
    const soruVar = /soru/i.test(t);
    return out.filter(Boolean).map(x => (soruVar && !/soru|paragraf|problem/i.test(x) && /\d/.test(x)) ? x + ' soru' : x);
  }

  /* Çözülen her yan cümle için bir katalog eylemi. */
  function toAction(p, date){
    if(!p) return null;
    if(p.kind === 'uyku')     return { action:'uyku-yaz', params:{ hours:p.hours, date } };
    if(p.kind === 'paragraf') return { action:'paragraf-yaz', params:{ count:p.count, date } };
    if(p.kind === 'problem')  return { action:'problem-yaz', params:{ count:p.count, date } };
    if(p.kind === 'sure')     return { action:'sure-yaz',
      params:{ minutes:p.minutes, subjectId:p.subject ? p.subject.id : null, date } };
    if(p.kind === 'soru')     return { action:'soru-yaz', bosVarsayim:!!p.bosVarsayim,
      params:{ count:p.count, correct:p.correct,
        subjectId:p.subject ? p.subject.id : null,
        topicId:p.topic ? p.topic.id : null, date } };
    return null;
  }

  /* Serbest cümleden öneri üretir — MODEL GEREKMEZ.

     `anlasilmayan` kural motorunun çözemediği yan cümleleri taşır.
     Bunlar sessizce düşmez: kullanıcıya gösterilir.

     `engellenen` sayısı bulunmuş ama ÖLÇÜM OLMAYAN parçalardır:
     «40 soru çözmedim», «yarın 40 soru çözeceğim» (belgeler/ekip/HATALAR.md KR-1).
     Her biri nedenini ve kullanıcıya sorulacak cümleyi taşır; yazılmaz. */
  function fromText(text, opts){
    const o = opts || {};
    const date = o.date || U.todayISO();
    const ts = parseSoru(text);
    if(ts && ts.tutarsiz) return { deneme:true, oneriler:[], anlasilmayan:[], engellenen:[{ metin:String(text).trim(),
      soru:ts.dogru + ' doğru + ' + ts.yanlis + ' yanlış' + (ts.bos ? ' + ' + ts.bos + ' boş' : '') + ' = ' + (ts.dogru + ts.yanlis + (ts.bos || 0)) + '; çözülen ' + ts.count + ' soruyu geçiyor. Hangisi yanlış yazıldı? Düzeltip yeniden yazarsan kaydederim.' }] };
    const dn = parseDeneme(text);
    if(dn){
      const metin = String(text).trim();
      const e = dn.engel || (LIFEOS.Olumsuz && LIFEOS.Olumsuz.olcumEngeli(text));
      if(e) return { deneme:true, oneriler:[], anlasilmayan:[], engellenen:[Object.assign({ metin, deneme:true }, e)] };
      return { deneme:true, anlasilmayan:[], engellenen:[], oneriler:[{ action:'deneme-yaz', kaynak:'rules', metin,
        params:{ date, family:dn.aile, testler:dn.testler.map(x => [x.ad, x.d, x.y, x.b == null ? '' : x.b].join(':')).join(';') } }] };
    }
    const parcalar = [].concat.apply([], yanCumleler(text).map(arkaArkaya));
    const oneriler = [], anlasilmayan = [], engellenen = [];

    function dene(p){
      const a = toAction(parseOne(p), date);
      if(!a) return null;
      const e = LIFEOS.Olumsuz.olcumEngeli(p);
      return e ? { engel:Object.assign({ metin:String(p).trim() }, e) } : { a };
    }

    parcalar.forEach(p => {
      const r = dene(p);
      if(!r) anlasilmayan.push(p);
      else if(r.engel) engellenen.push(r.engel);
      else oneriler.push(Object.assign(r.a, { kaynak:'rules', metin:p }));
    });

    /* Hiçbir parça anlaşılmadıysa cümlenin TAMAMINI bir kez dene:
       bölme yanlış yerden olmuş olabilir. */
    if(!oneriler.length && !engellenen.length && parcalar.length > 1){
      const r = dene(text);
      if(r && r.engel) return { oneriler:[], anlasilmayan:[], engellenen:[r.engel] };
      if(r) return { oneriler:[Object.assign(r.a, { kaynak:'rules', metin:String(text).trim() })],
        anlasilmayan:[], engellenen:[] };
    }
    return { oneriler, anlasilmayan, engellenen };
  }

  return { fromText, parseOne, parseDeneme, yanCumleler, dersBul, konuBul, sayi, ilkSayi,
    parseSoru, parseUyku, parseParagraf, parseProblem, parseSure, sureOku };
})();
