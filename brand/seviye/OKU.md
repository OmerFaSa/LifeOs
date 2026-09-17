# Seviye sistemi — tek kaynak burasıdır

Altı kademe, her kademede üç basamak. AYS, SPİ ve ESP'nin **ortak**
sistemi; hiçbiri kendi kademe listesini tutmaz.

## Neyi nerede değiştirirsin

| İstediğin | Dosya | Sonra |
|---|---|---|
| Kademe adı, rengi, sloganı | `kademeler.js` → `LIFEOS.KADEMELER` | `python3 tools/seviye.py --yay` |
| XP eşikleri (basamak maliyetleri) | `kademeler.js` → `basamak:[…]` | aynı |
| Hangi iş kaç XP veriyor | `kademeler.js` → `LIFEOS.XP_ETKINLIK` | aynı |
| Sayma davranışı, tavan, defter | `xp.js` | aynı |
| Perde/banner görünümü | `seviye.css`, `perde.js` | aynı |

`--yay` bu dört dosyayı üç arayüzün içine **birebir** kopyalar
(`xp.js` ve `perde.js` içindeki `__NS__`, her sistemin ad alanıyla
değişir: `R`, `SP`, `ESP`). Kopyaları elle düzenleme — bir sonraki
yayında kaybolur. `python3 tools/seviye.py --denetle` ayrışmayı söyler.

> `id` alanlarını değiştirme. Defterde yazılı olan `id`'dir; değişirse
> geçmiş kayıt sahipsiz kalır. Ekranda görünen `ad` alanıdır ve serbestçe
> değiştirilebilir.

## Videolar ve rozetler

Bu klasörde, **sabit adlarla**, tek kopya dururlar:

```
kademe-1.mp4 … kademe-6.mp4     o kademeye geçişte oynayan video
kademe-1.png … kademe-6.png     o kademenin rozeti (banner ve küçük rozet)
```

Üç arayüz de bunları `/img/seviye/…` adresinden okur; `sunucu.py` ve her
sistemin `devserver.py`'si bu adresi buraya bağlar, `build.py` ise
`dist/img/seviye/` içine kopyalar. Yani **dosyayı buraya bırakmak tek
adımdır**; hiçbir kodda yol yazılı değildir.

Eksik dosya hata değildir:

- video yoksa → kutlama **banner** olarak yapılır,
- rozet yoksa → kademe **numarası** çizilir.

Böylece altı videoyu altı ayrı günde ekleyebilirsin; sistem her seferinde
biraz daha tamamlanır, hiçbir aşamada bozulmaz.

### Şu an ne var

| Dosya | Durum |
|---|---|
| `kademe-1.mp4` | var — 1. kademeye geçiş (10 sn, sesli) |
| `kademe-2..6.mp4` | yok — banner'a düşüyor |
| `kademe-1..6.png` | yok — numaraya düşüyor |

## Ses

Videolar **sesli** oynar. Tarayıcı, kullanıcı sayfaya dokunmadan sesli
otomatik oynatmayı reddederse video sessiz başlar, sağ altta «sesi aç»
düğmesi belirir ve ilk dokunuşta ses kendiliğinden açılır. Kullanıcı sesi
kendi kapattıysa tercihi `lifeos.perde.ses` anahtarında saklanır ve üç
arayüzde de geçerlidir.

## Videonun kenarı

Videonun arka planı tam siyah olmasa da kenarı görünmez: perde, arkaya
aynı videonun bulanık ve büyütülmüş bir kopyasını koyar (`perde__ortam`),
kenar kendi renginin içinde kaybolur. Kapatmak için perdeye
`data-ortam="kapali"`.
