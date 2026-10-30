/* İÇE AKTARMA — istemci (brand/ortak/ice.js). Kaynağı brand/ortak/ice.test.js. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const I = () => window.LIFEOS.ICE;
  const VERI = () => ({
    takvim:{ var:true, olaylar:[{ bas:'2026-10-31T09:00', bit:'2026-10-31T10:00', tum_gun:false, ad:'Matematik <dersi>' }], hata:null },
    veri:{ adim:{ gunler:{ '2026-10-28':6400, '2026-10-29':8123 } }, youtube:{ gunler:{ '2026-10-29':12 }, kanallar:[['Khan Academy', 9]] } } });

  describe('İçe aktarma · Takeout dosyaları', () => {
    it('Google Fit günlük CSV: tarih ve adım sütunu, bozuk satır atlanır', () => {
      const csv = 'Date,Move Minutes count,Step count,Distance (m)\r\n2026-10-28,30,6400.0,4100\r\n2026-10-29,41,8123,5200\r\nbozuk,1,2,3\r\n2026-10-30,10,,0\r\n';
      expect(I().fitCoz(csv)).toEqual({ '2026-10-28':6400, '2026-10-29':8123 });
      expect(I().fitCoz('a,b\n1,2')).toBeNull();
    });
    it('YouTube izleme geçmişi: gün başına sayı ve en çok izlenen kanal', () => {
      const l = [
        { title:'A', subtitles:[{ name:'Khan Academy' }], time:'2026-10-29T10:00:00.000Z' },
        { title:'B', subtitles:[{ name:'Khan Academy' }], time:'2026-10-29T11:00:00.000Z' },
        { title:'C', subtitles:[{ name:'Başka' }], time:'2026-10-27T11:00:00.000Z' },
        { title:'Reklam', time:'yok' }];
      const o = I().youtubeCoz(JSON.stringify(l));
      expect(o.gunler['2026-10-29']).toBe(2);
      expect(o.kanallar[0]).toEqual(['Khan Academy', 2]);
      expect(I().youtubeCoz('{"x":1}')).toBeNull();
      expect(I().youtubeCoz('bozuk')).toBeNull();
    });
  });

  describe('İçe aktarma · görünüm', () => {
    it('veri yoksa Analiz kartı çizilmez; takvim üç modülde, adım yalnız SPİ’de, YouTube yalnız ESP’de', () => {
      I()._veri(null);
      expect(I().kartHtml('ays')).toBe('<div data-ice-kart="ays"></div>');
      I()._veri(VERI());
      try{
        const ays = I().kartHtml('ays'), spi = I().kartHtml('spi'), esp = I().kartHtml('esp');
        expect(ays).toContain('Matematik &lt;dersi&gt;');
        expect(ays.indexOf('Google Fit')).toBe(-1);
        expect(ays.indexOf('YouTube')).toBe(-1);
        expect(spi).toContain('kayda yazılmadı');
        expect(spi.indexOf('YouTube')).toBe(-1);
        expect(esp).toContain('Khan Academy');
        expect(esp.indexOf('Google Fit')).toBe(-1);
      }finally{ I()._veri(null); }
    });
    it('ayar: sunucu yoksa bunu söyler; varsa rehber, takvim adresi hiç gösterilmez', () => {
      I()._ortam({ sunucu:() => false });
      try{
        expect(I().ayarHtml()).toContain('bu bilgisayardaki LifeOS sunucusunda');
        I()._ortam({ sunucu:() => true, fetch:() => Promise.reject(new Error('yok')) });
        I()._veri(VERI());
        const h = I().ayarHtml();
        expect(h).toContain('Gizli adres, iCal biçiminde');
        expect(h).toContain('takeout.google.com');
        expect(h).toContain('Önümüzdeki 14 günde 1 etkinlik');
        expect(h).toContain('Adım: 2 gün');
      }finally{ I()._veri(null); I()._ortam(); }
    });
    it('tanınmayan dosya gönderilmez, kullanıcıya ne seçeceği söylenir', () => {
      const giden = [];
      I()._ortam({ sunucu:() => true, fetch:(u, o) => { giden.push(u); return Promise.resolve(new Response('{}')); } });
      I()._veri(VERI());
      return I().dosyaOku({ text:() => Promise.resolve('merhaba') }).then(t => {
        expect(t).toBeNull();
        expect(giden.length).toBe(0);
        expect(I().ayarHtml()).toContain('Bu dosya tanınmadı');
      }).finally(() => { I()._veri(null); I()._ortam(); });
    });
  });
})();
