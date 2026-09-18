# Seviye sistemi — tek kaynak burasıdır

Altı kademe, her kademede üç basamak.

**Ortak olan TANIMDIR, defter değil.** AYS'nin, SPİ'nin ve ESP'nin her
birinin **kendi seviyesi** vardır: "Altın" üçünde de aynı şeyi ifade
eder (aynı ad, aynı renk, aynı eşik) ama ayrı ayrı kazanılır — ESP'de
gitar çalarak, SPİ'de antrenman yaparak, AYS'de soru çözerek. Motor,
başka bir sistemin etkinliğini deftere yazmaz. Bir sistemin *içindeki*
alt modüller (ESP'de dil/felsefe/müzik) ayrı seviye tutmaz: hepsi o
sistemin tek seviyesini besler.

## Neyi nerede değiştirirsin

| İstediğin | Dosya | Sonra |
|---|---|---|
| Kademe adı, rengi, sloganı | `kademeler.js` → `LIFEOS.KADEMELER` | `python3 tools/seviye.py --yay` |
| XP eşikleri (basamak maliyetleri) | `kademeler.js` → `basamak:[…]` | aynı |
| Hangi iş kaç XP veriyor | `kademeler.js` → `LIFEOS.XP_ETKINLIK` | aynı |
| Sayma davranışı, tavan, defter | `xp.js` | aynı |
| Perde/banner görünümü | `seviye.css`, `perde.js` | aynı |
| Açılıştaki durağan perde markupı | `perde.html` | aynı |
| Sunucuların `/img/seviye/` muhafızı | `ortak_yol.py` | aynı |
| `dist/` medya kopyalayıcı | `dist_kopya.py` | aynı |

`--yay` bunların hepsini üç arayüzün içine **birebir** yerleştirir; ad
alanı yer tutucusu her sistemin kendi adıyla değişir (`R`, `SP`, `ESP`).
HTML ve Python blokları dosyaların içine `SEVIYE:…` işaretleri arasına
yazılır. **Bu özellikte elle kopyalanan hiçbir blok kalmadı**; kopyaları
elle düzenleme, bir sonraki yayında kaybolur.
`python3 tools/seviye.py --denetle` ayrışmayı söyler ve CI'da koşar.

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

## XP nasıl sayılır — üç kural

1. **Her etkinliğin günlük tavanı vardır.** `tavan:null` «tavan yok»
   değil **«günde bir kez»** demektir (gün kapanışı, beslenme günü
   gibi). Tavansız bir sayaç bir gün otuz kez tıklanır ve anlamını
   kaybeder.
2. **Geriye dönük puan toplanmaz.** Geleceğe hiç, geçmişe en fazla
   **bir hafta** yazılır — dünkü antrenmanı bu sabah girmek olağandır,
   geçen ayın gününe puan yazmak değildir.
3. **XP hiçbir kararı vermez.** Ne plan, ne reçete, ne uyarı ona bakar.
   XP yalnızca kullanıcının kendi emeğini görmesidir.

Defter olay listesi değil **gün × etkinlik** toplamıdır; gün kırılımı
son 120 gün için saklanır, daha eskisi silinir. Toplam XP ayrı ve tek
yönlü bir sayaçtır: budama onu değiştirmez, yani seviye geçmiş silindi
diye düşmez. Arşiv saklanan bir sayaç değil bir **çıkarmadır**
(`toplam − defterde duran günler`), bu yüzden «kırılım + arşiv = toplam»
katalog değişse de bozulmaz.

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
