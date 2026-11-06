# Android ve kök sertifika: durum (2026-11-06)

Dal: `claude/android-sertifika-2546c4`. `main`'e birleştirilmedi, push edilmedi.

## Karar

Kullanıcı bu oturumda «B: web uygulaması» dedi. Kod bu seçimle yazıldı (`e7e0b3a2`).

| | A: Yerel APK (benim önerim) | B: Web uygulaması (seçilen) |
|---|---|---|
| Simge | tek LifeOS | üç ayrı |
| Bilgisayar kapalıyken | gömülü modüllerle açılır | modül daha önce açıldıysa açılır |
| Sertifika | yalnız uygulama içinde güvenilebilir (tasarım) | ev ağında sisteme kurulur, Tailscale'de gerekmez |
| Ekran kapalıyken rota | ikinci aşamada | yok |
| §1.3 | yeni istisna | değişmez |

Karar değişirse A sıfırdan yazılır: bu bilgisayarda Android SDK ve JDK yok, imza anahtarı secret'ı gerekir.

## Bitti

- `a9f1862e`: kök sertifika yalnız `.local`, `localhost` ve özel IP aralıklarını imzalayabilir; eski kök açılışta yenisine geçer.
- `e7e0b3a2`: kurulum sayfası çalışan adresi bulur (Tailscale, `.local`, IP); QR düzeltmesi; altta «Kur» şeridi; Özel DNS ve pil ipucu.

## Koşulmadı

`node tools/entegre.js` (`brand/ortak/` ve `sistem/`'e dokunduk; birleştirmeden önce şart), `node tools/mobil_tara.js` (üç modül),
AYS ve ESP birim testleri, üç modülde smoke, a11ycheck, layoutcheck. Koşulanlar commit mesajlarında ve oturum raporunda.

## Cihazda denenmedi (kullanıcı)

1. Dalı `main`'e al, LifeOS'u güncelle. Eski kök o an yenisine geçer.
2. Hesap › Cihazlar › Yeni cihaz bağla › QR'ı tabletle okut. Tailscale açıksa kendiliğinden bağlanmalı; değilse sayfadaki adımları izle.
3. Modülde altta «Kur»a dokun, ana ekrandan aç. Öbür iki modülde de yap.
4. Bilgisayarı kapat, ana ekrandan aç: modül açılmalı, kayıt girilebilmeli.
5. iPhone'da yeni kökü kur, eskisini kaldır, ev ağı adresini aç.
6. Bir bankaya girip sertifika uyarısı çıkmadığına ve LifeOS adresinin uyarısız açıldığına bak.
