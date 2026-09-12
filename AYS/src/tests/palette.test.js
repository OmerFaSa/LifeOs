/* KOMUT PALETİ — yapı ve konuşarak veri girişi.

   Palet Ctrl+K ile her yerden açılır. Bozulduğunda görünür bir hata
   vermez: komut listede çıkmaz ya da yanlış ekrana gider. On bir
   işlevinden hiçbiri denenmiyordu.

   Burada çizim değil KARAR denenir: listenin yapısı ve serbest metnin
   öneriye dönüşmesi. `run()` hiçbir testte çağrılmaz — çalıştırmak
   ekran değiştirir; denenen şey komutun DOĞRU KURULDUĞUDUR. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const P = R.Palette;

  describe('Palet — komut listesi', function(){
    it('liste boş değil', function(){
      expect(P.commands().length).toBeGreaterThan(5);
    });

    it('her komutun etiketi ve çalıştırıcısı var', function(){
      /* Etiketsiz komut listede görünür ama okunmaz; çalıştırıcısı
         olmayan komut tıklanır ve hiçbir şey olmaz. */
      P.commands().forEach(c => {
        expect(typeof c.label).toBe('string');
        expect(c.label.length).toBeGreaterThan(0);
        expect(typeof c.run).toBe('function');
      });
    });

    it('her komut bir gruba ait', function(){
      /* Grupsuz komut listenin dibinde kaybolur. */
      P.commands().forEach(c => {
        expect(typeof c.group).toBe('string');
        expect(c.group.length).toBeGreaterThan(0);
      });
    });

    it('aynı etiket iki kez listelenmez', function(){
      const etiketler = P.commands().map(c => String(c.label));
      expect(etiketler.length).toBe(new Set(etiketler).size);
    });
  });

  describe('Palet — konuşarak veri girişi', function(){
    it('kısa metin öneri üretmez', function(){
      /* Üç harf yazarken her tuşta öneri çıkarmak paleti kullanılmaz
         yapar; eşik bilinçli. */
      expect(P.veriKomutu('ab')).toBeFalsy();
      expect(P.veriKomutu('')).toBeFalsy();
      expect(P.veriKomutu(null)).toBeFalsy();
    });

    it('anlamsız metin öneri üretmez', function(){
      expect(P.veriKomutu('qwertyuiop asdfghjkl')).toBeFalsy();
    });

    it('çözülen soru cümlesi öneriye dönüşür', function(){
      resetState();
      const c = P.veriKomutu('matematikten 40 soru çözdüm, 32 doğru');
      expect(c).toBeTruthy();
      expect(c.group).toBe('Kayıt');
      expect(c.label.length).toBeGreaterThan(0);
      expect(typeof c.run).toBe('function');
    });

    it('uyku cümlesi öneriye dönüşür', function(){
      resetState();
      expect(P.veriKomutu('dün gece 7 saat uyudum')).toBeTruthy();
    });

    it('birden çok kayıt tek komutta sayılır', function(){
      resetState();
      const c = P.veriKomutu('8 saat uyudum ve 20 paragraf çözdüm');
      expect(c).toBeTruthy();
      expect(c.sub).toContain('kayıt');
    });

    it('öneri komutu KENDİLİĞİNDEN KAYDETMEZ', function(){
      /* Komut yalnızca önizlemeyi hazırlar; onaysız hiçbir şey yazılmaz.
         `run` çağrılmadığı sürece gün kaydı değişmemeli. */
      resetState();
      const once = JSON.stringify(R.S.days || {});
      P.veriKomutu('matematikten 40 soru çözdüm');
      expect(JSON.stringify(R.S.days || {})).toBe(once);
    });
  });
})();
