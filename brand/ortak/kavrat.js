/* KAVRAT — anlatımı görerek, dinleyerek ve kartla kavratmak (AYS, SPİ, ESP).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kavrat.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `kavrat.css`,
   testi `kavrat.test.js`. Plan: `belgeler/ekip/OGRETME-PLANI.md`.
   ==================================================================

   Üç parça; modül yalnız içerik ve sesini verir, çekirdek ne SPİ'yi ne ESP'yi bilir:
     cizim   bölümün adım adım şekli: { w, h, alt, adimlar:[{ o:[öğe…], not }] }.
             Öğeler `sekil.js` kataloğundan. Önceki adımlar ikincil renkte kalır,
             yalnız son adım vurgulu: göz yeni parçaya gider.
     dinle   bölümün metnini modülün kendi ses katmanıyla okur. Ses yoksa düğme yok.
     kartlar konunun 3–8 kartı { on, arka }. Önce hatırla, sonra çevir (geri getirme);
             «Bildim / Bilemedim» `USTA` kanıtıdır, sıra `USTA.sira`. Sesli tekrarda
             kartın önü okunur, kısa ara, arkası okunur.

   Sözler:
     1. KARAR KODDA (AGENTS §1.1). Aşama, vade ve sıra `USTA`'nındır; model yok.
     2. EKSİK SIFIR DEĞİL (§1.2). Hiç sorulmamış kart «veri yok»tur, sayaçta boş kalır.
     3. ÖLÇÜME VE XP'YE YAZMAZ (§1.6). Kanıtlar bu cihazın deposunda (`<modul>.kavrat.kanit`).
     4. YERİNDE ÇİZER. Tıklama yalnız kendi parçasını yeniden çizer, odak aynı düğmede
        kalır; sayfa baştan çizilmez, kaydırma yeri kaybolmaz.
     5. SES İSTEĞE BAĞLIDIR. API ya da Türkçe ses yoksa metin aynen durur, hata yok. */
window.LIFEOS.PARCA.yazilar({
  'ortak.kavrat.adim':'Adım {i} / {n}',
  'ortak.kavrat.onceki':'‹ Önceki',
  'ortak.kavrat.sonraki':'Sonraki ›',
  'ortak.kavrat.bastan':'Baştan',
  'ortak.kavrat.dinle':'Dinle',
  'ortak.kavrat.durdur':'Durdur',
  'ortak.kavrat.dinle-etiket':'«{ad}» bölümünü sesli dinle',
  'ortak.kavrat.kartlar':'Kartlar',
  'ortak.kavrat.kalici':'Kalıcı',
  'ortak.kavrat.cevir':'Cevabı göster',
  'ortak.kavrat.bildim':'Bildim',
  'ortak.kavrat.bilemedim':'Bilemedim',
  'ortak.kavrat.sesli':'Sesli tekrar',
  'ortak.kavrat.once-hatirla':'Önce aklından söyle, sonra çevir.',
  'ortak.kavrat.bugun-bitti':'Bugünlük kart kalmadı. Sıradaki tekrar: {g}.',
  'ortak.kavrat.kart-sirasi':'Kart {i}, sırada {n}',
});

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.KAVRAT = (function(){
  'use strict';
  const L = () => window.LIFEOS || {};
  const yazi = (id, d) => L().PARCA.yazi(id, d);
  const kac = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const SES_ARA = 3500;   // sistem ayarı: sesli tekrarda önü okuduktan sonra düşünme payı (ms)

  let ayar = { modul:'ortak' };
  const KAYIT = new Map();          // parça kimliği → { tur, veri }
  const ADIM = {};                  // çizim kimliği → gösterilen adım (0'dan)
  const KART = {};                  // konu → { sira:[on], i, cevrik, sesli }
  let konusan = null;               // dinlenen bölüm kimliği
  let sesKusak = 0;                 // eski sesli tekrar zamanlayıcısını boşa düşürür

  /* 2026-11-06'ya kadar kartlar anlatım sayfasındaydı ve anahtar sayfaya göreydi
     (spi.rehber, konu «rehber:kosu»). Artık öğrenme motorundadır: anahtar modülündür,
     eski kayıt bir kez taşınır, eskisi silinmez (ESKİ VERİ KAYBOLMAZ). */
  const ESKI = { ays:'ays.ogren', spi:'spi.rehber', esp:'esp.rehber' };
  function tasi(){
    const e = ESKI[ayar.modul];
    if(!e || !L().OGRET) return;
    const yeni = depo();
    if(Object.keys(yeni.oku()).length) return;
    const eski = L().OGRET.depo(e + '.kavrat.kanit').oku(), v = {};
    Object.keys(eski).forEach(k => { v[k.replace(/^(rehber|ays):/, '')] = eski[k]; });
    if(Object.keys(v).length) yeni.yaz(v);
  }
  function kur(o){ ayar = Object.assign({ modul:'ortak' }, o || {}); try{ tasi(); }catch(e){ /* depo kapalı */ } }
  function metin(s){ return ayar.metin ? ayar.metin(String(s == null ? '' : s)) : kac(s); }
  function bugun(){
    if(ayar.bugun) return ayar.bugun();
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  }
  function sesVar(){ try{ return !!(ayar.ses && ayar.ses.var()); }catch(e){ return false; } }

  /* ------------------------------------------------------------ denetim */

  /* Bir bölümün çizimi ya da bir konunun kartları için kusurlar; boş = temiz. */
  function denetle(o){
    const h = [], S = L().SEKIL;
    if(o && o.cizim){
      const c = o.cizim, a = c.adimlar;
      if(!Array.isArray(a) || a.length < 2 || a.length > 6) h.push('çizim: 2–6 adım olmalı');
      else{
        a.forEach((x, i) => {
          if(!x || !Array.isArray(x.o) || !x.o.length) h.push('çizim adım ' + (i + 1) + ': öğe yok');
          const n = String((x && x.not) || '').trim();
          if(n.length < 8 || n.length > 140) h.push('çizim adım ' + (i + 1) + ': not 8–140 harf olmalı');
        });
        if(S) S.denetle({ w:c.w, h:c.h, alt:c.alt, o:[].concat.apply([], a.map(x => (x && x.o) || [])) })
          .forEach(k => h.push('çizim: ' + k));
        else h.push('çizim: sekil.js yüklü değil');
      }
    }
    if(o && o.kartlar){
      const k = o.kartlar, gor = {};
      if(!Array.isArray(k) || k.length < 3 || k.length > 8) h.push('kartlar: 3–8 kart olmalı');
      else k.forEach((x, i) => {
        const on = String((x && x.on) || '').trim(), arka = String((x && x.arka) || '').trim();
        if(on.length < 4 || on.length > 160) h.push('kart ' + (i + 1) + ': ön yüz 4–160 harf olmalı');
        if(arka.length < 1 || arka.length > 240) h.push('kart ' + (i + 1) + ': arka yüz 1–240 harf olmalı');
        if(gor[on]) h.push('kart ' + (i + 1) + ': ön yüz iki kez');
        gor[on] = 1;
      });
    }
    return h;
  }

  /* ------------------------------------------------------------ çizim */

  function cizimHtml(id, c){
    if(!c || denetle({ cizim:c }).length) return '';
    KAYIT.set(id, { tur:'cizim', veri:c });
    const n = c.adimlar.length, k = Math.min(ADIM[id] || 0, n - 1), S = L().SEKIL;
    const katman = c.adimlar.slice(0, k + 1).map((a, i) =>
      '<g class="kavrat-adim' + (i < k ? ' is-eski' : '') + '">' + S.ogeler(a.o) + '</g>').join('');
    const sayac = yazi('ortak.kavrat.adim', { i:k + 1, n });
    const not = c.adimlar[k].not;
    const dugme = (v, et, kapali) => '<button type="button" class="btn btn--sm btn--ghost" data-kavrat="' + v + ':' + kac(id) + '"'
      + (kapali ? ' disabled' : '') + '>' + kac(et) + '</button>';
    return '<figure class="kavrat-cizim sekil" data-kavrat-kok="' + kac(id) + '">'
      + '<svg class="sekil__svg" viewBox="0 0 ' + c.w + ' ' + c.h + '" width="' + Math.round(c.w * 1.4) + '" role="img" focusable="false"'
      + ' aria-label="' + kac(c.alt + ' ' + sayac + ': ' + not) + '">' + katman + '</svg>'
      + '<figcaption class="kavrat-cizim__alt"><span class="kavrat-cizim__sayac" aria-hidden="true">' + noktalar(n, k) + '</span>'
      + '<span class="kavrat-cizim__not" aria-live="polite">' + metin(not) + '</span></figcaption>'
      + '<div class="kavrat-dugmeler">' + dugme('geri', yazi('ortak.kavrat.onceki'), k === 0)
      + (k < n - 1 ? dugme('ileri', yazi('ortak.kavrat.sonraki')) : dugme('bastan', yazi('ortak.kavrat.bastan')))
      + '</div></figure>';
  }
  /* Adım ilerlemesi çizilir, yazılmaz (§1.10): dolu nokta görülen adım. */
  function noktalar(n, k){
    let s = '';
    for(let i = 0; i < n; i++) s += '<i class="kavrat-nokta' + (i <= k ? ' is-dolu' : '') + '"></i>';
    return s;
  }
  function adimGit(id, yon){
    const r = KAYIT.get(id);
    if(!r) return;
    const n = r.veri.adimlar.length, k = ADIM[id] || 0;
    ADIM[id] = yon === 'bastan' ? 0 : Math.max(0, Math.min(n - 1, k + (yon === 'ileri' ? 1 : -1)));
  }

  /* ------------------------------------------------------------ dinle */

  /* Ekrandaki işaret konuşmada yanlış duyulur; yalnız okunuş için çevrilir. */
  function okunus(s){
    return String(s == null ? '' : s)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\^\{2\}/g, ' kare').replace(/\^\{3\}/g, ' küp')
      .replace(/\^\{([^}]+)\}/g, ' üssü $1').replace(/_\{([^}]+)\}/g, ' $1')
      .replace(/√/g, ' kök ').replace(/\s·\s/g, ' çarpı ').replace(/\s×\s/g, ' çarpı ')
      .replace(/\s=\s/g, ' eşittir ').replace(/\s?→\s?/g, ', ')
      .replace(/(\d)–(?=\d)/g, '$1, ').replace(/[«»]/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  /* Bir bölümün okunacak metni: başlık, paragraflar, maddeler, formül, dikkat. */
  function bolumMetni(b){
    if(!b) return '';
    const dz = v => (Array.isArray(v) ? v : (v ? [v] : []));
    return okunus([b.baslik].concat(dz(b.metin), dz(b.liste), dz(b.formul), b.dikkat ? ['Dikkat: ' + b.dikkat] : [])
      .filter(Boolean).map(x => String(x).replace(/[.:;!?]?\s*$/, '.')).join(' '));
  }
  /* Kimlik 'ses:' ile ayrılır: aynı bölümün çizimi aynı kimliği taşır, yerinde çizimde karışmasın. */
  function dinleHtml(bolum, b){
    if(!sesVar() || !b) return '';
    const id = 'ses:' + bolum;
    const m = bolumMetni(b);
    if(!m) return '';
    KAYIT.set(id, { tur:'dinle', veri:m, ad:b.baslik });
    return dinleDugme(id, b.baslik);
  }
  function dinleDugme(id, ad){
    const acik = konusan === id;
    return '<button type="button" class="btn btn--sm btn--ghost kavrat-dinle" data-kavrat-kok="' + kac(id) + '" data-kavrat="dinle:' + kac(id) + '"'
      + ' aria-pressed="' + acik + '" aria-label="' + kac(yazi('ortak.kavrat.dinle-etiket', { ad:ad || '' })) + '">'
      + '<span aria-hidden="true">' + (acik ? '■ ' : '▶ ') + '</span>' + kac(yazi(acik ? 'ortak.kavrat.durdur' : 'ortak.kavrat.dinle')) + '</button>';
  }
  function sesDur(){ sesKusak++; konusan = null; try{ ayar.ses && ayar.ses.dur(); }catch(e){ /* ses yok */ } }
  function konus(m){
    try{ return Promise.resolve(ayar.ses.konus(m)).catch(() => null); }catch(e){ return Promise.resolve(null); }
  }
  function dinle(id){
    const r = KAYIT.get(id);
    if(!r) return;
    const onceki = konusan;
    sesDur();
    yenile(onceki);
    Object.keys(KART).forEach(k => { if(KART[k].sesli){ KART[k].sesli = false; yenile('kart:' + k); } });
    if(onceki === id) return;
    konusan = id;
    const kusak = sesKusak;
    konus(r.veri).then(() => { if(kusak === sesKusak){ konusan = null; yenile(id); } });
  }

  /* ------------------------------------------------------------ kartlar */

  function depo(){ return L().OGRET.depo(ayar.modul + '.kavrat.kanit'); }
  function kanitlar(konu){ const v = depo().oku()[konu]; return v && typeof v === 'object' ? v : {}; }
  function beceriler(konu, kartlar){
    const k = kanitlar(konu);
    return (kartlar || []).map(x => ({ id:x.on, kanitlar:Array.isArray(k[x.on]) ? k[x.on] : [] }));
  }
  function cevapla(konu, on, isabet){
    const t = depo(), v = t.oku();
    const k = v[konu] && typeof v[konu] === 'object' ? v[konu] : {};
    k[on] = (Array.isArray(k[on]) ? k[on] : []).concat([{ g:bugun(), isabet:!!isabet }]).slice(-30);
    v[konu] = k;
    t.yaz(v);
  }
  function durum(konu, kartlar){
    const U = L().USTA, b = beceriler(konu, kartlar), g = bugun();
    const h = U.harita(b, g);
    const sonrakiler = b.map(x => U.asama(x.kanitlar, g).sonraki).filter(x => x && x > g).sort();
    /* Hiç cevaplanmamış sette «kaç kart kalıcı» sorusunun cevabı yok: null (veri yok, §1.2). */
    return { b, kalici:h.olculen ? h.sayi.kalici + h.sayi.saglam : null, toplam:h.toplam, sonraki:sonrakiler[0] || null,
      sira:U.sira(b, g).map(x => x.id) };
  }
  function kartlarHtml(konu, kartlar){
    if(!kartlar || denetle({ kartlar }).length || !L().USTA || !L().OGRET) return '';
    const id = 'kart:' + konu;
    KAYIT.set(id, { tur:'kart', veri:kartlar, konu });
    const d = durum(konu, kartlar);
    const s = KART[konu] = KART[konu] || { sira:null, i:0, cevrik:false, sesli:false };
    if(!s.sira || s.i >= s.sira.length){ s.sira = d.sira; s.i = 0; s.cevrik = false; }
    const on = s.sira[s.i], kart = kartlar.find(x => x.on === on);
    const G = L().GRAFIK;
    const sayac = G && G.tikHtml ? G.tikHtml({ hedef:d.toplam, yapilan:d.kalici, etiket:yazi('ortak.kavrat.kalici') }) : '';
    const dugme = (v, et, ton, ek) => '<button type="button" class="btn btn--sm ' + (ton || 'btn--ghost') + '" data-kavrat="' + v + ':' + kac(id) + '"' + (ek || '') + '>' + kac(et) + '</button>';
    let govde;
    if(!kart){
      govde = '<p class="kavrat-kart__bos">' + kac(yazi('ortak.kavrat.bugun-bitti', { g:d.sonraki ? tarihAdi(d.sonraki) : '—' })) + '</p>';
    }else{
      govde = '<div class="kavrat-kart" aria-label="' + kac(yazi('ortak.kavrat.kart-sirasi', { i:s.i + 1, n:s.sira.length })) + '" role="group">'
        + '<p class="kavrat-kart__on">' + metin(kart.on) + '</p>'
        + (s.cevrik ? '<p class="kavrat-kart__arka">' + metin(kart.arka) + '</p>' : '<p class="kavrat-kart__ipucu">' + kac(yazi('ortak.kavrat.once-hatirla')) + '</p>')
        + '</div><div class="kavrat-dugmeler">'
        + (s.cevrik ? dugme('bildim', yazi('ortak.kavrat.bildim'), 'btn--primary') + dugme('bilemedim', yazi('ortak.kavrat.bilemedim'))
          : dugme('cevir', yazi('ortak.kavrat.cevir'), 'btn--primary'))
        + (sesVar() ? dugme('sesli', yazi('ortak.kavrat.sesli'), null, ' aria-pressed="' + s.sesli + '"') : '')
        + '</div>';
    }
    return '<section class="kavrat-kartlar" data-kavrat-kok="' + kac(id) + '" aria-label="' + kac(yazi('ortak.kavrat.kartlar')) + '">'
      + '<div class="kavrat-kartlar__bas"><h3 class="kavrat-kartlar__ad">' + kac(yazi('ortak.kavrat.kartlar')) + '</h3>' + sayac + '</div>'
      + govde + '</section>';
  }
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function tarihAdi(iso){ const p = String(iso).split('-').map(Number); return p[2] + ' ' + AYLAR[p[1] - 1]; }

  function kartEylem(v, id){
    const r = KAYIT.get(id);
    if(!r) return;
    const s = KART[r.konu];
    if(!s) return;
    const on = s.sira && s.sira[s.i];
    if(v === 'cevir'){ s.cevrik = true; if(s.sesli) sesliOku(id, 'arka'); return; }
    if(v === 'bildim' || v === 'bilemedim'){
      if(on) cevapla(r.konu, on, v === 'bildim');
      s.i++; s.cevrik = false;
      if(s.sesli) setTimeout(() => sesliOku(id, 'on'), 0);
      return;
    }
    if(v === 'sesli'){
      s.sesli = !s.sesli;
      if(!s.sesli){ sesDur(); return; }
      const onceki = konusan; konusan = null; yenile(onceki);
      setTimeout(() => sesliOku(id, s.cevrik ? 'arka' : 'on'), 0);
    }
  }
  /* Sesli tekrar: önü oku, düşünme payı, kendiliğinden çevir ve arkayı oku. Cevap yine düğmeyle. */
  function sesliOku(id, yuz){
    const r = KAYIT.get(id), s = r && KART[r.konu];
    if(!s || !s.sesli || !s.sira) return;
    const kart = r.veri.find(x => x.on === s.sira[s.i]);
    if(!kart) return;
    try{ ayar.ses.dur(); }catch(e){ /* ses yok */ }
    const kusak = ++sesKusak;
    konus(okunus(yuz === 'on' ? kart.on : kart.arka)).then(() => {
      if(yuz !== 'on' || kusak !== sesKusak) return;
      setTimeout(() => {
        if(kusak !== sesKusak || !s.sesli || s.cevrik) return;
        s.cevrik = true; yenile(id); sesliOku(id, 'arka');
      }, SES_ARA);
    });
  }

  /* ------------------------------------------------------------ olay */

  function parcaHtml(id){
    const r = KAYIT.get(id);
    if(!r) return null;
    if(r.tur === 'cizim') return cizimHtml(id, r.veri);
    if(r.tur === 'dinle') return dinleDugme(id, r.ad);
    if(r.tur === 'kart') return kartlarHtml(r.konu, r.veri);
    return null;
  }
  /* Parçayı yerinde yeniden çizer; odak aynı eylemin düğmesinde kalır (söz 4). */
  function yenile(id, odak){
    if(!id || typeof document === 'undefined') return;
    const kok = Array.from(document.querySelectorAll('[data-kavrat-kok]')).filter(e => e.getAttribute('data-kavrat-kok') === id);
    if(!kok.length) return;
    const h = parcaHtml(id);
    if(h == null) return;
    kok.forEach(e => {
      const sablon = document.createElement('template');
      sablon.innerHTML = h;
      const yeni = sablon.content.firstElementChild;
      if(!yeni) return;
      e.replaceWith(yeni);
      if(odak){
        const hedef = yeni.matches('[data-kavrat="' + odak + '"]') ? yeni
          : yeni.querySelector('[data-kavrat="' + odak + '"]:not([disabled])') || yeni.querySelector('button:not([disabled])');
        if(hedef) try{ hedef.focus({ preventScroll:true }); }catch(x){ hedef.focus(); }
      }
    });
  }
  function tikla(deger){
    const i = deger.indexOf(':');
    const v = deger.slice(0, i), id = deger.slice(i + 1);
    if(v === 'ileri' || v === 'geri' || v === 'bastan') adimGit(id, v);
    else if(v === 'dinle'){ dinle(id); yenile(id, deger); return; }
    else kartEylem(v, id);
    yenile(id, deger);
  }
  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('[data-kavrat]') : null;
      if(!b || b.disabled) return;
      e.preventDefault();
      tikla(b.getAttribute('data-kavrat'));
    });
  }

  function _sifirla(){ KAYIT.clear(); Object.keys(ADIM).forEach(k => delete ADIM[k]); Object.keys(KART).forEach(k => delete KART[k]); konusan = null; ayar = { modul:'ortak' }; }

  return { kur, denetle, cizimHtml, dinleHtml, kartlarHtml, okunus, bolumMetni, cevapla, beceriler, durum, tikla, sesDur, SES_ARA, _sifirla };
})();
