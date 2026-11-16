# Tur 2026-11-17b · Gerçek veri gezisi

Sahibin gerçek verisinin **kopyasıyla** (scratchpad, depo dışı) yalıtılmış tek kapı açıldı; uygulama uçtan uca gezildi.
Gizlilik: bu belgede kişisel veri yok; hatalar genel anlatılır, yeniden üretim sentetik örnekle verilir.
Gerçek veriyle alınan görüntüler yalnız scratchpad'de kaldı, iş bitince silindi.

## Durum

- [x] Başbuğ kapalı mı (4180), canlı veri yalnız okunarak kopyalandı
- [x] Yalıtılmış sunucu kopyayla açıldı
- [x] Gezi 1440 ve 390
- [x] Kendi payım düzeltildi + test
- [x] Kalite kapısı
- [x] Sunucu kapandı, kopya silindi

## Bulgular

### Kendi payım (motor/, brand/ortak/, HKM/)

### Başkasına

1. **Kabuk çekirdeği** · `kabuk/kabuk.js:331` · konu haritası olmayan sekiz alanın (akademik, dil, müzik, okuma,
   beslenme, hareket, uyku, tahlil) sayfası her açılışta `alan/<alan>/harita.json` ister, 404 alır; tarayıcı konsoluna
   her seferinde «Failed to load resource: 404» düşer (yalnız tarih ve felsefede dosya var). İşlev bozulmuyor (`r.ok`
   değilse `null`), ama konsol gürültüsü gerçek hataları gizliyor ve kabuk_gez'in «konsol temiz» denetimini anlamsızlaştırıyor.
   Yeniden üretim: deneme verisiyle `#/alan/akademik` aç, ağ sekmesinde 404. Önerilen: hangi alanın haritası olduğunu
   `harita.js` YERLER satırına (`konuHaritasi: true`) yaz ya da `alan/<alan>/harita.json` yoksa istek atma; en ucuzu
   sekiz alana boş `{"dallar": []}` dosyası koymak değil (şema denetimi boşu kabul etmeyebilir), YERLER bayrağı.

## Testler

## Kapanış

## Kapanış (2026-11-17, devralan oturum)
Ajan hesap sınırında kesildi. Başkasına 1 (harita 404) düzeltildi: `kabuk/harita.js` YERLER `harita: true` (tarih, felsefe), `haritaYukle` bayraksız alana istek atmaz; `kabuk.test.js` bayrağı dosyanın varlığıyla eşler. Kopyayı açık tutan iki artık test sunucusu (4421, 48761) kapatıldı, gerçek veri kopyası ve görüntüleri scratchpad'den silindi.
