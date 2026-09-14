# LifeOS — sistem analizi ve mimari yol haritası

> Tarih: 2026-09-14 · Kapsam: `AYS/`, `SPI/`, `ESP/`, `HKM/`, `tools/`
> Yöntem: kod okundu, denetimler koşturuldu, sayılar araçların kendi
> çıktısından alındı. **Varsayım yok:** bir özelliğin var olduğunu
> söylüyorsam dosya ve satır gösterebilirim.

Ölçekler (bugün): 309 JS dosyası / ~106 500 satır (üç arayüz), ~2 000 satır
Python (HKM). Denetimler: AYS 1033, SPİ 775, ESP 593, HKM 108 test; ayrıca
duman, erişilebilirlik, palet, telefon düzeni, başarım ve uçtan uca
bütünleşme denetimi.

---

## A. Mevcut mimari — LifeOS şu anda nasıl çalışıyor?

```text
  AYS :4173            SPİ :4183            ESP :4193
  tek sayfa app        tek sayfa app        tek sayfa app
  R.* ad alanı         SP.* ad alanı        ESP.* ad alanı
  localStorage         localStorage         localStorage
  rota84285.v2[.p]     spi.v1.<profil>      esp.v1.<profil>
       │                    │                    │
       │  core/beacon.js (VARSAYILAN KAPALI, tek yön, en iyi çaba)
       └────────────────────┼────────────────────┘
                            ▼
                     HKM daemon :4200
                     SQLite · VP konseyi · Yönetici · Patron
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         yerel yüz     WhatsApp/TG    JSON API
         (web/)        (kapalı)       (/api/*)
```

Gerçekte olan:

1. **Üç bağımsız uygulama.** Ortak kod yok, ortak depo yok, ortak profil
   yok. Her biri kendi `localStorage` anahtarında yaşar ve diğerinin
   anahtarını **okumaz** (doğrulandı: karşılıklı arama boş döndü).
2. **Tek yönlü bağ.** Üç sistem HKM'nin varlığını bilmez; tek istisna
   `core/beacon.js` ve o da varsayılan kapalıdır, hiçbir çizimde çalışmaz,
   hiçbir kaydı bekletmez.
3. **HKM ambarı dar.** Bugün HKM'ye giden şey günün özetidir: AYS'den 5,
   SPİ'den 4, ESP'den 4 sayı. HKM'nin ders, deneme, tahlil, kart gibi
   kayıtlardan **haberi yoktur.**
4. **Kural motoru otoritedir.** Üç sistemde de sayıyı ve kararı kod üretir;
   model yalnızca cümleye çevirir ve kapalıyken sistem kapanmaz. HKM'de
   model katmanı **hiç yoktur.**
5. **Dürüstlük katmanı üç sistemde de var:** dört kesinlik etiketi, kanıt
   eksenleri (kaynak/kesinlik/uygulanabilirlik/yetki), Goodhart nöbetçisi,
   sürtünme ölçeri, kalibrasyon defteri, bakım borcu denetimi, depo ufku.

---

## B. Mevcut modüller

| Sistem | Durum | Açıklama |
|---|---|---|
| **AYS** | MEVCUT | Ders/konu ağacı (184 kayıt), plan üretici, gün akışı, soru ve hata defteri, deneme + analiz protokolü, SRS kartları, hedef ve kapı kuralları, telafi protokolleri, ofis (çok ajanlı), 19 ekran. |
| **SPİ** | MEVCUT | 70 biyobelirteç, ölçüm günlüğü, öğün/besin, hareket ve toparlanma, ilaç/etkileşim, bütçe-sepet, kanıt eksenleri, klinik sınır, 12 ekran. |
| **ESP** | MEVCUT | 7 disiplin, merdiven/kademe sistemi, SRS, okuma-yazma-müzik-diksiyon atölyeleri, sempozyum, planlayıcı, 14 ekran. |
| **HKM** | KISMEN | Daemon, SQLite, VP konseyi, öncelik sırası, dijital ikiz, Yönetici, öneri yaşam döngüsü, çapraz bulgu, Büyük Patron, kanal katmanı ve yerel yüz **var**; doğal dil, yönetim merkezi, veri görüntüleme ve tek tık kurulum **yok**. |
| **Storage** | KISMEN | Local-first zaten gerçek: her şey cihazda, hiçbir çekirdek veri buluta gitmiyor. Kota izleme, budama, dokuz aylık ufuk projeksiyonu, sistem başına yedek/geri yükleme var. **LifeOS geneli tek yedek, şifreleme ve gerçek şema taşıma yok.** |

### Talimattaki başlık başlığına karşılık

| İstenen | Durum | Kanıt / eksik |
|---|---|---|
| Local-first depo | **MEVCUT** | `*/src/js/core/store.js` — tek localStorage anahtarı, kota ve hata raporu. |
| Veri izolasyonu (modüller arası) | **MEVCUT** | Ayrı anahtarlar, karşılıklı okuma yok. |
| Ortak profil/ayar katmanı | **EKSİK** | Üç ayrı profil; ad, tema, palet, hedefler üç kez giriliyor. |
| Merkezi veri/servis katmanı | **EKSİK** | Ekranlar `Store`'a doğrudan gidiyor; ortak bir sorgu katmanı yok. |
| Yedek / geri yükleme | **KISMEN** | Sistem başına var (`exportAll`/`importAll`); LifeOS geneli tek dosya yok. |
| Şema taşıma (migration) | **KISMEN** | AYS'de gerçek `migrate()` (şema 5). ESP/SPİ'de yalnız sürüm damgası — ilk şema değişiminde **veri riski**. |
| Import/Export | **KISMEN** | JSON yedek var; seçmeli dışa aktarım (örn. yalnız denemeler) yok. |
| Veri güvenliği (şifreleme) | **EKSİK** | Depo düz JSON. Model anahtarları ayrı anahtarda ve yedeğe girmiyor (iyi) ama şifreli değil. |
| HKM tek tık kurulum | **EKSİK** | Elle: `cp config.example.json`, jeton üret, daemon başlat, üç arayüzde ayrı ayrı aç, jetonu üç kez yapıştır. |
| HKM sohbet (doğal dil) | **KISMEN** | Komut seti **kapalı ve altı komut**: `durum, kabul, ret, neden, capraz, yardim`. Serbest metin bilinçli olarak yorumlanmıyor. |
| HKM'nin LifeOS'ta işlem yapması | **EKSİK** | "Yarın 2 saat matematik" → AYS'de plan üretimi yok: bağ tek yönlü, HKM'nin yazma yetkisi yok. |
| HKM yönetim merkezi | **EKSİK** | Ayarlar yalnız `config.json` içinde, elle. |
| HKM veri görüntüleme | **KISMEN** | İkiz (14 metrik), kararlar, çapraz bulgu, konuşma var; ders/deneme/ölçüm/beceri **verisi HKM'de yok**. |
| Karar zinciri | **KISMEN** | veri→denetim→öncelik→öneri→kullanıcı cevabı var; **gerçek sonuç → geri bildirim halkası yok.** |
| AI mimarisi | **MEVCUT (üç sistemde)** / **EKSİK (HKM'de)** | Kural motoru otorite, model kapalıyken çalışır, kota ve zemin denetimi var. |
| Veri→AI gizliliği | **MEVCUT** | Modele yalnız brifing gider; ham metin, ses ve kişisel kayıt gitmez. |
| Hata izolasyonu | **MEVCUT** | Üç sistem ayrı uygulama; ekran çizimi, eylem ve değişiklik ayrı ayrı try/catch; HKM kapalıyken hiçbiri bozulmaz (uçtan uca denetimle kanıtlı). |
| Başarım | **MEVCUT** | `perfcheck.js` dokuz aylık veriyle bütçe denetler (en ağır ekran ~58 ms). ESP/SPİ'de kare önbelleği (`Memo`) var, **AYS'de yok.** |

---

## C. Kritik eksikler (önem sırasına göre)

**1. HKM kör.** HKM'nin gördüğü şey 14 sayıdır. "Derslerimi göster",
"son denemelerimi analiz et", "bu haftayı değerlendir" sorularının cevabı
HKM'de **yoktur**; veri hiç oraya gitmiyor. Talimattaki 11. ve 12. bölüm
(veri görüntüleme + karar zinciri) bu eksik kapanmadan yapılamaz.

**2. Ortak kimlik yok.** Aynı insan üç sistemde üç ayrı kullanıcıdır. Ad,
tema, palet, düzen, hedef ufku üç kez giriliyor; profil değiştirmek üç ayrı
iş. LifeOS'un "tek sistem" hissi ilk burada kırılıyor.

**3. Şema taşıma sahte.** ESP ve SPİ'de `migrate()` yalnız sürüm damgası
basıyor. İlk gerçek şema değişiminde dokuz aylık kayıt sessizce bozulabilir.
AYS'de gerçek taşıma var; örnek orada.

**4. Tek yedek yok.** Üç ayrı yedek dosyası + HKM'nin `db/hkm.db`'si. Cihaz
kaybında kullanıcının dört ayrı şeyi hatırlaması gerekiyor.

**5. Kurulum sürtünmesi.** HKM'yi kurmak bugün yedi adım ve bir jeton
kopyalama işi. Bu, en değerli katmanın hiç açılmamasının en olası sebebi.

**6. Geri bildirim halkası kapalı değil.** Öneri kabul/ret ediliyor ama
"sonra ne oldu" ölçülmüyor. Kabul edilen önerilerin sonuçları ölçülmedikçe
HKM kendi faydasını kanıtlayamaz.

**7. Çoğaltılmış çekirdek.** `h.js`, `store.js`, `components.js`,
`friction`, `goodhart`, `calib`, `evidence`, `beacon` üç kez yaşıyor. Bu
bilinçli bir karardı (üç sistem birbirinden bağımsız olsun) ve bedeli
gerçek: bu oturumda ESP'nin kısma cümlesi kullanıcıya **"AYS yetki
politikası"** diyordu — kopyalanan metin kopyalandığı yerde yanlıştı.

**8. AYS'de kare önbelleği yok.** ESP ve SPİ'deki `Memo` katmanı AYS'ye
hiç taşınmadı; en ağır ekranlar orada.

---

## D. Hedef mimari

```text
                        LIFEOS
                           │
        ┌──────────────────┴──────────────────┐
        │           PAYLAŞILAN ÇEKİRDEK       │   ← KOD ortak, VERİ değil
        │  h · store · components · dürüstlük │
        │  katmanı · beacon · kimlik          │
        └──────────────────┬──────────────────┘
        ┌─────────┬────────┴────────┬─────────┐
       AYS       SPİ               ESP      (her biri KENDİ deposunda)
        │         │                 │
        └─────────┴────────┬────────┘
                  beacon (tek yön, kapalı gelir)
                           ▼
                      HKM ÇEKİRDEĞİ
        ┌──────────┬───────┴───────┬──────────┐
     SOHBET     YÖNETİM          VERİ       KARAR
   (kural motoru  (kurulum,     (ambar +   (öncelik +
    + ops. model)  kanallar,     çapraz)    sonuç izi)
                   eşikler)
                           │
                    SQLite (yerel)
                           │
              ┌────────────┴────────────┐
         yerel işleme              opsiyonel model
      (her şey burada)        (yalnız ifade, sayı üretmez)
```

**Korunacak üç karar** (talimatla çelişen yerde gerekçesiyle):

1. **Bağımlılık tek yönlü kalır.** Talimat HKM'yi "merkez" diyor; katılıyorum
   — ama merkez olmak, üçünün ona **bağımlı** olması demek değil. HKM
   çöktüğünde AYS/SPİ/ESP olduğu gibi çalışmaya devam etmeli. Merkezîlik
   *okuma* ve *özet* tarafında olur, *çalışma* tarafında değil.
2. **Ortak kod ≠ ortak depo.** Paylaşılan çekirdek bir kütüphanedir; üç
   sistemin verisi ayrı anahtarlarda kalır. Tek bir ortak depoya geçmek,
   bir sistemdeki bozuk yazmanın diğer ikisini de götürmesi demektir.
3. **Model hiçbir yerde sayı üretmez.** HKM'ye doğal dil eklenecekse:
   kural motoru sayıyı ve kararı üretir, model **yalnızca** o cümleyi
   yeniden ifade eder ve kullanıcının sorusunu altı komuttan birine
   eşler. Model kapalıyken HKM bugünkü gibi çalışır.

### Sohbetin gerçek tasarımı

Bugünkü kapalı komut seti bir eksiklik değil bir **temel**: doğal dil
katmanı onun üstüne, *niyet eşleme* olarak konur.

```text
"bugün ne yapmalıyım"
        ↓
  model (opsiyonel)  →  niyet: durum   (yalnız eşleme; sayı üretmez)
        ↓
  kural motoru       →  brifing + tek öneri  (bugünkü kod)
        ↓
  model (opsiyonel)  →  aynı cümleleri daha insanca yazar
```

Model kapalıysa niyet eşlemesi kelime tablosundan yapılır ve
anlaşılmayana "anlamadım" denir. **Anlamadığını anlamış gibi yapmak
yasaktır** — bu kural modelle birlikte de geçerlidir.

### HKM'nin yazma yetkisi (talimattaki "plan oluştur")

"Yarın 2 saat matematik" isteği HKM'nin AYS'ye **yazması** demek. Bu,
tek yönlü bağı kırar. Önerim: **niyet kuyruğu**.

```text
HKM: öneri/istek üretir  →  intents tablosu (HKM'de)
AYS: beacon zaten konuşuyorsa, açılışta kuyruğu SORAR
     kullanıcıya gösterir → kullanıcı onaylarsa AYS kendi planını yazar
```

Yazan yine AYS'dir, HKM değil. HKM kapalıyken kuyruk boş gelir, AYS
etkilenmez.

---

## E. Öncelikli geliştirme sırası (gerçek bağımlılıklara göre)

Talimattaki sıra depoyu gördükten sonra şöyle değişti — sebepleriyle:

| # | İş | Neden bu sırada |
|---|---|---|
| 1 | **Şema taşıma (ESP/SPİ)** | Veri kaybı riski açıkken üstüne özellik konmaz. |
| 2 | **HKM tek tık kurulum + eşleme** | En değerli katman açılmıyorsa geri kalanı ölçülemez. |
| 3 | **Ambar genişletme (beacon v2)** | HKM kör oldukça sohbet, veri görüntüleme ve karar zinciri yapılamaz. |
| 4 | **Ortak kimlik/profil** | Üç sistemde tek kullanıcı hissi; kurulumdan sonra anlamlı. |
| 5 | **HKM veri görüntüleme** | 3 bitmeden içi boş olur. |
| 6 | **Sonuç/geri bildirim halkası** | Kararın işe yarayıp yaramadığı ancak veri geldikten sonra ölçülür. |
| 7 | **HKM yönetim merkezi** | Kurulum ve kanallar oturduktan sonra ayar yüzeyi. |
| 8 | **Doğal dil katmanı (opsiyonel model)** | Komut seti ve veri hazır olmadan dil katmanı süs olur. |
| 9 | **LifeOS geneli yedek/geri yükleme** | Ortak kimlik ve HKM ambarı yerine oturduktan sonra tek dosya anlamlı. |
| 10 | **Paylaşılan çekirdek (kod tekilleştirme)** | Büyük ve risklidir; önce davranış sabitlenmeli. |
| 11 | **AYS'ye `Memo` + başarım** | Ölçülü ve düşük riskli; her an yapılabilir. |
| 12 | **Şifreleme + güvenlik sertleştirme** | Yüzey son hâlini aldıktan sonra. |

---

## F. Uygulama planı

### FAZ 1 — Veri emniyeti
**Ne:** ESP ve SPİ'ye AYS'dekine benzer gerçek `migrate()`; her şema
adımı için taşıma fonksiyonu ve geri dönüşü olmayan adımlarda yedek uyarısı.
**Neden:** Dokuz aylık kaydın tek gerçek riski budur.
**Dosyalar:** `ESP/src/js/core/state.js`, `SPI/src/js/core/state.js`,
`*/src/tests/state.test.js`.
**Bağımlılık:** yok. **Sonuç:** şema değişimi veri kaybı riski olmadan yapılabilir.

### FAZ 2 — Tek tık HKM
**Ne:** `HKM/kur.py` (jeton üretir, `config.json` yazar, şemayı kurar,
sağlık kontrolü yapar, özet basar) + daemon'da **eşleme uç noktası**:
`GET /api/pair` yalnız 127.0.0.1'den, tek kullanımlık ve kısa ömürlü bir
kod verir; üç arayüzdeki "HKM'yi bağla" düğmesi jetonu oradan alır.
**Neden:** Jetonu üç kez elle yapıştırmak, katmanın hiç açılmamasının
en olası sebebi.
**Dosyalar:** `HKM/kur.py` (yeni), `HKM/daemon.py`, `*/src/js/core/beacon.js`,
ilgili ayar ekranları, `tools/entegre.js`.
**Bağımlılık:** yok. **Sonuç:** iki adımda çalışan HKM.

### FAZ 3 — Ambar genişletme (beacon v2)
**Ne:** Beacon'un gönderdiği alanlar **kullanıcının açık seçimiyle**
genişler: özet (bugünkü hâl) / gelişmiş (ders-konu ilerlemesi, deneme
netleri, ölçüm serileri, kademe durumu) / tam. Her seviye ne gönderdiğini
satır satır gösterir; içerik (soru metni, tahlil değeri, not) **hiçbir
seviyede** gitmez.
**Neden:** HKM'nin körlüğü bütün üst fazları bloke ediyor.
**Dosyalar:** `*/src/js/core/beacon.js`, `HKM/core/sync_engine.py`,
`HKM/core/db.py` (seri tabloları), testler.
**Bağımlılık:** Faz 2. **Sonuç:** HKM gerçek soruları cevaplayabilir hâle gelir.

### FAZ 4 — Ortak kimlik
**Ne:** `lifeos.profile` adında ortak bir cihaz kaydı: ad, tema, palet,
düzen, dil, aktif profil. Üç sistem açılışta okur, kendi verisini yine
kendi anahtarında tutar.
**Neden:** Tek kullanıcı hissi; ayrıca profil değişimi tek yerden.
**Dosyalar:** üç `core/store.js` + `state.js`, ayar ekranları.
**Bağımlılık:** Faz 1. **Sonuç:** bir kez ayarla, üçünde geçerli.

### FAZ 5 — HKM veri merkezi
**Ne:** Yüze üç sekme: **Genel / Sistemler / HKM**. Sistemler sekmesinde
AYS-SPİ-ESP için seri grafikleri, kapsama ve kesinlik etiketleri; HKM
sekmesinde kararlar, çapraz bulgular, konuşma geçmişi.
**Neden:** Talimatın 11. bölümü.
**Dosyalar:** `HKM/web/index.html`, `HKM/daemon.py` (okuma uç noktaları).
**Bağımlılık:** Faz 3. **Sonuç:** veri HKM'den okunabilir.

### FAZ 6 — Sonuç halkası
**Ne:** `decisions` tablosuna sonuç izi: kabul edilen öneriden sonraki
gün/hafta ilgili metrik ne oldu? `GET /api/impact` — "kabul edilen N
öneriden sonra ilgili ölçü şöyle hareket etti" (eşiğin altında "veri yok").
**Neden:** HKM'nin kendi faydasını ölçmesi; §10'daki dürüst sorunun cevabı.
**Dosyalar:** `HKM/core/db.py`, yeni `HKM/core/impact.py`, `manager.py`, yüz.
**Bağımlılık:** Faz 3. **Sonuç:** kapalı döngü ve ölçülebilir fayda.

### FAZ 7 — Yönetim merkezi
**Ne:** Yüzde ayar sekmesi: eşikler (`thresholds`), kanallar, izin listesi,
işaret aralığı, veri saklama süresi, yedek/geri yükleme. `config.json`
elle düzenlenmek zorunda kalmaz.
**Dosyalar:** `HKM/daemon.py` (yazma uç noktaları + doğrulama), yüz.
**Bağımlılık:** Faz 2, 5. **Sonuç:** teknik ayar kullanıcı yüzeyine çıkar.

### FAZ 8 — Doğal dil (opsiyonel model)
**Ne:** `HKM/core/dil.py`: (a) niyet eşleme — serbest cümle → altı
komuttan biri; (b) ifade — kural motorunun cümlelerini daha insanca yazma.
Model yoksa ikisi de kelime tablosuyla yapılır ve anlaşılmayan cümleye
"anlamadım" denir. Modele giden şey **yalnız brifing metnidir**.
**Bağımlılık:** Faz 3, 5. **Sonuç:** "bugün ne yapmalıyım" çalışır.

### FAZ 9 — Niyet kuyruğu (HKM → modüller)
**Ne:** HKM'de `intents` tablosu; arayüzler açılışta kuyruğu okur,
kullanıcıya gösterir, onaylanırsa **kendi kodlarıyla** yazarlar.
**Neden:** "Yarın 2 saat matematik" isteğini tek yönlü bağı kırmadan
karşılamanın tek yolu.
**Bağımlılık:** Faz 3. **Sonuç:** HKM iş başlatabilir, yetkiyi almadan.

### FAZ 10 — LifeOS yedeği, çekirdek tekilleştirme, güvenlik
**Ne:** (a) tek dosyalık LifeOS yedeği (üç sistem + HKM veritabanı);
(b) paylaşılan çekirdek kütüphane — `h`, `components`, dürüstlük katmanı,
beacon tek kaynağa iner; (c) depo şifrelemesi (parola türetmeli) ve model
anahtarlarının ayrı saklanması gözden geçirilir; (d) AYS'ye `Memo`.
**Bağımlılık:** hepsi. **Sonuç:** bakım maliyeti ve risk düşer.

---

## Ek: teknik borç listesi (kısa)

| Borç | Yer | Etki |
|---|---|---|
| Sahte `migrate()` | ESP, SPİ | Veri kaybı riski |
| Kopyalanmış çekirdek (8 dosya × 3) | üç sistem | Bir düzeltme üç kez, metin kopyaları yanlış yere düşüyor |
| `Memo` yok | AYS | En ağır ekranlar gereksiz yeniden hesap |
| Ekran sözleşmesi belge dışı | üçü | Yeni ekran yazarken sözleşme koddan okunuyor |
| HKM'de tek dosya şema | `db.py` | Tablo büyüdükçe sorgular dağılacak |
| Test sayıları belge içinde | çözüldü | `tools/sayilar.py` artık üretir |
