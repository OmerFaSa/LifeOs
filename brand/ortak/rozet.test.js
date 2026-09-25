/* Ana ekran rozeti (167) — tek kaynak `brand/ortak/rozet.test.js`.
   Gerçek widget PWA'da yok; rozet bekleyen onay sayısını simgeye yazar.
   Destek yoksa sessiz; aynı sayı tekrar yazılmaz; sıfır rozeti siler;
   tarayıcının reddi uygulamayı düşürmez. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const P = () => window.LIFEOS.Pwa;

  describe('167 Ana ekran rozeti', () => {
    it('oz-167 destek yoksa sessiz; hata fırlatmaz', () => {
      expect(P().rozetKur({})(3)).toBe(false);
      expect(P().rozetKur(null)).toBeTruthy();
    });

    it('oz-167 bekleyen sayı simgeye yazılır; aynısı tekrar yazılmaz; sıfır siler', () => {
      const giden = [];
      const nav = { setAppBadge:n => { giden.push(['yaz', n]); return Promise.resolve(); },
        clearAppBadge:() => { giden.push(['sil']); return Promise.resolve(); } };
      const r = P().rozetKur(nav);
      expect(r(2)).toBe(true);
      expect(r(2)).toBe(true);
      expect(r(0)).toBe(true);
      expect(r('3.7')).toBe(true);
      expect(giden).toEqual([['yaz', 2], ['sil'], ['yaz', 3]]);
    });

    it('oz-167 tarayıcı reddederse ya da fırlatırsa uygulama düşmez', async () => {
      const red = P().rozetKur({ setAppBadge:() => Promise.reject(new Error('izin yok')) });
      expect(red(1)).toBe(true);
      const firlat = P().rozetKur({ setAppBadge:() => { throw new Error('güvensiz bağlam'); } });
      expect(firlat(1)).toBe(false);
      await new Promise(ok => setTimeout(ok, 0));
    });

    it('oz-167 modül üst çubuğu bekleyen sayıyı rozete de verir', () => {
      const N = window.R || window.SP || window.ESP;
      const eski = P().rozet, gelen = [];
      P().rozet = n => { gelen.push(n); return true; };
      const kt = N.S.ui.kingTeklifler;
      try{
        N.S.ui.kingTeklifler = [{ id:1, konu:'x', durum:'bekliyor', secenekler:[] }];
        const beklenen = N.Screens.onaylar.bekleyen();
        N.App.onaySayisi();
        expect(gelen[gelen.length - 1]).toBe(beklenen);
        expect(beklenen >= 1).toBe(true);
      }finally{ P().rozet = eski; N.S.ui.kingTeklifler = kt; }
    });
  });
})();
