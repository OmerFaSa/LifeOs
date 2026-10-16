/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/king.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* KING — her yerden sade sohbet (Apple Intelligence gibi).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/king.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `king.css`.
   ==================================================================

   Depo sahibi (2026-10-05): «her bölümden, her yerden bir şey yaparak King
   ile Apple Intelligence gibi konuşabilelim, çok sade minimalist; konuşma
   başlayınca kenarlardan çok hafif ışık süzülmesi; konuşmayı hissettiren
   bir baloncuk; şu sayfaya git, şu verileri gir, bana bugünün özeti gibi;
   hazır cevaplar — antrenman yapacağım, besin gireceğim, test çözeceğim,
   dil çalışacağım — tıklayınca kolay gelsin deyip o sayfaya atsın».

   NASIL AÇILIR: masaüstünde Ctrl'e iki kez basmak ya da kenardaki «King»;
   telefonda «+» › «King'e sor» ya da «+»ya basılı tutmak. Esc kapatır.

   Sözler:
   1. KURAL MOTORU KONUŞUR (AGENTS §1.1). Bu dosyada dil modeli yok:
      nereye gidileceğine, neyin kaydedileceğine ve özetteki sayılara kod
      karar verir; King yalnız kısa cümle kurar. Sohbet HKM'deki King'le
      yapılır (söz 6); orada da sayıyı kod üretir, model cümleye çevirir.
   2. ANLAŞILMAYAN İSTEK TAHMİN EDİLMEZ (§1.7): «anlayamadım» der ve neler
      yapabildiğini gösterir; rastgele bir sayfaya götürmez.
   3. VERİ ÖNCE ÖNİZLENİR: satır modülün KENDİ ayrıştırıcısına gider (SPİ:
      SP.Quick); kayıt yalnız «Kaydet»le. Yeni ayrıştırıcı yazılmaz.
   4. MODÜL ONSUZ DA ÇALIŞIR: King yalnız bir giriş yoludur; modül King'e,
      King de HKM'ye bağlı değildir: HKM kapalıysa, yavaşsa ya da modeli
      yoksa yerel King aynen sürer ve nedenini söyler.
   5. ADRES YALNIZ KATALOGDAN: modüller arası geçişte hedef `#king=<rota>`
      ile taşınır; katalogda olmayan rota yok sayılır.
   6. HKM'DEKİ KING İLE AYNI KONUŞMA (depo sahibi, 2026-10-06: «kingle
      konuşurken HKM'deki kingle konuşur gibi olacak, o AI kısmında»). HKM
      bağlıyken (modülün HKM işareti; bağın sahibi bu profil) sorular, özet
      ve yerelde anlaşılmayan her şey HKM'nin King'ine gider (/api/chat,
      agent king). Geçmişi HKM tutar: modülden konuşmak oradaki konuşmanın
      devamıdır. Yerelde kalan: «… git/aç» komutu, niyet cümlesi («antrenman
      yapacağım») ve kayıt önizlemesi — HKM modüle yazmaz (§1.4). Soru
      cümlesi, içinde sayfa adına benzeyen bir sözcük var diye sayfaya
      götürülmez.
   7. SES (depo sahibi, 2026-10-15: «ücretsiz ve uğraştırmadan King'i Apple
      Intelligence'a benzet, daha eylemsel, daha profesyonel»). Mikrofonla
      konuşulur, sesle sorulana sesle cevap verilir; kenar ışığı dinlerken
      ve konuşurken nabız gibi atar. Kurulum yok, ücret yok: tanıma ve ses
      tarayıcının kendisinindir. Seslendirmede yalnız CİHAZDAKİ Türkçe ses
      kullanılır; buluttaki «Online» sesler seçilmez (cevabın metni hiçbir
      şirkete gitmez). Tanımayı tarayıcı yapar; Chrome bunu kendi
      sunucusunda yapar, düğmenin açıklaması bunu söyler. Ses yoksa ya da
      izin verilmezse King yazıyla aynen sürer; ses BİLGİ taşımaz.
   8. SOHBETTE KALIR (depo sahibi, 2026-10-16: «King'e "fasulye yiyeceğim bir
      tabak" yazınca afiyet olsun desin, sohbet etsin, sonda "verilere
      ekleyeyim mi?" diye sorsun; yalnız yemek değil bütün sistemler; sohbette
      kalalım»). Veri cümlesine önce insan gibi karşılık verilir (yemekte
      «Afiyet olsun», antrenmanda «Eline sağlık», çalışmada «Kolay gelsin»),
      sonra önizleme ve «… ekleyeyim mi?». Cevap düğmeyle ya da yazıyla
      («evet», «ekle», «hayır») verilir; kayıttan sonra King açık kalır.
      Gelecek zamanlı cümle («yiyeceğim») kendiliğinden ölçüm olmaz
      (olumsuz.js, KR-1): King fiili çıkarıp kalanını modülün ayrıştırıcısına
      verir ve YALNIZ sorarak, «evet» denirse yazar. Olumsuz cümle («yemedim»)
      hiç yazılmaz. Niyet cümlesi («antrenman yapacağım») sayfaya kendiliğinden
      götürmez: sohbet cümlesi ve «açayım mı?»; açık «… git/aç» komutu ve hazır
      cevap çipi doğrudan gider. Karşılık cümleleri sabit bir tablodur
      (SOHBET); sayı ve karar yine modülün kodundadır. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.KING = (function(){
  'use strict';

  const L = window.LIFEOS;
  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };

  /* Sayfalar: «şu sayfaya git». es = aranan sözcükler (küçük harf). */
  const SAYFALAR = [
    { modul:'spi', route:'today',     ad:'Bugün',      es:['bugün', 'genel bakış', 'ölçüm'] },
    { modul:'spi', route:'meals',     ad:'Öğün',       es:['öğün', 'besin', 'yemek', 'beslenme'] },
    { modul:'spi', route:'kitchen',   ad:'Mutfak',     es:['mutfak', 'tarif'] },
    { modul:'spi', route:'move',      ad:'Hareket',    es:['hareket', 'antrenman', 'egzersiz', 'spor'] },
    { modul:'spi', route:'labs',      ad:'Testler',    es:['tahlil', 'kan testi', 'laboratuvar', 'testler'] },
    { modul:'spi', route:'basket',    ad:'Bütçe',      es:['bütçe', 'market', 'sepet'] },
    { modul:'ays', route:'today',     ad:'Bugün',      es:['bugün', 'genel bakış'] },
    { modul:'ays', route:'week',      ad:'Hafta',      es:['hafta'] },
    { modul:'ays', route:'plan',      ad:'Program',    es:['program'] },
    { modul:'ays', route:'subjects',  ad:'Konu çalış', es:['konu', 'ders'] },
    { modul:'ays', route:'solve',     ad:'Soru çöz',   es:['soru çöz', 'soru', 'test çöz'] },
    { modul:'ays', route:'exams',     ad:'Deneme',     es:['deneme', 'sınav'] },
    { modul:'ays', route:'cards',     ad:'Tekrar',     es:['tekrar', 'kart'] },
    { modul:'ays', route:'progress',  ad:'İlerleme',   es:['ilerleme'] },
    { modul:'esp', route:'today',     ad:'Bugün',      es:['bugün', 'genel bakış'] },
    { modul:'esp', route:'lang',      ad:'Dil',        es:['dil', 'ingilizce', 'almanca', 'kelime'] },
    { modul:'esp', route:'library',   ad:'Okuma',      es:['okuma', 'kitap'] },
    { modul:'esp', route:'writing',   ad:'Yazı',       es:['yazı', 'yazma'] },
    { modul:'esp', route:'symposium', ad:'Felsefe',    es:['felsefe'] },
    { modul:'esp', route:'history',   ad:'Tarih',      es:['tarih'] },
    { modul:'esp', route:'studio',    ad:'Ses',        es:['müzik', 'diksiyon'] },
  ];

  /* Hazır cevaplar — kullanıcının örnekleri, sırasıyla. */
  const HAZIR = [
    { ad:'Antrenman yapacağım', modul:'spi', route:'move', ek:{ sekme:'kuvvet' }, cevap:'Kolay gelsin.' },
    { ad:'Besin gireceğim',     modul:'spi', route:'meals', cevap:'Afiyet olsun.' },
    { ad:'Test çözeceğim',      modul:'ays', route:'solve', cevap:'Kolay gelsin.' },
    { ad:'Dil çalışacağım',     modul:'esp', route:'lang',  cevap:'Kolay gelsin.' },
    { ad:'Bugünün özeti',       ozet:true },
  ];

  /* Serbest yazıdan niyet: ilk eşleşen kazanır (sıra önemli). Türkçe
     harflerde \b çalışmaz: sözcük başı (^|\s) ile aranır. */
  const B = '(?:^|\\s)';
  const NIYET = [
    { es:new RegExp(B + '(tahlil|kan testi|laboratuvar)'), modul:'spi', route:'labs', cevap:'Tamam.' },
    { es:new RegExp(B + '(antrenman|egzersiz|idman|spor|ağırlık|kuvvet)'), modul:'spi', route:'move', ek:{ sekme:'kuvvet' }, cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(koş|yürüyüş|bisiklet|kardiyo)'), modul:'spi', route:'move', ek:{ sekme:'kardiyo' }, cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(besin|yemek|öğün|kahvaltı|yedim|yiyeceğim)'), modul:'spi', route:'meals', cevap:'Afiyet olsun.' },
    { es:new RegExp(B + '(deneme)'), modul:'ays', route:'exams', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(test|soru)'), modul:'ays', route:'solve', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(konu|ders)'), modul:'ays', route:'subjects', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(tekrar|kart)'), modul:'ays', route:'cards', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(dil|ingilizce|almanca|fransızca|kelime)'), modul:'esp', route:'lang', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(kitap|okuma|okuyacağım)'), modul:'esp', route:'library', cevap:'Keyifli okumalar.' },
    { es:new RegExp(B + '(yazı|yazacağım)'), modul:'esp', route:'writing', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(felsefe)'), modul:'esp', route:'symposium', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(müzik|diksiyon)'), modul:'esp', route:'studio', cevap:'Kolay gelsin.' },
  ];

  const ortam = {
    git:url => { window.location.href = url; },
    zamanla:(fn, ms) => setTimeout(fn, ms),
    simdi:() => new Date(),
    hash:() => (typeof location !== 'undefined' ? location.hash : ''),
    hashSil:() => { try{ history.replaceState(null, '', location.pathname + location.search); }catch(e){ /* eski tarayıcı */ } },
    adres:k => (L.KABUK && L.KABUK.adres ? L.KABUK.adres(k) : null),
    fetch:(u, o) => fetch(u, o),
    /* Ses (söz 7). Testler sahte tanıma ve sentez koyar. */
    tanima:() => (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null,
    sentez:() => (typeof window !== 'undefined' && window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function')
      ? window.speechSynthesis : null,
    soz:m => new window.SpeechSynthesisUtterance(m),
  };
  /* HKM'deki King'in modelli cevabı yerel modelde saniyeler sürebilir. */
  const MERKEZ_ZAMAN_ASIMI = 60000;

  let ayar = null;           // { modul, git(route, ek), ozet(), veri:{ onizle(metin) }, hkm() → Beacon }
  let acik = false;
  let akis = [];             // [{ kim:'king'|'sen', metin, satirlar? }]
  let cipler = null;         // null = hazır cevaplar; ya da [{ ad, is }]
  let bekleyen = null;       // veri önizlemesi
  let bekleyenGit = null;    // «açayım mı?» diye sorulan sayfa (söz 8)
  let sesli = false;         // son istek sesle geldiyse cevap da sesle (söz 7)
  let dinleyen = null;       // çalışan tanıma oturumu
  let konusuyor = 0;         // okunmayı bekleyen parça sayısı

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

  /* ------------------------------------------------------- anlama */

  function sayfaBul(t){
    let en = null, uzun = 0;
    SAYFALAR.forEach(s => s.es.forEach(e => {
      if(!new RegExp(B + e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(t)) return;
      const puan = e.length + (ayar && s.modul === ayar.modul ? 0.5 : 0);   // eşitlikte bulunulan modül
      if(puan > uzun){ uzun = puan; en = s; }
    }));
    return en;
  }

  /* Metin → ne yapılacak. Saf: depoya, ekrana dokunmaz (testler sınar). */
  function yorumla(metin){
    const t = kucuk(metin);
    if(!t) return { tur:'bos' };
    if(/(özet|nasıl gid|bugün ne|durumum|durum ne)/.test(t)) return { tur:'ozet' };
    /* «notlarım», «notlarımı aç», «bütün notlar»: ortak Notlarım paneli (notum.js). */
    if(/^(bütün |tüm )?notlar(ım|ımı|ımı aç|ımı göster)?( aç| göster)?$/.test(t) && L.NOTUM && L.NOTUM.kuruluMu && L.NOTUM.kuruluMu()) return { tur:'notlar' };
    const gitMi = new RegExp(B + '(git|aç|götür|geç|gidelim)').test(t);
    if(gitMi){
      const s = sayfaBul(t);
      if(s) return { tur:'git', hedef:s, cevap:'Tamam.', kaynak:'komut' };
    }
    /* Veri kapısı: modülün verdiği, yoksa ortak giriş kapısı (giris.js). */
    const veri = ayar && ayar.veri && typeof ayar.veri.onizle === 'function' ? ayar.veri
      : (L.GIRIS && L.GIRIS.kaynak ? L.GIRIS.kaynak() : null);
    if(veri){
      const dene = m => { try{ return veri.onizle(String(m).trim()); }catch(e){ return null; } };
      const g = gelecekMi(metin);
      let p = dene(metin);
      /* Söz 8: «fasulye yiyeceğim bir tabak» — fiil çıkar, kalanı anlaşılır mı? */
      if(!p && g){ const t2 = gelecekSiz(metin); if(t2) p = dene(t2); }
      if(p) return { tur:'veri', onizleme:p, gelecek:!!g, sohbet:sohbet(p, metin, !!g) };
    }
    for(const n of NIYET){
      if(n.es.test(t)) return { tur:'git', hedef:n, cevap:n.cevap, kaynak:'niyet' };
    }
    const s = sayfaBul(t);
    if(s) return { tur:'git', hedef:s, cevap:'Tamam.', kaynak:'sayfa' };
    return { tur:'bilinmiyor' };
  }

  /* ------------------------------------------------------- sohbet (söz 8) */

  /* Gelecek zaman: olumsuz.js'in kapısı söyler; başka engel varsa (olumsuz,
     soru, belirsiz) gelecek sayılmaz, cümle olduğu gibi kalır. */
  function gelecekMi(metin){
    const O = L.Olumsuz;
    if(!O || !O.olcumEngeli) return null;
    const e = O.olcumEngeli(String(metin || ''));
    return e && e.neden === 'gelecek' ? e : null;
  }
  const yalin = w => kucuk(w).replace(/[.,!?;:]+/g, '');
  function gelecekSiz(metin){
    let t = String(metin || '');
    for(let i = 0; i < 3; i++){
      const e = gelecekMi(t);
      if(!e) break;
      const k = yalin(e.kelime);
      if(!k) return null;
      t = t.split(/\s+/).filter(w => yalin(w) !== k).join(' ');
    }
    if(L.Olumsuz && L.Olumsuz.olcumEngeli(t)) return null;   // başka bir engel kaldıysa yazılmaz
    return t.trim() || null;
  }

  /* Karşılık tablosu. tur modülün önizlemesinden gelir (p.tur); yoksa
     cümleden tahmin edilir. Seçim cümleye göre sabittir (aynı cümle, aynı
     karşılık): rastgele değil, testle sınanır. */
  const SOHBET = {
    ogun:    { gecti:['Afiyet olsun!', 'Afiyet şeker olsun!'], gelecek:['Şimdiden afiyet olsun!'], soru:'Öğünlerine ekleyeyim mi?' },
    su:      { gecti:['Afiyet olsun!'], gelecek:['Afiyet olsun!'], soru:'Bugünün suyuna ekleyeyim mi?' },
    hareket: { gecti:['Eline sağlık, helal olsun!', 'Eline sağlık, güzel iş!'], gelecek:['Kolay gelsin, iyi antrenmanlar!'], soru:'Antrenmanlarına ekleyeyim mi?' },
    uyku:    { gecti:['Günaydın! Uykunu not edelim.', 'Tamam, uykunu not edelim.'], gelecek:['İyi uykular!'], soru:'Uyku kaydına ekleyeyim mi?' },
    olcum:   { gecti:['Tamam, gördüm.'], gelecek:['Tamam.'], soru:'Günlük ölçümüne ekleyeyim mi?' },
    tahlil:  { gecti:['Geçmiş olsun, sonuçları gördüm.'], gelecek:['Tamam.'], soru:'Tahlillerine ekleyeyim mi?' },
    calisma: { gecti:['Eline sağlık, emeğine sağlık!', 'Helal olsun, güzel çalışma!'], gelecek:['Kolay gelsin, başarılar!'], soru:'Çalışma kaydına ekleyeyim mi?' },
    oturum:  { gecti:['Eline sağlık, güzel çalışma!', 'Emeğine sağlık!'], gelecek:['Kolay gelsin, keyifli çalışmalar!'], soru:'Bugünün oturumlarına ekleyeyim mi?' },
    not:     { gecti:['Güzel bir not.'], gelecek:['Güzel bir not.'], soru:'Notlarına ekleyeyim mi?' },
    veri:    { gecti:['Eline sağlık!'], gelecek:['Kolay gelsin!'], soru:'Verilerine ekleyeyim mi?' },
  };
  function turTahmin(t){
    if(/(ye(dim|di|yeceğim|rim)|iç(tim|eceğim)|kahvaltı|öğle yemeği|akşam yemeği|yemek|tabak|porsiyon)/.test(t)) return 'ogun';
    if(/(uyu(dum|yacağım)|uyku)/.test(t)) return 'uyku';
    if(/(koş|yürü|antrenman|idman|spor|egzersiz|bisiklet|yüz(düm|eceğim))/.test(t)) return 'hareket';
    if(/(soru|paragraf|problem|deneme|ders|konu)/.test(t)) return 'calisma';
    return 'veri';
  }
  function sohbet(p, metin, gelecek){
    const tur = SOHBET[p && p.tur] ? p.tur : turTahmin(kucuk(metin));
    const s = SOHBET[tur] || SOHBET.veri;
    const l = gelecek ? s.gelecek : s.gecti;
    let h = 0;
    String(metin || '').split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) >>> 0; });
    return { tur, selam:l[h % l.length], soru:s.soru };
  }
  const EVET = /^(evet|ekle|ekleyebilirsin|olur|tamam|kaydet|yaz|ok|okey|aç|açabilirsin|e|tabii|tabi|lütfen)( |$|[.,!])/;
  const HAYIR = /^(hayır|hayir|yok|vazgeç|gerek yok|ekleme|istemem|boşver|boş ver|açma|sonra)( |$|[.,!])/;

  /* Soru cümlesi mi (soru işareti ya da soru sözcüğü/eki)? Sözcük başı (^|\s). */
  const SORU = new RegExp('\\?|' + B + '(ne|neden|niye|nasıl|hangi|kaç|kim|nerede|nereye|niçin|m[ıiuü](?:s[ıiuü]n(?:[ıiuü]z)?|y[ıiuü][mz]|d[ıiuü]r)?)(?=$|\\s|[.,!])');
  function soruMu(t){ return SORU.test(kucuk(t)); }

  /* ------------------------------------------------------- HKM'deki King (söz 6) */

  function baglanti(){
    const b = ayar && ayar.hkm ? ayar.hkm() : null;
    if(!b || typeof b.settings !== 'function') return null;
    const a = b.settings() || {};
    if(!a.enabled || !a.token || !(b.urlOk ? b.urlOk(a.url) : a.url)) return null;
    return { url:String(a.url).replace(/\/$/, ''), token:a.token };
  }
  function bugunISO(){
    const d = ortam.simdi();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* Doner: { ok:true, text, mode } ya da { ok:false, neden:'baglanti'|'yok' }. */
  async function merkezeSor(metin){
    const k = baglanti();
    if(!k) return { ok:false, neden:'baglanti' };
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), MERKEZ_ZAMAN_ASIMI) : null;
    try{
      /* fetch bir nesnenin yöntemi olarak çağrılamaz («Illegal invocation»). */
      const f = ortam.fetch;
      const res = await f(k.url + '/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ text:String(metin).trim(), agent:'king', date:bugunISO() }),
        signal:ctrl ? ctrl.signal : undefined,
      });
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      if(res.status === 200 && g && g.ok !== false && typeof g.text === 'string' && g.text.trim()){
        return { ok:true, text:g.text.trim(), mode:g.mode || '' };
      }
      return { ok:false, neden:res.status === 200 ? 'yok' : 'baglanti' };
    }catch(e){
      return { ok:false, neden:'baglanti' };
    }finally{
      if(t) clearTimeout(t);
    }
  }

  /* ------------------------------------------------------- eylem */

  function gecerliRota(modul, route){
    return SAYFALAR.some(s => s.modul === modul && s.route === route)
      || HAZIR.some(h => h.modul === modul && h.route === route)
      || NIYET.some(n => n.modul === modul && n.route === route);
  }

  /* Aynı modülde doğrudan; ötekinde adresiyle (#king=rota[:sekme]). */
  function git(h){
    if(!ayar || !h) return false;
    if(h.modul === ayar.modul){
      kapat();
      try{ ayar.git(h.route, h.ek || {}); }catch(e){ console.error('King: git', e); }
      return true;
    }
    const url = ortam.adres(h.modul);
    if(!url){
      soyle(MODUL_AD[h.modul] + ' bu sayfadan açılamıyor; LifeOS panelinden aç.');
      return false;
    }
    ortam.git(url + '#king=' + h.route + (h.ek && h.ek.sekme ? ':' + h.ek.sekme : ''));
    return true;
  }

  function ozetSatirlari(){
    let s = [];
    try{ s = (ayar && ayar.ozet ? ayar.ozet() : []) || []; }catch(e){ s = []; }
    return (Array.isArray(s) ? s : [s]).filter(Boolean).map(String);
  }

  /* ------------------------------------------------------- ses (söz 7) */

  /* Cihazdaki en iyi Türkçe ses. Buluttaki ses (localService false,
     «Online») hiç seçilmez. Saf: testler sınar. */
  function sesSec(liste){
    const tr = (liste || []).filter(v => v && /^tr([-_]|$)/i.test(v.lang || '') && v.localService !== false
      && !/online/i.test(v.name || ''));
    if(!tr.length) return null;
    const puan = v => (/premium|enhanced|gelişmiş|natural|neural/i.test(v.name || '') ? 4 : 0)
      + (/siri|yelda/i.test(v.name || '') ? 2 : 0) + (v.default ? 1 : 0);
    return tr.slice().sort((a, b) => puan(b) - puan(a))[0];
  }
  /* Kısa parçalar: uzun metinde Chrome okumayı yarıda sessizce keser. */
  function parcala(metin){
    return String(metin || '').replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+/).reduce((l, p) => {
      if(!p) return l;
      if(l.length && (l[l.length - 1] + ' ' + p).length <= 180) l[l.length - 1] += ' ' + p; else l.push(p);
      return l;
    }, []);
  }
  function durum(){
    if(typeof document === 'undefined') return;
    const el = document.querySelector('[data-king]');
    if(!el) return;
    el.classList.toggle('is-dinliyor', !!dinleyen);
    el.classList.toggle('is-konusuyor', konusuyor > 0);
    const m = el.querySelector('.king__mik');
    if(m){
      m.classList.toggle('is-acik', !!dinleyen);
      m.setAttribute('aria-pressed', dinleyen ? 'true' : 'false');
      m.setAttribute('aria-label', dinleyen ? 'Dinlemeyi bitir' : 'Konuşarak sor');
    }
  }
  function sus(){
    const sz = ortam.sentez();
    if(sz) try{ sz.cancel(); }catch(e){ /* yok */ }
    konusuyor = 0;
    durum();
  }
  function seslendir(metin){
    const sz = ortam.sentez();
    if(!sz || !metin) return;
    try{ sz.cancel(); }catch(e){ /* yok */ }
    const ses = sesSec(sz.getVoices ? sz.getVoices() : []);
    const parcalar = parcala(metin);
    konusuyor = parcalar.length;
    parcalar.forEach(p => {
      const u = ortam.soz(p);
      u.lang = 'tr-TR';
      if(ses) u.voice = ses;
      u.rate = 1.03;
      u.onend = u.onerror = () => { konusuyor = Math.max(0, konusuyor - 1); durum(); };
      try{ sz.speak(u); }catch(e){ konusuyor = 0; }
    });
    durum();
  }

  function dinle(){
    if(dinleyen){ try{ dinleyen.stop(); }catch(e){ /* kapalı */ } return; }
    const T = ortam.tanima();
    if(!T) return;
    sus();
    let r;
    try{ r = new T(); }catch(e){ return; }
    r.lang = 'tr-TR';
    r.interimResults = true;
    r.continuous = false;
    let son = '', hata = '';
    r.onresult = e => {
      let ara = '', kesin = '';
      for(let i = 0; i < e.results.length; i++){
        const x = e.results[i];
        if(x.isFinal) kesin += x[0].transcript; else ara += x[0].transcript;
      }
      son = (kesin || ara).trim();
      const g = typeof document !== 'undefined' ? document.querySelector('.king__girdi') : null;
      if(g) g.value = (kesin + ara).trim();
    };
    r.onerror = e => { hata = (e && e.error) || 'hata'; };
    r.onend = () => {
      dinleyen = null;
      durum();
      const g = typeof document !== 'undefined' ? document.querySelector('.king__girdi') : null;
      if(son){
        if(g) g.value = '';
        sesli = true;
        isle(son);
      }else if(hata === 'not-allowed' || hata === 'service-not-allowed'){
        soyle('Mikrofon izni verilmedi. Tarayıcının adres çubuğundan izin verebilir ya da yazabilirsin.');
      }else if(hata && hata !== 'aborted'){
        soyle(hata === 'no-speech' ? 'Bir şey duyamadım. Yeniden dener misin?' : 'Ses tanınamadı; yazarak da sorabilirsin.');
      }
    };
    dinleyen = r;
    try{ r.start(); }catch(e){ dinleyen = null; }
    durum();
  }

  function soyle(metin, satirlar, onizleme, son){
    akis.forEach(m => { m.yeni = false; });
    akis.push({ kim:'king', metin, satirlar, onizleme, son, yeni:true });
    /* Söz 8: sohbet görünür kalsın; son altı satır. */
    akis = akis.slice(-6);
    ciz();
    if(sesli) seslendir([metin].concat(satirlar || [], onizleme ? [onizleme.metin] : [], son ? [son] : []).join('. ').replace(/\.\.+/g, '.').replace(/([!?])\./g, '$1'));
  }

  async function isle(metin){
    /* Söz 8: bekleyen soruya yazıyla cevap («evet», «hayır»). */
    const t0 = kucuk(metin);
    if((bekleyen || bekleyenGit) && (EVET.test(t0) || HAYIR.test(t0))){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      if(EVET.test(t0)){ if(bekleyen) await kaydet(); else gitOnayla(); }
      else vazgec();
      return { tur:EVET.test(t0) ? 'evet' : 'hayir' };
    }
    const y = yorumla(metin);
    if(y.tur === 'bos') return y;
    akis.push({ kim:'sen', metin:String(metin).trim() });
    bekleyen = null;
    bekleyenGit = null;
    cipler = null;
    /* Söz 6: soru, özet ve anlaşılmayan istek HKM'deki King'e. */
    const merkeze = !!baglanti() && (y.tur === 'bilinmiyor' || y.tur === 'ozet'
      || (y.tur === 'git' && y.kaynak !== 'komut' && soruMu(metin)));
    let neden = null;
    if(merkeze){
      const bek = { kim:'king', bekliyor:true, metin:'' };
      akis.push(bek);
      ciz(false);
      const r = await merkezeSor(metin);
      akis = akis.filter(m => m !== bek);
      if(r.ok){
        soyle(r.text);
        return { tur:'merkez', mode:r.mode };
      }
      neden = r.neden;
    }
    return yerel(y, neden);
  }

  /* Yerel King (HKM yoksa ya da cevap veremediyse; sayfa ve kayıt hep burada). */
  function yerel(y, neden){
    if(y.tur === 'notlar'){
      kapat();
      if(L.NOTUM && L.NOTUM.panelAc) L.NOTUM.panelAc();
      return y;
    }
    if(y.tur === 'ozet'){
      const s = ozetSatirlari();
      soyle(s.length ? (MODUL_AD[ayar.modul] || '') + '’de bugün:' : 'Bugün için henüz bir şey yok.', s);
    }else if(y.tur === 'git' && y.kaynak === 'niyet'){
      /* Söz 8: niyet cümlesi sayfaya kendiliğinden götürmez; sohbette sorar. */
      const s = SAYFALAR.find(x => x.modul === y.hedef.modul && x.route === y.hedef.route);
      const yer = s ? s.ad + (y.hedef.modul !== (ayar && ayar.modul) ? ' (' + MODUL_AD[y.hedef.modul] + ')' : '') : 'sayfayı';
      bekleyenGit = y.hedef;
      cipler = [{ ad:(s ? s.ad : 'Sayfa') + ' aç', is:'git-onay' }, { ad:'Gerek yok', is:'vazgec' }];
      soyle((y.cevap || 'Kolay gelsin.').replace(/\.$/, '!'), null, null, 'İstersen ' + yer + ' açayım; yaptıktan sonra yazarsan da kaydederim.');
    }else if(y.tur === 'git'){
      soyle(eylemCumlesi(y.hedef, y.cevap));
      ortam.zamanla(() => git(y.hedef), sesli ? 1100 : 650);
    }else if(y.tur === 'veri'){
      bekleyen = y.onizleme;
      const s = y.sohbet || sohbet(y.onizleme, '', !!y.gelecek);
      cipler = [{ ad:'Evet, ekle', is:'kaydet' }, { ad:'Hayır', is:'vazgec' }];
      soyle(s.selam, null,
        { metin:y.onizleme.metin, ipucu:y.gelecek ? 'Henüz yapmadıysan, yaptıktan sonra da söyleyebilirsin.' : (y.onizleme.ipucu || '') },
        s.soru);
    }else{
      const on = neden === 'yok' ? 'King’in modeli şu an kapalı. '
        : neden === 'baglanti' ? 'Merkeze (HKM) şu an ulaşılamadı. ' : '';
      soyle(on + 'Bunu anlayamadım. Şunlardan birini seçebilir ya da «hareket sayfasına git», «uyku 7», '
        + '«bugünün özeti» gibi yazabilirsin.');
    }
    return y;
  }

  async function kaydet(){
    const p = bekleyen;
    bekleyen = null;
    cipler = null;
    if(!p) return;
    try{
      const r = await p.kaydet();
      const m = String((r && String(r)) || 'Ekledim').trim().replace(/[.!]*$/, '.');
      soyle(m + ' Başka bir şey var mı?');
    }catch(e){
      soyle('Kaydedilemedi: ' + ((e && e.message) || 'bilinmeyen hata'));
    }
  }

  function vazgec(){
    const git0 = !!bekleyenGit;
    bekleyen = null; bekleyenGit = null; cipler = null;
    soyle(git0 ? 'Tamam, buradayım.' : 'Tamam, eklemedim.');
  }
  function gitOnayla(){
    const h = bekleyenGit;
    bekleyenGit = null; cipler = null;
    if(!h) return;
    soyle(eylemCumlesi(h, 'Tamam.'));
    ortam.zamanla(() => git(h), sesli ? 1100 : 650);
  }

  function hazirSec(i){
    const h = HAZIR[i];
    if(!h) return;
    akis.push({ kim:'sen', metin:h.ad });
    if(h.ozet){ cipler = null; const s = ozetSatirlari(); soyle(s.length ? (MODUL_AD[ayar.modul] || '') + '’de bugün:' : 'Bugün için henüz bir şey yok.', s); return; }
    soyle(eylemCumlesi(h, h.cevap));
    ortam.zamanla(() => git(h), sesli ? 1100 : 650);
  }

  /* «Kolay gelsin. Hareket’i açıyorum.» — ne yapılacağını söyler (eylemsel). */
  function eylemCumlesi(h, cevap){
    const s = h && SAYFALAR.find(x => x.modul === h.modul && x.route === h.route);
    const yer = s ? s.ad + (h.modul !== (ayar && ayar.modul) ? ' (' + MODUL_AD[h.modul] + ')' : '') : '';
    return (cevap || 'Kolay gelsin.') + (yer ? ' ' + yer + ' açılıyor.' : '');
  }

  /* ------------------------------------------------------- görünüm */

  /* HİTAP (hesap › Profil, 2026-10-05): kullanıcı nasıl seslenilmesini
     yazdıysa öyle; yoksa görünen adı. Doğum gününde «İyi ki doğdun» —
     yalnız gerçek günde, başka hiçbir yerde. */
  function selam(){
    const t = ortam.simdi(), s = t.getHours();
    const o = (L.HESAP && L.HESAP.durum && L.HESAP.durum().oturum) || {};
    const ad = o.hitap || o.gorunen_ad || o.ad || '';
    const gun = String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    if(o.dogum_gun && o.dogum_gun === gun) return 'İyi ki doğdun' + (ad ? ' ' + ad : '') + '. Ne yapıyoruz?';
    const zaman = s < 5 ? 'İyi geceler' : s < 12 ? 'Günaydın' : s < 18 ? 'İyi günler' : 'İyi akşamlar';
    return zaman + (ad ? ' ' + ad : '') + '. Ne yapıyoruz?';
  }

  const KURE = '<span class="king__kure" aria-hidden="true"></span>';
  const NOKTA = m => '<i class="king__nokta king__nokta--' + (m || 'mer') + '" aria-hidden="true"></i>';

  /* PROFESYONEL (kullanıcı, 2026-10-05: «Apple Intelligence gibi olan King'i
     profesyonelleştir»): baloncuğun başında King ve bulunulan modül, sağda
     kapat; King'in cevabı avatar balonu değil düz yazı ve yalnız EN YENİSİ
     hafif bulanıktan netleşerek belirir; veri önizlemesi ayrı kart; hazır
     cevapta gideceği modülün noktası. */
  function govde(){
    const satirlar = akis.length ? akis : [{ kim:'king', metin:selam(), yeni:true }];
    const bas = '<div class="king__bas">' + KURE + '<b>King</b>'
      + '<span class="king__yer">' + NOKTA(ayar && ayar.modul) + kac(MODUL_AD[ayar && ayar.modul] || '') + '</span>'
      + '<button type="button" class="king__kapat" data-king="kapat" aria-label="Kapat" title="Kapat (Esc)">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>';
    const balonlar = satirlar.map(m => m.kim === 'sen'
      ? '<div class="king__balon king__balon--sen"><p>' + kac(m.metin) + '</p></div>'
      : m.bekliyor
      ? '<div class="king__balon king__balon--king is-bekliyor" role="status" aria-label="King düşünüyor">'
        + '<div class="king__dusun" aria-hidden="true"><i></i><i></i><i></i></div></div>'
      : '<div class="king__balon king__balon--king' + (m.yeni ? ' is-yeni' : '') + '"><div><p>' + kac(m.metin) + '</p>'
        + (m.onizleme
          ? '<div class="king__onizle"><span class="king__onizle-ad">Eklenecek</span><b>' + kac(m.onizleme.metin) + '</b>'
            + (m.onizleme.ipucu ? '<small>' + kac(m.onizleme.ipucu) + '</small>' : '') + '</div>'
          : (m.satirlar && m.satirlar.length ? '<ul>' + m.satirlar.map(x => '<li>' + kac(x) + '</li>').join('') + '</ul>' : ''))
        + (m.son ? '<p class="king__son">' + kac(m.son) + '</p>' : '')
        + '</div></div>').join('');
    const cip = cipler
      ? cipler.map(c => '<button type="button" class="king__cip' + (c.is === 'kaydet' ? ' king__cip--ana' : '')
          + '" data-king="' + c.is + '">' + kac(c.ad) + '</button>').join('')
      : HAZIR.map((h, i) => ({ h, i })).sort((a, b) => (a.h.ozet - b.h.ozet)
          || ((b.h.modul === (ayar && ayar.modul)) - (a.h.modul === (ayar && ayar.modul))) || a.i - b.i)
          .map(({ h, i }) => '<button type="button" class="king__cip" data-king-hazir="' + i + '">'
          + NOKTA(h.ozet ? (ayar && ayar.modul) : h.modul) + kac(h.ad) + '</button>').join('');
    const mik = ortam.tanima()
      ? '<button type="button" class="king__mik' + (dinleyen ? ' is-acik' : '') + '" data-king="dinle" aria-pressed="'
        + (dinleyen ? 'true' : 'false') + '" aria-label="' + (dinleyen ? 'Dinlemeyi bitir' : 'Konuşarak sor')
        + '" title="Konuşarak sor · tanımayı tarayıcı yapar"><svg viewBox="0 0 24 24" aria-hidden="true">'
        + '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>'
      : '';
    return bas + '<div class="king__akis" aria-live="polite">' + balonlar + '</div>'
      + '<div class="king__cipler" role="group" aria-label="Hazır cevaplar">' + cip + '</div>'
      + '<form class="king__yaz" data-king-form data-ayar-disi>'
      + '<input class="king__girdi" type="text" aria-label="King\'e yaz" placeholder="' + (dinleyen ? 'Dinliyorum…' : 'King\'e yaz ya da konuş…') + '" autocomplete="off" enterkeyhint="send"/>'
      + mik
      + '<button type="submit" class="king__gonder" aria-label="Gönder"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button></form>'
      + '<p class="king__ipucu" aria-hidden="true">' + (ortam.tanima() ? 'Mikrofona dokun ve konuş · ' : '') + 'Enter gönderir · Esc kapatır</p>';
  }

  function ciz(odak){
    if(typeof document === 'undefined') return;
    const k = document.querySelector('[data-king]');
    if(!k) return;
    const kutu = k.querySelector('.king__kutu');
    kutu.innerHTML = govde();
    const g = kutu.querySelector('.king__girdi');
    const akisEl = kutu.querySelector('.king__akis');
    if(akisEl) akisEl.scrollTop = akisEl.scrollHeight;
    akis.forEach(m => { m.yeni = false; });
    durum();
    if(odak !== false && g && !(L.KABUK && L.KABUK.telefonMu && L.KABUK.telefonMu())){
      try{ g.focus({ preventScroll:true }); }catch(e){ /* odak yok */ }
    }
  }

  function ac(){
    if(typeof document === 'undefined' || !document.body || !ayar) return;
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik()) L.KABUK.katmanKapat();
    if(acik){ const g = document.querySelector('.king__girdi'); if(g) try{ g.focus(); }catch(e){} return; }
    acik = true;
    akis = []; cipler = null; bekleyen = null; bekleyenGit = null; sesli = false;
    const el = document.createElement('div');
    el.className = 'king';
    el.setAttribute('data-king', '');
    /* Perde: arka plan hafifçe kararır (odak baloncukta); dokununca kapanır. */
    el.innerHTML = '<div class="king-perde" aria-hidden="true"></div><div class="king-isik" aria-hidden="true"></div>'
      + '<div class="king__kutu" role="dialog" aria-modal="false" aria-label="King ile konuş"></div>';
    document.body.appendChild(el);
    document.documentElement.classList.add('king-acik');
    ciz();
    /* Odak katmanı: soldaki kenar King'i açan tıkla uyanmış olabilir;
       hareketsiz ve sakin kalır (kabuk.js «sakin kenar»). */
    if(L.KABUK && typeof L.KABUK.kenarSakinlestir === 'function'){ try{ L.KABUK.kenarSakinlestir(); }catch(e){ /* kabuk yok */ } }
    /* Bir kare sonra: geçiş başlasın (ışık süzülür, baloncuk yükselir). */
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-acik')));
  }

  function kapat(){
    if(!acik || typeof document === 'undefined') return;
    acik = false;
    if(dinleyen){ try{ dinleyen.abort ? dinleyen.abort() : dinleyen.stop(); }catch(e){ /* kapalı */ } dinleyen = null; }
    /* Sayfaya giderken söylenen cümle yarıda kesilmesin; elle kapatınca susar. */
    if(!sesli) sus();
    const el = document.querySelector('[data-king]');
    if(!el) return;
    el.classList.remove('is-acik');
    el.classList.add('is-kapaniyor');
    document.documentElement.classList.remove('king-acik');
    setTimeout(() => el.remove(), 360);
  }

  /* ------------------------------------------------------- olaylar */

  let bagli = false, sonCtrl = 0, baskaTus = false, basili = null;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' && acik){ e.preventDefault(); sesli = false; kapat(); return; }
      if(e.key !== 'Control'){ baskaTus = true; return; }
      if(e.repeat) return;
      const s = Date.now();
      if(!baskaTus && s - sonCtrl < 400){ sonCtrl = 0; acik ? kapat() : ac(); return; }
      sonCtrl = s;
      baskaTus = false;
    }, true);
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      if(t.closest('[data-king-ac]')){ e.preventDefault(); e.stopPropagation(); ac(); return; }
      if(t.closest('.king-perde')){ e.preventDefault(); e.stopPropagation(); kapat(); return; }
      const k = t.closest('[data-king]');
      if(!k){ if(acik) kapat(); return; }
      const h = t.closest('[data-king-hazir]');
      if(h){ hazirSec(Number(h.getAttribute('data-king-hazir'))); return; }
      const c = t.closest('[data-king]:not(.king)');
      if(c){
        const is = c.getAttribute('data-king');
        if(is === 'kapat'){ sesli = false; kapat(); return; }
        if(is === 'dinle'){ dinle(); return; }
        if(is === 'kaydet') kaydet();
        else if(is === 'git-onay') gitOnayla();
        else if(is === 'vazgec') vazgec();
      }
    }, true);
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-form]') : null;
      if(!f) return;
      e.preventDefault();
      const g = f.querySelector('.king__girdi');
      const m = g ? g.value : '';
      if(g) g.value = '';
      sesli = false;            // yazıyla sorulana yazıyla
      sus();
      isle(m);
    });
    /* Telefonda «+»ya basılı tutmak: King. */
    document.addEventListener('pointerdown', e => {
      const p = e.target && e.target.closest ? e.target.closest('.hizliekle') : null;
      if(!p) return;
      basili = setTimeout(() => { basili = 'oldu'; ac(); }, 450);
    }, true);
    const birak = e => {
      if(basili === 'oldu'){ basili = null; if(e && e.type === 'pointerup') e.preventDefault(); return; }
      if(basili){ clearTimeout(basili); basili = null; }
    };
    document.addEventListener('pointerup', birak, true);
    document.addEventListener('pointercancel', birak, true);
    document.addEventListener('click', e => {
      if(basili === 'oldu' && e.target && e.target.closest && e.target.closest('.hizliekle')){
        e.preventDefault(); e.stopPropagation(); basili = null;
      }
    }, true);
  }

  /* Modülün tek çağrısı (app.js, model yüklendikten sonra). Başka bir
     modülden King'le gelindiyse (#king=rota[:sekme]) oraya gidilir. */
  function kur(o){
    ayar = Object.assign({ modul:'spi' }, o || {});
    bagla();
    const m = String(ortam.hash() || '').match(/^#king=([a-z]+)(?::([a-z]+))?$/);
    if(m){
      ortam.hashSil();
      if(gecerliRota(ayar.modul, m[1])){
        ortam.zamanla(() => { try{ ayar.git(m[1], m[2] ? { sekme:m[2] } : {}); }catch(e){ console.error('King:', e); } }, 60);
      }
    }
  }

  function _sifirla(){
    if(typeof document !== 'undefined'){
      const el = document.querySelector('[data-king]');
      if(el) el.remove();
      document.documentElement.classList.remove('king-acik');
    }
    ayar = null; acik = false; akis = []; cipler = null; bekleyen = null; bekleyenGit = null;
    sesli = false; dinleyen = null; konusuyor = 0;
  }

  return {
    kur, ac, kapat, yorumla, isle, hazirSec, kaydet, dinle, sesSec,
    acikMi:() => acik, akis:() => akis.slice(),
    SAYFALAR, HAZIR, _ortam:ortam, _sifirla,
  };
})();
