/* ÇEKİRDEK KONU ÖZETLERİ — her AYS konusunun uygulamanın İÇİNDE duran kısa özeti.

   Kullanıcı (2026-10-09): «kullanıcının o konu ile alakalı her şeyi
   uygulamanın içinde öğrenmesini istiyorum» → «Her konuya çevrimdışı
   çekirdek özet». Model kapalıyken, HKM yokken, internetsizken de okunur.

   KAYNAK VE DOĞRULUK
   Bu özetleri LifeOS'un geliştirme oturumu (Claude) elle yazdı. Kapsam,
   MEB ortaöğretim öğretim programlarının ve YKS'nin konu başlıklarıdır
   (R.SUBJECTS). Metin bir kitaptan alıntı DEĞİLDİR ve hiçbir kaynakla
   satır satır doğrulanmadı: ekranda «elle yazıldı · doğrulanmadı» yazar.
   Örneklerdeki sayılar yazılırken elle hesaplandı. Derin ve kaynaklı
   anlatım için konu ekranında «Bu konuyu öğren» (BAM) vardır. Bir hata
   bulunursa YALNIZ burada düzeltilir; başka hiçbir yer bu metni kopyalamaz.

   BİÇİM: R.KONU_OZET[konuKimliği] = {
     ana:    3–5 madde, konunun özü (kural, tanım, formül),
     dikkat: en sık yapılan hata,
     ornek:  kısa, sayıları kontrol edilmiş bir örnek (isteğe bağlı) }
   Biçimi tests/ozetler.test.js sınar. Özetler ders ders gelir; hangi
   derslerin tamamlandığını test listesi söyler.

   BİR ŞEY BİLEREK YAPILMADI: hiçbir özete «bu konudan kaç soru çıkar» ya
   da «kaç günde biter» yazılmadı; frekans R.SUBJECTS'te, süre plandadır. */

window.R = window.R || {};

R.KONU_OZET = {

  /* ================= TYT TEMEL MATEMATİK ================= */
  'tm-01': {
    ana:['Rakam 0–9 arası on semboldür; sayı rakamlarla yazılır. Doğal sayılar 0’dan, sayma sayıları 1’den başlar; tam sayılar negatifleri de içerir.',
      'Tek–çift: çift ± çift = çift, tek ± tek = çift, tek ± çift = tek. Çarpımda bir çarpan çiftse sonuç çifttir.',
      'Asal sayı yalnız 1’e ve kendisine bölünen, 1’den büyük doğal sayıdır. En küçük asal 2’dir ve tek çift asaldır; 1 asal değildir.',
      'Ardışık sayıların toplamı (ilk + son) · terim sayısı / 2; terim sayısı (son − ilk) / artış + 1.'],
    dikkat:'«Pozitif tam sayı» 0’ı içermez, «doğal sayı» içerir. Soru kökündeki küme adı sonucu değiştirir.',
    ornek:'5’ten 41’e kadar tek sayılar: terim sayısı (41 − 5)/2 + 1 = 19, toplam (5 + 41) · 19 / 2 = 437.' },
  'tm-02': {
    ana:['abc üç basamaklı sayısı 100a + 10b + c’dir ve a ≠ 0. Basamak değeri, rakamın bulunduğu basamakla çarpımıdır.',
      'ab + ba = 11(a + b), ab − ba = 9(a − b): iki basamaklı sayı ters çevrilince fark 9’un katıdır.',
      '«En büyük / en küçük» sorularında en yüksek basamağa en uygun rakam önce yerleştirilir; «rakamları farklı» şartı ayrıca kontrol edilir.',
      'n! = 1 · 2 · … · n ve 0! = 1. n!’in sonundaki sıfır sayısı, içindeki 5 çarpanlarının sayısı olan ⌊n/5⌋ + ⌊n/25⌋ + … toplamıdır.'],
    dikkat:'İlk basamak 0 olamaz; «pozitif» ve «rakamları farklı» kelimeleri seçenekleri daraltır.',
    ornek:'ab − ba = 45 ise 9(a − b) = 45, a − b = 5; en büyük ab = 94.' },
  'tm-03': {
    ana:['Bölme: bölünen = bölen · bölüm + kalan ve 0 ≤ kalan < bölen.',
      '2: son rakam çift; 5: son rakam 0 ya da 5; 4: son iki basamak 4’e; 8: son üç basamak 8’e bölünür.',
      '3 ve 9: rakamlar toplamı 3’e (9’a) bölünür. Kalan da rakamlar toplamının kalanıdır.',
      '11: sağdan başlayıp rakamlar +, −, +, … işaretiyle toplanır; sonuç 11’in katıysa bölünür. Bileşik bölen aralarında asal çarpanlara ayrılır (12 = 3 · 4).'],
    dikkat:'12’ye bölünebilme için 2 ve 6 değil, aralarında asal 3 ve 4 birlikte aranır.',
    ornek:'4a72 sayısı 9’a bölünüyorsa 4 + a + 7 + 2 = 13 + a, 9’un katı olmalı: a = 5.' },
  'tm-04': {
    ana:['EBOB sayıları birlikte bölen en büyük sayı, EKOK sayıların hepsinin katı olan en küçük pozitif sayıdır.',
      'Asal çarpanlara ayırınca EBOB ortak çarpanların en küçük üslüleri, EKOK bütün çarpanların en büyük üslüleri çarpımıdır.',
      'İki sayı için a · b = EBOB(a, b) · EKOK(a, b). Aralarında asal sayıların EBOB’u 1’dir.',
      '«En büyük eş parça / en az kaç parça» soruları EBOB, «yeniden birlikte / en az kaç gün sonra» soruları EKOK ister.'],
    dikkat:'4, 6 ve 9’a bölününce kalanlar 3, 5 ve 8 ise (hep bir eksik) en küçük sayı EKOK − 1 = 36 − 1 = 35’tir.',
    ornek:'84 × 60 cm’lik dikdörtgen en büyük eş karelere bölünürse kare kenarı EBOB(84, 60) = 12 cm, kare sayısı 7 · 5 = 35.' },
  'tm-05': {
    ana:['a/b (b ≠ 0) biçiminde yazılan sayılar rasyoneldir; devirli ondalık açılımlar da rasyoneldir.',
      'Toplama ve çıkarmada paydalar eşitlenir; çarpmada pay paya, payda paydaya; bölmede ikinci kesir ters çevrilip çarpılır.',
      'Devirli sayı = (sayının tamamı − devretmeyen kısım) / (devreden basamak kadar 9, devretmeyen ondalık kadar 0). 0,1(6) = (16 − 1)/90 = 1/6.',
      'Pozitif kesirlerde paylar eşitse paydası küçük olan büyüktür; paydalar eşitse payı büyük olan büyüktür.'],
    dikkat:'0,(9) = 1’dir. Devirli sayıyı kesre çevirirken tam kısım da «sayının tamamı»na katılır.',
    ornek:'1,2(3) = (123 − 12)/90 = 111/90 = 37/30.' },
  'tm-06': {
    ana:['Eşitsizliğin iki yanına aynı sayı eklenip çıkarılabilir; yön değişmez.',
      'Negatif bir sayıyla çarpılır ya da bölünürse eşitsizlik yön değiştirir.',
      'a < x < b açık, a ≤ x ≤ b kapalı aralıktır; tam sayı çözümler sayılırken uçların dahil olup olmadığına bakılır.',
      'İki aralıktan x − y ya da x · y istenirse uç değerlerin bütün birleşimleri denenir; en küçüğü ve en büyüğü seçilir.'],
    dikkat:'−3 < x < 2 ise 0 ≤ x² < 9’dur: uçların karesini almak yetmez, aralık 0’ı içerir.',
    ornek:'2 < x < 5 ve −1 < y < 3 ise en küçük x − y: 2 − 3 = −1, en büyük 5 − (−1) = 6 → −1 < x − y < 6.' },
  'tm-07': {
    ana:['|x| sayının sıfıra uzaklığıdır ve negatif olamaz: x ≥ 0 ise |x| = x, x < 0 ise |x| = −x.',
      '|x − a| = b (b ≥ 0) ise x − a = b ya da x − a = −b; b < 0 ise çözüm yoktur.',
      '|x − a| < b ⇔ a − b < x < a + b; |x − a| > b ⇔ x < a − b ya da x > a + b.',
      '|a · b| = |a| · |b| ve |a + b| ≤ |a| + |b|. Birden çok mutlak değer, köklerine göre aralıklara bölünerek açılır.'],
    dikkat:'|x − 3| = x − 3 ise x − 3 ≥ 0, yani x ≥ 3’tür; eşitliğin sağı negatif olamaz.',
    ornek:'|2x − 1| < 5 → −5 < 2x − 1 < 5 → −2 < x < 3; tam sayı çözümler −1, 0, 1, 2 (4 tane).' },
  'tm-08': {
    ana:['aⁿ, a’nın n kez çarpımıdır; a⁰ = 1 (a ≠ 0) ve a⁻ⁿ = 1/aⁿ.',
      'Tabanlar aynıysa çarpmada üsler toplanır, bölmede çıkarılır; (aᵐ)ⁿ = aᵐⁿ.',
      'Negatif tabanın çift kuvveti pozitif, tek kuvveti negatiftir: −2⁴ = −16 ama (−2)⁴ = 16.',
      'Üslü denklemde tabanlar eşitlenir, sonra üsler: 2ˣ = 32 ⇒ x = 5. Sıralamada tabanlar ya da üsler ortak yapılır.'],
    dikkat:'Toplamada üsler toplanmaz; ortak çarpan parantezine alınır: 3ˣ⁺¹ + 3ˣ = 4 · 3ˣ.',
    ornek:'2³⁰, 3²⁰, 5¹⁰: üsleri 10 yap → 8¹⁰, 9¹⁰, 5¹⁰ → 5¹⁰ < 2³⁰ < 3²⁰.' },
  'tm-09': {
    ana:['ⁿ√a = a^(1/n). Çift dereceli kökün içi negatif olamaz; tek dereceli kök her gerçek sayı için tanımlıdır.',
      '√(a²) = |a|. Kök dışına çıkarma: √50 = √(25 · 2) = 5√2.',
      'Toplama ve çıkarma yalnız kök içleri aynıysa yapılır (2√3 + 5√3 = 7√3); çarpma ve bölmede kök içleri birleşir.',
      'Paydayı kökten kurtarmak için eşleniğiyle çarpılır: (√a − √b)(√a + √b) = a − b.'],
    dikkat:'√(a + b) ≠ √a + √b: √9 + √16 = 7 ama √25 = 5.',
    ornek:'1/(√5 − √3) = (√5 + √3)/(5 − 3) = (√5 + √3)/2.' },
  'tm-10': {
    ana:['Ortak çarpan parantezi: ab + ac = a(b + c); gerekirse terimler gruplandırılır.',
      'İki kare farkı a² − b² = (a − b)(a + b); tam kare a² ± 2ab + b² = (a ± b)².',
      'Küpler: a³ − b³ = (a − b)(a² + ab + b²), a³ + b³ = (a + b)(a² − ab + b²).',
      'x² + bx + c için çarpımı c, toplamı b olan iki sayı bulunur: x² + 5x + 6 = (x + 2)(x + 3).'],
    dikkat:'Sadeleştirmede çarpan sadeleşir, terim sadeleşmez: (x² − 9)/(x − 3) = x + 3 (x ≠ 3).',
    ornek:'x − 1/x = 3 ise x² + 1/x² = 3² + 2 = 11.' },
  'tm-11': {
    ana:['Oran aynı birimli iki çokluğun bölümüdür. a/b = c/d orantısında içler çarpımı dışlar çarpımına eşittir: ad = bc.',
      'Doğru orantıda biri artınca öteki aynı oranda artar (y = kx); ters orantıda çarpımları sabittir (x · y = k).',
      'a/b = c/d = k ise (a + c)/(b + d) = k; sayılar 2k, 3k, 5k diye yazılır.',
      'Zincir oranlarda ortak terim eşitlenir: a/b = 2/3 ve b/c = 4/5 ise a : b : c = 8 : 12 : 15.'],
    dikkat:'İşçi sayısı ile iş süresi ters, işçi sayısı ile yapılan iş doğru orantılıdır.',
    ornek:'x ile y ters orantılı, x = 6 iken y = 4 ise x = 8 için y = 24/8 = 3.' },
  'tm-12': {
    ana:['Birinci dereceden denklemde bilinmeyen bir yanda toplanır; eşitliğin iki yanına aynı işlem yapılır.',
      'Kesirli denklemde paydaların EKOK’u ile çarpılır; paydayı sıfır yapan değer çözüm olamaz.',
      'İki bilinmeyenli sistemde yok etme (taraf tarafa toplama) ya da yerine koyma kullanılır.',
      'ax + b = 0: a ≠ 0 ise tek çözüm; a = 0 ve b = 0 ise sonsuz çözüm; a = 0 ve b ≠ 0 ise çözüm yok.'],
    dikkat:'Denklemi bir ifadeye bölmeden önce o ifadenin sıfır olup olamayacağına bakılır; sıfırsa bir çözüm kaybolur.',
    ornek:'x + y = 10 ve x − y = 4 taraf tarafa toplanır: 2x = 14, x = 7, y = 3.' },
  'tm-13': {
    ana:['Bilinmeyene x denir ve cümle sırayla denkleme çevrilir: «bir sayının 3 katının 5 eksiği» = 3x − 5.',
      'Kesir problemlerinde bütün, paydaların EKOK’u kadar parça alınır: 1/3 ve 1/4 geçiyorsa 12k seçmek işi kolaylaştırır.',
      '«Kalanın» kesri sorulursa her adımda yeni bütün, o ana kadar kalandır.',
      'Ardışık sayılar x, x + 1, x + 2; ardışık çift ya da tek sayılar x, x + 2, x + 4 diye yazılır.'],
    dikkat:'«Kalanın yarısı» ile «tamamının yarısı» farklıdır; her adımda neyin bütün olduğunu yaz.',
    ornek:'Parasının 1/3’ünü, sonra kalanın 1/4’ünü harcayan kişide 60 TL kaldı: x · 2/3 · 3/4 = x/2 = 60, x = 120 TL.' },
  'tm-14': {
    ana:['İki kişinin yaş farkı hiç değişmez; t yıl sonra herkesin yaşı t artar.',
      'n kişinin yaşları toplamı t yıl sonra n · t artar, t yıl önce n · t azalır.',
      '«Ben senin yaşındayken» sorularında yaş farkı kadar geriye ya da ileriye gidilir; şimdi / önce / sonra tablosu işi kolaylaştırır.',
      'Oranlı yaşlarda yaşlar 2k, 3k gibi alınır; yıllar geçince oran değişir, fark değişmez.'],
    dikkat:'Geçmişe giderken kişinin o tarihte doğmuş olup olmadığı kontrol edilir; yaş negatif yazılmaz.',
    ornek:'Anne 40, kızı 12 yaşında. Anne kaç yıl sonra kızının 2 katı olur? 40 + t = 2(12 + t) → t = 16.' },
  'tm-15': {
    ana:['x’in %a’sı x · a/100’dür. %a artış (1 + a/100) ile, %a azalış (1 − a/100) ile çarpmaktır.',
      'Ardışık yüzdeler çarpılır, toplanmaz: %20 artış ardından %20 indirim 1,2 · 0,8 = 0,96, yani %4 azalmadır.',
      'Kâr ve zarar yüzdesi aksi söylenmedikçe alış (maliyet) fiyatı üzerindendir: satış = alış · (1 ± oran).',
      'Maliyeti 100 almak hesabı kolaylaştırır; sonuç oranla gerçek fiyata çevrilir.'],
    dikkat:'İndirim etiket fiyatından, kâr maliyetten hesaplanır; ikisi aynı tabana konmaz.',
    ornek:'%25 kârla 150 TL’ye satılan malın maliyeti: x · 1,25 = 150 → x = 120 TL.' },
  'tm-16': {
    ana:['Saf madde miktarı = karışım miktarı · yüzde / 100.',
      'Karışımlar birleşince saf maddeler ve toplam miktarlar ayrı ayrı toplanır; yeni yüzde = toplam saf madde / toplam karışım · 100.',
      'Su eklenince saf madde değişmez, toplam artar; su buharlaşınca saf madde değişmez, toplam azalır.',
      'İstenen yüzdeyi elde etmek için ağırlıklı ortalama kurulur: a · p + b · q = (a + b) · r.'],
    dikkat:'Yüzdeler doğrudan toplanmaz ya da ortalanmaz; önce miktarlarla çarpılır.',
    ornek:'%20 tuzlu 40 g su ile %50 tuzlu 20 g su karışırsa: (8 + 10)/60 = %30 tuzlu.' },
  'tm-17': {
    ana:['Bir işi t saatte bitiren kişi 1 saatte işin 1/t’sini yapar.',
      'Birlikte çalışmada birim zamandaki işler toplanır: 1/a + 1/b = 1/t.',
      'Havuzda dolduran musluk +, boşaltan musluk − alınır: 1/a − 1/b = 1/t.',
      'Bir süre birlikte, sonra tek başına çalışılıyorsa yapılan iş parçalarının toplamı 1 (bütün iş) olur.'],
    dikkat:'Süreler değil, birim zamandaki işler toplanır: 3 ve 6 saatlik iki işçi birlikte 9 değil 2 saatte bitirir.',
    ornek:'A işi 6, B 12 günde bitiriyor. Birlikte: 1/6 + 1/12 = 3/12 = 1/4 → 4 gün.' },
  'tm-18': {
    ana:['Yol = hız · zaman. Birimler uyumlu olmalıdır: km/sa ile dakika karıştırılmaz.',
      'Karşılıklı harekette hızlar toplanır; aynı yönde (yetişmede) hızlar çıkarılır.',
      'Ortalama hız = toplam yol / toplam zaman; hızların ortalaması değildir.',
      'Akıntı yönünde hız v + a, akıntıya karşı v − a’dır. Dairesel pistte karşılaşmada bir çevre, yetişmede bir çevre fark kat edilir.'],
    dikkat:'Gidiş 60, dönüş 40 km/sa ise ortalama hız 50 değil 2 · 60 · 40/(60 + 40) = 48 km/sa’tir.',
    ornek:'Aralarında 300 km olan iki araç 70 ve 80 km/sa ile birbirine doğru giderse 300/150 = 2 saatte karşılaşır.' },
  'tm-19': {
    ana:['Önce eksenlerin ve birimlerin ne olduğu okunur; hataların çoğu ölçeği yanlış okumaktan çıkar.',
      'Sütun grafiğinde değerler karşılaştırılır; daire grafiğinde dilim açısı = yüzde · 360°/100.',
      'Çizgi grafiğinde daha dik çizgi daha hızlı değişim demektir.',
      'Yüzde değişim = (yeni − eski)/eski · 100. İki grafik birlikte verilmişse ortak değişken eşleştirilir.'],
    dikkat:'Daire grafiğinde yüzdeler toplamı 100, açılar toplamı 360°’dir; birinden ötekine geçerken oran korunur.',
    ornek:'%15’lik dilimin açısı 15 · 360/100 = 54°.' },
  'tm-20': {
    ana:['Önce verilenler ve istenen tek tek yazılır; tablo, şekil ya da küçük bir örnekle durum somutlaştırılır.',
      'Örüntü sorularında ilk birkaç terim yazılıp kural aranır: artış, çarpım ya da döngü.',
      '«En az kaç tane kesin» sorularında en kötü durum düşünülür: garanti için bütün kötü durumlar tükenmelidir.',
      'Seçenekleri yerine koymak meşru bir yoldur; tutarlılığı en hızlı bu sınar.'],
    dikkat:'Döngüsel örüntüde kalan belirleyicidir: 7 günlük döngüde 100. gün, 100’ün 7’ye bölümünden kalan 2’ye göre bulunur.',
    ornek:'Torbada 5 kırmızı, 4 mavi top var. Kesin 2 aynı renk için en az 3 top çekilir: iki farklı renkten sonra üçüncü top eşleşir.' },
  'tm-21': {
    ana:['n elemanlı kümenin alt küme sayısı 2ⁿ, öz alt küme sayısı 2ⁿ − 1’dir.',
      's(A ∪ B) = s(A) + s(B) − s(A ∩ B).',
      'A \\ B, A’da olup B’de olmayanlardır; A′ (tümleyen) evrensel kümede olup A’da olmayanlardır.',
      'De Morgan: (A ∪ B)′ = A′ ∩ B′ ve (A ∩ B)′ = A′ ∪ B′.'],
    dikkat:'«En az biri» birleşim, «ikisi de» kesişim, «yalnız biri» birleşimden kesişimin çıkarılmasıdır; Venn şeması çiz.',
    ornek:'18 kişi İngilizce, 12 kişi Almanca, 5 kişi ikisini birden biliyorsa en az birini bilen 18 + 12 − 5 = 25.' },
  'tm-22': {
    ana:['Önerme doğru (1) ya da yanlış (0) olan hüküm cümlesidir; değili p′ doğruluk değerini tersine çevirir.',
      'p ∧ q yalnız ikisi de doğruysa doğru; p ∨ q yalnız ikisi de yanlışsa yanlıştır.',
      'p ⇒ q yalnız p doğru ve q yanlışken yanlıştır; p ⇔ q iki yan aynı değerdeyse doğrudur.',
      '(p ⇒ q) ≡ (p′ ∨ q) ≡ (q′ ⇒ p′); (p ∧ q)′ ≡ p′ ∨ q′. «Her» niceleyicisinin değili «bazı … değil»dir.'],
    dikkat:'p ⇒ q ile q ⇒ p denk değildir; denk olan karşıt tersidir (q′ ⇒ p′).',
    ornek:'«Her öğrenci sınava girdi» önermesinin değili: «Bazı öğrenciler sınava girmedi».' },
  'tm-23': {
    ana:['f: A → B, A’nın her elemanını B’nin yalnız bir elemanına eşler; A tanım kümesi, f(A) görüntü kümesidir.',
      'Birebir fonksiyonda farklı elemanların görüntüleri farklıdır; örten fonksiyonda görüntü kümesi B’nin tamamıdır.',
      'Bileşke (f ∘ g)(x) = f(g(x)): önce içteki uygulanır; genelde f ∘ g ≠ g ∘ f.',
      'Ters fonksiyon için y = f(x)’te x yalnız bırakılır, x ile y yer değiştirir: f(a) = b ⇔ f⁻¹(b) = a.'],
    dikkat:'f⁻¹(x), 1/f(x) değildir. Düşey her doğru grafiği en çok bir noktada kesiyorsa grafik bir fonksiyondur.',
    ornek:'f(x) = 2x − 3 ise f⁻¹(x) = (x + 3)/2; f(4) = 5 ve f⁻¹(5) = 4.' },
  'tm-24': {
    ana:['P(x) = aₙxⁿ + … + a₀; derece en büyük üs, baş katsayı o terimin katsayısıdır.',
      'Katsayılar toplamı P(1), sabit terim P(0)’dır.',
      'Kalan teoremi: P(x)’in (x − a) ile bölümünden kalan P(a)’dır.',
      'İki polinom eşitse aynı dereceli terimlerin katsayıları eşittir.'],
    dikkat:'Polinomda değişkenin üssü doğal sayıdır; x⁻¹ ya da √x içeren ifade polinom değildir.',
    ornek:'P(x) = x³ − 2x + 5’in (x − 2) ile bölümünden kalan P(2) = 8 − 4 + 5 = 9.' },
  'tm-25': {
    ana:['ax² + bx + c = 0 (a ≠ 0) için Δ = b² − 4ac: Δ > 0 iki farklı, Δ = 0 çift (eşit) kök, Δ < 0 gerçek kök yok.',
      'Kökler x = (−b ± √Δ)/(2a); çarpanlara ayrılabiliyorsa önce o denenir.',
      'Kökler toplamı −b/a, kökler çarpımı c/a’dır.',
      'Kökleri x₁ ve x₂ olan denklem: x² − (x₁ + x₂)x + x₁ · x₂ = 0.'],
    dikkat:'Kökler toplamı −b/a’dır, işaret unutulmaz. Parametreli sorularda a ≠ 0 şartı ayrıca kontrol edilir.',
    ornek:'x² − 5x + 6 = 0 → (x − 2)(x − 3) = 0; kökler 2 ve 3, toplam 5, çarpım 6.' },
  'tm-26': {
    ana:['Çarpma kuralı: art arda yapılan seçimlerin sayıları çarpılır. Toplama kuralı: ayrık durumlar toplanır.',
      'Permütasyon (sıra önemli): P(n, r) = n!/(n − r)!; n farklı nesne n! biçimde sıralanır.',
      'Kombinasyon (sıra önemsiz): C(n, r) = n!/(r! (n − r)!) ve C(n, r) = C(n, n − r).',
      'Olasılık = istenen durum sayısı / bütün durum sayısı; 0 ≤ P ≤ 1 ve P(A′) = 1 − P(A).'],
    dikkat:'«En az bir» sorularında tümleyen kullanılır: 1 − P(hiç yok). Her seçimde sıranın önemli olup olmadığı sorulur.',
    ornek:'5 kişiden 3 kişilik ekip C(5, 3) = 10 biçimde; başkan, yardımcı, sekreter seçilecekse P(5, 3) = 60 biçimde seçilir.' },
  'tm-27': {
    ana:['Aritmetik ortalama = toplam / veri sayısı; aşırı değerlerden etkilenir.',
      'Medyan sıralanmış verinin ortasıdır; çift sayıda veride ortadaki iki değerin ortalamasıdır.',
      'Mod en çok tekrar eden değer, açıklık en büyük ile en küçüğün farkıdır.',
      'Standart sapma verinin ortalama etrafındaki yayılımını gösterir: büyükse veri dağınıktır.'],
    dikkat:'Medyandan önce veri sıralanır. Her veriye aynı sayı eklenirse ortalama değişir, standart sapma değişmez.',
    ornek:'3, 7, 8, 10, 22 → ortalama 50/5 = 10, medyan 8, açıklık 19.' },
  'tm-28': {
    ana:['Doğru açı 180°, tam açı 360°’dir; ters açılar eşit, komşu bütünler açıların toplamı 180°’dir.',
      'Paralel iki doğruyu kesen doğruda yöndeş ve iç ters açılar eşit, karşı durumlu iç açıların toplamı 180°’dir.',
      'Üçgenin iç açıları toplamı 180°; bir dış açı, kendisine komşu olmayan iki iç açının toplamına eşittir.',
      'Büyük açının karşısında büyük kenar bulunur; üçgen eşitsizliği: |b − c| < a < b + c.'],
    dikkat:'Paralel doğrular arasındaki kırık çizgide sağa bakan açıların toplamı sola bakan açıların toplamına eşittir.',
    ornek:'Açıları x, 2x, 3x olan üçgende 6x = 180°, x = 30°; açılar 30°, 60°, 90°.' },
  'tm-29': {
    ana:['Pisagor: dik üçgende a² + b² = c² (c hipotenüs). Sık üçlüler: 3–4–5, 5–12–13, 8–15–17 ve katları.',
      '30–60–90 üçgeninde kenarlar k, k√3, 2k’dir (30°’nin karşısı k); 45–45–90’da k, k, k√2.',
      'Öklid: hipotenüse inen yükseklik h, hipotenüsü p ve k’ye ayırıyorsa h² = p · k.',
      'Dik üçgende sin = karşı/hipotenüs, cos = komşu/hipotenüs, tan = karşı/komşu.'],
    dikkat:'30–60–90’da hipotenüs, 30°’nin karşısındaki kenarın 2 katıdır; kenarlar açılarla eşleştirilerek yazılır.',
    ornek:'Dik kenarları 6 ve 8 olan üçgenin hipotenüsü 10, hipotenüse ait yüksekliği 6 · 8/10 = 4,8.' },
  'tm-30': {
    ana:['Alan = taban · yükseklik / 2; iki kenar ve aradaki açı biliniyorsa (1/2) · a · b · sin C.',
      'Yükseklikleri eşit üçgenlerin alanları tabanlarıyla orantılıdır.',
      'İç açıortay karşı kenarı komşu kenarlar oranında böler: |BD| / |DC| = |AB| / |AC|.',
      'Kenarortaylar ağırlık merkezinde köşeden itibaren 2 : 1 oranında bölünür; kenarortay üçgeni iki eş alanlı parçaya ayırır.'],
    dikkat:'Dik üçgende hipotenüse ait kenarortay hipotenüsün yarısına eşittir.',
    ornek:'Kenarları 8 ve 12 olan açının açıortayı, uzunluğu 10 olan karşı kenarı 4 ve 6’ya böler.' },
  'tm-31': {
    ana:['Açıları eşit üçgenler benzerdir (AA); karşılık gelen kenarlar orantılıdır.',
      'Benzerlik oranı k ise çevreler oranı k, alanlar oranı k²’dir.',
      'Temel orantı (Tales): bir kenara paralel doğru öteki iki kenarı orantılı böler.',
      'Kelebek (kum saati) şekillerinde paralel kenarlar iç ters açıları eşit yapar; benzer üçgen çifti oradan kurulur.'],
    dikkat:'Kenarlar eşit açıların karşısındakilerle eşleştirilir, şekildeki sıraya göre değil.',
    ornek:'Benzerlik oranı 2/3 olan üçgenlerden küçüğünün alanı 20 ise büyüğünün alanı 20 · (3/2)² = 45.' },
  'tm-32': {
    ana:['n kenarlı çokgende iç açılar toplamı (n − 2) · 180°, dış açılar toplamı 360°, köşegen sayısı n(n − 3)/2.',
      'Düzgün çokgende bir dış açı 360°/n’dir.',
      'Paralelkenarda karşılıklı kenarlar ve açılar eşittir, köşegenler birbirini ortalar; alan = taban · yükseklik.',
      'Eşkenar dörtgende köşegenler dik kesişir (alan = d₁ · d₂ / 2); yamukta alan (a + c)/2 · h, orta taban (a + c)/2.'],
    dikkat:'Dikdörtgenin köşegenleri eşittir ama dik kesişmez; dik kesişme eşkenar dörtgende (karede ikisi birden) vardır.',
    ornek:'Düzgün altıgende bir iç açı 180° − 360°/6 = 120°, köşegen sayısı 6 · 3/2 = 9.' },
  'tm-33': {
    ana:['Çevre 2πr, daire alanı πr²; α derecelik yay 2πr · α/360, daire dilimi πr² · α/360.',
      'Merkez açı gördüğü yayın ölçüsüne eşittir; çevre açı gördüğü yayın yarısıdır.',
      'Çapı gören çevre açı 90°’dir; teğet, değme noktasındaki yarıçapa diktir.',
      'Bir dış noktadan çizilen iki teğet parçasının uzunlukları eşittir.'],
    dikkat:'Aynı yayı gören çevre açılar eşittir; çevre açı aynı yayı gören merkez açının yarısıdır.',
    ornek:'Yarıçapı 6 cm, merkez açısı 60° olan dilimin alanı 36π · 60/360 = 6π cm².' },
  'tm-34': {
    ana:['İki nokta arası uzaklık √((x₂ − x₁)² + (y₂ − y₁)²); orta nokta ((x₁ + x₂)/2, (y₁ + y₂)/2).',
      'Eğim m = (y₂ − y₁)/(x₂ − x₁) = tan α; noktası ve eğimi bilinen doğru: y − y₁ = m(x − x₁).',
      'Paralel doğruların eğimleri eşit, dik doğruların eğimleri çarpımı −1’dir.',
      'Eksenleri kesim noktaları x = 0 ve y = 0 konarak bulunur; doğrunun eksenlerle oluşturduğu üçgenin alanı buradan çıkar.'],
    dikkat:'Düşey doğrunun (x = a) eğimi tanımsız, yatay doğrunun (y = b) eğimi 0’dır.',
    ornek:'A(1, 2) ve B(4, 6) arası uzaklık √(9 + 16) = 5, AB’nin eğimi 4/3.' },
  'tm-35': {
    ana:['Prizma hacmi = taban alanı · yükseklik; dikdörtgenler prizması V = abc, küp V = a³.',
      'Silindir V = πr²h (yanal alan 2πrh); koni V = πr²h/3; küre V = 4πr³/3, yüzey alanı 4πr².',
      'Piramit ve koni hacmi, aynı taban ve yükseklikli prizma ve silindirin üçte biridir.',
      'Küpün yüzey köşegeni a√2, cisim köşegeni a√3’tür.'],
    dikkat:'Hacim birim küp (cm³), alan birim kare (cm²) ile ölçülür; 1 L = 1 dm³ = 1000 cm³.',
    ornek:'Yarıçapı 3, yüksekliği 4 olan koninin hacmi π · 9 · 4/3 = 12π.' },
};
