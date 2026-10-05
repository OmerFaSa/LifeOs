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
   1. KURAL MOTORU KONUŞUR (AGENTS §1.1). Bu sürümde dil modeli yok:
      nereye gidileceğine, neyin kaydedileceğine ve özetteki sayılara kod
      karar verir; King yalnız kısa cümle kurar.
   2. ANLAŞILMAYAN İSTEK TAHMİN EDİLMEZ (§1.7): «anlayamadım» der ve neler
      yapabildiğini gösterir; rastgele bir sayfaya götürmez.
   3. VERİ ÖNCE ÖNİZLENİR: satır modülün KENDİ ayrıştırıcısına gider (SPİ:
      SP.Quick); kayıt yalnız «Kaydet»le. Yeni ayrıştırıcı yazılmaz.
   4. MODÜL ONSUZ DA ÇALIŞIR: King yalnız bir giriş yoludur; modül King'e,
      King de HKM'ye bağlı değildir.
   5. ADRES YALNIZ KATALOGDAN: modüller arası geçişte hedef `#king=<rota>`
      ile taşınır; katalogda olmayan rota yok sayılır. */

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
  };

  let ayar = null;           // { modul, git(route, ek), ozet(), veri:{ onizle(metin) } }
  let acik = false;
  let akis = [];             // [{ kim:'king'|'sen', metin, satirlar? }]
  let cipler = null;         // null = hazır cevaplar; ya da [{ ad, is }]
  let bekleyen = null;       // veri önizlemesi

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
    const gitMi = new RegExp(B + '(git|aç|götür|geç|gidelim)').test(t);
    if(gitMi){
      const s = sayfaBul(t);
      if(s) return { tur:'git', hedef:s, cevap:'Tamam.' };
    }
    if(ayar && ayar.veri && typeof ayar.veri.onizle === 'function'){
      let p = null;
      try{ p = ayar.veri.onizle(String(metin).trim()); }catch(e){ p = null; }
      if(p) return { tur:'veri', onizleme:p };
    }
    for(const n of NIYET){
      if(n.es.test(t)) return { tur:'git', hedef:n, cevap:n.cevap };
    }
    const s = sayfaBul(t);
    if(s) return { tur:'git', hedef:s, cevap:'Tamam.' };
    return { tur:'bilinmiyor' };
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

  function soyle(metin, satirlar, onizleme){
    akis.forEach(m => { m.yeni = false; });
    akis.push({ kim:'king', metin, satirlar, onizleme, yeni:true });
    akis = akis.slice(-4);
    ciz();
  }

  async function isle(metin){
    const y = yorumla(metin);
    if(y.tur === 'bos') return y;
    akis.push({ kim:'sen', metin:String(metin).trim() });
    bekleyen = null;
    cipler = null;
    if(y.tur === 'ozet'){
      const s = ozetSatirlari();
      soyle(s.length ? (MODUL_AD[ayar.modul] || '') + '’de bugün:' : 'Bugün için henüz bir şey yok.', s);
    }else if(y.tur === 'git'){
      soyle(y.cevap || 'Kolay gelsin.');
      ortam.zamanla(() => git(y.hedef), 650);
    }else if(y.tur === 'veri'){
      bekleyen = y.onizleme;
      cipler = [{ ad:'Kaydet', is:'kaydet' }, { ad:'Vazgeç', is:'vazgec' }];
      soyle('Şunu kaydedeyim mi?', [y.onizleme.metin + (y.onizleme.ipucu ? ' · ' + y.onizleme.ipucu : '')],
        { metin:y.onizleme.metin, ipucu:y.onizleme.ipucu || '' });
    }else{
      soyle('Bunu anlayamadım. Şunlardan birini seçebilir ya da «hareket sayfasına git», «uyku 7», '
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
      soyle((r && String(r)) || 'Kaydedildi.');
    }catch(e){
      soyle('Kaydedilemedi: ' + ((e && e.message) || 'bilinmeyen hata'));
    }
  }

  function hazirSec(i){
    const h = HAZIR[i];
    if(!h) return;
    akis.push({ kim:'sen', metin:h.ad });
    if(h.ozet){ cipler = null; const s = ozetSatirlari(); soyle(s.length ? (MODUL_AD[ayar.modul] || '') + '’de bugün:' : 'Bugün için henüz bir şey yok.', s); return; }
    soyle(h.cevap || 'Kolay gelsin.');
    ortam.zamanla(() => git(h), 650);
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
      : '<div class="king__balon king__balon--king' + (m.yeni ? ' is-yeni' : '') + '"><div><p>' + kac(m.metin) + '</p>'
        + (m.onizleme
          ? '<div class="king__onizle"><span class="king__onizle-ad">Kaydedilecek</span><b>' + kac(m.onizleme.metin) + '</b>'
            + (m.onizleme.ipucu ? '<small>' + kac(m.onizleme.ipucu) + '</small>' : '') + '</div>'
          : (m.satirlar && m.satirlar.length ? '<ul>' + m.satirlar.map(x => '<li>' + kac(x) + '</li>').join('') + '</ul>' : ''))
        + '</div></div>').join('');
    const cip = cipler
      ? cipler.map(c => '<button type="button" class="king__cip' + (c.is === 'kaydet' ? ' king__cip--ana' : '')
          + '" data-king="' + c.is + '">' + kac(c.ad) + '</button>').join('')
      : HAZIR.map((h, i) => '<button type="button" class="king__cip" data-king-hazir="' + i + '">'
          + NOKTA(h.ozet ? (ayar && ayar.modul) : h.modul) + kac(h.ad) + '</button>').join('');
    return bas + '<div class="king__akis" aria-live="polite">' + balonlar + '</div>'
      + '<div class="king__cipler" role="group" aria-label="Hazır cevaplar">' + cip + '</div>'
      + '<form class="king__yaz" data-king-form data-ayar-disi>'
      + '<input class="king__girdi" type="text" aria-label="King\'e yaz" placeholder="King\'e yaz…" autocomplete="off" enterkeyhint="send"/>'
      + '<button type="submit" class="king__gonder" aria-label="Gönder"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button></form>'
      + '<p class="king__ipucu" aria-hidden="true">Enter gönderir · Esc kapatır</p>';
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
    if(odak !== false && g && !(L.KABUK && L.KABUK.telefonMu && L.KABUK.telefonMu())){
      try{ g.focus({ preventScroll:true }); }catch(e){ /* odak yok */ }
    }
  }

  function ac(){
    if(typeof document === 'undefined' || !document.body || !ayar) return;
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik()) L.KABUK.katmanKapat();
    if(acik){ const g = document.querySelector('.king__girdi'); if(g) try{ g.focus(); }catch(e){} return; }
    acik = true;
    akis = []; cipler = null; bekleyen = null;
    const el = document.createElement('div');
    el.className = 'king';
    el.setAttribute('data-king', '');
    /* Perde: arka plan hafifçe kararır (odak baloncukta); dokununca kapanır. */
    el.innerHTML = '<div class="king-perde" aria-hidden="true"></div><div class="king-isik" aria-hidden="true"></div>'
      + '<div class="king__kutu" role="dialog" aria-modal="false" aria-label="King ile konuş"></div>';
    document.body.appendChild(el);
    document.documentElement.classList.add('king-acik');
    ciz();
    /* Bir kare sonra: geçiş başlasın (ışık süzülür, baloncuk yükselir). */
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-acik')));
  }

  function kapat(){
    if(!acik || typeof document === 'undefined') return;
    acik = false;
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
      if(e.key === 'Escape' && acik){ e.preventDefault(); kapat(); return; }
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
        if(is === 'kapat'){ kapat(); return; }
        if(is === 'kaydet') kaydet();
        else if(is === 'vazgec'){ bekleyen = null; cipler = null; soyle('Tamam, kaydetmedim.'); }
      }
    }, true);
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-form]') : null;
      if(!f) return;
      e.preventDefault();
      const g = f.querySelector('.king__girdi');
      const m = g ? g.value : '';
      if(g) g.value = '';
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
    ayar = null; acik = false; akis = []; cipler = null; bekleyen = null;
  }

  return {
    kur, ac, kapat, yorumla, isle, hazirSec, kaydet,
    acikMi:() => acik, akis:() => akis.slice(),
    SAYFALAR, HAZIR, _ortam:ortam, _sifirla,
  };
})();
