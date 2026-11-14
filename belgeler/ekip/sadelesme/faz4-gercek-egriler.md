# Faz 4 · Gerçek eğriler (göçten sonra) — rapor

Tarih: 14 Kasım 2026, kod `0ddb136c` (sadelesme) + bu iş (commit edilmedi). Önceki: `faz4-egriler.md` (13 eğri, 2'si ölçülü).

```
python kalite/olcum.py --md               # eğriler; tek depo ve yerel setler bu bilgisayarda varsa değer alır
python kalite/egri/_yerel_set.py          # sahibin mesajlarından yerel Arama/Anlama setleri (git dışı)
python kalite/egri/hayata_etki.py         # haftalık özet (yalnız sayımlar)
python tools/kalite_etiket_test.py        # etiket kapısı sınaması (geçici klasör)
```

## Özet

| Eğri | Önce | Şimdi | Etiket |
|---|---|---|---|
| Sistem · Hayata etki | ölçülmedi | **5,0 etkin gün/hafta** (son 4 hafta) | ölçüldü |
| Sağlayıcı kalitesi | ölçülmedi | **1 436,1 jeton/istek** (başarılı, jetonu ölçülen çağrı) | ölçüldü |
| Arama | ölçülmedi | ölçülmedi (sahip etiketi 0); model taslağı: Arama **0,20**, BAM **0,00** | tahmin (eğri değil) |
| Anlama (gerçek) | ölçülmedi | ölçülmedi; **62 gerçek mesaj** etiket bekliyor | veri yok |
| Tanıma, Hafıza | ölçülmedi | ölçülmedi; «gereken» P6'ya göre yazıldı | veri yok |

- Tek depo (`%LOCALAPPDATA%\LifeOS\veri\lifeos.db`) yalnız `mode=ro` ile açılıp belleğe kopyalanarak okunur
  (`kalite/egri/_tekdepo.py`); hiçbir dosyaya yazılmaz. Sınamada bayt bayt ve zaman olarak aynı kaldığı denetlenir.
- CI'da tek depo ve yerel set yok: dört eğri de `ölçülmedi` / `veri yok` kalır, sözleşme iki durumda da tutar.
- HKM'nin `hkm.db`'si (çalışan kopya `LifeOS-Sistem` içinde) okunmadı: P6 `conversations` tablosunu tek depoya
  taşıdı (`sohbet` türü), sahibin mesajları oradan alındı. Çalışan kopyaya dokunulmadı.

## Gizlilik

- Gerçek setler yalnız `kalite/veri/yerel/` içinde: `arama-aday.jsonl` (29 satır), `anlama-aday.jsonl` (62 satır).
  Klasör git dışı (`yerel/.gitignore`: `*`); `git check-ignore` iki dosyayı ve yarım yazım dosyasını tanıyor,
  `tools/kalite_etiket_test.py` bunu her koşuda denetler, kurucu git dışı değilse yazmaz.
- Bu raporda, kayıtta (`kalite/kayit/2026-11-14.json`) ve depodaki hiçbir dosyada mesaj, not, ad ya da kayıt
  içeriği yok; yalnız sayım ve puan. Değişen ve yeni her dosya sahibin 62 mesajına karşı tarandı: eşleşme 0.
- Testler sentetik: sahte tek depo `sistem/goc.py` `SEMA`'sıyla geçici klasörde kurulur; `olcum_test.py`
  `LIFEOS_TEK_DEPO=""` ile başlar, sahibin deposunu hiç açmaz.
- Etiket API'si gerçek mesaj gösterir: yalnız bu bilgisayardan (aşağıda).

## Sistem · Hayata etki

`kalite/egri/hayata_etki.py`. Tek depodaki sahip kayıtları ISO haftasına göre sayılır. Kaydın günü gövdedeki tarih
alanıdır (`hlc` göç anıdır, kullanılmadı). Başlık: verinin en yeni haftasıyla biten 4 haftada haftalık ortalama
etkin gün (bugünün tarihine bağlı değil; aynı depo aynı kayıt). Birim `adım/hafta`tan `gün/hafta`ya döndü, çünkü
adım sayılamıyor (aşağıda).

| Hafta | Etkin gün | King'e mesaj | Kayıt | Not | Plan |
|---|---|---|---|---|---|
| 2026-W43 | 7 | 23 | 4 | 5 | 2 |
| 2026-W44 | 6 | 15 | 3 | 0 | 0 |
| 2026-W45 | 5 | 15 | 6 | 0 | 0 |
| 2026-W46 | 2 | 30 | 2 | 0 | 0 |

- Değer **(7 + 6 + 5 + 2) / 4 = 5,0 gün/hafta**, `ölçüldü`. W46 yarım hafta: depo 14 Kasım göçünün anıdır.
- Sayılan türler: `sohbet` (yalnız sahibin mesajı, King'in cevabı değil), `ays.days`, `olcum`, `gun_kaydi` (kayıt),
  `not`, `spi.haftaplan`, `plan_blogu` (plan). AYS'nin her güne açtığı boş gün kabuğu sayılmaz: 22 gün kaydının
  13'ünde sahibin doldurduğu alan yok. Tarihsiz kalanlar ayrıntıda (`plan_blogu` 5, `gun_kaydi` 2, `not` 1).
- Sayılmayanlar (sistemin ya da ayarın yazdığı): `anahtar` 217, `kullanim` 169, `akis` 9, `meta` 7, `bam` 5,
  `kisi_bilgisi` 5, `tercih` 4, `profil` 3, ötekiler 1-2'şer.
- **Yol adımı `veri yok`.** Tek depoda Yol türü yok: kabuğun Yol/Soru/Tekrar kayıtları hâlâ tarayıcıda
  (`kabuk/depo.js`, IndexedDB «lifeos-kabuk»), tek kapı bayrağı kapalı. Eski AYS'de biten çalışma bloğu da 0
  (66 bloğun hepsi `pending`). Yani «tamamlanan öğrenme adımı» bugün ölçülemiyor; başlıktaki sayı süreklilik.

## Arama

**Set.** `_yerel_set.py` tek depodan sahibin 83 mesajını alır, katlanmış metne göre tekilleştirir (62), soru
biçimlilerini seçer (soru eki/sözü, «?», «anlat/açıkla/detaylandır/öner/ne demek»; en az 2 sözcük): **29**.
İstenen 40–80'e ulaşılamadı: sahibin King'e yazdığı tekil mesaj 62, çoğu selamlaşma ve sohbet.

**Adaylar, iki motor, çevrimdışı** (ağ yok, model yok):
- Yeni Arama (`king/arama.py`): sahibin notları (tek depodaki `not`) + `alan/` içeriği; iddiaları koddan çıkarır.
- Eski BAM iş emri (`king/arama_olc.py` `eski_bam`, faz5-arama.md'deki yol): boş web fixture'ıyla. BAM'in tek kaynağı
  web olduğu için çevrimdışı hiçbir aday vermez; belirsiz mesajda geri sorar. Bunun için `eski_bam`'a iki satır
  eklendi: BAM talebi almazsa iddia yok (önce `KeyError` veriyordu). Fixture taşıyıcısı 8 çağrı saydı, gerçek ağ 0.

| | Adaylı satır (29'da) | Model taslağı: isabet (10 arama sorusu) | İlgisiz aday gösterilen soru |
|---|---|---|---|
| yeni: Arama | 12 | **2/10 = 0,20** | 3/10 |
| eski: BAM | 0 | **0/10 = 0,00** | 0/10 |

- **Etiket `tahmin`, eğri değil.** Etiketleri ben (model) taslak olarak yazdım (`etiketleyen: "model"`): 19 satır
  «arama-degil» (selam, soru-cevap devamı, sistemle ilgili soru), 10 satır arama sorusu. Arama'nın iki isabeti
  kısmi: biri felsefe alanından bir tanım cümlesi, öteki kavramın geçtiği SPİ dersini gösteriyor. Eğrinin `deger`'i
  `null`; puan `ayrinti.vekil` içinde («vekil: model etiketi, gerçek sorular»).
- **Arama BAM'i taslak etiketlerde geçiyor (0,20 > 0,00, tahmin), ama bu adil bir BAM kapısı değil:** karşılaştırma
  yalnız yerel kaynakta; BAM'in web yolu ölçülmedi (ağ yasak). Arama'nın 12 adaylı satırının 10'u ilgisiz ya da
  selamlaşmaya verilmiş cevap: yerel kaynakta «uyan sözcük» eşlemesi gürültülü (örn. bir selamlaşma mesajı için dil dersi).
- İsabet tanımı: arama sorusu olan satırda motorun en az bir ilgili adayı var. Çekimser kalmak isabet sayılmaz.
- Eğri sahip etiketi gelince `ölçüldü` olur. Set yolu `LIFEOS_ARAMA_SET` ya da `kalite/veri/yerel/arama-aday.jsonl`.
  **Sapma:** görevdeki varsayılan `arama.jsonl` idi; etiketler API'yle aday dosyasına yazıldığı için eğri aynı dosyayı
  okur. `arama.jsonl` adı faz5'in canlı web biçimine (`beklenen/kaynak/yasak`) kaldı.

## Anlama (gerçek)

- `anlama-aday.jsonl`: sahibin **62** tekil mesajı, `etiket: null`. King'in o anki niyeti kaydedilmemiş
  (`conversations`'da niyet sütunu yok; `usage` yalnız model rolünü tutuyor). Bu yüzden her satırda `king_bugun`:
  **bugünkü** `king/niyet.py` kararı (sohbet 55, yönet 7), adıyla ve koduyla «o anki King değil» diye işaretli.
- Eğri `ölçülmedi`, ayrıntıda `gercek_mesaj: {satir: 62, bekleyen: 62, sahip_etiketli: 0}`. Sahip etiketi gelince
  değer = bugünkü niyet.py'nin isabeti, `ölçüldü` (eski «yanlış anladın» seti değer veriyorsa o önce gelir).
- Sınav vekili (0,989, tahmin) değişmedi.

## Etiket API'si

`sistem/etiket.py` + `sistem/sunucu.py` (`Giris`, `/api/kabuk/baslangic`'in yanında); tek kapı da Giris'e verir
(`tekkapi.py` `KOK_ONEKLER` + `/api/kalite/`). Set klasörü `sunucu.ETIKET_DIZIN` = `<kök>/kalite/veri/yerel`.

**`GET /api/kalite/etiket/adaylar?set=arama|anlama`** — yalnız bu bilgisayardan (`hesap._yerel_mi`; vekil/Tailscale 403).
```
200 {"ok": true, "set": "arama", "bekleyen": 29,
     "satirlar": [{"id": "…", "metin": "…", "adaylar": [{"no": "a1", "baslik": "…", "ozet": "…"}]}]}
```
En çok 20 satır; sahibin etiketlediği gelmez, model taslağı bekleyen sayılır. Motor adı, kaynak, model taslağı ve
King'in kararı gitmez (sahip körlemesine etiketler). Anlama satırında `adaylar: []`. Bilinmeyen set 400, bozuk set 500.

**`POST /api/kalite/etiket`** gövde `{"set", "id", "etiket"}` (JSON, ≤16 KB) — yalnız bu bilgisayardan ve `Origin`
yok ya da kendi kökeni (`http://127.0.0.1:4180`, `http://localhost:4180`); başka sayfa 403.
- `anlama`: `etiket` ∈ `sohbet|kayit|ogren|arastir|yonet`.
- `arama`: `etiket` = o satırın aday numaralarından tekrarsız liste (`[]` = hiçbiri doğru değil) ya da `"arama-degil"`.
- Bilinmeyen set/kimlik, geçersiz etiket, JSON olmayan gövde → `400 {"ok": false, "mesaj": "…"}`; dosya değişmez.
- Geçerliyse satıra `etiket`, `etiketleyen: "sahip"`, `etiket_zamani` (saniyeli yerel ISO) yazılır → `200 {"ok": true}`.
  Dosya geçici adla bütün yazılır, `fsync`, sonra `os.replace` (yarım dosya kalmaz); süreç içi kilit. Bozuk satırlı
  sete yazılmaz.

Ekran yapılmadı (kabuk/ başka mühendiste).

## Öteki eğriler

- **Sağlayıcı kalitesi** (`kalite/egri/saglayici.py`): tek depodaki model kullanım defteri (`kullanim`, P6'da HKM
  `usage`'dan). 169 çağrı (yerel 155, google 14; 20 Ekim – 14 Kasım): başarılı 118, başarısız **51 (0,302)**,
  tahmini jetonlu 24. Başlık, başarılı ve jetonu sağlayıcıdan gelen 94 çağrının ortalaması **1 436,1 jeton/istek**
  (ortanca 938; ortanca süre 1 070 ms), `ölçüldü`. «Gereksiz çağrı» (cevap için gerekmeyen) sayacı hâlâ yok;
  başarısız çağrı boşa giden çağrıdır ama gereksizin yerine geçmez.
- **Tanıma, Hafıza:** hafıza kayıtları artık tek depoda (`kisi_bilgisi`), «gereken» buna göre güncellendi; yoklama
  seti ve gömme modeli olmadan ölçülemez.
- **Kontrol, Öğretme, Üretim, Kendini eğitme, Tekrar:** P6 bunları değiştirmedi (hata kaydı, ders defteri, çalışan
  King gerekiyor); dosyalara dokunulmadı.

## Testler ve kapı

| Komut | Sonuç |
|---|---|
| `python kalite/olcum_test.py` | **62/62** (10 yeni: Hayata etki 2, Sağlayıcı 1, sözleşme 1, salt-okur 1, CI'da ölçülmedi 1, Arama 3, Anlama 1) |
| `python tools/kalite_etiket_test.py` (yeni, CI'a eklendi) | **26/26** |
| `python tools/tekkapi_test.py` | **140/140** (2 yeni: tek kapı yönlendirmesi, vekile 403) |
| `python kalite/katman_test.py`, `kalite/anlama_test.py`, `king/arama_test.py`, `king/niyet_test.py` | geçti |
| `python kalite/olcum.py --denetle` (önce, `--kaydet` sonrası, `PYTHONDONTWRITEBYTECODE=` ve `LIFEOS_TEK_DEPO=` ile CI benzeri) | çıkış 0, 28 bütçe, aşım yok |

- HKM testleri koşulmadı: HKM'ye dokunulmadı, HKM `king/arama_olc.py`'yi içe aktarmıyor.
- `--kaydet`: `kalite/kayit/2026-11-14.json` yeniden yazıldı. İçinde mutlak yol ve mesaj yok; eğri ayrıntıları yalnız
  sayım. Kayıtta değişen bütçeli değerler (`kabuk_acilis_yuku` 449 139 → 541 292, `alan_paketi_en_buyuk`) `tavan`
  türünde, `kod_hacmi` `izlenir`: bunlar başka mühendislerin commit edilmemiş `kabuk/` işini de sayıyor.
- `tools/tools_dizin_kabul_test.py` kırmızı, ama benden değil: dizinde olup henüz diskte olmayan `onay_uygula*.py`.

## Açık konular

1. **Sahip etiketi.** İki eğrinin ölçülmesi için sahip 29 Arama + 62 Anlama satırını etiketlemeli (ekran kabuk işi).
2. **Arama seti küçük (29 < 30).** BAM kapısı en az 30 arama sorusu istiyor; taslakta yalnız 10 satır arama sorusu.
   Daha çok gerçek soru birikmeli ya da örneklem kuralı genişlemeli (sahibin kararı).
3. **BAM'in web yolu ölçülmedi.** Adil kapı için iki motor canlı web ve modelle aynı sorularda koşmalı
   (`arama_olc.py` `--canli`, shortcut notu duruyor).
4. **Arama yerel gürültüsü.** Selamlaşmaya alan cümlesi döndürüyor (12 adaylı satırın 10'u ilgisiz). Konu kökü eşlemesine
   eşik ya da «arama sorusu mu» kapısı gerekebilir.
5. **Yol adımı** kabuk kayıtları tek depoya geçince sayılır; o gün Hayata etki başlığı adıma dönebilir.
6. **«Z»li zaman** (not, plan) UTC günü sayılıyor; gece yarısına yakın kayıt bir gün kayabilir (kodda `shortcut:`).
7. Sağlayıcı'da «gereksiz çağrı» sayacı yok; `usage.neden` alanı bir başlangıç olabilir.
