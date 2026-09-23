/* SPİ plan motoru — hedeften plan, uygula → geri al, ilerleme, King.

   Kanıtlanan sözler:
     1. Enerji hedefi tempodan gelir ve BAZAL METABOLİZMANIN altına inmez;
        taban bağlarsa tempo yavaşlar ve bu söylenir.
     2. Hekim kapısında enerji ve beslenme hedefi YAZILMAZ; talimat
        proteini kısıtlıyorsa bant yükseltilmez, enerjiden söz ediyorsa
        enerji kısmı üretilmez.
     3. Plan büyük aksiyondur: önizleme hiçbir şey yazmaz, uygulama geri
        dönüş noktası bırakır, geri alma kullanıcının sonraki seçimini
        ezmez. Model bu eylemi öneremez.
     4. Başlangıç günündeki tartı TABANDIR, ilerleme değil.
     5. King'e giden iş emri planın ÖZETİDİR: talimatın metni gitmez.
        HKM kapalıyken plan çalışır, iş emri açılmaz ve bu söylenir.
     6. Planlama Ofisi'nin programı SPİ'nin kendi kontrol noktalarıyla
        tutmuyorsa eklenmez. */

(function(){
  const { describe, it, expect, resetState, pushVitals, withTodayAsync, withToday } = SP.Test;
  const PL = () => SP.Plan;
  const H = () => window.LIFEOS.Hedef;
  const BUGUN = '2026-09-23';

  function aktifHedef(o){
    const h = Object.assign(H().yeni({ paket:'kilo', yon:'ulas', egilim:'azalt', hedefDeger:80,
      birim:'kg', son_tarih:'2026-12-23', cumle:'3 ayda 80 kiloya inmek istiyorum' }, 'spi', BUGUN),
    { durum:'aktif', cevaplar:{ saglik:'yok' } }, o || {});
    SP.S.hedefler = [h];
    return h;
  }
  function kur(){
    resetState();
    SP.Hedefler.sohbet.sifirla();
    pushVitals(BUGUN, { weight:84 });
    return aktifHedef();
  }
  function kisi(kg){ return Object.assign({}, SP.S.profile, { weightKg:kg }); }

  async function hkmBagla(){
    await SP.Beacon.save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' });
  }
  async function withFetch(cevap, fn){
    const eski = window.fetch;
    const cagri = [];
    window.fetch = function(url, opt){
      cagri.push({ url, opt });
      const c = typeof cevap === 'function' ? cevap(url, opt) : cevap;
      return Promise.resolve({ status:c.status || 200, json:async () => c.govde });
    };
    try{ await fn(cagri); }
    finally{ window.fetch = eski; }
  }

  describe('SPİ plan — kurulum', () => {
    it('tempo tarihten, enerji tempodan gelir; kontrol noktaları haftalıktır', () => {
      const h = kur();
      const r = PL().kur(h, BUGUN);
      expect(r.ok).toBe(true);
      const p = r.plan;
      expect([p.hafta, p.tempo, p.yon, p.hedefKilo]).toEqual([13, 0.31, 'azalt', 80]);
      expect(p.goal).toEqual({ once:'health', sonra:'cut' });
      expect(p.enerji.kcal).toBe(Math.round(SP.Nutri.tdee(kisi(84)) - 0.31 * 7700 / 7));
      expect(p.enerji.etiket).toBe('tahmin');
      expect(p.kontrol[0]).toEqual({ hafta:1, tarih:'2026-09-30', beklenen:83.7 });
      expect(p.kontrol.length).toBe(13);
      expect(p.tartiGunu.ad).toBe('Çarşamba');
      const t = SP.Nutri.targets(Object.assign(kisi(84), { goal:'cut' }));
      expect(p.protein).toEqual({ min:t.protein.min, max:t.protein.max });
    });

    it('enerji bazal metabolizmanın altına inmez; tempo yavaşlar ve söylenir', () => {
      resetState();
      Object.assign(SP.S.profile, { sex:'female', heightCm:160, weightKg:60, activity:'sedentary' });
      pushVitals(BUGUN, { weight:60 });
      const h = aktifHedef({ hedefDeger:56, son_tarih:'2026-10-28' });
      const p = PL().kur(h, BUGUN).plan;
      expect(p.enerji.taban).toBe(true);
      expect(p.enerji.kcal).toBe(SP.Nutri.bmr(kisi(60)));
      expect(p.tempo < 0.8).toBe(true);
      expect(p.uyarilar[0]).toContain('bazal metabolizma');
    });

    it('hekim kapısında enerji ve beslenme hedefi yazılmaz', () => {
      const h = kur();
      SP.S.profile.conditions = ['Tip 2 diyabet'];
      const p = PL().kur(h, BUGUN).plan;
      expect([p.enerji, p.goal, p.protein]).toEqual([null, null, null]);
      expect(p.enerjiNeden).toContain('hekim');
      expect(p.kontrol.length).toBe(13);
    });

    it('talimat proteini kısıtlıyorsa bant yükseltilmez; enerjiden söz ediyorsa enerji yazılmaz', () => {
      const h = kur();
      SP.S.hekim = [{ id:'t1', metin:'Protein alımı sınırlı olmalı.', tarih:BUGUN }];
      const p = PL().kur(h, BUGUN).plan;
      expect(p.goal.sonra).toBe('health');
      expect(p.proteinNeden.toLocaleLowerCase('tr')).toContain('hekim');
      expect(p.enerji != null).toBe(true);
      SP.S.hekim = [{ id:'t2', metin:'Günlük 1800 kalorilik diyet uygulansın.', tarih:BUGUN }];
      const q = PL().kur(h, BUGUN).plan;
      expect(q.enerji).toBe(null);
      expect(q.enerjiNeden).toContain('hekim');
    });

    it('güvenli olmayan tempoyla plan kurulmaz', () => {
      const h = kur();
      h.son_tarih = '2026-10-14';
      const r = PL().kur(h, BUGUN);
      expect(r.ok).toBe(false);
      expect(r.why).toContain('%1,5');
    });

    it('önizleme hiçbir şey yazmaz; enerji satırı önce ve sonrayı gösterir', () => {
      const h = kur();
      const once = JSON.stringify(SP.S.profile);
      const p = PL().kur(h, BUGUN).plan;
      const rows = PL().onizleme(p);
      const e = rows.find(r => r.alan === 'Günlük enerji hedefi');
      expect(e.sonra).toContain('tahmin');
      expect(e.once).toContain(SP.Nutri.targets().kcal.toLocaleString('tr-TR'));
      expect(rows.find(r => r.alan === 'Kontrol noktaları').sonra).toContain('83,7');
      expect(JSON.stringify(SP.S.profile)).toBe(once);
      expect(PL().liste().length).toBe(0);
    });
  });

  describe('SPİ plan — uygula ve geri al', () => {
    it('uygulama beslenme ve enerji hedefini yazar; geri alma eski haline döndürür', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        const oncekiKcal = SP.Nutri.targets().kcal;
        const r = await PL().uygulaHedef(h.id);
        expect(r.ok).toBe(true);
        const p = PL().aktif(h.id);
        expect(SP.S.profile.goal).toBe('cut');
        expect(SP.Nutri.targets().kcal).toBe(p.enerji.kcal);
        expect(SP.Nutri.targets().kcalKaynak).toBe('plan');
        const u = PL().uygulamaOf(h.id);
        expect([u.level, u.status]).toEqual(['buyuk', 'applied']);
        const iki = await PL().uygulaHedef(h.id);
        expect(iki.ok).toBe(false);
        expect(iki.why).toContain('uygulanmış bir planı var');
        const g = await PL().geriAlHedef(h.id);
        expect(g.ok).toBe(true);
        expect([SP.S.profile.goal, SP.S.profile.kcalHedef]).toEqual(['health', null]);
        expect(SP.Nutri.targets().kcal).toBe(oncekiKcal);
        expect(PL().aktif(h.id)).toBe(null);
        expect(PL().liste()[0].durum).toBe('geri_alindi');
      });
    });

    it('geri alma kullanıcının sonradan seçtiği beslenme hedefini ezmez', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        await PL().uygulaHedef(h.id);
        await SP.Model.saveProfile({ goal:'maintain' });
        await PL().geriAlHedef(h.id);
        expect(SP.S.profile.goal).toBe('maintain');
        expect(SP.S.profile.kcalHedef).toBe(null);
      });
    });

    it('hedef bırakılınca plan kapanır ve bu söylenir', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        await PL().uygulaHedef(h.id);
        const r = await SP.Hedefler.durumDegistir(h.id, 'birakildi');
        expect(r.ok).toBe(true);
        expect(r.not).toContain('plan');
        expect(SP.S.profile.goal).toBe('health');
        expect(PL().liste()[0].durum).toBe('kapandi');
        expect(PL().uygulamaOf(h.id)).toBe(null);
      });
    });

    it('model plan-uygula öneremez', () => {
      const h = kur();
      const r = SP.Proposals.fromModel([{ action:'plan-uygula', params:{ hedefId:h.id } },
        { action:'program-ekle', params:{ hedefId:h.id } }]);
      expect(r.oneriler.length).toBe(0);
      expect(r.dusen[0].why).toContain('model öneremez');
      expect(SP.Proposals.catalogPrompt().indexOf('plan-uygula')).toBe(-1);
      expect(SP.Proposals.eylem('plan-uygula').level).toBe('buyuk');
    });

    it('model kaynağıyla plan-uygula kuyruğa bile girmez', async () => {
      const h = kur();
      const row = await SP.Proposals.propose({ action:'plan-uygula', params:{ hedefId:h.id },
        source:'model' });
      expect(row).toBe(null);
      expect(SP.Proposals.pending().length).toBe(0);
    });
  });

  describe('SPİ plan — ilerleme', () => {
    it('başlangıç günündeki tartı taban sayılır, ilerleme değil', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        await PL().uygulaHedef(h.id);
        const p = PL().aktif(h.id);
        const il = PL().ilerleme(p, BUGUN);
        expect(il.durum).toBe('veri_yok');
        expect(il.sonraki.tarih).toBe('2026-09-30');
      });
    });

    it('beklenen kiloya göre yolunda, önde ya da geride', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        await PL().uygulaHedef(h.id);
        const p = PL().aktif(h.id);
        pushVitals('2026-09-30', { weight:83.6 });
        const a = PL().ilerleme(p, '2026-09-30');
        expect([a.durum, a.beklenen, a.degisim]).toEqual(['yolunda', 83.7, -0.4]);
        pushVitals('2026-10-07', { weight:84.6 });
        const b = PL().ilerleme(p, '2026-10-08');
        expect(b.durum).toBe('geride');
        expect(b.metin).toContain('gerisindesin');
        expect(b.sonraki.tarih).toBe('2026-10-14');
      });
    });
  });

  describe('SPİ plan — King ve Planlama Ofisi', () => {
    it('iş emri planın özetidir: talimatın metni gitmez', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        SP.S.hekim = [{ id:'t1', metin:'Tuz tüketimi kısıtlı olmalı.', tarih:BUGUN }];
        await PL().uygulaHedef(h.id);
        const e = PL().emirGovdesi(PL().aktif(h.id));
        expect([e.modul, e.tur]).toEqual(['spi', 'hedef.plan']);
        const p = e.govde.plan;
        expect([p.paket, p.yon, p.hafta, p.talimat, p.hekim_kapisi]).toEqual(['kilo', 'azalt', 13, 1, false]);
        expect(p.enerji.taban).toBe(SP.Nutri.bmr(kisi(84)));
        expect(JSON.stringify(e).indexOf('Tuz')).toBe(-1);
      });
    });

    it('HKM bağlı değilse iş emri açılmaz ve bu söylenir', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        await PL().uygulaHedef(h.id);
        await SP.Beacon.save({ enabled:false, token:'' });
        const r = await PL().kingeIlet(h.id);
        expect(r.ok).toBe(false);
        expect(r.metin).toContain('HKM bağlı değil');
        expect(PL().aktif(h.id) != null).toBe(true);
      });
    });

    it('King kararı ve tahmini süre plana yazılır', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        await PL().uygulaHedef(h.id);
        await hkmBagla();
        await withFetch({ govde:{ ok:true, yeni:true, karar:'onay', emir:{ id:3, karar:'onay',
          durum:'onaylandi', tahmin:{ metin:'yaklaşık 2 dakika', etiket:'tahmin' }, kontrol:[] } } },
        async cagri => {
          const r = await PL().kingeIlet(h.id);
          expect(r.ok).toBe(true);
          expect(r.metin).toContain('King onayladı');
          expect(r.metin).toContain('yaklaşık 2 dakika');
          expect(cagri[0].url).toBe('http://127.0.0.1:4200/api/king/emir');
          expect(JSON.parse(cagri[0].opt.body).govde.plan.hedef_id).toBe(h.id);
        });
        expect(PL().aktif(h.id).emir.id).toBe(3);
        /* İş bitince bildirim planın iş emri durumunu tazeler. */
        await withFetch({ govde:{ bildirimler:[
          { id:8, tur:'bitti', emir_id:3, metin:'«Kilo planı» bitti.', created_at:'2026-09-23T10:02:00' },
          { id:7, tur:'basladi', emir_id:3, metin:'«Kilo planı» başladı.', created_at:'2026-09-23T10:01:00' },
        ] } }, async () => { await PL().bildirimleriCek(); });
        expect(PL().aktif(h.id).emir.durum).toBe('bitti');
      });
    });

    it('bildirimler süzülür: metinsiz satır girmez', async () => {
      resetState();
      await hkmBagla();
      await withFetch({ govde:{ bildirimler:[
        { id:1, tur:'bitti', metin:'«Kilo planı» bitti.', created_at:'2026-09-23T10:02:00' },
        { id:2, tur:'bitti' }, null] } }, async () => {
        const l = await PL().bildirimleriCek();
        expect(l.length).toBe(1);
        expect([l[0].id, l[0].tur]).toEqual([1, 'bitti']);
      });
    });

    function kayitOf(p, degis){
      const haftalar = p.kontrol.map(k => ({ no:k.hafta, baslangic:SP.U.iso(SP.U.addDays(SP.U.parse(k.tarih), -6)),
        bitis:k.tarih, beklenen:k.beklenen, gorevler:[{ tur:'tarti', metin:'Çarşamba sabah tartıl.' }] }));
      const k = { id:5, tur:'plan', surum:1, govde:{ gecti:true,
        girdi:{ hedef_id:p.hedefId, baslangic:p.baslangic },
        program:{ tarti_gunu:'Çarşamba', haftalar }, simulasyon:[{ metin:'Plan temposu: 13 hafta' }] } };
      if(degis) degis(k);
      return k;
    }

    it('program kendi kontrol noktalarıyla tutmuyorsa eklenmez', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        await PL().uygulaHedef(h.id);
        const p = PL().aktif(h.id);
        expect(PL().programSina(p, kayitOf(p)).ok).toBe(true);
        expect(PL().programSina(p, kayitOf(p, k => { k.govde.girdi.hedef_id = 'baska'; })).why)
          .toContain('başka bir hedefe');
        expect(PL().programSina(p, kayitOf(p, k => { k.govde.program.haftalar[2].beklenen = 70; })).why)
          .toContain('3. hafta');
        expect(PL().programSina(p, kayitOf(p, k => { k.govde.gecti = false; })).ok).toBe(false);
      });
    });

    it('plan.apply teklifi programı ekler ve geri alınabilir', async () => {
      await withTodayAsync(BUGUN, async () => {
        const h = kur();
        await PL().uygulaHedef(h.id);
        await hkmBagla();
        const n = { id:9, kind:'plan.apply', payload:{ kayit_id:5, hedef_id:h.id, hafta:13 } };
        expect(SP.Beacon.canApply(n)).toBe(true);
        await withFetch(() => ({ govde:{ kayit:kayitOf(PL().aktif(h.id)) } }), async cagri => {
          const r = await SP.Beacon.applyIntent(n);
          expect(r.ok).toBe(true);
          expect(r.note).toContain('13 haftalık');
          expect(cagri[0].url).toBe('http://127.0.0.1:4200/api/bam/kayit/5');
        });
        const p = PL().aktif(h.id);
        expect(p.program.haftalar.length).toBe(13);
        expect(withToday('2026-09-25', () => PL().buHafta(p)).no).toBe(1);
        const row = SP.Proposals.all().find(x => x.action === 'program-ekle');
        expect(row.iz).toEqual([{ tur:'niyet', id:'9' }, { tur:'kayit', id:'5' }]);
        await SP.Proposals.undo(row.id);
        expect(PL().aktif(h.id).program).toBe(null);
      });
    });
  });
})();
