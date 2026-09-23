/* PWA — çevrimdışı kabuğun kaydı (brand/ortak/pwa.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/pwa.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler:
     1. Yalnız http(s) ile açılınca kaydedilir; file:// hiç denenmez.
     2. Kayıt olmazsa hata fırlamaz, sonuç döner.
     3. İlk açılışın dosyaları kabuğa gönderilir; başka köken gönderilmez.

   Kabuğun kendisi (`sw.js`) tarayıcıda uçtan uca denenir: her modülün
   duman testi sayfayı çevrimdışı yeniden açar. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const P = () => window.LIFEOS.Pwa;

  function sahteNav(o){
    o = o || {};
    const kayitlar = [], mesajlar = [];
    const isci = { postMessage:m => mesajlar.push(m) };
    const nav = { serviceWorker:{
      register:async (yol, sec) => {
        if(o.red) throw new Error('404');
        kayitlar.push([yol, sec.scope]);
        return { active:isci };
      },
      ready:Promise.resolve({ active:isci }),
    } };
    return { nav, kayitlar, mesajlar };
  }
  const yer = (href) => { const u = new URL(href); return { href, protocol:u.protocol, origin:u.origin }; };
  const perf = (adlar) => ({ getEntriesByType:t => t === 'resource' ? adlar.map(name => ({ name })) : [] });

  describe('PWA — kabuğun kaydı', () => {
    it('yalnız http(s) uygun; file:// ve desteksiz tarayıcı değil', () => {
      const { nav } = sahteNav();
      expect(P().uygun(yer('http://127.0.0.1:4173/'), nav)).toBe(true);
      expect(P().uygun(yer('https://ornek.org/rota.html'), nav)).toBe(true);
      expect(P().uygun(yer('file:///home/ben/rota.html'), nav)).toBe(false);
      expect(P().uygun(yer('http://127.0.0.1:4173/'), {})).toBe(false);
    });

    it('file:// ile hiçbir şey denenmez ve nedeni söylenir', async () => {
      const s = sahteNav();
      const r = await P().kaydet({ location:yer('file:///home/ben/rota.html'), navigator:s.nav });
      expect(r).toEqual({ ok:false, neden:'dosya' });
      expect(s.kayitlar).toHaveLength(0);
    });

    it('sunucuyla kaydedilir; ilk açılışın aynı kökenli dosyaları gönderilir', async () => {
      const s = sahteNav();
      const r = await P().kaydet({ location:yer('http://127.0.0.1:4173/#bugun'), navigator:s.nav,
        performance:perf(['http://127.0.0.1:4173/js/app.js', 'https://fonts.gstatic.com/x.woff2',
          'http://127.0.0.1:4200/api/status', 'http://127.0.0.1:4173/js/app.js',
          'http://127.0.0.1:4173/img/brand/favicon.png#x']) });
      expect(r.ok).toBe(true);
      expect(s.kayitlar).toEqual([['sw.js', './']]);
      expect(s.mesajlar).toEqual([{ tur:'onbellek', adresler:['http://127.0.0.1:4173/',
        'http://127.0.0.1:4173/js/app.js', 'http://127.0.0.1:4173/img/brand/favicon.png'] }]);
    });

    it('kayıt reddedilirse hata fırlamaz', async () => {
      const s = sahteNav({ red:true });
      const r = await P().kaydet({ location:yer('http://127.0.0.1:4173/'), navigator:s.nav });
      expect(r.ok).toBe(false);
      expect(r.neden).toBe('kayit');
      expect(s.mesajlar).toHaveLength(0);
    });

    it('gönderilen adres sayısı sınırlıdır', () => {
      const cok = [];
      for(let i = 0; i < 600; i++) cok.push('http://127.0.0.1:4173/img/' + i + '.png');
      expect(P().adresler(yer('http://127.0.0.1:4173/'), perf(cok))).toHaveLength(P().EN_COK);
    });
  });
})();
