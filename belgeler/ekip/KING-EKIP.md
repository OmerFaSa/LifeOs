# King'in ekibi ve çok adımlı görevler (King 3.0 · K1)

King ağır bir işi arka planda bir **alt ajana** verir; kullanıcı konuşmaya
devam eder, ekranda «King şu an 2 iş yapıyor» görünür. Kod: `HKM/core/ekip.py`
(ajanlar, devir), `HKM/core/is_kuyrugu.py` (kalıcı iş kuyruğu),
`HKM/core/gorev.py` (görev, sohbet yolu, uçlar). Test: `HKM/tests/test_ekip.py`.

## Ekip

| id | Ad | Modül | Rol (model) | Veri |
|---|---|---|---|---|
| `akademik` | Akademik | AYS | `vp_academic` | AYS'nin kural motoru özeti, AYS hedefleri, AYS'ye izinli hafıza |
| `beden` | Beden | SPİ | `vp_bio` | SPİ'nin aynısı |
| `zihin` | Zihin | ESP | `vp_intellect` | ESP'nin aynısı |
| `arastirmaci` | Araştırmacı | BAM | `bam.arastirma` | web ve YouTube (`core/arastir.py`) |

- Devri **kod** yapar (`ekip.sec`: kelime kuralı). Kural karar veremezse King'in
  modeli kapalı listeden **yalnız seçer**; listede olmayan ad yok sayılır, sonra
  kullanıcıya sorulur.
- Model yoksa ajan susmaz: rapor kural motorunun satırlarıdır (`dayanak: "kural"`).
- Ajan hiçbir modüle yazmaz.

## İş kuyruğu (`king_isler`)

Durum: `bekliyor → calisiyor → bitti | hata | iptal`. Aynı anda en çok **bir**
iş çalışır (tek işçi + `MODEL_KILIDI`; 6 GB VRAM). HKM kapanırsa çalışan iş
açılışta yeniden sıraya girer; ikinci kez yarıda kalan `hata` olur.

```json
{"id": 7, "ajan": "zihin", "tur": "devir|gorev_adim", "baslik": "B1 · Dinleme",
 "durum": "calisiyor", "durum_ad": "Çalışıyor", "ilerleme": 40, "adim": "Rapor yazıyor",
 "sonuc": {"ajan": "zihin", "ad": "Zihin", "ozet": "…", "dayanak": "model|kural|kaynak|yok",
           "kaynaklar": [{"baslik": "…", "url": "https://…", "tur": "…"}],
           "etiket": "öneri (doğrulanmadı)|null", "saniye": 6.2, "note": null},
 "hata": null, "gorev_id": 3, "adim_no": 5, "iptal_istendi": false,
 "created_at": "…", "started_at": "…", "finished_at": null}
```

Ekran satırı (`durum`): `{"acik": 2, "calisiyor": 1, "bekliyor": 1, "bitti": 4,
"hata": 0, "iptal": 0, "metin": "King şu an 2 iş yapıyor (1 çalışıyor, 1 sırada)",
"simdi": <çalışan iş|null>}`. Boşken `metin` = «King şu an boşta».

## Görev (`king_gorevler`)

«Bu hafta B1'e hazırla beni» → hedef `B1`, süre `bu hafta` (bugün dahil pazara
kadar; pazar günü 7 gün), sahip `zihin`. İskeleti kod kurar:

1. ilk gün: Durum analizi (alan ajanı) · Kaynak araştırması (Araştırmacı) · Plan önerisi (alan ajanı)
2. her gün: Çalışma (alan ajanı) — başlığı plan adımında **model önerir**, kod denetler
3. son gün: Değerlendirme (alan ajanı)

Kurallar: süre ya da hedef yoksa sorulur; en çok 28 gün. Görev `taslak` doğar,
**onaysız başlamaz**. Günlük dakika uydurulmaz: mesajda («günde 1 saat») ya da
modülün etkin hedefinde yoksa `null` kalır. Plan adımı bitince her çalışma günü
için modülün niyet kuyruğuna `plan.add` **teklifi** gider (yalnız AYS ve ESP;
SPİ'de günlük plan yok); modül gösterir, kullanıcı onaylarsa modül yazar.

Görev panosu (`pano`):

```json
{"id": 3, "hedef": "B1", "modul": "esp", "modul_ad": "ESP", "ajan": "zihin", "ajan_ad": "Zihin",
 "baslangic": "2026-10-21", "bitis": "2026-10-25", "gun_sayisi": 5,
 "gunluk_dk": 60, "dk_kaynak": "mesaj|hedef|null",
 "durum": "taslak|suruyor|bitti|iptal", "durum_ad": "Sürüyor",
 "ilerleme": {"bitti": 4, "kapali": 4, "toplam": 9, "yuzde": 44},
 "metin": "B1: 4/9 adım bitti", "teklif_sayisi": 5,
 "gunler": [{"gun": "2026-10-21", "gun_ad": "Çar 21 Eki", "adimlar": [1, 2, 3, 4]}],
 "adimlar": [{"no": 4, "tur": "analiz|arastirma|plan|calisma|degerlendirme", "baslik": "Kelime listesi",
              "baslik_kaynak": "kod|model", "ajan": "zihin", "ajan_ad": "Zihin", "gun": "2026-10-21",
              "gun_ad": "Çar 21 Eki", "durum": "bekliyor|sirada|calisiyor|bitti|hata|iptal",
              "durum_ad": "Bitti", "ilerleme": 100, "simdi": null, "is_id": 12,
              "rapor": {"ozet": "…", "dayanak": "model", "kaynaklar": [], "etiket": null, "note": null},
              "teklifler": [41]}]}
```

`gunler[].adimlar` adım numaralarıdır (`adimlar[no-1]`).

## Uçlar (Bearer gerekli)

| Yöntem | Yol | Gövde | Döner |
|---|---|---|---|
| GET | `/api/king/ekip` | | `{ajanlar:[{id,ad,is,modul,rol,model,hazir,not}], durum}` |
| GET | `/api/king/isler?durum=acik\|bekliyor\|…&limit=30` | | `{isler, durum}` |
| GET | `/api/king/is/<id>` | | `{is}` |
| POST | `/api/king/is` | `{istek, ajan?}` | 201 `{ok, is, secim:"kural\|model\|verildi"}`; seçilemezse 422 `{soru}` |
| POST | `/api/king/is/<id>/iptal` | | `{ok, is}`; kapanmışsa 409 |
| GET | `/api/king/gorevler?durum=` | | `{gorevler:[pano], durum}` |
| GET | `/api/king/gorev/<id>` | | `{gorev: pano}` |
| POST | `/api/king/gorev` | `{metin}` ya da `{hedef, gun, ajan?, gunluk_dk?}` | 201 `{ok, gorev}`; eksikse 422 `{soru}` |
| POST | `/api/king/gorev/<id>/onayla` | | `{ok, gorev}` (taslak → sürüyor) |
| POST | `/api/king/gorev/<id>/iptal` | | `{ok, gorev}` |
| POST | `/api/king/gorev/<id>/sure` | `{gunluk_dk}` | `{ok, gorev}`; plan bittiyse teklifler o an gider |

## Sohbet (`/api/chat`, King)

Kural yolu (`gorev.sohbet_cevabi`), cevap `mode: "ekip"`, `command: "gorev"`:

- «Bu hafta B1'e hazırla beni», «2 hafta içinde YDS'ye hazırlanmak istiyorum, günde 1 saat» → taslak + günlük özet
- «görevi başlat» / «görevi iptal et» → son açık görev
- «ekip ne yapıyor», «işler ne durumda» → ekran satırı + şu anki iş
- «arka planda … bak/araştır/hazırla», «ekibe ver: …» → devir; rapor bitince sohbet akışına King'in sözü olarak düşer («Zihin ajanın raporu (iş #7): …»)

## İstemci için kalan (brand/ortak/king.js — bu oturum dokunmadı)

1. Rozet: `GET /api/king/isler?durum=acik` ile `durum.metin` («King şu an 2 iş yapıyor»); açık iş varken ~5 sn'de bir, yokken seyrek sorulur. Tıklanınca iş listesi (başlık, ajan, ilerleme çubuğu, İptal).
2. Görev panosu: `GET /api/king/gorevler` → gün gün adımlar (AGENTS §10: ilerleme ince halka/çubuk, adım durumu nokta), taslakta «Başlat» düğmesi (`POST …/onayla`), sürüyorken «İptal».
3. `mode: "ekip"` cevabından sonra ve açık iş bitince sohbet akışını yenilemek (rapor akışa sunucuda yazılır).
