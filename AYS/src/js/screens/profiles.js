/* Profiller — aynı cihazda birden fazla aday, gözetmen özeti ve kıyas.

   Her profilin verisi ayrı anahtarda durur; profiller birbirinin kaydını
   göremez. Gözetmen özeti yalnız özet sayıları okur, ham kaydı değil.

   Yazim bicimi: STIL.md. */

window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:170, group:'Git', label:'Profiller ve gözetmen özeti', icon:'shield', route:'profiles', run(){ R.App.go('profiles'); } });
window.LIFEOS.PARCA.yazilar({
  'ays.profiles.cihazdaki-profiller':'Cihazdaki profiller',
  'ays.profiles.her-profilin-verisi-ayri-tut':'Her profilin verisi ayrı tutulur',
  'ays.profiles.profil-ekle':'Profil ekle',
  'ays.profiles.acik':'açık',
  'ays.profiles.gec':'Geç',
  'ays.profiles.profil-degistirmek-sayfayi-y':'Profil değiştirmek sayfayı yeniden yükler. Veriler karışmaz; her profil kendi anahtarında saklanır.',
  'ays.profiles.profil-aktarimi':'Profil aktarımı',
  'ays.profiles.plani-ve-ayarlari-baska-ciha':'Planı ve ayarları başka cihaza ya da kişiye taşı',
  'ays.profiles.tum-veriyi-disa-aktar':'Tüm veriyi dışa aktar',
  'ays.profiles.yalniz-kurulumu-disa-aktar':'Yalnız kurulumu dışa aktar',
  'ays.profiles.kurulum-yukle':'Kurulum yükle',
  'ays.profiles.gozetmen-ozeti':'Gözetmen özeti',
  'ays.profiles.ogretmen-ya-da-veli-icin':'Öğretmen ya da veli için salt okunur',
  'ays.profiles.henuz-ozet-yok-her-profil':'Henüz özet yok. Her profil “Özeti yenile” dediğinde buraya bir satır bırakır.',
  'ays.profiles.bu-profilin-ozetini-yaz':'Bu profilin özetini yaz',
  'ays.profiles.ozeti-yenile':'Özeti yenile',
  'ays.profiles.hafta':'Hafta',
  'ays.profiles.plan':'Plan',
  'ays.profiles.kapanis':'Kapanış',
  'ays.profiles.tyt-medyan':'TYT medyan',
  'ays.profiles.seri':'Seri',
  'ays.profiles.bu-tablo-ham-kayit-icermez':'Bu tablo ham kayıt içermez: not, hata metni ve kişisel alan paylaşılmaz. Yalnız ilerleme sayıları görünür.',
  'ays.profiles.kiyas':'Kıyas',
  'ays.profiles.benzer-hedefli-adaylarla-kar':'Benzer hedefli adaylarla karşılaştırma',
  'ays.profiles.kiyas-icin-en-az-iki':'Kıyas için en az iki profilin özeti gerekir.',
  'ays.profiles.plan-tamamlama':'Plan tamamlama',
  'ays.profiles.konu-kapanisi':'Konu kapanışı',
  'ays.profiles.davranis-serisi':'Davranış serisi',
  'ays.profiles.tekrar-borcu':'Tekrar borcu',
  'ays.profiles.kendi-verinle-diger-profille':'Kendi verinle diğer profillerin ortalaması',
  'ays.profiles.sen':'Sen',
  'ays.profiles.ortalama':'Ortalama',
  'ays.profiles.fark':'Fark',
  'ays.profiles.yeni-adayin-verisi-ayri-tutu':'Yeni adayın verisi ayrı tutulur',
  'ays.profiles.profil-adi':'Profil adı',
  'ays.profiles.or-kardesim':'ör. Kardeşim',
  'ays.profiles.vazgec':'Vazgeç',
  'ays.profiles.olustur-ve-gec':'Oluştur ve geç',
  'ays.profiles.kurulum-dosyasi-indirildi':'Kurulum dosyası indirildi',
  'ays.profiles.kurulum-panoya-kopyalandi':'Kurulum panoya kopyalandı',
  'ays.profiles.kurulum':'Kurulum',
  'ays.profiles.kopyalayip-aktarabilirsin':'Kopyalayıp aktarabilirsin',
  'ays.profiles.kapat':'Kapat',
  'ays.profiles.yalniz-hedef-takvim-kapasite':'Yalnız hedef, takvim, kapasite ve seviye aktarılır',
  'ays.profiles.kurulum-json-u':'Kurulum JSON’u',
  'ays.profiles.disa-aktarilan-kurulum-metni':'Dışa aktarılan kurulum metnini yapıştır',
  'ays.profiles.yukle':'Yükle',
  'ays.profiles.gecerli-json-degil':'Geçerli JSON değil',
  'ays.profiles.bu-bir-kurulum-dosyasi-degil':'Bu bir kurulum dosyası değil',
  'ays.profiles.profiller':'Profiller',
});
window.LIFEOS.PARCA.sayfa({ id:'profiles', modul:'ays', cekmece:'ayarlar', ad:'Profil', ikon:'shield', sira:20 });

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
      title:yz('ays.profiles.cihazdaki-profiller'), sub:yz('ays.profiles.her-profilin-verisi-ayri-tut'),
      actions:K.Button({ label:yz('ays.profiles.profil-ekle'), icon:'plus', size:'sm', tone:'primary', act:'prof-new' }),
      body:html`<div class="list">${map(list, p => html`
        <div class="listitem">
          <span class="${p.id === active ? 'notedot is-done' : 'notedot'}">${raw(UI.icon(p.id === active ? 'check' : 'today'))}</span>
          <div class="grow">
            <div class="row-sm wrap"><b>${p.name}</b>
              ${when(p.id === active, () => K.Badge({ label:yz('ays.profiles.acik'), tone:'ok' }))}</div>
            <div class="tiny dim">${p.createdAt ? U.fmtDate(R.U.gunOf(p.createdAt)) + ' tarihinde eklendi' : 'ilk profil'}</div>
          </div>
          ${when(p.id !== active, () => K.Button({ label:yz('ays.profiles.gec'), size:'sm',
            act:'prof-switch', data:{ 'data-id':p.id } }))}
        </div>`)}</div>
        <p class="tiny dim mt-10">${yz('ays.profiles.profil-degistirmek-sayfayi-y')}</p>`,
    });
  }

  function transferCard(){
    return K.Card({
      title:yz('ays.profiles.profil-aktarimi'), sub:yz('ays.profiles.plani-ve-ayarlari-baska-ciha'),
      body:html`
        ${K.Notice({ tone:'info', body:'Dışa aktarım tüm çalışma verini içerir. Başka birine '
          + 'yalnız planı vermek istersen “Yalnız kurulum” seçeneğini kullan: hedef, takvim, '
          + 'kapasite ve seviye gider; deneme ve hata kayıtların gitmez.' })}
        ${K.Row([
          K.Button({ label:yz('ays.profiles.tum-veriyi-disa-aktar'), icon:'download', act:'export-data' }),
          K.Button({ label:yz('ays.profiles.yalniz-kurulumu-disa-aktar'), icon:'download', act:'prof-export-setup' }),
          K.Button({ label:yz('ays.profiles.kurulum-yukle'), icon:'upload', act:'prof-import-setup' }),
        ], { wrap:true })}`,
    });
  }

  /* ---------- gözetmen ---------- */

  function supervisorCard(){
    const snaps = snapshots();
    const ids = Object.keys(snaps);
    const active = M.activeProfileId();

    if(!ids.length){
      return K.Card({ title:yz('ays.profiles.gozetmen-ozeti'), sub:yz('ays.profiles.ogretmen-ya-da-veli-icin'),
        body:K.Empty({ icon:'chart',
          text:yz('ays.profiles.henuz-ozet-yok-her-profil'),
          action:K.Button({ label:yz('ays.profiles.bu-profilin-ozetini-yaz'), size:'sm', tone:'primary', act:'prof-snapshot' }) }) });
    }

    const rows = ids.map(id => {
      const x = snaps[id];
      const stale = U.diffDays(R.U.gunOf(x.at), U.todayISO());
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
      title:yz('ays.profiles.gozetmen-ozeti'), sub:ids.length + ' profil · yalnız özet sayılar',
      actions:K.Button({ label:yz('ays.profiles.ozeti-yenile'), icon:'refresh', size:'sm', act:'prof-snapshot' }),
      body:html`
        ${K.Table({ tight:true,
          headers:['Aday', { label:yz('ays.profiles.hafta'), num:true }, { label:yz('ays.profiles.plan'), num:true },
            { label:yz('ays.profiles.kapanis'), num:true }, { label:yz('ays.profiles.tyt-medyan'), num:true },
            { label:yz('ays.profiles.seri'), num:true }, 'Güncellik'],
          rows })}
        <p class="tiny dim mt-10">${yz('ays.profiles.bu-tablo-ham-kayit-icermez')}</p>`,
    });
  }

  /* ---------- kıyas ---------- */

  function compareCard(){
    const snaps = snapshots();
    const ids = Object.keys(snaps);
    const me = snaps[M.activeProfileId()];
    const others = ids.filter(id => id !== M.activeProfileId()).map(id => snaps[id]);

    if(!me || !others.length){
      return K.Card({ title:yz('ays.profiles.kiyas'), sub:yz('ays.profiles.benzer-hedefli-adaylarla-kar'),
        body:K.Empty({ icon:'chart', text:yz('ays.profiles.kiyas-icin-en-az-iki') }) });
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
      { key:'completion', label:yz('ays.profiles.plan-tamamlama'), unit:'%', better:'high' },
      { key:'closure',    label:yz('ays.profiles.konu-kapanisi'),  unit:'%', better:'high' },
      { key:'streak',     label:yz('ays.profiles.davranis-serisi'), unit:' gün', better:'high' },
      { key:'cardDebt',   label:yz('ays.profiles.tekrar-borcu'),   unit:'%', better:'low' },
    ].map(r => {
      const b = band(me[r.key], others, r.key, r.better);
      return { r, b };
    }).filter(x => x.b);

    return K.Card({
      title:yz('ays.profiles.kiyas'), sub:yz('ays.profiles.kendi-verinle-diger-profille'),
      body:html`
        ${K.Table({ tight:true, headers:['Ölçüt', { label:yz('ays.profiles.sen'), num:true },
          { label:yz('ays.profiles.ortalama'), num:true }, { label:yz('ays.profiles.fark'), num:true }],
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

  LIFEOS.PARCA.blok({ id:'profiles.profilecard', sayfa:'profiles', yer:'y1', sira:10, ad:'Profil', ciz(){
    return profileCard();
  } });
  LIFEOS.PARCA.blok({ id:'profiles.transfercard', sayfa:'profiles', yer:'y1', sira:20, ad:'Aktarım', ciz(){
    return transferCard();
  } });
  LIFEOS.PARCA.blok({ id:'profiles.supervisorcard', sayfa:'profiles', yer:'y2', sira:10, ad:'Gözetmen özeti', ciz(){
    return supervisorCard();
  } });
  LIFEOS.PARCA.blok({ id:'profiles.comparecard', sayfa:'profiles', yer:'y2', sira:20, ad:'Karşılaştırma', ciz(){
    return compareCard();
  } });
  async function render(){
    return String(K.Grid([
    K.Span(7, K.Stack(LIFEOS.PARCA.liste('profiles', 'y1', K, undefined))),
    K.Span(5, K.Stack(LIFEOS.PARCA.liste('profiles', 'y2', K, undefined))),
  ]));
  }

  const handle = {
    async 'prof-new'(){
      UI.sheet({
        title:yz('ays.profiles.profil-ekle'), subtitle:yz('ays.profiles.yeni-adayin-verisi-ayri-tutu'),
        body:String(K.Stack([
          K.Notice({ tone:'info', body:'Yeni profil boş başlar ve kurulum sihirbazı açılır. '
            + 'Mevcut profilin verisi etkilenmez.' }),
          K.Field({ label:yz('ays.profiles.profil-adi'), input:K.Input({ id:'pf-name', placeholder:yz('ays.profiles.or-kardesim') }) }),
        ])),
        footer:String(html`${K.Button({ label:yz('ays.profiles.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('ays.profiles.olustur-ve-gec'), tone:'primary', act:'prof-create' })}`),
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
        }, false, 'Profile geç');
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
          if(dl){ await dl.save({ filename, data:json }); UI.toast(yz('ays.profiles.kurulum-dosyasi-indirildi')); return; }
        }
        await navigator.clipboard.writeText(json);
        UI.toast(yz('ays.profiles.kurulum-panoya-kopyalandi'));
      }catch(e){
        UI.sheet({ title:yz('ays.profiles.kurulum'), subtitle:yz('ays.profiles.kopyalayip-aktarabilirsin'),
          body:String(K.Textarea({ id:'pf-out', rows:12, value:json })),
          footer:String(K.Button({ label:yz('ays.profiles.kapat'), act:'sheet-close' })) });
      }
    },
    async 'prof-import-setup'(){
      UI.sheet({
        title:yz('ays.profiles.kurulum-yukle'), subtitle:yz('ays.profiles.yalniz-hedef-takvim-kapasite'),
        body:String(K.Stack([
          K.Notice({ tone:'warn', body:'Bu işlem mevcut kurulumunu değiştirir ve planı yeniden üretir. '
            + 'Deneme, hata ve kart kayıtların korunur.' }),
          K.Field({ label:yz('ays.profiles.kurulum-json-u'), input:K.Textarea({ id:'pf-in', rows:10,
            placeholder:yz('ays.profiles.disa-aktarilan-kurulum-metni') }) }),
        ])),
        footer:String(html`${K.Button({ label:yz('ays.profiles.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('ays.profiles.yukle'), tone:'primary', act:'prof-import-run' })}`),
      });
    },
    async 'prof-import-run'(){
      let obj;
      try{ obj = JSON.parse(document.getElementById('pf-in').value); }
      catch(e){ UI.toast(yz('ays.profiles.gecerli-json-degil')); return; }
      if(!obj || !obj.setup){ UI.toast(yz('ays.profiles.bu-bir-kurulum-dosyasi-degil')); return; }

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
    title:yz('ays.profiles.profiller'),
    subtitle(){
      const n = M.profileList().length;
      return n > 1 ? n + ' profil · gözetmen ve kıyas' : 'Çoklu kullanım, aktarım ve gözetmen özeti';
    },
    actions(){ return ''; },
    render, handle, writeSnapshot,
  };
})();
