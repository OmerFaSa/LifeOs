# 002 · Teknik belgeye son eklenenler

**Durum:** bitti
**Dal:** `ag/002-teknik-belge`
**Efor:** orta

## Amaç
`belgeler/TEKNIK.md` 2026-10-30/31'de eklenen sistemleri anlatmıyor. Kodu
okuyarak (tahminle değil) kısa bölümler ekle; bir sonraki ajan oradan öğrensin.

## Dokunulacak dosyalar
- `belgeler/TEKNIK.md` — yalnız yeni bölümler; var olan metin değişmez.

## Dokunma
- Kod dosyalarının hiçbiri. Belgede kodla çelişen bir şey görürsen düzeltme,
  «Sonuç»a yaz.

## Kabul ölçütü
Her bölüm 5–15 satır, «ne yapar · nerede durur · hangi sözü tutar» düzeninde:
- **Ortak ayarlar:** `sistem/ayar.py` (`/api/ayar`, kapının sayfa başına
  koyduğu `window.__LIFEOS_AYAR__`, yalnız bu bilgisayar) ve
  `brand/ortak/animasyon.js` (`ORTAK` deseni, ilk eşitleme birleştirir,
  `ortakYenile` yenilemeden önce yazar). Yeni tercih anahtarı eklerken
  dokunulacak altı yer (SECIMLER, TASINAN, ORTAK, ayar.py ANAHTAR,
  PROFIL_KAPSAR, SIFIRLANAN).
- **Müzik:** `sistem/muzik.py` + `brand/ortak/muzik.js` (listeler, açılış
  kesiti, arka plan, giriş sayfasında çalma).
- **Google'dan veri:** `sistem/ice.py` + `brand/ortak/ice.js` (gizli iCal
  adresi, Takeout özeti, hesap bağlanmaz).
- **Ayarlar paneli:** `brand/ortak/ayarlar.js` (Sistem · modül · Hesap
  alanları, profiller, yedek, katman katman bulanıklık, erişilebilirlik).
- **Giriş sayfası ayarları:** `sistem/sunucu.py` giriş şablonu (tema, açılınca
  son modül, müzik, duvar kâğıdı).

## Koşulacak testler
- `python tools/yazi.py --denetle` (belge başlıkları da denetlenir; çıkış 0)

## Sonuç
- **Ne değişti:** `belgeler/TEKNIK.md` dosyasına var olan metin korunarak beş yeni bölüm eklendi: Ortak ayarlar, Müzik, Google'dan veri, Ayarlar paneli ve Giriş sayfası ayarları. Her bölüm 5–15 satır kuralına, «ne yapar · nerede durur · hangi sözü tutar» düzenine ve başlık yazım kurallarına uygun olarak yazıldı.
- **Hangi test koştu:** `python tools/yazi.py --denetle` ve `node tools/runtests.js 4731` (AYS).
- **Çıktısı:**
  - `python tools/yazi.py --denetle` -> `Yazı denetimi: temiz` (çıkış kodu 0)
  - `AYS/tools/runtests.js 4731` -> `3121/3121 gecti` (çıkış kodu 0)
- **Açık kalan:** Yok. Kodla çelişen bir durum görülmedi.
