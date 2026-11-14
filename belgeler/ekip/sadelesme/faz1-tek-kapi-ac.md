# Faz 1 · Tek kapıyı açma komutu (P6 tamamlama)

## Özet
`sistem/tek_kapi_ac.py` tek kapıyı (`tekkapi.ETKIN = True`) tek komutla, yedekli ve geri dönüşlü açar. İki kip: `--denetle` (varsayılan, hiçbir şeyi değiştirmez; hazır mı, değilse tam olarak ne eksik) ve `--ac` (ön koşullar → LifeOS'u durdur → yedek + manifest + SHA-256 → en yeni paketlerle gerçek göç → kabuk başlangıç paketi → `veri.karsilastir` → ETKIN satırı → başlat → 4180 doğrula; bir adım bozulursa geri alır ve eski düzeni açar). `--geri` başarılı bir geçişi geri alır. Yalnız stdlib; ağa bir şey göndermez (127.0.0.1 doğrulaması ve yerel `tailscale serve status` dışında), git'e dokunmaz, hiçbir şey silmez. Sınama: `tools/tek_kapi_ac_test.py` (geçici LOCALAPPDATA/USERPROFILE, sahte ağaç, boş yüksek portlar).

## Bugünkü elle yöntem
Devir notu (2026-11-14 ~13:50): telefon giriş yapıp «Bilgisayara gönder»e basar (ya da sahibi telefonda veri yok der); LifeOS kapanır; PC'nin taze paketleri alınır; `goc.py --geri-al 5bc3fdae1eaf4adc` + `--gercek --bekleyen-pakette`; `tools/kabuk_baslangic.py` yeniden koşar; ETKIN = True; yeniden başlat; doğrula.

«CDP yöntemi»: 2026-11-14 ~04:20'de LifeOS.exe `--remote-debugging-port=9333` ile açılıp Playwright `connectOverCDP` ile sürüldü; dört kökende (4173/4183/4193/4180) uygulamanın kendi `LIFEOS.GocPaket.yolla`'sı çağrıldı. Bu tarayıcı (Playwright, Electron hata ayıklama portu) ister; stdlib ile güvenilir yolu yok. Bu yüzden komut PC paketlerini kendisi almaz, **sahibinden ister**: bu bilgisayarda AYS, SPİ, ESP ve 4180'de (Kartlar) Hesap › giriş › «Bilgisayara gönder» (`hesap.js gocGonder` oturum ister). Giriş, PC'yi hesap deposunda «Windows PC» adıyla tanıtır; komut cihazı böyle ayırır.

Elle yöntemde iki bozukluk bulundu, komut ikisini de düzeltir:
1. `--geri-al` yalnız satırları siler, `lifeos.db` dosyası kalır; `goc.gercek` hedefte depo varsa yazmadan durur («Hedefte zaten depo var»). Elle yöntem ikinci adımda dururdu. Komut deneme deposunu (`veri/`) silmeden `veri.deneme-<an>` adıyla kenara alır, gerçek göçü boş `veri/`'ye yapar; `--geri-al` gerekmez.
2. `goc.gercek` paket klasörünün TAMAMINI okur. 03:54'teki PC paketleri ile yeni gönderim birlikte okunursa aynı cihazın iki gönderimi zaman damgasız kayıtlarda çatışma verir (göç durur) ya da cihazda sonradan silinen kaydı eski paketten diriltir. Komut her (kaynak, cihaz) için yalnız en yeni gönderimi (1. parça + sonraki medya parçaları) yedek klasöründe ayrı bir girdi klasörüne kopyalar ve göçe onu verir. Eski paketler yerinde kalır.

## Tek komut
```
python sistem/tek_kapi_ac.py                    # --denetle: hiçbir şeyi değiştirmez
python sistem/tek_kapi_ac.py --ac               # tek kapıyı açar (ön koşullar tutmazsa hiçbir şeye dokunmaz)
python sistem/tek_kapi_ac.py --ac --telefon-yok # sahibin beyanı: başka hiçbir cihazda LifeOS verisi yok
python sistem/tek_kapi_ac.py --geri [--yedek K] # başarılı geçişi geri alır
```
`--ac` adımları: (1) LifeOS durur (`baslat.py --dur`; 4180, 4173/4183/4193, 4200 kapanana kadar beklenir; önce durdurma, çünkü SQLite dosyalarının yedeği yazan yokken tutarlıdır). (2) Yedek. (3) Göç: deneme deposu kenara, `goc.gercek(..., bekleyen_pakette=True)` seçili paketlerle (dönüş noktası, iki kuru koşu bayt bayt aynı, geri dönüş kopyada denenir; çatışma/hata/denge bozuksa yazmaz). (4) `tools/kabuk_baslangic.py --depo veri/lifeos.db --cikti veri/kabuk-baslangic.json`. (5) `veri.karsilastir` (yedekteki hesap.db kopyasıyla): tek kabul edilen fark, tek depodaki değerin aynı cihazın paketinden gelmesidir (`goc.sec` «paket kazanır» kuralı; denemede 2 fark buydu); başka her fark durdurur. (6) ETKIN satırı (yalnız o satır, satır sonları korunur, geri okunur). (7) `baslat.py --tarayicisiz`. (8) Doğrulama: `/` → 302 `/kabuk/`, `/kabuk/` 200 HTML, `/ays/` `/spi/` `/esp/` 200; Merkez ve eski kapılar bilgi olarak yazılır.

## Ön koşullar
`--ac` hepsi tutmadıkça hiçbir şeye dokunmaz; `--denetle` aynı listeyi «Karar: Hazır.» ya da eksiklerle söyler:
1. Bu bilgisayardan dört kaynağın (ays, spi, esp, gun) paketi var ve en yeni gönderim 120 dakikadan yeni (`--bekleyen-pakette` beyanı: paket az önce alındı, cihaz o andan beri kullanılmadı).
2. Telefon/tablet (bilgisayar olmayan ya da türü görülemeyen) bir cihazın 120 dakikadan yeni paketi var, ya da `--telefon-yok`. Bu beyan şu demektir: telefonda/tablette LifeOS'ta kayıt yok (ya da kaybı göze alınıyor); onların eski adreslerdeki verisi tek depoya taşınmaz.
3. Bozuk ya da tanınmayan paket yok.
4. LifeOS penceresi (LifeOS.exe) kapalı: paketten sonra yazılan değişiklik eski kökende kalırdı.
5. ETKIN satırı tek ve `False`.
6. hesap.db dolu ve sahip (admin) hesabı var.
7. `node` var (kabuk başlangıç paketi).
8. Boş disk ≥ 2 × yedeklenecek bayt + 256 MB.

Cihaz ayrımı: paket üst bilgisi yalnız `kaynak` ve `cihaz` kimliği taşır (tür yok). Tür hesap.db'nin KOPYASINDAN okunur: `oturum.cihaz_ad` / `cihaz_adi.ad` (istemci `cihazAdi()`: iPhone, iPad, Android telefon/tablet, Windows PC, Mac). Adı yoksa ve kimlik hesap deposunda hiç geçmiyorsa «bu bilgisayar» (oturumsuz paketi `paket_kaydet` yalnız 127.0.0.1'den alır). Aksi hâlde «türünü göremedim» yazılır ve cihaz telefon sayılır. Telefon kullanım işaretleri ayrıca yazılır: ev ağı kapıları 5173/5183/5193/5180 dinliyor mu, Tailscale serve LifeOS kapılarına yönlendiriyor mu.

## Yedek ve geri dönüş
Yedek klasörü `%LOCALAPPDATA%\LifeOS\yedek\tek-kapi-<YYYYmmdd-HHMMSS>\` (var olan klasöre yazmaz):
- `hesap/hesap.db` (+ `-wal`/`-shm`/`-journal` varsa), `hkm/hkm.db` (+ aile; yol `goc.varsayilan`: `~\LifeOS-Sistem\HKM\db\hkm.db`), `veri/` (deneme deposu, medya, `kabuk-baslangic.json`), `paket/` (bütün göç paketleri), `pc/` (`ayar.json`, `planlama.json`, `ice/`, `muzik/`, `zemin/`, `telefon/`: tarayıcı kökeninden bağımsız PC dosyaları, göçün okudukları), `kod/tekkapi.py`.
- Her dosya kopyalanmadan önce ve sonra SHA-256 alınır, kopya geri okunup karşılaştırılır; `manifest.json` (ad, asıl yol, boyut, SHA-256) en son, yarım adla yazılıp adını alır. `durum.json` adım adım yazılır (deneme deposunun yeni adı, göç kimliği, `tamam`, hata).
- Göçün kendi dönüş noktası (`goc-p6/`, `goc.gercek`) ve göçe verilen seçili paketler (`goc-girdi/paket/`) de bu klasördedir.
- Tarayıcı kökenlerindeki veri (eski 4173/4183/4193 ve 4180 depoları) yedeklenmez; geçiş ona dokunmaz, yerinde kalır.

Bir adım bozulursa (`gec`): LifeOS durdurulur; geri işlemleri tersten koşar: ETKIN satırı `False`'a döner; yeni depo `veri.basarisiz-<an>` adıyla kenara, deneme deposu `veri/` adına geri; manifestteki her dosyanın canlı hâli yedekle karşılaştırılır, farklıysa canlı hâl `<ad>.tek-kapi-sonra-<an>` adıyla kenara alınır ve yedek geri konur (SQLite ailesi birlikte: yabancı bir `-wal` geri konan dosyaya uygulanmasın; `veri/` ve `paket/` hariç). Sonra eski düzen başlatılır ve giriş + üç modül kapısının cevap verdiği yazılır. Hiçbir adım bir şey silmez.

`--geri`: ETKIN `True` iken ve `tamam` olmuş, geri alınmamış en yeni yedek (ya da `--yedek`) bulunursa: LifeOS durur, ETKIN `False`, tek kapı deposu `veri.tek-kapi-<an>` adıyla kenara, geçiş öncesi deneme deposu `veri/`'ye geri, eski düzen başlar ve doğrulanır; bir adım bozulursa tek kapı geri kurulur. hesap.db, hkm.db ve paketler bilerek geri KONMAZ: geçişten sonra yazılanları taşırlar ve eski düzen de onları okur. Tek kapıdayken modüllerde yapılıp hesaba eşitlenmemiş değişiklikler 127.0.0.1:4180 kökeninde kalır (silinmez; yeniden `--ac` ile görünür); komut bunu yazar.

## Testler
`python tools/tek_kapi_ac_test.py` → **124/124 geçti** (2026-11-14, ~5 dk). Her senaryo kendi dünyasında: geçici `LOCALAPPDATA` + `USERPROFILE` (gerçek şemalı hesap.db, `goc.paket_kaydet` ile yazılmış paketler, deneme deposu, `ayar.json`, hkm.db), sahte ağaç (`LIFEOS_TKA_KOK`: gerçek `tekkapi.py`'nin kopyası, sahte `baslat.py` + ETKIN satırına göre eski ya da tek düzende açılan sahte sunucu, gerçek `kabuk_baslangic.py`'ye giden sarmal), boş yüksek portlar (gerçek 4173/4180/4183/4193/4200/51xx'e asla). Göç, karşılaştırma ve kabuk başlangıç paketi gerçek kodla koşar.
- Denetim: telefon paketi yok → «Hazır değil» + eksik; `--telefon-yok` → «Hazır» ve beyanın anlamı; telefon paketi var («iPhone» adıyla) → «Hazır»; açık ev ağı kapısı söylenir; bu bilgisayar tanınamazsa «göremedim» + ne yapılacağı; eski PC paketi → «yeniden gönder»; açık pencere → «Hazır değil». Her denetimden sonra dünyanın bütün dosyaları (SHA-256 + mtime) aynı.
- Ret: eksik koşulda `--ac` hiçbir dosyaya dokunmaz, yedek klasörü açmaz, LifeOS'u durdurmaz; ETKIN kapalıyken `--geri` reddeder.
- Başarılı geçiş: yalnız ETKIN satırı değişir; tek kapı açık, eski kapılar kapalı; manifest hesap.db, hkm.db, deneme deposu, 6 paket, PC dosyası ve tekkapi.py'yi kapsar, her kopyanın SHA-256 ve boyutu canlı ilk hâlle tutar; göçe yalnız en yeni gönderimler (6 paketten 5) girer; tek depoda cihazın son hâli kazanır, eski gönderimde olup cihazda silinen kayıt dirilmez, telefon kaydı gelir; karşılaştırmadaki 1 fark paket kuralıyla açıklanır; deneme deposu kenarda bayt bayt aynı; yeni kabuk başlangıç paketi; `durum.json` tamam; ikinci `--ac` reddeder.
- `--geri`: tekkapi.py ilk hâli, deneme deposu yerinde, tek kapı deposu kenarda (silinmez), eski kapılar açık, hesap.db'nin bilerek geri konmadığı yazılır; ikinci `--geri` reddeder.
- Her adımda zorlanmış hata (`LIFEOS_TKA_TEST_HATA`: durdur, yedek, göç, başlangıç, karşılaştırma, ETKIN, başlat, doğrula) ve doğal hatalar (sunucu `/ays/`'e 404, tek kapı açılışta çöker, başlangıç aracı çöker, LifeOS durmaz, çatışmalı veri → göç yazmaz): her birinde çıkış 1, tekkapi.py bayt bayt aynı, deneme deposu aynı, hesap.db ve paketler aynı, tek kapının açılışta değiştirdiği `ayar.json` yedekten onarılmış, eski düzen açık, çıktı geri dönüşü söyler.

Ötekiler (değişiklikten sonra): `goc_test.py` temiz, `tekdepo_test.py` temiz, `tekkapi_test.py` 140/140 yeşil. `tools_dizin_kabul_test.py` KIRMIZI yalnız «dizindeki tek_kapi_ac_test.py tools/ altinda yok»: test `git ls-files` okur, yeni dosya henüz izlenmiyor; commit'ten sonra yeşil olmalı (DIZIN satırı Testler bölümünde). Mevcut hiçbir dosya değiştirilmedi (yalnız `tools/DIZIN.md`'ye bir satır).

## Sahibin göreceği
Bugün (2026-11-14, gerçek `--denetle`, salt okur): **Hazır değil.** Paket klasöründe 4 paket, hepsi tek cihazdan (`cc6500bd…`, 03:54, ays/spi/esp/gun; sunucuya gitmemiş 12 + 10 + 7 + 0 değişiklik), 120 dakikadan eski. Bu cihazın adı hesap deposunda yok ama kimliği orada geçiyor (eski eşitleme kayıtları), bu yüzden «türünü göremedim». Ev ağı kapıları 5173/5183/5193/5180 açık, Tailscale serve 4173/4183/4193/4200'e yönlendiriyor: bir telefon kullanılıyor olabilir. Sunucu çalışıyor, uygulama penceresi kapalı, ETKIN kapalı, hesap deposu dolu, sahip hesabı var, deneme deposu var, boş disk 228 GB (gereken ~1,2 GB). Eksik: (1) bu bilgisayarın paketleri tanınamadı / eski, (2) telefon paketi yok. Kanıt: çalıştırmadan önce ve sonra `%LOCALAPPDATA%\LifeOS`, `~\LifeOS-Sistem\HKM\db` ve `tekkapi.py` altındaki 1492 dosyanın boyut + mtime listesi alındı: **0 dosya değişti**.

Sahibin yapacakları, sırayla:
1. Telefonda LifeOS'a gir, «Bilgisayara gönder»e bas (ya da telefonda veri yoksa adım 4'te `--telefon-yok`).
2. Bu bilgisayarda LifeOS'u aç; AYS (4173), SPİ (4183), ESP (4193) ve 127.0.0.1:4180/kartlar/'da Hesap › giriş › «Bilgisayara gönder». Çıkış yapma (oturum bu cihazı «Windows PC» diye tanıtır).
3. LifeOS penceresini kapat; `python sistem/tek_kapi_ac.py` → «Karar: Hazır.»
4. `python sistem/tek_kapi_ac.py --ac` (iki saat içinde).

Başarılı `--ac` sonunda yazılan: 4180 yeni kabuğu açar; eski giriş `/kartlar/`, Ana sayfa `/gun/`, modüller `/ays/` `/spi/` `/esp/`; modülü yeni adreste ilk açışta eski kayıtları paketten oraya yazılır (üstüne yazmaz); 4173/4183/4193, 4200 ve ev ağı kapıları kapalı, eski adreslerdeki tarayıcı verisi yerinde; telefonu tek kapıya bağlamak için `python sistem/uzak.py --ac` (komut ağ ayarına dokunmaz); «Güncelle» ETKIN satırı main'e işlenene kadar engel der; geri dönüş `--geri`. Bozulursa her adım «✓/✕» satırıyla, ardından «Geri alınıyor:» altında yapılan her geri işlem ve «Tek kapı AÇILMADI; eski düzen yerinde. Yedek: …».

## Açık sorular
1. **ETKIN main'e ne zaman?** Komut çalışan kopyanın `sistem/tekkapi.py`'sini değiştirir; `guncelle.py` kural 2 elle değişmiş izlenen dosya varken güncellemeyi durdurur. Aynı satır main'e işlenince `_yarim_mi` güncellemeyi geçirir. Ama satır main'e `--ac`'den ÖNCE girerse çalışan kopya güncellenince göçsüz ETKIN = True olur (eski kökenlerdeki veri yeni yolda görünmez). Öneri: satır main'e ancak sahibin `--ac`'si başarılı olduktan sonra işlensin.
2. **`/api/hesap/goc-paket/son` birden çok cihazda yanlış paketi seçer** (`sistem/hesap.py`, kabuk/tasima.js bunu kullanır): «sıralı listede sonuncu en yenidir» varsayımı ad `<kaynak>-<cihaz>-<zaman>` olduğu için yalnız tek cihazda doğru; telefon paketi gelince kaynak başına alfabetik son CİHAZ seçilir ve PC'nin yeni kökenine telefonun deposu yazılabilir (üstüne yazmaz, ama yanlış cihazın verisi). Bu dosya bu işin düzenleme listesinde değil; düzeltme: kaynak başına bu bilgisayarın (istek 127.0.0.1'den, oturumdaki cihaz) en yeni 1. parçası.
3. **Tailscale serve**: geçiş serve'e dokunmaz; telefon tek kapıya `uzak.py --ac` ile geçer (eski 5173/5183/5193 serve kapılarını kapatır). Komuta katılsın mı, sahibin ayrı adımı mı kalsın?
4. **`veri.OKU`** kapalı kalır (goc.py: «fark 0 olunca OKU ve ETKIN açılır»). Paket kuralıyla açıklanan farklar varken OKU'nun açılması ayrı karar; bu komut yalnız ETKIN'i açar.
5. **PC'yi tanıma**: paket cihaz türü taşımaz. Ad yalnız oturumda/`cihaz_adi`'nda; çıkış oturumu siler. Sahip gönderip çıkış yaparsa PC «göremedim» olur ve komut reddeder (güvenli taraf). Paket ucunun (`paket_kaydet`) gönderen cihazın adını pakete yazması bunu kalıcı çözer.
6. **Taze pencere 120 dk** varsayımdır (`--bekleyen-pakette` beyanı «az önce»); sahip isterse değişir.
7. Gerçek `baslat.py --dur` / `--tarayicisiz` ve gerçek tek kapının 4180'deki doğrulaması yalnız sahte ağaçta sınandı (gerçek portlara dokunulmadı); `tekkapi_test.py` aynı yolları boş portta sınıyor.

**Düzeltildi (eşgüdümcü, 2026-11-14):** `/api/hesap/goc-paket/son` artık `?cihaz=<kimlik>` alır ve yalnız o cihazın paketlerini verir; `kabuk/tasima.js` kimliği kapıdan bağımsız `lifeos_cihaz` çerezinden gönderir. Ayrıca «en yeni paket» sırası dosya adının zaman parçasına göre (önceden adın tamamına göre sıralanıyor, cihaz kimliği sırayı bozuyordu). Testler `tools/tekkapi_test.py` içinde.
