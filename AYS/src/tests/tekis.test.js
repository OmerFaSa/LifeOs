/* BİR BÖLÜM, BİR İŞ (kullanıcı, 2026-11-06: «bir bölümde birden fazla özellik olduğundan
   anlaşılmıyor»). Karmaşık ekranlar katlara ayrıldı (belgeler/ekip/sadelik/ays.md).
   Sözler: açılan katta en çok bir dolu düğme; taşınan hiçbir eylem kaybolmaz; karar ya da
   imza bekleyen kat seçicide görünür; sekme çubuğu ekrandan ekrana yer değiştirmez;
   zaten ekrandaki bölüme geçmek sayfayı oynatmaz. */
(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;

  async function hazirla(){
    resetState();
    R.S.profile.setupDone = true;
    await R.Model.ensurePlan(true);
    await R.Model.ensureWeek(R.Model.currentWeek());
    await R.Model.ensureDay(R.U.today());
  }
  async function ciz(id){
    const kok = document.createElement('div');
    kok.innerHTML = String(await R.Screens[id].render());
    document.body.appendChild(kok);
    return kok;
  }

  /* ekran: { kat: o katta bulunması gereken eylem ya da seçici } */
  const EKRAN = {
    progress:{ ilk:'ozet', katlar:{ netler:'#bl-netler > :not(h2)', yol:'#bl-yol > :not(h2)' } },
    week:{ ilk:'gunler', katlar:{ sozlesme:'#bl-sozlesme [data-act="week-sign"]', ozet:'#bl-ozet > :not(h2)' } },
    subjects:{ ilk:'konular', katlar:{ konular:'#bl-konular [data-act="open-subject"]', genel:'#bl-genel > :not(h2)' } },
    exams:{ ilk:'liste', katlar:{ liste:'#bl-liste [data-act="exam-filter"]', ozet:'#bl-ozet .ladder' } },
    /* Test sayfasında model yok: önce işe yarayan «Kaydet» açılır. */
    solve:{ ilk:'kayit', katlar:{ kayit:'#bl-kayit #q-hizli-kutu', sor:'#bl-sor > :not(h2)', kaynak:'#bl-kaynak > :not(h2)' } },
    team:{ ilk:'sohbet', katlar:{ rapor:'#bl-rapor [data-act="team-brief"], #bl-rapor .finding', ekip:'#bl-ekip [data-act="team-agent"]' } },
    office:{ ilk:'ozet', katlar:{ ozet:'#bl-ozet [data-act="office-meet"]', uzmanlar:'#bl-uzmanlar .desks' } },
    gelecek:{ ilk:'tahmin', katlar:{ deney:'#bl-deney [data-act="deney-baslat"]' } },
  };

  describe('Bir bölüm, bir iş', () => {
    Object.keys(EKRAN).forEach(id => {
      it(id + ': tek kat açık, en çok bir dolu düğme, taşınan parçalar yerinde', async () => {
        await withTodayAsync('2026-10-12', async () => {
          await hazirla();
          const kok = await ciz(id);
          try{
            const e = EKRAN[id];
            const acik = kok.querySelectorAll('.sayfabolum.is-on');
            expect(acik.length).toBe(1);
            expect(acik[0].id).toBe('bl-' + e.ilk);
            expect(kok.querySelectorAll('.sayfabolum').length >= 2).toBe(true);
            expect(id + ':' + (acik[0].querySelectorAll('.btn--primary').length <= 1)).toBe(id + ':true');
            Object.keys(e.katlar).forEach(k => expect(id + '/' + k + ':' + !!kok.querySelector(e.katlar[k])).toBe(id + '/' + k + ':true'));
          }finally{ kok.remove(); }
        });
      });
    });

    it('İlerleme: aylık karar gizli kalmaz: bekliyorsa seçicide rozet, karar verilince rozet yok', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const gate = R.Calc.currentGate();
        if(!gate) return;   /* bu ayın kapısı yoksa kat da yok */
        let kok = await ciz('progress');
        try{
          expect(!!kok.querySelector('#bl-karar [data-act="save-decision"]')).toBe(true);
          expect(!!kok.querySelector('[data-act="progress-tab"][data-tab="karar"] .bolumcubugu__rozet')).toBe(true);
        }finally{ kok.remove(); }
        const k = R.U.monthKey(R.U.today());
        R.S.decisions[k] = { month:gate.month, action:'x', window:'', reevaluateAt:'2026-11-02' };
        kok = await ciz('progress');
        try{
          expect(!!kok.querySelector('[data-act="progress-tab"][data-tab="karar"] .bolumcubugu__rozet')).toBe(false);
        }finally{ kok.remove(); delete R.S.decisions[k]; }
      });
    });

    it('Ekranın düğmesi sayfa başında durmaz: sekme çubuğu yer değiştirmez', async () => {
      await hazirla();
      ['exams', 'cards', 'office', 'learn'].forEach(id => {
        expect(id + ':' + (String(R.App.sayfaBasiHtml(R.Screens[id])).indexOf('data-act') >= 0
          && String(R.App.sayfaBasiHtml(R.Screens[id])).indexOf('btn') >= 0)).toBe(id + ':false');
      });
    });

    it('Deneme yokken tek dolu düğme listenin içinde: başta ikinci «Deneme ekle» durmaz', async () => {
      await hazirla();
      expect(String(R.Screens.exams.actions()).indexOf('new-exam')).toBe(-1);
      expect(String(R.Screens.exams.actions()).indexOf('run-open') >= 0).toBe(true);
    });

    it('Çalışma sekmeleri günlük kullanım sırasıyla, adlar işi söyler', () => {
      const ad = (cek, id) => R.App.NAV.find(g => g.id === cek).items.find(i => i.id === id).label;
      expect(R.App.NAV.find(g => g.id === 'calisma').items.map(i => i.id).join(',')).toBe('cards,solve,exams,subjects,quiz');
      expect(ad('calisma', 'subjects')).toBe('Konu takibi');
      expect(ad('calisma', 'quiz')).toBe('Kendini sına');
      expect(ad('analiz', 'gelecek')).toBe('Tahmin');
      expect(ad('analiz', 'analytics')).toBe('Neden?');
      /* Konular ile Adım adım birleşti: ikinci başlama yolu sekme değil, Konular'dan açılır; açıkken Öğren seçili. */
      expect(R.App.NAV.find(g => g.id === 'ogren').items.some(i => i.id === 'ogrenme')).toBe(false);
      expect(ad('ofis', 'office')).toBe('Ekip özeti');
      expect(ad('ofis', 'team')).toBe('Uzmana sor');
    });

    it('İlerleme konuşur: karar, sonra ilk deneme, sonra düşen net (sayı Calc\u2019tan)', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const C = R.Calc, es = { g:C.currentGate, f:C.fullExams, t:C.medianTrend };
        const baslik = async () => { const kok = await ciz('progress');
          const n = kok.querySelector('#bl-ozet .nextup__title'); const m = n ? n.textContent : ''; const b = kok.querySelector('#bl-ozet .nextup__why');
          const w = b ? b.textContent : ''; kok.remove(); return { m, w }; };
        try{
          C.currentGate = () => ({ month:'Ekim', note:'not', tyt:[1, 2], tytSafe:[1, 2] });
          /* Veri yoksa karar da konuşmaz: önce ilk adım (rozet yine Aylık karar'da). */
          C.fullExams = () => [];
          expect((await baslik()).m).toBe('İlk tam denemeni gir');
          C.fullExams = () => [{}];
          expect((await baslik()).m).toBe('Bu ayın kararı bekliyor');
          C.currentGate = () => null;
          C.medianTrend = () => ({ delta:-2, last3:40, prev3:42, series:[] });
          const d = await baslik();
          expect(d.m).toBe('Son 3 deneme, önceki 3 denemeden düşük');
          expect(d.w).toContain('hesaplandı');
          C.medianTrend = () => ({ delta:null, last3:null, series:[] });
          expect((await baslik()).m).toBe('');
        }finally{ C.currentGate = es.g; C.fullExams = es.f; C.medianTrend = es.t; }
      });
    });

    it('Hafta konuşur: imza yoksa Günler\u2019in başında; imzalanınca susar; değerlendirme günü onu söyler', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const w = R.S.weeks[R.Model.weekId(R.Model.currentWeek())];
        let kok = await ciz('week');
        try{ expect(kok.querySelector('#bl-gunler .nextup [data-act="week-tab"][data-tab="sozlesme"]') != null).toBe(true); }finally{ kok.remove(); }
        w.signedAt = '2026-10-12T08:00:00';
        kok = await ciz('week');
        try{ expect(kok.querySelector('#bl-gunler .nextup')).toBeNull(); }finally{ kok.remove(); }
        w.signedAt = null;
      });
    });

    it('Deneme: analiz borcu listenin başında, ekranda tek dolu düğme', async () => {
      await hazirla();
      const C = R.Calc, eski = C.analysisDebt;
      C.analysisDebt = () => [{ id:'e2', date:'2026-10-11', family:'TYT' }, { id:'e1', date:'2026-10-04', family:'TYT' }];
      const kok = await ciz('exams');
      try{
        const b = kok.querySelector('#bl-liste .nextup [data-act="open-exam"]');
        expect(b.getAttribute('data-id')).toBe('e1');   /* en eskisi önce */
        expect(String(R.Screens.exams.actions()).indexOf('btn--primary')).toBe(-1);
      }finally{ kok.remove(); C.analysisDebt = eski; }
    });

    it('Konu takibi: sıradaki konu risk sırasından; bekleyen ölçüm varsa onun kartı konuşur', async () => {
      await hazirla();
      const C = R.Calc, es = { r:C.riskRanking, p:C.pendingSecondChecks };
      try{
        C.pendingSecondChecks = () => [];
        C.riskRanking = () => [{ topicName:'Üslü sayılar', subjectName:'TYT', subjectId:'s', topicId:'t', state:'not_started', score:1, tone:'warn', label:'x', band:'x' }];
        let kok = await ciz('subjects');
        expect(kok.querySelector('#bl-konular .nextup__title').textContent).toBe('Üslü sayılar');
        kok.remove();
        C.riskRanking = () => [];
        kok = await ciz('subjects');
        expect(kok.querySelector('#bl-konular .nextup')).toBeNull();
        kok.remove();
      }finally{ C.riskRanking = es.r; C.pendingSecondChecks = es.p; }
    });

    it('Boş ekran ilk adımı söyler: tek düğme, boş form ve boş grafik yok', async () => {
      await hazirla();
      const kok = await ciz('quiz');
      try{
        expect(kok.querySelector('[data-act="quiz-start"]')).toBeNull();
        expect(kok.querySelector('[data-act="next-action"][data-next="new-card"]') != null).toBe(true);
      }finally{ kok.remove(); }
      expect(String(R.Screens.cards.actions())).toBe('');
      expect(String(R.Screens.learn.actions())).toBe('');
      const an = await ciz('analytics');
      try{ expect(an.textContent.indexOf('Bu haftanın birikimi')).toBe(-1); }finally{ an.remove(); }
      const ge = await ciz('gelecek');
      try{ expect(ge.querySelector('[data-act="next-action"][data-next="new-exam"]') != null).toBe(true); }finally{ ge.remove(); }
    });

    it('Konular adım adım öğrenmeyi açar; açıkken Öğren › Konular seçili kalır', async () => {
      await hazirla();
      const h = String(await R.Screens.ogren.render());
      expect(h.indexOf('data-om-git="ana"') >= 0).toBe(true);
      expect(R.App.UST.ogrenme).toBe('ogren');
    });

    it('İlerleme › Özet: tekrar borcu bir kez (dönen göstergelerde yok)', async () => {
      await hazirla();
      const kok = await ciz('progress');
      try{
        const donen = kok.querySelector('#bl-ozet .donen[data-donen]');
        expect(!!donen).toBe(true);
        expect(donen.textContent.indexOf('Tekrar borcu')).toBe(-1);
      }finally{ kok.remove(); }
    });

    it('Ekrandaki bölüme geçmek sayfayı oynatmaz; ekran dışındakine kayar', () => {
      const kok = document.createElement('div');
      kok.innerHTML = String(R.C.SayfaBolumleri({ act:'tekis-deneme', bolumler:[
        { id:'tk-a', ad:'A', govde:'a' }, { id:'tk-b', ad:'B', govde:'b' }] }));
      document.body.appendChild(kok);
      try{
        const b = kok.querySelector('#bl-tk-b');
        let kayan = 0;
        b.scrollIntoView = () => { kayan++; };
        b.getBoundingClientRect = () => ({ top:300 });
        expect(R.C.bolumeGit('tk-b')).toBe(true);
        expect(b.classList.contains('is-on')).toBe(true);
        expect(kayan).toBe(0);
        b.getBoundingClientRect = () => ({ top:10 });
        R.C.bolumeGit('tk-b');
        expect(kayan).toBe(1);
      }finally{ kok.remove(); }
    });
  });
})();
