/* Rehber — protokoller, kontrol listeleri, resmî takvim ve ayarlar.

   Yazim bicimi: STIL.md. Metin h`` icinde otomatik kacirilir; yapisal
   parcalar C.* bilesenlerinden gelir. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.guide = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  /* Sıra: bu ekran «Ayarlar › Genel»dir; ayarlar başta, başvuru metinleri
     sonda. Sekme yok (EKIP-PLANI §1.2): yedi bölüm alt alta. */
  const TABS = [
    { id:'settings',  label:'Ayarlar' },
    { id:'istisna',   label:'Takvim istisnaları' },
    { id:'calendar',  label:'Resmî takvim' },
    { id:'examweek',  label:'Sınav haftası' },
    { id:'checklist', label:'Kontrol listeleri' },
    { id:'analysis',  label:'Analiz protokolü' },
    { id:'kanit',     label:'Eşiklerin dayanağı' },
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
        badge:raw(UI.provenance('estimate')),
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
     Tatil, okul sınavı ya da yoğun gün. Kaydetmek araliktaki günleri
     hemen yeniden kurar (core/istisna.js): tatil ara günü olur, öteki
     türler ders gününün süresini yük oranında ölçekler. */

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

  /* Takvim kaydı günleri gerçekten değiştirir; mesaj ne olduğunu söyler.
     İlerlemesi başlamış gün yeniden kurulmaz ve bu SÖYLENİR. */
  function takvimMesaji(bas, from, to){
    const bugun = U.todayISO();
    if(to < bugun) return bas + ' — geçmiş günlerin planı değişmez, haftalık hedef güncellendi';
    const korunan = R.Istisna ? R.Istisna.etki(from, to).korunan.length : 0;
    return bas + ' — günlerin planı güncellendi'
      + (korunan ? '; ilerlemesi başlamış ' + U.plural(korunan, 'gün', 'gün') + ' olduğu gibi kaldı' : '');
  }

  /* ---------- takvim dosyası (.ics) — core/takvim.js ----------
     Önizleme bellekte durur (S.ui.icsOnizleme): dosya seçilince okunur,
     satır satır gösterilir, tür kullanıcı seçer. Onaylanmayan hiçbir
     etkinlik yazılmaz. */
  function icsOnizleme(){
    const o = S.ui.icsOnizleme;
    if(!o) return '';
    const secenek = [{ value:'', label:'Atla' }].concat(Object.keys(M.CALENDAR_KINDS)
      .map(k => ({ value:k, label:M.CALENDAR_KINDS[k].label })));
    const yeni = o.satirlar.filter(s => s.durum === 'yeni');
    return html`<div class="mt-12">
      <p class="tiny"><b>${o.dosya || 'Takvim'}</b> — ${o.satirlar.length} etkinlik okundu,
        ${yeni.length} yeni. Türü önerilir; tanınmayan «Atla» ile gelir.</p>
      ${map(o.notlar || [], n => K.Notice({ tone:'info', body:n }))}
      <div class="list mt-8">${map(o.satirlar, s => html`<div class="row gap-8 wrap mt-4">
        <span class="minw0 small"><b>${s.baslik}</b> <span class="tiny dim">· ${s.bas === s.bit ? U.fmtShort(s.bas) : U.fmtRange(s.bas, s.bit)}</span></span>
        ${s.durum === 'yeni'
          ? K.Select({ size:'sm', options:secenek, value:s.tur || '', aria:s.baslik + ' türü',
            data:{ 'data-ics':s.uid } })
          : html`<span class="tiny dim">${R.Takvim.DURUM_ADI[s.durum]}</span>`}
      </div>`)}</div>
      <div class="row gap-8 mt-12">
        ${K.Button({ label:'Seçilenleri ekle', tone:'primary', icon:'plus', act:'ics-ekle',
          disabled:!yeni.length })}
        ${K.Button({ label:'Vazgeç', act:'ics-vazgec' })}
      </div>
    </div>`;
  }

  function icsKarti(){
    return K.Card({ title:'Takvim dosyası', sub:'.ics — okulun ya da telefonunun takvimiyle',
      body:html`
        ${K.Drop({ act:'ics-sec', accept:'.ics,text/calendar', icon:'upload', label:'.ics dosyası seç',
          hint:'Tatil ve okul sınavları istisna olur; önce önizlersin' })}
        ${icsOnizleme()}
        <div class="row gap-8 mt-12">${K.Button({ label:'Takvime aktar (.ics)', icon:'download',
          act:'ics-disa' })}</div>
        <p class="tiny dim mt-8">Dışa aktarımda istisnalar, TYT ve AYT günü ve etkin hedeflerinin son
          tarihleri tüm gün etkinliği olarak gelir; telefonunun takvimine ekleyebilirsin.</p>` });
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
            ${K.Button({ label:'Ekle', icon:'plus', class:'mt-12', act:'cal-add' })}` }),

        icsKarti(),

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
        K.Notice({ tone:'info', body:K.Ayrinti({ etiket:'Diğer türler',
          ozet:'Tatil günü ara günü olur: blok yok ve kaçırılmış sayılmaz.',
          govde:html`<p>Okul sınavı, yoğun gün ve ekstra çalışma ders gününün süresini yük oranında
            değiştirir; deneme ve kapanış günleri kısalmaz.</p>
            <p>Haftalık soru hedefi güncel yüke göre ayarlanır. İlerlemesi başlamış bir güne
            dokunulmaz.</p>` }) }),
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
        ${K.Button({ label:'Kaydet', act:'save-profile', class:'mt-12' })}`,
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
    const undo = R.Store.importUndoInfo();

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
        ${when(undo, () => html`<div class="mt-12">${K.Notice({ tone:'warn',
          title:'Bir içe aktarma yapıldı.',
          body:new Date(undo.at).toLocaleString('tr-TR')+' tarihindeki yedekten yükleme mevcut '
             + 'verinin üzerine yazdı. Yanlışsa bir önceki duruma dönebilirsin — bu imkan yalnız '
             + 'bu içe aktarma için geçerli.' })}</div>
          <div class="mt-8">${K.Button({ label:'Bu içe aktarmayı geri al', icon:'undo', tone:'danger', act:'undo-import' })}</div>`)}
        ${K.Row([
          K.Button({ label:'Yedek al (JSON)', icon:'download', tone:due ? 'primary' : null, act:'export-data' }),
          K.Button({ label:'Yedekten yükle', icon:'upload', act:'import-data' }),
          (R.Beacon && R.Beacon.settings().enabled) ? K.Button({ label:'HKM’deki yedekten yükle', icon:'upload', act:'restore-hkm' }) : '',
          K.Button({ label:'Tümünü sıfırla', icon:'trash', tone:'danger', act:'reset-data' }),
        ].filter(Boolean), { wrap:true })}
        <p class="tiny dim mt-10">Uygulama çevrimdışı çalışır: her kayıt önce cihaza yazılır,
          bağlantı varsa hesabına eşlenir. Yerel kullanım: ${sizeKb} KB (%${q.pct}) · şema sürümü ${R.SCHEMA_VERSION}.</p>`,
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


  /* ------------------------------------------------------- dokuz aylık ufuk

     "Depo %80 dolu" tek basina ise yaramaz: ne zaman dolacagini ve NEYIN
     sisdigini soylemez, ikisi bambaska kararlar gerektirir. Buyume hizi
     her acilistaki bir olcumden HESAPLANIR; iki olcumden az varsa hiz
     bilinmiyordur ve bilinmeyen hiz sifir hiz degildir. */
  function storageHorizonCard(){
    const dp = R.Storage;
    const hukum = dp.verdict();
    const buyume = dp.growth();
    const ufuk = dp.horizon();
    const dagilim = dp.breakdown();
    const budanabilir = dp.prunable();

    return K.Card({
      title:'Dokuz aylık ufuk', hint:'storage', sub:hukum.title,
      body:html`
        ${K.Notice({ tone:hukum.level === 'full' ? 'danger'
          : (hukum.level === 'near' || hukum.level === 'watch') ? 'warn' : 'ok',
          title:hukum.title, body:hukum.note })}

        ${K.Table({ tight:true, headers:['Ölçüm', 'Değer'], rows:[
          ['Şu anki boyut', dp.fmtBytes(buyume.bytes)],
          ['Günlük büyüme', buyume.perDay == null ? 'veri yok'
            : dp.fmtBytes(buyume.perDay) + '/gün'],
          ['Ölçüm günü', String(buyume.samples)
            + (buyume.cert === 'measured' ? ' (ölçüldü)'
              : buyume.cert === 'estimated' ? ' (tahmin)' : '')],
          ['Dolmaya kalan', buyume.daysLeft == null ? '—' : buyume.daysLeft + ' gün'],
          ['270 gün sonra', ufuk.cert === 'missing' ? 'veri yok'
            : dp.fmtBytes(ufuk.projected) + (ufuk.willFit ? ' (sığar)' : ' (sığmaz)')],
        ] })}

        <div class="mt-12">${K.SectionTitle('Ne büyüyor')}</div>
        ${K.Table({ tight:true,
          headers:['Kayıt', { label:'Boyut', num:true }, { label:'Adet', num:true }, 'Tür'],
          rows:dagilim.slice(0, 10).map(r => [r.label, dp.fmtBytes(r.bytes),
            String(r.count), r.content ? 'içerik' : (r.prunable ? 'budanabilir' : 'sistem')]) })}

        ${when(budanabilir.length, () => html`
          <div class="mt-12">${K.SectionTitle('Yer aç')}</div>
          <p class="tiny dim">Yalnızca sistemin kendi ürettiği kayıtlar listelenir.
            Girdiğin hiçbir veri burada yer almaz — hiçbir koşulda.</p>
          ${map(budanabilir, b => html`
            <label class="row wrap gap-8 mt-8">
              <input type="checkbox" data-prune="${b.collection}"/>
              <span><b>${b.label}</b> — ${dp.fmtBytes(b.bytes)}
                <span class="tiny dim">${b.note}</span></span>
            </label>`)}
          ${K.Button({ label:'Seçilenleri buda', tone:'danger', size:'sm',
            act:'prune-storage', class:'mt-10' })}`)}`,
    });
  }

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

  /* ---------- HKM isareti ----------

     Dorduncu katman ISTEGE BAGLIDIR ve varsayilan olarak KAPALIDIR.
     Kullanici ne gonderildigini gormeden acmamali: bu yuzden kart, acik
     olsun olmasin, bugun gidecek gövdenin TAMAMINI satır satır gosterir. */
  function hkmCard(){
    if(!R.Beacon) return '';
    const a = R.Beacon.settings();
    const on = R.Beacon.preview();
    const durum = a.lastAt
      ? (a.lastStatus === 202 ? 'Son gönderim başarılı' : 'Son deneme başarısız')
        + ' — ' + String(a.lastAt).slice(0, 16).replace('T', ' ') + '. '
        + (a.lastNote || '')
      : 'Henüz hiç gönderilmedi.';
    return K.Card({ title:'HKM işareti', hint:'hkm',
      sub:'İsteğe bağlı dördüncü katmana günün özeti',
      body:html`
        ${(function(){
          /* Metin ortak (yedekag.js). Mahremiyet cümlesi (ilk ve son) görünür
             kalır; anahtarın neyi açtığı bir dokunuşla açılır (§1.2). */
          const c = String(window.LIFEOS.YedekAg.kartNotu('AYS')).split(/(?<=\.)\s+/);
          const ozet = c.length > 2 ? c[0] + ' ' + c[c.length - 1] : c.join(' ');
          return K.Notice({ tone:'info', body:c.length > 2
            ? K.Ayrinti({ etiket:'Bu anahtar neyi açar?', ozet, govde:html`<p>${c.slice(1, -1).join(' ')}</p>` })
            : ozet });
        })()}
        ${when(a.baskaProfil, () => K.Notice({ tone:'warn', class:'mt-10', body:window.LIFEOS.HkmBag.not(a.baskaProfil) }))}

        <div class="mt-12">
          ${K.Checkbox({ label:'İşareti aç (varsayılan kapalı)', checked:!!a.enabled,
            act:'hkm-toggle' })}
        </div>

        <div class="mt-12">
          ${K.Field({ label:'HKM adresi',
            input:K.Input({ id:'ay-hkm-url', value:a.url, change:'hkm-url',
              placeholder:'http://127.0.0.1:4200', aria:'HKM adresi' }) })}
          ${K.Field({ label:'Yerel jeton', hint:'config.json içindeki local_token',
            input:K.Input({ id:'ay-hkm-token', type:'password', value:a.token,
              change:'hkm-token', aria:'HKM jetonu' }) })}
          ${K.Field({ label:'En sık kaç dakikada bir',
            input:K.Input({ id:'ay-hkm-int', type:'number', min:'15', step:'5',
              value:a.intervalMinutes, change:'hkm-interval',
              aria:'Gönderim aralığı' }) })}
        </div>

        ${when(!R.Beacon.urlOk(a.url), () => K.Notice({ tone:'warn',
          body:'Bu adrese gönderim yapılmaz: yerel olmayan bir adrese düz http '
             + 'ile giderken jeton ağda açık gider. https ya da 127.0.0.1 gerekir.' }))}

        <div class="mt-12">
          ${K.Field({ label:'Kapsam',
            hint:'ne kadarı gönderilsin',
            input:K.Select({ id:'ay-hkm-level', value:R.Beacon.levelOf(),
              change:'hkm-level', aria:'Gönderim kapsamı',
              options:R.Beacon.LEVELS.map(l => ({ value:l.id, label:l.label })) }) })}
          <p class="tiny dim">${(R.Beacon.LEVELS.find(l => l.id === R.Beacon.levelOf()) || {}).note}</p>
        </div>

        <div class="mt-12">
          <span class="mono-label">Bugün ne gidiyor</span>
          ${K.Table({ tight:true, headers:['Alan', { label:'Değer', num:true }, 'Kaynak'],
              rows:on.rows.map(r => [r.key,
              r.value == null ? '—' : U.fmtNum(r.value),
              /* KAYNAK SÜTUNU — etiketin görseliyle birlikte.
                 Metin `window.LIFEOS.KESINLIK`ten gelir, bu ekran
                 kendi karşılığını YAZMAZ: aynı `measured` üç arayüzde
                 aynı kelimeyi göstermek zorunda. */
              raw(window.LIFEOS.KESINLIK_HTML(r.cert))]) })}
          <p class="tiny dim mt-8">Günün özetinde soru metni, hata defteri ve deneme
            ayrıntısı GİTMEZ (tam yedekte vardır). Giden şey bu dört beş sayıdır; değeri olmayan alan «veri yok»
            gider, sıfır değil.</p>
        </div>

        ${when(on.errors.length, () => K.Notice({ tone:'warn',
          body:'Gövde sözleşmeyi geçmiyor: ' + on.errors[0] + '. Bu hâliyle gönderilmez.' }))}

        <div class="mt-12">
          ${K.Button({ label:'Bağlan', act:'hkm-pair' })}
          ${K.Button({ label:'Şimdi gönder', act:'hkm-send' })}
          ${K.Button({ label:'Geçmişi gönder (60 gün)', act:'hkm-backfill' })}
        </div>
        <div class="mt-8">${K.Ayrinti({ etiket:'Neden yalnız bazı alanlar?',
          ozet:'Çapraz bulgu ve yön tahlili GEÇMİŞ ister; bugünden biriken bir ambar ilk iki ay hiçbir şey söyleyemez.',
          govde:html`<p>Geçmiş gönderimi yalnızca geriye dönük HESAPLANABİLEN alanları yollar: dünkü
            tarihle bugünkü kart borcunu yazmak, ambara sahte bir ölçüm koymaktır.</p>` })}</div>
        <p class="tiny dim mt-8">«Bağlan», jetonu HKM'den doğrudan alır:
          önce HKM yüzünde «Cihazları bağla» de, sonra iki dakika içinde
          buraya bas. Jetonu elle yazmak da çalışır.</p>
        <p class="tiny dim mt-8">${durum}</p>` });
  }

  /* HAFIZAM — sistemin senin hakkinda hatirladiklari, katmaniyla.
     Kimse gizli bir sey hatirlamaz: her kayit burada gorunur ve silinir. */
  function hafizaCard(){
    const H = window.LIFEOS.Hafiza;
    const l = R.Hafizam.etkin();
    return K.Card({ title:'Hafızam', sub:'Ofisin senin hakkında hatırladıkları — bu cihazda; HKM bağlıysa King de görür',
      body:html`
        ${when(!l.length, () => html`<p class="small dim">Henüz bir şey yok. Aşağıya yaz ya da
          sohbette «hatırla: sabahları daha verimliyim» de.</p>`)}
        <div class="stack-xs">${map(l, x => html`
          <div class="row gap-8" style="justify-content:space-between;align-items:flex-start">
            <span class="small"><span class="tiny dim">${H.KATMANLAR[x.katman].ad}</span><br/>${x.metin}</span>
            ${K.Button({ label:'Unut', size:'sm', tone:'ghost', act:'hafiza-unut', data:{ 'data-id':x.id } })}
          </div>`)}</div>
        <div class="row gap-8 mt-10">
          ${K.Input({ id:'hafiza-yeni', class:'grow', aria:'Hatırlanacak şey',
            placeholder:'Örn. Pazar günleri çalışmam' })}
          ${K.Button({ label:'Hatırla', size:'sm', act:'hafiza-ekle' })}
        </div>
        <p class="tiny dim mt-8">Model hafızaya yazamaz: «senin sözün»ü yalnız sen yazarsın,
          «tahmin» etiketli kayıtlar kural motorundan gelir ve silinebilir.</p>` });
  }

  function settingsTab(){
    return K.Grid([
      K.Span(6, K.Stack([
        profileCard(),
        calendarCard(),
        hkmCard(),
        K.Card({ title:'Koç üslubu', sub:'Aynı veri herkese aynı dille söylenmez',
          body:html`
            ${K.Segmented({ act:'set-tone', block:true, primary:true, aria:'Koç üslubu',
              value:S.profile.coachTone || 'dengeli',
              items:Object.keys(R.COACH_TONES).map(k => ({ value:k, label:R.COACH_TONES[k].name })) })}
            <p class="tiny dim mt-8">${(R.COACH_TONES[S.profile.coachTone || 'dengeli']).note}.
              Üslup ev kurallarını geçersiz kılmaz: garanti, tıbbi tavsiye ve uykudan feda
              her üslupta yasaktır.</p>` }),

        when(R.Bolum, () => K.Card({ title:'Bölümler',
          sub:'Kullanmadığın bölümü gizle; verisi silinmez',
          body:html`
            <div class="stack-xs">${map(R.Bolum.liste(), b => K.Checkbox({
              label:b.ad + (b.acik ? '' : ' — gizli'), checked:b.acik,
              act:'bolum-toggle', data:{ 'data-id':b.id } }))}</div>
            <p class="tiny dim mt-8">Bugün, Hafta, Plan, Dersler, Deneme, Tekrar, İlerleme,
              Ofis ve Rehber gizlenemez. Patron’a da söyleyebilirsin: «sınama bölümünü kapat».</p>` })),

        when(R.Hafizam, () => hafizaCard()),

        K.Card({ title:'Görünüm', sub:'Tema bu profile kaydedilir',
          body:html`
            ${K.Segmented({ items:THEMES, value:S.profile.theme || 'system', act:'set-theme',
              block:true, primary:true, aria:'Tema' })}
            <p class="tiny dim mt-10">Tek tasarım: renk modülü söyler (mavi AYS). «Sistem»
              seçiliyken cihazın açık/koyu tercihi izlenir.</p>` }),
      ])),
      K.Span(6, K.Stack([
        dataCard(),
        storageHorizonCard(),
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


  /* ------------------------------------------------------------- kanıt

     Sistemin butun esiklerinin nereden geldigi tek tabloda.

     Bu sayfanin varlik sebebi tek cumle: deterministik olmak, pedagojik
     olarak dogru olmak anlamina gelmez. Bir esik kodda ne kadar kesin
     yazilirsa yazilsin, esigin kendisi keyfi secilmisse sistem son derece
     guvenilir gorunen keyfi bir sonuc uretir. */
  function evidenceTab(){
    const kapsam = R.Ev.coverage();
    const denetim = R.Ev.audit();
    const kurallar = R.EVIDENCE.map(e => R.Ev.resolve(e));
    const ayrisan = R.Ev.disputed();

    const grup = id => kurallar.filter(r => r.source === id);

    return K.Stack([
      K.Card({ title:'Eşikler nereden geliyor?', hint:'evidence',
        body:html`
          ${K.Notice({ tone:'warn', title:'Bu bir pedagojik hiyerarşi değildir',
            body:K.Ayrinti({ govde:html`<p>${R.Ev.policy().disclaimer}</p>` }) })}
          <div class="mt-8">${K.Ayrinti({ etiket:'Hangi kaynağa ne kadar güvenilir?',
            govde:html`<p>${R.Ev.policy().rationale}</p>` })}</div>
          ${K.Table({ tight:true, headers:['Kaynak türü', 'AYS\'nin tanıdığı yetki',
            { label:'Eşik', num:true }],
            rows:R.EVIDENCE_SOURCES.map(src => {
              const y = R.EVIDENCE_AUTHORITY.find(a =>
                a.id === R.Ev.policy().defaults[src.id]);
              return [src.label, y.label + ' — ' + y.note,
                String((kapsam.bySource[src.id] || 0))];
            }) })}
          <p class="tiny dim mt-8">Politika sürümü ${R.Ev.policy().version}
            (${R.Ev.policy().changedAt}).</p>` }),

      ...R.EVIDENCE_SOURCES.map(src => {
        const rows = grup(src.id);
        if(!rows.length) return '';
        return K.Card({ title:src.label, sub:src.note,
          body:K.Table({ tight:true,
            headers:['Eşik', 'Dayanak', 'Kesinlik', 'Uygulanır', 'Yetki'],
            rows:rows.map(r => [
              r.rule,
              html`${r.citation}${when(r.note, () => html`<br><span class="tiny dim">${r.note}</span>`)}`,
              (r.certaintyInfo || {}).label || r.certainty,
              (r.applicabilityInfo || {}).label || r.applicability,
              (r.authorityInfo || {}).label || r.authority,
            ]) }) });
      }).filter(Boolean),

      K.Card({ title:'Denetim',
        body:html`
          ${denetim.length
            ? K.Notice({ tone:'danger', title:'Kayıt sorunlu',
                body:denetim.map(d => d.rule + ' (' + d.kind + ')').join(', ') })
            : K.Notice({ tone:'ok', title:'Denetim temiz',
                body:'Her kayıt çözülebiliyor, her atıf yazılı ve sistem ayarı '
                   + 'olan her eşik gerekçesini taşıyor. Bu denetim testte de '
                   + 'koşar; bozulursa test kırılır.' })}
          ${when(ayrisan.length, () => K.Notice({ tone:'info',
            title:'Dolaylı ya da kesinliği düşük eşikler',
            body:ayrisan.length + ' eşik ya popülasyona göre kayıyor ya da '
               + 'kesinliği düşük. Bunlar plan değiştirmez, yalnızca '
               + 'bilgilendirir.' }))}` }),
    ]);
  }

  /* SEVİYE SEKMESİ BURADAN KALKTI.

     Rehber, sistemin nasıl çalıştığını anlatan yerdir; seviye ise
     bakılacak bir yerdir. Aynı defteri iki ayrı sekmede göstermek
     «hangisi gerçek» sorusunu doğuruyordu. Artık kendi bölümü var:
     üst gezinmede «Rütbe» (screens/rutbe.js) — kademe, merdiven,
     XP kaynakları ve defter orada. */

  const TAB_BODY = {
    analysis:analysisTab, checklist:checklistTab, calendar:calendarTab,
    istisna:istisnaTab, examweek:examWeekTab, kanit:evidenceTab,
    settings:settingsTab,
  };

  function govde(t){
    try{ return (TAB_BODY[t.id] || analysisTab)(); }
    catch(e){
      console.error('Rehber bölümü çizilemedi (' + t.id + '):', e);
      return K.Notice({ tone:'warn', body:'Bu bölüm şu an çizilemedi; ayarların yerinde duruyor.' });
    }
  }

  async function render(){
    return String(html`<div id="pane-guide">${K.SayfaBolumleri({ act:'guide-tab', aria:'Rehber bölümleri',
      bolumler:TABS.map(t => ({ id:t.id, ad:t.label, govde:govde(t) })) })}</div>`);
  }

  const handle = {
    async 'hafiza-ekle'(){
      const el = document.getElementById('hafiza-yeni');
      const r = await R.Hafizam.ekle(el ? el.value : '', { katman:'soz', kaynak:'kullanici' });
      UI.toast(r.ok ? 'Hatırlıyorum' : r.why);
      if(r.ok) R.App.render();
    },
    async 'hafiza-unut'(el){
      const r = await R.Hafizam.unut(el.dataset.id);
      UI.toast(r.ok ? 'Unuttum' : r.why);
      R.App.render();
    },
    /* Ayarlardan elle acip kapatmak da oneri kutusundan gecer: ofiste
       «Geri al» ile geri alinabilir kalir. Kullanici kutuyu kendisi
       isaretledigi icin onay burada verilmis sayilir. */
    async 'bolum-toggle'(el){
      const id = el.dataset.id;
      const acik = R.Bolum.gizli(id) ? 1 : 0;
      const t = await R.Proposals.talep({ action:'bolum-ac-kapa', agent:'patron', source:'istek',
        params:{ bolum:id, acik }, reason:'Rehber → Bölümler' });
      let ok = !!(t.row && t.otomatik);
      if(t.row && !t.otomatik){
        const r = await R.Proposals.approve(t.row.id);
        ok = !!(r && r.ok);
      }
      const ad = (R.Bolum.BY_ID[id] || {}).ad || id;
      UI.toast(ok ? ad + (acik ? ' açıldı' : ' gizlendi — verisi duruyor') : (t.why || 'Değiştirilemedi'));
      R.App.render();
    },
    async 'guide-tab'(el){ K.bolumeGit(el.dataset.tab); },

    /* Budama. Motor kullanicinin girdigi veriyi reddeder; ekran da
       yalnizca izinli olanlari sunar. */
    async 'prune-storage'(){
      const secili = Array.prototype.slice
        .call(document.querySelectorAll('[data-prune]'))
        .filter(el => el.checked).map(el => el.dataset.prune);
      if(!secili.length){ UI.toast('Önce budanacak kaydı seç.'); return; }
      const r = await R.Storage.prune(secili);
      if(!r.ok){ UI.toast(r.error); return; }
      UI.toast(R.Storage.fmtBytes(r.freed) + ' yer açıldı.');
      R.App.render();
    },
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
      UI.toast(takvimMesaji('İstisna eklendi', from, to || from));
      R.App.render();
    },
    async 'ics-ekle'(){
      const o = S.ui.icsOnizleme;
      if(!o) return;
      const secim = {};
      document.querySelectorAll('[data-ics]').forEach(el => { secim[el.dataset.ics] = el.value || null; });
      const r = await R.Takvim.iceAl(o, secim);
      S.ui.icsOnizleme = null;
      UI.toast(r.eklenen ? r.eklenen + ' istisna eklendi; günlerin planı güncellendi'
        : 'Hiçbir etkinlik seçilmedi; hiçbir şey değişmedi');
      R.App.render();
    },
    async 'ics-vazgec'(){ S.ui.icsOnizleme = null; R.App.render(); },
    async 'ics-disa'(){
      const d = R.Takvim.disa();
      if(!d.adet){ UI.toast('Aktarılacak bir tarih yok'); return; }
      try{
        const url = URL.createObjectURL(new Blob([d.metin], { type:'text/calendar;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url; a.download = 'ays-takvim-' + U.todayISO() + '.ics';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        UI.toast(d.adet + ' etkinlik takvim dosyasına yazıldı');
      }catch(e){ UI.toast('Takvim dosyası indirilemedi'); }
    },
    async 'cal-del'(el){
      const x = S.calendar.find(c => c.id === el.dataset.id);
      await M.deleteCalendar(el.dataset.id);
      UI.toast(x ? takvimMesaji('İstisna kaldırıldı', x.from, x.to || x.from) : 'İstisna kaldırıldı');
      R.App.render();
    },
    async 'set-tone'(el){
      S.profile.coachTone = el.dataset.value;
      await M.saveProfile();
      UI.toast('Koç üslubu: ' + R.COACH_TONES[el.dataset.value].name);
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
    /* Yeni cihaza taşıma (fikir 54): HKM'deki en yeni yedek çekilir,
       okuma denetiminden geçer, onayla uygulanır; «İçe aktarmayı geri al»
       geri dönüş noktasıdır (büyük aksiyon, AGENTS §1.9). */
    async 'restore-hkm'(){
      const r = await LIFEOS.YedekAg.hkmdenCek({ hkm:() => R.Beacon, modul:'ays' });
      if(!r.ok){ UI.toast(r.why, { life:5000 }); return; }
      const c = R.Store.readBackup(r.obj);
      if(!c.ok){ UI.toast(c.error || 'Geçersiz yedek'); return; }
      UI.confirmSheet('HKM’deki yedek yüklensin mi?',
        r.tarihYazi + ' tarihli yedek' + (r.boyut ? ' (' + r.boyut + ')' : '') + ' bu cihazdaki verinin '
          + 'TAMAMINI değiştirir. Yanlışsa «İçe aktarmayı geri al» ile bir önceki duruma dönebilirsin.',
        async () => {
          try{
            await R.Store.importAll(r.obj);
            UI.toast('HKM yedeği yüklendi — yeniden başlatılıyor');
            setTimeout(() => location.reload(), 900);
          }catch(e){
            UI.toast('Yükleme başarısız: ' + (e && e.message ? e.message : 'bilinmeyen hata'));
          }
        }, true);
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
        /* Kismi bulut yazimi «tamamlandi» diye sunulmaz: kullanici neyin
           yazildigini, neyin yazilamadigini bilmeli. */
        if(meta.partialCloud){
          UI.toast('Yedek bu cihaza yüklendi ama ' + meta.cloudFailed
            + ' kayıt buluta yazılamadı — yeniden başlatılıyor');
        }else{
          UI.toast('Yedek yüklendi'+(meta.legacy ? ' (eski sürüm)' : '')
            + (meta.geriAlinamaz ? '; yer olmadığı için bu içe aktarma geri alınamaz' : '')+' — yeniden başlatılıyor');
        }
        setTimeout(() => location.reload(), 900);
      }catch(e){
        /* Yerel yazma basarisizsa sayfa YENILENMEZ: yenilemek, kullanicinin
           gozunde islemi tamamlanmis gosterir. */
        UI.toast('Yükleme başarısız: '+(e.message || 'bilinmeyen hata'));
      }
    },
    async 'undo-import'(){
      const undo = R.Store.importUndoInfo();
      if(!undo){ UI.toast('Geri alınacak bir içe aktarma yok'); return; }
      UI.confirmSheet('İçe aktarmayı geri al',
        new Date(undo.at).toLocaleString('tr-TR')+' tarihindeki içe aktarma öncesine dönülecek. '
          + 'Aradan geçen sürede eklediğin her şey kaybolur.',
        async () => {
          try{
            await R.Store.undoImport();
            UI.closeSheet();
            UI.toast('Geri alındı — yeniden başlatılıyor');
            setTimeout(() => location.reload(), 900);
          }catch(e){
            UI.toast('Geri alınamadı: '+(e.message || 'bilinmeyen hata'));
          }
        }, true);
    },
    async 'hkm-toggle'(){
      const a = R.Beacon.settings();
      await R.Beacon.save({ enabled:!a.enabled });
      UI.toast(!a.enabled ? 'HKM işareti açıldı' : 'HKM işareti kapatıldı');
      R.App.render();
    },
    async 'hkm-pair'(){
      const el = document.getElementById('ay-hkm-url');
      const r = await R.Beacon.pair(el ? el.value.trim() : null);
      UI.toast(r.note);
      R.App.render();
    },
    async 'hkm-backfill'(){
      UI.toast('Geçmiş gönderiliyor…');
      const r = await R.Beacon.backfill(60);
      UI.toast(r.ok ? r.sent + ' gün gönderildi (' + r.empty + ' gün ölçümsüz)'
        : r.note || 'Gönderilemedi (' + (r.reason || r.status) + ')');
      R.App.render();
    },
    async 'hkm-send'(){
      const r = await R.Beacon.send({ force:true });
      UI.toast(r.ok ? 'Gönderildi' : (r.note || 'Gönderilemedi'));
      R.App.render();
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

  const change = {
    async 'ics-sec'(el){
      const f = el.files && el.files[0];
      if(!f) return;
      if(f.size > 2 * 1024 * 1024){ UI.toast('Dosya çok büyük (en çok 2 MB)'); return; }
      const r = R.Takvim.onizle(await f.text());
      if(!r.ok){ UI.toast(r.why); return; }
      S.ui.icsOnizleme = Object.assign(r, { dosya:f.name });
      R.App.render();
    },
    async 'hkm-url'(el){ await R.Beacon.save({ url:el.value.trim() }); R.App.render(); },
    async 'hkm-token'(el){ await R.Beacon.save({ token:el.value.trim() }); },
    async 'hkm-interval'(el){
      const n = Math.max(R.Beacon.ASGARI_ARA_DK, Number(el.value) || 60);
      await R.Beacon.save({ intervalMinutes:n });
    },
    async 'hkm-level'(el){ await R.Beacon.save({ level:el.value }); R.App.render(); },
  };

  return {
    id:'guide',
    title:'Genel ayarlar',
    subtitle(){ return 'Ayarlar, takvim ve protokoller — alt alta'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
