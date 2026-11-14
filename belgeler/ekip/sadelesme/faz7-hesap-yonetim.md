# Faz 7 · Hesap yönetimi (kabuk/hesap-yonetim.js)

Durum: bitti (2026-11-14). Commit yok, gönderilmedi.

## Kapsam
Kabuğun Hesap ekranına (`#/hesap`, `kabuk/hesap.js` → `Kabuk.hesapUzanti`, `sira: 30`) eklenen bölümler; yalnız oturum açıkken, Cihazlar'ın ardından:
1. **Profil**: görünen ad, renk (sunucunun `renkler` listesi), açılır «Kişisel bilgiler» (King'in hitabı, doğum günü, e-posta).
2. **Güvenlik kontrolü ve etkinlik**: yeni güvenlik olayı uyarısı («Bendim» / «İncele»), kontrol listesi (iki adım, kurtarma sorusu, açık cihazlar, son 7 gündeki yanlış denemeler, admin için deponun yedeği), açılır etkinlik defteri, onaylı «Öteki cihazların hepsinden çık».
3. **Yedekler** (admin): son yedek ve «Şimdi yedekle», ikinci yer (ayarla/değiştir/kapat), «Dosyadan yükle» (.db), yedek listesi (tarih, tür, boyut), şifreli indirme, önizlemeli ve şifreli geri yükleme. İndirme, yükleme, ikinci yer ve geri yükleme yalnız bilgisayarın kendisinde (`yedek.yerel`), uzaktan yalnız liste ve «Şimdi yedekle».
4. **Kullanıcılar** (admin): kendi hesabını açma aç/kapa, liste («sen» işaretli), «Yönet» paneli (rol Üye/Admin, plan, üyenin iki adımını kapatma), «Kullanıcı ekle» (ad + geçici şifre).
5. **Dışa aktar ve hesabı sil**: «Verimi indir» (tek JSON), iki adımlı silme (ne silinir / ne kalır, «Geri alınamaz», şifre).
6. **Güncelleme (telefondan)**: yalnız admin ve `baglam.sunucu.yerel === false` iken; durum, şifreli «Bilgisayarı güncelle», kurulum sürerken 3 sn'de bir izleme (en çok 15 dk).

## Eski paneldeki karşılığı
`brand/ortak/hesap.js` SAYFALAR: `profil`, `guvenlik` (kontrol), `etkinlik`, `cihazlar` (öteki cihazlar), `yonetim` + `kisi`, `verin`, `yedek`, `sistemHtml`; `uyariKarti`. Cümleler, onay adımları ve başarı/hata iletileri oradan birebir alındı. Sapmalar:
- Silme: eski panelde yazılı onay cümlesi yok; şifre + ayrı onay kutusu var. Aynısı yapıldı (görevdeki «typed confirmation» eski panelde olmadığı için eklenmedi).
- Kontrol listesinde «Kırmızı satırlara bir bak» → «‹öneri› işaretli satırlara bir bak.» (kabukta renk tek başına durum taşımaz; satırda «öneri» pulu var).
- «Her sistemin kendi yedeği…» cümlesi alınmadı (tek sisteme geçişte eskidi).
- «Bu cihazdakileri tek depoya taşı» (göç paketi) alınmadı: kapsam dışı, eski panelde kalır.
- Kullanıcıyı «devre dışı bırakma»: sunucuda (`yonet`: rol, plan, iki_adim) böyle bir alan yok; yapılamaz. Rol, plan ve iki adım kapatma var.

## Yapılan
- `kabuk/hesap-yonetim.js`: saf kısım (`kontrol`, `yanlisSayisi`, `yedekHatasi`, `olaySatiri`, `sistemOzet`, `sistemGorunur`, `ekran`) + tarayıcı kısmı (bellekte durum, `data-hy-ac` tıklama, `form[data-hy-form]` gönderme; ikisi de `#/hesap` dışında susar). Yalnız `Kabuk.Bilesen` taşları; yeni CSS yok.
- Sayfaya her girişte veri tazelenir (`ben`, `etkinlik`, `cihazlar`, `uyarilar`; admin: `kullanicilar`, `yedekDurum`; uzak admin: `sistemDurum`). Her başarılı işten sonra etkinlik defteri yeniden okunur.
- Yeniden çizimde yazılmış (şifre ve dosya olmayan) alanlar ve açık bölümler korunur; başarılı gönderimden sonra o form temizlenir/kapanır.
- İş sürerken gönder düğmeleri `aria-disabled` (çift gönderim yok); sonuç bölümün içinde «Tamam»/«Hata» uyarısı, odak ona.
- `kabuk/hesap-yonetim.test.js`: 16 test (saf mantık + gerçek `bilesen.js` ile durumların HTML'i).
- Görüntüler: `kabuk-onizleme/hesap-yonetim-masaustu-acik.png`, `-masaustu-koyu.png`, `-telefon-acik.png`, `-sil-onay.png` (telefon, yanlış şifre sonrası silme onayı).

## Güvenlik ve veri
- Jeton bu dosyaya hiç gelmez; bütün istekler `window.LIFEOS.HESAP` üzerinden. Tarayıcı denetimi: jeton sayfanın HTML'inde yok.
- Şifreler yalnız gönderim anında değişkende; alan gönderilir gönderilmez boşaltılır, yeniden çizimde hiç taşınmaz (test: taslağa girse bile çizilmez). Hiçbir şey loglanmaz, `lifeos.*` anahtarı yok.
- Geri yükleme metni sunucuya göre doğru: `sistem/hesap.py _geri_yukle` önce `kopya_al("once")` ile şimdiki hâlin yedeğini alır, bütün oturumları siler, yedekten sonra silinen anahtar/takvim geri gelmez; ekran bunları ve sayı önizlemesini (`kopya_onizle`) gösterir.
- Silme ve geri yükleme başarıda eski istemci kendi giriş kapısını (`kapiAc`) açıyordu; kabukta onun CSS'i olmadığı için biçimsiz bir sayfa olarak üste çıkıyordu. Bu iki akıştan sonra kapı öğesi ve `hesap-kapi-acik` sınıfı kaldırılıyor (eski istemcinin `kapiKapat(false)`'ının yaptığı); ekran kabuğun girişsiz durumuna döner.
- Yetkiyi sunucu denetler (üye isteği 403; son admin silinemez/düşürülemez); ekran yalnız role göre gizler.
- `Bilesen.alan`'da şifre/dosya türü olmadığı için metin alanının çıktısında `type` değiştiriliyor (etiket ve kimlik aynı kalıyor; kodda `shortcut:` notu var).

## Testler
Kapı (son satırlar):
```
node kabuk/hesap-yonetim.test.js   16 geçti, 0 kaldı
node kabuk/hesap.test.js           11 geçti, 0 kaldı
node kabuk/bilesen.test.js         21 geçti, 0 kaldı
node kabuk/kabuk.test.js           68 geçti, 0 kaldı
node kabuk/depo.test.js            19 test geçti
```
Gerçek tarayıcı (geçici Playwright betiği, `tekkapi.py --port 4399 --hkm-ayri`, geçici LOCALAPPDATA/APPDATA/LIFEOS_HESAP_KLASOR, sonunda silindi): 25/25 ✓ —
hesap kur + giriş; profil adı ve rengi sunucuda; «Şimdi yedekle» listeye girer; yedek indir (yanlış şifre söylenir, alan boşalır; doğru şifreyle .db iner); geri yükleme önizlemesi; kullanıcı ekle (form boşalır, kapanır); rol admin → üye; kayıt aç/kapa; dışa aktar JSON iner; etkinlikte «Yedek dosya olarak indirildi»; 1280 açık/koyu ve 390'da yatay taşma yok; üye yönetim bölümlerini görmez; ikinci kullanıcı kendi hesabını siler (yanlış şifrede kalır; doğru şifrede silinir, eski kapı açılmaz, admin listesinden gider); taklit uzak sunucuda «Güncelleme (telefondan)» şifreli formu (güncellemeye basılmadı); geri yükleme oturumu kapatır, eski kapı açılmaz; jeton sayfada yok; sayfa hatası yok. Konsoldaki 404 `/api/hesap/kabuk` (bu pakete ait değil; `kabuk_gez.js` de süzüyor) ve bilerek yanlış girilen şifrenin 401'i süzüldü.

## Açık kalanlar
- `kabuk/hesap.js`: «Eski panelde kalanlar» metni (ESKI) profil, yedekler ve kullanıcıları hâlâ eski panelde sayıyor; güncellenmeli. Profil kaydedilince Oturum satırındaki görünen ad sayfa yeniden açılana kadar eski kalıyor (`sayfa()` oturumu yalnız `ad` değişince tazeler). «Öteki cihazlardan çık»tan sonra Cihazlar listesi de sayfa yeniden açılana kadar eski.
- `brand/ortak/hesap.js`: `oturumKapandi` (oturum başka cihazdan kapatılınca, süre dolunca) kabukta da eski, biçimsiz giriş kapısını açıyor; kabukta kapı açmamak için bir seçenek (ya da `kapiKapat` dışa açılması) gerekli. Bu paket yalnız kendi iki akışında kapıyı kaldırıyor.
- `kabuk/bilesen.js`: `alan`'a `parola` ve `dosya` türleri (bu dosyadaki iki yardımcı o zaman sadeleşir).
- Kullanıcıyı devre dışı bırakma sunucuda yok (`sistem/hesap.py yonet`); istenirse sunucu işi.
- «Bu cihazdakileri tek depoya taşı» (göç paketi) eski panelde kaldı.
- `tools/kabuk_gez.js`'e bu akışların kalıcı adımı eklenmedi (dosya bu paketin değil); geçici betik bu rapordaki adımları izler.
