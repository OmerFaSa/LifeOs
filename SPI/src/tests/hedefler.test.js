/* SPİ hedef paketleri — kilo (ver / al / ulaş), VKİ, güvenlik, hekim.

   Genel motor `brand/ortak/hedef.js`'tedir; burada SPİ'nin kendi alan
   bilgisi sınanır. Kanıtlanan sözler:
     1. Şu anki kilo SON ÖLÇÜMDEN gelir, etiketiyle; yoksa profil değeri
        «tahmin» olarak kullanılır.
     2. Hız bantları kişinin kendi ağırlığına oranlıdır; dayanağı henüz
        bağlanmadığı için karar «tahmin»dir.
     3. Tehlikeli hedef kodla reddedilir: reşit olmayan, çok hızlı kayıp,
        zayıflık sınırının altı, obezite sınırının üstüne alım.
     4. Riskli durum, ilaç ya da gebelikte plan hekimle kurulur; hekim
        talimatı en yüksek öncelikli kısıttır. SPİ teşhis koymaz. */

(function(){
  const { describe, it, expect, resetState, pushVitals, withTodayAsync } = SP.Test;
  const P = () => SP.Hedefler;
  const H = () => window.LIFEOS.Hedef;
  const BUGUN = '2026-09-23';

  function kur(){
    resetState();
    SP.S.hedefler = [];
    SP.S.hekim = [];
    P().sohbet.sifirla();
  }
  function hedef(cumle, tarih){
    const h = P().normalize(H().yeni(H().cumleden(cumle, P().PAKETLER, BUGUN), 'spi', BUGUN));
    if(tarih) h.son_tarih = tarih;
    return h;
  }

  describe('SPİ hedef — şu anki kilo', () => {
    it('son ölçüm kullanılır, etiketiyle', () => {
      kur();
      pushVitals('2026-09-01', { weight:81 });
      pushVitals('2026-09-20', { weight:80.4 });
      pushVitals('2026-09-21', { weight:null });
      expect(P().sonKilo()).toEqual({ deger:80.4, birim:'kg', etiket:'olculdu', tarih:'2026-09-20' });
    });

    it('ölçüm yoksa profil değeri «tahmin» olarak gelir', () => {
      kur();
      const s = P().sonKilo();
      expect([s.deger, s.etiket]).toEqual([78, 'tahmin']);
      SP.S.profile.weightKg = null;
      expect(P().sonKilo()).toBe(null);
    });
  });

  describe('SPİ hedef — bantlar ve güvenlik', () => {
    it('kayıp ve alım bantları kilonun oranıdır; karar tahmindir', () => {
      kur();
      pushVitals('2026-09-20', { weight:80 });
      const k = P().KILO.hiz(hedef('3 kilo vermek istiyorum'), {});
      expect([k.tipik, k.ust, k.birim]).toEqual([0.4, 0.8, 'kg/hafta']);
      expect(k.dayanak.durum).toBe('kaynak_bekliyor');
      const a = P().KILO.hiz(hedef('4 kilo almak istiyorum'), {});
      expect([a.tipik, a.ust]).toEqual([0.2, 0.4]);
      expect(H().gerceklik(hedef('3 kilo vermek istiyorum', '2026-12-16'), P().KILO, {}, BUGUN).etiket)
        .toBe('tahmin');
    });

    it('çok hızlı kayıp reddedilir, güvenli tempo kalır', () => {
      kur();
      pushVitals('2026-09-20', { weight:80 });
      const r = H().gerceklik(hedef('5 kilo vermek istiyorum', '2026-10-07'), P().KILO, {}, BUGUN);
      expect(r.bant).toBe('guvensiz');
      expect(r.neden).toContain('%1,5');
      expect(r.karsi.son_tarih > BUGUN).toBe(true);
    });

    it('zayıflık sınırının altına inen hedef reddedilir', () => {
      kur();
      pushVitals('2026-09-20', { weight:60 });
      const r = H().gerceklik(hedef('50 kiloya inmek istiyorum', '2027-09-23'), P().KILO, {}, BUGUN);
      expect(r.bant).toBe('guvensiz');
      expect(r.neden).toContain('18,5');
    });

    it('obezite sınırının üstüne kilo alımı reddedilir', () => {
      kur();
      pushVitals('2026-09-20', { weight:90 });
      const r = H().gerceklik(hedef('10 kilo almak istiyorum', '2027-09-23'), P().KILO, {}, BUGUN);
      expect(r.bant).toBe('guvensiz');
      expect(r.neden).toContain('30');
    });

    it('reşit olmayan için kilo hedefi kurulmaz', () => {
      kur();
      SP.S.profile.birthYear = new Date().getFullYear() - 15;
      pushVitals('2026-09-20', { weight:60 });
      const r = H().gerceklik(hedef('2 kilo vermek istiyorum', '2027-01-23'), P().KILO, {}, BUGUN);
      expect(r.bant).toBe('guvensiz');
      expect(r.neden).toContain('18 yaş');
    });
  });

  describe('SPİ hedef — VKİ', () => {
    it('VKİ hedefi boyla kiloya çevrilir', () => {
      kur();
      pushVitals('2026-09-20', { weight:82 });
      const h = hedef("VKİ'mi 24'e indirmek istiyorum");
      expect([h.paket, h.yon, h.egilim, h.hedefVki]).toEqual(['kilo', 'ulas', 'azalt', 24]);
      expect(h.hedefDeger).toBe(76);          // 24 × 1,78² = 76,04
    });

    it('boy bilinmiyorsa sorulur, cevapla kiloya çevrilir', async () => {
      kur();
      SP.S.profile.heightCm = null;
      pushVitals('2026-09-20', { weight:82 });
      await withTodayAsync(BUGUN, async () => {
        const a = await P().sohbet.isle("VKİ'mi 3 ay içinde 24'e indirmek istiyorum");
        expect(a.text).toContain('boyun');
        const b = await P().sohbet.isle('178');
        expect(b.text).toContain('sağlık durumun');
        expect(P().sohbet.bekleyen().hedef.hedefDeger).toBe(76);
      });
    });
  });

  describe('SPİ hedef — hekim kapısı ve talimat', () => {
    it('riskli durum, ilaç ya da cevapta geçen gebelik hekim kapısını açar', () => {
      kur();
      const h = hedef('3 kilo vermek istiyorum');
      expect(P().hekimKapisi(h).gerekli).toBe(false);
      SP.S.profile.conditions = ['Tip 2 diyabet'];
      expect(P().hekimKapisi(h).gerekli).toBe(true);
      SP.S.profile.conditions = [];
      SP.S.meds = [{ id:'m1', name:'Levotiroksin', startDate:'2026-01-01', endDate:null }];
      expect(P().hekimKapisi(h).gerekli).toBe(true);
      SP.S.meds = [];
      h.cevaplar = { saglik:'hamileyim' };
      expect(P().hekimKapisi(h).gerekli).toBe(true);
      h.cevaplar = { saglik:'yok' };
      expect(P().hekimKapisi(h).gerekli).toBe(false);
    });

    it('hekim talimatı kaydedilir, silinir; boş talimat reddedilir', async () => {
      kur();
      const r = await P().talimatEkle('Günlük tuz tüketimi sınırlı olmalı.', '2026-09-10');
      expect(r.ok).toBe(true);
      expect(P().talimatlar()).toHaveLength(1);
      expect((await P().talimatEkle('   ', '2026-09-10')).ok).toBe(false);
      await P().talimatSil(r.kayit.id);
      expect(P().talimatlar()).toHaveLength(0);
    });

    it('sohbet hekim gerekirse bunu söyler; talimat varsa ona uyulacağını söyler', async () => {
      kur();
      pushVitals('2026-09-20', { weight:80 });
      await withTodayAsync(BUGUN, async () => {
        await P().talimatEkle('Karbonhidratı azalt, öğün atlama.', '2026-09-10');
        await P().sohbet.isle('3 ay içinde 3 kilo vermek istiyorum');
        const r = await P().sohbet.isle('diyabetim var');
        expect(r.text).toContain('hekiminle');
        expect(r.text).toContain('hekim talimat');
      });
    });
  });

  describe('SPİ hedef — sohbet ve kayıt', () => {
    it('sağlık sorusu atlanmaz; onayla hedef depoya aktif yazılır', async () => {
      kur();
      pushVitals('2026-09-20', { weight:80 });
      await withTodayAsync(BUGUN, async () => {
        const a = await P().sohbet.isle('3 ay içinde 3 kilo vermek istiyorum');
        expect(a.text).toContain('sağlık durumun');
        const b = await P().sohbet.isle('yok');
        expect(b.text).toContain('gerçekçi');
        await P().sohbet.isle('evet');
        expect(P().aktifler()).toHaveLength(1);
        const kayitli = await SP.Store.get('hedefler/' + P().aktifler()[0].id);
        expect(kayitli.durum).toBe('aktif');
      });
    });
  });
})();
