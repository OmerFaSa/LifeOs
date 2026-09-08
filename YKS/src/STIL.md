# Rota — Stil Rehberi

Tek token kaynağı: `css/tokens.css`. Bileşenler yalnız bu değişkenleri kullanır;
ham renk veya ölçü yazılmaz.

## Renk

İki eksen vardır ve birbirinden bağımsızdır:

| Eksen | Nitelik | Değerler |
|---|---|---|
| Tema | `data-theme` | açık · koyu · sistem (varsayılan) |
| Palet | `data-palette` | indigo (varsayılan) · grafit · okyanus · mor · bordo · orman |

`tokens.css` taban paleti (indigo) tanımlar; `palettes.css` yalnız HUE'ye bağlı
jetonları yeniden yazar. Ölçü, tipografi, gölge ve hareket palete göre değişmez.
Yeni palet eklerken her iki temanın da tanımlanması ve AA kontrastının
korunması zorunludur.

Dört anlam rengi, gerisi nötr.

| Rol | Token | Kullanım |
|---|---|---|
| Birincil | `--primary` | Ana eylem, tamamlanan durum, olumlu ölçüm |
| Vurgu | `--accent` | Uyarı, eşik altı, bekleyen ölçüm |
| Tehlike | `--danger` | Borç, gecikme, yıkıcı işlem |
| Bilgi | `--info` | Nötr açıklama, kesinlik etiketi |

Yüzeyler `--bg → --surface → --surface-2 → --surface-3` sırasıyla derinleşir.
Metin `--text → --text-2 → --text-3` sırasıyla soluklaşır.

**Kontrast (ölçülmüş, her iki tema):** `--text` 15.6:1 · `--text-2` 5.6:1 ·
`--text-3` 4.5:1 · anlam renkleri yüzey üzerinde 4.9–7.3:1. Hepsi WCAG AA.

**Renk tek başına anlam taşımaz.** Durum her zaman ikon veya metinle birlikte
verilir (`C.Badge` tone'a göre ikon ekler).

Ofis ajanlarının beş kimlik rengi (`--agent-patron` … `--agent-analist`) bundan
ayrıdır: durum değil **kimlik** taşırlar, yalnız avatarda kullanılırlar ve
ajanın durumu her zaman ayrıca rozetle verilir. Beyaz harf üzerinde ölçülen
kontrast 5,3–8,9:1'dir.

## Tipografi

İki aile: **Manrope** (başlık, sayı) · **Inter** (gövde, veri).
Ağırlıklar: 400 / 600 / 700 / 800.

| Adım | Token | Kullanım |
|---|---|---|
| xs | 11.5px | Etiket, mono-label, yardımcı bilgi |
| sm | 13px | İkincil metin, tablo hücresi |
| base | 14.5px | Gövde, form |
| md | 16px | Kart başlığı (h3) |
| lg | 20px | Bölüm başlığı (h2) |
| xl | 28px | Ekran başlığı (h1), KPI sayısı |

Sayısal veride `.num` (tabular-nums) zorunlu.

## Ölçü

**Boşluk 8px ritmi:** 4 · 8 · 12 · 16 · 24 · 32 · 40.

Tekrar eden boşluk/hizalama için `style=""` yerine yardımcı sınıf kullanılır:
`gap-4/6/8/14` · `mt-2/4/5/6/8/10/12/14/16` · `mb-10/12` · `minw0` · `jc-end` ·
`as-center` · `ml-auto` · `right` · adlandırılmış genişlikler (`mw-66`, `w-46` …).
`style=""` yalnız **değere bağlı** yerlerde kalır: bar genişliği, iskelet satırı,
etiket rengi. Denetimde bugün 4 tanesi var; hepsi bu üç durumdan biri.
**Yarıçap iki seviye:** `--r-sm` 8px (kontrol) · `--r` 14px (kart, panel).
**Gölge iki seviye:** `--shadow` (kart) · `--shadow-lg` (katman: sheet, palet, popover).
**Perde:** `--scrim` — sheet, palet ve mobil kenar çubuğunun arkasındaki karartma;
koyu temada ayrıca tanımlıdır.

## Hareket

Tek easing `--ease`, iki süre: `--dur` 160ms (durum değişimi) ·
`--dur-lg` 220ms (panel açılış). Animasyon yalnız durum değişimi ve geri
bildirim için. `prefers-reduced-motion` süreleri 0'a çeker — ek kural gerekmez.

Tanımlı hareketler bunlarla sınırlıdır:

| Nerede | Ne | Süre |
|---|---|---|
| `.btn` `.iconbtn` `.chip--tap` | basınca 1px oturur | `--dur` |
| `.overlay` `.cmdk` | artalan yumuşakça belirir | `--dur` |
| `.sheet` `.cmdk__box` | 14px aşağıdan yükselir | `--dur-lg` |
| `.content > .grid` | ekran değişince bir kez, 4px belirme | `--dur-lg` |
| `.bar__fill` `.donut__arc` | değer değişince akar | `--dur-lg` |
| `.toast` | 8px aşağıdan girer | `--dur` |
| `.skeleton__row` | yükleniyor parıltısı (döngü) | 1.3s |
| `.collapse__chev` | açılınca 180° döner | `--dur` |

Dikkat çekmek için animasyon yoktur: yanıp sönme, zıplama, sürekli döngü
(iskelet ve açılış çubuğu dışında) kullanılmaz.

## Ekranlar

Altı gezinme grubu, on yedi ekran:

| Grup | Ekranlar |
|---|---|
| Günlük | Bugün · Hafta |
| Plan | Program · Dersler · Hedef |
| Kayıt | Öğrenme · Deneme · Tekrar · Sınama |
| Analiz | İlerleme · **Analiz** · Telafi |
| Rehber | Rehber · **Profiller** |
| Ofis | **Ofis** · Ekip sohbeti · Toplantı |

`Analiz` altı alt sekmedir: deneme karşılaştırma · boş bırakma · hata haritası ·
sıra geçmişi · unutma eğrisi · kapasite gerçekliği. Hepsi `R.Analytics`
üzerinden okur; hiçbiri yazmaz.

`Profiller` çok kullanıcılıdır: her profil kendi `localStorage` anahtarında
durur (`rota84285.v2.<profil>`), veriler karışmaz. Karşılaştırma ve veli
görünümü yalnız özet okur.

Konu özeti (`topic`) gezinmede yer almaz; Dersler ekranından açılır.

`Ofis` beş ajanlıdır: Patron ekibi yönetir, Tuna TYT'ye, Yaman AYT'ye, Rana
rehberliğe, Deniz ölçüme bakar. Her ajan yalnız kendi brifingini görür; karar
ve gündem kural motorundan gelir. Ayrıntı için `src/OFIS.md`.

Günlük yolculuk tek zincirdir ve `Bugün` ekranındaki **Günün akışı** kartı bu
zinciri gösterir: **izle → not → soru → kart → mola**. Her adım bir ekrana bağlanır;
tamamlananlar sönükleşir, tamamlanmayanların yanında “Git” durur.

## Bileşen sözlüğü

`C.Card` `C.Collapsible` `C.Stat` `C.Bar` `C.Meter` `C.Badge` `C.Chip`
`C.Button` `C.IconButton` `C.Segmented` `C.Subtabs` `C.Field` `C.Input`
`C.Textarea` `C.Select` `C.Checkbox` `C.Notice` `C.Empty` `C.Skeleton`
`C.NextUp` `C.Table` `C.Pager` (+ `C.paginate`)
düzen: `C.Grid` `C.Span` `C.Stack` `C.Cols` `C.Row` `C.SectionTitle`

Varyantlar açık alanlarla gelir: `tone:'ok'|'warn'|'danger'|'info'|'muted'`,
`size:'sm'|'lg'`, `block:true`, `pad:'sm'`, `flat:true`.

Ekrana özel yapılar CSS'te adlandırılır, bileşene çevrilmez:
`quizcard` / `choice` (sınama), `riskrow` (öncelik), `estimate` (tahmini sıra),
`flowstep` (günün akışı), `energy` / `reward` (davranış), `player` / `seg-row` (ders notu),
`runclock` (süreli deneme oturumu), `wizstep` / `levelbtn` (kurulum sihirbazı),
`palettebtn` (palet seçici), `notedot` (profil notu), `msg--me` / `msg--coach` (koç),
`agentav` / `desk` / `deskstate` / `finding` (ofis masaları), `board` (ofis panosu),
`meetbar` / `meetturn` / `reportrow` (toplantı ve rapor).

**Bileşen tek yerdedir.** Eski `UI.stat / badge / notice / table / field / input`
köprüsü kaldırıldı; `R.UI` yalnız ikon, SVG çizim, ipucu rayı ve katman
(sheet / toast) işlerini tutar.

## Kart kuralı

Tek kart stili vardır. Vurgu için renkli sol kenarlık **kullanılmaz**;
başlık yanında rozet kullanılır. Kart içinde en fazla üç bilgi katmanı.

## Durumlar

Her ekran üç durumu tanımlar:

- **Boş** → `C.Empty({ text, action })` — tek net eylem sunar.
- **Yükleniyor** → `C.Skeleton({ rows })` — spinner değil iskelet.
- **Süzgeç boş** → `C.Empty` + “süzgeci sıfırla” eylemi; kullanıcı çıkmaza düşmez.
- **Hata** → `C.Notice({ tone:'danger' })` veya kabuk düzeyinde hata paneli;
  diğer ekranlar açılmaya devam eder.

## Erişilebilirlik kuralları

- Etkileşimli her öğe `<button>`; ikon-only olanlara `aria-label`.
- Görünür odak halkası (`:focus-visible`) hiçbir yerde kaldırılmaz.
- Form etiketi `C.Field` ile input'u sarar.
- `Escape` sırayla: komut paleti → odak modu → ipucu balonu → sheet → kenar çubuğu.

## Yazım

Arayüz Türkçe. Buton fiil ("Kaydet"), sonuç bildirimi geçmiş zaman ("Kaydedildi").
Hata mesajı ne olduğunu ve ne yapılacağını söyler, özür dilemez.
Sayı ve tarih Türkçe biçimde (`19,50` · `14 Eylül 2026`).
