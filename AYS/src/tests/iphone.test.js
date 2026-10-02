/* iPhone planı (belgeler/ekip/IPHONE-PLANI.md) · Faz 1 · Plan çekmecesi.

   Kullanıcı (2026-10-02): «haftalık kısmında sadece haftalık bölümü
   görebilirim … Program kısmında H1, H2, H3 diye uzuyor; çalışma yoğunluğu
   falan ekstraya kaçıyor. Ben ekstra bir şey istemiyorum.»

   Sözleşme §2.2: açık kart ≤ 3. Gizlemek uygulama düzeyindedir (app.js
   SADE_GIZLI + ekranın kucukVarsayilan'ı); bu testler çizimi gerçek
   bölümlere ayırıp hangilerinin AÇIK kaldığını sayar. Anahtar yanlış
   yazılırsa bölüm sessizce açık kalırdı: bu da burada yakalanır. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;

  async function hazirla(){
    resetState();
    R.S.profile.setupDone = true;
    await R.Model.ensurePlan(true);
    await R.Model.ensureWeek(R.Model.currentWeek());
    return await R.Model.ensureDay(R.U.today());
  }

  /* Ekranı çizer, bölümlerini ayırır: { kok, var, acik, kucuk, gizli } */
  async function bolumle(id){
    const sc = R.Screens[id];
    const kok = document.createElement('div');
    kok.innerHTML = String(await sc.render());
    document.body.appendChild(kok);
    const G = window.LIFEOS.Gizle;
    const gizliler = (sc.gizliVarsayilan || []).concat(R.App.SADE_GIZLI[id] || []);
    const kucukler = sc.kucukVarsayilan || [];
    const var_ = G.bolumler(kok).map(b => b.anahtar);
    return {
      kok, var:var_,
      gizli:var_.filter(a => gizliler.indexOf(a) >= 0),
      kucuk:var_.filter(a => gizliler.indexOf(a) < 0 && kucukler.indexOf(a) >= 0),
      acik:var_.filter(a => gizliler.indexOf(a) < 0 && kucukler.indexOf(a) < 0),
      bitir(){ kok.remove(); },
    };
  }

  describe('iPhone · Faz 1 · Plan çekmecesi', () => {

    it('Hafta: açık yalnız haftanın kendisi; özet şerit, geçmiş ve başvuru gizli', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const b = await bolumle('week');
        try{
          expect(!!b.kok.querySelector('.weekgrid')).toBe(true);
          expect(b.acik.length <= 3).toBe(true);
          /* imza bekleyen sözleşme işin kendisidir: açık */
          expect(b.acik.indexOf('haftalık-sözleşme') >= 0).toBe(true);
          expect(b.kucuk.indexOf('haftanın-özeti') >= 0).toBe(true);
          ['plan-tamamlama-geçmişi', 'sınava-kadar', 'plan-ızgarası', 'planın-şekli', 'müfredat-referansı']
            .filter(a => b.var.indexOf(a) >= 0)
            .forEach(a => expect(b.gizli.indexOf(a) >= 0).toBe(true));
          expect(b.acik.filter(a => ['haftalık-sözleşme', 'bugüne-önerilen-blok'].indexOf(a) < 0).join(',')).toBe('');
        }finally{ b.bitir(); }
      });
    });

    it('Hafta: sözleşme imzalanınca o da şerit olur', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const w = R.S.weeks[R.Model.weekId(R.Model.currentWeek())];
        w.signedAt = '2026-10-12T08:00:00';
        const b = await bolumle('week');
        try{
          expect(b.kucuk.indexOf('haftalık-sözleşme') >= 0).toBe(true);
          expect(b.acik.indexOf('haftalık-sözleşme')).toBe(-1);
        }finally{ b.bitir(); w.signedAt = null; }
      });
    });

    it('Program: dört istatistik tek dönen kart; zaman çizgisi bu hafta + üç hafta', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.ui.programTumu = false;
        const b = await bolumle('plan');
        try{
          const d = b.kok.querySelector('.donen[aria-label="Program"]');
          expect(!!d).toBe(true);
          const ust = Array.from(d.querySelectorAll('.donen__ust')).map(x => x.textContent.trim());
          expect(ust.join(',')).toBe('İlerleme,Sınava kalan,Planlanan soru');
          expect(b.kok.textContent.indexOf('Program ilerlemesi')).toBe(-1);
          const cur = R.Model.currentWeek();
          const beklenen = Math.min(R.PLAN.totalWeeks, cur + 3) - cur + 1;
          const satir = Array.from(b.kok.querySelectorAll('.tlweek')).map(x => Number(x.dataset.n));
          expect(satir.length).toBe(beklenen);
          expect(satir[0]).toBe(cur);
          expect(!!b.kok.querySelector('[data-act="program-tumu"]')).toBe(true);
          expect(b.gizli.indexOf('çalışma-yoğunluğu') >= 0).toBe(true);
          expect(b.acik.length <= 3).toBe(true);
          expect(b.acik.indexOf('sıradaki-haftalar') >= 0).toBe(true);
        }finally{ b.bitir(); }
      });
    });

    it('Program: «Tüm program» kırk haftanın tamamını açar, tekrar basınca kapanır', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const cizim = R.App.render;
        R.App.render = () => {};
        try{
          R.S.ui.programTumu = false;
          await R.Screens.plan.handle['program-tumu']();
          expect(R.S.ui.programTumu).toBe(true);
          const k = document.createElement('div');
          k.innerHTML = String(await R.Screens.plan.render());
          expect(k.querySelectorAll('.tlweek').length).toBe(R.PLAN.totalWeeks);
          expect(k.textContent).toContain('Yalnız sıradaki haftalar');
          await R.Screens.plan.handle['program-tumu']();
          expect(R.S.ui.programTumu).toBe(false);
        }finally{ R.App.render = cizim; R.S.ui.programTumu = false; }
      });
    });

    it('Program: varsayılan sınav tarihi tahmin etiketiyle gelir', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const eski = R.S.profile.examTytISO;
        try{
          R.S.profile.examTytISO = R.PROGRAM.examTytISO;
          const k = document.createElement('div');
          k.innerHTML = String(await R.Screens.plan.render());
          expect(k.querySelector('.donen').textContent).toContain('tahmini tarih');
        }finally{ R.S.profile.examTytISO = eski; }
      });
    });

    it('Hedefler: dönen kart; açık yalnız hedef katmanı; kesinlik satırı ve medyan tekrarı yok', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const exams = R.S.exams;
        R.S.exams = [];
        const b = await bolumle('target');
        try{
          const d = b.kok.querySelector('.donen[aria-label="Hedef"]');
          expect(!!d).toBe(true);
          const ust = Array.from(d.querySelectorAll('.donen__ust')).map(x => x.textContent.trim());
          expect(ust.slice(0, 2).join(',')).toBe('Ana hedef,Tahmini sıra');
          /* az denemede sıra sayı değil cümle */
          expect(d.textContent).toContain('Tahmin için 3 tam deneme gerekir.');
          expect(b.kok.textContent.indexOf('TYT medyanı')).toBe(-1);
          expect(b.kok.textContent.indexOf('Puan yerine başarı sırası izlenir')).toBe(-1);
          expect(b.acik.join(',')).toBe('hedef-katmanları');
          ['net-matrisi', 'tercih-mimarisi', 'obp-katkısı'].forEach(a => expect(b.kucuk.indexOf(a) >= 0).toBe(true));
          ['tahmini-sıra', 'sıra-referansları', 'yerleşen-profilleri'].forEach(a => expect(b.gizli.indexOf(a) >= 0).toBe(true));
        }finally{ b.bitir(); R.S.exams = exams; }
      });
    });
  });

  describe('iPhone · Faz 2 · Çalışma', () => {

    it('Dersler: üç kapanış sayısı tek dönen kart; açık ders listesi ve konular', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const b = await bolumle('subjects');
        try{
          const d = b.kok.querySelector('.donen[aria-label="Kapanış"]');
          expect(!!d).toBe(true);
          const ust = Array.from(d.querySelectorAll('.donen__ust')).map(x => x.textContent.trim());
          expect(ust.join(',')).toBe('Konu kapanışı,TYT,AYT');
          expect(b.kok.textContent.indexOf('Toplam konu kapanışı')).toBe(-1);
          expect(b.kucuk.indexOf('öncelik-sırası') >= 0).toBe(true);
          const ders = R.SUBJECTS.find(x => x.id === (R.S.ui.subjectOpen || R.SUBJECTS[0].id));
          expect(b.kucuk.indexOf(window.LIFEOS.Gizle.anahtar(ders.name)) >= 0).toBe(true);
          expect(b.gizli.indexOf('sınav-profilleri') >= 0).toBe(true);
          expect(b.acik.indexOf('dersler') >= 0 && b.acik.indexOf('konular') >= 0).toBe(true);
          expect(b.acik.length <= 3).toBe(true);
          /* «emir değil öneri» notu ekranda değil ⓘ'de */
          expect(b.kok.textContent.indexOf('Sıra bir emir değil')).toBe(-1);
          expect(R.HINTS.risk.more).toContain('emir değil');
        }finally{ b.bitir(); }
      });
    });

    it('Soru çöz: dört istatistik dönen kartta; kaynak, oran ve son kayıtlar şerit', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const solved = R.S.solved;
        R.S.solved = [];
        const b = await bolumle('solve');
        try{
          const d = b.kok.querySelector('.donen[aria-label="Çözüm"]');
          expect(!!d).toBe(true);
          /* kayıt yokken oran sayı değil cümle */
          expect(d.textContent).toContain('Henüz kayıt yok.');
          expect(b.var.indexOf('çözüm-kaydı')).toBe(-1);
          ['kaynaklarım', 'çözülen-sorular'].forEach(a => expect(b.kucuk.indexOf(a) >= 0).toBe(true));
          expect(b.acik.length <= 3).toBe(true);
        }finally{ b.bitir(); R.S.solved = solved; }
      });
    });

    it('Tekrar: «Due/Borç» tekrarı yok; gelecek yük, takvim ve defter alanları gizli', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const b = await bolumle('cards');
        try{
          const etiketler = Array.from(b.kok.querySelectorAll('.stat__label')).map(x => x.textContent.trim());
          expect(etiketler.indexOf('Due')).toBe(-1);
          expect(etiketler.indexOf('Borç')).toBe(-1);
          ['tekrar-takvimi', 'defter-alanları'].forEach(a => expect(b.gizli.indexOf(a) >= 0).toBe(true));
          expect(R.App.SADE_GIZLI.cards.indexOf('gelecek-yük') >= 0).toBe(true);
        }finally{ b.bitir(); }
      });
    });
  });
})();

/* iPhone planı · Faz 2d · AYS: kart alt yazısındaki öğreti ⓘ'de (sıkı ölçü). */
(function(){
  const { describe, it, expect, resetState } = R.Test;
  describe('iPhone · Faz 2d · AYS', () => {
    it('Sınama kur ve Kaynaklarım: açıklama cümlesi ekranda değil ⓘ’de', async () => {
      resetState();
      R.S.profile.setupDone = true;
      const sinama = String(await R.Screens.quiz.render());
      expect(sinama.indexOf('Önce cevabı üret')).toBe(-1);
      expect(sinama.indexOf('data-hint="quiz"') >= 0).toBe(true);
      const coz = String(await R.Screens.solve.render());
      expect(coz.indexOf('Zorluk etiketten değil')).toBe(-1);
      expect(R.HINTS.solve.more).toContain('Kaynaklarım');
    });
  });
})();

/* iPhone planı · Faz 3 · Analiz (AYS): İlerleme, Ayrıntılı analiz, Telafi.
   Sıkı ölçü: açık yalnız iş + en çok bir dönen kart; sabit not ⓘ'de. */
(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;

  /* Bölümlü ekranın her bölümü ayrı sayılır (sıkı ölçü): açık en çok üç. */
  function bolumBolum(NS, id, kok){
    const sc = NS.Screens[id], G = window.LIFEOS.Gizle;
    const gizli = (sc.gizliVarsayilan || []).concat(NS.App.SADE_GIZLI[id] || []);
    const kucuk = sc.kucukVarsayilan || [];
    const bl = Array.from(kok.querySelectorAll('section.sayfabolum'));
    return (bl.length ? bl : [kok]).map(b => ({ id:b.id,
      acik:G.bolumler(b).map(x => x.anahtar).filter(a => gizli.indexOf(a) < 0 && kucuk.indexOf(a) < 0) }));
  }

  async function ciz(id){
    const kok = document.createElement('div');
    kok.innerHTML = String(await R.Screens[id].render());
    document.body.appendChild(kok);
    return kok;
  }
  async function hazirla(){
    resetState();
    R.S.profile.setupDone = true;
    await R.Model.ensurePlan(true);
    await R.Model.ensureWeek(R.Model.currentWeek());
    await R.Model.ensureDay(R.U.today());
  }

  describe('iPhone · Faz 3 · Analiz (AYS)', () => {

    it('İlerleme: sekiz KPI tek dönen kart; açık trend ve karar kapısı; başvuru gizli', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const kok = await ciz('progress');
        try{
          expect(kok.querySelector('.kpigrid')).toBeNull();
          const d = kok.querySelector('.donen[aria-label="Gidişat"]');
          expect(!!d).toBe(true);
          expect(d.querySelectorAll('.donen__madde').length >= 8).toBe(true);
          const acik = bolumBolum(R, 'progress', kok)[0].acik;
          expect(acik.length <= 3).toBe(true);
          expect(acik.indexOf('test-bazlı-trend')).toBe(-1);
          ['aylık-net-gelişim-eğrisi', 'kpı-sözlüğü', 'süreç-göstergeleri']
            .forEach(a => expect(R.App.SADE_GIZLI.progress.indexOf(a) >= 0).toBe(true));
          expect(kok.textContent.indexOf('Karar kapısı algoritması')).toBe(-1);
          expect(kok.textContent.indexOf('TYT son 3 medyan')).toBe(-1);
          expect(R.HINTS.gate.more).toContain('Algoritma:');
        }finally{ kok.remove(); }
      });
    });

    it('Telafi: tetik yokken protokoller şerit; iki başvuru listesi gizli', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const kok = await ciz('protocols');
        try{
          const acik = bolumBolum(R, 'protocols', kok)[0].acik;
          const tetik = R.Calc.protocolTriggers().length + R.Model.activeProtocols().length;
          expect(acik.length <= tetik).toBe(true);
          ['motivasyon-ve-dalgalanma', 'sınav-kaygısı'].forEach(a => expect(R.App.SADE_GIZLI.protocols.indexOf(a) >= 0).toBe(true));
          expect(kok.textContent.indexOf('Kural motoru öneri verir')).toBe(-1);
        }finally{ kok.remove(); }
      });
    });

    it('Ayrıntılı analiz: her bölümde açık en çok üç; sabit notlar ⓘ\u2019de', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const kok = await ciz('analytics');
        try{
          bolumBolum(R, 'analytics', kok).forEach(b => expect(b.id + ':' + (b.acik.length <= 3)).toBe(b.id + ':true'));
          ['Toplam net değil, test bazında ne değişti', 'Genel tavsiye değil, senin verin', 'Sistem söylemeden önce sen söyle']
            .forEach(t => expect(kok.textContent.indexOf(t)).toBe(-1));
          expect(R.HINTS.sleep.more).toContain('Genel tavsiye değil');
          expect(R.HINTS['not-iki-denemeyi-yan-yana-koy'].b).toContain('test bazında');
        }finally{ kok.remove(); }
      });
    });

    it('Gösterge ayrışması: önceki pencere sıfırken «%Infinity» değil «sıfırdan»', () => {
      const n = R.Goodhart.ayrismaNotu({ effortLabel:'çalışma dakikası', outcomeLabel:'net' }, Infinity, 0);
      expect(n).toBe('çalışma dakikası sıfırdan başladı, net yerinde saydı.');
      expect(R.Goodhart.ayrismaNotu({ effortLabel:'a', outcomeLabel:'b' }, 0.5, -Infinity).indexOf('Infinity')).toBe(-1);
      expect(R.Goodhart.ayrismaNotu({ effortLabel:'a', outcomeLabel:'b' }, 0.5, -0.25)).toBe('a %50 arttı, b %25 GERİLEDİ.');
    });
  });
})();

/* iPhone planı · Faz 4 · Ofis ve Danışma (AYS): «brifing + tek eylem».
   Masa cümleleri toplantıda, Patron'da ve uzman kartında üç kez yazılıyordu;
   açık yalnız iş, gerisi şerit. Sabit notlar ⓘ'de. */
(function(){
  const { describe, it, expect, resetState } = R.Test;
  async function ciz(id){
    const kok = document.createElement('div');
    kok.innerHTML = String(await R.Screens[id].render());
    document.body.appendChild(kok);
    return kok;
  }
  function acik(id, kok){
    const sc = R.Screens[id], G = window.LIFEOS.Gizle;
    const gizli = (sc.gizliVarsayilan || []).concat(R.App.SADE_GIZLI[id] || []);
    const kucuk = sc.kucukVarsayilan || [];
    return G.bolumler(kok).map(x => x.anahtar).filter(a => gizli.indexOf(a) < 0 && kucuk.indexOf(a) < 0);
  }

  describe('iPhone · Faz 4 · Ofis ve Danışma (AYS)', () => {
    ['office', 'team'].forEach(id => {
      it(id + ': açık en çok üç; sabit not ekranda yok', async () => {
        resetState();
        R.S.profile.setupDone = true;
        await R.Model.ensurePlan(true);
        await R.Model.ensureWeek(R.Model.currentWeek());
        await R.Model.ensureDay(R.U.today());
        const kok = await ciz(id);
        try{
          const a = acik(id, kok);
          expect(id + ':' + a.join(',') + ':' + (a.length <= 3)).toBe(id + ':' + a.join(',') + ':true');
          if(id === 'office'){ expect(kok.querySelector('.board')).toBeNull(); expect(R.Screens.office.kucukVarsayilan.indexOf('uzman-masaları') >= 0).toBe(true); }
          if(id === 'team') expect(kok.textContent.indexOf('Alan dışı soruyu sahibine sor')).toBe(-1);
        }finally{ kok.remove(); }
      });
    });
  });
})();

/* iPhone planı · Faz 5 · Ayarlar (AYS): iOS Ayarlar listesi. İlk görünür
   bölüm açık, gerisi tek satırlık şerit; Rütbe olduğu gibi kalır. */
(function(){
  const { describe, it, expect, resetState } = R.Test;
  describe('iPhone · Faz 5 · Ayarlar (AYS)', () => {
    ['guide', 'profiles'].forEach(id => {
      it(id + ': ilk bölüm açık, gerisi şerit; gizliler gizli kalır', async () => {
        resetState();
        const sc = R.Screens[id];
        const kok = document.createElement('div');
        kok.innerHTML = String(await sc.render());
        document.body.appendChild(kok);
        try{
          const G = window.LIFEOS.Gizle;
          const gizli = (sc.gizliVarsayilan || []).concat(R.App.SADE_GIZLI[id] || []);
          const gorunen = G.bolumler(kok).map(b => b.anahtar).filter(a => gizli.indexOf(a) < 0);
          const serit = R.App.ayarListesi(sc, kok);
          expect(serit.join(',')).toBe(gorunen.slice(1).join(','));
          expect(gorunen.filter(a => serit.indexOf(a) < 0).length <= 1).toBe(true);
        }finally{ kok.remove(); }
      });
    });
    it('Rütbe ayar listesine girmez (olduğu gibi kalır)', () => {
      expect(R.App.ayarListesi({ id:'rutbe' }, document.body).length).toBe(0);
    });
  });
})();

/* iPhone planı · Faz 6 · Kabuk (AYS): başlık çekmecenin adıdır, durum
   cümlesi ⓘ'de; sessiz kipte zincirle gelen rozetler tek bildirim. */
(function(){
  const { describe, it, expect, resetState } = R.Test;
  describe('iPhone · Faz 6 · Kabuk (AYS)', () => {

    /* Kullanıcı (2026-10-02): «Sınama'daysa üstte Sınama yazıyor; hayır,
       Çalışma kalacak, altındaki değişecek». Başlık çekmecenin adıdır; bölüm
       altındaki çubukta seçilidir; durum cümlesi ⓘ'de. */
    it('başlık çekmecenin adı; bölüm çubukta seçili; kural motorunun cümlesi bilgi kartında', () => {
      resetState();
      const sc = R.Screens.quiz;
      const d = document.createElement('div');
      d.innerHTML = String(R.App.sayfaBasiHtml(sc));
      expect(d.querySelector('h1').textContent.trim()).toBe('Çalışma');
      const cumle = sc.headline ? sc.headline() : '';
      if(cumle && cumle !== 'Çalışma') expect(d.querySelector('.bilgikart').textContent).toContain(cumle);
    });

    it('menüde olmayan ayrıntı ekranı kendi adını taşır', () => {
      resetState();
      const sc = R.Screens.topic;
      if(!sc) return;
      const d = document.createElement('div');
      d.innerHTML = String(R.App.sayfaBasiHtml(sc));
      expect(d.querySelector('h1').textContent.trim()).toBe(String(sc.title));
    });

    it('Bugün’ün başlığı «Bugün»; günün cümlesi (004) bilgi kartının ilk satırında', () => {
      resetState();
      const sc = R.Screens.today;
      const d = document.createElement('div');
      d.innerHTML = String(R.App.sayfaBasiHtml(sc));
      expect(d.querySelector('h1').textContent.trim()).toBe('Bugün');
      const cumle = sc.headline ? String(sc.headline()) : '';
      if(cumle && cumle !== 'Bugün'){
        const ilk = d.querySelector('.bilgikart__metin');
        expect(ilk.textContent).toContain(cumle.replace(/<[^>]*>/g, '').trim().slice(0, 12));
        expect(ilk.getAttribute('data-oz')).toBe('004');
      }
    });

    it('zincirle gelen üç rozet tek bildirimdir', async () => {
      const UI = R.UI, eski = UI.toast, gelen = [];
      UI.toast = t => gelen.push(t);
      try{
        ['A', 'B', 'C'].forEach(x => R.App.rozetBildir(x, false));
        await new Promise(r => setTimeout(r, 480));
        expect(gelen.join('|')).toBe('3 yeni rozet — A · +2');
      }finally{ UI.toast = eski; }
    });
  });
})();
