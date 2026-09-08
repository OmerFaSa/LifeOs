/* Koç — sistemdeki veriyi okuyarak yanıtlayan sohbet ekranı.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz.
   Yetenek yoksa arayuz cevrimdisi moda duser; kisisel alan LLM'e gitmez. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.coach = (function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  let busy = false;
  let controller = null;

  function Bubble(m){
    return html`
      <div class="${m.role === 'user' ? 'msg msg--me' : 'msg msg--coach'}">
        <div class="msg__body">${raw(U.esc(m.text).replace(/\n/g, '<br/>'))}</div>
        ${when(m.warnings && m.warnings.length, () => html`
          <div class="msg__warn">${raw(UI.icon('warn'))} ${m.warnings.join(' ')}</div>`)}
      </div>`;
  }

  /* Kocun okudugu ozet — sohbetin ustunde sabit kalir. */
  function dataStrip(){
    const d = R.CoachTools.durum();
    const chips = [
      ['Hafta', d.programHaftasi+'/'+d.toplamHafta],
      ['TYT medyan', d.tytMedyan == null ? '—' : U.fmtNet(d.tytMedyan)],
      ['Plan', d.planTamamlama == null ? '—' : '%'+d.planTamamlama],
      ['Kapanış', '%'+d.konuKapanisYuzdesi],
      ['Due kart', String(d.dueKart)],
      ['Açık yanlış', String(d.acikYanlis)],
    ];
    return K.Row(map(chips, c => html`
      <span class="chip"><span class="dim">${c[0]}</span> <b>${c[1]}</b></span>`), { wrap:true });
  }

  function offlineView(){
    const note = R.PROMPTS.offlineTemplate(R.CoachTools.sanitize(R.CoachTools.durum()));
    return K.Grid([
      K.Span(8, K.Stack([
        K.Notice({ tone:'info', title:'Koç çevrimdışı.',
          body:'Yorum üretmek için bağlantı gerekir. Aşağıdaki not verini kural özetiyle birlikte hazırlar; '
             + 'kopyalayıp kendi yapay zekâna yapıştırabilirsin.' }),
        K.Card({ title:'Koç notu', sub:'Kişisel bilgin çıkarılmış hâliyle',
          actions:K.Button({ label:'Kopyala', icon:'edit', size:'sm', act:'coach-copy' }),
          body:html`<textarea class="textarea coachnote" id="coach-note" readonly rows="14"
            aria-label="koç notu">${note}</textarea>` }),
      ])),
      K.Span(4, raw(UI.rail(['ai-coach', 'offline', 'median', 'gate']))),
    ]);
  }

  function toolsCard(){
    return K.Card({
      title:'Koç neyi okuyabilir?', sub:'Yalnız okur, veriyi değiştirmez',
      body:html`<div class="stack-xs">${map(R.CoachTools.TOOLS, t => html`
        <div class="row-top gap-8">
          <span class="statedot state-closed mt-6"></span>
          <div><b class="small">${t.name.replace(/_/g, ' ')}</b>
            <div class="tiny dim">${t.description.split('.')[0]}</div></div>
        </div>`)}</div>`,
    });
  }

  async function render(){
    if(!R.Coach.available()) return String(offlineView());

    const msgs = S.coachChat || [];

    return String(K.Grid([
      K.Span(8, K.Stack([
        K.Card({
          title:'Koça sor', hint:'ai-coach',
          sub:'Verini okuyarak yanıtlar — deneme, hata, konu, hafta ve gün kayıtların',
          actions:when(msgs.length, () => K.Button({ label:'Sohbeti temizle', size:'sm', tone:'ghost', act:'coach-clear' })),
          body:dataStrip(),
        }),

        html`<div class="chat" id="chat-log">
          ${msgs.length
            ? map(msgs, Bubble)
            : html`<div class="chat__empty">${raw(UI.icon('guide'))}
                <p>Bir soru sor; koç önce verine bakar, sonra yanıtlar.</p></div>`}
          <div id="chat-pending"></div>
        </div>`,

        when(!msgs.length, () => K.Row(map(R.Coach.suggestions(), q =>
          K.Chip({ label:q, act:'coach-suggest', data:{ 'data-q':q } })), { wrap:true })),

        html`<div class="composer">
          ${K.Textarea({ id:'chat-input', rows:2, class:'composer__input',
            placeholder:'ör. bu hafta neye odaklanmalıyım?' })}
          ${K.Button({ label:'Sor', icon:'zap', tone:'primary', act:'coach-send' })}
        </div>`,
      ])),

      K.Span(4, K.Stack([
        toolsCard(),
        raw(UI.rail(['ai-coach', 'median', 'gate', 'closure'])),
      ])),
    ]));
  }

  async function send(question){
    if(busy) return;
    const q = (question || '').trim();
    if(!q) return;
    busy = true;
    controller = new AbortController();

    await R.Coach.pushChat('user', q);
    await R.App.render();

    const pending = document.getElementById('chat-pending');
    if(pending){
      pending.innerHTML = String(html`<div class="msg msg--coach">
        <div class="msg__body dim" id="chat-stream">Verine bakıyor…
          <span class="tiny">(ilk yanıt 10–60 sn sürebilir)</span></div></div>`);
    }
    scrollLog();

    try{
      const res = await R.Coach.ask(q, {
        signal:controller.signal,
        onText(ev){
          const el = document.getElementById('chat-stream');
          if(!el) return;
          el.classList.remove('dim');
          el.innerHTML = U.esc(ev.text).replace(/\n/g, '<br/>');
          scrollLog();
        },
      });
      await R.Coach.pushChat('assistant', res.text, res.warnings);
    }catch(err){
      const code = err && err.code;
      if(code !== 'cancelled') await R.Coach.pushChat('assistant', R.Coach.errorText(code));
    }finally{
      busy = false;
      controller = null;
      await R.App.render();
      scrollLog();
    }
  }

  function scrollLog(){
    const log = document.getElementById('chat-log');
    if(log) log.scrollTop = log.scrollHeight;
  }

  const handle = {
    async 'coach-send'(){
      const el = document.getElementById('chat-input');
      const q = el ? el.value : '';
      if(el) el.value = '';
      await send(q);
    },
    async 'coach-suggest'(el){ await send(el.dataset.q); },
    async 'coach-copy'(){
      const el = document.getElementById('coach-note');
      if(!el) return;
      try{
        await navigator.clipboard.writeText(el.value);
        UI.toast('Koç notu kopyalandı');
      }catch(e){
        el.select();
        UI.toast('Metni seç ve kopyala');
      }
    },
    async 'coach-clear'(){
      UI.confirmSheet('Sohbeti temizle', 'Koçla yaptığın konuşma silinecek. Çalışma verilerin etkilenmez.', async () => {
        await R.Coach.clearChat();
        UI.closeSheet();
        R.App.render();
      });
    },
  };

  function onKey(e){
    if(e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return;
    const el = document.getElementById('chat-input');
    if(el && document.activeElement === el){
      e.preventDefault();
      handle['coach-send']();
    }
  }

  return {
    id:'coach',
    title:'Koç',
    subtitle(){
      if(!R.Coach.available()) return 'Çevrimdışı — koç kullanılamıyor';
      const n = (S.coachChat || []).length;
      return n ? Math.ceil(n/2)+' soru soruldu · verini okuyarak yanıtlar' : 'Verini okuyarak yanıtlar';
    },
    actions(){ return ''; },
    render, handle, onKey, afterRender:scrollLog,
  };
})();
