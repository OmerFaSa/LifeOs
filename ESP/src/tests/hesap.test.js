/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/hesap.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Hesap ve eşitleme istemcisi — tek kaynak `brand/ortak/hesap.test.js`.

   Kanıtlanan sözler (brand/ortak/hesap.js):
     1. Sunucu yoksa düğme gizlidir, hiçbir şey beklemez.
     2. Giriş yapılmadan değişiklik sıraya girmez; ilk eşitleme sunucudakini
        ezmez, olmayanı taşır, sunucudakini cihaza indirir.
     3. Çevrimdışı değişiklik sırada kalır, bağlanınca akar.
     4. Silme öteki cihaza gider.
     5. Sırada daha yeni değişikliği olan yol uzaktan gelenle ezilmez.
     6. Oturum düşerse (401) sıra kaybolmaz.
     7. Bir cihaz, bir hesap: başka hesapla girilince alan eşitlenmez.
     8. Örnek profil eşitlenmez.
     9. Jeton yerel depoya ve panele yazılmaz; çerez kapıya bağlı değil.
    10. Büyük alan partilerle gider.
    11. Gerçek depo (store.js) kancası: yazma bildirilir, uzaktan gelen
        bildirilmez, HKM jetonu eşitlenmez.
   Sunucunun kendi kuralları HKM/tests/test_hesap.py'de gerçek SQLite ile
   sınanır; buradaki sahte sunucu aynı kuralı taklit eder. */

(function(){
  const T = (window.R || window.SP || window.ESP).Test;
  const { describe, it, expect } = T;
  const H = () => window.LIFEOS.HESAP;

  /* --------------------------------------------------- sahte PC sunucusu */
  function sunucuKur(o){
    const s = Object.assign({ kullanicilar:{ omer:{ parola:'parola-123', rol:'admin' },
      anne:{ parola:'parola-456', rol:'uye' } }, jetonlar:{}, kayit:{}, sira:0,
      kurulum:false, istekler:[], kapali:false, yok:false }, o || {});
    const cevap = (kod, v) => ({ ok:kod < 300, status:kod, json:async () => v });
    s.fetch = async (url, op) => {
      s.istekler.push({ url, op });
      if(s.kapali) throw new TypeError('Failed to fetch');
      const yol = url.replace(/^https?:\/\/[^/]+/, '');
      if(s.yok) return cevap(404, null);
      const govde = op && op.body ? JSON.parse(op.body) : null;
      if(yol === '/api/hesap/durum') return cevap(200, { surum:1, kurulum:s.kurulum, yerel:true });
      if(yol === '/api/hesap/giris'){
        const k = s.kullanicilar[govde.ad];
        if(!k || k.parola !== govde.parola) return cevap(401, { hata:'Kullanıcı adı ya da parola yanlış.' });
        const j = 'jeton-' + Object.keys(s.jetonlar).length + '-gizli';
        s.jetonlar[j] = govde.ad;
        return cevap(200, { jeton:j, kullanici:{ ad:govde.ad, rol:k.rol } });
      }
      const ad = s.jetonlar[String((op.headers || {}).Authorization || '').slice(7)];
      if(!ad) return cevap(401, { hata:'Oturum yok ya da süresi doldu; yeniden giriş yap.' });
      if(yol === '/api/hesap/cikis'){ delete s.jetonlar[String(op.headers.Authorization).slice(7)]; return cevap(200, { ok:true }); }
      if(yol === '/api/hesap/esitle'){
        const t = s.kayit[ad + '|' + govde.alan] = s.kayit[ad + '|' + govde.alan] || {};
        let kabul = 0, red = 0;
        govde.gonder.forEach(g => {
          const r = t[g.y];
          if(r){ if(g.ilk || g.z < r.z || (g.z === r.z && govde.cihaz <= r.c)){ red++; return; } }
          else if(g.ilk && g.d === null) return;
          s.sira++;
          t[g.y] = { d:g.d, z:g.z, c:govde.cihaz, s:s.sira };
          kabul++;
        });
        const sinir = s.sinir || 1000;
        const satir = Object.entries(t).filter(([, r]) => r.s > govde.son).sort((a, b) => a[1].s - b[1].s);
        const daha = satir.length > sinir, parca = satir.slice(0, sinir);
        return cevap(200, { al:parca.filter(([, r]) => r.c !== govde.cihaz).map(([y, r]) => ({ y, d:r.d, z:r.z, s:r.s })),
          son:daha ? parca[parca.length - 1][1].s : Math.max(govde.son, s.sira), daha, kabul, red });
      }
      return cevap(404, { hata:'Böyle bir istek yok.' });
    };
    /* Sunucuya başka bir cihazdan doğrudan yazmak için. */
    s.yaz = (ad, alan, y, d, z, cihaz) => {
      const t = s.kayit[ad + '|' + alan] = s.kayit[ad + '|' + alan] || {};
      s.sira++;
      t[y] = { d, z, c:cihaz || 'baska-cihaz-1', s:s.sira };
    };
    s.oku = (ad, alan, y) => { const r = (s.kayit[ad + '|' + alan] || {})[y]; return r ? r.d : undefined; };
    return s;
  }

  /* --------------------------------------------------- sahte cihaz */
  function cihazKur(srv, o){
    o = o || {};
    const jar = {}, ls = {};
    const depo = {
      alan:o.alan || 'spi/ben', veri:Object.assign({}, o.veri || {}), _d:null, yenilenen:0,
      hepsi(){ return Object.assign({}, this.veri); },
      uzaktan(c){ c.forEach(([y, d]) => { if(d === null) delete this.veri[y]; else this.veri[y] = d; }); return true; },
      set onDegisim(fn){ this._d = fn; },
      yaz(y, d){ this.veri[y] = d; if(this._d) this._d([y]); },
      sil(y){ delete this.veri[y]; if(this._d) this._d([y]); },
    };
    return {
      depo, jar, ls,
      ortam:{
        fetch:srv.fetch,
        simdi:(() => { let t = 1700000000000; return () => (t += 1000); })(),
        yerelUygulama:() => !!o.uygulama,
        konum:() => ({ protocol:o.https ? 'https:' : 'http:' }),
        cerez:{
          oku:() => Object.entries(jar).map(([k, v]) => k + '=' + v).join('; '),
          yaz:s => {
            jar.__son = s;
            const kv = s.split(';')[0], i = kv.indexOf('=');
            const k = kv.slice(0, i).trim();
            if(/Max-Age=0/.test(s)) delete jar[k]; else jar[k] = kv.slice(i + 1);
          },
        },
        depo:{
          oku:k => (ls[k] === undefined ? null : JSON.parse(ls[k])),
          yaz:(k, v) => { ls[k] = JSON.stringify(v); return true; },
          sil:k => { delete ls[k]; },
        },
        zamanla:() => 0,          // zamanlayıcılar elle sürülür (await H().esitle())
        iptal:() => {},
        rastgele:n => new Uint8Array(n).map((_, i) => (i * 37 + (o.tohum || 1)) % 256),
      },
      ornek:o.ornek,
    };
  }

  let yedek = null;
  function sahne(cihaz){
    const h = H();
    h._sifirla();
    yedek = yedek || Object.assign({}, h._ortam);
    Object.assign(h._ortam, cihaz.ortam);
    h.kur({ modul:'spi', depo:cihaz.depo, ornek:cihaz.ornek || (() => false),
      yenile:async () => { cihaz.depo.yenilenen++; }, mesgul:() => false });
    return h;
  }
  function birak(){
    const h = H();
    h._sifirla();
    if(yedek) Object.assign(h._ortam, yedek);
  }
  async function sahneyle(fn){ try{ await fn(); } finally{ birak(); } }
  const bekle = () => new Promise(r => setTimeout(r, 0));
  async function hazir(){ for(let i = 0; i < 20; i++) await bekle(); }
  const esitleIstekleri = srv => srv.istekler.filter(x => /esitle$/.test(x.url));

  describe('Hesap — sunucu ve giriş', () => {
    it('sunucu yoksa düğme gizli, hiçbir şey beklemez', () => sahneyle(async () => {
      const srv = sunucuKur({ yok:true }), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      expect(h.durum().durum).toBe('yok');
      expect(h.dugme().gizli).toBe(true);
      c.depo.yaz('vitals/2026-10-04', { sleep:7 });
      expect(h.durum().bekleyen).toBe(0);
    }));

    it('giriş yapılmadan değişiklik sıraya girmez; düğme görünür', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      expect(h.durum().durum).toBe('giris');
      expect(h.dugme().gizli).toBe(false);
      c.depo.yaz('vitals/2026-10-04', { sleep:7 });
      expect(h.durum().bekleyen).toBe(0);
      expect(esitleIstekleri(srv).length).toBe(0);
    }));

    it('yanlış parola söylenir, oturum açılmaz', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      let hata = null;
      try{ await h.girisYap('omer', 'yanlis-parola'); }catch(e){ hata = e; }
      expect(hata && hata.message).toContain('yanlış');
      expect(h.durum().oturum).toBeNull();
    }));
  });

  describe('Hesap — eşitleme', () => {
    it('ilk eşitleme sunucudakini ezmez, olmayanı taşır, sunucudakini indirir', () => sahneyle(async () => {
      const srv = sunucuKur();
      srv.yaz('omer', 'spi/ben', 'profile', { name:'gerçek' }, 5);
      srv.yaz('omer', 'spi/ben', 'vitals/2026-10-01', { sleep:8 }, 5);
      const c = cihazKur(srv, { veri:{ profile:{ name:'deneme' }, 'workouts/w1':{ km:5 } } });
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      expect(srv.oku('omer', 'spi/ben', 'profile')).toEqual({ name:'gerçek' });
      expect(srv.oku('omer', 'spi/ben', 'workouts/w1')).toEqual({ km:5 });
      expect(c.depo.veri.profile).toEqual({ name:'gerçek' });
      expect(c.depo.veri['vitals/2026-10-01']).toEqual({ sleep:8 });
      expect(h.durum().durum).toBe('tamam');
      expect(c.depo.yenilenen > 0).toBe(true);
    }));

    it('çevrimdışı değişiklik sırada kalır, bağlanınca akar', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      srv.kapali = true;
      c.depo.yaz('workouts/kosu', { km:4.2 });
      expect(h.durum().bekleyen).toBe(1);
      await h.esitle();
      expect(h.durum().durum).toBe('cevrimdisi');
      expect(h.durum().bekleyen).toBe(1);
      expect(h.durum().metin).toContain('sırada');
      srv.kapali = false;
      await h.esitle();
      expect(srv.oku('omer', 'spi/ben', 'workouts/kosu')).toEqual({ km:4.2 });
      expect(h.durum().bekleyen).toBe(0);
      expect(h.durum().durum).toBe('tamam');
    }));

    it('bir cihazda silinen kayıt öteki cihazdan da silinir', () => sahneyle(async () => {
      const srv = sunucuKur();
      const a = cihazKur(srv, { veri:{ 'meals/m1':{ kcal:500 } }, tohum:1 });
      let h = sahne(a);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      const b = cihazKur(srv, { tohum:7 });
      h = sahne(b);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      expect(b.depo.veri['meals/m1']).toEqual({ kcal:500 });
      h = sahne(a);
      await hazir();
      a.depo.sil('meals/m1');
      await h.esitle();
      h = sahne(b);
      await hazir();
      await h.esitle();
      expect(b.depo.veri['meals/m1']).toBe(undefined);
    }));

    it('sırada daha yeni değişikliği olan yol uzaktan gelenle ezilmez', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv, { veri:{ hedef:{ v:1 } } });
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      /* Yerel değişiklik ilk partiye sığmaz (400 kayıt önde); o sırada
         başka cihazın ESKİ zamanlı sürümü iner. İnen sürüm sıradaki yerel
         değişikliği ezseydi bir sonraki partide eski değer gönderilirdi. */
      for(let i = 0; i < 400; i++) c.depo.yaz('k/' + i, { i });
      c.depo.yaz('hedef', { v:3 });                       // yerel, yeni (sırada, 401.)
      srv.yaz('omer', 'spi/ben', 'hedef', { v:2 }, 10);   // uzak, eski zaman
      await h.esitle();
      expect(c.depo.veri.hedef).toEqual({ v:3 });
      expect(srv.oku('omer', 'spi/ben', 'hedef')).toEqual({ v:3 });
      expect(h.durum().bekleyen).toBe(0);
    }));

    it('oturum düşerse (401) sıra kaybolmaz, yeniden girince gider', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      srv.jetonlar = {};
      c.depo.yaz('notes/1', { t:'x' });
      await h.esitle();
      expect(h.durum().durum).toBe('giris');
      expect(h.durum().oturum).toBeNull();
      expect(h.durum().bekleyen).toBe(1);
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      expect(srv.oku('omer', 'spi/ben', 'notes/1')).toEqual({ t:'x' });
    }));

    it('başka hesapla girilen cihazda alan eşitlenmez ve söylenir', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv, { veri:{ profile:{ name:'Ömer' } } });
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      await h.cikisYap();
      const once = esitleIstekleri(srv).length;
      await h.girisYap('anne', 'parola-456');
      await h.esitle();
      expect(h.durum().durum).toBe('baska');
      expect(h.durum().mesaj).toContain('omer');
      expect(esitleIstekleri(srv).length).toBe(once);
      expect(srv.oku('anne', 'spi/ben', 'profile')).toBe(undefined);
    }));

    it('örnek profil eşitlenmez', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv, { ornek:() => true });
      const h = sahne(c);
      await hazir();
      expect(h.durum().durum).toBe('ornek');
      expect(esitleIstekleri(srv).length).toBe(0);
    }));

    it('büyük alan partilerle gider, hepsi sunucuya ulaşır', () => sahneyle(async () => {
      const veri = {};
      for(let i = 0; i < 900; i++) veri['k/' + i] = { i };
      const srv = sunucuKur(), c = cihazKur(srv, { veri });
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      const istek = esitleIstekleri(srv);
      expect(istek.length >= 3).toBe(true);
      expect(istek.every(x => JSON.parse(x.op.body).gonder.length <= 400)).toBe(true);
      expect(Object.keys(srv.kayit['omer|spi/ben']).length).toBe(900);
      expect(h.durum().durum).toBe('tamam');
    }));
  });

  describe('Hesap — güvenlik ve uygulama', () => {
    it('bilgisayarda panel, telefonda yazılacak adresi gösterir', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      const f = srv.fetch;
      srv.fetch = async (u, o) => (/durum$/.test(u)
        ? { ok:true, status:200, json:async () => ({ surum:1, kurulum:false, yerel:true, ev_agi:['192.168.0.10'] }) }
        : f(u, o));
      c.ortam.fetch = srv.fetch;
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      expect(h.panelHtml()).toContain('192.168.0.10');
      expect(h.panelHtml()).toContain('https://192.168.0.10:5183');
    }));

    it('jeton yerel depoya ve panele yazılmaz; çerez kapıya bağlı değil', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv, { https:true });
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      const jeton = Object.keys(srv.jetonlar)[0];
      expect(JSON.stringify(c.ls).indexOf(jeton) < 0).toBe(true);
      expect(h.panelHtml().indexOf(jeton) < 0).toBe(true);
      expect(c.jar.__son).toContain('Path=/');
      expect(c.jar.__son).toContain('SameSite=Strict');
      expect(c.jar.__son).toContain('Secure');
      expect(/Domain|Port/i.test(c.jar.__son)).toBe(false);
    }));

    it('uygulamada bilgisayarın adresi sorulur ve düzgün yazılır', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv, { uygulama:true });
      const h = sahne(c);
      await hazir();
      expect(h.dugme().gizli).toBe(false);
      expect(h.panelHtml()).toContain('Bilgisayarın adresi');
      expect(h.adresDuzelt('192.168.0.10')).toBe('https://192.168.0.10:5183');
      expect(h.adresDuzelt('https://pc.local:5173/x?y')).toBe('https://pc.local:5173');
      expect(h.adresDuzelt('')).toBeNull();
      await h.girisYap('omer', 'parola-123', '192.168.0.10');
      expect(srv.istekler.some(x => x.url === 'https://192.168.0.10:5183/api/hesap/giris')).toBe(true);
      await h.esitle();
      expect(esitleIstekleri(srv)[0].url).toBe('https://192.168.0.10:5183/api/hesap/esitle');
    }));
  });

  describe('Hesap — gerçek depo kancası', () => {
    const S = T.realStore;
    it('yazma ve silme bildirilir; uzaktan gelen bildirilmez; HKM jetonu eşitlenmez', async () => {
      if(!S || typeof S.uzaktan !== 'function'){ expect('store.js kancası').toBe('var'); return; }
      const gelen = [], eskiHkm = await S.get('hkm');
      S.onDegisim = y => gelen.push.apply(gelen, y);
      try{
        await S.set('zzhesap/a', { x:1 });
        await S.remove('zzhesap/a');
        S.uzaktan([['zzhesap/b', { y:2 }]]);
        expect(S.hepsi()['zzhesap/b']).toEqual({ y:2 });
        await S.set('hkm', { token:'gizli' });
        expect(gelen).toEqual(['zzhesap/a', 'zzhesap/a']);
        expect(S.hepsi().hkm).toBe(undefined);
        expect(typeof S.alan === 'string' && /^(ays|spi|esp)\//.test(S.alan)).toBe(true);
      }finally{
        S.onDegisim = null;
        S.uzaktan([['zzhesap/b', null]]);
        if(eskiHkm == null) await S.remove('hkm'); else await S.set('hkm', eskiHkm);
      }
    });
  });
})();
