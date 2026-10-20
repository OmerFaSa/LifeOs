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

    it('geçersiz parametre reddedilir', () => {
      kur();
      expect(A().dogrula('spi_uyku', { gun:500 }).ok).toBe(false);
      expect(A().dogrula('spi_tahliller', { teshis:true }).ok).toBe(false);
      A()._sifirla();
    });
  });
})();
