/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/tanitim.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Tanıtım şeridi — üç adım, üç sistem, tek kaynak.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/tanitim.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const L = () => window.LIFEOS;

describe('Tanıtım — katalog', () => {

  it('üç soru vardır ve İKİNCİSİ sınırı sorar', () => {
    /* İkinci adım bu şeridin var olma sebebi: SPİ teşhis koymaz, ESP
       sertifika vermez, AYS meslek seçmez (AGENTS.md §1.5). Bu sözler
       bir belgede değil, sistemin İLK ekranında durmalı. Adım düşerse
       önce bu test kırılır. */
    expect(L().TANITIM.sorular.length).toBe(3);
    expect(L().TANITIM.sorular[1]).toBe('Neye karar vermiyoruz?');
  });

  it('dört sistemin de üç cevabı vardır', () => {
    ['ays', 'spi', 'esp', 'hkm'].forEach(m => {
      const c = L().TANITIM_ADIMLARI(m);
      expect(c).toBeTruthy();
      expect(c.length).toBe(L().TANITIM.sorular.length);
      c.forEach(x => expect(x.length > 10).toBeTruthy());
    });
  });

  it('her sistemin İKİNCİ cevabı bir OLUMSUZLAMADIR', () => {
    /* «Neye karar vermiyoruz» sorusunun cevabı bir özellik listesi
       olamaz. Dört sistemin dördünde de cümle bir şeyi REDDETMELİ. */
    ['ays', 'spi', 'esp', 'hkm'].forEach(m => {
      const c = L().TANITIM_ADIMLARI(m)[1];
      expect(/me[yz]|maz|mez/.test(c)).toBeTruthy();
    });
  });

  it('bilinmeyen sistem için şerit ÇİZİLMEZ', () => {
    /* Uydurma bir panel istemek, olmayan bir dosyayı istemektir. */
    expect(L().TANITIM_ADIMLARI('yok')).toBeNull();
    expect(L().TANITIM_HTML('yok')).toBe('');
  });
});

describe('Tanıtım — sade şerit (afişsiz)', () => {
  const L = () => window.LIFEOS;

  it('üç cümle AYNI ANDA görünür; sınır cümlesi atlanamaz', () => {
    /* Afiş gezdiricisi kaldırıldı: ikinci cümle (sınır) bir noktaya
       basmadan görünmüyordu. Sade şeritte üçü de gerçek metindir. */
    const h = L().TANITIM_HTML('spi');
    const d = document.createElement('div'); d.innerHTML = h;
    const maddeler = d.querySelectorAll('.tanitim__madde');
    expect(maddeler.length).toBe(3);
    L().TANITIM_ADIMLARI('spi').forEach((c, i) => expect(maddeler[i].textContent.includes(c)).toBe(true));
    expect(maddeler[1].textContent.includes('Neye karar vermiyoruz')).toBe(true);
  });

  it('görsel dosyaya bağlı değildir (afiş, img yok) ve sistemini taşır', () => {
    const h = L().TANITIM_HTML('esp');
    expect(h.indexOf('<img') < 0).toBe(true);
    expect(h.indexOf('.webp') < 0).toBe(true);
    expect(h.indexOf('data-mod="esp"') >= 0).toBe(true);
  });

  it('eski nokta düğmesi yetim kalırsa hiçbir şey yapmaz', () => {
    const yetim = document.createElement('button');
    yetim.setAttribute('data-adim', '2');
    expect(L().TANITIM_ADIM(yetim)).toBe(false);
    expect(L().TANITIM_ADIM(null)).toBe(false);
  });
});

})();

/* Kurulum adımları (171, T5): ilk açılış üç adım, her adım tek soru,
   ilerleme üstte; adım değişimi yeniden çizmez (yazılan kalır); sınırı
   söyleyen ikinci adım atlanamaz — «Başla» yalnız son adımda görünür. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;

  describe('Kurulum adımları (171)', () => {
    it('oz-171 üç adım, tek soru, ilerleme üstte; yazılan kalır; Başla yalnız sonda', () => {
      const d = document.createElement('div');
      d.className = 'sheet';
      d.innerHTML = window.LIFEOS.KURULUM_HTML('spi', { adimlar:['<p>bir</p>', '<p>iki</p>',
        '<input id="k-ad" value="">'] })
        + '<button data-act="kurulum-geri" data-kurulum-degil="1" hidden>Geri</button>'
        + '<button data-act="kurulum-ileri" data-kurulum-degil="3">Devam</button>'
        + '<button data-act="setup-save" data-kurulum-yalniz="3" hidden>Başla</button>';
      document.body.appendChild(d);
      try{
        const k = d.querySelector('[data-kurulum]');
        expect(k.getAttribute('data-oz')).toBe('171');
        expect(k.firstElementChild.getAttribute('role')).toBe('progressbar');
        expect(d.querySelectorAll('[role="tab"]').length).toBe(0);
        expect(d.querySelector('[data-kurulum-soru]').textContent).toBe('Ne ölçüyoruz?');
        const gorunen = () => Array.from(d.querySelectorAll('[data-kurulum-adim]')).filter(x => !x.hidden).length;
        expect(gorunen()).toBe(1);
        d.querySelector('#k-ad').value = 'Deniz';
        const ileri = d.querySelector('[data-act="kurulum-ileri"]');
        expect(window.LIFEOS.KURULUM_GIT(ileri, 1)).toBe(2);
        expect(d.querySelector('[data-kurulum-soru]').textContent).toBe('Neye karar vermiyoruz?');
        expect(d.querySelector('[data-act="setup-save"]').hidden).toBe(true);
        expect(window.LIFEOS.KURULUM_GIT(ileri, 1)).toBe(3);
        expect(d.querySelector('[data-kurulum-sayac]').textContent).toBe('Adım 3 / 3');
        expect(d.querySelector('[data-act="setup-save"]').hidden).toBe(false);
        expect(d.querySelector('[data-act="kurulum-ileri"]').hidden).toBe(true);
        expect(d.querySelector('#k-ad').value).toBe('Deniz');
        expect(window.LIFEOS.KURULUM_GIT(ileri, 1)).toBe(3);
        expect(window.LIFEOS.KURULUM_GIT(ileri, -1)).toBe(2);
        expect(window.LIFEOS.KURULUM_HTML('yok', {})).toBe('');
      }finally{ d.remove(); }
    });

    it('kurulum sade: afiş yok; üç adımlık adım çizgisi hangi adımda olduğunu söyler', () => {
      const d = document.createElement('div');
      d.innerHTML = window.LIFEOS.KURULUM_HTML('spi', { adimlar:['<p>1</p>', '<p>2</p>', '<p>3</p>'] });
      document.body.appendChild(d);
      try{
        expect(d.querySelector('img')).toBe(null);
        const li = () => Array.from(d.querySelectorAll('.kurulum__adimlar li'));
        expect(li().length).toBe(3);
        expect(li().map(x => x.getAttribute('data-hal'))).toEqual(['simdi', 'sira', 'sira']);
        expect(li()[1].textContent.includes('Neye karar vermiyoruz')).toBe(true);
        window.LIFEOS.KURULUM_GIT(d.querySelector('[data-kurulum]'), 1);
        expect(li().map(x => x.getAttribute('data-hal'))).toEqual(['bitti', 'simdi', 'sira']);
        expect(li()[1].getAttribute('aria-current')).toBe('step');
        expect(d.querySelector('[data-kurulum-yazi]').textContent).toBe(window.LIFEOS.TANITIM_ADIMLARI('spi')[1]);
      }finally{ d.remove(); }
    });

    it('hata: «Başla» ve «Geri» 1. adımda görünüyordu — .btn görünümü [hidden]ı eziyordu', () => {
      const d = document.createElement('div');
      d.className = 'sheet';
      d.innerHTML = window.LIFEOS.KURULUM_HTML('spi', { adimlar:['<p>1</p>', '<p>2</p>', '<p>3</p>'] })
        + '<button class="btn" style="display:inline-flex" data-kurulum-degil="1" hidden>Geri</button>'
        + '<button class="btn" style="display:inline-flex" data-kurulum-yalniz="3" hidden>Başla</button>';
      document.body.appendChild(d);
      try{
        const gor = s => getComputedStyle(d.querySelector(s)).display !== 'none';
        expect(gor('[data-kurulum-yalniz]')).toBe(false);
        expect(gor('[data-kurulum-degil]')).toBe(false);
        window.LIFEOS.KURULUM_GIT(d.querySelector('[data-kurulum]'), 1);
        expect(gor('[data-kurulum-degil]')).toBe(true);
      }finally{ d.remove(); }
    });
  });
})();
