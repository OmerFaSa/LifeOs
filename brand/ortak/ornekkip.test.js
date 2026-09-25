/* Örnek veri kipi (172) — tek kaynak `brand/ortak/ornekkip.test.js`.
   Sahte depoyla: giriş önceki profili hatırlar, çıkış yalnız örnek
   anahtarları siler ve geri döner; gerçek profilin anahtarı dokunulmaz. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const O = () => window.LIFEOS.OrnekKip;
  function depo(ilk){
    const m = Object.assign({}, ilk);
    return { m, getItem:k => (k in m ? m[k] : null), setItem:(k, v) => { m[k] = String(v); }, removeItem:k => { delete m[k]; } };
  }
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };

  describe('172 Örnek veri kipi', () => {
    it('oz-172 giriş örnek profile geçer; çıkış örnek anahtarları siler, gerçek profile döner', () => {
      const d = depo({ 'x.aktif':'ben', 'x.v1.ben':'GERÇEK' });
      const k = O().kur({ anahtar:'x.aktif', varsayilan:'ben', silinecek:['x.v1.ornek', 'x.v1.ornek.oncesi'], depo:d });
      expect(k.acik()).toBe(false);
      expect(k.gir()).toBe(true);
      expect(k.acik()).toBe(true);
      expect(k.gir()).toBe(false);
      d.setItem('x.v1.ornek', 'ÖRNEK');
      expect(k.cik()).toBe(true);
      expect(d.m['x.aktif']).toBe('ben');
      expect(d.m['x.v1.ornek']).toBe(undefined);
      expect(d.m['x.v1.ben']).toBe('GERÇEK');
      expect(d.m['x.aktif.ornekOncesi']).toBe(undefined);
      expect(k.cik()).toBe(false);
    });

    it('oz-172 çıkıştan sonra kapanışta yeniden yazılan örnek anahtar açılışta silinir', () => {
      /* Sayfa yenilenirken bekleyen kayıt örnek anahtarı geri yazabiliyordu
         (uçtan uca denemede görüldü); kur() örnek kipte DEĞİLKEN kalıntıyı siler. */
      const d = depo({ 'x.aktif':'ben', 'x.v1.ben':'GERÇEK', 'x.v1.ornek':'KALINTI' });
      O().kur({ anahtar:'x.aktif', varsayilan:'ben', silinecek:['x.v1.ornek'], depo:d });
      expect(d.m['x.v1.ornek']).toBe(undefined);
      expect(d.m['x.v1.ben']).toBe('GERÇEK');
      const d2 = depo({ 'x.aktif':'ornek', 'x.v1.ornek':'ÖRNEK' });
      O().kur({ anahtar:'x.aktif', varsayilan:'ben', silinecek:['x.v1.ornek'], depo:d2 });
      expect(d2.m['x.v1.ornek']).toBe('ÖRNEK');
    });

    it('oz-172 önceki profil bilinmiyorsa varsayılana döner', () => {
      const d = depo({ 'x.aktif':'ornek' });
      const k = O().kur({ anahtar:'x.aktif', varsayilan:'main', depo:d });
      expect(k.cik()).toBe(true);
      expect(d.m['x.aktif']).toBe('main');
    });

    it('oz-172 şerit tek düğmeyle çıkar; filigran okunmaz; ayar satırı sonucu söyler', () => {
      const s = dom(O().seritHtml());
      expect(s.querySelectorAll('button').length).toBe(1);
      expect(s.querySelector('[data-act="ornek-cik"]').textContent).toBe('Örnek veriden çık');
      expect(dom(O().filigranHtml()).firstChild.getAttribute('aria-hidden')).toBe('true');
      expect(dom(O().ayarHtml(false)).querySelector('[data-act="ornek-gir"]').textContent).toBe('Örnek veriye geç');
      expect(dom(O().ayarHtml(true)).querySelector('[data-act="ornek-cik"]')).toBeTruthy();
    });
  });
})();
