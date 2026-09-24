# LifeOS · Tasarım özellikleri havuzu

Gelecekteki tasarım çalışması için 70 fikir. Her biri tek satır: ne görünür, ne işe yarar.
★ işaretli 12 tanesi önce yapılmalı; geri kalanı sırayla.

**Yeniden önerilmeyenler** (depoda anahtar kelime aramasıyla bulundu, ayrıntısı doğrulanmadı):
komut paleti (⌘K), paletler, Geri al, odak modu, zamanlayıcı, iskelet yükleme,
azaltılmış hareket, ısı haritası, mini çizgi grafik, çevrimdışı, yazdırma.

**Bütün fikirlerin uyduğu üç kural**
1. Renk yalnız sahipliği söyler: mavi AYS, yeşil SPİ, turuncu ESP, mor Merkez. Yeşil/kırmızı yalnız yön. Başka anlam yüklenmez.
2. Her sayı etiketlidir: ölçüldü · hesaplandı · tahmin · veri yok. Eksik veri «—» olur, 0 olmaz.
3. Sınırlar tasarımda da geçerli: SPİ teşhis/doz göstermez, ESP/AYS sertifika ve yetenek yargısı göstermez, XP hiçbir kararın yanında durmaz.

---

## A · Ortak tasarım dili (12)

| # | Özellik | Ne yapar |
|---|---|---|
| 1 ★ | **Modül şeridi** | Birden çok modülün işi aynı ekrandaysa her modül kendi yatay şeridinde durur; kategoriler karışmaz. Örnek: `ays-gece.html` |
| 2 ★ | **Tek kutu iskeleti** | Her kutu aynı başlığı taşır: simge + ad + sağda kesinlik etiketi. Göz, kutunun ne olduğunu başlıktan okur. |
| 3 ★ | **Üç alan düzeni** | Her «Bugün» ekranı aynı sırada: Şimdi → Durum → Öneri. Kullanıcı her modülde aynı yere bakar. |
| 4 | **Tipografi üçlüsü** | Başlık için karakterli bir yazı, metin için sade yazı, sayı için eşit aralıklı yazı. Üçü hiç yer değiştirmez. |
| 5 | **Tablo sayıları** | Bütün sayılar eşit genişlikte rakamla ve sağa hizalı; alt alta gelen değerler kaymaz. |
| 6 | **Tek boşluk ölçeği** | 4 · 8 · 12 · 16 · 24 · 32 px dışında boşluk yok; tek kaynaktan dağıtılır. |
| 7 | **Ton katmanları** | Gölge yerine üç yüzey tonu (zemin, kart, yükseltilmiş) ve tek çizgi rengi; koyu ve açık temada aynı mantık. |
| 8 ★ | **Sayfa başı cümlesi** | Her ekranın tepesinde kural motorunun ürettiği tek cümle: «7 işin 3’ü bitti · sıradaki blok 20:30’da». |
| 9 | **Boş durum sahnesi** | Veri yoksa küçük bir çizim + tek eylem («İlk ölçümü ekle»). Asla boş grafik ya da 0. |
| 10 | **Kısayol rozetleri** | Ana düğmelerde küçük tuş rozeti (↵, E); klavyeyle çalışan kullanıcı ezberlemeden öğrenir. |
| 11 | **Modül işareti** | Üst çubukta 2×2 kare: dört sistem, aktif olan kendi renginde yanar. «LifeOS / AYS» yolu yanında. |
| 12 | **Tek canlı öğe kuralı** | Ekranda aynı anda yalnız bir şey hareket eder ya da parlar (genelde «sıradaki»). |

## B · Sayı ve veri gösterimi (8)

| # | Özellik | Ne yapar |
|---|---|---|
| 13 ★ | **Kesinlik glifleri** | Dolu nokta = ölçüldü, yarım dolu = hesaplandı, kesikli halka = tahmin, «—» = veri yok. Sayfa altında tek satır açıklama. |
| 14 | **Tahmin alt çizgisi** | Tahmin olan sayının altı kesik çizgili; üzerine gelince kodun verdiği aralık görünür. |
| 15 ★ | **Anlamlı fark rozeti** | «+3», «+41» küçük hap içinde. Rengi işaretten değil anlamdan gelir: net artışı yeşil, tekrar borcu artışı kırmızı. |
| 16 | **Eşik çizgili çubuk** | Değer çubuğunun üstünde eşik işareti: «tekrar borcu %34 · eşik %10» tek bakışta okunur. |
| 17 | **Tik sayacı** | Küçük hedeflerde yüzde çubuğu yerine adet kutucukları (15/18); kalan kutu sayılır. |
| 18 | **Geçen dönem gölgesi** | Grafikte bu haftanın çizgisi canlı, geçen haftanınki soluk; karşılaştırma ayrı grafik istemez. |
| 19 | **Grafiğin cümlesi** | Her grafiğin altında kural motorunun tek cümlesi («Son 6 denemede +12 net»); ekran okuyucu da bunu okur. |
| 20 | **Küçük birim** | Sayı büyük, birim küçük ve gri: **82** net. Birim hiçbir zaman sayı boyutunda değil. |

## C · AYS (10)

| # | Özellik | Ne yapar |
|---|---|---|
| 21 ★ | **Sıradaki blok kahramanı** | Ekranın en büyük öğesi tek iş; adımları süreyle orantılı çubuk (ısınma 10 · ana set 50 · analiz 10). |
| 22 | **Geri sayım rozeti** | «6 sa 20 dk sonra»; son 15 dakikada rozet nabız atmaya başlar. |
| 23 | **Nötr soru şeridi** | Çözerken üstte 30 bölmeli ince şerit yalnız «çözüldü/boş» gösterir; doğru/yanlış renkleri set bitince açılır, kaygı yaratmaz. |
| 24 | **Yanlış kartı** | Yanlış notu ön/arka çevrilen kart: önde soru özeti, arkada «neden yanlış» notu. |
| 25 | **Deneme karnesi** | Ders başına tek satır: doğru · yanlış · boş yatay yığılmış çubuk, sonda net. TYT ve AYT ayrı şerit. |
| 26 | **Konu kapsam halkası** | Konu listesinde her konunun yanında «planlanan sorunun ne kadarı çözüldü» halkası; yetenek değil, kapsam gösterir. |
| 27 | **40 hafta çizgisi** | Sınava kadar her hafta bir tik: geçen gri, bu hafta mavi parlar, ara haftası taralı. |
| 28 | **Ara haftası önizlemesi** | Orta seviye aksiyon: programda etkilenecek haftalar taralı gösterilir, tek onayla uygulanır. |
| 29 | **Taşıma gölgesi** | Program bloğu sürüklenirken etkilenen bloklar hayalet olarak kayar; bırakınca «Geri al» kalır. |
| 30 | **Tek satır soru ekle** | Ders · konu · sonuç üç çip; açılır pencere yok, Enter ile kaydedilir. |

## D · SPİ (9)

| # | Özellik | Ne yapar |
|---|---|---|
| 31 ★ | **Toparlanma halkası** | 72 değeri ortada; çevresinde uyku, hareket, beslenme ayrı dilimler, her biri kendi kesinlik etiketiyle. |
| 32 | **Uyku bandı** | Gece 23:00–07:00 yatay şerit; uyanıklıklar kesik, haftalık ortalama ince çizgi. |
| 33 | **Referans bandı** | Tahlil değerleri, laboratuvar aralığını gösteren gri bant içinde nokta. Aralık dışı yalnız işaretlenir; yorum yok, «hekiminle konuş» nötr notu. |
| 34 | **Tabak görünümü** | Beslenmede halka dilimleri yerine tabak bölmeleri; kalan miktar yazılı («38 g protein kaldı»). |
| 35 | **Tek dokunuş sayaç** | Su, öğün, ilaç alındı işareti gibi küçük kayıtlar tek dokunuş; altta «Geri al» şeridi. Doz önerisi yok. |
| 36 | **Set kutucukları** | Antrenman hareketleri satır, setler kutucuk; biten set dolar, dinlenme süresi kutucuğun içinde akar. |
| 37 | **Ölçüm tuş takımı** | Büyük rakam, sabit birim, son değer soluk ipucu olarak arkada; yanlış girişe karşı «dün 71,2 idi» uyarısı. |
| 38 | **Harcama şeritleri** | Sedef’in ekranı: kategori başına ay şeridi, bütçe çizgisi; aşım yalnız çizginin rengiyle. |
| 39 | **Sessiz sınır notu** | «SPİ teşhis koymaz» notu her kartta değil, ekran altında bir kez, ikonlu ve gri. |

## E · ESP (8)

| # | Özellik | Ne yapar |
|---|---|---|
| 40 ★ | **Deste yığını** | Kalan kartlar arkada ince yığın olarak durur; yığın incelikçe bitiş görülür (797 kart). |
| 41 | **Süreli cevap düğmeleri** | Tekrar 1 dk · Zor 6 dk · İyi 2 gün · Kolay 5 gün; her düğme bir sonraki görülme zamanını söyler. |
| 42 | **Dakika halkası** | Günlük 20/50 dk; halka dolarken rengi değişmez, yalnız dolar. |
| 43 | **Unutma eğrisi** | Retansiyon (%50, hesaplandı) düşen eğri üzerinde «bugün» noktası; tekrarın neden şimdi olduğunu gösterir. |
| 44 | **Merdiven basamakları** | Merdiven içerik sırasıdır, yetenek derecesi değil: basamak adı + içindeki ders sayısı. Sertifika görünümü yok. |
| 45 | **Kütüphane rafı** | Kitaplar sırt olarak dizili; sırt kalınlığı sayfa sayısı, alt çizgi okunan oran. |
| 46 | **Kelime sahnesi** | Tek kelime çok büyük, anlamı orta, örnek cümle italik ve küçük; başka hiçbir şey yok. |
| 47 | **Ajanlı ders kapağı** | Polyglot, Socrates, Maestro… her dersin başında ajan portresi + tek cümle; renk yine ESP turuncusu. |

## F · Merkez / HKM (6)

| # | Özellik | Ne yapar |
|---|---|---|
| 48 ★ | **Mor öneri kartı** | Merkez’in her önerisi mor kenarlı kart; modül içeriğiyle asla aynı görünmez. Sağ üstte seviye: küçük / orta / büyük. |
| 49 ★ | **Seviyeye göre onay kalıbı** | Küçük: tek düğme + «Geri al». Orta: yandan açılan önizleme + tek onay. Büyük: tam ekran önce/sonra + geri dönüş noktası adı. |
| 50 | **Önce / sonra görünümü** | Plan değişikliği iki sütun; yalnız değişen bloklar renkli, gerisi soluk. |
| 51 | **Gerekçe çubuğu** | Öneri hangi sayıya dayanıyorsa o sayı çubukla gösterilir; modelin cümlesi altında küçük yazı. |
| 52 ★ | **Bağlantı noktası** | Altta «Merkez bağlı · 14:08». Kapalıyken gri: «Merkez kapalı — her şey çalışıyor». Hata kırmızısı kullanılmaz. |
| 53 | **Öneri geçmişi** | Uygulanan, geçilen, geri alınan öneriler dikey zaman çizgisinde; her biri tek satır. |

## G · Ofis ve ajanlar (4)

| # | Özellik | Ne yapar |
|---|---|---|
| 54 | **Masa görünümü** | Ajan portreleri yan yana; konuşan büyür ve renklenir, diğerleri soluk kalır. |
| 55 | **Balondaki sayı çipi** | Ajan cümlesinde geçen sayı çip olarak görünür ve kaynağını taşır («sistem hesapladı»); cümle yorum, çip gerçek. |
| 56 | **Ajan durum halkası** | Portrenin çevresinde ince halka: çalışıyor (dönen), boşta (sabit), kapalı (yok). |
| 57 | **Hazır cevap çipleri** | Her ajan balonunun altında 2–3 kısa cevap; yazmadan konuşma sürer. |

## H · Seviye / rütbe (4)

| # | Özellik | Ne yapar |
|---|---|---|
| 58 | **Rütbe halkası** | Üst çubukta rütbe görseli, çevresinde XP ilerleme halkası (180/430). Tıklayınca eşikler. |
| 59 | **Sakin seviye atlama** | 1,2 saniyelik parlama + yeni rütbe görseli; ekranı kapatmaz, işi bölmez. |
| 60 | **Sistem başına rütbe** | Her modülün rütbesi kendi renginde çerçeveli; tanım tek kaynaktan, görünüm modülden. |
| 61 | **Rütbe galerisi** | Kazanılan rütbeler rafta renkli, kilitliler siluet; XP yalnız burada ve üst çubukta görünür. |

## I · Hareket ve mikro etkileşim (5)

| # | Özellik | Ne yapar |
|---|---|---|
| 62 | **Kademeli giriş** | Kartlar 40 ms arayla aşağıdan süzülür; azaltılmış harekette anında gelir. |
| 63 | **Sayı yuvarlanması** | Değer değişince eski rakam yukarı kayar, yenisi alttan gelir; değişim fark edilir. |
| 64 | **Geri al geri sayımı** | Mevcut «Geri al» şeridinin altında 6 saniyelik incelen çizgi; ne kadar süre kaldığı görülür. |
| 65 | **Basma hissi** | Düğmeye basınca 1 px iniş ve hafif ton değişimi; titreşim yok, ses yok. |
| 66 | **Şimdi çizgisi** | Zaman çizelgelerinde dakikada bir ilerleyen ince çizgi; geçmiş saatler hafif taralı. Örnek: `ays-gece.html` |

## J · Mobil ve erişilebilirlik (4)

| # | Özellik | Ne yapar |
|---|---|---|
| 67 | **Başparmak bölgesi** | Mobilde ana eylem ekranın alt üçte birinde; üst gezinme alt sekme çubuğuna iner. |
| 68 | **Sabit etiketli kaydırma** | Dar ekranda şerit yana kayar, modül etiketleri solda sabit kalır, açılışta «şimdi»ye kaydırılır. Örnek: `ays-gece.html` |
| 69 | **Renksiz de ayırt edilir** | Modül = renk + harf (AYS/SPİ/ESP) + şekil (daire / kare / üçgen); renk körü kullanıcı da karıştırmaz. |
| 70 | **%200 yakınlaştırma** | İki sütun tek sütuna akar, hiçbir sayı kesilmez; 24 px dokunma hedefi korunur. |

---

**Sonraki adım önerisi:** ★ işaretli 12 özellik tek bir «tasarım sistemi» sayfasında (renk, tip, kutu, kesinlik glifi, fark rozeti, öneri kartı, onay kalıpları) örnek bileşen olarak çizilir; modül ekranları ondan türetilir.
