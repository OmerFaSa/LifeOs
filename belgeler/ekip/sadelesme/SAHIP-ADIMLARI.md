# Senin adımların · sadeleşmenin son kısmı

> 14 Kasım 2026. Sistem tarafında yapılabilecek her şey yapıldı. Aşağıdakileri yalnız sen yapabilirsin.
> Ölçüm ve etiketleme (Onaylar › «Ölçüm için etiketle») plandan çıkarıldı; istersen yaparsın, gerekmiyor.
> Aynı liste LifeOS'ta Onaylar ekranının altında «Senin adımın» başlığıyla da duruyor.

## 1. Güncelle

LifeOS'taki **Güncelle** düğmesine bas. LifeOS'u kapatıp yeniden açmak da olur.
Yeni ekranlar ve düzeltmeler gelir; kayıtların değişmez.

## 2. Eski kayıtlarını getir

LifeOS açılınca **Bugün** ekranında «Eski sistemdeki kayıtların hazır» kartı var. **Getir**'e bas.
Eski notların, kayıtların ve beden bilgilerin yeni ekranlara kopyalanır; eski yerlerinde de durur.

## 3. Telefondan ve tabletten gönder

Telefonda veri yoksa bu adımı atla; 4. adımda `--telefon-yok` kullanırsın.

1. Telefonda LifeOS'u aç (evde ev ağı adresiyle ya da Tailscale ile, her zamanki gibi).
2. **Ayarlar › Hesap**'tan kendi hesabınla gir.
3. **Hesap › Verin** bölümünde **Bilgisayara gönder**'e bas.
4. Bunu dört yerde birer kez yap: **AYS**, **SPİ**, **ESP** ve **Gün** sayfası.
5. Tablet varsa aynısını onda da yap.

## 4. Bilgisayarda da gönder ve tek kapıyı aç

1. Bilgisayarda da aynı **Bilgisayara gönder**'i dört yerde yap (AYS, SPİ, ESP, Gün). Bu paketler en çok iki saat taze sayılır.
2. **LifeOS penceresini kapat.**
3. PowerShell'i aç ve şunu yaz:
   ```
   cd $env:USERPROFILE\LifeOS-Sistem
   python sistem/tek_kapi_ac.py
   ```
   Bu yalnız bakar, hiçbir şeyi değiştirmez. Son satır **Hazır** demeli; demiyorsa neyin eksik olduğunu yazar.
4. **Hazır** görünce:
   ```
   python sistem/tek_kapi_ac.py --ac
   ```
   Telefonda hiç veri yoksa ve 3. adımı atladıysan: `python sistem/tek_kapi_ac.py --ac --telefon-yok`

Komut önce bütün veriyi yedekler ve yedeği doğrular. Sonra göçü yapar, sonucu karşılaştırır, tek kapıyı açar ve çalıştığını denetler.
Bir şey ters giderse kendiliğinden eski hâline döner ve ne olduğunu yazar.
Geri dönmek istersen: `python sistem/tek_kapi_ac.py --geri`

## 5. Bana haber ver

Claude'a **«tek kapı açıldı»** yaz. Eski modüllerin, eski kapıların ve HKM yüzünün silinmesi ayrı bir dalda hazır bekliyor; o zaman birleştirilir.
Bu yapılana kadar «Güncelle» bu klasörde «elle değiştirilmiş dosya» diyebilir. Bu beklenen bir durumdur.

## 6. Dersleri onayla

**Onaylar › bir alan › Aşamanın hepsini onayla.** On alanda yirmi aşama var.
Okuduğunu onayla; emin olmadığını ünite ya da ders ders onayla. Onaylanmayan ders taslak kalır ve tekrara girmez.
Her onay geri alınabilir.

## 7. King ve disk

- **King:** Claude'u bir kez tamamen kapatıp aç. King bundan sonra Claude'un içinde görünür; LifeOS'u yalnız okur.
- **Disk şifreleme:** Windows Ayarlar'da «Cihaz şifreleme» diye ara ve aç. Bu bilgisayarda Windows 11 Home var; Home'da BitLocker'ın yerine «Cihaz şifreleme» geçer.
  Bilgisayar kaybolursa kayıtların okunamaz. Kurtarma anahtarını sakla.
