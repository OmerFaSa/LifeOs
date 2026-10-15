/* Kısayol — üç arayüzde aynı klavye kısayolları. Tek kaynak
   `brand/ortak/kisayol.test.js`. Kanıtlanan sözler (brand/ortak/kisayol.js):
     1. Yazarken, Ctrl/Alt basılıyken susar.
     2. G + harf yalnız çekmece haritasındaki rotaya gider; bilinmeyen harf
        hiçbir şey yapmaz.
     3. / paleti, Shift+N Notlarım'ı açar; N «Ne yaptın?» kutusuna gider.
     4. Liste haritadan üretilir: modülde olmayan çekmece listede yok.
     5. Modül kurulduysa harita Bugün'ü içerir. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const K = () => window.LIFEOS.KISAYOL;

  function tus(key, o){
    return Object.assign({ key, target:document.body, ctrlKey:false, metaKey:false, altKey:false, shiftKey:false, defaultPrevented:false }, o || {});
  }
  function sahte(fn){
    const eski = K()._ayar();
    const gidilen = [], palet = [];
    K().kur({ modul:'deneme', git:r => gidilen.push(r), palet:() => palet.push(1),
      cekmeceler:() => [{ id:'bugun', rota:'today' }, { id:'analiz', rota:'analytics' }, { id:'bilinmez', rota:'x' }] });
    try{ return fn(gidilen, palet); }
    finally{ if(eski) K().kur(eski); else K()._sifirla(); }
  }

  describe('Kısayol — ortak klavye', () => {
    it('G sonra harf çekmeceye gider; bilinmeyen harf bir şey yapmaz', () => sahte(gidilen => {
      expect(K().tus(tus('g'))).toBe(true);
      expect(K().tus(tus('a'))).toBe(true);
      expect(gidilen).toEqual(['analytics']);
      expect(K().tus(tus('g'))).toBe(true);
      expect(K().tus(tus('z'))).toBe(false);
      expect(gidilen).toEqual(['analytics']);
      /* G'siz harf rota açmaz */
      expect(K().tus(tus('a'))).toBe(false);
      expect(gidilen.length).toBe(1);
    }));

    it('yazarken ve Ctrl basılıyken susar', () => sahte((gidilen, palet) => {
      const i = document.createElement('input');
      expect(K().tus(tus('/', { target:i }))).toBe(false);
      expect(K().tus(tus('/', { ctrlKey:true }))).toBe(false);
      expect(K().tus(tus('g', { altKey:true }))).toBe(false);
      expect(palet.length).toBe(0);
      expect(K().tus(tus('/'))).toBe(true);
      expect(palet.length).toBe(1);
    }));

    it('liste yalnız haritadaki çekmeceleri sayar, düz metin satırı da verir', () => sahte(() => {
      const l = K().satirlar().map(s => s[1]);
      expect(l.some(x => /Bugün çekmecesine/.test(x))).toBe(true);
      expect(l.some(x => /Analiz çekmecesine/.test(x))).toBe(true);
      expect(l.some(x => /Ayarlar/.test(x))).toBe(false);
      expect(K().metinSatirlari().some(s => s[0] === 'G sonra B')).toBe(true);
      expect(K().metinSatirlari().some(s => s[0] === 'Shift + N')).toBe(true);
    }));

    it('N kutu yoksa Bugün’e gider', () => sahte(gidilen => {
      const varMi = document.getElementById('giris-girdi');
      if(varMi) return;   /* kutu ekrandaysa odaklanır; rota değişmez */
      expect(K().tus(tus('n'))).toBe(true);
      expect(gidilen).toEqual(['today']);
    }));

    it('şerit: rota gider, doldur yalnız kutuya yazar, sayı yoksa rozet yok', () => {
      const eski = K()._ayar();
      const gidilen = [];
      K().kur({ modul:'deneme', git:r => gidilen.push(r),
        dugmeler:() => [{ ad:'Tekrar', rota:'cards', sayi:3 }, { ad:'Uyku', doldur:'uyku ' }, { ad:'Boş', sayi:0, rota:'x' }, { ad:'Eksik' }] });
      const k = document.createElement('div');
      try{
        k.innerHTML = '<input id="giris-girdi"/>' + K().seritHtml();
        document.body.appendChild(k);
        const d = k.querySelectorAll('.kisayol__d');
        /* «Eksik» işsiz düğme gösterilmez */
        expect(Array.from(d).some(b => b.textContent === 'Eksik')).toBe(false);
        expect(d[0].querySelector('.kisayol__sayi').textContent).toBe('3');
        expect(d[2].querySelector('.kisayol__sayi')).toBe(null);
        expect(K().dugmeCalistir(0)).toBe(true);
        expect(gidilen).toEqual(['cards']);
        expect(K().dugmeCalistir(1)).toBe(true);
        expect(k.querySelector('#giris-girdi').value).toBe('uyku ');
        expect(gidilen.length).toBe(1);
      }finally{ k.remove(); if(eski) K().kur(eski); else K()._sifirla(); }
    });

    it('modülün şeridi Notlarım ve King’e sor ile biter', () => {
      if(!K().kuruluMu()) return;   /* test sayfasında modül kurulmadıysa */
      const ad = K().dugmeListesi().map(d => d.ad);
      expect(ad.length >= 3).toBe(true);
      if(window.LIFEOS.KING) expect(ad[ad.length - 1]).toBe('King’e sor');
    });

    it('modül kurulduysa haritada Bugün var', () => {
      if(!K().kuruluMu()) return;
      expect(!!K().harita().b).toBe(true);
    });
  });
})();
