/* Soru çöz ekranı uçtan uca (screens/solve.js). Kapsam ölçümü (2026-10-15)
   ekranın %29'unun hiç koşmadığını gösterdi: çözüm, konu arama, kayıt ve
   yanlış defteri akışı testsizdi. Kanıtladığı sözler:
     1. Çözülen soru seçilen konuya, zorluğa ve sonuca bağlanarak kaydedilir.
     2. Konu yazarak aranır; kelime sırası ve Türkçe harf farkı önemsiz.
     3. «Kaldır» modelin tahminini de kaldırır; konu seçilmezse kayıt konusuz.
     4. Yanlış defteri ilkeyi kullanıcıdan ister; tam çözüm kopyalanmaz,
        hata türü kullanıcının seçtiğidir.
     5. Model hata verirse kayıt düğmesi yoktur, ekran bozulmaz. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const E = () => R.Screens.solve;

  async function sahne(fn, cozum){
    resetState();
    const kap = document.createElement('div');
    document.body.appendChild(kap);
    const eski = { render:R.App.render, solve:R.Solver.solve, toast:R.UI.toast, ready:R.Solver.ready };
    R.Solver.ready = () => true;      /* form yalnız model bağlıyken çizilir */
    const tost = [];
    R.App.render = async () => { kap.innerHTML = String(await E().render()); };
    R.UI.toast = m => { tost.push(m); };
    R.Solver.solve = cozum || (async () => ({ text:'Soru ne diyor? 2^3 · 2^2.\nAdım 1: üsler toplanır.\nCevap: 32',
      model:'test-model', meta:{ answer:'32', subjectId:'tyt-matematik', topicId:'tm-05', difficulty:2, trap:'Üsleri çarpmak' } }));
    try{
      await R.App.render();
      await fn({ kap, tost, deger:(id, v) => { const e = document.getElementById(id); if(v !== undefined) e.value = v; return e ? e.value : null; } });
    }finally{
      try{ await E().handle['q-reset'](); }catch(e){ /* durum */ }
      Object.assign(R.App, { render:eski.render }); R.Solver.solve = eski.solve; R.UI.toast = eski.toast; R.Solver.ready = eski.ready;
      kap.remove();
    }
  }

  describe('Soru çöz — model yokken', () => {
    it('model bağlı değilken boş form çizilmez; ayar ve Hızlı kayıt söylenir', async () => {
      resetState();
      const eski = R.Solver.ready;
      R.Solver.ready = () => false;
      try{
        const h = String(await E().render());
        expect(h.indexOf('id="q-text"') < 0).toBe(true);
        expect(h.indexOf('id="q-drop"') < 0).toBe(true);
        expect(h).toContain('Yapay zekâ bağlı değil.');
        expect(h).toContain('Hızlı kayıt');
      }finally{ R.Solver.ready = eski; }
    });
  });

  describe('Soru çöz — uçtan uca', () => {
    it('çöz → konu ara ve seç → kaydet: kayıt konuya, zorluğa, sonuca bağlanır', () => sahne(async ({ kap, deger }) => {
      deger('q-text', '2^3 · 2^2 işleminin sonucu kaçtır?');
      await E().handle['q-solve']();
      expect(kap.textContent).toContain('Cevap: 32');
      expect(document.getElementById('q-topic').value).toBe('tyt-matematik::tm-05');   // modelin tahmini
      /* Kelime sırası ve harf farkı önemsiz: «uslu mat». */
      await E().change['q-topic-q']({ value:'uslu mat' });
      const sat = document.querySelectorAll('#q-topic-sug [data-act="q-topic-pick"]');
      expect(sat.length > 0).toBe(true);
      const ref = sat[0].dataset.ref;
      await E().handle['q-topic-pick']({ dataset:{ ref } });
      expect(document.getElementById('q-topic').value).toBe(ref);
      deger('q-diff', '4'); deger('q-result', R.SOLVE_RESULT_ORDER[0]); deger('q-answer', '32');
      await E().handle['q-save']();
      const r = R.S.solved[0];
      expect(R.S.solved.length).toBe(1);
      expect([r.subjectId + '::' + r.topicId, r.difficulty, r.result, r.answer, r.model]).toEqual([ref, 4, R.SOLVE_RESULT_ORDER[0], '32', 'test-model']);
      expect(r.question).toContain('2^3');
      expect(R.S.errors.length).toBe(0);
    }));

    it('«Kaldır» modelin tahminini de kaldırır; konusuz kayıt konu takibine bağlanmaz', () => sahne(async ({ deger }) => {
      deger('q-text', 'bir soru');
      await E().handle['q-solve']();
      await E().handle['q-topic-clear']();
      expect(document.getElementById('q-topic').value).toBe('');
      await E().handle['q-save']();
      expect([R.S.solved[0].subjectId, R.S.solved[0].topicId]).toEqual([null, null]);
    }));

    it('yanlış defteri: ilke yoksa eklemez; ilke ve hata türü kullanıcının, tam çözüm kopyalanmaz', () => sahne(async ({ tost, deger }) => {
      deger('q-text', '2^3 · 2^2 işleminin sonucu kaçtır?');
      await E().handle['q-solve']();
      await E().handle['q-save-error']();
      expect(R.S.solved.length).toBe(0);
      expect(tost.some(m => /ilke/.test(m))).toBe(true);
      deger('q-principle', 'Tabanlar aynıysa üsler toplanır.');
      deger('q-tag', 'İ');
      await E().handle['q-save-error']();
      expect(R.S.solved.length).toBe(1);
      const e = R.S.errors[0];
      expect([e.tag, e.principle, e.status, e.topicId]).toEqual(['İ', 'Tabanlar aynıysa üsler toplanır.', 'Yanlış', 'tm-05']);
      expect(e.principle.indexOf('Adım 1') < 0).toBe(true);
      expect(e.rootCause).toBe('Üsleri çarpmak');
    }));

    it('model hata verirse kayıt düğmesi çizilmez, ekran bozulmaz', () => sahne(async ({ kap, deger }) => {
      deger('q-text', 'bir soru');
      await E().handle['q-solve']();
      expect(kap.querySelector('[data-act="q-save"]')).toBe(null);
      expect(kap.querySelector('#q-text') !== null).toBe(true);
    }, async () => { const e = new Error('kota'); e.code = 'quota'; throw e; }));
  });
})();
