/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/gorsel.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Görsel denetimi — tek kaynak `brand/ortak/gorsel.test.js`.

   Kanıtlanan söz: uyarı yalnız dosya olarak açılışta ve görsel
   yüklenemediğinde çıkar; sunucuyla açılışta hiç çıkmaz. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const G = () => window.LIFEOS.Gorsel;

  describe('Görsel denetimi', () => {
    it('dosya olarak açılıp görsel yüklenemezse nasıl düzeleceğini söyler', () => {
      const m = G().karar('file:', false);
      expect(m).toContain('BASLAT.bat');
      expect(m).toContain('build.py');
    });
    it('görsel yüklendiyse ya da sunucuyla açıldıysa susar', () => {
      expect(G().karar('file:', true)).toBe(null);
      expect(G().karar('http:', false)).toBe(null);
      expect(G().karar('https:', false)).toBe(null);
    });
  });
})();
