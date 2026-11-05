/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ogrenmotor.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Öğrenme motoru (brand/ortak/ogrenmotor.js + ogrenmotor-ekran.js) — üç arayüzde aynı test.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ogrenmotor.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const M = () => window.LIFEOS.OGRENMOTOR, E = () => window.LIFEOS.OMEKRAN;

  const METIN = 'Fotosentez bitkilerin ışık enerjisini kimyasal enerjiye çevirmesidir. Klorofil ışığı yaprakta tutan yeşil pigmenttir. '
    + 'Stoma denilen gözenekler yaprakta gaz alışverişini sağlar. Bitkiler fotosentezde karbondioksit kullanır ve oksijen üretir. '
    + 'Glikoz fotosentezin ürettiği şekerdir ve bitki onu enerji kaynağı olarak kullanır. Klorofil az olursa yapraklar sararır.';
  const KONU = { id:'k1', ad:'Fotosentez', grup:'g1', parcalar:[{ baslik:'Işık', metin:'**Klorofil** ışığı tutan pigmenttir ve yaprakta bulunur her zaman.' }, { baslik:'Ürün', metin:'**Glikoz** bitkinin ürettiği şekerdir ve enerji kaynağıdır onun için.' }],
    ornekler:[{ soru:'Yaprak neden yeşildir?', cozum:['Klorofil yeşil ışığı yansıtır.', 'Bu yüzden yeşil görünür.'] }], hatalar:['Klorofili şekerle karıştırmak.'], terimler:['klorofil', 'glikoz', 'yaprak'],
    sorular:[0, 1, 2, 3].map(i => ({ id:'s' + i, soru:'Soru ' + i, sec:['bir', 'iki', 'üç', 'dört'], dogru:'B', cozum:['Çözüm ' + i], seviye:i < 2 ? 'temel' : 'ileri' })),
    acik:[{ id:'a0', soru:'Açık soru', yanit:'Yanıt' }], aktarim:[{ id:'t0', soru:'Yeni durum', olcut:['Ölçüt'] }] };
  let gun = '2026-11-06';
  let modelCevabi = null, cevaplar = [];
  function kur(o){
    M()._sifirla(); E()._sifirla(); cevaplar = []; gun = '2026-11-06';
    const bellek = {};
    M().kur(Object.assign({ modul:'omtest', depo:{ oku:async k => bellek[k] || null, yaz:async (k, v) => { bellek[k] = JSON.parse(JSON.stringify(v)); } },
      bugun:() => gun, konular:() => [{ id:'k1', ad:'Fotosentez', grup:'g1' }, { id:'k2', ad:'Hücre', grup:'g2' }],
      konu:id => (id === 'k1' ? KONU : id === 'k2' ? Object.assign({}, KONU, { id:'k2', ad:'Hücre' }) : null), cevapKanca:async c => { cevaplar.push(c); } }, o || {}));
    return bellek;
  }
  /* Testten sonra uygulamanın kendi kurulumu geri gelmez: sayfa kapanırken gerekmez, ama sonraki test dosyaları motoru kurulmamış görür. */

  describe('Öğrenme motoru — metinden konu (sistemde olmayan bilgi)', () => {
    it('cümle bölme: kısaltma ve ondalık cümleyi kesmez', () => {
      expect(M().cumleler('Dr. Ali geldi. Değer 3.5 oldu. Bitti').length).toBe(3);
    });
    it('terim: tekrar eden kelime en kısa biçimiyle, durak kelime yok', () => {
      const t = M().terimler(METIN);
      expect(t.some(x => /^klorofil$/i.test(x))).toBe(true);
      expect(t.some(x => /^fotosentez$/i.test(x))).toBe(true);
      expect(t.indexOf('olarak') < 0).toBe(true);
    });
    it('boşluklu soru uydurmaz: cevap ve cümle metnin kendisi, doğru seçenek geçerli, seçenekler farklı', () => {
      kur();
      const k = M().metindenKonu({ id:'x', ad:'Fotosentez', metin:METIN });
      expect(k.sorular.length > 0).toBe(true);
      k.sorular.forEach(q => {
        expect(q.soru).toContain('_____');
        const dogru = q.sec['ABCDE'.indexOf(q.dogru)];
        expect(q.soru.replace('_____', dogru)).toBe(q.cozum[0]);
        expect(METIN).toContain(q.cozum[0]);
        expect(new Set(q.sec).size).toBe(q.sec.length);
      });
      expect(M().denetle(k)).toEqual([]);
    });
    it('aynı metin aynı soruları verir (kimlik kararlı, kayıtlar kaymaz)', () => {
      kur();
      const a = M().metindenKonu({ id:'x', ad:'F', metin:METIN }), b = M().metindenKonu({ id:'x', ad:'F', metin:METIN });
      expect(a.sorular.map(q => q.id + q.dogru)).toEqual(b.sorular.map(q => q.id + q.dogru));
    });
    it('tanım cümlesinin öznesi tek geçse de terimdir ve sorulur', () => {
      kur();
      const t = 'Geri yayılım, hatayı katmanlar boyunca geriye taşıyarak ağırlıkları güncelleyen yöntemdir. Düzenlileştirme, aşırı uyumu azaltan tekniklerin genel adıdır. Bir ağda nöron adı verilen birimler bulunur her katmanda. Ağırlık bağlantının gücünü gösteren sayıdır ve ağırlık öğrenilir.';
      const l = M().terimler(t);
      ['Geri yayılım', 'Düzenlileştirme', 'nöron'].forEach(x => expect(l.indexOf(x) >= 0).toBe(true));
      const q = M().boslukSorulari(t);
      expect(q.some(x => x.soru.indexOf('_____, hatayı katmanlar') === 0)).toBe(true);
    });
    it('fiil biçimli kelime terim olmaz; sayılı cevaba sayısız çeldirici gelmez', () => {
      kur();
      const t = M().terimler('Formu kontrol etmek gerekir ve bunu kaydediyor. Kişi kaydediyor, sonra yine kaydediyor. Yürüyüş kolaydır, yürüyüş iyi gelir.');
      expect(t.some(x => /^kayded/i.test(x))).toBe(false);
      const q = M().boslukSorulari('Sabah **5 km** koşan biri yorgun olur her zaman evet. **Koşu** sağlıklı bir etkinlik sayılır bence hep. **Yürüyüş** kolay bir etkinlik sayılır bence hep. **Yüzme** yararlı bir etkinlik sayılır bence hep.', { terimler:['5 km', 'Koşu', 'Yürüyüş', 'Yüzme'] });
      expect(q.some(x => x.cozum[0].indexOf('5 km') >= 0 && x.soru.indexOf('_____') >= 0 && x.soru.indexOf('5 km') < 0)).toBe(false);
    });
    it('yazılmış içerik: yalnız kalın terim sorulur, kalın yoksa boşluklu soru üretilmez', () => {
      kur();
      const y = M().tamamla({ id:'y', ad:'Y', parcalar:[{ baslik:'B', metin:'Kas kısa sürede güçlenir ama tendon daha uzun sürede uyum sağlar her zaman.', dikkat:'Birden artırma.' }] });
      expect(y.sorular).toEqual([]);
      expect(y.acik[0].yanit).toBe('Birden artırma.');
      expect(y.hatalar).toEqual(['Birden artırma.']);
    });
    it('çeldirici yetmezse soru yok, uydurulmaz', () => {
      kur();
      expect(M().boslukSorulari('Klorofil yeşildir ve yaprakta bulunur her zaman orada.', { terimler:['Klorofil'] })).toEqual([]);
    });
    it('kendi konu: eklenir, metinsizken öğrenilecek bir şey yok, metin ve kendi sorusuyla çalışır, silinince kaydı gider', async () => {
      const bellek = kur();
      const r = await M().atolyeEkle({ ad:'Kuantum dolanıklık' });
      expect(r.ok).toBe(true);
      expect(M().konu(r.id).yeterli).toBe(false);
      await M().atolyeGuncelle(r.id, { soru:{ soru:'Dolanıklık nedir?', yanit:'Bağlı durum' } });
      expect(M().konu(r.id).acik.length).toBe(1);
      await M().atolyeGuncelle(r.id, { metin:METIN, kaynak:'metin' });
      expect(M().konu(r.id).sorular.length > 0).toBe(true);
      expect(M().konu(r.id).etiket).toBe('senin metnin');
      await M().yukle();
      expect(M().atolyeOf(r.id).ad).toBe('Kuantum dolanıklık');
      await M().cevapYaz({ konu:r.id, soru:'k0', isabet:true });
      await M().atolyeSil(r.id);
      expect(M().konu(r.id)).toBe(null);
      expect(M().kanitlar(r.id)).toEqual([]);
      expect(bellek['meta/omAtolye']).toEqual([]);
    });
    it('sistemde olan konu bulunur; olmayan bulunmaz', () => {
      kur();
      expect(M().ara('fotosentez').id).toBe('k1');
      expect(M().ara('kuantum dolanıklık')).toBe(null);
    });
    it('sağlam kaynak bağlantısı: konu adı kodlanır', () => {
      kur();
      expect(M().kaynakBul('a b&c')).toContain('search=a%20b%26c');
    });
  });

  describe('Öğrenme motoru — kanıt ve aşama', () => {
    it('hiç kanıt yok: veri yok; ön tahmin kanıt değildir', async () => {
      kur();
      expect(M().asama('k1').id).toBe('yok');
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:false, on:true });
      expect(M().asama('k1').id).toBe('yok');
      expect(M().kanitlar('k1')).toEqual([]);
      expect(cevaplar.length).toBe(0);
    });
    it('günde tek kanıt: üçte iki doğru isabet, tek yanlış zinciri kesmez', async () => {
      kur();
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:true });
      await M().cevapYaz({ konu:'k1', soru:'s1', isabet:true });
      await M().cevapYaz({ konu:'k1', soru:'s2', isabet:false });
      expect(M().kanitlar('k1')).toEqual([{ g:'2026-11-06', isabet:true }]);
    });
    it('emin olup yanılmak kritik; ipuçlu gün aşama kazandırmaz', async () => {
      kur();
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:false, guven:'emin' });
      expect(M().asama('k1').kritik).toBe(true);
      await M().cevapYaz({ konu:'k2', soru:'s0', isabet:true, ipucu:true });
      expect(M().kanitlar('k2')[0].ipucu).toBe(true);
    });
    it('modülün kendi kanıtı da sayılır', () => {
      kur({ ekKanit:id => (id === 'k1' ? [{ g:'2026-11-01', isabet:true }, { g:'2026-11-05', isabet:true, karisik:true }] : []) });
      expect(M().kanitlar('k1').length).toBe(2);
      expect(M().asama('k1').id).toBe('tutuyor');
    });
    it('aralık ve aşama: yedi gün arayla iki doğru kalıcı; aynı gün tekrar sayılmaz', async () => {
      kur();
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:true });
      await M().cevapYaz({ konu:'k1', soru:'s1', isabet:true });
      expect(M().asama('k1').id).toBe('tutuyor');
      gun = '2026-11-14';
      await M().cevapYaz({ konu:'k1', soru:'s2', isabet:true });
      expect(M().asama('k1').id).toBe('kalici');
    });
    it('kayıt depoya gider ve yeniden yüklenir', async () => {
      kur();
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:true });
      await M().notYaz('k1', 'anlat', 'kendi cümlem');
      await M().hataYaz('k1', 'islem');
      await M().yukle();
      expect(M().kanitlar('k1').length).toBe(1);
      expect(M().notlar('k1', 'anlat')[0].m).toBe('kendi cümlem');
      expect(M().hataOzet().islem).toBe(1);
    });
    it('hiç hata işareti yoksa dağılım yok (veri yok)', () => {
      kur();
      expect(M().hataOzet()).toBe(null);
    });
  });

  describe('Öğrenme motoru — sıra', () => {
    it('yeni başlayana sıradaki konu, tekrar yok', () => {
      kur();
      const o = M().oneri();
      expect(o.tur).toBe('yeni');
      expect(o.konu).toBe('k1');
      expect(M().gunluk().length).toBe(0);
    });
    it('bugün sınanan bugün tekrar gelmez; ertesi gün tutmayan, sonra vadesi gelen gelir', async () => {
      kur();
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:false });
      expect(M().gunluk().length).toBe(0);
      gun = '2026-11-07';
      expect(M().gunluk().map(x => x.id)).toEqual(['k1']);
      expect(M().oneri().tur).toBe('tekrar');
      await M().cevapYaz({ konu:'k1', soru:'s1', isabet:true });
      await M().cevapYaz({ konu:'k1', soru:'s2', isabet:true });
      gun = '2026-11-08';
      expect(M().gunluk().map(x => x.id)).toEqual(['k1']);
    });
    it('ön koşul: kaydı oturmamış olan önerilir, oturan önerilmez', async () => {
      kur();
      const k = { onKosul:['k2', 'yok-boyle'] };
      expect(M().onKosullar(k).map(x => x.id)).toEqual(['k2']);
      await M().cevapYaz({ konu:'k2', soru:'s0', isabet:true });
      expect(M().onKosullar(k)).toEqual([]);
    });
  });

  describe('Öğrenme motoru — soru seçimi (ölçülü zorluk)', () => {
    it('yeni konuda temel önce; bugün cevaplanan gelmez; yanlış yapılan öne geçer', async () => {
      kur();
      const k = M().konu('k1');
      expect(M().soruSec(k, 2, { kapali:true }).every(q => q.seviye === 'temel')).toBe(true);
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:false });
      expect(M().soruSec(k, 4, { kapali:true }).some(q => q.id === 's0')).toBe(false);
      gun = '2026-11-07';
      expect(M().soruSec(k, 1, { kapali:true })[0].id).toBe('s0');
    });
    it('kalıcı olmuş konuda ileri seviye önce gelir', async () => {
      kur();
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:true });
      gun = '2026-11-14';
      await M().cevapYaz({ konu:'k1', soru:'s1', isabet:true });
      gun = '2026-11-30';
      expect(M().soruSec(M().konu('k1'), 1, { kapali:true })[0].seviye).toBe('ileri');
    });
    it('açık soru varsa yoklamaya bir tanesi girer', () => {
      kur();
      expect(M().soruSec(M().konu('k1'), 3).some(q => q.id === 'a0')).toBe(true);
      expect(M().soruSec(M().konu('k1'), 1)[0].id === 'a0').toBe(false);
    });
  });

  describe('Öğrenme motoru — akış', () => {
    it('yeni konu: önce tahmin, sonra anlatım ve açıklama, örnek, yoklama, anlatma, aktarım, son', () => {
      kur();
      const t = M().seans('k1').adimlar.map(a => a.t);
      expect(t[0]).toBe('tahmin');
      expect(t.indexOf('parca') < t.indexOf('ornek')).toBe(true);
      expect(t).toContain('acikla');
      expect(t.indexOf('ornek') < t.indexOf('yokla')).toBe(true);
      expect(t.indexOf('yokla') < t.indexOf('anlat')).toBe(true);
      expect(t).toContain('aktar');
      expect(t[t.length - 1]).toBe('bitir');
    });
    it('tahmin edilen soru yoklamada yeniden sorulmaz', () => {
      kur();
      const a = M().seans('k1').adimlar, ilk = a[0].q.id;
      expect(a.filter(x => x.t === 'yokla').some(x => x.q.id === ilk)).toBe(false);
    });
    it('anlatım biçimi: önce örnek ve kısa özet akışı değiştirir', () => {
      kur();
      const o = M().seans('k1', 'ogren', 'ornek').adimlar.map(a => a.t);
      expect(o.indexOf('ornek') < o.indexOf('parca')).toBe(true);
      const z = M().seans('k1', 'ogren', 'ozet').adimlar.map(a => a.t);
      expect(z).toContain('ozet');
      expect(z.indexOf('parca') < 0).toBe(true);
    });
    it('tekrar: önce aklında kalanı yaz, anlatım yok', () => {
      kur();
      const t = M().seans('k1', 'tekrar').adimlar.map(a => a.t);
      expect(t[0]).toBe('bosalt');
      expect(t.indexOf('parca') < 0).toBe(true);
    });
    it('yanlış: hemen onarım; benzer soru ara vererek ve başka soruyla gelir', async () => {
      kur();
      const s = M().seans('k1', 'tekrar');
      M().ilerle(s);
      const q = M().adimOf(s).q;
      await M().isle(s, { isabet:false, harf:'A', guven:'emin' });
      expect(s.adimlar[s.i + 1].t).toBe('onar');
      const benzer = s.adimlar.filter((a, i) => i > s.i + 1 && a.onarimli);
      expect(benzer.length).toBe(1);
      expect(benzer[0].q.id === q.id).toBe(false);
      /* Araya en az bir yoklama girer. */
      expect(s.adimlar[s.i + 2].onarimli).toBe(undefined);
    });
    it('onarım sorusunda ikinci yanlış sonsuz döngü yapmaz', async () => {
      kur();
      const s = M().seans('k1', 'tekrar');
      s.adimlar.splice(1, 0, { t:'yokla', q:KONU.sorular[0], onarimli:true });
      s.i = 1;
      const uzun = s.adimlar.length;
      await M().isle(s, { isabet:false });
      expect(s.adimlar.length).toBe(uzun);
    });
    it('karışık tekrar: konu başına soru, kanıt karışık işaretli', async () => {
      kur();
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:false });
      await M().cevapYaz({ konu:'k2', soru:'s0', isabet:false });
      gun = '2026-11-07';
      const s = M().karma();
      expect(s.adimlar.filter(a => a.t === 'yokla').length).toBe(2);
      await M().isle(s, { isabet:true });
      expect(M().kanitlar(s.adimlar[0].konu.id).some(k => k.karisik)).toBe(true);
    });
    it('vadesi gelen yoksa karışık tekrar yok', () => {
      kur();
      expect(M().karma()).toBe(null);
    });
    it('sonuç kodla: soru yoksa etiket «veri yok»', () => {
      kur();
      const s = M().seans('k1');
      expect(M().sonuc(s).etiket).toBe('veri yok');
      expect(M().sonuc(s).konular[0].asama).toBe('yok');
    });
    it('kapsam: terim ek alsa da geçer, geçmeyen söylenir', () => {
      kur();
      const r = M().kapsam('Klorofilin görevi ışığı tutmaktır, yapraklarda bulunur.', ['klorofil', 'glikoz', 'yaprak']);
      expect(r.gecen).toEqual(['klorofil', 'yaprak']);
      expect(r.gecmeyen).toEqual(['glikoz']);
      expect(r.etiket).toBe('hesaplandı');
    });
  });

  describe('Öğrenme motoru — model isteğe bağlıdır', () => {
    it('model yokken düğmesi yok, istek reddedilir, akış aynı', async () => {
      kur();
      expect(M().modelVar()).toBe(false);
      expect((await M().yenidenAnlat(KONU, 'metin', 'sade')).neden).toBe('model');
      expect((await M().modelTaslak('x')).neden).toBe('model');
      E().ac('k1');
      await E().tikla('ogren');
      while(M().adimOf(E().durum().s).t !== 'parca') await E().tikla('devam');
      await E().tikla('anlamadim');
      const h = E().html();
      expect(h).toContain('Klorofili şekerle');
      expect(h.indexOf('anlat-tur') < 0).toBe(true);
    });
    it('kaynakta olmayan sayı getiren cevap gösterilmez', async () => {
      kur({ model:async () => modelCevabi });
      modelCevabi = 'Klorofil yeşildir ve %90 oranında ışık tutar, bunu bilmek gerekir.';
      expect((await M().yenidenAnlat(KONU, 'Klorofil yeşildir.', 'sade')).neden).toBe('sayi');
      modelCevabi = 'Klorofil yaprağın yeşil boyasıdır ve ışığı yakalar.';
      const r = await M().yenidenAnlat(KONU, 'Klorofil yeşildir.', 'sade');
      expect(r.ok).toBe(true);
      expect(r.etiket).toContain('doğrulanmadı');
    });
    it('taslak metinden konu kurar, soruyu kod çıkarır, model etiketi kalır', async () => {
      kur({ model:async () => METIN });
      const a = await M().atolyeEkle({ ad:'Bitkiler' });
      const t = await M().modelTaslak('Bitkiler');
      await M().atolyeGuncelle(a.id, { metin:t.metin, kaynak:'model' });
      const k = M().konu(a.id);
      expect(k.etiket).toContain('doğrulanmadı');
      k.sorular.forEach(q => expect(METIN).toContain(q.cozum[0]));
    });
    it('taslaktaki başlık satırı atılır, içerik kalır', async () => {
      kur({ model:async () => '**Fotosentez Nedir?**\n\n# Başlık\nFotosentez bitkilerin **enerji** üretmesidir ve bu süreç yaprakta gerçekleşir, ışık gerekir her zaman.' });
      const t = await M().modelTaslak('Fotosentez');
      expect(t.ok).toBe(true);
      expect(t.metin.indexOf('Nedir') < 0).toBe(true);
      expect(t.metin.indexOf('Başlık') < 0).toBe(true);
      expect(t.metin).toContain('**enerji**');
    });
    it('model cevap vermezse ölmez', async () => {
      kur({ model:async () => null });
      expect((await M().yenidenAnlat(KONU, 'Klorofil yeşildir.', 'sade')).ok).toBe(false);
      expect((await M().modelTaslak('x')).ok).toBe(false);
    });
  });

  describe('Öğrenme motoru — ekran', () => {
    it('kurulmamışken boş; ana ekranda öneri ve liste', () => {
      M()._sifirla(); E()._sifirla();
      expect(E().html()).toBe('');
      kur();
      const h = E().html();
      expect(h).toContain('data-om-kok');
      expect(h).toContain('Fotosentez');
      expect(h).toContain('data-om="konu:k1"');
    });
    it('Bugün satırı konu listesini istemez (tembel veri açılışta çalışmasın); sayı listeyle aynı', async () => {
      let istek = 0;
      kur({ konular:() => { istek++; return [{ id:'k1', ad:'Fotosentez', grup:'g1' }]; } });
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:false });
      gun = '2026-11-07';
      istek = 0;
      expect(M().tekrarSayisi()).toBe(1);
      expect(E().bugunSatiri()).toContain('1 konu');
      expect(istek).toBe(0);
      expect(M().gunluk().length).toBe(1);
    });
    it('Bugün satırı yalnız tekrar varken', async () => {
      kur();
      expect(E().bugunSatiri()).toBe('');
      await M().cevapYaz({ konu:'k1', soru:'s0', isabet:false });
      gun = '2026-11-07';
      expect(E().bugunSatiri()).toContain('1 konu tekrar');
    });
    it('baştan sona seans: cevap kayda geçer, modül kancası çalışır, aşama hesaplanır', async () => {
      kur();
      E().ac('k1');
      expect(E().html()).toContain('data-om="ogren"');
      await E().tikla('ogren');
      /* Tahmin: seçenek tıklanınca hemen açılır ve ölçüm olmaz. */
      await E().tikla('sec:A');
      expect(M().kanitlar('k1')).toEqual([]);
      expect(E().html()).toContain('Doğrusu');
      let koruma = 60;
      while(M().adimOf(E().durum().s).t !== 'bitir' && koruma--){
        const a = M().adimOf(E().durum().s);
        if(a.t === 'yokla' && a.q.sec){ await E().tikla('sec:B'); await E().tikla('cevap:emin'); }
        else if(a.t === 'yokla' || a.t === 'aktar'){ await E().tikla('karsilastir'); await E().tikla('oz:1'); }
        await E().tikla('devam');
      }
      expect(koruma > 0).toBe(true);
      expect(M().asama('k1').id).toBe('tutuyor');
      expect(cevaplar.length >= 3).toBe(true);
      expect(cevaplar[0].harf).toBe('B');
      expect(E().html()).toContain('Tutuyor');
    });
    it('güven işareti olmadan cevap verilemez; yanlış cevapta onarım çizilir', async () => {
      kur();
      E().ac('k1');
      await E().tikla('tekrar');
      await E().tikla('devam');
      await E().tikla('cevap:emin');
      expect(M().kanitlar('k1')).toEqual([]);
      await E().tikla('sec:A');
      expect(E().html()).toContain('Ne kadar eminsin');
      await E().tikla('cevap:emin');
      await E().tikla('devam');
      const h = E().html();
      expect(h).toContain('Hatayı onar');
      expect(h).toContain('Emin olup yanıldın');
      await E().tikla('hata:kavram');
      expect(M().hataOzet().kavram).toBe(1);
      await E().tikla('hata:islem');
      expect(M().hataOzet().kavram).toBe(1);
    });
    it('başkasına anlat: terimleri sayar, yazılan kayda geçer', async () => {
      kur();
      const s = M().seans('k1');
      s.i = s.adimlar.findIndex(a => a.t === 'anlat');
      E().durum().s = s; E().durum().kip = 'seans';
      E().yazIsle('adim', 'Klorofil yaprakta ışığı tutar.');
      await E().tikla('kapsam');
      expect(E().html()).toContain('glikoz');
      await E().tikla('devam');
      expect(M().notlar('k1', 'anlat')[0].m).toContain('Klorofil');
    });
    it('kullanıcı metni kaçırılır', async () => {
      kur();
      E().yazIsle('yeni-ad', '<img src=x>');
      expect(E().html().indexOf('<img src=x>') < 0).toBe(true);
      const a = await M().atolyeEkle({ ad:'<b>kötü</b>', metin:'<script>x</script> Birinci cümle burada yazılı olarak duruyor ve devam ediyor. İkinci cümle de burada yazılı olarak duruyor.' });
      E().ac(a.id);
      expect(E().html().indexOf('<b>kötü</b>') < 0).toBe(true);
      await E().tikla('ogren');
      while(M().adimOf(E().durum().s).t !== 'parca') await E().tikla('devam');
      expect(E().html().indexOf('<script>') < 0).toBe(true);
    });
    it('kendi konu ekranı: sistemde varsa önce onu önerir, silme iki adım', async () => {
      kur();
      E().yazIsle('yeni-ad', 'Fotosentez');
      await E().tikla('yeni-ac');
      expect(E().html()).toContain('Bu konu sistemde var');
      await E().tikla('yeni-zorla');
      const id = E().durum().id;
      expect(E().html()).toContain('Kaynak ara');
      await E().tikla('sil');
      expect(M().atolyeOf(id) != null).toBe(true);
      await E().tikla('sil-evet');
      expect(M().atolyeOf(id)).toBe(null);
    });
  });

  /* Modülün gerçek içeriği: her konu açılır, plan kurulur, biçim temiz; sonra uygulamanın kurulumu geri gelir. */
  describe('Öğrenme motoru — modülün bağlantısı', () => {
    const NS = window.R || window.SP || window.ESP;
    it('bütün konular açılıyor, biçim temiz, en az bir sınama var', () => {
      M()._sifirla(); E()._sifirla();
      NS.Screens.ogrenme.hazirla();
      const l = M().konular();
      expect(l.length > 20).toBe(true);
      const kusur = [];
      l.forEach(x => {
        const k = M().konu(x.id);
        if(!k){ kusur.push(x.id + ': açılmadı'); return; }
        M().denetle(k).forEach(h => kusur.push(h));
        if(!(k.sorular.length + k.acik.length + k.aktarim.length)) kusur.push(x.id + ': sınama yok');
        const a = M().seans(x.id).adimlar;
        if(a[a.length - 1].t !== 'bitir') kusur.push(x.id + ': plan bitmiyor');
        k.sorular.filter(q => q.uretilen).forEach(q => {
          const d = q.sec['ABCDE'.indexOf(q.dogru)];
          if(q.soru.replace('_____', d) !== q.cozum[0]) kusur.push(x.id + ': boşluk cümlesi tutmuyor');
        });
      });
      expect(kusur).toEqual([]);
    });
    it('kimlikler tek', () => {
      const l = M().konular().map(x => x.id);
      expect(new Set(l).size).toBe(l.length);
    });
  });
})();
