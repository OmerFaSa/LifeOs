# Marka görselleri — nasıl çalışır

Her sistemin kendi logosu ve açılış videosu **sabit bir dosya adında** durur.
Bunu değiştirmenin tek yolu dosyayı aynı adla yenisiyle değiştirmektir — kod
hiçbir yerde dokunulmaz, çünkü hiçbir yerde dosya adı değil, bu sabit yol
geçer.

| Sistem | Kaynak | Kullanılan yerler |
|---|---|---|
| LifeOS (kök) | `brand/life/` | Bu depo README'sinin başlığı |
| AYS | `AYS/src/img/brand/` | Açılış videosu, favicon, PWA ikonu, `dist/img/brand/` (build.py kopyalar) |
| SPİ | `SPI/src/img/brand/` | Açılış videosu, favicon, PWA ikonu, `dist/img/brand/` (build.py kopyalar) |
| ESP | `ESP/src/img/brand/` | Açılış videosu, favicon, PWA ikonu, `dist/img/brand/` (build.py kopyalar) |
| HKM | `HKM/brand/` | Sekme ikonu ve panonun künyesi (`/brand/...` adresinden servis edilir), bu README ve dış tanıtım |
| Seviye sistemi | `brand/seviye/` | Kademe rozetleri ve geçiş videoları — üç sistemin ORTAK dosyaları (bkz. `brand/seviye/OKU.md`) |

Her klasörde üç dosya:

- **`logo.png`** — durağan marka görseli (dikey, ~576×800), README ve genel
  referans için.
- **`favicon.png`** — `logo.png`'nin kare kırpılmış, küçültülmüş hâli
  (192×192); sekme ikonu ve PWA kurulum ikonu bunu kullanır.
- **`intro.mp4`** — ~8 saniyelik açılış videosu. AYS/SPİ/ESP'de her açılışta
  **sesli** oynar (bkz. `src/index.html`'deki `#marka-perde` ve
  `src/js/core/perde.js`), sağ alttaki «Geç» düğmesi ya da Esc ile geçilir,
  `prefers-reduced-motion` tercihinde hiç görünmez (otomasyon dahil).

## Logo NEREDE görünür

Kural tek cümle: **bu depoda logo çizilen her yerde kullanıcının kendi
görseli durur.** Önce künyede ve açılış ekranında "R"/"S"/"E" harfi üreten
daireler vardı; artık hepsi `favicon.png`. Harf üretmek, kullanıcının
markasının yerine sistemin kendi icadını koymaktı.

| Yer | Dosya |
|---|---|
| Sekme ikonu (üç arayüz) | `img/brand/favicon.png` |
| Telefona kurulum ikonu (PWA) | `img/brand/favicon.png` |
| Künye (üstteki marka düğmesi) | `img/brand/favicon.png` |
| Alt bant markası | `img/brand/favicon.png` |
| Açılış (yükleniyor) ekranı | `img/brand/favicon.png` |
| Açılış videosu | `img/brand/intro.mp4` |
| HKM panosu — sekme ikonu ve künye | `HKM/brand/favicon.png` |
| LifeOS giriş sayfası (`sunucu.py`) | `brand/life/logo.png`, `favicon.png` |
| Kademe rozetleri ve geçiş videoları | `brand/seviye/kademe-N.png` / `.mp4` |

Hiçbirinde dosya adı koda yazılı değildir; hepsi bu sabit yollara bakar.

## Bir logoyu ya da videoyu değiştirmek

İlgili klasördeki dosyayı **aynı adla** yenisiyle değiştirin
(`logo.png`, `favicon.png`, `intro.mp4`). AYS/SPİ/ESP için `build.py`
tekrar çalıştırıldığında yeni dosyalar `dist/img/brand/`'a da kopyalanır.
Başka hiçbir dosyada değişiklik gerekmez — HTML, CSS ve JS hep aynı sabit
yola bakar.

`favicon.png` yeniden üretilecekse: `logo.png`'nin üst kare bölgesini
(rozet, alttaki yazı hariç) kırpıp 192×192'ye küçültmek yeterlidir.
