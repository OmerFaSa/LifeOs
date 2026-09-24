/* HKM bağı — tek profil (brand/ortak/hkmbag.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hkmbag.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı söz (ekip/HATALAR.md Y-7): HKM profil bilmez; aynı cihazda
   iki profil bağlanınca ölçümleri, hafızası, hedefleri ve yedeği karışır.
   Bu yüzden bir modülde HKM'ye aynı anda TEK profil bağlanabilir. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const H = () => window.LIFEOS.HkmBag;
  const MOD = 'deneme-mod';
  function temizle(){ try{ localStorage.removeItem(H().anahtar(MOD)); }catch(e){} }

  describe('HKM bağı — tek profil', () => {
    it('boşken ilk profil alır; öteki profil alamaz, sahibi söylenir', () => {
      temizle();
      expect(H().sahip(MOD)).toBe(null);
      expect(H().izinli(MOD, 'ben')).toBe(true);
      expect(H().al(MOD, 'ben').ok).toBe(true);
      expect(H().al(MOD, 'ben').ok).toBe(true);          /* aynı profil tekrar alabilir */
      const r = H().al(MOD, 'kardes');
      expect(r.ok).toBe(false);
      expect(r.sahip).toBe('ben');
      expect(H().izinli(MOD, 'kardes')).toBe(false);
      expect(H().not('ben')).toContain('başka profile bağlı');
      temizle();
    });

    it('yalnız sahibi bırakabilir; bırakınca öteki alabilir', () => {
      temizle();
      H().al(MOD, 'ben');
      H().birak(MOD, 'kardes');
      expect(H().sahip(MOD)).toBe('ben');
      H().birak(MOD, 'ben');
      expect(H().sahip(MOD)).toBe(null);
      expect(H().al(MOD, 'kardes').ok).toBe(true);
      temizle();
    });

    it('modüller birbirinden bağımsızdır', () => {
      temizle();
      H().al(MOD, 'ben');
      expect(H().izinli(MOD + '-2', 'kardes')).toBe(true);
      temizle();
    });
  });
})();
