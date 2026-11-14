# Faz 7 · Hesap ekranı · Bağlantılar ve her yerden erişim

## Kapsam
`kabuk/hesap-baglanti.js` (Kabuk.hesapUzanti, `sira: 20`, tıklama öneki `data-hb-ac`, form `data-hb-form`): oturum açıkken Cihazlar'ın ardına iki bölüm çizer.
«Bağlantılar» (takvim aboneliği, erişim anahtarları + tarifler) ve «Her yerden erişim» (Merkez hâli, Tailscale aç/kapat, açılışta başlama).

## Eski paneldeki karşılığı
brand/ortak/hesap.js `sayfalar.baglantilar / takvim / anahtarlar / uzak` ve tıklama işleyicileri (`takvim-ac`, `takvim-yenile(-sor)`, `takvim-kapat`, `takvim-indir`,
`anahtar` formu, `anahtar-sil`, `uzak-ac/kapat`, `uzak-acilis`, `uzak-bak`, `kopyala`). Sözler `yz('ortak.hesap.*')` sözlüğünden birebir alındı.
İstemci işlevleri: `baglantilar, takvimAc, takvimKapat, anahtarAc, anahtarSil, uzakDurum, uzakAc, uzakKapat, uzakAcilis, merkezHali, merkezHalMetni`.
Bilinçli farklar: takvimi **kapatmak** da artık onay ister (eskisi tek dokunuştu; kapatınca adres ölür, yeniden açınca yeni adres gelir); anahtar silme onay ister (görev isteği).
Eski paneldeki «Gelen kutusu» ve «Doğrulayıcı uygulama / Kodla cihaz bağla» satırları bu pakete girmedi (ikincisi başka paketlerde).

## Yapılan
- **Takvim aboneliği**: durum satırı (Açık/Kapalı, AYS yayınının etkinlik sayısı); kapalıyken anlatım + «Aboneliği aç». Açıkken iPhone/iPad (ev ağı / Tailscale / oturum sunucusu)
  ve bu bilgisayarın adresi salt okunur alanlarda, yanlarında «Kopyala»; Google için «Dosyayı indir (.ics)»; «Adresi yenile» ve «Aboneliği kapat» önce sorar; son bakış zamanı.
- **Erişim anahtarları**: liste (ön ek…, «özeti de okur», son kullanım), «Sil» → «Evet, sil / Vazgeç». «Anahtar oluştur» formu: ad, «Günün özetini de okuyabilsin», şifre;
  yanlış şifre formda söylenir (ad ve seçim kalır, şifre silinir). Yeni anahtar bir kez: «… hazır. Şimdi kopyala; bir daha gösterilmez.» + kopya alanı; tarifler
  (İstek, iPhone Kısayollar, Siri «Bugün ne var?», AYS/ESP, Apple Sağlık, Android HTTP Shortcuts, Home Assistant yaml) anahtar dolu gelir, yoksa `lifeos_…` yer tutucu.
- **Her yerden erişim**: herkese Merkez hâli (`merkezHalMetni`, bağlı=Tamam, kapalı=Dikkat, Android ipucu) + «Yeniden dene». Yönetim yalnız `sunucu.yerel && rol === 'admin'`
  (eski `pcMi() && admin`): kurulu değil / giriş yok / funnel açık uyarıları, «Her yerden erişim · açık/kapalı» + Aç/Kapat, «Bilgisayar açılınca LifeOS başlasın» (aria-pressed düğme).
  Bilgisayarda üyeye «sahibi (admin) açıp kapatır», başka cihazda «bilgisayarın kendisinden, admin hesabıyla» satırı.
- İletiler ve hatalar kendi bölümünde (`yer: bag | uzak`); aynı anda tek iş; onay adımlarında odak onay düğmesine, form açılınca ad alanına, yeni anahtarda anahtar alanına.
- Çizim hatası bütün Hesap ekranını düşürmesin diye `ciz` try/catch'li (bölüm içinde hata satırı).

## Güvenlik
- Jeton bu dosyaya hiç gelmez; bütün istekler `LIFEOS.HESAP` üzerinden (jeton onun çerezinde).
- Yeni anahtar yalnız bellekteki ekran durumunda (`s.yeni`). Sayfadan çıkınca (`hashchange`, #/hesap dışı) ve sayfaya her girişte durum sıfırlanır → anahtar düşer.
  Kopya düğmesi metni alanın kendisinden okur; anahtar hiçbir `data-*` niteliğine yazılmaz. Yeni `lifeos.*` anahtarı, localStorage/sessionStorage/IndexedDB yazımı yok.
- Şifre durumda tutulmaz (yalnız gönderim anındaki yerel değişken); alan `type="password"`, `autocomplete="current-password"`; hata çiziminde değeri boş gelir.
- Tarayıcı denetiminde anahtar localStorage, sessionStorage, bütün IndexedDB depoları, çerez ve URL'de arandı: yok. Silinen anahtar `/api/hesap/gelen`'de 401 alır.
- Tailscale uçları sunucuda da admin + yerel denetimli; tarayıcı denetiminde `/api/hesap/uzak-*` Playwright'ta taklit edildi, gerçek Tailscale'e hiç istek gitmedi.

## Testler
Birim (`node kabuk/hesap-baglanti.test.js`, gerçek kabuk/bilesen.js + kabuk/hesap.js ile; adresler, tarif isteği, anahtar satırı, takvim/anahtar/form/yeni anahtar/ileti,
her yerden erişimin bütün hâlleri, Hesap ekranında sıra ve jetonun çizilmemesi):
```
node kabuk/hesap-baglanti.test.js   13 geçti, 0 kaldı
node kabuk/hesap.test.js            11 geçti, 0 kaldı
node kabuk/bilesen.test.js          21 geçti, 0 kaldı
node kabuk/kabuk.test.js            68 geçti, 0 kaldı
node kabuk/depo.test.js             19 test geçti
```
Gerçek tarayıcı (geçici Playwright betiği, `tekkapi.py --port 4398 --hkm-ayri`, geçici LOCALAPPDATA/APPDATA/LIFEOS_HESAP_KLASOR; kullanıcının hesap klasörüne dokunulmadı):
```
✓ oturum: Bağlantılar ve Her yerden erişim Cihazlar'dan sonra
✓ her yerden: Merkez satırı ve bu bilgisayarda admin için aç düğmesi (taklit durum)
✓ takvim: açılınca bilgisayar adresi (.ics) ve ileti
✓ takvim: Kopyala adresi panoya koyar, düğme «Kopyalandı» der
✓ takvim: .ics iner
✓ takvim: yenile önce sorar, adres değişmez
✓ takvim: onaylanınca yeni adres; eskisi çalışmaz
✓ takvim: onaylı kapanır, adres çalışmaz
✓ anahtar: form açılınca odak ad alanında
✓ anahtar: yanlış şifre formda söylenir; ad ve seçim kalır, şifre silinir
✓ anahtar: bir kez görünür, «hazır», tarifte Bearer ile
✓ anahtar: localStorage, sessionStorage, IndexedDB, çerez ve adreste yok
✓ anahtar: Kopyala anahtarı panoya koyar
✓ her yerden: aç ve açılışta başlat (taklit uçlar), ileti ve ad
✓ anahtar: sayfadan çıkıp dönünce görünmez, yalnız ön eki
✓ anahtar: sil önce sorar; vazgeçince kalır
✓ anahtar: onaylanınca silinir; anahtar artık geçmez
✓ telefon: yatay taşma yok
✓ konsolda / sayfada hata yok
hepsi geçti
```
(Konsol süzgecinde beklenen iki ağ satırı ayıklandı: yanlış şifre denemesinin 401'i ve bu yalıtılmış ortamda `/api/kabuk/baslangic` 404'ü.)
Görüntüler: `kabuk-onizleme/hesap-baglanti-{kapali,takvim,anahtar,uzak}-{masaustu,telefon}-{acik,koyu}.png` (takvim ve anahtar: 1280 açık + koyu, 390 açık).
İlk çekimde bölüm içindeki iki panel telefonda iç içe kutu gibi duruyordu; paneller kaldırıldı, ayar satırı grup başlığı oldu.

## Açık kalanlar
- `kabuk/hesap.js` `ESKI` metni hâlâ «bağlantılar (takvim, erişim anahtarları) … her yerden erişim şimdilik eski panelde» diyor; `bagHtml`'deki «açmak şimdilik eski panelde» de. Bu paketle güncellenmeli (dosya bana kapalı).
- `Bilesen.alan`'da parola türü yok: `parolaAlani` metin alanını `type="password"`a çeviriyor (`shortcut:` yorumlu). Katalog `tur: 'parola'` alınca ona geçilmeli (hesap-giris de aynı ihtiyaçta).
- Merkez hâli kabukta hep «Bu cihaz henüz Merkez’e bağlı değil.» der: `merkezHali` HESAP'ın `ayar.hkm` ayarına bakar, kabuk HESAP'ı `kur({modul:'giris'})` ile, hkm'siz kuruyor. Kabuk King/Merkez bağlantısını alınca bu satır doğru hâli gösterir (ya da sunucudan bir hâl ucu gerekir). Bilgisayarın kendisinde bu cümle yanıltıcı.
- «Yeniden dene» eskideki gibi `merkezBagla`'yı tetiklemiyor (yalnız `_merkezBagla` iç adıyla dışa açık).
- Takvimdeki yayın `ays/takvim`'i yalnız eski AYS modülü yazıyor; tek sistemde yayımlayan yok → abonelik boş takvim verir. Yeni sistemin sınav günleri buraya yayımlanmalı.
- Erişim anahtarıyla gelen satırları (`/api/hesap/gelen`) eski modüllerin gelen kancası işliyordu; kabukta HESAP kancasız kuruluyor, satırlar Onaylar'a düşmez. Tarif metinleri hâlâ SPİ/AYS/ESP diyor.
- Eski paneldeki «Gelen kutusu» sayfası taşınmadı.
- `tools/kabuk_gez.js`'e bu adımların kalıcı hâli eklenmedi (dosya bana kapalı); geçici betik aynı yalıtımı kullanıyor, oraya taşınabilir.
