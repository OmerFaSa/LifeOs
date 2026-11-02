# 071 · ESP öğretme motoru adaptörü: kelime sorusu, teşhis, 1/3/7 tekrar, King araçları (KING-4 §D)

**Durum:** bekliyor
**Dal:** `ag/071-esp-ogret`
**Efor:** orta
**Kabul testi:** `tools/ogret_esp_kabul_test.py`

## Amaç
KING-4 §D: üç modülün öğretme parçaları **tek öğretme motoru** olur (`brand/ortak/ogret.js`, `window.LIFEOS.OGRET`; Claude yazdı, oku, değiştirme). ESP'nin King kelime sorusu bugün `ESP/src/js/app.js` içinde satır içi (kendi çeldiricisi `sort(() => Math.random() - 0.5)`, cevabı hiçbir yere yazılmıyor). Bu görev onu `ESP.KingOgret`'e taşır ve motora bağlar: yanlış cevap motorun 1/3/7 takvimine girer, teşhis kartın kendi SRS verisinden çıkar, «bugünkü tekrarlarım» ve «neden yanlış yaptım» araçları çalışır.

**Kartın kendi SRS takvimi (`core/srs.js`: box, ease, due) değişmez** — King sorusu SRS cevabı değildir; motorun takvimi ayrı anahtardadır (`esp.ogret.tekrar`). AGENTS §1: soru ve doğru cevap kartın kendisinden; teşhis yalnız kartın verisinden.

## Motor (oku: `brand/ortak/ogret.js`, kopyası `ESP/src/js/core/ogret.js`)
`const O = window.LIFEOS.OGRET` — çağrı anında oku.
- `O.bul(liste, metin, x => [ad, …])`, `O.secenek(dogruMetin, havuz)` → `{ sec, dogru }` ya da null.
- `O.depo(anahtar)`, `O.vade(depo, bugunISO)`.
- `O.cevap({ tekrar, son, bugun }, g)` → `{ isabet, not, teshis, satirlar }`; `g` ayrıca `yeni`, `yeniNeden`, `oncekiDogru`, `oncekiNeden` alır.
- `O.araclar({ modul:'esp', tekrar, son, ad, bugun })`.

## Dokunulacak dosyalar
- `ESP/src/js/core/kingogret.js` — yer tutucu; `ESP.KingOgret` doldur (sayfaya ve test sayfasına bağlı):
  - `soru(konu)` → `{ id:'<kart id>|<doğru harf>', konu:'Kelime kartı', soru:'«<front>» ne demek?', sec(4), kaynak:'ESP · senin dil kartların', not }` ya da null. Adaylar: `ESP.S.cards` içinde `front` ve `back` dolu kartlar (< 4 ise null). Konu `O.bul(adaylar, konu, c => [c.front, c.back])` ile bir karta uyarsa o kart; uymazsa konu yok sayılır (bugünkü davranış). Konusuz: önce `O.vade(depo('esp.ogret.tekrar'), bugün)`'ün ilk geçerli kartı, not `'Tekrar (' + (n+1) + '. tur): aynı kart.'`; yoksa takvimde olmayan kartlardan rastgele (hepsi takvimdeyse bütün adaylardan), not `''`. Seçenekler `O.secenek(c.back, öteki arka yüzler)`; sorulan sorunun seçenekleri bellekte (`id → sec`).
  - `cevapla(id, harf)` → `{ dogru, cozum, not }`; `dogru` = kimliğin son harfi (bugünkü gibi). Kart yoksa `{ dogru, cozum:[], not:'' }`. Kart varsa `O.cevap({ tekrar:depo('esp.ogret.tekrar'), son:depo('esp.ogret.son'), bugun:() => ESP.U.todayISO() }, { id, kavram:kart.id, konu:kart.front, soru, secilen, dogru, secMetin, dogruMetin:kart.back, cozum:[…], yeni:!kart.reps, yeniNeden:'kart henüz hiç tekrar edilmedi', oncekiDogru:(kart.box || 1) >= 3, oncekiNeden:'kart tekrar kutusunda «Yerleşti»ye kadar çıkmıştı' })` (kutu adı `ESP.SRS` varsa ondan). `cozum = satirlar.concat(['«' + front + '» = ' + back])`. `not`: motorun notu varsa o + `' Kartın kendi tekrar takvimi değişmez.'`; yoksa `'Bu cevap kartın tekrar takvimine yazılmaz.'`. Kart nesnesi değiştirilmez.
  - `araclar()` → `O.araclar({ modul:'esp', … ad:id => kartın front'u })`.
- `ESP/src/js/app.js` — `kartlar.soru` ve `kartlar.cevapla` satır içi kodu silinir; yerine `soru:konu => ESP.KingOgret.soru(konu)`, `cevapla:(id, harf) => ESP.KingOgret.cevapla(id, harf)`. Başka satıra dokunma.
- `ESP/src/js/core/kingarac.js` — `liste()` dönüşüne `ESP.KingOgret.araclar()` (yoksa boş dizi).
- `ESP/src/tests/kingogret.test.js` — yer tutucu; kenarlar: 4'ten az kart null, seçenekler farklı, yanlış → takvim, kart nesnesi değişmez, üçüncü tekrar doğrusu `bitti`.

## Dokunma
- `brand/`, `ESP/src/js/core/ogret.js` (üretilmiş kopya), `core/srs.js`, `core/lesson.js`, `index.html` dosyaları, `screens/`, `state.js`, `store.js`, `data/`, `HKM/`, dist ve build.js, kabul testi dosyası.
- Kendi 1/3/7 takvimini, çeldiricisini ya da eşleştiricisini yazma: motorunkini çağır.
- Kartın SRS alanlarını (box, ease, due, reps, lapses) yazmak.

## Kabul ölçütü
- Kabul testinin altı bölümü: soru biçimi ve az kart; konu eşleşmesi; yanlışta takvim, teşhis (reps 0 → bilmiyor, box ≥ 3 → dikkat), son yanlış, kart değişmez, bilinmeyen kart; vadesi gelen kart önce; araçlar; `app.js` bağlantısı ve satır içi kopyanın kalkması.
- ESP takımı yeşil; `node tools/king_kapsam.js --modul=esp --port=<senin portun>` yeşil.

## Koşulacak testler
- `python tools/ogret_esp_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd ESP && node tools/runtests.js <senin portun>`
- `node tools/king_kapsam.js --modul=esp --port=<senin portun>`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). -->
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
