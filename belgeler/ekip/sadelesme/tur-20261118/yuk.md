# Tur 2026-11-18 · Açılış yükü: ilk kullanımda yüklenen modüller

Sorun: `kalite/olcum.py --denetle` «Kabuk açılış yükü» 998 463 / tavan 1 000 000 (LF ile). Sahip görsel iyileştirme istiyor, yer kalmamıştı.
Bütçe gevşetilmedi (`kalite/butce.json`, `kalite/olcum.py` dokunulmadı); açılışta gerekmeyen altı betik ilk kullanımda yükleniyor (an.js örneği gibi).

## Durum
- [x] Modül çağrı haritası
- [x] Yükleyici (kabuk/kabuk.js `SONRA`, `sonraYukle`, rota() denetimi)
- [x] Testler (kabuk.test.js, kabuk_gez.js derin bağlantı adımları)
- [x] Ölçümler (açılış yükü, hiz_olcum önce/sonra)
- [x] `python tools/ci_yerel.py` tamamı (48/50; iki kırmızı öbür ajanın bilesen.css işinden)

## Ertelenen modüller ve gerekçe

| Modül | Bayt | Ne zaman gerekir | Açılışta kim çağırıyordu |
|---|---|---|---|
| hesap.js, hesap-giris.js, hesap-baglanti.js, hesap-yonetim.js | ~114 KB | yalnız `#/hesap` (ve `?sekme`) | kimse: kabuk.js yalnız eski istemciyi (`LIFEOS.HESAP`, /hesap.js) kullanır; Ayarlar'daki Hesap bölümü yalnız `#/hesap` bağlantısı |
| arama.js | 16 KB | yalnız `#/motor/arama` | kimse: komut çubuğunun «Her şeyde ara» öğesi kabuk.js'in kendi kodu, yalnız adrese gider |
| deneme.js | 26 KB | yalnız `#/motor/soru/deneme` | kimse: Soru sayfası yalnız bağlantı verir; deneme yüklenince `Kabuk.ek.soru`'yu sarar (araclar.js çoktan yüklüdür) |

Açılışta kalanlar:
- **acilis.js**: açılış videosunu açılışta oynatır; Hesap'a eklediği bölüm (`Kabuk.hesapUzanti`, `hep: true`) hesap.js tarafından çizim anında okunur, yükleme sırası önemsiz.
- **onay.js**: `Kabuk.Onay` alan paketi kurulurken (bindirme) ve Bugün'de gerekir; ekran kısmını ayırmak büyük iş, kazanç ~15 KB. Bırakıldı.

Modüllerin `document` dinleyicileri (tıklama, gönderme, hashchange) artık yüklenince bağlanır; hiçbiri `stopPropagation` yapmaz, kabuğun dinleyicisiyle sıra önemsiz.

## Yükleyici (kabuk/kabuk.js)
- `SONRA = { hesap: [...4], arama: ['arama.js'], 'soru/deneme': ['deneme.js'] }`: yer ya da «yer/alt yol».
- rota(): modül yüklü değilse üst çubuk + `b-iskelet` («Yükleniyor…»), yükler (biri ötekinin ardından; hesap-*.js yüklenirken `Kabuk.Hesap`'ı ister), sayfanın `data-yol`'u hâlâ aynıysa rota()'yı yeniden çağırır. İskeletin yerine gelen içerik bir kez süzülür (mevcut aria-busy kuralı).
- Hata: bir kez sade `B.bos` («Bu bölüm yüklenemedi», Bugün'e dön); bir sonraki çizim yeniden dener. Yüklenmiş dosya yeniden yüklenmez (çift dinleyici olmaz).
- Önceden çekme: `load`'dan 4 sn sonra `requestIdleCallback` ile altısı da çekilir (veri tasarrufu açıksa çekilmez). 4 sn bilerek: açılışın alan paketiyle ve an.js'le yarışmasın. Not: hiz_olcum ağ durulunca durduğu için bu arka plan isteklerini saymaz; gerçekte soğuk açılıştan ~4 sn sonra 6 istek daha gider (sıcakta 304).
- Sunucu: `/kabuk/paket.js` index.html'deki betikleri birleştirir; ertelenenler pakette yok, `/kabuk/<ad>.js` olarak ayrı gelir (kabuk_dosyasi kapalı listesi zaten izin veriyor).

## Açılış yükü (LF)
- Önce: 998 463 bayt (31 dosya)
- Sonra: 846 174 bayt (25 dosya) → **~152 KB yer açıldı** (yükleyici kabuk.js'e ~2 KB ekledi; aynı anda öbür ajanın kabuk.js/bilesen.css değişiklikleri de bu sayıda).

## Hız ölçümü (`node kalite/hiz_olcum.js --tekrar 3`, CPU 1×, medyan)

| Ölçüt | Önce soğuk | Sonra soğuk | Önce sıcak | Sonra sıcak |
|---|---|---|---|---|
| FCP | 184 ms | 176 ms | 76 ms | 68 ms |
| Etkileşime hazır | 72 ms | 76 ms | 46 ms | 38 ms |
| load | 171 ms | 59 ms | 39 ms | 32 ms |
| Betik süresi (CDP) | 97 ms | 92 ms | 74 ms | 71 ms |
| Aktarılan | 468.4 KB | 425.2 KB | 4.5 KB | 4.5 KB |
| JS (paket) aktarılan | 364.0 KB | 320.6 KB | | |
| JS yığını | 4239 KB | 4186 KB | 7585 KB | 6395 KB |
| İstek | 17 | 17 | 17 | 17 |

`--denetle`: soğuk istek 17 ≤ 20, soğuk aktarılan 425 ≤ 600 KB, alan JSON 2 ≤ 3, sıcak 4 ≤ 40 KB, betik isteği 5 ≤ 6: hepsi ✓.
Süreler bu makinede birkaç ms oynar; açık kazanç bayt, load ve sıcak yığında.

## Testler
- `node kabuk/kabuk.test.js`: 74/74 (yeni: SONRA tablosundaki betikler index.html'de yok, diskte var, yerleri haritada; acilis.js açılışta).
- hesap, hesap-giris, hesap-baglanti, hesap-yonetim, deneme, acilis, onay, saglik, an testleri: hepsi geçti.
- `node tools/kabuk_gez.js`: yeni adımlar: Bugün açılışında altı betik yok; açılıştan sonra boşta çekilir; `#/hesap` doğrudan; Bugün → geri tuşu → Hesap; `#/motor/arama?sokrates` doğrudan; `#/motor/soru/deneme` doğrudan + yenileme; arama.js düşürülünce sade hata, iskelet takılmaz; sayfa hatası yok.
- `python tools/ci_yerel.py`: 48/50 yeşil (267 sn). Hareket gezisi, Kabuk eşitleme gezisi, Kabuk hız bütçesi, Kabuk hesap ekranı, Süreli deneme, Ölçüm/bütçe ✓; `kalite/olcum.py --denetle` «28 bütçe, aşım yok».
  İki kırmızı bu işten değil, aynı anda çalışan ajanın bitmemiş `kabuk/bilesen.css` tercih/ayar değişikliğinden: «bilesen.css yalnız kabuk.css jetonlarını kullanır» (bileşen kataloğu) ve kabuk gezisinde «ayarlar: 320/390 px'te tercih seçicisi taşmaz» (320 px'te «Alanın rengi» seçenekleri kesik). Bu işten önceki gezi koşusunda (bilesen.css değişmeden) ikisi de yeşildi; yeni adımların hepsi ✓.

## Açık kalanlar
- Yukarıdaki iki kırmızı öbür ajanın bilesen.css işinde kapanmalı.
- onay.js ekran kısmı (~15 KB) ayrılabilir; Bugün'deki `onayBugun` ve bindirme açılışta gerekir.
- Önceden çekme 6 ayrı istek; telefonda tek pakete (sunucuda `paket.js?sonra`) toplanabilir, şimdilik gerek görülmedi.
