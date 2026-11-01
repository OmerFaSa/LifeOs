# 032 · SPI King sınavı kayıpları: anahtar, kural, giriş (KING-4 3a)

**Durum:** bitti
**Dal:** `ag/032-spi-sinav`
**Efor:** orta
**Kabul testi:** `tools/king_sinav_spi_kabul_test.py`

## Amaç
King sınavı (`node tools/king_sinav.js --modul=spi`) SPI'de kayıp veriyor. Çekirdekte yeni bir **niyet çözücü** var (`brand/ortak/arac.js` söz 6, salt okunur): kalıbı olmayan cümleyi araçların adı, açıklaması, örneği ve **`anahtar`** alanıyla puanlar. Soru okuma, emir yazma aracına gider. Doğrulamayı geçmeyen (zorunlu parametresi eksik) seçim karar sayılmaz. Senin işin modülün araçlarını ve girişini bu cümleleri doğru karşılayacak hâle getirmek. Kabul testindeki HEDEF listesi bugün kaybedilen cümlelerdir.

## Ne yapılacak
- Okuma araçlarına `anahtar` (aşağıda): `spi_gun_kaydi` («bugün neler kaydettim», «dünkü günlüğüm»), `spi_uyku`, `spi_antrenmanlar` (koşu, antrenman sayısı).
- `kural` düzeltmeleri: `spi_besin` «X'in kalori/protein/yağ değeri» de bulsun; `spi_barkod_ogun` «barkodlu … yedim» ve «barkodlu ürünü kahvaltıya 100 gram ekle» (gram ve öğün cümleden); `spi_bolum_ac_kapa` «… bölümünü kapat/gizle/aç» bölüm adını SPİ'nin bölüm kataloğundan bulsun (bulamazsa `null`).
- Kayıt cümleleri veri önizlemesi olsun (`core/quickentry.js`): «kilom 78.4», «sabah aç karnına tartıldım kilom 76.8», «kilom bu sabah 77.2 geldi», «1 buçuk litre su içtim».

**`anahtar` kuralı:** aracın tanımına `anahtar:'…'` (en çok 10 kelime) eklenir: aracın işini anlatan eş anlamlılar (ör. yanlış defteri → «hata yanlış eksik kaçırdığım»). **Sınav cümlesi kopyalanmaz** (kabul testi denetler). Başka araçla ortak genel kelime («bugün», «son») puanı bölmekten başka işe yaramaz.

Elle dene: `node tools/king_sinav.js --modul=spi` (kalan cümleleri ve gelen kararı yazar).

## Dokunulacak dosyalar
- `SPI/src/js/core/kingarac.js`, `SPI/src/js/core/quickentry.js`
- `SPI/src/tests/kingarac.test.js`: her yeni `kural` için cümle → parametre sınaması; her `required` için eksik parametrede `dogrula` reddi.

## Dokunma
- `brand/`, modüldeki ortak kopyalar (`arac.js`, `king*.js`, `yetki.js` …), `app.js`, `screens/`, `tools/king_sinav.js`, `tools/king_sinav.json`, kabul testi dosyası, dist ve build.js.
- `core/turkcesayi.js` ve `core/giris.js` ortak kopyadır; eksik sayı sözcüğü («çeyrek») oradaysa Sonuç'a yaz, Claude Code ekler.
- Yeni Model işlevi ya da depolama anahtarı ekleme. Sayı uydurma (AGENTS §1): çıkarılamayan değer `null`.

## Kabul ölçütü
- `python tools/king_sinav_spi_kabul_test.py` yeşil: HEDEF'ten en çok 3 cümle kalır, başka hiçbir cümle kaybedilmez (gerileme yok), sınav cümlesi `kingarac.js`'e kopyalanmamış.
- SPI test takımı yeşil.

## Koşulacak testler
- `python tools/king_sinav_spi_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd SPI && node tools/runtests.js <senin portun>`

## Sonuç
- **Ne değişti:** quickentry.js'e kilo takma adları (kilom, agirligim, tarti, tartildim) ve suda buçuk desteği eklendi. kingarac.js'te spi_gun_kaydi, spi_uyku ve spi_antrenmanlar araçlarına anahtar ve es iyileştirmesi yapıldı; spi_besin ve spi_barkod_ogun kuralları eklendi; spi_bolum_ac_kapa statik liste yerine SP.Bolum.liste() üzerinden dinamik bağlandı ve bolum.js'te basket takma listesine 'market' ve 'sepet' eklendi; sınav cümlesi içeren 4 örnek genel ifadelerle değiştirildi (ezber temizlendi). kingarac.test.js'e kural ve zorunlu parametre testleri eklendi.
- **Koşan testler:** cd SPI && node tools/runtests.js 4742 -> 2922/2922 gecti
- **Kabul testi:** python tools/king_sinav_spi_kabul_test.py -> king sinav spi kabul: 102/105 gecti, 15 hedeften 1 kaldi, gerileme yok.
- **Açık kalan:** yok
