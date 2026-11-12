# Envanter: kabuk, ayar, tema ve sunucu katmanı

Depo: `C:\Users\ASUS\LifeOs-sadelesme` (origin/main, `d375ef2d`). Salt-okur keşif; kanıt her satırda dosya yolu ile. Bulunamayan şey «göremedim» diye yazıldı.
Karar sözlüğü: KABUK · MOTOR:<motor> · KING · ÇEKİRDEK · ARŞİV · SİL · SORU.

## 1. brand/ortak dosya tablosu

Sayım (`ls brand/ortak`): 228 dosya; 81 `*.test.js`; test dışı **147** (101 `.js`, 44 `.css`, 2 `.md`). Test dışı JS 3 337 811 bayt, CSS 1 101 976 bayt (`cat | wc -c`).
Dağıtım: `tools/ortak.py` `DOSYALAR` 226 girdi (98 `js/core`, 82 `tests`, 44 `css`, `sw.js`→`.`, `providers.js`→`js/data`); iki `.md` dağıtılmaz. `YALNIZ = {"bilinc.js": ()}` (yalnız 4180'de). `KALIPLAR` (`quota.js`, `llm.js`, `providers.js` + 2 test) yayımda `__NS__`/`__DEPO__` yer tutucusu değişir (`YERTUTUCU`: R/rota, SP/spi, ESP/esp) — yani bugün **her dosya 3 kopya**. 4180 Ana sayfa ayrıca kapalı bir listeyle 17 dosyayı doğrudan sunar (`sistem/gun.py` `ORTAK`).
KB = bayt/1000, yuvarlak. Rol = dosyanın ilk satırı (başlık yorumu). «Başka analist» = görev dışı, yalnız sayıldı.

### 1a. Kabuk (iskelet, gezinme, ilk deneyim)
| Dosya | KB | Rol | Öneri | Not |
|---|---|---|---|---|
| kabuk.js | 84 | Üç arayüzün aynı iskeleti: kenar çubuğu, adres, geçiş | KABUK | Yeniden yazılır: kenar → basılı tut halkası + komut çubuğu (§2) |
| kabuk.css | 139 | Üst çubuk, gün şeridi, sayfa başı, bölüm çubuğu, telefon bandı | KABUK | 2 159 satır; deponun en büyük CSS'i, budanmalı |
| parca.js | 10 | Kayıt defteri: sayfa/blok/komut tek parça | KABUK | Tek kabuğun omurgası olarak kalır (§2) |
| parca-rehber.js | 3 | Üretilmiş (`tools/parca.py`), sayfa kayıtlarının `king` alanından | KABUK | Üretilmiş; elle düzenlenmez |
| layout.css | 27 | «Panel değil SİTE düzeni» | KABUK | Tam ekran çerçeveye göre yeniden |
| base.css | 14 | Sıfırlama, tipografi, erişilebilirlik | KABUK | |
| temel.css | 10 | Temel bileşenler v4 | KABUK | |
| hareket.js / .css | 31 / 10 | Hareket ve odak (T4) | KABUK | |
| animasyon.js | 51 | Hareket ayarı Tam·Az·Sistem + `/*KATALOG*/` | KABUK | Katalog JSON'u dosyanın içinde; şemaya taşınabilir |
| kisayol.js / .css | 12 / 4 | Bugün'deki kısa yol şeridi + klavye | KABUK | Komut çubuğuna katılır |
| simge.js / .css | 9 / 3 | Kimlik → görsel tek yeri | KABUK | |
| medya.js | 1 | Üretilmiş künye (`tools/marka.py --kunye`), olmayan görsele istek atmamak | KABUK | |
| sozluk.js | 19 | Tek sözlük + model kapalıyken hazır cümle | KABUK | |
| kilavuz.js / .css | 12 / 3 | Kullanım kılavuzu | KABUK | Sistem haritasına katılabilir |
| yenilik.js / .css | 6 / 1 | «Ne değişti?» | KABUK | |
| pwa.js, sw.js | 17, 8 | Çevrimdışı kabuk, service worker | ÇEKİRDEK | Tek köken olunca tek SW (§5) |
| gorsel.js | 3 | Tek dosya görselsiz açılınca söylemek | SORU | Tek dosya derleme kalırsa kalır, kalkarsa SİL |
| bildirim.js | 18 | iOS kabuğunda yerel bildirim | SORU | iOS kabuğu kalacak mı (§6) |
| tanitim.js / .css | 11 / 10 | İlk kurulumun üç adımlı şeridi | ARŞİV | Yeni kabukla yeniden yazılır |
| patrontur.js / .css | 50 / 10 | Spot ışıklı rehberli tur | ARŞİV | Kenar çubuğuna bağlı; kabuk değişince boşa düşer |
| sinematik.js / .css | 39 / 3 | İlk girişte bir dakikalık piksel film | ARŞİV | Sahneye bağlı |
| karsilama.js / .css | 28 / 18 | Modüle girerken selam + Bugün kapağı | SORU | «Bir ekran bir iş» ile çelişir mi? |
| gizle.js / .css | 66 / 23 | Her sayfada gizlenen/küçültülen bölümler | SORU | Sade kabukta gerek kalır mı? 89 KB |
| ornekkip.js | 5 | Örnek veri kipi | SORU | |
| kilit.js / .css | 15 / 2 | Gizlilik kilidi | ÇEKİRDEK | Hesap katmanına |

### 1b. Ayarlar
| Dosya | KB | Rol | Öneri | Not |
|---|---|---|---|---|
| ayarlar.js | 102 | Bölüm bölüm tek ayar paneli | KABUK | Şemadan üretilecek; bugün elle (§3) |
| ayarlar.css | 45 | Ayar panelinin biçimi | KABUK | |
| ayar.js / ayar.css | 15 / 6 | Ayar ekranlarının ortak davranışı (T5) | KABUK | ayarlar.js ile birleşmeli |
| merkezayar.js | 20 | Ayarlar › King ve bağlantılar veri katmanı | KING | Model geçidi ÇEKİRDEK'e gider |

### 1c. Tema ve sahne (ayrıntı §4)
| Dosya | KB | Rol | Öneri | Not |
|---|---|---|---|---|
| jeton.css | 14 | Ortak jetonlar (v5 görsel dili) | KABUK | Tasarım tokenları |
| kart.css | 82 | Ortak bileşenlerin biçimi | KABUK | |
| cam.css | 106 | «Cam teması silindikten sonra kalan, her temada çalışan kurallar» | KABUK | Ayıklanmalı; adı yanıltıcı |
| piksel.css | 74 | Varsayılan tema | KABUK | Token + bileşen kısmı kalır, sahne kısmı ARŞİV |
| piksel.js | 37 | Temanın tuvali, simgeleri, tepkileri | SORU | Sahneyi çizen kısım ayrılmalı |
| piksel-yazi.css | 36 | Gömülü Pixelify Sans | KABUK | Yazı tipi kalır |
| piksel-yazi-OFL.md | 5 | Yazı tipi lisansı | KABUK | |
| piksel-simge.js | 11 | 12×12 elle çizilmiş simgeler | KABUK | |
| piksel-figur.js | 8 | Logo ve modül yüzleri | KABUK | Modül yüzleri «alan» yüzü olur |
| piksel-apartman.js | 146 | Arka plan binası (asansör, koridor) | ARŞİV | En büyük JS'lerden |
| piksel-doga.js | 74 | Manzara sahneleri | ARŞİV | |
| zemin.js / .css | 41 / 10 | Renk zemini + içerik arkasındaki buzlu levha | ARŞİV | «Kart-sahne üstü» düzeninin kendisi |
| minik.js / minik-cam.css | 78 / 21 | Kartların üstünde yaşayan minikler | ARŞİV | |
| sesler.js | 16 | Minik adımının ses kaydı | ARŞİV | minik ile gider |
| vitrin.js / .css | 136 / 129 | Katalog kartlarını gerçek veriyle çizen kalıp; CSS üretilmiş (`tools/vitrin.py`) | SORU | 265 KB; yeni kabukta hangi kartlar kalacak? |
| pano.js / .css | 19 / 13 | Pano kartları (AGENTS §1.10) | KABUK | |
| grafik.js | 50 | Eksik veriyi sıfır çizmeyen grafik | KABUK | Bileşen |
| sayi.js | 26 | Ekrandaki her sayının kalıbı | KABUK | |
| kesinlik.js / .css | 6 / 3 | Dört kesinlik etiketi | KABUK | |

### 1d. Hesap, depo, eşitleme
| Dosya | KB | Rol | Öneri | Not |
|---|---|---|---|---|
| hesap.js | 260 | PC sunucusuyla giriş ve eşitleme | ÇEKİRDEK | 4 298 satır, en büyük ortak dosya; tek köken+tek depo ile çoğu kalkar (§6) |
| hesap.css | 53 | Bulut düğmesi, panel, giriş ekranı | KABUK | |
| depo.js | 22 | Modüllerin kalıcı depolama katmanı | ÇEKİRDEK | Tek depoya bağlanacak yer |
| guven.js | 15 | Yedek durumu, kalıcı silme kapısı, kayıt geçmişi | ÇEKİRDEK | |
| yedek.js | 5 | Yedek hatırlatma kuralı | ÇEKİRDEK | |
| yedekag.js | 9 | HKM açıkken günde bir yedek | SİL | Tek süreç tek depo olunca gereksiz |
| hkmbag.js | 3 | Bir modülde HKM'ye tek profil | SİL | Ayrı HKM süreci kalkınca |
| hedefag.js | 8 | Hedef özetini HKM'ye taşır | SİL | Aynı depoda okunur |
| olay.js | 6 | Modülün fark ettiğini HKM'ye taşır | ÇEKİRDEK | Süreç içi olay yolu olur |
| qr.js | 12 | Bağımlılıksız QR | ÇEKİRDEK | Cihaz bağlama |
| providers.js, quota.js | 16, 11 | Ücretsiz LLM uçları, kota | ÇEKİRDEK | Model geçidi; `llm.js` başka analistte |

### 1e. Medya
| Dosya | KB | Rol | Öneri | Not |
|---|---|---|---|---|
| ses.js / ses.css | 67 / 8 | İnternet radyosu + tık sesleri | SORU | Öğrenme odağında radyo kalacak mı? |
| muzik.js | 37 | Kendi müzik dosyaları ve listeler | SORU | `sistem/muzik.py` ile çift |

### 1f. Bugün parçaları ve küçük motorlar
| Dosya | KB | Rol | Öneri | Not |
|---|---|---|---|---|
| giris.js / .css | 22 / 3 | Tek satır veri girme kapısı | MOTOR:Kayıt | Komut çubuğunun girdisi olur |
| turkcesayi.js | 4 | Türkçe miktar/süre okuma | MOTOR:Kayıt | |
| olumsuz.js | 10 | Olumsuzluk ve kip süzgeci | MOTOR:Kayıt | |
| ice.js | 13 | Google verisini içe aktarma | MOTOR:Kayıt | `sistem/ice.py` ile çift |
| gunukapat.js / .css | 19 / 3 | Akşam tek ekranda günü kapat | MOTOR:Kayıt | |
| gunveri.js | 11 | Gün sayfasının saf veri katmanı | MOTOR:Plan | |
| tekgun.js / .css | 13 / 3 | Üç modülün bugünü tek çizelgede | MOTOR:Plan | Tek depoda basitleşir |
| hedef.js | 44 | Genel hedef çerçevesi | MOTOR:Plan | |
| aliskanlik.js | 15 | Hedef motorunun alışkanlık paketi | MOTOR:Plan | |
| seri.js | 10 | Seri dondurma, tatil | MOTOR:Plan | seviye ile ilişkili (§7) |
| haftaozet.js | 8 | Haftalık Merkez özeti | MOTOR:Plan | |
| pusula.js / .css | 5 / 1 | Kolay planın iki sayısı | SORU | |
| sorukart.js / .css | 4 / 1 | Bugün'deki «Bir soru» | SORU | |
| olcu.js | 23 | «Bu hafta kaç soru» gibi ölçü soruları | MOTOR:Arama | |
| agharita.js | 10 | İlerlemenin ağ biçiminde yol haritası | MOTOR:Yol | |
| rehber.js / .css | 13 / 5 | Konu anlatımları (SPİ, ESP) | MOTOR:Yol | |
| kavrat.js / .css | 18 / 2 | Görerek/dinleyerek kavratma | MOTOR:Yol | |
| usta.js | 7 | Ustalık çekirdeği | MOTOR:Tekrar | |
| sekil.js / .css | 16 / 1 | Soruda/anlatımda çizim | MOTOR:Soru | |
| notum.js / .css | 12 / 4 | Öğrenme ekranında kendi notun | MOTOR:Not | |
| tarih.js, bicim.js | 6, 3 | Tarih ve biçim çekirdeği | KABUK | Ortak kütüphane |
| sahtesaat.js | 5 | Test yardımcısı | KABUK | Yalnız testler |

### 1g. King, ofis ve başka analistlerin dosyaları (yalnız sayıldı)
| Dosya | KB | Öneri | Not |
|---|---|---|---|
| king.js, king-arac, king-devrim, king-gorunum, king-kart, king-kayit, king-ses, king-yol (.js), kingteklif.js | 92+106+61+83+113+55+60+124+8 | KING | Başka analist |
| king.css, king-cam.css, king-piksel.css | 138+11+12 | KING | `king-cam` ve `king-piksel` sahneye bağlı biçim |
| arac.js, yetki.js, oneri.js, anlatim.js, cikarim.js, kisi.js, envanter.js, hafiza.js | 33+22+42+8+24+16+9+25 | KING | Başlıklar King'e ait diyor |
| llm.js | 62 | ÇEKİRDEK | Başka analist; model geçidi |
| ofis.js, ofissohbet.js / .css, gecmis.js, urun.js | 28+14+11+6+15 | SORU | Ofis/BAM; plan HKM/BAM'ı kaldırıyor (MEMORY: sadeleşme planı) |
| defter.js / .css, bilinc.js, ogret.js, ogrenmotor.js, ogrenmotor-ekran.js, ogrenmotor.css | 138+30+25+18+51+54+4 | MOTOR:Not / MOTOR:Yol | Başka analist |
| OKU.md | 12 | KABUK | Klasörün kuralı |

## 2. Kabuk bugün nasıl çalışıyor

### 2a. kabuk.js: yalnız çizim, gezinti modülde
| Konu | Bugün | Kanıt |
|---|---|---|
| Ne çizer | Üst çubuk, gün şeridi, sayfa başı, bölüm çubuğu, telefon alt bandı, geçiş çizgisi | `brand/ortak/kabuk.js` baş yorumu s.9-20 |
| Sorumluluk sınırı | «Burada yalnız ÇİZİM var… ne bir depoya dokunur ne ağa çıkar»; hangi çekmecede ne olduğunu modül verir | aynı yorum s.22-27 |
| Çekmeceler | 9 sabit: bugun, plan, calisma, ogren, analiz, onaylar, ofis, kutuphane, ayarlar. Kenarda yalnız `ANA_CEKMECE` = bugun, calisma, analiz + Menü | `CEKMECELER`, `ANA_CEKMECE` s.47-58 |
| Modül tablosu | `MODULLER` ays 4173, spi 4183, esp 4193, gun 4180 (`yol:'gun/'`), mer 4200; `SIRA = ays, spi, esp, gun` (Merkez menüde yok) | s.66-73 |
| Modül geçişi | Kenarın üstünde «Sistem değiştir» penceresi; her satır **başka porta** tam sayfa bağlantı. `adres()` port numarasından kurulur; ev ağı kapıları `EV_AGI` 5173/5183/5193. `gecis()` radyoyu devreder (`SES.devret`) ve animasyon tercihini **adres parametresiyle** karşı kapıya taşır (`ANIMASYON.tasimaEkle`) çünkü «kapılar ayrı köken, depoları ayrı» | `modulGecisi` s.259, `adres` s.131-142, `gecis` s.1111-1135 |
| «Kartlarım» | Kenardan 4180'e dönüş bağlantısı (`girisAdres`) | s.281-284, s.144-148 |
| Kenarın daralması | `lifeos.kenar` anahtarı, cihaz başına | `KENAR_ANAHTAR` s.1141-1160 |
| Dışa açılan API | `L.KABUK` 40+ ad: `ustCubuk, kenarCubugu, ustSerit, iskeletV5, gunSeridi, sayfaBasi, bolumCubugu, altBant, menuSayfasi, modulMenusu, bildirimPaneli, hizliEkle, katmanAc/Kapat…, gecis, adres` | s.1384-1393 |
| Sayfa içi gezinti | **URL yok.** Her modülde kendi `go(route)` → `S.route` + `render()`; `hashchange`/`history` kullanan modül dosyası göremedim (grep boş) | `AYS/src/js/app.js` `go` s.790, `render` s.660; SPI s.988/835; ESP s.769/620 |
| Menü kaynağı | Modül `PARCA.menu(modul, K.CEKMECELER)` ile menüyü sayfa kayıtlarından üretir | `AYS/src/js/app.js:142`, `SPI/src/js/app.js:128`, `ESP/src/js/data/sections.js:39` |

### 2b. parca.js kayıt defteri
| Tür | Zorunlu alan | Ek alan / davranış | Kanıt |
|---|---|---|---|
| `sayfa` | `id`, `modul`; menüdeyse `ad` | `cekmece`, `sira` (100), `izgara` ([]), `ikon`, `ek`, `king` (King rehberi `tools/parca.py` ile `parca-rehber.js`'e üretilir) | `parca.js` s.43-48, s.21-22 |
| `blok` | `id`, `sayfa`, `yer`, `ad`, `ciz` | `sira`, `kosul`; hata veren blok yerinde tek satır söyler | s.50-54, s.100-118 |
| `yazi` / `yazilar` | kimlik → cümle | `{ad}` yer tutucusu | s.56-64 |
| `bilgi` | `id`, `etiket`, `oku` | etiket kesinlik listesinde olmalı; okunamayan «veri yok» | s.66-71 |
| `komut` | `modul`, `sira` + `run` ya da `uret` | palet sırası `modul:sira` tekil | s.170-187 |
| `tepki` | `id`, `olay`, `ad`, `yap` | `lifeos:<olay>` dinler | s.189-202 |
Kural: aynı kimlik iki kez → hata («YANLIŞ KAYIT SESSİZ GEÇMEZ», s.27).

Kayıt sayıları (modülün kendi dosyaları, `--exclude-dir=core`; desen `\b(P|PARCA)\.<tür>\(`):
| | sayfa | blok | komut | bilgi | tepki |
|---|---|---|---|---|---|
| AYS | 29 | 160 | 35 | 3 | 0 |
| SPI | 20 | 76 | 9 | 0 | 0 |
| ESP | 18 | 54 | 17 | 0 | 0 |
| brand/ortak | 12 | 14 | 8 | 7 | 11 |
Not: desen `L.PARCA.x(` gibi başka takma adları kaçırabilir; sayılar alt sınırdır.

### 2c. brand/parcalar.txt (yükleme sırası)
`tools/parca.py --yay` okur, üç modülün `src/index.html` ve `src/tests/index.html` etiket bloklarını yeniden yazar (`tools/parca.py` docstring); `tools/ortak.py --yay/--denetle` onu çağırır; `AYS|SPI|ESP/build.py` `[tembel]` bölümünü okur (`AYS/build.py:61`). Satır sonunda modül adı yoksa üçüne yüklenir.
| Bölüm | Satır | Üçüne | yalnız ays | spi | esp | Hedef |
|---|---|---|---|---|---|---|
| [bas] | 61 | 57 | 1 | 2 | 1 | `<head>` stil sırası |
| [govde] | 344 | 123 | 93 | 70 | 74 | `<body>` betikleri |
| [test] | 585 | 216 | 150 | 123 | 129 | tests/index.html |
| [tembel] | 26 | 0 | 21 | 1 | 4 | ilk erişimde çalışan ağır veri |
(sayım: `awk` ile boş ve `#` olmayan satırlar; dosya 1 036 satır.)

### 2d. Üç modül + giriş sayfası + Ana sayfa
| Parça | Nerede | Ne |
|---|---|---|
| AYS / SPİ / ESP | 4173 / 4183 / 4193 (`sistem/sunucu.py` `SISTEMLER` s.98-105), her biri kendi `src/index.html` ve tek dosya `dist/rota.html`, `spi.html`, `esp.html` | Ayrı köken = ayrı localStorage; her biri ortak dosyaların kendi kopyasını yükler |
| Giriş (4180 `/`) | `sunucu.py` `GIRIS_SAYFASI` s.578-1447 (870 satır gömülü HTML), `giris_html()` s.1457 | Hesap girişi + kart seçimi (`KARTLAR`: ays, spi, esp, hkm s.563-568) |
| Ana sayfa (4180 `/gun/`) | `sistem/gun.py` `GUN_SAYFASI` (1 567 satırlık dosya), `gun_html()` | Çerezde `lifeos_hesap=` varsa `/` → 302 `/gun/` (`sunucu.py` ~s.1950). Modüllerle aynı `kabuk.js` kenar çubuğunu kullanır; ortak dosyaları `/gun/ortak/` altından kapalı listeyle sunar (`gun.py` `ORTAK`, 17 dosya). Docstring: «Gün 4180 kökenindedir, modüllerin kaydını okuyamaz» |
| Merkez (4200) | HKM, ayrı Python süreci | Kenarda yok (`SIRA`), bildirim kimliği için durur |

### 2e. Tek kabuk için ne yeniden kullanılır, ne üç uygulamaya bağlı
| Yeniden kullanılır | Üç uygulamaya bağlı (değişmeli) |
|---|---|
| `parca.js` (kayıt, `menu`, `komutlar`, `tepki`, hata yalıtımı) — tek kabuğun omurgası olabilir; `modul` alanı «alan» olur | `MODULLER`/`EV_AGI`/`adres()`/`girisAdres()`/`modulGecisi()`/`gecis()` — port ve köken üstüne kurulu; tek kökende tamamen gider |
| `katmanAc/katmanKapat` (tek katman yöneticisi), `sayfaBasi`, `bolumCubugu`, `bildirimPaneli`, `hizliEkle` | Üç ayrı `app.js` `go()/render()` (2 366 + 2 280 + 2 559 satır, `wc -l`) — tek yönlendiriciye (tercihen URL'li) inmeli |
| `parcalar.txt` sıralama fikri (tek liste) | `parcalar.txt` sütunu `ays/spi/esp` + `tools/ortak.py` 3 kopya + `YERTUTUCU` ad alanları (R/SP/ESP) — tek uygulamada kopya ve yer tutucu gerekmez |
| `kisayol.js` + komut paleti (`komut`) → yeni komut çubuğu | `animasyon.js tasimaEkle` ve `ses.js devret` gibi «karşı kapıya adresle taşıma» köprüleri |
| | `gun.py` + `GIRIS_SAYFASI`: Python dizesine gömülü iki ayrı sayfa (kendi CSS'leriyle) — tek kabukta sıradan sayfa olur |

## 3. Ayar envanteri ve tek şema taslağı

### 3a. Bugünkü yapı (sayılarla)
| Parça | Ne | Sayı | Kanıt |
|---|---|---|---|
| Ayar kataloğu | `KATALOG` JSON: anahtar → bayrak (t taşınır · p profile girer · s sıfırlanır · o PC'de ortak) | **72 anahtar**; t 64 · p 39 · s 20 · o 42 | `brand/ortak/animasyon.js` s.257-336 |
| Seçimler | `SECIMLER`: tek anahtarlı, köke `data-*` niteliği yazan tercihler (anahtar, kök, varsayılan, değerler, adlar) | **15** | `brand/ortak/ayarlar.js` s.405-428 |
| Bölümler | `BOLUMLER` 12: profil, gorunum, ses, hareket, erisim, king, merkez, bildirim, sistem (Sistem) · modul (Bu modül) · hesap, baglanti (Hesap). Kodda ayrıca `ekip` (Minikler) çizici var ama `BOLUMLER`'de yok | 12 (+1) | s.361-374, s.741 |
| Hesap/bağlantı sayfaları | `HESAP_SAYFALARI` 6 (guvenlik, ikiadim, cihazlar, etkinlik, yedek, verin) · `BAGLANTI_SAYFALARI` 5 (baglantilar, bagla, anahtarlar, gelen, takvim) | 11 | s.622-637 |
| Sunucu kopyası | `sistem/ayar.py` `ANAHTAR` = katalogdaki `o` bayraklı desenler; en çok 120 anahtar, değer 4 KB (profiller 60 KB) | 42 desen | `ayar.py` `_katalog` s.33-45, docstring |
| Ortak koddaki tüm `lifeos.*` dizeleri | test dışı `brand/ortak/*.js` | **95** benzersiz; 68'i katalogda, **27'si değil** | sayım betiği (regex `['"]lifeos\.[a-z0-9.-]+['"]`) |
| 4180 / Ana sayfa anahtarları | `sistem/sunucu.py` + `sistem/gun.py` | 15 (8'i katalog dışı) | aynı betik |
| Modülün kendi dosyaları | AYS/SPI/ESP `src/js` (core hariç) | `lifeos.*` anahtarı **0** (kendi ad alanları) | aynı betik |

**Bulgu — TEKNIK.md eskimiş.** `belgeler/TEKNIK.md` «Ortak ayarlar» (s.377-387) yeni tercih için altı yere dokunulur diyor; kodda bunların beşi zaten `KATALOG`'dan türetiliyor: `TASINAN = katalogListe('t')` (`animasyon.js` s.338), `ORTAK` regex'i `o` bayrağından (s.374), `PROFIL_KAPSAR = katalogListe('p')` (`ayarlar.js` s.484), `SIFIRLANAN = katalogListe('s')` (s.610), `ayar.py ANAHTAR` aynı tablodan (s.33-45). Elle kalan tek yer `SECIMLER` (+ panel satırının HTML'i).

**Bulgu — 8 seçimin denetimi çizilmiyor.** `secimHtml` yalnız `boyut` (2 kez: s.699 Görünüm ve s.721 Erişilebilirlik), `rozet`, `satir`, `kontrast`, `odak`, `altcizgi` için; `vurgu` kendi `vurguHtml`'i ile. `cam, perde, bulanik, buzluKart, buzluMenu, buzluPencere, isik, kenar` için çağrı göremedim (grep `secimHtml(`, `data-secim` yalnız `ayarlar.js`); `anahtarHtml` (s.464) hiç çağrılmıyor. Değerleri yine köke yazılıyor (s.462).

### 3b. SECIMLER (15)
| Anahtar | Görünen ad | Bugünkü bölüm | Varsayılan | Öneri | Yeni grup |
|---|---|---|---|---|---|
| lifeos.boyut | Yazı boyutu | Görünüm **ve** Erişilebilirlik | normal | tut, tek yerde | Sistem |
| lifeos.satir | Satır aralığı | Erişilebilirlik | normal | tut | Sistem |
| lifeos.kontrast | Kontrast | Erişilebilirlik | normal | tut | Sistem |
| lifeos.odak | Odak çerçevesi | Erişilebilirlik | normal | tut | Sistem |
| lifeos.altcizgi | Bağlantıların altı çizili | Erişilebilirlik | hayir | tut | Sistem |
| lifeos.vurgu | Vurgu rengi | Görünüm › Renk ve cam | modul | tut («modül» rengi → alan rengi) | Sistem |
| lifeos.rozet | Sayaçlar ve noktalar | Bildirimler | acik | tut | Sistem |
| lifeos.cam | (denetim yok) Dolu/Orta/Saydam | — | orta | kaldır (cam teması silindi, `cam.css` başlığı) | — |
| lifeos.perde | (denetim yok) | — | orta | kaldır (sahne park) | — |
| lifeos.zemin.bulanik | (denetim yok) | — | yok | kaldır | — |
| lifeos.buzlu.kart / .menu / .pencere | (denetim yok) | — | acik | kaldır (kart-sahne üstü yok) | — |
| lifeos.isik | (denetim yok) | — | acik | SORU: ne işe yarıyor? | — |
| lifeos.kenar.yuzey | (denetim yok) | — | buzlu | kaldır (kenar çubuğu gidiyor) | — |

### 3c. Katalogun öteki 57 anahtarı (aile aile; bayraklar parantezde)
| Aile | Anahtarlar | Bugünkü bölüm | Öneri | Yeni grup |
|---|---|---|---|---|
| Tema, yazı | tema.secim (tpo), tema.oto (tpso), yazi (tpso) | Görünüm | tut; 4180 levhası da aynı anahtarı yazar | Sistem |
| Animasyon | hareket, hareket.hiz, hareket.bulut (tpo) | Animasyon (+ Erişilebilirlik'te ikinci kez «Animasyonlar») | hareket tut; bulut → sahne ile ARŞİV | Sistem |
| Ses ve müzik | ses, sessiz, ses.duzey (tpo), sessiz.bitis (to), muzik.var (to), muzik.acilis.gun, muzik.yer, muzik.yer.* (o) | Ses ve müzik, Bildirimler › sessiz saatler | SORU (radyo/müzik kalacak mı); sessiz saatler tut | Sistem |
| Zemin, manzara, açılış | zemin (tpso), zemin.onizle.sade (tp), zemin.video (tp), zemin.** (o), manzara (tpso), manzara.gece (tps), manzara.tur.gunduz/gece, manzara.surum (t), manzara.** (o), acilis.video (o), karsilama (t) | Görünüm, 4180 «Arka plan» | ARŞİV (sahne park); değerler silinmez | — |
| Minikler | minik (tpo), minik.ses (t), minik.boy, minik.takim, minik.kapali (tp), minik.* (o) | `ekip` çizicisi (BOLUMLER'de yok) | ARŞİV | — |
| Profiller | profiller, profil.etkin (to) | Profiller (en çok 8, `PROFIL_EN`) | SORU: tek ekran tek işte profil gerekli mi? | Sistem |
| King (20) | king, king.yuz, king.ad, king.gorunus, king.cevap, king.ses, king.hiz, king.algila, king.mik, king.derinlik, king.yan, king.tarz, king.odak, king.bekleyen-kayit, king.merkez-sira, king.yapilacak, king.hatirlat, king.kartlarim, king.sorma, kisi.izin | King ve bağlantılar | King analistine; çoğu tercih değil durum (`t` yalnız) | King |
| Diğer | kilit.odeme (t), ice.var (to), buzlu.* (o) | Güvenlik, Bağlantılar | kilit.odeme, ice.var tut; buzlu.* kaldır | Hesap |

Katalog dışı 27 anahtar (`brand/ortak`): çoğu tercih değil **durum**: `kenar`, `zil`, `ortak.esit`, `karsilama.not/.son`, `rehber.okundu`, `profil.gordu`, `kurulum.kapali`, `telbildirim.atla`, `sinematik.ses`; tercih olanlar: `tema` (zemin.js), `tema.paket`, `profil.tema` (ayarlar.js); 14'ü `lifeos.king.*`/King dosyalarında. 4180/Ana sayfanın katalog dışı 8'i: `giris.ac`, `giris.son`, `acilis.oynadi`, `gun.cumle`, `gun.sen`, `bilinc`, `bilinc.suz`, `bilinc.yorum`.
Öneri: tercih ↔ durum ayrımı şemada açık olsun; durum anahtarları şemaya girmez.

### 3d. Modüle özgü ve sunucu tarafı ayarlar
| Yer | Ne | Öneri | Yeni grup |
|---|---|---|---|
| `cekmece:'ayarlar'` sayfaları | Her modülde 3: `guide` «Genel», profil («Profil»: AYS `profiles.js:79`, SPI `family.js:76`, ESP `profile.js:130`), `rutbe` «Rütbe» (`*/screens/rutbe.js:131`) = **9 sayfa** | Profil → Hesap; Rütbe → §7 kararı; Genel → Alanlar | Alanlar / Hesap |
| Bu modül › `modul` | Gizlilik kilidi (`L.KILIT.ayarHtml`) | Hesap'a | Hesap |
| 4180 ayar levhası | Tema, «Açılınca» (`lifeos.giris.ac`), açılış/arka plan müziği (`/api/muzik/ayar`), arka plan gündüz/gece (`/api/zemin/`) (`TEKNIK.md` s.407-411) | Tema tut; ötekiler ARŞİV/SORU; levha kalkar, tek Ayarlar sayfası | Sistem |
| Planlama | `sistem/planlama.py` `ISLER` 6 iş: guncelleme, yedek, denetim, ozet, temizlik, hkm (her biri saatli) | tut, `hkm` ve `ozet` King/çekirdek kararına bağlı | Sistem |
| Müzik | `sistem/muzik.py` `LISTELER` calisma/spor/arka/genel, `ACILIS_NE` kapali/her/gunde | SORU | Sistem |
| Zemin | `sistem/zemin.py` `YUVALAR` gunduz/gece/acilis | ARŞİV | — |
| King ve bağlantılar | `merkezayar.js` (HKM yapılandırması) | King analistine | King |

### 3e. Tek bildirimsel şema taslağı
Bir tablo (ör. `brand/ortak/ayar-sema.js`, JSON gövdeli ki `ayar.py` bugünkü gibi okusun) — satır başına:
`{ anahtar, ad, aciklama, grup: 'Sistem'|'Alanlar'|'King'|'Hesap', bolum, tur: 'secim'|'anahtar'|'ozel', degerler:{deger:ad}, vars, kok:'data-x'?, profil:bool, sifirla:bool }`
| Bugün elle (TEKNIK.md'nin altı yeri) | Şemadan nasıl |
|---|---|
| 1 `SECIMLER` | `tur:'secim'` satırları; `degerler`, `vars`, `kok` doğrudan |
| 2 `TASINAN` (t) | **Gerekmez**: tek kökende taşınacak karşı kapı yok |
| 3 `ORTAK` regex (o) | Tek depo + tek süreçte istemci-sunucu ayrı kopya gerekmez; eşitleme cihazlar arası tek kanala iner |
| 4 `ayar.py ANAHTAR` | Şemadaki tüm satırlar = izinli anahtarlar (bugünkü gibi dosyadan okunur) |
| 5 `PROFIL_KAPSAR` (p) | `profil:true` |
| 6 `SIFIRLANAN` (s) | `sifirla:true` |
| + panel satırı HTML'i | Genel çizici: `secim` → bugünkü `secimHtml`, `anahtar` → bugün ölü olan `anahtarHtml`; yalnız `ozel` satırlar (King yüzü, profil listesi, hesap sayfaları) kendi çizicisini verir |
| + 4180 levhası | Kalkar: aynı sayfa aynı şemadan |
Kazanç: yeni tercih = tek satır; aynı denetimin iki bölümde çıkması (boyut, Animasyonlar) şemada tek `bolum` olduğu için olamaz; denetimsiz tercih (bugün 8) bir denetimle yakalanır (her `secim` satırı bir bölümde çizilmeli).

## 4. Tema: tokenlar, bileşenler, sahne

### 4a. Sınıflandırma
| Tür | Dosyalar (KB) | Tam ekran çerçevede |
|---|---|---|
| Tasarım tokenları | jeton.css 14 · base.css 14 · piksel-yazi.css 36 (gömülü font) | Olduğu gibi kalır |
| Bileşenler | temel.css 10 · kart.css 82 · layout.css 27 · pano.js/.css 19/13 · grafik.js 50 · sayi.js 26 · kesinlik 6/3 · simge 9/3 · piksel-simge.js 11 · piksel-figur.js 8 | Kalır; `layout.css` «site düzeni» tam ekrana uyarlanır |
| Kabuk biçimi | kabuk.css 139 · hareket.css 10 · ayarlar.css 45 · hesap.css 53 | Kalır ama budanır (kenar çubuğu, gün şeridi, telefon bandı) |
| Karışık (tema + sahne) | piksel.css 74 (618 satır) · piksel.js 37 · cam.css 106 · king-piksel.css 12 | Ayrıştırılmalı (aşağı) |
| Sahne / animasyon | piksel-apartman.js 146 · piksel-doga.js 74 · zemin.js/.css 41/10 · minik.js 78 + minik-cam.css 21 + sesler.js 16 · sinematik 39/3 · karsilama 28/18 · patrontur 50/10 · king-cam.css 11 | ARŞİV: toplam **544 660 bayt** (bu 14 dosyanın `wc -c` toplamı) |

### 4b. Bağlılıklar (sayım)
| Ad alanı | Onu kullanan ortak dosyalar | Modülün kendi dosyası | Kanıt |
|---|---|---|---|
| `L.PIKSEL` | animasyon, hareket, hesap, king-gorunum, patrontur, piksel, sinematik | 1 | grep `(LIFEOS\|L)\.PIKSEL\b` |
| `L.PIKSEL_APARTMAN` / `PIKSEL_DOGA` | piksel.js (`sahneMotor` s.261), sinematik.js; **King odası tuvali** `canvas.king__oda` da apartman'ı çizer (piksel.js s.457) | 0 | grep |
| `L.ZEMIN` | ayarlar, giris, king-yol, muzik, zemin | 0 | grep |
| `L.MINIK` | ayarlar, king-gorunum, king, minik | 0 | grep |
| `L.SINEMATIK` | patrontur, sinematik | 0 | grep |
| `L.KARSILAMA` | animasyon, karsilama | **6** | grep |
| `L.ANIMASYON` | animasyon, ayarlar, hesap, kabuk, king, minik, patrontur, piksel, yetki | 3 | grep |
| `L.SES` | 13 ortak dosya (animasyon … zemin) | 3 | grep |
| CSS `[data-zemin="piksel"]` | piksel.css 361 · king-piksel.css 65 = **426 seçici** | — | `grep -c` |
| CSS `--px-*` | piksel.css 83 · defter.css 3 · king-piksel.css 2 | — | `grep -c` |
| `backdrop-filter` (cam/buzlu) | 45 kural, 15 CSS dosyasında (kabuk.css 10, king.css 8) | — | `grep -c` |

### 4c. Önemli bulgular
| Bulgu | Kanıt |
|---|---|
| Sahne betikleri `<head>`'de yükleniyor: `piksel-apartman.js` + `piksel-doga.js` (220 KB) `[bas]` bölümünde, üç modülde | `brand/parcalar.txt` s.63-68 (`[govde]` s.71'de başlar) |
| Tema tek: `zemin.js KIPLER = ['piksel']` («cam ve Sade kaldırıldı»); `data-zemin` hep `piksel` | `zemin.js` s.71-78, s.135 |
| Piksel görünüşü (yazı, palet, bileşen biçimi) sahne ile aynı anahtara bağlı: 426 seçici `[data-zemin="piksel"]` altında. `data-zemin` kaldırılırsa sahne değil **bütün piksel dili** düşer | `piksel.css`, `king-piksel.css` |
| Ölü nitelikler: `data-cam`, `data-perde`, `data-buzlu-*`, `data-isik` için CSS seçici **0** (yalnız `data-bulanik` 1, `cam.css`) — §3b'deki denetimsiz 8 seçimle örtüşür | `grep -c` tüm `brand/ortak/*.css` |
| `cam.css` adı yanıltıcı: «cam teması silindikten sonra kalan, her temada çalışan kurallar»; 106 KB | `cam.css` s.1 |
| piksel.js sözü: «SÜSTÜR… veri okumaz, yazmaz. Düşerse yalnız duvar düz kalır»; ama «KART ÇEKİLİR: üç dakika işlem olmazsa kart ve menü çekilir, sahne görünür» — kart-sahne üstü davranışı bu dosyada | `piksel.js` s.7-11 |

### 4d. Sahne kapatılırsa ne kırılır
| Adım | Etki |
|---|---|
| `piksel-apartman.js`, `piksel-doga.js` yüklenmezse | `piksel.js` `sahneMotor()` undefined döner; s.314 `!L.PIKSEL_DOGA` korumalı, s.341/457 apartman yolu için koruma göremedim (doğrulanmalı). King odası tuvali boş kalır; `sinematik.js` filmi çalışmaz |
| `data-zemin` kaldırılırsa | Piksel dili tümden gider (426 seçici). Önce piksel.css'i «token+bileşen» ve «sahne» olarak ikiye bölmek gerekir |
| `zemin.js` kalkarsa | `ayarlar`, `giris`, `king-yol`, `muzik` `L.ZEMIN`'e bakıyor; koruma var mı tek tek doğrulanmalı |
| `minik.js` + `sesler.js` kalkarsa | `ayarlar` (`ekip` çizicisi), `king`, `king-gorunum` bakıyor; `tepki` kayıtları (§2b, ortakta 11) minik tepkisi içeriyor olabilir — göremedim |
| `karsilama.js` kalkarsa | 6 modül dosyası `L.KARSILAMA` çağırıyor — en çok modüle dokunan sahne parçası |
| Kart-sahne üstü (`zemin.css` buzlu levha, `backdrop-filter`) kalkarsa | 45 kural; kabuk.css ve king.css en çok |

## 5. Sunucu haritası

### 5a. Süreçler ve kapılar
| Süreç | Kapı | Dinlediği | Açan | Kanıt |
|---|---|---|---|---|
| `sistem/sunucu.py` (tek süreç, iş parçacıkları) | 4173 AYS · 4183 SPI · 4193 ESP (`Sunucu`) | 127.0.0.1 (`HOST`) | `main()` → `_sunucu_kur` her `SISTEMLER` için | `sunucu.py` s.90, s.98-105, s.2385-2453 |
| aynı süreç | 4180 giriş + Ana sayfa (`Giris`) | 127.0.0.1 | `KuyrukluSunucu((HOST, GIRIS_PORT), Giris)` | s.94, s.2406 civarı |
| aynı süreç | 5173 / 5183 / 5193 ev ağı https (`TelefonSunucu`, TLS 1.2+, düz http → 301 https) | 0.0.0.0 (`TELEFON_HOST`) | `telefon_sunuculari()` — ev ağı açıksa | s.2087-2180; `telefon.py` `PORTLAR` s.42 |
| aynı süreç | 5180 kurulum sayfası (http: yönerge + kök sertifikanın açık kısmı) | 0.0.0.0 | `telefon_kurulum_sunucusu()` | `telefon.py` `KURULUM_PORT` s.43; `sunucu.py` s.2309-2365 |
| aynı süreç, iş parçacığı | — | — | `_bekci_dongusu` (60 sn, Merkez bekçisi), `plan_zamanlayici()` (planlama işleri) | s.91, s.1785-1806, s.1684 |
| HKM (ayrı süreç) | 4200 | — | `sistem/baslat.py` (HKM/baslat.py yolunu çağırır; `--hkmsiz` ile açılmaz) | `baslat.py` s.5-19, s.72 |
| Tailscale `serve` (dış süreç) | vekil → yerel kapılar | tailnet | `sistem/uzak.py` | §6 |
| Yalnız komut satırı | — | — | `guncelle.py`, `tasi.py` (şifreli taşıma paketi), `bilgisayar.py` (HTTP ucu yok; `HKM/core/disdunya.py` kullanır) | dosya başlıkları; grep `/api/` boş |

### 5b. Uçlar (path · yöntem · ne yapar · kim çağırabilir)
Ortak kural: yazma uçları özel başlık ister (`X-LifeOS: <alan>`) — tarayıcı başka siteden ön-kontrolsüz gönderemez.
| Yol | Yöntem | Ne | Kim | Kapı | Dosya |
|---|---|---|---|---|---|
| `/api/ayar` | GET, POST | Ortak tercihler; POST yalnız değişen anahtarlar | Yalnız 127.0.0.1; yazma `X-LifeOS: ayar` | 4173/83/93, 4180 | `ayar.py` `isle` s.253 |
| `/api/ayar/esitle` | POST | Cihaz ↔ PC tercih eşitleme (son yazan kazanır) | Yerel, ya da `uzak_izin(h)` doğrulayan uzak cihaz | aynı | `ayar.py` s.259-270 |
| `/api/ice`, `/api/ice/takvim`, `/api/ice/veri` | GET, POST, DELETE | Google iCal + Takeout özetleri | Yalnız 127.0.0.1; yazma `X-LifeOS: ice` | aynı | `ice.py` s.412-419 |
| `/api/muzik`, `/api/muzik/ayar`, `/api/muzik/parca` | GET, POST, DELETE | Yerel müzik dosyaları ve listeler (80 MB/dosya) | Yalnız 127.0.0.1; yazma `X-LifeOS: muzik` | aynı | `muzik.py` s.214-230 |
| `/api/zemin/<yuva>` | GET, POST, DELETE | Arka plan fotoğraf/video (gunduz, gece, acilis) | Yalnız 127.0.0.1; yazma `X-LifeOS: zemin` | aynı | `zemin.py` s.179-196 |
| `/api/planlama` | GET, POST | Zamanlanmış 6 iş | Yalnız 127.0.0.1; yazma `X-LifeOS: planlama` | aynı | `planlama.py` s.341-349 |
| `/api/merkez/ac` | POST | HKM'yi başlat | 127.0.0.1 + `merkez_izinli` (başlık + Origin) | 4173/83/93 | `sunucu.py` s.494-499 |
| `/api/uzak/merkez` | POST | Uzak cihaza Merkez kimliği | Yalnız `uzak.VEKIL_IP` + `X-LifeOS: hesap` + köken | 4173/83/93 | s.500-505 |
| `/`, `/index.html`, `/dist-betik.js`, `/dist-stil.css` | GET | Modül sayfası: `dist` varsa parçalı/gzip (telefona 304), yoksa `src` | Herkes (kapıya ulaşan) | 4173/83/93 (+ev ağı) | s.400-414 |
| `/api/hesap/*` | GET, POST, OPTIONS | Hesap, eşitleme, cihaz, yedek, bağlantılar — **70 farklı yol** (+ `/api/hesap/takvim/<jeton>.ics`) | Bkz. 5c | 4173/83/93, 4180, ev ağı | `hesap.py` `isle` s.2548-2911 |
| `/hesap.js`, `/hesap.css`, `/animasyon.js`, `/qr.js`, `/muzik.js`, `/parca.js`, `/piksel*.js/.css` (13 dosya) | GET | Giriş sayfasının ortak dosyaları | Herkes | 4180 | `sunucu.py` s.1945-1946 |
| `/` | GET | Çerezde `lifeos_hesap=` varsa 302 `/gun/`, yoksa giriş sayfası | Herkes | 4180 | s.1950-1955 |
| `/gun`, `/gun/`, `/gun/ortak/<17 dosya>` | GET | Ana sayfa ve kapalı listedeki ortak dosyalar | Herkes | 4180 | s.1956-1990; `gun.py` `ORTAK` |
| `/api/gun/cumle` | POST | Ana sayfanın günlük cümlesi | — | 4180 | `gun_cumlesi` s.1816 |
| `/api/guncelleme`, `/api/durum` | GET | Güncelleme ve sistem durumu | — | 4180 | s.1985-1988 |
| `/api/guncelle`, `/api/hkm`, `/api/hkm/yeniden`, `/api/yeniden` | POST | Güncelle, HKM aç/yeniden başlat, sunucuyu yeniden başlat | `guncelleme_izinli(basliklar)` | 4180 | s.1914-1930, s.1838 |
| `/logo/*`, `/marka/*` | GET | Logo ve marka görselleri (uzantı listesi `MEDYA_TURLERI`) | Herkes | 4180 | s.1990-1992, s.121 |
Not: 4180 `do_DELETE`, `do_OPTIONS` hesap/ice/muzik/zemin'e yönlendirir (s.1861-1891). Uç sayısı (bu tablodan sayıldı): hesap dışı **19** `/api/` yolu + hesap **70** yol + 1 desen (`takvim/<jeton>.ics`); ayrıca 13 + 17 sabit dosya yolu ve 4 sayfa yolu.

### 5c. Hesap uçlarının yetki katmanları
| Katman | Yollar | Kanıt |
|---|---|---|
| Önce herkes için | Köken denetimi `_koken_izinli`: Origin yok, Host ile aynı, ya da `UYGULAMA_KOKENLERI` = `http://(127.0.0.1\|localhost):(4173\|4183\|4193\|4180)` | `hesap.py` s.2359, s.2396-2404 |
| Oturumsuz | GET `durum`, `ozet`/`ozet.txt` (erişim anahtarıyla), `gelen` (anahtarla); POST `kur` (ilk admin yalnız yerelden), `kayit`, `soru`, `kurtar`, `giris`, `giris-kod`, `bagla`, `gelen`, `yedek-yukle` | dispatcher s.2571-2647 |
| Oturumlu (Bearer jeton) | POST `esitle`, `cikis`, `parola`, `profil`, `cihaz-cikar`, `iki-adim/*`, `bag-kodu`, `anahtar`, `takvim`, `yayin` …; GET `ben`, `tekgun`, `kisi`, `defter`, `gunluk`, `gunkayit`, `bilinc`, `gunsen`, `cihazlar`, `etkinlik`, `disa` … | `d.oturum(_jeton(h), ip)`; `_jeton` yalnız `Authorization: Bearer` (s.2545) |
| Admin | `ayar-esitle`, `sistem`, `sistem-guncelle`, `merkez`, `yedekle`, `yonet`, `kullanicilar` … | `d._admin(k, …)` |
| Admin + yalnız bu PC | `ev-agi-ac`, `sertifika-tamam`, `uzak-ac`, `uzak-kapat`, `uzak-durum`, `uzak-acilis`; geri yükleme ve indirme `_yerel_mi(h)` alır | s.2712-2740, s.2788-2789 |
Oturum ömrü `OTURUM_GUN = 400` gün (s.224); parola PBKDF2-HMAC-SHA256 (s.586); depo `%LOCALAPPDATA%\LifeOS\hesap\hesap.db` SQLite (docstring söz 6).

### 5d. Tek köken + tek süreç ne ister
Bugün ayrı kökene dayanan şeyler (hepsi kanıtlı):
| Ayrı kökene bağlı | Kanıt | Tek kökende |
|---|---|---|
| localStorage köken başına ~5 MB; her modül kendi 5 MB'ı ve «dokuz aylık ufuk» hesabı buna göre | `sunucu.py` docstring s.12-27 | Veri tarayıcıdan çıkıp sunucu deposuna gitmeli (IndexedDB ya da sunucu-öncelikli), yoksa üç alan tek 5 MB'ı bölüşür |
| Veri kökene bağlı: 4173'teki AYS verisi 4180'de görünmez | aynı, madde 1 | **Taşıma adımı şart**: her kökenin deposu bir kez dışa aktarılıp tek depoya alınmalı (hesap eşitlemesi zaten kayıtları PC'ye kopyalıyor: `hesap.py` söz 1-3) |
| Tercihlerin kapılar arası taşınması: `TASINAN` (64 anahtar) adres parametresiyle, ortak 42 anahtar `/api/ayar` ile | `animasyon.js` s.338, s.374; `kabuk.js gecis` | Kalkar |
| Ana sayfa modül kaydını okuyamıyor («Gün 4180 kökenindedir») | `gun.py` docstring | Kalkar; Ana sayfa doğrudan okur |
| Ad alanları `R`, `SP`, `ESP` ve depo önekleri `rota`, `spi`, `esp` | `tools/ortak.py` `YERTUTUCU` | Tek ad alanı; depo önekleri «alan» kimliği olarak kalabilir (çakışma yok) |
| Modül sayfaları ayrı `index.html` + ayrı `dist/*.html` | `parcalar.txt`, `SISTEMLER` | Tek sayfa, alanlar yol olarak |
| Köken izin listeleri: `UYGULAMA_KOKENLERI`, `merkez_izinli`, `adres()`/`EV_AGI` | `hesap.py` s.2359, `sunucu.py` s.1807, `kabuk.js` s.131 | Tek kök + Tailscale adı |
| Service worker kapsamı köken başına | `pwa.js`, `sw.js` | Tek SW |
Gerekenler (sıra önerisi): 1) depo katmanını (`depo.js`) alan önekiyle tek depoya bağlamak; 2) kökenlerden bir kerelik veri taşıma (hesap eşitlemesinin «ilk» bayrağı yeniden kullanılabilir); 3) `Sunucu` + `Giris` + `TelefonSunucu` sınıflarını tek işleyicide birleştirmek (uçlar zaten ortak modüllere düşüyor: ayar/ice/muzik/zemin/planlama/hesap her iki sınıfta aynı); 4) HKM'yi ayrı süreç olmaktan çıkarmak (King analistiyle).

## 6. Cihaz ve güvenlik haritası

### 6a. Bir cihazın bugün bağlanma yolları
| # | Yol | Nasıl | Kökenler / kapılar | Veri nerede | Kanıt |
|---|---|---|---|---|---|
| 1 | Bu PC, tarayıcı | `http://127.0.0.1:4173/4183/4193/4180` | 4 köken | Her kökenin localStorage'ı + `hesap.db` kopyası | `sunucu.py` s.1-27 |
| 2 | Masaüstü kabuğu (Electron) | `sistem/baslat.py`'yi başlatır, penceresinde 4180'i gösterir; depo `%USERPROFILE%\LifeOS-Sistem` | yol 1 ile aynı | aynı | `uygulama/masaustu/main.js` s.1-13, s.40-41 (9 492 bayt) |
| 3 | Tek dosya (`dist/rota.html` vb.) | Dosya olarak açılır; sunucu yok | `file:` | Yalnız tarayıcı deposu; `kabuk.js` öteki modülü «ayrı dosyada açılır» diye kapalı gösterir | `kabuk.js` s.278; `ayar.py` söz 4; `gorsel.js` |
| 4 | Ev ağı https (kendi kök sertifikası) | `python sistem/telefon.py` bir kez: kök + sunucu sertifikası (deponun dışında); modüller 0.0.0.0'da https | 5173 / 5183 / 5193 (+5180 http kurulum, QR) — **3 yeni köken** | Telefonun kendi kökenleri; PC'ye hesap eşitlemesiyle | `telefon.py` s.1-27, s.42-43; `sunucu.py` s.2087-2365 |
| 5 | Tailscale (her yerden) | `tailscale serve` (funnel asla); `KAPILAR = {5173:4173, 5183:4183, 5193:4193, 443:4200}`; vekil istekleri `VEKIL_IP` ile işaretlenir ki «yalnız bu PC» denetimleri açılmasın | `<pc>.ts.net:5173/5183/5193`, `:443` = HKM | Cihaz + PC | `uzak.py` s.1-38, `vekilden_mi` s.42 |
| 6 | iOS kabuğu (AltStore) | Uygulama `dist`'i içine alır, telefonda **kendi yerel sunucusunu** açar (loopback 4173/4183/4193 + 4180); web kodunu PC'siz günceller; ekran kapalıyken konum ve yerel bildirim köprüleri | Telefonda 4 köken | WKWebView deposu + hesap eşitlemesi | `uygulama/ios/LifeOS/YerelSunucu.swift` s.1-39, `KabukDenetleyici.swift` s.1-14, `WebGuncelleme.swift` s.1-16; `belgeler/UYGULAMA.md` s.1-30 |
| 7 | Android web uygulaması | Yol 4 ya da 5 üstünden; her modül ayrı «Kur» → **üç ayrı simge** (üç köken); `sw.js` ile çevrimdışı | 3 köken | Cihaz + PC | `UYGULAMA.md` s.72-84; `belgeler/ekip/yarim/android.md` «Karar» |
| 8 | Kısayollar / Home Assistant | Erişim anahtarıyla tek satır gönderme (gelen kutusu) ve `GET /api/hesap/ozet.txt` (Siri) | herhangi bir kapı | Gelen kutusu → modül onayı | `hesap.py` söz 16, 21 |
| 9 | Takvim aboneliği | Gizli `/api/hesap/takvim/<jeton>.ics` | — | salt okuma | `hesap.py` söz 17, `TAKVIM_YOL_RE` s.294 |

### 6b. Kimlik modeli
| Öğe | Bugün | Cihaz başına mı | Kanıt |
|---|---|---|---|
| Hesap | Ad + parola, PBKDF2-HMAC-SHA256 kullanıcı başına tuz; ilk admin yalnız PC'den | — | `hesap.py` söz 4-5, s.586 |
| Oturum jetonu | `Authorization: Bearer`; sunucuda yalnız SHA-256 özeti; ömür 400 gün; istemcide `lifeos_hesap` çerezi (aynı makine adındaki tüm kapılarda ortak) | **Evet** (oturum = cihaz; ad verilir, tek tek kapatılır) | `hesap.py` söz 9, 18, `_jeton` s.2545, `OTURUM_GUN` s.224; `hesap.js` `CEREZ` s.622 |
| İki adım | TOTP (RFC 6238), yedek kodlar | hesap başına | söz 14 |
| Cihaz bağlama | 5 dk, tek kullanımlık 6 haneli kod; QR | yeni oturum açar | söz 15 |
| Kurtarma | Kullanıcının kendi sorusu | — | söz 7 |
| Erişim anahtarı | Yetki listesi `kayit`, `oku`; yalnız özeti; oturum yerine geçmez | anahtar başına | söz 16, 21 |
| Merkez (HKM) jetonu | `HKM/config.json` `local_token`; admin cihazına `uzak.merkez()` ile verilir; Tailscale kimliği (`Tailscale-User-Login` = PC sahibi) ile hesapsız da alınabilir | **Hayır, tek** («Telefon kaybolursa Tailscale'den çıkarılmalı») | `uzak.py` s.148-180; `her-yerden-erisim.md` «Bilinen sınırlar» |
| Köken izinleri | `UYGULAMA_KOKENLERI` (4 yerel kapı), HKM `allowed_origins`'e `.ts.net` kökenleri yazılır | — | `hesap.py` s.2359; `uzak.py _kokenleri_yaz` s.94-107 |
| «Yalnız bu PC» | ayar/ice/muzik/zemin/planlama yazmaları, ev ağı/uzak açma, geri yükleme | — | §5b, §5c |

### 6c. Öneri: tek yol = Tailscale + cihaz başına jeton
| Konu | Öneri |
|---|---|
| Ağ | Yalnız tailnet; tek kapı (`tailscale serve` 443 → tek süreç). MagicDNS adı sertifikayı Tailscale'e bırakır; kendi CA'mız gerekmez |
| Kimlik | Hesap oturumu zaten cihaz başına: aynısı kalır, **model geçidi de bu jetonla** çalışır; tek `local_token` kalkar. İsteğe bağlı ikinci katman: `Tailscale-User-Login` = sahip |
| Bu PC | `127.0.0.1` ayrıcalığı yalnız kurulum ve geri yükleme için kalır (bugünkü `_yerel_mi`) |
| Telefon | Tek köken → tek PWA simgesi (Android'deki «üç simge» sorunu kendiliğinden kalkar) |
| iOS kabuğu | SORU: ekran kapalıyken konum (SPİ canlı rota) ve zamanlı bildirim için gerekli mi? Kalırsa yerel sunucu 4 kapı yerine 1 |

Emekliye ayrılacak kod (yol 4 ve çok kökenlilik):
| Kod | Boyut | Kanıt |
|---|---|---|
| `sistem/telefon.py` (kök CA, sunucu sertifikası, IP listesi) | 434 satır | `wc -l` |
| `sunucu.py` `HttpsYonlendir`, `TelefonSunucu`, `telefon_baglami`, `telefon_sunuculari`, `telefon_kurulum_html`, `TelefonKurulum`, `telefon_kurulum_sunucusu` | s.2087-2365 = 279 satır | `grep -n` |
| `hesap.py` `ev-agi-ac`, `sertifika-tamam`, `ev_agi()` | 2 uç + yardımcı | s.2712-2725, s.2374 civarı |
| `hesap.js` `TELEFON_KAPI`, `KURULUM_KAPI`, `PC_KOK` ve kurulum akışı | sabitler s.634-636 | `brand/ortak/hesap.js` |
| `kabuk.js` `EV_AGI`, `adres()` ev ağı dalı | s.131-142 | |
| `uzak.py KAPILAR`'daki üç modül eşlemesi, HKM `allowed_origins` yazımı | s.33, s.94-107 | |
| iOS `YerelSunucu` 4 kapı tablosu (kabuk kalırsa 1'e iner) | s.34-39 | |
| `animasyon.js` taşıma (`TASINAN`), `ses.js devret` | §5d | |

## 7. brand/seviye

Kural (OKU.md baş): «Ortak olan TANIMDIR, defter değil» — 6 kademe (Bronz…Kutsal K100–K1000) üç sistemde aynı ad/eşik, ama her sistem ayrı kazanır. Bekçisi `xp.js` s.63-71 (`MOD='__MOD__'`: başka sistemin etkinliği işlenmez). HKM profili üçünü yan yana gösterir, «genel seviye» yok (`HKM/core/profil.py` s.12-16).

### 7a. Dosyalar ve nereye kopyalanır
Yayan: `tools/seviye.py` (361 satır) `--yay` / `--denetle`; CI'da `--denetle` (`.github/workflows/ci.yml:148`). Bugün çalıştırdım: «uc arayuzde de kaynakla ayni».
| Kaynak | Satır / KB | Rol | Hedef (×3: AYS, SPI, ESP) | Öneri |
|---|---|---|---|---|
| kademeler.js | 363 / 19 | Kademeler, eşikler, `XP_ETKINLIK` 16 etkinlik (`ays.soru` gibi modül önekli, s.219), `MODULLER=['ays','spi','esp']` s.363, `RUTBE_VIDEO=false` s.325 | `src/js/data/` | ÇEKİRDEK (tanım tek kalır; `mod` → alan) |
| basarimlar.js | 197 / 9 | Başarım aileleri, mühürler, onur | `src/js/data/` | ÇEKİRDEK |
| xp.js | 1 088 / 46 | XP defteri; geriye yazma 7 gün (`GERI_GUN`), gün kırılımı 120 gün | `src/js/core/` (`__NS__`, `__MOD__` değişir) | ÇEKİRDEK |
| basarim.js | 728 / 30 | Başarım defteri | `src/js/core/` | ÇEKİRDEK |
| perde.js + perde.html | 1 062 / 46 + 119 / 7 | Tam ekran kutlama perdesi; markup `index.html` `SEVIYE:perde` arası (`AYS/src/index.html:86-207`) | `src/js/core/`, index.html | SORU (§8 s.8) |
| rutbe.js | 1 096 / 55 | Rütbe ekranı; `cekmece:'ayarlar'` (s.128); `sahne-N.webp/.mp4` (s.180, s.190) | `src/js/screens/` | KABUK (3 sayfa → 1) |
| seviye.css | 1 693 / 67 | Perde, rozet, rütbe biçimi | `src/css/` (`parcalar.txt:19`) | KABUK, budanır |
| xp / perde / basarim `.test.js` | 1 186 + 645 + 586 / 47 + 26 + 25 | Sözleşme testleri | `src/tests/` | ÇEKİRDEK |
| ortak_yol.py | 100 / 4 | `/img/seviye/`, `/img/marka/`, `/dist/` yol muhafızı | 5 sunucu: 3 `devserver.py`, `sistem/sunucu.py`, `HKM/daemon.py` (`tools/seviye.py:106`) | Tek sunucuda tek kopya |
| dist_kopya.py | 61 / 3 | Medyayı tek dosya `dist/img/seviye` + `dist/img/marka`'ya kopyalar | 3 `build.py` (s.112) | SİL, tek dosya derleme kalkarsa |
| ortak_kart.py | 33 / 1 | `rutbe_kart_adi` (JS `MEDYA_ADI`'nın Python ikizi) | `HKM/core/profil.py` (s.119) | SİL, HKM kalkınca |
| medya/ | 112 dosya / 84 319 KB | Rütbe kartları, başarım, nişan, mühür, geçiş, `sahne-1..6.mp4` (**56 840 KB**) | Kopyalanmaz; `/img/seviye/` ile tek klasörden servis | SORU (§8 s.8) |
| eski/kademe-1.mp4 | 4 796 KB | Arşiv, servis edilmez (`dist_kopya.py` docstring) | — | ARŞİV (zaten) |
Kod toplamı (test dışı JS+CSS): ~272 KB, depoda **3 kopya** (+ kaynak). Medya git'te izleniyor (`git ls-files brand/seviye/medya` = 112); LFS ayarı göremedim (`.gitattributes` yok).

### 7b. Kim kullanıyor, hangi veriyi yazıyor
| Ne | Bugün | Kanıt |
|---|---|---|
| Veri anahtarları | `seviye` (XP defteri) ve `basarim` (ayrı defter), modülün kendi `Store`'unda; o da profil başına tek gövde (AYS: `rota84285.v2[.<profil>]`) | `xp.js:73`, `basarim.js:61`, `AYS/src/js/core/store.js:21` |
| Modül çağrıları | Yalnız `app.js`: `durum` (rozet), `kutla`/`kutlandi`, `esitleCok`, `yukle`, `dinle`, `bekleyenKutlama`; SPI'de ek `today.js:342` (`pencere`) | AYS `app.js:230-232, 1240-1280, 2230, 2298-2303`; SPI `app.js:239-241, 1347-1387, 2143, 2216-2221`; ESP `app.js:223-225, 1432-1472, 2396, 2464-2469` |
| Modülün kendi sayacı (kopya değil) | `XPSayim`, `BasarimSayim`: kayıtlardan gün gün XP sayar, `esitleCok` ile deftere eşitler | `AYS/src/js/core/xpsayim.js:25` (59 satır), `basarimsayim.js:29`; 3 modülde toplam 394 satır |
| HKM | Üç sistemin kademesini ve rütbe kartını yan yana gösterir | `HKM/core/profil.py` `kademeler` s.217, `rutbe_kart_adi` s.41, s.236 |

### 7c. Bulgular
| Bulgu | Kanıt |
|---|---|
| Yayım düzeneği 3 kökenden doğuyor: 10 JS/CSS × 3 kopya + 3 HTML bloğu + 5 Python bloğu + 1 HKM bloğu. Tek uygulamada yalnız `ortak_yol` tek sunucuda kalır; `tools/seviye.py` gider | `tools/seviye.py` s.64-119 |
| `__MOD__` yer tutucusu tek uygulamada bir parametre olur: `XP` tek nesne, etkinlik kimliği zaten alanı taşıyor (`ays.soru`) — «her alanın kendi seviyesi» kuralı korunabilir | `xp.js:71`, `kademeler.js:221` |
| Taşıma: 3 köken × profil sayısı kadar `seviye`/`basarim` defteri tek depoya `alan` alt anahtarıyla alınmalı. Defter kayıtlardan yeniden sayılıp eşitleniyorsa (`esitleCok(XPSayim.gunler(...))`) tek depoda kayıtlardan yeniden üretilebilir — **tahmin**, `esitleCok`'un tüm geçmişi kapsadığını doğrulamadım (pencere 7 gün olabilir: `GERI_GUN`) | `AYS/src/js/app.js:1266-1267`, `xp.js` `GERI_GUN` |
| Rütbe ekranı Ayarlar çekmecesinde, 3 kez: §3d'deki 9 ayar sayfasının 3'ü | `rutbe.js:128` |
| Medya deponun en ağır parçası (84 MB, 57 MB'ı mp4); `dist_kopya` her tek dosya derlemesine kopyalar → derleme başına 84 MB (**tahmin**: bugün `AYS|SPI|ESP/dist/img/seviye` boş) | `dist_kopya.py` s.17-27 |
| `RUTBE_VIDEO=false`: rütbe başına video istenmez; ama `sahne-N.mp4` rütbe ekranında kullanılıyor | `kademeler.js:325`, `rutbe.js:190` |
| §1f'deki «`seri.js` seviye ile ilişkili» notunu doğrulayamadım: `seri.js`'de `XP`/`seviye` geçmiyor (grep boş) | `brand/ortak/seri.js` |

## 8. İlk 10 sadeleştirme adayı ve sahibe sorular

### 8a. Adaylar (bağımlılık sırasıyla)
| # | Aday | Neden | Etki / risk | Hedef |
|---|---|---|---|---|
| 1 | Kökenlerden tek depoya bir kerelik veri taşıma | Veri kökene bağlı, 4180 modül kaydını okuyamıyor (§5d; `sunucu.py` docstring s.12-27; `gun.py` docstring) | En büyük kazanç; **veri kaybı riski yüksek** → önce yedek, sayım karşılaştırması, geri dönüş | Tek depo, `alan` önekli (`depo.js` bağlanma noktası) |
| 2 | `Sunucu` + `Giris` + `TelefonSunucu` tek işleyici, tek kapı | Uçlar zaten ortak modüllerde (ayar/ice/muzik/zemin/planlama/hesap) (§5a, §5d; `sunucu.py` s.98-105) | Orta; köken izin listeleri değişir (`hesap.py` s.2359) | Tek süreç, tek kapı |
| 3 | Kenar çubuğu + modül geçişi + 3 `go()/render()` → tek URL'li yönlendirici | `MODULLER`/`adres()`/`modulGecisi()`/`gecis()` port üstüne kurulu (§2a, §2e; `kabuk.js` s.66-73, s.259, s.1111-1135) | Büyük; 3 `app.js` (7 205 satır) dokunur | Tam ekran sayfalar, `parca.js` omurga |
| 4 | Kopya düzeneklerini sil: `tools/ortak.py` 3 kopya + `YERTUTUCU`, `parcalar.txt` modül sütunu, `tools/seviye.py` | Tek uygulamada kopya/yer tutucu gerekmez (§1, §2c, §7c) | Düşük; #3'ten sonra. CI adımı (`ci.yml:148`) da değişir | Tek kaynak, kopya yok |
| 5 | Ayar şeması: `KATALOG` + `SECIMLER` tek tablo; 8 denetimsiz seçim ve ölü `data-*` kaldır | Denetimsiz 8 seçim, CSS seçici 0 (§3a-b, §4c; `ayarlar.js` s.405-428) | Düşük; kullanıcı değerleri silinmez | Tek şema, tek Ayarlar sayfası (4180 levhası kalkar) |
| 6 | Ev ağı https yolunu emekliye ayır | `telefon.py` 434 + `sunucu.py` 279 satır, 3 ek köken (§6a yol 4, §6c) | Orta; Tailscale'siz cihaz kalırsa kesilir (§8b s.3) | Tek yol Tailscale + cihaz jetonu |
| 7 | HKM ayrı süreci ve köprüleri | `yedekag.js`, `hkmbag.js`, `hedefag.js` SİL; tek `local_token` (§1d, §5a, §6b) | King analistine bağlı; model geçidi önce taşınmalı | Süreç içi olay yolu (`olay.js`) |
| 8 | 4180'in Python'a gömülü iki sayfası | `GIRIS_SAYFASI` 870 satır, `gun.py` 1 567 satır, 17 dosyalık kapalı liste (§2d, §5b) | Orta; giriş akışı | Sıradan sayfalar, aynı kabuk |
| 9 | Sahne ARŞİV: önce `piksel.css` token/bileşen ↔ sahne ayrımı | 14 dosya 545 KB; 426 seçici `[data-zemin="piksel"]`; sahne betikleri `<head>`'de (§4a-d; `parcalar.txt` s.63-68) | Orta; King odası tuvali, `L.KARSILAMA` 6 modül çağrısı | Piksel dili kalır, sahne parkta |
| 10 | Seviye tek defter düzeni | 3 kopya × 10 dosya + 6 Python bloğu; Rütbe 3 ayar sayfası; 84 MB medya git'te (§7) | Düşük-orta; defter taşıması #1 ile | Tek `XP` nesnesi, alan başına defter, tek Rütbe sayfası |

### 8b. Sahibe sorular
| # | Soru | Neden önemli |
|---|---|---|
| 1 | Seviye her alanda ayrı mı kalsın (bugünkü kural), tek genel seviye mi olsun? | Defterin şeklini ve taşımayı belirler (§7; `profil.py` s.12-16 «genel seviye yok») |
| 2 | iOS kabuğu (AltStore) kalacak mı? Ekran kapalıyken konum ve zamanlı bildirim gerekli mi? | Kalırsa telefonda yerel sunucu sürer (§6a yol 6, §6c) |
| 3 | Ev ağı https kapansın mı; Tailscale'i olmayan bir cihaz var mı? | #6'yı kesinleştirir; kendi CA'mız gider (§6c) |
| 4 | Sunucusuz tek dosya `dist/*.html` sürümü gerekli mi? | `gorsel.js`, `dist_kopya.py`, 3 `build.py`; tek kökenle çakışır (§6a yol 3, §7a) |
| 5 | Sahne (apartman, doğa, minikler, sinematik) tamamen park mı, yoksa bir yerde (ör. Ana sayfa) kalsın mı? | #9'un kapsamı; piksel dili ayrımı buna göre (§4d) |
| 6 | Radyo ve kendi müzik dosyaların kalacak mı? | `ses.js` 67 KB, `muzik.js` 37 KB, `sistem/muzik.py`, 8 ayar anahtarı (§1e, §3c) |
| 7 | Profiller (en çok 8; SPİ'de aile) gerekli mi? | Depo profil başına (`store.js:21`); taşıma ve şema profil boyutunu taşır mı (§3c, §7b) |
| 8 | Rütbe/kutlama perdesi ve 84 MB medyası (57 MB video) kalsın mı; kalırsa git LFS'e taşınsın mı? | Depo boyutu ve klon süresi (§7a) |
| 9 | Hangi cihazda PC'ye eşitlenmemiş yerel veri olabilir? | Taşıma tek kerelik; eşitlenmemiş veri kaybolabilir (§5d) |
| 10 | Adres çubuğunda sayfa yolu (geri tuşu, yer imi) istiyor musun? | Bugün URL yok (§2a); yönlendirici tasarımı buna bağlı |

### 8c. Göremediklerim
- JS testlerini çalıştırmadım (tarayıcıda `tests/index.html`); yalnız `tools/seviye.py --denetle` koştu.
- `esitleCok`'un XP defterini tüm geçmişten yeniden kurup kurmadığı (§7c tahmin).
- Cihazlardaki gerçek depo boyutları ve 5 MB sınırına yakınlık.
- `brand/medya` (marka medyası) ayrıntısı ve HKM içi (King analistine).
- `seri.js` ↔ seviye bağı (§1f notu; grep boş).
