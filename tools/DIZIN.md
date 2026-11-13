# `tools/` Dizin Rehberi

LifeOS geliştirme, denetim, yayın, veri işleme, ölçüm ve test otomasyonlarında kullanılan araçların fihristidir. Araç yolları CI boru hatlarında ve ofis süreçlerinde sabit olduğundan dosyalar taşınmaz; bu dizin hangi betiğin ne amaçla ve ne zaman çalıştırıldığını açıklar.

## Denetim
- `ci_hata.sh` — CI adımını koşar; kalırsa çıktının ilgili satırlarını tek bir açık okunur `::error` bildirimine yazar (iş kaydı yönetici yetkisi ister).
- `ci_satir.sh` — Çok satırlı bir CI adımının (`run: |`) her satırını ayrı koşar ve kalan her satırı `ci_hata.sh` ile kendi bildirimine yazar; ofis adımının `shell:` koşucusudur.
- `entegre.js` — Üç arayüz ile HKM servisinin uçtan uca bütünleşmesini denetler, birleştirmeden önce ve CI'da koşulur.
- `envanter.js` — Tek tasarıma geçişte ekran eylemleri, giriş alanları ve arayüz özellik kayıplarını denetler, CI'da koşulur.
- `nerede.js` — Ekranlardaki metin ve düğme kalabalığının (sadelik aşımının) yerini tespit eder, gerektiğinde elle koşulur.
- `parca.py` — `brand/parcalar.txt`'ten sayfa bloklarını, sayfa kayıtlarından King rehberini üretir.
- `parca_kanit.js` — Lego dönüşümünde çizimi önce ve sonra karşılaştırır, parça çıkarma denemesi yapar.
- `css_onemli.js` — Her `!important`'ı bütün ekran ve temalarda ölçer; yalnız kanıtlı gereksizi siler, görülmeyene dokunmaz.
- `piksel_denetim.js` — Temaya uymayan izleri bulur: bulanıklık, bulanık gölge, geçiş, soluk yazı, yazıya yapışık şerit, kart kenarına yapışık yazı; açılır katmanlar dahil.
- `mobil_tara.js` — Telefon ve tablet: dokunmatik kipte, dik ve yatay, bütün ekranlar ve King bölümleri; görünmez düğme, ulaşılamayan sekme, kesik ad, küçük hedef.
- `piksel_rakam.py` — Sistemin kendi rakam yazı tipini (5×7, yalnız 0-9) üretip `piksel-yazi.css`e gömer; `--denetle`.
- `piksel_bulut.py` — Modül geçişi perdesinin bulut resmini (PNG) üretip `piksel.css`e gömer; `--denetle`.
- `bulut_gecis.js` — Üç modül arasında gerçek geçişi iki yönde kare kare denetler: bulut ilk boyamada yerinde, sıçramaz, ortada kesilmez; ses kapalıyken ve azaltılmış harekette sessiz.
- `piksel_gorsel.js` — Logo ve modül simgesi dosyalarını (PNG, ICO, SVG) piksel figürlerden üretir.
- `olucss.py` — Arayüzde hiçbir öğeye uymayan ölü CSS kurallarını bulur ve temizler, CI'da denetim olarak koşulur.
- `tiklama.js` — Bütün ekran ve pencerelerdeki eylem düğmelerine basarak hata ve sızıntı taraması yapar, birleştirmeden önce koşulur.
- `yazi.py` — Ekran başlıklarının cümle düzenini, Türkçe imlasını ve terim kurallarını denetler, CI'da koşulur.

## Yayın
- `marka.py` — Marka görsellerini servis edilebilir hâle getirir ve medya künyesini üretir, CI'da denetlenir.
- `ortak.py` — Üç arayüzün ortak CSS ve çekirdek JS kodlarını tek kaynaktan yayar ve ayrışmayı denetler, CI'da koşulur.
- `rutbe.py` — Rütbe ve kademe rozet görsellerini kayıpsız işleyerek servis edilebilir hâle getirir, gerektiğinde elle koşulur.
- `seviye.py` — Seviye ve rütbe sistemini tek kaynaktan üç arayüze yayar ve kopyaların ayrışmadığını denetler, CI'da koşulur.
- `vitrin.py` — Onaylanmış vitrin kartı biçimini sistem CSS'ine taşır ve güncelliğini denetler, CI'da koşulur.

## Ofis
- `ajan.py` — Claude Code'un Antigravity alt ajanlarını başlatıp yönettiği ve izlediği ofis aracıdır, geliştirme sırasında kullanılır.
- `ajan_kanca.py` — Antigravity hook'u; ajanları kendi çalışma klasörlerine ve izinli araçlara bağlar, arka planda otomatik çalışır.
- `gorev_takip.py` — Antigravity ajanlarını ve görev kuyruğunu izleyen masaüstü durum penceresi aracıdır, geliştirme sırasında çalıştırılır.
- `kabul_js.py` — Python kabul testlerinin arayüz JS mantığını tarayıcısız (Node vm) çalıştırmasını sağlar, testlerde kullanılır.
- `ofis_pilot.py` — Claude Code beklemeden görev kuyruğunu yürüten otomatik pilot sürecidir, geliştirme sırasında çalıştırılır.

## Veri
- `veri_ansiklopedi.py` — KONULAR.json içindeki başlıkları Vikipedi REST API'sinden çekerek kaynak metin toplar, veri hazırlığında koşulur.
- `veri_ays_siklik.py` — ÖSYM konu dağılımı verilerini AYS soru sıklığı veri dosyasına derler, veri hazırlığında koşulur.
- `veri_cikar.py` — Ham metin dosyalarından standart kütüphaneyle temiz JSONL kayıtları çıkarır, veri hazırlığında koşulur.
- `veri_denetle.py` — Veri katmanlarını kurallara göre denetleyip veri/DENETIM.md raporunu üretir, veri hazırlığında koşulur.
- `veri_devasa.py` — Resmi rehberlerden sıfır bağımlılıkla devasa doğrulanmış veri toplayıp derler, veri hazırlığında koşulur.
- `veri_devasa_dalga2.py` — Derinlik ve genişletme amaçlı ikinci dalga veri toplayıcı betiktir, veri hazırlığında koşulur.
- `veri_dogrula.py` — Taslak kayıtları resmi kaynak metinleriyle harfiyen doğrulayarak temiz katmana aktarır, veri hazırlığında koşulur.
- `veri_ek.py` — Veri toplama sürecinin modelsiz ek aşamalarını (çeviri, anlam, sıklık) yürütür, veri hazırlığında koşulur.
- `veri_esp_siklik.py` — Dil kelime sıklığı listelerini ESP kelimesiklik.js veri dosyasına derler, veri hazırlığında koşulur.
- `veri_gece.py` — Kaldığı yerden devam edebilen uzun süreli toplu veri toplama sürecidir, gece veya arka planda koşulur.
- `veri_gezgin.py` — Yalnızca izinli resmi alan adlarını gezerek sayfa okuyan ve veri toplayan gezgin ajandır, gerektiğinde koşulur.
- `veri_mega_uretim.py` — Mevcut sistem dosyalarına dokunmadan yeni veri üreten mega derleyici betiktir, veri hazırlığında koşulur.
- `veri_modelfile.py` — Ana metinden Ollama için Modelfile.lifeos-ana tanımını üretir, metin güncellendiğinde koşulur.
- `veri_plan.py` — Konu planı metinlerini birleştirir ve dosyaların güncelliğini denetler, CI'da denetim olarak koşulur.
- `veri_topla.py` — Resmi kaynak listesindeki dosyaları indirip metne çevirir, veri hazırlığında koşulur.

## Ölçüm
- `akicilik.js` — Akıcılık bütçesi; üç modülün perfcheck'ini çağırır, süre değil sayı ölçer ve gerilemeyi ilk koşuda yakalar.
- `king_olcum.py` — King dil modeli ölçümü: ilk söz, toplam süre, jeton ve ses başlama gecikmesi; canlı HKM'ye dokunmaz.
- `hafiza_olcum.py` — HKM hafıza aramasını kök eşlemesi ve gömme ile karşılaştırıp süre ve doğruluk ölçer, optimizasyonda koşulur.
- `hafiza_olcum_kume.json` — Hafıza arama ölçüm aracı için 24 adet Türkçe soru ve bilgi çifti içeren test kümesi verisidir.
- `king_kapsam.js` — King kapsam testi; her modülün yazma işlevi ve rotası bir King aracına bağlı mı, eksik varsa çıkış 1 (KING-4 A2).
- `king_kapsam.json` — `king_kapsam.js`'in eşlemesi: Model işlevi ve rota → araç adı ya da «-: neden».
- `king_guven.js` — King güven denetimi (KING-4 §G); izin kademeleri (oku, yaz, dış) bütün araçlarda tutarlı mı, değilse çıkış 1.
- `kapsam.js` — Birim testlerinin hangi işlevleri çalıştırdığını V8 precise coverage ile ölçer, CI'da veya elle koşulur.
- `merdiven_olcum.py` — KING-4 A6 model merdivenini (kolay yerel, zor bulut, kota düşüşü) ölçer, gerektiğinde koşulur.
- `olcum_modul.js` — Modülün açılış, kapsam, depolama ve rota performansını tek komutla ölçer, optimizasyon turlarında koşulur.
- `pusula.js` — Kolay LifeOS planının yardımcı ölçülerini (eylem sayıları ve menü karmaşıklığı) hesaplar, birleştirmeden önce koşulur.
- `sadelik.js` — Üç arayüzün bütün ekranlarında görsel kalabalık ve sadelik ölçümü yapar, CI'da denetim olarak koşulur.
- `sayilar.py` — Depo genelindeki test, satır ve modül sayılarını tek kaynaktan hesaplayıp belgelere yazar, CI'da denetlenir.

## Kabul testleri
- `bilinc_kabul_test.py` — Bilinç haritası (`brand/ortak/bilinc.js`) kabul testi; temizlik, bağ ayrıştırma, ağ ve yerleşim.
- `ays_sure_kabul_test.py` — Görev 010 kabul testi; AYS konuşarak süre ve uyku girişi ayrıştırmasını sınar, CI'da koşulur.
- `ays_sinav_sure_kabul_test.py` — 2026-11-01 kararı; AYS deneme sınavında sekme kapalı geçen sürenin sayıldığını, elle duraklatmanın süreyi durdurduğunu sınar, CI'da koşulur.
- `ays_deney_kabul_test.py` — Görev 073 kabul testi; AYS kişisel deney motoru (R.Deney) atama ve sonucunu sınar, CI'da koşulur.
- `ays_takvim_tekrar_kabul_test.py` — Görev 013 kabul testi; AYS takvim içe aktarma tekrar kuralı açılımını sınar, CI'da koşulur.
- `ayar_esit_kabul_test.py` — Görev 081 kabul testi; ortak ayarların telefonla eşitlenmesini (son yazan kazanır, çakışma kaydı, mezar taşı, kapılar) sınar, CI'da koşulur.
- `belge_dizin_kabul_test.py` — Görev 018 kabul testi; belgeler/DIZIN.md dizininin tamlığını ve bağlantılarını sınar.
- `bilgisayar_kabul_test.py` — Görev 080 kabul testi; King'in bilgisayar araçlarının platform katmanını (sistem/bilgisayar.py) sahte çağrılarla sınar, CI'da koşulur.
- `esp_sure_kabul_test.py` — Görev 011 kabul testi; ESP serbest oturum süre girişinin Türkçe sayı motoruyla okunmasını sınar, CI'da koşulur.
- `ice_suren_kabul_test.py` — Görev 007 kabul testi; Google Takvim içe aktarımında süren etkinliklerin doğru çözümlenmesini sınar, CI'da koşulur.
- `hafiza_olcum_kabul_test.py` — Görev 050 kabul testi; HKM hafıza aramasının kök ve gömme ile ölçümünü sınar.
- `hafiza_uc_kabul_test.py` — Görev 051 kabul testi; hafıza ve kendiliğinden King uçlarını HTTP'den sınar.
- `hkm_olcum_kabul_test.py` — Görev 030 kabul testi; test HKM'sini açıp başlangıç ve GET uçlarını ölçen aracı sınar.
- `king_kapsam_ays_kabul_test.py` — Görev 021 kabul testi; AYS ekran işlerinin tamamının King aracı olduğunu sınar, CI'da koşulur.
- `king_kapsam_esp_kabul_test.py` — Görev 023 kabul testi; ESP ekran işlerinin tamamının King aracı olduğunu sınar, CI'da koşulur.
- `king_kapsam_spi_kabul_test.py` — Görev 022 kabul testi; SPİ ekran işlerinin tamamının King aracı olduğunu sınar, CI'da koşulur.
- `king_sinav_ays_kabul_test.py` — Görev 031 kabul testi; King sınavının AYS kayıplarını sınar.
- `king_sinav_esp_kabul_test.py` — Görev 033 kabul testi; King sınavının ESP kayıplarını sınar.
- `king_sinav_spi_kabul_test.py` — Görev 032 kabul testi; King sınavının SPİ kayıplarını sınar.
- `king_sinav_300_kabul_test.py` — Görev 020 kabul testi; King sınavı en az 300 cümle, ilk 100 cümle değişmemiş, biçim geçerli.
- `king_sinav_genis_kabul_test.py` — Görev 065 kabul testi; sınav her modül aracını en az 2 cümleyle sınar, ilk 300 ve puanı korunur.
- `kingveri_ays_kabul_test.py` — Görev 040 kabul testi; AYS King verisini (olaylar, hafta, hatırlatma, son kaydı düzeltme) sınar, CI'da koşulur.
- `kingveri_esp_kabul_test.py` — Görev 042 kabul testi; ESP King verisini (olaylar, hafta, hatırlatma, son kaydı düzeltme) sınar, CI'da koşulur.
- `kingveri_spi_kabul_test.py` — Görev 041 kabul testi; SPİ King verisini (olaylar, hafta, hatırlatma, son kaydı düzeltme) sınar, CI'da koşulur.
- `kingveri_brifing_ays_kabul_test.py` — Görev 060 kabul testi; AYS sabah brifingi verisini (plan, dünün bulgusu, öneri) sınar.
- `kingveri_brifing_spi_kabul_test.py` — Görev 061 kabul testi; SPİ sabah brifingi verisini (plan, dünün bulgusu, öneri) sınar.
- `kingveri_brifing_esp_kabul_test.py` — Görev 062 kabul testi; ESP sabah brifingi verisini (dünün bulgusu, öneri) sınar.
- `merdiven_olcum_kabul_test.py` — Görev 063 kabul testi; A6 model merdiveni ölçüm betiğini kuru koşuyla sınar.
- `merdiven_uc_kabul_test.py` — Görev 064 kabul testi; A6 merdiveni ve kart cümlesi uçlarının HTTP testini ve HKM belgesini sınar.
- `ogret_belge_kabul_test.py` — Görev 072 kabul testi; öğretme motorunun üç modül belgesinde ve ortak dizinde anlatıldığını sınar.
- `ogret_esp_kabul_test.py` — Görev 071 kabul testi; ESP'nin öğretme motoru adaptörünü (kelime sorusu, teşhis, 1/3/7 tekrar, araçlar) sınar.
- `ogret_spi_kabul_test.py` — Görev 070 kabul testi; SPİ'nin öğretme motoru adaptörünü (kavram sorusu, 1/3/7 tekrar, araçlar) sınar.
- `olcum_modul_kabul_test.py` — Görev 016 kabul testi; tek komutla modül ölçüm aracının çıktı alanlarını ve aralıklarını sınar.
- `perde_test_hiz_kabul_test.py` — Görev 015 kabul testi; perde takımlarının gerçek zaman beklemeden (≤ 800 ms) ve eksiksiz koştuğunu sınar, CI'da koşulur.
- `spi_porsiyon_kabul_test.py` — Görev 012 kabul testi; SPI serbest öğün porsiyon ve miktar ayrıştırmasını sınar, CI'da koşulur.
- `spi_sure_kabul_test.py` — Görev 009 kabul testi; SPI hızlı giriş süre ayrıştırmasını sınar, CI'da koşulur.
- `tarih_ortak_kabul_test.py` — Görev 014 kabul testi; üç modülün ortak tarih işlevlerinin sözleşme uyumunu sınar, CI'da koşulur.
- `gun_iskelet_kabul_test.py` — Gün sayfası iskeleti: yedi durum, veri yok etiketi, kapalı ortak dosya listesi.
- `gunveri_gecmis_kabul_test.py` — Gün › Geçmiş veri katmanı kabul testi.
- `gunveri_kabul_test.py` — Gün veri katmanı: şerit, sıradaki blok, karne.
- `merkezayar_kabul_test.py` — Ayarlar › Merkez: açık şema, sır okunmaz, yalnız şemadaki alan yazılır.
- `tools_dizin_kabul_test.py` — Görev 017 kabul testi; tools/DIZIN.md dizininin eksiksizliğini, sekiz bölümünü ve formatını sınar.
- `veri_denetle_kabul_test.py` — Görev 006 kabul testi; veri denetleme aracının nesne oranlarını ve doğrulama mantığını sınar, CI'da koşulur.

## Testler
- `parca_test.py` — Parça kaydı, King rehberi, tembel ayırma, blok adları, CSS jetonları ve `!important` tavanı.
- `parca_tembel_test.js` — Tembel verinin derlemede kaynak sürümle aynı olduğunu ve açılışta çalışmadığını gösterir.
- `giris_sayfa_test.js` — Giriş ve Gün sayfalarını gerçek tarayıcıda açar; modül denetimleri bunları açmaz.
- `patrontur_kosu.js` — Patron turunu yeni hesapla gerçek sunucuda, üç kapıda, 1280 ve 390 pikselde, klavyeyle ve azaltılmış hareketle baştan sona yürür.
- `king_olay_uctan_test.py` — KING-4 3c uçtan uca; modüllerin ürettiği olaylar taşıyıcının biçim denetiminden ve HKM kural motorundan geçer mi, CI'da koşulur.
- `ajan_test.py` — tools/ajan.py ve tools/ajan_kanca.py birim testleri; döküm okuyucu, efor, yuva ve kanca kararlarını sınar, CI'da koşulur.
- `ayar_test.py` — sistem/ayar.py sözleşme testleri; sistem ayarlarının tek kopyasını ve doğrulamasını sınar, CI'da koşulur.
- `dist_sun_test.py` — Modül kapısının güncel tek dosya (dist) sunma mantığını sınar, CI'da koşulur.
- `envanter.test.js` — tools/envanter.js ölçü kurallarının (30+ kelimelik tek parça yazı vb.) testi, CI'da koşulur.
- `envanterhkm.test.js` — Envanter aracının HKM testlerini doğru saydığını sınar, CI'da koşulur.
- `gorev_takip_test.py` — tools/gorev_takip.py görev dosyası okuyucu mantığının testi, CI'da koşulur.
- `ice_test.py` — sistem/ice.py sözleşme testleri; Google Takvim verisini hesap bağlamadan getirmeyi sınar, CI'da koşulur.
- `kabul_js_test.py` — tools/kabul_js.py modül dosyası yükleme ve localStorage ortamı testi, CI'da koşulur.
- `kuyruk_test.py` — Sunucuların dinleme kuyruğu, soket sınırları ve geçici ağ hatasında ayakta kalma testi, CI'da koşulur.
- `muzik_test.py` — sistem/muzik.py müzik dosyaları ve çalma listesi sözleşme testleri, CI'da koşulur.
- `ofis_pilot_test.py` — tools/ofis_pilot.py ve tools/ofis_test.py pilot karar tablosu ve kota testleri, CI'da koşulur.
- `ofis_test.py` — AGENTS.md §2 tam denetimlerini ajan dalında dil modelsiz koşturan testçi aracıdır, pilot tarafından tetiklenir.
- `planlama_test.py` — sistem/planlama.py sistem planlama ve kural sözleşme testleri, CI'da koşulur.
- `playwrightsiz.test.js` — Tarayıcı istemeyen araçların Playwright olmadan da çalıştığını denetler, CI'da koşulur.
- `portmuhafiz.test.js` — Sabit portlu araçların port doluyken güvenli biçimde başlamadığını (çıkış 2) denetler, CI'da koşulur.
- `portreonar_test.py` — marka.py --onar görsel onarma mantığının birim testi; Pillow yoksa atlanır, CI'da koşar.
- `sadelik.test.js` — sadelik.js kaynak kurallarının ve onay penceresi etiketlerinin testi, CI'da koşulur.
- `sayilar_test.py` — sayilar.py çıktı okuma ve sayı ayrıştırma testi, CI'da koşulur.
- `telefon_test.py` — Telefon uygulaması (ev ağı ve yerel sunucu) bağlantı ve güvenlik testleri, kök sertifikanın ad kısıtı, CI'da koşulur.
- `android_kurulum_test.js` — Android kurulum sayfası: çalışan adresi bulur (Tailscale, `.local`, IP), iPhone akışı değişmez; ağ taklit, sabit port yok, CI'da koşulur.
- `tasi_test.py` — Yeni bilgisayara taşıma paketi (`sistem/tasi.py`): şifreli, değişmiş dosya açılmaz, üstüne yazmaz; CI'da koşulur.
- `goc_test.py` — Sadeleşme göç aracı (`sistem/goc.py`): kaynağa yazmaz, sayı dengesi, tek etiket dili, sır pakette durur, aynı rapor, geri alınır; CI'da koşulur.
- `tekdepo_test.py` — Tek depo (`sistem/veri.py`) ve hesap köprüsü: üst anahtar düzeyinde son saat kazanır, silme mezar taşı, sıra sonucu değiştirmez, yedek üstüne yazmaz; CI'da koşulur.
- `gocpaket.test.js` — Göç paketinin cihaz tarafı (`brand/ortak/gocpaket.js`): bütün profiller, sır girmez, bekleyen sayılır, medya sha256 ve parçalama; sahte depolarla, tarayıcısız.
- `gocpaket_test.py` — Göç paketinin PC tarafı: cihazın paketleri `goc.paket_kaydet` ve göç okuyucusundan geçer, sınırlar ve `/api/hesap/goc-paket` ucu; CI'da koşulur.
- `tekkapi_test.py` — Tek kapı (`sistem/tekkapi.py`): giriş, üç modül `/ays/` `/spi/` `/esp/` yolunda, yeni kabuk `/kabuk/` kapalı listeyle, API'ler ve HKM `/api/hkm/` aynı süreçte eski sunucuyla aynı cevabı verir, bilinmeyen yol 404, köken kuralları durur, kapalıyken açılmaz; geçici veri ve boş portla, CI'da koşulur.
- `kabuk_gez.js` — Yeni kabuğu (`kabuk/`) tek kapıdan yalıtılmış ortamda açar, Felsefe pilotunun ilk ünitesini, Not ve Tekrar ekranlarını gerçek tarayıcıda yürür (ders, alıştırma, ünite kapısı, not ve bağ, kart ve cevap, kayıt); `--goruntu` önizleme görüntülerini yeniler; CI'da koşulur.
- `veri_denetle_test.py` — tools/veri_denetle.py birim testleri; kenar durumları sınar, CI'da koşulur.
- `veri_dogrula_test.py` — tools/veri_dogrula.py saf işlevlerinin birim testleri, CI'da koşulur.
- `veri_test.py` — Veri çıkarma ve gece doğrulama kurallarının testi, CI'da koşulur.
- `zemin_test.py` — sistem/zemin.py arka plan görseli yükleme ve doğrulama sözleşme testleri, CI'da koşulur.

## Diğer
- `king_sinav.js` — King doğal dil anlama sınavı; gerçek cümlelere karşı beklenen kararları puanlar, gerektiğinde koşulur.
- `king_sinav.json` — King sınavı için ilk 100 test cümlesini ve beklenen kararları içeren veri dosyası.
- `paket.py` — Dış inceleyici için tek dosyalık analiz özeti (PAKET.md) üretir, gerektiğinde elle koşulur.
