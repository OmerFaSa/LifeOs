/* Ne değişti? — katalog 17 (T5).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/yenilik.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: ilk kez açana gösterilmez (sürüm sessizce yazılır);
   kurulumu bitmemiş kullanıcıya gösterilmez; yalnız başka bir sürüm
   görülmüşse gösterilir; «Kapat» deyince bir daha gösterilmez; kart yeni,
   düzeltilen ve kaldırılanı ayrı başlıkla verir ve metni kaçışlar; her
   madde düzgün bir cümledir (boş madde yok). */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const Y = window.LIFEOS.YENILIK;
  const M = 'test-yenilik';
  const sil = () => { try{ localStorage.removeItem('lifeos.yenilik.' + M); }catch(e){} };

  describe('Ne değişti? (17)', () => {
    it('ilk açılışta ve yeni kullanıcıya gösterilmez; güncellemede bir kez', () => {
      sil();
      try{
        expect(Y.gosterilmeliMi(M)).toBe(false);                     // ilk kez: yazıldı
        expect(localStorage.getItem('lifeos.yenilik.' + M)).toBe(Y.SURUM);
        localStorage.setItem('lifeos.yenilik.' + M, '2000-01-01');
        expect(Y.gosterilmeliMi(M, { yeniKullanici:true })).toBe(false);
        localStorage.setItem('lifeos.yenilik.' + M, '2000-01-01');
        expect(Y.gosterilmeliMi(M)).toBe(true);
        Y.kapat(M);
        expect(Y.gosterilmeliMi(M)).toBe(false);
      }finally{ sil(); }
    });

    it('kart üç başlıkla, kaçışlı; her madde dolu', () => {
      const d = document.createElement('div');
      d.innerHTML = Y.kartHtml('ays');
      const b = Array.from(d.querySelectorAll('.yenilik__baslik')).map(x => x.textContent);
      expect(b).toEqual(['Yeni', 'Düzeltilen', 'Kaldırılan']);
      expect(d.querySelector('[data-yenilik]').getAttribute('data-oz')).toBe('017');
      expect(d.querySelectorAll('button').length).toBe(1);
      Y.MADDELER.forEach(m => expect(String(m.metin).trim().length > 10).toBe(true));
      expect(Y.kartHtml('ays').indexOf('<script') < 0).toBe(true);
    });

    it('yerleştirme sayfanın başına bir kez; kapatınca kalkar', () => {
      sil();
      localStorage.setItem('lifeos.yenilik.' + M, '2000-01-01');
      Y._sifirla();
      const k = document.createElement('div');
      k.innerHTML = '<main id="main"><p>içerik</p></main>';
      document.body.appendChild(k);
      try{
        expect(Y.yerlestir(k, { modul:M })).toBe(true);
        expect(Y.yerlestir(k, { modul:M })).toBe(false);
        expect(k.querySelector('#main').firstElementChild.hasAttribute('data-yenilik')).toBe(true);
        k.querySelector('[data-yenilik-kapat]').click();
        expect(k.querySelectorAll('[data-yenilik]').length).toBe(0);
      }finally{ k.remove(); Y._sifirla(); sil(); }
    });
  });
})();
