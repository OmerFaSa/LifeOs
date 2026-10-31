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

  function sayi(x){
    if(x == null) return null;
    const t = String(x).trim().replace(',', '.');
    if(/^\d+(\.\d+)?$/.test(t)) return Number(t);
    const k = U.norm ? U.norm(t) : t.toLocaleLowerCase('tr-TR');
    return RAKAM[k] != null ? RAKAM[k] : null;
  }

  /* Metindeki ilk sayıyı bulur — yazıyla da olabilir. */
  const SAYI_RE = new RegExp(
    '(\\d+(?:[.,]\\d+)?|' + Object.keys(RAKAM).join('|') + ')', 'i');

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
    return s ? sayi(s[1]) : null;
  }
  const DOGRU_RE    = /(\d+)\s*(?:'?[sy]i\s*)?(?:tane\s*)?(?:doğru|dogru|net)/i;
  /* «4 yanlış», «4 yanlışım var», «2 boş» (2026-10-19, depo sahibi: «konudan
     şu kadar sorum, şu kadar yanlışım var»). Doğru söylenmemişse doğru =
     çözülen − yanlış − boş; boş söylenmemişse yok sayılır ve önizleme bunu
     AÇIKÇA yazar (bosVarsayim) — kullanıcı onaylamadan yazılmaz. */
  const YANLIS_RE   = /(\d+)\s*(?:'?[sy]?[iıuü]\s*)?(?:tane\s*)?(?:yanlış|yanlis)/i;
  const BOS_RE      = /(\d+)\s*(?:'?[sy]?[iıuü]\s*)?(?:tane\s*)?(?:boş|bos)(?![a-zçğıöşü])/i;

  /* --------------------------------------------------------- süre */

  const SAYI_PAT = '\\d+(?:[.,]\\d+)?|' + Object.keys(RAKAM).join('|');
  const YARIM_CEYREK_RE = new RegExp('\\b(yarim|ceyrek)\\s*(?:saat|sa)\\b', 'i');
  const BUCUK_RE        = new RegExp('(?:\\b(' + SAYI_PAT + ')\\s+)?bucuk\\s*(?:saat|sa)\\b', 'i');
  const BILESIK_RE      = new RegExp('(?:^|\\s)(' + SAYI_PAT + ')\\s*(?:saat|sa)\\b\\s*(?:ve\\s*)?(' + SAYI_PAT + ')\\s*(?:dakika|dk)\\b', 'i');
  const TEK_SAAT_RE     = new RegExp('(?:^|\\s)(' + SAYI_PAT + ')\\s*(?:saat|sa)\\b', 'i');
  const TEK_DK_RE       = new RegExp('(?:^|\\s)(' + SAYI_PAT + ')\\s*(?:dakika|dk)\\b', 'i');

  /* Cümledeki süreyi (dakika ve saat) okur. Tek yardımcı:
     - yarım (30 dk / 0.5 sa), çeyrek (15 dk / 0.25 sa)
     - buçuk: «7 buçuk saat» (7.5 sa / 450 dk), «bir buçuk saat» (1.5 sa / 90 dk)
     - bileşik: «7 saat 30 dk» (7.5 sa / 450 dk), «1 saat 15 dk» (75 dk)
     - tek saat: «8 saat», «7,5 saat», «2 saat»
     - tek dakika: «45 dakika», «30 dk» */
  function sureOku(text){
    if(!text) return null;
    const n = U.norm ? U.norm(text) : String(text).toLowerCase();

    const yc = n.match(YARIM_CEYREK_RE);
    if(yc){
      return yc[1].toLowerCase() === 'yarim'
        ? { minutes:30, hours:0.5 }
        : { minutes:15, hours:0.25 };
    }

    const buc = n.match(BUCUK_RE);
    if(buc){
      const s = buc[1] ? sayi(buc[1]) : 0;
      if(s == null) return null;
      const hours = s + 0.5;
      return { minutes:Math.round(hours * 60), hours };
    }

    const bil = n.match(BILESIK_RE);
    if(bil){
      const h = sayi(bil[1]);
      const m = sayi(bil[2]);
      if(h != null && m != null){
        const minutes = Math.round(h * 60 + m);
        const hours = h + m / 60;
        return { minutes, hours };
      }
    }

    const ts = n.match(TEK_SAAT_RE);
    if(ts){
      const h = sayi(ts[1]);
      if(h != null){
        return { minutes:Math.round(h * 60), hours:h };
      }
    }

    const td = n.match(TEK_DK_RE);
    if(td){
      const m = sayi(td[1]);
      if(m != null){
        const minutes = Math.round(m);
        return { minutes, hours:minutes / 60 };
      }
    }

    return null;
  }

  function parseUyku(text){
    if(!/uyu/i.test(text)) return null;
    const s = sureOku(text);
    if(!s || s.hours <= 0 || s.hours > 24) return null;
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
    if(!subject) return null;          /* dersi bilinmeyen süre nereye yazılır? */
    return { kind:'sure', minutes:Math.round(s.minutes), subject };
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

  /* Çözülen her yan cümle için bir katalog eylemi. */
  function toAction(p, date){
    if(!p) return null;
    if(p.kind === 'uyku')     return { action:'uyku-yaz', params:{ hours:p.hours, date } };
    if(p.kind === 'paragraf') return { action:'paragraf-yaz', params:{ count:p.count, date } };
    if(p.kind === 'problem')  return { action:'problem-yaz', params:{ count:p.count, date } };
    if(p.kind === 'sure')     return { action:'sure-yaz',
      params:{ minutes:p.minutes, subjectId:p.subject.id, date } };
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
    const parcalar = yanCumleler(text);
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

  return { fromText, parseOne, yanCumleler, dersBul, konuBul, sayi, ilkSayi,
    parseSoru, parseUyku, parseParagraf, parseProblem, parseSure, sureOku };
})();
