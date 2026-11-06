/* Merdiven — sıfırdan üstatlığa yedi disiplinin kademesi.

   Bu ekran bir «puan tablosu» değildir ve öyle çizilmemelidir. Taşıdığı tek
   cümle şudur: şu an nerede duruyorsun, bir sonraki kapı hangisi ve o kapıyı
   açan ölçüm ne?

   Üç şey bilinçli olarak YOKTUR:

     Süre tahmini.  «Üç ayda usta olursun» ESP.PEDAGOGIC.never içindeki
                    garanti yasağına girer.
     Rozet.         Kademe bir ödül değil bir konumdur; üretim dururken
                    kademe de durur.
     Tek puan.      Yedi disiplin tek sayıya toplanmaz — toplanan sayı,
                    hangi disiplinin çöktüğünü gizler.

   Ölçülemeyen basamak üçüncü bir renkle durur: ne geçilmiş ne kalınmış.
   Orada istenen şey çalışmak değil ÖLÇMEKTİR. */
window.LIFEOS.PARCA.yazilar({
  'esp.ladder.karisik-sinama':'Karışık sınama',
  'esp.ladder.konu-olculdu':'konu ölçüldü',
});

window.LIFEOS.PARCA.yazilar({
  'esp.ladder.hicbir-disiplinde-olculmus-u':'Henüz ölçüm yok. ',
  'esp.ladder.merdiven-ilk-olcumle-baslar':'Kısa bir sınamayla başla.',
  'esp.ladder.once-olc':'Önce ölç',
  'esp.ladder.siradaki-kapi':'Sıradaki kapı',
  'esp.ladder.ustat-kademesi-bile-bu-madde':'Üstat kademesi bile bu maddeleri kapatmaz. Merdiven bir ',
  'esp.ladder.ne-calisilir':'Ne çalışılır',
  'esp.ladder.merdiven-henuz-baslamadi':'Merdiven henüz başlamadı.',
  'esp.ladder.olculmus-uretim-2':'Ölçülmüş üretim «',
  'esp.ladder.kademe-kisiye-degil-ureti-me':'Kademe kişiye değil ÜRETİME verilir. Ölçüm dururken kademe de ',
});


window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'esp', sira:90, id:'act:ladder', kind:'Eylem', label:'Merdiveni aç',
  hint:'Günlük', run:() => { ESP.S.ui.ladderTab = 'ozet'; ESP.App.go('ladder'); } });
window.LIFEOS.PARCA.yazilar({
  'esp.ladder.genel-kademe':'Genel kademe',
  'esp.ladder.olculmus-uretim':'Ölçülmüş üretim',
  'esp.ladder.merdivenin-tamami':'Merdivenin tamamı',
  'esp.ladder.disiplinler':'Disiplinler',
  'esp.ladder.olculemeyen-basamaklar':'Ölçülemeyen basamaklar',
  'esp.ladder.olcmeye-git':'Ölçmeye git',
  'esp.ladder.bir-sonraki-kapilarin-hepsi':'Bir sonraki kapıların hepsi ölçülebiliyor.',
  'esp.ladder.yol':'YOL',
  'esp.ladder.merdiven-yok':'Merdiven yok.',
  'esp.ladder.masaya-git':'Masaya git',
  'esp.ladder.merdiven':'Merdiven',
  'esp.ladder.beyana-dayali-kademe':'Beyana dayalı kademe',
  'esp.ladder.bu-merdivenin-goremedigi':'Bu merdivenin göremediği',
  'esp.ladder.kademe':'Kademe ',
  'esp.ladder.kapanis-isi':'Kapanış işi:',
  'esp.ladder.seviye-tespiti':'Seviye tespiti',
  'esp.ladder.sinama':'Sınama',
  'esp.ladder.durum':'Durum',
  'esp.ladder.basamaklar':'Basamaklar',
  'esp.ladder.projeler':'Projeler',
  'esp.ladder.kendini-sina':'Kendini sına',
  'esp.ladder.disiplin':'Disiplin',
  'esp.ladder.tespit-yapilacak-disiplin':'Tespit yapılacak disiplin',
  'esp.ladder.cevapsiz':'(cevapsız)',
  'esp.ladder.tahmini-kaydet':'Tahmini kaydet',
  'esp.ladder.sonuc':'Sonuç',
  'esp.ladder.tahmin':'tahmin: ',
  'esp.ladder.olculen':'ölçülen: ',
  'esp.ladder.kurgusal-senaryo':'Kurgusal senaryo:',
  'esp.ladder.gorev':'Görev',
  'esp.ladder.olcutler':'Ölçütler:',
  'esp.ladder.kapat':'Kapat',
  'esp.ladder.masaya-git-2':'Masaya Git (',
  'esp.ladder.tum-disiplinler-14-proje':'Tüm disiplinler (14 proje)',
  'esp.ladder.uygulama-projeleri':'Uygulama Projeleri',
  'esp.ladder.proje-disiplini':'Proje disiplini',
  'esp.ladder.7-disipline-dagitilmis-14-ge':'7 disipline dağıtılmış 14 gerçekçi senaryo ve 70 görev. Her proje, teorik bilgiyi somut bir bağlamda işletmeyi ölçer.',
  'esp.ladder.gorev-2':'görev',
  'esp.ladder.projeyi-ve-gorevleri-incele':'Projeyi ve görevleri incele',
  'esp.ladder.derinlikli-ogretim-ornekleri':'Derinlikli öğretim örnekleri',
  'esp.ladder.basit-orta-ve-ileri-kademele':'Basit, orta ve ileri kademelerde somut çözümlü örnekler, karar gerekçeleri ve yaygın hatalar.',
  'esp.ladder.i-stem':'İstem:',
  'esp.ladder.cozum':'Çözüm:',
  'esp.ladder.gerekce':'Gerekçe:',
  'esp.ladder.genel':'Genel',
  'esp.ladder.yol-2':'Yol',
  'esp.ladder.projeler-14':'Projeler (14)',
  'esp.ladder.merdiven-bolumleri':'Merdiven bölümleri',
  'esp.ladder.tahmin-kaydedildi-hicbir-kap':'Tahmin kaydedildi — hiçbir kapı açılmadı',
  'esp.ladder.genel-kademe-2':'genel kademe',
  'esp.ladder.baslamis-disiplin':'başlamış disiplin',
  'esp.ladder.olculemeyen-kapi':'ölçülemeyen kapı',
  'esp.ladder.disiplin-sec':'Disiplin seç',
});
window.LIFEOS.PARCA.sayfa({ id:'ladder', modul:'esp', cekmece:'plan', ad:'Merdiven', ikon:'chart', sira:10 });

ESP.Screens.ladder = (function(){
  const U = ESP.U, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;
  const C = () => ESP.Curriculum;

  function discOf(id){ return ESP.DISCIPLINE_BY_ID[id]; }

  function toneOfGate(g){
    return g.status === 'pass' ? 'ok' : (g.status === 'fail' ? 'warn' : 'muted');
  }

  function gateLine(g){
    return html`
      <li class="${cls('gate', 'gate--' + g.status)}">
        <span class="gate__mark" aria-hidden="true">${g.status === 'pass' ? '✓'
          : (g.status === 'fail' ? '·' : '?')}</span>
        <span class="gate__label">${g.label}</span>
        <span class="gate__why">${g.status === 'pass' ? 'geçildi' : (g.why || '')}</span>
        ${K.Badge({ label:(ESP.CERTAINTY[g.cert] || ESP.CERTAINTY.missing).label,
          tone:toneOfGate(g), icon:false })}
        ${when(g.weak && g.status === 'pass', () => K.Badge({ label:'beyan',
          tone:'warn', icon:false }))}
        ${when(g.declaredWhy && g.status === 'pass',
          () => html`<span class="gate__why tiny dim">${g.declaredWhy}</span>`)}
      </li>`;
  }

  /* ------------------------------------------------------------ genel bakış */

  function ozetRows(){
    const ov = C().overall();
    const hepsi = C().all().filter(Boolean);
    const rows = [];

    rows.push(K.Entry({
      label:yz('esp.ladder.genel-kademe'), hint:'level',
      meta:ov.cert === 'missing' ? 'veri yok' : ov.level.label,
      body:ov.cert === 'missing'
        /* Veri yoksa yedi sıfır kart değil ilk adım; alan kartları katlı (kucukVarsayilan). */
        ? html`${K.Notice({ tone:'info', body:yz('esp.ladder.hicbir-disiplinde-olculmus-u')
            + yz('esp.ladder.merdiven-ilk-olcumle-baslar') })}
            <div class="mt-10">${K.Button({ label:yz('esp.ladder.kendini-sina'), tone:'primary', act:'pick-tab', data:{ 'data-tab':'tespit' } })}</div>`
        : html`
          ${K.NextUp({ icon:'chart', label:yz('esp.ladder.olculmus-uretim'), title:ov.level.label,
            why:ov.level.note })}
          ${K.Meter({ label:yz('esp.ladder.merdivenin-tamami'), value:ov.mastery,
            text:'%' + ov.mastery,
            note:ov.measuredDisciplines + '/' + ov.disciplines
              + ' disiplinde ölçülmüş üretim var' })}
          <p class="small muted mt-8">${ESP.PEDAGOGIC.level}</p>`,
    }));

    rows.push(K.Entry({
      label:yz('esp.ladder.disiplinler'), hint:'ladder',
      meta:hepsi.length + ' merdiven',
      wide:true,
      body:html`<div class="ladders">${map(hepsi, lv => {
        const d = discOf(lv.disc);
        if(!d) return '';
        return html`
          <button class="${cls('ladcard', 'ladcard--' + lv.disc,
              S.ui.curDisc === lv.disc && 'is-active')}"
            data-act="pick-disc" data-id="${lv.disc}"
            aria-pressed="${S.ui.curDisc === lv.disc ? 'true' : 'false'}">
            <span class="ladcard__head">
              <b>${d.label}</b>
              <span class="ladcard__rank num">${lv.level.short}</span>
            </span>
            <span class="ladcard__level">${lv.level.label}</span>
            <span class="ladcard__bar" aria-hidden="true">
              <span class="ladcard__fill" style="width:${lv.mastery}%"></span>
            </span>
            <span class="ladcard__meta">%${lv.mastery} · ${
              (ESP.CERTAINTY[lv.cert] || ESP.CERTAINTY.missing).label}</span>
          </button>`;
      })}</div>`,
    }));

    /* Ölçülemeyen kapılar tek listede: bunlar "çalış" değil "ölç" işleridir. */
    const olcum = ESP.Mod.active().map(d => C().nextGate(d.id))
      .filter(g => g && g.action === 'measure');
    rows.push(K.Entry({
      label:yz('esp.ladder.olculemeyen-basamaklar'), hint:'unknown-gate',
      meta:olcum.length ? olcum.length + ' kapı' : 'yok',
      body:olcum.length
        ? K.Table({ tight:true, headers:['Disiplin', 'Kapı', ''],
            rows:olcum.map(g => [
              (discOf(g.disc) || {}).label || g.disc,
              g.gate.label,
              K.Button({ label:yz('esp.ladder.olcmeye-git'), size:'sm', act:'go',
                data:{ 'data-route':(discOf(g.disc) || {}).route || 'today' } }),
            ]) })
        : K.Empty({ text:yz('esp.ladder.bir-sonraki-kapilarin-hepsi') }),
    }));

    return rows;
  }

  /* ------------------------------------------------------- tek disiplin yolu */

  /* 093 MERDİVEN BASAMAKLARI (vitrin): basamak içerik sırasıdır, derece
     değil. Şimdiki basamağın notu geçilen kapı sayısı (kayıttan). */
  function merdivenHtml(yol){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !yol || !(yol.steps || []).length) return '';
    return V.merdiven({ basamaklar:yol.steps.map(st => {
      const g = st.gates || [], gecen = g.filter(x => x.status === 'pass').length;
      return { no:st.rank, ad:st.title, durum:st.state, not:st.title + ' · ' + g.length + ' kapının ' + gecen + '’i geçti' };
    }) });
  }

  function yolRows(discId){
    const d = discOf(discId);
    const yol = C().roadmap(discId);
    const lv = C().levelOf(discId);
    const kapi = C().nextGate(discId);
    const lad = C().ladder(discId);
    if(!d || !yol || !lad) return [K.Entry({ label:yz('esp.ladder.yol'), body:K.Empty({ text:yz('esp.ladder.merdiven-yok') }) })];

    const rows = [];

    rows.push(K.Entry({
      label:d.label.toLocaleUpperCase('tr-TR'), hint:'ladder',
      meta:lv.level.label,
      note:lad.aim,
      action:K.Button({ label:yz('esp.ladder.masaya-git'), size:'sm', act:'go',
        data:{ 'data-route':d.route } }),
      body:html`
        ${K.Meter({ label:yz('esp.ladder.merdiven'), value:lv.mastery, text:'%' + lv.mastery })}
        ${when(merdivenHtml(yol), () => html`<div class="mt-12">${raw(merdivenHtml(yol))}</div>`)}
        <p class="rulesay mt-10">${C().sentence(discId)}</p>
        ${when(lv.declared, () => K.Notice({ tone:'warn', title:yz('esp.ladder.beyana-dayali-kademe'),
          body:lv.declaredWhy }))}
        ${when(kapi, () => K.NextUp({
          icon:kapi.action === 'measure' ? 'info' : 'zap',
          label:kapi.action === 'measure' ? yz('esp.ladder.once-olc') : yz('esp.ladder.siradaki-kapi'),
          title:kapi.title, why:kapi.why }))}`,
    }));

    /* Merdivenin GÖREMEDİĞİ şeyler.

       Bu kutu kasten kapıların hemen altında durur. Bir merdiven, ölçtüğü
       şeyleri sıralar; okuyan kişi de zamanla ölçülenin önemli, ölçülmeyenin
       önemsiz olduğunu sanmaya başlar. O sanı burada kırılır: üstatlık bu
       listedeki maddelerdedir ve sistem onların hiçbirini göremez. */
    if((lad.blind || []).length){
      rows.push(K.Entry({
        label:yz('esp.ladder.bu-merdivenin-goremedigi'), hint:'blind',
        meta:lad.blind.length + ' madde',
        wide:true,
        body:html`
          <ul class="studylist">${map(lad.blind, x => html`<li>${x}</li>`)}</ul>
          ${K.Notice({ tone:'info',
            body:yz('esp.ladder.ustat-kademesi-bile-bu-madde')
               + 'yeterlilik belgesi değil, bir çalışma düzenidir.' })}`,
      }));
    }

    yol.steps.forEach(st => {
      rows.push(K.Entry({
        label:yz('esp.ladder.kademe') + (ESP.LEVEL_BY_RANK[st.rank] || {}).short,
        meta:st.state === 'done' ? 'geçildi'
          : (st.state === 'current' ? '%' + st.pct : 'ileride'),
        note:st.title,
        wide:true,
        class:'step--' + st.state,
        body:html`
          <div class="step__cols">
            <div>
              ${K.SectionTitle(yz('esp.ladder.ne-calisilir'))}
              <ul class="studylist">${map(st.study, x => html`<li>${x}</li>`)}</ul>
              <p class="small muted mt-8"><b>${yz('esp.ladder.kapanis-isi')}</b> ${st.proof}</p>
            </div>
            <div>
              ${K.SectionTitle('Kapılar')}
              <ul class="gates">${map(st.gates, gateLine)}</ul>
              ${when(st.unknown, () => K.Notice({ tone:'info',
                body:st.unknown + ' kapı ölçülemiyor: burada istenen şey '
                  + 'çalışmak değil ölçmek.' }))}
            </div>
          </div>`,
      }));
    });

    return rows;
  }

  /* ------------------------------------------------------ seviye tespit sınavı */

  function tespitRows(){
    const cevaplar = (S.prefs && S.prefs.placement) || {};
    const disc = S.ui.curDisc || 'lang';
    const mevcut = cevaplar[disc] || {};
    const tahmin = C().placement(mevcut);
    const lv = C().levelOf(disc);

    return [
      K.Entry({
        label:yz('esp.ladder.seviye-tespiti'), hint:'placement',
        meta:(discOf(disc) || {}).label || disc,
        body:html`
          ${K.Field({ label:yz('esp.ladder.disiplin'),
            input:K.Select({ id:'pl-disc', value:disc, change:'pick-disc-sel',
              aria:yz('esp.ladder.tespit-yapilacak-disiplin'),
              options:ESP.Mod.active().map(x => ({ value:x.id, label:x.label })) }) })}
          ${map(ESP.PLACEMENT.questions, q => K.Field({ label:q.label, class:'mt-10',
            input:K.Select({ id:'pl-' + q.id,
              value:mevcut[q.id] != null ? String(mevcut[q.id]) : '',
              aria:q.label,
              options:[{ value:'', label:yz('esp.ladder.cevapsiz') }]
                .concat(q.options.map(o => ({ value:String(o.value), label:o.label }))) }) }))}
          ${K.Button({ label:yz('esp.ladder.tahmini-kaydet'), tone:'primary', act:'save-placement',
            class:'mt-10', data:{ 'data-id':disc } })}`,
      }),

      K.Entry({
        label:yz('esp.ladder.sonuc'),
        meta:tahmin.answered + '/' + tahmin.total + ' cevap', hint:'placement',
        body:html`
          <div class="row wrap">
            ${K.Badge({ label:yz('esp.ladder.tahmin') + tahmin.level.label, tone:'warn' })}
            ${K.Badge({ label:yz('esp.ladder.olculen') + (lv && lv.cert !== 'missing'
              ? lv.level.label : 'veri yok'),
              tone:lv && lv.cert !== 'missing' ? 'ok' : 'muted' })}
          </div>
          <p class="small muted mt-8">${tahmin.level.note}</p>`,
      }),
    ];
  }

  /* ------------------------------------------------------------- projeler */

  function projectSheet(id){
    const p = (ESP.PROJE_BY_ID || {})[id];
    if(!p) return;
    const d = discOf(p.discipline) || { label:p.discipline };
    ESP.UI.sheet({
      title: p.title,
      subtitle: d.label + ' · ' + (p.tasks || []).length + ' uygulama görevi',
      wide: true,
      body: String(K.Stack([
        html`<div class="ogrenme mb-10">
          <div class="tiny bold text-1 mb-4">${yz('esp.ladder.kurgusal-senaryo')}</div>
          <p class="small mb-4" style="line-height:1.5">${U.esc(p.scenario.text)}</p>
          <div class="tiny dim">${U.esc(p.scenario.origin)}</div>
        </div>`,
        html`<div class="stack-sm">${map(p.tasks, (t, idx) => html`
          <div class="ogrenme">
            <div class="row between gap-6 mb-4">
              <b class="small">${yz('esp.ladder.gorev')} ${idx + 1}: ${U.esc(t.question)}</b>
            </div>
            ${when(t.criteria && t.criteria.length, () => html`
              <div class="tiny dim mb-6">
                <b>${yz('esp.ladder.olcutler')}</b>
                <ul class="pl-14 mb-0 mt-2">
                  ${map(t.criteria, c => html`<li>${U.esc(c)}</li>`)}
                </ul>
              </div>`)}
            ${when(t.sample_answer, () => html`
              <details class="tiny dim"><summary>Örnek Çözüm & Cevap</summary>
                <div class="ogrenme__kutu mt-4">${U.esc(t.sample_answer)}</div>
              </details>`)}
          </div>`)}</div>`,
      ])),
      footer: String(html`<div class="row between gap-8">
        ${K.Button({ label:yz('esp.ladder.kapat'), act:'sheet-close' })}
        ${when(d.route, () => K.Button({ label:yz('esp.ladder.masaya-git-2') + d.label + ')', tone:'primary', act:'go',
          data:{ 'data-route':d.route } }))}
      </div>`),
    });
  }

  function projelerRows(disc){
    const filter = S.ui.projDisc || 'all';
    let projs = ESP.PROJELER || [];
    if(filter !== 'all') projs = projs.filter(p => p.discipline === filter);

    let ornekler = ESP.DERINLIKLI_ORNEKLER || [];
    if(filter !== 'all') ornekler = ornekler.filter(o => o.discipline === filter);

    const filterOptions = [{ value:'all', label:yz('esp.ladder.tum-disiplinler-14-proje') }]
      .concat(ESP.Mod.active().map(d => ({ value:d.id, label:d.label })));

    return [
      K.Entry({
        label:yz('esp.ladder.uygulama-projeleri'), hint:'project',
        meta:projs.length + ' proje',
        wide:true,
        action:K.Select({ id:'proj-disc', value:filter, change:'pick-proj-disc', size:'sm',
          aria:yz('esp.ladder.proje-disiplini'), options:filterOptions }),
        body:html`
          <p class="small muted mb-10">${yz('esp.ladder.7-disipline-dagitilmis-14-ge')}</p>
          <div class="stack-sm">${map(projs, p => {
            const d = discOf(p.discipline) || { label:p.discipline };
            return html`
              <div class="ogrenme">
                <div class="row between gap-8 mb-4">
                  <b class="small">${U.esc(p.title)}</b>
                  <span class="badge badge--muted tiny">${d.label} · ${(p.tasks || []).length} ${yz('esp.ladder.gorev-2')}</span>
                </div>
                <p class="small text-2 mb-8" style="line-height:1.4">${U.esc(p.scenario.text)}</p>
                <div class="row end">
                  ${K.Button({ label:yz('esp.ladder.projeyi-ve-gorevleri-incele'), size:'sm', act:'open-project',
                    data:{ 'data-id':p.id } })}
                </div>
              </div>`;
          })}</div>`,
      }),

      K.Entry({
        label:yz('esp.ladder.derinlikli-ogretim-ornekleri'), hint:'depth',
        meta:ornekler.length + ' somut örnek',
        wide:true,
        body:html`
          <p class="small muted mb-10">${yz('esp.ladder.basit-orta-ve-ileri-kademele')}</p>
          <div class="stack-sm" style="max-height:420px;overflow-y:auto">${map(ornekler, o => {
            const d = discOf(o.discipline) || { label:o.discipline };
            const tone = o.depth === 'basit' ? 'ok' : (o.depth === 'orta' ? 'warn' : 'danger');
            return html`
              <div class="ogrenme">
                <div class="row between gap-6 mb-2">
                  <b class="small">${U.esc(o.title)}: ${U.esc(o.focus || '')}</b>
                  <span class="badge tiny badge--${tone}">${o.depth} · ${d.label}</span>
                </div>
                <div class="small mb-4"><b>${yz('esp.ladder.i-stem')}</b> ${U.esc(o.prompt)}</div>
                <div class="small text-2 mb-4"><b>${yz('esp.ladder.cozum')}</b> <i>${U.esc(o.worked_solution)}</i></div>
                <div class="tiny dim mb-2"><b>${yz('esp.ladder.gerekce')}</b> ${U.esc(o.reasoning)}</div>
                ${when(o.common_error, () => html`<div class="tiny dim"><b>Hata:</b> ${U.esc(o.common_error)}</div>`)}
              </div>`;
          })}</div>`,
      }),
    ];
  }

  /* YOL HARİTASI (kullanıcı, 2026-10-30: «istatistiklerde nöral ağ haritası;
     öğrendiğimiz konular hedefinde; yol haritası gibi»). Açık alanların
     merdiveni: basamak durumu ve yüzdesi müfredat motorundan (geçilmeyen
     kapı ilerleme sayılmaz). */
  function yolHaritasi(){
    const A = window.LIFEOS.AGHARITA;
    if(!A || !ESP.Curriculum || !ESP.Curriculum.roadmap) return '';
    const kumeler = ESP.Mod.active().map(d => {
      const y = ESP.Curriculum.roadmap(d.id);
      return { ad:d.short || d.label, dugumler:y ? y.steps.map(s => ({ ad:s.title, durum:s.state === 'done' ? 'bitti' : s.state === 'current' ? (s.pct > 0 ? 'suruyor' : 'sirada') : 'bekliyor',
        ilerleme:s.state === 'current' && s.pct > 0 ? s.pct / 100 : undefined })) : [] };
    });
    return html`<section class="kutu" aria-label="Yol haritası"><h2 class="kutu__ad">${yz('esp.core.parts.yol-haritasi')}</h2>
      <p class="tiny dim">${yz('esp.analytics.her-alanin-merdiveni-gecilen')}</p>
      ${raw(A.html({ merkez:'Gelişim', kumeler, bos:yz('esp.analytics.bir-alan-acinca-merdiveni-bu') }))}</section>`;
  }

  /* ----------------------------------------------------------------- çizim */

  const TABS = [
    { id:'ozet',     label:yz('esp.ladder.durum') },
    { id:'yol',      label:yz('esp.ladder.basamaklar') },
    { id:'projeler', label:yz('esp.ladder.projeler') },
    { id:'tespit',   label:yz('esp.ladder.sinama') },
  ];

  /* Sekme yok (EKIP-PLANI §1.2): genel, yol ve seviye tespiti alt alta;
     disiplin seçici yol ve tespit içindir, hep görünür. */
  /* Karışık alan sınaması (core/alan.js): sıradaki konu burada, sayfa değiştirmeden sınanır;
     konu başlığı disiplin seçilmeden gelir, bu yüzden karışık kanıt sayılır. */
  LIFEOS.PARCA.blok({ id:'ladder.alan-sinamasi', sayfa:'ladder', yer:'sinama', sira:5, ad:'Karışık sınama', ciz(){
    const P = (window.LIFEOS || {}).PANO, s = S.ui.alanSinav, h = ESP.Alan.harita();
    const siradaki = ESP.Alan.sira(1)[0];
    const t = ESP.Alan.konuOf(s && s.karisik ? s.id : siradaki && siradaki.id);
    if(!P || !t) return '';
    return raw(P.kart({ tur:'alan-sinama', ad:yz('esp.ladder.karisik-sinama'), simge:'kart',
      yuva:h.olculen + '/' + h.toplam + ' ' + yz('esp.ladder.konu-olculdu'),
      govde:String(html`<p class="small"><b>${(ESP.DISCIPLINE_BY_ID[t.disc] || {}).short || t.disc}</b> · ${t.title}</p>
        ${ESP.Parts.konuSinama(t, true)}`) }));
  } });
  LIFEOS.PARCA.blok({ id:'ladder.merdiven-sekmeleri', sayfa:'ladder', yer:'y1', sira:10, ad:'Merdiven sekmeleri', ciz({ disc }){
    return K.Span(12, ESP.Parts.bolumler({ act:'pick-tab', aria:yz('esp.ladder.merdiven-bolumleri'), tabs:TABS,
        govde:{ ozet:ozetRows, yol:() => yolRows(disc), projeler:() => projelerRows(disc), tespit:tespitRows },
        ust:{ tespit:() => LIFEOS.PARCA.yer('ladder', 'sinama', K, undefined, raw),
          ozet:() => C().overall().cert === 'missing' ? '' : yolHaritasi() } }));
  } });
  function render(){
    const disc = S.ui.curDisc || 'lang';
    /* disiplin seçici sayfa başındadır (actions), bölümlerin üstünde asılı durmaz */
    const parcaB = { disc };
    return K.Grid(html`
      ${LIFEOS.PARCA.yer('ladder', 'y1', K, parcaB, typeof raw === 'undefined' ? null : raw)}`);
  }

  function afterRender(){ ESP.Parts.bolumIstegi('ladderTab', TABS[0].id); }

  const handle = {
    async 'pick-tab'(el){ K.bolumeGit(el.dataset.tab); },

    async 'pick-disc'(el){
      S.ui.curDisc = el.dataset.id;
      S.ui.ladderTab = 'yol';
      ESP.App.render();
    },

    async 'open-project'(el){
      projectSheet(el.dataset.id);
    },

    async 'save-placement'(el){
      const disc = el.dataset.id;
      const cevaplar = {};
      ESP.PLACEMENT.questions.forEach(q => {
        const node = document.getElementById('pl-' + q.id);
        const v = node ? node.value : '';
        if(v !== '') cevaplar[q.id] = Number(v);
      });
      const prefs = Object.assign({}, S.prefs || {});
      prefs.placement = Object.assign({}, prefs.placement || {});
      prefs.placement[disc] = cevaplar;
      await ESP.Model.savePrefs(prefs);
      ESP.UI.toast(yz('esp.ladder.tahmin-kaydedildi-hicbir-kap'));
      ESP.App.render();
    },
  };

  const change = {
    async 'pick-disc-sel'(el){ S.ui.curDisc = el.value; ESP.App.render(); },
    async 'pick-proj-disc'(el){ S.ui.projDisc = el.value; ESP.App.render(); },
  };

  return {
    id:'ladder',
    /* iPhone (2026-10-02, IPHONE-PLANI Faz 1): açık yalnız bulunduğun yer.
       Ölçülemeyen kapılar ve kör noktalar şerit; Yol'da yalnız şimdiki
       kademe açık, geçilen ve ilerideki kademeler şerit. Açıklama
       paragrafları ⓘ'de (data/hints.js: level, ladder, unknown-gate,
       blind, placement) — ekranda ikinci kez yazılmaz. */
    get kucukVarsayilan(){
      const G = (window.LIFEOS || {}).Gizle;
      const yol = G ? C().roadmap(S.ui.curDisc || 'lang') : null;
      const kademeler = (yol ? yol.steps : []).filter(st => st.state !== 'current')
        .map(st => G.anahtar(yz('esp.ladder.kademe') + (ESP.LEVEL_BY_RANK[st.rank] || {}).short));
      /* Ölçüm yokken yedi sıfır kart açık durmaz; alan listesi katlı, adı ve sayısı görünür. */
      return ['ölçülemeyen-basamaklar', 'bu-merdivenin-göremediği'].concat(kademeler, C().overall().cert === 'missing' ? ['disiplinler'] : []);
    },
    title:yz('esp.ladder.merdiven'),
    headline(){
      const ov = C().overall();
      if(ov.cert === 'missing') return yz('esp.ladder.merdiven-henuz-baslamadi');
      const olc = ESP.Mod.active().map(d => C().nextGate(d.id))
        .filter(g => g && g.action === 'measure').length;
      if(olc) return olc + ' kapı ölçülemiyor.';
      return yz('esp.ladder.olculmus-uretim-2') + ov.level.label + '» kademesinde.';
    },
    lede(){
      return yz('esp.ladder.kademe-kisiye-degil-ureti-me')
           + 'durur; bu bir sınav sonucu değildir.';
    },
    stats(){
      const ov = C().overall();
      const hepsi = C().all().filter(Boolean);
      return [
        { value:ov.cert === 'missing' ? '—' : ov.level.short, label:yz('esp.ladder.genel-kademe-2') },
        { value:ov.cert === 'missing' ? '—' : String(ov.mastery), unit:'%', label:'merdiven' },
        { value:String(hepsi.filter(x => x.rank > 0).length), label:yz('esp.ladder.baslamis-disiplin') },
        { value:String(ESP.Mod.active().map(d => C().nextGate(d.id))
          .filter(g => g && g.action === 'measure').length), label:yz('esp.ladder.olculemeyen-kapi') },
      ];
    },
    subtitle(){
      const ov = C().overall();
      return ov.cert === 'missing' ? 'ölçüm yok' : ov.level.label;
    },
    actions(){
      return String(K.Select({ id:'lad-disc', value:S.ui.curDisc || 'lang', change:'pick-disc-sel',
        aria:yz('esp.ladder.disiplin-sec'), size:'sm',
        options:ESP.Mod.active().map(x => ({ value:x.id, label:x.label })) }));
    },
    render, afterRender, handle, change,
  };
})();
