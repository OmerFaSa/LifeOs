# Faz 4 · A9 kalanlar: kalite katmanının artıkları ve iki doğrulama

## Özet

Plan A9'un kalan dört işi yapıldı. İki doğrulama okundu, hiçbir şey değiştirilmedi (13 Kasım, taban `68e721aa`).
Kabuk, motor, alan, king, sistem ve brand klasörlerine dokunulmadı.

- **Katman denetimi** (`kalite/katman.py`): bugünkü ağaç geçiyor. Altı motorun açık arayüzü okunuyor (Yol 14,
  Not 22, Tekrar 11, Kayıt 11, Plan 14, Soru 65 anahtar). Kabuk ve King yalnız açık arayüzü kullanıyor. Motorlar
  birbirini çağırmıyor, kabuğu bilmiyor. **Bir bilinen istisna** var: `alan/akademik/donustur.js`, alan
  klasöründe kod. Liste yalnız küçülür.
- **Kullanım sayacı** (`kalite/kullanim.js`): tarayıcı deposunda gün gün sayıyor, ağ çağrısı yok. `olcum.py`
  okuma tarafı bugün `veri yok`. Kabuğa eklenecek satır aşağıda; sunucunun `kalite/` sunması da gerekiyor.
- **«Yanlış anladın» seti:** set git'e kayıtlıydı. Dolsaydı sahibin mesajları GitHub'a giderdi. Git dışı
  `kalite/veri/yerel/`'e taşındı. Satır doğrulayıcısı, tek yazma yolu `isaretle()` ve bir koruma eklendi:
  yalnız işaretli satır varken Anlama değer almaz (o örneklemde isabet hep 0). Bugün `veri yok`.
- **Hız bütçesi:** CI'da koşan hız denetimleri yalnız eski üç modülde (perfcheck + akicilik her PR'da,
  loadcheck haftada bir). **Yeni kabuğun hiç hız denetimi yoktu.** Statik iki tavan eklendi: kabuk açılış yükü
  420 794 / 1 000 000 bayt, en büyük alan paketi 2 224 187 / 2 500 000 bayt. Süreye dayalı denetim eklenmedi.
- **Piksel stil dosyası:** bölünme yapılmamış. `piksel.css` tek dosya ve yalnız eski modüllerde. Kabuk onu
  yüklemiyor; paleti `kabuk.css`'e başka adlarla kopyalamış ve koyu değerler ayrışmış.
- **Sağlık güvenlik metinleri:** sınır cümleleri Tahlil, Uyku ve Hareket derslerine taslak içerik olarak
  taşınmış. Ateş/SpO2 bayrağı ve enerji/yük sınırları `motor/kayit.js`'e kod olarak taşınmış. **Kırmızı bayrak
  eşikleri (6 örüntü + 60 tek ölçüm) hiçbir yeni yerde yok.**

## Katman denetimi

`python kalite/katman.py` (yalnız standart kütüphane, kod çalıştırmaz; `kalite/katman_test.py`, CI'da
«Katman denetimi» adımı). Bugünkü ağaçta **çıkış 0**: altı motorun açık arayüzü okunuyor, **1 bilinen istisna**,
yeni bozulma yok.

**Açık arayüzün tanımı.** Her motor dosyası tek nesne verir: `kok.LIFEOS.Motor.<Ad> = X;` ve
`module.exports = X`. Açık arayüz bu X'in **üst düzey anahtarlarıdır**: `const X = Object.freeze({…})` ya da
`var X = {…}` gövdesindeki anahtarlar (kısa yazım, `ad: değer`, yöntem) artı dosyada `X.ad = …` ile sonradan
eklenenler. Dosyanın geri kalanı (IIFE içindeki işlev ve sabitler) iç iştir. Bugün: Yol 14, Not 22, Tekrar 11,
Kayıt 11, Plan 14, Soru 65 anahtar.

**Dört kural** (`motor/`, `kabuk/`, `king/` içindeki test dışı `.js`; `alan/<ad>/` altındaki her dosya):

| Kural | Ne bozar |
|---|---|
| `motor-kabuk` | motor dosyasında `LIFEOS.Kabuk` ya da `require(…kabuk…)` |
| `motor-ic` | motor, kabuk ya da king dosyasında `<Ad>.ad` veya takma adla (`= LIFEOS.Motor.<Ad>`, `= require(…motor…/<ad>.js)`) `.ad`; `ad` açık arayüzde yoksa. Motorun kendi dosyası muaf; yalnız ilk özellik denetlenir (`N.goc.defter` → `goc`) |
| `alan-kod` | `alan/<ad>/` içinde `.json`/`.md` dışında dosya |
| `alan-ici` | alan JSON'undaki herhangi bir dizgede `LIFEOS.`, `require(`, `<script`, `motor/…js`, `kabuk/…`, `king/…` ya da başka bir alanın yolu `alan/<öteki>/`. `kaynaklar[]` içindeki `tur: "depo"` künyesinin `yol`'u (ör. `SPI/src/js/core/bio.js`) çağrı değil kaynak gösterimidir, sayılmaz |

Yorumlar, dizgiler ve düzenli ifadeler taranmadan önce boşaltılır (satır numarası korunur), yani yorumdaki
`LIFEOS.USTA` (motor/tekrar.js:226) ya da dizgideki `'A.ic()'` bozulma sayılmaz.

**Bugünkü ağaçta görülen kullanım** (hepsi açık arayüzde): `kabuk/kabuk.js` Yol'un 8 anahtarı; `kabuk/araclar.js`
Kayıt 5, Not 9, Plan 4, Soru 6, Tekrar 4, Yol 2; `king/kopru.js` Not (`ara`, `goc`, `kingOkur`) ve Tekrar
(`GOC`, `plan`). Motorlar birbirini çağırmıyor, kabuğu bilmiyor.

**Bilinen istisna (yalnız küçülür):**

| Dosya | Kural | Neden |
|---|---|---|
| `alan/akademik/donustur.js` | `alan-kod` | AYS ders verisini `asama-1.json`'a bir kez çeviren Node betiği; alan klasöründe kod. Yeri `tools/` (ya da iş bitince silinir) |

Liste `kalite/katman.py` `ISTISNALAR`'dadır. Yeni bozulma `KATMAN:` satırı, listede durup artık bozmayan istisna
`KAPANDI:` satırı verir; ikisi de çıkış 1'dir. Yani biri `donustur.js`'i taşıdığında CI o satırı listeden
sildirmeden geçmez.

**Statik denetimin görmediği:** `king/kopru.js` kabuğun haritasını çalışma anında gelen bir yoldan yükler
(`require(path.resolve(g.harita))`, `YERLER`/`DALLAR` kullanır; ikisi de `Harita`'nın açık anahtarı). Yol
dizgisi değişken olduğu için kural görmez (Açık soru 1). `${…}` şablon içi de silinir (kodda `shortcut:` notu).

## Kullanım sayacı

Plan A2: «Hangi ekranın ve aracın son haftalarda kaç kez açıldığı yalnız bu bilgisayarda sayılır.»

**Yazan taraf: `kalite/kullanim.js`** (sıfır bağımlılık, motorlarla aynı dışa verme biçimi:
`LIFEOS.Kalite.Kullanim` + `module.exports`; hiçbir motora, alana, kabuğa bağlı değil).

- `say(depo, tur, kimlik, simdi)`: `tur` yalnız `ekran` | `arac`; `kimlik` yalnız harita kimliği biçimi
  (`[a-z0-9-]`, en çok 40). Serbest metin sayılmaz, yani sayaca kişisel veri giremez. Gün yerel tarihtir.
- Saklanan değer, `localStorage['lifeos.kullanim']`: `{"surum":1,"gunler":{"2026-11-13":{"ekran/felsefe":3,"arac/not":1}}}`.
  56 günden eski gün her yazışta silinir, yani depo büyümez.
- `ozet(deger, simdi, gun=28)`: pencere toplamı. `oku(depo)`: bozuk ya da eksik değer boş sayılır.
- Depo yoksa ya da yazılamıyorsa (gizli pencere, dolu depo) `false` döner, hata fırlatmaz: kabuk bozulmaz.
- Dosyada ağ çağrısı yok; test bunu da sınıyor (`fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `navigator.`).

**Okuyan taraf: `kalite/olcum.py` `kullanim` ölçütü.** `kalite/veri/yerel/kullanim.json` dosyasını okur (değer
tarayıcıdakiyle aynı JSON). Pencere, **verideki en yeni güne göre** son 28 gündür; bugünün tarihine göre değil,
çünkü aynı girdi aynı kaydı vermeli (`olcum_test` belirlenimcilik kuralı). Dosya yoksa ya da bozuksa
`deger: null`, `durum: ölçülmedi`, `etiket: veri yok` olur ve komut satırı yazılır. **Bugün: `veri yok`.** Veri
gelince ayrıntıda `sayim` (çoktan aza) ve `hic_acilmayan_yer` durur. İkincisi `kabuk/harita.js`'teki yer
kimliklerinden pencerede hiç açılmayanlardır; envanterdeki «kalır mı, gider mi» kararının girdisi budur. Ölçüt
bütçe değildir, `butce.json`'a girmedi.

**Yalnız bu bilgisayarda.** `kalite/veri/yerel/` git dışıdır (`kalite/veri/yerel/.gitignore`: `*`). Gerçek kullanım
ve «yanlış anladın» satırları depoya, yani GitHub'a gitmez.

**Koordinatörün ekleyeceği bağlantı** (kabuğa dokunmadım):

1. `kabuk/kabuk.js` `rota()` içinde, `sayfaEl.setAttribute('data-yer', yer.id);` satırından **önce** tek satır:
   ```js
   if (sayfaEl.getAttribute('data-yer') !== yer.id && kok.LIFEOS.Kalite) kok.LIFEOS.Kalite.Kullanim.say(kok.localStorage, yer.katman === 'motor' ? 'arac' : 'ekran', yer.id, Date.now());
   ```
   Koşul, alan içeriği yüklenince `rota()`'nın aynı yeri yeniden çizmesini ikinci açılış saymaz. Araçlar haritada
   `katman: 'motor'` olan yerlerdir; yani tek satır iki türü de sayar.
2. Betiğin yüklenmesi için iki küçük ek gerekir. Biri `kabuk/index.html`'e `<script src="../kalite/kullanim.js"></script>`
   (kabuk.js'ten önce). Öteki `sistem/sunucu.py` `KABUK_KOKLER`'e `"kalite": (".js",)`: bugün tek kapı yalnız
   `kabuk/`, `motor/`, `alan/` sunuyor. Bu ek olmadan betik 404 verir ve sayaç sessizce kapalı kalır.
3. Tarayıcıdaki değerin `kalite/veri/yerel/kullanim.json`'a inmesi için bir yol gerekir (Açık soru 2).

## Yanlış anladın seti

Plan A7: «King'in cevabının altında tek dokunuşluk "yanlış anladın" işareti. İşaretlenen mesajlar yalnız bu
bilgisayarda etiketli sete girer.»

**Bulunan sorun:** Faz 4'te set `kalite/veri/anlama.jsonl` olarak **git'e kayıtlı** bir dosyaydı (boş). Dolduğunda
sahibinin gerçek mesajları commit ile GitHub'a giderdi, bu da plandaki «yalnız bu bilgisayarda» şartını bozardı.
Set `kalite/veri/yerel/anlama.jsonl`'e taşındı. `kalite/veri/yerel/` git dışıdır. Eski boş dosya silindi
(`git status`'ta `D kalite/veri/anlama.jsonl`). Uydurma satır eklenmedi; set bugün yok, yani boş.

**Biçim** (`kalite/veri/README.md`, satır başına bir JSON):
`{"metin", "niyet", "kaynak", "king", "tarih"}`. Yalnız bu beş alan var; bilinmeyen alan hatadır, böylece sete
başka kişisel veri sızmaz.

- İşaretten gelen satır `kaynak: "yanlis-anladin"` taşır. Bu satırda `king` (King'in seçtiği niyet) zorunludur.
  `niyet` (doğru niyet) boş kalabilir; o zaman satır «etiket bekliyor» sayılır. Doluysa `king`'den farklı olmalı,
  aynıysa çelişkidir.
- Öteki satırlar (ör. `kaynak: "ornek"`): `niyet` zorunlu. `king` yoksa satır sayılır ama isabete girmez.
- `niyet` ve `king` beşten biridir (`sohbet|kayit|ogren|arastir|yonet`, `kalite/egri/_sinav.py` `NIYETLER`).
  `metin` boş olamaz, en çok 2000 karakterdir. `tarih` YYYY-AA-GG biçimindedir.

**Doğrulayıcı:** `kalite/egri/anlama.py` `satir_hatalari()` her satır için Türkçe hata listesi döner. Komut:
`python kalite/egri/anlama.py --denetle` (bozuk satırı numarasıyla yazar, çıkış 0/1). Eğrinin kendisi de aynı
denetimi kullanır; ikinci bir kural kopyası yok. Sunucunun tek yazma yolu `isaretle(kok, metin, king, niyet=None)`:
satırı doğrular, geçmezse yazmaz.

**Anlama eğrisi:** seti okur. Değer, hem `king` hem `niyet` taşıyan satırlarda isabet oranıdır. İki koruma var:

1. Set yok ya da boşsa `deger: null`, `ölçülmedi`, `veri yok` (bugün böyle). Vekil (sınav cümleleri) yine
   `tahmin` etiketiyle ayrıntıda durur.
2. Kararlı satırların **hepsi** `yanlis-anladin` ise değer yazılmaz. O örneklemde isabet tanım gereği 0'dır
   ve bu sayı yanıltır (§1.2). Ayrıntıda `neden_degersiz` yazar. Değer için King'in doğru anladığı,
   işaretlenmemiş mesajlardan da örneklem gerekir (Açık soru 3).

Ayrıntıya `yanlis_anladin` ve `etiket_bekleyen` sayıları eklendi.

**Koordinatöre:** King cevabının altındaki işaret, PC sunucusunda
`anlama.isaretle(KOK, mesaj, king_niyeti)` çağırmalıdır. Kabuk tarafı için ek bir dosya yazmadım; yazma
sunucudadır, çünkü set PC'deki dosyadır.

## Hız bütçesi

Plan A9: «karmaşıklık bütçesi ve hız bütçesi otomatik denetime bağlanır. Bütçe aşılırsa birleştirme durur.»

**CI'da bugün koşan** (`.github/workflows/ci.yml`):

| Denetim | Nerede | Ne ölçer | Kapsam |
|---|---|---|---|
| `node tools/perfcheck.js` («Çizim bütçesi (dokuz aylık veri)») | `arayuz` işi, AYS/SPİ/ESP matrisi, her push/PR | dokuz aylık sahte veriyle her ekranın çizim süresi (ms); ekran başına bütçe (ör. AYS analytics 140 ms, varsayılan 70), CI payı `PERF_PAY=1.5` | yalnız **eski üç modül** |
| `tools/akicilik.js` | perfcheck'in içinden çağrılır (üç modülde de) | süre değil **sayı**: simge çevirmede zorunlu stil hesabı, kart ışığında yeniden stillenen öğe | yalnız eski modüller |
| `node tools/loadcheck.js` («Beş yıllık veriyle çizim») | `yuk` işi, **haftada bir** (pazartesi cron) | beş yıllık veriyle çizim süresi, `PERF_PAY` | yalnız eski modüller |
| `python kalite/olcum.py --denetle` | `tekkaynak` işi | karmaşıklık bütçesi (26 sayım); **hız yoktu** | tüm depo |

**CI'da koşmayan:**

- `tools/olcum_modul.js` / `python kalite/egri/optimizasyon.py --acilis`: açılış süresi. Elle koşuluyor, sonucu
  `kalite/veri/acilis.json`'da. Yalnız eski modülleri ölçüyor.
- Kare süresi: hiçbir yerde yok (Optimizasyon ayrıntısında `veri yok`).
- **Yeni kabuk için hiçbir hız denetimi yok.** `tools/kabuk_gez.js` CI'da gerçek tarayıcıyla geziyor ama süre ya da
  boyut denetlemiyor. Kabuğun açılışı hiç ölçülmüyor.

**Eklenen statik parça** (`kalite/olcum.py` `hiz()` + `butce.json`). Süre değil bayt; aynı ağaç her makinede
aynı sayıyı verir, CI'da oynamaz:

| Ölçüt | Bugün | Tavan | Nasıl |
|---|---|---|---|
| `kabuk_acilis_yuku` | **420 794 bayt** (15 dosya) | 1 000 000 | `kabuk/index.html` + `src`/`href` ile bağladığı .js/.css (`motor/`, `brand/ortak/piksel-yazi.css` dahil). Optimizasyon eğrisinin kabuk sayımıyla aynı işlev (`optimizasyon.dagitilan`), ikinci bir sayım yolu yok |
| `alan_paketi_en_buyuk` | **2 224 187 bayt** (`alan/akademik/asama-1.json`) | 2 500 000 | `alan/*/asama-*.json` içinde en büyüğü; alan açılınca tek seferde yüklenen paket |

Yeni bütçe türü `yon: "tavan"`: değer kayda değil sabit tavana karşı denetlenir, takas yoktur. Aşınca
`AŞIM: … > tavan …; hız bütçesi` satırı ve çıkış 1 verir. Var olan «Karmaşıklık bütçesi aşılmadı» adımı
(`olcum.py --denetle`) bunu zaten koşturuyor; ayrı CI adımı gerekmedi. `--denetle` artık 28 bütçe sayıyor.

**Tavanlar benim kararım, plan sayı vermiyor** (Açık soru 4):

- Kabuk 1 MB: en hafif eski modülün (SPİ dist 7,7 MB) sekizde biri, bugünkü yükün 2,4 katı. Kabuk dün 195 KB
  (10 dosya) idi, bugün 421 KB (15 dosya). Bu hızla tavan birkaç haftada dolabilir. Amaç da tam bu: dolunca
  karar sahibine gelsin.
- Alan paketi 2,5 MB: bugünkü en büyük paketin %12 üstü. Öteki on paket 33-50 KB; akademik paketi tek başına
  bunların 45-65 katı.

**Eklenmeyen:** süreye dayalı bir kabuk açılış denetimi. Oynar (faz4-egriler: aynı gün iki AYS koşusu arasında
%10 fark) ve tarayıcı ister.

## Piksel stil dosyası

Plan (sentez, risk tablosu, karar 19): «Sahne park edilmeden önce piksel stil dosyası ikiye bölünmeli; yoksa piksel
kimliği de gider» (426 kural piksel dilini taşıyor).

**Hüküm: bölünme yapılmadı; dosya hâlâ tek. Ama yeni kabuk onu kullanmıyor; kimliği kopyalamış.**

- `brand/ortak/piksel.css`: 618 satır, 73 730 bayt, ≈407 kural bloğu. Kaynak tektir, `tools/ortak.py` ile
  `AYS/`, `SPI/`, `ESP/` altındaki `src/css/piksel.css`'e birebir kopyalanır. İçinde hem **kimlik** var (satır
  11-50: açık/koyu palet jetonları `--bg`, `--text`, `--primary`…, yazı yığını, `--r-*:0`, yazı boyları; satır
  52-53: köşesizlik) hem **sahne** (satır 55-60 oda `.piksel-oda`, duvar, `.zemin-isik`; sonrası kenar çubuğu,
  figürler, «tatlı» bölümler, hareket). Hepsi `:root[data-zemin="piksel"]` altında.
- Yeni kabuk (`kabuk/index.html`) yalnız `brand/ortak/piksel-yazi.css`'i yükler (10 satır, gömülü Pixelify Sans
  ve Piksel Rakam yazı tipleri; zaten ayrı bir dosya). Palet `kabuk/kabuk.css` satır 4-28'de **ayrı jeton adlarıyla**
  (`--yazi`, `--ana`, `--yuzey`) elle yazılmış. Açık değerler piksel.css'ten kopya (`#42291f`, `#b1461f`,
  `#f6e6ca`…). Koyu değerler ise plan.html maketlerinden geliyor ve piksel.css'in koyu temasından **farklı**
  (ör. zemin `#2b211b` ↔ `#3f2f27`, ana renk `#ee9b62` ↔ `#f0a06d`). Yani piksel kimliği bugün iki yerde ve
  ikisi ayrışmaya başlamış (kural 3: bir özellik, bir yer).

**Bölünme ne ister:**

1. Kimlik parçası (jetonlar + yazı + köşesizlik) ayrı dosyaya, sahne parçası (oda, kenar, figür, hareket)
   `piksel.css`'te kalır. En ucuz yol, kimliği zaten iki tarafın da yüklediği `piksel-yazi.css`'e almaktır.
   Yeni dosya açmak `kopya_dosya` bütçesini 236 → 237 yapar. Bu bütçe «azalmali» ve grupsuz olduğu için
   `olcum.py --denetle` CI'ı kırmızıya çevirir (kural 5). Kimlik `piksel-yazi.css`'e girerse dosya sayısı değişmez.
2. Jeton adları birleşmeli. Eski modüller `--text/--primary/--surface`, kabuk `--yazi/--ana/--yuzey` kullanıyor.
   Ya kabuk eski adları alır ya da kimlik dosyası iki adı da tanımlar (geçiş süresince).
3. Koyu palet seçimi sahibin kararıdır (kural 6, önce örnek): piksel.css'in koyusu mu, onaylı maketin koyusu mu?
4. Kapsam: kimlik bugün `[data-zemin="piksel"]` altında. Kabuk bu niteliği koymuyor; kimlik `:root`'a alınmalı
   ya da kabuk niteliği koymalı. Sahne kuralları yüklenmediği için ikincisi kabukta zararsızdır.
5. Eski modüller dondurulmuş olduğu halde dokunulur: `python3 tools/ortak.py --yay`, ardından üç modülün
   `build.py`'si (dist yeniden derlenir; CI «Tek dosya kaynaktan derlenmiş hâliyle aynı mı» ve «Ortak CSS
   kaynakla aynı mı» adımları bunu denetler), `brand/ortak/piksel.test.js`, `tools/olucss.py`. Ardından üç
   modülde görsel karşılaştırma (layoutcheck, palettecheck).

## Sağlık güvenlik metinleri

Plan (risk tablosu): «Kırmızı bayrak eşikleri ve "karar hekimindir" metinleri alan kuralına taşınır; testleri
korunur.»

**Hüküm: kısmen taşındı.** Metinler **ders içeriği** olarak taşınmış; hepsi `durum: taslak`, `yazan: model`.
**Kırmızı bayrak eşikleri** ise hiçbir yeni yerde yok. Alan şemasında (`alan/SEMA.md`) «alan kuralı» diye bir yer
de yok: alan dosyaları yalnız aşama › ünite › ders › alıştırma › kaynak taşıyor.

| Eski metin (SPİ) | Nerede | Şimdi |
|---|---|---|
| `CLINICAL.disclaimer`: «SPİ bir hekim ya da tıp merkezi değildir… Teşhis ve tedavide karar hekimindir.» | `data/rules.js:37` | Tahlil `uniteler[1].dersler[2].metin[2]`: «SPİ bir hekim değildir; teşhis koymaz, doz önermez, tedaviyi bırakmayı önermez» (taslak ders). Beslenme, Hareket, Uyku'da yok. `motor/kayit.js`'te yok |
| `never`: teşhis koymak · ilaç/doz önermek · tedaviyi bıraktırmak · sonuç garantisi · ölçülmemiş sayı | `data/rules.js:43-56` | İlk üçü yukarıdaki Tahlil cümlesinde. «Garanti» hiçbir yeni dosyada yok. «Ölçülmemiş sayı» `motor/kayit.js`'te etiket kuralıyla korunuyor (eksik veri sıfır değil, `ETIKET`). «İlaç/doz» `motor/kayit.js`'te yapısal: katalogda ilaç/doz/teşhis alanı yok, test `kayit.test.js:350` «GÜVENLİK» |
| `supplement`: «Takviye önerisi doz içermez… Doz kararı hekime aittir.» | `data/rules.js:59` | Uyku `uniteler[2].dersler[3].metin[3]`: «Sistem uyku bozukluğuna teşhis koymaz, ilaç ya da takviye önermez» (taslak). Beslenme'de yok |
| `RED_FLAGS.title/lead`: «Hekime başvur», «Bu bir teşhis değil, bir yönlendirmedir.» | `data/rules.js:72-74`; `core/bio.js:17` | Tahlil aynı ders: «yorum yapmayı tamamen bırakır ve "bu bir teşhis değil, hekime yönlendirmedir" der». Kapı sorusu `uniteler[1].kapi.sorular[3]` bunu soruyor. Kod olarak yok |
| `RED_FLAGS.patterns` (6 örüntü): anemi (Hgb < 11 ve ferritin < 15), kan şekeri (glukoz ≥ 126 ya da HbA1c ≥ 6,5), karaciğer (ALT ve AST > 80), tansiyon (≥ 180 / ≥ 110), tiroid (TSH > 10 ya da < 0,1), böbrek (eGFR < 60) | `data/rules.js:79-113` | **Hiçbir yeni yerde yok** (alan, motor, kabuk, king aranadı). `motor/kayit.js` tansiyonu kaydediyor (`tansiyon`, 60-250 / 30-160 mmHg) ama 180/110 bayrağı yok |
| Tek ölçümlü eşikler: `biomarkers.js` içindeki 60 `red:` alanı | `data/biomarkers.js` | **Yok.** Yeni sistemde tahlil kayıt türü de yok (Kayıt türleri: öğün, su, uyku, kestirme, hareket, kilo, bel, yağ oranı, nabız, HRV, tansiyon, SpO2, ateş, enerji, çalışma, mola) |
| «Karar hekimindir» (kılavuz `kilavuz.js:71`, King tanışma `patrontur.js:86`, Tahlil ekranı `labs.js:24`) | | Tahlil'de dört derste «… yorum hekimindir» kalıbı (`uniteler[0].dersler[2].metin[3]` vb.). Kabuk ve King'de yok |
| Hareket güvenliği («göğüs ağrısı, nefes darlığı, baş dönmesi → dur, hekime danış») | SPİ hareket rehberi | Hareket'te 3 yerde, ör. kapı sorusu `uniteler[0].kapi.sorular[3]` (taslak) |
| Ateş ≥ 38,5 ya da SpO2 < %92 → toparlanma günü | `core/move.js:124,129` | **Taşındı, kod olarak:** `motor/kayit.js` `ATES_ESIK`, `SPO2_ESIK`; bayrak artık her zaman geçerli (bilinçli sapma, kayit.js:309-312). Sabitleri test eski dosyadan okuyup karşılaştırıyor |
| Enerji hedefi bazalın altına inmez; haftalık yük %10'dan fazla artmaz; sistem yükü yalnız azaltır | `core/nutri.js`, `core/move.js` | **Taşındı, kod olarak:** `motor/kayit.js` `Kural` (satır 14-18), kabukta `kabuk/araclar.js` kural satırları |
| Fotoğraf analizi «tıbbi bir teşhis değildir; değerler tahmindir» | `core/extract.js:54-55` | Yok (fotoğraf analizi henüz taşınmadı) |

**Açık risk:** eski SPİ kapandığında 6 örüntü ve 60 tek ölçüm eşiği giderse, kırmızı bayrak protokolü yeni sistemde
yalnız taslak bir derste anlatılan bir kural olarak kalır. Planın «testleri korunur» şartı (`SPI` `evidence.test.js`,
`bio` testleri) yeni bir yere bağlanmadı. Öneri (Açık soru 5): Tahlil alanına kod değil veri olarak
`alan/tahlil/kural.json` (eşikler + hekime yönlendirme metni). Kayıt motoru bunu çağıranın verdiği eşik tablosu
olarak okur, eski test sabitleri eski dosyadan karşılaştırır (`kayit.test.js`'in move.js yöntemi). Ayrıca
`katman.py` `alan-kod` kuralı .json'a izin verdiği için bu yol katman kuralına uyar.

## Testler

| Komut | Sonuç |
|---|---|
| `python kalite/katman_test.py` | 18/18: açık arayüz okuma, dört kuralın her biri, yorum/dizgi/düzenli ifade/test dosyası/künye sayılmaz, satır numarası, istisna listesi yalnız küçülür, bugünkü ağaç |
| `python kalite/katman.py` | çıkış 0; 6 motor, 1 bilinen istisna |
| `node kalite/kullanim.test.js` | 12/12: sayma, yerel gün, pencere, 56 gün budama, serbest metin ve bilinmeyen tür reddi, bozuk değer, yazılamayan depo, ağ çağrısı yok |
| `python kalite/anlama_test.py` | 17/17: satır kuralları, `isaretle` doğrulamadan yazmaz, yalnız işaretli satırla değer yok, işaretsiz örneklemle ölçülür, bozuk satır numarası, bugünkü set, git dışı |
| `python kalite/egri/anlama.py --denetle` | çıkış 0 (set yok) |
| `python kalite/olcum_test.py` | 52/52 (önce 43): kullanım ölçütü 4, hız ölçütleri 2, tavan bütçesi 3 yeni |
| `python kalite/olcum.py --denetle` | «Bütçe tamam: 28 bütçe, aşım yok.» (26 + 2 hız tavanı) |
| `python tools/belge_dizin_kabul_test.py` | geçti (87 belge) |
| `python tools/tools_dizin_kabul_test.py` | geçti (140 dosya); `tools/`'a dosya eklemedim, `tools/DIZIN.md` değişmedi |

CI (`.github/workflows/ci.yml`, `tekkaynak` işi, «Karmaşıklık bütçesi aşılmadı» adımından önce): iki yeni adım var,
ikisi de `tools/ci_hata.sh` ile sarılı. Biri «Katman denetimi» (`katman_test.py` + `katman.py`). Öteki «Kullanım
sayacı ve «yanlış anladın» seti» (`kullanim.test.js` + `anlama_test.py` + `anlama.py --denetle`). Hız tavanları
var olan `olcum.py --denetle` adımında koşuyor. Dosya YAML olarak okunuyor (`yaml.safe_load`).

**Değişen / eklenen dosyalar:**

- Yeni: `kalite/katman.py`, `kalite/katman_test.py`, `kalite/kullanim.js`, `kalite/kullanim.test.js`,
  `kalite/anlama_test.py`, `kalite/veri/yerel/.gitignore`
- Değişen: `kalite/olcum.py` (`hiz`, `kullanim`, `tavan` bütçe türü, `--md` komutsuz ölçüte dayanıklı),
  `kalite/olcum_test.py`, `kalite/butce.json` (+2 tavan), `kalite/egri/anlama.py` (yerel set, satır denetimi,
  `isaretle`, yalnız işaretli örneklem koruması), `kalite/veri/README.md`, `.github/workflows/ci.yml`
- Silinen: `kalite/veri/anlama.jsonl` (git'e kayıtlı boş set; yerine git dışı `kalite/veri/yerel/anlama.jsonl`)

## Açık sorular

1. **King'in kabuğa uzanması.** `king/kopru.js` kabuğun `harita.js`'ini çalışma anında gelen bir yoldan yüklüyor.
   Kullandığı `YERLER` ve `DALLAR` `Harita`'nın açık anahtarları, ama King → Kabuk yönü katman sırasına göre
   yukarı doğru. Harita bir «sistem kaydı» olarak çekirdeğe mi taşınmalı, yoksa King'in kabuk haritasını okuması
   kabul mü? Kabulse kural yazılı olsun.
2. **Kullanım verisinin PC'ye inişi.** Sayaç tarayıcıda sayıyor; `olcum.py` dosyadan okuyor. Kabuk, mevcut hesap
   eşitlemesiyle (`/api/hesap/`) `lifeos.kullanim` anahtarını PC'ye taşıyıp sunucu `kalite/veri/yerel/kullanim.json`'a
   mı yazsın, yoksa Ayarlar'da «kullanımı dışa ver» mi olsun? Telefonla PC'nin sayımları birleşecek mi
   (bugünkü biçimde gün başına toplanabilir)?
3. **Anlama örneklemi.** İşaret yalnız yanlışları topluyor. Değer için doğru anlaşılan mesajlardan da örnek
   gerekiyor. Seçenek A: King cevaplarından rastgele yüzde birkaçına «doğru mu anladım?» sorusu (işaretsiz satır
   olur). Seçenek B: eğriyi «yanlış anladın oranı = işaretli / King cevabı» olarak tanımlamak. Payda kullanım
   sayacından gelir (`arac/king` gibi bir kimlikle sayılırsa). Bugünkü kod A'ya uygun; B, eğrinin tanımını değiştirir.
4. **Hız tavanları.** Plan sayı vermiyor. Kabuk açılış yükü ≤ 1 MB ve alan paketi ≤ 2,5 MB benim seçimim
   (gerekçe Hız bütçesi bölümünde). Sahibin onayı ya da başka sayı gerekir. Akademik paketi (2,2 MB) bölünürse
   alan tavanı ≈ 100 KB'a inebilir.
5. **Kırmızı bayrak eşikleri.** 6 örüntü ve 60 tek ölçüm eşiği yeni sistemde yok. Öneri: `alan/tahlil/kural.json`
   (veri) + Kayıt motorunda eşiği çağırandan alan saf bir `bayrak()` işlevi + eski sabitlerle karşılaştıran test.
   Bu iş SPİ'nin kapanış kapısına bağlanmalı.
6. **Piksel bölünmesi.** Koyu palet hangisi (piksel.css mi, onaylı maket mi)? Jeton adları hangisi? Kimlik
   `piksel-yazi.css`'e mi girsin (dosya sayısı ve `kopya_dosya` bütçesi değişmez)?
7. **Belge tazeliği.** `belgeler/ekip/sadelesme/faz4-egriler.md` ve `faz4-olcum.md` hâlâ
   `kalite/veri/anlama.jsonl` yolunu anıyor. Belge benim dosyam değil; koordinatör tek satırla
   `kalite/veri/yerel/anlama.jsonl` yapabilir.
