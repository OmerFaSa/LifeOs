/* Bugün — günün pratiği girilir, karşılığı aynı sayfada görünür.

   Bu sayfaya girmenin sebebi çoğu zaman okumak değil YAZMAKTIR; bu yüzden
   varsayılan sekme Giriş'tir ve Özet ikinci sıradadır. Sonuç girdiden önce
   gelmez.

   Üç sekme: Giriş · Özet · Geçmiş. Önceden iki ayrı ekran (bugünün özeti ve
   oturum girişi) düşünülmüştü; ikisi de aynı günü anlatıyordu ve kullanıcı
   her seferinde hangisine gireceğini düşünmek zorunda kalıyordu. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.today = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  function gun(){ return S.ui.dayDate || U.todayISO(); }

  const TABS = [
    { id:'giris',  label:'Giriş' },
    { id:'ozet',   label:'Özet' },
    { id:'gecmis', label:'Geçmiş' },
  ];

  /* ------------------------------------------------------------ siradaki is */

  function nextCard(){
    const n = ESP.Planner.nextAction();
    return K.Entry({
      label:'SIRADAKİ İŞ', hint:'next-action',
      meta:n.rank ? 'Öncelik ' + n.rank : 'Bekleyen yok',
      note:n.why,
      body:K.NextUp({
        icon:n.rank ? 'zap' : 'check',
        calm:!n.rank,
        label:n.rank ? 'Kural motorunun seçtiği tek iş' : 'Bekleyen iş yok',
        title:n.title,
        why:n.detail,
        action:n.route && n.route !== 'today'
          ? K.Button({ label:'Aç', tone:'primary', size:'sm', act:'go',
              data:{ 'data-route':n.route } })
          : '',
      }),
    });
  }

  /* ------------------------------------------------------------ oturum girisi */

  function entryForm(){
    const d = S.ui.sessionDisc || 'lang';
    const disc = ESP.DISCIPLINE_BY_ID[d];

    return K.Entry({
      label:'OTURUM EKLE', hint:'practice-log',
      meta:U.fmtDate(gun()),
      note:'Süre ölçümdür: saatine bakıp yazdığın dakika da «ölçüldü» sayılır. '
         + 'Boş bıraktığın alan sıfır değil, «veri yok» olur.',
      body:html`
        <div class="picks picks--disc">
          ${map(ESP.Mod.active(), x => K.PickCard({
            on:x.id === d, act:'pick-disc', data:{ 'data-disc':x.id },
            title:x.short, note:x.unit,
          }))}
        </div>

        <div class="cols-3 mt-10">
          ${K.Field({ label:'Süre (dakika)',
            input:K.Input({ id:'s-min', type:'number', numeric:true, min:1, max:600,
              placeholder:'45', aria:'Oturum süresi dakika' }) })}
          ${K.Field({ label:countLabel(d), hint:'isteğe bağlı',
            input:K.Input({ id:'s-count', type:'number', numeric:true, min:0,
              placeholder:countPlaceholder(d), aria:countLabel(d) }) })}
          ${K.Field({ label:'Not', hint:'isteğe bağlı',
            input:K.Input({ id:'s-note', placeholder:'ne çalıştın?' }) })}
        </div>

        <div class="row mt-10">
          ${K.Button({ label:'Oturumu kaydet', tone:'primary', act:'add-session' })}
          ${when(disc, () => K.Button({ label:disc.label + ' ekranını aç', act:'go',
            data:{ 'data-route':disc.route } }))}
        </div>

        <p class="small muted mt-10">${disc ? disc.note : ''}</p>`,
    });
  }

  function countLabel(discId){
    if(discId === 'lang') return 'Çözülen kart';
    if(discId === 'writing') return 'Kelime';
    if(discId === 'reading') return 'Sayfa';
    if(discId === 'music' || discId === 'diction') return 'Temiz tekrar';
    return 'Sayım';
  }

  function countPlaceholder(discId){
    if(discId === 'writing') return '600';
    if(discId === 'reading') return '24';
    return '12';
  }

  /* Serbest metin girisi — palet disinda da kullanilabilsin diye burada da var. */
  function quickForm(){
    return K.Entry({
      label:'KONUŞARAK GİR',
      meta:'tek satır',
      note:'«45 dakika gitar çalıştım ve 20 dakika kelime tekrarı yaptım» gibi '
         + 'yazabilirsin. Anlaşılmayan satır atılmaz, sana geri gösterilir.',
      body:html`
        <div class="row">
          ${K.Input({ id:'quick-text', placeholder:'45 dk gitar, 20 dakika kelime',
            aria:'Serbest metin oturum girişi', class:'grow' })}
          ${K.Mic({ target:'quick-text' })}
          ${K.Button({ label:'Çöz', act:'parse-quick' })}
        </div>
        ${when(S.ui.quickParsed, () => quickPreview(S.ui.quickParsed))}`,
    });
  }

  function quickPreview(res){
    return html`
      <div class="mt-10">
        ${when(res.rows.length, () => html`
          ${K.Table({ tight:true, headers:['Disiplin', 'Süre', 'Sayım'],
            rows:res.rows.map(r => {
              const d = ESP.DISCIPLINE_BY_ID[r.disc];
              return [d ? d.label : r.disc, U.fmtMin(r.minutes),
                r.count != null ? U.fmtNum(r.count) + ' ' + (r.countWhat || '') : '—'];
            }) })}
          <div class="row mt-8">
            ${K.Button({ label:'Hepsini kaydet', tone:'primary', size:'sm', act:'save-quick' })}
            ${K.Button({ label:'Vazgeç', size:'sm', act:'clear-quick' })}
          </div>`)}
        ${when(res.unmatched.length, () => K.Notice({ tone:'warn', title:'Eşleşmedi',
          body:res.unmatched.map(u => '«' + U.esc(u.text) + '» — ' + u.why).join('<br/>')
             + '<br/><br/>Bu satırlar kaydedilmeyecek; yukarıdaki formdan elle girebilirsin.' }))}
      </div>`;
  }

  /* ------------------------------------------------------------- gunun listesi */

  function sessionList(){
    const rows = M.sessionsOf(gun());
    if(!rows.length){
      return K.Entry({
        label:'BUGÜN', meta:'kayıt yok',
        body:K.Empty({ text:'Bu güne henüz oturum girilmedi. '
          + 'Girilmemiş gün sıfır sayılmaz — hiçbir ortalamaya katılmaz.' }),
      });
    }
    const toplam = rows.reduce((a, s) => a + (s.minutes || 0), 0);
    return K.Entry({
      label:'BUGÜNÜN OTURUMLARI',
      meta:rows.length + ' oturum · ' + U.fmtMin(toplam),
      body:K.Table({ tight:true,
        headers:['Disiplin', 'Süre', 'Sayım', 'Not', ''],
        rows:rows.map(s => {
          const d = ESP.DISCIPLINE_BY_ID[s.disc];
          return [
            d ? d.label : s.disc,
            s.minutes != null ? U.fmtMin(s.minutes) : raw(String(P_cert('missing'))),
            s.count != null ? U.fmtNum(s.count) : raw(String(P_cert('missing'))),
            s.note || '—',
            K.Button({ label:'Sil', size:'sm', act:'del-session', data:{ 'data-id':s.id } }),
          ];
        }) }),
    });
  }

  /* Kesinlik rozeti — ekrana ozel kucuk parca. */
  function P_cert(cert){
    const c = ESP.CERTAINTY[cert] || ESP.CERTAINTY.missing;
    return K.Badge({ label:c.label, tone:c.tone, icon:false });
  }

  /* ------------------------------------------------------------------ ozet */

  function summaryRows(){
    const bugun = gun();
    const rows = M.sessionsOf(bugun);
    const toplam = rows.reduce((a, s) => a + (s.minutes || 0), 0);
    const taban = (S.profile && S.profile.dailyMinutes) || 60;
    const ehs = ESP.Intellect.ehs(14);
    const denge = ESP.Planner.balance(7);

    return [
      K.Entry({
        label:'GÜNÜN TOPLAMI',
        meta:rows.length ? U.fmtMin(toplam) : 'veri yok',
        note:'Taban ' + U.fmtMin(taban) + '. Taban bir hedef değil bir ölçüttür: '
           + 'altında kalmak başarısızlık değil, rotayı daraltan bir olgudur.',
        body:rows.length
          ? K.Meter({ label:'Taban doluluğu', value:Math.min(100, toplam / taban * 100),
              text:U.fmtMin(toplam) + ' / ' + U.fmtMin(taban) })
          : K.Notice({ tone:'info',
              body:'Bugüne hiç oturum girilmedi. Bu gün ortalamaya katılmaz.' }),
      }),

      K.Entry({
        label:'ASGARİ GÜN', hint:'minimum-day',
        meta:'kötü günün alt sınırı',
        note:ESP.MINIMUM_DAY.note,
        body:html`<ul class="setup__list">
          <li>${ESP.MINIMUM_DAY.srs}</li>
          <li>${ESP.MINIMUM_DAY.read}</li>
          <li>${ESP.MINIMUM_DAY.practice}</li>
        </ul>`,
      }),

      K.Entry({
        label:'ENTELEKTÜEL HACİM', hint:'ehs',
        meta:ehs.cert === 'missing' ? 'veri yok'
          : U.fmtNum(Math.round(ehs.value * 10) / 10),
        note:ehs.cert === 'missing'
          ? 'Son ' + ehs.windowDays + ' günde ölçülmüş pratik yok; hacim hesaplanmadı.'
          : ehs.windowDays + ' günün ' + ehs.enteredDays + '\'inden hesaplandı.',
        body:ehs.cert === 'missing'
          ? K.Empty({ text:'İlk oturumu girdiğinde hacim ölçülmeye başlar.' })
          : K.Table({ tight:true,
              headers:['Disiplin', { label:'Süre', num:true }, { label:'Katsayı', num:true }, 'Kaynak'],
              rows:ehs.rows.map(r => [
                r.disc.label,
                r.cert === 'missing' ? P_cert('missing') : U.fmtMin(Math.round(r.hours * 60)),
                r.cert === 'missing' ? '—' : U.fmtNum(Math.round(r.k * 100) / 100),
                r.kWhy,
              ]) }),
      }),

      K.Entry({
        label:'HAFTANIN DAĞILIMI',
        meta:denge.cert === 'missing' ? 'veri yok' : U.fmtMin(denge.totalMinutes),
        note:denge.skewed
          ? 'Pratik ' + denge.top.label + ' tarafına yığılmış ve '
            + denge.untouched.map(d => d.label).join(', ') + ' hiç açılmamış.'
          : 'Son ' + denge.windowDays + ' gün.',
        body:denge.cert === 'missing'
          ? K.Empty({ text:'Son yedi günde kayıt yok.' })
          : html`${map(denge.rows, r => html`
              <div class="mt-8">
                ${K.Meter({ label:r.disc.label,
                  value:r.share == null ? 0 : r.share * 100,
                  text:r.cert === 'missing' ? 'veri yok' : U.fmtMin(r.minutes) })}
              </div>`)}`,
      }),
    ];
  }

  /* ---------------------------------------------------------------- gecmis */

  function historyRows(){
    const gunler = U.lastDays(14).slice().reverse();
    const dolu = gunler.filter(d => M.dayHasEntry(S.days[d]));
    return [
      K.Entry({
        label:'SON 14 GÜN', hint:'streak',
        meta:dolu.length + ' günde kayıt · seri ' + M.streak() + ' gün',
        note:'Boş gün «0 dakika» değil «veri yok» sayılır. İkisi ayrı renkte durur.',
        wide:true,
        body:html`<div class="daystrip">
          ${map(gunler, d => {
            const gecti = M.dayHasEntry(S.days[d]);
            const dk = gecti ? M.minutesOf(d) : null;
            return html`<button class="${ESP.h.cls('daycell', gecti && 'is-on',
                d === gun() && 'is-sel')}"
              data-act="pick-day" data-date="${d}"
              title="${U.fmtDate(d) + (gecti ? ' · ' + U.fmtMin(dk || 0) : ' · veri yok')}">
              <span class="daycell__d">${d.slice(8)}</span>
              <span class="daycell__v">${gecti ? U.fmtNum(dk || 0) : '—'}</span>
            </button>`;
          })}
        </div>`,
      }),
      K.Entry({
        label:'SEÇİLİ GÜN',
        meta:U.fmtDate(gun()),
        action:gun() !== U.todayISO()
          ? K.Button({ label:'Bugüne dön', size:'sm', act:'today-back' }) : '',
        body:M.dayHasEntry(S.days[gun()])
          ? K.Table({ tight:true, headers:['Disiplin', 'Süre', 'Not'],
              rows:M.sessionsOf(gun()).map(s => {
                const d = ESP.DISCIPLINE_BY_ID[s.disc];
                return [d ? d.label : s.disc,
                  s.minutes != null ? U.fmtMin(s.minutes) : P_cert('missing'),
                  s.note || '—'];
              }) })
          : K.Empty({ text:'Bu güne kayıt girilmemiş.' }),
      }),
    ];
  }

  /* ---------------------------------------------------------- günün planı

     Sıradaki tek iş SIRAYI söyler, plan İÇERİĞİ. İkisi ayrı satırdır ve
     ayrı kalmalıdır: «bugün dil çalış» ile «on kartı bağlam cümlesiyle
     karta çevir» aynı cümle değildir.

     Plan en fazla İKİ disiplin taşır. Üçüncüyü eklemek, günde üç alan
     açmanın kibar hâlidir — üçü de kapanmaz. */
  function planRow(){
    const p = ESP.Coach.plan(gun());
    const asgari = ESP.Coach.minimumDay(gun());

    return K.Entry({
      label:'GÜNÜN REÇETESİ', hint:'coach',
      meta:p.minutes + ' dk',
      note:'Reçeteyi koç yazar, sırayı planlayıcı verir. Toplam, profildeki '
         + 'günlük tabandan (' + p.budget + ' dk) taşmaz.',
      action:K.Button({ label:'Merdiven', size:'sm', act:'go',
        data:{ 'data-route':'ladder' } }),
      wide:true,
      body:html`
        ${p.prescriptions.length
          ? map(p.prescriptions, r => html`
              <div class="rxblock">
                <div class="rxblock__head">
                  <b>${r.label}</b>
                  ${K.Badge({ label:r.level.label, tone:'muted', icon:false })}
                  ${K.Button({ label:'Masaya git', size:'sm', act:'go',
                    data:{ 'data-route':r.route } })}
                </div>
                <p class="small muted">${r.why}</p>
                <ul class="rx">${map(r.items, it => {
                  const bitti = (r.done || []).indexOf(it.drill.id) >= 0;
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
                })}</ul>
              </div>`)
          : K.Empty({ text:'Reçete yazılamadı: disiplin listesi boş.' })}

        ${K.Notice({ tone:asgari.metToday ? 'info' : 'warn',
          body:'Asgari gün — ' + (asgari.cards ? asgari.cards + ' vadeli kart, '
            : 'vadesi gelen kart yok, ') + asgari.read.toLocaleLowerCase('tr-TR')
            + ', ' + asgari.practice.toLocaleLowerCase('tr-TR') + '. '
            + asgari.note })}`,
    });
  }

  /* Bugüne düşen hatırlatmalar — bütün bölümlerden tek listede.

     Hatırlatıcı bir görev değildir ve kaçırılmış olması ceza üretmez.
     Burada durmasının tek sebebi, bölüm bölüm dolaşmadan görülebilmesi. */
  function reminderRow(){
    const bugun = M.dueReminders(null, gun())
      .filter(r => ESP.Mod.isOn(r.disc));
    if(!bugun.length) return '';
    return K.Entry({
      label:'HATIRLATMA', hint:'reminder',
      meta:bugun.length + ' satır',
      note:'Kendine söylediğin şeyler. Sistem hiçbirini zorunlu kılmaz; '
         + 'kaçırılan bir hatırlatıcı borç yazmaz.',
      wide:true,
      body:html`<ul class="remlist">${map(bugun, r => {
        const d = ESP.DISCIPLINE_BY_ID[r.disc] || {};
        return html`<li class="${cls('remrow', r.due < gun() && 'is-due')}">
          <span class="remrow__date num">${r.due}</span>
          <span class="remrow__text">${r.text}</span>
          <span class="tiny dim">${d.label || r.disc}</span>
          ${K.Button({ label:'Yapıldı', size:'sm', act:'desk-done-rem',
            data:{ 'data-id':r.id } })}
          ${K.Button({ label:'Bölüme git', size:'sm', act:'go',
            data:{ 'data-route':d.route || 'today' } })}
        </li>`;
      })}</ul>`,
    });
  }

  /* ------------------------------------------------------------------ cizim */

  function render(){
    const tab = S.ui.dayTab || 'giris';
    const rows = tab === 'ozet' ? summaryRows()
      : tab === 'gecmis' ? historyRows()
      : [nextCard(), planRow(), reminderRow(), entryForm(), quickForm(), sessionList()]
          .filter(Boolean);

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:tab, act:'day-tab', aria:'Günlük sekmeleri',
          items:TABS.map(t => Object.assign({}, t,
            t.id === 'giris' ? { count:M.sessionsOf(gun()).length || null } : {})) }),
      }))}
      ${K.Span(12, K.Ledger(() => rows))}`);
  }

  const handle = {
    async 'day-tab'(el){ S.ui.dayTab = el.dataset.tab; ESP.App.render(); },

    async 'pick-disc'(el){ S.ui.sessionDisc = el.dataset.disc; ESP.App.render(); },

    async 'add-session'(){
      const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const dakika = val('s-min');
      if(!dakika){ ESP.UI.toast('Süre girilmedi'); return; }
      await M.addSession(gun(), {
        disc:S.ui.sessionDisc || 'lang',
        minutes:dakika,
        count:val('s-count'),
        note:val('s-note'),
      });
      ESP.Memo.bitir();
      ESP.UI.toast('Oturum kaydedildi');
      ESP.App.render();
    },

    async 'del-session'(el){
      await M.deleteSession(gun(), el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'parse-quick'(){
      const el = document.getElementById('quick-text');
      const res = ESP.Parse.parseSession(el ? el.value : '');
      if(!res.rows.length && !res.unmatched.length){
        ESP.UI.toast('Bir şey anlaşılmadı');
        return;
      }
      S.ui.quickParsed = res;
      ESP.App.render();
    },

    async 'save-quick'(){
      const res = S.ui.quickParsed;
      if(!res) return;
      for(const r of res.rows){
        await M.addSession(gun(), { disc:r.disc, minutes:r.minutes, count:r.count, note:'' });
      }
      S.ui.quickParsed = null;
      ESP.Memo.bitir();
      ESP.UI.toast(res.rows.length + ' oturum kaydedildi');
      ESP.App.render();
    },

    async 'clear-quick'(){ S.ui.quickParsed = null; ESP.App.render(); },

    async 'pick-day'(el){ S.ui.dayDate = el.dataset.date; ESP.App.render(); },
    async 'today-back'(){ S.ui.dayDate = null; ESP.App.render(); },
  };

  const change = {};

  return {
    id:'today',
    title:'Bugün',
    headline(){
      const n = ESP.Planner.nextAction();
      return n.rank ? n.title : 'Bugün için bekleyen bir iş yok.';
    },
    lede(){
      const rows = M.sessionsOf(gun());
      if(!rows.length){
        return 'Bu güne henüz oturum girilmedi. Girilmemiş gün sıfır sayılmaz; '
             + 'hiçbir ortalamaya katılmaz.';
      }
      const toplam = rows.reduce((a, s) => a + (s.minutes || 0), 0);
      return rows.length + ' oturum, toplam ' + U.fmtMin(toplam) + '. '
           + 'Karşılığı Özet sekmesinde.';
    },
    stats(){
      const rows = M.sessionsOf(gun());
      const toplam = rows.reduce((a, s) => a + (s.minutes || 0), 0);
      const d = ESP.SRS.deckStatus();
      const ehs = ESP.Intellect.ehs(14);
      return [
        { value:rows.length ? U.fmtNum(toplam) : '—', unit:'dk', label:'bugün' },
        { value:String(d.due), label:'vadeli kart' },
        { value:String(M.streak()), unit:'gün', label:'seri' },
        { value:ehs.cert === 'missing' ? '—' : U.fmtNum(Math.round(ehs.value)), label:'hacim' },
      ];
    },
    subtitle(){ return U.fmtDate(gun()); },
    actions(){ return ''; },
    render, handle, change,
  };
})();
