/* MÜZİK — istemci (brand/ortak/muzik.js). Kaynağı brand/ortak/muzik.test.js. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const M = () => window.LIFEOS.MUZIK;
  const DIZIN = () => ({
    parcalar:[{ id:'aaaaaaaaaaa1', ad:'Odak', tur:'audio/mpeg' }, { id:'aaaaaaaaaaa2', ad:'Koşu', tur:'audio/mpeg' }, { id:'aaaaaaaaaaa3', ad:'Sakin', tur:'audio/ogg' }],
    listeler:{ genel:['aaaaaaaaaaa1'], calisma:['aaaaaaaaaaa1'], spor:['aaaaaaaaaaa2'], arka:['aaaaaaaaaaa3', 'aaaaaaaaaaa1'] },
    acilis:{ id:'aaaaaaaaaaa2', bas:5, bit:12, ses:.5, ne:'her' }, arka:{ acik:true, ses:.3, karistir:false } });
  function sahne(d, fn){
    const giden = [];
    M()._ortam({ sunucu:() => true, simdi:() => new Date(2026, 9, 30, 9),
      fetch:(u, o) => { giden.push([u, o]); return Promise.resolve(new Response(JSON.stringify(d), { status:200 })); } });
    M()._sifirla(d);
    const a = M()._ses();
    a.play = () => Promise.resolve();
    try{ return fn(giden, a); }finally{ M()._sifirla(null); M()._ortam(); }
  }

  describe('Müzik · listeler ve çalma', () => {
    it('liste çalar, yalnız var olan parça; boş liste bunu söyler', () => sahne(DIZIN(), (g, a) => {
      expect(M().cal('spor')).toBe(true);
      expect(a.src).toContain('/api/muzik/parca/aaaaaaaaaaa2');
      expect(M().durum().kip).toBe('spor');
      const d = DIZIN(); d.listeler.genel = ['yok-boyle'];
      M()._sifirla(d);
      expect(M().cal('genel')).toBe(false);
      expect(M().panelHtml()).toContain('Bu listede parça yok');
    }));
    it('açılış kesiti: seçilen saniyeden başlar, sesi kendi; «günde bir» aynı gün ikinci kez çalmaz', () => sahne(DIZIN(), (g, a) => {
      const once = localStorage.getItem(M().ACILIS_GUN);
      try{
        expect(M().acilisCal()).toBe(true);
        expect(M().durum().kip).toBe('acilis');
        expect(a.volume).toBe(.5);
        const d = DIZIN(); d.acilis.ne = 'gunde';
        M()._sifirla(d);
        localStorage.setItem(M().ACILIS_GUN, '2026-10-30');
        expect(M().acilisCal()).toBe(false);
        d.acilis.ne = 'kapali';
        M()._sifirla(d);
        localStorage.removeItem(M().ACILIS_GUN);
        expect(M().acilisCal()).toBe(false);
      }finally{ if(once == null) localStorage.removeItem(M().ACILIS_GUN); else localStorage.setItem(M().ACILIS_GUN, once); }
    }));
    it('arka plan: açıksa kendi sesiyle çalar; sustur bu oturumda durdurur, yeniden açınca sürer', () => sahne(DIZIN(), (g, a) => {
      expect(M().arkaBaslat()).toBe(true);
      expect(M().durum().kip).toBe('arka');
      expect(a.volume).toBe(.3);
      expect(M().susturAc()).toBe(true);
      expect(M().durum().kip).toBe(null);
      expect(M().arkaBaslat()).toBe(false);
      expect(M().susturAc()).toBe(false);
      expect(M().durum().kip).toBe('arka');
    }));
    it('çalışma oturumu «Çalışırken» listesine geçer, bitince arka plana döner', () => sahne(DIZIN(), () => {
      M().arkaBaslat();
      window.dispatchEvent(new CustomEvent('lifeos:calisma', { detail:{ acik:true } }));
      expect(M().durum().kip).toBe('calisma');
      window.dispatchEvent(new CustomEvent('lifeos:calisma', { detail:{ acik:false } }));
      expect(M().durum().kip).toBe('arka');
    }));
    it('radyo başlarsa müzik susar', () => sahne(DIZIN(), () => {
      M().cal('genel');
      window.dispatchEvent(new CustomEvent('lifeos:ses', { detail:{ hal:'caliyor' } }));
      expect(M().durum().kip).toBe(null);
    }));
    it('ayar: parçayı listeye atamak sunucuya listeler olarak gider, özel başlıkla', () => sahne(DIZIN(), g => {
      const d = document.createElement('div'); d.innerHTML = M().ayarHtml(); document.body.appendChild(d);
      try{
        d.querySelector('[data-muzik-ata="spor|aaaaaaaaaaa1"]').click();
        const [u, o] = g[g.length - 1];
        expect(u).toBe('/api/muzik/ayar');
        expect(o.headers['X-LifeOS']).toBe('muzik');
        expect(JSON.parse(o.body).listeler.spor).toEqual(['aaaaaaaaaaa2', 'aaaaaaaaaaa1']);
        expect(d.querySelectorAll('.muzik__parca').length).toBe(3);
      }finally{ d.remove(); }
    }));
    it('sunucu yoksa uydurmaz: panel ve ayar bunu söyler', () => {
      M()._ortam({ sunucu:() => false });
      try{
        expect(M().panelHtml()).toContain('bu bilgisayarda LifeOS açıkken');
        expect(M().ayarHtml()).toContain('telefonda ve tek dosya sürümünde yoktur');
      }finally{ M()._ortam(); }
    });
  });
})();
