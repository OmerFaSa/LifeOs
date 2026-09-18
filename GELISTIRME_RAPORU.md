# LifeOS — geliştirme raporu ve devir belgesi

> **Tarih:** 2026-09-18 · **Kapsam:** dört sistemin tamamı
> **Kime:** bu depoda çalışacak **bir sonraki ajan oturumuna**
> **Yöntem:** ölçüm önce, öneri sonra.

Bu belge **tek başına yeterli** olacak şekilde yazıldı. Bunu okuyan
oturum bu konuşmayı görmedi; deponun ne olduğunu, nasıl çalıştırıldığını,
neyin neden yapılmaması gerektiğini ve önerilen işleri **komut
düzeyinde** buradan öğrenir.

Bulgular `AGENTS.md` §4'ün biçimine uyar:

```
dosya:satır · ne yanlış · hangi girdide bozulur · nasıl doğrulanır
```

«Şu daha iyi olurdu» buraya girmedi. Her madde ya bir **ölçümle** ya da
deponun kendi belgesinde yazılı bir **sözle** dayanıyor. Ölçemediğim
yerde «göremedim» yazdım.

---

# DURUM — bu rapordan SONRA ne yapıldı

> Bu blok rapordan sonra eklendi. Raporun **bulguları (BÖLÜM 3) ve iş
> paketleri (BÖLÜM 4) olduğu gibi duruyor**; yalnız §2.1'deki denetim
> matrisi, §6'daki soru 1'in cevabı ve §7'deki sıra tablosu durum
> bilgisiyle güncellendi — bir «bugün böyle» tablosunun eskimesi, bir
> sonraki oturum için kurulmuş bir tuzaktır. Bir
> öneriyle sonucu arasındaki fark, bir sonraki oturumun en çok işine
> yarayan şeydir — o yüzden öneri silinmedi, üstüne yazıldı.

| İş | Durum | Ölçüm |
|---|---|---|
| **İP-1** CI bütün denetimleri koşsun | ✅ bitti | `run:` 4 → 22; beş iş (arayüz ×3, seviye, HKM, bütünleşme, haftalık yük) |
| **İP-2** Beş yıllık yük denetimi | ✅ bitti | üç sistemde de `tools/loadcheck.js`, `sayilar.py` TAM listesinde |
| **İP-3** Ortak CSS tek kaynağa | ✅ bitti | `brand/ortak/` + `tools/ortak.py`; 4 365 satır tekrar kalktı |
| **İP-4** Telefon sorusu | ✅ bitti | **Seçenek B** seçildi (depo sahibi); README «Telefonda kullanım» |
| **İP-5.1** Rütbe görselleri | ◑ 15 kart + 6 sahne geldi | Kutsal'ın K kartları ve küçük rozetler bekliyor |
| **İP-5.2** HKM brifinginde seviye | ✅ bitti | `manager._level_line`, iki test |
| **İP-5.3** Defterin bir yıllık boyutu | ✅ ölçüldü | AYS 13 117 B · SPİ 15 157 B · ESP 12 397 B (tavan) |
| **İP-5.4** Rütbe ekranı ve XP kaynakları | ✅ bitti | üç arayüzde Rütbe bölümü, dört sekme; katalogda `rota`·`nerede`·`nasil` |
| **İP-6** `labs.js` kapsamı | ⏳ açık | 1 482 satır, hâlâ testsiz |

## Rapor yazılırken bilinmeyen dört şey

Bunlar İP-1 ve İP-2 yapılırken **ölçülerek** bulundu; raporun kendisi
bunları göremezdi, çünkü ikisi de o denetimleri başka bir makineye
taşımadan görünmüyordu.

**1 · Dört denetim CI'da HİÇ koşamazdı.** Üç `palettecheck.js` ve
`ledgercheck.js` tarayıcı yolunu (`/opt/pw-browsers/chromium`) ve sunucu
klasörünü (`cwd:'/home/user/LifeOs/...'`) SABİT yazıyordu. İkisi de
yalnız bir geliştirme ortamında var. İş akışına eklenseler, «Executable
doesn't exist» ya da boş sayfa ölçümü verirlerdi. Dördü de artık
`CHROMIUM_PATH || undefined` ve `__dirname` kullanıyor.

**2 · Raporun önerdiği CI döngüsü iki aracı yanlış çağırıyordu.**
`audit.py` hiçbir koşulda çıkış kodu 1 vermez (kırmızıya dönmeyen bir
denetim, denetim değil bir ölçümdür) ve `evalagents.js` gerçek bir
sağlayıcı anahtarı ister. İkisi de iş akışından çıkarıldı, gerekçeleri
`ci.yml` başında yazılı.

**3 · ESP beş yıllık hacimde GEÇMİYORDU.** Rapor «office 210,3 ms,
geçiyor» diyor; aynı tohumlama `perfcheck.js` kalıbıyla yazıldığında
ölçüm **475 ms** çıktı (eşik 400). Fark tohumlamanın taslak metinlerinin
uzunluğundan geliyor — rapordaki ölçüm kısa metinlerle yapılmış olmalı.

Kök neden ölçüldü: `writing.readability` ölçüsü **tek çizimde 214 ms**
sürüyor, çünkü her karede 268 taslağın tamamı yeniden hecelere
ayrılıyordu. `core/memo.js` kare önbelleği bunu çözmez — o yalnız aynı
karedeki tekrarı kaldırır.

Düzeltme, `memo.js`'in kalıcı önbelleğe karşı gerekçesini **kırmadan**
yapıldı: o gerekçe «kalıcı önbellek *durum değişti mi* sorusunu sormak
zorundadır» der; okunabilirlikte o soru sorulmaz, çünkü anahtar sürümü
taşır (`d.id + d.updatedAt`, ve `saveDraft` her kayıtta `updatedAt`i
yeniden yazar).

```
office   475 → 249 ms
toplam  1988 → 866 ms
```

Üç test bunu koruyor. **Bu, İP-2'nin gerçekten bir duman dedektörü
olduğunun kanıtı:** ilk koşumunda bir şey buldu.

**4 · Tek dosya sürümü telefon için yazılmış her şeyi kaybediyordu.**
İP-4'ün seçilen yolu «`dist/*.html`'i telefona kopyala, PWA olarak kur».
Ama `build.py` `<head>`'i SIFIRDAN yazıyordu — dört etiket ve başlık — ve
kaynaktaki beş satır sessizce düşüyordu: manifest düğümü, ikon, tema
rengi ve iki `apple-mobile-web-app-*` etiketi. Sonucu ölçüldü:
`installManifest()` `#pwa-manifest` düğümünü bulamayıp sessizce
dönüyor, iOS'ta uygulama tam ekran açılmıyor, ikon hiç gelmiyordu.

Yani seçilen yolu belgelemek, çalışmayan bir yolu belgelemek olacaktı.

Etiketler artık kaynaktan **çıkarılarak** taşınıyor (elle yazılmıyor:
yarın bir tane daha eklenirse o da taşınır) ve ikon **data URI olarak
gömülüyor** — tek dosya tek dosyadır, yanındaki `img/` klasörü telefona
gitmez. `app.js` de manifest ikonunu artık `<link rel="icon">`
etiketinden okuyor, yola elle yazmıyor.

Üç `smoke.js` her koşumda bunu arıyor; `build.py`'de tek satır kapatılıp
denetimin kırmızıya döndüğü doğrulandı.

## Rapordan sonra gelen iş — RÜTBE SİSTEMİ

Bu rapor yazıldığında seviye sistemi «kademe + basamak» idi ve görselleri
yoktu. Sonra depo sahibi on beş rütbe kartı ile altı kademe sahnesi
üretti ve sistem onların etrafında yeniden kuruldu:

- Beşinci kademe **Hüküm → Safir** (kartların üstünde yazan ad).
- Altıncı kademe **Kutsal noktasızlaştı**: 6.1/6.2/6.3 yerine
  K100 … K1000, her biri bir öncekinin ~1,85 katı. K1000 bilerek
  ulaşılmaz ve bunu bir test koruyor.
- Kutlama artık **haberci → perde** sırasıyla çalışıyor; Space o ekrana
  hiç sokmuyor.
- Görseller `brand/seviye/medya/` altında **kayıpsız** duruyor
  (15,0 → 11,8 MB, piksel değişmedi) ve `tools/rutbe.py` ile işleniyor.

Ardından rütbenin **durağan** bir evi oldu: üç arayüzde de gezinmede
kendi **Rütbe** bölümü (Ayarlar ve Ofis gibi bir üst düzey bölüm) ve
dört sekme — **Şu an**, **Merdiven**, **XP nereden gelir**, **Defter**.
Üçüncü sekme bu işin sebebiydi: katalogdaki her satır artık `rota`,
`nerede` ve `nasil` alanlarını taşıyor, yani her puanın hangi işten
geldiği ve hangi ekranda kazanıldığı yazılı — «Git» düğmesi de oraya
götürüyor. Motora iki erişimci eklendi (`XP.merdiven`, `XP.bugunku`);
ikisi de hesaplamaz, defterde yazılı olanı okunabilir kılar. Ekran tek
kaynaktan (`brand/seviye/rutbe.js`) yayılır; rehberdeki eski «Seviye»
sekmesi kaldırıldı, çünkü aynı bilgi iki yerde durursa bir gün ikisi
farklı şey söyler.

Bu iş sırasında bir şey daha ölçüldü: **şema sürümü artışı gün
kırılımını siliyordu.** `xp.js` biçim değişimi ile eşik değişimini ayırt
etmiyordu, yani «beşinci kademenin adı Safir oldu» gibi bir katalog
düzenlemesi kullanıcının yüz yirmi günlük kırılımını arşive atıyordu.
Ayrıldı: biçim değiştiyse arşiv, eşik değiştiyse yalnız yeniden türetme.

## Değişmeyenler

- Rapordaki **B5** (cihazlar arası senkron yalnız Artifact çalışma
  zamanında) artık README'de yazılı — kod değişmedi, çünkü davranış
  zaten doğruydu; eksik olan cümleydi.
- **BÖLÜM 5 — YAPILMAYACAKLAR** listesine dokunulmadı ve hiçbir maddesi
  çiğnenmedi.
- Büyük dosyalar bölünmedi, test sayısı için test yazılmadı, hiçbir
  denetim eşiği «geçsin diye» gevşetilmedi. `perfcheck` ve `loadcheck`
  için eklenen `PERF_PAY` bir eşik değişikliği değil bir ORTAM payıdır:
  varsayılanı 1 (yerel koşum hep sıkı ölçer), yalnız CI 1,5 veriyor ve
  araç bu payı çıktısına yazıyor — kimse gevşetilmiş bir bütçeyi sıkı
  sanmasın.
- `tasarimcheck.js` de `sayilar.py` TAM listesine girdi: CI'ın koştuğu
  bir denetimin rutin yerel koşumda olmaması, B1'in aynısıydı.

---

# BÖLÜM 0 — BU BELGE NASIL OKUNUR

| Sen kimsin | Nereden başla |
|---|---|
| Depoyu hiç görmemiş bir ajan | §1 → §2 → §4 (iş paketleri) |
| Depo sahibi, öncelik seçecek | §3 (bulgular) → §6 (karar soruları) |
| Tek bir işi yapacak | doğrudan o iş paketi; her biri kendi kendine yeter |

**İş paketlerinin sırası tesadüf değil.** İP-1 diğerlerinin güvencesidir:
onsuz yapılan her değişiklik, bozup bozmadığını söyleyemeyen bir
değişikliktir.

---

# BÖLÜM 1 — OTUZ DAKİKADA DEPO

## 1.1 · Dört sistem

| Klasör | Ne | Nasıl çalışır |
|---|---|---|
| `AYS/` | Akademik Yol Sistemi — sınav hazırlığı | tarayıcıda tek sayfa uygulama |
| `SPI/` | SPİ — sağlık performans izleyicisi | aynı |
| `ESP/` | Entelektüel Seviye Planlayıcı | aynı |
| `HKM/` | Hayat Kontrol Merkezi — üçünün özeti | Python servisi, **isteğe bağlı** |

Üç arayüz **sıfır çalışma zamanı bağımlılığıyla** çalışır: çerçeve yok,
paket yok, derleyici yok. Düz JavaScript, düz CSS, düz HTML. Playwright
yalnız denetim betikleri için var.

**HKM tek yönlüdür.** Üç arayüz HKM'nin var olduğunu bilmez ve o
kapalıyken bozulmaz. Tek bağ `core/beacon.js` — varsayılan kapalı,
ateşle-ve-unut bir günlük özet gönderimi. HKM hiçbir modüle **yazmaz**;
teklif bırakır, modül kendi koduyla uygular.

## 1.2 · Değişmez kurallar

`AGENTS.md` §1 bunları **sözleşme** sayar. Bir öneri bunlardan birini
kırıyorsa önce kural tartışılır, kod sonra değişir.

1. **Kural motoru otoritedir.** Sayıyı ve kararı kod üretir; dil modeli
   yalnız cümleye çevirir. Model kapalıyken hiçbir sistem kapanmaz.
2. **Eksik veri sıfır değildir.** Dört etiket: `ölçüldü / tahmin /
   hesaplandı / veri yok`. Etiketsiz sayı hiçbir katmana girmez.
   *Pratikte:* bir gün için kayıt yoksa grafikte **boşluk** çizilir,
   sıfır değil.
3. **Sıfır çalışma zamanı bağımlılığı.**
4. **HKM'ye bağımlılık tek yönlüdür.**
5. **Sınırlar:** SPİ teşhis koymaz ve doz önermez; ESP/AYS sertifika
   vermez, yetenek yargısı kurmaz, sonuç garantisi etmez.
6. **XP karar vermez.** Seviye sistemi yalnız görünürlüktür; hiçbir
   plan, reçete, uyarı ya da teşhis ona bakmaz.
7. **Anlamadığını anlamış gibi yapma.** Belirsiz girdi tahmin edilmez,
   sorulur. Ölçülmemiş bir şey «temiz» diye raporlanmaz.
8. **Kullanıcıya giden metin düzgün Türkçe'dir.** Kod yorumları ASCII
   olabilir; ekranda görünen cümle olamaz.

Buna iki çalışma kuralı eklenir (`NOTLAR.md` §20):

- **Ölç, değiştir, tekrar ölç.** «Daha hızlı oldu» bir iddia değil bir
  ölçümdür.
- **Yorum NE yaptığını değil NİÇİN öyle olduğunu anlatır.** Bu depoda
  yorumlar uzundur ve kasıtlıdır — çoğu bir hatanın mezar taşıdır.
  Sildiğinde hata geri gelir.

## 1.3 · Ortamı kur — komut komut

```bash
# 1) Bağımlılıklar (her arayüz kendi klasöründe; yalnız Playwright)
cd AYS && npm install && cd ..
cd SPI && npm install && cd ..
cd ESP && npm install && cd ..

# 2) Sistemi aç (deponun kökünden, tek komut)
python3 baslat.py
#   giriş  127.0.0.1:4180
#   AYS    127.0.0.1:4173
#   SPİ    127.0.0.1:4183
#   ESP    127.0.0.1:4193
#   HKM    127.0.0.1:4200

# 3) Bir arayüzün denetimleri (o klasörden)
node tools/runtests.js       # birim testleri
node tools/smoke.js          # uygulamayı gerçekten açar, ekranları gezer
node tools/a11ycheck.js      # erişilebilirlik
node tools/layoutcheck.js    # 390 pikselde taşma, 24px dokunma hedefi
node tools/palettecheck.js   # bütün paletlerde kontrast
node tools/perfcheck.js      # dokuz aylık veriyle çizim bütçesi

# 4) Depo kökü
python3 tools/seviye.py --denetle    # seviye kopyaları ayrışmış mı
python3 tools/sayilar.py --tam --yaz # HEPSİNİ koşar + belgelerdeki sayıları tazeler
node tools/entegre.js                # üç arayüz + HKM uçtan uca

# 5) HKM
cd HKM && python3 -m tests.run && python3 tools/perf.py && node tools/yuz.js
```

## 1.4 · Bu ortamda seni ısıracak yedi şey

Bunlar bu oturumda **gerçekten** zaman kaybettirdi. Okumadan başlama.

**1. Chromium yolu.** Playwright'in beklediği tarayıcı sürümü ortamdaki
ile uyuşmuyor. Her denetim komutunun başına şunu koy:

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/runtests.js
```

Koymazsan `Executable doesn't exist ... npx playwright install` der ve
indirmeye çalışır.

**2. Denetimler port çakışır.** İki denetimi aynı anda koşturuyorsan
farklı port ver: `node tools/runtests.js 4188`. Aksi hâlde biri
diğerinin sunucusuna bağlanıp tuhaf hatalar verir.

**3. `npm install` `package-lock.json`'ı kirletir.** Kurulumdan sonra
commit etmeden önce geri al:

```bash
git checkout -- AYS/package-lock.json SPI/package-lock.json ESP/package-lock.json
```

**4. Denetim tarayıcısı H.264 çözemez.** `img/brand/intro.mp4` ve
`img/seviye/kademe-*.mp4` testlerde **her zaman** hata verir; bu
beklenen davranıştır ve `tools/smoke.js` içindeki `IGNORE` listesi bunu
biliyor. Video oynatmayı bu ortamda doğrulayamazsın — kullanıcının
kendi tarayıcısı gerekir. Bunu raporlarken açıkça söyle.

**5. `dist/` derlenmiş ve depoya işlenmiş.** `src/` altında bir şey
değiştirdiysen **mutlaka** yeniden üret, yoksa duman testi eski sürümü
gezip yanlış güven verir:

```bash
cd AYS && python3 build.py && cd ../SPI && python3 build.py && cd ../ESP && python3 build.py
```

**6. `brand/seviye/` altındaki dosyalar ÜRETİLMİŞ kopyalar doğurur.**
Oradaki bir şeyi değiştirdiysen:

```bash
python3 tools/seviye.py --yay      # üç arayüze dağıtır
python3 tools/seviye.py --denetle  # ayrışma var mı
```

Arayüzlerin içindeki kopyaları **elle düzenleme**; bir sonraki yayında
kaybolur. Başlıkları bunu zaten yazıyor.

**7. Üç arayüz ayrı portlarda = ayrı `localStorage`.** Bu kasıtlıdır
(`sunucu.py` baş yorumu gerekçeyi anlatır). Bir arayüzde gördüğün veri
diğerinde yoktur; «veri kayboldu» sanma.

## 1.5 · Dosya haritası — nereye bakılır

```
AGENTS.md                 ajan sözleşmesi — ÖNCE BUNU OKU
NOTLAR.md                 devir notu; §19 açık borçlar, §20 çalışma biçimi
README.md                 genel bakış, çalıştırma, ölçülmüş sayılar
GELISTIRME_RAPORU.md      bu belge

brand/                    marka görselleri + seviye sisteminin TEK KAYNAĞI
  life/                   LifeOS logosu (giriş sayfası)
  seviye/                 kademeler, XP motoru, perde — üçe buradan yayılır
    OKU.md                seviye sisteminin kendi belgesi
tools/
  seviye.py               brand/seviye/ → üç arayüz (yay + denetle)
  sayilar.py              bütün denetimleri koşar, belgelerdeki sayıyı tazeler
  entegre.js              üç arayüz + HKM uçtan uca
  paket.py                dış inceleme için PAKET.md üretir

<APP>/src/js/
  app.js                  kabuk: gezinme, olay dağıtımı, açılış
  core/                   alan mantığı (model, depo, hesap, işaret)
  data/                   sabit kataloglar
  screens/                ekranlar
  tests/                  birim testleri (tarayıcıda koşar)
<APP>/tools/              denetim betikleri
<APP>/build.py            tek dosyalık dist üretir
```

---

# BÖLÜM 2 — SİSTEM BUGÜN NEREDE

Bütün sayılar bu belgenin yazıldığı gün ölçüldü.

| | AYS | SPİ | ESP | HKM |
|---|---:|---:|---:|---:|
| Kaynak satırı (js+py, dist hariç) | 45 811 | 37 353 | 37 855 | 13 656 |
| Birim testi | 1 174 | 923 | 738 | 312 |
| Denetim aracı | 8 | 11 | 6 | 3 |
| Ofis ekranı çizimi (9 ay veri) | 40,4 / 120 ms | 20,8 / 120 ms | **66,9 / 100 ms** | — |
| En büyük dosya (app.js hariç) | `core/office.js` 2 049 | `screens/labs.js` 1 482 | `core/state.js` 1 336 | — |

**Toplam 3 147 test, on dört denetim aracı.** Bu, bu ölçekteki çoğu özel
projenin üstünde bir disiplin. Aşağıdaki bulgular o disiplinin
*eksikliğini* değil, **uygulanmadığı yerleri** gösteriyor.

## 2.1 · Denetim aracı matrisi

| araç | ne ölçer | AYS | SPİ | ESP |
|---|---|:---:|:---:|:---:|
| `runtests.js` | birim testleri | ✅ | ✅ | ✅ |
| `smoke.js` | ekranları gerçekten gezer | ✅ | ✅ | ✅ |
| `a11ycheck.js` | erişilebilirlik | ✅ | ✅ | ✅ |
| `layoutcheck.js` | 390px taşma + dokunma hedefi | ✅ | ✅ | ✅ |
| `palettecheck.js` | bütün paletlerde kontrast | ✅ | ✅ | ✅ |
| `perfcheck.js` | 9 aylık veriyle çizim | ✅ | ✅ | ✅ |
| `loadcheck.js` | **5 yıllık** veriyle çizim | ✅ | ✅ | ✅ |
| `ledgercheck.js` | defter düzeni | ❌ | ✅ | ❌ |
| `designcheck.js` | beş düzen × genişlik | ❌ | ✅ | ❌ |
| `tasarimcheck.js` | tasarım örnekleri | ❌ | ✅ | ❌ |
| `audit.py` | içerik denetimi | ✅ | ❌ | ❌ |
| `evalagents.js` | ajan değerlendirmesi | ✅ | ❌ | ❌ |

`README.md:116` şunu vaat ediyor: *«Bir denetim bir sistemde bir hata
bulduysa, aynı denetim ötekilere de taşınır.»* Matris bu sözün
tutulmadığını gösteriyor.

> **Sonradan:** `loadcheck.js` satırı üç ✅ oldu (İP-2). Kalan üç
> SPİ-özel denetim hâlâ tek sistemde; ama artık **CI ikisini de
> koşuyor** ve iş akışı onları `if: matrix.system == 'SPI'` ile değil
> DOSYA VARLIĞIna bakarak çağırıyor — biri yarın AYS'ye taşınırsa CI'ı
> düzenlemek gerekmez. Bkz. DURUM bölümü.

---

# BÖLÜM 3 — BULGULAR

Öncelik sırası **risk × düzeltme maliyeti** ile belirlendi. Her bulgu
kendi kanıtını taşıyor; hiçbirini bana güvenerek kabul etme, komutu
koştur.

---

## B1 · CI on dört denetimin ikisini koşuyor — **en yüksek**

**Nerede:** `.github/workflows/ci.yml`

**Ne yanlış:** İş akışı yalnız `runtests.js` ve `smoke.js` koşturuyor
(artı HKM birim testleri ve `seviye.py --denetle`). Şunlar **hiç
koşmuyor:** `a11ycheck`, `layoutcheck`, `palettecheck`, `perfcheck`,
`ledgercheck`, `designcheck`, `loadcheck`, `HKM/tools/yuz.js`,
`HKM/tools/perf.py`, `tools/entegre.js`.

**Hangi girdide bozulur:** Erişilebilirliği bozan, 390 pikselde taşma
yapan, kontrastı AA'nın altına düşüren ya da çizim bütçesini aşan bir
değişiklik CI'dan **yeşil** geçer.

**Bu varsayım değil, olan bir şey.** Bu oturumda seviye paneli
eklendiğinde SPİ ve ESP'nin `layoutcheck` ve `a11ycheck` denetimleri
kırmızıya döndü:

```
SPI  layoutcheck.js   KALDI — Element is not attached to the DOM
ESP  a11ycheck.js     KALDI — atlama bağlantısı ilk Tab durağı değil
```

İkisi de gerçek kullanıcı hatasıydı (biri yazarken kaybolan odak, biri
çalınan ilk Tab durağı) ve ikisi de **CI'da görünmeyecekti**.

**Nasıl doğrulanır:**
```bash
grep -c "run:" .github/workflows/ci.yml   # → 4
```

**Düzeltme:** İP-1.

---

## B2 · Beş yıllık yük denetimi üç sistemin yalnız birinde — **yüksek**

**Nerede:** `SPI/tools/loadcheck.js` var; `AYS/tools/`, `ESP/tools/`
altında yok. Ayrıca `tools/sayilar.py:37`'deki `TAM` listesinde de yok
— yani SPİ'de bile rutin koşumda çalışmıyor.

**Ne yanlış:** Bu aracın var olma sebebi kendi baş yorumunda yazılı:

> *«Diğer koşumlar sekiz ölçümle çalışır ve bu bir kör nokta yarattı:
> ofis ekranının bir çizimi beş yıllık veriyle 996 ms sürüyordu, boş
> veriyle 60 ms. Yavaşlama veri biriktikçe geliyor ve kullanıcı onu
> fark ettiğinde çoktan alışkanlık kırılmış oluyor.»*

O kör nokta AYS ve ESP'de **hâlâ açık**.

**Ölçtüm.** ESP'yi beş yıllık hacimle çizdirdim — 10 050 kart, 2 680
not, 2 010 olay, **1 825 gün** oturum, 268 taslak:

| ekran | 5 yıl | 9 ay | büyüme | SPİ eşiği |
|---|---:|---:|---:|---:|
| office | 210,3 ms | 66,9 ms | 3,1× | 400 |
| team | 142,8 ms | — | — | 400 |
| lang | 87,5 ms | — | — | 400 |
| **on dört ekran toplamı** | **775 ms** | — | — | 3 500 |

**ESP bugün geçiyor.** Alarm yok — ve bunu böyle yazmak önemli, çünkü
ölçmeden «muhtemelen yavaştır» demek bu depoda bir bulgu değil.

Ama iki şey duruyor: ofis ekranı dokuz aydan beş yıla giderken **3,1
kat** yavaşlıyor ve bunu izleyen hiçbir şey yok. AYS hiç ölçülmedi ve
en büyük dosyası (`core/office.js`, 2 049 satır) tam da o ekranı
çiziyor.

**Nasıl doğrulanır:**
```bash
ls AYS/tools/loadcheck.js ESP/tools/loadcheck.js   # ikisi de yok
grep -n "^TAM" -A 2 tools/sayilar.py               # loadcheck listede yok
```

**Düzeltme:** İP-2.

---

## B3 · 4 365 satır birebir aynı CSS, koruyan hiçbir şey yok — **yüksek**

**Nerede:** `AYS/src/css/`, `SPI/src/css/`, `ESP/src/css/`

**Ne yanlış:** Şu üç dosya üç uygulamada **bayt düzeyinde aynı**:

| dosya | satır | kopya | toplam |
|---|---:|---:|---:|
| `base.css` | 219 | ×3 | 657 |
| `layout.css` | 671 | ×3 | 2 013 |
| `designs.css` | 565 | ×3 | 1 695 |
| | | | **4 365** |

Diğer üçü **kısmen** ortak — farkları sayılabilir ve sınırlı:

| dosya | fark | farkın niteliği |
|---|---:|---|
| `tokens.css` | 78 satır | yalnız **ajan renkleri** ve grafik serisi renkleri |
| `palettes.css` | 52 satır | aynı biçim |
| `components.css` | ~50 satır | uygulamaya özel birkaç bileşen |

`tokens.css`'in kendi baş yorumu zaten şunu yazıyor:

> *«BU DOSYA SPİ İLE ORTAKTIR. İki uygulama aynı masadan gelir: aynı
> ölçek, aynı yarıçap, aynı türetme kuralları. Tek fark ajan adları ve
> grafik serisi renkleridir.»*

**Hangi girdide bozulur:** Birinde yapılan bir düzeltme diğer ikisinde
unutulur ve fark ancak iki ekran yan yana konunca görülür. Bu oturumda
aynı sınıfın bir örneği yaşandı: alt bant seçicisi üç dosyada elle
düzeltildi ve üçü de doğru yazıldığı için fark edilmedi — ama biri
yanlış yazılsaydı hiçbir denetim söylemeyecekti.

**Neden şimdi:** `NOTLAR.md` §19 bunu zaten borç sayıyor ve çözümünü de
yazıyor: *«`LifeOs/ortak/` + derleme zamanı birleştirme»*. **O mekanizma
artık var ve çalışıyor.** `tools/seviye.py` dokuz dosyayı tek kaynaktan
üç uygulamaya yayıyor, `--denetle` ayrışmayı yakalıyor, CI'da koşuyor ve
elle kurcalayıp kırmızıya döndüğü doğrulandı. Aynı mekanizmayı CSS'e
genişletmek yeni bir icat değil.

**Nasıl doğrulanır:**
```bash
diff AYS/src/css/layout.css ESP/src/css/layout.css   # çıktı BOŞ
diff AYS/src/css/base.css   SPI/src/css/base.css     # çıktı BOŞ
diff AYS/src/css/designs.css ESP/src/css/designs.css # çıktı BOŞ
```

**Düzeltme:** İP-3.

---

## B4 · Telefon her yerde hedefleniyor, telefona giden yol yok — **yüksek (ürün kararı)**

**Ne yanlış:** Depo telefonu çok ciddiye alıyor:

- her sistemde **390 piksel** düzen denetimi, her koşumda
- PWA kurulum manifesti (`app.js` → `installManifest`)
- `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`
- «telefonda alt gezinme» için ayrı bir bileşen ve ayrı gerekçe yorumu

Ama:

- `sunucu.py:51` → `HOST = "127.0.0.1"`. Dışarı açmak bilinçli olarak
  reddedilmiş — **ve bu doğru bir varsayılan**, tartışılan o değil.
- `README.md` içinde telefonda çalıştırmanın **belgeli bir yolu yok**.
- Verinin telefona nasıl gideceği de yazılı değil.

**Hangi girdide bozulur:** Kullanıcı «bunu telefonumda kullanayım»
dediği an. Bugünkü cevap: ya elle yedek dosyası taşıyacak ya da
`dist/*.html`'i telefona kopyalayacak — ikisi de belgesiz, ikincisi
verisiz.

**Nasıl doğrulanır:**
```bash
grep -rn "telefon\|mobil\|LAN\|0\.0\.0\.0" README.md | grep -v "telefon düzeni"
# → yalnız denetim aracı açıklaması çıkar; çalıştırma yolu yok
```

**Düzeltme:** İP-4 — ama **önce karar** (§6, soru 1).

---

## B5 · Cihazlar arası senkron yalnız Artifact çalışma zamanında var — **orta**

**Nerede:** `ESP/src/js/core/store.js:154` (üçünde de aynı)

```js
if(window.claude && typeof window.claude.use === 'function'){
  const api = await window.claude.use('db');
  if(api){ db = api; mode = 'cloud'; health.cloud = 'ok'; }
}
```

**Ne yanlış:** Bu nesne yalnız uygulama **Claude Artifact olarak
yayımlandığında** var. Belgelenen çalıştırma yolu (`python3 baslat.py`,
localhost) onu asla sağlamaz — yani yerel kullanımda mod **her zaman**
`local`.

Kod bu durumu doğru yönetiyor: sessizce yerele düşüyor, hata vermiyor,
kullanıcıyı korkutmuyor. Eksik olan **bu sonucun hiçbir yerde yazılı
olmaması**.

**Hangi girdide bozulur:** Dizüstünde SPİ'ye ölçüm girip telefonda
bakmak isteyen kullanıcı iki ayrı veri kümesiyle karşılaşır ve bunu
ancak yaşayarak öğrenir.

**Düzeltme:** İP-4'ün parçası; en azından README'ye tek cümle.

---

## B6 · Açık borçların bugünkü durumu — **bilgi**

`NOTLAR.md` §19'daki listeyi tek tek doğruladım. Bu bir yeni bulgu
değil; **borç listesinin kendisinin güncel olup olmadığının** denetimi.

| Borç | Durum | Kanıt |
|---|---|---|
| İçe aktarma geri alınamıyor | ✅ **kapandı** | `undoImport` üç `store.js`'de de var |
| `SPI/screens/labs.js` 1434 satır | ⚠️ **büyümüş: 1 482** | hâlâ testsiz |
| `AYS/core/office.js` 2 049 satır | açık | kapsam %59 (notta yazılı) |
| Ortak CSS kopyaları | açık | bkz. B3 |
| Depo ölçeklenmesi | açık | yaşayan veride göç — sormadan yapma |
| `palette.js` kapsamı | açık | **kasıtlı** — UI açan işlevler denenmiyor |

§19 kendi uyarısını taşıyor ve katılıyorum:

> *«Büyük dosyaları bölmek, testi olan bir hatayı düzeltmekten daha
> risklidir. Önce kapsam, sonra bölme.»*

`labs.js`'in testsiz kalarak büyümesi, o uyarının gerçekleşmekte
olduğunu gösteriyor: her yeni satır bölmeyi biraz daha pahalı yapıyor.

---

## B7 · Seviye sistemi: kalan üç iş — **düşük**

Sistem kuruldu, üç arayüze bağlandı, HKM onu görüyor, 100+ testi var.
Kalanlar:

1. **Rozet ve video dosyaları yok.** `brand/seviye/kademe-1..6.png` ve
   `kademe-2..6.mp4` eksik. Kod hazır: dosya yoksa rozet **kademe
   numarasına**, kutlama **banner'a** düşüyor. Bu bir kod işi değil,
   bir dosya işi — depo sahibinden gelecek.
2. **HKM brifinginde seviye satırı yok.** Kademe yalnız *Sistemler*
   sayfasında görünüyor, günlük brifingde değil.
3. **Defterin bir yıllık boyutu ölçülmedi.** 120 günlük kırılım ve
   arşiv çıkarması testli, ama gerçek bir yılın sonunda `seviye`
   anahtarının kaç bayt ettiğini kimse ölçmedi. `core/storage.js`
   zaten koleksiyon başına büyüme ölçüyor; oraya bakmak yeter.

---

## B8 · Ölçtüm, sorun ÇIKMADI — **bilgi**

Bunları bilerek yazıyorum: bir sonraki oturum aynı şeyleri yeniden
araştırmasın.

| Ne baktım | Sonuç |
|---|---|
| Kota dolduğunda veri kaybı | ✅ `store.js` `QuotaExceededError`'ı yakalıyor, kullanıcıya ne yapacağını söylüyor, yazmayı **başarısız** raporluyor |
| Yedek yaşı uyarısı | ✅ `backupAgeDays()` üçünde de var; AYS Bugün ekranında, ESP profilde, SPİ rehberde gösteriyor |
| Erişilebilirlik izin listesi | ✅ üç istisna da gerekçeli (araç `::after` dokunma alanını ölçemiyor) |
| `esp.css` iki kez yükleniyor mu | ✅ hayır — `grep` yorumdaki anmayı da sayıyordu, gerçek `<link>` tek |
| Seviye kopyaları ayrışmış mı | ✅ `seviye.py --denetle` temiz |
| HKM tek yönlülüğü | ✅ `entegre.js` HKM kapalıyken üç arayüzün bozulmadığını her koşumda doğruluyor |

**Bakmadıklarım.** Dört sistemin iş mantığını (müfredat eşikleri,
klinik sınırlar, ajan kadrosu) denetlemedim — orası alan bilgisi ister.
Model katmanının maliyet davranışını gerçek bir sağlayıcıyla
denemedim. Türkçe ayrıştırmanın doğruluğunu ölçmedim. Video ve sesin
gerçekten çaldığını **doğrulayamadım** (bkz. §1.4/4).

---

# BÖLÜM 4 — İŞ PAKETLERİ

Her paket kendi başına bitmiş bir iştir: hedefi, dokunacağı dosyalar,
uygulama taslağı, doğrulama komutu, kabul ölçütü ve bilinen tuzakları
var. Sırayla yapılması önerilir ama bağımlılıkları açıkça yazılı.

---

## İP-1 · CI bütün denetimleri koşsun

> **Bulgu:** B1 · **Süre:** yarım gün · **Bağımlılık:** yok
> **Neden ilk:** diğer her paketin güvencesi bu. İP-2 ve İP-3'ü İP-1
> olmadan yapmak, düzelttiğini ölçemeden düzeltmektir.

### Hedef

Bir değişiklik erişilebilirliği, 390 piksel düzenini, kontrastı ya da
çizim bütçesini bozarsa **birleştirmeden önce** görünsün.

### Dokunulacak dosya

`.github/workflows/ci.yml` — tek dosya.

### Uygulama

Var olan `arayuz` işi zaten `matrix.system: [AYS, SPI, ESP]` ile üç
sistemi **paralel** koşuyor. Denetimleri oraya eklemek toplam süreyi
bir sistemin kendi denetimleri kadar uzatır (~4-5 dk), üç katına değil.

`arayuz` işinin `steps` bloğuna, «Duman testi» adımından sonra:

```yaml
      - name: Erişilebilirlik
        run: node tools/a11ycheck.js

      - name: Telefon düzeni (390px)
        run: node tools/layoutcheck.js

      - name: Palet kontrastı
        run: node tools/palettecheck.js

      - name: Çizim bütçesi (dokuz aylık veri)
        run: node tools/perfcheck.js

      # Yalnız SPİ'de olan denetimler. `if` yerine dosya varlığına
      # bakılır: yarın AYS'ye de taşınırsa iş akışını değiştirmek
      # gerekmesin (İP-2 ve İP-3 tam bunu yapacak).
      - name: Sisteme özel denetimler
        run: |
          for t in ledgercheck designcheck tasarimcheck audit evalagents; do
            if [ -f "tools/$t.js" ]; then echo "→ $t"; node "tools/$t.js"; fi
            if [ -f "tools/$t.py" ]; then echo "→ $t"; python3 "tools/$t.py"; fi
          done
```

`hkm` işine:

```yaml
      - name: Sorgu bütçesi
        working-directory: HKM
        run: python3 tools/perf.py

      # yuz.js ESP/node_modules içindeki Playwright'i kullanır.
      - name: HKM yüzü (erişilebilirlik, telefon, kontrast)
        run: |
          cd ESP && npm ci && npx playwright install --with-deps chromium && cd ..
          node HKM/tools/yuz.js
```

Yeni bir iş — **bütünleşme**, üç arayüz + HKM uçtan uca:

```yaml
  butunlesme:
    name: Üç arayüz + HKM uçtan uca
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - name: Bağımlılıklar (entegre.js ESP'nin Playwright'ini kullanır)
        working-directory: ESP
        run: npm ci && npx playwright install --with-deps chromium
      - name: Uçtan uca
        run: node tools/entegre.js
```

### Doğrulama

```bash
# yerelde, CI'ın koşacağı her şeyi bir kez koştur
CHROMIUM_PATH=/opt/pw-browsers/chromium python3 tools/sayilar.py --tam
CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/entegre.js
```

### Kabul ölçütü

- [ ] `grep -c "run:" .github/workflows/ci.yml` ≥ 12
- [ ] Bir denetimi bilerek kır (örn. bir düğmenin `aria-label`'ını sil),
      CI'ın **kırmızıya döndüğünü** gör, sonra geri al.
      **Kırmızıya dönmeyen bir denetim, denetim değildir.**
- [ ] Toplam CI süresi 15 dakikayı aşmıyor.

### Tuzaklar

- `loadcheck` ağırdır (beş yıllık veri üretir). Her PR'da koşturma;
  `schedule:` ile haftalık ayrı bir işe koy.
- `perfcheck` CI makinesinde yerelden **yavaş** ölçer. Bütçeler yerel
  ölçümle yazıldı; CI'da kırmızıya dönerse önce bütçeyi değil,
  **ölçüm ortamını** sorgula. Gerekirse CI'da bütçeyi 1,5× esnet ve
  bunu yorumla gerekçelendir.
- `npm ci` `package-lock.json` gerektirir; üçünde de var.

---

## İP-2 · Beş yıllık yük denetimini AYS ve ESP'ye taşı

> **Bulgu:** B2 · **Süre:** yarım–bir gün · **Bağımlılık:** İP-1 (önerilir)

### Hedef

«Bugün hızlı» ile «yarın da hızlı» arasındaki farkı ölçen nöbetçiyi üç
sisteme de koy.

### Kaynak

`SPI/tools/loadcheck.js` — 200 satır civarı, okunması on dakika.
Anatomisi:

| adım | ne yapar |
|---|---|
| 1 | `python3 -m http.server` ile `src/`'yi servis eder |
| 2 | Chromium açar, `reducedMotion:'reduce'`, kurulum sayfasını atlar |
| 3 | `page.evaluate` ile **doğrudan duruma** beş yıllık veri yazar (depoya değil — ölçülen şey ÇİZİM) |
| 4 | `SECTIONS`'tan rotaları çıkarır, her birini **ısıtır** sonra ölçer |
| 5 | Ekran başına 400 ms, toplam 3 500 ms eşiğiyle karşılaştırır |
| 6 | Ayrıca birkaç ağır motor fonksiyonunu ayrı ölçer |

### AYS ve ESP için ne değişir

Yalnız **3. adım** (tohumlama) ve eşikler. Geri kalan gövde aynı.

**ESP tohumlaması** (ölçüm için bunu kullandım, çalışıyor):

| koleksiyon | beş yıl |
|---|---:|
| `S.cards` (her biri 1 geçmiş satırı) | 10 050 |
| `S.notes` | 2 680 |
| `S.books` | 60 |
| `S.events` | 2 010 |
| `S.days` (her birinde 1 oturum) | 1 825 |
| `S.drafts` | 268 |
| `S.pieces` | 201 |

`ESP/tools/perfcheck.js:77` içindeki tohumlama bloğu aynı işi dokuz aylık hacimle
yapıyor; oradan kopyalayıp **6,7 katına** çıkarmak yeterli
(9 ay → 5 yıl). Kod zaten yazılı, uydurmaya gerek yok.

**AYS tohumlaması** — koleksiyonlar `AYS/src/js/core/state.js:11-30`'da:
`S.days`, `S.weeks`, `S.exams`, `S.errors`, `S.cards`, `S.reviews`,
`S.solved`, `S.forecasts`, `S.decisions`, `S.protocols`, `S.sources`.
`AYS/tools/perfcheck.js` içindeki tohumlamayı aynı oranda büyüt.

### Eşik seçimi

SPİ'nin eşiği **400 ms / ekran** ve gerekçesi baş yorumunda yazılı:
*«bir etkileşimin "anında" hissedilmesinin üst sınırı»*. Aynı eşiği
kullan — sistemden sisteme değişmesi için sebep yok.

Toplam eşiği ekran sayısına göre ayarla: SPİ on iki ekran için 3 500 ms.
ESP'nin on dört ekranı var → ~4 000 ms. AYS'ninkini say ve orantıla.

### Ölçülmüş başlangıç noktası

ESP için ölçtüm, **bugün geçiyor**:

```
office 210,3 ms · team 142,8 ms · lang 87,5 ms · toplam 775 ms
```

Yani bu paket bir yangını söndürmüyor, bir **duman dedektörü** takıyor.
Raporlarken böyle yaz: «geçiyor» demek de bir ölçümdür.

### Ek iş

`tools/sayilar.py:37` içindeki `TAM` listesine `loadcheck.js` ekle.
Böylece `--tam --yaz` koşumu belgelerdeki sayıyı da tazeler ve
`README.md`/`NOTLAR.md` tablolarında yeni bir satır belirir.

### Doğrulama

```bash
cd ESP && CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/loadcheck.js
cd AYS && CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/loadcheck.js
cd .. && CHROMIUM_PATH=/opt/pw-browsers/chromium python3 tools/sayilar.py --tam --yaz
```

### Kabul ölçütü

- [ ] Üç sistemde de `tools/loadcheck.js` var ve geçiyor
- [ ] `TAM` listesinde `loadcheck.js` var
- [ ] `README.md` ve `NOTLAR.md` sayı tablolarında `loadcheck.js` satırı
      göründü
- [ ] Eşiği bilerek düşür (400 → 50), denetimin **kırmızıya döndüğünü**
      gör, geri al

### Tuzaklar

- `page.evaluate` içinde beş yıllık veri üretmek birkaç saniye sürer;
  `timeout` ver.
- Tohumlama **duruma** yazılmalı, depoya değil. Depoya yazarsan
  `localStorage` kotasını aşarsın ve ölçtüğün şey çizim olmaktan çıkar.
- ESP'de ölçümden önce `ESP.Memo.baslat()/bitir()` sarmalı var
  (kare önbelleği). `perfcheck.js`'teki kalıbı bozma.

---

## İP-3 · Ortak CSS'i tek kaynağa indir

> **Bulgu:** B3 · **Süre:** bir gün · **Bağımlılık:** İP-1 (şart)
> Bu paket üç uygulamanın **görünümünü** aynı anda değiştirir; onu
> yakalayacak denetimler CI'da olmadan yapma.

### Hedef

4 365 satırlık birebir tekrarı tek kaynağa indir ve ayrışmasını
otomatik yakala.

### Neden mekanizma icat edilmeyecek

`tools/seviye.py` tam olarak bu işi yapıyor ve çalıştığı kanıtlandı:

- dokuz dosyayı `brand/seviye/`'den üç arayüze yayıyor
- ad alanı yer tutucularını değiştiriyor (`__NS__`, `__MOD__`)
- HTML ve Python bloklarını dosya **içine**, `SEVIYE:…` işaretleri
  arasına yazıyor
- `--denetle` ayrışmayı yakalıyor, CI'da koşuyor, elle kurcalayınca
  kırmızıya döndüğü doğrulandı

Yapılacak şey onu **genelleştirmek**: `tools/ortak.py` (ya da
`seviye.py`'yi bir kaynak dizini parametresi alacak hâle getirmek).

### Ayrım tablosu — hangi dosya nasıl paylaşılır

| dosya | durum | nasıl |
|---|---|---|
| `base.css` | **tam ortak** (fark 0) | olduğu gibi `brand/ortak/`'a taşı |
| `layout.css` | **tam ortak** (fark 0) | aynı |
| `designs.css` | **tam ortak** (fark 0) | aynı |
| `tokens.css` | kısmi — fark **yalnız ajan/seri renkleri** | ortak gövde + `<APP>/src/css/tokens-<app>.css` kuyruğu |
| `palettes.css` | kısmi (52 satır) | aynı desen |
| `components.css` | kısmi (~50 satır) | aynı desen |
| `fonts.css` | **taşıma** — gömülü yazı tipleri | dokunma |
| `seviye.css` | zaten yayılıyor | dokunma |
| `rota.css`, `esp.css` | uygulamaya özel | dokunma |

**Birinci turda yalnız üç «tam ortak» dosyayı taşı.** Kısmi olanlar
ayrı bir tur; ortak gövde ile kuyruğu ayırmak bir tasarım kararı ister
ve tam ortak üçlüsü zaten kazancın %60'ı.

### Sıra tuzağı — bunu okumadan başlama

CSS'te **sıra anlamdır**. Bugünkü yükleme sırası:

```
fonts → tokens → palettes → base → layout → components → seviye → designs → (rota|esp)
```

Ortak dosyalar bu sıranın **tam olarak aynı yerinde** kalmalı. `--yay`
dosyayı `<APP>/src/css/` içine aynı adla yazarsa `index.html`
değişmez ve sıra korunur — **önerilen yol budur**. Dosyayı başka bir
dizine koyup `index.html`'i değiştirmek sırayı bozma riski taşır ve
`build.py`'nin satır içine alma düzenini de etkiler.

### Uygulama adımları

1. `brand/ortak/` oluştur; `base.css`, `layout.css`, `designs.css`
   dosyalarını ESP'den oraya **taşı** (üçü aynı, hangisinden aldığın
   fark etmez — ama `diff` ile doğrula).
2. `tools/ortak.py` yaz: `seviye.py`'nin `DOSYALAR`/`yay`/`denetle`
   iskeletini kopyala, kaynak dizini `brand/ortak/`, hedefler
   `<APP>/src/css/<ad>`. Ad alanı değişimi **gerekmez** (CSS'te ad alanı
   yok) — `degistir=False`.
3. Üretilen kopyalara `seviye.py`'nin yazdığı gibi bir **başlık** koy:
   `/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME. Kaynak: brand/ortak/… */`
4. `python3 tools/ortak.py --yay` koştur.
5. `.github/workflows/ci.yml`'deki `seviye` işine bir adım daha ekle:
   `python3 tools/ortak.py --denetle`
6. Üç `build.py` koştur, `dist/` yeniden üret.
7. `AGENTS.md` §2'deki komut listesine `ortak.py`'yi ekle.
8. `NOTLAR.md` §19'daki «Ortak CSS kopyaları» satırını **kapandı** yap.

### Doğrulama

```bash
python3 tools/ortak.py --yay
python3 tools/ortak.py --denetle
diff AYS/src/css/layout.css ESP/src/css/layout.css   # hâlâ boş olmalı
CHROMIUM_PATH=/opt/pw-browsers/chromium python3 tools/sayilar.py --tam
```

### Kabul ölçütü

- [ ] `brand/ortak/` içinde üç dosya var, `<APP>/src/css/` içindekiler
      üretilmiş kopya başlığı taşıyor
- [ ] `ortak.py --denetle` temiz **ve** bir kopyayı elle bozunca
      kırmızıya dönüyor
- [ ] Üç sistemde `palettecheck`, `layoutcheck`, `designcheck`,
      `a11ycheck` geçiyor (görünüm bozulmadı)
- [ ] `dist/` yeniden üretildi ve işlendi
- [ ] CI'da ayrışma denetimi koşuyor

### Geri alma

Tek commit'te yap. Bozulursa `git revert` yeterli — `dist/` de aynı
commit'te olduğu için tutarlı geri döner.

### Tuzaklar

- `@media` blokları dosya sonlarında yoğunlaşıyor; taşırken **dosyayı
  böl­me**, olduğu gibi taşı.
- `build.py` `<link rel="stylesheet" href="...">` etiketlerini regex ile
  topluyor (`inline_css`). Etiketin biçimini değiştirme.
- Üç uygulamanın `dist/*.html` çıktısı bu işten sonra **değişir**
  (yorum başlığı eklenir). Bu beklenen; damga farkıyla karıştırma.

---

## İP-4 · Telefon sorusunu cevapla

> **Bulgu:** B4, B5 · **Süre:** seçime bağlı (2 saat – 2 gün)
> **Bağımlılık:** §6 soru 1'in cevabı. **Karar gelmeden başlama.**

### Hedef

«Telefonu hedefliyoruz ama yolu yok» hâlini bitir. Üç seçenek var;
üçü de meşru, ikisi kolay.

---

### Seçenek A — yerel ağ modu *(en çok istenen, orta zorluk)*

`baslat.py --ag` bayrağı: sunucuları `0.0.0.0`'a bağla, terminale
adresi ve bir QR bas. Telefon aynı Wi-Fi'de tarayıcıdan açar, PWA
olarak kurar.

**Uygulama:**

1. `sunucu.py`'de `HOST` sabitini parametreye çevir. **Varsayılan
   `127.0.0.1` kalmalı** — dışarı açmak bilinçli bir karar ve betik o
   kararı kullanıcı yerine vermez (dosyanın kendi baş yorumu bunu
   yazıyor; o yorumu koru ve genişlet).
2. `baslat.py`'ye `--ag` bayrağı; bayrak yoksa hiçbir şey değişmez.
3. `--ag` ile açılırken terminale **uyarı** bas: «Bu adres yerel ağdaki
   herkese açıktır. Verin şifresiz servis edilir.»
4. QR için dış paket kullanma (§1.2/3). QR'ı elle üretmek istemiyorsan
   sadece adresi yazdır — `http://192.168.1.x:4183` yeterli.
5. `README.md`'ye «Telefonda kullanım» başlığı.

**Veri sonucu:** telefon ve dizüstü **aynı** sunucuya bağlanır, yani
**aynı veri**. B5 kendiliğinden çözülür. Bu seçeneğin en güçlü yanı bu.

**Riski:** dizüstü kapalıyken telefon çalışmaz. Ve yerel ağ güvenliği
kullanıcının sorumluluğuna geçer — bu yüzden uyarı şart.

---

### Seçenek B — tek dosya + elle yedek *(en kolay, sıfır altyapı)*

`dist/spi.html`'i telefona kopyala, tarayıcıda aç, PWA olarak kur.
Veriyi yedek dosyasıyla taşı.

**Uygulama:** kod yok, yalnız `README.md`'ye bir bölüm:
dosyayı nasıl taşıyacağı, yedeği nereden alacağı, nereye yükleyeceği ve
**iki cihazın iki ayrı defter olduğu**.

**Riski:** iki defter. Kullanıcı bunu bilmeden kullanırsa hangi cihazda
ne olduğunu kaybeder. Bu seçenek yalnız «telefon ikincil, ara sıra
bakıyorum» ise doğru.

---

### Seçenek C — telefonu hedefleme

390 piksel denetimlerini «dar pencere» olarak yeniden adlandır, PWA
manifestini kaldır, `apple-mobile-web-app-*` etiketlerini sil.

**Ne zaman doğru:** kullanıcı bunu yalnız masaüstünde kullanacaksa.
O zaman bugünkü hâl **ölü ağırlık** ve temizlenmesi doğru iş.

**Uyarı:** bu seçenek geri dönüşü en pahalı olandır. 390 piksel
denetimi bugün gerçek hatalar yakalıyor; kaldırmak yerine yeniden
adlandırmak yeterli.

---

### Her seçenekte ortak olan iş (B5)

Hangi seçenek seçilirse seçilsin `README.md`'ye **tek cümle** girmeli:

> Yerel kullanımda veri **cihaza bağlıdır**; cihazlar arası senkron
> yalnız uygulama Artifact olarak yayımlandığında çalışır
> (`core/store.js`, `window.claude.use('db')`). Yerelde tek köprü yedek
> dosyasıdır.

### Kabul ölçütü

- [ ] Seçilen yol `README.md`'de **komut düzeyinde** yazılı
- [ ] Veri sonucu (tek defter mi iki mi) açıkça yazılı
- [ ] A seçildiyse: varsayılan hâlâ `127.0.0.1` ve `--ag` olmadan hiçbir
      şey değişmiyor
- [ ] A seçildiyse: `node tools/entegre.js` ve üç `smoke.js` hâlâ
      geçiyor (portlar değişmedi)

---

## İP-5 · Seviye sistemini tamamla

> **Bulgu:** B7 · **Süre:** 2–4 saat (dosyalar hariç)

### 5.1 · Rozet ve video dosyaları — *depo sahibinden*

`brand/seviye/` klasörüne, **sabit adlarla**:

```
kademe-1.png … kademe-6.png     rozet (banner ve küçük rozette)
kademe-2.mp4 … kademe-6.mp4     o kademeye geçiş videosu
```

`kademe-1.mp4` zaten var. Kod hazır ve **eksik dosya hata değildir**:
video yoksa kutlama banner'a, rozet yoksa kademe numarasına düşer.
Ajan tarafında yapılacak bir şey yok — dosya gelince kendiliğinden
devreye girer. Bunu doğrulamak için `brand/seviye/OKU.md`.

### 5.2 · HKM brifingine seviye satırı

Bugün kademe yalnız HKM'nin *Sistemler* sayfasında görünüyor. Günlük
brifing üç sistemin özetini veriyor ama seviyeyi taşımıyor.

Veri **zaten ambarda**: `xp_today`, `xp_total`, `level_tier`,
`level_sub` metrikleri işaretle gidiyor ve `HKM/core/adlar.py` onları
Türkçe adlandırıyor. Yapılacak şey brifing üreticisine bir satır
eklemek.

**Uyarı:** HKM'nin **kendi XP'si yoktur ve olmamalı** — üçünün üstünde
değil yanındadır. Brifingde seviye bir **gözlem** olarak durur, bir
hedef ya da uyarı olarak değil (§1.2/6).

### 5.3 · Defterin bir yıllık boyutunu ölç

`core/storage.js` koleksiyon başına büyüme ölçüyor. `seviye`
anahtarının bir yıl sonunda kaç bayt ettiğini ölç ve `NOTLAR.md`'ye
yaz. Tahmin: 120 günlük kırılım × ~6 etkinlik × ~20 bayt ≈ 15 KB —
ama **tahmin bir ölçüm değildir**, koş ve yaz.

---

## İP-6 · `labs.js` kapsamı *(sonraya bırakılabilir)*

> **Bulgu:** B6 · **Süre:** bir gün+

`SPI/src/js/screens/labs.js` 1 482 satır ve testsiz. `NOTLAR.md` §19'un
kuralı net: **önce kapsam, sonra bölme.**

Bu paketi **şimdi yapma** diye işaretlemiyorum ama İP-1/2/3'ten
sonraya bırakılmalı: o üçü bütün depoyu koruyan işler, bu tek bir
dosyayı koruyan iş.

Başlarken: `SPI/src/tests/` altındaki mevcut testlerin kalıbına bak
(`resetState`, `withTodayAsync`, fabrikalar). En riskli yol tahlil
**ayrıştırma** (yapıştırılan laboratuvar metni) — oradan başla.

---

# BÖLÜM 5 — YAPILMAYACAKLAR

Bunlar bilinçli olarak önerilmiyor. Bir sonraki oturum bunları
«iyileştirme» diye önerirse, gerekçeleri burada.

| Yapma | Neden |
|---|---|
| **Büyük dosyaları şimdi bölmek** | `NOTLAR.md` §19: *«Büyük dosyaları bölmek, testi olan bir hatayı düzeltmekten daha risklidir.»* Önce kapsam. |
| **XP'ye seri (streak) sayacı eklemek** | Tatile çıkanı cezalandırır; deponun dokuz aylık ufkuyla çelişir; insanı sisteme değil sayaca bağlar. |
| **XP'ye sıralama / rozet duvarı** | Tek kullanıcılı bir sistemde kiminle yarışılacak? |
| **«XP'n düşük» uyarısı** | §1.2/6'yı doğrudan kırar: XP karar vermez. |
| **Beşinci bir sistem eklemek** | Dördü de daha dolmadı. |
| **Çerçeve, paket, derleyici getirmek** | `AGENTS.md` §1.3 sözleşme. |
| **Üç uygulamayı tek kökene toplamak** | `sunucu.py` baş yorumu: veri «taşınmış» görünür ve üçü tek 5 MB kotayı paylaşır. Paylaşım **derleme zamanında** olur, çalışma zamanında değil. |
| **Ortak CSS'i çalışma zamanında `@import` ile paylaşmak** | Aynı gerekçe + ek ağ isteği + sıra riski. |
| **Denetim eşiklerini geçsin diye gevşetmek** | Ölçümü ölçüme uydurmak. Eşik değişecekse **gerekçesi yorumda** yazılır. |
| **Test sayısını artırmak için test yazmak** | 3 147 test var. Yeni test **yeni davranış** ya da **yakalanan bir hata** için yazılır. |

---

# BÖLÜM 6 — KARAR BEKLEYEN SORULAR

Bunları ajan karara bağlayamaz; depo sahibine ait.

### Soru 1 — Bu sistemi telefonda kullanacak mısın? — **CEVAPLANDI**

| Cevap | Sonuç |
|---|---|
| Evet, birincil | İP-4 **Seçenek A**, öncelik en üste çıkar |
| **Evet, ara sıra** ← *seçilen* | İP-4 **Seçenek B**, yarım günlük belge işi |
| Hayır | İP-4 **Seçenek C**, 390px denetimleri «dar pencere» olur |

Depo sahibi **Seçenek B**'yi seçti: telefon ikincil cihaz. Yerel ağ modu
(`--ag`) yazılmadı, `sunucu.py` bilerek `127.0.0.1`'de kaldı. Yol
README'nin «Telefonda kullanım» bölümünde komut düzeyinde yazılı ve
**iki cihazın iki ayrı defter** olduğu orada açıkça söyleniyor.

Soru 2 (kaç cihaz) bununla birlikte kapandı: iki cihaz, tek yönlü
taşıma, tek köprü yedek dosyası.

### Soru 2 — Kaç cihaz?

Tek cihazsa B5 bir cümlelik belge işi. İki cihazsa gerçek bir senkron
kararı gerekir ve Seçenek A onu kendiliğinden çözer.

### Soru 3 — Kademe rozetleri ve videoları ne zaman gelecek?

Kod bekliyor; eksik dosya hata vermiyor. Ama sistem o dosyalar gelene
kadar **yarım görünür** — kullanıcı kademe atladığında numara görür,
rozet değil.

### Soru 4 — Önceliği değiştirmek ister misin?

Sıralama **risk × maliyet** ile kuruldu, kutsal değil. İP-3 (ortak CSS)
en görünür kazancı verir ama İP-1 (CI) olmadan yapılması risklidir.

---

# BÖLÜM 7 — ÖNERİLEN SIRA VE ÖLÇÜT

| Tur | İş | Süre | Bitince ne değişir | Durum |
|---|---|---|---|---|
| **1** | İP-1 CI | yarım gün | Bir değişiklik bir şeyi bozarsa **birleştirmeden önce** görünür | ✅ |
| **2** | İP-2 loadcheck | yarım–bir gün | «Bugün hızlı» ile «yarın da hızlı» ayrı ölçülür | ✅ |
| **3** | İP-3 ortak CSS | bir gün | 4 365 satırlık tekrar tek kaynağa iner, ayrışması yakalanır | ✅ |
| **4** | İP-4 telefon | karara bağlı | «Hedefliyoruz ama yolu yok» hâli biter | ✅ Seçenek B |
| **5** | İP-5 seviye | 2–4 saat | Seviye sistemi tamamlanır | ◑ 5.2 ve 5.3 bitti; 5.1 dosya bekliyor |
| **6** | İP-6 labs kapsamı | bir gün+ | En büyük testsiz dosya korunmaya başlar | ⏳ açık |

**Sırada ne var.** Beş turun dördü kapandı. Kalan iki iş:

- **İP-5.1** — `brand/seviye/kademe-1..6.png` rozetleri ve
  `kademe-2..6.mp4` videoları. Ajan tarafında yapılacak bir şey yok;
  dosya gelince kendiliğinden devreye girer.
- **İP-6** — `SPI/src/js/screens/labs.js` (1 482 satır, testsiz). Kural
  aynı: **önce kapsam, sonra bölme.**

**Turların üçü de yeni özellik getirmiyor.** Getirdikleri şey şu: bugün
doğru olan şeylerin **yarın da doğru kalacağının güvencesi**.

---

# BÖLÜM 8 — KAPANIŞ

Bu deponun sorunu eksik disiplin değil; **var olan disiplinin bazı
yerlerde uygulanmaması**.

- On dört denetim aracı yazılmış, **ikisi** otomatik koşuyor.
- Beş yıllık yük denetimi gerçek bir 996 ms regresyonu yüzünden
  yazılmış, **bir** sistemde duruyor ve orada bile rutine girmemiş.
- Ortak CSS'in tek kaynaktan yayılması gerektiği `NOTLAR.md` §19'da
  yazılmış, mekanizması bu hafta kurulmuş ama **CSS'e uygulanmamış**.
- README telefonu vaat ediyor, çalıştırma bölümünde telefon yok.

Dördü de aynı biçimde: **doğru şey biliniyor, bir yerde durmuş.**

Bunu okuyan oturuma son söz: bu depoda yorumlar uzun ve bu kasıtlı.
Çoğu bir hatanın mezar taşı. Bir şeyi «sadeleştirmek» için sildiğinde,
sildiğin şey hatanın kendisi değil, onun bir daha olmamasını sağlayan
şey olabilir. Önce niçin orada olduğunu anla.
