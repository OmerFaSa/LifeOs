# Ofis ölçümü · 31 Ekim–1 Kasım 2026 gecesi

Antigravity ekibiyle (Uygulayıcı, Denetçi, Araştırmacı, Testçi, pilot) yapılan ilk
gerçek LifeOS turu. Sayılar `LifeOs-ajan/olcum.jsonl`, `ajan.py durum` ve Claude Code
plan göstergesinden; tahminler tahmin diye yazıldı.

## Ne yapıldı

| İş | Kim | Sonuç |
|---|---|---|
| 007 Takvimde bugün süren etkinlikler (`sistem/ice.py`) | ofis | ilk turda temiz, 24/24 yeşil |
| 008 Veri doğrulayıcısı testleri | ofis → Claude | ajan ölçütü değiştirdi ve hatalı davranışı «beklenen» yaptı; son incelemede üç veri dürüstlüğü hatası bulundu ve düzeltildi (kadın değeri erkeğe yazılıyordu, «μg», başlık satırı) |
| 009 SPİ hızlı giriş süreleri | ofis | 1 Denetçi bulgusu, düzeltildi, birleşti |
| 010 AYS konuşarak giriş süreleri | ofis | temiz; «30 dk uyudum»u gece uykusu sayıyordu, Claude düzeltti |
| 011 ESP serbest oturum süreleri | ofis | ilk turda temiz |
| 012 SPİ buçuklu porsiyon (kalori hatası) | ofis | ilk turda temiz |
| Ortak Türkçe sayı ve süre okuyucusu (`brand/ortak/turkcesayi.js`) | Claude | dört modül tek kural; 009/010 ona taşındı, 172 satır kopya gitti |
| Müzik açılış sınırı, `ice_test` saatli bombası | Claude | düzeldi |
| Sistem: üç kademe, kota senaryosu, JS kabul testi, Testçi CI Python, Denetçi'ye ayrı klasör, ölçüt koruması, yarış hataları | Claude | hepsi testli, main'de |

Kabul testleri (Claude yazdı) ofisin her işinde doğruluğun ölçüsü oldu: 6 işin 4'ü
ilk turda temiz geldi; 2'sinde Denetçi bulgu yazdı; son incelemede 2 işte (008, 010)
Claude ek hata yakaladı.

## Token: ne harcandı

**Antigravity (Google kotası, Claude'dan ayrı):** bu gecenin altı işi + iki tarama +
Denetçiler ≈ **5,3 milyon giriş + 0,56 milyon çıkış token'ı** (+ ≈133 milyon önbellekten
okuma), ≈ 2.000 ajan adımı. İş başına 15–43 dakika.

**Claude Code (bu oturum):** son dört işin (009–012) incelemesi + birleştirmesi + ortak
okuyucuya taşıma + kota senaryosu boyunca 5 saatlik limit **%63 → %69** (≈ %6), haftalık
**%9 → %10**. Bu oturumun bağlamı 600 bine yaklaştı; her çağrı bunun tamamını okur.

## Antigravity olmasaydı (tahmin)

Aynı altı işi ve iki taramayı Claude kendisi yapsaydı: iş başına ≈ 20–30 çağrı (kodu
oku, yaz, test, düzelt, tam denetimler) + tarama başına ≈ 30–40 → ≈ **200–250 çağrı**.
Ofisle Claude'un iş başına çağrısı ≈ 6–8 (kabul testi, görev, `rapor`, `birlestir`)
→ ≈ **45–55 çağrı**. Yani Claude tarafında **≈ 4–5 kat daha az çağrı**; bu gecenin işi
ofissiz bir ya da iki tam 5 saatlik pencere tüketirdi, ofisle ≈ üçte biri kadar.

Tasarrufun büyüklüğü işe göre değişir: büyük mantık işinde ve döngü işinde (test kırmızı
→ düzelt → koş) en yüksek; 20 satırın altındaki işte ofis daha pahalı (görevi yazmak
işi yapmaktan uzun).

## En büyük gizli maliyet: uzun oturum

Bu oturumun bağlamı ≈ 600 bin token. Aynı işi taze bir oturum (≈ 50–80 bin bağlam)
yapsa her çağrı ≈ 8–10 kat ucuz olur. **Öneri:** her tur yeni oturumda başlasın; her
şey dosyada ve hafızada (OFIS.md, DERSLER.md, görev dosyaları).

## Gelecek tur için açık kalanlar

- AYS takvim içe aktarmasında tekrarlayan etkinlikler (`AYS/src/js/core/takvim.js`):
  `sistem/ice.py`'deki RRULE mantığının istemci tarafı eksik (sarı, büyük iş).
- `AYS/src/js/core/examrun.js`: sekme kapalıyken geçen süre sınav süresine sayılıyor mu
  — ürün kararı (gerçek sınav da işler); depo sahibine sorulacak.
- `HKM/core` niyet listesi ile SPİ `beacon.js` uyuşmazlığı (D-12): HKM çekirdeği, Claude'un işi.
