# LifeOS 2 — ne kuruldu, ne bekliyor

> Bu belge **durum** belgesidir: LifeOS 2 planının hangi parçası bugün kodda
> var, hangisi bilerek bekletiliyor. Ayrıntı her sistemin kendi belgesinde
> (`HKM/MIMARI.md` §8.20, `AYS/src/OFIS.md`, `SPI/src/MIMARI.md`,
> `ESP/src/MIMARI.md`). Sayılar elle yazılmaz; `tools/sayilar.py` üretir.
> Ufuk **dokuz aydır**: her gün kullanılacak bir sistem için ne kırılır, o konuşulur.

## 1. Kat şeması

```
                         Kullanıcı  (kararı o verir)
                              │
                     King — HKM baş patronu
          ┌──────────────┬────┴─────────┬──────────────────┐
     AYS Patronu     SPİ Patronu    ESP Patronu        BAM Patronu
      5 uzman          4 uzman        8 uzman     Kayıt · Araştırma ·
                                                  Planlama · Üretim
```

- **Patron değişmez.** Profil, sınav ya da kadro değişse de modülün Patronu
  kalır; uzmanlar değişebilir. Bu, her ajanın isteminde yazılıdır
  (`brand/ortak/ofis.js`, `HKM/core/sohbet.py` KONUM).
- **İki kat denetim.** Uzman raporunu Patron'a verir; Patron'un üstünde King.
  Bir alt ajan başka modülün alt ajanıyla doğrudan konuşmaz.
- **King hiçbir modüle yazmaz.** Teklif bırakır (`HKM/core/intents.py`);
  modül kendi koduyla uygular. HKM kapalıyken hiçbir modül durmaz.
- **BAM HKM'nin alt modülüdür**, beşinci bir sistem değildir.

## 2. Bugün kodda olanlar

| Parça | Nerede | Özü |
|---|---|---|
| Aksiyon seviyeleri | üç modülün öneri kutusu | küçük sormadan + «geri al»; orta önizleme + onay; seviye katalogdan |
| Konuşarak değiştirme | AYS `R.Komut`, SPİ `SP.Bolum`, ESP `ESP.Komut` | «bu hafta ara», «günde 4 saat», «diksiyon istemiyorum»; belirsizse sorar |
| Plan istisnaları | AYS `R.Istisna` | temel plan + tarihli istisna; takvim kayıtları (tatil, okul sınavı) da günleri gerçekten değiştirir |
| Bölüm aç/kapa | üç modül | kullanılmayan bölüm gezinmeden kalkar, verisi silinmez |
| Hafıza | `brand/ortak/hafiza.js`, `HKM/core/memory.py` | senin sözün · sohbetten · tahmin; model yazamaz; modül → HKM anlık görüntü eşitlemesi; «King senin hakkında ne biliyor?» |
| Ofis katları ve istemler | `brand/ortak/ofis.js` | kimlik → konum → yöntem → ortak ilkeler → kurallar → üslup → hafıza → brifing |
| Patronlar arası kanal | `HKM/core/kanal.py` | her Patron öteki iki modülün bugünkü hükmünü King üzerinden duyar; yalnız okur |
| BAM | `HKM/core/bam.py`, HKM › Ofis | iş kuyruğu, Kayıt Ofisi, Araştırma (hep «doğrulanmadı»), Üretim (bağımsız çözümle denetim) |
| BAM → AYS | `material.add` | denetimden geçen set AYS'ye kart olarak teklif edilir; AYS kendi koduyla doğrular |
| Sohbetten BAM'a | üç modülün sohbeti | «10 soru hazırla», «… araştır» → BAM işi |
| Hayat Mottosu | `HKM/core/motto.py` | ağaç + ağ, sürümler, etiket, harita; kırmızı çizgi, fikir kartı; King yalnız öne çıkarılanı görür; düşünceden BAM'a araştırma |

## 3. Bilerek bekleyenler — karar kullanıcıyla verilecek

| Parça | Neden bekliyor | Ne gerekiyor |
|---|---|---|
| **Hedef motoru** (Planlama Ofisi) | «TYT Matematiği 100 günde», «6 ayda 5 kg», «gitar 6 ay» — hedefin nasıl ölçüleceği kullanıcıyla tasarlanacak | hedef türleri, ilerleme ölçüsü, plan farkı (5 eklenecek / 3 taşınacak) |
| **Sınav profilleri** (KPSS, DGS, LGS) | müfredat ve puanlama resmî kaynaktan doğrulanmadan yazılamaz; uydurulmuş müfredat en tehlikeli hata olur | hangi sınavlar, hangi yıl, kaynak |
| **Sağlık hedef planları** | hedef motorunun SPİ yüzü; klinik değerlerde teşhis/doz sınırı korunmalı | hedef motoru ile birlikte |
| **İnternetten araştırma** | Araştırma Ofisi bugün modelin bilgisiyle çalışır ve her kaydı «doğrulanmadı» işaretler | arama sağlayıcısı ve bütçe kararı |
| **ESP'ye materyal** | ESP'nin dil desteleri henüz `material.add` almıyor | ESP'de kart içe alma sözleşmesi |
| **Ortak sunucu ve senkron** | tek kullanıcı, tek cihaz + HKM bugün yetiyor | çok cihaz ihtiyacı doğarsa |

## 4. Değişmeyen sözler

1. Sayıyı ve kararı kural motoru üretir; model cümleye çevirir.
2. Ölçülmüş ya da hesaplanmış sayıyı hiçbir ajan değiştiremez.
3. Eksik veri sıfır değildir; sessizlik «temiz» değildir.
4. Anlaşılmayan istek tahmin edilmez, sorulur.
5. Üretilen metin kullanıcının sözünün yerine geçmez; ikisi her yerde ayrı görünür.
