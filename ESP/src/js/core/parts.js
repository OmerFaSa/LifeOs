/* ESP'ye ozel, veriye bagli parcalar.

   Ayrim korunur: `C.*` (core/components.js) uygulamadan BAGIMSIZDIR ve
   icine entelektuel alan sizmaz; `P.*` ise alana baglidir ve icine genel
   bilesen girmez. Ikisi karisirsa bilesen sozlugu kardes projelere
   tasinamaz hale gelir.

   Burada dort sey var: kesinlik rozeti, ajan avatari, disiplin seridi ve
   radar grafigi. Radar `core/ui.js` icinde degil burada cunku eksenleri
   ESP'nin alti disiplinidir — jenerik bir grafik degil, alana bagli bir
   sekildir. */

window.ESP = window.ESP || {};

ESP.Parts = (function(){
  const U = ESP.U;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  /* Kesinlik rozeti — bir sayinin nereden geldigi.

     Her sayinin yaninda durur ve DEGISTIRILEMEZ: bu, sistemin en onemli
     kuralinin gorunen yuzudur. */
  function cert(kind, opts){
    const c = ESP.CERTAINTY[kind] || ESP.CERTAINTY.missing;
    const o = opts || {};
    return html`<span class="${cls('cert', 'cert--' + kind)}"
      ${o.title === false ? '' : ESP.h.attrs({ title:c.note })}>${c.label}</span>`;
  }

  /* Bir olcumu kesinligiyle birlikte yazar. `value` null ise sayi HIC
     yazilmaz — "0" gostermek yerine etiket gosterilir. */
  function measure(value, unit, kind){
    if(value == null || kind === 'missing'){
      return html`<span class="measure measure--none">${cert('missing')}</span>`;
    }
    return html`<span class="measure"><b class="num">${U.fmtNum(value)}</b>${when(unit,
      () => html`<small>${unit}</small>`)}${cert(kind || 'measured')}</span>`;
  }

  function avatar(agentId, size){
    const a = ESP.AGENT_BY_ID[agentId];
    if(!a) return raw('');
    return html`<span class="${cls('agentav', size === 'sm' && 'agentav--sm')}"
      style="background:${a.color}" title="${a.name}" aria-hidden="true">${a.initial}</span>`;
  }

  function discChip(discId, opts){
    const d = ESP.DISCIPLINE_BY_ID[discId];
    if(!d) return raw('');
    const o = opts || {};
    return K.Chip({ label:o.long ? d.label : d.short, act:o.act,
      data:o.act ? { 'data-disc':d.id } : null, on:o.on });
  }

  /* ---------------------------------------------------------------- radar

     Alti eksen, alti disiplin. Radar burada bir SUS DEGIL: altı sayıyı yan
     yana okumanin en hizli yolu, aralarindaki DENGEYI gostermektir — ve
     sistemin bulgusu tam olarak dengedir ("bir disipline yigilmis, biri hic
     acilmamis").

     Iki kural:

       1. Olculmemis eksen SIFIRA CEKILMEZ. Sifir "hic calisilmadi" gibi
          gorunurdu; oysa "veri yok" ayri bir durumdur. Olculmemis eksen
          kesikli cizilir ve merkeze degil EKSENIN DIBINDEKI kucuk bir
          isarete duser.
       2. Olcek daima yazilir. Radar bir oran gosterir; oranin neye gore
          oldugu gorunmezse sekil yaniltir.

     `rows`: [{ label, value(0..1)|null, cert }] */
  function radar(rows, opts){
    const o = opts || {};
    const n = (rows || []).length;
    if(n < 3) return K.Empty({ text:'Radar için en az üç eksen gerekir.' });

    const R = 76, cx = 100, cy = 92;
    const nokta = (i, r) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };

    const halkalar = [0.25, 0.5, 0.75, 1].map(f => {
      const p = rows.map((_, i) => nokta(i, R * f).map(v => Math.round(v * 10) / 10).join(','));
      return '<polygon class="radar__ring" points="' + p.join(' ') + '"/>';
    }).join('');

    const eksenler = rows.map((r, i) => {
      const [x, y] = nokta(i, R);
      return '<line class="radar__axis" x1="' + cx + '" y1="' + cy + '" x2="'
        + Math.round(x * 10) / 10 + '" y2="' + Math.round(y * 10) / 10 + '"/>';
    }).join('');

    /* Olculmus eksenlerden coken poligon. Olculmemis eksen poligona
       KATILMAZ: katilsaydi sifir gibi girer ve sekli iceri ceker. */
    const olculen = rows.map((r, i) => ({ r, i })).filter(x => x.r.cert !== 'missing'
      && x.r.value != null);
    const poly = olculen.length >= 3
      ? '<polygon class="radar__shape" points="'
        + olculen.map(x => nokta(x.i, R * Math.max(0.04, Math.min(1, x.r.value)))
            .map(v => Math.round(v * 10) / 10).join(',')).join(' ') + '"/>'
      : '';

    const isaretler = rows.map((r, i) => {
      const olcum = r.cert !== 'missing' && r.value != null;
      const [x, y] = nokta(i, olcum ? R * Math.max(0.04, Math.min(1, r.value)) : 6);
      return '<circle class="' + (olcum ? 'radar__dot' : 'radar__dot radar__dot--none')
        + '" cx="' + Math.round(x * 10) / 10 + '" cy="' + Math.round(y * 10) / 10
        + '" r="' + (olcum ? 3 : 2.4) + '"><title>' + U.esc(r.label) + ': '
        + (olcum ? Math.round(r.value * 100) + '%' : 'veri yok') + '</title></circle>';
    }).join('');

    const etiketler = rows.map((r, i) => {
      const [x, y] = nokta(i, R + 14);
      const anchor = Math.abs(x - cx) < 6 ? 'middle' : (x > cx ? 'start' : 'end');
      return '<text class="radar__label" x="' + Math.round(x) + '" y="'
        + Math.round(y + 3) + '" text-anchor="' + anchor + '">' + U.esc(r.label) + '</text>';
    }).join('');

    return html`
      <figure class="radar">
        ${raw('<svg viewBox="0 0 200 184" role="img" aria-label="'
          + U.esc(o.aria || 'Disiplin dengesi radarı') + '">'
          + halkalar + eksenler + poly + isaretler + etiketler + '</svg>')}
        <figcaption class="radar__cap">
          ${o.scale || 'Dış halka = penceredeki en yüksek değer.'}
          ${when(rows.some(r => r.cert === 'missing'), () => html`
            <span class="radar__none">Kesikli nokta: ölçülmemiş eksen — sıfır değil.</span>`)}
        </figcaption>
      </figure>`;
  }

  /* Bos durum — bolumun kendi imzasiyla. */
  function empty(text, action){
    return K.Empty({ text, action });
  }

  /* ------------------------------------------------------------ koç kutusu

     Her disiplin ekraninda ayni yerde, ayni bicimde durur. Tek bir yerde
     tanimli olmasi kasitli: recete bicimi ekrandan ekrana degisirse
     kullanici her bolumde yeniden okumayi ogrenir.

     Kutu bir TAVSIYE kutusu degildir — icinde yapilacak isler ve onlari
     isleyen dugmeler vardir. Okunup gecilen bir kutu yazmanin anlami yok. */
  function coach(discId){
    const r = ESP.Coach.prescribe(discId);
    if(!r) return raw('');
    const lv = r.level;
    const yapilan = r.done || [];

    return K.Entry({
      label:'KOÇ', hint:'coach',
      meta:r.cert === 'missing' ? 'kademe yok' : lv.label,
      note:r.why,
      action:K.Button({ label:'Merdiven', size:'sm', act:'go',
        data:{ 'data-route':'ladder' } }),
      wide:true,
      body:html`
        <div class="coachhead">
          ${K.Badge({ label:lv.label + ' · ' + lv.short,
            tone:r.cert === 'missing' ? 'muted' : 'info', icon:false })}
          ${cert(r.cert)}
          <span class="tiny dim">${r.minutes} dk / ${r.budget} dk taban</span>
        </div>
        ${r.items.length
          ? html`<ul class="rx">${map(r.items, it => {
              const bitti = yapilan.indexOf(it.drill.id) >= 0;
              return html`<li class="${cls('rx__row', 'rx__row--' + it.kind,
                  bitti && 'is-done')}">
                <span class="rx__kind">${it.label}</span>
                <span class="rx__body">
                  <b>${it.drill.label}</b>
                  <span class="rx__task">${it.drill.task}</span>
                </span>
                <span class="rx__min num">${it.drill.minutes} dk</span>
                ${bitti
                  ? K.Badge({ label:'işlendi', tone:'ok' })
                  : K.Button({ label:'İşle', size:'sm', act:'log-drill',
                      data:{ 'data-id':it.drill.id } })}
              </li>`;
            })}</ul>`
          : K.Empty({ text:'Bu kademede tanımlı egzersiz yok.' })}`,
    });
  }

  return { cert, measure, avatar, discChip, radar, empty, coach };
})();
