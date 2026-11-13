# Faz 2 — Kabuk (A5) raporu

Tarih: 2026-11-13 · dal `sadelesme` (993c1b13 üstünde, commit edilmedi) · yalnız `kabuk/` ve bu rapor yazıldı.

## Özet
Yeni kabuk eskisinin yanında, `kabuk/` altında, sıfır bağımlılık ve derlemesiz kuruldu. `kabuk/index.html`
doğrudan dosyadan (file://) açılır.

| Dosya | Ne yapar |
|---|---|
| `kabuk/index.html` | Tek sayfa: çerçeve, halka, komut çubuğu yuvaları; `brand/ortak/piksel-yazi.css` (gömülü piksel yazı) ve `motor/yol.js` salt okunur yüklenir |
| `kabuk/kabuk.css` | Jetonlar (açık: `brand/ortak/piksel.css` açık teması; koyu: plan.html maketlerinin `--m-*` değerleri), çerçeve, sayfalar, açılır katmanlar; ayarlardan türeyen kök nitelikleri |
| `kabuk/kabuk.js` | Yönlendirme (hash), sayfalar, basılı tut halkası, komut çubuğu; saf kısım (Türkçe katlama, sıralama, komut öğeleri) Node'da test edilir |
| `kabuk/harita.js` | Sistem haritası kaydı: 24 yer (6 kabuk, 10 alan, 7 motor, King), denetim ve adım hesabı |
| `kabuk/ayar.js` | Tek ayar şeması: 13 ayar; doğrulama, okuma/yazma, sıfırlama, eşitleme dışa/içe aktarımı, kök nitelikleri ve ekran çizimi bu tanımdan türer |
| `kabuk/kabuk.test.js` | 25 test, `node kabuk/kabuk.test.js` |

Ekranlar: Bugün (karşılama A), Öğren / Sağlık / Araçlar dal sayfaları, Sistem haritası, Ayarlar, Felsefe
(Yol motoru yuvası), her alan ve motor için yer sayfası (eski alanlarda «Eski sayfada aç»).

## Kararlara uyum
| Karar (AGENTS §0.1, plan) | Kabukta |
|---|---|
| Kural 2: tek ekran tek iş, tam ekran | Her sayfa tam ekran, bir ana düğme; kenar çubuğu, sekme, kâğıt yaprak, piksel oda yok |
| Kural 3: bir özellik bir yer | Halka, komut çubuğu, harita sayfası ve dal sayfaları aynı `harita.js` listesinden; ayar ekranı, doğrulama, sıfırlama ve eşitleme aynı `ayar.js` satırından |
| Kural 6: önce örnek | Hiçbir şey eski sisteme bağlanmadı; ekran görüntüleri sahibin önüne konuyor, açık sorular aşağıda |
| Kural 8: sayıyı kod üretir | Ekranda uydurma sayı yok: harita sayfasındaki sayılar kayıttan; Felsefe birimleri Yol motorunun `durum()`'undan; okunamazsa boş yuva |
| Karşılama A | Tarih, tek cümle selam, «Sırada: Felsefe · …», tek «Başla» düğmesi |
| Gezinme B (halka + komut çubuğu) | Basılı tut halkası (Ctrl . ve «Yerler» düğmesiyle de) ve komut çubuğu (Ctrl K, «/», «Ara» düğmesi) |
| Piksel kimlik kalır | Pixelify Sans (gömülü, ağsız), kahverengi palet, köşesiz yüzey, iki piksel çizgi, piksel gölge |
| Lego kaydı: her parça kabuğa, motora ya da alana | Haritadaki her satırın `katman`ı kabuk / alan / motor / king |
| Pilot alan Felsefe; on alan | Felsefe `pilot`, öteki dokuzu `eski` ve eski modül bağlantılı |
| Motorlara dokunma | `motor/yol.js` yalnız `<script>` ile okunur; hiçbir motor dosyası değişmedi |

## Çerçeve ve gezinme
- **Çerçeve:** üstte ince şerit (solda tarih ya da «‹ Üst yer / Bu yer», sağda «Ara Ctrl K» ve «Yerler»),
  altında sayfa. Kalıcı gezinme parçası yok (plan §7 önerisi). Gövde 16 px kenar boşluğu, `env(safe-area-inset-*)`.
- **Halka:** boş bir yerde basılı tut (fare 380 ms, dokunma 480 ms; 10 px kıpırdarsa iptal, kaydırma bozulmaz).
  Halka parmağın olduğu yerde açılır, ekrana sığacak biçimde kaydırılır. Basılıyken sürükle, öğe vurgulanır, bırakınca gider;
  kıpırdamadan bırakırsan açık kalır ve ilk öğe odaklanır. Klavye: Ctrl . açar, oklar / Tab / Home / End dolaşır, Esc kapatır,
  odak önceki yere döner. Halkada altı yer: Bugün, Öğren, Sağlık, Not, King, Sistem haritası.
- **Komut çubuğu:** Ctrl K (Mac'te Cmd K) ya da yazı alanında değilken «/». Yerler, ayarlar ve eylemler (koyu/açık tema,
  tema cihaza uysun, halkayı aç, yeni not) tek listede. Boş sorguda halka yerleri ve Ayarlar. Oklar seçer, Enter çalıştırır,
  Esc kapatır. Erişilebilirlik: `role=dialog`, `combobox` + `listbox`, `aria-activedescendant`, sonuç sayısı canlı bölgede.
- **Sıralama (saf, test edildi):** Türkçe katlama (`toLocaleLowerCase('tr')`, sonra ç ğ ı ö ş ü â î û → c g i o s u a i u;
  İ → i, I → ı → i). Puan: tam ad 100, ad başı 80, kelime başı 60, ad içinde 40, açıklamada 20; çok kelimede her kelime
  tutmalı (ortalama). Eşitlikte yer › ayar › eylem, sonra kısa ad.
- **İki adım ölçüsü:** halkadaki yer 1 adım; dal sayfası ya da sistem haritası halkadaysa öteki her yer 2 adım
  (halka → sayfa → yer). Komut çubuğunda her yer, adı yazılınca ilk sırada (1 adım). İkisi de testte.
- **Erişilebilirlik:** «İçeriğe geç» bağlantısı, sayfa değişince odak `main`'e, düğmeler en az 44 px, `:focus-visible`
  çerçevesi (ayarla kalınlaşır), ayar seçimleri `radiogroup` (oklarla değişir), `prefers-reduced-motion` «Cihaza uy»
  kipinde hareketi sıfırlar, «Az» kipinde her zaman; `forced-colors` desteği.
- **Temalar:** `prefers-color-scheme` izlenir; Ayarlar › Tema ya da komut çubuğu ile elle seçilir (`data-theme`), «Saate göre tema» 19:00-07:00 koyu.
- **Bugün:** karşılama A'nın kendisi. «Günün geri kalanı» satırı Plan motoru gelene kadar yer tutucudur.
  İlk açılışta bir kez «basılı tut ya da Ctrl K» ipucu (durum anahtarı `lifeos.kabuk.ipucu`, ayar değil).
- **Felsefe yuvası:** `motor/yol.js` file:// üzerinden yüklenir (`LIFEOS.Motor.Yol` var). İçerik
  `alan/felsefe/asama-1.json` ise `fetch` ile okunur; Chromium file:// üzerinde `fetch`'i engellediği için dosyadan açılınca
  sayfa açıkça işaretli boş yuva gösterir («Sayfa dosyadan açıldı; içerik LifeOS sunucusuyla açılınca yüklenir»).
  Sunucudan açılınca aşama adı ve üniteler (ders sayısı, kilit) motorun `durum(y, bosKayit())` çıktısından çizilir.
  «Başla» ders ekranı bağlanana kadar `aria-disabled`.

## Sistem haritası
`kabuk/harita.js`, satır `{ id, ad, katman, dal, alan?, yol, ikon?, halka?, durum, eski?, aciklama }`.

| Dal | Yerler |
|---|---|
| Ana sayfa | Bugün (halka 1), Sistem haritası (halka 6) |
| Öğren | Öğren (halka 2) · Akademik (eski → AYS), Dil, Felsefe (pilot), Tarih, Müzik, Okuma ve yazı (eski → ESP) |
| Sağlık | Sağlık (halka 3) · Beslenme, Hareket, Uyku, Tahlil (eski → SPİ) |
| Araçlar | Araçlar sayfası · Yol haritası, Tekrar, Not (halka 4) hazır; Soru, Kayıt, Plan, Arama «hazırlanıyor» |
| King | King (halka 5), hazırlanıyor |
| Ayarlar | Ayarlar |

- Eski bağlantılar dosya yollarıdır: `../AYS/dist/rota.html`, `../ESP/dist/esp.html`, `../SPI/dist/spi.html`; tek sunucu
  (A4) gelince adres değişir, tek satır.
- `denetle()` tekil id ve yol, geçerli katman / dal / durum, `eski` satırda bağlantı, halka 3-6 yer ve her yerin halkadan en çok
  iki adımda olduğunu denetler; sistem haritası sayfası bu listeden çizilir (dal başına kart, katman rengi, «halkada» ve durum pulu).
- Ekranda «motor» yerine «Araçlar» yazıyor (iç terim gösterilmesin diye); kayıtta katman adı `motor` kaldı.
- Alan → eski modül eşlemesi (Müzik ve Okuma ve yazı → ESP, Tahlil → SPİ) envanterden çıkarım; sahibi onaylamalı.

## Ayar şeması
`kabuk/ayar.js`, satır `{ anahtar, ad, tur: secim|saatAraligi, varsayilan, secenekler?, esitlenir, aciklama, grup, kok?, kaynak }`.
Türetilenler: `ciz` (ekran), `dogrula`, `oku` (bozuk / geçersiz → varsayılan), `yaz` (geçersizi yazmaz), `sifirla` (tek ya da hepsi,
şema dışına dokunmaz), `disaAktar` (yalnız `esitlenir`), `iceAl` (bilinmeyen, eşitlenmeyen, geçersiz reddedilir), `kokNitelikleri`
(CSS'in okuduğu `data-*`). Anahtar adları eski `lifeos.*` adlarıdır; göçte değer olduğu gibi okunur. `esitlenir` eski katalogdaki
«o» bayrağından (`brand/ortak/animasyon.js` KATALOG).

Yalnız envanterin «tut» dediği satırlar girdi (`envanter-kabuk-sunucu.md`):

| Anahtar | Grup | Envanter satırı |
|---|---|---|
| lifeos.tema.secim, lifeos.tema.oto, lifeos.yazi | Görünüm | §3c «Tema, yazı» |
| lifeos.vurgu | Görünüm | §3b |
| lifeos.boyut, satir, kontrast, odak, altcizgi | Erişilebilirlik | §3b |
| lifeos.hareket | Erişilebilirlik | §3c «Animasyon» (hareket tut) |
| lifeos.rozet | Bildirim | §3b |
| lifeos.sessiz (saat aralığı) | Bildirim | §3c «Ses ve müzik» (sessiz saatler tut) |
| lifeos.kilit.odeme | Hesap ve güvenlik | §3c «Diğer» (eşitlenmez: bayrağı yalnız «t») |

Bilerek dışarıda kalanlar: `lifeos.ice.var` (envanter «tut» diyor ama bir **durum** işaretidir, «veri içe alındı»; §3c sonu «durum
anahtarları şemaya girmez»), `lifeos.sessiz.bitis` (anlık «şimdi sustur» durumu), `lifeos.hareket.hiz` (satırda yalnız «hareket tut»
yazıyor), SORU ve ARŞİV satırları (profiller, müzik, zemin, minikler), King'in 20 anahtarı (King analistine), `sistem/planlama.py`
işleri (sunucu tarafı, `sistem/` başka mühendiste). Yazı tipi seçenekleri Piksel ve Cihazın yazısı ile sınırlandı (piksel kimlik kararı);
eski «modül» vurgu değeri «Alanın rengi» adıyla aynı değer olarak kaldı.

## Ekran görüntüleri
Klasör `belgeler/ekip/sadelesme/kabuk-onizleme/`, 20 PNG: `{karsilama, halka, komut, harita, ayarlar}-{masaustu (1280), telefon (390)}-{acik, koyu}.png`.
Tek headless Chromium (Playwright, `SPI/node_modules`), `file://` ile, sunucusuz; tarayıcı iş bitince kapatıldı. Harita ve ayarlar tam sayfa.
Halka klavye kısayoluyla (ekran ortasında), komut çubuğu «fel» yazılmış hâlde.

Aynı koşuda işlev denetimi (sonuçlar):
- Gerçek fareyle 550 ms basılı tut → halka açıldı; üçüncü öğeye sürükleyip bırak → `#/saglik`'e gitti.
- Ctrl K, «muzik» yaz → ilk sonuç «Müzik · alan», Enter → `#/alan/muzik`.
- `LIFEOS.Motor.Yol` file:// üzerinden yüklendi; Felsefe sayfası işaretli boş yuvayı gösterdi.
- Dört boyut/tema birleşiminde yatay taşma yok; konsolda hata yok.

## Testler
`node kabuk/kabuk.test.js` → **36 geçti, 0 kaldı** (çıkış 0). Kapsam: kayıt geçerliliği (tekil id/yol, on alan, yedi motor ve King,
eski bağlantılar, Felsefe pilot, halkadan ≤ 2 adım, komut çubuğundan 1 adım, bozuk kaydı yakalama), şema türetmeleri (zorunlu alanlar,
varsayılan geçerli, doğrulama, bozuk değerde varsayılan, sıfırlama, eşitleme süzgeci, kök nitelikleri, çizimde kaçış ve radyo
sayısı), sıralama (ç ğ ı İ ö ş ü katlama, aksansız arama, ad başı › kelime başı › açıklama, eşitlikte tür ve kısa ad, çok kelime).

## Kararlar (sahibi, 2026-11-13)
Dokuz açık sorunun hepsi cevaplandı. Yedisi iskeletteki hâli onayladı, ikisi kodu değiştirdi (3 ve 4).

| # | Soru | Karar | Kodda |
|---|---|---|---|
| 1 | Halkada hangi yerler | Altı yer: Bugün, Öğren, Sağlık, Not, King, Sistem haritası. Ayarlar komut çubuğunda ve haritada | değişmedi |
| 2 | «Motorlar» ekranda ne adla | «Araçlar»; iç ad `motor` kalır | değişmedi |
| 3 | Selamda ad | Evet, Hesap'tan (hitap, yoksa görünen ad); oturum yoksa adsız | `kabuk.js` `selam(t, ad)` + `hesapAdi()` |
| 4 | Hareket varsayılanı | «Cihaza uy» (eski «Tam» kararının yerini alır) | `ayar.js` `lifeos.hareket` varsayılan `sistem` |
| 5 | Yazı tipi seçenekleri | İki: Piksel / Cihazın yazısı | değişmedi |
| 6 | Alan → eski modül eşlemesi | Doğru: Müzik ve Okuma ve yazı → ESP, Tahlil → SPİ | değişmedi |
| 7 | Telefonda «aşağı çek» | Yazılmayacak; yalnız «Ara» düğmesi | değişmedi |
| 8 | Halka zemini | Yuvarlak kalır | değişmedi |
| 9 | «Hepsini varsayılana döndür» | Ödeme kilidi dahil hepsini sıfırlar; «s» bayrağı alınmaz | değişmedi |

- Karar 3'ün sınırı: kabuk henüz `brand/ortak/hesap.js`'i yüklemiyor (hiçbir yerden sunulmuyor), bu yüzden ad ekranda
  **henüz görünmez**; kabuk tek sunucuya bağlanıp Hesap yüklendiğinde kendiliğinden gelir. Okunan yer `LIFEOS.HESAP.durum().oturum`.
- Karar 4: eski kullanıcıda kayıtlı değer varsa o geçerlidir; yalnız hiç seçmemiş olanlar «Cihaza uy» ile başlar.
- İki karar testte (`karar: …`); ayarlar ekranının dört görüntüsü yeni varsayılanla yeniden çekildi.

## Felsefe pilotu bağlandı (2026-11-13)
Kabuk artık tek kapıdan sunuluyor ve Felsefe'nin birinci aşaması baştan sona yürünebiliyor.

- **Sunum:** `sistem/tekkapi.py` `/kabuk/` yolunu kapalı listeyle verir: `kabuk/` (.html .js .css), `motor/` (.js), `alan/` (.json) ve iki marka
  dosyası. Test dosyası, `.py`, `.md`, üst klasör ve listede olmayan her şey 404. Tek kapı hâlâ `ETKIN = False`; yalnız deneme portunda açılır.
- **Yol haritası sayfası** (`#/alan/felsefe`): üç ünite, dersleri, ünite kapıları ve aşama kapısı; kilitli olan kilitli görünür,
  ilerleme satırı okunan ders ve geçilen kapıyı sayar. «Başla / Devam et» sıradaki adıma götürür (Bugün sayfasındaki düğme de).
- **Ders ekranı** (`#/alan/felsefe/ders/<id>`): özet, metin, kaynak notu, kaynak listesi (doğrulanmamış olan öyle yazar), alıştırmalar.
  Seçmeli alıştırma anında doğru/yanlış der ve varsa çözümü gösterir; açık uçlu cevap kaydedilir, puanlanmaz, ölçütler ve örnek cevap sonra görünür.
  Onaysız ders «taslak» etiketiyle görünür. «Okudum, sıradaki» dersi okundu sayar.
- **Kapı ekranı** (`#/alan/felsefe/kapi/<id>`): sorular tek formda, doğru cevap gösterilmez; sonuç «3/4 doğru, eşik %75, ölçüldü · sorular taslak»
  biçiminde. Ünite yalnız kapısı geçilince biter; okumak ve alıştırma geçirmez (AGENTS §0.1). Aşama kapısı bütün ünite kapıları geçilince açılır.
- **Kural hep motorda:** kilit, puan ve geçiş `motor/yol.js`'ten gelir; kabuk yalnız çizer. Sıradaki adım `Kabuk.siradaki` (saf, testte).
- **Kayıt:** `localStorage` `lifeos.yol.felsefe.1`, yalnız bu tarayıcıda; cihazlar arası eşitlenmez. Tek depoya P6 göçünden sonra bağlanır.
- **Eski bağlantılar:** sunucudan açılınca `/ays/`, `/esp/`, `/spi/`; dosyadan açılınca eski dosya yolu.
- **Ölçüldü:** `node kabuk/kabuk.test.js` 28/28; `python tools/tekkapi_test.py` (kabuk yolları dahil); `node tools/kabuk_gez.js` 23/23
  (gerçek Chromium, yalıtılmış veri: yanlış ve doğru cevap, üç ders, boş kapı denemesi kalır, dört doğruyla geçilir, yenilemeden sonra kayıt durur,
  ikinci ünite açılır, telefonda yatay taşma yok, konsolda hata yok). Görüntüler: `felsefe-`, `ders-`, `kapi-masaustu-koyu.png`, `ders-telefon-acik.png`.
- **Bağlanmadı:** kaydın tek depoya yazılması (Tekrar aktarımı, Not ekranı ve selamdaki ad sonraki bölümde bağlandı).

## Not ve Tekrar ekranları, selamda ad (2026-11-13)
`kabuk/araclar.js` (kabuk.js'ten önce yüklenir; sayfalar `Kabuk.ek[yerId]` ile kaydolur, `rota()` alt yolu verir).

- **Not** (`#/motor/not`): liste (üstte tutulan önce, sonra son değişen), arama (`Not.ara`; `#etiket` süzer), «Yeni not».
  Düzenleme (`#/motor/not/<kimlik>`): başlık, gövde, «Özel (King görmez)», «Üstte tut», «Başka bir nota bağ ekle» (gövdeye kimlikli
  bağ yazar), «Bu nottaki bağlar» ve «Bu nota bağlananlar». Başlık değişince öbür notlardaki görünen ad tazelenir, takma ad kalır
  (`Not.yenidenAdlandir`). Geçersiz not motorun Türkçe cümlesiyle reddedilir, yazılan kaybolmaz. Silme onay ister.
- **Tekrar** (`#/motor/tekrar`): bugünün kuyruğu motorun planından (önce vadesi gelenler, sonra yeni kartlar; günlük tavanlar).
  Kartın önü, «Cevabı göster», dört not (Yine / Zor / İyi / Kolay) ve her birinin FSRS aralığı. «Yine» aynı gün yeniden sorar.
  Kart ekleme formu; kart listesinde vade ve hatırlama olasılığı «tahmin» etiketiyle. Onaylı ders alıştırmaları cevaplandıkça
  kendiliğinden kart olur (`kartlariEsitle`); içerik taslak olduğu sürece hiçbiri gelmez.
- **Yol haritası** (`#/motor/yol`): taşınan alanların listesi (şimdilik Felsefe, ilerlemesiyle).
- **Selamda ad (karar 3):** kabuk sunucudan açılınca `/parca.js` ve `/hesap.js` yüklenir; ad `LIFEOS.HESAP.durum().oturum`'dan
  (hitap, yoksa görünen ad). Oturum yokken selam adsız. Oturum açıkken adın göründüğü gerçek tarayıcıda denenmedi (yalıtılmış ortamda hesap yok).
- **Kayıt:** `lifeos.not.kayit`, `lifeos.tekrar.kartlar`, `lifeos.tekrar.bugun`; yalnız bu tarayıcıda, eşitlenmez (P6 sonrası tek depo).
- **Ölçüldü:** `node kabuk/kabuk.test.js` 32/32 (not kaydı ve yeniden adlandırma, kuyruk ve cevap, taslak / onaylı kart);
  `node tools/kabuk_gez.js` 44/44. Görüntüler: `not-masaustu-koyu.png`, `tekrar-masaustu-koyu.png`.
- **Bağlanmadı:** nota King önerisi, not ağı çizimi, eski yapılardan not ve tekrar göçü (`Not.goc`, `Tekrar.GOC`; P6 ile),
  Soru / Kayıt / Plan / Arama araçları (motorları yazılmadı).

## Dört alan kabukta: Akademik, Dil, Felsefe, Tarih (2026-11-13)
Felsefe pilotunun yol haritası, ders ve kapı ekranları alan adından bağımsız hâle geldi; içeriği yazılmış her alan aynı ekranlarla açılır.

- **Kayıt:** `kabuk/harita.js` satırında `asama: 1` (taşınmış aşama sayısı; içerik `alan/<id>/asama-1.json`). Dört alan `pilot`, kalan altısı `eski`.
- **Etkin alan:** son açılan alan (`lifeos.yol.son`); Bugün sayfası onunla karşılar, «Başla / Devam et» onun sıradaki adımına gider.
- **Öğrenme kaydı alan başına ayrı:** `lifeos.yol.<alan>.1` (Felsefe'nin eski anahtarı aynı kaldı, kayıt kaybolmaz).
- **Kalabalık alan:** ünite sayısı dördü geçince (Akademik: 30 ünite, 368 ders) üniteler katlanır, yalnız üzerinde çalışılan açık gelir.
- **Yol haritası listesi** dört alanı ilerlemesiyle gösterir; **Tekrar** yüklenmiş her alanın onaylı alıştırmalarını karta çevirir.
- İçerik isteğe bağlı yüklenir (alan açılınca); Akademik dosyası 2,1 MB'tır, yalnız Akademik ya da Yol haritası listesi açılınca iner.
- **Ölçüldü:** `node kabuk/kabuk.test.js` 33/33 (dört alanın içeriği motora yüklenir, ilk adım açık bir derstir, aşama kimliği kayıt anahtarıyla uyumlu);
  `node tools/kabuk_gez.js` 62/62 (her alanda yol haritası, ilk ders, alıştırma, «Okudum»; kayıtlar birbirine karışmıyor; Bugün son alanı gösteriyor).
- **Sınır:** dört alanın bütün dersleri taslak (sahibin onayı bekliyor); Akademik'in 368 dersinden yalnız ilki tarayıcıda açılıp denendi.

## Kayıt ekranı (2026-11-13)
`#/motor/kayit` (`kabuk/araclar.js`): `motor/kayit.js`'in tür tablosundan (16 tür: su, öğün, uyku, hareket, ölçümler, çalışma…) üretilen tek form.

- Alanlar, birimler, sınırlar ve hata cümleleri motordan gelir; ekranda kural yok. Virgüllü sayı kabul edilir; boş bırakılan alan yollanmaz.
- «Sayılar tahmin (ölçmedim)» işaretlenirse sayılar `tahmin` etiketiyle kaydolur, yoksa `ölçüldü` (AGENTS §1.2).
- «Bugün» özeti `Kayit.gunluk`'tan: yalnız verisi olan satırlar, her sayı etiketiyle (toplam `hesaplandı`); veri yoksa sıfır değil «kayıt yok» yazar.
- Bugünün kayıtları listesi ve silme. Kayıt: `lifeos.kayit.kayitlar`, yalnız bu tarayıcıda (P6 sonrası tek depo).
- **Ölçüldü:** kabuk birim testi 34/34 (kayıt ekleme, etiketler, özet), `tools/kabuk_gez.js` 68/68. Görüntü: `kayit-masaustu-koyu.png`.
- **Bağlanmadı:** enerji hedefi, toparlanma, yük ve «günün emri» kuralları (`Kayit.Kural`; profil gerekir), haftalık özet, geçmiş günlere kayıt,
  eski SPİ / AYS kayıtlarının göçü (`Kayit.GOC`, P6 ile). Sağlık alan sayfaları hâlâ eski modüle gider.

## Plan ekranı (2026-11-13)
`#/motor/plan` (`kabuk/araclar.js`): günün planı `motor/plan.js` ile kurulur; ekran girdiyi toplar ve sonucu çizer.

- **Girdiler:** «Boş zamanım» (saat aralıkları), «İşler» (ad, süre, isteğe bağlı son tarih), üzerinde çalışılan alanın sıradaki dersi ve
  Tekrar'ın günlük kart planı. Geçerliliğe motor karar verir: ters aralık, süresiz iş ve nedensiz atlama motorun cümlesiyle reddedilir.
- **Plan:** bloklar saatleriyle (iş, ders, tekrar, mola), sınıf ve devir bilgisiyle; sığmayanlar nedenleriyle listelenir. Özet dakikaları etiketli
  (plan `hesaplandı`, tekrar bloğu `tahmin`). «Yapıldı / Atla / Geri al» `Plan.durumYaz` ile; «Yeniden kur» ilerlemesi başlamış bloğu yerinde bırakır.
- **Gün devri:** ertesi gün yapılan işler listeden çıkar, bitmeyenler `Plan.devret` kuralıyla (kalan süre, devir sayısı) kalır.
- **Bugün sayfası** artık planın sıradaki bloğunu ya da «Günü planla» bağlantısını gösterir.
- Kayıt: `lifeos.plan.durum`, yalnız bu tarayıcıda. Ders süresi içerikte olmadığı için 20 dk varsayılır (kodda `shortcut:` notu).
- **Ölçüldü:** kabuk birim testi 36/36, `tools/kabuk_gez.js` 78/78. Görüntü: `plan-masaustu-koyu.png`.
- **Bağlanmadı:** hafta planı (`Plan.haftaPlani`), şablon günler, sabit bloklar, kısmen yapılan süre girişi, günlük süre sınırı ayarı,
  hareket çarpanı (`Kayit.Kural.gununEmri`), eski AYS planlarının göçü.

Atlananlar (ilk iskelette; ders, Not ve Tekrar ekranları ile sunucu denemesi yukarıdaki bölümlerde kapandı): eski kabuğa bağlantı.
