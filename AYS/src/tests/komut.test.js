/* Konusarak plan degistirme — cumleden tipli aksiyona.

   «Bu hafta calismayacagim», «gelecek hafta gunde 4 saat» gibi cumleler
   MODEL CAGRILMADAN kapali katalogdan bir aksiyona cevrilir. Belirsiz
   cumle tahmin edilmez, SORULUR (AGENTS.md §1.7). */

(function(){
  const { describe, it, expect, resetState, withToday } = R.Test;
  const K = R.Komut;

  const TODAY = '2026-11-10';     // Sali

  function tek(metin){
    const r = K.anla(metin, { date:TODAY });
    expect(r.oneriler).toHaveLength(1);
    return r.oneriler[0];
  }
  function soruyor(metin){
    const r = K.anla(metin, { date:TODAY });
    expect(r.oneriler).toHaveLength(0);
    expect(r.sorular.length >= 1).toBeTruthy();
    return r.sorular[0].soru;
  }

  describe('Komut — ara', () => {
    it('«bu hafta» bugünden pazara kadardır', () => {
      withToday(TODAY, () => {
        const o = tek('bu hafta çalışmayacağım');
        expect(o.action).toBe('ara-ver');
        expect(o.params).toEqual({ from:'2026-11-10', to:'2026-11-15' });
      });
    });

    it('«gelecek hafta» ve «haftaya» pazartesiden pazara', () => {
      withToday(TODAY, () => {
        expect(tek('gelecek hafta ara vereceğim').params).toEqual({ from:'2026-11-16', to:'2026-11-22' });
        expect(tek('haftaya çalışmayacağım').params).toEqual({ from:'2026-11-16', to:'2026-11-22' });
        expect(tek('önümüzdeki hafta tatildeyim, çalışmayacağım').params)
          .toEqual({ from:'2026-11-16', to:'2026-11-22' });
      });
    });

    it('yarın, N gün, gün adları ve hafta sonu', () => {
      withToday(TODAY, () => {
        expect(tek('yarın çalışamam').params).toEqual({ from:'2026-11-11', to:'2026-11-11' });
        expect(tek('3 gün ara veriyorum').params).toEqual({ from:'2026-11-10', to:'2026-11-12' });
        expect(tek('iki gün çalışmayacağım').params).toEqual({ from:'2026-11-10', to:'2026-11-11' });
        expect(tek('cuma çalışmayacağım').params).toEqual({ from:'2026-11-13', to:'2026-11-13' });
        expect(tek('perşembeden cumartesiye kadar ara').params)
          .toEqual({ from:'2026-11-12', to:'2026-11-14' });
        expect(tek('hafta sonu çalışmayacağım').params).toEqual({ from:'2026-11-14', to:'2026-11-15' });
        expect(tek('pazartesi çalışamayacağım').params).toEqual({ from:'2026-11-16', to:'2026-11-16' });
      });
    });

    it('tarihi olmayan ara tahmin edilmez, sorulur', () => {
      withToday(TODAY, () => {
        expect(soruyor('ara vereceğim')).toContain('ne zaman');
      });
    });

    it('tek dersi bırakmak bütün günü boşaltmaz, sorulur', () => {
      withToday(TODAY, () => {
        soruyor('bugün matematik çalışmayacağım');
      });
    });

    it('çelişen iki tarih ifadesi sorulur', () => {
      withToday(TODAY, () => {
        soruyor('bu hafta 2 gün ara vereceğim');
      });
    });
  });

  describe('Komut — süre', () => {
    it('tarihli süre geçici istisnadır', () => {
      withToday(TODAY, () => {
        const o = tek('gelecek hafta günde 4 saat çalışacağım');
        expect(o.action).toBe('gecici-sure');
        expect(o.params).toEqual({ from:'2026-11-16', to:'2026-11-22', dakika:240 });
      });
    });

    it('«X değil Y» cümlesinde yeni değer Y’dir', () => {
      withToday(TODAY, () => {
        const o = tek('gelecek hafta sadece bir haftalığına günlük üç değil dört saat çalışacağım');
        expect(o.action).toBe('gecici-sure');
        expect(o.params.dakika).toBe(240);
        expect(tek('günlük 3 saat değil 4 saat çalışacağım').params.dakika).toBe(240);
      });
    });

    it('tarihsiz «günde/günlük/artık» kalıcı temel süredir', () => {
      withToday(TODAY, () => {
        const o = tek('günlük 3 değil 4 saat çalışacağım');
        expect(o.action).toBe('gunluk-sure');
        expect(o.params).toEqual({ dakika:240 });
        expect(tek('artık günde 3 buçuk saat çalışacağım').params).toEqual({ dakika:210 });
        expect(tek('bundan sonra her gün 150 dakika çalışacağım').params).toEqual({ dakika:150 });
      });
    });

    it('tek günlük süre o günün istisnasıdır', () => {
      withToday(TODAY, () => {
        const o = tek('yarın 5 saat çalışacağım');
        expect(o.action).toBe('gecici-sure');
        expect(o.params).toEqual({ from:'2026-11-11', to:'2026-11-11', dakika:300 });
      });
    });

    it('bugün mü her gün mü belli değilse sorulur', () => {
      withToday(TODAY, () => {
        expect(soruyor('4 saat çalışacağım')).toContain('her gün');
      });
    });

    it('geçmiş zaman bir plan komutu değildir', () => {
      withToday(TODAY, () => {
        const r = K.anla('4 saat çalıştım', { date:TODAY });
        expect(r.oneriler.filter(o => /sure/.test(o.action) && o.action !== 'sure-yaz')).toHaveLength(0);
      });
    });

    it('virgülle ayrılmış tarih sonraki cümleye taşınır', () => {
      withToday(TODAY, () => {
        const o = tek('gelecek hafta, günde 4 saat çalışacağım');
        expect(o.action).toBe('gecici-sure');
        expect(o.params.from).toBe('2026-11-16');
      });
    });
  });

  describe('Komut — hedef', () => {
    it('haftalık soru hedefi bu haftaya yazılır', () => {
      withToday(TODAY, () => {
        resetState();
        const n = R.Model.currentWeek();
        const o = tek('bu haftanın soru hedefi 600 olsun');
        expect(o.action).toBe('week-target');
        expect(o.params).toEqual({ weekN:n, questionTarget:600 });
        expect(tek('haftalık hedefi 500 soru yap').params.questionTarget).toBe(500);
      });
    });

    it('gelecek haftanın hedefi bir sonraki haftaya yazılır', () => {
      withToday(TODAY, () => {
        resetState();
        const n = R.Model.currentWeek();
        expect(tek('gelecek haftanın soru hedefi 700 olsun').params.weekN).toBe(n + 1);
      });
    });
  });

  describe('Komut — bileşik ve sohbet', () => {
    it('veri girişi ile plan komutu aynı cümlede ayrılır', () => {
      withToday(TODAY, () => {
        const r = K.anla('bugün 40 soru çözdüm ve yarın çalışmayacağım', { date:TODAY });
        expect(r.oneriler.map(o => o.action)).toEqual(['soru-yaz', 'ara-ver']);
        expect(r.oneriler[1].params).toEqual({ from:'2026-11-11', to:'2026-11-11' });
      });
    });

    it('sıradan sohbet komut sayılmaz', () => {
      withToday(TODAY, () => {
        ['nasılım bu hafta?', 'merhaba', 'türevde neden zorlanıyorum', 'yarın deneme var mı']
          .forEach(m => {
            const r = K.anla(m, { date:TODAY });
            expect(r.komut).toBe(false);
            expect(r.oneriler).toHaveLength(0);
            expect(r.sorular).toHaveLength(0);
          });
      });
    });

    it('her öneri kendi cümle parçasını taşır', () => {
      withToday(TODAY, () => {
        const o = tek('yarın çalışamam');
        expect(o.metin).toContain('yarın');
      });
    });
  });

  /* ==================== yürütme ====================

     Anlaşılan komut öneri kutusundan geçer: küçük olan (kullanıcı
     istediği için) hemen uygulanır, orta olan «anladığım şu» diye
     onaya bekler. Cevap metnini KURAL MOTORU yazar, model değil. */

  describe('Komut — yürütme', () => {
    const { withTodayAsync } = R.Test;
    function temiz(){
      resetState();
      R.S.istisnalar = [];
      R.S.officeProposals = [];
      R.S.officeProposalKeys = [];
      R.S.office = null;
    }

    it('orta komut onaya bekler, hiçbir şey değişmez', async () => {
      await withTodayAsync(TODAY, async () => {
        temiz();
        const islem = await K.isle(K.anla('bu hafta çalışmayacağım'));
        expect(islem.yapilan).toHaveLength(0);
        expect(islem.bekleyen).toHaveLength(1);
        expect(R.Istisna.liste()).toHaveLength(0);
        const metin = K.yanit(islem);
        expect(metin).toContain('Anladığım şu');
        expect(metin).toContain('evet');
      });
    });

    it('«evet» bekleyen öneriyi uygular', async () => {
      await withTodayAsync(TODAY, async () => {
        temiz();
        const islem = await K.isle(K.anla('bu hafta çalışmayacağım'));
        const r = await K.onayla(islem.bekleyen.map(k => k.row.id));
        expect(r.n).toBe(1);
        expect(R.Istisna.liste()).toHaveLength(1);
      });
    });

    it('küçük komut istendiği için hemen uygulanır ve «geri al» ile döner', async () => {
      await withTodayAsync(TODAY, async () => {
        temiz();
        const n = R.Model.currentWeek();
        await R.Model.ensureWeek(n);
        const once = R.S.weeks[R.Model.weekId(n)].questionTarget;
        const hedef = once === 600 ? 650 : 600;
        const islem = await K.isle(K.anla('bu haftanın soru hedefi ' + hedef + ' olsun'));
        expect(islem.yapilan).toHaveLength(1);
        expect(R.S.weeks[R.Model.weekId(n)].questionTarget).toBe(hedef);
        expect(K.yanit(islem)).toContain('Yaptım');
        const geri = await K.geriAl();
        expect(geri.action).toBe('week-target');
        expect(R.S.weeks[R.Model.weekId(n)].questionTarget).toBe(once);
      });
    });

    it('uygulanamayan komut nedeniyle söylenir', async () => {
      await withTodayAsync(TODAY, async () => {
        temiz();
        const islem = await K.isle(K.anla('bu haftanın soru hedefi 20 olsun'));
        expect(islem.dusen).toHaveLength(1);
        expect(K.yanit(islem)).toContain('uygulayamadım');
      });
    });

    it('soru cevabın içinde sorulur', async () => {
      await withTodayAsync(TODAY, async () => {
        temiz();
        const islem = await K.isle(K.anla('ara vereceğim'));
        expect(K.yanit(islem)).toContain('ne zaman');
      });
    });

    it('kısa cevaplar tanınır, uzun cümle kısa cevap sayılmaz', () => {
      expect(K.kisaCevap('Evet')).toBe('evet');
      expect(K.kisaCevap('onaylıyorum.')).toBe('evet');
      expect(K.kisaCevap('vazgeç')).toBe('hayir');
      expect(K.kisaCevap('geri al')).toBe('geri');
      expect(K.kisaCevap('evet ama önce şunu sorayım, türev nasıl çalışılır')).toBe(null);
      expect(K.kisaCevap('bugün nasılım')).toBe(null);
    });
  });
})();
