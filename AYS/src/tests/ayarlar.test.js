/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ayarlar.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Ayarlar — bölüm bölüm tek ayar paneli.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ayarlar.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: panel bölümlere ayrılır, yalnız seçili bölüm
   görünür ve sekme bir tıkla değişir; modülün verdiği tema seçicisi ve
   ortak seçiciler yerindedir; yazı tipi kalıcıdır ve köke yazılır;
   hesap sunucusu yokken boşa basılan düğme yok, durum söylenir. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const A = window.LIFEOS.AYARLAR;

  function koy(o){
    const d = document.createElement('div');
    d.innerHTML = A.html(o || { tema:'<div class="tema-ornek"></div>', profil:{ ad:'Ömer', alt:'Örnek', route:'profiles' },
      modul:[{ ad:'Genel', route:'guide' }, { ad:'Rütbe', route:'rutbe' }] });
    document.body.appendChild(d);
    return d;
  }

  describe('Ayarlar (bölümlü panel)', () => {
    it('on bölüm, Sistem ve Hesap grup; yalnız seçili olan görünür, sekmeye basınca değişir', () => {
      A._sec('gorunum');
      const d = koy();
      try{
        const sek = Array.from(d.querySelectorAll('[data-ayar-bolum]'));
        expect(sek.map(s => s.textContent)).toEqual(['Profiller', 'Görünüm', 'Arka plan', 'Ses ve müzik', 'Animasyon', 'Minikler ve King', 'Bildirimler', 'Planlama',
          'Modül ayarları', 'Güvenlik', 'Bağlantılar']);
        /* Üç grup: Sistem (her yerde), modülün kendisi (yalnız burada), Hesap (2026-10-30: «sistem ayarları, modül ayarları diye ayırın»). */
        const gruplar = Array.from(d.querySelectorAll('.ayarlar__grup')).map(g => g.firstChild.textContent);
        expect(gruplar.length).toBe(3);
        expect([gruplar[0], gruplar[2]]).toEqual(['Sistem', 'Hesap']);
        expect(d.querySelector('.ayarlar__grup').nextElementSibling.textContent).toBe('Profiller');
        const gorunen = () => Array.from(d.querySelectorAll('.ayarlar__bolum')).filter(s => !s.hidden).map(s => s.id);
        expect(gorunen()).toEqual(['ayarlar-bolum-gorunum']);
        sek[3].click();
        expect(gorunen()).toEqual(['ayarlar-bolum-ses']);
        expect(sek[3].getAttribute('aria-selected')).toBe('true');
        expect(sek[1].getAttribute('aria-selected')).toBe('false');
        /* Her bölüm kapsamını söyler. */
        expect(d.querySelector('#ayarlar-bolum-ses .ayarlar__kapsam').textContent).toContain('Bütün sistemde');
        expect(d.querySelector('#ayarlar-bolum-modul .ayarlar__kapsam').textContent).toContain('Yalnız');
        expect(!!d.querySelector('#ayarlar-bolum-modul [data-yuzey-sec]')).toBe(true);
        expect(!!d.querySelector('#ayarlar-bolum-gorunum [data-yuzey-sec]')).toBe(false);
      }finally{ d.remove(); A._sec('gorunum'); }
    });

    it('modülün tema seçicisi Görünüm’de, modülün ekranları «Bu modül»de', () => {
      const d = koy();
      try{
        expect(!!d.querySelector('#ayarlar-bolum-gorunum .tema-ornek')).toBe(true);
        const r = Array.from(d.querySelectorAll('#ayarlar-bolum-modul [data-route]')).map(b => b.getAttribute('data-route'));
        expect(r).toEqual(['guide', 'rutbe']);
        expect(d.querySelector('#ayarlar-bolum-hesap [data-route]').getAttribute('data-route')).toBe('profiles');
      }finally{ d.remove(); }
    });

    it('yazı tipi seçilince köke yazılır ve kalıcıdır; Inter varsayılandır', () => {
      let eski = null;
      try{ eski = localStorage.getItem('lifeos.yazi'); }catch(e){}
      const d = koy();
      try{
        d.querySelector('[data-yazi-sec="manrope"]').click();
        expect(document.documentElement.getAttribute('data-yazi')).toBe('manrope');
        expect(A.yazi()).toBe('manrope');
        expect(d.querySelector('[data-yazi-sec="manrope"]').getAttribute('aria-checked')).toBe('true');
        expect(A.yaziAyarla('yok-boyle')).toBe(false);
        A.yaziAyarla('inter');
        expect(document.documentElement.hasAttribute('data-yazi')).toBe(false);
        expect(A.yazi()).toBe('inter');
      }finally{
        d.remove();
        A.yaziAyarla(eski || 'inter');
      }
    });

    /* 2026-10-29: Sistem › Sistem planlaması PC'deki sunucudadır; sunucu yoksa söylenir. */
    it('Sistem planlaması: sunucu yoksa uydurmaz, nedenini söyler', async () => {
      const d = koy();
      const eski = window.fetch;
      window.fetch = () => Promise.resolve(new Response('', { status:404 }));
      try{
        d.querySelector('[data-ayar-bolum="sistem"]').click();
        await new Promise(r => setTimeout(r, 30));
        const k = d.querySelector('[data-plan-kok]');
        expect(k.textContent.indexOf('LifeOS sunucusunun bu bilgisayarda açık olmasını') >= 0).toBe(true);
        expect(!!k.querySelector('[data-plan-ac]')).toBe(false);
      }finally{ window.fetch = eski; d.remove(); A._sec('gorunum'); }
    });

    /* 2026-10-30 (kullanıcı: «her gün aynı saat olmak zorunda değil; arayüz çok karmaşık»). */
    it('Planlama: her günün kendi saati; boş gün eklenir, saat kaldırılır; iş birden çok günde; tek kayıt', async () => {
      const d = koy();
      const eski = window.fetch, giden = [];
      const plan = { acilis:{ acik:true, saatler:['07:00', '07:00', '07:00', '07:00', '07:00', '10:00', null] }, kapanis:{ acik:false, saatler:Array(7).fill('23:30') },
        isler:{ yedek:{ acik:true, gunler:[5], saat:'07:00', kacarsa:'hemen', kur:false, acildi:0 } }, son:{}, bekleyen:[] };
      window.fetch = (u, o) => {
        if(o && o.method === 'POST'){ giden.push(JSON.parse(o.body)); return Promise.resolve(new Response(JSON.stringify({ plan:JSON.parse(o.body) }), { status:200 })); }
        return Promise.resolve(new Response(JSON.stringify({ plan, isler:[{ id:'yedek', ad:'Yedek', not:'n' }], gunler:['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], windows:true, calisan:[] }), { status:200 }));
      };
      try{
        d.querySelector('[data-ayar-bolum="sistem"]').click();
        await new Promise(r => setTimeout(r, 40));
        const k = d.querySelector('[data-plan-kok]');
        expect(k.querySelectorAll('.plan__tablo [data-plan-gunsaat^="acilis|"]').length).toBe(6);
        expect(k.querySelector('[data-plan-gunsaat="acilis|5"]').value).toBe('10:00');
        k.querySelector('[data-plan-gunac="acilis|6"]').click();
        k.querySelector('[data-plan-gunkapa="acilis|0"]').click();
        k.querySelector('[data-plan-gunac="kapanis|4"]').click();
        k.querySelector('[data-plan-duzen="yedek"]').click();
        k.querySelector('[data-plan-kume="yedek|ici"]').click();
        expect(k.querySelector('.plan__is small').textContent.indexOf('Hafta içi · 07:00') === 0).toBe(true);
        await new Promise(r => setTimeout(r, 450));
        expect(giden.length).toBe(1);                                  // art arda değişiklik tek kayıt
        const g = giden[0];
        expect(g.acilis.saatler).toEqual([null, '07:00', '07:00', '07:00', '07:00', '10:00', '07:00']);
        expect(g.kapanis).toEqual({ acik:true, saatler:[null, null, null, null, '23:30', null, null] });
        expect(g.isler.yedek.gunler).toEqual([0, 1, 2, 3, 4]);
      }finally{ window.fetch = eski; d.remove(); A._sec('gorunum'); }
    });

    /* 2026-10-30 (kullanıcı ekranı: güncellemeden sonra sunucu yeniden başlatılmadan Planlama «sunucu yok» diyordu). */
    it('Planlama: eski sunucunun biçimi gösterilir, kaydedilmez, yeniden başlat denir', async () => {
      const d = koy();
      const eski = window.fetch, giden = [];
      window.fetch = (u, o) => {
        if(o && o.method === 'POST'){ giden.push(o.body); return Promise.resolve(new Response('{}', { status:200 })); }
        return Promise.resolve(new Response(JSON.stringify({ plan:{ acilis:{ acik:true, gunler:[5], saat:'07:00' }, kapanis:{ acik:false, gunler:[0], saat:'23:30' },
          isler:{ yedek:{ acik:true, gun:2, saat:'08:00', kacarsa:'hemen' } }, son:{}, bekleyen:[] },
          isler:[{ id:'yedek', ad:'Yedek', not:'n' }], gunler:['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], windows:true, calisan:[] }), { status:200 }));
      };
      try{
        d.querySelector('[data-ayar-bolum="sistem"]').click();
        await new Promise(r => setTimeout(r, 40));
        const k = d.querySelector('[data-plan-kok]');
        expect(k.textContent).toContain('eski sürümle çalışıyor');
        expect(k.querySelector('[data-plan-gunsaat="acilis|5"]').value).toBe('07:00');
        expect(k.querySelector('.plan__is small').textContent.indexOf('Çar · 08:00') === 0).toBe(true);
        k.querySelector('[data-plan-gunac="acilis|0"]').click();
        await new Promise(r => setTimeout(r, 450));
        expect(giden.length).toBe(0);
        expect(k.querySelector('.plan__mesaj').textContent).toContain('yeniden aç');
      }finally{ window.fetch = eski; d.remove(); A._sec('gorunum'); }
    });

    /* 2026-10-29 (kullanıcı: «satın alma ve kart işlemlerini açıp kapatabilelim; güvenlik
       ve sistem hakkında birçok şeyi ayarlayabilelim»; Google: «kendi tarayıcımda açsın»). */
    it('Hesap: satın alma ve kart kilidi varsayılan kapalı, basınca değişir; Google bağlanmaz yazar; gizlilik kilidi burada', () => {
      let eski = null;
      try{ eski = localStorage.getItem(A.ODEME_ANAHTAR); localStorage.removeItem(A.ODEME_ANAHTAR); }catch(e){}
      const d = koy();
      try{
        const h = d.querySelector('#ayarlar-bolum-hesap');
        expect(A.odemeAcik()).toBe(false);
        expect(h.querySelector('[data-odeme="kapali"]').getAttribute('aria-pressed')).toBe('true');
        h.querySelector('[data-odeme="acik"]').click();
        expect(A.odemeAcik()).toBe(true);
        expect(h.querySelector('[data-odeme="acik"]').getAttribute('aria-pressed')).toBe('true');
        h.querySelector('[data-odeme="kapali"]').click();
        expect(A.odemeAcik()).toBe(false);
        expect(d.querySelector('#ayarlar-bolum-baglanti').textContent.indexOf('LifeOS Google’a veri göndermez') >= 0).toBe(true);
        if(window.LIFEOS.KILIT) expect(!!d.querySelector('#ayarlar-bolum-modul [data-kilit-ayar]')).toBe(true);   // kilit modülün kendisinde
        expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(A.ODEME_ANAHTAR) >= 0).toBe(true);
      }finally{ d.remove(); try{ if(eski == null) localStorage.removeItem(A.ODEME_ANAHTAR); else localStorage.setItem(A.ODEME_ANAHTAR, eski); }catch(e){} }
    });
    it('Hesap: güvenlik satırları hesap merkezinin gerçek sayfalarına açılır', () => {
      A.HESAP_SAYFALARI.forEach(([sayfa]) => expect(typeof sayfa).toBe('string'));
      expect(A.HESAP_SAYFALARI.map(x => x[0])).toEqual(['guvenlik', 'ikiadim', 'cihazlar', 'etkinlik', 'yedek', 'verin']);
      expect(A.BAGLANTI_SAYFALARI.map(x => x[0])).toEqual(['baglantilar', 'bagla', 'anahtarlar', 'gelen', 'takvim']);
    });

    /* 2026-10-29 (kullanıcı: «seçenekleri arttır; arka plan fotoğrafını değiştirebilmeyi göremedim»). */
    it('görünüm seçimleri köke yazılır, kalıcıdır ve taşınır; varsayılan hep yazılı', () => {
      const anahtarlar = Object.keys(A.SECIMLER).map(k => A.SECIMLER[k].anahtar);
      const once = anahtarlar.map(k => localStorage.getItem(k));
      const d = koy();
      try{
        anahtarlar.forEach(k => localStorage.removeItem(k));
        Object.keys(A.SECIMLER).forEach(k => A.secimAyarla(k, A.SECIMLER[k].vars));
        expect(document.documentElement.getAttribute('data-cam')).toBe('orta');
        expect(document.documentElement.getAttribute('data-perde')).toBe('orta');
        d.querySelector('[data-secim="cam:cok"]').click();
        expect(document.documentElement.getAttribute('data-cam')).toBe('cok');
        expect(localStorage.getItem('lifeos.cam')).toBe('cok');
        expect(d.querySelector('[data-secim="cam:cok"]').getAttribute('aria-pressed')).toBe('true');
        expect(A.secimAyarla('cam', 'bilinmez')).toBe(false);
        d.querySelector('[data-secim="kontrast:yuksek"]').click();
        expect(document.documentElement.getAttribute('data-kontrast')).toBe('yuksek');
        anahtarlar.forEach(k => expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(k) >= 0).toBe(true));
        expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf('lifeos.sessiz') >= 0).toBe(true);
      }finally{
        d.remove();
        anahtarlar.forEach((k, i) => { if(once[i] == null) localStorage.removeItem(k); else localStorage.setItem(k, once[i]); });
        Object.keys(A.SECIMLER).forEach(k => A.secimAyarla(k, A.secim(k)));
      }
    });
    it('arka plan kendi bölümünde: iki yuva önizlemeli; perde ve yumuşatma seçicisi var', () => {
      const d = koy();
      try{
        const z = d.querySelector('#ayarlar-bolum-zemin');
        expect(z.querySelectorAll('.zemin-yuvasi').length).toBe(2);
        if(window.LIFEOS.ZEMIN && window.LIFEOS.ZEMIN.onizle) expect(z.querySelectorAll('.zemin-onizle').length).toBe(2);
        expect(!!z.querySelector('[data-secim="perde:cok"]')).toBe(true);
        expect(!!z.querySelector('[data-secim="bulanik:hafif"]')).toBe(true);
      }finally{ d.remove(); }
    });
    it('ayarlarda ara: bütün bölümlerden eşleşen satırlar kalır; silince eski hâline döner', () => {
      A._sec('gorunum');
      const d = koy();
      try{
        const p = d.querySelector('.ayarlar');
        A.ara(p, 'perde');
        const acik = Array.from(p.querySelectorAll('.ayarlar__bolum')).filter(s => !s.hidden).map(s => s.id);
        expect(acik).toEqual(['ayarlar-bolum-zemin']);
        const satir = Array.from(p.querySelectorAll('#ayarlar-bolum-zemin .ayarlar__satir')).filter(x => !x.hidden);
        expect(satir.length).toBe(1);
        A.ara(p, '');
        expect(Array.from(p.querySelectorAll('.ayarlar__bolum')).filter(s => !s.hidden).map(s => s.id)).toEqual(['ayarlar-bolum-gorunum']);
        expect(p.querySelectorAll('[data-ara-gizli]').length).toBe(0);
      }finally{ d.remove(); }
    });
    it('görünümü sıfırla iki adımdır: ilk basış yalnız sorar', () => {
      const d = koy();
      try{
        const b = d.querySelector('[data-ayarlar-sifirla]');
        b.click();
        expect(b.textContent).toBe('Emin misin? Sıfırla');
        expect(A.SIFIRLANAN.indexOf('lifeos.manzara') >= 0 && A.SIFIRLANAN.indexOf('lifeos.kilit.odeme') < 0).toBe(true);
      }finally{ d.remove(); }
    });

    /* 2026-10-30 (kullanıcı: «tema paketlerini kaldır; kastım ayar profilleri: adını koyayım,
       ona geçince bütün ayarlarım o profildekine dönsün»). */
    it('ayar profili: şu anki ayarları adla saklar, geçince hepsi döner, profilde olmayan varsayılana iner', () => {
      const anahtarlar = [A.PROFIL_ANAHTAR, A.ETKIN_ANAHTAR, A.GORDU_ANAHTAR, A.TEMA_BEKLE].concat(A.PROFIL_KAPSAR);
      const once = anahtarlar.map(k => localStorage.getItem(k));
      try{
        anahtarlar.forEach(k => localStorage.removeItem(k));
        localStorage.setItem('lifeos.cam', 'cok');
        localStorage.setItem('lifeos.king.ad', 'Kağan');
        expect(A.profilKaydet('  Türklük ', 'dark').ok).toBe(true);
        expect(A.etkinProfil().ad).toBe('Türklük');
        localStorage.removeItem('lifeos.king.ad');
        localStorage.setItem('lifeos.cam', 'az');
        localStorage.setItem('lifeos.perde', 'cok');
        expect(A.profilKaydet('Sade', null).ok).toBe(true);
        expect(A.profiller().map(p => p.ad)).toEqual(['Türklük', 'Sade']);
        expect(A.profilUygula('türklük', false)).toBe(true);           // büyük/küçük harf fark etmez
        expect(localStorage.getItem('lifeos.cam')).toBe('cok');
        expect(localStorage.getItem('lifeos.king.ad')).toBe('Kağan');
        expect(localStorage.getItem('lifeos.perde')).toBe(null);         // Türklük'te yoktu: varsayılan
        expect(localStorage.getItem(A.TEMA_BEKLE)).toBe('dark');          // tema modülün kendi eylemiyle
        expect(A.profilKaydet('Türklük', 'light').mesaj).toContain('güncellendi');
        expect(A.profiller().length).toBe(2);
        expect(A.profilKaydet('   ').ok).toBe(false);
        /* Veri, hesap ve kilit profile girmez. */
        ['lifeos.kilit.odeme', 'lifeos.kisi.izin', 'lifeos.king.kartlarim'].forEach(k => expect(A.PROFIL_KAPSAR.indexOf(k)).toBe(-1));
        /* Öbür modülde seçilen profil burada bir kez uygulanır. */
        localStorage.setItem(A.ETKIN_ANAHTAR, JSON.stringify({ ad:'Sade', damga:'99' }));
        expect(A.profilEsitle()).toBe(true);
        expect(localStorage.getItem('lifeos.cam')).toBe('az');
        expect(A.profilEsitle()).toBe(false);
        expect(A.profilSil('Sade')).toBe(true);
        expect(A.etkinProfil()).toBe(null);
        [A.PROFIL_ANAHTAR, A.ETKIN_ANAHTAR].forEach(k => expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(k) >= 0).toBe(true));
      }finally{
        anahtarlar.forEach((k, i) => { if(once[i] == null) localStorage.removeItem(k); else localStorage.setItem(k, once[i]); });
      }
    });
    it('profiller bölümü: boşken ne yapılacağını söyler; kayıtlı profilde Geç, etkin olanda Güncelle', () => {
      const once = [A.PROFIL_ANAHTAR, A.ETKIN_ANAHTAR].map(k => localStorage.getItem(k));
      try{
        localStorage.removeItem(A.PROFIL_ANAHTAR); localStorage.removeItem(A.ETKIN_ANAHTAR);
        expect(A.profilHtml()).toContain('Henüz profil yok');
        localStorage.setItem(A.PROFIL_ANAHTAR, JSON.stringify([{ ad:'Gece <b>', ayar:{ 'lifeos.cam':'cok' } }, { ad:'Gündüz', ayar:{} }]));
        localStorage.setItem(A.ETKIN_ANAHTAR, JSON.stringify({ ad:'Gündüz', damga:'1' }));
        const h = A.profilHtml();
        expect(h).toContain('Gece &lt;b&gt;');
        expect(h).toContain('data-profil-gec="Gece &lt;b&gt;"');
        expect(h).toContain('data-profil-guncelle="Gündüz"');
      }finally{
        [A.PROFIL_ANAHTAR, A.ETKIN_ANAHTAR].forEach((k, i) => { if(once[i] == null) localStorage.removeItem(k); else localStorage.setItem(k, once[i]); });
      }
    });
    it('tema paketi kalktı; bulanıklıkta «Hiç» var ve köke yazılır', () => {
      expect(A.SECIMLER.paket).toBe(undefined);
      expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf('lifeos.tema.paket')).toBe(-1);
      expect(A.SECIMLER.bulanik.sira[0]).toBe('hic');
      const once = localStorage.getItem('lifeos.zemin.bulanik');
      try{
        expect(A.secimAyarla('bulanik', 'hic')).toBe(true);
        expect(document.documentElement.getAttribute('data-bulanik')).toBe('hic');
      }finally{
        if(once == null) localStorage.removeItem('lifeos.zemin.bulanik'); else localStorage.setItem('lifeos.zemin.bulanik', once);
        A.secimAyarla('bulanik', A.secim('bulanik'));
      }
    });
    it('hesap sunucusu yokken düğme yok, durum söylenir', () => {
      const d = koy();
      try{
        const h = d.querySelector('#ayarlar-bolum-hesap');
        const var_ = !!(window.LIFEOS.HESAP && window.LIFEOS.HESAP.dugme && !window.LIFEOS.HESAP.dugme().gizli);
        expect(!!h.querySelector('[data-ayarlar-hesap]')).toBe(var_);
        if(!var_) expect(h.textContent.indexOf('sunucusu kapalı') >= 0).toBe(true);
      }finally{ d.remove(); }
    });
  });
})();
