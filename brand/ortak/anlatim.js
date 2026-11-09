/* ANLATIM — King'in anlatımına grafik, tablo ve görsel yerleştirmek (görsel öğrenme).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/anlatim.js`; `python3 tools/ortak.py --yay` ile üç arayüzün
   `src/js/core/` klasörüne birebir kopyalanır. Kopyayı elle düzenleme.
   ==================================================================

   Kullanıcı (2026-11-09): «konuyu anlatırken araya görsel sıkıştırarak ya da grafik, tablo çıkararak
   anlatsın». Metin üç biçimde zenginleşir; model de kural da aynı dili kullanır:
     [[grafik: x^2 - 4; -5..5]]   fonksiyon grafiği (SVG). İfade GÜVENLİ ayrıştırıcıyla okunur: eval yok;
                                   yalnız x, sayı, + - * / ^, parantez, sin cos tan sqrt kök abs ln log exp, pi, e.
     [[görsel: hücre zarı]]       konunun lisanslı görseli (Merkez /api/gorsel; yazar, lisans, kaynak).
     | a | b | … tablosu          markdown tablo → HTML tablo.
   Ayrıca metinde «f(x) = …» ya da «y = …» geçen ve çizilebilen ilk ifade kendiliğinden grafik olur. */
window.LIFEOS = window.LIFEOS || {};
window.LIFEOS.ANLATIM = (function(){
  /* ---------- güvenli ifade ayrıştırıcı: «2x^2 - 3sin(x) + √x» → f(x) | null ---------- */
  const FONK = { sin:Math.sin, cos:Math.cos, tan:Math.tan, sqrt:Math.sqrt, kok:Math.sqrt, abs:Math.abs, ln:Math.log,
    log:x => Math.log10(x), exp:Math.exp };
  function ifadeCoz(ham){
    let s = String(ham || '').toLocaleLowerCase('tr').replace(/\s+/g, '')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt').replace(/kök/g, 'kok').replace(/π/g, 'pi')
      .replace(/·|×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.');
    if(!s || s.length > 80 || /[^0-9a-z.+\-*/^()]/.test(s)) return null;
    let i = 0;
    const bak = () => s[i];
    function sayi(){ const m = /^\d+(?:\.\d+)?/.exec(s.slice(i)); if(!m) return null; i += m[0].length; const v = Number(m[0]); return () => v; }
    function birincil(){
      if(bak() === '('){ i++; const e = toplam(); if(bak() !== ')') throw 0; i++; return e; }
      if(bak() === '-'){ i++; const e = us(); return x => -e(x); }
      const n = sayi(); if(n) return n;
      const m = /^[a-z]+/.exec(s.slice(i));
      if(!m) throw 0;
      const ad = m[0];
      if(ad === 'x'){ i++; return x => x; }
      if(ad === 'pi'){ i += 2; return () => Math.PI; }
      if(ad === 'e' && !/^exp/.test(s.slice(i))){ i++; return () => Math.E; }
      const f = Object.keys(FONK).sort((a, b) => b.length - a.length).find(k => s.slice(i).indexOf(k) === 0);
      if(!f) throw 0;
      i += f.length;
      const arg = bak() === '(' ? birincil() : us();      // «sin x» parantezsiz de olur
      return x => FONK[f](arg(x));
    }
    function us(){ const a = birincil(); if(bak() === '^'){ i++; const b = us(); return x => Math.pow(a(x), b(x)); } return a; }
    function carpim(){
      let a = us();
      for(;;){
        const c = bak();
        if(c === '*' || c === '/'){ i++; const b = us(), a0 = a; a = c === '*' ? x => a0(x) * b(x) : x => a0(x) / b(x); }
        else if(c && /[0-9a-z(]/.test(c)){ const b = us(), a0 = a; a = x => a0(x) * b(x); }   // «2x», «3sin(x)»
        else return a;
      }
    }
    function toplam(){
      let a = carpim();
      while(bak() === '+' || bak() === '-'){ const c = s[i++], b = carpim(), a0 = a; a = c === '+' ? x => a0(x) + b(x) : x => a0(x) - b(x); }
      return a;
    }
    try{ const f = toplam(); if(i !== s.length) return null; const d = f(1.234); return isFinite(d) || isNaN(d) ? f : null; }catch(e){ return null; }
  }

  /* ---------- SVG grafik: eksenler, ızgara, eğri (süreksizlikte kesilir) ---------- */
  function grafikSvg(ifade, a, b, kac){
    const f = ifadeCoz(ifade);
    if(!f) return '';
    a = isFinite(a) ? a : -5; b = isFinite(b) && b > a ? b : 5;
    const N = 160, pts = [];
    for(let k = 0; k <= N; k++){ const x = a + (b - a) * k / N, y = f(x); pts.push([x, isFinite(y) ? y : null]); }
    const ys = pts.map(p => p[1]).filter(y => y != null).sort((p, q) => p - q);
    if(ys.length < 2) return '';
    let y0 = ys[Math.floor(ys.length * 0.02)], y1 = ys[Math.ceil(ys.length * 0.98) - 1];
    if(y1 - y0 < 1e-9){ y0 -= 1; y1 += 1; }
    const pad = (y1 - y0) * 0.08; y0 -= pad; y1 += pad;
    const W = 320, H = 200, L = 30, R = 8, T = 8, B = 22;
    const X = x => L + (x - a) * (W - L - R) / (b - a), Y = y => T + (y1 - y) * (H - T - B) / (y1 - y0);
    let yol = '', ac = false;
    pts.forEach(([x, y]) => {
      if(y == null || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)){ ac = false; return; }
      yol += (ac ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(y).toFixed(1); ac = true;
    });
    const tik = (u, v) => { const r = (v - u) / 4; return [0, 1, 2, 3, 4].map(j => u + r * j); };
    const yaz = v => String(Math.round(v * 10) / 10).replace('.', ',');
    const izgara = tik(a, b).map(x => '<line x1="' + X(x) + '" x2="' + X(x) + '" y1="' + T + '" y2="' + (H - B) + '" class="ag-izgara"/><text x="' + X(x) + '" y="' + (H - 6) + '" class="ag-etiket" text-anchor="middle">' + yaz(x) + '</text>').join('')
      + tik(y0, y1).map(y => '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(y) + '" y2="' + Y(y) + '" class="ag-izgara"/><text x="' + (L - 4) + '" y="' + (Y(y) + 3) + '" class="ag-etiket" text-anchor="end">' + yaz(y) + '</text>').join('');
    const eksen = (a <= 0 && b >= 0 ? '<line x1="' + X(0) + '" x2="' + X(0) + '" y1="' + T + '" y2="' + (H - B) + '" class="ag-eksen"/>' : '')
      + (y0 <= 0 && y1 >= 0 ? '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" class="ag-eksen"/>' : '');
    const ad = (kac || (z => z))('y = ' + ifade);
    return '<figure class="king__grafik"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + ad + ', x ' + yaz(a) + ' ile ' + yaz(b) + ' arası">'
      + izgara + eksen + '<path d="' + yol + '" class="ag-egri" fill="none"/></svg><figcaption>' + ad + '</figcaption></figure>';
  }

  /* ---------- metni zenginleştir: { metin, ekler:[{tur:'grafik'|'tablo'|'gorsel', …}] } ---------- */
  const IS_GRAFIK = /\[\[\s*grafik\s*:\s*([^;\]]+?)\s*(?:;\s*(-?\d+(?:[.,]\d+)?)\s*\.\.\s*(-?\d+(?:[.,]\d+)?))?\s*\]\]/gi;
  const IS_GORSEL = /\[\[\s*(?:görsel|gorsel|resim)\s*:\s*([^\]]{2,60}?)\s*\]\]/gi;
  const OTO = /(?:^|[\s(])(?:f\(x\)|y)\s*=\s*([0-9x+\-*/^().,²³√πa-zçğıöşü\s]{1,40}?)(?=$|[\n;]|,\s|\.\s|\.$|\s(?:ise|olsun|için|fonksiyon|doğru|eğri|parabol))/i;
  function zenginlestir(metin){
    let t = String(metin || '');
    const ekler = [];
    t = t.replace(IS_GRAFIK, (m, e, a, b) => { if(ifadeCoz(e)) ekler.push({ tur:'grafik', ifade:e.trim(), a:a != null ? Number(a.replace(',', '.')) : -5, b:b != null ? Number(b.replace(',', '.')) : 5 }); return ''; });
    t = t.replace(IS_GORSEL, (m, k) => { ekler.push({ tur:'gorsel', konu:k.trim() }); return ''; });
    /* Markdown tablo: en az iki satır «| … |»; ayraç satırı («|---|») atılır. */
    t = t.replace(/(?:^|\n)((?:[ \t]*\|[^\n]*\|[ \t]*(?:\n|$)){2,})/g, (m, blok) => {
      const satir = blok.trim().split('\n').map(x => x.trim().replace(/^\||\|$/g, '').split('|').map(h => h.trim()))
        .filter(r => !r.every(h => /^:?-{2,}:?$/.test(h)));
      if(satir.length >= 2 && satir[0].length >= 2){ ekler.push({ tur:'tablo', baslik:satir[0], satirlar:satir.slice(1, 13) }); return '\n'; }
      return m;
    });
    if(!ekler.some(e => e.tur === 'grafik')){
      const o = OTO.exec(t);
      if(o && /x/.test(o[1]) && ifadeCoz(o[1])) ekler.push({ tur:'grafik', ifade:o[1].trim(), a:-5, b:5, kendiliginden:true });
    }
    return { metin:t.replace(/\n{3,}/g, '\n\n').trim(), ekler };
  }

  function tabloHtml(e, kac){
    const k = kac || (z => z);
    return '<div class="king__tablo-kap"><table class="king__tablo"><thead><tr>' + e.baslik.map(h => '<th>' + k(h) + '</th>').join('') + '</tr></thead><tbody>'
      + e.satirlar.map(r => '<tr>' + e.baslik.map((h, j) => '<td>' + k(r[j] || '') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  }

  return { ifadeCoz, grafikSvg, zenginlestir, tabloHtml };
})();
