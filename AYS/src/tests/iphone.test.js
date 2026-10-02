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
