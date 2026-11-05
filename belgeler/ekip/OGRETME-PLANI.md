# Öğretme planı

Kullanıcı (2026-11-05): bilgiyi çok daha profesyonel ve hızlı kavratacak öğretme altyapısı; görsel, sesli ve notsal öğretim; AYS, SPİ, ESP.

Durum: **onaylandı ve kuruldu (2026-11-05).** Çekirdek `brand/ortak/kavrat.js` (`LIFEOS.KAVRAT`); `ogret.js` (teşhis, 1/3/7 tekrar) ve ESP'nin `anlat.js`'i (anlat-öğren) zaten vardı, ad çakışmasın diye «kavrat».

## Var olan (yeniden yapılmaz)

| Parça | Nerede | Ne yapıyor | Eksik |
|---|---|---|---|
| Konu anlatımı | AYS Öğren (`screens/ogren.js`, 184 konu); SPİ ve ESP «Anlatımlar» (`brand/ortak/rehber.js`, aynı biçim) | Bölüm, formül, örnek, dikkat, akılda kalsın | Anlatım bölümlerinde hiç şekil yok (şekiller yalnız AYS sorularında) |
| Şekil | `AYS/src/js/core/sekil.js` | Kapalı öğe kataloğundan SVG, `alt` cümlesi zorunlu | Yalnız AYS'de; tek kare, adım yok |
| Ses | AYS `core/voice.js`, SPİ ve ESP `core/speak.js` | Web Speech, cümlelere bölme, emniyet süresi, okunuş düzeltme | Yalnız ajan konuşmasında; anlatım dinlenemiyor |
| Kalıcılık | `brand/ortak/usta.js` | Kanıttan aşama, vade, karışık sıra | Anlatımın kendi kartı yok |
| Kart ve tekrar | AYS Öğren (notu karta çevir, tekrar destesi), ESP dil SRS | | SPİ ve ESP anlatımında kart yok |

## Ne kurulur

**Tek parça:** `brand/ortak/kavrat.js` (`LIFEOS.KAVRAT`) + `kavrat.css`, `brand/parcalar.txt`'e birer satır, yazılar `PARCA.yazilar` ile. Modüller yalnız içerik verir; çekirdek ne SPİ'yi ne ESP'yi bilir.

1. **Adım adım çizim (görsel).** Bölüm `cizim:{ w, h, alt, adimlar:[{ o:[öğe…], not }] }` yazar. Önce ilk adım çizilir; «Sonraki adım» eskileri ince bırakıp yenileri vurgulu ekler, adımın tek cümlesi altta. Her adımın `aria-label`'ı o adımı söyler. Öğeler `sekil.js` kataloğundan: bu yüzden `sekil.js` `brand/ortak/`'a taşınır (AYS'de `R.Sekil` adı kalır, davranış değişmez). Süs, gölge, geçiş yok (§1.10).
2. **Dinle (sesli).** Bölümün metni modülün kendi ses katmanıyla okunur; çekirdek sesi bilmez, modül `ses(metin)` verir. İşaretler okunuşa çevrilir (`a^{2}` → «a kare»). API yoksa ya da Türkçe ses yoksa düğme çıkmaz, metin aynen kalır.
3. **Kartlar ve aralıklı tekrar (notsal).** Konu `kartlar:[{ on, arka }]` (3–6) yazar. Kart önce sorulur, çevirmeden önce hatırlanır (geri getirme); «Bildim / Bilemedim» `USTA` kanıtıdır. Vadesi gelen kartlar `USTA.sira` ile karışık gelir. Konunun üstünde tik sayacı (`GRAFIK.tikHtml`): kaç kart kalıcı. **Dinleyerek tekrar:** kartın önü okunur, kısa ara, arkası okunur; cevap yine iki düğmeyle.

Kanıtlar modülün deposunda (`<modul>.kavrat.kanit`, `OGRET.depo` ile), hiçbir ölçüme ve XP'ye yazılmaz (§1.6).

## Örnek bölümler

| Modül | Konu | Çizim | Kart |
|---|---|---|---|
| AYS | `tm-29` Dik üçgen | Öklid: üçgen → yükseklik → p ve k parçaları (3 adım); Pisagor kareleri | 5 |
| SPİ | `kosu` Koşuya başlamak | Koş-yürü seansı zaman çizgisi: ısınma → aralıklar → soğuma (anlatımdaki örnek, kişiye reçete değil) | 4 |
| ESP | `mantik-arguman` Argüman | Argüman haritası: öncüller → sonuç → itiraz (USTA-PLANI'ndaki «tezi harita olarak çiz» boşluğu) | 5 |

AYS'de yer: Öğren anlatım kartı. SPİ ve ESP'de: `rehber.js` bölüm çizerken `cizim` ve `kartlar` varsa çekirdeği çağırır; bir kez bağlanınca iki modül de alır.

## Sınırlar

- Sayıyı ve aşamayı kod üretir (`USTA`); model hiçbir yerde yok (§1.1).
- SPİ çizimi anlatımdaki örneği gösterir; teşhis ve doz yok, sınır notu yerinde kalır (§1.5). Aşama kayda söylenir, kişiye değil.
- İçerik elle yazılır, «doğrulanmadı» der; ÖSYM metni yok.
- Ses yalnız tarayıcının kendi Web Speech API'si; bağımlılık yok (§1.3).

## Testler

`brand/ortak/kavrat.test.js`: adım kesme, tarif denetimi (bilinmeyen öğe, eksik `alt`/`not`), okunuş çevirisi, kart cevabı → `USTA` kanıtı, ses yokken düğmesiz çizim. AYS `sekil.test.js` taşımadan sonra aynen geçer. Üç örneğin içeriği denetimden geçer (AYS `anlatim.test.js`, SPİ/ESP `rehber_*.test.js`). Sonra üç modülde `runtests`, `smoke`, `layoutcheck`, `a11ycheck`; kökte `node tools/entegre.js`.

## Sonra (bu işin dışında)

Öteki 183 AYS konusuna ve bütün anlatımlara çizim ve kart yazmak içerik işidir; ofise (Antigravity) parça parça verilebilir.
