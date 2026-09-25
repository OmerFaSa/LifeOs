/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/onerikart.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Öneri kartı ve onay kalıbı — 110 111 112 114 116 121 150.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/onerikart.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kural (ekip/EKIP-PLANI.md §4.1): P1 kartının kabul ölçütü testin İLK
   satırıdır ve test adında özelliğin numarası geçer (`oz-110 …`). */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const O = () => window.LIFEOS.ONERI;

  /* Sınama kataloğu: modüllerin `data/actions.js` biçiminde. */
  const KATALOG = [
    { id:'block-add', level:'kucuk', title:'Bugüne blok ekle' },
    { id:'cards-due-today', level:'orta', title:'Geciken tekrarları bugüne çek' },
    { id:'plan-reset', level:'buyuk', title:'Planı baştan kur' },
    { id:'meal-log', level:'kucuk', olcum:true, title:'Öğünü kaydet' },
    { id:'veri-sil', level:'kucuk', geriAlinamaz:true, title:'Kaydı kalıcı sil' },
  ];
  const KURAL = [{ no:'R-12', ad:'Tekrar borcu eşiği', deger:34, esik:10, birim:'%', kosul:'>=' }];
  const MERKEZ = { id:'o1', eylem:'block-add', kaynak:'merkez', baslik:'Akşam bloğu tekrara ayrılsın',
    kapsam:'yalnız bugün', gerekce:{ etiket:'Tekrar borcu', deger:34, esik:10, birim:'%' },
    cumle:{ metin:'Borç eşiğin üç katı; bir blok yeter.', kaynak:'model' }, kurallar:KURAL };

  function sahne(markup, gen){
    const k = document.createElement('div');
    k.style.cssText = 'position:absolute;left:-9999px;top:0;width:' + (gen || 420) + 'px';
    k.innerHTML = markup;
    document.body.appendChild(k);
    return k;
  }
  const renk = (kok, v) => {
    const r = document.createElement('span');
    r.style.color = v;
    kok.appendChild(r);
    const c = getComputedStyle(r).color;
    r.remove();
    return c;
  };
  const bekle = ms => new Promise(r => setTimeout(r, ms));

describe('110 · Mor öneri kartı', () => {

  it('oz-110 Merkez’den gelen her öneri mor kartta ve seviye rozetiyle; modül içeriği hiçbir yerde mor kullanmaz.', () => {
    const modul = Object.assign({}, MERKEZ, { id:'o2', kaynak:'modul', baslik:'Konu tekrara alınsın' });
    const k = sahne(O().kartHtml(MERKEZ, KATALOG) + O().kartHtml(modul, KATALOG));
    try{
      const [m, d] = k.querySelectorAll('.okart');
      expect(m.getAttribute('data-oz')).toBe('110');
      expect(m.classList.contains('okart--merkez')).toBeTruthy();
      expect(d.classList.contains('okart--merkez')).toBeFalsy();
      expect(m.querySelector('.okart__seviye').textContent).toBe('küçük');
      expect(d.querySelector('.okart__seviye').textContent).toBe('küçük');
      expect(getComputedStyle(m.querySelector('.okart__kaynak')).color).toBe(renk(k, 'var(--mer-ink)'));
      /* Modül kartında HİÇBİR öğe morun üç tonundan birini taşımaz. */
      const morlar = ['var(--mer)', 'var(--mer-ink)', 'var(--mer-t)'].map(v => renk(k, v));
      const oge = [d].concat(Array.prototype.slice.call(d.querySelectorAll('*')));
      oge.forEach(el => {
        const s = getComputedStyle(el);
        [s.color, s.backgroundColor, s.borderTopColor, s.borderLeftColor].forEach(c =>
          expect(morlar.indexOf(c) < 0).toBeTruthy());
      });
      expect(getComputedStyle(m).borderTopColor === getComputedStyle(d).borderTopColor).toBeFalsy();
    }finally{ k.remove(); }
  });

  it('oz-110 öneri alanında en çok BİR kart; fazlası Onaylar’da', () => {
    const a = O().alan([MERKEZ, Object.assign({}, MERKEZ, { id:'o3' }), Object.assign({}, MERKEZ, { id:'o4' })], KATALOG);
    expect(a.kart.id).toBe('o1');
    expect(a.kalan).toBe(2);
    expect(a.kalanMetni).toBe('2 öneri daha Onaylar’da');
    const bir = O().alan([MERKEZ], KATALOG);
    expect(bir.kalan).toBe(0);
    expect(bir.kalanMetni).toBe('');
    expect(O().alan([], KATALOG).kart).toBeNull();
  });

  it('oz-110 kart T’nin kutusunun üstündedir ve başlığıyla adlandırılır', () => {
    const k = sahne(O().kartHtml(MERKEZ, KATALOG));
    try{
      const a = k.querySelector('article');
      expect(a.classList.contains('kutu')).toBeTruthy();
      expect(k.querySelector('#' + a.getAttribute('aria-labelledby')).textContent)
        .toBe('Akşam bloğu tekrara ayrılsın');
      expect(k.querySelector('.okart__alt').textContent).toBe('küçük aksiyon · yalnız bugün · geri alınabilir');
    }finally{ k.remove(); }
  });
});

describe('111 · Seviyeye göre onay', () => {

  it('oz-111 Onay kalıbı aksiyonun katalogdaki seviyesinden seçilir; dil modeli seviye belirleyemez.', () => {
    /* Model «küçük» yazıyor, katalog «orta» diyor: katalog kazanır. */
    const k = O().kalip({ eylem:'cards-due-today', level:'kucuk' }, KATALOG);
    expect(k.seviye).toBe('orta');
    expect(k.onizleme).toBeTruthy();
    expect(k.onay).toBeTruthy();
    expect(k.yokSayilan).toBe('kucuk');
    /* Model «büyük» yazsa bile küçük aksiyon küçük kalır. */
    expect(O().kalip({ eylem:'block-add', seviye:'buyuk' }, KATALOG).seviye).toBe('kucuk');
    /* Katalog dışı aksiyonun kalıbı yok, kartı da yok. */
    expect(O().kalip({ eylem:'uydurma' }, KATALOG)).toBeNull();
    expect(O().kartHtml(Object.assign({}, MERKEZ, { eylem:'uydurma' }), KATALOG)).toBe('');
  });

  it('oz-111 üç seviyenin üç kalıbı: dokunuş + Geri al · önizleme + onay · önce/sonra + dönüş noktası', () => {
    const K = O().KALIPLAR;
    expect(K.kucuk.onay).toBeFalsy();
    expect(K.kucuk.geriAl).toBeTruthy();
    expect(K.orta.onizleme && K.orta.onay).toBeTruthy();
    expect(K.orta.donusNoktasi).toBeFalsy();
    expect(K.buyuk.oncesonra && K.buyuk.onay && K.buyuk.donusNoktasi).toBeTruthy();
    expect(Object.isFrozen(K.kucuk)).toBeTruthy();
    const dug = id => {
      const k = sahne(O().kartHtml(Object.assign({}, MERKEZ, { eylem:id }), KATALOG));
      try{ return Array.prototype.map.call(k.querySelectorAll('button'), b => b.textContent + '/' + b.getAttribute('data-act')); }
      finally{ k.remove(); }
    };
    expect(dug('block-add')).toEqual(['Uygula/oneri-uygula', 'Geç/oneri-gec']);
    expect(dug('cards-due-today')).toEqual(['Önizle/oneri-onizle', 'Geç/oneri-gec']);
    expect(dug('plan-reset')).toEqual(['Önce / sonra/oneri-onizle', 'Geç/oneri-gec']);
  });

  it('oz-111 geri alınamayan aksiyon küçük SAYILAMAZ; bilinmeyen seviye en çok onayı ister', () => {
    expect(O().kalip({ eylem:'veri-sil' }, KATALOG).seviye).toBe('orta');
    expect(O().kalip({ eylem:'x' }, [{ id:'x', level:'minik' }]).seviye).toBe('buyuk');
  });

  it('oz-111 katalog harita olarak da okunur (R.ACTION_BY_ID biçimi)', () => {
    const harita = {};
    KATALOG.forEach(x => { harita[x.id] = x; });
    expect(O().kalip({ action:'plan-reset' }, harita).seviye).toBe('buyuk');
  });

  it('oz-111 dolu (birincil) düğme yok: kartın düğmeleri ekranın tek birincilini çalmaz', () => {
    ['block-add', 'cards-due-today', 'plan-reset'].forEach(id => {
      const h = O().kartHtml(Object.assign({}, MERKEZ, { eylem:id }), KATALOG);
      expect(h.indexOf('btn--primary') < 0).toBeTruthy();
    });
  });
});

describe('114 · Gerekçe çubuğu', () => {

  it('oz-114 Öneri kartında sayı ile model cümlesi ayrı öğelerde; model kapalıyken sayı ve çubuk kalır.', () => {
    const acik = sahne(O().kartHtml(MERKEZ, KATALOG));
    const kapali = sahne(O().kartHtml(Object.assign({}, MERKEZ, { cumle:null }), KATALOG));
    try{
      const s = acik.querySelector('.gerekce__satir');
      const c = acik.querySelector('.gerekce__cumle');
      expect(s.querySelector('.sayi')).toBeTruthy();
      expect(c.getAttribute('data-kaynak')).toBe('model');
      expect(c.textContent).toBe('Borç eşiğin üç katı; bir blok yeter.');
      expect(s.contains(c)).toBeFalsy();
      expect(c.querySelector('.sayi')).toBeNull();
      /* Model kapalı: cümle yok, sayı ve çubuk yerinde. */
      expect(kapali.querySelector('.gerekce__cumle')).toBeNull();
      expect(kapali.querySelector('.gerekce__satir .sayi .sayi__d').textContent).toBe('%34');
      expect(kapali.querySelector('.gerekce__cubuk')).toBeTruthy();
      expect(kapali.querySelector('[data-oz="114"]')).toBeTruthy();
    }finally{ acik.remove(); kapali.remove(); }
  });

  it('oz-114 çubuk değeri ve eşiği aynı ölçekte gösterir', () => {
    const k = sahne(O().gerekceHtml({ etiket:'Tekrar borcu', deger:34, esik:10, birim:'%', olcek:50 }));
    try{
      expect(k.querySelector('.gerekce__dolu').style.width).toBe('68%');
      expect(k.querySelector('.gerekce__esik').style.left).toBe('20%');
      expect(k.textContent).toContain('eşik %10');
    }finally{ k.remove(); }
  });

  it('oz-114 değer yoksa çubuk çizilmez ve sayı «—»; kuralın hazır cümlesi etiketiyle', () => {
    const h = O().gerekceHtml({ etiket:'Uyku', deger:null, esik:7, kesinlik:'missing' },
      { metin:'Dün gece için kayıt yok.', kaynak:'kural' });
    expect(h.indexOf('gerekce__cubuk') < 0).toBeTruthy();
    expect(h).toContain('—');
    expect(h).toContain('data-kaynak="kural"');
  });
});

describe('116 · Otomatik uygula ayarı', () => {

  it('oz-116 Her küçük tür için «sormadan uygula» anahtarı var; orta ve büyük türlerde anahtar kilitli.', () => {
    const k = sahne(O().ayarHtml(KATALOG, { mod:'istek', turler:{ 'block-add':true } }));
    try{
      expect(k.querySelector('[data-oz="116"]')).toBeTruthy();
      const a = {};
      k.querySelectorAll('input[role="switch"]').forEach(i => { a[i.getAttribute('data-eylem')] = i; });
      expect(Object.keys(a).length).toBe(5);
      expect(a['block-add'].disabled).toBeFalsy();
      expect(a['block-add'].checked).toBeTruthy();
      expect(a['cards-due-today'].disabled).toBeTruthy();
      expect(a['plan-reset'].disabled).toBeTruthy();
      /* Ölçüm yazan küçük tür (KR-1) ve geri alınamayan tür de kilitli. */
      expect(a['meal-log'].disabled).toBeTruthy();
      expect(a['veri-sil'].disabled).toBeTruthy();
      const neden = k.querySelectorAll('.otoayar__neden');
      expect(neden[0].textContent).toBe('orta aksiyon: her zaman sorar');
      expect(neden[1].textContent).toBe('büyük aksiyon: her zaman sorar');
      expect(neden[2].textContent).toBe('ölçüm yazar: her zaman sorar');
      /* Her anahtarın adı var (etiketle bağlı). */
      Object.keys(a).forEach(id => expect(k.querySelector('label[for="' + a[id].id + '"]')).toBeTruthy());
    }finally{ k.remove(); }
  });

  it('oz-116 tür anahtarı modun ÜSTÜNDEDİR; dokunulmamış tür modu izler', () => {
    const s = (id, ayar, kaynak) => O().sormadanMi({ eylem:id }, KATALOG, ayar, { kaynak:kaynak });
    expect(s('block-add', { mod:'hicbiri', turler:{ 'block-add':true } }, 'kural')).toBeTruthy();
    expect(s('block-add', { mod:'hepsi', turler:{ 'block-add':false } }, 'istek')).toBeFalsy();
    expect(s('block-add', { mod:'hepsi' }, 'kural')).toBeTruthy();
    expect(s('block-add', { mod:'istek' }, 'istek')).toBeTruthy();
    expect(s('block-add', { mod:'istek' }, 'llm')).toBeFalsy();
    expect(s('block-add', 'hepsi', 'llm')).toBeTruthy();       // eski düz ayar
    expect(s('block-add', { mod:'bozuk' }, 'llm')).toBeFalsy(); // bozuk ayar «hepsi»ye dönmez
  });

  it('oz-116 orta, büyük, ölçüm ve katalog dışı hiçbir ayarda sormadan uygulanmaz', () => {
    const hepsi = { mod:'hepsi', turler:{ 'cards-due-today':true, 'plan-reset':true, 'meal-log':true, uydurma:true } };
    ['cards-due-today', 'plan-reset', 'meal-log', 'veri-sil', 'uydurma'].forEach(id =>
      expect(O().sormadanMi({ eylem:id }, KATALOG, hepsi, { kaynak:'istek' })).toBeFalsy());
  });
});

describe('121 · Kural izi', () => {

  it('oz-121 Her Merkez önerisi tetikleyen kuralların numarasını ve sağlanan değeri taşır.', () => {
    const k = sahne(O().kartHtml(MERKEZ, KATALOG));
    try{
      const iz = k.querySelector('[data-oz="121"]');
      expect(iz.tagName).toBe('DETAILS');
      expect(iz.querySelector('summary').textContent).toBe('Neden?');
      expect(iz.querySelector('.kuralizi__no').textContent).toBe('R-12');
      expect(iz.querySelector('.kuralizi__deger').textContent).toBe('%34 ≥ %10');
    }finally{ k.remove(); }
    /* Kural izi olmayan Merkez önerisi kartlanmaz: kodun değil modelin kararıdır. */
    const izsiz = Object.assign({}, MERKEZ, { kurallar:[] });
    expect(O().kartHtml(izsiz, KATALOG)).toBe('');
    expect(O().dogrula(izsiz, KATALOG)).toEqual(['kural izi yok']);
  });

  it('oz-121 modülün kendi önerisi kural izi olmadan da gösterilir', () => {
    const modul = Object.assign({}, MERKEZ, { kaynak:'modul', kurallar:[] });
    expect(O().kartHtml(modul, KATALOG)).toContain('okart--modul');
  });

  it('oz-121 karşılaştırma işareti koşuldan gelir', () => {
    expect(O().kuralMetni({ no:'R-3', deger:5.5, esik:7, birim:'saat', kosul:'<', ondalik:1 })).toBe('5,5 saat < 7 saat');
    expect(O().kuralMetni({ no:'R-4', deger:2, esik:3, kosul:'<=' })).toBe('2 ≤ 3');
    expect(O().kuralMetni({ no:'R-5', deger:null })).toBe('—');
  });
});

describe('112 · Çakışma kartı', () => {

  const A = { modul:'ays', ad:'Paragraf · akşam bloğu', bas:'20:30', bit:'21:40' };
  const B = { modul:'spi', ad:'Antrenman', bas:'21:00', bit:'22:00' };

  it('oz-112 Aynı saati isteyen iki modül yan yana gösterilir; Merkez’in çözümü kullanıcı onayı olmadan uygulanmaz.', () => {
    const k = sahne(O().cakismaHtml({ a:A, b:B, cozum:{ id:'c1', baslik:'Antrenman 22:00’ye kaysın' } }), 390);
    try{
      const kok = k.querySelector('[data-oz="112"]');
      expect(kok.querySelector('.cakisma__bas').textContent).toBe('40 dakika çakışıyor · 21:00–21:40');
      const [x, y] = kok.querySelectorAll('.cakisma__taraf');
      expect(x.offsetTop).toBe(y.offsetTop);                // yan yana
      expect(x.offsetLeft < y.offsetLeft).toBeTruthy();
      expect(x.classList.contains('cakisma--ays') && y.classList.contains('cakisma--spi')).toBeTruthy();
      /* Çözümün düğmesi UYGULAMAZ, önizler; uygulama yalnız açık onayla. */
      const d = kok.querySelector('.cakisma__cozum button');
      expect(d.getAttribute('data-act')).toBe('cakisma-onizle');
    }finally{ k.remove(); }
    [undefined, null, false, 'evet', 1, {}].forEach(v => expect(O().cozumUygulanabilirMi(v)).toBeFalsy());
    expect(O().cozumUygulanabilirMi(true)).toBeTruthy();
    /* Ayar «hepsi» olsa bile çakışma çözümü sormadan uygulanmaz. */
    expect(O().sormadanMi({ eylem:'block-add' }, KATALOG, { mod:'hepsi', turler:{ 'block-add':true } },
      { cakisma:true, kaynak:'istek' })).toBeFalsy();
  });

  it('oz-112 çakışma dakikası; değmeyen bloklar ve bitişik bloklar çakışmaz', () => {
    expect(O().cakisma(A, B).dakika).toBe(40);
    expect(O().cakisma(A, { bas:'21:40', bit:'22:00' }).dakika).toBe(0);
    expect(O().cakismaHtml({ a:A, b:{ modul:'esp', ad:'x', bas:'08:00', bit:'09:00' } })).toBe('');
  });

  it('oz-112 saati okunamayan blok bilinmeyen kalır: ne çakışır ne çakışmaz', () => {
    expect(O().cakisma(A, { bas:'akşam', bit:'22:00' })).toBeNull();
    expect(O().cakisma(A, { bas:'22:00', bit:'21:00' })).toBeNull();
    expect(O().cakismaHtml({ a:A, b:{ bas:'?', bit:'?' } })).toBe('');
  });
});

describe('150 · Geri al geri sayımı', () => {

  it('oz-150 Geri al şeridi kalan süreyi çizgiyle gösterir; süre dolunca şerit kapanır, işlem kalıcı olur.', async () => {
    /* Çizgi: şeridin ömrü kadar süren bir incelme. */
    /* Şerit ekran dışındaki bir kabın içinde: kendi `position`'ı
       kart.css'ten gelsin diye şeride satır içi biçim yazılmaz. */
    const kab = sahne('');
    const serit = document.createElement('div');
    serit.className = 'toast toast--undo';
    serit.innerHTML = '<span>Blok eklendi</span>';
    const c = O().cizgi(6000);
    serit.appendChild(c);
    kab.appendChild(serit);
    try{
      expect(c.getAttribute('data-oz')).toBe('150');
      expect(c.style.animationDuration).toBe('6000ms');
      const s = getComputedStyle(c);
      expect(s.animationName).toBe('gerial-sure');
      expect(s.position).toBe('absolute');
      expect(getComputedStyle(serit).position).toBe('relative');
    }finally{ kab.remove(); }

    /* Süre dolunca: kalıcı bir kez çağrılır, geri alma kapanır. */
    let kalici = 0, geri = 0;
    const g = O().geriAlBaslat({ sure:60, kalici:() => { kalici++; }, geriAl:() => { geri++; } });
    expect(g.durum()).toBe('acik');
    await bekle(120);
    expect(g.durum()).toBe('kalici');
    expect(kalici).toBe(1);
    expect(g.geriAl()).toBeFalsy();
    expect(geri).toBe(0);
    expect(g.kalan()).toBe(0);
  });

  it('oz-150 süre içinde geri alınırsa işlem kalıcı OLMAZ', async () => {
    let kalici = 0, geri = 0;
    const g = O().geriAlBaslat({ sure:60, kalici:() => { kalici++; }, geriAl:() => { geri++; } });
    expect(g.geriAl()).toBeTruthy();
    expect(g.geriAl()).toBeFalsy();   // ikinci kez geri alınmaz
    await bekle(120);
    expect(kalici).toBe(0);
    expect(geri).toBe(1);
    expect(g.durum()).toBe('geri-alindi');
  });

  it('oz-150 kalan süre hesabı; varsayılan ömür üç arayüzün şeridiyle aynı (6 sn)', () => {
    expect(O().GERI_AL_MS).toBe(6000);
    expect(O().kalan(0, 6000, 1500)).toBe(4500);
    expect(O().kalan(0, 6000, 9000)).toBe(0);
    expect(O().kalan(1000, 6000, 500)).toBe(6000);
  });

  it('oz-150 azaltılmış harekette çizgi saniye saniye kısalır: kalan süre bilgisi kaybolmaz', () => {
    const c = O().cizgi(6000);
    expect(c.style.getPropertyValue('--gerial-adim')).toBe('6');
    /* Kosucu `reducedMotion:'reduce'` ile açar: adımlı zamanlama görünür. */
    const serit = document.createElement('div');
    serit.className = 'toast toast--undo';
    serit.appendChild(c);
    document.body.appendChild(serit);
    try{
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){
        expect(getComputedStyle(c).animationTimingFunction).toContain('steps(6');
      }
    }finally{ serit.remove(); }
  });
});

describe('022 · Sonucu söyleyen düğme', () => {
  const UI = () => (window.R || window.SP || window.ESP).UI;

  it('oz-022 Yıkıcı her düğme sonucunu adıyla ve sayısıyla söyler («14 bloğu sil»); «Evet» ya da «Tamam» kullanılmaz.', () => {
    expect(O().sonucEtiketi({ fiil:'sil', sayi:14, nesne:'bloğu' })).toBe('14 bloğu sil');
    expect(O().sonucEtiketi({ fiil:'sil', sayi:1243, nesne:'kaydı' })).toBe('1.243 kaydı sil');
    const k = sahne(O().yikiciDugme({ fiil:'sil', sayi:14, nesne:'bloğu', act:'blok-sil' }));
    try{
      const b = k.querySelector('button');
      expect(b.getAttribute('data-oz')).toBe('022');
      expect(b.classList.contains('btn--danger')).toBeTruthy();
      expect(b.textContent).toBe('14 bloğu sil');
      expect(b.getAttribute('data-act')).toBe('blok-sil');
    }finally{ k.remove(); }
    ['Evet', 'Tamam', 'Evet, devam et', 'OK', 'tamam'].forEach(e => expect(O().etiketGecerliMi(e)).toBeFalsy());
    expect(O().etiketGecerliMi('14 bloğu sil')).toBeTruthy();
    expect(O().etiketGecerliMi('Sil')).toBeFalsy();   // sayısız yıkıcı etiket geçmez
  });

  it('oz-022 sayısı bilinmeyen yıkıcı düğme saklanmaz ama işaretlenir; etiket büyük harfle başlar', () => {
    const h = O().yikiciDugme({ fiil:'sil', nesne:'işaretli kaydı' });
    expect(h).toContain('data-eksik="sayi"');
    expect(h).toContain('>İşaretli kaydı sil<');
  });

  it('oz-022 onay penceresi sonucu söyleyen etiketi taşır (ui.js confirmSheet)', () => {
    UI().confirmSheet('Blokları sil', 'Bu haftanın blokları silinecek.', () => {}, true, '14 bloğu sil');
    try{
      const b = document.querySelector('[data-act="confirm-yes"]');
      expect(b.textContent.trim()).toBe('14 bloğu sil');
      expect(b.classList.contains('btn--danger')).toBeTruthy();
    }finally{ UI().closeSheet(); }
  });
});

describe('150 · Geri al şeridi (ui.js toast)', () => {
  const UI = () => (window.R || window.SP || window.ESP).UI;

  it('oz-150 var olan «Geri al» şeridi süre çizgisini taşır ve süre dolunca düğme kapanır', async () => {
    let kok = document.getElementById('toast-root'), kurdum = false;
    if(!kok){ kok = document.createElement('div'); kok.id = 'toast-root'; document.body.appendChild(kok); kurdum = true; }
    try{
      const el = UI().toast('Blok eklendi', { undo:() => {}, life:80 });
      const c = el.querySelector('.gerial__sure');
      expect(c).toBeTruthy();
      expect(c.style.animationDuration).toBe('80ms');
      const b = el.querySelector('.toast__undo');
      expect(b.disabled).toBeFalsy();
      await bekle(130);
      expect(b.disabled).toBeTruthy();
      /* Geri alması olmayan şerit çizgi taşımaz. */
      const d = UI().toast('Kaydedildi', { life:50 });
      expect(d.querySelector('.gerial__sure')).toBeNull();
      await bekle(400);
    }finally{ if(kurdum) kok.remove(); }
  });
});

describe('P2 · Öneri ekleri (113 123 124 127)', () => {

  it('oz-127 Bir değişikliğin süresi seçilir: yalnız bugün, bu hafta, kalıcı; her birinin seviyesi altında.', () => {
    const o = { id:'k1', eylem:'block-add' };
    expect(O().KAPSAMLAR.map(k => k.id).join(',')).toBe('bugun,hafta,kalici');
    expect(['bugun', 'hafta', 'kalici'].map(k => O().kapsamSeviyesi(o, KATALOG, k)).join(',')).toBe('kucuk,orta,buyuk');
    const k = sahne(O().kapsamHtml(o, KATALOG, 'bugun'));
    try{
      const f = k.querySelector('[data-oz="127"]');
      expect(f.tagName).toBe('FIELDSET');
      const s = f.querySelectorAll('.kapsam__seviye');
      expect(s[0].textContent).toBe('küçük aksiyon · tek dokunuş, «Geri al» kalır');
      expect(s[1].textContent).toBe('orta aksiyon · önizleme ve tek onay');
      expect(s[2].textContent).toBe('büyük aksiyon · önce/sonra, onay ve dönüş noktası');
      expect(f.querySelector('input:checked').value).toBe('bugun');
      f.querySelectorAll('input').forEach(i => expect(k.querySelector('label[for="' + i.id + '"]')).toBeTruthy());
    }finally{ k.remove(); }
  });

  it('oz-127 kapsam seviyeyi yalnız YÜKSELTİR: kataloğu orta olan «yalnız bugün»de küçülmez', () => {
    const o = { eylem:'cards-due-today' };
    expect(O().kapsamSeviyesi(o, KATALOG, 'bugun')).toBe('orta');
    expect(O().kapsamSeviyesi(o, KATALOG, 'kalici')).toBe('buyuk');
    expect(O().kapsamSeviyesi(o, KATALOG, 'uydurma')).toBe('orta');
    expect(O().kapsamSeviyesi({ eylem:'yok' }, KATALOG, 'bugun')).toBeNull();
  });

  it('oz-123 «Geç» dendiğinde isteğe bağlı neden çipleri; seçilen neden geçmişe yazılır.', () => {
    const k = sahne(O().gecmeHtml({ id:'o1' }));
    try{
      const g = k.querySelector('[data-oz="123"]');
      const cip = g.querySelectorAll('.chip');
      expect(cip).toHaveLength(O().GECME_NEDENLERI.length);
      expect(cip[0].getAttribute('data-neden')).toBe('zaman-yok');
      expect(cip[0].getAttribute('data-oneri')).toBe('o1');
      /* İsteğe bağlı: nedensiz geçmek de bir seçenek. */
      const nedensiz = g.querySelector('.btn');
      expect(nedensiz.textContent).toBe('Nedensiz geç');
      expect(nedensiz.getAttribute('data-neden')).toBe('');
    }finally{ k.remove(); }
    const r = O().gecmeKaydi({ id:'o1', eylem:'block-add' }, 'veri-yanlis', '2026-09-24T10:00:00Z');
    expect(r).toEqual({ oneri:'o1', eylem:'block-add', neden:'veri-yanlis', nedenAd:'Veri yanlış', zaman:'2026-09-24T10:00:00Z' });
  });

  it('oz-123 tanınmayan neden uydurulmaz: null yazılır', () => {
    expect(O().gecmeKaydi({ id:'o1' }, 'canim-istemedi').neden).toBeNull();
    expect(O().gecmeKaydi({ id:'o1' }, '').neden).toBeNull();
    expect(Object.isFrozen(O().GECME_NEDENLERI)).toBeTruthy();
  });

  it('oz-124 Bir modüldeki ölçüm başka bir modüle öneri olur; iki modül yan yana, ok Merkez’in.', () => {
    const o = Object.assign({}, MERKEZ, { capraz:{ kaynak:'spi', hedef:'ays', olcum:'Uyku 5,1 saat' } });
    const k = sahne(O().kartHtml(o, KATALOG));
    try{
      const c = k.querySelector('[data-oz="124"]');
      const m = c.querySelectorAll('.capraz__modul');
      expect(m[0].textContent + '→' + m[1].textContent).toBe('SPİ→AYS');
      expect(c.getAttribute('aria-label')).toBe('SPİ ölçümü AYS’ye öneri: Uyku 5,1 saat');
      /* Kaynak ve hedef ayrı renkte; ok Merkez'in morunda. */
      expect(getComputedStyle(m[0]).color === getComputedStyle(m[1]).color).toBeFalsy();
      expect(getComputedStyle(c.querySelector('.capraz__ok')).stroke).toBe(renk(k, 'var(--mer)'));
    }finally{ k.remove(); }
  });

  it('oz-124 aynı modül ya da bilinmeyen modül çapraz etki sayılmaz', () => {
    expect(O().caprazHtml({ kaynak:'ays', hedef:'ays' })).toBe('');
    expect(O().caprazHtml({ kaynak:'hkm', hedef:'ays' })).toBe('');
  });

  it('oz-113 Yalnız değişen blok renkli; gerisi soluk kalır.', () => {
    const once = [{ id:1, ad:'Paragraf', bas:'08:00', bit:'09:00' }, { id:2, ad:'Problem', bas:'10:00', bit:'11:00' },
      { id:3, ad:'Tekrar', bas:'12:00', bit:'13:00' }];
    const sonra = [{ id:1, ad:'Paragraf', bas:'08:00', bit:'09:00' }, { id:2, ad:'Problem', bas:'10:30', bit:'11:30' },
      { id:4, ad:'Geometri', bas:'14:00', bit:'15:00' }];
    const k = sahne(O().onceSonraHtml(once, sonra));
    try{
      const el = k.querySelector('[data-oz="113"]');
      expect(el.querySelector('.oncesonra__ozet').textContent).toBe('1 değişti · 1 eklendi · 1 silindi · 1 aynı');
      const ayni = el.querySelector('.oncesonra__b--ayni'), deg = el.querySelector('.oncesonra__b--degisen');
      expect(getComputedStyle(ayni).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(deg).backgroundColor === 'rgba(0, 0, 0, 0)').toBeFalsy();
      expect(getComputedStyle(ayni).color === getComputedStyle(deg).color).toBeFalsy();
      expect(el.querySelector('.oncesonra__b--silinen .oncesonra__ad').textContent).toBe('Tekrar');
      expect(el.querySelector('.oncesonra__b--eklenen .oncesonra__ad').textContent).toBe('Geometri');
    }finally{ k.remove(); }
  });

  it('oz-113 sıra değişikliği değişiklik sayılmaz; hiç fark yoksa bunu söyler', () => {
    const a = [{ id:1, ad:'A', bas:'08:00', bit:'09:00' }, { id:2, ad:'B', bas:'10:00', bit:'11:00' }];
    const r = O().onceSonra(a, [a[1], a[0]]);
    expect(r.degisen).toHaveLength(0);
    expect(r.ozet).toBe('Değişiklik yok');
  });
});

/* MODÜL KÖPRÜSÜ: modülün satırı kart olur; düğmeler modülün kapısına gider. */
describe('Öneri köprüsü (110 ailesi → modül kapısı)', () => {
  function sahte(){
    const iz = { uygula:[], gec:[], pencere:[], kapat:0 };
    const satirlar = [{ id:'p1', action:'block-add', title:'Bugüne blok ekle' },
      { id:'p2', action:'plan-reset', title:'Planı baştan kur' }];
    const k = O().kopru({
      katalog:KATALOG,
      satirlar:() => satirlar,
      nesne:s => ({ id:s.id, eylem:s.action, baslik:s.title, kaynak:'modul' }),
      uygula:id => { iz.uygula.push(id); },
      gec:(id, kayit) => { iz.gec.push([id, kayit]); },
      onizle:s => s.action === 'plan-reset'
        ? { once:[{ id:1, ad:'Paragraf', bas:'08:00', bit:'09:00' }], sonra:[{ id:2, ad:'Problem', bas:'08:00', bit:'09:00' }] } : null,
      pencere:o => { iz.pencere.push(o); },
      kapat:() => { iz.kapat++; },
    });
    return { k, iz, satirlar };
  }

  it('oz-110 köprü modülün satırını ortak karta çevirir; katalogda olmayan eylem kart olmaz', () => {
    const { k, satirlar } = sahte();
    const kk = sahne(k.kart(satirlar[0]));
    try{
      const kart = kk.querySelector('[data-oz="110"]');
      expect(kart.getAttribute('data-oneri')).toBe('p1');
      expect(kart.querySelector('[data-act="oneri-uygula"]')).toBeTruthy();
    }finally{ kk.remove(); }
    expect(k.kart({ id:'p3', action:'uydurma', title:'x' })).toBe('');
    expect(k.EYLEMLER.join(',')).toBe('oneri-uygula,oneri-gec,oneri-gec-neden,oneri-onizle');
  });

  it('oz-123 «Geç» önce isteğe bağlı nedeni açar; seçilen neden modüle kayıtla gider', async () => {
    const { k, iz, satirlar } = sahte();
    const kk = sahne(k.kart(satirlar[0]));
    try{
      k.handle['oneri-gec'](kk.querySelector('[data-act="oneri-gec"]'));
      const g = kk.querySelector('[data-oz="123"]');
      expect(g).toBeTruthy();
      await k.handle['oneri-gec-neden'](g.querySelector('[data-neden="zaman-yok"]'));
      expect(iz.gec.length).toBe(1);
      expect(iz.gec[0][0]).toBe('p1');
      expect(iz.gec[0][1].neden).toBe('zaman-yok');
      await k.handle['oneri-gec-neden'](g.querySelector('[data-act="oneri-gec-neden"][data-neden=""]'));
      expect(iz.gec[1][1].neden).toBe(null);
    }finally{ kk.remove(); }
  });

  it('oz-113 büyük aksiyonun önizlemesi önce / sonra taşır; «Onayla ve uygula» pencereyi kapatıp modüle gider', async () => {
    const { k, iz, satirlar } = sahte();
    const kk = sahne(k.kart(satirlar[1]));
    try{
      const on = kk.querySelector('[data-act="oneri-onizle"]');
      expect(on).toBeTruthy();
      k.handle['oneri-onizle'](on);
      expect(iz.pencere.length).toBe(1);
      expect(iz.pencere[0].govde).toContain('data-oz="113"');
      expect(iz.pencere[0].ayak).toContain('Onayla ve uygula');
      const d = sahne(iz.pencere[0].ayak);
      try{ await k.handle['oneri-uygula'](d.querySelector('[data-act="oneri-uygula"]')); }finally{ d.remove(); }
      expect(iz.kapat).toBe(1);
      expect(iz.uygula.join(',')).toBe('p2');
    }finally{ kk.remove(); }
  });
});

})();
