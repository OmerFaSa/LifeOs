# Tur 2026-11-19 · Aktif N+1 Sorgu ve Kabuk Görsel Cilası

- **Dal:** `ag/aktif-ve-ekran-cila-20261119` (`origin/main` `f8d8e712` tabanından)
- **Kapsam:**
  1. **Parça A (`632a263f`):** `HKM/core/aktif.py` `icerik()` içindeki N+1 `bam.kayit_getir` + `_acik_mi` döngü sorgularının toplu sorguya indirilmesi (veritabanı şemasına dokunulmadı).
  2. **Parça B (`af0dd5c7`, `ca96676a`):** Gerçek masaüstü (1280×800 koyu) ve telefon (390×844 açık) incelemesinde görülen 3 kabuk görsel/ergonomi pürüzünün giderilmesi ve yan yana `ÖNCE | SONRA` panolarının üretilmesi.

## 1. Parça A — `HKM/core/aktif.py` N+1 Düzeltmesi

`aktif.icerik()` eski BAM kayıtlarını tararken her eski kayıt için ayrı `bam.kayit_getir(con, k["id"])` ve her eski araştırma adayı için ayrı `_acik_mi(con, ...)` çalıştırıyordu.

- **Yapılan (`632a263f`):**
  - `_emir_anahtar(tur_, govde)` ortak yardımcısı ayrıldı (`_acik_mi()` ve `icerik()` aynı kanonik anahtarı kullanır).
  - Eski kayıt gövdeleri tek `SELECT id, govde FROM bam_kayitlar WHERE id IN (...)` sorgusuyla (bozuk JSON / `None` / `dict` olmayan durumlar `{}` sayılarak), açık iş emri anahtarları tek `SELECT anahtar FROM is_emirleri WHERE anahtar IN (...) AND durum IN (...)` sorgusuyla çekildi (`_acik_mi()` doğrudan çağrı uyumu için korundu).
  - **Önce Test (TDD):** `HKM/tests/test_aktif.py` (`t_icerik_toplu_sorgu`) düzeltme öncesi KIRMIZI verdi (`203` SQL sorgusu; 11 testten 1 kırmızı); düzeltme sonrası 12/12 YEŞİL (`Kalan: 0`).

| Ölçüm (`100` eski araştırma + `100` eski materyal + `10` açık emir) | Önce | Sonra | Fark |
|---|---|---|---|
| SQLite sorgu sayısı | `302` | `4` | `75,5×` daha az sorgu |
| 30 tekrar ortalama süre (`aktif.icerik`) | `4,36 ms` | `2,73 ms` | `1,60×` hızlanma |

## 2. Parça B — Kabuk Ekran & Görsel Cilası

1. **Ayarlar (`kabuk/kabuk.js`, `kabuk/kabuk.css`):**
   - Açılışta `IntersectionObserver` kapak altındaki ilk grubu henüz görmediği ve odak (`?grup-hesap`, `?lifeos.beden.boy`) verilen rotalarda `scrollIntoView()` sonrası yarış yaşandığı için sol/mobil menü sekmesi (`aria-current="true"`) doğru konuma oturmayabiliyordu. `sayfaAyarlar()` içinde `ilkGrup` + `odakGecerli` çözüldü, `[data-ayar-satir]` seçici enjeksiyonu kaldırıldı (`getAttribute` eşitliği), mobilde seçili sekme menüye hizalandı ve `ayarIzle()` içine `450 ms` ilk yerleşim kilidi konuldu.
   - Telefon görünümünde (`<= 640 px`) yatay kaydırılan `.ayar-menu` çubuğunun sağ kenarına `mask-image` / `-webkit-mask-image` solması ve uyumlu sağ `scroll-padding-inline` payı eklendi.
2. **Başbuğ (`#/king`, `kabuk/kabuk.css`):**
   - Örnek soru kartçıkları (`.king-oneri__oge`) masaüstünde `align-items:flex-end; min-height:84px` yerine `align-items:center; min-height:64px` yapıldı; `:hover::after` ok işareti `var(--vurgu)` + `2 px` kayma aldı; `.king-kip__oge, .king-yeni` hedef yüksekliği `640 px` altında da `40 px` oldu.
3. **Alan özeti (`#/alan/<alan>`, `kabuk/kabuk.css`):**
   - `.asama-ozet__ikincil` (`Biliyorsan: seviyemi bul`) sakin ikincil hap biçimi ve `36 px` (mobil `40 px`, kaba imleç `44 px`) dokunma hedefi kazandı; `<= 640 px` dar ekranda başlığın altına temizce iner. Yüksek kontrast seçicisinde `:not(:focus-visible)` eklenerek klavye odak halkası korundu (`.asama-ozet .b-dugme` tekliği bozulmadı).

### Önce / Sonra Panoları (1280×800 Koyu · 390×844 Açık)

- [Ayarlar — Etkin grup ve mobil kaydırma solması](ayarlar-once-sonra.png)
- [Başbuğ — Öneri kartları ve mobil kip yüksekliği](king-once-sonra.png)
- [Alan özeti (Felsefe) — 390 px yerleşim ve dokunma hedefi](felsefe-once-sonra.png)

### LF Bayt Farkı (`origin/main` `f8d8e712` tabanına göre)

| Dosya | Önce | Sonra | Fark |
|---|---|---|---|
| `HKM/core/aktif.py` | `17119 B` | `18305 B` | `+1186 B` |
| `kabuk/kabuk.js` | `136037 B` | `137002 B` | `+965 B` |
| `kabuk/kabuk.css` | `119325 B` | `120377 B` | `+1052 B` |

## 3. Bağımsız İncelemeler (`code-reviewer`, `Model: 'pro'`)

- **İnceleyici A (`ad3a7be9`, Parça A `632a263f`):** **TEMİZ.** (`HKM/core/depo.py:399,467` satırlarında `main`'den gelen `_json()` dict-tip kontrolü eksikliği ön-mevcut ayrı iş adayı olarak not edildi.)
- **İnceleyici B (`5f698c6f`, Parça B `af0dd5c7` → `ca96676a`):** İlk turdaki 7 bulgunun (satır odağı / `?grup-hesap` + `ayarIzle` yarışı, `a"b` seçici hatası, yüksek kontrast `:focus-visible`, `scroll-padding-inline`, test beklemeleri/regex) tamamı `ca96676a` ile giderildi ve ikinci incelemede **TEMİZ** onayı alındı.

## 4. Doğrulama

- `node kabuk/kabuk.test.js`: `79 geçti, 0 kaldı`.
- `node tools/kabuk_gez.js`: tüm kontroller geçti (`hepsi geçti`).
- `node tools/hareket_gez.js`: geçti (`ci_yerel.py` 50. adım, `63.7 sn`).
- `python tools/ci_yerel.py --sira`: **50/50 yeşil, 267 sn** (tüm kod, test ve belge değişiklikleri üzerinde).
- `python kalite/olcum.py --denetle`: `28 bütçe, aşım yok` (son rapor güncellemesi sonrası).
- `python tools/belge_dizin_kabul_test.py`: `172 belge, her biri bir kez, baglantilar calisiyor, arsiv ayri.` (son rapor güncellemesi sonrası).
