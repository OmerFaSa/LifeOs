/* Arayuz parcalari: ikonlar, olcum gorselleri, grafikler, alt sayfa ve bildirimler. */

window.SP = window.SP || {};

SP.UI = (function(){
  const U = SP.U;
  const raw = SP.h.raw;

  /* ---------- ikonlar ---------- */
  const PATHS = {
    today:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2 2M17.8 17.8l2 2M2 12h3M19 12h3M4.2 19.8l2-2M17.8 6.2l2-2"/>',
    week:'<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v3M16 3v3"/>',
    exam:'<path d="M7 3.5h7l5 5V20a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 016 20V5a1.5 1.5 0 011-1.5z"/><path d="M13.5 3.5V9h5.5"/><path d="M9.5 14.5l2 2 3.5-4"/>',
    cards:'<rect x="3" y="7.5" width="13" height="13" rx="2"/><path d="M7.5 7.5v-2A1.5 1.5 0 019 4h10.5A1.5 1.5 0 0121 5.5V16a1.5 1.5 0 01-1.5 1.5H17"/>',
    book:'<path d="M4 5.5A2.5 2.5 0 016.5 3H19v15H6.5A2.5 2.5 0 004 20.5z"/><path d="M4 20.5A2.5 2.5 0 016.5 18H19v3H6.5A2.5 2.5 0 014 20.5z"/>',
    map:'<path d="M9 4.5L3.5 7v13L9 17.5l6 3 5.5-2.5v-13L15 7.5z"/><path d="M9 4.5v13M15 7.5v13"/>',
    target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
    chart:'<path d="M4 20V11M10 20V4M16 20v-6M22 20H2"/>',
    shield:'<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.3-7.5 9.5-4.4-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
    guide:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 114 2.4c-.9.6-1.6 1.1-1.6 2.2M12 17.2v.01"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    close:'<path d="M6 6l12 12M18 6L6 18"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    play:'<path d="M7 4.5l12 7.5-12 7.5z"/>',
    pause:'<path d="M8.5 4.5v15M15.5 4.5v15"/>',
    stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
    warn:'<path d="M12 3.5l9.5 16.5H2.5z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11.5v5M12 8v.01"/>',
    gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    left:'<path d="M15 5l-7 7 7 7"/>',
    right:'<path d="M9 5l7 7-7 7"/>',
    down:'<path d="M5 9l7 7 7-7"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/>',
    moon:'<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/>',
    flag:'<path d="M5.5 21V4M5.5 5h11l-2 3.5 2 3.5h-11"/>',
    trash:'<path d="M4.5 7h15M9.5 7V5h5v2M7 7l.8 12.5h8.4L17 7"/>',
    edit:'<path d="M5 19h3l9.5-9.5a2 2 0 10-3-3L5 16z"/>',
    download:'<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14"/>',
    upload:'<path d="M12 20V9M7.5 13L12 8.5 16.5 13M5 4h14"/>',
    list:'<path d="M8 6h12M8 12h12M8 18h12M4 6v.01M4 12v.01M4 18v.01"/>',
    refresh:'<path d="M20 11a8 8 0 10-1.7 5.3"/><path d="M20 5v6h-6"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    zap:'<path d="M13 3L5.5 13.5H11l-.8 7.5L18.5 10.5H13z"/>',
    users:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>'
      + '<path d="M16 5.6a3.2 3.2 0 010 4.8M17.5 14.9c2 .6 3.2 2.3 3.2 4.6"/>',
    layers:'<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12.5L12 17l8.5-4.5"/>',
    target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><path d="M12 11.9v.01"/>',
    undo:'<path d="M4 11a8 8 0 111.7 5.3"/><path d="M4 5v6h6"/>',
    shield:'<path d="M12 3.5l7 2.6v5.4c0 4-2.9 7.4-7 8.9-4.1-1.5-7-4.9-7-8.9V6.1z"/>'
      + '<path d="M9 12.2l2.2 2.2L15.2 10"/>',

    /* --- saglik alani --- */
    heart:'<path d="M12 20.5C7 17 3.5 13.9 3.5 10.2A4.7 4.7 0 0112 7.6a4.7 4.7 0 018.5 2.6c0 3.7-3.5 6.8-8.5 10.3z"/>',
    pulse:'<path d="M2.5 12.5h4l2-5 3.5 10 2.5-6 1.5 3h5.5"/>',
    drop:'<path d="M12 3.2c3.4 4 5.5 6.6 5.5 9.1a5.5 5.5 0 11-11 0c0-2.5 2.1-5.1 5.5-9.1z"/>',
    flask:'<path d="M9.5 3.5h5M10.5 3.5v6L5.4 18a2 2 0 001.7 3h9.8a2 2 0 001.7-3l-5.1-8.5v-6"/><path d="M7.6 14.5h8.8"/>',
    meal:'<path d="M6 3.5v7a2.5 2.5 0 005 0v-7M8.5 10.5V21"/><path d="M17 3.5c-1.4 1.4-2 3.2-2 5.5 0 1.7.7 2.8 2 3.2V21"/>',
    leaf:'<path d="M4.5 19.5C3 14 6.5 5.5 19.5 4.5c1 12-7 15.5-12.5 14"/><path d="M9 15c2.2-3.4 5-5.6 8.5-7"/>',
    dumbbell:'<path d="M3 9.5v5M6.5 7v10M17.5 7v10M21 9.5v5M6.5 12h11"/>',
    wallet:'<path d="M3.5 7.5A2 2 0 015.5 5.5h12A1.5 1.5 0 0119 7v.5"/><rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M16 13.5v.01"/>',
    scale:'<path d="M12 3.5a8.5 8.5 0 018.5 8.5v7a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19v-7A8.5 8.5 0 0112 3.5z"/><path d="M12 11.5l3-3.5"/>',
    pill:'<rect x="2.8" y="8.6" width="18.4" height="6.8" rx="3.4" transform="rotate(-45 12 12)"/><path d="M8.5 8.5l7 7"/>',
    fire:'<path d="M12 3.5c3.5 3.4 5.5 6 5.5 8.9a5.5 5.5 0 11-11 0c0-1.5.6-2.9 1.7-4.2.4 1.2 1 2 1.9 2.4C10.5 8.4 11 5.9 12 3.5z"/>',
    bed:'<path d="M3 19v-8M3 13h18v6M7.5 10.5h3.5a2 2 0 012 2v.5"/><path d="M3 19h18"/>',
    mic:'<rect x="9" y="2.5" width="6" height="11" rx="3"/>'
      + '<path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M9 21h6"/>',
    camera:'<path d="M3.5 8.5A1.5 1.5 0 015 7h2.2l1.2-2h7.2l1.2 2H19a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0119 19H5a1.5 1.5 0 01-1.5-1.5z"/>'
      + '<circle cx="12" cy="12.5" r="3.4"/>',
    file:'<path d="M7 3.5h7l5 5V19a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 016 19V5a1.5 1.5 0 011-1.5z"/>'
      + '<path d="M13.5 3.5V9H19"/>',

    /* --- gorunum --- */
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8'
      + 'M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"/>',
    moon2:'<path d="M20.5 14.8A8.6 8.6 0 019.2 3.5a8.6 8.6 0 1011.3 11.3z"/>',
    monitor:'<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8.5 21h7M12 17v4"/>',
    palette:'<path d="M12 3.5a8.5 8.5 0 000 17c1.2 0 1.9-.8 1.9-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2'
      + ' 0-1 .8-1.8 1.9-1.8h1.4a4.3 4.3 0 004.3-4.3c0-3.9-3.8-6.7-8.5-6.7z"/>'
      + '<circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none"/>'
      + '<circle cx="10.5" cy="7" r="1.1" fill="currentColor" stroke="none"/>'
      + '<circle cx="15" cy="7.8" r="1.1" fill="currentColor" stroke="none"/>',
    sliders:'<path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h9M17 17h3"/>'
      + '<circle cx="16" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="15" cy="17" r="2"/>',
  };

  function icon(name, cls){
    const p = PATHS[name] || PATHS.info;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'
      + (cls ? ' class="'+cls+'"' : '') + '>' + p + '</svg>';
  }


  /* ---------- bölüm imzaları ----------

     Her bölümün hero'sunda duran ince, tek renkli işaret. Süs değil:
     bölümün NE ÖLÇTÜĞÜNÜ soyutlar ve kullanıcı sayfayı okumadan hangi
     bölümde olduğunu çevresel görüşle anlar.

     Hepsi aynı dille çizilir: 34px yükseklik, 1.5px çizgi, tek renk,
     dolgu yok. Farklı kalınlıkta ya da renkli bir imza, tek tasarım
     kuralını bozardı. */
  const MOTIFS = {
    /* Günlük — bir günün yirmi dört çentiği, biri işaretli. */
    gunluk:function(){
      let d = '';
      for(let i = 0; i < 24; i++){
        const x = i * 11 + 1;
        const h = i % 6 === 0 ? 22 : 12;
        d += '<line x1="' + x + '" y1="' + (28 - h) + '" x2="' + x + '" y2="28"/>';
      }
      return '<svg viewBox="0 0 265 34" fill="none" stroke="currentColor" stroke-width="1.5"'
        + ' stroke-linecap="round" aria-hidden="true">' + d
        + '<circle cx="133" cy="7" r="3.5" fill="currentColor" stroke="none"/></svg>';
    },
    /* Testler — bir ölçüm cetveli: referans aralığı ve içindeki değer. */
    testler:function(){
      return '<svg viewBox="0 0 265 34" fill="none" stroke="currentColor" stroke-width="1.5"'
        + ' stroke-linecap="round" aria-hidden="true">'
        + '<line x1="2" y1="20" x2="263" y2="20"/>'
        + '<line x1="2" y1="14" x2="2" y2="26"/><line x1="263" y1="14" x2="263" y2="26"/>'
        + '<rect x="86" y="16" width="94" height="8" rx="4" fill="currentColor" stroke="none" opacity=".28"/>'
        + '<line x1="118" y1="8" x2="118" y2="32" stroke-width="2.5"/></svg>';
    },
    /* Besin — bir tabakta üç makro dilimi. */
    besin:function(){
      return '<svg viewBox="0 0 265 34" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'
        + '<circle cx="17" cy="17" r="14"/>'
        + '<path d="M17 3a14 14 0 0 1 12.1 21"/>'
        + '<line x1="42" y1="11" x2="150" y2="11"/>'
        + '<line x1="42" y1="20" x2="205" y2="20"/>'
        + '<line x1="42" y1="29" x2="118" y2="29"/></svg>';
    },
    /* Hareket — bir efor eğrisi ve toparlanma. */
    hareket:function(){
      return '<svg viewBox="0 0 265 34" fill="none" stroke="currentColor" stroke-width="1.5"'
        + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        + '<path d="M2 26c14 0 18-16 30-16s16 16 30 16 18-20 30-20 16 20 30 20"/>'
        + '<path d="M152 26h18" stroke-dasharray="1 6"/>'
        + '<path d="M178 26c12 0 14-12 24-12s14 8 24 8 12-6 22-6h15" opacity=".55"/></svg>';
    },
    /* Finans — bir defter sütunu: kalemler ve toplam çizgisi. */
    finans:function(){
      return '<svg viewBox="0 0 265 34" fill="none" stroke="currentColor" stroke-width="1.5"'
        + ' stroke-linecap="round" aria-hidden="true">'
        + '<line x1="2" y1="7" x2="120" y2="7"/><line x1="178" y1="7" x2="215" y2="7"/>'
        + '<line x1="2" y1="16" x2="98" y2="16"/><line x1="178" y1="16" x2="228" y2="16"/>'
        + '<line x1="2" y1="25" x2="134" y2="25"/><line x1="178" y1="25" x2="206" y2="25"/>'
        + '<line x1="170" y1="31" x2="240" y2="31" stroke-width="2"/></svg>';
    },
    /* Ofis — patron ve dört koç. */
    ofis:function(){
      let d = '<circle cx="17" cy="17" r="9"/>';
      for(let i = 0; i < 4; i++){
        const x = 62 + i * 34;
        d += '<circle cx="' + x + '" cy="17" r="6.5"/>'
           + '<line x1="' + (x - 28) + '" y1="17" x2="' + (x - 8) + '" y2="17" opacity=".45"/>';
      }
      return '<svg viewBox="0 0 265 34" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'
        + d + '</svg>';
    },
    /* Ayarlar — üç sürgü. */
    ayarlar:function(){
      return '<svg viewBox="0 0 265 34" fill="none" stroke="currentColor" stroke-width="1.5"'
        + ' stroke-linecap="round" aria-hidden="true">'
        + '<line x1="2" y1="7" x2="150" y2="7"/><circle cx="104" cy="7" r="4.5" fill="var(--bg)"/>'
        + '<line x1="2" y1="17" x2="150" y2="17"/><circle cx="52" cy="17" r="4.5" fill="var(--bg)"/>'
        + '<line x1="2" y1="27" x2="150" y2="27"/><circle cx="126" cy="27" r="4.5" fill="var(--bg)"/></svg>';
    },
  };

  function motif(sectionId){
    const fn = MOTIFS[sectionId];
    return fn ? fn() : '';
  }

  /* ---------- kucuk parcalar ----------
     Not: rozet/kart/tablo gibi bilesenler SP.C icinde tek yerde durur.
     Burada yalnizca SP.C'ye girmeyen, veriye bagli parcalar kalir. */

  /* Olcumun yonunu tek bakista veren ok. Yon iyi/kotu demek degildir;
     iyi/kotu yorumu daima kural motorundan (Calc) gelir. */
  function trend(dir){
    const map = { up:'&#9650;', down:'&#9660;', flat:'&#8212;' };
    return '<span class="trendmark trendmark--'+(dir||'flat')+'" aria-hidden="true">'
      + (map[dir] || map.flat) + '</span>';
  }

  /* ---------- kadran ----------

     Toparlanma skoru bir yuzde degil bir DURUMDUR; yatay bir cubuk onu
     "ne kadar dolduruldu" gibi okutuyordu. Yay, bir olcegin uzerindeki
     ibre gibi durur: sifir ve yuz uclarda, deger arada bir yerde.

     Bantlar (dusuk/orta/yuksek) yayin arkasinda soluk cizgilerle
     isaretlenir; skorun hangi banda dustugu renkten once KONUMDAN
     okunur. Renk tek basina anlam tasimaz. */
  function gauge(value, opts){
    const o = opts || {};
    const size = o.size || 132;
    const max = o.max || 100;
    const r = 54, cx = 60, cy = 60;
    /* 240 derecelik yay: alt taraf acik kalir, ibre orada baslar ve biter. */
    const START = 150, SWEEP = 240;
    const pt = deg => {
      const a = (deg * Math.PI) / 180;
      return [(cx + r * Math.cos(a)).toFixed(2), (cy + r * Math.sin(a)).toFixed(2)];
    };
    const arc = (from, to, w, cls2, extra) => {
      const [x1, y1] = pt(from), [x2, y2] = pt(to);
      const large = (to - from) > 180 ? 1 : 0;
      return '<path d="M' + x1 + ' ' + y1 + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 '
        + x2 + ' ' + y2 + '" class="' + cls2 + '" stroke-width="' + w + '" fill="none"'
        + ' stroke-linecap="round"' + (extra || '') + '/>';
    };

    const has = value != null && isFinite(value);
    const pct = has ? U.clamp(value / max, 0, 1) : 0;
    let out = '<div class="gauge" style="width:' + size + 'px">';
    out += '<svg viewBox="0 0 120 120" role="img" aria-label="'
      + (has ? 'Skor ' + Math.round(value) + ' / ' + max : 'Skor yok') + '">';
    out += arc(START, START + SWEEP, 7, 'gauge__track');
    /* Bant sinirlari — kadranin uzerindeki centikler. */
    (o.bands || []).forEach(b => {
      const d = START + SWEEP * U.clamp(b / max, 0, 1);
      const [ix, iy] = pt(d);
      const inner = r - 9;
      const a = (d * Math.PI) / 180;
      const x0 = (cx + inner * Math.cos(a)).toFixed(2);
      const y0 = (cy + inner * Math.sin(a)).toFixed(2);
      out += '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + ix + '" y2="' + iy
        + '" class="gauge__band"/>';
    });
    if(has && pct > 0){
      out += arc(START, START + SWEEP * pct, 7, 'gauge__value gauge__value--' + (o.tone || ''));
    }
    out += '</svg>';
    out += '<div class="gauge__center">'
      + '<span class="gauge__num num">' + (has ? Math.round(value) : '&mdash;') + '</span>'
      + (o.label ? '<span class="gauge__label">' + esc(o.label) + '</span>' : '')
      + '</div>';
    out += '</div>';
    return out;
  }

  /* ---------- grafikler ---------- */
  /* Eksen adimini 1/2/5/10 ailesine oturtur ki etiketler yuvarlak sayi olsun. */
  function niceStep(raw){
    if(!isFinite(raw) || raw <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return step * mag;
  }

  function lineChart(series, opts){
    const o = opts || {};
    const w = 640, h = o.height || 190, padL = 34, padR = 14, padT = 14, padB = 26;
    const all = series.reduce((acc,s) => acc.concat(s.data.filter(v => v != null)), []);
    if(!all.length) return '<p class="small dim">Grafik için henüz veri yok.</p>';

    const maxV = Math.max.apply(null, all), minV = Math.min.apply(null, all);
    const pad = Math.max(2, (maxV-minV)*0.2);
    const step = niceStep((maxV+pad - Math.max(0, minV-pad)) / 4);
    const top = o.max != null ? o.max : Math.ceil((maxV+pad) / step) * step;
    const bottom = o.min != null ? o.min : Math.max(0, Math.floor((minV-pad) / step) * step);
    const n = Math.max.apply(null, series.map(s => s.data.length));
    const X = i => padL + (w-padL-padR) * (n <= 1 ? 0.5 : i/(n-1));
    const Y = v => h-padB - (h-padT-padB) * ((v-bottom)/((top-bottom)||1));

    let svg = '<svg class="chart" viewBox="0 0 '+w+' '+h+'" role="img">';
    const ticks = 4;
    for(let i = 0; i <= ticks; i++){
      const v = bottom + (top-bottom)*i/ticks;
      const y = Y(v);
      svg += '<line class="axis" x1="'+padL+'" x2="'+(w-padR)+'" y1="'+y+'" y2="'+y+'"/>';
      svg += '<text x="'+(padL-6)+'" y="'+(y+3)+'" text-anchor="end">'+Math.round(v)+'</text>';
    }
    if(o.band){
      const y1 = Y(o.band[1]), y2 = Y(o.band[0]);
      svg += '<rect class="band" x="'+padL+'" y="'+y1+'" width="'+(w-padL-padR)+'" height="'+Math.max(0,y2-y1)+'" opacity=".5"/>';
    }
    series.forEach(s => {
      const pts = s.data.map((v,i) => v == null ? null : [X(i), Y(v)]).filter(Boolean);
      if(!pts.length) return;
      const d = 'M' + pts.map(p => p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L ');
      if(pts.length > 1 && o.area !== false){
        svg += '<path class="area'+(s.accent?' area--accent':'')+'" d="'+d+' L '+pts[pts.length-1][0].toFixed(1)+' '+(h-padB)+' L '+pts[0][0].toFixed(1)+' '+(h-padB)+' Z"/>';
      }
      svg += '<path class="line'+(s.accent?' line--accent':'')+'" d="'+d+'"/>';
      pts.forEach((p,i) => {
        const last = i === pts.length-1;
        svg += '<circle class="pt'+(s.accent?' pt--accent':'')+'" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(last?4:2.6)+'"/>';
      });
    });
    if(o.labels){
      o.labels.forEach((lb,i) => {
        if(n > 8 && i % 2) return;
        svg += '<text x="'+X(i)+'" y="'+(h-8)+'" text-anchor="middle">'+U.esc(lb)+'</text>';
      });
    }
    svg += '</svg>';
    return svg;
  }

  function barChart(rows, opts){
    const o = opts || {};
    const w = 640, h = o.height || 150, padL = 30, padR = 10, padT = 12, padB = 26;
    if(!rows.length) return '<p class="small dim">Veri yok.</p>';
    const top = o.max || 100;
    const bw = (w-padL-padR) / rows.length;
    let svg = '<svg class="chart" viewBox="0 0 '+w+' '+h+'" role="img">';
    [0, 0.5, 1].forEach(f => {
      const y = padT + (h-padT-padB)*f;
      svg += '<line class="axis" x1="'+padL+'" x2="'+(w-padR)+'" y1="'+y+'" y2="'+y+'"/>';
      svg += '<text x="'+(padL-6)+'" y="'+(y+3)+'" text-anchor="end">'+Math.round(top*(1-f))+'</text>';
    });
    if(o.targetLine != null){
      const y = padT + (h-padT-padB)*(1 - o.targetLine/top);
      svg += '<line x1="'+padL+'" x2="'+(w-padR)+'" y1="'+y+'" y2="'+y+'" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="5 4"/>';
    }
    rows.forEach((r,i) => {
      const v = r.value == null ? 0 : U.clamp(r.value, 0, top);
      const bh = (h-padT-padB) * (v/top);
      const x = padL + bw*i + bw*0.18;
      const y = h-padB-bh;
      const cls = r.value == null ? 'barfill--muted' : (r.value >= (o.goodAt||85) ? 'barfill' : 'barfill--muted');
      svg += '<rect class="'+cls+'" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw*0.64).toFixed(1)+'" height="'+Math.max(1,bh).toFixed(1)+'" rx="3"'
        + (r.value != null && r.value < (o.goodAt||85) ? ' fill="var(--accent)"' : '') + '/>';
      svg += '<text x="'+(padL+bw*i+bw/2).toFixed(1)+'" y="'+(h-8)+'" text-anchor="middle">'+U.esc(r.label)+'</text>';
    });
    svg += '</svg>';
    return svg;
  }

  /* Referans araligi cubugu — bir tahlil degerinin nerede durdugunu gosterir.
     Uc bolge vardir: laboratuvar referans araligi (genis, notr), hedef bant
     (dar, birincil renk) ve degerin kendisi (isaret). Renk tek basina anlam
     tasimaz: isaretin yaninda daima sayi ve durum rozeti bulunur.

       ref     [low, high]  laboratuvarin referans araligi
       optimal [low, high]  kisisel hedef bant (varsa)
       value   olculen deger  */
  /* `opts.bare` verilirse yalnizca cubuk cizilir, altindaki sayi satiri
     cizilmez. Uzun bir listede her satirin altinda "30 · referans · hedef
     80-250 · 400 ng/mL" yazmak satiri okunmaz hale getiriyordu; o ayrinti
     satira tiklayinca acilan kagitta zaten tam haliyle duruyor. */
  function rangeBar(value, ref, optimal, unit, opts){
    if(!ref || ref.length !== 2) return '';
    const lo = Number(ref[0]), hi = Number(ref[1]);
    const span = hi - lo;
    if(!isFinite(span) || span <= 0) return '';
    /* Eksen referans araligindan %60 daha genis cizilir ki disari tasan
       degerler de cubugun icinde kalsin ve ne kadar tastigi gorunsun. */
    const axisLo = lo - span * 0.6;
    const axisHi = hi + span * 0.6;
    const p = v => U.clamp(100 * (v - axisLo) / (axisHi - axisLo), 0, 100);
    const o = opts || {};

    /* Cetvel bir ilerleme cubugu degil, bir OLCU ALETIDIR: dolu bir kutu
       "ne kadar tamamlandi" der; burada sorulan o degil, "deger nerede
       duruyor". Bu yuzden zemin bos, referans araligi ince bir bant,
       hedef bandi bir alt cizgi, deger ise tek bir hassas ibredir. */
    let out = '<div class="scale' + (o.bare ? ' scale--bare' : '') + '">';
    out += '<div class="scale__axis">';
    out += '<div class="scale__ref" style="left:' + p(lo).toFixed(1) + '%;width:'
      + (p(hi) - p(lo)).toFixed(1) + '%"></div>';
    if(optimal && optimal.length === 2){
      out += '<div class="scale__opt" style="left:' + p(optimal[0]).toFixed(1) + '%;width:'
        + Math.max(1.5, p(optimal[1]) - p(optimal[0])).toFixed(1) + '%"></div>';
    }
    /* Referans araliginin iki ucunda birer centik: aralik nerede baslayip
       nerede bittigi cizgiyle de okunur, yalniz renkle degil. */
    out += '<i class="scale__tick" style="left:' + p(lo).toFixed(1) + '%"></i>';
    out += '<i class="scale__tick" style="left:' + p(hi).toFixed(1) + '%"></i>';
    if(value != null && isFinite(value)){
      const outside = value < lo || value > hi;
      out += '<div class="scale__mark' + (outside ? ' is-out' : '') + '" style="left:'
        + p(value).toFixed(1) + '%"></div>';
    }
    out += '</div>';
    if(o.bare){ out += '</div>'; return out; }
    out += '<div class="scale__legend">'
      + '<span class="scale__end num">' + U.fmtNum(lo) + '</span>'
      + '<span class="scale__mid">referans'
      + (optimal ? ' <b>&middot; hedef ' + U.fmtNum(optimal[0]) + '&ndash;' + U.fmtNum(optimal[1]) + '</b>' : '')
      + '</span>'
      + '<span class="scale__end num">' + U.fmtNum(hi) + (unit ? ' ' + esc(unit) : '') + '</span>'
      + '</div>';
    out += '</div>';
    return out;
  }

  /* Makro dagilimi — protein/yag/karbonhidrat oranini tek seritte verir.
     Segment renkleri kimliktir (hangi makro), durum degil.

     Girdi KALORI cinsindendir ama efsanede YUZDE yazar: "Protein 384" gibi
     bir sayi okuyucuya hicbir sey soylemez, "Protein %28" soyler. */
  function macroSplit(macros){
    const p = Math.max(0, macros.protein || 0);
    const f = Math.max(0, macros.fat || 0);
    const c = Math.max(0, macros.carb || 0);
    const total = p + f + c;
    if(!total) return '<p class="small dim">Makro dağılımı için öğün gerekir.</p>';
    const seg = (label, v, color) => ({ label:label + ' %' + Math.round(100 * v / total), value:v, color });
    return stackBar([
      seg('Protein', p, 'var(--macro-protein)'),
      seg('Yağ', f, 'var(--macro-fat)'),
      seg('Karbonhidrat', c, 'var(--macro-carb)'),
    ]);
  }

  function donut(pct, label, size){
    const s = size || 92, r = (s/2) - 8, c = 2*Math.PI*r;
    const off = c * (1 - U.clamp(pct, 0, 100)/100);
    return '<div class="donut" style="width:'+s+'px;height:'+s+'px">'
      + '<svg viewBox="0 0 '+s+' '+s+'" width="'+s+'" height="'+s+'" role="img" aria-label="%'+Math.round(pct)+'">'
      + '<circle cx="'+s/2+'" cy="'+s/2+'" r="'+r+'" fill="none" stroke="var(--surface-3)" stroke-width="8"/>'
      + '<circle class="donut__arc" cx="'+s/2+'" cy="'+s/2+'" r="'+r+'" fill="none" stroke="var(--primary)" stroke-width="8" stroke-linecap="round"'
      + ' stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 '+s/2+' '+s/2+')"/>'
      + '</svg>'
      + '<div class="donut__center"><div>'
      + '<div class="num donut__pct">%'+Math.round(pct)+'</div>'
      + (label ? '<div class="tiny dim">'+U.esc(label)+'</div>' : '')
      + '</div></div></div>';
  }

  function sparkline(values, opts){
    const o = opts || {};
    const vals = values.filter(v => v != null);
    if(vals.length < 2) return '';
    const w = 100, h = 26;
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    const X = i => (w) * (i/(values.length-1));
    const Y = v => h - 3 - (h-6) * ((v-min)/((max-min)||1));
    const pts = values.map((v,i) => v == null ? null : [X(i), Y(v)]).filter(Boolean);
    /* Kivilcim cizgisi kutusunu doldurmak icin gerilir; `non-scaling-stroke`
       olmadan cizgi yatayda incelip dikeyde kalinlasiyordu. */
    return '<svg class="chart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="height:26px">'
      + '<path vector-effect="non-scaling-stroke" class="line'+(o.accent?' line--accent':'')+'" style="stroke-width:1.6" d="M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L ')+'"/></svg>';
  }

  function stackBar(segments){
    const total = U.sum(segments.map(s => s.value));
    if(!total) return '<p class="small dim">Veri yok.</p>';
    return '<div class="stackbar">'
      + segments.filter(s => s.value).map(s => '<div class="stackbar__seg" style="width:'+(100*s.value/total)+'%;background:'+s.color+'" title="'+U.esc(s.label)+'"></div>').join('')
      + '</div>'
      + '<div class="legend">' + segments.map(s => '<span class="legend__item"><span class="legend__swatch" style="background:'+s.color+'"></span>'+U.esc(s.label)+' '+s.value+'</span>').join('') + '</div>';
  }

  /* 40 hafta x 7 gun calisma yogunlugu — hucre degeri 0..1 */
  function heatmap(cells, opts){
    const o = opts || {};
    const cols = o.cols || 40, rows = 7;
    const cell = 11, gap = 2, padL = 26, padT = 14;
    const w = padL + cols*(cell+gap), h = padT + rows*(cell+gap) + 14;
    const dayLabels = ['Pzt','','Çar','','Cum','','Paz'];

    let svg = '<svg class="chart" viewBox="0 0 '+w+' '+h+'" style="min-width:'+Math.min(w, 760)+'px">';
    for(let r = 0; r < rows; r++){
      if(dayLabels[r]) svg += '<text x="0" y="'+(padT + r*(cell+gap) + cell - 1)+'" style="font-size:8.5px">'+dayLabels[r]+'</text>';
    }
    for(let c = 0; c < cols; c++){
      for(let r = 0; r < rows; r++){
        const item = cells[c*rows + r];
        const v = item ? item.value : null;
        const x = padL + c*(cell+gap), y = padT + r*(cell+gap);
        let fill = 'var(--surface-3)', op = '1';
        if(v != null && v > 0){ fill = 'var(--primary)'; op = String(0.25 + 0.75*Math.min(1, v)); }
        else if(item && item.future){ fill = 'var(--surface-2)'; }
        else if(item && item.missed){ fill = 'var(--danger)'; op = '0.22'; }
        svg += '<rect x="'+x+'" y="'+y+'" width="'+cell+'" height="'+cell+'" rx="2.5" fill="'+fill+'" opacity="'+op+'">'
          + (item ? '<title>'+esc(item.label)+'</title>' : '') + '</rect>';
      }
    }
    (o.monthTicks || []).forEach(t => {
      svg += '<text x="'+(padL + t.col*(cell+gap))+'" y="'+(padT-4)+'" style="font-size:8.5px">'+esc(t.label)+'</text>';
    });
    svg += '</svg>';
    return '<div style="overflow-x:auto">'+svg+'</div>';
  }
  function esc(s){ return SP.U.esc(s); }

  function legend(items){
    return '<div class="legend">'+items.map(i => '<span class="legend__item"><span class="legend__swatch" style="background:'+i.color+'"></span>'+U.esc(i.label)+'</span>').join('')+'</div>';
  }

  /* ---------- ipucu (ⓘ) ve kenar bilgi rayi ---------- */

  /* Baslik yaninda kucuk bir ⓘ; tiklayinca balon acar. */
  function hint(key){
    const h = SP.HINTS[key];
    if(!h) return '';
    return '<button class="hint" data-act="hint" data-hint="'+key+'" aria-label="'+U.esc(h.t)+' hakkında bilgi">i</button>';
  }

  /* Bolum kenarinda duran kisa aciklama kartlari — uzun metin yerine. */
  /* Ekran acıklamaları. Eskiden her ekranın altında acık duran bir metin
     duvariydi ve sayfanin sonunu bozuyordu; artik katlanir bir panel:
     varsayilan kapali, tek dokunusla acilir, tercih oturumda hatirlanir. */
  function rail(keys, title){
    const list = keys.filter(k => SP.HINTS[k]);
    if(!list.length) return '';
    const open = !!(SP.S.ui && SP.S.ui.railOpen);
    const label = title === false ? 'Bu ekran nasıl okunur' : (title || 'Bu ekran nasıl okunur');

    const cards = list.map(k => {
      const h = SP.HINTS[k];
      return '<button class="railcard" data-act="hint" data-hint="'+k+'">'
        + '<span class="railcard__t">'+U.esc(h.t)+'</span>'
        + '<span class="railcard__b">'+U.esc(h.b)+'</span>'
        + '</button>';
    }).join('');

    return '<section class="rail'+(open ? ' is-open' : '')+'">'
      + '<button class="rail__toggle" data-act="rail-toggle" aria-expanded="'+(open ? 'true' : 'false')+'">'
      +   icon('guide', 'rail__icon')
      +   '<span class="rail__label">'+U.esc(label)+'</span>'
      +   '<span class="rail__count">'+list.length+'</span>'
      +   '<span class="rail__chev">'+icon('down')+'</span>'
      + '</button>'
      + '<div class="rail__body"'+(open ? '' : ' hidden')+'>'+cards+'</div>'
      + '</section>';
  }

  function openHint(key, anchorEl){
    closeHint();
    const h = SP.HINTS[key];
    if(!h) return;
    const el = document.createElement('div');
    el.className = 'popover';
    el.id = 'popover';
    el.setAttribute('role','dialog');
    el.innerHTML = '<div class="popover__title">'+U.esc(h.t)+'</div>'
      + '<div class="popover__body">'+U.esc(h.b)+'</div>'
      + (h.more ? '<div class="popover__more">'+U.esc(h.more)+'</div>' : '');
    document.getElementById('overlay-root').appendChild(el);

    const r = anchorEl.getBoundingClientRect();
    const w = el.offsetWidth, hgt = el.offsetHeight;
    let left = r.left + r.width/2 - w/2;
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
    let top = r.bottom + 8;
    if(top + hgt > window.innerHeight - 12) top = Math.max(12, r.top - hgt - 8);
    el.style.left = left+'px';
    el.style.top = top+'px';
  }
  function closeHint(){
    const el = document.getElementById('popover');
    if(el) el.remove();
  }
  function isHintOpen(){ return !!document.getElementById('popover'); }

  /* ---------- alt sayfa ---------- */
  function sheet(opts){
    closeSheet();
    const root = document.getElementById('overlay-root');
    const el = document.createElement('div');
    el.className = 'overlay';
    el.id = 'sheet';
    const { html, when } = SP.h;
    el.innerHTML = String(html`
      <div class="${opts.wide ? 'sheet sheet--wide' : 'sheet'}" role="dialog" aria-modal="true" aria-label="${opts.title}">
        <div class="sheet__head">
          <div><h3>${opts.title}</h3>${when(opts.subtitle, () => html`<p>${opts.subtitle}</p>`)}</div>
          ${SP.C.IconButton({ icon:'close', plain:true, aria:'Kapat', act:'sheet-close' })}
        </div>
        <div class="sheet__body">${raw(opts.body)}</div>
        ${when(opts.footer, () => html`<div class="sheet__foot">${raw(opts.footer)}</div>`)}
      </div>`);
    el.addEventListener('mousedown', e => { if(e.target === el) closeSheet(); });
    root.appendChild(el);
    const first = el.querySelector('input, textarea, select');
    if(first && !opts.noFocus) setTimeout(()=>first.focus(), 40);
  }
  function closeSheet(){
    const el = document.getElementById('sheet');
    if(el) el.remove();
  }
  function isSheetOpen(){ return !!document.getElementById('sheet'); }

  /* Bildirim. `undo` verilirse bildirimin icinde bir "geri al" dugmesi
     cikar ve bildirim daha uzun durur: kullanicinin okuyup karar vermesi
     icin 1,5 saniye yetmez. */
  /* ---------------------------------------------------------- bekleme

     Model cagrisi saniyeler suruyor ve geri bildirim tek bir bildirimdi:
     iki saniye sonra kayboluyor, kullanici donduğunu saniyordu.

     Bu serit isin SONUNA KADAR durur ve ne beklendigini yazar. Sayfanin
     en ustunde, icerigin akisini bozmadan. */

  let busyCount = 0;

  function busy(label, hint){
    busyCount++;
    const root = document.getElementById('overlay-root');
    let el = document.getElementById('busybar');
    if(!el){
      el = document.createElement('div');
      el.id = 'busybar';
      el.className = 'busybar';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      root.appendChild(el);
    }
    el.innerHTML = '<span class="busybar__spin" aria-hidden="true"></span>'
      + '<span class="busybar__t">' + SP.U.esc(label || 'İşleniyor…') + '</span>'
      + (hint ? '<span class="busybar__hint">' + SP.U.esc(hint) + '</span>' : '');
    return el;
  }

  /* Ic ice cagrilarda erken kapanmasin: sayac sifirlaninca kalkar. */
  function idle(){
    busyCount = Math.max(0, busyCount - 1);
    if(busyCount) return;
    const el = document.getElementById('busybar');
    if(el) el.remove();
  }

  /* Bir isi serit acikken kosturur ve her durumda kapatir. */
  async function withBusy(label, hint, fn){
    busy(label, hint);
    try{ return await fn(); }
    finally{ idle(); }
  }

  function toast(text, opts){
    const o = opts || {};
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast' + (o.undo ? ' toast--undo' : '');
    const span = document.createElement('span');
    span.textContent = text;
    el.appendChild(span);
    if(o.undo){
      const btn = document.createElement('button');
      btn.className = 'toast__undo';
      btn.textContent = 'Geri al';
      btn.setAttribute('data-act', 'undo');
      btn.addEventListener('click', () => { el.remove(); });
      el.appendChild(btn);
    }
    root.appendChild(el);
    const life = o.undo ? 6000 : 1500;
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, life);
    setTimeout(() => el.remove(), life + 300);
    return el;
  }

  function confirmSheet(title, message, onConfirm, danger){
    sheet({
      title,
      body:String(SP.h.html`<p>${message}</p>`),
      footer:String(SP.h.html`${SP.C.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${SP.C.Button({ label:'Evet, devam et', tone:danger ? 'danger' : 'primary', act:'confirm-yes' })}`),
      noFocus:true,
    });
    SP.UI._confirm = onConfirm;
  }

  return {
    icon, trend, motif, gauge,
    lineChart, barChart, donut, sparkline, stackBar, heatmap, legend,
    rangeBar, macroSplit,
    hint, rail, openHint, closeHint, isHintOpen,
    sheet, closeSheet, isSheetOpen, toast, confirmSheet,
    busy, idle, withBusy,
  };
})();
