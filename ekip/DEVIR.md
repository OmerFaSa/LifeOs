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
✅ 8c-2 · ✅ 8c-3 · ✅ 8d dil (🔜 8d-2 gitar) · ⏳ 8e · ⏳ tam koşum · ⏳ Part 9 (en son, onaylı harita ile)

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
- 🔜 8d-2 Gitar: `guitar_tabs.js` şemasında teknik/ilerleyiş paketi (tempo «referans»
  etiketiyle; `startBpm` öneri, eşik kullanıcının ilk ölçümünden). Önce ESP müzik ekranının
  tempo ölçümünü nasıl tuttuğuna bak (`screens/music*`, `core/…`), sonra aynı kalıp.
- ⏳ 8e Depo önce (King teklifinde «zaten var, bedava» / «tazeleyeyim mi?»), tazelik,
  kullanım takibi (açılmamış çıktı bir sonraki pahalı teklifte söylenir).

### Cevabı gelen maddeler (sıra: Part 8'den sonra)
- ⏳ Y5 Sağlık verisi içe aktarma — iPhone `export.xml` + Android Health Connect; önizleme
  + onay (Y3 .ics yolu gibi), ölçüldü etiketi, SPİ kendi koduyla yazar.
- ⏳ Y1 Para kolu — girişler Telegram yazışması, King/akşam sohbeti, fiş fotoğrafı; öneri
  HKM içinde bir bölüm (ilk adımda bir cümleyle teyit). Fişten okunan «tahmin», önizleme +
  onay; tutarı kod hesaplar.
- ⏳ Y10 Veli / koç özeti — haftada 1–2 PDF, sıklığa kod karar verir (kullanım, karar
  yoğunluğu, aciliyet, sağlık, ders kararlılığı); alıcıyı ilk adımda sor.
- ⏳ Y11 Kariyer / proje — esnek; ilk adım akademi: LGS, YKS, KPSS, DGS, ALES, YDS
  önerisi (`AYS/src/js/core/sinavprofil.js` üstüne), gerekçeli, karar kullanıcının.
- ⏳ 10 Ana sınavı değiştirebilmek (büyük aksiyon) + üniversite müfredatı yükleme.
- ⏳ 11 Tahmin tablolarını kaynağa bağlamak — sağlayıcı esnek, bütçe Ayarlar'dan.
- ⏳ 14 Depo göçü (her kayıt kendi anahtarında; yedek 15 bitti) · 16 ilk kurulum testleri ·
  17 ekran sözleşmesi AYS/ESP · 18 labs.js ve AYS llm.js.

### Part 9 — Tek tasarım + çekmece düzeni (EN SON)
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

## Kullanıcı kolaylığı fikirleri · 16 hızlı kazanç ONAYLI, gerisi ÖNERİ

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
