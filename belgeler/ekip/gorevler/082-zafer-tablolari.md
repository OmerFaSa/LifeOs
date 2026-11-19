# 082 · Üç zafer tablosu (Malazgirt, İstanbul, Çanakkale) ve portre yüzleri

**Durum:** takıldı   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/082-zafer-tablolari`
**Efor:** yüksek   <!-- düşük (flash_lite) | orta (flash) | yüksek (pro; ölçülen 2026-10-31: flash ile aynı model) -->
**Kabul testi:** `tools/turk_tablo_kabul_test.py`

## Amaç
Sahibin sözü (2026-11-19): «pixel artları çok kötü yapıyoruz», «bu pixelartları antigravityden iste».
Claude'un siluet zafer tabloları kaldırıldı; Tarih'teki «Tarih tabloları» bölümünde şimdilik önceki turun elle ayarlanmış üç sahnesi var:
Ötüken, Kocatepe (26 Ağustos 1922), Semerkant (`belgeler/tasarim/turk-tema/`: `yama.py` sahne kodunu `piksel-doga-turk.js`'e ekler).
Eksik üç zaferi **aynı motorla ve aynı işçilikle** (bantlı gök, büyük bulutlar, ışık sağdan, sınırlı palet, ön/orta/uzak katman) çiz:

1. **malazgirt** — Malazgirt Meydan Muharebesi, 26 Ağustos 1071. Doğu Anadolu ovası, uzakta karlı Süphan Dağı; Selçuklu atlı okçuları ve tuğ;
   önde ak giysili bir atlı (kaynaklarda Alp Arslan'ın savaştan önce beyaz giydiği anlatılır). Sabah ışığı.
2. **istanbul** — İstanbul'un Fethi, 29 Mayıs 1453. Kara surları ve burçlar, gedikte asker, burca dikilen al sancak; önde Osmanlı topu;
   surların ardında Ayasofya kubbesi (fetih anında **minaresiz**). Şafak.
3. **canakkale** — Çanakkale Deniz Zaferi, 18 Mart 1915. Boğaz ve iki yaka, kıyı tabyasında toplar ve ay yıldızlı al bayrak (1915 Osmanlı bayrağı),
   boğazda dumanı tüten büyük zırhlı, kıyıya yakın küçük mayın gemisi (Nusret). Gün batımı.

İkinci iş (ayrı commit): `kabuk/ata-veri.js` PORTRE'deki on beş portre aynı yüz şablonundan; her hükümdara ayırt edici bir yüz ver
(yüz biçimi, burun, kaş, bıyık, sakal, yaş, ten). Biçim aynı kalır: 32×32 karakter, palet `p`, çerçeve ve doku kodu (`kabuk/ata.js`) değişmez.
Atatürk'e saygı: karikatür yok, ağırbaşlı. Hükümdar bilgisi uydurulmaz (bıyık, sakal, başlık tanınmış tasvirlerden).

## Dokunulacak dosyalar
- `belgeler/tasarim/turk-tema/yama.py` — üç yeni sahne (`malazgirt`, `istanbul`, `canakkale`); `python yama.py` ile `piksel-doga-turk.js` yeniden üretilir.
- `belgeler/tasarim/turk-tema/piksel-doga-turk.js` — yama.py'nin çıktısı.
- `kabuk/tablo.js` — `python belgeler/tasarim/turk-tema/tablo_yaz.py` üretir (420×236 ve 336×189 PNG, data URL). Elle yazılmaz.
- `belgeler/tasarim/turk-tema/tablo_yaz.py` — `SAHNE` sözlüğüne üç satır (ad → [sahne, vakit]).
- `kabuk/ata.js` — `TABLO`'ya üç giriş (ad, alt, metin; metinler aşağıda) ve `TABLO_GUN`: `'5-29': 'istanbul'`, `'3-18': 'canakkale'`
  (26 Ağustos'ta Kocatepe kalır).
- `kabuk/ata-veri.js` — yalnız ikinci işte, yalnız PORTRE ızgaraları ve paletleri.

Metinler (aynen):
- malazgirt: ad «Malazgirt», alt «26 Ağustos 1071 · Malazgirt Meydan Muharebesi», metin «Alp Arslan komutasındaki Selçuklu ordusu Bizans ordusunu yendi; Anadolu’nun kapıları Türklere açıldı.»
- istanbul: ad «İstanbul’un Fethi», alt «29 Mayıs 1453», metin «II. Mehmed şehri aldı ve Fatih adıyla anıldı; İstanbul Osmanlı’nın başkenti oldu.»
- canakkale: ad «Çanakkale», alt «18 Mart 1915 · Deniz Zaferi», metin «İtilaf donanmasının boğazı zorla geçme girişimi kıyı tabyaları ve mayın hattı önünde durduruldu.»

## Dokunma
- `brand/ortak/piksel-doga.js` (uygulamanın sahne motoru), `kabuk/kabuk.js`, `kabuk/kabuk.css`, `kabuk/ayar.js`, temalar.
- Ötüken, Kocatepe, Semerkant sahneleri (değişirse tabloları da değişir).
- Kabul testi dosyası.

## Kabul ölçütü
- `kabuk/ata.js` TABLO'da `malazgirt`, `istanbul`, `canakkale` var; ad, alt, metin yukarıdaki gibi dolu.
- `kabuk/tablo.js`'te üçünün de `buyuk` (420×236) ve `kucuk` (336×189) PNG'si var; her resimde en az 24 farklı renk; gök (üst satırlar) ile yer (alt satırlar) farklı.
- `piksel-doga-turk.js` SAHNE'de `malazgirt`, `istanbul`, `canakkale` tanımlı.
- `gununTablosu`: 29 Mayıs → istanbul, 18 Mart → canakkale, 26 Ağustos → kocatepe.
- `node kabuk/ata.test.js` yeşil (portre biçimi dahil).

## Koşulacak testler
- `python tools/turk_tablo_kabul_test.py` (önce kırmızı, sonra yeşil)
- `node kabuk/ata.test.js`
- `node kabuk/kabuk.test.js`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:** Depo sahibi görevi iptal etti (2026-11-19: «yapmasın, durdurdum»). İlk deneme 69. adımda model akışı kesilince boş kaldı; ikinci denemede `ag/082-zafer-tablolari` dalına Malazgirt tablosu commit'lendi (698515d0), birleştirilmedi.
- **Koşan testler:** yok
- **Kabul testi:** koşulmadı (kırmızı kaldı)
- **Açık kalan:** Malazgirt, İstanbul, Çanakkale tabloları; dal duruyor, istenirse incelenip alınabilir.
