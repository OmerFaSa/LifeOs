/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/hedefag.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Hedef ağı istemcisi — tek kaynak `brand/ortak/hedefag.test.js`.

   Kanıtlanan sözler:
     1. Özet yalnız HKM'nin beklediği alanları taşır; hedefin cümlesi,
        cevapları ve kişisel ölçümleri gitmez.
     2. HKM bağlı değilse hiçbir istek yapılmaz ve hiçbir şey kırılmaz.
     3. Gönderim anlık görüntüdür; bütçe cümlesi HKM'den gelir. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const A = () => window.LIFEOS.HedefAg;
  const H = { id:'hd1', cumle:'AYT fiziği sınava kadar bitirmek istiyorum', paket:'konu', durum:'aktif',
    son_tarih:'2027-06-20', kapasite:{ gunluk_dk:60 }, gerceklik:{ bant:'gercekci', etiket:'tahmin' },
    cevaplar:{ gizli:'x' }, simdi:{ deger:84, birim:'kg' } };

  function beacon(acik){
    return { settings:() => ({ enabled:acik, token:'t', url:'http://127.0.0.1:4200' }), urlOk:() => true };
  }

  describe('Hedef ağı', () => {
    it('özet yalnız beklenen alanları taşır', () => {
      const o = A().ozet(H, { ozet:'AYT Fizik: 18 konu', plan:{ bitis:'2027-05-04' },
        ilerleme:{ durum:'geride', metin:'2 konu geride', ekstra:1 } });
      expect(Object.keys(o).sort()).toEqual(['durum', 'gerceklik', 'id', 'kapasite', 'ozet', 'paket',
        'plan', 'son_tarih']);
      expect(o.kapasite).toEqual({ gunluk_dk:60, haftalik_gun:7 });
      expect(o.plan).toEqual({ bitis:'2027-05-04', ilerleme:{ durum:'geride', metin:'2 konu geride' } });
      expect(A().ozet(H).plan).toBe(null);
      expect(A().ozet(Object.assign({}, H, { kapasite:null })).kapasite).toBe(null);
    });

    it('HKM bağlı değilse istek yapılmaz', async () => {
      let n = 0;
      const ag = A().kur({ hkm:() => beacon(false), modul:'ays', ozetler:() => [A().ozet(H)],
        fetch:async () => { n++; return { status:200, json:async () => ({}) }; } });
      expect((await ag.gonder()).ok).toBe(false);
      expect(await ag.cek()).toBe(null);
      expect(n).toBe(0);
    });

    it('gönderim anlık görüntüdür; bütçe cümlesi HKM’den gelir', async () => {
      const giden = [];
      const ag = A().kur({ hkm:() => beacon(true), modul:'esp', ozetler:() => [A().ozet(H)],
        fetch:async (url, o) => { giden.push({ url, o });
          return { status:200, json:async () => ({ ok:true, butce:{ metin:'Sığıyor.' } }) }; } });
      const r = await ag.gonder();
      expect(r.ok).toBe(true);
      expect(giden[0].url).toBe('http://127.0.0.1:4200/api/hedef/sync/esp');
      expect(JSON.parse(giden[0].o.body).hedefler[0].id).toBe('hd1');
      expect(giden[0].o.body.indexOf('gizli')).toBe(-1);
      expect(ag.butce().metin).toBe('Sığıyor.');
    });

    it('fetch bağımsız çağrılır (nesneye bağlı çağrı tarayıcıda reddedilir)', async () => {
      let bu = 'yok';
      const ag = A().kur({ hkm:() => beacon(true), modul:'ays', ozetler:() => [],
        fetch:function(){ bu = this; return Promise.resolve({ status:200, json:async () => ({ ok:true }) }); } });
      await ag.gonder();
      expect(bu === undefined || bu === window).toBe(true);
    });

    it('HKM hata verirse sessizce düşer', async () => {
      const ag = A().kur({ hkm:() => beacon(true), modul:'spi', ozetler:() => [],
        fetch:async () => { throw new Error('ağ yok'); } });
      expect((await ag.gonder()).ok).toBe(false);
      expect(await ag.cek()).toBe(null);
    });
  });
})();
