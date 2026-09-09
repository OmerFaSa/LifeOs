# Ekran dönüştürme rehberi

**Durum: tamamlandı.** On üç ekranın tamamı (`today`, `week`, `learn`, `exams`,
`cards`, `quiz`, `subjects`, `plan`, `target`, `progress`, `protocols`, `coach`,
`quiz`, `guide`) ve kabuk katmanı (`app.js`, `palette.js`, `setup.js`, `coach.js`) bu düzene çevrildi;
denetimde ekran başına `0` string birleştirme kalır.

Bu belge artık iki iş için durur: yeni bir ekran yazarken izlenecek düzen ve
eski koda rastlarsan yapılacak eşleştirme.

`today.js` referans uygulamadır.

## Kural

1. Görünüm `h.html\`\`` ile yazılır — araya giren her değer **otomatik kaçırılır**.
2. Yapı `C.*` bileşenlerinden gelir; elle `<div class="card">` yazılmaz.
3. Yapısal HTML (başka bir modülden gelen hazır string) `h.raw()` ile işaretlenir.
4. `style="..."` yazılmaz; CSS sınıfı eklenir.
5. Etkileşim yalnız `data-act` / `data-change` ile bağlanır.

## Eşleştirme tablosu

| Eski | Yeni |
|---|---|
| `'<div class="card">' + x + '</div>'` | `C.Card({ body:x })` |
| `'<div class="card__head"><h3>'+t+'</h3><p>'+s+'</p></div>'` | `C.Card({ title:t, sub:s, body })` |
| `UI.stat(l, v, {tone,note})` | `C.Stat({ label:l, value:v, tone, note })` |
| `'<div class="subtabs">'+...+'</div>'` | `C.Subtabs({ items, value, act })` |
| `'<div class="card"><button ...>başlık</button>'+(open?body:'')` | `C.Collapsible({ title, meta, act, open, body })` |
| `UI.badge(t, tone, true)` | `C.Badge({ label:t, tone })` |
| `UI.notice(txt, tone, title)` | `C.Notice({ body:txt, tone, title })` |
| `UI.empty(txt, btn)` | `C.Empty({ text:txt, action:btn })` |
| `UI.table(h, rows, {tight})` | `C.Table({ headers:h, rows, tight:true })` |
| `UI.meter(l, pct, o)` | `C.Meter({ label:l, value:pct, ...o })` |
| `UI.field(l, input)` | `C.Field({ label:l, input })` |
| `UI.input(id, o)` | `C.Input({ id, ...o })` |
| `UI.select(id, opts, v)` | `C.Select({ id, options:opts, value:v })` |
| `UI.checkbox(l, chk, attrs)` | `C.Checkbox({ label:l, checked:chk, act, data })` |
| `'<button class="btn btn--primary" data-act="x">'+l+'</button>'` | `C.Button({ label:l, tone:'primary', act:'x' })` |
| `'<div class="seg">'+...+'</div>'` | `C.Segmented({ items, value, act })` |
| `'<span class="chip">'+t+'</span>'` | `C.Chip(t)` veya `C.Chip({ label, act, on })` |
| `U.esc(x)` | gereksiz — `html\`${x}\`` zaten kaçırır |
| `'<div class="grid">'` / `'<div class="span-6">'` | `C.Grid(...)` / `C.Span(6, ...)` |
| `style="margin-top:8px"` | CSS sınıfı (`.ritual__cta` gibi) |

## Kalıplar

**Koşullu parça**

```js
${when(hata, () => C.Notice({ body:hata, tone:'danger' }))}
```

**Liste**

```js
${map(kayitlar, k => html`<li>${k.ad}</li>`)}
```

**Hazır HTML gömme** (grafik, ipucu, ray gibi hâlâ string dönen yardımcılar)

```js
${raw(UI.lineChart(seri))}
${raw(UI.hint('srs'))}
```

**Segmented → handler**

`C.Segmented` seçilen değeri `data-value` ile verir:

```js
async 'block-status'(el){ ... el.dataset.value ... }
```

## Kaldırılan eski yüzey

`UI.stat / badge / notice / empty / table / meter / chip / field / input /
textarea / select / checkbox` **artık yoktur.** Bileşenler tek yerde durur: `R.C`.

`R.UI` bugün yalnızca şunları tutar:

- veriye bağlı iki küçük parça — `icon`, `tagDot`, `certainty`
- SVG çizimler — `lineChart`, `barChart`, `paretoBars`, `donut`, `gauge`,
  `sparkline`, `stackBar`, `heatmap`, `legend`
- ipucu ve kenar rayı — `hint`, `rail`, `openHint`, `closeHint`, `isHintOpen`
- katman işleri — `sheet`, `closeSheet`, `isSheetOpen`, `toast`, `confirmSheet`

## Boş / yükleniyor / hata durumları

Her listenin üç durumu tanımlıdır ve hepsi aynı bileşenle çizilir:

| Durum | Bileşen | Kural |
|---|---|---|
| Veri yok | `C.Empty({ icon, text, action })` | Metin *neden* boş olduğunu söyler, eylem bir sonraki adımı verir |
| Süzgeç sonucu boş | `C.Empty` + “süzgeci sıfırla” düğmesi | Kullanıcı çıkmaza düşmez |
| Yükleniyor | `C.Skeleton({ rows })` | Spinner değil iskelet; `aria-busy` taşır |
| Hata | `C.Notice({ tone:'danger' })` | Ekran kabuğu korunur, diğer ekranlar açılmaya devam eder |

## Doğrulama

Her ekrandan sonra:

```bash
python build.py          # dist/rota.html üretilir
```

`http://localhost:4173/tests/` → 499 testin tamamı geçmeli;
ekranı tarayıcıda aç, etkileşimleri dene, `#main [style]` sayısının azaldığını gör.

Denetim sayıları için:

```bash
python tools/audit.py     # satır, concat, esc, sınıf ve tekrar sayıları
```
