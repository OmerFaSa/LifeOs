/* Komut paleti — Ctrl+K.

   Her ekran, her hızlı eylem ve her ölçüm tek bir aramadan ulaşılır olsun
   diye vardır. Fare ile gezinmek zorunda kalmadan sistemin herhangi bir
   yerine gitmek, günlük kullanımın sürtünmesini belirgin düşürür. */

window.SP = window.SP || {};

SP.Palette = (function(){
  const U = SP.U;

  let open = false;
  let query = '';
  let index = 0;

  function commands(){
    const out = [];

    /* ekranlar */
    (SP.App ? SP.App.SECTIONS : []).forEach(sec => {
      sec.views.forEach(v => {
        out.push({ id:'go:' + v.route, kind:'Sayfa', label:v.label, hint:sec.label,
          run:() => SP.App.go(v.route) });
      });
    });

    /* hizli eylemler */
    out.push({ id:'act:paste', kind:'Eylem', label:'Tahlil raporu yapıştır',
      hint:'Modül 1', run:() => { SP.App.go('labs'); setTimeout(() => {
        const fn = SP.Screens.labs.handle['open-paste']; if(fn) fn({ dataset:{} }); }, 120); } });
    out.push({ id:'act:meal', kind:'Eylem', label:'Öğün ekle',
      hint:'Modül 2', run:() => { SP.App.go('meals'); setTimeout(() => {
        const el = document.getElementById('meal-text'); if(el) el.focus(); }, 160); } });
    out.push({ id:'act:vitals', kind:'Eylem', label:'Günün ölçümünü gir',
      hint:'Toparlanma', run:() => SP.App.go('today') });
    out.push({ id:'act:session', kind:'Eylem', label:'Antrenman seansı ekle',
      hint:'Modül 3', run:() => { SP.App.go('move'); setTimeout(() => {
        const fn = SP.Screens.move.handle['start-session'];
        if(fn) fn({ dataset:{ id:'' } }); }, 120); } });
    out.push({ id:'act:meeting', kind:'Eylem', label:'Ofis toplantısı başlat',
      hint:'Ofis', run:() => SP.App.go('meeting') });
    out.push({ id:'act:backup', kind:'Eylem', label:'Yedek indir',
      hint:'Veri', run:() => { SP.App.go('guide'); SP.S.ui.guideTab = 'veri'; } });

    /* olcumler — dogrudan egilim ekranina goturur */
    SP.BIOMARKERS.forEach(b => {
      out.push({ id:'bio:' + b.id, kind:'Ölçüm', label:b.name, hint:b.unit,
        run:() => { SP.S.ui.trendMarker = b.id; SP.S.ui.labTab = 'trend'; SP.App.go('labs'); } });
    });

    /* ajanlar */
    SP.AGENTS.forEach(a => {
      out.push({ id:'agent:' + a.id, kind:'Ajan', label:a.name + ' — ' + a.role,
        hint:a.title, run:() => { SP.S.ui.officeAgent = a.id; SP.App.go('team'); } });
    });

    return out;
  }

  function iconFor(kind){
    return ({ 'Ekran':'layers', 'Eylem':'zap', 'Ölçüm':'flask', 'Ajan':'users',
      'Hızlı giriş':'plus' })[kind] || 'list';
  }

  /* HIZLI GIRIS. Yazilan satir bir veriye benziyorsa listenin BASINDA
     onizleme olarak durur: «ferritin 26» yazip Enter'a basmak, bolume
     gidip sekme secip alan bulup kaydetmenin yerine gecer.

     Hicbir sey dogrudan kaydedilmez: onizleme secilince alt sayfa acilir
     ve kullanici gordukten sonra onaylar. Yanlis anlasilmis bir satirin
     sessizce depoya yazilmasi, elle girmekten kotudur. */
  /* ---- hizli giris: oneri kutusu uzerinden ------------------------

     Palet uzun sure cumlede TEK sey anliyordu (SP.Quick.parse) ve
     ikinci olgu sessizce dusuyordu. Artik oneri kutusu kullanilir:
     «uyku 7 saat ve 45 dakika yurudum» iki satir uretir ve ikisi de
     ayri ayri onaylanir.

     Ayni kapi: onaysiz hicbir sey yazilmaz, her kayit geri alinabilir. */
  let bekleyen = null;     /* { oneriler, anlasilmayan, metin } */

  /* `q` verilmezse paletin o anki sorgusu kullanilir. Disaridan verilmesi
     bu islevi paleti acmadan denenebilir yapar ve AYS'nin ayni isi yapan
     `veriKomutu(q)` bicimiyle eslestirir. */
  function quickCommand(q){
    const t = String(q == null ? query : q).trim();
    if(t.length < 3) return null;
    let r;
    try{ r = SP.Proposals.fromText(t); }catch(e){ return null; }
    if(!r.oneriler.length) return null;

    const adlar = r.oneriler.map(o => {
      const e = SP.Proposals.eylem(o.action);
      return e ? e.label : o.action;
    });
    return {
      id:'quick:' + r.oneriler.map(o => o.action).join('+'),
      kind:'Hızlı giriş',
      label:adlar.join(' · '),
      hint:r.oneriler.length === 1 ? '1 kayıt' : r.oneriler.length + ' kayıt',
      run:() => confirmQuick(r, t),
    };
  }

  /* Onizleme: NE anlasildi, nereye yazilacak ve ne degisecek.
     Her satir once/sonra tasir — kaydetmeden once ne olacagi gorunur. */
  function confirmQuick(r, metin){
    const K = SP.C;
    const { html, map, when } = SP.h;

    const bloklar = r.oneriler.map((o, i) => {
      const e = SP.Proposals.eylem(o.action);
      const pv = SP.Proposals.preview(o);
      return html`
        <div class="qeblok">
          <div class="qeblok__bas">
            <b>${e ? e.label : o.action}</b>
            ${when(o.metin, () => html`<span class="tiny dim">«${o.metin}»</span>`)}
          </div>
          ${when(!pv.ok, () => html`<p class="small" style="color:var(--danger)">${pv.why}</p>`)}
          ${when(pv.ok, () => html`<div class="qeblok__satirlar">
            ${map(pv.rows, x => html`<div class="qeblok__satir">
              <span>${x.alan}</span>
              <span class="dim">${x.once}</span>
              <span aria-hidden="true">→</span>
              <b>${x.sonra}</b>
            </div>`)}
          </div>`)}
        </div>`;
    });

    SP.UI.sheet({
      title:r.oneriler.length === 1 ? 'Bunu mu demek istedin?'
        : r.oneriler.length + ' kayıt anladım',
      subtitle:metin, wide:true,
      note:'Bu satırlar yorumlandı, KAYDEDİLMEDİ. Onaylayınca yazılır ve '
        + 'her biri tek tek geri alınabilir.',
      body:String(SP.C.Stack([
        html`<div class="qebloklar">${map(bloklar, b => b)}</div>`,
        when(r.anlasilmayan.length, () => K.Notice({ tone:'warn',
          title:'Çözemediğim kısım:',
          body:'«' + r.anlasilmayan.join('», «') + '» — bu kısım kaydedilmeyecek. '
            + 'Anlaşılmayan satır atılmaz, söylenir.' })),
        K.Field({ label:'Tarih',
          input:K.Input({ id:'qe-date', type:'date', value:U.todayISO() }) }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:r.oneriler.length === 1 ? 'Kaydet' : 'Hepsini kaydet',
          tone:'primary', act:'quick-save' })}`),
    });
    bekleyen = r;
  }

  async function saveQuick(){
    if(!bekleyen) return;
    const el = document.getElementById('qe-date');
    const tarih = (el && el.value) || U.todayISO();

    let yazilan = 0, dusen = 0, rota = null;
    for(const o of bekleyen.oneriler){
      /* Tarih alt sayfada degistirilmis olabilir. */
      const oneri = Object.assign({}, o, {
        params:Object.assign({}, o.params, { date:tarih }) });
      const kayit = await SP.Proposals.propose(oneri);
      const res = await SP.Proposals.approve(kayit.id);
      if(res.ok){
        yazilan++;
        rota = rota || ROTA[o.action] || null;
      }else dusen++;
    }
    bekleyen = null;
    SP.UI.closeSheet();
    SP.UI.toast(dusen
      ? yazilan + ' kayıt yazıldı, ' + dusen + ' tanesi yazılamadı'
      : yazilan + ' kayıt yazıldı');
    if(rota) SP.App.go(rota); else SP.App.render();
  }

  /* Kayittan sonra nereye gidilir — kullanici yazdigini GORMELI. */
  const ROTA = {
    'vital-yaz':'today', 'ogun-ekle':'meals', 'seans-ekle':'move',
    'olcum-gir':'labs', 'semptom-isaretle':'today',
  };

  function filtered(){
    const q = U.norm(query);
    const all = commands();
    const hizli = quickCommand();
    if(!q) return all.slice(0, 30);
    const liste = all.filter(c => U.norm(c.label + ' ' + c.kind + ' ' + (c.hint || '')).indexOf(q) >= 0)
      .slice(0, 30);
    /* Hızlı giriş her zaman EN ÜSTTE: Enter'a basan onu bekler. */
    return hizli ? [hizli].concat(liste) : liste;
  }

  function draw(){
    const root = document.getElementById('overlay-root');
    let el = document.getElementById('cmdk');
    if(!el){
      el = document.createElement('div');
      el.className = 'cmdk';
      el.id = 'cmdk';
      el.addEventListener('mousedown', e => { if(e.target === el) close(); });
      root.appendChild(el);
    }
    const rows = filtered();
    index = Math.max(0, Math.min(index, rows.length - 1));

    el.innerHTML = '<div class="cmdk__box" role="dialog" aria-modal="true" aria-label="Komut paleti">'
      + '<input class="cmdk__input" id="cmdk-input" placeholder="Ara ya da yaz: ferritin 26 · 45 dk yürüyüş · uyku 7,2" '
      + 'value="' + U.esc(query) + '" aria-label="Komut ara"/>'
      + '<div class="cmdk__list" role="listbox">'
      + (rows.length ? rows.map((c, i) =>
          '<button class="cmdk__item' + (i === index ? ' is-active' : '') + '" role="option"'
          + ' aria-selected="' + (i === index ? 'true' : 'false') + '"'
          + ' data-act="cmdk-run" data-id="' + U.esc(c.id) + '">'
          + SP.UI.icon(iconFor(c.kind))
          + '<span class="cmdk__text"><span class="cmdk__label">' + U.esc(c.label) + '</span>'
          + '<span class="cmdk__sub">' + U.esc(c.kind) + '</span></span>'
          + '<span class="cmdk__hintrow">' + U.esc(c.hint || '') + '</span></button>').join('')
        : '<p class="cmdk__empty">Eşleşen komut yok.</p>')
      + '</div>'
      + '<div class="cmdk__foot"><span>↑↓ gez · Enter aç · Esc kapat</span>'
      + '<span class="cmdk__tip">Veri de yazabilirsin: «ferritin 26»</span></div>'
      + '</div>';

    const input = document.getElementById('cmdk-input');
    if(input){
      input.oninput = e => { query = e.target.value; index = 0; draw(); };
      input.onkeydown = e => {
        const list = filtered();
        if(e.key === 'ArrowDown'){ e.preventDefault(); index = Math.min(index + 1, list.length - 1); draw(); }
        else if(e.key === 'ArrowUp'){ e.preventDefault(); index = Math.max(index - 1, 0); draw(); }
        else if(e.key === 'Enter'){ e.preventDefault(); run(list[index]); }
      };
      input.focus();
      /* imleci sona al */
      try{ input.setSelectionRange(query.length, query.length); }catch(err){}
    }
  }

  function run(cmd){
    if(!cmd) return;
    close();
    try{ cmd.run(); }catch(e){ console.error('Komut hatası:', e); }
  }

  function openPalette(){
    open = true;
    query = '';
    index = 0;
    draw();
  }

  function close(){
    open = false;
    const el = document.getElementById('cmdk');
    if(el) el.remove();
  }

  function isOpen(){ return open; }

  function runById(id){
    run(commands().find(c => c.id === id));
  }

  function showShortcuts(){
    SP.UI.sheet({
      title:'Klavye kısayolları',
      body:String(SP.C.Table({ tight:true, headers:['Tuş', 'İş'], rows:[
        ['Ctrl / ⌘ + K', 'Komut paletini aç'],
        ['?', 'Bu listeyi aç'],
        ['Esc', 'Sırayla: palet → ipucu → alt sayfa → kenar çubuğu'],
        ['↑ ↓', 'Palette gez'],
        ['Enter', 'Seçili komutu çalıştır'],
        ['j / k', 'Listede satır satır gez'],
        ['Enter', 'Odaktaki satırı aç'],
        ['ferritin 26', 'Palete veri de yazabilirsin'],
      ] })),
      footer:String(SP.C.Button({ label:'Kapat', act:'sheet-close' })),
      noFocus:true,
    });
  }

  return { open:openPalette, close, isOpen, runById, showShortcuts, commands,
    quickCommand, saveQuick };
})();
