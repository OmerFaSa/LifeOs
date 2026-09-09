/* Rehber — protokoller, kontrol listeleri, resmî takvim ve ayarlar.

   Yazim bicimi: STIL.md. Metin h`` icinde otomatik kacirilir; yapisal
   parcalar C.* bilesenlerinden gelir. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.guide = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const TABS = [
    { id:'analysis',  label:'Analiz protokolü' },
    { id:'checklist', label:'Kontrol listeleri' },
    { id:'calendar',  label:'Resmî takvim' },
    { id:'istisna',   label:'Takvim istisnaları' },
    { id:'examweek',  label:'Sınav haftası' },
    { id:'settings',  label:'Ayarlar' },
  ];

  /* ---------- analiz protokolu ---------- */

  function Steps(list){
    return html`<div class="steps">${map(list, p => html`
      <div class="step">
        <div class="step__no"></div>
        <div class="step__body">
          <b>${p.title}${when(p.time !== '—', () => html` <span class="tiny dim">${p.time}</span>`)}</b>
          <p>${p.detail}</p>
        </div>
      </div>`)}</div>`;
  }

  function ErrorTagTable(){
    const rows = Object.keys(R.ERROR_TAGS).map(k => {
      const t = R.ERROR_TAGS[k];
      return [
        html`<span class="row-sm"><span class="tagdot" style="background:${t.color}"></span><b>${k}</b></span>`,
        t.name,
        html`<span class="small muted">${t.recipe}</span>`,
      ];
    });
    return K.Table({ headers:['Kod', 'Anlam', 'Varsayılan reçete'], rows });
  }

  function analysisTab(){
    return K.Grid([
      K.Span(7, K.Stack([
        K.Card({ title:'Deneme analizi protokolü', sub:'Toplam 60–80 dakika · en geç 24 saat içinde',
          body:Steps(R.ANALYSIS_PROTOCOL) }),
        K.Card({ title:'Hata etiketleri ve reçeteler', sub:'Her yanlış bir etiketle kapanır',
          body:ErrorTagTable() }),
      ])),
      K.Span(5, K.Stack([
        K.Card({ title:'Yanlış defteri tasarımı',
          body:K.Table({ tight:true, headers:['Alan', 'Yazılacak bilgi'],
            rows:R.NOTEBOOK_FIELDS.map(f => [html`<b class="small">${f[0]}</b>`, html`<span class="small muted">${f[1]}</span>`]) }) }),
        K.Card({ title:'Aralıklı tekrar', sub:'Kendini sınama ve dağıtılmış çalışma',
          body:html`
            <div class="stack-xs">${map(R.SRS_PROTOCOL, p => html`
              <div class="row-top"><b class="small mw-66">${p.day}</b>
                <span class="small muted">${p.detail}</span></div>`)}</div>
            <p class="tiny dim mt-10">Kart geri çağırma gerektirmelidir: “Mitokondri nedir?” yerine
              “Oksijenli solunum basamaklarını yer ve ürünle eşleştir”.</p>` }),
        K.Card({ title:'Hesap verebilirlik',
          body:html`<ul class="bullets small muted">${map(R.ACCOUNTABILITY, a => html`<li>${a}</li>`)}</ul>` }),
      ])),
    ]);
  }

  /* ---------- kontrol listeleri ---------- */

  const RITUAL_KEY = { monday:'contract', saturday:'exam', sunday:'review' };

  function ChecklistCard(key){
    const list = R.CHECKLISTS[key];
    const rk = RITUAL_KEY[key] || 'monthly';
    const day = S.days[U.todayISO()];
    const state = (day && day.checklist) || {};
    const done = list.items.filter((_, i) => state[rk+'-'+i]).length;
    const full = done === list.items.length;

    return K.Card({
      title:list.label,
      sub:done+' / '+list.items.length+' tamam',
      badge:full ? K.Badge({ label:'tamam', tone:'ok' }) : null,
      body:html`
        ${K.Bar({ value:U.pct(done, list.items.length) })}
        <div class="checklist stack-xs mt-10">
          ${map(list.items, (it, i) => K.Checkbox({ label:it, checked:!!state[rk+'-'+i],
            act:'guide-check', data:{ 'data-key':rk+'-'+i } }))}
        </div>`,
    });
  }

  function checklistTab(){
    return K.Grid([
      K.Span(12, K.Notice({ tone:'info',
        body:'Kontrol listeleri bugünün kaydına işlenir; Bugün ekranındaki ritüel kartıyla aynı veriyi paylaşır.' })),
      map(Object.keys(R.CHECKLISTS), key => K.Span(6, ChecklistCard(key))),
    ]);
  }

  /* ---------- resmi takvim ---------- */

  function calendarTab(){
    const counters = [
      ['TYT (tahmin)', U.diffDays(U.todayISO(), R.PLAN.examTytISO), U.fmtDate(R.PLAN.examTytISO)],
      ['AYT (tahmin)', U.diffDays(U.todayISO(), R.PLAN.examAytISO), U.fmtDate(R.PLAN.examAytISO)],
      ['Program bitişi', U.diffDays(U.todayISO(), U.iso(M.weekEnd(R.PLAN.totalWeeks))), 'Hafta '+R.PLAN.totalWeeks+' sonu'],
    ];
    return K.Grid([
      K.Span(8, K.Card({
        title:'2027 kritik işlemler', sub:'Sıra / panik takvimi',
        badge:raw(UI.certainty('estimate')),
        body:html`<div class="list">${map(R.OFFICIAL_CALENDAR, r => html`
          <div class="listitem">
            <div class="mw-150"><b class="small">${r.when}</b>
              <div>${K.Badge({ label:r.status, tone:r.status === 'Tahmin' ? 'warn' : 'muted' })}</div></div>
            <span class="small muted grow">${r.what}</span>
          </div>`)}</div>`,
        foot:K.Notice({ tone:'warn', title:'Panik önleme kuralı:', body:R.CALENDAR_RULE }),
      })),
      K.Span(4, K.Stack([
        K.Card({ title:'Sayaçlar', sub:'Bugünden itibaren',
          body:K.Stack(map(counters, c => K.Stat({ label:c[0], value:U.fmtNum(c[1]), unit:' gün', note:c[2] })), 'sm') }),
        raw(UI.rail(['certainty', 'rank'])),
      ])),
    ]);
  }

  /* ---------- takvim istisnaları ----------
     Tatil, okul sınavı ya da yoğun gün: plan bu günleri görmezden gelmez,
     haftanın yükünü otomatik düşürür. */

  function exceptionRow(x){
    const kind = M.CALENDAR_KINDS[x.kind] || M.CALENDAR_KINDS.tatil;
    const days = U.diffDays(x.from, x.to || x.from) + 1;
    return html`
      <div class="listitem">
        <div class="grow">
          <div class="row-sm wrap"><b class="small">${kind.label}</b>
            ${K.Badge({ label:'yük %' + Math.round(x.load * 100), tone:kind.tone })}</div>
          <div class="tiny dim">${U.fmtRange(x.from, x.to || x.from)} · ${U.plural(days, 'gün', 'gün')}${x.note ? ' · ' + x.note : ''}</div>
        </div>
        ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'kaldır',
          act:'cal-del', data:{ 'data-id':x.id } })}
      </div>`;
  }

  function istisnaTab(){
    const list = S.calendar.slice();
    const kinds = Object.keys(M.CALENDAR_KINDS).map(k => ({ value:k, label:M.CALENDAR_KINDS[k].label }));
    const cur = M.currentWeek();
    const weekRows = [];
    for(let n = cur; n < Math.min(R.PLAN.totalWeeks, cur + 8); n++){
      const load = M.weekLoad(n);
      if(load !== 1) weekRows.push({ n, load, from:U.iso(M.weekStart(n)), to:U.iso(M.weekEnd(n)) });
    }

    return K.Grid([
      K.Span(7, K.Stack([
        K.Card({ title:'İstisna ekle', sub:'Tatil, okul sınavı ya da yoğun gün',
          body:html`
            ${K.Cols(3, [
              K.Field({ label:'Tür', input:K.Select({ id:'cal-kind', options:kinds, value:'tatil' }) }),
              K.Field({ label:'Başlangıç', input:K.Input({ id:'cal-from', type:'date', value:U.todayISO() }) }),
              K.Field({ label:'Bitiş', hint:'tek günse boş bırak', input:K.Input({ id:'cal-to', type:'date' }) }),
            ])}
            ${K.Field({ label:'Not', input:K.Input({ id:'cal-note', placeholder:'ör. dönem sonu sınavları' }) })}
            ${K.Button({ label:'Ekle', icon:'plus', tone:'primary', class:'mt-12', act:'cal-add' })}` }),

        K.Card({ title:'Kayıtlı istisnalar', sub:U.plural(list.length, 'kayıt', 'kayıt'),
          body:list.length
            ? html`<div class="list">${map(list, exceptionRow)}</div>`
            : K.Empty({ icon:'week', text:'İstisna yok. Tatil ya da okul sınavı eklersen plan o haftaların yükünü kendiliğinden düşürür.' }) }),
      ])),

      K.Span(5, K.Stack([
        K.Card({ title:'Etkilenen haftalar', sub:'Önümüzdeki 8 hafta',
          body:weekRows.length
            ? K.Table({ tight:true, headers:['Hafta', 'Tarih', { label:'Yük', num:true }],
                rows:weekRows.map(r => ['H' + r.n, U.fmtRange(r.from, r.to),
                  html`<span class="${r.load < 1 ? 'num is-down' : 'num is-up'}">%${Math.round(r.load * 100)}</span>`]) })
            : K.Empty({ icon:'check', text:'Önümüzdeki sekiz hafta tam yükte.' }) }),
        K.Notice({ tone:'info', body:'Yük çarpanı haftalık soru hedefini doğrudan etkiler. '
          + 'Plan yeniden hesaplandığında bu istisnalar da hesaba katılır.' }),
        K.Button({ label:'Planı yeniden hesapla', icon:'refresh', act:'auto-replan' }),
      ])),
    ]);
  }

  /* ---------- sinav haftasi ---------- */

  const TAPER = [
    ['Pazartesi','Kısa TYT'], ['Salı','Kısa AYT'], ['Çarşamba','Kart turu, tam deneme yok'],
    ['Perşembe','Kolay-orta güven setleri'], ['Cuma','Evrak, rota provası, erken uyku'],
    ['Cumartesi','TYT oturumu'], ['Pazar','AYT oturumu'],
  ];

  function examWeekTab(){
    return K.Grid([
      K.Span(7, K.Card({ title:'Sınav haftası ve sınav günü', sub:'Son hafta · yeni konu yok',
        body:html`<ul class="bullets small">${map(R.EXAM_WEEK_OPS, o => html`<li>${o}</li>`)}</ul>` })),
      K.Span(5, K.Stack([
        K.Card({ title:'Taper haftası planı', sub:'Hacim düşer, ritim korunur',
          body:K.Table({ tight:true, headers:['Gün', 'İş'], rows:TAPER }) }),
        K.Card({ title:'Kaygı azaltma',
          body:html`<ul class="bullets small muted">${map(R.ROUTINES.anxiety, a => html`<li>${a}</li>`)}</ul>` }),
      ])),
    ]);
  }

  /* ---------- ayarlar ---------- */

  const THEMES = [{ value:'system', label:'Sistem' }, { value:'light', label:'Açık' }, { value:'dark', label:'Koyu' }];

  function profileCard(){
    const p = S.profile;
    const f = (label, id, o) => K.Field({ label, input:K.Input(Object.assign({ id }, o)) });
    return K.Card({
      title:'Profil', sub:'Yalnız bu cihazda tutulur; koça gönderilmez',
      body:html`
        ${K.Cols(2, [f('Ad', 'st-name', { value:p.name }), f('Şehir', 'st-city', { value:p.city })])}
        ${K.Cols(2, [
          f('Haftalık kapasite (saat)', 'st-cap', { type:'number', step:0.5, value:p.capacityHoursPerWeek, numeric:true }),
          f('Uyku hedefi (saat)', 'st-sleep', { type:'number', step:0.5, value:p.sleepTarget, numeric:true }),
        ])}
        ${K.Cols(2, [
          f('Diploma notu', 'st-diploma', { type:'number', min:0, max:100, value:p.diplomaGrade, numeric:true }),
          f('Hedef başarı sırası', 'st-rank', { type:'number', value:p.targetRank, numeric:true }),
        ])}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-profile', class:'mt-12' })}`,
    });
  }

  function calendarCard(){
    return K.Card({
      title:'Takvim', sub:'Program başlangıcı ve sınav tarihi',
      body:html`
        ${K.Cols(2, [
          K.Stat({ label:'Başlangıç', value:U.fmtShort(R.PLAN.startISO), note:U.fmtDate(R.PLAN.startISO) }),
          K.Stat({ label:'Süre', value:R.PLAN.totalWeeks, unit:' hafta',
            note:R.PLAN.compressed ? 'sıkıştırılmış plan' : 'tam program' }),
        ])}
        ${K.Button({ label:'Takvimi değiştir', act:'setup-open', icon:'week', class:'mt-12' })}`,
    });
  }

  function dataCard(){
    const counts = [
      ['Deneme', S.exams.length], ['Hata kaydı', S.errors.length],
      ['Kart', S.cards.length], ['Kayıtlı gün', Object.keys(S.days).length],
    ];
    const age = M.backupAgeDays();
    const due = M.backupDue();
    const q = R.Store.localQuota();
    const sizeKb = Math.max(1, Math.round(q.bytes/1024));
    const store = R.Store.mode === 'cloud' ? 'Hesabına bağlı (cihazlar arası) + yerel kopya' : 'Bu tarayıcıda yerel';

    return K.Card({
      title:'Veri', sub:store,
      badge:age === null ? K.Badge({ label:'hiç yedek alınmadı', tone:'warn' })
        : age >= 7 ? K.Badge({ label:age+' gün önce yedeklendi', tone:'warn' })
        : K.Badge({ label:'yedek güncel', tone:'ok' }),
      body:html`
        ${K.Cols(4, map(counts, c => K.Stat({ label:c[0], value:U.fmtNum(c[1]) })))}
        ${when(due, () => html`<div class="mt-12">${K.Notice({ tone:'warn',
          body:'Son yedekten bu yana '+(age === null ? 'hiç yedek alınmadı' : age+' gün geçti')
             + '. Tarayıcı verisi silinirse çalışma geçmişin kaybolur — şimdi bir yedek al.' })}</div>`)}
        ${when(q.near, () => html`<div class="mt-12">${K.Notice({ tone:q.full ? 'danger' : 'warn',
          title:'Yerel alan %'+q.pct+' dolu.',
          body:'Tarayıcı depolaması sınıra yaklaşıyor; dolduğunda yeni kayıtlar yazılamaz. '
             + 'Bir yedek al, sonra eski kapanmış yanlış ve kartları sadeleştir.' })}</div>`)}
        ${K.Row([
          K.Button({ label:'Yedek al (JSON)', icon:'download', tone:due ? 'primary' : null, act:'export-data' }),
          K.Button({ label:'Yedekten yükle', icon:'upload', act:'import-data' }),
          K.Button({ label:'Tümünü sıfırla', icon:'trash', tone:'danger', act:'reset-data' }),
        ], { wrap:true })}
        <p class="tiny dim mt-10">Uygulama çevrimdışı çalışır: her kayıt önce cihaza yazılır,
          bağlantı varsa hesabına eşlenir. Yerel kullanım: ${sizeKb} KB (%${q.pct}) · şema sürümü ${R.SCHEMA_VERSION}.</p>`,
    });
  }

  /* Kaza kurtarma — otomatik anlık görüntüler.
     İki katmanın FARKI burada açıkça yazılır: bu görüntüler aynı tarayıcıda
     durur, tarayıcı verisi silinince onlar da gider. Kullanıcı ikisini
     karıştırırsa yanlış bir güvenlik duygusuyla yedek almayı bırakır. */
  function snapshotCard(){
    const st = R.Backup.status();
    const items = R.Backup.list();

    return K.Card({
      title:'Otomatik anlık görüntü', sub:'Kaza kurtarma — günde iki kez, sessizce alınır',
      badge:items.length
        ? K.Badge({ label:items.length + ' görüntü', tone:'ok' })
        : K.Badge({ label:'henüz yok', tone:'muted' }),
      actions:K.Button({ label:'Şimdi al', icon:'refresh', size:'sm', act:'snapshot-take' }),
      body:html`
        ${K.Notice({ tone:'info',
          title:'Bu, yedeğin yerine geçmez.',
          body:'Anlık görüntüler bu tarayıcının içinde durur; uygulama hatası ya da '
             + 'yanlışlıkla silme gibi kazalardan korur. Tarayıcı verisi temizlenirse '
             + 'ya da cihaz değişirse onlar da gider — bunun tek çaresi yedek dosyasıdır.' })}

        ${items.length
          ? html`<div class="snaps mt-12">${map(items, s => html`
              <div class="snaprow">
                <div class="minw0">
                  <b class="small">${U.fmtDate(s.at.slice(0, 10))} ·
                    ${new Date(s.at).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })}</b>
                  <span class="tiny dim">${U.fmtNum(s.records)} kayıt · ${s.reason}</span>
                </div>
                ${K.Button({ label:'Geri yükle', size:'sm', act:'snapshot-restore',
                  data:{ 'data-id':s.id } })}
              </div>`)}</div>`
          : html`<p class="small muted mt-12">Kayda değer veri biriktiğinde ilk görüntü
              kendiliğinden alınır.</p>`}

        ${when(st.quota.pct >= 60, () => html`<div class="mt-10">${K.Notice({ tone:'warn',
          body:'Yerel alan %' + st.quota.pct + ' dolu; alan açılana kadar otomatik '
             + 'görüntü alınmayacak. Bir yedek al, sonra eski kayıtları sadeleştir.' })}</div>`)}`,
    });
  }

  /* Yedek dosyasinin yapisi — disariya acik tek bicim.
     Kullanici dosyayi acip ne oldugunu gorebilmeli; bu tablo o sozlesmedir. */
  const BACKUP_SHAPE = [
    ['__meta.app', '“rota-84285” — dosyanın bu uygulamaya ait olduğunu gösterir'],
    ['__meta.schemaVersion', 'Veri şeması sürümü; daha yeni bir yedek eski sürüme yüklenmez'],
    ['__meta.exportedAt', 'Yedeğin alındığı an (ISO 8601, UTC)'],
    ['__meta.mode', 'Yedek alınırken depolama kipi: “local” veya “cloud”'],
    ['data', 'Tüm kayıtlar tek düzlem sözlük: anahtar “koleksiyon/kimlik”, değer kaydın kendisi'],
    ['data["weeks/12"]', 'Örnek: 12. haftanın sözleşmesi — ana konular, hedefler, imza'],
    ['data["days/2026-09-15"]', 'Örnek: o günün blokları, uyku ve ritüel kaydı'],
    ['data["exams/e…"]', 'Deneme: testler, doğru/yanlış/boş, süre, analiz protokolü'],
    ['data["errors/r…"]', 'Yanlış defteri kaydı: etiket, kök neden, ilke, reçete'],
    ['data["cards/c…"]', 'Tekrar kartı: ön/arka yüz, aşama, sonraki tarih'],
  ];

  /* Telefona kurulum ve yedek hatırlatması. */
  function installCard(){
    const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const can = R.App.canInstall && R.App.canInstall();
    const age = M.backupAgeDays();
    return K.Card({
      title:'Telefona kur ve yedekle', sub:'Uygulama zaten çevrimdışı çalışır',
      body:html`
        ${standalone
          ? K.Notice({ tone:'ok', body:'Uygulama olarak açıldın. Ana ekrandan tek dokunuşla girebilirsin.' })
          : can
          ? html`${K.Notice({ tone:'info', body:'Bu tarayıcı kurulumu destekliyor. Kurulunca ana ekranda '
              + 'kendi simgesiyle durur ve tarayıcı çubuğu olmadan açılır.' })}
            ${K.Button({ label:'Telefona kur', icon:'download', tone:'primary', class:'mt-10', act:'pwa-install' })}`
          : K.Notice({ tone:'info', body:'Tarayıcının menüsünden “Ana ekrana ekle” diyerek '
              + 'uygulama gibi kurabilirsin. Veriler zaten cihazda; internet gerekmez.' })}

        <div class="mt-12">${K.Row([
          K.Stat({ label:'Son yedek', value:age == null ? 'yok' : age + ' gün önce',
            tone:age == null || age >= 7 ? 'warn' : 'ok' }),
          K.Button({ label:'Şimdi yedek al', icon:'download', size:'sm', act:'export-data' }),
        ], { between:true, wrap:true })}</div>
        <p class="tiny dim mt-10">Haftada bir yedek al. Tarayıcı verisi silinirse çalışma geçmişin
          geri gelmez; yedek dosyası düz JSON’dur, herhangi bir cihazda açılır.</p>`,
    });
  }

  function backupShapeCard(){
    return K.Collapsible({
      title:'Yedek dosyası neyi içerir?', meta:'JSON yapısı',
      act:'toggle-backup-shape', open:!!S.ui.backupShapeOpen,
      body:html`
        <p class="small muted mt-10">Yedek düz bir JSON dosyasıdır; herhangi bir editörle açılıp okunabilir.
          Veri kilitli bir biçimde tutulmaz — istediğin an dışarı alabilirsin.</p>
        ${K.Table({ tight:true, headers:['Alan', 'Ne tutar'],
          rows:BACKUP_SHAPE.map(r => [html`<code class="tiny">${r[0]}</code>`, html`<span class="small muted">${r[1]}</span>`]) })}`,
    });
  }

  const SHORTCUTS = [
    ['Boşluk', 'Tekrar ekranında kartı çevir'],
    ['1 / 2 / 3', 'Hatırlamadım / Zorlandım / Hatırladım'],
    ['/ veya Ctrl+K', 'Komut paletini aç, her yeri ara'],
    ['Esc', 'Açık pencereyi kapat'],
  ];

  const NOT_THIS = [
    'Video ders veya soru bankası değildir; hangi kaynağı kullanırsan kullan süreci yönetir.',
    'Kural motoru tıbbi veya psikolojik tanı üretmez.',
    'Tahmini sıra tek ve kesin sayı olarak sunulmaz; bant ve etiketle verilir.',
    'Net düşüşü bildirim olarak gönderilmez; ödül davranışa bağlanır.',
  ];

  function settingsTab(){
    return K.Grid([
      K.Span(6, K.Stack([
        profileCard(),
        calendarCard(),
        K.Card({ title:'Koç üslubu', sub:'Aynı veri herkese aynı dille söylenmez',
          body:html`
            ${K.Segmented({ act:'set-tone', block:true, primary:true, aria:'Koç üslubu',
              value:S.profile.coachTone || 'dengeli',
              items:Object.keys(R.COACH_TONES).map(k => ({ value:k, label:R.COACH_TONES[k].name })) })}
            <p class="tiny dim mt-8">${(R.COACH_TONES[S.profile.coachTone || 'dengeli']).note}.
              Üslup ev kurallarını geçersiz kılmaz: garanti, tıbbi tavsiye ve uykudan feda
              her üslupta yasaktır.</p>` }),

        K.Card({ title:'Görünüm', sub:'Tema ve renk bu cihazda saklanır',
          body:html`
            ${K.Segmented({ items:THEMES, value:S.profile.theme || 'system', act:'set-theme',
              block:true, primary:true, aria:'Tema' })}

            <span class="mono-label palettes__label">Renk paleti</span>
            <div class="palettes">${map(R.PALETTES, p => html`
              <button class="${(S.profile.palette || R.DEFAULT_PALETTE) === p.id ? 'palettebtn is-on' : 'palettebtn'}"
                data-act="set-palette" data-palette="${p.id}"
                aria-pressed="${(S.profile.palette || R.DEFAULT_PALETTE) === p.id ? 'true' : 'false'}">
                <span class="palettebtn__dots">
                  <span style="background:${p.swatch[0]}"></span>
                  <span style="background:${p.swatch[1]}"></span>
                </span>
                <b>${p.name}</b><span class="tiny dim">${p.note}</span>
              </button>`)}</div>

            <p class="tiny dim mt-10">Koyu mod saf siyah üzerine saf beyaz kullanmaz;
              her palet iki temada da WCAG AA kontrastına göre ayarlanmıştır.</p>` }),
      ])),
      K.Span(6, K.Stack([
        dataCard(),
        snapshotCard(),
        backupShapeCard(),
        installCard(),
        K.Card({ title:'Klavye kısayolları',
          body:K.Table({ tight:true, headers:['Tuş', 'İşlev'],
            rows:SHORTCUTS.map(s => [html`<b class="small">${s[0]}</b>`, s[1]]) }) }),
        K.Card({ title:'Bu uygulama ne değildir', sub:'Sınırları bilmek beklentiyi doğru kurar',
          body:html`<ul class="bullets small muted">${map(NOT_THIS, t => html`<li>${t}</li>`)}</ul>` }),
      ])),
    ]);
  }

  const TAB_BODY = {
    analysis:analysisTab, checklist:checklistTab, calendar:calendarTab,
    istisna:istisnaTab, examweek:examWeekTab, settings:settingsTab,
  };

  async function render(){
    const tab = S.ui.guideTab || 'analysis';
    const body = (TAB_BODY[tab] || analysisTab)();
    return String(K.Stack([
      K.Subtabs({ items:TABS, value:tab, act:'guide-tab', aria:'Rehber bölümleri' }),
      html`<div id="pane-guide">${body}</div>`,
    ]));
  }

  const handle = {
    async 'guide-tab'(el){ S.ui.guideTab = el.dataset.tab; R.App.render(); },
    async 'toggle-backup-shape'(){ S.ui.backupShapeOpen = !S.ui.backupShapeOpen; R.App.render(); },
    async 'guide-check'(el){
      const day = await M.ensureDay(U.today());
      day.checklist = day.checklist || {};
      day.checklist[el.dataset.key] = el.checked;
      await M.saveDay(day.date);
      if(!R.App.patch('#pane-guide', checklistTab())) R.App.render();
    },
    async 'cal-add'(){
      const kind = document.getElementById('cal-kind').value;
      const from = document.getElementById('cal-from').value;
      const to = document.getElementById('cal-to').value;
      const note = document.getElementById('cal-note').value.trim();
      if(!from){ UI.toast('Başlangıç tarihi gerekli'); return; }
      if(to && to < from){ UI.toast('Bitiş, başlangıçtan önce olamaz'); return; }
      await M.saveCalendar({ kind, from, to:to || from, note });
      UI.toast('İstisna eklendi — plan yükü güncellendi');
      R.App.render();
    },
    async 'cal-del'(el){
      await M.deleteCalendar(el.dataset.id);
      UI.toast('İstisna kaldırıldı');
      R.App.render();
    },
    async 'set-tone'(el){
      S.profile.coachTone = el.dataset.value;
      await M.saveProfile();
      UI.toast('Koç üslubu: ' + R.COACH_TONES[el.dataset.value].name);
      R.App.render();
    },
    async 'set-palette'(el){
      S.profile.palette = el.dataset.palette;
      await M.saveProfile();
      R.App.applyTheme();
      R.App.render();
    },
    async 'set-theme'(el){
      S.profile.theme = el.dataset.value;
      await M.saveProfile();
      R.App.applyTheme();
      R.App.render();
    },
    async 'save-profile'(){
      const p = S.profile;
      const v = id => document.getElementById(id).value;
      p.name = v('st-name');
      p.city = v('st-city');
      p.capacityHoursPerWeek = Number(v('st-cap')) || p.capacityHoursPerWeek;
      p.sleepTarget = Number(v('st-sleep')) || p.sleepTarget;
      p.diplomaGrade = U.clamp(Number(v('st-diploma')) || 0, 0, 100);
      p.targetRank = Number(v('st-rank')) || p.targetRank;
      await M.saveProfile();
      UI.toast('Profil kaydedildi');
      R.App.render();
    },
    async 'snapshot-take'(){
      const res = R.Backup.take('elle');
      UI.toast(res.ok ? 'Anlık görüntü alındı — ' + res.records + ' kayıt' : res.why);
      R.App.render();
    },

    /* Geri yukleme mevcut veriyi DEGISTIRIR; bu yuzden onay istenir ve
       geri yuklemeden once simdiki hâlin goruntusu alinir (Backup.restore
       icinde), yani yanlis goruntuyu secmek de geri alinabilir. */
    async 'snapshot-restore'(el){
      const id = el.dataset.id;
      const item = R.Backup.list().find(x => x.id === id);
      if(!item) return;
      const stamp = U.fmtDate(item.at.slice(0, 10)) + ' '
        + new Date(item.at).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
      UI.confirmSheet('Anlık görüntüyü geri yükle',
        stamp + ' tarihli görüntü (' + item.records + ' kayıt) yüklenecek ve şu anki veri '
        + 'onunla değişecek. Şu anki hâlin görüntüsü önce alınır, istersen ona dönebilirsin.',
        async () => {
          try{
            const res = await R.Backup.restore(id);
            if(!res.ok){ UI.toast(res.why); return; }
            await M.loadAll();
            UI.toast('Geri yüklendi — ' + res.records + ' kayıt');
            R.App.render();
          }catch(err){
            UI.toast('Geri yüklenemedi: ' + (err && err.message ? err.message : 'bilinmeyen hata'));
          }
        });
    },

    async 'export-data'(){
      const payload = R.Store.exportAll();
      const json = JSON.stringify(payload, null, 2);
      const filename = 'rota-yedek-'+U.todayISO()+'.json';
      let saved = false;
      try{
        if(window.claude && window.claude.use){
          const dl = await window.claude.use('downloads');
          if(dl){ await dl.save({ filename, data:json }); saved = true; }
        }
      }catch(e){ /* iptal edilmis olabilir */ }
      if(!saved){
        try{
          const blob = new Blob([json], { type:'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click(); a.remove();
          URL.revokeObjectURL(url);
          saved = true;
        }catch(e){
          UI.toast('Yedek indirilemedi: '+(e.message || 'bilinmeyen hata'));
          return;
        }
      }
      await M.markBackup();
      UI.toast('Yedek alındı — '+Object.keys(payload.data).length+' kayıt');
      R.App.render();
    },
    async 'import-data'(){
      UI.sheet({
        title:'Yedekten yükle',
        body:String(html`
          ${K.Notice({ tone:'warn', body:'Mevcut veriler bu yedekle değiştirilir. Önce güncel bir yedek almanı öneririm.' })}
          ${K.Field({ label:'JSON dosyası', input:raw('<input class="input" type="file" id="imp-file" accept="application/json"/>') })}`),
        footer:String(html`
          ${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Yükle', tone:'primary', act:'import-run' })}`),
      });
    },
    async 'import-run'(){
      const input = document.getElementById('imp-file');
      const file = input && input.files[0];
      if(!file){ UI.toast('Önce bir yedek dosyası seç'); return; }
      let obj;
      try{
        obj = JSON.parse(await file.text());
      }catch(e){
        UI.toast('Dosya geçerli bir JSON değil');
        return;
      }
      const check = R.Store.readBackup(obj);
      if(!check.ok){ UI.toast(check.error); return; }
      try{
        const meta = await R.Store.importAll(obj);
        UI.closeSheet();
        UI.toast('Yedek yüklendi'+(meta.legacy ? ' (eski sürüm)' : '')+' — yeniden başlatılıyor');
        setTimeout(() => location.reload(), 700);
      }catch(e){
        UI.toast('Yükleme başarısız: '+(e.message || 'bilinmeyen hata'));
      }
    },
    async 'reset-data'(){
      UI.confirmSheet('Tüm veriyi sıfırla',
        'Tüm haftalar, günler, denemeler, hatalar ve kartlar silinecek. Bu işlem geri alınamaz — önce yedek al.',
        async () => {
          await R.Store.clear();
          UI.closeSheet();
          location.reload();
        }, true);
    },
  };

  return {
    id:'guide',
    title:'Rehber',
    subtitle(){
      const tab = TABS.find(t => t.id === (S.ui.guideTab || 'analysis'));
      return tab ? tab.label + ' · protokoller ve ayarlar' : 'Protokoller, kontrol listeleri ve ayarlar';
    },
    actions(){ return ''; },
    render, handle,
  };
})();
