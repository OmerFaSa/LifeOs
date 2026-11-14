# Senin adımların · sadeleşmenin son kısmı

> 14 Kasım 2026. Sistem tarafında yapılabilecek her şey yapıldı; senin adımların dörde indi.
> Ölçüm ve etiketleme (Onaylar › «Ölçüm için etiketle») plandan çıkarıldı; istersen yaparsın, gerekmiyor.
> Aynı liste LifeOS'ta Onaylar ekranının altında «Senin adımın» başlığıyla da duruyor.

**Senin yerine yapılanlar:** LifeOS güncellendi (6f8319a2) ve açık. Eski notların, kayıtların ve
beden bilgilerin yeni ekranlara getirildi (masaüstü uygulamanda, 14 Kasım sabahı).

## 1. Telefondan gönder

Telefonda LifeOS'a girdiğin, kaybetmek istemediğin kayıt yoksa bu adımı atla.

1. Telefonda LifeOS'u aç (evde ev ağı adresiyle ya da Tailscale ile, her zamanki gibi).
2. **Ayarlar › Hesap**'tan kendi hesabınla gir.
3. **Hesap › Verin** bölümünde **Bilgisayara gönder**'e bas.
4. Bunu dört yerde birer kez yap: **AYS**, **SPİ**, **ESP** ve **Gün** sayfası.
5. Tablet varsa aynısını onda da yap.

## 2. Claude'a haber ver

Claude'a **«gönderdim»** ya da **«telefonda kayıt yok»** yaz. Gerisini Claude yapar:

- bilgisayarın kendi paketlerini alır (uygulamaya bağlanarak, senin bir şeye basmana gerek kalmadan),
- bütün veriyi yedekler ve yedeği doğrular,
- tek kapıyı `python sistem/tek_kapi_ac.py --ac` ile açar; bir şey ters giderse kendiliğinden eski hâline döner,
- eski modülleri, eski kapıları ve HKM yüzünü siler (kod; verin taşınmış ve yedekli),
- testlerden geçirip gönderir ve LifeOS'u günceller.

Bu iş sırasında LifeOS birkaç dakika kapanıp yeniden açılır.

## 3. Dersleri onayla

**Onaylar › bir alan › Aşamanın hepsini onayla.** On alanda yirmi aşama var.
Okuduğunu onayla; emin olmadığını ünite ya da ders ders onayla. Onaylanmayan ders taslak kalır ve tekrara girmez.
Her onay geri alınabilir. Bunu yalnız sen yapabilirsin: içeriği sistem kendisi onaylamaz.

## 4. King ve disk

- **King:** Claude'u bir kez tamamen kapatıp aç. King bundan sonra Claude'un içinde görünür; LifeOS'u yalnız okur.
- **Disk şifreleme:** Windows Ayarlar'da «Cihaz şifreleme» diye ara ve aç. Bu bilgisayarda Windows 11 Home var; Home'da BitLocker'ın yerine «Cihaz şifreleme» geçer.
  Bilgisayar kaybolursa kayıtların okunamaz. Kurtarma anahtarını sakla.
