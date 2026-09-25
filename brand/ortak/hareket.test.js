/* Hareket — T4 (ekip/EKIP-PLANI.md §4.2).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hareket.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler (katalog numarasıyla): ekranda yalnız bir öğe nabız
   atar (12); yeniden çizimde yalnız DEĞİŞEN sayı yuvarlanır, aynı sayı ve
   yeni ekran yuvarlanmaz (149); tik yalnız 0'dan 1'e dönen işte çizilir
   (152); kaybolan satır yerinde, dokunulamaz bir kopya olarak kapanır,
   süzgeç gibi toplu kayıpta hayalet çizilmez (158); küçülen başlık sayfa
   başlığını taşır (154); geçiş desteklenmiyorsa ya da hareket azaltılmışsa
   iş doğrudan yapılır (153); önizleme metni kaçışlanır (159); odak kapısı
   Esc'te işin kendi çıkış düğmesine basar, açık katman varken basmaz (14);
   azaltılmış harekette hiçbir sınıf konmaz. Bileşenler kancaları taşır. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const H = window.LIFEOS.HAREKET;

  function kok(icerik){
    const d = document.createElement('div');
    d.innerHTML = icerik;
    document.body.appendChild(d);
    return d;
  }

  describe('Hareket (T4)', () => {
    it('oz-012 tek canlı öğe: yalnız ilki nabız atar', () => {
      const d = kok('<div class="h-canli">a</div><div class="h-canli">b</div><div class="h-canli" hidden>c</div>');
      try{
        const ilk = H.tekCanli(d);
        const c = d.querySelectorAll('.h-canli');
        expect(ilk).toBe(c[0]);
        expect(c[0].classList.contains('h-sakin')).toBe(false);
        expect(c[1].classList.contains('h-sakin')).toBe(true);
      }finally{ d.remove(); }
    });

    it('oz-149 yalnız değişen sayı yuvarlanır; yeni ekranda hiçbiri', () => {
      const d = kok('<b data-h-sayi="a">3</b><b data-h-sayi="b">7</b>');
      try{
        H.sonra(d, 'x', { az:false });
        H.once(d);
        d.innerHTML = '<b data-h-sayi="a">4</b><b data-h-sayi="b">7</b>';
        const r = H.sonra(d, 'x', { az:false });
        expect(r.yuvarla).toBe(1);
        expect(d.querySelector('[data-h-sayi="a"]').classList.contains('h-yuvarla')).toBe(true);
        expect(d.querySelector('[data-h-sayi="b"]').classList.contains('h-yuvarla')).toBe(false);

        /* Yönlendirmede çağıranın rotası çizimden önce değişir; «yeni
           ekran» çizili olan rotaya göre bilinir, çağıranınkine göre değil. */
        H.once(d);
        d.innerHTML = '<b data-h-sayi="a">9</b><main id="main" class="content"></main>';
        expect(H.sonra(d, 'y', { az:false }).yuvarla).toBe(0);
        expect(d.querySelector('#main').classList.contains('h-yeni')).toBe(true);
      }finally{ d.remove(); }
    });

    it('oz-152 tik yalnız yeni biten işte çizilir', () => {
      const d = kok('<p data-h="k1" data-h-bitti="0">a</p><p data-h="k2" data-h-bitti="1">b</p>');
      try{
        H.sonra(d, 'x', { az:false });
        H.once(d);
        d.innerHTML = '<p data-h="k1" data-h-bitti="1">a</p><p data-h="k2" data-h-bitti="1">b</p>';
        expect(H.sonra(d, 'x', { az:false }).tik).toBe(1);
        expect(d.querySelector('[data-h="k1"]').classList.contains('h-tik')).toBe(true);
        expect(d.querySelector('[data-h="k2"]').classList.contains('h-tik')).toBe(false);
      }finally{ d.remove(); }
    });

    it('oz-158 kaybolan satır yerinde kapanır; kopya dokunulamaz ve kimlik taşımaz', () => {
      const satir = k => '<div data-h-satir="' + k + '"><button id="b-' + k + '" data-act="sil">' + k + '</button></div>';
      const d = kok('<div class="liste">' + satir('a') + satir('b') + satir('c') + '</div>');
      try{
        H.sonra(d, 'x', { az:false });
        H.once(d);
        d.querySelector('.liste').innerHTML = satir('a') + satir('c');
        expect(H.sonra(d, 'x', { az:false }).kapanan).toBe(1);
        const h = d.querySelector('.h-kapanan');
        expect(!!h).toBe(true);
        expect(h.nextElementSibling.getAttribute('data-h-satir')).toBe('c');
        expect(h.getAttribute('aria-hidden')).toBe('true');
        expect(h.hasAttribute('inert')).toBe(true);
        expect(h.querySelectorAll('[id], [data-act], [data-h-satir]').length).toBe(0);
        expect(h.textContent).toContain('b');
      }finally{ d.remove(); }
    });

    it('oz-158 toplu kayıp (süzgeç) hayalet çizmez', () => {
      const satir = k => '<div data-h-satir="' + k + '">' + k + '</div>';
      const d = kok(['a', 'b', 'c', 'd', 'e', 'f'].map(satir).join(''));
      try{
        H.sonra(d, 'x', { az:false });
        H.once(d);
        d.innerHTML = satir('a') + satir('f');
        expect(H.sonra(d, 'x', { az:false }).kapanan).toBe(0);
        expect(d.querySelectorAll('.h-kapanan').length).toBe(0);
      }finally{ d.remove(); }
    });

    it('azaltılmış harekette sınıf konmaz', () => {
      const d = kok('<b data-h-sayi="a">3</b><p data-h="k" data-h-bitti="0">x</p><main id="main" class="content"></main>');
      try{
        H.sonra(d, 'x', { az:true });
        H.once(d);
        d.innerHTML = '<b data-h-sayi="a">4</b><p data-h="k" data-h-bitti="1">x</p><main id="main" class="content"></main>';
        const r = H.sonra(d, 'x', { az:true });
        expect(r.yuvarla + r.tik + r.kapanan).toBe(0);
        expect(d.querySelectorAll('.h-yuvarla, .h-tik, .h-yeni').length).toBe(0);
      }finally{ d.remove(); }
    });

    it('oz-154 üst çubuktaki küçük başlık sayfa başlığını taşır', () => {
      const d = kok('<header class="ust"><span class="ust__baslik" aria-hidden="true"></span></header>'
        + '<h1 class="sayfabasi__baslik"> Plan › Hafta </h1>');
      try{
        H.baslikKopyala(d);
        expect(d.querySelector('.ust__baslik').textContent).toBe('Plan › Hafta');
        expect(d.querySelector('.ust__baslik').getAttribute('aria-hidden')).toBe('true');
      }finally{ d.remove(); }
    });

    it('oz-153 geçiş yoksa ya da hareket azaltılmışsa iş doğrudan yapılır', async () => {
      let n = 0;
      const sonuc = H.gecis(() => { n++; return 'tamam'; }, { az:true });
      expect(n).toBe(1);
      expect(sonuc).toBe('tamam');
    });

    it('oz-159 önizleme ekran adını ve cümlesini kaçışlayarak verir', () => {
      const ic = H.onizleIcerik('x', r => ({ baslik:'<Plan>', cumle:'3 blok & 1 deneme' }));
      expect(ic).toContain('&lt;Plan&gt;');
      expect(ic).toContain('3 blok &amp; 1 deneme');
      expect(H.onizleIcerik('yok', () => null)).toBe('');
      expect(H.onizleIcerik('x', () => { throw new Error('bozuk'); })).toBe('');
    });

    it('oz-156 odak halkası klavyeyle gelen odağın yerine kayar; fareyle gelen odakta çizilmez', () => {
      const d = kok('<button id="hh1" style="position:absolute;left:10px;top:10px;width:80px;height:30px">A</button>');
      try{
        const b = d.querySelector('#hh1');
        const az = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        b.focus({ focusVisible:true });
        let gorunur = true;
        try{ gorunur = b.matches(':focus-visible'); }catch(e){}
        H.halka(b);
        const h = document.querySelector('.h-halka');
        if(!az && gorunur){
          expect(!!h).toBe(true);
          expect(h.style.width).toBe((b.getBoundingClientRect().width + 6) + 'px');
          expect(h.getAttribute('aria-hidden')).toBe('true');
        }else{
          expect(!h || !h.classList.contains('is-acik')).toBe(true);
        }
      } finally { d.remove(); const h = document.querySelector('.h-halka'); if(h) h.remove(); }
    });

    it('oz-014 odak kapısı: Esc işin çıkış düğmesine basar; açık katman varken basmaz', () => {
      let basildi = 0;
      const d = kok('<div data-h-odak><button data-h-odak-cik="1">Oturumu bitir</button></div>');
      d.querySelector('button').addEventListener('click', () => basildi++);
      let kat = document.getElementById('overlay-root'), kurdum = false;
      if(!kat){ kat = document.createElement('div'); kat.id = 'overlay-root'; document.body.appendChild(kat); kurdum = true; }
      const eski = Array.from(kat.children);
      eski.forEach(e => e.remove());
      try{
        expect(H.odakCik()).toBe(true);
        expect(basildi).toBe(1);
        const katman = document.createElement('div'); kat.appendChild(katman);
        expect(H.odakCik()).toBe(false);
        expect(basildi).toBe(1);
        katman.remove();
      }finally{
        d.remove();
        eski.forEach(e => kat.appendChild(e));
        if(kurdum) kat.remove();
      }
    });

    it('bileşenler kancaları taşır: sıradaki iş canlı, sakin değil; sayı ve tik anahtarlı', () => {
      const C = NS.C;
      const k = kok(String(C.NextUp({ icon:'check', label:'Sıradaki', title:'Matematik' }))
        + String(C.NextUp({ icon:'check', calm:true, label:'Sıradaki', title:'Bitti' }))
        + String(C.Stat({ label:'Bugün', value:'42' }))
        + String(C.Checkbox({ label:'Su içtim', act:'x', checked:true })));
      try{
        const n = k.querySelectorAll('.nextup');
        expect(n[0].classList.contains('h-canli')).toBe(true);
        expect(n[1].classList.contains('h-canli')).toBe(false);
        expect(k.querySelector('.stat__value').getAttribute('data-h-sayi')).toBe('stat:Bugün');
        const c = k.querySelector('.check');
        expect(c.getAttribute('data-h-bitti')).toBe('1');
        expect(!!c.getAttribute('data-h')).toBe(true);
      }finally{ k.remove(); }
    });
  });

  /* V5 raf düzeni (kullanıcı, 2026-09-25: «kaos içinde bir düzeni yok»):
     iki eşit sütun, eşi olmayan kutu bütün eni kaplar, uzun kutu iç
     kaydırma yerine kesilir ve «Tamamını göster» alır. Ölçü uygulamanın
     kendi CSS'iyle, 1300 px'lik gerçek bir kapta alınır. */
  describe('Raf düzeni (V5)', () => {
    const kutu = (ad, boy, ic) => '<section class="lrow"><div class="lrow__side"><div class="lrow__label">'
      + ad + '</div></div><div class="lrow__main">' + (ic || '')
      + '<div style="height:' + boy + 'px">' + ad + '</div></div></section>';
    function raf(icerik){
      const d = document.createElement('div');
      d.className = 'site site--v5';
      d.style.cssText = 'position:absolute;left:-10000px;top:0;width:1300px';
      d.innerHTML = '<div class="ledger">' + icerik + '</div>';
      document.body.appendChild(d);
      H.raf(d);
      return d;
    }
    const bul = (d, ad) => Array.from(d.querySelectorAll('.lrow'))
      .find(k => k.querySelector('.lrow__label').textContent === ad);

    it('kesme kararı: tek kutu 1000 px\'i aşınca 560\'ta, çiftte uzun olan kısanın boyunda kesilir', () => {
      expect(H.kesimler(900, null)).toBe(null);
      expect(H.kesimler(1200, null)).toBe(560);
      /* çift: 970'e 560 → uzun olan 560'ta; kısa olana dokunulmaz */
      expect(H.kesimler(970, 560)).toBe(560);
      expect(H.kesimler(560, 970)).toBe(null);
      /* kısa kutunun boyunda kesilir (düğme payı düşülerek) */
      expect(H.kesimler(1500, 800)).toBe(744);
      /* kazanç 200 px'ten azsa kesilmez: boşuna tık yok */
      expect(H.kesimler(700, 600)).toBe(null);
      /* ikisi de uzunsa ikisi de 560'ta */
      expect(H.kesimler(1400, 1100)).toBe(560);
      expect(H.kesimler(1100, 1400)).toBe(560);
    });

    it('eşi olmayan yarım kutu bütün eni kaplar; rafta delik kalmaz', () => {
      const d = raf(kutu('A', 100) + kutu('B', 100) + kutu('C', 100)
        + '<section class="lrow lrow--wide"><div class="lrow__side"><div class="lrow__label">G</div></div><div class="lrow__main">g</div></section>'
        + kutu('D', 100) + '<section class="lrow lrow--wide"><div class="lrow__side"><div class="lrow__label">H</div></div><div class="lrow__main">h</div></section>');
      try{
        expect(bul(d, 'A').classList.contains('raf-tek')).toBe(false);
        expect(bul(d, 'B').classList.contains('raf-tek')).toBe(false);
        expect(bul(d, 'C').classList.contains('raf-tek')).toBe(true);
        expect(bul(d, 'D').classList.contains('raf-tek')).toBe(true);
        const a = bul(d, 'A').getBoundingClientRect(), b = bul(d, 'B').getBoundingClientRect();
        expect(Math.abs(a.top - b.top) < 1).toBe(true);
        expect(Math.abs(a.width - b.width) < 1).toBe(true);
        expect(bul(d, 'C').getBoundingClientRect().width > a.width * 1.8).toBe(true);
      }finally{ d.remove(); }
    });

    it('uzun kutu iç kaydırmaz: kesilir, «Tamamını göster» açar, açık kalır', () => {
      const d = raf(kutu('Uzun', 1500));
      try{
        const k = bul(d, 'Uzun');
        expect(k.classList.contains('raf-uzun')).toBe(true);
        const main = k.querySelector('.lrow__main');
        expect(getComputedStyle(main).overflowY).toBe('visible');
        expect(k.getBoundingClientRect().height < 700).toBe(true);
        const b = k.querySelector(':scope > .raf-ac');
        expect(b.textContent).toBe('Tamamını göster');
        expect(b.getAttribute('aria-expanded')).toBe('false');
        b.click();
        expect(k.classList.contains('raf-acik')).toBe(true);
        expect(b.getAttribute('aria-expanded')).toBe('true');
        expect(b.textContent).toBe('Kısalt');
        expect(k.getBoundingClientRect().height > 1500).toBe(true);
        /* yeniden çizim açık kutuyu kapatmaz */
        H.raf(d);
        expect(k.classList.contains('raf-acik')).toBe(true);
        expect(k.querySelectorAll(':scope > .raf-ac')).toHaveLength(1);
        k.querySelector(':scope > .raf-ac').click();
      }finally{ d.remove(); }
    });

    it('çiftte uzun kutu kısanın boyunda biter; kısa kutu kesilmez', () => {
      const d = raf(kutu('Kısa', 700) + kutu('Uzun çift', 1600));
      try{
        const kisa = bul(d, 'Kısa'), uzun = bul(d, 'Uzun çift');
        expect(kisa.classList.contains('raf-uzun')).toBe(false);
        expect(uzun.classList.contains('raf-uzun')).toBe(true);
        const fark = Math.abs(kisa.getBoundingClientRect().height - uzun.getBoundingClientRect().height);
        expect(fark < 2).toBe(true);
      }finally{ d.remove(); }
    });

    it('kart ızgarası ve form kesilmez; kutu adıyla aynı bölüm başlığı gözden gizlenir', () => {
      const d = raf(kutu('Uzman masaları', 1500,
        '<div class="section-title"><h2>Uzman masaları</h2></div><div class="desks"></div>')
        + kutu('Form', 1500, '<form></form>'));
      try{
        expect(bul(d, 'Uzman masaları').classList.contains('raf-uzun')).toBe(false);
        expect(bul(d, 'Form').classList.contains('raf-uzun')).toBe(false);
        const h = bul(d, 'Uzman masaları').querySelector('.section-title h2');
        expect(h.classList.contains('sr-only')).toBe(true);
      }finally{ d.remove(); }
    });
  });
})();
