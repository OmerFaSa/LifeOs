# iPhone planı — LifeOS'un tamamı sade, öz, modern

> 2026-10-02 · Kullanıcı kararı: «Sistemin tamamını iPhone vibe'ına çeviriyoruz. iPhone'da
> sadelik olur; ne kullanıyorsan karşında olur, biter. Ben ekstra bir şey istemiyorum.»
>
> Bu dosya planın kendisi ve canlı durumudur (§8). Bir faz bitince durum satırı ve commit
> buraya yazılır; oturum yarıda kalırsa iş buradan sürer.

## 1. Ölçülen başlangıç (dolu örnek profil, 1440 × 900)

Gezinti betiği 58 ekranda 434 başlıklı kart saydı (kapalı sekmeler dahil). **Araç ölçüsü**
(§5: görünen, en dıştaki, küçük/gizli olmayan; Rütbe hariç): **188 açık kart, 3'ü aşan 22
ekran** (AYS 74 / 8 · SPİ 55 / 8 · ESP 59 / 6). En kalabalıklar:

| Ekran | Açık kart | Sayfa boyu |
|---|---|---|
| AYS Analiz › Ayrıntı | 23 | 2 078 px |
| ESP Rütbe · SPİ Rütbe · AYS Rütbe | 22 · 22 · 21 | ~2 500 px |
| ESP Dil | 21 | 972 px (sekmeli) |
| AYS Ayarlar › Genel | 19 | 4 728 px |
| ESP Tarih · ESP Stüdyo · ESP Analiz | 18 · 18 · 18 | 1 495 · 3 668 · 2 509 px |
| SPİ Hareket | 17 | 1 433 px |
| ESP Okuma | 16 | 1 575 px |
| ESP Merdiven · ESP Yazı · ESP Ayarlar | 12 · 12 · 12 | — |
| SPİ Testler · SPİ Analiz · SPİ Ayarlar | 11 · 11 · 11 | — |
| SPİ Bütçe | 10 | 1 331 px |
| AYS Telafi | 9 | 1 438 px |
| AYS İlerleme | 8 | 2 738 px |
| AYS Hedefler | 5 | 3 010 px |

Ölçüm aracı: `node tools/sadelik.js` (§5). Sayılar elle yazılmaz.

## 2. iPhone sözleşmesi

1. **Bir ekran, bir iş.** Ekranın işi ne ise o karşında durur; gerisi bir dokunuş ötededir
   (widget bağı, «Tümü», ⓘ, sayfa sonundaki «N bölüm gizli · Göster»).
2. **Açık kart ≤ 3.** İşin kendisi + en çok iki küçük widget. Ara sıra açılanlar tek satırlık
   şerittir (küçük), başvuru/açıklama/tekrar kartları baştan gizlidir.
3. **Sayfa boyu ≤ 1 200 px** (1440 × 900). Telefonda en çok iki ekran boyu.
4. **Ekranda açıklama yok.** Açıklama başlığın yanındaki ⓘ'dedir; kart alt yazısı en çok
   altı kelime; doktrin, araştırma, kılavuz metni ekranda durmaz.
5. **Uzun liste kısa gelir.** İlk 3–5 satır (ya da «şimdi» etrafı) + «Tümü».
   Geçmiş, istenince açılır.
6. **Sayılar küçük dönen widget'ta.** Durum sayıları (`LIFEOS.VITRIN.donen`) kesinlik
   işaretiyle; eksik veri sayı değil cümle.
7. **Grafik ≤ 1** ve yalnız ekranın işi grafikse (Analiz); en çok 180 px.
8. **Gezinme sakin.** Kenarda tek düğmeli sistem seçici, ikincil çekmeceler «Daha fazla»da,
   alt bölümler bölümlü seçicide; «Ayrıntı» sayfaları menüde yok.
9. **Hiçbir işlev silinmez, kalabalık gizlenir.** Gizli kart verisiyle ve koduyla durur
   (envanter kayıp 0). Kalıcı silme yalnız bir hafta hiç açılmayan ve kullanıcının onayladığı
   şey için (`belgeler/ekip/envanter/kaldirilan.json`).

Doktrin aynen: kural motoru otorite, eksik veri sıfır değil, sıfır bağımlılık, Türkçe metin,
SPİ sınır satırı (sayfa sonu) kalır. **Rütbe ekranları olduğu gibi kalır** (kullanıcı kararı).

## 3. Ekran türleri ve kalıpları

| Tür | Ekranlar | Açık kalan (iş) | Widget | Şerit (küçük) | Gizli |
|---|---|---|---|---|---|
| Bugün | 3 × Bugün | kahraman / ölçüm / sıradaki iş + akış | 2 dönen | — | büyük durum kartları (Günü düzenle'de) |
| Plan | Hafta · Program · Hedefler · SPİ Hedefler · ESP Merdiven | bu hafta / sıradaki haftalar / hedef katmanı / bu kademe | 1 dönen | sözleşme, özet, matris, tercih | geçmiş, ısı haritası, referans tabloları |
| Liste | Deneme · Testler · Notlar · Kitaplar · Kütüphanem | listenin kendisi | 1 dönen | süzgeç | yan istatistik, başvuru |
| Giriş | Soru çöz · Öğün · Mutfak · Oturum · Tekrar · Sınama | form / oturum | — | son kayıtlar (5) | açıklama, katalog |
| Analiz | İlerleme · Analiz · SPİ Analiz · ESP Analiz · Telafi | kural seçtiği ≤ 3 grafik | 1 dönen | öbür grafikler | meta (doluluk, denetim, sürtünme) |
| Ofis | Masalar · Danışma · Toplantı (3 ×) | günün brifingi + tek eylem | — | masalar, gündem | açıklama, geçmiş |
| Ayarlar | Genel · Profil (3 ×) | — (iOS Ayarlar listesi) | — | **her bölüm bir satır** | kılavuz, doktrin |
| Rütbe | 3 × Rütbe | aynen | — | — | — |

## 4. Araçlar

Var olan (bu oturumda kuruldu): dönen widget (`vitrin.js donen`), `SADE_GIZLI` (her
`app.js`), `kucukVarsayilan` (ekran nesnesi), ⓘ bilgi kartı (`kabuk.sayfaBasi`), «N bölüm
gizli · Göster», `App.UST` (menüde olmayan alt ekran).

Eklenecek: §5 ölçüleri; uzun liste kısaltıcı kalıbı (ilk N + «Tümü», ekran başına).

## 5. Ölçüm

`tools/envanter.js` her ekranda **açık kart** sayısını (görünen, küçük ve gizli olmayan bölüm)
ölçer; `tools/sadelik.js` iki yeni kural taşır:

- `acikKart` en çok 3 (Rütbe hariç)
- `boyHepsi` en çok 1 200 px (Rütbe hariç)

Önce **ölçüm** (kırmızı yapmaz); bir çekmecenin bütün ekranları bütçeye girince o çekmece için
zorunlu olur, Faz 7'de hepsi zorunlu.

## 6. Fazlar

| Faz | Kapsam | Hedef |
|---|---|---|
| 0 | Plan + ölçü (`acikKart`, `boyHepsi`) | başlangıç sayıları araçla |
| 1 | **Plan çekmecesi**: AYS Hafta · Program · Hedefler, SPİ Hedefler, ESP Merdiven | açık ≤ 3, boy ≤ 1 200 |
| 2 | **Çalışma**: AYS Konu çalış · Ders notları · Soru çöz · Deneme · Tekrar · Sınama; SPİ Testler · Öğün · Mutfak · Hareket · Bütçe; ESP Dil · Felsefe · Tarih · Ses · Okuma · Yazı | açık ≤ 3 |
| 3 | **Analiz**: AYS İlerleme · Analiz · Telafi; SPİ Analiz; ESP Analiz | ≤ 3 grafik, gerisi şerit |
| 4 | **Onaylar · Ofis · Kütüphanem** (3 ×) | brifing + tek eylem |
| 5 | **Ayarlar** (Genel, Profil; 3 ×) | iOS Ayarlar listesi |
| 6 | **Kabuk ve Merkez**: sayfa sonu, «nasıl okunur» şeridi, HKM yüzü | aynı dil |
| 7 | Kurallar zorunlu, telefon (390 px) turu, belgeler | bütçe kırmızıya bağlı |

Her faz sonunda: üç modülde `runtests` · `smoke` · `layoutcheck` · `a11ycheck` ·
`palettecheck`, depo kökünde `sadelik` · `envanter`, `build.py --denetle`, `ortak.py
--denetle`; sonra commit ve §8'e satır.

### Faz 1 kararları (ayrıntı)

- **AYS Hafta:** açık yalnız hafta (gezinme + yedi gün şeridi). Sözleşme imzalıysa şerit, imza
  bekliyorsa açık; «Haftanın özeti» şerit. Plan tamamlama geçmişi, sınava kadar, plan
  ızgarası, planın şekli, müfredat referansı gizli.
- **AYS Program:** dört istatistik → dönen widget (ilerleme, sınava kalan, planlanan soru).
  Isı haritası ve «Program» notu gizli. Zaman çizgisi **bu hafta + sonraki üç hafta**;
  «Tüm program · 40 hafta» ile açılır.
- **AYS Hedefler:** dönen widget (ana hedef, tahmini sıra, hedefe kalan). Açık yalnız hedef
  katmanları. Net matrisi, 24 tercih, OBP şerit. Tahmini sıra kartı, sıra referansları,
  yerleşen profilleri gizli. Kesinlik açıklama satırı ve medyan tekrarı kalkar.
- **ESP Merdiven:** açık yalnız bulunduğun kademe; öbür kademeler ve açıklamalar şerit/gizli.

Faz 1'de yapılan (testler: `AYS/src/tests/iphone.test.js`, `ESP/src/tests/iphone.test.js`):

- AYS Hafta: açık yalnız hafta şeridi + imza bekleyen sözleşme (imzalanınca o da şerit;
  `kucukVarsayilan` artık hesaplanır). Ders dengesi ve revizyon kaydı da gizli. Sözleşme
  kartındaki iki açıklama cümlesi ⓘ'de zaten vardı, ekrandan kalktı.
- AYS Program: dönen «Program» kartı; «Sıradaki haftalar» (bu hafta + 3) ve «Tüm program ·
  40 hafta» düğmesi (`program-tumu`). Varsayılan sınav tarihi TAHMİN etiketiyle. Sayfa başı
  «Bu haftayı aç» kalktı (bölümlü seçicide Hafta var).
- AYS Hedef: dönen «Hedef» kartı (ana hedef, tahmini sıra, hedefe kalan; az denemede cümle).
  Kesinlik satırı, medyan tekrarı ve katman tablosunun açıklama paragrafı kalktı.
- ESP Merdiven: dört açıklama paragrafı ekrandan kalktı (aynı öğreti `data/hints.js`'te,
  ⓘ'de); ölçülemeyen kapılar ve kör noktalar şerit; Yol'da yalnız şimdiki kademe açık.
- Ortak (`brand/ortak/kart.css`): katmanlı bölümde seçili sekmenin adını ikinci kez yazan
  başlık gözden kalktı (ekran okuyucuya kalır) — üç modülde.
- SPİ Hedefler zaten tek kart (ölçü bütçede); dokunulmadı.

Faz 1'de görülen, sonraki fazlara kalan:

- Hafta 1 253 px (imza bekleyen sözleşme açıkken). Sayfa sonundaki «Bu ekran nasıl okunur»
  şeridi (~56 px) ⓘ'ye taşınınca bütçeye girer — Faz 6'nın ilk işi, öne alındı.
- ESP'de sayfa başlığı ekranın cümlesi («Merdiven henüz başlamadı.»); iPhone'da başlık addır,
  cümle ⓘ ya da widget'tadır — Faz 6.
- Dolu profilde ilk açılışta üç rozet bildirimi üst üste çıkıyor — Faz 6.

## 7. Bilinen riskler

- Testler kartları ekranda arar: gizlemek uygulama düzeyindedir (`Gizle.uygula`), çizimi
  değiştirmez; kart taşıyan testler etkilenmez. Çizimden çıkan tekrarlar için test güncellenir.
- Raf düzeni gizlemeden sonra yeniden ölçülür (2026-10-02 düzeltmesi); yeni şerit kesikte kalmaz.

## 8. Durum (canlı)

| Faz | Durum | Commit | Açık kart (toplam) |
|---|---|---|---|
| — | başlangıç (araç) | c689817 | 188 · aşan 22 ekran |
| 0 | ✅ ölçü: `acikKart`, `boyHepsi` (ölçüm), envanter.test 13 durum | (bu commit) | 188 · aşan 22 |
| 1 | ✅ AYS Hafta · Program · Hedef, ESP Merdiven (SPİ Hedefler zaten bütçede) | (bu commit) | 180 · aşan 21 |
