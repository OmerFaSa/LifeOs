# Faz 8 · P1 Görsel dil raporu (dal `taze-gorsel`, 2026-11-15)

## Ne yapıldı
1. **Ölçü sistemi** (`kabuk/kabuk.css` `:root`):
   - yazı 5 adım: `--yz-k` .8125rem, `--yz` 1rem, `--yz-h3` 1.15rem, `--yz-h2` 1.45rem, `--yz-h1` clamp(1.6–2.1rem);
   - boşluk `--a1..--a7` = 4/8/12/16/24/32/48;
   - köşe 3: `--kose-k` 10, `--kose` 16, `--kose-tam` 999;
   - gölge 3 kat: `--golge-yumusak`, `--golge-orta` (yeni), `--golge-buyuk`; piksel gölgesi `--golge` kalktı.
   Ölçek dışı değerler en yakın adıma oturtuldu (eşitlikte yukarı). Kural `kabuk/bilesen.test.js`'te.
2. **Yüzey katları:** zemin `--bg`, yüzey `--yuzey`, yükseltilmiş `--yuzey-ust` (komut çubuğu, büyük gölgeyle). Sahne üstü cam renkleri jeton oldu (`--cam`, `--cam-guclu`, `--cam-cizgi`, `--kapak-ortu`, `--sinema`, `--murekkep`).
3. **Durum dili** (`bilesen.css` sonu): dinlenme, üzerine gelme, basılı, odak, devre dışı, seçili; düğme, satır, soru şıkkı, kart notu, adım, tercih ve gezinme için aynı biçim. Odak halkası tek: özel outline'lar kalktı.
4. **Boş ve yükleniyor:** «Yükleniyor…» satırları (13 yer) iskelet çizgilere döndü (`.b-iskelet`). Metin `gizli` olarak ekran okuyucuya kalır, `aria-busy` korunur. Boş durum (`.b-bos`) kesik çizgili, ortalı, sakin.
5. **Sayfa cilası:**
   - King: tek öne çıkan şey sohbet. «Ne görür / Ne yapmaz / Claude uygulamasında» kapalı açılırlarda. Artık yanlış olan «LifeOS'un içinde sohbet yok» cümlesi kalktı.
   - Hesap: alt başlık ve «Denetlemek GitHub'a bakar» satırı kalktı.
   - Plan: boş plan sakin boş durum; «Hafta planı» düz düğme.
   - Bugün: ikinci düğme ana düğmeyle aynı yazı boyunda.
6. **Telefon (390 px):** üst çubuk, kırıntı, tercih, satır düğmesi ve ayar menüsü dokunmatikte 44 px. Taşma yok. Alt boşluk zaten `env(safe-area-inset-bottom)`.

## Ölçümler (önce → sonra)
**Jetona bağlanmayan değer** (ölçüm betiği `.gecici/olc.js`):

| Bölge | Yazı | Köşe | Gölge | Boşluk | Renk | Toplam |
|---|---|---|---|---|---|---|
| bilesen.css | 62 → 2 | 0 → 0 | 0 → 0 | 25 → 2 | 0 → 0 | 87 → 4 |
| kabuk.css (P1 bölgesi) | 26 → 1 | 7 → 1 | 4 → 1 | 54 → 9 | 17 → 0 | 108 → 12 |
| kabuk.css (P2 hareket bölgesi, dokunulmadı) | 2 | 4 | 4 | 5 | 6 | 21 |

Kalan 16 değer (P1):
- 1–2 px optik ayar: 11;
- SVG çizim birimi (ağ yazısı 13/20 px): 2;
- `calc(50vw - 600px)` yerleşim: 1;
- `font-size:var(--boy)`: kök, 1;
- profil halkası gölgesi (`.hs-kimlik__harf`, jetonlu renklerle): 1.

**390 px dokunma hedefi < 44 px** (11 sayfa):
- önce: her sayfada üst çubuk 3 + kırıntı 1; Bugün'de 4 satır düğmesi; Ayarlar'da 44 tercih + 6 menü öğesi;
- sonra: yalnız Ayarlar'da 1 doğal `input` (yazı boyu kaydırıcısı).

Yatay taşma: önce 0, sonra 0.

**Kontrast** (WCAG AA, `.gecici/kontrast.js`):
- önce 2 ihlal: açık `--soluk` `--yuzey-2` üstünde 4.29; turuncu vurgu zeminde 4.33;
- sonra 0 ihlal: `--soluk` #716860, turuncu #a8530f.

| Tema | Yazı | bg | yuzey | yuzey-2 | yuzey-ust |
|---|---|---|---|---|---|
| açık | --yazi | 16.15 | 17.12 | 15.20 | 17.12 |
| açık | --yazi-2 | 9.18 | 9.73 | 8.64 | 9.73 |
| açık | --soluk | 5.14 | 5.45 | 4.84 | 5.45 |
| açık | --ana | 5.16 | 5.47 | 4.86 | 5.47 |
| açık | --altin | 5.89 | 6.24 | 5.54 | 6.24 |
| açık | ana düğme yazısı / ana düğme | 17.12 | | | |
| açık | --ana-yazi / --ana | 5.47 | | | |
| koyu | --yazi | 15.30 | 14.21 | 13.12 | 12.80 |
| koyu | --yazi-2 | 12.62 | 11.72 | 10.82 | 10.56 |
| koyu | --soluk | 8.13 | 7.55 | 6.97 | 6.80 |
| koyu | --ana | 8.45 | 7.85 | 7.25 | 7.08 |
| koyu | --altin | 8.39 | 7.79 | 7.19 | 7.02 |
| koyu | ana düğme yazısı / ana düğme | 14.92 | | | |
| koyu | --ana-yazi / --ana | 6.70 | | | |
| açık | vurgu mavi (beyaz yazı / zeminde yazı) | 5.72 / 5.40 | | | |
| açık | vurgu yesil (beyaz yazı / zeminde yazı) | 4.97 / 4.69 | | | |
| açık | vurgu mor (beyaz yazı / zeminde yazı) | 5.82 / 5.49 | | | |
| açık | vurgu turuncu (beyaz yazı / zeminde yazı) | 5.37 / 5.07 | | | |
| açık | vurgu pembe (beyaz yazı / zeminde yazı) | 5.43 / 5.12 | | | |
| açık | vurgu grafit (beyaz yazı / zeminde yazı) | 8.21 / 7.75 | | | |

AA altı: 0

## Ekran görüntüleri
Yerel, commit'lenmedi (talimat):
- önce: `C:\Users\ASUS\LifeOs-taze-gorsel\.gecici\once\`;
- sonra: `C:\Users\ASUS\LifeOs-taze-gorsel\.gecici\sonra\`.

Her biri 11 sayfa × açık/koyu × 1280/390 px. Ad biçimi `<sayfa>_<tema>_<genişlik>.png`. Ortam yalıtılmış: geçici veri, sahte sahip, port 4396. Betik: `.gecici/cek.js`.

## Kapılar
- `node kabuk/*.test.js`: 14 dosya, hepsi geçti (bilesen 22, kabuk 68 …).
- `node tools/kabuk_gez.js`: hepsi geçti.
- `node tools/kabuk_esit_gez.js`: hepsi geçti.
- `tools/tekkapi_test.py`: 147/147.
- `HKM/tests/run.py`: 1062/1062. Windows konsolunda `PYTHONIOENCODING=utf-8` gerekir; yoksa çıktıdaki «→» yüzünden düşer (koddan bağımsız).
- `kalite/olcum.py --denetle`: bütçe tamam.
- `kalite/katman.py`: tamam.

## P2'ye öneriler (hareket bölgesi, dokunulmadı)
- `.b-satir:hover` vb. `0 10px 28px -12px #0000004d` → `var(--golge-orta)`.
- `#halka` diski `0 24px 60px …` ve rıhtım `0 18px 40px …` → `var(--golge-buyuk)`.
- `.ust--sahne .ust__gece:hover` `#ffffff2e` → `var(--cam)`.
- Rıhtım köşeleri 22/14 px → `--kose` / `--kose-k`; `.rihtim__ad` .7rem → `--yz-k`; ölçek dışı boşluklar 14/6/10/3 px.
- `.ust__gece` dokunmatik boyutu P1 bölgesinde `.ust .ust__gece` ile 44 px yapıldı; P2 kendi kuralını değiştirirse buna dikkat.

## Açık kalanlar
- Sağlık alt sayfaları ve Harita yalnız ölçü/durum diliyle yenilendi; yapısal değişiklik yok (zaten tek liste).
- Not sayfası ve öğrenme ekranlarına metin budaması yapılmadı.
- Ders metni 1.0625rem'den gövde boyuna (1rem) indi. Okuma rahatlığı için sahip isterse `--yz` ders sayfasında büyütülebilir.
- `.b-iskelet` katalog taşı değil (28 taş kuralı); yalnız CSS sınıfı.
