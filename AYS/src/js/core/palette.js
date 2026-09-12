/* Komut paleti (Ctrl/Cmd+K) ve odak modu.
   Amac: gunluk kullanimda tikla-gezin yerine tek kisayolla is baslatmak. */

window.R = window.R || {};

R.Palette = (function(){
  const U = R.U, UI = R.UI, S = R.S;

  let active = 0;
  let items = [];

  /* ---------- komut listesi ---------- */
  function commands(){
    const M = R.Model, C = R.Calc;
    const list = [];

    const go = (id, label, icon, group) => ({ group, label, icon, run(){ R.App.go(id); } });

    list.push(go('today','Bugün','today','Git'));
    list.push(go('week','Hafta — sözleşme ve review','week','Git'));
    list.push(go('learn','Öğrenme — video ve ders notu','play','Git'));
    list.push(go('exams','Deneme','exam','Git'));
    list.push(go('quiz','Sınama — kendini test et','zap','Git'));
    list.push(go('cards','Tekrar ve yanlış defteri','cards','Git'));
    list.push(go('subjects','Dersler — konu kapanışı','book','Git'));
    list.push(go('plan','40 haftalık plan','map','Git'));
    list.push(go('target','Hedef, net matrisi, tercih','target','Git'));
    list.push(go('progress','İlerleme — KPI ve karar kapısı','chart','Git'));
    list.push(go('analytics','Analiz — karşılaştırma, sıra geçmişi, alışkanlık','search','Git'));
    list.push(go('profiles','Profiller ve gözetmen özeti','shield','Git'));
    list.push(go('coach','Koç — verine bakarak yanıtlar','zap','Git'));
    list.push(go('protocols','Telafi protokolleri','shield','Git'));
    list.push(go('guide','Rehber ve ayarlar','guide','Git'));

    list.push({ group:'Kayıt', label:'Deneme ekle', icon:'plus', hint:'Cmt', run(){ R.App.go('exams'); setTimeout(()=>R.Screens.exams.handle['new-exam']({dataset:{}}), 60); } });
    list.push({ group:'Kayıt', label:'Tekrar kartı ekle', icon:'plus', run(){ R.App.go('cards'); setTimeout(()=>R.Screens.cards.handle['new-card']({dataset:{}}), 60); } });
    list.push({ group:'Kayıt', label:'Ders ekle (video / not)', icon:'plus', run(){ R.App.go('learn'); setTimeout(()=>R.Screens.learn.handle['note-new']({dataset:{}}), 60); } });
    list.push({ group:'Kayıt', label:'Süreli deneme oturumu', icon:'clock', run(){ R.App.go('exams'); setTimeout(()=>R.Screens.exams.handle['run-open']({dataset:{}}), 60); } });
    list.push({ group:'Kayıt', label:'Sınamayı başlat', icon:'play', run(){ R.App.go('quiz'); setTimeout(()=>R.Screens.quiz.handle['quiz-start']({dataset:{}}), 60); } });
    list.push({ group:'Kayıt', label:'Weekly review’u aç', icon:'check', hint:'Paz', run(){ R.App.go('week'); setTimeout(()=>R.Screens.week.openReview(), 60); } });

    const day = S.days[U.todayISO()];
    if(day){
      const running = day.blocks.find(b => b.startedAt);
      if(running){
        list.push({ group:'Odak', label:'Odak moduna dön — '+running.topic, icon:'clock', run(){ R.Palette.openFocus(); } });
        list.push({ group:'Odak', label:'Bloğu bitir', icon:'stop', run(){ R.Screens.today.handle['timer-stop']({ dataset:{ block:running.id } }); } });
      }else{
        day.blocks.filter(b => b.status === 'pending' && b.slot !== 'Dinlenme').forEach(b => {
          list.push({ group:'Odak', label:'Başlat: '+b.topic, icon:'play', run(){
            R.App.go('today');
            setTimeout(()=>R.Screens.today.handle['timer-start']({ dataset:{ block:b.id } }), 60);
          }});
        });
      }
    }

    R.SUBJECTS.forEach(s => {
      list.push({ group:'Ders', label:s.name, icon:'book', run(){ S.ui.subjectOpen = s.id; R.App.go('subjects'); } });
    });

    R.Calc.riskRanking(5).forEach(r => {
      list.push({ group:'Öncelik', label:r.topicName+' — risk '+r.score, icon:'target',
        keywords:r.subjectName, weight:4,
        run(){ S.ui.subjectOpen = r.subjectId; R.App.go('subjects');
          setTimeout(()=>R.Screens.subjects.handle['open-topic']({ dataset:{ subject:r.subjectId, topic:r.topicId } }), 80); } });
    });

    const cur = M.currentWeek();
    [cur-1, cur, cur+1].forEach(n => {
      if(n < 1 || n > R.PLAN.totalWeeks) return;
      const c = R.Model.curriculumFor(n);
      list.push({ group:'Hafta', label:'Hafta '+n+' — '+c.title, icon:'week',
        run(){ S.ui.weekView = n; R.App.go('week'); } });
    });

    const theme = S.profile ? S.profile.theme : 'system';
    list.push({ group:'Sistem', label:'Tema: '+(theme === 'dark' ? 'açığa geç' : theme === 'light' ? 'sisteme geç' : 'koyuya geç'), icon:'moon',
      run(){
        const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
        S.profile.theme = next;
        R.Model.saveProfile().then(() => { R.App.applyTheme(); R.App.render(); });
      }});
    list.push({ group:'Sistem', label:'Bugün olmuyor — minimum güne in', icon:'moon', run(){ R.Screens.today.handle['bad-day'](); } });
    list.push({ group:'Sistem', label:'Hafta özetini paylaş', icon:'upload', run(){ R.Screens.today.handle['share-week'](); } });
    list.push({ group:'Sistem', label:'Yedek al (JSON)', icon:'download', run(){ R.Screens.guide.handle['export-data']({dataset:{}}); } });
    list.push({ group:'Sistem', label:'Kısayolları göster', icon:'guide', run(){ showShortcuts(); } });

    return list;
  }

  /* Turkce karakterleri normalize eder: "ogrenme" ile "öğrenme" eslesir. */
  const norm = R.U.norm;
  const { html, raw, when, cls, map } = R.h;
  const K = R.C;

  function score(cmd, q){
    if(!q) return cmd.weight || 1;
    const label = norm(cmd.group+' '+cmd.label+' '+(cmd.keywords || ''));
    const needle = norm(q);
    const base = cmd.weight || 1;
    if(label.indexOf(needle) === 0) return 100 + base;          // bastan tam eslesme
    const wordStart = label.indexOf(' '+needle);
    if(wordStart >= 0) return 60 + base;                        // kelime basi
    if(label.indexOf(needle) >= 0) return 40 + base;            // icinde gecer
    // harf sirasi eslesmesi (fuzzy) — yakinlik kadar puan
    let i = 0, gaps = 0;
    for(const ch of needle){
      const next = label.indexOf(ch, i);
      if(next === -1) return 0;
      gaps += next - i;
      i = next + 1;
    }
    return Math.max(1, 20 - Math.min(18, gaps/2)) + base;
  }

  /* Arama sonuclarinda eslesen bolumu vurgular */
  function markMatch(text, q){
    if(!q) return U.esc(text);
    const nText = norm(text), nQ = norm(q);
    const at = nText.indexOf(nQ);
    if(at < 0) return U.esc(text);
    return U.esc(text.slice(0, at))
      + '<mark class="cmdk__mark">'+U.esc(text.slice(at, at+q.length))+'</mark>'
      + U.esc(text.slice(at+q.length));
  }

  /* Sorgu bazli icerik aramasi: konular, denemeler, hatalar, kartlar, haftalar */
  function searchContent(q){
    if(!q || q.length < 2) return [];
    const S2 = R.S, M2 = R.Model;
    const out = [];
    const nQ = norm(q);
    const hit = txt => txt && norm(txt).indexOf(nQ) >= 0;

    R.SUBJECTS.forEach(s => {
      s.topics.forEach(t => {
        if(hit(t.name) || hit(s.name)){
          const st = M2.topicState(s.id, t.id);
          out.push({ group:'Konu', label:t.name, sub:s.name+' · '+R.TOPIC_STATES[st.state].label,
            icon:'book', weight:6,
            run(){ S2.ui.subjectOpen = s.id; R.App.go('subjects'); setTimeout(()=>{
              const el = document.querySelector('[data-topic="'+t.id+'"]');
              if(el){ el.scrollIntoView({block:'center'}); el.click(); }
            }, 120); } });
        }
      });
    });

    S2.exams.forEach(e => {
      if(hit(e.type) || hit(e.publisher) || hit(e.date)){
        out.push({ group:'Deneme', label:e.type+' · '+U.fmtShort(e.date),
          sub:(e.publisher||'')+' · net '+U.fmtNet(M2.examNet(e)), icon:'exam', weight:5,
          run(){ S2.ui.examOpen = e.id; R.App.go('exams'); } });
      }
    });

    S2.errors.forEach(e => {
      if(hit(e.rootCause) || hit(e.topic) || hit(e.principle)){
        out.push({ group:'Yanlış', label:(e.topic || e.testName || 'Yanlış')+' — '+(e.rootCause||''),
          sub:e.tag+' · '+(e.closedAt ? 'kapandı' : 'açık'), icon:'edit', weight:4,
          run(){ S2.ui.cardTab = 'notebook'; R.App.go('cards'); } });
      }
    });

    S2.cards.forEach(c => {
      if(hit(c.front) || hit(c.topic)){
        out.push({ group:'Kart', label:c.front, sub:(c.topic||'')+' · '+U.fmtShort(c.dueAt),
          icon:'cards', weight:3,
          run(){ S2.ui.cardTab = 'all'; S2.ui.cardQuery = c.front.slice(0,24); R.App.go('cards'); } });
      }
    });

    S2.videoNotes.forEach(n => {
      const segHit = n.segments.find(seg => hit(seg.text));
      if(hit(n.title) || segHit){
        out.push({ group:'Ders notu', label:n.title || 'Adsız ders',
          sub:segHit ? M2.fmtTs(segHit.ts)+' · '+segHit.text.slice(0,60) : M2.noteTopicName(n),
          icon:'play', weight:5,
          run(){ S2.ui.noteOpen = n.id; R.App.go('learn'); } });
      }
    });

    for(let n = 1; n <= R.PLAN.totalWeeks; n++){
      const c = M2.curriculumFor(n);
      if(hit(c.title) || c.topics.some(hit)){
        out.push({ group:'Hafta', label:'Hafta '+n+' — '+c.title, sub:c.topics.join(' · '),
          icon:'week', weight:2,
          run(){ R.S.ui.weekView = n; R.App.go('week'); } });
      }
    }

    Object.keys(R.HINTS).forEach(k => {
      const h = R.HINTS[k];
      if(hit(h.t) || hit(h.b)){
        out.push({ group:'Bilgi', label:h.t, sub:h.b, icon:'guide', weight:1,
          run(){ R.App.render(); setTimeout(()=>{
            const btn = document.querySelector('[data-hint="'+k+'"]');
            if(btn) btn.click(); else R.UI.toast(h.t+' — '+h.b);
          }, 80); } });
      }
    });

    return out.slice(0, 30);
  }

  /* ---------- render ---------- */
  function open(){
    close();
    const el = document.createElement('div');
    el.className = 'cmdk';
    el.id = 'cmdk';
    el.innerHTML = String(html`
      <div class="cmdk__box" role="dialog" aria-label="Komut paleti">
        <input class="cmdk__input" id="cmdk-input" placeholder="Ne yapmak istiyorsun?" autocomplete="off"/>
        <div class="cmdk__list" id="cmdk-list"></div>
        <div class="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> gez</span>
          <span><kbd>↵</kbd> seç</span><span><kbd>esc</kbd> kapat</span></div>
      </div>`);
    el.addEventListener('mousedown', e => { if(e.target === el) close(); });
    document.getElementById('overlay-root').appendChild(el);

    const input = document.getElementById('cmdk-input');
    input.addEventListener('input', () => { active = 0; renderList(input.value); });
    input.addEventListener('keydown', onKey);
    renderList('');
    setTimeout(() => input.focus(), 20);
  }

  /* ---- konusarak veri girisi ---------------------------------------

     Cumlede VERI varsa once kural motoru cozer; model hic cagrilmaz.
     «matematikten 40 soru cozdum ve 20 paragraf yaptim» iki oneri
     uretir ve ikisi de ayri ayri onaylanir.

     Komut listesinin EN USTUNDE durur: Enter'a basan onu bekler. */
  let bekleyen = null;

  function veriKomutu(q){
    const t = String(q || '').trim();
    if(t.length < 4 || !R.Entry) return null;
    let r;
    try{ r = R.Entry.fromText(t, { date:R.U.todayISO() }); }catch(e){ return null; }
    if(!r.oneriler.length) return null;
    const adlar = r.oneriler.map(o => {
      const e = R.Proposals.eylem ? R.Proposals.eylem(o.action) : null;
      return (e && e.label) || ETIKET[o.action] || o.action;
    });
    return {
      group:'Kayıt', icon:'zap',
      label:adlar.join(' · '),
      sub:r.oneriler.length === 1 ? '1 kayıt' : r.oneriler.length + ' kayıt',
      hint:'Enter',
      run:() => onizle(r, t),
    };
  }

  const ETIKET = {
    'soru-yaz':'Çözülen soru', 'paragraf-yaz':'Paragraf', 'problem-yaz':'Problem',
    'uyku-yaz':'Uyku', 'sure-yaz':'Çalışma süresi',
  };

  /* Onizleme: NE anlasildi ve ne degisecek. Kaydedilmeden once
     gorunur — onaysiz hicbir sey yazilmaz. */
  function onizle(r, metin){
    const K = R.C;
    const bloklar = r.oneriler.map(o => {
      const pv = R.Proposals.preview({ action:o.action, agent:'patron', params:o.params });
      const ad = ETIKET[o.action] || o.action;
      return html`
        <div class="qeblok">
          <div class="qeblok__bas"><b>${ad}</b>
            ${when(o.metin, () => html`<span class="tiny dim">«${o.metin}»</span>`)}</div>
          ${when(!pv.ok, () => html`<p class="small" style="color:var(--danger)">${pv.why}</p>`)}
          ${when(pv.ok, () => html`<div class="qeblok__satirlar">
            ${map(pv.rows || [], x => html`<div class="qeblok__satir">
              <span>${x.label}</span><span class="dim">${x.before}</span>
              <span aria-hidden="true">→</span><b>${x.after}</b></div>`)}
          </div>`)}
        </div>`;
    });

    close();
    UI.sheet({
      title:r.oneriler.length === 1 ? 'Bunu mu demek istedin?'
        : r.oneriler.length + ' kayıt anladım',
      subtitle:metin,
      body:String(html`
        <div class="qebloklar">${map(bloklar, b => b)}</div>
        ${when(r.anlasilmayan.length, () => K.Notice({ tone:'warn',
          title:'Çözemediğim kısım:',
          body:'«' + r.anlasilmayan.join('», «') + '» — bu kısım kaydedilmeyecek. '
            + 'Anlaşılmayan satır atılmaz, söylenir.' }))}
        ${K.Notice({ tone:'info',
          body:'Bu satırlar yorumlandı, KAYDEDİLMEDİ. Onaylayınca yazılır ve '
            + 'her biri tek tek geri alınabilir.' })}`),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:r.oneriler.length === 1 ? 'Kaydet' : 'Hepsini kaydet',
          tone:'primary', act:'veri-kaydet' })}`),
    });
    bekleyen = Object.assign({}, r, { metin });
  }

  async function veriKaydet(){
    if(!bekleyen) return;
    const metinSon = bekleyen.metin || '';
    let yazilan = 0, dusen = 0;
    for(const o of bekleyen.oneriler){
      /* Yetki Patron'da: konustugun ajan odur. Gerekce alanina SENIN
         cumlen yazilir — sayi koçun tahmininden degil senin sozunden
         cikar. */
      const kayit = await R.Proposals.propose({ action:o.action, agent:'patron',
        params:o.params, reason:o.metin || metinSon });
      if(!kayit){ dusen++; continue; }
      const res = await R.Proposals.approve(kayit.id);
      if(res) yazilan++; else dusen++;
    }
    bekleyen = null;
    UI.closeSheet();
    UI.toast(dusen ? yazilan + ' kayıt yazıldı, ' + dusen + ' tanesi yazılamadı'
      : yazilan + ' kayıt yazıldı');
    R.App.render();
  }

  function renderList(q){
    /* Komutlar ve icerik sonuclari ortak siralanir.
       Icerik sonuclari zaten gercek eslesmedir; bulanik komut eslesmesinin ustunde durur. */
    const scoredCommands = commands()
      .map(c => ({ c, s:score(c, q) }))
      .filter(x => x.s > 0);
    const scoredContent = searchContent(q)
      .map(c => ({ c, s:50 + (c.weight || 0) }));

    items = scoredCommands.concat(scoredContent)
      .sort((a,b) => b.s - a.s)
      .map(x => x.c)
      .slice(0, 40);
    /* Veri girisi HER ZAMAN en ustte: Enter'a basan onu bekler. */
    const veri = veriKomutu(q);
    if(veri) items = [veri].concat(items).slice(0, 40);
    active = Math.min(active, Math.max(0, items.length-1));

    const list = document.getElementById('cmdk-list');
    if(!items.length){
      list.innerHTML = String(html`<div class="cmdk__empty">“${q}” için sonuç yok.<br/>
        <span class="tiny">Konu, deneme, yanlış, kart ve hafta içinde de aranır.</span></div>`);
      return;
    }

    let lastGroup = null;
    list.innerHTML = String(map(items, (c, i) => {
      const head = c.group !== lastGroup ? html`<div class="cmdk__group">${c.group}</div>` : '';
      lastGroup = c.group;
      return html`${head}
        <button class="${cls('cmdk__item', i === active && 'is-active')}" data-cmd="${i}">
          ${raw(UI.icon(c.icon || 'right'))}
          <span class="cmdk__text"><span class="cmdk__label">${raw(markMatch(c.label, q))}</span>
            ${when(c.sub, () => html`<span class="cmdk__sub">${raw(markMatch(c.sub, q))}</span>`)}</span>
          ${when(c.hint, () => html`<span class="cmdk__hintrow">${c.hint}</span>`)}
        </button>`;
    }));

    list.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', e => { e.preventDefault(); pick(Number(btn.dataset.cmd)); });
      btn.addEventListener('mousemove', () => {
        const i = Number(btn.dataset.cmd);
        if(i !== active){ active = i; highlight(); }
      });
    });
  }

  function highlight(){
    const list = document.getElementById('cmdk-list');
    if(!list) return;
    list.querySelectorAll('[data-cmd]').forEach(b => {
      b.classList.toggle('is-active', Number(b.dataset.cmd) === active);
      if(Number(b.dataset.cmd) === active && b.scrollIntoView) b.scrollIntoView({ block:'nearest' });
    });
  }

  function onKey(e){
    if(e.key === 'ArrowDown'){ e.preventDefault(); active = Math.min(active+1, items.length-1); highlight(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); active = Math.max(active-1, 0); highlight(); }
    else if(e.key === 'Enter'){ e.preventDefault(); pick(active); }
    else if(e.key === 'Escape'){ e.preventDefault(); close(); }
  }

  function pick(i){
    const cmd = items[i];
    close();
    if(cmd) cmd.run();
  }

  function close(){
    const el = document.getElementById('cmdk');
    if(el) el.remove();
  }
  function isOpen(){ return !!document.getElementById('cmdk'); }

  const SHORTCUTS = [
    [['ctrl', 'k'], 'Komut paleti'],
    [['f'], 'Odak modu (blok çalışıyorsa)'],
    [['space'], 'Tekrar ekranında kartı çevir'],
    [['1', '2', '3'], 'Hatırlamadım / Zorlandım / Hatırladım'],
    [['?'], 'Bu listeyi aç'],
    [['esc'], 'Açık pencereyi kapat'],
  ];

  function showShortcuts(){
    UI.sheet({
      title:'Klavye kısayolları',
      body:String(K.Table({ tight:true, headers:['Tuş', 'İşlev'],
        rows:SHORTCUTS.map(s => [map(s[0], k => html`<kbd>${k}</kbd> `), s[1]]) })),
      noFocus:true,
      footer:String(K.Button({ label:'Kapat', act:'sheet-close' })),
    });
  }

  /* ---------- odak modu ---------- */
  let focusTick = null;

  function runningBlock(){
    const day = S.days[U.todayISO()];
    if(!day) return null;
    return day.blocks.find(b => b.startedAt) || null;
  }
  function elapsed(b){
    return b && b.startedAt ? Math.max(0, Math.floor((Date.now() - new Date(b.startedAt).getTime())/1000)) : 0;
  }

  function openFocus(){
    const b = runningBlock();
    if(!b){ UI.toast('Çalışan blok yok'); return; }
    closeFocus();
    const el = document.createElement('div');
    el.className = 'focusmode';
    el.id = 'focusmode';
    el.innerHTML = String(html`
      ${K.IconButton({ icon:'close', aria:'Odak modundan çık', act:'focus-close', class:'focusmode__esc' })}
      <div class="focusmode__slot">${b.slot}</div>
      <div class="focusmode__topic">${b.topic}</div>
      <div class="focusmode__clock" id="focus-clock">${U.fmtClock(elapsed(b))}</div>
      <div class="focusmode__ring" id="focus-ring"></div>
      <div class="focusmode__target" id="focus-target"></div>
      <div class="focusmode__actions">
        ${K.Button({ label:'Bloğu bitir', icon:'check', size:'lg', tone:'primary',
          act:'focus-finish', data:{ 'data-block':b.id } })}
        ${K.Button({ label:'Arkaplana al', size:'lg', act:'focus-close' })}
      </div>`);
    document.getElementById('overlay-root').appendChild(el);
    paintFocus();
    focusTick = setInterval(paintFocus, 1000);
  }

  function paintFocus(){
    const b = runningBlock();
    const clock = document.getElementById('focus-clock');
    if(!b || !clock){ closeFocus(); return; }
    const secs = elapsed(b);
    clock.textContent = U.fmtClock(secs);
    const pct = b.targetMin ? Math.min(100, 100*(secs/60)/b.targetMin) : 0;
    const ring = document.getElementById('focus-ring');
    if(ring) ring.innerHTML = String(K.Bar({ value:pct, large:true, tone:'' }));
    const target = document.getElementById('focus-target');
    if(target){
      const left = Math.max(0, b.targetMin - Math.floor(secs/60));
      target.textContent = left > 0
        ? 'hedefe '+left+' dakika'+(b.targetQ ? ' · '+b.targetQ+' soru' : '')
        : 'hedef süre doldu — dilediğin kadar devam edebilirsin';
    }
  }

  function closeFocus(){
    if(focusTick){ clearInterval(focusTick); focusTick = null; }
    const el = document.getElementById('focusmode');
    if(el) el.remove();
  }
  function isFocusOpen(){ return !!document.getElementById('focusmode'); }

  return { open, close, isOpen, openFocus, closeFocus, isFocusOpen, showShortcuts, runningBlock,
    veriKaydet, veriKomutu, commands };
})();
