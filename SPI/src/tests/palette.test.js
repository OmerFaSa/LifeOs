/* KOMUT PALETİ — yapı ve hızlı giriş.

   Palet Ctrl+K ile her yerden açılır ve uygulamanın en hızlı yoludur.
   Bozulduğunda görünür bir hata vermez: komut listede görünmez, ya da
   yanlış ekrana gider. On işlevinden yalnızca biri deneniyordu.

   Burada çizim değil KARAR denenir: listenin yapısı, kimliklerin
   tekilliği ve serbest metnin öneriye dönüşmesi. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const P = SP.Palette;

  describe('Palet — komut listesi', function(){
    it('liste boş değil', function(){
      expect(P.commands().length).toBeGreaterThan(5);
    });

    it('her komutun etiketi ve çalıştırıcısı var', function(){
      /* Etiketsiz bir komut listede görünür ama okunmaz; çalıştırıcısı
         olmayan bir komut tıklanır ve hiçbir şey olmaz. */
      P.commands().forEach(c => {
        expect(typeof c.label).toBe('string');
        expect(c.label.length).toBeGreaterThan(0);
        expect(typeof c.run).toBe('function');
      });
    });

    it('komut kimlikleri tekil', function(){
      /* Aynı kimlikten iki komut, seçileni belirsiz yapar. */
      const ids = P.commands().map(c => c.id).filter(Boolean);
      expect(ids.length).toBe(new Set(ids).size);
    });

    it('her ekrana giden bir komut var', function(){
      const rotalar = SP.App.SECTIONS.reduce((a, s) => a.concat(s.views.map(v => v.route)), []);
      const gidenler = P.commands().filter(c => String(c.id).indexOf('go:') === 0)
        .map(c => String(c.id).slice(3));
      rotalar.forEach(r => {
        if(gidenler.indexOf(r) < 0) throw new Error('palette bu ekrana gitmiyor: ' + r);
      });
    });
  });

  describe('Palet — serbest metinden hızlı giriş', function(){
    it('kısa metin öneri üretmez', function(){
      /* İki harf yazarken her tuşta öneri çıkarmak paleti kullanılmaz
         yapar; eşik bilinçli. */
      expect(P.quickCommand('a')).toBeFalsy();
      expect(P.quickCommand('')).toBeFalsy();
    });

    it('anlamsız metin öneri üretmez', function(){
      expect(P.quickCommand('qwertyuiop asdfgh')).toBeFalsy();
    });

    it('tanınan cümle öneriye dönüşür', function(){
      resetState();
      const c = P.quickCommand('8 saat uyudum');
      expect(c).toBeTruthy();
      expect(c.label.length).toBeGreaterThan(0);
      expect(typeof c.run).toBe('function');
    });

    it('birden çok kayıt tek komutta sayılır', function(){
      resetState();
      const c = P.quickCommand('8 saat uyudum ve 70 kilo geldim');
      expect(c).toBeTruthy();
      expect(c.hint).toContain('kayıt');
    });

    it('öneri komutu KENDİLİĞİNDEN KAYDETMEZ', function(){
      /* Komut yalnızca önizlemeyi açar; onaysız hiçbir şey yazılmaz.
         `run` çağrılmadığı sürece durum değişmemeli. */
      resetState();
      const once = JSON.stringify(SP.S.vitals || {});
      P.quickCommand('8 saat uyudum');
      expect(JSON.stringify(SP.S.vitals || {})).toBe(once);
    });
  });
})();
