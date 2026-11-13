# Faz 6 · Aşama 2 içeriği: Akademik, Müzik, Okuma

## Özet
Üç alana birer 2. aşama yazıldı: `alan/akademik/asama-2.json` («Deneme analizi ve soru kalıpları»), `alan/muzik/asama-2.json` («Temiz tempo»), `alan/okuma/asama-2.json` («Atomik not ve revizyon»). Her biri 1. aşamaya `onKosul: ["<alan>.1"]` ile bağlı; her ünitede 4 soruluk kapı (eşik 0,75, sorular kolaydan zora), her aşamada 6 soruluk kapı (eşik 0,8) var. Hiçbir öğe `onayli` değil: bütün dersler ve sorular `durum: "taslak"`, `yazan: "model"`; bütün kaynaklar `dogrulama: "dogrulanmamis"`.

| Alan | Ünite | Ders | Ders alıştırması (açık) | Ünite kapısı | Aşama kapısı | Toplam soru | Kaynak (gemini / depo) | Harf A/B/C/D |
|---|---|---|---|---|---|---|---|---|
| Akademik | 3 | 9 | 23 (1) | 12 | 6 | 41 | 19 (12 / 7) | 10/10/10/10 |
| Müzik | 3 | 9 | 25 (1) | 12 | 6 | 43 | 15 (5 / 10) | 10/11/10/11 |
| Okuma | 3 | 9 | 20 (1) | 12 | 6 | 38 | 14 (6 / 8) | 9/9/10/9 |

Sayılar kesin (kurucu betiğin sayımı ve denetçi). Kalite kapısı (bu ağaçta, 2026-11-14):
- `PYTHONIOENCODING=utf-8 python alan/denetle.py alan/akademik` → `Temiz · 2 dosya, 2 aşama, 33 ünite, 377 ders, 1900 alıştırma, 388 kaynak` (çıkış 0)
- `… alan/muzik` → `Temiz · 2 dosya, 2 aşama, 6 ünite, 18 ders, 90 alıştırma, 28 kaynak` (çıkış 0)
- `… alan/okuma` → `Temiz · 2 dosya, 2 aşama, 6 ünite, 19 ders, 86 alıştırma, 35 kaynak` (çıkış 0)
- `python alan/denetle_test.py` → 14/14 geçti; `python kalite/katman_test.py` → 0 hata; `python kalite/olcum.py --denetle` → «Bütçe tamam: 28 bütçe, aşım yok».

Kaynak denetimi betikle yapıldı: 48 kaynağın her birinin dosyası var (`gemini` → `C:\gemini-data`, `depo` → depo kökü), satır aralığı dosyanın içinde; her aralığın ilk ve son satırı yazdırılıp gözle iddiayla karşılaştırıldı. Ayrıca betikle: 2. aşamada 1. aşamayla aynı soru 0, aşama içinde yinelenen soru 0, yinelenen seçenek 0. Bütün hesaplı cevaplar (net, dizi, Δn, kodon, nota, perde, BPM, kelime sayısı) elle yeniden hesaplandı. Kaynakta olmayan bağlantı cümleleri, örnekler ve çalışma önerileri metinde «modelin örneği / modelin bağlantı notu / modelin önerisi / modelin hesabı» diye işaretli.

İş iki koşuda bitti: ilk koşu hesap sınırına takıldı, diskte yalnız bu raporun boş iskeleti kaldı. İkinci koşu her alanı bitirip denetçiden geçirdikten sonra bir sonrakine geçti ve raporu alan alan doldurdu. JSON dosyaları elle değil, scratchpad'deki küçük bir kurucu betikle (cevap harfini dengeli yerleştirir, model dosyalarının tek satırlık soru biçimini korur) üretildi; betik depoya konmadı.

## Akademik
Dosya: `alan/akademik/asama-2.json` · aşama `akademik.2` «Deneme analizi ve soru kalıpları» · `onKosul: ["akademik.1"]`.
Sayılar (kurucu betik + denetçi, kesin): 3 ünite, 9 ders, 41 alıştırma (ders alıştırması 23, biri açık uçlu kanıt işi; ünite kapısı 12; aşama kapısı 6), 19 kaynak (12 gemini-data, 7 depo). Eşikler ünite 0,75 (4 soru), aşama 0,8 (6 soru). Cevap harfleri A 10, B 10, C 10, D 10 (4 seçenekli; 1. aşama 5 seçenekliydi).
Denetçi (1. ve 2. aşama birlikte): `Temiz · 2 dosya, 2 aşama, 33 ünite, 377 ders, 1900 alıştırma, 388 kaynak` (çıkış 0).

**Sıra gerekçesi.** 1. aşama («YKS konu temeli») AYS'nin 184 konusunun hepsini aldı; yani içerik hattı §6.3'teki Akademik yolunun 2. ve 3. aşamaları (TYT temelleri, AYT alan dersleri) orada bitti. Yol haritasında sıradaki boş basamak 4. aşama «Soru kalıpları ve hız»dır; 1. aşamanın kanıt işi de «denemeyi süreyle çöz, yanlışları konu ve hata türüne göre ayır» idi. 2. aşama tam buradan devam ediyor: önce o denemenin nasıl çözümleneceği (AYS'nin kendi protokolü), sonra soru kökü ve öncüllü sorular, en son üç AYT Sayısal konusunun soru kalıpları. Yol haritasının 1. aşaması «Yöntem ve tanı» (öğrenme bilimi atlasları) yazılmadı (Eksikler).
**Neden Sayısal ve neden bu üç konu.** AYS'nin hedefi Sayısal bir program (`AYS/src/js/data/curriculum.js` satır 12 `program`), 1. aşamanın hedefi de «TYT ve AYT Sayısal». AYT Coğrafya/Edebiyat gibi sözel boşluklar bu hedefe hizmet etmediği için seçilmedi. Ünite 2.3'te Matematik, Kimya ve Biyoloji'den birer konu var; üçü de gemini-data'da ayrı atlası, AYS'de anlatımı ve MÜFREDAT'ta kazanım kodu olan konular (diziler MAT.12.1.1, kimyasal denge KİM.11.2.2-5, genden proteine BİY.12.2.1-3). Fizik bu aşamada yok.

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 2.1 Denemeyi okumak: net, süre ve hata etiketi | Net ve süre · Yedi adımlı analiz · Hata etiketleri ve yanlış defteri (+ kanıt işi provası, `acik`) | depo `AYS/src/js/data/reference.js` 109-125, 126-136; `hints.js` 60-71; G `AYS/deneme_ve_analiz_motoru/hata_kok_neden_…` 13-31 |
| 2.2 Soru kökü, öncüllü sorular ve eleme | Kökü okumak · Kesinlikle doğru mu, olabilir mi: karşıt örnek · Seçeneklerden eleme ve işlem tuzakları | G `AYS/soru_bankasi_kaliplari/kesinlik_ve_oncul_…` 7-44; G `…/yks_matematik_ve_geometri_islem_hatasi_…` 11-17, 21-39, 155-171; `hata_kok_neden_…` 13-31 |
| 2.3 AYT Sayısal: üç konunun soru kalıpları | Diziler · Kimyasal denge: Q, Kp, Le Chatelier · Genden proteine: kodon ve sayım | G `AYS/ayt/ayt_matematik_diziler_…` 16-71, `ayt_kimya_kimyasal_tepkimelerde_denge_…` 16-70, `ayt_biyoloji_nukleik_…` 54-99, `kesinlik_…` 86; depo `anlatim-am.js` 261-290, `anlatim-ak.js` 200-231, `anlatim-ab.js` 102-133, `derin-ab.js` 177-200; G `MUFREDAT/matematik.md` 79, `kimya.md` 77-80, `biyoloji.md` 89-92 |

**Yöntem.** Ünite 2.1 tamamen AYS'nin depoda zaten çalışan deneme protokolünden (K/İ/Y/S/D etiketleri, tamir reçeteleri, yanlış defteri alanları) kuruldu; gemini-data taksonomisi (15 kod) yalnız bu beş etikete eşlenerek kullanıldı ve eşleme metinde «modelin eşlemesi» diye işaretli. Ünite 2.3'te her olgu iki kaynaktan geçti: gemini atlası + AYS anlatımı (ör. Q/K yönü, saf katı kuralı, durdurma kodonu); iki kaynakta aynı olanlar metinde «iki kaynakta aynı» diye yazılı. Yalnız atlasta olan iki olgu (Kp = Kc(RT)^Δn, Kp'ye yalnız gaz yazılır; dizilerde indeks toplamı kuralı) atlasa dayanıyor ve doğrulanmamış. Bütün sayısal soruların cevapları elle yeniden hesaplandı (net, dizi terimleri, Δn, kodon sayıları, karşıt örnekler). Her ders 1. aşamadaki karşılığını `not` alanında anar (akademik.1.16.17, .1.25.5, .1.27.7); aşamalar arası ders önkoşulu kurulmadı, aşama önkoşulu yeterli sayıldı.

## Müzik
Dosya: `alan/muzik/asama-2.json` · aşama `muzik.2` «Temiz tempo» (ad ESP merdiveni müzik rank 2'den, `ESP/src/js/data/curriculum.js` satır 206-213) · `onKosul: ["muzik.1"]`.
Sayılar (kesin): 3 ünite, 9 ders, 43 alıştırma (ders alıştırması 25, biri açık uçlu kanıt işi; ünite kapısı 12; aşama kapısı 6), 15 kaynak (5 gemini-data, 10 depo). Eşikler ünite 0,75, aşama 0,8. Cevap harfleri A 10, B 11, C 10, D 11.
Denetçi (1. ve 2. aşama birlikte): `Temiz · 2 dosya, 2 aşama, 6 ünite, 18 ders, 90 alıştırma, 28 kaynak` (çıkış 0).

**Sıra gerekçesi.** İçerik hattı §6.3 Gitar 2. aşaması «Temiz tempo: ritim, metronom, akor geçişi, barre»; merdivenin 2. basamağı aynı adı taşıyor ve çalışma listesi «Barre akorlar · Pentatonik kalıp 1 · Ritim kalıpları». 1. aşama dörtlük vuruş, 4/4 ve 3/4, beş açık akor ve tek bir akor geçişinde kalmıştı. Ünite sırası: önce ritim (vuruşu bölmek, aksak ölçüler, temiz eşiği ölçmek), sonra dereceler ve ilerlemeler (1. aşamanın akorlarını bir dizide birleştirmek), en son barre, pentatonik kalıp 1 ve bir parçayı bitirmek. Ton olarak Sol majör seçildi: I–V–vi–IV, I–vi–IV–V ve 12 ölçü blues bu tonda yalnız 1. aşamanın açık akorlarıyla (G, C, D, Em) çalınıyor, öğrenen yeni akor öğrenmeden ilerleme çalışabiliyor.

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 2.1 Vuruş, ölçü ve temiz tempo | Vuruşu bölmek: Ta-Ka ve Ta-Ka-Di-Mi · Ölçü türleri: düz ve aksak · Temiz eşiği ölçmek | G `ESP/muzik_diksiyon/ritim_matematigi_…` 81-108, 116-128; depo `guitar_tabs.js` 1-9, 65-88, 92-100, 102-114; `curriculum.js` 206-213; `topics.js` 167-182 |
| 2.2 Dereceler ve akor ilerlemeleri | Majör gamda yedi akor · Dört yaygın ilerleme · Geçişi temizlemek | depo `guitar_tabs.js` 13-46, 48-63, 65-88; katalog `veri/taslak/esp/gitar_akor_gam_katalogu.jsonl` 1-5; G `gitar_armoni_ve_diksiyon_ustalik.md` 33-39, 43-53 |
| 2.3 Barre, pentatonik ve bir parçayı bitirmek | E ve A şekilli barre · Minör pentatonik: kalıp 1 · Bir parçayı baştan sona: 12 ölçü blues (+ kanıt işi, `acik`) | katalog 6-7; G `gitar_armoni_…` 33-39, 57-67; depo `guitar_tabs.js`, `curriculum.js` 206-213 |

**Kanıt işi bir üretim görevi (çal ve işaretle):** Sol majörde 12 ölçü blues'u metronomla kendi temiz temponda baştan sona duraksamadan çalıp kaydetmek, boşluk kalan ölçüleri numarasıyla işaretlemek, sonra pentatonik kalıp 1'i çalmak. Bu, merdivenin kanıtını («bir parçayı baştan sona duraksamadan çalmak») somut bir parçaya bağlıyor. Şema hâlâ çalmayı puanlayamıyor; iş `acik` ve sahibin değerlendirmesinde.

**Model hesapları.** Kaynaklarda tablo olarak olmayan dört şey, kaynaktaki kurala dayanılarak hesaplandı ve metinde «modelin hesabı» diye işaretli: (1) derece akorları (ESP gam adımları `guitar_tabs.js` 22 → üçlü kurma; atlasın mod nitelikleriyle 47-53 karşılaştırıldı, tutuyor); (2) ilerlemelerin Sol, Do, Re, La majöre çevrilmesi; (3) barre şeklinin kaydırılınca verdiği akor (kök tel + perde sayımı); (4) pentatonik kalıp 1'in perde yerleri (kaynakta tab yok; gam adımları + boş tel notaları). Bütün nota ve perde cevapları on iki ses dizisiyle elle yeniden hesaplandı. Kaynakta olmayan çalışma önerileri («Ta»da aşağı/«Ka»da yukarı vuruş, en zor geçişi ayrı çalma, hata sonrası bir sonraki ölçüye yetişme) «modelin önerisi» diye işaretli.

## Okuma
Dosya: `alan/okuma/asama-2.json` · aşama `okuma.2` «Atomik not ve revizyon» (ad merdivenin okuma 2. basamağı «Atomik not» ile yazı 2. basamağı «Revizyon»dan) · `onKosul: ["okuma.1"]`.
Sayılar (kesin): 3 ünite, 9 ders, 38 alıştırma (ders alıştırması 20, biri açık uçlu kanıt işi; ünite kapısı 12; aşama kapısı 6), 14 kaynak (6 gemini-data, 8 depo). Eşikler ünite 0,75, aşama 0,8. Cevap harfleri A 9, B 9, C 10, D 9.
Denetçi (1. ve 2. aşama birlikte): `Temiz · 2 dosya, 2 aşama, 6 ünite, 19 ders, 86 alıştırma, 35 kaynak` (çıkış 0).

**Sıra gerekçesi.** İçerik hattı §6 okuma-yazı için aşama tablosu vermiyor (§2 yalnız boşlukları sayıyor: paragraf, cümle, özet alıştırmaları, okuma listesi düzeyleri). Sıra bu yüzden ESP merdiveninden geldi: 1. aşama okuma 1. basamağı («Düzenli okuma», üç cümleyle özet) ile yazı 1. basamağını («Sayfayı doldurmak», ilk taslak) birleştirmişti; 2. aşama aynı biçimde iki 2. basamağı birleştiriyor: «Atomik not» (tek fikir = tek not, kendi cümlenle yazma, kavram etiketi; kanıt «bir bölümü on nota ayırmak») ve «Revizyon» (ikinci taslak, gereksiz kelime avı, cümle uzunluğu dengesi; kanıt «bir metni yarı uzunluğa indirip güçlendirmek»). Arada Adler atlasının analitik okuma 2. ve 3. aşaması (kural 5-11) duruyor: 1. aşama kural 1-4'ü («kitap ne hakkında») işlemişti, bu aşama kaldığı yerden devam ediyor ve atomik notun içeriğini (terim → tanım notu, önerme → iddia notu, argüman → kanıt notu, eleştiri → itiraz notu) veriyor.

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 2.1 Atomik not: bir bölümü on nota ayırmak | Tek fikir = tek not · Notun türü ve kavram etiketi · Bir bölümü on nota ayırmak | depo `ESP/src/js/data/curriculum.js` 316-322; `reading_method.js` 12-26, 41-58, 60-69; G `ESP/yazi_ve_kompozisyon/retorik_…` 42-50; G `AYS/ogrenme_bilimi/not_tutma_sistemleri_…` 36-43 |
| 2.2 Yazarı anlamak, sonra yargılamak | Terimler ve önermeler · Argümanı yeniden kurmak · Anlamadan eleştirme: dört itiraz gerekçesi | G `ESP/okuma_ve_sentez/adler_…` 56-60, 62-69; depo `reading_method.js` 28-39, 41-58 |
| 2.3 Revizyon: metni kısaltıp güçlendirmek | Gereksiz kelime avı · Cümle uzunluğu, tekrar ve sesli okuma · Yarı uzunluğa indirmek (+ kanıt işi provası, `acik`) | depo `rhetoric.js` 65-90; `curriculum.js` 371-377, 379-386; G `ESP/yazi_ve_kompozisyon/akademik_makale_…` 36-45, `retorik_…` 54-62 |

**Örtüşme kararı.** 1. aşama not şablonlarını, Zettelkasten'in iki ilkesini ve revizyon geçişlerinin ilk dördünü kısaca anmıştı. 2. aşama bunları tekrar etmek yerine uygulatıyor: notu bölme sınaması, şablon seçimi, on nota ayırma hesabı; yedi geçişin tamamı ve sırasının neden yarıya indirmede belirleyici olduğu. Aynı kaynağın aynı satırları iki aşamada da kaynak gösterildi (`reading_method.js` 41-58, `rhetoric.js` 65-90), aynı soru iki aşamada yok (betikle denetlendi). Bütün örnek cümleler ve notlar modelin; metinde «modelin örneği» diye işaretli. Kavram etiketinin nasıl yazılacağı kaynakta yok (merdivende yalnız başlık); ders bunu «modelin önerisi» diye veriyor.

## Kaynaklar ve hatalar
**Akademik**
- `AYS/deneme_ve_analiz_motoru/hata_kok_neden_taksonomisi_…` satır 4: dosya kendini «YKS kapsam dışı, üniversite düzeyi» diye etiketliyor; içerik ise YKS denemesi üzerine. Kaynaksız sayılar alınmadı: «son 20 dakikada hata oranı 3 kat» (23), bölüm süre kotaları (23), ERR_15'in glukoz/prefrontal korteks açıklaması (31), «%65-70 net cepte» (28), ROI tablosundaki saat ve puanlar (41-62).
- `…/yks_matematik_ve_geometri_islem_hatasi_…` satır 16: «doğru cevap %80 bu ikiliden biridir», kaynaksız; strateji sayısız verildi.
- `…/kesinlik_ve_oncul_…` satır 91 (CE_KIM_12): «Sönmüş kireç Ce2(SO4)3 veya Ca(OH)2» bozuk bir cümle (sönmüş kireç yalnız Ca(OH)₂'dir); satır 83 (CE_KIM_04) «asla H2 çıkarmaz! NO, NO2 veya SO2 çıkarırlar» her asit için geçerli değil. İkisi de derse alınmadı; tablodan yalnız matematik satırları ve CE_KIM_07 (katalizör, AYS anlatımıyla aynı) kullanıldı.
- `AYS/ayt/ayt_biyoloji_nukleik_…` satır 63 ile 98 çelişiyor: önce «61 kodon için ~30-40 tRNA yeterli», sonra «en çok 61 çeşit tRNA görev alabilir». tRNA çeşidi sorusu alınmadı.
- `AYS/ayt/ayt_kimya_kimyasal_tepkimelerde_denge_…` satır 25-31: «minimum enerji eğilimi ısının olduğu tarafa doğrudur» kutusu kaba bir anlatım ve AYS anlatımında yok; «köpek kaçırtan» akrostişi ezber hilesi. Alınmadı.
- AYS ipuçlarında küçük iç fark: protokolde yanlışlar 1 ve 7 gün sonra tekrar edilir (`reference.js` 115), yanlış defterinde +1 gün, +3 gün, +1 hafta, +1 ay (`reference.js` 134). Ders ikisini de veriyor, birini seçmeyi öğrenene bırakıyor.

**Müzik**
- `ESP/src/js/data/guitar_tabs.js` satır 54: ii–V–I için «önce tek tonda, sonra çeyrek tonlarla»; çeyrek ton bu bağlamda anlamsız (büyük olasılıkla «bütün tonlarda» kastedilmiş). Alınmadı.
- Beşli ölçü iki kaynakta farklı yazılmış: ESP `guitar_tabs.js` 97 «5/4 aksak, vurgu 3+2 ya da 2+3», usul atlası 100 «Türk Aksağı 5/8, 2+3». Ders ikisini de veriyor; iç bölüntüde çelişki yok.
- Usul atlasının darp heceleri (`ritim_matematigi_…` 95-108) bazı satırlarda bölüntüyle sayıca örtüşmüyor (ör. Devr-i Hindî 3+2+2 üç bölüm, hece dizisi «Düm - Te-Ke - Düm - Tek» dört grup, satır 102). Ses olmadan sınanamadığı için alınmadı.
- Aynı atlas satır 31: popüler müziğin 100-120 BPM'de toplanmasının «biyolojik rezonans sebebiyle» olduğu; satır 15-33 senkopun «dopaminerjik ödül» şeması. Kaynaksız, alınmadı (1. aşama raporu da yazdı).
- `gitar_armoni_ve_diksiyon_ustalik.md` satır 67: CAGED'i çözenin «klavyenin hiçbir yerinde kaybolmaz» vaadi; ders bunu vaat diye anıyor.
- Katalog satır 3: Sol majörü mutlak olarak «dominant karakterde» tanımlıyor; yalnız Do majör tonunda doğru. Ders Sol majörü tonik olarak kullanıyor ve bu cümleyi almadı.
- Merdiven kapısı «temiz eşik ≥ 80 BPM» (`curriculum.js` 209) ile verinin «ilk tempo girilene kadar eşik üretilmez» ilkesi (`guitar_tabs.js` 3-5) arasındaki gerilim sürüyor; ders 80'i referans, kendi ölçümü esas sayıyor.

**Okuma**
- Kaynaklar arası çelişki: ESP alıntı notuna izin veriyor ama az kullanılmasını istiyor (`reading_method.js` 56-57); not tutma atlası «kitaptan doğrudan alıntı yapmak yasaktır» diyor (`not_tutma_sistemleri_…` 43). Ders ESP'nin ölçülü kuralını esas aldı.
- Luhmann'ın «70 kitap ve 400 makale»si iki atlasta (`retorik_…` 43, `not_tutma_…` 34) kaynaksız tekrar ediyor; alınmadı.
- Adler atlası satır 47 «15 altın kural» diyor, liste 11'de bitiyor (1. aşama raporu da yazdı).
- `akademik_makale_…` satır 42 «Omit needless words!»i Orwell'in kuralına koyuyor; söz Strunk'a ait. Kural alıntısız verildi.
- `retorik_…` satır 65: Zinsser'e atfedilen tırnaklı cümle kaynaksız (1. aşama raporu); alınmadı.
- ESP'nin kısaltma geçişi notu «hedef yüzde yirmi» (`rhetoric.js` 80) ile merdivenin kanıtı «yarı uzunluğa indirmek» (`curriculum.js` 377) farklı ölçüler veriyor. Ders yüzde yirmiyi 1. aşamadaki gibi almadı; yarıyı «alıştırma ölçüsü, her metnin hedefi değil» diye verdi.

## Eksikler
**Akademik**
- İçerik hattı §6.3'ün Akademik 1. aşaması «Yöntem ve tanı» (`AYS/ogrenme_bilimi` 16 atlas, ön-koşul zinciri) hiçbir aşamada yok. 1. aşama konu temeline dönüştüğü için bu bölüm ya ayrı bir aşama olmalı ya da King'in koçluk bilgisine gitmeli.
- Fizik kalıpları, sözel/EA dersleri (AYT Edebiyat, Tarih-2, Coğrafya-2) ve yol haritasının «hız» tarafı (süreli setler, turlama) yazılmadı. Turlama ve süre kotaları gemini-data'da kaynaksız sayılarla geliyor.
- Şekilli soru yok (şema şekil taşımıyor; 1. aşamanın açığı sürüyor).

**Müzik**
- Pentatonik kalıp 1'in tabı, barre'ın el tekniği (baskı, baş parmak, bilek) ve vuruş yönü için hiçbir kaynakta tarif yok. Kalıp hesapla kuruldu; el tekniği hiç yazılmadı.
- Plan 4.N.13-14 (power akorlar, yedili/sus/add akorlar) ve CAGED'in beş şeklinin bağlanması yazılmadı; ilki için kaynak yok, ikincisi ESP konu listesinde 3. düzey.
- Ses yok: ritim, aksak ölçü ve blues dinleyerek öğrenilir; bütün dersler öğrenenin kendi çalmasına ve metronoma dayanıyor. Kapılar yalnız bilgi soruyor; çalma kanıtı `acik` ve puanlanmıyor (şema sınırı, 1. aşamadan beri açık).
- Merdivenin sayaç kapıları (3 parça/teknik, 30 günde 450 dakika, temiz eşik ≥ 80) şemada karşılığı olmadığı için aşamaya taşınmadı.

**Okuma**
- Noktalama ve yazım kuralları (1. aşamanın ertelediği `tyt_turkce_paragraf_…` 95-255) yine yazılmadı: sınav odaklı ve Akademik'in TYT Türkçe dil bilgisi ünitesiyle örtüşüyor.
- Okuma listesi düzeyleri (hangi kitapla başlanır) hâlâ kaynakta yok.
- Kavram etiketinin biçimi, bölme sınaması ve «tek başına anlaşılma» sınaması kaynakta yok; modelin önerisi olarak yazıldı, sahip onaylamalı.
- Cümle uzunluğu için kaynak sayı vermiyor (ne «uzun» eşiği ne ortalama); ders bilerek sayı koymadı. Sayılı ölçüm (Ateşman ≥ 45) merdivenin 3. basamağında.
- Merdivenin sayaçları (30 atomik not, 3 kaynak, 8 taslak, taslak başına ≥ 1 revizyon) motorun işi; aşamaya taşınmadı.

**Üçü için**
- Bütün kaynaklar `dogrulanmamis`, bütün dersler ve sorular `taslak` / `yazan: "model"`; sahip incelemesi yapılmadı. Açık uçlu kanıt işleri puanlanmıyor.
- Ünite kapı soruları kolaydan zora sıralandı (önce tanım ya da kural, sonda hesap ya da senaryo); bu sıralama modelin yargısıdır, öğrenen verisiyle sınanmadı.

## Açık sorular
1. **Akademik:** 2. aşama için «Deneme analizi ve soru kalıpları» (yol haritasının 4. basamağı) seçildi, çünkü 1. aşama konu temelini bitirdi. Yol haritasının 1. basamağı «Yöntem ve tanı» (öğrenme bilimi) ayrı bir aşama mı olsun, King'e mi gitsin, yoksa bırakılsın mı?
2. **Akademik:** Hedef Sayısal kaldıkça AYT sözel/EA boşlukları (Edebiyat, Tarih-2, Coğrafya-2) yazılmayacak. Doğru mu? Fizik kalıpları 3. aşamaya mı?
3. **Akademik:** AYS'nin tekrar aralığı iki yerde farklı (1 ve 7 gün; +1/+3/+7/+30 gün). Hangisi esas?
4. **Müzik:** Pentatonik kalıp 1'in tabı ve barre el tekniği için bir kaynak (gitar metodu, sahibin videosu) eklensin mi? Kalıp şu an hesapla kuruldu.
5. **Müzik:** Merdivenin «temiz eşik ≥ 80 BPM» kapısı mı, verinin «kendi ölçümün» ilkesi mi esas? Ders şimdilik ikincisini esas alıyor.
6. **Müzik:** Şemaya puanlanabilir bir üretim türü (`calma`/`kayit`, sahip onaylı) eklensin mi? 1. aşamadan beri açık; iki kanıt işi de `acik` kaldı.
7. **Okuma:** Alıntı notu: ESP'nin «az kullan» kuralı mı, atlasın «yasak» kuralı mı?
8. **Okuma:** Noktalama ve yazım Okuma alanında mı öğretilsin, yoksa Akademik'in TYT Türkçe ünitesine önkoşul olarak mı bağlansın?
9. **Üçü için:** Depodaki model yazımı veri (AYS `reference.js`, ESP `guitar_tabs.js`, `rhetoric.js`, `reading_method.js`) kaynak sayılmaya devam etsin mi, yoksa dış bir kaynakla doğrulanınca mı?
