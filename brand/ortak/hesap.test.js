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
    18. Bağlantılar (sözler 17–20): iki adımda şifreden sonra kod adımı
        (bilet hiçbir depoya yazılmaz), yedek kod bir kez, kurtarma kodla;
        kodla bağlan ve ?bagla= (adresten silinir); güvenlik kontrolü;
        kurulum QR + anahtar + yedek kodlar bir kez; yeni cihaz bağla (kod,
        QR, bağlandı, vazgeçince kod kapanır); takvim aboneliği; erişim
        anahtarı bir kez; gelen ve yayın kancaları (başka hesaba bağlı
        alanda koşmaz, DTSTAMP farkı göndermez); yönetimde üyenin iki adımı.
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
    const ikiAdim = ad => {
      const k = s.kullanicilar[ad];
      return { acik:!!k.ikiAdim, olusturma:k.ikiAdim ? 1700000000000 : null, yedek_kalan:k.ikiAdim ? (k.yedek || []).length : 0 };
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
      if(yol === '/api/hesap/durum') return cevap(200, { surum:5, kurulum:s.kurulum, kayit:s.kayitAcik, yerel:true, ev_agi:s.evAgi || [] });
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
      /* İki adım (sunucu sözü 14): k.ikiAdim = geçerli kod, k.yedek = yedekler. */
      const bilet = (ad, govde, yeni) => {
        s.biletler = s.biletler || {};
        const b = 'bilet-' + (s.biletSira = (s.biletSira || 0) + 1);
        s.biletler[b] = { ad, govde, yeni };
        return cevap(200, { iki_adim:true, bilet:b });
      };
      if(yol === '/api/hesap/kurtar'){
        const k = s.kullanicilar[govde.ad];
        if(!k || String(k.cevap).toLowerCase() !== String(govde.cevap).trim().toLowerCase()) return cevap(401, { hata:'Cevap yanlış.' });
        if(k.ikiAdim) return bilet(govde.ad, govde, govde.yeni);
        k.parola = govde.yeni;
        return cevap(200, oturumAc(govde.ad, 'r', govde));
      }
      if(yol === '/api/hesap/giris'){
        const k = s.kullanicilar[govde.ad];
        if(!k || k.parola !== govde.parola) return cevap(401, { hata:'Kullanıcı adı ya da parola yanlış.' });
        if(k.ikiAdim) return bilet(govde.ad, govde);
        return cevap(200, oturumAc(govde.ad, '', govde));
      }
      if(yol === '/api/hesap/giris-kod'){
        const b = (s.biletler || {})[govde.bilet];
        if(!b) return cevap(401, { hata:'Doğrulama süresi doldu; yeniden giriş yap.' });
        const k = s.kullanicilar[b.ad], kod = String(govde.kod || '').replace(/[\s-]/g, '').toUpperCase();
        const yi = (k.yedek || []).indexOf(kod);
        if(kod !== k.ikiAdim && yi < 0) return cevap(401, { hata:'Kod yanlış ya da az önce kullanıldı; uygulamadaki yeni kodu yaz.' });
        if(yi >= 0) k.yedek.splice(yi, 1);
        if(b.yeni) k.parola = b.yeni;
        delete s.biletler[govde.bilet];
        return cevap(200, oturumAc(b.ad, 'i', b.govde));
      }
      if(yol === '/api/hesap/bagla'){
        if(!s.bag || s.bag.durum !== 'bekliyor' || s.bag.kod !== govde.kod) {
          return cevap(401, { hata:'Kod yanlış ya da süresi doldu. Girişli cihazdan yeni kod al.' });
        }
        Object.assign(s.bag, { durum:'baglandi', cihaz_ad:govde.cihaz_ad });
        return cevap(200, oturumAc(s.bag.ad, 'b', govde));
      }
      if(/^\/api\/hesap\/takvim\/.+\.ics$/.test(yol)){
        return s.takvim && s.takvim.acik && yol === s.takvim.yol
          ? { ok:true, status:200, json:async () => null, text:async () => 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n' }
          : cevap(404, { hata:'Bu takvim adresi kapalı ya da yenilendi.' });
      }
      const bu = String((op && op.headers || {}).Authorization || '').slice(7);
      const ad = s.jetonlar[bu];
      if(!ad) return cevap(401, { hata:'Oturum yok ya da süresi doldu; yeniden giriş yap.' });
      const admin = s.kullanicilar[ad].rol === 'admin';
      const sil = j => { delete s.jetonlar[j]; delete s.oturumlar[j]; };
      if(yol === '/api/hesap/cikis'){ sil(bu); return cevap(200, { ok:true }); }
      if(yol === '/api/hesap/ben'){
        return cevap(200, { kullanici:profil(ad), ozet:s.ozet || {}, soru_var:!!s.kullanicilar[ad].soru, planlar:PLANLAR,
          renkler:['mavi', 'turkuaz', 'mor'], kayit:s.kayitAcik, iki_adim:ikiAdim(ad),
          baglantilar:{ anahtar:(s.anahtarlar || []).length, takvim:!!(s.takvim && s.takvim.acik),
            gelen_bekleyen:(s.gelen || []).filter(x => x.durum !== 'onayda' && x.durum !== 'anlasilmadi').length } });
      }
      /* ---------- bağlantılar (sunucu sözleri 14–17) ---------- */
      if(yol === '/api/hesap/baglantilar'){
        return cevap(200, { anahtarlar:s.anahtarlar || [], iki_adim:ikiAdim(ad),
          takvim:s.takvim || { acik:false, yol:null, son:null, yayinlar:s.yayinlar || [] },
          gelen:(s.gelen || []).map(x => ({ id:x.id, metin:x.metin, kaynak:x.kaynak, zaman:x.zaman,
            durum:x.durum === 'alindi' ? 'bekliyor' : x.durum, sonuc:x.sonuc || '' })) });
      }
      const parolaBak = () => s.kullanicilar[ad].parola === govde.parola;
      if(yol === '/api/hesap/iki-adim/baslat'){
        if(!parolaBak()) return cevap(401, { hata:'Şifre yanlış.' });
        return cevap(200, { sir:'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
          uri:'otpauth://totp/LifeOS:' + ad + '?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=LifeOS' });
      }
      if(yol === '/api/hesap/iki-adim/onayla'){
        if(String(govde.kod).replace(/\s/g, '') !== '246810') return cevap(400, { hata:'Kod tutmadı.' });
        const k = s.kullanicilar[ad];
        k.ikiAdim = '135790';
        k.yedek = ['AAAA2222', 'BBBB3333', 'CCCC4444', 'DDDD5555', 'EEEE6666', 'FFFF7777', 'GGGG8888', 'HHHH9999',
          'JJJJ2345', 'KKKK6789'];
        return cevap(200, { yedek:k.yedek.map(x => x.slice(0, 4) + '-' + x.slice(4)) });
      }
      if(yol === '/api/hesap/iki-adim/kapat'){
        if(!parolaBak()) return cevap(401, { hata:'Şifre yanlış.' });
        if(String(govde.kod) !== s.kullanicilar[ad].ikiAdim) return cevap(401, { hata:'Kod yanlış.' });
        delete s.kullanicilar[ad].ikiAdim;
        return cevap(200, { ok:true });
      }
      if(yol === '/api/hesap/iki-adim/yedek'){
        if(!parolaBak()) return cevap(401, { hata:'Şifre yanlış.' });
        s.kullanicilar[ad].yedek = ['MMMM2222', 'NNNN3333'];
        return cevap(200, { yedek:['MMMM-2222', 'NNNN-3333'] });
      }
      if(yol === '/api/hesap/bag-kodu'){
        s.bag = { kod:'482913', id:(s.bag ? s.bag.id + 1 : 7), ad, durum:'bekliyor' };
        return cevap(200, { kod:s.bag.kod, id:s.bag.id, bitis:1700000000000 + 1e9 });
      }
      if(yol === '/api/hesap/bag-durum'){
        return cevap(200, s.bag && s.bag.id === govde.id ? { durum:s.bag.durum, cihaz_ad:s.bag.cihaz_ad } : { durum:'yok' });
      }
      if(yol === '/api/hesap/bag-kapat'){
        if(s.bag && s.bag.id === govde.id && s.bag.durum === 'bekliyor') s.bag = null;
        return cevap(200, { ok:true });
      }
      if(yol === '/api/hesap/anahtar'){
        if(!parolaBak()) return cevap(401, { hata:'Şifre yanlış.' });
        s.anahtarlar = s.anahtarlar || [];
        const id = s.anahtarlar.length + 1;
        s.anahtarlar.push({ id, ad:govde.ad, yetki:'kayit', on_ek:'lifeos_gIzL', olusturma:1700000000000, son:null });
        return cevap(200, { anahtar:'lifeos_gIzLiAnAhTaR' + id, id, ad:govde.ad, yetki:'kayit' });
      }
      if(yol === '/api/hesap/anahtar-sil'){
        s.anahtarlar = (s.anahtarlar || []).filter(x => x.id !== govde.id);
        return cevap(200, { ok:true });
      }
      if(yol === '/api/hesap/takvim'){
        s.takvimSira = (s.takvimSira || 0) + 1;
        s.takvim = { acik:true, yol:'/api/hesap/takvim/jeton' + s.takvimSira + 'aaaaaaaaaaaaaaaaaaaa.ics', son:null,
          olusturma:1700000000000, yayinlar:s.yayinlar || [] };
        return cevap(200, { takvim:s.takvim });
      }
      if(yol === '/api/hesap/takvim-kapat'){
        s.takvim = { acik:false, yol:null, son:null, yayinlar:s.yayinlar || [] };
        return cevap(200, { takvim:s.takvim });
      }
      if(yol === '/api/hesap/gelen-al'){
        const l = (s.gelen || []).filter(x => x.durum === 'bekliyor');
        l.forEach(x => { x.durum = 'alindi'; x.cihaz = govde.cihaz; });
        return cevap(200, { gelen:l.map(x => ({ id:x.id, metin:x.metin, kaynak:x.kaynak, zaman:x.zaman })) });
      }
      if(yol === '/api/hesap/gelen-sonuc'){
        const x = (s.gelen || []).find(g => g.id === govde.id && g.durum === 'alindi' && g.cihaz === govde.cihaz);
        if(x){ x.durum = govde.durum; x.sonuc = govde.sonuc; }
        return cevap(200, { ok:!!x });
      }
      if(yol === '/api/hesap/yayin'){
        (s.yayinlar = s.yayinlar || []).push({ ad:govde.ad, adet:govde.adet, icerik:govde.icerik });
        return cevap(200, { ok:true });
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
        return cevap(200, { kullanicilar:Object.keys(s.kullanicilar).map(a => Object.assign(profil(a), { cihaz:0, son:null,
          iki_adim:!!s.kullanicilar[a].ikiAdim })), kayit:s.kayitAcik });
      }
      if(yol === '/api/hesap/yonet'){
        const a = Object.keys(s.kullanicilar)[govde.id - 1];
        if(govde.plan) s.kullanicilar[a].plan = govde.plan;
        if(govde.rol) s.kullanicilar[a].rol = govde.rol;
        if(govde.iki_adim === false) delete s.kullanicilar[a].ikiAdim;
        return cevap(200, { kullanici:Object.assign(profil(a), { iki_adim:!!s.kullanicilar[a].ikiAdim }) });
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

  describe('Hesap — bağlantılar ve iki adım (sözler 17–20)', () => {
    const kapi = () => document.querySelector('[data-hesap-kapi]');
    const merkez = () => document.querySelector('[data-hesap-merkez]');
    const tikla = sel => merkez().querySelector(sel).click();
    const deg = (id, v) => { document.getElementById(id).value = v; };
    /* Kod alanına yazmak: input olayı biçimler ve altı hanede gönderir. */
    const kodYaz = (id, v) => {
      const el = document.getElementById(id);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles:true }));
    };
    async function girisli(o){
      const srv = sunucuKur(o), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      return { srv, c, h };
    }
    /* Kancalı kurulum (gelen, yayın): sahne() gibi, ek seçenekle. */
    function kancali(c, ek){
      const h = H();
      h._sifirla();
      yedek = yedek || Object.assign({}, h._ortam);
      Object.assign(h._ortam, c.ortam);
      h.kur(Object.assign({ modul:'spi', depo:c.depo, ornek:() => false, yenile:async () => {}, mesgul:() => false }, ek));
      return h;
    }

    it('iki adım: şifreden sonra kod adımı; bilet hiçbir yere yazılmaz; yanlış kod söylenir; altı hane kendiliğinden gider', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      srv.kullanicilar.omer.ikiAdim = '135790';
      const h = sahne(c);
      await hazir();
      kapi().querySelector('[data-gorunum="giris"]').click();
      deg('hesap-ad', 'omer'); deg('hesap-parola', 'parola-123');
      kapi().querySelector('[data-hesap-form="giris"]').requestSubmit();
      await hazir();
      expect(kapi().querySelector('[data-hesap-form="kod"]')).toBeTruthy();
      expect(kapi().querySelector('h1').textContent).toBe('Doğrulama kodu');
      expect(h.durum().oturum).toBeNull();
      expect(document.getElementById('hesap-parola')).toBeNull();                 // şifre alanı gitti
      expect(JSON.stringify(c.jar).indexOf('bilet') < 0 && JSON.stringify(c.ls).indexOf('bilet') < 0).toBe(true);
      kodYaz('hesap-kod', '111111');
      await hazir();
      expect(document.getElementById('hesap-mesaj').textContent).toContain('yanlış');
      expect(h.durum().oturum).toBeNull();
      kodYaz('hesap-kod', '135790');
      expect(document.getElementById('hesap-kod').value).toBe('135 790');          // biçim: üç-üç
      await hazir();
      expect(h.kapiAcikMi()).toBe(false);
      expect(h.durum().oturum.ad).toBe('omer');
    }));

    it('iki adım: yedek kodla girilir (bir kez); «‹» girişe döner, seçili hesap kalır', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');                                    // hesap hatırlansın
      await h.cikisYap();
      srv.kullanicilar.omer.ikiAdim = '135790';
      srv.kullanicilar.omer.yedek = ['AAAA2222', 'BBBB3333'];
      h.kapiAc();
      kapi().querySelector('[data-hesap="hatirla"]').click();
      deg('hesap-parola', 'parola-123');
      kapi().querySelector('[data-hesap-form="giris"]').requestSubmit();
      await hazir();
      expect(kapi().querySelector('.hesap-avatar')).toBeTruthy();                 // kimin kodu soruluyor
      kapi().querySelector('.hesap-kapi__geri').click();
      expect(document.getElementById('hesap-ad').type).toBe('hidden');            // ad yeniden sorulmaz
      deg('hesap-parola', 'parola-123');
      kapi().querySelector('[data-hesap-form="giris"]').requestSubmit();
      await hazir();
      kapi().querySelector('[data-hesap="yedek-kip"]').click();
      expect(kapi().querySelector('h1').textContent).toBe('Yedek kod');
      deg('hesap-kod', 'aaaa-2222');
      kapi().querySelector('[data-hesap-form="kod"]').requestSubmit();
      await hazir();
      expect(h.durum().oturum.ad).toBe('omer');
      expect(srv.kullanicilar.omer.yedek).toEqual(['BBBB3333']);
    }));

    it('şifremi unuttum iki adım açıkken kodu ister; yeni şifre kodla yazılır', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      Object.assign(srv.kullanicilar.omer, { soru:'İlk evcil hayvanım?', cevap:'pamuk', ikiAdim:'135790' });
      const h = sahne(c);
      await hazir();
      kapi().querySelector('[data-gorunum="giris"]').click();
      deg('hesap-ad', 'omer');
      kapi().querySelector('[data-hesap="unuttum"]').click();
      kapi().querySelector('[data-hesap-form="soru"]').requestSubmit();
      await hazir();
      deg('hesap-cevap', 'Pamuk'); deg('hesap-parola', 'yeni-sifre-1'); deg('hesap-parola2', 'yeni-sifre-1');
      kapi().querySelector('[data-hesap-form="kurtar"]').requestSubmit();
      await hazir();
      expect(kapi().querySelector('[data-hesap-form="kod"]')).toBeTruthy();
      expect(srv.kullanicilar.omer.parola).toBe('parola-123');                    // kod gelmeden değişmez
      kodYaz('hesap-kod', '135790');
      await hazir();
      expect(h.durum().oturum.ad).toBe('omer');
      expect(srv.kullanicilar.omer.parola).toBe('yeni-sifre-1');
    }));

    it('kodla bağlan: ana menüde; yanlış kod söylenir; doğru kod oturum açar', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      srv.bag = { kod:'482913', id:7, ad:'omer', durum:'bekliyor' };
      const h = sahne(c);
      await hazir();
      kapi().querySelector('[data-gorunum="bagla"]').click();
      expect(kapi().querySelector('h1').textContent).toBe('Kodla bağlan');
      kodYaz('hesap-kod', '000000');
      await hazir();
      expect(document.getElementById('hesap-mesaj').textContent).toContain('yanlış');
      kodYaz('hesap-kod', '482 913');
      await hazir();
      expect(h.kapiAcikMi()).toBe(false);
      expect(h.durum().oturum.ad).toBe('omer');
      expect(srv.bag.durum).toBe('baglandi');
    }));

    it('?bagla= adres çubuğundan silinir ve kendiliğinden bağlanır; girişliyse yok sayılır', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv), silinen = [];
      srv.bag = { kod:'482913', id:7, ad:'omer', durum:'bekliyor' };
      c.ortam.konum = () => ({ protocol:'http:', search:'?bagla=482913' });
      c.ortam.sorguSil = a => silinen.push(a);
      const h = sahne(c);
      await hazir();
      expect(silinen).toEqual(['bagla']);
      expect(h.durum().oturum.ad).toBe('omer');
      expect(h.kapiAcikMi()).toBe(false);
      srv.bag = { kod:'111222', id:8, ad:'anne', durum:'bekliyor' };
      c.ortam.konum = () => ({ protocol:'http:', search:'?bagla=111222' });
      sahne(c);
      await hazir();
      expect(H().durum().oturum.ad).toBe('omer');                                 // girişli cihaz başka hesaba geçmez
      expect(srv.bag.durum).toBe('bekliyor');
    }));

    it('güvenlik kontrolü: kapalı iki adım öneri olur; açıkken «İki adım açık», sayfa «iyi korunuyor»', () => sahneyle(async () => {
      const { h, srv } = await girisli();
      srv.kullanicilar.omer.soru = 'Soru?';
      await h.merkezAc();
      await hazir();
      const g = merkez().querySelector('[data-sayfa="guvenlik"]');
      expect(g.textContent).toContain('1 öneri');
      expect(g.classList.contains('is-dikkat')).toBe(true);
      tikla('[data-sayfa="guvenlik"]');
      await hazir();
      expect(merkez().textContent).toContain('Bir öneri var');
      const iki = merkez().querySelector('[data-sayfa="ikiadim"]');
      expect(iki.textContent).toContain('Kapalı');
      expect(iki.classList.contains('is-dikkat')).toBe(true);
      h.merkezKapat();
      srv.kullanicilar.omer.ikiAdim = '135790';
      srv.kullanicilar.omer.yedek = ['A', 'B', 'C'];
      await h.merkezAc();
      await hazir();
      expect(merkez().querySelector('[data-sayfa="guvenlik"]').textContent).toContain('İki adım açık');
      tikla('[data-sayfa="guvenlik"]');
      await hazir();
      expect(merkez().textContent).toContain('Hesabın iyi korunuyor');
    }));

    it('iki adım kurulumu: şifre → QR ve anahtar → kod → yedek kodlar bir kez; sayfadan çıkınca bellekte kalmaz', () => sahneyle(async () => {
      const { h, srv } = await girisli();
      await h.merkezAc('guvenlik');
      await hazir();
      tikla('[data-sayfa="ikiadim"]');
      await hazir();
      expect(merkez().textContent).toContain('Google Authenticator');
      deg('hesap-iki-sifre', 'yanlis');
      merkez().querySelector('[data-hesap-form="iki-baslat"]').requestSubmit();
      await hazir();
      expect(merkez().querySelector('.hesap__mesaj').textContent).toContain('Şifre yanlış');
      deg('hesap-iki-sifre', 'parola-123');
      merkez().querySelector('[data-hesap-form="iki-baslat"]').requestSubmit();
      await hazir();
      expect(merkez().querySelector('.hesap-qr svg')).toBeTruthy();
      expect(merkez().textContent).toContain('JBSW Y3DP EHPK 3PXP');
      kodYaz('hesap-iki-kod', '111111');
      await hazir();
      expect(merkez().querySelector('.hesap__mesaj').textContent).toContain('tutmadı');
      kodYaz('hesap-iki-kod', '246810');
      await hazir();
      expect(merkez().querySelectorAll('.hesap-yedek__liste li').length).toBe(10);
      expect(merkez().textContent).toContain('AAAA-2222');
      expect(merkez().textContent).toContain('İki adımlı doğrulama açıldı');
      expect(srv.kullanicilar.omer.ikiAdim).toBe('135790');
      tikla('[data-hesap="geri"]');                                              // kaydetmeden çıktı
      tikla('[data-sayfa="ikiadim"]');
      expect(merkez().querySelector('.hesap-yedek__liste')).toBeNull();          // bir kez gösterildi
      expect(merkez().textContent).toContain('10 kod kaldı');
    }));

    it('kodla cihaz bağla: büyük kod ve QR; bağlanınca söyler; çıkınca açık kod kapatılır', () => sahneyle(async () => {
      const srv = sunucuKur({ evAgi:['192.168.0.10'] }), c = cihazKur(srv), isler = [];
      c.ortam.zamanla = fn => { isler.push(fn); return isler.length; };
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.merkezAc('cihazlar');
      await hazir();
      tikla('[data-sayfa="bagla"]');
      await hazir();
      const k = merkez().querySelector('.hesap-bag__kod');
      expect(k.textContent).toBe('482913');
      expect(k.getAttribute('aria-label')).toContain('4 8 2 9 1 3');
      expect(merkez().querySelector('.hesap-qr svg').getAttribute('aria-label')).toContain('bağlama kodu');
      await srv.fetch('/api/hesap/bagla', { method:'POST', body:JSON.stringify({ kod:'482913', cihaz_ad:'iPad' }) });
      isler.splice(0).forEach(f => f());
      await hazir();
      expect(merkez().textContent).toContain('iPad bağlandı');
      tikla('[data-hesap="geri"]');
      tikla('[data-sayfa="bagla"]');
      await hazir();
      expect(srv.bag.durum).toBe('bekliyor');
      tikla('[data-hesap="bag-vazgec"]');
      await hazir();
      expect(srv.bag).toBeNull();                                               // açık kod kapatıldı
    }));

    it('takvim aboneliği: açılır; ev ağı ve bilgisayar adresi kopyalanır; yenile onay ister; dosya iner; kapanır', () => sahneyle(async () => {
      const srv = sunucuKur({ evAgi:['192.168.0.10'] }), c = cihazKur(srv), kopya = [], inen = [];
      c.ortam.kopyala = async m => { kopya.push(m); return true; };
      c.ortam.indir = (ad, metin, tur) => { inen.push([ad, tur, metin]); };
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.merkezAc('baglantilar');
      await hazir();
      tikla('[data-sayfa="takvim"]');
      await hazir();
      expect(merkez().textContent).toContain('Sınav günlerin takviminde');
      tikla('[data-hesap="takvim-ac"]');
      await hazir();
      const m = merkez().textContent;
      expect(m).toContain('https://192.168.0.10:5183/api/hesap/takvim/jeton1');
      expect(m).toContain('http://127.0.0.1:4180/api/hesap/takvim/jeton1');
      expect(m).toContain('Google');
      tikla('[data-hesap="kopyala"]');
      await hazir();
      expect(kopya[0]).toContain('https://192.168.0.10:5183/api/hesap/takvim/jeton1');
      tikla('[data-hesap="takvim-yenile-sor"]');
      expect(srv.takvimSira).toBe(1);                                           // onaysız yenilenmez
      tikla('[data-hesap="takvim-yenile"]');
      await hazir();
      expect(merkez().textContent).toContain('jeton2');
      tikla('[data-hesap="takvim-indir"]');
      await hazir();
      expect([inen[0][0], inen[0][1]]).toEqual(['lifeos-takvim.ics', 'text/calendar']);
      tikla('[data-hesap="takvim-kapat"]');
      await hazir();
      expect(merkez().querySelector('[data-hesap="takvim-ac"]')).toBeTruthy();
    }));

    it('erişim anahtarı bir kez görünür, tariflere yazılır, hiçbir depoya girmez; sayfadan çıkınca gider; silinir', () => sahneyle(async () => {
      const srv = sunucuKur({ evAgi:['192.168.0.10'] }), c = cihazKur(srv);
      const h = sahne(c);
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.merkezAc('baglantilar');
      await hazir();
      tikla('[data-sayfa="anahtarlar"]');
      await hazir();
      deg('hesap-anahtar-ad', 'iPhone Kısayollar'); deg('hesap-anahtar-sifre', 'parola-123');
      merkez().querySelector('[data-hesap-form="anahtar"]').requestSubmit();
      await hazir();
      const m = merkez().textContent;
      expect(m).toContain('«iPhone Kısayollar» hazır');
      expect(m).toContain('Bearer lifeos_gIzLiAnAhTaR1');                        // tarif anahtarla dolu
      expect(m).toContain('https://192.168.0.10:5183/api/hesap/gelen');
      expect((JSON.stringify(c.jar) + JSON.stringify(c.ls)).indexOf('gIzLiAnAhTaR') < 0).toBe(true);
      tikla('[data-hesap="geri"]');
      tikla('[data-sayfa="anahtarlar"]');
      await hazir();
      expect(merkez().textContent.indexOf('gIzLiAnAhTaR1') < 0).toBe(true);     // bir kez
      expect(merkez().textContent).toContain('lifeos_gIzL…');
      tikla('[data-hesap="anahtar-sil"]');
      await hazir();
      expect(srv.anahtarlar.length).toBe(0);
    }));

    it('gelen kancası: başarılı turdan sonra satırlar modüle gider, sonucu yazılır; null bırakır; başka hesaba bağlı alanda koşmaz', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv), alinan = [];
      srv.gelen = [{ id:1, metin:'su 250', kaynak:'iPhone', zaman:1700000000000, durum:'bekliyor' },
        { id:2, metin:'?', kaynak:'iPhone', zaman:1700000000000, durum:'bekliyor' }];
      const h = kancali(c, { gelen:async g => {
        alinan.push(g.metin);
        return g.id === 1 ? { durum:'onayda', sonuc:'SPİ › Onaylar’da bekliyor' } : null;
      } });
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      await h._ekBekle();
      expect(alinan).toEqual(['su 250', '?']);
      expect([srv.gelen[0].durum, srv.gelen[0].sonuc]).toEqual(['onayda', 'SPİ › Onaylar’da bekliyor']);
      expect(srv.gelen[1].durum).toBe('alindi');                                // null: bırakıldı
      await h.cikisYap();
      await h.girisYap('anne', 'parola-456');
      srv.gelen.push({ id:3, metin:'kilo 72', kaynak:'iPhone', zaman:1700000000000, durum:'bekliyor' });
      await h.esitle();
      await h._ekBekle();
      expect(h.durum().durum).toBe('baska');
      expect(srv.gelen[2].durum).toBe('bekliyor');                              // söz 5: başka hesabın satırı alınmaz
    }));

    it('yayın kancası: takvim bir kez gider; yalnız DTSTAMP değişince gönderilmez; içerik değişince gider', () => sahneyle(async () => {
      const srv = sunucuKur(), c = cihazKur(srv);
      let t = 1700000000000, ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTAMP:20261008T100000Z\r\nSUMMARY:TYT\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
      c.ortam.simdi = () => t;
      const h = kancali(c, { yayin:() => ({ takvim:{ metin:ics, adet:1 } }) });
      await hazir();
      await h.girisYap('omer', 'parola-123');
      await h.esitle();
      await h._ekBekle();
      expect((srv.yayinlar || []).map(x => [x.ad, x.adet])).toEqual([['spi/takvim', 1]]);
      ics = ics.replace('100000Z', '110000Z');
      t += 31000;
      await h.esitle();
      await h._ekBekle();
      expect(srv.yayinlar.length).toBe(1);
      ics = ics.replace('TYT', 'AYT');
      t += 31000;
      await h.esitle();
      await h._ekBekle();
      expect(srv.yayinlar.length).toBe(2);
      expect(srv.yayinlar[1].icerik).toContain('AYT');
    }));

    it('etkinlik: yeni olaylar adıyla; yanlış doğrulama kodu uyarıya sayılır', () => sahneyle(async () => {
      const { h, srv } = await girisli();
      const z = 1700000000000;
      srv.olaylar = [{ tur:'kod-yanlis', cihaz_ad:'iPhone', ip:'192.168.0.23', ayrinti:'', zaman:z },
        { tur:'bag', cihaz_ad:'iPad', ip:'192.168.0.30', ayrinti:'', zaman:z },
        { tur:'anahtar', cihaz_ad:'PC', ip:'127.0.0.1', ayrinti:'iPhone Kısayollar', zaman:z },
        { tur:'giris', cihaz_ad:'iPhone', ip:'192.168.0.23', ayrinti:'iki adımlı', zaman:z }];
      await h.merkezAc('etkinlik');
      await hazir();
      const m = merkez().textContent;
      ['Yanlış doğrulama kodu', 'Kodla cihaz bağlandı', 'Erişim anahtarı açıldı', 'iPhone Kısayollar', 'iki adımlı']
        .forEach(x => expect(m).toContain(x));
      expect(merkez().querySelectorAll('.hesap-olay.is-dikkat').length).toBe(1);
      expect(m).toContain('1 yanlış deneme');
    }));

    it('yönetim: üyenin iki adımı kapatılır (telefonunu kaybettiyse)', () => sahneyle(async () => {
      const { h, srv } = await girisli();
      srv.kullanicilar.anne.ikiAdim = '1';
      await h.merkezAc('yonetim');
      await hazir();
      merkez().querySelector('[data-hesap="kisi"][data-id="2"]').click();
      await hazir();
      expect(merkez().textContent).toContain('İki adımlı doğrulama açık');
      tikla('[data-hesap="kisi-iki-kapat"]');
      await hazir();
      expect(srv.kullanicilar.anne.ikiAdim).toBe(undefined);
      expect(merkez().textContent.indexOf('İki adımlı doğrulama açık') < 0).toBe(true);
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

  /* 2026-10-06 (kullanıcı, giriş ekranı: «burayı da geliştir» → iki canlı
     denemeden «Dört sistem»). Söz: kapının zemini dört sistemin rengidir —
     AYS sol üst, Merkez sağ üst, SPİ sağ alt, ESP sol alt; her leke kendi
     sisteminin tonunda ve yumuşak söner (disk kenarı yok); açık ve koyu.
     Eskiden modülde modülün ailesi, seçim sayfasında AÇIK tema rengi vardı. */
  describe('Hesap — giriş ekranının zemini', () => {
    /* sRGB (0–255) → OKLab. Chrome hesaplanmış rengi rgb()/oklab()/oklch() yazar. */
    function oklab(r, g, b){
      const d = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const R = d(r), G = d(g), B = d(b);
      const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
      const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
      const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
      return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
    }
    function cozumle(t){
      const n = (t.match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number);
      const a = n.length > 3 ? n[3] : 1;
      if(/^oklch/.test(t)) return { c:n[1], h:n[2], a };
      const [, A, B] = /^oklab/.test(t) ? n : oklab(n[0], n[1], n[2]);
      return { c:Math.hypot(A, B), h:(Math.atan2(B, A) * 180 / Math.PI + 360) % 360, a };
    }
    const fark = (x, y) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };
    const RENK = /(?:oklch|oklab|rgba?)\([^()]*\)/g;
    function katmanlar(bi){
      const out = []; let derin = 0, bas = 0;
      for(let i = 0; i < bi.length; i++){
        if(bi[i] === '(') derin++;
        else if(bi[i] === ')') derin--;
        else if(bi[i] === ',' && derin === 0){ out.push(bi.slice(bas, i).trim()); bas = i + 1; }
      }
      out.push(bi.slice(bas).trim());
      return out;
    }

    it('dört leke sırasıyla AYS, Merkez, SPİ, ESP tonunda (±20°); her biri altı duraklı söner (açık ve koyu)', () => {
      const kok = document.documentElement, eskiTema = kok.getAttribute('data-theme');
      const kapi = document.createElement('div');
      kapi.className = 'hesap-kapi';
      kapi.style.animation = 'none';
      const olcu = document.createElement('i');
      document.body.appendChild(olcu);
      document.body.appendChild(kapi);
      const ton = v => { olcu.style.color = v; return cozumle(getComputedStyle(olcu).color).h; };
      try{
        ['light', 'dark'].forEach(tema => {
          kok.setAttribute('data-theme', tema);
          const sistem = [ton('var(--ays, #2D5BE3)'), ton('var(--mer, var(--hkm, #7453D4))'),
            ton('var(--spi, #0E8C79)'), ton('var(--esp, #C8741C)')];
          const lekeler = katmanlar(getComputedStyle(kapi).backgroundImage)
            .map(k => (k.match(RENK) || []).map(cozumle))
            .filter(r => r.some(x => x.a > 0.01 && x.c > 0.03));
          expect(tema + ': ' + lekeler.length + ' leke').toBe(tema + ': 4 leke');
          const sapan = lekeler.map((r, i) => fark(r[0].h, sistem[i])).filter(x => x > 20).map(x => Math.round(x) + '°');
          expect(tema + ': ' + sapan.join(' ')).toBe(tema + ': ');
          expect(lekeler.every(r => r.length >= 6)).toBe(true);
        });
      }finally{
        kapi.remove();
        olcu.remove();
        if(eskiTema == null) kok.removeAttribute('data-theme'); else kok.setAttribute('data-theme', eskiTema);
      }
    });
  });
})();
