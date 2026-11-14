# Senin adımların · sadeleşmenin son kısmı

> 14 Kasım 2026. Sistem tarafında yapılabilecek her şey yapıldı; sana iki adım kaldı.
> Ölçüm ve etiketleme (Onaylar › «Ölçüm için etiketle») plandan çıkarıldı; istersen yaparsın, gerekmiyor.
> Aynı liste LifeOS'ta Onaylar ekranının altında «Senin adımın» başlığıyla da duruyor.

**Senin yerine yapılanlar (14 Kasım):**

- LifeOS güncellendi.
- Eski notların, kayıtların ve beden bilgilerin yeni ekranlara getirildi.
- Telefonda kayıt olmadığını söyledin; bilgisayarın paketleri uygulamadan alındı.
- **Tek kapı açıldı** (16:21). LifeOS artık tek adreste: http://127.0.0.1:4180. Modüller `/ays/`, `/spi/`, `/esp/` altında; eski kayıtların oraya geçti.
- Geçişten önce tam yedek alındı: `%LOCALAPPDATA%\LifeOS\yedek\tek-kapi-20261114-162108`.
  Geri dönmek gerekirse LifeOS-Sistem klasöründe `python sistem/tek_kapi_ac.py --geri`.

## 1. Dersleri onayla

**Onaylar › bir alan › Aşamanın hepsini onayla.** On alanda yirmi aşama var.
Okuduğunu onayla; emin olmadığını ünite ya da ders ders onayla. Onaylanmayan ders taslak kalır ve tekrara girmez.
Her onay geri alınabilir. Bunu yalnız sen yapabilirsin: içeriği sistem kendisi onaylamaz.

## 2. King ve disk

- **King:** Claude'u bir kez tamamen kapatıp aç. King bundan sonra Claude'un içinde görünür; LifeOS'u yalnız okur.
- **Disk şifreleme:** Windows Ayarlar'da «Cihaz şifreleme» diye ara ve aç. Bu bilgisayarda Windows 11 Home var; Home'da BitLocker'ın yerine «Cihaz şifreleme» geçer.
  Bilgisayar kaybolursa kayıtların okunamaz. Kurtarma anahtarını sakla.

## İstersen: telefondan bakmak

Telefondan LifeOS'a bakmak istersen LifeOS-Sistem klasöründe bir kez şunu yaz:

```
python sistem/uzak.py --ac
```

Tailscale yolunu eski kapılardan tek kapıya bağlar (yalnız senin özel ağın; internete açılmaz).
Bu bir ağ ayarı olduğu için Claude yapmadı.
