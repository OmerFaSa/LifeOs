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
   konular hedefinde; bize yol haritası gibi olsun».

   Çizim yalnız GÖSTERİR; sayıyı modül verir (AYS konu durumu, ESP merdiven
   basamağı, SPİ hedefin durumu). Ortada hedef; çevresinde kümeler
   (ders, alan, hedef türü); her kümenin düğümleri merkezden dışarı doğru
   bir yol çizer — sıra, yürünecek yoldur. Düğüm:
     bitti     dolu, modülün renginde
     suruyor   halka; ilerlemesi biliniyorsa halkanın o kadarı dolu
     sirada    kümenin sıradaki adımı: kalın halka
     bekliyor  soluk nokta
   Bağ: iki ucu da bittiyse dolu çizgi, yoksa ince kesik çizgi.
   Veri yoksa harita çizilmez, ne yapılırsa belireceği söylenir (§1.2:
   eksik veri sıfır değildir). Hareket yok; parıltı yok (§1.10). */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.AGHARITA = (function(){
  'use strict';

  const kac = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  const DURUMLAR = Object.freeze(['bitti', 'suruyor', 'sirada', 'bekliyor']);
  const DURUM_AD = Object.freeze({ bitti:'tamam', suruyor:'sürüyor', sirada:'sıradaki', bekliyor:'bekliyor' });
  const G = 900, Y = 700, CX = G / 2, CY = Y / 2;

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

  /* veri = { merkez:'Sınav', kumeler:[{ ad, dugumler:[{ ad, durum, ilerleme? }] }], bos? }
     Döner: HTML (SVG + kısa özet). */
  function html(veri){
    const v = veri || {};
    const kumeler = (v.kumeler || []).filter(k => k && k.dugumler && k.dugumler.length)
      .map(k => Object.assign({}, k, { dugumler:siraIsaretle(k.dugumler) }));
    if(!kumeler.length) return '<div class="agh agh--bos"><p>' + kac(v.bos || 'Henüz haritada gösterilecek bir şey yok.') + '</p></div>';
    const s = sayim(kumeler);
    const etiketli = s.toplam <= 48;
    const n = kumeler.length;
    const R1 = n === 1 ? 0 : Math.min(165, 80 + n * 11), R2 = Y / 2 - 34;
    let bag = '', dug = '', yazi = '';
    kumeler.forEach((k, ki) => {
      const aci = (-90 + ki * 360 / n) * Math.PI / 180;
      const hx = CX + Math.cos(aci) * R1, hy = CY + Math.sin(aci) * R1;
      const m = k.dugumler.length, bitenOran = k.dugumler.filter(d => d.durum === 'bitti').length / m;
      bag += '<line class="agh__bag' + (bitenOran >= 1 ? ' is-dolu' : '') + '" x1="' + CX + '" y1="' + CY + '" x2="' + hx.toFixed(1) + '" y2="' + hy.toFixed(1) + '"/>';
      /* Düğümler: kümenin yönünde merkezden dışarı açılan bir dal. Az düğüm
         tek sıra yay; kalabalıkta satır satır yelpaze, sıra zikzakla yürür
         (yol okunur kalsın, dış halkaya yığılmasın). */
      const yay = Math.min(2.2, (2 * Math.PI / n) * .8) * (n === 1 ? 1.6 : 1);
      const sutun = m <= 6 ? m : Math.ceil(Math.sqrt(m * 1.3)), satir = Math.ceil(m / sutun);
      let onceki = [hx, hy, 'bitti'];
      k.dugumler.forEach((d, i) => {
        const sa = Math.floor(i / sutun), su0 = i % sutun, su = sa % 2 ? sutun - 1 - su0 : su0;
        const r = satir === 1 ? R1 + 52 + (m === 1 ? 0 : (i / (m - 1)) * (R2 - R1 - 52) * .6) : R1 + 46 + sa * (R2 - R1 - 46) / Math.max(1, satir - 1);
        const a = aci + (sutun === 1 ? 0 : (su / (sutun - 1) - .5) * yay * Math.min(1, (r - R1 * .4) / (R2 * .9)));
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
        const dolu = onceki[2] === 'bitti' && d.durum === 'bitti';
        bag += '<line class="agh__bag agh__bag--yol' + (dolu ? ' is-dolu' : '') + '" x1="' + onceki[0].toFixed(1) + '" y1="' + onceki[1].toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>';
        const yc = d.durum === 'bekliyor' ? 3.6 : d.durum === 'bitti' ? 6 : 6.5;
        const il = typeof d.ilerleme === 'number' && d.ilerleme > 0 && d.ilerleme < 1 ? d.ilerleme : null;
        const cevre = 2 * Math.PI * (yc + 2.2);
        dug += '<g class="agh__dugum agh__dugum--' + d.durum + '"><title>' + kac(k.ad + ' · ' + d.ad + ' — ' + DURUM_AD[d.durum] + (il != null ? ' %' + Math.round(il * 100) : '')) + '</title>'
          + '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + yc + '"/>'
          + (il != null ? '<circle class="agh__ilerleme" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (yc + 2.2) + '" stroke-dasharray="' + (cevre * il).toFixed(1) + ' ' + cevre.toFixed(1)
            + '" transform="rotate(-90 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>' : '') + '</g>';
        if(etiketli) yazi += '<text class="agh__yazi agh__yazi--dugum" x="' + x.toFixed(1) + '" y="' + (y + yc + 12).toFixed(1) + '" text-anchor="middle">' + kac(String(d.ad).slice(0, 18)) + '</text>';
        onceki = [x, y, d.durum];
      });
      dug += '<g class="agh__kume"><title>' + kac(k.ad + ' · %' + Math.round(bitenOran * 100) + ' tamam') + '</title><circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="15"/>'
        + '<circle class="agh__ilerleme" cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="19" stroke-dasharray="' + (2 * Math.PI * 19 * bitenOran).toFixed(1) + ' ' + (2 * Math.PI * 19).toFixed(1)
        + '" transform="rotate(-90 ' + hx.toFixed(1) + ' ' + hy.toFixed(1) + ')"/></g>';
      yazi += '<text class="agh__yazi agh__yazi--kume" x="' + hx.toFixed(1) + '" y="' + (hy - 25).toFixed(1) + '" text-anchor="middle">' + kac(k.ad) + '</text>';
    });
    const ozet = s.bitti + ' tamam · ' + (s.suruyor + s.sirada) + ' yolda · ' + s.bekliyor + ' bekliyor';
    return '<div class="agh"><svg class="agh__svg" viewBox="0 0 ' + G + ' ' + Y + '" role="img" aria-label="' + kac((v.merkez || 'Hedef') + ' yol haritası: ' + s.toplam + ' adımdan ' + ozet) + '">'
      + '<g class="agh__baglar">' + bag + '</g>'
      + '<g class="agh__merkez"><circle cx="' + CX + '" cy="' + CY + '" r="26"/><text x="' + CX + '" y="' + (CY + 4) + '" text-anchor="middle">' + kac(String(v.merkez || 'Hedef').slice(0, 12)) + '</text></g>'
      + '<g class="agh__dugumler">' + dug + '</g><g class="agh__yazilar">' + yazi + '</g></svg>'
      + '<p class="agh__ozet"><i class="agh__lejant agh__lejant--bitti"></i>' + s.bitti + ' tamam <i class="agh__lejant agh__lejant--suruyor"></i>' + (s.suruyor + s.sirada)
      + ' yolda <i class="agh__lejant agh__lejant--bekliyor"></i>' + s.bekliyor + ' bekliyor</p></div>';
  }

  return Object.freeze({ html, DURUMLAR, DURUM_AD, _sayim:sayim, _sira:siraIsaretle });
})();
