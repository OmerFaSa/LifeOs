# Faz 7 · Kapanış değişikliği (dal `kapanis`)

## Özet
Dal `kapanis` (origin/main c293d421'den), birleştirilmedi, gönderilmedi. Her adım ayrı commit, her commit'te kalan testler yeşil.

1. **Tek kapı devrede, eski kapılar kalktı** — `ETKIN = True`; `sistem/baslat.py` yalnız `sistem/tekkapi.py`'yi açar (Merkez aynı süreçte); `sunucu.py`'nin kendi kapıları (`main`, `_sunucu_kur`), ayrı HKM sürecinin yardımcıları (4200'e bakan `hkm_ac/hkm_yeniden/hkm_eski`, bekçi) ve ev ağı kapıları (`TelefonSunucu`, kurulum sayfası 5180, `sistem/telefon.py` kendi CA'sı, `/api/hesap/ev-agi-ac`, `sertifika-tamam`) silindi. Tailscale yalnız 443 → 4180.
2. **Eski modüller kalktı** — `AYS/`, `SPI/`, `ESP/` (src, dist, tests, tools; 1 571 dosya) silindi; motor eşitlik testlerinin okuduğu 27 dosya `motor/eski/` altına donduruldu. Eski Gün sayfası (`sistem/gun.py`), Giriş'in modül kartları, `/logo/`, modül dist sunucusu (`sunucu.Sunucu`, bölünmüş dist önbelleği) ve tek kapının `/ays/ /spi/ /esp/`, `/dist-*`, `/img/seviye/`, `/api/merkez/ac`, `/api/gun/cumle` yolları gitti (artık 404). Kabuk haritasında eski modül bağlantısı yok. Yalnız eski modülleri sınayan 57 araç ve test silindi.
3. **HKM yüzü kalktı, BAM kalmadı** — `HKM/web/` (Merkez ve atölye sayfaları), `HKM/brand/`, `HKM/tools/yuz.js`, `HKM/tests/test_yuz.py` ve daemon'un `/`, `/atolye`, `/img/seviye/`, `/img/marka/`, `/brand/` uçları silindi. HKM çekirdeği (veritabanı, King, `/api/*`) tek kapının `/api/hkm/` altında ve King MCP'de aynen. **BAM silinmedi** (açık soru 2): `HKM/core/king.py` kayıt gövdesini, iş emrini ve izi `bam.kayit_getir/is_ac/iz_ekle` ile tutuyor (27 çağrı; `aktif.py`, `outbox.py` de); BAM'ı kaldırmak, faz5-arama kapısının 3. şartı olan arama dışı işlerin (kayıt sürümleri, Üretim, Planlama) başka motora taşınmasını ister. Ölçüm şartı kalktı ama bu yapısal şart duruyor.
yazılıyor (sonraki adımlar)

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
yazılıyor (sonraki adımlar)

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
yazılıyor (sonraki adımlar)

## Taşınanlar
- `motor/eski/AYS|SPI|ESP/src/js/...` ← aynı yoldaki eski modül dosyaları (27); `motor/{kayit,plan,soru,tekrar}.test.js` `ESKI` köküne bakar.
- `tools/package.json`, `tools/package-lock.json` ← `SPI/package*.json` (Playwright, yalnız denetim). `kabuk_gez.js`, `bilesen_goruntu.js` `tools/node_modules/playwright`'ı yükler; CI `cd tools && npm ci`.
yazılıyor (sonraki adımlar)

## CI
yazılıyor

## Ölçüm önce/sonra
yazılıyor

## Birleştirme sırası
yazılıyor

## Açık sorular
yazılıyor
