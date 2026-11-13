# Faz 6 · Aşama 2 içeriği: Felsefe, Dil, Tarih

## Özet
Üç alana birer 2. aşama yazıldı: `alan/felsefe/asama-2.json` («İlk tez»), `alan/dil/asama-2.json` («İngilizce A1: ilk cümleler»), `alan/tarih/asama-2.json` («İskelet kronoloji»). Her biri 1. aşamaya `onKosul: ["<alan>.1"]` ile bağlı (SEMA'nın aşama ön koşulu), her ünitede kapı ve aşama kapısı var. Hiçbir öğe `onayli` değil: bütün dersler ve sorular `durum: "taslak"`, `yazan: "model"`; bütün kaynaklar `dogrulama: "dogrulanmamis"`. AGENTS §0.1 gereği sahip onaylamadan hiçbiri tekrar kuyruğuna girmez.

| Alan | Ünite | Ders | Ders alıştırması (açık) | Ünite kapısı | Aşama kapısı | Toplam soru | Kaynak (gemini / depo) | Eşik ünite / aşama |
|---|---|---|---|---|---|---|---|---|
| Felsefe | 3 | 9 | 20 (1) | 12 | 6 | 38 | 16 (14 / 2) | 0,75 / 0,8 |
| Dil | 3 | 9 | 21 (1) | 12 | 5 | 38 | 10 (4 / 6) | 0,75 / 0,8 |
| Tarih | 3 | 9 | 21 (1) | 12 | 5 | 38 | 11 (3 / 8) | 0,75 / 0,8 |

Sayımlar betikle (JSON üzerinden) yapıldı; her kaynağın dosyası var ve satır aralığı dosya uzunluğunun içinde (betikle denetlendi; `C:\gemini-data` yalnız okundu). Denetçi, 1. ve 2. aşama birlikte (`PYTHONIOENCODING=utf-8 python alan/denetle.py alan/<alan>`):
- felsefe: `Temiz · 2 dosya, 2 aşama, 6 ünite, 18 ders, 75 alıştırma, 35 kaynak` (çıkış 0)
- dil: `Temiz · 2 dosya, 2 aşama, 6 ünite, 19 ders, 76 alıştırma, 25 kaynak` (çıkış 0)
- tarih: `Temiz · 2 dosya, 2 aşama, 6 ünite, 18 ders, 76 alıştırma, 25 kaynak` (çıkış 0)

İş iki koşuda bitti: ilk koşu hesap sınırına takıldı (üç dosya diskteydi; raporun Özet, Tarih, Kaynaklar ve hatalar, Eksikler, Açık sorular bölümleri boştu). İkinci koşu üç dosyayı baştan sona okuyup gözden geçirdi ve üç küçük düzeltme yaptı: Tarih kanıt işinin örnek cevabında yazının yüzyılı «MÖ 33.» yazılmıştı, kaynağın kuralıyla (`history.js` 69-74, `centuryOf`) MÖ 3200 → «MÖ 32. yüzyıl» oldu; Felsefe kanıt işinde «yöneltin» → «yönelt» (öteki emirlerle uyum); Dil aşama kapısı k5'te soru kökü «çoğulu gösteren iki işaret» → «işaretlerden ikisi» (cümlede «These» de çoğul işaretidir; kök, yalnız iki işaret varmış gibi okunuyordu).

## Felsefe
Dosya: `alan/felsefe/asama-2.json` · aşama `felsefe.2` «İlk tez» (ad ESP merdiveni rank 2'den, `ESP/src/js/data/curriculum.js` satır 150-156) · `onKosul: ["felsefe.1"]`.
Sayılar (denetçi + sayım): 3 ünite, 9 ders, 38 alıştırma (ders alıştırması 20, biri açık uçlu kanıt işi; ünite kapısı 12; aşama kapısı 6), 16 kaynak. Eşikler 1. aşamayla aynı: ünite 0,75 (4 soru), aşama 0,8 (6 soru). Bütün dersler FEL.10.2.2'ye («Mantığın temel kavramlarını ve argümantasyon sürecini yorumlayabilme») bağlı.

Sıra gerekçesi: içerik hattı §6.1 aşama 2 = «Argümanın yapısı · Geçerlilik ve akıl yürütme türleri · Safsatalar · İlk primer metin»; merdiven çalışma listesi «Öncül–sonuç ayrımı, Safsata kataloğu, Primer metin okuma». İlk üçü ünite oldu; 1. aşamanın son konusu (kavram → önerme) doğrudan önerme türleriyle devam ediyor. Primer metin ünitesi yazılmadı (Eksikler).

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 2.1 Önermeden kıyasa | Dört önerme: A, E, I, O · Karşı olum karesi · Kıyas: iki öncülden bir sonuç | `ESP/felsefe/klasik_mantik_…` 66-105; `AYS/ayt/ayt_felsefe_grubu_…` 132-137; depo `AYS/src/js/data/anlatim-ts.js` 650-668, `derin-ts.js` 1035-1065 |
| 2.2 Akıl yürütme ve geçerlilik | Tümdengelim, tümevarım, analoji · Geçerlilik, doğruluk, sağlamlık · Biçim hataları: dört geçersiz kalıp | depo `anlatim-ts.js`, `derin-ts.js`; `ESP/felsefe/filozoflar_akimlar_…` 196-201; `ESP/felsefe/etik_siyaset_hukuk_…` 125-128; `ESP/felsefe/mantik_safsatalar_…` 86-89 |
| 2.3 Safsatalar ve dürüst itiraz | Kişiye, konuya ve kalabalığa yönelen safsatalar · Neden, genelleme ve ikilem hataları · Argüman kurmak ve itiraz etmek (+ kanıt işi, `acik`) | `mantik_safsatalar_…` 35-78, 90-122; `klasik_mantik_…` 110-120 |

İki depo kaynağı (`tur: "depo"`, AYS `ts-f8`) da model yazımıdır ve doğrulanmamıştır; gemini-data'da tümdengelim/tümevarım/analoji ayrımı ve «geçerlilik içerik değil biçimdir» cümlesi ders biçiminde yok, bu yüzden kullanıldı. Modelin bağlantı cümleleri ve örnekleri metinde «modelin örneği / modelin bağlantı notu» diye işaretli. Cevap harfi dağılımı elle dengelendi (A 9, B 9, C 12, D 7 civarı).

## Dil
Dosya: `alan/dil/asama-2.json` · aşama `dil.2` «İngilizce A1: ilk cümleler» · `onKosul: ["dil.1"]`.
Sayılar: 3 ünite, 9 ders, 38 alıştırma (ders alıştırması 21, biri açık uçlu kanıt işi; ünite kapısı 12; aşama kapısı 5), 10 kaynak. Eşikler ünite 0,75, aşama 0,8.

**Dil seçimi: İngilizce.** Kaynaklar açıkça onu gösteriyor: içerik hattı §6.2'nin Dil yolu İngilizce yazılmış; depodaki sıklık listesi ve Tatoeba cümle çiftleri İngilizce için en dolu (`kelimeornek.js` en: 927 sözcük örneği); `lessons.js` A1 öğeleri yalnız İngilizce ve Almanca için var; gemini-data'daki üç dil atlası (IPA, C1/C2, YDT) İngilizce örnek taşıyor. Almanca da A1 öğesi taşıyor ama ders malzemesi daha ince.

**Bu aşama, yol haritasında neye denk?** Dil 1. aşaması dilden bağımsız temellerdi (yazı ve ses, diksiyon, edinim yöntemi). Bu yüzden `dil.2`, içerik hattı §6.2'deki İngilizce «Aşama 1 (A1)» tablosunun ilk kısmıdır (ders 2, 3, 4, 5, 7, 8 karşılandı; alfabe ve sayı/saat/gün dersleri kaynak olmadığı için yok). Kanıt işi merdivenin Dil 1. basamağı: «Kendini üç cümleyle tanıtan bir kayıt», bu kez İngilizce.

**Yöntem: kural uydurmadan A1.** gemini-data'da hiçbir dil için A1 ders metni yok (önceki raporun bulgusu, yeniden `grep` ile doğrulandı: «present simple», «to be», «article» aramaları yalnız ileri düzey atlaslara çıktı). Bu yüzden dersler, depodaki **gerçek veriye** dayanır: Tatoeba cümle çiftleri (`kelimeornek.js`, `temiz` katmanından üretilmiş, CC BY 2.0 FR), OpenSubtitles sıklık listesi (`kelimesiklik.js`), ESP A1 hedef ve tuzakları (`grammar.js`), ESP ünite öğeleri (`lessons.js`) ve iki ESP öğrenme kartı. Dilbilgisi kalıpları (I → am, he/she → is, has, -s, an) bu cümlelerden **gözlem** olarak çıkarıldı ve metinde «modelin çıkarımı» diye işaretli; her dersin `not` alanında kullanılan Tatoeba kimlikleri var. Dersteki 73 «İngilizce = Türkçe» çiftinin hepsi `kelimeornek.js` ile karşılaştırıldı (betikle): hepsi veride aynen var, kimliklerin hepsi geçerli.

| Ünite | Dersler | Kaynak |
|---|---|---|
| 2.1 İngilizceye ilk adım | İngilizcenin sesleri: yazı başka, ses başka · Sözcük sırası: Türkçe SOV, İngilizce SVO · Önce sık kelimeler, cümleyle birlikte | `ESP/dil/dunya_alfabeleri_…` 92-96; `ESP/dil/ingilizce_c1_c2_…` 90-104; `ESP/dil_ogrenimi/ikinci_yabanci_dil_…` 75-82; depo `kelimesiklik.js`, `lessons.js` 32-62, `ogrenmekartlari.js` 8-30 |
| 2.2 Kendini tanıtmak: zamirler ve «to be» | Zamirler ve iyelik · am, is, are · Selamlaşma, tanışma ve kibar kalıplar (+ kanıt işi, `acik`) | depo `kelimeornek.js`, `lessons.js`, `ogrenmekartlari.js` 54-77; `ikinci_yabanci_dil_…` 112-116 (CEFR) |
| 2.3 İlk cümleler | a, an, the ve çoğul · have, want, need, like · Geniş zaman ve şimdiki zaman | depo `grammar.js` 22-31, `kelimeornek.js` |

En güçlü ders 2.3.3: ESP'nin A1 tuzağı («alışkanlık ile şu anı tek kalıpla karşılamak») Tatoeba'nın kendi çevirilerinde görünüyor («Does Ken play tennis?» → «Ken tenis oynuyor mu?»); ders bunu kanıt olarak kullanıyor.

## Tarih
Dosya: `alan/tarih/asama-2.json` · aşama `tarih.2` «İskelet kronoloji» (ad ESP merdiveni Tarih rank 1'den, `ESP/src/js/data/curriculum.js` satır 417-424) · `onKosul: ["tarih.1"]`.
Sayılar: 3 ünite, 9 ders, 38 alıştırma (ders alıştırması 21, biri açık uçlu kanıt işi; ünite kapısı 12; aşama kapısı 5), 11 kaynak (8 depo, 3 gemini-data). Eşikler ünite 0,75 (4 soru), aşama 0,8 (5 soru). Cevap harfleri A 7, B 12, C 9, D 9.

**Sıra gerekçesi.** 1. aşama raporu (`faz6-tarih-dil-icerik.md` §Eksikler) «çağlar ve takvim iskeleti gemini-data'da yok» diyordu; bu koşuda da gemini-data'da çağ/dönem iskeleti bulunmadı ve `MUFREDAT` klasöründe tarih programı yok (yalnız biyoloji, coğrafya, felsefe, fizik, kimya, matematik). İskelet bu yüzden depodaki ESP tarih verisinden kuruldu: `history.js` (`ESP.ERAS` altı dönem ve tartışma notları, `centuryOf` yüzyıl kuralı, `SEED_EVENTS` tohum olaylar). Takvim ve tarih öncesi çağlar AYS `ts-t1` anlatımından. Ünite sırası ESP merdiveninin çalışma listesini izler («Büyük dönemler ve sınırları · Yüzyıl mantığı · On dönüm noktası ezberi»); kanıt işi merdivenin `proof`'u: «Boş bir zaman şeridine on olayı doğru yerleştirmek.»

| Ünite | Dersler | Kaynak (satır) |
|---|---|---|
| 2.1 Zamanı ölçmek | Takvimler: güneş yılı, ay yılı · MÖ, MS ve yüzyıl hesabı · Olay tarihi, belge tarihi, yaklaşık tarih | depo `AYS/src/js/data/anlatim-ts.js` 674-686, `derin-ts.js` 1081-1120; `ESP/src/js/data/history.js` 1-18, 69-84; `ogrenmekartlari.js` 2678-2722 («Kronoloji kurma» kartı); Kadeş için `ESP/tarih/anadolu_uygarliklari_…` 40, `ESP/tarih/anadolu_ve_mezopotamya_…` 35, `ESP/tarih/dunya_ve_turk_tarihi_kirilmalar.md` 53 |
| 2.2 Büyük dönemler ve sınırları | Tarih öncesi: taş ve maden çağları · Altı dönem: İlk Çağ'dan Çağdaş'a · Dönem sınırları birer karardır | `history.js` 22-56 (dönemler, `disputed` notları, sınır yılı kuralı); AYS `ts-t1`; `dunya_ve_turk_tarihi_kirilmalar.md` 48-101 |
| 2.3 Zaman şeridi: dönüm noktaları | Yazıdan Charlemagne'a · Malazgirt'ten Karlofça'ya · Devrimlerden bugüne (+ kanıt işi, `acik`) | `history.js` 111-248; `dunya_ve_turk_tarihi_kirilmalar.md` 48-101; `curriculum.js` 417-424 |

**Olay seçme kuralı.** Ünite 2.3'teki olaylar, ESP tohum listesinde ve gemini-data kırılma tablosunda aynı yılla ya da aynı aralıkla geçenlerden seçildi; her dersin `not` alanında iki kaynağın satır numaraları var. Yalnız tabloda olan üç olay (Mete Han MÖ 209, Göktürk 552, Ridaniye 1517) açıkça «kırılma tablosuna göre» diye verildi. Kaynaklar arasında yılı farklı olanlar (İskender, Kara Veba, Osmanlı'nın başlangıcı, Sanayi Devrimi) iki yılıyla birlikte yazıldı. Bu ikinci koşuda dönem sınırları, yüzyıl kuralı, takvim bilgileri, tohum olay yılları ve tablo satırları kaynağa karşı yeniden okundu; dersteki bütün yüzyıl ve dönem cevapları `centuryOf`/`eraOf` kuralıyla elle sağlandı.

## Kaynaklar ve hatalar
Kaynaklardaki hatalar, çelişkiler ve şişirilmiş iddialar derse alınmadı; hepsi ilgili dersin `not` alanında da yazılı.

**Felsefe**
- `ESP/felsefe/mantik_safsatalar_…` satır 89: dağıtılmamış orta terim örneğinde («Tüm insanlar yüzer») öncülün kendisi de yanlış; biçim hatası ile içerik hatası karışıyor. Derste modelin örneği kullanıldı.
- Aynı dosya satır 60: Toulmin örneği («500 kullanıcının odak süresi günde 90 dk artmıştır») LifeOS hakkında uydurulmuş bir veri gibi duruyor; aynı dosyadaki «Daniel Dennett onaylı» etiketi (satır 74) bir tanıtım nitelemesi gibi duruyor (kaynak Rapoport kurallarını Dennett 2013 üzerinden anıyor, satır 7, 25). İkisi de alınmadı.
- Depo kaynakları `AYS/src/js/data/anlatim-ts.js` ve `derin-ts.js` (`ts-f8`) da model yazımıdır; tümdengelim/tümevarım/analoji ayrımı gemini-data'da ders biçiminde olmadığı için kullanıldı, doğrulanmamış sayılmalı.

**Dil**
- `ESP/dil/ingilizce_c1_c2_…` satır 103: Türkçe «Altay» ailesine konuyor; Altay dil ailesi tartışmalı bir sınıflamadır, alınmadı.
- `ESP/dil_ogrenimi/ikinci_yabanci_dil_…` 75-82: «ilk 1.000 kelime ailesi metnin %80-85'ini kapsar» sayısı derste «kaynağın sayısı, doğrulanmadı» diye işaretli kaldı.
- `ESP/src/js/data/kelimesiklik.js` altyazı sıklık listesi konuşma dilini yansıtıyor; ünlem, argo ve küfür de içeriyor. Liste olduğu gibi verilmedi, yalnız işlev sözcükleri ve sık fiiller seçildi.
- Tatoeba çevirileri (`kelimeornek.js`) alışkanlık bildiren geniş zamanı sık sık «-iyor» ile çeviriyor («Does Ken play tennis?» → «Ken tenis oynuyor mu?»). Bu hata sayılmadı; ders 2.3.3 onu ESP'nin A1 tuzağının kanıtı olarak kullanıyor.

**Tarih**
- Kadeş: dört kaynak dört yıl veriyor: `anadolu_uygarliklari_…` 40 MÖ 1258, `dunya_ve_turk_tarihi_kirilmalar.md` 53 MÖ ~1259, `anadolu_ve_mezopotamya_…` 35 MÖ 1280, `history.js` 126 MÖ 1274 (savaş ile antlaşmayı tek satırda birleştiriyor). Hangisinin doğru olduğu çözülmedi; ders yalnız ortak yüzyılı (MÖ 13.) öğretiyor ve çelişkiyi bir alıştırma konusu yapıyor. «Bilinen ilk yazılı barış antlaşması» nitelemesi (`history.js` 127 ve atlaslar) alınmadı.
- Osmanlı'nın başlangıcı: `history.js` 168 1299, kırılma tablosu 72 1302 (Bafeus); ayrı yüzyıllara düşüyor, iki yıl birlikte verildi.
- İskender: `history.js` 140 MÖ 331, tablo 56 MÖ 334-323. Kara Veba: `history.js` 170 1347, tablo 73 1347-1351; iki kaynağın «nüfusun üçte biri» oranı bir tahmin, alınmadı.
- Şişirilmiş ya da yorum yüklü nitelemeler alınmadı: tablodaki Mete Han «ilk organize Türk bozkır devleti» (57), Göktürk «Türk adının ilk kez…» (61), Karlofça «238 yıllık ricat» (80), Kurtuluş Savaşı «tarihin ilk başarılı milli kurtuluş savaşı» (94), satır sonlarındaki «Ders:» yorumları; `history.js`'te Karlofça «ilk büyük toprak kaybı» (191) ve İsrail satırının değerlendirmesi (230-231).
- Dönem sınırları (`history.js` 22-56) ESP'nin kendi seçimidir, kurum programı değildir; özellikle Yakın Çağ'ın 1945'te bitişi. Ders bunu kaynağın kendi «tartışmalıdır» notlarıyla birlikte veriyor; Türkiye'deki okul dönemlemesiyle karşılaştırılmadı (MEB tarih programı gemini-data'da yok).
- Model hatası (bu koşuda bulundu ve düzeltildi): kanıt işinin örnek cevabında MÖ 3200 için «MÖ 33. yüzyıl» yazılmıştı; doğrusu MÖ 32. yüzyıl.

## Eksikler
- **Felsefe:** içerik hattı §6.1 aşama 2'nin dördüncü maddesi «İlk primer metin» (merdivende «Primer metin okuma») yazılmadı. Bir primer metin dersi, metnin kendisi, çevirisi ve satır aralığı seçilmeden yazılamaz; sahibin seçimine bırakıldı. Kıyasın dört şekli yalnız adıyla anıldı, ayrıntısı sonraki aşamaya kaldı.
- **Dil:** içerik hattı §6.2 İngilizce A1 tablosunun yalnız bir kısmı (ders 2, 3, 4, 5, 7, 8) karşılandı. Alfabe ve harf adları, sayılar, saat ve günler için depoda ve gemini-data'da kaynak yok; bu dersler yazılmadı. İngilizce ses kaydı ve dinleme malzemesi yok; telaffuz dersi bu yüzden eksik ve bunu kendisi söylüyor. «we are» için Tatoeba örneği yok; «an» kuralı tek örnekten çıkarıldı (modelin çıkarımı, doğrulanmalı). İngilizce dışında hiçbir dil için A1 yazılmadı.
- **Tarih:** iskelet bir kurum programına değil ESP verisine (`history.js`) dayanıyor. «Kronoloji kurma» kartının dört konusundan «uzun süre ve kısa olay» ayrı ders olmadı (1. aşamadaki Braudel dersine bağlandı); eşzamanlılık tek örnekle (1517) işlendi. Avrupa dışı dönemlemeler yalnız uyarı olarak geçiyor. Kaynaklarda farklı geçen tarihler (Kadeş, Osmanlı'nın başlangıcı) çözülmedi. `veri/taslak/esp/tarih_kronoloji.jsonl` (elle yazılmış taslak veri) incelenmedi ve kullanılmadı.
- **Üçü için:** bütün kaynaklar `dogrulanmamis`; sahip incelemesi yapılmadı. Açık uçlu kanıt işleri (`acik`) puanlanmıyor, sahibin değerlendirmesine bağlı. Merdivenin süre ve sayı kapıları (ör. `history.events` 20, `history.minutes30` 180) şemada karşılığı olmadığı için aşamaya taşınmadı; şemanın ifade edemediği başka bir şey çıkmadı.

## Açık sorular
1. **Felsefe:** ilk primer metin hangisi olsun, hangi çeviriden ve hangi bölüm? Seçilince 2. aşamaya dördüncü ünite olarak eklenebilir.
2. **Dil:** İngilizce seçimi uygun mu? Alfabe, sayı, saat ve gün dersleri ile dinleme için hangi kaynak (ör. sahibin bir A1 ders kitabı ya da ses kayıtları) eklensin? Almanca da depoda A1 öğesi taşıyor; ikinci dil ne zaman ve hangisi?
3. **Dil:** «ilk 1.000 kelime ailesi %80-85» sayısı doğrulansın mı, yoksa dersten çıkarılsın mı?
4. **Tarih:** dönemleme ESP'nin kararında (`history.js`, Yakın Çağ 1789-1945) mı kalsın, yoksa MEB tarih programına mı uysun? MEB programı gemini-data'ya eklenecek mi?
5. **Tarih:** Kadeş (MÖ 1258 / ~1259 / 1274 / 1280) ve Osmanlı'nın başlangıcı (1299 / 1302) için hangi kaynak esas alınsın?
6. **Üçü için:** AYS `ts-*` anlatımları ve ESP veri dosyaları gibi depodaki model yazımı metinler kaynak sayılmaya devam etsin mi, yoksa her biri bir dış kaynakla doğrulanınca mı kullanılsın?
