# Faz 7 · Hesap ekranı: giriş ve güvenlik (kabuk/hesap-giris.js)

Durum: bitti (2026-11-15). Ajan hesap sınırında kesildi; kod, test ve görüntüler tamdı, rapor koordinatör tarafından tamamlandı.

## Kapsam
- `giris` (oturum yok): giriş (+ iki adım kodu), ilk hesap kurulumu, parolamı unuttum, kodla bağlan.
- `ciz` (oturum var): «Güvenlik» bölümü — parola değiştir, kurtarma sorusu, iki adımlı doğrulama aç/kapat, yedek kodları yenile.

## Eski paneldeki karşılığı
Eski panel (`brand/ortak/hesap.js`, kapı görünümleri ve Merkez › Güvenlik) ile aynı akış ve aynı cümleler:
- Giriş (ad + şifre; iki adım açıksa kod ya da yedek kod adımı), «Hesap kur» (bu bilgisayarda ilk hesap: ad, şifre ve güç ipucu, kurtarma sorusu ve cevabı),
  «Şifremi unuttum» (soru gelir, cevap + yeni şifre), «Kodla bağlan» (başka cihazdan 6 haneli kod). Telefon uygulamasında bilgisayar adresi alanı kalır (`adresDuzelt`).
- Güvenlik: şifre değiştir, kurtarma sorusu, iki adımlı doğrulama aç (şifre → QR ve anahtar → kodla onay → yedek kodlar bir kez) ve kapat (şifre + kod), yedek kodları yenile.

## Yapılan
`kabuk/hesap-giris.js` `Kabuk.hesapUzanti`ya iki yüz ekler: `giris` (oturum yokken Oturum bölümünün yerine) ve `ciz` (oturum varken «Güvenlik», `sira: 10`).
Bütün çağrılar eski istemcinin `LIFEOS.HESAP` işlevlerinden geçer (`girisYap`, `girisKod`, `kayitOl`, `soruGetir`, `kurtar`, `baglaKod`, `parolaDegistir`,
`soruAyarla`, `ikiAdimBaslat`, `ikiAdimOnayla`, `ikiAdimKapat`, `yedekYenile`, `ben`). Ekran yalnız bileşen kataloğuyla (`kabuk/bilesen.js`) çizilir;
hata alanın altında, sunucunun cümlesiyle; odak iletiye gider. QR `/qr.js` gerektiğinde yüklenir.

## Güvenlik
- Şifre, cevap ve kod yalnız gönderim çağrısında yaşar: taslağa yalnız `ad`, `soru`, `adres` girer (`KALIR`); hata sonrası şifre alanları boş gelir.
- Jeton eski istemcinin çerezinde kalır; bu dosya `localStorage`, `sessionStorage`, adres ya da günlüğe hiçbir şey yazmaz (tarayıcı gezisi sayfa, adres ve depoda şifre arar).
- İki adım sırrı, bilet ve yedek kodlar yalnız bellekte; Hesap ekranından çıkınca (`hashchange`) silinir; yedek kodlar «Kaydettim» deyince ekrandan gider.
- Yıkıcı işler eski paneldeki gibi onay ister (iki adımı kapatmak şifre + kod).

## Testler
- `node kabuk/hesap-giris.test.js` → **16 geçti, 0 kaldı** (doğrulama yardımcıları, her durumun HTML'i gerçek bileşenlerle).
- Gerçek tarayıcı (yalıtılmış tek kapı, geçici veri): 33 denetim, hepsi geçti. Kurulum, şifre gücü, yanlış şifrede sunucunun cümlesi, şifre değiştirme, kurtarma sorusu,
  iki adımı açma (QR, anahtar, yedek kodlar bir kez), çıkış, eski şifrenin artık geçmemesi, yedek kodla giriş ve kodun eksilmesi, yedek yenileme, iki adımı kapatma,
  kodla bağlanmada geçersiz kod, şifremi unuttum, telefon genişliğinde taşma yok, sayfa hatası yok.
- Görüntüler: `kabuk-onizleme/hesap-giris-*.png` (giriş, kod, hata, bağla, güvenlik; masaüstü ve telefon, açık ve koyu).

## Açık kalanlar
- Tarayıcı gezisi depoya alınmadı (ajanın geçici betiği); kalıcı denetim `tools/kabuk_gez.js`'e eklenmeli.
- Eski panel (`/kartlar/` ve `brand/ortak/hesap.js` panel kodu) hâlâ duruyor; kaldırılması ayrı iş.
