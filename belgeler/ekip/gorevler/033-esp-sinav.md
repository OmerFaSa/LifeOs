# 033 · ESP King sınavı kayıpları: anahtar, kural, giriş (KING-4 3a)

**Durum:** bekliyor
**Dal:** `ag/033-esp-sinav`
**Efor:** orta
**Kabul testi:** `tools/king_sinav_esp_kabul_test.py`

## Amaç
King sınavı (`node tools/king_sinav.js --modul=esp`) ESP'de kayıp veriyor. Çekirdekte yeni bir **niyet çözücü** var (`brand/ortak/arac.js` söz 6, salt okunur): kalıbı olmayan cümleyi araçların adı, açıklaması, örneği ve **`anahtar`** alanıyla puanlar. Soru okuma, emir yazma aracına gider. Doğrulamayı geçmeyen (zorunlu parametresi eksik) seçim karar sayılmaz. Senin işin modülün araçlarını ve girişini bu cümleleri doğru karşılayacak hâle getirmek. Kabul testindeki HEDEF listesi bugün kaybedilen cümlelerdir.

## Ne yapılacak
- Okuma araçlarına `anahtar` (aşağıda): `esp_gun` (bugünkü pratik süresi), `esp_hafta` (hafta/son günler disiplin başına süre), `esp_kitaplar` (okunan, biten, liste).
- `kural` düzeltmeleri: `esp_kitap_bitir` «X'i okumayı tamamladım» da; `esp_alinti_ekle` «kitaptan alıntı ekle: …».
- «kitap ekle» (adsız): ad sorulacak; bu King çekirdeğinin işi, sende değil (IZINLI değil, HEDEF'te kalabilir).
- Kayıt cümleleri veri önizlemesi olsun (`ESP.Parse.parseSession`, `core/parse.js`): «30 sayfa kitap okudum», «45 dakika tarih çalıştım», «çeyrek saat ses açma egzersizi yaptım», «15 dakika artikülasyon ve nefes çalıştım».

**`anahtar` kuralı:** aracın tanımına `anahtar:'…'` (en çok 10 kelime) eklenir: aracın işini anlatan eş anlamlılar (ör. yanlış defteri → «hata yanlış eksik kaçırdığım»). **Sınav cümlesi kopyalanmaz** (kabul testi denetler). Başka araçla ortak genel kelime («bugün», «son») puanı bölmekten başka işe yaramaz.

Elle dene: `node tools/king_sinav.js --modul=esp` (kalan cümleleri ve gelen kararı yazar).

## Dokunulacak dosyalar
- `ESP/src/js/core/kingarac.js`, `ESP/src/js/core/parse.js`
- `ESP/src/tests/kingarac.test.js`: her yeni `kural` için cümle → parametre sınaması; her `required` için eksik parametrede `dogrula` reddi.

## Dokunma
- `brand/`, modüldeki ortak kopyalar (`arac.js`, `king*.js`, `yetki.js` …), `app.js`, `screens/`, `tools/king_sinav.js`, `tools/king_sinav.json`, kabul testi dosyası, dist ve build.js.
- `core/turkcesayi.js` ve `core/giris.js` ortak kopyadır; eksik sayı sözcüğü («çeyrek») oradaysa Sonuç'a yaz, Claude Code ekler.
- Yeni Model işlevi ya da depolama anahtarı ekleme. Sayı uydurma (AGENTS §1): çıkarılamayan değer `null`.

## Kabul ölçütü
- `python tools/king_sinav_esp_kabul_test.py` yeşil: HEDEF'ten en çok 3 cümle kalır, başka hiçbir cümle kaybedilmez (gerileme yok), sınav cümlesi `kingarac.js`'e kopyalanmamış.
- ESP test takımı yeşil.

## Koşulacak testler
- `python tools/king_sinav_esp_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd ESP && node tools/runtests.js <senin portun>`

## Sonuç
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
