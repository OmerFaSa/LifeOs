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
    solve:{ ilk:'sor', katlar:{ kayit:'#bl-kayit #q-hizli-kutu' } },
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
