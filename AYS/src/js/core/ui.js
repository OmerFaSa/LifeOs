/* Arayuz parcalari: ikonlar, rozetler, grafikler, alt sayfa ve bildirimler. */

window.R = window.R || {};

R.UI = (function(){
  const U = R.U;
  const raw = R.h.raw;

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
  };

  function icon(name, cls){
    const p = PATHS[name] || PATHS.info;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'
      + (cls ? ' class="'+cls+'"' : '') + '>' + p + '</svg>';
  }

  /* ---------- kucuk parcalar ----------
     Not: rozet/kart/tablo gibi bilesenler artik R.C icinde tek yerde durur.
     Burada yalnizca R.C'ye girmeyen, veriye bagli iki kucuk parca kalir. */
  function tagDot(tag){
    const t = R.ERROR_TAGS[tag];
    return '<span class="tagdot" style="background:'+(t ? t.color : 'var(--text-3)')+'"></span>';
  }
  function certainty(key){
    const c = R.CERTAINTY[key];
    return String(R.C.Badge({ label:c.label, tone:c.tone }));
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

    let svg = '<svg class="chart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img">';
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
    let svg = '<svg class="chart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img">';
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

  function paretoBars(rows){
    if(!rows.length || !rows.some(r => r.count)) return '<p class="small dim">Henüz hata kaydı yok.</p>';
    const max = Math.max.apply(null, rows.map(r => r.count)) || 1;
    return '<div class="stack-sm">' + rows.map(r => {
      const t = R.ERROR_TAGS[r.tag];
      return '<div class="row" style="gap:10px">'
        + '<span class="chip" style="min-width:34px;justify-content:center">'+r.tag+'</span>'
        + '<div class="grow"><div class="meter__top"><span class="small">'+U.esc(t.name)+'</span><b class="num small">'+r.count+' · %'+r.pct+'</b></div>'
        + '<div class="bar"><div class="bar__fill" style="width:'+U.pct(r.count,max)+'%;background:'+t.color+'"></div></div></div>'
        + '</div>';
    }).join('') + '</div>';
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

  function gauge(value, band, safeBand, unit){
    const hi = Math.max(band[1], safeBand ? safeBand[1] : band[1], value || 0) * 1.18;
    const p = v => U.clamp(100*v/hi, 0, 100);
    let html = '<div class="gauge">';
    html += '<div class="gauge__band" style="left:'+p(band[0])+'%;width:'+(p(band[1])-p(band[0]))+'%"></div>';
    if(safeBand) html += '<div class="gauge__safe" style="left:0;width:'+p(safeBand[0])+'%"></div>';
    if(value != null) html += '<div class="gauge__mark'+(value < band[0] ? ' is-low' : '')+'" style="left:'+p(value)+'%"></div>';
    html += '</div>';
    html += '<div class="gauge__scale"><span>0</span><span>gözlenen '+band[0]+'–'+band[1]+(safeBand ? ' · güvenli '+safeBand[0]+'–'+safeBand[1] : '')+'</span><span>'+Math.round(hi)+unit+'</span></div>';
    return html;
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
    return '<svg class="chart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="height:26px">'
      + '<path class="line'+(o.accent?' line--accent':'')+'" style="stroke-width:1.6" d="M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L ')+'"/></svg>';
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
  function esc(s){ return R.U.esc(s); }

  function legend(items){
    return '<div class="legend">'+items.map(i => '<span class="legend__item"><span class="legend__swatch" style="background:'+i.color+'"></span>'+U.esc(i.label)+'</span>').join('')+'</div>';
  }

  /* ---------- ipucu (ⓘ) ve kenar bilgi rayi ---------- */

  /* Baslik yaninda kucuk bir ⓘ; tiklayinca balon acar. */
  function hint(key){
    const h = R.HINTS[key];
    if(!h) return '';
    return '<button class="hint" data-act="hint" data-hint="'+key+'" aria-label="'+U.esc(h.t)+' hakkında bilgi">i</button>';
  }

  /* Bolum kenarinda duran kisa aciklama kartlari — uzun metin yerine. */
  /* Ekran acıklamaları. Eskiden her ekranın altında acık duran bir metin
     duvariydi ve sayfanin sonunu bozuyordu; artik katlanir bir panel:
     varsayilan kapali, tek dokunusla acilir, tercih oturumda hatirlanir. */
  function rail(keys, title){
    const list = keys.filter(k => R.HINTS[k]);
    if(!list.length) return '';
    const open = !!(R.S.ui && R.S.ui.railOpen);
    const label = title === false ? 'Bu ekran nasıl okunur' : (title || 'Bu ekran nasıl okunur');

    const cards = list.map(k => {
      const h = R.HINTS[k];
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
    const h = R.HINTS[key];
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
    const { html, when } = R.h;
    el.innerHTML = String(html`
      <div class="${opts.wide ? 'sheet sheet--wide' : 'sheet'}" role="dialog" aria-modal="true" aria-label="${opts.title}">
        <div class="sheet__head">
          <div><h3>${opts.title}</h3>${when(opts.subtitle, () => html`<p>${opts.subtitle}</p>`)}</div>
          ${R.C.IconButton({ icon:'close', plain:true, aria:'Kapat', act:'sheet-close' })}
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

  function toast(text){
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, 1500);
    setTimeout(() => el.remove(), 1800);
  }

  function confirmSheet(title, message, onConfirm, danger){
    sheet({
      title,
      body:String(R.h.html`<p>${message}</p>`),
      footer:String(R.h.html`${R.C.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${R.C.Button({ label:'Evet, devam et', tone:danger ? 'danger' : 'primary', act:'confirm-yes' })}`),
      noFocus:true,
    });
    R.UI._confirm = onConfirm;
  }

  return {
    icon, tagDot, certainty,
    lineChart, barChart, paretoBars, donut, gauge, sparkline, stackBar, heatmap, legend,
    hint, rail, openHint, closeHint, isHintOpen,
    sheet, closeSheet, isSheetOpen, toast, confirmSheet,
  };
})();
