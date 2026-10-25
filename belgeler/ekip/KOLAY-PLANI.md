# Kolay LifeOS planı — az giriş, az ekran, kapalı döngü

> 2026-10-16 · Depo sahibinin kararı: «Kullanımı kolay yaşamak için veri girişinin
> sürtünmesini çok azaltmak, ekrandaki karmaşıkları çok azaltmak; çok daha kolay ve çok
> daha pratik bir uygulama.» Aynı gün konuşulan büyük fikirler (Otopilot Gün, kapalı
> döngü, kişisel deney motoru, Gelecek simülatörü, görünmez giriş, hayat pusulası) bu
> planın içinde, kolaylığa hizmet eden sırayla durur.
>
> Bu dosya planın kendisi ve canlı durumudur (§8). Bir faz bitince durum satırı ve commit
> buraya yazılır; oturum yarıda kalırsa iş §9'dan sürer. Öncül: `IPHONE-PLANI.md`
> (sadelik sözleşmesi, `tools/sadelik.js`) — bu plan onun üstüne kurulur, onu bozmaz.

## 0. Tek cümlede

LifeOS'un başarı ölçüsü «ne kadar kullanıldı» değil, **«ne kadar az zaman aldı ve buna
rağmen ne kadar şey bildi»**dir. Her değişiklik iki pusula sayısına göre tartılır (§1);
günler plana göre varsayılır ve kullanıcı yalnız farkı söyler (§3, Ayak 2); ekran yalnız
o anki işi gösterir (§3, Ayak 1); sistem ölçer, öğrenir, önerir — karar kullanıcınındır.

## 1. Pusula — iki sayı ve yardımcı ölçüler

Sayılar **ölçülür, elle yazılmaz** (AGENTS §1.2, §2). Başlangıç değerleri Faz 0'da
ölçülüp §8'e yazılır; aşağıdaki hedefler kabul ölçütüdür.

| Ölçü | Tanım | Kaynak | Hedef |
|---|---|---|---|
| **P1 · Yönetim süresi** | Günde kayıt ve gezinmeye harcanan dakika (öğrenme ekranları hariç) | Var olan «Sürtünme» ölçümü (üç modülün Analiz ekranı), aynı tanıma getirilir | ≤ 2 dk/gün |
| **P2 · Veri doluluğu** | Son 14 günde «girildi» sayılan günlerin oranı (modül başına) | Defter; girilmeyen gün sıfır değil «veri yok» | ≥ %90 |
| Y1 · İyi gün kaydı | Plana uyan bir günü kaydetmek için dokunuş sayısı | Betikli senaryo (`tools/pusula.js`, Faz 0) | ≤ 3 dokunuş, ≤ 30 sn |
| Y2 · Bugün yoğunluğu | Bugün ekranında açık kart | `tools/sadelik.js` | ≤ 3 (basit görünüm) |
| Y3 · Menü öğesi | Kenar çubuğundaki çekmece sayısı | NAV | 4 (basit görünüm) |
| Y4 · İlk kayıt | Yeni kullanıcının ilk kaydına kadar adım | Betikli senaryo | ≤ 5 adım |
| Y5 · Bildirim yükü | Günde sorulan soru / cevaplanma oranı | Bildirim defteri (cihazda) | ≤ 4/gün, cevap ≥ %60 |

Pusula, haftalık değerlendirmede ve Ayarlar › Genel'de tek satırla görünür. Bir faz P1'i
artırıyorsa ya da P2'yi düşürüyorsa birleştirilmez; nedeni bulunur.

## 2. Kolaylık sözleşmesi

Bunlar tercih değil sözleşmedir; doktrinle (AGENTS §1) çelişen madde yoktur.

1. **Plan doğru varsayılır, kullanıcı farkı söyler.** Ön doldurulmuş değer, kullanıcı
   onaylayana kadar yazılmaz. «Hepsi doğru» kullanıcının beyanıdır; dokunulmayan gün
   «girilmedi» kalır, sıfır sayılmaz (§1.2). Sessiz kayıt yoktur.
2. **Önce öneri, sonra kayıt; ikinci soru yok.** Kayıttan sonra ekranda «Geri al» kalır;
   «Emin misin?» sorulmaz (küçük aksiyon, §1.9). Orta ve büyük aksiyonlar önizlenir.
3. **Hiçbir özellik silinmez.** Basit görünüm ve kendini sadeleştiren arayüz yalnız
   önden çeker; her şey Menü'den, aramadan (Ctrl+K) ve King'den bulunur. «Uzman
   görünüm» her şeyi bugünkü hâline döndürür. Güvenlikle ilgili olan (SPİ uyarıları,
   Onaylar, sınır satırı) asla gizlenmez.
4. **Tekrar eden tanınır, uydurulmaz.** «Dünkü gibi / her zamanki gibi» önerisi yalnız
   ölçülen kalıptan gelir (son 7 günün en az 4'ünde aynı kayıt). Kalıp yoksa öneri yok.
5. **Saat ve sayı uydurulmaz.** Saati olmayan iş «gün içinde» durur; tahmin «tahmin»
   etiketiyle ve aralıkla gelir (Gelecek simülatörü söz 6–7).
6. **Modül kendi kaydını yazar.** Sunucu ve Merkez hiçbir modüle yazmaz (§1.4); üç
   modülü birden kapatan ekran bile her satırı ilgili modülün kendi koduna verir.
7. **Sistem rahatsız etmez.** Günde en çok Y5 kadar soru, sessiz saatlere saygı;
   cevaplanma oranı düşerse sistem kendini kısar.
8. **Kural motoru karar verir, model cümle kurar** (§1.1). Model kapalıyken her faz çalışır.

## 3. Kapalı döngü — dört ayak

```
   PLAN ───────────► YAP ───────────► ÖLÇ ───────────► ÖĞREN
 (Otopilot Gün)   (tek dokunuş,     (pusula, Gelecek   (kişisel deney
  sabah tek onay)  günü kapat)       simülatörü)        motoru)
      ▲                                                     │
      └──────────────── AYARLA (haftalık değerlendirme) ◄───┘
```

Döngünün altında, her ayağı kolaylaştıran iki **kolaylık katmanı** vardır: basit görünüm
(ekran) ve görünmez giriş (veri).

| Ayak | Ne yapar | Kullanıcıya etkisi | Fazlar |
|---|---|---|---|
| **1 · Plan** | Üç modülün bugününü tek çizelgede dizer; çakışmayı kural çözer; sabah tek onay | Günü tek bakışta görür, tek kez onaylar | Tek gün (yapıldı), Faz 4 |
| **2 · Yap** | Plan doğru varsayılır; «Bitti», «Günü kapat», bildirim düğmesi, tek cümle | İyi gün 1–3 dokunuşla kaydolur | Faz 1, 3, 4 |
| **3 · Ölç** | Pusula sayıları; Gelecek simülatörü sınav gününe uzaklığı gösterir | Neyin işe yaradığını sayıyla görür | Faz 0, Gelecek (yapıldı) |
| **4 · Öğren** | Sırayla dağıtılmış küçük kişisel deneyler; sonuç simülatöre sürgü olur | «Bende işe yarayan» kanıtlı liste | Faz 5 |
| **Ayarla** | Haftalık 5 dakikalık değerlendirme; tek değişiklik seçilir | Plan kendini ona göre ayarlar | Faz 8 |
| Katman · Ekran | Basit görünüm; kendini sadeleştiren arayüz | Menü 4, Bugün ≤ 3 kart | Faz 2, 6 |
| Katman · Veri | Kısayollar (uyku, adım), konum, fotoğraftan öneri | Yazmadan gelen veri | Faz 7 |

## 4. Bugüne kadar yapılanlar (2026-10-16)

| Ne | Commit | Döngüdeki yeri |
|---|---|---|
| Tek satır «Ne yaptın?» kapısı, üç modülde | `ba7833b3` | Yap |
| Ekranda kısa yollar şeridi (+ klavye) | `c089d57e` | Ekran |
| Az sürtünme: Enter ile kayıt, tek kutu, sakin simgeler | `a853ee82` | Yap, Ekran |
| King sohbette kalır: «Afiyet olsun», sonda «ekleyeyim mi?» | `49577612` | Yap |
| Bir cümle birçok kayıt; tek satırdaki yanlış değer ve sessiz kayıp düzeldi | `c2c3ca3d` | Yap |
| Sade dil: iç terimler günlük Türkçeye (ölçülerek) | `de746ebd` | Ekran |
| ESP yeni kullanıcı: hedef dili, öneriler disipline göre | `ef0f7814` | Ekran |
| AYS sade: iç içelik azaldı (8→5, 7→3 sekme) | `2a989449` | Ekran |
| **Otopilot Gün 1 · Tek gün** (sunucu sözü 22) | `4cac9fb2` | Plan |
| **Gelecek simülatörü** (AYS Analiz › Gelecek) | `98f3e6be` | Ölç |
| Pusula (Faz 0) | `73f84e06` | Ölç |
| King küçük kutu: kapanmaz, ekranı bilir; öteki modülün verisini iletir (sunucu sözü 23) | (bu commit) | Yap |

## 5. Fazlar

Her faz tek başına işe yarar; biri yarıda kalsa öncekiler bozulmaz. Her fazın kabulü:
§1'deki ilgili ölçü + testler + duman testi; `brand/ortak/` ya da sunucuya dokunuyorsa
`node tools/entegre.js` (AGENTS §2). Yeni davranış testsiz gelmez.

Sıra kolaylık önceliğine göredir (depo sahibi 2026-10-16: «kullanım kolay, sürtünme ve
karmaşa çok az»). Daha önce seçilen «simülatör → deney motoru → görünmez giriş» sırası
korunur ama kolaylık fazlarının arkasına geçer; simülatör yapıldı.

### Faz 0 — Pusula (ölç, sonra değiştir)

- **Amaç:** P1, P2 ve Y1–Y4'ün başlangıç değerini ölçmek; her fazın etkisini görünür kılmak.
- **Kapsam:** `tools/pusula.js` (Playwright, dosyadan, portsuz — `sadelik.js` gibi):
  her modülde «plana uyan bir günü kaydet» senaryosunu sayar (dokunuş, süre), Bugün
  yoğunluğunu ve menü öğesini okur. Üç modülde P1 ve P2 aynı tanımla (`brand/ortak/pusula.js`):
  P1 var olan sürtünme ölçümünden, P2 defterden. Ayarlar › Genel'de tek satır.
- **Kabul:** başlangıç değerleri §8'de; araç `--denetle` ile hedefin gerisine düşen fazı
  kırmızı gösterir.
- **Seviye:** salt okuma; aksiyon yok.

### Faz 1 — Günü kapat (istisnayla giriş, modül içinde)

- **Amaç:** iyi bir günü 1–3 dokunuşla kaydetmek (Y1).
- **Kapsam:** her modülde akşam tek ekran (`brand/ortak/gunukapat.js` + modül kaynağı):
  - AYS: günün blokları (dakika, soru, doğru planla dolu), paragraf/problem sayacı, uyku.
  - SPİ: günün ölçümü (dünkü değer önerisi), su, hatırlatma işaretleri, öğünler
    («her zamanki kahvaltı» kalıptan).
  - ESP: plandaki disiplin oturumu, sırası gelen kart tekrarı.
  - Satıra dokununca yalnız o değer düzenlenir (− / + düğmeleri); «Hepsi doğru» tek dokunuş.
  - «Dünkü gibi / her zamanki gibi»: sözleşme 4 (son 7 günün ≥ 4'ü).
- **Kabul:** Y1 ≤ 3 dokunuş, ≤ 30 sn (Faz 0 betiği); dokunulmayan satır yazılmaz (test);
  geri al çalışır (test).
- **Seviye:** küçük (tek gün, tek kayıt), «Geri al».

### Faz 2 — Basit görünüm

- **Amaç:** ekran karmaşasını kökten azaltmak (Y2, Y3).
- **Kapsam:** üç modülde aynı düzen:
  - Çekmeceler **Bugün · Çalış · İlerleme · Menü**. Eşleme tablosu modül başına bu
    dosyada (§5 ek) tutulur; her eski çekmece Menü'de adıyla durur.
  - Bugün en çok üç kart: **Şimdi** (sıradaki tek iş), **Ne yaptın?** (kısa yollarıyla),
    **Gün** (Tek gün ya da günün durumu). Gerisi İlerleme'de.
  - Ayarlarda «Uzman görünüm»; yeni kullanıcı basit görünümle başlar, var olan kullanıcıya
    bir kez sorulur.
- **Kabul:** basit görünümde Y2 ≤ 3, Y3 = 4; uzman görünümde ekranlar bugünküyle aynı
  (duman + sadelik); hiçbir rota kaybolmaz (test: her eski rota Menü'den ya da aramadan açılır).
- **Seviye:** tercih (görünüm); küçük, geri alınır.

### Faz 3 — Telefonda tek dokunuş

- **Amaç:** uygulamayı açmadan kaydetmek (P1).
- **Kapsam:** bildirim düğmeleri AYS bloklarına ve ESP oturumlarına (SPİ'deki «Aldım /
  İçtim» kalıbı, `brand/ortak/bildirim.js`); akşam «Günü kapat» bildirimi; sonra kilit
  ekranı aracı (WidgetKit — yalnız Apple kitaplığı, telefon kabuğu istisnası içinde).
- **Kabul:** bildirimden «Bitti» modülün kendi koduyla yazılır (test); Y5 sınırı uygulanır;
  sessiz saat geçerli.
- **Seviye:** küçük; bildirimdeki düğme bir aksiyondur, kayıt modülde.

### Faz 4 — Otopilot Gün 2–3

- **Amaç:** plan tek, kayıt dokunuş.
- **Kapsam:** Tek gün çizelgesinde «Bitti / düzelt» (kendi modülünde doğrudan, öteki
  modülde gelen kutusu üzerinden — modül kendi koduyla yazar, sunucu sözü 16);
  sabah tek onay ve çakışma çözümü (var olan çakışma motoru, öneri kartı 112); günün
  kalanını yeniden dizme; üç modülü birlikte kapatan «Günü kapat».
- **Kabul:** sabah planı orta aksiyon (önizleme + tek onay); sunucu kapalıyken her modül
  kendi planıyla sürer (entegre); «Bitti» bağlantı gelince akar.
- **Seviye:** gün planı orta; tek iş küçük.

### Faz 5 — Kişisel deney motoru

- **Amaç:** «bende işe yarayan» kanıtlı liste; simülatöre ölçülmüş sürgüler.
- **Kapsam:** kod tarafından sırayla dağıtılan iki koşullu kısa deneyler (ör. sabah/akşam
  matematik; uyku ≥ 7,5 sa / < 6,5 sa günleri); modüller arası (SPİ uyku → AYS net, ESP
  odak). Sonuç etiketli: fark, gün sayısı, güven aralığı; «etki» yalnız kendi deneyinden,
  geri kalan bulgu «ilişki». SPİ teşhis ve doz alanına girmez (§1.5).
- **Kabul:** yetersiz veride sonuç yok (test); simülatör sürgüsü yalnız tamamlanan deneyle açılır.
- **Seviye:** deneyi başlatmak orta (iki hafta plan değişikliği).

### Faz 6 — Kendini sadeleştiren arayüz

- **Amaç:** karmaşanın zamanla kendiliğinden azalması.
- **Kapsam:** kullanım cihazda ölçülür (hangi ekran, ne sıklıkla; sunucuya gitmez); ayda
  bir öneri: «30 gündür açmadığın X'i menüden kaldırayım mı?»; sık kullanılan öne gelir.
- **Kabul:** öneri orta aksiyon (önizleme + tek onay, geri alınır); güvenlik ekranları
  listede yok (test).

### Faz 7 — Görünmez giriş ve hayat pusulası

- **Kapsam:** Kısayollar ile uyku/adım (gelen kutusu, onaya öneri); SPİ rota kaydından
  hareket süresi; fotoğraftan öğün ve optik okuma önerisi (model gerekir; her şey
  «tahmin» olarak önizlenir, onaysız yazılmaz). Hayat pusulası: tek hedef ağacı (hedef
  sıra → uyku/sağlık → ESP becerisi); çizelgedeki işin yanında «neden» satırı.
- **Kabul:** P2 yükselir, P1 artmaz; model kapalıyken yalnız fotoğraf kısmı kapanır.

### Faz 8 — Haftalık değerlendirme (döngüyü kapatmak)

- **Kapsam:** pazar 5 dakika: pusula, simülatör aralığı, deney sonuçları; kod en çok üç
  değişiklik önerir, kullanıcı birini seçer; plan ona göre güncellenir (orta aksiyon).
- **Kabul:** değerlendirme ≤ 5 dk (betik); seçilen değişiklik geri alınır.

### Ek — Basit görünüm çekmece eşlemesi (Faz 2'de doldurulur)

| Basit | AYS | SPİ | ESP |
|---|---|---|---|
| Bugün | Bugün | Bugün | Bugün |
| Çalış | Çalışma + Öğren | Çalışma (Testler, Öğün, Hareket…) | Çalışma (disiplinler) |
| İlerleme | Analiz (+ Gelecek) | Analiz | Analiz + Merdiven |
| Menü | Plan, Onaylar, Ofis, Kütüphane, Ayarlar | Plan, Onaylar, Ofis, Kütüphane, Ayarlar | Plan, Onaylar, Ofis, Kütüphane, Ayarlar |

## 6. Kabul özeti

| Faz | Birincil ölçü | Hedef |
|---|---|---|
| 0 | Başlangıç değerleri | §8'de yazılı |
| 1 | Y1 | ≤ 3 dokunuş, ≤ 30 sn |
| 2 | Y2, Y3 | ≤ 3 kart, 4 çekmece |
| 3 | P1 | bildirimden kayıt; Y5 ≤ 4/gün |
| 4 | P1, P2 | sabah tek onay; günü kapat üç modül |
| 5 | Kanıtlı bulgu | yetersiz veride sonuç yok |
| 6 | Y2 zamanla | öneriler orta, geri alınır |
| 7 | P2 | ≥ %90 |
| 8 | Değerlendirme süresi | ≤ 5 dk |

## 7. Riskler

- **Bildirim yorgunluğu.** En hızlı susturulan sistem fazla soran sistemdir: Y5 sınırı ve
  cevaplanma oranına göre kendini kısma (sözleşme 7).
- **Ön doldurma tembelliği.** «Hepsi doğru» kolaylığı yanlış beyanı da kolaylaştırır.
  Karşılık: satırlar planı değil son ölçümü ve kalıbı gösterir; deneme ve tahlil gibi
  ölçümler ön doldurulmaz.
- **Basit görünümde kaybolma.** Var olan kullanıcı alıştığı çekmeceyi bulamayabilir:
  geçişte bir kez sorulur, Menü'de eski adlar durur, arama her rotayı bulur.
- **Masaüstü tarayıcı kapalıyken bildirim yok.** Görünmezlik asıl telefonda çalışır.
- **P1 ölçümü yaklaşık.** Ekranda geçen süreyi ölçer, kafada geçeni değil; yön için yeter.
- **Modüller arası kayıt.** Öteki modülün kaydı yalnız gelen kutusu üzerinden ve o modül
  açıldığında yazılır; gecikme ekranda söylenir.

## 8. Durum (canlı)

| Faz | Durum | Commit | Not |
|---|---|---|---|
| Tek gün (Otopilot 1) | yapıldı | `4cac9fb2` | Bugün'de, öteki modülden iş gelince görünür |
| Gelecek simülatörü | yapıldı | `98f3e6be` | AYS Analiz › Gelecek; ufuk ≤ 3× ölçülen süre |
| 0 · Pusula | yapıldı | `73f84e06` | başlangıç değerleri aşağıda; uygulamada Ayarlar › Genel'de pusula satırı |
| 1 · Günü kapat | yapıldı | aşağıda | ortak çekirdek `brand/ortak/gunukapat.js`; Bugün'den açılan alt sayfa, üç modülde |
| 2 · Basit görünüm | bekliyor | — | |
| 3 · Telefonda tek dokunuş | bekliyor | — | |
| 4 · Otopilot 2–3 | bekliyor | — | |
| 5 · Deney motoru | bekliyor | — | |
| 6 · Kendini sadeleştiren arayüz | bekliyor | — | |
| 7 · Görünmez giriş, hayat pusulası | bekliyor | — | |
| 8 · Haftalık değerlendirme | bekliyor | — | |

### Faz 0 başlangıç değerleri (2026-10-16, `node tools/pusula.js`, boş profil, 1280 × 900)

| Modül | Y1 eylem | Yazılan karakter | Y2 Bugün kartı | Y3 menü | İyi gün senaryosu (doğrulandı) |
|---|---|---|---|---|---|
| AYS | **12** | 13 | 1 | **9** | Günü düzenle › 3 blok «Tamamlandı» + soru + doğru; «Öbür kayıtlar»ı aç; uyku |
| SPİ | **22** | 73 | 2 | **8** | 4 ölçüm alanı + Kaydet; 8 × bir bardak su; 3 öğün (Ne yaptın? + 2 Enter) |
| ESP | 3 | 15 | 1 | **8** | Ne yaptın? «45 dk ingilizce» + 2 Enter |

Hedef: Y1 ≤ 3, Y2 ≤ 3, Y3 ≤ 4. **Faz 1'in işi AYS 12 → ≤ 3 ve SPİ 22 → ≤ 3; Faz 2'nin işi
Y3 9/8/8 → 4.** Y2 bugün hedefte (sadelik kuralıyla sayılan açık bölüm), ama Bugün'ün gerçek
yoğunluğu kart başına değil öğe başına; Faz 2'de Y2 «Bugün'de görünen bağımsız iş» olarak
yeniden tanımlanıp ölçülecek. P1 ve P2 kullanıcının cihazında ölçülür (Ayarlar › Genel).

**Faz 0 bulguları (düzeltildi, testli):**
- ESP «45 dk ingilizce» anlaşılmıyordu; yalnız «ingilizce çalıştım» tanınıyordu. Dil adları
  takma ada eklendi (`ESP/src/js/core/parse.js`, `parse.test.js`).
- Pusula P1, kullanım kaydı olmayan günü «0 dk ölçüldü» sayıyordu (sürtünme ölçeri kaydı olan
  her günü ölçülmüş sayar). P1 artık yalnız kullanım kaydı olan günlerden (`pusula.test.js`).

**Faz 0 gözlemleri (Faz 1–2'nin girdisi):**
- AYS'de uyku «Günü düzenle › Öbür kayıtlar» kapalı kartının içinde: iyi bir günde her gün
  girilen bir değer en derin yerde.
- SPİ'de su sekiz ayrı dokunuş; «hedefe ulaştım» tek dokunuşu yok.
- SPİ'de üç öğün üç ayrı cümle; aynı öğünler her gün tekrar ediyorsa «her zamanki gibi» yok.

### Faz 1 ölçümü (2026-10-25, `node tools/pusula.js`, 1280 × 900)

| Modül | Y1 eylem | Karakter | Süre (tahmin) | En kısa yol | Faz 0 |
|---|---|---|---|---|---|
| AYS | **3** | 64 | 24 sn | Günü kapat › tek satır (blok adıyla soru/doğru + uyku) › Kaydet | 12 (sonra 9) |
| SPİ | **3** | 35 | 15 sn | Günü kapat › tek satır (uyku, nabız, HRV, kilo) › Kaydet; su hedefi ve «her zamanki» öğünler beyan | 22 |
| ESP | 3 | 15 | 9 sn | Ne yaptın? «45 dk ingilizce» (Günü kapat da 3 eylem, 9 sn) | 3 |

Süre tahmindir: eylem × 1,5 sn + karakter × 0,3 sn; gerçek süre P1, cihazda. SPİ senaryosu
alışkanlıklı kullanıcıdır (son 4 günde aynı üç öğün; kalıp = son 7 günün ≥ 4'ü); eski tek
cümle yolu 3 eylem ama 140 karakter, 47 sn. Eski yollar pusulada «öbür yol» olarak durur.

**Faz 1 kararları (depo sahibi, 2026-10-25):**
- Ölçüm satırları (kilo, nabız, HRV, uyku, soru/doğru, paragraf/problem) toplu onaylanmaz,
  önceden doldurulmaz; tek satıra yazılır ve modülün ayrıştırıcısıyla (`GIRIS`) okunur.
  Anlaşılmayan parça varsa hiçbir şey yazılmaz.
- «Hepsi doğru» yalnız beyanları yazar (plan bloğu/oturumu yapıldı, su hedefi, «her
  zamanki» öğün, vadesi gelen hatırlatma); işareti kaldırılan ya da önerisiz satır yazılmaz.
  Satır + beyanlar tek «Geri al»; yarıda hata olursa yazılan geri alınır.
- Plandan gelen dakika «tahmin» etiketlidir: AYS bloğunda `minCert:'estimated'` (Günü kapat,
  «Tamamlandı», kaydırma), sayaç ya da elle yazılan «ölçüldü»; HKM'ye `study_minutes`
  bir blok bile tahminse `estimated` gider. Çok blokta adsız toplam bloklara bölüştürülmez.

**İnceleme (2026-10-25, salt okur ajan, 10 bulgu, hepsi testli düzeltildi):** ölçüm satırı
yazılamazsa beyanlar da yazılmaz; çok parçalı satır, AYS ve ESP satır yazımı hepsi ya da hiçbiri;
çift gönderim iki kez yazmaz; geri almalardan biri bozulsa da ötekiler koşar; SPİ'de alt sayfa
yalnız bugün; satırdaki su, su hedefi beyanını atlatır; virgülsüz ölçüm satırı («uyku 7.5 nabız
56») bölünür; «her zamanki» kalıbı Günü kapat'ın kendi kayıtlarından beslenmez; tahmin dakika
HKM'ye, pano ve Kral kartlarına «ölçüldü» diye gitmez; AYS'de tahmin bloğa yazılan dakika
tahminin yerine geçer, üstüne eklenmez. Depo sahibinin kararıyla XP, rozet, müfredat ve AYS
«günde N saat çalışma» alışkanlığı yalnız ölçülmüş dakikayı sayar; ESP Kral «Toplam süre · 30
gün» tahmin içeriyorsa «tahmin» der.

**Faz 1 sınırları (açık):** AYS ve ESP'de Günü kapat yalnız bugün için; erişilebilirlik ve
düzen araçları alt sayfayı açmıyor (testlerle kapsanıyor); iOS bildirimindeki `eylem`
`bildirim.js temizle`de düşüyor (Faz 3'ün işi).

## 9. Devir notu — sıradaki oturum buradan başlar

- Faz 1 bitti (üç modülde Y1 = 3, ≤ 30 sn tahmin). Sıradaki iş **Faz 2 · Basit görünüm**:
  Y3 9/8/8 → ≤ 4. Senaryolar `tools/pusula.js` içinde; yeni yol senaryoya eklenir, eski yol
  silinmez (`SENARYO[mod]` birden çok yol tutar, en kısa doğrulanan sayılır).
- Önce okunacaklar: bu dosya, `AGENTS.md`, `IPHONE-PLANI.md` §2 (sadelik sözleşmesi),
  `brand/ortak/tekgun.js` (Faz 4'ün temeli), `AYS/src/js/core/gelecek.js` (Faz 5'in bağlanacağı yer).
- Denetim seti: üç modülde `runtests`, `smoke`, `layoutcheck`, `a11ycheck`; `tools/sadelik.js`;
  `tools/yazi.py --denetle`; `tools/ortak.py --denetle`; ortak dosya ya da sunucuya dokunulduysa
  `tools/entegre.js` ve `HKM` testleri.
- Kullanıcının veri dosyaları (`veri/`, `tools/veri_*.py`, `HKM/db/`, `.claude/`, `.gitignore`
  değişikliği) commit'e girmez. Rütbe ekranlarına dokunulmaz.
