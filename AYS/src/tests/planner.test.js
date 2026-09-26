/* Plan üreteci, otomasyon ve palet sistemi. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const P = R.Planner, M = R.Model, U = R.U, S = R.S;

  /* Isleyiciler is bitince R.App.render cagirir; test sayfasinda ekran
     kabi yoktur ve gecikmeli cizim «Sayfa hatasi» birakir (vitrin.test.js
     ile ayni desen). */
  async function cizmeden(fn){
    const A = R.App, r = A.render, pt = A.patch;
    A.render = async () => {}; A.patch = () => true;
    try{ return await fn(); }finally{ A.render = r; A.patch = pt; }
  }

  function profile(patch){
    return Object.assign({
      capacityHoursPerWeek:21, studyDaysPerWeek:6, level:'orta', weakSubjects:[],
    }, patch || {});
  }

  describe('Plan üreteci — temel', function(){
    it('istenen hafta sayısı kadar hafta üretir', function(){
      expect(P.generate(profile(), 40).weeks).toHaveLength(40);
      expect(P.generate(profile(), 12).weeks).toHaveLength(12);
      expect(P.generate(profile(), 1).weeks).toHaveLength(1);
    });
    it('her hafta plan şemasını taşır', function(){
      P.generate(profile(), 20).weeks.forEach(w => {
        expect(typeof w.n).toBe('number');
        expect(typeof w.title).toBe('string');
        expect(Array.isArray(w.topics)).toBeTruthy();
        expect(typeof w.q).toBe('number');
        expect(typeof w.exam).toBe('string');
        expect(typeof w.check).toBe('string');
      });
    });
    it('aynı konu iki kez planlanmaz', function(){
      const seen = {};
      P.generate(profile(), 40).weeks.forEach(w => {
        (w.items || []).forEach(it => {
          const key = it.subjectId+':'+it.topicId;
          expect(seen[key]).toBeUndefined();
          seen[key] = true;
        });
      });
    });
    it('ders içi önkoşul sırası korunur', function(){
      const lastOrder = {};
      let broken = 0;
      P.generate(profile(), 40).weeks.forEach(w => {
        (w.items || []).forEach(it => {
          const sub = R.SUBJECTS.find(s => s.id === it.subjectId);
          const t = sub.topics.find(x => x.id === it.topicId);
          if(lastOrder[it.subjectId] != null && t.order < lastOrder[it.subjectId]) broken++;
          lastOrder[it.subjectId] = t.order;
        });
      });
      expect(broken).toBe(0);
    });
    it('son haftalarda yeni konu açılmaz', function(){
      const plan = P.generate(profile(), 40);
      const last = plan.weeks.slice(-3);
      last.forEach(w => expect((w.items || []).length).toBe(0));
    });
    it('karar kapıları takvime oranlanır', function(){
      const a = P.generate(profile(), 40).meta.gates;
      const b = P.generate(profile(), 20).meta.gates;
      expect(a.length).toBeGreaterThan(2);
      a.forEach(w => expect(w <= 40).toBeTruthy());
      b.forEach(w => expect(w <= 20).toBeTruthy());
      expect(b[0]).toBeLessThan(a[0]);
    });
  });

  describe('Plan üreteci — kişiselleşme', function(){
    it('kapasite arttıkça haftada daha çok konu işlenir', function(){
      const low = P.generate(profile({ capacityHoursPerWeek:12 }), 40).meta.perWeek;
      const high = P.generate(profile({ capacityHoursPerWeek:40 }), 40).meta.perWeek;
      expect(high).toBeGreaterThan(low);
    });
    it('kapasite arttıkça kapsama yükselir', function(){
      const low = P.generate(profile({ capacityHoursPerWeek:12 }), 40).meta.coverage;
      const high = P.generate(profile({ capacityHoursPerWeek:40 }), 40).meta.coverage;
      expect(high).toBeGreaterThan(low);
    });
    it('soru hedefi kapasiteyle ölçeklenir', function(){
      const low = P.generate(profile({ capacityHoursPerWeek:12 }), 40).weeks[10].q;
      const high = P.generate(profile({ capacityHoursPerWeek:35 }), 40).weeks[10].q;
      expect(high).toBeGreaterThan(low);
    });
    it('ileri seviye daha çok soru, sıfırdan daha az verir', function(){
      const yeni = P.generate(profile({ level:'baslangic' }), 40).weeks[10].q;
      const ileri = P.generate(profile({ level:'ileri' }), 40).weeks[10].q;
      expect(ileri).toBeGreaterThan(yeni);
    });
    it('iki farklı profil aynı planı üretmez', function(){
      const a = P.generate(profile({ capacityHoursPerWeek:15, level:'baslangic' }), 30);
      const b = P.generate(profile({ capacityHoursPerWeek:35, level:'ileri' }), 40);
      expect(a.weeks.length === b.weeks.length).toBeFalsy();
      expect(a.meta.perWeek === b.meta.perWeek && a.meta.coverage === b.meta.coverage).toBeFalsy();
    });
    it('kısa takvimde plan sıkışır ama üretilir', function(){
      const plan = P.generate(profile(), 8);
      expect(plan.weeks).toHaveLength(8);
      expect(plan.meta.dropped.length).toBeGreaterThan(0);
    });
  });

  describe('Plan üreteci — konu düşürme', function(){
    it('yeterli takvimde yüksek frekanslı konu düşmez', function(){
      P.generate(profile({ capacityHoursPerWeek:21 }), 40).meta.dropped
        .forEach(d => expect(d.freq === 'high').toBeFalsy());
    });
    it('çok kısa takvimde önce düşük ve orta frekans düşer', function(){
      const dropped = P.generate(profile({ capacityHoursPerWeek:10 }), 10).meta.dropped;
      const high = dropped.filter(d => d.freq === 'high').length;
      const rest = dropped.filter(d => d.freq !== 'high').length;
      const allNonHigh = P.pool({}).filter(t => !t.recurring && t.freq !== 'high').length;
      if(high > 0) expect(rest).toBe(allNonHigh);   // yüksek ancak hepsi bittiyse düşer
      else expect(high).toBe(0);
    });
    it('zayıf işaretlenen ders korunur', function(){
      const plan = P.generate(profile({ capacityHoursPerWeek:10, weakSubjects:['tyt-fen'] }), 14);
      const droppedFen = plan.meta.dropped.filter(d => d.subjectId === 'tyt-fen').length;
      const droppedOther = plan.meta.dropped.filter(d => d.subjectId !== 'tyt-fen').length;
      expect(droppedOther).toBeGreaterThan(droppedFen);
    });
    it('düşen konular rapor edilir, gizlenmez', function(){
      const m = P.generate(profile({ capacityHoursPerWeek:10 }), 12).meta;
      expect(m.dropped.length + m.placed <= m.poolSize).toBeTruthy();
      m.dropped.forEach(d => {
        expect(typeof d.name).toBe('string');
        expect(typeof d.subjectName).toBe('string');
      });
    });
    it('tam kapsama için gereken kapasite hesaplanır', function(){
      /* 20 haftada hiçbir kapasite tüm konuları sığdıramaz (haftada 11
         konu gerekirdi); sayı ancak ulaşılabilir bir takvimde yazılır. */
      const m = P.generate(profile({ capacityHoursPerWeek:14, haftalikKonuTavani:8 }), 40).meta;
      expect(m.capacityForFull).toBeGreaterThan(14);
    });
    it('bol takvimde hiçbir konu düşmez', function(){
      const m = P.generate(profile({ capacityHoursPerWeek:45, level:'ileri' }), 40).meta;
      expect(m.coverage).toBeGreaterThan(90);
    });
  });

  describe('Kapsama hesabı ve haftalık konu tavanı', function(){
    /* Eskiden «tam kapsama için ~X saat» kapasiteyle birlikte büyüyordu
       (20.5 sa → 41, 25.5 sa → 51) ve haftada 5 konu tavanını hiç
       bilmiyordu: 12 haftalık takvimde «130 saat olmalıydı» yazıyordu —
       hiçbir süreyle ulaşılamayan bir sayı. */
    it('tam kapsama kapasitesiyle üretilen planda konu düşmez', function(){
      let olculen = 0;
      [[14, 40, 8], [20.5, 40, 8], [10, 30, 8], [25, 36, 6], [14, 40, 10]].forEach(([cap, tot, tv]) => {
        const pr = profile({ capacityHoursPerWeek:cap, haftalikKonuTavani:tv });
        const m = P.generate(pr, tot).meta;
        expect(m.capacityForFull).toBeGreaterThan(cap);
        const tam = P.generate(Object.assign({}, pr, { capacityHoursPerWeek:m.capacityForFull }), tot).meta;
        expect(tam.dropped).toHaveLength(0);
        /* Yarım saat eksiğiyle yine konu düşer: sayı şişirilmemiş. */
        const eksik = P.generate(Object.assign({}, pr, { capacityHoursPerWeek:m.capacityForFull - 0.5 }), tot).meta;
        expect(eksik.dropped.length).toBeGreaterThan(0);
        olculen++;
      });
      expect(olculen).toBe(5);
    });
    it('kapasite artınca tam kapsama hedefi değişmez', function(){
      const a = P.generate(profile({ capacityHoursPerWeek:20.5, haftalikKonuTavani:8 }), 40).meta;
      const b = P.generate(profile({ capacityHoursPerWeek:25.5, haftalikKonuTavani:8 }), 40).meta;
      expect(a.capacityForFull).toBeGreaterThan(25.5);
      expect(a.dropped.length).toBeGreaterThan(0);
      expect(b.capacityForFull).toBe(a.capacityForFull);
    });
    it('hiçbir süreyle ulaşılamayan kapsama için sayı uydurulmaz', function(){
      /* 40 hafta haftada 6 konu ister; varsayılan tavan 5: süre ne olursa
         olsun sığmaz. Engel KULLANICININ tavanıdır, yükseltilebilir. */
      const m = P.generate(profile({ capacityHoursPerWeek:20.5 }), 40).meta;
      expect(m.dropped.length).toBeGreaterThan(0);
      expect(m.gerekenKonu).toBe(6);
      expect(m.capacityForFull).toBeNull();
      expect(m.kapsamaEngeli).toBe('tavan');
      /* 12 hafta haftada 19 konu ister: en yüksek tavan bile yetmez,
         engel takvimdir. */
      [5, P.TAVAN.max].forEach(tv => {
        const t = P.generate(profile({ capacityHoursPerWeek:20.5, haftalikKonuTavani:tv }), 12).meta;
        expect(t.capacityForFull).toBeNull();
        expect(t.kapsamaEngeli).toBe('takvim');
      });
    });
    it('konu düşmüyorsa tam kapsama mevcut kapasitedir', function(){
      const m = P.generate(profile({ capacityHoursPerWeek:45, level:'ileri' }), 40).meta;
      if(!m.dropped.length){
        expect(m.capacityForFull).toBe(45);
        expect(m.kapsamaEngeli).toBeNull();
      }
    });
    it('tavan varsayılanı 5: bugünkü plan değişmez', function(){
      expect(P.TAVAN.varsayilan).toBe(5);
      expect(P.tavan({})).toBe(5);
      expect(P.topicsPerWeek(profile({ capacityHoursPerWeek:65.5 }))).toBe(5);
      expect(P.generate(profile(), 40).meta.tavan).toBe(5);
    });
    it('kullanıcının tavanı haftadaki konu sayısını sınırlar ve açar', function(){
      expect(P.topicsPerWeek(profile({ capacityHoursPerWeek:65.5, haftalikKonuTavani:3 }))).toBe(3);
      expect(P.topicsPerWeek(profile({ capacityHoursPerWeek:65.5, haftalikKonuTavani:8 }))).toBe(8);
      /* Tavan kapasiteyi aşamaz: 3 saat günlük süreyle 8 konu yazılmaz. */
      expect(P.topicsPerWeek(profile({ capacityHoursPerWeek:20.5, haftalikKonuTavani:8 }))).toBe(3);
      const m = P.generate(profile({ capacityHoursPerWeek:65.5, haftalikKonuTavani:8 }), 40).meta;
      expect(m.perWeek).toBe(8);
      expect(m.tavan).toBe(8);
    });
    it('geçersiz tavan varsayılana düşer', function(){
      [0, -2, P.TAVAN.max + 1, 'sekiz', null, NaN].forEach(v => {
        expect(P.tavan({ haftalikKonuTavani:v })).toBe(5);
      });
    });
    /* Ayar ekranı (Rehber › Ayarlar › Profil): tavan kullanıcının
       tercihidir, kaydedilince plan HEMEN yeni tavanla kurulur. */
    function profilFormu(tavan){
      const d = document.createElement('div');
      const alan = (id, v) => '<input id="' + id + '" value="' + v + '">';
      d.innerHTML = alan('st-name', '') + alan('st-city', '') + alan('st-cap', '65.5')
        + alan('st-sleep', '7.5') + alan('st-diploma', '80') + alan('st-rank', '10000')
        + alan('st-tavan', tavan);
      document.body.appendChild(d);
      return d;
    }
    it('ayardan girilen tavan kaydedilir ve plan hemen ona uyar', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const d = profilFormu('8');
        try{ await cizmeden(() => R.Screens.guide.handle['save-profile']()); }finally{ d.remove(); }
        expect(S.profile.haftalikKonuTavani).toBe(8);
        expect(S.plan.meta.tavan).toBe(8);
        expect(S.plan.meta.perWeek).toBe(8);
      });
    });
    it('geçersiz tavan kaydedilmez, profil değişmez', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        S.profile.haftalikKonuTavani = 4;
        const eskiKap = S.profile.capacityHoursPerWeek;
        for(const v of ['11', '0', '2.5', 'çok']){
          const d = profilFormu(v);
          try{ await cizmeden(() => R.Screens.guide.handle['save-profile']()); }finally{ d.remove(); }
          expect(S.profile.haftalikKonuTavani).toBe(4);
          expect(S.profile.capacityHoursPerWeek).toBe(eskiKap);
        }
      });
    });
    it('boş bırakılan tavan varsayılana döner', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        S.profile.haftalikKonuTavani = 4;
        const d = profilFormu('');
        try{ await cizmeden(() => R.Screens.guide.handle['save-profile']()); }finally{ d.remove(); }
        expect(S.profile.haftalikKonuTavani).toBeUndefined();
        expect(P.tavan(S.profile)).toBe(5);
      });
    });
    it('tavan değişince plan yeniden üretilir; eski plan boşuna üretilmez', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        const a = await M.ensurePlan(true);
        /* Tavan alanı olmayan eski plan, tavanı varsayılan olan profille
           yeniden üretilmez: ilk açılışta herkesin planı sıfırlanmamalı. */
        delete a.meta.tavan;
        expect(await M.ensurePlan()).toBe(a);
        S.profile.haftalikKonuTavani = 3;
        const b = await M.ensurePlan();
        expect(b === a).toBeFalsy();
        expect(b.meta.tavan).toBe(3);
      });
    });
  });

  describe('Haftanın bütün konuları güne ulaşır', function(){
    /* Hafta sözleşmesi eskiden en fazla 3 konu tutuyordu (defaultWeek
       slice(0,3), taslak 3, «Konu ekle» 3) ve gün blokları hep ilk üç
       konuyu alıyordu. Plan haftaya 4–5 konu yazınca 4. ve 5. konu
       hiçbir güne düşmüyordu: plan «yazıldı» diyor, kullanıcı görmüyordu. */
    async function kur(cap, tavan){
      resetState();
      S.profile.setupDone = true;
      S.profile.capacityHoursPerWeek = cap;
      if(tavan) S.profile.haftalikKonuTavani = tavan;
      const plan = await M.ensurePlan(true);
      const w = await M.ensureWeek(1);
      const gunler = [];
      for(const d of M.weekDates(1)) gunler.push(await M.ensureDay(d));
      return { plan, w, gunler, planli:plan.weeks[0].items };
    }
    function sayim(gunler){
      const c = {};
      gunler.filter(g => !R.WEEKDAYS[g.dow].ritual).forEach(g => {
        const bu = {};
        g.blocks.forEach(b => { if(b.topicId) bu[b.topicId] = true; });
        Object.keys(bu).forEach(k => { c[k] = (c[k] || 0) + 1; });
      });
      return c;
    }
    it('plan haftaya 5 konu yazınca sözleşme 5 konuyu taşır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        const { w, planli } = await kur(45.5);
        expect(planli.length).toBe(5);
        expect(w.mainTopics.map(t => t.topicId)).toEqual(planli.map(t => t.topicId));
      });
    });
    it('5 konulu haftada her konu en az iki ders gününe düşer', async function(){
      await withTodayAsync('2026-09-15', async () => {
        const { gunler, planli } = await kur(45.5);
        const c = sayim(gunler);
        planli.forEach(t => expect((c[t.topicId] || 0) >= 2).toBeTruthy());
      });
    });
    it('tavan 8 iken sekiz konunun her biri en az bir güne düşer', async function(){
      await withTodayAsync('2026-09-15', async () => {
        const { gunler, planli } = await kur(65.5, 8);
        expect(planli.length).toBe(8);
        const c = sayim(gunler);
        planli.forEach(t => expect((c[t.topicId] || 0) >= 1).toBeTruthy());
      });
    });
    it('3 konuluk haftada günler eskisi gibi kurulur', async function(){
      await withTodayAsync('2026-09-15', async () => {
        const { w, gunler } = await kur(20.5);
        expect(w.mainTopics.length).toBe(3);
        gunler.filter(g => !R.WEEKDAYS[g.dow].ritual).forEach(g => {
          g.blocks.forEach((b, i) => expect(b.topicId).toBe(w.mainTopics[i].topicId));
        });
      });
    });
    it('gün açılışındaki blok bağlama dağılımı geri bozmaz', async function(){
      await withTodayAsync('2026-09-15', async () => {
        const { gunler } = await kur(45.5);
        for(const g of gunler){
          if(R.WEEKDAYS[g.dow].ritual) continue;
          const once = g.blocks.map(b => b.topicId);
          expect(await R.Auto.syncDayBlocks(g.date)).toBe(0);
          expect(S.days[g.date].blocks.map(b => b.topicId)).toEqual(once);
        }
      });
    });
    it('hafta taslağı planın bütün konularını alır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        const { w, planli } = await kur(45.5);
        w.mainTopics = [];
        const d = R.Auto.draftWeek(1);
        expect(d.ok).toBeTruthy();
        const ids = d.topics.map(t => t.topicId);
        planli.forEach(t => expect(ids).toContain(t.topicId));
      });
    });
  });

  describe('Konu düşünce süre teklifi', function(){
    /* «Konuları çıkar» ile «daha çok çalış» arasındaki seçim sayıyla
       sunulur. Satırlar gunluk-sure aksiyonunun UYGULAYACAĞI kapasiteyle
       (R.Istisna.kapasiteSaati) aynı üreteçten hesaplanır: gösterilen
       sayı ile onaydan sonra olan aynıdır. */
    const I = () => R.Istisna;
    const secenek = (pr, tot, dk) => P.sureSecenekleri(pr, tot,
      { simdiDk:dk, kapasite:I().kapasiteSaati, maxDk:I().DAKIKA.max });
    it('yalnız konu geri getiren en küçük eşikler gösterilir', function(){
      const pr = profile({ capacityHoursPerWeek:I().kapasiteSaati(180), haftalikKonuTavani:8 });
      const sec = secenek(pr, 40, 180);
      expect(sec.satirlar.length).toBeGreaterThan(0);
      let once = sec.dusen;
      sec.satirlar.forEach(r => {
        expect(r.dakika > 180).toBeTruthy();
        expect(r.dusen < once).toBeTruthy();
        expect(r.geriGelen).toBe(sec.dusen - r.dusen);
        expect(r.kapasite).toBe(I().kapasiteSaati(r.dakika));
        const gercek = P.generate(Object.assign({}, pr, { capacityHoursPerWeek:r.kapasite }), 40).meta;
        expect(gercek.dropped.length).toBe(r.dusen);
        /* Eşik en küçüktür: 15 dk azı aynı kazancı vermez. */
        const az = P.generate(Object.assign({}, pr,
          { capacityHoursPerWeek:I().kapasiteSaati(r.dakika - 15) }), 40).meta;
        expect(az.dropped.length > r.dusen).toBeTruthy();
        once = r.dusen;
      });
      expect(sec.tam.dusen).toBe(0);
    });
    it('tavan engelinde tam satırı yok, engel ve gereken konu söylenir', function(){
      const pr = profile({ capacityHoursPerWeek:I().kapasiteSaati(180) });
      const sec = secenek(pr, 40, 180);
      expect(sec.tam).toBeNull();
      expect(sec.engel).toBe('tavan');
      expect(sec.gerekenKonu).toBe(6);
      expect(sec.tavan).toBe(5);
      /* Kısmi kazanç yine gösterilir: 3 → 5 konu/hafta. */
      expect(sec.satirlar.length).toBeGreaterThan(0);
    });
    it('konu düşmüyorsa teklif yok', function(){
      const pr = profile({ capacityHoursPerWeek:I().kapasiteSaati(480), haftalikKonuTavani:8 });
      expect(P.generate(pr, 40).meta.dropped).toHaveLength(0);
      expect(secenek(pr, 40, 480)).toBeNull();
    });
    it('süre artırmak konu getirmiyorsa satır uydurulmaz', function(){
      /* Tavan 3 ve kapasite zaten 3 konuya yetiyor: hiçbir süre getirmez. */
      const pr = profile({ capacityHoursPerWeek:I().kapasiteSaati(180), haftalikKonuTavani:3 });
      const sec = secenek(pr, 40, 180);
      expect(sec.satirlar).toHaveLength(0);
      expect(sec.tam).toBeNull();
    });

    const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
    async function planli(cap, tavan){
      resetState();
      S.profile.setupDone = true;
      S.profile.capacityHoursPerWeek = cap;
      if(tavan) S.profile.haftalikKonuTavani = tavan;
      await M.ensurePlan(true);
    }
    it('plan kartı eşikleri ve uygulama düğmesini gösterir; boş sayı yazmaz', async function(){
      await withTodayAsync('2026-09-15', async () => {
        await planli(I().kapasiteSaati(180), 8);
        const k = dom(await R.Screens.plan.render());
        const dugmeler = k.querySelectorAll('[data-act="sure-oner"]');
        expect(dugmeler.length).toBeGreaterThan(0);
        dugmeler.forEach(b => expect(Number(b.getAttribute('data-dakika')) > 180).toBeTruthy());
        expect(k.textContent).toContain('konu geri gelir');
        expect(k.textContent.indexOf('~ saat') < 0).toBeTruthy();
        expect(k.textContent.indexOf('null') < 0).toBeTruthy();
      });
    });
    it('tavan engelinde plan kartı tavanı söyler ve ayara götürür', async function(){
      await withTodayAsync('2026-09-15', async () => {
        await planli(I().kapasiteSaati(180));
        const k = dom(await R.Screens.plan.render());
        expect(k.textContent).toContain('haftada en fazla 5 konu');
        expect(k.querySelector('[data-act="go"][data-route="guide"]')).toBeTruthy();
      });
    });
    it('düğme günlük süre önizlemesini açar; önizleme kaç konunun döneceğini yazar', async function(){
      await withTodayAsync('2026-09-15', async () => {
        await planli(I().kapasiteSaati(180), 8);
        const sec = secenek(S.profile, S.plan.meta.total, 180);
        const r = sec.satirlar[0];
        const sheet = R.UI.sheet;
        let acilan = null;
        try{
          R.UI.sheet = o => { acilan = o; };
          await cizmeden(() => R.Screens.plan.handle['sure-oner']({ dataset:{ dakika:String(r.dakika) } }));
        }finally{ R.UI.sheet = sheet; }
        expect(acilan).toBeTruthy();
        const g = dom(acilan.body).textContent;
        expect(g).toContain('Plana girmeyen konu');
        expect(g).toContain(String(sec.dusen));
        expect(g).toContain(String(r.dusen));
        expect(String(acilan.footer)).toContain('istisna-uygula');
        /* Pencere PLAN ekranından açıldı: «Uygula» burada da çalışmalı
           (düğmeler açık ekranın işleyicisine gider). Onaydan sonra plan
           önizlemenin söylediği kadar konuyu geri alır. */
        await cizmeden(() => R.Screens.plan.handle['istisna-uygula']());
        expect(S.profile.gunlukDakika).toBe(r.dakika);
        expect(S.plan.meta.dropped.length).toBe(r.dusen);
      });
    });
  });

  describe('Plan sağlığı ve yeniden planlama', function(){
    it('geçmiş hafta yokken durum yeni', function(){
      resetState();
      const h = P.health(P.generate(profile(), 40), 1);
      expect(h.status).toBe('yeni');
      expect(h.pct).toBeNull();
    });
    it('kapanmamış konular geride sayılır', async function(){
      resetState();
      for(const s of R.SUBJECTS) await M.ensureTopics(s.id);
      const plan = P.generate(profile(), 40);
      const h = P.health(plan, 6);
      expect(h.expected).toBeGreaterThan(0);
      expect(h.closed).toBe(0);
      expect(h.status).toBe('geride');
    });
    it('kapanan konular sağlığı yükseltir', async function(){
      resetState();
      for(const s of R.SUBJECTS) await M.ensureTopics(s.id);
      const plan = P.generate(profile(), 40);
      for(const w of plan.weeks.filter(x => x.n < 6)){
        for(const it of (w.items || [])){
          await M.setTopicState(it.subjectId, it.topicId,
            { first:85, firstAt:U.todayISO(), second:80, secondAt:U.todayISO() });
        }
      }
      const h = P.health(plan, 6);
      expect(h.pct).toBe(100);
      expect(h.status).toBe('saglikli');
    });
    it('yeniden planlama geçmiş haftaları korur', function(){
      resetState();
      const plan = P.generate(profile(), 40);
      const next = P.replan(plan, profile(), 10);
      expect(next.weeks).toHaveLength(40);
      for(let i = 0; i < 9; i++){
        expect(next.weeks[i].title).toBe(plan.weeks[i].title);
      }
      expect(next.meta.replannedFrom).toBe(10);
    });
    it('yeniden planlamada kapanmamış konular öne alınır', async function(){
      resetState();
      for(const s of R.SUBJECTS) await M.ensureTopics(s.id);
      const plan = P.generate(profile(), 40);
      const next = P.replan(plan, profile(), 8);
      expect(next.meta.carried).toBeGreaterThan(0);
    });
  });

  describe('Model plan bağlantısı', function(){
    it('plan üretilince curriculumFor plandan okur', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        const plan = await M.ensurePlan(true);
        const w = M.curriculumFor(1);
        expect(w.title).toBe(plan.weeks[0].title);
        expect(w.phase).toBeTruthy();
      });
    });
    it('plan yokken sabit müfredata düşer', function(){
      resetState();
      S.plan = null;
      const w = M.curriculumFor(1);
      expect(w.title).toBe(R.CURRICULUM[0].title);
    });
    it('kapasite değişince plan yeniden üretilir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        const a = await M.ensurePlan(true);
        /* Yeniden üretimin kanıtı kapasitenin kendisidir. Önceden
           `generatedAt` damgalarının farklı olması da isteniyordu; damga
           milisaniye çözünürlükte ve iki üretim aynı milisaniyeye düşünce
           test rastgele kalıyordu (ekip/HATALAR.md T2-08). */
        expect(a.meta.capacityHoursPerWeek === 35).toBeFalsy();
        S.profile.capacityHoursPerWeek = 35;
        const b = await M.ensurePlan();
        expect(b.meta.capacityHoursPerWeek).toBe(35);
        expect(b === a).toBeFalsy();
      });
    });
    it('hafta sözleşmesi plandaki konuya bağlanır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const w = await M.ensureWeek(1);
        expect(w.mainTopics.length).toBeGreaterThan(0);
        expect(w.mainTopics[0].subjectId).toBeTruthy();
      });
    });
  });

  describe('Otomasyon', function(){
    it('boş sözleşme için taslak önerilir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const n = M.currentWeek();
        const w = await M.ensureWeek(n);
        w.mainTopics = [];
        await M.saveWeek(n);
        expect(R.Auto.suggestions().some(s => s.id === 'draft-week')).toBeTruthy();
      });
    });
    it('taslak konu, hedef ve kapasite üretir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const n = M.currentWeek();
        await M.ensureWeek(n);
        const d = R.Auto.draftWeek(n);
        expect(d.ok).toBeTruthy();
        expect(d.topics.length).toBeGreaterThan(0);
        expect(d.questionTarget).toBeGreaterThan(0);
        d.topics.forEach(t => expect(typeof t.why).toBe('string'));
      });
    });
    it('imzalı haftaya taslak yazılmaz', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        const n = M.currentWeek();
        const w = await M.ensureWeek(n);
        w.signedAt = new Date().toISOString();
        await M.saveWeek(n);
        expect(R.Auto.draftWeek(n).ok).toBeFalsy();
      });
    });
    it('taslak uygulanınca sözleşmeye yazılır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const n = M.currentWeek();
        await M.ensureWeek(n);
        const d = R.Auto.draftWeek(n);
        expect(await R.Auto.applyDraft(n, d)).toBeTruthy();
        expect(S.weeks[M.weekId(n)].mainTopics[0].name).toBe(d.topics[0].name);
      });
    });
    it('bloklar haftanın konularına bağlanır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const n = M.currentWeek();
        await M.ensureWeek(n);
        await R.Auto.applyDraft(n, R.Auto.draftWeek(n));
        const day = await M.ensureDay('2026-09-15');
        day.blocks.forEach(b => { b.subjectId = null; });
        await M.saveDay('2026-09-15');
        const changed = await R.Auto.syncDayBlocks('2026-09-15');
        expect(changed).toBeGreaterThan(0);
        expect(S.days['2026-09-15'].blocks.some(b => b.subjectId)).toBeTruthy();
      });
    });
    it('başlanmış bloğa dokunmaz', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        const n = M.currentWeek();
        const w = await M.ensureWeek(n);
        w.mainTopics = [{ name:'Yeni', subjectId:'tyt-fen', topicId:'x', questionTarget:50, accuracy:70 }];
        await M.saveWeek(n);
        const day = await M.ensureDay('2026-09-15');
        day.blocks[0].status = 'done';
        day.blocks[0].topic = 'Elle yazdım';
        await M.saveDay('2026-09-15');
        await R.Auto.syncDayBlocks('2026-09-15');
        expect(S.days['2026-09-15'].blocks[0].topic).toBe('Elle yazdım');
      });
    });
    it('davranış hedefi veriden seçilir', function(){
      resetState();
      expect(typeof R.Auto.suggestBehaviorGoal()).toBe('string');
      expect(R.Auto.suggestBehaviorGoal().length).toBeGreaterThan(5);
    });
    it('her öneri neden taşır', function(){
      resetState();
      R.Auto.suggestions().forEach(s => {
        expect(typeof s.why).toBe('string');
        expect(s.why.length).toBeGreaterThan(10);
        expect(typeof s.act).toBe('string');
      });
    });
  });

  /* GÖRÜNÜM — tek tasarım (ekip/EKIP-PLANI.md §8-4, kullanıcı kararı
     2026-09-24: paletler ve beş düzen kalkar, yerine Açık · Koyu · Sistem).
     Burada önceden «en az beş palet» testi vardı; o özellik kullanıcı
     kararıyla kalktığı için test de kalktı. Yerine iki kalıcı söz:
     tema profilden uygulanır ve eski profilde kalan palet/düzen değeri
     uygulamayı bozmaz. */
  describe('Görünüm — tek tasarım', function(){
    const kok = document.documentElement;
    const NIT = ['data-theme', 'data-palette', 'data-design'];
    function sakla(){ return NIT.map(a => kok.getAttribute(a)); }
    function geriKoy(v){ NIT.forEach((a, i) => v[i] == null ? kok.removeAttribute(a) : kok.setAttribute(a, v[i])); }

    it('tema profilden uygulanır: Açık, Koyu, Sistem', function(){
      const eski = sakla();
      try{
        resetState();
        S.profile.theme = 'dark';  R.App.applyTheme();
        expect(kok.getAttribute('data-theme')).toBe('dark');
        S.profile.theme = 'light'; R.App.applyTheme();
        expect(kok.getAttribute('data-theme')).toBe('light');
        S.profile.theme = 'system'; R.App.applyTheme();
        expect(kok.getAttribute('data-theme')).toBe(null);
      }finally{ geriKoy(eski); }
    });

    it('eski profilde kalan palet ve düzen değeri uygulamayı bozmaz', function(){
      const eski = sakla();
      try{
        resetState();
        S.profile.theme = 'light';
        S.profile.palette = 'okyanus';
        S.profile.design = 'harita';
        let hata = null;
        try{ R.App.applyTheme(); }catch(e){ hata = e; }
        expect(hata).toBe(null);
        expect(kok.getAttribute('data-theme')).toBe('light');
      }finally{ geriKoy(eski); }
    });
  });

  describe('Çok kullanıcılı hazırlık', function(){
    it('varsayılan profilde kişisel ad yok', function(){
      resetState();
      expect(S.profile.name).toBe('');
      expect(S.profile.city).toBe('');
    });
    it('kurulum beş adım', function(){
      expect(R.Setup.STEPS).toHaveLength(5);
      R.Setup.STEPS.forEach(s => expect(s.title.length).toBeGreaterThan(3));
    });
    it('kurulum tamamlanmadan gerekli sayılır', function(){
      resetState();
      S.profile.setupDone = false;
      expect(R.Setup.needed()).toBeTruthy();
      S.profile.setupDone = true;
      expect(R.Setup.needed()).toBeFalsy();
    });
  });
})();
