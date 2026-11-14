# Faz 3 · Rozet, Her şeyde arama, King sayfası

## Özet
2026-11-14, yerel `sadelesme` çalışma ağacı (commit yok). Üç iş bitti, testli ve gerçek tarayıcıda gezildi:
1. Altın «taşınıyor» rozeti hiçbir ekranda yok (Öğren, Sağlık, Sistem haritası, Yol haritası listesi).
2. `#/motor/arama` «Her şeyde arama»: on alanın iki aşamasındaki dersler (başlık, metin, alıştırma soruları), notlar (Not motorunun araması, özel notlar dahil), metin alanlı kayıtlar, yerler ve ayarlar; yerel, ağsız, Türkçe katlamalı, türe göre gruplu, her sonuç kendi dersini/notunu/kaydının gününü açar, taslak ders işaretli. Komut çubuğunun son öğesi «Her şeyde ara: <sorgu>». Ölçüm: 544 ders; tarayıcıda bir sorgu (arama + çizim) ortanca 2,2 ms, soğuk açılışta dizin (20 dosyayı yükleme dahil) 87 ms.
3. `#/king` kısa açıklama sayfası: King nedir, nerede konuşulur (Claude masaüstü uygulaması), ne görür ve görmez, sahibin tek adımı (Claude'u tamamen kapatıp açmak). Sohbet taklidi yok.

Arama ve King'in `durum`u `yeni`; haritada `plan` durumunda yer kalmadı.

**Kural notu:** AGENTS §0.1 kural 6 («önce örnek, sonra kod»: tasarım değişikliği varyasyonla gösterilir, sahibi seçer) bu turda **atlandı**; sahibin «sorma» talimatıyla karar verildi, yalnız var olan yapı taşları kullanıldı. Beğenilmezse üç sayfa da tek dosyadan geri alınır (aşağıdaki Açık sorular 1).

**Değişen dosyalar:** `kabuk/kabuk.js` (rozet, komut çubuğu son öğesi, King sayfası), `kabuk/arama.js` (yeni), `kabuk/araclar.js` (Yol listesinden rozet; Kayıt'ta gün yolu), `kabuk/harita.js` (iki `durum`), `kabuk/index.html` (bir betik satırı), `kabuk/kabuk.test.js` (9 yeni test), `tools/kabuk_gez.js` (rozet, arama, King adımları).

## Rozet
- Altın «taşınıyor» rozeti hiçbir yerde çizilmiyor: Öğren ve Sağlık dal sayfaları, Sistem haritası (üçü `kabuk/kabuk.js` `durumPul`) ve Araçlar › Yol haritası listesi (`kabuk/araclar.js` `sayfaYol`).
- `durumPul` ve `DURUM_AD` saf kısma taşındı ve `Kabuk.durumPul` olarak dışa açıldı (testte). `DURUM_AD`'de artık yalnız `eski: 'eski sayfada'` ve `plan: 'hazırlanıyor'` var; ikisi de sade (normal) rozet. `pilot` ve `yeni` rozet almaz.
- `kabuk/harita.js`'teki `durum` değerleri olduğu gibi kaldı (testler, eski modül bağlantısı ve King'in `sistem_haritasi` aracı onları okuyor). Yeni rozet eklenmedi; taslak içerik ders kartındaki «taslak» rozeti ve Onaylar ekranıyla zaten söyleniyor.
- Bu turdan sonra «hazırlanıyor» rozeti de hiçbir yerde görünmüyor, çünkü `plan` durumundaki son iki yer (Arama, King) `yeni` oldu.

## Her şeyde arama
`#/motor/arama` artık «Her şeyde arama» sayfası (`kabuk/arama.js`, yeni dosya; `kabuk/index.html` onu `araclar.js`'ten sonra, `kabuk.js`'ten önce yükler). Arama'nın `durum`u `kabuk/harita.js`'te `plan` → `yeni`.

- **Tek arama alanı** (`B.alan` tür `arama`), sonuçlar türe göre gruplu (`B.bolum` + `B.liste`), her grup başlığında sayı; grup başına ilk 20/10/10/8 sonuç, fazlası «N sonuçtan ilk M tanesi; aramayı daralt.» der. Sonuç sayısı ekran okuyucuya `aria-live` satırıyla söylenir; liste her harfte yeniden çizilir ama alan odakta kalır.
- **Dersler:** on alanın iki aşaması da (taşınmış her `asama-N.json`): ders başlığı, özet, ders metni ve alıştırma soruları. Kapı soruları aranmaz (öğrenen onları derste görmez, doğru cevap kapıda gösterilmez). Her kelime bir yerde geçmeli (VE); başlık önce gelir (başlık 10 + kelime başı 5, özet 4, metin 2, soru 1, tam başlık +30). Satırın notunda alan, aşama ve eşleşmenin geçtiği parça; taslak ders `taslak` rozetiyle (kesik). Bağlantı dersin kendisini açar (`#/alan/<alan>/ders/<kimlik>`); kilitli dersin kilidini Yol söyler.
- **Notlar:** Not motorunun kendi `ara`'sı (başlık, etiket, gövde; `#etiket` de çalışır). Özel notlar da aranır ve `özel` rozetiyle görünür: bu sahibin kendi ekranı; sayfa hiçbir şeyi King'e ya da ağa vermez (King notları yalnız MCP sunucusunun `kingOkur` süzgecinden okur). Bağlantı notu açar.
- **Kayıtlar:** yalnız metin alanı olan kayıtlar (`ek`: ne yediğin, etkinlik, not, alan/konu…); sayıdan ibaret kayıt ve tür adı aranmaz. Yeni olan önce. Bağlantı kaydın gününü açar: Kayıt sayfası `#/motor/kayit/gun/<YYYY-AA-GG>` yolunu tanır; yedi günlük yazma penceresinden eski gün de seçilip okunur, o güne yazmayı motor kendi cümlesiyle reddeder.
- **Yerler ve ayarlar:** komut çubuğunun öğeleri ve sıralaması (`Kabuk.komutOgeleri` + `Kabuk.ara`); yalnız açılabilen (yolu olan) öğeler.
- **Katlama:** kabuğun `Kabuk.katla`'sı (ç ğ ı İ ö ş ü ve â î û; büyük/küçük farkı yok), komut çubuğuyla aynı. «SORARAK DUSUNMEK», «sokrates», «İYİ BİR TANIM» testte.
- **Komut çubuğu:** yazılı her sorguda son öğe «Her şeyde ara: <sorgu>» (`Kabuk.komutSonucu`); Enter ya da tıklama `#/motor/arama?<sorgu>`'yu açar. Sorgu adresin `?` sonrasında durur (yalnız bu tarayıcıda; yazdıkça `history.replaceState` ile güncellenir, geri tuşu sorguyu korur).
- **Hız:** ders dizini ilk aramada bir kez kurulur (on alanı `alanYukle` ile ister, kabuğun kendi aşama kurucusu ve onay bindirmesiyle). Sahibin onayı bir aşamayı yeniden kurarsa dizin bir sonraki aramada yenilenir (aşama nesnesinin kimliği karşılaştırılır). Dizin kurulurken ders grubu «Dersler hazırlanıyor…» der, notlar ve yerler hemen gelir.
- **Ölçüm (Node, gerçek içerik, 2026-11-14):** 544 ders (Akademik 377 dahil; 1.294 alıştırma sorusu ders satırının içinde aranır), dizin kurulumu 22–25 ms, bir sorgu 1,8–2,2 ms (üç koşu). Görevdeki «≈2.300 ders» sayısı içerikle tutmadı: depodaki ders sayısı 544; ders + alıştırma ≈1.840, kapı soruları (aranmaz) 1.213. Tarayıcı ölçümü Gezi bölümünde.

## King sayfası
`#/king` artık kısa bir açıklama sayfası (`kabuk/kabuk.js` `kingGovde`, saf kısımda; yalnız `B.baslik`, `B.bolum`, `B.liste`, `B.uyari`). King'in `durum`u `plan` → `yeni`; haritada `plan` durumunda yer kalmadı.

- **Ne:** düşünce ortağı; açıklar, öğretir, araştırır; sayıyı ve kaydı LifeOS tutar.
- **Nerede konuşursun:** Claude masaüstü uygulaması; LifeOS'ta ayrıca sohbet yok. Sohbet kutusu, form, düğme ve bağlantı yok (testte).
- **Ne görür:** sistem haritası, bugünün özeti ve planı, kesinlik etiketli kayıtlar, notlar (özel olanlar hariç), yol haritası ve tekrar kartları (kapı soruları hariç), kaynaklı araştırma (internete yalnız konunun adı gider).
- **Ne yapmaz:** yalnız okur (kayıt, not, onay, ayar yazmaz); özel notları, King'e kapalı araçların notlarını ve sırları (parola, anahtar, jeton) görmez; bu tarayıcıdaki yeni not, kart ve yol ilerlemesini tek depoya geçişten sonra görür (KURULUM.md'nin «henüz göremez» satırı, saklanmadı).
- **Senin adımın** (KURULUM.md §1–2'nin sözleriyle): kurulumdan sonra Claude'u tamamen kapat (görev çubuğundaki simgeden «Çık»), yeniden aç, araç menüsünde «lifeos-king»i gör, «Bugün ne var?» diye sor; görünmüyorsa Ayarlar › Geliştirici'deki günlük. Yapılandırma dosyası ve yollar ekrana konmadı (iç ayrıntı; KURULUM.md'de).
- **Dürüstlük satırı** (bilgi uyarısı): King'in okuduğu her şey o sohbette Claude'a, yani Anthropic'in sunucusuna gider; özel notlar ve sırlar gitmez.
- Ekranda «MCP» gibi iç terim yok (testte).

## Testler
- `node kabuk/kabuk.test.js` → **64 geçti, 0 kaldı** (önce 55; 9 yeni). CI zaten bu dosyayı koşuyor, ayrı `arama.test.js` açılmadı (CI dosyasına dokunma yetkim yok).
  - rozet: `pilot`/`yeni` rozetsiz, `eski` ve `plan` sade rozetli, `kabuk.js` ve `araclar.js`'te `'taşınıyor'` yazısı yok;
  - arama (7): gerçek içerikle dizin (10 alan × 2 aşama, ders sayısı Yol'un saydığıyla eşit, süre yazılır, sorgu < 250 ms), başlık önceliği ve Türkçe katlama, VE kuralı, alıştırma ve metin araması ve parça, taslak işareti ve onay bindirmesiyle kalkışı, kayıt araması (yalnız metin alanı, yeni önce), dört grup birlikte (özel not dahil, dizin yokken «hazır değil»), komut çubuğu son öğesi ve adres;
  - King (1): gövdede beklenen cümleler, form/girdi/düğme/bağlantı yok, «MCP» ve «hazırlanıyor» yok, `plan` durumunda yer kalmadı.
- Öteki kabuk testleri değişmeden yeşil: bilesen 18, onay 14, tanisma 25, deneme 6, depo 13.
- `python king/mcp_test.py` → TEMİZ, 0 kırmızı (King'in `sistem_haritasi` aracı haritayı okuduğu için koşuldu; geçici veriyle).
- `python kalite/katman.py` → tamam (1 bilinen istisna, yeni bozulma yok); `python kalite/olcum.py --denetle` → 28 bütçe, aşım yok. Her iş bitince ayrı ayrı koşuldu.

## Gezi
`node tools/kabuk_gez.js --goruntu=arama,king` (kendi sunucusu 4397'de, geçici veri, tek başsız Chromium, sonunda kapandı) → **275 denetim, hepsi geçti** (önce 255; 20 yeni), 17 sn. İki kez koşuldu: ilkinde 274/274 geçti, sonra soğuk açılış ölçümü eklenip bir kez daha.

Yeni adımlar: Öğren, Sağlık, Sistem haritası ve Yol haritası sayfasında «taşınıyor» yok; komut çubuğunda «sokrates» yazınca son öğe «Her şeyde ara: sokrates», tıklanınca arama sayfası adres ve alanda sorguyla açılır; Sokrates dersi (taslak işaretli) ve Sokrates notu bulunur; «SORARAK DUSUNMEK» aynı dersi ilk sıraya koyar, bağlantı dersi açar, geri gelince sorgu durur; «erdem bilgi» Erdem notunu bulur ve açar; doğrudan `#/motor/arama?tanım` açılışında dizin kurulur; King sayfası açıklamayı verir, girdi/form yok; dört görünümde telefon yatay taşması yok.

**Tarayıcı ölçümü (ölçüldü, gezi verisi, 2026-11-14):** 544 ders; bir sorgu + sonuçların çizimi beş sorguda ortanca 2,2 ms, en çok 2,6–3,6 ms; dizin, alanlar Yol sayfasında önceden yüklüyken 19–21 ms; soğuk açılışta (yeni sekme, yirmi dosya yerel sunucudan) 87 ms, ilk sorgu 1,7 ms. Notlar gezide az (birkaç not); sahibin gerçek not sayısıyla ölçülmedi (gerçek veriye dokunulmadı). Not motorunun araması doğrusal; 300 notluk motor testinde sorun yok, ama binlerce notla yeniden ölçülmeli.

## Ekran görüntüleri
`belgeler/ekip/sadelesme/kabuk-onizleme/` içinde yalnız bunlar çekildi (öteki önizlemelere dokunulmadı):
- `arama-masaustu-acik.png`, `arama-masaustu-koyu.png`, `arama-telefon-acik.png`, `arama-telefon-koyu.png` («sokrates»: 6 ders, 1 not)
- `king-masaustu-acik.png`, `king-masaustu-koyu.png`, `king-telefon-acik.png`, `king-telefon-koyu.png`

## Açık sorular
1. **Önce örnek kuralı atlandı.** Arama ve King sayfası varyasyonsuz, var olan yapı taşlarıyla yapıldı. Sahip başka bir düzen isterse: arama `kabuk/arama.js`'te tek dosya, King gövdesi `kabuk/kabuk.js` `kingGovde`.
2. **«≈2.300 ders» tutmadı.** Depoda 544 ders var (Akademik 377). Görevdeki sayı ders + alıştırma + kapı sorusu toplamına yakın olabilir; ölçüm 544 dersle yapıldı. Kapı soruları bilerek aranmıyor.
3. **Tekrar kartları ve Plan işleri aranmıyor.** «Metin alanı olan kayıt» olarak yalnız Kayıt motorunun kayıtları alındı; kartların tek kartı açan bir adresi yok (Tekrar sayfası listede), Plan işleri de öyle. İstenirse kartlar «Tekrar» bağlantısıyla eklenir.
4. **Eski güne yazma.** Arama bir kaydın gününü açınca, yedi günlük yazma penceresinden eski gün Kayıt'taki gün seçicisinde görünür; o güne yazmayı motor kendi cümlesiyle reddeder. Ayrı bir «salt okur» gösterimi yapılmadı.
5. **Kilitli ders.** Aramada kilitli ders de çıkar ve bağlantıdır; açılınca Yol «Bu ders kilitli…» der. Sonuç satırında kilit ayrıca gösterilmiyor (satırda tek rozet var, o da «taslak»).
6. **King `sistem_haritasi` açıklaması.** `king/mcp.py` hâlâ «pilot = taşınıyor» diye açıklıyor (King'in kendi metni; king/ bu turda benim alanım değil). Ekranla tutarlı olsun isteniyorsa King tarafında bir satır.
7. **Bellek.** Ders dizini sayfa açık kaldıkça bellekte durur (katlanmış metin, Akademik dahil birkaç MB); ölçülmedi.
