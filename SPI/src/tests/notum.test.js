/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/notum.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Notum — öğrenme ekranlarında kendi notun. Tek kaynak
   `brand/ortak/notum.test.js`. Kanıtlanan sözler (brand/ortak/notum.js):
     1. Bağlam başına bir not; modülün deposunda `notum/<bağlam>`.
     2. Ekle sona yazar, ezmez; sınır korunur; yükle depodan geri getirir.
     3. Kurulmadıysa kutu çizilmez; kurulduysa notu gösterir.
     4. Öğrenme yüzeyi sınıfları CSS'te tanımlı (önce karşılıksız yardımcı
        sınıflar vardı). */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const N = () => window.LIFEOS.NOTUM;

  function sahteDepo(){
    const d = {};
    return { d, store:{ set:async (p, v) => { d[p] = v; }, list:async c => Object.keys(d).filter(k => k.indexOf(c + '/') === 0).map(k => d[k]) } };
  }

  describe('Notum — öğrenme notu', () => {
    it('bağlama yazar, sona ekler, ezmez; depoda notum/<bağlam>; yükle geri getirir', async () => {
      const { d, store } = sahteDepo();
      N()._sifirla();
      N().kur({ modul:'deneme', store });
      try{
        await N().yaz('konu:l-ses', 'ilk');
        await N().ekle('konu:l-ses', '  ikinci   satır ');
        expect(N().oku('konu:l-ses')).toBe('ilk\nikinci satır');
        expect(d['notum/konu-l-ses'].metin).toBe('ilk\nikinci satır');
        expect(await N().ekle('konu:l-ses', '   ')).toBe(null);
        await N().yaz('kavramlar', 'x'.repeat(N().SINIR + 10));
        expect(N().oku('kavramlar').length).toBe(N().SINIR);
        N()._sifirla();
        N().kur({ modul:'deneme', store });
        expect(N().oku('konu:l-ses')).toBe('');
        expect(await N().yukle()).toBe(2);
        expect(N().oku('konu:l-ses')).toBe('ilk\nikinci satır');
      }finally{ N()._sifirla(); }
    });

    it('kurulmadıysa kutu yok; kurulduysa kutu notu gösterir', async () => {
      N()._sifirla();
      expect(N().kutuHtml('kavramlar')).toBe('');
      const { store } = sahteDepo();
      N().kur({ modul:'deneme', store });
      try{
        await N().yaz('kavramlar', 'kalp hızı rezervi');
        const k = document.createElement('div');
        k.innerHTML = N().kutuHtml('kavramlar', { baslik:'Kavram notlarım' });
        expect(k.querySelector('textarea[data-notum="kavramlar"]').value).toBe('kalp hızı rezervi');
        expect(k.textContent).toContain('Kavram notlarım');
      }finally{ N()._sifirla(); }
    });

    it('öğrenme yüzeyi sınıfları CSS’te tanımlı', () => {
      const d = document.createElement('div'); d.className = 'ogrenme';
      const k = document.createElement('div'); k.className = 'ogrenme__kutu';
      document.body.appendChild(d); document.body.appendChild(k);
      try{
        expect(getComputedStyle(d).paddingTop).toBe('12px');
        expect(getComputedStyle(k).paddingTop).toBe('8px');
      }finally{ d.remove(); k.remove(); }
    });
  });
})();
