/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/quota.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir.
   Kaynak bir KALIPTIR: ad alanı ve depo öneki yayım
   sırasında konur (__NS__, __DEPO__, __BASLIK__). */
/* Kota yöneticisi — ücretsiz modelin sınırı aşılmaz.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/quota.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne yayılır. `ESP` yer tutucudur.

   NEDEN AYRI BİR DOSYA

   Kota testleri bugüne kadar YALNIZ AYS'de vardı ve orada da
   `office.test.js` içindeki bir ajan senaryosunun yan ürünüydü.
   SPİ ile ESP kopyalarına hiç test yazılmamıştı. Sonuç: `status()`
   içindeki bir düzeltme SPİ kopyasına yazıldı, öteki iki kopyada
   unutuldu ve hiçbir denetim söylemedi.

   Dosya artık tek kaynak; testi de tek kaynak olmalı ki üç arayüz
   AYNI sözü sınasın.

   NE SINANMAZ VE NEDEN

   Gün dönümü (`rollDay`) sınanmıyor: günlük sayaç modül kapanışında
   tutulur ve dışarıdan tarih enjekte edilecek bir uç yok. Sınanmayan
   bir şeye «temiz» demektense burada adını yazıyoruz. */

(function(){
  const { describe, it, expect } = ESP.Test;
  const Q = () => ESP.Quota;

  /* Sınırı KATALOGDAN gelen bir sağlayıcı (üç arayüzde de aynı):
     groq → rpm 30, rpd 1000. Model kimliği önemsiz: katalogda yoksa
     sağlayıcının varsayılanına düşer ve testin uygulamaya bağlanmaması
     için bilerek uydurma bir ad kullanılıyor. */
  const SINIRLI = { provider:'groq', model:'zz-sinama' };
  /* Sınırı olmayan sağlayıcı — üçünde de `limits` yok. */
  const SINIRSIZ = { provider:'custom', model:'zz-sinama' };

  function temiz(){ Q().clearOverrides(); Q().reset(); }

describe('Kota — sınır okuma', () => {

  it('BİLİNMEYEN sağlayıcı sınırsız değil, BİLİNMEYENDİR', () => {
    temiz();
    expect(Q().limitsFor({ provider:'yok', model:'x' })).toBeNull();
    expect(Q().effective({ provider:'yok', model:'x' })).toBeNull();
    temiz();
  });

  it('sınırı olmayan sağlayıcıda kuyruk devreye girmez', () => {
    temiz();
    expect(Q().effective(SINIRSIZ)).toBeNull();
    expect(Q().check(SINIRSIZ).ok).toBeTruthy();
    expect(Q().estimateMs(SINIRSIZ, 9)).toBe(0);
    temiz();
  });

  it('pay YALNIZ dakikalık sınıra uygulanır', () => {
    /* Günlük sayaçta pay düşmek, kullanıcının ücretsiz hakkının bir
       kısmını harcamadan çürütür. Dosyanın kendi yorumu bunu söylüyor;
       burası söylediğini yapıp yapmadığını sınıyor. */
    temiz();
    const e = Q().effective(SINIRLI);
    expect(e.rpm).toBe(Math.floor(30 * Q().SAFETY));
    expect(e.rpd).toBe(1000);
    expect(e.gapMs).toBe(Math.ceil(60000 / e.rpm));
    temiz();
  });

  it('bir eksen yoksa o eksende bekleme yoktur', () => {
    temiz();
    Q().setOverride('groq', { rpd:5 });      // rpm yazılmadı
    const e = Q().effective(SINIRLI);
    expect(e.rpd).toBe(5);
    expect(e.gapMs).toBe(Math.ceil(60000 / Math.floor(30 * Q().SAFETY)));
    temiz();
  });
});

describe('Kota — şema sözü', () => {

  /* Bu bölüm bir hatanın yerine konuldu. `status()` sınır
     bilinmediğinde eskiden `{ known, usedToday }` dönüyordu; çağıran
     `String(st.lastMinute)` yazınca ekranda "undefined" görünüyordu.
     Düzeltme ÜÇ KOPYANIN BİRİNE yazıldı. Sözü şudur: dönen nesnenin
     ALANLARI her iki durumda da aynıdır; bilinmeyen sayı DÜŞMEZ, NULL
     olur. */

  const ALANLAR = {
    status:['known', 'rpm', 'rpd', 'gapMs', 'lastMinute', 'usedToday',
            'remainingToday', 'full'],
    check:['ok', 'reason', 'waitMs', 'limited', 'usedToday', 'rpd', 'rpm'],
  };

  function alanlar(o){ return Object.keys(o).sort().join(','); }
  function beklenen(ad){ return ALANLAR[ad].slice().sort().join(','); }

  it('status() bilinen ve bilinmeyen sınırda AYNI alanları döner', () => {
    temiz();
    expect(alanlar(Q().status(SINIRLI))).toBe(beklenen('status'));
    expect(alanlar(Q().status(SINIRSIZ))).toBe(beklenen('status'));
    temiz();
  });

  it('check() bilinen ve bilinmeyen sınırda AYNI alanları döner', () => {
    temiz();
    expect(alanlar(Q().check(SINIRLI))).toBe(beklenen('check'));
    expect(alanlar(Q().check(SINIRSIZ))).toBe(beklenen('check'));
    temiz();
  });

  it('gün dolduğunda da alanlar düşmez', async () => {
    temiz();
    Q().setOverride('groq', { rpm:60000, rpd:1 });
    await Q().acquire(SINIRLI);
    const st = Q().check(SINIRLI);
    expect(st.reason).toBe('daily');
    expect(alanlar(st)).toBe(beklenen('check'));
    temiz();
  });

  it('BİLİNMEYEN sınır NULL yazılır, sıfır yazılmaz', () => {
    /* AGENTS.md §1.2: eksik veri sıfır değildir. Burada «sınır 0»
       demek «hiç istek yapamazsın» demek olurdu. */
    temiz();
    const st = Q().status(SINIRSIZ);
    expect(st.known).toBe(false);
    expect(st.rpm).toBeNull();
    expect(st.rpd).toBeNull();
    expect(st.remainingToday).toBeNull();
    expect(st.lastMinute).toBeNull();
    expect(st.full).toBe(false);
    /* Sayaç ise gerçek sayıdır: sistem yalnızca KENDİ saydığını bilir. */
    expect(st.usedToday).toBe(0);
    temiz();
  });

  it('acquire() sınırsız sağlayıcıda da aynı alanları döner', async () => {
    temiz();
    Q().setOverride('groq', { rpm:60000, rpd:99999 });
    const a = await Q().acquire(SINIRLI);
    const b = await Q().acquire(SINIRSIZ);
    expect(alanlar(a)).toBe(alanlar(b));
    expect(b.rpd).toBeNull();
    temiz();
  });
});

describe('Kota — aralık ve günlük sayaç', () => {

  it('ilk istek hemen geçer, ikincisi boşluk kadar bekler', async () => {
    temiz();
    expect(Q().check(SINIRLI).waitMs).toBe(0);
    await Q().acquire(SINIRLI);
    const sonra = Q().check(SINIRLI);
    expect(sonra.waitMs > 0).toBeTruthy();
    expect(sonra.waitMs <= Q().effective(SINIRLI).gapMs).toBeTruthy();
    expect(sonra.reason).toBe('rate');
    temiz();
  });

  it('gün dolunca BEKLEMEDEN hata verir', async () => {
    /* Günlük hak bittiğinde beklemek anlamsızdır: gün bitene kadar
       kapalıdır. Sessizce beklemek kullanıcıyı 20 saat oyalardı. */
    temiz();
    Q().setOverride('groq', { rpm:60000, rpd:2 });
    await Q().acquire(SINIRLI);
    await Q().acquire(SINIRLI);
    let kod = null, bekleme = null;
    const t0 = Date.now();
    try{ await Q().acquire(SINIRLI); }
    catch(e){ kod = e.code; bekleme = Date.now() - t0; }
    expect(kod).toBe('daily_quota');
    expect(bekleme < 500).toBeTruthy();
    expect(Q().status(SINIRLI).full).toBeTruthy();
    expect(Q().status(SINIRLI).remainingToday).toBe(0);
    temiz();
  });

  it('gönderilemeyen istek günlük haktan düşülmez', async () => {
    temiz();
    Q().setOverride('groq', { rpm:60000, rpd:99999 });
    await Q().acquire(SINIRLI);
    expect(Q().status(SINIRLI).usedToday).toBe(1);
    Q().release(SINIRLI);
    expect(Q().status(SINIRLI).usedToday).toBe(0);
    temiz();
  });

  it('sağlayıcı yine de 429 derse pencere kapatılır', () => {
    temiz();
    Q().penalize(SINIRLI, 30);
    expect(Q().check(SINIRLI).waitMs > 20000).toBeTruthy();
    temiz();
  });

  it('kuyruk çok uzunsa beklemek yerine söylenir', async () => {
    temiz();
    Q().penalize(SINIRLI, Math.ceil(Q().MAX_WAIT_MS / 1000) + 30);
    let kod = null;
    try{ await Q().acquire(SINIRLI); }catch(e){ kod = e.code; }
    expect(kod).toBe('rate_wait');
    temiz();
  });

  it('sayaç sağlayıcı + model + ANAHTAR başına ayrıdır', async () => {
    /* Aynı sağlayıcıya iki anahtar verildiğinde günlük hak katlanır;
       birinin dolması ötekini kapatmaz. */
    temiz();
    Q().setOverride('groq', { rpm:60000, rpd:1 });
    await Q().acquire(Object.assign({}, SINIRLI, { keyId:0 }));
    expect(Q().status(Object.assign({}, SINIRLI, { keyId:0 })).full).toBeTruthy();
    expect(Q().status(Object.assign({}, SINIRLI, { keyId:1 })).full).toBeFalsy();
    expect(Q().status(Object.assign({}, SINIRLI, { model:'zz-baska' })).full).toBeFalsy();
    temiz();
  });

  it('günlük sayaç SAYFAYI yeniler, bellekte durmaz', async () => {
    /* Dosyanın vaadi: "sayfa yenilense de kaybolmaz". Kapanışın içine
       bakamayız ama yazdığı yere bakabiliriz. */
    temiz();
    Q().setOverride('groq', { rpm:60000, rpd:99999 });
    await Q().acquire(SINIRLI);
    const ham = JSON.parse(localStorage.getItem(Q().STORE) || '{}');
    expect(Object.keys(ham.used || {}).length > 0).toBeTruthy();
    temiz();
  });

  it('bir turun süresi boşlukların toplamıdır', () => {
    temiz();
    const g = Q().effective(SINIRLI).gapMs;
    expect(Q().estimateMs(SINIRLI, 1)).toBe(0);
    expect(Q().estimateMs(SINIRLI, 5)).toBe(4 * g);
    expect(Q().estimateMs(SINIRLI, 0)).toBe(0);
    temiz();
  });
});

describe('Kota — kullanıcı düzeltmesi', () => {

  it('kullanıcı düzeltmesi katalogdan ÜSTÜNDÜR', () => {
    /* OpenRouter'da kredi yükleyen biri 50 yerine 1000 hakka sahiptir.
       Katalog bunu bilemez; kullanıcı yazar, katalog değişmez. */
    temiz();
    Q().setOverride('groq', { rpd:4000 });
    expect(Q().effective(SINIRLI).rpd).toBe(4000);
    Q().clearOverrides();
    expect(Q().effective(SINIRLI).rpd).toBe(1000);
    temiz();
  });

  it('anlamsız değer YAZILMAZ', () => {
    /* Sıfır ya da eksi bir sınır, sınır değil kilittir. */
    temiz();
    Q().setOverride('groq', { rpm:0, rpd:-5 });
    expect(Q().getOverride('groq')).toEqual({});
    Q().setOverride('groq', { rpm:'abc' });
    expect(Q().getOverride('groq')).toEqual({});
    expect(Q().effective(SINIRLI).rpd).toBe(1000);
    temiz();
  });

  it('düzeltme kalıcıdır, temizlenince iz bırakmaz', () => {
    temiz();
    Q().setOverride('groq', { rpm:7 });
    expect(JSON.parse(localStorage.getItem(Q().OVERRIDE_STORE)).groq.rpm).toBe(7);
    Q().clearOverrides();
    expect(localStorage.getItem(Q().OVERRIDE_STORE)).toBeNull();
    expect(Q().getOverride('groq')).toEqual({});
    temiz();
  });
});

})();
