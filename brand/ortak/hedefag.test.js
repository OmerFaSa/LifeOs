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

    it('yarının ilk işleri de gider; kanca bozuksa hedefler yine gider', async () => {
      /* Akşam «yarın şunlar var» mesajı (HKM schedule): işleri modülün KENDİ
         kodu seçer; HKM yalnız dizer. Metin kısalır, dakika tam sayı olur. */
      const giden = [];
      const f = async (url, o) => { giden.push(JSON.parse(o.body));
        return { status:200, json:async () => ({ ok:true }) }; };
      const ag = A().kur({ hkm:() => beacon(true), modul:'ays', ozetler:() => [],
        yarin:async () => ({ gun:'2026-09-24', isler:[
          { metin:'Matematik · Türev '.repeat(10), dk:90.4 }, { metin:'Paragraf', dk:null },
          { metin:'', dk:5 }] }), fetch:f });
      await ag.gonder();
      const y = giden[0].yarin;
      expect(y.gun).toBe('2026-09-24');
      expect(y.isler.length).toBe(2);
      expect(y.isler[0].metin.length <= 80).toBe(true);
      expect(y.isler[0].dk).toBe(90);
      expect(y.isler[1].dk).toBe(null);
      const bozuk = A().kur({ hkm:() => beacon(true), modul:'ays', ozetler:() => [A().ozet(H)],
        yarin:async () => { throw new Error('x'); }, fetch:f });
      expect((await bozuk.gonder()).ok).toBe(true);
      expect(giden[1].yarin).toBe(undefined);
      expect(giden[1].hedefler.length).toBe(1);
    });

    it('günün dil kartı yalnız kanca varsa gider; bozuk kart atlanır, en çok beş (fikir 38)', async () => {
      const giden = [];
      const f = async (url, o) => { giden.push(JSON.parse(o.body));
        return { status:200, json:async () => ({ ok:true }) }; };
      const ag = A().kur({ hkm:() => beacon(true), modul:'esp', ozetler:() => [],
        dilKarti:() => ({ gun:'2026-09-24', kartlar:[{ on:'to be', arka:'olmak' }, { on:'', arka:'x' },
          { on:'uzun '.repeat(40), arka:'y' }, 1, 2, 3].concat([1, 2, 3, 4, 5, 6].map(i => ({ on:'k' + i, arka:'a' }))) }),
        fetch:f });
      await ag.gonder();
      const d = giden[0].dil_karti;
      expect(d.gun).toBe('2026-09-24');
      expect(d.kartlar.length).toBe(5);
      expect(d.kartlar[0]).toEqual({ on:'to be', arka:'olmak' });
      expect(d.kartlar[1].on.length <= 80).toBe(true);
      const yok = A().kur({ hkm:() => beacon(true), modul:'ays', ozetler:() => [], fetch:f });
      await yok.gonder();
      expect(giden[1].dil_karti).toBe(undefined);
    });

    it('tatil yalnız tarihle gider; yoksa null (HKM siler)', async () => {
      const giden = [];
      const f = async (url, o) => { giden.push(JSON.parse(o.body));
        return { status:200, json:async () => ({ ok:true }) }; };
      let t = { bas:'2026-09-24', bit:'2026-09-30', neden:'gizli', donus_planli:true };
      const ag = A().kur({ hkm:() => beacon(true), modul:'ays', ozetler:() => [], tatil:() => t, fetch:f });
      await ag.gonder();
      expect(giden[0].tatil).toEqual({ bas:'2026-09-24', bit:'2026-09-30', donus_planli:true });
      t = null;
      await ag.gonder();
      expect(giden[1].tatil).toBe(null);
      await A().kur({ hkm:() => beacon(true), modul:'spi', ozetler:() => [], fetch:f }).gonder();
      expect('tatil' in giden[2]).toBe(false);
    });

    it('HKM hata verirse sessizce düşer', async () => {
      const ag = A().kur({ hkm:() => beacon(true), modul:'spi', ozetler:() => [],
        fetch:async () => { throw new Error('ağ yok'); } });
      expect((await ag.gonder()).ok).toBe(false);
      expect(await ag.cek()).toBe(null);
    });
  });
})();
