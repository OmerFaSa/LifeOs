# King'in becerileri ve sözleri (King 3.0 · K2)

Kullanıcı King'e konuşarak **beceri** öğretir; sohbette söylediği gelecek
planları **söz** olur ve zamanı gelince King sorar. Kod: `HKM/core/beceri.py`
(beceri, sohbet yolu, uçlar), `HKM/core/soz.py` (söz), `HKM/core/bekleyen.py`
(King'in modüle bekleyen mesajı, cevap), `HKM/core/tarihsoz.py` (Türkçe zaman
ifadeleri). Test: `HKM/tests/test_beceri.py`.

Kurallar: tarihi, tetiği ve eylemi **kod** çıkarır; kod çıkaramazsa model
yalnız bir JSON önerir ve aynı doğrulamadan geçer (cümlede olmayan sayıyı
yazamaz). HKM hiçbir modüle yazmaz: yazan eylem modülde **onay kartıyla**
çalışır. Her beceri ve söz listelenir, kapatılır, silinir.

## Beceri (`king_beceriler`)

```json
{"id": 3, "ad": "Her pazartesi 09:00 · deneme", "acik": true, "modul": "ays",
 "kanal": "local", "hedef": null, "kaynak": "her pazartesi bana deneme hatırlat, akşam sonucunu sor",
 "tetik": {"tur": "zaman", "gunler": [0], "saat": "09:00"},
 "eylemler": [{"tur": "mesaj", "metin": "Hatırlatma: deneme."},
              {"tur": "soru", "metin": "Deneme nasıl geçti?", "saat": "20:00"}],
 "ozet": "Her pazartesi 09:00 → «Hatırlatma: deneme.»; 20:00 → «Deneme nasıl geçti?»",
 "calisma": 2, "son_calisma": "2026-10-19T20:00:30", "son": {"0": "2026-10-19", "1": "2026-10-19"},
 "created_at": "…", "updated_at": "…"}
```

**Tetik**
- `{"tur": "zaman", "gunler": [0-6], "saat": "SS:DD"}` — 0 pazartesi … 6 pazar;
  boş liste her gün. Saat söylenmezse `09:00` (cevap bunu söyler).
- `{"tur": "soz", "kalip": "ders bitti"}` — kalıp kısa bir mesajın içinde
  geçince (kalıp + en çok 25 harf) çalışır.

**Eylemler** (en çok 6; zaman tetiğinde eylemin kendi `saat`i olabilir)

| tur | alanlar | istemci ne yapar |
|---|---|---|
| `mesaj` | `metin` | King söyler (metin zaten cevapta/akışta) |
| `soru` | `metin` | King sorar; kullanıcının sonraki mesajı cevap sayılır |
| `sayac` | `dakika` (1-180), `ad` («Mola», «Sayaç») | modülün odak/mola sayacını açar |
| `kayit` | `modul`, `metin`, `alan` (`"sure"`\|null) | modülün **kendi ayrıştırıcısıyla** önizler, **onay kartı**; `alan:"sure"` ise süreyi son biten odak sayacından doldurur, yoksa sorar (HKM süre uydurmaz) |
| `arac` | `ad`, `param`, `yaz` | araç kataloğundan (`brand/ortak/arac.js`) çalıştırır; `yaz:true` → her zaman **onay kartı**; katalog öğretme anında yoksa `yaz:true` sayılır |

Sohbette öğretme (King, `/api/chat`):
- «her pazartesi bana deneme hatırlat, akşam sonucunu sor»
- «'ders bitti' deyince süreyi AYS'ye yaz ve 5 dakikalık mola sayacı aç»
- «bundan sonra her gün saat 7:30'da bana 'su iç' de», «… bunu öğren»
- Komutlar: «becerilerim», «beceri 3 kapat|aç|sil», «son beceriyi sil».

Cevap: `{"mode": "beceri", "command": "ogren|beceri|soz|cevap", "text", "beceri"?,
"beceriler"?, "eylemler"?, "dayanak": "kural|model"}`. Söz tetiği çalışınca
`command: "beceri"` ve **`eylemler`** gelir: istemci `sayac`, `kayit`, `arac`
eylemlerini sırayla çalıştırır (`mesaj`/`soru` zaten `text`'te).

## Söz (`king_sozler`)

```json
{"id": 5, "metin": "yarın fizik sınavım var", "soru": "Fizik sınavın nasıl geçti?",
 "vade": "2026-10-22T20:00:00", "vade_metin": "yarın 20:00", "gun": "2026-10-22", "son": false,
 "modul": "ays", "kanal": "local", "hedef": null,
 "durum": "bekliyor|soruldu|kapandi|iptal", "durum_ad": "Zamanı bekleniyor",
 "cevap": null, "created_at": "…", "soruldu_at": null, "kapandi_at": null, "updated_at": "…"}
```

- Yakalama: zaman ifadesi (yarın, öbür gün, cuma, haftaya salı, hafta sonu,
  bu hafta, 3 gün sonra, 25 ekim, ayın 15'i, saat 15:00, akşam) **ve** birinci
  kişi gelecek (bitireceğim, gideceğim, yapmam lazım) ya da sahiplikli olay
  («sınavım var», «randevum var»). Soru cümlesi, geçmiş («dün») ve tekrar eden
  plan («her pazartesi», o bir beceridir) söz değildir.
- Vade: olay saatliyse 2 saat sonra (23:00'ü geçerse ertesi gün 10:00),
  saatsizse olay günü 20:00; geçmişteyse bir saat sonra.
- Model söz kurmaz (bu turda hiç kullanılmıyor).
- King'in cevabına not eklenir ve `soz` alanı gelir:
  `"k2_not": "Söz aldım: yarın 20:00 soracağım («Fizik sınavın nasıl geçti?»). İstemezsen «bunu söz yapma» de."`
- Komutlar: «bunu söz yapma» (bu kanaldaki son açık sözü siler), «sözlerim»,
  «söz 5 sil».

## King'in bekleyen mesajı (`king_bekleyen`)

Saati gelen beceri ve vadesi gelen söz buraya düşer; aynı metin King'in
konuşma akışına (`conversations`) da yazılır. Beceri ya da söz Telegram/WhatsApp
sohbetinden geldiyse giden kutusuna girer (sessiz saat ve günlük sınır
`core/bildirim.py`'de).

```json
{"id": 12, "modul": "ays", "kanal": "local", "tur": "beceri|soz", "kaynak_id": 3,
 "metin": "Deneme nasıl geçti?", "soru": true,
 "eylemler": [{"tur": "soru", "metin": "Deneme nasıl geçti?"}],
 "created_at": "…", "alindi_at": "…", "cevap": null, "cevap_at": null}
```

- `GET /api/king/bekleyen?modul=ays` → `{"mesajlar": [...]}`: o modülün ve
  modülsüz mesajlar; **alınan bir daha gelmez** (kutu gibi). `modul=hkm` HKM
  yüzü içindir.
- Cevap: soru alındıktan sonraki 12 saatte, aynı kanaldan gelen ilk soru
  olmayan King mesajı cevap sayılır (komut, teklif, kayıt mesajları sayılmaz).
  Cevapta `cevap` alanı ve `k2_not` gelir. Söz kapanır. Cevapta **sayı varsa**
  ham cümle modülün kutusuna (`/api/kutu`, `core/kutu.py`) bırakılır ve
  `cevap.kutuya: "ays"` döner: istemci kutuyu hemen sunmalı (modülün
  ayrıştırıcısı önizler, onaylanırsa modül yazar).
- «o cevap değil» ya da `POST /api/king/bekleyen/<id>/geri`: cevap silinir,
  söz yeniden «soruldu» olur (kutuya bırakılan öneri kendi onayında kalır).

## Uçlar (Bearer)

| Yöntem | Yol | Gövde / sorgu | Dönüş |
|---|---|---|---|
| GET | `/api/king/beceriler` | | `{"beceriler": [...]}` |
| GET | `/api/king/beceriler/<id>` | | `{"beceri"}` / 404 |
| POST | `/api/king/beceriler` | `{"metin", "modul"?}` ya da `{"tetik", "eylemler", "ad"?, "modul"?}` (+ `araclar` katalog) | 201 `{"ok", "beceri", "yinelenen"}` / 422 `{"note"}` |
| POST | `/api/king/beceriler/<id>` | `{"ad"?, "tetik"?, "eylemler"?}` (düzelt) | 200 / 422 / 404 |
| POST | `/api/king/beceriler/<id>/ac\|kapat\|sil` | | 200 / 404 |
| GET | `/api/king/sozler` | `?durum=acik\|bekliyor\|soruldu\|kapandi\|iptal` | `{"sozler": [...]}` |
| POST | `/api/king/sozler` | `{"metin", "modul"?}` (kod çözer) ya da `{"metin", "vade", "soru"?, "modul"?}` | 201 / 422 |
| POST | `/api/king/sozler/<id>` | `{"soru"?, "vade"?}` (düzelt) | 200 / 422 |
| POST | `/api/king/sozler/<id>/sil` | | 200 / 404 |
| GET | `/api/king/bekleyen` | `?modul=ays\|spi\|esp\|hkm` | `{"mesajlar": [...]}` |
| POST | `/api/king/bekleyen/<id>/geri` | | 200 / 404 |

Zamanlama: daemon'un dakikalık ritmi (`_ritim`) `beceri.tik` ve `soz.tik`
çağırır. Eylem günde bir kez çalışır; öğretilmeden önce kalan saat çalışmaz;
HKM kapalıyken kaçan eylem 6 saat içinde çalışır, daha eskisi atlanır.

Yedek: `king_gorevler`, `king_beceriler`, `king_sozler`, `king_bekleyen`
HKM yedeğinde (`db.BACKUP_TABLES`, dışa aktarma ve günlük yedek).

## İstemci için kalan (brand/ortak/king.js)

1. King açılınca ve ~1 dk'da bir `GET /api/king/bekleyen?modul=<modul>`;
   gelen mesajı King balonu olarak göster, `eylemler`'i çalıştır.
2. `mode:"beceri"` cevabında `eylemler`'i çalıştır: `sayac` → odak/mola
   sayacı; `kayit` → modülün ayrıştırıcısı + onay kartı (`alan:"sure"` →
   son odak süresi); `arac` → `arac.js` (`yaz` → onay kartı).
3. `k2_not` ayrı küçük satır olarak (text'te de var); `soz` varsa «Söz yapma»
   düğmesi (`POST /api/king/sozler/<id>/sil`), `cevap` varsa «Cevap değil»
   düğmesi (`POST /api/king/bekleyen/<id>/geri`); `cevap.kutuya` → kutuyu sun.
4. Beceriler ve sözler listesi: aç/kapat, düzelt, sil (uçlar yukarıda).
