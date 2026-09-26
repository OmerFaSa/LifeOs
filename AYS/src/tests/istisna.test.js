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

  /* YOĞUN GÜN: «Çarşamba 5 saat çalışacağım». Eskiden fazla süre aynı
     blokları uzatıyordu; plana yeni konu girmiyordu. Artık taban bloklar
     olduğu gibi kalır, FAZLA süre plandaki sıradaki konuya blok olur:
     plan ileri kayar, konu kapanırsa kendi haftasında tekrar yazılmaz. */
  describe('İstisna — yoğun gün sıradaki konuyu öne alır', () => {
    async function planli(){
      reset();
      S.profile.setupDone = true;
      await M.ensurePlan(true);
    }
    /* Beklenen konu testte BAĞIMSIZ hesaplanır: günün haftasından sonraki
       plan haftalarında, o haftanın sözleşmesinde olmayan, kapanmamış ilk
       konu. */
    async function siradaki(iso, haric){
      const n = M.weekOf(iso);
      const hafta = await M.ensureWeek(n);
      const bu = {};
      hafta.mainTopics.forEach(t => { bu[t.subjectId + ':' + t.topicId] = true; });
      (haric || []).forEach(k => { bu[k] = true; });
      for(const w of S.plan.weeks.filter(x => x.n > n)){
        for(const it of (w.items || [])){
          const k = it.subjectId + ':' + it.topicId;
          if(bu[k] || M.topicState(it.subjectId, it.topicId).state === 'closed') continue;
          return it;
        }
      }
      return null;
    }
    const oneAlinan = d => d.blocks.filter(b => b.oneAlindi);
    const taban = d => d.blocks.filter(b => !b.oneAlindi);

    it('fazla süre sıradaki konuya blok olur; taban bloklar değişmez', async () => {
      await withTodayAsync(TODAY, async () => {
        await planli();
        const once = (await taze(CAR)).blocks.map(b => b.targetMin);
        const beklenen = await siradaki(CAR);
        await I.ekle({ tur:'sure', from:CAR, to:CAR, dakika:300 });
        const d = await taze(CAR);
        expect(taban(d).map(b => b.targetMin)).toEqual(once);
        const ek = oneAlinan(d);
        expect(ek).toHaveLength(1);
        expect(ek[0].topicId).toBe(beklenen.topicId);
        expect(ek[0].subjectId).toBe(beklenen.subjectId);
        expect(ek[0].targetMin).toBe(120);
        expect(calismaDakikasi(d)).toBe(300);
        /* Gün açılışındaki blok bağlama öne alınan bloğu haftanın
           konusuna geri çekmez. */
        await R.Auto.syncDayBlocks(CAR);
        expect(oneAlinan(S.days[CAR])[0].topicId).toBe(beklenen.topicId);
      });
    });

    it('art arda yoğun günler farklı konuları öne alır', async () => {
      await withTodayAsync(TODAY, async () => {
        await planli();
        await I.ekle({ tur:'sure', from:CAR, to:PER, dakika:300 });
        const a = oneAlinan(await taze(CAR))[0], b = oneAlinan(await taze(PER))[0];
        expect(a && b).toBeTruthy();
        expect(a.topicId === b.topicId && a.subjectId === b.subjectId).toBeFalsy();
      });
    });

    it('kapanmış konu öne alınmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        await planli();
        const ilk = await siradaki(CAR);
        await M.setTopicState(ilk.subjectId, ilk.topicId, { state:'closed' });
        const beklenen = await siradaki(CAR);
        await I.ekle({ tur:'sure', from:CAR, to:CAR, dakika:300 });
        expect(oneAlinan(await taze(CAR))[0].topicId).toBe(beklenen.topicId);
      });
    });

    it('30 dakikadan az fazla ya da azaltma eskisi gibi ölçeklenir', async () => {
      await withTodayAsync(TODAY, async () => {
        await planli();
        await I.ekle({ tur:'sure', from:CAR, to:CAR, dakika:200 });
        await I.ekle({ tur:'sure', from:PER, to:PER, dakika:120 });
        const car = await taze(CAR), per = await taze(PER);
        expect(oneAlinan(car)).toHaveLength(0);
        expect(oneAlinan(per)).toHaveLength(0);
        expect(calismaDakikasi(car)).toBe(200);
        expect(calismaDakikasi(per)).toBe(120);
      });
    });

    it('plan yoksa fazla süre blokları uzatır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        S.plan = null;
        await I.ekle({ tur:'sure', from:CAR, to:CAR, dakika:300 });
        const d = await taze(CAR);
        expect(oneAlinan(d)).toHaveLength(0);
        expect(calismaDakikasi(d)).toBe(300);
      });
    });

    it('deneme gününe konu eklenmez', async () => {
      await withTodayAsync(TODAY, async () => {
        await planli();
        const once = calismaDakikasi(await taze(CMT));
        await I.ekle({ tur:'sure', from:CMT, to:CMT, dakika:400 });
        const d = await taze(CMT);
        expect(oneAlinan(d)).toHaveLength(0);
        expect(calismaDakikasi(d)).toBe(once);
      });
    });

    it('önizleme öne alınacak konuyu adıyla söyler', async () => {
      await withTodayAsync(TODAY, async () => {
        await planli();
        const a = await siradaki(CAR);
        const b = await siradaki(PER, [a.subjectId + ':' + a.topicId]);
        const pv = P.preview({ action:'gecici-sure', agent:'patron',
          params:{ from:CAR, to:PER, dakika:300 } });
        expect(pv.ok).toBeTruthy();
        const satir = pv.rows.find(r => r.label === 'Öne alınan konu');
        expect(satir).toBeTruthy();
        expect(satir.after).toContain(a.name);
        expect(satir.after).toContain(b.name);
      });
    });

    it('öne alınıp kapanan konu kendi haftasında tekrar yazılmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        await planli();
        await I.ekle({ tur:'sure', from:CAR, to:CAR, dakika:300 });
        const ek = oneAlinan(await taze(CAR))[0];
        await M.setTopicState(ek.subjectId, ek.topicId, { state:'closed' });
        const kendiHaftasi = S.plan.weeks.find(w => (w.items || [])
          .some(it => it.subjectId === ek.subjectId && it.topicId === ek.topicId)).n;
        const w = await M.ensureWeek(kendiHaftasi);
        expect(w.mainTopics.some(t => t.subjectId === ek.subjectId && t.topicId === ek.topicId)).toBeFalsy();
        expect(w.mainTopics.length).toBeGreaterThan(0);
      });
    });
  });

  /* Rehber › İstisnalar'daki takvim kayıtları (tatil, okul sınavı, yoğun
     gün, ekstra) eskiden yalnız haftanın «yük» sayısını değiştiriyordu:
     ekran «plan yükü güncellendi» diyordu ama tatil gününde bloklar
     olduğu gibi duruyordu. Bu paket o hatayı yakalar. */
  describe('İstisna — takvim kayıtları', () => {
    it('takvimdeki tatil günü ara günü olarak kurulur', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveCalendar({ kind:'tatil', from:CAR, to:PER, note:'Bayram' });
        const car = await taze(CAR);
        expect(car.ara).toBe(true);
        expect(car.blocks).toHaveLength(0);
        expect(car.araNeden).toBe('Bayram');
        expect(I.gunIcin(PER).kaynak).toBe('takvim');
        expect(!!(await taze(CUM)).ara).toBe(false);
      });
    });

    it('okul sınavı ders gününü yük oranında kısaltır, denemeye dokunmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const tamCmt = calismaDakikasi(await taze(CMT));
        await M.saveCalendar({ kind:'okulSinavi', from:CAR, to:CMT });
        const car = calismaDakikasi(await taze(CAR));
        expect(car).toBe(Math.round(I.sablonDakikasi() * 0.35 / 5) * 5);
        expect(calismaDakikasi(await taze(CMT))).toBe(tamCmt);
        expect(M.dayLoad(CMT).load).toBe(1);
        expect(M.dayLoad(CAR).load).toBe(0.35);
      });
    });

    it('takvime eklemek kayıtlı günü yeniler, ilerlemesi başlamış günü korur', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.ensureDay(CAR);
        const per = await M.ensureDay(PER);
        per.blocks[0].actualMin = 30;
        await M.saveDay(PER);
        await M.saveCalendar({ kind:'tatil', from:CAR, to:PER });
        expect(S.days[CAR].ara).toBe(true);
        expect(S.days[CAR].blocks).toHaveLength(0);
        expect(!!S.days[PER].ara).toBe(false);
        expect(S.days[PER].blocks[0].actualMin).toBe(30);
        expect(I.etki(CAR, PER).korunan).toEqual([PER]);
      });
    });

    it('takvim kaydı silinince günler plana döner', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const rec = await M.saveCalendar({ kind:'tatil', from:CAR, to:CAR });
        await M.ensureDay(CAR);
        expect(S.days[CAR].ara).toBe(true);
        await M.deleteCalendar(rec.id);
        expect(!!S.days[CAR].ara).toBe(false);
        expect(S.days[CAR].blocks.length > 0).toBeTruthy();
      });
    });

    it('kendi istisnan takvim kaydının önüne geçer', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveCalendar({ kind:'okulSinavi', from:CAR, to:CAR });
        await I.ekle({ tur:'sure', from:CAR, to:CAR, dakika:300 });
        expect(calismaDakikasi(await taze(CAR))).toBe(300);
        expect(I.gunIcin(CAR).kaynak == null).toBeTruthy();
      });
    });

    it('takvim kaydı istisna listesinde durmaz; «bitir» yalnız kendi kaydındır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const rec = await M.saveCalendar({ kind:'tatil', from:CAR, to:CAR });
        expect(I.liste()).toHaveLength(0);
        expect((await I.bitir(rec.id)).ok).toBe(false);
        expect(I.takvimde().map(x => x.id)).toEqual([rec.id]);
        expect(I.tanim(I.takvimde()[0])).toContain('Tatil');
      });
    });
  });

  describe('İstisna — haftalık hedef ve yük', () => {
    it('sonradan eklenen tatil hedefi güncel yüke göre küçültür', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.weekOf(U_parse(CAR));
        const week = await M.ensureWeek(n);
        expect(week.planLoad).toBe(1);
        await M.saveCalendar({ kind:'tatil', from:CAR, to:PER });
        const r = R.Calc.questionRealization(n);
        expect(r.target).toBe(Math.round(week.questionTarget * 5 / 7));
        expect(r.araGun).toBe(2);
      });
    });

    it('planın zaten hesaba kattığı yük ikinci kez düşülmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.weekOf(U_parse(CAR));
        const week = await M.ensureWeek(n);
        await M.saveCalendar({ kind:'tatil', from:CAR, to:PER });
        week.planLoad = 5 / 7;         // plan üreteci bu tatili görmüş
        expect(R.Calc.questionRealization(n).target).toBe(week.questionTarget);
      });
    });

    it('geçici süre de yük sayılır; deneme günü ölçeklenmediği için tam sayılır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const temel = I.sablonDakikasi();
        await I.ekle({ tur:'sure', from:CAR, to:CMT, dakika:temel / 2 });
        expect(M.dayLoad(CAR).load).toBe(0.5);
        expect(M.dayLoad(CMT).load).toBe(1);
        expect(M.dayLoad(PAZ).load).toBe(1);
      });
    });

    it('kullanıcının yazdığı hedef o günkü yüke göredir; geri alınınca eski hale döner', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.weekOf(U_parse(CAR));
        const week = await M.ensureWeek(n);
        await I.ekle({ tur:'ara', from:CAR, to:PER });
        const t = await P.talep({ action:'week-target', agent:'patron', source:'istek',
          params:{ weekN:n, questionTarget:300 } });
        /* Hedef değişikliği küçük aksiyondur: istenince kendiliğinden uygulanır. */
        if(!t.otomatik) expect((await P.approve(t.row.id)).ok).toBeTruthy();
        expect(R.Calc.questionRealization(n).target).toBe(300);
        await P.undo(t.row.id);
        expect(week.planLoad).toBe(1);
        expect(R.Calc.questionRealization(n).target).toBe(Math.round(week.questionTarget * 5 / 7));
      });
    });
  });

  function U_parse(iso){ return R.U.parse(iso); }
})();
