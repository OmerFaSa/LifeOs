/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/simge.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Katalog simgesi — kimlik girer, dosya adı çıkar.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/simge.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const L = () => window.LIFEOS;

describe('Simge — ad kuralı', () => {

  it('ad KİMLİKTEN türer, ekran kurmaz', () => {
    expect(L().SIMGE_ADI('olcum', 'sbp')).toBe('olcum-sbp');
    expect(L().SIMGE_ADI('disiplin', 'lang')).toBe('disiplin-lang');
    expect(L().SIMGE_ADI('ders', 'tyt-turkce')).toBe('ders-tyt-turkce');
    expect(L().SIMGE_ADI('ders', 'ayt-biyoloji')).toBe('ders-ayt-biyoloji');
  });

  it('büyük harf küçülür — dosya adları küçüktür', () => {
    expect(L().SIMGE_ADI('olcum', 'SBP')).toBe('olcum-sbp');
  });

  it('BİLİNMEYEN aile için görsel istenmez', () => {
    /* Var olmayacağı bilinen bir dosyayı istemek, her açılışta bir
       404 demektir; bu depoda bir kez yaşandı (`rozet-N.png`). */
    expect(L().SIMGE_ADI('yok', 'sbp')).toBeNull();
    expect(L().SIMGE_HTML('yok', 'sbp')).toBe('');
  });

  it('dosya adı olamayacak kimlik REDDEDİLİR', () => {
    /* `img/marka/` ucu bir dizin gezinme kapısı değildir. */
    ['../gizli', 'a/b', 'a.b', 'a b', '', null, '-bas', 'son-'].forEach(k => {
      expect(L().SIMGE_ADI('olcum', k)).toBeNull();
    });
  });

  it('GÖRSELİ OLMAYAN kimlik istenmez', () => {
    /* Katalogda olup görseli gelmemiş bir kimlik, her açılışta bir 404
       demektir. Bir kez yaşandı: ESP katalogunda yedi disiplin var,
       teslimatta altı geldi ve `disiplin-music.webp` her açılışta
       arandı. Künye (`brand/ortak/medya.js`) `brand/medya/` altında
       GERÇEKTEN ne varsa onu yazar. */
    expect(L().MEDYA).toBeTruthy();
    expect(L().SIMGE_ADI('disiplin', 'lang')).toBe('disiplin-lang');
    expect(L().SIMGE_ADI('disiplin', 'music')).toBeNull();
    expect(L().SIMGE_HTML('disiplin', 'music')).toBe('');
    /* Yazı yine de görünür: görsel bir ektir. */
    expect(L().SIMGELI('disiplin', 'music', 'Müzik').indexOf('Müzik') >= 0)
      .toBeTruthy();
  });

  it('künye dört ailenin dördünü de tanır', () => {
    Object.keys(L().SIMGE_AILE).forEach(a => {
      expect(Array.isArray(L().MEDYA[a])).toBe(true);
    });
    /* Katalogdaki sekiz dersin sekizinin de görseli var. */
    expect(L().MEDYA.ders.length).toBe(8);
  });

  it('aile listesi `tools/marka.py` ile AYNI adları kullanır', () => {
    /* Orası dosyayı nereye koyacağını, burası ekranın neyi
       isteyebileceğini söyler. Adlar ayrışırsa istenen dosya hiçbir
       zaman bulunmaz. */
    const a = Object.keys(L().SIMGE_AILE).sort().join(',');
    expect(a).toBe('ders,disiplin,olcum,simge');
  });
});

describe('Simge — işaretleme', () => {
  const L = () => window.LIFEOS;

  it('simge bir SÜSTÜR: alt metni boş, okuyucuya görünmez', () => {
    /* Yanında duran yazı zaten aynı şeyi söylüyor; ikinci kez
       okutmak listeyi iki katı uzatmaktan başka bir şey yapmaz. */
    const h = L().SIMGE_HTML('olcum', 'hrv');
    expect(h.indexOf('alt=""') >= 0).toBeTruthy();
    expect(h.indexOf('aria-hidden="true"') >= 0).toBeTruthy();
    expect(h.indexOf('img/marka/olcum-hrv.webp') >= 0).toBeTruthy();
  });

  it('dosya yoksa DÜĞÜM KALKAR', () => {
    expect(L().SIMGE_HTML('ders', 'ayt-fizik')
      .indexOf('onerror="this.remove()"') >= 0).toBeTruthy();
  });

  it('üç ölçü vardır, dördüncüsü yoktur', () => {
    expect(L().SIMGE_HTML('olcum', 'sbp').indexOf('simge--sm') >= 0).toBeFalsy();
    expect(L().SIMGE_HTML('olcum', 'sbp', { boy:'sm' })
      .indexOf('simge--sm') >= 0).toBeTruthy();
    expect(L().SIMGE_HTML('olcum', 'sbp', { boy:'lg' })
      .indexOf('simge--lg') >= 0).toBeTruthy();
    /* Tanınmayan ölçü varsayılana düşer, uydurma bir sınıf üretmez. */
    expect(L().SIMGE_HTML('olcum', 'sbp', { boy:'devasa' })
      .indexOf('simge--devasa') >= 0).toBeFalsy();
  });

  it('kök değiştirilebilir — tek dosya sürümü için', () => {
    expect(L().SIMGE_HTML('disiplin', 'philo', { kok:'medya/' })
      .indexOf('medya/disiplin-philo.webp') >= 0).toBeTruthy();
  });

  it('SİMGELİ yazıyı KAÇIRIR', () => {
    const h = L().SIMGELI('olcum', 'temp', '<b>Ateş</b>');
    expect(h.indexOf('<b>') >= 0).toBeFalsy();
    expect(h.indexOf('&lt;b&gt;Ateş&lt;/b&gt;') >= 0).toBeTruthy();
  });

  it('SİMGELİ simge olmasa da yazıyı verir', () => {
    /* Bilinmeyen bir aile yazıyı yutmamalı: görsel bir ektir. */
    const h = L().SIMGELI('yok', 'x', 'Uyku');
    expect(h.indexOf('Uyku') >= 0).toBeTruthy();
    expect(h.indexOf('<img') >= 0).toBeFalsy();
  });
});

})();
