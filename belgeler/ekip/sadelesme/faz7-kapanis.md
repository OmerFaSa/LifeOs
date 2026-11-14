# Faz 7 · Kapanış değişikliği (dal `kapanis`)

## Özet
Dal `kapanis` (origin/main c293d421'den), birleştirilmedi, gönderilmedi. Her adım ayrı commit, her commit'te kalan testler yeşil.

1. **Tek kapı devrede, eski kapılar kalktı** — `ETKIN = True`; `sistem/baslat.py` yalnız `sistem/tekkapi.py`'yi açar (Merkez aynı süreçte); `sunucu.py`'nin kendi kapıları (`main`, `_sunucu_kur`), ayrı HKM sürecinin yardımcıları (4200'e bakan `hkm_ac/hkm_yeniden/hkm_eski`, bekçi) ve ev ağı kapıları (`TelefonSunucu`, kurulum sayfası 5180, `sistem/telefon.py` kendi CA'sı, `/api/hesap/ev-agi-ac`, `sertifika-tamam`) silindi. Tailscale yalnız 443 → 4180.
2. **Eski modüller kalktı** — `AYS/`, `SPI/`, `ESP/` (src, dist, tests, tools; 1 571 dosya) silindi; motor eşitlik testlerinin okuduğu 27 dosya `motor/eski/` altına donduruldu. Eski Gün sayfası (`sistem/gun.py`), Giriş'in modül kartları, `/logo/`, modül dist sunucusu (`sunucu.Sunucu`, bölünmüş dist önbelleği) ve tek kapının `/ays/ /spi/ /esp/`, `/dist-*`, `/img/seviye/`, `/api/merkez/ac`, `/api/gun/cumle` yolları gitti (artık 404). Kabuk haritasında eski modül bağlantısı yok. Yalnız eski modülleri sınayan 57 araç ve test silindi.
3. **HKM yüzü kalktı, BAM kalmadı** — `HKM/web/` (Merkez ve atölye sayfaları), `HKM/brand/`, `HKM/tools/yuz.js`, `HKM/tests/test_yuz.py` ve daemon'un `/`, `/atolye`, `/img/seviye/`, `/img/marka/`, `/brand/` uçları silindi. HKM çekirdeği (veritabanı, King, `/api/*`) tek kapının `/api/hkm/` altında ve King MCP'de aynen. **BAM silinmedi** (açık soru 2): `HKM/core/king.py` kayıt gövdesini, iş emrini ve izi `bam.kayit_getir/is_ac/iz_ekle` ile tutuyor (27 çağrı; `aktif.py`, `outbox.py` de); BAM'ı kaldırmak, faz5-arama kapısının 3. şartı olan arama dışı işlerin (kayıt sürümleri, Üretim, Planlama) başka motora taşınmasını ister. Ölçüm şartı kalktı ama bu yapısal şart duruyor.
4. **Kopya dağıtımı kalktı** — `tools/ortak.py`, `tools/seviye.py`, `tools/parca.py` silindi; `brand/ortak/` 229 → 52 dosya (yalnız tek kapının, kabuğun, motor testlerinin ve kalan araçların yüklediği dosyalar). `sistem/sunucu.py`'deki üretilmiş SEVİYE bloğu sahiplenildi (yalnız `/marka/` muhafızı), `HKM/daemon.py`'deki kopyası silindi.
5. **CI ve belgeler** — `ci.yml` 565 → 268 satır: modül matrisi (`arayuz`), uçtan uca (`butunlesme`), `envanter`, `yuk` işleri ve silinen dosyalara giden her adım kalktı; Playwright `tools/`'dan kurulur. README, AGENTS §0/§2, TEKNIK (bugünkü sistem tablosu), iki DIZIN kalan sistemi anlatır. Yeni ölçüm `kalite/kayit/2026-11-14.json`; bütçe aşımı yok.

Her commit'te: kabuk/motor/king/kalite testleri, `kalite/katman.py`, iki DIZIN testi, `goc_test`, `tekdepo_test`, `olcum --denetle`, `tekkapi_test`, HKM takımı, `kabuk_gez` yeşil. Not: `kabuk_gez` takım içinde iki kez ilk ekranı 30 sn'de bulamadı (bellek ~1 GB), tek başına her koşuda geçti.

## Silinenler
| Yol | Neden | Yerine |
|---|---|---|
| `sistem/telefon.py` (434 satır) | ev ağı kendi CA'sı (plan A10: «ev ağı sertifikası emekli olur») | Tailscale (`sistem/uzak.py`, tanınan HTTPS) |
| `tools/telefon_test.py`, `tools/android_kurulum_test.js` | sınadıkları kapı (51xx) ve Android kurulum sayfası (5180) yok | `HKM/tests/test_uzak.py` (tek kapı, eski dış kapıların kapanması) |
| `sistem/sunucu.py`: `main()`, `_sunucu_kur`, `TelefonSunucu`, `HttpsYonlendir`, `telefon_*`, `TelefonKurulum`, `ev_agi_ac`, `merkez_bekci`, `_bekci_dongusu`, 4200'e bakan `hkm_ac/hkm_yeniden/hkm_eski/hkm_kod_zamani`, `BEKCI_SN`, `ALTSTORE_KAYNAK` (−420 satır) | eski dört kapı + ev ağı + ayrı Merkez süreci | `sistem/tekkapi.py` (tek adres, tek süreç); `sunucu.HKM` aynı süreçteki çekirdek, `hkm_ayakta/hkm_ac` ona bakar |
| `sistem/hesap.py` `/api/hesap/ev-agi-ac`, `/api/hesap/sertifika-tamam`, durumdaki `sertifika_yenilendi`, `ev_agi()`'nin ev ağı IP'leri | kendi CA yok | `ev_agi()` yalnız Tailscale adını verir |
| `brand/ortak/hesap.js` «Ev ağını aç» düğmesi, sertifika notu, kurulum sayfası QR yolu (`KURULUM_KAPI`), 10 yazı | aynı | QR doğrudan Tailscale adresine; `TELEFON_KAPI = 443` |
| `sistem/tekkapi.py` deneme kipi dalları (`ETKIN` False), `uzak.kapilari_sec` | bayrak hep açık | `DENEME` yalnız `--port` ile açılan sınama kapısında güncellemeyi/yeniden başlatmayı kapatır |
| CI: «Telefon kapıları…», «Android kurulum sayfası…» adımları | dosyaları yok | — |
| `AYS/`, `SPI/`, `ESP/` (1 571 dosya: src, dist, tests, tools, build.py, devserver.py, package*.json) | eski modüller, sunulan uygulama olarak (plan Faz 6/7) | yeni kabuk + motorlar + alanlar; veri tek depoda (göç) |
| `alan/akademik/donustur.js` | AYS ders verisini alan şemasına bir kez çeviren betik; kaynağı kalktı | `alan/akademik/asama-*.json` doğrusu; betik c293d421'de geri alınabilir |
| `sistem/gun.py` (1 569 satır), Giriş'in `/gun/`, `/gun/ortak/`, `/api/gun/cumle`, çerezle `/`→`/gun/` | eski Ana sayfa (Gün) | kabuğun Bugün ekranı |
| `sistem/sunucu.py`: `Sunucu`, `SISTEMLER`, `KARTLAR`, `LOGOLAR`, `_logo`, dist bölme/önbellek (`_dist_*`, `_canli_bol`, `_metni_bol`, `_sikistir`, `_guncel_dist`), `merkez_izinli`, `gun_cumlesi`, `HKM_PORT`, `TEK_KAPI` | modül kapısı ve kartları | tek kapı; Giriş yalnız hesap ve sistem paneli |
| `sistem/tekkapi.py`: modül devri (`_SINIF`), `/ays/ /spi/ /esp/`, `/dist-betik.js`, `/dist-stil.css`, `/img/seviye/`, `/img/marka/`, `/api/merkez/ac` | aynı | — (404) |
| `kabuk/harita.js` alan satırlarındaki `eski:` modül bağlantıları (10) | brief: eski modül bağlantıları gider | alanlar kabukta |
| `tools/`: entegre.js, envanter.js(+2 test), nerede.js, parca_kanit.js, css_onemli.js, piksel_denetim.js, mobil_tara.js, bulut_gecis.js, olucss.py, tiklama.js, akicilik.js, king_kapsam.js/.json, king_guven.js, kapsam.js, olcum_modul.js(+kabul), sadelik.js(+test), pusula.js, king_sinav.js/.json, king_bench/, 26 modül kabul testi (ays_*, esp_*, spi_*, king_kapsam_*, king_sinav_*, kingveri_*, ogret_*), gun_iskelet/gunveri(2) kabul, tarih_ortak, perde_test_hiz, parca_tembel_test.js, giris_sayfa_test.js, patrontur_kosu.js, king_olay_uctan_test.py, dist_sun_test.py, portmuhafiz.test.js, parca_test.py, veri_ays_siklik.py, veri_esp_siklik.py, paket.py | hepsi eski modüllerin ekranını, dist'ini, tarayıcıdaki eski King'ini ya da kaynağını açıyordu; modülsüz koşamazlar | tek sistemin testleri: kabuk/motor/king/kalite testleri, `tekkapi_test`, `kabuk_gez` |
| `king/katalog.py`: modül King araçlarının taranması (kingarac.js, app.js, tools.js, actions.js) ve 93 eski araç adı | araçlar modüllerle kalktı | 12 kapı (`king/katalog.py KAPILAR`), MCP |
| HKM testleri: `test_intents` D-12 (modül beacon.js), `test_guncelle` telefon/seçim/kart sayfaları ve logo, `test_uzak` modül kapısı Merkez ucu ve vekil uçları, `test_yuz` iki modül bileşeni denetimi | sınadıkları kod yok | `tekkapi_test` (vekil, 410, 404) |
| `HKM/web/index.html`, `HKM/web/merkez.html`, `HKM/brand/` (favicon, logo, intro.mp4), `HKM/tools/yuz.js`, `HKM/tests/test_yuz.py` | HKM yüzü (plan Faz 7: «HKM yüzü kalkar») | kabuk + `/kartlar/`; Merkez verisi `/api/hkm/` |
| `HKM/daemon.py` `_send_page`, `_send_seviye`, `_send_brand` ve `/`, `/atolye`, `/img/seviye/`, `/img/marka/`, `/brand/` yolları | aynı | kökte 401/404; veri yalnız `/api/*` |
| HKM testleri: `test_daemon` «yerel yüz jetonsuz» (yerine «yüz yok»), `test_meydan` yüz dosyası okuması, `test_guncelle` `_send_brand` muhafızı | sınadıkları kod yok | — |
| `tools/ortak.py`, `tools/seviye.py`, `tools/parca.py` | kopya dağıtımı (plan Faz 7); hedef modüller yok | — |
| `brand/ortak/` içinden 177 dosya (ör. king*.js/css dışı King istemcisi, defter, notum, pano, rehber, ogrenmotor, kavrat, gunveri, tekgun, gunukapat, zemin, minik, tanitim, patrontur, karsilama, ayarlar, giris, layout/base/temel css ve testleri; tam liste `git show --stat` bu commit) | yalnız eski modüllerin, Gün sayfasının ya da HKM yüzünün yüklediği kod | kabuk + motorlar |
| `sistem/sunucu.py` `_ortak_marka_yolu`, `_ortak_seviye_yolu`, `_ortak_dist_yolu`; `HKM/daemon.py` SEVİYE bloğu | çağıranı kalmadı | `sunucu._guvenli_medya_adi` (`/marka/`) |
| `tools/ajan.py` «ortak kopya» yasak kuralı, CI «Kopyalar…», «Ortak CSS…» adımları, `tools/sayilar.py` iki denetim satırı | kopya yok | — |


## Tutulanlar ve nedeni
- `sistem/sunucu.py` `Giris` ve `Sunucu` sınıfları: `TekKapi` `Giris`'in alt sınıfı, modül dist'ini (adım 2'ye kadar) `Sunucu`'ya devreder. `surekli_hizmet`, `KuyrukluSunucu`, `gun_cumlesi`, planlama ve güncelleme işleri tek kapının kendisidir.
- `uzak.ESKI_KAPILAR`: güncellemeden sonra sahibin makinesinde kalmış eski Tailscale kurallarını (5173/5183/5193, 443→4200) `ac/kapat` kapatsın diye; kural değil temizlik listesi.
- `sistem/baslat.py eski_durdur()`: kapanıştan önce açılmış `sunucu.py`/HKM daemon'u güncellemeden sonra çalışır kalabilir; adıyla kapatılır.
- `HKM/daemon.py`: tek kapı `daemon.hazirla` ve `daemon.Handler`'ı içe aktarır.
- `tools/tekkapi_test.py` karşılaştırma tabanı: `sunucu.main()` yok, aynı kapılar testin içinde `Giris` + `Sunucu` ile kurulur.
- `motor/eski/` (27 dosya: AYS 16, SPI 9, ESP 2): motor testleri eski kuralı GERÇEK kaynağından karşılaştırır (net, plan ölçeği, FSRS göçü, SPİ sınırları). Sunulmaz, `kalite/katman.py` taramaz (yalnız `motor/*.js`); eşitlik testleri gerekmeyince klasör silinir.
- `/kartlar/` (Giriş, `sunucu.GIRIS_SAYFASI`): hesap, cihazlar, iki adım, güncelleme ve sistem paneli yalnız orada; kabukta karşılığı yok. Kabuk haritasındaki «Eski sistem» satırı silinmedi, «Hesap ve sistem» oldu (modül kartları ve Gün kartı yok, ortadaki kart yeni kabuğa gider). Açık soru 1.
- `alan/**/asama-*.json` içindeki `{"tur": "depo", "yol": "AYS/…"}` kaynak künyeleri: veri, kod değil; yol kapanıştan önceki son commit'e (c293d421) göredir.
- `tools/kabul_js.py`, ofis araçları (`ajan.py`, `ofis_test.py`, `ofis_pilot.py`, `gorev_takip.py`): ofis modülsüz sürer; Testçi'nin modül derleme/denetim evresi kalktı, son adım `kabuk_gez`.
- `sistem/sunucu.py` SEVİYE üretilmiş bloğu (`_ortak_*_yolu`): `tools/seviye.py` yayar; adım 4'te.
- `HKM/core/bam.py` ve 50 dosyadaki BAM adı: King çekirdeğinin kayıt deposu (`bam_kayitlar`, iş emri, iz). Silmek King'in kayıt yolunu kırar (açık soru 2).
- `HKM/baslat.py`, `HKM/BASLAT.*`, `HKM/baslat.sh`, `HKM/kur.py`, `daemon.main()`: Merkez'i ayrı süreç olarak elle açmanın ve `config.json`'u kurmanın yolu; tek kapı `daemon.hazirla`'yı ve `config.json`'u kullanır. Ayrı süreç yolunun da kalkması ayrı bir karar (açık soru 3).
- `brand/ortak/` 52 dosya: `/kartlar/` paneli ve kabuğun yüklediği `hesap.js/.css`, `parca.js`, `animasyon.js`, `qr.js`, `muzik.js`, `gocpaket.js`, `piksel*.js/.css`, `piksel-yazi.css`; motor testlerinin yüklediği `tarih.js`, `bicim.js`, `usta.js`, `ogret.js`; `king/katalog.py`'nin taradığı `king-arac.js`, `yetki.js`; kalan araçların okuduğu `bilinc.js`, `kisi.js`, `merkezayar.js`, `medya.js` (künye, `marka.py`), `simge.js`, `vitrin.css` (`vitrin.py`), `sinematik.*` (`tools/sinematik`), `sw.js`, `urun.js` ve testleri. Bunların `*.test.js`'lerini artık hiçbir koşucu çalıştırmıyor (modüllerin `runtests.js`'i taşıyordu): açık soru 4.
- `brand/seviye/` (seviye/rütbe medyası, `ortak_yol.py`, `perde.html`): `tools/marka.py --sina` `ortak_yol.py`'yi sınar; §0.1'e göre seviye arşive gider, ayrı karar (açık soru 5).


## Taşınanlar
- `motor/eski/AYS|SPI|ESP/src/js/...` ← aynı yoldaki eski modül dosyaları (27); `motor/{kayit,plan,soru,tekrar}.test.js` `ESKI` köküne bakar.
- `tools/package.json`, `tools/package-lock.json` ← `SPI/package*.json` (Playwright, yalnız denetim). `kabuk_gez.js`, `bilesen_goruntu.js` `tools/node_modules/playwright`'ı yükler; CI `cd tools && npm ci`.
- `motor/eski/brand/ortak/king-devrim.js` ← `brand/ortak/king-devrim.js` (Tekrar göç testi eski King ders kaydının biçimini kaynağından okur).


## CI
- Kalkan işler: `arayuz` (AYS/SPI/ESP matrisi: runtests, smoke, a11y, layout, palet, perf), `butunlesme` (`entegre.js`), `envanter` (envanter + sadelik), `yuk` (beş yıllık veri). `hkm` işinden Playwright (ESP) + `yuz.js` + «Giriş ve Gün sayfası».
- Kalkan adımlar (`tekkaynak` işi, adı «Tek sistem»): seviye/ortak kopya denetimleri, parça kaydı, telefon kapıları, Android kurulum, dist sunumu, King güven, ölü CSS, onay düğmesi sayacı, port muhafızı, ofis kabul listesinden 30 modül testi.
- Kalan: göç, tek depo, taşıma, tek kapı, motorlar, alan şeması, ölçüm/bütçe, katman, King (MCP, çekirdek, arama), kabuk testleri, ofis, kalan kabul testleri, Playwright (`tools/package.json`) + kabuk gezisi, medya künyesi, vitrin, HKM testleri ve sorgu bütçesi. YAML ayrıştırıldı; CI'da koşturulmadı (dal gönderilmedi).
- `.github/workflows/ios.yml` dokunulmadı: `AYS/dist` vb.'yi telefon kabuğuna paketler, kapanıştan sonra kırılır (açık soru 6).

## Ölçüm önce/sonra
`python kalite/olcum.py --md`, önce = c293d421 (bu dal başı), sonra = 5/5. Aynı sayım yolu; tek değişiklik: «Uygulama» artık `kabuk/index.html`'i de sayar (yoksa 0 çıkıyordu).

| Ölçüt | Önce | Sonra | Hedef | Kesinlik |
|---|---|---|---|---|
| Sistem · Anlaşılabilirlik | 1.78 adım (yer başına ortalama) | 1.78 adım (yer başına ortalama) | — | hesaplandı |
| Sistem · Hayata etki | 5.0 gün/hafta | 5.0 gün/hafta | — | ölçüldü |
| Sistem · Optimizasyon | 26174579 bayt (dağıtılan kod) | 579942 bayt (dağıtılan kod) | — | ölçüldü |
| Sağlayıcı kalitesi | 1436.1 jeton/istek | 1436.1 jeton/istek | — | ölçüldü |
| King-Bench vakası | 350 | 0 | — | ölçüldü |
| Bench yaması | 23 | 0 | 0 | ölçüldü |
| King'in gördüğü araç | 128 | 38 | 12 | ölçüldü |
| Sözcük yönlendirmesi: NIYET kuralı | 13 | 0 | 0 | ölçüldü |
| Sözcük yönlendirmesi: sayfa rehberi sözcüğü | 82 | 0 | 0 | ölçüldü |
| Sınav cümlesi | 358 | 0 | — | ölçüldü |
| King aracı (toplam) | 166 | 72 | — | ölçüldü |
| Ağ çizimi | 2 | 1 | 1 | ölçüldü |
| En büyük alan paketi (bayt) | 2283941 | 2283941 | ≤ 2500000 | ölçüldü |
| Elle yazılan ayar yeri | 2 | 0 | 1 | ölçüldü |
| Blok | 304 | 13 | — | ölçüldü |
| Cihaz yolu (ağ yolu) | 4 | 2 | 1 | ölçüldü |
| Denetimsiz seçim | 8 | 0 | 0 | ölçüldü |
| Ekran dosyası | 64 | 0 | — | ölçüldü |
| Ekran içi sekme | 115 | 0 | 0 | tahmin |
| HKM /api/ yolu | 126 | 126 | 0 | ölçüldü |
| HKM çekirdek dosyası | 93 | 93 | 0 | ölçüldü |
| HKM tablo | 50 | 50 | 0 | ölçüldü |
| İç içelik (kat) | 4 | 0 | 2 | hesaplandı |
| Kabuk açılış yükü (bayt) | 580115 | 579942 | ≤ 1000000 | ölçüldü |
| Kapı (ev ağı) | 4 | 0 | 0 | ölçüldü |
| Kapı (yerel adres) | 5 | 1 | 1 | ölçüldü |
| Kesinlik etiketi dili | 2 | 1 | 1 | ölçüldü |
| Kod hacmi (satır) | 562129 | 96492 | — | ölçüldü |
| Komut | 69 | 7 | — | ölçüldü |
| Üçe kopyalanan dosya | 237 | 0 | 0 | ölçüldü |
| Not yapısı | 16 | 3 | 1 | ölçüldü |
| Sayfa | 81 | 11 | 40 | ölçüldü |
| Tekrar zamanlayıcısı | 9 | 2 | 1 | ölçüldü |
| Uygulama | 4 | 1 | 1 | ölçüldü |
| Verinin doğrusu (yer) | 6 | 3 | 1 | hesaplandı |

Okuma: kapı, ev ağı, kopya, uygulama, kesinlik dili hedefte. «0» çıkan bazı ölçütler (ekran dosyası, iç içelik, ekran içi sekme, ayar yeri, denetimsiz seçim, NIYET kuralı, rehber sözcüğü) eski modül dosyalarını sayıyordu; dosyalar gidince sıfıra düştü, kabuk için ayrı sayım yöntemi yazılmadı: hedefe ulaşıldı demek değil, «kabuk sayılmıyor» demek (açık soru 7). HKM ölçütleri (tablo, `/api/`, çekirdek) değişmedi: çekirdek aynen tek kapının içinde, BAM duruyor.

## Birleştirme sırası
Ön koşul: sahibin anahtarı main'de çevrilmiş olmalı (`sistem/tek_kapi_ac.py --ac` başarıyla bitmiş, `ETKIN = True`, her cihazın göç paketi gelmiş). main bu dal açıldıktan sonra 39776fd9'a ilerledi; bu dala main birleştirilmedi.

1. Bekle: `tek_kapi_ac.py --ac` sonrası en az bir gün gerçek kullanım; geri dönüş (`--geri`) gerekmediği görülsün. Kapanış birleşince `--geri` anlamını yitirir (eski modüller yok).
2. Dalı main'in üstüne al: `git checkout kapanis && git rebase main` (ya da `git merge main`); sırayla 1/5 … 5/5. Beklenen çakışmalar (main'in c293d421'den sonraki commit'leri):
   - `sistem/tekkapi.py`: main'de `ETKIN` satırı `tek_kapi_ac.py` ile True olur → bu dalın sürümü alınır (`ETKIN = True` + `DENEME`).
   - `sistem/hesap.py`: main'deki `goc-paket/son` cihaz süzgeci + bu dalın ev ağı ucu silmesi; ayrı bölgeler, elle birleştir.
   - `kabuk/kabuk.test.js`, `tools/kabuk_gez.js`, `tools/bilesen_goruntu.js`, `tools/tekkapi_test.py`: main'in kabuk cilası/aşama onayı testleri + bu dalın «eski bağlantı yok», Playwright yolu (`tools/node_modules`) ve modülsüz tek kapı sınaması; ikisini de koru.
   - `tools/DIZIN.md`, `belgeler/DIZIN.md`: satır ekleri; ikisini de koru (main'in `tek_kapi_ac.py`, `tek_kapi_ac_test.py`, SAHIP-ADIMLARI, faz1-tek-kapi-ac, faz2-son-cila satırları).
   - Elle bak: `kabuk/harita.js` (main yeni yer eklediyse `eski:` alanı vermemeli), `kabuk/kabuk.js` (`eskiYol` yalnız «Hesap ve sistem» için).
   - main'in `sistem/tek_kapi_ac.py` ve `tools/tek_kapi_ac_test.py`'si eski kapıları (4173/4183/4193/4200, `telefon` klasörü, `sunucu.py`) okur: kapanıştan sonra yalnız geçiş aracıdır; birleşmeden sonra testi koşmuyorsa ikisi ayrı bir commit'le silinir (açık soru 8).
3. Birleşik ağaçta AGENTS §2 denetim listesini koş; `python kalite/olcum.py --kaydet` (bu dal `kalite/kayit/2026-11-14.json`'u yeniden yazdı; main'inkiyle çakışırsa ölçümü birleşik ağaçta yeniden al).
4. `main`'e al ve gönder (yalnız sahibin oturumu); çalışan kopya «Güncelle» ile ileri sarılır; ilk açılışta `baslat.py` eski `sunucu.py`/HKM daemon'unu adıyla kapatır; Tailscale'de «Her yerden erişim»i bir kez kapat/aç (eski dış kapılar silinir).
5. Geri alma: her adım ayrı commit; ters sırayla `git revert` 5/5, 4/5, 3/5, 2/5, 1/5 (2/5 en büyüğü, modül kodunu geri getirir; veri hiçbir adımda silinmedi). Yalnız kapıları geri almak: 1/5'i revert et (2/5 ondan sonra gelir, birlikte gerekir).

## Açık sorular
1. **Hesap ve sistem paneli kabukta yok.** Hesap, cihazlar, iki adım, güncelleme yalnız `/kartlar/`'da (eski giriş sayfası, ~870 satır HTML; modül kartları kalktı, ölü kart betikleri duruyor). Kabuğa bir Hesap sayfası yazılınca `/kartlar/`, `GIRIS_SAYFASI` ve `brand/ortak/hesap.js`'in büyük kısmı da gider.
2. **BAM** (`HKM/core/bam.py`, 1 506 satır): sahip ölçüm şartını kaldırdı, ama King çekirdeğinin kayıt deposu (`king.py` 27 çağrı, `aktif.py`, `outbox.py`, `bam_kayitlar`). Kaldırmak için önce kayıt sürümleri/Üretim/Planlama başka motora taşınmalı (faz5-arama kapı şartı 3). Araştırma yolu zaten `king/arama.py`'de.
3. **HKM'nin ayrı süreç yolu** (`HKM/baslat.py`, `BASLAT.*`, `daemon.main`) ve HKM içi eski kökenler (`LIFEOS_PORTS`): tek kapı kullanmıyor; kalksın mı?
4. **`brand/ortak/*.test.js` (17) koşmuyor**: modüllerin `runtests.js` düzeneğini istiyorlar; tek koşucu yazılmalı ya da kalan dosyalar kabuğa/motora taşınmalı.
5. **`brand/seviye/`** (seviye/rütbe medyası, `ortak_yol.py`, `perde.html`) ve `tools/marka.py`, `tools/rutbe.py`, `tools/vitrin.py`, `tools/sinematik/`: §0.1'e göre arşiv; sahibin kararı.
6. **iPhone kabuğu** (`uygulama/ios`, `ios.yml`): dist'leri paketleyip 4173/4183/4193'te açıyordu; modüller yok. Rota kaydı için kalacaksa tek kapıyı (Tailscale) açacak biçimde yeniden yazılmalı; `ios.yml` bu dalda kırmızı olur.
7. **Kabuk için sayım yöntemi**: ekran, iç içelik, sekme, ayar yeri ölçütleri kabuğu saymıyor (`kalite/olcum.py`); plan hedefleri (sayfa ≤ 40, iç içelik ≤ 2) için yöntem yazılmalı.
8. **`sistem/tek_kapi_ac.py`** (main'de, bu dalda yok): geçiş aracı; kapanıştan sonra `--geri` eski modülleri gerektirir. Birleşmede silinsin mi?
9. Brief'in «Kalkanlar ve işlerinin gittiği yer» bölümü plan.html'de ve sadelesme belgelerinde bulunamadı; o tablonun yerini bu belgedeki Silinenler ve Tutulanlar alır.
10. `tools/sayilar.py` hâlâ AYS/SPI/ESP test sayılarını toplamaya çalışır (README'deki SAYILAR bloğu kalktı); yeniden yazılmalı ya da silinmeli. `tools/veri_*` içerik araçlarına dokunulmadı.
