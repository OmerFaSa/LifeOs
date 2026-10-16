/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/pusula.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* PUSULA — Kolay LifeOS planının iki sayısı (belgeler/ekip/KOLAY-PLANI.md §1).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/pusula.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `pusula.css`.
   ==================================================================

   P1 · Yönetim süresi: günde uygulamada etkileşimle geçen dakika. Kaynağı
        modülün var olan sürtünme ölçerinin gün kaydıdır (core/friction.js,
        `S.usage.days[gün].adminMs`): uygulama görünürken ve son bir dakikada
        etkileşim varken duvar saati. YALNIZ kullanım kaydı olan gün sayılır;
        kaydı olmayan gün «0 dk» değildir (Faz 0 bulgusu).
        Öğrenme ekranlarında geçen süre de bu sayıya girer (ölçer ekranı
        ayırmaz); plan bunu söyler, sayı yön içindir.
   P2 · Veri doluluğu: son PENCERE gün içinde «girildi» sayılan günlerin
        oranı. Ne «girildi» sayılır, modül KENDİ kuralıyla söyler. Payda
        yalnız ilk etkinlikten bu yana geçen günlerdir: henüz kullanılmayan
        gün eksik sayılmaz.

   Sözler:
     1. SAYILAR ÖLÇÜLÜR (AGENTS §1.2). Ölçüm yoksa sayı yok, «veri yok».
     2. HEDEF YAZILIR, YARGI YOK. «Hedef ≤ 2 dk · ≥ %90» yanında durur;
        renk ya da uyarı yoktur — pusula yön gösterir, azarlamaz.
     3. MODÜL ONSUZ DA ÇALIŞIR. Kurulmadıysa satır boş. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.PUSULA = (function(){
  'use strict';

  const PENCERE = 14;
  const HEDEF = { p1:2, p2:0.9 };
  const ortam = { simdi:() => new Date() };
  let ayar = null;   // { modul, kullanim() → { iso:{ adminMs } }, girildi(iso) → bool, ilkGun() → iso|null }

  function iso(d){
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function gunOnce(n){ const d = ortam.simdi(); d.setDate(d.getDate() - n); return iso(d); }

  /* SAF sayılabilir hâl: { p1:{ dk, gun }|null, p2:{ oran, girilen, gun }|null } */
  function olc(){
    if(!ayar) return null;
    let p1 = null, p2 = null;
    try{
      const k = (ayar.kullanim && ayar.kullanim()) || {};
      let ms = 0, gun = 0;
      for(let i = 0; i < PENCERE; i++){
        const g = k[gunOnce(i)];
        const v = g ? Number(g.adminMs) : NaN;
        if(isFinite(v) && v >= 0){ ms += v; gun++; }
      }
      if(gun > 0) p1 = { dk:Math.round(ms / 60000 / gun), gun };
    }catch(e){ p1 = null; }
    try{
      const ilk = ayar.ilkGun ? ayar.ilkGun() : null;
      const bugun = iso(ortam.simdi());
      let gun = 0, girilen = 0;
      for(let i = 0; i < PENCERE; i++){
        const t = gunOnce(i);
        if(ilk && t < ilk) break;
        if(!ilk) break;
        gun++;
        if(ayar.girildi(t)) girilen++;
      }
      /* Bugün henüz bitmedi: girilmediyse paydaya katılmaz (sabah sıfır görünmez). */
      if(gun && !ayar.girildi(bugun)) gun--;
      if(gun > 0) p2 = { oran:girilen / gun, girilen:Math.min(girilen, gun), gun };
    }catch(e){ p2 = null; }
    return { p1, p2, hedef:HEDEF, pencere:PENCERE };
  }

  function satirHtml(){
    const o = olc();
    if(!o) return '';
    const p1 = o.p1 ? '<b>' + o.p1.dk + ' dk/gün</b> <small>(' + o.p1.gun + ' günden ölçüldü)</small>' : '<b>veri yok</b>';
    const p2 = o.p2 ? '<b>%' + Math.round(o.p2.oran * 100) + '</b> <small>(' + o.p2.gun + ' günün ' + o.p2.girilen + '’i)</small>' : '<b>veri yok</b>';
    return '<div class="pusula" data-pusula role="group" aria-label="Pusula">'
      + '<span class="pusula__ad">Pusula</span>'
      + '<span class="pusula__s">Yönetim ' + p1 + ' <small class="pusula__h">hedef ≤ ' + HEDEF.p1 + ' dk</small></span>'
      + '<span class="pusula__s">Doluluk ' + p2 + ' <small class="pusula__h">hedef ≥ %' + Math.round(HEDEF.p2 * 100) + '</small></span>'
      + '</div>';
  }

  function kur(o){ ayar = Object.assign({ modul:'' }, o || {}); }
  function _sifirla(){ ayar = null; }

  return { kur, olc, satirHtml, PENCERE, HEDEF, kuruluMu:() => !!ayar, _ortam:ortam, _sifirla, _ayar:() => ayar };
})();
