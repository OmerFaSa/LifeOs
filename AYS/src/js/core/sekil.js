/* ŞEKİL VE TABLO — Öğren'in sorularında, örneklerinde ve anlatımında çizim.

   Kullanıcı (2026-10-10): «şekilli soru yok; hepsini çok profesyonel
   şekilde çöz». Geometri, grafik, devre, optik, soyağacı, nüfus piramidi
   gibi konularda sınav sorusu şekilsiz sorulmaz. Bu dosya içerik
   dosyalarındaki (data/anlatim-*.js, data/derin-*.js, data/paragraf.js)
   küçük bir çizim tarifini SVG'ye, tablo tarifini HTML tabloya çevirir.

   Sözler:
     1. İÇERİKTE İŞARETLEME YOK, TARİF VAR. Veri dosyası SVG ya da HTML
        yazmaz; kapalı bir öğe kataloğundan (TUR) diziler yazar. Bütün
        yazılar kaçırılır, sayılar sonlu ve sınırlı olmak zorundadır.
        İçerikten ekrana betik ya da öznitelik sızamaz (denetle()).
     2. TEMA KODDA. Çizgi ve yazı currentColor'dır, vurgu --accent'tir;
        koyu ve açık temada, bütün paletlerde aynı çizim okunur.
     3. ŞEKLİN METNİ VAR. Her şeklin zorunlu bir «alt» cümlesi vardır:
        ekran okuyucu onu okur; kart, yanlış defteri ve koç gibi düz metin
        giden yerler de şekli bu cümleyle anlatır (metni()). Tablo da düz
        metne satır satır çevrilir.
     4. KOORDİNAT SVG'NİN. (0,0) sol üst; y aşağı doğru artar. Yalnız yay
        açıları matematik yönündedir: 0° sağ, 90° yukarı.

   Öğe kataloğu — her öğe bir dizi: [tür, …sayılar, (yazı), (bayrak)]
     ['c',  x1,y1,x2,y2, b]          doğru parçası
     ['ok', x1,y1,x2,y2, b]          ok (uçta ok başı; b'de 'ç' ise iki uç)
     ['p',  [x,y,…], b]              kapalı çokgen
     ['y',  [x,y,…], b]              açık kırık çizgi / grafik eğrisi
     ['d',  cx,cy,r, b]              çember (g: gölgeli, f: dolu)
     ['n',  x,y, b]                  nokta
     ['t',  x,y,'yazı', b]           yazı (s: sola, e: sağa yaslı; k: küçük; b: kalın)
     ['a',  cx,cy,r,a1,a2, b]        yay (a1'den a2'ye, saat yönünün tersine)
     ['dk', x,y, x1,y1, x2,y2]       dik açı işareti (köşe, iki kol üstünde birer nokta)
     ['r',  x,y,w,h, b]              dikdörtgen
     ['e',  x0,y0, x1,y1, 'x','y']   eksen takımı: başlangıç, x ucu, y ucu, etiketler
     ['tr', x1,y1,x2,y2]             taralı yüzey (ayna, duvar, zemin): soldaki yana tarama
     ['dr', x1,y1,x2,y2,'R']         direnç (yatay ya da dikey kablo üstünde)
     ['pil',x,y,'y'|'d','ε']         üreteç (yatay ya da dikey kabloda; uzun levha +)
     ['mr', x,y,h,'ince'|'kalin']    mercek (dikey; ince kenarlı yakınsak, kalın kenarlı ıraksak)
   Bayraklar (b, isteğe bağlı yazı): k kesik, v vurgu, i ince, g gölge, f dolu. */

window.R = window.R || {};

R.Sekil = (function(){
  /* Tür → { n: sayı argümanı adedi, d: dizi argümanı mı, y: yazı argümanı adedi } */
  const TUR = {
    c:{ n:4 }, ok:{ n:4 }, p:{ d:true }, y:{ d:true }, d:{ n:3 }, n:{ n:2 }, t:{ n:2, y:1 },
    a:{ n:5 }, dk:{ n:6 }, r:{ n:4 }, e:{ n:4, y:2 }, tr:{ n:4 }, dr:{ n:4, y:1 }, pil:{ n:2, y:2 }, mr:{ n:3, y:1 },
  };
  const SINIR = 2000;
  const esc = s => (R.U && R.U.esc ? R.U.esc(s) : String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'));
  const sayi = v => Math.round(Number(v) * 10) / 10;
  const bayrak = (o, i) => typeof o[i] === 'string' ? o[i] : '';

  /* ---------- denetim (söz 1) ---------- */

  /* Bir şekil tarifinin kusurları; boş dizi = temiz. */
  function denetle(s){
    const h = [];
    if(!s || typeof s !== 'object') return ['şekil nesne değil'];
    const w = Number(s.w), hh = Number(s.h);
    if(!(w >= 80 && w <= 480)) h.push('genişlik 80–480 olmalı');
    if(!(hh >= 40 && hh <= 360)) h.push('yükseklik 40–360 olmalı');
    const alt = String(s.alt || '');
    if(alt.trim().length < 15) h.push('alt cümlesi yok ya da çok kısa');
    if(alt.length > 400) h.push('alt cümlesi çok uzun');
    if(/[<>]|\*\*|[\^_]\{/.test(alt)) h.push('alt cümlesinde işaret');
    if(!Array.isArray(s.o) || !s.o.length) h.push('öğe yok');
    else s.o.forEach((o, k) => {
      const ad = 'öğe ' + (k + 1);
      if(!Array.isArray(o) || !TUR[o[0]]){ h.push(ad + ': bilinmeyen tür'); return; }
      const t = TUR[o[0]];
      let i = 1;
      if(t.d){
        const l = o[1];
        if(!Array.isArray(l) || l.length < 4 || l.length % 2) h.push(ad + ': nokta dizisi bozuk');
        else if(l.some(v => !isFinite(v) || Math.abs(v) > SINIR)) h.push(ad + ': sayı sınır dışı');
        i = 2;
      }else{
        for(let j = 0; j < t.n; j++){
          const v = o[1 + j];
          if(typeof v !== 'number' || !isFinite(v) || Math.abs(v) > SINIR) h.push(ad + ': ' + (j + 1) + '. sayı geçersiz');
        }
        i = 1 + t.n;
      }
      for(let j = 0; j < (t.y || 0); j++){
        const v = o[i + j];
        if(v != null && (typeof v !== 'string' || v.length > 40 || /[<>]|\*\*|[\^_]\{/.test(v))) h.push(ad + ': yazı geçersiz');
      }
      const b = o[i + (t.y || 0)];
      if(b != null && (typeof b !== 'string' || !/^[kvigfçsebo]*$/.test(b))) h.push(ad + ': bayrak geçersiz');
      if(o.length > i + (t.y || 0) + 1) h.push(ad + ': fazla argüman');
    });
    return h;
  }
  function tabloDenetle(t){
    const h = [];
    if(!t || typeof t !== 'object') return ['tablo nesne değil'];
    if(!Array.isArray(t.bas) || t.bas.length < 2 || t.bas.length > 8) h.push('başlık 2–8 sütun olmalı');
    if(!Array.isArray(t.satir) || !t.satir.length || t.satir.length > 14) h.push('satır 1–14 olmalı');
    else t.satir.forEach((r, k) => {
      if(!Array.isArray(r) || r.length !== (t.bas || []).length) h.push((k + 1) + '. satır sütun sayısı tutmuyor');
      else if(r.some(v => typeof v !== 'string' && typeof v !== 'number')) h.push((k + 1) + '. satırda geçersiz hücre');
    });
    if(t.baslik != null && (typeof t.baslik !== 'string' || t.baslik.length > 120)) h.push('tablo başlığı geçersiz');
    return h;
  }

  /* ---------- çizim (söz 2, 4) ---------- */

  function sinif(b, ek){
    const l = ['sk', ek || 'sk-c'];
    if(b.indexOf('k') >= 0) l.push('sk-k');
    if(b.indexOf('v') >= 0) l.push('sk-v');
    if(b.indexOf('i') >= 0) l.push('sk-i');
    if(b.indexOf('g') >= 0) l.push('sk-g');
    if(b.indexOf('f') >= 0) l.push('sk-f');
    return l.join(' ');
  }
  function okBasi(x1, y1, x2, y2, b){
    const a = Math.atan2(y2 - y1, x2 - x1), L = 8, W = 3.6;
    const bx = x2 - L * Math.cos(a), by = y2 - L * Math.sin(a);
    const p = [x2, y2, bx + W * Math.sin(a), by - W * Math.cos(a), bx - W * Math.sin(a), by + W * Math.cos(a)];
    return '<polygon class="' + sinif(b.replace(/[gk]/g, ''), 'sk-uc') + '" points="' + p.map(sayi).join(' ') + '"/>';
  }
  function cizgi(x1, y1, x2, y2, b){
    return '<line class="' + sinif(b) + '" x1="' + sayi(x1) + '" y1="' + sayi(y1) + '" x2="' + sayi(x2) + '" y2="' + sayi(y2) + '"/>';
  }
  function yazi(x, y, m, b){
    const anchor = b.indexOf('s') >= 0 ? 'start' : b.indexOf('e') >= 0 ? 'end' : 'middle';
    const l = ['sk-t'];
    if(b.indexOf('k') >= 0) l.push('sk-tk');
    if(b.indexOf('b') >= 0) l.push('sk-tb');
    if(b.indexOf('v') >= 0) l.push('sk-tv');
    return '<text class="' + l.join(' ') + '" x="' + sayi(x) + '" y="' + sayi(y) + '" text-anchor="' + anchor
      + '" dominant-baseline="central">' + esc(m) + '</text>';
  }
  const OGE = {
    c(o){ return cizgi(o[1], o[2], o[3], o[4], bayrak(o, 5)); },
    ok(o){
      const b = bayrak(o, 5);
      return cizgi(o[1], o[2], o[3], o[4], b) + okBasi(o[1], o[2], o[3], o[4], b)
        + (b.indexOf('ç') >= 0 ? okBasi(o[3], o[4], o[1], o[2], b) : '');
    },
    p(o){ return '<polygon class="' + sinif(bayrak(o, 2)) + '" points="' + o[1].map(sayi).join(' ') + '"/>'; },
    y(o){ return '<polyline class="' + sinif(bayrak(o, 2)) + '" points="' + o[1].map(sayi).join(' ') + '"/>'; },
    d(o){ return '<circle class="' + sinif(bayrak(o, 4)) + '" cx="' + sayi(o[1]) + '" cy="' + sayi(o[2]) + '" r="' + sayi(o[3]) + '"/>'; },
    n(o){ return '<circle class="' + sinif(bayrak(o, 3) + 'f', 'sk-c') + '" cx="' + sayi(o[1]) + '" cy="' + sayi(o[2]) + '" r="2.6"/>'; },
    t(o){ return yazi(o[1], o[2], o[3], bayrak(o, 4)); },
    a(o){
      const [cx, cy, r, a1, a2] = o.slice(1, 6), b = bayrak(o, 6);
      const rad = d => d * Math.PI / 180;
      const x1 = cx + r * Math.cos(rad(a1)), y1 = cy - r * Math.sin(rad(a1));
      const x2 = cx + r * Math.cos(rad(a2)), y2 = cy - r * Math.sin(rad(a2));
      let fark = ((a2 - a1) % 360 + 360) % 360;
      const buyuk = fark > 180 ? 1 : 0;
      return '<path class="' + sinif(b) + '" d="M' + sayi(x1) + ' ' + sayi(y1) + ' A' + sayi(r) + ' ' + sayi(r) + ' 0 ' + buyuk + ' 0 '
        + sayi(x2) + ' ' + sayi(y2) + '"/>';
    },
    dk(o){
      const [x, y, x1, y1, x2, y2] = o.slice(1, 7), s = 8;
      const birim = (dx, dy) => { const L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
      const u = birim(x1 - x, y1 - y), v = birim(x2 - x, y2 - y);
      const p = [x + u[0] * s, y + u[1] * s, x + u[0] * s + v[0] * s, y + u[1] * s + v[1] * s, x + v[0] * s, y + v[1] * s];
      return '<polyline class="sk sk-c sk-i" points="' + p.map(sayi).join(' ') + '"/>';
    },
    r(o){ return '<rect class="' + sinif(bayrak(o, 5)) + '" x="' + sayi(o[1]) + '" y="' + sayi(o[2]) + '" width="' + sayi(o[3])
      + '" height="' + sayi(o[4]) + '"/>'; },
    e(o){
      const [x0, y0, x1, y1] = o.slice(1, 5);
      const ex = o[5] || '', ey = o[6] || '';
      return cizgi(x0, y0, x1, y0, '') + okBasi(x0, y0, x1, y0, '') + cizgi(x0, y0, x0, y1, '') + okBasi(x0, y0, x0, y1, '')
        + (ex ? yazi(x1, y0 + 12, ex, 'k') : '') + (ey ? yazi(x0 - 4, y1, ey, 'ke') : '');
    },
    tr(o){
      const [x1, y1, x2, y2] = o.slice(1, 5);
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      /* Sol normal (yön vektörünün solu): (uy, -ux) SVG'de görsel olarak sol. */
      const nx = uy, ny = -ux;
      let s = cizgi(x1, y1, x2, y2, '');
      for(let d = 4; d < L; d += 7){
        const px = x1 + ux * d, py = y1 + uy * d;
        s += cizgi(px, py, px + (nx - ux) * 4.5, py + (ny - uy) * 4.5, 'i');
      }
      return s;
    },
    dr(o){
      const [x1, y1, x2, y2] = o.slice(1, 5), et = o[5] || '';
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, yw = 13, yh = 5;
      const a = [mx - ux * yw, my - uy * yw], b2 = [mx + ux * yw, my + uy * yw];
      const kose = [a[0] - uy * yh, a[1] + ux * yh, b2[0] - uy * yh, b2[1] + ux * yh, b2[0] + uy * yh, b2[1] - ux * yh, a[0] + uy * yh, a[1] - ux * yh];
      return cizgi(x1, y1, a[0], a[1], '') + cizgi(b2[0], b2[1], x2, y2, '')
        + '<polygon class="sk sk-c sk-zemin" points="' + kose.map(sayi).join(' ') + '"/>'
        + (et ? yazi(mx + uy * 14, my - ux * 14, et, 'k') : '');
    },
    pil(o){
      const [x, y] = o.slice(1, 3), yon = o[3] === 'd' ? 'd' : 'y', et = o[4] || '';
      if(yon === 'y'){
        return cizgi(x - 3, y - 10, x - 3, y + 10, '') + cizgi(x + 3, y - 5, x + 3, y + 5, '')
          + (et ? yazi(x, y - 17, et, 'k') : '');
      }
      return cizgi(x - 10, y - 3, x + 10, y - 3, '') + cizgi(x - 5, y + 3, x + 5, y + 3, '')
        + (et ? yazi(x + 18, y, et, 'ks') : '');
    },
    mr(o){
      const [x, y, h] = o.slice(1, 4), ince = o[4] !== 'kalin';
      const ust = y - h / 2, alt = y + h / 2;
      return cizgi(x, ust, x, alt, '') + (ince
        ? okBasi(x, ust + 8, x, ust, '') + okBasi(x, alt - 8, x, alt, '')
        : okBasi(x, ust, x, ust + 8, '') + okBasi(x, alt, x, alt - 8, ''));
    },
  };

  /* Şekil tarifi → <figure><svg>…</svg></figure>. Kusurlu tarif çizilmez;
     yerine alt cümlesi yazılır (ekran boş kalmasın, kusur gizlenmesin). */
  function svg(s){
    if(!s) return '';
    const kusur = denetle(s);
    if(kusur.length) return '<p class="sekil sekil--kusur small dim">' + esc('Şekil çizilemedi: ' + String((s && s.alt) || kusur[0])) + '</p>';
    const ic = s.o.map(o => OGE[o[0]](o)).join('');
    return '<figure class="sekil"><svg class="sekil__svg" viewBox="0 0 ' + sayi(s.w) + ' ' + sayi(s.h) + '" width="' + sayi(s.w * 1.4)
      + '" role="img" aria-label="' + esc(s.alt) + '" focusable="false">' + ic + '</svg></figure>';
  }

  /* Tablo tarifi → <table>. Hücreler metin işaretlerini (**kalın**, x^{2})
     tek ayrıştırıcıdan alır (core/ogren.js metinHtml). */
  function tablo(t){
    if(!t || tabloDenetle(t).length) return '';
    const f = v => (R.Ogren && R.Ogren.metinHtml ? R.Ogren.metinHtml(String(v)) : esc(String(v)));
    return '<div class="ogr-tablo-kap"><table class="ogr-tablo">'
      + (t.baslik ? '<caption>' + f(t.baslik) + '</caption>' : '')
      + '<thead><tr>' + t.bas.map(b => '<th scope="col">' + f(b) + '</th>').join('') + '</tr></thead>'
      + '<tbody>' + t.satir.map(r => '<tr>' + r.map((v, k) => k === 0 ? '<th scope="row">' + f(v) + '</th>' : '<td>' + f(v) + '</td>').join('') + '</tr>').join('')
      + '</tbody></table></div>';
  }

  /* ---------- düz metin karşılığı (söz 3) ---------- */
  function metni(s){ return s && s.alt ? '[Şekil: ' + String(s.alt).trim() + ']' : ''; }
  function tabloMetni(t){
    if(!t || tabloDenetle(t).length) return '';
    const d = v => (R.Ogren && R.Ogren.duzMetin ? R.Ogren.duzMetin(String(v)) : String(v));
    return '[Tablo' + (t.baslik ? ' — ' + d(t.baslik) : '') + ': ' + t.bas.map(d).join(' | ') + '; '
      + t.satir.map(r => r.map(d).join(' | ')).join('; ') + ']';
  }
  /* Bir sorunun (ya da örneğin) şekil ve tablosunun düz metni, boşsa ''. */
  function ekMetni(q){
    if(!q) return '';
    return [metni(q.sekil), tabloMetni(q.tablo)].filter(Boolean).join(' ');
  }

  return { TUR, denetle, tabloDenetle, svg, tablo, metni, tabloMetni, ekMetni };
})();
