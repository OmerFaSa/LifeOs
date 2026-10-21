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
  });
})();
