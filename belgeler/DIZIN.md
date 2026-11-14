# Belgeler dizini

Depoyu ve sistemleri tanımak için önce kök klasördeki `AGENTS.md` ve `README.md`, ardından mimari ve altyapı ayrıntıları için `belgeler/TEKNIK.md` okunmalıdır. Bu dizin, `belgeler/` altındaki tüm belgeleri, her belgenin ne anlattığını, güncellik durumunu ve tarihini tek sayfada sunar.

## Teknik

- [TEKNIK](TEKNIK.md) — Dört bağımsız sistemin mimarisi, çalıştırma, telefon kabuğu ve sınırları; durumu: güncel (2026-10-23)
- [UYGULAMA](UYGULAMA.md) — Üç modülü içine alan bağımsız iOS yerel telefon kabuğu mimarisi ve çalıştırma kılavuzu; durumu: güncel (2026-10-04)
- [NOTLAR](NOTLAR.md) — Geliştirici için mimari kararlar, ölçülmüş gerçekler ve sistem deneyimleri devir notu; durumu: güncel (2026-09-21)

## Ekip ve planlar

- [YARIM](ekip/YARIM.md) — Yarım kalan işler, bekleyen kararlar ve gerçek cihazda denenmeyenler; yeni oturum önce bunu okur; durumu: güncel (2026-11-06)
- [Patron turu yarım](ekip/yarim/patron-tanitim.md) — Patron turunda birleştirmeden önce koşulacak denetimler ve açık kalan ses notu.
- [SPİ sadelik](ekip/sadelik/spi.md) — SPİ ekranlarının önce/sonra sadelik dökümü, ortak gereken işler ve sorulacak silme önerileri; durumu: 2026-11-06.
- [AYS sadelik](ekip/sadelik/ays.md) — AYS ekranlarının 6 Kasım sadelik dökümü; durumu: sadeleşme planına girdi (2026-11-12).
- [ESP sadelik](ekip/sadelik/esp.md) — ESP ekranlarının 6 Kasım sadelik dökümü; durumu: sadeleşme planına girdi (2026-11-12).
- [Sadeleşme tabanı](ekip/sadelesme/taban-20261112.md) — Tek sisteme geçişin «önce» sayıları; her faz kapısı buna karşı ölçülür. Plan sayfası aynı klasörde `plan.html` (2026-11-12).
- [Faz 1 P5 · Tek kapı](ekip/sadelesme/faz1-p5-tekkapi.md) — A4: tek süreç, tek adres; yollar tablosu, dokunulan dosyalar, boşta bellek ölçümü, devreye alma adımları (kapalı, P6 ile açılır) (2026-11-13).
- [Faz 2 · Kabuk](ekip/sadelesme/faz2-kabuk.md) — A5: tam ekran çerçeve, halka ve komut çubuğu, sistem haritası, tek ayar şeması; ekran görüntüleri `kabuk-onizleme/` altında, sahibinin onayını bekler (2026-11-13).
- [Faz 2 · Kayıt deposu IndexedDB](ekip/sadelesme/faz2-indexeddb.md) — Kabuğun kayıtları IndexedDB'de, ayarlar localStorage'da; tek seferlik, geri okumadan silmeyen taşıma, kalıcı depolama isteği (2026-11-14).
- [Faz 2 · Bileşen kataloğu](ekip/sadelesme/faz2-bilesen.md) — On iki yapı taşı (`kabuk/bilesen.*`), sabit ölçüler, yalnız kabuk jetonları; katalog sayfası sahibe gösterilecek örnek (2026-11-14).
- [Faz 2 · Ekranların bileşenlere geçişi](ekip/sadelesme/faz2-bilesen-gecis.md) — Kabuk ekranları on dört yapı taşından kurulur; Tanışma'nın gömülü stili silindi, yazı boyu 20→11; Bugün'de geçici kayıt uyarısı, Ayarlar'da kalıcı depolama bilgisi; Plan ve Soru ekranları sırada (2026-11-14).
- [Faz 2 · Bileşen geçişinin sonu](ekip/sadelesme/faz2-bilesen-son.md) — Plan ve Soru ekranları, form alanları ve soru parçaları bloklardan kurulur (16 taş: `soru`, `tercih` eklendi); «Gizle» artık kesinlik etiketlerini gizlemez (2026-11-14).
- [Faz 3 · Yol motoru ve içerik](ekip/sadelesme/faz3-yol-icerik.md) — Yol motoru, içerik şeması (`alan/SEMA.md`), Felsefe'nin ilk aşaması ve şema denetimi (2026-11-13).
- [Faz 3 · Tekrar motoru](ekip/sadelesme/faz3-tekrar.md) — Dokuz zamanlayıcının yerine tek FSRS: formüller, arayüz, on bir göç bağdaştırıcısı, testler (2026-11-13).
- [Faz 3 · Not motoru](ekip/sadelesme/faz3-not.md) — On üç not yapısının yerine tek kayıt ve tek ağ: bağlar, King erişimi, arama, göç bağdaştırıcıları (2026-11-13).
- [Faz 3 · Soru motoru](ekip/sadelesme/faz3-soru.md) — AYS net ve sıralama kuralları tek motorda: arayüz, AYS ile eşdeğerlik, etiketler, açık sorular (2026-11-13).
- [Faz 3 · Kayıt ve Plan motorları](ekip/sadelesme/faz3-kayit-plan.md) — Tipli kayıtlar ve günün planı: SPİ kurallarıyla eşdeğerlik, göç bağdaştırıcıları, davranış farkları (2026-11-13).
- [Faz 5 · King çekirdeği](ekip/sadelesme/faz5-king-cekirdek.md) — A7: beş niyet, on iki kapılı katalog (141 araç), jeton bütçeli bağlam derleyici (2026-11-13).
- [Faz 5 · Arama motoru](ekip/sadelesme/faz5-arama.md) — King'in araştır niyeti: HKM kodunu kullanır, hafızaya yazmaz; BAM karşılaştırması ve geçilmeyen kapı (2026-11-13).
- [Faz 6 · Akademik içeriği](ekip/sadelesme/faz6-akademik-icerik.md) — AYS içeriğinden dönüştürülen ilk aşama: 30 ünite, 368 ders, hepsi taslak; dışarıda kalanlar (2026-11-13).
- [Faz 6 · Tarih ve Dil içeriği](ekip/sadelesme/faz6-tarih-dil-icerik.md) — İki alanın ilk aşaması (`C:\gemini-data`'dan, hepsi taslak): üniteler, kaynaktaki hatalar, eksikler (2026-11-13).
- [Faz 6 · Müzik ve Okuma-yazı içeriği](ekip/sadelesme/faz6-muzik-okuma-icerik.md) — İki alanın ilk aşaması (hepsi taslak): klavyedeki notalar, etkin okuma, cümle ve paragraf; eksik kaynaklar (2026-11-13).
- [Faz 6 · Beslenme ve Hareket içeriği](ekip/sadelesme/faz6-beslenme-hareket-icerik.md) — İki sağlık alanının ilk aşaması (hepsi taslak): tabak, hareket kalıpları, klinik sınır için dışarıda kalanlar (2026-11-13).
- [Faz 6 · Uyku ve Tahlil içeriği](ekip/sadelesme/faz6-uyku-tahlil-icerik.md) — İki sağlık alanının ilk aşaması (hepsi taslak): uyku ritmi, tahlil kâğıdını okumak; teşhis ve doz yok (2026-11-13).
- [Faz 6 · Felsefe, Dil, Tarih 2. aşama](ekip/sadelesme/faz6-asama2-felsefe-dil-tarih.md) — Üç alanın ikinci aşaması (hepsi taslak, kaynaklar satır aralığıyla): üniteler, düzeltilen kaynak hataları, açık tarih çelişkileri (2026-11-13).
- [Faz 6 · Akademik, Müzik, Okuma 2. aşama](ekip/sadelesme/faz6-asama2-akademik-muzik-okuma.md) — Üç alanın ikinci aşaması (hepsi taslak): deneme analizi, temiz tempo, atomik not ve revizyon; doğrulanmayanlar (2026-11-14).
- [Faz 6 · Beslenme ve Hareket 2. aşama](ekip/sadelesme/faz6-asama2-beslenme-hareket.md) — İki sağlık alanının ikinci aşaması (hepsi taslak); klinik sınır için dışarıda kalanlar (2026-11-14).
- [Faz 6 · Uyku ve Tahlil 2. aşama](ekip/sadelesme/faz6-asama2-uyku-tahlil.md) — Kendi ritmini kurmak, paneller ne ölçer (hepsi taslak); teşhis eşiği ve değer yorumu yok (2026-11-14).
- [Faz 6 · Onay ekranı](ekip/sadelesme/faz6-onay-ekrani.md) — Sahibin taslak dersleri dokunarak onayladığı `#/onay`: bindirme kuralları, `tools/onay_uygula.py`, testler, Bugün satırı, «Senin adımın» (2026-11-14).
- [Faz 3 · Yer belirleme ve not ağı](ekip/sadelesme/faz3-yer-ve-not-agi.md) — Seviyemi bul, kapıda kalınan soruların tekrara düşmesi, not ağı çizimi (2026-11-14).
- [Faz 3 · Hafta planı, haftalık kayıt, sisteme not](ekip/sadelesme/faz3-hafta-kayit-sistemenot.md) — Haftalık plan ve sabit bloklar, geçmiş güne kayıt ve haftalık özet, araca King için not (2026-11-14).
- [Faz 7 · Cihaz zemini (A10)](ekip/sadelesme/faz7-cihaz-zemini.md) — Cihaz başına Merkez anahtarı ve iptal, ortak jeton bilgisayardan çıkmaz; tek kapıda Tailscale yalnız 443 (bayrak kapalı); satır satır güvenlik notları (2026-11-13).
- [Faz 3 · Süreli deneme ve aşamalar](ekip/sadelesme/faz3-deneme-asama.md) — Kabukta süreli deneme ve prova, net ve sonuç ekranı; aşama farkındalığı (eski 1. aşama kaydı bayt bayt korunur) (2026-11-13).
- [Faz 7 · Tanışma ekranı](ekip/sadelesme/faz7-tanisma.md) — Kabukta dil modelsiz tanışma görüşmesi: kural tablosundan sorular, desenle anlaşılanlar, onaysız yazım yok, başlangıç önerisi (2026-11-13).
- [Faz 1 · AYS konu durumu](ekip/sadelesme/faz1-yol-konu-durumu.md) — Göçten önceki son sahipsiz kayıt: AYS konu durumu Yol motorunda; taşınanlar, taşınamayanlar (2026-11-13).
- [Faz 4 · Ölçüm motoru](ekip/sadelesme/faz4-olcum.md) — A9: depodan sayılan ölçütler, bugün / taban / hedef, bütçe kuralları, ölçülemeyen eğriler (2026-11-13).
- [Faz 4 · On üç eğri](ekip/sadelesme/faz4-egriler.md) — Her eğri bir dosya (`kalite/egri/`): ölçülenler, vekil ölçümler, ölçülemeyenler ve gerekenler (2026-11-13).
- [Faz 4 · A9 kalanları](ekip/sadelesme/faz4-a9-kalanlar.md) — Katman denetimi, yerel kullanım sayacı, «yanlış anladın» seti biçimi, hız bütçesi bulgusu ve doğrulamalar (2026-11-13).
- [Faz 5 · King MCP ucu](ekip/sadelesme/faz5-mcp.md) — Claude uygulamasından salt okur King: sekiz araç, gizlilik, kurulum (`king/KURULUM.md`) (2026-11-13).
- [Faz 5 · King yolu](ekip/sadelesme/faz5-king-yolu.md) — MCP ucuna King çekirdeği ve Arama: `niyet`, `kayit_cozumle` (yazmaz, önerir), `arastir` (kaynaklı, bütçeli, çevrimdışı kipli); on bir araç (2026-11-13).
- [Faz 1 planı](ekip/sadelesme/faz1.md) — A3 veri katmanı ve A4 tek kapı: tasarım, altı iş paketi, testleri ve Faz 1 kapısı (2026-11-12).
- [Göç kuru koşusu](ekip/sadelesme/goc-kuru-20261112.md) — Gerçek veriyle ilk kuru koşu: kaynak × tür sayıları, etiketler, boş canlı hesap deposu bulgusu (2026-11-12).
- [Göç bağdaştırıcılarının gerçek koşusu](ekip/sadelesme/gercek-kosu-20261113.md) — Motor bağdaştırıcılarının gerçek veride ilk koşusu: yalnız sayılar, ret ve sessiz düşen alanlar, sahipsiz koleksiyonlar, düzeltmeler (2026-11-13).
- [Faz 1 · HKM kayıtlarına sahip](ekip/sadelesme/faz1-hkm-sahiplik.md) — P6 öncesi: gerçek satırı olan her HKM tablosunun sahibi (King, Not, arşiv, türetilmiş), King'in hafıza biçimi (king/hafiza.py), bağdaştırıcılar, «HKM sonrası» koşu (2026-11-13).
- [Faz 1 · Modül kayıt boşlukları](ekip/sadelesme/faz1-modul-bosluklari.md) — Gerçek koşunun sahipsiz bulduğu `ays:plan`, `ays:weeks`, `spi:haftaplan` için Plan bağdaştırıcıları, Soru ve Not gün alanları, yeniden koşu sayıları (2026-11-13).
- [Sadeleşme sentezi](ekip/sadelesme/sentez.md) — Dokuz envanter raporunun birleşimi: aday listesi, düzeltilen sayılar, kararlar, riskler, çelişkiler (2026-11-12).
- [Depo zemini](ekip/sadelesme/depo-zemini.md) — A1: dallar, çalışma kopyaları, ana kopya; sekiz dalın arşivi (2026-11-12).
- [AYS envanteri](ekip/sadelesme/envanter-ays.md) — A2: AYS ekranları, çekirdek, veri, içerik ve kaldırma adayları (2026-11-12).
- [SPİ envanteri](ekip/sadelesme/envanter-spi.md) — A2: SPİ ekranları, kural motorları, veri, içerik ve kaldırma adayları (2026-11-12).
- [ESP envanteri](ekip/sadelesme/envanter-esp.md) — A2: ESP ekranları, merdiven, motorlar, ofis ve kaldırma adayları (2026-11-12).
- [Kabuk ve sunucu envanteri](ekip/sadelesme/envanter-kabuk-sunucu.md) — A2, A4, A5, A10: kabuk, ayarlar, tema, sunucu, cihaz yolları, seviye (2026-11-12).
- [King ve HKM keşfi](ekip/sadelesme/king-hkm.md) — A7: yönlendirme, araçlar, sağlayıcılar, hafıza, BAM, HKM, ölçüm, MCP hazırlığı (2026-11-12).
- [Veri katmanı keşfi](ekip/sadelesme/veri-katmani.md) — A3: verinin altı yeri, eşitleme, kayıt türleri, göç planı ve riskler (2026-11-12).
- [İçerik hattı](ekip/sadelesme/icerik-hatti.md) — A8: gemini-data, ders biçimi, Felsefe ve Dil yol iskeletleri, pilot önerisi (2026-11-12).
- [Not ve tekrar keşfi](ekip/sadelesme/not-ve-tekrar.md) — A6: on üç not yapısı, dokuz tekrar zamanlayıcısı, tek Not ve Tekrar motoru önerisi (2026-11-12).
- [KING-5](ekip/KING-5.md) — Sahada çalışan King: dört tur düzeltme planı; durumu: dört tur gönderildi, sadeleşmede A7'ye bağlandı (2026-11-08).
- [Güncelleme denemesi](ekip/GUNCELLEME-DENEMESI.md) — PC panelindeki «Güncelle» kutusunun yeni sürümü gösterdiğini sınamak için deneme notu (2026-11-07).
- [Android yarım](ekip/yarim/android.md) — Android ve kök sertifika durumu; dal birleşmedi (2026-11-06).
- [Bulut ve ses yarım](ekip/yarim/bulut-ses.md) — Bulut geçişi ve ses listesi; `main`'de, açık kalanlar (2026-11-07).
- [Her yerden erişim yarım](ekip/yarim/her-yerden-erisim.md) — Tailscale erişimi ve model hızı durumu (2026-11-06).
- [Not sistemi yarım](ekip/yarim/not-sistemi.md) — Not sistemi turunun açık kalanları; WIP yok.
- [Telefon hızı yarım](ekip/yarim/telefon-hiz.md) — Telefon ve tablet hızı durumu (2026-11-06).
- [PLAN](ekip/PLAN.md) — Esnek hedef sistemi mimarisi ve ofisler arası genel planlama motoru; durumu: tamamlandı (2026-09-24)
- [EKIP-PLANI](ekip/EKIP-PLANI.md) — Üç Claude için tek tasarım ve 183 özelliklik ekip hareket planı; durumu: tamamlandı (2026-09-24)
- [DEVIR](ekip/DEVIR.md) — Sıradaki Claude için anlık çalışma talimatları ve öncelikli iş listesi; durumu: tamamlandı (2026-09-23)
- [HATALAR](ekip/HATALAR.md) — Dört sistem genelindeki hata ve risk raporu ile çözüm yaklaşımları; durumu: güncel (2026-09-24)
- [TASARIM-OZELLIKLERI](ekip/TASARIM-OZELLIKLERI.md) — 183 tasarım özelliği, kart biçimleri ve ekran bazlı görsel katalog; durumu: güncel (2026-09-24)
- [CEKMECE-HARITASI](ekip/CEKMECE-HARITASI.md) — Sekiz çekmeceli arayüz düzeni, ekran hiyerarşisi ve gezinme yapısı; durumu: tamamlandı (2026-09-24)
- [IPHONE-PLANI](ekip/IPHONE-PLANI.md) — Sistemin tamamını sade, öz ve modern bir kullanıcı deneyimine taşıma planı; durumu: tamamlandı (2026-10-02)
- [PIKSEL-PLANI](ekip/PIKSEL-PLANI.md) — Sistemin tatlı piksel hâli için yapılacaklar listesi; durumu: sürüyor (2026-11-05)
- [KOLAY-PLANI](ekip/KOLAY-PLANI.md) — Sürtünmesiz veri girişi ve sadeleştirilmiş kullanıcı deneyimi planı; durumu: tamamlandı (2026-10-16)
- [USTA-PLANI](ekip/USTA-PLANI.md) — Öğrenme araştırması, ortak ustalık çekirdeği ve üç modülün boşluk listesi; durumu: sürüyor (2026-11-05)
- [OGRETME-PLANI](ekip/OGRETME-PLANI.md) — Adım adım çizim, Dinle ve kartla aralıklı tekrar: ortak kavrat çekirdeği ve üç modülde örnek konu; durumu: kuruldu (2026-11-05)
- [OGRENME-MOTORU](ekip/OGRENME-MOTORU.md) — Konunun baştan sona öğrenme akışı, sistemde olmayan konular ve eklenen tekniklerin dayanağı; durumu: kuruldu (2026-11-06)
- [KISI-PLANI](ekip/KISI-PLANI.md) — King'in 14 yaşam alanında kullanıcıyı tanıyan kişi modeli ve hafıza yapısı; durumu: tamamlandı (2026-10-17)
- [NOT-PLANI](ekip/NOT-PLANI.md) — Zengin içerikli, iki yönlü bağlantılı yerel defter ve not sistemi mimarisi; durumu: tamamlandı (2026-10-17)
- [KING-4](ekip/KING-4.md) — Tek ajan üzerinden bütün sistemi yöneten King 4.0 vizyonu ve yol haritası; durumu: sürüyor (2026-11-01)
- [KING-OLAY](ekip/KING-OLAY.md) — Modüllerin HKM kural motoruna ilettiği olayların taşıma ve içerik sözleşmesi; durumu: güncel (2026-11-01)
- [GUN-MODULU-PLANI](ekip/GUN-MODULU-PLANI.md) — HKM arayüzünün yerine gelen Gün modülü ve HKM ayarlarının Ayarlar › Merkez'e taşınışı; durumu: sürüyor.
- [DEVIR-20261102](ekip/DEVIR-20261102.md) — 2 Kasım 2026 baştan başlama devir notu; durumu: tarihî.
- [KING-DEVRIM](ekip/KING-DEVRIM.md) — Kişisel yasalar, kendi kendini süren gün ve her şeyi derse çevirme devrimi; durumu: tamamlandı (2026-10-22)
- [KING-EKIP](ekip/KING-EKIP.md) — King'in çok adımlı arka plan görevleri ve alt ajan koordinasyon mimarisi; durumu: tamamlandı (2026-10-21)
- [KING-BECERI](ekip/KING-BECERI.md) — Kullanıcının King'e öğrettiği beceriler ve geleceğe yönelik söz takibi; durumu: tamamlandı (2026-10-21)
- [KING-ARACLAR](ekip/KING-ARACLAR.md) — Modüllere gitmeden King üzerinden işlem yapmayı sağlayan araç kataloğu; durumu: tamamlandı (2026-10-20)
- [KING-ARAYUZ](ekip/KING-ARAYUZ.md) — King için büyük merkez pencere yerleşimi, stil ve etkileşim tasarımı; durumu: tamamlandı (2026-10-21)
- [MEYDAN](ekip/meydan/MEYDAN.md) — Sosyal katman tasarımı ve mantığı (kullanıcı kararıyla kaldırıldı); durumu: tamamlandı (2026-10-18)

## Ofis

- [OFIS](ekip/OFIS.md) — Claude Code için Antigravity ekibi yönetim protokolü, roller ve kullanım kuralları; durumu: güncel (2026-10-31)
- [GÖREVLER](ekip/gorevler/README.md) — Antigravity görev kuyruğu, akış, yasak bölgeler ve koruma kancası kuralları; durumu: güncel (2026-10-31)
- [DERSLER](ekip/gorevler/DERSLER.md) — Görev incelemelerindeki hatalardan çıkarılan kurallar ve ofis dersleri; durumu: güncel (2026-11-01)
- [_SABLON](ekip/gorevler/_SABLON.md) — Yeni görev dosyaları için standart başlık, durum, ölçüt ve sonuç şablonu; durumu: güncel (2026-10-31)

## Arşiv

- [DEVIR-2026-09](arsiv/DEVIR-2026-09.md) — 23 Eylül 2026 öncesi bitmiş part'lar, eski sorular ve talimat geçmişi arşivi; durumu: tamamlandı (2026-09-23)
- [DEVIR-HARITA](arsiv/DEVIR-HARITA.md) — SPİ rota haritası GPX içe aktarma ve canlı kayıt devir notları; durumu: tamamlandı (2026-10-03)
- [DEVIR-RADYO](arsiv/DEVIR-RADYO.md) — İnternet radyosu, tık sesleri ve animasyonlar ayarı devir notu; durumu: tamamlandı (2026-10-02)
- [EKIP-DURUM](arsiv/EKIP-DURUM.md) — Part 9 geliştirme sürecindeki canlı ekip takip panosu ve kapı kayıtları; durumu: tamamlandı (2026-09-24)
- [GELISTIRME_RAPORU](arsiv/GELISTIRME_RAPORU.md) — Dört sistemin ilk kapsamlı geliştirme raporu ve devir belgesi; durumu: tamamlandı (2026-09-18)
- [LIFEOS2](arsiv/LIFEOS2.md) — LifeOS 2 planının kat şeması, kurulan parçaları ve bekleyen işler durumu; durumu: tamamlandı (2026-09-25)
- [OFIS-OLCUM-20261101](arsiv/OFIS-OLCUM-20261101.md) — Antigravity ofis ekibiyle yapılan ilk geliştirme turunun sayısal ölçümleri; durumu: tamamlandı (2026-11-01)
- [T-DEVIR](arsiv/T-DEVIR.md) — Tasarım oturumuna devredilen yarım kalan işlerin tam listesi ve talimatları; durumu: tamamlandı (2026-09-25)
