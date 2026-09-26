/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/gizle.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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
