/* Yedek hatırlatması — tek eşik, yerel yaş, boş sisteme sessizlik.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/yedek.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Paket üç arayüze birden yayılıyor çünkü sınadığı şey ÜÇÜNÜN ORTAK
   SÖZÜDÜR: veri kaybı geri alınamayan tek olaydır ve üç sistemin
   verisi de aynı ölçüde geri alınamaz. Ayrışma ancak üç yerde birden
   koşan bir paketle yakalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const L = () => window.LIFEOS;

describe('Yedek — eşik', () => {

  it('üç arayüzde de eşik YEDİ gündür', () => {
    /* SPİ ve ESP otuz gün diyordu. Otuz gün, hatırlatmanın kendisini
       işe yaramaz kılar: uyarı görüldüğünde zaten otuz günlük veri
       risk altında kalmıştır. */
    expect(L().YEDEK_GUN).toBe(7);
  });

  it('yedinci günde hatırlatır, altıncıda hatırlatmaz', () => {
    expect(L().yedekGerekli(6, 100)).toBe(false);
    expect(L().yedekGerekli(7, 100)).toBe(true);
    expect(L().yedekGerekli(40, 100)).toBe(true);
  });

  it('hiç yedek alınmamışsa (yaş null) hatırlatır', () => {
    expect(L().yedekGerekli(null, 100)).toBe(true);
  });
});

describe('Yedek — boş sisteme sessizlik', () => {

  it('korunacak veri yokken hatırlatmaz', () => {
    /* ESP `null` yaşı doğrudan «gerekli» sayıyordu: sistemi ilk gün
       açan kullanıcı, boş bir dosya indirmeye çağrılıyordu. */
    expect(L().yedekGerekli(null, 0)).toBe(false);
    expect(L().yedekGerekli(999, 0)).toBe(false);
    expect(L().yedekGerekli(null, L().YEDEK_ASGARI_KAYIT - 1)).toBe(false);
  });

  it('eşik kadar kayıt birikince hatırlatır', () => {
    expect(L().yedekGerekli(null, L().YEDEK_ASGARI_KAYIT)).toBe(true);
  });
});

describe('Yedek — yaş YEREL tarihten', () => {

  it('iki takvim günü arasındaki farkı verir', () => {
    expect(L().yedekYasi('2026-09-01', '2026-09-08')).toBe(7);
    expect(L().yedekYasi('2026-09-08', '2026-09-08')).toBe(0);
  });

  it('zaman damgası YEREL güne çevrilir; yaş gün sayısıdır', () => {
    /* Yaş bir GÜN SAYISIDIR, saat farkı taşımaz. Ama damga UTC'dir: ilk on
       karakteri almak, İstanbul'da (UTC+3) gece 00:00–03:00 arası alınan
       yedeği DÜNE yazıyordu (2026-09-24 düzeltmesi). Testler İstanbul
       saatiyle koşar (tools/runtests.js). */
    const b = new Date(2026, 8, 2, 1, 30);          /* yerel 2 Eylül 01:30 */
    expect(L().yedekYasi(b.toISOString(), '2026-09-02')).toBe(0);
    const d = new Date(2026, 8, 1, 23, 30);         /* yerel 1 Eylül 23:30 */
    expect(L().yedekYasi(d.toISOString(), '2026-09-02')).toBe(1);
  });

  it('yaz saati geçişinde kaymaz', () => {
    /* Bir takvim günü 23 ya da 25 saat sürebilir; iki tarih arasındaki
       GÜN farkı bundan bağımsızdır. Yerel saatle çıkarma yapan bir
       hesap burada 29 ya da 31 gösterirdi. */
    expect(L().yedekYasi('2026-03-01', '2026-03-31')).toBe(30);
    expect(L().yedekYasi('2026-10-01', '2026-10-31')).toBe(30);
  });

  it('damga yoksa null döner — sıfır DEĞİL', () => {
    /* Sıfır «bugün yedek alındı» demektir. Hiç yedek almamış birine
       bunu söylemek, eksik veriyi sıfır saymanın tam karşılığıdır. */
    expect(L().yedekYasi(null, '2026-09-08')).toBe(null);
    expect(L().yedekYasi('', '2026-09-08')).toBe(null);
  });

  it('bozuk damga sessizce bugüne düşmez', () => {
    expect(L().yedekYasi('dun', '2026-09-08')).toBe(null);
    expect(L().yedekYasi('2026-13-01', '2026-09-08')).toBe(null);
    expect(L().yedekYasi('2026-02-31', '2026-09-08')).toBe(null);
  });
});

})();
