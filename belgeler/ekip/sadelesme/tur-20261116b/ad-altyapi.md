# Tur 2026-11-16b · Ad (LifeOS → Başbuğ) + altyapı

İlk ajan hesap sınırında kesildi (82 çağrı, rapor yazılmadı); işi kalite kapısındaydı. Koordinatör
(sonraki hesap) kapıları yeniden koştu, riskli parçaları okudu, bu raporu yazdı.

## A) Adlandırma
- Değişti: kullanıcının gördüğü her «LifeOS» kabuk/ dışında: masaüstü uygulaması (pencere başlığı,
  açılış yazısı BAŞBUĞ, hata kutuları), King'in sistem metni (HKM/core/sohbet.py), Antigravity sohbet
  başlığı «Başbuğ King», king/ MCP açıklamaları, README, BASLAT/GUNCELLE betik iletileri, brand/ortak
  görünür metinleri, iOS görünen adı (project.yml), Hesap › Her yerden erişim metni («Merkez» yerine
  «Başbuğ bu bilgisayarda çalışıyor / kapalı»).
- İç kimlik, kaldı (veri kaybı ve kısayol kırılması riski): `X-LifeOS` istek başlığı, `lifeos.*` depo
  anahtarları, `LIFEOS` global, `%LOCALAPPDATA%\LifeOS`, `LifeOS-Sistem`, `LifeOS.exe`, görev
  zamanlayıcı `LifeOS\Acilis`, iCal PRODID, kasa hedefi `LifeOS/HKM/*`, `lifeos-king`, `uygulama/ios/LifeOS/`
  klasörü, `LIFEOS_*` ortam değişkenleri, depo/dal adları.
- Belge: belgeler/ altındaki tarihî belgeler yeniden yazılmadı; AGENTS.md başına ad paragrafı eklendi.

## B) Altyapı
1. Köprü istemi (HKM/core/kopru.py `istem()`): eskiden baştan kırpıyordu (King'in kimliği, kip ve araç
   yasağı düşüyordu). Şimdi baş korunur, geçmişin en eski kısmı kesilir; baş tek başına şişkinse yalnız
   ortası kesilir. HKM/tests/test_kopru.py kilitler.
2. Masaüstü sunucu bekçisi: uygulama/masaustu/sunucu-bekci.js (saf; 30 sn'de bir yoklar, ölmüşse sessizce
   yeniden başlatır, başarısızlıkta bekleme ikiye katlanır, 4 denemede vazgeçip uyarır). main.js bağlar;
   eski 4200/panel yeniden yükleme kodu silindi. Test: `node tools/bekci_test.js`.
3. Kabuk hata ucu `/api/kabuk/hata` (sistem/tekkapi.py): yalnız 127.0.0.1/::1, Host ve Origin kendi
   kapısı, `X-LifeOS: kabuk-hata`; gövde ≤4096 bayt (413), dakikada 20 (429); alanlar kırpılır
   (ileti 500, yigin 1500, sayfa 200, tur 40); `%LOCALAPPDATA%\LifeOS\kabuk-hata.log`, 200 kB'da `.1`'e
   döner. Eski kullanılmayan `/api/kabuk/taslak` ucu silindi. İstemci örneği:
   `fetch('/api/kabuk/hata',{method:'POST',headers:{'Content-Type':'application/json','X-LifeOS':'kabuk-hata'},body:JSON.stringify({ileti,yigin,sayfa:location.hash,tur:'onerror'})}).catch(function(){})`
4. Test portları: tools/gez_sunucu.js (boş port seçer ya da açık hatayla durur, hata anında sunucu
   çıktısını gösterir); tools/hareket_gez.js ve kalite/hiz_olcum.js kullanıyor; tools/DIZIN.md'de.

## Test çıktıları (koordinatör, 2026-11-16 gece)
- `cd HKM && python -m tests.run` → 1069/1069 test gecti
- `python tools/tekkapi_test.py` → 168/168 yeşil
- `python kalite/olcum.py --denetle` → Bütçe tamam: 28 bütçe, aşım yok.
- `python tools/belge_dizin_kabul_test.py` → 120 belge, her biri bir kez
- `node tools/bekci_test.js` → yeniden baslatir, geri cekilir, sinirda vazgecer, dur() sonrasi dokunmaz
- `node --check` main.js, sunucu-bekci.js → geçti

## Açık kalanlar
- Bekçi gerçek Electron'da canlı sınanmadı (yalnız saf mantık testi); sahip uygulamayı açınca görülür.
- 429 cevabının gövdesi `{"ok": true}` (zararsız, istemci zaten sessiz).
- kabuk/bilesen.html (geliştirici bileşen vitrini) bir yerde hâlâ «LifeOS sunucusu» diyor: kabuk paketi.
