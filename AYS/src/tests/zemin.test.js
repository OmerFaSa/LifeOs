/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/zemin.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Zemin — yumuşak renk zemini ve içeriğin arkasındaki buzlu yüzey.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/zemin.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: varsayılan Yumuşak'tır ve ilk çizimden önce
   `<html data-zemin>` olarak konur; Sade eski düz zemine döner; seçim
   kalıcıdır ve modül geçişinde taşınır; buzlu yüzey içerik sütununun
   ARKASINDADIR ve ekranı kaplamaz (kenarlardan içeride, telefonda yok);
   kartlar opak kalır (okunan şey camın arkasında durmaz). */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const Z = window.LIFEOS.ZEMIN;

  function kipleSina(fn){
    let eski = null;
    try{ eski = localStorage.getItem(Z.ANAHTAR); }catch(e){}
    try{ return fn(); }
    finally{
      try{ if(eski == null) localStorage.removeItem(Z.ANAHTAR); else localStorage.setItem(Z.ANAHTAR, eski); }catch(e){}
      Z.yenile();
    }
  }
  function sayfaKur(){
    const d = document.createElement('div');
    d.innerHTML = '<div class="site site--v5"><div class="site__body"><div class="wrapc sayfa" style="width:900px">'
      + '<div class="card" style="height:40px">kart</div></div></div></div>';
    document.body.appendChild(d);
    return d;
  }

  describe('Zemin (Yumuşak · Sade)', () => {
    it('varsayılan Yumuşak; <html data-zemin> ilk çizimden önce konur', () => kipleSina(() => {
      try{ localStorage.removeItem(Z.ANAHTAR); }catch(e){}
      Z.yenile();
      expect(Z.kip()).toBe('yumusak');
      expect(document.documentElement.getAttribute('data-zemin')).toBe('yumusak');
    }));

    it('Yumuşak: renk zemini sabit katmanda, buzlu yüzey içeriğin arkasında ve ekranı kaplamaz', () => kipleSina(() => {
      Z.ayarla('yumusak');
      const d = sayfaKur();
      try{
        const zemin = getComputedStyle(document.body, '::before');
        expect(zemin.position).toBe('fixed');
        expect(zemin.backgroundImage.indexOf('radial-gradient') >= 0).toBe(true);
        expect(getComputedStyle(document.body).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        const s = d.querySelector('.sayfa');
        const buz = getComputedStyle(s, '::before');
        expect(buz.content !== 'none').toBe(true);
        expect(buz.zIndex).toBe('-1');
        expect(buz.borderTopLeftRadius).toBe('32px');
        /* Kenarlardan içeride: tam ekran değil, sütunun kendisi. */
        expect(parseFloat(buz.left) > 0 && parseFloat(buz.right) > 0 && parseFloat(buz.top) > 0).toBe(true);
        /* Yeni yığın bağlamı açılmaz: sayfanın içindeki katmanlar üst
           şeridin ve kenarın üstüne/altına eskisi gibi oturur. */
        expect(getComputedStyle(s).zIndex).toBe('auto');
        expect(getComputedStyle(s).isolation).toBe('auto');
        /* Kart opak kalır (saydamlık payı olan renk «rgba(…)» diye döner). */
        expect(getComputedStyle(d.querySelector('.card')).backgroundColor.indexOf('rgb(')).toBe(0);
      }finally{ d.remove(); }
    }));

    it('Sade: düz zemin, buzlu yüzey yok', () => kipleSina(() => {
      Z.ayarla('sade');
      const d = sayfaKur();
      try{
        expect(document.documentElement.getAttribute('data-zemin')).toBe('sade');
        expect(getComputedStyle(document.body, '::before').backgroundImage.indexOf('radial-gradient')).toBe(-1);
        expect(getComputedStyle(d.querySelector('.sayfa'), '::before').content).toBe('none');
      }finally{ d.remove(); }
    }));

    it('seçim kalıcı; Görünüm satırı yerinde güncellenir; modül geçişinde taşınır', () => kipleSina(() => {
      const d = document.createElement('div');
      d.innerHTML = Z.seciciHtml();
      document.body.appendChild(d);
      try{
        expect(Array.from(d.querySelectorAll('[data-zemin-sec]')).map(b => b.textContent.trim())).toEqual(['Yumuşak', 'Sade']);
        d.querySelector('[data-zemin-sec="sade"]').dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
        expect(localStorage.getItem(Z.ANAHTAR)).toBe('sade');
        expect(d.querySelector('[data-zemin-sec="sade"]').getAttribute('aria-pressed')).toBe('true');
        expect(d.querySelector('[data-zemin-sec="yumusak"]').getAttribute('aria-pressed')).toBe('false');
        expect(Z.ayarla('cicekli')).toBe(false);
        expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(Z.ANAHTAR) >= 0).toBe(true);
      }finally{ d.remove(); }
    }));
  });
})();
