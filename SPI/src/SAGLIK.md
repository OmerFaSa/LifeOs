# SPİ — Sağlık modülü (Modül 1) planı

Testler bölümü sistemin en veri yoğun yeridir ve en çok derinliği hak
eden yerdir: beslenme ve hareket hedeflerinin hepsi buradan çıkar.

Bu belge Testler'i «ölçüm listesi»nden **okunabilir bir sağlık kaydına**
çıkarma planıdır.

---

## Değişmeyecekler

Buradaki hiçbir madde şunları değiştirmez:

- **Kural motoru otoritedir.** Hesaplanan her indeksin formülü ekranda
  yazar; model hiçbirini üretmez, yalnız var olanı cümleye döker.
- **Eksik veri sıfır sayılmaz.** Bir girdi yoksa indeks hiç yazılmaz;
  «0» ya da «normal» diye gösterilmez.
- **Tahmin, ölçüm gibi gösterilmez.** Hesaplanan değer `hesaplandı`
  etiketiyle durur. Aynı ölçüm hem ölçülmüş hem hesaplanmışsa
  **ölçülen kazanır**.
- **Teşhis yok.** İndeks bir bulgudur, bir tanı değildir. Kırmızı bayrak
  eşiğinin ötesinde sistem yorumu keser ve hekime yönlendirir.

---

## Bugünkü durum

52 ölçüm, 12 panel, 3 türetilmiş indeks (HOMA-IR, Non-HDL, TSAT),
durum/hedef bandı ayrımı, eğilim, kırmızı bayrak, panel tazeliği,
rapor yapıştırma ve belge okuma.

Eksik olan: **birlikte okuma**. Her ölçüm tek başına doğru
değerlendiriliyor ama ölçümler birbirini açıklamıyor.

---

## İz A · Türetme motoru

Laboratuvarın vermediği ama var olan değerlerden **hesaplanabilen**
indeksler. Hepsi standart formüllerdir; her biri formülüyle birlikte
gösterilir.

| İndeks | Formül | Neden |
|---|---|---|
| **eGFR** | CKD-EPI 2021 (kreatinin, yaş, cinsiyet) | Kreatinin tek başına böbrek fonksiyonunu söylemez |
| **LDL** | Friedewald: TK − HDL − TG/5 | Çoğu panelde LDL ölçülmez, hesaplanır |
| **TG/HDL** | Trigliserit ÷ HDL | İnsülin direncinin en ucuz göstergesi |
| **TyG** | ln(TG × glukoz ÷ 2) | Açlık insülini olmadan direnç tahmini |
| **eAG** | 28,7 × HbA1c − 46,7 | HbA1c'nin gündelik dildeki karşılığı |
| **FIB-4** | (yaş × AST) ÷ (trombosit × √ALT) | Karaciğer sertliği için tarama indeksi |
| **AST/ALT** | De Ritis oranı | İki enzimin oranı, tek başına değerlerinden fazlasını söyler |
| **Düzeltilmiş Ca** | Ca + 0,8 × (4 − albümin) | Düşük albüminde kalsiyum yanlış düşük okunur |

**Kural:** girdilerden biri eksikse indeks **hiç yazılmaz**. Friedewald
yalnız trigliserit 400 mg/dL altındayken geçerlidir; üstünde
hesaplanmaz — geçersiz bir formülü uygulamak, hesaplamamaktan kötüdür.

## İz B · Birlikte okuma

Tek ölçüm yanıltır; örüntü yanıltmaz.

- **Ferritin + CRP** — ferritin akut faz proteinidir. CRP yüksekken
  ferritin demir deposunu **olduğundan yüksek** gösterir; bu durumda
  «normal ferritin» demir eksikliğini dışlamaz.
- **Ferritin + MCV + RDW** — düşük ferritin, düşük MCV ve yüksek RDW
  birlikte demir eksikliği örüntüsüdür.
- **TSH + T4/T3** — TSH tek başına tiroit durumunu söylemez.
- **Glukoz + insülin + HbA1c** — üçü birbirini doğrular ya da yalanlar.
- **Kreatinin + eGFR + üre** — tek yüksek kreatinin dehidrasyon da olabilir.

## İz C · Kişisel taban çizgi

Referans aralığı **nüfusun**, hedef bandı **sistemin**; ikisi de senin
değil. Üç ve üzeri ölçümü olan her belirteç için kendi ortalaman ve
saçılman hesaplanır; yeni bir değerin bu saçılmadan **büyük** olup
olmadığı söylenir.

Bir değişim ölçüm gürültüsünden büyük değilse «değişti» denmez.

## İz D · Görünüm

- **Karşılaştırma** — iki test oturumu seç, farkı gör
- **Ölçüm sayfası** — tek belirtecin bütün hikâyesi tek yerde
- **Sabitlenen ölçümler** — önemsediğin 3–5 ölçüm her görünümün üstünde
- **Hekime götürülecek çıktı** — tek sayfalık, yazdırılabilir özet

---

## Fazlar

### Faz 1 — Türetme ve birlikte okuma — **YAPILDI**

- ✅ Sekiz yeni indeks (İz A), her biri formülüyle
- ✅ Ölçülen değer hesaplanana üstün gelir
- ✅ Örüntü okuma (İz B) — kural motorunda, modelsiz
- ✅ Kişisel taban çizgi ve anlamlı değişim eşiği (İz C)

### Faz 2 — Karşılaştırma ve ölçüm sayfası — **YAPILDI**

- ✅ **Karşılaştır** sekmesi: iki oturum seç, farkı gör. Varsayılan son
  iki oturum. Satırlar önce gerçek değişimler, sonra gürültü, sonra
  eksikler diye sıralanır; sekmedeki rozet oturum sayısını değil
  **gerçek değişim sayısını** gösterir.
- ✅ Fark yazmak kolaydır; zor olan hangi farkın gerçek olduğunu
  söylemektir. Her satır kişisel saçılmaya göre işaretlenir:
  «gerçek değişim» · «gürültü sayılır» · «eşik yok». Üçten az kaydı
  olan ölçümde sistem sessizce «gerçek» demez.
- ✅ Eksik veri sıfır sayılmaz: bir oturumda olmayan ölçüm için fark
  hesaplanmaz, «ilk kez ölçüldü» ya da «bu kez ölçülmedi» yazar.
- ✅ Ölçüm sayfasına kişisel taban çizgi ve örüntüler eklendi.

### Faz 3 — Hekim çıktısı — **YAPILDI**

- ✅ Tek sayfalık, yazdırılabilir özet. İki şeyi aynı anda yapar:
  hekimin işine yarayacak kadar eksiksiz olmak ve **ne olmadığını en
  üstte söylemek**. Sayfanın ilk satırı klinik sınırdır.
- ✅ İkinci satır **kesinlik anahtarı**dır: hangi sayının ölçüldüğü,
  hangisinin hesaplandığı yazmazsa hekim hesaplanmış bir LDL'yi
  ölçülmüş sanar. Tablodaki her satır kendi kesinliğini taşır.
- ✅ Yazdırma perdesi (`@media print`): kâğıda yalnız bu blok basılır,
  arayüzün hiçbir parçası görünmez.

### Faz 4 — Sıradaki

- ⬜ Sabitlenen ölçümler (önemsediğin 3–5 ölçüm her görünümün üstünde)
- ⬜ Oturuma açlık durumu ve saat bilgisi (glukoz, insülin ve
  trigliserit yalnız açken yorumlanır)
- ⬜ Panel görünümü: bir paneli bir bütün olarak okuma
