/* Hedef — siralar, net matrisi, OBP ve 24 tercih mimarisi.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.target = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  /* ---------- hedef katmanlari ---------- */

  function tierTable(){
    const tyt = C.medianTrend('TYT').last3;
    const ayt = C.medianTrend('AYT').last3;
    const rows = R.TARGET_TIERS.map(t => {
      const tytOk = tyt != null && tyt >= t.tytNum;
      const aytOk = ayt != null && ayt >= t.aytNum;
      const status = (tyt == null && ayt == null) ? K.Badge({ label:'veri yok', tone:'muted' })
        : (tytOk && aytOk) ? K.Badge({ label:'bantta', tone:'ok' })
        : (tytOk || aytOk) ? K.Badge({ label:'kısmen', tone:'warn' })
        : K.Badge({ label:'altında', tone:'muted' });
      return [
        html`<b>${t.name}</b><div class="tiny dim">${t.note}</div>`,
        html`<span class="num">${t.rank}</span>`,
        html`<span class="num">${t.tyt}</span>`,
        html`<span class="num">${t.ayt}</span>`,
        status,
      ];
    });
    return K.Table({ rows, headers:['Katman', { label:'Sıra hedefi', num:true },
      { label:'TYT net', num:true }, { label:'AYT net', num:true }, 'Durum'] });
  }

  /* ---------- net matrisi ---------- */

  function netMatrix(){
    const rows = R.TEST_BANDS.map(b => {
      const med = C.testMedian(b.testKey, b.exam);
      const status = med == null ? K.Badge({ label:'veri yok', tone:'muted' })
        : med >= b.high ? K.Badge({ label:'üst bant', tone:'ok' })
        : med >= b.low ? K.Badge({ label:'bantta', tone:'ok' })
        : med >= b.low*0.7 ? K.Badge({ label:'yaklaşıyor', tone:'warn' })
        : K.Badge({ label:'altında', tone:'danger' });
      return [
        b.test,
        html`<span class="num">${b.low}–${b.high}</span>`,
        html`<span class="num strong">${med == null ? '—' : U.fmtNet(med)}</span>`,
        html`<div class="mw-70">${K.Bar({ value:med == null ? 0 : U.clamp(100*med/b.high, 0, 100),
          tone:med != null && med < b.low ? 'warn' : '' })}</div>`,
        status,
      ];
    });
    return K.Table({ rows, headers:['Test', { label:'Hedef bant', num:true },
      { label:'Son 4 medyan', num:true }, '', 'Durum'] });
  }

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
    return html`<details class="hiz-ac mt-10"><summary>Hedefe kalan: ${U.fmtNet(gap.netDiff)} net · hız tahmini</summary>
      ${raw(G.hizKoniSvg(netler, hedef, { birim:'net', etiket:'TYT neti' }))}</details>`;
  }

  /* ---------- tahmini puan ve sıra ---------- */

  function estimateCard(){
    const est = C.estimateScore();

    if(!est.ok){
      return K.Card({
        title:'Tahmini sıra', hint:'rank', sub:'Kural motorunun ürettiği bant',
        badge:raw(UI.provenance('estimate')),
        body:K.Empty({ icon:'target', text:est.why,
          action:K.Button({ label:'Deneme ekle', size:'sm', tone:'primary',
            act:'go', data:{ 'data-route':'exams' } }) }),
      });
    }

    const gap = C.netGapToTarget();
    const tone = est.meta.tone;
    const scaleMax = Math.max(est.rankWorst, est.targetRank) * 1.15;
    const pos = v => U.clamp(100 * (1 - Math.log(Math.max(1, v)) / Math.log(Math.max(2, scaleMax))), 0, 100);

    return K.Card({
      title:'Tahmini sıra', hint:'rank',
      sub:est.samples+' tam denemenin medyanından · '+(est.kind === 'SAY' ? 'SAY' : 'yalnız TYT'),
      badge:raw(UI.provenance('estimate')),
      body:html`
        <div class="estimate">
          <div class="estimate__rank">${U.fmtNum(est.rankBest)} – ${U.fmtNum(est.rankWorst)}</div>
          <div class="estimate__band">${U.fmtNet(est.scoreLow)} – ${U.fmtNet(est.scoreHigh)} puan
            (±${est.halfWidth})</div>
          ${K.Badge({ label:est.meta.label, tone })}
        </div>

        ${(window.LIFEOS || {}).GRAFIK ? raw(window.LIFEOS.GRAFIK.aralikHtml({ etiket:'Tahmini sıra (tahmin)',
            alt:est.rankBest, ust:est.rankWorst, olasi:est.rank, min:1, max:Math.round(scaleMax), ters:true,
            dayanak:est.samples, dayanakBirim:'tam deneme' })) : html`<div class="estimate__scale">
          ${K.Bar({ value:pos(est.rank), tone:tone === 'ok' ? '' : 'warn' })}</div>`}
        <div class="row between mt-4">
          <span class="tiny dim">geniş sıra</span>
          <span class="tiny dim num">hedef ${U.fmtNum(est.targetRank)}</span>
        </div>

        <div class="mt-12">${K.Notice({ tone:tone === 'ok' ? 'ok' : 'info', body:est.meta.note })}</div>
        ${when(est.assumption, () => html`<div class="mt-8">${K.Notice({
          tone:'warn', body:est.assumption })}</div>`)}

        ${K.Cols(3, [
          K.Stat({ label:'TYT medyan', value:U.fmtNet(est.tytMedian) }),
          K.Stat({ label:'AYT medyan', value:est.aytMedian == null ? '—' : U.fmtNet(est.aytMedian) }),
          K.Stat({ label:'OBP katkısı', value:'+'+U.fmtNet(est.obp), tone:'ok' }),
        ])}

        ${hizKonisi(gap)}
        ${when(gap && !gap.reached, () => html`<p class="small muted mt-10">
          Hedef bandı tutmak için tahmini <b>${U.fmtNet(gap.netDiff)} net</b> daha gerekiyor
          (${U.fmtNet(gap.scoreDiff)} puan). Bu sayı bir hedef değil, mesafe göstergesidir.</p>`)}
        ${when(gap && gap.reached, () => html`<p class="small muted mt-10">
          Tahmini puanın hedef sıranın gerektirdiği bandın üstünde. Şimdi yapılacak iş
          net artırmak değil, bandı düşürmemek.</p>`)}

        <p class="tiny dim mt-10">Bu bir ÖSYM hesabı değildir. Puan standart sapmaya göre
          normalize edilir ve aday dağılımı her yıl değişir; buradaki aralık son yılların
          sonuçlarından çıkarılmış koçluk bandıdır.</p>`,
    });
  }

  /* ---------- OBP ---------- */

  function obpCard(){
    const o = C.obp();
    const p = S.profile;
    return K.Card({
      title:'OBP katkısı', hint:'obp', sub:'Diploma notu × 5, ardından × katsayı',
      badge:raw(UI.provenance('estimate')),
      body:html`
        ${K.Cols(2, [
          K.Field({ label:'Diploma notu',
            input:K.Input({ id:'tg-diploma', type:'number', numeric:true, min:0, max:100,
              value:p.diplomaGrade, change:'diploma' }) }),
          html`<label class="check check--bottom">
            <input type="checkbox" ${p.previouslyPlaced ? raw('checked') : ''} data-act="toggle-placed"/>
            <span class="small">Daha önce merkezî yerleştirmeyle yerleştim</span></label>`,
        ])}
        ${K.Cols(3, [
          K.Stat({ label:'OBP', value:U.fmtNum(o.value), note:'250–500 aralığı' }),
          K.Stat({ label:'Katsayı', value:o.coef, note:p.previouslyPlaced ? 'tekrar yerleşme' : 'ilk yerleştirme' }),
          K.Stat({ label:'Puana katkı', value:'+'+U.fmtNet(o.contribution), tone:'ok' }),
        ])}
        <p class="tiny dim mt-10">Bu katkı net hedefini mekanik olarak azaltmaz; standartlaştırma ve aday dağılımı
          nedeniyle sonuç yıldan yıla değişir. 2027 kılavuzu yayımlandığında katsayı yeniden doğrulanmalıdır.</p>`,
    });
  }

  /* ---------- 24 tercih ---------- */

  function prefsCard(){
    const prefs = S.prefs;
    const tierOf = no => R.PREFERENCE_TIERS.find(t => no >= t.range[0] && no <= t.range[1]);
    const filled = prefs.rows.filter(r => r.program).length;

    return K.Card({
      title:'24 tercih mimarisi', hint:'preferences',
      sub:'Tercihler puana değil başarı sırasına göre yapılır; liste gerçekten istenen program sırasıdır',
      actions:html`<span class="small dim">${filled} / 24 dolu</span>`,
      body:html`
        <div class="stack-xs">${map(R.PREFERENCE_TIERS, t => html`
          <div class="row-top gap-8">
            <span class="badge badge--muted mw-74">${t.name} ${t.range[0]}–${t.range[1]}</span>
            <span class="small muted">${t.detail}</span></div>`)}</div>

        <div class="stack-xs mt-12">${map(prefs.rows, r => {
          const t = tierOf(r.no);
          const ph = r.no <= 8 ? 'agresif' : r.no <= 16 ? 'gerçekçi' : 'güvenli';
          return html`<div class="pref pref--${t.key}">
            <span class="pref__no">${r.no}</span>
            ${K.Input({ size:'sm', value:r.program, aria:r.no+'. tercih programı',
              placeholder:ph+' — üniversite / program', change:'pref-program', data:{ 'data-i':r.no-1 } })}
            ${K.Input({ size:'sm', numeric:true, class:'input--rank', value:r.rank, aria:r.no+'. tercih sırası',
              placeholder:'sıra', change:'pref-rank', data:{ 'data-i':r.no-1 } })}
          </div>`;
        })}</div>`,
      foot:html`<p class="tiny dim">Her satırda kontrol edilir: ${R.PREFERENCE_CHECKS.join(' · ')}.</p>
        <p class="tiny dim">“Güvenli” program, adayın gitmeyeceği bölüm değildir; yerleşince kayıt
          yaptırmaya razı olunan programdır.</p>`,
    });
  }

  /* ---------- ekran ---------- */

  /* iPhone (2026-10-02): hedef ekranının işi hedef katmanı; tahmini sıra ve
     hedefe kalan küçük dönen kartta. Kesinlik açıklama satırı (ⓘ'de) ve
     medyan tekrarı (tahmini sıra kartında yazıyor) kalktı; ara sıra
     açılanlar şerit, başvuru tabloları gizli (app.js SADE_GIZLI). */
  function DonenHedef(){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    const m = [];
    const ana = (R.TARGET_TIERS || [])[0];
    if(ana) m.push({ ust:'Ana hedef', cumle:ana.rank + '.', vurgu:'TYT ' + ana.tyt + ' · AYT ' + ana.ayt + ' net · koçluk hedefi.', sistem:'ays' });
    const est = C.estimateScore();
    m.push(est.ok
      ? { ust:'Tahmini sıra', sayi:sayi({ deger:est.rank, kesinlik:'estimated', formul:'son tam denemelerin medyanı → sıra modeli' }),
          cumle:'en olası.', vurgu:U.fmtNum(est.rankBest) + '–' + U.fmtNum(est.rankWorst) + ' · ' + est.samples + ' tam deneme.', sistem:'ays' }
      : { ust:'Tahmini sıra', cumle:'Tahmin için 3 tam deneme gerekir.', vurgu:C.fullExams('TYT').length + ' tam deneme var.',
          sistem:'ays', dugme:{ label:'Denemeler', act:'go', data:{ 'data-route':'exams' } } });
    const gap = C.netGapToTarget();
    if(gap) m.push({ ust:'Hedefe kalan', sayi:sayi({ deger:Math.max(0, Math.round(gap.netDiff * 100) / 100), birim:'net', ondalik:2, kesinlik:'estimated' }),
      cumle:'kaldı.', vurgu:gap.reached ? 'Hedef bandın üstündesin.' : 'Mesafe göstergesi; hedef değil.', sistem:'ays' });
    return raw(V.donen({ id:'ays-hedef', ad:'Hedef', maddeler:m }));
  }

  async function render(){
    const p = S.profile;

    return String(K.Grid([
      K.Span(12, DonenHedef()),

      K.Span(6, K.Stack([
        K.Card({
          title:'Hedef katmanları', hint:'tiers',
          sub:(p.program ? p.program + ' · ' : '') + '2026 taban sırası ' + U.fmtNum(R.PROGRAM.refRank),
          badge:raw(UI.provenance('ref2026')),
          body:html`${tierTable()}`,
        }),
        K.Card({
          title:'Net matrisi', hint:'net-matrix',
          sub:'Hedef bant ile son 4 tam denemenin test bazlı medyanı',
          badge:raw(UI.provenance('coaching')),
          body:netMatrix(),
        }),
        prefsCard(),
      ])),

      K.Span(4, K.Stack([
        estimateCard(),
        obpCard(),
        K.Card({
          title:'2026 sıra referansları', badge:raw(UI.provenance('ref2026')),
          body:html`
            ${K.Table({ tight:true, headers:['Program', { label:'Taban sıra', num:true }],
              rows:R.RANK_REFS.map(r => [r.uni,
                html`<span class="num">${typeof r.rank === 'number' ? U.fmtNum(r.rank) : r.rank}</span>`]) })}
            <p class="tiny dim mt-8">2027 tercih döneminde YÖK Atlas ve kılavuzdan güncellenmelidir.</p>`,
        }),
        K.Card({
          title:'2024 yerleşen profilleri', sub:'Gerçek yerleşme verisi',
          body:map(R.PLACEMENT_PROFILES, pr => html`
            <div class="stack-xs mb-12">
              <span class="mono-label">${pr.uni}</span>
              ${map(pr.rows, row => html`<div class="row between small">
                <span class="muted">${row[0]}</span><b class="num">${row[1]}</b></div>`)}
              ${when(pr.note, () => html`<p class="tiny dim">${pr.note}</p>`)}
            </div>`),
        }),
      ])),

      /* Aciklama paneli her zaman EN SONDA durur: tam genislik oldugu
         icin araya girerse kendinden sonraki kolonlari alt satira iter. */
      K.Span(12, raw(UI.rail(['rank', 'tiers', 'net-matrix', 'obp', 'preferences', 'certainty']))),
    ]));
  }

  const handle = {
    async 'toggle-placed'(el){
      S.profile.previouslyPlaced = el.checked;
      await M.saveProfile();
      R.App.render();
    },
  };

  const change = {
    async 'pref-program'(el){
      S.prefs.rows[Number(el.dataset.i)].program = el.value;
      S.prefs.updatedAt = new Date().toISOString();
      await M.savePrefs();
    },
    async 'pref-rank'(el){ S.prefs.rows[Number(el.dataset.i)].rank = el.value; await M.savePrefs(); },
    async 'diploma'(el){
      S.profile.diplomaGrade = U.clamp(Number(el.value) || 0, 0, 100);
      await M.saveProfile();
      R.App.render();
    },
  };

  return {
    id:'target',
    /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
       bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
       «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
    kucukVarsayilan:['net-matrisi', 'tercih-mimarisi', 'obp-katkısı'],
    title:'Hedef',
    subtitle(){ return R.PROGRAM.program+' · 2026 sırası '+U.fmtNum(R.PROGRAM.refRank); },
    actions(){ return ''; },
    render, handle, change,
  };
})();
