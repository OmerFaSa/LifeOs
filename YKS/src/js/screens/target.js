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

  /* ---------- tahmini puan ve sıra ---------- */

  function estimateCard(){
    const est = C.estimateScore();

    if(!est.ok){
      return K.Card({
        title:'Tahmini sıra', hint:'rank', sub:'Kural motorunun ürettiği bant',
        badge:raw(UI.certainty('estimate')),
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
      badge:raw(UI.certainty('estimate')),
      body:html`
        <div class="estimate">
          <div class="estimate__rank">${U.fmtNum(est.rankBest)} – ${U.fmtNum(est.rankWorst)}</div>
          <div class="estimate__band">${U.fmtNet(est.scoreLow)} – ${U.fmtNet(est.scoreHigh)} puan
            (±${est.halfWidth})</div>
          ${K.Badge({ label:est.meta.label, tone })}
        </div>

        <div class="estimate__scale">
          ${K.Bar({ value:pos(est.rank), tone:tone === 'ok' ? '' : 'warn' })}
          <div class="row between mt-4">
            <span class="tiny dim">geniş sıra</span>
            <span class="tiny dim num">hedef ${U.fmtNum(est.targetRank)}</span>
          </div>
        </div>

        <div class="mt-12">${K.Notice({ tone:tone === 'ok' ? 'ok' : 'info', body:est.meta.note })}</div>

        ${K.Cols(3, [
          K.Stat({ label:'TYT medyan', value:U.fmtNet(est.tytMedian) }),
          K.Stat({ label:'AYT medyan', value:est.aytMedian == null ? '—' : U.fmtNet(est.aytMedian) }),
          K.Stat({ label:'OBP katkısı', value:'+'+U.fmtNet(est.obp), tone:'ok' }),
        ])}

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
      badge:raw(UI.certainty('estimate')),
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
      foot:html`<p class="tiny dim">Her satırda kontrol edilir: ${R.PREFERENCE_CHECKS.join(' · ')}.
        “Güvenli” program, adayın gitmeyeceği bölüm değildir; yerleşince kayıt yaptırmaya razı olunan programdır.</p>`,
    });
  }

  /* ---------- ekran ---------- */

  function certaintyLegend(){
    return K.Span(12, html`<div class="row wrap gap-6">
      <span class="mono-label as-center">Kesinlik</span>
      ${map(Object.keys(R.CERTAINTY), k => K.Badge({ label:R.CERTAINTY[k].label, tone:R.CERTAINTY[k].tone }))}
      ${raw(UI.hint('certainty'))}</div>`);
  }

  async function render(){
    const p = S.profile;
    const tyt = C.medianTrend('TYT'), ayt = C.medianTrend('AYT');

    return String(K.Grid([
      certaintyLegend(),

      K.Span(6, K.Stack([
        K.Card({
          title:'Hedef katmanları', hint:'tiers',
          sub:p.program+' — 2026 taban başarı sırası '+U.fmtNum(R.PROGRAM.refRank)
            + ' ('+R.PROGRAM.refQuota+'/'+R.PROGRAM.refQuota+' doluluk)',
          badge:raw(UI.certainty('ref2026')),
          body:html`${tierTable()}
            <p class="tiny dim mt-10">Puan yerine başarı sırası izlenir; standartlaştırma nedeniyle
              aynı net ve puan farklı yıllarda farklı sıraya dönüşebilir.</p>`,
        }),
        K.Card({
          title:'Net matrisi', hint:'net-matrix',
          sub:'Hedef bant ile son 4 tam denemenin test bazlı medyanı',
          badge:raw(UI.certainty('coaching')),
          body:netMatrix(),
        }),
        prefsCard(),
      ])),

      K.Span(2, raw(UI.rail(['rank', 'tiers', 'net-matrix', 'obp', 'preferences', 'certainty']))),

      K.Span(4, K.Stack([
        estimateCard(),
        K.Cols(2, [
          K.Stat({ label:'TYT medyanı', value:tyt.last3 == null ? '—' : U.fmtNet(tyt.last3), note:'son 3 tam deneme' }),
          K.Stat({ label:'AYT medyanı', value:ayt.last3 == null ? '—' : U.fmtNet(ayt.last3), note:'son 3 tam deneme' }),
        ]),
        obpCard(),
        K.Card({
          title:'2026 sıra referansları', badge:raw(UI.certainty('ref2026')),
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
    title:'Hedef',
    subtitle(){ return R.PROGRAM.program+' · 2026 sırası '+U.fmtNum(R.PROGRAM.refRank); },
    actions(){ return ''; },
    render, handle, change,
  };
})();
