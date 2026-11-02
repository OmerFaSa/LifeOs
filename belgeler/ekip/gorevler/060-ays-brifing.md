# 060 · AYS sabah brifingi verisi: `brifing(simdi)` (KING-4 §H)

**Durum:** bekliyor
**Dal:** `ag/060-ays-brifing`
**Efor:** orta
**Kabul testi:** `tools/kingveri_brifing_ays_kabul_test.py`

## Amaç
KING-4 §H «60 saniyelik sabah brifingi: bugünün planı, dünün tek bulgusu, tek öneri». Bu görev yalnız **modülün verisini** üretir; sayıyı modülün kodu hesaplar (AGENTS §1), eksik veri sıfır değildir (§1.2). Kartın görünümü, sesi ve cümleyi modele kurdurmak Claude Code'da (`brand/ortak/king-*.js`); `app.js` bağlantısını da Claude Code yapar. Var olan `olaylar`, `hafta`, `hatirlat`, `sonKayit`, `duzelt` aynen kalır (testleri yeşil kalmalı).

## Dokunulacak dosyalar
- `AYS/src/js/core/kingveri.js`, `AYS/src/tests/kingveri.test.js` (var olan kalıbı izle: aynı dosyadaki `hafta` ve testleri).

## Sözleşme (`R.KingVeri.brifing`)
`brifing(simdi: Date) → { gun, plan, bulgu, oneri }` — **saf okuma**: hiçbir şey yazmaz, aynı `simdi` ile aynı sonucu verir. `gun = R.U.iso(simdi)`. Dışa aktarılan nesneye `brifing` eklenir.
- `plan`: bugünün maddeleri `[{ ad, saat, tamam }]` (`ad` ≤ 80 harf, `saat` `'SS:DD'` ya da `null`, `tamam` boolean), en çok 8. Kaynak `R.S.days[gun].blocks` (sırası korunur): `ad` = `` `${subject} · ${topic}` `` (konu boşsa yalnız `subject`), `saat:null` (AYS blokları saatsiz), `tamam: status === 'done'`.
- `bulgu`: dünün tek ölçüsü `{ id, ad, deger, birim, etiket, ort:{ deger, etiket } }`; dün kaydı yoksa `null` (0 değil). `{ id:'calisma_dk', ad:'Çalışma', deger, birim:'dk', etiket:'ölçüldü' }`: dünün bloklarının `actualMin` toplamı; `actualMin` null olan sayılmaz, hiçbiri ölçülmemişse `bulgu:null`.
  `ort`: dünden önceki 7 gün (`dün−7 … dün−1`, yani bugünden −8 … −2) aynı ölçünün **kaydı olan** günlerinin ortalaması (tam sayıya yuvarla); en az 3 kayıtlı gün ise `etiket:'hesaplandı'`, azsa `{ deger:null, etiket:'veri yok' }`.
- `oneri`: `olaylar(simdi)` içinden öncelikli ilk olay — `sinav_yaklasti` > `uyku_dustu` > `plan_kacti` > `tekrar_gunu` — `{ id: olay.tur, sayilar: olay.sayilar }` (+ olayın `konu`'su varsa `konu`). Olay yoksa `plan`'daki ilk tamamlanmamış madde `{ id:'ilk_madde', konu: ad, sayilar:{} }`; o da yoksa `null`.
- Cümle yok: metni King'in modeli kurar (AGENTS §1). Kişisel not yollanmaz.

## Dokunma
- `brand/`, `app.js`, `index.html`, `screens/`, `state.js`, `store.js`, diğer `core/` dosyaları, `HKM/`, dist ve build.js, kabul testi dosyası, görev dosyasının Sonuç dışı.
- Yeni depolama anahtarı, yeni Model işlevi, ekran metni.

## Kabul ölçütü
- Kabul testindeki altı sınama yeşil: boş depo (`plan:[]`, `bulgu:null`, `oneri:null`, yazma yok, iki çağrı aynı); plan; bulgu + ort; ort «veri yok» ve dün yok; öneri önceliği (olayın sayıları aynen); olay yoksa ilk madde.
- `kingveri.test.js`'e en az iki kenar: dün ölçüsü olup önceki 7 gün boş; `simdi` gece yarısına yakın (23:59) iken dünün doğru günü.
- Modül test takımı yeşil.

## Koşulacak testler
- `python tools/kingveri_brifing_ays_kabul_test.py` (önce kırmızı, sonra yeşil)
- `python tools/kingveri_ays_kabul_test.py` (yeşil kalmalı)
- `cd AYS && node tools/runtests.js <senin portun>`

## Sonuç
