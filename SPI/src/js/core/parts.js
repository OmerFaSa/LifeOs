/* Ekranlar arasi paylasilan SPI parcalari.

   SP.C genel bilesen sozlugudur (kart, dugme, tablo) ve uygulamadan
   bagimsizdir. Burada duran parcalar ise SPI'ye ozeldir ve VERIYE baglidir:
   bir olcumun referans araligindaki yeri, bir sayinin nereden geldigi,
   bir kirmizi bayragin gorunumu.

   Ikisi karistirilmaz: SP.C'ye saglik alani sizmaz, buraya genel bilesen
   girmez. */

window.SP = window.SP || {};

SP.Parts = (function(){
  const U = SP.U, K = SP.C;
  const { html, raw, when, map, cls } = SP.h;

  /* Olcum kesinligi — her sayinin nereden geldigi yaninda yazar.
     Sistemin en onemli kuralinin gorunen yuzu budur. */
  function cert(key){
    const c = SP.CERTAINTY[key] || SP.CERTAINTY.missing;
    return K.Badge({ label:c.label, tone:c.tone, icon:false });
  }

  /* Bir biyobelirtec satiri: ad, deger, durum, referans cubugu ve gerekce.

     Hic olculmemis satir TEK SATIRA iner. Bos bir olcum icin uc satir yer
     ayirmak paneli sisirir ve olculmus degerleri gormeyi zorlastirir. */
  function markerRow(row, opts){
    const o = opts || {};
    const b = row.marker;
    const has = row.value != null;
    if(!has){
      return html`
        <div class="markerrow markerrow--empty">
          <div class="markerrow__head">
            <span class="markerrow__name">${b.name}</span>
            ${K.Badge({ label:'veri yok', tone:'muted', icon:false })}
          </div>
          <div class="markerrow__val num">—<small>${b.unit}</small></div>
        </div>`;
    }
    return html`
      <div class="${cls('markerrow', !has && 'markerrow--empty')}">
        <div class="markerrow__head">
          <span class="markerrow__name">${b.name}${raw(SP.UI.hint(o.hint || ''))}</span>
          ${K.Badge({ label:row.status.label, tone:row.status.tone })}
          ${when(row.cert && row.cert !== 'missing', () => cert(row.cert))}
          ${when(o.trend && o.trend.ok, () => html`<span class="tiny dim">
            ${raw(SP.UI.trend(o.trend.dir))} ${o.verdict ? o.verdict.label : ''}</span>`)}
        </div>
        <div class="markerrow__val num">${has ? U.fmtNum(row.value) : '—'}<small>${b.unit}</small></div>
        ${when(has && row.ref, () => html`<div class="markerrow__bar">
          ${raw(SP.UI.rangeBar(row.value, row.ref, row.optimal, b.unit))}</div>`)}
        <p class="markerrow__note">${o.note != null ? o.note : SP.Bio.statusNote(b.id, row.value)}
          ${when(row.at, () => html` <span class="dim">· ${U.fmtShort(row.at)}</span>`)}</p>
      </div>`;
  }

  /* Kirmizi bayrak karti. Bayrak yorumlanmaz, iletilir. */
  function flagCard(f){
    return html`
      <div class="flagcard" role="alert">
        <div class="flagcard__head">
          ${raw(SP.UI.icon('warn'))}
          <span class="flagcard__title">${f.label}</span>
          ${when(f.ack, () => K.Badge({ label:'görüldü', tone:'muted' }))}
        </div>
        <p class="flagcard__body">${f.detail}</p>
        <p class="flagcard__body dim mt-2">${SP.RED_FLAGS.lead}</p>
        <div class="flagcard__foot">
          ${when(!f.ack, () => K.Button({ label:'Gördüm, hekime başvuracağım', size:'sm',
            tone:'danger', act:'flag-ack', data:{ 'data-id':f.id } }))}
          ${K.Button({ label:'Ölçümü aç', size:'sm', act:'go', data:{ 'data-route':'labs' } })}
        </div>
      </div>`;
  }

  /* Ajan avatari — kimlik rengi, durum degil. */
  function avatar(agentId, size){
    const a = SP.AGENT_BY_ID[agentId];
    if(!a) return raw('');
    return html`<span class="${cls('agentav', 'agentav--' + a.id, size === 'sm' && 'agentav--sm')}"
      aria-hidden="true">${a.initial}</span>`;
  }

  /* Ajan konusma balonu kaynagi: model mi kural motoru mu? */
  function sourceBadge(source){
    return source === 'model'
      ? K.Badge({ label:'model', tone:'info' })
      : K.Badge({ label:'kural motoru', tone:'muted', icon:false });
  }

  /* Besin ogesi hucresi — hedefe gore doluluk.

     Serit NOTR renktedir. Gunun ortasinda hedefin yarisinda olmak bir hata
     degildir; her eksigi kirmiziya boyamak arayuzu bos yere alarma cevirir
     ve gercek uyarilari gormeyi zorlastirir. Yalnizca SINIR tipindeki bir
     ogenin (sodyum) asilmasi kirmizi ile isaretlenir. */
  function nutCell(o){
    const pct = o.target ? U.pct(o.got, o.target) : null;
    const over = o.limit && pct != null && pct > 100;
    return html`
      <div class="nutcell">
        <div class="nutcell__label">${o.label}</div>
        <div class="nutcell__val num">${U.fmtNum(U.round(o.got, o.digits == null ? 0 : o.digits))}<small> / ${U.fmtNum(o.target)} ${o.unit || ''}</small></div>
        ${K.Bar({ value:pct == null ? 0 : Math.min(100, pct), tone:over ? 'danger' : '' })}
        <div class="nutcell__pct">
          <span class="${over ? 'nutcell__over' : ''}">%${pct == null ? '—' : pct}</span>
          ${when(o.note, () => html`<span class="dim">${o.note}</span>`)}
        </div>
      </div>`;
  }

  /* Asgari gun satiri. */
  function minRow(r){
    return html`
      <div class="${cls('minrow', r.ok && 'is-done')}">
        <span class="minrow__mark">${r.ok ? '✓' : ''}</span>
        <span class="minrow__label">${r.label}</span>
        <span class="minrow__detail num">${r.detail}</span>
      </div>`;
  }

  /* Klinik sinir — hekim olmadigi her ekranda bir kez soylenir. */
  function clinicalNote(){
    return K.Notice({ tone:'info', title:'Sınır:', body:SP.CLINICAL.disclaimer });
  }

  /* Emilim notu — ogunun icindeki artiran/bozan etki. */
  function absorbNote(n){
    return html`<div class="${cls('absorb', 'absorb--' + n.kind)}">
      <span class="absorb__mark">${n.kind === 'boost' ? '↑' : '↓'}</span>
      <span>${n.text}</span>
    </div>`;
  }

  /* Bos ekran yerine tek net eylem. */
  function empty(text, label, act, data){
    return K.Empty({ text, action:K.Button({ label, size:'sm', tone:'primary', act, data }) });
  }

  return { cert, markerRow, flagCard, avatar, sourceBadge, nutCell, minRow,
    clinicalNote, absorbNote, empty };
})();
