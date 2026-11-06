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

    /* Telefon (2026-10-04): tarayıcı yer darlığında sitenin deposunu
       silebilir (Android Chrome'un «en iyi çaba» deposu). Telefon yolunda
       (https) kabuk kurulunca depo bir kez KALICI istenir; zaten kalıcıysa
       yeniden sorulmaz. Bilgisayarda (http://127.0.0.1) hiç sorulmaz:
       Firefox bunu kullanıcıya sorar, izin kendiliğinden istenmez. */
    const depolu = (persisted, persist) => {
      const s = sahteNav(); s.sor = 0;
      s.nav.storage = { persisted:async () => persisted,
        persist:async () => { s.sor++; if(persist instanceof Error) throw persist; return persist; } };
      return s;
    };

    it('telefonda (https) kabuk kurulunca depo kalıcı istenir; zaten kalıcıysa yeniden sorulmaz', async () => {
      const s = depolu(false, true);
      const r = await P().kaydet({ location:yer('https://ev.local:5183/'), navigator:s.nav });
      expect(r.ok).toBe(true);
      expect(r.kalici).toBe(true);
      expect(s.sor).toBe(1);
      const s2 = depolu(true, true);
      const r2 = await P().kaydet({ location:yer('https://ev.local:5183/'), navigator:s2.nav });
      expect(r2.kalici).toBe(true);
      expect(s2.sor).toBe(0);
    });

    it('bilgisayarda (http) kalıcı depo istenmez', async () => {
      const s = depolu(false, true);
      const r = await P().kaydet({ location:yer('http://127.0.0.1:4183/'), navigator:s.nav });
      expect(r.ok).toBe(true);
      expect(r.kalici).toBe(null);
      expect(s.sor).toBe(0);
    });

    it('depo desteği yoksa, reddedilirse ya da hata verirse kabuk yine kurulur', async () => {
      const yok = sahteNav();
      const r = await P().kaydet({ location:yer('https://ev.local:5183/'), navigator:yok.nav });
      expect(r.ok).toBe(true);
      expect(r.kalici).toBe(null);
      const red = depolu(false, false);
      expect((await P().kaydet({ location:yer('https://ev.local:5183/'), navigator:red.nav })).kalici).toBe(false);
      const hata = depolu(false, new Error('kota'));
      const r3 = await P().kaydet({ location:yer('https://ev.local:5183/'), navigator:hata.nav });
      expect(r3.ok).toBe(true);
      expect(r3.kalici).toBe(false);
    });
  });

  describe('Android kurulum şeridi', () => {
    const ANDROID = { userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X710)', maxTouchPoints:5 };
    const olay = () => { const e = { engel:0, soruldu:0 };
      e.preventDefault = () => { e.engel++; }; e.prompt = async () => { e.soruldu++; }; return e; };
    const temizle = () => { localStorage.removeItem('lifeos.kurulum.kapali');
      document.querySelectorAll('.pwa-serit').forEach(s => s.remove()); };

    it('Android: telefon, masaüstü sitesi isteyen tablet; bilgisayar ve iPhone değil', () => {
      expect(P().androidMi(ANDROID)).toBe(true);
      expect(P().androidMi({ userAgent:'Mozilla/5.0 (X11; Linux x86_64)', maxTouchPoints:5 })).toBe(true);
      expect(P().androidMi({ userAgent:'Mozilla/5.0 (X11; Linux x86_64)', maxTouchPoints:0 })).toBe(false);
      expect(P().androidMi({ userAgent:'Mozilla/5.0 (Windows NT 10.0)', maxTouchPoints:10 })).toBe(false);
      expect(P().androidMi({ userAgent:'Mozilla/5.0 (iPhone)', maxTouchPoints:5 })).toBe(false);
    });

    it('«Kur» tarayıcının onayını açar; bilgisayarda teklife dokunulmaz', () => {
      temizle();
      const e = olay();
      expect(P().kurulumSeridi(e, { navigator:{ userAgent:'Mozilla/5.0 (Windows NT 10.0)' } })).toBe(null);
      expect(e.engel).toBe(0);
      const s = P().kurulumSeridi(e, { navigator:ANDROID });
      expect(e.engel).toBe(1);
      expect(s.querySelector('span').textContent).toBe('Bu modülü ana ekrana kur');
      s.querySelector('[data-pwa="kur"]').click();
      expect(e.soruldu).toBe(1);
      expect(document.querySelector('.pwa-serit')).toBe(null);
      temizle();
    });

    it('«Şimdi değil» bu modülde bir daha sormaz; ikinci teklif şeridi çoğaltmaz', () => {
      temizle();
      P().kurulumSeridi(olay(), { navigator:ANDROID });
      const s = P().kurulumSeridi(olay(), { navigator:ANDROID });
      expect(document.querySelectorAll('.pwa-serit').length).toBe(1);
      s.querySelector('[data-pwa="kapat"]').click();
      expect(document.querySelector('.pwa-serit')).toBe(null);
      expect(P().kurulumSeridi(olay(), { navigator:ANDROID })).toBe(null);
      temizle();
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

    /* Telefon verisi (2026-11-06): ilk açılışta her dosya ikinci kez iniyordu, sürümlü
       dosyanın eski kopyaları kasada birikiyordu. */
    async function swKasa(fetchSahte){
      const metin = await (await fetch('../sw.js', { cache:'no-store' })).text();
      const m = new Map();
      const kasa = { match:async u => m.get(u), put:async (u, c) => { m.set(u, c); }, delete:async r => m.delete(r.url), keys:async () => [...m.keys()].map(url => ({ url })) };
      const sahte = { addEventListener:() => {}, location:{ origin:'http://yerel' }, registration:{ scope:'http://yerel/' }, clients:{} };
      const sw = new Function('self', 'caches', 'fetch', metin + ';return { agOnce, doldur, sakla };')(sahte, { open:async () => kasa }, fetchSahte);
      return { sw, m };
    }

    it('kasa dolarken dosya ikinci kez inmez: tarayıcının kopyası kullanılır', async () => {
      const giden = [];
      const { sw, m } = await swKasa(async (u, o) => { giden.push(o.cache); return { ok:true, status:200 }; });
      await sw.doldur(['http://yerel/dist-betik.js?v=a', 'http://yerel/']);
      expect(giden).toEqual(['force-cache', 'force-cache']);
      expect(m.size).toBe(2);
    });

    it('sürümlü dosya kasadaysa ağa sorulmaz, sürümsüz dosya yine ağdan gelir', async () => {
      let ag = 0;
      const { sw, m } = await swKasa(async () => { ag++; return { ok:true, status:200, type:'basic', clone(){ return this; } }; });
      m.set('http://yerel/dist-betik.js?v=a', 'kasadan');
      expect(await sw.agOnce({ url:'http://yerel/dist-betik.js?v=a', method:'GET', headers:new Headers() }, {})).toBe('kasadan');
      expect(ag).toBe(0);
      m.set('http://yerel/css/a.css', 'eski');
      const c = await sw.agOnce({ url:'http://yerel/css/a.css', method:'GET', headers:new Headers() }, { waitUntil(){} });
      expect(c === 'eski').toBeFalsy();
      expect(ag).toBe(1);
    });

    it('yeni sürüm kasaya girince aynı dosyanın eskisi silinir, öteki dosya kalır', async () => {
      const { sw, m } = await swKasa(async () => null);
      m.set('http://yerel/dist-betik.js?v=a', 1); m.set('http://yerel/dist-stil.css?v=a', 2);
      await sw.sakla('http://yerel/dist-betik.js?v=b', 3);
      expect([...m.keys()].sort()).toEqual(['http://yerel/dist-betik.js?v=b', 'http://yerel/dist-stil.css?v=a']);
    });

    /* Hesap API'si (brand/ortak/hesap.js) kasaya GİRMEZ: cevabı kişiseldir
       (kullanıcı adı, kayıtlar) ve bayat bir «durum» çevrimdışıyken yanlış
       söylerdi. SW bu isteklere hiç karışmaz; dosyalar eskisi gibi. */
    it('hesap API istekleri service worker kasasına girmez', async () => {
      const sw = await swKos([]);
      const karsilanan = [];
      const istek = u => ({ request:{ method:'GET', url:u, headers:new Headers() },
        respondWith:p => { karsilanan.push(u); if(p && p.catch) p.catch(() => {}); }, waitUntil:() => {} });
      sw.dinle.fetch(istek('http://yerel/api/hesap/ben'));
      sw.dinle.fetch(istek('http://yerel/api/hesap/durum'));
      sw.dinle.fetch(istek('http://yerel/js/app.js'));
      expect(karsilanan).toEqual(['http://yerel/js/app.js']);
    });

    /* Her yerden erişim (2026-11-06): LifeOS kapalıyken vekil boş 502 döner, bilgisayar
       kapalıyken özel ağ cevap vermez. Modül ikisinde de kopyasından, beklemeden açılır (§1.4). */
    const swSure = [];
    async function swAg(ag, kasa){
      const metin = await (await fetch('../sw.js', { cache:'no-store' })).text();
      const dinle = {}, isler = [];
      const k = { match:async u => kasa[u] || null, put:async (u, c) => { kasa[u] = c; } };
      new Function('self', 'caches', 'fetch', 'setTimeout', metin)(
        { addEventListener:(t, f) => { dinle[t] = f; }, location:{ origin:'http://yerel' }, registration:{ scope:'http://yerel/' } },
        { open:async () => k, keys:async () => [] }, ag, (f, ms) => { swSure.push(ms); setTimeout(f, 1); });
      return adres => new Promise(ok => dinle.fetch({
        request:{ method:'GET', url:adres, headers:new Headers(), mode:'cors' },
        respondWith:ok, waitUntil:p => isler.push(p) })).then(async c => (await c).text());
    }
    const YOL = 'http://yerel/js/app.js';
    const kopya = () => ({ [YOL]:new Response('eski') });
    it('LifeOS kapalıyken (502) sayfa boş kalmaz, kopyası açılır; kopya yoksa cevap aynen döner', async () => {
      const ag = async () => new Response('', { status:502 });
      expect(await (await swAg(ag, kopya()))(YOL)).toBe('eski');
      expect(await (await swAg(ag, {}))(YOL)).toBe('');
    });
    it('bilgisayar kapalıyken ağ takılsa da kopya beklemeden açılır; geç gelen cevap sonra saklanır', async () => {
      const takili = () => new Promise(() => {});
      const kasa0 = kopya();
      const ac0 = await swAg(takili, kasa0);
      swSure.length = 0;
      expect(await ac0(YOL)).toBe('eski');
      kasa0[YOL] = new Response('eski');
      expect(await ac0(YOL)).toBe('eski');
      expect(swSure[0] > 0).toBe(true);
      expect(swSure[1]).toBe(0);                     // ikinci dosya aynı süreyi yeniden beklemez
      let bitir;
      const kasa = kopya();
      const ac = await swAg(() => new Promise(ok => { bitir = ok; }), kasa);
      expect(await ac(YOL)).toBe('eski');
      bitir(new Response('yeni'));
      await new Promise(ok => setTimeout(ok, 5));
      expect(await kasa[YOL].text()).toBe('yeni');
    });
    it('kopyası olmayan dosya ağı bekler; ağ açıkken yeni sürüm gelir', async () => {
      let bitir;
      const ac = await swAg(() => new Promise(ok => { bitir = ok; }), {});
      const s = ac(YOL);
      await new Promise(ok => setTimeout(ok, 5));
      bitir(new Response('yeni'));
      expect(await s).toBe('yeni');
      expect(await (await swAg(async () => new Response('yeni'), kopya()))(YOL)).toBe('yeni');
      expect(await (await swAg(async () => { throw new Error('ag yok'); }, kopya()))(YOL)).toBe('eski');
    });

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

  describe('180 · 122 bildirim tercihi — tür anahtarı ve sessiz saat', () => {
    const MOD = 'test' + Math.random().toString(36).slice(2, 7);
    const saat = (h, m) => { const d = new Date(2026, 8, 25, h, m || 0); return d; };
    it('varsayılan: tür açık, sessiz saat kapalı; her an gönderilebilir', () => {
      expect(P().turAcik(MOD, 'ofis')).toBe(true);
      expect(P().sessizMi(MOD, saat(23, 30))).toBe(false);
      expect(P().gonderilebilir(MOD, 'ofis', saat(23, 30)).ok).toBe(true);
    });
    it('kapalı tür gönderilmez', () => {
      P().bildirimAyariYaz(MOD, { turler:{ ofis:false } });
      expect(P().gonderilebilir(MOD, 'ofis', saat(12)).neden).toBe('kapali');
      expect(P().gonderilebilir(MOD, 'baska', saat(12)).ok).toBe(true);
      P().bildirimAyariYaz(MOD, { turler:{ ofis:true } });
    });
    it('gece yarısını geçen sessiz bant: 22–08 arası sessiz, 08:00 değil', () => {
      P().bildirimAyariYaz(MOD, { sessiz:{ acik:true, bas:'22:00', bit:'08:00' } });
      expect(P().sessizMi(MOD, saat(23, 10))).toBe(true);
      expect(P().sessizMi(MOD, saat(3))).toBe(true);
      expect(P().sessizMi(MOD, saat(8))).toBe(false);
      expect(P().sessizMi(MOD, saat(21, 59))).toBe(false);
      expect(P().gonderilebilir(MOD, 'ofis', saat(23)).neden).toBe('sessiz');
    });
    it('bozuk saat yazılmaz; eski tercih kalır', () => {
      const r = P().bildirimAyariYaz(MOD, { sessiz:{ bas:'25:00' } });
      expect(r.ok).toBe(false);
      expect(P().bildirimAyari(MOD).sessiz.bas).toBe('22:00');
      try{ localStorage.removeItem('lifeos.bildirim.' + MOD); }catch(e){}
    });
  });
})();
