# 031 · AYS King sınavı kayıpları: anahtar, kural, giriş (KING-4 3a)

**Durum:** bekliyor
**Dal:** `ag/031-ays-sinav`
**Efor:** orta
**Kabul testi:** `tools/king_sinav_ays_kabul_test.py`

## Amaç
King sınavı (`node tools/king_sinav.js --modul=ays`) AYS'de kayıp veriyor. Çekirdekte yeni bir **niyet çözücü** var (`brand/ortak/arac.js` söz 6, salt okunur): kalıbı olmayan cümleyi araçların adı, açıklaması, örneği ve **`anahtar`** alanıyla puanlar. Soru okuma, emir yazma aracına gider. Doğrulamayı geçmeyen (zorunlu parametresi eksik) seçim karar sayılmaz. Senin işin modülün araçlarını ve girişini bu cümleleri doğru karşılayacak hâle getirmek. Kabul testindeki HEDEF listesi bugün kaybedilen cümlelerdir.

## Ne yapılacak
- **Onaylar eylemleri** (`yazma()`, `R.ACTIONS`): eylemin uygulanması için gereken parametreler (ör. `week-target` → `questionTarget`, `gunluk-sure` → `dakika`, `gecici-sure` → `from/to/dakika`, `ara-ver` → `from/to`, `bolum-ac-kapa` → bölüm ve açık/kapalı, `topic-review` → konu) şemada `required` olsun; parametreyi cümleden çıkaran `kural(t, metin)` yazılsın. Cümle çözümü için **`core/komut.js`'i kullan** (zaten «hedef 600 olsun», «günde 4 saat», «bu hafta ara» çözüyor); yeni bir ayrıştırıcı yazma. Çıkarılamayan parametre tahmin edilmez (`null` döner; King sorar).
- Okuma araçlarına `anahtar` (aşağıda) ve gerekiyorsa `ES` düzenli ifadesi.
- Kayıt cümlesi «1 buçuk saat geometri çalıştım» veri önizlemesi olsun (`core/entry.js`; «buçuk», «çeyrek», «yarım» sayıları).

**`anahtar` kuralı:** aracın tanımına `anahtar:'…'` (en çok 10 kelime) eklenir: aracın işini anlatan eş anlamlılar (ör. yanlış defteri → «hata yanlış eksik kaçırdığım»). **Sınav cümlesi kopyalanmaz** (kabul testi denetler). Başka araçla ortak genel kelime («bugün», «son») puanı bölmekten başka işe yaramaz.

Elle dene: `node tools/king_sinav.js --modul=ays` (kalan cümleleri ve gelen kararı yazar).

## Dokunulacak dosyalar
- `AYS/src/js/core/kingarac.js`, `AYS/src/js/core/komut.js`, `AYS/src/js/core/entry.js`
- `AYS/src/tests/kingarac.test.js`: her yeni `kural` için cümle → parametre sınaması; her `required` için eksik parametrede `dogrula` reddi.

## Dokunma
- `brand/`, modüldeki ortak kopyalar (`arac.js`, `king*.js`, `yetki.js` …), `app.js`, `screens/`, `tools/king_sinav.js`, `tools/king_sinav.json`, kabul testi dosyası, dist ve build.js.
- `core/turkcesayi.js` ve `core/giris.js` ortak kopyadır; eksik sayı sözcüğü («çeyrek») oradaysa Sonuç'a yaz, Claude Code ekler.
- Yeni Model işlevi ya da depolama anahtarı ekleme. Sayı uydurma (AGENTS §1): çıkarılamayan değer `null`.

## Kabul ölçütü
- `python tools/king_sinav_ays_kabul_test.py` yeşil: HEDEF'ten en çok 3 cümle kalır, başka hiçbir cümle kaybedilmez (gerileme yok), sınav cümlesi `kingarac.js`'e kopyalanmamış.
- AYS test takımı yeşil.

## Koşulacak testler
- `python tools/king_sinav_ays_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd AYS && node tools/runtests.js <senin portun>`

## Sonuç
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
