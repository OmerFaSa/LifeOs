/* King araçları — ESP (core/kingarac.js, brand/ortak/arac.js).

   Kanıtlanan: oturumu olmayan gün «veri yok»tur; dil kartı önizlenir,
   onayla eklenir ve geri alınır; kitap adı tek kitaba denk gelmezse
   önizleme kurulmaz (tahmin yok). */

(function(){
  const { describe, it, expect } = ESP.Test;
  const A = () => window.LIFEOS.ARAC;

  function kur(){
    A()._sifirla();
    A().kur({ modul:'esp', araclar:() => ESP.KingArac.liste() });
  }

  describe('King araçları — ESP', () => {
    it('her araç katalogdan geçer', () => {
      kur();
      expect(A().liste().length).toBe(ESP.KingArac.liste().length);
      expect(A().liste().map(a => a.ad)).toContain('esp_kart_ekle');
      A()._sifirla();
    });

    it('dil kartı: önizleme, onayla ekleme ve geri alma', async () => {
      kur();
      const n0 = (ESP.S.cards || []).length;
      const o = await A().onizle('esp_kart_ekle', { on:'serendipity', arka:'mutlu tesadüf', dil:'en' });
      expect(o.ok).toBe(true);
      expect((ESP.S.cards || []).length).toBe(n0);
      const u = await A().uygula({ arac:true, ad:'esp_kart_ekle', param:{ on:'serendipity', arka:'mutlu tesadüf', dil:'en' } });
      expect(u.ok).toBe(true);
      expect(ESP.S.cards.length).toBe(n0 + 1);
      await u.geriAl();
      expect(ESP.S.cards.length).toBe(n0);
      A()._sifirla();
    });

    it('kitap adı tek kitaba denk gelmezse önizleme yok; oturumsuz gün veri yok', async () => {
      kur();
      const eski = ESP.S.books;
      ESP.S.books = [{ id:'b1', title:'Suç ve Ceza', author:'Dostoyevski', startedAt:'2026-10-01', finishedAt:null },
        { id:'b2', title:'Suçlu', author:'', startedAt:'2026-10-01', finishedAt:null }];
      try{
        expect((await A().onizle('esp_kitap_bitir', { kitap:'suç' })).ok).toBe(false);
        expect((await A().onizle('esp_kitap_bitir', { kitap:'suç ve' })).ok).toBe(true);
        const g = await A().calistir('esp_gun', { tarih:'2001-01-01' });
        expect(g.sonuc.toplam_dakika).toBeNull();
      }finally{ ESP.S.books = eski; A()._sifirla(); }
    });
  });
})();
