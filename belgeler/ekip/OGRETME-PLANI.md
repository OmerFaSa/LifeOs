# Öğretme planı

Kullanıcı (2026-11-05): bilgiyi çok daha profesyonel ve hızlı kavratacak öğretme altyapısı; görsel, sesli ve notsal öğretim; AYS, SPİ, ESP.

Durum: **onaylandı ve kuruldu (2026-11-05).** Çekirdek `brand/ortak/kavrat.js` (`LIFEOS.KAVRAT`); `ogret.js` (teşhis, 1/3/7 tekrar) ve ESP'nin `anlat.js`'i (anlat-öğren) zaten vardı, ad çakışmasın diye «kavrat».

## Var olan (yeniden yapılmaz)

| Parça | Nerede | Ne yapıyor | Eksik |
|---|---|---|---|
| Konu anlatımı | AYS Öğren (`screens/ogren.js`, 184 konu); SPİ ve ESP «Anlatımlar» (`brand/ortak/rehber.js`, aynı biçim) | Bölüm, formül, örnek, dikkat, akılda kalsın | Anlatım bölümlerinde hiç şekil yok (şekiller yalnız AYS sorularında) |
| Şekil | `AYS/src/js/core/sekil.js` | Kapalı öğe kataloğundan SVG, `alt` cümlesi zorunlu | Yalnız AYS'de; tek kare, adım yok |
| Ses | AYS `core/voice.js`, SPİ ve ESP `core/speak.js` | Web Speech, cümlelere bölme, emniyet süresi, okunuş düzeltme | Yalnız ajan konuşmasında; anlatım dinlenemiyor |
| Kalıcılık | `brand/ortak/usta.js` | Kanıttan aşama, vade, karışık sıra | Anlatımın kendi kartı yok |
| Kart ve tekrar | AYS Öğren (notu karta çevir, tekrar destesi), ESP dil SRS | | SPİ ve ESP anlatımında kart yok |

## Ne kurulur

**Tek parça:** `brand/ortak/kavrat.js` (`LIFEOS.KAVRAT`) + `kavrat.css`, `brand/parcalar.txt`'e birer satır, yazılar `PARCA.yazilar` ile. Modüller yalnız içerik verir; çekirdek ne SPİ'yi ne ESP'yi bilir.

1. **Adım adım çizim (görsel).** Bölüm `cizim:{ w, h, alt, adimlar:[{ o:[öğe…], not }] }` yazar. Önce ilk adım çizilir; «Sonraki adım» eskileri ince bırakıp yenileri vurgulu ekler, adımın tek cümlesi altta. Her adımın `aria-label`'ı o adımı söyler. Öğeler `sekil.js` kataloğundan: bu yüzden `sekil.js` `brand/ortak/`'a taşınır (AYS'de `R.Sekil` adı kalır, davranış değişmez). Süs, gölge, geçiş yok (§1.10).
2. **Dinle (sesli).** Bölümün metni modülün kendi ses katmanıyla okunur; çekirdek sesi bilmez, modül `ses(metin)` verir. İşaretler okunuşa çevrilir (`a^{2}` → «a kare»). API yoksa ya da Türkçe ses yoksa düğme çıkmaz, metin aynen kalır.
3. **Kartlar ve aralıklı tekrar (notsal).** Konu `kartlar:[{ on, arka }]` (3–6) yazar. Kart önce sorulur, çevirmeden önce hatırlanır (geri getirme); «Bildim / Bilemedim» `USTA` kanıtıdır. Vadesi gelen kartlar `USTA.sira` ile karışık gelir. Konunun üstünde tik sayacı (`GRAFIK.tikHtml`): kaç kart kalıcı. **Dinleyerek tekrar:** kartın önü okunur, kısa ara, arkası okunur; cevap yine iki düğmeyle.

Kanıtlar modülün deposunda (`<modul>.kavrat.kanit`, `OGRET.depo` ile), hiçbir ölçüme ve XP'ye yazılmaz (§1.6).

## Örnek bölümler

| Modül | Konu | Çizim | Kart |
|---|---|---|---|
| AYS | `tm-29` Dik üçgen | Öklid: üçgen → yükseklik → p ve k parçaları (3 adım); Pisagor kareleri | 5 |
| SPİ | `kosu` Koşuya başlamak | Koş-yürü seansı zaman çizgisi: ısınma → aralıklar → soğuma (anlatımdaki örnek, kişiye reçete değil) | 4 |
| ESP | `mantik-arguman` Argüman | Argüman haritası: öncüller → sonuç → itiraz (USTA-PLANI'ndaki «tezi harita olarak çiz» boşluğu) | 5 |

AYS'de yer: Öğren anlatım kartı. SPİ ve ESP'de: `rehber.js` bölüm çizerken `cizim` ve `kartlar` varsa çekirdeği çağırır; bir kez bağlanınca iki modül de alır.

## Sınırlar

- Sayıyı ve aşamayı kod üretir (`USTA`); model hiçbir yerde yok (§1.1).
- SPİ çizimi anlatımdaki örneği gösterir; teşhis ve doz yok, sınır notu yerinde kalır (§1.5). Aşama kayda söylenir, kişiye değil.
- İçerik elle yazılır, «doğrulanmadı» der; ÖSYM metni yok.
- Ses yalnız tarayıcının kendi Web Speech API'si; bağımlılık yok (§1.3).

## Testler

`brand/ortak/kavrat.test.js`: adım kesme, tarif denetimi (bilinmeyen öğe, eksik `alt`/`not`), okunuş çevirisi, kart cevabı → `USTA` kanıtı, ses yokken düğmesiz çizim. AYS `sekil.test.js` taşımadan sonra aynen geçer. Üç örneğin içeriği denetimden geçer (AYS `anlatim.test.js`, SPİ/ESP `rehber_*.test.js`). Sonra üç modülde `runtests`, `smoke`, `layoutcheck`, `a11ycheck`; kökte `node tools/entegre.js`.

## Sonra (bu işin dışında)

Öteki 183 AYS konusuna ve bütün anlatımlara çizim ve kart yazmak içerik işidir; ofise (Antigravity) parça parça verilebilir.

## Faz 2: tek deneyim (2026-11-06, onaylandı ve kuruldu)

Kurulan: `ogrenmotor.js` (planIlk/planTutuyor/planDerin, seviyeKaydir, ipuclari, kartlarOf, görev denetimi, kodlamaAra), `ogrenmotor-ekran.js` (sezgi, ipucu merdiveni, kodlama, görevler, kart, Derinleş), `HKM/core/kodlama.py` + `/api/kodlama`, kavrat kartları motorda (eski kayıt bir kez taşınır), anlatım sayfalarında birincil «Adım adım öğren». Örnek içerik: AYS `tm-29` (sezgi, kodlama, öncüllü ÖSYM sorusu), SPİ `kosu` (sezgi, kodlama, mekanizma sıralaması, efsane), ESP `mantik-arguman` (argüman haritası), `tarih-yontem` (kaynak sorgulama, kronoloji), `dil-kelime` (dikte).

Doğrulanmayan: internetten kodlama yalnız sahte ağla sınandı, gerçek web'de denenmedi; tempo sayıları (TYT 75, AYT 120 sn) Öğren'in var olan sistem ayarıdır, ÖSYM kılavuzundan bu turda yeniden okunmadı; telefonda açılmadı.

Kullanıcı: öğrenme altyapısı, her şeyi çok kolay kavrayıp anlayacağı hale gelsin; iki yüzey değil tek deneyim.

**Bugün iki yol var:** Anlatım sayfaları (AYS Öğren › Anlatım, SPİ/ESP Anlatımlar; kavrat çizimi ve kartları burada) ve Öğrenme motoru (`ogrenmotor*.js`; çizimi kullanıyor, kartları kullanmıyor). Motorun ilk seansı yeni biri için uzun: ön tahmin, iki parçada bir «kendi cümlenle», üç soru, yanlışta hata türü seçtirme, anlatma, aktarım, niyet.

**Tek giriş:** öğrenmek = Öğrenme motoru. Anlatım sayfası okuma için kalır; başında tek birincil düğme «Adım adım öğren» konuyu motorda açar. Kavrat kartları motorun bir adımı olur.

**İlk seans (konu «veri yok» ya da «öğreniyor»), altı adım:**

| # | Adım | Ne görür | Kaynak |
|---|---|---|---|
| 1 | Sezgi | Tek cümle benzetme + tek görsel | Yeni içerik alanı `sezgi:{ metin, cizim? }`; yoksa giriş cümlesi ve konunun ilk çizimi |
| 2 | Anlatım | Parça parça; çizimli parça adım adım; her parçada Dinle | Var (motor + kavrat) |
| 3 | Çözülmüş örnek | Çözüm adım adım açılır | Var |
| 4 | Kendin dene | 2 soru, anında doğru/yanlış. Yanlışta önce ipucu ve bir hak daha (yanlış şık kapanır); ikinci yanlışta çözüm. Benzer soru araya bir adım girince gelir | Var; değişen: ipucu yoksa kod ilgili parçanın cümlesini gösterir (uydurmaz), hata türü seçtirmek ilk seansta yok |
| 5 | Kartlar | 3–5 kart, önce hatırla sonra çevir | Konunun `kartlar`ı; yoksa «akılda kalsın» cümlelerinden yazarın kalın terimi boşluk olur; o da yoksa adım yok |
| 6 | Bitti | Doğru sayısı ve sonraki tekrar günü | Var |

Ön tahmin, «kendi cümlenle», başkasına anlat, aktarım ve niyet ilk seanstan çıkar; tekrar seanslarına ve «Derinleş» düğmesine geçer.

**Zorluk kişinin bildiğine göre (karar kodda, `USTA` aşaması):**

| Aşama | Seans |
|---|---|
| Veri yok, öğreniyor | Altı adım, temel sorular |
| Tutuyor | Sezgi ve anlatım yok: aklında kalanı yaz → orta sorular → vadesi gelen kartlar |
| Kalıcı, sağlam | İleri soru + aktarım (bugünkü tekrar) |

Seans içinde: art arda iki doğru bir üst seviyeden, yanlış bir alt seviyeden sorar (yalnız yazarın `seviye` etiketi; soru uydurulmaz). İpuçlu ya da ikinci denemedeki doğru aşama kazandırmaz; ilk cevap kanıttır.

**Alan yöntemleri (kullanıcı, 2026-11-06: «ÖSYM'de ÖSYM tarzı, sınava gireceğim kurumun tarzında; ESP'de felsefe, tarih, dil için doğrulanmış metodlar; SPİ'de sağlığı akla mantığa kavratan altyapı»).** Akış aynı kalır; 4. adım «Kendin dene» alanın kendi görevini de getirir. Görevler kapalı bir katalogdur, içerik yazarı hangisini kullanacağını yazar, cevabı kod denetler:

| Görev | Ne yapar | Nerede | Dayanak (güç) |
|---|---|---|---|
| `sirala` | Parçaları doğru sıraya ya da yerine koy; yanlış yer işaretlenir | Felsefe: argüman haritası (öncül → sonuç → itiraz). Tarih: kronoloji. SPİ: mekanizma zinciri (neden → nasıl → ne olur) | Argüman haritalama eleştirel düşünmede ~0,8 SD (Twardy; USTA-PLANI, orta); «neden?» diye sorgulama (Dunlosky 2013, orta) |
| `kaynak` | Bir belgeye üç soru: kim yazdı, ne zaman, neden; iki kaynağı karşılaştır | Tarih | Kaynak sorgulama ve yakın okuma (Reisman 2012; rastgele atamalı değil, orta) |
| `dikte` | Tarayıcı sesi okur, kişi yazar; kod harf harf karşılaştırır | Dil | USTA-PLANI boşluk 7; ses eğitimi meta-analizi (Uchihara 2025, orta) |
| `efsane` | Yaygın bir yanlış inanç: doğru mu? Sonra neden yanlış olduğu | SPİ (ör. «%10 kuralı kesin bilimsel sınırdır»: anlatım bunun temkin kuralı olduğunu söylüyor) | Çürütme metni; bellekten, kaynak açılmadı |
| `sinav` | Kurumun biçimi: şık sayısı, öncüllü (I-II-III) ve olumsuz kök kalıbı, soru başına süre | AYS | YKS biçimi ÖSYM kılavuzundan; başka kurum (KPSS, ALES, YDS…) yalnız kaynağı olan profille gelir, yoksa «doğrulanmadı» |

AYS'de kurum: sınav profili (`sinavprofil.js`) hangi kurumsa «Kendin dene» onun biçiminde sorar ve süreyi o kurumun soru başı ortalamasıyla gösterir (tempo rozeti zaten var). Yerleşik olan yalnız YKS (ÖSYM). Soru metni ÖSYM'den kopyalanmaz; biçim taklit edilir, içerik yazarındır. Başka kurumun biçimi uydurulmaz.

SPİ'de «akla mantığa»: her konu bir mekanizma zinciriyle anlatılır (ör. yükü hızlı artırmak → tendon kastan yavaş uyum sağlar → aşırı yük → ağrı), kişi zinciri kendisi kurar; bir efsane çürütülür. Kişinin kendi kaydı örnek olarak kullanılmaz (teşhise kayar). Sayı yalnız içerikte varsa çizilir.

Örnek görevler: AYS `tm-29` (öncüllü ÖSYM kalıbı + tempo), ESP `mantik-arguman` (`sirala`: argüman haritası), ESP `tarih-yontem` (`kaynak`), ESP dil konusu (`dikte`), SPİ `kosu` (`sirala` mekanizma + `efsane`).

**Cevabı vermeden düşündürmek (kullanıcı, 2026-11-06: «internetten bu konularla alakalı mantıklı kodlamaları bulsun, ipucu versin, cevabı direkt vermesin, düşündürsün»).** «Kendin dene»de yanlış ya da «Bilmiyorum»dan sonra cevap gelmez; kademeli ipucu merdiveni gelir. Her basamaktan sonra kişi yeniden dener:

| Basamak | Ne gösterir | Kaynak |
|---|---|---|
| 1. Yönlendiren soru | «Soru kökü ne istiyor?», «Hangi kural burada geçerli?» | `OGRET.sokratik`, teşhis türüne göre; kod kurar |
| 2. Kodlama | Konunun hafıza kodlaması (kısaltma, kafiye, şifre) | Sırayla: içerik yazarının `kodlama`sı, kişinin kendi kodlaması, internetten bulunmuş ve kişinin onayladığı kodlama |
| 3. Anlatımdan cümle | İlgili parçanın cümlesi | `ilgiliParca`, var |
| 4. Eleme | Bir yanlış şık kapanır | Kod |
| 5. Çözüm | Adım adım açılır; her adımda «sıradakini sen bul» | Var (örnek adımı gibi) |

İlk cevap kanıttır; ipucuyla gelen doğru aşama kazandırmaz. Kaçıncı basamakta çözdüğü kaydedilir: puan değil, sıradaki ipucunun nereden başlayacağını kod seçer.

İnternetten kodlama: «Kodlama bul» düğmesi HKM açıkken çıkar. BAM hızlı araştırması (`HKM/core/arastir.py`, yeni profil kipi `kodlama`) web'de arar; her aday kaynak adresiyle gelir. Kod üç şeye bakar: kaynakta geçiyor mu, konunun terimlerinden birini taşıyor mu, açık sorunun cevabını açıkça içeriyor mu (içeriyorsa ipucu olarak gösterilmez). Ekranda «internetten · doğrulanmadı · kaynak» yazar; kişi «Kodlamalarıma ekle» demeden kaydedilmez (§1.4). HKM kapalıysa düğme yok; içerik ve kendi kodlaması yine çalışır.

Kendi kodlaman: konunun sonunda «Kendi kodlamanı yaz». Üretmek hazır kodlamayı okumaktan iyi hatırlatır (üretim etkisi; bellekten, kaynak açılmadı).

Dürüst sınır: hafıza kodlamaları (anahtar kelime yöntemi) Dunlosky 2013'te «düşük yarar» aldı: kısa listelerde ve kelimede işe yarar, kalıcılığı geri getirme kadar taşımaz. Bu yüzden kodlama ana yol değil, ipucu basamağıdır; kalıcılık yine aralıklı tekrar ve sınamayla ölçülür.

**Model:** değişmez. Yalnız «Anlamadım › başka türlü anlat» cümlesi; sayıya, sıraya, soruya dokunmaz.

**Kapsam:** üç örnek konuya (AYS `tm-29`, SPİ `kosu`, ESP `mantik-arguman`) `sezgi` yazılır; öteki konular sezgi yerine giriş cümlesiyle aynı akıştan geçer. SPİ'de teşhis ve doz yok, sınır notu her adımda.

**Testler:** `ogrenmotor.test.js`: ilk seans altı adım ve sırası, aşamaya göre plan, beş görevin kod denetimi (sıralama, dikte karşılaştırması, kurum biçimi), ipucu merdiveni (cevap erken gösterilmez, ipuçlu doğru aşama kazandırmaz), kodlama denetimi (kaynaksız ya da cevabı veren aday elenir); HKM `tests`: kodlama kipi sahte web ile, ipucu + ikinci hak (ilk cevap kanıt), seviye iniş-çıkışı, kart adımı ve kalın terimden kart, sezgi denetimi. Sonra üç modülde runtests, smoke, layoutcheck, a11ycheck, perfcheck; `node tools/entegre.js`.
