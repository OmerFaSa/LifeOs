/* King araçları — SPİ (core/kingarac.js, brand/ortak/arac.js).

   Kanıtlanan: kaydı olmayan gün «veri yok»tur (sıfır değil); uyku
   ortalamasını SPİ hesaplar; ölçüm yazan araç katalogda yoktur (ölçüm
   King'in kayıt aracıyla SPİ'nin ayrıştırıcısından girer). */

(function(){
  const { describe, it, expect } = SP.Test;
  const A = () => window.LIFEOS.ARAC;

  function kur(){
    A()._sifirla();
    A().kur({ modul:'spi', araclar:() => SP.KingArac.liste() });
  }

  describe('King araçları — SPİ', () => {
    it('her araç katalogdan geçer; ölçüm yazan araç yok', () => {
      kur();
      const adlar = A().liste().map(a => a.ad);
      expect(adlar.length).toBe(SP.KingArac.liste().length);
      expect(adlar).toContain('spi_uyku');
      expect(adlar).toContain('spi_gun_kaydi');
      expect(adlar.filter(a => /vital|ogun_ekle|seans/.test(a)).length).toBe(0);
      A()._sifirla();
    });

    it('uyku: kayıtsız gece boş kalır, ortalamayı kod hesaplar', async () => {
      kur();
      const U = SP.U, d0 = U.todayISO(), d1 = U.iso(U.addDays(U.today(), -1));
      const eski = SP.S.vitals;
      SP.S.vitals = {};
      SP.S.vitals[d0] = { sleep:7 };
      SP.S.vitals[d1] = { sleep:8 };
      try{
        const r = await A().calistir('spi_uyku', { gun:7 });
        expect(r.ok).toBe(true);
        expect(r.sonuc.kayitli_gece).toBe(2);
        expect(r.sonuc.ortalama_saat).toBe(7.5);
        expect(r.sonuc.geceler[2].saat).toBeNull();
        SP.S.vitals = {};
        const b = await A().calistir('spi_uyku', {});
        expect(b.sonuc.ortalama_saat).toBeNull();
        expect(b.satirlar[1]).toBe('Ortalama: veri yok');
      }finally{ SP.S.vitals = eski; A()._sifirla(); }
    });

    /* King 3.0 K5: barkoddan öğün. Gram kullanıcının ya da etiketin; ikisi
       de yoksa yalnız gıda girer. Onaydan sonra yazılır, «Geri al» siler. */
    it('barkod: Open Food Facts ürünü önizlenir, onayla tabloya ve öğüne girer, geri alınır', async () => {
      SP.Test.resetState();
      kur();
      SP.Barkod.ag = async () => ({ ok:true, status:200, json:async () => ({ status:1, product:{ product_name:'Deneme Yulafı',
        nutriments:{ 'energy-kcal_100g':370, proteins_100g:13, fat_100g:7, carbohydrates_100g:59 }, serving_quantity:40 } }) });
      try{
        const oku = await A().calistir('spi_barkod', { kod:'4006381333931' });
        expect(oku.satirlar).toEqual(['Deneme Yulafı', '100 g: 370 kcal · protein 13 g · yağ 7 g · karbonhidrat 59 g', '1 porsiyon = 40 g', 'Kaynak: Open Food Facts · doğrulanmadı']);
        /* model gram uyduramaz: kullanıcının cümlesinde yoksa reddedilir */
        expect((await A().onizle('spi_barkod_ogun', { kod:'4006381333931', gram:150 }, { metin:'bunu yedim' })).ok).toBe(false);
        const o = await A().onizle('spi_barkod_ogun', { kod:'4006381333931' }, { metin:'' });
        expect(o.ok).toBe(true);
        expect(o.onizle.metin).toBe('«Deneme Yulafı» öğüne eklenecek: 40 g (1 porsiyon, etiketten tahmin).');
        expect(o.onizle.satirlar[0]).toBe('Bu miktar: ≈ 148 kcal (hesaplandı)');
        const d = SP.U.todayISO();
        expect((SP.Model.mealsOf(d) || []).length).toBe(0);
        const r = await A().uygula({ arac:true, ad:'spi_barkod_ogun', param:{ kod:'4006381333931' } });
        expect(r.ok).toBe(true);
        const it0 = SP.Model.mealsOf(d)[0].items[0];
        expect([SP.FOOD_BY_ID[it0.foodId].name, it0.g, it0.cert]).toEqual(['Deneme Yulafı', 40, 'estimated']);
        expect(SP.Barkod.bul('4006381333931')).toBe(it0.foodId);
        /* ikinci okutma: defterden gelir, ağa gidilmez */
        SP.Barkod.ag = async () => { throw new Error('ağa gidilmemeli'); };
        expect((await A().calistir('spi_barkod', { kod:'4006381333931' })).satirlar[3]).toBe('Kaynak: kişisel barkod defteri');
        const g = await A().onizle('spi_barkod_ogun', { kod:'4006381333931', gram:150 }, { metin:'bundan 150 gram yedim' });
        expect(g.onizle.metin).toBe('«Deneme Yulafı» öğüne eklenecek: 150 g.');
        await r.geriAl();
        expect((SP.Model.mealsOf(d) || []).length).toBe(0);
        expect(SP.Barkod.bul('4006381333931')).toBeNull();
      }finally{ SP.Barkod.ag = null; A()._sifirla(); }
    });

    it('besin değeri tablodan; tabloda olmayan uydurulmaz', async () => {
      kur();
      const r = await A().calistir('spi_besin', { besin:'yumurta' });
      expect(r.satirlar[1].indexOf('100 g: ')).toBe(0);
      expect((await A().calistir('spi_besin', { besin:'xyzqw' })).cevap).toContain('tablosunda yok');
      A()._sifirla();
    });

    it('geçersiz parametre reddedilir', () => {
      kur();
      expect(A().dogrula('spi_uyku', { gun:500 }).ok).toBe(false);
      expect(A().dogrula('spi_tahliller', { teshis:true }).ok).toBe(false);
      A()._sifirla();
    });

    /* ==================== 022 · Yeni King Araçları Testleri ==================== */

    it('antrenman sil: \'spi_antrenman_sil\' önizler, uygular ve geri alır', async () => {
      SP.Test.resetState();
      kur();
      const w = SP.Model.newWorkout(SP.U.todayISO());
      w.name = 'Kuvvet Antrenmanı';
      w.minutes = 45;
      await SP.Model.saveWorkout(w);
      expect((SP.S.workouts || []).find(x => x.id === w.id)).toBeDefined();

      const o = await A().onizle('spi_antrenman_sil', { id:w.id });
      expect(o.ok).toBe(true);
      expect(o.onizle.metin).toContain('Kuvvet Antrenmanı');

      const r = await A().uygula({ arac:true, ad:'spi_antrenman_sil', param:{ id:w.id } });
      expect(r.ok).toBe(true);
      expect((SP.S.workouts || []).find(x => x.id === w.id)).toBeUndefined();

      await r.geriAl();
      const restored = (SP.S.workouts || []).find(x => x.id === w.id);
      expect(restored).toBeDefined();
      expect(restored.minutes).toBe(45);
      A()._sifirla();
    });

    it('öğün sil: \'spi_ogun_sil\' önizler, uygular ve geri alır', async () => {
      SP.Test.resetState();
      kur();
      const d = SP.U.todayISO();
      const m = SP.Model.newMeal('ogle');
      m.items = [{ foodId:'yumurta', g:100, cert:'measured' }];
      await SP.Model.addMeal(d, m);
      expect(SP.Model.mealsOf(d).some(x => x.id === m.id)).toBe(true);

      const o = await A().onizle('spi_ogun_sil', { id:m.id, tarih:d });
      expect(o.ok).toBe(true);
      expect(o.onizle.metin).toContain('ogle');

      const r = await A().uygula({ arac:true, ad:'spi_ogun_sil', param:{ id:m.id, tarih:d } });
      expect(r.ok).toBe(true);
      expect(SP.Model.mealsOf(d).some(x => x.id === m.id)).toBe(false);

      await r.geriAl();
      expect(SP.Model.mealsOf(d).some(x => x.id === m.id)).toBe(true);
      A()._sifirla();
    });

    it('tahlil sil: \'spi_tahlil_sil\' önizler, uygular ve geri alır', async () => {
      SP.Test.resetState();
      kur();
      const d = SP.U.todayISO();
      const l = SP.Model.newLab(d);
      l.lab = 'Klinik A';
      l.values = { ferritin:{ v:40, cert:'measured' } };
      await SP.Model.saveLab(l);
      expect((SP.S.labs || []).find(x => x.id === l.id)).toBeDefined();

      const o = await A().onizle('spi_tahlil_sil', { id:l.id });
      expect(o.ok).toBe(true);
      expect(o.onizle.metin).toContain(d);

      const r = await A().uygula({ arac:true, ad:'spi_tahlil_sil', param:{ id:l.id } });
      expect(r.ok).toBe(true);
      expect((SP.S.labs || []).find(x => x.id === l.id)).toBeUndefined();

      await r.geriAl();
      expect((SP.S.labs || []).find(x => x.id === l.id)).toBeDefined();
      A()._sifirla();
    });

    it('ilaç yönetimi: \'spi_ilac\' ekler, günceller, siler ve geri alır', async () => {
      SP.Test.resetState();
      kur();
      const oEkle = await A().onizle('spi_ilac', { islem:'ekle', ad:'Magnezyum', doz:'200 mg' });
      expect(oEkle.ok).toBe(true);

      const rEkle = await A().uygula({ arac:true, ad:'spi_ilac', param:{ islem:'ekle', ad:'Magnezyum', doz:'200 mg' } });
      expect(rEkle.ok).toBe(true);
      const m = (SP.S.meds || []).find(x => x.name === 'Magnezyum');
      expect(m).toBeDefined();
      expect(m.dose).toBe('200 mg');

      const oSil = await A().onizle('spi_ilac', { islem:'sil', id:m.id });
      expect(oSil.ok).toBe(true);
      const rSil = await A().uygula({ arac:true, ad:'spi_ilac', param:{ islem:'sil', id:m.id } });
      expect(rSil.ok).toBe(true);
      expect((SP.S.meds || []).find(x => x.id === m.id)).toBeUndefined();

      await rSil.geriAl();
      expect((SP.S.meds || []).find(x => x.id === m.id)).toBeDefined();
      A()._sifirla();
    });

    it('gıda ve sabitleme: \'spi_gida\' ekler, siler, geri alır ve sabitlemeyi yönetir', async () => {
      SP.Test.resetState();
      kur();
      const oEkle = await A().onizle('spi_gida', { islem:'ekle', ad:'Ev Yapımı Granola', kalori:380, protein:10 });
      expect(oEkle.ok).toBe(true);

      const rEkle = await A().uygula({ arac:true, ad:'spi_gida', param:{ islem:'ekle', ad:'Ev Yapımı Granola', kalori:380, protein:10 } });
      expect(rEkle.ok).toBe(true);
      const f = (SP.S.foods || []).find(x => x.name === 'Ev Yapımı Granola');
      expect(f).toBeDefined();

      const oSil = await A().onizle('spi_gida', { islem:'sil', id:f.id });
      expect(oSil.ok).toBe(true);
      const rSil = await A().uygula({ arac:true, ad:'spi_gida', param:{ islem:'sil', id:f.id } });
      expect(rSil.ok).toBe(true);
      expect((SP.S.foods || []).find(x => x.id === f.id)).toBeUndefined();

      await rSil.geriAl();
      expect((SP.S.foods || []).find(x => x.id === f.id)).toBeDefined();

      const oPin = await A().onizle('spi_gida', { islem:'sabitle', id:'weight' });
      expect(oPin.ok).toBe(true);
      const rPin = await A().uygula({ arac:true, ad:'spi_gida', param:{ islem:'sabitle', id:'weight' } });
      expect(rPin.ok).toBe(true);
      expect(SP.Model.isPinned('weight')).toBe(true);
      await rPin.geriAl();
      expect(SP.Model.isPinned('weight')).toBe(false);
      A()._sifirla();
    });

    it('hane yönetimi: \'spi_hane\' üye ekler, siler ve geri alır', async () => {
      SP.Test.resetState();
      kur();
      const oEkle = await A().onizle('spi_hane', { islem:'ekle', ad:'Elif', rol:'family', dogumYili:2005 });
      expect(oEkle.ok).toBe(true);

      const rEkle = await A().uygula({ arac:true, ad:'spi_hane', param:{ islem:'ekle', ad:'Elif', rol:'family', dogumYili:2005 } });
      expect(rEkle.ok).toBe(true);
      const list = SP.Model.householdList();
      const m = list.find(x => x.name === 'Elif');
      expect(m).toBeDefined();

      const oSil = await A().onizle('spi_hane', { islem:'sil', id:m.id });
      expect(oSil.ok).toBe(true);
      const rSil = await A().uygula({ arac:true, ad:'spi_hane', param:{ islem:'sil', id:m.id } });
      expect(rSil.ok).toBe(true);
      expect(SP.Model.householdList().find(x => x.id === m.id)).toBeUndefined();

      await rSil.geriAl();
      expect(SP.Model.householdList().find(x => x.id === m.id)).toBeDefined();
      A()._sifirla();
    });

    it('hane okuma: \'spi_hane_oku\' profilleri okur, boşta veri yok döner', async () => {
      SP.Test.resetState();
      kur();
      const eski = localStorage.getItem('spi.household');
      try{
        localStorage.setItem('spi.household', '[]');
        SP.S.profiles = [];
        const e = await A().calistir('spi_hane_oku', {});
        expect(e.sonuc.etiket).toBe('veri yok');

        SP.Model.addHouseholdMember('Mert', { role:'family' });
        const f = await A().calistir('spi_hane_oku', {});
        expect(f.ok).toBe(true);
        expect(f.sonuc.toplam_uye).toBe(1);
        expect(f.satirlar[0]).toContain('Mert');
      }finally{
        if(eski) localStorage.setItem('spi.household', eski); else localStorage.removeItem('spi.household');
        A()._sifirla();
      }
    });

    it('market ve sepet: \'spi_market\' sepete ekler, fiyat girer, sınır koyar ve geri alır', async () => {
      SP.Test.resetState();
      kur();
      const oEkle = await A().onizle('spi_market', { islem:'sepet_ekle', gida:'yumurta', kg:2 });
      expect(oEkle.ok).toBe(true);

      const rEkle = await A().uygula({ arac:true, ad:'spi_market', param:{ islem:'sepet_ekle', gida:'yumurta', kg:2 } });
      expect(rEkle.ok).toBe(true);
      expect(((SP.S.basket && SP.S.basket.items) || []).find(x => x.foodId === 'yumurta').kg).toBe(2);

      const oFiyat = await A().onizle('spi_market', { islem:'fiyat_gir', gida:'yumurta', fiyat:80 });
      expect(oFiyat.ok).toBe(true);
      const rFiyat = await A().uygula({ arac:true, ad:'spi_market', param:{ islem:'fiyat_gir', gida:'yumurta', fiyat:80 } });
      expect(rFiyat.ok).toBe(true);
      expect(SP.S.prices['yumurta'].tl).toBe(80);
      await rFiyat.geriAl();
      expect(SP.S.prices['yumurta']).toBeUndefined();

      const oSinir = await A().onizle('spi_market', { islem:'sinir_koy', sinir:2000 });
      expect(oSinir.ok).toBe(true);
      const rSinir = await A().uygula({ arac:true, ad:'spi_market', param:{ islem:'sinir_koy', sinir:2000 } });
      expect(rSinir.ok).toBe(true);
      expect(SP.S.basket.weeklyLimit).toBe(2000);
      await rSinir.geriAl();
      expect(SP.S.basket.weeklyLimit).toBeNull();

      const oSil = await A().onizle('spi_market', { islem:'sepet_sil', gida:'yumurta' });
      expect(oSil.ok).toBe(true);
      const rSil = await A().uygula({ arac:true, ad:'spi_market', param:{ islem:'sepet_sil', gida:'yumurta' } });
      expect(rSil.ok).toBe(true);
      expect(((SP.S.basket && SP.S.basket.items) || []).find(x => x.foodId === 'yumurta')).toBeUndefined();
      await rSil.geriAl();
      expect(((SP.S.basket && SP.S.basket.items) || []).find(x => x.foodId === 'yumurta').kg).toBe(2);
      await rEkle.geriAl();
      A()._sifirla();
    });

    it('bütçe okuma: \'spi_butce\' sepet toplamını ve durumunu okur, boşken veri yok döner', async () => {
      SP.Test.resetState();
      kur();
      SP.S.basket = { items:[], weeklyLimit:null };
      const bos = await A().calistir('spi_butce', {});
      expect(bos.sonuc.etiket).toBe('veri yok');

      SP.S.basket = { items:[{ foodId:'yumurta', kg:2 }], weeklyLimit:200 };
      SP.S.prices['yumurta'] = { tl:50, at:'2026-11-01', source:'user' };
      const dolu = await A().calistir('spi_butce', {});
      expect(dolu.ok).toBe(true);
      expect(dolu.sonuc.sepet_kalem).toBe(1);
      expect(dolu.sonuc.haftalik_toplam_tl).toBe(100);
      A()._sifirla();
    });

    it('karar kapatma: \'spi_karar_kapat\' açık kararı kapatır ve geri alır', async () => {
      SP.Test.resetState();
      kur();
      const d = await SP.Model.saveDecision({ topic:'Omega 3 desteği', text:'Haftada 2 gün balık' });
      expect(d.status).toBe('open');

      const o = await A().onizle('spi_karar_kapat', { id:d.id, sonuc:'Uygulandı' });
      expect(o.ok).toBe(true);

      const r = await A().uygula({ arac:true, ad:'spi_karar_kapat', param:{ id:d.id, sonuc:'Uygulandı' } });
      expect(r.ok).toBe(true);
      expect(SP.S.decisions.find(x => x.id === d.id).status).toBe('closed');

      await r.geriAl();
      expect(SP.S.decisions.find(x => x.id === d.id).status).toBe('open');
      A()._sifirla();
    });

    it('profil yönetimi: \'spi_profil\' profil ve merdiven seviyesini günceller ve geri alır', async () => {
      SP.Test.resetState();
      kur();
      const eskiBoy = SP.S.profile && SP.S.profile.heightCm;
      const o = await A().onizle('spi_profil', { boy:180, kilo:75 });
      expect(o.ok).toBe(true);

      const r = await A().uygula({ arac:true, ad:'spi_profil', param:{ boy:180, kilo:75 } });
      expect(r.ok).toBe(true);
      expect(SP.S.profile.heightCm).toBe(180);
      expect(SP.S.profile.weightKg).toBe(75);

      await r.geriAl();
      expect(SP.S.profile.heightCm).toBe(eskiBoy);

      const oSev = await A().onizle('spi_profil', { islem:'seviye', hareketId:'pushup', seviyeId:'p2' });
      expect(oSev.ok).toBe(true);

      const rSev = await A().uygula({ arac:true, ad:'spi_profil', param:{ islem:'seviye', hareketId:'pushup', seviyeId:'p2' } });
      expect(rSev.ok).toBe(true);
      expect(SP.S.progress['pushup'].levelId).toBe('p2');

      await rSev.geriAl();
      expect(SP.S.progress['pushup']).toBeUndefined();
      A()._sifirla();
    });

    it('haftalık planlar: \'spi_planlar\' planları ve uyumu okur, boşken veri yok döner', async () => {
      SP.Test.resetState();
      kur();
      SP.S.haftaplan = [];
      const bos = await A().calistir('spi_planlar', {});
      expect(bos.sonuc.etiket).toBe('veri yok');

      SP.S.haftaplan = [{ id:'p1', tur:'su', ad:'Günlük Su Planı', maddeler:[] }];
      const dolu = await A().calistir('spi_planlar', {});
      expect(dolu.ok).toBe(true);
      expect(dolu.sonuc.toplam).toBe(1);
      expect(dolu.satirlar[0]).toContain('Günlük Su Planı');
      A()._sifirla();
    });

    it('sağlık hedefleri: \'spi_hedefler\' hedefleri okur, boşken veri yok döner', async () => {
      SP.Test.resetState();
      kur();
      SP.S.hedefler = [];
      const bos = await A().calistir('spi_hedefler', {});
      expect(bos.sonuc.etiket).toBe('veri yok');

      SP.S.hedefler = [{ id:'hd1', durum:'aktif', cumle:'70 kiloya ulaş', paket:'kilo' }];
      const dolu = await A().calistir('spi_hedefler', {});
      expect(dolu.ok).toBe(true);
      expect(dolu.sonuc.toplam).toBe(1);
      expect(dolu.satirlar[0]).toContain('70 kiloya ulaş');
      A()._sifirla();
    });

    it('mutfak paylaşımı: \'spi_mutfak\' tencere paylaşımını hesaplar, profil eksikse veri yok döner', async () => {
      SP.Test.resetState();
      kur();
      const eskiProf = SP.S.profile;
      const eskiHouse = localStorage.getItem('spi.household');
      try{
        SP.S.profile = { id:'ben', name:'Ben', heightCm:null, birthYear:null };
        localStorage.setItem('spi.household', JSON.stringify([{ id:'ben', name:'Ben' }]));
        const eksik = await A().calistir('spi_mutfak', { yemek:'kuru-fasulye-etli', gram:1000 });
        expect(eksik.sonuc.etiket).toBe('veri yok');

        SP.S.profile = { id:'ben', name:'Ben', heightCm:175, weightKg:70, birthYear:1990, sex:'male' };
        localStorage.setItem('spi.household', JSON.stringify([SP.S.profile]));
        const dolu = await A().calistir('spi_mutfak', { yemek:'kuru-fasulye-etli', gram:1000 });
        expect(dolu.ok).toBe(true);
        expect(dolu.sonuc.paylar.length).toBe(1);
        expect(dolu.sonuc.paylar[0].gram).toBe(1000);
      }finally{
        SP.S.profile = eskiProf;
        if(eskiHouse) localStorage.setItem('spi.household', eskiHouse); else localStorage.removeItem('spi.household');
        A()._sifirla();
      }
    });

    it('mutfak denetimleri: \'spi_mutfak\' bilinmeyen yemekte veya eksik gramda uydurmaz, veri yok döner', async () => {
      SP.Test.resetState();
      kur();
      SP.S.profile = { id:'ben', name:'Ben', heightCm:175, weightKg:70, birthYear:1990, sex:'male' };
      localStorage.setItem('spi.household', JSON.stringify([SP.S.profile]));
      SP.S.ui = { kitchenDish:null, kitchenGrams:null };

      // 1) Bilinmeyen yemek sorulduğunda kuru fasulyeye ya da kitchenDish'e düşmez, veri yok döner
      const bilmeyen = await A().calistir('spi_mutfak', { yemek:'olmayan-yemek-xyz', gram:500 });
      expect(bilmeyen.sonuc.etiket).toBe('veri yok');

      // 2) Yemek hiç verilmediğinde ve ui.kitchenDish yokken kuru fasulye uydurmaz, veri yok döner
      const yemeksiz = await A().calistir('spi_mutfak', { gram:500 });
      expect(yemeksiz.sonuc.etiket).toBe('veri yok');

      // 3) Gram verilmediğinde ve ui.kitchenGrams yokken 1000g uydurmaz, veri yok döner
      const gramsiz = await A().calistir('spi_mutfak', { yemek:'kuru-fasulye-etli' });
      expect(gramsiz.sonuc.etiket).toBe('veri yok');
      A()._sifirla();
    });

    it('market denetimleri: \'spi_market\' kg verilmezse sepet_ekle hata döner', async () => {
      SP.Test.resetState();
      kur();
      const oKgsiz = await A().onizle('spi_market', { islem:'sepet_ekle', gida:'yumurta' });
      expect(oKgsiz.ok).toBe(false);
      expect(oKgsiz.hata).toContain('kg');
      A()._sifirla();
    });

    it('silme yardımcıları tanımlayıcı yokken uydurmaz: parametresiz çağrıda hata döner', async () => {
      SP.Test.resetState();
      kur();
      // SP.S.workouts tek elemanlı olsa bile parametresiz onizle o tek elemanı seçmemeli
      SP.S.workouts = [{ id:'w1', date:'2026-11-01', name:'Koşu', minutes:30 }];
      const oAnt = await A().onizle('spi_antrenman_sil', {});
      expect(oAnt.ok).toBe(false);

      // Öğün: tek öğün olsa bile parametresiz onizle seçmemeli
      const d = SP.U.todayISO();
      SP.S.meals = { [d]:[{ id:'m1', slot:'ogle', items:[] }] };
      const oOgun = await A().onizle('spi_ogun_sil', {});
      expect(oOgun.ok).toBe(false);

      // Tahlil
      const oLab = await A().onizle('spi_tahlil_sil', {});
      expect(oLab.ok).toBe(false);

      // İlaç
      const oIlac = await A().onizle('spi_ilac', { islem:'sil' });
      expect(oIlac.ok).toBe(false);

      // Gıda
      const oGida = await A().onizle('spi_gida', { islem:'sil' });
      expect(oGida.ok).toBe(false);

      // Hane
      const oHane = await A().onizle('spi_hane', { islem:'sil' });
      expect(oHane.ok).toBe(false);

      A()._sifirla();
    });
    /* 032 · King sınavı SPI kuralları ve doğrulama denetimleri */
    it('kural çözümleme ve zorunlu parametre doğrulamaları (032)', () => {
      kur();
      // 1. spi_besin kural ve doğrulama
      const bes = A().kuralla('zeytinyağının kalori ve yağ değeri');
      expect(bes).toEqual({ ad:'spi_besin', param:{ besin:'zeytinyağı' } });
      expect(A().dogrula('spi_besin', {}).ok).toBe(false);
      expect(A().dogrula('spi_besin', { besin:'zeytinyağı' }).ok).toBe(true);

      // 2. spi_barkod_ogun kural ve doğrulama
      const b1 = A().kuralla('4006381333931 barkodlu ürünü kahvaltıya 100 gram ekle');
      expect(b1).toEqual({ ad:'spi_barkod_ogun', param:{ kod:'4006381333931', gram:100, ogun:'kahvaltı' } });
      const b2 = A().kuralla('8690504033324 barkodlu yoğurttan 200 gram yedim');
      expect(b2).toEqual({ ad:'spi_barkod_ogun', param:{ kod:'8690504033324', gram:200 } });
      expect(A().dogrula('spi_barkod_ogun', {}).ok).toBe(false);
      expect(A().dogrula('spi_barkod_ogun', { kod:'8690504033324' }).ok).toBe(true);

      // 3. spi_bolum_ac_kapa kural ve doğrulama
      const bl1 = A().kuralla('market sepeti bölümünü kapat');
      expect(bl1).toEqual({ ad:'spi_bolum_ac_kapa', param:{ bolum:'basket', acik:0 } });
      const bl2 = A().kuralla('tahlil bölümünü aç');
      expect(bl2).toEqual({ ad:'spi_bolum_ac_kapa', param:{ bolum:'labs', acik:1 } });
      const bl3 = A().kuralla('mutfak kileri bölümünü gizle');
      expect(bl3).toEqual({ ad:'spi_bolum_ac_kapa', param:{ bolum:'kitchen', acik:0 } });
      const blBilinmeyen = A().kuralla('bilinmeyen bölümünü kapat');
      expect(blBilinmeyen).toBeNull();
      expect(A().dogrula('spi_bolum_ac_kapa', {}).ok).toBe(false);
      expect(A().dogrula('spi_bolum_ac_kapa', { bolum:'basket' }).ok).toBe(false);
      expect(A().dogrula('spi_bolum_ac_kapa', { acik:0 }).ok).toBe(false);
      expect(A().dogrula('spi_bolum_ac_kapa', { bolum:'basket', acik:0 }).ok).toBe(true);

      // 4. QuickEntry kilo ve su ayrıştırması
      const q1 = SP.Quick.parse('kilom 78.4');
      expect(q1.kind).toBe('vital');
      expect(q1.data.field.id).toBe('weight');
      expect(q1.data.value).toBe(78.4);

      const q2 = SP.Quick.parse('1 buçuk litre su içtim');
      expect(q2.kind).toBe('vital');
      expect(q2.data.field.id).toBe('water');
      expect(q2.data.value).toBe(1500);

      const q3 = SP.Quick.parse('sabah aç karnına tartıldım kilom 76.8');
      expect(q3.kind).toBe('vital');
      expect(q3.data.field.id).toBe('weight');
      expect(q3.data.value).toBe(76.8);

      const q4 = SP.Quick.parse('kilom bu sabah 77.2 geldi');
      expect(q4.kind).toBe('vital');
      expect(q4.data.field.id).toBe('weight');
      expect(q4.data.value).toBe(77.2);

      A()._sifirla();
    });
  });
})();
