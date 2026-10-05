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

> 2026-10-05 düzeltmesi: bu tablo 2026-09-23'teki Hedef motoru turlarından
> sonra güncellenmemişti; «bekliyor» dediği beş parçanın dördü kodda vardı ve
> bir oturum hedef motorunu yeniden önerdi (AGENTS.md §5.1). Biten parçalar
> aşağıdaki ikinci tabloya taşındı. Bir satırı «bekliyor» diye yazmadan önce
> kodda ara.

| Parça | Neden bekliyor | Ne gerekiyor |
|---|---|---|
| **Sınav profillerinin resmî kaynağı** (KPSS, DGS, ALES…) | mekanizma var (`AYS core/sinavprofil.js`: müfredat BAM raporu olarak teklif gelir, AYS yeniden doğrular), ama kaynaksız profil «doğrulanmadı» kalır ve puanlama yoktur; uydurulmuş müfredat en tehlikeli hata olur | hangi sınav, hangi yıl, resmî kaynak; puanlama için resmî formül |
| **İnternetten araştırma** | Araştırma Ofisi bugün modelin bilgisiyle çalışır ve her kaydı «doğrulanmadı» işaretler | arama sağlayıcısı ve bütçe kararı |

**Bekliyor sanılıp yapılmış olanlar** (ayrıntı kendi dosyasında):

| Parça | Nerede | Ne zaman |
|---|---|---|
| Hedef motoru (genel çerçeve, kapasite, plan) | `brand/ortak/hedef.js`; AYS `core/hedefler.js` + `hedefplan.js` (konu bitirme, net hedefi), ESP `core/hedefler.js` (dil CEFR, okuma…), hedef ağı `brand/ortak/hedefag.js` → HKM zaman bütçesi | 2026-09-23 (1bfc69fd, Tur 1–4) |
| Sağlık hedef planları | SPİ `core/hedefler.js` (kilo/VKİ, güvenlik kapısı, hekim kapısı ve talimatı) + `core/plan.js` | 2026-09-23 (efb1bbc2) |
| ESP'ye materyal | ESP `core/beacon.js` `materyalUygula`: BAM seti dil ve tarih destesine kart olarak | 2026-09-23 (b4026b81) |
| Ortak sunucu ve senkron | `sistem/hesap.py`, `brand/ortak/hesap.js`: PC, telefon ve tablet aynı hesapla; veri kullanıcının PC'sinde | 2026-10-04 (e7972a6c) |

## 4. Değişmeyen sözler

1. Sayıyı ve kararı kural motoru üretir; model cümleye çevirir.
2. Ölçülmüş ya da hesaplanmış sayıyı hiçbir ajan değiştiremez.
3. Eksik veri sıfır değildir; sessizlik «temiz» değildir.
4. Anlaşılmayan istek tahmin edilmez, sorulur.
5. Üretilen metin kullanıcının sözünün yerine geçmez; ikisi her yerde ayrı görünür.
