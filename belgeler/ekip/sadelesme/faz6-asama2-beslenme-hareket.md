# Faz 6 · 2. aşama · Beslenme, Hareket

Tarih: 2026-11-14 · Dal: `sadelesme` · Yazan: içerik ajanı (Claude) · Commit yok, koordinatör inceler.

## Özet
İki sağlık alanına birer 2. aşama yazıldı: `alan/beslenme/asama-2.json` («Uygulama: ölçü, öğün ve dışarıda yemek») ve `alan/hareket/asama-2.json` («Düzenli program: haftalık plan ve ilerleme»). İkisi de 1. aşamaya `onKosul: ["<alan>.1"]` ile bağlı; her ünitede 4 soruluk kapı (eşik 0,75, sorular kolaydan zora), 6 soruluk aşama kapısı (eşik 0,8). Hiçbir öğe `onayli` değil: bütün dersler ve sorular `durum: "taslak"`, `yazan: "model"`; bütün kaynaklar `dogrulama: "dogrulanmamis"`.

| Alan | Ünite | Ders | Ders alıştırması (açık) | Ünite kapısı | Aşama kapısı | Toplam soru | Kaynak (gemini / depo) | Cevap harfi A/B/C/D |
|---|---|---|---|---|---|---|---|---|
| Beslenme | 3 | 9 | 27 (2) | 12 | 6 | 45 | 21 (13 / 8) | 12 / 10 / 11 / 10 |
| Hareket | 3 | 9 | 27 (2) | 12 | 6 | 45 | 20 (7 / 13) | 12 / 12 / 10 / 9 |

Sayılar betikle (JSON üzerinden) sayıldı, kesin. Her kaynağın dosyası var ve satır aralığı dosyanın içinde (betikle denetlendi; ilk ve son satır yazdırılıp gözle de okundu; `C:\gemini-data` yalnız okundu).

Kalite kapısı (bu koşuda, iki dosya yazıldıktan sonra):
- `PYTHONIOENCODING=utf-8 python alan/denetle.py alan/beslenme` → `Temiz · 2 dosya, 2 aşama, 6 ünite, 19 ders, 87 alıştırma, 36 kaynak` (çıkış 0)
- `PYTHONIOENCODING=utf-8 python alan/denetle.py alan/hareket` → `Temiz · 2 dosya, 2 aşama, 6 ünite, 19 ders, 87 alıştırma, 38 kaynak` (çıkış 0)
- `python alan/denetle_test.py` → `14/14 test geçti`
- `python kalite/katman_test.py` → `TAMAM: katman_test 0 hata`
- `python kalite/olcum.py --denetle` → `Bütçe tamam: 28 bütçe, aşım yok.` (çıkış 0)

İş iki koşuda bitti: ilk koşu hesap sınırına takıldı, diskte yalnız bu raporun boş iskeleti kalmıştı. İkinci koşu iki dosyayı baştan yazdı (önce Beslenme, denetçi temiz, rapor; sonra Hareket).

## Beslenme
Dosya: `alan/beslenme/asama-2.json` · aşama `beslenme.2` «Uygulama: ölçü, öğün ve dışarıda yemek» · `onKosul: ["beslenme.1"]`.

**Sıra gerekçesi.** İçerik hattı §6 yol haritası Beslenme 2. aşamaya «Uygulama: öğün kurma, porsiyon, ölçü, dışarıda yemek» der ve üç gemini dosyasını gösterir (`cig_pismis_…`, `kahvalti_kombinasyonlari_…`, `yemekhane_restoran_…`). 1. aşama raporu porsiyon ölçüsünü ve çiğ-pişmiş farkını bilerek bu aşamaya bırakmıştı. Bu yüzden önce **ölçmek** (çiğ-pişmiş, ev ölçüsü, görünmeyen eklemeler), sonra bu ölçüyle **öğün kurmak** (kahvaltı, ana öğün, önceden hazırlık), en son evin dışı ve **kaydı okumak**. «Hedefe göre» (kilo, performans, makro dağılımı) 3. aşamanın işi olarak dışarıda kaldı.

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 2.1 Ölçmek: çiğ, pişmiş ve ev ölçüsü | Çiğ mi, pişmiş mi? · Ev ölçüleri: kaşık, bardak, avuç (+ tartı uygulaması, `acik`) · Görünmeyen eklemeler: yağ, sos ve şeker | `cig_pismis_…` 9-13, 15-32, 34-51, 53-129; `kahvalti_…` 72-79; DSÖ `who_rehberler.jsonl` 36-38 |
| 2.2 Öğün kurmak | Kahvaltıyı kurmak · Ana öğünü ölçüyle kurmak · Önceden hazırlamak ve güvenle saklamak | `kahvalti_…` 20-26, 104-122; `rehber.js` 135-137; `turk_sokak_…` 9-19; `cig_pismis_…` 53-129; DSÖ 36-38, 43 |
| 2.3 Dışarıda yemek ve kaydı okumak | Lokanta ve yemekhane · Sokak, fırın ve kafe · Kaydı okumak ve sınırlar (+ kanıt işi, `acik`) | `yemekhane_restoran_…` 13-22, 145-199, 201-205, 237-247, 285-301; `turk_sokak_…` 9-19; `rehber.js` 157-160, 169-177; `plan.js` 202-213; `nutri.js` 310-311; `rules.js` 36-60 |

Kanıt işi: üç günlük öğün günlüğü (ev ölçüsü, çiğ/pişmiş, tabak modeli değerlendirmesi) ve dışarıda bir öğün için sipariş planı; **kalori hedefi konmaz**.

Yöntem: dosya Python ile kuruldu (seçenek sırası ve cevap harfi elle verildi), `json` ile yazıldı. Dersteki her hesap elle ve betikle sağlandı (ör. 200 g pilav: 138 × 2 = 276, 360 × 2 = 720, fark 444; 130 ÷ 2,6 = 50; 150 + 240 + 80 = 470). DSÖ sayıları `veri/temiz/spi/who_rehberler.jsonl` satırlarından (indirilmiş, temiz katman); 1. aşamadaki gibi «toplum önerisi, kişiye özel hedef değil» notuyla. Kaynakta olmayan bağlantı cümleleri ve örnekler metinde «modelin bağlantı notu / modelin örneği / modelin hesabı / modelin önerisi» diye işaretli.

## Hareket
Dosya: `alan/hareket/asama-2.json` · aşama `hareket.2` «Düzenli program: haftalık plan ve ilerleme» · `onKosul: ["hareket.1"]`.

**Sıra gerekçesi.** İçerik hattı §6 Hareket 2. aşaması «Düzenli program: haftada 3 tam vücut, ilerleme kuralı» (gemini `antrenman_programlama_mimarileri_…`). 1. aşama raporu program yazmayı ve ilerleme kuralını açıkça bu aşamaya, hacim ve RIR ile kas gelişimini 3. aşamaya bırakmıştı. 1. aşamada kalıplar, form, set-tekrar-kalan tekrar ve aşamalı yüklenmenin ilkesi öğretildi; bu aşama bunları **haftaya** (iskelet, tam vücut seansı, kuvvet ve koşunun sırası), **kurala** (kalistenik merdiveni, haftalık %10, yük indirme) ve **kayda** (antrenman kaydı, toparlanmaya göre günün yükü, dört haftalık program) çeviriyor. Yük kuralları SPİ'nin kendi kurallarıyla aynı: haftalık toplam yük %10'dan fazla artmaz (`movement.js` 332-336), beş haftada bir yük %40 azaltılır (337-341), kötü gün alt sınırı 15 dakika (342-346), sistem yükü yalnız azaltır (`move.js` 306-334).

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 2.1 Haftayı kurmak | Haftanın iskeleti: kuvvet, yürüyüş, dinlenme · Tam vücut seansı · Aynı haftada kuvvet ve koşu | `rehber.js` 30-35, 48-50, 59-75, 98-106, 211; DSÖ `who_rehberler.jsonl` 14; `movement.js` 349-367 (şablonlar); `antrenman_programlama_…` 12-16, 41-42 |
| 2.2 İlerleme kuralı | Kalistenik merdiveni · Haftalık %10 sınırı · Yük indirme haftası | `rehber.js` 59-75, 98-106; `kalistenik_ilerleme_…` 12-14, 46-76; `movement.js` 318-347; `move.js` 267-303; `antrenman_programlama_…` 66-73; `toparlanma_bilimi_…` 86-94 |
| 2.3 Kayıt ve uyarlama | Antrenman kaydı (+ bir haftalık kayıt görevi, `acik`) · Toparlanmaya göre günün yükü · Dört haftalık programını yazmak (+ kanıt işi, `acik`) | `rehber.js` 115-122; `movement.js` 286-316, 318-347; `move.js` 126-130, 306-334; `toparlanma_bilimi_…` 71-78 |

Kanıt işi: dört haftalık kendi programı (haftada üç tam vücut günü, A-B dönüşümlü; aralarda dinlenme ya da yürüyüş), her antrenmanın kaydı ve dört hafta sonunda ilerleme notu; ağrıda kayıt ve durma.

Hesaplar elle ve betikle sağlandı (ör. 30 + 30 + 60 = 120, eksik 30 ÷ 3 = 10; koş-yürü 6 × 3 + 10 = 28, kaynağın kendi örneğiyle aynı; 80 → 88, 40 → 44, 50 → 55; 3 × 12 = 36 → 3 × 13 = 39). Yük indirme haftası SPİ'nin sayacından: `inCycle === every − 1`, yani ilk antrenmandan sonraki 5. hafta (`move.js` 280-289).

## Güvenlik
AGENTS §1.5: teşhis, doz, takviye/ilaç miktarı, tedavi iddiası, g/kg hedefi yok. Derslerde kalan güvenlik cümleleri yönlendirmedir.

**Derse konan güvenlik metinleri (1. aşamadaki dille):**
- Beslenme 2.3.3: «Gebelikte, emzirirken, yeme bozukluğu geçmişinde ya da kronik bir hastalıkta kilo ya da öğün düzenini değiştirmeye yönelik bir plan önce hekim veya diyetisyenle konuşulur» (`rehber.js` 170'ten). Aynı derste SPİ'nin sınırı (`rules.js` 36-60): hekim değildir, teşhis koymaz, ilaç ya da takviye dozu önermez, tedaviyi bıraktırmaz, ölçülmemiş sayı uydurmaz; takviyede doz kararı hekimindir. Aşama kapısı k6 bunu soruyor.
- Beslenme 2.3.3, **modelin notu** (kaynakta yok, sahip onaylamalı): «Öğün kaydı kaygı ya da suçluluk yaratıyorsa ara verilir ve bir uzmana danışılır.»
- Beslenme kalori kuralı yalnız SPİ'nin kuralı: «Enerji hedefi bazal metabolizmanın altına inmez; hareket girilmeyen günde hedef bazalda kalır» (`plan.js` 202-213, `nutri.js` 310-311). Kanıt işinde «kalori hedefi konmaz».
- Beslenme gıda güvenliği (2.2.3): 2 saat kuralı, sığ kapta hızlı soğutma, buzdolabı süreleri (kaynağın tablosu, doğrulanmamış).
- Hareket 2.1.1, 2.3.2, 2.3.3: «Göğüs ağrısı, nefes darlığı, baş dönmesi ya da çarpıntı egzersizde normal değildir; durulur ve hekime danışılır. Kronik bir hastalık, gebelik, düzenli ilaç ya da geçmeyen bir ağrı varsa programa başlamadan önce hekimle konuşulur» (`rehber.js` 17, 35). Aşama kapısı k6 bunu soruyor.
- Hareket 2.3.1: ağrı ayrımı (yaygın, geçen gerginlik olağan; sabit, artan ya da topallatan ağrıda hareket kesilir, geçmeyen ağrıda sağlık uzmanı) (`rehber.js` 73-74).
- Hareket 2.3.2: SPİ kuralları: ateş 38,5 °C ve üzerinde antrenman yok (`move.js` 126-130); ince ölçüm yükü artıramaz; akut/kronik oran ve yük indirme emri yalnız daha temkinli yapar; kötü gün alt sınırı 15 dakika. «Bantlar antrenman yükü içindir, hastalık belirtisi okumaz.»
- Antrenman sayıları yalnız SPİ'nin kuralları: %10 haftalık sınır, beş haftada bir %40 indirme; gemini'nin 4-6 hafta ve set %40-50 azaltma sayıları «iki kaynak aynı fikri benzer sayılarla verir» diye.

**Klinik sınır yüzünden dışarıda bırakılanlar** (hepsi ilgili dersin `not` alanında da yazılı):
- Beslenme · kişiye özgü sayı: DSÖ bilgi notundaki protein oranı ve gramı (`who_rehberler.jsonl` 44-45); SPİ anlatımındaki «haftada 0,5-1 kg» ve «800 kcal altı» (`rehber.js` 169, 3. aşamaya); protein tozu ölçeği (`cig_pismis_…` 95).
- Beslenme · sağlık iddiası: dirençli nişastanın kan şekeri ve insülini «%30-40» düşürdüğü, «bağırsak bariyerini onardığı» (`kahvalti_…` 124-131); toksinin «akut karaciğer toksisitesi» (108); kutu meyve suyunun «karaciğere doğrudan yağ depolattığı» (`yemekhane_…` 246); simit + proteinle «insülin zirvesini %30-40 baskılamak» ve yürüyüşün «yağ depolama kapısını kapatması» (`turk_sokak_…` 12, 14, 19); tarçın «GLUT-4» ve elma sirkesi (`cig_pismis_…` 129, 135); hazır sosta «inflamatuar yük» (`kahvalti_…` 79); sucukta nitrit/nitrat (`yemekhane_…` 204).
- Hareket · ilaç: ağrı kesici (NSAİİ) kullanımının kas gelişimini «%40-50» köreltmesi (`toparlanma_bilimi_…` 63-67).
- Hareket · g/kg: toparlanma için «kg başına 1,6-2,2 g protein» (75) ve glikojen için «5-7 g/kg karbonhidrat» (39).
- Hareket · tanıya benzeyen eşikler: «sürantrenman erken tespiti» tablosu (kavrama kuvveti %10-15 düşüş, nabız +5-8, HRV −1,5 standart sapma; `antrenman_programlama_…` 58-64), sinir sistemi yorgunluğunun «5-14 gün» toparlanması (53-56); SPİ'nin oksijen satürasyonu eşiği (`move.js` 131-134).
- Hareket · tendon riski: «hayati risk» sütunu (yırtık, epikondilit, labrum) ve 12-24 hafta uyum süreleri (`kalistenik_ilerleme_…` 27-35); «sakatlık riski tavan yapar» (`toparlanma_bilimi_…` 41).

## Kaynaklar ve hatalar
**Beslenme**
- `yemekhane_restoran_…` kendi içinde çelişiyor: lokanta pilavı 200 g için 340-360 kcal (satır 18) ve 472 kcal (43); Adana kebap girişte 900-1.100 kcal (20, İskender'le birlikte), detayda bir şiş 379 kcal (257); Sezar salata 750-850 (22), 700-800 (300), 805 (299); şuruplu latte 378 (239) ve 300-350 kcal (240). Derste yalnız Sezar salatanın aralığı «kaynağa göre 700-850» ve latte «yaklaşık 378» diye kullanıldı; pilav ve Adana sayıları alınmadı.
- Şişirilmiş genellemeler alınmadı: dışarıdaki tuzakların kilo almanın «1 numaralı sebebi» olduğu (`yemekhane_…` 15), Sezar salatanın «hamburgerden daha yağlı» olduğu (22), lahmacunun «en temiz, en dengeli menü» olduğu (20); `cig_pismis_…` 11 «klinik diyetetikte en ölümcül hata».
- `cig_pismis_…` satır 53 tablo başlığında bozuk LaTeX («$<TAB>o$», bilinen kusur); tablo verisi etkilenmiyor.
- `kahvalti_…` tokluk süresi sütunu bir tahmin; «kaynağın tahmini, doğrulanmadı» diye anıldı.
- Gıda güvenliği süreleri (`kahvalti_…` 112-122) tek kaynaktan; resmî bir gıda güvenliği kaynağıyla karşılaştırılmadı.
- Ölçü farkı: kaynak «1 silme tatlı kaşığı şeker 4 g» der, DSÖ «12 silme çay kaşığı ≈ 50 g» der; ikisi de yaklaşık 4 g'a denk düşüyor (50 ÷ 12 ≈ 4,2), derste ikisi ayrı ayrı adıyla verildi.

**Hareket**
- Yük indirme haftasında kaynaklar ağırlıkta çelişiyor: `antrenman_programlama_…` 72 «ağırlık %100 korunur, asla hafifletilmez», `toparlanma_bilimi_…` 92 «%85-90'ı», SPİ `movement.js` 337-341 «yük %40 azaltılır» (toplam yük). Ders üçünü de adıyla veriyor; uygulama kuralı SPİ'ninki.
- Kesinlik dili alınmadı: Hickson deneyinin «kanıtlamıştır» (`antrenman_programlama_…` 28), «AMPK mTORC1'i doğrudan kapatır» (34), «bisiklet %50 daha az girişim» (45), «süperkompansasyon patlaması, yeni rekorlar» (75; `toparlanma_bilimi_…` 88), tam vücut düzeninde «kas protein sentezi sürekli tavanda» (16), «altın standart», «omuz sıkışma riski sıfıra yakın» (17-18).
- Kalistenik basamaklarındaki yüzdeler («vücut ağırlığının %64'ü», «%80-85»; `kalistenik_ilerleme_…` 50, 72) doğrulanmadı, alınmadı.
- SPİ'nin kendi sayıları (bant sınırları 80/65/50/35, girdi ağırlıkları, akut/kronik oran eşikleri 0,8 ve 1,5) `movement.js`'te dayanaksız yazılı; derste «SPİ'nin kuralı» diye verildi, doğrulanmadı.
- `rehber.js` kaynaklarını (DSÖ, ACSM, Helms) adıyla verir ama satır düzeyinde dayanak göstermez; DSÖ çerçevesinin bir kısmı temiz katmandaki `who_rehberler.jsonl` 14 ile desteklendi.

## Eksikler
- **Beslenme:** Türk ev ölçüleri için kurum kaynağı yok (TÜBER ya da TürKomp ev ölçüsü tablosu gemini-data'da bulunamadı); ölçüler tek bir gemini atlasından. Gıda güvenliği süreleri resmî kaynağa bağlanmadı. Yol haritasının «porsiyon» maddesi ev ölçüsüyle karşılandı; kişiye göre porsiyon büyüklüğü (enerji ihtiyacına göre) bilerek 3. aşamaya bırakıldı. `veri/taslak/spi/tuber_beslenme_rehberi.jsonl` ve `veri/temiz/spi/tuber_dogrulanan.jsonl` bu koşuda okunmadı; Türkiye rehberi için bağlanabilir.
- **Hareket:** Hareket gösterimi (çizim, video) yok; şemada görsel alanı ve `uygulama` alıştırma türü yok, kayıt görevleri `acik` olarak yazıldı. Derslerdeki hareketler `SPI/src/js/data/egzersizkatalog.js` kimlikleriyle eşlenmedi (şemada alan yok). `veri/taslak/spi/egzersiz_kalistenik_rehberi.jsonl` (elle yazılmış taslak) incelenmedi. Koşu dışındaki dayanıklılık (bisiklet, yüzme) ve mobilite programı 4. aşamaya kaldı.
- **İkisi için:** bütün kaynaklar `dogrulanmamis`; sahip incelemesi yapılmadı. Açık uçlu alıştırmalar (`acik`) puanlanmıyor. Kanıt işleri gerçek kayıt (öğün, antrenman) istiyor; kayıt motoruna (`motor/kayit.js`) bağ şemada yok, sahip elle değerlendirir.

## Açık sorular
1. **Beslenme:** Ev ölçüleri ve pişirme katsayıları için TürKomp ya da TÜBER ev ölçüsü tablosu bulunup kaynak yapılsın mı? Şimdiki tek kaynak bir gemini atlası.
2. **Beslenme:** DSÖ'nün «günde en az 400 g sebze-meyve» ve «serbest şeker 50 g ≈ 12 çay kaşığı» sayıları 1. aşamadaki tuz/şeker sayıları gibi «toplum önerisi» notuyla kalsın mı (1. aşama Açık soru 2 ile aynı karar)?
3. **Beslenme:** «Öğün kaydı kaygı yaratıyorsa ara ver, uzmana danış» cümlesi kaynakta yok, modelin güvenlik notu; derste kalsın mı?
4. **Hareket:** Yük indirme haftasında uygulama kuralı SPİ'ninki (toplam yük %40 azalır) mı kalsın, yoksa gemini'nin «set sayısı yarıya, ağırlık korunur» biçimi mi esas alınsın? İkisi şu an yan yana anlatılıyor.
5. **Hareket:** SPİ'nin bant sınırları ve akut/kronik oran eşikleri (0,8 / 1,5) derste «SPİ'nin kuralı» diye öğretiliyor; bu sayılar için bir dış dayanak istensin mi?
6. **İkisi için:** Kanıt işleri (3 günlük öğün günlüğü, 4 haftalık program) kayıt motorundaki gerçek kayıtlara bağlansın mı? Şemada bunun yeri yok.
