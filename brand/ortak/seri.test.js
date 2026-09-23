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
