/* Profiller — aynı cihazda birden fazla aday, gözetmen özeti ve kıyas.

   Her profilin verisi ayrı anahtarda durur; profiller birbirinin kaydını
   göremez. Gözetmen özeti yalnız özet sayıları okur, ham kaydı değil.

   Yazim bicimi: STIL.md. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.profiles = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const SNAPSHOT_KEY = 'rota.snapshots';

  /* Her profil kapanırken küçük bir özet bırakır; gözetmen bunu okur.
     Ham veri paylaşılmaz — yalnız sayılar. */
  function snapshots(){
    try{ return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '{}'); }
    catch(e){ return {}; }
  }
  function writeSnapshot(){
    try{
      const all = snapshots();
      const tyt = C.medianTrend('TYT');
      const est = C.estimateScore();
      all[M.activeProfileId()] = {
        name:(S.profile && S.profile.name) || 'Adsız',
        program:(S.profile && S.profile.program) || '',
        week:M.currentWeek(),
        totalWeeks:R.PLAN.totalWeeks,
        completion:C.planCompletion(M.currentWeek()),
        closure:C.overallClosure().pct,
        tytMedian:tyt.last3,
        streak:C.behaviorStreak().streak,
        cardDebt:C.cardDebt(),
        analysisDebt:C.analysisDebt().length,
        rankBest:est.ok ? est.rankBest : null,
        rankWorst:est.ok ? est.rankWorst : null,
        targetRank:(S.profile && S.profile.targetRank) || null,
        at:new Date().toISOString(),
      };
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(all));
      return true;
    }catch(e){ return false; }
  }

  /* ---------- profiller ---------- */

  function profileCard(){
    const list = M.profileList();
    const active = M.activeProfileId();
    return K.Card({
      title:'Cihazdaki profiller', sub:'Her profilin verisi ayrı tutulur',
      actions:K.Button({ label:'Profil ekle', icon:'plus', size:'sm', tone:'primary', act:'prof-new' }),
      body:html`<div class="list">${map(list, p => html`
        <div class="listitem">
          <span class="${p.id === active ? 'notedot is-done' : 'notedot'}">${raw(UI.icon(p.id === active ? 'check' : 'today'))}</span>
          <div class="grow">
            <div class="row-sm wrap"><b>${p.name}</b>
              ${when(p.id === active, () => K.Badge({ label:'açık', tone:'ok' }))}</div>
            <div class="tiny dim">${p.createdAt ? U.fmtDate(p.createdAt.slice(0, 10)) + ' tarihinde eklendi' : 'ilk profil'}</div>
          </div>
          ${when(p.id !== active, () => K.Button({ label:'Geç', size:'sm',
            act:'prof-switch', data:{ 'data-id':p.id } }))}
        </div>`)}</div>
        <p class="tiny dim mt-10">Profil değiştirmek sayfayı yeniden yükler. Veriler karışmaz;
          her profil kendi anahtarında saklanır.</p>`,
    });
  }

  function transferCard(){
    return K.Card({
      title:'Profil aktarımı', sub:'Planı ve ayarları başka cihaza ya da kişiye taşı',
      body:html`
        ${K.Notice({ tone:'info', body:'Dışa aktarım tüm çalışma verini içerir. Başka birine '
          + 'yalnız planı vermek istersen “Yalnız kurulum” seçeneğini kullan: hedef, takvim, '
          + 'kapasite ve seviye gider; deneme ve hata kayıtların gitmez.' })}
        ${K.Row([
          K.Button({ label:'Tüm veriyi dışa aktar', icon:'download', act:'export-data' }),
          K.Button({ label:'Yalnız kurulumu dışa aktar', icon:'download', act:'prof-export-setup' }),
          K.Button({ label:'Kurulum yükle', icon:'upload', act:'prof-import-setup' }),
        ], { wrap:true })}`,
    });
  }

  /* ---------- gözetmen ---------- */

  function supervisorCard(){
    const snaps = snapshots();
    const ids = Object.keys(snaps);
    const active = M.activeProfileId();

    if(!ids.length){
      return K.Card({ title:'Gözetmen özeti', sub:'Öğretmen ya da veli için salt okunur',
        body:K.Empty({ icon:'chart',
          text:'Henüz özet yok. Her profil “Özeti yenile” dediğinde buraya bir satır bırakır.',
          action:K.Button({ label:'Bu profilin özetini yaz', size:'sm', tone:'primary', act:'prof-snapshot' }) }) });
    }

    const rows = ids.map(id => {
      const x = snaps[id];
      const stale = U.diffDays(x.at.slice(0, 10), U.todayISO());
      return [
        html`<div><b class="small">${x.name}</b>
          <div class="tiny dim">${x.program || '—'}${id === active ? ' · açık profil' : ''}</div></div>`,
        html`<span class="num">H${x.week}/${x.totalWeeks}</span>`,
        html`<span class="${x.completion == null ? 'num dim' : x.completion >= 85 ? 'num' : 'num is-down'}">${
          x.completion == null ? '—' : '%' + x.completion}</span>`,
        html`<span class="num">%${x.closure}</span>`,
        html`<span class="num">${x.tytMedian == null ? '—' : U.fmtNet(x.tytMedian)}</span>`,
        html`<span class="num">${x.streak}</span>`,
        html`<span class="${stale > 7 ? 'tiny dim is-down' : 'tiny dim'}">${stale === 0 ? 'bugün' : stale + ' gün önce'}</span>`,
      ];
    });

    return K.Card({
      title:'Gözetmen özeti', sub:ids.length + ' profil · yalnız özet sayılar',
      actions:K.Button({ label:'Özeti yenile', icon:'refresh', size:'sm', act:'prof-snapshot' }),
      body:html`
        ${K.Table({ tight:true,
          headers:['Aday', { label:'Hafta', num:true }, { label:'Plan', num:true },
            { label:'Kapanış', num:true }, { label:'TYT medyan', num:true },
            { label:'Seri', num:true }, 'Güncellik'],
          rows })}
        <p class="tiny dim mt-10">Bu tablo ham kayıt içermez: not, hata metni ve kişisel alan
          paylaşılmaz. Yalnız ilerleme sayıları görünür.</p>`,
    });
  }

  /* ---------- kıyas ---------- */

  function compareCard(){
    const snaps = snapshots();
    const ids = Object.keys(snaps);
    const me = snaps[M.activeProfileId()];
    const others = ids.filter(id => id !== M.activeProfileId()).map(id => snaps[id]);

    if(!me || !others.length){
      return K.Card({ title:'Kıyas', sub:'Benzer hedefli adaylarla karşılaştırma',
        body:K.Empty({ icon:'chart', text:'Kıyas için en az iki profilin özeti gerekir.' }) });
    }

    const band = (mine, list, label, better) => {
      const vals = list.map(x => x[label]).filter(v => v != null);
      if(!vals.length || mine == null) return null;
      const avg = U.round(U.sum(vals) / vals.length, 1);
      const diff = U.round(mine - avg, 1);
      const good = better === 'high' ? diff >= 0 : diff <= 0;
      return { avg, diff, good };
    };

    const rows = [
      { key:'completion', label:'Plan tamamlama', unit:'%', better:'high' },
      { key:'closure',    label:'Konu kapanışı',  unit:'%', better:'high' },
      { key:'streak',     label:'Davranış serisi', unit:' gün', better:'high' },
      { key:'cardDebt',   label:'Tekrar borcu',   unit:'%', better:'low' },
    ].map(r => {
      const b = band(me[r.key], others, r.key, r.better);
      return { r, b };
    }).filter(x => x.b);

    return K.Card({
      title:'Kıyas', sub:'Kendi verinle diğer profillerin ortalaması',
      body:html`
        ${K.Table({ tight:true, headers:['Ölçüt', { label:'Sen', num:true },
          { label:'Ortalama', num:true }, { label:'Fark', num:true }],
          rows:rows.map(x => [
            x.r.label,
            html`<b class="num">${me[x.r.key]}${x.r.unit}</b>`,
            html`<span class="num dim">${x.b.avg}${x.r.unit}</span>`,
            html`<span class="${x.b.good ? 'num is-up' : 'num is-down'}">${
              (x.b.diff > 0 ? '+' : '') + x.b.diff}${x.r.unit}</span>`,
          ]) })}
        ${K.Notice({ tone:'info', class:'mt-12',
          body:'Kıyas motivasyon aracıdır, karar aracı değil. Kendi medyanın ve kendi konu '
             + 'kapanışın tek bağlayıcı ölçüdür; başkasının hızı seninkini geçersiz kılmaz.' })}`,
    });
  }

  /* ---------- kurulum aktarımı ---------- */

  function setupPayload(){
    const p = S.profile || {};
    return {
      __meta:{ app:'rota84285', kind:'setup', at:new Date().toISOString(), schemaVersion:R.SCHEMA_VERSION },
      setup:{
        program:p.program, targetRank:p.targetRank, diplomaGrade:p.diplomaGrade,
        startDate:p.startDate, examTytISO:p.examTytISO, examAytISO:p.examAytISO,
        capacityHoursPerWeek:p.capacityHoursPerWeek, studyDaysPerWeek:p.studyDaysPerWeek,
        sleepTarget:p.sleepTarget, level:p.level, weakSubjects:p.weakSubjects,
        theme:p.theme, palette:p.palette, coachTone:p.coachTone,
      },
      calendar:S.calendar.map(x => ({ kind:x.kind, from:x.from, to:x.to, note:x.note, load:x.load })),
    };
  }

  async function render(){
    return String(K.Grid([
      K.Span(7, K.Stack([profileCard(), transferCard()])),
      K.Span(5, K.Stack([supervisorCard(), compareCard()])),
    ]));
  }

  const handle = {
    async 'prof-new'(){
      UI.sheet({
        title:'Profil ekle', subtitle:'Yeni adayın verisi ayrı tutulur',
        body:String(K.Stack([
          K.Notice({ tone:'info', body:'Yeni profil boş başlar ve kurulum sihirbazı açılır. '
            + 'Mevcut profilin verisi etkilenmez.' }),
          K.Field({ label:'Profil adı', input:K.Input({ id:'pf-name', placeholder:'ör. Kardeşim' }) }),
        ])),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Oluştur ve geç', tone:'primary', act:'prof-create' })}`),
      });
    },
    async 'prof-create'(){
      const name = (document.getElementById('pf-name').value || '').trim() || 'Yeni profil';
      const rec = await M.saveProfileEntry({ name });
      writeSnapshot();
      UI.closeSheet();
      M.switchProfile(rec.id);
    },
    async 'prof-switch'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Profil değiştir',
        'Sayfa yeniden yüklenecek ve o profilin verisi açılacak. Bu profilin verisi silinmez.',
        async () => {
          writeSnapshot();
          M.switchProfile(id);
        });
    },
    async 'prof-snapshot'(){
      const ok = writeSnapshot();
      UI.toast(ok ? 'Özet güncellendi' : 'Özet yazılamadı');
      R.App.render();
    },
    async 'prof-export-setup'(){
      const json = JSON.stringify(setupPayload(), null, 2);
      const filename = 'rota-kurulum-' + U.todayISO() + '.json';
      try{
        if(window.claude && window.claude.use){
          const dl = await window.claude.use('downloads');
          if(dl){ await dl.save({ filename, data:json }); UI.toast('Kurulum dosyası indirildi'); return; }
        }
        await navigator.clipboard.writeText(json);
        UI.toast('Kurulum panoya kopyalandı');
      }catch(e){
        UI.sheet({ title:'Kurulum', subtitle:'Kopyalayıp aktarabilirsin',
          body:String(K.Textarea({ id:'pf-out', rows:12, value:json })),
          footer:String(K.Button({ label:'Kapat', act:'sheet-close' })) });
      }
    },
    async 'prof-import-setup'(){
      UI.sheet({
        title:'Kurulum yükle', subtitle:'Yalnız hedef, takvim, kapasite ve seviye aktarılır',
        body:String(K.Stack([
          K.Notice({ tone:'warn', body:'Bu işlem mevcut kurulumunu değiştirir ve planı yeniden üretir. '
            + 'Deneme, hata ve kart kayıtların korunur.' }),
          K.Field({ label:'Kurulum JSON’u', input:K.Textarea({ id:'pf-in', rows:10,
            placeholder:'Dışa aktarılan kurulum metnini yapıştır' }) }),
        ])),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Yükle', tone:'primary', act:'prof-import-run' })}`),
      });
    },
    async 'prof-import-run'(){
      let obj;
      try{ obj = JSON.parse(document.getElementById('pf-in').value); }
      catch(e){ UI.toast('Geçerli JSON değil'); return; }
      if(!obj || !obj.setup){ UI.toast('Bu bir kurulum dosyası değil'); return; }

      Object.assign(S.profile, obj.setup, { setupDone:true });
      await M.saveProfile();

      if(Array.isArray(obj.calendar)){
        for(const c of obj.calendar) await M.saveCalendar(c);
      }
      const plan = await M.ensurePlan(true);
      await M.ensureWeek(M.currentWeek());
      await M.ensureDay(U.today());

      UI.closeSheet();
      R.App.applyTheme();
      UI.toast(plan.meta.total + ' haftalık plan yeniden üretildi');
      R.App.render();
    },
  };

  return {
    id:'profiles',
    title:'Profiller',
    subtitle(){
      const n = M.profileList().length;
      return n > 1 ? n + ' profil · gözetmen ve kıyas' : 'Çoklu kullanım, aktarım ve gözetmen özeti';
    },
    actions(){ return ''; },
    render, handle, writeSnapshot,
  };
})();
