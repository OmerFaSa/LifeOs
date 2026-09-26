/* Tarihli gunluk sure (core/gunsure.js). Kanitladigi sozler: temel
   (profil) degismez, istisna tarihi gecince temel doner; gecmise yazilmaz;
   son eklenen kazanir; tek gun kucuk, cok gun orta aksiyondur (AGENTS
   §1.9); recete ve Bugun'un olcutu istisnayi okur. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = ESP.Test;
  const G = () => ESP.GunSure;
  const BUGUN = '2026-09-14';                       // pazartesi

  function kur(){ resetState(); ESP.S.gunSure = []; }

  describe('Tarihli günlük süre (ESP)', () => {
    it('temel değişmez; istisna yalnız aralığında geçerlidir', async () => {
      await withTodayAsync(BUGUN, async () => {
        kur();
        expect(G().taban('2026-09-16')).toEqual({ dakika:60, kaynak:'profil', kayit:null });
        const r = await G().ekle('2026-09-15', '2026-09-17', 120);
        expect(r.ok).toBe(true);
        expect(G().taban('2026-09-16').dakika).toBe(120);
        expect(G().taban('2026-09-16').kaynak).toBe('istisna');
        expect(G().taban('2026-09-18').dakika).toBe(60);
        expect(ESP.S.profile.dailyMinutes).toBe(60);
      });
    });

    it('geçmişe yazılmaz; sınırlar ve tarih denetlenir', async () => {
      await withTodayAsync(BUGUN, async () => {
        kur();
        expect((await G().ekle('2026-09-13', '2026-09-15', 90)).ok).toBe(false);
        expect((await G().ekle('2026-09-16', '2026-09-15', 90)).ok).toBe(false);
        expect((await G().ekle(BUGUN, BUGUN, 5)).ok).toBe(false);
        expect((await G().ekle(BUGUN, BUGUN, 900)).ok).toBe(false);
        expect((await G().ekle(BUGUN, '2026-11-30', 90)).ok).toBe(false);   // en çok 42 gün
        expect((await G().ekle('bozuk', BUGUN, 90)).ok).toBe(false);
        expect(G().liste().length).toBe(0);
      });
    });

    it('son eklenen kazanır; kaldırılınca öncekine döner', async () => {
      await withTodayAsync(BUGUN, async () => {
        kur();
        await G().ekle(BUGUN, '2026-09-20', 30);
        const ikinci = await G().ekle('2026-09-16', '2026-09-16', 150);
        expect(G().taban('2026-09-16').dakika).toBe(150);
        expect(G().taban('2026-09-17').dakika).toBe(30);
        expect((await G().kaldir(ikinci.kayit.id)).ok).toBe(true);
        expect(G().taban('2026-09-16').dakika).toBe(30);
        expect((await G().kaldir('yok')).ok).toBe(false);
      });
    });

    it('tek gün küçük, çok gün orta aksiyondur', () => {
      expect(G().seviye('2026-09-15', '2026-09-15')).toBe('kucuk');
      expect(G().seviye('2026-09-15', '2026-09-16')).toBe('orta');
    });

    it('reçete ve Bugün ölçütü istisnayı okur; bitmiş kayıt zamanla temizlenir', async () => {
      await withTodayAsync(BUGUN, async () => {
        kur();
        await G().ekle(BUGUN, BUGUN, 150);
        expect(ESP.Coach.dailyBase()).toBe(150);
        expect(G().gecerliListe().length).toBe(1);
      });
      await withTodayAsync('2026-09-20', async () => {
        expect(ESP.Coach.dailyBase()).toBe(60);
        expect(G().gecerliListe().length).toBe(0);       // bitmiş kayıt listede görünmez
      });
    });
  });
})();
