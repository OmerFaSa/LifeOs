# Faz 5 · ilk adım: King MCP sunucusu (salt okur)

2026-11-13. Dayanak: AGENTS §0.1 (King önce Claude uygulamasında MCP ile; yazma tek süreçten sonra; King notları
okur, özel olanları değil; model hafızaya yazmaz, önerir; sayıyı kod üretir), `plan.html` §4 A7 ve §6,
`king-hkm.md` §3 ve §9, `faz1.md` (tek depo, kopyadan okuma kuralı), `faz3-not.md` (King süzgeci).
Kesinlik dili AGENTS §1.2: ölçüldü, hesaplandı, tahmin, göremedim.

## Özet
**Yapıldı (yerel `sadelesme`, commit yok).** `king/mcp.py` (Claude masaüstü uygulaması için stdio MCP sunucusu,
yalnız standart kütüphane), `king/kopru.js` (motorları Node ile çağıran 66 satırlık köprü), `king/mcp_test.py`
(67 denetim, yeşil), `king/KURULUM.md`. Sekiz araç, hepsi salt okur; yazan araç yok. Canlı veri dosyası hiç
açılmaz, her çağrı kopyadan okur. Özel notlar Not motorunun King süzgecinden geçmeden hiçbir çıktıya girmez.

**Gerçek veriyle tek denetim (ölçüldü, 2026-11-13, `python king/mcp.py --denetle`, yalnız sayılar).** Kaynak:
hesap.db kopyası (tek depo henüz yok). Sahibin kaydı 37 (türetilmiş ve cihaza ait hariç), King'e açık 31 (6'sı
not, notlar aracından), yayın 15. Harita 24 yer, 3 veri alanı; kayıt arama 31 kayıt, 11 tür; bugün: 3 modülün
özet satırı, Gün kaydı var, bugünün tarihli kaydı 0; notlar 4, okunabilir 4, özel 0; yol haritası 1 aşama, 9 ders;
tekrar kartı 0; ölçüm 42 ölçüt, bütçe aşımı 3 (ekip arkadaşının bugünkü kalite kaydı). Canlı klasördeki dosyaların
boyutu ve tarihi önce ve sonra aynı; geçici kopyalardan iz kalmadı (`%TEMP%\lifeos-king-*` 0).

**Sahibin yapacağı:** kod çalışan kopyaya gelince (`LifeOS-Sistem`) Claude › Ayarlar › Geliştirici › Yapılandırmayı
düzenle'ye `KURULUM.md`'deki parçayı eklemek, uygulamayı yeniden açmak, Açık sorular 1'i yanıtlamak.

## Protokol
`king/mcp.py`, stdio üstünde JSON-RPC 2.0, satır başına bir ileti, UTF-8; stdout yalnız protokol (başıboş
`print` stderr'e yönlenir), günlük stderr'e. Yalnız Python standart kütüphanesi.

- **İki çağ birden (güncel belirtim 2026-11-13'te okundu).** Güncel MCP sürümü `2026-07-28` el sıkışmasızdır:
  sürüm her isteğin `params._meta["io.modelcontextprotocol/protocolVersion"]` alanında gelir, sunucu
  `server/discover` vermek zorundadır, sonuçlar `resultType:"complete"` taşır. `2025-11-25` ve öncesi
  `initialize` ile el sıkışır. Claude masaüstü uygulamasının hangisini konuştuğunu göremedim; bu yüzden sunucu
  ikisini de yapar: `initialize` (istenen sürüm `2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`'ten biriyse
  aynısı, değilse `2025-11-25`), `notifications/*` (yanıtsız), `ping`, `server/discover`, `tools/list`,
  `tools/call`. `_meta`'da desteklenmeyen sürüm gelirse `-32022 Unsupported protocol version` ve `data.supported`.
- **Hatalar.** Bozuk JSON `-32700` (id null); ileti nesne değil, `jsonrpc` 2.0 değil, `method` metin değil ya da
  `id` geçersiz `-32600`; bilinmeyen yöntem `-32601`; `params` nesne değil, bilinmeyen araç, `arguments` nesne
  değil `-32602`; beklenmeyen istisna `-32603` (iz stderr'e). Aracın kendi hatası (bilinmeyen argüman, sınır dışı
  sayı, olmayan kimlik, Node yok) belirtimdeki gibi `isError:true` sonuçtur: model düzeltip yeniden dener.
  Toplu istek (liste) tek tek yanıtlanır; boş liste `-32600`.
- Her araç `annotations: readOnlyHint:true, destructiveHint:false, idempotentHint:true, openWorldHint:false`
  taşır; girdi şeması `additionalProperties:false`, sunucu argümanları şemaya karşı kendisi de denetler.
- Çıktı tek metin bloğu (girintili JSON), en çok 100 000 harf; aşarsa «kesildi» notuyla.

## Araçlar
Sekiz araç (sınır 12). Her biri bir motorun ya da katmanın okuma kapısıdır; eski ~124 araç ileride bunların
arkasındaki katalog olur (`king-hkm.md` §3). Yazma kapıları (`kaydet`, `plan`, `onay`, `ayar`, `dis_dunya`) ve
`ara` (Arama motoru henüz yok) bu sürümde yok: yazma tek süreçten sonra, Arama plan durumunda.

| Araç | Kapı | Neden var | Kaynak |
|---|---|---|---|
| `sistem_haritasi` | Kabuk | «Nerede ne var, sen neyi görüyorsun»: kabuktaki 24 yer ve durumları + King'in gördüğü depo ve alan başına kayıt sayısı | `kabuk/harita.js` (Node ile `require`), depo kopyası |
| `kayit_ara` | Kayıt | Kayıtları alan, yol öneki, tür ve metinle bulmak; içerik değil kimlik verir (bağlam bütçesi) | depo kopyası |
| `kayit_oku` | Kayıt | Tek kaydın içeriği, her etiketli sayı `{deger, kesinlik}` | depo kopyası |
| `bugun_ozeti` | Plan / Gün | «Bugün ne var?»: modülün kendi kuralıyla yazdığı gün cümlesi ve planı (hesap sözü 21-22), günlük sayısal özet (25), Gün kaydı (26), bugünün tarihli kayıtları; bugüne ait olmayan bugünmüş gibi sunulmaz | `yayin` tablosu, depo kopyası |
| `notlar` | Not | Not listesi, arama, tek not; dokuz eski yapı Not motorunun göç bağdaştırıcısıyla tek biçime çevrilir, sonra `kingOkur` + `ara` | `motor/not.js` (Node), depo kopyası |
| `yol_haritasi` | Yol | Alanın aşama, ünite, ders, kapı yapısı; ders kimliğiyle metin ve alıştırmalar; taslak işaretli, kapı soruları verilmez | `alan/<alan>/asama-*.json` |
| `tekrar_durumu` | Tekrar | Bugün vadesi gelen kartlar, sıradaki vade; eski AYS ve ESP kartları motorun `GOC` bağdaştırıcısı ve `plan` ile | `motor/tekrar.js` (Node), depo kopyası |
| `olcum` | Kalite | Son kalite kaydının ölçütleri (etiketiyle) ve karmaşıklık bütçesi denetimi (`kalite/olcum.py` `denetle`: son kayıt, önceki kayda ya da tabana karşı) | `kalite/kayit/`, `kalite/butce.json` |

Biçim: sayım ve adetler `{"deger": n, "kesinlik": "hesaplandı"}`; kayıttaki sayılar depodaki etiketle (`goc.etiketle`:
`cert`/`<ad>Cert` → ölçüldü, tahmin, hesaplandı, veri yok; `derived` → hesaplandı; etiketsiz → eski kayıt;
tek depoda `etiket` sütunu); olmayan değer «veri yok». Kimlik, zaman ve sıra alanları (`goc.META_RE`) ölçü değildir,
etiket almaz. Yol haritasındaki kapı eşiği bir içerik ayarıdır, sayı olarak değil cümleyle verilir («soruların en az
%70'i doğru»).

## Veri kaynakları ve gizlilik
**Kaynak sırası.** `%LOCALAPPDATA%\LifeOS\veri\lifeos.db` varsa (P6 göçünden sonra) o; yoksa
`%LOCALAPPDATA%\LifeOS\hesap\hesap.db`. İkisi de yoksa her araç «veri yok» der. İçerik dosyaları depodan. Hepsi
ortam değişkeniyle değişir (`LIFEOS_VERI_DB`, `LIFEOS_HESAP_DB`, `LIFEOS_ICERIK`, `LIFEOS_NODE`); test geçici
veriyle koşar.

**Kopyadan okuma.** Her araç çağrısı veritabanını `-wal` ve `-journal` ile geçici klasöre kopyalar, kopyayı açar,
`quick_check` temiz değilse (yazım anına denk geldi) üç kez yeniden kopyalar, çağrı bitince klasörü siler. Önbellek
yok: depo küçük, ölçülecek bir yavaşlık görmedim. **`-shm` bilerek kopyalanmaz** (`goc.kopyala` alıyor): dizin
dosyasıdır, yarışta kopyalanan `-wal`'dan ileri olabilir ve SQLite ona güvenirse olmayan çerçeveyi okur; yoksa
SQLite onu kopyalanan `-wal`'dan yeniden kurar, kopya tutarlı kalır.

**Kimin verisi.** hesap.db'de yalnız sahibin, yani ilk admin hesabının kayıtları (tek depo köprüsüyle aynı seçim,
`hesap.py` `_kopru_ac`); öbür kullanıcıların satırı okunmaz. Mezar taşı, türetilmiş (`briefings`, `decisions`,
`office` …) ve cihaza ait (`hkm`, `storage`, `usage`) yollar göçteki gibi atlanır (`goc.modul_turu`).

**Gizlilik (denetimin bulduğu not düzeyi izinler: `faz3-not.md` King bölümü, `not-ve-tekrar.md` §1).**
- Bilinç düşüncesinin `ozel` işareti: King okumaz. Bilinç haritasının `izin:false` hâli: bütün düşünceler özel
  sayılır (Not motorunun göç kararı, daha sıkı yön). Okunan nottan özel nota giden bağın adı «özel not» olur.
  Hepsi `motor/not.js` `kingOkur`'dadır; sunucu kuralı kopyalamaz, çağırır. Node yoksa ya da motor hata verirse
  notlar aracı hata döner, süzgeçsiz not vermez (testli).
- Kapalı klasör (`kapaliKlasorler`) motorda var ama sahibin bu ayarı bugün hiçbir yerde saklanmıyor: boş liste
  geçer (Açık sorular 4).
- Defter, ESP notu, tez, taslak ve video notunda gizlilik alanı yok (denetim: `defter.js`'te `ozel|gizli|izin` 0);
  bunlar okunur. Özel notun adı başka bir notta düz metin geçerse görünür (motorun bilinen sınırı).
- Kayıt araçları not koleksiyonlarını (`defter`, `defterterim`, `defterklasor`, `notum`, `videoNotes`, `notes`,
  `args`, `drafts`), adında `bilinc` ya da `lifeos.not.` geçen her yolu ve gövdesinde `ozel:true` olan her kaydı
  hiç göstermez; aranamaz, kimlikle de okunmaz.
- Sır: adı ya da ad yolu `goc.SIR_RE`'ye uyan anahtarın değeri «gizli» olur (`apiKey`, `llm.keys` …), arama da
  göremez; yolu sır adlı kayıt kapalıdır.
- Görülmeyenler: yeni kabuğun bu tarayıcıdaki notları, kartları ve yol ilerlemesi (`lifeos.not.kayit`,
  `lifeos.tekrar.kartlar`, `lifeos.yol.felsefe.1`); HKM'nin Motto notları ve hafızası (hkm.db kaynak listesinde
  değil); kişi modeli yayınları (`<modül>/kisi`).

## Testler
`python king/mcp_test.py` → **67/67 yeşil** (ölçüldü). Geçici klasörde gerçek `hesap.Depo` şemasıyla iki kullanıcılı
bir hesap.db, yayınlar (gün cümlesi, plan, günlük, Gün kaydı, özel düşünceli Bilinç haritası), depo benzeri
`alan/`, `kabuk/harita.js`, `kalite/` dosyaları kurulur.

- El sıkışma: `initialize` sürüm pazarlığı (desteklenen aynen, bilinmeyen → `2025-11-25`), `server/discover`,
  `_meta`'da desteklenmeyen sürüm `-32022`, `ping`, bildirim yanıtsız.
- `tools/list`: ≤ 12, her araçta başlık, Türkçe açıklama, nesne şeması, `readOnlyHint`; adında yazma fiili yok.
- Hatalar: `-32700`, `-32600` (boş toplu, 1.0, yöntemsiz, geçersiz id), `-32601`, `-32602` (params, bilinmeyen
  araç, arguments), araç hatası (sınır dışı, bilinmeyen ve eksik argüman), toplu istekte bildirim.
- Her aracın çağrısı ve içeriği: etiketler (ölçüldü, eski kayıt), sır gizli, not ve özel kayıt kayıt aracından
  kapalı, dünkü özet bugünmüş gibi sunulmaz, Not motoruyla arama, taslak ders, kapı sorusu yok, FSRS planı, bütçe
  aşımını kalite motoru buluyor; Node yoksa notlar hata verir.
- Gizlilik: özel düşünce, özel kayıt, sır, türetilmiş kayıt, kapı sorusu ve öbür kullanıcının işaretli metinleri
  bütün araç çıktılarında hiç geçmiyor.
- Canlı dosya: `sqlite3.connect` izlenir, canlı klasörde tek açılış yok; canlı klasör bayt bayt ve tarih tarih aynı,
  yanında `-wal`/`-shm` doğmuyor; geçici kopyalar silinmiş. Aynısı tek depo (lifeos.db) yolu için de.
- Tek depo önce gelir, etiket sütunu okunur, Bilinç orada da süzülür.
- stdio uçtan uca: ayrı süreçte stdout yalnız JSON-RPC (üç yanıt), günlük stderr'de. Başka klasörden başlatılınca
  da çalışıyor (elle denendi).

CI'ya bağlanmadı (AGENTS §2 listesine eklemek paketimin dışındaki dosyalara dokunmak demek; Açık sorular 6).

## Kurulum
Ayrıntı ve tam JSON parçası: `king/KURULUM.md`. Özet: kod çalışan kopyaya (`C:\Users\ASUS\LifeOS-Sistem`)
gelince Claude › Ayarlar › Geliştirici › Yapılandırmayı düzenle; `mcpServers.lifeos-king` = Python yolu, `args`
`king\mcp.py`, `env` `LIFEOS_NODE`; uygulamayı tamamen kapatıp aç. Denetim: `python king\mcp.py --denetle` yalnız
sayıları yazar. Claude yapılandırmasına dokunmadım.

## Açık sorular
1. **Veri Anthropic'e gider.** AGENTS §1.4 «veri hiçbir şirketin sunucusuna gitmez» der; §0.1 kararı (King önce
   Claude uygulamasında) ise King'in okuduğu her kaydın sohbetle Claude'a gitmesi demektir. Özel notlar ve sırlar
   gitmez. Sahibin açık onayı gerekir; sağlık (tahlil, ilaç) gibi bir alan dışarıda kalsın mı?
2. **Node bağımlılığı.** Harita, Not ve Tekrar motorları JavaScript; kural 3 gereği kopyalanmadı, `king/kopru.js`
   ile Node'dan çağrılıyor. Node bu bilgisayarda kurulu; yoksa bu üç araç hata verir, öbürleri çalışır. Kabul mü?
3. **«Bütçe» anlamı.** Karmaşıklık bütçesi (kalite) olarak yorumladım. King'in model harcaması (HKM `butce.py`,
   hkm.db) istenen kaynaklarda yok, okunmadı.
4. **Kapalı klasör ayarı** saklanmıyor; kabuk saklayınca sunucu onu `kingOkur`'a geçirmeli (tek satır).
5. **Claude uygulamasının protokol çağı** göremedim; iki çağ birden yazıldı, gerçek uygulamada denenmedi.
6. **CI**: `king/mcp_test.py` AGENTS §2 denetimlerine ve CI adımına eklenmeli mi?
7. **Boş canlı hesap.db** (faz1 §0 olayı) olursa göç aracı yedeğe döner; MCP dönmez, kaynağı boş gösterir (bayat
   veriyi bugünmüş gibi göstermemek için). `-shm`'i kopyalamama kararı göç aracına da uygulanmalı mı?
8. **Göçten sonra görünmeyecekler:** HKM Motto notları (`not` türü, Not motorunda bağdaştırıcısı yok) kayıt
   araçlarından kapalı kalır, notlarda da görünmez; cihaz paketinden gelen `lifeos.bilinc*` anahtarları biçimi
   bilinmediği için okunmaz. Not motoruna Motto ve paket Bilinç bağdaştırıcısı gerekecek.
