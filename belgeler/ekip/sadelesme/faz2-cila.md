# Faz 2 · Kabuk cilası (bütün ekranlar taşlardan, tek ürün görünüşü) + Ölçüm için etiketle

Karar A2: «Ekranlar yalnız bileşen kataloğundan kurulur». Önceki paket: `faz2-bilesen-son.md` (§7 açık noktalar). Başlangıç: dal `sadelesme`,
d4ffbfaa (iş sırasında başka mühendis 9e371f16'yı commit'ledi; kabuk/ dosyaları ona göre değişmedi). **Commit yok** (çalışma ağacı).
Yan yana çalışanların dosyalarına (kalite/, king/, sistem/, AYS/SPI/ESP, ci.yml, DIZIN'ler, brand/) dokunulmadı.

## 1. Çevrilen parçalar

| Ekran (dosya) | Önce (elle) | Sonra |
|---|---|---|
| Tekrar kartı (`araclar.js`) | `.kart`, `.kart__on/__arka`, `.notlar` ızgarasında `B.dugme` («İyi · 3 gün») | **`B.kart`**: ön yüz, arka yüz (odak alır), dört not düğmesi ad + «3 gün sonra» |
| Not ağı (`araclar.js`) | elle `<section>`+`<h2>`+açıklama cümlesi+`<svg class="notag">` | `B.bolum` + **`B.ag`** (düğüm/kenar verisi; SVG, özet ve örnek çizgili açıklama taşta) |
| Kayıt haftası tablosu (`araclar.js`) | `.khafta` + elle `<table>` | **`B.tablo`** (bugün sütunu, veri yok «·», gizli etiket) |
| Deneme üst şeridi (`deneme.js`) | `.deneme__ust`, `.sayac` | **`B.serit`** (sayaç `role=timer`, son dakika sınıfı) |
| Deneme soru numaraları (`deneme.js`) | `.deneme__no`, `.deneme__nobt` | **`B.adimlar`** |
| Cevap anahtarı (`deneme.js`) | `<ol class="deneme__anahtar">` | `B.tablo` (Soru · Cevabın · Doğrusu · Sonuç) |
| Ayarlar satırları (`ayar.js`) | `.ayar`, `.sayiayar` (elle `type=number`), `.aralik` (elle onay + saat) | **`B.ayar`** + `B.tercih` / `B.alan` (sayı, onay, saat) |
| Sisteme not (`araclar.js`) | elle `<h3>` (`[data-sistemnot] h3`) | `B.acilir` düzey 3, açık |
| Boş durumlar (`araclar.js`) | `<p class="soluk">` (Not listesi, not araması, araçta not, Tekrar, Kayıt günü, Kayıt haftası, Plan) | `B.bos` (ne yapılacağını söyler) |

**Soru kilidi:** `B.soru({kilitli})` artık `disabled` değil `aria-disabled="true"`: şıklar cevaptan sonra Sekme sırasında kalır, ekran
okuyucu doğru/yanlış işaretini şık şık okuyabilir. Tıklamayı yok saymak üç işleyicide: `araclar.js` (`[data-arac-ac]:not([aria-disabled])`),
`deneme.js` (tık ve A–E klavyesi), `kabuk.js` (ders alıştırması). Gezide yeni denetim: kilitli şıklar odaklanabilir (`tabIndex 0`), tıklamak cevabı değiştirmez.

kabuk.css'ten silinenler (48 satır): `.ayar*`, `.sayiayar*`, `.aralik*`, `.kart*`, `.notlar*`, `.notag*`, `.deneme__*`, `.sayac*`, `.khafta*`,
`[data-sistemnot] h3`. kabuk.css'teki her sınıf seçicisi için kullanım arandı: kullanılmayan kalmadı.

## 2. Eklenen / değişen taşlar

Katalog 16 → **22 taş** (`bilesen.js`, `bilesen.css`, `bilesen.html` 17–22, `bilesen.test.js` +5 test, `tools/bilesen_goruntu.js` 22):
- **17 · Kart** `kart({on, arka?, notlar?: [{metin, sure, veri}], eylem?, veri?})` — notlar yalnız arkayla; düğmeler eşit, en az 64 px, sığmazsa iki sütun.
- **18 · Tablo** `tablo({etiket | ad, ilk, sutunlar: [{metin, alt?, bugun?}], satirlar: [{ad, alt?, pul?, hucreler: [{metin, alt?, okunur?} | null]}]})` — kendi kabında kayar (`role=region`, Sekme durağı).
- **19 · Şerit** `serit({baslik, alt?, sayac?: {metin, ad, az?}, veri?})` — üste yapışır.
- **20 · Adımlar** `adimlar({ad, ogeler: [{etiket, dolu?, secili?, veri?}]})` — 44 px kare numaralar.
- **21 · Ayar satırı** `ayar({ad, not?, id, govde? | deger?, isik?, veri?})` — birden çok denetim `role=group`.
- **22 · Ağ çizimi** `ag({ad, en, boy, dugumler, kenarlar, ozet?, aciklama?})` — kenar türü `duz|kesik|kalin`; `javascript:` bağlantısı, kopuk kenar, bilinmeyen tür → `TypeError`.
- `alan`: `gizliAd` (etiket yalnız ekran okuyucuda; adı yanında yazan ayar satırı).
- `dugme`: `height` → `min-height` (44 / ana 52); `eylemler`: `align-items:stretch` (aynı sıradaki düğmeler aynı boyda, §3).

## 3. Cila (önce → sonra)

Önce görüntüleri (d4ffbfaa'daki `kabuk-onizleme/`) çalışma alanına kopyalandı; sonra `node tools/kabuk_gez.js --goruntu` ve `node tools/bilesen_goruntu.js`
ile hepsi yeniden çekildi ve 390 açık, 390 koyu, 1280 açık sayfaları yan yana dizilerek bakıldı (Bugün, alanlar, ders, kapı, yer belirleme, Not, Not ağı,
sisteme not, Tekrar, Kayıt, Kayıt haftası, Plan, hafta, Soru, deneme ×4, Tanışma ×3, Ayarlar, Onaylar ×4, Sistem haritası, halka, komut).
**Gezi artık her ekranı dört görünümde çeker:** Felsefe, ders, kapı, Not, Tekrar, Kayıt, Plan, Soru, kilitli aşama önceden yalnız «1280 koyu»
çekiliyordu (telefon taşması da denetlenmiyordu); dokuz ekran dört görünüme ve taşma denetimine girdi.

1. **Yan yana düğmeler farklı boydaydı** (ana 52, ikincil/sade 44): Felsefe «Baştan başla / Seviyemi bul», Not «Kaydet / Sil / Notlara dön», Kayıt
   «Kaydet / Haftalık özet», Plan «Yeniden kur / Hafta planı», deneme «Önceki / Sonraki / Bitir», Onaylar «3 dersi onayla / Vazgeç», araç
   «Bu araçta yeni not / Aracı düzenle», «Oluştur / Vazgeç» → eylem sırası en uzun düğmeye uzatır; hepsi aynı boy (görüntüde bakıldı).
2. **Tekrar notları** tek satır «İyi · 3 gün» düğmeleri → iki satırlı eşit kutular (ad, altında «3 gün sonra»); telefonda 2 × 2.
3. **Not ağı:** «aynı etiket» kesik çizgisi `--cizgi` rengindeydi (açık temada zemine çok yakın, zayıf kontrast) → `--cizgi-guclu`; açıklama
   cümle içindeydi («Çizgi: bağ; kesik: …») → örnek çizgili açıklama satırı.
4. **Deneme şeridi:** test adı başlıkla aynı satırda sıkışıyordu → alt satırda; soru numaraları: cevaplı/cevapsız yalnız zemin farkıydı → cevapsız
   numara soluk, cevaplı koyu + güçlü çizgi; aralık 6 → 4 px (telefonda satırda 7 kutu).
5. **Kayıt haftası:** tablo sabit 560 px genişlikteydi → içerik kadar, kendi kabında kayar; **cevap anahtarı** düz cümle listesi → üç sütunlu tablo.
6. **Ayarlar:** saat kutuları 40 px ve etiketleri satır içinde, sayı kutusu ayrı ölçüde → taşın 44 px alanları, etiket üstte; satır dolgusu 14 → 12 px (ölçek).
7. **Boş durumlar** (§1) artık ne yapılacağını söylüyor; «Blok yok.» → «Bu günde blok yok.», «İş yok.» → «Eklediğin iş yok.»
8. **Jargon:** «(uyku, HRV, …); puan hesaplanmadı» → «(uyku, nabız değişkenliği (HRV), …); toparlanma puanı hesaplanmadı»;
   «Tam yük · çarpan 1» → «Tam yük · yük oranı %100».
9. **Sisteme not:** küçük soluk elle `h3`'ler → açılır başlıklar (öteki bölümlerle aynı).
10. Taşma: gezinin bütün telefon taşma denetimleri ve katalog 4/4 görünümde yatay taşma 0.

## 4. Ölçümler (önce / sonra)

Önce = d4ffbfaa (`git show HEAD:…`), sonra = çalışma ağacı; sayım `faz2-bilesen-son.md` ile aynı (`grep -o 'font-size:[^;}]*' | sort -u`, `padding:` aynı).

| | Önce | Sonra |
|---|---|---|
| `kabuk.js` / `araclar.js` / `deneme.js` / `ayar.js` / `tanisma.js` | 711 / 1019 / 328 / 155 / 437 | 711 / **1005** / **327** / **144** / 437 |
| `onay.js` | 243 | 328 (**+85: etiketleme ekranı, §7**) |
| `bilesen.js` / `bilesen.html` | 327 / 167 | 424 / 192 (6 taş) |
| **JS toplam** (kabuk/*.js, testler hariç) | **3523** | **3679** (+156 = katalog +97, etiket ekranı +85, ekranlar −26) |
| `kabuk.css` / `bilesen.css` | 204 / 168 | **154** / 231 |
| **CSS toplam** | **372** | **385** (+13; kabuk.css −50, altı taşın kuralları + zorunlu renk kipi +63) |
| Ayrı `font-size` (kabuk.css) | 10 | **7** |
| Ayrı `font-size` (kabuk.css ∪ bilesen.css) | 10 | 10 (yeni değer yok) |
| Ayrı `padding` (kabuk.css) | 20 | **15** |
| Ayrı `padding` (kabuk.css ∪ bilesen.css) | 27 | **25** |

Kalan 15 kabuk.css `padding` değeri çerçeve, karşılama, halka, komut çubuğu, Ayarlar gezinmesi ve Tanışma sohbetinde (§6).

## 5. Testler

14 Kasım 2026, çalışma ağacı, son değişiklikten sonra.

| Komut | Sonuç | Beklenti değişikliği |
|---|---|---|
| `node kabuk/kabuk.test.js` | 55/55 | ayar sayı alanı `type="number"` yerine taşın `inputmode="decimal"` metin kutusu (Türkçe virgül; `sayiYaz` zaten «,» okuyordu) |
| `node kabuk/depo.test.js` | 13/13 | yok |
| `node kabuk/bilesen.test.js` | **18/18** (önce 13) | 16 → 22 taş; soru kilidi `aria-disabled` (ve `disabled` yok); **+5 test**: kart, tablo, şerit + adımlar, ayar + gizli etiket, ağ (her biri kötü girdi dahil) |
| `node kabuk/tanisma.test.js` | 25/25 | yok |
| `node kabuk/deneme.test.js` | 6/6 | yok |
| `node kabuk/onay.test.js` | **14/14** (önce 13) | +1: etiket geçerliliği (§7) |
| `node tools/kabuk_gez.js` (gerçek Chromium) | **256/256** (önce 237) | seçiciler yalnız değişen işaretlemede: `.kart*` → `.b-kart*`, `.notlar .b-dugme` → `.b-kart__not`, `line.notag__bag` → `line.b-ag__duz`, `.khafta__tablo` → `.b-tablo table`, `.sayac` → `.b-serit__sayac`, `.deneme__nobt(--cevapli)` → `.b-adimlar__no(--dolu)`, `[disabled]` → `[aria-disabled="true"]`. **+19 denetim:** kilitli şıklar odakta (1), dokuz ekranın telefon taşması (9), etiket (7 + 2 taşma). Onay bağlamının konsol süzgecine yalnız etiket API'sinin kasıtlı 403'ü eklendi |
| `node tools/kabuk_gez.js --goruntu` | 256/256, görüntüler yenilendi (29 yeni dosya) | — |
| `node tools/bilesen_goruntu.js` | 4/4 görünüm, taşma 0, **22 taş**, konsol temiz | beklenen bölüm 16 → 22 |
| `python kalite/olcum.py --denetle` | «Bütçe tamam: 28 bütçe, aşım yok.» | bütçe dosyası değişmedi |

## 6. Açık noktalar

1. **Hâlâ elle kurulan:** Bugün karşılaması (`.karsila`), Tanışma sohbet düzeni (`.tn__*`), halka ve komut çubuğu (açılır katmanlar),
   Ayarlar gezinmesi (`.ayarnav`) ve hafta/form yerleşim kuralları. Bunlar çerçeve ve yerleşim; taş yapmak bu pakete sığmadı.
2. **`yer-1…yer-7` önizlemeleri eski:** hiçbir araç bunları üretmiyor (faz3 paketinin tek seferlik çekimi); yer belirlemenin güncel görüntüleri
   `yerlestirme-soru/-sonuc`, `asama-liste`, `asama-kilitli`. Silmek ya da araca bağlamak koordinatörün kararı.
3. Soru taşının **radyo kipinde** kilit `aria-disabled` olur ama ok tuşu radyo seçimini tarayıcıda yine değiştirebilir; bugün kilitli radyo kullanan
   ekran yok (kapı ve yerleştirme kilitlenmiyor). Kullanılırsa ekranın `change` olayında geri alması gerekir.
4. «Sayaçlar ve noktalar: Gizle» kabukta hâlâ boş (`faz2-bilesen-son.md` §7.1, sahibin kararı).
5. Satır sonları: Python ile yazılan dosyalar LF; git `autocrlf` uyarısı içerik farkı değil.

## 7. Ölçüm için etiketle (#/onay)

Koordinatörün ek işi. API: `sistem/etiket.py` + `sistem/sunucu.py` (9e371f16), rapor `faz4-gercek-egriler.md`. Sunucu ve kalite dosyalarına dokunulmadı.

**Ekran** (`kabuk/onay.js`, Onaylar ana sayfasında «Alanlar»dan sonra bölüm «Ölçüm için etiketle»; yalnız taşlar):
- Açılışta iki istek (`GET /api/kalite/etiket/adaylar?set=anlama|arama`). Bekleyen sayıları `B.sayilar` «Anlama · bekleyen N mesaj» ve
  «Arama · bekleyen N soru», etiket **ölçüldü**; iki düğme «Anlama etiketle» / «Arama etiketle» (boş set kapalı düğme). İkisi de 0 ise `B.bos`
  «Etiketlenecek mesaj yok.».
- **Anlama:** mesaj `B.soru` başlığında, beş niyet büyük şık düğmesi, her biri tek satır düz Türkçe («Kayıt: bir şeyi yazdırmak ya da saydırmak istiyor
  (su, uyku, harcama…)» …). Dokununca yazılır, sonraki mesaj gelir, odak yeni mesaja geçer.
- **Arama:** soru başlıkta, adaylar `B.alan` onay kutuları (başlık — özet), «Seçtiklerim doğru» (hiçbiri seçilmeden gönderilmez, hata satırı),
  «Hiçbiri doğru değil» (`[]`), «Bu bir arama sorusu değil» (`"arama-degil"`).
- Her adımda «Atla» (yazmadan geçer) ve «Bitir». Tur (en çok 20 satır) bitince sayılar yeniden alınır, «N etiket yazıldı.» satırı odak alır.
- `POST /api/kalite/etiket` aynı kökene `fetch` + `Content-Type: application/json` (tarayıcı `Origin`'i kendisi koyar). 400 → sunucunun iletisi
  hata satırında, aynı mesajda kalınır; 403, ağ hatası, sunucu yok, `file://` → **yalnız** `B.uyari` bilgi «Etiketleme yalnız bu bilgisayarda açılır.».
- **Gerçek mesajlar** yalnız sayfa değişkeninde (`et`) durur: `localStorage`, IndexedDB, konsol yok; istekler `cache: 'no-store'`.

**Saf kısım ve test:** `Onay.etiketGecerli(set, satir, etiket)`, `Onay.NIYETLER`, `Onay.ARAMA_DEGIL` — `etiket.gecerli`'nin aynısı (anlama beş niyet;
arama tekrarsız, metin, satırın aday numarası olan liste ya da «arama-degil»; bilinmeyen set false). `onay.test.js` niyet listesini ve
`ARAMA_DEGIL`'i `sistem/etiket.py`'den okuyup karşılaştırır (sunucu değişirse test kırmızı), 26 durum dener.

**Gezi (`tools/kabuk_gez.js`):** `sunucu.ETIKET_DIZIN` = depo içindeki `kalite/veri/yerel` ve bu klasörde **gerçek setler var**; ortam değişkeni yok.
Bu yüzden oraya hiçbir şey yazılmadı ve gezide etiket API'si **tarayıcı tarafında kesilip sahte cevaplanır** (`context.route`; hiçbir istek
sunucuya gitmez, görüntülere gerçek mesaj girmez). Yedi denetim: boş set (iki sayı «0, ölçüldü» + boş durum), Anlama (mesaj, beş açıklamalı düğme,
odak), niyet gönderimi (gövde `{"set":"anlama","id":"g1","etiket":"kayit"}`, sonraki mesaj), «Atla» yazmaz + tur sonu sayıları tazeler, Arama
(iki onay kutusu, iki düğme, seçimsiz gönderilmez), seçilen adaylar liste gider ve mesajlar `localStorage`/`sessionStorage`'da yok, 403'te yalnız
tek sakin satır. Yazma tarafı (geçici klasör) `tools/kalite_etiket_test.py`'de.

**Görüntüler:** `onay-*` (boş set bölümüyle), `onay-etiket-*` (Anlama), `onay-etiket-arama-*` (Arama, seçimsiz gönderme hatası görünür), her biri
1280/390 × açık/koyu; bakıldı: telefonda taşma yok, düğmeler 44+ px, koyu temada okunur.

**Açık noktalar (etiket):**
- `POST` yalnız `Origin` `http://127.0.0.1:4180` / `http://localhost:4180` iken kabul edilir. Kabuk başka bir porttan (ör. tek kapının kendi portu)
  açılırsa sunucu 403 verir ve ekran «yalnız bu bilgisayarda» satırına düşer. Gerçek sunucuyla uçtan uca (sahte cevapsız) koşulmadı; sahip ilk
  kullanımda bir mesaj etiketleyip `kalite/veri/yerel/*-aday.jsonl`'da `etiketleyen: "sahip"` görmeli.
- Bölüm Onaylar'da on alan satırının altında; telefonda epey aşağıda kalıyor. Yukarı alınması ya da Bugün'e «N mesaj etiket bekliyor» satırı sahibin isteğine bağlı.
- Uzun aday özetleri onay kutusu etiketinde tam yazılır (kısaltma yok); geniş ekranda kısa adaylar yan yana dizilir.
