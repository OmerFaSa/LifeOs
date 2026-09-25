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


  /* E · ESP kartları ekranda (vitrin sürüm 4, brand/ortak/vitrin.js). */
  describe('Vitrin · E kartları ESP ekranlarında', () => {
    const dom2 = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
    const kart = (i, patch) => ESP.Model.newCard(Object.assign({ id:'vk' + i, front:'word' + i, back:'kelime' + i, lang:'en',
      context:'This word' + i + ' is here.', due:ESP.U.todayISO() }, patch || {}));

    it('oz-089 oz-090 oz-097 oz-101 oz-102 Dil › Çalış: kapak, yığın, sahne, süreli düğmeler, oturum sonu', async () => {
      ESP.Test.resetState();
      ESP.S.cards = [kart(1), kart(2, { reps:2, box:3, interval:3, due:ESP.U.todayISO() })];
      ESP.S.ui.reviewQueue = null;
      let k = dom2(await ESP.Screens.lang.render());
      expect(k.querySelector('[data-oz="101"]').textContent).toContain('vadeli');
      ESP.S.ui.reviewQueue = { ids:['vk1', 'vk2'], pos:0, shown:false, correct:0, again:0, dagilim:{}, basladi:Date.now() };
      k = dom2(await ESP.Screens.lang.render());
      expect(k.querySelector('[data-oz="089"] [data-act="reveal-card"]')).toBeTruthy();
      ESP.S.ui.reviewQueue.shown = true;
      k = dom2(await ESP.Screens.lang.render());
      expect(k.querySelector('[data-oz="097"] b').textContent).toBe('word1');
      expect(k.querySelectorAll('[data-oz="090"] [data-act="grade-card"]').length).toBe(ESP.SRS.GRADES.length);
      ESP.S.ui.reviewQueue = { ids:['yok'], pos:0, shown:false, correct:1, again:0, dagilim:{ good:1 }, basladi:Date.now() };
      k = dom2(await ESP.Screens.lang.render());
      expect(k.querySelector('[data-oz="102"]').textContent).toContain('%100');
      ESP.S.ui.reviewQueue = null;
    });

    it('oz-092 oz-098 oz-105 Dil: unutma eğrisi, bağlamda kelime, deste durumu', async () => {
      ESP.Test.resetState();
      ESP.S.cards = [kart(1, { front:'resilient', context:'Children are resilient.', reps:3, box:4, interval:7,
        due:ESP.U.iso(ESP.U.addDays(ESP.U.today(), 3)) }), kart(2)];
      const k = dom2(await ESP.Screens.lang.render());
      expect(k.querySelector('[data-oz="092"] path')).toBeTruthy();
      expect(k.querySelector('[data-oz="098"] u').textContent).toBe('resilient');
      expect(k.querySelector('[data-oz="105"] .u b').textContent).toBe('2 kart');
    });

    it('oz-091 Bugün: dakika halkası; dokunulmamış disiplin «—»', async () => {
      ESP.Test.resetState();
      const k = dom2(await ESP.Screens.today.render());
      const h = k.querySelector('[data-oz="091"]');
      expect(h).toBeTruthy();
      expect(h.textContent).toContain('—');
    });

    it('oz-094 oz-096 oz-104 Okuma: raf, alıntı, bağlı notlar', async () => {
      ESP.Test.resetState();
      ESP.S.books = [ESP.Model.newBook({ id:'b1', title:'Denemeler', author:'Montaigne' })];
      ESP.S.notes = [ESP.Model.newNote({ id:'n1', text:'Alışkanlık ikinci bir doğadır.', bookId:'b1' }),
        ESP.Model.newNote({ id:'n2', text:'Tekrar alışkanlığın malzemesidir.', links:[{ to:'n1', why:'' }] })];
      const k = dom2(await ESP.Screens.library.render());
      expect(k.querySelector('[data-oz="094"] .rf i')).toBeTruthy();
      expect(k.querySelector('[data-oz="096"] q').textContent).toContain('Alışkanlık');
      expect(k.querySelector('[data-oz="104"]').textContent).toContain('1 BAĞLI NOT');
    });

    it('oz-100 Tarih: yıllı olaylar şeritte', async () => {
      ESP.Test.resetState();
      ESP.S.events = [ESP.Model.newEvent({ id:'e1', title:'İstanbul’un fethi', year:1453 }), ESP.Model.newEvent({ id:'e2', title:'Devrim', year:1789 })];
      const k = dom2(await ESP.Screens.history.render());
      expect(k.querySelectorAll('[data-oz="100"] .ek i').length).toBe(2);
    });

    it('oz-108 Felsefe: itirazlı tez soru zinciri olur', async () => {
      ESP.Test.resetState();
      ESP.S.args = [{ id:'a1', thesis:'Alışkanlık ikinci doğadır.', supports:[], status:'open', concepts:[],
        objections:[{ id:'o1', text:'Neden?', answered:true, answer:'Düşünmeden yapılır.' }], createdAt:new Date().toISOString() }];
      const k = dom2(await ESP.Screens.symposium.render());
      expect(k.querySelectorAll('[data-oz="108"] .r').length).toBe(3);
    });

    it('oz-093 Merdiven: basamaklar içerik sırası', async () => {
      ESP.Test.resetState();
      const k = dom2(await ESP.Screens.ladder.render());
      const m = k.querySelector('[data-oz="093"]');
      if(m) expect(m.querySelectorAll('.st > div:not(.ip)').length).toBeGreaterThan(1);
    });
  });

})();
