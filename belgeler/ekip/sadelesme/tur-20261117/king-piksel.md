# King divanı + piksel sahneler · tur 2026-11-17

Sahip: King ajanı. Dal sadelesme, başlangıç 8137f67b. Commit/push yok.

## Durum
- [x] 1. Divan kipi (sohbet.py KIP_TALIMAT + king-sohbet.js)
- [x] 2. Konu bağlamı (data-king-konu)
- [x] 3. Taht sahnesi
- [x] 4. Piksel cilası
- [x] Kalite kapısı + görseller

## Notlar
- Divan: `HKM/core/sohbet.py` `KIP_TALIMAT["divan"]` (şablon) + `HUKUMDAR` (mete, attila, bilge, alparslan, fatih; Atatürk bilerek yok) + `kip_of(v, hukumdar)` → `"divan:<kimlik>"` ya da liste dışıysa `"ortak"` + `kip_talimati(kip, ilk)` (canlandırma uyarısı yalnız konuşmanın ilk King cevabında; gecmişte assistant yoksa). `HKM/daemon.py` tek satır: `kip_of(govde.kip, govde.hukumdar)` (Antigravity oturum anahtarı hükümdarı da taşır).
- `kabuk/king-sohbet.js`: KIP'e `divan`, `HUKUMDAR`, `s.hukumdar` (depoda, doğrulanır), istek gövdesinde `hukumdar` (hükümdarsız Divan → `ortak`), seçim ev bileşeni `B.cipler` ile; başka hükümdar seçilince yeni konuşma; her hükümdara 3 örnek soru.
- Konu bağlamı: `baglamGecerli` `{tur:'konu', alan:[a-z]+, ad ≤120 tek satır}`; belgede `[data-king-konu]` tıklaması (önlenmez, href gezinir) → Öğretmen kipinde yeni konuşma (aynı konuysa sürer), şerit «Konu: <ad>», örnek sorular «Bu konuyu baştan anlat…». Sunucu `ders_oku` → `konu_blogu`: ad tek satır/120/«» atılır, alan `alan/<alan>` klasörü olmalı; Öğretmen'e «baştan, adım adım anlat» girer.
- Testler: `node kabuk/king-sohbet.test.js` 8/8; `HKM python -m tests.run` 1072/1072 (yeni: divan doğrulama/talimat/izinsiz red, divan sisteme girer + ilk-cevap uyarısı, konu bağlamı).
- Taht (`brand/ortak/piksel-doga.js` `taht`): otağda divan: tahtta oturan hakan silueti (13×19 sprit `HAKAN`, masaüstünde 2×; börk, altın kuşak, sağdan ince ışık kenarı), iki basamaklı seki, kırmızı arkalık + altın kemer, lacivert perde, iki yanda tuğ (kuyruk sallanır) ve dışta kırlangıç kuyruklu sancak, tahta uzanan halı, sağda pirinç mangal (köz hep yanar); gündüz tündükten inen ışık + toz, gece mangal ateşi (2× alev) ve ışığı. Uyk direkleri ve kerege kafesi yalnız sağda belirir: üst-sol ve arama kutusu bölgesi düz keçe. ~14 taban renk.
- Piksel cilası: (1) telefon: sahne `W + dx` genişliğinde kurulur, soldaki `dx` kesilir (`dx = W·(ax−0.5)/(1−ax)`, `ax` varsayılan 0.7) → asıl öğe 390'da ortaya gelir, düğmelerin arkasında kalmaz (bütün 14 sahne; `binaCiz` putImageData −dx, `kare` translate −dx; masaüstünde dx = 0). (2) Müzik: ozan ve ateş masaüstünde 2× ve daha önde. (3) Uyku: kara çadır büyüdü, üstte ay ışığı kenarı. (4) Not: pencerenin sağında duvar kilimi. (5) Beslenme: çeşme büyüdü, yalağın önünde testi. `spr`/`sprG` isteğe bağlı ölçek alır; API aynı.
- Testler: `node tools/ortak_test.js` 276 geçti / 0 kaldı (`piksel: 50/52`, yeni: King divanı sakinleri, telefonda kayma 14 sahne × 2 vakit boşluksuz + gök cismi görünür + taht ortada).
- Ölçüm (Node 427×100 gündüz, 5 denemenin en kısası, aynı makine, iki tur; **ölçüldü, gürültülü**: başka ajanlar çalışıyordu): HEAD 0,85–3,15 ms, yeni 1,0–5,1 ms (kale tek turda 5,1, öteki turda 4,3; kale değişmedi → gürültü); telefon 195×68: 0,4–1,6 ms. `python kalite/olcum.py --denetle`: Bütçe tamam, 28 bütçe, aşım yok.
- Taht son ayar: tündük ışığı ve toz üst çubuğun (arama kutusu) altında başlar.

## Görseller
`king-piksel-gorsel/` (yalıtılmış sunucu, geçici LOCALAPPDATA/APPDATA/LIFEOS_HESAP_KLASOR, saat sabitlendi 12:00 / 22:30): `sahne-<yer>-<gunduz|gece>-<1440|390>.png` (king, muzik, uyku, not, beslenme + telefon kaymasını gösteren felsefe, hareket), `king-divan-*` (Divan → Mete Han: hükümdar çipleri, canlandırma satırı, üç örnek soru), `king-konu-*` (alan sayfasına konan `data-king-konu` bağlantısı tıklandı → «Konu: Malazgirt Savaşı», Öğretmen; istek gövdesi `{tur:'konu', alan:'tarih', ad}`). Dört koşuda sayfa hatası yok.

## Kalite kapısı (son koşu)
- `node kabuk/king-sohbet.test.js`: 8 geçti, 0 kaldı.
- `cd HKM && PYTHONIOENCODING=utf-8 python -m tests.run`: 1072/1072.
- `node tools/ortak_test.js`: 276 geçti, 0 kaldı (piksel 50/52, 2 eski modül vakası atlandı).
- `python kalite/olcum.py --denetle`: Bütçe tamam, 28 bütçe, aşım yok.

## Açık kalanlar
- Canlandırma uyarısı modele talimatla verilir (ilk King cevabında tek satır); kodla zorlanmıyor. Ekranda Divan seçilince aynı uyarı giriş satırında sabit görünür. Gerçek modelle denenmedi (görev gereği model çağrısı yok).
- `HKM/daemon.py`'de tek satır değişti (gövdedeki `hukumdar` → `kip_of`); dosya listemde yoktu ama sunucunun alanı okuduğu tek yer orası.
- Hükümdar bilgileri (çağ, kaynak) talimatta kısa çapa; tarihî doğruluk modelin bilgisine kalıyor, talimat «uydurma, kaynaklar ayrılır de» diyor.
- Konu bağlantısını kabuk ajanı çizecek; ben DOM'a elle koyup denedim. Bağlantı `#sayfa` dışında çizilirse de çalışır (belge düzeyinde dinleyici).
- Not sayfasında «Ayrıntılı not» düğmesi hâlâ pencerenin üstünde (kabuk yerleşimi). Telefonda sahneler artık kesik başlar (sol kısım dışarıda); bu bilinçli.
- Çizim süresi ölçümü gürültülü (aynı anda öteki ajanlar çalışıyordu); aynı koşulda HEAD ile aynı aralıkta.
