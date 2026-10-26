/* Günü kapat — AYS bağlantısı (KOLAY-PLANI Faz 1; çekirdek brand/ortak/gunukapat.js).

   Depo sahibinin kararları (2026-10-25) ve doktrin (AGENTS §1.1, §1.2, §1.7):
     1. Beyan yalnız bekleyen bloğun «tamamlandı»sı: durum + (boşsa) planlanan
        dakika. «Hepsi doğru» actualQ / correctQ yazmaz; geri al tam geri koyar.
     2. Dokunulmayan ya da işareti kaldırılan satır yazılmaz.
     3. Ölçüm tek satırdan, AYS'nin ayrıştırıcısıyla; satır + beyanlar tek geri al.
     4. Toplam bloklara bölüştürülmez: çok blokta adsız toplam reddedilir.
     5. Alt sayfa Bugün'den açılır; Bugün'ün tek dolu düğmesi kapakta kalır. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const K = () => window.LIFEOS.GUNUKAPAT;
  const G = () => window.LIFEOS.GIRIS;
  const T = () => R.Screens.today.gunuKapat;
  const GUN = '2026-10-12';

  const blok = (id, ek) => Object.assign({ id, slot:'Ana ders', subject:'Matematik', topic:'Türev', targetMin:60, targetQ:20,
    status:'pending', subjectId:null, topicId:null, actualMin:null, actualQ:null, correctQ:null, skipReason:null, startedAt:null }, ek || {});

  /* İki çalışma bloğu + dinlenme; boot koşmaz, kapı ve kutu burada kurulur. */
  async function hazirla(bloklar){
    resetState();
    R.S.profile.setupDone = true;
    await R.Model.ensurePlan(true);
    await R.Model.ensureWeek(R.Model.currentWeek());
    const day = await R.Model.ensureDay(R.U.today());
    day.blocks = bloklar || [
      blok('b0'),
      blok('b1', { slot:'İkinci ders', subject:'Biyoloji', topic:'Hücre', targetMin:45, targetQ:15 }),
      blok('b2', { slot:'Dinlenme', subject:'Dinlenme', topic:'Dinlenme', targetMin:0, targetQ:0 }),
    ];
    day.sleepHours = null; day.paragraphActual = null; day.problemActual = null;
    const bildirilen = [];
    R.App.girisKur();
    R.App.gunuKapatKur({ bildir:(m, g) => bildirilen.push([m, g]), yenile:() => {} });
    return { day, bildirilen };
  }
  function bitir(){
    K()._sifirla();
    G()._sifirla();
    R.UI.closeSheet && R.UI.closeSheet();
    const s = document.getElementById('sheet'); if(s) s.remove();
  }
  /* Ölçüm yazımında öneri kutusu ekranı yeniden çizmeye çalışır; testte çizim yok. */
  async function cizimsiz(fn){
    const eski = R.App.render; R.App.render = () => {};
    try{ return await fn(); }finally{ R.App.render = eski; }
  }
  const kopya = day => JSON.parse(JSON.stringify({ blocks:day.blocks, sleepHours:day.sleepHours,
    paragraphActual:day.paragraphActual, problemActual:day.problemActual, freeQ:day.freeQ, freeCorrect:day.freeCorrect }));

  describe('Günü kapat — AYS', () => {
    it('satırlar: bekleyen blok beyan (plan, dakika), soru/doğru, paragraf, problem, uyku ölçüm; dinlenme yok', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla();
          R.S.days['2026-10-11'] = { date:'2026-10-11', blocks:[], sleepHours:6.5, paragraphActual:12, problemActual:0 };
          day.blocks.push(blok('b3', { topic:'Kimya', subject:'Kimya', status:'done', actualMin:30, actualQ:10, correctQ:7 }));
          day.blocks.push(blok('b4', { topic:'Fizik', subject:'Fizik', startedAt:new Date().toISOString() }));
          const l = T().satirlar(GUN);
          const by = id => l.find(s => s.id === id);
          expect(by('blok:b0').tur).toBe('beyan');
          expect(by('blok:b0').oneri).toEqual({ metin:'tamamlandı · planlanan 60 dk', kaynak:'plan' });
          expect(typeof by('blok:b0').yaz).toBe('function');
          expect(by('blok:b2')).toBe(undefined);
          expect(by('blok:b3').yazildi).toBe(true);
          expect(!!by('blok:b4').oneri).toBe(false);
          expect(by('soru:b0').tur).toBe('olcum');
          expect(by('soru:b0').ipucu).toBe('soru / doğru · plan: 20 soru');
          expect(by('soru:b3').yazildi).toBe(true);
          expect(by('soru:b3').ipucu).toBe('girildi: 10 soru, 7 doğru');
          ['paragraf', 'problem', 'uyku'].forEach(id => expect(by(id).tur).toBe('olcum'));
          expect(by('uyku').ipucu).toContain('son: 6.5 saat');
          expect(by('paragraf').ipucu).toContain('son: 12');
          /* Ölçüm satırının yaz'ı yok, önerisi yok: çekirdek onu asla toplu yazmaz. */
          l.filter(s => s.tur === 'olcum').forEach(s => { expect(!!s.yaz).toBe(false); expect(!!s.oneri).toBe(false); });
          expect(K().yazilacaklar(GUN).map(s => s.id)).toEqual(['blok:b0', 'blok:b1']);
        }finally{ bitir(); }
      });
    });

    it('«Hepsi doğru» yalnız durum ve dakikayı yazar; soru, doğru, uyku, sayaç boş kalır; geri al tam geri koyar', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day, bildirilen } = await hazirla();
          day.blocks[1].actualMin = 20;     /* elle girilmiş dakika korunur */
          const once = kopya(day);
          const r = await K().kapat(GUN, {});
          expect(r.ok).toBe(true);
          expect(day.blocks.map(b => [b.status, b.actualMin, b.actualQ, b.correctQ])).toEqual([
            ['done', 60, null, null], ['done', 20, null, null], ['pending', null, null, null]]);
          expect(day.sleepHours).toBe(null);
          expect(day.paragraphActual).toBe(null);
          expect(typeof bildirilen[0][1]).toBe('function');
          await r.geriAl();
          expect(kopya(day)).toEqual(once);
        }finally{ bitir(); }
      });
    });

    it('plandan gelen dakika «tahmin» etiketlidir; elle düzeltilen «ölçüldü»; HKM’ye öyle gider', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla();
          day.blocks[1].actualMin = 20;     /* etiketsiz eski kayıt ölçüm sayılır */
          const r = await K().kapat(GUN, {});
          expect(day.blocks[0].minCert).toBe('estimated');
          expect(day.blocks[1].minCert == null).toBe(true);
          expect(R.Beacon.collect(GUN).study_minutes).toEqual({ value:80, cert:'estimated' });
          await r.geriAl();
          expect(day.blocks[0].minCert == null).toBe(true);
          const h = R.Screens.today.handle;
          await cizimsiz(() => h['block-status']({ dataset:{ block:'b0', value:'done' } }));
          expect([day.blocks[0].actualMin, day.blocks[0].minCert]).toEqual([60, 'estimated']);
          await cizimsiz(() => R.Screens.today.change['block-num']({ dataset:{ block:'b0', field:'actualMin' }, value:'50' }));
          expect(day.blocks[0].minCert).toBe('measured');
          expect(R.Beacon.collect(GUN).study_minutes).toEqual({ value:70, cert:'measured' });
          await cizimsiz(() => R.Screens.today.change['block-num']({ dataset:{ block:'b0', field:'actualMin' }, value:'' }));
          expect([day.blocks[0].actualMin, day.blocks[0].minCert]).toEqual([null, null]);
          await cizimsiz(() => h['block-kaydir']({ dataset:{ block:'b1', yon:'sag' } }));
          expect(day.blocks[1].minCert == null).toBe(true);   /* 20 dk elle; dokunulmaz */
        }finally{ bitir(); }
      });
    });

    it('işareti kaldırılan blok yazılmaz', async () => {
      await withTodayAsync(GUN, async () => {
        const kap = document.createElement('div');
        try{
          const { day } = await hazirla();
          kap.innerHTML = K().cizim(GUN);
          document.body.appendChild(kap);
          const c = kap.querySelector('[data-gk-sec="blok:b1"]');
          c.checked = false;
          c.dispatchEvent(new Event('change', { bubbles:true }));
          expect(kap.querySelector('[data-gk-sec="soru:b0"]')).toBe(null);
          const r = await K().kapat(GUN, {});
          expect(r.ok).toBe(true);
          expect([day.blocks[0].status, day.blocks[1].status, day.blocks[1].actualMin]).toEqual(['done', 'pending', null]);
        }finally{ kap.remove(); bitir(); }
      });
    });

    it('satır + «Hepsi doğru» birlikte: bloklara adıyla soru/doğru, uyku; tek geri al hepsini geri koyar', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day, bildirilen } = await hazirla();
          const once = kopya(day);
          const r = await cizimsiz(() => R.App.gunuKapat(GUN, 'türev 20 soru 15 doğru, hücre 10 soru 8 doğru, 7 saat uyudum'));
          expect(r.ok).toBe(true);
          expect(day.blocks.slice(0, 2).map(b => [b.status, b.actualMin, b.actualQ, b.correctQ]))
            .toEqual([['done', 60, 20, 15], ['done', 45, 10, 8]]);
          expect(day.sleepHours).toBe(7);
          expect(day.freeQ).toBe(once.freeQ);
          expect(bildirilen.length).toBe(1);
          await cizimsiz(() => r.geriAl());
          expect(kopya(day)).toEqual(once);
        }finally{ bitir(); }
      });
    });

    it('satırdaki soru bloğun durumuna dokunmaz: işareti kaldırılan blok bekliyor kalır', async () => {
      await withTodayAsync(GUN, async () => {
        const kap = document.createElement('div');
        try{
          const { day } = await hazirla();
          kap.innerHTML = K().cizim(GUN);
          document.body.appendChild(kap);
          const c = kap.querySelector('[data-gk-sec="blok:b1"]');
          c.checked = false;
          c.dispatchEvent(new Event('change', { bubbles:true }));
          const r = await cizimsiz(() => R.App.gunuKapat(GUN, 'hücre 10 soru 8 doğru'));
          expect(r.ok).toBe(true);
          expect([day.blocks[1].status, day.blocks[1].actualMin, day.blocks[1].actualQ, day.blocks[1].correctQ]).toEqual(['pending', null, 10, 8]);
        }finally{ kap.remove(); bitir(); }
      });
    });

    it('çok blokta adsız toplam bölüştürülmez: reddedilir, nedeni söylenir, hiçbir şey yazılmaz', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla();
          const once = kopya(day);
          const oneriSayisi = (R.S.officeProposals || []).length;
          for(const t of ['20 soru 15 doğru', '20 soru 15 doğru 7 saat uyudum', 'türev hücre 20 soru', '20 soru 4 yanlış, türev', 'uyku 7']){
            const r = await cizimsiz(() => R.App.gunuKapat(GUN, t));
            expect(r.ok).toBe(false);
            expect(kopya(day)).toEqual(once);
          }
          const r = await R.App.gunuKapat(GUN, '20 soru 15 doğru');
          expect(r.neden).toContain('2 blok var');
          expect(r.neden).toContain('bölüştürmem');
          expect((await R.App.gunuKapat(GUN, '20 soru 15 doğru 7 saat uyudum')).neden).toContain('virgülle ayır');
          expect((R.S.officeProposals || []).length).toBe(oneriSayisi);
          /* Ayrıştırıcının önizlemesi de (çekirdeğin yolu) yazılamaz satırda null. */
          expect(T().onizle('20 soru 15 doğru', GUN)).toBe(null);
        }finally{ bitir(); }
      });
    });

    it('tek blokta adsız soru o bloğa; blok adı yoksa ve ders bloğu yoksa reddedilir', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla([blok('b0')]);
          const r = await cizimsiz(() => R.App.gunuKapat(GUN, '20 soru 15 doğru'));
          expect(r.ok).toBe(true);
          expect([day.blocks[0].actualQ, day.blocks[0].correctQ, day.blocks[0].status]).toEqual([20, 15, 'done']);
          expect(T().denetle('türkçeden 10 soru çözdüm', GUN).red).toContain('blok yok');
          /* Aynı dersin iki bloğu: ders adı bloğu seçmez, reddedilir. */
          day.blocks = [blok('x', { topic:'Türev', subject:'Sayılar', subjectId:'tyt-matematik' }),
            blok('y', { topic:'İntegral', subject:'Problemler', subjectId:'tyt-matematik' })];
          expect(T().denetle('matematikten 10 soru çözdüm', GUN).red).toContain('2 blok var');
          expect(T().denetle('integral 10 soru 8 doğru', GUN).plan[0].blok.id).toBe('y');
        }finally{ bitir(); }
      });
    });

    it('blok adı: tam ad önce, ek alan sözcük, iki bloğa ortak sözcük ad sayılmaz', () => {
      const bl = [blok('a', { topic:'Noktalama', subject:'Haftalık değerlendirme', slot:'Değerlendirme' }),
        blok('b', { topic:'Üslü – köklü sayılar', subject:'Hafif kart (gerekirse)', slot:'Kart' })];
      const ad = t => T().adiGecen(t, bl).map(b => b.id);
      expect(ad('noktalamadan 20 soru')).toEqual(['a']);
      expect(ad('kart 20 soru 15 doğru')).toEqual(['b']);
      expect(ad('üslü köklü 12 soru')).toEqual(['b']);
      expect(ad('20 soru 15 doğru')).toEqual([]);
      const iki = [blok('x', { topic:'Türev', subject:'AYT Matematik' }), blok('y', { topic:'İntegral', subject:'AYT Matematik' })];
      /* «matematik» iki bloğun da sözcüğü: ad sayılmaz (ders yolu da iki blok görür, reddeder). */
      expect(T().adiGecen('matematik 20 soru', iki)).toEqual([]);
      expect(T().adiGecen('integral 20 soru', iki).map(b => b.id)).toEqual(['y']);
    });

    it('alt sayfa Bugün’den açılır; satır formdan gönderilir; Bugün’de tek dolu düğme kalır', async () => {
      await withTodayAsync(GUN, async () => {
        const kap = document.createElement('div');
        try{
          const { day } = await hazirla();
          kap.innerHTML = String(await R.Screens.today.render());
          document.body.appendChild(kap);
          const ac = kap.querySelector('[data-act="gunu-kapat"]');
          expect(!!ac).toBe(true);
          expect(ac.classList.contains('btn--primary')).toBe(false);
          expect(kap.querySelector('[data-act="go"][data-route="gun"]') !== null).toBe(true);
          /* Faz 2: Bugün'ün tek dolu düğmesi kapakta; sayfada dolu düğme yok. */
          expect(kap.querySelectorAll('.btn--primary')).toHaveLength(0);
          expect(!!kap.querySelector('.bugun__alan[aria-label="Gün"] [data-act="gunu-kapat"]')).toBe(true);
          await R.Screens.today.handle['gunu-kapat']();
          const sh = document.getElementById('sheet');
          expect(sh.querySelector('h3').textContent).toBe('Günü kapat');
          expect(!!sh.querySelector('[data-gunukapat] #gk-olcum')).toBe(true);
          expect(sh.querySelectorAll('.btn--primary')).toHaveLength(1);
          expect(sh.querySelector('.gk__kapat').textContent).toContain('Hepsi doğru · kaydet (2)');
          /* Formdan: yakalama evresindeki denetim; reddedilen satırın nedeni alt sayfada. */
          sh.querySelector('#gk-olcum').value = '20 soru 15 doğru';
          sh.querySelector('[data-gk-form]').dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
          expect(sh.querySelector('[data-gk-sonuc]').textContent).toContain('bölüştürmem');
          expect(day.blocks[0].status).toBe('pending');
          sh.querySelector('#gk-olcum').value = 'türev 20 soru 15 doğru, hücre 20 soru 15 doğru, 7 saat uyudum';
          await cizimsiz(async () => {
            sh.querySelector('[data-gk-form]').dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
            for(let i = 0; i < 50 && day.sleepHours !== 7; i++) await new Promise(r => setTimeout(r, 20));
          });
          expect(day.blocks.slice(0, 2).map(b => [b.status, b.actualQ, b.correctQ])).toEqual([['done', 20, 15], ['done', 20, 15]]);
          expect(day.sleepHours).toBe(7);
        }finally{ kap.remove(); bitir(); }
      });
    });

    it('blok o arada başka yoldan yazıldıysa beyan atlanır, yazılmış sayılmaz', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla();
          const s = T().satirlar(GUN).find(x => x.id === 'blok:b0');
          Object.assign(day.blocks[0], { status:'done', actualMin:50, minCert:'measured' });
          expect(await s.yaz(GUN)).toEqual({ atlandi:true });
          expect([day.blocks[0].actualMin, day.blocks[0].minCert]).toEqual([50, 'measured']);
        }finally{ bitir(); }
      });
    });

    it('ölçüm satırı yarıda patlarsa bloklara yazılan soru da, uygulanan öneri de geri alınır', async () => {
      await withTodayAsync(GUN, async () => {
        const K_ = R.Komut, eskiOnay = K_.onayla, eskiSave = R.Model.saveDay;
        try{
          const { day } = await hazirla();
          const once = kopya(day);
          const uygulanan = () => (R.S.officeProposals || []).filter(p => p.status === 'applied').length;
          const n = uygulanan();
          K_.onayla = async ids => { await eskiOnay(ids); throw new Error('patladı'); };
          const r = await cizimsiz(() => R.App.gunuKapat(GUN, 'türev 20 soru 15 doğru, 7 saat uyudum'));
          expect(r.ok).toBe(false);
          expect(kopya(day)).toEqual(once);
          expect(uygulanan()).toBe(n);
          K_.onayla = eskiOnay;
          let ilk = true;
          R.Model.saveDay = async g => { if(ilk){ ilk = false; throw new Error('disk'); } return eskiSave(g); };
          const r2 = await cizimsiz(() => R.App.gunuKapat(GUN, 'türev 20 soru 15 doğru'));
          expect(r2.ok).toBe(false);
          expect(kopya(day)).toEqual(once);
        }finally{ K_.onayla = eskiOnay; R.Model.saveDay = eskiSave; bitir(); }
      });
    });

    it('tahmin dakikalı bloğa yazılan süre tahminin yerine geçer, «ölçüldü» olur; geri al ikisini geri koyar', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const mat = (R.SUBJECTS || []).find(x => (x.aliases || []).indexOf('matematik') >= 0);
          const { day } = await hazirla([blok('b0', { subject:mat.name, subjectId:mat.id, status:'done', actualMin:60, minCert:'estimated' })]);
          const b = day.blocks[0];
          const yaz = dk => R.Proposals.hemen({ action:'sure-yaz', params:{ date:GUN, minutes:dk, subjectId:mat.id } });
          const a = await yaz(50);
          expect([b.actualMin, b.minCert, b.status]).toEqual([50, 'measured', 'done']);
          expect(R.Beacon.collect(GUN).study_minutes).toEqual({ value:50, cert:'measured' });
          await R.Proposals.undo(a.row.id);
          expect([b.actualMin, b.minCert]).toEqual([60, 'estimated']);
          /* zincir: önce yerine geçen, sonra eklenen; hangi sırayla geri alınırsa alınsın */
          const c = await yaz(50), e = await yaz(20);
          expect([b.actualMin, b.minCert]).toEqual([70, 'measured']);
          await R.Proposals.undo(c.row.id);
          expect([b.actualMin, b.minCert]).toEqual([20, 'measured']);
          await R.Proposals.undo(e.row.id);
          expect([b.actualMin, b.minCert]).toEqual([60, 'estimated']);
          const f = await yaz(50), g = await yaz(20);
          await R.Proposals.undo(g.row.id);
          expect([b.actualMin, b.minCert]).toEqual([50, 'measured']);
          await R.Proposals.undo(f.row.id);
          expect([b.actualMin, b.minCert]).toEqual([60, 'estimated']);
          /* ölçülmüş blokta eskisi gibi eklenir */
          Object.assign(b, { actualMin:20, minCert:null });
          const h = await yaz(30);
          expect([b.actualMin, b.minCert]).toEqual([50, 'measured']);
          await R.Proposals.undo(h.row.id);
          expect([b.actualMin, b.minCert]).toEqual([20, null]);
        }finally{ bitir(); }
      });
    });

    it('tahmin dakika içeren çalışma süresi «ölçüldü» diye gösterilmez (sürtünme, son 7 gün kartı)', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla();
          R.S.usage = { days:{ [GUN]:{ date:GUN, adminMs:8 * 60000, ticks:16 } } };
          Object.assign(day.blocks[0], { status:'done', actualMin:60, minCert:'estimated' });
          Object.assign(day.blocks[1], { status:'done', actualMin:200, minCert:'measured' });
          expect(R.Friction.day(GUN).cert).toBe('estimated');
          expect(R.Friction.verdict(1).cert).toBe('estimated');
          expect(R.App.calismaYuku().kartlar[0].etiket).toBe('tahmin');
          day.blocks[0].minCert = 'measured';
          expect(R.Friction.day(GUN).cert).toBe('measured');
          expect(R.Friction.verdict(1).cert).toBe('measured');
          expect(R.App.calismaYuku().kartlar[0].etiket).toBe('ölçüldü');
        }finally{ bitir(); }
      });
    });

    /* 2026-10-26: ölçüm satırlarında boş sayı kutuları (çekirdeğin alanlar'ı).
       Kutu ön doldurulmaz; boş kutu yazılmaz; metin AYS ayrıştırıcısından geçer. */
    it('ölçüm satırları boş kutularla: blokta soru + doğru, paragraf / problem / uyku birer kutu', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          await hazirla();
          R.S.days['2026-10-11'] = { date:'2026-10-11', blocks:[], sleepHours:6.5 };
          const k = document.createElement('div');
          k.innerHTML = K().cizim(GUN);
          const kutu = id => Array.from(k.querySelectorAll('[data-gk-alan^="' + id + ':"]'));
          expect(kutu('soru:b0').map(i => i.getAttribute('aria-label'))).toEqual(['Türev soru', 'Türev doğru']);
          expect(kutu('soru:b1')).toHaveLength(2);
          expect(kutu('soru:b2')).toHaveLength(0);
          ['paragraf', 'problem', 'uyku'].forEach(id => expect(kutu(id)).toHaveLength(1));
          k.querySelectorAll('[data-gk-alan]').forEach(i => {
            expect(i.value).toBe('');
            expect(/^\d/.test(i.getAttribute('placeholder'))).toBe(false);   /* ipucu değer gibi görünmez */
          });
          expect(kutu('uyku')[0].getAttribute('placeholder')).toBe('son 6.5');
          expect(kutu('soru:b0')[0].getAttribute('placeholder')).toBe('plan 20');
        }finally{ bitir(); }
      });
    });

    it('kutular: soru / doğru yalnız kendi bloğuna, uyku sleepHours; boş kutu yazmaz; tek geri al', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla();
          const once = kopya(day);
          const r = await cizimsiz(() => K().kapat(GUN, { alanlar:{ 'soru:b1:0':'20', 'soru:b1:1':'15', 'uyku:0':'7,5', 'paragraf:0':' ' } }));
          expect(r.ok).toBe(true);
          expect(day.blocks.map(b => [b.actualQ, b.correctQ])).toEqual([[null, null], [20, 15], [null, null]]);
          expect(day.sleepHours).toBe(7.5);
          expect([day.paragraphActual, day.problemActual]).toEqual([null, null]);
          await cizimsiz(() => r.geriAl());
          expect(kopya(day)).toEqual(once);
          /* yalnız soru: doğru boş kalır; paragraf ve problem kutusu */
          const r2 = await cizimsiz(() => K().kapat(GUN, { alanlar:{ 'soru:b0:0':'12', 'paragraf:0':'14', 'problem:0':'6' } }));
          expect(r2.ok).toBe(true);
          expect([day.blocks[0].actualQ, day.blocks[0].correctQ, day.blocks[1].actualQ]).toEqual([12, null, null]);
          expect([day.paragraphActual, day.problemActual]).toEqual([14, 6]);
          await cizimsiz(() => r2.geriAl());
          expect(kopya(day)).toEqual(once);
        }finally{ bitir(); }
      });
    });

    it('kutular: yalnız doğru ya da sayı olmayan değer reddedilir, nedeni söylenir, hiçbir şey yazılmaz', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla();
          const once = kopya(day);
          const r = await cizimsiz(() => K().kapat(GUN, { alanlar:{ 'soru:b0:1':'9' } }));
          expect(r.ok).toBe(false);
          expect(kopya(day)).toEqual(once);
          const r2 = await cizimsiz(() => R.App.gunuKapat(GUN, '', { 'soru:b0:1':'9', 'uyku:0':'7' }));
          expect(r2.ok).toBe(false);
          expect(r2.neden).toContain('kaç soru');
          expect(kopya(day)).toEqual(once);
          const r3 = await cizimsiz(() => K().kapat(GUN, { alanlar:{ 'uyku:0':'yedi' } }));
          expect(r3.neden).toContain('sayı değil');
          expect(kopya(day)).toEqual(once);
        }finally{ bitir(); }
      });
    });

    it('kutular: adı ölçüm sözcüğü olan blok («Paragraf») da yalnız kendi sorusunu alır; formdan da gider', async () => {
      await withTodayAsync(GUN, async () => {
        const kap = document.createElement('div');
        try{
          const { day } = await hazirla([blok('b0'), blok('p', { slot:'İkinci ders', subject:'Türkçe', topic:'Paragraf', targetQ:15 })]);
          const r = await cizimsiz(() => K().kapat(GUN, { alanlar:{ 'soru:p:0':'10', 'soru:p:1':'8' } }));
          expect(r.ok).toBe(true);
          expect([day.blocks[1].actualQ, day.blocks[1].correctQ, day.blocks[0].actualQ, day.paragraphActual]).toEqual([10, 8, null, null]);
          await cizimsiz(() => r.geriAl());
          kap.innerHTML = K().cizim(GUN);
          document.body.appendChild(kap);
          kap.querySelector('[data-gk-alan="soru:b0:0"]').value = '20';
          kap.querySelector('[data-gk-alan="soru:b0:1"]').value = '15';
          await cizimsiz(async () => {
            kap.querySelector('[data-gk-form]').dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
            for(let i = 0; i < 50 && day.blocks[0].actualQ == null; i++) await new Promise(res => setTimeout(res, 20));
          });
          expect([day.blocks[0].actualQ, day.blocks[0].correctQ, day.blocks[1].actualQ]).toEqual([20, 15, null]);
        }finally{ kap.remove(); bitir(); }
      });
    });

    it('kurulmadıysa Bugün’de «Günü kapat» düğmesi yok', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          await hazirla();
          bitir();
          const h = String(await R.Screens.today.render());
          expect(h.indexOf('data-act="gunu-kapat"') < 0).toBe(true);
        }finally{ bitir(); }
      });
    });
  });
  /* AGENTS §1.2: girilmemiş sayaç boştur, 0 değil. Yeni gün 0 ile açılıyordu:
     Günü düzenle «0 / 18» gösteriyor, Günü kapat gerçek 0'ı girilmiş sayamıyordu. */
  describe('Girilmemiş sayaç boştur, sıfır değil — AYS', () => {
    it('yeni gün boş açılır; ekran «—» der; gerçek 0 girilmiş sayılır; geri al boşa döner', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla();
          const yeni = await R.Model.ensureDay('2026-10-13');
          ['paragraphActual', 'problemActual', 'freeQ', 'freeCorrect'].forEach(k => expect(yeni[k]).toBe(null));
          const h = String(await cizimsiz(() => R.Screens.gun.render()));
          expect(h.indexOf('aria-live="polite">—<') >= 0).toBe(true);
          const by = id => T().satirlar(GUN).find(s => s.id === id);
          expect(by('paragraf').yazildi).toBe(false);
          day.problemActual = 0;
          expect(by('problem').yazildi).toBe(true);
          expect(by('problem').ipucu).toBe('girildi: 0');
          await R.Beacon.save({ level:'gelismis' });
          expect(R.Beacon.collect(GUN).paragraph_done).toEqual({ value:null, cert:'missing' });
          await R.Beacon.save({ level:'ozet' });
          const a = await R.Proposals.hemen({ action:'paragraf-yaz', params:{ date:GUN, count:10 } });
          expect(day.paragraphActual).toBe(10);
          await R.Proposals.undo(a.row.id);
          expect(day.paragraphActual).toBe(null);
        }finally{ bitir(); }
      });
    });
  });
  /* 2026-10-25 depo sahibi: rozet sayacı ve «günde N saat çalışma»
     alışkanlığı yalnız ölçülmüş dakikayı sayar; plandan gelen tahmin girmez. */
  describe('Sayaçlar yalnız ölçülmüş dakikayı sayar — AYS', () => {
    it('rozet dakikası ve alışkanlık dakikası tahmini blok dakikasını saymaz', async () => {
      await withTodayAsync(GUN, async () => {
        try{
          const { day } = await hazirla();
          day.blocks[0].actualMin = 60; day.blocks[0].minCert = 'estimated';
          day.blocks[1].actualMin = 25; day.blocks[1].minCert = 'measured';
          expect(R.BasarimSayim.gunluk(GUN).dakika).toBe(25);
          expect(R.Hedefler.olculenDakika(GUN)).toBe(25);
          day.blocks[1].actualMin = null; day.blocks[1].minCert = null;
          expect(R.BasarimSayim.gunluk(GUN).dakika).toBe(0);
          expect(R.Hedefler.olculenDakika(GUN)).toBe(null);
        }finally{ bitir(); }
      });
    });
  });
})();
