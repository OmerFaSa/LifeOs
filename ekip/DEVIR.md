# Talimat raporu — sıradaki Claude için

> Son güncelleme: 2026-09-23 gece · yalnız «şimdi + sıradaki». Bitmiş işlerin ayrıntısı,
> eski sorular ve eski özetler: `ekip/arsiv/DEVIR-2026-09.md` (tam metin).
> Her madde bitince bu dosya güncellenir; limit ortada biterse sonraki oturum buradan sürer.

## ⚡ HIZ KURALLARI (2026-09-23, kullanıcı: «sürenin kısalması için tüm koşulları uygula»)

1. **ONAY VERİLDİ — sormadan yap.** Kolaylık fikirlerinden hızlı kazançlar ONAYLI:
   **5, 8, 9, 11, 12, 13, 14, 15, 19, 22, 27, 31, 46, 49, 50, 56.** Diğer 41 fikir hâlâ
   onay bekler (liste en altta). Doktrin (AGENTS.md §1) onayla değişmez: teşhis/doz yok,
   HKM modüle yazmaz, eksik veri sıfır değil, XP karar vermez.
2. **SIRA:** Grup 1 HKM + Telegram: 8, 9, 11, 12, 13, 14, 15, 19, 46 · Grup 2 AYS: 22, 27 ·
   Grup 3 SPİ: 31 · Grup 4 ortak: 5, 49, 50, 56 → sonra planlı iş 8c-2 → 8c-3 → 8d → 8e →
   tam koşum → **EN SON Part 9 tek tasarım** (önce çekmece haritası kullanıcıya onaylatılır).
3. **DENETİM ÖLÇÜSÜ:** her madde yalnız dokunduğu sistemin testleri + duman testi. Tam koşum
   (`tools/sayilar.py --tam --yaz`) dört grup + Part 8 bitince BİR KEZ. Önce hatayı
   yakalayan test; yeni davranış testsiz gelmez.
4. **KAYIP YOK:** her grup (ya da büyük madde) bitince commit + push (`main`) + burada ✅.
5. **GEREKSİZ İŞ YOK:** keşif betikleri scratchpad'de; belgeye yalnız yapılanın özeti.

**Durum:** ✅ 2a arşiv · ✅ 2b tarama · ✅ Grup 1 · ✅ Grup 2 · ✅ Grup 3 · ✅ Grup 4 ·
✅ 8c-2 · ✅ 8c-3 · ✅ 8d dil + gitar · ✅ 8e · ✅ tam koşum (2026-09-24, 24/24) · ✅ SPİ su hatası · ✅ 8f ESP belge (tarih + felsefe) · ✅ 8f-2 (okuma, yazı) · ❓ diksiyon belgesi (soru) · ✅ Y5 · ✅ Y11 · ✅ 10a · ✅ 11 · ✅ 16 · ✅ 17 · ✅ 18 · ❓ 10b, 14, Y1, Y10, diksiyon · ⏳ cevaplı maddeler · ⏳ Part 9 (harita ONAY BEKLİYOR: `ekip/CEKMECE-HARITASI.md`)

### 2b tarama sonucu (2026-09-23) — var olan yeniden yazılmaz

| # | Fikir | Durum | Nerede / ne eksik |
|---|---|---|---|
| 5 | «Dünkünün aynısı» | yok | kopyalama yolu yok; SPİ öğün/ilaç, ESP oturum, AYS blok |
| 8 | Telegram tek kelime kayıt («su 2») | kısmen | `HKM/core/dil.py › rapor` yalnız geçmiş kip cümleyi okur («7 saat uyudum»); «su 2», «uyku 7», «soru 40» `None` |
| 9 | Eksik veri tek soru | kısmen | `intents.py:135 measure.ask` (SPİ); `schedule.yoklama_metni` kaydı gelmeyen modülü söyler; seçenekli tek soru yok |
| 11 | Toplu onay | kısmen | AYS `palette.js:331` «Hepsini onayla» yalnız komut önerisinde; HKM teklif kuyruğunda toplu yok |
| 12 | Sessiz saatler | yok | `outbox.flush` saate bakmaz |
| 13 | Günlük bildirim bütçesi | kısmen | `outbox` kimliği (kanal, tür, gün) tekrarı önler; günlük üst sınır yok |
| 14 | «Bunu bir daha sorma» | yok | — |
| 15 | Cevapsız teklif 3 gün sonra kapanır | yok | `intents` bekleyen niyet süresiz |
| 19 | Akşam «yarın şu üç şey» | yok | `schedule` evening = gün kapanışı |
| 22 | Yanlıştan tekrar kartı tek dokunuş | kısmen | AYS `proposals.js` «card-from-error» (etiket seçilince öneri) |
| 27 | Test kitabında kaldığın sorudan devam | kısmen | AYS `testkitabi.js:28` oturum bellekte; sayfa yenilenince kaybolur |
| 31 | Sepette ucuz muadil + düşen besin | **VAR** | SPİ `screens/basket.js:116 swapCard` + `money.js:138 substitutesFor` (Korunan / Düşen, «Değiştir»). Kısıt: yalnız `SP.SUBSTITUTES` tablosundaki kalemler |
| 46 | «Önce depo» teklifi en üstte | kısmen | `depo.py` Depolama Bürosu araştırmadan önce bakar; King teklifinde (`teklif.py`) görünmez |
| 49 | Haftalık «neler kazandın» | yok | `weekly.py` karşılaştırma var, «ölçülmüş üç iyi şey» yok |
| 50 | Seri dondurma | yok | seriler: AYS `calc.js behaviorStreak`, SPİ `calc.js streak`, ESP `Model.streak`, HKM `streak.py` (eşik kırığı) |
| 56 | Tatil modu | yok | AYS takvim istisnası «tatil» ve `badDay` var; üç modülde ortak mod yok |

## 0. Önce oku

1. `AGENTS.md` — doktrin: sayıyı ve kararı KOD verir, model yalnız cümle kurar; eksik
   veri sıfır değildir (ölçüldü / tahmin / hesaplandı / veri yok); sıfır bağımlılık; HKM
   hiçbir modüle yazmaz, teklif bırakır; aksiyonların üç seviyesi; ekranda düzgün Türkçe.
2. Bu dosya (sıra yukarıda). 3. `ekip/PLAN.md` — büyük plan.

## 1. Kullanıcının kuralları

- Türkçe konuşur, sesle yazar: kelimeler bozuk gelebilir, anlamı çıkar.
- Bir işi bitir, test et, commit + push et, bu dosyayı güncelle, sonra sıradakine geç.
- Gereksiz test yapma: dokunduğun sistemin birim testleri + gerekiyorsa duman testi.
- Listede olmayan yeni bir KOL önce kullanıcıya sorulur. **Hata ve eksikte kendini
  kısıtlama:** görürsen düzelt (önce hatayı yakalayan test; commit'te ve burada yaz).
- **Lokal ağa karışma** (paylaşım, tünel, port açma yok). Şirket / YouTube ofisi başka
  bir Claude'un işi; dokunma. PR açma. `main`'e yalnız ileri sarma, asla zorla yazma.
- **Her güncellemeyi bu dosyaya yaz.** Birden çok Claude sırayla çalışır: biri limitte
  durunca öteki `main`'deki bu dosyayı okuyup devam eder. Başlarken `git fetch origin
  main` ve ileri sar; bitince push et.
- Token bitmeye yaklaşınca: bu dosyayı güncelle, push et, sorulacakları sor.

## 2. Dal düzeni

- Doğrudan `main` («main üzerinden çalış»). Oturum dalı varsa ikisine de push edilir:
  `git push origin HEAD:main` ve oturum dalı. Push'tan önce `git fetch`; `main` ilerlediyse
  kendi yayımlanmamış commit'lerini onun üstüne al (rebase), sonra ileri sar.
- Uzun koşum (`sayilar.py --tam`) sürerken dosya düzenleme (ya da ayrı `git worktree`).
- Push edilmemiş iş kaybolur (konteyner geçicidir). Commit sonu:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: <bağlantı>`.

## 3. Açık işler

### Part 8 — Akıllı iş sistemi (sürüyor)
İste → King tanır → yoğunluk sınıfı (kod) → teklif (maliyet ölçümden, süre, bütçe payı,
seçenek) → **onay** → parçalı üretim → modüle TİPLİ PAKET olarak montaj → Kütüphanem.
Kullanıcının örnekleri (fasikül, test kitabı, bitkisel protein, spor salonu, gitar, Rusça
A1–A2) **yalnız örnektir**: akış genel kalır; yeni çıktı türü gerekince katalog ve niyet
listesi tek yerde genişler. Tam plan: arşiv § Part 8.

- ✅ 8a-1 çağrı → iş maliyeti · ✅ 8a-2 teklif (`HKM/core/teklif.py`, MIMARI §8.28) ·
  ✅ 8a-3a onay kapısı (`teklif` durumu, «1 · 2 · iptal», düşük sınıf sormadan ayarı) ·
  ✅ 8a-3b modül teklif kartı (`brand/ortak/kingteklif.js`) · ✅ 8b-1 parça parça + ara
  onay · ✅ 8b-2 AYS test kitabı ekranı + Kütüphanem + yanlış defteri (MIMARI §8.29;
  açık: 60 soru tavanı `kitap.MAX_TOPLAM` parçalıda da sabit) · ✅ 8c-1 HKM `spi.bilgi`
  (besin · fiyat · yer; `core/spibilgi.py`, MIMARI §8.30; niyetler `besin.add`,
  `fiyat.add`, `yer.add`).
- ✅ 8c-2 SPİ tarafı (`SPI/src/js/core/bilgi.js`, HKM MIMARI §8.30 «SPİ tarafı»): Mutfak ›
  «Bilgi iste» → King onay kapısı; teklif Bugün'de SPİ'nin kendi önizlemesiyle; «Ekle»
  yeniden çeker + sınar + yazar (besin → kullanıcı gıdası `bam` etiketli; fiyat →
  `meta/bamFiyat`, `priceOf`: fiş > BAM tahmini > tohum; yer → Mutfak › Yerler); geri
  alınır. SPİ 1290/1290, duman + a11y + 390px düzen, `tools/entegre.js` §2.80 temiz.
- ✅ 8c-3 Diyete otomatik işleme (HKM MIMARI §8.30 «Diyete işleme»): eklenen gıda öğün,
  açık, kaynak ve sepet hesabına kendiliğinden girer; önizleme protein hedef payını ve gram
  protein maliyetini söyler. Düzeltilen üç hata (önce testleri): protein/lif kaynak ve
  «en ucuz» listeleri boştu; bilinmeyen doymuş yağ/lif sıfır sayılıyordu; «N kalem
  tanınmadı» denetimi bilinmeyen mikroyu gıda sanıyordu. SPİ 1294/1294, duman temiz.
- ✅ 8d ESP dil ünitesi (HKM MIMARI §8.33): King işi `esp.unite` (dil · CEFR düzeyi · konu;
  üretim + bağımsız yargı, düşük sınıf) → `unite.add` → ESP `core/unite.js` kendi koduyla sınar
  (yazı sistemi, tekrar, ≥6 öğe), önizler, üniteyi Dil › Öğren'e ve kartları desteye koyar;
  geri alınır. KARAR: pratik soruları modele YAZDIRILMAZ — ESP'nin pratik motoru soruyu ve
  çeldiriciyi aynı desteden kurar (lesson.js kural 3; «uydurulmuş çeldirici yanlış öğretir»).
  Merdiven bağı: ünitenin `level`i CEFR'den (A1→I … C1/C2→V). HKM 567/567, ESP 1327/1327,
  duman + a11y + 390px, `tools/entegre.js` §2.81 temiz.
- ✅ 8d-2 Gitar paketi (MIMARI §8.33 «Gitar paketi»): `esp.unite` + `alan:"gitar"`; tek
  çağrı, kod tempo/ton/derece süzer; ESP Stüdyo `pieces`'a referans tempoyla yazar; geri
  almada ölçülmüş alıştırma kalır. HKM 568/568, ESP 1328/1328, duman + a11y + 390px temiz.
- ✅ 8e Depo önce + tazelik + kullanım (HKM MIMARI §8.34): tazelik türe göre (fiyat 30 gün,
  yer 90, besin yaşla eskimez); süresi geçen depo kaydı teklifte «eskimiş olabilir», fiyatta
  «tazelemek önerilir»; son 30 günde uygulanmamış BAM çıktısı orta+ teklifte not olarak
  söylenir (ölçülen: teklifin cevabı). HKM 570/570, HKM yüzü, `tools/entegre.js` temiz.

- ✅ **SPİ su hatası** (tam koşum sırasında bulundu; `a82f7fe`, SPİ 1296/1296, duman temiz; asgari
  günde bilinmeyen su «girilmedi» yazar): `SPI/src/js/core/state.js`
  `defaultVitals` suyu `0` başlatıyor. Kullanıcı o gün yalnız uyku girse bile `calc.js`
  asgari günde su «biliniyor, 0 ml» sayılıyor ve beacon HKM'ye «su 0 ml, ölçüldü» gidiyor
  (AGENTS §1.2). Düzeltme: varsayılan `null`, hızlı giriş `null`'dan toplar, eski kayıttaki
  `0` → `null` (0 ml gerçek bir ölçüm olamaz; DEVIR'de söylenir). Önce test.
- ✅ **8f ESP belge — tarih + felsefe** (kullanıcı 2026-09-24: «esp'de sadece dil değil felsefe,
  tarih ve diğer alanlara da belge aratacağız; kimisine filozof, kimisine türlü türlü şeyler»).
  HKM MIMARI §8.35. King `esp.belge` (web zorunlu, alıntı + yıl/ad kodla) → `belge.add` → ESP
  `core/belge.js`: olay + kaynak Kronoloji'ye, eser + açık tez Sempozyum'a; geri alınır.
  HKM 574/574, ESP 1332/1332, duman + a11y + 390px, `tools/entegre.js` §2.82 temiz.
- ✅ **8f-2 okuma + yazı** (MIMARI §8.35): eser listesi → Okuma › Kaynaklar «başlanmadı»;
  BAM notu kitabın üstünde, kullanıcı notlarına yazılmaz. Hata düzeltildi: başlanmamış kitap
  «okunuyor» görünüyordu (`ESP.Model.bookStatus`). HKM 575, ESP 1334, duman/a11y/390px temiz.
- ❓ **Diksiyon (ve müzik dışı ses) için «belge» ne olmalı — kullanıcıya soruldu.** Tekerleme
  üretmek belge değil; telaffuz kuralı mı, konuşmacı/metin örneği mi? Cevap gelmeden yapılmaz.

### Cevabı gelen maddeler (sıra: Part 8'den sonra)
- ✅ Y5 Sağlık verisi içe aktarma — `SPI/src/js/core/saglikice.js` (SP.SaglikIce), Ayarlar ›
  Rehber › Veri › «Telefondan sağlık verisi». iPhone export.zip (tarayıcının DecompressionStream'i,
  sıfır bağımlılık; ZIP64 yok ve söylenir) ya da export.xml parça parça; Android: genel CSV
  (tarih, ölçü, değer) — **Health Connect'in doğrudan dışa aktarma biçimi DOĞRULANMADI**.
  Alınanlar: uyku (gece başına en büyük kaynak, uyanılan güne), kilo (lb→kg), nabız, tansiyon,
  SpO2 (oran→%), bel, yağ, su (L/fl oz→ml). Alınmayanlar söylenir: HRV (Apple SDNN ≠ SPİ
  RMSSD), adım (alan yok). Senin değerin ezilmez (çakışma gösterilir), aralık dışı düşer,
  «Geri al» sonradan değiştirdiğini korur. SPİ 1301/1301, duman/a11y/390px, tarayıcıda denendi.
- ⏳ Y1 Para kolu — girişler Telegram yazışması, King/akşam sohbeti, fiş fotoğrafı; öneri
  HKM içinde bir bölüm (ilk adımda bir cümleyle teyit). Fişten okunan «tahmin», önizleme +
  onay; tutarı kod hesaplar.
- ⏳ Y10 Veli / koç özeti — haftada 1–2 PDF, sıklığa kod karar verir (kullanım, karar
  yoğunluğu, aciliyet, sağlık, ders kararlılığı); alıcıyı ilk adımda sor.
- ✅ Y11 Kariyer / proje — ilk adım akademi: `AYS/src/js/core/sinavoneri.js` (R.SinavOneri).
  Eğitim durumu ve hedef SORULUR (Dersler › Sınav profilleri › «Hangi sınav bana uygun?»);
  LGS/YKS/DGS/KPSS/ALES/YDS uygun · sonra · uygun değil, gerekçe + «şart ÖSYM/MEB
  kılavuzunda» uyarısı; hedefle örtüşen öne gelir; «Müfredatını iste» mevcut King yolu; ana
  sınav değişmez. AYS 1658/1658, duman/a11y/390px temiz.
- ✅ 10a Müfredatı kendin yükle (üniversite ya da başka sınav): Dersler › Sınav profilleri ›
  «Müfredatı kendin yükle» — «Ders: konu, konu» ya da «Ders:» + «- konu»; `R.SinavProfil.
  metindenProfil` HKM raporuyla AYNI süzgeçten (`dersSuz`) geçer; etiket «senin yüklediğin»;
  konu takibi ve test kitabı isteği çalışır; «Geri al». AYS 1665, duman/a11y/390px temiz.
- ❓ 10b Ana sınavı DEĞİŞTİRMEK — ölçüldü: AYS çekirdeğinde 21 dosyada 107 TYT/AYT bağı ve 63
  `R.SUBJECTS` kullanımı (plan motoru, kapanış, deneme/net, puan). Kullanıcı «şimdilik YKS»
  dedi; her gün kullanılan YKS akışını riske atan büyük yeniden yazım → kullanıcıya soruldu
  (öneri: YKS bitince ya da ihtiyaç doğunca; tasarım: ders şeması uyarlayıcısı + büyük aksiyon
  önizlemesi + geri dönüş noktası).
- ✅ 11 Tahmin tablolarını kaynağa bağlamak (PLAN Tur 3: «CEFR saat tablosu ve kitap tahmini»):
  `esp.belge` + `alan: cefr | okuma_hizi` (HKM MIMARI §8.35 sonu); ESP Rehber › Dayanak ›
  «Tahmin tabloları» ile istenir; hesap kodda, karar «tahmin», dayanak «kaynaklı». Sağlayıcı
  HKM'nin web ayarından (esnek). HKM 576, ESP 1341, duman/a11y/390px temiz.
- ❓ 14 Depo göçü (her kayıt kendi anahtarında) — NOTLAR §7.3 «yaşayan sağlık verisinde göç,
  SORMADAN YAPMA». Ölçüm: 1000 kayıtta yazma ~0,5–4 ms, 5 yıllık yük denetimi temiz → acil
  değil. Kullanıcıya soruldu; onaysız yapılmaz.
- ✅ 16 İlk kurulum testleri: `setup.test.js` üçünde (gerçek alt sayfa + form; AYS takvim
  doğrulaması, hedef sırası, plan üretimi). Kapsam AYS %13→%75, SPİ %20→%86, ESP %0→%100.
- ✅ 17 Ekran sözleşmesi AYS/ESP: `ekran.test.js` (kayıt, sözleşme alanları, gezinme → ekran,
  her ekran tek bölümde, boş/dolu çizim çökmez). Test sayfaları bütün ekranları + `app.js`'i
  yükler (AYS'ye `__AYS_NO_BOOT__` bayrağı eklendi; eksik 4 dosya: build, designs, listen, talk).
  AYS 1664, ESP 1339; AYS duman temiz.
- ✅ 18 labs.js ve AYS llm.js (2026-09-24): SPİ `labs.test.js` → `labs.js` kapsamı %24 → %62.
  AYS `llm.js` + `providers.js` KALIP olarak tek kaynak (`brand/ortak/`, `tools/ortak.py`
  `YALNIZ` boş): SPİ/ESP model listeleme, teşhis, görsel zinciri ve güncel kataloğu aldı
  (eski SPİ/ESP listesinde emekli Gemini 2.0 Flash vardı). Dışa açık API AYS'ninki tam üst
  küme; SPİ/ESP'nin çağırdığı her işlev içinde. AYS 1665, SPİ 1306, ESP 1341; üç duman
  (src + yeniden derlenen dist) temiz; `ortak.py --denetle` 43 dosya / 129 kopya aynı. NOTLAR §19 kapandı.
- ✅ **Tasarım öncesi tarama (2026-09-24, kullanıcı: «sistemi tara, eksikleri kapat, hataları
  çöz»).** Tam koşum (d175871) 24/24 temiz. Kod taramasında testlerin görmediği hatalar:
  · **AYS beacon serbest soruyu saymıyordu:** «soru 40» (Telegram kısa kayıt, derssiz giriş)
    `freeQ`'ya yazılıyor, beacon yalnız blokları sayıyordu → HKM günü «soru: veri yok» görüp
    sabah aynı soruyu yeniden soruyordu. Artık blok + serbest + paragraf + problem (0 =
    girilmedi; hiçbiri yoksa veri yok). Ofis modeline giden gün özeti de aynı hatayı taşıyordu
    (`tools.gunler`), girilmemiş paragraf «0/18» ölçüm gibi gidiyordu → null.
  · **Serbest soru hiçbir ekranda görünmüyordu:** Bugün › paragraf/problem altında «Plan dışı:
    N soru · M doğru»; önizleme adı da «Plan dışı (günün toplamı)».
  · **`load.reduce` çıkmaz yoldu:** HKM «yarın hafif» ve tatil dönüşünde teklif bırakıp «ne
    kadar azalacağına modül karar verir» diyordu; hiçbir modül uygulayamıyordu (yalnız
    «Gördüm»), tatil dönüşünde teklif tam da uygulayamayan SPİ/ESP'ye gidiyordu. Düzeltme:
    AYS uygular (`R.Istisna.hafiflet`: o güne yarım süre istisnası, deneme/kapanış ve
    başlamış gün korunur, geçmişe yazılmaz, «Hafiflet» düğmesi + «Geri al»); sözleşme
    `load.reduce` → yalnız AYS; HKM SPİ/ESP için teklif bırakmaz, «günlük yük planı yok» der.
  · **SPİ `measure.ask`'i tanımıyordu** (HKM kataloğunda var, üretilince sessizce süzülürdü) →
    tanınır, «Gördüm» ile kapanır.
  · Eski yorumlar bugünün kuralına uyduruldu: `intents.py` ve üç `beacon.js` başlığı «HKM'yi
    BİLMEZ» → «bilir ama bağımlı değil» (AGENTS §1.4); SPİ beacon'daki çelişen dört yorum
    bloğu tek «hangi teklif uygulanır» tablosu oldu.
  Yeni testler düzeltme olmadan KIRMIZI (AYS 1665/1669), düzeltmeyle yeşil. AYS 1669, SPİ 1307,
  ESP 1341, HKM 577; AYS + SPİ duman, `tools/entegre.js` temiz; üç dist derlendi.
  Taranıp temiz bulunanlar (hata yok): King iş türü dağıtımı (9 türün hepsi temizle/anahtar/
  teklif/güncellikte), kesinlik etiketi (modüller tutarlı), SPİ/ESP beacon'da sıfır-eksik,
  sessiz saat gece yarısı, Y5 birim dönüşümleri, UTC tarih hesapları, `focus.set`/`plan.add`.
  · **Reddedilen isteğin cümlesi ASCII'ydi** (AGENTS §1.8): AYS sınav profili/test kitabı ve
    Telegram araştırması HKM'nin `errors` dizisini ekrana basıyor («konu 3-200 karakter
    olmali», «sinav 2-80…», «tanimsiz is turu»). `king`, `program`, `kaynakli`, `mufredat`,
    `kitap`, `urunler`, `espbelge` temizleyicileri düzgün Türkçe; test `test_king` (önce
    kırmızıydı). HKM 578, `tools/entegre.js` temiz.
  · **Tarama 2 — saat dilimi (UTC+3):** `new Date().toISOString()` damgasının ilk on karakteri
    UTC günüdür; gece 00:00–03:00 arası kayıt DÜNE düşüyordu. ESP serisi kart geçmişine bakar →
    Salı 00:30'da çalışılan kart Pazartesi'ye yazılıp seri kırılıyordu; AYS «bugün çözülen»,
    günlük XP sayımı, başarım sayaçları, «son yedek kaç gün önce» de kayıyordu. Üç `utils.js`'e
    `U.gunOf(damga)` (yerel gün), 42 kullanım yeri ona çevrildi, ortak `yedek.js` düzeltildi
    (testi hatayı kural sanıyordu). **Birim testleri artık İstanbul saatiyle koşar**
    (`tools/runtests.js` `timezoneId`); yeni testler düzeltmesiz kırmızıydı. AYS 1670, SPİ
    1307, ESP 1342, üç duman temiz, dist derlendi.
  · Tarama 2'de temiz bulunanlar: yedek/dışa aktarma bütün depo anahtarlarını kapsar (yeni
    özelliklerin verisi dahil), budama yalnız listeli yeniden üretilebilir koleksiyonlara
    dokunur; `await`'siz kayıt yok (bulunanlar bilinçli «yaz-unut» ya da eşzamanlı);
    HKM jeton denetimi merkezî, statik yollarda `../` geçmez; HKM raporlarında eksik→0 yok.
    Kapsamı en düşük dosyalar EKRAN işleyicileri (AYS learn/guide/exams %6–8, ESP studio/
    symposium/history %6–7): duman testi çizer ama düğme işleyicilerini koşmaz — sıradaki
    tarama adayı (Part 9 ekranları zaten yeniden yazacak; önce oraya test yatırımı sorulmalı).
  Bilinçli bırakılan: haftalık soru gerçekleşmesi yalnız plan bloklarını sayar (haftanın konu
  sözleşmesi; serbest soru konuya bağlı değil) — tasarım kararı, hata değil.
- **Sıradaki:** açık sorular (❓ 10b, 14, Y1, Y10, diksiyon) kullanıcı cevabı bekliyor; Part 9
  harita onayı bekliyor. Cevapsız iş kalmadıysa kullanıcıya sor, kendiliğinden yeni kol açma.

### Part 9 — Tek tasarım + çekmece düzeni (EN SON)
**Kullanıcı 2026-09-24: «tasarımı en son yapacağız, benden onay isteyeceksin; onun harici
kalanları yap».** Part 9'a ancak geri kalan her şey bitince ve kullanıcı haritayı onaylayınca
başlanır.
**Harita taslağı hazır, ONAY BEKLİYOR:** `ekip/CEKMECE-HARITASI.md` (8 ortak çekmece; dört
karar sorusu sonunda). Onaysız uygulanmaz.
Her şey bitince. Bütün sistem (AYS, SPİ, ESP, HKM web) **modern, sade, minimalist** tek
tasarıma geçer; bugünkü sorun iç içelik (kart içinde sekme içinde alt sekme). Çekmece
düzeni (görsel değil, DÜZEN): üç modülde aynı iskelet ve aynı çekmece adları; iç içelik
en çok iki kat; aynı şey iki yerde durmaz; her çekmecenin içi başlık · kısa özet · liste ·
eylem; her ekran hangi çekmecede olduğunu söyler; onaylar tek çekmecede. **Önce çekmece
haritası çıkarılır ve kullanıcıya onaylatılır**, sonra uygulanır; SPİ `designs.css` beş
düzen ve tasarım seçici kalkar. O zamana kadar yeni ekranlar ortak bileşenlerle yazılır.

## 4. Kullanıcının cevapları (2026-09-23; ayrıntı arşivde)

1 Web araması esnek, sağlayıcı ve bütçe Ayarlar'da · 2 Sağlık eşikleri: kaynaklı araştırma
+ kişinin kendi geçmişi, hangisinden geldiği etiketli · 3 Para girişleri: Telegram, sohbet,
fiş fotoğrafı · 4 iPhone + Android · 5 Sunucu tek bilgisayardan, sabah–akşam açık, gece
kapalı; başlatmak kolay olmalı; gece kaçan iş sabah yakalanmalı; telefon şimdilik Telegram
(ağdan bağlanma ayrı karar) · 6 Ana sınav şimdilik YKS, ileride değişebilir · 7 Veli/koç
PDF haftada 1–2, sıklığa kod karar verir · 8 Kariyer esnek, önce sınav önerisi.
Hâlâ açık: Y10 alıcısı · Y1'in yeri (HKM içi öneri) · telefonun ağdan bağlanması.

## 5. Komutlar

- HKM: `cd HKM && python3 -m tests.run` · yüz: `NODE_PATH=/home/user/LifeOs/AYS/node_modules
  CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/yuz.js`
- Modül: `cd <SYS> && python3 build.py` · `CHROMIUM_PATH=/opt/pw-browsers/chromium node
  tools/runtests.js` · `node tools/smoke.js` (ilk kez: `npm ci`)
- Ortak: `python3 tools/ortak.py --yay` · `--denetle` · Entegre: `node tools/entegre.js`
- Tam koşum: `CHROMIUM_PATH=/opt/pw-browsers/chromium python3 tools/sayilar.py --tam --yaz`
- Açık sunucu ve `HKM/config.json` bırakma; test portlarını kilitler.

## 6. Son durum (tek satırlar)

- Part 1–5 ✅ (hedef ağı, uyarlama, yedek, akşam yoklaması, BAM ürünü, alışkanlık, .ics,
  PWA) · Part 6 Y9 depo tarayıcısı ✅ · Part 7 madde 9 yanlış defteri ✅ · Part 5 sonu tam
  koşum ✅ (a410e31). Ayrıntı: arşiv.
- Grup ilerleyişi aşağıya, her madde bitince tek satır:
  - ✅ 8 Telegram tek kelime kayıt: `dil.kisa_kayit` («su 2, uyku 7, soru 40, gitar 30»;
    yalnız «alan sayı [birim]», soru/plan/ileri gün değil) → `kayit.add`. AYS `entry.js`
    «soru 40» okur, ESP `parse.js` «gitar 30» = 30 dk («kelime 15» sorulur). **Hata
    düzeltmesi:** SPİ `quickentry.js` «su 2»yi 2 ml yazıyordu, «2 litre su içtim»i hiç
    okumuyordu — artık litre/ml/bardak; birimsiz <20 litre, ≥50 ml, 20–49 sorulur.
  - ✅ 12 Sessiz saatler + 13 günlük bildirim sınırı: `HKM/core/bildirim.py` giden kutusunun
    kapısında (`outbox.flush`). Cevap («reply:») beklemez; bekleyen kaybolmaz, sabah TEK
    özette gider (`birlestir`, satır «birlesti»). Varsayılan kapalı; HKM › Ayarlar ›
    Otomatik mesajlar. `GET /api/bildirim`. Test `tests/test_bildirim.py`.
  - ✅ 9 Eksik veri tek soru: `HKM/core/eksik.py` — sabah brifingi dünün eksik TEK ölçümünü
    sorar (uyku, sonra AYS soru; son 7 günde kullanılan modül). «7» → `kayit.add` (dünün
    tarihiyle), «bilmiyorum» → veri yok kalır. Tablo `sorular`.
  - ✅ 14 «Bir daha sorma»: soru türünü ya da günün öneri kuralını susturur (`susturmalar`
    tablosu; brifing susturulan öneriyi üretmez). **bio_red susturulamaz.** Ayarlar'da
    «Yeniden sor». `POST /api/bildirim/ac|sustur`.
  - ✅ 15 Cevapsız teklif `teklif_omru_gun` (3) gün sonra kapanır ve tek mesajla söylenir
    (`bildirim.bayatlari_kapat`, niyet durumu `expired`, King teklifi `iptal`).
  - ✅ 19 Akşam «yarın şunlar var»: modüller yarının işlerini kendi seçer (`hedefag.js`
    `yarin` kancası; AYS plan blokları, ESP sıradaki eylem, üçünde alışkanlık) → HKM
    `yarin_ozet`; akşam kapanışı (yoksa yoklama) en çok 3 işi dizer. «yarın hafif» →
    `load.reduce` teklifi. `GET /api/hedefler` → `yarin`.
  - ✅ 46 Önce depo: aynı konuda depo kaydı King teklifinin en üstünde (ücretsiz, hemen;
    ≤90 gün ise önerilir; seçilirse iş açılmaz). `teklif.depo_secenegi`, `king._depodan_ver`.
    Sohbette rakam SIRADIR («1» = en üstteki), ad seçeneğin kendisidir («tam»).
  - ✅ 11 Toplu onay: modüllerin HKM teklifi kartında «Hepsini kaydet (N)» (yalnız okunabilen
    `kayit.add`; her biri modülün kendi yolundan geri alınır).
  - Grup 1 denetimi: HKM 553/553, AYS 1645, SPİ 1275, ESP 1317; üç duman testi, HKM yüzü ve
    `tools/entegre.js` (yeni §2.78 kısa kayıt + toplu onay, §2.79 yarın) temiz. MIMARI §8.31.
  - ✅ 22 Yanlıştan tekrar kartı tek dokunuş: yanlış defterinde «Tekrar kartı yap» (etiket
    seçilince reçete dolar, düğme çıkar). Aynı `card-from-error` eylemi; yeni genel
    `R.Proposals.hemen` (bekleyen öneri varsa onu onaylar, doğrulama + «Geri al» korunur).
  - ✅ 27 Test kitabında kaldığın sorudan devam: oturum her adımda `meta/testkitabiOturum`'a
    yazılır; Kütüphanem'de «Devam et (soru N/M)» + «Baştan başla». Geçen süre saklanır (mola
    çözme süresine girmez); bitince/vazgeçince/kitap silinince kayıt kalkar.
  - ✅ 31 (Grup 3) zaten VARDI: SPİ Sepet › İkame fırsatları (Korunan/Düşen). Değişiklik yok;
    otomatik muadil üretmek anlamsız eşleşme doğururdu, tablo elle seçilmiş kalır.
  - ✅ 5 Dünkünün aynısı: SPİ Bugün başında ve ESP giriş satırlarında dünün bugün OLMAYAN
    öğünü/antrenmanı/oturumu tek dokunuşla bugüne (`SP.Dunku`, `ESP.Dunku`); gıda etiketi
    korunur, RPE kopyalanmaz, «Geri al» kalır. AYS'de BİLEREK yok: gün planı motordan gelir
    (gün şablonu + haftanın konuları), dünün bloğunu kopyalamak motoru ezer (§1.1); dünün
    SONUCUNU kopyalamak ölçüm uydurmaktır (§1.2).
  - ✅ 50 Seri dondurma: ortak `brand/ortak/seri.js` (hasta/izin/tatil; en çok 7 gün geri,
    tek kayıt 21 gün, hasta 3 gün, ayda 6). Üç modülün seri hesabı donmuş günü atlar;
    Bugün'de «Seriyi dondur» satırı. Kısa sayı girişi de burada: SPİ «su 2» = 2 litre
    (`suMiktari`), AYS «matematik soru 30», ESP «gitar 30» = dakika.
  - ✅ 56 Tatil modu: AYS `R.Tatil.baslat(n)` (ara günleri + dönüşte iki gün yarım süre),
    `bitir()`; tatil TARİHİ hedef eşitlemesiyle HKM'ye (`tatil_ozet`); tatilde yoklama/soru
    yok, dönüş sabahı `load.reduce` teklifi. HKM MIMARI §8.32.
  - ✅ 49 Haftalık «Bu hafta neler kazandın»: `weekly.kazanimlar` (yönü belli ölçü, ≥%5,
    en çok 3 + düzen; «hesaplandı»; XP yok; yoksa dürüstçe «artış yok»). Mesaj, belge ve
    HKM yüzünde. Bulunan HATA düzeltildi: haftalık mesaj ve yüz ham anahtar yazıyordu
    («questions», «rhr»); `adlar.METRIK`'e 16 eksik ad eklendi, `cross.py` cümleleri
    ASCII'ydi («medyani», «DEGILDIR») → düzgün Türkçe (AGENTS §1.8), testleri önce yazıldı.
  - Grup 4 denetimi: HKM 562/562; üç duman testi, HKM yüzü, `tools/entegre.js` temiz;
    `ortak.py --denetle` 42 dosya/125 kopya aynı.

## Kullanıcı kolaylığı fikirleri · HEPSİ ONAYLI (2026-09-24: «41 fikri yap»)

**Kalan 41 madde ONAYLI — sormadan yap.** Sıra: önce depoda tara (var / kısmen / yok; var
olan yeniden yazılmaz), sonra modül gruplarıyla, küçükten büyüğe; her grup test + commit +
push + burada ✅. Doktrin onayla değişmez (AGENTS §1): sayı kod, model yalnız okur/cümle kurar
ve her okuma önizleme + onaydan geçer; teşhis/doz yok; HKM modüle yazmaz; eksik veri sıfır
değil. Part 9 (tasarım) yine EN SON.

### 41 madde tarama sonucu (2026-09-24)

**VAR / başka işe bağlı (yeniden yazılmaz):** 17 .ics içe aktarma (AYS `takvim.js`) · 24 iki
deneme karşılaştırması (`analytics.compareExams`) · 32 tahlil yaşı (SPİ `audit.js`
`TAHLIL_ESKI_GUN` 180) · 33 tahlil grafiği (SPİ Testler › Eğilim, `Bio.trendOf`) · 40 gitar
tempo (ESP `targetBpm` / ölçülen `cleanBpm` / deneme bpm) · 45 tahmin–gerçek maliyet
(`king.maliyet_sapmasi`) · 57 çok profil (AYS `profiles.js`, ESP `addProfile`, SPİ hane) ·
10 tek onay kutusu → Part 9 «Onaylar» çekmecesi (harita onayında yapılır).
**KISMEN (eksik kısmı yapılır):** 1 ses (modüllerde `voice/listen` var, üç modüle tek cümle
yok) · 16 kötü gün (AYS var; SPİ/ESP'de seri dondurma var, gün modu yok) · 20 gerçekçilik
(sınava kalan gün var; «bu hızla» projeksiyonu yok) · 23 mini test (Sınama modları var; zayıf
konu modu yok) · 25 süre (deneme oturumunda soru süresi var; analiz yok) · 26 konu notu
(yanlışta `topicRef` var; not bağı yok) · 28 paylaşılabilir (HKM haftalık PDF var; AYS'den
paylaş yok) · 36 hekim özeti (SPİ «Hekime götür» var; PDF yok) · 37 yer karşılaştırma (liste
var; tablo yok) · 39 okuma (ESP bilerek sayfa saymaz; `okuma_hizi` tablosu var) · 44 iş
geçmişi (King kuyruğu var; zaman çizelgesi yok) · 47 bütçe (aylık toplam var; modül dağılımı
yok) · 48 tanı (sohbette «tani» var; tek ekran yok) · 52 rekor (başarımda günlük en iyi var).
**YOK:** 2 fiş fotoğrafı · 3 etiket fotoğrafı · 4 barkod · 6 şablon gün · 7 deneme sonucu
fotoğrafı · 18 «15 dakikam var» · 21 verimli saat · 29 evdekinden tarif · 30 plandan alışveriş
listesi · 34 ilaç/takviye hatırlatma · 35 su/hareket dürtmesi · 38 Telegram dil kartı · 41
ünite sonu sınav · 42 sesli anlatım · 43 çok modüllü tek cümle · 51 ay sonu mektubu · 53 tek
zip · 54 taşıma sihirbazı · 55 gizlilik panosu.
**İlerleme:** ✅ 47 aylık bütçe modül başına (`butce.month` `by_modul`: BAM işi → isteyen
modül, `ays.` rolü → AYS, gerisi HKM; harcamasız modül «ölçülmedi»; HKM Ayarlar › Bütçe
tablosu) · ✅ 51 ay sonu mektubu (`weekly.aylik_mesaj`: haftalık hesabın takvim ayı hâli,
geçen ayla; `schedule.monthly` varsayılan KAPALI, ayın 1'i haftalık saatinde; HKM › Otomatik
mesajlar kutusu). HKM 580, yüz temiz. · ✅ 53 tek zip (`yedek.zip_paketi`, `GET /api/disa-aktar`:
HKM ambarı + modüllerin en yeni yedeği + BENİOKU; yedeği olmayan modül söylenir; HKM ›
Sistemler › «Her şeyi tek zip olarak indir») · ✅ 55 gizlilik panosu (`usage.veri` her çağrıda
modele giden veri TÜRÜNÜ yazar — mesaj, sağlık/çalışma/gelişim özeti, ilkeler, hatırlananlar,
BAM isteği; `core/gizlilik.py`, `GET /api/gizlilik`, HKM › Sistemler kartı: sağlık özeti gitti mi,
kaç kez, son ne zaman; modüllerin kendi çağrıları HKM'den geçmez ve bu söylenir). HKM 582.
· ✅ 44 iş geçmişi (`king.gecmis`: istek, çıktı kaydı, süre ve maliyet tahmin → gerçek, çıktının
modüldeki durumu — bekliyor/uygulandı/istenmedi; ölçülmeyen «veri yok»; HKM › Ofis › King) ·
✅ 48 durum ekranı (`core/tani.py`, `GET /api/tani`, HKM › Sistemler en üstte: sohbet ve BAM
modeli, web, kanal, üç modülün bağlantısı ve yedeği, bütçe/kur — tamam/uyarı/bozuk + nerede
düzeltilir; veri gelmemiş modül «tamam» sayılmaz). HKM 584, yüz temiz. **HKM grubu bitti.**
· ✅ 18 «15 dakikam var» (`calc.onbesDakika`: gecikmiş kart > açık yanlış reçetesi > paragraf/
problem eksiği > vadesi gelen kart > sıradaki bloğun ilk 15 dk; süreler «tahmin»; Bugün ›
sıradaki iş kartında düğme, «Tam plan» ile döner) · ✅ 20 «bu hızla» (`calc.buHizla`: son 4
haftanın konu kapanış hızı × kalan hafta → sınava kadar kapanacak konu yüzdesi, tahmin; son 4
haftada < 2 kapanış → veri yok; İlerleme › Süreç göstergeleri). AYS 1672, duman temiz.
· ✅ 23 zayıf konulardan mini test (Sınama › «Zayıf konular»: açık yanlışı en çok 3 konu ÖLÇÜMDEN,
`Quiz.zayifKonular`; havuz o konuların kartı + yanlışı) · 25 süre analizi ZATEN VAR (Analiz ›
Hız ve isabet: test başına sn/soru + doğruluk + profil) · ✅ 26 yanlış defterinde «Konunun notu»
(aynı ders+konu kimliğiyle ders notu; Öğrenme'de açar) · ✅ 28 hafta özeti paylaşımı artık ÖNCE
önizler (düzenlenebilir metin, satır silinir; Kopyala / Paylaş; `calc.haftaOzetMetni`) · 6 şablon
gün eşdeğeri VAR (AYS takvim kayıt türleri günü ölçekler; SPİ/ESP «dünkünün aynısı»).
AYS 1675, duman temiz. **AYS grubu bitti.**
· ✅ 37 yer karşılaştırması (`Bilgi.yerKarsilastir`: aylık/yıllık fiyat aylık karşılığa çevrilir,
hesaplandı; dönemi bilinmeyen «karşılaştırılamaz», fiyatsız «fiyat bilinmiyor»; Mutfak › yer tablosu)
· ✅ 30 öğünlerden alışveriş listesi (SPİ'de ileri öğün planı yok: «plan» son 7 günün ÖLÇÜLMÜŞ
öğünleri; `Money.ogundenListe`: < 3 kayıtlı gün → liste yok, kayıtlı günler 7'ye ölçeklenir
= tahmin, 7/7 = hesaplandı; sepettekini düşer; Finans › Sepet › «Öğünlerimden liste»: önizleme,
satır seçimi, tek onay, «Geri al»; hane payı eklenmez ve söylenir) · ✅ 34 + 35 hatırlatmalar
(`core/hatirlat.js`, `screens/hatirlatui.js`: ilaç/takviye — kayda bağlı, ilaç bırakılınca susar —,
su, hareket; saatleri YALNIZ kullanıcı yazar, anlaşılmayan saat sorulur; Bugün başında vakti
gelenler, Özet'te günün listesi, Testler › İlaç'ta «Hatırlat»; «Aldım» işarettir, uyum yüzdesi
yok; ilaç adı HKM'ye gitmediği için Telegram YOK — SPİ açıkken + izinli tarayıcı bildirimi)
· ✅ 36 hekim özeti PDF (tarayıcının «PDF olarak kaydet» hedefi; dosya adı tarihli
`SPI-hekim-ozeti-<gün>`; JS'te Türkçe yazı tipi gömmek bağımlılık demek, HKM PDF'i tahlil
görmez). SPİ 1318, duman temiz.
· ✅ 4 barkod (`core/barkod.js`: kişisel barkod defteri — dış veritabanı yok; ilk okutmada gıda
SORULUR ve bağlanır, sonra doğrudan porsiyona gider; EAN-13/8 ve UPC-A kontrol hanesi denetlenir,
UPC-A = 0 + EAN-13; `BarcodeDetector` olan tarayıcıda fotoğraftan, yoksa elle; fotoğrafta birden
çok barkod → seçilmez, yeniden çekilir; Besin ara › «Barkod») · ✅ 16 kötü gün SPİ
(`core/kotugun.js`: tek dokunuş, yalnız bugün/gelecek; `Move.prescription` yükü en çok «hafif»e
indirir, dinlenme dinlenme kalır; Bugün › SERİ satırında «Kötü gün», asgari günün kalanı yazılır,
«Normal güne dön»; seriyi dondurmaz). SPİ 1322; duman, erişilebilirlik, 390 px temiz.
**SPİ grubu bitti.**
· ✅ 39 okuma takibi (ESP sayfayı ödüllendirmez; oturum isteğe bağlı KİTABA bağlanır —
Bugün › Oturum ekle › Okuma › «Kitap»; `Model.kitapOkuma`: bağlı oturumların ölçülmüş dakikası,
oturum sayısı, sayfa YALNIZ girildiyse, son gün; bağlı oturum yoksa «veri yok»; Kütüphane ›
Kaynaklar › «Okuma» sütunu) · ✅ 41 ünite sonu mini sınavı (`Lesson.uniteSinavi`: yalnız
ünitenin destedeki kartları, en az 4, en çok 10 soru, vade önceliği yok; cevaplar SRS'e yazılır;
«bitti» bayrağı YOK — son sınav «8/10 · ölçüldü» ünitenin yanında; Dil › Öğren › ünite › «Ünite
sınavı») · ✅ 16 kötü gün ESP (`core/kotugun.js`: öncelik sırasının ilk üçü — tıkanma, tarihli
hedef, vadeli tekrar — yerinde; sentez/genişleme yerine «asgari gün yeter»; Bugün › SERİ) ·
✅ 38 günün dil kartı (ortak `hedefag.js` `dilKarti` kancası → `/api/hedef/sync/esp`
`dil_karti`; kartları ESP seçer: vadeli, sonra en düşük kutu, en çok 5, tarih destesi yok;
HKM `dil_karti` tablosu, `schedule.dil_karti` saati — varsayılan KAPALI, HKM › Otomatik
mesajlar; liste 1 günden eskiyse ya da tatildeyse mesaj gitmez; Telegram'daki tekrar SRS'e
YAZILMAZ ve bu mesajda söylenir). ESP 1351, AYS 1676, SPİ 1323, HKM 585; üç duman + yüz temiz.
**ESP grubu bitti.**
· Büyükler: 2 fiş fotoğrafı ve 3 etiket fotoğrafı ZATEN VAR (SPİ `Extract.fromReceipt`,
`Extract.fromFoodLabel`; Finans › Fiş oku, Mutfak › etiket) — tarama «yok» demişti, yanlıştı. Ama
taramada GERÇEK HATA çıktı ve düzeltildi: SPİ `extract.js` görüntüyü `{mime, b64}` yolluyordu,
ortak `llm.js` `im.data` okuyor — dört fotoğraf yolunda modele «base64,undefined» gidiyordu (65a7d16).
· ✅ 7 deneme sonucu fotoğraftan (AYS `core/denemefoto.js`: model yalnız D/Y/B okur, KOD doğrular —
şablon testiyle eşleşme, tam sayı, D+Y+B ≤ soru; tutmayan satır nedeniyle söylenir; form DOLDURULUR,
kaydetmek kullanıcıda; net okunmaz, hesaplanır; Deneme ekle › «Sonuç kâğıdının fotoğrafından
doldur») · ✅ 21 verimli saat (AYS blokları saate bağlı DEĞİL; zamanlayıcı oturumunun başladığı saat
artık `blok.oturumlar` olarak ölçülür; `calc.verimliSaat`: 4 bant, blok çoğunluk dakikasının bandına,
bant başına ≥ 40 soru ve ≥ 3 blok yoksa veri yok, iki bant arası < 5 puan ise «fark yok»; İlerleme ›
Süreç göstergeleri. Veri bu sürümden sonra birikir; plan saati değiştirilmez, bilgi verilir). AYS 1681.
· ✅ 29 evdekinden yemek (SPİ `core/evdeki.js`: model YOK, tarif YOK — 14 ev yemeğinin genel
gerekli/isteğe bağlı malzeme listesi; «evde ne var» metni okunur, tanınmayan parça geri söylenir,
en uzun ad eşleşir; tam olan önce, en çok 2 eksikle olan eksiğin ADIYLA; «Sepetimdekiler»; «Seç»
tencere paylaştırmaya gider; Mutfak › «Evde ne var?»). SPİ 1329; duman, 390 px, erişilebilirlik temiz.
**Sıra:** HKM küçükler (47, 51, 53, 55, 44, 48) → AYS (18, 20, 23, 25, 26, 28, 6) → SPİ (30, 34,
35, 36, 37, 4, 16) → ESP (38, 41, 39, 16) → büyükler (1, 2, 3, 7, 21, 29, 42, 43, 54).

Onaylı: 5, 8, 9, 11–15, 19, 22, 27, 31, 46, 49, 50, 56. Gerisini uygulamadan önce: depoda
var mı bak, kullanıcıya bir cümleyle sor. Boy: **K** küçük · **O** orta · **B** büyük.

**Veri girişi** — 1 O sesle tek cümle günlük kayıt · 2 B fiş fotoğrafından fiyat · 3 B ambalaj
etiketi fotoğrafından gıda · 4 O barkod · 5 K dünkünün aynısı · 6 O şablon gün · 7 B deneme
sonucunu optik formdan okuma · 8 K Telegram tek kelime kayıt · 9 K eksik veriyi tek soruyla.
**Onay ve bildirim** — 10 O tek onay kutusu · 11 K toplu onay · 12 K sessiz saatler · 13 K günlük
bildirim bütçesi · 14 K «bunu bir daha sorma» · 15 K cevapsız teklif 3 günde kapanır.
**Planlama** — 16 O kötü gün modu üç modülde · 17 B takvim içe aktarma, dolu saate plan konmaz ·
18 O «15 dakikam var» · 19 K akşam «yarın şu üç şey» · 20 O sınava kalan gün + gerçekçilik ·
21 B verimli saate göre plan.
**AYS** — 22 K yanlıştan tekrar kartı tek dokunuş · 23 O zayıf 3 konudan mini test · 24 K son iki
deneme konu farkı · 25 O süre analizi · 26 O yanlışın yanında konu notu · 27 K kaldığın sorudan
devam · 28 O paylaşılabilir haftalık ilerleme.
**SPİ** — 29 B «evde şunlar var» tarif · 30 O öğün planından alışveriş listesi · 31 K ucuz muadil ·
32 K tahlil yaşı hatırlatması · 33 O tahlil grafiği · 34 O ilaç/takviye hatırlatması (yalnız
kullanıcının girdiği) · 35 K su ve hareket dürtmesi · 36 O doktora özet PDF (yorum yok) ·
37 K spor salonu karşılaştırma.
**ESP** — 38 O günlük 5 dk dil kartı Telegram'dan · 39 K okuma takibi · 40 O gitar tempo ·
41 O ünite sonu mini sınav · 42 B sesli «öğrendiğini anlat».
**HKM** — 43 B tek cümleden çok modüllü iş · 44 O iş geçmişi zaman çizelgesi · 45 K tahmin–gerçek
maliyet şaşması · 46 K «önce depo» teklifi · 47 K aylık bütçe dağılımı · 48 O bozuk olanı söyleyen
tek ekran.
**Motivasyon** — 49 K haftalık «neler kazandın» · 50 K seri dondurma · 51 O ay sonu mektubu ·
52 K kişisel rekorlar.
**Güven** — 53 O tek zip dışa aktarma · 54 O yeni cihaza taşıma · 55 O gizlilik panosu ·
56 K tatil modu · 57 B aile profili AYS ve ESP'de.
