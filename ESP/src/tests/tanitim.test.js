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

describe('Tanıtım — işaretleme', () => {
  const L = () => window.LIFEOS;

  it('üç panel, üç nokta ve İLKİ açık gelir', () => {
    const h = L().TANITIM_HTML('spi');
    expect((h.match(/tanitim__afis/g) || []).length).toBe(3);
    /* `tanitim__noktalar` (kapsayıcı) da bu deseni içeriyor; sayılan
       şey noktanın KENDİSİ olsun diye eyleme bakılıyor. */
    expect((h.match(/data-act="tanitim-adim"/g) || []).length).toBe(3);
    expect((h.match(/aria-selected="true"/g) || []).length).toBe(1);
    expect(h.indexOf('tanitim-spi-1.webp') >= 0).toBeTruthy();
    expect(h.indexOf('tanitim-spi-3.webp') >= 0).toBeTruthy();
  });

  it('şerit kendi sistemini TAŞIR', () => {
    /* Adım değişince alttaki cümleyi bu okur; modülü çağıranın
       hatırlamasına bırakmak iki yerde iki ayrı doğru demekti. */
    expect(L().TANITIM_HTML('esp').indexOf('data-mod="esp"') >= 0).toBeTruthy();
  });

  it('paneller ekran okuyucuya GÖRÜNMEZ, cümle GÖRÜNÜR', () => {
    /* Panellerin üzerinde yazı var ve o yazı okunamaz. Adımın cümlesi
       altta gerçek metin olarak durur. */
    const h = L().TANITIM_HTML('ays');
    expect((h.match(/aria-hidden="true"/g) || []).length).toBe(3);
    expect(h.indexOf('Bilgiyi görür, gelişimi ölçeriz.') >= 0).toBeTruthy();
  });

  it('her nokta KAÇINCI adım olduğunu ve sorusunu söyler', () => {
    const h = L().TANITIM_HTML('ays');
    expect(h.indexOf('aria-label="2/3 — Neye karar vermiyoruz?"') >= 0).toBeTruthy();
  });

  it('panel yoksa YALNIZ O PANEL kalkar', () => {
    /* Şerit çalışmaya devam eder; kalan iki panel ve noktalar durur. */
    expect((L().TANITIM_HTML('spi').match(/onerror="this\.remove\(\)"/g) || []).length)
      .toBe(3);
  });

  it('kök değiştirilebilir — tek dosya sürümü için', () => {
    expect(L().TANITIM_HTML('spi', { kok:'medya/' })
      .indexOf('medya/tanitim-spi-2.webp') >= 0).toBeTruthy();
  });
});

describe('Tanıtım — adım değiştirme', () => {
  const L = () => window.LIFEOS;

  function serit(mod){
    const d = document.createElement('div');
    d.innerHTML = L().TANITIM_HTML(mod || 'spi');
    document.body.appendChild(d);
    return d;
  }

  it('nokta panelin, noktanın ve CÜMLENİN üçünü birden değiştirir', () => {
    /* Cümleyi değiştirmemek, resmi değiştirip anlamı sabit bırakmak
       olurdu: ekran okuyucu için hiçbir şey olmamış demektir. */
    const d = serit('spi');
    const nokta2 = d.querySelector('.tanitim__nokta[data-adim="2"]');
    expect(L().TANITIM_ADIM(nokta2)).toBe(true);

    expect(d.querySelector('.tanitim__afis[data-adim="2"]')
      .classList.contains('is-acik')).toBe(true);
    expect(d.querySelector('.tanitim__afis[data-adim="1"]')
      .classList.contains('is-acik')).toBe(false);
    expect(nokta2.getAttribute('aria-selected')).toBe('true');
    expect(d.querySelector('[data-tanitim-yazi]').textContent)
      .toBe(L().TANITIM_ADIMLARI('spi')[1]);

    d.remove();
  });

  it('AYNI ANDA TEK adım açıktır', () => {
    const d = serit('esp');
    L().TANITIM_ADIM(d.querySelector('.tanitim__nokta[data-adim="3"]'));
    expect(d.querySelectorAll('.tanitim__afis.is-acik').length).toBe(1);
    expect(d.querySelectorAll('.tanitim__nokta[aria-selected="true"]').length).toBe(1);
    d.remove();
  });

  it('şeridin dışındaki bir düğme hiçbir şey yapmaz', () => {
    /* Sayfada başka bir `data-act` ile karışırsa sessizce yanlış bir
       şerit oynatmasın. */
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
    it('üç adım, tek soru, ilerleme üstte; yazılan kalır; Başla yalnız sonda', () => {
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
  });
})();
