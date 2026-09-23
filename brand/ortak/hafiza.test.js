/* Hafıza — katmanlar, yazma izni, komutlar.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hafiza.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır.

   En önemli sözü: MODEL HAFIZAYA YAZAMAZ. Bir modelin «kullanıcı X'i
   sever» diye kalıcı kayıt bırakması, halüsinasyonu kalıcı yapmaktır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const H = () => window.LIFEOS.Hafiza;

  describe('Hafıza — katman ve izin', () => {
    it('senin sözün yalnız kullanıcıdan gelir', () => {
      expect(H().ekle([], { metin:'sabahları verimliyim', katman:'soz', kaynak:'kullanici' }).ok).toBe(true);
      expect(H().ekle([], { metin:'x', katman:'soz', kaynak:'kural' }).ok).toBe(false);
    });

    it('model hiçbir katmana yazamaz', () => {
      ['soz', 'sohbet', 'cikarim'].forEach(k => {
        const r = H().ekle([], { metin:'kullanıcı gitarı sever', katman:k, kaynak:'model' });
        expect(r.ok).toBe(false);
      });
      expect(H().ekle([], { metin:'x', katman:'sohbet', kaynak:'model' }).why).toContain('Model');
    });

    it('çıkarım yalnız kural motorundan gelir ve «tahmin» diye görünür', () => {
      const r = H().ekle([], { metin:'deneme haftalarında uyku düşüyor', katman:'cikarim', kaynak:'kural' });
      expect(r.ok).toBe(true);
      expect(H().baglam(r.liste)).toContain('(tahmin) deneme haftalarında');
      expect(H().ekle([], { metin:'x', katman:'cikarim', kaynak:'kullanici' }).ok).toBe(false);
    });

    it('aynı söz iki kez yazılmaz, boş ve çok uzun reddedilir', () => {
      const a = H().ekle([], { metin:'Pazar çalışmam' });
      expect(H().ekle(a.liste, { metin:'pazar  ÇALIŞMAM' }).ok).toBe(false);
      expect(H().ekle([], { metin:'   ' }).ok).toBe(false);
      expect(H().ekle([], { metin:'x'.repeat(H().MAX_METIN + 1) }).ok).toBe(false);
    });

    it('sınır aşılınca önce en eski çıkarım gider, senin sözün kalır', () => {
      let l = H().ekle([], { metin:'söz 0', at:'2020-01-01' }).liste;
      l = H().ekle(l, { metin:'çıkarım 0', katman:'cikarim', kaynak:'kural', at:'2020-01-02' }).liste;
      for(let i = 1; i < H().MAX_KAYIT - 1; i++) l = H().ekle(l, { metin:'söz ' + i }).liste;
      l = H().ekle(l, { metin:'son söz' }).liste;
      const metinler = H().etkin(l).map(x => x.metin);
      expect(metinler.length).toBe(H().MAX_KAYIT);
      expect(metinler.indexOf('çıkarım 0')).toBe(-1);
      expect(metinler.indexOf('söz 0') >= 0).toBeTruthy();
    });

    it('bozuk kayıt sessizce düşer', () => {
      const l = [{ id:'a', metin:'iyi', katman:'soz', at:'2020' }, { metin:'id yok', katman:'soz' },
        { id:'c', metin:'', katman:'soz' }, { id:'d', metin:'x', katman:'uydurma' }, null];
      expect(H().etkin(l).map(x => x.id)).toEqual(['a']);
    });
  });

  describe('Hafıza — komutlar', () => {
    it('ekleme, liste ve unutma cümleleri tanınır', () => {
      expect(H().komut('hatırla: sabahları verimliyim')).toEqual({ tur:'ekle', metin:'sabahları verimliyim' });
      expect(H().komut('Bunu hatırla: Pazar çalışmam')).toEqual({ tur:'ekle', metin:'Pazar çalışmam' });
      expect(H().komut('hafızam')).toEqual({ tur:'liste' });
      expect(H().komut('Benim hakkımda ne biliyorsun?')).toEqual({ tur:'liste' });
      expect(H().komut('#3 unut')).toEqual({ tur:'unut', sira:3 });
      expect(H().komut('2 numarayı unut')).toEqual({ tur:'unut', sira:2 });
    });

    it('sıradan cümle komut değildir', () => {
      ['bugün nasılım', 'hatırlamıyorum ne yaptığımı', 'unutmuşum', '3 soru unuttum']
        .forEach(m => expect(H().komut(m)).toBe(null));
    });

    it('depo: komutla eklenir, listelenir, sırasıyla unutulur', async () => {
      const veri = {};
      const S = {};
      const h = H().kur({ store:() => ({ async get(k){ return veri[k] || null; },
        async set(k, v){ veri[k] = v; } }), durum:() => S });
      await h.yukle();
      const a = await h.komutIsle('hatırla: sabahları verimliyim');
      expect(a.text).toContain('Hatırlıyorum');
      await h.komutIsle('hatırla: Pazar çalışmam');
      expect((await h.komutIsle('hafızam')).text).toContain('2. (senin sözün) Pazar çalışmam');
      const u = await h.komutIsle('1 unut');
      expect(u.text).toContain('sabahları');
      expect(h.etkin().map(x => x.metin)).toEqual(['Pazar çalışmam']);
      /* Depoya yazıldı: yeniden yüklenince duruyor. */
      S.hafiza = null;
      await h.yukle();
      expect(h.etkin()).toHaveLength(1);
      expect(await h.komutIsle('bugün nasılım')).toBe(null);
    });
  });

  /* HKM'ye bildirim: modül hafızasının ANLIK GÖRÜNTÜSÜ gider, HKM kendi
     kopyasını eşitler (HKM core/memory.py esitle). HKM isteğe bağlıdır
     (AGENTS.md §1.4): kapalıyken hiçbir şey gitmez, ağ hatası fırlatmaz. */
  describe('Hafıza — HKM\'ye bildirim', () => {
    function ortam(ayar, fetchFn){
      const veri = {}, S = {};
      const giden = [];
      const h = H().kur({
        store:() => ({ async get(k){ return veri[k] || null; }, async set(k, v){ veri[k] = v; } }),
        durum:() => S,
        hkm:() => ({ MODULE:'ays', settings:() => ayar, urlOk:u => /^https?:\/\//.test(u || '') }),
        fetch:fetchFn || (async (url, o) => { giden.push({ url, o }); return { status:200 }; }),
      });
      return { h, giden };
    }
    const ACIK = { enabled:true, token:'jeton', url:'http://127.0.0.1:8787/' };

    it('HKM kapalıyken ya da ayarsızken hiçbir şey gitmez', async () => {
      const a = ortam({ enabled:false, token:'jeton', url:ACIK.url });
      await a.h.yukle();
      expect((await a.h.hkmeGonder()).reason).toBe('off');
      const b = ortam({ enabled:true, token:'', url:ACIK.url });
      await b.h.yukle();
      expect((await b.h.hkmeGonder()).ok).toBe(false);
      expect(a.giden.length + b.giden.length).toBe(0);
    });

    it('anlık görüntü gider: etkin kayıtlar, katmanı ve kaynağıyla', async () => {
      const a = ortam(ACIK);
      await a.h.yukle();
      await a.h.ekle('Pazar çalışmam', { katman:'soz', kaynak:'kullanici' });
      const u = await a.h.ekle('sabah verimliyim', { katman:'soz', kaynak:'kullanici' });
      await a.h.unut(u.kayit.id);
      const r = await a.h.hkmeGonder();
      expect(r.ok).toBe(true);
      const son = a.giden[a.giden.length - 1];
      expect(son.url).toBe('http://127.0.0.1:8787/api/memory/sync/ays');
      expect(son.o.headers.Authorization).toBe('Bearer jeton');
      const items = JSON.parse(son.o.body).items;
      expect(items.map(x => x.metin)).toEqual(['Pazar çalışmam']);
      expect(items[0].katman).toBe('soz');
      expect(items[0].kaynak).toBe('kullanici');
    });

    it('ekleme ve unutma HKM\'ye kendiliğinden bildirilir', async () => {
      const a = ortam(ACIK);
      await a.h.yukle();
      await a.h.ekle('Pazar çalışmam', { katman:'soz', kaynak:'kullanici' });
      await new Promise(r => setTimeout(r, 0));
      expect(a.giden.length).toBe(1);
    });

    it('ağ hatası fırlatmaz; kayıt yerelde durur', async () => {
      const a = ortam(ACIK, async () => { throw new Error('bağlantı reddedildi'); });
      await a.h.yukle();
      const e = await a.h.ekle('Pazar çalışmam', { katman:'soz', kaynak:'kullanici' });
      expect(e.ok).toBe(true);
      expect((await a.h.hkmeGonder()).ok).toBe(false);
      expect(a.h.etkin()).toHaveLength(1);
    });
  });
})();
