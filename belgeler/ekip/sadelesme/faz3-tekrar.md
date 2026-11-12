# Faz 3 · Tekrar motoru (FSRS)

## Özet
Dokuz ayrı tekrar zamanlayıcısının yerine tek motor: `motor/tekrar.js` (287 satır, sıfır bağımlılık, tarayıcıda
`LIFEOS.Motor.Tekrar`, Node'da `require`). Zamanlama FSRS-4.5, yayımlanmış varsayılan 17 ağırlıkla. Test:
`node motor/tekrar.test.js`, 21/21 yeşil (13 Kasım 2026).

- **Saf.** Motor saati kendisi okumaz; `simdi` dışarıdan verilir. Aynı girdi aynı çıktı, girdi kart değişmez.
- **Taslak tekrara girmez.** İçeriği onaylanmamış kart planlanmaz ve cevaplanmaz; nedeni döner (karar 13).
- **Gösterilen sayı etiketlidir.** Hatırlama olasılığı `tahmin`, hiç sorulmamış kartta `veri yok`.
- **Göç vadeyi değiştirmez.** Her eski kaydın bir sonraki tekrar günü aynen taşınır; ilk gün tekrar yığılması olmaz.
- **Bağlı değil.** Hiçbir ekran bu motoru henüz çağırmıyor; eski dokuz zamanlayıcıya dokunulmadı. Bağlama işi
  kabuk ve alan taşıma fazlarının işidir.

> Yazım notu: kod, testler, «Formüller» ve «Arayüz» bölümleri ilk koşuda yazıldı; koşu hesap limitiyle kesildi.
> «Özet», «Göç bağdaştırıcıları», «Testler» ve «Açık sorular» bölümlerini eşgüdümcü 13 Kasım'da koddan
> (`motor/tekrar.js` `GOC`, `EKSIK`) ve test çıktısından tamamladı; koda dokunulmadı.

## Formüller ve parametreler
Kaynak: FSRS-4.5, `open-spaced-repetition/awesome-fsrs` wiki «The Algorithm» (2026-11-13'te okundu; eski adres `fsrs4anki/wiki/The-Algorithm` oraya yönleniyor). 4.5 bölümü yalnız unutma eğrisini değiştirir; güncelleme formülleri FSRS v4 bölümünden.

| Ad | Formül |
|---|---|
| Hatırlama | `R(t,S) = (1 + FACTOR·t/S)^DECAY`, `DECAY = −0,5`, `FACTOR = 19/81` |
| Aralık | `I(r,S) = S/FACTOR · (r^(1/DECAY) − 1)`; `r = 0,9` iken `I = S` |
| İlk S | `S0(G) = w[G−1]` |
| İlk D | `D0(G) = w4 − (G−3)·w5` |
| D güncelleme | `D' = w7·D0(3) + (1−w7)·(D − w6·(G−3))` |
| Doğru sonrası S | `S·(e^w8·(11−D)·S^−w9·(e^(w10·(1−R))−1)·w15[Zor]·w16[Kolay] + 1)` |
| Unutma sonrası S | `w11·D^−w12·((S+1)^w13 − 1)·e^(w14·(1−R))` |

Varsayılan 17 ağırlık (wiki'nin 4.5 bölümünden, birebir):
`0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755`

**Doğrulanmadı (wiki'de yok, yaygın uygulamalardan aldım):**
- D'nin `[1, 10]` aralığında tutulması (wiki yalnız v2 bölümünde söylüyor; py-fsrs aynısını yapar).
- Unutma sonrası S'nin eski S'yi geçmemesi (`min(S'f, S)`). Varsayılan ağırlıklarla küçük S ve çok geç kalınmış kartta `S'f > S` çıkabiliyor (S=1, R=0,3 → 1,42); unutmanın kararlılığı artırması anlamsız olduğu için kısıtladım.
- S güncellemesinde eski D kullanılır, D sonra güncellenir (py-fsrs ve optimizer böyle; wiki sırayı söylemiyor).
- Zor < İyi < Kolay kesin sırası: `Zor = min(Zor, İyi)`, `İyi = max(İyi, Zor+1)`, `Kolay = max(Kolay, İyi+1)` (py-fsrs'teki düzeltme). Küçük S'de yuvarlama düğmeleri eşitlemesin diye.

**Motorun kendi seçimleri:**
- Aralık gün birimiyle yuvarlanır, en az 1 gün, en çok `enUzun` (varsayılan 36500).
- «Yine» aralığı 0 gün: kart aynı oturumda yeniden sorulur (ESP bugün de böyle yapar). Dakika düzeyi öğrenme adımları yok.
- Bulanıklaştırma (fuzz) yok: aynı girdi aynı çıktı.
- Hedef hatırlama varsayılan 0,9; `ayar.hedef` ile değişir.
- Unutma sayısı yalnız öğrenilmiş (`durum:'tekrar'`) kart «Yine» alınca artar (Anki'nin «lapse» tanımı).

## Arayüz
`LIFEOS.Motor.Tekrar` (tarayıcı) ya da `require('motor/tekrar.js')` (Node). Hepsi saf; saat okunmaz, `simdi` (ms) verilmezse `TypeError`.

| Çağrı | Döner |
|---|---|
| `yeniKart(id, ek?)` | `{id, zorluk:null, kararlilik:null, son:null, sonraki:null, tekrar:0, unutma:0, durum:'yeni', ...ek}` |
| `cevapla(kart, not 1-4, simdi, ayar?)` | `{ok:true, kart, gun}` ya da `{ok:false, neden}` (taslak, geçersiz not). Girdi kart değişmez. |
| `hatirlama(kart, simdi, ayar?)` | `{deger, etiket:'tahmin'}`; hiç sorulmamış kartta `{deger:null, etiket:'veri yok'}` |
| `plan(kartlar, simdi, ayar?)` | `{tekrar[], yeni[], bekleyen:{tekrar, yeni}, disarida:[{id, neden}]}` |
| `GOC.<bağdaştırıcı>(...)` | eski kayıttan FSRS kartı (aşağıda) |
| `EKSIK.<bağdaştırıcı>` | o bağdaştırıcının taşıyamadıkları |
| `gunMs('YYYY-AA-GG')` | o günün UTC gece yarısı (ms); göçte saat dilimine bağlı olmasın diye |

**Kart alanları:** `zorluk` (D, 1-10), `kararlilik` (S, gün), `son` (son cevap, ms), `sonraki` (vade, ms; `null` = hemen sorulabilir), `tekrar`, `unutma`, `durum` (`yeni` / `tekrar` / `yeniden`), isteğe bağlı `icerik` (içerik hattının `durum`u: `taslak` / `onayli`), `kapandi`, `goc` (hangi bağdaştırıcıdan geldiği), `kaynak`, `on`, `arka`, `deste`.

**ayar:** `hedef` (0,9), `enUzun` (36500 gün), `yeniTavan` (20), `tekrarTavan` (200), `yapilan` ({yeni, tekrar}: bugün yapılan, tavandan düşülür), `gunSonu` (ms: bu andan önce vadesi gelen bugüne sayılır; yerel gün sınırını kabuk hesaplar).

**Plan sırası:** tekrarlar `(simdi − sonraki) / S` büyükten küçüğe (aynı gecikme zayıf kartta daha çok unutturur); S'si bilinmeyen kart en önde; eşitlikte kimlik. Yeni kartlar verildiği sırada kalır, çünkü sırayı Yol motoru bilir.

**Taslak kuralı:** `icerik` alanı varsa ve `'onayli'` değilse kart `plan`da `disarida`ya «içerik onaylı değil (taslak): taslak tekrara girmez» nedeniyle düşer, `cevapla` `{ok:false, neden}` döner. `icerik` alanı olmayan kart kişinin kendi yazdığı karttır (AYS, ESP kartları) ve planlanır. `alan/SEMA.md`'deki `durum: taslak | onayli` ile aynı değerler.

**Kapanan kart:** `kapandi` olan kart (ogret'in «3 doğruda kapanır»ı, king-devrim `bitti`) planlanmaz; «Yine» alırsa yeniden açılır (ogret.js bugün de böyle yapar).

## Göç bağdaştırıcıları
Ortak kural (`gocKart`): vade aynen kopyalanır. Kararlılık, son cevaptan vadeye kalan aralık hedef oranda
FSRS aralığına eşit olacak biçimde seçilir: `S = gün · FACTOR / (hedef^(1/DECAY) − 1)` (hedef 0,9 iken `S = gün`).
Zorluk eski kayıttan çıkarılamaz, hepsinde varsayılan `D0(3)` ve `tahmin`dir. Vadesi okunamayan kayıt için
bağdaştırıcı `null` döner: uydurulmaz, ham kayıt göç yedeğinde kalır. Her kart `goc` alanında hangi
bağdaştırıcıdan geldiğini taşır.

| # | Bağdaştırıcı | Eski kaynak | Vade | Son cevap | Sayılar |
|---|---|---|---|---|---|
| 1 | `GOC.aysKart` | `AYS/src/js/core/state.js` kart (`dueAt`, `lastReviewedAt`, `history`) | `dueAt` | `lastReviewedAt` | tekrar = geçmiş uzunluğu (en az 1), unutma = `forgot` sayısı |
| 2 | `GOC.aysYanlis` | AYS yanlış defterinden doğan kart (`source: 'error'`) | 1 ile aynı | 1 ile aynı | 1 ile aynı; yanlış kaydına bağ `ays:errors/<id>` |
| 3 | `GOC.aysKapanis` | AYS konu kapanış ölçümü (`topics[...].first/second`) | ilk ölçüm + 7 gün (`CLOSURE_RULE.gapDays`) | ilk ölçüm günü | ikinci ölçüm yapılmışsa kart kapanır |
| 4 | `GOC.aysHedefTekrar` | AYS hedef planı `haftalar[].tekrar`, yalnız aktif plan | haftanın ilk günü | yok | durum `yeni` |
| 5 | `GOC.espKart` | `ESP/src/js/core/srs.js` kartı (`due`, `interval`, `reps`, `lapses`) | `due` | `due − interval` | `reps`, `lapses` aynen; aralık 0 ise `S = S0(Yine)` |
| 6 | `GOC.ogret` | `brand/ortak/ogret.js` kaydı (`n`, `sonraki` ya da `bitti`, `y`) | `sonraki` | `sonraki − ARALIK[n]` (1, 3, 7) | tekrar = `n + y` (en az 1), unutma = `y`; `bitti` kapanır |
| 7 | `GOC.kingDers` | `brand/ortak/king-devrim.js` ders tekrarı | `sonraki` | `sonraki − KD_ARALIK[n]` | içerik `taslak`: onaylanana dek tekrara girmez |
| 8 | `GOC.usta` | `brand/ortak/usta.js` ustalık kanıtı | saklanmaz; çağıran `LIFEOS.USTA.asama(...).sonraki` verir | son doğru kanıt günü | tekrar = kanıt sayısı, unutma = isabetsiz kanıt |
| 9a | `GOC.kavrat` | `<modül>.kavrat.kanit` deposu | 8 ile aynı, kart başına | 8 ile aynı | 8 ile aynı |
| 9b | `GOC.ogrenmotor` | `brand/ortak/ogrenmotor.js` `kayit.k` | 8 ile aynı, konu başına | 8 ile aynı | 8 ile aynı |
| yetim | `GOC.meydan` | HKM `meydan_deste` tablosu (kodu silinmiş deste) | `vade` anı aynen | bilinmiyor; kalan aralık göç anından ölçülür | `tekrar` aynen; silinmiş satır alınmaz |

**Taşınamayanlar** (`EKSIK` tablosu; ekranda «göçten tahmin» etiketinin dayanağı):

| Bağdaştırıcı | Taşınamayan |
|---|---|
| hepsi | zorluk (D): varsayılan `D0(3)`, tahmin |
| `aysKart` | geçmiş 40 cevapla kırpılmış, öncesi göremedim; konu riski sırası (`prioritizedDue`) motorda yok |
| `aysYanlis` | kök neden, ilke ve tarif yanlış kaydında kalır |
| `aysKapanis` | ölçüm yüzdeleri ve 75/70 eşikleri ölçüm kaydında kalır; unutma: göremedim |
| `aysHedefTekrar` | 30 dakikalık blok süresi; geçmiş haftanın bloğu yapıldı mı: göremedim |
| `espKart` | ease (1,3–2,8) eşlenmedi; kutu (box) taşınmaz; geçmiş 50 cevapla kırpılmış |
| `ogret` | toplam cevap sayısı: göremedim; birleştirilmiş kayıtta son cevap günü yaklaşık |
| `kingDers` | unutma sayısı ve kapanış günü: göremedim |
| `usta`, `kavrat`, `ogrenmotor` | güven, karışık ve ipucu ayrıntısı S'ye girmez; «emin olup yanıldın» önceliği motorda yok; kavrat 30 kanıtla kırpılmış |
| `meydan` | son cevap zamanı, unutma, `adim` anlamı, `son_puan` anlamı, vadenin saat dilimi: göremedim |

## Testler
`node motor/tekrar.test.js` → 21/21 (Node 24). Test, eski kuralları kopyalamak yerine gerçek kaynak dosyaları
yükler (`brand/ortak/tarih.js`, `usta.js`, `ogret.js`, `ESP/src/js/core/srs.js`) ve göç sabitlerini kaynaktan
okuyup karşılaştırır; eski kod değişirse test kızarır.

| Grup | Test | Kanıtladığı |
|---|---|---|
| Zamanlama | aralık sırası | Yine < Zor < İyi < Kolay; yeni, taze, olgun ve unutulmuş kartta, üç hedef oranda |
| | vadede hatırlama | vade günündeki tahmin hedef orana ±0,01 eşit, her adımda |
| | büyüme | İyi cevaplarla kararlılık ve aralık artar |
| | unutma | Yine S'yi düşürür, D'yi artırır, unutma +1, kart aynı oturumda yeniden sorulur |
| Saflık | belirlenimci | aynı girdi aynı çıktı; girdi kart değişmez |
| | saat | `Date.now` ve argümansız `new Date` kapalıyken çalışır; `simdi` yoksa `TypeError` |
| Etiket | hatırlama | değer `tahmin` etiketli; sorulmamış kartta `veri yok` |
| Plan | günlük plan | gecikme/S sırası, yeni kart sırası, tavanlar, bugün yapılan, gün sonu |
| Taslak | taslak içerik | planlanmaz ve cevaplanmaz; onaylı içerik ve kişinin kendi kartı girer |
| Göç | 1–8, 9a, 9b, yetim | on bir bağdaştırıcının her biri vadeyi aynen taşır; sayılar ve kapanma kuralı korunur |
| | taşınamayanlar | her bağdaştırıcının `EKSIK` listesi yazılı |

Koşulmayanlar: tarayıcıda yükleme denenmedi (yalnız Node); gerçek kullanıcı verisiyle göç denenmedi (motor
göç koşucusuna henüz bağlı değil).

## Açık sorular
1. **Günlük tavan.** Varsayılan 20 yeni ve 200 tekrar (Anki'nin varsayılanı). Bu sayılar uygun mu?
2. **Hedef hatırlama.** 0,9 tek değer. Alan bazında (örneğin sınav yaklaşınca Akademik'te daha yüksek) ayarlanabilsin mi?
3. **Kişiye göre ağırlık.** Şimdilik herkes için aynı 17 ağırlık. Yeterli cevap geçmişi birikince kişiye göre
   eniyileme eklensin mi? Eklenirse ağırlıkları yine kod hesaplar, model değil.
4. **King dersleri taslak sayıldı.** Mevcut King derslerinin soruları model yazımı olduğu için onaylanana dek
   tekrara girmiyor. Toplu onay ekranı mı olsun, yoksa hepsi onaylı sayılarak mı taşınsın?
5. **Alanın sıralama kancası.** AYS bugün tekrarları konu riskine göre sıralıyor (`prioritizedDue`). Motor yalnız
   gecikme/kararlılık sırası veriyor; alan kendi önceliğini ekleyebilsin mi?
6. **«Yine» adımı.** Yanlış cevaplanan kart aynı oturumda yeniden sorulur; dakika düzeyinde öğrenme adımları yok. Yeterli mi?
7. **HKM meydan destesi.** Kodu silinmiş, verisi tabloda duruyor. Tek motora taşınsın mı, arşive mi alınsın?
8. **Doğrulanmayan dört kural** («Formüller» bölümünde): FSRS wiki'sinde yazmıyor, yaygın uygulamalardan alındı.
   Ağırlıklar wiki'den birebir; bu dört kuralı bağımsız bir kaynaktan doğrulamak iyi olur.
