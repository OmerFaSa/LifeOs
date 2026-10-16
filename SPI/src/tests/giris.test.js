/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/giris.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Giriş — üç arayüzde tek satırda veri girme kapısı. Tek kaynak
   `brand/ortak/giris.test.js`. Kanıtlanan sözler (brand/ortak/giris.js):
     1. Hiçbir şey doğrudan kaydedilmez: önizleme, sonra «Kaydet».
     2. Anlaşılmayan uydurulmaz: «anlayamadım» ve örnekler; kayıt yok.
     3. King, modül kendi veri kapısını vermediyse bu kapıyı kullanır.
     4. Modül kurulduysa Bugün ekranında kutu var; örnek çipi girdiyi doldurur. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const G = () => window.LIFEOS.GIRIS;

  function sahteKur(){
    const yazilan = [];
    const eski = G().kuruluMu() ? null : 'yok';
    G()._sifirla();
    G().kur({ modul:'deneme', ornekler:['uyku 7', '40 soru'],
      onizle:t => /^uyku \d/.test(t) ? { metin:'Uyku: ' + t.split(' ')[1] + ' sa', ipucu:'bugüne',
        kaydet:async () => { yazilan.push(t); return 'Kaydedildi.'; } } : null });
    return { yazilan, eski };
  }

  describe('Giriş — tek satır kapısı', () => {
    it('önizler, «Kaydet» denmeden yazmaz; Kaydet ile yazar ve sonucu söyler', async () => {
      const { yazilan } = sahteKur();
      try{
        const k = document.createElement('div');
        k.innerHTML = G().kutuHtml();
        document.body.appendChild(k);
        try{
          const p = G().gonder('uyku 7');
          expect(!!p).toBe(true);
          expect(yazilan.length).toBe(0);
          expect(k.querySelector('[data-giris-sonuc]').textContent).toContain('Uyku: 7 sa');
          expect(k.querySelector('[data-giris="kaydet"]') !== null).toBe(true);
          expect(await G().kaydet()).toBe('Kaydedildi.');
          expect(yazilan).toEqual(['uyku 7']);
          expect(k.querySelector('[data-giris-sonuc]').textContent).toContain('Kaydedildi');
        }finally{ k.remove(); }
      }finally{ G()._sifirla(); }
    });

    it('anlaşılmayanı uydurmaz: «anlayamadım» ve örnekler, Kaydet düğmesi yok', () => {
      sahteKur();
      try{
        expect(G().gonder('bugün hava güzel')).toBe(null);
        expect(G().durum().mesaj).toContain('anlayamadım');
        expect(G().durum().mesaj).toContain('uyku 7');
        expect(G().durum().bekleyen).toBe(null);
      }finally{ G()._sifirla(); }
    });

    it('kurulmadıysa kutu çizilmez; örnek çipi girdiyi doldurur', () => {
      G()._sifirla();
      expect(G().kutuHtml()).toBe('');
      sahteKur();
      const k = document.createElement('div');
      k.innerHTML = G().kutuHtml();
      document.body.appendChild(k);
      try{
        k.querySelector('[data-giris-ornek="40 soru"]').dispatchEvent(new MouseEvent('click', { bubbles:true }));
        expect(document.getElementById('giris-girdi').value).toBe('40 soru');
      }finally{ k.remove(); G()._sifirla(); }
    });

    it('önizlenen metinde yeniden Enter kaydeder; metin değiştiyse yeniden önizler', async () => {
      const { yazilan } = sahteKur();
      try{
        G().gonder('uyku 7');
        expect(yazilan.length).toBe(0);
        G().gonder('uyku 8');            /* değişti: yeni önizleme, kayıt yok */
        expect(yazilan.length).toBe(0);
        expect(G().durum().bekleyen).toBe('Uyku: 8 sa');
        G().gonder('uyku 8');            /* aynı metin: açık onay */
        await new Promise(r => setTimeout(r, 0));
        expect(yazilan).toEqual(['uyku 8']);
        expect(G().durum().bekleyen).toBe(null);
      }finally{ G()._sifirla(); }
    });

    it('anlaşılmayınca örnek çipleri mesajın altında; yer tutucu ilk örnek', () => {
      sahteKur();
      const k = document.createElement('div');
      try{
        k.innerHTML = G().kutuHtml();
        document.body.appendChild(k);
        expect(k.querySelector('#giris-girdi').getAttribute('placeholder')).toBe('Örneğin: uyku 7');
        G().gonder('falan filan');
        expect(!!k.querySelector('[data-giris-sonuc] [data-giris-ornek]')).toBe(true);
      }finally{ k.remove(); G()._sifirla(); }
    });

    it('King kendi veri kapısı yoksa bu kapıyı kullanır', () => {
      const K = window.LIFEOS.KING;
      sahteKur();
      try{
        K._sifirla();
        K.kur({ modul:'spi', git:() => {}, ozet:() => [] });
        const y = K.yorumla('uyku 7');
        expect(y.tur).toBe('veri');
        expect(y.onizleme.metin).toBe('Uyku: 7 sa');
      }finally{ K._sifirla(); G()._sifirla(); }
    });
  });
})();
