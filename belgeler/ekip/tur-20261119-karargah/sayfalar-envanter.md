# Sayfalar birliği · karışıklık envanteri (2026-11-19)

Sahip: «arayüzdeki tüm karışıklıkları kaldır, hepsini; askerî karargâh gibi olsun.» Kapsam: Bugün ve Tarih dışındaki ekranlar
(Öğren, Sağlık, Araçlar, Not, Başbuğ sohbeti ve Divan, Ayarlar, Hesap, dokuz alan sayfası, ders ekranı). Çekim: `main` (bd227c1b),
1280 ve 390, açık sade tema, boş hesap. Ölçüt: AGENTS §0.1 kural 2 (tek ekran, tek iş) ve kural 10 (sade, az metin).

Sonuç sütunu: **kalktı** · **sadeleşti** · **kaldı** (gerekçesiyle) · **devredildi** (başka birliğin bölgesi).

| Ekran | Öğe | Neden | Sonuç |
|---|---|---|---|
| Öğren, Akademik | «Günün Türk bilgini» kartı (`mirasKarti`) | İşle ilgisiz, araya giren süs kartı; sayfanın ilk bloğu oluyor, asıl iş (sıradaki ders) aşağı itiliyor | kalktı (veri `BILGIN` de) |
| Sağlık, Beslenme, Hareket, Uyku, Tahlil | «Türk geleneğinden» kartı (`mirasKarti`, `Kabuk.ic.miras`) | Aynı: süs, kayıt ve ders işinin önüne geçiyor | kalktı (veri `GELENEK` de) |
| Ders ekranı | Ders sonunda «Türk atasözü» satırı (`dersAtasozu`) | Bitir düğmesinin üstünde dikkat çalan süs | kalktı |
| Ders ekranı | Kâğıdın başındaki piksel sahne (`.ders-sahne`) | Okuma sayfasında süs; ders başlığını 200 px aşağı itiyor | kalktı |
| Ders ekranı | İlk paragrafın büyük kırmızı baş harfi (`::first-letter`) | Kitap süsü | kalktı |
| Ders ekranı | Ders sonundaki renkli kısa çizgi (`.ders__bitir::before`) | Süs; ayrım boşlukla | kalktı |
| Alan sayfaları | «Neredesin» kartında aşamanın hedef cümlesi | Aynı cümle hemen aşağıda «Aşamalar» kartında da var | sadeleşti: aşama listesi varken yalnız orada |
| Alan sayfaları | «Seviye · Aşama 1 / 2» | «Seviye» ile «Aşama» aynı şey, iki ad | sadeleşti: «Aşama 1 / 2» |
| Alan sayfaları | Dersler, Aşamalar, Konu haritası üç liste | Üçü ayrı iş: sıradaki ders, aşama kapıları, konu kapsamı (sahibin 17 Kasım isteği) | kaldı |
| Alan sayfaları | «Kendi başlığını ekle» | Kullanıcının kendi konuları (özellik) | kaldı |
| Not | Boş defterde eğik «örnek» not kâğıdı | Süs; kutunun ipucu aynı şeyi (`#etiket`, `[[bağ]]`) söylüyor | kalktı |
| Not | Klasör yokken tek başına «Hepsi 0» çipi | Tek seçenekli seçim; sayı başlıkta zaten var | kalktı (yalnız klasör varken görünür) |
| Not | «Yeni araç» satırı | Araç kendi sistem notuyla ayrı özellik, tek giriş yeri burası | kaldı |
| Ayarlar | Sol grup menüsü + «Ayar ara» kutusu | İki gezinme yolu; bölüm başlıkları zaten görünür, arama her satırı bulur. Telefonda menü üstte kayan ikinci şeritti | sadeleşti: menü kalktı, arama kaldı; `?grup-…` adresi yine o gruba kaydırır |
| Ayarlar | Başlık altı «Değişiklikler hemen uygulanır.» | Değişiklik zaten anında görünüyor; fazla metin | kalktı |
| Ayarlar | Tema satırının açıklaması bütün tema adlarını yeniden sayıyor | Seçenekler hemen altında aynı adlarla duruyor | sadeleşti: tek kısa cümle |
| Başbuğ | Kip şeridi manzaranın altına binebiliyor (Divan'da her zaman), «Başbuğ hakkında»nın üstünde boş pay | Hata: sahne payı (`kapakPay`) sohbet sayfaya girmeden hesaplanıp «Başbuğ hakkında»ya veriliyordu | düzeldi: sohbet her çizilişte payı yeniden ister |
| Başbuğ | «Başbuğ hakkında» kapalı bölümü | Gizlilik bilgisi (neyin hangi sunucuya gittiği); kapalı, tek satır | kaldı |
| Başbuğ · Divan | «Bu bir canlandırma…» notu | Dürüstlük notu, uydurmama sözü | kaldı |
| Sağlık | Başlıktaki «Kayıt ekle» + her ölçü kutusu | Kutular dört ölçüye, düğme bütün kayıt türlerine (su dahil) gider | kaldı |
| Araçlar, Hesap | Kart açıklamaları, «Açılış videosu» | Kısa ve iş gören; açılış videosu özellik | kaldı |
| Bütün sayfalar | Bölüm başlıklarının başındaki Selçuklu yıldızı (`.b-bolum__ust h2::before`) | Her başlıkta süs | devredildi: «Türk izleri» CSS bloğu, bugun/tema birliği |
| Ders, alan kartları | Alan tonu pembe zemin (sade temada `--alan-ton` = al) | Renk: «tek vurgu al, yalnız etkin ya da uyarı» | devredildi: tema birliği |
| Bütün sayfalar | Sayfa sonu mührü (on altı yıldız, söz, Göktürk harfleri) | Tekrar | devredildi: bugun birliği |

Pano: `sayfalar.png` (Öğren, Beslenme, Ders, Not, Ayarlar, Divan; önce/sonra, 1280 ve 390). Açılış yükü 996 921 → 981 812 bayt (−15 109).
