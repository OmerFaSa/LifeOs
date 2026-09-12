/* Kronoloji motoru — tarihin en yaygin hatasi: kivilcimi neden sanmak. */

(function(){
  const { describe, it, expect, resetState, withToday,
    pushEvent, pushSource, pushChain, pushCard } = ESP.Test;

  describe('kronoloji · yil ve donem', () => {

    it('MO yili negatif okunur ve dogru yuzyila duser', () => {
      expect(ESP.centuryOf(-753)).toBe(-8);
      expect(ESP.centuryOf(-1)).toBe(-1);
      expect(ESP.centuryOf(1)).toBe(1);
      expect(ESP.centuryOf(100)).toBe(1);
      expect(ESP.centuryOf(101)).toBe(2);
    });

    it('sifirinci yil yoktur', () => {
      expect(ESP.centuryOf(0)).toBeNull();
    });

    it('donem yildan turetilir, elle girilmez', () => {
      resetState();
      const e = ESP.Model.newEvent({ title:'Malazgirt', year:1071, era:'cagdas' });
      expect(e.era).toBe('ortacag');
    });

    it('yilsiz olay kronolojiye giremez', async () => {
      resetState();
      const res = await ESP.Model.saveEvent(ESP.Model.newEvent({ title:'Bir sey' }));
      expect(res.ok).toBeFalsy();
    });
  });

  describe('kronoloji · kapsam', () => {

    it('bos kronoloji «sifir kapsam» degil «veri yok»tur', () => {
      resetState();
      const st = ESP.Chrono.status();
      expect(st.cert).toBe('missing');
      expect(ESP.Chrono.spread('era').cert).toBe('missing');
    });

    it('kapsanmayan donem bulgu uretir', () => {
      resetState();
      pushEvent(1071, 'Malazgirt', { region:'anadolu', kind:'siyasi' });
      const st = ESP.Chrono.status();
      expect(st.eras.covered).toBe(1);
      expect(st.eras.empty.length).toBe(ESP.ERAS.length - 1);
    });

    it('uc yuzyildan uzun bosluk gorunur olur', () => {
      resetState();
      pushEvent(1000, 'A');
      pushEvent(1500, 'B');
      const g = ESP.Chrono.centuryGaps();
      expect(g.gaps.length).toBe(1);
      expect(g.gaps[0].length).toBe(4);       // 11, 12, 13, 14. yuzyillar
    });

    it('iki yuzyillik bosluk kor nokta sayilmaz', () => {
      resetState();
      pushEvent(1000, 'A');
      pushEvent(1300, 'B');
      expect(ESP.Chrono.centuryGaps().gaps.length).toBe(0);
    });

    it('esanli olaylar bolge farkindan bagimsiz bulunur', () => {
      resetState();
      pushEvent(1453, 'İstanbul', { region:'anadolu' });
      pushEvent(1455, 'Matbaa', { region:'avrupa' });
      pushEvent(1900, 'Uzak', { region:'dunya' });
      const c = ESP.Chrono.contemporaries(1453, 50);
      expect(c.length).toBe(2);
    });
  });

  describe('kronoloji · nedensellik', () => {

    it('yalnizca tetikleyiciden kurulan zincir dengesiz sayilir', () => {
      resetState();
      const e = pushEvent(1914, 'I. Dünya Savaşı');
      pushChain(e.id, [{ kind:'tetikleyici', text:'Suikast' }]);
      const b = ESP.Model.chainBalance(ESP.S.chains[0]);
      expect(b.balanced).toBeFalsy();
      expect(ESP.Chrono.unbalancedChains().length).toBe(1);
    });

    it('yapisal kosul eklenince zincir dengelenir', () => {
      resetState();
      const e = pushEvent(1914, 'I. Dünya Savaşı');
      pushChain(e.id, [
        { kind:'yapisal', text:'Silahlanma yarışı' },
        { kind:'kurumsal', text:'İttifak sistemi' },
        { kind:'tetikleyici', text:'Suikast' },
      ]);
      expect(ESP.Model.chainBalance(ESP.S.chains[0]).balanced).toBeTruthy();
      expect(ESP.Chrono.unbalancedChains().length).toBe(0);
    });

    it('kaynaksiz halka bir acik olarak sayilir', () => {
      resetState();
      const e = pushEvent(1789, 'Fransız Devrimi');
      const s = pushSource('Bir inceleme', 'secondary');
      pushChain(e.id, [
        { kind:'yapisal', text:'Maliye krizi', sourceId:s.id },
        { kind:'tetikleyici', text:'Bastille' },
      ]);
      expect(ESP.Chrono.unsourcedLinks().length).toBe(1);
    });

    it('olayin aciklanma durumu zincire gore degisir', () => {
      resetState();
      const e = pushEvent(1789, 'Fransız Devrimi');
      expect(ESP.Chrono.explained(e.id).state).toBe('none');
      pushChain(e.id, [{ kind:'tetikleyici', text:'Bastille' }]);
      expect(ESP.Chrono.explained(e.id).state).toBe('thin');
    });

    it('olay silinince ona bagli zincir de kalkar', async () => {
      resetState();
      const e = pushEvent(1453, 'Fetih');
      pushChain(e.id, [{ kind:'yapisal', text:'Top teknolojisi' }]);
      await ESP.Model.deleteEvent(e.id);
      expect(ESP.S.chains.length).toBe(0);
    });
  });

  describe('kronoloji · kaynak', () => {

    it('kaynak yokken birincil oran sifir degil «veri yok»tur', () => {
      resetState();
      expect(ESP.Chrono.sourceBalance().cert).toBe('missing');
      expect(ESP.Chrono.sourceBalance().ratio).toBeNull();
    });

    it('birincil oran kompozisyon olcer, kalite degil', () => {
      resetState();
      pushSource('Ferman', 'primary');
      pushSource('İnceleme', 'secondary');
      const b = ESP.Chrono.sourceBalance();
      expect(b.ratio).toBeCloseTo(0.5, 2);
      expect(b.note).toBeNull();
    });

    it('hepsi birincilse de bir not duser', () => {
      resetState();
      pushSource('Ferman', 'primary');
      pushSource('Kitabe', 'primary');
      expect(ESP.Chrono.sourceBalance().note != null).toBeTruthy();
    });

    it('cevapsiz elestiri sorusu sifir degil eksiktir', () => {
      resetState();
      const s = pushSource('Ferman', 'primary');
      const d = ESP.Model.critiqueDepth(s);
      expect(d.answered).toBe(0);
      expect(d.total).toBe(ESP.SOURCE_CRITIQUE.length);
    });

    it('kaynak silinince ona bagli halkalar kaynaksiz kalir, zincir durur', async () => {
      resetState();
      const e = pushEvent(1789, 'Devrim');
      const s = pushSource('İnceleme', 'secondary');
      pushChain(e.id, [{ kind:'yapisal', text:'Maliye krizi', sourceId:s.id }]);
      await ESP.Model.deleteSource(s.id);
      expect(ESP.S.chains.length).toBe(1);
      expect(ESP.S.chains[0].links[0].sourceId).toBeNull();
    });
  });

  describe('kronoloji · kart ve tekrar', () => {

    it('bir olaydan iki ayri kart cikar', () => {
      resetState();
      const e = pushEvent(1071, 'Malazgirt');
      const k = ESP.Chrono.cardsFor(e);
      expect(k.length).toBe(2);
      expect(k[0].lang).toBe(ESP.HISTORY_DECK);
      expect(k[0].front).toBe('Malazgirt');
      expect(k[1].back).toBe('Malazgirt');
    });

    it('az kartla tarih retansiyonu hukum vermez', () => {
      resetState();
      pushCard({ front:'a', back:'1071', lang:ESP.HISTORY_DECK,
        reps:1, interval:1, due:ESP.U.todayISO(), ease:2.5 });
      expect(ESP.Chrono.retention().cert).toBe('missing');
    });
  });

  describe('kronoloji · tohum', () => {

    it('tohum iki kez basilmaz', async () => {
      resetState();
      const a = await ESP.Model.seedEvents(ESP.SEED_EVENTS.slice(0, 5));
      const b = await ESP.Model.seedEvents(ESP.SEED_EVENTS.slice(0, 5));
      expect(a.added).toBe(5);
      expect(b.added).toBe(0);
      expect(b.skipped).toBe(5);
    });

    it('tohumdaki her olay bir doneme duser', () => {
      const kapsamsiz = (ESP.SEED_EVENTS || []).filter(e => !ESP.eraOf(e.year));
      expect(kapsamsiz.length).toBe(0);
    });
  });

  describe('kronoloji · egzersiz secimi', () => {

    it('egzersizi kural motoru secer: dengesiz zincir varsa zincir gelir', () => {
      resetState();
      const e = pushEvent(1914, 'Savaş');
      pushChain(e.id, [{ kind:'tetikleyici', text:'Suikast' }]);
      expect(ESP.Chrono.drill().id).toBe('zincir');
    });

    it('bos kronolojide bulgu tohum onerir', () => {
      resetState();
      const f = ESP.Chrono.findings();
      expect(f.length).toBe(1);
      expect(f[0].label).toBe('Boş kronoloji');
    });
  });
})();
