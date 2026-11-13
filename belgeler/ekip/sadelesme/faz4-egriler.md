# Faz 4 · Eğriler (A9, 13 eğri) — rapor

Tarih: 13 Kasım 2026, kod `00788b3a` (sadelesme). Önceki rapor: `faz4-olcum.md` (29 statik ölçüt, bütçeler).

```
python kalite/olcum.py --md                 # eğriler dahil tablo; ölçülmeyenler komutuyla, vekil yanında
python kalite/egri/_sinav.py                # King sınavı → kalite/veri/sinav-sonuc.json (≈10 sn, Anlama/Kontrol vekili)
python kalite/egri/optimizasyon.py --acilis # üç modülün açılışı → kalite/veri/acilis.json (≈90 sn)
python kalite/olcum_test.py
```

## Özet

- On üç eğrinin her biri artık bir dosya: `kalite/egri/<ad>.py`. `olcum.py` onları kendisi bulur; yeni eğri
  yeni dosyadır, `olcum.py`'ye dokunmak gerekmez.
- **Ölçülen 2:** Sistem · Optimizasyon **25 785 541 bayt** dağıtılan kod (`ölçüldü`; açılış süresi ayrıntıda,
  `ölçüldü`) ve Sistem · Anlaşılabilirlik **3,0 adım** yer başına ortalama (`hesaplandı`).
- **Vekilli 2:** Anlama ve Kontrol'ün değeri `null`, durum `ölçülmedi`. Yanlarında `tahmin` etiketli vekil var:
  «vekil: sınav cümleleri» **0,989** (346/350) ve «vekil: sınav, araç seçimi» **0,987** (305/309). Bunlar bugünkü
  King'in hazır cümlelerdeki üst sınırıdır, eğri değildir.
- **Ölçülemeyen 9:** Tanıma, Öğretme, Üretim, Arama, Kendini eğitme, Tekrar, Sağlayıcı kalitesi, Hafıza, Hayata
  etki. Değerleri `null`, her birinde ne gerektiği ve hangi komutla ölçüleceği yazılı.
- Anlama'nın gerçek seti `kalite/veri/anlama.jsonl` boş geldi, biçimi `kalite/veri/README.md`'de.
- Testler 43/43 (30'u eski, 13'ü yeni). `--denetle` kaydetmeden önce de sonra da temiz (26 bütçe, aşım yok).
  `kalite/kayit/2026-11-13.json` yeniden yazıldı; iki kaydetme bayt bayt aynı, mutlak yol yok.

## Eğri dosya düzeni

- **Eğri eklemek dosya eklemektir.** `kalite/egri/<ad>.py`: `AD`, `TANIM` ve
  `olc(kok) -> {deger, birim, etiket, durum, ayrinti, komut}`. Kimlik `egri_<ad>`; on üç dosyanın adları
  eski kimliklerin aynısı (`egri_tanima` … `egri_hayata_etki`), kayıtlar arası süreklilik bozulmadı.
- `olcum.py` sabit `EGRILER` listesini bıraktı; `egriler()` `kalite/egri/[!_]*.py`'yi sırayla yükler.
  Alt çizgili dosya (`_sinav.py`) yardımcıdır, eğri sayılmaz.
- **Sözleşme `olcum.py`'de denetlenir:** değer yoksa durum `ölçülmedi` ve etiket `veri yok`; değer varsa etiket
  `veri yok` olamaz; eğrinin bildirdiği durum değerle çelişemez. Bozuk ya da sözleşmeyi bozan eğri ölçümün
  tamamını düşürmez: o eğri değersiz kalır, `ayrinti.hata` hatayı yazar.
- **Vekil eğrinin değeri olmaz.** Vekil ölçüm `ayrinti.vekil` içinde, `tahmin` etiketli ve adı «vekil: …» ile
  durur; eğrinin `deger`'i `null` kalır. `--md` vekili ölçülmeyenler listesinde «(tahmin, eğri değil)» diye gösterir.
- `olcum.py` hâlâ tarayıcı açmaz (bir koşu ≈8 sn). Tarayıcı isteyen ölçüm kendi komutuyla `kalite/veri/`'ye yazar,
  eğri oradan okur; yazılan dosyada ölçüm günü ve kod (commit) durur. Eğriler bütçe değildir: `butce.json`'a
  girmediler, `--denetle` onları denetlemez (plan eğrilere henüz hedef koymadı).

## Ölçülenler

| Eğri | Değer | Etiket | Nasıl |
|---|---|---|---|
| Sistem · Optimizasyon | **25 785 541 bayt** | ölçüldü | uygulama başına kullanıcıya giden kod: modül `dist/` üst düzey `.html/.js/.css`; kabuk `index.html` + bağladığı `.js/.css`. Yazı tipi ve görsel yok |
| Sistem · Anlaşılabilirlik | **3,0 adım** (yer başına ortalama) | hesaplandı | `kabuk/harita.js` `halkaAdimi` (Node ile, kabuğun kendi kuralı) + yer eski modüldeyse o modülün iç içe katı (`olcum.py` `ic_icelik`) |

**Optimizasyon ayrıntısı** (13 Kasım, `00788b3a`):

| Uygulama | Dosya | Bayt | Satır | Açılış (ilk çizim, 3 koşunun ortancası) | Betik |
|---|---|---|---|---|---|
| AYS (`rota.html` + `sw.js`) | 2 | 9 700 284 | 153 185 | 1 151,7 ms | 310,9 ms |
| SPİ | 2 | 7 734 671 | 128 306 | 799,5 ms | 242,1 ms |
| ESP | 2 | 8 155 639 | 128 054 | 957,8 ms | 284,6 ms |
| Kabuk (motor/ dahil) | 10 | 194 947 | 2 283 | veri yok | — |
| ↳ motor/ (yol, not, tekrar) | 3 | 65 698 | 1 009 | | |

- Açılış: var olan `tools/olcum_modul.js`, kendi test portlarında (4571, 4572, 4573; sahibinin 4173-4200 portları
  ve 4391 kullanılmadı), başsız Chromium. Her koşu yeni bağlamla açılıyor, yani tarayıcı verisi boş. Ölçü,
  sayfaya gidişten `.site` görünene kadar geçen süre; üç koşunun ortancası alındı. Sonuç `kalite/veri/acilis.json`'a
  yazıldı (tarih ve kod içinde).
- Oynaklık: aynı gün ayrı bir AYS koşusu 1 046,6 ms verdi. Yani iki ölçüm arasındaki ≈%10'luk fark gürültü olabilir.
- Kare süresi `veri yok`. `tools/akicilik.js` süre değil, stil hesabı sayısı veriyor.
- Kabuk açılışı `veri yok`. `olcum_modul.js` yalnız AYS/SPİ/ESP ölçüyor (Açık soru 3).

**Anlaşılabilirlik ayrıntısı:** haritada 24 yer var. Kabuk kuralıyla ortalama 1,75 adım, en çok 2 (halkada 6 yer
1 adımda, gerisi 2'de). 9 yer hâlâ eski modülde açılıyor ve o modülün katı ekleniyor (AYS +2, SPİ +3, ESP +4).
Bu yüzden en çok **6 adım**: Dil, Tarih, Müzik ve Okuma, dördü de ESP'de. Felsefe pilot durumda ve dersleri
kabukta olduğu için 2 adım sayıldı. Komut çubuğu her yere 1 adımda götürür; bu bir kural, `kabuk.test.js`
sınıyor, araç saymıyor. Eğri düştükçe iyidir: bir alan taşınınca ortalama düşer (ör. Dil'de 6 → 2). Eski
modül katı en derin yolun üst sınırıdır, tıklama sayımı değildir.

## Vekil ölçümler

İkisi de aynı koşudan geliyor: `python kalite/egri/_sinav.py` var olan `tools/king_sinav.js --port=4571 --json`'ı
koşturuyor (AYS 4571, SPİ 4581, ESP 4591; ≈9 sn). Sınav modeli ve HKM'yi çağırmıyor, Merkez çağrısını
yakalıyor, aracı seçiyor ama çalıştırmıyor, boş tarayıcı verisiyle açılıyor. 358 cümlenin kararı
`kalite/veri/sinav-sonuc.json`'da satır satır duruyor (13 Kasım, `00788b3a`). Sınavın tam karar puanı **353/358**.

| Vekil | Değer | Etiket | Sayım |
|---|---|---|---|
| Anlama · «vekil: sınav cümleleri» | **0,989** (346/350) | tahmin | King'in kararı beklenen kararla aynı niyete düşüyor mu; 8 cümle dışarıda: beklenen kararlar iki niyete (`merkez` + `tur:ders` gibi) ya da belirsize düşüyor |
| Kontrol · «vekil: sınav, araç seçimi» | **0,987** (305/309) | tahmin | görev cümlesi (beklenen her karar kayıt/öğren/yönet) içinde tam doğru karar (argüman yalnız `a` alanlı 9 cümlede denetlenir) |

Anlama niyet başına: kayıt 82/82, öğren 3/3, sohbet 40/41, yönet 221/224, **araştır 0 cümle** (sınavda yok).
Dört ıska var: «bugün yorgunum, çalışma süresini kısalt» (yönet beklenirken sohbet), «bayram günleri için mola
tanımla» (King geri sordu), «gece geç saatte yemek yemek uykuyu bozar mı» (sohbet beklenirken uyku aracı),
«King'in konuşma hızını ayarla» (yönet beklenirken Merkez).

**Karar → niyet eşlemesi** (`kalite/egri/_sinav.py` `ESLEME`; ilk eşleşen kazanır). Bu eşleme benim, sahibinin
etiketi değil:

| Niyet | Karar |
|---|---|
| sohbet | `merkez`; `tur:olumsuz-gun`, `tur:yorgun`, `tur:nefes`, `tur:tanisma-kapali` |
| kayit | `veri`; `arac:kayit_gir`, `…_ekle`, `…_yaz`, `…_bitir`, `spi_barkod_ogun`, `ays_card_from_error` |
| ogren | `arac:soru_sor`, `…_tekrarlarim`, `…_yanlis_teshis`; `tur:ders` |
| belirsiz (sayılmaz; King'in kararıysa ıska) | `tur:sor`, `tur:ara-sor`, `tur:hatirlat-sor`, `tur:hafiza`, `tur:yok`, `tur:hata` |
| yonet | geri kalan `git:…`, `ayar`, `arac:…`, `tur:…` (sayfa, ayar, kendi verisini sorma, yerel komut) |

**Neden eğri değil:** cümleler sahibinin gerçek mesajları değil; bugünkü King'e göre yazılmış hazır cümleler ve
King de bu cümlelere göre ayarlandı (KING-5 notları). Plan da bunu söylüyor («kökte üç neden»): sınav niyeti anlamayı değil,
araç kapsamını ölçüyor. Sahibinin kötü deneyimi ile 0,989 arasındaki fark, gerçek setin neden gerektiğini gösteriyor.
Kontrol tarafında görevin bittiği denetlenmiyor, yalnız doğru seçim denetleniyor.

## Ölçülemeyenler ve gereken

Hepsinde `deger: null`, `durum: ölçülmedi`, `etiket: veri yok`. Gereken ve komut kayıtta da duruyor.

| Eğri | Gereken | Komut |
|---|---|---|
| Anlama (gerçek) | sahibinin etiketlediği gerçek mesajlar, her satırda King'in o an seçtiği niyet (`king`); örneklem yalnız işaretlenenlerden olmamalı | `kalite/veri/anlama.jsonl` dolunca `python kalite/olcum.py` |
| Kontrol (gerçek) | çalışan King (tarayıcı + HKM + model) ve görev sonunda verinin doğru yazıldığının denetimi | `python tools/king_bench/bench.py --paket kayit,plan,gun` |
| Tanıma | sahibinin doğruladığı kişi bilgisi yoklama seti ve çalışan King; Bench'in hafıza paketi 233 günlük klonla koşuyor, sahibinin kendisiyle değil | `bench.py --paket hafiza`; `python tools/king_bench/bilinc_bench.py` |
| Öğretme | ön test → ders → son test düzeneği (yok) ve dersi anlatan model; gerçek ölçüm için sahibinin cevapları | `bench.py --paket ogretmen,ogrenme`; düzenek yapılacak |
| Üretim | üretilen soru/kart örneklemi + cevap anahtarı + sahibinin hakem puanı; üretim için model | yapılacak: `kalite/veri/uretim.jsonl` ve puanlayan dosya |
| Arama | gerçek sorgu seti, doğru cevap ve kaynak etiketi; tek Arama motoru (A7) | yapılacak |
| Kendini eğitme | hata kaydı ve ders defteri (hata → kural → onay → havuz); ikisi de yok | yapılacak: A7 ders defteri |
| Tekrar | hata kimliği ve sayacı (yok), ders defteri, ardışık iki Bench sonucu | `python tools/king_bench/oz.py <sonuç> <önceki>` |
| Sağlayıcı kalitesi | gerçek sağlayıcıya giden istekler ve boşa çağrı sayacı (yok); `king_olcum.py --kuru` sahte taşıyıcıyla koşuyor, gerçek jeton vermiyor | `python tools/king_olcum.py sohbet --config <ayar>` |
| Hafıza | HKM hafızası ve gömme modeli (Ollama) çalışırken arama doğruluğu; bağlam boyutu ekseni yok | `python tools/hafiza_olcum.py` |
| Sistem · Hayata etki | göçten sonra tek veride sahibinin gerçek kullanımı (Yol motorunda tamamlanan adım, gün); bu araç sahibinin verisini okumuyor | yapılacak: tek depodan haftalık özet |

## Testler

`python kalite/olcum_test.py` → **43/43 geçti** (çıkış 0). Eski 30 test aynen geçiyor; sahte depoda 13 eğrinin 13'ü
hâlâ `ölçülmedi`, çünkü orada dist, kabuk ya da sınav önbelleği yok. Yeni 13 test:

| Grup | Ne kanıtlar |
|---|---|
| Keşif (3) | gerçek `kalite/egri/` 13 dosya verir ve kimlikler eski kayıttakilerin aynısı; geçici klasöre konan yeni dosya eğri olur, alt çizgili dosya olmaz; değer, birim ve durum kayda geçer |
| Değersiz eğri sayı almaz (1) | hata atan, değer yokken «ölçüldü» diyen ve sayıya «veri yok» yazan üç eğri de değersiz kalır, `ölçülmedi` olur ve hatası yazılır |
| Vekil (6) | Anlama ve Kontrol'ün değeri `null`; vekil `tahmin` etiketli, adı «vekil: …», günü ve kodu yazılı; Anlama niyet düzeyinde sayıyor (araç yanlış, niyet doğru = isabet; iki niyetli cümle dışarıda); Kontrol yalnız görev cümlelerinde tam kararı sayıyor; bozuk set satırı ayrı sayılıyor; `--md` vekili «eğri değil» diye yazıyor |
| Gerçek set (1) | `anlama.jsonl`'da `king` alanı varsa eğri `ölçüldü` oluyor, vekil yine ayrı kalıyor |
| Optimizasyon (1) | dist kodu + kabuğun bağladıkları (motor dahil) sayılıyor, yazı tipi sayılmıyor; açılış önbelleği yoksa `veri yok` |
| Anlaşılabilirlik (1, Node varsa) | kabuk adımına eski modülün katı ekleniyor; halkadan ulaşılmayan yer ayrı tutuluyor |

Gerçek depoda: `--denetle` kaydetmeden önce çıkış 0 verdi. Ardından iki kez `--kaydet` koştu, ikisi bayt bayt aynı;
sonra `--denetle` yine 0 (26 bütçe, aşım yok). Kayıtta değişen yalnız üç değer var: `egri_optimizasyon`
`null` → 25 785 541, `egri_anlasilabilirlik` `null` → 3,0 ve `kod_hacmi` 553 521 → 554 717 (izlenir; Açık soru 6).
`olcum.py` koşusu hâlâ ≈8 sn sürüyor ve tarayıcı açmıyor; Anlaşılabilirlik için tek bir `node -e` çağrısı yapıyor.

## Açık sorular

1. **Anlama setinin örneklemi.** Plan «yanlış anladın» ile işaretlenen mesajları sete alıyor. Set yalnız
   bunlardan oluşursa isabet hep 0 çıkar. İşaretlenmeyen mesajlardan da örnek gerekir (ör. haftada rastgele 20
   mesaj sahibine etiketletilir). Hangisi seçilsin?
2. **Karar → niyet eşlemesini sahibi onaylamalı.** Kendi verisini sormak («dün ne yedim») «yönet» mi? «Bunu aklında
   tut» (`tur:hafiza`) kayıt mı? Eşleme vekili değiştirir, gerçek eğriyi değiştirmez.
3. **Optimizasyonun başlık değeri** bayt seçildi, çünkü belirlenimci ve her koşuda ölçülüyor. Açılış ayrıntıda
   duruyor. Kabuğun açılışı hiç ölçülmüyor; `kalite/egri/` içine küçük bir Playwright ölçümü yazılabilir. İstenir mi?
4. **Açılış `src/`'den ölçülüyor**, kullanıcıya giden tek dosyalık dist'ten (7-10 MB) değil. Tarayıcı verisi de boş;
   sahibinin gerçek verisiyle açılış daha yavaş olabilir. Var olan aracın yöntemi aynen kullanıldı.
5. **Eğrilerin tabanı ve hedefi.** Plan «taban Faz 4'te, hedef ondan sonra» diyor. 13 Kasım değerleri taban sayılsın
   mı? Faz 2 kapısındaki «anlaşılabilirlik tabandan iyi» için taban 3,0 adım olur. Hedef konmadı, uydurulmadı.
6. **Kayıt, takımın yarım işini görüyor.** `kod_hacmi` depoya alınmamış `king/` (≈700 satır, takım arkadaşının
   işi) dahil her dosyayı sayıyor. Ölçüt `izlenir`, bütçe değil; ama kaydedildiği günün yarım işini taşıyor
   (faz4-olcum açık soru 8 ile aynı konu).
7. **Önbellek dosyaları depoya girsin mi?** `sinav-sonuc.json` (360 satır) ve `acilis.json` girerse kayıt belirlenimci
   kalır, ama dosyalar eskiyebilir (tarih ve kod içlerinde yazılı). CI onları yenilemiyor; yenilemek tarayıcı ister.
8. `faz4-olcum.md`'deki «Ölçülemeyenler» tablosu artık eski (Optimizasyon ve Anlaşılabilirlik ölçülüyor). Dosya bu
   görevin kapsamı dışında kaldığı için güncellenmedi.
