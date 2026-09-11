/* Öneri kutusu — ofisin sisteme dokunabildiği tek kapı.

   En kritik test: ONAYSIZ HİÇBİR ŞEY DEĞİŞMEZ. Bir sağlık verisinde
   yanlış kayıt, eksik kayıttan kötüdür — eksik kayıt kendini belli
   eder, yanlış kayıt etmez. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync,
    pushLab, pushVitals } = SP.Test;
  const U = SP.U;

  describe('Öneri — bileşik cümle', () => {
    it('bağlaçtan yan cümlelere bölünür', () => {
      expect(SP.Proposals.yanCumleler('iki yumurta yedim ve 45 dakika yürüdüm'))
        .toEqual(['iki yumurta yedim', '45 dakika yürüdüm']);
    });

    it('sayının içindeki virgül ayraç değildir', () => {
      /* «7,2 saat uyudum» tek parçadır; bölünürse ölçüm kaybolur. */
      expect(SP.Proposals.yanCumleler('7,2 saat uyudum')).toHaveLength(1);
    });

    it('birden çok ayraç birlikte çalışır', () => {
      const p = SP.Proposals.yanCumleler('uyku 7 saat, nabız 58 ayrıca 30 dakika yürüdüm');
      expect(p.length >= 3).toBeTruthy();
    });

    it('çok kısa parça düşer', () => {
      expect(SP.Proposals.yanCumleler('a ve b')).toHaveLength(0);
    });
  });

  describe('Öneri — kural motorundan', () => {
    it('tek cümleden tek öneri çıkar', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Proposals.fromText('uyku 7,5 saat');
        expect(r.oneriler).toHaveLength(1);
        expect(r.oneriler[0].action).toBe('vital-yaz');
        expect(r.oneriler[0].kaynak).toBe('rules');
      });
    });

    it('BİLEŞİK cümleden İKİ öneri çıkar', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Proposals.fromText('uyku 7 saat ve 45 dakika yürüdüm');
        expect(r.oneriler).toHaveLength(2);
        const eylemler = r.oneriler.map(o => o.action).sort();
        expect(eylemler).toEqual(['seans-ekle', 'vital-yaz']);
      });
    });

    it('anlaşılmayan yan cümle SESSİZCE DÜŞMEZ', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Proposals.fromText('uyku 7 saat ve bugün hava çok güzeldi');
        expect(r.oneriler).toHaveLength(1);
        expect(r.anlasilmayan.length).toBe(1);
        expect(/hava/.test(r.anlasilmayan[0])).toBeTruthy();
      });
    });

    it('hiçbir şey anlaşılmazsa öneri üretilmez', () => {
      resetState();
      withToday('2026-03-01', () => {
        const r = SP.Proposals.fromText('bugün kendimi iyi hissediyorum diyebilirim');
        expect(r.oneriler).toHaveLength(0);
      });
    });

    it('model gerekmez — çevrimdışı çalışır', () => {
      resetState();
      SP.S.office = null;                       /* sağlayıcı yok */
      withToday('2026-03-01', () => {
        expect(SP.Proposals.fromText('nabız 58').oneriler).toHaveLength(1);
      });
    });
  });

  describe('Öneri — doğrulama', () => {
    it('katalog dışı eylem reddedilir', () => {
      const c = SP.Proposals.check({ action:'her-seyi-sil', params:{} });
      expect(c.ok).toBeFalsy();
    });

    it('olmayan bir gıda önerisi geçmez', () => {
      resetState();
      const c = SP.Proposals.check({ action:'ogun-ekle',
        params:{ items:[{ foodId:'ejderha-meyvesi-uydurma', g:100 }], date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
    });

    it('olmayan bir biyobelirteç önerisi geçmez', () => {
      resetState();
      const c = SP.Proposals.check({ action:'olcum-gir',
        params:{ rows:[{ markerId:'uydurma-degeri', value:5 }], date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
    });

    it('akıl dışı süre reddedilir ve NEDENİ söylenir', () => {
      const c = SP.Proposals.check({ action:'seans-ekle',
        params:{ minutes:900, date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
      expect(c.why.length > 10).toBeTruthy();
    });

    it('şiddet bandın dışındaysa geçmez', () => {
      const c = SP.Proposals.check({ action:'semptom-isaretle',
        params:{ symptomId:'yorgunluk', severity:9, date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
    });

    it('önizleme ÖNCE ve SONRA taşır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { sleep:6 });
        const pv = SP.Proposals.preview({ action:'vital-yaz',
          params:{ field:'sleep', value:8, date:'2026-03-01' } });
        expect(pv.ok).toBeTruthy();
        expect(pv.rows[0].once.indexOf('6') >= 0).toBeTruthy();
        expect(pv.rows[0].sonra.indexOf('8') >= 0).toBeTruthy();
      });
    });
  });

  describe('Öneri — modelden', () => {
    it('uydurulan parametre kullanıcıya HİÇ gösterilmez', () => {
      resetState();
      const r = SP.Proposals.fromModel({ actions:[
        { action:'ogun-ekle', params:{ items:[{ foodId:'yok-boyle-bir-gida', g:100 }] } },
      ] }, { date:'2026-03-01' });
      expect(r.oneriler).toHaveLength(0);
      expect(r.dusen).toHaveLength(1);
    });

    it('katalog dışı eylem düşer', () => {
      const r = SP.Proposals.fromModel({ actions:[{ action:'profili-sil', params:{} }] });
      expect(r.oneriler).toHaveLength(0);
    });

    it('geçerli öneri geçer', () => {
      resetState();
      const r = SP.Proposals.fromModel({ actions:[
        { action:'vital-yaz', params:{ field:'sleep', value:7 } },
      ] }, { date:'2026-03-01' });
      expect(r.oneriler).toHaveLength(1);
      expect(r.oneriler[0].kaynak).toBe('model');
    });

    it('bozuk JSON çökertmez', () => {
      const r = SP.Proposals.fromModel('{bu json değil');
      expect(r.oneriler).toHaveLength(0);
      expect(typeof r.hata).toBe('string');
    });

    it('katalog tarifi her eylemi sayar', () => {
      const t = SP.Proposals.catalogPrompt();
      SP.Proposals.katalogIdleri().forEach(id => {
        expect(t.indexOf(id) >= 0).toBeTruthy();
      });
    });
  });

  describe('Öneri — onay, uygulama ve geri alma', () => {
    it('ONAYSIZ hiçbir şey değişmez', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('uyku 7,5 saat');
        await SP.Proposals.propose(r.oneriler[0]);
        /* Öneri kutuda duruyor ama uygulanmadı. */
        expect(SP.Proposals.pending()).toHaveLength(1);
        const v = SP.Model.vitalsOf('2026-03-01');
        expect(v == null || v.sleep == null).toBeTruthy();
      });
    });

    it('onaylanınca yazılır', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('uyku 7,5 saat');
        const p = await SP.Proposals.propose(r.oneriler[0]);
        const res = await SP.Proposals.approve(p.id);
        expect(res.ok).toBeTruthy();
        expect(SP.Model.vitalsOf('2026-03-01').sleep).toBe(7.5);
      });
    });

    it('geri alınınca ESKİ değere döner', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        pushVitals('2026-03-01', { sleep:6 });
        const r = SP.Proposals.fromText('uyku 8 saat');
        const p = await SP.Proposals.propose(r.oneriler[0]);
        await SP.Proposals.approve(p.id);
        expect(SP.Model.vitalsOf('2026-03-01').sleep).toBe(8);
        const u = await SP.Proposals.undo(p.id);
        expect(u.ok).toBeTruthy();
        expect(SP.Model.vitalsOf('2026-03-01').sleep).toBe(6);
      });
    });

    it('reddedilen öneri uygulanmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('nabız 58');
        const p = await SP.Proposals.propose(r.oneriler[0]);
        await SP.Proposals.reject(p.id);
        const res = await SP.Proposals.approve(p.id);
        expect(res.ok).toBeFalsy();
        const v = SP.Model.vitalsOf('2026-03-01');
        expect(v == null || v.rhr == null).toBeTruthy();
      });
    });

    it('aynı öneri iki kez uygulanmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('45 dakika yürüdüm');
        const p = await SP.Proposals.propose(r.oneriler[0]);
        await SP.Proposals.approve(p.id);
        const ikinci = await SP.Proposals.approve(p.id);
        expect(ikinci.ok).toBeFalsy();
        expect(SP.S.workouts).toHaveLength(1);
      });
    });

    it('arada geçersizleşen öneri uygulanmaz, BAYAT işaretlenir', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const p = await SP.Proposals.propose({ action:'semptom-isaretle',
          params:{ symptomId:'yorgunluk', severity:2, date:'2026-03-01' }, kaynak:'rules' });
        /* Sözlükten çıkmış gibi davran: öneri artık doğrulanamaz. */
        const yedek = SP.SYMPTOM_BY_ID.yorgunluk;
        delete SP.SYMPTOM_BY_ID.yorgunluk;
        const res = await SP.Proposals.approve(p.id);
        SP.SYMPTOM_BY_ID.yorgunluk = yedek;
        expect(res.ok).toBeFalsy();
        expect(SP.Proposals.all().find(x => x.id === p.id).status).toBe('stale');
      });
    });

    it('geri alınacak bir şey yoksa geri alma başarısız olur', async () => {
      resetState();
      const p = await SP.Proposals.propose({ action:'vital-yaz',
        params:{ field:'sleep', value:7, date:'2026-03-01' }, kaynak:'rules' });
      const u = await SP.Proposals.undo(p.id);
      expect(u.ok).toBeFalsy();
    });

    it('bileşik cümlenin İKİ önerisi de ayrı ayrı onaylanır', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        const r = SP.Proposals.fromText('uyku 7 saat ve 30 dakika yürüdüm');
        const p1 = await SP.Proposals.propose(r.oneriler[0]);
        const p2 = await SP.Proposals.propose(r.oneriler[1]);
        await SP.Proposals.approve(p1.id);
        /* Biri onaylandı, diğeri hâlâ bekliyor. */
        expect(SP.Proposals.pending()).toHaveLength(1);
        await SP.Proposals.approve(p2.id);
        expect(SP.Proposals.pending()).toHaveLength(0);
        expect(SP.Model.vitalsOf('2026-03-01').sleep).toBe(7);
        expect(SP.S.workouts).toHaveLength(1);
      });
    });
  });
})();
