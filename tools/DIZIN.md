# `tools/` Dizin Rehberi

LifeOS geliştirme, denetim, yayın, veri işleme, ölçüm ve test otomasyonlarında kullanılan araçların fihristidir. Araç yolları CI boru hatlarında ve ofis süreçlerinde sabit olduğundan dosyalar taşınmaz; bu dizin hangi betiğin ne amaçla ve ne zaman çalıştırıldığını açıklar.

## Denetim
- `ci_hata.sh` — CI adımını koşar; kalırsa çıktının ilgili satırlarını tek bir açık okunur `::error` bildirimine yazar (iş kaydı yönetici yetkisi ister).
- `ci_satir.sh` — Çok satırlı bir CI adımının (`run: |`) her satırını ayrı koşar ve kalan her satırı `ci_hata.sh` ile kendi bildirimine yazar; ofis adımının `shell:` koşucusudur.
- `parca.py` — `brand/parcalar.txt`'ten sayfa bloklarını, sayfa kayıtlarından King rehberini üretir.
- `piksel_rakam.py` — Sistemin kendi rakam yazı tipini (5×7, yalnız 0-9) üretip `piksel-yazi.css`e gömer; `--denetle`.
- `piksel_bulut.py` — Modül geçişi perdesinin bulut resmini (PNG) üretip `piksel.css`e gömer; `--denetle`.
- `piksel_gorsel.js` — Logo ve modül simgesi dosyalarını (PNG, ICO, SVG) piksel figürlerden üretir.
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
- `gercek_kosu.py` — Göç bağdaştırıcılarının gerçek veride koşusu: canlı kaynakların kopyasından kuru tek depo, her kayıt sahibi motorun bağdaştırıcısına; yalnız sayılar (okunan, çıktı, ret nedeni, sessiz düşen alan), kopyalar silinir, çökmede çıkış 1; P6 öncesi elle koşulur.
- `gercek_kosu.js` — `gercek_kosu.py`'nin Node yardımcısı: rota → motor bağdaştırıcısı tablosu, kayıt içeriği basmadan sayar.
- `veri_ansiklopedi.py` — KONULAR.json içindeki başlıkları Vikipedi REST API'sinden çekerek kaynak metin toplar, veri hazırlığında koşulur.
- `veri_cikar.py` — Ham metin dosyalarından standart kütüphaneyle temiz JSONL kayıtları çıkarır, veri hazırlığında koşulur.
- `veri_denetle.py` — Veri katmanlarını kurallara göre denetleyip veri/DENETIM.md raporunu üretir, veri hazırlığında koşulur.
- `veri_devasa.py` — Resmi rehberlerden sıfır bağımlılıkla devasa doğrulanmış veri toplayıp derler, veri hazırlığında koşulur.
- `veri_devasa_dalga2.py` — Derinlik ve genişletme amaçlı ikinci dalga veri toplayıcı betiktir, veri hazırlığında koşulur.
- `veri_dogrula.py` — Taslak kayıtları resmi kaynak metinleriyle harfiyen doğrulayarak temiz katmana aktarır, veri hazırlığında koşulur.
- `veri_ek.py` — Veri toplama sürecinin modelsiz ek aşamalarını (çeviri, anlam, sıklık) yürütür, veri hazırlığında koşulur.
- `veri_gece.py` — Kaldığı yerden devam edebilen uzun süreli toplu veri toplama sürecidir, gece veya arka planda koşulur.
- `veri_gezgin.py` — Yalnızca izinli resmi alan adlarını gezerek sayfa okuyan ve veri toplayan gezgin ajandır, gerektiğinde koşulur.
- `veri_mega_uretim.py` — Mevcut sistem dosyalarına dokunmadan yeni veri üreten mega derleyici betiktir, veri hazırlığında koşulur.
- `veri_modelfile.py` — Ana metinden Ollama için Modelfile.lifeos-ana tanımını üretir, metin güncellendiğinde koşulur.
- `veri_plan.py` — Konu planı metinlerini birleştirir ve dosyaların güncelliğini denetler, CI'da denetim olarak koşulur.
- `veri_topla.py` — Resmi kaynak listesindeki dosyaları indirip metne çevirir, veri hazırlığında koşulur.
- `onay_uygula.py` — Kabuktaki «Onayları dosya olarak al» ile inen sahip onaylarını `alan/<id>/asama-N.json` öğelerine (`durum`, `onaylayan`, `onayTarihi`) yazar; kimlik birebir eşleşir, bilinmeyen raporlanır; kuru koşu varsayılan, `--yaz` ile yazar, dosya biçimi korunur; elle koşulur.

## Ölçüm
- `king_olcum.py` — King dil modeli ölçümü: ilk söz, toplam süre, jeton ve ses başlama gecikmesi; canlı HKM'ye dokunmaz.
- `hafiza_olcum.py` — HKM hafıza aramasını kök eşlemesi ve gömme ile karşılaştırıp süre ve doğruluk ölçer, optimizasyonda koşulur.
- `hafiza_olcum_kume.json` — Hafıza arama ölçüm aracı için 24 adet Türkçe soru ve bilgi çifti içeren test kümesi verisidir.
- `merdiven_olcum.py` — KING-4 A6 model merdivenini (kolay yerel, zor bulut, kota düşüşü) ölçer, gerektiğinde koşulur.
- `sayilar.py` — Depo genelindeki test, satır ve modül sayılarını tek kaynaktan hesaplayıp belgelere yazar, CI'da denetlenir.

## Kabul testleri
- `bilinc_kabul_test.py` — Bilinç haritası (`brand/ortak/bilinc.js`) kabul testi; temizlik, bağ ayrıştırma, ağ ve yerleşim.
- `ayar_esit_kabul_test.py` — Görev 081 kabul testi; ortak ayarların telefonla eşitlenmesini (son yazan kazanır, çakışma kaydı, mezar taşı, kapılar) sınar, CI'da koşulur.
- `belge_dizin_kabul_test.py` — Görev 018 kabul testi; belgeler/DIZIN.md dizininin tamlığını ve bağlantılarını sınar.
- `bilgisayar_kabul_test.py` — Görev 080 kabul testi; King'in bilgisayar araçlarının platform katmanını (sistem/bilgisayar.py) sahte çağrılarla sınar, CI'da koşulur.
- `ice_suren_kabul_test.py` — Görev 007 kabul testi; Google Takvim içe aktarımında süren etkinliklerin doğru çözümlenmesini sınar, CI'da koşulur.
- `hafiza_olcum_kabul_test.py` — Görev 050 kabul testi; HKM hafıza aramasının kök ve gömme ile ölçümünü sınar.
- `hafiza_uc_kabul_test.py` — Görev 051 kabul testi; hafıza ve kendiliğinden King uçlarını HTTP'den sınar.
- `hkm_olcum_kabul_test.py` — Görev 030 kabul testi; test HKM'sini açıp başlangıç ve GET uçlarını ölçen aracı sınar.
- `merdiven_olcum_kabul_test.py` — Görev 063 kabul testi; A6 model merdiveni ölçüm betiğini kuru koşuyla sınar.
- `merdiven_uc_kabul_test.py` — Görev 064 kabul testi; A6 merdiveni ve kart cümlesi uçlarının HTTP testini ve HKM belgesini sınar.
- `merkezayar_kabul_test.py` — Ayarlar › Merkez: açık şema, sır okunmaz, yalnız şemadaki alan yazılır.
- `tools_dizin_kabul_test.py` — Görev 017 kabul testi; tools/DIZIN.md dizininin eksiksizliğini, sekiz bölümünü ve formatını sınar.
- `veri_denetle_kabul_test.py` — Görev 006 kabul testi; veri denetleme aracının nesne oranlarını ve doğrulama mantığını sınar, CI'da koşulur.

## Testler
- `ajan_test.py` — tools/ajan.py ve tools/ajan_kanca.py birim testleri; döküm okuyucu, efor, yuva ve kanca kararlarını sınar, CI'da koşulur.
- `ayar_test.py` — sistem/ayar.py sözleşme testleri; sistem ayarlarının tek kopyasını ve doğrulamasını sınar, CI'da koşulur.
- `gorev_takip_test.py` — tools/gorev_takip.py görev dosyası okuyucu mantığının testi, CI'da koşulur.
- `ice_test.py` — sistem/ice.py sözleşme testleri; Google Takvim verisini hesap bağlamadan getirmeyi sınar, CI'da koşulur.
- `kabul_js_test.py` — tools/kabul_js.py modül dosyası yükleme ve localStorage ortamı testi, CI'da koşulur.
- `kuyruk_test.py` — Sunucuların dinleme kuyruğu, soket sınırları ve geçici ağ hatasında ayakta kalma testi, CI'da koşulur.
- `muzik_test.py` — sistem/muzik.py müzik dosyaları ve çalma listesi sözleşme testleri, CI'da koşulur.
- `ofis_pilot_test.py` — tools/ofis_pilot.py ve tools/ofis_test.py pilot karar tablosu ve kota testleri, CI'da koşulur.
- `ofis_test.py` — AGENTS.md §2 tam denetimlerini ajan dalında dil modelsiz koşturan testçi aracıdır, pilot tarafından tetiklenir.
- `planlama_test.py` — sistem/planlama.py sistem planlama ve kural sözleşme testleri, CI'da koşulur.
- `playwrightsiz.test.js` — Tarayıcı istemeyen araçların Playwright olmadan da çalıştığını denetler, CI'da koşulur.
- `portreonar_test.py` — marka.py --onar görsel onarma mantığının birim testi; Pillow yoksa atlanır, CI'da koşar.
- `sayilar_test.py` — sayilar.py çıktı okuma ve sayı ayrıştırma testi, CI'da koşulur.
- `tasi_test.py` — Yeni bilgisayara taşıma paketi (`sistem/tasi.py`): şifreli, değişmiş dosya açılmaz, üstüne yazmaz; CI'da koşulur.
- `goc_test.py` — Sadeleşme göç aracı (`sistem/goc.py`): kaynağa yazmaz, sayı dengesi, tek etiket dili, sır pakette durur, aynı rapor, geri alınır; CI'da koşulur.
- `gercek_kosu_test.py` — Gerçek koşu aracı uydurma veriyle: sayılar doğru, kişisel içerik basılmaz, canlı dosya açılmaz ve değişmez, geçici kopyalar silinir, çökmede çıkış 1; CI'da koşulabilir.
- `kabuk_baslangic.py` — Tek depodaki eski kayıtları (kopyadan) motorların göç bağdaştırıcılarından geçirip yeni kabuğun başlangıç paketine yazar (`veri/kabuk-baslangic.json`: not, kayıt, kart); kabuk Bugün'de «Getir» diye sunar; göçten sonra bir kez koşulur.
- `kabuk_baslangic.js` — `kabuk_baslangic.py`'nin Node yardımcısı: `gercek_kosu.js` ROTA'sıyla bağdaştırıcıları koşar, kabuk deposuna girecek çıktıyı döndürür.
- `kabuk_baslangic_test.py` — Başlangıç paketi aracını uydurma tek depoyla sınar (geçerli not ve ölçü girer, boş ve sınır dışı girmez, içerik ekrana basılmaz, depo değişmez); CI'da koşulur.
- `onay_uygula_test.py` — `onay_uygula.py`yi gerçek içeriğin geçici kopyasında sınar (kuru koşu yazmaz, LF/CRLF ve girinti korunur, denetçi temiz, bilinmeyen kimlik tahmin edilmez); CI'da koşulur.
- `tekdepo_test.py` — Tek depo (`sistem/veri.py`) ve hesap köprüsü: üst anahtar düzeyinde son saat kazanır, silme mezar taşı, sıra sonucu değiştirmez, yedek üstüne yazmaz; CI'da koşulur.
- `gocpaket.test.js` — Göç paketinin cihaz tarafı (`brand/ortak/gocpaket.js`): bütün profiller, sır girmez, bekleyen sayılır, medya sha256 ve parçalama; sahte depolarla, tarayıcısız.
- `gocpaket_test.py` — Göç paketinin PC tarafı: cihazın paketleri `goc.paket_kaydet` ve göç okuyucusundan geçer, sınırlar ve `/api/hesap/goc-paket` ucu; CI'da koşulur.
- `tekkapi_test.py` — Tek kapı (`sistem/tekkapi.py`): giriş, üç modül `/ays/` `/spi/` `/esp/` yolunda, yeni kabuk `/kabuk/` kapalı listeyle, API'ler ve HKM `/api/hkm/` aynı süreçte eski sunucuyla aynı cevabı verir, bilinmeyen yol 404, köken kuralları durur, kapalıyken açılmaz; geçici veri ve boş portla, CI'da koşulur.
- `tek_kapi_ac_test.py` — Tek kapıyı açma komutu (`sistem/tek_kapi_ac.py`): denetim kararları (telefon paketi yok/var, `--telefon-yok`, eski paket, açık pencere) hiçbir dosyayı değiştirmez, eksik koşulda `--ac` reddeder, sahte ağaçta başarılı geçiş (yalnız ETKIN satırı, manifest + SHA-256, en yeni gönderim), her adımda zorlanmış ve doğal hatada geri dönüş, `--geri`; geçici LOCALAPPDATA ve boş portla, elle koşulur.
- `kalite_etiket_test.py` — Sahibin etiket kapısı (`sistem/etiket.py`, `/api/kalite/etiket…`): yalnız bu bilgisayardan, en çok 20 bekleyen satır yalnız gösterilecek alanlarla, bilinmeyen set/kimlik/etiket ve bozuk set yazılmaz, dosya bütün yazılır; geçici klasör ve boş portla, CI'da koşulur.
- `kabuk_gez.js` — Yeni kabuğu (`kabuk/`) tek kapıdan yalıtılmış ortamda açar, Felsefe pilotunun ilk ünitesini, Not ve Tekrar ekranlarını gerçek tarayıcıda yürür (ders, alıştırma, ünite kapısı, not ve bağ, kart ve cevap, kayıt); `--goruntu` önizleme görüntülerini yeniler; CI'da koşulur.
- `bilesen_goruntu.js` — Bileşen kataloğunu (`kabuk/bilesen.html`) Chromium'da file:// ile açar, 390/1280 genişlikte açık ve koyu dört önizleme görüntüsü çeker (`belgeler/ekip/sadelesme/kabuk-onizleme/bilesen-*.png`); elle koşulur.
- `veri_denetle_test.py` — tools/veri_denetle.py birim testleri; kenar durumları sınar, CI'da koşulur.
- `veri_dogrula_test.py` — tools/veri_dogrula.py saf işlevlerinin birim testleri, CI'da koşulur.
- `veri_test.py` — Veri çıkarma ve gece doğrulama kurallarının testi, CI'da koşulur.
- `zemin_test.py` — sistem/zemin.py arka plan görseli yükleme ve doğrulama sözleşme testleri, CI'da koşulur.

## Diğer
- `package.json` — Denetim betiklerinin tek geliştirme bağımlılığı (Playwright, yalnız denetimde); `npm ci` burada koşar, uygulama kodu bağımlılık almaz.
- `package-lock.json` — `package.json`ın kilit dosyası (Playwright sürümü sabit).
