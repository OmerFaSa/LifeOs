/* Ofis › İnceleme (eski «Toplantı», 2026-10-20).

   Kullanıcı: «Ofis toplantısı yüzeysel ve uydurma; ya kaldır ya da sistemin
   kendi verisi üzerinde düşünüp fikir ürettiği profesyonel bir yere
   dönüştür.» Dönüştürüldü (gerekçe core/inceleme.js başında): dört ajanın
   sırayla konuştuğu tur kalktı; ekran kural motorunun kendi verisinden
   kurduğu incelemeyi gösterir — haftanın sayıları, gündem, kayıttan
   karşılaştırmalar (fikir), belirgin bulgular, planların uyumu ve tek karar.
   Model bağlıysa Patron yalnız bu incelemeyi özetler; sayıyı o üretmez.
   Eski toplantı tutanakları silinmez, en altta okunur. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.meeting = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  let ozetleniyor = false;

  const etiketi = e => raw(' <span class="inc-etiket" data-kesinlik="' + e + '">' + e + '</span>');

  function haftaKutusu(r){
    return K.Kutu({ ad:'Son yedi gün', yuva:'kayıttan',
      govde:html`<div class="inc-sayilar">${map(r.hafta, s => html`<div class="inc-sayi">
        <span class="inc-sayi__ad">${s.ad}</span>
        <span class="inc-sayi__deger num">${s.deger == null ? '—' : SP.Inceleme.sayi(s.deger)}<small>${s.deger == null ? '' : s.birim}</small></span>
        <span class="inc-sayi__not">${s.deger == null ? 'veri yok' : s.etiket + (s.n ? ' · ' + s.n + ' gün' : '')}</span>
      </div>`)}</div>` });
  }

  function gundemKutusu(r){
    const rows = r.gundem;
    const enCok = Math.max.apply(null, rows.map(a => a.score).concat([1]));
    return K.Kutu({ ad:'Gündem', yuva:'kural motorunun sırası',
      govde:html`<ol class="inc-gundem">${map(rows, a => html`<li>
        <span class="inc-gundem__cubuk" style="${'--oran:' + Math.round(100 * a.score / enCok) + '%'}" aria-hidden="true"></span>
        <div class="grow"><b>${a.label}</b><span>${a.detail}</span><small>${a.note}</small></div>
        ${P.avatar(a.owner, 'sm')}
      </li>`)}</ol>` });
  }

  function fikirKutusu(r){
    const acik = r.fikirler.filter(f => f.acik), kapali = r.fikirler.filter(f => !f.acik);
    const satir = f => {
      const enBuyuk = Math.max(Math.abs(f.a.ort), Math.abs(f.b.ort)) || 1;
      const bar = (g, cls_) => html`<div class="inc-fikir__bar"><span>${g.ad}</span>
        <i class="${cls_}" style="${'width:' + Math.round(100 * Math.abs(g.ort) / enBuyuk) + '%'}"></i>
        <b class="num">${SP.Inceleme.sayi(g.ort, f.birim)} ${f.birim}</b><small>${g.n} gün</small></div>`;
      return html`<div class="inc-fikir">
        <b class="inc-fikir__baslik">${f.baslik}${etiketi(f.etiket)}</b>
        ${bar(f.a, 'is-a')}${bar(f.b, 'is-b')}
        <p class="tiny muted">${f.not}</p></div>`;
    };
    return K.Kutu({ ad:'Verinden çıkan fikirler', yuva:acik.length ? acik.length + ' karşılaştırma' : 'veri birikiyor',
      govde:html`${acik.length ? html`<div class="inc-fikirler">${map(acik, satir)}</div>`
          : html`<p class="small muted">Henüz karşılaştırma yapacak kadar kayıt yok. Az veriden fikir üretilmez.</p>`}
        ${when(kapali.length, () => html`<details class="inc-bekleyen mt-12"><summary class="small">Veri birikince açılacak ${kapali.length} karşılaştırma</summary>
          <ul class="tiny muted">${map(kapali, f => html`<li><b>${f.baslik}</b>: ${f.neden}</li>`)}</ul></details>`)}` });
  }

  function bulguKutusu(r){
    const b = r.bulgular;
    return K.Kutu({ ad:'Belirgin bağlar', yuva:b.belirgin.length ? b.belirgin.length + ' bulgu' : 'yok',
      govde:html`${b.belirgin.length ? html`<ul class="inc-bulgular">${map(b.belirgin, f => html`<li class="${'is-' + f.tone}">
          <b>${f.link.title}</b><span>${f.text}</span></li>`)}</ul>`
        : html`<p class="small muted">Gün sayısına göre rastlantıdan ayrılan bir bağ yok.</p>`}
        <p class="tiny muted mt-8">${b.zayif.length} bağ zayıf, ${b.bekleyen.length} bağ için ortak gün yetersiz. Eşik gün sayısına göre büyür (Analiz › Çapraz).</p>` });
  }

  function planKutusu(r){
    if(!r.planlar.length) return '';
    return K.Kutu({ ad:'Planların uyumu', yuva:'son 7 gün',
      govde:html`<ul class="inc-planlar">${map(r.planlar, p => html`<li><b>${p.ad}</b><span>${p.uyum.metin}${etiketi(p.uyum.etiket)}</span></li>`)}</ul>` });
  }

  function kararKutusu(r){
    const k = r.karar;
    const ozet = S.ui.incelemeOzet && S.ui.incelemeOzet.tarih === r.tarih ? S.ui.incelemeOzet : null;
    return K.Kutu({ ad:'Tek karar', yuva:'kural motoru', class:'inc-karar',
      govde:html`${k.calm ? html`<p><b>Öne çıkan iş yok.</b> ${k.why}</p>`
          : html`<p><b>${k.title}</b></p><p class="small">${k.why}</p>${when(k.action, () => html`<p class="small"><b>Ne yapılır:</b> ${k.action}</p>`)}`}
        ${when(ozet, () => html`<div class="inc-ozet mt-12"><span class="tiny muted">Patron'un özeti · ${P.sourceBadge(ozet.source)}</span><p>${ozet.text}</p></div>`)}`,
      ayak:html`${when(!k.calm && k.route, () => K.Button({ label:'Oraya git', size:'sm', tone:'primary', act:'go', data:{ 'data-route':k.route } }))}
        ${when(!k.calm, () => K.Button({ label:'Kararı takibe al', size:'sm', act:'inceleme-takip' }))}
        ${when(SP.Office.ready && SP.Office.ready('patron'), () => K.Button({ label:ozetleniyor ? 'Özetleniyor…' : 'Patron özetlesin', size:'sm', tone:'ghost',
          act:'inceleme-ozet', disabled:ozetleniyor }))}` });
  }

  /* ---- tutanagi DINLE -------------------------------------------

     Toplanti zaten sirayla konusan bes karakter. Sessiz bir tiyatro
     gibi okunuyordu; dinlenebilir olmasi icin yeni bir sey icat
     etmeye gerek yok, var olan turlari sesle oynatmak yeter.

     Her ajan kendi sesiyle konusur (core/speak.js → KIMLIK): kimin
     konustugu duyulmadan anlasilir. */
  let calan = null;      /* { id, i } — hangi tutanak, kacinci tur */

  function oynatmaDurumu(recId){
    return calan && calan.id === recId ? calan : null;
  }

  async function tutanakOynat(rec){
    const parcalar = rec.turns
      .map(t => ({ agent:t.agent, text:t.text, name:t.name }))
      .concat([{ agent:'patron', name:'Patron', text:rec.closing }]);

    calan = { id:rec.id, i:0 };
    SP.App.render();
    try{
      await SP.Speak.sequence(parcalar, {
        arasiMs:320,   /* turlar arasi nefes: iki ajan birbirine girmesin */
        onPart(p, i){
          if(!calan || calan.id !== rec.id) return;
          calan.i = i;
          SP.App.render();
        },
      });
    }finally{
      calan = null;
      SP.App.render();
    }
  }

  /* Eski tutanağın bir turu (yalnız okunur). */
  function turnBlock(t, closing, calanMi){
    const a = SP.AGENT_BY_ID[t.agent];
    return html`
      <div class="${cls('meetturn', closing && 'meetturn--closing', calanMi && 'is-calan')}">
        <div class="meetturn__who">
          ${P.avatar(t.agent, 'sm')}
          <b>${t.name}</b>
          <span class="dim">${a ? a.title : ''}</span>
          ${P.sourceBadge(t.source)}
        </div>
        <div class="meetturn__body">${t.text}</div>
      </div>`;
  }

  function minutesCard(rec){
    const oyn = oynatmaDurumu(rec.id);
    return K.Card({
      title:'Tutanak', sub:rec.agenda.label + ' · ' + U.fmtDate(rec.date),
      badge:P.sourceBadge(rec.source),
      body:html`
        <p class="small dim">${rec.agenda.detail}</p>
        <div class="meet mt-12">
          ${map(rec.turns, (t, i) => turnBlock(t, false, oyn && oyn.i === i))}
          ${turnBlock({ agent:'patron', name:'Patron', text:rec.closing, source:rec.source },
            true, oyn && oyn.i === rec.turns.length)}
        </div>
        ${when(rec.decision && !rec.decision.calm, () => K.Notice({ tone:'info', class:'mt-12',
          title:'Kural motorunun kararı:',
          body:rec.decision.title + ' — ' + rec.decision.why }))}`,
      foot:html`
        ${when(SP.Speak.supported() && !oyn, () => K.Button({ label:'Tutanağı dinle',
          size:'sm', icon:'mic', act:'play-minutes', data:{ 'data-id':rec.id } }))}
        ${when(oyn, () => html`${K.Button({ label:'Durdur', size:'sm', act:'stop-minutes' })}
          <span class="tiny dim">${oyn.i + 1} / ${rec.turns.length + 1} tur</span>`)}
        ${K.Button({ label:'Kararı takibe al', size:'sm', tone:'primary',
          act:'track-decision', data:{ 'data-id':rec.id } })}`,
    });
  }

  function historyCard(){
    const rows = S.officeMeetings;
    if(!rows.length){
      return '';
    }
    return K.Card({
      title:'Eski toplantı tutanakları', sub:rows.length + ' tutanak',
      body:html`<div class="list">${map(rows.slice(0, 12), m => html`
        <div class="listitem">
          <div class="grow"><b class="small">${m.agenda.label}</b>
            <div class="tiny dim">${U.fmtDate(m.date)} · ${m.turns.length + 1} tur</div></div>
          ${K.Button({ label:S.ui.meetingOpen === m.id ? 'Kapat' : 'Aç', size:'sm',
            act:'open-minutes', data:{ 'data-id':m.id } })}
        </div>`)}</div>`,
    });
  }

  async function render(){
    const r = SP.Memo ? SP.Memo.of('inceleme.rapor', () => SP.Inceleme.rapor()) : SP.Inceleme.rapor();
    const open = S.officeMeetings.find(m => m.id === S.ui.meetingOpen);
    return String(html`
      <div class="inc">
        ${haftaKutusu(r)}
        <div class="inc-iki">${kararKutusu(r)}${gundemKutusu(r)}</div>
        ${fikirKutusu(r)}
        <div class="inc-iki">${bulguKutusu(r)}${planKutusu(r)}</div>
        ${when(S.officeMeetings.length, () => html`${open ? minutesCard(open) : ''}${historyCard()}`)}
      </div>
      <div class="mt-24">${raw(UI.rail(['office', 'grounding', 'decision', 'no-model']))}</div>`);
  }

  const handle = {
    async 'inceleme-takip'(){
      const k = SP.Calc.nextAction();
      if(k.calm) return;
      await SP.Model.saveDecision({ title:k.title, why:k.why });
      UI.toast('Karar takibe alındı');
      SP.App.render();
    },
    /* Model yalnız ÖZETLER: brifing incelemenin kendisidir, sayı oradan. */
    async 'inceleme-ozet'(){
      if(ozetleniyor) return;
      ozetleniyor = true;
      SP.App.render();
      try{
        const r = SP.Inceleme.rapor();
        const b = Object.assign(SP.Office.patronBrief(), { inceleme:{
          hafta:r.hafta.map(s => ({ ad:s.ad, deger:s.deger, etiket:s.etiket })),
          fikirler:r.fikirler.filter(f => f.acik).map(f => f.baslik + ': ' + f.metin),
          bulgular:r.bulgular.belirgin.map(f => f.link.title + ': ' + f.text),
          karar:r.karar.calm ? null : r.karar.title + ' — ' + r.karar.why } });
        const res = await SP.Office.ask('patron', 'Bu incelemeyi kullanıcıya üç dört cümlede özetle: önce haftanın durumu, '
          + 'sonra en anlamlı karşılaştırma, en sonda tek karar. Sayıları yalnız brifingden al; birlikteliği neden gibi sunma.',
          { brief:b, history:false, maxTokens:500 });
        S.ui.incelemeOzet = { tarih:r.tarih, text:res.text, source:res.source };
      }finally{
        ozetleniyor = false;
        SP.App.render();
      }
    },
    async 'play-minutes'(el){
      const rec = S.officeMeetings.find(m => m.id === el.dataset.id);
      if(rec) await tutanakOynat(rec);
    },
    async 'stop-minutes'(){ SP.Speak.stop(); calan = null; SP.App.render(); },

    async 'open-minutes'(el){
      S.ui.meetingOpen = S.ui.meetingOpen === el.dataset.id ? null : el.dataset.id;
      SP.App.render();
    },
    async 'track-decision'(el){
      const rec = S.officeMeetings.find(m => m.id === el.dataset.id);
      if(!rec) return;
      const d = rec.decision;
      await SP.Model.saveDecision({
        title:d && !d.calm ? d.title : rec.agenda.label,
        why:d && !d.calm ? d.why : rec.agenda.detail,
      });
      UI.toast('Karar takibe alındı');
      SP.App.render();
    },
  };

  return {
    id:'meeting',
    /* Sade (2026-10-16): öncelik tablosu sabit bir kuraldır, her açılışta
       açık durmaz; başlığına dokununca açılır. Gündem ve modelin rolü
       ekranın ⓘ kartında (office, no-model ipuçları). */
    title:'İnceleme',
    subtitle(){
      const rows = SP.Office.agendaCandidates();
      return rows.length ? 'Gündem: ' + rows[0].label : 'Gündem yok';
    },
    actions(){ return ''; },
    render, handle,
  };
})();
