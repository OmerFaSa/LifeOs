/* Olay taşıyıcısı (KING-4 §C) — tek kaynak `brand/ortak/olay.test.js`.

   Kanıtlanan sözler: biçime uymayan olay yola çıkmaz; HKM eşleşmemişse
   istek yok; kabul edilen kimlik bir daha yollanmaz, kabul edilmeyen
   yeniden denenir; HKM yanıt vermezse süre dolunca vazgeçilir; üreticinin
   hatası modülü bozmaz. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const O = () => window.LIFEOS.OLAY;
  const SIMDI = new Date(2026, 10, 1, 10, 0);
  const beacon = acik => ({ settings:() => ({ enabled:acik, token:'t', url:'http://127.0.0.1:4200/' }), urlOk:() => true });
  const olay = (ek) => Object.assign({ modul:'spi', tur:'uyku_dustu', kimlik:'spi.uyku_dustu.2026-11-01', at:'2026-11-01T10:00:00',
    sayilar:{ ort7:{ deger:5.5, birim:'saat', etiket:'hesaplandı' }, ort28:{ deger:null, birim:'saat', etiket:'veri yok' } } }, ek || {});
  const temizle = () => { try{ localStorage.removeItem('lifeos.olay.giden.spi'); }catch(e){} };

  describe('KING-4 §C olay taşıyıcısı', () => {
    it('olay-1 biçim: etiketsiz sayı, değerli «veri yok», 9 sayı, uzun kimlik, yabancı modül geçmez', () => {
      expect(O().gecerli(olay(), 'spi')).toBe(true);
      expect(O().gecerli(olay({ sayilar:{ a:{ deger:1, birim:'' } } }), 'spi')).toBe(false);
      expect(O().gecerli(olay({ sayilar:{ a:{ deger:0, etiket:'veri yok' } } }), 'spi')).toBe(false);
      const dokuz = {}; for(let i = 0; i < 9; i++) dokuz['s' + i] = { deger:i, etiket:'ölçüldü' };
      expect(O().gecerli(olay({ sayilar:dokuz }), 'spi')).toBe(false);
      expect(O().gecerli(olay({ kimlik:'x'.repeat(81) }), 'spi')).toBe(false);
      expect(O().gecerli(olay(), 'ays')).toBe(false);
      expect(O().gecerli(olay({ at:'2026-11-01T07:00:00.000Z' }), 'spi')).toBe(false);
    });

    it('olay-2 HKM eşleşmemişse istek yok', async () => {
      temizle();
      const giden = [];
      const f = async u => { giden.push(u); return { status:200 }; };
      expect(await O().kur({ modul:'spi', hkm:() => beacon(false), fetch:f, simdi:() => SIMDI, uret:() => [olay()] }).tur()).toEqual([]);
      expect(await O().kur({ modul:'spi', hkm:() => null, fetch:f, simdi:() => SIMDI, uret:() => [olay()] }).tur()).toEqual([]);
      expect(giden.length).toBe(0);
    });

    it('olay-3 jetonla /api/olay; kabul edilen bir kez, bozuk olan hiç yollanmaz', async () => {
      temizle();
      const giden = [];
      const f = async (u, o) => { giden.push({ u, o }); return { status:200 }; };
      const k = O().kur({ modul:'spi', hkm:() => beacon(true), fetch:f, simdi:() => SIMDI,
        uret:() => [olay(), olay({ kimlik:'spi.bozuk', sayilar:{} })] });
      expect(await k.tur()).toEqual(['spi.uyku_dustu.2026-11-01']);
      expect(giden.length).toBe(1);
      expect(giden[0].u).toBe('http://127.0.0.1:4200/api/olay');
      expect(giden[0].o.headers.Authorization).toBe('Bearer t');
      expect(JSON.parse(giden[0].o.body).sayilar.ort28.deger).toBe(null);
      expect(await k.tur()).toEqual([]);
      expect(giden.length).toBe(1);
      temizle();
    });

    it('olay-4 HKM kapalı ya da sessiz: vazgeçer, sonraki turda yeniden dener', async () => {
      temizle();
      let durum = 'hata';
      const f = async () => { if(durum === 'hata') throw new Error('ağ'); if(durum === 'sessiz') return new Promise(() => {}); return { status:200 }; };
      const k = O().kur({ modul:'spi', hkm:() => beacon(true), fetch:f, simdi:() => SIMDI, zamanAsimi:30, uret:() => [olay()] });
      expect(await k.tur()).toEqual([]);
      durum = 'sessiz';
      expect(await k.tur()).toEqual([]);
      durum = 'tamam';
      expect(await k.tur()).toEqual(['spi.uyku_dustu.2026-11-01']);
      temizle();
    });

    it('olay-5 üretici hata verirse tur boş döner, modül bozulmaz', async () => {
      const k = O().kur({ modul:'spi', hkm:() => beacon(true), fetch:async () => ({ status:200 }), simdi:() => SIMDI,
        uret:() => { throw new Error('bozuk'); } });
      expect(await k.tur()).toEqual([]);
    });
  });
})();
