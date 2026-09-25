/* 112 Çakışma — dilim düzeyi (kullanıcı kararı 2026-09-25).
   Tek kaynak `brand/ortak/cakismadilim.test.js`. Saat yok; hedefin vakti
   günün hangi diliminde. Sözler: dilim yalnız vakitle ve tek dilim
   yazılmışsa okunur; hedef ağı dilimi HKM'ye yollar; aynı dilimde iki
   modül yan yana çizilir; dilimi bilinmeyen ne çakışır ne çakışmaz;
   HKM bütçesi yoksa kart yok. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const L = () => window.LIFEOS;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
  const A = { modul:'ays', ad:'TYT paragraf', dilim:'aksam', gunluk_dk:60 };
  const B = { modul:'spi', ad:'Koşu', dilim:'aksam', gunluk_dk:45 };

  describe('112 Çakışma · dilim düzeyi', () => {
    it('oz-112 hedef cümlesinden dilim: yalnız vakitle ve tek dilimse', () => {
      const k = t => L().Hedef.kapasiteAyikla(t, false).kapasite;
      expect(k('akşamları günde 1 saat çalışacağım')).toEqual({ gunluk_dk:60, dilim:'aksam' });
      expect(k('öğleden sonra günde 2 saat').dilim).toBe('ogle');
      expect(k('sabah ve akşam günde 20 dk')).toEqual({ gunluk_dk:20 });
      expect(k('akşam kitap okuyacağım')).toBe(null);
      const o = L().HedefAg.ozet({ id:'h1', cumle:'x', durum:'aktif', kapasite:{ gunluk_dk:60, dilim:'aksam' } });
      expect(o.kapasite).toEqual({ gunluk_dk:60, haftalik_gun:7, dilim:'aksam' });
      expect(L().HedefAg.ozet({ id:'h2', cumle:'x', durum:'aktif', kapasite:{ gunluk_dk:30 } }).kapasite)
        .toEqual({ gunluk_dk:30, haftalik_gun:7 });
    });

    it('oz-112 aynı dilim yan yana çizilir; farklı ya da bilinmeyen dilim çizilmez', () => {
      const k = dom(L().ONERI.cakismaHtml({ a:A, b:B })).querySelector('[data-oz="112"]');
      expect(k.querySelector('.cakisma__bas').textContent).toBe('İkisi de akşam dilimini istiyor');
      const s = k.querySelectorAll('.cakisma__saat');
      expect(s[0].textContent).toBe('akşam · günde 60 dk');
      expect(k.querySelectorAll('button').length).toBe(0);
      expect(L().ONERI.cakismaHtml({ a:A, b:Object.assign({}, B, { dilim:'sabah' }) })).toBe('');
      expect(L().ONERI.dilimCakisma(A, { modul:'spi' })).toBe(null);
      expect(L().ONERI.cakismaHtml({ a:A, b:{ modul:'spi', ad:'x' } })).toBe('');
    });

    it('oz-112 HKM bütçesinden ilk çakışma; bütçe yoksa kart yok', () => {
      expect(L().ONERI.butceCakismaHtml(null)).toBe('');
      expect(L().ONERI.butceCakismaHtml({ cakismalar:[] })).toBe('');
      const k = dom(L().ONERI.butceCakismaHtml({ cakismalar:[{ a:A, b:B }, { a:A, b:B }] }));
      expect(k.querySelectorAll('[data-oz="112"]').length).toBe(1);
      expect(k.textContent).toContain('1 çakışma daha');
    });
  });
})();
