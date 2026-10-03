/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/animasyon.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Animasyonlar ayarı — Tam · Az · Sistem.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/animasyon.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: üç kip `prefers-reduced-motion` geçen her medya
   kuralının metnini doğru değiştirir (Tam: hiç tutmaz, Az: koşul düşer,
   Sistem: özgün metin geri gelir) ve bu, hesaplanan biçime yansır; JS'teki
   `matchMedia` aynı kipi söyler; denetim araçlarının tarayıcısında
   (webdriver) varsayılan Sistem'dir, kullanıcınınkinde Tam; modüller
   arası geçişte yalnız izinli tercihler taşınır. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const A = window.LIFEOS.ANIMASYON;

  /* Sınanan kip bütün sayfaya uygulanır; her testten sonra eski hâl döner. */
  function kipleSina(fn){
    let eski = null;
    try{ eski = localStorage.getItem(A.ANAHTAR); }catch(e){}
    try{ fn(); }
    finally{
      try{ if(eski == null) localStorage.removeItem(A.ANAHTAR); else localStorage.setItem(A.ANAHTAR, eski); }catch(e){}
      A.yenile();
    }
  }

  function sayfaEkle(css){
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    return st;
  }

  describe('Animasyonlar (Tam · Az · Sistem)', () => {
    it('dönüştürücü: Tam koşulu hiç tutturmaz, Az koşulu düşer', () => {
      const D = A.donustur;
      expect(D('(prefers-reduced-motion: reduce)', false)).toBe('not all');
      expect(D('(prefers-reduced-motion: reduce)', true)).toBe('all');
      expect(D('(prefers-reduced-motion:reduce)', true)).toBe('all');
      /* Kalan koşul kalır: azaltılmış kipte yalnız geniş ekran kuralı. */
      expect(D('(prefers-reduced-motion: reduce) and (min-width: 680px)', false)).toBe('not all');
      expect(D('(prefers-reduced-motion: reduce) and (min-width: 680px)', true)).toBe('(min-width: 680px)');
      /* Ters sorgu tersine döner. */
      expect(D('(prefers-reduced-motion: no-preference)', false)).toBe('all');
      expect(D('(prefers-reduced-motion: no-preference)', true)).toBe('not all');
      /* Liste: öteki sorgular olduğu gibi kalır. */
      expect(D('print, (prefers-reduced-motion: reduce)', false)).toBe('print');
      expect(D('print, (prefers-reduced-motion: reduce)', true)).toBe('all');
      /* Değillenmiş sorgu. */
      expect(D('not all and (prefers-reduced-motion: reduce)', false)).toBe('all');
      expect(D('not all and (prefers-reduced-motion: reduce)', true)).toBe('not all');
      /* Hareketle ilgisiz metne dokunulmaz. */
      expect(D('(max-width: 679px)', true)).toBe('(max-width: 679px)');
    });

    it('üç kip medya kuralının metnini değiştirir; Sistem özgün metni geri getirir', () => {
      const st = sayfaEkle('@media (prefers-reduced-motion: reduce){ #ani-x{ width:7px; } }'
        + '@media (prefers-reduced-motion: reduce) and (min-width: 1px){ #ani-x{ height:5px; } }'
        + '@media (prefers-reduced-motion: no-preference){ #ani-x{ width:9px; } }'
        + '@media (max-width: 99999px){ #ani-x{ left:1px; } }');
      const x = document.createElement('div');
      x.id = 'ani-x';
      document.body.appendChild(x);
      try{
        const k = Array.from(st.sheet.cssRules);
        const metin = () => k.map(r => r.media.mediaText);
        const orj = metin();

        A.uygula('tam', [st.sheet]);
        expect(metin()).toEqual(['not all', 'not all', 'all', orj[3]]);
        expect(getComputedStyle(x).width).toBe('9px');

        A.uygula('az', [st.sheet]);
        expect(metin()).toEqual(['all', '(min-width: 1px)', 'not all', orj[3]]);
        expect(getComputedStyle(x).width).toBe('7px');
        expect(getComputedStyle(x).height).toBe('5px');

        /* Kipten kipe geçiş özgün metinden hesaplanır, öncekinden değil. */
        A.uygula('tam', [st.sheet]);
        expect(metin()).toEqual(['not all', 'not all', 'all', orj[3]]);

        A.uygula('sistem', [st.sheet]);
        expect(metin()).toEqual(orj);
      }finally{ x.remove(); st.remove(); }
    });

    it('webdriver (denetim araçları) varsayılanı Sistem; kullanıcının tarayıcısında Tam', () => {
      expect(A.varsayilan(true)).toBe('sistem');
      expect(A.varsayilan(false)).toBe('tam');
      /* Bu sayfa Playwright'ta açılır: ayar yokken kip Sistem'dir ve
         ölçümler tarayıcının bildirdiği tercihle alınır. */
      if(navigator.webdriver){
        kipleSina(() => {
          try{ localStorage.removeItem(A.ANAHTAR); }catch(e){}
          A.yenile();
          expect(A.kip()).toBe('sistem');
        });
      }
    });

    /* base.css'in azaltılmış kipi geçiş süresini HER elemanda .001ms yapar.
       transition-property başlangıçta `all` olduğu için geçiş tanımlamayan
       eleman da «bütün özellikleri geçişli» sayılıyordu: her stil hesabında
       tarayıcı yüzlerce özelliği karşılaştırır. SPİ Tahliller'de 1039 eleman,
       tek tam hesap 73 ms (azaltma yokken 32), beş yıllık veriyle yük
       denetimi kırmızı (2026-10-03). Geçiş tanımlayan eleman etkilenmez. */
    it('Az kipinde geçiş tanımlamayan eleman geçişli sayılmaz; tanımlayanın geçişi kalır', () => {
      const st = sayfaEkle('.anim-sina-gecisli{ transition:opacity .2s ease; }');
      const duz = document.createElement('div');
      const gecisli = document.createElement('div');
      gecisli.className = 'anim-sina-gecisli';
      const satirici = document.createElement('div');
      satirici.style.transition = 'transform .3s';
      document.body.append(duz, gecisli, satirici);
      try{
        kipleSina(() => {
          A.ayarla('az');
          const cs = el => getComputedStyle(el);
          /* saniye; Chrome .001ms'yi «1e-06s» diye yazar */
          const sure = el => parseFloat(cs(el).transitionDuration);
          /* ön koşul: base.css'in azaltılmış kuralı etkin */
          expect(sure(duz) > 0 && sure(duz) < 0.001).toBe(true);
          expect(cs(duz).transitionProperty).toBe('none');
          expect(cs(gecisli).transitionProperty).toBe('opacity');
          expect(sure(gecisli) > 0 && sure(gecisli) < 0.001).toBe(true);
          expect(cs(satirici).transitionProperty).toBe('transform');
          A.ayarla('tam');
          expect(cs(duz).transitionProperty).toBe('all');
          expect(sure(duz)).toBe(0);
          expect(sure(gecisli)).toBe(0.2);
        });
      }finally{ duz.remove(); gecisli.remove(); satirici.remove(); st.remove(); }
    });

    it('JS tarafı aynı kipi söyler: matchMedia ve hareketAz', () => {
      kipleSina(() => {
        A.ayarla('tam');
        expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
        expect(window.LIFEOS.hareketAz()).toBe(false);
        A.ayarla('az');
        expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
        expect(window.matchMedia('(prefers-reduced-motion: no-preference)').matches).toBe(false);
        expect(window.LIFEOS.hareketAz()).toBe(true);
        /* Hareketle ilgisiz sorgu sarılmaz. */
        expect(window.matchMedia('(min-width: 1px)').matches).toBe(true);
        A.ayarla('sistem');
        expect(window.LIFEOS.hareketAz()).toBe(A.sistemAz());
        expect(A.ayarla('hizli')).toBe(false);
      });
    });

    it('tercih kalıcıdır ve seçici yerinde güncellenir', () => {
      kipleSina(() => {
        const d = document.createElement('div');
        d.innerHTML = A.seciciHtml();
        document.body.appendChild(d);
        try{
          const b = Array.from(d.querySelectorAll('[data-animasyon]'));
          expect(b.map(x => x.textContent.trim())).toEqual(['Tam', 'Az', 'Sistem']);
          d.querySelector('[data-animasyon="az"]').dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
          expect(localStorage.getItem(A.ANAHTAR)).toBe('az');
          expect(d.querySelector('[data-animasyon="az"]').getAttribute('aria-pressed')).toBe('true');
          expect(d.querySelector('[data-animasyon="tam"]').getAttribute('aria-pressed')).toBe('false');
          expect(document.documentElement.getAttribute('data-hareket')).toBe('az');
        }finally{ d.remove(); }
      });
    });

    it('modüller arası geçiş: yalnız izinli tercihler adrese girer ve varışta depoya yazılır', () => {
      const eski = {};
      A.TASINAN.forEach(k => { try{ eski[k] = localStorage.getItem(k); localStorage.removeItem(k); }catch(e){} });
      try{
        localStorage.setItem('lifeos.hareket', 'tam');
        localStorage.setItem('lifeos.ses', '{"tur":"chill"}');
        const url = A.tasimaEkle('http://127.0.0.1:4183/');
        expect(url.indexOf('http://127.0.0.1:4183/#lifeos=')).toBe(0);
        localStorage.removeItem('lifeos.hareket');
        localStorage.removeItem('lifeos.ses');
        /* Yabancı anahtar ve bozuk değer yok sayılır. */
        expect(A.tasimaAl(url.slice(url.indexOf('#')))).toBe(2);
        expect(localStorage.getItem('lifeos.hareket')).toBe('tam');
        expect(localStorage.getItem('lifeos.ses')).toBe('{"tur":"chill"}');
        const sahte = '#lifeos=' + encodeURIComponent(JSON.stringify({ 'lifeos.sahte':'x', 'lifeos.hareket':'az' }));
        expect(A.tasimaAl(sahte)).toBe(1);
        expect(localStorage.getItem('lifeos.sahte')).toBeNull();
        expect(localStorage.getItem('lifeos.hareket')).toBe('az');
        expect(A.tasimaAl('#main')).toBe(0);
        expect(A.tasimaAl('#lifeos=%7Bbozuk')).toBe(0);
      }finally{
        A.TASINAN.forEach(k => { try{ if(eski[k] == null) localStorage.removeItem(k); else localStorage.setItem(k, eski[k]); }catch(e){} });
        A.yenile();
      }
    });
  });
})();
