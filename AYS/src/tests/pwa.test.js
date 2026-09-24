/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/pwa.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* PWA — çevrimdışı kabuğun kaydı (brand/ortak/pwa.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/pwa.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler:
     1. Yalnız http(s) ile açılınca kaydedilir; file:// hiç denenmez.
     2. Kayıt olmazsa hata fırlamaz, sonuç döner.
     3. İlk açılışın dosyaları kabuğa gönderilir; başka köken gönderilmez.

   Kabuğun kendisi (`sw.js`) tarayıcıda uçtan uca denenir: her modülün
   duman testi sayfayı çevrimdışı yeniden açar. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const P = () => window.LIFEOS.Pwa;

  function sahteNav(o){
    o = o || {};
    const kayitlar = [], mesajlar = [];
    const isci = { postMessage:m => mesajlar.push(m) };
    const nav = { serviceWorker:{
      register:async (yol, sec) => {
        if(o.red) throw new Error('404');
        kayitlar.push([yol, sec.scope]);
        return { active:isci };
      },
      ready:Promise.resolve({ active:isci }),
    } };
    return { nav, kayitlar, mesajlar };
  }
  const yer = (href) => { const u = new URL(href); return { href, protocol:u.protocol, origin:u.origin }; };
  const perf = (adlar) => ({ getEntriesByType:t => t === 'resource' ? adlar.map(name => ({ name })) : [] });

  describe('PWA — kabuğun kaydı', () => {
    it('yalnız http(s) uygun; file:// ve desteksiz tarayıcı değil', () => {
      const { nav } = sahteNav();
      expect(P().uygun(yer('http://127.0.0.1:4173/'), nav)).toBe(true);
      expect(P().uygun(yer('https://ornek.org/rota.html'), nav)).toBe(true);
      expect(P().uygun(yer('file:///home/ben/rota.html'), nav)).toBe(false);
      expect(P().uygun(yer('http://127.0.0.1:4173/'), {})).toBe(false);
    });

    it('file:// ile hiçbir şey denenmez ve nedeni söylenir', async () => {
      const s = sahteNav();
      const r = await P().kaydet({ location:yer('file:///home/ben/rota.html'), navigator:s.nav });
      expect(r).toEqual({ ok:false, neden:'dosya' });
      expect(s.kayitlar).toHaveLength(0);
    });

    it('sunucuyla kaydedilir; ilk açılışın aynı kökenli dosyaları gönderilir', async () => {
      const s = sahteNav();
      const r = await P().kaydet({ location:yer('http://127.0.0.1:4173/#bugun'), navigator:s.nav,
        performance:perf(['http://127.0.0.1:4173/js/app.js', 'https://fonts.gstatic.com/x.woff2',
          'http://127.0.0.1:4200/api/status', 'http://127.0.0.1:4173/js/app.js',
          'http://127.0.0.1:4173/img/brand/favicon.png#x']) });
      expect(r.ok).toBe(true);
      expect(s.kayitlar).toEqual([['sw.js', './']]);
      expect(s.mesajlar).toEqual([{ tur:'onbellek', adresler:['http://127.0.0.1:4173/',
        'http://127.0.0.1:4173/js/app.js', 'http://127.0.0.1:4173/img/brand/favicon.png'] }]);
    });

    it('kayıt reddedilirse hata fırlamaz', async () => {
      const s = sahteNav({ red:true });
      const r = await P().kaydet({ location:yer('http://127.0.0.1:4173/'), navigator:s.nav });
      expect(r.ok).toBe(false);
      expect(r.neden).toBe('kayit');
      expect(s.mesajlar).toHaveLength(0);
    });

    it('gönderilen adres sayısı sınırlıdır', () => {
      const cok = [];
      for(let i = 0; i < 600; i++) cok.push('http://127.0.0.1:4173/img/' + i + '.png');
      expect(P().adresler(yer('http://127.0.0.1:4173/'), perf(cok))).toHaveLength(P().EN_COK);
    });
  });

  describe('164 · Bildirim kartı', () => {
    const KART = { modul:'ays', baslik:'Sıradaki 20:30', cumle:'Paragraf · akşam bloğu, 30 soru.',
      eylemler:[{ id:'basla', ad:'Başla' }, { id:'ertele', ad:'15 dk ertele' }], rota:'today' };
    const sahteN = (izin, maxActions) => {
      const N = { permission:izin, istendi:0, requestPermission:async () => { N.istendi++; return 'granted'; } };
      if(maxActions !== undefined) N.maxActions = maxActions;
      return N;
    };
    const sahteKayit = () => {
      const gosterilen = [];
      return { gosterilen, nav:{ serviceWorker:{ ready:Promise.resolve({
        showNotification:async (b, s) => { gosterilen.push([b, s]); } }) } } };
    };

    it('oz-164 Telefon bildirimi: modül rengi, tek cümle, iki eylem.', () => {
      const k = P().bildirimKarti(KART, { eylem:2 });
      expect(k.ok).toBeTruthy();
      /* Sistem bildirimine renk verilemez: modül ADIYLA söylenir. */
      expect(k.baslik).toBe('AYS · Sıradaki 20:30');
      expect(k.secenek.body).toBe('Paragraf · akşam bloğu, 30 soru.');
      expect(k.secenek.actions).toEqual([{ action:'basla', title:'Başla' }, { action:'ertele', title:'15 dk ertele' }]);
      expect(k.secenek.data).toEqual({ modul:'ays', rota:'today', eylemler:['basla', 'ertele'],
        adlar:{ basla:'Başla', ertele:'15 dk ertele' } });
      expect(P().EN_COK_EYLEM).toBe(2);
    });

    it('oz-164 eylem düğmeleri platforma göre: eylemsiz platformda (iOS) düğme yok, kart yine aynı', () => {
      expect(P().bildirimDestegi({ Notification:sahteN('granted', 2) }).eylem).toBe(2);
      expect(P().bildirimDestegi({ Notification:sahteN('granted', 5) }).eylem).toBe(2);
      expect(P().bildirimDestegi({ Notification:sahteN('granted') }).eylem).toBe(0);   // maxActions yok
      expect(P().bildirimDestegi({ Notification:null }).var).toBeFalsy();
      const k = P().bildirimKarti(KART, { eylem:0 });
      expect(k.secenek.actions).toEqual([]);
      expect(k.gizlenenEylem).toBe(2);
      expect(k.secenek.body).toBe(KART.cumle);
    });

    it('oz-164 kart kodla doğrulanır: tek cümle, en çok iki eylem, sonucu söyleyen eylem adı', () => {
      const h = o => P().bildirimKarti(Object.assign({}, KART, o), { eylem:2 }).hatalar || [];
      expect(h({ cumle:'Bir. İki.' })).toEqual(['tek cümle değil']);
      expect(h({ cumle:'' })).toEqual(['cümle yok']);
      expect(h({ modul:'hkm' })).toEqual(['modül bilinmiyor']);
      expect(h({ eylemler:[{ id:'a', ad:'A' }, { id:'b', ad:'B' }, { id:'c', ad:'C' }] })).toEqual(['en çok iki eylem']);
      expect(h({ eylemler:[{ id:'e', ad:'Evet' }] })).toEqual(['eylem sonucu söylemeli («Evet» değil)']);
      expect(h({ eylemler:[{ id:'t', ad:'Tamam' }] })).toEqual(['eylem sonucu söylemeli («Tamam» değil)']);
    });

    it('oz-164 izin yoksa bildirim gösterilmez ve izin KENDİLİĞİNDEN istenmez', async () => {
      const N = sahteN('default', 2), s = sahteKayit();
      const r = await P().bildir(KART, { Notification:N, navigator:s.nav });
      expect(r).toEqual({ ok:false, neden:'izin', izin:'default' });
      expect(N.istendi).toBe(0);
      expect(s.gosterilen).toHaveLength(0);
      /* İzin yalnız çağrıldığında (kullanıcının düğmesinden) istenir. */
      expect(await P().izinIste({ Notification:N })).toBe('granted');
      expect(N.istendi).toBe(1);
      expect(await P().izinIste({ Notification:null })).toBe('desteklenmiyor');
    });

    it('oz-164 izin varsa service worker üzerinden gösterilir; bozuk kart gösterilmez', async () => {
      const s = sahteKayit();
      const r = await P().bildir(KART, { Notification:sahteN('granted', 2), navigator:s.nav });
      expect(r.ok).toBeTruthy();
      expect(s.gosterilen).toHaveLength(1);
      expect(s.gosterilen[0][0]).toBe('AYS · Sıradaki 20:30');
      const b = await P().bildir(Object.assign({}, KART, { cumle:'' }), { Notification:sahteN('granted', 2), navigator:s.nav });
      expect(b.neden).toBe('kart');
      expect(s.gosterilen).toHaveLength(1);
      expect((await P().bildir(KART, { Notification:null })).neden).toBe('desteklenmiyor');
    });

    it('oz-164 service worker eylemi uygulamaz, uygulamaya olay olarak iletir', () => {
      let dinleyici = null;
      const nav = { serviceWorker:{ addEventListener:(t, f) => { if(t === 'message') dinleyici = f; } } };
      const hedef = document.createElement('div');
      const gelen = [];
      hedef.addEventListener('lifeos:bildirim', e => gelen.push(e.detail));
      expect(P().bildirimDinle({ navigator:nav, hedef:hedef })).toBeTruthy();
      dinleyici({ data:{ tur:'onbellek' } });                       // başka mesaj yok sayılır
      dinleyici({ data:{ tur:'bildirim', eylem:'ertele', rota:'today', modul:'ays' } });
      expect(gelen).toEqual([{ eylem:'ertele', rota:'today', modul:'ays' }]);
      expect(P().bildirimDinle({ navigator:{} , hedef:hedef })).toBeFalsy();
    });

    /* T2-11: uygulama kapalıyken basılan eylem kaybolmaz. sw.js'in KENDİSİ
       sahte bir `self` ile koşar: pencere yoksa eylem adrese taşınır; uygulama
       açılınca bildirimDinle onu olay olarak verir ve adresten siler. SW yine
       hiçbir şeyi uygulamaz. */
    async function swKos(pencereler){
      const metin = await (await fetch('../sw.js', { cache:'no-store' })).text();
      const dinle = {}, acilan = [], giden = [];
      const sahte = {
        addEventListener:(t, f) => { dinle[t] = f; },
        location:{ origin:'http://yerel' },
        registration:{ scope:'http://yerel/ays/' },
        clients:{
          matchAll:async () => pencereler.map(p => ({ postMessage:m => giden.push(m), focus:async () => {} })),
          openWindow:async u => { acilan.push(u); return null; },
        },
      };
      new Function('self', 'caches', 'fetch', metin)(sahte, {}, () => Promise.reject(new Error('ag yok')));
      return { dinle, acilan, giden };
    }
    function tik(sw, eylem){
      let is = null;
      sw.dinle.notificationclick({ action:eylem, waitUntil:p => { is = p; },
        notification:{ close:() => {}, data:{ modul:'ays', rota:'today', eylemler:['bitti', 'ertele'],
          adlar:{ bitti:'Bitti', ertele:'Yarına ertele' } } } });
      return is;
    }

    it('T2-11 uygulama kapalıyken bildirimdeki eylem adrese taşınır, kaybolmaz', async () => {
      const kapali = await swKos([]);
      await tik(kapali, 'bitti');
      expect(kapali.acilan).toHaveLength(1);
      const u = new URL(kapali.acilan[0]);
      expect(u.searchParams.get('bildirim')).toBe('bitti');
      expect(u.searchParams.get('ad')).toBe('Bitti');
      expect(u.searchParams.get('modul')).toBe('ays');
      expect(u.hash).toBe('#today');
      /* Gövdeye basmak (eylem yok) yalnız rotayı açar; soracak bir şey yok. */
      await tik(kapali, '');
      expect(kapali.acilan[1]).toBe('http://yerel/ays/#today');
      /* Pencere açıksa eylem adıyla birlikte iletilir. */
      const acik = await swKos([{}]);
      await tik(acik, 'ertele');
      expect(acik.acilan).toHaveLength(0);
      expect(acik.giden).toEqual([{ tur:'bildirim', eylem:'ertele', ad:'Yarına ertele', rota:'today', modul:'ays' }]);
    });

    it('T2-11 uygulama açılınca bekleyen eylem olay olur, adresten silinir ve SORULUR', () => {
      const nav = { serviceWorker:{ addEventListener:() => {} } };
      const hedef = document.createElement('div');
      const gelen = [], yazilan = [];
      hedef.addEventListener('lifeos:bildirim', e => gelen.push(e.detail));
      const konum = { pathname:'/ays/', search:'?bildirim=bitti&ad=Bitti&modul=ays', hash:'#today' };
      const gecmis = { replaceState:(a, b, u) => yazilan.push(u) };
      expect(P().bildirimDinle({ navigator:nav, hedef:hedef, konum:konum, gecmis:gecmis })).toBeTruthy();
      expect(gelen).toEqual([{ eylem:'bitti', ad:'Bitti', rota:'today', modul:'ays', kapaliyken:true }]);
      expect(yazilan).toEqual(['/ays/#today']);
      expect(P().bildirimSorusu(gelen[0])).toBe('Bildirimde «Bitti» dedin; şimdi uygulansın mı?');
      /* Adreste bildirim yoksa olay da yok. */
      const bos = [];
      hedef.addEventListener('lifeos:bildirim', e => bos.push(e.detail));
      P().bildirimDinle({ navigator:nav, hedef:hedef, konum:{ pathname:'/ays/', search:'', hash:'' }, gecmis:gecmis });
      expect(bos).toHaveLength(0);
    });

    it('T2-11 bildirim kartı eylem adlarını SW için taşır', () => {
      const k = P().bildirimKarti({ modul:'ays', baslik:'Sıradaki', cumle:'Paragraf 20:30’da.',
        rota:'today', eylemler:[{ id:'bitti', ad:'Bitti' }] }, { eylem:2 });
      expect(k.secenek.data.adlar).toEqual({ bitti:'Bitti' });
    });
  });

})();
