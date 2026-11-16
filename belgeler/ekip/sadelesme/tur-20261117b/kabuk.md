# Tur 2026-11-17b · kabuk çekirdek

Sahip: kabuk çekirdek ajanı. Dal sadelesme, taban 07f8bdc9. Commit/push yok.

## Durum
- [x] 1a ilk geçiş uzun karesi
- [x] 1b unhandledrejection bildirimi
- [x] 1c Akademik gruplar daraltınca
- [x] 1d dal seçimi eşitleme + kaldırma
- [x] 2 çekirdek ekran gezisi (ham olanlar)
- [x] 3 kalıcı testler
- [x] kalite kapısı

## Adımlar

### 1b · söz reddi bildirimi (bitti)
`kabuk.js`: gönderme tek işlevde (`hataGonder(tur, ileti, yigin)`), `error` ve `unhandledrejection` aynı sayaçla (açılış başına 5),
aynı boy sınırlarıyla, yalnız yerelde; söz reddi `tur:'soz'`, neden Error değilse metni ileti olur. Gezi: `kabuk_gez` «yakalanmamış söz
reddi «soz» türüyle günlüğe yazılır».

### 1c · Akademik grupları pencere daraltılınca (bitti)
Kök: grup açık/kapalı kararı çizim anındaki `dar()` (640 px). Düzeltme: `matchMedia('(max-width:640px)')` değişince
`.konu-gruplari > [data-grup]` için varsayılan yeniden uygulanır (dar: yalnız şu anki grup açık; geniş: hepsi açık); yeniden çizim yok,
kaydırma yerinde. Gezi: 1280 → 600 → 1280 px «daraltınca yalnız şu anki grup açık, genişletince hepsi yeniden açık».

### 1d · dal seçimi eşitlenir, kaldırılabilir (bitti)
Bakıldı: `ayar.js`'in `esitlenir` bayrağı ve `disaAktar/iceAl` hiçbir yerden çağrılmıyor (yalnız test); kabukta cihazlar arası giden
tek düzen `depo.js` KAYIT → IndexedDB + tek depo (`/api/hesap/kabuk`, `sistem/veri.py KABUK_ANAHTAR`). Tema gibi tercihler cihazda kalır,
öğrenme durumu (`lifeos.yol.<alan>.<n>`) eşitlenir. Dal seçimi öğrenme durumudur → anahtar `lifeos.yol.<alan>.dal` (iki desene de
zaten uyar, `sistem/`'e dokunmadan), değer JSON metni (King'in anlık görüntüsü JSON okur). Önceki `lifeos.alan.<alan>.dal` ilk okumada
taşınır ve silinir. Seçili dalda «Dal seçimini kaldır» (sade düğme) → kayıt silinir (silme de eşitlenir).
Testler: `kabuk.test.js` «dal seçimi: öğrenme kaydı…» (kayıt/ayar ayrımı `depo.kayitMi`, taşıma, yaz/kaldır, bozuk değer);
`depo.test.js` KAYITLAR'a `lifeos.yol.tarih.dal`; `kabuk_gez` kaldırma adımı; `kabuk_esit_gez` «A: dal seçimi tek depoya gitti»,
«B: A’nın seçtiği dal ikinci cihazda seçili» (ölçüldü: geçti).

### 1a · ilk geçiş uzun karesi (bitti, devralan oturum belgeledi)
Geçiş türü değerleri kökten `::view-transition-new(root)`a (kökte değişen özel özellik bütün sayfayı yeniden hesaplatıyordu), boşta önceden çizim gerçek boşlukta (timeRemaining ≥ 20 ms), `hareketVar` getComputedStyle yerine öznitelik + matchMedia, geçişli yeni sayfada süzülme sınıfı içerikten önce.

## Kapanış (2026-11-17, devralan oturum)
Ajan hesap sınırında kesildi. `kabuk_gez`teki yarım kalmış söz reddi denetimi (regex içine satır sonu düşmüştü) onarıldı; gezi tamamen geçti.
