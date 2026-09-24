/* Bugün — günlük operasyon ekranı.

   ŞABLON DÜZENİ (diğer ekranlar için referans):
   - Görünüm h.html`` ile yazılır; araya giren değerler otomatik kaçırılır.
   - Yapı parçaları C.* bileşenlerinden gelir (Card, Stat, Button, Notice…).
   - Yapısal HTML gerektiğinde h.raw() ile işaretlenir.
   - Etkileşim yalnız data-act / data-change ile bağlanır; inline onclick yok.
   - render() tek bir C.Grid döndürür; kolonlar C.Span ile verilir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.today = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const c = R.C;

  function todayDoc(){ return S.days[U.todayISO()]; }

  /* ---------- zamanlayici ---------- */
  let tickHandle = null;

  function runningBlock(){
    const day = todayDoc();
    return day ? (day.blocks.find(b => b.startedAt) || null) : null;
  }
  function elapsedSeconds(block){
    if(!block || !block.startedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(block.startedAt).getTime())/1000));
  }
  /* Verimli saat (calc.verimliSaat, fikir 21): zamanlayıcı oturumunun
     BAŞLADIĞI saat ve süresi ölçümdür; blokta saklanır. */
  function oturumYaz(block, dk){
    if(!block || !block.startedAt || !(dk > 0)) return;
    block.oturumlar = (block.oturumlar || []).concat([{ bas:block.startedAt, dk }]).slice(-12);
  }
  function startTick(){
    stopTick();
    tickHandle = setInterval(() => {
      const b = runningBlock();
      const el = document.getElementById('timer-clock');
      if(!b || !el){ stopTick(); return; }
      el.textContent = U.fmtClock(elapsedSeconds(b));
    }, 1000);
  }
  function stopTick(){
    if(tickHandle){ clearInterval(tickHandle); tickHandle = null; }
  }

  /* ---------- parcalar ---------- */

  function AnchorTile(o){
    const pct = o.target ? Math.min(100, 100*o.actual/o.target) : 0;
    const step = d => c.Button({ label:d > 0 ? '+'+d : '−', size:'sm', class:'grow',
      aria:(d > 0 ? 'artır' : 'azalt'), act:'anchor', data:{ 'data-kind':o.kind, 'data-delta':d } });
    return c.Card({ pad:'sm', body:html`
      <div class="stack-xs">
        <div class="row between">
          <span class="stat__label">${o.label}</span>
          ${o.actual >= o.target ? c.Badge({ label:'tamam', tone:'ok' }) : html`<span class="tiny dim">${o.hint}</span>`}
        </div>
        <span class="anchor__value num">${o.actual}<span class="dim">/${o.target}</span></span>
        ${c.Bar({ value:pct, tone:'' })}
        <div class="row row--tight">${step(-1)}${step(1)}${step(5)}</div>
      </div>` });
  }

  /* Plan dışı soru: «soru 40» (Telegram, derssiz giriş) bir bloğa değil
     günün toplamına yazılır; burada görünmezse kayıt kaybolmuş sanılır. */
  function AnchorPane(day){
    const serbest = Number(day.freeQ) || 0;
    const dogru = day.freeCorrect == null ? null : Number(day.freeCorrect);
    return html`${c.Cols(2, html`
      ${AnchorTile({ label:'Paragraf', actual:day.paragraphActual, target:day.paragraphTarget, kind:'paragraph', hint:'günlük 15–20' })}
      ${AnchorTile({ label:'Problem', actual:day.problemActual, target:day.problemTarget, kind:'problem', hint:'günlük 15–20' })}`)}
      ${when(serbest > 0, () => html`<p class="tiny dim mt-6">Plan dışı: ${serbest} soru${
        dogru ? ' · ' + dogru + ' doğru' : ''} — bir derse bağlanmadan girildi, günün toplamına yazıldı.</p>`)}`;
  }

  function StatusBadge(status){
    const m = { done:['Tamamlandı','ok'], partial:['Yarım','warn'], skipped:['Atlandı','muted'], pending:['Bekliyor','muted'] };
    const [label, tone] = m[status] || m.pending;
    return c.Badge({ label, tone, icon:status === 'done' });
  }

  const STATUSES = [['pending','Bekliyor'],['done','Tamamlandı'],['partial','Yarım'],['skipped','Atlandı']];

  /* GÜNÜN ODAK ROZETİ — blokların başlığının yanında, o günün
     raporunda. Başarımlar sekmesindeki odak rozeti ömürlük rekordur;
     bu ise BU GÜNÜN kendisi (bkz. core/basarim.js, gununOdagi).
     Yalnız ÖLÇÜLMÜŞ süre sayılır: `actualMin` boş bırakılan blok
     «sıfır dakika» değil «veri yok»tur. Eşiğin altındaki gün rozet
     almaz ve boş döner. */
  function OdakRozeti(day){
    if(!R.Basarim) return '';
    const dk = ((day && day.blocks) || []).reduce(function(t, b){
      return t + (b && b.actualMin != null ? Number(b.actualMin) || 0 : 0);
    }, 0);
    return R.Basarim.odakHtml(dk);
  }

  function BlockCard(b){
    const running = !!b.startedAt;
    const done = b.status === 'done' || b.status === 'partial';
    const acc = (b.actualQ && b.correctQ != null) ? U.pct(b.correctQ, b.actualQ) : null;

    const numField = (label, field, value) => c.Field({ label, input:c.Input({
      type:'number', min:0, size:'sm', numeric:true, value:value == null ? '' : value,
      change:'block-num', data:{ 'data-field':field, 'data-block':b.id } }) });

    return html`
      <article class="${R.h.cls('block', running && 'is-running', !running && b.status === 'done' && 'is-done',
        !running && b.status === 'partial' && 'is-partial', b.status === 'skipped' && 'is-skipped')}">
        <div class="row between block__top">
          <div class="grow">
            <div class="block__slot">${b.slot} · ${b.targetMin} dk${when(b.targetQ, () => html` · ${b.targetQ} soru`)}</div>
            ${c.Input({ class:'input--ghost block__topic', value:b.topic, aria:'blok konusu',
              change:'block-topic', data:{ 'data-block':b.id } })}
            <div class="tiny dim block__subject">${b.subject}</div>
          </div>
          ${running
            ? html`<div class="stack-xs block__timer-wrap">
                <span class="block__timer" id="timer-clock">${U.fmtClock(elapsedSeconds(b))}</span>
                ${c.Button({ label:'Bitir', icon:'stop', tone:'primary', size:'sm', act:'timer-stop', data:{ 'data-block':b.id } })}
              </div>`
            : b.status === 'pending'
              ? c.Button({ label:'Başlat', icon:'play', size:'sm', act:'timer-start', data:{ 'data-block':b.id } })
              : StatusBadge(b.status)}
        </div>

        ${c.Segmented({ items:STATUSES.map(s => ({ value:s[0], label:s[1] })), value:b.status,
          act:'block-status', block:true, primary:true, aria:'blok durumu', data:{ 'data-block':b.id } })}

        ${c.Cols(2, html`
          ${c.Field({ label:'Ders', input:c.Select({ size:'sm', value:b.subjectId || '',
            change:'block-subject', data:{ 'data-block':b.id },
            options:[{ value:'', label:'— bağlanmadı —' }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name }))) }) })}
          ${c.Field({ label:'Konu', input:c.Select({ size:'sm', value:b.topicId || '',
            change:'block-topic-ref', data:{ 'data-block':b.id },
            options:blockTopicOptions(b.subjectId) }) })}
        `)}

        ${when(done, () => html`
          <div class="cols-3">
            ${numField('Dakika','actualMin', b.actualMin)}
            ${numField('Soru','actualQ', b.actualQ)}
            ${numField('Doğru','correctQ', b.correctQ)}
          </div>
          ${when(acc != null, () => html`<div class="${acc >= 70 ? 'tiny dim' : 'tiny tone-warn'}">Doğruluk %${acc}${acc < 70 ? ' — hedef eşiğin altında' : ''}</div>`)}`)}

        ${when(b.status === 'skipped', () => html`
          <div class="stack-xs">
            <span class="mono-label">Neden atlandı?</span>
            <div class="row wrap row--tight">
              ${map(R.SKIP_REASONS, r => c.Chip({ label:r, on:b.skipReason === r, act:'skip-reason',
                data:{ 'data-block':b.id, 'data-reason':r } }))}
            </div>
          </div>`)}
      </article>`;
  }

  function blockTopicOptions(subjectId){
    const s = R.SUBJECTS.find(x => x.id === subjectId);
    if(!s) return [{ value:'', label:'— önce ders —' }];
    return [{ value:'', label:'— konu —' }].concat(s.topics.map(t => ({ value:t.id, label:t.name })));
  }

  /* «15 dakikam var» (fikir 18): aynı kart, süreye SIĞAN öneriyle
     (calc.js onbesDakika). «Tam plan» normal sıradaki işe döner. */
  function NextUpCard(){
    const kisa = !!S.ui.onbesDk;
    const a = kisa ? C.onbesDakika(15) : C.nextAction();
    const clickable = a.route || a.act;
    return c.NextUp({
      icon:a.icon, label:a.label, title:a.title, why:a.why, hint:'next-action', calm:a.tone === 'calm',
      /* Yalniz sakin halde cizilir: AYS'nin isi hedeftir. */
      sanat:'hedef',
      action:html`${when(clickable, () => c.Button({ label:'Başla', tone:'primary', act:'next-action',
        data:{ 'data-route':a.route || '', 'data-next':a.act || '', 'data-block':a.blockId || '' } }))}
        ${c.Button({ label:kisa ? 'Tam plan' : '15 dakikam var', size:'sm', tone:'ghost', act:'onbes-dk' })}`,
    });
  }

  function StreakCard(){
    const s = C.behaviorStreak();
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">Davranış serisi${raw(UI.hint('streak'))}</span>
        <b class="num">${s.streak}<span class="dim streak__unit"> gün</span></b>
      </div>
      <div class="streak">
        <div class="streak__dots">
          ${map(s.days, d => html`<span class="${R.h.cls('streak__dot', d.met && 'is-on', d.today && 'is-today')}"
            title="${U.fmtShort(d.iso)}${d.met ? ' · tamam' : ''}"></span>`)}
        </div>
      </div>
      <p class="tiny dim">${s.streak === 0 ? 'Minimum standardı tutturunca seri başlar.' : 'Ödül nete değil düzene bağlı.'}</p>
      ${SeriKontrol()}` });
  }

  /* Seri dondurma ve tatil modu (brand/ortak/seri.js, core/tatil.js): hasta
     gün ve tatil seriyi bozmaz; tatilde plan ara, dönüşte iki gün yarım süre. */
  /* Yıllık tatil sınırı kullanıcının ayarıdır (kullanıcı kararı 2026-09-24;
     brand/ortak/seri.js). Düşürmek var olan tatili silmez. */
  function TatilSiniri(){
    const sinir = R.Seri.yillikTatil(), kalan = R.Seri.kalanTatil();
    return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny dim">Yıllık tatil sınırı: bu yıl kalan ${kalan} / ${sinir} gün</span>
      ${c.Input({ id:'seri-tatil-sinir', type:'number', size:'sm', numeric:true, value:sinir,
        aria:'yıllık tatil sınırı, gün' })}
      ${c.Button({ label:'Sınırı kaydet', size:'sm', act:'seri-tatil-sinir' })}</div>`;
  }

  function SeriKontrol(){
    if(!R.Seri) return '';
    const bugun = U.todayISO();
    const t = R.Seri.aktifTatil(bugun);
    const k = R.Seri.kayitOf(bugun);
    if(t) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">Tatil modu: ${U.fmtShort(t.bas)} – ${U.fmtShort(t.bit)} · seri korunuyor, HKM soru sormuyor</span>
      ${c.Button({ label:'Tatili bitir', size:'sm', act:'seri-tatil-bitir' })}</div>`;
    if(k) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">Bugün dondurulmuş (${LIFEOS.Seri.NEDEN[k.neden].toLocaleLowerCase('tr')}) · seri bozulmaz</span>
      ${c.Button({ label:'Geri al', size:'sm', act:'seri-coz', data:{ 'data-id':k.id } })}</div>`;
    if(S.ui.tatilSec) return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny">Kaç gün?</span>
      ${map([3, 7, 14], n => c.Button({ label:n + ' gün', size:'sm', act:'seri-tatil-gun', data:{ 'data-gun':String(n) } }))}
      ${c.Button({ label:'Vazgeç', size:'sm', act:'seri-tatil-vazgec' })}</div>
      ${TatilSiniri()}`;
    return html`<div class="row wrap gap-6 mt-6">
      ${c.Button({ label:'Bugün hastayım · seri donsun', size:'sm', act:'seri-hasta' })}
      ${c.Button({ label:'Tatil modu', size:'sm', act:'seri-tatil' })}</div>`;
  }

  function SleepCard(day){
    const avg = C.sleepAverage(7);
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">Uyku${raw(UI.hint('sleep'))}</span>
        ${when(avg != null, () => html`<span class="tiny dim">7 gün ort. ${avg} sa</span>`)}
      </div>
      <div class="row sleep__row">
        ${c.Input({ type:'number', step:0.5, min:0, max:14, size:'sm', numeric:true, class:'sleep__input',
          value:day.sleepHours == null ? '' : day.sleepHours, aria:'uyku saati', change:'sleep' })}
        <span class="small muted">saat · hedef ${S.profile.sleepTarget}</span>
      </div>
      ${when(day.sleepHours != null && day.sleepHours < 6.5,
        () => html`<p class="tiny tone-warn">Uyku bellek pekişmesinin parçasıdır — bugünkü hedefi hafiflet.</p>`)}` });
  }

  function RitualCard(day){
    const ritual = R.WEEKDAYS[day.dow].ritual;
    if(!ritual) return '';
    const list = R.CHECKLISTS[{ contract:'monday', exam:'saturday', review:'sunday' }[ritual]];
    const state = day.checklist || {};
    const cta = ritual === 'contract'
      ? c.Button({ label:'Haftalık sözleşmeyi aç', tone:'primary', block:true, act:'go', data:{ 'data-route':'week' } })
      : ritual === 'exam'
        ? c.Button({ label:'Deneme ekle', tone:'primary', block:true, act:'go', data:{ 'data-route':'exams' } })
        : c.Button({ label:'Weekly review’u aç', tone:'primary', block:true, act:'open-review' });

    return c.Card({ title:list.label, sub:'Bugünün ritüeli', body:html`
      <div class="stack-xs">
        ${map(list.items, (it, i) => c.Checkbox({ label:it, checked:!!state[ritual+'-'+i],
          act:'checklist', data:{ 'data-key':ritual+'-'+i } }))}
      </div>
      <div class="ritual__cta">${cta}</div>` });
  }

  function DueCards(){
    const due = C.dueCards().sort((a,b) => a.dueAt.localeCompare(b.dueAt));
    const overdue = C.overdueCards().length;
    if(!due.length){
      return c.Card({ title:'Due kartlar', badge:c.Badge({ label:'temiz', tone:'ok' }),
        body:html`<p class="small muted">Bugün için bekleyen kart yok. Yeni kartlar deneme analizinden otomatik üretilir.</p>` });
    }
    const card = due[0];
    const flipped = !!S.ui.flipped[card.id];
    const rate = (rating, label, tone) => c.Button({ label, tone, class:'grow', act:'rate',
      data:{ 'data-id':card.id, 'data-rating':rating } });

    return c.Card({
      title:'Due kartlar', sub:due.length+' kart bekliyor'+(overdue ? ' · '+overdue+' gecikmiş' : ''),
      actions:c.Button({ label:'Tümü', size:'sm', act:'go', data:{ 'data-route':'cards' } }),
      body:html`
        <div class="flashcard flashcard--sm" data-act="flip" data-id="${card.id}" role="button" tabindex="0">
          <span class="flashcard__side">${flipped ? 'Arka' : 'Ön'}</span>
          <span class="flashcard__text">${flipped ? (card.back || '—') : card.front}</span>
        </div>
        ${flipped
          ? html`<div class="row row--tight due__actions">
              ${rate('forgot','Hatırlamadım','danger')}${rate('hard','Zorlandım')}${rate('remembered','Hatırladım','primary')}
            </div>`
          : html`<p class="tiny dim center due__hint">Cevabı görmek için karta dokun</p>`}` });
  }

  function RepairQueue(){
    const open = C.openErrors().filter(e => !e.repairDoneAt).slice(0, 6);
    if(!open.length) return '';
    return c.Card({ title:'Tamir kuyruğu', sub:'Açık yanlışların reçeteleri',
      actions:c.Button({ label:'Yanlış defteri', size:'sm', act:'go', data:{ 'data-route':'cards', 'data-tab':'notebook' } }),
      body:html`<div class="list">
        ${map(open, e => html`
          <div class="listitem">
            ${raw(UI.tagDot(e.tag))}
            <div class="grow">
              <div class="small strong">${e.topic || e.testName || 'Yanlış'}</div>
              <div class="tiny dim">${e.recipe}</div>
            </div>
            ${c.Button({ label:'Yapıldı', size:'sm', act:'repair-done', data:{ 'data-id':e.id } })}
          </div>`)}
      </div>` });
  }

  function WeekContext(week, n){
    const comp = C.planCompletion(n);
    const qr = C.questionRealization(n);
    const phase = M.phaseOf(n);
    return c.Card({
      title:'Hafta '+n+' bağlamı', sub:phase.label+' — '+phase.theme,
      actions:c.Button({ label:'Aç', size:'sm', act:'go', data:{ 'data-route':'week' } }),
      body:html`
        <div class="stack-sm">
          <div class="stack-xs">
            <span class="mono-label">Bu haftanın ana konuları</span>
            ${map(week.mainTopics, t => html`
              <div class="row between"><span class="small">${t.name}</span>
              <span class="tiny dim num">${t.questionTarget} soru · %${t.accuracy}</span></div>`)}
          </div>
          ${when(comp != null, () => c.Meter({ label:'Plan tamamlama', value:comp }))}
          ${when(qr && qr.pct != null, () => c.Meter({ label:'Soru gerçekleşme', value:qr.pct, text:qr.solved+' / '+qr.target }))}
          ${c.Notice({ body:week.checkpoint, tone:'info' })}
        </div>` });
  }

  /* ---------- hedeflerim ----------
     HEDEFLERİM (core/hedefler.js + core/hedefplan.js). Hedef Ekip sohbetinde
     Patron'la konuşarak kurulur: «TYT matematiği 100 günde bitirmek istiyorum»,
     «TYT'de 90 nete çıkmak istiyorum». Burada görünür, planı kurulur,
     askıya alınır, bırakılır. PLAN BÜYÜK AKSİYONDUR (AGENTS.md §1.9): önce
     ayrıntılı önizleme, sonra «Planı uygula» — önizleme onayın kendisidir —
     ve her zaman «Planı geri al». Sayılar ve cümleler motorundur; ekran
     yalnız çizer. */
  const BANT = { gercekci:'gerçekçi', zorlayici:'zorlayıcı',
    gercekci_degil:'bu sürede olmaz', guvensiz:'güvenli değil' };

  function hedefDugmeleri(h){
    return html`
      ${h.durum === 'aktif'
        ? c.Button({ label:'Askıya al', size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'askida' } })
        : c.Button({ label:'Sürdür', size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'aktif' } })}
      ${c.Button({ label:'Tamamlandı', size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'tamam' } })}
      ${c.Button({ label:'Bırak', size:'sm', tone:'ghost', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'birakildi' } })}`;
  }

  function haftaSatiri(w){
    const P = R.HedefPlan;
    const parca = w.konular.map(k => k.name + (k.bitti ? '' : ' (sürüyor)'));
    return html`<div class="stack-xs">
      ${when(parca.length, () => html`<p class="tiny"><b>Konular:</b> ${parca.join(' · ')}</p>`)}
      ${when(w.deneme, () => html`<p class="tiny"><b>Deneme günü:</b> ${w.deneme.ad} (çözüm + analiz ${P.dkYaz(w.deneme.dk)})</p>`)}
      ${when(w.tekrar.length, () => html`<p class="tiny"><b>Tekrar:</b> ${w.tekrar.join(' · ')}</p>`)}
    </div>`;
  }

  function hedefOnizleme(h){
    const r = R.HedefPlan.kur(h, U.todayISO());
    if(!r.ok){
      return html`<div class="mt-8">${c.Notice({ tone:'warn', title:'Plan kurulamadı.', body:r.why })}
        <div class="row gap-8 mt-8">${c.Button({ label:'Kapat', size:'sm', act:'hedef-plan-kapat' })}</div></div>`;
    }
    const p = r.plan;
    return html`<div class="mt-8">
      <p class="tiny dim"><b>Plan önizlemesi</b> — onaylanana kadar hiçbir şey değişmez.</p>
      ${c.Table({ tight:true, headers:['', 'Şimdi', 'Plandan sonra'],
        rows:R.HedefPlan.onizleme(p).map(x => [x.alan, x.once, x.sonra]) })}
      ${when(p.paket === 'konu' && p.haftalar.length, () => html`<p class="tiny mt-8"><b>İlk hafta</b>
        (${U.fmtShort(p.haftalar[0].bas)} – ${U.fmtShort(p.haftalar[0].bit)})</p>${haftaSatiri(p.haftalar[0])}`)}
      ${when(p.paket === 'net', () => html`<p class="tiny mt-8"><b>Kontrol noktaları:</b>
        ${p.kontroller.map(k => U.fmtShort(k.tarih) + ' → ' + U.fmtNet(k.beklenen)).join(' · ')}</p>`)}
      ${when(p.uyarilar.length, () => html`<div class="stack-sm mt-8">${map(p.uyarilar, u =>
        c.Notice({ tone:'info', body:u }))}</div>`)}
      <p class="tiny dim mt-8">Plan ${p.etiket === 'hesaplandi' ? 'kendi denemelerinden hesaplandı'
        : 'müfredatın süre tahminlerine dayanır (tahmin)'}. Geri alınabilir; geri alınca hafta
        taslağı eski sırasına döner.</p>
      <div class="row gap-8 mt-8" style="flex-wrap:wrap">
        ${c.Button({ label:'Planı uygula', size:'sm', tone:'primary', act:'hedef-plan-uygula',
          data:{ 'data-id':h.id } })}
        ${c.Button({ label:'Şimdilik değil', size:'sm', act:'hedef-plan-kapat' })}
      </div></div>`;
  }

  /* UYARLAMA DÖNGÜSÜ (brand/ortak/hedef.js `uyarla`). Plan kontrolde geride
     kalınca hedef BUGÜNÜN verisiyle yeniden değerlendirilir; yetişmiyorsa
     seçenekler sunulur. Seçim yapana kadar hiçbir şey değişmez; seçince eski
     plan geri alınır, hedef güncellenir ve yeni plan yine önizleme ve
     onaydan geçer (büyük aksiyon). */
  function uyarlamaKutusu(h){
    const H = window.LIFEOS.Hedef;
    const u = H.uyarla(h, R.Hedefler.PAKET_BY_ID[h.paket], {}, U.todayISO());
    return html`<div class="mt-8">
      <p class="tiny dim"><b>Bugünün verisiyle yeniden hesap</b> — seçim yapana kadar hiçbir şey değişmez.</p>
      <p class="small">${u.metin}</p>
      ${u.senaryolar.length ? html`<div class="row gap-8 mt-8" style="flex-wrap:wrap">${map(u.senaryolar, (x, i) =>
        c.Button({ label:x.ad + ' · ' + H.tarihYaz(x.son_tarih), size:'sm', act:'hedef-uyarla-sec',
          data:{ 'data-id':h.id, 'data-i':String(i) } }))}</div>
        <p class="tiny dim mt-8">Seçince eski plan geri alınır, hedef yeni tarih ve vakitle güncellenir;
          yeni planı önizleyip onaylarsın. Eski tarih hedefin geçmişinde kalır.</p>`
        : c.Notice({ tone:'info', body:'Bu tarihe hâlâ yetişilebilir; plan olduğu gibi kalabilir.' })}
      <div class="row gap-8 mt-8">${c.Button({ label:'Kapat', size:'sm', act:'hedef-uyarla-kapat' })}</div>
    </div>`;
  }

  function hedefPlanOzeti(h, p){
    const bugun = U.todayISO();
    const il = R.HedefPlan.ilerleme(p, bugun);
    const w = p.paket === 'konu' ? R.HedefPlan.haftaOf(p, bugun) : null;
    return html`<div class="stack-sm mt-8">
      <p class="small">Plan uygulandı${p.paket === 'konu' ? ' · günde ' + p.gunlukDk + ' dk'
        + (p.haftalikGun < 7 ? ', haftada ' + p.haftalikGun + ' gün' : '') : ''}</p>
      ${when(w, () => html`<p class="tiny dim">Bu hafta (${U.fmtShort(w.bas)} – ${U.fmtShort(w.bit)})</p>${haftaSatiri(w)}`)}
      ${when(p.paket === 'net' && il.sonraki, () => html`<p class="tiny">Sonraki kontrol: <b>${U.fmtDate(il.sonraki.tarih)}</b>
        — beklenen ${U.fmtNet(il.sonraki.beklenen)} net</p>`)}
      ${when(p.paket === 'net' && p.odak.length, () => html`<p class="tiny dim">Odak konuları:
        ${p.odak.map(k => k.name).join(' · ')}</p>`)}
      ${c.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      ${S.ui.uyarla === h.id ? uyarlamaKutusu(h) : when(il.durum === 'geride', () => c.Button({
        label:'Yeniden hesapla', size:'sm', tone:'primary', act:'hedef-uyarla-ac', data:{ 'data-id':h.id } }))}
      <div class="row gap-8" style="flex-wrap:wrap">
        ${c.Button({ label:'Planı geri al', size:'sm', act:'hedef-plan-geri', data:{ 'data-id':h.id } })}
        ${hedefDugmeleri(h)}
      </div></div>`;
  }

  /* ALIŞKANLIK (brand/ortak/aliskanlik.js): planı yoktur; ilerleme doğrudan
     KAYITTAN sayılır. «Kayıt yok» «yapılmadı» demek değildir. */
  function aliskanlikOzeti(h){
    const il = R.Hedefler.ALISKANLIK.ilerleme(h, U.todayISO());
    return html`<div class="stack-sm mt-8">
      ${c.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      <div class="row gap-8" style="flex-wrap:wrap">${hedefDugmeleri(h)}</div></div>`;
  }

  function hedefSatir(h){
    const g = h.gerceklik || {};
    const p = R.HedefPlan ? R.HedefPlan.aktif(h.id) : null;
    const onizle = !p && S.ui.planOnizle === h.id && h.durum === 'aktif';
    return html`<div>
      <div><b class="small">${R.Hedefler.ozet(h)}</b>
        <div class="tiny dim">${h.durum === 'askida' ? 'askıda · ' : ''}${h.son_tarih
          ? 'son tarih ' + U.fmtDate(h.son_tarih) : 'tarihsiz'}${h.kapasite && h.kapasite.gunluk_dk
          ? ' · günde ' + h.kapasite.gunluk_dk + ' dk' : ''}${g.bant ? ' · ' + BANT[g.bant]
          + ' (' + (g.etiket === 'hesaplandi' ? 'hesaplandı' : 'tahmin') + ')' : ''}</div></div>
      ${h.paket === 'aliskanlik' && R.Hedefler.ALISKANLIK ? aliskanlikOzeti(h)
        : p ? hedefPlanOzeti(h, p) : onizle ? hedefOnizleme(h) : html`
        <div class="row gap-8 mt-6" style="flex-wrap:wrap">
          ${when(R.HedefPlan && h.durum === 'aktif', () => c.Button({ label:'Planı gör', size:'sm',
            tone:'primary', act:'hedef-plan-onizle', data:{ 'data-id':h.id } }))}
          ${hedefDugmeleri(h)}
        </div>`}
    </div>`;
  }

  /* Zaman bütçesi (HKM core/hedefag.py): üç modülün hedefleri aynı günü
     paylaşır. Cümleyi HKM'nin kodu kurar; burası yalnız gösterir. HKM
     kapalıysa satır hiç çizilmez. */
  function butceSatiri(){
    const b = R.Hedefler.ag ? R.Hedefler.ag.butce() : null;
    if(!b || !b.metin) return '';
    return c.Notice({ tone:{ sigar:'info', sikisik:'warn', sigmaz:'warn' }[b.bant] || 'info', title:'Zaman bütçesi (King):', body:b.metin });
  }

  function HedefKart(){
    if(!R.Hedefler) return '';
    const l = R.Hedefler.aktifler();
    return c.Card({ title:'Hedeflerim', badge:l.length ? c.Badge({ label:l.length + ' etkin', tone:'info' }) : null,
      actions:c.Button({ label:'Ekip sohbetinde hedef koy', size:'sm', act:'go', data:{ 'data-route':'team' } }),
      body:l.length ? html`<div class="stack-sm">${butceSatiri()}${map(l, hedefSatir)}</div>`
        : c.Ayrinti({ etiket:'Başka örnek',
            ozet:'Henüz hedefin yok. Ekip sohbetinde Patron’a «TYT’de 90 nete çıkmak istiyorum» gibi yaz; '
              + 'vaktine ve denemelerine göre olup olmadığını söylerim.',
            govde:html`<p>«TYT matematiği 100 günde bitirmek istiyorum» da olur; olmuyorsa olacağı
              tarihi söylerim. Alışkanlık da kurabilirsin: «her gün 2 saat ders çalışma alışkanlığı
              kazanmak istiyorum».</p>` }) });
  }

  /* ---------- uyarilar ---------- */
  /* Denetim sorusu — AYRI EKRAN DEĞİL, Bugün akışının içinde tek kart.

     Nöbetçi (core/goodhart.js) ve sürtünme ölçer (core/friction.js) arka
     planda çalışır; buraya yalnızca sıradaki TEK soru düşer. Grafik yok,
     pencere karşılaştırması yok — onlar isteyen için Analiz →
     Dürüstlük'te durur. Soru yoksa kart HİÇ ÇİZİLMEZ.

     Bir denetim mekanizmasının bir arayüz yüzeyi olması gerekmez; gerekli
     olan tek şey, doğru anda doğru sorunun sorulmasıdır. */
  function SignalCard(){
    if(!R.Signals) return '';
    const sig = R.Signals.current();
    if(!sig) return '';
    if(!sig.seenAt) R.Signals.markSeen(sig.id);

    return c.Card({ title:'Bir soru', hint:'signal',
      sub:sig.kind === 'friction' ? 'sürtünme ölçer' : 'gösterge nöbetçisi',
      body:html`
        <p class="small muted">${sig.title}</p>
        ${c.Notice({ tone:'info', body:sig.question })}
        ${when(sig.answeredAt, () => html`
          <p class="small muted mt-8">Cevabın: ${sig.answer}</p>
          <p class="tiny dim">Soru açık kalır: ayrışmanın gerçekten kapanıp
            kapanmadığı bir sonraki pencerede ölçülecek.</p>`)}
        ${when(!sig.answeredAt, () => html`
          <div class="mt-8">
            ${c.Field({ label:'Kısa cevabın (isteğe bağlı)',
              input:c.Input({ id:'sig-answer', placeholder:'tek cümle yeter' }) })}
            <div class="row wrap mt-8">
              ${c.Button({ label:'Kaydet', tone:'primary', size:'sm',
                act:'signal-answer', data:{ 'data-id':sig.id } })}
              ${c.Button({ label:'Bu soru bana uymuyor', size:'sm',
                act:'signal-dismiss', data:{ 'data-id':sig.id } })}
            </div>
          </div>`)}`,
    });
  }

  function Banners(){
    const out = [];
    const untilStart = M.daysUntilStart();
    const goBtn = (label, route) => c.Button({ label, size:'sm', act:'go', data:{ 'data-route':route } });
    /* Her uyarı tonuyla döner: Bugün yalnız EN ACİL olanı gösterir
       (Şimdi alanı), hepsi Ayrıntı'da durur. */
    const ekle = (tone, o) => out.push({ tone, kart:c.Notice(Object.assign({ tone }, o)) });

    if(untilStart > 0){
      ekle('info', { title:untilStart+' gün sonra başlıyor.',
        body:html`Program ${U.fmtDate(R.PLAN.startISO)} tarihinde başlıyor. Hafta 1 içeriği şimdiden önizleme olarak açık.` });
    }
    M.activeProtocols().forEach(p => {
      ekle('warn', { body:html`<b>${p.title}</b> protokolü ${U.fmtShort(p.endsAt)} tarihine kadar aktif. ${goBtn('Adımları gör','protocols')}` });
    });
    const triggers = C.protocolTriggers();
    if(triggers.length){
      const def = R.RECOVERY_PROTOCOLS.find(p => p.id === triggers[0].id);
      ekle('warn', { title:'Telafi tetiklendi.',
        body:html`${triggers[0].detail} <b>${def.title}</b> protokolü öneriliyor. ${goBtn('İncele','protocols')}` });
    }
    if(M.backupDue()){
      const age = M.backupAgeDays();
      ekle('info', { title:'Yedekleme.',
        body:html`${age === null ? 'Henüz hiç yedek almadın.' : 'Son yedeğin '+age+' gün önce alındı.'} Tarayıcı verisi silinirse çalışma geçmişin kaybolur. ${goBtn('Yedek al','guide')}` });
    }
    const debt = C.analysisDebt();
    if(debt.length){
      ekle('danger', { title:'Analiz borcu.',
        body:html`${debt.length} denemenin analizi 24 saati aştı. Analiz edilmemiş deneme, analiz edilenden daha düşük değerlidir. ${goBtn('Analize git','exams')}` });
    }
    return out;
  }

  /* ---------- render ---------- */
  /* ---------- günün akışı, enerji, mola, ödül ---------- */

  function FlowCard(){
    const flow = C.dailyFlow();
    return c.Card({
      title:'Günün akışı', hint:'next-action',
      sub:'İzle → not → soru → kart → mola',
      badge:c.Badge({ label:flow.done+'/'+flow.total, tone:flow.pct >= 100 ? 'ok' : 'muted' }),
      body:html`
        ${c.Bar({ value:flow.pct, tone:'' })}
        <div class="mt-12">${map(flow.steps, s => html`
          <div class="${s.done ? 'flowstep is-done' : 'flowstep'}">
            <span class="flowstep__dot">${raw(UI.icon(s.done ? 'check' : s.icon))}</span>
            <div class="minw0">
              <div class="flowstep__title">${s.title}</div>
              <div class="flowstep__why">${s.why}</div>
            </div>
            ${when(!s.done, () => c.Button({ label:'Git', size:'sm', tone:'ghost',
              act:'go', data:{ 'data-route':s.route } }))}
          </div>`)}</div>`,
    });
  }

  function AutoCard(){
    const list = R.Auto.suggestions();
    if(!list.length) return null;
    return c.Card({
      title:'Sistem önerileri', sub:'Otomasyon önerir, sen onaylarsın',
      badge:c.Badge({ label:String(list.length), tone:'muted' }),
      body:html`<div class="autolist">${map(list, s => html`
        <div class="autorow">
          <span class="autorow__icon">${raw(UI.icon(s.icon))}</span>
          <div class="minw0">
            <div class="small strong">${s.title}</div>
            <div class="tiny dim">${s.why}</div>
          </div>
          ${c.Button({ label:'Uygula', size:'sm', tone:s.tone || null, act:s.act, data:s.data || {} })}
        </div>`)}</div>` });
  }

  function PlanHealthCard(){
    const h = M.planHealth();
    if(!h || h.status === 'yeni') return null;
    const tone = h.status === 'saglikli' ? 'ok' : h.status === 'sapma' ? 'warn' : 'danger';
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">Plan sağlığı</span>
        ${c.Badge({ label:h.pct == null ? '—' : '%'+h.pct, tone })}
      </div>
      ${c.Bar({ value:h.pct || 0, tone:tone === 'ok' ? '' : tone })}
      <p class="tiny dim mt-6">${h.note}</p>
      ${when(h.status !== 'saglikli', () => c.Button({ label:'Planı yeniden hesapla', size:'sm',
        class:'mt-8', act:'auto-replan' }))}` });
  }

  function EnergyCard(){
    const today = U.todayISO();
    const mood = M.moodOf(today);
    const avg = M.energyAverage(7);
    const cur = mood ? mood.energy : null;
    return c.Card({
      title:'Enerji', sub:'Günde tek soru — plan buna göre esner',
      badge:when(avg != null, () => c.Badge({ label:'7 gün ort. '+avg, tone:'muted' })),
      body:html`
        <div class="energy">${map(R.ENERGY_SCALE, e => html`
          <button class="${cur === e.value ? 'is-on' : ''}" data-act="energy-set" data-value="${e.value}"
            aria-pressed="${cur === e.value ? 'true' : 'false'}" title="${e.note}">
            <b>${e.value}</b><span>${e.label}</span></button>`)}</div>
        ${when(cur != null, () => html`<p class="tiny dim mt-8">
          ${(R.ENERGY_SCALE.find(e => e.value === cur) || {}).note}</p>`)}`,
    });
  }

  function BreakCard(){
    const sug = C.suggestBreak();
    const taken = M.breaksOf(U.todayISO());
    if(!sug.ok){
      return c.Card({ title:'Mola', sub:'Bugün alınan: '+taken.length,
        body:c.Notice({ tone:'info', body:sug.reason }) });
    }
    return c.Card({
      title:'Mola', hint:'minimum-day', sub:sug.minutes+' dakika · '+taken.length+' mola alındı',
      body:html`
        <p class="small muted">${sug.why}</p>
        <div class="stack-xs mt-10">${map(sug.picks, a => html`
          <div class="row between">
            <div class="minw0"><b class="small">${a.name}</b>
              <div class="tiny dim">${a.minutes} dk · ${R.ACTIVITY_KINDS[a.kind].label}</div></div>
            ${c.Button({ label:'Aldım', size:'sm', act:'break-take',
              data:{ 'data-id':a.id, 'data-min':a.minutes } })}
          </div>`)}</div>`,
    });
  }

  function RewardCard(){
    const r = C.todayReward();
    const tier = C.rewardTier();
    const ALL = [
      { key:'minimum', label:'Minimum gün', icon:'check' },
      { key:'sleep', label:'Uyku', icon:'moon' },
      { key:'analysis', label:'Analiz', icon:'exam' },
      { key:'cards', label:'Tekrar', icon:'cards' },
    ];
    const has = k => r.earned.some(e => e.key === k);
    return c.Card({
      title:'Bugünün ödülü', hint:'streak', sub:r.title,
      badge:when(r.all, () => c.Badge({ label:'tam gün', tone:'ok' })),
      body:html`
        <div class="reward">${map(ALL, a => html`
          <span class="${has(a.key) ? 'reward__item' : 'reward__item is-off'}">
            ${raw(UI.icon(has(a.key) ? 'check' : a.icon))}${a.label}</span>`)}</div>

        ${when(tier.current || tier.next, () => html`
          <div class="stack-xs mt-12">
            <div class="row between">
              <span class="small">${tier.current ? tier.current.name + ' eşiği geçildi' : 'İlk eşik'}</span>
              ${when(tier.next, () => html`<span class="tiny dim num">${tier.next.name}’e ${tier.toNext} gün</span>`)}
            </div>
            ${c.Bar({ value:tier.next ? U.pct(tier.streak, tier.next.days) : 100,
              tone:tier.current ? '' : 'warn' })}
            <span class="tiny dim">${(tier.current || tier.next || {}).note || ''}</span>
          </div>`)}

        <p class="tiny dim mt-10">${r.note}</p>`,
    });
  }

  /* Kötü gün: sistem çökmesin diye tek düğmelik iniş. */
  function BadDayCard(day){
    if(day.badDay){
      return c.Card({ pad:'sm', class:'card--accent', body:html`
        <div class="row between wrap gap-8">
          <div class="minw0">
            <b class="small">Bugün kötü gün olarak işaretli</b>
            <div class="tiny dim">Hedef minimuma indi, seri korunuyor.</div>
          </div>
          ${c.Button({ label:'Geri al', size:'sm', act:'bad-day-undo' })}
        </div>` });
    }
    return c.Card({ pad:'sm', body:html`
      <div class="row between wrap gap-8">
        <div class="minw0">
          <b class="small">${R.BAD_DAY.label}</b>
          <div class="tiny dim">${R.BAD_DAY.note}</div>
        </div>
        ${c.Button({ label:'İşaretle', size:'sm', act:'bad-day' })}
      </div>` });
  }

  /* Dikkat dağılması: tek tık, kalıbı gösterir. */
  function DistractionCard(day){
    const n = day.distractions || 0;
    const trend = R.Analytics.distractionTrend(14);
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">Bölünme</span>
        <b class="num">${n}<span class="dim"> kez</span></b>
      </div>
      <div class="row gap-8 mt-8">
        ${c.Button({ label:'+1 bölündüm', size:'sm', class:'grow', act:'distract' })}
        ${when(n, () => c.Button({ label:'Sıfırla', size:'sm', tone:'ghost', act:'distract-reset' }))}
      </div>
      ${when(trend.ok && trend.avg >= 2, () => html`<p class="tiny dim mt-6">${trend.note}</p>`)}` });
  }

  /* Ofisten gelen — ekip sen ekrani acmadan da calisir. Notlar kural
     motorundan gelir; brifing gunde bir kez uretilip onbellekten okunur. */
  function OfficeCard(){
    const notes = R.Office.notes();
    /* Bayat brifing burada hic gosterilmez: notlar her zaman tazedir ve
       ikisi celisirse kullanici hangisine inanacagini bilemez. */
    const cached = R.Office.briefingOf();
    const brief = (cached && !cached.stale) ? cached : null;
    const open = R.Office.openDecisions();
    if(!notes.length && !brief && !open.length) return '';

    return c.Card({
      title:'Ofisten', sub:'Ekibin bugünkü notu',
      badge:when(notes.length, () => c.Badge({ label:notes.length + ' not',
        tone:notes.some(n => n.tone === 'danger') ? 'danger' : 'warn' })),
      body:html`
        ${when(brief, () => html`<p class="small">${brief.text}</p>`)}
        ${when(notes.length, () => html`<div class="notes mt-10">${map(notes.slice(0, 3), n => html`
          <div class="${'note note--' + n.tone}">
            <span class="note__dot"></span>
            <span class="minw0"><b class="small">${n.name}:</b> ${n.text}</span>
          </div>`)}</div>`)}
        ${when(open.length, () => html`<div class="mt-10">${c.Notice({ tone:'warn',
          title:'Açık karar:', body:open[0].title })}</div>`)}
        <div class="row wrap gap-6 mt-10">
          ${c.Button({ label:'Ofise git', size:'sm', act:'go', data:{ 'data-route':'office' } })}
          ${c.Button({ label:'Patron’a sor', size:'sm', tone:'ghost', act:'ask-agent',
            data:{ 'data-agent':'patron' } })}
        </div>`,
    });
  }

  /* ---------- HKM seridi: KUCUK ve HER GUN ORADA

     HKM ayarlari «Rehber» ekraninin icinde duruyordu: gunde bir bakilan
     bir ekranda, gun boyu acik duran bir baglantinin durumu. Bagli mi
     degil mi, en son ne zaman gitti, bekleyen teklif var mi — bunlar
     Bugun ekraninda TEK SATIR olmali.

     Serit bir AYAR EKRANI DEGILDIR: yalnizca durumu soyler ve tek bir
     is yaptirir (simdi gonder). Ayarin yeri yine Rehber'dir; iki yerde
     iki ayar olsaydi, biri otekini sessizce yenerdi. */
  /* Yalniz burada kullanilan bir gosterim bicimi: ortak araca eklemek,
     ortak araci tek bir ekranin ihtiyaciyla buyutmek olurdu. */
  function saat(iso){
    if(!iso) return null;
    const d = new Date(iso);
    if(isNaN(d.getTime())) return null;
    return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes());
  }

  function HkmSerit(){
    if(!R.Beacon) return '';
    const a = R.Beacon.settings();
    const teklif = (S.ui.hkmIntents || []).length;

    if(!a.enabled){
      /* Kapaliyken de GORUNUR ama bagirmaz: kapali olmak bir hata
         degildir, bir secimdir. */
      return c.Card({ title:'HKM', hint:'hkm', sub:'bağlı değil',
        body:html`<p class="tiny dim">Hayat Kontrol Merkezi'ne günün
          özetini göndermek istersen Rehber'den açabilirsin. AYS bundan
          bağımsız çalışır: HKM kapalıyken hiçbir şey eksilmez.</p>
          <div class="row gap-8 mt-8">
            ${c.Button({ label:'Rehber\u2019de aç', size:'sm', act:'go',
              data:{ 'data-route':'guide' } })}
          </div>` });
    }

    const gitti = saat(a.lastOkAt);
    const denendi = saat(a.lastAt);
    /* Basarisiz son deneme YUTULMAZ: «gonderildi» ile «gonderilmeye
       calisildi» ayri seylerdir. */
    const bozuk = a.lastStatus !== null && a.lastStatus !== undefined
      && a.lastStatus !== 202;
    const alt = bozuk ? ('son deneme ' + (denendi || '—') + ' · başarısız')
      : (gitti ? ('son gönderim ' + gitti) : 'henüz gönderilmedi');

    return c.Card({ title:'HKM', hint:'hkm', sub:alt,
      body:html`
        ${when(bozuk, () => c.Notice({ tone:'warn',
          body:(a.lastNote || 'Gönderilemedi.') + ' AYS bundan etkilenmez; '
             + 'veri burada duruyor ve bir sonraki denemede gider.' }))}
        ${when(teklif > 0, () => html`<p class="tiny dim">${teklif} teklif
          bekliyor — Onaylar’da.</p>`)}
        <div class="row gap-8 mt-8">
          ${c.Button({ label:'Şimdi gönder', size:'sm', act:'hkm-gonder' })}
          ${c.Button({ label:'Ayarlar', size:'sm', act:'go',
            data:{ 'data-route':'guide' } })}
        </div>
        <p class="tiny dim mt-8">Giden şey günün ÖZETİDİR: etiketli
          ölçümler. Ham veri AYS\u2019te kalır.</p>` });
  }

  /* Bugun bir istisnanin icindeyse ekranda SOYLENIR: bos bir blok listesi
     «plan bozuldu» diye okunur, 240 dakikalik bloklar da «neden bu kadar
     uzun» sorusunu dogurur. */
  function IstisnaKart(day, dateISO){
    const ist = R.Istisna ? R.Istisna.gunIcin(dateISO) : null;
    if(!ist) return '';
    /* Takvim kaydı (tatil, okul sınavı…) buradan bitirilmez: Rehber ›
       İstisnalar'da durur ve orada kaldırılır. */
    const takvim = ist.kaynak === 'takvim';
    if(day.ara){
      const sonraki = U.iso(U.addDays(U.parse(ist.to), 1));
      return c.Notice({ tone:'info',
        title:'Bugün ara günü' + (ist.neden ? ' — ' + ist.neden : ''),
        body:html`${R.Istisna.tanim(ist)}. Blok yok ve bu gün kaçırılmış sayılmaz;
          haftalık soru hedefi ara günleri oranında küçüldü. Plan ${U.fmtShort(sonraki)}
          günü kaldığı yerden sürer.
          ${takvim
            ? html`<div class="tiny dim mt-8">Takvim kaydı — Rehber › İstisnalar'dan kaldırılır.</div>`
            : html`<div class="mt-8">${c.Button({ label:'Arayı bugün bitir', icon:'play', size:'sm',
              tone:'ghost', act:'istisna-bitir', data:{ 'data-id':ist.id } })}</div>`}` });
    }
    if(ist.tur === 'sure' && day.istisnaId === ist.id){
      return c.Notice({ tone:'info',
        title:(takvim ? R.Istisna.tanim(ist).split(' · ')[0] + ': bugün ' : 'Geçici süre: ders günlerinde ')
          + ist.dakika + ' dk',
        body:R.Istisna.tanim(ist) + '. Tarih bitince temel plana döner; deneme ve '
          + 'kapanış günleri değişmez.' });
    }
    return '';
  }

  /* BUGÜN — üç alan (katalog 03, EKIP-PLANI §3):

       ŞİMDİ   tek canlı öğe: sıradaki blok (ya da kurulum), varsa en acil
               tek uyarı ve günün sorusu
       DURUM   günün akışı · özet · günlük sayaç — kutular, düğmesiz
       ÖNERİ   en çok bir kart; fazlası «+N öneri Onaylar'da»

     Geri kalan her kart «Bugün › Ayrıntı»dadır (renderAyrinti). Sadelik
     bütçesi: sayfa boyu 1800 px, görünen düğme 14. */
  const AGIRLIK = { danger:3, warn:2, info:1 };
  /* Uyarılar en acilden başlayarak: ilki Bugün'de, gerisi Ayrıntı'da. */
  function uyarilar(){
    return Banners().sort((a, b) => (AGIRLIK[b.tone] || 0) - (AGIRLIK[a.tone] || 0));
  }

  function AkisSatiri(b, siradaki){
    const d = b.startedAt ? 'suruyor' : b.status;
    const sag = d === 'suruyor' ? c.Badge({ label:'Sürüyor', tone:'mod' })
      : b.id === siradaki ? c.Badge({ label:'Sıradaki', tone:'mod' })
      : d === 'done' ? html`<span class="akis__bitti">Bitti</span>`
      : d === 'partial' ? html`<span class="akis__yarim">Yarım</span>`
      : d === 'skipped' ? html`<span class="akis__atla">Atlandı</span>`
      : html`<span class="akis__sure">${b.targetMin} dk</span>`;
    return html`<li class="${'akis__satir' + (d === 'done' || d === 'skipped' ? ' is-gecti' : '')}">
      <span class="akis__slot">${b.slot}</span>
      <span class="akis__nokta" aria-hidden="true"></span>
      <span class="akis__ad">${b.topic || b.subject || b.slot}</span>
      <span class="akis__sag">${sag}</span>
    </li>`;
  }

  function AkisKutusu(day){
    const bloklar = day.blocks.filter(b => b.slot !== 'Dinlenme');
    const bitti = bloklar.filter(b => b.status === 'done').length;
    const sira = (bloklar.find(b => b.status === 'pending' && !b.startedAt) || {}).id;
    return c.Kutu({ ad:'Günün akışı', yuva:bloklar.length ? bloklar.length + ' blok · ' + bitti + ' bitti' : '',
      bitisik:true,
      govde:bloklar.length
        ? html`<ol class="akis" data-oz="001">${map(bloklar, b => AkisSatiri(b, sira))}</ol>`
        : html`<p class="akis__bos small muted">${day.ara ? 'Bugün ara günü: plan boş.' : 'Bugün için blok yok.'}</p>`,
      ayak:c.Button({ label:'Blokları ve sayaçları aç', size:'sm', tone:'ghost', act:'go',
        data:{ 'data-route':'gun' } }) });
  }

  function OzetKutusu(day, dateISO){
    const z = ozetSayilari(day, dateISO);
    const SAYI = z.L && z.L.SAYI;
    const seri = C.behaviorStreak();
    /* Sayı bileşeni yüklü değilse (eski kabuk) düz yazılır; kesinlik yine
       notta söylenir. */
    const sayi = s => SAYI ? raw(SAYI.html(s))
      : html`${s.deger}${when(s.birim, () => html`<small> ${s.birim}</small>`)}`;
    const hucre = (ad, s, not) => html`<div class="ozet__hucre">
      <span class="ozet__ad">${ad}</span>
      <b class="ozet__deger">${sayi(s)}</b>
      <span class="ozet__not">${not}</span></div>`;
    const yuva = SAYI ? html`${raw(SAYI.kutuGlifi([z.kalan, z.blok, z.kart, z.seri]))}<span>bugün</span>` : 'bugün';
    return c.Kutu({ ad:'Özet', yuva, bitisik:true, govde:html`<div class="ozet">
      ${hucre('Sınava kalan', z.kalan, z.kalan.kesinlik === 'estimated' ? 'TYT tarihi tahmini' : 'TYT tarihine')}
      ${hucre('Bugünün bloğu', z.blok, R.WEEKDAYS[day.dow].label + ' düzeni')}
      ${hucre('Tekrar kartı', z.kart, 'borç %' + C.cardDebt())}
      ${hucre('Seri', z.seri, seri.streak ? 'minimum gün tutuldu' : 'minimum gün başlatır')}
    </div>` });
  }

  function SayacKutusu(day, dateISO){
    const minMet = C.minimumDayMet(dateISO);
    const satir = (ad, n, hedef) => {
      const oran = hedef ? Math.min(100, Math.round(100 * (n || 0) / hedef)) : 0;
      return html`<div class="sayac__satir"><div class="row between"><span>${ad}</span>
        <b class="num">${n || 0} / ${hedef || 0}</b></div>${c.Bar({ value:oran, tone:'' })}</div>`;
    };
    /* Plan dışı soru (Telegram «soru 40», derssiz giriş) günün toplamına
       yazılır; burada görünmezse kayıt kaybolmuş sanılır. */
    const serbest = Number(day.freeQ) || 0;
    const dogru = day.freeCorrect == null ? null : Number(day.freeCorrect);
    return c.Kutu({ ad:'Günlük sayaç', yuva:day.ara ? 'ara günü' : (minMet ? 'minimum tamam' : 'minimum açık'),
      govde:html`${satir('Paragraf', day.paragraphActual, day.paragraphTarget)}
        ${satir('Problem', day.problemActual, day.problemTarget)}`,
      ayak:serbest > 0 ? 'Plan dışı: ' + serbest + ' soru' + (dogru ? ' · ' + dogru + ' doğru' : '') : null });
  }

  /* 04 SAYFA BAŞI CÜMLESİ (ekip/EKIP-PLANI Ek A) — günün durumu TEK cümle,
     KODDAN: bloklar, sıradaki iş ve (eşik aşıldıysa) tekrar borcu. Dil
     modeli hiç çağrılmaz; model kapalıyken de aynı cümle çıkar. Kural
     `C.nextAction` ile aynı eşiği kullanır (borç %10). Soru eki gerektiren
     çekimden kaçınılır («1/3 blok bitti»). */
  function bugunCumlesi(day, dateISO){
    if(!day || (R.Setup && R.Setup.needed && R.Setup.needed())) return '';
    if(day.ara) return 'Bugün ara günü; plan boş.';
    const bloklar = (day.blocks || []).filter(b => b.slot !== 'Dinlenme');
    if(!bloklar.length) return 'Bugün için blok yok.';
    const n = bloklar.length;
    const bitti = bloklar.filter(b => b.status === 'done').length;
    const suren = bloklar.find(b => b.startedAt);
    const sira = bloklar.find(b => b.status === 'pending' && !b.startedAt);
    const ad = b => b.topic || b.subject || b.slot;
    let cumle;
    if(suren) cumle = ad(suren) + ' bloğu sürüyor; ' + bitti + '/' + n + ' blok bitti';
    else if(!sira) cumle = 'Bugünün ' + n + ' bloğu da kapandı'
      + (C.minimumDayMet(dateISO) ? '; minimum gün tutuldu' : '');
    else cumle = bitti + '/' + n + ' blok bitti; sırada ' + ad(sira);
    const borc = C.cardDebt();
    if(borc > 10) cumle += '; tekrar borcu %' + borc;
    return cumle + '.';
  }

  function tarihSatiri(){
    const wd = R.WEEKDAYS[U.weekdayIndex(U.today())];
    return wd.label + ' · ' + U.fmtDate(U.todayISO()) + ' · Hafta ' + M.currentWeek() + '/' + R.PLAN.totalWeeks;
  }

  /* Özet kutusunun sayıları (024): her sayı kesinlik etiketi ve köken kartı
     taşır. Sınav tarihi profilde yazılı değilse planın varsayılanıdır ve
     «tahmin — ÖSYM duyurusuyla güncellenir» (data/curriculum.js): kalan gün
     o zaman TAHMİNDİR. */
  function ozetSayilari(day, dateISO){
    const L = window.LIFEOS;
    const bloklar = day.blocks.filter(b => b.slot !== 'Dinlenme');
    const bitti = bloklar.filter(b => b.status === 'done').length;
    const profilTarihi = !!(S.profile && S.profile.examTytISO);
    const seri = C.behaviorStreak();
    return {
      kalan:{ deger:U.diffDays(dateISO, R.PLAN.examTytISO), birim:'gün',
        kesinlik:profilTarihi ? 'computed' : 'estimated',
        formul:'TYT tarihi − bugün', girdiler:[{ ad:'TYT tarihi', deger:R.PLAN.examTytISO,
          kesinlik:profilTarihi ? 'measured' : 'estimated' }],
        kaynak:profilTarihi ? 'profildeki sınav tarihi' : 'planın varsayılan tarihi; ÖSYM duyurusuyla güncellenir' },
      blok:{ deger:bitti + '/' + bloklar.length, kesinlik:'computed',
        formul:'biten blok / günün bloğu', girdiler:[{ ad:'biten', deger:bitti, kesinlik:'measured' },
          { ad:'günün bloğu', deger:bloklar.length, kesinlik:'measured' }] },
      kart:{ deger:C.dueCards().length, kesinlik:'computed', formul:'vadesi bugün ya da geçmiş kart' },
      seri:{ deger:seri.streak, birim:'gün', kesinlik:'computed', formul:'minimum günün tutulduğu ardışık gün' },
      L:L,
    };
  }

  async function render(){
    const dateISO = U.todayISO();
    const n = M.currentWeek();
    await M.ensureWeek(n);
    const day = await M.ensureDay(U.today());
    const acil = uyarilar()[0];
    const oneri = R.Screens.onaylar && R.Screens.onaylar.bekleyen() ? R.Screens.onaylar.oneriAlani() : '';

    return html`<div class="bugun" data-oz="003">
      <div class="bugun__sol">
        <section class="bugun__alan" aria-label="Şimdi"><h2 class="bugun__etiket" aria-hidden="true">Şimdi</h2>
          ${when(acil, () => acil.kart)}
          ${R.Setup.needed() ? raw(R.Setup.card()) : html`<div class="kahraman" data-oz="042">${NextUpCard()}</div>`}
          ${when(R.Signals && R.Signals.current(), () => SignalCard())}
        </section>
        <section class="bugun__alan" aria-label="Durum"><h2 class="bugun__etiket" aria-hidden="true">Durum</h2>${AkisKutusu(day)}</section>
      </div>
      <div class="bugun__sag">
        <section class="bugun__alan" aria-label="Özet"><h2 class="bugun__etiket" aria-hidden="true">Özet</h2>
          ${OzetKutusu(day, dateISO)}
          ${SayacKutusu(day, dateISO)}
        </section>
        ${when(oneri, () => html`<section class="bugun__alan" aria-label="Öneri"><h2 class="bugun__etiket" aria-hidden="true">Öneri</h2>${oneri}</section>`)}
      </div>
    </div>`;
  }

  /* GÜNÜN AYRINTISI (Bugün › Ayrıntı) — Bugün'ün üç alanına sığmayan her
     kart burada: blokların sayacı ve alanları, çıpa sayaçları, enerji, mola,
     ritüel, seri, telafi… Hiçbiri kalkmadı; yalnız yeri değişti (envanter
     tabanı bunu denetler). Bugün'de duran şey burada tekrar çizilmez. */
  async function renderAyrinti(){
    const dateISO = U.todayISO();
    const n = M.currentWeek();
    await M.ensureWeek(n);
    const day = await M.ensureDay(U.today());
    const week = S.weeks[M.weekId(n)];
    const wd = R.WEEKDAYS[day.dow];

    const banners = uyarilar().slice(1).map(b => b.kart);

    return c.Grid(html`
      ${when(banners.length, () => c.Span(12, html`<div class="stack-sm">${banners}</div>`))}
      ${c.Span(12, HkmSerit())}

      ${c.Span(6, c.Stack(html`
        ${AutoCard()}
        <div id="pane-flow">${FlowCard()}</div>
        ${c.SectionTitle(html`${wd.label} blokları${raw(UI.hint('block'))}`, html`${raw(OdakRozeti(day))}<span class="small dim">${U.fmtDate(dateISO)}</span>`)}
        ${IstisnaKart(day, dateISO)}
        ${map(day.blocks, BlockCard)}
        ${c.Card({ pad:'sm', body:c.Field({ label:'Günün notu',
          input:c.Textarea({ rows:2, value:day.note, change:'day-note', placeholder:'Bugün ne engelledi, ne kolaylaştırdı?' }) }) })}
      `))}

      ${c.Span(4, c.Stack(html`
        ${HedefKart()}
        ${OfficeCard()}
        <div id="pane-anchors">${AnchorPane(day)}</div>
        <div id="pane-energy">${EnergyCard()}</div>
        <div id="pane-reward">${RewardCard()}</div>
        ${BadDayCard(day)}
        ${DistractionCard(day)}
        ${PlanHealthCard()}
        ${StreakCard()}
        ${SleepCard(day)}
        <div id="pane-break">${BreakCard()}</div>
        <div id="pane-due">${DueCards()}</div>
        <div id="pane-ritual">${RitualCard(day)}</div>
        ${RepairQueue()}
        ${WeekContext(week, n)}
      `))}

      ${c.Span(12, raw(UI.rail(['next-action','anchor','minimum-day','timer','streak','skip-reason'])))}
    `);
  }

  function afterRender(){
    if(runningBlock()) startTick(); else stopTick();
  }

  /* Öneri alanındaki kartın düğmeleri Onaylar ekranının işleyicilerine
     gider: onay TEK yoldan geçer, iki ekranda iki ayrı kod durmaz. */
  const ONAY_EYLEMLERI = ['king-onayla', 'king-parca', 'king-iptal', 'hkm-toplu', 'hkm-intent-yes',
    'hkm-intent-seen', 'hkm-intent-no', 'hkm-doubt-ok', 'office-approve', 'office-reject', 'office-undo'];

  /* ---------- eylemler ---------- */
  const handle = {
    async 'seri-hasta'(){
      const r = await R.Seri.dondur(U.todayISO(), null, 'hasta');
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast('Bugün donduruldu; seri bozulmaz. Geçmiş olsun.', { undo:async () => {
        await R.Seri.coz(r.kayit.id); R.App.render(); } });
      R.App.render();
    },
    async 'seri-coz'(el){ await R.Seri.coz(el.dataset.id); UI.toast('Dondurma geri alındı'); R.App.render(); },
    async 'seri-tatil'(){ S.ui.tatilSec = true; R.App.render(); },
    async 'seri-tatil-vazgec'(){ S.ui.tatilSec = false; R.App.render(); },
    async 'seri-tatil-sinir'(){
      const e = document.getElementById('seri-tatil-sinir');
      const ham = e ? String(e.value).trim() : '';
      if(!ham){ UI.toast('Yıllık tatil sınırı için bir gün sayısı yaz.'); return; }
      const r = await R.Seri.yillikTatilAyarla(Number(ham));
      if(!r.ok){ UI.toast(r.why, { life:5000 }); return; }
      R.App.render();
      UI.toast('Yıllık tatil sınırı ' + r.sinir + ' gün', { undo:async () => {
        await R.Seri.yillikTatilAyarla(r.onceki); R.App.render(); } });
    },
    async 'seri-tatil-gun'(el){
      S.ui.tatilSec = false;
      const r = await R.Tatil.baslat(Number(el.dataset.gun));
      if(!r.ok){ UI.toast(r.why); R.App.render(); return; }
      UI.toast('Tatil modu ' + U.fmtShort(r.bas) + ' – ' + U.fmtShort(r.bit) + ': plan ara, seri korunuyor'
        + (r.donus ? '; dönüşte 2 gün ' + r.donus.dakika + ' dk' : ''), { life:6000 });
      if(R.Hedefler && R.Hedefler.ag) R.Hedefler.ag.planla();
      R.App.render();
    },
    async 'seri-tatil-bitir'(){
      const r = await R.Tatil.bitir();
      UI.toast(r.ok ? 'Tatil bitti; bugünden kademeli dönüş' + (r.donus ? ' (' + r.donus.dakika + ' dk)' : '')
        : r.why, { life:5000 });
      if(R.Hedefler && R.Hedefler.ag) R.Hedefler.ag.planla();
      R.App.render();
    },
    'istisna-bitir'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Arayı bugün bitir',
        'Bugün ve sonraki günler yeniden plana göre kurulur. Geçmiş ara günleri ara olarak kalır.',
        async () => {
          const r = await R.Istisna.bitir(id);
          UI.toast(r.ok ? 'Ara bitti; bugünün planı kuruldu' : r.why);
          R.App.render();
        });
    },

    /* HKM teklifleri: uygulayan AYS'in kendi kodudur. */
    /* Uc dugmenin ucu de TEK kapidan gecer: uygulama, yerel kayit ve
       merkeze bildirim tek sirada olur. «Uygulandı ama merkeze
       bildirilemedi» hali yutulmaz, SOYLENIR. */
    async 'hedef-durum'(el){
      const r = await R.Hedefler.durumDegistir(el.dataset.id, el.dataset.durum);
      UI.toast(r.ok ? 'Hedef güncellendi' + (r.not ? '. ' + r.not : '') : r.why);
      R.App.render();
    },
    async 'hedef-plan-onizle'(el){ S.ui.planOnizle = el.dataset.id; R.App.render(); },
    async 'hedef-plan-kapat'(){ S.ui.planOnizle = null; R.App.render(); },
    async 'hedef-plan-uygula'(el){
      const r = await R.HedefPlan.uygulaHedef(el.dataset.id);
      S.ui.planOnizle = null;
      if(r.ok) R.UI.onayMuhru();
      UI.toast(r.ok ? 'Plan uygulandı. Geri almak istersen «Planı geri al».' : r.why);
      R.App.render();
    },
    async 'hedef-uyarla-ac'(el){ S.ui.uyarla = el.dataset.id; R.App.render(); },
    async 'hedef-uyarla-kapat'(){ S.ui.uyarla = null; R.App.render(); },
    async 'hedef-uyarla-sec'(el){
      const H = window.LIFEOS.Hedef;
      const h = R.Hedefler.liste().find(x => x.id === el.dataset.id);
      if(!h) return;
      const paket = R.Hedefler.PAKET_BY_ID[h.paket];
      const bugun = U.todayISO();
      const u = H.uyarla(h, paket, {}, bugun);
      const x = u.senaryolar[Number(el.dataset.i)];
      if(!x){ UI.toast('Bu seçenek artık geçerli değil; yeniden hesapla.'); return; }
      const g = await R.HedefPlan.geriAlHedef(h.id);
      if(!g.ok && R.HedefPlan.aktif(h.id)){ UI.toast(g.why || 'Eski plan geri alınamadı; hedef değişmedi.'); return; }
      await R.Hedefler.kaydet(H.uyarlamaUygula(u.hedef, x, paket, {}, bugun));
      S.ui.uyarla = null;
      S.ui.planOnizle = h.id;
      UI.toast('Hedef yeni tarihle güncellendi; yeni planı önizleyip onayla.');
      R.App.render();
    },
    async 'hedef-plan-geri'(el){
      const r = await R.HedefPlan.geriAlHedef(el.dataset.id);
      UI.toast(r.ok ? 'Plan geri alındı; hafta taslağı eski sırasına döndü.' : (r.why || 'Geri alınamadı'));
      R.App.render();
    },

    async 'onbes-dk'(){ S.ui.onbesDk = !S.ui.onbesDk; R.App.render(); },

    /* Elle gonderim: kullanicinin ACIKCA istedigi an. Kapaliyken de
       zorlanmaz — kapali bir seyi «bir kerelik» calistirmak, kapali
       olmasini anlamsiz kilardi. */
    async 'hkm-gonder'(){
      UI.toast('HKM\u2019ye gönderiliyor…');
      const r = await R.Beacon.send({ reason:'manual' });
      UI.toast(r.ok ? 'HKM\u2019ye gönderildi.'
        : ('Gönderilemedi — ' + (r.note || r.reason || 'sebep bilinmiyor')));
      R.App.render();
    },

    async 'signal-answer'(el){
      const inp = document.getElementById('sig-answer');
      const r = await R.Signals.answer(el.dataset.id, inp ? inp.value : '');
      if(!r.ok){ UI.toast(r.error); return; }
      UI.toast('Kaydedildi. Sonucu bir sonraki pencere gösterecek.');
      R.App.render();
    },

    async 'signal-dismiss'(el){
      await R.Signals.dismiss(el.dataset.id);
      UI.toast('Soru kapatıldı');
      R.App.render();
    },

    async 'bad-day'(){
      UI.confirmSheet(R.BAD_DAY.label,
        'Bugünün hedefi minimum güne iner, kalan bloklar “kötü gün” nedeniyle atlanır ve '
        + 'davranış serin kırılmaz. Yarın normal plana dönersin.', async () => {
          await M.badDay();
          UI.closeSheet();
          UI.toast('Bugün minimuma indi — seri korunuyor');
          R.App.render();
        });
    },
    async 'bad-day-undo'(){
      await M.undoBadDay();
      UI.toast('Normal plana dönüldü');
      R.App.render();
    },
    async 'distract'(){
      const n = await M.addDistraction();
      UI.toast(n + '. bölünme kaydedildi');
      R.App.render();
    },
    async 'distract-reset'(){
      const day = todayDoc();
      day.distractions = 0;
      await M.saveDay(day.date);
      R.App.render();
    },
    /* Paylaşılabilir hafta özeti (fikir 28): ÖNCE önizleme — metin
       düzenlenebilir, istemediğin satırı silersin; sonra Paylaş ya da
       Kopyala. Kendiliğinden hiçbir yere gitmez. */
    async 'share-week'(){
      const text = C.haftaOzetMetni(M.currentWeek());
      UI.sheet({
        title:'Hafta özeti', subtitle:'Paylaşmadan önce istemediğin satırı sil',
        body:String(c.Textarea({ id:'share-box', rows:9, value:text })),
        footer:String(html`${c.Button({ label:'Kopyala', act:'share-week-copy' })}
          ${c.Button({ label:'Paylaş', tone:'primary', act:'share-week-send' })}`),
      });
    },
    async 'share-week-copy'(){
      const el = document.getElementById('share-box');
      try{ await navigator.clipboard.writeText(el ? el.value : ''); UI.toast('Özet kopyalandı'); }
      catch(e){ if(el){ el.select(); } UI.toast('Kopyalanamadı; metni seçip kendin kopyala'); }
    },
    async 'share-week-send'(){
      const el = document.getElementById('share-box');
      const text = el ? el.value : '';
      try{
        if(navigator.share){ await navigator.share({ title:'Rota — hafta özeti', text }); UI.closeSheet(); return; }
        await navigator.clipboard.writeText(text);
        UI.toast('Paylaşım bu tarayıcıda yok; özet kopyalandı');
      }catch(e){ /* kullanıcı paylaşımı kapattı: metin kutuda duruyor */ }
    },
    async 'energy-set'(el){
      await M.saveMood(U.todayISO(), { energy:Number(el.dataset.value) });
      if(!R.App.patch('#pane-energy', EnergyCard())) R.App.render();
      else R.App.patch('#pane-break', BreakCard());
    },
    async 'break-take'(el){
      await M.saveBreak({ activityId:el.dataset.id, minutes:Number(el.dataset.min) || 5 });
      UI.toast('Mola kaydedildi — dönünce blok seni bekliyor');
      if(!R.App.patch('#pane-break', BreakCard())) R.App.render();
      else R.App.patch('#pane-flow', FlowCard());
    },
    async anchor(el){
      const day = todayDoc();
      const field = el.dataset.kind === 'paragraph' ? 'paragraphActual' : 'problemActual';
      day[field] = Math.max(0, (day[field]||0) + Number(el.dataset.delta));
      await M.saveDay(day.date);
      // yalniz cipa panelini yenile; tam cizim gerekmez
      if(!R.App.patch('#pane-anchors', AnchorPane(day))) R.App.render();
    },
    async 'block-status'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.status = el.dataset.value;
      if(b.status === 'done' && b.actualMin == null && !b.startedAt) b.actualMin = b.targetMin;
      if(b.status !== 'skipped') b.skipReason = null;
      if(b.startedAt){ oturumYaz(b, Math.round(elapsedSeconds(b)/60)); b.actualMin = (b.actualMin||0) + Math.round(elapsedSeconds(b)/60); b.startedAt = null; }
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'skip-reason'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.skipReason = el.dataset.reason;
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'timer-start'(el){
      const day = todayDoc();
      day.blocks.forEach(b => {
        if(b.startedAt){ oturumYaz(b, Math.round(elapsedSeconds(b)/60)); b.actualMin = (b.actualMin||0) + Math.round(elapsedSeconds(b)/60); b.startedAt = null; }
      });
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.startedAt = new Date().toISOString();
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'timer-stop'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      const mins = Math.round(elapsedSeconds(b)/60);
      oturumYaz(b, mins);
      b.actualMin = (b.actualMin||0) + mins;
      b.startedAt = null;
      if(b.status === 'pending') b.status = mins >= b.targetMin*0.8 ? 'done' : 'partial';
      await M.saveDay(day.date);
      UI.toast(mins+' dakika kaydedildi');
      R.App.render();
    },
    async checklist(el){
      const day = todayDoc();
      day.checklist = day.checklist || {};
      day.checklist[el.dataset.key] = el.checked;
      await M.saveDay(day.date);
      if(!R.App.patch('#pane-ritual', RitualCard(day))) R.App.render();
    },
    async flip(el){
      S.ui.flipped[el.dataset.id] = !S.ui.flipped[el.dataset.id];
      if(!R.App.patch('#pane-due', DueCards())) R.App.render();
    },
    async rate(el){
      const card = S.cards.find(x => x.id === el.dataset.id);
      M.schedule(card, el.dataset.rating);
      await M.saveCard(card);
      delete S.ui.flipped[card.id];
      UI.toast('Sonraki tekrar: '+U.fmtShort(card.dueAt));
      R.App.render();
    },
    async 'repair-done'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      err.repairDoneAt = new Date().toISOString();
      await M.saveError(err);
      UI.toast('Reçete tamamlandı');
      R.App.render();
    },
    async 'open-review'(){ R.Screens.week.openReview(); },
  };
  ONAY_EYLEMLERI.forEach(a => { handle[a] = el => R.Screens.onaylar.handle[a](el); });

  const change = {
    async 'block-subject'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.subjectId = el.value || null;
      b.topicId = null;
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'block-topic-ref'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.topicId = el.value || null;
      await M.saveDay(day.date);
    },
    async 'block-topic'(el){
      const day = todayDoc();
      day.blocks.find(x => x.id === el.dataset.block).topic = el.value;
      await M.saveDay(day.date);
    },
    async 'block-num'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b[el.dataset.field] = el.value === '' ? null : Number(el.value);
      await M.saveDay(day.date);
      R.App.render();
    },
    async sleep(el){
      const day = todayDoc();
      day.sleepHours = el.value === '' ? null : Number(el.value);
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'day-note'(el){
      const day = todayDoc();
      day.note = el.value;
      await M.saveDay(day.date);
    },
  };

  return {
    id:'today',
    title:'Bugün',
    subtitle(){ return ''; },
    /* v5: tarih üst satırda, günün cümlesi büyük başlık (004). */
    ust(){ return U.esc(tarihSatiri()); },
    headline(){
      const d = S.days[U.todayISO()];
      return (d && bugunCumlesi(d, U.todayISO())) || 'Bugün';
    },
    lede(){ return ''; },
    cumle:bugunCumlesi,
    ozetSayilari,
    actions(){
      return String(html`
        ${c.Button({ label:'Özeti paylaş', icon:'upload', size:'sm', act:'share-week' })}
        ${c.Button({ label:'Deneme ekle', icon:'exam', size:'sm', act:'go', data:{ 'data-route':'exams' } })}`);
    },
    render, afterRender, handle, change,
    /* Bugün › Ayrıntı: aynı işleyiciler, aynı sayaç; ayrı bir çizim. */
    ayrinti:{
      id:'gun',
      title:'Günün ayrıntısı',
      subtitle(){ return 'Bloklar, sayaçlar ve günün bütün kartları'; },
      actions(){ return ''; },
      render:renderAyrinti, afterRender, handle, change,
    },
  };
})();

R.Screens.gun = R.Screens.today.ayrinti;
