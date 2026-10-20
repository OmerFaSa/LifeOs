/* Ofis › İnceleme (eski «Toplantı», 2026-10-20).

   SPİ'deki kararın aynısı (gerekçe SPI/src/js/core/inceleme.js başında):
   altı uzmanın sırayla konuştuğu tur kalktı; ekran kural motorunun kendi
   verisinden kurduğu incelemeyi gösterir — son yedi günün sayıları, gündem,
   kayıttan karşılaştırmalar (fikir), disiplinler arası bulgular ve tek
   karar (Planner.nextAction). Model bağlıysa Patron yalnız bu incelemeyi
   özetler; sayıyı o üretmez. Takipteki kararlar ve eski toplantı
   tutanakları silinmez, altta durur. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.meeting = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  let ozetleniyor = false;

  const etiketi = e => raw(' <span class="inc-etiket" data-kesinlik="' + e + '">' + e + '</span>');
  const sayiYaz = (v, birim) => birim === '%' ? '%' + ESP.Inceleme.sayi(v) : ESP.Inceleme.sayi(v);

  function haftaKutusu(r){
    return K.Kutu({ ad:'Son yedi gün', yuva:'kayıttan',
      govde:html`<div class="inc-sayilar">${map(r.hafta, s => html`<div class="inc-sayi">
        <span class="inc-sayi__ad">${s.ad}</span>
        <span class="inc-sayi__deger num">${s.deger == null ? '—' : sayiYaz(s.deger, s.birim)}<small>${s.deger == null || s.birim === '%' ? '' : s.birim}</small></span>
        <span class="inc-sayi__not">${s.deger == null ? 'veri yok' : s.etiket + (s.n ? ' · ' + s.n + ' ' + (s.nBirim || 'gün') : '')}</span>
      </div>`)}</div>` });
  }

  function gundemKutusu(r){
    const rows = r.gundem;
    if(!rows.length) return K.Kutu({ ad:'Gündem', yuva:'kural motorunun sırası', govde:html`<p class="small muted">Gündeme gelen bir konu yok.</p>` });
    const enCok = Math.max.apply(null, rows.map(a => a.score).concat([1]));
    return K.Kutu({ ad:'Gündem', yuva:'kural motorunun sırası',
      govde:html`<ol class="inc-gundem">${map(rows, a => html`<li>
        <span class="inc-gundem__cubuk" style="${'--oran:' + Math.round(100 * a.score / enCok) + '%'}" aria-hidden="true"></span>
        <div class="grow"><b>${a.label}</b><span>${a.detail}</span><small>${a.lead}</small></div>
      </li>`)}</ol>` });
  }

  function fikirKutusu(r){
    const acik = r.fikirler.filter(f => f.acik), kapali = r.fikirler.filter(f => !f.acik);
    const satir = f => {
      const enBuyuk = Math.max(Math.abs(f.a.ort), Math.abs(f.b.ort)) || 1;
      const bar = (g, cls_) => html`<div class="inc-fikir__bar"><span>${g.ad}</span>
        <i class="${cls_}" style="${'width:' + Math.round(100 * Math.abs(g.ort) / enBuyuk) + '%'}"></i>
        <b class="num">${f.birim === '%' ? sayiYaz(g.ort, '%') : sayiYaz(g.ort) + ' ' + f.birim}</b><small>${g.n} gün</small></div>`;
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
    return K.Kutu({ ad:'Alanlar arası bağlar', yuva:b.length ? b.length + ' bulgu' : 'yok',
      govde:b.length ? html`<ul class="inc-bulgular">${map(b, f => html`<li>
          <b>${f.kimden} → ${f.kime}</b><span>${f.text}</span></li>`)}</ul>`
        : html`<p class="small muted">Alanlar arasında öne çıkan bir boşluk yok.</p>` });
  }

  function kararKutusu(r){
    const k = r.karar;
    const sakin = k.id === 'none';
    const ozet = S.ui.incelemeOzet && S.ui.incelemeOzet.tarih === r.tarih ? S.ui.incelemeOzet : null;
    return K.Kutu({ ad:'Tek karar', yuva:'kural motoru', class:'inc-karar',
      govde:html`<p><b>${k.title}</b></p><p class="small">${k.detail}</p><p class="small muted">${k.why}</p>
        ${when(ozet, () => html`<div class="inc-ozet mt-12"><span class="tiny muted">Patron’un özeti · ${ozet.source === 'model' ? 'model' : 'kural motoru'}</span><p>${ozet.text}</p></div>`)}`,
      ayak:html`${when(!sakin && k.route, () => K.Button({ label:'Oraya git', size:'sm', tone:'primary', act:'go', data:{ 'data-route':k.route } }))}
        ${when(!sakin, () => K.Button({ label:'Kararı takibe al', size:'sm', act:'inceleme-takip' }))}
        ${when(ESP.Office.ready && ESP.Office.ready('patron'), () => K.Button({ label:ozetleniyor ? 'Özetleniyor…' : 'Patron özetlesin', size:'sm', tone:'ghost',
          act:'inceleme-ozet', disabled:ozetleniyor }))}` });
  }

  function kararlarKutusu(){
    const acik = M.openDecisions();
    if(!acik.length) return '';
    return K.Kutu({ ad:'Takipteki kararlar', yuva:acik.length + ' açık',
      govde:html`<p class="small muted">Kapatırken ne değiştiğini yaz: kararın ne yaptığını görmek sistemi ilerletir.</p>
        ${map(acik, d => html`<div class="decision">
          <p>${d.text}</p>
          <div class="row wrap mt-8">
            <span class="tiny dim">${U.fmtShort(d.openedAt.slice(0, 10))} tarihinde açıldı</span>
            ${K.Input({ id:'dec-' + d.id, placeholder:'Ne değişti? (ölçümle)', size:'sm' })}
            ${K.Button({ label:'Kapat', size:'sm', act:'close-decision', data:{ 'data-id':d.id } })}
          </div>
        </div>`)}` });
  }

  /* Eski toplantı tutanakları (yalnız okunur). */
  function turnRow(t){
    const a = ESP.AGENT_BY_ID[t.agentId];
    return html`
      <div class="meetturn">
        <div class="meetturn__head">
          <span class="agentav" style="background:${a ? a.color : 'var(--agent-patron)'}"
            aria-hidden="true">${a ? ESP.UI.pp(a.id) : ''}${a ? a.initial : '?'}</span>
          <b>${t.name}</b>
          ${K.Badge({ label:t.source === 'model' ? 'model' : 'kural motoru',
            tone:t.source === 'model' ? 'info' : 'muted', icon:false })}
        </div>
        <p>${t.text}</p>
      </div>`;
  }

  function tutanakKutusu(){
    const liste = S.officeMeetings || [];
    if(!liste.length) return '';
    return K.Kutu({ ad:'Eski toplantı tutanakları', yuva:liste.length + ' tutanak',
      govde:html`<div class="list">${map(liste.slice(0, 10), m => html`
        <div class="listitem">
          <div class="grow"><b class="small">${m.agendaLabel}</b>
            <div class="tiny dim">${U.fmtDate(ESP.U.gunOf(m.at))} · ${m.turns.length} tur${m.decision ? ' · karar: ' + m.decision.title : ''}</div></div>
          ${K.Button({ label:S.ui.meetingOpen === m.id ? 'Kapat' : 'Aç', size:'sm', act:'toggle-minutes', data:{ 'data-id':m.id } })}
        </div>
        ${when(S.ui.meetingOpen === m.id, () => html`<div class="meet mt-8">
          ${map(m.turns, turnRow)}
          ${when(m.closing, () => html`<div class="meetturn meetturn--close">
            <div class="meetturn__head"><b>Patron</b></div><p>${m.closing.text}</p></div>`)}
        </div>`)}`)}</div>` });
  }

  function render(){
    const r = ESP.Memo ? ESP.Memo.of('inceleme.rapor', () => ESP.Inceleme.rapor()) : ESP.Inceleme.rapor();
    return String(html`
      <div class="inc">
        ${haftaKutusu(r)}
        <div class="inc-iki">${kararKutusu(r)}${gundemKutusu(r)}</div>
        ${fikirKutusu(r)}
        ${bulguKutusu(r)}
        ${kararlarKutusu()}
        ${tutanakKutusu()}
      </div>`);
  }

  const handle = {
    async 'inceleme-takip'(){
      const k = ESP.Planner.nextAction();
      if(k.id === 'none') return;
      await M.saveDecision({ text:k.title, agentId:'patron', source:'inceleme' });
      ESP.Memo.bitir();
      ESP.UI.toast('Karar takibe alındı');
      ESP.App.render();
    },
    /* Model yalnız ÖZETLER: brifing incelemenin kendisidir, sayı oradan. */
    async 'inceleme-ozet'(){
      if(ozetleniyor) return;
      ozetleniyor = true;
      ESP.App.render();
      try{
        const r = ESP.Inceleme.rapor();
        const b = Object.assign({}, ESP.Office.patronBrief(), { inceleme:{
          hafta:r.hafta.map(s => ({ ad:s.ad, deger:s.deger, birim:s.birim, etiket:s.etiket })),
          fikirler:r.fikirler.filter(f => f.acik).map(f => f.baslik + ': ' + f.metin),
          bulgular:r.bulgular.map(f => f.text),
          karar:r.karar.id === 'none' ? null : r.karar.title + ' — ' + r.karar.why } });
        const res = await ESP.Office.ask('patron', 'Bu incelemeyi kullanıcıya üç dört cümlede özetle: önce haftanın durumu, '
          + 'sonra en anlamlı karşılaştırma, en sonda tek karar. Sayıları yalnız brifingden al; birlikteliği neden gibi sunma.',
          { brief:b, history:false, maxTokens:500 });
        S.ui.incelemeOzet = { tarih:r.tarih, text:res.text, source:res.source };
      }finally{
        ozetleniyor = false;
        ESP.App.render();
      }
    },
    async 'toggle-minutes'(el){
      S.ui.meetingOpen = S.ui.meetingOpen === el.dataset.id ? null : el.dataset.id;
      ESP.App.render();
    },
    async 'close-decision'(el){
      const inp = document.getElementById('dec-' + el.dataset.id);
      const sonuc = inp ? inp.value.trim() : '';
      if(!sonuc){
        ESP.UI.toast('Sonuç yazılmadan karar kapanmaz');
        return;
      }
      await M.closeDecision(el.dataset.id, sonuc);
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {};

  return {
    id:'meeting',
    title:'İnceleme',
    headline(){
      const k = ESP.Planner.nextAction();
      return k.id === 'none' ? 'Bekleyen bir iş yok.' : 'Karar: ' + k.title.toLocaleLowerCase('tr-TR') + '.';
    },
    lede(){
      return 'Son yedi günün sayıları, kayıttan karşılaştırmalar ve tek karar. '
           + 'Her sayı kayıttan gelir; az veriden fikir açılmaz.';
    },
    stats(){
      const r = ESP.Inceleme.rapor();
      return [
        { value:String(r.fikirler.filter(f => f.acik).length), label:'karşılaştırma' },
        { value:String(M.openDecisions().length), label:'açık karar' },
        { value:String(r.gundem.length), label:'gündem' },
      ];
    },
    subtitle(){
      const a = ESP.Office.agendaCandidates()[0];
      return a ? 'Gündem: ' + a.label : 'Gündem yok';
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
