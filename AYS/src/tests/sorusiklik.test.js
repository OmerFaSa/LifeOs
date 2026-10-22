/* Soru sikligi (data/sorusiklik.js, tools/veri_ays_siklik.py). Kanitladigi sozler:
     1. Yalniz yillara gore yapilandirilmis TYT Matematik tablosu gelir; her
        kimlik var olan bir AYS konusudur; bos yil null kalir (sifir degil).
     2. Konu ekraninda yillik sutunlar, kaynak ve «tahmin» etiketi cizilir;
        verisi olmayan konuda hic cizilmez.
     3. Oncelik hesabi degismez (risk ayni). */

(function(){
  const { describe, it, expect, resetState } = R.Test;

  describe('Soru sıklığı', () => {
    it('her kimlik gerçek bir TYT Matematik konusu; boş yıl null', () => {
      const tm = R.SUBJECTS.find(s => s.topics.some(t => t.id === 'tm-01'));
      const ids = tm.topics.map(t => t.id);
      Object.keys(R.SORU_SIKLIK.konular).forEach(id => expect([id, ids.indexOf(id) >= 0]).toEqual([id, true]));
      expect(R.SORU_SIKLIK.etiket).toBe('tahmin');
      expect(R.SORU_SIKLIK.yillar.length).toBe(8);
      const bol = R.SORU_SIKLIK.konular['tm-03'][0];
      expect(bol.seri[0]).toBe(null);
      expect(R.SORU_SIKLIK.konular['tm-26'].length).toBe(2);
      expect(R.SORU_SIKLIK.konular['tm-15'][0].ortak).toBe(true);
    });

    it('konu ekranı yıllık sütunları ve kaynağı çizer; verisi olmayan konuda yok', async () => {
      resetState();
      const tm = R.SUBJECTS.find(s => s.topics.some(t => t.id === 'tm-03'));
      R.S.ui.topicSubject = tm.id;
      R.S.ui.topicOpen = 'tm-03';
      const d = document.createElement('div');
      d.innerHTML = String(await R.Screens.topic.render());
      try{
        const k = d.querySelector('[data-oz="soru-siklik"]');
        expect(!!k).toBe(true);
        expect(k.querySelectorAll('.pk-sutun__k').length).toBe(8);
        expect(k.querySelectorAll('.pk-sutun__k.is-yok').length).toBe(1);
        expect(k.querySelector('.pk-sutun').getAttribute('aria-label')).toContain('2018 veri yok');
        expect(k.textContent).toContain('tahmin');
      }finally{ d.remove(); }
      R.S.ui.topicOpen = 'tm-24';
      expect(String(await R.Screens.topic.render()).indexOf('data-oz="soru-siklik"')).toBe(-1);
    });

    it('öncelik hesabı veriye bakmaz', () => {
      resetState();
      const tm = R.SUBJECTS.find(s => s.topics.some(t => t.id === 'tm-01'));
      const once = R.Calc.topicRisk(tm.id, 'tm-01');
      const yedek = R.SORU_SIKLIK;
      R.SORU_SIKLIK = null;
      try{ expect(R.Calc.topicRisk(tm.id, 'tm-01')).toEqual(once); }
      finally{ R.SORU_SIKLIK = yedek; }
    });
  });
})();
