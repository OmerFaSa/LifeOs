# 081 · Ortak ayarların telefonla iki yönlü eşitlenmesi (sunucu mantığı)

**Durum:** bitti   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/081-ayar-esitle`
**Efor:** yüksek
**Kabul testi:** `tools/ayar_esit_kabul_test.py`

## Amaç
Kullanıcı (2026-11-02): «ayarlar telefonla aynı Wi-Fi üzerinden iki yönlü eşitlensin; çakışmada son yazan
kazansın ama hangisinin kazandığı görünür olsun». Ortak ayarların PC'deki tek kopyası `sistem/ayar.py`'dir
(`ayar.json`). Bu görev yalnız sunucu mantığı: anahtar başına iz (kim, ne zaman), son yazan kazanır,
çakışma kaydı ve `POST /api/ayar/esitle`. İstemciyi ve sunucu.py bağlantısını Claude Code yazar.

## Dokunulacak dosyalar
- `sistem/ayar.py` — yalnız bu dosya. Baştaki «Sozler» yorumuna 5. söz (ASCII Türkçe): «ESITLEME».
  - `ayar.json` iki yeni alan taşır: `iz` = `{anahtar: {"z": ms, "s": ms, "c": cihaz, "a": cihaz adı}}`
    (`z` yazının cihazdaki zamanı, son yazan kazanır buna bakar; `s` sunucunun kabul ettiği an; silinen
    anahtarın izi kalır = mezar taşı) ve `cakisma` = en yeni başta en çok 20 kayıt
    `{"k", "z" (sunucu ms), "kazanan", "kaybeden"}` (ad, cihaz kimliği değil).
  - `oku(kok)` → `{"ayar", "zaman", "iz", "cakisma"}` (yoksa `{}` / `[]`; bozuk dosyada da).
  - `birlestir(degisen, kok=None, cihaz="pc", cihaz_ad="Bu bilgisayar", simdi=None)`: bugünkü davranış
    aynen; ek olarak her kabul edilen anahtara (silme dahil) `iz[k] = {z: simdi, s: simdi, c, a}`.
    `simdi` ms tam sayı, verilmezse `int(time.time()*1000)`. Dönüş yine `(durum, red)`; durum `iz` ve
    `cakisma`yı da taşır.
  - `esitle(cihaz, cihaz_ad, son, gonder, kok=None, simdi=None)` → `{"ayar", "iz", "son", "kabul", "red",
    "cakisma"}`:
    - `cihaz` `^[A-Za-z0-9_-]{4,64}$`, `son` bool olmayan int ≥ 0, `gonder` en çok 120 öğeli dict
      `{anahtar: {"d": str|None, "z": int}}`; değilse `ValueError((400, "…"))`. `cihaz_ad` 40 karaktere
      kırpılır, boşsa «Telefon».
    - Geçersiz anahtar ya da değer (`gecerli`) `red`'e. `z` `simdi`den büyükse `simdi`ye çekilir.
    - Sunucuda izi ya da değeri olmayan anahtar uygulanır.
    - `son == 0` (cihazın ilk eşitlemesi): sunucuda olan anahtar EZİLMEZ ve çakışma yazılmaz.
    - Aksi halde `(z, cihaz) > (iz.z, iz.c)` ise cihaz kazanır ve uygulanır, değilse sunucu kalır.
      Sunucudaki izin `s`'i `son`dan büyükse ve `iz.c != cihaz` ise bu bir **çakışmadır**: kazananın ve
      kaybedenin adıyla `cakisma` kaydı (z = simdi) hem dönüşe hem dosyaya (en yeni başta, en çok 20).
    - Uygulama: `d is None` → anahtar silinir, iz kalır; değilse yazılır (`EN_COK` sınırı aynen).
      `iz[k] = {z, s: simdi, c: cihaz, a: cihaz_ad}`. `kabul` uygulanan sayı. `son` = `simdi`.
    - Aynı `_kilit` altında, atomik yazma (bugünkü `.yaziliyor` + `os.replace`).
  - `isle(h, kok=None, uzak_izin=None)`: `POST /api/ayar/esitle` (gövde `{cihaz, cihaz_ad, son, gonder}`,
    `X-LifeOS: ayar` ister, 400/403 cümleleri Türkçe). 127.0.0.1 ve ::1 dışından gelen istek YALNIZ
    `uzak_izin(h)` doğruysa ve YALNIZ `/api/ayar/esitle`'ye girer; geri kalan her şey 403. Yol `?`'dan
    önce karşılaştırılır. `GET /api/ayar` `iz` ve `cakisma`yı da döner.

## Dokunma
- `sistem/ayar.py` dışında hiçbir dosya; özellikle `sistem/sunucu.py`, `brand/`, `tools/ayar_test.py`.
- Kabul testi dosyası.
- `ANAHTAR` düzenli ifadesi (istemcideki kopyasıyla aynı kalmalı).

## Kabul ölçütü
- `python tools/ayar_esit_kabul_test.py` yeşil (her madde bir sınama: iz, ilk eşitleme, olağan
  güncelleme, iki yönde çakışma, mezar taşı, geçersiz girdi, gelecek saat, 20 sınırı, HTTP kapıları).
- `python tools/ayar_test.py` yeşil kalır (eski davranış).

## Koşulacak testler
- `python tools/ayar_esit_kabul_test.py` (önce kırmızı, sonra yeşil)
- `python tools/ayar_test.py`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:** sistem/ayar.py'ye Söz 5 (ESITLEME) eklendi; ayar.json'a iz ve en çok 20 kayıtlık cakisma listesi eklendi; oku() iz ve cakisma dönecek şekilde güncellendi; birlestir() kabul edilen her anahtar için iz yazacak şekilde genişletildi; esitle() iki yönlü eşitleme fonksiyonu (son yazan kazanır, ilk eşitlemede ezmeme, mezar taşı silme, çakışma kaydı) eklendi; isle() POST /api/ayar/esitle kapısı ve uzak_izin doğrulaması ile güncellendi.
- **Koşan testler:** python tools/ayar_esit_kabul_test.py -> temiz: ayar esitleme kabul testi; python tools/ayar_test.py -> Ortak ayarlar temiz: yalniz bu bilgisayar, ozel baslik, yalniz tercih, silme, sinir, sayfa basi, kacirma.; python tools/telefon_test.py -> temiz
- **Kabul testi:** python tools/ayar_esit_kabul_test.py önce kırmızı (TypeError: birlestir() got an unexpected keyword argument 'simdi'), sonra yeşil (temiz: ayar esitleme kabul testi).
- **Açık kalan:** yok
