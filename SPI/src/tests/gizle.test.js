/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/gizle.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Gizlenen ve küçültülen bölümler (brand/ortak/gizle.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/gizle.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: gizlenen bölüm çizilir ama gösterilmez ve panelde
   adıyla durur; geri gelir; küçültmek kalıcıdır ve yalnız başlık kalır;
   önizleme salt bakmak içindir (inert); normal görünümde yalnız Küçült
   vardır ve yalnız üzerine gelince görünür;
   anahtar sayı ve gün adından bağımsızdır; tercih ekran başınadır;
   varsayılan gizli bölüm geri getirilirse o seçim kalır. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const G = () => window.LIFEOS.Gizle;
  const MOD = 'test-' + Math.random().toString(36).slice(2, 7);

  function sayfa(){
    const kok = document.createElement('div');
    kok.innerHTML =
        '<section class="lrow"><div class="lrow__side"><div class="lrow__label">Günün akışı 1/3</div>'
      + '<p class="lrow__note">not</p></div><div class="lrow__main"><button data-act="x">İçerik</button></div></section>'
      + '<section class="kutu"><header class="kutu__bas"><h2 class="kutu__ad">Pazar blokları</h2></header>'
      + '<div class="kutu__govde">gövde<section class="lrow"><div class="lrow__side"><div class="lrow__label">İç</div></div></section></div></section>'
      + '<div class="card"><div class="card__head"><div><h3>Sistem önerileri</h3></div></div><div class="card__body">öneri</div></div>'
      + '<section class="lrow"><div class="lrow__main">başlıksız</div></section>';
    document.body.appendChild(kok);
    return kok;
  }
  function kur(ekran, varsayilan){
    const kok = sayfa();
    G()._sifirla();
    G().uygula({ kok, modul:MOD, profil:'p', ekran:ekran || 'bugun', varsayilan });
    return kok;
  }
  function temizle(kok){
    G()._sifirla();
    document.querySelectorAll('.gizle-geri').forEach(x => x.remove());
    if(kok) kok.remove();
    try{ Object.keys(localStorage).filter(k => k.indexOf('lifeos.gizli.' + MOD) === 0).forEach(k => localStorage.removeItem(k)); }catch(e){}
  }

  describe('Gizlenen bölümler — ortak', () => {
    it('anahtar sayılardan ve gün adlarından bağımsız', () => {
      expect(G().anahtar('Pazar blokları')).toBe(G().anahtar('Pazartesi blokları 4'));
      expect(G().anahtar('Günün akışı (1/3)')).toBe(G().anahtar('Günün akışı 2/3'));
      expect(G().anahtar('')).toBe('');
    });

    it('yalnız başlıklı ve en dıştaki bölümler sayılır', () => {
      const kok = kur();
      try{
        expect(G().bolumler(kok).map(b => b.baslik)).toEqual(['Günün akışı 1/3', 'Pazar blokları', 'Sistem önerileri']);
      }finally{ temizle(kok); }
    });

    /* Kullanıcı (2026-10-02): «küçültüp açınca tekrar küçültme düğmesi
       olmuyor». Normal görünümde her açık bölümde YALNIZ «Küçült» durur ve
       yalnız üzerine gelince (ya da odakla) görünür: ekran sakin kalır. */
    it('normal görünümde yalnız Küçült, o da üzerine gelince görünür; düzen kipinde Küçült ve Gizle', () => {
      const kok = kur();
      try{
        expect(kok.querySelectorAll('[data-gizle]').length).toBe(0);
        expect(kok.querySelectorAll('[data-kucult]').length).toBe(3);
        kok.querySelectorAll('.gizle-araclar').forEach(a => {
          expect(a.classList.contains('gizle-araclar--uzerinde')).toBe(true);
          expect(getComputedStyle(a).visibility).toBe('hidden');
        });
        G().duzenle(true);
        expect(kok.querySelectorAll('[data-gizle]').length).toBe(3);
        expect(kok.querySelectorAll('[data-kucult]').length).toBe(3);
        expect(kok.querySelectorAll('.gizle-araclar--uzerinde').length).toBe(0);
        G().duzenle(false);
        expect(kok.querySelectorAll('[data-gizle]').length).toBe(0);
      }finally{ temizle(kok); }
    });

    it('küçültülüp açılan bölümde yeniden Küçült düğmesi var', () => {
      const kok = kur();
      try{
        const a = G().bolumler(kok)[0].anahtar;
        G().kucult(a, true);
        expect(!!G().bolumler(kok)[0].el.querySelector('[data-ac]')).toBe(true);
        G().kucult(a, false);
        const el = G().bolumler(kok)[0].el;
        expect(!!el.querySelector('[data-kucult]')).toBe(true);
        expect(!!el.querySelector('[data-ac]')).toBe(false);
      }finally{ temizle(kok); }
    });

    it('gizlenen çizilir ama gösterilmez, panelde adıyla durur ve geri gelir; ekran başına', () => {
      let kok = kur('bugun');
      try{
        const b = G().bolumler(kok)[2];
        G().gizle(b.anahtar);
        expect(b.el.hidden).toBe(true);
        expect(document.body.contains(b.el)).toBe(true);        // veri silinmez, çizilir
        expect(G().gizliListe().map(x => x.baslik)).toEqual(['Sistem önerileri']);
        kok.remove();
        kok = kur('bugun');                                   // yeniden çizim: tercih kalır
        expect(G().bolumler(kok)[2].el.hidden).toBe(true);
        const baska = kur('plan');                            // başka ekran etkilenmez
        expect(G().bolumler(baska)[2].el.hidden).toBe(false);
        baska.remove();
        G().uygula({ kok, modul:MOD, profil:'p', ekran:'bugun' });
        G().goster(b.anahtar);
        expect(G().bolumler(kok)[2].el.hidden).toBe(false);
      }finally{ temizle(kok); }
    });

    it('küçültmek kalıcı: yalnız başlık ve «Aç» kalır; açınca geri gelir', () => {
      let kok = kur();
      try{
        const b = G().bolumler(kok)[0];
        G().kucult(b.anahtar, true);
        expect(b.el.classList.contains('gizle-kucuk')).toBe(true);
        expect(getComputedStyle(b.el.querySelector('.lrow__main')).display).toBe('none');
        expect(!!b.el.querySelector('[data-ac]')).toBe(true);
        kok.remove();
        kok = kur();
        const y = G().bolumler(kok)[0];
        expect(y.el.classList.contains('gizle-kucuk')).toBe(true);
        G().kucult(y.anahtar, false);
        expect(y.el.classList.contains('gizle-kucuk')).toBe(false);
      }finally{ temizle(kok); }
    });

    it('küçük şeride tıklamak açar; içindeki bağlantı ve aksiyonlar açmaz; düzen kipinde açmaz', () => {
      let kok = kur();
      try{
        const b = G().bolumler(kok)[0];
        G().kucult(b.anahtar, true);
        const tikla = el => el.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
        tikla(G().bolumler(kok)[0].el.querySelector('[data-act]'));
        expect(G().bolumler(kok)[0].el.classList.contains('gizle-kucuk')).toBe(true);
        G().duzenle(true);
        tikla(G().bolumler(kok)[0].el.querySelector('.lrow__label'));
        expect(G().bolumler(kok)[0].el.classList.contains('gizle-kucuk')).toBe(true);
        G().duzenle(false);
        tikla(G().bolumler(kok)[0].el.querySelector('.lrow__label'));
        expect(G().bolumler(kok)[0].el.classList.contains('gizle-kucuk')).toBe(false);
        expect(!!G().bolumler(kok)[0].el.querySelector('[data-ac]')).toBe(false);
      }finally{ G().duzenle(false); temizle(kok); }
    });

    it('küçük şeridin «Aç» düğmesi klavyeyle erişilir ve adıyla etiketlidir', () => {
      const kok = kur();
      try{
        const b = G().bolumler(kok)[0];
        G().kucult(b.anahtar, true);
        const d = G().bolumler(kok)[0].el.querySelector('[data-ac]');
        expect(d.tagName).toBe('BUTTON');
        expect(d.getAttribute('aria-label').includes('Günün akışı')).toBe(true);
      }finally{ temizle(kok); }
    });

    it('panel dar ekranda da ekranın içinde kalır; açılışta önizleme kendiliğinden açılmaz', () => {
      const kok = kur();
      const d = document.createElement('button');
      d.className = 'ust__gizli';
      d.style.cssText = 'position:fixed;left:4px;top:4px;width:30px;height:30px';
      document.body.appendChild(d);
      try{
        G().kucult(G().bolumler(kok)[0].anahtar, true);
        d.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
        const p = document.querySelector('.kmenu--gizle');
        expect(!!p).toBe(true);
        const r = p.getBoundingClientRect();
        expect(r.left >= 0).toBe(true);
        expect(r.right <= window.innerWidth).toBe(true);
        expect(G().onizlemeVar()).toBe(false);
        d.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
        expect(document.querySelector('.kmenu--gizle')).toBe(null);
      }finally{ d.remove(); temizle(kok); }
    });

    it('önizleme kartın kendisini gösterir ve salt bakmak içindir', () => {
      const kok = kur();
      try{
        const b = G().bolumler(kok)[0];
        G().kucult(b.anahtar, true);
        G().onizlemeAc(b.el, b.el);
        const p = document.querySelector('.gizle-onizleme');
        expect(!!p).toBe(true);
        expect(p.hasAttribute('inert')).toBe(true);
        expect(p.textContent.includes('İçerik')).toBe(true);
        expect(p.querySelector('.gizle-kucuk')).toBe(null);   // önizlemede açık hâli
        G().onizlemeKapat();
        expect(document.querySelector('.gizle-onizleme')).toBe(null);
      }finally{ temizle(kok); }
    });

    it('başlık balonları anahtara karışmaz; â/î/û korunur', () => {
      const kok = document.createElement('div');
      kok.innerHTML = '<section class="kutu"><header class="kutu__bas"><h2 class="kutu__ad">'
        + '<span class="terim" tabindex="0">Tekrar borcu<span class="terim__kart" role="tooltip">Tekrar borcu: vadesi gelen kartların oranı</span></span>'
        + '</h2></header><div class="kutu__govde">x</div></section>';
      document.body.appendChild(kok);
      try{
        expect(G().bolumler(kok)[0].anahtar).toBe('tekrar-borcu');
        expect(G().anahtar('Tezgâh')).toBe('tezgâh');
      }finally{ kok.remove(); }
    });

    it('varsayılan küçük bölüm açılırsa açık kalır; kullanıcı yine küçültebilir', () => {
      const a = G().anahtar('Günün akışı');
      let kok = sayfa(); G()._sifirla();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'rehber', kucukVarsayilan:[a] });
      try{
        expect(G().bolumler(kok)[0].el.classList.contains('gizle-kucuk')).toBe(true);
        G().kucult(a, false);
        kok.remove(); kok = sayfa();
        G().uygula({ kok, modul:MOD, profil:'p', ekran:'rehber', kucukVarsayilan:[a] });
        expect(G().bolumler(kok)[0].el.classList.contains('gizle-kucuk')).toBe(false);
        G().kucult(a, true);
        expect(G().bolumler(kok)[0].el.classList.contains('gizle-kucuk')).toBe(true);
      }finally{ temizle(kok); }
    });

    it('telefonda küçük bölüme basılı tutmak önizlemeyi açar; kısa dokunuş açmaz', async () => {
      const kok = kur();
      const bekle = ms => new Promise(r => setTimeout(r, ms));
      const bas = (el, tur) => el.dispatchEvent(new PointerEvent(tur, { bubbles:true, pointerType:'touch', clientX:5, clientY:5 }));
      try{
        const b = G().bolumler(kok)[0];
        G().kucult(b.anahtar, true);
        const el = G().bolumler(kok)[0].el.querySelector('.lrow__side');
        bas(el, 'pointerdown'); await bekle(100); bas(el, 'pointerup'); await bekle(500);
        expect(G().onizlemeVar()).toBe(false);                 // kısa dokunuş
        bas(el, 'pointerdown'); await bekle(600);
        expect(G().onizlemeVar()).toBe(true);                  // basılı tutma
        bas(el, 'pointerup');
        bas(document.body, 'pointerdown');
        expect(G().onizlemeVar()).toBe(false);                 // sonraki dokunuş kapatır
      }finally{ temizle(kok); }
    });

    /* ---------- Sayfa düzeni 2: sıra, üç konum, geri al, varsayılan ---------- */
    function ikiSutun(){
      const kok = document.createElement('div');
      const k = (ad) => '<section class="kutu"><header class="kutu__bas"><h2 class="kutu__ad">' + ad + '</h2></header><div class="kutu__govde">' + ad + ' gövde</div></section>';
      kok.innerHTML = '<div class="sol">' + k('Bir') + k('İki') + k('Üç') + '</div><div class="sag">' + k('Dört') + k('Beş') + '</div>';
      document.body.appendChild(kok);
      return kok;
    }
    const adlar = kok => G().bolumler(kok).map(b => b.baslik);

    it('sıra: bölüm yukarı/aşağı taşınır, yeniden çizimde kalır; başka sütuna geçmez', () => {
      let kok = ikiSutun(); G()._sifirla();
      const o = { kok, modul:MOD, profil:'p', ekran:'sira' };
      G().uygula(o);
      try{
        expect(G().tasi(G().anahtar('Üç'), -1)).toBe(true);
        expect(adlar(kok)).toEqual(['Bir', 'Üç', 'İki', 'Dört', 'Beş']);
        expect(G().tasi(G().anahtar('Bir'), -1)).toBe(false);      // en üstte
        expect(G().tasi(G().anahtar('Beş'), 1)).toBe(false);       // sütunun sonunda
        expect(G().tasi(G().anahtar('Dört'), -1)).toBe(false);     // öteki sütuna geçmez
        kok.remove(); kok = ikiSutun();                            // yeniden çizim
        G().uygula(Object.assign({}, o, { kok }));
        expect(adlar(kok)).toEqual(['Bir', 'Üç', 'İki', 'Dört', 'Beş']);
      }finally{ temizle(kok); }
    });

    it('sıra: ızgaradaki tek çocuklu sarmalayıcılarıyla birlikte taşınır (Span içindeki kart)', () => {
      const kok = document.createElement('div');
      const k = ad => '<div class="span"><section class="kutu"><header class="kutu__bas"><h2 class="kutu__ad">' + ad + '</h2></header></section></div>';
      kok.innerHTML = '<div class="grid">' + k('Bir') + k('İki') + k('Üç') + '</div>';
      document.body.appendChild(kok);
      G()._sifirla();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'span' });
      try{
        expect(G().tasi(G().anahtar('Üç'), -1)).toBe(true);
        expect(adlar(kok)).toEqual(['Bir', 'Üç', 'İki']);
        expect(kok.querySelector('.grid').children.length).toBe(3);        // sarmalayıcı kartla gitti
        expect(Array.from(kok.querySelectorAll('.grid > .span')).every(x => x.children.length === 1)).toBe(true);
      }finally{ temizle(kok); }
    });

    it('gizlenen bölüm GERÇEKTEN görünmez: kendi display kuralı olsa da; tek çocuklu sarmalayıcısı da', () => {
      /* Hata: AYS'de section.lrow «display:flex» taşıyor ve [hidden] onu
         yenemiyordu — bölüm gizli sayılıp ekranda kalıyordu. */
      const kok = document.createElement('div');
      kok.innerHTML = '<div class="grid"><div class="span"><section class="lrow" style="display:flex">'
        + '<div class="lrow__side"><div class="lrow__label">Esnek</div></div></section></div>'
        + '<section class="kutu" style="display:grid"><header class="kutu__bas"><h2 class="kutu__ad">Izgara</h2></header></section></div>';
      document.body.appendChild(kok);
      G()._sifirla();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'gorunur' });
      try{
        G().gizle(G().anahtar('Esnek'));
        G().gizle(G().anahtar('Izgara'));
        const [a, b] = G().bolumler(kok).map(x => x.el);
        expect(getComputedStyle(a).display).toBe('none');
        expect(getComputedStyle(b).display).toBe('none');
        expect(getComputedStyle(kok.querySelector('.span')).display).toBe('none');   // boş hücre kalmaz
        G().onizlemeAc(a, a);                                    // gizlinin önizlemesi dolu açılır
        const kopya = document.querySelector('.gizle-onizleme section.lrow');
        expect(getComputedStyle(kopya).display === 'none').toBe(false);
        G().onizlemeKapat();
        G().goster(G().anahtar('Esnek'));
        expect(getComputedStyle(a).display).toBe('flex');
        expect(getComputedStyle(kok.querySelector('.span')).display === 'none').toBe(false);
      }finally{ temizle(kok); }
    });

    it('sıra: sonradan gelen yeni bölüm kendi yerinde kalır', () => {
      let kok = ikiSutun(); G()._sifirla();
      const o = { kok, modul:MOD, profil:'p', ekran:'sira2' };
      G().uygula(o);
      try{
        G().tasi(G().anahtar('Üç'), -1); G().tasi(G().anahtar('Üç'), -1);
        expect(adlar(kok).slice(0, 3)).toEqual(['Üç', 'Bir', 'İki']);
        kok.remove(); kok = ikiSutun();
        const yeni = document.createElement('section');
        yeni.className = 'kutu';
        yeni.innerHTML = '<header class="kutu__bas"><h2 class="kutu__ad">Yeni</h2></header>';
        kok.querySelector('.sol').insertBefore(yeni, kok.querySelector('.sol').children[1]);   // Bir, Yeni, İki, Üç
        G().uygula(Object.assign({}, o, { kok }));
        expect(adlar(kok).slice(0, 4)).toEqual(['Üç', 'Yeni', 'Bir', 'İki']);
      }finally{ temizle(kok); }
    });

    it('üç konum: açık / küçük / gizli tek çağrıyla; panel her bölümü sayfa sırasıyla listeler', () => {
      const kok = ikiSutun(); G()._sifirla();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'hal' });
      const d = document.createElement('button');
      d.className = 'ust__gizli'; document.body.appendChild(d);
      try{
        G().durumAyarla(G().anahtar('İki'), 'kucuk');
        G().durumAyarla(G().anahtar('Dört'), 'gizli');
        expect(G().durumu(G().anahtar('İki'))).toBe('kucuk');
        expect(G().durumu(G().anahtar('Dört'))).toBe('gizli');
        expect(G().durumu(G().anahtar('Bir'))).toBe('acik');
        G().panelAc(d);
        const satirlar = Array.from(document.querySelectorAll('.kmenu--gizle [data-satir]'));
        expect(satirlar.map(s => s.getAttribute('data-hal'))).toEqual(['acik', 'kucuk', 'acik', 'gizli', 'acik']);
        const basili = satirlar[1].querySelector('[data-hal-sec][aria-pressed="true"]');
        expect(basili.getAttribute('data-hal-sec')).toBe('kucuk');
        satirlar[3].querySelector('[data-hal-sec="acik"]').click();
        expect(G().durumu(G().anahtar('Dört'))).toBe('acik');
        const yukari = document.querySelector('.kmenu--gizle [data-satir]').querySelector('[data-yukari]');
        expect(yukari.disabled).toBe(true);                         // en üstteki yukarı gidemez
      }finally{ G().panelKapat(); d.remove(); temizle(kok); }
    });

    it('geri al: gizlemeden sonra alttaki bildirimle önceki hâline döner', () => {
      const kok = ikiSutun(); G()._sifirla();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'geri' });
      try{
        const a = G().anahtar('Bir');
        kok.dispatchEvent(new MouseEvent('click', { bubbles:true }));      // olaylar bağlı olsun
        G().duzenle(true);
        kok.querySelector('[data-gizle="' + a + '"]').click();
        expect(G().durumu(a)).toBe('gizli');
        const t = document.querySelector('.gizle-geri');
        expect(!!t && t.textContent.includes('Bir')).toBe(true);
        t.querySelector('[data-geri-al]').click();
        expect(G().durumu(a)).toBe('acik');
        expect(document.querySelector('.gizle-geri')).toBe(null);
      }finally{ G().duzenle(false); temizle(kok); }
    });

    it('varsayılana dön: gizli, küçük ve sıra silinir; ekranın varsayılanları geri gelir', () => {
      const kok = ikiSutun(); G()._sifirla();
      const kv = [G().anahtar('Beş')];
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'sifir', kucukVarsayilan:kv });
      try{
        G().durumAyarla(G().anahtar('Bir'), 'gizli');
        G().durumAyarla(G().anahtar('Beş'), 'acik');
        G().tasi(G().anahtar('İki'), -1);
        G().varsayilanaDon();
        expect(G().durumu(G().anahtar('Bir'))).toBe('acik');
        expect(G().durumu(G().anahtar('Beş'))).toBe('kucuk');
        expect(adlar(kok).slice(0, 2)).toEqual(['Bir', 'İki']);
        document.querySelector('.gizle-geri [data-geri-al]').click();   // geri alınabilir
        expect(G().durumu(G().anahtar('Bir'))).toBe('gizli');
      }finally{ temizle(kok); }
    });

    it('varsayılan gizli bölüm geri getirilirse o seçim kalır', () => {
      let kok = kur('ofis', [G().anahtar('Sistem önerileri')]);
      try{
        const b = G().bolumler(kok)[2];
        expect(b.el.hidden).toBe(true);
        G().goster(b.anahtar);
        kok.remove();
        kok = kur('ofis', [G().anahtar('Sistem önerileri')]);
        expect(G().bolumler(kok)[2].el.hidden).toBe(false);
      }finally{ temizle(kok); }
    });
  });

  /* ---------- Sayfa düzeni 3: hazır görünüm, uyarı, sayfa notu, sayfada taşıma, tüm sayfalar, arama ---------- */
  describe('Sayfa düzeni — hazır görünüm, uyarı, tüm sayfalar', () => {
    function sayfa3(baslik, adlar, uyarili){
      const kok = document.createElement('div');
      kok.innerHTML = '<h1>' + baslik + '</h1><div class="liste">' + adlar.map(ad =>
        '<section class="kutu"><header class="kutu__bas"><h2 class="kutu__ad">' + ad + '</h2></header>'
        + '<div class="kutu__govde">' + (ad === uyarili ? '<span class="badge badge--danger">Kırmızı bayrak</span>' : 'gövde') + '</div></section>').join('') + '</div>';
      document.body.appendChild(kok);
      return kok;
    }
    const AD = ['Bir', 'İki', 'Üç', 'Dört'];
    function ust(){ const d = document.createElement('button'); d.className = 'ust__gizli';
      d.innerHTML = '<i class="ust__gizli-sayi"></i>'; document.body.appendChild(d); return d; }
    function bitir(kok, d){
      G().panelKapat(); if(d) d.remove(); temizle(kok);
      document.querySelectorAll('.gizle-geri').forEach(x => x.remove());
    }

    it('hazır görünüm: Başlıklar hepsini küçültür, Tümü açık hepsini açar, Önerilen varsayılana döner; hangisinde olduğu bilinir', () => {
      const kok = sayfa3('Hazır', AD); G()._sifirla();
      const kv = [G().anahtar('Dört')];
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'hazir', kucukVarsayilan:kv });
      try{
        expect(G().hazirHali()).toBe('onerilen');
        G().durumAyarla(G().anahtar('Bir'), 'gizli');
        expect(G().hazirHali()).toBe('ozel');
        G().hazir('basliklar');
        expect(AD.map(a => G().durumu(G().anahtar(a)))).toEqual(['gizli', 'kucuk', 'kucuk', 'kucuk']);   // gizli gizli kalır
        expect(G().hazirHali()).toBe('basliklar');
        expect(!!document.querySelector('.gizle-geri [data-geri-al]')).toBe(true);
        G().hazir('acik');
        expect(AD.map(a => G().durumu(G().anahtar(a)))).toEqual(['acik', 'acik', 'acik', 'acik']);
        expect(G().hazirHali()).toBe('acik');
        G().hazir('onerilen');
        expect(G().durumu(G().anahtar('Dört'))).toBe('kucuk');
        expect(G().hazirHali()).toBe('onerilen');
      }finally{ bitir(kok); }
    });

    it('uyarı susturulmaz: küçük şeritte «uyarı» rozeti; gizliyse üst düğme ve sayfa notu uyarır; anahtar değişmez', () => {
      const kok = sayfa3('Uyarı', AD, 'İki'); G()._sifirla();
      const d = ust();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'uyari' });
      try{
        const a = G().anahtar('İki');
        G().durumAyarla(a, 'kucuk');
        const el = () => G().bolumler(kok).find(b => b.anahtar === a);
        expect(!!el()).toBe(true);                                        // anahtar rozetten etkilenmez
        expect(!!el().el.querySelector('.gizle-uyari-rozet')).toBe(true);
        G().durumAyarla(a, 'gizli');
        expect(d.classList.contains('is-uyari')).toBe(true);
        const dip = kok.querySelector('.gizle-dip');
        expect(!!dip && dip.classList.contains('gizle-dip--uyari')).toBe(true);
        expect(dip.textContent.includes('uyarı')).toBe(true);
        G().panelAc(d);
        const satir = document.querySelector('.kmenu--gizle [data-satir="' + a + '"]');
        expect(satir.hasAttribute('data-uyari')).toBe(true);
        G().panelKapat();
        G().durumAyarla(a, 'acik');
        expect(d.classList.contains('is-uyari')).toBe(false);
        expect(!!el().el.querySelector('.gizle-uyari-rozet')).toBe(false);   // açıkken rozet yok
      }finally{ bitir(kok, d); }
    });

    it('sayfa notu: gizli bölüm yoksa yok; varsa adıyla sayfanın sonunda; «Göster» paneli açar', () => {
      const kok = sayfa3('Not', AD); G()._sifirla();
      const d = ust();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'not' });
      try{
        expect(kok.querySelector('.gizle-dip')).toBe(null);
        G().durumAyarla(G().anahtar('Üç'), 'gizli');
        const dip = kok.querySelector('.gizle-dip');
        expect(dip.textContent.includes('Üç')).toBe(true);
        expect(kok.lastElementChild).toBe(dip);
        dip.querySelector('[data-gizle-dip]').click();
        expect(!!document.querySelector('.kmenu--gizle')).toBe(true);
        G().durumAyarla(G().anahtar('Bir'), 'gizli');
        expect(kok.querySelector('.gizle-dip').textContent.includes('2 bölüm')).toBe(true);
      }finally{ bitir(kok, d); }
    });

    it('sayfada bırakma: bölüm başka bir bölümün önüne/arkasına konur; başka kaba geçmez', () => {
      const kok = sayfa3('Taşı', AD); G()._sifirla();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'birak' });
      const adlar = () => G().bolumler(kok).map(b => b.baslik);
      try{
        expect(G().birak(G().anahtar('Dört'), G().anahtar('Bir'), true)).toBe(true);
        expect(adlar()).toEqual(['Dört', 'Bir', 'İki', 'Üç']);
        expect(G().birak(G().anahtar('Dört'), G().anahtar('Üç'), false)).toBe(true);
        expect(adlar()).toEqual(['Bir', 'İki', 'Üç', 'Dört']);
        const yabanci = document.createElement('section');
        yabanci.className = 'kutu'; yabanci.innerHTML = '<header class="kutu__bas"><h2 class="kutu__ad">Dışarıda</h2></header>';
        kok.appendChild(yabanci);
        G().uygula({ kok, modul:MOD, profil:'p', ekran:'birak' });
        expect(G().birak(G().anahtar('Bir'), G().anahtar('Dışarıda'), true)).toBe(false);
      }finally{ bitir(kok); }
    });

    it('tüm sayfalar: değişen sayfalar adıyla listelenir; biri ya da hepsi sıfırlanır ve geri alınır', () => {
      const kok1 = sayfa3('Birinci sayfa', AD); G()._sifirla();
      G().uygula({ kok:kok1, modul:MOD, profil:'p', ekran:'s1' });
      G().durumAyarla(G().anahtar('Bir'), 'gizli');
      kok1.remove();
      const kok = sayfa3('İkinci sayfa', AD);
      const d = ust();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'s2' });
      G().durumAyarla(G().anahtar('İki'), 'kucuk');
      try{
        const l = G().sayfalar();
        expect(l.map(x => x.ad).sort()).toEqual(['Birinci sayfa', 'İkinci sayfa']);
        expect(l.find(x => x.ekran === 's2').bu).toBe(true);
        G().panelAc(d);
        document.querySelector('.kmenu--gizle [data-sekme="hepsi"]').click();
        expect(document.querySelectorAll('.kmenu--gizle [data-sayfa]').length).toBe(2);
        document.querySelector('.kmenu--gizle [data-sayfa-sifirla="s1"]').click();
        expect(G().sayfalar().map(x => x.ekran)).toEqual(['s2']);
        document.querySelector('.gizle-geri [data-geri-al]').click();
        expect(G().sayfalar().length).toBe(2);
        G().hepsiniSifirla();
        expect(G().sayfalar().length).toBe(0);
        expect(G().durumu(G().anahtar('İki'))).toBe('acik');              // açık sayfa da yenilendi
        document.querySelector('.gizle-geri [data-geri-al]').click();
        expect(G().sayfalar().length).toBe(2);
        expect(G().durumu(G().anahtar('İki'))).toBe('kucuk');
      }finally{ bitir(kok, d); }
    });

    it('kayıt yalnız varsayılandan sapmayı tutar: küçültmek «açıldı» sayılmaz', () => {
      const kok = sayfa3('Sapma', AD); G()._sifirla();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'sapma', varsayilan:[G().anahtar('Dört')] });
      try{
        G().durumAyarla(G().anahtar('Bir'), 'kucuk');
        G().durumAyarla(G().anahtar('İki'), 'gizli');
        G().durumAyarla(G().anahtar('İki'), 'acik');
        let x = G().sayfalar().find(y => y.ekran === 'sapma');
        expect([x.kucuk, x.gizli, x.acildi]).toEqual([1, 0, 0]);
        G().durumAyarla(G().anahtar('Dört'), 'acik');                   // varsayılan gizliyi açmak sapmadır
        x = G().sayfalar().find(y => y.ekran === 'sapma');
        expect(x.acildi).toBe(1);
      }finally{ bitir(kok); }
    });

    it('alanlar arası taşıma: kart aynı türdeki komşu alana geçer (sürükle ve ↑/↓), yeniden çizimde orada kalır', () => {
      const alan = (ad, kartlar) => '<section class="bugun__alan" aria-label="' + ad + '">' + kartlar.map(k =>
        '<section class="kutu"><header class="kutu__bas"><h2 class="kutu__ad">' + k + '</h2></header></section>').join('') + '</section>';
      const ciz = () => { const k = document.createElement('div');
        k.innerHTML = '<div class="bugun"><div class="bugun__sol">' + alan('Şimdi', ['Ölçüm', 'Öğün'])
          + '</div><div class="bugun__sag">' + alan('Durum', ['Toparlanma', 'Beslenme'])
          + '</div><div class="form">' + '<div class="bugun__alan"><p>form</p></div>' + '</div></div>';
        document.body.appendChild(k); return k; };
      let kok = ciz(); G()._sifirla();
      const o = { kok, modul:MOD, profil:'p', ekran:'alan' };
      G().uygula(o);
      const alanOf = ad => G().bolumler(kok).find(b => b.baslik === ad).el.closest('.bugun__alan').getAttribute('aria-label');
      try{
        expect(G().birak(G().anahtar('Toparlanma'), G().anahtar('Ölçüm'), true)).toBe(true);      // Durum -> Şimdi
        expect(alanOf('Toparlanma')).toBe('Şimdi');
        expect(G().bolumler(kok).map(b => b.baslik)).toEqual(['Toparlanma', 'Ölçüm', 'Öğün', 'Beslenme']);
        kok.remove(); kok = ciz(); G().uygula(Object.assign({}, o, { kok }));                   // yeniden çizim
        expect(alanOf('Toparlanma')).toBe('Şimdi');
        expect(G().bolumler(kok).map(b => b.baslik)).toEqual(['Toparlanma', 'Ölçüm', 'Öğün', 'Beslenme']);
        expect(G().tasi(G().anahtar('Öğün'), 1)).toBe(true);                                     // alanın sonunda ↓: komşu alana
        expect(alanOf('Öğün')).toBe('Durum');
        expect(G().bolumler(kok).map(b => b.baslik)).toEqual(['Toparlanma', 'Ölçüm', 'Öğün', 'Beslenme']);
        expect(G().tasi(G().anahtar('Beslenme'), 1)).toBe(false);                                // son alanın sonu (bölümsüz alan sayılmaz)
        expect(G().sayfalar().find(x => x.ekran === 'alan').sira).toBe(true);
        G().varsayilanaDon();                                                                    // yerine döner
        expect(alanOf('Toparlanma')).toBe('Durum');
        expect(alanOf('Öğün')).toBe('Şimdi');
      }finally{ bitir(kok); }
    });

    it('sürükleme sırası, arada bölüm olmayan bir kap (ikili kart sarmalayıcısı) olsa da yeniden çizimde aynen kalır', () => {
      const k1 = ad => '<section class="kutu"><header class="kutu__bas"><h2 class="kutu__ad">' + ad + '</h2></header></section>';
      const ciz = () => { const k = document.createElement('div');
        k.innerHTML = '<section class="alan">' + k1('Ölçüm') + '<div class="cift">' + k1('His') + k1('Su') + '</div>' + k1('Öğün') + '</section>';
        document.body.appendChild(k); return k; };
      let kok = ciz(); G()._sifirla();
      const o = { kok, modul:MOD, profil:'p', ekran:'blok' };
      G().uygula(o);
      const adlar = () => G().bolumler(kok).map(b => b.baslik);
      try{
        /* Kullanıcı Öğün'ü ikilinin ÖNÜNE sürükledi: DOM sırası Ölçüm, Öğün, [His, Su]. */
        const alan = kok.querySelector('.alan');
        alan.insertBefore(G().bolumler(kok).find(b => b.baslik === 'Öğün').el, alan.querySelector('.cift'));
        G().sayfadaBirakildi(G().anahtar('Öğün'));
        expect(adlar()).toEqual(['Ölçüm', 'Öğün', 'His', 'Su']);
        kok.remove(); kok = ciz(); G().uygula(Object.assign({}, o, { kok }));
        expect(adlar()).toEqual(['Ölçüm', 'Öğün', 'His', 'Su']);
      }finally{ bitir(kok); }
    });

    it('arama: uzun sayfada panel bölüm adına göre süzülür', () => {
      const adlar = ['Uyku', 'Beslenme', 'Hareket', 'Toparlanma', 'Tahlil', 'Bütçe', 'Sepet', 'Ofis', 'Rehber'];
      const kok = sayfa3('Arama', adlar); G()._sifirla();
      const d = ust();
      G().uygula({ kok, modul:MOD, profil:'p', ekran:'ara' });
      try{
        G().panelAc(d);
        const ara = document.querySelector('.kmenu--gizle .gd-ara');
        expect(!!ara).toBe(true);
        ara.value = 'BES';
        ara.dispatchEvent(new Event('input', { bubbles:true }));
        const gorunen = Array.from(document.querySelectorAll('.kmenu--gizle [data-satir]')).filter(x => !x.hidden);
        expect(gorunen.map(x => x.querySelector('.gd-ad').textContent)).toEqual(['Beslenme']);
      }finally{ bitir(kok, d); }
    });
  });
})();
