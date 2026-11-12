# Faz 1 · Veri ve tek kapı (A3 + A4) · uygulama planı

2026-11-12. Dayanak: `plan.html` §4 A3/A4, §8 Faz 1 kapısı, §9 riskler; `veri-katmani.md` §3-§7;
`envanter-kabuk-sunucu.md` §5; `sentez.md` §5; `taban-20261112.md`; AGENTS §0.1 kararları 10, 11, 12.
Kesinlik dili AGENTS §1.2: ölçüldü, hesaplandı, tahmin, göremedim.

## 0. Ön bulgu: canlı hesap deposu boş (ölçüldü, 2026-11-12 21:40)

`%LOCALAPPDATA%\LifeOS\hesap\hesap.db` 19 Ekim 22:23 tarihli, 16 tablonun hepsi boş (0 kullanıcı,
0 kayıt). Aynı klasördeki günlük yedekler (4-11 Kasım, her biri 217 088 bayt) dolu: 11 Kasım 03:33
yedeğinde 2 kullanıcı, 85 kayıt (`ays/main` 39, `spi/ben` 31, `esp/ben` 15), 15 yayın; son kayıt
yazımı 5 Kasım 11:21. Yedekler canlı bağlantıdan (`kopya_al`, SQLite yedekleme API'si) alındığı için
veri canlı dosyanın `-wal` günlüğündeydi; o günlük 11 Kasım 03:33'ten sonra bir ara kaybolmuş.
Nedenini göremedim. Sonuç: LifeOS bu hâliyle açılırsa hesap sunucusu «ilk kurulum» der; cihazlardaki
kayıtlar yerinde (sunucu kopyadır), sıradaki değişiklikler 401'de korunur (`hesap.test.js:744`).
Göç aracı bu durumu tanır: canlı depo boşsa ve yedek doluysa en yeni sağlam yedeği kaynak alır ve
raporda «canlı boş, yedekten okundu» der. Canlı dosyayı geri koymak sahibin kararıdır.

## 1. Tasarım (tek sayfa)

| Konu | Karar | Nerede |
|---|---|---|
| Tek depo | `%LOCALAPPDATA%\LifeOS\veri\lifeos.db`, SQLite (stdlib), `PRAGMA user_version` sürümlü; medya içerik adresli `veri\medya\<ss>\<sha256>` | `sistem/goc.py` şeması (P1), `sistem/veri.py` (P3) |
| Kayıt | `kayit(id, tur, tur_surum, alan, yol, govde, etiket, hlc, cihaz, silindi, kaynak, goc_id)`; `id = alan|yol`; `alan = <modül>/<profil>`, `hkm/<tablo>`, `gun/<cihaz>`, `pc` | aynı |
| Gövde | Eski kaydın JSON'u **aynen** durur; eski modüller köprüden aynı baytı alır. Birleşik tür (`olcum`, `kart`, `not` …) bir etikettir; alan eşlemesi alan taşınırken (Faz 2+) yapılır | katalog `KATALOG` |
| Kesinlik | Tek dil: `measured`, `estimated`, `computed`, `missing`, `eski` (karar 11: etiketsiz eski sayı). Ekranda: ölçüldü, tahmin, hesaplandı, veri yok, eski kayıt. Eski gövdedeki `derived` dokunulmaz, `etiket` haritasında `computed` olur ve sayılır | `etiket = {yol: kod}` |
| Türetilmiş | `decisions`, `briefings`, `signals`, `forecasts`, `meetings`, `office` ve HKM'nin karar, işaret, önbellek tabloları taşınmaz; sayılır, yeniden hesaplanır (karar 10). Eski modüller açılışta bunları kendi kural motoruyla zaten üretir | `TURETILMIS` |
| Cihaza ait | `hkm`, `storage`, `usage` yolları (`depo.js:340`) atlanır, sayılır | `CIHAZA_AIT` |
| Sırlar | `*.llm.keys` ve anahtar/jeton/parola adlı anahtarlar pakete girmez; pakette görülürse göç durur | `SIR_RE` |
| Saat | Karma mantıksal saat (HLC) `"<ms 13 hane>:<sayaç 4 hane>:<cihaz>"`; sunucu kendi saatinden 5 dk ilerideki ms'yi kırpar. Göçte ms = kaydın kendi zamanı (`zaman > 1`, yoksa `updatedAt/guncel/at/createdAt`), o da yoksa 0 + `kaynak=goc` | P3 |
| Çakışma | Alan (JSON üst anahtarı) düzeyinde son HLC kazanır; aynı kaydın farklı alanları birleşir. Listeler bütün kalır (alt kayda bölmek alan taşınırken) | P3 |
| Olay defteri | Eklemeli `olay(sira, kayit_id, islem, hlc, cihaz, kaynak, goc_id)`; geri alma ve göçün geri dönüşü bunun üstünde | P1 şeması, P3 |
| Cihaz | Yeni kabuk tek köken, IndexedDB `lifeos` (kayit, kuyruk, meta, medya), `persist()` istenir; kuyruk değişikliğin kendisini taşır | P5 |
| Tek kapı | Tek süreç, tek adres: 4180 kalır (Tailscale `serve` zaten oraya), modüller `/ays/`, `/spi/`, `/esp/` yolunda; HKM çekirdeği (hafıza, model kapısı, ambar) aynı süreçte `/api/hkm/`; 4173/4183/4193/4200 kapanır | P5 |

## 2. İş paketleri (sırayla; her biri kendi commit'i, kendi testi)

| # | Paket | Ne | Test | Çıkış ölçütü |
|---|---|---|---|---|
| P1 | Göç kuru koşusu | `python sistem/goc.py --kuru`: beş kaynağı **kopyadan** okur (SQLite dosyası, `-wal`, `-shm` kopyalanır, kopya açılır), göçü geçici bir `lifeos.db`'ye yapar, geri okur, kaynak × tür sayar, raporu yazar. Gerçek göç aynı kod, başka hedef (`--hedef`, onaysız çalışmaz) | `tools/goc_test.py`: sayı dengesi, etiket (`eski`, `derived→computed`), türetilmiş/cihaza ait atlanır, sır pakette → durur, çatışma listesi, bekleyen sayısı, medya sha, iki koşu bayt bayt aynı, kaynak dosyaları değişmez, `goc_id` ile geri alma hedefi boşaltır | test yeşil; gerçek veriyle kuru rapor: her kaynakta okunan = taşınan + atlanan, fark 0 |
| P2 | Göç paketi düğmesi | Donmuşlara tek istisna. `brand/ortak/gocpaket.js`: bütün profillerin dışa aktarımı, ana depo dışı anahtarlar (sırlar hariç), IndexedDB fotoğraf ve medya (base64 + sha256), sıradaki bekleyen sayısı; PC'ye `POST /api/goc/paket` (yerel ya da oturumlu cihaz, `X-LifeOS: goc`), localStorage'a yazmaz. Düğme Hesap sayfasında ve 4180 Gün sayfasında | JS birim testi (profil sayısı, sır yok, medya sha), Python uç testi (boyut sınırı, ad, üstüne yazmaz), `node tools/entegre.js`, `ortak.py --denetle` | her modülde bir dokunuşla paket PC'de; kuru koşu paketi okuyup sunucuyla yol yol karşılaştırıyor |
| P3 | Tek depo | `sistem/veri.py`: P1 şemasını açar, HLC, alan düzeyi birleştirme, mezar taşı, olay defteri, yedek (hesap.py'nin `kopya_al` kalıbı) | birim: saat kayan cihaz kazanamaz, aynı günün iki alanı iki cihazdan birleşir, silme yayılır, gidiş-dönüş bayt eşit, yedekten geri dönüş | testler yeşil; P1 hedefi bu modülle okunuyor |
| P4 | Köprü | `/api/hesap/esitle` kayıtlarını `veri.py`'ye yazar ve oradan okur; istemci sözleşmesi değişmez | mevcut `HKM/tests/test_hesap.py` (79) ve `brand/ortak/hesap.test.js` (93) aynen + HLC ve alan testleri; `node tools/entegre.js` | eski modüller yeni depoyla çalışıyor (kapı maddesi 3) |
| P5 | Tek kapı, tek süreç | `sunucu.py` içindeki `Sunucu`, `Giris`, `TelefonSunucu` tek işleyici; tek adres; HKM çekirdeği aynı süreçte; ev ağı kapıları emekli (karar 8) | `giris_sayfa_test.js`, modül `smoke.js`'leri yeni yolla, `portmuhafiz.test.js`, `entegre.js`, HKM `tests.run`; boşta bellek ölçümü önce/sonra | tek adres, tek süreç; 8 GB makinede boşta bellek bugünden düşük (ölçüldü) |
| P6 | Gerçek göç ve kapı | Sahibin açık onayıyla: dönüş noktaları (`hesap.db` «önce» kopyası, `hkm.db` kopyası, her cihazın paket dosyası), `goc.py --gercek`, kapı ölçümleri, geri dönüş denemesi; HKM süreci ancak HKM verisi doğrulanıp sahibi onaylayınca kapanır | P1 raporu gerçek hedefte aynı sayılar; geri dönüş: `goc_id` ile sil + bayrağı eski depoya çevir, eski modüller açılıyor | §3 kapısı |

Sıra gerekçesi: P2 olmadan cihazdaki fotoğraf, açılmamış profil ve Gün geçmişi görünmez (veri-katmani §3);
P4 olmadan eski modüller yeni depoyu göremez; P5 köken değiştirdiği için cihaz verisi tarayıcıdan
çıkmadan (P2 + P6) yapılamaz. P1 ve P3 bağımsızdır; bu oturum P1'i yapar.

## 3. Faz 1 kapısı (ölçülerek geçilir)

1. Her cihazda, her modülde bekleyen değişiklik 0 (paketteki `bekleyen` alanından, cihaz cihaz).
2. Kuru koşu birebir: her kaynak × tür için okunan = taşınan + atlanan; sunucu ile paket arasındaki her fark listede ve sahibi gördü; iki koşu bayt bayt aynı.
3. Etiketsiz sayı kalmıyor: her sayı dört etiketten biri ya da `eski`.
4. Eski modüller yeni depoyla çalışıyor (P4 testleri + entegre).
5. Geri dönüş denendi (P6).
6. HKM verisi doğrulanmadan HKM kapanmaz; kapanış ayrıca sorulur.

Gerçek göçten ve HKM'yi kapatmadan önce sahibinden açık onay alınır.

## 4. Sınırlar

Canlı veriye (`LifeOS-Sistem`, tarayıcı depoları, `hkm.db`, `hesap.db`) yalnız okuma; okuma dosya
kopyasından. Sıfır bağımlılık (AGENTS §1.3). Masaüstü kabuğunun Chromium profili (LevelDB) dosyadan
okunmaz; PC'deki modül verisi de paket düğmesiyle alınır (veri-katmani §6).
