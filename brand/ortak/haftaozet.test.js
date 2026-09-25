/* Haftalık Merkez özeti (120) — tek kaynak `brand/ortak/haftaozet.test.js`.

   Kanıtlanan sözler: HKM bağlı değilse ya da pazar akşamı değilse istek
   yapılmaz; HKM yanıt vermezse süre dolunca kart yok; önbellek aynı gün
   tekrar sormaz; kart her modülden bir satır, kesinlik çipi ve en altta
   bekleyenleri yazar; «veri yok» sıfır diye çizilmez; metin kaçırılır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const H = () => window.LIFEOS.HaftaOzet;
  const PAZAR = new Date(2026, 8, 27, 18, 0);        // 27 Eylül 2026 pazar 18:00
  const VERI = { from:'2026-09-21', to:'2026-09-27', zamani:true, not:'«veri yok» sıfır değildir.',
    satirlar:[{ modul:'ays', modul_adi:'AYS', cumle:'Net: 4 arttı', kesinlik:'hesaplandı' },
      { modul:'spi', modul_adi:'SPİ', cumle:'Bu hafta kayıt gelmedi.', kesinlik:'veri yok', gun:null },
      { modul:'esp', modul_adi:'ESP', cumle:'<img src=x onerror=alert(1)>', kesinlik:'ölçüldü' }],
    bekleyen:{ moduller:{ ays:2, spi:0, esp:1 }, king:1, toplam:4 } };
  const beacon = acik => ({ settings:() => ({ enabled:acik, token:'t', url:'http://127.0.0.1:4200/' }), urlOk:() => true });
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };

  describe('120 Haftalık Merkez özeti', () => {
    it('oz-120 pazar 17:00 öncesi ve hafta içi sorulmaz; HKM eşleşmemişse istek yok', async () => {
      const giden = [];
      const f = async u => { giden.push(u); return { status:200, json:async () => VERI }; };
      expect(H().pazarAksami(new Date(2026, 8, 27, 16, 59))).toBe(false);
      expect(H().pazarAksami(new Date(2026, 8, 27, 17, 0))).toBe(true);
      expect(H().pazarAksami(new Date(2026, 8, 28, 18, 0))).toBe(false);
      expect(await H().kur({ hkm:() => beacon(true), fetch:f, simdi:() => new Date(2026, 8, 25, 18) }).cek()).toBe(null);
      expect(await H().kur({ hkm:() => beacon(false), fetch:f, simdi:() => PAZAR }).cek()).toBe(null);
      expect(await H().kur({ hkm:() => null, fetch:f, simdi:() => PAZAR }).cek()).toBe(null);
      expect(giden.length).toBe(0);
    });

    it('oz-120 istek jetonla o güne gider; aynı gün önbellekten döner', async () => {
      const giden = [];
      const k = H().kur({ hkm:() => beacon(true), simdi:() => PAZAR,
        fetch:async (u, o) => { giden.push({ u, o }); return { status:200, json:async () => VERI }; } });
      expect((await k.cek()).from).toBe('2026-09-21');
      expect(giden[0].u).toBe('http://127.0.0.1:4200/api/merkez/hafta?date=2026-09-27');
      expect(giden[0].o.headers.Authorization).toBe('Bearer t');
      expect((await k.cek()).to).toBe('2026-09-27');
      expect(giden.length).toBe(1);
    });

    it('oz-120 HKM yanıt vermezse süre dolunca kart yok; hata ya da zamani:false kart yok', async () => {
      const asili = H().kur({ hkm:() => beacon(true), simdi:() => PAZAR, zamanAsimi:30,
        fetch:() => new Promise(() => {}) });
      const t0 = Date.now();
      expect(await asili.cek()).toBe(null);
      expect(Date.now() - t0 < 1000).toBe(true);
      expect(H().ZAMAN_ASIMI).toBe(4000);
      const hata = H().kur({ hkm:() => beacon(true), simdi:() => PAZAR, fetch:async () => { throw new Error('kapalı'); } });
      expect(await hata.cek()).toBe(null);
      const e500 = H().kur({ hkm:() => beacon(true), simdi:() => PAZAR, fetch:async () => ({ status:500, json:async () => ({}) }) });
      expect(await e500.cek()).toBe(null);
      const erken = H().kur({ hkm:() => beacon(true), simdi:() => PAZAR,
        fetch:async () => ({ status:200, json:async () => Object.assign({}, VERI, { zamani:false }) }) });
      expect(await erken.cek()).toBe(null);
    });

    it('oz-120 kart: modül başına bir satır, kesinlik çipi, en altta bekleyen; veri yok sıfır değil', () => {
      const k = dom(H().kartHtml(VERI));
      const kart = k.querySelector('[data-oz="120"]');
      expect(kart).toBeTruthy();
      const satir = kart.querySelectorAll('.hozet__satir');
      expect(satir.length).toBe(3);
      expect(satir[1].querySelector('.kesinlik').textContent).toContain('veri yok');
      expect(satir[1].textContent.indexOf('0') < 0).toBe(true);
      expect(satir[0].querySelector('.kesinlik--computed')).toBeTruthy();
      expect(kart.querySelector('img[onerror="alert(1)"]')).toBe(null);
      expect(satir[2].textContent).toContain('<img');
      expect(kart.querySelector('.hozet__alt').textContent).toContain('4 öneri onayını bekliyor');
      expect(kart.querySelector('.hozet__alt').textContent).toContain('King’de 1 iş');
      expect(kart.querySelectorAll('button').length).toBe(0);
      expect(H().kartHtml(null)).toBe('');
      expect(H().kartHtml({ from:'x', satirlar:[] })).toBe('');
    });
  });
})();
