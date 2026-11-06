# Her yerden erişim ve model hızı: durum (2026-11-06)

Dal: `claude/her-yerden-erisim-7242be`. `main`'e birleştirilmedi, push edilmedi.

## Bitti

| Konu | Ne değişti | Kanıt |
|---|---|---|
| Model meşgul | Yerel model ilk cevabı 60 yerine 120 sn bekler; mesajlar sırayla gider; sebep kodda ayrı (`yerel-mesgul`, `yerel-kapali`, `yerel-model-yok`, `iptal`); kullanıcı düz Türkçe görür; seçim turu düştüyse ikinci kez beklenmez; akış beklerken «bekle» satırı yollar | `HKM/tests/test_yerel_mesgul.py` |
| Açılışta başlama | Hesap › Bağlantılar › Her yerden erişim: varsayılan kapalı; kullanıcının Windows başlangıç listesine tek satır, kapatınca iz kalmaz. Bilgisayarın ayarına ben dokunmadım, düğme kapalı | `test_uzak.py`, `test_hesap.py` |
| Merkez düşerse | LifeOS açıkken bir dakikada kendisi kalkar (yalnız erişim açıksa); eski tek seferlik denetim açılışta Tailscale hazır değilse bir daha bakmıyordu | `test_uzak.py` bekçi |
| Telefon hâli | King ve hesap sayfası ayırır: bilgisayara ulaşılamıyor, Merkez kapalı, model meşgul, bağlı. Kapalıyken soru en çok 4 sn yoklar, sonra kurallarla sürer | `hesap.test.js`, `king.test.js` |
| 502 ve kapalı bilgisayar | Modül kopyasından açılır (`sw.js`); hesap 502'yi «ulaşılamadı» sayar | `pwa.test.js`, gerçek tarayıcı: 502'de 0,56 sn, cevapsız ağda 3,3 sn |
| Güvenlik | Açık kapatıldı: `/api/merkez/ac` dışarıdan ve ev ağından başlatılabiliyordu, artık yalnız bu bilgisayar. Funnel elle açılsa erişim «açık» sayılmaz, jeton verilmez | `test_uzak.py` |
| Sayfa kapanınca | Model boşa üretmez: bağlantı kopunca okuma kesilir, yarım konuşma geçmişe yazılmaz | `test_yerel_mesgul.py` |
| Oyun açıkken | Bellek darsa ön ısıtma ve gömme modeli yüklenmez | `test_yerel_mesgul.py` |
| King açılınca | Model arkada ısınır (5 dk'da bir), ayar `ollama.sicak` ve bellek sınırı geçerli | `king.test.js`, `test_yerel_mesgul.py` |

## Sayılar (oyun kapalı; oyun açık ölçülmedi)

| Ölçüm | Önce | Sonra |
|---|---|---|
| Sayfa kapandıktan sonra yeni sorunun ilk sözü | 12,3-14,6 sn | 0,44-0,47 sn |
| Soğuk yükleme, ilk söz | 12,3 sn | değişmedi: yükleme kendisi 9-10 sn |
| King açıldıktan 5 sn sonra sorulan ilk soru | 12,3 sn | ~7 sn (hesaplandı, ölçülmedi) |
| Sıcak, ilk söz (533 jetonluk gerçek istem) | 0,05-0,17 sn (bir kez 2,35) | değişmedi |
| İlk cümleye kadar ek gecikme | 0,13-0,2 sn | değişmedi |
| Cümle denetimi | 0,03 ms | değişmedi, akışı geciktirmiyor |
| Modele gitmeden önceki iş | 10 ms | değişmedi |
| Model belleği, `num_ctx` 8192 / 4096 / 2048 | 3015 / 2987 / 2986 MiB | değiştirilmedi: kazanç yok |

Gerçek istem 533 jeton, 520'si önbellekten geliyor; seçim turu önbelleği bozmuyor. İstemi kısaltmak kaliteyi bozar, kazancı küçük: dokunulmadı.

Oyun açıkken günlükten: bellek hatası boş sanal bellek 0,9-5,5 GiB iken, başarılı yükleme 6,8 GiB ve üstü. Görüntü belleği sorun değildi (4,5 GiB boştu). `BELLEK_ALT` 6144 MiB bu tek günlük ölçümden.

## Bitmedi, sonraki adım

1. **`main`'e birleştirme.** `main` bu daldan ileri gitti (`adbe59a7`, `e7c11529`, `b48da341`). Birleştirmeden sonra `python tools/ortak.py --yay`, üç `build.py`, `node tools/entegre.js`.
2. **Her zaman sıcak model.** `isit` `king.kendiliginden` anahtarına bağlı (cfa1f483, depo sahibinin kararı: arka planda model yüklenmez). Bu bilgisayarda anahtar kapalı, ön ısıtma hiç çalışmıyor. Ben kararı değiştirmedim, yalnız King açılınca ısıtma ekledim. Kullanıcıya sorulacak.
3. **Isınma düğümü.** Çağrı `king-kayit.js` `bekleyenleriSun` içinde, çünkü `ac` `king-gorunum.js`'te ve o dosya öbür oturumun. Küçük King (mini) açılışında ısınmaz. Doğrusu `ac()` içine `KI.modelIsit()`.
4. **`telefon-hiz` oturumuna devir (sayfa sunma, bu daldan çıkarıldı):**
   - `adbe59a7`'den beri derlemeler bayat: üç modülde de 11 kaynak farklı, çalışan LifeOS `dist` yerine `src` sunuyor, yani açılış ~230 istek. Derleme commit'i gerekiyor.
   - Sıkıştırma denendi ve kaldırıldı: 7,23 MB -> 2,09 MB (kök 85,7 -> 18,9 KB, betik 5,75 -> 1,67 MB, stil 1,39 -> 0,40 MB), ilk sıkıştırma 0,17 sn. Yalnız dışarıdan gelene, sürüm başına bir kez, `Vary: Accept-Encoding` ile.
   - Merkez'e açılışta modül başına 9 istek, sonraki 65 sn'de 1. Dosya isteği dist'te 4.

## Gerçek cihazda denenmedi

- Samsung ve tablet hiç denenmedi. Koddan engel görmedim (adres, köken, CORS, service worker, akış okuma). Bilinen dış riskler: Android Özel DNS ayarı Tailscale adını çözmeyebilir, Samsung pil kısıtlaması Tailscale'i kapatabilir. iPad'de uygulama yalnız iPhone hedefli (`TARGETED_DEVICE_FAMILY: "1"`); iPad'de tarayıcıyla açılmalı.
- iPhone'da yeni durum cümleleri, bilgisayar kapalı senaryosu ve «Model hazırlanıyor» balonu denenmedi.
- Gerçek yeniden başlatma denenmedi. Kapılar LifeOS kapalıyken durdu (ölçüldü); Tailscale yeniden başlayınca durduğu belgeden biliniyor, denenmedi.
- Açılışta başlama düğmesinin gerçek bilgisayarda çalışması denenmedi: kayıt defteri testte sahte, pencere açmayan Python yalnız ayrı denendi. Oturum açılmadan başlamaz. Başlarken kısa süre bir komut penceresi görünebilir.
- Oyun açıkken hiçbir sonrası sayısı yok; 120 sn ve bellek eşiği oyunla yeniden doğrulanmalı.
- Kapak davranışı okunamadı. Uyku süresi prizde ve pilde «hiçbir zaman»; bu yüzden uyanık tutma eklenmedi.

## Bilinen sınırlar

- LifeOS uygulaması sunucuyu kendisi başlattıysa pencere kapanınca Merkez de kapanır, telefon «Merkez kapalı» görür. Açılışta başlama açıksa pencere kapansa da sürer.
- Hiç açılmamış cihazda LifeOS kapalıysa Tailscale'in boş 502'si görünür; bunu değiştiremeyiz.
- Merkez jetonu cihaz başına değil, tek. Telefon kaybolursa Tailscale'den çıkarılmalı.
- Merkez kapalı/bilgisayar kapalı ayrımı no-cors yoklamasına dayanır; köken ayarı eksikse «Merkez kapalı» der.
