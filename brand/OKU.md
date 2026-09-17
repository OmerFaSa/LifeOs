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
| HKM | `HKM/brand/` | Yalnızca bu README ve dış tanıtım — HKM'nin kendi panosu (`HKM/web/index.html`) kasıtlı olarak markasız kalır (bkz. o dosyanın baş yorumu: "ikon yok, sözcük var") |

Her klasörde üç dosya:

- **`logo.png`** — durağan marka görseli (dikey, ~576×800), README ve genel
  referans için.
- **`favicon.png`** — `logo.png`'nin kare kırpılmış, küçültülmüş hâli
  (192×192); sekme ikonu ve PWA kurulum ikonu bunu kullanır.
- **`intro.mp4`** — ~8 saniyelik açılış videosu. AYS/SPİ/ESP'de her açılışta
  oynar (bkz. `src/index.html`'deki `#brand-splash`), "Atla" ile geçilebilir,
  `prefers-reduced-motion` tercihinde hiç görünmez (otomasyon dahil).

## Bir logoyu ya da videoyu değiştirmek

İlgili klasördeki dosyayı **aynı adla** yenisiyle değiştirin
(`logo.png`, `favicon.png`, `intro.mp4`). AYS/SPİ/ESP için `build.py`
tekrar çalıştırıldığında yeni dosyalar `dist/img/brand/`'a da kopyalanır.
Başka hiçbir dosyada değişiklik gerekmez — HTML, CSS ve JS hep aynı sabit
yola bakar.

`favicon.png` yeniden üretilecekse: `logo.png`'nin üst kare bölgesini
(rozet, alttaki yazı hariç) kırpıp 192×192'ye küçültmek yeterlidir.
