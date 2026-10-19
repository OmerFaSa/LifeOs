/* YETKİ — King'in kapalı kataloğu (brand/ortak/yetki.js). */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const Y = () => window.LIFEOS.YETKI;

  function sahne(o){
    o = o || {};
    const y = Y();
    y._sifirla();
    const depo = {};
    const d = y._ortam.depo;
    const eski = { oku:d.oku, yaz:d.yaz, sil:d.sil };
    d.oku = k => (k in depo ? JSON.parse(depo[k]) : null);
    d.yaz = (k, v) => { if(o.yerYok && k === y.DONUS && o.yerYok-- > 0) return false; depo[k] = JSON.stringify(v); return true; };
    d.sil = k => { delete depo[k]; };
    const durum = { tema:'system', kayit:{ a:1, b:2 }, bekleyen:[{ id:'p1', metin:'Uyku 7 sa' }, { id:'p2', metin:'Haftalık hedef 600' }], onaylanan:[], gecilen:[] };
    y.kur(Object.assign({
      modul:'ays',
      tema:{ oku:() => durum.tema, yaz:async v => { durum.tema = v; } },
      onaylar:{
        bekleyen:() => durum.bekleyen,
        onayla:async id => { durum.onaylanan.push(id); durum.bekleyen = durum.bekleyen.filter(x => x.id !== id); return { ok:true }; },
        reddet:async id => { durum.gecilen.push(id); durum.bekleyen = durum.bekleyen.filter(x => x.id !== id); return { ok:true }; },
      },
      donus:{
        al:() => JSON.parse(JSON.stringify({ data:durum.kayit })),
        yukle:async v => { durum.kayit = v.data; },
        sil:async () => { durum.kayit = {}; },
        sayi:() => Object.keys(durum.kayit).length,
      },
    }, o.ayar || {}));
    return { y, durum, depo, birak:() => Object.assign(d, eski) };
  }
  async function ile(o, fn){ const s = sahne(o); try{ await fn(s); }finally{ s.birak(); Y()._sifirla(); } }

  describe('Yetki — anlama', () => {
    it('hesap işi yapılmaz, söylenir (söz 3)', () => ile({}, async ({ y }) => {
      ['parolamı değiştir', 'iki adımı kapat', 'hesabımı sil', 'cihazı çıkar', 'e-postamı değiştir', 'oturumu kapat']
        .forEach(m => expect(y.anla(m).tur).toBe('hesap'));
    }));
    it('katalog dışı cümle King’in kendi yoluna kalır', () => ile({}, async ({ y }) => {
      ['40 soru çözdüm', 'merhaba', 'antrenman yapacağım', 'bugün nasılım'].forEach(m => expect(y.anla(m)).toBe(null));
    }));
    it('seviyeyi katalog belirler', () => ile({}, async ({ y }) => {
      expect(y.anla('koyu temaya geç').seviye).toBe('kucuk');
      expect(y.anla('hepsini onayla').seviye).toBe('orta');
      expect(y.anla('AYS’yi sıfırdan başlat').seviye).toBe('buyuk');
      expect(y.anla('tüm verileri sil').seviye).toBe('buyuk');
    }));
    it('olumsuz istek eylem değildir (söz 6)', () => ile({}, async ({ y }) => {
      const r = y.anla('verileri silme');
      expect(r === null || r.tur === 'olumsuz').toBe(true);
      expect(y.anla('sıfırlama')).toBe(null);
      const o = y.anla('hepsini onaylama');
      expect(o === null || o.tur === 'olumsuz').toBe(true);
      if(window.LIFEOS.Olumsuz) expect(y.anla('koyu temaya geçme').tur).toBe('olumsuz');
    }));
    it('başka modülün sıfırlanması orada yapılır (söz 7)', () => ile({}, async ({ y }) => {
      const r = y.anla('SPİ’yi sıfırla');
      expect([r.tur, r.modul]).toEqual(['baska', 'spi']);
    }));
    it('bekleyenler listelenir; yoksa söylenir', () => ile({}, async ({ y, durum }) => {
      const r = y.anla('bekleyen onaylar neler');
      expect([r.tur, r.sayi]).toEqual(['liste', 2]);
      durum.bekleyen = [];
      expect(y.anla('hepsini onayla').metin).toBe('Onay bekleyen öneri yok.');
    }));
  });

  describe('Yetki — modülün kendi eylemleri (söz 8)', () => {
    it('modül küçük/orta eylem ekler; büyük ve çakışan alınmaz; eylemi modül uygular', async () => {
      const y = Y();
      let calisti = 0;
      y.kur({ modul:'ays', eylemler:[
        { id:'toplanti', seviye:'orta', ad:'Toplantı başlat', anla:t => /toplant/.test(t) && /başlat/.test(t) ? {} : null,
          onizle:() => ({ metin:'Toplantı başlayacak.' }), uygula:async () => { calisti++; return { metin:'Başladı.' }; } },
        { id:'sil', seviye:'buyuk', ad:'Sil', anla:() => ({}), onizle:() => ({ metin:'x' }), uygula:async () => ({}) },
        { id:'tema', seviye:'kucuk', ad:'Sahte', anla:() => ({}), onizle:() => ({ metin:'x' }), uygula:async () => ({}) },
      ] });
      try{
        const n = y.anla('toplantıyı başlat');
        expect([n.tur, n.id, n.seviye, n.onizle.metin]).toEqual(['eylem', 'toplanti', 'orta', 'Toplantı başlayacak.']);
        const r = await y.uygula(n);
        expect([r.ok, r.metin, calisti]).toEqual([true, 'Başladı.', 1]);
        expect(y.katalog().map(e => e.id).filter(x => x === 'toplanti' || x === 'sil')).toEqual(['toplanti']);
        expect(y.anla('müzik çalıyor')).toBe(null);
      }finally{ y._sifirla(); }
    });
  });

  describe('Yetki — uygulama', () => {
    it('küçük: tema hemen değişir, geri alınır', () => ile({}, async ({ y, durum }) => {
      const r = await y.uygula(y.anla('koyu tema yap'));
      expect(durum.tema).toBe('dark');
      await r.geriAl();
      expect(durum.tema).toBe('system');
    }));
    it('orta: bekleyenlerin hepsi modülün kendi kapısından onaylanır', () => ile({}, async ({ y, durum }) => {
      const n = y.anla('bekleyenleri onayla');
      expect(n.onizle.satirlar).toEqual(['Uyku 7 sa', 'Haftalık hedef 600']);
      const r = await y.uygula(n);
      expect(durum.onaylanan).toEqual(['p1', 'p2']);
      expect(r.metin).toBe('2 öneri onaylandı.');
    }));
    it('büyük: önce dönüş noktası, sonra sıfırlama; dönüş noktasıyla her şey geri gelir', () => ile({}, async ({ y, durum, depo }) => {
      const n = y.anla('sıfırdan başlayalım');
      expect(n.onizle.satirlar.some(s => /dönüş noktası/.test(s))).toBe(true);
      const r = await y.uygula(n);
      expect([r.ok, r.yenile]).toEqual([true, true]);
      expect(durum.kayit).toEqual({});
      expect(!!depo[y.DONUS]).toBe(true);
      const d = y.anla('dönüş noktasına dön');
      expect(d.seviye).toBe('buyuk');
      await y.uygula(d);
      expect(durum.kayit).toEqual({ a:1, b:2 });
      expect(!!depo[y.DONUS]).toBe(false);
      expect(y.anla('dönüş noktasına dön').tur).toBe('liste');   // artık yok
    }));
    it('dönüş noktası hiç yazılamazsa hiçbir şey silinmez (söz 5)', () => ile({ yerYok:2 }, async ({ y, durum }) => {
      const r = await y.uygula(y.anla('her şeyi sil'));
      expect(r.ok).toBe(false);
      expect(durum.kayit).toEqual({ a:1, b:2 });
    }));
    it('yer ancak silince açılıyorsa dönüş noktası sonra yazılır', () => ile({ yerYok:1 }, async ({ y, depo }) => {
      const r = await y.uygula(y.anla('her şeyi sil'));
      expect(r.ok).toBe(true);
      expect(!!depo[y.DONUS]).toBe(true);
    }));
    it('başka modülün dönüş noktası burada kullanılmaz', () => ile({}, async ({ y, depo }) => {
      depo[y.DONUS] = JSON.stringify({ modul:'spi', zaman:'2026-10-17T10:00:00Z', veri:{ data:{} } });
      expect(y.donusNoktasi()).toBe(null);
    }));
  });
})();
