# King olayı: modül → HKM sözleşmesi (KING-4 §C)

Modül bir şey fark eder (uyku düştü, sınava 30 gün kaldı, plan maddesi kaçtı,
tekrar günü geldi) ve HKM'ye **olay** yollar. HKM'nin kural motoru
(`HKM/core/kendiliginden.py`) olayı «King şimdi konuşsun mu?» kararına çevirir.
Modül karar vermez, mesaj yazmaz; yalnız ölçtüğünü ya da hesapladığını söyler.
HKM kapalıysa olay kaybolur ve modül bozulmaz (AGENTS §1.4): ateşle ve unut,
cevabı beklemeden devam et, hatayı yut.

## İstek

```
POST /api/olay
{
  "modul":  "spi",                         // ays | spi | esp
  "tur":    "uyku_dustu",                  // aşağıdaki katalogdan
  "kimlik": "spi.uyku_dustu.2026-11-01",   // aynı olay ikinci kez gelirse tek sayılır (≤ 80 harf)
  "at":     "2026-11-01T07:10:00",         // olayın oluştuğu an, yerel saat (yoksa varış anı)
  "sayilar": {                             // ≤ 8 sayı; her biri etiketli (AGENTS §1.2)
    "ort7":  {"deger": 5.9, "birim": "saat", "etiket": "ölçüldü"},
    "ort28": {"deger": 7.1, "birim": "saat", "etiket": "hesaplandı"}
  },
  "konu": "Türev"                          // isteğe bağlı kısa ad (≤ 80 harf): plan maddesi, ders
}
```

- `etiket`: `ölçüldü | hesaplandı | tahmin | veri yok`. «veri yok» olan sayının
  `deger`i `null`'dır; kural o sayıya dayanıyorsa karar `eksik_veri` olur.
- `kimlik` modülün işidir: aynı gün aynı olay için aynı kimlik. Önerilen biçim
  `<modul>.<tur>.<YYYY-AA-GG>[.<konu>]`.
- Kişisel metin (not, günlük cümlesi) yollanmaz; yalnız sayı ve kısa ad.

## Cevap

`200 {"ok": true, "id": 12, "karar": "basla" | "bekliyor" | ..., "tekrar": false}`
`400 {"ok": false, "note": "..."}` biçim yanlışsa. Modül cevaba göre hiçbir şey yapmaz.

## Katalog (ilk sürüm)

| `tur` | Modül | Zorunlu sayılar | King ne zaman başlar |
|---|---|---|---|
| `uyku_dustu` | spi | `ort7`, `ort28` (saat) | `ort7` ≤ `ort28` − 0,75 ya da `ort7` < 6 |
| `sinav_yaklasti` | ays | `kalan_gun` (gün) | `kalan_gun` 30, 14, 7, 3 ya da 1 |
| `plan_kacti` | ays, spi, esp | `gecikme_dk` (dk); `konu` önerilir | `gecikme_dk` ≥ 30 |
| `tekrar_gunu` | ays, esp | `adet` (kart ya da konu) | `adet` ≥ 1 |

Katalogda olmayan `tur` reddedilmez: kaydedilir, karar `kural_yok` olur (kural
sonra yazılır). Yeni tür isteyen modül önce bu tabloya satır ekletir.

## Karar (HKM'nin işi, modül bilmez)

`basla` (King mesajı bekleyenlere düştü) · `bekliyor` (sessiz saat; bitince yeniden
bakılır) · `butce` (bugünkü bölme bütçesi dolu) · `tekrar` (aynı modül ve tür son
20 saatte konuştu) · `esik_alti` · `eksik_veri` · `kural_yok` · `bayat` (18 saatten
eski).

- **Bölme bütçesi:** günde en çok 3 kendiliğinden mesaj (`config.json` →
  `king.kendiliginden_butce`, 0 = kapalı). Aynı anda birden çok olay varsa önce
  öncelikli olan: `sinav_yaklasti` > `uyku_dustu` > `plan_kacti` = `tekrar_gunu`.
- **Sessiz saat:** bildirim ayarındaki sessiz saat (`bildirim.sessiz_bas/bit`);
  ayar boşsa 23:00–08:00.
- **Mesaj:** `king_bekleyen` satırı (`tur = "kendiliginden"`); modül King'i açınca
  bugünkü yoldan alır (`GET /api/king/bekleyen`). Satırda `neden` alanı vardır:
  `{olay, kural, sayilar, cumle}`; «neden şimdi?» satırı budur
  (ör. «spi.uyku_dustu · 7 günlük ortalama 5,9 saat (ölçüldü), 28 günlük 7,1 saat (hesaplandı)»).
- Bekleyenler ve son kararlar: `GET /api/king/kendiliginden`.
