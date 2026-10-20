/* Hareket — Modül 3'ün ekranı.

   Ekran ALANLARA ayrılır. Kullanıcı gününü planlarken "bugün hangi kalıbı
   çalışayım" diye değil, "kardiyo mu yapayım, kuvvet mi, yoksa dinleneyim
   mi" diye düşünür. Sekmeler o soruyu karşılar:

     Bugün      toparlanmaya göre günün yük emri ve seans kaydı
     Kardiyo    yürüyüş, koşu, evde sprint
     Kuvvet     vücut ağırlığıyla altı kalıp — kendi içinde ikinci şeritle ayrılır
     Esneklik   mobilite akışları
     Dinlenme   yükün diğer yarısı: indirme haftası, boş gün, uyku
     İlerleme   yük eğrisi, son hafta / son ay oranı

   Dinlenmenin kendi sayfası olması kasıtlıdır. Antrenman programlarında
   dinlenme çoğu zaman "yapılmayan şey" olarak geçer ve görünmez olur;
   burada görünür, çünkü yük yönetiminin yarısı odur.

   Ekranın kuralı: sistem yükü kendiliğinden azaltabilir ama asla
   kendiliğinden artıramaz. Artırma kararı hep kullanıcınındır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.move = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  /* Sekmeler: iki genel görünüm ve arada dört faaliyet alanı. */
  const TABS = [{ id:'bugun', label:'Bugün', icon:'today' }]
    .concat(SP.AREAS.map(a => ({ id:a.id, label:a.label, icon:a.icon })))
    .concat([{ id:'ilerleme', label:'İlerleme', icon:'chart' }]);

  /* Kuvvet alanının ikinci şeridi: hareket kalıpları. Yalnız kuvvette
     çizilir — kardiyoda ve esneklikte kalıp yoktur, orada şerit çizmek
     boş bir seçim sunmak olurdu. */
  function patternTabs(){
    const rows = SP.Move.patternBalance();
    const byId = {};
    rows.forEach(r => { byId[r.pattern.id] = r.count; });
    return [{ id:'all', label:'Tümü', count:SP.EXERCISES.filter(e => e.kind === 'strength').length }]
      .concat(SP.PATTERNS.map(p => ({ id:p.id, label:p.label, count:byId[p.id] || null })));
  }

  /* Kalıp süzgeci sekme DEĞİL (EKIP-PLANI §1.2): listeyi daraltan basılı/
     basılmamış çipler. Eylem aynı (`pick-pattern-tab`), yalnız biçimi
     değişti; seçili olan `aria-pressed` taşır. */
  function desenSuzgeci(){
    const secili = S.ui.movePattern || 'all';
    return html`<div class="row wrap gap-6 mb-8" role="group" aria-label="Hareket kalıbı">
      ${map(patternTabs(), x => K.Chip({ label:x.label + (x.count ? ' · ' + x.count : ''),
        act:'pick-pattern-tab', on:x.id === secili,
        data:{ 'data-tab':x.id, 'aria-pressed':x.id === secili ? 'true' : 'false' } }))}
    </div>`;
  }

  function exercisesOfArea(areaId){
    const area = SP.AREA_BY_ID[areaId];
    if(!area || !area.kind) return [];
    const list = SP.EXERCISES.filter(e => e.kind === area.kind);
    if(areaId !== 'kuvvet') return list;
    const pat = S.ui.movePattern || 'all';
    return pat === 'all' ? list : list.filter(e => e.pattern === pat);
  }

  /* --------------------------------------------------------------- bugün */

  function orderEntry(){
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    return K.Entry({
      label:'Günün yük emri', hint:'recovery-order',
      meta:rx.factor >= 1 ? 'tam yük' : 'yükün %' + Math.round(rx.factor * 100) + '\u2019i',
      /* «Emri toparlanma belirler…» ⓘ'de (hints: recovery-order). */
      action:when(!r.ok, () => K.Button({ label:'Veri gir',
        act:'go', data:{ 'data-route':'today' } })),
      body:html`
        ${when(r.ok, () => html`<div class="row wrap" style="gap:26px">
          ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:122,
            bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
          <p class="grow small" style="min-width:210px">${r.band.order}</p>
        </div>`)}
        <!-- toparlanma gerekcesi gostergenin yaninda yaziyor; ayni cumle
             bir de uyari kutusunda tekrar edilmez -->
        ${map(rx.reasons.filter(x => !(r.ok && x.id === 'readiness')),
          x => K.Notice({ tone:x.kind === 'muted' ? 'info' : x.kind, body:x.text }))}
        ${when(rx.kind === 'rest', () => K.Notice({ tone:'info',
          body:'Bu bir geri adım değil, planın parçası. Asgari gün yine geçerli: '
            + SP.LOAD_RULES.minDay.minutes + ' dakika yürüyüş.' }))}`,
    });
  }

  function pickSessionEntry(){
    const rx = SP.Move.prescription();
    const suggested = rx.suggest.map(t => t.id);
    return K.Entry({
      label:'Seans seç', hint:'session-pick',
      meta:SP.SESSION_TEMPLATES.length + ' şablon',
      action:html`${K.Button({ label:'Programlar (20)', act:'open-programs', size:'sm', tone:'ghost' })}
        ${K.Button({ label:'MET Kalori', act:'open-met-calc', size:'sm', tone:'ghost' })}`,
      body:html`<div class="picks">${map(SP.SESSION_TEMPLATES, t => html`
        <button class="${cls('pickcard', suggested[0] === t.id && 'is-on')}"
          data-act="start-session" data-id="${t.id}">
          <span class="pickcard__box" aria-hidden="true">${suggested[0] === t.id ? raw(UI.icon('check')) : ''}</span>
          <span class="pickcard__body">
            <span class="pickcard__name">${t.name}
              ${when(suggested.indexOf(t.id) >= 0, () => html`<span class="tiny dim"> · önerilen</span>`)}</span>
            <span class="pickcard__meta">${t.minutes} dk · ${t.items.length} hareket — ${t.note}</span>
          </span>
        </button>`)}
        <button class="pickcard" data-act="start-session" data-id="">
          <span class="pickcard__box" aria-hidden="true"></span>
          <span class="pickcard__body">
            <span class="pickcard__name">Serbest seans</span>
            <span class="pickcard__meta">Hareketleri kendin seç</span>
          </span>
        </button>
      </div>`,
    });
  }

  /* HAZIR ANTRENMANLAR (core/hazir.js, 2026-10-17): «bugün onu yaptım»
     tek dokunuş. Liste boşsa kutu yok; seans satırındaki işaret saklar. */
  function hazirAntrenmanEntry(){
    if(!SP.Hazir) return null;
    const l = SP.Hazir.antrenmanlar();
    if(!l.length) return null;
    const d = U.todayISO();
    const duzen = !!S.ui.hazirAntDuzen;
    return K.Entry({
      label:'Hazır antrenmanlar', meta:duzen ? 'düzenle' : 'tek dokunuşla bugüne',
      action:K.Button({ label:duzen ? 'Bitti' : 'Düzenle', size:'sm', tone:'ghost', act:'hazir-antrenman-duzen' }),
      body:html`<div class="picks">${map(l, h => {
        const yapildi = SP.Hazir.bugunVar(h, d);
        return duzen
          ? html`<div class="pickcard"><span class="pickcard__body"><span class="pickcard__name">${h.ad}</span>
              <span class="pickcard__meta">${SP.Hazir.antrenmanOzet(h)}</span></span>
              ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'hazir-antrenman-sil', data:{ 'data-id':h.id } })}</div>`
          : html`<button class="${cls('pickcard', yapildi && 'is-on')}" data-act="hazir-antrenman-ekle" data-id="${h.id}"
              aria-label="${h.ad + (yapildi ? ': bugün eklendi, bir daha ekle' : ': bugün yaptım')}">
              <span class="pickcard__box" aria-hidden="true">${yapildi ? raw(UI.icon('check')) : raw(UI.icon('plus'))}</span>
              <span class="pickcard__body"><span class="pickcard__name">${h.ad}</span>
                <span class="pickcard__meta">${SP.Hazir.antrenmanOzet(h)}${yapildi ? ' · bugün eklendi' : ''}</span></span>
            </button>`;
      })}</div>`,
    });
  }
  function hazirAntrenmanSheet(w){
    UI.sheet({
      title:'Hazır antrenman yap', subtitle:'Hareket sayfasında «bugün yaptım» diye tek dokunuşla eklenir',
      body:String(K.Stack([
        K.Field({ label:'Adı', input:K.Input({ id:'hazir-antrenman-ad', value:w.name || 'Antrenman' }) }),
        html`<p class="tiny dim">Zorlanma puanı ve not saklanmaz; her gün yeniden sorulur.</p>`,
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Sakla', tone:'primary', act:'hazir-antrenman-kaydet', data:{ 'data-id':w.id } })}`),
    });
  }

  function todaySessionsEntry(){
    const d = U.todayISO();
    const rows = M.workoutsOf(d);
    if(!rows.length){
      return K.Entry({ label:'Bugünün seansları', meta:'kayıt yok',
        body:P.empty('Bugün henüz seans kaydı yok. Yukarıdan bir seans seç.') });
    }
    return K.Entry({
      label:'Bugünün seansları',
      meta:rows.length + ' seans · ' + U.sum(rows.map(SP.Move.sessionLoad)) + ' yük',
      body:html`<div class="list">${map(rows, w => html`
        <div class="listitem">
          <div class="grow">
            <b class="small">${w.name}</b>
            <div class="tiny dim">${w.minutes} dk
              ${when(w.rpe, () => html`· zorluk ${w.rpe}/10`)}
              · yük ${SP.Move.sessionLoad(w)}
              · ${(w.items || []).length} hareket</div>
          </div>
          ${K.Button({ label:'Düzenle', size:'sm', act:'edit-session', data:{ 'data-id':w.id } })}
          ${when(SP.Hazir, () => K.IconButton({ icon:'bookmark', size:'sm', plain:true, aria:'Hazır antrenman yap',
            act:'hazir-antrenman-sakla', data:{ 'data-id':w.id } }))}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Sil',
            act:'del-session', data:{ 'data-id':w.id } })}
        </div>`)}</div>`,
    });
  }

  function balanceBody(){
    const rows = SP.Move.patternBalance();
    return html`${map(rows, r => html`
      <button class="${cls('minrow', !r.missing && 'is-done')}" style="width:100%"
        data-act="pick-pattern" data-id="${r.pattern.id}">
        <span class="minrow__mark">${r.missing ? '' : '✓'}</span>
        <span class="minrow__label"><b>${r.pattern.label}</b>
          <span class="tiny dim"> · ${r.pattern.note}</span></span>
        <span class="minrow__detail num">${r.count}</span>
      </button>`)}`;
  }

  /* Merdiven artık kart değil: ince çizgiyle ayrılan bir blok. */
  function ladderBlock(ex){
    const pr = SP.Move.progressionCheck(ex.id);
    const cur = M.levelIndex(ex.id);
    const pattern = SP.PATTERNS.find(x => x.id === ex.pattern);
    return html`
      <div class="ladderblk">
        <div class="ladderblk__head">
          ${raw(String(SP.FotoUI.kutu({ sahip:'hareket:' + ex.id, ad:ex.name, yon:'user' })))}
          <div class="minw0 grow">
            <b class="ladderblk__name">${ex.name}</b>
            <span class="tiny dim">${pattern ? pattern.label
              : ex.kind === 'cardio' ? 'Dayanıklılık' : 'Mobilite'}
              · ${ex.equip === 'yok' ? 'ekipmansız' : ex.equip}</span>
          </div>
          ${pr.ready ? K.Badge({ label:'üst basamak açık', tone:'ok' })
            : K.Badge({ label:pr.sessions + '/' + pr.needed + ' seans', tone:'muted' })}
        </div>
        <p class="small muted">${ex.cue}</p>
        <div class="ladder">${map(ex.levels, (l, i) => html`
          <div class="${cls('ladderstep', i < cur && 'is-done', i === cur && 'is-current')}">
            <span class="ladderstep__no">${i + 1}</span>
            <span>${l.name}</span>
            <span class="ladderstep__to">${l.to}</span>
          </div>`)}</div>
        <div class="ladderblk__foot">
          <span class="small dim">${pr.note}</span>
          <span class="row-sm">
            ${K.Button({ label:'Teknik ve ipuçları', size:'sm', tone:'ghost', act:'open-ex-detail', data:{ 'data-id':ex.id } })}
            ${when(pr.ready, () => K.Button({ label:'Üst basamağa geç', size:'sm',
              act:'advance', data:{ 'data-id':ex.id } }))}
            ${K.Button({ label:'Basamak seç', size:'sm', act:'pick-level', data:{ 'data-id':ex.id } })}
          </span>
        </div>
      </div>`;
  }

  /* ---------------------------------------------------------- alanlar */

  /* Bir faaliyet alanının sayfası: alanın ne olduğu, o alandaki hareket
     merdivenleri ve alana özel kural. */
  function areaView(areaId){
    const area = SP.AREA_BY_ID[areaId];
    const list = exercisesOfArea(areaId);
    const rx = SP.Move.prescription();

    return K.Ledger([
      when(areaId === 'kardiyo', () => rotaKarti()),
      when(areaId === 'kardiyo', () => K.Entry({
        label:'Haftalık süre', hint:'load', meta:'%10 kuralı', body:cardioBody(),
      })),

      when(areaId === 'esneklik' && rx.kind !== 'full', () => K.Entry({
        label:'Bugün için', meta:'toparlanma bandı',
        body:K.Notice({ tone:'info',
          body:'Toparlanma ' + (rx.readiness.ok ? rx.readiness.band.label.toLocaleLowerCase('tr-TR')
            : 'ölçülmedi') + '. Esneklik akışı ağır antrenmanın yerine geçebilir; '
            + 'yük üretmez ama zinciri kırmaz.' }),
      })),

      K.Entry({
        label:area.label, hint:'progression',
        meta:list.length + ' hareket',
        action:K.Button({ label:'Seans ekle', icon:'plus',
          act:'start-area', data:{ 'data-area':areaId } }),
        body:html`
          ${when(areaId === 'kuvvet', () => desenSuzgeci())}
          ${when(!list.length, () => P.empty('Bu kalıpta tanımlı hareket yok.'))}
          <div class="ladders">${map(list, ladderBlock)}</div>`,
      }),

      when(areaId === 'kuvvet', () => K.Entry({
        label:'Kalıp dengesi', meta:'haftalık', body:balanceBody(),
      })),

      K.Entry({
        /* Üç bölümde aynı kart: başlıkta bölümün adı, yoksa gizle.js yalnız
           ilkini yönetirdi (aynı anahtar). Öğreti ⓘ'de ve künyede; gizli. */
        label:'İlerleme kuralı · ' + area.label, hint:'progression',
        meta:SP.Move.ADVANCE_SESSIONS + ' seans / ' + SP.Move.ADVANCE_WINDOW + ' gün',
        body:html`<p class="small muted">Bir üst basamak, mevcut basamakta son
          ${SP.Move.ADVANCE_WINDOW} günde ${SP.Move.ADVANCE_SESSIONS} seans yapıldığında açılır.
          Sistem basamak atlatmaz: aşırı yüklenmenin en yaygın sebebi budur.</p>`,
      }),
    ]);
  }

  function cardioBody(){
    const ids = SP.EXERCISES.filter(e => e.kind === 'cardio').map(e => e.id);
    const days = U.lastDays(14);
    let thisWeek = 0, lastWeek = 0;
    days.forEach((d, i) => {
      const mins = M.workoutsOf(d).filter(w => (w.items || []).some(it => ids.indexOf(it.exId) >= 0))
        .reduce((a, w) => a + (w.minutes || 0), 0);
      if(i >= 7) thisWeek += mins; else lastWeek += mins;
    });
    const cap = Math.round(lastWeek * 1.1);
    return html`
      <div class="cols-3">
        ${K.Stat({ label:'Bu hafta', value:String(thisWeek), unit:'dk' })}
        ${K.Stat({ label:'Geçen hafta', value:String(lastWeek), unit:'dk' })}
        ${K.Stat({ label:'Bu haftanın tavanı', value:lastWeek ? String(cap) : '—', unit:'dk',
          note:lastWeek ? '%10 kuralı' : 'geçen hafta veri yok' })}
      </div>
      ${K.Notice({ tone:lastWeek && thisWeek > cap ? 'warn' : 'info',
        body:lastWeek
          ? (thisWeek > cap
            ? 'Bu hafta geçen haftanın %10 üstünü aştı. Süreyi artırmak yerine tempoyu koru.'
            : SP.LOAD_RULES.weeklyGrowth.note)
          : 'Geçen hafta kardiyo kaydı yok; tavan hesaplanmadı. Eksik veri sıfır sayılmaz.' })}`;
  }

  /* ------------------------------------------------------------ rotalar

     Strava'daki rota haritası (kullanıcı, 2026-10-03: «minimalistliği
     bozmadan»). Ekranda TEK kart: son rotanın haritası ve bir satır özet.
     Dilimler, yükseklik ve ısı haritası karta dokununca açılan kağıtta.
     Rota iki yoldan gelir: hareket ederken canlı kayıt (kullanıcı, aynı
     gün: «rotayı biz hareket ederken çizecek») ya da GPX dosyası.
     Hesap `core/rota.js`, çizim `core/harita.js`, kayıt `core/canli.js`. */
  const Ro = () => SP.Rota;
  const sayiHtml = s => {
    const L = window.LIFEOS || {};
    return L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
  };
  const rotaIzi = w => Ro().coz(w.rota.iz);
  const ROTA_DOSYA_EN_COK = 25 * 1024 * 1024;

  /* «5,24 km · 28:10 · 5:22 dk/km» — bisiklette tempo yerine hız. */
  function rotaSatiri(r, exId){
    const R = Ro();
    const parca = [R.km(r.mesafe) + ' km', R.sureMetni(r.hareket)];
    if(R.hizMi(exId)){
      const h = R.hiz(r.hareket, r.mesafe);
      if(h != null) parca.push(U.fmtNum(Math.round(h * 10) / 10) + ' km/sa');
    }else{
      const t = R.tempo(r.hareket, r.mesafe);
      if(t != null) parca.push(R.sureMetni(t) + ' dk/km');
    }
    return parca.join(' · ');
  }
  function rotaAdi(w){
    return w.name + ' · ' + U.fmtShort(w.rota ? U.iso(new Date(w.rota.bas)) : w.date);
  }

  function gpxDugmesi(){
    return html`<label class="btn btn--sm btn--ghost rota__ekle">
      ${raw(UI.icon('plus'))}<span class="btn__label">GPX ekle</span>
      <input type="file" class="sr-only"
        accept=".gpx,application/gpx+xml,application/xml,text/xml,application/octet-stream"
        data-change="rota-dosya" aria-label="GPX dosyası seç"/>
    </label>`;
  }

  /* Hareket seçicilerinde kısa ad: «Tempolu yürüyüş» telefonda iki satıra
     bölünüyordu. */
  const KISA_AD = { kosu:'Koşu', yuruyus:'Yürüyüş', bisiklet:'Bisiklet' };
  const turSecici = (act, value) => K.Segmented({ act, value:value || '', aria:'Hareket türü', block:true,
    items:Ro().HAREKETLER.map(id => ({ value:id, label:KISA_AD[id] || SP.EX_BY_ID[id].name })) });

  /* Kartta tek ana eylem («Kayda başla») ve tek bağlantı («Tümü»). Kayıt
     varken ana eylemin yerinde kaydın durumu durur. GPX ekle ve ısı
     haritası «Tümü» kağıdında; rota yokken GPX ekle kartta kalır. */
  function rotaKarti(){
    const R = Ro(), rotalar = R.liste(S.workouts), son = rotalar[0];
    const c = SP.Canli.durum();
    return K.Entry({
      label:'Rotalar', hint:'rota', meta:rotalar.length ? rotalar.length + ' rota' : null,
      action:c ? null : K.Button({ label:'Kayda başla', icon:'play', size:'sm', act:'canli-ac' }),
      body:html`<div class="rota" data-drop="rota-dosya">
        ${when(c, () => html`<div class="canli-kart" id="canli-kart" data-hal="${c.hal}">${raw(canliKartIc(c))}</div>`)}
        ${son ? html`
        ${raw(SP.Harita.ciz([rotaIzi(son)], { gen:640, yuk:300,
          dugme:{ act:'rota-ac', id:son.id, aria:'Rotayı aç: ' + rotaAdi(son) } }).html)}
        <div class="rota__satir">
          <b class="small">${rotaAdi(son)}</b>
          <span class="small dim num">${rotaSatiri(son.rota, R.exOf(son))}</span>
        </div>
        <div class="rota__alt">${K.Button({ label:'Tümü', size:'sm', tone:'ghost', act:'rota-tumu' })}</div>`
        : when(!c, () => html`<p class="small dim">Hareket ettikçe rota haritada çizilir.</p>
          <div class="rota__alt">${gpxDugmesi()}</div>`)}
      </div>`,
    });
  }

  /* ------------------------------------------------------- canlı kayıt

     Kayıt motoru ekrandan bağımsızdır (core/canli.js): kağıt kapansa,
     başka ekrana geçilse de sürer. Ekran yalnız gösterir. Saniyede bir
     yalnız METİNLER tazelenir; düğmeler hâl değişince yeniden çizilir
     (her saniye çizilen düğme odağı kullanıcının elinden alır). Harita en
     sık üç saniyede bir çizilir. */
  let canliTur = null, canliSaat = null, canliHal = null;
  let canliCizim = { n:-1, t:0 };

  function canliKartMetni(c){
    const R = Ro(), o = SP.Canli.ozet();
    const ad = c.hal === 'kayitta' ? 'Kayıt sürüyor' : c.hal === 'bitti' ? 'Kaydedilmemiş rota'
      : c.geriGeldi ? 'Kayıt yarıda kaldı' : 'Duraklatıldı';
    const km = o ? R.km(o.mesafe) + ' km' : c.nokta ? '0,00 km' : 'konum bekleniyor';
    return String(html`<i class="${cls('canli-kart__isaret', c.hal === 'kayitta' && 'is-canli')}" aria-hidden="true"></i>
      <b class="small">${ad}</b> <span class="small dim num">${R.sureMetni(c.sure)} · ${km}</span>`);
  }
  function canliKartIc(c){
    const dug = c.hal === 'kayitta'
      ? K.Button({ label:'Aç', size:'sm', act:'canli-ekran' })
      : c.hal === 'bitti'
        ? html`${K.Button({ label:'Gözden geçir', size:'sm', tone:'primary', act:'canli-gozden' })}
          ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'canli-sil' })}`
        : html`${K.Button({ label:'Sürdür', icon:'play', size:'sm', tone:'primary', act:'canli-surdur' })}
          ${K.Button({ label:'Bitir', size:'sm', act:'canli-bitir' })}`;
    return String(html`<span class="canli-kart__ne" id="canli-kart-ne">${raw(canliKartMetni(c))}</span>
      <span class="canli-kart__dug">${dug}</span>`);
  }

  function canliBaslatKagidi(){
    const R = Ro();
    if(!canliTur){ const son = R.liste(S.workouts)[0]; canliTur = (son && R.exOf(son)) || 'kosu'; }
    UI.sheet({
      title:'Kayda başla',
      body:String(html`${turSecici('canli-tur', canliTur)}
        <p class="tiny dim">${SP.Canli._ortam.arkaPlan()
          ? 'Ekran kapalıyken de kaydeder; telefon cebinde olabilir.'
          : 'Ekran açık kalmalı; kilitli ekranda konum gelmez.'}</p>`),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Başlat', icon:'play', tone:'primary', act:'canli-basla' })}`),
      noFocus:true,
    });
  }

  function canliSayilar(c){
    const R = Ro(), o = SP.Canli.ozet(), bisiklet = R.hizMi(c.tur);
    const yok = { deger:null, kesinlik:'missing' };
    const hesap = (deger, birim, extra) => Object.assign({ deger, birim, kesinlik:'computed' }, extra);
    const hiz = o && R.hiz(o.hareket, o.mesafe), tempo = o && R.tempo(o.hareket, o.mesafe);
    const kutu = (ad, s) => '<div class="canli__sayi"><span class="tiny dim">' + ad
      + '</span><b class="canli__deger num">' + sayiHtml(s) + '</b></div>';
    return kutu('Süre', { deger:R.sureMetni(c.sure), kesinlik:'measured' })
      + kutu('Mesafe', o ? hesap(o.mesafe / 1000, 'km', { ondalik:2 }) : yok)
      + (bisiklet
        ? kutu('Ort. hız', hiz == null ? yok : hesap(Math.round(hiz * 10) / 10, 'km/sa'))
        : kutu('Ort. tempo', tempo == null ? yok : hesap(R.sureMetni(tempo), 'dk/km')));
  }
  function canliHarita(c){
    const o = SP.Canli.ozet();
    const h = o ? SP.Harita.ciz([Ro().sakla(o.iz)], { gen:640, yuk:360, etiket:'Canlı rota' }).html : '';
    return h || '<div class="harita canli__bos" style="aspect-ratio:640 / 360"><span class="small dim">'
      + (c.nokta ? 'Hareket bekleniyor…' : 'Konum bekleniyor…') + '</span></div>';
  }
  /* Durum satırı yalnız DİKKAT gerekince konuşur; her şey yolundaysa boş. */
  function canliDurumMetni(c){
    if(c.hal !== 'kayitta'){
      return c.hata || (c.geriGeldi ? 'Sayfa kapandığı için kayıt durdu.' : 'Duraklatıldı; aradaki yol sayılmaz.');
    }
    if(c.hata) return c.hata;
    if(!c.nokta) return c.bekleme || 'Konum bekleniyor…';
    return c.ekran === 'acik' || c.ekran === 'arka-plan' ? '' : 'Ekranı açık tut; kilitli ekranda konum gelmez.';
  }
  function canliDugmeleri(c){
    return String(html`${c.hal === 'kayitta'
      ? K.Button({ label:'Duraklat', icon:'pause', act:'canli-duraklat' })
      : K.Button({ label:'Sürdür', icon:'play', act:'canli-surdur' })}
      ${K.Button({ label:'Bitir', icon:'stop', tone:'primary', act:'canli-bitir' })}`);
  }

  function canliEkrani(){
    const c = SP.Canli.durum();
    if(!c) return;
    if(c.hal === 'bitti'){ handle['canli-gozden'](); return; }
    UI.sheet({
      title:c.tur ? KISA_AD[c.tur] : 'Kayıt', wide:true,
      body:String(html`<div class="canli" id="canli-ekran">
        <div class="canli__sayilar" id="canli-sayilar">${raw(canliSayilar(c))}</div>
        <div id="canli-harita">${raw(canliHarita(c))}</div>
        <p class="tiny dim" id="canli-durum" aria-live="polite">${canliDurumMetni(c)}</p>
      </div>`),
      footer:canliDugmeleri(c),
      noFocus:true,
    });
    const ayak = document.querySelector('#sheet .sheet__foot');
    if(ayak) ayak.dataset.hal = c.hal;
    canliCizim = { n:c.nokta, t:Date.now() };
  }

  /* Ekrandaki canlı parçaları yerinde tazeler; çizim yapmaz. */
  function canliTazele(){
    const c = SP.Canli.durum();
    if(!c || c.hal !== 'kayitta'){ clearInterval(canliSaat); canliSaat = null; }
    const kart = document.getElementById('canli-kart');
    if(kart && c){
      if(kart.dataset.hal !== c.hal){ kart.innerHTML = canliKartIc(c); kart.dataset.hal = c.hal; }
      else{ const ne = document.getElementById('canli-kart-ne'); if(ne) ne.innerHTML = canliKartMetni(c); }
    }
    const ekran = document.getElementById('canli-ekran');
    if(!ekran || !c) return;
    document.getElementById('canli-sayilar').innerHTML = canliSayilar(c);
    /* Durum satırı aria-live: yalnız DEĞİŞİNCE yazılır, yoksa ekran
       okuyucu aynı cümleyi her saniye yeniden okur. */
    const dur = document.getElementById('canli-durum'), metin = canliDurumMetni(c);
    if(dur.textContent !== metin) dur.textContent = metin;
    if(c.nokta !== canliCizim.n && (canliCizim.n < 2 || Date.now() - canliCizim.t >= 3000)){
      document.getElementById('canli-harita').innerHTML = canliHarita(c);
      canliCizim = { n:c.nokta, t:Date.now() };
    }
    const ayak = ekran.closest('.sheet').querySelector('.sheet__foot');
    if(ayak && ayak.dataset.hal !== c.hal){ ayak.innerHTML = canliDugmeleri(c); ayak.dataset.hal = c.hal; }
  }
  function canliSaatKur(){
    if(!canliSaat) canliSaat = setInterval(canliTazele, 1000);
  }

  /* Motorun kendi başına değiştirdiği hâl (izin kalktı, kayıt silindi)
     de ekrana yansır; hata cümlesi bildirim olarak söylenir. */
  SP.Canli.dinle(olay => {
    if(olay.tip === 'hata') UI.toast(olay.why);
    const c = SP.Canli.durum(), hal = c ? c.hal : null;
    if(hal === 'kayitta') canliSaatKur();
    if(hal === canliHal) return;
    const kartVardi = canliHal != null;
    canliHal = hal;
    canliTazele();
    /* Kart kabı hâlin VARLIĞINA bağlı: kayıt doğunca ya da silinince
       ekran yeniden çizilir. */
    if(S.route === 'move' && kartVardi !== (hal != null)) SP.App.render();
  });

  function canliOnizle(rota){
    const c = SP.Canli.durum();
    rotaTaslak = { rota, tur:c && c.tur, turYazi:null, canli:true };
    onizleme();
  }

  function rotaKagidi(w){
    const R = Ro(), r = w.rota, exId = R.exOf(w);
    const zaman = U.iso(new Date(r.bas));
    const hesap = (deger, birim, formul) => ({ deger, birim, kesinlik:'computed', zaman, formul,
      girdiler:[{ ad:'GPS noktası', deger:r.nokta, kesinlik:'measured' }] });
    const tempo = R.tempo(r.hareket, r.mesafe), hiz = R.hiz(r.hareket, r.mesafe);
    const tirmanis = r.tirmanis == null
      ? { deger:null, kesinlik:'missing' }
      : hesap(r.tirmanis, 'm', 'yumuşatılmış yükseklikte ' + R.TIRMANIS_ESIK + ' m eşikle toplam çıkış');
    const dilimSatiri = x => [
      x.m >= 1000 ? String(r.dilimler.indexOf(x) + 1) : R.km(x.m),
      R.hizMi(exId)
        ? (R.hiz(x.sn, x.m) == null ? '—' : U.fmtNum(Math.round(R.hiz(x.sn, x.m) * 10) / 10) + ' km/sa')
        : (R.tempo(x.sn, x.m) == null ? '—' : R.sureMetni(R.tempo(x.sn, x.m))),
      x.dy == null ? '—' : (x.dy > 0 ? '+' : '') + U.fmtNum(x.dy) + ' m',
    ];
    UI.sheet({
      title:w.name, wide:true,
      subtitle:U.fmtDate(zaman) + (r.ad ? ' · ' + r.ad : ''),
      /* Tek sarmal: kağıt gövdesi esnek sütundur ve tablo orada büzülür
         (bkz. css/rota.css › .rota-kagit). */
      body:String(html`<div class="rota-kagit">
        ${raw(SP.Harita.ciz([rotaIzi(w)], { gen:640, yuk:360, etiket:'Rota: ' + rotaAdi(w) }).html)}
        <div class="cols-4 mt-16">
          ${K.Stat({ label:'Mesafe', value:raw(sayiHtml(Object.assign(hesap(r.mesafe / 1000, 'km',
            'GPS noktaları arası mesafelerin toplamı'), { ondalik:2 }))) })}
          ${K.Stat({ label:'Hareket süresi', value:raw(sayiHtml({ deger:R.sureMetni(r.hareket), kesinlik:'computed',
            zaman, formul:'hızın ' + U.fmtNum(R.HAREKET_MS) + ' m/sn üstünde olduğu süre' })),
            note:r.sure - r.hareket >= 60 ? 'toplam ' + R.sureMetni(r.sure) : null })}
          ${R.hizMi(exId)
            ? K.Stat({ label:'Ortalama hız', value:raw(sayiHtml(hiz == null ? { deger:null, kesinlik:'missing' }
              : hesap(Math.round(hiz * 10) / 10, 'km/sa', 'mesafe ÷ hareket süresi'))) })
            : K.Stat({ label:'Ortalama tempo', value:raw(sayiHtml(tempo == null ? { deger:null, kesinlik:'missing' }
              : { deger:R.sureMetni(tempo), birim:'dk/km', kesinlik:'computed', zaman,
                formul:'hareket süresi ÷ mesafe' })) })}
          ${K.Stat({ label:'Tırmanış', value:raw(sayiHtml(tirmanis)),
            note:r.tirmanis == null ? 'dosyada yükseklik yok' : null })}
        </div>
        ${when(r.profil, () => html`<h3 class="section-h mt-24">Yükseklik</h3>
          ${raw(SP.Harita.profilSvg(r.profil, r.mesafe))}`)}
        ${when((r.dilimler || []).length, () => html`<h3 class="section-h mt-24">Dilimler</h3>
          ${K.Table({ tight:true,
            headers:['Km', { label:R.hizMi(exId) ? 'Hız' : 'Tempo', num:true }, { label:'Yükseklik', num:true }],
            rows:r.dilimler.map(dilimSatiri) })}`)}
      </div>`),
      footer:String(html`${K.Button({ label:'Sil', tone:'danger', act:'del-session', data:{ 'data-id':w.id } })}
        ${K.Button({ label:'Kapat', act:'sheet-close' })}`),
      noFocus:true,
    });
  }

  function rotaListesi(){
    const R = Ro(), rotalar = R.liste(S.workouts);
    UI.sheet({
      title:'Rotalar', subtitle:rotalar.length + ' rota',
      body:String(html`<div class="list">${map(rotalar, w => html`
        <button type="button" class="listitem rota__satirdugme" data-act="rota-ac" data-id="${w.id}">
          <span class="grow">
            <b class="small">${rotaAdi(w)}</b>
            <span class="tiny dim num" style="display:block">${rotaSatiri(w.rota, R.exOf(w))}</span>
          </span>
          ${raw(UI.icon('right'))}
        </button>`)}</div>`),
      footer:String(html`<span class="rota__ayak">${gpxDugmesi()}
        ${when(rotalar.length > 1, () => K.Button({ label:'Isı haritası', size:'sm', tone:'ghost', act:'rota-isi' }))}</span>
        ${K.Button({ label:'Kapat', act:'sheet-close' })}`),
      noFocus:true,
    });
  }

  function isiKagidi(){
    const R = Ro(), b = SP.Harita.bolge(R.liste(S.workouts).map(rotaIzi));
    UI.sheet({
      title:'Isı haritası', wide:true,
      subtitle:b.secilen.length + ' rota üst üste',
      body:String(html`
        ${raw(SP.Harita.ciz(b.secilen, { gen:640, yuk:480, isi:true,
          etiket:'Isı haritası: ' + b.secilen.length + ' rota' }).html)}
        ${when(b.disarida, () => html`<p class="tiny dim mt-8">${b.disarida} rota başka bir
          bölgede; bu haritaya alınmadı.</p>`)}`),
      footer:String(K.Button({ label:'Kapat', act:'sheet-close' })),
      noFocus:true,
    });
  }

  /* İçe aktarma ve canlı kaydın sonu: rota ÖNİZLENİR; kayıt yalnız
     «Kaydet»le. Tür bilinmiyorsa seçilmeden kaydedilmez (AGENTS §1.7).
     Canlı kayıtta «Sonra» kaydı silmez: kartta «Kaydedilmemiş rota»
     olarak bekler. */
  let rotaTaslak = null;
  const sureKisa = sn => sn < 60 ? sn + ' sn' : Math.round(sn / 60) + ' dk';
  function onizleme(){
    const R = Ro(), t = rotaTaslak, r = t.rota;
    const bas = new Date(r.bas);
    const saat = String(bas.getHours()).padStart(2, '0') + ':' + String(bas.getMinutes()).padStart(2, '0');
    UI.sheet({
      title:t.canli ? 'Kaydı kaydet' : 'Rotayı ekle', wide:true,
      subtitle:U.fmtDate(U.iso(bas)) + ' · ' + saat,
      body:String(html`
        ${raw(SP.Harita.ciz([R.coz(r.iz)], { gen:640, yuk:340, etiket:'Eklenecek rota' }).html)}
        <p class="small num mt-12">${rotaSatiri(r, t.tur)}${r.tirmanis != null
          ? ' · ↑ ' + U.fmtNum(r.tirmanis) + ' m' : ''}</p>
        <div class="mt-16">${turSecici('rota-tur', t.tur)}</div>
        ${when(!t.tur, () => html`<p class="tiny dim mt-8">${t.canli ? 'Hangi hareket olduğunu seç.'
          : 'Dosyada tür yazmıyor' + (t.turYazi ? ' («' + t.turYazi + '» tanınmadı)' : '')
            + '; hangisi olduğunu seç.'}</p>`)}
        ${when(r.atlanan, () => html`<p class="tiny dim mt-8">${r.atlanan} bozuk GPS noktası atlandı.</p>`)}
        ${when(r.zayif, () => html`<p class="tiny dim mt-8">${r.zayif} zayıf konum
          (±${SP.Canli.DOGRULUK_M} m'den kötü) ize alınmadı.</p>`)}
        ${when(r.bosluk, () => html`<p class="tiny dim mt-8">${sureKisa(r.bosluk)} boyunca konum gelmedi
          (ekran kapalı olabilir); o aralık iki uç arasında düz çizgi sayıldı.</p>`)}`),
      footer:String(html`${K.Button({ label:t.canli ? 'Sonra' : 'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'rota-kaydet', disabled:!t.tur })}`),
      noFocus:true,
    });
  }

  /* ---------------------------------------------------------- dinlenme

     Dinlenme sayfası yeni bir kural icat etmez; var olan kuralların
     dinlenmeye bakan yüzünü tek yerde toplar: toparlanma bandı, indirme
     haftası, son hafta / son ay oranı, uyku ve boş gün sayısı. */
  function restView(){
    const r = SP.Move.readiness();
    const rx = SP.Move.prescription();
    const dl = SP.Move.deloadWeek();
    const a = SP.Move.acwr();
    const days = U.lastDays(7);
    const off = days.filter(d => !M.workoutsOf(d).length).length;
    const sleepVals = days.map(d => (S.vitals[d] || {}).sleep).filter(v => v != null);
    const avgSleep = sleepVals.length ? U.round(U.sum(sleepVals) / sleepVals.length, 1) : null;

    return K.Ledger([
      K.Entry({
        label:'Bugün dinlenmeli misin?', hint:'recovery-order',
        meta:rx.kind === 'rest' ? 'evet' : rx.kind === 'full' ? 'hayır' : 'hafiflet',
        action:when(!r.ok, () => K.Button({ label:'Veri gir',
          act:'go', data:{ 'data-route':'today' } })),
        body:html`
          ${when(r.ok, () => html`<div class="row wrap" style="gap:26px">
            ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:122,
              bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
            <p class="grow small" style="min-width:210px">${r.band.order}</p>
          </div>`)}
          ${when(!r.ok, () => K.Notice({ tone:'info', body:r.note }))}
          ${when(rx.kind === 'rest', () => K.Notice({ tone:'info',
            body:'Tam dinlenme günü de boş değildir: asgari gün geçerli — '
              + SP.LOAD_RULES.minDay.minutes + ' dakika yürüyüş ve bir mobilite akışı.' }))}`,
      }),

      K.Entry({
        label:'İndirme haftası', hint:'deload',
        meta:!dl.started ? 'başlamadı' : dl.due ? 'bu hafta' : dl.inCycle + '/' + dl.every,
        body:html`<p class="small">${dl.note}</p>`,
      }),

      K.Entry({
        label:'Son yedi gün', hint:'load', meta:off + ' boş gün',
        body:html`${K.Ayrinti({ govde:html`<p>Üst üste boş geçen günler kondisyonu düşürür;
          hiç boş geçmeyen haftalar son haftayı son aya göre şişirir. İkisi de aynı ölçüde
          izlenir.</p>` })}
          <div class="cols-3">
          ${K.Stat({ label:'Boş gün', value:String(off), unit:'/ 7',
            note:off === 0 ? 'hiç boş gün yok' : off >= 5 ? 'çok az seans' : 'dengeli' })}
          ${K.Stat({ label:'Ortalama uyku',
            value:avgSleep == null ? '—' : U.fmtNum(avgSleep), unit:'saat',
            note:avgSleep == null ? 'girilmedi' : sleepVals.length + ' gün girildi' })}
          ${K.Stat({ label:'Son hafta / son ay', value:a.ok ? U.fmtNet(a.ratio) : '—',
            tone:a.ok ? (a.zone === 'ok' ? 'ok' : a.zone === 'high' ? 'danger' : 'warn') : null,
            note:a.ok ? (a.zone === 'ok' ? 'normal' : a.zone === 'high' ? 'ağır' : 'hafif')
              : 'veri yetersiz' })}
        </div>`,
      }),
    ]);
  }

  /* ------------------------------------------------------------ ilerleme */

  function loadBody(){
    const series = SP.Move.loadSeries(30);
    const a = SP.Move.acwr();
    const g = SP.Move.weeklyGrowth();
    const dl = SP.Move.deloadWeek();
    const top = Math.max(100, Math.max.apply(null, series.map(s2 => s2.value)) * 1.1);

    return html`
      ${raw(UI.barChart(series.map(s2 => ({ label:U.fmtShort(s2.date), value:s2.value })),
        { max:top, height:170, goodAt:0 }))}
      <div class="cols-3">
        ${K.Stat({ label:'Bu hafta', value:U.fmtNum(SP.Move.loadWindow(7)), unit:'yük' })}
        ${K.Stat({ label:'Son hafta / son ay', value:a.ok ? U.fmtNet(a.ratio) : '—',
          tone:a.ok ? (a.zone === 'ok' ? 'ok' : a.zone === 'high' ? 'danger' : 'warn') : null,
          note:a.ok ? (a.zone === 'ok' ? 'normal' : a.zone === 'high' ? 'ağır' : 'hafif')
            : 'veri yetersiz' })}
        ${K.Stat({ label:'Döngü haftası', value:dl.started ? String(dl.week) : '—',
          note:!dl.started ? 'başlamadı' : dl.due ? 'indirme haftası' : dl.inCycle + '/' + dl.every })}
      </div>
      ${K.Notice({ tone:a.ok ? a.tone : 'info', body:a.note })}
      ${when(g.ok, () => K.Notice({ tone:g.over ? 'warn' : 'info',
        body:'Geçen haftaya göre değişim %' + Math.round(g.growth * 100) + '. ' + g.note }))}
      ${when(dl.due, () => K.Notice({ tone:'warn', body:dl.note }))}`;
  }

  let bodyPhotoFile = null;
  let lastBodyAnalysis = null;

  function bodyPhotoSheet(){
    UI.sheet({
      title:'Fotoğraftan beden ve duruş analizi',
      subtitle:'Boydan fotoğraf ile BKİ, duruş (postür) ve tahmini kompozisyon',
      wide:true,
      body:String(K.Stack([
        when(!SP.Extract.modelReady(), () => K.Notice({ tone:'warn',
          title:'Model bağlı değil.',
          body:'Fotoğraftan analiz için HKM › Modeller’de «SPİ · Görsel» (ya da King) için '
            + 'görüntü okuyan bir model ata.' })),
        K.Drop({ act:'body-photo-file', label:'Boydan vücut fotoğrafı', icon:'camera',
          accept:'image/*', hint:'Fotoğrafı buraya bırak ya da seçmek için tıkla' }),
        html`<div id="body-photo-name" class="small dim">${bodyPhotoFile ? bodyPhotoFile.name : ''}</div>`,
        html`<div class="cols-2">
          ${K.Field({ label:'Boyun (cm)', hint:'isteğe bağlı',
            input:K.Input({ id:'bp-height', type:'number', placeholder:'178', value:S.profile && S.profile.height ? S.profile.height : '' }) })}
          ${K.Field({ label:'Kilon (kg)', hint:'isteğe bağlı',
            input:K.Input({ id:'bp-weight', type:'number', placeholder:'74', value:S.profile && S.profile.weight ? S.profile.weight : '' }) })}
        </div>`,
        K.Field({ label:'Ek not / odaklanılacak alan', hint:'örn: omuz düşüklüğü, boyun duruşu vb.',
          input:K.Input({ id:'bp-note', placeholder:'Öne doğru hafif kambur duruş hissediyorum…' }) }),
        K.Notice({ tone:'info', body:'Bu analiz tıbbi bir teşhis değildir; fotoğraftan çıkarılan değerler '
          + 'her zaman «tahmin» olarak etiketlenir.' }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Analiz et', tone:'primary', act:'run-body-photo',
          disabled:!bodyPhotoFile || !SP.Extract.modelReady() })}`),
      noFocus:true,
    });
  }

  function bodyPhotoResultSheet(res){
    lastBodyAnalysis = res;
    const bk = res.biyometrikKompozisyon || res.kompozisyon || {};
    const ps = res.posturSegmentasyonu || (typeof res.postur === 'object' ? res.postur : {}) || {};
    const dh = res.duzelticiHareketRecetesi || res.duzelticiHareket || {};
    const bh = res.beslenmeHidrasyonKoprusu || res.beslenme || {};
    const tg = res.tibbiGuvenlikKalkani || res.guvenlik || {};

    const egzersizList = Array.isArray(dh.egzersizler) && dh.egzersizler.length ? dh.egzersizler
      : [dh.esneme2dk, dh.guclendirme].filter(Boolean);

    UI.sheet({
      title:'Beden ve duruş analizi (5 bölüt)',
      subtitle:'Fotoğraftan tahmini biyometri ve düzeltici hareket reçetesi',
      wide:true,
      body:String(K.Stack([
        /* 1. Bölüt: Biyometrik Kompozisyon */
        html`<div class="ogrenme">
          <div class="row between items-center mb-6">
            <b class="small" style="color:var(--text)">1. Biyometrik Kompozisyon</b>
            <span class="badge badge--info">cert: estimated · photo</span>
          </div>
          <div class="cols-2 mb-8">
            <div class="ogrenme__kutu">
              <span class="tiny dim" style="display:block">Tahmini BKİ</span>
              <div class="h2" style="margin:2px 0">${bk.bki != null ? bk.bki : (res.bki != null ? res.bki : '—')} <small class="small">${bk.kategori || res.kategori || ''}</small></div>
              <span class="tiny dim">Beden Tipi: <b>${bk.bedenTipi || res.bedenTipi || 'Dengeli'}</b></span>
            </div>
            <div class="ogrenme__kutu">
              <span class="tiny dim" style="display:block">Tahmini Yağ Oranı Aralığı</span>
              <div class="h2" style="margin:2px 0">${bk.yagAralik || res.yagAralik || '—'}</div>
              ${when(bk.belKalca, () => html`<span class="tiny dim">Bel/Kalça: <b>${bk.belKalca}</b></span>`)}
            </div>
          </div>
          <div class="row justify-end">
            <button type="button" class="btn btn--xs btn--ghost" data-act="save-body-vitals">
              Bu ölçümleri bugünün günlüğüne yaz
            </button>
          </div>
        </div>`,

        /* 2. Bölüt: Postür Segmentasyonu */
        html`<div class="ogrenme">
          <div class="row between items-center mb-6">
            <b class="small" style="color:var(--text)">2. Postür Segmentasyonu</b>
            <span class="badge badge--muted">bölgesel analiz</span>
          </div>
          <div class="stack-xs small">
            ${when(ps.basBoyun, () => html`<div><span class="tiny dim" style="display:block">BAŞ & BOYUN</span>${U.esc(ps.basBoyun)}</div>`)}
            ${when(ps.omuzSimetri, () => html`<div><span class="tiny dim" style="display:block">OMUZ SİMETRİSİ</span>${U.esc(ps.omuzSimetri)}</div>`)}
            ${when(ps.omurga, () => html`<div><span class="tiny dim" style="display:block">OMURGA HATTI</span>${U.esc(ps.omurga)}</div>`)}
            ${when(ps.pelvis, () => html`<div><span class="tiny dim" style="display:block">PELVİS HİZASI</span>${U.esc(ps.pelvis)}</div>`)}
            ${when(typeof res.postur === 'string' && !ps.basBoyun, () => html`<div>${U.esc(res.postur)}</div>`)}
          </div>
        </div>`,

        /* 3. Bölüt: Düzeltici Hareket Reçetesi */
        html`<div class="ogrenme">
          <div class="row between items-center mb-6">
            <b class="small" style="color:var(--text)">3. Düzeltici Hareket Reçetesi</b>
            <span class="badge badge--ok">mobilite & güç</span>
          </div>
          <div class="stack-xs small mb-8">
            ${when(dh.esneme2dk, () => html`<div><b>2 Dk Esneme:</b> <span class="dim">${U.esc(dh.esneme2dk)}</span></div>`)}
            ${when(dh.guclendirme, () => html`<div><b>Güçlendirme:</b> <span class="dim">${U.esc(dh.guclendirme)}</span></div>`)}
            ${when(dh.adimHedefi, () => html`<div><b>Günlük Mola:</b> <span class="dim">${U.esc(dh.adimHedefi)}</span></div>`)}
          </div>
          ${when(egzersizList && egzersizList.length, () => html`
            <div class="row wrap gap-4 mb-8">
              ${map(egzersizList, eg => html`<span class="badge badge--muted">${U.esc(eg)}</span>`)}
            </div>`)}
          <div class="row justify-end">
            <button type="button" class="btn btn--xs btn--primary" data-act="save-corrective-session">
              Düzeltici rutini seanslara ekle (15 dk)
            </button>
          </div>
        </div>`,

        /* 4. Bölüt: Beslenme & Hidrasyon Köprüsü */
        html`<div class="ogrenme">
          <div class="row between items-center mb-6">
            <b class="small" style="color:var(--text)">4. Beslenme & Hidrasyon Köprüsü</b>
            <span class="badge badge--muted">doku onarımı</span>
          </div>
          <div class="row wrap gap-8 mb-6">
            ${when(bh.proteinAralik, () => html`<span class="badge badge--info">Protein: ${U.esc(bh.proteinAralik)}</span>`)}
            ${when(bh.suHedefi, () => html`<span class="badge badge--info">Su: ${U.esc(bh.suHedefi)}</span>`)}
          </div>
          ${when(bh.oneri, () => html`<p class="small dim mb-0">${U.esc(bh.oneri)}</p>`)}
        </div>`,

        /* 5. Bölüt: Tıbbi Güvenlik Kalkanı */
        K.Notice({
          tone:'warn',
          title:'5. Tıbbi güvenlik uyarısı (tahmin · fotoğraftan)',
          body: tg.uyari || 'Bu analiz tıbbi bir teşhis değildir; fotoğraftan çıkarılan değerler tahmindir. Tanı ve tedavi için hekiminize danışınız.'
        }),
      ])),
      footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
        ${when(bodyPhotoFile, () => K.Button({ label:'Fotoğrafı bugüne kaydet', tone:'primary', act:'save-body-photo-today' }))}`),
      noFocus:true,
    });
  }

  /* Vücut fotoğrafları: kendini zaman içinde görmek için tek satır minik
     kare; ilki bugünündür. Fotoğraftan SAYI ÜRETİLMEZ — kilo, yağ oranı,
     endeks ölçülür, fotoğraftan tahmin edilmez (AGENTS §1.1). */
  /* VÜCUT ANALİZİ (core/vucut.js, KISI-PLANI Faz 6): son ölçülerden BKİ,
     bel/boy, yağ oranı (ölçülen ya da Donanma yöntemi), yağsız kütle, kilo
     eğilimi ve kaba enerji tahmini. Eksik ölçü sıfır sayılmaz: satır yazılmaz,
     neyin eksik olduğu söylenir. Boyun ve kalça burada girilir. */
  function vucutVerisi(){
    const son = {}, kilolar = [];
    let kcal = 0, ogunGun = 0;
    for(let i = 59; i >= 0; i--){
      const d = U.iso(U.addDays(U.today(), -i));
      const v = SP.S.vitals[d] || {};
      ['weight', 'waist', 'bodyfat', 'neck', 'hip'].forEach(k => { if(v[k] != null && v[k] !== '') son[k] = Number(v[k]); });
      if(i < 28 && v.weight != null) kilolar.push({ tarih:d, kg:Number(v.weight) });
      if(i < 28){ const t = SP.Nutri.dayTotals(d); if(!t.empty){ kcal += t.kcal; ogunGun++; } }
    }
    return { profil:S.profile || {}, son, kilolar, ortKcal:ogunGun ? kcal / ogunGun : null, ogunGun };
  }
  function vucutAnalizKutusu(){
    if(!SP.Vucut) return '';
    const a = SP.Vucut.analiz(vucutVerisi());
    const satir = (ad, deger, cert, not) => html`<div class="listitem"><div class="grow"><b class="small">${ad}</b>
      ${when(not, () => html`<div class="tiny dim">${not}</div>`)}</div>
      <span class="num small">${deger}</span>${P.cert(cert)}</div>`;
    const kadin = (S.profile || {}).sex === 'female';
    const vg = x => String(x).replace('.', ',');
    return K.Entry({
      wide:true, label:'Vücut analizi', hint:'vucut-analizi', meta:a.eksik.length ? a.eksik.length + ' ölçü eksik' : 'güncel',
      body:html`<div class="list">
        ${when(a.bki, () => satir('Beden kitle indeksi', vg(a.bki.deger) + ' · ' + a.bki.bant, 'derived', a.bki.not))}
        ${when(a.belBoy, () => satir('Bel / boy oranı', String(a.belBoy.deger).replace('.', ','), 'derived', a.belBoy.not))}
        ${when(a.yag, () => satir('Yağ oranı', '%' + String(a.yag.deger).replace('.', ','), a.yag.etiket === 'ölçüldü' ? 'measured' : 'estimated',
          a.yag.yontem + (a.yag.not ? ' · ' + a.yag.not : '')))}
        ${when(a.yagsiz, () => satir('Yağsız kütle', vg(a.yagsiz.kutle) + ' kg · FFMI ' + vg(a.yagsiz.ffmiDuz), a.yag && a.yag.etiket === 'ölçüldü' ? 'derived' : 'estimated',
          'Yağ kütlesi ' + vg(a.yagsiz.yagKg) + ' kg; FFMI boya göre düzeltilmiş.'))}
        ${a.egilim.ok
          ? satir('Kilo eğilimi', (a.egilim.haftalik > 0 ? '+' : '') + String(a.egilim.haftalik).replace('.', ',') + ' kg/hafta · ' + a.egilim.yon, 'derived',
              'Son 7 tartının ortalaması ' + vg(a.egilim.ortalama7) + ' kg; günlük oynama ayıklandı (' + a.egilim.tarti + ' tartı).')
          : satir('Kilo eğilimi', '—', 'missing', a.egilim.why)}
        ${when(a.enerji, () => satir('Günlük harcama (kaba)', a.enerji.harcama + ' kcal', 'estimated', a.enerji.not))}
      </div>
      ${when(a.eksik.length, () => html`<p class="tiny dim mt-8">Eksik: ${a.eksik.join(', ')}. Eksik ölçü sıfır sayılmaz; o satır yazılmaz.</p>`)}
      <div class="cols-3 mt-8">
        ${K.Input({ id:'vucut-bel', size:'sm', numeric:true, type:'number', step:'0.5', placeholder:'Bel (cm)', aria:'Bel çevresi (cm)' })}
        ${K.Input({ id:'vucut-boyun', size:'sm', numeric:true, type:'number', step:'0.5', placeholder:'Boyun (cm)', aria:'Boyun çevresi (cm)' })}
        ${when(kadin, () => K.Input({ id:'vucut-kalca', size:'sm', numeric:true, type:'number', step:'0.5', placeholder:'Kalça (cm)', aria:'Kalça çevresi (cm)' }))}
      </div>
      <div class="row mt-8">${K.Button({ label:'Ölçüleri kaydet', size:'sm', act:'vucut-olcu-kaydet' })}</div>`,
    });
  }

  function vucutKutusu(){
    if(!SP.Foto.var()) return '';
    const bugun = U.todayISO();
    const gunler = SP.Foto.sahipler('vucut:').map(s => s.slice(6)).filter(g => g !== bugun);
    const kare = g => raw(String(SP.FotoUI.kutu({ sahip:'vucut:' + g, ad:'Vücut · ' + U.fmtShort(g), yon:'user' })));
    return K.Entry({
      label:'Vücut', hint:'vucut-foto', meta:gunler.length ? (gunler.length + 1) + ' gün' : null,
      body:html`<div class="foto-serit">
        <span class="foto-serit__ge">${kare(bugun)}<span class="tiny dim">Bugün</span></span>
        ${map(gunler.slice(0, 12), g => html`<span class="foto-serit__ge">${kare(g)}<span class="tiny dim">${U.fmtShort(g)}</span></span>`)}
      </div>
      <div class="row mt-8">
        ${K.Button({ label:'Fotoğraftan beden ve duruş analizi', icon:'camera', size:'sm', act:'body-photo-open' })}
      </div>`,
    });
  }

  function historyBody(){
    const rows = S.workouts.slice(-20).reverse();
    if(!rows.length) return P.empty('Henüz seans kaydı yok.');
    return K.Table({ tight:true,
      headers:['Tarih', 'Seans', { label:'Dakika', num:true }, { label:'Yük', num:true }],
      rows:rows.map(w => [U.fmtShort(w.date), w.name, String(w.minutes),
        String(SP.Move.sessionLoad(w))]) });
  }

  /* -------------------------------------------------------------- sheet'ler */

  /* Düzenlenen seans kaydedilene kadar burada bekler. */
  let draft = null;

  function sessionSheet(rec){
    const isNew = !S.workouts.some(w => w.id === rec.id);
    const chosen = (rec.items || []).map(i => i.exId);
    UI.sheet({
      title:isNew ? 'Seans ekle' : 'Seansı düzenle', subtitle:rec.name, wide:true,
      body:String(K.Stack([
        html`<div class="cols-2">
          ${K.Field({ label:'Süre (dakika)',
            input:K.Input({ id:'w-min', type:'number', numeric:true, min:1, step:'5', value:rec.minutes }) })}
          ${K.Field({ label:'Algılanan zorluk (1–10)', hint:'boş bırakılırsa MET değerinden hesaplanır',
            input:K.Input({ id:'w-rpe', type:'number', numeric:true, min:1, max:10, step:'1',
              value:rec.rpe == null ? '' : rec.rpe }) })}
        </div>`,
        html`<h3 class="section-h">Hareketler
          <span class="tiny dim">· ${chosen.length} seçili</span></h3>`,
        /* Uzun bir onay listesi yerine seçilebilir kartlar. Kalıp her kartın
           kendi satırında yazar: kalıba göre ayrı ayrı bölmek on bir hareket
           için gereksiz yere uzun bir kağıt üretiyordu. */
        html`<div class="picks">${map(SP.EXERCISES, ex => {
          const lvl = SP.EX_BY_ID[ex.id].levels.find(l => l.id === M.currentLevel(ex.id));
          const pattern = SP.PATTERNS.find(x => x.id === ex.pattern);
          const group = pattern ? pattern.label
            : ex.kind === 'cardio' ? 'Dayanıklılık' : 'Mobilite';
          return K.PickCard({
            label:ex.name,
            meta:group + ' · ' + (lvl ? lvl.name : '') + ' · hedef ' + (lvl ? lvl.to : '—'),
            on:chosen.indexOf(ex.id) >= 0,
            act:'toggle-ex', data:{ 'data-id':rec.id, 'data-ex':ex.id },
          });
        })}</div>`,
        K.Field({ label:'Not', input:K.Textarea({ id:'w-note', rows:2, value:rec.note || '' }) }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-session', data:{ 'data-id':rec.id } })}`),
      noFocus:true,
    });
  }

  function exerciseDetailSheet(id){
    const ex = SP.EX_BY_ID[id];
    if(!ex) return;
    const card = (SP.EXERCISE_CARD_BY_ID || {})[id] || {};
    const muscles = (ex.muscles && ex.muscles.length) ? ex.muscles.join(', ') : 'Tüm vücut';
    const steps = (ex.steps && ex.steps.length) ? ex.steps : (card.steps_tr || []);
    const setup = ex.setup || card.setup_check || '';
    const summary = ex.cue || card.summary || '';

    UI.sheet({
      title: ex.name,
      subtitle: (ex.name_en ? ex.name_en + ' · ' : '') + (ex.equip || 'Ekipmansız'),
      wide: true,
      body: String(K.Stack([
        html`<div class="row wrap gap-6 mb-8">
          <span class="badge badge--info">${ex.pattern ? ('Kalıp: ' + ex.pattern) : (ex.kind === 'cardio' ? 'Kardiyo' : 'Mobilite')}</span>
          <span class="badge badge--muted">Hedef kaslar: ${U.esc(muscles)}</span>
          ${when(ex.met, () => html`<span class="badge badge--muted">MET: ${ex.met}</span>`)}
        </div>`,
        when(summary, () => html`<p class="small mb-12"><b>Özet:</b> ${U.esc(summary)}</p>`),
        when(steps && steps.length, () => html`
          <div class="mb-12">
            <h4 class="small mb-4">Uygulama Adımları</h4>
            <ol class="small dim pl-16 mb-0" style="line-height:1.5">
              ${map(steps, s => html`<li>${U.esc(s)}</li>`)}
            </ol>
          </div>`),
        when(setup, () => html`
          <div class="ogrenme">
            <b class="tiny dim" style="display:block;margin-bottom:2px">KURULUM VE GÜVENLİK KONTROLÜ</b>
            <p class="small mb-0">${U.esc(setup)}</p>
          </div>`),
      ])),
      footer: String(html`
        ${K.Button({ label:'Kapat', act:'sheet-close' })}
        ${K.Button({ label:'Bu hareketle seans başlat', tone:'primary', act:'quick-add-session-ex', data:{ 'data-id':ex.id } })}
      `),
      noFocus: true,
    });
  }

  function programsSheet(){
    const list = SP.PROGRAMLAR || [];
    UI.sheet({
      title: 'Eğitim Programları',
      subtitle: list.length + ' hazır hedef ve takip şablonu',
      wide: true,
      body: String(html`
        <div class="stack-sm">
          ${map(list, prog => html`
            <div class="ogrenme">
              <div class="row between gap-8 mb-4">
                <b class="small" style="color:var(--text)">${U.esc(prog.title)}</b>
                <span class="tiny dim">${prog.focus || 'Genel kondisyon'}</span>
              </div>
              <p class="small dim mb-8" style="line-height:1.4">${U.esc(prog.description || '')}</p>
              ${when(prog.exercises && prog.exercises.length, () => html`
                <div class="row wrap gap-4 mb-8">
                  ${map(prog.exercises, exId => {
                    const e = SP.EX_BY_ID[exId] || (SP.EXERCISE_CARD_BY_ID || {})[exId];
                    return html`<span class="badge badge--muted">${e ? e.name_tr || e.name : exId}</span>`;
                  })}
                </div>`)}
              <div class="row justify-end">
                <button type="button" class="btn btn--xs btn--primary" data-act="load-program-session" data-id="${prog.id}">
                  Bu programla seans başlat
                </button>
              </div>
            </div>`)}
        </div>
      `),
      footer: String(K.Button({ label:'Kapat', act:'sheet-close' })),
      noFocus: true,
    });
  }

  let metQ = '', metMin = 30, metCat = 'all';
  function metCalcSheet(){
    const weight = (S.profile && S.profile.weightKg) ? Number(S.profile.weightKg) : 70;
    let list = SP.MET_REFS || [];
    if(metCat !== 'all') list = list.filter(r => r.category === metCat);
    if(metQ.trim()){
      const n = U.norm(metQ.trim());
      list = list.filter(r => U.norm(r.description + ' ' + (r.category || '')).indexOf(n) >= 0);
    }
    const cats = [{ id:'all', label:'Tümü' }].concat(Object.keys(SP.MET_CATS || {}).map(k => ({ id:k, label:SP.MET_CATS[k] })));

    UI.sheet({
      title: 'MET ile aktivite ve kalori hesabı',
      subtitle: '2024 Adult Compendium · 1.111 fiziksel aktivite',
      wide: true,
      body: String(K.Stack([
        html`<div class="cols-2">
          ${K.Field({ label:'Aktivite ara',
            input:K.Input({ id:'met-search-input', value:metQ, placeholder:'örn: bisiklet, yüzme, bahçe, koşu…',
              change:'met-search-change' }) })}
          ${K.Field({ label:'Süre (dakika)',
            input:K.Input({ id:'met-min-input', type:'number', min:5, step:5, value:String(metMin),
              change:'met-min-change' }) })}
        </div>`,
        html`<div class="row wrap gap-4 mb-8">
          ${map(cats.slice(0, 8), c => K.Chip({ label:c.label, act:'met-pick-cat', on:c.id === metCat,
            data:{ 'data-cat':c.id } }))}
        </div>`,
        html`<div class="stack-xs" style="max-height:280px;overflow-y:auto">
          ${map(list.slice(0, 15), r => {
            const kcal = Math.round(r.met * weight * (metMin / 60));
            return html`
              <div class="row between gap-8 ogrenme__kutu">
                <div class="minw0 grow">
                  <b class="small" style="display:block">${U.esc(r.description)}</b>
                  <span class="tiny dim">${(SP.MET_CATS || {})[r.category] || r.category} · MET ${r.met}</span>
                </div>
                <div class="row items-center gap-8">
                  <span class="num small" style="color:var(--accent);font-weight:600">${kcal} kcal</span>
                  <button type="button" class="btn btn--xs btn--ghost" data-act="add-met-workout"
                    data-desc="${U.esc(r.description)}" data-met="${r.met}" data-min="${metMin}">
                    Seansa ekle
                  </button>
                </div>
              </div>`;
          })}
          ${when(!list.length, () => html`<p class="small dim">Eşleşen aktivite bulunamadı.</p>`)}
        </div>`,
      ])),
      footer: String(K.Button({ label:'Kapat', act:'sheet-close' })),
      noFocus: true,
    });
  }

  /* ---------- D · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const vkutu = (ad, yuva, ic) => ic ? K.Kutu({ ad, yuva, class:'vkutu', govde:raw(ic) }) : '';
  const GUN_AD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  function haftaGunleri(){
    const b = U.today(), i = (b.getDay() + 6) % 7;
    return Array.from({ length:7 }, (_, k) => U.iso(U.addDays(b, k - i)));
  }
  const exAd = id => { const e = (SP.EXERCISES || []).find(x => x.id === id); return e ? e.name : id; };

  /* 075 SET KUTUCUKLARI: bugünün son seansının hareketleri; biten set
     dolar (dokunuş = bir set bitti, dolu kutuya dokunmak geri alır). */
  function setKutusu(){
    if(!VT()) return '';
    const w = M.workoutsOf(U.todayISO()).slice(-1)[0];
    if(!w || !(w.items || []).length) return '';
    return vkutu('Setler · ' + w.name, 'ölçüldü', VT().setKutucuklari({ act:'set-bitti', data:{ 'data-w':w.id },
      hareketler:w.items.map((it, i) => ({ i, ad:exAd(it.exId), set:Number(it.sets) || 0, biten:Number(it.setsDone) || 0,
        etiket:it.reps ? String(it.reps) : it.minutes ? it.minutes + 'dk' : null })) }));
  }

  /* 076 HAFTALIK HAREKET HALKALARI: günün hareket dakikası ÷ asgari gün
     dakikası. O gün hiçbir kaydı olmayan geçmiş gün «veri yok». */
  function halkaKutusu(){
    if(!VT()) return '';
    const bugun = U.todayISO(), esik = SP.LOAD_RULES.minDay.minutes;
    const gunler = haftaGunleri().map((d, k) => {
      const dk = U.sum(M.workoutsOf(d).map(w => w.minutes || 0));
      const kayit = M.workoutsOf(d).length || S.vitals[d] || M.mealsOf(d).length;
      return { ad:GUN_AD[k], bugun:d === bugun, gelecek:d > bugun, yok:d < bugun && !kayit, p:esik ? 100 * dk / esik : null };
    });
    return vkutu('Bu hafta hareket', 'asgari gün ' + esik + ' dk', VT().haftaHalkalari({ gunler }));
  }

  /* 086 ANTRENMAN HAFTASI: yapılan seans dolu; kaydı olmayan geçmiş gün
     «kayıt yok» (dinlenme sayılmaz); plan tutulmadığı için gelecek boş. */
  function haftaKutusu(){
    if(!VT()) return '';
    const bugun = U.todayISO();
    return vkutu('Antrenman haftası', 'ölçüldü', VT().antrenmanHaftasi({ gunler:haftaGunleri().map((d, k) => {
      const w = M.workoutsOf(d);
      return { ad:GUN_AD[k], bugun:d === bugun, gecti:d < bugun, yapilan:w.length ? w.map(x => x.name).join(' + ') : null };
    }) }));
  }

  /* iPhone Faz 2b (2026-10-02): günün yük emri ve haftanın hareketi tek
     küçük dönen kartta. Skor ve emir kural motorundan (Move.prescription);
     ölçüm yoksa sayı değil cümle. Kırmızı ya da sarı gerekçe (ateş, aşırı
     yük, indirme haftası) emrin altında söylenir: kart küçüldü diye uyarı
     susmaz. Emrin tamamı «Günün yük emri» şeridinde; haftanın halkaları ve
     antrenman haftası gizli bölümde (app.js SADE_GIZLI). */
  function DonenHareket(){
    const V = VT();
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    const ek = rx.reasons.filter(x => x.id !== 'readiness' && x.id !== 'no-data');
    const onemli = ek.find(x => x.kind === 'danger') || ek.find(x => x.kind === 'warn');
    const yuk = rx.factor === 0 ? 'dinlenme' : rx.factor >= 1 ? 'tam yük' : 'yükün %' + Math.round(rx.factor * 100) + '’i';
    const m = [r.ok
      ? { ust:'Günün yük emri', sayi:sayi({ deger:r.score, birim:'/100', kesinlik:'computed', zaman:rx.date,
            formul:'toparlanma: girilen ölçümlerin ağırlıklı ortalaması',
            girdiler:r.parts.filter(p => p.score != null).map(p => ({ ad:p.label, deger:p.value, kesinlik:'measured' })) }),
          cumle:r.band.label.toLocaleLowerCase('tr-TR') + ' · ' + yuk + '.', vurgu:onemli ? onemli.short : r.band.order, sistem:'spi' }
      : { ust:'Günün yük emri', cumle:'Ölçüm bekliyor.', vurgu:onemli ? onemli.short : 'Uyku süresini yazman bile yeter.', sistem:'spi',
          dugme:{ label:'Veri gir', act:'go', data:{ 'data-route':'today' } } }];
    const bugun = U.todayISO(), esik = SP.LOAD_RULES.minDay.minutes;
    const gunler = haftaGunleri();
    const tutan = gunler.filter(d => U.sum(M.workoutsOf(d).map(w => w.minutes || 0)) >= esik).length;
    const kayitsiz = gunler.filter(d => d < bugun && !(M.workoutsOf(d).length || S.vitals[d] || M.mealsOf(d).length)).length;
    const seans = gunler.reduce((n, d) => n + M.workoutsOf(d).length, 0);
    m.push({ ust:'Bu hafta', sayi:sayi({ deger:tutan + '/7', kesinlik:'computed', zaman:bugun,
        formul:'en az ' + esik + ' dk hareket edilen gün / 7',
        girdiler:[{ ad:'Seans kaydı', deger:seans, birim:'seans', kesinlik:'measured' }] }),
      cumle:'gün hareket.', vurgu:'Asgari gün ' + esik + ' dk.' + (kayitsiz ? ' ' + kayitsiz + ' geçmiş gün kayıtsız.' : ''), sistem:'spi' });
    return raw(V.donen({ id:'spi-hareket', ad:'Hareket', maddeler:m }));
  }

  /* 081 YOĞUNLUK BÖLGELERİ: son 28 günün seans dakikası, SENİN yazdığın
     zorluğa (1–10) göre dört bantta. Nabız ölçülmediği için bant nabız
     değil zorluk bandıdır; eşikleri kod koyar. Zorluğu yazılmamış seans
     banda girmez, altta ayrıca sayılır — «hafif» sayılmaz. */
  const BANT = [{ ad:'Hafif · 1–3', en:3 }, { ad:'Orta · 4–6', en:6 }, { ad:'Zor · 7–8', en:8 }, { ad:'En zor · 9–10', en:10 }];
  function yogunlukBantlari(gun, bitis){
    const son = bitis || U.todayISO();
    const bas = U.iso(U.addDays(U.parse(son), -(gun || 28) + 1));
    const dk = BANT.map(() => 0);
    let zorluksuz = 0;
    (S.workouts || []).filter(w => w.date >= bas && w.date <= son).forEach(w => {
      const m = Number(w.minutes) || 0;
      if(!(m > 0)) return;
      const r = Number(w.rpe);
      if(!(r >= 1 && r <= 10)){ zorluksuz++; return; }
      dk[BANT.findIndex(b => r <= b.en)] += m;
    });
    return { bantlar:BANT.map((b, i) => ({ ad:b.ad, dk:dk[i] })), zorluksuz, toplam:dk.reduce((a, x) => a + x, 0) };
  }
  function yogunlukKutusu(){
    if(!VT()) return '';
    const y = yogunlukBantlari(28);
    if(!y.toplam) return '';
    return vkutu('Yoğunluk · son 28 gün', 'senin zorluk beyanın', VT().yogunlukBolgeleri({ bolgeler:y.bantlar })
      + (y.zorluksuz ? '<p class="tiny dim mt-6">' + y.zorluksuz + ' seansın zorluğu yazılmadı; banda girmedi.</p>' : ''));
  }

  /* --------------------------------------------------------------- ekran */

  /* Sekme yok (EKIP-PLANI §1.2): Bugün, dört alan ve İlerleme alt alta;
     bölüm çubuğu kaydırır, bugünkü seans sayısı çubukta rozet. «Kalıp
     dengesi» eskiden üç sekmede ayrı ayrı çiziliyordu; alt alta durunca
     aynı kart üç kez görünürdü — yalnız Kuvvet'te, kalıpların yanında. */
  const BODIES = {
    bugun:() => html`${K.Ledger([DonenHareket(), hazirAntrenmanEntry(), pickSessionEntry(), todaySessionsEntry(), setKutusu(), orderEntry(), halkaKutusu(), haftaKutusu()])}
      <div class="mt-24">${raw(UI.rail(['recovery-order', 'readiness', 'load', 'progression']))}</div>`,
    ilerleme:() => html`${K.Ledger([
        vucutAnalizKutusu(),
        vucutKutusu(),
        K.Entry({ wide:true, label:'Yük eğrisi', hint:'load', meta:'son 30 gün',
          body:loadBody() }),
        yogunlukKutusu(),
        K.Entry({ label:'Seans geçmişi', meta:S.workouts.length + ' kayıt',
          body:historyBody() }),
      ])}
      <div class="mt-24">${raw(UI.rail(['load', 'deload', 'recovery-order']))}</div>`,
  };

  function govde(t){
    try{
      if(BODIES[t.id]) return BODIES[t.id]();
      return html`${t.id === 'dinlenme' ? restView() : areaView(t.id)}
        <div class="mt-24">${raw(UI.rail(t.id === 'dinlenme'
          ? ['recovery-order', 'deload', 'load']
          : ['progression', 'load', 'deload']))}</div>`;
    }catch(e){
      console.error('Hareket bölümü çizilemedi (' + t.id + '):', e);
      return K.Notice({ tone:'warn', body:'Bu bölüm şu an çizilemedi; verin yerinde duruyor.' });
    }
  }

  async function render(){
    const done = M.workoutsOf(U.todayISO()).length;
    return String(K.SayfaBolumleri({ act:'move-tab', aria:'Hareket bölümleri',
      bolumler:TABS.map(t => ({ id:t.id, ad:t.label, govde:govde(t),
        sayi:t.id === 'bugun' && done ? done : null })) }));
  }

  /* Başka yerden istenen bölüm çizimden sonra görünür yapılır; istek bir
     kez kullanılır. */
  function afterRender(){
    const t = S.ui.moveTab;
    S.ui.moveTab = null;
    if(t && t !== TABS[0].id && TABS.some(x => x.id === t)) K.bolumeGit(t);
  }

  /* GPX dosyası: düğmedeki seçici ya da karta bırakılan dosya. */
  const change = {
    async 'rota-dosya'(el){
      const file = el.files && el.files[0];
      if(el.value) el.value = '';          /* aynı dosya yeniden seçilebilsin */
      if(!file) return;
      if(file.size > ROTA_DOSYA_EN_COK){ UI.toast('Dosya çok büyük (en çok 25 MB).'); return; }
      const sonuc = Ro().oku(await file.text(), file.name);
      if(!sonuc.ok){ UI.toast(sonuc.why); return; }
      const var_ = Ro().kayitli(sonuc.rota, S.workouts);
      if(var_){ UI.toast('Bu rota zaten kayıtlı: ' + rotaAdi(var_) + '.'); return; }
      rotaTaslak = { rota:sonuc.rota, tur:sonuc.tur, turYazi:sonuc.turYazi };
      onizleme();
    },
    async 'body-photo-file'(el){
      bodyPhotoFile = (el.files && el.files[0]) || null;
      const n = document.getElementById('body-photo-name');
      if(n) n.textContent = bodyPhotoFile ? bodyPhotoFile.name : '';
      const run = document.querySelector('[data-act="run-body-photo"]');
      if(run) run.disabled = !bodyPhotoFile || !SP.Extract.modelReady();
    },
  };

  const handle = {
    async 'body-photo-open'(){ bodyPhotoFile = null; bodyPhotoSheet(); },
    async 'run-body-photo'(){
      const hEl = document.getElementById('bp-height');
      const wEl = document.getElementById('bp-weight');
      const nEl = document.getElementById('bp-note');
      const hints = {
        boy: hEl ? hEl.value.trim() : '',
        kilo: wEl ? wEl.value.trim() : '',
        not: nEl ? nEl.value.trim() : '',
        cinsiyet: S.profile && S.profile.gender ? S.profile.gender : '',
      };
      UI.toast('Beden ve duruş analiz ediliyor…');
      const res = await SP.Extract.fromBodyPhoto(bodyPhotoFile, hints);
      if(!res.ok){ UI.toast(res.note || 'Analiz başarısız'); return; }
      bodyPhotoResultSheet(res);
    },
    async 'save-body-photo-today'(){
      if(!bodyPhotoFile) return;
      const r = await SP.Foto.kaydet('vucut:' + U.todayISO(), bodyPhotoFile);
      UI.closeSheet();
      UI.toast(r.ok ? 'Fotoğraf bugünün kaydına eklendi' : (r.why || 'Kaydedilemedi'));
      SP.App.render();
    },
    async 'save-body-vitals'(){
      if(!lastBodyAnalysis) return;
      const bk = lastBodyAnalysis.biyometrikKompozisyon || lastBodyAnalysis.kompozisyon || {};
      const patch = {};
      if(bk.yagAralik){
        const nums = bk.yagAralik.match(/(\d+(?:\.\d+)?)/g);
        if(nums && nums.length){
          const sum = nums.reduce((a, b) => a + Number(b), 0);
          patch.bodyfat = U.round(sum / nums.length, 1);
        }
      }
      const bugun = U.todayISO();
      await M.saveVitals(bugun, patch);
      UI.toast('Tahmini ölçüm bugünün günlüğüne yazıldı');
      SP.App.render();
    },
    async 'save-corrective-session'(){
      if(!lastBodyAnalysis) return;
      const dh = lastBodyAnalysis.duzelticiHareketRecetesi || lastBodyAnalysis.duzelticiHareket || {};
      const bugun = U.todayISO();
      const egList = Array.isArray(dh.egzersizler) && dh.egzersizler.length ? dh.egzersizler : ['Düzeltici Mobilite'];
      const w = {
        id: U.uid(),
        date: bugun,
        name: 'Duruş Düzeltici Mobilite',
        minutes: 15,
        rpe: 4,
        items: egList.map(ad => ({ exId:'corrective', name:ad, minutes:5 })),
        note: [dh.esneme2dk, dh.guclendirme, dh.adimHedefi].filter(Boolean).join(' · '),
      };
      await M.saveWorkout(w);
      UI.toast('Düzeltici hareket seansı bugüne eklendi');
      SP.App.render();
    },
    async 'move-tab'(el){ K.bolumeGit(el.dataset.tab); },
    async 'rota-ac'(el){
      const w = S.workouts.find(x => x.id === el.dataset.id && x.rota);
      if(w) rotaKagidi(w);
    },
    async 'rota-tumu'(){ rotaListesi(); },
    async 'canli-ac'(){ canliTur = null; canliBaslatKagidi(); },
    async 'canli-tur'(el){
      if(Ro().HAREKETLER.indexOf(el.dataset.value) < 0) return;
      canliTur = el.dataset.value;
      canliBaslatKagidi();
    },
    async 'canli-basla'(){
      const r = SP.Canli.baslat(canliTur || 'kosu');
      if(!r.ok){ UI.toast(r.why); return; }
      canliSaatKur();
      canliEkrani();
    },
    async 'canli-ekran'(){ canliEkrani(); },
    async 'canli-duraklat'(){ SP.Canli.duraklat(); },
    async 'canli-surdur'(){
      const r = SP.Canli.surdur();
      if(!r.ok){ UI.toast(r.why); return; }
      if(!document.getElementById('canli-ekran')) canliEkrani();
    },
    async 'canli-bitir'(){
      const r = SP.Canli.bitir();
      if(!r.ok){ UI.toast(r.why); return; }
      canliOnizle(r.rota);
    },
    async 'canli-gozden'(){
      const r = SP.Canli.rota();
      if(!r.ok){ UI.toast(r.why); return; }
      canliOnizle(r.rota);
    },
    async 'canli-sil'(){
      UI.confirmSheet('Kaydı sil', 'Bu canlı kayıt ve bütün konum noktaları silinir; geri alınamaz.',
        async () => { SP.Canli.sil(); UI.closeSheet(); }, true, 'Kaydı sil');
    },
    async 'rota-isi'(){ isiKagidi(); },
    async 'rota-tur'(el){
      if(!rotaTaslak || Ro().HAREKETLER.indexOf(el.dataset.value) < 0) return;
      rotaTaslak.tur = el.dataset.value;
      onizleme();
    },
    async 'rota-kaydet'(){
      if(!rotaTaslak || !rotaTaslak.tur) return;
      const canli = rotaTaslak.canli;
      if(Ro().kayitli(rotaTaslak.rota, S.workouts)){
        UI.closeSheet(); rotaTaslak = null;
        if(canli) SP.Canli.sil();
        return;
      }
      const w = Ro().seans(rotaTaslak.rota, rotaTaslak.tur);
      if(!w) return;
      await M.saveWorkout(w);
      /* Taslak ancak seans KAYDEDİLDİKTEN sonra silinir. */
      if(canli) SP.Canli.sil();
      rotaTaslak = null;
      UI.closeSheet();
      UI.toast('Rota eklendi');
      S.ui.moveTab = 'kardiyo';
      SP.App.render();
    },
    async 'set-bitti'(el){
      const w = S.workouts.find(x => x.id === el.dataset.w);
      const it = w && w.items[Number(el.dataset.i)];
      if(!it) return;
      const n = Number(el.dataset.set);
      it.setsDone = (Number(it.setsDone) || 0) >= n ? n - 1 : n;
      await M.saveWorkout(w);
      SP.App.render();
    },
    async 'pick-pattern-tab'(el){ S.ui.movePattern = el.dataset.tab; SP.App.render(); },
    async 'pick-pattern'(el){
      S.ui.moveTab = 'kuvvet';
      S.ui.movePattern = el.dataset.id;
      SP.App.render();
    },
    /* Alandan seans: o alanın şablonu varsa onunla, yoksa serbest başlar. */
    async 'start-area'(el){
      const area = SP.AREA_BY_ID[el.dataset.area];
      const tpl = area && area.kind
        ? SP.SESSION_TEMPLATES.find(t => t.kind === area.kind) : null;
      draft = M.newWorkout(U.todayISO(), tpl ? tpl.id : null);
      sessionSheet(draft);
    },
    async 'start-session'(el){
      draft = M.newWorkout(U.todayISO(), el.dataset.id || null);
      sessionSheet(draft);
    },
    async 'edit-session'(el){
      draft = S.workouts.find(w => w.id === el.dataset.id);
      if(draft) sessionSheet(draft);
    },
    async 'toggle-ex'(el){
      if(!draft) return;
      const exId = el.dataset.ex;
      draft.items = draft.items || [];
      const i = draft.items.findIndex(x => x.exId === exId);
      if(i >= 0) draft.items.splice(i, 1);
      else draft.items.push({ exId, levelId:M.currentLevel(exId), sets:3, reps:null, minutes:null });
      /* Kağıdı yeniden çiz ki seçim anında görünsün; girilen süre ve zorluk
         kaybolmasın diye önce okunur. */
      const min = document.getElementById('w-min');
      const rpe = document.getElementById('w-rpe');
      const note = document.getElementById('w-note');
      if(min) draft.minutes = Number(min.value) || draft.minutes;
      if(rpe) draft.rpe = rpe.value.trim() === '' ? null : Number(rpe.value);
      if(note) draft.note = note.value;
      sessionSheet(draft);
    },
    async 'save-session'(el){
      if(!draft) return;
      const min = document.getElementById('w-min');
      const rpe = document.getElementById('w-rpe');
      const note = document.getElementById('w-note');
      draft.minutes = min ? Number(min.value) || 0 : draft.minutes;
      draft.rpe = rpe && rpe.value.trim() !== '' ? Number(rpe.value) : null;
      draft.note = note ? note.value.trim() : '';
      if(!draft.minutes){ UI.toast('Süre gir'); return; }
      await M.saveWorkout(draft);
      draft = null;
      UI.closeSheet();
      UI.toast('Seans kaydedildi');
      SP.App.render();
    },
    'hazir-antrenman-sakla'(el){
      const w = M.workoutsOf(U.todayISO()).find(x => x.id === el.dataset.id) || (SP.S.workouts || []).find(x => x.id === el.dataset.id);
      if(w && SP.Hazir) hazirAntrenmanSheet(w);
    },
    async 'hazir-antrenman-kaydet'(el){
      const w = (SP.S.workouts || []).find(x => x.id === el.dataset.id);
      const g = document.getElementById('hazir-antrenman-ad');
      const r = w ? await SP.Hazir.antrenmanSakla(w, g ? g.value : '') : { ok:false, why:'Seans bulunamadı.' };
      UI.closeSheet();
      UI.toast(r.ok ? '«' + r.kayit.ad + '» hazır antrenmanlara eklendi' : r.why);
      SP.App.render();
    },
    async 'hazir-antrenman-ekle'(el){
      const r = await SP.Hazir.antrenmanEkle(el.dataset.id, U.todayISO());
      if(!r.ok){ UI.toast(r.why); return; }
      SP.App.render();
      { const Z = (window.LIFEOS || {}).ZEMIN; if(Z && Z.nabiz) Z.nabiz(); }
      UI.toast('«' + r.ad + '» bugüne eklendi', { undo:async () => { await r.geriAl(); SP.App.render(); } });
    },
    'hazir-antrenman-duzen'(){ S.ui.hazirAntDuzen = !S.ui.hazirAntDuzen; SP.App.render(); },
    async 'hazir-antrenman-sil'(el){
      const h = SP.Hazir.antrenmanlar().find(x => x.id === el.dataset.id);
      const r = await SP.Hazir.antrenmanSil(el.dataset.id);
      if(!SP.Hazir.antrenmanlar().length) S.ui.hazirAntDuzen = false;
      SP.App.render();
      if(r.ok && h) UI.toast('«' + h.ad + '» silindi', { undo:async () => {
        await M.saveProfile({ hazirAntrenmanlar:[h].concat(SP.Hazir.antrenmanlar()) }); SP.App.render(); } });
    },
    async 'vucut-olcu-kaydet'(){
      const al = (id, min, max) => { const el = document.getElementById(id); const v = el && el.value !== '' ? Number(el.value) : null;
        return v != null && isFinite(v) && v >= min && v <= max ? v : null; };
      const patch = {};
      const bel = al('vucut-bel', 40, 200), boyun = al('vucut-boyun', 20, 70), kalca = al('vucut-kalca', 50, 200);
      if(bel != null) patch.waist = bel;
      if(boyun != null) patch.neck = boyun;
      if(kalca != null) patch.hip = kalca;
      if(!Object.keys(patch).length){ UI.toast('Geçerli bir ölçü yazılmadı.'); return; }
      const gun = U.todayISO(), once = Object.assign({}, SP.S.vitals[gun] || {});
      await M.saveVitals(gun, patch);
      SP.App.render();
      UI.toast('Ölçüler kaydedildi', { undo:async () => {
        const geri = {}; Object.keys(patch).forEach(k => { geri[k] = once[k] == null ? null : once[k]; });
        await M.saveVitals(gun, geri); SP.App.render(); } });
    },
    async 'del-session'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Seansı sil', 'Bu seans ve ürettiği yük kaydından silinir.',
        async () => { await M.deleteWorkout(id); UI.closeSheet(); SP.App.render(); }, true, 'Seansı sil');
    },
    async advance(el){
      const res = await M.advanceLevel(el.dataset.id);
      UI.toast(res.ok ? 'Yeni basamak: ' + res.level.name : res.error);
      SP.App.render();
    },
    async 'pick-level'(el){
      const ex = SP.EX_BY_ID[el.dataset.id];
      const cur = M.currentLevel(ex.id);
      UI.sheet({ title:ex.name, subtitle:'Basamak seç', wide:true,
        body:String(html`
          <p class="small muted">${ex.cue}</p>
          <div class="picks mt-12">${map(ex.levels, (l, i) => K.PickCard({
            label:(i + 1) + '. ' + l.name, meta:'hedef ' + l.to,
            on:l.id === cur,
            act:'set-level', data:{ 'data-id':ex.id, 'data-level':l.id },
          }))}</div>`),
        footer:String(K.Button({ label:'Kapat', act:'sheet-close' })), noFocus:true });
    },
    async 'set-level'(el){
      await M.setLevel(el.dataset.id, el.dataset.level);
      UI.closeSheet();
      UI.toast('Basamak güncellendi');
      SP.App.render();
    },
    async 'open-programs'(){ programsSheet(); },
    async 'open-met-calc'(){ metCalcSheet(); },
    async 'open-ex-detail'(el){ exerciseDetailSheet(el.dataset.id); },
    async 'met-search-change'(el){ metQ = el.value || ''; metCalcSheet(); },
    async 'met-min-change'(el){ metMin = Number(el.value) || 30; metCalcSheet(); },
    async 'met-pick-cat'(el){ metCat = el.dataset.cat; metCalcSheet(); },
    async 'add-met-workout'(el){
      const desc = el.dataset.desc;
      const met = Number(el.dataset.met) || 4.5;
      const min = Number(el.dataset.min) || 30;
      const rpe = Math.min(10, Math.max(1, Math.round(met)));
      const w = {
        id: U.uid(),
        date: U.todayISO(),
        name: desc,
        minutes: min,
        rpe: rpe,
        items: [{ exId:'met', name:desc, met:met, minutes:min }],
        note: 'MET: ' + met + ' (2024 Adult Compendium)'
      };
      await M.addWorkout(U.todayISO(), w);
      UI.closeSheet();
      UI.toast(desc + ' (' + min + ' dk) seans olarak eklendi');
      SP.App.render();
    },
    async 'load-program-session'(el){
      const progId = el.dataset.id;
      const prog = (SP.PROGRAMLAR || []).find(p => p.id === progId);
      if(!prog) return;
      UI.closeSheet();
      draft = {
        id: U.uid(),
        date: U.todayISO(),
        name: prog.title,
        minutes: 45,
        rpe: 6,
        items: (prog.exercises || []).map(exId => ({ exId: exId, levelId:M.currentLevel(exId), sets: 3, reps: 10 })),
        note: prog.focus || ''
      };
      sessionSheet(draft);
    },
    async 'quick-add-session-ex'(el){
      const exId = el.dataset.id;
      const ex = SP.EX_BY_ID[exId];
      if(!ex) return;
      UI.closeSheet();
      draft = {
        id: U.uid(),
        date: U.todayISO(),
        name: ex.name + ' Seansı',
        minutes: 30,
        rpe: 6,
        items: [{ exId: ex.id, levelId:M.currentLevel(ex.id), sets: 3, reps: 10 }],
        note: ex.cue || ''
      };
      sessionSheet(draft);
    },
  };

  return {
    id:'move',
    title:'Hareket',
    /* Sıkı ölçü (en çok üç açık kart): vücut analizi gelince seans geçmişi tek satır. */
    kucukVarsayilan:['seans-geçmişi'],
    headline(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok) return 'Toparlanma ölçümü bekliyor.';
      if(rx.kind === 'rest') return 'Bugün dinlenme günü.';
      if(rx.kind === 'full') return 'Bugün tam yük yapılabilir.';
      return 'Bugün yük hafifletilmeli.';
    },
    lede(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok){
        return 'Uyku ve nabız girilince günün yük emri hesaplanır. '
          + 'Ölçüm olmadan yük körlemesine verilmez.';
      }
      return rx.readiness.band.order
        + ' Kardiyo, kuvvet, esneklik ve dinlenme ayrı sayfalardır.';
    },
    stats(){
      const rx = SP.Move.prescription();
      const out = [];
      if(rx.readiness.ok){
        out.push({ value:rx.readiness.score, unit:'/100', label:'toparlanma' });
        out.push({ value:rx.factor >= 1 ? '%100' : '%' + Math.round(rx.factor * 100),
          label:'bugünkü yük' });
      }
      out.push({ value:SP.Move.loadWindow(7), label:'haftalık yük' });
      const a = SP.Move.acwr();
      if(a.ok) out.push({ value:U.fmtNet(a.ratio), label:'hafta / ay' });
      return out;
    },
    subtitle(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok) return 'Ölçüm bekliyor';
      return rx.readiness.band.label + (rx.factor >= 1 ? ' · tam yük'
        : ' · yükün %' + Math.round(rx.factor * 100) + '\u2019i');
    },
    actions(){
      return String(K.Button({ label:'Seans ekle', icon:'plus', size:'sm', tone:'primary',
        act:'start-session', data:{ 'data-id':'' } }));
    },
    yogunlukBantlari, render, afterRender, handle, change,
  };
})();
