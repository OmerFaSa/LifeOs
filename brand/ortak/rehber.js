/* REHBER — konu anlatımları (SPİ ve ESP; AYS'nin kendi Öğren'i vardır).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/rehber.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `rehber.css`.
   ==================================================================

   Kullanıcı (2026-10-18): «SPİ'ye anlatım yükle: spor nedir, kilo, kalori,
   diyet, koşu, yürüyüş, kalistenik, sağlıklı beslenme; ESP'de her alanın
   kendisiyle alakalı orta seviye bir anlatım».

   Biçim AYS'nin anlatımıyla aynı ailedir (AYS data/anlatim.js):
     { id, alan, ad, sure (dk), giris, kazanim:[…],
       bolumler:[{ baslik, metin (paragraf ya da [paragraf…]), liste?, formul?,
                   ornek?:{ soru, cozum:[…] }, dikkat? }]   (2–6 bölüm),
       akilda?:[…], kaynaklar:[…] }
   Metinde üç işaret açılır: **kalın**, x^{2} üst simge, H_{2}O alt simge.

   Sözler:
     1. İÇERİK BİLGİDİR, KARAR DEĞİL. Hiçbir anlatım bir sayıyı ya da planı
        değiştirmez; modülün sınır notu her sayfanın sonundadır (SPİ teşhis
        koymaz, doz önermez — AGENTS §1.5). Ekranda «elle yazıldı ·
        doğrulanmadı» yazar.
     2. METİN ÖNCE KAÇIRILIR, sonra işaretler açılır; başka HTML geçmez.
     3. «Okudum» bu cihazda kalır (modülün deposu); hiçbir ölçüme yazılmaz. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.REHBER = (function(){
  'use strict';
  const OKUNAN = 'lifeos.rehber.okundu';
  let ayar = null;            // { modul, konular:() => [], sinir, depo:{ oku, yaz }, ciz }
  let secili = null;

  const kac = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ^{…} ve _{…}: süslü parantez derinlikle eşlenir (iç içe üst simge). */
  function simge(s){
    let out = '', i = 0;
    while(i < s.length){
      const c = s[i];
      if((c === '^' || c === '_') && s[i + 1] === '{'){
        let d = 0, j = i + 1;
        for(; j < s.length; j++){ if(s[j] === '{') d++; else if(s[j] === '}'){ d--; if(!d) break; } }
        if(j >= s.length){ out += c; i++; continue; }
        const ic = simge(s.slice(i + 2, j));
        out += c === '^' ? '<sup>' + ic + '</sup>' : '<sub>' + ic + '</sub>';
        i = j + 1;
        continue;
      }
      out += c; i++;
    }
    return out;
  }
  function metinHtml(s){
    return simge(kac(s)).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  /* ------------------------------------------------------------ durum */
  function depo(){
    if(ayar && ayar.depo) return ayar.depo;
    return { oku:k => { try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } },
      yaz:(k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ /* depo kapalı */ } } };
  }
  function okunanlar(){ const v = depo().oku(OKUNAN); return v && typeof v === 'object' ? v : {}; }
  function okunduMu(id){ return !!okunanlar()[id]; }
  function okudum(id){
    const o = okunanlar();
    if(o[id]) delete o[id]; else o[id] = new Date().toISOString().slice(0, 10);
    depo().yaz(OKUNAN, o);
    return !!o[id];
  }
  function konular(){ try{ return (ayar && ayar.konular && ayar.konular()) || []; }catch(e){ return []; } }
  function bul(id){ return konular().find(k => k.id === id) || null; }
  function sec(id){ secili = id && bul(id) ? id : null; return secili; }

  /* ------------------------------------------------------------ liste */
  function listeHtml(){
    const l = konular();
    const alanlar = [];
    l.forEach(k => { if(alanlar.indexOf(k.alan) < 0) alanlar.push(k.alan); });
    const okunan = l.filter(k => okunduMu(k.id)).length;
    return '<div class="rehber rehber__liste">'
      + '<p class="rehber__ozet">' + l.length + ' konu · ' + okunan + ' okundu</p>'
      + alanlar.map(a => '<section class="rehber__alan"><h2 class="rehber__alan-ad">' + kac(a) + '</h2><ul class="rehber__konular">'
        + l.filter(k => k.alan === a).map(k => '<li><button type="button" class="rehber__satir" data-rehber="ac:' + kac(k.id) + '">'
          + '<span class="rehber__satir-ad">' + kac(k.ad) + '</span>'
          + '<span class="rehber__satir-yan">' + (k.sure ? kac(k.sure) + ' dk' : '')
          + (okunduMu(k.id) ? '<i class="rehber__okundu" aria-label="okundu">✓</i>' : '') + '</span></button></li>').join('')
        + '</ul></section>').join('')
      + '</div>';
  }

  /* ------------------------------------------------------------ konu */
  const para = m => (Array.isArray(m) ? m : (m ? [m] : [])).map(p => '<p>' + metinHtml(p) + '</p>').join('');
  function bolumHtml(b, i){
    return '<section class="rehber__bolum" id="rehber-b' + (i + 1) + '">'
      + '<h2 class="rehber__baslik"><span class="rehber__no">' + (i + 1) + '</span>' + kac(b.baslik) + '</h2>'
      + para(b.metin)
      + (b.liste && b.liste.length ? '<ul class="rehber__madde">' + b.liste.map(x => '<li>' + metinHtml(x) + '</li>').join('') + '</ul>' : '')
      + (b.formul && b.formul.length ? '<div class="rehber__formul">' + b.formul.map(x => '<div>' + metinHtml(x) + '</div>').join('') + '</div>' : '')
      + (b.ornek ? '<div class="rehber__ornek"><p class="rehber__ornek-etiket">Örnek</p><p>' + metinHtml(b.ornek.soru) + '</p>'
        + '<details><summary>Çözümü göster</summary><ol>' + (b.ornek.cozum || []).map(x => '<li>' + metinHtml(x) + '</li>').join('') + '</ol></details></div>' : '')
      + (b.dikkat ? '<p class="rehber__dikkat"><b>Dikkat:</b> ' + metinHtml(b.dikkat) + '</p>' : '')
      + '</section>';
  }
  function konuHtml(id){
    const k = bul(id);
    if(!k) return listeHtml();
    const l = konular(), i = l.indexOf(k);
    const onceki = l[i - 1], sonraki = l[i + 1];
    const okundu = okunduMu(k.id);
    return '<article class="rehber rehber__konu">'
      + '<p class="rehber__ust"><button type="button" class="rehber__geri" data-rehber="geri">‹ Konular</button>'
      + '<span>' + kac(k.alan) + (k.sure ? ' · ' + kac(k.sure) + ' dk' : '') + ' · elle yazıldı · doğrulanmadı</span></p>'
      + '<h1 class="rehber__ad">' + kac(k.ad) + '</h1>'
      + '<p class="rehber__giris">' + metinHtml(k.giris) + '</p>'
      + (k.kazanim && k.kazanim.length ? '<div class="rehber__kazanim"><p>Bu konunun sonunda</p><ul>' + k.kazanim.map(x => '<li>' + metinHtml(x) + '</li>').join('') + '</ul></div>' : '')
      + (k.bolumler || []).map(bolumHtml).join('')
      + (k.akilda && k.akilda.length ? '<div class="rehber__akilda"><p>Akılda kalsın</p><ul>' + k.akilda.map(x => '<li>' + metinHtml(x) + '</li>').join('') + '</ul></div>' : '')
      + (k.kaynaklar && k.kaynaklar.length ? '<p class="rehber__kaynak"><b>Dayanak:</b> ' + k.kaynaklar.map(kac).join(' · ') + '</p>' : '')
      + (ayar && ayar.sinir ? '<p class="rehber__sinir">' + kac(ayar.sinir) + '</p>' : '')
      + '<div class="rehber__ayak">'
      +   '<button type="button" class="btn ' + (okundu ? 'btn--ghost' : 'btn--primary') + '" data-rehber="okudum:' + kac(k.id) + '" aria-pressed="' + okundu + '">' + (okundu ? '✓ Okundu' : 'Okudum') + '</button>'
      +   (onceki ? '<button type="button" class="btn btn--ghost" data-rehber="onceki">‹ ' + kac(onceki.ad) + '</button>' : '')
      +   (sonraki ? '<button type="button" class="btn btn--ghost" data-rehber="sonraki">' + kac(sonraki.ad) + ' ›</button>' : '')
      + '</div></article>';
  }
  function html(){ return secili ? konuHtml(secili) : listeHtml(); }

  /* Bir alanın (ESP Çalışma bölümü) konuları: küçük kart. Satır o konuyu
     okuyucuda açar (ayar.git ile modül okuyucu ekranına geçer). Konusu
     olmayan alanda kart yoktur. */
  function alanHtml(discler){
    const l = konular().filter(k => discler.indexOf(k.disc) >= 0);
    if(!l.length) return '';
    return '<section class="rehber-alan" aria-label="Konu anlatımı">'
      + '<h2 class="rehber-alan__ad">Konu anlatımı</h2><ul class="rehber__konular">'
      + l.map(k => '<li><button type="button" class="rehber__satir" data-rehber="git:' + kac(k.id) + '">'
        + '<span class="rehber__satir-ad">' + kac(k.ad) + '</span><span class="rehber__satir-yan">'
        + (k.sure ? kac(k.sure) + ' dk' : '') + (okunduMu(k.id) ? '<i class="rehber__okundu" aria-label="okundu">✓</i>' : '') + ' ›</span></button></li>').join('')
      + '</ul></section>';
  }

  /* ------------------------------------------------------------ denetim */
  function denetle(l){
    const h = [];
    (l || []).forEach(k => {
      const ad = k.id || '?';
      if(!k.id || !k.alan || !k.ad) h.push(ad + ': kimlik, alan ya da ad yok');
      if(!k.giris || String(k.giris).length < 20) h.push(ad + ': giriş kısa ya da yok');
      const b = k.bolumler || [];
      if(b.length < 2 || b.length > 6) h.push(ad + ': 2–6 bölüm olmalı (' + b.length + ')');
      if(!b.some(x => x.ornek || x.dikkat)) h.push(ad + ': ne örnek ne dikkat var');
      if(!k.kaynaklar || !k.kaynaklar.length) h.push(ad + ': dayanak yok');
      b.forEach((x, i) => { if(!x.baslik || !x.metin) h.push(ad + ': bölüm ' + (i + 1) + ' başlıksız ya da metinsiz'); });
    });
    const gor = {};
    (l || []).forEach(k => { if(gor[k.id]) h.push(k.id + ': kimlik iki kez'); gor[k.id] = 1; });
    return h;
  }

  function ciz(){
    if(ayar && typeof ayar.ciz === 'function') ayar.ciz();
    try{ window.scrollTo({ top:0, behavior:'smooth' }); }catch(e){ /* eski tarayıcı */ }
  }
  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('[data-rehber]') : null;
      if(!b || !ayar) return;
      e.preventDefault();
      const v = b.getAttribute('data-rehber');
      const l = konular(), i = l.findIndex(k => k.id === secili);
      if(v.indexOf('git:') === 0){ sec(v.slice(4)); if(typeof ayar.git === 'function') ayar.git(); else ciz(); return; }
      if(v.indexOf('ac:') === 0) sec(v.slice(3));
      else if(v === 'geri') sec(null);
      else if(v.indexOf('okudum:') === 0){ okudum(v.slice(7)); if(ayar.ciz) ayar.ciz(); return; }
      else if(v === 'onceki' && i > 0) sec(l[i - 1].id);
      else if(v === 'sonraki' && i >= 0 && i < l.length - 1) sec(l[i + 1].id);
      ciz();
    });
  }

  function kur(o){ ayar = Object.assign({ modul:'' }, o || {}); }
  function _sifirla(){ ayar = null; secili = null; }

  return { kur, html, listeHtml, konuHtml, alanHtml, metinHtml, sec, secili:() => secili, okudum, okunduMu, denetle, kuruluMu:() => !!ayar, _sifirla };
})();
