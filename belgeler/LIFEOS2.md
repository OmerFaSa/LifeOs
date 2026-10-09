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

## 3. Bilerek bekleyenler — verilen kararlar

> 2026-10-05 düzeltmesi: bu tablo 2026-09-23'teki Hedef motoru turlarından
> sonra güncellenmemişti; «bekliyor» dediği beş parçanın dördü kodda vardı ve
> bir oturum hedef motorunu yeniden önerdi (AGENTS.md §5.1). Biten parçalar
> aşağıdaki ikinci tabloya taşındı. Bir satırı «bekliyor» diye yazmadan önce
> kodda ara.

Bekleyen parça yok. 2026-10-07'de depo sahibi kararları ajana bıraktı;
verilen kararlar:

| Parça | Karar | Gerekçe |
|---|---|---|
| **Başka sınav profilleri** (KPSS, DGS, ALES…) | yerleşik profil YKS SAY kalır; başka sınav kendiliğinden eklenmez | kullanıcı YKS'ye hazırlanıyor; istenirse mekanizma hazır (`AYS core/sinavprofil.js` + `HKM core/mufredat.py`, web açıksa kaynaklı). Puan formülü resmî kaynaksız yazılmaz (§4.1) |
| **İnternetten araştırma** | anahtarsız Vikipedi yeter; ücretli sağlayıcı yok (bütçe 0) | kod zaten vardı (`HKM/core/web.py`, günlük sınır 200); Brave/Tavily/Google/SearXNG anahtar girilince açılır |
| **Vücut fotoğrafından kilo tahmini** | yapılmaz | ölçülen sayı tahminle doldurulmaz (AGENTS §1.1); fotoğraf yalnız görsel kayıttır |
| **Android kabuğu** | yapılmaz | telefon iPhone; Samsung tablet LifeOS'u tarayıcıdan açar ve ekran kapalı rota ona gerekmez |

**Bekliyor sanılıp yapılmış olanlar** (ayrıntı kendi dosyasında):

| Parça | Nerede | Ne zaman |
|---|---|---|
| Hedef motoru (genel çerçeve, kapasite, plan) | `brand/ortak/hedef.js`; AYS `core/hedefler.js` + `hedefplan.js` (konu bitirme, net hedefi), ESP `core/hedefler.js` (dil CEFR, okuma…), hedef ağı `brand/ortak/hedefag.js` → HKM zaman bütçesi | 2026-09-23 (1bfc69fd, Tur 1–4) |
| Sağlık hedef planları | SPİ `core/hedefler.js` (kilo/VKİ, güvenlik kapısı, hekim kapısı ve talimatı) + `core/plan.js` | 2026-09-23 (efb1bbc2) |
| ESP'ye materyal | ESP `core/beacon.js` `materyalUygula`: BAM seti dil ve tarih destesine kart olarak | 2026-09-23 (b4026b81) |
| Ortak sunucu ve senkron | `sistem/hesap.py`, `brand/ortak/hesap.js`: PC, telefon ve tablet aynı hesapla; veri kullanıcının PC'sinde | 2026-10-04 (e7972a6c) |
| Hesap bağlantıları | `sistem/hesap.py` sözleri 14–17, `brand/ortak/hesap.js` sözleri 17–20, `brand/ortak/qr.js`: iki adımlı doğrulama (Google/Microsoft Authenticator, iPhone Şifreler), kodla cihaz bağlama, Kısayollar gelen kutusu (SPİ `Proposals.disaridan`), AYS takvim aboneliği | 2026-10-08 |
| Cihaz ayrıntısı ve yeni giriş uyarısı | `sistem/hesap.py` sözleri 18–19, `brand/ortak/hesap.js` sözleri 21–22: cihaza ad, giriş yolu, son adres; başka cihazdan girişte «Bendim / İncele» | 2026-10-08 |
| Modül açılış geçişi | `brand/ortak/animasyon.js` «geçiş»: seçim sayfasındaki kart (ve kenardaki modül bağlantısı) büyüyüp modülün marka perdesine dönüşür; HKM yüzü kendi sayfasında belirir | 2026-10-08 |
| Hesap deposunun yedeği | `sistem/hesap.py` sözü 20, `brand/ortak/hesap.js` sözleri 23–24: her gün arkada SQLite yedeği (son 7 + elle + geri yüklemeden önce), ikinci yer (USB/başka disk), Hesap › Yedekler; geri yükleme büyük aksiyon (PC, şifre, önce yedek); dönem değişince cihazlar kendi kayıtlarını yeniden yollar; `python sistem/hesap.py --yedekle / --geri-yukle` | 2026-10-09 |
| Kısayollar üç modülde, ESP takvimi | `sistem/hesap.py` GELEN_MODULLER (ays, spi, esp), `AYS Proposals.disaridan` («paragraf 20», «soru 40 matematik»), `ESP Plans.disaridan` + teklif türü `oturum` (ölçüm, sormadan yazılmaz, geri alınır), `ESP/src/js/core/takvim.js` (hedef son günleri, tarihli hedefler, hatırlatıcılar → takvim aboneliği) | 2026-10-09 |
| iPhone yerel bildirim | `uygulama/ios/LifeOS/BildirimKoprusu.swift`, `brand/ortak/bildirim.js`: SPİ hatırlatma saatleri ve ESP hatırlatıcıları uygulama kapalıyken de gelir (7 gün ileri kurulur); Apple Sağlık uygulamaya değil Kısayollar tarifine bağlı (`belgeler/UYGULAMA.md` aşama 4) | 2026-10-09 |
| Siri: «Bugün ne var?» | `sistem/hesap.py` sözü 21 (`GET /api/hesap/ozet.txt`, anahtar yetkisi `oku`), `brand/ortak/hesap.js` sözü 25, modüllerin `Screens.today.sesli()`: Kısayollar günün özetini okur, Siri söyler; dünkü özet bugünmüş gibi okunmaz; SPİ ilaç adını söylemez | 2026-10-09 |
| Yedek dosya olarak | `sistem/hesap.py` sözü 20 (ek): Hesap › Yedekler'den bir yedek şifreyle dosya olarak iner (`/yedek-indir`, admin + bilgisayar) ve dosyadan yüklenir (`/yedek-yukle`, ham gövde; SQLite denetimi; listeye «dis»); geri yükleme aynı büyük aksiyon | 2026-10-09 |
| AYS telefon bildirimi, ana ekran kısayolları | `AYS/src/js/core/takvim.js` `bildirimListesi`/`planla` (günün planı seçilen saatte, hedefin son günü, kullanıcının yazdığı sınav günü; tahmin edilen güne «yarın sınav» denmez), Ofis ayarları › Telefon bildirimi; `uygulama/ios/project.yml` `UIApplicationShortcutItems` + `Uygulama.swift`: simgeye basılı tutunca modül doğrudan açılır | 2026-10-09 |
| Bildirim temizliği ve uygulama rozeti | `brand/ortak/bildirim.js` sözleri 5–6 (`kaldir`, `rozet`, açılışta kurulum), `BildirimKoprusu.swift` sözleri 5–6: modül açılınca gelmiş bildirimleri kalkar; simgede üç modülün Onaylar toplamı | 2026-10-09 |
| Zilde ertele ve «gördüm» | `brand/ortak/kabuk.js` `zilDurumu`/`bildirimPaneli`: satır yarına ertelenir (acil olan ertelenemez), «Hepsini gördüm» noktayı söndürür, yeni ya da değişen satır yeniden yakar; işi yapılmış saymaz, kayda yazılmaz (bu cihaz, bu modül) | 2026-10-09 |
| Bildirimde «Aldım / Ertele» | `brand/ortak/bildirim.js` söz 7 (`isaretci`, `yapildi`), `BildirimKoprusu.swift` söz 7 (kategoriler, işaret sırası, «~» ertelenmiş), `SPI Hatirlat.isaretUygula`, `ESP Takvim.isaretUygula`: işaret modülün kendi koduyla, basıldığı anla yazılır; uydurulmaz | 2026-10-09 |
| Kurulu bildirimler, her modülde sessiz saat | `brand/ortak/bildirim.js` söz 8 (`liste`, `atla`, `geriAl`, `listeAc`; silinen `lifeos.telbildirim.atla`), `BildirimKoprusu.swift` söz 8 (`liste`, `sil`); ESP `Takvim.bildirimListesi` ve AYS telefon satırı sessiz saate ve tür ayarına uyar | 2026-10-09 |
| AYS öğrenme yolu | `AYS/src/js/core/ogrenyolu.js` (`R.OgrenYolu`), konu ekranında «Öğrenme yolu»: öğren → kartla → soru çöz → yanlışları kapat → konu testi → tekrar test; her adım var olan kayıttan okunur ve etiketlenir (ölçüldü / hesaplandı / beyan), sıradaki adım ve eylemi kodla seçilir, eşikler yazılır | 2026-10-09 |
| «Bu konuyu öğren» | AYS konu ekranı «Konunun malzemeleri»: konu anlatımı, kavram sözlüğü, çalışma kâğıdı BAM'dan açık istekle (`brand/ortak/urun.js` söz 6, `iste(metin, { tur, konu, ayrinti, etiket })`); `HKM/core/urunler.py` ETIKET_RE, `sohbet.urun_modulden(istek=)`, `king._teklif_urun` etiketi `urun.add` teklifine geri koyar; malzeme konunun yanında, internetsiz açılır; her istek King onayından geçer | 2026-10-09 |
| Konuda «Anlamadım, sor» | `AYS/src/js/core/konusor.js` (`R.KonuSor`): koçun model zinciriyle bu konunun bağlamında (ders, bölüm, konu, yapıştırılan parça; kişisel veri yok) anlatır; cevap «doğrulanmadı», kaydedilmez, istenirse karta döner (kaynak `konusor`); model yoksa Ofis ayarlarına yönlendirir | 2026-10-09 |
| Çekirdek konu özetleri | `AYS/src/js/data/ozetler.js` (`R.KONU_OZET`): her konunun uygulamada duran kısa özeti (3–5 madde, dikkat, sayıları elle hesaplanmış örnek); internetsiz ve modelsiz okunur, «elle yazıldı · doğrulanmadı» etiketli; konu ekranında «Kısa özet». 184 konunun hepsi yazıldı; `tests/ozetler.test.js` eksiksizliği sınar | 2026-10-09 |

## 4. Değişmeyen sözler

1. Sayıyı ve kararı kural motoru üretir; model cümleye çevirir.
2. Ölçülmüş ya da hesaplanmış sayıyı hiçbir ajan değiştiremez.
3. Eksik veri sıfır değildir; sessizlik «temiz» değildir.
4. Anlaşılmayan istek tahmin edilmez, sorulur.
5. Üretilen metin kullanıcının sözünün yerine geçmez; ikisi her yerde ayrı görünür.
