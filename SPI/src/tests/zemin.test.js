/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/zemin.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Zemin — yumuşak renk zemini ve içeriğin arkasındaki buzlu yüzey.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/zemin.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: varsayılan Yumuşak'tır ve ilk çizimden önce
   `<html data-zemin>` olarak konur; Sade eski düz zemine döner; seçim
   kalıcıdır ve modül geçişinde taşınır; buzlu yüzey içerik sütununun
   ARKASINDADIR ve ekranı kaplamaz (kenarlardan içeride, telefonda yok);
   kartlar opak kalır (okunan şey camın arkasında durmaz). */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const Z = window.LIFEOS.ZEMIN;

  function kipleSina(fn){
    let eski = null;
    try{ eski = localStorage.getItem(Z.ANAHTAR); }catch(e){}
    try{ return fn(); }
    finally{
      try{ if(eski == null) localStorage.removeItem(Z.ANAHTAR); else localStorage.setItem(Z.ANAHTAR, eski); }catch(e){}
      Z.yenile();
    }
  }
  function sayfaKur(){
    const d = document.createElement('div');
    d.innerHTML = '<div class="site site--v5"><div class="site__body"><div class="wrapc sayfa" style="width:900px">'
      + '<div class="card" style="height:40px">kart</div></div></div></div>';
    document.body.appendChild(d);
    return d;
  }

  describe('Zemin (Yumuşak · Sade)', () => {
    it('varsayılan Yumuşak; <html data-zemin> ilk çizimden önce konur', () => kipleSina(() => {
      try{ localStorage.removeItem(Z.ANAHTAR); }catch(e){}
      Z.yenile();
      expect(Z.kip()).toBe('yumusak');
      expect(document.documentElement.getAttribute('data-zemin')).toBe('yumusak');
    }));

    it('Yumuşak: renk zemini sabit katmanda, buzlu yüzey içeriğin arkasında ve ekranı kaplamaz', () => kipleSina(() => {
      Z.ayarla('yumusak');
      const d = sayfaKur();
      try{
        const zemin = getComputedStyle(document.body, '::before');
        expect(zemin.position).toBe('fixed');
        expect(zemin.backgroundImage.indexOf('radial-gradient') >= 0).toBe(true);
        expect(getComputedStyle(document.body).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        const s = d.querySelector('.sayfa');
        const buz = getComputedStyle(s, '::before');
        expect(buz.content !== 'none').toBe(true);
        expect(buz.zIndex).toBe('-1');
        expect(buz.borderTopLeftRadius).toBe('28px');
        /* Kenarlardan içeride: tam ekran değil, sütunun kendisi. */
        expect(parseFloat(buz.left) > 0 && parseFloat(buz.right) > 0 && parseFloat(buz.top) > 0).toBe(true);
        /* Yeni yığın bağlamı açılmaz: sayfanın içindeki katmanlar üst
           şeridin ve kenarın üstüne/altına eskisi gibi oturur. */
        expect(getComputedStyle(s).zIndex).toBe('auto');
        expect(getComputedStyle(s).isolation).toBe('auto');
        /* Kart opak kalır (saydamlık payı olan renk «rgba(…)» diye döner). */
        expect(getComputedStyle(d.querySelector('.card')).backgroundColor.indexOf('rgb(')).toBe(0);
      }finally{ d.remove(); }
    }));

    it('Sade: düz zemin, buzlu yüzey yok', () => kipleSina(() => {
      Z.ayarla('sade');
      const d = sayfaKur();
      try{
        expect(document.documentElement.getAttribute('data-zemin')).toBe('sade');
        expect(getComputedStyle(document.body, '::before').backgroundImage.indexOf('radial-gradient')).toBe(-1);
        expect(getComputedStyle(d.querySelector('.sayfa'), '::before').content).toBe('none');
      }finally{ d.remove(); }
    }));

    it('seçim kalıcı; Görünüm satırı yerinde güncellenir; modül geçişinde taşınır', () => kipleSina(() => {
      const d = document.createElement('div');
      d.innerHTML = Z.seciciHtml();
      document.body.appendChild(d);
      try{
        expect(Array.from(d.querySelectorAll('[data-zemin-sec]')).map(b => b.textContent.trim())).toEqual(['Yumuşak', 'Sade']);
        d.querySelector('[data-zemin-sec="sade"]').dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
        expect(localStorage.getItem(Z.ANAHTAR)).toBe('sade');
        expect(d.querySelector('[data-zemin-sec="sade"]').getAttribute('aria-pressed')).toBe('true');
        expect(d.querySelector('[data-zemin-sec="yumusak"]').getAttribute('aria-pressed')).toBe('false');
        expect(Z.ayarla('cicekli')).toBe(false);
        expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(Z.ANAHTAR) >= 0).toBe(true);
      }finally{ d.remove(); }
    }));

    /* Kullanıcı (2026-10-03): «tema beyazdaysa girişte 3 saniye beklediğimiz
       yer de beyaz olsun, buğulu olsun». Tema profilden gelir ve uygulama
       açılınca konur; ilk karede bilinsin diye son tema hatırlanır. */
    it('son tema hatırlanır ve ilk çizimde (uygulamadan önce) konur', () => {
      const kok = document.documentElement;
      const eskiTema = kok.getAttribute('data-theme');
      let eskiDepo = null;
      try{ eskiDepo = localStorage.getItem(Z.TEMA); }catch(e){}
      try{
        kok.setAttribute('data-theme', 'dark');
        Z._temaKaydet();
        expect(localStorage.getItem(Z.TEMA)).toBe('dark');
        kok.removeAttribute('data-theme');
        expect(Z.temaIlk()).toBe('dark');
        expect(kok.getAttribute('data-theme')).toBe('dark');
        /* «Sistem» seçilince (nitelik yok) hatıra da silinir. */
        kok.removeAttribute('data-theme');
        Z._temaKaydet();
        expect(localStorage.getItem(Z.TEMA)).toBeNull();
        expect(Z.temaIlk()).toBeNull();
      }finally{
        if(eskiTema == null) kok.removeAttribute('data-theme'); else kok.setAttribute('data-theme', eskiTema);
        try{ if(eskiDepo == null) localStorage.removeItem(Z.TEMA); else localStorage.setItem(Z.TEMA, eskiDepo); }catch(e){}
      }
    });

    it('marka girişi temaya uyar ve buğuludur: açıkta açık, koyuda koyu', async () => {
      const kok = document.documentElement;
      const eskiTema = kok.getAttribute('data-theme');
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = '../css/seviye.css';
      await new Promise(r => { link.onload = r; link.onerror = r; document.head.appendChild(link); });
      const d = document.createElement('div');
      d.className = 'perde perde--marka';
      d.style.zIndex = '-1';
      document.body.appendChild(d);
      const parlaklik = () => {
        const m = getComputedStyle(d).backgroundColor.match(/[\d.]+/g).map(Number);
        return (m[0] + m[1] + m[2]) / 3;
      };
      try{
        kok.setAttribute('data-theme', 'light');
        expect(parlaklik() > 200).toBe(true);
        expect(/blur/.test(getComputedStyle(d).backdropFilter || getComputedStyle(d).webkitBackdropFilter || '')).toBe(true);
        kok.setAttribute('data-theme', 'dark');
        expect(parlaklik() < 60).toBe(true);
        expect(/blur/.test(getComputedStyle(d).backdropFilter || getComputedStyle(d).webkitBackdropFilter || '')).toBe(true);
      }finally{
        d.remove(); link.remove();
        if(eskiTema == null) kok.removeAttribute('data-theme'); else kok.setAttribute('data-theme', eskiTema);
      }
    });
  });
  /* 2026-10-05 (kullanıcı, «6 güzel»): zemin günün saatine göre çok az kayar. */
  describe('Zemin — günün saati', () => {
    const Z = () => window.LIFEOS.ZEMIN;
    const saat = (h, m) => new Date(2026, 9, 5, h, m || 0);
    it('sabah sıcak, gün ortası nötr, akşam altın, gece serin; geçiş yumuşak', () => {
      expect(Z().saatTonu(saat(7))).toEqual({ renk:'#ffc58a', guc:0.14 });
      expect(Z().saatTonu(saat(13)).guc).toBe(0);
      expect(Z().saatTonu(saat(18, 30)).renk).toBe('#ffb37a');
      const gece = Z().saatTonu(saat(23)).renk, kanal = i => parseInt(gece.slice(i, i + 2), 16);
      expect(kanal(5) > kanal(1)).toBe(true);                      // gece serin: mavi > kırmızı
      const g8 = Z().saatTonu(saat(8)).guc;
      expect(g8 < 0.14 && g8 > 0.04).toBe(true);                  // 7 ile 10 arası, sıçrama yok
      expect(Z().saatTonu(saat(2)).guc >= 0.1).toBe(true);
      expect(/^#[0-9a-f]{6}$/.test(Z().saatTonu(saat(21, 15)).renk)).toBe(true);
    });
    it('uygulanınca kökte --zemin-saat yazılır', () => {
      Z().saatUygula();
      expect(document.documentElement.style.getPropertyValue('--zemin-saat') !== '').toBe(true);
    });
    it('tema değişince ton hemen tazelenir; koyuda yarısı', async () => {
      const kok = document.documentElement, eski = kok.getAttribute('data-theme');
      const tik = () => new Promise(r => setTimeout(r, 0));
      const once = Z()._saatSaglayici(() => saat(7));
      try{
        kok.setAttribute('data-theme', 'light'); await tik();
        expect(kok.style.getPropertyValue('--zemin-saat')).toContain(' 14%');
        kok.setAttribute('data-theme', 'dark'); await tik();
        expect(kok.style.getPropertyValue('--zemin-saat')).toContain(' 7%');
      }finally{
        Z()._saatSaglayici(once);
        if(eski === null) kok.removeAttribute('data-theme'); else kok.setAttribute('data-theme', eski);
        await tik();
      }
    });
  });

  /* 2026-10-06 (kullanıcı): «arka planda 4 farklı renk var, daha profesyonel
     olsun» → başka yönler gösterildi → «şimdiki iyi, onu geliştir» → «Canlı».
     Söz: dört leke TEK renk ailesidir (modülün tonu ±30°; sabit kum, pembe ya
     da nane tonu yok) ve her leke yumuşak söner (disk izi yok). Eski zeminde
     kum tonu AYS'nin mavisinden ~190°, komşular 40° uzaktaydı. */
  describe('Zemin — tek renk ailesi', () => {
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
    /* Renk metni → { c: kroma, h: ton (derece), a: saydamlık }. */
    function cozumle(t){
      const n = (t.match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number);
      const a = n.length > 3 ? n[3] : 1;
      if(/^oklch/.test(t)) return { c:n[1], h:n[2], a };
      const [, A, B] = /^oklab/.test(t) ? n : oklab(n[0], n[1], n[2]);
      return { c:Math.hypot(A, B), h:(Math.atan2(B, A) * 180 / Math.PI + 360) % 360, a };
    }
    const fark = (x, y) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };
    const RENK = /(?:oklch|oklab|rgba?)\([^()]*\)/g;
    /* Arka planı üst düzey katmanlarına böler (parantez içindeki virgüller değil). */
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

    it('dört leke modülün tonundan en çok 35° uzakta; her biri beş ara durakla söner (açık ve koyu)', () => kipleSina(() => {
      const kok = document.documentElement, eskiTema = kok.getAttribute('data-theme');
      const onceSaat = Z._saatSaglayici(() => new Date(2026, 9, 6, 13, 0));   // gün ortası: saat tonu yok
      const olcu = document.createElement('i');
      olcu.style.color = 'var(--mod, var(--ays))';
      document.body.appendChild(olcu);
      try{
        Z.ayarla('yumusak');
        ['light', 'dark'].forEach(tema => {
          kok.setAttribute('data-theme', tema);
          Z.saatUygula();
          const mod = cozumle(getComputedStyle(olcu).color);
          const lekeler = katmanlar(getComputedStyle(document.body, '::before').backgroundImage)
            .map(k => (k.match(RENK) || []).map(cozumle))
            .filter(r => r.some(x => x.a > 0.01 && x.c > 0.03));
          expect(tema + ': ' + lekeler.length + ' leke').toBe(tema + ': 4 leke');
          const uzak = [].concat(...lekeler).filter(x => x.a > 0.01 && x.c > 0.03 && fark(x.h, mod.h) > 35)
            .map(x => Math.round(x.h) + '°');
          expect(tema + ': ' + uzak.join(' ')).toBe(tema + ': ');
          /* Başlangıç + dört ara durak + saydam son: en az altı renk. */
          expect(lekeler.every(r => r.length >= 6)).toBe(true);
        });
      }finally{
        olcu.remove();
        Z._saatSaglayici(onceSaat);
        if(eskiTema == null) kok.removeAttribute('data-theme'); else kok.setAttribute('data-theme', eskiTema);
        Z.saatUygula();
      }
    }));
  });

  describe('Zemin — günün ilk açılışı (2026-10-17)', () => {
    it('gün içinde bir kez oynar; ertesi gün yeniden', () => {
      const Z = window.LIFEOS.ZEMIN;
      let eski = null;
      try{ eski = localStorage.getItem(Z.GUN_ANAHTAR); localStorage.removeItem(Z.GUN_ANAHTAR); }catch(e){}
      try{
        expect(Z.gunIlk(new Date(2026, 9, 17, 7, 30))).toBe(true);
        expect(document.querySelector('.zemin-isik').classList.contains('is-gunaydin')).toBe(true);
        expect(Z.gunIlk(new Date(2026, 9, 17, 21, 0))).toBe(false);
        expect(Z.gunIlk(new Date(2026, 9, 18, 6, 0))).toBe(true);
      }finally{
        try{ if(eski == null) localStorage.removeItem(Z.GUN_ANAHTAR); else localStorage.setItem(Z.GUN_ANAHTAR, eski); }catch(e){}
        const e = document.querySelector('.zemin-isik'); if(e){ clearTimeout(e._zaman); e.remove(); }
      }
    });
  });

  describe('Zemin — kayıt ışığı (2026-10-17)', () => {
    it('nabiz tek ışık katmanı kurar, gövdenin ilk çocuğu yapar ve oynatır', () => {
      const Z = window.LIFEOS.ZEMIN;
      const eski = document.querySelector('.zemin-isik');
      if(eski) eski.remove();
      try{
        const a = Z.nabiz();
        const b = Z.nabiz();
        expect(a === b).toBe(true);
        expect(document.querySelectorAll('.zemin-isik').length).toBe(1);
        expect(document.body.firstChild === a).toBe(true);
        expect(a.classList.contains('is-nabiz')).toBe(true);
        expect(a.getAttribute('aria-hidden')).toBe('true');
      }finally{ const e = document.querySelector('.zemin-isik'); if(e){ clearTimeout(e._zaman); e.remove(); } }
    });
  });

  describe('Yüzey — kart, ferah, şerit; modül başına', () => {
    it('varsayılan kart: nitelik yok; seçim modülün kendi anahtarına yazılır ve <html data-yuzey> olur', () => {
      const Z = window.LIFEOS.ZEMIN, kok = document.documentElement;
      const onceModul = kok.getAttribute('data-modul');
      kok.setAttribute('data-modul', 'deneme');
      try{
        expect(Z.YUZEYLER).toEqual(['kart', 'ferah', 'serit']);
        expect(Z.yuzeyAnahtar()).toBe('lifeos.yuzey.deneme');
        expect(Z.yuzeyAyarla('ferah')).toBe(true);
        expect(kok.getAttribute('data-yuzey')).toBe('ferah');
        expect(localStorage.getItem('lifeos.yuzey.deneme')).toBe('ferah');
        expect(Z.yuzeyAyarla('bilinmez')).toBe(false);
        const d = document.createElement('div'); d.innerHTML = Z.yuzeySeciciHtml();
        expect(d.querySelector('[data-yuzey-sec="ferah"]').getAttribute('aria-pressed')).toBe('true');
        Z.yuzeyAyarla('kart');
        expect(kok.hasAttribute('data-yuzey')).toBe(false);
      }finally{
        try{ localStorage.removeItem('lifeos.yuzey.deneme'); }catch(e){}
        if(onceModul) kok.setAttribute('data-modul', onceModul); else kok.removeAttribute('data-modul');
      }
    });
  });

  /* Kullanıcı (2026-10-28: «sistemin arka planına gerekirse resim koy;
     devasa bir güncelleme»): modülün kendi CC0 manzarası (brand/medya/doku).
     Varsayılan açık; kapalıysa resim hiç istenmez (eski renk alanı). Tercih
     üç modülde ortaktır (animasyon.js TASINAN). */
  describe('Zemin — manzara', () => {
    it('varsayılan açık: <html data-manzara> ve modülün kendi resmi; kapalıda ikisi de kalkar', () => {
      const Z = window.LIFEOS.ZEMIN, kok = document.documentElement;
      const onceModul = kok.getAttribute('data-modul'), once = localStorage.getItem('lifeos.manzara');
      const onceTema = kok.getAttribute('data-theme');
      kok.setAttribute('data-modul', 'spi');
      kok.setAttribute('data-theme', 'light');
      try{
        localStorage.removeItem('lifeos.manzara');
        Z.manzaraYenile();
        expect(Z.manzara()).toBe('acik');
        expect(kok.getAttribute('data-manzara')).toBe('acik');
        expect(kok.style.getPropertyValue('--manzara')).toContain('img/marka/doku-manzara-spi.webp');
        expect(Z.manzaraAyarla('kapali')).toBe(true);
        expect(kok.hasAttribute('data-manzara')).toBe(false);
        expect(kok.style.getPropertyValue('--manzara')).toBe('');
        expect(localStorage.getItem('lifeos.manzara')).toBe('kapali');
        expect(Z.manzaraAyarla('bilinmez')).toBe(false);
        const d = document.createElement('div'); d.innerHTML = Z.manzaraSeciciHtml();
        expect(d.querySelector('[data-manzara-sec="kapali"]').getAttribute('aria-pressed')).toBe('true');
        expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf('lifeos.manzara') >= 0).toBe(true);
      }finally{
        try{ if(once == null) localStorage.removeItem('lifeos.manzara'); else localStorage.setItem('lifeos.manzara', once); }catch(e){}
        if(onceModul) kok.setAttribute('data-modul', onceModul); else kok.removeAttribute('data-modul');
        if(onceTema) kok.setAttribute('data-theme', onceTema); else kok.removeAttribute('data-theme');
        Z.manzaraYenile();
      }
    });

    /* 2026-10-29 (kullanıcı: «gece ile sabah aynı ya da ayrı olsun»; «karanlık
       temada arka planın kararması kötü, daha akıllıca bir şey»). */
    function temizle(fn){
      const Z = window.LIFEOS.ZEMIN, kok = document.documentElement;
      const anahtarlar = ['lifeos.manzara', 'lifeos.manzara.gece', 'lifeos.tema.oto', 'lifeos.manzara.tur.gunduz', 'lifeos.manzara.tur.gece'];
      const once = anahtarlar.map(k => localStorage.getItem(k)), onceTema = kok.getAttribute('data-theme');
      try{ anahtarlar.forEach(k => localStorage.removeItem(k)); Z.manzaraYenile(); return fn(Z, kok); }
      finally{
        anahtarlar.forEach((k, i) => { if(once[i] == null) localStorage.removeItem(k); else localStorage.setItem(k, once[i]); });
        Z.manzaraYenile();
        if(onceTema) kok.setAttribute('data-theme', onceTema); else kok.removeAttribute('data-theme');
      }
    }
    it('koyu temada varsayılan gece rengi: gündüz fotoğrafı karartılmaz, gösterilmez', () => temizle((Z, kok) => {
      kok.setAttribute('data-theme', 'dark'); Z.manzaraYenile();
      expect(Z.gece()).toBe('renk');
      expect(Z.etkinZemin().tur).toBe('yok');
      expect(kok.hasAttribute('data-manzara')).toBe(false);
      expect(Z.geceAyarla('ayni')).toBe(true);
      expect(Z.etkinZemin().tur).toBe('modul');
      expect(kok.getAttribute('data-manzara')).toBe('acik');
      kok.setAttribute('data-theme', 'light');
      expect(Z.etkinZemin().tur).toBe('modul');
      expect(Z.geceAyarla('yok-boyle')).toBe(false);
    }));
    it('kendi dosyan: türü biliniyorsa sunucudan okunur; dosya yoksa modülün fotoğrafına düşer', () => temizle((Z, kok) => {
      kok.setAttribute('data-theme', 'light');
      Z.manzaraAyarla('kendi');
      expect(Z.etkinZemin().tur).toBe('modul');                    // henüz dosya yok
      localStorage.setItem('lifeos.manzara.tur.gunduz', 'video');
      Z.manzaraYenile();
      const z = Z.etkinZemin();
      if(/^https?:$/.test(location.protocol)){
        expect(z.tur).toBe('video');
        expect(kok.hasAttribute('data-zemin-video')).toBe(true);
        expect(document.querySelector('video.zemin-video').getAttribute('src')).toContain('/api/zemin/gunduz');
      }
      Z.manzaraAyarla('acik');
      expect(!!document.querySelector('video.zemin-video')).toBe(false);
      ['lifeos.manzara.gece', 'lifeos.tema.oto', 'lifeos.manzara.tur.gunduz', 'lifeos.manzara.surum'].forEach(k =>
        expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(k) >= 0).toBe(true));
    }));
    /* 2026-10-30 (kullanıcı: «aydınlık temadayken karanlık temaya görsel eklediğimde önizlemede gözükmüyor; önizlemede
       minik sistem kartları olsun, istersen kaldırıp yalnız görseli görebileyim»). */
    it('önizleme seçimle kendini yeniler; gece yuvası koyu kartlı; dosyasız «Kendi» bunu söyler; yalnız görsel düğmesi kalıcı', () => temizle((Z, kok) => {
      const onceSade = localStorage.getItem(Z.ONIZLE_SADE);
      const d = document.createElement('div');
      d.innerHTML = Z.onizleHtml('gunduz') + Z.onizleHtml('gece');
      document.body.appendChild(d);
      try{
        localStorage.removeItem(Z.ONIZLE_SADE);
        kok.setAttribute('data-theme', 'light'); Z.manzaraYenile();
        const gece = () => d.querySelector('[data-zemin-onizle="gece"]');
        expect(gece().classList.contains('zemin-onizle--gece')).toBe(true);
        expect(gece().classList.contains('zemin-onizle--renk')).toBe(true);
        expect(gece().querySelectorAll('.zemin-onizle__ui .zo-kart').length).toBe(2);
        Z.geceAyarla('kendi');                                       // aydınlık temadayken gece yuvası
        expect(gece().querySelector('small').textContent).toBe('Dosya yok · modülün fotoğrafı');
        if(/^https?:$/.test(location.protocol)){
          localStorage.setItem('lifeos.manzara.tur.gece', 'foto');
          Z.geceAyarla('kendi');
          expect(gece().getAttribute('style')).toContain('/api/zemin/gece');
          expect(gece().querySelector('small').textContent).toBe('Kendi fotoğrafın');
        }
        gece().querySelector('[data-zemin-onizle-sade]').click();
        expect(d.querySelectorAll('.zemin-onizle.is-sade').length).toBe(2);
        expect(localStorage.getItem(Z.ONIZLE_SADE)).toBe('1');
        expect(gece().querySelector('[data-zemin-onizle-sade]').getAttribute('aria-pressed')).toBe('true');
      }finally{
        d.remove();
        if(onceSade == null) localStorage.removeItem(Z.ONIZLE_SADE); else localStorage.setItem(Z.ONIZLE_SADE, onceSade);
      }
    }));
    it('saate göre tema: 07–19 açık, öbür saatler koyu; kapatınca önceki tema geri gelir', () => temizle((Z, kok) => {
      const g = h => { const d = new Date(2026, 9, 29, h, 30); return d; };
      expect(Z.otoTema(g(6))).toBe('dark');
      expect(Z.otoTema(g(7))).toBe('light');
      expect(Z.otoTema(g(18))).toBe('light');
      expect(Z.otoTema(g(19))).toBe('dark');
      kok.setAttribute('data-theme', 'dark');
      const eskiSaat = Z._saatSaglayici(() => g(10));
      try{
        expect(Z.otoAyarla('saat')).toBe(true);
        expect(kok.getAttribute('data-theme')).toBe('light');
        expect(Z.otoAyarla('kapali')).toBe(true);
        expect(kok.getAttribute('data-theme')).toBe('dark');
      }finally{ Z._saatSaglayici(eskiSaat); }
    }));
  });

  /* 2026-10-30 (kullanıcı: «arka plan videosunu düzenleyebilelim ya da kendi sesiyle gelsin»). */
  describe('Zemin — arka plan videosunun sesi, kesiti, hızı', () => {
    const sakla = fn => {
      const once = [Z.VIDEO_ANAHTAR, 'lifeos.manzara.tur.gunduz'].map(k => localStorage.getItem(k));
      try{ return fn(); }finally{
        [Z.VIDEO_ANAHTAR, 'lifeos.manzara.tur.gunduz'].forEach((k, i) => { if(once[i] == null) localStorage.removeItem(k); else localStorage.setItem(k, once[i]); });
      }
    };
    it('varsayılan: ses kapalı, tam video, 1×; bozuk değer sınırlanır, bitiş başlangıçtan önceyse yok sayılır', () => sakla(() => {
      localStorage.removeItem(Z.VIDEO_ANAHTAR);
      expect(Z.videoAyar()).toEqual({ ses:false, duzey:.6, bas:0, bit:0, hiz:1, muzik:'sus' });
      localStorage.setItem(Z.VIDEO_ANAHTAR, JSON.stringify({ ses:true, duzey:7, bas:20, bit:10, hiz:3, muzik:'x' }));
      expect(Z.videoAyar()).toEqual({ ses:true, duzey:1, bas:20, bit:0, hiz:1, muzik:'sus' });
      expect(Z.videoAyarla({ bit:45, hiz:1.5, muzik:'birlikte' })).toEqual({ ses:true, duzey:1, bas:20, bit:45, hiz:1.5, muzik:'birlikte' });
      expect(Z.videoSesli()).toBe(false);                                 // video yok: sesli sayılmaz
    }));
    it('ayar: video yokken ne yapılacağını söyler; varken ses, kesit ve hız denetimi', () => sakla(() => {
      localStorage.removeItem('lifeos.manzara.tur.gunduz');
      const ilk = Z.videoAyarHtml();
      if(localStorage.getItem('lifeos.manzara.tur.gece') !== 'video') expect(ilk).toContain('Arka plana bir video koyunca');
      localStorage.setItem('lifeos.manzara.tur.gunduz', 'video');
      localStorage.setItem(Z.VIDEO_ANAHTAR, JSON.stringify({ ses:true, bas:5, bit:30 }));
      const h = Z.videoAyarHtml();
      expect(h).toContain('data-zv-ses="true"');
      expect(h).toContain('0:05 – 0:30');
      expect(h).toContain('data-zv-hiz="0.5"');
      expect(h).toContain('Baştan sona');
    }));
  });
})();
