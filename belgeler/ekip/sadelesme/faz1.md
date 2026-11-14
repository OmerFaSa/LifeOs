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

**Geri konuldu (2026-11-12 21:53, sahibinin onayıyla).** Boş canlı dosya `yedek\hesap-once-20261112-215334.db`
olarak saklandı (dönüş noktası); yanındaki boş `-wal`/`-shm` kenara alındı; 11 Kasım yedeği `hesap.db` yerine
kondu. Denetim (ölçüldü): canlı dosya yedekle bayt bayt aynı, `integrity_check` temiz, `hesap.Depo` açıyor
(2 kullanıcı, 78 canlı + 7 silinmiş kayıt); kuru koşu artık canlı depodan okuyor, sayılar ve göç kimliği
(`05e883396eae657f`) yedekten okunan koşuyla aynı. 5-11 Kasım arası sunucuya hiç kayıt gitmemişti (son yazım
5 Kasım), bu yüzden geri koymada sunucu tarafında kayıp yok; cihazlar bağlanınca kendi sıralarını yollar.

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

**P3 yapıldı (2026-11-13, yerel `sadelesme`, gönderilmedi).** `sistem/veri.py` `Depo`: şemayı `goc.SEMA`'dan
açar, sürüm 1'i 2'ye yükseltir (`kayit.saatler`: her üst anahtarın HLC'si, silme tabanı boş anahtarda);
`yaz` yalnız değişen üst anahtarları alır, `sil` tabanı yükseltir ve ondan eski anahtarları düşürür, ikisi
de olay defterine yazar; `kirp` gelen saati 5 dk'ya kırpar, `damga` yerel olay saati, `yedekle` yarım adla
yazar, `integrity_check` sonra ad verir, üstüne yazmaz. Günlük modu WAL değil (§0'daki kayıp). Test
`tools/tekdepo_test.py` 26 denetim, CI'da (`tools/veri_test.py` adı başka teste ait). Çıkış ölçütü
(ölçüldü): gerçek kuru koşu hedefi bu modülle açıldı, 394 kaydın 394'ü aynen okundu, göç kimliği
`05e883396eae657f` P1 raporuyla aynı. Sıradaki: P2 (donmuşlara tek istisna, düğmenin görünüşü önce
önizlemeyle sorulur) ya da P4 (köprü; istemci sözleşmesi değişmez, eski hesap testleri aynen geçmeli).

**P4 ikiye bölündü; P4a yapıldı (2026-11-13, yerel `sadelesme`, gönderilmedi).** P4a, yazma köprüsü:
`hesap.Depo.esitle` sözleşmesi ve `hesap.db` aynen sürer; kabul ettiği yazımlar işlem kaydedildikten sonra
`veri.Kopru` ile sahibin (ilk admin) tek deposuna da yazılır. Köprü yalnız `veri/lifeos.db` varsa açılır
(yani P6'dan sonra; depoyu kendisi kurmaz), hatası eşitlemeyi durdurmaz. Eski istemci bütün gövde
yollar: `Depo.degistir` = aynı anda sil + yaz (taban yükselir, eski anahtar dönmez); sözlük olmayan gövde
(gerçek veride 1 liste kaydı) tek parça. `veri.karsilastir(hesap kopyası, depo, sahip)` farkları listeler
(P6 kapısı için). Ölçüldü: `tekdepo_test.py` 45 denetim (değiştirme dahil 120 sıra tek sonuç; gerçek
`hesap.Depo` ile köprü: reddedilen gitmez, türetilmiş girmez, ikinci hesap karışmaz, hata eşitlemeyi
durdurmaz), HKM takımı 1093/1093. **P4b açık:** eski istemcilerin okuması (`al`, `sira` imleci) tek depodan;
imleç alanı değişeceği için dönem (`donem`) çevrilip cihazlar baştan indirmeli, bu yüzden P6 ile birlikte yapılır.

**P2 arka yüzü yapıldı (2026-11-13, yerel `sadelesme`, gönderilmedi); düğme sahibinin tasarım onayını bekliyor.**
Cihaz: `brand/ortak/gocpaket.js` (`LIFEOS.GocPaket.yolla`) bütün profillerin ana deposunu (depo.js
`yerelAnahtar` kalıbından; AYS'nin `main` özel anahtarı dahil, «örnek» ve `.oncesi` hariç), ana depo dışı
anahtarları, IndexedDB medyasını (yalnız var olan veritabanı; sha256 + base64 + kaydın kendisi) ve
`lifeos.hesap.sira.*`'dan bekleyen sayısını toplar; sır adlı anahtar girmez, hiçbir şey yazılmaz; medya
48 MB'lik paketlere bölünüp dolunca yollanır. Uç: planda `/api/goc/paket` yazıyordu, **`/api/hesap/goc-paket`**
oldu, çünkü `/api/hesap/` zaten bütün modül kapılarında ve 4180'de yönlendiriliyor ve oturum denetimi orada
(bu bilgisayardan ya da admin oturumuyla, `X-LifeOS: goc`). PC: `goc.paket_kaydet` gövdeyi diske akıtır,
biçim, cihaz kimliği, sır ve medya özeti denetler, `<kaynak>-<cihaz>-<zaman>-<rastgele>.json` adıyla
`%LOCALAPPDATA%\LifeOS\goc\paket`'e koyar, üstüne yazmaz, reddedilenden iz bırakmaz (sınır 96 MB).
Ölçüldü: `gocpaket.test.js` 19, `gocpaket_test.py` 18 denetim (cihazın ürettiği paketler PC'de kabul edilip
göç okuyucusunda denge tutuyor); HKM 1093/1093.

**P2 düğmesi yapıldı (2026-11-13, sahibin seçtiği biçim: Verin'de tek satır).** Hesap › Verin'de
«Bu cihazdakileri tek depoya taşı · Bilgisayara gönder»; gönderince satırda makbuz (profil, kayıt, yan kayıt,
dosya, bekleyen) ve «Yeniden gönder»; yalnız admin görür. 4180 kökeninde (giriş/seçim sayfası, telefon
uygulamasının giriş sayfası) modül deposu yoktur, paket kaynağı `gun` olur: Gün geçmişi oradan gelir.
`depo.js` `yerelAnahtar`/`varsayilanProfil`'i dışa verir; `gocpaket.js` `brand/parcalar.txt`'te, üç modülde
ve üç dist'te; 4180 onu kapalı listeden sunar, `uygulama/ios` paketine girer. Ölçüldü: modül takımları AYS
3478/3478, SPİ 3269/3269, ESP 2962/2962 (yeni Verin testi dahil), `giris_sayfa_test` temiz, HKM 1093/1093.
**P2 çıkış ölçütünün kalanı sahibin elinde:** kod çalışan kopyaya geldikten sonra her cihazda her modülde ve
4180'de bir kez «Bilgisayara gönder»; ardından `goc.py --kuru` paketleri sunucuyla yol yol karşılaştırır.

**P5 yapıldı, kapalı duruyor (2026-11-13, yerel `sadelesme`, gönderilmedi).** `sistem/tekkapi.py` (223 satır):
tek süreç, tek adres. Giriş ve Gün (bugünkü 4180), üç modül `/ays/` `/spi/` `/esp/` yolunda, API'ler ve HKM
çekirdeği `/api/hkm/` altında aynı süreçte; `/kabuk/` ayrıldı. Hiçbir işleyici yeniden yazılmadı: istek var olan
sınıflara (`Giris`, modül `Sunucu`, `daemon.Handler`) verilir. Dokunulan iki dosya: `HKM/daemon.py` (kurulum
`main()`'den `hazirla()`'ya taşındı) ve `sistem/sunucu.py` (`gun_cumlesi` iki isteğe bağlı parametre aldı);
ikisi de davranışı korur. `ETKIN = False`: `baslat.py` ve eski kapılar değişmedi, tek kapı yalnız `--port` ile
deneme için açılır. Ölçüldü: `tools/tekkapi_test.py` 74/74, HKM 1093/1093, `giris_sayfa_test` ve `dist_sun_test`
temiz, `entegre.js` temiz. Boşta bellek (ölçüldü, üç koşunun ortancası): eski düzen 97,7 MB, tek süreç 65,6 MB.
Denenmedi: akışlı sohbet ve modüllerin gerçek tarayıcıda yeni yoldan açılması. Devreye alma P6 ile: ayrıntı ve
üç açık soru `faz1-p5-tekkapi.md`'de.

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

## P6 aracı hazır (2026-11-13)
`python sistem/goc.py --gercek` P6'yı tek komutta yürütür; kapılardan biri tutmazsa hedefe hiçbir şey yazmaz:
1. Canlı `hesap.db` ve `hkm.db` (yanlarındaki -wal ve -shm ile) ve paket klasörü `%LOCALAPPDATA%\LifeOS\yedek\p6-<zaman>\` altına bir kez kopyalanır. Bu kopya dönüş noktasıdır. Sonraki bütün koşular bu anlık kopyadan okur.
2. İki kuru koşu yapılır. Göç şu durumlarda durur:
   - paket yoksa;
   - cihazlarda gönderilmemiş değişiklik varsa;
   - canlı hesap deposu boşsa;
   - çatışma ya da hata varsa;
   - sayı dengesi ya da gidiş-dönüş bozuksa;
   - iki kuru koşu bayt bayt aynı değilse.
3. Kapılar geçilirse gerçek hedefe göç yazılır: `%LOCALAPPDATA%\LifeOS\veri\lifeos.db`. Hedefte depo varsa üstüne yazılmaz.
4. Gerçek koşunun raporu kuru koşunun raporuyla aynı olmalı.
5. Geri dönüş gerçek depoda değil, kopyasında denenir: `geri_al` çalıştırılır ve kopyada 0 kayıt kalmalı.
6. Sahip için `veri.karsilastir` farkı yazılır.

Rapor `goc-gercek.md` olarak dönüş noktası klasörüne yazılır. Gerçek geri dönüş: `python sistem/goc.py --geri-al <goc_id>`. `tools/goc_test.py` bu adımları geçici veriyle dener (ölçüldü). Canlı veriyle geçici hedefe denendi (ölçüldü): «cihaz paketi yok» kapısında durdu.

## P6 koşuldu: gerçek göç (2026-11-14)
Sahibin «benim yapabileceklerimi de yap» talimatıyla, bu bilgisayarda.

1. **Göç paketleri.** LifeOS uygulaması açılıp dört kökenin (Giriş/Gün 4180, AYS, SPİ, ESP) paketi uygulamanın kendi
   `LIFEOS.GocPaket.yolla` işleviyle gönderildi (hesap oturumu yoktu; uç bu bilgisayardan gelen isteği oturumsuz kabul eder).
   Ölçüldü: 4 paket; AYS 62, SPİ 40, ESP 22 kayıt; medya 0; tek cihaz kimliği. Sunucuya gitmemiş değişiklik 29 (oturum yok).
2. **İki karar (araca işlendi, `tools/goc_test.py`'de):**
   - *Aynı cihazın iki kopyası:* sunucudaki eski hâl ile paketteki bugünkü hâl çatışırsa paket seçilir (`goc.sec`). Canlı veride
     iki kayıt böyleydi (`spi/ben|meta`: yedek izi eklenmiş; `spi/ben|vitals/2026-11-05`: su miktarı değişmiş). Başka cihaz karışırsa kural çalışmaz.
   - *Bekleyen değişiklik:* `--bekleyen-pakette` bayrağı. Paket cihazın bütün deposunu taşıdığı için gitmemiş değişiklik paketin içindedir;
     bayrak «paketler az önce alındı, cihaz o andan beri kullanılmadı» beyanıdır. Bayraksız koşu eskisi gibi durur.
3. **HKM gün kopyaları (`raw_events`).** 25 modül-gününün depoda karşılığı yok (ESP 14, SPİ 11). İncelendi: bunlar modül açıldığında
   giden günlük ölçü özetleridir (`metrics`), asıl kayıt değil; o günlerde kullanıcı kaydı yok. Karar 10 gereği türetilmiş sayılır, taşınmaz.
4. **Gerçek koşu.** `python sistem/goc.py --gercek --bekleyen-pakette` → dönüş noktası `%LOCALAPPDATA%\LifeOS\yedek\p6-20261114-035826\`,
   iki kuru koşu bayt bayt aynı, sayı dengesi tutuyor, gidiş-dönüş birebir, çatışma 0; tek depo `veri\lifeos.db` 638 kayıt, göç kimliği
   `5bc3fdae1eaf4adc`; geri dönüş kopyada denendi (638 silindi, 0 kaldı). `veri.karsilastir`: 2 fark, ikisi de yukarıdaki aynı-cihaz
   kayıtları (depo, hesap deposundan yenidir). **`veri.esle` bu yüzden körlemesine koşulmamalı:** o iki kaydı eski hâline çevirir.
5. **Bağdaştırıcılar gerçek veride, paketlerle** (`tools/gercek_kosu.py`): çökme 0, sessiz düşen alan 0; ret 1 (boş not, kural doğru).
6. **Eski kayıtlar yeni kabuğa.** `python tools/kabuk_baslangic.py` tek depodan başlangıç paketi üretir (ölçüldü: 5 not, 5 kayıt, 0 kart);
   sunucu `/api/kabuk/baslangic` ile yalnız bu bilgisayara verir; kabuk Bugün'de «Eski sistemdeki kayıtların hazır … Getir» der, kimlikle
   ekler, aynı paketi ikinci kez önermez. Plan geçmişi, konu durumu ve profil kabuğun bugünkü depolarına karşılık gelmediği için pakete girmez.

**Açılmayanlar (bilerek):** `veri.OKU` ve `tekkapi.ETKIN` kapalı. Açılınca köken değişir ve eski modüller boş görünür: uygulamada hesap
oturumu yok, eski modüllerin tek depodan okuması oturum ister. Önce oturum açılmalı (şifre sahibindir), sonra taze paketle göç yenilenip
(`--geri-al` + `--gercek`) bayraklar açılmalı. Telefon ya da başka cihaz varsa onların paketi de o zaman alınır (hesapta kayıtlı oturum: 0).
