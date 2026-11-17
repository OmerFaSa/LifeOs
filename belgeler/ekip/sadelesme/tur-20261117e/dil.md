# Tur 2026-11-17e · Paket «dil»: tasarım dili + bileşenler

Sahip: dil ajanı. Dosyalar: kabuk/bilesen.css, bilesen.js, bilesen.test.js, bilesen.html, kabuk/kabuk.css'in en üstteki :root token bloğu (+ ayar.js yalnız Yazı tipi gerekiyorsa). Commit/push yok.

## Durum
- [x] 1 Yazı kimliği (token + h1)
- [x] 2 Işık ve renk (token; AA ölçüldü)
- [x] 3 Bileşen cilası
- [x] 4 Vitrin
- [x] Kalite kapısı (olcum.py AŞIM: HEAD'de de kırmızı, aşağıda)
- [x] Görseller önce/sonra

## Sözleşme (öbür ajanlar buradan okur)
Hepsi kabuk/kabuk.css'in en üstteki token bloğunda. Değerleri elle yazmayın, adı kullanın.

**Yazı**
- `--baslik-serif` — başlık serifi: `"Sitka Display","Sitka Heading","Iowan Old Style","New York",ui-serif,Georgia,serif`. Taban `h1` artık bununla (kabuk.css taban kuralı, weight 600, line-height 1.1). Piksel yazı tipinde piksele döner.
- `--okuma` — okuma serifi: `"Sitka Text","Iowan Old Style",Charter,ui-serif,Georgia,serif`. **Uygulamak sizde:** ders metni (`.ders p, .ders li`), King cevabı, not gövdesi `font-family:var(--okuma)`. Piksel yazı tipinde piksele döner.
- `--baslik` (sans, değişmedi) — üst çubuk, h2. `--govde` (sans) arayüz.
- `--yz-h1` büyüdü: `clamp(2rem, 2.4vw + 1rem, 2.875rem)` (eski en çok 2.375rem). `--yz-h2` 1.45 → 1.5rem.

**Işık ve renk**
- Açık: `--bg #f5f0e8` sıcak kâğıt zemin, `--yuzey #fffcf7` sıcak beyaz kart, `--yuzey-2 #eee6da`. Koyu: gece mavisi-is siyahı (`--bg #0e1117`, `--yuzey #161a22`, `--yuzey-2 #1e232d`, `--yuzey-ust #222733`), lamba vurgusu `--ana #f2a65e`, `--dugme-ana #f4e2c0` (sıcak lamba kâğıdı).
- Gölgeler iki katman (yakın + uzak, sıcak tonlu); koyuda üst kenarda 1 px iç ışık (`inset 0 1px 0 #ffffff0d`) — kartın üstüne lamba vurur. Adlar aynı: `--golge-yumusak`, `--golge-orta`, `--golge-buyuk`.
- `--alan-ton` — alanın tonu. Varsayılan `var(--ana)`. Bir kaba `data-ton="<r-* adı>"` verin (`mavi|yesil|turuncu|pembe|gok|sari|mor|deniz`; kabuk.js `KAPAK[alan][1]` zaten bu adları taşıyor) → o kabın içinde `--alan-ton` = `var(--r-<ad>)` (tema bilir).
- `--alan-isik` — o tonun zemine süzülen hafif ışığı: `color-mix(in srgb, var(--alan-ton) var(--isik-oran), transparent)`; açıkta %16, koyuda %22 (`--isik-oran`). Kullanım önerisi (sayfalar ajanı, kapak ışıması): `background:linear-gradient(180deg, var(--alan-isik), transparent 420px) var(--bg)` ya da `radial-gradient(...)`. Kendisi `[data-ton]` taşıyan kapta yeniden hesaplanır, ayrıca bir şey yazmayın.
- Vurgu seçenekleri (Ayarlar › Vurgu) artık koyu temada açık karşılıklarına geçer (`#8db0ff` vb.); açık temada yeşil/turuncu/pembe AA için bir ton koyulaştı.


**Bileşen hâlleri (bilesen.css, yeni sınıf yok; öğe sayısı aynı)**
- Kâğıt yüzey: `.b-dugme`, `.b-dugme--ana`, `.b-liste--satir`, `.b-sayi`, `.b-soru`, `.b-karsilama__alan/__plan/__ek` dinlenmede `--golge-yumusak`, üzerine gelince `--golge-orta`. Düğme üzerine gelince 1 px kalkar.
- Basınca hafif çökme: düğme, şık, kart notu, tercih, adım `:active` → `translateY(1px) scale(.98)`, gölge kalkar. (Satır, alan ve ders kartının basışı kabuk.css'teki eğim kuralında, dokunmadım.)
- Ana düğme üzerine gelince/basınca opaklık yerine `--ana` ile karışan sıcak ton (`color-mix`).
- Giriş alanı ve soru şıkkı dinlenmede 1 px iç çizgi (`--cizgi`), üzerine gelince `--cizgi-guclu`; odak halkası kabuk.css'teki nötr halka (değişmedi).
- Soru şıkkı harfi 28 px yuvarlak rozet; seçilince vurgu dolgusu, doğru şıkta altın dolgu + altın ton zemin. Seçili/doğru çizgi 3 → 2 px.
- Rozet (`.b-pul`) hap biçimi, renkli türler %9 ton zemin + yarı saydam 1 px çizgi. Tercih (`.b-tercih`) hap biçimli bölmeli seçim. İlerleme çizgisi 6 px hap; sürekli dolum vurgunun açığından koyusuna.
- Kart ön yüzü `--okuma` serifinde, `--yz-h2`; arka yüz `--okuma`, `--yz-h3`. Boş durum başlığı `--baslik-serif`. Karşılama selamı `--baslik-serif`.
- Tablo: 1 px ayraç, başlık soluk; satır üzerine gelince %3 ton. Uyarı: türün renginde 1 px iç çizgi.
- Panel, kart, soru iç boşluğu 16 → 24 px.

**Taban başlık kuralı (kabuk.css token bloğunun hemen altı, 3 satır):** `h1` artık `--baslik-serif`, weight 600, line-height 1.1; `h2` `--baslik` (sans) ve `--yz`. Sayfalar ajanının `:root .b-baslik h1{ font-weight:680; letter-spacing:-.028em }` kuralı yaşıyor; serifte biraz ağır, isterse 600'e çeker.

## Ölçüm: WCAG AA (metin/zemin, kontrast oranı)
Araç: scratchpad `kontrast.js` (kabuk.css token değerlerini okur, WCAG 2.x göreli parlaklık). Zeminler: `--bg`, `--yuzey`, `--yuzey-2`, `--yuzey-ust`.
- Açık: en düşük metin oranı **5.07** (`--ana` / `--yuzey-2`); `--soluk` 5.41–6.55; `--altin` 5.64–6.82; `--yazi-2` ≥ 8.4; ana düğme 17.46; `--ana-yazi`/`--ana` 6.27. (Önce: en düşük 4.84.)
- Koyu: en düşük **5.62** (`--soluk` / `--yuzey-ust`); `--ana` 7.39–9.35; `--altin` 8.02–10.15; ana düğme 14.37. (Önce: 6.80; is siyahı daha koyu, `--soluk` biraz kısıldı, hâlâ AA.)
- Vurgu seçenekleri: açıkta yeşil/turuncu/pembe AA'nın altındaydı (`--yuzey-2` üstünde 4.0–4.4) → koyulaştırıldı, şimdi en düşük 4.62 (mavi). Koyu temada vurgular eskiden açık temanın koyu tonlarıydı (koyu zeminde ~3) → koyuya özel açık tonlar, en düşük 6.96; vurgu üstündeki yazı her yerde ≥ 5.7.
- Yüksek kontrast kipi (`--soluk:var(--yazi-2)`, `--cizgi:var(--cizgi-guclu)`) aynen; bileşenlerin ek iç çizgileri bu kipte güçlü çizgiye döner.

## Kalite kapısı (gerçek çıktı)
- `node kabuk/bilesen.test.js` → `24 geçti, 0 kaldı` (yazı tipi kuralı dört jetona genişledi; yeni: `--baslik-serif/--okuma/--alan-ton/--alan-isik` var mı, Piksel yazı tipi serifleri piksele çeviriyor mu).
- Tüm `kabuk/*.test.js` yeşil: acilis 2, bilesen 24, deneme 6, depo 19, etkilesim hepsi, gece 6, hesap-baglanti 14, hesap-giris 16, hesap-yonetim 17, hesap 12, kabuk 71, king-sohbet 8, onay 15, saglik 6, ses 10, tanisma 25.
- `node tools/ortak_test.js` → `276 geçti, 0 kaldı, 23 eski modül vakası atlandı`.
- `node tools/bilesen_goruntu.js` → dört görünüm `taşma 0 px, 28 taş`, `konsolda hata yok` (kabuk-onizleme/bilesen-*.png yenilendi).
- `python tools/belge_dizin_kabul_test.py` → `140 belge, her biri bir kez, baglantilar calisiyor`.
- `node tools/kabuk_gez.js` (en son, ortak çalışan ağaçla) → çıkış 0, 371 ✓, `hepsi geçti`.
- `python kalite/olcum.py --denetle` → **KIRMIZI**: `AŞIM: Kabuk açılış yükü (bayt) 1026937 > tavan 1000000`. Kök: **değişikliksiz HEAD (b88e0826) de kırmızı: 1005327** (git archive kopyasında ölçüldü). Benim payım ≈ +5.0 KB (bilesen.css +2.9 KB, kabuk.css token bölgesi +2.1 KB; gereksiz kural ve yorum kırpılarak 6 KB'tan indirildi). Geri kalan artış öbür paketlerden (piksel-doga.js +11 KB, kabuk.js, kabuk.css sayfa kısmı). Yük azaltma kararı ekip başına: birleştirmeden önce biri bütçeyi düşürmeli ya da tavanı sahip onaylamalı.

## Görseller (dil-gorsel/)
`once-*` = değişikliksiz HEAD; `sonra-*` = HEAD + **yalnız bu paketin** dosyaları (öbür ajanların yarım işi karışmasın diye; ortak ağaçta o sırada piksel sahnede kara bir leke vardı, sahne ajanının yarım işi, benden değil). Sayfalar: vitrin (bilesen.html), Bugün, Felsefe 1. ders; 1440 ve 390; açık ve koyu (12 + 12 dosya).
Dürüst bakış: en görünür fark koyu temada (kahve-siyah → gece mavisi, lamba renkli ana düğme ve vurgu), serif h1/selam ve kartların kâğıt gölgesi. Açık temada fark daha ince (zemin bir ton sıcak/koyu, kartlar sıcak beyaz ve gölgeli). Ders metni hâlâ sans: `--okuma`'yı ders gövdesine uygulamak sayfalar ajanının alanında (`.ders p`); uygulanınca ders sayfası en büyük sıçramayı yapar. Kapak ışıması da `--alan-isik` ile sayfalar ajanında.

## Açık kalan
- `--okuma` ders/King/not gövdesine, `--alan-isik` kapak ışımasına (sayfalar ve ikincil ajanlar).
- Açılış yükü bütçesi (yukarıda) HEAD'den beri aşık.
- Yazı tipi seçeneğine yeni seçenek eklenmedi (gerekmedi): «Cihazın yazısı» serif başlık + sans arayüz, «Piksel» her şeyi piksel yapar.
- Sitka yalnız Windows'ta; iPhone'da Iowan/New York, öbürlerinde Georgia'ya düşer (görsel denetim yalnız Windows Chromium'da yapıldı).

## Notlar
