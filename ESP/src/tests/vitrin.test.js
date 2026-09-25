/* VİTRİN KARTLARI EKRANDA — ESP Analiz başı (041 027 034 037) ve Dil (033). */
(function(){
  const { describe, it, expect, resetState, withTodayAsync, pushSession, pushCard } = ESP.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };

  describe('Vitrin · ESP ekranlarında', () => {
    it('oz-041 oz-027 oz-034 oz-037 Analiz başı; girilmemiş gün sıfır sayılmaz', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        let k = dom(ESP.Screens.analytics.render());
        ['041', '027', '034', '037'].forEach(n => expect(k.querySelector('[data-oz~="' + n + '"]')).toBeTruthy());
        expect(k.querySelector('[data-oz="034"]').textContent).toContain('veri yok');
        pushSession('2026-10-10', 'music', 30);
        k = dom(ESP.Screens.analytics.render());
        expect(k.querySelector('[data-oz="034"]').textContent).toContain('1 gün veri');
      });
    });

    it('oz-033 Dil: seçili dilin gelecek yükü; kart yoksa çizilmez', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        expect(dom(ESP.Screens.lang.render()).querySelector('[data-oz="033"]')).toBeNull();
        const dil = (ESP.S.profile.langs && ESP.S.profile.langs[0]) || 'en';
        pushCard({ lang:dil, front:'a', back:'b', due:'2026-10-13' });
        expect(dom(ESP.Screens.lang.render()).querySelector('[data-oz="033"]')).toBeTruthy();
      });
    });
  });
  describe('Vitrin · ESP öneri kartı ve tür ayarı', () => {
    it('oz-110 ajan teklifi ortak kartla çizilir; düğmeler her ekranda aynı kapıya gider', () => {
      resetState();
      const p = { id:'t1', kind:'reminder', title:'Cuma okuma hatırlatması', why:'Okuma üç gündür yok', agentId:'patron', source:'kural' };
      const k = dom(ESP.Parts.proposalList([p]));
      expect(k.querySelector('[data-oz="110"]')).toBeTruthy();
      ['oneri-uygula', 'oneri-gec', 'oneri-gec-neden', 'oneri-onizle'].forEach(a =>
        expect(typeof ESP.Screens.onaylar.handle[a]).toBe('function'));
    });

    it('oz-116 tür ayarı moddan önce gelir', async () => {
      resetState();
      const row = { level:'kucuk', kind:'reminder', source:'kural' };
      await ESP.Office.saveSettings({ otomatikTurler:{ reminder:true } });
      expect(ESP.Plans.otomatikMi(row, 'hicbiri')).toBe(true);
      await ESP.Office.saveSettings({ otomatikTurler:{ reminder:false } });
      expect(ESP.Plans.otomatikMi(Object.assign({}, row, { source:'istek' }), 'istek')).toBe(false);
      await ESP.Office.saveSettings({ otomatikTurler:{} });
      expect(ESP.Plans.otomatikMi(Object.assign({}, row, { source:'istek' }), 'istek')).toBe(true);
    });
  });
  describe('Vitrin · ESP güven ve ofis', () => {
    it('oz-173 veri bölümü yedek durumunu gösterir; oz-177 silme kapısı açılır', async () => {
      resetState();
      const k = dom(ESP.Screens.guide.render());
      expect(k.querySelector('[data-oz="173"]')).toBeTruthy();
      const sheet = ESP.UI.sheet;
      let govde = '';
      try{ ESP.UI.sheet = o => { govde = o.body; }; await ESP.Screens.guide.handle['wipe-data'](); }
      finally{ ESP.UI.sheet = sheet; }
      expect(govde).toContain('data-oz="177"');
    });

    it('oz-139 model kapalıyken ofis gri şeritle açılır', () => {
      resetState();
      const k = dom(ESP.Screens.office.render());
      if(!ESP.Office.ready('patron')) expect(k.querySelector('[data-oz="139"]')).toBeTruthy();
    });
  });

})();
