/* Telafi — durum tespiti, protokol baslatma ve takip.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.protocols = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  function isOpen(bag, key){ return !!((S.ui[bag] || {})[key]); }

  /* ---------- protokol karti ---------- */

  function stepList(def, active){
    const done = (active && active.steps) || {};
    if(!active) return html`<div class="steps mt-12">${map(def.steps, s => html`
      <div class="step"><div class="step__no"></div><div class="step__body"><p class="small">${s}</p></div></div>`)}</div>`;
    return html`<div class="steps mt-12">${map(def.steps, (s, i) => K.Checkbox({ label:s, checked:!!done[i],
      act:'proto-step', data:{ 'data-id':active.id, 'data-i':i } }))}</div>`;
  }

  function protocolCard(def, trigger, active){
    const steps = (active && active.steps) || {};
    const doneCount = active ? Object.keys(steps).filter(k => steps[k]).length : 0;
    const expanded = !!active || isOpen('protoOpen', def.id);

    return K.Card({
      class:active ? 'card--primary' : trigger ? 'card--accent' : null,
      title:def.title,
      sub:'Tetik: '+def.trigger+' · süre '+def.durationDays+' gün',
      badge:active ? K.Badge({ label:doneCount+'/'+def.steps.length+' adım', tone:'ok' })
        : trigger ? K.Badge({ label:'tetiklendi', tone:'warn' })
        : K.Badge({ label:'hazır', tone:'muted' }),
      body:html`
        ${when(trigger && !active, () => K.Notice({ tone:'warn', title:'Şu an geçerli:', body:trigger.detail }))}
        ${when(active, () => K.Notice({ tone:'ok', body:U.fmtDate(active.startedAt)+' tarihinde başladı · '
          + U.fmtDate(active.endsAt)+' tarihinde değerlendirilecek' }))}
        ${when(!expanded, () => K.Button({ label:def.steps.length+' adımı gör', size:'sm', class:'mt-10',
          act:'toggle-proto', data:{ 'data-key':def.id } }))}
        ${when(expanded, () => stepList(def, active))}`,
      foot:K.Row(active
        ? html`${K.Button({ label:'Protokolü kapat', size:'sm', act:'proto-finish', data:{ 'data-id':active.id } })}
               <span class="small dim">Kapatırken sonucu yaz — sonraki kapıda karşılaştırılır.</span>`
        : K.Button({ label:'Protokolü başlat', size:'sm', tone:trigger ? 'primary' : null,
            act:'proto-start', data:{ 'data-id':def.id } }),
        { wrap:true }),
    });
  }

  /* Uzun madde listeleri varsayilan olarak kapali. */
  function routineCard(title, items, key){
    return K.Collapsible({
      title, meta:items.length+' kural', act:'toggle-routine', data:{ 'data-key':key },
      open:isOpen('routineOpen', key),
      body:html`<ul class="bullets small muted mt-10">${map(items, m => html`<li>${m}</li>`)}</ul>`,
    });
  }

  function historyCard(){
    const past = S.protocols.filter(p => p.status !== 'active');
    if(!past.length) return null;
    return K.Card({ title:'Geçmiş protokoller', sub:past.length+' kapanmış kayıt',
      body:html`<div class="list">${map(past, p => html`
        <div class="listitem">
          <div class="grow"><b class="small">${p.title}</b>
            <div class="tiny dim">${U.fmtShort(p.startedAt)} – ${U.fmtShort(p.closedAt ? p.closedAt.slice(0, 10) : p.endsAt)}</div>
            ${when(p.outcome, () => html`<div class="tiny">${p.outcome}</div>`)}</div>
          ${K.Badge({ label:'kapandı', tone:'muted' })}
        </div>`)}</div>` });
  }

  /* ---------- ekran ---------- */

  function minimumDayCard(){
    const md = R.ROUTINES.minimumDay;
    const cells = [[md.minutes, 'dakika'], [md.paragraphs, 'paragraf'], [C.dueCards().length, 'due kart']];
    return K.Card({
      title:'Minimum gün standardı', hint:'minimum-day', sub:'Kötü günün alt sınırı',
      body:html`
        <div class="minday">${map(cells, c => html`
          <div><div class="stat__value num">${c[0]}</div><div class="tiny dim">${c[1]}</div></div>`)}</div>
        <p class="small muted mt-10">${md.note}</p>`,
    });
  }

  function sleepCard(){
    const avg = C.sleepAverage(7);
    const target = R.ROUTINES.sleep;
    return K.Card({
      title:'Uyku', hint:'sleep', sub:'Hedef '+target.targetLow+'–'+target.targetHigh+' saat',
      badge:avg != null ? K.Badge({ label:'7 gün ort. '+avg+' sa', tone:avg >= 7 ? 'ok' : 'warn' }) : null,
      body:K.Meter({ label:'Son 7 gün', value:avg == null ? 0 : U.pct(avg, S.profile.sleepTarget),
        text:avg == null ? 'kayıt yok' : avg+' sa', tone:avg != null && avg < 7 ? 'warn' : '' }),
    });
  }

  async function render(){
    const triggers = C.protocolTriggers();
    const active = M.activeProtocols();
    const triggerMap = {}; triggers.forEach(t => { triggerMap[t.id] = t; });
    const activeMap = {}; active.forEach(a => { activeMap[a.protoId] = a; });

    return String(K.Grid([
      K.Span(12, triggers.length
        ? K.Notice({ tone:'warn', title:triggers.length+' tetikleyici aktif.',
            body:triggers.map(t => t.detail).join(' · ')+' — aşağıdaki protokoller öneriliyor.' })
        : K.Notice({ tone:'ok', body:'Şu an telafi gerektiren bir sapma yok. '
            + 'Protokoller ihtiyaç doğduğunda otomatik olarak burada işaretlenir.' })),

      K.Span(8, K.Stack([
        K.SectionTitle('Telafi protokolleri',
          html`<span class="small dim">Kural motoru öneri verir, uygulama kararı sende</span>`),
        map(R.RECOVERY_PROTOCOLS, def => protocolCard(def, triggerMap[def.id], activeMap[def.id])),
        historyCard(),
      ])),

      K.Span(4, K.Stack([
        minimumDayCard(),
        sleepCard(),
        routineCard('Motivasyon ve dalgalanma', R.ROUTINES.motivation, 'motivation'),
        routineCard('Sınav kaygısı', R.ROUTINES.anxiety, 'anxiety'),
      ])),

      K.Span(2, raw(UI.rail(['protocol', 'trigger', 'minimum-day', 'sleep', 'anxiety']))),
    ]));
  }

  const handle = {
    async 'toggle-proto'(el){
      S.ui.protoOpen = S.ui.protoOpen || {};
      S.ui.protoOpen[el.dataset.key] = !S.ui.protoOpen[el.dataset.key];
      R.App.render();
    },
    async 'toggle-routine'(el){
      S.ui.routineOpen = S.ui.routineOpen || {};
      S.ui.routineOpen[el.dataset.key] = !S.ui.routineOpen[el.dataset.key];
      R.App.render();
    },
    async 'proto-start'(el){
      const rec = await M.startProtocol(el.dataset.id);
      UI.toast(rec.title+' başlatıldı');
      R.App.render();
    },
    async 'proto-step'(el){
      const rec = S.protocols.find(p => p.id === el.dataset.id);
      rec.steps = rec.steps || {};
      rec.steps[el.dataset.i] = el.checked;
      await M.saveProtocol(rec);
      R.App.render();
    },
    async 'proto-finish'(el){
      const rec = S.protocols.find(p => p.id === el.dataset.id);
      UI.sheet({
        title:'Protokolü kapat',
        subtitle:rec.title,
        body:String(K.Field({ label:'Sonuç', input:K.Textarea({ id:'proto-outcome', rows:3,
          placeholder:'Ne değişti? Plan tamamlama, net veya davranış olarak ölç.' }) })),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Kapat', tone:'primary', act:'proto-finish-save', data:{ 'data-id':rec.id } })}`),
      });
    },
    async 'proto-finish-save'(el){
      const rec = S.protocols.find(p => p.id === el.dataset.id);
      rec.status = 'closed';
      rec.closedAt = new Date().toISOString();
      rec.outcome = document.getElementById('proto-outcome').value.trim();
      await M.saveProtocol(rec);
      UI.closeSheet();
      UI.toast('Protokol kapatıldı');
      R.App.render();
    },
  };

  return {
    id:'protocols',
    title:'Telafi',
    subtitle(){
      const a = M.activeProtocols().length, t = C.protocolTriggers().length;
      return a ? a+' protokol aktif' : t ? t+' tetikleyici bekliyor' : 'Aktif telafi yok';
    },
    actions(){ return ''; },
    render, handle,
  };
})();
