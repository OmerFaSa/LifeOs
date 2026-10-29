/* Ayarlar — bölüm bölüm tek ayar paneli.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ayarlar.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: panel bölümlere ayrılır, yalnız seçili bölüm
   görünür ve sekme bir tıkla değişir; modülün verdiği tema seçicisi ve
   ortak seçiciler yerindedir; yazı tipi kalıcıdır ve köke yazılır;
   hesap sunucusu yokken boşa basılan düğme yok, durum söylenir. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const A = window.LIFEOS.AYARLAR;

  function koy(o){
    const d = document.createElement('div');
    d.innerHTML = A.html(o || { tema:'<div class="tema-ornek"></div>', profil:{ ad:'Ömer', alt:'Örnek', route:'profiles' },
      modul:[{ ad:'Genel', route:'guide' }, { ad:'Rütbe', route:'rutbe' }] });
    document.body.appendChild(d);
    return d;
  }

  describe('Ayarlar (bölümlü panel)', () => {
    it('altı bölüm; yalnız seçili olan görünür, sekmeye basınca değişir', () => {
      A._sec('gorunum');
      const d = koy();
      try{
        const sek = Array.from(d.querySelectorAll('[data-ayar-bolum]'));
        expect(sek.map(s => s.textContent)).toEqual(['Görünüm', 'Animasyon', 'Ses', 'Minikler ve King', 'Hesap', 'Bu modül']);
        const gorunen = () => Array.from(d.querySelectorAll('.ayarlar__bolum')).filter(s => !s.hidden).map(s => s.id);
        expect(gorunen()).toEqual(['ayarlar-bolum-gorunum']);
        sek[2].click();
        expect(gorunen()).toEqual(['ayarlar-bolum-ses']);
        expect(sek[2].getAttribute('aria-selected')).toBe('true');
        expect(sek[0].getAttribute('aria-selected')).toBe('false');
      }finally{ d.remove(); A._sec('gorunum'); }
    });

    it('modülün tema seçicisi Görünüm’de, modülün ekranları «Bu modül»de', () => {
      const d = koy();
      try{
        expect(!!d.querySelector('#ayarlar-bolum-gorunum .tema-ornek')).toBe(true);
        const r = Array.from(d.querySelectorAll('#ayarlar-bolum-modul [data-route]')).map(b => b.getAttribute('data-route'));
        expect(r).toEqual(['guide', 'rutbe']);
        expect(d.querySelector('#ayarlar-bolum-hesap [data-route]').getAttribute('data-route')).toBe('profiles');
      }finally{ d.remove(); }
    });

    it('yazı tipi seçilince köke yazılır ve kalıcıdır; Inter varsayılandır', () => {
      let eski = null;
      try{ eski = localStorage.getItem('lifeos.yazi'); }catch(e){}
      const d = koy();
      try{
        d.querySelector('[data-yazi-sec="manrope"]').click();
        expect(document.documentElement.getAttribute('data-yazi')).toBe('manrope');
        expect(A.yazi()).toBe('manrope');
        expect(d.querySelector('[data-yazi-sec="manrope"]').getAttribute('aria-checked')).toBe('true');
        expect(A.yaziAyarla('yok-boyle')).toBe(false);
        A.yaziAyarla('inter');
        expect(document.documentElement.hasAttribute('data-yazi')).toBe(false);
        expect(A.yazi()).toBe('inter');
      }finally{
        d.remove();
        A.yaziAyarla(eski || 'inter');
      }
    });

    it('hesap sunucusu yokken düğme yok, durum söylenir', () => {
      const d = koy();
      try{
        const h = d.querySelector('#ayarlar-bolum-hesap');
        const var_ = !!(window.LIFEOS.HESAP && window.LIFEOS.HESAP.dugme && !window.LIFEOS.HESAP.dugme().gizli);
        expect(!!h.querySelector('[data-ayarlar-hesap]')).toBe(var_);
        if(!var_) expect(h.textContent.indexOf('sunucusu kapalı') >= 0).toBe(true);
      }finally{ d.remove(); }
    });
  });
})();
