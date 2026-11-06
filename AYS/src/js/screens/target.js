/* Hedef — siralar, net matrisi, OBP ve 24 tercih mimarisi.

   LEGO ORNEGI (brand/ortak/parca.js): sayfa, her bolumu bir blok, her cumle bir
   yazi, her hesap bir bilgidir. Yeni bolum icin yeni bir P.blok yeter; baska
   dosyadan da takilir, bu dosyaya dokunmak gerekmez. Silmek: o bloğu sil.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */
window.LIFEOS.PARCA.yazilar({
  'ays.target.tahmini-siralama':'Tahmini sıralama',
  'ays.target.hedefe-kalan-net':'Hedefe kalan net',
  'ays.target.obp-katkisi':'OBP katkısı',
  'ays.target.hedef-ozeti':'Hedef özeti',
});


window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:140, group:'Git', label:'Hedef, net matrisi, tercih', icon:'target', route:'target', run(){ R.App.go('target'); } });

R.Screens.target = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C, P = window.LIFEOS.PARCA, y = P.yazi;

  /* ---------- sayfa ---------- */

  P.sayfa({
    id:'target', modul:'ays', king:{ sira:100, ad:'Hedefler', es:['hedefler', 'hedeflerim'] }, cekmece:'plan', ad:'Hedefler', ikon:'target', sira:30, baslik:'Hedef',
    izgara:[{ alan:12, yer:'ust', tek:true }, { alan:6, yer:'sol' }, { alan:4, yer:'sag' }, { alan:12, yer:'alt', tek:true }],
  });

  /* ---------- yazilar ---------- */

  P.yazilar({
    'hedef.durum.veriyok':'veri yok', 'hedef.durum.bantta':'bantta', 'hedef.durum.kismen':'kısmen',
    'hedef.durum.altinda':'altında', 'hedef.durum.ustbant':'üst bant', 'hedef.durum.yaklasiyor':'yaklaşıyor',
    'hedef.katman.baslik':'Hedef katmanları', 'hedef.katman.alt':'2026 taban sırası {sira}',
    'hedef.katman.s.katman':'Katman', 'hedef.katman.s.sira':'Sıra hedefi', 'hedef.katman.s.tyt':'TYT net',
    'hedef.katman.s.ayt':'AYT net', 'hedef.s.durum':'Durum',
    'hedef.net.baslik':'Net matrisi', 'hedef.net.alt':'Hedef bant ile son 4 tam denemenin test bazlı medyanı',
    'hedef.net.s.test':'Test', 'hedef.net.s.bant':'Hedef bant', 'hedef.net.s.medyan':'Son 4 medyan',
    'hedef.hiz.ozet':'Hedefe kalan: {net} net · hız tahmini', 'hedef.hiz.etiket':'TYT neti',
    'hedef.sira.baslik':'Tahmini sıra', 'hedef.sira.alt':'Kural motorunun ürettiği bant',
    'hedef.sira.ozet':'{n} tam denemenin medyanından · {tur}', 'hedef.sira.say':'SAY', 'hedef.sira.tyt':'yalnız TYT',
    'hedef.sira.deneme':'Deneme ekle', 'hedef.sira.puan':'{alt} – {ust} puan', 'hedef.sira.grafik':'Tahmini sıra (tahmin)',
    'hedef.sira.dayanak':'tam deneme', 'hedef.sira.genis':'geniş sıra', 'hedef.sira.hedef':'hedef {sira}',
    'hedef.sira.tytm':'TYT medyan', 'hedef.sira.aytm':'AYT medyan', 'hedef.sira.obp':'OBP katkısı',
    'hedef.sira.mesafe':'Hedef bandı tutmak için tahmini <b>{net} net</b> daha gerekiyor ({puan} puan). Bu sayı bir hedef değil, mesafe göstergesidir.',
    'hedef.sira.ustunde':'Tahmini puanın hedef sıranın gerektirdiği bandın üstünde. Şimdi yapılacak iş net artırmak değil, bandı düşürmemek.',
    'hedef.sira.sinir':'Bu bir ÖSYM hesabı değildir. Puan standart sapmaya göre normalize edilir ve aday dağılımı her yıl değişir; buradaki aralık son yılların sonuçlarından çıkarılmış koçluk bandıdır.',
    'hedef.obp.baslik':'OBP katkısı', 'hedef.obp.alt':'Diploma notu × 5, ardından × katsayı', 'hedef.obp.not':'Diploma notu',
    'hedef.obp.yerlesti':'Daha önce merkezî yerleştirmeyle yerleştim', 'hedef.obp.obp':'OBP', 'hedef.obp.aralik':'250–500 aralığı',
    'hedef.obp.katsayi':'Katsayı', 'hedef.obp.tekrar':'tekrar yerleşme', 'hedef.obp.ilk':'ilk yerleştirme', 'hedef.obp.katki':'Puana katkı',
    'hedef.obp.sinir':'Bu katkı net hedefini mekanik olarak azaltmaz; standartlaştırma ve aday dağılımı nedeniyle sonuç yıldan yıla değişir. 2027 kılavuzu yayımlandığında katsayı yeniden doğrulanmalıdır.',
    'hedef.tercih.baslik':'24 tercih mimarisi', 'hedef.tercih.alt':'Tercihler puana değil başarı sırasına göre yapılır; liste gerçekten istenen program sırasıdır',
    'hedef.tercih.dolu':'{n} / 24 dolu', 'hedef.tercih.agresif':'agresif', 'hedef.tercih.gercekci':'gerçekçi', 'hedef.tercih.guvenli':'güvenli',
    'hedef.tercih.program':'{no}. tercih programı', 'hedef.tercih.program.yer':'{tur} — üniversite / program',
    'hedef.tercih.sira':'{no}. tercih sırası', 'hedef.tercih.sira.yer':'sıra',
    'hedef.tercih.kontrol':'Her satırda kontrol edilir: {liste}.',
    'hedef.tercih.anlam':'“Güvenli” program, adayın gitmeyeceği bölüm değildir; yerleşince kayıt yaptırmaya razı olunan programdır.',
    'hedef.ref.baslik':'2026 sıra referansları', 'hedef.ref.program':'Program', 'hedef.ref.sira':'Taban sıra',
    'hedef.ref.not':'2027 tercih döneminde YÖK Atlas ve kılavuzdan güncellenmelidir.',
    'hedef.yerlesen.baslik':'2024 yerleşen profilleri', 'hedef.yerlesen.alt':'Gerçek yerleşme verisi',
    'hedef.alt':'{program} · 2026 sırası {sira}',
    'hedef.donen.ad':'Hedef', 'hedef.donen.ana':'Ana hedef', 'hedef.donen.net':'TYT {tyt} · AYT {ayt} net · koçluk hedefi.',
    'hedef.donen.olasi':'en olası.', 'hedef.donen.aralik':'{alt}–{ust} · {n} tam deneme.', 'hedef.donen.gerek':'Tahmin için 3 tam deneme gerekir.',
    'hedef.donen.var':'{n} tam deneme var.', 'hedef.donen.denemeler':'Denemeler', 'hedef.donen.kalan':'Hedefe kalan', 'hedef.donen.kaldi':'kaldı.',
    'hedef.donen.usttesin':'Hedef bandın üstündesin.', 'hedef.donen.mesafe':'Mesafe göstergesi; hedef değil.',
    'hedef.donen.formul':'son tam denemelerin medyanı → sıra modeli',
  });

  /* ---------- bilgiler: King ve Gun buradan okuyabilir ---------- */

  P.bilgi({ id:'ays.tahmini-sira', ad:yz('ays.target.tahmini-siralama'), etiket:'tahmin', oku(){ const e = C.estimateScore(); return e.ok ? e.rank : null; } });
  P.bilgi({ id:'ays.hedefe-kalan-net', ad:yz('ays.target.hedefe-kalan-net'), etiket:'tahmin', oku(){ const g = C.netGapToTarget(); return g ? Math.max(0, g.netDiff) : null; } });
  P.bilgi({ id:'ays.obp-katkisi', ad:yz('ays.target.obp-katkisi'), etiket:'hesaplandı', oku(){ return C.obp().contribution; } });

  /* ---------- donen ust kart ---------- */

  /* iPhone (2026-10-02): hedef ekranının işi hedef katmanı; tahmini sıra ve
     hedefe kalan küçük dönen kartta. Kesinlik açıklama satırı (ⓘ'de) ve
     medyan tekrarı (tahmini sıra kartında yazıyor) kalktı; ara sıra
     açılanlar şerit, başvuru tabloları gizli (app.js SADE_GIZLI). */
  P.blok({ id:'hedef.donen', sayfa:'target', yer:'ust', ad:yz('ays.target.hedef-ozeti'), ciz(){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    const m = [];
    const ana = (R.TARGET_TIERS || [])[0];
    if(ana) m.push({ ust:y('hedef.donen.ana'), cumle:ana.rank + '.', vurgu:y('hedef.donen.net', { tyt:ana.tyt, ayt:ana.ayt }), sistem:'ays' });
    const est = C.estimateScore();
    m.push(est.ok
      ? { ust:y('hedef.sira.baslik'), sayi:sayi({ deger:est.rank, kesinlik:'estimated', formul:y('hedef.donen.formul') }),
          cumle:y('hedef.donen.olasi'), vurgu:y('hedef.donen.aralik', { alt:U.fmtNum(est.rankBest), ust:U.fmtNum(est.rankWorst), n:est.samples }), sistem:'ays' }
      : { ust:y('hedef.sira.baslik'), cumle:y('hedef.donen.gerek'), vurgu:y('hedef.donen.var', { n:C.fullExams('TYT').length }),
          sistem:'ays', dugme:{ label:y('hedef.donen.denemeler'), act:'go', data:{ 'data-route':'exams' } } });
    const gap = C.netGapToTarget();
    if(gap) m.push({ ust:y('hedef.donen.kalan'), sayi:sayi({ deger:Math.max(0, Math.round(gap.netDiff * 100) / 100), birim:'net', ondalik:2, kesinlik:'estimated' }),
      cumle:y('hedef.donen.kaldi'), vurgu:gap.reached ? y('hedef.donen.usttesin') : y('hedef.donen.mesafe'), sistem:'ays' });
    return raw(V.donen({ id:'ays-hedef', ad:y('hedef.donen.ad'), maddeler:m }));
  } });

  /* ---------- hedef katmanlari ---------- */

  function tierTable(){
    const tyt = C.medianTrend('TYT').last3;
    const ayt = C.medianTrend('AYT').last3;
    const rows = R.TARGET_TIERS.map(t => {
      const tytOk = tyt != null && tyt >= t.tytNum;
      const aytOk = ayt != null && ayt >= t.aytNum;
      const status = (tyt == null && ayt == null) ? K.Badge({ label:y('hedef.durum.veriyok'), tone:'muted' })
        : (tytOk && aytOk) ? K.Badge({ label:y('hedef.durum.bantta'), tone:'ok' })
        : (tytOk || aytOk) ? K.Badge({ label:y('hedef.durum.kismen'), tone:'warn' })
        : K.Badge({ label:y('hedef.durum.altinda'), tone:'muted' });
      return [
        html`<b>${t.name}</b><div class="tiny dim">${t.note}</div>`,
        html`<span class="num">${t.rank}</span>`,
        html`<span class="num">${t.tyt}</span>`,
        html`<span class="num">${t.ayt}</span>`,
        status,
      ];
    });
    return K.Table({ rows, headers:[y('hedef.katman.s.katman'), { label:y('hedef.katman.s.sira'), num:true },
      { label:y('hedef.katman.s.tyt'), num:true }, { label:y('hedef.katman.s.ayt'), num:true }, y('hedef.s.durum')] });
  }

  P.blok({ id:'hedef.katman', sayfa:'target', yer:'sol', sira:10, ad:y('hedef.katman.baslik'), ciz(){
    const p = S.profile;
    return K.Card({
      class:'hedef-katman', title:y('hedef.katman.baslik'), hint:'tiers',
      sub:(p.program ? p.program + ' · ' : '') + y('hedef.katman.alt', { sira:U.fmtNum(R.PROGRAM.refRank) }),
      badge:raw(UI.provenance('ref2026')),
      body:html`${tierTable()}`,
    });
  } });

  /* ---------- net matrisi ---------- */

  function netMatrix(){
    const rows = R.TEST_BANDS.map(b => {
      const med = C.testMedian(b.testKey, b.exam);
      const status = med == null ? K.Badge({ label:y('hedef.durum.veriyok'), tone:'muted' })
        : med >= b.high ? K.Badge({ label:y('hedef.durum.ustbant'), tone:'ok' })
        : med >= b.low ? K.Badge({ label:y('hedef.durum.bantta'), tone:'ok' })
        : med >= b.low*0.7 ? K.Badge({ label:y('hedef.durum.yaklasiyor'), tone:'warn' })
        : K.Badge({ label:y('hedef.durum.altinda'), tone:'danger' });
      return [
        b.test,
        html`<span class="num">${b.low}–${b.high}</span>`,
        html`<span class="num strong">${med == null ? '—' : U.fmtNet(med)}</span>`,
        html`<div class="mw-70">${K.Bar({ value:med == null ? 0 : U.clamp(100*med/b.high, 0, 100),
          tone:med != null && med < b.low ? 'warn' : '' })}</div>`,
        status,
      ];
    });
    return K.Table({ rows, headers:[y('hedef.net.s.test'), { label:y('hedef.net.s.bant'), num:true },
      { label:y('hedef.net.s.medyan'), num:true }, '', y('hedef.s.durum')] });
  }

  P.blok({ id:'hedef.net', sayfa:'target', yer:'sol', sira:20, ad:y('hedef.net.baslik'), kucuk:'net-matrisi', ciz(){
    return K.Card({
      title:y('hedef.net.baslik'), hint:'net-matrix',
      sub:y('hedef.net.alt'),
      badge:raw(UI.provenance('coaching')),
      body:netMatrix(),
    });
  } });

  /* ---------- 24 tercih ---------- */

  P.blok({ id:'hedef.tercih', sayfa:'target', yer:'sol', sira:30, ad:y('hedef.tercih.baslik'), kucuk:'tercih-mimarisi',
    ciz(){
      const prefs = S.prefs;
      const tierOf = no => R.PREFERENCE_TIERS.find(t => no >= t.range[0] && no <= t.range[1]);
      const filled = prefs.rows.filter(r => r.program).length;

      return K.Card({
        title:y('hedef.tercih.baslik'), hint:'preferences',
        sub:y('hedef.tercih.alt'),
        actions:html`<span class="small dim">${y('hedef.tercih.dolu', { n:filled })}</span>`,
        body:html`
          <div class="stack-xs">${map(R.PREFERENCE_TIERS, t => html`
            <div class="row-top gap-8">
              <span class="badge badge--muted mw-74">${t.name} ${t.range[0]}–${t.range[1]}</span>
              <span class="small muted">${t.detail}</span></div>`)}</div>

          <div class="stack-xs mt-12">${map(prefs.rows, r => {
            const t = tierOf(r.no);
            const ph = r.no <= 8 ? y('hedef.tercih.agresif') : r.no <= 16 ? y('hedef.tercih.gercekci') : y('hedef.tercih.guvenli');
            return html`<div class="pref pref--${t.key}">
              <span class="pref__no">${r.no}</span>
              ${K.Input({ size:'sm', value:r.program, aria:y('hedef.tercih.program', { no:r.no }),
                placeholder:y('hedef.tercih.program.yer', { tur:ph }), change:'pref-program', data:{ 'data-i':r.no-1 } })}
              ${K.Input({ size:'sm', numeric:true, class:'input--rank', value:r.rank, aria:y('hedef.tercih.sira', { no:r.no }),
                placeholder:y('hedef.tercih.sira.yer'), change:'pref-rank', data:{ 'data-i':r.no-1 } })}
            </div>`;
          })}</div>`,
        foot:html`<p class="tiny dim">${y('hedef.tercih.kontrol', { liste:R.PREFERENCE_CHECKS.join(' · ') })}</p>
          <p class="tiny dim">${y('hedef.tercih.anlam')}</p>`,
      });
    },
    change:{
      async 'pref-program'(el){
        S.prefs.rows[Number(el.dataset.i)].program = el.value;
        S.prefs.updatedAt = new Date().toISOString();
        await M.savePrefs();
      },
      async 'pref-rank'(el){ S.prefs.rows[Number(el.dataset.i)].rank = el.value; await M.savePrefs(); },
    },
  });

  /* ---------- tahmini puan ve sıra ---------- */

  /* 039 HIZ TAHMİNİ (vitrin, «Hedefe kalan» satırından açılır — D katmanı):
     TYT netlerinin seyri ve hedef net; koni yavaş/hızlı eğimdir, tahmindir. */
  function hizKonisi(gap){
    const G = (window.LIFEOS || {}).GRAFIK;
    if(!G || !gap || gap.reached) return '';
    const tyt = C.fullExams('TYT');
    if(!tyt.length) return '';
    const netler = tyt.map(e => ({ tarih:e.date, deger:M.examNet(e) }));
    const son = netler[netler.length - 1].deger;
    const hedef = Math.round((son + gap.netDiff) * 10) / 10;
    return html`<details class="hiz-ac mt-10"><summary>${y('hedef.hiz.ozet', { net:U.fmtNet(gap.netDiff) })}</summary>
      ${raw(G.hizKoniSvg(netler, hedef, { birim:'net', etiket:y('hedef.hiz.etiket') }))}</details>`;
  }

  P.blok({ id:'hedef.sira', sayfa:'target', yer:'sag', sira:10, ad:y('hedef.sira.baslik'), ciz(){
    const est = C.estimateScore();

    if(!est.ok){
      return K.Card({
        title:y('hedef.sira.baslik'), hint:'rank', sub:y('hedef.sira.alt'),
        badge:raw(UI.provenance('estimate')),
        body:K.Empty({ icon:'target', text:est.why,
          action:K.Button({ label:y('hedef.sira.deneme'), size:'sm', tone:'primary',
            act:'go', data:{ 'data-route':'exams' } }) }),
      });
    }

    const gap = C.netGapToTarget();
    const tone = est.meta.tone;
    const scaleMax = Math.max(est.rankWorst, est.targetRank) * 1.15;
    const pos = v => U.clamp(100 * (1 - Math.log(Math.max(1, v)) / Math.log(Math.max(2, scaleMax))), 0, 100);

    return K.Card({
      title:y('hedef.sira.baslik'), hint:'rank',
      sub:y('hedef.sira.ozet', { n:est.samples, tur:est.kind === 'SAY' ? y('hedef.sira.say') : y('hedef.sira.tyt') }),
      badge:raw(UI.provenance('estimate')),
      body:html`
        <div class="estimate">
          <div class="estimate__rank">${U.fmtNum(est.rankBest)} – ${U.fmtNum(est.rankWorst)}</div>
          <div class="estimate__band">${y('hedef.sira.puan', { alt:U.fmtNet(est.scoreLow), ust:U.fmtNet(est.scoreHigh) })}
            (±${est.halfWidth})</div>
          ${K.Badge({ label:est.meta.label, tone })}
        </div>

        ${(window.LIFEOS || {}).GRAFIK ? raw(window.LIFEOS.GRAFIK.aralikHtml({ etiket:y('hedef.sira.grafik'),
            alt:est.rankBest, ust:est.rankWorst, olasi:est.rank, min:1, max:Math.round(scaleMax), ters:true,
            dayanak:est.samples, dayanakBirim:y('hedef.sira.dayanak') })) : html`<div class="estimate__scale">
          ${K.Bar({ value:pos(est.rank), tone:tone === 'ok' ? '' : 'warn' })}</div>`}
        <div class="row between mt-4">
          <span class="tiny dim">${y('hedef.sira.genis')}</span>
          <span class="tiny dim num">${y('hedef.sira.hedef', { sira:U.fmtNum(est.targetRank) })}</span>
        </div>

        <div class="mt-12">${K.Notice({ tone:tone === 'ok' ? 'ok' : 'info', body:est.meta.note })}</div>
        ${when(est.assumption, () => html`<div class="mt-8">${K.Notice({
          tone:'warn', body:est.assumption })}</div>`)}

        ${K.Cols(3, [
          K.Stat({ label:y('hedef.sira.tytm'), value:U.fmtNet(est.tytMedian) }),
          K.Stat({ label:y('hedef.sira.aytm'), value:est.aytMedian == null ? '—' : U.fmtNet(est.aytMedian) }),
          K.Stat({ label:y('hedef.sira.obp'), value:'+'+U.fmtNet(est.obp), tone:'ok' }),
        ])}

        ${hizKonisi(gap)}
        ${when(gap && !gap.reached, () => html`<p class="small muted mt-10">
          ${raw(y('hedef.sira.mesafe', { net:U.fmtNet(gap.netDiff), puan:U.fmtNet(gap.scoreDiff) }))}</p>`)}
        ${when(gap && gap.reached, () => html`<p class="small muted mt-10">
          ${y('hedef.sira.ustunde')}</p>`)}

        <p class="tiny dim mt-10">${y('hedef.sira.sinir')}</p>`,
    });
  } });

  /* ---------- OBP ---------- */

  P.blok({ id:'hedef.obp', sayfa:'target', yer:'sag', sira:20, ad:y('hedef.obp.baslik'), kucuk:'obp-katkısı',
    ciz(){
      const o = C.obp();
      const p = S.profile;
      return K.Card({
        title:y('hedef.obp.baslik'), hint:'obp', sub:y('hedef.obp.alt'),
        badge:raw(UI.provenance('estimate')),
        body:html`
          ${K.Cols(2, [
            K.Field({ label:y('hedef.obp.not'),
              input:K.Input({ id:'tg-diploma', type:'number', numeric:true, min:0, max:100,
                value:p.diplomaGrade, change:'diploma' }) }),
            html`<label class="check check--bottom">
              <input type="checkbox" ${p.previouslyPlaced ? raw('checked') : ''} data-act="toggle-placed"/>
              <span class="small">${y('hedef.obp.yerlesti')}</span></label>`,
          ])}
          ${K.Cols(3, [
            K.Stat({ label:y('hedef.obp.obp'), value:U.fmtNum(o.value), note:y('hedef.obp.aralik') }),
            K.Stat({ label:y('hedef.obp.katsayi'), value:o.coef, note:p.previouslyPlaced ? y('hedef.obp.tekrar') : y('hedef.obp.ilk') }),
            K.Stat({ label:y('hedef.obp.katki'), value:'+'+U.fmtNet(o.contribution), tone:'ok' }),
          ])}
          <p class="tiny dim mt-10">${y('hedef.obp.sinir')}</p>`,
      });
    },
    handle:{
      async 'toggle-placed'(el){
        S.profile.previouslyPlaced = el.checked;
        await M.saveProfile();
        R.App.render();
      },
    },
    change:{
      async 'diploma'(el){
        S.profile.diplomaGrade = U.clamp(Number(el.value) || 0, 0, 100);
        await M.saveProfile();
        R.App.render();
      },
    },
  });

  /* ---------- basvuru ---------- */

  P.blok({ id:'hedef.ref', sayfa:'target', yer:'sag', sira:30, ad:y('hedef.ref.baslik'), ciz(){
    return K.Card({
      title:y('hedef.ref.baslik'), badge:raw(UI.provenance('ref2026')),
      body:html`
        ${K.Table({ tight:true, headers:[y('hedef.ref.program'), { label:y('hedef.ref.sira'), num:true }],
          rows:R.RANK_REFS.map(r => [r.uni,
            html`<span class="num">${typeof r.rank === 'number' ? U.fmtNum(r.rank) : r.rank}</span>`]) })}
        <p class="tiny dim mt-8">${y('hedef.ref.not')}</p>`,
    });
  } });

  P.blok({ id:'hedef.yerlesen', sayfa:'target', yer:'sag', sira:40, ad:y('hedef.yerlesen.baslik'), ciz(){
    return K.Card({
      title:y('hedef.yerlesen.baslik'), sub:y('hedef.yerlesen.alt'),
      body:map(R.PLACEMENT_PROFILES, pr => html`
        <div class="stack-xs mb-12">
          <span class="mono-label">${pr.uni}</span>
          ${map(pr.rows, row => html`<div class="row between small">
            <span class="muted">${row[0]}</span><b class="num">${row[1]}</b></div>`)}
          ${when(pr.note, () => html`<p class="tiny dim">${pr.note}</p>`)}
        </div>`),
    });
  } });

  /* Aciklama paneli her zaman EN SONDA durur: tam genislik oldugu
     icin araya girerse kendinden sonraki kolonlari alt satira iter. */
  P.blok({ id:'hedef.aciklama', sayfa:'target', yer:'alt', ad:'Açıklamalar', ciz(){
    return raw(UI.rail(['rank', 'tiers', 'net-matrix', 'obp', 'preferences', 'certainty']));
  } });

  /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri bastan
     kucuk gelir (bloktaki `kucuk`); baslik gorunur, ustune gelince onizlenir,
     «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
  return P.ekran('target', K, {
    subtitle(){ return y('hedef.alt', { program:R.PROGRAM.program, sira:U.fmtNum(R.PROGRAM.refRank) }); },
  });
})();
