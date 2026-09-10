# SPİ — Yol Haritası

İki plan. Birincisi **veri girişini kolaylaştırır**, ikincisi **tasarımı
derinleştirir**. İkisi bir yerde kesişir (giriş yüzeyleri) ve orada birlikte
yapılırlar.

Mevcut durum için `MIMARI.md` § 7'ye bak. Bu belge oradan sonrasını anlatır.

---

## Neden bu sıra?

Sistemin bugünkü en büyük riski teknik değil **davranışsal**: kural motorları
çalışıyor, ofis çalışıyor, tasarım oturdu — ama kullanıcı üç hafta sonra veri
girmeyi bırakırsa hiçbiri bir şey ifade etmez.

Bu yüzden veri girişi birinci sırada. Tasarımın da ilk fazı bu yüzden
kurulum ekranı ve giriş yüzeyleridir: en çok dokunulan yerler oralar.

---

# Plan A · Veri girişini kolaylaştırma

## Mimari kural

Çıkarma katmanı ekranlardan **ayrıdır**: tek bir `SP.Extract` modülü ve
altında adaptörler (belge, fotoğraf, ses). Ekranlar modeli hiç tanımaz.
Sağlayıcı değişince ya da model kapalıyken ekranlara dokunulmaz.

Üç değişmez:

1. **Uygulama modelsiz çalışmaya devam eder.** Bunların hepsi ektir; hiçbiri
   zorunlu bir yol değildir. Her multimodal girişin elle karşılığı durur.
2. **Model doğrudan depoya yazmaz.** Her yol, tahlil yapıştırmadaki
   «ayıklandı → gözden geçir → kaydet» adımına bağlanır. Kullanıcı
   görmeden hiçbir şey kaydedilmez.
3. **Model uydurma kimlik döndürmez.** Çıktı bizim tablolarımıza
   (`SP.FOODS`, `SP.BIOMARKERS`) eşlenir; eşleşmeyen satır atılmaz,
   «eşleşmedi» olarak gösterilir.

## Kesinlik eşlemesi

Yeni kaynaklar mevcut kesinlik etiketlerine oturur; yeni etiket icat
edilmez.

| Kaynak | Kesinlik | Gerekçe |
|---|---|---|
| Tahlil belgesi (PDF/foto) | `ölçüldü` | Laboratuvar ölçtü, biz yalnız okuduk |
| Market fişi | `ölçüldü` | Fiyat fişte yazılı |
| Besin etiketi | `ölçüldü` | Üretici beyanı, ambalajda yazılı |
| Yemek fotoğrafı | `tahmin` | Porsiyonu model tahmin ediyor |
| Sesli giriş | metnin kesinliği | Ses yalnız klavyenin yerine geçer |

Fotoğraftan gelen bir gramaj hiçbir koşulda `ölçüldü` görünmez. Kullanıcı
tartıp düzeltirse `ölçüldü` olur — bu zaten var olan davranıştır.

## Mahremiyet — şimdiki karar ve bırakılan dikiş

Sistem şu an **aile içi** kullanım için tasarlanıyor ve API'ye giden veri
sorun görülmüyor. Bu bilinçli bir karardır.

Buna rağmen arındırma **mimariden dışlanmıyor**: dışarı çıkan her istek
`Extract.send()` içinden tek bir noktadan geçer. Genele açılırken oraya bir
arındırma adımı takılır (PDF'ten kimlik alanlarını kesme, fotoğraftan EXIF
silme). Şimdi yazmıyoruz; ama sonradan yazmak bir ayar değişikliği olsun,
yeniden yazım olmasın diye yeri boş duruyor.

## Fazlar

### Faz 1 — Belge girişi

En yüksek değer, en düşük risk. Değerler `ölçüldü` kaldığı için sistemin
kesinlik doktrinine hiç dokunmaz.

- `SP.Extract` iskeleti ve belge adaptörü
- **Tahlil PDF / fotoğrafı → ölçümler.** `parseLab` zaten var; model yalnız
  ayrıştırıcının çözemediği düzenlerde devreye girer, önce o denenir.
- **Market fişi → fiyatlar.** Bunun ayrı bir önemi var: tohum fiyat listesi
  enflasyonla çürüyor ve bugün bunu yalnız «tahmin» etiketiyle dürüstçe
  itiraf edebiliyoruz. Fiş okuma, itirafı çözüme çevirir.
- **Besin etiketi → yeni gıda kaydı.** 61 gıdalık tablo hanenin gerçek
  alışverişini kapsamıyor; kullanıcı kendi ürününü ekleyebilmeli.

### Faz 2 — Fotoğrafla öğün

- Fotoğraf **+ üç kısa not**: ne kadarı yendi, kabın ölçüsü, gizli malzeme
  («zeytinyağlı», «şekerli»). Serbest metin değil, üç alan — çünkü tahmini
  güçlendiren şey bu üç bilgidir ve sorulmadan verilmez.
- Çıktı `SP.FOODS` kimliklerine eşlenir, porsiyon gram olarak tahmin edilir
- `tahmin` etiketli, düzeltme ekranı zorunlu

### Faz 3 — Ses (dikte)

Burada elimizde hazır bir avantaj var: **ses → metin → zaten yazdığımız
`parseMeal`**. Yeni ayrıştırıcı gerekmiyor. «Bir tabak etli kuru fasulye,
bir bardak ayran» dendiğinde klavyeyle yazılan yolun aynısı çalışır.

- Öğün girişi, antrenman girişi ve **koç sohbeti** aynı dikte mekanizmasını
  kullanır. Koçlarla «sesli sohbet» bir konuşma değil dikte'dir: ses metne
  çevrilir, metin koça yazılır, koç yazıyla cevap verir. Sesli cevap (TTS)
  yoktur — kesinlik katmaz, bedel katar.
- Mahremiyet kısıtı kalktığı için tarayıcının kendi konuşma API'siyle
  başlanır: bedava, anında, ek indirme yok. Yetersiz kalırsa Whisper'a
  geçilir; `SP.Extract` adaptörü değişir, ekranlar değişmez.

### Faz 4 — Sürükle-bırak ve her yerden giriş

- Sayfanın herhangi bir yerine bırakılan PDF/fotoğraf doğru çıkarıcıya gider
- Komut paleti veri girişi kabul eder: `ferritin 26`, `45 dk yürüyüş`

---

# Plan B · Tasarımı geliştirme

## Bugünkü durumun dürüst değerlendirmesi

**Hero tasarlandı, altı tasarlanmadı.** Her ekranın üstü artık iyi: künye,
numaralı gezinme, bölüm imzası, filigran numara, kadran, ölçüm cetveli. Ama
hero'nun altında hâlâ aynı 8/4 ızgarada kart yığını var ve bütün kartlar eşit
ağırlıkta duruyor.

Plan bu yüzden üç ize ayrılır:

| İz | Ne yapar |
|---|---|
| **A · Düzen** | Sayfanın iskeleti — gövde düzeni, hiyerarşi, tablet, mobil |
| **B · Görsel kalite** | Var olanın kalitesi — grafik, form, alt sayfa, durum ekranları |
| **C · Mekanikler** | Sayfanın yapabildikleri — yeni etkileşimler ve yetenekler |

## Faz 1 — İlk izlenim ve gövde düzeni

**A · Kurulum ekranı.** Sisteme giren herkesin gördüğü ilk şey ve hiç
dokunulmadı. En yüksek etki burada.

**A · Gövde düzenine çeşitlilik.** Her bölüm aynı 8/4 ızgarayı kullanmasın:
Testler'de tam genişlik cetvel, Ofis'te masa düzeni, Besin'de asimetrik iki
sütun. Bölüm kimliği yalnız renkte değil, düzende de olsun.

**A · Kart hiyerarşisi.** Ana kart / yardımcı kart ayrımı. Şu an on beş kart
eşit ağırlıkta bağırıyor; hangisinin önce okunacağı belli değil.

**C · Geri alma.** Silme ve kaydetmeden sonra «geri al» sunan bildirim.
Bugün yıkıcı işlemler onay kâğıdıyla korunuyor; geri alma hem daha nazik
hem daha hızlı.

## Faz 2 — Giriş yüzeyleri

Plan A'nın Faz 1–2'siyle **birlikte** yapılır: fotoğraf, belge ve ses
akışları da bu yüzeyleri kullanacak.

**B · Alt sayfa (sheet) ve form tasarımı.** Bütün veri girişi buradan geçiyor
ve hiç elden geçmedi.

**B · Yükleniyor durumları.** İskelet ekranlar var ama tasarlanmadı; model
çağrısı saniyeler sürecek, bekleme görünür olmalı.

**C · Satır içi düzenleme.** Sonuç listesinde bir değere tıklayıp yerinde
düzeltmek — alt sayfa açmadan.

**C · Zaman kaydırıcı.** Günlük sayfasında günler arasında gezinmek için
gerçek bir denetim; bugün üç düğme var.

## Faz 3 — Ofis bölümü

Sistemin **en özgün fikri, en jenerik tasarımı**. Beş koç şu an beş eşit
kart. Patron ile alt koçların ilişkisi görünmüyor; oysa doktrinin merkezinde
o ilişki var.

**A** masa düzeni · **B** ajan kimliklerinin görsel derinliği ·
**C** koçlar arası bağın tıklanabilir hâli (Kerem'in bulgusundan Nesrin'in
hedefine)

## Faz 4 — Ölçüm görselleri ve hekim çıktısı

**B · Grafikler.** İşlevsel ama güzel değil. Cetvel ve kadran seviyesine
çıkarılmalı.

**C · Karşılaştırma.** İki tahlil oturumu seç, farkı gör. Sağlık kaydı bunu
ister.

**C · Sabitlenen ölçümler.** Önemsediğin 3–5 ölçüm her ilgili görünümün
üstünde dursun.

**C · Hekime götürülecek çıktı.** Tek sayfalık, yazdırılabilir özet: son
ölçümler, eğilimler, ilaç ve şikâyet notları. Sağlık sistemi için gerçek bir
değer ve tasarım açısından kendi başına güzel bir iş. Ayrıca `SINIR`
kuralını taşıyacak yer: çıktının üstünde bunun bir hekim raporu olmadığı
yazar.

## Faz 5 — Tablet ve mobil

**A · Tablet.** 860–1060 px aralığı bugün masaüstü düzeninin sıkışmışı.
Sistem tablette kullanılacak; bu aralık kendi düzenini hak ediyor.

**A · Mobil.** Aynı sorun daha keskin hâliyle. Tasarlanmış bir mobil değil,
daraltılmış bir masaüstü.

**C · Klavye gezinme.** Liste satırlarında `j`/`k`, açmak için `Enter`.
Masaüstünde hızlı giriş için.

---

## Kesişim

Plan A Faz 2 (fotoğrafla öğün) ile Plan B Faz 2 (giriş yüzeyleri) aynı
ekranlara dokunur. İkisi ayrı ayrı yapılırsa aynı alt sayfa iki kez yazılır.
Birlikte yapılmalıdır.

## Değişmeyecek olanlar

Bu yol haritasının hiçbir maddesi şunları değiştirmez:

- Kural motoru otoritedir; model onun yerine geçmez, üstüne yazar
- Eksik veri sıfır sayılmaz
- Tahmin, ölçüm gibi gösterilmez
- Durum renkleri bölüme göre değişmez
- Uygulama modelsiz çalışır
