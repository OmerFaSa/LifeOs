/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/agharita.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* AĞ HARİTASI — ilerlemenin sinir ağı biçiminde yol haritası, üç arayüzde aynı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/agharita.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Testi
   `brand/ortak/agharita.test.js`.
   ==================================================================

   Kullanıcı (2026-10-30): «modüllerin istatistik bölümünde nöral ağ
   haritası olsun: neyi başardığımızı, hangi konularda ilerlediğimizi;
   SPİ'de koyduğumuz hedefler dahilinde, AYS ve ESP'de öğrendiğimiz
   konular hedefinde; bize yol haritası gibi olsun». İkinci tur (aynı gün):
   «nöral ağ haritasını daha güzel, daha profesyonel tasarla».

   Çizim yalnız GÖSTERİR; sayıyı modül verir (AYS konu durumu, ESP merdiven
   basamağı, SPİ hedefin durumu). Ortada hedef ve genel oran; çevresinde
   kümeler (ders, alan, hedef türü) eşit dilimlerde; her kümenin düğümleri
   merkezden dışarı kıvrılarak giden bir yoldur (sıra, yürünecek yol).
   Bağlar eğri; ince kılavuz halkalar yolun nerede olduğunu söyler.
     bitti     dolu, modülün renginde
     suruyor   halka; ilerlemesi biliniyorsa halkanın o kadarı dolu
     sirada    kümenin sıradaki adımı: kalın halka ve hafif hâle
     bekliyor  küçük boş nokta
   Kalabalıkta yalnız süren ve sıradaki adımların adı yazılır; öbürleri
   üstüne gelince. Bir kümenin üstüne gelince öbürleri solar (CSS).
   Veri yoksa harita çizilmez, ne yapılırsa belireceği söylenir (§1.2:
   eksik veri sıfır değildir). Hareket yok; süs deseni yok (§1.10). */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.AGHARITA = (function(){
  'use strict';

  const kac = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  const DURUMLAR = Object.freeze(['bitti', 'suruyor', 'sirada', 'bekliyor']);
  const DURUM_AD = Object.freeze({ bitti:'tamam', suruyor:'sürüyor', sirada:'sıradaki', bekliyor:'bekliyor' });
  const G = 900, Y = 720, CX = G / 2, CY = Y / 2;
  const f = n => n.toFixed(1);

  /* Kümenin «sırada»sı: ilk bitmemiş düğüm (zaten süren yoksa). */
  function siraIsaretle(dugumler){
    const l = dugumler.map(d => Object.assign({}, d, { durum:DURUMLAR.indexOf(d.durum) >= 0 ? d.durum : 'bekliyor' }));
    if(!l.some(d => d.durum === 'suruyor' || d.durum === 'sirada')){
      const i = l.findIndex(d => d.durum !== 'bitti');
      if(i >= 0) l[i].durum = 'sirada';
    }
    return l;
  }

  function sayim(kumeler){
    const s = { bitti:0, suruyor:0, sirada:0, bekliyor:0, toplam:0 };
    kumeler.forEach(k => k.dugumler.forEach(d => { s[d.durum]++; s.toplam++; }));
    return s;
  }
  /* İlerleme halkası: çevrenin `oran`ı kadar yay, saat 12'den. */
  const halka = (x, y, r, oran, sinif) => {
    const c = 2 * Math.PI * r;
    return '<circle class="' + sinif + '" cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" stroke-dasharray="' + f(c * oran) + ' ' + f(c) + '" transform="rotate(-90 ' + f(x) + ' ' + f(y) + ')"/>';
  };
  /* İki nokta arası eğri: kontrol noktası merkezden uzaklaşan yönde (dallar dışa doğru kıvrılır). */
  function egri(x1, y1, x2, y2, bukum){
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, u = Math.hypot(dx, dy) || 1;
    const kx = mx - dy / u * bukum, ky = my + dx / u * bukum;
    return 'M' + f(x1) + ' ' + f(y1) + 'Q' + f(kx) + ' ' + f(ky) + ' ' + f(x2) + ' ' + f(y2);
  }

  /* veri = { merkez:'Sınav', kumeler:[{ ad, dugumler:[{ ad, durum, ilerleme? }] }], bos? }
     Döner: HTML (SVG + yığılmış dağılım çubuğu + kısa özet). */
  function html(veri){
    const v = veri || {};
    const kumeler = (v.kumeler || []).filter(k => k && k.dugumler && k.dugumler.length)
      .map(k => Object.assign({}, k, { dugumler:siraIsaretle(k.dugumler) }));
    if(!kumeler.length) return '<div class="agh agh--bos"><p>' + kac(v.bos || 'Henüz haritada gösterilecek bir şey yok.') + '</p></div>';
    const s = sayim(kumeler);
    const hepsiEtiket = s.toplam <= 24;
    const n = kumeler.length, dilim = 2 * Math.PI / n;
    const RH = n === 1 ? 0 : Math.min(150, 92 + n * 7), RMAX = Y / 2 - 40;
    /* Kılavuz halkalar düğümlerin durduğu halkalardır; çizim içeriğe göre yakınlaşır (az veride boşluk kalmaz). */
    const halkalar = {};
    let rEn = RH + 40, govde = '';
    kumeler.forEach((k, ki) => {
      const aci = -Math.PI / 2 + ki * dilim;
      const hx = CX + Math.cos(aci) * RH, hy = CY + Math.sin(aci) * RH;
      const m = k.dugumler.length, biten = k.dugumler.filter(d => d.durum === 'bitti').length, oran = biten / m;
      let bag = '', dug = '', yazi = '';
      if(n > 1) bag += '<path class="agh__bag agh__bag--kok' + (oran > 0 ? ' is-dolu' : '') + '" d="' + egri(CX, CY, hx, hy, 0) + '"/>';
      /* Yol: düğümler kümenin diliminde yay yay dizilir; yol bir yay boyunca
         gider, sonraki halkaya geçince yön değiştirir (okunur, düzenli). */
      let ox = hx, oy = hy, od = 'bitti', oSatir = -1, oAci = aci;
      const etiketlenen = [];
      const ic = n === 1 ? 110 : RH + 46, aralik = n === 1 ? 2 * Math.PI * .8 : Math.min(dilim * .7, 1.25);
      const sutun = Math.max(1, Math.min(m, Math.floor(ic * aralik / 30) + 1)), satir = Math.ceil(m / sutun);
      const adim = satir === 1 ? 0 : Math.min(50, (RMAX - ic) / (satir - 1));
      k.dugumler.forEach((d, i) => {
        const sa = Math.floor(i / sutun), c0 = i % sutun, c = sa % 2 ? sutun - 1 - c0 : c0;
        const r = ic + sa * adim;
        const a = aci + (sutun === 1 ? 0 : (c / (sutun - 1) - .5) * aralik);
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
        halkalar[Math.round(r)] = 1; rEn = Math.max(rEn, r);
        const yol = sa === oSatir
          ? 'M' + f(ox) + ' ' + f(oy) + 'A' + f(r) + ' ' + f(r) + ' 0 0 ' + (a > oAci ? 1 : 0) + ' ' + f(x) + ' ' + f(y)
          : egri(ox, oy, x, y, 0);
        const dolu = od === 'bitti' && d.durum === 'bitti';
        bag += '<path class="agh__bag' + (dolu ? ' is-dolu' : '') + '" d="' + yol + '"/>';
        const yc = d.durum === 'bekliyor' ? 3.4 : d.durum === 'bitti' ? 5.6 : 6.4;
        const il = typeof d.ilerleme === 'number' && d.ilerleme > 0 && d.ilerleme < 1 ? d.ilerleme : null;
        dug += '<g class="agh__dugum agh__dugum--' + d.durum + '"><title>' + kac(k.ad + ' · ' + d.ad + ' — ' + DURUM_AD[d.durum] + (il != null ? ' %' + Math.round(il * 100) : '')) + '</title>'
          + (d.durum === 'sirada' ? '<circle class="agh__hale" cx="' + f(x) + '" cy="' + f(y) + '" r="' + (yc + 7) + '"/>' : '')
          + '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + yc + '"/>'
          + (il != null ? halka(x, y, yc + 2.4, il, 'agh__ilerleme') : '') + '</g>';
        if(hepsiEtiket || d.durum === 'sirada' || (d.durum === 'suruyor' && etiketlenen.length < 2)){
          etiketlenen.push(i);
          const sag = Math.cos(a) >= 0;
          yazi += '<text class="agh__yazi agh__yazi--dugum' + (d.durum === 'sirada' ? ' is-sirada' : '') + '" x="' + f(x + (sag ? yc + 6 : -yc - 6)) + '" y="' + f(y + 3.5) + '" text-anchor="' + (sag ? 'start' : 'end') + '">'
            + kac(String(d.ad).slice(0, 22)) + '</text>';
        }
        ox = x; oy = y; od = d.durum; oSatir = sa; oAci = a;
      });
      if(n > 1){
        dug += '<g class="agh__kume"><title>' + kac(k.ad + ' · ' + biten + '/' + m + ' tamam') + '</title><circle cx="' + f(hx) + '" cy="' + f(hy) + '" r="17"/>'
          + halka(hx, hy, 17, oran, 'agh__ilerleme agh__ilerleme--kume')
          + '<text class="agh__oran" x="' + f(hx) + '" y="' + f(hy + 3.5) + '" text-anchor="middle">' + Math.round(oran * 100) + '</text></g>';
        const ust = Math.sin(aci) < -.3;
        yazi += '<text class="agh__yazi agh__yazi--kume" x="' + f(hx) + '" y="' + f(ust ? hy + 32 : hy - 25) + '" text-anchor="middle">' + kac(String(k.ad).slice(0, 18)) + '</text>';
      }
      govde += '<g class="agh__k" tabindex="0" aria-label="' + kac(k.ad + ': ' + biten + '/' + m + ' tamam') + '">' + bag + dug + yazi + '</g>';
    });
    const genel = Math.round(s.bitti / s.toplam * 100);
    const ozet = s.bitti + ' tamam · ' + (s.suruyor + s.sirada) + ' yolda · ' + s.bekliyor + ' bekliyor';
    const pay = x => (x / s.toplam * 100).toFixed(2) + '%';
    const kilavuz = Object.keys(halkalar).map(Number).sort((a, b) => a - b).filter((r, i, l) => l.length <= 6 || i % Math.ceil(l.length / 6) === 0)
      .map(r => '<circle cx="' + CX + '" cy="' + CY + '" r="' + r + '"/>').join('');
    const yG = rEn + 120, yY = rEn + 34;   // yanlarda düğüm adlarına yer
    return '<div class="agh"><svg class="agh__svg" viewBox="' + f(CX - yG) + ' ' + f(CY - yY) + ' ' + f(2 * yG) + ' ' + f(2 * yY) + '" role="img" aria-label="' + kac((v.merkez || 'Hedef') + ' yol haritası: ' + s.toplam + ' adımdan ' + ozet) + '">'
      + '<g class="agh__kilavuz">' + kilavuz + '</g>'
      + govde
      + '<g class="agh__merkez"><circle cx="' + CX + '" cy="' + CY + '" r="36"/>' + halka(CX, CY, 42, s.bitti / s.toplam, 'agh__ilerleme agh__ilerleme--merkez')
      + '<text class="agh__merkez-oran" x="' + CX + '" y="' + (CY + 2) + '" text-anchor="middle">%' + genel + '</text>'
      + '<text class="agh__merkez-ad" x="' + CX + '" y="' + (CY + 17) + '" text-anchor="middle">' + kac(String(v.merkez || 'Hedef').slice(0, 12)) + '</text></g></svg>'
      + '<div class="agh__alt"><span class="agh__cubuk" aria-hidden="true"><i class="agh__p agh__p--bitti" style="width:' + pay(s.bitti) + '"></i>'
      + '<i class="agh__p agh__p--suruyor" style="width:' + pay(s.suruyor + s.sirada) + '"></i></span>'
      + '<p class="agh__ozet"><i class="agh__lejant agh__lejant--bitti"></i>' + s.bitti + ' tamam <i class="agh__lejant agh__lejant--suruyor"></i>' + (s.suruyor + s.sirada)
      + ' yolda <i class="agh__lejant agh__lejant--bekliyor"></i>' + s.bekliyor + ' bekliyor</p></div></div>';
  }

  return Object.freeze({ html, DURUMLAR, DURUM_AD, _sayim:sayim, _sira:siraIsaretle });
})();
