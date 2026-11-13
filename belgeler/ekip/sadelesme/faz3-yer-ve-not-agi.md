# Faz 3 · Yer belirleme, kapıda kalınca Tekrar, Not ağı

Kabuk paketi. Dal `sadelesme`, çalışma ağacı `C:\Users\ASUS\LifeOs-sadelesme`. Commit yok; koordinatör okuyup commit eder.

## Özet

Üç iş bitti; kural motorda, çizim kabukta.

1. **Seviyemi bul** (§4.3): boş alanda «Baştan başla / Seviyemi bul». Aşama başına 5–8 ünite kapı sorusu, kolaydan zora; 2/3 altında durur. Geçilen aşama «atlandı», `tahmin` etiketli, «öğrenildi» değil. İlk ölçülen ünite kapısı tahmini siler. Dil ve Müzik'te «üretim görevi bekliyor».
2. **Kapıda kalınca Tekrar**: kapıda yanlış ve boş sorular kaynağıyla kart olur, kimlikle tekil. Kapıda doğru cevap gösterilmez; Tekrar'da açılınca görünür.
3. **Not ağı**: Not ekranında `Not.ag()` verisinden SVG düğüm-kenar çizimi. Bağımlılık yok. Düğüm bağlantıdır, klavyeyle açılır. Renkler kabuk tokenlarından.

Önceki koşudan kalan kırmızı test: testin beklentisi «kolaydan zora» kuralıyla çelişiyordu; **test düzeltildi** (ayrıntı aşağıda).

Değişen dosyalar: `motor/yol.js`, `motor/yol.test.js`, `kabuk/kabuk.js`, `kabuk/araclar.js`, `kabuk/kabuk.css`, `kabuk/kabuk.test.js`, `tools/kabuk_gez.js`, bu rapor.

## Yer belirleme

Plan: `icerik-hatti.md` §4.3. Kural motorda (`motor/yol.js`), çizim kabukta.

**Motor (bitti, test yeşil).** Yeni açık arayüz:

- `Yol.yerlestirmeSorulari(y)`: aşamanın ünite kapılarından 5–8 soru. Hedef = ünite sayısının iki katı, 5 ile 8 arasında. Ünite hedeften çoksa eşit aralıkla seçilir (Akademik: 30 üniteden 8'i, ilk ve son dahil; ölçüldü). Sorular ünite sırasıyla, ünite içinde `seviye`ye göre kolaydan zora. Etiketsiz soru «orta» sayılır. Ünitelerden 5'ten az soru çıkarsa aşama kapısından tamamlanır.
- `Yol.yerlestirmeDegerlendir(y, cevaplar)`: doğru sayısı, oran, eşik 2/3. Boş cevap yanlış sayılır.
- `Yol.yerlestir(ys, kayitlar, cevaplar, zaman, ayar)`: aşamaları sırayla ölçer, eşiğin altına düşülen ilk aşamada durur. Yalnız boş kayıtta çalışır (`Yol.bosMu`). Geçilen aşamanın kaydına `yerlestirme: {sonuc:'atlandi', etiket:'tahmin', …}` ve `asamalar[id] = {yerlestirme: zaman}` yazar. `gecti` YAZILMAZ: atlanan aşama «öğrenildi» sayılmaz, yalnız sonrakini açar.
- Atlanan aşamanın üniteleri açıktır (önkoşul karşılanır), `durum()` onları `atlandi: true` verir; ayrı satır `ilerleme.atlananUnite` (etiket `tahmin`). Geçilen ünite ve aşama ilerlemesine girmez.
- Atlanan ünitenin alıştırmaları tekrar adayı çıkarmaz; ünitenin kapısı ölçülerek geçilince çıkarır.
- `Yol.tahminSil(kayit, zaman)`: ilk ölçülen ünite kapısı geçilince `kapiDene` bunu kendi kaydı için çağırır. Etiket silinir, `olcum` zamanı yazılır.
- Beceri alanı (`ayar.uretim`): atlanan aşamaya `uretim: 'bekliyor'` yazılır. Üretim görevi uydurulmaz.
- Eski kayıt: `yerlestirme` alanı olmayan kayıt eskisi gibi okunur (test var).

**Kırmızı test (önceki koşudan kalan).** «yerleştirme soruları» testi ünite içinde `ileri` sorunun etiketsiz sorulardan ÖNCE gelmesini bekliyordu. Kod etiketsiz soruyu «orta» sayar; o zaman «ileri» sona gider ve üç yerlik ünitede dışarıda kalır. Plan «kolaydan zora» der; testin beklentisi bu kuralla çelişiyordu. **Test düzeltildi, kod değil.** Gerçek içerikte karışık yok: Akademik'te her kapı sorusu `orta` ya da `ileri`, öteki alanlarda hiçbiri etiketli değil (ölçüldü).

**Kabuk (bitti, gezi yeşil).** `kabuk/kabuk.js`:

- Alan sayfası: alanın bütün aşama kayıtları boşsa (`Kabuk.Asama.yeniMi` → `Yol.bosMu`) üstte «Nereden başlayalım?» kutusu: «Baştan başla» (ilk ders) ve «Seviyemi bul». Bu sırada alttaki «Başla» düğmesi çizilmez (iki kez aynı düğme olmasın). Herhangi bir kayıt olunca kutu kaybolur; ek durum tutulmaz.
- `#/alan/<id>/yer/<n>`: aşama n'nin yerleştirme soruları, kapı formuyla aynı görünüm. Aşama sayısı yüklenen dosyalardan (`asama-1..N.json`, haritadaki `asama` sayısına kadar, ilk eksikte durur). Doğru cevap gösterilmez. Eşik tutarsa sonraki aşamaya geçer; tutmazsa ya da son aşamaysa sonuç yazılır.
- Ara cevaplar yalnız bellekte durur; sayfa yenilenirse akış birinci aşamadan başlar. Kayda yalnız sonuç yazılır (`Kabuk.Asama.yerlestir` → `Yol.yerlestir`).
- `#/alan/<id>/yer/sonuc`: «Başlangıç: Aşama N.» ve `tahmin` etiketi; aşama başına doğru/toplam, «atlandı» ya da «buradan». Dil ve Müzik'te (beceri alanı) «Yerleştirme tahmini; üretim görevi bekliyor.» kutusu.
- Atlanan aşama listede «atlandı · tahmin», üniteleri «atlandı (tahmin)» ve açık. Tahmin silinince «atlandı» kalır, etiket düşer.
- Ünite kapısı ölçülerek geçilince `Kabuk.Asama.tahminSil` alanın BÜTÜN aşama kayıtlarındaki tahmini siler (motor yalnız o aşamanın kaydını görür).
- Kaydı olan alanda `yer/1` açılırsa «Seviye yalnız hiç başlanmamış alanda bulunur» der.
- Beceri alanları kabukta sabit: `BECERI = { dil, muzik }` (§4.3/5).

## Kapıda kalınca Tekrar

**Motor (bitti, test yeşil).** `Yol.kapiTekrarAdaylari(y, kapiId, cevaplar)`: yanlış ve boş bırakılan kapı soruları. Kimlik = sorunun kimliği. Kaynak taşır: `{id, kapi, unite, asama, icerik}`. Doğru cevabı döndürmez.

**Kabuk (bitti, gezi yeşil).**

- Karar: kapı geçilse de kalınsa da yanlış ve boş sorular karta düşer (görev metni «yanlış cevaplanan sorular» diyor; geçilen kapıdaki yanlış da bir boşluktur).
- `kabuk.js` `kapiBitir` → `Kabuk.kapiTekrar` (`araclar.js`) → `Yol.kapiTekrarAdaylari` → `kartlariEsitle`. Tekilleştirme kart kimliğiyle: aynı soru ikinci kez eklenmez (test var).
- Kart kaynağı: `kaynak:'kapi'`, `alan`, `asama`, `unite` (aşama kapısında `null`), `kapi`, `icerik`. Ön yüz soru, arka yüz doğru seçeneğin metni.
- Kapı sonuç kutusu: «N soru Tekrar'a düştü; doğru cevabı orada görürsün.» ve «Tekrar'a git» düğmesi. Kapıda doğru cevap gösterilmez (gezi denetler).
- Tekrar ekranı: bugünkü bütün içerik `taslak` (ölçüldü 2026-11-14: 14 aşama dosyasındaki 1141 ünite kapı sorusunun hepsi taslak). AGENTS §0.1 gereği taslak kart tekrara (FSRS kuyruğuna) girmez. Bu yüzden kapı kartları ayrı bir bölümde durur: «Kapıda kalınan sorular (N)», her biri kaynağıyla («Felsefe · <ünite> kapısı · taslak»). Satır açılınca doğru cevap görünür. İçerik onaylanınca kart normal kuyruğa girer, «Bütün kartlar» listesinde kaynağı yazar.

## Not ağı

- Yer: Not liste ekranının altı (`#/motor/not`), «Not ağı» bölümü. En az 2 not varsa çizilir.
- Veri: `Not.ag(notlar)` (düğüm + kenar; bağ, etiket, çelişki). Motor değişmedi.
- Yerleşim: `Arac.agYerlesim(ag, en, boy)` (`kabuk/araclar.js`), saf ve belirlenimci. Halkadan başlayan basit kuvvet yerleşimi (itme k²/d, yay d²/k, merkeze çekim). Adım sayısı kalabalıkta düşer (≤50 not 200, ≤150 not 120, üstü 60). Sonda çerçeveye sığdırılır; kenara yığılma olmaz.
- Hız: 300 not, 200 bağ → yerleşim 45 ms (ölçüldü, Node, bu PC; ilk koşuda 89 ms ölçüldü). Çizim tek SVG, her düğüm bir `<a>`.
- Erişim: her düğüm `<a href="#/motor/not/<id>">`, `aria-label` = ad + bağ sayısı, `<title>` ipucu. Sekme ile gezilir, Enter notu açar (gezi denetler). Odakta ve üstünde düğüm vurgu rengiyle dolar.
- Görünüm: renkler yalnız var olan tokenlarla (`--yuzey`, `--yuzey-2`, `--cizgi`, `--cizgi-guclu`, `--vurgu`, `--ana`, `--yazi`); açık/koyu tema kendiliğinden. Çizgi: bağ; kesik: aynı etiket; kalın kesik `--ana`: çelişki. 40 nottan kalabalıkta adlar gizlenir, üstüne gelince ya da odakta görünür. Telefonda yazı SVG biriminde büyür (~11 px).
- «Sisteme not» (her araçtan not bırakma): yapılmadı, Eksikler'de.

## Testler

Hepsi 2026-11-14'te bu ağaçta koşuldu (ölçüldü).

| Komut | Sonuç |
|---|---|
| `node kabuk/kabuk.test.js` | 44 geçti, 1 kaldı — kalan benim değil, aşağıya bak |
| `node kabuk/deneme.test.js` | 6 geçti, 0 kaldı |
| `node kabuk/tanisma.test.js` | 25 geçti, 0 kaldı |
| `node motor/yol.test.js` | 24/24 |
| `node motor/tekrar.test.js` | 21/21 (dokunulmadı) |
| `node motor/not.test.js` | 27/27 (dokunulmadı) |
| `node tools/kabuk_gez.js` | hepsi geçti: 173 ✓, 0 ✕ |
| `python kalite/katman_test.py` | TAMAM, 0 hata |
| `PYTHONDONTWRITEBYTECODE= python kalite/katman_test.py` | TAMAM, 0 hata |
| `python kalite/olcum.py --denetle` | Bütçe tamam: 28 bütçe, aşım yok |

- `olcum.py --denetle temiz` argümanı kabul edilmiyor («unrecognized arguments: temiz»); `--denetle` koşuldu.
- **kabuk.test.js'teki tek kırmızı:** «harita: on alanın onu da taşındı…» → «akademik: asama-2.json var ama haritada asama 1». Neden: içerik ajanları şu an `alan/akademik/asama-2.json` (ayrıca beslenme, hareket, muzik, uyku) yazıyor; dosyalar izlenmiyor (`??`). Harita sayısını yükseltmek içerik bitince koordinatörün işi; `alan/`'a ve haritanın aşama sayısına dokunmadım. Akademik dosyası gelmeden önce bu koşuda 44/44 geçmişti (ölçüldü).

Yeni testler:

- `motor/yol.test.js` (+7): yerleştirme soruları (sayı, kaynak, sıra, Akademik'te 30'dan 8), eşik 4/6 – 3/6, atlandı ≠ geçildi, ilk kalınan aşamada durma, yalnız boş kayıt, beceri alanı, atlanan ünite tekrara girmez, tahmin silme, eski kayıt, kapı tekrar adayları.
- `kabuk/kabuk.test.js` (+3): yerleştirmenin depoya yazılması ve tahminin bütün aşamalarda silinmesi; kapı kartının kaynağı ve tekilleşmesi, taslak kartın planlanmaması; ağ yerleşimi (çerçeve, belirlenim, bağlı çift yakın, 300 not süresi).
- `tools/kabuk_gez.js` (+19 denetim, 154 → 173; hesaplandı): kapı sonucunda «4 soru Tekrar'a düştü», kapıda doğru cevap yok; Tekrar'da 4 kapı kartı kaynağıyla, açılınca doğru cevap; Not ağı 2 düğüm 1 bağ, Sekme+Enter ile not açılır; Dil'de «Seviyemi bul» yürüyüşü (ayrı tarayıcı bağlamı: aşama 1 bilinir, aşama 2'de kalınır, kayıt `atlandi`/`tahmin`, `gecti` yok, üretim notu, atlanan üniteler açık, yeniden yerleştirme reddi, ünite kapısı geçilince iki aşamada tahmin silinir, konsol temiz). Yeni ekranlar telefonda yatay taşmaz (4 görünüm).

Ekran görüntüleri (1280 koyu + 390 açık): `belgeler/ekip/sadelesme/kabuk-onizleme/` altında, adları `yer-` ile başlar.

## Eksikler

- **Harita sayısı:** yeni `asama-2.json` dosyaları (akademik, beslenme, hareket, muzik, uyku) haritada hâlâ `asama: 1`; kabuk onları istemez, yerleştirme de görmez. İçerik bitince `kabuk/harita.js` sayıları yükseltilmeli (kabuk.test.js'teki tek kırmızı bu).
- **Üretim görevi** (§4.3/5): yalnız dürüst işaret var («üretim görevi bekliyor»). Görevin kendisi (3 cümle yaz / akor geçişi) ve sonucu kaydetme yok. Beceri alanları kabukta sabit (`dil`, `muzik`); içerik verisinde bir alan alanı olsa daha doğru olur.
- **Taslak kapı kartları** tekrar kuyruğuna girmez (AGENTS §0.1). İçerik onaylanana kadar yalnız «Kapıda kalınan sorular» listesinde durur. Bu listeden kart silinemez; soru sonra doğru cevaplansa da kart kalır (kapandı işareti yok).
- **Kapı kartının yeniden doğması:** kişi onaylı bir kapı kartını «Bütün kartlar»dan silerse, aynı soru yeniden yanlış cevaplanınca kart sıfırdan döner (tekilleştirme yalnız var olan kartlara bakar).
- **Yerleştirme akışı** ara cevapları bellekte tutar: sayfa yenilenirse birinci aşamadan başlar. Yarım akış kayda hiçbir şey yazmaz (bilerek).
- **Atlanan aşamanın aşama kapısı:** bütün üniteleri ölçülmeden açılmaz (Yol kuralı). Atlanan bir aşamayı «geçildi» yapmak için ünite kapılarını tek tek geçmek gerekir. İstenirse «aşama kapısını doğrudan dene» düğmesi ayrı karar ister.
- **Not ağı:** etiketler (adlar) zaman zaman üst üste biner; yalnız düğüm itmesi var, etiket çakışma çözümü yok. Yakınlaştırma/kaydırma yok. Özel notlar da ağda görünür (yalnız sahip görür; King ağı kullanmıyor).
- **«Sisteme not»** (her araçtan not bırakma): zaman ayrılmadı, yapılmadı.
- `olcum.py --denetle temiz` görevdeki biçimiyle çalışmıyor (bkz. Testler).
