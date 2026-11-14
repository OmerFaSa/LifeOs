# Faz 6 · Onay ekranı

Sahip taslak dersleri JSON düzenlemeden, dokunarak onaylasın diye kabukta «Onaylar» yeri (`#/onay`). 2026-11-14.

## Sahibin gördüğü

- **Bugün**: «Onay bekleyen N ders.» bilgi satırı, «Onaylar» bağlantısıyla; yalnız N > 0 iken. Bugün 544 ders bekliyor (ölçüldü;
  görevdeki «~800» ders değil, alıştırmalarla birlikte bir tahmindi). Sayı on alanın bütün aşamalarından sayılır; yüklenmemiş alan
  varsa satırın yeri önce boş kalır, içerik gelince yalnız o satır yerine konur (sayfa yeniden çizilmez).
- **Onaylar** (`#/onay`; Sistem haritasında, halkadan iki adım, komut çubuğunda «Onaylar»): iki sayı kutusu (onay bekleyen,
  onaylı; ikisi de «ölçüldü»), on alanın satırı (aşama başına «N taslak, M onaylı · ölçüldü»), «Onayları sakla» düğmesi
  ve «Senin adımın» bölümü. «Bütün alanları onayla» düğmesi yok; hiçbir şey kendiliğinden onaylanmaz.
- **Alan** (`#/onay/<alan>`): aşama başına üniteler (kaç dersi onaylı) ve «Aşama kapısı» satırı.
- **Ünite** (`#/onay/<alan>/<n>/<ünite>`): dersler ve «Ünite kapısı», her birinde «taslak» ya da «onaylı» rozeti.
  «Ünitenin hepsini onayla» önce düz bir onay bloğu açar: «3 ders onaylansın mı?», alıştırmalar ve kapının soru sayısı,
  «okumadığın ders de onaylanmış sayılır»; «3 dersi onayla» ya da «Vazgeç». Onaylandıktan sonra «Ünitenin onayını geri al».
- **Ders** (`#/onay/<alan>/<n>/<ders>`): öğrenenin gördüğü metnin aynısı (kabuk.js `dersMetni`; taslak uyarısı, özet,
  paragraflar, kaynak notu), kaynaklar açık ve yoluyla, satırıyla; içerikte `dogrulama: "dogrulanmamis"` kaynak varsa
  «Kaynaklar doğrulanmadı: 3 kaynaktan 3 tanesi henüz kontrol edilmedi.» Alıştırmalar cevap anahtarıyla (doğru şık işaretli,
  şıklar kapalı, çözüm; öğrenenin kaydına hiçbir şey yazılmaz). Altta «Onayla» (ders + alıştırmaları) ve «Sonraki ders»;
  onaylıysa «Onaylandı. 2026-11-14 · sahip» ve «Geri al».
- **Kapı** (`…/<ünite|aşama>/kapi`): kapı soruları cevap anahtarıyla, «Onayla» / «Geri al». Görevde istenmedi ama kapı soruları
  da `durum` taşıyor (SEMA); onaylanamazsa kapı sonucu hep «sorular taslak» kalır ve yanlışlar Tekrar'a girmez.
- **Senin adımın** (durağan, düz Türkçe): telefonda «Bilgisayara gönder» (tek kapıdan önce şart); Claude'u bir kez kapatıp açmak
  (King için); Windows'ta BitLocker ya da Cihaz şifreleme.

## Saklama ve bindirme kuralları

- Kayıt anahtarı `lifeos.onay` (KAYIT sınıfı: `kabuk/depo.js` deseni + `depo.test.js` listesi; IndexedDB'de durur):
  `{"<alan>/<aşama no>/<öğe kimliği>": {"durum": "onayli", "onaylayan": "sahip", "onayTarihi": "YYYY-MM-DD"}}`.
  Tarih yerel gün (UTC değil). Boş kalınca anahtar silinir.
- Öğe = durum taşıyan her şey: ders, alıştırma, ünite ve aşama kapı sorusu. «Onayla» dersi alıştırmalarıyla yazar; ünite onayı
  dersleri, alıştırmaları ve ünite kapısını; kapı onayı yalnız kapı sorularını.
- Bindirme `LIFEOS.Kabuk.Onay.uygula(veri, alan, n, onay)` saf işlevdir (`kabuk/onay.js`): kabuk aşama dosyasını
  `Kabuk.Asama.kur` → `Yol.yukle`'ye vermeden ÖNCE uygular (`kabuk.js` `alanKur`). Kimlik birebir eşleşir; başka alanın ya da
  aşamanın anahtarı, geçersiz kayıt (taslak, tarihsiz, onaylayansız) yok sayılır; girdi değişmez, eşleşme yoksa aynı nesne döner.
  Onaylı öğe dosyada `durum: "onayli"` yazılmış gibi davranır: taslak rozeti ve uyarısı kalkar, alıştırması Tekrar adayı olur
  (testte `Yol.tekrarAdaylari` ile gösterildi).
- Onay değişince alan ham içerikten yeniden kurulur (`Kabuk.ic.onayDegisti`); öğrenme kaydı içerikten ayrı olduğu için etkilenmez.
- `alan/*.json` ve `motor/yol.js` değişmedi. «Geri al» yalnız bu kaydı siler: dosyada zaten onaylı öğe buradan geri alınmaz
  (ekranda «içerik dosyasında» yazar).
- Dışa aktarma: «Onayları dosya olarak al» kaydı Blob + bağlantıyla `lifeos-onay-YYYY-MM-DD.json` olarak indirir; ağ yok.

## Araç: tools/onay_uygula.py

`python tools/onay_uygula.py <indirilen dosya>` kuru koşar (ne yazılacağını söyler); `--yaz` ile yazar; `--kok` test içindir.
Anahtarı `alan/<alan>/asama-<n>.json` içindeki, kimliği birebir eşleşen ve `durum` alanı olan nesneye yazar. Bilinmeyen kimlik,
durumsuz öğe (ünite, aşama, kaynak), dosyası olmayan aşama, geçersiz anahtar ya da kayıt raporlanır, tahmin edilmez (çıkış 1;
eşleşenler yine işlenir). Dosyada zaten onaylı öğeye dokunmaz (ilk onayın kimi ve tarihi kalır).
Biçim korunur: dosyalar elle sarılmış (tek satırlık nesneler) olduğundan yeniden dökülmez; konum tutan küçük bir tarayıcıyla
yalnız `durum` değeri değişir, `onaylayan` ve `onayTarihi` durumun ardına eklenir (çok satırlı nesnede kendi satırında, aynı
girinti ve dosyanın satır sonuyla, CRLF dahil; tek satırlıkta aynı satırda). Yazmadan önce sonuç JSON olarak okunur.

## Testler

- `node kabuk/onay.test.js`: 13 geçti (bindirme, birebir kimlik, geçersiz kayıt, kapı soruları, Yol etiketi ve tekrar adayı,
  `Asama.kur` ile iki aşama, kimlikler, onayla/geri al, sayım, depo okuma, yükleme sırası). CI'da yeni adım «Onay bindirmesi ve onay aracı».
- `python tools/onay_uygula_test.py`: 8 geçti (gerçek felsefe ve tarih içeriğinin geçici kopyasında; kuru koşu yazmaz, LF/CRLF,
  girinti, `alan/denetle.py` temiz, ikinci koşu aynı, bilinmeyen ve önekli kimlik tahmin edilmez, dizi girdi reddi). Aynı CI adımında.
- `node tools/kabuk_gez.js`: 237 geçti (19'u yeni «onay» satırı: Bugün satırı ve sayısı, on alan ve «ölçüldü», Senin adımın,
  ders ekranı, Onayla → kayıt, yenileme sonrası onaylı ve IndexedDB'de, öğrenenin ders ekranında taslak uyarısı yok, Bugün sayısı bir azalır,
  Geri al, ünite onay bloğu, Vazgeç, ünite onayı, dosya indirme, indirilen dosya `onay_uygula.py` kuru koşusunda birebir eşleşir,
  ünite geri al, konsol temiz). Ayrı tarayıcı bağlamında koşar, öteki akışlara dokunmaz.
- Değişmeden yeşil: `kabuk.test.js` 55, `depo.test.js` 13 (liste `lifeos.onay` ve `onay.js` ile genişledi; `lifeos.onay.x` kayıt sayılmaz),
  `bilesen.test.js` 13, `tanisma.test.js` 25, `deneme.test.js` 6.
- Ölçüm ve dizin denetimleri: «Açık noktalar»da.

## Görüntüler

`belgeler/ekip/sadelesme/kabuk-onizleme/` (`node tools/kabuk_gez.js --goruntu=onay`; yalnız bu dört ad yenilendi, ötekilere dokunulmadı),
her biri 1280/390 × açık/koyu: `onay-*` (Onaylar), `onay-ders-*` (ders, cevap anahtarı), `onay-unite-*` (ünite onay bloğu),
`onay-bugun-*` (Bugün satırı). Bakıldı: telefonda uzun kaynak yolu yatay taşıyordu (639 px); `.ders` kaynak listesine
`overflow-wrap:anywhere` eklendi, taşma kalktı.

## Açık noktalar

- Onaylar bu tarayıcının deposunda durur; cihazlar arası eşitlenmez. Kalıcı olması için sahip dosyayı alır, biri
  `python tools/onay_uygula.py <dosya> --yaz` koşar ve commit eder (sahibin elle yapacağı adım; «Senin adımın»a eklenmedi,
  çünkü komut çalıştırmak ister).
- Bugün satırı ve Onaylar sayfası sayı için on alanın bütün içeriğini yükler (bugün ~3 MB JSON, oturumda bir kez).
- `tools/tools_dizin_kabul_test.py` dosya listesini `git ls-files`'tan alır: iki yeni araç commit edilmeden «dizindeki … tools/
  altında yok» der (bu koşuda kırmızı yalnız bu yüzden). İki dosya listeye eklenerek koşulunca yeşil: 146 dosya, sekiz bölüm.
- `python tools/belge_dizin_kabul_test.py`: yeşil (100 belge). `python kalite/olcum.py --denetle`: «Bütçe tamam: 28 bütçe, aşım yok.»
- Yan yana çalışanların commit edilmemiş dosyaları (ör. `tools/kalite_etiket_test.py`) ayrıca DIZIN satırı ister; bu işin değil.
