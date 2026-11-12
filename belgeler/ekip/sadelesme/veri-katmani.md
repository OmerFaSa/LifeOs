# Veri katmanı keşfi — tek depoya giden yol

Salt okur keşif raporu. Kaynak: `C:\Users\ASUS\LifeOs-sadelesme` (origin/main, d375ef2d). Gerçek veri açılmadı; yalnız kod ve testler okundu.
Kesinlik etiketleri AGENTS.md §1.2'ye göre: **ölçüldü** (dosyada saydım/okudum), **hesaplandı** (okuduklarımdan çıkarım), **tahmin**, **göremedim**.

## 1. Durum haritası (kalıcı veri nerede)

### 1a. Tarayıcı tarafı (her modül kendi kökeninde: 4173 AYS, 4183 SPİ, 4193 ESP)

Üç modülün ana deposu artık tek kod: `brand/ortak/depo.js` (555 satır); modülün `core/store.js`'i (25 satır) yalnız ayar verir. `brand/ortak/*.js` dosyaları `tools/ortak.py --yay` ile her modülün `src/js/core/` klasörüne birebir kopyalanır (`brand/ortak/sw.js:2-4`, `brand/ortak/yedekag.js:2-4`); aşağıdaki sayımlarda kopyalar ayrıca sayılmadı.

| Depo | Yer | Biçim | Yazan / okuyan | Doğruluk kaynağı mı | Sınır |
|---|---|---|---|---|---|
| AYS ana depo | localStorage `rota84285.v2` (profil `main`), öteki profiller `rota84285.v2.<p>` (`AYS/src/js/core/store.js:16`) | TEK anahtarda düz JSON sözlük: `{ "yol/kimlik": kayıt }` (`depo.js:117-160` `localAll/localWrite`) | AYS `R.Store` | Evet (cihazda) | ~5 MB/köken, `depo.js:524` `LOCAL_QUOTA` |
| SPİ ana depo | `spi.v1.<profil>` (varsayılan `ben`) (`SPI/src/js/core/store.js:16`) | aynı | `SP.Store` | Evet | aynı |
| ESP ana depo | `esp.v1.<profil>` (varsayılan `ben`) (`ESP/src/js/core/store.js:16`) | aynı | `ESP.Store` | Evet | aynı |
| Etkin profil | `rota.activeProfile` / `spi.activeProfile` / `esp.activeProfile` | düz metin | `depo.js:50` `activeProfile` | ayar | — |
| Yükleme öncesi geri alma | `<ana anahtar>.oncesi` (`depo.js:63` `UNDO_KEY`) | `{at, data}` | `importAll` yazar, `undoImport` okur (`depo.js:385-472`) | türetilmiş, tek yuva | aynı kotadan yer |
| Defter medyası | IndexedDB `lifeos-defter-<modul>` v1, nesne deposu `medya` (keyPath `id`) (`brand/ortak/defter.js:253-256`) | Blob | defter.js | Evet, **yalnız bu cihazda** | tarayıcı IDB kotası |
| Defter notları | ana depoda `defter/<id>`, terimler `defterterim/` (`defter.js:223`, `:379`) | JSON | defter.js `ayar.store` | Evet | ana depo kotası |
| SPİ fotoğrafları | IndexedDB `spi-foto`, depo `foto`, anahtar `<profil>|<sahip>` (`SPI/src/js/core/foto.js:31-44`) | JPEG blob (en uzun kenar 1080, kalite 0,82) | SP.Foto | Evet, yalnız bu cihazda | IDB |
| AYS soru/deneme fotoğrafları | IndexedDB `ays-soru-foto`, depo `foto`; çözüm metni `<anahtar>|cozum` (`AYS/src/js/core/sorufoto.js:41-53`) | blob + metin | R.SoruFoto, `denemefoto.js` | Evet, yalnız bu cihazda | IDB |
| Çevrimdışı kabuk | Cache Storage `lifeos-kabuk-v2` (`brand/ortak/sw.js:28`) | HTTP yanıtları | sw.js | Türetilmiş; **kişisel veri girmez**, `/api/` saklanmaz (`sw.js:17-21`) | — |
| HKM işaret defteri | ana depoda `hkmIntentLog` (`AYS/src/js/core/beacon.js:674-704`) | `{entries:[…]}` | beacon.js | türetilmiş günlük | ana depo |
| AYS profil anlık görüntüleri | `rota.snapshots` (`AYS/src/js/screens/profiles.js:86`) | JSON | profiles.js, kingarac.js:785 | yedek kopya | aynı köken kotası |
| SPİ hane listesi | `spi.household` (`SPI/src/js/core/state.js:237`) | JSON | state.js, kingarac.js:751 | Evet (profil listesi) | — |
| Model ayarları | `<rota|spi|esp>.llm.catalog/keys/limits/quota` | JSON | modül LLM katmanı | ayar; **`*.llm.keys` adı anahtar sakladığını gösteriyor** (değer okunmadı) | — |

**Ana deponun içi (koleksiyonlar).** `R.Store/SP.Store/ESP.Store.(set|get|list|remove)('<sabit yol>')` çağrılarını betikle saydım (ölçüldü, alt sınır: değişkenle kurulan yollar ve `defter/` gibi ortak kodun yolları bu sayıma girmez):

| Modül | Sabit yol öneki sayısı | Yollar |
|---|---|---|
| AYS (`R.SCHEMA_VERSION = 5`, `AYS/src/js/core/store.js:14`) | 34 ayrı ad (62 biçim, `x` ve `x/`) | activities, breaks, briefings, calendar, cards, days, decisions, errors, exams, forecasts, hedefPlanlar, hedefler, hkm, journal, meetings, meta/, mood, office, plan/, prefs/, profile/, profiles, protocols, reviews, sessions, signals, sinavprofil, solved, sources, storage, testkitabi, topics/, usage, videoNotes, weeks |
| SPİ (`SP.SCHEMA_VERSION = 1`) | 26 ad (37 biçim) | basket, briefings, chats, decisions, flags, foods, forecasts, hedefler, hekim, hkm, labs, meals, meds, meetings, meta, office, prefs, prices, profile, progress, signals, storage, usage, vitals, workouts |
| ESP (`ESP.SCHEMA_VERSION = 1`) | 33 ad (53 biçim) | args, assets, books, briefings, cards, chains, chats, days, decisions, drafts, events, forecasts, goals, hedefler, hkm, meetings, meta, notes, office, pieces, prefs, profile, proposals, recordings, reminders, signals, sources, storage, timer, usage, weekplan |

**Şema göçleri.** Sürüm `meta` kaydında `schemaVersion` olarak durur. AYS `migrate()` (`AYS/src/js/core/state.js:1141-1191`) v2→v5 adımlarını çalıştırır; v4→v5 «uydurma sıfırların onarımı»dır (boş bırakılan alana yazılmış 0'ları yeniden türetir ya da «veri yok» yapar, `:1147-1160`). SPİ (`SPI/.../state.js:944-948`) ve ESP (`ESP/.../state.js:1380`) yalnız sürüm numarasını yazar, dönüşüm yok.

`hkm`, `storage`, `usage` yolları **cihaza aittir**: dışa aktarmaya ve eşitlemeye girmez (`depo.js:340` `CIHAZA_AIT`).

**Kota davranışı.** Yazma her seferinde tüm sözlüğü serileştirir, bellekte ayrıştırılmış kopya tutulur (`depo.js:100-130`); kota hatası `isQuotaError` ile tanınır (`depo.js:89-94`), yazılamayan kayıt «kaydedildi» olayı üretmez (`depo.js:276`). Doluluk tüm kökenin localStorage'ı üzerinden ölçülür, %75 «yakın», %92 «dolu» (`depo.js:521-541` `originSize/localQuota`). `navigator.storage.persist()` istenir (`depo.js:243-249`).

**Bulut kipi.** `init` önce `window.claude.use('db')` dener (Artifact db yeteneği), yoksa yerel kip (`depo.js:233-241`). Yerel kopya her iki kipte tutulur.

**Dışa aktarma biçimi.** `{__meta:{app, schemaVersion, exportedAt, mode}, data:{yol:kayıt}}` (`depo.js:347-357`); `readBackup` önce uygulama kimliğine, sonra şema sürümüne bakar, daha yeni şemayı reddeder (`depo.js:360-380`). Uygulama kimlikleri: `rota-84285`, `spi-saglik`, `esp-entelektuel` (`store.js:15`, `HKM/core/yedek.py` `MODULLER`).

**Öteki localStorage anahtar aileleri.** `brand/ortak` kodunda sabite atanmış anahtar/önek **en az 86** ayrı (32'si `lifeos.king*`; ayrıca `lifeos.tema*`, `lifeos.zemin*`, `lifeos.muzik*`, `lifeos.minik*`, `lifeos_hesap`, `lifeos_hesaplar`, `lifeos_cihaz`, `lifeos_sunucu`, `lifeos.profiller` …) + 9 doğrudan `getItem/setItem` dizgisi; modüle özgü olanlar AYS 8 (`rota.activeProfile`, `rota.snapshots`, `rota.llm.*` 4, `rota.notify.lastDay`, `ays.king.tekrar`), SPİ 8 (`spi.activeProfile`, `spi.household`, `spi.llm.*` 4, `spi.ogret.son`, `spi.ogret.tekrar`), ESP 6 (`esp.activeProfile`, `esp.profiles`, `esp.llm.*` 4). Sayım yöntemi: satırdaki ilk `const X = '<önek>…'` ve `localStorage.getItem/setItem('…')` dizgileri (ölçüldü, alt sınır: bir satırda birden çok sabit, ör. `ayarlar.js:485` `lifeos.profil.etkin`, ve dinamik kurulan anahtarlar sayılmadı). sessionStorage dizgisi: 0. Bu ailelerin hepsi aynı kökenin ~5 MB'ından yer.

**Günlük modül yedeği (`brand/ortak/yedekag.js`, 172 satır).** HKM açıksa günde bir kez dışa aktarım HKM'ye gider; «alındı» ancak HKM aynı bayt + SHA-256'yı geri söylerse (söz 2), boş modül yollamaz (söz 4), yarıdan küçük yedek uyarılır (söz 5). HKM tarafı `HKM/core/yedek.py`: klasör `<hkm.db klasörü>/yedek/`, dosya `<modul>/<YYYY-AA-GG>.json` kalıbı (`AD` regex), saklama: son 14 gün + son 6 ayın her birinin son yedeği (`GUNLUK=14`, `AYLIK=6`, `KUCULME=0.5`).

**Beacon (işaret).** `core/beacon.js` tek yönlü, en iyi çabalı gün özeti: `POST /api/sync/<modul>` (HKM), varsayılan kapalı, her metrik kesinlik etiketli (`AYS/src/js/core/beacon.js:1-22`, `:524`). Senkronizasyon değildir; HKM'deki kopyası türetilmiştir.

**Dördüncü köken: giriş sayfası (4180, `sistem/gun.py`).** Gün kaydı her gün ayrı anahtarda: `lifeos.gun.<YYYY-AA-GG>` (`gun.py:745`), Gün › Sen `lifeos.gun.sen` (`:765`), Bilinç haritası `lifeos.bilinc`, `lifeos.bilinc.yorum` (`:992`), cümle önbelleği `lifeos.gun.cumle`. Sunucuya yalnız **son günün** kopyası gider (`yayin` satırı `gun/kayit`, kullanıcı başına tek satır, üzerine yazılır: `gun.py:757`, `hesap.py:1819-1836`). Yani **Gün geçmişi yalnız 4180 kökeninin localStorage'ında**; ana depo/eşitleme yolu yok.

### 1b. Sunucu tarafı (PC)

| Depo | Yer | Biçim | Yazan / okuyan | Doğruluk kaynağı mı | Sınır |
|---|---|---|---|---|---|
| Ortak ayarlar | `%LOCALAPPDATA%\LifeOS\ayar.json` (`sistem/ayar.py:51-61` `klasor/_yol`) | JSON `{anahtar:değer}` + iz/çakışma | `GET/POST /api/ayar`, `POST /api/ayar/esitle` (`ayar.py:9-11`); sayfaya gömülür (`sayfaya_ekle`) | Evet, yalnız **tercih** (`lifeos.` önekli, `animasyon.js` KATALOG'una uyan); veri, hesap, kilit, King hafızası yazılamaz (söz 2) | 120 anahtar, değer 4 KB, profiller 60 KB (`EN_COK=120`, söz 3) |
| Hesap deposu | `%LOCALAPPDATA%\LifeOS\hesap\hesap.db` (Windows) ya da `~/.lifeos/hesap` (`hesap.py:460-467` `klasor`, `:526`) | SQLite (stdlib `sqlite3`, WAL), **15 tablo** (`hesap.py:339-458`) | `sistem/hesap.py` `Depo`; istemci `brand/ortak/hesap.js` | Kayıtlar için **kopya** (söz 1: «sunucu bir kopyadır»); hesap/oturum/2FA için tek kaynak | tek kayıt 2 MB, gövde 24 MB, gönderim 5000, cevap 1000 kayıt (`hesap.py:219-223`) |
| Hesap deposu yedekleri | `<hesap klasörü>\yedek\hesap-<gunluk|elle|once|dis>-YYYYAAGG-SSddss.db` (`hesap.py:304` `KOPYA_RE`, `kopya_klasoru`) | SQLite tam kopya (`sqlite3` backup) | `kopya_al`, `geri_yukle` | yedek | tür başına en yeni: günlük 7, elle 5, önce 5, dış 3 (`KOPYA_SAKLA`, `hesap.py:303`) |

`hesap.db` tabloları amaca göre (ölçüldü, `hesap.py:339-458`):

| Amaç | Tablolar | Kullanıcı gerçeği mi |
|---|---|---|
| Modül kayıtlarının kopyası | `kayit(kullanici, alan, yol, deger, zaman, cihaz, sira)` PK (kullanici, alan, yol) | Kopya (cihazdaki depo asıl) |
| Modüllerin yayınladığı özetler | `yayin(kullanici, ad, icerik, adet, zaman, +gun)`: `<modul>/takvim`, `/bugun`, `/gun`, `/gunluk`, `/kisi`, `gun/kayit`, `gun/sen`, `gun/bilinc` (`hesap.py:263-271`, `:1819-1880`) | Türetilmiş (modül üretir); `gun/*` için **göremedim**: başka yerde asıl kopyası var mı |
| Kimlik ve güvenlik | `kullanici`, `oturum`, `iki_adim`, `yedek_kod`, `bilet`, `bag_kodu`, `anahtar`, `takvim`, `cihaz_adi` | Evet (tek kaynak) |
| Gelen kutusu | `gelen` (Kısayollar/Home Assistant satırları, en çok 200/kullanıcı) | Evet, geçici; işlenince modül Onaylar'a öneri yapar |
| Defter/sayaç | `olay` (etkinlik, son 300), `sayac` (`sira`), `ayar` (`donem` …) | Türetilmiş / iç durum |

Şifreleme: parola PBKDF2-HMAC-SHA256 600 000 tur (`hesap.py:211`, söz 4), jetonların yalnız SHA-256 özeti; **TOTP sırrı açık durur** (söz 14). Kayıt içerikleri (`kayit.deger`) düz JSON metin; diskte şifreleme göremedim.

### 1c. HKM ve öteki PC dosyaları

**HKM ambarı.** `HKM/db/hkm.db` (`HKM/core/db.py:17` `DB_PATH`; daemon `config.json` `db_path` ile değiştirebilir, `HKM/daemon.py:2352`). SQLite, WAL + busy_timeout (`db.py:860-894`). Şema sürümü yok; `_migrate` her açılışta `MIGRATIONS` listesindeki eksik sütunları `ALTER TABLE ADD COLUMN` ile ekler (`db.py:841-857`, `:765-`). Yedek biçimi `export_all`, `BACKUP_SCHEMA = 4` (`db.py:1082-1085`); ambar kopyaları `hkm-<etiket>-<damga>-<sıra>.db` (`db.py:1272`).

**Tablo sayısı: 50** (ölçüldü). `grep "CREATE TABLE"` 51 verir ama biri yorumdur: `db.py:765` «CREATE TABLE IF NOT EXISTS var olan bir tabloyu GÜNCELLEMEZ». HKM'de `db.py` dışında tablo kuran dosya göremedim (testler hariç). `BACKUP_TABLES` 35 tablo (`db.py:1072-1081`); 15 tablo yedeğe girmez.

| Amaç | Tablolar | Gerçek mi türetilmiş mi | Yedekte |
|---|---|---|---|
| Modül işaretleri (beacon) | `raw_events(module, date, payload)` | Türetilmiş: modülün gün özeti (`/api/sync/<modul>`) | evet |
| Kural motoru, karar | `audits`, `decisions`, `decision_sources` | Türetilmiş (yeniden hesaplanabilir; geçmiş kararın kaydı olarak saklanıyor) | evet |
| Niyet / teklif kuyruğu | `intents`, `outbox`, `inbox_seen`, `bildirimler`, `is_emirleri` | Akış durumu; kararın izi | evet |
| Sohbet, ek | `conversations`, `attachments` | **Gerçek** (kullanıcının yazdığı) | evet |
| HKM hafızası | `memories(user, scope, text, source, state, …)` | **Gerçek** | evet |
| Hafıza gömme önbelleği | `hafiza_gomme` | Türetilmiş | hayır |
| King «olanlar» | `eylem` (her King eylemi + geri alma bilgisi, `db.py:422-435`), `king_olaylar` | **Gerçek defter** (eklemeli) | evet |
| King işleri | `king_isler`, `king_gorevler`, `king_beceriler`, `king_sozler`, `king_bekleyen` | Gerçek (kullanıcının beceri/söz tanımları) + kuyruk | evet |
| BAM | `bam_isler`, `bam_kayitlar`, `bam_iz` / `bam_depo_rapor` | gerçek / türetilmiş | evet / hayır |
| Para | `para` (kuruş tamsayı, silme işaretli) / `para_taslak` | **Gerçek, yalnız HKM'de** / geçici | evet / hayır |
| Motto (kullanıcı yazısı) | `motto_nodes`, `motto_versions`, `motto_links`, `motto_tags` | **Gerçek, yalnız HKM'de** | evet |
| Meydan / Danışma | `meydan_deste`, `meydan_isaret`, `meydan_not`, `meydan_yanit` / `meydan_hikaye` | gerçek / türetilmiş (14 gün) | evet / hayır |
| Kullanıcı beyanı | `zaman_butcesi`, `susturmalar`, `hedef_ozet` | gerçek (beyan) / `hedef_ozet` anlık görüntü | evet |
| Modül anlık görüntüleri | `duyurular`, `yarin_ozet`, `tatil_ozet`, `dil_karti`, `goruntu_sira` | Türetilmiş (modül başına tek satır) | hayır |
| Soru-cevap | `sorular` («dün kaç saat uyudun?» cevabı) | **Gerçek ölçüm adayı**, yedekte değil | hayır |
| Önbellek, sayaç, tarife | `web_onbellek`, `web_sayac`, `model_tarife`, `usage`, `aktif_tur`, `aktif_is` | Türetilmiş | `usage` evet, öteki hayır |

**Kullanıcının uygulama klasöründeki öteki dosyalar** (yalnız koddan; içerikler açılmadı):

| Dosya / klasör | Ne | Kanıt |
|---|---|---|
| `%LOCALAPPDATA%\LifeOS\planlama.json` | haftalık sistem planı (açılış/kapanış/tarama) | `sistem/planlama.py:22`, `:75` |
| `%LOCALAPPDATA%\LifeOS\ice\ice.json` | Takeout özeti (adım, YouTube), gizli iCal adresi | `sistem/ice.py:1-12`, `:39-44` |
| `%LOCALAPPDATA%\LifeOS\muzik\dizin.json` + dosyalar | müzik dizini | `sistem/muzik.py:25`, `:57`, `:86` |
| `%LOCALAPPDATA%\LifeOS\zemin\` | kullanıcının arka plan görselleri/videoları | `sistem/zemin.py:26`, `:48-53` |
| `%LOCALAPPDATA%\LifeOS\telefon\` | telefon için kök sertifika vb. | `sistem/telefon.py:58-64`, `sistem/tasi.py:9` |
| `HKM/config.json` | HKM ayarı, `kasa:` gönderimli API anahtarları (Windows kasası) | `sistem/tasi.py:17-19`, `:75` |
| `%APPDATA%\LifeOS\Local Storage`, `IndexedDB`, `WebStorage` | **masaüstü kabuğunun (Electron) tarayıcı profili**: üç modülün PC'deki localStorage ve IndexedDB'si burada | `sistem/tasi.py:66-79` |

`sistem/tasi.py` bunların hepsini tek şifreli pakete koyar (scrypt + blake2b sayaç kipi + HMAC-SHA256, `tasi.py:9-12`): **bugün var olan tek «hepsi bir arada» taşıma aracı** budur, ama kayıtları anlamaz, dosya kopyalar.

## 2. Eşitleme protokolü (uygulandığı hâliyle)

Sunucu: `sistem/hesap.py` (2911 satır, `SURUM = 8`, `:209`); istemci: `brand/ortak/hesap.js` (4298 satır). Sunucu her modül kapısında `/api/hesap/` altında **48 ayrı yol** sunar (dizgi sayımı, ölçüldü).

| Konu | Uygulanan | Kanıt |
|---|---|---|
| Uç | `POST /api/hesap/esitle {alan, cihaz, cihaz_ad, son, gonder[], yalniz_gonder?}` → `{al[], son, daha, kabul, red, donem}` | `hesap.py:1094-1161` `Depo.esitle` |
| Kayıt kimliği | (kullanıcı, **alan**, **yol**). Alan = `<modul>/<profil>` (`ALAN_RE ^(ays|spi|esp)/[A-Za-z0-9_.-]{1,40}$`, `hesap.py:215`); yol = modül deposundaki anahtar (`vitals/2026-10-04`) | `hesap.py:357-366`, söz 2 |
| «Kayıt» nedir | Ana localStorage sözlüğünün bir girdisi (bütün değer, alan düzeyinde birleştirme yok). Gönderilen küme `Store.hepsi()` = sözlüğün tamamı eksi `hkm/storage/usage` | `depo.js:222`, `:340`; `hesap.js:972`, `:998-1000` |
| Saat | Değişiklik zamanı **cihazın duvar saati** (ms): sıraya `max(şimdi, önceki+1)` yazılır | `hesap.js:832-843` `degisti` |
| Çakışma | Sunucu: `(z, cihaz) <= (kayıtlı zaman, kayıtlı cihaz)` ise ret → son yazan kazanır, eşitlikte cihaz kimliği sözlük sırasıyla. İstemci: sırada daha yeni yerel değişikliği olan yol uzaktan gelenle ezilmez; aynı değer yazılmaz | `hesap.py:1131-1136`; `hesap.js:1009-1015` |
| İmleç | Sunucuda tekil artan `sira` sayacı (`sayac` tablosu); cihaz `son` imlecinden sonrasını sayfa sayfa çeker (en çok 1000, `daha`) | `hesap.py:1090`, `:1145-1157` |
| Çevrimdışı kuyruk | localStorage `lifeos.hesap.sira.<alan>` = `{yol: z}` (değer değil, yalnız yol+zaman; gönderimde değer depodan okunur). Yazmadan 2,5 sn sonra toplu tur; parti 400 kayıt / 1,5 MB | `hesap.js:811-822`, `:628-634`, `:897-907` |
| Cihaz durumu | `lifeos.hesap.imlec.<alan>` (`son, ilk, donem, kalan|tazele`), `.sahip.`, `.hesap.`, `.son.` | `hesap.js:811`, `:828` |
| Cihaz kimliği | **Çerez** `lifeos_cihaz` = `c` + 24 onaltılık (rastgele), oturum çerezi `lifeos_hesap` | `hesap.js:622-623`, `:764-770` |
| İlk eşitleme | Alan ilk kez bağlanınca bütün yerel yollar `ilk:true` ve **`z:1`** ile gider; sunucuda olan yol değişmez, olmayan eklenir, ilk eşitlemede silme atlanır | `hesap.js:970-1000`; `hesap.py:1134-1138`; test `HKM/tests/test_hesap.py:182` `t_ilk` |
| Silme | Mezar taşı: `deger = NULL` satırı kalır, öteki cihaza `d:null` gider; özet ve dışa aktarma saymaz. Mezar taşlarını budayan kod **göremedim** (`DELETE FROM kayit` yok) | `hesap.py:1140-1143`, `:1167`, `:1190`; test `t_silme` `:197` |
| Geri yükleme | Yalnız admin, PC'den, parolayla; önce «önce» yedeği; `donem` yeni rastgele değer olur; cihaz dönem değişimini görünce imleci sıfırlar, kendi kayıtlarını son eşitleme zamanıyla `yalniz_gonder` ile yeniden yollar | `hesap.py:2264-2322`, `:1956-1963`; `hesap.js:923-935`, `:979-996`; testler `t_geri_yukle :1334`, `t_donem_tazele :1381` |
| Günlük yedek | `hesap.db`'nin SQLite kopyası, tür başına en yeni N | `hesap.py:303-310`, `kopya_al` |
| Eşitlenmeyen | Fotoğraflar ve defter medyası (IndexedDB), `hkm/storage/usage` yolları, «örnek» profil, çoğu `lifeos.*` cihaz anahtarı; ortak tercihler AYRI kanaldan (`/api/ayar/esitle`, `hesap.js` `ayarTur`) | AGENTS §1.4; `hesap.py:220` yorumu; `depo.js:340`; `hesap.js:939`, `:1039`, `:1115` `ayarTur` |
| Başka hesap | Alan bir hesaba bağlıysa başka hesapla eşitlenmez | `hesap.js:961-964`; test `hesap.test.js:761` |

Testler: `HKM/tests/test_hesap.py` 1894 satır, **79** `t_` testi; `brand/ortak/hesap.test.js` 2655 satır, **93** `it(` (ölçüldü). Eşitlemeye doğrudan dokunanlar: `t_esitle_temel :151`, `t_ilk :182`, `t_silme :197`, `t_geri_yukle :1334`, `t_donem_tazele :1381`; JS'de `:518` ilk eşitleme, `:683` çevrimdışı sıra, `:703` silme, `:726` sıradaki yeni değişiklik, `:744` 401'de sıra korunur, `:777` örnek profil.

**Zayıf noktalar (hesaplandı).** (1) Duvar saati: saati ileri kaymış bir cihaz, o kaydı sonradan yazılan doğru kayıtlara karşı kazanır. (2) İlk eşitlemede `z:1` gider: sunucudaki `zaman` gerçek değişiklik zamanı değildir; `ayrinti()`'deki «son değişiklik» de bu yüzden yanıltıcı olabilir (`hesap.py:1170-1176`). (3) Bütün kayıt tek birim: iki cihaz aynı günün (`days/…`) farklı alanlarını değiştirirse biri kaybolur. (4) Mezar taşları sınırsız birikir.

## 3. Hipotez: "Hesap sunucusu üç modülün tüm kayıtlarını zaten tutuyor"

**Hüküm: kısmen doğru — göç sunucu kopyasından BAŞLAYABİLİR ama onunla BİTEMEZ** (hesaplandı, koddan; gerçek `hesap.db` açılmadı, içindeki sayıları göremedim).

Doğru olan: bir alan (`<modul>/<profil>`) hesaba bağlandıktan sonra ana depodaki **her yol** sunucuya gider (ilk bağlanışta `kalan = Object.keys(hepsi())`, `hesap.js:970-976`; sonra her yazma `degisti` ile sıraya girer, `:832-843`). Değer, modülün yazdığı JSON'un aynısıdır (`hesap.py:1121`); kesinlik etiketleri kaydın içindeyse onlar da oradadır. Kişi modeli (`meta/hafiza`, `brand/ortak/hafiza.js:79`), öğrenme motoru kaydı (`meta/omKayit`, `ogrenmotor.js:69`), defter notları (`defter/`, `defterterim/`) ana depoda olduğu için sunucuya da gider.

Sunucuda OLMAYAN ya da eksik olabilenler:

| Eksik | Neden | Kanıt |
|---|---|---|
| Hiç giriş yapılmamış modül/cihaz | Oturum yoksa ve alan bağlı değilse sıraya bile girmez | `hesap.js:835` (`!sahip(a)` → dön), `:942` |
| Açılmamış profiller | Alan, sayfa açılırken etkin olan profildir; öteki profiller ancak açılınca bağlanır | `depo.js:546` `alan:o.alan + '/' + PROFILE`; `hesap.js:812` |
| «Örnek» profil | Bilerek eşitlenmez | `hesap.js:939`; test `hesap.test.js:777` |
| Cihazda sırada bekleyen değişiklikler | Çevrimdışı telefon/tablet gönderene kadar | `lifeos.hesap.sira.<alan>`, `hesap.js:814-822` |
| `hkm`, `storage`, `usage` yolları | cihaza ait | `depo.js:340` |
| Bütün fotoğraflar ve defter medyası | IndexedDB, eşitlenmez | AGENTS §1.4; `hesap.py:220` |
| Ana depo DIŞINDAKİ localStorage | `rota.snapshots`, `spi.household` (SPİ hane/profil listesi), `esp.profiles`, `*.llm.*`, `spi.ogret.*`, `lifeos.olay.giden.<modul>`; King'in `lifeos.king.dersler` (`king-devrim.js:233`), `lifeos.king.aliskanlik` (`king-kart.js:1263`), `lifeos.king.cikarim`, `.donus`, `.tanisma`, `.hafta-hedef` … | Bunlar ayar KATALOG'unda da yok (`animasyon.js:263-`, 72 girdi). KATALOG'dakiler (`lifeos.king.kartlarim`, `.yapilacak`, `.hatirlat`, `lifeos.profiller` …) `ayar.json`'a gider, `hesap.db`'ye değil |
| Gün geçmişi (niyet, enerji, iç hava, bloklar) | 4180 kökeninde `lifeos.gun.<tarih>`; sunucuda yalnız son gün (`yayin gun/kayit`) | `sistem/gun.py:745-757`; `hesap.py:1819` |
| HKM'nin bütün verisi | Ayrı ambar (`HKM/db/hkm.db`): `para`, `motto_*`, `memories`, `conversations`, `eylem`, `king_*`, `sorular`, `zaman_butcesi` … | §1c |
| Gerçek değişiklik zamanı | İlk eşitlemeyle gelen kayıtlar `zaman = 1` taşır | `hesap.js:999`; `hesap.py:1140` |

Ek bulgu: `/api/hesap/defter` zaten «üç modülün notları sunucudan» okuyor ama yalnız `ays/main`, `spi/ben`, `esp/ben` alanlarını (`hesap.py:1883` `shortcut:` yorumu). Yani sunucudan okuyan ilk tüketici de profil sınırını bilerek kesmiş.

**Sonuç.** Göç aracı kayıtların omurgasını `hesap.db › kayit`'tan alabilir (tek SQLite, standart kütüphaneyle okunur); ama (a) her cihazın her profilinde «bekleyen 0» doğrulanmadan, (b) HKM ambarı ayrıca taşınmadan, (c) ana depo dışı anahtarlar ve fotoğraflar her köken için cihazdan ayrıca çekilmeden tamamlanmış sayılamaz. Üç köken okunmadan geçilemeyecek olanlar: fotoğraflar, defter medyası, KATALOG dışı `lifeos.*` anahtarları, profil listeleri.

## 4. Kayıt türü kataloğu taslağı

**Kesinlik etiketinin bugünkü biçimleri (ölçüldü).** Ortak katman ve HKM dört kodu kullanır: `measured / estimated / computed / missing` (`brand/ortak/kesinlik.js:64-73`, `HKM/core/certainty.py:3-6`). Modüllerin **sakladığı** kayıtlarda ise «hesaplandı» `derived` diye yazılıyor (`SPI/src/js/core/state.js:483`, `AYS/src/js/core/state.js:505-518` `blankCert:'derived'`; `'derived'` dizgisi testler hariç 16 dosyada geçiyor); `derived → computed` çevirisi yalnız HKM'ye giden işarette yapılıyor (`AYS/src/js/core/beacon.js:187`, `SPI/src/js/core/beacon.js:177`). Etiketin yeri de türden türe değişiyor: hücre içinde `{v, cert}` (SPİ tahlil), öğe içinde `cert` (SPİ öğün kalemi, varsayılan `estimated`, `:164`), kardeş alan `<alan>Cert` (ESP oturumu `minutesCert/qualityCert`, AYS deneme `blankCert`), ya da **hiç yok, okurken `measured` sayılıyor** (SPİ vitals, `:528`, `:577`).

| Gerçek dünya türü | Bugün nerede | Alanlar (özet) | Kesinlik | Önerilen birleşik tür |
|---|---|---|---|---|
| Günlük beden ölçümü (uyku, nabız, kilo, su…) | SPİ `vitals/<tarih>` (`SPI/.../state.js:608-618` `defaultVitals`) | date, sbp, dbp, rhr, hrv, spo2, temp, sleep, weight, waist, bodyfat, soreness, water, symptoms{}, symptomsLogged, period, note | alan başına yok; null = veri yok | `olcum` (tek sayı = tek satır: tür, değer, birim, tarih, etiket, kaynak) |
| Uyku gecesi | SPİ vitals `sleep` (saat) + HKM `sorular` («dün kaç saat uyudun?», yedekte yok, `db.py:121`) | — | vitals: örtük measured | `olcum{tur:uyku}`; **iki yerde iki biçim** |
| Öğün | SPİ `meals/<tarih>` `{date, rows:[{id, slot, items[], note, at}]}` (`:661-670`), gıdalar `foods/`, sepet `basket`, fiyat `prices` | items[].cert (varsayılan estimated) | kalem başına | `ogun` + `gida` (katalog) |
| Antrenman | SPİ `workouts/<id>` (`:684-700`) | id, date, templateId, name, kind, items[{exId, levelId, sets, reps, minutes}], minutes, rpe, note | yok | `antrenman` |
| Tahlil | SPİ `labs/<id>` (`:298-319`) | id, date, source, lab, values{k:{v, cert}}, fasting, time, note | hücre başına, `derived` dahil | `tahlil` + değerleri `olcum` |
| İlaç | SPİ `meds/` (`newMed :403`) | göremedim (ayrıntı okunmadı) | göremedim | `ilac` |
| Çalışma oturumu | AYS `sessions/<id>` (`normSession :200`: tests[], marks[], status) · ESP `days/<tarih>.sessions[]` (`normSession :372`: disc, minutes+Cert, quality+Cert, count+Cert) · AYS `days/<tarih>`, `breaks/` | farklı | AYS yok · ESP kardeş alan | `oturum{alan:ays|esp, disiplin}`; **iki modülde iki biçim** |
| Deneme sınavı | AYS `exams/<id>` (`normExam :146`: protocol{}, tests[]) + `sinavprofil/`, `testkitabi/` | testlerde correct, wrong, blank+blankCert | kardeş alan | `deneme` |
| Soru denemesi / çözülen soru | AYS `solved/<id>` (`solver.js:538`), `errors/<id>` (`state.js:552`) + foto IndexedDB | göremedim (ayrıntı) | göremedim | `soru_denemesi` |
| Tekrar kartı | AYS `cards/<id>` (`newCard :560`: front, back, topic, subjectId, stage, dueAt, history[]) · ESP `cards/<id>` (`newCard :575`: front, back, lang, box, ease, interval, due, reps, lapses, history[]) · HKM `meydan_deste`, `dil_karti` | **aynı koleksiyon adı, iki farklı zamanlama modeli** (Leitner `stage` / SM-2 `ease`) | yok | `kart` + ayrı `kart_gecmisi` olayları |
| Not | ortak defter `defter/<id>` `{id, baslik, govde, at, guncel, sabit}` (`defter.js:226`) ×3 modül · ESP `notes/<id>` (`newNote :679`: text, bookId, concepts[], links[]) · HKM `motto_nodes/versions/links/tags` · HKM `meydan_not` | **dört biçim** | yok | `not` (+ `bag`, `surum`) |
| Hedef | `hedefler/` ×3 modül (ortak) · AYS `hedefPlanlar/` · ESP `goals/<id>` (`newGoal :932`: label, disc, date, done) · HKM `hedef_ozet` (anlık) | ESP'de **iki ayrı hedef koleksiyonu** | yok | `hedef` |
| Plan bloğu | AYS `plan/`, `weeks/`, `calendar/` · ESP `weekplan`, `reminders/`, `events/` · hesap `yayin <modul>/gun` ve `gun/kayit.bloklar` · HKM `zaman_butcesi` | farklı | yok | `plan_blogu` |
| Ruh hâli / enerji | AYS `mood/<tarih>` (`normMood :187`: **energy yoksa 3 yazılır**) · `gun/kayit` (niyet, enerji, hava) yalnız hesap `yayin`'da (`hesap.py:1819-1836`) | — | **AYS'de eksik veri 3'e dönüyor (§1.2'ye aykırı görünüyor)** | `olcum{tur:enerji}` |
| Kişi modeli bilgisi | `meta/hafiza` `{items:[…alan…]}` ×3 modül (`hafiza.js:79`, `kisi.js:14`) · HKM `memories` · hesap `yayin <modul>/kisi` | **üç yerde** | kaynak katmanı var (sohbetten / senin sözün) | `kisi_bilgisi` |
| King eylemi | HKM `eylem` (created_at, kaynak, modul, arac, param, ozet, geri, durum) · `king_olaylar` · tarayıcı `lifeos.olay.giden.<modul>` | eklemeli defter | — | `eylem` (olay defterinin çekirdeği) |
| Karar / brifing / sinyal / toplantı / ofis | `decisions/`, `briefings/`, `signals/`, `forecasts/`, `meetings/`, `office` ×3 modül · HKM `decisions`, `audits` | türetilmiş | — | çoğu **türetilmiş**: taşınmaz, yeniden hesaplanır (karar: sahibi) |
| Para | SPİ `prices`, `basket` (`money.js`) · HKM `para` (kuruş tamsayı) | farklı | — | `para_hareketi` |
| Kitap, argüman, zincir, taslak, kayıt (ses) | ESP `books/`, `args/`, `chains/`, `drafts/`, `pieces/`, `recordings/`, `assets/`, `sources/` | ESP'ye özgü | kısmen | ayrı türler, adları korunur |
| Profil | `profile`/`profile/` ×3 · `spi.household`, `esp.profiles`, `rota.snapshots` (localStorage) · `lifeos.profiller` (`ayar.json`) · hesap `kullanici` | **beş yerde** | — | `profil` + hesap kullanıcısı |

Ayrıntısını okumadığım türler (göremedim): AYS `activities`, `journal`, `protocols`, `reviews`, `sources`, `topics/`, `videoNotes`; SPİ `chats`, `flags`, `hekim`, `progress`; ESP `proposals`, `timer`.

## 5. Önerilen hedef tasarım

Kısıt: sunucuda yalnız Python standart kütüphanesi, tarayıcıda düz JS (AGENTS §1.3). Bugün iki SQLite ambarı zaten standart `sqlite3` ile, WAL kipinde çalışıyor (`sistem/hesap.py:202`, `:339`; `HKM/core/db.py:860-894`). Yeni motor icat etmeye gerek yok.

| Katman | Öneri | Bugünkü dayanak |
|---|---|---|
| PC'deki depo | Tek SQLite dosyası, depo dışında: `%LOCALAPPDATA%\LifeOS\veri\lifeos.db`. Önbellek ve türetilmiş tablolar ayrı dosyada (`onbellek.db`): yedeğe girmez, silinince yeniden üretilir | `hesap.db` depo dışında (söz 6); `hkm.db` bugün depo klasöründe (`HKM/db/`) — taşınmalı |
| Şema sürümü | Dosya şeması `PRAGMA user_version` + sıralı, numaralı taşıma betikleri (her biri bir kez, önce yedek). Kayıt türü sürümü ayrı: `tur_surum` | HKM'de sürüm yok, yalnız eksik sütun ekleme (`db.py:841`); modüllerde `SCHEMA_VERSION` 5/1/1 |
| Kayıt türü kataloğu | `katalog` tablosu + aynı içerikte JSON dosyası (sunucu ve tarayıcı aynı dosyayı okur): tür adı, sürüm, alanlar, hangi alanın sayı olduğu ve **etiket zorunluluğu**, yukarı taşıma tablosu | `animasyon.js` KATALOG'unun «tek tablo, iki okuyucu» kalıbı (`ayar.py:33-45`) |
| Akım tablosu | `kayit(id, tur, tur_surum, profil, gun, govde JSON, olusturma, degisme_hlc, cihaz, silindi_hlc)`; sayı alanları `{v, k}` biçiminde, `k ∈ measured|estimated|computed|missing` | bugünkü `kayit(alan, yol, deger…)` tek JSON blob |
| Olay defteri | Eklemeli `olay(sira, kayit_id, islem, alanlar_farki JSON, hlc, cihaz, kaynak: kullanici|king|goc|iceaktar, eylem_id)`; akım tablosu aynı işlemde güncellenir. King'in `eylem` defteri bunun `kaynak=king` alt kümesi olur, `geri` bilgisi korunur | `HKM/core/eylem.py` (`/api/eylem`, `daemon.py:1328`, `:2061`); hesap `sira` sayacı |
| Saat ve çakışma | Duvar saati yerine **karma mantıksal saat** (HLC: ms, sayaç, cihaz); sunucu kendi saatinden çok ilerideki HLC'yi kırpar. Çakışma **alan düzeyinde** son yazan kazanır (günlük ölçümde sbp ile kilo ayrı); listeler (öğün kalemleri, oturumlar) kimlikli alt kayıt olur, dizi değil | bugün kayıt düzeyi LWW, eşitlikte cihaz kimliği (`hesap.py:1134`) |
| Silme | Mezar taşı `silindi_hlc`; bütün bilinen cihazların imleci geçtikten ve N gün sonra budanır (cihaz imleçleri sunucuda tutulur) | bugün budama yok |
| Cihaz önbelleği | Tek köken → tek IndexedDB `lifeos`: `kayit` (dizinler: tur+gun, profil), `kuyruk` (değişikliğin kendisi + HLC; bugünkü gibi yalnız yol değil), `meta` (imleç, dönem, katalog sürümü), `medya` (blob). localStorage yalnız küçük cihaz tercihleri için | bugün 3 köken × localStorage tek anahtar (`depo.js`), kuyruk yalnız `{yol:z}` (`hesap.js:814`) |
| İlk eşitleme | Bugünkü «ilk eşitleme ezmez» sözü korunur; ama `z:1` yerine kaydın kendi `updatedAt/at/createdAt` alanı, yoksa göç zamanı + `kaynak=goc` | `hesap.js:999` |
| Fotoğraf ve medya | Cihazda IndexedDB `medya`; PC'ye gönderim **sahibin kararı** (AGENTS §1.4 bugün «eşitlenmez» diyor). Giderse içerik adresli (`SHA-256`) dosya klasörü, kayıtta yalnız özet | `sorufoto.js`, `foto.js`, `defter.js:253` |
| Yedek ve geri yükleme | `hesap.py`'nin yolu: `sqlite3` yedekleme API'si, `quick_check`, tür başına saklama (günlük 7, elle 5, önce 5) + HKM'nin «14 gün + 6 ay» kuralı; geri yükleme `donem` değiştirir, cihazlar kendi değişikliğini yeniden yollar | `hesap.py:303-310`, `:1956`, `:2264-2322`; `HKM/core/yedek.py` |
| Diskte şifreleme | Bugün canlı depolarda **yok** (ölçüldü: yalnız `tasi.py` paketi şifreli). Standart kütüphanede AES yok; canlı depo için kendi şifremizi yazmak yerine Windows'un klasör şifrelemesi (EFS/BitLocker) önerilir — karar sahibin | `sistem/tasi.py:9-12` |
| Sırlar | API anahtarları depoya girmez (bugün HKM'de Windows kasası, `tasi.py:17`); tarayıcıdaki `*.llm.keys` göçte taşınmamalı, kasaya alınmalı | §1a |

Kural motoru otoritesi korunur: türetilmiş kayıtlar (karar, brifing, sinyal, tahmin, özet) olay defterine `kaynak=kural` ile yazılabilir ama akım tablosunda «yeniden hesaplanabilir» işaretli durur ve göçte taşınmaz, yeniden üretilir.

## 6. Göç planı

**İlke:** göç yalnız YENİ dosyaya yazar; eski depolara (localStorage, `hesap.db`, `hkm.db`, JSON dosyaları) dokunmaz. Geri dönüş = yeni dosyayı kenara almak + kabuğun bayrağını eski modüllere çevirmek.

**Kaynaklar, sırayla**

| # | Kaynak | Nasıl okunur | Neyi verir | Eşleme |
|---|---|---|---|---|
| 0 | Hazırlık | Her cihazda, her modülde «bekleyen 0» (`hesap.js:822` `bekleyen()`); `hesap.db` ve `hkm.db` için mevcut yedek yolları (`kopya_al`, HKM `export_all`) | dönüş noktası | — |
| 1 | `hesap.db › kayit` | standart `sqlite3`, salt okunur (`?mode=ro`, `hesap.py:1973` kalıbı) | bağlanmış her alanın bütün yolları; mezar taşları | `alan` → (modül, profil); yolun öneki (`vitals/`, `cards/`…) → katalog türü; `deger IS NULL` → «silinmiş» olayı, akım tablosuna girmez |
| 2 | Her köken, sayfanın içinden | eski modüle tek düğmelik «göç paketi»: bütün profillerin `exportAll` gövdesi (bugün yalnız etkin profil, `depo.js:347`), ana depo dışı anahtarlar (§3 listesi), IndexedDB fotoğraf ve medya blob'ları; aynı ağdaki PC'ye gönderilir. **Her cihazda ayrı** (fotoğraf yalnız çekildiği cihazda) | 1'de olmayanlar + 1'in sağlaması | yol bazında 1 ile karşılaştırılır: JSON aynı → tamam; farklı → kaydın kendi zaman alanı (`updatedAt/at/createdAt`) yeni olan, kalan **çatışma listesine** |
| 3 | 4180 Gün kökeni | aynı paket, `lifeos.gun.*`, `lifeos.bilinc*` | Gün geçmişi, Bilinç haritası | `olcum{enerji}`, `not`, `plan_blogu` |
| 4 | `hkm.db` | `sqlite3`, salt okunur | gerçek tablolar (§1c'de **Gerçek** olanlar: `para`, `motto_*`, `memories`, `conversations`, `attachments`, `eylem`, `king_*`, `zaman_butcesi`, `susturmalar`, `sorular`, `meydan_*` gerçek olanlar) | tablo → tür; `eylem` olay defterine `kaynak=king` |
| 5 | PC dosyaları | `ayar.json`, `planlama.json`, `ice.json`, `muzik/`, `zemin/` | tercihler ve medya | tercih kayıtları; medya dosya olarak kalır |
| — | Taşınmayanlar | türetilmiş tablolar ve koleksiyonlar (`decisions`, `briefings`, `signals`, `forecasts`, HKM önbellekleri) | — | yeni motorlar yeniden üretir; eski sonuçla örneklem karşılaştırması yapılır |

Masaüstü kabuğunun profil klasörü (`%APPDATA%\LifeOS\Local Storage`, `IndexedDB`, `tasi.py:66-79`) dosyadan okunmamalı: Chromium bunları LevelDB biçiminde tutar ve standart kütüphanede okuyucu yok (hesaplandı). Kaynak 2 (sayfanın içinden dışa aktarma) bu yüzden şart.

**Kuru çalıştırma (dry run) doğrulaması**

| Ölçü | Kural |
|---|---|
| Sayı | kaynak × tür başına: okunan = yazılan + atlanan (nedeniyle: mezar taşı, örnek profil, türetilmiş, çatışma). Fark 0 değilse göç durur |
| Sağlama | her kayıt için anahtarları sıralanmış JSON'un SHA-256'sı; tür başına özetlerin sıralı listesinin SHA-256'sı. Yeni depodan geri üretilen eski biçimle aynı olmalı (gidiş-dönüş) |
| Etiket | her sayı alanı dört etiketten birini taşımalı; `derived` → `computed` çevrimi sayılır ve raporlanır; etiketsiz sayı **reddedilir**, listeye düşer (AGENTS §1.2) |
| Tekrarlanabilirlik | aynı girdiyle iki kuru çalıştırma bayt bayt aynı rapor |
| Çapraz | kaynak 1 ile 2 arasındaki her fark tek tek listede; sahibi görmeden gerçek göç yok |

**Geri alma.** Gerçek göç: önce üç dönüş noktası (`hesap.db` «önce» kopyası, `hkm.db` kopyası, her cihazın göç paketi dosyası), sonra yeni `lifeos.db`. Her göç kaydı `kaynak=goc`, `goc_id` taşır: tek bir göç turu `goc_id` ile tümden silinebilir.

**Geçiş döneminde eski modüller.** Donmuş modüller bugünkü gibi `POST /api/hesap/esitle` ile konuşmaya devam eder. Yeni sunucu bu ucu bir **köprü** olarak tutar: gelen eski biçimli kaydı katalog eşlemesiyle yeni depoya yazar, yeni kabukta değişen kaydı eski biçime çevirip `al` listesine koyar. Bir alan taşındığında o alanın eski modülü salt okura geçer (bayrak). Köprü testleri bugünkü `HKM/tests/test_hesap.py` (79 test) ve `brand/ortak/hesap.test.js` (93 test) sözleşmesini aynen geçmeli.

**Özel riskler (göçe özgü).** Kota: eski modülde göç paketi hazırlanırken bellek ve 5 MB sınırı (paket localStorage'a yazılmamalı, doğrudan gönderilmeli). Saat kayması: kaynak 1'deki `zaman=1` ve cihaz saati; karar kaydın kendi alanından verilmeli. Yinelenen profiller: AYS `main`, SPİ/ESP `ben`; profil listesi beş yerde (§4) — hangi profilin aynı kişi olduğu sahibine sorulmalı. Fotoğraflar: yalnız cihazda, cihaz kaybolursa gider; göç paketi her cihazdan ayrı alınmalı. HKM'ye özgü veri: `para`, `motto_*`, `memories` hesap sunucusunda hiç yok.

## 7. Riskler ve sahibine açık sorular

**Riskler (önem sırasıyla)**

| # | Risk | Kanıt | Etki |
|---|---|---|---|
| R1 | Sunucu kopyası eksik: açılmamış profiller, bekleyen sıra, ana depo dışı anahtarlar, fotoğraflar, Gün geçmişi, HKM verisi | §3 | Yalnız `hesap.db`'den göç veri kaybettirir |
| R2 | Kesinlik etiketi iki dilde (`derived` / `computed`) ve dört farklı yerde; SPİ vitals'ta hiç yok, okurken `measured` varsayılıyor | §4; `SPI/.../state.js:528` | Göçte etiket uydurma tehlikesi; vitals için «ölçüldü» varsayımı sahibine onaylatılmalı |
| R3 | AYS ruh hâlinde boş enerji 3 yazılıyor | `AYS/src/js/core/state.js:187-191` `normMood` | Eksik veri değere dönüşmüş olabilir; göçte ayırt edilemez (göremedim: diskteki kayıtlarda hangisi gerçek 3) |
| R4 | Duvar saati + kayıt düzeyi LWW; ilk eşitlemede `z=1` | `hesap.js:832-843`, `:999`; `hesap.py:1134` | Saat kayan cihaz kazanır; aynı günün iki alanı çakışırsa biri kaybolur |
| R5 | Aynı ad, farklı biçim: `cards/` (AYS Leitner, ESP SM-2), not dört biçimde, hedef ESP'de iki koleksiyonda, kişi bilgisi üç yerde, profil beş yerde | §4 | Birleşik türde alan eşlemesi elle karar ister |
| R6 | Tek köken, tek kota: üç modül + Gün tek localStorage'a girerse ~5 MB paylaşılır | `depo.js:521-541`; TEKNIK.md:169-172 | Yeni kabuk localStorage değil IndexedDB kullanmalı; `persist()` reddedilirse tarayıcı silebilir |
| R7 | Mezar taşları hiç budanmıyor | `hesap.py` içinde `DELETE FROM kayit` yok | Depo büyür; göçte silinenler ayrı sayılmalı |
| R8 | Sırlar tarayıcıda: `rota/spi/esp.llm.keys` | §1a | Göç paketine girmemeli |
| R9 | `hkm.db` depo klasöründe (`HKM/db/`) | `db.py:17` | Güncelleme/klasör işlemi riski; yeni depo `%LOCALAPPDATA%` altında olmalı |
| R10 | Diskte şifreleme yok (canlı depolar) | `tasi.py` dışında göremedim | Sağlık ve para verisi düz metin |

**Sahibine sorular**

1. Fotoğraflar ve defter medyası PC'ye eşitlensin mi? (AGENTS §1.4 bugün «eşitlenmez» diyor.)
2. Hangi profiller taşınacak? «Örnek» ve deneme profilleri dışarıda mı? AYS `main` ile SPİ/ESP `ben` aynı kişi mi?
3. Türetilmiş kayıtlar (karar, brifing, sinyal, tahmin) taşınsın mı, yoksa yeni motor yeniden mi üretsin? Geçmiş kararların «o gün ne denmişti» değeri var mı?
4. SPİ vitals'taki etiketsiz sayılar göçte «ölçüldü» mü sayılsın, «veri yok» mu, yoksa ayrı bir «etiketsiz eski kayıt» işareti mi?
5. AYS'deki enerji = 3 kayıtları: gerçek değer mi, varsayılan mı? Ayırt edilemiyorsa «tahmin» mi işaretlensin?
6. Çakışma birimi alan düzeyine insin mi (önerilen), yoksa kayıt düzeyi mi kalsın?
7. Canlı depo için Windows klasör şifrelemesi (EFS/BitLocker) yeterli mi?
8. HKM'nin `para`, `motto`, `memories`, `conversations` tabloları tek depoya mı girsin, yoksa HKM ayrı ambar olarak mı kalsın?
9. Hesap sunucusu çok kullanıcılı (`kullanici` tablosu, kayıt açma, admin). Tek depo da çok kullanıcılı mı kalacak?

**Doğrulayamadıklarım (göremedim).** Gerçek `hesap.db`, `hkm.db` ve tarayıcı depolarındaki kayıt sayıları ve boyutları (açmak yasaktı); IndexedDB'nin bu tarayıcılardaki gerçek kotası; `meds/`, `solved/`, `errors/` ve §4 sonundaki koleksiyonların alan ayrıntısı; `yayin` tablosundaki `gun` sütununun eklendiği taşıma satırı (`hesap.py:559` civarı okunmadı).
