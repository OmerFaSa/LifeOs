/* Seri dondurma ve tatil modu (brand/ortak/seri.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/seri.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: kullanıcı işaretler (en çok 7 gün geriye), sınırlıdır
   (tek kayıt 21 gün, hasta günü 3, ayda 6), geri alınır; tatil bugün
   bitirilince geçmişi donmuş kalır; HKM'ye yalnız tatilin tarihi gider. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const S = () => window.LIFEOS.Seri;
  function depo(){
    const m = {};
    return { get:async k => m[k] ? JSON.parse(m[k]) : null, set:async (k, v) => { m[k] = JSON.stringify(v); } };
  }
  function kur(bugun){ const d = depo(); return { s:S().kur({ store:() => d, bugun:() => bugun }), d }; }

  describe('Seri dondurma', () => {
    it('hasta günü işaretlenir, sınırlara uyar, geri alınır, kalıcıdır', async () => {
      const { s, d } = kur('2026-09-23');
      const r = await s.dondur('2026-09-22', null, 'hasta');
      expect(r.ok).toBe(true);
      expect(s.donmusMu('2026-09-22')).toBe(true);
      expect(s.donmusMu('2026-09-23')).toBe(false);
      expect((await s.dondur('2026-09-10', null, 'hasta')).ok).toBe(false);      /* 13 gün geri */
      expect((await s.dondur('2026-09-22', null, 'hasta')).why).toContain('zaten');
      expect((await s.dondur('2026-09-24', '2026-09-28', 'hasta')).ok).toBe(false); /* 5 gün hasta */
      expect((await s.dondur('2026-09-23', null, 'uydurma')).ok).toBe(false);
      /* Yeniden yüklenince durur (kalıcı). */
      const s2 = S().kur({ store:() => d, bugun:() => '2026-09-23' });
      await s2.yukle();
      expect(s2.donmusMu('2026-09-22')).toBe(true);
      expect((await s2.coz(r.kayit.id)).ok).toBe(true);
      expect(s2.donmusMu('2026-09-22')).toBe(false);
    });

    it('ayda en çok 6 hasta/izin günü; tatil ayrı sayılır', async () => {
      const { s } = kur('2026-09-23');
      expect((await s.dondur('2026-09-17', '2026-09-19', 'hasta')).ok).toBe(true);
      expect((await s.dondur('2026-09-20', '2026-09-22', 'izin')).ok).toBe(true);
      const r = await s.dondur('2026-09-23', null, 'hasta');
      expect(r.ok).toBe(false);
      expect(r.why).toContain('Bu ay');
      expect((await s.dondur('2026-09-24', '2026-09-30', 'tatil')).ok).toBe(true);
      expect((await s.dondur('2026-10-01', '2026-10-25', 'tatil')).ok).toBe(false); /* 25 gün */
    });

    /* HATALAR D-19: aylık sınır yalnız kaydın BAŞLADIĞI ayı sayıyordu; ay
       dönümünü geçen izin öteki ayın sınırına bakmıyordu. */
    it('ay dönümünü geçen kayıt iki ayın sınırına da bakar', async () => {
      const { s } = kur('2026-10-07');
      expect((await s.dondur('2026-10-04', '2026-10-06', 'hasta')).ok).toBe(true);
      expect((await s.dondur('2026-10-07', null, 'izin')).ok).toBe(true);     /* Ekim: 4 */
      const r = await s.dondur('2026-09-30', '2026-10-03', 'izin');           /* +3 Ekim = 7 */
      expect(r.ok).toBe(false);
      expect(r.why).toContain('Ekim');
      expect((await s.dondur('2026-09-30', '2026-10-01', 'izin')).ok).toBe(true); /* +1 = 5 */
    });

    /* HATALAR D-19: tatilin toplam sınırı yoktu; 21 günlük kayıtlar art arda
       eklenebiliyordu («bahane makinesi olmamalı»). */
    it('tatil bir takvim yılında en çok 42 gün', async () => {
      const { s } = kur('2026-07-01');
      expect((await s.dondur('2026-07-01', '2026-07-21', 'tatil')).ok).toBe(true);
      expect((await s.dondur('2026-07-22', '2026-08-11', 'tatil')).ok).toBe(true);
      const r = await s.dondur('2026-08-12', '2026-08-14', 'tatil');
      expect(r.ok).toBe(false);
      expect(r.why).toContain('42');
      /* Öteki yılın sınırı ayrıdır. */
      expect((await s.dondur('2027-01-04', '2027-01-10', 'tatil')).ok).toBe(true);
    });

    /* Kullanıcı kararı (2026-09-24): yıllık tatil sınırı değiştirilebilir.
       Varsayılan 42; 0–365 arası tam sayı; kalıcı; düşürmek var olan
       kaydı silmez, yalnız yeni kaydı sınırlar. */
    it('yıllık tatil sınırı kullanıcı ayarıdır', async () => {
      const { s, d } = kur('2026-07-01');
      expect(s.yillikTatil()).toBe(42);
      expect((await s.yillikTatilAyarla(60)).ok).toBe(true);
      expect((await s.dondur('2026-07-01', '2026-07-21', 'tatil')).ok).toBe(true);
      expect((await s.dondur('2026-07-22', '2026-08-11', 'tatil')).ok).toBe(true);
      expect((await s.dondur('2026-08-12', '2026-08-14', 'tatil')).ok).toBe(true);   /* 45 ≤ 60 */
      expect(s.kalanTatil('2026')).toBe(15);
      expect((await s.yillikTatilAyarla(-1)).ok).toBe(false);
      expect((await s.yillikTatilAyarla(400)).ok).toBe(false);
      expect((await s.yillikTatilAyarla('abc')).ok).toBe(false);
      expect((await s.yillikTatilAyarla(2.5)).ok).toBe(false);
      const s2 = S().kur({ store:() => d, bugun:() => '2026-07-01' });
      await s2.yukle();
      expect(s2.yillikTatil()).toBe(60);
      const r = await s2.yillikTatilAyarla(10);
      expect(r.ok).toBe(true);
      expect(r.onceki).toBe(60);
      expect(s2.liste().length).toBe(3);
      const red = await s2.dondur('2026-09-01', null, 'tatil');
      expect(red.ok).toBe(false);
      expect(red.why).toContain('10');
      expect(s2.kalanTatil('2026')).toBe(0);
    });

    it('tatil: etkin tatil, HKM’ye yalnız tarih; bugün bitirilince geçmiş donmuş kalır', async () => {
      const { s } = kur('2026-09-26');
      await s.dondur('2026-09-24', '2026-09-30', 'tatil');
      expect(s.aktifTatil().bit).toBe('2026-09-30');
      expect(s.hkmTatil()).toEqual({ bas:'2026-09-24', bit:'2026-09-30' });
      expect((await s.tatiliBitir()).ok).toBe(true);
      expect(s.donmusMu('2026-09-25')).toBe(true);
      expect(s.donmusMu('2026-09-26')).toBe(false);
      expect(s.aktifTatil()).toBe(null);
      /* Biten tatil üç gün daha bildirilir: HKM dönüşü buradan bilir. */
      expect(s.hkmTatil()).toEqual({ bas:'2026-09-24', bit:'2026-09-25' });
    });
  });
})();
