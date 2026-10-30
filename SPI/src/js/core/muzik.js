/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/muzik.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* MÜZİK — kullanıcının kendi müzik dosyaları ve listeleri, üç arayüzde aynı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/muzik.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi ses.css'te,
   testi `brand/ortak/muzik.test.js`, sunucusu `sistem/muzik.py`.
   ==================================================================

   KULLANICININ İSTEĞİ (2026-10-30)

     «Sisteme müzik ekleyebilelim, radyo gibi; yerel olarak da müzik
      koyabilelim; ders çalışırken şu liste, spor yaparken şu liste; sistem
      açılışında şu müziğin şu saniyesinden şu saniyesine kadar; sistem
      arkada açıkken şu listeden çalsın; radyonun altında müzik bölümü
      olsun, müzikleri ve listeleri görüp boşta çalan müziği susturabilelim;
      açılış müzik sesini ayarlardan ayarlayabilelim.»

   NEREDE

   Radyo panelinin altında «Müzik» bölümü (ses.js panelHtml onu çağırır):
   şimdi çalan, Çal/Durdur, Sonraki, liste çipleri, «Arka plan müziğini
   sustur». Ayrıntılı ayar Ayarlar › Ses › Müzik'te (ayarHtml): parça
   yükle, listelere ata, sil; açılış kesiti; arka plan.

   KURALLAR

   · Dosyalar ve listeler PC'deki LifeOS sunucusundadır (üç modül aynı
     listeyi görür). Sunucu yoksa (telefon, tek dosya) bölüm bunu söyler;
     hiçbir ekran bozulmaz.
   · Radyo ile müzik aynı anda çalmaz: biri başlayınca öteki durur.
   · Açılış kesiti: «Her açılışta» ya da «Günde bir» (modül başına).
     Tarayıcı kendiliğinden çalmayı reddederse kesit ilk dokunuşta çalar
     (açılıştan 15 sn içinde); sonra hiç.
   · Arka plan listesi açıksa açılıştan sonra (ya da hemen) karışık çalar;
     «Sustur» bu oturumda susturur, ayarı değiştirmez.
   · Çalışma oturumu (King odak sayacı, AYS blok sayacı) başlayınca
     «Çalışırken» listesi, bitince arka plan listesine döner (ya da durur).
     Spor için olay `lifeos:spor` aynı biçimde dinlenir. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.MUZIK = (function(){
  'use strict';

  const L = window.LIFEOS;
  const LISTELER = Object.freeze(['genel', 'calisma', 'spor', 'arka']);
  const LISTE_AD = Object.freeze({ genel:'Genel', calisma:'Çalışırken', spor:'Sporda', arka:'Arka plan' });
  const ACILIS_GUN = 'lifeos.muzik.acilis.gun';
  /* Sunucuda parça var mı (son okumadan): yoksa açılışta sunucuya hiç gidilmez
     (telefon, eski sunucu, denetim sunucusu 404 vermesin). Taşınır. */
  const VAR_ANAHTAR = 'lifeos.muzik.var';
  const kac = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  const VARSAYILAN_ORTAM = {
    sunucu:() => typeof location !== 'undefined' && /^https?:$/.test(location.protocol),
    fetch:(u, o) => fetch(u, o),
    simdi:() => new Date(),
    karistir:l => l.slice().sort(() => Math.random() - .5),
  };
  let ortam = Object.assign({}, VARSAYILAN_ORTAM);
  let dizin = null, ses = null, kuyruk = [], sira = 0, kip = null, kesitSonu = null, susturuldu = false, mesajMetni = '';

  function bos(){ return { parcalar:[], listeler:{ genel:[], calisma:[], spor:[], arka:[] },
    acilis:{ id:null, bas:0, bit:10, ses:.6, ne:'kapali' }, arka:{ acik:false, ses:.35, karistir:true } }; }
  function d(){ return dizin || bos(); }
  function parca(id){ return d().parcalar.find(p => p.id === id) || null; }
  function liste(ad){ return (d().listeler[ad] || []).filter(parca); }

  function yukle(){
    if(!ortam.sunucu()) return Promise.resolve(null);
    return ortam.fetch('/api/muzik', { cache:'no-store' }).then(r => r.ok ? r.json() : null)
      .then(v => { dizin = v || null; isaretle(); guncelle(); return dizin; }).catch(() => null);
  }
  function isaretle(){ try{ if(dizin && dizin.parcalar && dizin.parcalar.length) localStorage.setItem(VAR_ANAHTAR, '1'); else localStorage.removeItem(VAR_ANAHTAR); }catch(e){ /* depo yok */ } }
  const isaretVar = () => { try{ return localStorage.getItem(VAR_ANAHTAR) === '1'; }catch(e){ return false; } };
  function ayarKaydet(degisen){
    const v = Object.assign({ listeler:d().listeler, acilis:d().acilis, arka:d().arka }, degisen);
    return ortam.fetch('/api/muzik/ayar', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-LifeOS':'muzik' }, body:JSON.stringify(v) })
      .then(r => r.json()).then(x => { if(x && x.parcalar){ dizin = x; guncelle(true); } return x; }).catch(() => null);
  }

  /* <audio> body'ye BİR KEZ eklenir (#app her çizimde baştan kurulur). */
  function oge(){
    if(ses || typeof document === 'undefined') return ses;
    ses = document.createElement('audio');
    ses.preload = 'none';
    ses.setAttribute('aria-hidden', 'true');
    ses.addEventListener('ended', () => { if(kip === 'acilis') acilisBitti(); else sonraki(); });
    ses.addEventListener('timeupdate', () => {
      if(kesitSonu == null) return;
      const kalan = kesitSonu - ses.currentTime;
      if(kalan <= 1 && kalan > 0) ses.volume = Math.max(0, d().acilis.ses * kalan);   // son saniyede yumuşak kısılır
      if(kalan <= 0) acilisBitti();
    });
    ses.addEventListener('error', () => { mesajMetni = 'Parça çalınamadı'; if(kip && kip !== 'acilis') sonraki(); else guncelle(); });
    (document.body || document.documentElement).appendChild(ses);
    return ses;
  }
  function radyoSustur(){ try{ const h = L.SES && L.SES.durum ? L.SES.durum().hal : ''; if(h === 'caliyor' || h === 'baglaniyor' || h === 'dokun') L.SES.durdur(); }catch(e){ /* radyo yok */ } }
  function oynat(){
    const a = oge();
    if(!a) return;
    const p = a.play && a.play();
    if(p && p.catch) p.catch(() => { mesajMetni = 'Çalmak için bir yere dokun'; guncelle(); dokununca(); });
  }
  let dokunusBekliyor = false;
  function dokununca(){
    if(dokunusBekliyor || typeof document === 'undefined') return;
    dokunusBekliyor = true;
    const f = () => { dokunusBekliyor = false; document.removeEventListener('pointerdown', f, true); if(kip) oynat(); };
    document.addEventListener('pointerdown', f, true);
  }
  function hacim(){ return kip === 'arka' ? d().arka.ses : kip === 'acilis' ? d().acilis.ses : ((L.SES && L.SES.tercih && L.SES.tercih().ses) || .6); }
  function parcaCal(){
    const a = oge(), id = kuyruk[sira];
    if(!a || !id) return;
    a.src = '/api/muzik/parca/' + id;
    a.volume = hacim();
    mesajMetni = '';
    oynat();
    guncelle();
  }

  /* ad: liste adı ya da 'tek' (o.id). Döner: çaldı mı. */
  function cal(ad, o){
    const ids = ad === 'tek' ? (o && parca(o.id) ? [o.id] : []) : liste(ad);
    if(!ids.length){ mesajMetni = 'Bu listede parça yok'; guncelle(); return false; }
    radyoSustur();
    kesitSonu = null;
    kip = ad;
    kuyruk = ad === 'arka' && d().arka.karistir ? ortam.karistir(ids) : ids.slice();
    sira = 0;
    parcaCal();
    return true;
  }
  function sonraki(){
    if(!kuyruk.length) return;
    sira = (sira + 1) % kuyruk.length;
    parcaCal();
  }
  function durdur(){
    kesitSonu = null;
    kip = null;
    if(ses){ try{ ses.pause(); }catch(e){ /* yok */ } }
    guncelle();
  }

  /* Açılış kesiti. Döner: çalmaya başladı mı. dinle: Ayarlar'daki «Kesiti dinle»
     (ne/gün kuralına bakmaz, günü işaretlemez). */
  function acilisCal(dinle){
    const a = d().acilis;
    if(!a.id || (a.ne === 'kapali' && !dinle) || !parca(a.id)) return false;
    const gun = ortam.simdi().toISOString().slice(0, 10);
    if(a.ne === 'gunde' && !dinle){
      let son = null;
      try{ son = localStorage.getItem(ACILIS_GUN); }catch(e){ /* depo yok */ }
      if(son === gun) return false;
    }
    if(!dinle) try{ localStorage.setItem(ACILIS_GUN, gun); }catch(e){ /* depo yok */ }
    const s = oge();
    if(!s) return false;
    radyoSustur();
    kip = 'acilis';
    kuyruk = [a.id]; sira = 0;
    s.src = '/api/muzik/parca/' + a.id;
    s.volume = a.ses;
    kesitSonu = a.bit;
    const basla = () => { try{ s.currentTime = a.bas; }catch(e){ /* yok */ } };
    if(s.readyState >= 1) basla(); else s.addEventListener('loadedmetadata', basla, { once:true });
    oynat();
    guncelle();
    return true;
  }
  function acilisBitti(){
    kesitSonu = null;
    if(ses){ try{ ses.pause(); }catch(e){ /* yok */ } }
    kip = null;
    if(!arkaBaslat()) guncelle();
  }
  /* Arka plan videosu kendi sesiyle oynuyorsa (ve «Susar» seçiliyse) arka plan müziği beklemede kalır. */
  const videoSusturur = () => { try{ return !!(L.ZEMIN && L.ZEMIN.videoSesli && L.ZEMIN.videoSesli() && L.ZEMIN.videoAyar().muzik === 'sus'); }catch(e){ return false; } };
  let videoBekletti = false;
  function arkaBaslat(){
    if(susturuldu || !d().arka.acik || !liste('arka').length) return false;
    if(videoSusturur()){ videoBekletti = true; return false; }
    return cal('arka');
  }
  function susturAc(){
    susturuldu = !susturuldu;
    if(susturuldu && kip === 'arka') durdur();
    else if(!susturuldu && !kip) arkaBaslat();
    guncelle();
    return susturuldu;
  }

  /* Çalışma ve spor oturumu: başlayınca o liste, bitince arka plana dönüş. */
  function oturum(ad, acik){
    if(acik){ if(liste(ad).length) cal(ad); return; }
    if(kip === ad){ durdur(); arkaBaslat(); }
  }

  function durum(){
    const p = kuyruk[sira] ? parca(kuyruk[sira]) : null;
    const caliyor = !!(ses && !ses.paused && kip);
    return { kip, caliyor, parca:p ? p.ad : '', susturuldu, sunucu:ortam.sunucu(), varMi:!!d().parcalar.length };
  }

  /* -------------------------------------------------------- radyo panelinde */
  const SIMGE_CAL = '<svg class="ses__sim" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
  const SIMGE_DUR = '<svg class="ses__sim" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="7" y="6" width="3.5" height="12" rx="1"/><rect x="13.5" y="6" width="3.5" height="12" rx="1"/></svg>';
  function simdiMetni(){
    const u = durum();
    if(!u.sunucu) return 'Müzik bu bilgisayarda LifeOS açıkken çalar.';
    if(!u.varMi) return 'Henüz parça yok: Ayarlar › Ses › Müzik.';
    if(mesajMetni) return mesajMetni;
    if(u.caliyor) return (u.kip === 'acilis' ? 'Açılış: ' : LISTE_AD[u.kip] ? LISTE_AD[u.kip] + ' · ' : '') + u.parca;
    return 'Müzik durdu';
  }
  function panelHtml(){
    const u = durum();
    return '<div class="muzik" data-muzik-panel><p class="kmenu__bas">Müzik</p>'
      + '<p class="ses__simdi muzik__simdi' + (u.caliyor ? ' is-caliyor' : '') + '" role="status" aria-live="polite">' + kac(simdiMetni()) + '</p>'
      + (u.sunucu && u.varMi ? '<div class="ses__turler" role="group" aria-label="Liste">' + LISTELER.map(l => '<button type="button" class="ses__tur'
          + (u.kip === l ? ' is-on' : '') + '" data-muzik-liste="' + l + '" aria-pressed="' + (u.kip === l) + '"' + (liste(l).length ? '' : ' disabled') + '>'
          + LISTE_AD[l] + ' <small>' + liste(l).length + '</small></button>').join('') + '</div>'
        + '<div class="ses__eylem"><button type="button" class="ses__cal" data-muzik="cal">' + (u.caliyor ? SIMGE_DUR + 'Durdur' : SIMGE_CAL + 'Çal') + '</button>'
        + '<button type="button" class="ses__sonraki" data-muzik="sonraki"' + (u.caliyor ? '' : ' disabled') + '>Sonraki parça</button></div>'
        + (d().arka.acik ? '<div class="ses__satir"><span id="muzik-arka-ad">Arka plan müziği</span><button type="button" class="ses__anahtar" data-muzik="sustur" role="switch"'
          + ' aria-labelledby="muzik-arka-ad muzik-arka-deger" aria-checked="' + (!u.susturuldu) + '"><span id="muzik-arka-deger">' + (u.susturuldu ? 'Susturuldu' : 'Açık') + '</span></button></div>' : '')
        : '')
      + '</div>';
  }
  function guncelle(ayarDa){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('[data-muzik-panel]').forEach(p => { p.outerHTML = panelHtml(); });
    if(ayarDa) document.querySelectorAll('[data-muzik-ayar]').forEach(p => { p.outerHTML = ayarHtml(); });
    try{ window.dispatchEvent(new CustomEvent('lifeos:muzik', { detail:durum() })); }catch(e){ /* yok */ }
  }

  /* ------------------------------------------------------ Ayarlar › Ses › Müzik */
  /* Yeniden tasarım (kullanıcı, 2026-10-30: «ayarlardaki ses kısmında bayağı
     eksiklik, amatörlük ve tasarımda kötülük var»). Üç kart: kitaplık, açılış,
     arka plan. Sayılar kaydırıcıyla ve yanında yazıyla; kesit parçanın gerçek
     süresine göre (süre bilinmiyorsa 10 dakika sınırı). */
  const SVG = d => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  const SIMGE = {
    kitap:SVG('M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'),
    acilis:SVG('M3 18h18M6 18a6 6 0 0 1 12 0M12 4v3M4.9 8.9l2.1 2.1M19.1 8.9 17 11'),
    arka:SVG('M3 10c2 0 2-2 4.5-2S10 10 12 10s2.5-2 4.5-2S19 10 21 10M3 15c2 0 2-2 4.5-2S10 15 12 15s2.5-2 4.5-2S19 15 21 15'),
    sil:SVG('M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12'),
  };
  const kart = (simge, ad, not, govde, sag) => '<section class="skart"><header class="skart__bas"><span class="skart__simge">' + simge + '</span>'
    + '<span class="skart__baslik"><b>' + ad + '</b>' + (not ? '<small>' + not + '</small>' : '') + '</span>' + (sag || '') + '</header>'
    + '<div class="skart__govde">' + govde + '</div></section>';
  const seg = (ad, cift, simdi, veri, kapali) => '<div class="seg" role="group" aria-label="' + ad + '">' + cift.map(([v, y]) => {
    const on = String(v) === String(simdi);
    return '<button type="button" class="' + (on ? 'is-on' : '') + '" ' + veri + '="' + v + '" aria-pressed="' + on + '"' + (kapali && kapali(v) ? ' disabled' : '') + '>' + y + '</button>'; }).join('') + '</div>';
  const sureYaz = sn => { sn = Math.max(0, Math.round(sn)); return Math.floor(sn / 60) + ':' + ('0' + (sn % 60)).slice(-2); };
  const kesitYaz = a => sureYaz(a.bas) + ' – ' + sureYaz(a.bit) + ' · ' + Math.max(0, Math.round(a.bit - a.bas)) + ' sn';
  const kaydirici = (etiket, ad, deger, veri, pasif) => {
    const y = Math.round(deger * 100);
    return '<label class="skart__satir skart__kaydir' + (pasif ? ' is-pasif' : '') + '"><span class="skart__etiket">' + etiket + '</span>'
      + '<input type="range" min="0" max="100" step="1" value="' + y + '" ' + veri + ' aria-label="' + ad + '" aria-valuetext="%' + y + '" style="--dolu:' + y + '%"' + (pasif ? ' disabled' : '') + '>'
      + '<output>%' + y + '</output></label>';
  };
  /* Parçanın süresi bir kez, yalnız üst bilgiyle okunur. */
  const sureler = {};
  function sureOku(id){
    if(!id || sureler[id] != null || typeof Audio === 'undefined' || !ortam.sunucu()) return;
    sureler[id] = 0;
    try{
      const a = new Audio();
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', () => { sureler[id] = isFinite(a.duration) ? a.duration : 0; guncelle(true); }, { once:true });
      a.src = '/api/muzik/parca/' + id;
    }catch(e){ /* yok */ }
  }
  let ayarOkundu = false, seciliListe = 'genel', ayrintiAcik = false;
  const LISTE_NOT = Object.freeze({ genel:'Radyo panelindeki «Çal» bu listeyi çalar.', calisma:'Çalışma sayacı başlayınca çalar, bitince susar.',
    spor:'Spor oturumu başlayınca çalar.', arka:'Açılıştan sonra kısık sesle çalar (Arka plan müziği açıksa).' });
  function ayarHtml(){
    if(ortam.sunucu() && !dizin && !ayarOkundu){ ayarOkundu = true; setTimeout(() => yukle().then(() => guncelle(true)), 0); }   // Ayarlar › Ses açılınca bir kez
    if(!ortam.sunucu()) return '<div data-muzik-ayar><p class="ayarlar__bos">Müzik dosyaları bu bilgisayardaki LifeOS sunucusunda durur; telefonda ve tek dosya sürümünde yoktur.</p></div>';
    const x = d(), a = x.acilis, k = x.arka, u = durum();
    const ekle = '<label class="btn btn--sm skart__eylem">Müzik ekle<input type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.opus,.webm,.wav,.flac" multiple data-muzik-dosya hidden></label>';
    /* Kitaplık sade (kullanıcı, 2026-10-30: «müzikle ilgili bazı şeyler ayarlarda kullanışsız
       ve karmaşık»): üstte tek liste seçici, altta parçalar; her parçada tek «listede» anahtarı. */
    const sl = seciliListe, uyeler = x.listeler[sl] || [];
    const kitaplik = (x.parcalar.length
        ? '<div class="muzik__listeler" role="tablist" aria-label="Liste">' + LISTELER.map(l => '<button type="button" role="tab" class="muzik__sekme' + (l === sl ? ' is-on' : '') + '"'
            + ' aria-selected="' + (l === sl) + '" data-muzik-listesec="' + l + '">' + LISTE_AD[l] + '<small>' + liste(l).length + '</small></button>').join('') + '</div>'
          + '<p class="skart__not">' + LISTE_NOT[sl] + '</p>'
          + '<ul class="muzik__liste">' + x.parcalar.map(p => {
            const on = uyeler.indexOf(p.id) >= 0, calan = u.caliyor && u.parca === p.ad;
            return '<li class="muzik__parca' + (calan ? ' is-calan' : '') + '"><button type="button" class="muzik__dinle" data-muzik-tek="' + p.id + '" aria-label="' + kac(p.ad) + ' çal">' + SIMGE_CAL + '</button>'
              + '<span class="muzik__ad">' + kac(p.ad) + '</span>'
              + '<button type="button" class="muzik__uye' + (on ? ' is-on' : '') + '" role="switch" aria-checked="' + on + '" data-muzik-ata="' + sl + '|' + p.id + '"'
              + ' aria-label="' + kac(p.ad) + ', ' + LISTE_AD[sl] + ' listesinde"><i aria-hidden="true"></i></button>'
              + '<button type="button" class="muzik__sil" data-muzik-sil="' + p.id + '" aria-label="' + kac(p.ad) + ' sil">' + SIMGE.sil + '</button></li>'; }).join('') + '</ul>'
      : '<div class="skart__bos">' + SIMGE.kitap + '<b>Henüz parça yok</b><small>MP3, M4A, OGG, WAV ya da FLAC; dosyalar bu bilgisayarda kalır.</small></div>')
      + '<small class="skart__durum" data-muzik-durum role="status"></small>';
    sureOku(a.id);
    const ust = Math.min(600, Math.max(1, Math.ceil(sureler[a.id] || 600)));
    const acilis = (x.parcalar.length ? '<label class="skart__satir"><span class="skart__etiket">Parça</span><select class="ayarlar__girdi skart__secim" data-muzik-acilis="id" aria-label="Açılış parçası">'
        + '<option value="">Seçilmedi</option>' + x.parcalar.map(p => '<option value="' + p.id + '"' + (a.id === p.id ? ' selected' : '') + '>' + kac(p.ad) + '</option>').join('') + '</select></label>' : '')
      + '<div class="skart__satir"><span class="skart__etiket">Ne zaman</span>' + seg('Ne zaman', [['kapali', 'Kapalı'], ['her', 'Her açılışta'], ['gunde', 'Günde bir']], a.ne, 'data-muzik-acilis-ne', v => !a.id && v !== 'kapali') + '</div>'
      + (a.id ? '<details class="skart__ayrinti" data-muzik-ayrinti' + (ayrintiAcik ? ' open' : '') + '><summary>Kesit ve ses <small>' + kac(kesitYaz(a)) + ' · %' + Math.round(a.ses * 100) + '</small></summary>'
        + '<div class="skart__satir skart__satir--ust"><span class="skart__etiket">Kesit<small data-muzik-kesit-yazi>' + kac(kesitYaz(a)) + '</small></span><div class="skart__kesit">'
          + '<label><span>Başlangıç</span><input type="range" min="0" max="' + ust + '" step="1" value="' + Math.min(a.bas, ust) + '" data-muzik-acilis="bas" aria-label="Kesitin başlangıcı, saniye" style="--dolu:' + (Math.min(a.bas, ust) / ust * 100) + '%"></label>'
          + '<label><span>Bitiş</span><input type="range" min="1" max="' + ust + '" step="1" value="' + Math.min(a.bit, ust) + '" data-muzik-acilis="bit" aria-label="Kesitin bitişi, saniye" style="--dolu:' + (Math.min(a.bit, ust) / ust * 100) + '%"></label>'
          + '<button type="button" class="btn btn--sm btn--ghost" data-muzik="acilis-dinle">' + SIMGE_CAL + 'Kesiti dinle</button></div></div>'
        + kaydirici('Ses', 'Açılış müziğinin sesi', a.ses, 'data-muzik-acilis="ses"') + '</details>' : '')
      + (x.parcalar.length ? '' : '<p class="skart__not">Önce kitaplığa bir parça ekle.</p>');
    const arka = '<div class="skart__satir"><span class="skart__etiket">Arka plan müziği</span>' + seg('Arka plan müziği', [[false, 'Kapalı'], [true, 'Açık']], k.acik, 'data-muzik-arka') + '</div>'
      + kaydirici('Ses', 'Arka plan müziğinin sesi', k.ses, 'data-muzik-arka-ses', !k.acik)
      + '<div class="skart__satir"><span class="skart__etiket">Sıra</span>' + seg('Sıra', [[true, 'Karışık'], [false, 'Sırayla']], k.karistir, 'data-muzik-karistir') + '</div>'
      + '<p class="skart__not">' + (liste('arka').length ? 'Listede ' + liste('arka').length + ' parça. ' : 'Kitaplıkta parçalara «Arka plan» de. ')
      + 'Çalışma ya da spor başlayınca o liste çalar, bitince buraya döner; radyo ya da sesli arka plan videosu açılınca susar.</p>';
    return '<div class="skartlar" data-muzik-ayar>'
      + kart(SIMGE.kitap, 'Müzik kitaplığı', 'Parçaların ve hangi listede oldukları', kitaplik, ekle)
      + kart(SIMGE.acilis, 'Açılış müziği', 'LifeOS açılınca bir parçanın seçtiğin kesiti', acilis)
      + kart(SIMGE.arka, 'Arka plan müziği', 'Açılıştan sonra kısık sesle', arka)
      + '</div>';
  }
  function dosyaYukle(dosyalar, durumEl){
    const l = Array.from(dosyalar || []);
    let i = 0;
    const bir = () => {
      if(i >= l.length){ if(durumEl) durumEl.textContent = l.length + ' parça eklendi.'; return yukle().then(() => guncelle(true)); }
      const f = l[i++];
      if(durumEl) durumEl.textContent = 'Ekleniyor: ' + f.name + ' (' + i + '/' + l.length + ')';
      const tur = f.type || ({ mp3:'audio/mpeg', m4a:'audio/mp4', aac:'audio/aac', ogg:'audio/ogg', opus:'audio/ogg', webm:'audio/webm', wav:'audio/wav', flac:'audio/flac' })[String(f.name).split('.').pop().toLowerCase()] || '';
      return ortam.fetch('/api/muzik/parca', { method:'POST', headers:{ 'Content-Type':tur, 'X-LifeOS':'muzik', 'X-Ad':encodeURIComponent(f.name) }, body:f })
        .then(r => r.json()).then(v => { if(v && v.hata && durumEl) durumEl.textContent = f.name + ': ' + v.hata; })
        .catch(() => { if(durumEl) durumEl.textContent = 'Yüklenemedi: LifeOS sunucusu yanıt vermedi.'; }).then(bir);
    };
    return bir();
  }

  let bagli = false;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const ls = t.closest('[data-muzik-liste]');
      if(ls){ e.preventDefault(); const l = ls.getAttribute('data-muzik-liste'); if(kip === l) durdur(); else cal(l); return; }
      const m = t.closest('[data-muzik]');
      if(m){
        e.preventDefault();
        const ne = m.getAttribute('data-muzik');
        if(ne === 'cal'){ if(durum().caliyor) durdur(); else cal(kip && kip !== 'acilis' ? kip : liste('genel').length ? 'genel' : LISTELER.find(x => liste(x).length) || 'genel'); }
        else if(ne === 'sonraki') sonraki();
        else if(ne === 'sustur') susturAc();
        else if(ne === 'acilis-dinle'){ if(kip === 'acilis') acilisBitti(); else acilisCal(true); }
        return;
      }
      const tek = t.closest('[data-muzik-tek]');
      if(tek){ e.preventDefault(); cal('tek', { id:tek.getAttribute('data-muzik-tek') }); return; }
      const at = t.closest('[data-muzik-ata]');
      if(at){
        e.preventDefault();
        const [l, id] = at.getAttribute('data-muzik-ata').split('|'), listeler = JSON.parse(JSON.stringify(d().listeler));
        const v = listeler[l] || [];
        listeler[l] = v.indexOf(id) >= 0 ? v.filter(x => x !== id) : v.concat(id);
        ayarKaydet({ listeler });
        return;
      }
      const sl = t.closest('[data-muzik-sil]');
      if(sl){
        e.preventDefault();
        if(sl.dataset.emin !== '1'){ sl.dataset.emin = '1'; sl.textContent = 'Sil?'; return; }
        ortam.fetch('/api/muzik/parca/' + sl.getAttribute('data-muzik-sil'), { method:'DELETE', headers:{ 'X-LifeOS':'muzik' } })
          .then(r => r.json()).then(v => { if(v && v.parcalar){ dizin = v; guncelle(true); } }).catch(() => {});
        return;
      }
      const an = t.closest('[data-muzik-acilis-ne]');
      if(an){ e.preventDefault(); ayarKaydet({ acilis:Object.assign({}, d().acilis, { ne:an.getAttribute('data-muzik-acilis-ne') }) }); return; }
      const lsec = t.closest('[data-muzik-listesec]');
      if(lsec){ e.preventDefault(); seciliListe = lsec.getAttribute('data-muzik-listesec'); guncelle(true); return; }
      const ks = t.closest('[data-muzik-karistir]');
      if(ks){ e.preventDefault(); ayarKaydet({ arka:Object.assign({}, d().arka, { karistir:ks.getAttribute('data-muzik-karistir') === 'true' }) }); return; }
      const ar = t.closest('[data-muzik-arka]');
      if(ar){ e.preventDefault(); const acik = ar.getAttribute('data-muzik-arka') === 'true';
        ayarKaydet({ arka:Object.assign({}, d().arka, { acik }) }).then(() => { if(acik && !kip) arkaBaslat(); else if(!acik && kip === 'arka') durdur(); }); }
    });
    document.addEventListener('change', e => {
      const t = e.target;
      if(!t || !t.matches) return;
      if(t.matches('[data-muzik-dosya]')){ dosyaYukle(t.files, document.querySelector('[data-muzik-durum]')); t.value = ''; return; }
      if(t.matches('[data-muzik-acilis]')){
        const alan = t.getAttribute('data-muzik-acilis'), n = Number(t.value), a = d().acilis;
        const v = alan === 'id' ? (t.value || null) : alan === 'ses' ? n / 100 : alan === 'bas' ? Math.min(n, a.bit - 1) : Math.max(n, a.bas + 1);
        ayarKaydet({ acilis:Object.assign({}, a, { [alan]:v }, alan === 'id' && !v ? { ne:'kapali' } : {}) });
        return;
      }
      if(t.matches('[data-muzik-arka-ses]')){ const v = Number(t.value) / 100; ayarKaydet({ arka:Object.assign({}, d().arka, { ses:v }) }); if(kip === 'arka' && ses) ses.volume = v; }
    });
    /* «Kesit ve ses» açık kalsın: kayıttan sonra kart yeniden çizilir. */
    document.addEventListener('toggle', e => { if(e.target && e.target.matches && e.target.matches('[data-muzik-ayrinti]')) ayrintiAcik = e.target.open; }, true);
    /* Kaydırıcı sürüklenirken yazısı ve dolgusu canlı; kayıt bırakınca (change). */
    document.addEventListener('input', e => {
      const t = e.target;
      if(!(t && t.matches && t.matches('[data-muzik-ayar] input[type="range"]'))) return;
      const n = Number(t.value), ust = Number(t.max) || 100;
      t.style.setProperty('--dolu', (n / ust * 100) + '%');
      const alan = t.getAttribute('data-muzik-acilis');
      if(alan === 'bas' || alan === 'bit'){
        const a = Object.assign({}, d().acilis, { [alan]:n }), y = t.closest('.skart__satir').querySelector('[data-muzik-kesit-yazi]');
        if(y) y.textContent = kesitYaz(a);
        return;
      }
      const o = t.parentElement.querySelector('output');
      if(o) o.textContent = '%' + n;
      t.setAttribute('aria-valuetext', '%' + n);
      if(alan === 'ses' && kip === 'acilis' && ses) ses.volume = n / 100;
      if(t.matches('[data-muzik-arka-ses]') && kip === 'arka' && ses) ses.volume = n / 100;
    });
    /* Arka plan videosu sesliyken («Susar») arka plan müziği bekler; video susunca döner. */
    window.addEventListener('lifeos:zemin-ses', e => {
      const z = e.detail || {};
      if(z.sesli && z.muzik === 'sus'){ if(kip === 'arka'){ durdur(); videoBekletti = true; } }
      else if(videoBekletti){ videoBekletti = false; if(!kip) arkaBaslat(); }
    });
    window.addEventListener('lifeos:calisma', e => oturum('calisma', !!(e.detail && e.detail.acik)));
    window.addEventListener('lifeos:spor', e => oturum('spor', !!(e.detail && e.detail.acik)));
    /* Radyo başlarsa müzik susar. */
    window.addEventListener('lifeos:ses', e => { const h = e.detail && e.detail.hal; if((h === 'caliyor' || h === 'baglaniyor') && kip) durdur(); });
  }

  /* Açılış müziği seçim sayfasında (giriş, 4180) çalar (kullanıcı, 2026-10-30:
     «AYS, SPİ, ESP'yi seçmediğimiz yerde bile başlasın»); oradan açılan
     modülde ikinci kez çalmaz, arka plan müziğiyle sürer. */
  const giristen = () => typeof document !== 'undefined' && /^https?:\/\/[^/]+:4180(\/|$)/.test(String(document.referrer || ''));
  function acilis(){
    bagla();
    if(!isaretVar()) return Promise.resolve(null);
    return yukle().then(v => { if(v && (giristen() || !acilisCal())) arkaBaslat(); });
  }
  if(typeof document !== 'undefined' && typeof window !== 'undefined' && !window.__LIFEOS_TEST__){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', acilis, { once:true });
    else setTimeout(acilis, 0);
  }

  function _ortam(o){ ortam = Object.assign({}, VARSAYILAN_ORTAM, o || {}); }
  function _sifirla(v){ durdur(); dizin = v || null; kuyruk = []; sira = 0; susturuldu = false; mesajMetni = ''; }
  return Object.freeze({ LISTELER, LISTE_AD, ACILIS_GUN, VAR_ANAHTAR, yukle, cal, sonraki, durdur, acilisCal, arkaBaslat, susturAc, oturum, durum,
    panelHtml, ayarHtml, liste, bagla, _ortam, _sifirla, _ses:() => oge() });
})();
