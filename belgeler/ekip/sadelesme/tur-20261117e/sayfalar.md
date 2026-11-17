# Tur 2026-11-17e · «sayfalar» paketi raporu

Sahip: sayfalar ajanı. Dosyalar: kabuk/kabuk.js (KAPAK hariç), kabuk/kabuk.css (token bloğu hariç), kabuk/index.html, kabuk/kabuk.test.js, tools/kabuk_gez.js, kabuk_esit_gez.js, hareket_gez.js, kalite/hiz_olcum.js. Commit/push yok.

## Durum
- [x] 0. Okuma (yon.md, AGENTS.md, bilesen.css/test kuralları, dil.md sözleşmesi: --baslik-serif, --okuma, --alan-ton, --alan-isik, --isik-oran, [data-ton])
- [x] 1. Önce görselleri (HEAD b88e0826'nın git archive kopyasından, `once-*`) + 4× yavaş CPU kare ölçümü
- [x] 2. Kapak ve zemin
- [x] 3. Bugün
- [x] 4. Öğren / alan / konu haritası
- [x] 5. Ders sayfası
- [x] 6. King + Ayarlar
- [x] 7. Koyu + 390 (görüntülerle bakıldı)
- [ ] 8. Kalite kapısı (koşuyor)

## Ne değişti
**kabuk/kabuk.js**
- `ust()`: kapağın altındaki ayrı simge kutusu (`.kapak-alt`) kalktı; aynı amblem (`.kapak__simge`) artık sayfa başlığının (ilk h1) başında: `amblem(yer)` + rota'da tek satır. Öğe sayısı aynı.
- `rota` → `yaz()`: `#sayfa[data-ton]` = `KAPAK[yer.id][1]` (dil.md sözleşmesi: o kapta `--alan-ton`/`--alan-isik`). Ders ve kapı sayfaları da alanın tonunu alır; Bugün tonsuz (sıcak ana renk).
- `gunYayi(t)` (saf): Türkiye ortası için yaklaşık gün doğumu/batımı (deklinasyon + zaman denklemi, UTC+3, 39° K 35° D; ± 15 dk; `shortcut:` yorumu var). `gunYayiHtml(t)`: tarihin yanında 66×21 px yay; gündüz güneş doğumdan batıma, gece ay; geçilen kısım dolu çizgi. `role="img"`, `aria-label` «Güneş batana dek 4 saat 32 dakika» / «Gün doğana dek …». Bugün'de bileşenin iç bloğunun başına konur (bilesen.js'e dokunulmadı).
- `dersParagraf(B, p)` (saf): «Özetle» ile başlayan paragraf `p.ders__ozetle`; öbürleri `B.paragraf` aynen. `dersMetni` bunu kullanır (Onaylar ekranı da).
- Ders sayfasında `.ders-ilerleme` (üstte 3 px, aria-hidden); `kaydir()` kaydırma oranını `scaleX` ile yazar (yalnız ders sayfasında, sorgu tek seçici).

**kabuk/kabuk.css** (token bloğuna dokunulmadı; yeni bölüm dosyanın sonunda «Tur 2026-11-17e · sayfalar», 7 alt bölüm; ölü `.kapak-alt` kuralları silindi)
1. Zemin ışıması: `#sayfa::before` alanın tonunu kapağın altından ~560 px aşağı süzer (dil.md `--alan-isik`'in yarı gücü: tam güç sayfayı pembeye boyuyordu). Kapağın alt kenarı 96 px (telefonda 56/72) dört duraklı eğriyle tam o ışıklı zemin rengine (`--zemin-isik`) erir: dikiş yok.
2. Kapaklı sayfa başlığı geniş ekranda kapağın içinde, serif 2.75–3.6 rem; amblem başlığın solunda (sahnede beyaz kutu, telefonda alan tonu).
3. Bugün: selam serif 2.6–4.25 rem; günün yayı; alan kartları kendi tonunda (soldan hafif ton geçişi, simge kutusu tonlu, ilerleme çizgisi ve yüzde alanın renginde), yumuşak gölge; bölüm başlıkları serif.
4. Öğren kartları tonlu; aşama adı, ünite/dal/grup başlıkları, ders kartı ve aşama kartı adları serif; «AŞAMA 1» / sınav bölüm adları küçük aralıklı büyük harf; şimdiki adım ve sıradaki konu alanın tonunda; konu adları okuma serifinde.
5. Ders: okuma metni `--okuma` 19 px (telefonda 18), 66ch, satır 1.72; özet paragrafı eğik giriş; ilk metin paragrafında 3.9em büyük ilk harf (alan tonunda); «Özetle» ton bloğu; `.ders-tablo` kâğıt kart, serif başlık, küçük büyük harf sütun adları, sola yaslı; alıştırmalar yüzey kartı + yumuşak gölge, «1/4» alan tonunda; Bitir ortada, 52 px, üstünde kısa ton çizgisi (telefonda tam genişlik).
6. King: King cevapları okuma serifinde (kod/tablo sans). Divan kipinde (`#sayfa:has([data-king-kip=divan][aria-pressed=true])`) giriş metni eğik serif, King balonu altın tonlu, balonun başında ince ◆ süs çizgisi.
7. Ayarlar: bölüm başlıkları serif h3 boyunda.

**kabuk/kabuk.test.js**: iki yeni test (günün yayı: kasım/haziran gün uzunluğu, gece ilerleyişi, aria metni; «Özetle» paragrafı). 73 geçti.

## Ölçüm
- Önce (HEAD kopyası, 4× yavaş CPU, 1280 px, 7 sayfalık gezinti × 3, `scratchpad/sayfalar/cek.js --kare`): en uzun kare 100 / 83 / 100 ms, 50 ms'yi aşan kare 3 / 4 / 5. [ölçüldü]
- Sonra: (kalite kapısıyla birlikte doluyor)

## Görseller
`sayfalar-gorsel/once-*` (HEAD), `sonra-*` (bu tur, öbür ajanların değişiklikleriyle birlikte): Bugün, Öğren, Tarih, Akademik, ders (tarih.1.1.1), King, Ayarlar × 1440/390 × açık/koyu; ek: ders tablosu ve Özetle, King Divan konuşması.

## Notlar
- `kabuk.css`'te `.b-karsilama__selam` ve `.b-karsilama__alan` için `:root` önekli geçersiz kılmalar var (bileşen dil ajanının): dil ajanı aynı şeyi bileşende yaparsa benimkiler silinebilir.
- Sahne ajanı piksel amblem (`PIKSEL_DOGA.amblem`) verirse `amblem()` içinde simge yerine o konur; bu yazılırken sahne.md'de sözleşme yoktu.
