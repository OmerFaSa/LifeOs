# Faz 3 · Deneme ekranı ve aşama düzeni

Tarih: 2026-11-13 · dal `sadelesme` (68e721aa üstünde, commit edilmedi) · yalnız `kabuk/`, `tools/kabuk_gez.js`, bu rapor ve
`kabuk-onizleme/` görüntüleri yazıldı. `motor/` ve `alan/` dosyalarına dokunulmadı.

**Önce örnek kuralı (AGENTS §0.1 kural 6) bu iki ekran için atlandı:** sahibin «sorma» talimatıyla ekranlar örnek gösterilmeden
doğrudan kuruldu; görüntüler aşağıda, beğenilmeyen yer sonradan değişir.

## Özet
- **A. Süreli deneme ve sınav provası** (`#/motor/soru/deneme`, yeni `kabuk/deneme.js`): etkin alanın açık ünitelerinden süreli
  deneme; Akademik'te ayrıca TYT / AYT provası. Görünür geri sayım, süre dolunca kendiliğinden biter; sonuçta net, D/Y/B, süre ve
  (Akademik'te) puan ve sıra tahmini, her sayı motorun etiketiyle. Bitti, test edildi.
- **B. Aşamalı kabuk**: alan `alan/<id>/asama-1..N.json`'dan yüklenir (N = haritadaki `asama`); alan sayfası iki ya da daha çok
  aşama varsa «Aşamalar» listesini gösterir, bir aşama ancak öncekinin aşama kapısı geçilince açılır (kuralı Yol uygular), kayıt
  aşama başına ayrı anahtarda, birinci aşamanın anahtarı eski anahtarın kendisi (`lifeos.yol.<alan>.1`), eski kayıt aynen okunur.
  Felsefe, Dil ve Tarih için haritada `asama: 2`; öteki yedi alan 1. Dosyası olmayan aşama gösterilmez. Bitti, test edildi.
- Testler: `kabuk.test.js` 42/42, `deneme.test.js` 6/6, `tanisma.test.js` 25/25; gerçek tarayıcı gezisi 154 adım, hepsi geçti.

## Deneme ekranı
**Nereden açılır:** Soru sayfasında «Süreli deneme» düğmesi (deneme sürüyorsa «· sürüyor»). Kabuktaki yer Soru aracıdır; harita
satırı eklenmedi, `Kabuk.ek.soru` alt yolu `deneme` ise bu ekranı çizer.

**Kural motorda (`motor/soru.js`), ekran yalnız seçer, çizer, kaydeder:**

| Ekranda | Motor işlevi |
|---|---|
| Deneme kurulumu (her açık ünite bir test) | `denemeBaslat` (şablon: `{ ad, tur:'kesit', sure, testler:[{ad, q}] }`); soru seçimi her ünitede `alistirmaKur` (karıştır, aynı ders ard arda gelmesin); ünitede 5'ten az soru varsa hepsi |
| Teste geçiş (soru numarasıyla ya da önceki/sonraki) | `testeGit` (test saati de geçer) |
| Geri sayım | `kalanSure` (deneme), `kalanSn` (prova); duvar saati, sekme kapalıyken de akar (sahibin 2026-11-01 kararı) |
| Cevap | denemede `kontrol` ile geçerlilik, bitirene kadar değişir; provada `cevapla` (ilk cevap kilitlenir, süre dolunca alınmaz) |
| Bitir | deneme `denemeBitir` (boş yazılmaz, motor sorudan türetir: «hesaplandı») + `denemeAnalizi`; prova `oturumBitir` → `ozet.prova` |
| Prova kurulumu | `provaPlani(sinav, ÖSYM soru sayıları, 20/40)` + `provaKur` |
| Puan ve sıra | `puanTahmini(biten denemeler, {})`, yalnız Akademik |

**Akış:** başlangıçta testler (ünite adı, soru sayısı) ve süre («hesaplandı»); «N soruluk denemeyi başlat». Canlı ekranda üstte
yapışkan şerit (deneme adı, test, geri sayım `role=timer`), soru numaraları (cevaplananlar dolu, şu anki çerçeveli; tıklayınca gider),
soru, şıklar, «Önceki / Sonraki / Bitir». Erken bitirmede onay sorar («Cevaplanmamış N soru boş sayılır»). Son dakikada sayaç vurgu
rengi ve kalın çerçeve alır (yanıp sönmez); 5 ve 1 dakika kala canlı bölgede duyuru.

**Sonuç:** net (hesaplandı), toplam doğru/yanlış (ölçüldü), süre (ölçüldü) ya da «süre doldu (N dk)»; test test D/Y (ölçüldü),
boş (hesaplandı), dakika (ölçüldü), net (hesaplandı); «Soru soru» açılır listesi (cevabın, doğrusu). Prova sonucu: net, D/Y/B,
kullanılan / verilen dakika, ders ders net (sınav sırasıyla). Akademik'te «Puan ve sıra tahmini» bölümü motorun döndürdüğü gibi:
- veri yetmezse «tahmin yok · veri yok» ve motorun cümlesi («En az 3 tam TYT denemesi gerekir…») + kayıtlı tam TYT sayısı (ölçüldü);
- yeterse puan ve bandı, sıra ve bandı (ikisi de «tahmin»), hedefe göre konum, dayandığı deneme sayısı, okul puanı eklenmediyse
  notu ve motorun varsayım cümlesi. Bu dal yalnız Node testinde görüldü (aşağıda neden).

**Süre kuralları:** deneme süresi ÖSYM TYT ölçeğiyle (165 dk / 120 soru × soru sayısı; `provaKur`'un formülü, `Soru.PROVA.TYT`
sabitleriyle). Süre dolunca, sayfa açıksa ≤ 1 sn içinde, kapalıysa açılınca biter; **bitiş anı sınırın kendisidir**, sekme bir saat
sonra açılsa da ölçülen süre denemenin süresidir (testte).

**Kayıt (karma testle aynı yol, yalnız bu tarayıcıda):** süren `lifeos.soru.deneme` (yenilemeden sonra kaldığı sorudan, cevaplarıyla
sürer); biten denemeler `lifeos.soru.denemeler` (motorun Deneme kaydı + alan, aşama, bitiş, süre doldu mu; son 50); prova sonucu
`lifeos.soru.gecmis`'e karma testle aynı biçimde («Akademik · TYT provası» adıyla Soru sayfasının «Son testler»inde görünür).

**Klavye ve telefon:** A–E şık seçer, ← → gezer (yazı alanında, komut çubuğu ya da halka açıkken çalışmaz); düğmeler ≥ 44 px;
390 px'te yatay taşma yok (gezide denendi). Hareket yok; azaltılmış hareket ayarı etkilenmez.

**Bilerek sınırlı:**
- Alan denemesi `tur:'kesit'`dir: puan tahmini motorda yalnız **tam** TYT denemesiyle konuşur, kısa bir alan denemesini tam sayıp
  sıra uydurmak yanlış olurdu. Bu yüzden kabukta bugün sıra tahmini hep «veri yok» çıkar (Açık sorular 1).
- Deneme en çok son 4 açık ünite × 10 soru (kodda `shortcut:` notu); ünite seçimi istenmedi.
- Duraklatma düğmesi yok (motorda `duraklat`/`surdur` var; sınav gerçeğine uygun olarak bağlanmadı).
- Felsefe ve öteki alanlarda puan / sıra bölümü gösterilmez (motorun tahmini YKS'ye özgü).
- Akademik ünite → sınav dersi eşlemesi ünite adının başından («TYT Türkçe», «AYT Fizik»…) okunur; ÖSYM soru sayıları
  (40/20/40/20, 40/14/13/13) `AYS/src/js/data/subjects.js`'ten kabuğa yazıldı. İkisi de motorda olmalı (Açık sorular 2).

## Aşama düzeni
**Yükleme (`kabuk/kabuk.js` `alanYukle`):** haritadaki `asama` sayısı kadar `../alan/<id>/asama-n.json` aynı anda istenir.
`Kabuk.Asama.kur` sırayla yükler ve **ilk eksik ya da bozuk aşamada durur** (sonraki zaten açılamaz): dosya yoksa (404), JSON
bozuksa, kimliği `<alan>.<n>` değilse ya da `Yol.yukle` reddederse o aşama ve sonrası gösterilmez; birinci bile yoksa sayfa eskisi
gibi «Yol haritası bu açılışta gösterilemiyor» der. Yani başka mühendisin `asama-2.json` dosyaları olsa da olmasa da kabuk çalışır
(gezide ikisi de denendi: dosya yoksa gezi Felsefe için yapay bir ikinci aşamayı ağ katmanında verir; bu koşuda üç gerçek dosya vardı).

**Kilit kuralı:** aşama n ≥ 2'nin `onKosul`unda önceki aşama yoksa kabuk yükleme anında ekler (`asamaHazirla`); böylece içerik
yazarı önkoşulu boş bıraksa da aşama ancak öncekinin **aşama kapısı** geçilince açılır (AGENTS §0.1). Açık mı / geçildi mi kararını
`Yol.acikMi` ve `Yol.asamaGectiMi` verir; kabuk yalnız öteki aşamaların «geçildi» bilgisini salt okunur kayda ekler ki Yol önkoşulu
görsün (`asamaKaydi`). Bugünkü üç dosya önkoşulu zaten doğru yazmış (`felsefe.2 → felsefe.1`, `dil.2 → dil.1`, `tarih.2 → tarih.1`).

**Ekranda:**
- Alan sayfası: iki ya da daha çok aşama varsa üstte «Aşamalar» listesi (`nav`, `aria-current`): açık aşama bağlantıdır («açık»,
  «geçildi», «şu an burada»), kilitli olan nedenini söyler («kilitli · önce Aşama 1 kapısı»). Başlıkta «Aşama n» artık sabit 1 değil.
- Yol: `#/alan/<id>/asama/<n>`. Ders ve kapı yolları değişmedi; aşama, kimliğin ikinci parçasından okunur (`felsefe.2.1.3` → 2).
- Kilitli aşamanın sayfası listeyi ve «Bu aşama kilitli: önce önceki aşamanın kapısını geç.» notunu gösterir; dersine ya da kapısına
  doğrudan gidilirse aynı cümleyle açılmaz.
- Aşama kapısı geçilince sonuç kutusunda ve alan sayfasında «Sonraki aşama» düğmesi (varsa); «Aşama tamamlandı» yalnız gerçekten
  geçilince yazar.
- Üzerinde çalışılan aşama: seçili değilse açık aşamaların sonuncusu. Bugün, Soru, Süreli deneme ve Kayıt bu aşamayı kullanır;
  Kayıt satırı «Aşama 2 · İlk tez · …» yazar. Tekrar kartları **her aşamanın** onaylı alıştırmalarından çıkar.
- Süren deneme kendi aşamasının kimliğini saklar; aşama değişse de kaldığı yerden sürer.

**Harita sözleşmesi (`kabuk/harita.js`):** `asama` = kabuğa taşınmış en yüksek aşama numarası. Felsefe, Dil, Tarih 2; ötekiler 1.
`kabuk.test.js` bir alanda `asama-(N+1).json` yazılıp haritada N kaldıysa kırmızı verir (yeni aşama sessizce görünmez kalmasın).

## Eski kayıtlar
- Birinci aşamanın kayıt anahtarı **değişmedi**: `kayitAnahtari(alan, 1)` = `lifeos.yol.<alan>.1`, eski kabuğun yazdığı anahtarın
  kendisi. Taşıma, kopyalama ya da göç yok; eski kayıt ilk açılışta olduğu gibi okunur. İkinci aşama `lifeos.yol.<alan>.2`'ye yazar.
- Okurken: kayıt bozuksa ya da beklenen alanlar (`dersler`, `cevaplar`, `kapilar`, `asamalar`) yoksa eskisi gibi boş kayıtla
  başlanır; depodaki bozuk kayda yazılmaz (ilk ilerlemeye kadar).
- Yazarken (`asamaYaz`): kayıttaki her alan aynen yazılır; yalnız okurken öteki aşamalardan eklenmiş «geçildi» satırları çıkarılır
  (onların asıl yeri kendi anahtarları). Bu alanın kalıbına uymayan ya da bu aşamaya ait her `asamalar` satırı korunur.
- Kanıt: `kabuk.test.js` «eski kayıt» testi tek aşamalı dönemin biçiminde bir `lifeos.yol.felsefe.1` kaydı (okunan dersler,
  cevaplar, geçilen kapı, bilinmeyen ek alan) koyar, aşamalı kabukla okur, bir ders daha okutup yazar ve **önceki her alanın aynen
  durduğunu**, ikinci aşama anahtarının boş kaldığını doğrular. Gezide de aynı: eski anahtarlı kayıt «3/9 ders, 1/3 kapı» olarak
  okunur; ikinci aşamada ilerleyince birincinin kaydı bayt bayt değişmez.
- `lifeos.yol.son` (son açılan alan) ve Soru / deneme kayıtları (`lifeos.soru.*`) değişmedi.

## Testler
- `node kabuk/deneme.test.js` → **6 geçti, 0 kaldı** (gerçek Felsefe ve Akademik içeriği, gerçek Soru ve Yol motorları): kurulum ve
  süre, kapı geçilince ikinci test; cevap değişir, test geçişinde motorun test sırası değişir, net 2 − 1/4 = 1,75 «hesaplandı», boş
  «hesaplandı», kesit deneme puan tahminine girmez; süre dolunca cevap alınmaz ve bitiş anı sınırdır; prova TYT 20 kotası
  7/3/7/3 ve 28 dk, AYT 40 → 90 dk, ilk cevap kilitli, ders netleri sınav sırasında; tahmin satırları iki dalda motorun sayısıyla.
- `node kabuk/kabuk.test.js` → **42 geçti, 0 kaldı** (39 + 3 yeni aşama testi; harita testi de genişledi):
  - aşama: kimliği tutmayan, bozuk ya da eksik aşama gösterilmez; ilk eksikte durulur;
  - aşama: ikinci aşama ancak birincinin kapısı geçilince açılır (önkoşulu boş yazılmış olsa da); kayıtlar ayrı;
  - eski kayıt: tek aşamalı dönemde yazılmış `lifeos.yol.felsefe.1` (göçten gelen `eski` alanı ve bilinmeyen bir alanla) aynen
    okunur, okuyup yazınca bayt bayt aynı, yeni dersle yazılınca eski her şey durur, ikinci aşamaya kendiliğinden kayıt yazılmaz;
  - harita: her taşınan alanın `asama-1..N.json`'u yerinde ve `asama-(N+1).json` yazılmışsa haritada N kalamaz.
- `node kabuk/tanisma.test.js` → 25/25 (değişmedi).

## Gezi
`node tools/kabuk_gez.js` (A bitince bir kez, görüntüsüz): **hepsi geçti**. Yeni adımlar: başlangıçta testler ve süre etiketli; geri
sayım akar; harfle cevap, doğru/yanlış söylenmez; cevap değişir; yenilemeden sonra kaldığı yerden; bitince net / D / Y / B / süre
etiketli; Felsefe'de puan bölümü yok; kayıt yazıldı, süren silindi; «Son denemeler»; süre dolunca kendiliğinden biter («süre
doldu»); Akademik'te TYT provası açık, AYT kapalı; prova 20 soru 28 dk, ilk cevap kilitli; prova sonucu ders ders ve tahmin
«veri yok» motorun cümlesiyle; «Son testler»de prova; dört ekranda telefonda yatay taşma yok.
Son koşu (A ve B birlikte, `node tools/kabuk_gez.js --goruntu`, tek görüntüsüz Chromium, 2026-11-13): **154 adım, hepsi geçti,
çıkış 0**. Aşama adımları (Felsefe, bu koşuda gerçek `asama-2.json` ile): alan sayfası iki aşamayı listeler, ikincisi kilitli ve
nedenini söyler; birinci aşamanın eski anahtarlı kaydı aynen okunur (3/9 ders, 1/3 kapı); kilitli aşamanın dersi açılmaz, neden
aşama kilidi; kilitli aşama sayfası listeyi ve kilidi gösterir; aşama kapısı geçilince «Sonraki aşama» ikinci aşamaya götürür;
ikinci aşama açıldı, birincisi «geçildi», ikincisi «şu an burada»; ikinci aşamanın kaydı kendi anahtarında, birincinin kaydı
değişmedi; Bugün yenilemeden sonra ikinci aşamayla karşılar; telefonda yatay taşma yok. Dosyası olmayan aşamanın 404'ü konsol
denetiminden muaf (beklenen durum); başka her konsol hatası kırmızı.

## Ekran görüntüleri
`belgeler/ekip/sadelesme/kabuk-onizleme/`, her biri 1280 ve 390 genişlikte, açık ve koyu (`-masaustu-acik`, `-masaustu-koyu`,
`-telefon-acik`, `-telefon-koyu`), son koşuda yenilendi:
- `deneme-baslangic-*`: Felsefe denemesinin testleri ve süresi, başlat düğmesi;
- `deneme-soru-*`: canlı deneme: yapışkan şerit, geri sayım, soru numaraları, şıklar;
- `deneme-sonuc-*`: Felsefe denemesinin sonucu (net, D/Y/B, süre, test test);
- `deneme-prova-sonuc-*`: Akademik TYT provası sonucu, ders ders net, «Puan ve sıra · tahmin yok · veri yok» ve motorun cümlesi;
- `asama-liste-*`: Felsefe, birinci aşama geçilmiş, ikinci aşama açık ve «şu an burada»;
- `asama-kilitli-masaustu-koyu.png`: ikinci aşama kilitliyken aşama sayfası (yalnız bir görünüm).
Ayrıca var olan `felsefe-masaustu-koyu`, `kayit-masaustu-koyu`, `not-masaustu-koyu`, `soru-masaustu-koyu` yenilendi (kodda görülen
farklar: Felsefe'de «Aşamalar» listesi, Kayıt'ta «Aşama n ·», Soru'da «Süreli deneme» düğmesi; Not'taki fark yalnız piksel).

## Açık sorular
1. **Sıra tahmini kabukta hiç sayı vermiyor.** Motor yalnız tam TYT denemesiyle tahmin eder; kabuk henüz tam deneme üretmiyor.
   İki yol: (a) AYS'deki gibi kâğıt deneme: TYT şablonu (165 dk, 4 test) için süre tutup sonda test test D/Y/B girilen ekran
   (`denemeBaslat` + `denemeBitir` tam bunun için), (b) içerikten 120 soruluk tam TYT (provaPlani 120'yi desteklemiyor). Öneri (a).
2. **Motorda eksik (motor/ dokunulmadı):** alan denemesinin süre kuralı (`sureOlcegi(n)`), ünite → sınav dersi eşlemesi ve ÖSYM
   ders soru sayıları (`PROVA` içinde) motorda olmalı; şimdi kabukta, kaynak satırıyla.
3. Puan tahmininde okul puanı (diploma) girilecek bir ayar yok; motor «veri yok» diyor, ekran «okul puanı eklenmedi» yazıyor.
4. **CI `kabuk/deneme.test.js`'i koşmuyor.** `.github/workflows/ci.yml` bu dalgada başka mühendiste (kalite adımları); «Kabuk
   haritası, ayar şeması ve arama» adımına `&& node kabuk/deneme.test.js` eklenmeli (koordinatör). Gezi (`tools/kabuk_gez.js`) CI'da
   koşuyor ve deneme ekranını gerçek tarayıcıda yürüyor, yani ekran yine de korunuyor.
5. **Yeni aşama dosyası gelince haritadaki sayı elle artmalı** (`kabuk/harita.js` `asama`). Unutulursa `kabuk.test.js` kırmızı verir;
   kendiliğinden keşif (dizin listeleme) tek kapı sunucusunda yok ve bilerek eklenmedi.
6. Haritada yazılı ama dosyası henüz olmayan aşama tarayıcı konsoluna bir 404 düşürür (kabuk o aşamayı göstermez). Zararsız; istenirse
   sunucu tarafında aşama listesi verilerek kaldırılabilir.
7. Aşama seçimi yalnız o açılış için tutulur (yenilemeden sonra açık aşamaların sonuncusu); kayıt gerektirmediği için depoya yazılmadı.
