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
    it('sekiz bölüm, Sistem ve Hesap grup; yalnız seçili olan görünür, sekmeye basınca değişir', () => {
      A._sec('gorunum');
      const d = koy();
      try{
        const sek = Array.from(d.querySelectorAll('[data-ayar-bolum]'));
        expect(sek.map(s => s.textContent)).toEqual(['Görünüm', 'Minikler ve King', 'Ses', 'Animasyon', 'Planlama', 'Güvenlik', 'Bağlantılar', 'Bu modül']);
        /* Sistem ve Hesap sekme değil, grup başlığı; altındakiler sırayla. */
        expect(Array.from(d.querySelectorAll('.ayarlar__grup')).map(g => g.textContent)).toEqual(['Sistem', 'Hesap']);
        expect(d.querySelector('.ayarlar__grup').nextElementSibling.textContent).toBe('Ses');
        const gorunen = () => Array.from(d.querySelectorAll('.ayarlar__bolum')).filter(s => !s.hidden).map(s => s.id);
        expect(gorunen()).toEqual(['ayarlar-bolum-gorunum']);
        sek[2].click();
        expect(gorunen()).toEqual(['ayarlar-bolum-ses']);
        expect(sek[2].getAttribute('aria-selected')).toBe('true');
        expect(sek[0].getAttribute('aria-selected')).toBe('false');
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
        if(window.LIFEOS.KILIT) expect(!!h.querySelector('[data-kilit-ayar]')).toBe(true);
        expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(A.ODEME_ANAHTAR) >= 0).toBe(true);
      }finally{ d.remove(); try{ if(eski == null) localStorage.removeItem(A.ODEME_ANAHTAR); else localStorage.setItem(A.ODEME_ANAHTAR, eski); }catch(e){} }
    });
    it('Hesap: güvenlik satırları hesap merkezinin gerçek sayfalarına açılır', () => {
      A.HESAP_SAYFALARI.forEach(([sayfa]) => expect(typeof sayfa).toBe('string'));
      expect(A.HESAP_SAYFALARI.map(x => x[0])).toEqual(['guvenlik', 'ikiadim', 'cihazlar', 'etkinlik', 'yedek', 'verin']);
      expect(A.BAGLANTI_SAYFALARI.map(x => x[0])).toEqual(['baglantilar', 'bagla', 'anahtarlar', 'gelen', 'takvim']);
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
