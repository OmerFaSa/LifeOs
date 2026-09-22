/* YEDEK HATIRLATMASI — kuralın kendisi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/yedek.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   ==================================================================

   NEDEN TEK KAYNAK

   Üç arayüz aynı vaadi ÜÇ AYRI BİÇİMDE veriyordu ve bu ölçüldü:

     AYS    7 gün · GÜNLÜK EKRANDA, her açılışta görünür
     SPİ   30 gün · yalnız rehber sayfasındaki bir rozette
     ESP   30 gün · yalnız profil sayfasında, üstelik yaşı UTC'den

   Veri kaybı bu sistemde geri alınamayan TEK olaydır ve üç sistemin
   verisi de aynı ölçüde geri alınamaz. Üç ayrı eşik, üçünün de ayrı
   ayrı düşünüldüğü anlamına gelmiyordu: biri düşünülmüş, ikisi
   kopyalanırken unutulmuştu. `quota.js`'te aynısı yaşandı — bir
   düzeltme bir kopyaya yazıldı, iki kopyada unutuldu ve üç ay boyunca
   hiçbir denetim söylemedi.

   EŞİK NEDEN YEDİ

   Bir haftalık kayıp yeniden girilebilir, bir aylık kayıp girilemez.
   Otuz gün hatırlatmanın kendisini işe yaramaz kılıyordu: kullanıcı
   uyarıyı gördüğünde zaten otuz günlük veri risk altında kalmış
   oluyordu. Hatırlatma, kaybı ÖNLEYECEK kadar erken gelmelidir.

   YAŞ YEREL TARİHTEN HESAPLANIR

   ESP `Date.now() - new Date(at)` ile ölçüyordu. UTC damgası yerel
   tarihten farklı bir güne düşebilir: UTC+3'te gece yarısından sonra
   alınan bir yedek ertesi gün "iki gün önce" görünür. AYS'nin
   `markBackup` yorumu tam bu tuzağı yazmıştı ama ESP kopyasına hiç
   geçmemişti.

   İki tarih de UTC'ye SABİTLENEREK çıkarılır. Amaç UTC'ye geçmek değil,
   yaz saati geçişinde 23 ya da 25 saatlik bir günün sayıyı kaydırmasını
   önlemek: iki takvim günü arasındaki fark, o günlerin kaç saat
   sürdüğünden bağımsızdır.

   HENÜZ KORUNACAK VERİ YOKKEN HATIRLATILMAZ

   Sıfır kayıtlı bir sisteme «yedek al» demek, sistemi ilk gün açan
   kullanıcıyı boş bir dosya indirmeye çağırmaktır. ESP `null` yaşı
   doğrudan «gerekli» sayıyordu ve ilk açılışta uyarı gösteriyordu.
   Eşik AYS'den geliyor ve ölçülmüş bir sayı değil bir karardır: beş
   kayıt, «bu sistemi kullanmaya başladım» demenin en düşük karşılığı.

   BU DOSYA DEPOYA DOKUNMAZ

   Yalnız KURAL burada. Damganın hangi anahtarda durduğu (`lastBackupAt`,
   `lastBackup`) ve kayıtların nasıl sayıldığı her sistemin kendi
   `state.js`'inde kalır — üç sistemin verisi birbirine benzemez ve
   benzetilmeye çalışılması, üçünü tek kalıba sokmak olurdu. */

window.LIFEOS = window.LIFEOS || {};

/* Kaç günde bir hatırlatılır. */
LIFEOS.YEDEK_GUN = 7;

/* Bu kadar kayıt birikmeden hatırlatılmaz. */
LIFEOS.YEDEK_ASGARI_KAYIT = 5;

/* Son yedeğin yaşı GÜN olarak; damga yoksa null («hiç yedek alınmadı»).

   `damga` bir ISO tarih (YYYY-MM-DD) ya da ISO zaman damgası olabilir;
   ikisinde de yalnız tarih kısmı kullanılır. `bugun` çağıranın YEREL
   bugünüdür (`U.todayISO()`); buraya elle bir tarih verilmesi testlerin
   saatten bağımsız koşabilmesi içindir. */
LIFEOS.yedekYasi = function(damga, bugun){
  const gun = function(x){
    const g = String(x || '').slice(0, 10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(g)) return null;
    const t = Date.UTC(+g.slice(0, 4), +g.slice(5, 7) - 1, +g.slice(8, 10));
    /* Bozuk bir tarih (2026-02-31) sessizce kaymasın: geri çevirip
       aynı günü gösterdiğini doğrula. Geçersiz bir damgayı "0 gün
       önce" saymak, hiç yedek almamış birine yedeği varmış gibi
       göstermek demekti. */
    return new Date(t).toISOString().slice(0, 10) === g ? t : null;
  };
  const a = gun(damga);
  const b = gun(bugun);
  if(a === null || b === null) return null;
  return Math.floor((b - a) / 86400000);
};

/* Hatırlatma gösterilsin mi.

   `yas` null ise hiç yedek alınmamıştır — kayıt varsa bu en acil
   durumdur. `kayit` sistemin kendi saydığı kayıt sayısıdır. */
LIFEOS.yedekGerekli = function(yas, kayit){
  if((kayit || 0) < LIFEOS.YEDEK_ASGARI_KAYIT) return false;
  return yas === null || yas >= LIFEOS.YEDEK_GUN;
};
