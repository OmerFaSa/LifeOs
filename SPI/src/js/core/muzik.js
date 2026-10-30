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
      .then(v => { dizin = v || null; guncelle(); return dizin; }).catch(() => null);
  }
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

  /* Açılış kesiti. Döner: çalmaya başladı mı. */
  function acilisCal(){
    const a = d().acilis;
    if(!a.id || a.ne === 'kapali' || !parca(a.id)) return false;
    const gun = ortam.simdi().toISOString().slice(0, 10);
    if(a.ne === 'gunde'){
      let son = null;
      try{ son = localStorage.getItem(ACILIS_GUN); }catch(e){ /* depo yok */ }
      if(son === gun) return false;
    }
    try{ localStorage.setItem(ACILIS_GUN, gun); }catch(e){ /* depo yok */ }
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
  function arkaBaslat(){
    if(susturuldu || !d().arka.acik || !liste('arka').length) return false;
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
  function ayarHtml(){
    if(!ortam.sunucu()) return '<div data-muzik-ayar><p class="ayarlar__bos">Müzik dosyaları bu bilgisayardaki LifeOS sunucusunda durur; telefonda ve tek dosya sürümünde yoktur.</p></div>';
    const x = d(), a = x.acilis, k = x.arka;
    const parcalar = x.parcalar.length ? '<ul class="muzik__liste">' + x.parcalar.map(p => '<li class="muzik__parca"><button type="button" class="muzik__dinle" data-muzik-tek="' + p.id + '" aria-label="' + kac(p.ad) + ' çal">'
        + SIMGE_CAL + '</button><span class="muzik__ad">' + kac(p.ad) + '</span><span class="muzik__atama" role="group" aria-label="' + kac(p.ad) + ' hangi listelerde">'
        + LISTELER.map(l => { const on = (x.listeler[l] || []).indexOf(p.id) >= 0;
          return '<button type="button" class="muzik__cip' + (on ? ' is-on' : '') + '" data-muzik-ata="' + l + '|' + p.id + '" aria-pressed="' + on + '">' + LISTE_AD[l] + '</button>'; }).join('')
        + '</span><button type="button" class="muzik__sil" data-muzik-sil="' + p.id + '" aria-label="' + kac(p.ad) + ' sil">×</button></li>').join('') + '</ul>'
      : '<p class="ayarlar__bos">Henüz parça yok. MP3, M4A, OGG, WAV ya da FLAC dosyalarını ekle.</p>';
    const secenek = x.parcalar.map(p => '<option value="' + p.id + '"' + (a.id === p.id ? ' selected' : '') + '>' + kac(p.ad) + '</option>').join('');
    return '<div class="muzik-ayar" data-muzik-ayar>'
      + '<div class="muzik-ayar__ust"><label class="btn btn--sm">Müzik ekle<input type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.opus,.webm,.wav,.flac" multiple data-muzik-dosya hidden></label>'
      + '<small class="muzik-ayar__durum" data-muzik-durum role="status"></small></div>'
      + parcalar
      + '<h5 class="plan__alt">Açılış müziği</h5>'
      + '<div class="muzik-ayar__satir"><select data-muzik-acilis="id" aria-label="Açılış parçası"><option value="">Yok</option>' + secenek + '</select>'
      + '<label>baştan <input type="number" min="0" max="600" step="1" value="' + a.bas + '" data-muzik-acilis="bas" aria-label="Başlangıç saniyesi"> sn</label>'
      + '<label>bitiş <input type="number" min="1" max="600" step="1" value="' + a.bit + '" data-muzik-acilis="bit" aria-label="Bitiş saniyesi"> sn</label></div>'
      + '<div class="muzik-ayar__satir"><div class="seg" role="group" aria-label="Ne zaman">' + [['kapali', 'Kapalı'], ['her', 'Her açılışta'], ['gunde', 'Günde bir']].map(([v, ad]) =>
          '<button type="button" class="' + (a.ne === v ? 'is-on' : '') + '" data-muzik-acilis-ne="' + v + '" aria-pressed="' + (a.ne === v) + '"' + (!a.id && v !== 'kapali' ? ' disabled' : '') + '>' + ad + '</button>').join('') + '</div>'
      + '<label class="muzik-ayar__ses">Ses <input type="range" min="0" max="1" step="0.05" value="' + a.ses + '" data-muzik-acilis="ses" aria-label="Açılış müziğinin sesi"></label></div>'
      + '<h5 class="plan__alt">Arka planda</h5>'
      + '<div class="muzik-ayar__satir"><div class="seg" role="group" aria-label="Arka plan müziği">' + [[false, 'Kapalı'], [true, 'Açık']].map(([v, ad]) =>
          '<button type="button" class="' + (k.acik === v ? 'is-on' : '') + '" data-muzik-arka="' + v + '" aria-pressed="' + (k.acik === v) + '">' + ad + '</button>').join('') + '</div>'
      + '<label class="muzik-ayar__ses">Ses <input type="range" min="0" max="1" step="0.05" value="' + k.ses + '" data-muzik-arka-ses aria-label="Arka plan müziğinin sesi"></label></div>'
      + '<p class="plan__not">Arka plan listesi açılıştan sonra karışık çalar. Çalışma oturumu başlayınca «Çalışırken» listesine geçer.</p>'
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
      const ar = t.closest('[data-muzik-arka]');
      if(ar){ e.preventDefault(); const acik = ar.getAttribute('data-muzik-arka') === 'true';
        ayarKaydet({ arka:Object.assign({}, d().arka, { acik }) }).then(() => { if(acik && !kip) arkaBaslat(); else if(!acik && kip === 'arka') durdur(); }); }
    });
    document.addEventListener('change', e => {
      const t = e.target;
      if(!t || !t.matches) return;
      if(t.matches('[data-muzik-dosya]')){ dosyaYukle(t.files, document.querySelector('[data-muzik-durum]')); t.value = ''; return; }
      if(t.matches('[data-muzik-acilis]')){
        const alan = t.getAttribute('data-muzik-acilis'), v = alan === 'id' ? (t.value || null) : Number(t.value);
        ayarKaydet({ acilis:Object.assign({}, d().acilis, { [alan]:v }, alan === 'id' && !v ? { ne:'kapali' } : {}) });
        return;
      }
      if(t.matches('[data-muzik-arka-ses]')){ const v = Number(t.value); ayarKaydet({ arka:Object.assign({}, d().arka, { ses:v }) }); if(kip === 'arka' && ses) ses.volume = v; }
    });
    window.addEventListener('lifeos:calisma', e => oturum('calisma', !!(e.detail && e.detail.acik)));
    window.addEventListener('lifeos:spor', e => oturum('spor', !!(e.detail && e.detail.acik)));
    /* Radyo başlarsa müzik susar. */
    window.addEventListener('lifeos:ses', e => { const h = e.detail && e.detail.hal; if((h === 'caliyor' || h === 'baglaniyor') && kip) durdur(); });
  }

  function acilis(){
    bagla();
    return yukle().then(v => { if(v && !acilisCal()) arkaBaslat(); });
  }
  if(typeof document !== 'undefined' && typeof window !== 'undefined' && !window.__LIFEOS_TEST__){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', acilis, { once:true });
    else setTimeout(acilis, 0);
  }

  function _ortam(o){ ortam = Object.assign({}, VARSAYILAN_ORTAM, o || {}); }
  function _sifirla(v){ durdur(); dizin = v || null; kuyruk = []; sira = 0; susturuldu = false; mesajMetni = ''; }
  return Object.freeze({ LISTELER, LISTE_AD, ACILIS_GUN, yukle, cal, sonraki, durdur, acilisCal, arkaBaslat, susturAc, oturum, durum,
    panelHtml, ayarHtml, liste, bagla, _ortam, _sifirla, _ses:() => oge() });
})();
