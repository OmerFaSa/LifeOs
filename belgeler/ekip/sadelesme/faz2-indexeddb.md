# Faz 2 · Kabuk kayıtları IndexedDB'ye (kalıcı depolama)

Plan riski: «Tek kökende 5 MB tarayıcı sınırı → Yeni kabuk IndexedDB kullanır ve kalıcı depolama ister».

## Ne değişti
- **Yeni `kabuk/depo.js`** (`LIFEOS.Kabuk.Depo`; `LIFEOS.Depo` adı eski modüllerde, `brand/ortak/depo.js` ve AYS'de dolu olduğu için
  öteki kabuk dosyaları gibi `Kabuk` altında). Tek IndexedDB veritabanı `lifeos-kabuk`, tek tablo `kayit`; değer localStorage'daki
  dizginin aynısıdır (JSON metni), böylece taşıma bayt bayt karşılaştırılır ve P6'da `veri/lifeos.db`'ye aynen geçer.
  - Eşzamansız yüz: `al(k)`, `yaz(k, v)`, `sil(k)`, `hepsi(onek)`; `yaz`/`sil` IndexedDB işlemi kalıcı olunca çözülür.
  - Eşzamanlı yüz: `getItem`/`setItem`/`removeItem`. Kabuk ve `ayar.js` zaten bu biçimde bir «depo» alır; kayıt anahtarı belleğe
    + IndexedDB'ye, ayar anahtarı localStorage'a gider. Açılışta bütün kayıtlar belleğe yüklenir, ekranlar eşzamanlı okumayı sürdürür.
  - `ac(localStorage)`: ayar deposunu hemen bağlar, sonra IndexedDB'yi açar, kayıtları yükler, taşımayı yapar; hiç reddetmez, kipi
    verir (`idb` · `yerel` · `bellek`). `kalici()` kalıcı depolama yanıtı (`null` bilinmiyor), `kip()`, `kayitMi(k)`.
  - Sekmeler arası: `BroadcastChannel('lifeos-kabuk')` ile bir sekmenin yazdığı öteki sekmenin belleğine düşer (localStorage'da
    her okuma tazeydi; bellek önbelleği bunu bozmasın diye).
- **`kabuk/kabuk.js`**: `localStorage` sınaması `yerel` adını aldı; `depo = Kabuk.Depo`, `hazir = depo.ac(yerel)`. Tema (ayar) ilk
  boyamadan önce eskisi gibi uygulanır, `baslat` depo hazır olunca çalışır (`basla()`). Başka satır değişmedi.
- **`kabuk/araclar.js`, `deneme.js`, `tanisma.js`: değişiklik gerekmedi.** Üçü de her okuma/yazmayı `Kabuk.ic.depo` (ya da
  kabuğun verdiği `depo`) üzerinden yapıyor; `ic().depo` artık `Kabuk.Depo`. Kanıt: bu dosyalarda `localStorage` geçmiyor
  (`grep -n localStorage kabuk/araclar.js kabuk/deneme.js kabuk/tanisma.js` boş). `ayar.js`'e dokunulmadı; beden alanları
  onun içinden de bu katmana gider.
- **`kabuk/index.html`**: `depo.js` betiği `ayar.js`'ten sonra.
- **Sunucu**: `kabuk_dosyasi` kapalı dosya listesi değil, klasör + uzantı listesi (`kabuk/*.js`), `depo.js` kendiliğinden verilir;
  `sistem/sunucu.py`, `sistem/tekkapi.py`, `tools/tekkapi_test.py` değişmedi.
- **Ayarlar'da gösterim yok**: Ayarlar sayfasında depolama ya da veri satırı yok (gruplar: Görünüm, Erişilebilirlik, Bildirim,
  Beden, Hesap); doğal yer olmadığı ve `ayar.js` yasak olduğu için `kalici()` yalnız API'de.

## Anahtar listesi (kayıt / ayar)
Tek kaynak `kabuk/depo.js` içindeki `KAYIT` deseni. `kabuk/depo.test.js` kabuk dosyalarında geçen her `'lifeos.*'` anahtarını
tarar: listede olmayan yeni bir anahtar testi kırar (kayıt mı ayar mı kararı verilmeden giremez).

**Kayıt → IndexedDB** (kullanıcı verisi)
| Desen | Bugün kullanan |
|---|---|
| `lifeos.yol.<alan>.<n>` (`lifeos.yol.son` hariç) | aşama kayıtları, kabuk.js |
| `lifeos.not.*` | `not.kayit`, `not.araclar` (araclar.js) |
| `lifeos.tekrar.*` | `tekrar.kartlar`, `tekrar.bugun` |
| `lifeos.kayit.kayitlar` | haftalık kayıt |
| `lifeos.plan.*` | `plan.durum`, `plan.sablon` |
| `lifeos.soru.*` | `soru.oturum`, `soru.gecmis`, `soru.deneme` (süren), `soru.denemeler` (deneme.js) |
| `lifeos.tanisma.kayit`, `lifeos.tanisma.taslak` | tanisma.js |
| `lifeos.beden.*` | `beden.cinsiyet`, `beden.boy`, `beden.dogumYili`, `beden.hedef` (ayar.js şemasında, ama beden profili veridir) |

**Ayar → localStorage** (ilk boyamadan önce eşzamanlı okunur)
- `kabuk/ayar.js` şemasındaki bütün anahtarlar, `lifeos.beden.*` dışında (tema, yazı, vurgu, boyut, satır, kontrast, odak,
  altçizgi, hareket, bildirim, hesap…).
- `lifeos.yol.son` (son açılan alan; `etkinAlan` betik yüklenirken okunur), `lifeos.kabuk.ipucu`, `lifeos.tanisma.davet`
  (ve `lifeos.tanisma.davet*` gibi kayıt/taslak dışındaki her tanışma anahtarı).
- `lifeos.kabuk.depo` (yeni iz: `idb` = kayıtlar bir kez IndexedDB'ye taşındı; aşağıdaki «bellek kipi» kuralı buna bakar).
- `lifeos.kullanim` (kalite/kullanim.js sayacı; kabukta değil, dokunulmadı).

## Taşıma kuralları
1. **Açılış** (`Depo.ac`): kalıcı depolama istenir (`navigator.storage.persisted()` doğruysa `persist()` hiç çağrılmaz; yanıt
   `kalici()`), IndexedDB açılır, bütün kayıtlar belleğe yüklenir, sonra taşıma yapılır. Kabuk çizimi bunun bitmesini bekler;
   tema ve öteki ayarlar beklemeden, eskisi gibi ilk boyamadan önce uygulanır.
2. **Taşıma her açılışta bakar, iş yalnız ilkinde çıkar:** localStorage'daki her kayıt anahtarı tek bir IndexedDB işlemiyle yazılır,
   ikinci bir işlemle geri okunur; **hepsi** bayt bayt aynı çıkarsa localStorage'dan silinir. Biri tutmazsa ya da işlem kesilirse
   hiçbiri silinmez (hepsi ya da hiçbiri) ve kabuk bu açılışta `yerel` kipte, localStorage'la çalışır; sonraki açılış yeniden dener.
3. **Süre sınırı 3 sn** (eski Safari/WKWebView'de takılan `indexedDB.open` kabuğu boş bırakmasın). Süre dolunca kip düşer; geç gelen
   IndexedDB yanıtı localStorage'dan hiçbir şey silemez (test: «geç gelen açılış silmez»).
4. **Kipler:** `idb` olağan. `yerel`: IndexedDB yok, açılmadı ya da taşıma tutmadı ve daha önce hiç taşınmadı; kayıtlar eskisi gibi
   localStorage'da. `bellek`: `lifeos.kabuk.depo = idb` izi var (kayıtlar zaten IndexedDB'de) ama bu açılışta ulaşılamadı. Bu
   durumda localStorage'a yazmak, sonraki açılışta boş başlamış bir listeyi eski kaydın üstüne taşırdı; onun yerine oturumun
   yazdıkları yalnız bellekte durur (veri kaybolmaz, yalnız o oturumun yazdıkları kalıcı olmaz).
5. **Yazı:** önce bellek (ekran aynı anda okur), sonra IndexedDB (`tx.commit()` ile, yazıdan hemen sonra yenilense de kalır;
   gerçek tarayıcıda denendi). IndexedDB yazamazsa değer localStorage'a **kurtarılır** ve sonraki açılışın taşıması onu alır;
   aynı anahtara sonra başarılı bir yazı gelirse kurtarılan eski değer silinir (eski değerin yeniyi ezmemesi için).
6. **Çakışma kuralı:** taşımada localStorage'daki değer IndexedDB'dekinin üstüne yazılır. localStorage'da kayıt anahtarı yalnız iki
   yoldan bulunur: hiç taşınmamış eski veri ya da kurtarılmış yazı; ikisi de daha yenidir. (`bellek` kipi bu kuralı korumak için var.)
7. **Sekmeler:** bir sekmenin yazdığı `BroadcastChannel` ile öteki sekmenin belleğine düşer; localStorage'da her okuma tazeydi,
   bellek önbelleği eski listeyi yazıp öteki sekmenin eklediğini silmesin.

## Test sonuçları
14 Kasım 2026, `sadelesme` dalı 11ef9c89 üstünde, commit'siz çalışma ağacı.

| Komut | Sonuç |
|---|---|
| `node kabuk/depo.test.js` (yeni) | 13/13 geçti |
| `node kabuk/kabuk.test.js` | 51/51 (beklenti değişmedi) |
| `node kabuk/tanisma.test.js` | 25/25 (değişmedi) |
| `node kabuk/deneme.test.js` | 6/6 (değişmedi) |
| `node kabuk/bilesen.test.js` (paralel mühendisin, yalnız koşuldu) | 9/9 |
| `node tools/kabuk_gez.js` (gerçek Chromium, tek kapı, yalıtılmış LOCALAPPDATA) | 205/205, 6'sı yeni |
| `python kalite/olcum.py --denetle` | «Bütçe tamam: 28 bütçe, aşım yok» (`depo.js` 7,7 KB; açılış yükü tavanı 1 MB) |
| `python tools/tekkapi_test.py` | koşulmadı: sunucu ve test değişmedi (sunucu klasör + uzantıyla verir) |

`depo.test.js` kurulumsuzdur: IndexedDB biçimli sahte (atomik işlem, yarıda kesme, geç/takılı açılış, bozuk geri okuma) dosyanın
içinde. Kapsadığı: anahtar ayrımı (kabuk dosyalarındaki her `'lifeos.*'` taranır), taşıma, yeniden açılışta kalıcılık, al/sil/hepsi,
yarıda kesilen taşıma = hiçbir şey silinmez, bozuk geri okuma = hiçbir şey silinmez, IndexedDB yok/açılmaz = yerel kip,
takılan IndexedDB = süre sınırı ve geç yanıt silmez, iz varken açılmaz = bellek kipi, yazı arızası = kurtarma ve sonraki taşıma,
kalıcı depolama bir kez, sekmeler arası tazeleme. İki güvenlik koşulu (geç yanıtta silmeme, kurtarılanı temizleme) kod geçici olarak
bozularak denendi: ikisinde de ilgili test kırıldı.

`kabuk_gez.js`'te değişen: kayıt okuyan/yazan 19 `localStorage.getItem/setItem('lifeos.…')` çağrısı `LIFEOS.Kabuk.ic.depo` oldu
(beklentiler aynı). Yeni 6 madde: kip `idb` ve kalıcı depolama yanıtlandı; yazıdan hemen sonra yenilenen kayıt kaldı, IndexedDB'de,
localStorage'da hiç kayıt anahtarı yok; ayrı bağlamda localStorage'a önceden konmuş eski aşama kaydı ilk açılışta okunur, IndexedDB'ye
aynen geçer, localStorage'dan silinir, ayar yerinde kalır ve uygulanır; yenilemeden sonra IndexedDB'den okunur; konsolda hata yok.

CI: `.github/workflows/ci.yml`'ye «Kabuk kayıt deposu» adımı eklendi (öteki kabuk testlerinin yanında).

## Açık noktalar
1. **Kalıcı depolama Ayarlar'da görünmüyor.** Doğal yer yok, `ayar.js` bu işte yasaktı. Gösterilecekse önce varyasyon (kural 6):
   ör. Ayarlar › Hesap altında tek satır «Bu cihazdaki veri: kalıcı / tarayıcı silebilir». API hazır: `Kabuk.Depo.kalici()`.
2. **`bellek` kipi kullanıcıya söylenmiyor** (yalnız `console.warn`). Bu kipte oturumun yazdıkları yenilemede kalmaz; görünür bir
   uyarı için aynı şekilde önce örnek gerekir. `Kabuk.Depo.kip()` hazır.
3. **IndexedDB'de başarısız silme kurtarılmıyor:** localStorage'da «silindi» izi tutulmadığı için, silme yazılamazsa eski değer
   yenilemede geri gelir (veri kaybı değil, tersi). Yazı arızası kurtarılıyor.
4. **Açık ekran öteki sekmenin yazısıyla kendiliğinden yeniden çizilmez** (eskiden de `storage` olayı dinlenmiyordu); okuma ve
   yazma tazedir.
5. **Telefon kabuğu (iOS WKWebView) denenmedi.** IndexedDB yoksa ya da takılırsa kural gereği `yerel` kipe düşer; 3 sn süre sınırı
   o durumda bir kez boş ekran demektir.
6. **P6:** kayıtlar `veri/lifeos.db`'ye geçince yalnız `kabuk/depo.js` değişir: açılışta yükleme ve `kaydet` sunucuya gider, taşıma
   IndexedDB → tek depo olur; eşzamanlı yüz ve `KAYIT` listesi aynı kalır. Değerler bugün JSON metni olarak duruyor, olduğu gibi
   taşınabilir.
7. Eski modüller (AYS, SPİ, ESP) bu kayıt anahtarlarını kullanmıyor (depoda arandı; `king/mcp.py` yalnız ileti metninde anıyor),
   bu yüzden aynı kökende localStorage'dan silmek onları etkilemez. Bir eski modül bu adlardan birine yazmaya başlarsa çakışma
   kuralı (madde 6) gözden geçirilmeli.

## Tek depo eşitlemesi (2026-11-14)
Kabukta girilen kayıtlar artık yalnız tarayıcıda durmaz: bilgisayardaki tek depoya (`veri/lifeos.db`) da yazılır.
Böylece yedeklenir, King okur, ikinci cihaz (telefon) aynı kayıtları görür. Planın «verinin doğrusu tek yerde» hedefinin kabuk payı budur.

- **Ne gider:** yalnız kayıt anahtarları (`kabuk/depo.js` `KAYIT`: Yol, Not, Tekrar, Kayıt, Plan, Soru, Tanışma, Beden, onay). Ayarlar gitmez.
  Sunucudaki kapalı liste (`sistem/veri.py` `KABUK_ANAHTAR`) aynı önekten kurulur; test ikisini karşılaştırır.
- **Biçim:** her anahtar tek kayıttır (`alan = kabuk`, `yol = anahtar`); gövde tarayıcıdaki dizginin aynısıdır, geri dönüşte bayt bayt aynı gelir.
- **Uç:** `GET /api/hesap/kabuk?son=<imleç>` ve `POST /api/hesap/kabuk`, özel başlık `X-LifeOS: kabuk`. Bu bilgisayardan oturumsuz
  (bağlantı yerel **ve** `Host` yerel olmalı: DNS yeniden bağlama ile başka bir site okuyamasın); başka cihazdan yalnız sahibin oturumuyla.
  Tek depo yoksa 404: kabuk o açılışta eşitlemeyi kapatır ve eskisi gibi çalışır.
- **Kural:** çek, sonra gönder. Son yazan kazanır; ama bir cihaz ötekinin yazdığını görmeden üstüne yazarsa (taban sürümü eski) ezilen değer
  `kabuk-cakisma` alanında saklanır. Bir cihaz ilk katıldığında sunucudaki değeri alır; kendi farklı değeri «sakla» olarak sunucuya gider.
  Gönderilmemiş yerel yazı çekişte ezilmez. Ağ yoksa bekleyen kalır, sonraki açılışta gider. Öbür cihazdan gelen kayıt sayfayı yeniler
  (yazı alanı odaktayken beklenir).
- **Yedek:** tek depo günde bir kez `veri/yedek/lifeos-gunluk-<gün>.db` olarak kopyalanır, son 7 gün tutulur (`hesap.Depo.tek_depo_gunluk`).
- **King:** `king/mcp.py` kabuk kayıtlarını tek depodan okur: notlar Not motorunun King süzgecinden (özel not gelmez), kartlar `tekrar_durumu`nda,
  Kayıt motorunun kayıtları tek tek kayıt olarak, öğrenme kaydı `yol_haritasi` ilerlemesinde. Ham kabuk anahtarları ve çakışma kopyaları
  kayıt araçlarına çıkmaz.
- **Ayarlar › Hesap:** «Bilgisayardaki depo» satırı durumu söyler (eşit / ulaşılamıyor / bağlı değil).
- **Ölçüldü:** `kabuk/depo.test.js` 19 (altısı eşitleme), `tools/tekdepo_test.py` (doğrulama, sürüm, çakışma, silme, sayfalama, günlük yedek),
  HKM takımında HTTP ucu (başlık, yabancı Host, başka hesap, sahibin oturumu), `king/mcp_test.py` (özel not sızmaz),
  `tools/kabuk_esit_gez.js` 15 denetim: gerçek tarayıcıda iki cihaz, yazı dosyadan okunan tek depoda, öbür cihazda görünür, çakışmada ezilen değer
  saklanır, silme yayılır, günlük yedek alınır.
- **Sınır (shortcut):** eşitleme anahtar düzeyindedir: iki cihaz aynı anahtarı (ör. bütün not listesi) aynı anda değiştirirse son yazan
  kazanır, öteki sürüm çakışma alanında kalır ama kendiliğinden birleşmez; kurtarma ekranı yok. Kayıt düzeyinde birleştirme motorların
  işidir, sonraki adım.
