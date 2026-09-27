/* Gizlenen ve küçültülen bölümler (brand/ortak/gizle.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/gizle.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: gizlenen bölüm çizilir ama gösterilmez ve panelde
   adıyla durur; geri gelir; küçültmek kalıcıdır ve yalnız başlık kalır;
   önizleme salt bakmak içindir (inert); normal görünümde düğme yoktur;
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

    it('normal görünümde düğme yok; düzen kipinde her bölümde Küçült ve Gizle', () => {
      const kok = kur();
      try{
        expect(kok.querySelectorAll('.gizle-dugme').length).toBe(0);
        G().duzenle(true);
        expect(kok.querySelectorAll('[data-gizle]').length).toBe(3);
        expect(kok.querySelectorAll('[data-kucult]').length).toBe(3);
        G().duzenle(false);
        expect(kok.querySelectorAll('.gizle-dugme').length).toBe(0);
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
})();
