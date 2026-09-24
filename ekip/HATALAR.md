# Hatalar — bütün sistemin taraması (2026-09-24)

> Bu belge bir **bulgu listesidir**, düzeltme değil. Tarama sırasında
> depoda hiçbir kod değiştirilmedi. Denemeler geçici bir veritabanında,
> geçici bir tarayıcı profilinde ve depo dışındaki betiklerle yapıldı.
>
> Taban: `main` `f90cdb9`. Biçim AGENTS.md §4:
> `dosya:satır · ne yanlış · hangi girdide bozulur · nasıl doğrulanır`.

## Nasıl bakıldı

1. **Bütün denetimler koşturuldu.** Hepsi yeşil: AYS 1675/1675, SPİ
   1307/1307, ESP 1342/1342, HKM 584/584 test; üç sistemde duman,
   erişilebilirlik, düzen, palet ve başarım; tek kaynak denetimleri,
   marka künyesi, HKM `perf` ve `yuz`, `tools/entegre.js`. Aşağıdaki
   hataların **hiçbirini** mevcut denetimler yakalamıyor.
2. **Statik analiz.** Üç arayüzde eslint (tanımsız referans, yinelenen
   anahtar, sabit koşul vb.), HKM'de ruff.
3. **HKM'ye canlı deneme.** Daemon geçici bir ambarla ayağa kaldırıldı;
   bütün uçlara bozuk gövde, bozuk tarih ve uç değerler gönderildi.
4. **Tarayıcıda tıklama taraması.** Üç arayüzde her ekranın her eylem
   düğmesine ve açılan alt sayfalardaki düğmelere basıldı (AYS'de 764,
   SPİ'de 157, ESP'de 235 tıklama). Sayfa hatası ve ekrana sızan
   `undefined`/`NaN` arandı.
5. **Kod okuma.** Sayı üreten ve veri taşıyan katmanlar: işaret, depo,
   içe aktarma, öneri/geri alma, HKM karar zinciri, ikiz, seri, etki,
   yedek, hafıza.

**Doğrulama düzeyleri:** *tarayıcıda* (gerçek uygulamada koşturuldu) ·
*canlı* (HKM daemon'una istek atıldı) · *Python* (HKM işlevi doğrudan
çağrıldı) · *okuma* (kod yolu satır satır izlendi, koşturulmadı).

## Özet

| # | Önem | Sistem | Bulgu | Doğrulama |
|---|---|---|---|---|
| Y1 | yüksek | HKM | Geri yükleme bozuk yedekle ambarı boşaltıp «ok» diyor | canlı |
| Y2 | yüksek | HKM + AYS | Sınav geçince her gün «Sınava −N gün kaldı» önerisi; alt sıralar susuyor | Python |
| Y3 | yüksek | HKM | Etki ölçümü aynı günün gönderimlerini ayrı ölçüm sayıyor | Python |
| Y4 | yüksek | SPİ + HKM | Tek bir «ağrı/enerji» girdisi en üst sıradaki kırmızı bayrağı tetikliyor | okuma |
| Y5 | yüksek | ESP + HKM | Geçmiş gönderimi 422 alıp hiçbir gün göndermeden duruyor | Python + okuma |
| Y6 | yüksek | AYS + SPİ | «Geri al» sonraki kayıtları siliyor, geri alınanı diriltiyor | tarayıcı |
| Y7 | yüksek | HKM + SPİ/AYS | HKM profil bilmiyor: iki kişinin verisi, hafızası, yedeği karışıyor | okuma |
| Y8 | yüksek | üç arayüz | HKM onay kartı tam yedeğin gittiğini söylemiyor | okuma |
| O1 | orta | HKM | İkiz aynı günün gönderimlerini ayrı nokta sayıyor (%400 kapsama) | Python |
| O2 | orta | HKM | Tek günlük «seri» brifinge «bitti» diye düşüyor | Python |
| O3 | orta | üç arayüz | Geri alma kopyası yazılamazsa eski kopya kalıyor | okuma |
| O4 | orta | üç arayüz | Depo doluluğu yalnız etkin profilin anahtarından ölçülüyor | okuma |
| O5 | orta | SPİ | Toparlanma tabanı hep bugüne göre; geçmiş günler yanlış | okuma |
| O6 | orta | AYS | «Günün sorusu» dört ayrı tanımla sayılıyor | okuma |
| O7 | orta | HKM | Eşitleme, eksik hafıza kaydını kalıcı «unutuldu» yapıyor | okuma |
| O8 | orta | HKM | Bozuk girdide 30'dan fazla uç cevap vermeden bağlantıyı koparıyor | canlı |
| D1–D14 | düşük | çeşitli | Aşağıda | çeşitli |
| B1–B4 | belge | çeşitli | Elle yazılmış sayı ve iddialar eskimiş | okuma |
| K1 | koşullu | HKM | Saat dilimi yok; sunucuda 3 saat kayma | okuma |

---

## Yüksek

### Y1 · HKM geri yükleme, bozuk ya da eski şemalı yedekle ambarı boşaltıp «ok» diyor

- `HKM/core/db.py:1065` · Yazılacak sütunlar yalnız **ilk satırın**
  anahtarlarından seçiliyor. Eşleşen sütun yoksa tablo sessizce atlanıyor
  (`continue`). `replace:true` ise tablolar zaten silinmiş durumda.
  Sonuç: ambar boş, cevap `{"ok": true, "written": {}}`. Manifesto
  denetimi satır *sayısına* baktığı için geçiyor.
- **Bozulduğu girdi:** satırları beklenen sütun adlarını taşımayan bir
  yedek. Örneğin sütunları yeniden adlandırılmış eski bir şemadan alınmış
  yedek ya da elle düzenlenmiş bir dosya. Aynı yol, ilk satırda olmayan
  sütunları sonraki satırlardan da sessizce düşürüyor.
- **Hafifleten:** üstüne yazmadan önce `hkm-oncesi-*.db` kopyası alınıyor,
  veri elle kurtarılabilir. Ama API ve yüz «başarılı» diyor.
- **Doğrulama (canlı):** bir olay yaz, sonra
  `POST /api/restore {"backup":{"__meta":{"app":"hkm","schema":1,"tables":{"raw_events":1}},"raw_events":[["x"]]},"replace":true}`
  → 200 `ok:true`, `raw_events` boş.

### Y2 · Sınav tarihi geçince HKM her gün «Sınava −N gün kaldı» diyor ve öteki önerileri susturuyor

- `HKM/core/precedence.py:55` · `days <= DEADLINE_NEAR_DAYS` negatif
  sayıları da yakalıyor. `AYS/src/js/core/beacon.js:203`
  `exam_days_left`'i sınavdan sonra negatif gönderiyor; HKM aralığı
  (`sync_engine.py` −3650…3650) bunu kabul ediyor.
- **Bozulduğu girdi:** profildeki TYT tarihinden sonraki her gün. Öneri
  «Sınava −30 gün kaldı. Bugünün merkezine AYS'yi almanı öneririm.»
  oluyor. Sıra 2 her gün kazandığı için 3–5. sıralar (AYS tabanı, ESP
  temeli, ESP yeni içerik) **kalıcı olarak** hiç önerilmiyor. Sınav
  gününde «Sınava 0 gün kaldı» çıkıyor.
- **Doğrulama (Python):**
  `precedence.resolve(payloads={'ays':{'exam_days_left':{'value':-30,'cert':'computed'}}})`

### Y3 · Etki ölçümü aynı günün her gönderimini ayrı ölçüm sayıyor; yanlış «kötüleşti» hükmü

- `HKM/core/impact.py:79-96` · Önbelleksiz `_seri` her ham olayı ayrı
  değer olarak ekliyor. Önbellekli yol her günün **son** değerini alıyor
  (`build_cache`). Önbellek yalnız 20'den fazla karar varken kullanılıyor
  (`impact.py:173`). Yani ilk 20 kararda yanlış yol çalışıyor.
- **Bozulduğu girdi:** işaretin günde birden çok gönderdiği olağan
  kullanım (varsayılan aralık 60 dk, uygulama her açıldığında). Öncesinde
  bir gün × 3 gönderim, sonrasında bir gün × 3 gönderim «en az 3 ölçüm»
  şartını karşılıyor. Gün içi birikimli ara değerlerin (20, 40, 90)
  ortancası ölçüm diye kullanılıyor.
- **Doğrulama (Python):** aynı veriyle `impact.one(con, k)` →
  `worsened (3/3)`; `impact.one(con, k, impact.build_cache(con))` →
  `missing (1)`.

### Y4 · SPİ'nin ince toparlanma puanı HKM'de en üst sıradaki kırmızı bayrağı tetikliyor

- `SPI/src/js/core/beacon.js:173` · `recovery` `r.ok` ise `computed`
  olarak gidiyor. `readiness().thin` (`SPI/src/js/core/move.js:129`,
  ağırlığın yarısından azı ölçülmüş) hiç okunmuyor. SPİ kendi içinde ince
  ölçüme yük *artırma* yetkisi vermiyor; HKM'ye ise tam ölçüm gibi
  gidiyor.
- **Bozulduğu girdi:** o gün yalnız «ağrı/enerji = 2» girilmiş (ağırlık
  %15). `sorenessScore` 25, puan 25 çıkıyor. HKM `vp_bio`
  `recovery_floor` (40) altını `danger` sayıyor. Sıra 1 önerisi doğuyor:
  «Fiziksel sermaye çöküş eşiğinde. Bugünkü ağır yükün yarına
  ertelenmesini öneririm…». `manager.py` `bio_red`'i «bir daha sorma»
  susturmasından muaf tuttuğu için bu öneri susturulamıyor.
- **Doğrulama (okuma):** `move.js:66-70` (`sorenessScore`), `:97-99`
  (ağırlık dağıtımı), `HKM/core/vp_bio.py` `recovery_floor`,
  `precedence.py` sıra 1.

### Y5 · ESP'nin «Geçmişi gönder»i ilk günde 422 alıp hiçbir gün göndermeden duruyor

- `ESP/src/js/core/beacon.js:180-196` · `synthesis_gap_days` geçmiş bir
  gün için de **bugünkü** not bağlantı durumundan hesaplanıyor. Aynı
  dosya retansiyonu geçmiş günde doğru olarak «veri yok»a çekiyor
  (`:168-171`), bu alanı çekmiyor. O günden **sonra** yazılmış
  bağlanmamış notların yaşı negatif çıkıyor; `Math.max` negatif kalıyor.
  HKM bu alanı 0–3650 aralığında denetleyip gövdeyi 422 ile reddediyor.
- `ESP/src/js/core/beacon.js:440` · Gönderim en eski günden başlıyor ve
  ilk 202 olmayan cevapta `break` ile tamamen duruyor.
- **Bozulduğu girdi:** pratik kaydı olan ve bugün bağlanmamış duran
  notların hepsinden eski herhangi bir gün (yani pratiğe notlardan önce
  başlamış hemen her kullanıcı). Sonuç «0 gün gönderildi» ve ekranda
  yalnız «Geçmiş gönderimi 422 ile durdu». Ayrıca bağlantı durumu bugünün
  durumu olduğu için geçmiş günün sentez açığı her durumda yanlış.
- **Doğrulama (Python):** `sync_engine.validate({... 'synthesis_gap_days':{'value':-12,'cert':'computed'}})`
  → `-12 degeri 0–3650 araliginin disinda`.

### Y6 · «Geri al» sonraki kayıtları siliyor, geri alınmış kaydı diriltiyor, bloğu «tamamlandı» bırakıyor

- `AYS/src/js/core/proposals.js:500` (`soru-yaz`), `:526`
  (`paragraf-yaz`), `:552` (`problem-yaz`), `:579` (`uyku-yaz`), `:614`
  (`sure-yaz`) · `apply` değeri **ekliyor** (`freeQ += n`), `revert` ise
  eski değeri **mutlak** yazıyor (`day.freeQ = s.eskiQ`). `undo(id)`
  (`:838`) sırayı denetlemiyor: uygulanmış herhangi bir satır, ondan
  sonra gelenlerden bağımsız geri alınabiliyor. `revert`, `apply`'ın
  `pending → done` yaptığı blok durumunu geri çevirmiyor.
- `SPI/src/js/core/proposals.js:85-99` (`vital-yaz`) · Aynı sınıf: değer
  mutlak yazılıyor, mutlak geri yükleniyor.
- **Bozulduğu girdi:** aynı gün iki «soru» kaydı, ilki geri alınıyor.
  Aradaki elle düzenlemeler de eziliyor. SPİ'de «uyku 7» sonra
  «uyku 7,5», ilki geri alınınca uyku boşalıyor. Geri alınan blok
  `actualQ`/`actualMin` boş hâlde «tamamlandı» sayılmaya devam ediyor
  (plan tamamlama yüzdesi şişiyor).
- **Doğrulama (tarayıcı):** `R.Proposals.hemen({action:'soru-yaz',params:{date:bugün,count:40}})`,
  sonra `count:20` → `freeQ` 60. İlkini `undo` → **0** (20 olmalı).
  İkincisini `undo` → **40** (0 olmalı).

### Y7 · HKM profil bilmiyor: iki profilin verisi, hafızası ve yedeği birbirine karışıyor

- İşaret ayarı (`hkm` anahtarı) profil başına duruyor
  (`SPI/src/js/core/store.js:262`, `LOCAL_KEY` profil başına), ama HKM'nin
  sync, hafıza ve yedek uçları yalnız modül adıyla anahtarlanıyor. Gövde
  profil taşımıyor, `sync_engine.py`'deki `profile` alanı hiçbir yerde
  okunmuyor.
- **Bozulduğu girdi:** SPİ'de iki hane profili (ya da AYS'de iki profil)
  ayrı ayrı HKM'ye bağlanmış.
  - (a) İki kişinin uyku ve HRV'si aynı `spi` serisine yazılıyor. Günün
    «son gövdesi» kazanıyor; VP ve kırmızı bayrak başka birinin verisiyle
    çalışabiliyor.
  - (b) `HKM/core/memory.py:207-211` · Profil her değiştiğinde öteki
    profilin hafızası `forgotten` oluyor ve kural gereği bir daha
    dirilmiyor (`:164-165`). Başka bir hane üyesinin cümlesi «ben»in
    hafızası olarak King'e gidiyor.
  - (c) `HKM/core/yedek.py:120` · Yedek `<modül>/<tarih>.json`'a
    yazılıyor. Aynı gün açılan ikinci profil birincinin yedeğini eziyor;
    HKM'deki otomatik yedek her gün yalnız son açılan profili koruyor.
- **Doğrulama (okuma):** `grep -n profile HKM/core/*.py` yalnız
  `PASSTHROUGH` satırını buluyor.

### Y8 · HKM onay kartı, aynı anahtarın tam veri yedeğini de açtığını söylemiyor

- `SPI/src/js/screens/guide.js:248` «SPİ, HKM'nin var olduğunu bilmez.
  İşaret tek yönlüdür» ve `:293` «Tahlil değeri, ilaç adı, semptom ve
  öğün GİTMEZ» diyor. Aynı cümle `AYS/src/js/screens/guide.js:491` ve
  `ESP/src/js/screens/profile.js:254`'te de var.
- `brand/ortak/yedekag.js:57` · Otomatik yedek yalnız bu anahtara
  (`enabled` + jeton) bağlı. Açılınca `Store.exportAll()` günde bir kez
  **modülün bütün verisiyle** (SPİ'de tahlil, ilaç, semptom, öğün dahil)
  `/api/yedek/<modül>`'e gidiyor (`SPI/src/js/app.js:1386`). Hafıza ve
  hedef anlık görüntüleri de aynı anahtarla gidiyor.
- **Bozulduğu girdi:** kullanıcı karttaki metne güvenip işareti açıyor.
  HKM `https` ile başka bir makinede duruyorsa (işaret buna izin veriyor)
  sağlık verisinin tamamı cihazdan çıkıyor.
- **Doğrulama:** HKM açıkken SPİ'de işareti aç, ~8 sn bekle,
  `HKM/db/yedek/spi/<tarih>.json` içinde `labs` ve `meds`'e bak.

---

## Orta

### O1 · İkiz aynı günün gönderimlerini ayrı nokta sayıyor: %400 kapsama, sahte eğilim

- `HKM/core/twin.py:105` · `snapshot` her olayı seriye ekliyor.
  `twin.series` (`:135` sonrası) her günün son değerini alıyor ve kendi
  belgesinde «ikizin kuralı neyse burada da odur» diyor, ama `snapshot`
  bu kurala uymuyor.
- **Bozulduğu girdi:** tek günde 4 gönderim (10, 30, 50, 90). Sonuç
  `points 4`, `coverage 4.0` ve «Son 4 ölçümün ortancası, öncekilere göre
  %250 yukarıda». «Yön için en az dört ölçüm» tabanı tek günle
  karşılanıyor. Brifing, ikiz ekranı ve kapsama satırı etkileniyor.
- **Doğrulama (Python):** aynı gün 4 `insert_event` +
  `twin.snapshot(con, gün, 1)`.

### O2 · Tek günlük «seri» brifinge «bitti» diye düşüyor ve 45 gün kalıyor

- `HKM/core/streak.py:111` · Boşluk seriyi kapatırken
  `bitmis = bitmis or _paket(aktif…)` uzunluğa (`ASGARI = 3`) bakmıyor.
  `bitmis or` ilk kapananı tutuyor; öteki dal ise en yeniyi tutuyor.
  «Bitti» günü ölçülmemiş bir gün oluyor. «Atlanan» sayısı sondaki
  boşluk günlerini sayıyor.
- **Bozulduğu girdi:** 45 gün önce tek bir 5 saatlik gece, ardından 3
  ölçümsüz gün. Brifinge «uyku tabanının altında 1 gün sürdü ve
  2026-08-14 günü bitti — arada 2 gün ölçülmedi» düşüyor. Kural 1
  («seri en az üç gündür») çiğneniyor.
- **Doğrulama (Python):** `streak._kural(KURALLAR[0], 7.0, değerler, günler)`.

### O3 · İçe aktarmada geri alma kopyası yazılamazsa eski kopya kalıyor; «geri al» yanlış duruma dönüyor

- `AYS/src/js/core/store.js:316-318` (SPİ `:317-319`, ESP `:318-320`
  aynı) · Kopya yazılamazsa (kota) `catch` boş kalıyor ve **önceki**
  içe aktarmanın kopyası silinmiyor.
- **Bozulduğu girdi:** içe aktarma #1 (kopya = durum 0), haftalarca
  kayıt, içe aktarma #2 kota yüzünden kopya yazamıyor. Ekranda «Bu içe
  aktarmayı geri al» (`AYS/src/js/screens/guide.js:335-340`) **eski
  tarihle** duruyor. Basılınca durum 0'a dönülüyor; #1 ile #2 arasındaki
  bütün kayıt ve #2 gidiyor. NOTLAR §7.4 «anlık görüntü alınamıyorsa içe
  aktarmayı reddet» diyordu, kod tersini yapıyor. Kopya süresiz durup
  kotanın yarısını yiyor ve O4'teki ölçüm onu saymıyor.
- **Doğrulama (okuma):** `importAll` → `importUndoInfo` → `undoImport`.

### O4 · Depo doluluğu yalnız etkin profilin anahtarından ölçülüyor

- `SPI/src/js/core/store.js:424-437` (AYS ve ESP'de aynı) · `localSize()`
  yalnız `LOCAL_KEY`'in uzunluğunu kökenin tamamına ait 5 MB ile
  kıyaslıyor. Öteki profiller, `.oncesi` geri alma kopyası ve öteki
  anahtarlar sayılmıyor. `storage.js`'in «kaç gün sonra dolar» tahmini
  de bu sayıya dayanıyor.
- **Bozulduğu girdi:** iki profil, her biri ~2 MB. Ekranda ~%40 yazıyor,
  köken ise ~%80 dolu. İlk gerçek belirti `QuotaExceededError` oluyor.

### O5 · SPİ toparlanma tabanı hep bugüne göre; geçmiş günlerin puanı yanlış ve her gün değişiyor

- `SPI/src/js/core/move.js:21-32` · `baseline()` penceresini **bugüne**
  göre kuruyor. `readiness(d)` geçmiş bir gün için de bugünün HRV ve
  nabız tabanını kullanıyor.
- **Bozulduğu yerler:** (a) işaretin geçmiş gönderimi (`beacon.js:415`)
  geçmiş günün `recovery`'sini o günden **sonraki** günlerin ve günün
  kendi değerinin tabanıyla hesaplıyor. Bu, işaretin kendi kuralını
  («bugünden türetilen alan geçmiş güne yazılmaz») çiğniyor; aynı
  dosyadaki `hrv_baseline` ise doğru olarak `d`'ye göre hesaplanıyor.
  (b) Geçmiş günün ekrandaki toparlanma puanı her gün değişiyor.
  (c) `SPI/src/js/core/calc.js:295` toparlanma serisi ve
  `goodhart.js:104` aynı hatayla hesaplanıyor.

### O6 · AYS'de «günün sorusu» dört ayrı tanımla sayılıyor

- `AYS/src/js/core/beacon.js:170-177` ve `goodhart.js:104-109`: blok +
  serbest + paragraf + problem. `xpsayim.js:32-34`, `basarimsayim.js:44-45`
  ve `tools.js:139`: blok + serbest. `calc.js:122-136` (`questionRealization`):
  **yalnız blok**.
- **Bozulduğu girdi:** blokta 20 soru, «soru 40», 15 paragraf, 15
  problem. HKM ve Goodhart 90 görüyor; XP, rozet ve ajan aracı 60;
  haftalık gerçekleşme 20. `xpsayim.js`'in yorumu «goodhart.js ile aynı
  okumadır» diyor, değil. `today.js:63` «burada görünmezse kayıt
  kaybolmuş sanılır» diyor, ama serbest soru haftalık gerçekleşmede
  kayboluyor.

### O7 · Hafıza eşitlemesi eksik kaydı kalıcı olarak «unutuldu» yapıyor

- `HKM/core/memory.py:207-211` · Modülün anlık görüntüsünde olmayan kayıt
  `forgotten` oluyor. Bu, kullanıcının «unut» sözüyle aynı durum ve
  bir daha dirilmiyor (`:164-165`, `:202`).
- **Bozulduğu girdi:** hafızası eksik eski bir yedek içe aktarılıyor
  (işaret ayarı cihaza ait olduğu için korunuyor). Açılıştaki eşitleme
  (`AYS/src/js/core/state.js:1253`) HKM'deki kayıtları unutturuyor. Yeni
  yedek geri yüklense de HKM'de dirilmiyorlar. Y7(b)'nin tek profilli
  hâli.

### O8 · HKM uçları bozuk girdide cevap vermeden bağlantıyı koparıyor

- `HKM/daemon.py` · Kopan istek sunucuyu düşürmüyor, ama istemci 400/422
  yerine «bağlantı kapandı» görüyor ve kullanıcıya bu «HKM ulaşılamıyor»
  gibi yansıyor. Canlı denemede 102 durum.
  - Gövde nesne değilse (`[]`, `null`, `1`, `"x"`): `sync` (`:1428`
    `setdefault`), `restore` (`:1274`), `prune`, `say`, `message`,
    `memory`, `motto/*`, `probe`, `models`, `web/dene`, `pair/open`,
    `intents`, `chat`, `chat/tani`.
  - `?date=bozuk` ya da `?date=2026-13-45` (`:628` doğrulanmıyor):
    `briefing`, `twin`, `series`, `cross`, `streak`, `weekly`,
    `weekly/belge`, `budget`. Gövdede bozuk `date` ile: `POST /api/chat`
    ve `/api/message`.
  - `motto/{edit,move,archive,link,unlink,accept}` `id`'siz: `int(None)`.
  - `prune {"days":"abc"}` ve `restore {"__meta":{"schema":"abc"}}`.

---

## Düşük

- **D1** `HKM/daemon.py:1428` · `/api/sync/ays` gövdesinde
  `"module":"spi"` varsa kayıt SPİ'ye yazılıyor; yol ile gövdenin
  uyuşmazlığı denetlenmiyor. *(canlı)*
- **D2** `HKM/core/intents.py` `take` · Cevapta `state:"delivered"` ama
  `delivered_at:null`; sözlük yerinde güncellenmiyor. *(canlı)*
- **D3** `HKM/core/manager.py` `brief` → `carry` · `GET /api/briefing`
  ambara karar yazıyor. `?date=2020-01-01` dahil her okunan tarih için
  karar satırı açılabiliyor. *(okuma)*
- **D4** `HKM/core/yedek.py:120-126` · Aynı modülün eşzamanlı iki yedek
  isteği aynı `.yaziliyor` geçici adını kullanıyor; biri
  `FileNotFoundError` ile kopabiliyor (iki sekme aynı anda açılırsa).
  *(okuma)*
- **D5** `HKM/core/program.py:229-241` · Yorum «toplam öğrenme süresini
  aşmaz» diyor, ama `max(1, t)` sıfır dilim alan birime bir dilim
  ekleyince toplam aşılabiliyor. *(okuma)*
- **D6** Üç `beacon.js` `backfill` · İlk hatada `break`; tek bozuk gün
  geri kalan bütün günleri engelliyor ve kullanıcıya hangi günün neden
  reddedildiği söylenmiyor (yalnız durum kodu). *(okuma)*
- **D7** `HKM/daemon.py:1288` · `prune {"days":0}` sessizce 180 gün
  oluyor (`or 180`); negatif değer ise reddediliyor. *(canlı)*
- **D8** `AYS/src/js/core/utils.js` `fmtMin` · 119,6 dakika «1 sa 60 dk»
  yazılıyor. `pct(x, 0)` ve `round(NaN)` 0 döndürüyor; korumasız çağrılar
  `analytics.js:340` (`claimed ? … : 0`), `screens/exams.js:115`
  (cevapsız test «%0 isabet») ve `calc.js:150`. Eksik veri sıfır
  görünüyor. *(okuma)*
- **D9** `AYS|SPI|ESP/src/js/core/ui.js:17/49` `target`, `:19/51`
  `shield` iki kez tanımlı; ilki ölü. `ESP/src/js/data/hints.js:104/195`
  `ladder` iki kez; ilk metin hiç görünmüyor. *(eslint)*
- **D10** `AYS/src/js/app.js:656` · `S.ui.examOpen = S.ui.examOpen`
  hiçbir şey yapmıyor; niyet belirsiz. *(eslint)*
- **D11** `ESP/src/js/core/srs.js` başlık · «EASE ince ayardır; aynı
  kutudaki iki kart aynı hızda uzamaz» diyor, ama `schedule()` ease'i
  yalnız «Kolay»da kullanıyor. «İyi» cevaplarda aralık yalnız kutudan
  geliyor. *(okuma)*
- **D12** Niyet kataloğu dört yerde: `HKM/core/intents.py:44` ve üç
  `beacon.js` (`AYS:489`, `SPI:471`, `ESP:466`). Bugün 15 türün hepsi
  tutarlı; karşılaştıran bir test yok. HKM'ye bir tür eklenip modül
  listesi unutulursa teklif sessizce atlanıyor (`AYS beacon.js:486`) ve
  HKM'de süresiz açık kalıyor. *(okuma)*
- **D13** `HKM/core/settings.py:260-268` · `config.json` (yerel jeton,
  sağlayıcı anahtarları, kanal jetonları) izin ayarlanmadan, varsayılan
  umask ile yazılıyor. Ambar ve `db/yedek/` de öyle. KURULUM'daki VPS
  kurulumunda başka kullanıcılar okuyabilir. *(okuma)*
- **D14** `*/dist/*.html` depoda duruyor ve duman testi onu geziyor, ama
  kaynaktan yeniden derlenmiş hâliyle aynı olduğunu hiçbir şey sınamıyor
  (`ci.yml` `dist`'e bakmıyor, `R.BUILD` damgası denetlenmiyor).
  `build.py` unutulursa telefondaki dosya eski kalıyor, CI yeşil
  kalıyor. *(okuma)*

## Belge ve iddia kayması

- **B1** `README.md:30` «312 test», `HKM/MIMARI.md:12` «106 HKM testi».
  Ölçülen 584.
- **B2** `README.md:37` ve `HKM/MIMARI.md` §1 «üç sistem HKM'nin var
  olduğunu bilmez» diyor. AGENTS.md §1.4 ve `intents.py` «bilir» diyor.
  Gerçekte modüller 9 dosyadan ~15 HKM ucuna konuşuyor (sync, intents,
  king, bam, memory, hedef, yedek…). Üç onay kartındaki metin için bkz.
  Y8.
- **B3** `brand/ortak/OKU.md:28` `llm.js`'i «yalnız SPİ + ESP», `:75`
  «AYS'ninki başka bir şeydir» diye anlatıyor; `NOTLAR.md:1552` de öyle.
  `tools/ortak.py`'deki `YALNIZ` tablosu boş, `llm.js` üçüne birden
  yayılıyor.
- **B4** `HKM/KURULUM.md:122` ve `HKM/MIMARI.md:400` «`/api/wa/webhook`
  HKM'nin **tek** bearer'sız POST yoludur» diyor. `/api/tg/webhook` ve
  `/api/pair` de bearer'sız.

## Koşullu

- **K1** HKM'de saat dilimi ayarı yok; 51 yerde `date.today()` ya da
  `datetime.now()` kullanılıyor, KURULUM'daki systemd biriminde `TZ` yok.
  UTC'deki bir VPS'te «08:00 brifingi» İstanbul saatiyle 11:00'de
  gidiyor, HKM'nin günü 03:00'te dönüyor. Yerelde çalışırken sorun yok.
  Gelecek tarih denetimi bir günlük pay bıraktığı için sync reddi
  **olmuyor**.

---

## Ölçtüm, sorun çıkmadı

- **Tarayıcı tıklama taraması:** AYS (boş ve 120 günlük tohumlu), SPİ
  ve ESP'nin her ekranı; toplam 1 156 tıklama. Sayfa hatası 0, ekrana
  sızan `undefined`/`NaN`/`[object Object]` 0.
- **HKM sync doğrulaması:** NaN, Infinity, bool, metin, aralık dışı,
  gelecek tarih, etiketsiz değer, «veri yok» etiketli değer. Hepsi doğru
  olarak 422.
- **Yedek indirme ucu:** dizin kaçışı (`..%2F`) 404.
- **Niyet cevapları:** uygulanmış bir teklif başka cevaba çevrilemiyor
  (409); aynı cevabın tekrarı kabul ediliyor. Bayat teklif ayrı bir
  `expired` durumu alıyor, kullanıcı adına cevap uydurulmuyor.
- **HKM yüzü:** `innerHTML`'e kaçışsız karışan veri görmedim (sezgisel
  tarama, 99 atama).
- **Service worker:** yalnız aynı kökenden GET isteklerini saklıyor;
  HKM ve POST istekleri kasaya girmiyor.
- **Telegram cümle ayrıştırıcısı** (`dil.py`): olumsuz («uyumadım»),
  gelecek zamanlı («çalışacağım») ve çelişkili («5 değil 7») cümleler
  kayda dönmüyor; sayıyı modül onaylatıyor.
- **SPİ işareti** eksik değeri `missing` gönderiyor. **Semptom sayacı**
  kaldırılan semptomu siliyor. **Tarih yardımcıları** yerel gün
  kullanıyor. **SRS** hiç sorulmamış kartı ortalamaya katmıyor. **Ek sınav
  profili** plana ve net hesabına dokunmuyor. **Buyurgan kelime
  denetçisi** hiçbir şablonda tetiklenmiyor.

## Bakamadığım yerler

Buralarda «hata yok» demiyorum, **göremedim**:

- `king.py`, `bam.py`, `teklif.py` (≈3 000 satır) ve dil modeli / web
  arama akışları: ağ ve anahtar gerektiriyor, yalnız yüzeyden okundu.
- WhatsApp/Telegram'ın gerçek ağ davranışı ve `outbox` yeniden deneme
  zamanlaması.
- AYS planlayıcı, istisna ve takvim hesabının ayrıntısı; ESP merdiven
  kapıları; XP/rozet motoru (testlere güvenildi, satır satır okunmadı).
- Üç modülün konuşarak değiştirme ayrıştırıcıları (`R.Komut`,
  `SP.Bolum`, `ESP.Komut`).
- `build.py` ile tek dosya derlemenin kendisi.
