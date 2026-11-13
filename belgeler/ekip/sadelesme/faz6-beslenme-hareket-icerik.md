# Faz 6 · Beslenme ve Hareket · Aşama 1 içeriği

Tarih: 2026-11-13 · Dal: `sadelesme` · Yazan: model (ekip üyesi, içerik) · Commit yok.

## Özet
İki sağlık alanının 1. aşaması şemaya uygun yazıldı, ikisi de denetleyiciden temiz geçti (çıkış 0):
- **Beslenme** `beslenme.1` «Temeller: besinler ve dengeli tabak»: 3 ünite, 10 ders, 42 alıştırma (ders 25, bunun 6'sı açık uçlu; ünite kapısı 12; aşama kapısı 5), 15 kaynak.
- **Hareket** `hareket.1` «Güvenli başlangıç: temel kalıplar ve form»: 3 ünite, 10 ders, 42 alıştırma (ders 25, bunun 6'sı açık uçlu; ünite kapısı 12; aşama kapısı 5), 18 kaynak.

Her öğe `durum: taslak`, `yazan: model`; her kaynak `dogrulanmamis`, dosya + satır aralığıyla. Ünite kapısı eşiği 0,75 (4 soru), aşama kapısı 0,8 (5 soru, üç üniteyi karıştırır); kapı soruları ders alıştırmalarından ayrı yazıldı. Her aşamanın `kanitIsi` alanı yolun sonundaki «kendi planım / kendi programım» işine ilk tohumdur.

Ana bulgu: gemini-data'da iki alanın da **temel dersi yok** (içerik hattı raporuyla aynı). Tabak modeli, besin grupları, temel kalıp haritası ve kolaydan zora sıraların tek kaynağı depodaki SPİ anlatımıdır (`SPI/src/js/data/rehber.js`, kendi başlığı «elle yazıldı · doğrulanmadı»). gemini-data bunu destekleyen, kaynağın taşıyabildiği pratik konularda kullanıldı; ileri fizyoloji ve kişiye özgü sayılar dışarıda bırakıldı.

## Beslenme
Dosya: `alan/beslenme/asama-1.json`.

Sıra gerekçesi: sahibin tarifi «besin grupları, tabak nasıl kurulur». Önce besinin ne verdiği (makro, kalori, denge), sonra tabak, sonra market ve sofrada bilinçli seçim. Porsiyon ölçüsü ve çiğ-pişmiş farkı (`cig_pismis_…`) bilerek 2. aşamaya (Uygulama) bırakıldı.

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 1.1 Besinler ne verir? | Üç makro besin · Kalori: bir öğünün enerjisi · Harcama ve enerji dengesi | `rehber.js` 128-163; `turk_mutfagi_ve_temel_besinler_kalori_makro.md` 3-4, 13-29 |
| 1.2 Tabağı kurmak | Besin grupları · Tabak modeli · Renk ve mevsim · Bitkisel protein: tahıl ile baklagil | `rehber.js` 128-143; `etiket_okuryazarligi_…` 12-31; `sebzeler_meyveler_renk_…` 20-40, 54-91, 115-131; `bitkisel_bazli_beslenme_…` 9-27 |
| 1.3 Bilinçli seçim | Tokluk ve enerji yoğunluğu · İşlenme derecesi: NOVA · Etiket okumak: şeker, yağ, tuz ve lif | `tokluk_indeksi_…` 19-26, 73-85, 93-104; `etiket_okuryazarligi_…` 12-45, 50-99; `rehber.js` 138-139 |

Kanıt işi: üç öğünü tabak modeline göre değerlendirmek, bir etiket okumak, öğün başına bir değişiklik önermek.

## Hareket
Dosya: `alan/hareket/asama-1.json`.

Sıra gerekçesi: sahibin tarifi «temel hareket kalıpları, güvenli form». Önce hareketin dili ve güvenlik (şiddet, ısınma, gövdeyi sabitlemek), sonra kalıplar tek tek, en son yükü güvenle artırmak. Program yazma (haftada 3 tam vücut, ilerleme kuralı) 2. aşamaya, hacim/RIR ile kas gelişimi 3. aşamaya bırakıldı.

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 1.1 Hareketin temelleri | Aktivite, egzersiz ve şiddet · Isınma · Gövdeyi sabitlemek | `rehber.js` 22-38; `isinma_fizyolojisi_…` 20-24, 38-62; `eklem_mobilite_…` 66-89; `omurga_biyomekanigi_…` 58-72; `egzersiz_biyomekanigi_ve_antrenman.md` 508-515 |
| 1.2 Temel hareket kalıpları | Kalıp haritası · Çömelme · Kalça menteşesi · İtme, çekme ve taşıma | `rehber.js` 94-109; `egzersiz_biyomekanigi_…` 208-215, 308-315, 398-405, 458-465; `kalca_eklemi_…` 48-49; `omurga_…` 71-72 |
| 1.3 Güvenli ilerleme | Set, tekrar ve kalan tekrar · Aşamalı yüklenme · Ağrı, yorgunluk ve toparlanma | `rehber.js` 69-74, 111-125; `egzersiz_biyomekanigi_…` 18-40; `kalistenik_ilerleme_…` 26-35 |

Kalıp haritası: SPİ anlatımı dört kalıp (itme, çekme, bacak, gövde) sayar; gemini egzersiz kataloğu bacağı çömelme ve menteşeye ayırır, taşımayı ayrı kalıp sayar. Ders bu iki kaynağı birleştirip altı kalıp kullanır (çömelme, menteşe, itme, çekme, taşıma, gövde) ve bunu açıkça söyler.

## Klinik sınır
AGENTS §1.5 gereği teşhis, doz, takviye/ilaç miktarı ve tedavi iddiası yok. Derse **alınmayanlar**:
- **Kişiye özgü sayı ve doz benzeri hedefler:** g/kg makro dağılımları ve ketojenik oranlar (`turk_mutfagi_…` 31-35), mineral mg hedefleri ve «30-40 ml/kg» su formülü (aynı dosya 37-43), öğün başına lösin eşiği ve protein gramı (`bitkisel_bazli_…` 18-19 ve tablo sütunu), hipertrofi «bilimsel kuralı» (`egzersiz_biyomekanigi_…` 32-37). Bunlar kişisel plan aşamalarına aittir ve kural motoru hesaplamalıdır.
- **Hastalık ve tedavi iddiaları:** emülgatörlerin «geçirgen bağırsak», otoimmün hastalık, karaciğer yağlanması yaptığı (`etiket_…` 102-105); turunçgil lifinin «vasküler geçirgenliği onardığı», sülforafanın «antikanserojen» olduğu (`sebzeler_…` 40, 56); «reaktif hipoglisemi» (`tokluk_…` 66); disk beslenmesi ve «sabah ilk 60 dakika fıtık riski %300» (`omurga_…` 25-37, 73); «ACL kopma riski fırlar» (`kalca_…` 49).
- **Tanı dili:** tokluk dosyasındaki «Yedi kriterli tanı ve ayırıcı tanı matrisi» (93-105) yalnız öz-gözlem olarak, tanı adı ve «kesin kanıttır» testi olmadan aktarıldı.
- **Klinik alana giren konular:** ağrı nörobilimi, MR bulguları, PEACE & LOVE, sakatlık sonrası yükleme (`sakatlik_onleme_…`), kalça yapısı (FAI, anteversiyon), mobilite taramaları; hiçbiri 1. aşamaya alınmadı.
- Derslerde kalan güvenlik cümleleri yönlendirmedir, teşhis değildir: «göğüs ağrısı, nefes darlığı, baş dönmesi, çarpıntı → dur, hekime danış», «geçmeyen ağrıda uzmana danış» (kaynak: `rehber.js` 35, 16-17).
- DSÖ'nün toplum önerileri (tuz < 5 g, eklenmiş şeker < %10, lif 25 g+, haftada 150-300 dk orta aktivite) ve EFSA su referansı «genel çerçeve, kişiye özel hedef değil» notuyla alındı; bunları kişisel öneri saymak sahibin kararıdır (Açık sorular 2).

## Kaynaklar ve hatalar
Her ders, kaynağındaki sorunu `not` alanında da taşır.

### Beslenme
- **Holt tokluk tablosu şişirilmiş olabilir** (`tokluk_…` 32-69): 38 satırın bazıları (tofu, haşlanmış tavuk göğsü, «soğutulmuş» patates, çikolatalı pirinç patlağı) özgün 1995 çalışmasında olmayabilir, mercimek değeri farklı olabilir; yalnız uçlar (patates 323, kruvasan 47, beyaz ekmek 100) aktarıldı. (Bu şüphe modelin genel bilgisidir, doğrulanmadı.)
- **«Meyve suyu sadece fruktoz ve sitrik asit içerir»** (`sebzeler_…` 40): yanlış genelleme; alınmadı. Likopen emiliminin «3-4 katına» çıkması (24) doğrulanamadı; yalnız «daha kolay emilir» alındı.
- **Hall çalışması** (`etiket_…` 37-44): «%100 birebir eşitlenmiş» yalnız sunulan öğünler için doğrudur (yenen miktar farklı). Dakikadaki gram/kcal hızları, «Bliss Point» oranları ve «+500 kcal fazladan yutulmuş olur» genellemesi alınmadı; yalnız «günde ortalama yaklaşık 500 kcal fazla» sonucu alındı.
- **Etiket dosyasında abartı:** trans yağ için «ölümcül», şeker adlarına «glisemik yük bombası», agave «HFCS'den daha zararlı», «mono ve digliseritler»in trans yağ terimi sayılması (98), sukralozun mikrobiyomu «%50» azalttığı (116); alınmadı.
- **Ön yükleme «%20 (150-200 kcal)»** (`tokluk_…` 76) ve protein kaldıraç hipotezinin «obezite salgınını açıklar» kesinliği (88-89): alınmadı.
- **Bozuk LaTeX:** `cig_pismis_…` satır 53 «$<TAB>o$» (içerik hattı raporundaki bilinen kusur); dosya bu aşamada kullanılmadı.
- `rehber.js` ile gemini arasında çelişki yok; gemini lifi 2 kcal/g ayrıca sayıyor, derste «kaynağa göre» diye eklendi.

### Hareket
- **Kesinlik dili:** «McGill bel ağrısının temel nedenini kanıtlamıştır», «binlerce mekik diski fıtıklaştırır» (`omurga_…` 60-62); karın kaslarının görevi yalnız «McGill'in yaklaşımı» diye aktarıldı.
- **Doğrulanamayan sayılar:** bracing'in disk yükünü «%40-50» azaltması ve mmHg değerleri (`eklem_mobilite_…` 86-88); ısınmada «her 1°C %2-5», «kıkırdak sürtünmesini sıfıra yaklaştırır» (`isinma_…` 45, 48); statik germe kaybı «%4,5-8,5» (24); kas 4-8 / tendon 12-24 hafta uyum süreleri ve «hayati risk» sütunu (`kalistenik_…` 31-32). Hiçbiri alınmadı; yalnız ilkeler (dinamik ısınma, tendon kastan yavaş uyum sağlar) alındı.
- **«Sabah ilk 60 dakika» kuralı ve «%300»** (`omurga_…` 33-37): abartılı sayı, alınmadı.
- `rehber.js` kendi kaynaklarını (DSÖ, ACSM, Helms) adıyla verir ama satır düzeyinde dayanak göstermez; hepsi `dogrulanmamis`.

## Eksikler
- **Kurum kaynağı yok:** tabak modeli ve DSÖ önerilerinin tek dayanağı `rehber.js` (elle yazılmış). Depoda `veri/temiz/spi/who_rehberler.jsonl` var (içerik hattı raporu); bu iş kapsamında okunmadı, kaynak olarak bağlanabilir.
- **Türkiye'ye özgü rehber yok:** TÜBER (Türkiye Beslenme Rehberi) ya da Sağlık Bakanlığı besin grupları gemini-data'da bulunamadı; besin grupları dersi SPİ anlatımının dört bölümüne dayanıyor (süt ürünleri ayrı grup değil, protein kaynakları içinde).
- **Görsel ve hareket gösterimi yok:** form dersleri çizim ya da video ister; şema bunu taşımıyor (Alıştırma `tur` yalnız `secmeli`/`acik`). İçerik hattının önerdiği `tur: uygulama` (hareket için) ve bir görsel alanı şemaya eklenmeli; şu an «kendini kaydet» açık alıştırmaları bunun yerini tutuyor.
- **Hareket kataloğuyla bağ yok:** derslerdeki hareketler `SPI/src/js/data/egzersizkatalog.js` kimlikleriyle eşlenmedi; şemada böyle bir alan yok.
- Su, lif, tuz için ölçme alıştırması (günlük kayıt) bu aşamada yok; 2. aşamanın (Uygulama) işi.

## Açık sorular
1. Tabak modeli ve besin grupları için hangi kurum kaynağı esas alınsın: DSÖ (depoda `who_rehberler.jsonl`), TÜBER, yoksa SPİ anlatımı yeterli mi?
2. DSÖ toplum önerileri (tuz < 5 g, şeker < %10, haftada 150-300 dk) 1. aşamada kalsın mı, yoksa §1.5 açısından «sayı» sayılıp çıkarılsın mı?
3. Hareket derslerine çizim ya da video eklenecekse şemaya görsel alanı ve `uygulama` alıştırma türü eklensin mi (`alan/SEMA.md` sahibin/koordinatörün)?
4. Altı kalıplı harita (çömelme, menteşe, itme, çekme, taşıma, gövde) kabul mü, yoksa SPİ'nin dört kalıbı mı korunsun?

## Doğrulama
- `python alan/denetle.py alan/beslenme` → «Temiz · 1 dosya, 1 aşama, 3 ünite, 10 ders, 42 alıştırma, 15 kaynak» (çıkış 0).
- `python alan/denetle.py alan/hareket` → «Temiz · 1 dosya, 1 aşama, 3 ünite, 10 ders, 42 alıştırma, 18 kaynak» (çıkış 0).
- Kapı soruları ders alıştırmalarından ayrı yazıldı; bunu denetleyici sınamıyor, elle kontrol edildi.
- Dokunulan dosyalar yalnız `alan/beslenme/asama-1.json`, `alan/hareket/asama-1.json` ve bu rapor; git işlemi yapılmadı.
