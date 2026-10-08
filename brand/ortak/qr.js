/* QR — sıfır bağımlılıklı QR kodu (ISO/IEC 18004), yalnız bayt kipi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/qr.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne kopyalanır; seçim sayfası (4180) onu
   sunucu.py'den, telefon uygulaması hazirla.py'den alır.
   ==================================================================

   Neden burada: hesap sayfası iki yerde QR gösterir (AGENTS §1.3, paket
   yok): iki adımlı doğrulamanın kurulumu (otpauth adresi; Google
   Authenticator, Microsoft Authenticator, iPhone Şifreler okur) ve kodla
   cihaz bağlama (tabletin kamerası adresi açar).

   Kapsam bilerek dar: bayt kipi (UTF-8), sürüm 1–10, düzey L ya da M.
   Sürüm 10-M 213 bayt taşır; bir otpauth adresi ~110 bayttır. Sığmayan
   metin için null döner — yarım ya da bozuk bir kod çizilmez.

   Doğrulama (qr.test.js): Reed–Solomon artığı standardın «HELLO WORLD»
   1-M örneğiyle, biçim ve sürüm bitleri standardın tablolarıyla, bütün
   matris testteki bağımsız bir okuyucuyla (maskeyi biçim bitlerinden
   okuyup veriyi geri çıkarır) sınanır. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.QR = (function(){
  'use strict';

  const EN_COK_SURUM = 10;
  /* Blok başına hata düzeltme baytı ve blok sayısı (sürüm 1–10). */
  const DUZEY = {
    L:{ bit:1, ecc:[0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18], blok:[0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4] },
    M:{ bit:0, ecc:[0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26], blok:[0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5] },
  };

  /* ------------------------------------------------------- GF(256) */

  function carp(x, y){
    let z = 0;
    for(let i = 7; i >= 0; i--){
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xFF;
  }
  function bolen(derece){
    const r = new Array(derece).fill(0);
    r[derece - 1] = 1;
    let kok = 1;
    for(let i = 0; i < derece; i++){
      for(let j = 0; j < r.length; j++){
        r[j] = carp(r[j], kok);
        if(j + 1 < r.length) r[j] ^= r[j + 1];
      }
      kok = carp(kok, 0x02);
    }
    return r;
  }
  /* Reed–Solomon artığı: verinin hata düzeltme baytları. */
  function rs(veri, derece){
    const b = bolen(derece), r = new Array(derece).fill(0);
    veri.forEach(x => {
      const f = x ^ r.shift();
      r.push(0);
      b.forEach((c, i) => { r[i] ^= carp(c, f); });
    });
    return r;
  }

  /* ------------------------------------------------------- ölçüler */

  const boyutu = s => s * 4 + 17;
  function hamModul(s){
    let n = (16 * s + 128) * s + 64;
    if(s >= 2){
      const h = Math.floor(s / 7) + 2;
      n -= (25 * h - 10) * h - 55;
      if(s >= 7) n -= 36;
    }
    return n;
  }
  function veriBayti(s, d){ return Math.floor(hamModul(s) / 8) - DUZEY[d].ecc[s] * DUZEY[d].blok[s]; }
  function hizaKonum(s){
    if(s === 1) return [];
    const h = Math.floor(s / 7) + 2, n = boyutu(s);
    const adim = Math.ceil((s * 4 + 4) / (h * 2 - 2)) * 2;
    const l = [6];
    for(let p = n - 7; l.length < h; p -= adim) l.splice(1, 0, p);
    return l;
  }

  /* Biçim bitleri (15): düzey + maske, BCH(15,5), 0x5412 ile maskeli. */
  function bicimBitleri(d, maske){
    const veri = (DUZEY[d].bit << 3) | maske;
    let r = veri;
    for(let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    return ((veri << 10) | r) ^ 0x5412;
  }
  /* Sürüm bitleri (18), sürüm 7 ve üstü: BCH(18,6). */
  function surumBitleri(s){
    let r = s;
    for(let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
    return (s << 12) | r;
  }
  const bit = (x, i) => ((x >>> i) & 1) !== 0;

  const MASKE = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    x => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => x * y % 2 + x * y % 3 === 0,
    (x, y) => (x * y % 2 + x * y % 3) % 2 === 0,
    (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0,
  ];

  /* ------------------------------------------------------- veri */

  function utf8(metin){
    if(typeof TextEncoder === 'function') return Array.from(new TextEncoder().encode(metin));
    return Array.from(unescape(encodeURIComponent(metin)), c => c.charCodeAt(0));
  }

  /* Bayt kipi bit dizisi + dolgu; sığmazsa null. */
  function kodSozcukleri(bayt, s, d){
    const sayac = s < 10 ? 8 : 16, kapasite = veriBayti(s, d) * 8;
    if(4 + sayac + bayt.length * 8 > kapasite) return null;
    const bitler = [];
    const ekle = (v, n) => { for(let i = n - 1; i >= 0; i--) bitler.push((v >>> i) & 1); };
    ekle(0b0100, 4);
    ekle(bayt.length, sayac);
    bayt.forEach(b => ekle(b, 8));
    ekle(0, Math.min(4, kapasite - bitler.length));
    ekle(0, (8 - bitler.length % 8) % 8);
    for(let p = 0xEC; bitler.length < kapasite; p ^= 0xEC ^ 0x11) ekle(p, 8);
    const out = [];
    for(let i = 0; i < bitler.length; i += 8){
      let b = 0;
      for(let j = 0; j < 8; j++) b = (b << 1) | bitler[i + j];
      out.push(b);
    }
    return out;
  }

  /* Bloklara böl, her bloğa hata düzeltme ekle, sırayla ör. */
  function or(veri, s, d){
    const nBlok = DUZEY[d].blok[s], ecc = DUZEY[d].ecc[s];
    const ham = Math.floor(hamModul(s) / 8);
    const kisaSay = nBlok - ham % nBlok, kisaBoy = Math.floor(ham / nBlok);
    const bloklar = [];
    let k = 0;
    for(let i = 0; i < nBlok; i++){
      const parca = veri.slice(k, k + kisaBoy - ecc + (i < kisaSay ? 0 : 1));
      k += parca.length;
      const e = rs(parca, ecc);
      if(i < kisaSay) parca.push(0);
      bloklar.push(parca.concat(e));
    }
    const out = [];
    for(let i = 0; i < bloklar[0].length; i++){
      bloklar.forEach((b, j) => { if(i !== kisaBoy - ecc || j >= kisaSay) out.push(b[i]); });
    }
    return out;
  }

  /* ------------------------------------------------------- matris */

  function yeniMatris(s){
    const n = boyutu(s);
    const modul = Array.from({ length:n }, () => new Array(n).fill(false));
    const islev = Array.from({ length:n }, () => new Array(n).fill(false));
    const koy = (x, y, koyu) => { modul[y][x] = koyu; islev[y][x] = true; };
    for(let i = 0; i < n; i++){ koy(6, i, i % 2 === 0); koy(i, 6, i % 2 === 0); }
    [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([cx, cy]) => {
      for(let dy = -4; dy <= 4; dy++) for(let dx = -4; dx <= 4; dx++){
        const x = cx + dx, y = cy + dy, u = Math.max(Math.abs(dx), Math.abs(dy));
        if(x >= 0 && x < n && y >= 0 && y < n) koy(x, y, u !== 2 && u !== 4);
      }
    });
    const h = hizaKonum(s), son = h.length - 1;
    h.forEach((cx, i) => h.forEach((cy, j) => {
      if((i === 0 && j === 0) || (i === 0 && j === son) || (i === son && j === 0)) return;
      for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++){
        koy(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }));
    bicimKoy({ modul, islev, n, koy }, 'M', 0);           // yer ayrılır, sonra yazılır
    if(s >= 7){
      const v = surumBitleri(s);
      for(let i = 0; i < 18; i++){
        const a = n - 11 + i % 3, b = Math.floor(i / 3);
        koy(a, b, bit(v, i));
        koy(b, a, bit(v, i));
      }
    }
    return { modul, islev, n, koy };
  }

  function bicimKoy(m, d, maske){
    const v = bicimBitleri(d, maske), n = m.n, koy = m.koy;
    for(let i = 0; i <= 5; i++) koy(8, i, bit(v, i));
    koy(8, 7, bit(v, 6));
    koy(8, 8, bit(v, 7));
    koy(7, 8, bit(v, 8));
    for(let i = 9; i < 15; i++) koy(14 - i, 8, bit(v, i));
    for(let i = 0; i < 8; i++) koy(n - 1 - i, 8, bit(v, i));
    for(let i = 8; i < 15; i++) koy(8, n - 15 + i, bit(v, i));
    koy(8, n - 8, true);                                   // her zaman koyu modül
  }

  /* Kod sözcükleri sağ alttan başlayıp iki sütunluk zikzakla yerleşir. */
  function yerlestir(m, veri){
    const n = m.n;
    let i = 0;
    for(let sag = n - 1; sag >= 1; sag -= 2){
      if(sag === 6) sag = 5;
      for(let dik = 0; dik < n; dik++){
        for(let j = 0; j < 2; j++){
          const x = sag - j, yukari = ((sag + 1) & 2) === 0, y = yukari ? n - 1 - dik : dik;
          if(!m.islev[y][x] && i < veri.length * 8){
            m.modul[y][x] = bit(veri[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  function maskele(m, k){
    const f = MASKE[k];
    for(let y = 0; y < m.n; y++) for(let x = 0; x < m.n; x++){
      if(!m.islev[y][x] && f(x, y)) m.modul[y][x] = !m.modul[y][x];
    }
  }

  /* Ceza puanı (standardın dört kuralı): en okunur maskeyi seçmek için. */
  function ceza(m){
    const n = m.n, a = m.modul;
    let p = 0, koyu = 0;
    const satir = (al) => {
      for(let i = 0; i < n; i++){
        let renk = al(i, 0), uzun = 1;
        const dizi = [];
        for(let j = 0; j < n; j++){
          const c = al(i, j);
          dizi.push(c ? 1 : 0);
          if(j === 0) continue;
          if(c === renk){ uzun++; if(uzun === 5) p += 3; else if(uzun > 5) p++; }
          else{ renk = c; uzun = 1; }
        }
        const s = dizi.join('');
        for(let k = s.indexOf('1011101'); k >= 0; k = s.indexOf('1011101', k + 1)){
          const once = s.slice(Math.max(0, k - 4), k), sonra = s.slice(k + 7, k + 11);
          if((k >= 4 && once === '0000') || (k + 11 <= n && sonra === '0000')) p += 40;
        }
      }
    };
    satir((i, j) => a[i][j]);
    satir((i, j) => a[j][i]);
    for(let y = 0; y < n - 1; y++) for(let x = 0; x < n - 1; x++){
      const c = a[y][x];
      if(c === a[y][x + 1] && c === a[y + 1][x] && c === a[y + 1][x + 1]) p += 3;
    }
    for(let y = 0; y < n; y++) for(let x = 0; x < n; x++) if(a[y][x]) koyu++;
    const toplam = n * n;
    p += (Math.ceil(Math.abs(koyu * 20 - toplam * 10) / toplam) - 1) * 10;
    return p;
  }

  /* metin -> { surum, boyut, maske, duzey, modul:[[bool]] } ya da null. */
  function matris(metin, o){
    const d = o && DUZEY[o.duzey] ? o.duzey : 'M';
    const bayt = utf8(String(metin == null ? '' : metin));
    let s = 1, veri = null;
    for(; s <= EN_COK_SURUM; s++){ veri = kodSozcukleri(bayt, s, d); if(veri) break; }
    if(!veri) return null;
    const tum = or(veri, s, d);
    let en = null;
    for(let k = 0; k < 8; k++){
      if(o && typeof o.maske === 'number' && o.maske !== k) continue;
      const m = yeniMatris(s);
      yerlestir(m, tum);
      maskele(m, k);
      bicimKoy(m, d, k);
      const c = o && typeof o.maske === 'number' ? 0 : ceza(m);
      if(!en || c < en.c) en = { m, c, k };
    }
    return { surum:s, boyut:en.m.n, maske:en.k, duzey:d, modul:en.m.modul };
  }

  /* SVG: açık zemin, koyu modül, 4 modüllük sessiz kenar. Renk temadan
     bağımsızdır — okuyucuların çoğu ters (açık üstüne koyu olmayan) kodu
     okumaz. */
  function svg(metin, o){
    const q = matris(metin, o);
    if(!q) return '';
    const k = 4, n = q.boyut + k * 2;
    let yol = '';
    q.modul.forEach((satir, y) => satir.forEach((koyu, x) => {
      if(koyu) yol += 'M' + (x + k) + ' ' + (y + k) + 'h1v1h-1z';
    }));
    const etiket = String((o && o.etiket) || 'QR kodu').replace(/[&<>"]/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
    return '<svg class="qr" viewBox="0 0 ' + n + ' ' + n + '" role="img" aria-label="' + etiket + '"'
      + ' shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">'
      + '<rect width="' + n + '" height="' + n + '" fill="#fff"/><path fill="#000" d="' + yol + '"/></svg>';
  }

  return Object.freeze({ matris, svg, _rs:rs, _bicim:bicimBitleri, _surum:surumBitleri, _hiza:hizaKonum,
    _veriBayti:veriBayti, EN_COK_SURUM });
})();
