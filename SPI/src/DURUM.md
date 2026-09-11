# SPİ — Durum ve öncelik raporu

Tarih: 11 Eylül 2026 · Derleme: `be3a773` · 49 commit

Bu belge **ne kaldığını** söyler. `YOLHARITASI.md` ve `SAGLIK.md` planları
anlatır; bu belge o planların önüne geçen bulguları, yapılanı ve işlerin
hangi sırayla yapılacağını anlatır.

Yazılı raporun tasarlanmış hâli bir Artifact olarak da duruyor.

---

## Yöntem

Hiçbir sayı tahmin değildir. Envanter kaynaktan sayıldı; süreler ve
depolama ayak izi uygulamayı gerçek tarayıcıda koşarak ölçüldü.

---

## 1. Ölçülen gerçekler

Bir önceki raporun en büyük bulgusu yazı tipi bağımlılığıydı: CDN yanıt
vermediğinde ilk çizim **12.931 ms**'ye çıkıyordu. Yazı tipleri gömüldü
(altı alt küme woff2, 92 KB) ve ölçüm tekrarlandı:

| Ölçüm | Önce | Şimdi |
|---|---|---|
| İlk çizim — ağ var | 342 ms | **84 ms** |
| İlk çizim — CDN yanıt vermiyor | **12.931 ms** | **80 ms** |
| Tek dosya (`dist/spi.html`), ağ yok | — | 212 ms |

Ağın olması ile olmaması arasındaki fark artık **4 ms**. «Hiçbir ekran ağı
beklemez» cümlesi ilk kez ölçümle doğru.

| Ölçüm | Sonuç | Yorum |
|---|---|---|
| Ekranlar arası geçiş | ~125 ms | On iki ekranda aynı; hız sorunu yok |
| Bir yıllık gerçekçi veri | 366 KB | Yerel kotanın %7'si |
| Beş yıllık veri (öngörü) | 1,8 MB | **Depolama on yıl sorun değil** |
| Tek dosya dağıtım | 1,04 MB | Bir defa iniyor; yazı tipleri içinde |

Bir yıllık veri = günlük vital + 3 öğün + haftalık antrenman + 3 ayda bir
tahlil.

### Envanter

| Ölçü | Sayı |
|---|---|
| JavaScript modülü | 50 dosya · 17.760 satır |
| CSS | 7 dosya · 4.362 satır |
| Test | 12 dosya · **505 test** |
| Otomatik denetim | 6 koşum (`runtests`, `smoke`, `ledgercheck`, `palettecheck`, `designcheck`, `tasarimcheck`) |

---

## 2. Yol haritasında olmayan üç bulgu — üçü de kapandı

Bunlar «şunu da ekleyelim» maddeleri değildi: ikisi sistemin ürettiği
**yorumu bozuyordu**, biri kendi doktrinini çürütüyordu.

### 2.1 · İlaç ve takviye kaydı hiç yoktu — **kapandı**

Sistem «doz önermez» kuralını doğru uyguluyor ama **ne kullanıldığını da
kaydetmiyordu.** Kişisel taban çizgi motoru «ferritin gerçekten yükseldi»
diyordu — sebebini bilmeden.

On sekiz ilaç/takviye türü, her biri hangi ölçümü hangi yönde bozduğuyla
birlikte (`data/meds.js`) ve bir ters indeks (`MED_AFFECTING`) eklendi.
Kural: **beklenen yöndeki bir değişim haber değildir.** Demir hapı
içerken ferritinin yükselmesi bir başarı değil, bir sonuçtur.

### 2.2 · Açlık durumu kaydedilmiyordu — **kapandı**

Açlık glukozu, insülini, trigliserit ve onlardan türeyen TyG ile TG/HDL
yalnız aç karnına alınan kandan yorumlanır. Oturuma «aç / tok /
bilinmiyor» alanı ve saat eklendi; `Bio.interpretable` tok karnına
alınmış bir ölçümü yorumdan çıkarır.

### 2.3 · «Sıfır bağımlılık» tipografide tutmuyordu — **kapandı**

Üç yazı ailesi Google Fonts'tan iniyordu. Karakter alt kümelemesiyle
(kaynaktan taranan 167 karakter) ve Newsreader'ın `opsz` ekseni 24'e
sabitlenerek 392 KB → **92 KB**; base64 olarak `fonts.css` içine gömüldü.
Ölçüm yukarıda.

---

## 3. Dalga 1 — Güven · **tamam**

| # | İş | Durum |
|---|---|---|
| 1.1 | Yazı tiplerini uygulamaya göm | ✓ 92 KB, 12.931 → 80 ms |
| 1.2 | İlaç ve takviye kaydı | ✓ 18 tür, ters indeks, «beklenen değişim haber değil» |
| 1.3 | Oturuma açlık durumu ve saat | ✓ `interpretable` yorumu kısıtlar |
| 1.4 | Kurulum ekranı | ✓ üç kural + alan başına «neden» |
| 1.5 | Telefonda alt gezinme | ✓ 860px altında beş yuva |
| 1.6 | Bekleme durumları | ✓ `busy/idle` + şerit, iskelet metinleri |

## 4. Dalga 2 — Sürtünme · **tamam**

| # | İş | Durum |
|---|---|---|
| 2.1 | Satır içi düzenleme | ✓ sonuç listesinde |
| 2.2 | Komut paletiyle veri girişi | ✓ `SP.Quick` — vital · hareket · tahlil · öğün |
| 2.3 | Günlükte zaman kaydırıcı | ✓ 14 günlük şerit |
| 2.4 | Besin etiketi fotoğrafı → gıda | ✓ `extract.fromFoodLabel`, eksik alanları bildirir |
| 2.5 | Sabitlenen ölçümler | ✓ en fazla beş |
| 2.6 | Klavye gezinme | ✓ `j`/`k` + Enter |

## 5. Dalga 3 — Derinlik · **tamam**

| # | İş | Durum |
|---|---|---|
| 3.1 | Şikâyet ve semptom günlüğü | ✓ 18 semptom, payda **girilen gün** |
| 3.2 | Âdet döngüsü | ✓ iki dönemden ölçülür, tekinde varsayılan olduğu SÖYLENİR |
| 3.3 | Panel görünümü | ✓ panel sekmesi, borç ve tazelik |
| 3.4 | Grafik kalitesi | ✓ son nokta vurgulu, uç etiketi, adlandırılmış hedef bandı |
| 3.5 | Ofis derinliği | ✓ **masalar arası devir** — aşağıda |
| 3.6 | Tablet aralığı ve alt sayfa | ✓ odak tuzağı, kaydırma kilidi, kayan şerit gölgesi |

### 3.5 neden ayrı yazılıyor

Ofis sistemin **en özgün fikri, en jenerik tasarımıydı**: beş ayrı rapor
yan yana duruyordu, aralarındaki ilişki görünmüyordu. Oysa doktrinin
merkezinde o ilişki var.

`SP.Office.handoffs()` yedi kaynaktan devir çıkarır — bandın altındaki
ölçüm → beslenme hedefi, kapanmayan açık → hiç ölçülmemiş biyobelirteç,
sepet açığı → ikame, kırmızı bayrak → yük tavanı, artan yük → protein,
eksik vital → toparlanma skoru, çapraz bulgu → iki masa.

Üç kural devri dürüst tutar:

1. **Devir bir tavsiye değildir.** «Şu ölçüldü, şu masaya düşüyor» der;
   dozu, planı, fiyatı devredilen masa söyler.
2. **Ölçülmemiş bir şey devredilemez.** Tahmin devir üretmez.
3. **Her satır tıklanabilir.** Bulgunun düştüğü ekranı, doğru sekmesi ve
   doğru satırı açık halde açar. Yoksa devir bir cümleden ibaret kalır.

Patron dört uzmanın yanına dizilmez, üstüne konur; kendi defteri kendi
işi değil **trafiğin kendisidir**.

---

## 6. Yapılmayacaklar

Bir planın yapılacaklar listesi kadar önemli tarafı budur. Aşağıdakiler
unutulmadı, **reddedildi**.

- **Canlı market fiyatı** — uygulama hiçbir siteyi taramaz. «Uydurulmuş
  sayı gösterilmez» kuralının fiyat tarafındaki sonucu.
- **Sesli cevap (TTS)** — dikte yeterli; TTS kesinlik katmaz, bedel katar.
- **PDF kitaplığı** — bağımlılık gerektirir; ekran görüntüsü çalışıyor.
- **Giyilebilir cihaz API'si** — hesap zaten eksik girdiye dayanıklı;
  cihaz bağlanınca yalnız giriş kanalı değişir.
- **Teşhis ve doz** — sınırın kendisi, yetenek eksiği değil.

---

## 7. Borçlar — sıradaki iş budur

Üç dalga bitti; geriye kalan **bakım borcu**, yeni yetenek değil.

| # | Borç | Ölçü | Ne zaman sorun olur |
|---|---|---|---|
| B1 | `labs.js` | **1.434 satır** | Şimdi. Dört sekme tek dosyada: sonuç · giriş · karşılaştırma · çıktı |
| B2 | Erişilebilirlik denetimi | 4 `aria-live`, otomatik denetim **yok** | Altı koşumdan hiçbiri a11y bakmıyor; yedinci koşum yazılmalı |
| B3 | `office.js` (çekirdek) | 816 satır | B1'den sonra; brifing üretimi ile devir motoru ayrışmalı |
| B4 | `llm.js`, `meals.js` | 737 / 749 | Aynı sınıra yaklaşıyorlar |
| B5 | API anahtarları düz metin | localStorage | Aile içinde kabul; **genele açılırken mutlaka** |
| B6 | `tasarim/` 20 örnek | 20 dosya | Dördü sisteme girdi; gerisi referans, güncellenmiyor |

Sıra önerisi: **B2 → B1 → B3**. Erişilebilirlik denetimi önce gelir çünkü
bölme işleminden sonra yazılırsa neyi bozduğunu söyleyemez.

---

## 8. «Bitti» ne demek

Bitiş çizgisi bir özellik listesi değildi. Üç cümleydi; üçü de artık
ölçümle doğru:

1. **Hiçbir ekran ağı beklemez.** Ağ var/yok farkı 4 ms. ✓
2. **Bir günün verisini telefonda bir dakikada girebilirsin.** Alt
   gezinme, komut paletinden giriş, satır içi düzenleme, 14 günlük
   şerit. ✓
3. **Sistem bir sayının neden değiştiğini söyleyebilir.** İlaç kaydı,
   açlık durumu, semptom günlüğü ve döngü; «beklenen değişim haber
   değildir» kuralı. ✓

Üçü sağlandı. Bundan sonrası **iyileştirmedir**, gereklilik değil — ve
iyileştirmenin ilk adımı yeni ekran değil, yukarıdaki borç listesidir.
