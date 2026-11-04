/* Telafi — durum tespiti, protokol baslatma ve takip.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:190, group:'Git', label:'Telafi protokolleri', icon:'shield', route:'protocols', run(){ R.App.go('protocols'); } });
window.LIFEOS.PARCA.yazilar({
  'ays.protocols.hazir':'hazır',
  'ays.protocols.sure':'· süre',
  'ays.protocols.gun':'gün',
  'ays.protocols.su-an-gecerli':'Şu an geçerli:',
  'ays.protocols.protokolu-kapat':'Protokolü kapat',
  'ays.protocols.protokolu-baslat':'Protokolü başlat',
  'ays.protocols.gecmis-protokoller':'Geçmiş protokoller',
  'ays.protocols.kapandi':'kapandı',
  'ays.protocols.minimum-gun-standardi':'Minimum gün standardı',
  'ays.protocols.uyku':'Uyku',
  'ays.protocols.hedef':'Hedef ',
  'ays.protocols.7-gun-ort':'7 gün ort. ',
  'ays.protocols.son-7-gun':'Son 7 gün',
  'ays.protocols.sonuc':'Sonuç',
  'ays.protocols.ne-degisti-plan-tamamlama-ne':'Ne değişti? Plan tamamlama, net veya davranış olarak ölç.',
  'ays.protocols.vazgec':'Vazgeç',
  'ays.protocols.kapat':'Kapat',
  'ays.protocols.protokol-kapatildi':'Protokol kapatıldı',
  'ays.protocols.telafi':'Telafi',
});
window.LIFEOS.PARCA.sayfa({ id:'protocols', modul:'ays', cekmece:'analiz', ad:'Telafi', ikon:'shield', sira:40 });

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
      badge:active ? K.Badge({ label:doneCount+'/'+def.steps.length+' adım', tone:'ok' })
        : trigger ? K.Badge({ label:'tetiklendi', tone:'warn' })
        : K.Badge({ label:yz('ays.protocols.hazir'), tone:'muted' }),
      body:html`
        <p class="small muted">Tetik: ${def.trigger} ${yz('ays.protocols.sure')} ${def.durationDays} ${yz('ays.protocols.gun')}</p>
        ${when(trigger && !active, () => K.Notice({ tone:'warn', title:yz('ays.protocols.su-an-gecerli'), body:trigger.detail }))}
        ${when(active, () => K.Notice({ tone:'ok', body:U.fmtDate(active.startedAt)+' tarihinde başladı · '
          + U.fmtDate(active.endsAt)+' tarihinde değerlendirilecek' }))}
        ${when(!expanded, () => K.Button({ label:def.steps.length+' adımı gör', size:'sm', class:'mt-10',
          act:'toggle-proto', data:{ 'data-key':def.id } }))}
        ${when(expanded, () => stepList(def, active))}`,
      foot:K.Row(active
        ? html`${K.Button({ label:yz('ays.protocols.protokolu-kapat'), size:'sm', act:'proto-finish', data:{ 'data-id':active.id } })}`
        : K.Button({ label:yz('ays.protocols.protokolu-baslat'), size:'sm', tone:trigger ? 'primary' : null,
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
    return K.Card({ title:yz('ays.protocols.gecmis-protokoller'), sub:past.length+' kapanmış kayıt',
      body:html`<div class="list">${map(past, p => html`
        <div class="listitem">
          <div class="grow"><b class="small">${p.title}</b>
            <div class="tiny dim">${U.fmtShort(p.startedAt)} – ${U.fmtShort(p.closedAt ? R.U.gunOf(p.closedAt) : p.endsAt)}</div>
            ${when(p.outcome, () => html`<div class="tiny">${p.outcome}</div>`)}</div>
          ${K.Badge({ label:yz('ays.protocols.kapandi'), tone:'muted' })}
        </div>`)}</div>` });
  }

  /* ---------- ekran ---------- */

  function minimumDayCard(){
    const md = R.ROUTINES.minimumDay;
    const cells = [[md.minutes, 'dakika'], [md.paragraphs, 'paragraf'], [C.dueCards().length, 'due kart']];
    return K.Card({
      title:yz('ays.protocols.minimum-gun-standardi'), hint:'minimum-day',       body:html`
        <div class="minday">${map(cells, c => html`
          <div><div class="stat__value num">${c[0]}</div><div class="tiny dim">${c[1]}</div></div>`)}</div>
        <p class="small muted mt-10">${md.note}</p>`,
    });
  }

  function sleepCard(){
    const avg = C.sleepAverage(7);
    const target = R.ROUTINES.sleep;
    return K.Card({
      title:yz('ays.protocols.uyku'), hint:'sleep', sub:yz('ays.protocols.hedef')+target.targetLow+'–'+target.targetHigh+' saat',
      badge:avg != null ? K.Badge({ label:yz('ays.protocols.7-gun-ort')+avg+' sa', tone:avg >= 7 ? 'ok' : 'warn' }) : null,
      body:K.Meter({ label:yz('ays.protocols.son-7-gun'), value:avg == null ? 0 : U.pct(avg, S.profile.sleepTarget),
        text:avg == null ? 'kayıt yok' : avg+' sa', tone:avg != null && avg < 7 ? 'warn' : '' }),
    });
  }

  LIFEOS.PARCA.blok({ id:'protocols.etkin-tetikleyiciler', sayfa:'protocols', yer:'y1', sira:10, ad:'Etkin tetikleyiciler', ciz({ triggers, active, triggerMap, activeMap }){
    return triggers.length
        ? K.Notice({ tone:'warn', title:triggers.length+' tetikleyici aktif.',
            body:triggers.map(t => t.detail).join(' · ')+' — aşağıdaki protokoller öneriliyor.' })
        : K.Notice({ tone:'ok', body:'Telafi gerektiren sapma yok.' });
  } });
  LIFEOS.PARCA.blok({ id:'protocols.telafi-protokolleri', sayfa:'protocols', yer:'y2', sira:10, ad:'Telafi protokolleri', ciz({ triggers, active, triggerMap, activeMap }){
    return K.SectionTitle('Telafi protokolleri');
  } });
  LIFEOS.PARCA.blok({ id:'protocols.protocolcard', sayfa:'protocols', yer:'y2', sira:20, ad:'Protokol', ciz({ triggers, active, triggerMap, activeMap }){
    return map(R.RECOVERY_PROTOCOLS, def => protocolCard(def, triggerMap[def.id], activeMap[def.id]));
  } });
  LIFEOS.PARCA.blok({ id:'protocols.historycard', sayfa:'protocols', yer:'y2', sira:30, ad:'Geçmiş', ciz({ triggers, active, triggerMap, activeMap }){
    return historyCard();
  } });
  LIFEOS.PARCA.blok({ id:'protocols.minimumdaycard', sayfa:'protocols', yer:'y3', sira:10, ad:'Minimum gün', ciz({ triggers, active, triggerMap, activeMap }){
    return minimumDayCard();
  } });
  LIFEOS.PARCA.blok({ id:'protocols.sleepcard', sayfa:'protocols', yer:'y3', sira:20, ad:'Uyku', ciz({ triggers, active, triggerMap, activeMap }){
    return sleepCard();
  } });
  LIFEOS.PARCA.blok({ id:'protocols.routinecard', sayfa:'protocols', yer:'y3', sira:30, ad:'Rutin', ciz({ triggers, active, triggerMap, activeMap }){
    return routineCard('Motivasyon ve dalgalanma', R.ROUTINES.motivation, 'motivation');
  } });
  LIFEOS.PARCA.blok({ id:'protocols.routinecard-2', sayfa:'protocols', yer:'y3', sira:40, ad:'Rutin', ciz({ triggers, active, triggerMap, activeMap }){
    return routineCard('Sınav kaygısı', R.ROUTINES.anxiety, 'anxiety');
  } });
  LIFEOS.PARCA.blok({ id:'protocols.aciklamalar', sayfa:'protocols', yer:'y4', sira:10, ad:'Açıklamalar', ciz({ triggers, active, triggerMap, activeMap }){
    return raw(UI.rail(['protocol', 'trigger', 'minimum-day', 'sleep', 'anxiety']));
  } });
  async function render(){
    const triggers = C.protocolTriggers();
    const active = M.activeProtocols();
    const triggerMap = {}; triggers.forEach(t => { triggerMap[t.id] = t; });
    const activeMap = {}; active.forEach(a => { activeMap[a.protoId] = a; });

    const parcaB = { triggers, active, triggerMap, activeMap };
    return String(K.Grid([
    K.Span(12, LIFEOS.PARCA.yer('protocols', 'y1', K, parcaB, typeof raw === 'undefined' ? null : raw)),
    K.Span(8, K.Stack(LIFEOS.PARCA.liste('protocols', 'y2', K, parcaB))),
    K.Span(4, K.Stack(LIFEOS.PARCA.liste('protocols', 'y3', K, parcaB))),
    K.Span(12, LIFEOS.PARCA.yer('protocols', 'y4', K, parcaB, typeof raw === 'undefined' ? null : raw)),
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
        title:yz('ays.protocols.protokolu-kapat'),
        subtitle:rec.title,
        body:String(K.Field({ label:yz('ays.protocols.sonuc'), input:K.Textarea({ id:'proto-outcome', rows:3,
          placeholder:yz('ays.protocols.ne-degisti-plan-tamamlama-ne') }) })),
        footer:String(html`${K.Button({ label:yz('ays.protocols.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('ays.protocols.kapat'), tone:'primary', act:'proto-finish-save', data:{ 'data-id':rec.id } })}`),
      });
    },
    async 'proto-finish-save'(el){
      const rec = S.protocols.find(p => p.id === el.dataset.id);
      rec.status = 'closed';
      rec.closedAt = new Date().toISOString();
      rec.outcome = document.getElementById('proto-outcome').value.trim();
      await M.saveProtocol(rec);
      UI.closeSheet();
      UI.toast(yz('ays.protocols.protokol-kapatildi'));
      R.App.render();
    },
  };

  return {
    id:'protocols',
    /* iPhone Faz 3: açık yalnız tetiklenen ya da süren protokol; öbürleri,
       asgari gün, uyku ve geçmiş şerit; iki başvuru listesi gizli. */
    get kucukVarsayilan(){
      const G = (window.LIFEOS || {}).Gizle;
      if(!G) return [];
      const tetik = {}; C.protocolTriggers().forEach(t => { tetik[t.id] = true; });
      const etkin = {}; M.activeProtocols().forEach(a => { etkin[a.protoId] = true; });
      return R.RECOVERY_PROTOCOLS.filter(d => !tetik[d.id] && !etkin[d.id]).map(d => G.anahtar(d.title))
        .concat(['minimum-gün-standardı', 'uyku', 'geçmiş-protokoller']);
    },
    title:yz('ays.protocols.telafi'),
    subtitle(){
      const a = M.activeProtocols().length, t = C.protocolTriggers().length;
      return a ? a+' protokol aktif' : t ? t+' tetikleyici bekliyor' : 'Aktif telafi yok';
    },
    actions(){ return ''; },
    render, handle,
  };
})();
