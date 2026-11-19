# Ekran, Başbuğ ve Sunucu Hız İyileştirme Raporu (2026-11-19)

- **Dallar:**
  - `ag/gece-altyapi-20261119` (`2d731a34` — sadeleştirme düzeltmesi eklendi)
  - `ag/ekran-ve-king-hiz-20261119` (`2d731a34` tabanından küçük, odak PR)
- **Amaç:** Kod incelemesinde (8/10) öne çıkan 5 eksikliği (ekran açılış kazancının düşük kalması, `tekkapi.py` gereksiz kodu, `Tekrar.plan` 1,0× boşa değişiklik, `kopru.py` test kestirmesi ve tek PR boyutu) iki odaklı adımda gidermek.
- **Dokunulmayan alanlar:** `brand/ortak/`, `sistem/hesap.py`, `HKM/daemon.py`, `HKM/core/{king,ollama,ses,aktif}.py`, veritabanı şemaları (`HKM/core/db.py`, `sistem/goc.py` `SEMA`), tipografi/tasarım yönü ve kullanıcı verileri.

## 1. İki Adımlı Düzenleme

### A. İlk PR'ı Sadeleştirme (`ag/gece-altyapi-20261119` · `2d731a34`, 7 dosya, +40/-180, net -140 satır)
- **`sistem/tekkapi.py`, `sistem/sunucu.py`, `tools/tekkapi_test.py` (-133 satır):** 4× yavaş işlemcide ölçülebilir açılış kazancı üretmeyen ~75 satırlık HTTP/1.1 Keep-Alive + `_SayacRfile` çerçevelemesi geri alındı; yalın `disable_nagle_algorithm = True`, `/kabuk/paket.css`, ETag/304/gzip/HEAD ve kesin 413 sınırı korundu.
- **`motor/tekrar.js`:** `1,0×` (sıfır kazanç) veren Schwartzian geçici dizi dönüşümü kaldırıldı; doğrudan `tekrar.sort(...)` içinde `Infinity` eşitlik koruması korundu (`tekrar.test.js` 22/22).
- **`HKM/core/kopru.py`, `HKM/tests/test_kopru.py`:** `_dokum_varsayilan` test kestirmesi ve ikili `if artimli:` dalı kaldırıldı; `_antigravity()` her koşulda `_dokum_oku()` yolunu kullanır ve `t_ag_surekli_cagri` geçici `transcript.jsonl` dosyalarıyla artımlı okumayı uçtan uca sınar.

### B. Odak PR (`ag/ekran-ve-king-hiz-20261119`)
1. **Görünür ekran ve açılış (`ea968c34` + `hareketAcik` düzeltmesi):**
   - `kabuk/etkilesim.js` & `kabuk/an.js`: `#sayfa` `MutationObserver` ve her `pointermove` içinde çalışan zoraki stil hesabı (`getComputedStyle('--sure')`) kaldırıldı; `hareketAcik()` ile `data-hareket` boşken OS `prefers-reduced-motion: reduce` tercihi de `kabuk.css` ile uyumlu kapatıldı; `ilerleme()` çubuk yoksa erken döner.
   - `kabuk/kabuk.css`: `.yukle__ad` varsayılanı `var(--govde, inherit)` yapıldı ve line 798'de zaten ezilen `.ust__kare` `var(--piksel)` kuralı temizlendi; böylece varsayılan açılışta kullanılmayan 2 `Pixelify Sans` `.woff2` (20.4 KB, 2 istek) artık indirilmez (`index.html` bağlantısı ve `[data-yazi="piksel"]` modu korunur).
   - `kabuk/kabuk.js`: Açılışta `alanYukle(etkinAlan)` tamamlandığında `#/bugun` sayfasının tamamını silip baştan çizen `rota()` yerine `bugunAlanGuncelle()` ile yalnız `.b-karsilama__ozet` ve `.b-karsilama__alanlar` güncellenir; `<canvas>` sahne korunur ve sıcak DOM düğüm şişmesi engellenir.
2. **Başbuğ/King ve sunucu (`0d44e319`):**
   - `HKM/core/sohbet.py`: `_king(ad)` kilitli tek kanonik `importlib.import_module(ad)` hâline getirildi (`sohbet._king("mcp") is baglam.mcp`); çift Node işçisi (`_KOPRU_ISCI`) ve çift `_ALAN_ASAMA` önbelleği ortadan kalktı. Yerel serbest sohbette boşa `baglam()` çağrısı (`1 → 0`) ve `tani()` içindeki çift `baglam()` çağrısı (`2 → 1`) kaldırıldı.
   - `sistem/sunucu.py`: `kabuk_paketi()` içine `index.html` ETag'ine bağlı `_PAKET_YAPI` önbelleği eklendi (her istekte tekrar HTML çözme, 2 regex ve 26× `isfile` kalktı).

## 2. Önce / Sonra Ölçümleri

Karşılaştırma tabanı (`v2_before.txt`, `2d731a34` üzeri) ve son ölçüm (`v2_after.txt`, `0d44e319` üzeri; 3 tekrar medyanı) `kalite/hiz_olcum.js` ile aynı makinede çalıştırılmıştır. (`etkilesim.js` `hareketAcik()` refaktörü normal kipte aynı dallanmayı üretir ve son CI'da `hareket_gez.js` + `hiz_olcum.js --denetle` ile doğrulanmıştır.) Ölçülmeyen alanlar için tahmin yürütülmemiştir (`veri yok`).

### Kabuk Açılışı — CPU 4× Yavaş · 40 ms Ağ Gecikmesi (`kalite/hiz_olcum.js`, 3 tekrar medyanı)

| Ölçüt | Önce (Soğuk / Sıcak) | Sonra (Soğuk / Sıcak) | Fark |
|---|---|---|---|
| İlk boyama (FP) | `260 ms` / `160 ms` | `220 ms` / `160 ms` | soğuk `-40 ms` |
| İlk anlamlı çizim (FCP) | `1076 ms` / `292 ms` | `1048 ms` / `284 ms` | soğuk `-28 ms`, sıcak `-8 ms` |
| En büyük çizim (LCP) | `1224 ms` / `292 ms` | `1048 ms` / `284 ms` | soğuk `-176 ms`, sıcak `-8 ms` |
| Etkileşime hazır (ilk rota) | `362 ms` / `209 ms` | `342 ms` / `214 ms` | soğuk `-20 ms`, sıcak `+5 ms` |
| `DOMContentLoaded` | `295 ms` / `180 ms` | `273 ms` / `187 ms` | soğuk `-22 ms`, sıcak `+7 ms` |
| `load` | `363 ms` / `350 ms` | `280 ms` / `192 ms` | soğuk `-83 ms`, sıcak `1,82×` hızlı |
| Son istek bitti | `1295 ms` / `586 ms` | `1236 ms` / `502 ms` | soğuk `-59 ms`, sıcak `-84 ms` |
| Uzun görev (sayı) | `4` / `2` | `2` / `1` | soğuk `%-50`, sıcak `%-50` |
| Uzun görev (toplam süre) | `312 ms` / `107 ms` | `130 ms` / `72 ms` | soğuk `2,40×` azalma |
| En uzun görev | `137 ms` / `57 ms` | `67 ms` / `69 ms` | soğuk `2,04×` azalma, sıcak `+12 ms` |
| Betik süresi (CDP) | `198 ms` / `132 ms` | `153 ms` / `99 ms` | soğuk `%-23`, sıcak `%-25` |
| Stil hesabı (CDP) | `166 ms` / `122 ms` | `134 ms` / `105 ms` | soğuk `%-19`, sıcak `%-14` |
| Yerleşim (CDP) | `642 ms` / `27 ms` | `634 ms` / `19 ms` | sıcak `%-30` |
| İstek sayısı | `15` / `15` | `13` / `13` | `-2` gereksiz `.woff2` |
| Aktarılan | `462.0 KB` / `4.5 KB` | `441.9 KB` / `3.9 KB` | `-20.1 KB` soğuk |
| DOM düğümü | `1396` / `2801` | `1082` / `2173` | soğuk `%-22`, sıcak `%-22` |
| Boşta 3 sn (Bugün) | `0` stil / `0` yerleşim | `0` stil / `0` yerleşim | sonsuz animasyon `yok` |

### Kabuk Açılışı — CPU 1× · 0 ms Gecikme (`kalite/hiz_olcum.js`, 3 tekrar medyanı)

| Ölçüt | Önce (Soğuk / Sıcak) | Sonra (Soğuk / Sıcak) | Fark |
|---|---|---|---|
| İlk anlamlı çizim (FCP) | `200 ms` / `64 ms` | `212 ms` / `64 ms` | soğuk `+12 ms`, sıcak eşit |
| En büyük çizim (LCP) | `220 ms` / `104 ms` | `212 ms` / `64 ms` | sıcak `1,63×` hızlı |
| `load` | `201 ms` / `34 ms` | `55 ms` / `28 ms` | soğuk `3,65×` hızlı |
| Son istek bitti | `233 ms` / `96 ms` | `210 ms` / `73 ms` | soğuk `-23 ms`, sıcak `-23 ms` |
| Uzun görev | `0` / `0` | `0` / `0` | `0 ms` |
| Stil hesabı (CDP) | `29 ms` / `21 ms` | `24 ms` / `14 ms` | soğuk `-5 ms`, sıcak `-7 ms` |
| Yerleşim (CDP) | `116 ms` / `7 ms` | `115 ms` / `2 ms` | sıcak `-5 ms` |
| İstek / Aktarılan | `15` (`462.0 KB`) | `13` (`441.9 KB`) | `-2` istek / `-20.1 KB` |
| DOM düğümü | `1439` / `2870` | `1125` / `2242` | `%-22` |

### Başbuğ/King ve Sunucu Mikro-Ölçümleri

| Ölçüm | Önce | Sonra | Not / Fark |
|---|---|---|---|
| `sistem/sunucu.py` `kabuk_paketi()` ×100 | `46.17 ms` (`_PAKET_YAPI` miss) | `16.17 ms` (`_PAKET_YAPI` hit) | `2.85×` |
| `sohbet._king("mcp") is baglam.mcp` | `False` (çift modül/işçi) | `True` (tek kanonik modül) | çift Node işçisi yok |
| `sohbet.konus` (yerel serbest, 30 günlük DB, `transport` mock) | `~1.120 ms` (`1`× `baglam`) | `0.820 ms` (`0`× `baglam`) | `1.36×` (yalnız çağrı öncesi) |
| `sohbet.tani` (30 günlük DB, `transport` mock) | `~1.444 ms` (`2`× `baglam`) | `1.145 ms` (`1`× `baglam`) | `1.26×` (yalnız çağrı öncesi) |
| Canlı model uçtan uca süreleri | `veri yok` | `veri yok` | bu turda model ağ çağrısı yapılmadı |

## 3. Tasarım Yönüne Dokunulmadan Bırakılan Bulgu (Öneri)

4× yavaş işlemcide soğuk yerleşim süresinin büyük bölümü (`634 ms`, sıcak yüklemede `19 ms`e düşüyor) Windows üzerinde yeni açılan her Chromium sürecinin `Segoe UI Variable Text/Display` ve `Sitka Display/Text` sistem yazı tiplerini DirectWrite üzerinden ilk kez yüklemesinden kaynaklanmaktadır. Salt-okunur bir A/B ölçümünde (kalıcı değişiklik yapılmadan) bu yazı tipleri yerine standart sistem yazı tipi kullanıldığında soğuk FCP `984 ms → 632 ms`, soğuk yerleşim ise `605 ms → 280 ms` (`~325 ms` düşüş) olarak gözlendi. Tasarım yönü ve tipografi sözleşme gereği değiştirilmedi; sahip isterse ayrı bir görsel kararla değerlendirebilir.

## 4. Doğrulama

- `node kabuk/etkilesim.test.js`: 3/3 test geçti (`hepsi geçti`).
- `node tools/hareket_gez.js`: tüm kontroller geçti (`açık`/`az`/`hareketi azalt`, `enUzun: 17 ms`, `uzun: 0`).
- `python tools/ci_yerel.py --sira`: **50/50 yeşil, 276 sn** (kod ve test değişikliklerinin tamamı üzerinde).
- `python kalite/olcum.py --denetle`: `28 bütçe, aşım yok` (son belge güncellemesi sonrası).
- `python tools/belge_dizin_kabul_test.py`: tüm belgeler dizinde bir kez ve bağlantılar geçerli (`170 belge`, dosya eklendikten sonra doğrulandı).
