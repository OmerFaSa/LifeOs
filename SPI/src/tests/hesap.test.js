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
    12. Giriş ekranı: sunucu varken ve hesap yokken açılışta çıkar; sunucu
        yoksa çıkmaz; ÖNCE ANA MENÜ gelir (form değil); beta girişi kapatır
        (bu oturumda yeniden çıkmaz); kayıt ve «şifremi unuttum» oturum
        açar; hata yazılanı silmez; girilen hesap hatırlanır (şifre ve
        jeton değil), «×» unutur; yeni hesap kapalıysa «Hesap oluştur» yok.
    13. Yazılıp kaydedilmemiş alan ekran yenilemesini bekletir (odak
        alanda olmasa da); model hemen tazelenir; açık kağıt ikisini de
        bekletir.
    14. Uzaktan gelen kayıt yereldekiyle aynıysa ekran yenilenmez.
    15. Depo ölçümü (storage) cihaza aittir: eşitlenmez.
    16. Öteki tazeleyicilerin çizimi (cizIste) aynı denetimden geçer:
        kirli alan, odak ya da açık kağıt varken bekler, bitince bir kez
        çizer; üst üste istek tek çizimdir; kur() çağrılmadan da çalışır.
    17. Hesap sayfası: kimlik, plan (fiyatsız, düğmesiz), profil kaydı
        çereze iner; cihazlardan çıkılır, «hepsinden çık» onay ister; yönetim
        yalnız adminde; yazılan alan gelen veriyle silinmez; sunucu yoksa
        son bilinen gösterilir; oturum düşerse giriş ekranı gelir.
   Sunucunun kendi kuralları HKM/tests/test_hesap.py'de gerçek SQLite ile
   sınanır; buradaki sahte sunucu aynı kuralı taklit eder. */

(function(){
  const T = (window.R || window.SP || window.ESP).Test;
  const { describe, it, expect } = T;
  const H = () => window.LIFEOS.HESAP;

  /* --------------------------------------------------- sahte PC sunucusu */
  const PLANLAR = [
    { id:'ucretsiz', ad:'Ücretsiz', etiket:'Beta', durum:'acik', ozet:'Bugün kullandığın her şey.', ozellik:['Dört sistem'] },
    { id:'plus', ad:'Plus', etiket:'Yakında', durum:'yakinda', ozet:'Daha çok.', ozellik:['Fotoğraflar da eşitlenir'] },
  ];
  function sunucuKur(o){
    const s = Object.assign({ kullanicilar:{ omer:{ parola:'parola-123', rol:'admin' },
      anne:{ parola:'parola-456', rol:'uye' } }, jetonlar:{}, oturumlar:{}, kayit:{}, sira:0, oturumSira:0,
      kurulum:false, kayitAcik:true, istekler:[], kapali:false, yok:false }, o || {});
    const cevap = (kod, v) => ({ ok:kod < 300, status:kod, json:async () => v });
    s.kimlikSira = s.kimlikSira || 0;
    const kimlik = k => k.kimlik || (k.kimlik = (++s.kimlikSira).toString(16).padStart(16, '0'));
    const profil = ad => {
      const k = s.kullanicilar[ad], plan = k.plan || 'ucretsiz';
      return { id:Object.keys(s.kullanicilar).indexOf(ad) + 1, ad, rol:k.rol, gorunen_ad:k.gorunen_ad || ad,
        renk:k.renk || 'mavi', plan, plan_ad:(PLANLAR.find(p => p.id === plan) || PLANLAR[0]).ad, olusturma:'2026-10-05T10:00:00',
        kimlik:kimlik(k), dogum:k.dogum || '', hitap:k.hitap || '', eposta:k.eposta || '' };
    };
    /* Hesabı sunucuda sil / aynı adla yeniden aç (başka cihazdan yapılmış gibi). */
    s.silKullanici = ad => {
      delete s.kullanicilar[ad];
      Object.keys(s.jetonlar).forEach(j => { if(s.jetonlar[j] === ad){ delete s.jetonlar[j]; delete s.oturumlar[j]; } });
      Object.keys(s.kayit).forEach(x => { if(x.indexOf(ad + '|') === 0) delete s.kayit[x]; });
    };
    const oturumAc = (ad, on, govde) => {
      const j = 'jeton-' + on + Object.keys(s.jetonlar).length + '-gizli';
      s.jetonlar[j] = ad;
      s.oturumlar[j] = { id:++s.oturumSira, cihaz_ad:(govde && govde.cihaz_ad) || 'Cihaz', son:1700000000000 };
      return { jeton:j, kullanici:profil(ad) };
    };
    s.fetch = async (url, op) => {
      s.istekler.push({ url, op });
      if(s.kapali) throw new TypeError('Failed to fetch');
      const yol = url.replace(/^https?:\/\/[^/]+/, '');
      if(s.yok) return cevap(404, null);
      const govde = op && op.body ? JSON.parse(op.body) : null;
      if(yol === '/api/hesap/durum') return cevap(200, { surum:3, kurulum:s.kurulum, kayit:s.kayitAcik, yerel:true });
      if(yol === '/api/hesap/kayit'){
        if(s.kullanicilar[govde.ad]) return cevap(409, { hata:'Bu adla bir kullanıcı zaten var.' });
        const ilk = !Object.keys(s.kullanicilar).length;
        if(!ilk && !s.kayitAcik) return cevap(403, { hata:'Yeni hesap açma kapalı. Hesabı admin ekler.' });
        s.kullanicilar[govde.ad] = { parola:govde.parola, rol:ilk ? 'admin' : 'uye', soru:govde.soru, cevap:govde.cevap };
        s.kurulum = false;
        return cevap(200, oturumAc(govde.ad, 'k', govde));
      }
      if(yol === '/api/hesap/soru'){
        const k = s.kullanicilar[govde.ad];
        return k && k.soru ? cevap(200, { soru:k.soru }) : cevap(404, { hata:'Bu kullanıcı adı için kurtarma sorusu yok.' });
      }
      if(yol === '/api/hesap/kurtar'){
        const k = s.kullanicilar[govde.ad];
        if(!k || String(k.cevap).toLowerCase() !== String(govde.cevap).trim().toLowerCase()) return cevap(401, { hata:'Cevap yanlış.' });
        k.parola = govde.yeni;
        return cevap(200, oturumAc(govde.ad, 'r', govde));
      }
      if(yol === '/api/hesap/giris'){
        const k = s.kullanicilar[govde.ad];
        if(!k || k.parola !== govde.parola) return cevap(401, { hata:'Kullanıcı adı ya da parola yanlış.' });
        return cevap(200, oturumAc(govde.ad, '', govde));
      }
      const bu = String((op && op.headers || {}).Authorization || '').slice(7);
      const ad = s.jetonlar[bu];
      if(!ad) return cevap(401, { hata:'Oturum yok ya da süresi doldu; yeniden giriş yap.' });
      const admin = s.kullanicilar[ad].rol === 'admin';
      const sil = j => { delete s.jetonlar[j]; delete s.oturumlar[j]; };
      if(yol === '/api/hesap/cikis'){ sil(bu); return cevap(200, { ok:true }); }
      if(yol === '/api/hesap/ben'){
        return cevap(200, { kullanici:profil(ad), ozet:s.ozet || {}, soru_var:!!s.kullanicilar[ad].soru, planlar:PLANLAR,
          renkler:['mavi', 'turkuaz', 'mor'], kayit:s.kayitAcik });
      }
      if(yol === '/api/hesap/profil'){
        if(govde.renk != null && ['mavi', 'turkuaz', 'mor'].indexOf(govde.renk) < 0) return cevap(400, { hata:'Bu renk listede yok.' });
        const k = s.kullanicilar[ad];
        if(govde.gorunen_ad != null) k.gorunen_ad = String(govde.gorunen_ad).trim() || null;
        if(govde.renk != null) k.renk = govde.renk;
        ['dogum', 'hitap', 'eposta'].forEach(a => { if(govde[a] != null) k[a] = String(govde[a]).trim(); });
        return cevap(200, { kullanici:profil(ad) });
      }
      if(yol === '/api/hesap/etkinlik') return cevap(200, { olaylar:s.olaylar || [] });
      if(yol === '/api/hesap/disa'){
        const alanlar = {};
        Object.keys(s.kayit).filter(x => x.indexOf(ad + '|') === 0).forEach(x => {
          const t = s.kayit[x], a = x.slice(ad.length + 1);
          Object.keys(t).forEach(y => { if(t[y].d !== null) (alanlar[a] = alanlar[a] || {})[y] = t[y].d; });
        });
        return cevap(200, { lifeos_hesap:4, kullanici:profil(ad), alanlar });
      }
      if(yol === '/api/hesap/sil'){
        if(s.kullanicilar[ad].parola !== govde.parola) return cevap(401, { hata:'Şifre yanlış.' });
        s.silKullanici(ad);
        return cevap(200, { ok:true });
      }
      if(yol === '/api/hesap/yasiyor'){
        return cevap(200, { var:Object.values(s.kullanicilar).some(k => k.kimlik === govde.kimlik) });
      }
      if(yol === '/api/hesap/cihazlar'){
        return cevap(200, { cihazlar:Object.keys(s.oturumlar).filter(j => s.jetonlar[j] === ad)
          .map(j => Object.assign({ bu:j === bu }, s.oturumlar[j])).sort((a, b) => b.bu - a.bu) });
      }
      if(yol === '/api/hesap/cihaz-cikar'){
        const j = Object.keys(s.oturumlar).find(x => s.oturumlar[x].id === govde.id && s.jetonlar[x] === ad);
        if(!j) return cevap(404, { hata:'Bu cihaz artık listede yok.' });
        sil(j);
        return cevap(200, { ok:true, bu:j === bu });
      }
      if(yol === '/api/hesap/otekilerden-cik'){
        const l = Object.keys(s.jetonlar).filter(j => s.jetonlar[j] === ad && j !== bu);
        l.forEach(sil);
        return cevap(200, { ok:true, n:l.length });
      }
      if(/\/(kullanicilar|yonet|ayar|kullanici)$/.test(yol) && !admin) return cevap(403, { hata:'Yalnız admin.' });
      if(yol === '/api/hesap/kullanicilar'){
        return cevap(200, { kullanicilar:Object.keys(s.kullanicilar).map(a => Object.assign(profil(a), { cihaz:0, son:null })),
          kayit:s.kayitAcik });
      }
      if(yol === '/api/hesap/yonet'){
        const a = Object.keys(s.kullanicilar)[govde.id - 1];
        if(govde.plan) s.kullanicilar[a].plan = govde.plan;
        if(govde.rol) s.kullanicilar[a].rol = govde.rol;
        return cevap(200, { kullanici:profil(a) });
      }
      if(yol === '/api/hesap/ayar'){ s.kayitAcik = !!govde.kayit; return cevap(200, { kayit:s.kayitAcik }); }
      if(yol === '/api/hesap/kullanici'){
        s.kullanicilar[govde.ad] = { parola:govde.parola, rol:'uye' };
        return cevap(200, profil(govde.ad));
      }
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
      alan:o.alan || 'spi/ben', veri:Object.assign({}, o.veri || {}), _d:null, yenilenen:0, yuklenen:0,
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
      yenile:async () => { cihaz.depo.yenilenen++; },
      yukle:cihaz.yukle ? async () => { cihaz.depo.yuklenen++; } : undefined,
      mesgul:cihaz.mesgul || (() => false), kesilebilir:cihaz.kesilebilir });
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

  /* YAZILAN AMA KAYDEDİLMEYEN DEĞER (2026-10-05, aralıklı e2e kırmızısı).
     Yeniden çizim formu modelden kurar; yazılıp henüz kaydedilmemiş
     değer silinir ve «Kaydet» boş alanı yazar (sunucuda uyku null).
     Odak denetimi yetmez: telefonda klavye kapatılınca, masaüstünde
     «Kaydet»e basılırken odak alandan çıkar ama yazılan hâlâ kaydedilmemiştir. */
  function kirliAlan(){
    const el = document.createElement('input');
    el.type = 'number';
    el.style.cssText = 'display:block;width:40px;height:20px';
    document.body.appendChild(el);
    el.value = '7';                                           // kullanıcı yazdı…
    el.dispatchEvent(new Event('input', { bubbles:true }));
    el.blur();                                                // …ve alandan çıktı
    return el;
  }

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

    /* Yeni cihazda profil boşken kurulum sihirbazı açılır; sunucudan profil
       gelince ekran yenilenmeli (sihirbaz kapanabilir). Açık bir kağıt
       öteki her durumda yenilemeyi bekletir: yarım form silinmez. */
    it('açık kağıt yenilemeyi bekletir; kesilebilir kağıt (sihirbaz) bekletmez', () => sahneyle(async () => {
      let kap = document.getElementById('sheet'), yeniKap = !kap;
      if(yeniKap){ kap = document.createElement('div'); kap.id = 'sheet'; document.body.appendChild(kap); }
      const k = document.createElement('div');
      k.className = 'sheet';
      k.innerHTML = '<button data-act="setup-skip">Şimdilik atla</button>';
      k.style.cssText = 'display:block;width:10px;height:10px';
      kap.appendChild(k);
      try{
        const srv = sunucuKur();
        srv.yaz('omer', 'spi/ben', 'profile', { name:'Ömer' }, 5);
        let c = cihazKur(srv);
        c.mesgul = undefined;
        let h = sahne(c);
        await hazir();
        await h.girisYap('omer', 'parola-123');
        await h.esitle();
        await hazir();
        expect(c.depo.yenilenen).toBe(0);                       // kağıt açık: beklenir
        const srv2 = sunucuKur();
        srv2.yaz('omer', 'spi/ben', 'profile', { name:'Ömer' }, 5);
        c = cihazKur(srv2);
        c.kesilebilir = () => !!document.querySelector('#sheet [data-act="setup-skip"]');
        h = sahne(c);
        await hazir();
        await h.girisYap('omer', 'parola-123');
        await h.esitle();
        await hazir();
        expect(c.depo.yenilenen > 0).toBe(true);                // sihirbaz: beklenmez
      }finally{
        k.remove();
        if(yeniKap) kap.remove();
      }
    }));

    const zamanlayici = c => {
      const bekleyen = [];
      c.ortam.zamanla = (fn, ms) => { if(ms === 1500) bekleyen.push(fn); return 0; };
      return () => bekleyen.splice(0).forEach(fn => fn());
    };

    it('yazılıp kaydedilmemiş alan ekran yenilemesini bekletir; odak alanda olmasa da', () => sahneyle(async () => {
      let el = null;
      try{
        const srv = sunucuKur();
        srv.yaz('omer', 'spi/ben', 'vitals/2026-10-05', { water:250 }, 5);
        const c = cihazKur(srv);
        const sonra = zamanlayici(c);
        const h = sahne(c);
        await hazir();
        el = kirliAlan();
        await h.girisYap('omer', 'parola-123');
        await h.esitle();
        await hazir();
        expect(c.depo.veri['vitals/2026-10-05']).toEqual({ water:250 });   // veri indi…
        expect(c.depo.yenilenen).toBe(0);                                   // …ekran beklendi
        el.remove();                                                        // kaydedildi, form yeniden çizildi
        sonra();
        await hazir();
        expect(c.depo.yenilenen).toBe(1);
      }finally{ if(el) el.remove(); }
    }));

    /* KAYDET EN YENİ KAYDIN ÜSTÜNE YAZAR. Ekran beklerken model de eski
       kalıyordu: kullanıcı «Kaydet»e basınca eski modelden kurulan kayıt,
       öteki cihazdan az önce gelen değişikliği kayıt düzeyinde eziyordu.
       Model hemen tazelenir, yalnız ekran bekler. Açık kağıt (kesilemez)
       ikisini de bekletir: kağıdın elindeki kayıt modelden kopmasın. */
    it('kullanıcı yazarken model hemen tazelenir, ekran bekler; açık kağıtta ikisi de bekler', () => sahneyle(async () => {
      let el = null;
      try{
        const srv = sunucuKur();
        srv.yaz('omer', 'spi/ben', 'vitals/2026-10-05', { weight:79.4 }, 5);
        const c = cihazKur(srv);
        c.yukle = true;
        const sonra = zamanlayici(c);
        const h = sahne(c);
        await hazir();
        el = kirliAlan();
        await h.girisYap('omer', 'parola-123');
        await h.esitle();
        await hazir();
        expect(c.depo.yuklenen).toBe(1);
        expect(c.depo.yenilenen).toBe(0);
        el.remove();
        sonra();
        await hazir();
        expect([c.depo.yuklenen, c.depo.yenilenen]).toEqual([1, 1]);
      }finally{ if(el) el.remove(); }

      let kap = document.getElementById('sheet'), yeniKap = !kap;
      if(yeniKap){ kap = document.createElement('div'); kap.id = 'sheet'; document.body.appendChild(kap); }
      const k = document.createElement('div');
      k.className = 'sheet';
      k.innerHTML = '<p>Tahlil düzenle</p>';
      k.style.cssText = 'display:block;width:10px;height:10px';
      kap.appendChild(k);
      try{
        const srv = sunucuKur();
        srv.yaz('omer', 'spi/ben', 'labs/l1', { tsh:2.1 }, 5);
        const c = cihazKur(srv);
        c.yukle = true;
        const sonra = zamanlayici(c);
        const h = sahne(c);
        await hazir();
        await h.girisYap('omer', 'parola-123');
        await h.esitle();
        await hazir();
        expect([c.depo.yuklenen, c.depo.yenilenen]).toEqual([0, 0]);
        k.remove();                                                         // kağıt kapandı
        sonra();
        await hazir();
        expect([c.depo.yuklenen, c.depo.yenilenen]).toEqual([1, 1]);
      }finally{
        k.remove();
        if(yeniKap) kap.remove();
      }
    }));

    /* GİDİP GELME YOK. Bir cihaz değişmemiş bir kaydı yeniden yazınca
       (açılışta künye, depo ölçümü…) öteki cihaz onu «yeni» diye alıp
       ekranını yeniliyor, yenilerken kendisi de yazıyordu: iki açık cihaz
       dakikada bir birbirini yeniletiyordu. Aynı değer yazılmaz, ekran
       yenilenmez; gerçek değişiklik yine iner. */
    it('uzaktan gelen kayıt yereldekiyle aynıysa ekran yenilenmez; gerçek değişiklik iner', () => sahneyle(async () => {
      const srv = sunucuKur();
      const c = cihazKur(srv, { veri:{ meta:{ schemaVersion:1, lastBackupAt:null }, 'vitals/x':{ a:1, b:[1, { c:2 }] } } });
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      await hazir();
      const once = c.depo.yenilenen;
      srv.yaz('omer', 'spi/ben', 'meta', { lastBackupAt:null, schemaVersion:1 }, 9000000000000);
      srv.yaz('omer', 'spi/ben', 'vitals/x', { b:[1, { c:2 }], a:1 }, 9000000000000);
      await h.esitle();
      await hazir();
      expect(c.depo.yenilenen).toBe(once);
      srv.yaz('omer', 'spi/ben', 'vitals/x', { a:2, b:[1, { c:2 }] }, 9000000000001);
      await h.esitle();
      await hazir();
      expect(c.depo.veri['vitals/x']).toEqual({ a:2, b:[1, { c:2 }] });
      expect(c.depo.yenilenen).toBe(once + 1);
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

    it('eşitlendi işareti yalnız bir şey gidip gelince; boş turda yok', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      c.ortam.simdi = () => 1700000000000;
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      c.depo.yaz('notes/x', { t:1 });
      await h.esitle();
      expect(h.dugme().sinif).toContain('is-esitlendi');
      h._ortam.simdi = () => 1700000000000 + 5000;              // işaret söndü
      await h.esitle();                                           // boş tur
      expect(h.dugme().sinif.indexOf('is-esitlendi') < 0).toBe(true);
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

  /* ÖTEKİ TAZELEYİCİLER (2026-10-05). King'in teklifleri dakikada bir,
     haftalık özet beş dakikada bir yoklanır ve değişince ekranı baştan
     çizer; çizim Bugün'de yazılıp kaydedilmemiş değeri siliyordu. Çizim
     eşitlemeninkiyle aynı denetimden geçer: cizIste. kur() çağrılmaz —
     denetim eşitlemenin kurulmasına bağlı değildir. */
  describe('Hesap — öteki tazeleyicilerin çizimi (cizIste)', () => {
    function zamanlaYakala(){
      const h = H(), eski = h._ortam.zamanla, bekleyen = [];
      h._sifirla();
      h._ortam.zamanla = (fn, ms) => { bekleyen.push({ fn, ms }); return 0; };
      if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
      return { bekleyen, sur:() => bekleyen.splice(0).forEach(x => x.fn()),
        birak:() => { h._ortam.zamanla = eski; h._sifirla(); } };
    }

    it('kimse yazmıyorsa hemen çizer; kirli alan varken bekler, alan gidince bir kez çizer', () => {
      const z = zamanlaYakala();
      let el = null;
      try{
        let a = 0, b = 0;
        const A = () => { a++; }, B = () => { b++; };
        H().cizIste(A);
        expect(a).toBe(1);                                       // hemen
        el = kirliAlan();
        H().cizIste(A); H().cizIste(A); H().cizIste(B);
        expect([a, b]).toEqual([1, 0]);                          // yazılı: bekler
        expect(z.bekleyen.length > 0 && z.bekleyen.every(x => x.ms === 1500)).toBe(true);
        z.sur();
        expect([a, b]).toEqual([1, 0]);                          // hâlâ yazılı: yine bekler
        el.remove(); el = null;                                  // kaydedildi
        z.sur();
        expect([a, b]).toEqual([2, 1]);                          // üst üste istek tek çizim
        z.sur();
        expect([a, b]).toEqual([2, 1]);
      }finally{ if(el) el.remove(); z.birak(); }
    });

    it('odak alandayken ve açık kağıtta bekler; programın koyduğu değer yazı sayılmaz', () => {
      const z = zamanlaYakala();
      const alan = document.createElement('input');
      alan.style.cssText = 'display:block;width:40px;height:20px';
      document.body.appendChild(alan);
      let kap = document.getElementById('sheet'), yeniKap = !kap;
      if(yeniKap){ kap = document.createElement('div'); kap.id = 'sheet'; document.body.appendChild(kap); }
      const k = document.createElement('div');
      k.className = 'sheet';
      k.style.cssText = 'display:block;width:10px;height:10px';
      try{
        let n = 0;
        const A = () => { n++; };
        alan.value = '42';                                       // program koydu: olay yok
        H().cizIste(A);
        expect(n).toBe(1);
        alan.focus();                                            // kullanıcı alanda
        H().cizIste(A);
        expect(n).toBe(1);
        alan.blur();
        z.sur();
        expect(n).toBe(2);
        kap.appendChild(k);                                      // kağıt açık
        H().cizIste(A);
        expect(n).toBe(2);
        k.remove();
        z.sur();
        expect(n).toBe(3);
      }finally{
        alan.remove(); k.remove();
        if(yeniKap) kap.remove();
        z.birak();
      }
    });
  });

  describe('Hesap — güvenlik ve uygulama', () => {
    it('bilgisayarda Hesap › Cihazlar, telefonda yazılacak adresi gösterir', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      const f = srv.fetch;
      srv.fetch = async (u, o) => (/durum$/.test(u)
        ? { ok:true, status:200, json:async () => ({ surum:3, kurulum:false, kayit:true, yerel:true, ev_agi:['192.168.0.10'] }) }
        : f(u, o));
      c.ortam.fetch = srv.fetch;
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.merkezAc('cihazlar');
      const metin = document.querySelector('[data-hesap-merkez]').textContent;
      expect(metin).toContain('192.168.0.10');
      expect(metin).toContain('https://192.168.0.10:5183');
    }));

    it('jeton yerel depoya ve panele yazılmaz; çerez kapıya bağlı değil', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv, { https:true });
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      const jeton = Object.keys(srv.jetonlar)[0];
      expect(JSON.stringify(c.ls).indexOf(jeton) < 0).toBe(true);
      expect(h.panelHtml().indexOf(jeton) < 0).toBe(true);
      expect(String(c.jar.lifeos_hesaplar || '').indexOf(jeton) < 0).toBe(true);     // hatırlanan hesapta da yok
      await h.merkezAc();
      expect(document.querySelector('[data-hesap-merkez]').innerHTML.indexOf(jeton) < 0).toBe(true);
      h.merkezAc('cihazlar');                                                          // bu cihazın satırı da
      await hazir();
      expect(document.querySelector('[data-hesap-merkez]').innerHTML.indexOf(jeton) < 0).toBe(true);
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
      expect(h.kapiAcikMi()).toBe(true);
      document.querySelector('[data-hesap-kapi] [data-gorunum="giris"]').click();       // ana menüden forma
      expect(document.querySelector('[data-hesap-kapi]').textContent).toContain('Bilgisayarın adresi');
      expect(h.adresDuzelt('192.168.0.10')).toBe('https://192.168.0.10:5183');
      expect(h.adresDuzelt('https://pc.local:5173/x?y')).toBe('https://pc.local:5173');
      expect(h.adresDuzelt('')).toBeNull();
      await h.girisYap('omer', 'parola-123', '192.168.0.10');
      expect(srv.istekler.some(x => x.url === 'https://192.168.0.10:5183/api/hesap/giris')).toBe(true);
      await h.esitle();
      expect(esitleIstekleri(srv)[0].url).toBe('https://192.168.0.10:5183/api/hesap/esitle');
    }));
  });

  /* SEÇİM SAYFASI (kullanıcı, 2026-10-06, telefondan): «hesap girme kısmına
     gelmeden önce milisaniyelik ilk o seçim ekranını gösteriyor», «beta
     girişine tıklayınca animasyonla gelsin», «seçme kısmında o bölümle ilgili
     minik özetler geçilsin». */
  /* Kenarın «ben» satırı (kullanıcı, 2026-10-06: «burayı da düzenle, daha
     sade»): Hesap ayrı satır değil; durumu profil adının altında kısa yazılır. */
  describe('Hesap — kenarın ben satırı', () => {
    function benSatiri(){
      const el = document.createElement('div');
      el.innerHTML = '<button class="ust__profil" data-hesap-ben><small data-hesap-durum></small></button>';
      document.body.appendChild(el);
      return { el, yazi:() => el.querySelector('[data-hesap-durum]').textContent,
        gizli:() => el.querySelector('[data-hesap-durum]').hidden };
    }
    it('durum adın altında kısa: giriş yok → eşitlendi (saatiyle); beta; sunucu da oturum da yoksa boş', () => sahneyle(async () => {
      let b = benSatiri();
      try{
        const srv = sunucuKur(), c = cihazKur(srv);
        const h = sahne(c);
        await hazir();
        expect(b.yazi()).toBe('Giriş yapılmadı');
        await h.girisYap('omer', 'parola-123');
        await h.esitle();
        expect(/^Eşitlendi · \d\d:\d\d$/.test(b.yazi())).toBe(true);
        expect(b.el.querySelector('[data-hesap-ben]').getAttribute('data-hal')).toBe('tamam');
      }finally{ b.el.remove(); }
      b = benSatiri();
      try{
        const c = cihazKur(sunucuKur());
        c.jar.lifeos_beta = '1';
        sahne(c);
        await hazir();
        expect(b.yazi()).toBe('Beta · yalnız bu cihazda');
      }finally{ b.el.remove(); }
      b = benSatiri();
      try{
        sahne(cihazKur(sunucuKur({ yok:true })));
        await hazir();
        expect(b.yazi()).toBe('');
        expect(b.gizli()).toBe(true);
      }finally{ b.el.remove(); }
    }));
  });

  describe('Hesap — seçim sayfası', () => {
    const kok = () => document.documentElement;
    /* Seçim sayfasının kendisi gibi kurar: modul 'giris', depo yok. */
    function girisSahne(cihaz){
      const h = H();
      h._sifirla();
      yedek = yedek || Object.assign({}, h._ortam);
      Object.assign(h._ortam, cihaz.ortam);
      h.kur({ modul:'giris' });
      return h;
    }

    it('titremez: uygulamada kapı ağ beklemeden açılır; beta/oturum varken sayfa hemen görünür', () => sahneyle(async () => {
      let c = cihazKur(sunucuKur(), { uygulama:true });
      let h = girisSahne(c);
      expect(h.kapiAcikMi()).toBe(true);                 // aynı anda: sunucu cevabı beklenmedi
      expect(kok().classList.contains('giris-hazir')).toBe(true);
      await hazir();
      expect(h.kapiAcikMi()).toBe(true);
      expect(kok().classList.contains('giris-hazir')).toBe(true);

      c = cihazKur(sunucuKur(), { uygulama:true });
      c.jar.lifeos_beta = '1';
      h = girisSahne(c);
      expect(h.kapiAcikMi()).toBe(false);
      expect(kok().classList.contains('giris-hazir')).toBe(true);
    }));

    it('tarayıcıda karar sunucuyu bekler: o ana dek sayfa gizli, sonra kapı (seçim sayfası bir an görünmez)', () => sahneyle(async () => {
      const c = cihazKur(sunucuKur());
      const h = girisSahne(c);
      expect(kok().classList.contains('giris-hazir')).toBe(false);
      expect(h.kapiAcikMi()).toBe(false);
      await hazir();
      expect(h.kapiAcikMi()).toBe(true);
      expect(kok().classList.contains('giris-hazir')).toBe(true);
    }));

    it('beta girişi: kapı animasyonla çekilir, seçim sayfası hemen belirir; azaltılmış harekette anında', () => sahneyle(async () => {
      const zaman = [];
      let c = cihazKur(sunucuKur(), { uygulama:true });
      c.ortam.zamanla = (fn, ms) => { zaman.push({ fn, ms }); return zaman.length; };
      c.ortam.azalt = () => false;
      let h = girisSahne(c);
      document.querySelector('[data-hesap-kapi] [data-hesap="beta"]').click();
      expect(h.kapiAcikMi()).toBe(false);                // kapı artık kapı sayılmaz…
      const cikan = document.querySelector('.hesap-kapi.is-cikis');
      expect(!!cikan).toBe(true);                        // …ama çekilirken görünür
      expect(cikan.getAttribute('aria-hidden')).toBe('true');
      expect(kok().classList.contains('hesap-kapi-acik')).toBe(false);   // kartlar aynı anda belirir
      const sil = zaman.find(z => z.ms >= 300 && z.ms <= 600);
      expect(!!sil).toBe(true);
      sil.fn();
      expect(!!document.querySelector('.hesap-kapi')).toBe(false);

      c = cihazKur(sunucuKur(), { uygulama:true });
      c.ortam.azalt = () => true;
      h = girisSahne(c);
      document.querySelector('[data-hesap-kapi] [data-hesap="beta"]').click();
      expect(!!document.querySelector('.hesap-kapi')).toBe(false);
    }));

    /* Modüller ayrı kapıda: seçim sayfası onların deposunu okuyamaz; özet
       kapıya bakmayan çerezle gelir. Sayı etiketiyle gider (AGENTS §1.2). */
    it('özet: Bugün’ün dönen maddeleri etiketleriyle yazılır, iki kart sırayla karışır, sınırlı', () => sahneyle(async () => {
      const c = cihazKur(sunucuKur(), { uygulama:true });
      const h = girisSahne(c);
      const sayi = (d, b, k) => '<span class="sayi sayi--' + k + '"><span class="sayi__d">' + d + '</span> <span class="sayi__b">' + b + '</span></span>';
      h.ozetYaz('spi', 'spi-bugun', [
        { ust:'Sıradaki', cumle:'Lipid paneli bekliyor.', vurgu:'Tahlil sonucunu gir.' },
        { ust:'Seri', sayi:sayi(4, 'gün', 'computed'), cumle:'asgari gün.' },
        { ust:'Asgari gün', sayi:sayi('—', '', 'missing'), cumle:'veri yok.' },
      ]);
      h.ozetYaz('spi', 'spi-saglik', [
        { ust:'Toparlanma', sayi:sayi(73, '/100', 'computed'), cumle:'iyi.' },
        { ust:'Beslenme', sayi:sayi(2, 'öğün', 'measured'), cumle:'girildi & <işlendi>.' },
      ]);
      expect(/Max-Age=\d+/.test(c.jar.__son)).toBe(true);
      const o = h.ozetOku('spi');
      expect(o.satirlar.map(s => s.u)).toEqual(['Sıradaki', 'Toparlanma', 'Seri', 'Beslenme']);   // en çok 4, sırayla karışık
      expect(o.satirlar[0]).toEqual({ u:'Sıradaki', m:'Lipid paneli bekliyor.', k:null });
      expect(o.satirlar[1]).toEqual({ u:'Toparlanma', m:'73 /100 iyi.', k:'computed' });
      expect(o.satirlar[3]).toEqual({ u:'Beslenme', m:'2 öğün girildi & <işlendi>.', k:'measured' });
      h.ozetYaz('spi', 'spi-bugun', [{ ust:'Seri', sayi:sayi(5, 'gün', 'computed'), cumle:'asgari gün.' }]);
      expect(h.ozetOku('spi').satirlar.map(s => s.m)).toEqual(['5 gün asgari gün.', '73 /100 iyi.', '2 öğün girildi & <işlendi>.']);
      expect(h.ozetOku('ays')).toBeNull();
    }));

    it('özet: kartta etiketiyle ve zamanıyla çizilir; yedi günden eskisi gösterilmez; bozuk çerez yok sayılır', () => sahneyle(async () => {
      const c = cihazKur(sunucuKur(), { uygulama:true });
      const h = girisSahne(c);
      const yuva = document.createElement('div');
      yuva.innerHTML = '<a class="kart" data-modul="esp"><div class="kart__ozet" data-ozet="esp" hidden></div></a>'
        + '<a class="kart" data-modul="ays"><div class="kart__ozet" data-ozet="ays" hidden></div></a>';
      document.body.appendChild(yuva);
      try{
        h.ozetYaz('esp', 'esp-bugun', [{ ust:'Tekrar', sayi:'<span class="sayi sayi--computed"><span class="sayi__d">15</span> <span class="sayi__b">kart</span></span>', cumle:'bekliyor.' }]);
        h.ozetCiz();
        const esp = yuva.querySelector('[data-ozet="esp"]');
        expect(esp.hidden).toBe(false);
        expect(esp.textContent).toContain('Tekrar');
        expect(esp.textContent).toContain('15 kart bekliyor.');
        expect(esp.textContent).toContain('hesaplandı');
        expect(esp.textContent).toContain('bugün');
        expect(yuva.querySelector('[data-ozet="ays"]').hidden).toBe(true);
        c.jar.lifeos_ozet_ays = '%7Bbozuk';
        h.ozetCiz();
        expect(yuva.querySelector('[data-ozet="ays"]').hidden).toBe(true);
        const simdi = h._ortam.simdi();
        h._ortam.simdi = () => simdi + 8 * 864e5;
        h.ozetCiz();
        expect(esp.hidden).toBe(true);
      }finally{ yuva.remove(); }
    }));
  });

  describe('Hesap — giriş ekranı', () => {
    const kapi = () => document.querySelector('[data-hesap-kapi]');
    const yaz = (id, v) => { document.getElementById(id).value = v; };
    const gonder = sel => kapi().querySelector(sel).requestSubmit();
    const git = g => kapi().querySelector('[data-hesap="gorunum"][data-gorunum="' + g + '"]').click();

    it('sunucu varken ve hesap yokken açılışta çıkar; sunucu yoksa çıkmaz', () => sahneyle(async () => {
      let srv = sunucuKur(), c = cihazKur(srv);
      let h = sahne(c);
      await hazir();
      expect(h.kapiAcikMi()).toBe(true);
      expect(kapi().textContent).toContain('Beta girişi');
      srv = sunucuKur({ yok:true }); c = cihazKur(srv);
      h = sahne(c);
      await hazir();
      expect(h.kapiAcikMi()).toBe(false);
    }));

    /* «Giriş kısmında ilk ana menü gelsin» (depo sahibi, 2026-10-05). */
    it('önce ana menü: form yok; «Giriş yap» formu açar, «‹» ana menüye döner', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      sahne(c);
      await hazir();
      expect(kapi().querySelector('form')).toBeNull();
      expect(kapi().querySelector('[data-gorunum="giris"]').textContent).toBe('Giriş yap');
      expect(kapi().querySelector('[data-gorunum="kayit"]').textContent).toBe('Hesap oluştur');
      git('giris');
      expect(kapi().querySelector('[data-hesap-form="giris"]')).toBeTruthy();
      expect(kapi().textContent).toContain('Şifremi unuttum');
      git('karsila');
      expect(kapi().querySelector('form')).toBeNull();
    }));

    it('ana sayfa: dört sistem ve üç söz; form açılınca tanıtım çekilir', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      sahne(c);
      await hazir();
      const t = kapi().querySelector('.hesap-kapi__tanitim');
      ['AYS', 'SPİ', 'ESP', 'Merkez'].forEach(x => expect(t.textContent).toContain(x));
      expect(t.querySelectorAll('.hesap-kapi__sozler li').length).toBe(3);
      expect(kapi().querySelector('h1').textContent).toBe('Hoş geldin');
      expect(kapi().classList.contains('is-form')).toBe(false);
      git('giris');
      expect(kapi().classList.contains('is-form')).toBe(true);
      git('karsila');
      expect(kapi().classList.contains('is-form')).toBe(false);
    }));

    it('beta girişi ekranı kapatır, oturumluk çerez yazar, yeniden çıkmaz', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      let h = sahne(c);
      await hazir();
      kapi().querySelector('[data-hesap="beta"]').click();
      expect(h.kapiAcikMi()).toBe(false);
      expect(c.jar.__son).toContain('lifeos_beta');
      expect(/Max-Age/.test(c.jar.__son)).toBe(false);
      h = sahne(c);                                  // aynı cihaz, yeni sayfa (modül değişti)
      await hazir();
      expect(h.kapiAcikMi()).toBe(false);
    }));

    it('ilk kurulumda ana menüde yalnız «Hesap oluştur»; kayıt oturum açar, ekran kapanır', () => sahneyle(async () => {
      const srv = sunucuKur({ kullanicilar:{}, kurulum:true }), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      expect(kapi().querySelector('[data-gorunum="giris"]')).toBeNull();          // hesap yok: giriş yok
      expect(kapi().textContent).toContain('İlk hesap admin olur');
      git('kayit');
      yaz('hesap-ad', 'omer'); yaz('hesap-parola', 'sifre-1234'); yaz('hesap-parola2', 'sifre-9999');
      yaz('hesap-soru', 'İlk öğretmenim?'); yaz('hesap-cevap', 'Ayşe');
      gonder('[data-hesap-form="kayit"]');
      await hazir();
      expect(document.getElementById('hesap-mesaj').textContent).toContain('aynı değil');
      expect(document.getElementById('hesap-soru').value).toBe('İlk öğretmenim?');   // yazılan silinmedi
      yaz('hesap-parola2', 'sifre-1234');
      gonder('[data-hesap-form="kayit"]');
      await hazir();
      expect(h.kapiAcikMi()).toBe(false);
      expect(h.durum().oturum.ad).toBe('omer');
      expect(h.durum().oturum.rol).toBe('admin');
      expect(srv.kullanicilar.omer.soru).toBe('İlk öğretmenim?');
    }));

    it('yeni hesap açma kapalıysa ana menüde «Hesap oluştur» yok', () => sahneyle(async () => {
      const srv = sunucuKur({ kayitAcik:false }), c = cihazKur(srv);
      sahne(c);
      await hazir();
      expect(kapi().querySelector('[data-gorunum="kayit"]')).toBeNull();
      expect(kapi().querySelector('[data-gorunum="giris"]')).toBeTruthy();
    }));

    it('yanlış şifrede ekran açık kalır, mesaj yazar, ad silinmez', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      git('giris');
      yaz('hesap-ad', 'omer'); yaz('hesap-parola', 'yanlis');
      gonder('[data-hesap-form="giris"]');
      await hazir();
      expect(h.kapiAcikMi()).toBe(true);
      expect(document.getElementById('hesap-mesaj').textContent).toContain('yanlış');
      expect(document.getElementById('hesap-ad').value).toBe('omer');
    }));

    it('şifremi unuttum: kendi sorusu gelir, doğru cevapla yeni şifre ve oturum', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      srv.kullanicilar.omer.soru = 'İlk evcil hayvanım?';
      srv.kullanicilar.omer.cevap = 'pamuk';
      const h = sahne(c);
      await hazir();
      git('giris');
      yaz('hesap-ad', 'omer');
      kapi().querySelector('[data-hesap="unuttum"]').click();
      expect(document.getElementById('hesap-ad').value).toBe('omer');           // ad taşındı
      gonder('[data-hesap-form="soru"]');
      await hazir();
      expect(kapi().textContent).toContain('İlk evcil hayvanım?');
      yaz('hesap-cevap', 'Pamuk'); yaz('hesap-parola', 'yeni-sifre-1'); yaz('hesap-parola2', 'yeni-sifre-1');
      gonder('[data-hesap-form="kurtar"]');
      await hazir();
      expect(h.kapiAcikMi()).toBe(false);
      expect(h.durum().oturum.ad).toBe('omer');
      expect(srv.kullanicilar.omer.parola).toBe('yeni-sifre-1');
    }));

    it('girilen hesap bu cihazda hatırlanır: seçince yalnız şifre sorulur; «×» unutur', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      srv.kullanicilar.omer.gorunen_ad = 'Ömer Faruk';
      const h = sahne(c);
      await hazir();
      expect(kapi().querySelector('[data-hesap="hatirla"]')).toBeNull();      // ilk kez: liste yok
      await h.girisYap('omer', 'parola-123');
      await h.cikisYap();
      h.kapiAc();
      const sec = kapi().querySelector('[data-hesap="hatirla"]');
      expect(sec.textContent).toContain('Ömer Faruk');
      expect(kapi().querySelector('[data-gorunum="giris"]').textContent).toBe('Başka hesapla giriş yap');
      expect(String(c.jar.lifeos_hesaplar).indexOf('parola') < 0).toBe(true);  // şifre hatırlanmaz
      sec.click();
      expect(document.getElementById('hesap-ad').type).toBe('hidden');       // ad sorulmaz
      expect(document.getElementById('hesap-ad').value).toBe('omer');
      yaz('hesap-parola', 'parola-123');
      gonder('[data-hesap-form="giris"]');
      await hazir();
      expect(h.durum().oturum.ad).toBe('omer');
      await h.cikisYap();
      h.kapiAc();
      kapi().querySelector('[data-hesap="unut"]').click();
      expect(kapi().querySelector('[data-hesap="hatirla"]')).toBeNull();
      expect(h.hatirlananlar().length).toBe(0);
    }));

    it('şifre göster/gizle ve güç çubuğu', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      git('kayit');
      const p = document.getElementById('hesap-parola');
      kapi().querySelector('[data-hesap="goster"]').click();
      expect(p.type).toBe('text');
      kapi().querySelector('[data-hesap="goster"]').click();
      expect(p.type).toBe('password');
      p.value = 'abcdefghij';
      p.dispatchEvent(new Event('input', { bubbles:true }));
      expect(kapi().querySelector('.hesap__guc').getAttribute('data-guc')).toBe('1');
      expect([h.sifreGucu('kisa'), h.sifreGucu('uzun-Sifre-2026'), h.sifreGucu('cok-uzun-bir-parola-cumlesi')]).toEqual([0, 3, 3]);
    }));

    it('örnek profilde giriş ekranı çıkmaz', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv, { ornek:() => true });
      const h = sahne(c);
      await hazir();
      expect(h.kapiAcikMi()).toBe(false);
    }));
  });

  describe('Hesap — hesap sayfası', () => {
    const merkez = () => document.querySelector('[data-hesap-merkez]');
    const tikla = sel => merkez().querySelector(sel).click();
    async function girisli(o){
      const srv = sunucuKur(o), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      return { srv, c, h };
    }

    it('kimlik, plan ve gruplar; yönetim yalnız adminde', () => sahneyle(async () => {
      let { h } = await girisli();
      await h.merkezAc();
      const m = merkez().textContent;
      expect(m).toContain('@omer · Admin');
      expect(m).toContain('Ücretsiz · Beta');
      ['Profil', 'Plan', 'Cihazlar', 'Güvenlik', 'Eşitleme', 'Yönetim', 'Çıkış yap'].forEach(x => expect(m).toContain(x));
      h.merkezKapat();
      const srv = sunucuKur(), c = cihazKur(srv);
      h = sahne(c);
      await hazir();
      await h.girisYap('anne', 'parola-456');
      await h.merkezAc();
      expect(merkez().textContent).toContain('@anne · Üye');
      expect(merkez().querySelector('[data-sayfa="yonetim"]')).toBeNull();
    }));

    it('plan sayfası katalogdan çizilir; fiyat ve satın alma düğmesi yok', () => sahneyle(async () => {
      const { h } = await girisli();
      await h.merkezAc('plan');
      const m = merkez();
      expect(m.querySelectorAll('.hesap-plan').length).toBe(2);
      expect(m.querySelector('.hesap-plan.is-simdi').textContent).toContain('Şu anki planın');
      expect(m.textContent).toContain('Yakında');
      expect(m.querySelectorAll('.hesap-plan button').length).toBe(0);
      expect(/₺|\$|satın al/i.test(m.textContent)).toBe(false);
    }));

    it('profil kaydı sunucuya, çereze ve hatırlanan hesaba iner', () => sahneyle(async () => {
      const { h, srv, c } = await girisli();
      await h.merkezAc('profil');
      document.getElementById('hesap-gorunen').value = 'Ömer Faruk';
      merkez().querySelector('input[name="hesap-renk"][value="mor"]').checked = true;
      merkez().querySelector('[data-hesap-form="profil"]').requestSubmit();
      await hazir();
      expect(srv.kullanicilar.omer.gorunen_ad).toBe('Ömer Faruk');
      expect(srv.kullanicilar.omer.renk).toBe('mor');
      expect(h.durum().oturum.gorunen_ad).toBe('Ömer Faruk');
      expect(h.durum().oturum.renk).toBe('mor');
      expect(h.hatirlananlar()[0].g).toBe('Ömer Faruk');
      expect(merkez().textContent).toContain('Profil kaydedildi');
      expect(String(c.jar.lifeos_hesap).length > 0).toBe(true);
    }));

    it('cihazlar: bu cihaz işaretli; öteki cihazdan çıkılır, «hepsinden çık» onay ister', () => sahneyle(async () => {
      const { h, srv } = await girisli();
      await srv.fetch('/api/hesap/giris', { method:'POST', body:JSON.stringify({ ad:'omer', parola:'parola-123', cihaz_ad:'iPhone' }) });
      await srv.fetch('/api/hesap/giris', { method:'POST', body:JSON.stringify({ ad:'omer', parola:'parola-123', cihaz_ad:'Android tablet' }) });
      await h.merkezAc('cihazlar');
      expect(merkez().querySelectorAll('.hesap-oge').length).toBe(3);
      expect(merkez().querySelector('.hesap-oge').textContent).toContain('Bu cihaz');
      expect(merkez().querySelectorAll('[data-hesap="cihaz-cikar"]').length).toBe(2);   // kendine «Çıkar» yok
      tikla('[data-hesap="cihaz-cikar"]');
      await hazir();
      expect(merkez().querySelectorAll('.hesap-oge').length).toBe(2);
      expect(Object.keys(srv.jetonlar).length).toBe(2);
      tikla('[data-hesap="otekiler"]');
      expect(Object.keys(srv.jetonlar).length).toBe(2);                                 // onaysız gitmez
      tikla('[data-hesap="otekiler-evet"]');
      await hazir();
      expect(Object.keys(srv.jetonlar).length).toBe(1);
      expect(h.durum().oturum.ad).toBe('omer');                                         // bu cihaz girişli kalır
    }));

    it('yönetim: plan atanır, yeni hesap açma kapatılır', () => sahneyle(async () => {
      const { h, srv } = await girisli();
      await h.merkezAc('yonetim');
      await hazir();
      tikla('[data-hesap="kisi"][data-id="2"]');
      await hazir();
      expect(document.getElementById('hesap-merkez-baslik').textContent).toBe('anne');
      tikla('[data-hesap="yonet"][data-alan="plan"][data-deger="plus"]');
      await hazir();
      expect(srv.kullanicilar.anne.plan).toBe('plus');
      expect(merkez().querySelector('[data-deger="plus"]').getAttribute('aria-pressed')).toBe('true');
      tikla('[data-hesap="geri"]');
      tikla('[data-hesap="kayit-ayar"]');
      await hazir();
      expect(srv.kayitAcik).toBe(false);
      expect(merkez().querySelector('[data-hesap="kayit-ayar"]').getAttribute('aria-checked')).toBe('false');
    }));

    it('yazılan alan gelen veriyle silinmez', () => sahneyle(async () => {
      const { h } = await girisli();
      const ac = h.merkezAc('profil');                       // veri henüz gelmedi
      const el = document.getElementById('hesap-gorunen');
      el.value = 'yazıyorum';
      el.dispatchEvent(new Event('input', { bubbles:true }));
      await ac;
      await hazir();
      expect(document.getElementById('hesap-gorunen').value).toBe('yazıyorum');
    }));

    it('sunucuya ulaşılamazsa son bilineni gösterir, söyler; modül beklemez', () => sahneyle(async () => {
      const { h, srv, c } = await girisli();
      srv.kapali = true;
      await h.merkezAc();
      expect(merkez().textContent).toContain('Bilgisayara ulaşılamıyor');
      expect(merkez().textContent).toContain('@omer');
      c.depo.yaz('vitals/2026-10-05', { sleep:7 });                            // modül yazmaya devam eder
      expect(h.durum().bekleyen).toBe(1);
    }));

    it('özet şeridi: ölçülmemiş sayı «—», sunucu cevabıyla sayı', () => sahneyle(async () => {
      const { h, srv } = await girisli();
      srv.kapali = true;
      await h.merkezAc();
      expect(merkez().querySelector('.hesap-sayilar').textContent).toContain('—');
      h.merkezKapat();
      srv.kapali = false;
      srv.yaz('omer', 'spi/ben', 'a', { x:1 }, 5);
      srv.ozet = { 'spi/ben':1 };
      const ben = srv.fetch;
      srv.fetch = async (u, o) => {
        const c = await ben(u, o);
        if(!/\/ben$/.test(u)) return c;
        const v = await c.json();
        v.ayrinti = { 'spi/ben':{ n:1240, bayt:2048, son:1700000000000 } };
        return { ok:true, status:200, json:async () => v };
      };
      h._ortam.fetch = srv.fetch;
      await h.merkezAc();
      const t = merkez().querySelector('.hesap-sayilar').textContent;
      expect(t).toContain('1.240');
      expect(t.indexOf('—') < 0).toBe(true);
    }));

    it('kişisel bilgiler kaydedilir, çereze hitap ve doğum günü iner; sunucu yokken alanlar çizilmez', () => sahneyle(async () => {
      const { h, srv } = await girisli();
      srv.kapali = true;
      await h.merkezAc('profil');
      expect(document.getElementById('hesap-hitap')).toBeNull();          // boş form var olanı silmesin
      h.merkezKapat();
      srv.kapali = false;
      srv.kullanicilar.omer.eposta = 'omer@ornek.com';
      await h.merkezAc('profil');
      expect(document.getElementById('hesap-eposta').value).toBe('omer@ornek.com');
      document.getElementById('hesap-hitap').value = 'Ömer';
      document.getElementById('hesap-dogum').value = '1999-04-23';
      merkez().querySelector('[data-hesap-form="profil"]').requestSubmit();
      await hazir();
      expect(srv.kullanicilar.omer.hitap).toBe('Ömer');
      expect(srv.kullanicilar.omer.eposta).toBe('omer@ornek.com');           // dokunulmayan kaldı
      expect(h.durum().oturum.hitap).toBe('Ömer');
      expect(h.durum().oturum.dogum_gun).toBe('04-23');
    }));

    it('etkinlik: yanlış denemeler işaretli, üstte uyarı, kökte sayı', () => sahneyle(async () => {
      const { h, srv, c } = await girisli();
      const simdi = c.ortam.simdi();
      srv.olaylar = [
        { tur:'giris', cihaz_ad:'iPhone', ip:'192.168.0.23', ayrinti:'', zaman:simdi - 1000 },
        { tur:'yanlis', cihaz_ad:'iPhone', ip:'192.168.0.23', ayrinti:'', zaman:simdi - 2000 },
        { tur:'yanlis', cihaz_ad:'Cihaz', ip:'192.168.0.99', ayrinti:'', zaman:simdi - 3000 },
        { tur:'kayit', cihaz_ad:'Windows PC', ip:'127.0.0.1', ayrinti:'', zaman:simdi - 9 * 86400000 },
      ];
      await h.merkezAc();
      expect(merkez().querySelector('[data-sayfa="etkinlik"]').textContent).toContain('2 yanlış deneme');
      tikla('[data-sayfa="etkinlik"]');
      await hazir();
      expect(merkez().querySelector('.hesap-uyari').textContent).toContain('2 yanlış deneme');
      expect(merkez().querySelectorAll('.hesap-olay.is-dikkat').length).toBe(2);
      expect(merkez().textContent).toContain('192.168.0.99');
      expect(merkez().querySelectorAll('.hesap-olay').length).toBe(4);
    }));

    it('verin: indir dosyayı verir; sil onay ve şifre ister; silince oturum, bağ ve hatırlanan gider', () => sahneyle(async () => {
      const { h, srv, c } = await girisli();
      const verilen = [];
      h._ortam.indir = (ad, metin) => { verilen.push([ad, JSON.parse(metin)]); };
      c.depo.yaz('vitals/2026-10-05', { sleep:7 });
      await h.esitle();
      await h.merkezAc('verin');
      tikla('[data-hesap="indir"]');
      await hazir();
      expect(verilen.length).toBe(1);
      expect(verilen[0][0]).toContain('lifeos-hesap-omer-');
      expect(verilen[0][1].alanlar['spi/ben']['vitals/2026-10-05']).toEqual({ sleep:7 });
      expect(merkez().textContent).toContain('hazır');
      expect(srv.kullanicilar.omer).toBeTruthy();
      tikla('[data-hesap="sil-ac"]');
      expect(srv.kullanicilar.omer).toBeTruthy();                             // onaysız silinmez
      document.getElementById('hesap-sil-sifre').value = 'yanlis';
      merkez().querySelector('[data-hesap-form="sil"]').requestSubmit();
      await hazir();
      expect(merkez().querySelector('[data-hesap-form="sil"] .hesap__mesaj').textContent).toContain('yanlış');
      expect(srv.kullanicilar.omer).toBeTruthy();
      document.getElementById('hesap-sil-sifre').value = 'parola-123';
      merkez().querySelector('[data-hesap-form="sil"]').requestSubmit();
      await hazir();
      expect(srv.kullanicilar.omer).toBe(undefined);
      expect(h.merkezAcikMi()).toBe(false);
      expect(h.durum().oturum).toBeNull();
      expect(h.kapiAcikMi()).toBe(true);
      expect(h.hatirlananlar().length).toBe(0);
      expect(c.depo.veri['vitals/2026-10-05']).toEqual({ sleep:7 });           // cihazdaki veri kaldı
      expect(c.ls['lifeos.hesap.sahip.spi/ben']).toBe(undefined);              // bağ çözüldü
    }));

    it('oturum başka cihazdan kapatıldıysa sayfa kapanır, giriş ekranı gelir', () => sahneyle(async () => {
      const { h, srv } = await girisli();
      Object.keys(srv.jetonlar).forEach(j => { delete srv.jetonlar[j]; });
      await h.merkezAc();
      expect(h.merkezAcikMi()).toBe(false);
      expect(h.durum().oturum).toBeNull();
      expect(h.kapiAcikMi()).toBe(true);
    }));
  });

  describe('Hesap — silinen hesap cihazı kilitlemez (söz 13)', () => {
    it('aynı adla yeniden açılan hesaba cihazdaki veri ilk eşitlemeyle gider', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv, { veri:{ profile:{ name:'ben' }, 'vitals/1':{ sleep:7 } } });
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      expect(srv.oku('omer', 'spi/ben', 'vitals/1')).toEqual({ sleep:7 });
      srv.silKullanici('omer');                                                 // başka cihazdan silindi
      srv.kullanicilar.omer = { parola:'parola-999', rol:'admin' };              // aynı adla yeniden açıldı
      await h.esitle();                                                         // eski oturum: 401
      await h.girisYap('omer', 'parola-999');
      await h.esitle();
      await h.esitle();
      expect(h.durum().durum).toBe('tamam');
      expect(srv.oku('omer', 'spi/ben', 'vitals/1')).toEqual({ sleep:7 });       // yeni hesaba gitti
      expect(srv.oku('omer', 'spi/ben', 'profile')).toEqual({ name:'ben' });
    }));

    it('silinen hesaptan sonra başka adla girince bağ çözülür; hesap yaşıyorsa çözülmez', () => sahneyle(async () => {
      let srv = sunucuKur(), c = cihazKur(srv, { veri:{ 'vitals/1':{ sleep:6 } } });
      let h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      await h.cikisYap();
      await h.girisYap('anne', 'parola-456');
      await h.esitle();
      expect(h.durum().durum).toBe('baska');                                    // omer yaşıyor: söz 5
      expect(srv.oku('anne', 'spi/ben', 'vitals/1')).toBe(undefined);
      srv.silKullanici('omer');
      await h.esitle();
      await h.esitle();
      expect(h.durum().durum).toBe('tamam');
      expect(srv.oku('anne', 'spi/ben', 'vitals/1')).toEqual({ sleep:6 });
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

    /* `storage` bu tarayıcının deposunun boyut defteridir (core/storage.js,
       her açılışta bir örnek). Eşitlenince her açılış öteki cihazlara
       «değişiklik» diye gidiyor ve PC'nin büyüme hızı telefonun
       ölçümleriyle eziliyordu. */
    it('depo ölçümü (storage) cihaza aittir: eşitlemeye bildirilmez, uzaktan gelmez', async () => {
      if(!S || typeof S.uzaktan !== 'function'){ expect('store.js kancası').toBe('var'); return; }
      const gelen = [], eski = await S.get('storage');
      const yedek = eski == null ? null : JSON.parse(JSON.stringify(eski));
      S.onDegisim = y => gelen.push.apply(gelen, y);
      try{
        await S.set('storage', { samples:[{ date:'2026-10-05', bytes:1234 }] });
        expect(gelen).toEqual([]);
        expect(S.hepsi().storage).toBe(undefined);
        S.uzaktan([['storage', { samples:[{ date:'2026-10-05', bytes:999999 }] }]]);
        expect((await S.get('storage')).samples[0].bytes).toBe(1234);
      }finally{
        S.onDegisim = null;
        if(yedek == null) await S.remove('storage'); else await S.set('storage', yedek);
      }
    });
  });
})();
