/* GERÇEK DEPO TESTLERİ.

   Diğer testler `SP.Store`'u bellek içi sahte bir depoyla değiştirir;
   bu doğrudur, çünkü onların konusu modelin mantığıdır. Ama sonuç şuydu:
   verinin gerçekten yazıldığı modül neredeyse hiç denenmemişti — on yedi
   işlevden altısı.

   Depolama, verinin KAYBOLABİLECEĞİ tek yerdir. Bu paket gerçek modülü,
   gerçek localStorage üzerinde çalıştırır ve şu üç şeyi korur:

     · yazılan okunur, silinen gider, listelenen eksiksiz gelir
     · yedek alma/geri yükleme veriyi bozmaz
     · yazma başarısız olduğunda SESSİZ KALINMAZ

   Her test kendi ön ekini kullanır ve sonunda temizler; uygulamanın
   gerçek anahtarını paylaştıkları için birbirlerine bulaşmamaları
   gerekir. */

(function(){
  const { describe, it, expect, realStore } = SP.Test;
  const S = realStore;

  /* Testin kendi alanı: her yol bu ön ekle başlar. */
  const ON = 'zztest/';
  async function temizle(){
    const hepsi = S.exportAll().data || {};
    for(const k of Object.keys(hepsi)) if(k.indexOf(ON) === 0) await S.remove(k);
  }

  describe('Depo — yazma ve okuma', function(){
    it('yazılan değer aynen okunur', async function(){
      await temizle();
      await S.set(ON + 'a', { ad:'Ömer', sayi:42, ic:{ derin:true } });
      const g = await S.get(ON + 'a');
      expect(g.ad).toBe('Ömer');
      expect(g.sayi).toBe(42);
      expect(g.ic.derin).toBeTruthy();
      await temizle();
    });

    it('olmayan yol null döner — undefined değil', async function(){
      /* Ayrım önemli: `undefined` "anahtar yok" ile "değer yok"u
         karıştırır; çağıranlar `null` kontrolü yapıyor. */
      expect(await S.get(ON + 'hicyok')).toBeNull();
    });

    it('üzerine yazma eski değeri tamamen değiştirir', async function(){
      await temizle();
      await S.set(ON + 'b', { x:1, y:2 });
      await S.set(ON + 'b', { x:9 });
      const g = await S.get(ON + 'b');
      expect(g.x).toBe(9);
      expect(g.y).toBeFalsy();
      await temizle();
    });

    it('silinen yol null döner ve komşusunu götürmez', async function(){
      await temizle();
      await S.set(ON + 'c1', { v:1 });
      await S.set(ON + 'c2', { v:2 });
      await S.remove(ON + 'c1');
      expect(await S.get(ON + 'c1')).toBeNull();
      expect((await S.get(ON + 'c2')).v).toBe(2);
      await temizle();
    });

    it('bir yola yazmak diğerlerini bozmaz', async function(){
      await temizle();
      for(let i = 0; i < 12; i++) await S.set(ON + 'sira/' + i, { i });
      for(let i = 0; i < 12; i++) expect((await S.get(ON + 'sira/' + i)).i).toBe(i);
      await temizle();
    });
  });

  describe('Depo — koleksiyon listeleme', function(){
    it('koleksiyondaki her kayıt id ile gelir', async function(){
      await temizle();
      await S.set(ON + 'k/bir', { v:1 });
      await S.set(ON + 'k/iki', { v:2 });
      const rows = await S.list(ON + 'k');
      expect(rows).toHaveLength(2);
      expect(rows.map(r => r.id).sort()).toEqual(['bir', 'iki']);
      await temizle();
    });

    it('alt koleksiyonlar üst listeye sızmaz', async function(){
      /* `k/bir` listelenir ama `k/alt/derin` listelenmez: aksi hâlde bir
         koleksiyon kendi alt ağacını da kayıt sanır. */
      await temizle();
      await S.set(ON + 'k/bir', { v:1 });
      await S.set(ON + 'k/alt/derin', { v:2 });
      const rows = await S.list(ON + 'k');
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe('bir');
      await temizle();
    });

    it('sondaki eğik çizgi olsun olmasın aynı sonucu verir', async function(){
      await temizle();
      await S.set(ON + 'k/bir', { v:1 });
      expect(await S.list(ON + 'k')).toHaveLength(1);
      expect(await S.list(ON + 'k/')).toHaveLength(1);
      await temizle();
    });

    it('boş koleksiyon boş dizi döner', async function(){
      expect(await S.list(ON + 'bostur')).toHaveLength(0);
    });
  });

  describe('Depo — yedek', function(){
    it('dışa aktarım künye ve veriyi birlikte taşır', async function(){
      await temizle();
      await S.set(ON + 'y', { v:'korunmalı' });
      const yedek = S.exportAll();
      expect(yedek.__meta.app).toBe('spi-saglik');
      expect(yedek.__meta.schemaVersion).toBe(SP.SCHEMA_VERSION);
      expect(yedek.data[ON + 'y'].v).toBe('korunmalı');
      await temizle();
    });

    it('geri yükleme eski kayıtları TAMAMEN değiştirir', async function(){
      /* Birleştirme değil değiştirme: yedek bir anın tam kopyasıdır,
         yarısını tutup yarısını yazmak iki farklı anın karışımını
         üretir ve hangi kaydın hangi ana ait olduğu bilinemez. */
      await temizle();
      await S.set(ON + 'eski', { v:1 });
      const oncekiTam = S.exportAll().data;
      const yedek = { __meta:{ app:'spi-saglik', schemaVersion:SP.SCHEMA_VERSION },
        data:Object.assign({}, oncekiTam, { [ON + 'yeni']:{ v:2 } }) };
      delete yedek.data[ON + 'eski'];
      await S.importAll(yedek);
      expect(await S.get(ON + 'eski')).toBeNull();
      expect((await S.get(ON + 'yeni')).v).toBe(2);
      await temizle();
    });

    it('daha yeni şemalı yedek reddedilir', function(){
      const r = S.readBackup({ __meta:{ schemaVersion:SP.SCHEMA_VERSION + 1 }, data:{} });
      expect(r.ok).toBeFalsy();
      expect(r.error).toContain('güncelle');
    });

    it('eski düz sözlük biçimi kabul edilir', function(){
      const r = S.readBackup({ 'profile':{ name:'x' }, 'labs/1':{} });
      expect(r.ok).toBeTruthy();
      expect(r.meta.legacy).toBeTruthy();
    });

    it('yedek olmayan dosya reddedilir', function(){
      expect(S.readBackup({ rastgele:'içerik' }).ok).toBeFalsy();
      expect(S.readBackup(null).ok).toBeFalsy();
      expect(S.readBackup('metin').ok).toBeFalsy();
    });

    it('geçersiz yedek geri yüklenmeye çalışılırsa hata atar', async function(){
      let atti = false;
      try{ await S.importAll({ rastgele:1 }); }catch(e){ atti = true; }
      expect(atti).toBeTruthy();
    });
  });

  describe('Depo — alan ve sağlık', function(){
    it('boyut yazdıkça büyür', async function(){
      await temizle();
      const once = S.localSize();
      await S.set(ON + 'buyuk', { metin:'x'.repeat(2000) });
      expect(S.localSize()).toBeGreaterThan(once + 1900);
      await temizle();
    });

    it('kota yüzdesi sınırlar içinde kalır', function(){
      const q = S.localQuota();
      expect(q.pct).toBeGreaterThan(-1);
      expect(q.limit).toBeGreaterThan(0);
      expect(typeof q.near).toBe('boolean');
    });

    it('sağlık raporu kip ve yerel durumu söyler', function(){
      const h = S.health();
      expect(h.mode).toBeTruthy();
      expect(['ok', 'error'].indexOf(h.local) >= 0).toBeTruthy();
    });

    /* HATA SESSİZ KALMAZ. Depolama dolduğunda uygulama çalışmaya devam
       eder ama kullanıcı bunu BİLMELİDİR; sessiz bir başarısızlık,
       kaydettiğini sanan bir kullanıcı üretir. */
    it('yazma başarısız olursa onError çağrılır ve sağlık bozulur', async function(){
      await temizle();
      const gercek = localStorage.setItem.bind(localStorage);
      let bildirildi = null;
      S.onError = (hata) => { bildirildi = hata; };
      localStorage.setItem = function(){
        const e = new Error('doldu'); e.name = 'QuotaExceededError'; throw e;
      };
      try{
        await S.set(ON + 'patlar', { v:1 });
      }finally{
        localStorage.setItem = gercek;
        S.onError = null;
      }
      expect(bildirildi).toBeTruthy();
      expect(bildirildi.scope).toBe('local-write');
      expect(bildirildi.message).toContain('depolama');
      expect(S.health().local).toBe('error');
      /* Sonraki başarılı yazma sağlığı geri toparlar. */
      await S.set(ON + 'duzelir', { v:1 });
      expect(S.health().local).toBe('ok');
      await temizle();
    });

    /* Bozuk kayıt AÇILIŞTA önemlidir: uygulama çalışırken bellekteki
       ayrıştırılmış kopya zaten doğrudur ve diskteki bozulmayı görmez —
       bu bir eksik değil, istenen davranıştır. Test o yüzden önce
       kopyayı geçersiz kılar (başka sekmenin yazması gibi). */
    function kopyayiTazele(){
      window.dispatchEvent(new StorageEvent('storage', { key:'spi.v1.ben' }));
    }

    it('bozuk yerel kayıt okunamazsa uygulama çökmez', function(){
      const gercek = localStorage.getItem.bind(localStorage);
      let bildirildi = null;
      S.onError = (hata) => { bildirildi = hata; };
      localStorage.getItem = function(){ return '{bozuk json'; };
      let sonuc;
      try{ kopyayiTazele(); sonuc = S.exportAll(); }
      finally{ localStorage.getItem = gercek; S.onError = null; kopyayiTazele(); }
      expect(sonuc.data).toBeTruthy();
      expect(bildirildi.scope).toBe('local-read');
    });

    /* BAŞKA SEKME YAZDIYSA BELLEKTEKİ KOPYA ESKİMİŞTİR.

       Ayrıştırılmış kopya yazma maliyetini depo boyutundan kurtarır ama
       tek bir tehlike getirir: aynı tarayıcıda ikinci bir sekme yazarsa
       bu sekmenin elindeki kopya eski kalır ve bir sonraki yazma onun
       değişikliğini SİLER. `storage` olayı yalnızca diğer sekmelerde
       tetiklenir; kopya orada geçersiz kılınır. */
    it('başka sekmenin yazması bellekteki kopyayı geçersiz kılar', async function(){
      await temizle();
      await S.set(ON + 'ortak', { v:'benim' });
      /* İkinci sekmenin yazması: doğrudan localStorage'a dokunur. */
      const ham = JSON.parse(localStorage.getItem('spi.v1.ben') || '{}');
      ham[ON + 'ortak'] = { v:'oteki' };
      ham[ON + 'yalnizOteki'] = { v:1 };
      localStorage.setItem('spi.v1.ben', JSON.stringify(ham));
      kopyayiTazele();
      expect((await S.get(ON + 'ortak')).v).toBe('oteki');
      /* Ve bizim bir sonraki yazmamız onun kaydını götürmez. */
      await S.set(ON + 'benimki', { v:2 });
      expect(await S.get(ON + 'yalnizOteki')).toBeTruthy();
      await temizle();
    });

    it('temizlemeden sonra bellekteki kopya da boşalır', async function(){
      await temizle();
      await S.set(ON + 'gidecek', { v:1 });
      expect(await S.get(ON + 'gidecek')).toBeTruthy();
      await S.clear();
      expect(await S.get(ON + 'gidecek')).toBeNull();
      expect(S.exportAll().data[ON + 'gidecek']).toBeFalsy();
    });
  });
})();
