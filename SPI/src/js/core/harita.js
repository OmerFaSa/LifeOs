/* HARİTA — rotayı sokak haritasının üstünde çizer. Kitaplık yok: Web
   Mercator izdüşümü, OpenStreetMap karoları ve çizgi tek bir SVG'dir.

   Sözler:
     1. ZEMİN SÜSTÜR, ROTA BİLGİDİR. Karolar internetten gelir; bağlantı
        yoksa ya da sunucu cevap vermezse yerleri boş kalır, rota yine
        çizilir. Hiçbir işlev karoya bağlı değildir.
     2. KONUM DIŞARI ÇIKMAZ — BİR İSTİSNAYLA. Rota, seans kaydı ve GPS
        noktaları cihazda kalır. Karo isteği ise OSM sunucusuna haritanın
        HANGİ BÖLGESİNE bakıldığını söyler (karo adresi bölgeyi taşır). Bu,
        SPİ'nin «veri cihazda kalır» ilkesine depo sahibinin bilerek
        verdiği istisnadır (2026-10-03); belgesi SPI/src/MIMARI.md'de.
     3. KÜNYE YAZILIR. OSM verisinin lisansı katkıcıların anılmasını
        ister: karo çizilen her haritada «© OpenStreetMap katkıcıları».

   Koordinatlar SVG'ye görünüm penceresinin köşesine göre YEREL yazılır:
   yüksek yakınlıkta dünya pikseli on milyonları bulur ve bazı çiziciler
   SVG'yi tek duyarlıkla hesaplar (çizgi titrer, karolar arasında aralık
   açılır). */

window.SP = window.SP || {};

SP.Harita = (function(){
  const KARO = 256;
  const KARO_ADRES = 'https://tile.openstreetmap.org/';
  const KUNYE_ADRES = 'https://www.openstreetmap.org/copyright';
  const EN_YAKIN = 17, EN_UZAK = 2;
  /* Isı haritası bölgesi: başlangıç merkezi bu yarıçap içindeki rotalar. */
  const BOLGE_KM = 30;

  function dunya(lat, lon, z){
    const n = KARO * Math.pow(2, z);
    const s = Math.sin(lat * Math.PI / 180);
    return [(lon + 180) / 360 * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n];
  }

  function cerceve(izler){
    let a = 90, b = -90, c = 180, d = -180;
    izler.forEach(iz => iz.forEach(p => {
      if(p.lat < a) a = p.lat; if(p.lat > b) b = p.lat;
      if(p.lon < c) c = p.lon; if(p.lon > d) d = p.lon;
    }));
    return { gun:a, kuz:b, bat:c, dog:d };
  }

  /* Çerçeveyi pencerenin %84'üne sığdıran en yakın yakınlık. */
  function yakinlik(cer, W, H){
    for(let z = EN_YAKIN; z > EN_UZAK; z--){
      const p1 = dunya(cer.kuz, cer.bat, z), p2 = dunya(cer.gun, cer.dog, z);
      if(p2[0] - p1[0] <= W * 0.84 && p2[1] - p1[1] <= H * 0.84) return z;
    }
    return EN_UZAK;
  }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);

  /* İzler: [[{lat, lon}]]. o: { gen, yuk, isi, zemin, etiket, sinif, dugme }.
     `dugme` ({ act, id, aria }) verilirse harita basılabilir bir düğmedir;
     künye bağlantısı düğmenin İÇİNDE değil yanında durur (iç içe iki
     etkileşimli öğe olmaz). Döner: { html, z }. */
  function ciz(izler, o){
    o = o || {};
    const W = o.gen || 640, H = o.yuk || 400;
    const dolu = (izler || []).filter(iz => iz && iz.length > 1);
    if(!dolu.length) return { html:'', z:null };
    const cer = cerceve(dolu);
    const z = yakinlik(cer, W, H);
    const p1 = dunya(cer.kuz, cer.bat, z), p2 = dunya(cer.gun, cer.dog, z);
    const x0 = (p1[0] + p2[0]) / 2 - W / 2, y0 = (p1[1] + p2[1]) / 2 - H / 2;
    const yerel = p => { const w = dunya(p.lat, p.lon, z); return [w[0] - x0, w[1] - y0]; };
    const zemin = o.zemin !== false;

    let karolar = '';
    if(zemin){
      const n = Math.pow(2, z);
      for(let ty = Math.floor(y0 / KARO); ty <= Math.floor((y0 + H) / KARO); ty++){
        if(ty < 0 || ty >= n) continue;
        for(let tx = Math.floor(x0 / KARO); tx <= Math.floor((x0 + W) / KARO); tx++){
          const sx = ((tx % n) + n) % n;
          karolar += '<image href="' + KARO_ADRES + z + '/' + sx + '/' + ty + '.png"'
            + ' x="' + (tx * KARO - x0).toFixed(1) + '" y="' + (ty * KARO - y0).toFixed(1) + '"'
            + ' width="' + KARO + '" height="' + KARO + '" preserveAspectRatio="none"/>';
        }
      }
    }

    const cizgiler = dolu.map(iz => iz.map(p => yerel(p).map(v => v.toFixed(1)).join(',')).join(' '));
    let govde = '';
    if(o.isi){
      govde = cizgiler.map(pt => '<polyline class="harita__isi" points="' + pt + '"/>').join('');
    }else{
      govde = cizgiler.map(pt => '<polyline class="harita__hale" points="' + pt + '"/>'
        + '<polyline class="harita__iz" points="' + pt + '"/>').join('');
      const ilk = dolu[0], b = yerel(ilk[0]), s = yerel(ilk[ilk.length - 1]);
      govde += '<circle class="harita__son" cx="' + s[0].toFixed(1) + '" cy="' + s[1].toFixed(1) + '" r="5"/>'
        + '<circle class="harita__bas" cx="' + b[0].toFixed(1) + '" cy="' + b[1].toFixed(1) + '" r="5"/>';
    }

    const d = o.dugme;
    const svg = '<svg class="harita__svg" viewBox="0 0 ' + W + ' ' + H + '"'
      + (d ? ' aria-hidden="true" focusable="false">'
        : ' role="img" aria-label="' + esc(o.etiket || 'Rota haritası') + '">')
      + '<rect class="harita__taban" width="' + W + '" height="' + H + '"/>'
      + (karolar ? '<g class="harita__karolar">' + karolar + '</g>' : '')
      + govde + '</svg>';
    const ic = d
      ? '<button type="button" class="harita__dugme" data-act="' + esc(d.act) + '" data-id="' + esc(d.id)
        + '" aria-label="' + esc(d.aria || o.etiket || 'Rotayı aç') + '">' + svg + '</button>'
      : svg;
    const kunye = zemin
      ? '<span class="harita__kunye"><a href="' + KUNYE_ADRES + '" target="_blank" rel="noopener">'
        + '© OpenStreetMap katkıcıları</a></span>'
      : '';
    return {
      html:'<div class="' + ['harita', o.isi && 'harita--isi', o.sinif].filter(Boolean).join(' ')
        + '" style="aspect-ratio:' + W + ' / ' + H + '">' + ic + kunye + '</div>',
      z,
    };
  }

  /* Isı haritası için bölge: başlangıç noktaları en sık kümelendiği yer.
     Başka şehirdeki tek bir rota bütün haritayı ülke boyuna
     uzaklaştırmasın; dışarıda kalan sayısı ayrıca döner ve söylenir. */
  function bolge(izler){
    const dolu = (izler || []).filter(iz => iz && iz.length > 1);
    if(dolu.length < 2) return { secilen:dolu, disarida:0 };
    const yakin = (a, b) => SP.Rota.mesafe(a[0], b[0]) <= BOLGE_KM * 1000;
    let enIyi = 0, enSayi = -1;
    dolu.forEach((iz, i) => {
      const n = dolu.filter(b => yakin(iz, b)).length;
      if(n > enSayi){ enSayi = n; enIyi = i; }   /* eşitlikte ilk (en yeni) */
    });
    const secilen = dolu.filter(b => yakin(dolu[enIyi], b));
    return { secilen, disarida:dolu.length - secilen.length };
  }

  /* Yükseklik profili: eşit aralıklı yükseklikler (m) ve toplam mesafe (m). */
  function profilSvg(profil, mesafeM){
    if(!Array.isArray(profil) || profil.length < 2) return '';
    const W = 640, H = 132, padL = 44, padR = 12, padT = 10, padB = 24;
    const enA = Math.min.apply(null, profil), enY = Math.max.apply(null, profil);
    const ara = Math.max(10, enY - enA);
    const alt = enA - ara * 0.15, ust = enY + ara * 0.15;
    const X = i => padL + (W - padL - padR) * i / (profil.length - 1);
    const Y = v => H - padB - (H - padT - padB) * (v - alt) / (ust - alt);
    const d = profil.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const kmY = v => (v / 1000).toLocaleString('tr-TR', { maximumFractionDigits:1 });
    const tr = v => Number(v).toLocaleString('tr-TR');
    return '<svg class="chart harita__profil" viewBox="0 0 ' + W + ' ' + H + '" role="img"'
      + ' aria-label="Yükseklik profili: en alçak ' + tr(enA) + ' m, en yüksek ' + tr(enY) + ' m">'
      + '<line class="axis axis--base" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + (H - padB) + '" y2="' + (H - padB) + '"/>'
      + '<path class="area" d="' + d + ' L ' + X(profil.length - 1).toFixed(1) + ' ' + (H - padB)
      + ' L ' + padL + ' ' + (H - padB) + ' Z"/>'
      + '<path class="line" d="' + d + '"/>'
      + '<text x="' + (padL - 6) + '" y="' + (Y(enY) + 4).toFixed(1) + '" text-anchor="end">' + tr(enY) + ' m</text>'
      /* Düz rotada iki etiket üst üste biner: en alçak yalnız yer varsa. */
      + (Y(enA) - Y(enY) >= 14
        ? '<text x="' + (padL - 6) + '" y="' + (Y(enA) + 4).toFixed(1) + '" text-anchor="end">' + tr(enA) + ' m</text>'
        : '')
      + '<text x="' + padL + '" y="' + (H - 6) + '">0</text>'
      + '<text x="' + (W - padR) + '" y="' + (H - 6) + '" text-anchor="end">' + kmY(mesafeM) + ' km</text>'
      + '</svg>';
  }

  return { ciz, bolge, profilSvg, dunya, yakinlik, cerceve, KARO_ADRES, KUNYE_ADRES };
})();
