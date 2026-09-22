/* Kesinlik etiketi — dört etiket, dört görsel, tek kaynak.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kesinlik.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Burada sınanan şey şu: «eksik veri sıfır değildir» kuralının dört
   etiketi ekrana ÇIKIYOR mu, ve üç arayüzde AYNI mı çıkıyor. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const L = () => window.LIFEOS;

describe('Kesinlik — katalog', () => {

  it('dört etiket vardır ve kimlikleri SÖZLEŞMEDEKİ kimliklerdir', () => {
    /* Kimlikler İngilizcedir ve öyle kalır: `HKM/core/sync_engine.py`
       ile `certainty.py` tam bu dört dizeyi bekler. Türkçe olan,
       ekrana çıkan karşılıklarıdır. Buradaki bir yazım hatası, gövdeyi
       422 ile geri döndürürdü. */
    expect(L().KESINLIK.length).toBe(4);
    const kimlikler = L().KESINLIK.map(e => e.id).join(',');
    expect(kimlikler).toBe('measured,estimated,computed,missing');
  });

  it('her etiketin Türkçe adı, özeti ve görseli vardır', () => {
    L().KESINLIK.forEach(e => {
      expect(typeof e.ad).toBe('string');
      expect(e.ad.length > 0).toBeTruthy();
      expect(e.ozet.length > 0).toBeTruthy();
      expect(e.gorsel.indexOf('etiket-')).toBe(0);
    });
  });

  it('Türkçe adlar deponun her yerinde kullanılan adlardır', () => {
    /* AGENTS.md §1.2 bu dört kelimeyi sayıyor. Biri değişirse belge
       ile ekran ayrışır ve hangisinin doğru olduğu belirsizleşir. */
    const adlar = L().KESINLIK.map(e => e.ad).join(' · ');
    expect(adlar).toBe('ölçüldü · tahmin · hesaplandı · veri yok');
  });

  it('görsel adları BENZERSİZDİR', () => {
    /* İki etiket aynı dosyayı gösterirse ekranda ikisi aynı görünür
       ve etiketin anlattığı fark yok olur. */
    const gorulen = {};
    L().KESINLIK.forEach(e => {
      expect(gorulen[e.gorsel]).toBeFalsy();
      gorulen[e.gorsel] = 1;
    });
  });

  it('KESINLIK_ILE kimlikle bulur, bilmediğine null der', () => {
    expect(L().KESINLIK_ILE('measured').ad).toBe('ölçüldü');
    expect(L().KESINLIK_ILE('missing').ad).toBe('veri yok');
    expect(L().KESINLIK_ILE('yok-boyle-bir-etiket')).toBeNull();
    expect(L().KESINLIK_ILE(null)).toBeNull();
  });
});

describe('Kesinlik — işaretleme', () => {
  const L = () => window.LIFEOS;

  it('etiket hem görseli hem YAZIYI taşır', () => {
    /* Görsel bir ektir; anlamı taşıyan şey hâlâ kelimedir. Yalnız
       görsel gösteren bir etiket, dosya yüklenmediğinde hiçbir şey
       söylemezdi. */
    const h = L().KESINLIK_HTML('measured');
    expect(h.indexOf('etiket-olculdu.webp') >= 0).toBeTruthy();
    expect(h.indexOf('ölçüldü') >= 0).toBeTruthy();
    expect(h.indexOf('kesinlik--measured') >= 0).toBeTruthy();
  });

  it('görsel yüklenmezse DÜĞÜM KALKAR, yazı kalır', () => {
    /* Kırık resim simgesi göstermek, hiç göstermemekten kötüdür —
       bu deponun her görselinde aynı kural. */
    expect(L().KESINLIK_HTML('computed').indexOf('onerror="this.remove()"') >= 0)
      .toBeTruthy();
  });

  it('BİLİNMEYEN kimlikte karşılık UYDURULMAZ', () => {
    /* Sözleşme bir gün beşinci bir etiket eklerse, ekran onu
       «veri yok» ya da «ölçüldü» diye göstermemeli: anlamadığını
       anlamış gibi yapmak (AGENTS.md §1.7). Kimliğin KENDİSİ yazılır
       ve görsel hiç çizilmez. */
    const h = L().KESINLIK_HTML('yepyeni-etiket');
    expect(h.indexOf('yepyeni-etiket') >= 0).toBeTruthy();
    expect(h.indexOf('<img') >= 0).toBeFalsy();
    expect(h.indexOf('kesinlik--') >= 0).toBeFalsy();
  });

  it('metin KAÇIRILIR — etiket bir gün dışarıdan gelirse', () => {
    const h = L().KESINLIK_HTML('<script>x</script>');
    expect(h.indexOf('<script>') >= 0).toBeFalsy();
    expect(h.indexOf('&lt;script&gt;') >= 0).toBeTruthy();
  });

  it('kök değiştirilebilir — tek dosya sürümü için', () => {
    /* `merdiven({kok})` ile aynı gerekçe: dist sürümünde medya başka
       bir yerden servis edilebilir. */
    expect(L().KESINLIK_HTML('tahmin' in {} ? 'x' : 'estimated', { kok:'medya/' })
      .indexOf('medya/etiket-tahmin.webp') >= 0).toBeTruthy();
  });

  it('dört etiketin dördü de ÇİZİLEBİLİR', () => {
    /* Biri boş HTML dönerse o satır «Kaynak» sütununda sessizce
       boş kalırdı — ve boş bir kaynak sütunu, kuralın kendisini
       görünmez yapardı. */
    L().KESINLIK.forEach(e => {
      const h = L().KESINLIK_HTML(e.id);
      expect(h.length > 0).toBeTruthy();
      expect(h.indexOf(e.gorsel + '.webp') >= 0).toBeTruthy();
    });
  });
});

})();
