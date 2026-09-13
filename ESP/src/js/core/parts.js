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

  /* ------------------------------------------------------------ reçete satırı

     Tek yerde tanımlı olması kasıtlı: reçete biçimi bölümden bölüme
     değişirse kullanıcı her bölümde yeniden okumayı öğrenir.

     Liste bir TAVSİYE kutusu değildir — içinde yapılacak işler ve onları
     işleyen düğmeler vardır. Okunup geçilen bir kutu yazmanın anlamı yok. */
  /* Reçete satırı MİNİMAL: bir egzersiz tek satırdır.

     İlk sürüm her egzersizi üç satırda çiziyordu (bölüm etiketi, ad, tam
     görev metni) ve iki disiplinlik bir reçete ekranın yarısını yiyordu.
     Bugün ekranında bu, asıl işin — oturum girmenin — altına itilmesi
     demekti.

     Görev metni kaybolmadı, KATLANDI: ada dokununca açılır. Varsayılan
     kapalı, çünkü reçeteyi her gün okuyan biri üçüncü günden sonra görev
     metnini değil adı arar. */
  function rxList(r){
    const yapilan = r.done || [];
    if(!r.items.length) return K.Empty({ text:'Bu kademede tanımlı egzersiz yok.' });
    const acik = ESP.S.ui.rxOpen;
    return html`<ul class="rx">${map(r.items, it => {
      const bitti = yapilan.indexOf(it.drill.id) >= 0;
      const on = acik === it.drill.id;
      return html`<li class="${cls('rx__row', 'rx__row--' + it.kind, bitti && 'is-done')}">
        <button class="rx__name" data-act="rx-open" data-id="${it.drill.id}"
          aria-expanded="${on ? 'true' : 'false'}">
          <span class="rx__kind">${it.label}</span>
          <b>${it.drill.label}</b>
        </button>
        <span class="rx__min num">${it.drill.minutes} dk</span>
        ${bitti
          ? K.Badge({ label:'işlendi', tone:'ok' })
          : K.Button({ label:'İşle', size:'sm', act:'log-drill',
              data:{ 'data-id':it.drill.id } })}
        ${when(on, () => html`<span class="rx__task">${it.drill.task}</span>`)}
      </li>`;
    })}</ul>`;
  }

  /* Reçete sekmesi — bir zamanlar AYRI bir kutuydu (KOÇ) ve tezgâhın
     hemen üstünde duruyordu. İkisi aynı cümleyi (sıradaki kapı) iki kez
     yazıyor, ekranı iki katına çıkarıyordu. Reçete de koçun işi: artık
     tezgâhın ilk sekmesi ve varsayılan görünüm. */
  function deskRx(discId){
    const r = ESP.Coach.prescribe(discId);
    if(!r) return raw('');
    return html`
      <div class="coachhead">
        ${K.Badge({ label:r.level.label + ' · ' + r.level.short,
          tone:r.cert === 'missing' ? 'muted' : 'info', icon:false })}
        ${cert(r.cert)}
        <span class="tiny dim">${U.fmtMin(r.minutes)} / ${U.fmtMin(r.budget)} taban</span>
        ${K.Button({ label:'Merdiven', size:'sm', act:'go',
          data:{ 'data-route':'ladder' } })}
      </div>
      ${rxList(r)}`;
  }

  /* --------------------------------------------------------------- tezgâh

     Dört sekme: Koç · Harita · Ekler · Hatırlatma. Yedi bölümde de aynı.
     Ayrıntılar core/desk.js içinde; burada yalnızca çizim var. */

  function deskChat(discId){
    const a = ESP.Desk.agentOf(discId);
    const mesajlar = ESP.Desk.messages(discId, 8);
    const hazir = ESP.Office.ready(a.id);
    const konusuyor = ESP.Desk.talking(discId);
    const sesVar = ESP.Talk && ESP.Talk.supported();
    const okuyabilir = ESP.Speak && ESP.Speak.supported();
    const son = ESP.Desk.lastAnswer(discId);

    return html`
      <div class="deskchat">
        <div class="deskchat__head">
          ${avatar(a)}
          <div>
            <b>${a.name}</b>
            <p class="tiny dim">${a.role}</p>
          </div>
          ${K.Badge({ label:hazir ? 'model bağlı' : 'kural motoru',
            tone:hazir ? 'info' : 'muted', icon:false })}
        </div>

        <div class="chat chat--desk">
          ${mesajlar.length
            ? map(mesajlar, m => html`
                <div class="${cls('msg', m.role === 'user' ? 'msg--me' : 'msg--agent')}">
                  <p>${m.text}</p>
                  ${when(m.role !== 'user', () => html`<div class="msg__foot">
                    ${K.Badge({ label:m.source === 'model' ? 'model' : 'kural motoru',
                      tone:m.source === 'model' ? 'info' : 'muted', icon:false })}
                    ${when(m.blocked, () => K.Badge({ label:'kurallara takıldı', tone:'warn' }))}
                  </div>`)}
                </div>`)
            : html`<p class="small muted">${a.opening}</p>`}
        </div>

        <div class="composer mt-10">
          ${K.Textarea({ id:'desk-ask-' + discId, rows:2, class:'composer__input',
            aria:a.name + ' masasına sor', placeholder:'Sorunu yaz…' })}
          ${K.Mic({ target:'desk-ask-' + discId })}
          ${K.Button({ label:'Gönder', tone:'primary', act:'desk-send',
            data:{ 'data-disc':discId } })}
        </div>

        <div class="row wrap mt-8">
          ${when(sesVar, () => K.Button({
            label:konusuyor ? 'Sesli sohbeti bitir' : 'Sesli sohbet',
            tone:konusuyor ? 'danger' : null, size:'sm',
            act:'desk-talk', data:{ 'data-disc':discId } }))}
          ${when(okuyabilir && son, () => K.Button({
            label:ESP.Speak.isSpeaking() ? 'Sesi durdur' : 'Son cevabı dinle', size:'sm',
            act:'desk-listen', data:{ 'data-disc':discId } }))}
          ${K.Button({ label:'Danışma ekranı', size:'sm', act:'desk-open-team',
            data:{ 'data-disc':discId } })}
          ${when(mesajlar.length, () => K.Button({ label:'Geçmişi temizle', size:'sm',
            act:'desk-clear', data:{ 'data-disc':discId } }))}
        </div>

        ${when(konusuyor, () => K.Notice({ tone:'info',
          body:'Sesli sohbet açık. Ajan konuşurken mikrofon kapalıdır: sözü '
            + 'boşluk tuşuyla ya da düğmeyle kesersin — sesle kesilemez.' }))}
        ${when(!sesVar, () => html`<p class="tiny dim mt-8">Bu tarayıcı sesli
          sohbeti desteklemiyor; yazarak sorduğun soru aynı yoldan geçer.</p>`)}
      </div>`;
  }

  function deskMap(discId){
    const lv = ESP.Curriculum.levelOf(discId);
    const yol = ESP.Curriculum.roadmap(discId);
    const kapi = ESP.Curriculum.nextGate(discId);
    if(!lv || !yol) return K.Empty({ text:'Bu bölümün merdiveni tanımlı değil.' });

    return html`
      <div class="deskmap">
        <div class="deskmap__top">
          ${K.Badge({ label:lv.level.label + ' · ' + lv.level.short,
            tone:lv.cert === 'missing' ? 'muted' : 'info', icon:false })}
          ${cert(lv.cert)}
          <span class="tiny dim">merdivenin %${lv.mastery}'i</span>
        </div>

        <ol class="steps">${map(yol.steps, st => html`
          <li class="${cls('stepdot', 'stepdot--' + st.state)}">
            <span class="stepdot__n num">${(ESP.LEVEL_BY_RANK[st.rank] || {}).short}</span>
            <span class="stepdot__body">
              <b>${st.title}</b>
              <span class="tiny dim">${st.state === 'done' ? 'geçildi'
                : (st.state === 'current' ? '%' + st.pct + ' — ' + st.gates.filter(g =>
                    g.status === 'pass').length + '/' + st.gates.length + ' kapı'
                  : 'ileride')}</span>
            </span>
          </li>`)}</ol>

        ${when(kapi, () => K.NextUp({
          icon:kapi.action === 'measure' ? 'info' : 'zap',
          label:kapi.action === 'measure' ? 'Önce ölç' : 'Sıradaki kapı',
          title:kapi.title, why:kapi.why }))}

        ${K.Button({ label:'Tam haritayı aç', size:'sm', act:'desk-ladder',
          class:'mt-10', data:{ 'data-disc':discId } })}
      </div>`;
  }

  const ASSET_LABELS = { note:'Not', doc:'Belge', link:'Bağlantı', audio:'Ses' };

  function deskAssets(discId){
    const list = ESP.Desk.assets(discId);
    return html`
      <div class="deskassets">
        <div class="cols-3">
          ${K.Field({ label:'Tür',
            input:K.Select({ id:'as-kind-' + discId, value:'note', aria:'Ek türü',
              options:ESP.Model.ASSET_KINDS.map(k => ({ value:k, label:ASSET_LABELS[k] })) }) })}
          ${K.Field({ label:'Başlık',
            input:K.Input({ id:'as-title-' + discId, aria:'Ekin başlığı' }) })}
          ${K.Field({ label:'Bağlantı / süre (sn)', hint:'yalnız bağlantı ve ses için',
            input:K.Input({ id:'as-url-' + discId, aria:'Bağlantı adresi ya da ses süresi' }) })}
        </div>
        ${K.Textarea({ id:'as-text-' + discId, rows:3, class:'mt-10',
          aria:'Ekin metni', placeholder:'Notun, belgenin özeti ya da kaydın hakkında not…' })}
        <div class="row wrap mt-10">
          ${K.Mic({ target:'as-text-' + discId })}
          ${K.Button({ label:'Ekle', tone:'primary', act:'desk-add-asset',
            data:{ 'data-disc':discId } })}
        </div>

        ${K.Notice({ tone:'info',
          body:'Ham ses dosyası ve belge içeriği TUTULMAZ: ses için süresi ve '
            + 'notun, belge için özetin saklanır. Koç bu eklerin sayısını, '
            + 'türünü ve başlığını görür; içeriğini görmez.' })}

        ${list.length
          ? html`<ul class="aslist mt-10">${map(list, a => html`
              <li class="${cls('asrow', 'asrow--' + a.kind)}">
                <span class="asrow__kind">${ASSET_LABELS[a.kind] || a.kind}</span>
                <span class="asrow__body">
                  <b>${a.title}</b>
                  ${when(a.text, () => html`<span class="asrow__text">${a.text}</span>`)}
                  ${when(a.url, () => html`<span class="tiny dim">${a.url}</span>`)}
                  ${when(a.seconds != null, () => html`<span class="tiny dim">${
                    Math.round(a.seconds)} sn · ölçüldü</span>`)}
                </span>
                <span class="tiny dim">${(a.at || '').slice(0, 10)}</span>
                ${K.Button({ label:'Sil', size:'sm', act:'desk-del-asset',
                  data:{ 'data-id':a.id } })}
              </li>`)}</ul>`
          : K.Empty({ text:'Bu bölüme henüz bir şey iliştirilmedi.' })}
      </div>`;
  }

  const REPEAT_LABELS = { none:'tekrar yok', daily:'her gün', weekly:'her hafta',
    monthly:'her ay' };

  function deskReminders(discId){
    const list = ESP.Desk.reminders(discId);
    const bugun = ESP.Desk.due(discId);
    return html`
      <div class="deskrem">
        <div class="cols-3">
          ${K.Field({ label:'Hatırlatma',
            input:K.Input({ id:'rm-text-' + discId, aria:'Hatırlatma metni',
              placeholder:'Perşembe akşamı ikinci taslağı oku' }) })}
          ${K.Field({ label:'Tarih',
            input:K.Input({ id:'rm-due-' + discId, type:'date', value:ESP.U.todayISO(),
              aria:'Hatırlatma tarihi' }) })}
          ${K.Field({ label:'Tekrar',
            input:K.Select({ id:'rm-rep-' + discId, value:'none', aria:'Tekrar aralığı',
              options:Object.keys(ESP.Model.REPEATS).map(k => ({ value:k,
                label:REPEAT_LABELS[k] })) }) })}
        </div>
        ${K.Button({ label:'Hatırlat', tone:'primary', act:'desk-add-rem',
          class:'mt-10', data:{ 'data-disc':discId } })}

        ${when(bugun.length, () => K.Notice({ tone:'warn',
          body:bugun.length + ' hatırlatma bugüne düştü. Kaçırılan bir hatırlatıcı '
            + 'ceza üretmez: sistem hiçbir şeyi zorunlu kılmaz.' }))}

        ${list.length
          ? html`<ul class="remlist mt-10">${map(list, r => html`
              <li class="${cls('remrow', r.done && 'is-done',
                  !r.done && r.due <= ESP.U.todayISO() && 'is-due')}">
                <span class="remrow__date num">${r.due}</span>
                <span class="remrow__text">${r.text}</span>
                <span class="tiny dim">${REPEAT_LABELS[r.repeat] || ''}</span>
                ${r.done
                  ? K.Badge({ label:'kapandı', tone:'ok' })
                  : K.Button({ label:'Yapıldı', size:'sm', act:'desk-done-rem',
                      data:{ 'data-id':r.id } })}
                ${K.Button({ label:'Sil', size:'sm', act:'desk-del-rem',
                  data:{ 'data-id':r.id } })}
              </li>`)}</ul>`
          : K.Empty({ text:'Bu bölümde hatırlatma yok.' })}
      </div>`;
  }

  /* ------------------------------------------------------- öğren ve pratik

     İki parça, iki ekranda paylaşılır (Dil ve Kronoloji):

       units(disc)     ünite listesi ve her birinin ilerlemesi
       practice(deck)  soru–cevap oturumu

     İlerleme çubuğu SRS'ten okunur; ayrı bir «tamamlandı» bayrağı yoktur. */
  function units(discId, lang){
    const list = ESP.Lesson.units(discId);
    if(!list.length) return K.Empty({ text:'Bu bölümde ünite tanımlı değil.' });

    return html`<div class="units">${map(list, u => {
      const p = ESP.Lesson.progress(u, lang);
      const acik = ESP.S.ui.unitOpen === u.id;
      return html`
        <div class="${cls('unit', p.total === 0 && 'is-empty', acik && 'is-open')}">
          <div class="unit__head">
            <span class="unit__lv num">${(ESP.LEVEL_BY_RANK[u.level] || {}).short || ''}</span>
            <div class="unit__body">
              <b>${u.title}</b>
              <span class="small muted">${u.goal}</span>
            </div>
            ${p.total
              ? K.Badge({ label:p.known + '/' + p.total + ' bilinen',
                  tone:p.known >= p.total ? 'ok' : (p.added ? 'info' : 'muted') })
              : K.Badge({ label:'malzeme yok', tone:'muted', icon:false })}
            ${K.Button({ label:acik ? 'Kapat' : 'Aç', size:'sm', act:'unit-open',
              data:{ 'data-id':u.id } })}
          </div>
          ${when(p.total, () => html`<div class="unit__bar" aria-hidden="true">
            <span style="width:${p.pct}%"></span></div>`)}
          ${when(acik, () => html`
            <div class="unit__detail">
              ${when(p.why, () => K.Notice({ tone:'info', body:p.why }))}
              ${when(u.task, () => html`<p class="small"><b>Görev:</b> ${u.task}</p>`)}
              ${when(u.ask, () => html`<p class="small"><b>Soru:</b> ${u.ask}</p>`)}
              ${when(p.total, () => html`
                <ul class="unit__items">${map(ESP.Lesson.itemsOf(u, lang).slice(0, 12),
                  it => html`<li><b>${it.front}</b><span>${it.back}</span></li>`)}</ul>
                ${K.Button({ label:p.added ? 'Eksikleri desteye ekle' : 'Desteye ekle',
                  tone:'primary', size:'sm', act:'unit-add',
                  data:{ 'data-id':u.id, 'data-disc':discId } })}`)}
            </div>`)}
        </div>`;
    })}</div>`;
  }

  function practice(deck){
    const s = ESP.S.ui.practice;
    if(!s || s.deck !== deck){
      return html`
        <p class="small muted">Pratik bir sınav değildir: cevabın doğrudan
          aralıklı tekrara yazılır, ayrı bir kayıt açılmaz.</p>
        ${K.Button({ label:'Pratiğe başla', tone:'primary', act:'prac-start',
          class:'mt-10', data:{ 'data-deck':deck } })}`;
    }

    if(s.done){
      const r = ESP.Lesson.result(s);
      return html`
        <div class="pracend">
          ${K.NextUp({ icon:'check', calm:true, label:'Oturum bitti',
            title:r.right + '/' + r.asked + ' doğru',
            why:'İsabet bir not değil bir ölçümdür: yanlışlar destede başa döndü.' })}
          ${when(r.missed.length, () => html`
            <ul class="pracmiss">${map(r.missed, m => html`<li>
              <b>${m.expected}</b><span class="tiny dim">senin cevabın: ${m.given || '—'}</span>
            </li>`)}</ul>`)}
          <div class="row wrap mt-10">
            ${K.Button({ label:'Gün kaydına yaz', tone:'primary', act:'prac-log' })}
            ${K.Button({ label:'Yeni oturum', act:'prac-start',
              data:{ 'data-deck':deck } })}
            ${K.Button({ label:'Kapat', act:'prac-close' })}
          </div>
        </div>`;
    }

    const q = s.questions[s.pos];
    const gosterildi = ESP.S.ui.practiceShown;
    return html`
      <div class="prac">
        <div class="prac__top">
          <span class="tiny dim">${s.pos + 1} / ${s.questions.length}</span>
          ${K.Badge({ label:(ESP.PRACTICE_BY_ID[q.kind] || {}).label || q.kind,
            tone:'muted', icon:false })}
          <span class="tiny dim">${s.right} doğru · ${s.wrong} yanlış</span>
        </div>

        <p class="prac__q">${q.prompt}</p>

        ${q.kind === 'order'
          ? (function(){
              /* Sıralama sorusu bir çoktan seçme değildir: seçenekleri hazır
                 dizmek, sıralamayı düşünmeden tanımayı ölçerdi. Kullanıcı
                 sırayı KENDİ kurar; seçtiği her olay listeden düşer. */
              const secilen = ESP.S.ui.practiceOrder || [];
              const kalan = q.options.filter(o => secilen.indexOf(o) < 0);
              return html`
                <ol class="prac__order">${map(secilen, o => html`<li>${o}</li>`)}</ol>
                <div class="prac__opts">${map(kalan, opt => K.Button({ label:opt,
                  act:'prac-pick', data:{ 'data-value':opt }, class:'prac__opt' }))}</div>
                <div class="row wrap mt-8">
                  ${when(secilen.length, () => K.Button({ label:'Sırayı temizle',
                    size:'sm', act:'prac-clear-order' }))}
                  ${when(!kalan.length, () => K.Button({ label:'Sırayı onayla',
                    tone:'primary', act:'prac-answer',
                    data:{ 'data-value':secilen.join(' | ') } }))}
                </div>`;
            })()
          : q.options
          ? html`<div class="prac__opts">${map(q.options, opt => K.Button({ label:opt,
              act:'prac-answer', data:{ 'data-value':opt }, class:'prac__opt' }))}</div>`
          : html`<div class="row mt-10">
              ${K.Input({ id:'prac-input', aria:'Cevabın', placeholder:'Cevabını yaz…' })}
              ${K.Mic({ target:'prac-input' })}
              ${K.Button({ label:'Cevapla', tone:'primary', act:'prac-answer' })}
            </div>`}

        ${when(gosterildi, () => K.Notice({ tone:'info',
          body:'Doğrusu: ' + q.answer }))}
        <div class="row wrap mt-10">
          ${K.Button({ label:'Bilmiyorum', size:'sm', act:'prac-skip' })}
          ${K.Button({ label:'Oturumu bitir', size:'sm', act:'prac-close' })}
        </div>
      </div>`;
  }

  /* ----------------------------------------------------------------- plan

     Koçun sistemi değiştirme YOLU. Ajan doğrudan yazmaz: teklif eder,
     kullanıcı onaylar, uygulamayı kural motoru yapar. Bir dil modelinin
     kullanıcının verisine doğrudan yazması, halüsinasyon riskini kalıcı
     hâle getirirdi — yanlış bir çıkarım bir cümle olarak kalmaz, bir
     hatırlatıcıya ya da bir hedefe dönüşürdü. */
  function proposalList(list, bos){
    if(!list.length) return K.Empty({ text:bos || 'Bekleyen teklif yok.' });
    return html`<ul class="props">${map(list, p => {
      const k = ESP.Plans.KIND_BY_ID[p.kind] || {};
      const a = ESP.AGENT_BY_ID[p.agentId] || {};
      return html`<li class="prop">
        <span class="prop__kind">${k.label || p.kind}</span>
        <span class="prop__body">
          <b>${p.title}</b>
          <span class="prop__why">${p.why}</span>
          <span class="tiny dim">${a.short || a.name || p.agentId} · ${k.note || ''}</span>
        </span>
        ${K.Button({ label:'Onayla', tone:'primary', size:'sm', act:'prop-accept',
          data:{ 'data-id':p.id } })}
        ${K.Button({ label:'Reddet', size:'sm', act:'prop-decline',
          data:{ 'data-id':p.id } })}
      </li>`;
    })}</ul>`;
  }

  function deskPlans(discId){
    const list = ESP.Desk.proposals(discId);
    const gecmis = (ESP.S.proposals || []).filter(p => p.disc === discId);
    return html`
      <div class="deskplan">
        ${K.Notice({ tone:'info',
          body:'Koç doğrudan yazmaz: teklif eder, sen onaylarsın, uygulamayı '
            + 'kural motoru yapar. Reddedilen bir teklif yarın tekrar sorulmaz.' })}
        ${proposalList(list, 'Bu masada bekleyen teklif yok.')}
        ${when(gecmis.length, () => html`
          <div class="mt-10">
            ${K.SectionTitle('Karar verilenler')}
            ${K.Table({ tight:true, headers:['Teklif', 'Karar', 'Uygulanan'],
              rows:gecmis.slice(0, 8).map(p => [
                p.title,
                p.state === 'accepted' ? 'onaylandı' : 'reddedildi',
                p.applied ? (ESP.Plans.KIND_BY_ID[p.applied.kind] || {}).label || p.applied.kind : '—',
              ]) })}
          </div>`)}
      </div>`;
  }

  /* Haftalık plan — takvim değil SIRA. */
  function weekPlan(){
    const p = ESP.Plans.plan();
    if(!p || !(p.days || []).length){
      return html`
        <p class="small muted">Plan bir takvim değildir: «salı 19:00'da gitar»
          demek sistemin işi değil. Haftanın kalan günlerine hangi disiplinin
          düştüğünü söyler ve sırayı haftalık rota verir.</p>
        ${K.Button({ label:'Plan kur', tone:'primary', act:'plan-make', class:'mt-10' })}`;
    }
    const bugun = ESP.U.todayISO();
    return html`
      <ul class="weekplan">${map(p.days, d => html`
        <li class="${cls('wpday', d.date === bugun && 'is-today',
            d.date < bugun && 'is-past')}">
          <span class="wpday__date num">${d.date}</span>
          <span class="wpday__disc"><b>${d.label}</b>
            <span class="tiny dim">${U.fmtMin(d.minutes)} · ${(d.items || [])
              .map(x => x.label).join(', ') || '—'}</span></span>
          ${K.Button({ label:'Aç', size:'sm', act:'go',
            data:{ 'data-route':d.route } })}
        </li>`)}</ul>
      <div class="row wrap mt-10">
        ${K.Button({ label:'Planı yenile', act:'plan-make' })}
        ${K.Button({ label:'Planı kaldır', act:'plan-clear' })}
      </div>`;
  }

  /* Tezgâhın kendisi — dört sekme tek bir defter satırında. */
  function desk(discId){
    const d = ESP.DISCIPLINE_BY_ID[discId];
    if(!d) return raw('');
    const a = ESP.Desk.agentOf(discId);
    const t = ESP.Desk.tab(discId);
    const acik = ESP.Desk.isOpen(discId);
    const bekleyen = ESP.Desk.due(discId).length;
    const teklif = ESP.Desk.proposals(discId).length;

    return K.Entry({
      label:'TEZGÂH', hint:'desk',
      meta:a.short || a.name,
      note:ESP.Desk.headline(discId),
      action:K.Button({ label:acik ? 'Kapat' : 'Aç', size:'sm', act:'desk-toggle',
        data:{ 'data-disc':discId } }),
      wide:true,
      body:acik
        ? html`
          ${K.Subtabs({ value:t, act:'desk-tab', aria:'Tezgâh bölümleri',
            items:ESP.Desk.TABS.map(x => Object.assign({ id:x.id, label:x.label },
              x.id === 'hatirlatma' && bekleyen ? { count:bekleyen }
                : (x.id === 'plan' && teklif ? { count:teklif } : {}))) })}
          <div class="desk__body" data-disc="${discId}">
            ${t === 'recete' ? deskRx(discId)
              : t === 'harita' ? deskMap(discId)
              : t === 'ekler' ? deskAssets(discId)
              : t === 'hatirlatma' ? deskReminders(discId)
              : t === 'plan' ? deskPlans(discId)
              : deskChat(discId)}
          </div>`
        : html`<p class="small muted">Tezgâh kapalı. ${a.name} ile konuşmak,
            haritayı görmek, not/belge iliştirmek ve hatırlatma kurmak için aç.</p>`,
    });
  }

  return { cert, measure, avatar, discChip, radar, empty, desk, deskRx,
    deskChat, deskMap, deskAssets, deskReminders, deskPlans, units, practice,
    proposalList, weekPlan, rx:rxList };

})();
