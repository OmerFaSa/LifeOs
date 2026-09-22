/* Plan istisnalari — temel plan + tarihli istisna.

   «Sadece gelecek hafta gunde 4 saat», «bu hafta ara» gibi degisiklikler
   TEMEL plani ezmez: bitis tarihi olan bir istisna olarak durur ve
   tarihi gecince plan kendiliginden temele doner. Bu paketin kanitladigi
   uc sey:

     1. istisna yalniz kendi araligindaki gunleri etkiler,
     2. ILERLEMESI BASLAMIS gune hic dokunulmaz (gercek ilerleme kaybolmaz),
     3. ara gunu «kacirilmis gun» ya da «tutmayan hedef» gibi gorunmez. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const I = R.Istisna, M = R.Model, S = R.S, P = R.Proposals;

  const TODAY = '2026-11-10';     // Sali
  const CAR = '2026-11-11', PER = '2026-11-12', CUM = '2026-11-13';
  const CMT = '2026-11-14', PAZ = '2026-11-15', PZT = '2026-11-16';

  function reset(){
    resetState();
    S.istisnalar = [];
    S.officeProposals = [];
    S.officeProposalKeys = [];
    S.office = null;
  }
  function calismaDakikasi(day){
    return day.blocks.filter(b => b.slot !== 'Dinlenme')
      .reduce((a, b) => a + (Number(b.targetMin) || 0), 0);
  }
  async function taze(iso){
    delete S.days[iso];
    await R.Store.remove('days/' + iso);
    return await M.ensureDay(iso);
  }

  describe('İstisna — ara', () => {
    it('aradaki gün boş gelir, aralık dışı normal kalır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const r = await I.ekle({ tur:'ara', from:CAR, to:PER, neden:'Hastayım' });
        expect(r.ok).toBeTruthy();
        const car = await taze(CAR);
        expect(car.blocks).toHaveLength(0);
        expect(car.ara).toBe(true);
        expect(car.paragraphTarget).toBe(0);
        expect(car.problemTarget).toBe(0);
        const cum = await taze(CUM);
        expect(cum.blocks.length > 0).toBeTruthy();
        expect(!!cum.ara).toBe(false);
      });
    });

    it('boş ara günü yeniden yüklenince doldurulmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await I.ekle({ tur:'ara', from:CAR, to:CAR });
        await taze(CAR);
        delete S.days[CAR];          // diskten yeniden okunur
        const again = await M.ensureDay(CAR);
        expect(again.blocks).toHaveLength(0);
      });
    });

    it('ilerlemesi başlamış güne dokunulmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const day = await taze(TODAY);
        day.blocks[0].actualMin = 30;
        await M.saveDay(TODAY);
        const r = await I.ekle({ tur:'ara', from:TODAY, to:PER });
        expect(r.korunan).toEqual([TODAY]);
        expect(S.days[TODAY].blocks.length > 0).toBeTruthy();
        expect(S.days[TODAY].blocks[0].actualMin).toBe(30);
      });
    });

    it('önceden açılmış ama dokunulmamış gün yeniden kurulur', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await taze(CAR);
        const r = await I.ekle({ tur:'ara', from:CAR, to:CAR });
        expect(r.yenilenen).toEqual([CAR]);
        expect(S.days[CAR].blocks).toHaveLength(0);
      });
    });

    it('arayı bitirmek geçmiş ara günlerini korur, bugünden sonrasını açar', async () => {
      reset();
      await withTodayAsync('2026-11-09', async () => {
        await I.ekle({ tur:'ara', from:'2026-11-09', to:CUM });
      });
      await withTodayAsync(PER, async () => {
        const id = I.liste()[0].id;
        const r = await I.bitir(id);
        expect(r.ok).toBeTruthy();
        const kayit = I.liste()[0];
        expect(kayit.to).toBe(CAR);                   // dün
        expect(!!I.gunIcin(TODAY)).toBe(true);        // geçmiş ara günü hâlâ ara
        expect(I.gunIcin(PER)).toBe(null);            // bugün artık ara değil
        expect((await taze(PER)).blocks.length > 0).toBeTruthy();
      });
    });

    it('henüz başlamamış arayı bitirmek onu tamamen kaldırır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const r = await I.ekle({ tur:'ara', from:CAR, to:PER });
        await I.bitir(r.id);
        expect(I.liste()).toHaveLength(0);
      });
    });

    it('istisna kaldırılınca günler temel plana döner', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const r = await I.ekle({ tur:'ara', from:CAR, to:PER });
        await taze(CAR);
        await I.kaldir(r.id);
        expect(S.days[CAR].blocks.length > 0).toBeTruthy();
        expect(!!S.days[CAR].ara).toBe(false);
        expect(I.liste()).toHaveLength(0);
      });
    });
  });

  describe('İstisna — geçici süre', () => {
    it('ders günü istenen dakikaya ölçeklenir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await I.ekle({ tur:'sure', from:CAR, to:PZT, dakika:240 });
        expect(calismaDakikasi(await taze(CAR))).toBe(240);
        expect(calismaDakikasi(await taze(PZT))).toBe(240);
      });
    });

    it('deneme ve kapanış günleri ölçeklenmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const once = calismaDakikasi(await taze(CMT));
        await I.ekle({ tur:'sure', from:CAR, to:PZT, dakika:120 });
        expect(calismaDakikasi(await taze(CMT))).toBe(once);
        const pazar = R.WEEKDAYS[6].blocks.filter(b => b.slot !== 'Dinlenme')
          .reduce((a, b) => a + b.min, 0);
        expect(calismaDakikasi(await taze(PAZ))).toBe(pazar);
      });
    });

    it('hiçbir blok 10 dakikanın altına inmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await I.ekle({ tur:'sure', from:CAR, to:CAR, dakika:30 });
        const d = await taze(CAR);
        d.blocks.forEach(b => expect(b.targetMin >= 10).toBeTruthy());
      });
    });

    it('son eklenen istisna kazanır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await I.ekle({ tur:'sure', from:CAR, to:PZT, dakika:240 });
        await I.ekle({ tur:'ara', from:PER, to:PER });
        expect((await taze(PER)).blocks).toHaveLength(0);
        expect(calismaDakikasi(await taze(CUM))).toBe(240);
      });
    });

    it('istisnanın tarihi geçince gün temel plana döner', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await I.ekle({ tur:'sure', from:CAR, to:PER, dakika:240 });
        const temel = R.WEEKDAYS[4].blocks.reduce((a, b) => a + b.min, 0);
        expect(calismaDakikasi(await taze(CUM))).toBe(temel);
      });
    });
  });

  describe('İstisna — doğrulama', () => {
    it('geçersiz istisna reddedilir, hiçbir şey yazılmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const kotu = [
          { tur:'ara', from:PER, to:CAR },                     // ters aralık
          { tur:'ara', from:'2026-11-01', to:CAR },            // geçmişten başlıyor
          { tur:'ara', from:CAR, to:'2027-01-30' },            // çok uzun
          { tur:'sure', from:CAR, to:PER, dakika:5 },          // çok kısa
          { tur:'sure', from:CAR, to:PER, dakika:900 },        // çok uzun
          { tur:'sure', from:CAR, to:PER },                    // dakika yok
          { tur:'tatil', from:CAR, to:PER },                   // bilinmeyen tür
          { tur:'ara', from:'bozuk', to:PER },                 // bozuk tarih
        ];
        for(const k of kotu){
          const r = I.dogrula(k);
          expect(r.ok).toBeFalsy();
          expect(r.why.length > 5).toBeTruthy();
          expect((await I.ekle(k)).ok).toBeFalsy();
        }
        expect(I.liste()).toHaveLength(0);
      });
    });
  });

  describe('İstisna — ölçümler', () => {
    it('haftalık soru hedefi ara günleri oranında küçülür', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.weekOf(U_parse(CAR));
        const week = await M.ensureWeek(n);
        const tam = R.Calc.questionRealization(n).target;
        await I.ekle({ tur:'ara', from:CAR, to:PER });
        const r = R.Calc.questionRealization(n);
        expect(r.target).toBe(Math.round(week.questionTarget * 5 / 7));
        expect(r.target < tam).toBeTruthy();
        expect(r.araGun).toBe(2);
      });
    });

    it('bütün hafta ara ise hedef yoktur, gerçekleşme «veri yok»tur', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.weekOf(U_parse(CAR));
        await M.ensureWeek(n);
        const gunler = M.weekDates(n).map(d => R.U.iso(d));
        await I.ekle({ tur:'ara', from:gunler[0] < TODAY ? TODAY : gunler[0], to:gunler[6] });
        const r = R.Calc.questionRealization(n);
        const araGun = r.araGun;
        if(araGun === 7){
          expect(r.target).toBe(0);
          expect(r.pct).toBe(null);
        }else{
          expect(r.target).toBe(Math.round(S.weeks[M.weekId(n)].questionTarget * (7 - araGun) / 7));
        }
      });
    });
  });

  describe('İstisna — aksiyon olarak', () => {
    it('ara ve geçici süre orta seviyedir: istense de onay bekler', () => {
      expect(R.ACTION_BY_ID['ara-ver'].level).toBe('orta');
      expect(R.ACTION_BY_ID['gecici-sure'].level).toBe('orta');
      expect(R.ACTION_BY_ID['gunluk-sure'].level).toBe('orta');
    });

    it('ara aksiyonu onaylanınca uygulanır, geri alınınca kalkar', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const t = await P.talep({ action:'ara-ver', agent:'patron', source:'istek',
          params:{ from:CAR, to:PER } });
        expect(t.otomatik).toBe(false);
        expect(I.liste()).toHaveLength(0);
        const pv = P.preview(t.row);
        expect(pv.ok).toBeTruthy();
        const res = await P.approve(t.row.id);
        expect(res.ok).toBeTruthy();
        expect(I.liste()).toHaveLength(1);
        expect((await taze(CAR)).blocks).toHaveLength(0);
        await P.undo(t.row.id);
        expect(I.liste()).toHaveLength(0);
        expect((await taze(CAR)).blocks.length > 0).toBeTruthy();
      });
    });

    it('geçici süre aksiyonu önizlemede etkilenen günü söyler', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const pv = P.preview({ action:'gecici-sure', agent:'patron',
          params:{ from:CAR, to:PZT, dakika:240 } });
        expect(pv.ok).toBeTruthy();
        const metin = pv.rows.map(r => r.label + ' ' + r.before + ' ' + r.after).join(' | ');
        expect(metin).toContain('240');
      });
    });

    it('kalıcı günlük süre: yeni günler ölçeklenir, kapasite güncellenir, geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const eskiKapasite = S.profile.capacityHoursPerWeek;
        const t = await P.talep({ action:'gunluk-sure', agent:'patron', source:'istek',
          params:{ dakika:240 } });
        const res = await P.approve(t.row.id);
        expect(res.ok).toBeTruthy();
        expect(S.profile.gunlukDakika).toBe(240);
        expect(S.profile.capacityHoursPerWeek > eskiKapasite).toBeTruthy();
        expect(calismaDakikasi(await taze(CAR))).toBe(240);
        await P.undo(t.row.id);
        expect(S.profile.gunlukDakika == null).toBeTruthy();
        expect(S.profile.capacityHoursPerWeek).toBe(eskiKapasite);
        expect(calismaDakikasi(await taze(CAR))).toBe(180);
      });
    });

    it('geçici istisna kalıcı temel süreyi geçer', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const t = await P.talep({ action:'gunluk-sure', agent:'patron', source:'istek',
          params:{ dakika:240 } });
        await P.approve(t.row.id);
        await I.ekle({ tur:'sure', from:CAR, to:CAR, dakika:120 });
        expect(calismaDakikasi(await taze(CAR))).toBe(120);
        expect(calismaDakikasi(await taze(PER))).toBe(240);
      });
    });
  });

  function U_parse(iso){ return R.U.parse(iso); }
})();
