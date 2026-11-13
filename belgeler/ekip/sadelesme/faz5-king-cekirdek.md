# Faz 5 · King çekirdeği (A7, sunucu tarafı)

## Özet

King'in sunucu tarafı çekirdeği yazıldı, yalnız stdlib, yalnız yeni dosyalar (`king/mcp.py`'den içe aktarır,
ona dokunmaz):

- `king/niyet.py` — kural tabanlı niyet ayrımı (sohbet/kayıt/öğren/araştır/yönet) ve kayıt ayrıştırıcısı.
  Kayıt cümlesi modele gitmez; sayı yalnız söylendiyse «measured». Anlama eğrisinin ikinci vekili: 0,911 (tahmin).
- `king/baglam.py` — niyet başına veri dilimleri, jeton tahmini, sert bütçe; özel not iki kilitle dışarıda.
- `king/katalog.py` — 12 kapı (Türkçe açıklama, JSON şema) ve istemciden taranan 141 eski aracın her birinin tek
  kapıya ya da arşive eşlemesi (nedeniyle).
- Testler: niyet 73, katalog 58, bağlam 35 satır, hepsi ✓; `king/mcp_test.py` 67 ✓ (bozulmadı).

## Niyet

`king/niyet.py` · `siniflandir(metin) -> {niyet, guven, neden}`; `python king/niyet.py "metin"`.

Kural tabanlı, belirlenimci, modelsiz. Metin `mcp.katla` ile katlanır (İ/I/ı, ç ğ ö ş ü, büyük harf) ve kesme
işareti atılır; desenler katlanmış metinde çalışır. Sıra: (1) kayıt ayrıştırıcı bir öneri çıkarırsa **kayıt**;
(2) sohbet sözü ve duygu («konuşalım», «yorgunum», «merhaba») **sohbet**; (3) araştırma sözü («araştır», «kaynak»,
«besin değeri», «barkodu ne») **araştır**; (4) öğrenme («soru sor», «öğret», «tekrar et») **öğren**; (5) tavsiye
kalıbı («ne yesem», «-meli miyim») ve «neden» soruları **sohbet** (yorum ister, sayıyı değil); (6) yönetim kuralları
(gezinme, ayar, onay, plan, hesap/birim, gelecek, değiştir, kendi verisi) **yönet**; (7) geçmiş kipli soru
(«dün ne yedim») ve veri alanı sözü («uyku ortalamam», «bugünün planı ne») **yönet**; genel nasıl/mı soruları ve
«çözerken» gibi deneyim cümleleri bu son kurala girmez; (8) varsayılan **sohbet** (güven 0,5). `neden` hangi kuralın
hangi sözle tuttuğunu yazar («kural:duygu «yorgunum»»).

Güven kuralın sabitidir (0,5–0,9), olasılık değil: sayılı kayıt 0,9, sayısız kayıt 0,7, veri alanı 0,6.

**Anlama eğrisinin ikinci vekili:** `niyet.vekil(kok)` / `python king/niyet.py --vekil` — `tools/king_sinav.json`
cümlelerinde, beklenen niyet `kalite/egri/_sinav.py` ESLEME'den: **0,911** (319/350, 8 cümle çok niyetli diye
dışarıda; kayıt 74/82, öğren 3/3, sohbet 40/41, yönet 202/224). Etiket «tahmin»: ESLEME eski King'in araç
kararlarından türetildi, sahibinin etiketi değil. Bu turda üç düzeltme vekili 0,731'den 0,911'e çıkardı: istek/buyruk kipi kayıt değildir («25 dakika
matematik çalışalım» odak başlatır), «akşam» artık «-sam» tavsiye eki sayılmıyor, veri alanı kuralı eklendi.

`kalite/egri/anlama.py`'de uzatma noktası yok (vekil tek, `olc` içinde sabit). Kalite'ye dokunmadım; önerilen tek
satır, `olc()` içinde `ayrinti["vekil"] = v` satırının altına:

```python
ayrinti["vekil_kural"] = importlib.import_module("niyet").vekil(kok)  # sys.path'e kok/king eklenerek
```

## Kayıt ayrıştırıcı

`niyet.kayit_ayristir(metin, simdi) -> öneri | None`. Öneri biçimi:
`{tur, gun, alanlar, metin, kaynak:"king-kural", durum:"oneri"}`; sayılı alan `{"v": sayı, "k": "measured"}`.

Türler: `antrenman` (etkinlik, süre dk, mesafe km), `olcum` (uyku/şekerleme saat, kilo kg, su, enerji, kas ağrısı,
nabız, adım), `ogun` (öğün zamanı, içerik olduğu gibi, kalori yalnız söylendiyse), `oturum` (ders/disiplin, süre,
soru, yanlış, net, sayfa, kelime), `kitap` (bitti), beyanlar (`not`, `kart`, `alinti`, `gun` niyet/söz/enerji
veren-çalan/iç hava, `deneme` ders başına doğru/yanlış). Sayılar rakamla ya da sözle («otuz», «yarım saat»,
«iki buçuk»), ondalık virgülle; süre parçaları toplanır («1 saat 20 dakika» = 80). «dün» günü bir geri alır.

Uydurmama sözü: sayı yalnız metinde geçtiyse yazılır ve «measured» olur; söylenmeyen alan hiç yazılmaz (eksik veri
sıfır değildir, AGENTS §1.2). Birim çevirisi (90 dk → 1,5 saat) söylenen sayının aritmetiğidir, ölçülü kalır.
Kayıt sayılmayanlar: soru (eki ya da sözü), gelecek kip («koşacağım»), istek/buyruk («çalışalım», «ekle»).
Öneri yazılmaz; kural motoru (Kayıt motoru, `kaydet` kapısı) doğrular ve yazar, model bu yolda hiç çağrılmaz.

## Bağlam derleyici

`king/baglam.py` · `derle(metin, butce=None) -> {niyet, guven, neden, arac_yolu, araclar, arac_jeton, dilimler,
disarida, jeton, butce}`.

Veri yalnız `king/mcp.py`'nin okuma kapılarından gelir (canlı depo açılmaz, kopyası okunur; sır anahtarı
«gizli»; notlar Not motorunun King süzgecinden geçer). Dilimler: `bugun` (t_bugun), `son_kayitlar` (t_kayit_ara,
10), `notlar` (t_notlar, 5), `yol` (t_yol), `tekrar` (t_tekrar).

| Niyet | Dilimler (önem sırası) | Bütçe (jeton) | Araç |
|---|---|---|---|
| sohbet | bugun | 600 | yok |
| kayıt | yok (model yolu yok) | 0 | yok; öneri kural motoruna |
| öğren | yol, tekrar, notlar | 1500 | 5 kapı |
| araştır | notlar | 1000 | 4 kapı |
| yönet | bugun, son_kayitlar, tekrar | 1500 | 9 kapı |

Jeton tahmini: sıkı JSON uzunluğu / 3 (Türkçede sağlayıcı sayacından cömert, bütçe taşmasın diye). Bütçe serttir
ve veri dilimlerine uygulanır: dilim sığmazsa en uzun listesinin sonundan atılır (`kirpilan` sayısı yazılır), yine
sığmazsa dilim `disarida`'ya nedeniyle girer. Okunamayan dilim (Node yok, depo yok) çökertmez, «okunamadı» diye
dışarıda kalır. Kapı şemalarının jetonu `arac_jeton`'da ayrı yazılır (masa sabittir).

Özel not: Not süzgecinin arkasında ikinci kilit `ozelsiz()` — `ozel: true` işaretli her iç nesne bağlama girmeden
atılır. Testte özel kayıt, özel Bilinç düşüncesi, iç içe özel alan, API anahtarı ve kapı sorusu bağlamda yok;
açık not, açık düşünce, kilo ve kart var (süzgecin boş dönmediği de sınanır).

CLI (`python king/baglam.py "…"`) gerçek deponun kopyasını okur; ben yalnız geçici depoyla çalıştırdım.

## On iki kapı ve katalog

`king/katalog.py` · `python king/katalog.py` (sayım), `--json` (bütün harita).

**Kapılar** (motor): `kaydet` (Kayıt), `kayit_oku` (Kayıt), `plan` (Plan), `tekrar` (Tekrar), `soru` (Soru),
`ogren` (Yol), `not` (Not), `ara` (Arama), `ayar`, `onay`, `sistem` (Kabuk), `dis_dunya`. Her kapının şeması
aynı biçimde: `eylem` (kapının fiilleri + `katalog`), `arac` (geçiş dönemi: ardındaki eski aracın adı),
`param`. Model eski araçları görmez; `eylem: "katalog"` ile kapının ardındakini ister (aşamalı açılım, jeton
tasarrufu). Okuyan fiiller ayrı yazılı; geri kalanı yazar ve kodun doğrulamasından geçer. `king/mcp.py`'nin
sekiz salt okur aracı dört kapının okuma fiillerine bağlı (`kayit_oku` ← kayit_ara/kayit_oku/bugun_ozeti,
`not` ← notlar, `ogren` ← yol_haritasi, `tekrar` ← tekrar_durumu, `sistem` ← sistem_haritasi/olcum).

**Niyet başına masa:** sohbet → hiç kapı; kayıt → hiç (modele gitmez, kural motoru `kaydet`'i çağırır);
öğren → ogren, soru, tekrar, not, kayit_oku; araştır → ara, not, kayit_oku, ogren; yönet → dokuz kapı
(ara, soru, ogren hariç).

**Tarama** (istemci kaydı, kaynaktan; eski modül silinince dosya atlanır): 141 ad = model kataloğu 131
(ortak 32, AYS 38, SPİ 25, ESP 27, öğretme 6, modül yetki eki 3) + kural yolunun yetki kataloğu 10.
King-hkm.md'deki 124'ten fark: ortakta dört Gün aracı (`gun_sen`, `gun_sen_yaz`, `gun_kart_cek`,
`gun_karne`) ve üç `eylem_*` eki o sayımda yoktu.

| Kapı | Eski araç |
|---|---|
| kaydet | 16 |
| kayit_oku | 17 |
| plan | 27 |
| tekrar | 10 |
| soru | 9 |
| ogren | 8 |
| not | 17 |
| ara | 3 |
| ayar | 9 |
| onay | 10 |
| sistem | 5 |
| dis_dunya | 5 |
| **arşiv** | 5 |
| **toplam** | 141 (eşlenmeyen 0, bayat 0) |

**Arşiv kararları** (nedeni haritada): `eylem_toplanti` (ofis ajanları arşivde), `yetki:muzik` (radyo
arşivde), `spi_hane`, `spi_hane_oku`, `ays_profiller` (tek kişi, kural 1; tek profil `ayar`'da).
king-hkm.md önerisinden sapma: `esp_zincir` «neden zinciri» notudur, Plan'a değil Not'a; `ays_deneme` ve
`ays_yanlis` Soru'da; `eylem_inceleme` sistemde (sayfa açar).

## Testler

Hepsi ✓/✕ satırı yazar, çıkış 0 yeşil / 1 kırmızı. Sahibinin verisi hiç okunmaz: bağlam testi geçici hesap deposu
ve geçici içerik klasörü kurar (`LIFEOS_HESAP_DB`, `LIFEOS_VERI_DB`, `LIFEOS_ICERIK`).

| Komut | Sonuç | Ne sınar |
|---|---|---|
| `python king/niyet_test.py` | 73 ✓, 0 ✕ | planın örneği («Bugün 20 dakika yürüdüm» → kayıt, antrenman, 20 dk measured), beş niyetten 22 cümle, katlama, kayıt türlerinden 17 örnek, soru/gelecek/istek kayıt değil, söylenmeyen sayı yazılmaz, sohbet ve kayıt masası araçsız, vekil ≥ 0,85 |
| `python king/katalog_test.py` | 58 ✓, 0 ✕ | ≤ 12 kapı, şemalar (eylem zorunlu, «katalog» eylemi, ek alan yok), mcp.py'nin 8 aracı tam bir kapıda, her eski araç tam bir kez (çift eşleme hata verir), taranan 141'de eşlenmeyen ve bayat 0, tarayıcı geçici kaynakta |
| `python king/baglam_test.py` | 35 ✓, 0 ✕ | kayıt modele gitmez (araç, dilim, jeton 0), sohbet araçsız, niyet başına dilim ve bütçe, 300 ve 5 jetonluk bütçe aşılmaz (kırpma/dışarıda), özel kayıt/özel düşünce/iç içe özel/anahtar/kapı sorusu yok, açık veri var, Node yokken çökmez |
| `python king/mcp_test.py` | 67 ✓, 0 ✕ | (takım arkadaşının; değişmedi, yeşil) |

## Açık konular

1. **Anlama eğrisi:** `kalite/egri/anlama.py`'de uzatma noktası yok; ikinci vekil için tek satır yukarıda
   (Niyet bölümü). Kalite sahibinin uygulaması gerekir.
2. **Vekilin etiketi tahmin:** ESLEME eski King'in araç kararından türedi; kalan 22 yönet→sohbet/öğren/araştır
   karışıklığının bir kısmı tanım farkıdır (kart vadesi burada «öğren», besin değeri «araştır»). Sahibinin
   etiketlediği gerçek set (kalite/veri) dolunca asıl eğri ölçülür; kuralları sınav cümlelerine fazla uydurmadım.
3. **Kural motoru yazımı yok:** `kayit` önerisi üretilir, yazılmaz. Kayıt motoru (`motor/kayit.js`, takım arkadaşı)
   öneri biçimini (`tur`, `alanlar`, `{v, k}`) kabul etmeli ya da eşlemesi tek yerde yazılmalı.
4. **Jeton tahmini kaba:** uzunluk/3. Sağlayıcı katmanı (HKM/core/ai.py) gerçek sayacı dönerse bütçe ona bağlanır.
5. **Kapılar şimdilik şema:** yazan eylemlerin uygulayıcısı yok; MCP ucu bugün yalnız okur (AGENTS §0.1). Model
   eski araç adını `arac` alanıyla geçiş döneminde verebilir; eski modüller silinince bu alan kalkar.
6. **Sağlayıcı katmanı (Claude önce, yerel yedek)** bu pakette yazılmadı; niyet, bağlam ve masa ona girdi olarak hazır.
