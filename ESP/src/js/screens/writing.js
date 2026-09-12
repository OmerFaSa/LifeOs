/* Yazı Laboratuvarı — taslak, ölçüm ve üslup.

   İki sekme: Taslaklar · Ölçüm.

   Montaigne yargı vermez, ÖLÇER: cümle uzunluğu, tekrar eden kelime,
   okunabilirlik. «Bu deneme yayımlanmaya hazır» demek estetik otorite
   iddiasıdır ve ESP.Office.validate bunu yakalar.

   Okunabilirlik için Ateşman formülü kullanılır. Flesch Türkçede yanlış
   sonuç verir: Türkçe sondan eklemeli bir dildir, kelime başına hece sayısı
   doğal olarak yüksektir ve Flesch her Türkçe metni «çok zor» gösterir. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.writing = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'taslaklar', label:'Taslaklar' },
    { id:'olcum',     label:'Ölçüm' },
  ];

  function acikTaslak(){
    const id = S.ui.draftOpen;
    return id ? (S.drafts || []).find(d => d.id === id) : null;
  }

  /* --------------------------------------------------------------- taslaklar */

  function draftRows(){
    const acik = acikTaslak();
    const rows = [];

    if(acik){
      const ok = ESP.Intellect.readability(acik.text);
      const tekrar = ESP.Intellect.repeats(acik.text);
      rows.push(K.Entry({
        label:'TASLAK',
        meta:acik.title || 'başlıksız',
        note:ok.cert === 'missing' ? 'Ölçüm için en az bir tam cümle gerekir.'
          : ok.words + ' kelime · ' + ok.sentences + ' cümle · cümle başına '
            + U.fmtNum(ok.wordsPerSentence) + ' kelime',
        action:html`${K.Button({ label:'Kapat', size:'sm', act:'close-draft' })}
          ${K.Button({ label:'Sil', size:'sm', act:'del-draft', data:{ 'data-id':acik.id } })}`,
        wide:true,
        body:html`
          ${K.Input({ id:'d-title', value:acik.title, placeholder:'Başlık' })}
          ${K.Textarea({ id:'d-text', rows:14, value:acik.text,
            placeholder:'Yazmaya başla…' })}
          <div class="row wrap mt-10">
            ${K.Button({ label:'Kaydet', tone:'primary', act:'save-draft',
              data:{ 'data-id':acik.id } })}
            ${K.Button({ label:'Revizyon olarak kaydet', act:'save-revision',
              data:{ 'data-id':acik.id } })}
            ${K.Button({ label:'Bugüne oturum yaz', act:'log-writing',
              data:{ 'data-id':acik.id } })}
          </div>
          <p class="small muted mt-8">«Revizyon» sayacı üslup ölçümüne girer:
            sürekli yeni taslak açıp hiçbirini revize etmemek en yaygın yazı
            tıkanmasıdır. Sayı bir hedef değil bir aynadır.</p>

          ${when(ok.cert !== 'missing', () => html`
            <div class="mt-12">
              ${K.Meter({ label:'Okunabilirlik (Ateşman)', value:Math.max(0, Math.min(100, ok.value)),
                text:U.fmtNum(ok.value) + ' · ' + ok.band.label })}
              <p class="small muted mt-8">${ok.band.note}
                Bant bir not değil bir tarif: felsefi bir metnin «zor» olması beklenir.</p>
            </div>`)}

          ${when(tekrar.length, () => html`
            <div class="mt-12">
              <p class="small muted">Üç kez ve üzeri geçen kelimeler:</p>
              <div class="row wrap mt-4">
                ${map(tekrar, t => K.Chip({ label:t.word + ' · ' + t.count }))}
              </div>
            </div>`)}`,
      }));
    }

    const liste = S.drafts || [];
    rows.push(K.Entry({
      label:'TASLAKLAR',
      meta:liste.length + ' taslak',
      action:K.Button({ label:'Yeni taslak', tone:'primary', size:'sm', act:'new-draft' }),
      wide:true,
      body:liste.length
        ? K.Table({ tight:true,
            headers:['Başlık', { label:'Kelime', num:true }, { label:'Revizyon', num:true },
              'Güncellendi', ''],
            rows:liste.map(d => {
              const ok = ESP.Intellect.readability(d.text);
              return [
                d.title || 'başlıksız',
                ok.cert === 'missing' ? '—' : U.fmtNum(ok.words),
                String(d.revisions || 0),
                U.fmtShort((d.updatedAt || '').slice(0, 10)),
                K.Button({ label:'Aç', size:'sm', act:'open-draft', data:{ 'data-id':d.id } }),
              ];
            }) })
        : K.Empty({ text:'Henüz taslak yok. Bir başlık ve bir paragraf yeter; '
            + 'ölçüm oradan başlar.',
            action:K.Button({ label:'Yeni taslak', tone:'primary', act:'new-draft' }) }),
    }));

    return rows;
  }

  /* ------------------------------------------------------------------ ölçüm */

  function measureRows(){
    const w = ESP.Intellect.wordsWritten(7);
    const r = ESP.Intellect.draftRatio();
    const h = ESP.Intellect.hoursOf('writing', 14);
    const hepsi = (S.drafts || []);
    const olculen = hepsi.map(d => ({ d, ok:ESP.Intellect.readability(d.text) }))
      .filter(x => x.ok.cert !== 'missing');

    return [
      K.Entry({
        label:'HAFTALIK ÜRETİM',
        meta:w.cert === 'missing' ? 'veri yok' : U.fmtNum(w.value) + ' kelime',
        note:w.cert === 'missing'
          ? 'Son 7 günde yazı oturumu girilmemiş. Taslağı açıp kapatmak üretim sayılmaz; '
            + 'oturumu Bugün ekranından ya da taslak sayfasından yazarsın.'
          : w.windowDays + ' günün ' + w.enteredDays + '\'inde yazı oturumu var.',
        body:w.cert === 'missing'
          ? K.Empty({ text:'Ölçüm için oturum kaydı gerekir.' })
          : K.Meter({ label:'Son 7 gün', value:Math.min(100, w.value / 3500 * 100),
              text:U.fmtNum(w.value) + ' kelime' }),
      }),

      K.Entry({
        label:'TASLAK–REVİZYON', hint:'draft-ratio',
        meta:r.cert === 'missing' ? 'veri yok'
          : U.fmtNum(Math.round(r.value * 10) / 10) + ' / taslak',
        note:'Sürekli yeni taslak açıp hiçbirini revize etmemek en yaygın yazı '
           + 'tıkanmasıdır. Oran bir hedef değil bir aynadır.',
        body:r.cert === 'missing'
          ? K.Empty({ text:'Henüz taslak yok.' })
          : html`${K.Meter({ label:r.drafts + ' taslak, ' + r.revisions + ' revizyon',
              value:Math.min(100, r.value * 50), text:U.fmtNum(Math.round(r.value * 10) / 10) })}`,
      }),

      K.Entry({
        label:'OKUNABİLİRLİK', hint:'readability',
        meta:olculen.length + ' taslak ölçüldü',
        note:'Ateşman formülü: 198,825 − 40,175 × (hece/kelime) − 2,610 × (kelime/cümle). '
           + 'Türkçede hece sayısı = ünlü harf sayısıdır; bu yüzden hece sayacı bir '
           + 'tahmin değil bir ölçümdür.',
        wide:true,
        body:olculen.length
          ? K.Table({ tight:true,
              headers:['Taslak', { label:'Puan', num:true }, 'Bant',
                { label:'Kelime/cümle', num:true }, { label:'Hece/kelime', num:true }],
              rows:olculen.map(x => [
                x.d.title || 'başlıksız',
                U.fmtNum(x.ok.value),
                x.ok.band.label,
                U.fmtNum(x.ok.wordsPerSentence),
                U.fmtNum(x.ok.syllablesPerWord),
              ]) })
          : K.Empty({ text:'Ölçülecek metin yok.' }),
      }),

      K.Entry({
        label:'PRATİK SÜRESİ',
        meta:h.cert === 'missing' ? 'veri yok' : U.fmtMin(h.minutes),
        note:h.cert === 'missing'
          ? 'Son 14 günde yazı oturumu yok.'
          : h.windowDays + ' günün ' + h.enteredDays + '\'inde kayıt var. '
            + 'Girilmemiş gün ortalamaya katılmaz.',
        body:h.cert === 'missing'
          ? K.Empty({ text:'Oturum girildiğinde ölçülmeye başlar.' })
          : K.Meter({ label:'Son 14 gün', value:Math.min(100, h.minutes / 420 * 100),
              text:U.fmtMin(h.minutes) }),
      }),

      K.Entry({
        label:'SINIR', hint:'pedagogic',
        meta:'ne söylenmez',
        note:'Bu ekran üslup yargılamaz.',
        body:K.Notice({ tone:'info',
          body:'«Kusursuz», «yayımlanmaya hazır», «şaheser» gibi ifadeler estetik '
            + 'otorite iddiasıdır ve ajan çıktısında yakalanır. Ölçülebilen şey '
            + 'söylenir: uzunluk, tekrar, akış.' }),
      }),
    ];
  }

  /* ------------------------------------------------------------------ çizim */

  function render(){
    const tab = S.ui.writeTab || 'taslaklar';
    const rows = tab === 'olcum' ? measureRows() : draftRows();

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:tab, act:'write-tab', aria:'Yazı sekmeleri',
          items:TABS.map(t => Object.assign({}, t,
            t.id === 'taslaklar' ? { count:(S.drafts || []).length || null } : {})) }),
      }))}
      ${K.Span(12, K.Ledger(() => rows))}`);
  }

  function val(id){ const el = document.getElementById(id); return el ? el.value : ''; }

  const handle = {
    async 'write-tab'(el){ S.ui.writeTab = el.dataset.tab; ESP.App.render(); },

    async 'new-draft'(){
      const d = await M.saveDraft(M.newDraft({ title:'', text:'' }));
      S.ui.draftOpen = d.id;
      S.ui.writeTab = 'taslaklar';
      ESP.App.render();
    },

    async 'open-draft'(el){ S.ui.draftOpen = el.dataset.id; ESP.App.render(); },
    async 'close-draft'(){ S.ui.draftOpen = null; ESP.App.render(); },

    async 'save-draft'(el){
      const d = (S.drafts || []).find(x => x.id === el.dataset.id);
      if(!d) return;
      d.title = val('d-title').trim();
      d.text = val('d-text');
      await M.saveDraft(d);
      ESP.Memo.bitir();
      ESP.UI.toast('Kaydedildi');
      ESP.App.render();
    },

    async 'save-revision'(el){
      const d = (S.drafts || []).find(x => x.id === el.dataset.id);
      if(!d) return;
      d.title = val('d-title').trim();
      d.text = val('d-text');
      d.revisions = (d.revisions || 0) + 1;
      await M.saveDraft(d);
      ESP.Memo.bitir();
      ESP.UI.toast('Revizyon ' + d.revisions + ' kaydedildi');
      ESP.App.render();
    },

    async 'log-writing'(el){
      const d = (S.drafts || []).find(x => x.id === el.dataset.id);
      if(!d) return;
      const ok = ESP.Intellect.readability(val('d-text') || d.text);
      ESP.UI.sheet({
        title:'Yazı oturumu',
        body:String(html`
          <p class="small muted">Süre ölçümdür; kelime sayısı metinden sayıldı.</p>
          <div class="cols-2 mt-10">
            ${K.Field({ label:'Süre (dakika)',
              input:K.Input({ id:'wl-min', type:'number', numeric:true, min:1,
                placeholder:'40' }) })}
            ${K.Field({ label:'Kelime',
              input:K.Input({ id:'wl-words', type:'number', numeric:true,
                value:ok.cert === 'missing' ? '' : ok.words }) })}
          </div>`),
        footer:String(K.Button({ label:'Bugüne yaz', tone:'primary', act:'do-log-writing' })
          + K.Button({ label:'Vazgeç', act:'sheet-close' })),
      });
    },

    async 'do-log-writing'(){
      const dk = val('wl-min').trim();
      if(!dk){ ESP.UI.toast('Süre girilmedi'); return; }
      await M.addSession(U.todayISO(), {
        disc:'writing', minutes:dk, count:val('wl-words').trim(), note:'taslak',
      });
      ESP.Memo.bitir();
      ESP.UI.closeSheet();
      ESP.UI.toast('Bugüne yazıldı');
      ESP.App.render();
    },

    async 'del-draft'(el){
      await M.deleteDraft(el.dataset.id);
      S.ui.draftOpen = null;
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {};

  return {
    id:'writing',
    title:'Yazı Laboratuvarı',
    headline(){
      const w = ESP.Intellect.wordsWritten(7);
      if(!(S.drafts || []).length) return 'Henüz taslak yok.';
      if(w.cert === 'missing') return 'Son 7 günde yazı oturumu girilmemiş.';
      return 'Son 7 günde ' + U.fmtNum(w.value) + ' kelime yazıldı.';
    },
    lede(){
      const r = ESP.Intellect.draftRatio();
      if(r.cert === 'missing') return 'Bir başlık ve bir paragraf yeter; ölçüm oradan başlar.';
      return r.drafts + ' taslak, taslak başına '
        + U.fmtNum(Math.round(r.value * 10) / 10) + ' revizyon. '
        + 'Ölçülen şey üslup değil: uzunluk, tekrar, akış.';
    },
    stats(){
      const w = ESP.Intellect.wordsWritten(7);
      const r = ESP.Intellect.draftRatio();
      const son = (S.drafts || [])[0];
      const ok = son ? ESP.Intellect.readability(son.text) : { cert:'missing' };
      return [
        { value:String((S.drafts || []).length), label:'taslak' },
        { value:w.cert === 'missing' ? '—' : U.fmtNum(w.value), label:'kelime / 7g' },
        { value:r.cert === 'missing' ? '—' : String(r.revisions), label:'revizyon' },
        { value:ok.cert === 'missing' ? '—' : U.fmtNum(ok.value), label:'okunabilirlik' },
      ];
    },
    subtitle(){ return (S.drafts || []).length + ' taslak'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
