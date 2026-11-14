# Faz 7 · Kapanış değişikliği (dal `kapanis`)

## Özet
Dal `kapanis` (origin/main c293d421'den), birleştirilmedi, gönderilmedi. Her adım ayrı commit, her commit'te kalan testler yeşil.

1. **Tek kapı devrede, eski kapılar kalktı** — `ETKIN = True`; `sistem/baslat.py` yalnız `sistem/tekkapi.py`'yi açar (Merkez aynı süreçte); `sunucu.py`'nin kendi kapıları (`main`, `_sunucu_kur`), ayrı HKM sürecinin yardımcıları (4200'e bakan `hkm_ac/hkm_yeniden/hkm_eski`, bekçi) ve ev ağı kapıları (`TelefonSunucu`, kurulum sayfası 5180, `sistem/telefon.py` kendi CA'sı, `/api/hesap/ev-agi-ac`, `sertifika-tamam`) silindi. Tailscale yalnız 443 → 4180.
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
yazılıyor (sonraki adımlar)

## Tutulanlar ve nedeni
- `sistem/sunucu.py` `Giris` ve `Sunucu` sınıfları: `TekKapi` `Giris`'in alt sınıfı, modül dist'ini (adım 2'ye kadar) `Sunucu`'ya devreder. `surekli_hizmet`, `KuyrukluSunucu`, `gun_cumlesi`, planlama ve güncelleme işleri tek kapının kendisidir.
- `uzak.ESKI_KAPILAR`: güncellemeden sonra sahibin makinesinde kalmış eski Tailscale kurallarını (5173/5183/5193, 443→4200) `ac/kapat` kapatsın diye; kural değil temizlik listesi.
- `sistem/baslat.py eski_durdur()`: kapanıştan önce açılmış `sunucu.py`/HKM daemon'u güncellemeden sonra çalışır kalabilir; adıyla kapatılır.
- `HKM/daemon.py`: tek kapı `daemon.hazirla` ve `daemon.Handler`'ı içe aktarır.
- `tools/tekkapi_test.py` karşılaştırma tabanı: `sunucu.main()` yok, aynı kapılar testin içinde `Giris` + `Sunucu` ile kurulur.
yazılıyor (sonraki adımlar)

## Taşınanlar
yazılıyor

## CI
yazılıyor

## Ölçüm önce/sonra
yazılıyor

## Birleştirme sırası
yazılıyor

## Açık sorular
yazılıyor
