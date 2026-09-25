/* Ekip sohbeti — bes ajandan biriyle konusma ekrani.

   Her ajan yalnizca kendi brifingini gorur; alan disi soruda kendi
   arkadasina yonlendirir. Model bagli degilse yanit kural motoru
   metninden gelir — ekran her kosulda calisir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.team = (function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;
  const O = R.Office;

  let busy = false;
  let controller = null;

  function current(){
    const id = S.ui.officeAgent;
    return R.AGENT_BY_ID[id] ? R.AGENT_BY_ID[id] : R.AGENT_BY_ID.patron;
  }

  function Avatar(agent){
    return html`<span class="${'agentav agentav--' + agent.id + ' agentav--sm'}"
      aria-hidden="true">${R.UI.pp(agent.id)}${agent.initial}</span>`;
  }

  function Bubble(agent, m){
    if(m.role === 'user'){
      return html`<div class="msg msg--me">
        <div class="msg__body">${raw(U.esc(m.text).replace(/\n/g, '<br/>'))}</div>
      </div>`;
    }
    return html`
      <div class="msg msg--agent">
        <div class="msg__who">${Avatar(agent)}<b>${agent.name}</b>
          <span class="dim">${agent.role}</span>
          ${when(m.mode === 'kural', () => K.Badge({ label:'kural motoru', tone:'info' }))}
        </div>
        <div class="msg__body">${raw(U.esc(m.text).replace(/\n/g, '<br/>'))}${OnayDugmeleri(m)}</div>
        ${when(m.warnings && m.warnings.length, () => html`
          <div class="msg__warn">${raw(UI.icon('warn'))} ${m.warnings.join(' ')}</div>`)}
        ${when(m.error, () => html`<div class="msg__warn">${raw(UI.icon('warn'))} ${m.error}</div>`)}
      </div>`;
  }

  /* Mesajin biraktigi oneri hala bekliyorsa onay dugmeleri gorunur;
     onaylanmis ya da reddedilmisse gorunmez — eski mesajda duran bir
     «Onayla», ikinci kez uygulamaya davetiye olurdu. */
  function bekleyenIds(m){
    const ids = (m && m.oneriIds) || [];
    const bek = R.Proposals.pending().map(p => p.id);
    return ids.filter(id => bek.indexOf(id) >= 0);
  }
  function OnayDugmeleri(m){
    const ids = bekleyenIds(m);
    if(!ids.length) return '';
    return html`<div class="row gap-8 mt-8">
      ${K.Button({ label:'Onayla ve uygula', icon:'check', size:'sm', tone:'primary',
        act:'chat-onayla', data:{ 'data-ids':ids.join(',') } })}
      ${K.Button({ label:'Vazgeç', size:'sm', tone:'ghost',
        act:'chat-vazgec', data:{ 'data-ids':ids.join(',') } })}
    </div>`;
  }

  /* ---- konusarak plan degistirme ----------------------------------

     Mesaj ajana gitmeden ONCE kural motoru bakar (core/komut.js). Bir
     plan komutu ya da veri girisi ise model HIC cagrilmaz: aksiyon oneri
     kutusundan gecer ve cevabi kural motoru yazar. Model «uyguladim»
     deyip uygulamamis olamaz. «evet», «vazgec», «geri al» da burada
     karsilanir — sesli sohbette dokunmadan onay budur. */
  function sonBekleyenMesaj(agentId){
    const l = O.chatOf(agentId);
    for(let i = l.length - 1; i >= 0; i--){
      if(l[i].role !== 'user' && bekleyenIds(l[i]).length) return l[i];
    }
    return null;
  }

  async function cevapYaz(agent, text, meta){
    const onEk = agent.id === 'patron' ? '' : 'Patron’a ilettim. ';
    await O.pushChat(agent.id, 'agent', onEk + text, Object.assign({ mode:'kural' }, meta || {}));
  }

  async function komutIsle(agent, question){
    /* Hafiza komutu («hatirla: …», «hafizam», «3 unut») once: cevabi kural
       motoru yazar, model cagrilmaz ve hafizaya model yazamaz. */
    if(R.Hafizam){
      const h = await R.Hafizam.komutIsle(question, { kapsam:'hepsi' });
      if(h){ await cevapYaz(agent, h.text); return true; }
    }
    /* «KPSS genel kültür müfredatını çıkar» — King'e iş emri
       (core/sinavprofil.js). Müfredat uydurulmaz: BAM çıkarır, sen onaylarsın. */
    if(R.TestKitabi){
      const tk = await R.TestKitabi.sohbet(question);
      if(tk){ await cevapYaz(agent, tk.text); return true; }
    }
    if(R.SinavProfil){
      const sp = await R.SinavProfil.sohbet(question);
      if(sp){ await cevapYaz(agent, sp.text); return true; }
    }
    /* Hedef sohbeti (core/hedefler.js): hedef cümlesi, sorulan eksiklerin
       cevabı ve seçenek seçimi. Hedef değilse null döner, sıradakine geçilir.
       Kararı kod verir; model çağrılmaz. */
    if(R.Hedefler && R.Hedefler.sohbet){
      const hd = await R.Hedefler.sohbet.isle(question);
      if(hd){ await cevapYaz(agent, hd.text); return true; }
    }
    if(!R.Komut) return false;
    const kisa = R.Komut.kisaCevap(question);
    if(kisa === 'geri'){
      const g = await R.Komut.geriAl();
      await cevapYaz(agent, g ? 'Geri aldım: ' + ((R.ACTION_BY_ID[g.action] || {}).title || g.action) + '.'
        : 'Geri alınacak bir değişikliğin yok.');
      return true;
    }
    if(kisa === 'evet' || kisa === 'hayir'){
      const son = sonBekleyenMesaj(agent.id);
      if(son){
        const ids = bekleyenIds(son);
        if(kisa === 'evet'){
          const r = await R.Komut.onayla(ids);
          await cevapYaz(agent, r.n ? 'Uyguladım. Geri almak istersen «geri al» de.'
            : 'Uygulayamadım: ' + (r.why.join(' · ') || 'öneri geçersizleşmiş.'));
        }else{
          await R.Komut.reddet(ids);
          await cevapYaz(agent, 'Tamam, vazgeçtim; hiçbir şey değişmedi.');
        }
        return true;
      }
    }
    const s = R.Komut.anla(question);
    if(!s.komut){
      /* «10 soru hazirla», «… arastir» — is HKM'deki BAM'a gider; sonuc
         teklif olarak doner (brand/ortak/ofis.js). Model cagrilmaz. */
      if(window.LIFEOS && LIFEOS.Ofis && LIFEOS.Ofis.bamIstegi(question)){
        R.Bam = R.Bam || LIFEOS.Ofis.bamKur({ hkm:() => R.Beacon });
        await cevapYaz(agent, (await R.Bam.ilet(question)).metin);
        return true;
      }
      return false;
    }
    const islem = await R.Komut.isle(s, { metin:question });
    await cevapYaz(agent, R.Komut.yanit(islem),
      { oneriIds:islem.bekleyen.map(k => k.row.id) });
    if(islem.yapilan.length){
      const rows = islem.yapilan.map(k => k.row.id);
      UI.toast(islem.yapilan.length === 1 ? islem.yapilan[0].baslik + ' uygulandı'
        : islem.yapilan.length + ' değişiklik uygulandı', {
        undo:async () => {
          for(const id of rows) await R.Proposals.undo(id);
          UI.toast('Geri alındı');
          R.App.render();
        },
      });
    }
    return true;
  }

  /* Ajanin masasindaki sayilar — sohbetin ustunde sabit durur,
     boylece yanitin neye dayandigi gorunur. */
  function deskStrip(agent){
    const b = O.brief(agent.id);
    return K.Row(map(b.metrics, m => html`
      <span class="chip"><span class="dim">${m.label}</span> <b>${m.value}</b></span>`), { wrap:true });
  }

  /* 134 AJAN SEÇİCİ: kutuya «@» ile başlayınca ajanlar rolüyle listelenir,
     eşleşen harf renkli; seçmek masayı değiştirir (team-agent). Yazma
     sırasında EKRAN ÇİZİLMEZ, yalnız liste kutusu yenilenir. */
  function mentionHtml(metin){
    const V = (window.LIFEOS || {}).VITRIN;
    const m = /^@(\S*)$/.exec(String(metin || '').trim());
    if(!V || !V.ajanSecici || !m) return '';
    return V.ajanSecici({ sorgu:m[1], act:'team-agent', ajanlar:R.AGENTS.map(a => ({ id:a.id, ad:a.name,
      harf:a.initial, rol:a.role, modul:'ays', sistem:'AYS' })) });
  }
  let mentionKurulu = false;
  function mentionKur(){
    if(mentionKurulu) return;
    mentionKurulu = true;
    document.addEventListener('input', e => {
      if(!e.target || e.target.id !== 'team-input') return;
      const kutu = document.getElementById('team-mention');
      if(kutu) kutu.innerHTML = mentionHtml(e.target.value);
    });
  }

  function picker(){
    return K.Segmented({
      act:'team-agent', value:current().id, block:true, aria:'Ajan seç',
      /* Sekmede de avatar durur: ofis kat planındaki kimlik rengi burada
         tekrarlanınca kimin masasında olduğun bakınca anlaşılır. */
      items:R.AGENTS.map(a => ({ value:a.id, label:html`<span class="agenttab">
        <span class="${'agentav agentav--xs agentav--' + a.id}" aria-hidden="true">${R.UI.pp(a.id)}${a.initial}</span>
        <span class="agenttab__name">${a.name}</span></span>` })),
    });
  }

  /* ---- sesli sohbet ------------------------------------------------

     Ekran bunu yeniden CIZMEZ, yalnizca panelin icini gunceller: her
     turda tam cizim yapilsa mikrofon dugmesi DOM'dan gider ve
     tarayici oturumu keser. */
  let sesli = { acik:false, durum:'kapalı', metin:'', hata:null };

  const DURUM_METNI = {
    'dinliyor':  { t:'Dinliyorum', a:'Sustuğunda sıra ona geçecek' },
    'düşünüyor': { t:'Düşünüyor',  a:'Raporuna bakıyor ve cümleyi kuruyor' },
    'konuşuyor': { t:'Konuşuyor',  a:'Kesmek için Kes\'e bas ya da boşluk tuşu' },
    'kapalı':    { t:'Kapalı',     a:'' },
  };

  function voiceCard(){
    if(!R.Talk.supported()) return null;
    const agent = current();
    const d = DURUM_METNI[sesli.durum] || DURUM_METNI['kapalı'];
    return K.Card({
      title:'Sesli sohbet', sub:agent.name + ' ile sıra sırayla',
      body:html`
        <div class="ses" id="ses-panel" data-durum="${sesli.durum}">
          <div class="ses__hal">
            <span class="ses__isik" aria-hidden="true"></span>
            <div class="minw0">
              <b class="ses__t">${d.t}</b>
              <span class="ses__a">${d.a}</span>
            </div>
          </div>
          <p class="ses__metin" id="ses-metin">${sesli.metin || ''}</p>
        </div>
        ${when(sesli.hata, () => K.Notice({ tone:'warn', class:'mt-10', body:sesli.hata }))}
        ${when(!sesli.acik && !R.Talk.sesliCevapVar(), () => K.Notice({ tone:'info', class:'mt-10',
          body:'Bu tarayıcıda sesli cevap yok. Sıra yine geçer; cevabı okursun.' }))}
        <div class="row mt-10">
          ${when(!sesli.acik, () => K.Button({ label:'Sesli sohbeti başlat',
            icon:'mic', act:'talk-start' }))}
          ${when(sesli.acik, () => html`
            ${K.Button({ label:'Bitir', act:'talk-stop' })}
            ${K.Button({ label:'Kes', act:'talk-cut',
              disabled:sesli.durum !== 'konuşuyor' })}`)}
        </div>`,
    });
  }

  /* Panelin icini YERINDE gunceller — tam cizim mikrofonu koparir. */
  function panelTazele(st){
    sesli = { acik:st.acik, durum:st.durum, metin:st.metin, hata:st.hata };
    const p = document.getElementById('ses-panel');
    if(!p){ R.App.render(); return; }
    p.setAttribute('data-durum', st.durum);
    const d = DURUM_METNI[st.durum] || DURUM_METNI['kapalı'];
    const t = p.querySelector('.ses__t'), a2 = p.querySelector('.ses__a');
    const m = document.getElementById('ses-metin');
    if(t) t.textContent = d.t;
    if(a2) a2.textContent = d.a;
    if(m) m.textContent = st.metin || '';
  }

  async function render(){
    O.resetBriefs();
    const agent = current();
    const msgs = O.chatOf(agent.id);
    const ruleMode = O.mode() !== 'llm';

    return String(K.Grid([
      K.Span(8, K.Stack([
        K.Card({
          body:html`
            <div class="desk__head">
              ${html`<span class="${'agentkare agentkare--' + agent.id}" aria-hidden="true">${R.UI.ppKare(agent.id)}${agent.initial}</span>`}
              <div class="minw0">
                <b class="desk__name">${agent.name}</b>
                <span class="desk__role">${agent.role} — ${agent.desk}</span>
              </div>
              ${when(msgs.length, () => K.Button({ label:'Temizle', size:'sm', tone:'ghost', act:'team-clear' }))}
            </div>
            <p class="small muted mt-8">${agent.scope}</p>
            <div class="mt-10">${deskStrip(agent)}</div>`,
        }),

        picker(),

        when(ruleMode, () => K.Notice({ tone:'info', title:'Model bağlı değil.',
          body:'Ajan yine de verine bakıp yanıtlıyor ama cümleleri kural motorundan geliyor. '
             + 'Ücretsiz bir model bağlarsan kendi cümleleriyle konuşur.' })),

        html`<div class="chat" id="chat-log">
          ${msgs.length
            ? map(msgs, m => Bubble(agent, m))
            : html`<div class="chat__empty">${raw(UI.icon('guide'))}
                <p>${agent.name} masasındaki raporu okudu. Sor ya da brifing iste.</p></div>`}
          <div id="chat-pending"></div>
        </div>`,

        K.Row(map(agent.ask, q => K.Chip({ label:q, act:'team-suggest', data:{ 'data-q':q } })), { wrap:true }),

        html`<div id="team-mention" class="team-mention"></div>
        <div class="composer">
          ${K.Textarea({ id:'team-input', rows:2, class:'composer__input',
            aria:agent.name + '’a soru yaz',
            placeholder:agent.name + '’a sor…' })}
          ${K.Button({ label:'Sor', icon:'zap', tone:'primary', act:'team-send' })}
        </div>`,
      ])),

      K.Span(4, K.Stack([
        /* Ses tanima yoksa voiceCard() null doner: olmayan bir
           yetenegin dugmesini gostermek, basip bir sey olmamasindan
           kotudur. */
        voiceCard(),
        K.Card({
          title:'Masasındaki rapor', sub:'Kural motoru hesapladı; ajan bunu yorumlar',
          actions:K.Button({ label:'Brifing', icon:'refresh', size:'sm', act:'team-brief' }),
          body:html`
            <div class="stack-xs">${map(O.brief(agent.id).findings, f => html`
              <div class="finding">
                <span class="${'finding__dot finding__dot--' + (f.tone || 'muted')}"></span>
                <span>${f.text}</span>
              </div>`)}</div>
            <p class="tiny dim mt-10">Okuduğu veri: ${agent.reads.join(' · ')}</p>`,
        }),
        K.Card({
          title:'Ekipteki diğerleri', sub:'Alan dışı soruyu sahibine sor',
          body:html`<div class="stack-xs">${map(R.AGENTS.filter(a => a.id !== agent.id), a => html`
            <button class="agentrow" data-act="team-agent" data-value="${a.id}">
              ${Avatar(a)}
              <span class="minw0"><b class="small">${a.name}</b>
                <span class="tiny dim">${a.desk}</span></span>
            </button>`)}</div>`,
        }),
        raw(UI.rail([agent.hint, 'ai-coach'])),
      ].filter(Boolean))),
    ]));
  }

  /* ---------- konusma ---------- */

  function scrollLog(){
    const log = document.getElementById('chat-log');
    if(log) log.scrollTop = log.scrollHeight;
  }

  function pendingBox(agent, label){
    const pending = document.getElementById('chat-pending');
    if(!pending) return;
    pending.innerHTML = String(html`
      <div class="msg msg--agent">
        <div class="msg__who">${Avatar(agent)}<b>${agent.name}</b><span class="dim">${agent.role}</span></div>
        <div class="msg__body dim" id="chat-stream">${label}
          <span class="tiny">(ücretsiz modellerde ilk yanıt 10–60 sn sürebilir)</span></div>
      </div>`);
    scrollLog();
  }

  async function run(kind, question){
    if(busy) return;
    const agent = current();
    busy = true;
    controller = new AbortController();

    if(kind === 'ask'){
      await O.pushChat(agent.id, 'user', question);
      let islendi = false;
      try{ islendi = await komutIsle(agent, question); }
      catch(e){ islendi = false; }
      if(islendi){
        busy = false;
        controller = null;
        await R.App.render();
        scrollLog();
        return;
      }
      await R.App.render();
    }
    pendingBox(agent, kind === 'ask' ? 'Raporuna bakıyor…' : 'Brifingi hazırlıyor…');

    try{
      const opts = {
        signal:controller.signal,
        onText(ev){
          const el = document.getElementById('chat-stream');
          if(!el) return;
          el.classList.remove('dim');
          el.innerHTML = U.esc(ev.text).replace(/\n/g, '<br/>');
          scrollLog();
        },
      };
      const res = kind === 'ask'
        ? await O.ask(agent.id, question, opts)
        : await O.briefing(agent.id, opts);
      await O.pushChat(agent.id, 'agent', res.text, {
        warnings:res.warnings || [], mode:res.mode, error:res.error || null,
      });
    }catch(err){
      if(!(err && err.code === 'cancelled')){
        await O.pushChat(agent.id, 'agent', R.LLM.errorText(err && err.code), { mode:'kural' });
      }
    }finally{
      busy = false;
      controller = null;
      await R.App.render();
      scrollLog();
    }
  }

  const handle = {
    async 'chat-onayla'(el){
      const ids = String(el.dataset.ids || '').split(',').filter(Boolean);
      const r = await R.Komut.onayla(ids);
      await cevapYaz(current(), r.n ? 'Uyguladım. Geri almak istersen «geri al» de.'
        : 'Uygulayamadım: ' + (r.why.join(' · ') || 'öneri geçersizleşmiş.'));
      await R.App.render();
      scrollLog();
    },
    async 'chat-vazgec'(el){
      const ids = String(el.dataset.ids || '').split(',').filter(Boolean);
      await R.Komut.reddet(ids);
      await cevapYaz(current(), 'Tamam, vazgeçtim; hiçbir şey değişmedi.');
      await R.App.render();
      scrollLog();
    },
    async 'team-agent'(el){
      const id = el.dataset.value;
      if(!R.AGENT_BY_ID[id]) return;
      if(busy && controller) controller.abort();
      /* Koc degisirse sesli oturum biter: birine baslayip digerinden
         cevap almak sohbeti degil karisikligi buyutur. */
      if(R.Talk.isActive()){ R.Talk.stop(); sesli.acik = false; }
      S.ui.officeAgent = id;
      R.App.render();
    },
    async 'talk-start'(){
      const r = R.Talk.start(current().id, {
        onChange:panelTazele,
        /* Ekranin KENDI gonderme yolu: ses ikinci bir kapi acmaz. */
        async gonder(soru){
          await run('ask', soru);
          const liste = O.chatOf(current().id);
          const son = liste[liste.length - 1];
          return son && son.role === 'agent' ? son.text : '';
        },
      });
      if(!r.ok){ UI.toast(r.message || 'Sesli sohbet başlatılamadı'); return; }
      sesli.acik = true;
      R.App.render();
    },
    async 'talk-stop'(){ R.Talk.stop(); sesli.acik = false; R.App.render(); },
    async 'talk-cut'(){ if(!R.Talk.kes()) UI.toast('Şu an konuşmuyor'); },

    async 'team-send'(){
      const el = document.getElementById('team-input');
      const q = el ? el.value.trim() : '';
      if(el) el.value = '';
      if(q) await run('ask', q);
    },
    async 'team-suggest'(el){ await run('ask', el.dataset.q); },
    async 'team-brief'(){ await run('brief'); },
    async 'team-clear'(){
      const agent = current();
      UI.confirmSheet('Sohbeti temizle',
        agent.name + ' ile yaptığın konuşma silinecek. Çalışma verilerin etkilenmez.', async () => {
          await O.clearChat(agent.id);
          UI.closeSheet();
          R.App.render();
        });
    },
  };

  function onKey(e){
    if(e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return;
    const el = document.getElementById('team-input');
    if(el && document.activeElement === el){
      e.preventDefault();
      handle['team-send']();
    }
  }

  return {
    id:'team',
    title:'Ekip sohbeti',
    subtitle(){
      const agent = current();
      const n = O.chatOf(agent.id).length;
      return agent.name + ' · ' + agent.role + (n ? ' · ' + Math.ceil(n/2) + ' soru' : '');
    },
    actions(){
      return String(R.C.Button({ label:'Ofis', icon:'guide', size:'sm', act:'go',
        data:{ 'data-route':'office' } }));
    },
    render, handle, onKey, afterRender(){ mentionKur(); scrollLog(); }, mentionHtml,
  };
})();
