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

  const UYKU_RE  = /(\d+(?:[.,]\d+)?)\s*(saat|sa)\b[^.]*uyu/i;
  const PARAGRAF_RE = /(\d+|[a-zçğıöşü]+)\s*(?:tane\s*)?paragraf/i;
  const PROBLEM_RE  = /(\d+|[a-zçğıöşü]+)\s*(?:tane\s*)?problem/i;
  const SORU_RE     = /(\d+|[a-zçğıöşü]+)\s*(?:tane\s*)?soru/i;
  const DOGRU_RE    = /(\d+)\s*(?:'?[sy]i\s*)?(?:tane\s*)?(?:doğru|dogru|net)/i;
  const DAKIKA_RE   = /(\d+(?:[.,]\d+)?)\s*(dakika|dk|saat|sa)\b/i;

  function parseUyku(text){
    const m = String(text).match(UYKU_RE);
    if(!m) return null;
    const s = sayi(m[1]);
    if(s == null || s <= 0 || s > 24) return null;
    return { kind:'uyku', hours:s };
  }

  function parseParagraf(text){
    const m = String(text).match(PARAGRAF_RE);
    if(!m) return null;
    const n = sayi(m[1]);
    if(n == null || n <= 0 || n > 500) return null;
    return { kind:'paragraf', count:Math.round(n) };
  }

  function parseProblem(text){
    const m = String(text).match(PROBLEM_RE);
    if(!m) return null;
    const n = sayi(m[1]);
    if(n == null || n <= 0 || n > 500) return null;
    return { kind:'problem', count:Math.round(n) };
  }

  function parseSoru(text){
    const m = String(text).match(SORU_RE);
    if(!m) return null;
    const n = sayi(m[1]);
    if(n == null || n <= 0 || n > 1000) return null;

    const d = String(text).match(DOGRU_RE);
    let dogru = d ? sayi(d[1]) : null;
    /* Doğru sayısı çözülenden çok olamaz: yanlış okunmuştur. */
    if(dogru != null && (dogru < 0 || dogru > n)) dogru = null;

    const subject = dersBul(text);
    const konu = konuBul(text, subject);
    return {
      kind:'soru', count:Math.round(n),
      correct:dogru == null ? null : Math.round(dogru),
      subject:subject || (konu ? konu.s : null),
      topic:konu ? konu.t : null,
    };
  }

  function parseSure(text){
    /* «45 dakika matematik çalıştım» — soru sayısı yoksa süre kaydı. */
    if(SORU_RE.test(text) || PARAGRAF_RE.test(text) || PROBLEM_RE.test(text)) return null;
    if(/uyu/i.test(text)) return null;
    const m = String(text).match(DAKIKA_RE);
    if(!m) return null;
    let dk = sayi(m[1]);
    if(dk == null) return null;
    if(/^s(a|aat)?$/i.test(m[2])) dk = dk * 60;
    if(dk <= 0 || dk > 960) return null;
    const subject = dersBul(text);
    if(!subject) return null;          /* dersi bilinmeyen süre nereye yazılır? */
    return { kind:'sure', minutes:Math.round(dk), subject };
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

  function yanCumleler(text){
    return String(text || '')
      .split(AYRAC)
      .map(x => String(x || '').trim())
      .filter(x => x.length > 2);
  }

  /* Çözülen her yan cümle için bir katalog eylemi. */
  function toAction(p, date){
    if(!p) return null;
    if(p.kind === 'uyku')     return { action:'uyku-yaz', params:{ hours:p.hours, date } };
    if(p.kind === 'paragraf') return { action:'paragraf-yaz', params:{ count:p.count, date } };
    if(p.kind === 'problem')  return { action:'problem-yaz', params:{ count:p.count, date } };
    if(p.kind === 'sure')     return { action:'sure-yaz',
      params:{ minutes:p.minutes, subjectId:p.subject.id, date } };
    if(p.kind === 'soru')     return { action:'soru-yaz',
      params:{ count:p.count, correct:p.correct,
        subjectId:p.subject ? p.subject.id : null,
        topicId:p.topic ? p.topic.id : null, date } };
    return null;
  }

  /* Serbest cümleden öneri üretir — MODEL GEREKMEZ.

     `anlasilmayan` kural motorunun çözemediği yan cümleleri taşır.
     Bunlar sessizce düşmez: kullanıcıya gösterilir. */
  function fromText(text, opts){
    const o = opts || {};
    const date = o.date || U.todayISO();
    const parcalar = yanCumleler(text);
    const oneriler = [], anlasilmayan = [];

    parcalar.forEach(p => {
      const a = toAction(parseOne(p), date);
      if(a) oneriler.push(Object.assign(a, { kaynak:'rules', metin:p }));
      else anlasilmayan.push(p);
    });

    /* Hiçbir parça anlaşılmadıysa cümlenin TAMAMINI bir kez dene:
       bölme yanlış yerden olmuş olabilir. */
    if(!oneriler.length && parcalar.length > 1){
      const a = toAction(parseOne(text), date);
      if(a) return { oneriler:[Object.assign(a, { kaynak:'rules', metin:String(text).trim() })],
        anlasilmayan:[] };
    }
    return { oneriler, anlasilmayan };
  }

  return { fromText, parseOne, yanCumleler, dersBul, konuBul, sayi, ilkSayi,
    parseSoru, parseUyku, parseParagraf, parseProblem, parseSure };
})();
