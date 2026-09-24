/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/store.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir.
   Kaynak bir KALIPTIR: ad alanı ve depo öneki yayım
   sırasında konur (__NS__, __DEPO__, __BASLIK__). */
/* GERÇEK DEPO TESTLERİ — verinin gerçekten yazıldığı katman.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/store.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne yayılır. `R` yer tutucudur.

   ------------------------------------------------------------------
   NEDEN BU PAKET VAR

   Öteki testler `R.Store`'u bellek içi sahte bir depoyla
   değiştirir (`mockStore`) ve bu DOĞRUDUR — onların konusu modelin
   mantığıdır. Ama sonuç şuydu: verinin gerçekten yazıldığı modül hiç
   denenmiyordu. `node tools/kapsam.js` bunu üç turda üç kez söyledi:

       AYS  store.js  %46   koşmayan: init, get, set, remove, list, clear
       ESP  store.js  %54   paket hiç yoktu
       SPİ  store.js  %85   paket vardı — ve tek yazılı olan oydu

   Bu deponun en net kuralı da buraya bakar: **kalıcılığa dokunmadan
   önce test yaz — verinin kaybolabileceği tek yer orası.**

   ------------------------------------------------------------------
   NEDEN ÜÇÜNE BİRDEN YAYILIYOR

   Üç `store.js` AYNI DOSYA DEĞİLDİR (ESP'de profil katmanı var,
   AYS'nin şema sürümü 5) ama AYNI YÜZEYİ açar:

     init, get, set, remove, list, exportAll, importAll, readBackup,
     importUndoInfo, undoImport, clear, localSize, localQuota,
     sizeByCollection, health, onError, onExternalWrite, mode

   Paket o yüzeyin sözünü sınar, gövdesini değil. Bu yüzden
   uygulamaya bağlanmaz: uygulama kimliği `exportAll().__meta.app`'ten,
   yerel anahtar çalışma zamanında bir imza yazılıp aranarak bulunur
   (aşağıda). Elle yazılsaydı — ki SPİ'de öyleydi — ikinci uygulamaya
   taşındığı gün üç test yanlış sebepten kırılırdı. Bir kez kırıldı.

   ------------------------------------------------------------------
   NE KORUR

     · yazılan okunur, silinen gider, listelenen eksiksiz gelir
     · yedek alma/geri yükleme veriyi bozmaz ve geri ALINABİLİR
     · yazma başarısız olduğunda SESSİZ KALINMAZ

   Her test kendi ön ekini kullanır ve sonunda temizler: uygulamanın
   gerçek anahtarını paylaştıkları için birbirlerine bulaşmamaları
   gerekir. */

(function(){
  const { describe, it, expect, realStore } = R.Test;
  const S = realStore;

  /* UYGULAMA KİMLİĞİ VE YEREL ANAHTAR SABİT YAZILMAZ.

     Bu paket SPİ'den uyarlandı ve orada ikisi de elle yazılıydı
     («spi-saglik», «spi.v1.ben»). Taşınınca üç test kırmızıya döndü —
     doğru davranış, ama yanlış sebep: kod değil, testin varsayımı
     taşınmıyordu. İkisi de artık ÇALIŞMA ZAMANINDA bulunur; paket
     böylece dördüncü bir uygulamaya da taşınabilir kalır. */
  function uygulamaKimligi(){ return (S.exportAll().__meta || {}).app; }

  /* Deponun yerel anahtarı dışarı açılmıyor. Bilinen bir değer yazıp
     hangi anahtarın içinde göründüğüne bakmak, adı tahmin etmekten
     daha sağlamdır: ad değişse de test çalışır. */
  async function yerelAnahtar(){
    const imza = 'zzimza-' + Date.now();
    await S.set(ON + 'imza', { v:imza });
    let bulunan = null;
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if((localStorage.getItem(k) || '').indexOf(imza) >= 0){ bulunan = k; break; }
    }
    await S.remove(ON + 'imza');
    return bulunan;
  }

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
      expect(yedek.__meta.app).toBe(uygulamaKimligi());
      expect(typeof yedek.__meta.app).toBe('string');
      expect(yedek.__meta.schemaVersion).toBe(R.SCHEMA_VERSION);
      expect(yedek.data[ON + 'y'].v).toBe('korunmalı');
      await temizle();
    });

    /* HKM BAĞLANTISI CİHAZA AİTTİR, YEDEĞE DEĞİL.

       `hkm` anahtarı adresi, AÇIK/KAPALI durumunu ve Bearer JETONUNU
       tutar. Yedek bütün depoyu kopyaladığı için jeton düz metin
       olarak dosyaya giriyordu (e-postayla gönderilen, buluta atılan
       bir dosyaya); geri yükleme de eski cihazın «açık» ayarını
       sormadan geri getiriyordu. */
    async function hkmIle(fn){
      const onceki = await S.get('hkm');
      try{ await fn(); }
      finally{ if(onceki === null) await S.remove('hkm'); else await S.set('hkm', onceki); }
    }

    it('HKM jetonu yedeğe girmez', async function(){
      await hkmIle(async function(){
        await S.set('hkm', { url:'http://127.0.0.1:8765', token:'gizli-jeton-123', enabled:true });
        const yedek = S.exportAll();
        expect(yedek.data.hkm).toBeFalsy();
        expect(JSON.stringify(yedek).indexOf('gizli-jeton-123')).toBe(-1);
        /* Dışa aktarım bu cihazın kendi ayarına dokunmaz. */
        expect((await S.get('hkm')).token).toBe('gizli-jeton-123');
      });
    });

    it('geri yükleme bu cihazın HKM ayarını değiştirmez', async function(){
      await hkmIle(async function(){
        const eskiCihaz = { url:'http://10.0.0.9:8765', token:'eski-jeton', enabled:true };
        const yedekle = () => ({ __meta:{ app:uygulamaKimligi(), schemaVersion:R.SCHEMA_VERSION },
          data:Object.assign({}, S.exportAll().data, { hkm:eskiCihaz }) });

        /* Bu cihazda HKM kapalıysa yedek onu AÇAMAZ. */
        await S.set('hkm', { url:'', token:'', enabled:false });
        await S.importAll(yedekle());
        const sonra = await S.get('hkm');
        expect(sonra.enabled).toBeFalsy();
        expect(sonra.token).toBe('');

        /* Hiç kurulmamışsa kurulmamış kalır. */
        await S.remove('hkm');
        await S.importAll(yedekle());
        expect(await S.get('hkm')).toBeNull();
      });
    });

    it('geri yükleme eski kayıtları TAMAMEN değiştirir', async function(){
      /* Birleştirme değil değiştirme: yedek bir anın tam kopyasıdır,
         yarısını tutup yarısını yazmak iki farklı anın karışımını
         üretir ve hangi kaydın hangi ana ait olduğu bilinemez. */
      await temizle();
      await S.set(ON + 'eski', { v:1 });
      const oncekiTam = S.exportAll().data;
      const yedek = { __meta:{ app:uygulamaKimligi(), schemaVersion:R.SCHEMA_VERSION },
        data:Object.assign({}, oncekiTam, { [ON + 'yeni']:{ v:2 } }) };
      delete yedek.data[ON + 'eski'];
      await S.importAll(yedek);
      expect(await S.get(ON + 'eski')).toBeNull();
      expect((await S.get(ON + 'yeni')).v).toBe(2);
      await temizle();
    });

    it('daha yeni şemalı yedek reddedilir', function(){
      const r = S.readBackup({ __meta:{ schemaVersion:R.SCHEMA_VERSION + 1 }, data:{} });
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

    it('ice aktarma oncesi durumu saklar ve geri alinabilir', async function(){
      const undoKey = (await yerelAnahtar()) + '.oncesi';
      const oncekiUndo = localStorage.getItem(undoKey);
      try{
        localStorage.removeItem(undoKey);
        await temizle();
        await S.set(ON + 'eski', { v:'ESKI' });
        expect(S.importUndoInfo()).toBeNull();

        const oncekiTam = S.exportAll().data;
        await S.importAll({ __meta:{ app:uygulamaKimligi(), schemaVersion:R.SCHEMA_VERSION },
          data:Object.assign({}, oncekiTam, { [ON + 'eski']:{ v:'YENI' } }) });
        expect((await S.get(ON + 'eski')).v).toBe('YENI');
        expect(S.importUndoInfo()).toBeTruthy();

        await S.undoImport();
        expect((await S.get(ON + 'eski')).v).toBe('ESKI');
        // tek yuvalidir: kullanilinca bosalir
        expect(S.importUndoInfo()).toBeNull();
        await temizle();
      }finally{
        if(oncekiUndo === null) localStorage.removeItem(undoKey); else localStorage.setItem(undoKey, oncekiUndo);
      }
    });

    it('gecersiz geri alma istegini reddeder', async function(){
      const undoKey = (await yerelAnahtar()) + '.oncesi';
      const onceki = localStorage.getItem(undoKey);
      try{
        localStorage.removeItem(undoKey);
        let atti = false;
        try{ await S.undoImport(); }catch(e){ atti = true; }
        expect(atti).toBeTruthy();
      }finally{
        if(onceki === null) localStorage.removeItem(undoKey); else localStorage.setItem(undoKey, onceki);
      }
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

    /* HATALAR D-17: doluluk yalnız etkin profilin anahtarından ölçülüyordu;
       tarayıcının sınırı ise KAYNAK başınadır — öteki profiller ve
       «.oncesi» kopyası da aynı kotadan yer. */
    it('kota bütün kaynağı ölçer; profil ölçüsü ayrı kalır (D-17)', async function(){
      const k = (await yerelAnahtar()) + '.zzbaska-profil';
      const once = S.localQuota().bytes;
      const profil = S.localSize();
      localStorage.setItem(k, 'x'.repeat(50000));
      try{
        const q = S.localQuota();
        expect(q.bytes).toBeGreaterThan(once + 49000);
        expect(S.localSize()).toBe(profil);
        expect(q.profile).toBe(profil);
      }finally{
        localStorage.removeItem(k);
      }
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
    /* BAŞKA SEKMENİN YAZMASINI TAKLİT ET.

       `storage` olayı yalnız DİĞER sekmelerde tetiklenir; burada elle
       gönderiliyor. Bellek kopyası tutmayan bir depoda bu çağrı
       zararsızdır — her okuma zaten diske gider. */
    let YEREL = null;
    async function anahtar(){ return YEREL || (YEREL = await yerelAnahtar()); }
    async function kopyayiTazele(){
      window.dispatchEvent(new StorageEvent('storage', { key:await anahtar() }));
    }

    it('bozuk yerel kayıt okunamazsa uygulama çökmez', async function(){
      const gercek = localStorage.getItem.bind(localStorage);
      let bildirildi = null;
      S.onError = (hata) => { bildirildi = hata; };
      localStorage.getItem = function(){ return '{bozuk json'; };
      let sonuc;
      try{ await kopyayiTazele(); sonuc = S.exportAll(); }
      finally{ localStorage.getItem = gercek; S.onError = null; await kopyayiTazele(); }
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
      const ak = await anahtar();
      const ham = JSON.parse(localStorage.getItem(ak) || '{}');
      ham[ON + 'ortak'] = { v:'oteki' };
      ham[ON + 'yalnizOteki'] = { v:1 };
      localStorage.setItem(ak, JSON.stringify(ham));
      await kopyayiTazele();
      expect((await S.get(ON + 'ortak')).v).toBe('oteki');
      /* Ve bizim bir sonraki yazmamız onun kaydını götürmez. */
      await S.set(ON + 'benimki', { v:2 });
      expect(await S.get(ON + 'yalnizOteki')).toBeTruthy();
      await temizle();
    });

    /* KOPYAYI TAZELEMEK YETMEZ — KULLANICI DA BİLMELİ.

       Yukarıdaki test yalnız DEPONUN kopyasını korur. Uygulamanın
       bellekteki modeli (günler, tahliller, kartlar) açılışta bir kez
       yüklenir ve bu olaydan habersizdir: iki sekme aynı kaydı
       düzenlerse son yazan, öbürünün değişikliğini SÖYLENMEDEN ezer.
       Birleştirme bu katmanın işi değil; ama haber vermek öyle. */
    it('başka sekmenin yazması onExternalWrite ile bildirilir', async function(){
      let sayac = 0;
      S.onExternalWrite = () => { sayac++; };
      try{
        await kopyayiTazele();
        expect(sayac).toBe(1);
        /* Başka bir uygulamanın ya da ilgisiz bir ayarın anahtarı
           bildirim üretmez: yanlış alarm, uyarıyı değersizleştirir. */
        window.dispatchEvent(new StorageEvent('storage', { key:'zz-ilgisiz-anahtar' }));
        expect(sayac).toBe(1);
      }finally{
        S.onExternalWrite = null;
      }
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
