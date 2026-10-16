/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/tekgun.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* TEK GÜN — üç modülün bugünü tek çizelgede («Otopilot Gün» 1. aşama).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/tekgun.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `tekgun.css`.
   ==================================================================

   Depo sahibi (2026-10-16): «devrimsel bir güncelleme» → LifeOS günü tek
   yerden yönetsin. 1. aşama salt okunurdur: AYS'nin blokları, SPİ'nin
   saatli hatırlatmaları ve öğünleri, ESP'nin bugünkü disiplini — hangi
   modülde olursan ol aynı çizelge.

   Sözler:
     1. BLOĞU MODÜL YAZAR. Her modül bugününü KENDİ kuralıyla verir
        (`bloklar()`); bu dosya karar üretmez, yalnız dizer.
     2. SAAT UYDURULMAZ (AGENTS §1.7). Saati olan blok saatiyle, yalnız
        dilimi olan (öğle, akşam) diliminde, ikisi de olmayan «Gün içinde»
        durur. Sıralama için bile saat tahmin edilmez.
     3. ÖTEKİ MODÜL SUNUCUDAN, BAYAT OLAN GÖSTERİLMEZ. Kendi bloklar canlı;
        öteki modüllerinki hesap sunucusundan (sunucu sözü 22). Bugüne ait
        olmayan plan bugünmüş gibi çizilmez: «bugün henüz açılmadı» denir
        (AGENTS §1.2).
     4. SUNUCU YOKSA BOZULMAZ (AGENTS §1.4). Giriş yoksa ya da sunucu
        cevap vermezse ekran beklemez, hata vermez. Öteki modüllerden tek
        iş bile gelmediyse kart ÇİZİLMEZ (gizli yer tutucu): yalnız kendi
        işlerini gösteren kart, modülün kendi Bugün kartının tekrarı olurdu
        (AYS «Günün akışı»). Veri gelince kart kendiliğinden belirir.
     5. ADRES KATALOGDAN. Öteki modülün bloğuna dokunmak o modülü
        `#king=<rota>` ile açar; rota King'in sayfa kataloğunda yoksa
        modülün Bugün'ü açılır (king.js söz 5).
     6. MAHREMİYET. Modül yalnız ekranda görünmesi uygun adı yazar: SPİ
        ilaç adını YAYINLAMAZ («İlaç / takviye»). */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.TEKGUN = (function(){
  'use strict';

  const L = window.LIFEOS;
  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };
  const SIRA = ['ays', 'spi', 'esp'];
  const DILIM = [
    { id:'sabah', ad:'Sabah' }, { id:'ogle', ad:'Öğle' }, { id:'aksam', ad:'Akşam' },
    { id:'gece', ad:'Gece' }, { id:'gun', ad:'Gün içinde' },
  ];
  const TAZE_MS = 60000;
  const SURUM = 1;

  const ortam = {
    simdi:() => new Date(),
    tekGun:() => (L.HESAP && L.HESAP.tekGun) ? L.HESAP.tekGun() : Promise.resolve(null),
    girisVar:() => !!(L.HESAP && L.HESAP.durum && L.HESAP.durum().oturum),
    adres:m => (L.KABUK && L.KABUK.adres) ? L.KABUK.adres(m) : null,
    git:u => { location.href = u; },
  };

  let ayar = null;          // { modul, bloklar(), git(rota) }
  let onbellek = null;      // sunucunun son cevabı { tarih, moduller:[...] }
  let sonCekme = 0, cekiliyor = false, hata = null;

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  const SAAT_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  function iso(d){
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dk(s){ return Number(s.slice(0, 2)) * 60 + Number(s.slice(3)); }
  function dilimOf(b){
    if(b.saat && SAAT_RE.test(b.saat)){
      const m = dk(b.saat);
      return m < 720 ? 'sabah' : m < 1020 ? 'ogle' : m < 1320 ? 'aksam' : 'gece';
    }
    return DILIM.some(x => x.id === b.dilim && x.id !== 'gun') ? b.dilim : 'gun';
  }

  /* Modülün bloğu temizlenir: bilinmeyen alan düşer, saat biçimi denetlenir. */
  function temizle(b){
    if(!b || typeof b !== 'object' || !b.ad) return null;
    const durum = ['bekliyor', 'bitti', 'atlandi', 'vakti'].indexOf(b.durum) >= 0 ? b.durum : 'bekliyor';
    return {
      id:String(b.id || b.ad).slice(0, 60), ad:String(b.ad).slice(0, 80),
      alt:b.alt ? String(b.alt).slice(0, 80) : '',
      saat:SAAT_RE.test(b.saat || '') ? b.saat : null,
      dilim:typeof b.dilim === 'string' ? b.dilim : null,
      durum, rota:typeof b.rota === 'string' && /^[a-z]+$/.test(b.rota) ? b.rota : null,
    };
  }

  function kendiBloklar(){
    if(!ayar || typeof ayar.bloklar !== 'function') return [];
    let l = [];
    try{ l = ayar.bloklar() || []; }catch(e){ console.error('Tek gün: bloklar', e); l = []; }
    return l.map(temizle).filter(Boolean);
  }

  /* Hesap kancası (hesap.js `yayin()`): { metin, gun }. */
  function parca(){
    if(!ayar) return null;
    return { metin:JSON.stringify({ s:SURUM, bloklar:kendiBloklar() }), gun:iso(ortam.simdi()) };
  }

  /* SAF: kendi bloklar + sunucu cevabı → çizilecek satırlar ve notlar.
     Testler doğrudan çağırır. */
  function birlestir(kendi, sunucu, simdi, modul){
    const bugun = iso(simdi);
    const satir = [], notlar = [];
    const ekle = (m, l) => l.forEach((b, i) => satir.push(Object.assign({ modul:m, i, dl:dilimOf(b) }, b)));
    ekle(modul, (kendi || []).map(temizle).filter(Boolean));
    const gelen = (sunucu && Array.isArray(sunucu.moduller)) ? sunucu.moduller : null;
    SIRA.filter(m => m !== modul).forEach(m => {
      if(!gelen){ return; }
      const x = gelen.find(y => y.modul === m);
      if(!x){ notlar.push(MODUL_AD[m] + ' henüz plan yayınlamadı; bir kez açınca gelir.'); return; }
      if(x.bayat || x.gun !== bugun){ notlar.push(MODUL_AD[m] + ' bugün henüz açılmadı.'); return; }
      let v = null;
      try{ v = JSON.parse(x.icerik); }catch(e){ v = null; }
      const l = (v && Array.isArray(v.bloklar) ? v.bloklar : []).map(temizle).filter(Boolean);
      ekle(m, l);
    });
    const di = id => DILIM.findIndex(x => x.id === id);
    satir.sort((a, b) => (di(a.dl) - di(b.dl))
      || ((a.saat ? dk(a.saat) : 9999) - (b.saat ? dk(b.saat) : 9999))
      || (SIRA.indexOf(a.modul) - SIRA.indexOf(b.modul)) || (a.i - b.i));
    /* Sıradaki: önce saati geçmiş ve işaretlenmemiş iş (modül «vakti»
       dedi), sonra yaklaşan ilk açık saatli iş, yoksa saatsiz ilk açık iş.
       Saat uydurulmaz, yalnız var olana bakılır. */
    const n = simdi.getHours() * 60 + simdi.getMinutes();
    const acik = b => b.durum === 'bekliyor' || b.durum === 'vakti';
    let sira = satir.find(b => b.durum === 'vakti');           // saati geçti, işaretlenmedi
    if(!sira) sira = satir.find(b => acik(b) && b.saat && dk(b.saat) >= n - 30);
    if(!sira) sira = satir.find(b => acik(b) && !b.saat);
    if(sira) sira.siradaki = true;
    return { satir, notlar };
  }

  function ozetMetni(satir){
    const m = satir.map(b => b.modul).filter((v, i, l) => l.indexOf(v) === i).length;
    const bitti = satir.filter(b => b.durum === 'bitti').length;
    return satir.length ? satir.length + ' iş · ' + bitti + ' bitti' + (m > 1 ? ' · ' + m + ' modül' : '') : '';
  }

  function satirHtml(b){
    const isaret = b.durum === 'bitti' ? '✓' : b.durum === 'atlandi' ? '–' : '';
    return '<button type="button" class="tekgun__is is-' + b.durum + (b.siradaki ? ' is-siradaki' : '')
      + '" data-tekgun-git="' + kac(b.modul + '|' + (b.rota || '')) + '">'
      + '<i class="tekgun__nokta tekgun__nokta--' + b.modul + '" aria-hidden="true"></i>'
      + '<span class="tekgun__saat num">' + (b.saat ? kac(b.saat) : '') + '</span>'
      + '<span class="tekgun__ad"><b>' + kac(b.ad) + '</b>' + (b.alt ? '<small>' + kac(b.alt) + '</small>' : '') + '</span>'
      + '<span class="tekgun__mod">' + (b.siradaki ? '<em>Sıradaki</em>' : '') + kac(MODUL_AD[b.modul]) + '</span>'
      + '<span class="tekgun__isaret" aria-hidden="true">' + isaret + '</span>'
      + '<span class="sr-only">' + (b.durum === 'bitti' ? 'bitti' : b.durum === 'atlandi' ? 'atlandı' : 'açık') + '</span>'
      + '</button>';
  }

  function sonuc(){ return birlestir(kendiBloklar(), onbellek, ortam.simdi(), ayar.modul); }
  const otekiVar = r => r.satir.some(b => b.modul !== ayar.modul);

  function govdeHtml(r){
    r = r || sonuc();
    const notlar = r.notlar.slice();
    const gruplar = DILIM.map(d => ({ d, l:r.satir.filter(b => b.dl === d.id) })).filter(g => g.l.length);
    return '<div class="tekgun__bas"><h2 class="tekgun__baslik">Tek gün</h2><span class="tekgun__ozet">' + kac(ozetMetni(r.satir)) + '</span></div>'
      + (gruplar.length
        ? gruplar.map(g => '<div class="tekgun__grup"><div class="tekgun__dilim">' + kac(g.d.ad) + '</div>'
            + g.l.map(satirHtml).join('') + '</div>').join('')
        : '<p class="tekgun__bos">Bugün için planlanmış bir iş yok.</p>')
      + (notlar.length ? '<p class="tekgun__not">' + notlar.map(kac).join(' ') + '</p>' : '');
  }

  /* Bugün ekranındaki kart. Kurulmadıysa boş. */
  function kartHtml(){
    if(!ayar) return '';
    bagla();
    tazeleIste();
    const r = sonuc();
    if(!otekiVar(r)) return '<section class="tekgun" data-tekgun hidden aria-label="Tek gün: bütün modüllerin bugünü"></section>';
    return '<section class="' + sinif(r) + '" data-tekgun aria-label="Tek gün: bütün modüllerin bugünü">' + govdeHtml(r) + '</section>';
  }
  const sinif = r => 'tekgun' + (r.satir.some(b => b.saat) ? '' : ' tekgun--saatsiz');

  function yerindeCiz(){
    if(typeof document === 'undefined' || !ayar) return;
    const r = sonuc(), var_ = otekiVar(r);
    document.querySelectorAll('[data-tekgun]').forEach(el => {
      el.hidden = !var_;
      el.className = sinif(r);
      el.innerHTML = var_ ? govdeHtml(r) : '';
    });
  }

  async function tazele(){
    if(!ayar || cekiliyor || !ortam.girisVar()) return onbellek;
    cekiliyor = true;
    sonCekme = Date.now();
    try{
      const v = await ortam.tekGun();
      if(v && Array.isArray(v.moduller)){ onbellek = v; hata = null; }
    }catch(e){ hata = e; }
    finally{ cekiliyor = false; }
    yerindeCiz();
    return onbellek;
  }
  function tazeleIste(){
    if(Date.now() - sonCekme < TAZE_MS) return;
    Promise.resolve().then(tazele);
  }

  function git(modul, rota){
    if(!ayar) return false;
    if(modul === ayar.modul){
      if(rota && ayar.git){ try{ ayar.git(rota); }catch(e){ console.error('Tek gün: git', e); } }
      return true;
    }
    const url = ortam.adres(modul);
    if(!url) return false;
    const K = L.KING;
    const katalogda = rota && K && Array.isArray(K.SAYFALAR) && K.SAYFALAR.some(s => s.modul === modul && s.route === rota);
    ortam.git(url + '#king=' + (katalogda ? rota : 'today'));
    return true;
  }

  let bagli = false;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('[data-tekgun-git]') : null;
      if(!b) return;
      e.preventDefault();
      const p = String(b.getAttribute('data-tekgun-git')).split('|');
      git(p[0], p[1] || null);
    });
    document.addEventListener('visibilitychange', () => { if(!document.hidden){ sonCekme = 0; tazeleIste(); } });
  }

  function kur(o){ ayar = Object.assign({ modul:'' }, o || {}); }
  function _sifirla(){ ayar = null; onbellek = null; sonCekme = 0; cekiliyor = false; hata = null; }

  return { kur, parca, kartHtml, birlestir, tazele, git, kuruluMu:() => !!ayar,
    _ortam:ortam, _sifirla, _onbellek:v => { onbellek = v; } };
})();
