/* Komut paleti — Ctrl+K.

   Her ekran, her hizli eylem ve her ajan tek bir aramadan ulasilir olsun
   diye vardir. Fare ile gezinmek zorunda kalmadan sistemin herhangi bir
   yerine gitmek, gunluk kullanimin surtunmesini belirgin dusurur.

   Palet ayni zamanda EN HIZLI VERI GIRISIDIR: «45 dk gitar» yazip Enter'a
   basmak bir oturum kaydeder. Yazilan sey kullanicinin kendi cumlesidir,
   modelin degil — bu yuzden onay kutusundan gecmez; ama YAZILMADAN ONCE
   ne kaydedilecegi gosterilir. */
window.LIFEOS.PARCA.yazilar({
  'esp.core.palette.bugune-yazilacak':'Bugüne yazılacak',
  'esp.core.palette.eslesmeyen-satir':'Eşleşmeyen satır',
  'esp.core.palette.kaydet':'Kaydet',
  'esp.core.palette.vazgec':'Vazgeç',
  'esp.core.palette.klavye-kisayollari':'Klavye kısayolları',
  'esp.core.palette.kapat':'Kapat',
});


window.ESP = window.ESP || {};

window.LIFEOS.PARCA.komut({ modul:'esp', sira:150, uret(){
  return ESP.DISCIPLINES.map(d => ({ id:'disc:' + d.id, kind:'Disiplin', label:d.label, hint:d.short, run:() => ESP.App.go(d.route) }));
} });

ESP.Palette = (function(){
  const U = ESP.U;

  let open = false;
  let query = '';
  let index = 0;
  let bekleyen = null;      // ayristirilmis ama henuz yazilmamis oturumlar

  function commands(){
    const out = [];

    /* ekranlar */
    (ESP.Nav ? ESP.Nav.sections() : []).forEach(sec => {
      sec.views.forEach(v => {
        out.push({ id:'go:' + v.route, kind:'Sayfa', label:v.label, hint:sec.label,
          run:() => ESP.App.go(v.route) });
      });
    });

    /* Eylemler parcadir: her satir kendi ekran dosyasinda (P.komut). */
    out.push(...window.LIFEOS.PARCA.komutlar('esp'));

    return out;
  }

  function iconFor(kind){
    if(kind === 'Sayfa') return 'list';
    if(kind === 'Eylem') return 'zap';
    if(kind === 'Disiplin') return 'target';
    if(kind === 'Ajan') return 'users';
    return 'search';
  }

  /* ---------------------------------------------------------- hizli giris

     Yazilan sey bir komuta benzemiyorsa oturum cumlesi olarak denenir.
     Ayristirilan sey EN USTTE bir satir olarak durur ve Enter onu calistirir:
     kullanici yazdiktan sonra fareye uzanmak zorunda kalmaz. */
  function quickCommand(){
    const s = query.trim();
    if(s.length < 4) return null;
    /* Ic e rakam gecmiyorsa oturum cumlesi olma ihtimali dusuk; arama
       sonuclarinin onune gecmesin. */
    if(!/\d/.test(s)) return null;

    const res = ESP.Parse.parseSession(s);
    if(!res.rows.length) return null;

    const ozet = res.rows.map(r => {
      const d = ESP.DISCIPLINE_BY_ID[r.disc];
      return (d ? d.short : r.disc) + ' ' + U.fmtMin(r.minutes);
    }).join(' · ');

    return {
      id:'quick:save', kind:'Kayıt', label:ozet + ' kaydet',
      hint:res.unmatched.length ? res.unmatched.length + ' satır eşleşmedi' : 'Bugüne yazılır',
      run:() => { bekleyen = res; onayGoster(res); },
    };
  }

  /* Yazmadan once ne yazilacagini gosterir. Kayit, kullanici onaylayana
     kadar YAPILMAZ — palet kendiliginden kaydetmez. */
  function onayGoster(res){
    const K = ESP.C;
    const satirlar = res.rows.map(r => {
      const d = ESP.DISCIPLINE_BY_ID[r.disc];
      return [d ? d.label : r.disc, U.fmtMin(r.minutes),
        r.count != null ? U.fmtNum(r.count) + ' ' + (r.countWhat || '') : '—'];
    });
    ESP.UI.sheet({
      title:yz('esp.core.palette.bugune-yazilacak'),
      body:String(K.Table({ tight:true, headers:['Disiplin', 'Süre', 'Sayım'], rows:satirlar }))
        + (res.unmatched.length
          ? String(K.Notice({ tone:'warn', title:yz('esp.core.palette.eslesmeyen-satir'),
              body:res.unmatched.map(u => u.text + ' — ' + u.why).join('<br/>')
                + '<br/><br/>Bu satırlar yazılmayacak; elle girebilirsin.' }))
          : ''),
      footer:String(K.Button({ label:yz('esp.core.palette.kaydet'), tone:'primary', act:'quick-save' }))
        + String(K.Button({ label:yz('esp.core.palette.vazgec'), act:'sheet-close' })),
    });
  }

  async function saveQuick(){
    if(!bekleyen){ ESP.UI.closeSheet(); return; }
    const bugun = U.todayISO();
    let yazilan = 0;
    for(const r of bekleyen.rows){
      await ESP.Model.addSession(bugun, {
        disc:r.disc, minutes:r.minutes, count:r.count, note:'',
      });
      yazilan++;
    }
    bekleyen = null;
    ESP.Memo.bitir();
    ESP.UI.closeSheet();
    ESP.UI.toast(yazilan + ' oturum bugüne yazıldı');
    ESP.App.go('today');
  }

  function filtered(){
    const q = U.norm(query);
    const all = commands();
    const hizli = quickCommand();
    if(!q) return all.slice(0, 30);
    const liste = all
      .filter(c => U.norm(c.label + ' ' + c.kind + ' ' + (c.hint || '')).indexOf(q) >= 0)
      .slice(0, 30);
    /* Hizli giris her zaman EN USTTE: Enter'a basan onu bekler. */
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
      + '<input class="cmdk__input" id="cmdk-input" placeholder="Ara ya da yaz: 45 dk gitar · 20 dakika kelime · tez" '
      + 'value="' + U.esc(query) + '" aria-label="Komut ara"/>'
      + '<div class="cmdk__list" role="listbox">'
      + (rows.length ? rows.map((c, i) =>
          '<button class="cmdk__item' + (i === index ? ' is-active' : '') + '" role="option"'
          + ' aria-selected="' + (i === index ? 'true' : 'false') + '"'
          + ' data-act="cmdk-run" data-id="' + U.esc(c.id) + '">'
          + ESP.UI.icon(iconFor(c.kind))
          + '<span class="cmdk__text"><span class="cmdk__label">' + U.esc(c.label) + '</span>'
          + '<span class="cmdk__sub">' + U.esc(c.kind) + '</span></span>'
          + '<span class="cmdk__hintrow">' + U.esc(c.hint || '') + '</span></button>').join('')
        : '<p class="cmdk__empty">Eşleşen komut yok.</p>')
      + '</div>'
      + '<div class="cmdk__foot"><span>↑↓ gez · Enter aç · Esc kapat</span>'
      + '<span class="cmdk__tip">Veri de yazabilirsin: «45 dk gitar»</span></div>'
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
    const hizli = quickCommand();
    if(hizli && hizli.id === id) return run(hizli);
    run(commands().find(c => c.id === id));
  }

  function showShortcuts(){
    ESP.UI.sheet({
      title:yz('esp.core.palette.klavye-kisayollari'),
      body:String(ESP.C.Table({ tight:true, headers:['Tuş', 'İş'], rows:[
        ['Ctrl / ⌘ + K', 'Komut paletini aç'],
        ['?', 'Bu listeyi aç'],
        ['Esc', 'Sırayla: palet → ipucu → alt sayfa → kenar çubuğu'],
        ['↑ ↓', 'Palette gez'],
        ['Enter', 'Seçili komutu çalıştır'],
        ['j / k', 'Listede satır satır gez'],
        ['45 dk gitar', 'Palete oturum da yazabilirsin'],
      ].concat(window.LIFEOS && window.LIFEOS.KISAYOL ? window.LIFEOS.KISAYOL.metinSatirlari() : []) })),
      footer:String(ESP.C.Button({ label:yz('esp.core.palette.kapat'), act:'sheet-close' })),
      noFocus:true,
    });
  }

  return { open:openPalette, close, isOpen, runById, showShortcuts, commands,
    quickCommand, saveQuick };
})();
