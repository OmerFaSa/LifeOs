/* Bugün — günün tek ekranı.

   Sıra bilinçli: önce kırmızı bayrak, sonra sıradaki hamle, sonra ölçüm ve
   asgari gün. Kullanıcı bu ekranı açtığında ne yapacağını düşünmek zorunda
   kalmaz; tek bir öncelik gösterilir.

   Yazım biçimi: STIL.md. Ekran string birleştirme kullanmaz. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.today = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  /* ---------------------------------------------------------- kartlar */

  function nextCard(){
    const n = SP.Calc.nextAction();
    return K.NextUp({
      icon:n.icon, label:n.label, hint:'next-action', calm:!!n.calm,
      title:n.title, why:n.why,
      action:n.calm ? null : K.Button({ label:n.action || 'Aç', tone:'primary', size:'sm',
        act:'go', data:{ 'data-route':n.route } }),
    });
  }

  function minimumCard(){
    const m = SP.Calc.minimumDay();
    const streak = SP.Calc.streak();
    return K.Card({
      title:'Asgari gün', hint:'minimum-day',
      sub:'Kötü günün alt sınırı',
      badge:K.Badge({ label:m.done + '/' + m.total, tone:m.complete ? 'ok' : 'warn' }),
      body:html`
        <div class="mt-2">${map(m.rows, P.minRow)}</div>
        <p class="small muted mt-10">${m.note}</p>`,
      foot:html`<span class="small">Davranış serisi <b class="num">${streak}</b> gün</span>`,
    });
  }

  function readinessCard(){
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    if(!r.ok){
      return K.Card({ title:'Toparlanma', hint:'readiness',
        body:html`${K.Notice({ tone:'info', body:r.note })}
          <div class="mt-10">${K.Button({ label:'Bugünün ölçümünü gir', size:'sm', tone:'primary',
            act:'go', data:{ 'data-route':'vitals' } })}</div>` });
    }
    return K.Card({
      title:'Toparlanma', hint:'readiness',
      sub:r.band.label,
      badge:K.Badge({ label:r.score + '/100', tone:r.band.tone }),
      body:html`
        ${K.Meter({ label:'Skor', value:r.score, text:String(r.score), tone:r.band.tone })}
        <div class="mt-10">${map(r.parts, p => html`
          <div class="${p.score == null ? 'readypart readypart--off' : 'readypart'}">
            <span class="readypart__label">${p.label}</span>
            <span class="small dim">${p.score == null ? 'girilmedi' : U.fmtNum(p.value)}</span>
            <span class="readypart__score num">${p.score == null ? '—' : Math.round(p.score)}</span>
          </div>`)}</div>
        ${when(r.missing.length, () => K.Notice({ tone:'info', class:'mt-10',
          body:'Eksik girdi: ' + r.missing.join(', ') + '. Ağırlığı kalan girdilere dağıtıldı — '
             + 'eksik veri sıfır sayılmaz.' }))}
        ${map(rx.reasons, x => K.Notice({ tone:x.kind === 'muted' ? 'info' : x.kind, class:'mt-8', body:x.text }))}`,
      foot:K.Button({ label:'Hareket ekranını aç', size:'sm', act:'go', data:{ 'data-route':'move' } }),
    });
  }

  function nutritionCard(){
    const d = U.todayISO();
    const t = SP.Nutri.dayTotals(d);
    const tg = SP.Nutri.targets();

    if(!tg.ok){
      return K.Card({ title:'Beslenme',
        body:K.Notice({ tone:'warn', title:'Hedef hesaplanamıyor.',
          body:'Profilde ' + tg.missing.join(', ') + ' eksik. Bu üçü olmadan '
             + 'kalori ve protein hedefi tahmin edilmez.' }),
        foot:K.Button({ label:'Profili tamamla', size:'sm', tone:'primary',
          act:'go', data:{ 'data-route':'family' } }) });
    }
    if(t.empty){
      return K.Card({ title:'Beslenme', sub:'Hedef ' + U.fmtNum(tg.kcal) + ' kcal',
        body:P.empty('Bugün hiç öğün girilmedi.', 'Öğün ekle', 'go', { 'data-route':'meals' }) });
    }

    return K.Card({
      title:'Beslenme', sub:t.meals + ' öğün girildi',
      badge:K.Badge({ label:Math.round(t.kcal) + ' / ' + tg.kcal + ' kcal',
        tone:t.kcal >= tg.kcal * 0.85 && t.kcal <= tg.kcal * 1.15 ? 'ok' : 'warn' }),
      body:html`
        ${raw(UI.macroSplit({ protein:t.protein * 4, fat:t.fat * 9, carb:t.carb * 4 }))}
        <div class="nutgrid mt-12">
          ${P.nutCell({ label:'Protein', got:t.protein, target:tg.protein.min, unit:'g' })}
          ${P.nutCell({ label:'Lif', got:t.fiber, target:tg.fiber, unit:'g' })}
          ${P.nutCell({ label:'Yağ', got:t.fat, target:tg.fat.min, unit:'g' })}
        </div>
        ${map(t.notes.slice(0, 2), P.absorbNote)}`,
      foot:K.Button({ label:'Öğünleri aç', size:'sm', act:'go', data:{ 'data-route':'meals' } }),
    });
  }

  function officeCard(){
    const d = U.todayISO();
    const b = S.officeBriefings[d];
    const notes = SP.Office.notes().slice(0, 4);
    return K.Card({
      title:'Ofisten', hint:'office',
      sub:'Beş ajan · günün notu',
      badge:b ? P.sourceBadge(b.source) : null,
      body:html`
        ${when(b, () => html`<p class="small">${b.text}</p>`)}
        ${when(!b, () => html`<p class="small dim">Günün brifingi henüz üretilmedi.</p>`)}
        ${when(notes.length, () => html`<div class="notes mt-12">${map(notes, n => html`
          <div class="note note--${n.tone}">
            ${P.avatar(n.agent, 'sm')}
            <div><b class="tiny">${n.name}</b> <span class="small">${n.text}</span></div>
          </div>`)}</div>`)}`,
      foot:html`${K.Button({ label:'Ofisi aç', size:'sm', act:'go', data:{ 'data-route':'office' } })}
        ${K.Button({ label:'Brifingi tazele', size:'sm', act:'refresh-briefing' })}`,
    });
  }

  function moneyCard(){
    const m = SP.Money.status();
    return K.Card({
      title:'Bütçe', hint:'budget-rank',
      badge:K.Badge({ label:m.tone === 'ok' ? 'uyumlu' : m.tone === 'muted' ? 'boş' : 'gözden geçir',
        tone:m.tone }),
      body:html`<p class="small">${m.text}</p>
        ${when(m.basket.limit != null && m.basket.rows.length, () => html`<div class="mt-10">
          ${K.Meter({ label:'Haftalık sınır', value:Math.min(100, m.basket.pct || 0),
            text:U.fmtNum(Math.round(m.basket.total)) + ' / ' + U.fmtNum(m.basket.limit) + ' TL',
            tone:m.basket.over ? 'danger' : '' })}</div>`)}`,
      foot:K.Button({ label:'Sepeti aç', size:'sm', act:'go', data:{ 'data-route':'basket' } }),
    });
  }

  /* ------------------------------------------------------------- ekran */

  async function render(){
    const flags = M.openFlags();

    return String(K.Grid([
      when(flags.length, () => K.Span(12, K.Stack(map(flags, P.flagCard), 'sm'))),

      K.Span(12, nextCard()),

      K.Span(8, K.Stack([
        readinessCard(),
        nutritionCard(),
        officeCard(),
      ])),

      K.Span(4, K.Stack([
        minimumCard(),
        moneyCard(),
        K.Card({ title:'Hızlı giriş', sub:'Tek satır, tek Enter',
          body:html`
            <div class="quick">
              ${K.Input({ id:'quick-meal', placeholder:'1 tabak etli kuru fasulye, 1 bardak ayran',
                aria:'Öğün metni' })}
              ${K.Button({ label:'Öğüne ekle', tone:'primary', act:'quick-meal' })}
              <span class="quick__hint">Gramaj ev ölçüsünden gelir ve «tahmin» olarak işaretlenir.
                Tarttıysan «150 g tavuk» yaz, «ölçüldü» olur.</span>
            </div>` }),
      ])),

      K.Span(12, raw(UI.rail(['next-action', 'minimum-day', 'readiness', 'certainty', 'privacy']))),
    ]));
  }

  const handle = {
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

  return {
    id:'today',
    title:'Bugün',
    subtitle(){
      const n = SP.Calc.nextAction();
      return n.calm ? 'Sıradaki hamle yok' : n.label + ' · ' + n.title;
    },
    actions(){
      return String(K.Button({ label:'Ölçüm gir', size:'sm', icon:'pulse',
        act:'go', data:{ 'data-route':'vitals' } }));
    },
    render, handle,
  };
})();
