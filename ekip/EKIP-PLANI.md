# Ekip hareket planı — tek tasarım + 183 özellik (Part 9)

> 2026-09-24 · Üç Claude, tek `main`. Bu dosya **sabittir**: yalnız kullanıcı kararıyla
> değişir. Canlı durum `ekip/EKIP-DURUM.md`'dedir. DEVIR Part 9 bu planla yürür.
>
> Kaynaklar (hepsi `ekip/` altında):
> `TASARIM-OZELLIKLERI.md` (katalog v4: 183 özellik, P1'lerin kabul ölçütleriyle) ·
> `vitrin.html` (her özelliğin canlı örneği, tarayıcıda aç) ·
> `tasarim/v4-*.png` + `tasarim/v4-ornek.css` (kullanıcının seçtiği görünüm) ·
> `CEKMECE-HARITASI.md` (ne nerede durur).

## 0. Üç rol

| Rol | Kısa | Tek cümle | Özellik |
|---|---|---|---|
| **KARTLAR** | K | Katalogdaki kartları çalışan, testli bileşenlere çevirir ve ekranlara yerleştirir. | 146 |
| **TASARIM** | T | Görsel dili, kabuğu ve çekmece düzenini kurar; bugünkü bütün ekranları bu iskelete oturtur. | 37 + bütün ekranların giydirilmesi |
| **HATA** | H | Ölçer, bulur, düzeltir. Hiçbir şeyin kaybolmadığını ve sadeliğin korunduğunu **araçla** kanıtlar. | — |

Rol başına ayrıntı §4'te. Başlatma mesajları §9'da. Hangi özelliği kimin yaptığı Ek A'da.

## 1. Hedef ve sadelik sözleşmesi

**Hedef:** katalogdaki 183 özelliğin hepsi ve bugün uygulamada olan her işlev yerinde
dursun; görünüş `tasarim/v4-*.png`'deki gibi olsun: beyaz, ince çizgili, sade ve
profesyonel.

### 1.1 İlke: hiçbir şey silinmez, katmanlanır

Her özelliğin bir **katmanı** vardır. Ekranı kalabalıklaştıran yalnız G katmanıdır.

| Katman | Anlamı | Özellik |
|---|---|---|
| **G** görünür | Ekranda hep durur. | 51 |
| **B** biçim | Kendi yüzeyi yoktur; var olan şeyin biçimini ya da davranışını belirler (kesinlik glifi, hareket, erişilebilirlik). | 52 |
| **D** bir dokunuş | Dokununca açılır: ayrıntı, alt çekmece, açılır bölüm. | 36 |
| **A** anlık | Yalnız olay anında belirir, iş bitince gider (blok bitişi, şüpheli giriş, boş durum). | 25 |
| **Y** ayar | Ayarlar'da durur. | 13 |
| **İ** ipucu | Üzerine gelince ya da basılı tutunca görünür (köken kartı, terim ipucu). | 4 |
| **Dış** | Uygulamanın dışında (telefon bildirimi, ana ekran). | 2 |

183 özelliğin yalnız 51'i sürekli görünür ve bunlar yirmiden fazla ekrana dağılır.
Bugün ekranında G katmanı AYS'de 4, SPİ'de 6, ESP'de 4 özelliktir.

### 1.2 Sadelik bütçesi — ölçülür, elle yazılmaz

Aşağıdaki eşikleri H'nin aracı (`tools/sadelik.js`, §4.3) denetler. Aşan ekran kırmızıdır.
Eşik ancak gerekçesi EKIP-DURUM'a yazılıp kullanıcı onay verince değişir.

| Ölçü | Bugün (boş profil, 2026-09-24) | Hedef |
|---|---|---|
| İç içelik | 4–5 kat (menü › grup › ekran › sekme › alt sekme) | **≤ 2** (çekmece › bölüm) |
| Ekran içi sekme (ilk görünüm, envanter ölçümü) | AYS 23 · SPİ 37 · ESP 103 | **0** |
| AYS Bugün sayfa boyu (1440 px genişlik) | 4 482 px | **≤ 1 800 px** |
| AYS Bugün'de görünen düğme | 52 | **≤ 14** |
| 30 kelimeyi aşan tek parça yazı (envanter ölçümü) | AYS 6 · SPİ 4 · ESP 9 | **0**; açıklama ⓘ'ye taşınır |
| Dolu (birincil) düğme | ölçülmedi | ekran başına **≤ 1** |
| Aynı anda hareket eden öğe | ölçülmedi | **≤ 1**: sıradaki iş (özellik 12) |
| Halka grafiği | ölçülmedi | ekran başına **≤ 1** |
| Mor renk | — | **yalnız Merkez** öğelerinde |
| Bileşende ham renk (jeton dışı hex) | ölçülmedi | **0** |
| XP gösteren yer | birden çok ekran | **yalnız** rütbe çipi ve Rütbe ekranı |
| Emoji, degrade, kart gölgesi | var | **yok**; gölge yalnız açılır katmanda |

Diğer ölçümler (ESP Ofis 1 243 kelime ve 83 düğme, üç modülün ekran ve kelime sayıları)
H'nin taban kaydına girer (§4.3, H0).

### 1.3 Görünüş kuralları (v4)

1. **Renk sahipliği söyler:** mavi AYS, yeşil SPİ, turuncu ESP, mor Merkez. Yeşil ve
   kırmızı yalnız yön bildirir. Derslere, kategorilere ya da süse renk verilmez.
2. **Her modülde aynı iskelet** (§3). Göz her ekranda aynı yere bakar.
3. **Kesinlik yazıda görünür:** kutunun başında glif durur; ekranda yalnız *tahmin* olan
   sayının altı kesik çizilir. Ölçüldü ve hesaplandı düz yazılır; farkı köken kartı
   (üzerine gelince) söyler. Veri yoksa «—» yazılır, asla 0 yazılmaz.
4. **Açıklama ekranda değil ipucundadır.** Ekranda başlık, tek cümle, sayı ve eylem durur.
5. **Hap biçimi yalnız etkin sekmede ve rozette** kullanılır; her şey hap olmaz.

### 1.4 Biçim uyarlamaları — işlev korunur, biçim v4'e uyar

Katalogdan sapmalar yalnız bunlardır. Her birinde özelliğin «Neden» sütunu aynen korunur.

| Özellik | Katalogdaki biçim | Uyarlama | Neden |
|---|---|---|---|
| 140 Rütbe halkası | XP halkası | Üst çubukta çip: rütbe adı, «180/430», ince çizgi | Halka bütçesi; v4 böyle |
| 132 Ajan durum halkası | Portre çevresinde halka | Portrenin köşesinde durum noktası | Halka bütçesi |
| 49 Konu kapsam halkası | Halka | Konu tablosunda satır içi ince çubuk | Tablo satırında halka okunmaz |
| 76 + 86 Hareket haftası | İki ayrı haftalık görünüm | Tek hafta şeridi: yapılan dolu, planlı çerçeveli, dinlenme taralı, veri yok kesikli | Aynı şey iki yerde durmaz |
| 05 Hafta şeridi | Başlık altında ayrı şerit | Gün şeridindeki tarihe dokununca yedi güne açılır | Bugün'de ikinci bir şerit olmaz |
| 115 Bekleyen öneri rozeti | Üst çubukta mor sayaç | Masaüstünde Onaylar sekmesinin rozeti, telefonda üst çubukta | Onaylar tek çekmecede |
| 169 Alt sekme çubuğu | Dört sekme | Bugün · Plan · Çalışma · Menü, sağ altta + (166) | Katalogdaki 166 ile 169 birlikte |
| 66 Hedefe kalan | AYS Denemeler | Plan › Hedefler (karneden bağlantı) | Hedef tek yerde durur |

## 2. Görsel dil — T kurar, K yalnız bunu kullanır

| Konu | Vitrinin önerisi | v4 (kullanıcının seçtiği) | **Bu plan** |
|---|---|---|---|
| Varsayılan tema | Koyu | Açık | **Açık**; koyu, sistem ayarını izler ve elle seçilebilir (öneri, §8-6) |
| Yazı ailesi | Serif başlık + sans metin + mono sayı | Inter tek aile | **Inter tek aile**, rakamlar tablo hizalı (`tnum`); rol ayrımı boyut ve ağırlıkla yapılır. Inter depoda var (`*/src/fonts/`) (öneri, §8-5) |
| Açık renkler | ays #2B59E8 · spi #0F8F7E · esp #C97400 · mer #6D55E0 | ays #2D5BE3 · spi #0E8C79 · esp #C8741C · hkm #7453D4 | **v4 değerleri**, her birinin açık tonuyla (`v4-ornek.css`) |
| Açık zemin | bg #F6F6F7, kart #FFF | bg #F7F8FA, yüzey #FFF, çizgi #E8EAEE / #F1F2F5, metin #111318 / #5E6572 / #979EAA | **v4 değerleri** |
| Koyu renkler | bg #09090B … ink #EDEEF0; ays #4F86FF · spi #2EC4A9 · esp #F2A93B · mer #9A86FF | — | **Vitrinin koyu değerleri** |
| Yön renkleri | iyi #15803D · kötü #D93636 | ok #1E8A55 · bad #D0433B · şimdi #E5484D | **v4 değerleri** |
| Rütbe renkleri | bronz #B87333 · gümüş #C9CDD3 · altın #E3B341 · yakut #B31432 · safir #1E3FA8 · kutsal #C9A227 | — | Tek kaynak `brand/seviye/`; yalnız rütbe çipinde ve Rütbe ekranında |
| Boşluk | 4 · 8 · 12 · 16 · 24 · 32 | aynı | **Aynı** |
| Köşe | rozet 6 · düğme 8 · iç kart 10 · kart 14 | 8–16 | **Vitrin ölçeği** |
| Yüzey | Gölge yerine ton | İnce çizgi | **Ton + ince çizgi**; gölge yalnız açılır katmanda |
| Hareket | basma 120 · geçiş 200 · açılma 320 · giriş 700 ms; azaltılmış harekette 0 | — | **Aynı** |
| Paletler ve beş tasarım dili | — | — | **Kalkar.** Yerine Görünüm: Açık · Koyu · Sistem (öneri, §8-4) |

Jeton adları: `tokens.css`'teki mevcut adlar (`--bg`, `--surface`, `--text`, `--text-2`…)
**korunur**, değerleri değişir. Yeni ad yalnız eksikse eklenir (`--ays`, `--spi`, `--esp`,
`--mer` ve açık tonları). K bileşenlerinde ham renk, ölçü ve süre yazılmaz; H'nin aracı
bunu yakalar.

## 3. Ekran iskeleti — her modülde aynı

```
Üst çubuk   [LifeOS / AYS ▾]08  Bugün · Plan · Çalışma · Analiz · Onaylar(115) · Ofis · Kütüphanem · Ayarlar
            [Ara ⌘K]13  zil 09  bağlantı noktası 118  [Bronz 1.1 · 180/430]140  profil
Gün şeridi  09:00 ▮AYS ▮SPİ ▮ESP │şimdi 151│ … 22:00        «4 iş kaldı»      (01 · tarihe dokun → 05)
Sayfa başı  Başlık · kural motorunun tek cümlesi (04) · tarih ve veri tazeliği
ŞİMDİ       tek canlı öğe (12) — AYS: sıradaki blok (42, 43) · SPİ: tek dokunuş sayaçlar (73) · ESP: sıradaki iş
DURUM       2–4 kutu; her kutu 02 iskeletinde, sayılar kesinlik glifiyle (24)
            AYS: günlük sayaç (30, 29) · SPİ: toparlanma halkası (68) + ham/ortalama (70) · ESP: dakika halkası (91)
ÖNERİ       en çok bir mor kart (110): gerekçe (114) · «Neden?» (121) · kapsam (127) · çapraz etki (124)
            fazlası «+2 öneri Onaylar'da»
Telefon     üst çubuk: modül adı · mor sayaç · rütbe çipi  —  alt bant: Bugün · Plan · Çalışma · Menü (169) + sağ altta + (166)
            ayrıntılar alt çekmecede (162)
```

Anlık öğeler (A) Şimdi alanında belirir ve iş bitince çekilir: günün açılışı (06), gün
kapanışı (07), blok bitiş özeti (60), şüpheli giriş sorusu (18), enerji ölçeği (74).

### 3.1 Katalogdaki ekran adı → yeni yer (CEKMECE-HARITASI'na göre)

| Katalog | Yeni yer |
|---|---|
| AYS · Bugün · SPİ · Günlük · ESP · Bugün | **Bugün** |
| AYS · Hafta | Plan › Hafta |
| AYS · Denemeler | Çalışma › Deneme (hedefler Plan › Hedefler'de) |
| AYS · Dersler · Soru çöz · Tekrar | Çalışma › Konu çalış · Soru çöz · Tekrar |
| SPİ · Testler · Öğünler · Hareket · Finans | Çalışma › Testler · Öğün · Hareket · Bütçe |
| ESP · Dil Stüdyosu · Kütüphane · Kronoloji · Felsefe | Çalışma › Dil · Okuma · Tarih · Felsefe |
| ESP · Merdiven | Plan › Merdiven |
| AYS/SPİ/ESP · Analiz | **Analiz** (bölüm çubuğuyla, 19) |
| Öneri, King teklifi, ofis önerisi, BAM çıktısı | **Onaylar** › Bekleyen · Geçmiş |
| AYS · Ofis · SPİ/ESP · Masalar · Toplantı | Ofis › Masalar · Toplantı |
| SPİ/ESP · Rütbe · AYS · İlerleme | Rütbe: üst çubuktaki çipten açılır, Ayarlar › Rütbe'de durur (karar §8-2) |
| Ayarlar | Ayarlar › Profil · Görünüm · Veri ve yedek · Bildirim · Merkez · Ofis · Rütbe · Rehber |
| Kabuk | Üst çubuk + telefon alt bandı |
| Merkez · HKM yüzü | HKM web (T6 / K7, kullanıcı onayıyla) |

## 4. Roller

### 4.1 KARTLAR (K)

**İş:** Ek A'da sahibi K olan 146 özellik. **Sıra dalga dalgadır:** önce bütün P1'ler (32),
sonra P2 (79), sonra P3 (35). Her dalgada modül sırası, T'nin teslim ettiği sıradır
(AYS → SPİ → ESP).

| Adım | Ne | Nerede | Koşul |
|---|---|---|---|
| **K1** | Ortak bileşenler ve mantık. P1 önce: sayı bileşeni (24, 25, 26, 28, sonra 15, 170) · grafik parçaları (27, 35, 37, 41, sonra 29–34, 36, 38–40) · öneri kartı ve onay kalıbı (110, 111, 114, 121, sonra 112, 113, 123, 124, 127) · geri al şeridi (150) · tek sözlük (16) · sonucu söyleyen düğme (22) · güven (173, 177, 179) · şüpheli giriş (18) · model kapalı kipi (139) · otomatik uygula (116) | Yeni dosyalar: `brand/ortak/sayi.js`, `grafik.js`, `oneri.js`, `sozluk.js`, `guven.js` (+ `.test.js`) ve stil için tek dosya `brand/ortak/kart.css`. Çekirdek mantık gerekiyorsa ilgili `core/*.js` sahiplenerek (§5) | Hemen başlar. **Ekran dosyalarına dokunmaz** |
| **K2** | P1'leri ekranlara yerleştirir: Bugün (04, 42, 60, 68, 70, 73, 110), Çalışma (46, 35, 55, 89), Analiz (27, 37, 41), Ofis (129, 139), onay ve öneri kalıbı (111, 112, 121) | Teslim alınan modülün `screens/*.js` dosyaları | Modül T'den teslim alındıktan sonra. **Ertelendi (§8-10): sonraki iş** |
| **K3** | P2 dalgası, ekran ekran: Bugün → Çalışma ve Plan → Analiz → Onaylar ve Ofis → Ayarlar | aynı | K2 bitince. **Ertelendi (§8-10)** |
| **K4** | P3 dalgası (Rütbe ekranı, ESP'nin P3'leri, grafik ekleri) | aynı | K3 bitince; T boşalırsa bir kısmını devralır (§6). **Ertelendi (§8-10)** |
| **K5** | Telefon: 164 bildirim kartı, 167 ana ekran bileşeni. **Tarayıcı uygulamasında ana ekran bileşeninin yolu doğrulanmadı**: önce araştır; yol yoksa kullanıcıya söyle, uydurma | `brand/ortak/pwa.js`, `sw.js` | P2/P3 sırasında |
| **K6** | HKM yüzü kartları: 119, 120, 126 | `HKM/web/` | Yalnız kullanıcı onayıyla (§5). Kart yerleştirme olduğu için **ertelendi (§8-10)** |
| **K7** | **HKM yüzünün aynı dile geçmesi (eski T6, §8-9).** Kullanıcı onayı verildi: `HKM/web/` bu iş için K'nindir | `HKM/web/` | Şimdi. HKM'de başka bir oturum çalışıyorsa önce onunla çakışmayı denetle |

**K'nin kuralları**

- P1 kartının kabul ölçütü, testin **ilk satırıdır**. Test adında özelliğin numarası
  geçer: `oz-042 …`.
- Ekrandaki her özelliğin kök öğesi `data-oz="042"` taşır. H'nin envanteri bunu sayar.
  Kendi yüzeyi olmayan (B katmanı) özellik, `oz-NNN` adlı birim testiyle sayılır.
- Sayıyı ve kararı **kod** üretir. Model yalnız cümle kurar. Modelin cümlesi sayının
  altında, ayrı durur (114, 129).
- Sınırlar: SPİ teşhis koymaz ve doz önermez (71, 78 ve 84 yalnız aralığı gösterir,
  yorum yapmaz); ESP ve AYS sertifika vermez ve yetenek yargısı kurmaz (49, 93).
- Renk, boşluk, köşe ve süre için yalnız T'nin jetonları kullanılır.

### 4.2 TASARIM (T)

**İş:** Ek A'da sahibi T olan 37 özellik ve bugünkü bütün ekranların yeni iskelete
geçmesi. Hiçbir işlev kaybolmaz; H'nin taban envanteri bunu denetler.

| Adım | Ne | Nerede | Koşul |
|---|---|---|---|
| **T0** | §8'deki kararları kullanıcıya **tek mesajda** sor. Cevabı bu dosyanın §8'ine ve `CEKMECE-HARITASI.md`'ye işle | — | İlk iş. Cevabı beklerken T1 sürer |
| **T1** | Temel: jetonlar (§2), açık ve koyu tema, Inter, boşluk, köşe ve hareket ölçekleri. `designs.css` ve paletlerin kalkması (§8-4 cevaplanınca). Temel bileşenler: kart iskeleti (02), düğme, çip, rozet, alt çekmece (162), ipucu kabı; renksiz ayrım (165: modül = renk + harf + şekil) | `brand/ortak/base.css`, `layout.css`, `designs.css`, `*/src/css/*`, `*/src/fonts/`, `*/src/js/core/components.js` | Hemen |
| **T2** | Kabuk: üst çubuk (08, 13, 09, 118, 140, 115), gün şeridi (01, 151, 05, 163), modül geçiş rengi (155), telefon alt bandı (169, 166, 160) | `*/src/index.html`, `*/src/js/app.js` | **Kapı 1:** H0 tamam (taban kaydedildi) |
| **T3** | Çekmece düzeni, modül modül (AYS → SPİ → ESP): menü sekiz çekmece; iç sekmeler kartlara ve bölüm çubuğuna (19) döner; Bugün üç alan iskeleti (03) ve sayfa başı yuvası; onaylar tek çekmecede; boş durum (10) ve sakin hata (11) kalıpları; «Plan › Hafta» gibi yol yazısı. Her modül bitince **teslim** (§6) | `*/src/js/screens/*.js` + kabuk | Kapı 1 + T0 cevabı |
| **T4** | Hareket ve odak: 12, 14, 149, 152–154, 156, 158, 159; azaltılmış harekette 0 | CSS + `components.js` | T3 (ESP) bitince |
| **T5** | Ayarlar düzeni (21, 181, 182, 183), ilk açılış (171), gizlilik kilidi (176), «Ne değişti?» (17) | Ayarlar ekranları, `tanitim.*` | T4 bitince |
| **T6** | HKM yüzünün aynı dile geçmesi | `HKM/web/` | **K'ye geçti (§8-9): K7.** T'nin işi T5'te biter |

**T'nin kuralları**

- Bir ekranı taşırken işlevini **değiştirmez**. Davranış değişikliği gerekiyorsa K'ye ya da
  H'ye yazar.
- Teslimden sonra o modülün ekran dosyalarına yalnız K'ye yazarak dokunur. CSS ve
  `app.js` T'de kalır.
- `STIL.md` dosyalarını yeni dile göre günceller.

### 4.3 HATA (H)

**İş:** ölçmek, bulmak, düzeltmek. Özellik yapmaz; özelliklerin doğru ve eksiksiz geldiğini
kanıtlar.

| Adım | Ne | Nerede | Koşul |
|---|---|---|---|
| **H0** | **Taban envanteri** (`tools/envanter.js`): üç modülü açar, her ekranı ve iç sekmeyi gezer; her eylemi (`data-act`), ayar anahtarını ve ekran adını kaydeder. Taban bir kez üretilir ve kayıt olarak durur: `ekip/envanter/taban-2026-09-24.json`. Sonraki koşumlar tabanla karşılaştırır: tabandaki her eylem erişilebilir mi, hangi katmanda? Kullanıcının onayladığı «bilerek kaldırıldı» listesi dışında kayıp **0** olmalıdır | `tools/` | **İlk iş.** T2 ve T3 bunu bekler (Kapı 1) |
| **H0b** | T3'ün yeniden yazacağı ekranlara **işleyici testleri**. DEVIR'deki ölçüme göre en düşük kapsam burada: AYS learn/guide/exams %6–8, ESP studio/symposium/history %6–7. Taşımadan önce düğmelerin ne yaptığı testle sabitlenir | `*/src/tests/` | H0'dan hemen sonra; T3 hangi modüldeyse önce o |
| **H1** | **Sadelik denetimi** (`tools/sadelik.js`): §1.2'deki eşikler, 1440 ve 390 px genişlikte, açık ve koyu temada. **Katalog kapsamı**: `data-oz` ve `oz-NNN` sayımı, «183'ten N'i yerinde» | `tools/` | H0'dan sonra; CI'a eklenir (`.github/`) |
| **H2** | **Push takibi:** K ve T'nin her push'unda, dokunulan sistemin testleri, duman, a11y, 390 px, palet, envanter ve sadelik denetimleri koşar. Kırmızı çıkarsa bulguyu sahibine yazar (§7) | — | Sürekli |
| **H3** | **Bağımsız tarama:** etiketsiz sayı, eksik verinin 0 görünmesi, renk sahipliğinin kırılması, morun Merkez dışında kullanılması, XP'nin başka ekrana sızması, ekranda ASCII Türkçe, koyu temada kontrast, azaltılmış hareket, beş yıllık veriyle çizim (`loadcheck.js`) ve çizim bütçesi (`perfcheck.js`) | — | Sürekli |
| **H4** | **Tam koşum:** her modül teslimi sonrası ve plan sonunda `python3 tools/sayilar.py --tam --yaz`. **Bunu yalnız H koşar** (tek koşucu; ayrı `git worktree` içinde) | — | Kapılarda |

**H'nin kuralları**

- Sahipsiz koddaki hatayı kendisi düzeltir. Önce hatayı yakalayan test yazılır.
- K ya da T'nin sahip olduğu dosyadaki hatada düzeltmez. Kırmızı testi ve bulguyu yazar,
  sahibi düzeltir. İstisna: sahibi EKIP-DURUM'da «H düzeltsin» derse.
- Bulgu biçimi AGENTS §4: `dosya:satır · ne yanlış · hangi girdide bozulur · nasıl doğrulanır`.
  Emin değilse «göremedim» yazar.

## 5. Dosya sahipliği — iki kişi aynı dosyaya aynı anda yazmaz

| Yol | Sahip | Not |
|---|---|---|
| `*/src/css/*`, `brand/ortak/{base,layout,designs,simge,tanitim}.css`, `*/src/fonts/`, `brand/seviye/` görünümü | **T** | K'nin stili yalnız `brand/ortak/kart.css`'te durur |
| `*/src/index.html`, `*/src/js/app.js` (menü, yönlendirme, kabuk), `*/src/js/core/components.js` | **T** | K'nin `components.js`'e ekleme ihtiyacı T'ye yazılır |
| `*/src/js/screens/*.js` | Modül tesliminden önce **T**, sonra **K** | Teslim EKIP-DURUM'daki teslim tablosunda görünür |
| `brand/ortak/{sayi,grafik,oneri,sozluk,guven}.js` ve testleri, `brand/ortak/kart.css`, `kesinlik.*`, `yedek.js`, `yedekag.js`, `ofis.js`, `pwa.js` | **K** | |
| `tools/ortak.py` listesi | Herkes yalnız **kendi satırını** ekler | Satır eklemek çakışmaz |
| `*/src/js/core/*.js` (`components.js` dışında) | Varsayılan **H**; K **sahiplenerek** | K, EKIP-DURUM'daki kendi bölümüne «sahiplendim: SPI/src/js/core/quickentry.js» yazıp push eder; H o dosyaya dokunmaz. İş bitince satırı siler |
| `tools/*`, `*/tools/*`, `.github/*` | **H** | Yeni denetim isteği H'ye yazılır |
| `*/src/tests/*` | Yeni dosyayı yazan; var olan dosyada sona ekleme serbest | Var olan testi değiştirmek ya da silmek yalnız H yapar, gerekçesiyle |
| `*/dist/*`, `*/src/js/data/build.js` | Herkes kendi commit'inde üretir | Çakışma kuralı §7 |
| `ekip/EKIP-DURUM.md` | Herkes yalnız **kendi bölümüne** yazar | Teslim tablosuna T, bulgu özetine H yazar |
| `ekip/HATALAR.md` | **H** (Tur 2 bulguları en üste, `T2-` koduyla) | Tur 1 kapalı; kodda ona bağlantı var, silinmez |
| `ekip/CEKMECE-HARITASI.md`, `*/src/STIL.md` | **T** | |
| `README.md`, `NOTLAR.md` | **H** | Sayılar elle yazılmaz |
| `ekip/EKIP-PLANI.md`, `TASARIM-OZELLIKLERI.md`, `vitrin.html`, `tasarim/` | **Değişmez** | Yalnız kullanıcı kararıyla; commit mesajında «plan değişikliği» yazar |
| `HKM/`, `ekip/DEVIR.md`, `ekip/PLAN.md`, `ekip/arsiv/` | **Bu ekibin değil** | HKM'de ayrı bir oturum çalışıyor olabilir. İstisna (§8-9): HKM yüzünün dili (K7) için `HKM/web/` K'nindir |

## 6. Sıra, kapılar ve teslimler

| Adım | TASARIM | KARTLAR | HATA |
|---|---|---|---|
| 1 | T0 kararları sor · T1 temel | K1 ortak bileşenler (P1 önce) | **H0 taban envanteri** · H0b işleyici testleri · H1 sadelik |
| — | **Kapı 1:** H0 tamam → T2 ve T3 başlayabilir | | |
| 2 | T2 kabuk · T3 AYS | K1 sürer | T1'i denetler · H2 |
| — | **Teslim AYS** → K alır · H4 tam koşum | | |
| 3 | T3 SPİ | K2: AYS P1 | AYS'de envanter kaybı 0 mı, sadelik bütçesi yeşil mi · H2, H3 |
| — | **Teslim SPİ** | | |
| 4 | T3 ESP | K2: SPİ P1 | aynı, SPİ için |
| — | **Teslim ESP** | | |
| 5 | T4 hareket · T5 ayarlar | K2: ESP P1 → K3: P2 dalgası | aynı, ESP için · H4 |
| 6 | K'nin P3 listesinden devralır (EKIP-DURUM'da anlaşarak) · T6 (onayla) | K3 → K4 · K5 · K6 (onayla) | Dalga sonlarında H4 |
| — | **Plan değişikliği (§8-9, §8-10):** T, T5'te biter; HKM yüzü K'de (K7); kartların ekranlara yerleşmesi (K2–K4, K6) sonraki işe kaldı | K7 | K7'yi denetler |

**Teslim** (T yapar): o modülün bütün ekranları iskelette; H0 tabanındaki her eylem
erişilebilir; runtests, duman, a11y, 390 px ve palet temiz. T, EKIP-DURUM'un teslim
tablosuna commit kimliğiyle yazar. Bu satır push edildiği anda o modülün `screens/*.js`
dosyaları K'nindir.

**Bir özellik ne zaman bitmiş sayılır:**

1. Kabul ölçütü (P1) ya da katalogdaki «Ne yapar» cümlesi testte yazılı ve test yeşil.
2. `data-oz` işareti ya da `oz-NNN` testi var; envanter onu sayıyor.
3. Katalogdaki «Neden» cümlesi ekranda doğru.
4. Açık ve koyu tema, 390 px, a11y, palet ve duman testi temiz; sadelik bütçesi aşılmıyor.
5. `python3 build.py` ile dist aynı commit'te derlendi.
6. EKIP-DURUM'daki kendi bölümünde satırı var (numara + commit).

**Plan ne zaman biter:** envanter «183/183 yerinde» ve «taban kaybı 0» der; sadelik
bütçesi yeşildir; bütün CI işleri yeşildir; H4 tam koşumu temizdir.

## 7. Üçü için çalışma kuralları

1. **Başlarken:** `git fetch origin main` → `git rebase origin/main` → EKIP-DURUM'u oku.
2. **Küçük commit, sık push.** Her özellikten ya da her ekrandan sonra. Push öncesi yeniden
   `git fetch` + `git rebase origin/main`, sonra `git push origin HEAD:main`. **Force-push
   yok, PR yok.**
3. **Commit mesajı:** `[K] 042 Sıradaki blok kahramanı (AYS Bugün)`, `[T] T3 AYS: Plan
   çekmecesi`, `[H] T2-04 …`. Sona oturumun atıf satırları eklenir.
4. **dist çakışması:** rebase sırasında `*/dist/*` ya da `*/src/js/data/build.js` çakışırsa
   `git checkout --ours -- <dosya>` ile main'deki alınır (rebase'de «ours» main'dir), o
   modülde `python3 build.py` ile yeniden üretilir, testler koşar, sonra `git add` +
   `git rebase --continue`. Kaynak dosyada çakışma olursa o dosyanın sahibi çözer.
5. **Her push öncesi, dokunduğun her modülde:** `python3 build.py` ·
   `node tools/runtests.js` · `node tools/smoke.js` · `node tools/a11ycheck.js` ·
   `node tools/layoutcheck.js` · `node tools/palettecheck.js`. Kökte:
   `python3 tools/ortak.py --yay` ardından `--denetle` · `python3 tools/seviye.py --denetle` ·
   `python3 tools/marka.py --sina`. Tarayıcı: `CHROMIUM_PATH=/opt/pw-browsers/chromium`
   (ilk kez `npm ci`).
6. **Önce test.** Yeni davranış testsiz gelmez; düzeltilen her hatanın önce kırmızı testi
   yazılır.
7. **Doktrin (AGENTS §1) her kararın üstündedir:** sayıyı ve kararı kod üretir; eksik veri
   sıfır değildir; sıfır çalışma zamanı bağımlılığı vardır; HKM modüle yazmaz, teklif
   bırakır; XP karar vermez; aksiyonların üç seviyesi vardır; ekrandaki metin düzgün
   Türkçedir.
8. **Bulgu yazmak:** H `ekip/HATALAR.md`'ye yazar ve EKIP-DURUM'daki bulgu özetine
   `T2-NN → K` gibi bir satır ekler. Sahip düzeltince kendi bölümüne `T2-NN ✅ <commit>`
   yazar.
9. **Kullanıcıya soru** yalnız karar gerektiğinde sorulur ve tek mesajda toplanır. Cevap
   beklenirken bağımsız iş sürer. Katalogda olmayan yeni özellik önerilmez; fikir
   EKIP-DURUM'da «öneri» satırı olarak kalır.
10. **Oturum biterken ya da limit yaklaşırken:** EKIP-DURUM'daki kendi bölümünü güncelle
    (ne bitti, ne yarım, sıradaki ne), commit + push. Push edilmemiş iş kaybolur;
    konteyner geçicidir.
11. `tools/sayilar.py --yaz` yalnız H koşar. Açık sunucu ve `HKM/config.json` bırakılmaz.

## 8. Kullanıcı kararları

T0'da sorulur. **Cevap gelene kadar T2'nin menüsü ve T3 başlamaz**; T1, K1 ve H0 kararlardan
bağımsızdır.

| # | Karar | Öneri |
|---|---|---|
| 1 | Sekiz çekmece (Bugün · Plan · Çalışma · Analiz · Onaylar · Ofis · Kütüphanem · Ayarlar) ad ve sırasıyla uygun mu? | Evet |
| 2 | Rütbe nerede dursun? | Ayarlar › Rütbe; üst çubuktaki rütbe çipi de oraya açılır |
| 3 | Telefon alt bandı? | Bugün · Plan · Çalışma · Menü + sağ altta +; Onaylar üst çubuktaki mor sayaçtan açılır (katalog 115, 166, 169) |
| 4 | Paletler ve beş tasarım dili kalksın mı? | Evet; yerine Görünüm: Açık · Koyu · Sistem |
| 5 | Yazı: Inter tek aile mi, vitrinin üçlüsü (serif + sans + mono) mu? | Inter tek aile (v4) |
| 6 | Varsayılan tema? | Açık (v4); koyu sistemden ya da elle |
| 7 | ESP'nin altı disiplini tek Çalışma çekmecesinde bölüm olarak mı dursun? | Evet |
| 8 | HKM yüzü bu ekiple mi aynı dile geçsin (T6, K6)? | Evet, en sonda |

Cevaplar (kullanıcı, 2026-09-24: «önerilerini uygula»): **sekizi de öneri gibi.**
1 evet, sekiz çekmece bu ad ve sırayla · 2 Ayarlar › Rütbe, üst çubuktaki çip oraya açılır ·
3 Bugün · Plan · Çalışma · Menü + sağ altta +; Onaylar üst çubuktaki mor sayaçtan ·
4 paletler ve beş düzen kalkar, yerine Görünüm: Açık · Koyu · Sistem · 5 Inter tek aile ·
6 varsayılan açık, koyu sistemden ya da elle · 7 ESP'nin altı disiplini tek Çalışma
çekmecesinde bölüm · 8 HKM yüzü de bu dile geçer, en sonda (T6, K6).

**Sonraki kararlar (kullanıcı, 2026-09-24, T5 bitince):**

| # | Karar | Cevap |
|---|---|---|
| 9 | HKM yüzünü kim yapsın (T6)? | **K yapar** (K7). Kullanıcı onayı verildi |
| 10 | Kartlar ekranlara şimdi yerleşsin mi (K2–K4, K6)? | **Hayır, sonraki iş** — ertelendi |
| 11 | AYS kurulumu beş adım mı kalsın, üçe mi insin (171)? | **K uygun gördüğü gibi** karar verir |
| 12 | Kilitte «Kodu unuttum» ne kadar bekletsin (176; bugün 60 sn, sonra kilit kalkar)? | **K uygun gördüğü gibi** karar verir |

## 9. Başlatma mesajları — kullanıcı her Claude'a bir tanesini gönderir

**KARTLAR için:**

> LifeOS deposunda üç Claude'luk bir ekip kuruldu; sen **KARTLAR (K)** rolündesin. Diğer
> ikisi TASARIM (T) ve HATA (H). `git fetch origin main` ile main'i al ve sırayla oku:
> `AGENTS.md`, `ekip/EKIP-PLANI.md` (tamamı; senin bölümün §4.1, özellik listen Ek A'da
> sahibi K olanlar), `ekip/TASARIM-OZELLIKLERI.md`, `ekip/EKIP-DURUM.md`.
> `ekip/vitrin.html`'i tarayıcıda açıp kartların canlı örneklerine, `ekip/tasarim/`
> görsellerine bak. K1 ile başla: ekran dosyalarına dokunmadan P1 ortak bileşenler.
> §5'teki dosya sahipliğinin dışına çıkma. Her teslimden sonra EKIP-DURUM'daki kendi
> bölümünü güncelle ve main'e push et.

**TASARIM için:**

> LifeOS deposunda üç Claude'luk bir ekip kuruldu; sen **TASARIM (T)** rolündesin. Diğer
> ikisi KARTLAR (K) ve HATA (H). `git fetch origin main` ile main'i al ve sırayla oku:
> `AGENTS.md`, `ekip/EKIP-PLANI.md` (tamamı; senin bölümün §4.2), `ekip/CEKMECE-HARITASI.md`,
> `ekip/EKIP-DURUM.md`. Hedef görünüm `ekip/tasarim/v4-*.png` ve `v4-ornek.css`'tedir;
> `ekip/vitrin.html` kartların örnekleridir. İlk iş T0: §8'deki kararları bana tek mesajda
> sor. Cevabı beklerken T1 temeli kur. T2 ve T3 için H'nin taban envanterini bekle
> (Kapı 1). Her modül bitince EKIP-DURUM'daki teslim tablosuna yaz ve main'e push et.

**HATA için:**

> LifeOS deposunda üç Claude'luk bir ekip kuruldu; sen **HATA (H)** rolündesin. Diğer ikisi
> KARTLAR (K) ve TASARIM (T). `git fetch origin main` ile main'i al ve sırayla oku:
> `AGENTS.md`, `ekip/EKIP-PLANI.md` (tamamı; senin bölümün §4.3), `ekip/EKIP-DURUM.md`,
> `ekip/HATALAR.md` (Tur 1 kapalı, biçim için). İlk iş **H0 taban envanteri**: T'nin menü
> değişikliği onu bekliyor. Sonra H0b işleyici testleri ve H1 sadelik denetimi. Ardından
> K ve T'nin her push'unu denetle; kırmızıyı sahibine yaz, sahipsiz hatayı kendin düzelt.
> Tam koşumu yalnız sen koşarsın.

---

## Ek A · 183 özellik — sahip, yer, katman, sıra

**Sahip:** K kartlar · T tasarım. **Katman** (§1.1): G görünür · B biçim · D bir dokunuş ·
A anlık · Y ayar · İ ipucu · Dış. **Sıra:** K için dalga (P1 → P2 → P3),
T için adım (T1–T5). Katalogdaki «Ekran» adlarının karşılığı §3.1'dedir.

### A · Ortak tasarım dili (23)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 01 | Modül şeridi | P1 | T | 3 modül · Bugün: gün şeridi ve «Günün akışı»; bildirim ve ⌘K listeleri | G | T2 |  |
| 02 | Tek kutu iskeleti | P1 | T | Her ekran · kart başlığı | B | T1 | Kart bileşeni: simge · ad · sağda kesinlik yuvası (içini K doldurur) |
| 03 | Üç alan düzeni | P1 | T | 3 modül · Bugün | B | T3 | Şimdi → Durum → Öneri yuvaları |
| 04 | Sayfa başı cümlesi | P1 | K | 3 modül · Bugün · sayfa başı | G | P1 | Yuvayı T açar; cümle kural motorundan |
| 05 | Hafta şeridi | P2 | T | 3 modül · Bugün | D | T2 | Ayrı şerit yok: gün şeridindeki tarihe dokununca yedi güne açılır |
| 06 | Günün açılışı | P2 | K | 3 modül · Bugün | A | P2 | Günün ilk açılışında Şimdi alanında bir kez |
| 07 | Gün kapanışı | P2 | K | 3 modül · Bugün | A | P2 | Akşam gün kapanınca Şimdi alanında |
| 08 | Modül geçiş menüsü | P2 | T | Kabuk · logo | D | T2 |  |
| 09 | Gruplu bildirimler | P2 | T | Kabuk · zil | D | T2 |  |
| 10 | Boş durum sahnesi | P2 | T | Her ekran | A | T3 | Yalnız veri yokken; tek eylem |
| 11 | Sakin hata durumu | P2 | T | Her ekran | A | T3 |  |
| 12 | Tek canlı öğe | P2 | T | Her ekran | B | T4 |  |
| 13 | Gruplu komut sonuçları · MEVCUT | P2 | T | Kabuk · ⌘K | D | T2 | Var olan komut paleti giydirilir |
| 14 | Odak kapısı · MEVCUT | P2 | T | AYS Soru çöz · ESP Dil | D | T4 | Var olan odak kipi giydirilir |
| 15 | Son bilinen değer | P2 | K | Her ekran · sayı bileşeni | B | P2 |  |
| 16 | Terim ipucu | P1 | K | Her ekran · terimler | İ | P1 | Tek sözlük: brand/ortak/sozluk.js |
| 17 | Ne değişti? | P3 | T | Kabuk | A | T5 |  |
| 18 | Şüpheli giriş sorusu | P1 | K | SPİ Bugün girişleri · AYS Soru çöz | A | P1 |  |
| 19 | Bölüm çubuğu | P2 | T | Uzun bölümler (Deneme, Analiz, Okuma) | G | T3 | İç sekmelerin yerine geçer |
| 20 | Etkin süzgeç çipleri | P2 | K | Analiz ve listeler | A | P2 | Yalnız süzgeç açıkken görünür |
| 21 | Kaydedilmemiş değişiklik | P2 | T | Ayarlar | A | T5 |  |
| 22 | Sonucu söyleyen düğme | P1 | K | Her ekran · yıkıcı düğmeler | B | P1 |  |
| 23 | Yazılabilir gün penceresi · MEVCUT | P2 | K | Tarih seçiciler | B | P2 | Kural var; ekranda gösterimi eklenir |

### B · Sayı ve veri (18)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 24 | Kesinlik glifleri · MEVCUT | P1 | K | Her ekran · sayı bileşeni | B | P1 | Glif kutu başında; yalnız tahmin kesik altı çizili (var olan kesinlik.js üstüne) |
| 25 | Köken kartı | P1 | K | Her ekran · sayı bileşeni | İ | P1 |  |
| 26 | Veri tazeliği | P1 | K | SPİ Bugün · SPİ Testler | B | P1 |  |
| 27 | Eksik gün boşluğu | P1 | K | Bütün grafikler | B | P1 |  |
| 28 | Anlamlı fark rozeti | P1 | K | Her ekran · fark rozetleri | B | P1 |  |
| 29 | Eşik çizgili çubuk | P2 | K | AYS Bugün · AYS Tekrar | B | P2 |  |
| 30 | Tik sayacı | P2 | K | AYS Bugün · günlük sayaç | B | P2 |  |
| 31 | Hedef bandı | P2 | K | SPİ Analiz | B | P2 |  |
| 32 | Geçen dönem gölgesi | P3 | K | 3 modül · Analiz | D | P3 | Grafik başındaki «Geçen dönem» anahtarıyla |
| 33 | Gelecek yük grafiği | P2 | K | AYS Tekrar · ESP Dil | G | P2 |  |
| 34 | Grafiğin cümlesi | P2 | K | Bütün grafikler | B | P2 | Grafik başlığının ve açıklamasının yerine geçer |
| 35 | Aralık çubuğu | P1 | K | AYS Deneme · sıralama tahmini | B | P1 |  |
| 36 | Dağılım şeridi | P3 | K | SPİ Analiz · uyku kartı | D | P3 |  |
| 37 | Güvenli eğilim | P1 | K | 3 modül · Analiz | B | P1 |  |
| 38 | Satır içi çubuklu tablo | P2 | K | AYS Analiz tabloları | B | P2 |  |
| 39 | Hız tahmini | P2 | K | AYS Plan › Hedefler | D | P2 | «Hedefe kalan» satırından açılır |
| 40 | Birikim eğrisi | P3 | K | AYS Analiz | D | P3 |  |
| 41 | Veri doluluğu | P1 | K | 3 modül · Analiz başı | G | P1 |  |

### C · AYS (26)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 42 | Sıradaki blok kahramanı | P1 | K | AYS Bugün · Şimdi | G | P1 |  |
| 43 | Geri sayım rozeti | P2 | K | AYS Bugün · kahramanın içinde | B | P2 |  |
| 44 | Nötr soru şeridi | P2 | K | AYS Çalışma › Soru çöz | B | P2 |  |
| 45 | Yanlış kartı | P2 | K | AYS Çalışma › Tekrar | D | P2 |  |
| 46 | Deneme karnesi | P1 | K | AYS Çalışma › Deneme | G | P1 |  |
| 47 | Hız şeridi | P2 | K | AYS Çalışma › Deneme · ayrıntı | D | P2 |  |
| 48 | Deneme karşılaştırması | P2 | K | AYS Çalışma › Deneme | D | P2 |  |
| 49 | Konu kapsam halkası | P2 | K | AYS Çalışma › Konu çalış · tablo içinde | B | P2 | Halka yerine satır içi ince çubuk (halka bütçesi) |
| 50 | Konu zinciri | P3 | K | AYS Çalışma › Konu çalış · ayrıntı | D | P3 |  |
| 51 | 40 hafta çizgisi | P2 | K | AYS Plan › Hafta · başlık altı | G | P2 |  |
| 52 | Haftalık plan ızgarası | P2 | K | AYS Plan › Hafta | G | P2 |  |
| 53 | Ara haftası önizlemesi | P2 | K | AYS Plan › Hafta | A | P2 | Orta aksiyon önizlemesi |
| 54 | Taşıma gölgesi | P2 | K | AYS Plan › Hafta | B | P2 |  |
| 55 | Tek satır soru ekle | P1 | K | AYS Çalışma › Soru çöz · üst satır | G | P1 |  |
| 56 | Yanlış nedenleri | P2 | K | AYS Çalışma › Soru çöz · set sonu | A | P2 |  |
| 57 | Deneme takvimi | P2 | K | AYS Çalışma › Deneme | G | P2 |  |
| 58 | Soru ekranı · MEVCUT | P2 | K | AYS Çalışma › Soru çöz | G | P2 |  |
| 59 | Tekrar paketi | P2 | K | AYS Çalışma › Tekrar | G | P2 |  |
| 60 | Blok bitiş özeti | P1 | K | AYS Bugün | A | P1 |  |
| 61 | Ders dengesi | P2 | K | AYS Plan › Hafta | D | P2 |  |
| 62 | Deneme girişi | P2 | K | AYS Çalışma › Deneme | D | P2 | «Deneme gir» alt çekmecede |
| 63 | Konu tablosu | P2 | K | AYS Çalışma › Konu çalış | G | P2 |  |
| 64 | Hedef ayarı | P2 | K | AYS Bugün · sayaca dokununca | D | P2 |  |
| 65 | Tekrar takvimi çizgisi | P3 | K | AYS Çalışma › Tekrar · yanlış kartı ayrıntısı | D | P3 |  |
| 66 | Hedefe kalan | P2 | K | AYS Plan › Hedefler | G | P2 | Katalogda Denemeler; hedef tek yerde durur, karneden bağlantı |
| 67 | Ders işaretleri | P2 | K | AYS · her ders gösterimi | B | P2 |  |

### D · SPİ (21)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 68 | Toparlanma halkası | P1 | K | SPİ Bugün · Durum | G | P1 | Ekrandaki tek halka |
| 69 | Uyku bandı | P2 | K | SPİ Bugün · uyku satırına dokununca | D | P2 |  |
| 70 | Ham + ortalama çizgisi | P1 | K | SPİ Bugün · Durum | G | P1 |  |
| 71 | Referans bandı | P2 | K | SPİ Çalışma › Testler | B | P2 |  |
| 72 | Tabak görünümü | P2 | K | SPİ Çalışma › Öğün | G | P2 |  |
| 73 | Tek dokunuş sayaç | P1 | K | SPİ Bugün · Şimdi | G | P1 |  |
| 74 | Enerji ölçeği | P2 | K | SPİ Bugün | A | P2 | Günde bir kez sorulur, cevaplanınca gider |
| 75 | Set kutucukları | P2 | K | SPİ Çalışma › Hareket · antrenman sırasında | G | P2 |  |
| 76 | Haftalık hareket halkaları | P2 | K | SPİ Çalışma › Hareket | G | P2 | 86 ile TEK hafta şeridi; halka yerine yedi işaret |
| 77 | Ölçüm tuş takımı | P2 | K | SPİ Bugün · ölçüme dokununca | D | P2 |  |
| 78 | Sonraki kontrol kartı | P3 | K | SPİ Çalışma › Testler | G | P3 |  |
| 79 | Harcama şeritleri | P2 | K | SPİ Çalışma › Bütçe | G | P2 |  |
| 80 | Öğün çizelgesi | P2 | K | SPİ Çalışma › Öğün | G | P2 |  |
| 81 | Yoğunluk bölgeleri | P3 | K | SPİ Çalışma › Hareket · ayrıntı | D | P3 |  |
| 82 | Harcama takvimi | P3 | K | SPİ Çalışma › Bütçe | D | P3 |  |
| 83 | Uyku düzeni | P2 | K | SPİ Analiz | G | P2 |  |
| 84 | Tahlil karşılaştırması | P2 | K | SPİ Çalışma › Testler | D | P2 |  |
| 85 | Öğün şablonları | P2 | K | SPİ Çalışma › Öğün · hızlı ekle | G | P2 |  |
| 86 | Antrenman haftası | P2 | K | SPİ Çalışma › Hareket | G | P2 | 76 ile aynı şerit |
| 87 | Düzenli giderler | P3 | K | SPİ Çalışma › Bütçe | G | P3 | En yakını tek satır; liste açılır |
| 88 | Ölçüm hatırlatıcısı | P2 | K | SPİ Ayarlar › Bildirim · Bugün | Y | P2 |  |

### E · ESP (21)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 89 | Deste yığını | P1 | K | ESP Çalışma › Dil · kart sahnesi | B | P1 |  |
| 90 | Süreli cevap düğmeleri | P2 | K | ESP Çalışma › Dil | B | P2 |  |
| 91 | Dakika halkası | P2 | K | ESP Bugün · Durum | G | P2 | Ekrandaki tek halka |
| 92 | Unutma eğrisi | P2 | K | ESP Çalışma › Dil · «neden bugün?» | İ | P2 |  |
| 93 | Merdiven basamakları · MEVCUT | P2 | K | ESP Plan › Merdiven | G | P2 |  |
| 94 | Kütüphane rafı · MEVCUT | P3 | K | ESP Çalışma › Okuma | G | P3 |  |
| 95 | Okuma ilerlemesi | P2 | K | ESP Çalışma › Okuma · kitap içi | B | P2 |  |
| 96 | Alıntı kartı | P3 | K | ESP Çalışma › Okuma · metin seçince | D | P3 |  |
| 97 | Kelime sahnesi | P2 | K | ESP Çalışma › Dil · tekrar sahnesi | G | P2 |  |
| 98 | Bağlamda kelime | P2 | K | ESP Çalışma › Okuma | B | P2 |  |
| 99 | Konuşma dalga formu | P3 | K | ESP Çalışma › Dil · konuşma pratiği | G | P3 |  |
| 100 | Tarih şeridi · MEVCUT | P3 | K | ESP Çalışma › Tarih | G | P3 |  |
| 101 | Ajanlı ders kapağı | P3 | K | ESP Çalışma › Dil · ders başı | A | P3 |  |
| 102 | Oturum sonu | P2 | K | ESP Çalışma › Dil · oturum sonu | A | P2 |  |
| 103 | Kelime ağı | P3 | K | ESP Çalışma › Dil · kelime ayrıntısı | D | P3 |  |
| 104 | Bağlı notlar | P3 | K | ESP Çalışma › Okuma · not ayrıntısı | D | P3 |  |
| 105 | Deste durumu | P2 | K | ESP Çalışma › Dil · bölüm başı | G | P2 |  |
| 106 | Cümle kurma | P3 | K | ESP Çalışma › Dil · alıştırma | G | P3 |  |
| 107 | Metinli dinleme | P3 | K | ESP Çalışma › Dil · dinleme | G | P3 |  |
| 108 | Soru zinciri | P3 | K | ESP Çalışma › Felsefe | G | P3 |  |
| 109 | Üç madde özeti | P3 | K | ESP Çalışma › Okuma · bölüm sonu | D | P3 |  |

### F · Merkez · HKM (18)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 110 | Mor öneri kartı | P1 | K | 3 modül · Bugün › Öneri | G | P1 | Öneri alanında en çok BİR kart; fazlası Onaylar'da |
| 111 | Seviyeye göre onay | P1 | K | Onaylar · her aksiyon | B | P1 | Modül tarafı; seviye modülün kendi kataloğundan |
| 112 | Çakışma kartı | P1 | K | AYS Plan › Hafta · SPİ Bugün | A | P1 |  |
| 113 | Önce / sonra görünümü | P2 | K | Onaylar · büyük aksiyon | A | P2 |  |
| 114 | Gerekçe çubuğu | P1 | K | Öneri kartı içinde | B | P1 |  |
| 115 | Bekleyen öneri rozeti | P2 | T | Kabuk · Onaylar sekmesinin rozeti (mobilde üst çubuk) | G | T2 | Mor sayaç |
| 116 | Otomatik uygula ayarı | P1 | K | Ayarlar › Merkez | Y | P1 |  |
| 117 | Geri dönüş noktaları | P2 | K | Ayarlar › Veri · Onaylar › Geçmiş | Y | P2 |  |
| 118 | Bağlantı noktası | P1 | T | Kabuk · üst çubuk | G | T2 | Tek nokta + saat; ayrıntı üzerine gelince |
| 119 | Öneri geçmişi | P3 | K | Onaylar › Geçmiş (+ HKM yüzü) | D | P3 |  |
| 120 | Haftalık Merkez özeti | P2 | K | 3 modül · Bugün (pazar akşamı) + HKM yüzü | A | P2 |  |
| 121 | Kural izi | P1 | K | Öneri kartı › «Neden?» | D | P1 |  |
| 122 | Sessiz saatler | P2 | K | Ayarlar › Bildirim | Y | P2 |  |
| 123 | Geçme nedeni | P2 | K | Öneri kartı · «Geç» denince | A | P2 |  |
| 124 | Çapraz etki | P2 | K | Öneri kartı · iki modül etiketi + ok | B | P2 |  |
| 125 | Takvimde hayalet öneri | P2 | K | AYS Plan › Hafta | B | P2 |  |
| 126 | Merkez günlüğü | P3 | K | HKM yüzü · Ayarlar › Merkez | D | P3 |  |
| 127 | Kapsam seçimi | P2 | K | Öneri kartı · aksiyon | B | P2 |  |

### G · Ofis ve ajanlar (12)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 128 | Masa görünümü · MEVCUT | P2 | K | Ofis › Masalar | G | P2 |  |
| 129 | Balondaki sayı çipi | P1 | K | Ofis · balonlar | B | P1 |  |
| 130 | Ajan sınır kartı | P2 | K | Ofis · ajan adına dokununca | D | P2 |  |
| 131 | Devir göstergesi | P3 | K | Ofis · sohbet | A | P3 |  |
| 132 | Ajan durum halkası | P3 | K | Ofis · portre | B | P3 | Halka yerine durum noktası |
| 133 | Hazır cevap çipleri | P2 | K | Ofis · son balonun altı | B | P2 |  |
| 134 | Ajan seçici | P2 | K | Ofis · @ yazınca | D | P2 |  |
| 135 | Günün toplantısı · MEVCUT | P2 | K | Ofis › Toplantı | G | P2 |  |
| 136 | Üslup seçimi · MEVCUT | P3 | K | Ayarlar › Ofis | Y | P3 |  |
| 137 | Ajanın baktığı veri | P2 | K | Ofis · bağlam paneli (mobilde açılır) | G | P2 |  |
| 138 | Konuşma özeti | P3 | K | Ofis · sohbet başı tek satır | D | P3 |  |
| 139 | Model kapalı kipi | P1 | K | Ofis · gri durum şeridi | A | P1 |  |

### H · Seviye ve rütbe (9)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 140 | Rütbe halkası | P2 | T | Kabuk · rütbe çipi | G | T2 | Halka yerine çip + ince çizgi (v4) |
| 141 | XP dökümü | P3 | K | Rütbe | D | P3 |  |
| 142 | Kademe yolu | P3 | K | Rütbe | G | P3 |  |
| 143 | Sakin seviye atlama | P3 | K | Kabuk · rütbe çipi parlar | A | P3 |  |
| 144 | Sistem başına rütbe | P2 | K | Rütbe + rütbe çipi | B | P2 |  |
| 145 | Rütbe galerisi · MEVCUT | P3 | K | Rütbe | G | P3 |  |
| 146 | Başarım rozeti · MEVCUT | P3 | K | Rütbe | G | P3 |  |
| 147 | Ay özeti şeridi · MEVCUT | P3 | K | Rütbe | G | P3 |  |
| 148 | Kusursuz günler · MEVCUT | P3 | K | Rütbe · aya dokununca | D | P3 |  |

### I · Hareket (11)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 149 | Sayı yuvarlanması | P2 | T | Her ekran | B | T4 |  |
| 150 | Geri al geri sayımı · MEVCUT | P1 | K | Her ekran · Geri al şeridi | A | P1 | Var olan şeride süre çizgisi |
| 151 | Şimdi çizgisi | P2 | T | Gün şeridi · Plan › Hafta | B | T2 |  |
| 152 | Tik çizimi | P2 | T | Her ekran | B | T4 |  |
| 153 | Kart açılma geçişi | P2 | T | Her ekran | B | T4 |  |
| 154 | Küçülen başlık | P3 | T | Her ekran | B | T4 |  |
| 155 | Modül geçiş rengi | P2 | T | Kabuk | B | T2 |  |
| 156 | Odak halkası akışı | P3 | T | Her ekran | B | T4 |  |
| 157 | Bırakma alanı | P2 | K | AYS Plan › Hafta | B | P2 | 54 ile birlikte |
| 158 | Satır kapanma | P3 | T | Her ekran | B | T4 |  |
| 159 | Üzerine gelince önizleme | P3 | T | Her ekran | İ | T4 |  |

### J · Mobil ve erişilebilirlik (11)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 160 | Başparmak bölgesi | P2 | T | Kabuk · mobil | B | T2 |  |
| 161 | Kaydırarak işaretle | P2 | K | 3 modül · Bugün satırları (mobil) | B | P2 |  |
| 162 | Alt çekmece | P2 | T | Her ekran · mobil ayrıntı | B | T1 | Bileşen: D katmanının telefondaki hali |
| 163 | Sabit etiketli kaydırma | P2 | T | Gün şeridi · mobil | B | T2 |  |
| 164 | Bildirim kartı | P2 | K | Telefon bildirimi | Dış | P2 | Eylem düğmeleri platforma göre değişir; doğrulanır |
| 165 | Renksiz de ayırt edilir | P1 | T | Her ekran | B | T1 |  |
| 166 | Hızlı ekle düğmesi | P2 | T | Kabuk · mobil sağ alt + | G | T2 |  |
| 167 | Ana ekran bileşeni | P3 | K | Telefon ana ekranı | Dış | P3 | Tarayıcı uygulaması için yolu doğrulanmadı: araştır, yoksa söyle |
| 168 | Adımlı sayı girişi | P2 | K | SPİ Bugün girişleri · küçük sayılar | B | P2 |  |
| 169 | Alt sekme çubuğu | P2 | T | Kabuk · mobil alt bant | G | T2 | Dört sekme + sağ altta + |
| 170 | Sesli okuma metni | P2 | K | Her ekran · sayı bileşeni | B | P2 |  |

### K · Kurulum ve güven (9)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 171 | Kurulum adımları · MEVCUT | P2 | T | İlk açılış | A | T5 | Var olan tanıtım.js giydirilir |
| 172 | Örnek veri kipi | P3 | K | Ayarlar › Veri | Y | P3 |  |
| 173 | Yedek durumu · MEVCUT | P1 | K | Ayarlar › Veri | Y | P1 |  |
| 174 | Veri nerede? | P2 | K | Ayarlar › Veri | Y | P2 |  |
| 175 | Dışa aktar · MEVCUT | P2 | K | Ayarlar › Veri | Y | P2 |  |
| 176 | Gizlilik kilidi | P3 | T | Kabuk · açılış kilidi + Ayarlar | Y | T5 |  |
| 177 | Kalıcı silme kapısı | P1 | K | Ayarlar › Veri · her kalıcı silme | A | P1 |  |
| 178 | İçe aktarma önizlemesi | P2 | K | Ayarlar › Veri | A | P2 |  |
| 179 | Kayıt geçmişi | P1 | K | Her kaydın ayrıntısı | D | P1 |  |

### L · Ayarlar ve tercih (4)

| # | Özellik | Önc. | Sahip | Yer | Katman | Sıra | Not |
|---|---|---|---|---|---|---|---|
| 180 | Modül bazında bildirim | P2 | K | Ayarlar › Bildirim | Y | P2 |  |
| 181 | Ayar önizlemesi | P3 | T | Ayarlar › Görünüm | Y | T5 |  |
| 182 | Varsayılana dön | P2 | T | Ayarlar · her ayar | Y | T5 |  |
| 183 | Ayar arama | P3 | T | Ayarlar | D | T5 |  |
