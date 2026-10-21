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

    /* King 3.0 K5: kitap sayfası fotoğrafı ya da kamera karesi görsel modelle
       okunur; alıntı yalnız onayla, okunan kitaba bağlı not olarak yazılır. */
    it('sayfa okuma ve alıntı: model yoksa söylenir; okunan kitaba bağlanır, onayla yazılır, geri alınır', async () => {
      kur();
      const eski = ESP.S.books;
      ESP.S.books = [{ id:'b1', title:'Suç ve Ceza', author:'Dostoyevski', startedAt:'2026-10-01', finishedAt:null },
        { id:'b2', title:'Budala', author:'', startedAt:null, finishedAt:null }];
      try{
        expect(typeof await ESP.KingArac.sayfaOku(null, {})).toBe('string');
        const r = await ESP.KingArac.sayfaOku(null, { gorsel:async (soru, y) => ({ ok:true, text:'Acı çekmek de bir yetenektir.  \nİkinci satır.' }) });
        expect(r.arac).toEqual({ ad:'esp_alinti_ekle', param:{ metin:'Acı çekmek de bir yetenektir.\nİkinci satır.', kitap:'Suç ve Ceza' } });
        const o = await A().onizle(r.arac.ad, r.arac.param, { metin:'' });
        expect(o.onizle.metin).toBe('«Suç ve Ceza» için alıntı kaydedilecek.');
        const n0 = ESP.S.notes.length;
        const u = await A().uygula({ arac:true, ad:r.arac.ad, param:r.arac.param });
        expect([ESP.S.notes.length, ESP.S.notes[0].bookId]).toEqual([n0 + 1, 'b1']);
        await u.geriAl();
        expect(ESP.S.notes.length).toBe(n0);
        expect((await A().onizle('esp_alinti_ekle', { metin:'x y', kitap:'olmayan kitap' })).ok).toBe(false);
      }finally{ ESP.S.books = eski; A()._sifirla(); }
    });
  });
})();
