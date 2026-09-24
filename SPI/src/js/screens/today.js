/* Bugün — sistemin günlük sayfası.

   Önceden iki ayrı ekran vardı: "Bugün" (özet) ve "Günlük ölçüm" (giriş);
   sonra tek sayfada üç sekme oldu (Giriş · Özet · Geçmiş). Yeni iskelette
   (ekip/EKIP-PLANI.md §3) sekme yok:

     Bugün              Şimdi · Durum · Öneri — sık yazılan dört ölçüm ve
                        öğün satırı en üstte; toparlanma, asgari gün,
                        beslenme kutularda
     Bugün › Ayrıntı    Giriş · Özet · Geçmiş alt alta bölüm (`gun`)

   Yazmak önce gelir çünkü bu sayfaya girmenin sebebi çoğu zaman okumak
   değil YAZMAKtır. Hiçbir alan zorunlu değildir: eksik girdi sıfır
   sayılmaz, ağırlığı kalan girdilere dağıtılır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.today = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  function shownDate(){ return S.ui.mealDate || U.todayISO(); }

  /* Girilecek alanlar tek yerde tanimlanir; form da, kaydetme de bunu okur. */
  const FIELDS = [
    { id:'sleep',    label:'Uyku (saat)',        step:'0.5', min:0,  max:16,  marker:'sleep' },
    { id:'rhr',      label:'İstirahat nabzı',    step:'1',   min:30, max:140, marker:'rhr' },
    { id:'hrv',      label:'HRV (ms)',           step:'1',   min:5,  max:250, marker:'hrv' },
    { id:'sbp',      label:'Büyük tansiyon',     step:'1',   min:60, max:250, marker:'sbp' },
    { id:'dbp',      label:'Küçük tansiyon',     step:'1',   min:30, max:160, marker:'dbp' },
    { id:'spo2',     label:'Oksijen (%)',        step:'1',   min:70, max:100, marker:'spo2' },
    { id:'temp',     label:'Ateş (°C)',          step:'0.1', min:33, max:43,  marker:'temp' },
    { id:'weight',   label:'Kilo (kg)',          step:'0.1', min:20, max:250, marker:'weight' },
    { id:'waist',    label:'Bel çevresi (cm)',   step:'0.5', min:40, max:200, marker:'waist' },
    { id:'bodyfat',  label:'Yağ oranı (%)',      step:'0.1', min:3,  max:60,  marker:'bodyfat' },
    { id:'water',    label:'Su (ml)',            step:'100', min:0,  max:8000, marker:null },
  ];

  const SORENESS = [
    { value:1, label:'1 · bitkin' }, { value:2, label:'2 · yorgun' },
    { value:3, label:'3 · normal' }, { value:4, label:'4 · iyi' },
    { value:5, label:'5 · zinde' },
  ];

  /* ZAMAN KAYDIRICI. Günler arasında gezinmek için üç düğme vardı:
     «‹ · bugün · ›». Geçmiş bir günü doldurmak zahmetliydi — on gün
     geriye gitmek on tıklamaydı.

     Şerit son on dört günü GÖSTERİR: her günün altında o gün veri
     girilip girilmediğini söyleyen bir nokta durur. Böylece «hangi
     günler eksik» sorusu tıklamadan cevaplanır. */
  const SERIT_GUN = 14;

  function dayNav(d){
    const bugun = U.todayISO();
    const gunler = [];
    for(let i = SERIT_GUN - 1; i >= 0; i--){
      const t = U.iso(U.addDays(U.parse(bugun), -i));
      const v = M.vitalsOf(t);
      /* Dolu sayılmak için tek alan yeter: sistem «eksik gün» demez,
         «hiç girilmemiş gün» der. */
      const dolu = !!(v && FIELDS.some(f => v[f.id] != null));
      gunler.push({ date:t, dolu, bugun:t === bugun, secili:t === d });
    }
    return html`<div class="daynav">
      <div class="daynav__strip" role="group" aria-label="Gün seç">
        ${map(gunler, g => html`<button
          class="${cls('daybtn', g.secili && 'is-on', g.bugun && 'is-today')}"
          data-act="open-day" data-date="${g.date}"
          aria-pressed="${g.secili ? 'true' : 'false'}"
          title="${U.fmtDate(g.date) + (g.dolu ? ' · veri var' : ' · veri yok')}">
          <span class="daybtn__d">${U.parse(g.date).getDate()}</span>
          <span class="${cls('daybtn__dot', g.dolu && 'is-full')}" aria-hidden="true"></span>
        </button>`)}
      </div>
      ${when(d !== bugun, () => K.Button({ label:'Bugüne dön', size:'sm',
        act:'open-day', data:{ 'data-date':bugun } }))}
    </div>`;
  }

  /* SEMPTOM GİRİŞİ. Günlükte serbest metin bir not vardı, yapı yoktu.
     Serbest metin aranamaz, sayılamaz, eğilime dönmez.

     Şiddet üç basamak: daha ince bir ölçek kullanıcıdan olmayan bir
     kesinlik ister ve günlük giriş yükünü artırır.

     «Şikâyet yok» ile «girilmemiş» ayrı şeylerdir: işaretlemeden
     kaydeden bir gün ikincisidir ve sistem bunu karıştırmaz. */
  function symptomEntry(){
    const d = shownDate();
    const secili = SP.Symptom.ofDay(d);
    const v = M.vitalsOf(d);
    const kadin = (S.profile || {}).sex === 'female';
    const w = SP.Symptom.window(30);

    return K.Entry({
      label:'Bugün bir şikâyetin var mı?',
      meta:Object.keys(secili).length
        ? Object.keys(secili).length + ' işaretli'
        : (v && v.symptomsLogged ? 'şikâyet yok' : 'girilmedi'),
      note:'Kan değeri deponun bir kısmını gösterir; kramp ve uyku şikâyeti '
        + 'değerden önemli olabilir. İşaretlediklerin ilgili ölçümün yanında '
        + 've hekim çıktısında görünür.',
      action:html`${K.Button({ label:'Şikâyetim yok', size:'sm', act:'no-symptoms' })}`,
      body:html`
        ${map(SP.SYMPTOM_GROUPS, g => html`
          <div class="symgrp">
            <div class="symgrp__h">${g.name}</div>
            <div class="symgrp__list">${map(
              SP.SYMPTOMS.filter(x => x.group === g.id), sx => {
                const sev = secili[sx.id];
                return html`<button
                  class="${cls('symbtn', sev && 'is-on', sev && 'sev-' + sev)}"
                  data-act="cycle-symptom" data-id="${sx.id}"
                  aria-pressed="${sev ? 'true' : 'false'}"
                  title="${sx.hint}">
                  <span>${sx.name}</span>
                  ${when(sev, () => html`<span class="symbtn__s">${
                    (SP.SYMPTOM_SEVERITY.find(z => z.value === sev) || {}).label}</span>`)}
                </button>`;
              })}</div>
          </div>`)}
        <p class="tiny dim mt-8">Bir şikâyete tıklayınca şiddeti artar:
          hafif → orta → şiddetli → kapalı.</p>

        ${when(kadin, () => html`<div class="mt-16">
          ${K.Field({ label:'Adet kanaması', hint:'ferritin ve hemoglobin yorumu buna bağlı',
            input:K.Checkbox({ id:'v-period', label:'Bugün kanama var',
              checked:!!(v && v.period), act:'toggle-period' }) })}
        </div>`)}

        ${when(w.ok && w.rows.length, () => html`<div class="mt-16">
          ${K.Table({ tight:true, headers:['Son 30 gün', 'Gün', 'Ortalama şiddet'],
            rows:w.rows.slice(0, 5).map(r => [r.symptom.name,
              r.days + ' / ' + w.loggedDays,
              (SP.SYMPTOM_SEVERITY.find(z => z.value === Math.round(r.avgSeverity))
                || { label:'—' }).label]) })}
          <p class="tiny dim mt-6">Payda girilen gün sayısıdır, otuz değil:
            işaretlenmemiş bir gün «şikâyet yok» sayılmaz.</p>
        </div>`)}`,
    });
  }

  /* O günün ÖLÇÜLMÜŞ antrenman süresi. `minutes` boş bırakılan bir
     antrenman «sıfır dakika» değil «veri yok»tur ve sayılmaz. */
  function OdakRozeti(d){
    if(!SP.Basarim) return '';
    const dk = (S.workouts || []).filter(w => w && w.date === d)
      .reduce((t, w) => t + (w.minutes != null ? Number(w.minutes) || 0 : 0), 0);
    return SP.Basarim.odakHtml(dk);
  }

  function formEntry(){
    const d = shownDate();
    const v = M.vitalsOf(d) || M.defaultVitals(d);
    return K.Entry({
      label:'Günün ölçümü',
      /* GÜNÜN ODAK ROZETİ — günün raporunda, tarihin yanında.
         Başarımlar sekmesindeki odak rozeti ömürlük rekordur; bu ise
         BU GÜNÜN kendisi (bkz. core/basarim.js, gununOdagi). Eşiğin
         altındaki gün rozet almaz ve boş döner. */
      meta:raw(SP.h.esc(U.fmtDate(d)) + OdakRozeti(d)),
      note:'Boş bıraktığın alan sıfır sayılmaz — hesaba hiç girmez. Uyku '
        + 'süresini yazman bile anlamlı bir sonuç üretir.',
      action:html`${dayNav(d)}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-vitals' })}`,
      body:html`
        <div class="grid-form">${map(FIELDS, f => K.Field({
          /* ALANIN SİMGESİ — kimlikten türer, burada ad kurulmaz
             (bkz. `brand/ortak/simge.js`). On bir alanlık bir ızgarada
             etiketler birbirine benziyordu: «Büyük tansiyon», «Küçük
             tansiyon», «İstirahat nabzı» üç satır aynı uzunlukta üç
             gri yazıydı ve göz hangisine baktığını her seferinde
             okuyarak buluyordu.

             SİMGE `marker` ALANINDAN gelir, `id`den DEĞİL. İkisi
             çoğu alanda aynı ama `water`ın `marker`ı bilerek `null`:
             su bir biyobelirteç değil. `|| f.id` diye bir geri
             düşüş yazılmıştı ve `olcum-water.webp` her açılışta 404
             dönüyordu — var olmayacağı bilinen bir dosyayı istemek.
             (Duman testi bunu yakaladı; her 404'te kırmızıya döner.)
             Markersız alan simgesiz kalır, etiketi olduğu gibi. */
          label:raw(window.LIFEOS.SIMGELI('olcum', f.marker, f.label)),
          input:K.Input({ id:'v-' + f.id, type:'number', numeric:true, step:f.step,
            min:f.min, max:f.max, value:v[f.id] == null ? '' : v[f.id] }),
        }))}</div>
        ${K.Field({ label:'Bugün nasıl hissediyorsun?',
          hint:'cihazın göremediği tek girdi',
          input:K.Segmented({ act:'set-soreness', value:v.soreness == null ? '' : String(v.soreness),
            items:SORENESS, block:true, aria:'Günün hissi' }) })}
        ${K.Field({ label:'Not',
          input:html`<div class="withmic">
            ${K.Textarea({ id:'v-note', rows:2, value:v.note || '',
              placeholder:'Hastalık, ilaç değişikliği, olağandışı bir gün…' })}
            ${K.Mic({ target:'v-note' })}
          </div>` })}`,
    });
  }

  function quickEntry(){
    return K.Entry({
      label:'Öğün ekle', hint:'portion',
      meta:'tek satır, tek Enter',
      note:'Ev ölçüsünden gelen gramaj «tahmin» olarak işaretlenir. '
        + 'Tarttıysan «150 g tavuk» yaz, «ölçüldü» olur.',
      action:K.Button({ label:'Bütün öğünler', act:'go', data:{ 'data-route':'meals' } }),
      body:html`
        <div class="quick">
          ${K.Mic({ target:'quick-meal' })}
          ${K.Input({ id:'quick-meal', placeholder:'1 tabak etli kuru fasulye, 1 bardak ayran',
            aria:'Öğün metni' })}
          ${K.Button({ label:'Öğüne ekle', tone:'primary', act:'quick-meal' })}
        </div>`,
    });
  }

  function statusEntry(){
    const d = shownDate();
    const v = M.vitalsOf(d);
    if(!v) return '';
    const rows = FIELDS.filter(f => f.marker && v[f.id] != null).map(f => {
      const b = SP.BIO_BY_ID[f.marker];
      const r = SP.Bio.refFor(f.marker);
      return { marker:b, value:v[f.id], at:d, cert:'measured',
        status:SP.Bio.statusOf(f.marker, v[f.id]), ref:r.ref, optimal:r.optimal };
    });
    if(!rows.length) return '';
    return K.Entry({
      label:'Girilen değerler', hint:'ref-range',
      meta:rows.length + ' ölçüm',
      note:'Referans aralığı laboratuvarın normal saydığı yer; hedef bandı '
        + 'bu sistemin istediği daha dar yer.',
      body:html`${map(rows, r => P.markerRow(r, {}))}`,
    });
  }

  function whyEntry(){
    return K.Entry({
      label:'Neden bunlar?',
      meta:'toparlanmanın girdileri',
      body:html`<ul class="bullets small muted">
        ${map(SP.READINESS_INPUTS, i => html`<li><b>${i.label}</b> — ${i.note}</li>`)}
      </ul>`,
    });
  }

  function baselineEntry(){
    const rows = [['hrv', 'HRV'], ['rhr', 'İstirahat nabzı'], ['sleep', 'Uyku'], ['weight', 'Kilo']]
      .map(([key, label]) => {
        const b = SP.Move.baseline(key);
        return [label, b ? html`<b class="num">${U.fmtNet(b.mean)}</b>` : html`<span class="dim">—</span>`,
          b ? b.n + ' gün' : 'en az 3 gün gerekir'];
      });
    return K.Entry({
      label:'Taban çizgin',
      meta:'son 30 gün, bugün hariç',
      note:'HRV ve nabız mutlak değil kişisel ölçektir: kendi ortalamana göre '
        + 'okunur, başkasınınkiyle karşılaştırılmaz.',
      body:K.Table({ tight:true, headers:['Ölçüm', { label:'Ortalama', num:true }, 'Kapsam'], rows }),
    });
  }

  function historyEntry(){
    const days = [];
    for(let i = 13; i >= 0; i--) days.push(U.iso(U.addDays(U.today(), -i)));
    const rows = days.filter(d => S.vitals[d]).reverse().map(d => {
      const v = S.vitals[d];
      const r = SP.Move.readiness(d);
      return [
        html`<button class="linkbtn" data-act="open-day" data-date="${d}">${U.fmtShort(d)}</button>`,
        v.sleep == null ? '—' : U.fmtNet(v.sleep),
        v.rhr == null ? '—' : U.fmtNum(v.rhr),
        v.hrv == null ? '—' : U.fmtNum(v.hrv),
        r.ok ? K.Badge({ label:String(r.score), tone:r.band.tone }) : html`<span class="dim">—</span>`,
      ];
    });
    if(!rows.length){
      return K.Entry({ label:'Son iki hafta', meta:'kayıt yok',
        body:P.empty('Bu aralıkta ölçüm girilmemiş.') });
    }
    return K.Entry({
      label:'Son iki hafta', meta:rows.length + ' gün',
      body:K.Table({ tight:true,
        headers:['Gün', { label:'Uyku', num:true }, { label:'Nabız', num:true },
          { label:'HRV', num:true }, 'Toparlanma'],
        rows }),
    });
  }

  /* ---------------------------------------------------------- kartlar */  /* ---------------------------------------------------------- kartlar */

  function minimumEntry(){
    const m = SP.Calc.minimumDay();
    const streak = SP.Calc.streak();
    /* ASGARI GUN TAMAMLANDIGINDA bir satir degil bir SONUC yazilir.

       «4 / 4» ile «3 / 4» arasindaki fark ekranda bir rakamdi; gunun
       bittigini soyleyen sey o rakami okumak zorunda kalmaktı. Kart
       yalniz hepsi tamamken cizilir — yarim bir gunu tamamlanmis
       gostermek, olcmedigimiz bir seyi soylemek olurdu. */
    const bitti = m.total > 0 && m.done >= m.total;
    return K.Entry({
      label:'Asgari gün', hint:'minimum-day',
      meta:m.done + ' / ' + m.total + ' · seri ' + streak + ' gün',
      note:m.note,
      body:html`
        ${when(bitti, () => K.NextUp({ icon:'check', calm:true, sanat:'saglik',
          label:'Asgari gün tamam',
          title:m.total + ' / ' + m.total + ' · seri ' + streak + ' gün',
          why:'Bugünün asgarisi kapandı. Seri, girilmiş günlerden sayılır; '
             + 'girilmemiş gün seriyi kırmaz, sayıya da katılmaz.' }))}
        <div class="mt-2">${map(m.rows, P.minRow)}</div>`,
    });
  }

  /* Dünkünün aynısı (core/dunku.js): dünün öğünü ya da antrenmanı tek
     dokunuşla bugüne. Yalnız bugün girilmemiş olan önerilir. */
  function dunkuEntry(){
    if(!SP.Dunku) return null;
    const a = SP.Dunku.adaylar(U.todayISO());
    if(!a.ogunler.length && !a.antrenmanlar.length) return null;
    return K.Entry({ label:'DÜNKÜNÜN AYNISI', meta:U.fmtShort(a.dun), wide:true,
      note:'Aynısını yaptıysan tek dokunuşla bugüne ekle; zorlanma puanı kopyalanmaz, sorulur.',
      body:html`${map(a.ogunler, o => html`<div class="row between wrap gap-6 mt-4">
          <span class="small"><b>${o.ad}</b> <span class="tiny dim">${o.ozet}</span></span>
          ${K.Button({ label:'Bugüne ekle', size:'sm', act:'dunku-ogun', data:{ 'data-id':o.id } })}</div>`)}
        ${map(a.antrenmanlar, w => html`<div class="row between wrap gap-6 mt-4">
          <span class="small"><b>${w.ad}</b> <span class="tiny dim">${w.dk} dk</span></span>
          ${K.Button({ label:'Bugüne ekle', size:'sm', act:'dunku-antrenman', data:{ 'data-id':w.id } })}</div>`)}` });
  }

  /* Seri satiri her sekmede ustte: «Bugün hastayım» ve «Tatil modu» aranmaz. */
  function seriRow(){
    if(!SP.Seri) return null;
    return K.Entry({ label:'SERİ', hint:'streak', meta:SP.Calc.streak() + ' gün', wide:true,
      body:seriKontrol() });
  }

  /* Seri dondurma ve tatil modu (brand/ortak/seri.js): hasta gün ve tatil
     seriyi bozmaz; tatildeyken HKM soru sormaz. */
  /* Yıllık tatil sınırı kullanıcının ayarıdır (kullanıcı kararı 2026-09-24;
     brand/ortak/seri.js). Düşürmek var olan tatili silmez. */
  function TatilSiniri(){
    const sinir = SP.Seri.yillikTatil(), kalan = SP.Seri.kalanTatil();
    return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny dim">Yıllık tatil sınırı: bu yıl kalan ${kalan} / ${sinir} gün</span>
      ${K.Input({ id:'seri-tatil-sinir', type:'number', size:'sm', numeric:true, value:sinir,
        aria:'yıllık tatil sınırı, gün' })}
      ${K.Button({ label:'Sınırı kaydet', size:'sm', act:'seri-tatil-sinir' })}</div>`;
  }

  function seriKontrol(){
    if(!SP.Seri) return '';
    const bugun = U.todayISO();
    const t = SP.Seri.aktifTatil(bugun);
    const k = SP.Seri.kayitOf(bugun);
    if(t) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">Tatil modu: ${U.fmtShort(t.bas)} – ${U.fmtShort(t.bit)} · seri korunuyor, HKM soru sormuyor</span>
      ${K.Button({ label:'Tatili bitir', size:'sm', act:'seri-tatil-bitir' })}</div>`;
    if(k) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">Bugün dondurulmuş (${LIFEOS.Seri.NEDEN[k.neden].toLocaleLowerCase('tr')}) · seri bozulmaz</span>
      ${K.Button({ label:'Geri al', size:'sm', act:'seri-coz', data:{ 'data-id':k.id } })}</div>`;
    if(S.ui.tatilSec) return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny">Kaç gün?</span>
      ${map([3, 7, 14], n => K.Button({ label:n + ' gün', size:'sm', act:'seri-tatil-gun', data:{ 'data-gun':String(n) } }))}
      ${K.Button({ label:'Vazgeç', size:'sm', act:'seri-tatil-vazgec' })}</div>
      ${TatilSiniri()}`;
    return html`${kotuGunSatiri()}<div class="row wrap gap-6 mt-6">
      ${when(SP.KotuGun && !SP.KotuGun.aktif(bugun), () => K.Button({ label:'Kötü gün', size:'sm', act:'kotu-gun' }))}
      ${K.Button({ label:'Bugün hastayım · seri donsun', size:'sm', act:'seri-hasta' })}
      ${K.Button({ label:'Tatil modu', size:'sm', act:'seri-tatil' })}</div>`;
  }

  /* Kötü gün modu (core/kotugun.js): açıksa günün ölçüsü asgari gündür. */
  function kotuGunSatiri(){
    if(!SP.KotuGun || !SP.KotuGun.aktif(U.todayISO())) return '';
    const m = SP.Calc.minimumDay();
    return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">Kötü gün modu: antrenman hafif, bugün asgari gün yeter
        (${m.done}/${m.total}${m.complete ? ', tamam' : ' · kalan: ' + m.rows.filter(r => !r.ok)
          .map(r => ({ protein:'protein', water:'su', move:'yürüyüş', sleep:'uyku' })[r.id] || r.id).join(', ')})</span>
      ${K.Button({ label:'Normal güne dön', size:'sm', act:'kotu-gun-kapat' })}</div>`;
  }

  function readinessEntry(){
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    if(!r.ok){
      return K.Entry({
        label:'Toparlanma', hint:'readiness', meta:'ölçüm bekliyor',
        note:r.note,
        action:K.Button({ label:'Veri gir',
          act:'day-tab', data:{ 'data-tab':'giris' } }),
        body:P.empty('Bugünün ölçümü girilmedi.'),
      });
    }
    return K.Entry({
      label:'Toparlanma', hint:'readiness',
      meta:r.band.label,
      note:r.missing.length
        ? 'Girilmeyen: ' + r.missing.join(', ') + ' — ağırlığı kalanlara dağıtıldı.'
        : null,
      action:K.Button({ label:'Hareketi aç', act:'go', data:{ 'data-route':'move' } }),
      body:html`
        <div class="row wrap" style="gap:26px">
          ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:126,
            bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
          <div class="grow" style="min-width:210px">${map(r.parts, p => html`
            <div class="${p.score == null ? 'readypart readypart--off' : 'readypart'}">
              <span class="readypart__label">${p.label}</span>
              <span class="small dim">${p.score == null ? 'girilmedi' : U.fmtNum(U.round(p.value, 1))}</span>
              <span class="readypart__score num">${p.score == null ? '—' : Math.round(p.score)}</span>
            </div>`)}</div>
        </div>
        ${K.Notice({ tone:r.band.tone === 'ok' ? 'ok' : r.band.tone, body:r.band.order })}`,
    });
  }

  function nutritionEntry(){
    const d = U.todayISO();
    const t = SP.Nutri.dayTotals(d);
    const tg = SP.Nutri.targets();

    if(!tg.ok){
      return K.Entry({
        label:'Beslenme', meta:'hedef yok',
        note:'Profilde ' + tg.missing.join(', ') + ' eksik. Bu üçü olmadan kalori ve '
          + 'protein hedefi tahmin edilmez.',
        action:K.Button({ label:'Profili tamamla',
          act:'go', data:{ 'data-route':'family' } }),
        body:P.empty('Hedef hesaplanamıyor.'),
      });
    }
    if(t.empty){
      return K.Entry({
        label:'Beslenme', meta:'hedef ' + U.fmtNum(tg.kcal) + ' kcal',
        action:K.Button({ label:'Öğün ekle',
          act:'go', data:{ 'data-route':'meals' } }),
        body:P.empty('Bugün hiç öğün girilmedi.'),
      });
    }
    return K.Entry({
      label:'Beslenme',
      meta:t.meals + ' öğün · ' + Math.round(t.kcal) + ' / ' + tg.kcal + ' kcal',
      action:K.Button({ label:'Öğünleri aç', act:'go', data:{ 'data-route':'meals' } }),
      body:html`
        ${raw(UI.macroSplit({ protein:t.protein * 4, fat:t.fat * 9, carb:t.carb * 4 }))}
        <div class="nutgrid">
          ${P.nutCell({ label:'Protein', got:t.protein, target:tg.protein.min, unit:'g' })}
          ${P.nutCell({ label:'Lif', got:t.fiber, target:tg.fiber, unit:'g' })}
          ${P.nutCell({ label:'Yağ', got:t.fat, target:tg.fat.min, unit:'g' })}
        </div>
        ${map(t.notes.slice(0, 1), P.absorbNote)}`,
    });
  }

  /* HEDEFLERİM (core/hedefler.js + brand/ortak/hedef.js + core/plan.js).
     Hedef Danışma sohbetinde kurulur; burada görünür, planı kurulur,
     askıya alınır, bırakılır. Karar etiketiyle yazılır: dayanağı
     bağlanmamış eşiğin kararı «tahmin»dir.

     PLAN BÜYÜK AKSİYONDUR (AGENTS.md §1.9): önce ayrıntılı önizleme,
     sonra «Planı uygula» — önizleme onayın kendisidir — ve her zaman
     «Planı geri al». Önizleme açıkken hiçbir şey yazılmamıştır. */
  const BANT = { gercekci:'gerçekçi', zorlayici:'zorlayıcı',
    gercekci_degil:'bu sürede gerçekçi değil', guvensiz:'güvenli değil' };
  const KARAR_AD = { onay:'King onayladı', kismi:'King kısmen onayladı', ret:'King reddetti' };
  const EMIR_DURUM = { onaylandi:'sırada', kismen_onay:'sırada', basladi:'BAM çalışıyor',
    bekliyor:'bekliyor (model ya da bütçe)', bitti:'bitti', kismen:'kısmen bitti',
    reddedildi:'reddedildi', iptal:'iptal edildi', hata:'hata verdi' };
  function kg(x){ return String(Math.round(x * 10) / 10).replace('.', ',') + ' kg'; }

  function durumDugmeleri(h){
    return html`
      ${h.durum === 'aktif'
        ? K.Button({ label:'Askıya al', size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'askida' } })
        : K.Button({ label:'Sürdür', size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'aktif' } })}
      ${K.Button({ label:'Tamamlandı', size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'tamam' } })}
      ${K.Button({ label:'Bırak', size:'sm', tone:'ghost', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'birakildi' } })}`;
  }

  function planOnizleme(h){
    const r = SP.Plan.kur(h, U.todayISO());
    if(!r.ok){
      return html`<div class="mt-8">${K.Notice({ tone:'warn', title:'Plan kurulamadı.', body:r.why })}
        <div class="row gap-8 mt-8">${K.Button({ label:'Kapat', size:'sm', act:'hedef-plan-kapat' })}</div></div>`;
    }
    const pl = r.plan;
    const satirlar = SP.Plan.onizleme(pl);
    const notlar = [].concat(pl.enerjiNeden ? [pl.enerjiNeden] : [], pl.hekim.notlar, pl.uyarilar);
    return html`<div class="mt-8">
      <p class="tiny dim"><b>Plan önizlemesi</b> — onaylanana kadar hiçbir şey değişmez.</p>
      ${K.Table({ tight:true, headers:['', 'Şimdi', 'Plandan sonra'],
        rows:satirlar.map(x => [x.alan, x.once, x.sonra]) })}
      ${when(notlar.length, () => html`<div class="stack-sm mt-8">${map(notlar, n =>
        K.Notice({ tone:'info', body:n }))}</div>`)}
      <p class="tiny dim mt-8">Enerji ve tempo tahmindir: «1 kg ≈ 7700 kcal» yaygın bir
        yaklaşımdır, kaynağı henüz bağlanmadı. Plan geri alınabilir; geri alınca beslenme
        hedefin bugünkü haline döner.</p>
      <div class="row gap-8 mt-8" style="flex-wrap:wrap">
        ${K.Button({ label:'Planı uygula', size:'sm', tone:'primary', act:'hedef-plan-uygula',
          data:{ 'data-id':h.id } })}
        ${K.Button({ label:'Şimdilik değil', size:'sm', act:'hedef-plan-kapat' })}
      </div></div>`;
  }

  /* UYARLAMA DÖNGÜSÜ (brand/ortak/hedef.js `uyarla`). Plan kontrolde geride
     kalınca hedef BUGÜNÜN verisiyle yeniden değerlendirilir; yetişmiyorsa
     seçenekler sunulur. Seçim yapana kadar hiçbir şey değişmez; seçince eski
     plan geri alınır, hedef güncellenir ve yeni plan yine önizleme ve
     onaydan geçer (büyük aksiyon). */
  function uyarlamaKutusu(h){
    const H = window.LIFEOS.Hedef;
    const u = H.uyarla(h, SP.Hedefler.PAKETLER.find(x => x.id === h.paket), {}, U.todayISO());
    return html`<div class="mt-8">
      <p class="tiny dim"><b>Bugünün verisiyle yeniden hesap</b> — seçim yapana kadar hiçbir şey değişmez.</p>
      <p class="small">${u.metin}</p>
      ${u.senaryolar.length ? html`<div class="row gap-8 mt-8" style="flex-wrap:wrap">${map(u.senaryolar, (x, i) =>
        K.Button({ label:x.ad + ' · ' + H.tarihYaz(x.son_tarih), size:'sm', act:'hedef-uyarla-sec',
          data:{ 'data-id':h.id, 'data-i':String(i) } }))}</div>
        <p class="tiny dim mt-8">Seçince eski plan geri alınır, hedef yeni tarih ve vakitle güncellenir;
          yeni planı önizleyip onaylarsın. Eski tarih hedefin geçmişinde kalır.</p>`
        : K.Notice({ tone:'info', body:'Bu tarihe hâlâ yetişilebilir; plan olduğu gibi kalabilir.' })}
      <div class="row gap-8 mt-8">${K.Button({ label:'Kapat', size:'sm', act:'hedef-uyarla-kapat' })}</div>
    </div>`;
  }

  function planOzeti(h, pl){
    const il = SP.Plan.ilerleme(pl, U.todayISO());
    const hafta = SP.Plan.buHafta(pl, U.todayISO());
    const e = pl.emir;
    const bas = 'Plan uygulandı · ' + pl.hafta + ' hafta, haftada ' + String(pl.tempo).replace('.', ',')
      + ' kg' + (pl.enerji ? ' · ' + Number(pl.enerji.kcal).toLocaleString('tr-TR') + ' kcal (tahmin)' : '')
      + (pl.protein ? ' · protein ' + pl.protein.min + '–' + pl.protein.max + ' g' : '');
    return html`<div class="stack-sm mt-8">
      <p class="small">${bas}</p>
      ${when(il.sonraki, () => html`<p class="tiny">Sonraki kontrol: <b>${U.fmtDate(il.sonraki.tarih)}</b>
        (${pl.tartiGunu.ad}, ${pl.tartiGunu.not}) — beklenen ${kg(il.sonraki.beklenen)}</p>`)}
      ${K.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      ${S.ui.uyarla === h.id ? uyarlamaKutusu(h) : when(il.durum === 'geride', () => K.Button({
        label:'Yeniden hesapla', size:'sm', tone:'primary', act:'hedef-uyarla-ac', data:{ 'data-id':h.id } }))}
      ${when(pl.enerjiNeden, () => html`<p class="tiny dim">${pl.enerjiNeden}</p>`)}
      ${when(pl.hekim.talimatlar.length, () => html`<p class="tiny dim">${pl.hekim.talimatlar.length}
        hekim talimatına uyuluyor.${pl.hekim.notlar.length ? ' ' + pl.hekim.notlar.join(' ') : ''}</p>`)}
      ${when(hafta, () => html`<div><p class="tiny"><b>Bu hafta (${hafta.no}. hafta)</b> —
        Planlama Ofisi programı, sürüm ${pl.program.surum}</p>
        <ul class="tiny dim" style="margin:4px 0 0 18px">${map(hafta.gorevler, g => html`<li>${g.metin}</li>`)}</ul></div>`)}
      ${when(e, () => html`<p class="tiny dim">İş emri #${e.id}: ${KARAR_AD[e.karar] || e.karar}${e.durum
        && EMIR_DURUM[e.durum] ? ' · ' + EMIR_DURUM[e.durum] : ''}${e.tahmin && e.tahmin.metin
        && e.durum !== 'bitti' ? ' · tahmini süre ' + e.tahmin.metin + ' (tahmin)' : ''}</p>`)}
      <div class="row gap-8" style="flex-wrap:wrap">
        ${K.Button({ label:'Planı geri al', size:'sm', act:'hedef-plan-geri', data:{ 'data-id':h.id } })}
        ${when(!e || e.karar === 'ret', () => K.Button({ label:'King’e ilet', size:'sm',
          act:'hedef-plan-king', data:{ 'data-id':h.id } }))}
        ${durumDugmeleri(h)}
      </div></div>`;
  }

  /* ALIŞKANLIK (brand/ortak/aliskanlik.js): planı yoktur; ilerleme doğrudan
     KAYITTAN sayılır. «Kayıt yok» «yapılmadı» demek değildir. */
  function aliskanlikOzeti(h){
    const il = SP.Hedefler.ALISKANLIK.ilerleme(h, SP.U.todayISO());
    return html`<div class="stack-sm mt-8">
      ${K.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      <div class="row gap-8" style="flex-wrap:wrap">${durumDugmeleri(h)}</div></div>`;
  }

  function hedefSatir(h){
    const g = h.gerceklik || {};
    const H = window.LIFEOS.Hedef;
    const pl = SP.Plan ? SP.Plan.aktif(h.id) : null;
    const onizle = !pl && S.ui.planOnizle === h.id && h.durum === 'aktif';
    return html`<div>
      <div><b class="small">${SP.Hedefler.ozet(h)}</b>
        <div class="tiny dim">${h.durum === 'askida' ? 'askıda · ' : ''}${h.son_tarih
          ? 'son tarih ' + H.tarihYaz(h.son_tarih) : 'tarihsiz'}${g.bant ? ' · ' + BANT[g.bant]
          + ' (' + (g.etiket === 'hesaplandi' ? 'hesaplandı' : 'tahmin') + ')' : ''}</div></div>
      ${h.paket === 'aliskanlik' && SP.Hedefler.ALISKANLIK ? aliskanlikOzeti(h)
        : pl ? planOzeti(h, pl) : onizle ? planOnizleme(h) : html`
        <div class="row gap-8 mt-6" style="flex-wrap:wrap">
          ${when(SP.Plan && h.durum === 'aktif' && h.paket === 'kilo', () => K.Button({ label:'Planı gör',
            size:'sm', tone:'primary', act:'hedef-plan-onizle', data:{ 'data-id':h.id } }))}
          ${durumDugmeleri(h)}
        </div>`}
    </div>`;
  }
  /* Zaman bütçesi (HKM core/hedefag.py): cümleyi HKM'nin kodu kurar;
     burası yalnız gösterir. HKM kapalıysa satır hiç çizilmez. */
  function butceSatiri(){
    const b = SP.Hedefler.ag ? SP.Hedefler.ag.butce() : null;
    if(!b || !b.metin) return '';
    return K.Notice({ tone:{ sigar:'info', sikisik:'warn', sigmaz:'warn' }[b.bant] || 'info', title:'Zaman bütçesi (King):', body:b.metin });
  }

  function hedefEntry(){
    if(!SP.Hedefler) return null;
    const l = SP.Hedefler.aktifler();
    return K.Entry({
      label:'Hedeflerim', meta:l.length ? l.length + ' etkin' : 'yok',
      action:K.Button({ label:'Danışma’da hedef koy', act:'go', data:{ 'data-route':'team' } }),
      body:l.length ? html`<div class="stack-sm">${butceSatiri()}${map(l, hedefSatir)}</div>`
        : K.Ayrinti({ ozet:'Henüz hedefin yok. Danışma’da bir cümleyle yazabilirsin.',
          etiket:'Örnekler',
          govde:html`<p>«3 ay içinde 3 kilo vermek istiyorum» ya da «VKİ’mi 24’e indirmek
            istiyorum» gibi yazabilirsin; gerçekçi olup olmadığını ve güvenli temposunu söylerim.
            Alışkanlık da kurabilirsin: «haftada 3 gün 30 dakika düzenli spor yapmak
            istiyorum».</p>` }),
    });
  }

  /* KING BİLDİRİMLERİ (HKM core/king.py). İş emrinin yolu: onaylandı,
     başladı, bitti, reddedildi… HKM kapalıysa hiç gelmez ve kart çizilmez;
     «Okundu» bildirimi merkezde silmez, yalnız işaretler. */
  const BILDIRIM_TON = { reddedildi:'warn', hata:'warn', bekliyor:'warn', kismen_onay:'warn' };
  function kingBildirimRow(){
    const l = S.ui.hkmBildirim || [];
    if(!l.length) return '';
    return K.Entry({ label:'KİNG BİLDİRİMİ', hint:'hkm', meta:l.length + ' yeni', wide:true,
      body:html`${map(l.slice(0, 5), b => html`<div class="mt-8">
        ${K.Notice({ tone:BILDIRIM_TON[b.tur] || 'info', body:b.metin })}
        <div class="row gap-8 mt-6">${K.Button({ label:'Okundu', size:'sm',
          act:'king-bildirim-okundu', data:{ 'data-id':String(b.id) } })}</div></div>`)}
        ${when(l.length > 5, () => html`<p class="tiny dim mt-8">${l.length - 5} bildirim daha — HKM › Ofis’te.</p>`)}` });
  }

  function officeEntry(){
    const d = U.todayISO();
    const b = S.officeBriefings[d];
    const notes = SP.Office.notes().slice(0, 3);
    return K.Entry({
      label:'Ofisten', hint:'office',
      meta:'beş ajan · günün notu',
      action:html`${K.Button({ label:'Ofisi aç', act:'go', data:{ 'data-route':'office' } })}
        ${K.Button({ label:'Tazele', act:'refresh-briefing' })}`,
      body:html`
        ${when(b, () => html`<p class="small">${b.text}</p>`)}
        ${when(!b, () => html`<p class="small dim">Günün brifingi henüz üretilmedi.</p>`)}
        ${when(notes.length, () => html`<div class="notes">${map(notes, n => html`
          <div class="note note--${n.tone}">
            ${P.avatar(n.agent, 'sm')}
            <div><b class="tiny">${n.name}</b> <span class="small">${n.text}</span></div>
          </div>`)}</div>`)}`,
    });
  }

  function moneyEntry(){
    const m = SP.Money.status();
    return K.Entry({
      label:'Bütçe', hint:'budget-rank',
      meta:m.tone === 'ok' ? 'uyumlu' : m.tone === 'muted' ? 'boş' : 'gözden geçir',
      action:K.Button({ label:'Finansı aç', act:'go', data:{ 'data-route':'basket' } }),
      body:html`<p class="small">${m.text}</p>
        ${when(m.basket.limit != null && m.basket.rows.length,
          () => K.Meter({ label:'Haftalık sınır', value:Math.min(100, m.basket.pct || 0),
            text:U.fmtNum(Math.round(m.basket.total)) + ' / ' + U.fmtNum(m.basket.limit) + ' TL',
            tone:m.basket.over ? 'danger' : '' }))}`,
    });
  }

  /* Denetim sorusu — AYRI EKRAN DEĞİL, Bugün akışının içinde tek kart.

     Nöbetçi (core/goodhart.js) ve sürtünme ölçer (core/friction.js) arka
     planda çalışır; buraya yalnızca sıradaki TEK soru düşer. Soru yoksa
     kart hiç çizilmez — sistemin sormadığı gün, iyi gündür. */
  function signalEntry(){
    if(!SP.Signals) return null;
    const sig = SP.Signals.current();
    if(!sig) return null;
    if(!sig.seenAt) SP.Signals.markSeen(sig.id);

    return K.Entry({
      label:'BİR SORU', hint:'signal',
      meta:sig.kind === 'friction' ? 'sürtünme' : 'gösterge',
      note:sig.title,
      body:html`
        ${K.Notice({ tone:'info', body:sig.question })}
        ${when(sig.answeredAt, () => html`
          <p class="small muted mt-8">Cevabın: ${sig.answer}</p>
          <p class="tiny dim">Soru açık kalır: ayrışmanın gerçekten kapanıp
            kapanmadığı bir sonraki pencerede ölçülecek.</p>`)}
        ${when(!sig.answeredAt, () => html`
          <div class="mt-8">
            ${K.Field({ label:'Kısa cevabın (isteğe bağlı)',
              input:K.Input({ id:'sig-answer', placeholder:'tek cümle yeter' }) })}
            <div class="row wrap mt-8">
              ${K.Button({ label:'Cevabı kaydet', size:'sm',
                act:'signal-answer', data:{ 'data-id':sig.id } })}
              ${K.Button({ label:'Bu soru bana uymuyor', size:'sm',
                act:'signal-dismiss', data:{ 'data-id':sig.id } })}
            </div>
          </div>`)}`,
    });
  }

  /* King ve HKM teklifleri, Danışma'nın bekleyen kayıtları Onaylar'da
     (screens/onaylar.js). Bugün yalnız en öndeki kartı gösterir. */

  /* ---------- HKM seridi: KUCUK ve HER GUN ORADA

     HKM ayarlari bir ayar ekraninin icinde duruyordu: gunde bir bakilan
     bir yerde, gun boyu acik duran bir baglantinin durumu. Bagli mi
     degil mi, en son ne zaman gitti — bunlar gunluk ekranda TEK SATIR
     olmali.

     Serit bir AYAR EKRANI DEGILDIR: durumu soyler ve tek bir is
     yaptirir. Ayarin yeri yine kendi ekranidir; iki yerde iki ayar
     olsaydi biri otekini sessizce yenerdi. */
  function saat(iso){
    if(!iso) return null;
    const d = new Date(iso);
    if(isNaN(d.getTime())) return null;
    return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes());
  }

  function hkmSeritRow(){
    if(!SP.Beacon) return '';
    const a = SP.Beacon.settings();

    if(!a.enabled){
      return K.Entry({ label:'HKM', hint:'hkm', meta:'bağlı değil',
        wide:true, body:html`<p class="tiny dim">Hayat Kontrol
          Merkezi'ne günün özetini göndermek istersen ayarlardan
          açabilirsin. SPİ bundan bağımsız çalışır: HKM kapalıyken
          hiçbir şey eksilmez.</p>` });
    }

    const gitti = saat(a.lastOkAt);
    const denendi = saat(a.lastAt);
    /* Basarisiz son deneme YUTULMAZ: «gonderildi» ile «gonderilmeye
       calisildi» ayri seylerdir. */
    const bozuk = a.lastStatus !== null && a.lastStatus !== undefined
      && a.lastStatus !== 202;

    return K.Entry({ label:'HKM', hint:'hkm', wide:true,
      meta:bozuk ? ('son deneme ' + (denendi || '—') + ' · başarısız')
        : (gitti ? ('son gönderim ' + gitti) : 'henüz gönderilmedi'),
      body:html`
        ${when(bozuk, () => K.Notice({ tone:'warn',
          body:(a.lastNote || 'Gönderilemedi.') + ' SPİ bundan etkilenmez; '
             + 'veri burada duruyor ve bir sonraki denemede gider.' }))}
        <div class="row gap-8 mt-8">
          ${K.Button({ label:'Şimdi gönder', size:'sm', act:'hkm-gonder' })}
        </div>
        <p class="tiny dim mt-8">Giden şey günün ÖZETİDİR: etiketli
          ölçümler. Ham kayıt SPİ'de kalır.</p>` });
  }

  /* YEDEK UYARISI — GÜNLÜK EKRANDA, rehberin içinde değil.

     Uyarı daha önce yalnız Rehber → «Veri ve yedek» sekmesindeki bir
     rozette duruyordu: yedek almayı unutan birinin GİTMEDİĞİ sayfada.
     Eşik de otuz gündü. İkisi birleşince hatırlatma, kaybı önleyecek
     olan şey değil kaybın yanında duran bir not oluyordu.

     Kural ortak (`brand/ortak/yedek.js`): yedi gün, ve korunacak veri
     yokken hiç çıkmaz — ilk gün açan kullanıcıyı boş bir dosya
     indirmeye çağırmaz. */
  function yedekUyarisi(){
    if(!M.backupDue()) return '';
    const yas = M.backupAgeDays();
    return html`<div class="mb-16">${K.Notice({ tone:'info', title:'Yedekleme.',
      body:html`${yas === null ? 'Henüz hiç yedek almadın.'
        : 'Son yedeğin ' + yas + ' gün önce alındı.'} Tarayıcı verisi
        silinirse tahlil, ölçüm ve öğün geçmişin kaybolur.
        ${K.Button({ label:'Yedek al', size:'sm', act:'go',
          data:{ 'data-route':'guide' } })}` })}</div>`;
  }

  /* BUGÜN — üç alan (katalog 03, EKIP-PLANI §3):

       ŞİMDİ   en acil tek uyarı, vakti gelen hatırlatma, günün sorusu ve
               tek canlı öğe: günün ölçümü (sık yazılan dört alan) ile
               öğün satırı
       DURUM   toparlanma · asgari gün · beslenme — kutular, düğmesiz
       ÖNERİ   en çok bir kart; fazlası «+N öneri Onaylar'da»

     Geri kalan her kart «Bugün › Ayrıntı»dadır (renderAyrinti): bütün
     alanlarıyla ölçüm formu, şikâyetler, seri, HKM şeridi, özet ve geçmiş.
     Hiçbiri kalkmadı; yalnız yeri değişti. Sadelik bütçesi: sayfa boyu
     1800 px, görünen düğme 14, dolu düğme 1. */
  const AGIRLIK = { danger:3, warn:2, info:1 };
  /* Uyarılar en acilden: ilki Bugün'de, gerisi Ayrıntı'da. */
  function uyarilar(){
    const out = M.openFlags().map(f => ({ tone:'danger', kart:P.flagCard(f) }));
    const y = yedekUyarisi();
    if(y) out.push({ tone:'info', kart:y });
    return out.sort((a, b) => (AGIRLIK[b.tone] || 0) - (AGIRLIK[a.tone] || 0));
  }

  /* Sık yazılan dört ölçüm. Kaydetmek yalnız burada yazılanı değiştirir:
     `save-vitals` ekranda olmayan alana dokunmaz. */
  const HIZLI_ALAN = ['sleep', 'rhr', 'hrv', 'weight'];

  function OlcumKutusu(){
    const d = shownDate();
    const v = M.vitalsOf(d) || M.defaultVitals(d);
    const alanlar = FIELDS.filter(f => HIZLI_ALAN.indexOf(f.id) >= 0);
    return K.Kutu({ ad:'Günün ölçümü', class:'kahraman',
      yuva:raw(SP.h.esc(d === U.todayISO() ? 'bugün' : U.fmtDate(d)) + OdakRozeti(d)),
      govde:html`<div class="grid-form">${map(alanlar, f => K.Field({
          label:raw(window.LIFEOS.SIMGELI('olcum', f.marker, f.label)),
          input:K.Input({ id:'v-' + f.id, type:'number', numeric:true, step:f.step,
            min:f.min, max:f.max, value:v[f.id] == null ? '' : v[f.id] }),
        }))}</div>
        <p class="tiny dim mt-8">Boş bıraktığın alan sıfır sayılmaz; uyku tek başına yeter.</p>
        <div class="row wrap gap-8 mt-8">
          ${K.Button({ label:'Kaydet', tone:'primary', act:'save-vitals' })}
          ${K.Button({ label:'Bütün alanlar', tone:'ghost', act:'day-tab', data:{ 'data-tab':'giris' } })}
        </div>` });
  }

  function OgunKutusu(){
    return K.Kutu({ ad:'Öğün ekle', yuva:'tek satır, tek Enter',
      govde:html`<div class="quick">
          ${K.Mic({ target:'quick-meal' })}
          ${K.Input({ id:'quick-meal', placeholder:'1 tabak etli kuru fasulye, 1 bardak ayran',
            aria:'Öğün metni' })}
          ${K.Button({ label:'Öğüne ekle', act:'quick-meal' })}
        </div>
        <p class="tiny dim mt-8">Ev ölçüsü «tahmin», tartılmış gram «ölçüldü» olarak yazılır.</p>` });
  }

  function ToparlanmaKutusu(){
    const r = SP.Move.readiness(shownDate());
    if(!r.ok) return K.Kutu({ ad:'Toparlanma', yuva:'ölçüm bekliyor',
      govde:html`<p class="small muted">${r.note || 'Bugünün ölçümü girilmedi.'}</p>` });
    return K.Kutu({ ad:'Toparlanma', yuva:r.band.label,
      govde:html`<div class="row wrap" style="gap:18px">
          ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:104,
            bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
          <p class="small grow minw0">${r.band.order}</p>
        </div>
        ${when(r.missing.length, () => html`<p class="tiny dim mt-8">Girilmeyen: ${r.missing.join(', ')}
          — ağırlığı kalanlara dağıtıldı.</p>`)}` });
  }

  function AsgariKutusu(){
    const m = SP.Calc.minimumDay();
    return K.Kutu({ ad:'Asgari gün', yuva:m.done + ' / ' + m.total + ' · seri ' + SP.Calc.streak() + ' gün',
      govde:html`${map(m.rows, P.minRow)}` });
  }

  function BeslenmeKutusu(){
    const t = SP.Nutri.dayTotals(U.todayISO());
    const tg = SP.Nutri.targets();
    if(!tg.ok) return K.Kutu({ ad:'Beslenme', yuva:'hedef yok',
      govde:html`<p class="small muted">Profilde ${tg.missing.join(', ')} eksik; hedef tahmin edilmez.</p>` });
    if(t.empty) return K.Kutu({ ad:'Beslenme', yuva:'hedef ' + U.fmtNum(tg.kcal) + ' kcal',
      govde:html`<p class="small muted">Bugün hiç öğün girilmedi.</p>` });
    return K.Kutu({ ad:'Beslenme', yuva:t.meals + ' öğün',
      govde:html`${K.Meter({ label:'Enerji', value:tg.kcal ? 100 * t.kcal / tg.kcal : 0,
          text:U.fmtNum(Math.round(t.kcal)) + ' / ' + U.fmtNum(tg.kcal) + ' kcal' })}
        <div class="mt-8">${K.Meter({ label:'Protein', value:tg.protein.min ? 100 * t.protein / tg.protein.min : 0,
          text:U.fmtNum(Math.round(t.protein)) + ' / ' + U.fmtNum(tg.protein.min) + ' g' })}</div>` });
  }

  async function render(){
    const acil = uyarilar()[0];
    const vakti = SP.HatirlatUI ? SP.HatirlatUI.vaktiRow() : '';
    const soru = signalEntry();
    /* Onaylar tek çekmecede: burada yalnız en öndeki kart (screens/onaylar.js). */
    const oneri = SP.Screens.onaylar && SP.Screens.onaylar.bekleyen() ? SP.Screens.onaylar.oneriAlani() : '';

    return String(html`<div class="bugun" data-oz="003">
      <div class="bugun__sol">
        <section class="bugun__alan" aria-label="Şimdi">
          ${when(acil, () => acil.kart)}
          ${when(vakti, () => K.Ledger([vakti]))}
          ${when(soru, () => K.Ledger([soru]))}
          ${OlcumKutusu()}
          ${OgunKutusu()}
        </section>
      </div>
      <div class="bugun__sag">
        <section class="bugun__alan" aria-label="Durum">
          ${ToparlanmaKutusu()}
          ${AsgariKutusu()}
          ${BeslenmeKutusu()}
        </section>
        ${when(oneri, () => html`<section class="bugun__alan" aria-label="Öneri">${oneri}</section>`)}
      </div>
    </div>`);
  }

  /* GÜNÜN AYRINTISI (Bugün › Ayrıntı). Önce Günlük'ün üç sekmesiydi
     (Giriş · Özet · Geçmiş); şimdi üçü alt alta bölümdür ve eski sekme
     eylemi (`day-tab`) bölüm çubuğunda kalır. Bugün'de duran şey (hızlı
     öğün, günün sorusu, en acil uyarı) burada tekrar çizilmez; ölçüm
     formu burada bütün alanlarıyla durur. */
  async function renderAyrinti(){
    const banners = uyarilar().slice(1).map(u => u.kart);
    const giris = K.Ledger([dunkuEntry(), formEntry(), symptomEntry(), statusEntry(), whyEntry()].filter(Boolean));
    const ozet = K.Ledger([readinessEntry(), nutritionEntry(), minimumEntry(),
      SP.HatirlatUI ? SP.HatirlatUI.ozetEntry() : null, officeEntry(), moneyEntry()].filter(Boolean));
    const gecmis = K.Ledger([historyEntry(), baselineEntry()]);
    return String(html`
      ${when(banners.length, () => html`<div class="stack-sm mb-16">${banners}</div>`)}
      ${when((S.ui.hkmBildirim || []).length, () => html`<div class="mb-16">${K.Ledger([kingBildirimRow()])}</div>`)}
      <div class="mb-16">${K.Ledger([hkmSeritRow()].concat(SP.Seri ? [seriRow()] : []))}</div>
      ${K.SayfaBolumleri({ act:'day-tab', aria:'Günün bölümleri', bolumler:[
        { id:'giris', ad:'Giriş', govde:giris },
        { id:'ozet', ad:'Özet', govde:ozet },
        { id:'gecmis', ad:'Geçmiş', govde:gecmis },
      ] })}
      <div class="mt-24">${raw(UI.rail(['readiness', 'ref-range', 'next-action', 'minimum-day', 'certainty']))}</div>`);
  }

  /* Başka ekrandan istenen bölüm (Bugün'deki «Bütün alanlar» gibi)
     çizimden sonra görünür yapılır. */
  function afterRenderAyrinti(){
    const t = S.ui.dayTab;
    S.ui.dayTab = null;
    if(t && t !== 'giris') K.bolumeGit(t);
  }

  /* PLAN › HEDEFLER. Hedefler Bugün'ün Özet sekmesindeydi; kural «Plan:
     hafta, hedefler, merdiven tek yerde» (CEKMECE-HARITASI). Kart ve
     işleyiciler aynı: plan önizlemesi, uyarlama ve geri alma burada. */
  async function renderHedefler(){
    const e = hedefEntry();
    if(!e) return String(K.Kutu({ ad:'Hedef motoru yüklenmedi',
      govde:html`<p class="small muted">Hedefler bu derlemede yok; diğer ekranlar çalışmaya devam eder.</p>` }));
    return String(html`${K.Ledger([e])}`);
  }

  async function dunkuEkle(tur, id){
    const bugun = U.todayISO();
    const r = tur === 'ogun' ? await SP.Dunku.ogunKopyala(bugun, id) : await SP.Dunku.antrenmanKopyala(bugun, id);
    if(!r.ok){ UI.toast(r.why); return; }
    UI.toast(r.ad + ' bugüne eklendi', { undo:async () => { await SP.Dunku.geriAl(bugun, tur, r.id); SP.App.render(); } });
    SP.App.render();
  }

  /* Öneri alanındaki kartın düğmeleri Onaylar ekranının işleyicilerine
     gider: onay TEK yoldan geçer, iki ekranda iki ayrı kod durmaz. */
  const ONAY_EYLEMLERI = ['king-onayla', 'king-parca', 'king-iptal', 'hkm-toplu', 'hkm-intent-yes',
    'hkm-intent-apply', 'hkm-intent-no', 'hkm-doubt-ok', 'bekleyen-onay', 'bekleyen-ret'];
  const onayIsleyici = a => el => SP.Screens.onaylar.handle[a](el);

  const handle = {
    async 'dunku-ogun'(el){ await dunkuEkle('ogun', el.dataset.id); },
    async 'dunku-antrenman'(el){ await dunkuEkle('antrenman', el.dataset.id); },
    async 'kotu-gun'(){
      const r = await SP.KotuGun.ac();
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast('Kötü gün modu açık: yük hafifledi, asgari gün yeter.', { undo:async () => {
        await SP.KotuGun.kapat(r.gun); SP.App.render(); } });
      SP.App.render();
    },
    async 'kotu-gun-kapat'(){
      const r = await SP.KotuGun.kapat();
      if(r.ok) UI.toast('Normal güne dönüldü');
      SP.App.render();
    },
    async 'seri-hasta'(){
      const r = await SP.Seri.dondur(U.todayISO(), null, 'hasta');
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast('Bugün donduruldu; seri bozulmaz. Geçmiş olsun.', { undo:async () => {
        await SP.Seri.coz(r.kayit.id); SP.App.render(); } });
      SP.App.render();
    },
    async 'seri-coz'(el){ await SP.Seri.coz(el.dataset.id); UI.toast('Dondurma geri alındı'); SP.App.render(); },
    async 'seri-tatil'(){ S.ui.tatilSec = true; SP.App.render(); },
    async 'seri-tatil-vazgec'(){ S.ui.tatilSec = false; SP.App.render(); },
    async 'seri-tatil-sinir'(){
      const e = document.getElementById('seri-tatil-sinir');
      const ham = e ? String(e.value).trim() : '';
      if(!ham){ UI.toast('Yıllık tatil sınırı için bir gün sayısı yaz.'); return; }
      const r = await SP.Seri.yillikTatilAyarla(Number(ham));
      if(!r.ok){ UI.toast(r.why, { life:5000 }); return; }
      SP.App.render();
      UI.toast('Yıllık tatil sınırı ' + r.sinir + ' gün', { undo:async () => {
        await SP.Seri.yillikTatilAyarla(r.onceki); SP.App.render(); } });
    },
    async 'seri-tatil-gun'(el){
      S.ui.tatilSec = false;
      const bugun = U.todayISO();
      const bit = SP.Seri.gunEkle(bugun, Number(el.dataset.gun) - 1);
      const r = await SP.Seri.dondur(bugun, bit, 'tatil');
      UI.toast(r.ok ? 'Tatil modu ' + U.fmtShort(bugun) + ' – ' + U.fmtShort(bit) + ': seri korunuyor, HKM soru sormuyor'
        : r.why, { life:5000 });
      if(r.ok && SP.Hedefler && SP.Hedefler.ag) SP.Hedefler.ag.planla();
      SP.App.render();
    },
    async 'seri-tatil-bitir'(){
      const r = await SP.Seri.tatiliBitir();
      UI.toast(r.ok ? 'Tatil bitti; hoş geldin' : r.why);
      if(r.ok && SP.Hedefler && SP.Hedefler.ag) SP.Hedefler.ag.planla();
      SP.App.render();
    },
    async 'hedef-durum'(el){
      const r = await SP.Hedefler.durumDegistir(el.dataset.id, el.dataset.durum);
      UI.toast(r.ok ? 'Hedef güncellendi' + (r.not ? '. ' + r.not : '') : r.why);
      SP.App.render();
    },
    async 'hedef-plan-onizle'(el){ S.ui.planOnizle = el.dataset.id; SP.App.render(); },
    async 'hedef-plan-kapat'(){ S.ui.planOnizle = null; SP.App.render(); },
    async 'hedef-plan-uygula'(el){
      const r = await SP.Plan.uygulaHedef(el.dataset.id);
      S.ui.planOnizle = null;
      if(r.ok) SP.UI.onayMuhru();
      UI.toast(r.ok ? 'Plan uygulandı. Geri almak istersen «Planı geri al».' : r.why);
      SP.App.render();
    },
    async 'hedef-uyarla-ac'(el){ S.ui.uyarla = el.dataset.id; SP.App.render(); },
    async 'hedef-uyarla-kapat'(){ S.ui.uyarla = null; SP.App.render(); },
    async 'hedef-uyarla-sec'(el){
      const H = window.LIFEOS.Hedef;
      const h = SP.Hedefler.liste().find(x => x.id === el.dataset.id);
      if(!h) return;
      const paket = SP.Hedefler.PAKETLER.find(x => x.id === h.paket);
      const bugun = U.todayISO();
      const u = H.uyarla(h, paket, {}, bugun);
      const x = u.senaryolar[Number(el.dataset.i)];
      if(!x){ UI.toast('Bu seçenek artık geçerli değil; yeniden hesapla.'); return; }
      const g = await SP.Plan.geriAlHedef(h.id);
      if(!g.ok && SP.Plan.aktif(h.id)){ UI.toast(g.why || 'Eski plan geri alınamadı; hedef değişmedi.'); return; }
      await SP.Hedefler.kaydet(H.uyarlamaUygula(u.hedef, x, paket, {}, bugun));
      S.ui.uyarla = null;
      S.ui.planOnizle = h.id;
      UI.toast('Hedef yeni tarihle güncellendi; yeni planı önizleyip onayla.');
      SP.App.render();
    },
    async 'hedef-plan-geri'(el){
      const r = await SP.Plan.geriAlHedef(el.dataset.id);
      UI.toast(r.ok ? 'Plan geri alındı; beslenme hedefin plandan önceki haline döndü.'
        : (r.why || 'Geri alınamadı'));
      SP.App.render();
    },
    async 'hedef-plan-king'(el){
      const r = await SP.Plan.kingeIlet(el.dataset.id);
      UI.toast(r.metin);
      SP.App.render();
    },
    async 'king-bildirim-okundu'(el){
      const id = el.dataset.id;
      S.ui.hkmBildirim = (S.ui.hkmBildirim || []).filter(b => String(b.id) !== String(id));
      SP.App.render();
      const r = await SP.Plan.okundu(id);
      if(!r.ok) UI.toast('Okundu işareti merkeze bildirilemedi; bildirim HKM’de okunmamış kalır.');
    },
    /* Elle gonderim: kullanicinin ACIKCA istedigi an. Kapaliyken
       zorlanmaz — kapali bir seyi «bir kerelik» calistirmak, kapali
       olmasini anlamsiz kilardi. */
    async 'hkm-gonder'(){
      UI.toast('HKM\u2019ye gönderiliyor…');
      const r = await SP.Beacon.send({ reason:'manual' });
      UI.toast(r.ok ? 'HKM\u2019ye gönderildi.'
        : ('Gönderilemedi — ' + (r.note || r.reason || 'sebep bilinmiyor')));
      SP.App.render();
    },

    async 'signal-answer'(el){
      const inp = document.getElementById('sig-answer');
      const r = await SP.Signals.answer(el.dataset.id, inp ? inp.value : '');
      if(!r.ok){ UI.toast(r.error); return; }
      UI.toast('Kaydedildi. Sonucu bir sonraki pencere gösterecek.');
      SP.App.render();
    },

    async 'signal-dismiss'(el){
      await SP.Signals.dismiss(el.dataset.id);
      UI.toast('Soru kapatıldı');
      SP.App.render();
    },

    /* Eski sekme eylemi: Ayrıntı'nın bölümüne gider. Başka ekrandaysa önce
       Ayrıntı açılır, bölüm çizimden sonra görünür yapılır. */
    async 'day-tab'(el){
      const t = el.dataset.tab || 'giris';
      if(S.route !== 'gun'){ S.ui.dayTab = t; SP.App.go('gun'); return; }
      K.bolumeGit(t);
    },
    async 'shift-day'(el){
      const n = Number(el.dataset.value);
      S.ui.mealDate = n === 0 ? null : U.iso(U.addDays(U.parse(shownDate()), n));
      if(S.ui.mealDate === U.todayISO()) S.ui.mealDate = null;
      SP.App.render();
    },
    /* Şiddet tek düğmeden döner: hafif → orta → şiddetli → kapalı.
       Ayrı bir seçici koymak günlük giriş yükünü artırırdı. */
    async 'cycle-symptom'(el){
      const d = shownDate();
      const simdi = SP.Symptom.ofDay(d)[el.dataset.id] || 0;
      const sonraki = simdi >= 3 ? 0 : simdi + 1;
      await SP.Symptom.setSymptom(d, el.dataset.id, sonraki);
      await M.saveVitals(d, { symptomsLogged:true });
      SP.App.render();
    },
    async 'no-symptoms'(){
      const d = shownDate();
      await M.saveVitals(d, { symptoms:{}, symptomsLogged:true });
      UI.toast('Bugün şikâyet yok olarak kaydedildi');
      SP.App.render();
    },
    async 'toggle-period'(el){
      const d = shownDate();
      await M.saveVitals(d, { period:!!el.checked });
      SP.App.render();
    },
    async 'open-day'(el){
      S.ui.mealDate = el.dataset.date === U.todayISO() ? null : el.dataset.date;
      SP.App.render();
    },
    async 'set-soreness'(el){
      await M.saveVitals(shownDate(), { soreness:Number(el.dataset.value) });
      SP.App.render();
    },
    async 'save-vitals'(){
      const patch = {};
      FIELDS.forEach(f => {
        const el = document.getElementById('v-' + f.id);
        if(!el) return;
        const raw = el.value.trim();
        patch[f.id] = raw === '' ? null : Number(raw.replace(',', '.'));
      });
      const note = document.getElementById('v-note');
      if(note) patch.note = note.value.trim();
      await M.saveVitals(shownDate(), patch);
      const flags = M.openFlags().filter(f => !f.ack);
      UI.toast(flags.length ? 'Kaydedildi — ' + flags.length + ' kırmızı bayrak açık' : 'Kaydedildi');
      SP.App.render();
    },
  
    async 'flag-ack'(el){
      await M.ackFlag(el.dataset.id);
      UI.toast('İşaretlendi — kayıt geçmişte duruyor');
      SP.App.render();
    },
    async 'refresh-briefing'(){
      UI.toast('Brifing üretiliyor…');
      await SP.Office.dailyBriefing(true);
      SP.App.render();
    },
    async 'quick-meal'(){
      const el = document.getElementById('quick-meal');
      if(!el || !el.value.trim()) return;
      const parsed = SP.Parse.parseMeal(el.value);
      if(!parsed.items.length){ UI.toast(parsed.note); return; }
      const slot = SP.Screens.meals.guessSlot();
      const meal = M.newMeal(slot);
      meal.items = parsed.items.map(i => ({ foodId:i.foodId, g:i.g, cert:i.cert, portion:i.portion }));
      meal.note = el.value.trim();
      await M.addMeal(U.todayISO(), meal);
      el.value = '';
      UI.toast(parsed.items.length + ' gıda eklendi'
        + (parsed.unmatched.length ? ' · ' + parsed.unmatched.length + ' parça eşleşmedi' : ''));
      SP.App.render();
    },
  };

  ONAY_EYLEMLERI.forEach(a => { handle[a] = onayIsleyici(a); });

  return {
    id:'today',
    title:'Bugün',
    /* Bu sayfanın başlığı BUGÜNÜ anlatır. Sıradaki hamle başka bir
       bölüme aitse (tahlil, sepet) onu buraya başlık yapmak kafa
       karıştırıyordu: kullanıcı günlük sayfasını açıp tahlil cümlesi
       okuyordu. Hamle artık düğme olarak duruyor, başlık olarak değil. */
    headline(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      if(!r.ok) return 'Bugünün verisi henüz girilmedi.';
      const m = SP.Calc.minimumDay();
      if(m.complete) return 'Bugün tamam — toparlanma '
        + r.band.label.toLocaleLowerCase('tr-TR') + '.';
      return 'Toparlanma ' + r.band.label.toLocaleLowerCase('tr-TR') + '.';
    },
    lede(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      if(!r.ok){
        return 'Uyku süresini yazman bile yeter: tek girdiyle anlamlı bir sonuç '
          + 'çıkar. Boş bıraktığın alan sıfır sayılmaz, hesaba hiç girmez.';
      }
      const m = SP.Calc.minimumDay();
      const eksik = m.rows.filter(x => !x.ok).map(x => x.label.toLocaleLowerCase('tr-TR'));
      return r.band.order
        + (eksik.length ? ' Asgari gün için kalan: ' + eksik.join(', ') + '.' : '');
    },
    stats(){
      const m = SP.Calc.minimumDay();
      const r = SP.Move.readiness(shownDate());
      const out = [];
      if(r.ok) out.push({ value:r.score, unit:'/100', label:'toparlanma' });
      out.push({ value:m.done + '/' + m.total, label:'asgari gün' });
      out.push({ value:SP.Calc.streak(), label:'gün seri' });
      const f = M.openFlags().filter(x => !x.ack).length;
      if(f) out.push({ value:f, label:'kırmızı bayrak' });
      return out.slice(0, 4);
    },
    subtitle(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      return U.fmtDate(d) + (r.ok ? ' · toparlanma ' + r.score : ' · veri bekliyor');
    },
    actions(){
      const n = SP.Calc.nextAction();
      /* «Bütün alanlar» ölçüm kutusunda; burada yalnız sıradaki hamle
         (başka bir ekrana aitse). */
      return String(html`${when(!n.calm && n.route !== 'today', () => K.Button({ label:n.action || 'Aç',
          size:'sm', act:'go', data:{ 'data-route':n.route } }))}`);
    },
    render, handle,
    /* Bugün › Ayrıntı: aynı işleyiciler, ayrı bir çizim. */
    ayrinti:{
      id:'gun',
      title:'Günün ayrıntısı',
      subtitle(){ return 'Ölçüm formu, şikâyetler, özet ve son iki hafta'; },
      actions(){ return ''; },
      render:renderAyrinti, afterRender:afterRenderAyrinti, handle,
    },
    /* Plan › Hedefler: aynı işleyiciler, ayrı bir çizim. */
    hedefler:{
      id:'hedefler',
      title:'Hedefler',
      subtitle(){
        const n = SP.Hedefler ? SP.Hedefler.aktifler().length : 0;
        return n ? n + ' etkin hedef' : 'henüz hedef yok';
      },
      lede(){ return 'Hedef Danışma’da konuşularak konur; planı burada önizler, onaylar ya da geri alırsın.'; },
      actions(){ return ''; },
      render:renderHedefler, handle,
    },
  };
})();

SP.Screens.gun = SP.Screens.today.ayrinti;
SP.Screens.hedefler = SP.Screens.today.hedefler;
