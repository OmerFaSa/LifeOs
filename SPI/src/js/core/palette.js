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
    (SP.App ? SP.App.NAV : []).forEach(group => {
      group.items.forEach(it => {
        out.push({ id:'go:' + it.id, kind:'Ekran', label:it.label, hint:group.label,
          run:() => SP.App.go(it.id) });
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
      hint:'Toparlanma', run:() => SP.App.go('vitals') });
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
    return ({ 'Ekran':'layers', 'Eylem':'zap', 'Ölçüm':'flask', 'Ajan':'users' })[kind] || 'list';
  }

  function filtered(){
    const q = U.norm(query);
    const all = commands();
    if(!q) return all.slice(0, 30);
    return all.filter(c => U.norm(c.label + ' ' + c.kind + ' ' + (c.hint || '')).indexOf(q) >= 0)
      .slice(0, 30);
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
      + '<input class="cmdk__input" id="cmdk-input" placeholder="Ara: ferritin, öğün, toplantı…" '
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
      + '<div class="cmdk__foot"><span>↑↓ gez · Enter aç · Esc kapat</span></div>'
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
      ] })),
      footer:String(SP.C.Button({ label:'Kapat', act:'sheet-close' })),
      noFocus:true,
    });
  }

  return { open:openPalette, close, isOpen, runById, showShortcuts, commands };
})();
