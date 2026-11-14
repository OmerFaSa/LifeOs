# Faz 2 son cila: kabukta katalog dışı kalan parçalar, arama kapsamı, önizlemeler

## Özet
2026-11-14, yerel `sadelesme` çalışma ağacı (c293d421 üstünde, commit yok). Üç iş:
1. Kataloğun dışında kalan son elle kurulmuş ekran parçaları bloklara taşındı (Bugün karşılaması, Tanışma, halka, komut çubuğu, Ayarlar düzeni; Tekrar kartı ve deneme şeridindeki son elle yazılmış satırlar). Katalog 22 → **28 taş**. `kabuk.css`'te ekran parçası kuralı kalmadı; yalnız çerçeve (üst sıra, kırıntı, perde), gövde genişliği ve form/ızgara yerleşimi duruyor.
2. «Her şeyde arama» artık Tekrar kartlarını (ön ve arka yüz) ve Plan'ı (bugünün blokları, işler, sabit bloklar) da buluyor; kart sonucu tam o kartı yeni `#/motor/tekrar/kart/<kimlik>` sayfasında, plan sonucu günün planını (sabit blok hafta planını) açıyor.
3. Değişen ekranların önizlemeleri (11 ekran × 4 görünüm + katalog) ve eski `yer-1…7` önizlemeleri gerçek tarayıcı gezisinden yeniden çekildi; `yer-*` artık gezinin kendisi üretiyor.

Ölçüler: kabuk JS (testler hariç, 6 dosya) 3102 → 3265 satır (+163: katalog +108, arama +58), CSS 385 → 398 (+13; kabuk.css 154 → 99, bilesen.css 231 → 299). `kalite/olcum.py --denetle` bütçeleri değişmedi (28 bütçe, aşım yok).

**Değişen dosyalar:** `kabuk/bilesen.js`, `bilesen.css`, `bilesen.html`, `bilesen.test.js`, `kabuk.js`, `kabuk.css`, `index.html`, `araclar.js`, `tanisma.js`, `deneme.js`, `arama.js`, `kabuk.test.js`; `tools/kabuk_gez.js`, `tools/bilesen_goruntu.js`; bu rapor; `kabuk-onizleme/` altında yalnız «Önizlemeler»de sayılan dosyalar.

**Kural notu:** AGENTS §0.1 kural 6 («önce örnek, sonra kod»: tasarım değişikliği varyasyonla gösterilir, sahibi seçer) bu turda **atlandı**; sahibin «sorma» talimatıyla karar verildi. Yeni taşlar eski görünüşü olabildiğince aynen taşır; değişen ölçüler aşağıda tek tek yazılı. Katalog sayfası (`kabuk/bilesen.html`, 23–28) örnek olarak sonradan bakılabilir.

## Bloklara taşınanlar
| Parça (dosya) | Önce (elle) | Sonra |
|---|---|---|
| Bugün karşılaması (`kabuk.js` `sayfaBugun`, `araclar.js` `bugunEk`) | `.karsila`, `.karsila__selam/__sira/__sonra/__plan`, bağlam kuralı `.karsila > .b-uyari` | **`B.karsilama`**; `Kabuk.bugunEk` artık HTML değil `{metin, href}` döndürür (taş çizer, kaçışı taş yapar) |
| Halka (`kabuk.js`, `index.html`) | `index.html`'de boş `div.halka`, `halkaKur` elle düğme dizer; `.halka*`, `.secili`, `.acik` | **`B.halka`** (kabuk açılırken body'ye gizli çizilir); sınıflar `b-halka--acik`, `b-halka__oge--secili` |
| Komut çubuğu (`kabuk.js`, `index.html`) | `index.html`'de elle dialog/combobox/listbox; `komutCiz` elle `<li role=option>` | **`B.komut`** + **`B.komutListe`**; kimlikler aynı (`#komut`, `#komut-liste`, `#komut-durum`, `komut-N`) |
| Tanışma sohbeti (`tanisma.js`) | `.tn__izgara`, `.tn__sohbet`, `.tn__akis`, `.tn__soru/__ben`, `.tn__simdi`, `.tn__yeni`, `.tn__secim` | **`B.sohbet`** (geçmiş + şu anki adım: form ya da başlıklı bölüm) + **`B.cipler`** (hızlı seçenekler) |
| Tanışma «King'in anladığı» (`tanisma.js`) | `.tn__olgular`, `.tn__olgu(--not)`, `.tn__konu/__metin/__dug`, `.tn__duzelt` | `B.liste` (yeni `canli`) + `B.satir` `uzun` (metin kısaltılmaz) + eylemler; düzeltilen satır yeni `satir.form` ile aynı kutuda form |
| Tanışma ve Ayarlar iki sütunu (`tanisma.js`, `kabuk.js` `sayfaAyarlar`) | `.tn__izgara` + `aside.tn__panel`; `.ayarlar`, `.ayarnav`, `.ayarlar__govde` | **`B.yanli`** (sağ: Tanışma, yan `<aside>`; sol: Ayarlar) + **`B.gezinme`** (Ayar grupları `<nav>`) |
| Tekrar kartı (`araclar.js`) | kartın üstünde elle `<p class="soluk">Bugün N tekrar, M yeni kart</p>` | `B.kart` yeni `ust` seçeneği (kartın kendi üst satırı) |
| Süreli deneme üst şeridi (`deneme.js`) | şeridin yanında elle `<p class="gizli" aria-live id="deneme-duyuru">` | `B.serit` yeni `duyuru` seçeneği (canlı satır şeridin içinde, kimlik aynı) |
| Not ağı kabı, Kayıt haftası tablosu | — | Zaten taştaydı (`B.bolum` + `B.ag`, `B.bolum` + `B.tablo`, faz2-cila); bakıldı, elle parça kalmamış. Kalan tek elle parça bütün alt sayfalarda ortak olan kırıntı (`<a class="kirinti">`, çerçeve), Açık sorular 2 |

`kabuk.css`'ten silinenler (≈60 satır): `.karsila*`, `.ayarlar*`, `.ayarnav*`, `.halka*`, `.komut*`, `.tn__*` (Tanışma bölümünün tamamı), `h1,h2,…` kuralındaki iki sınıf. Kalan tek ek: `@keyframes gir` (sohbetin giriş hareketi; `@keyframes` taş seçicisi olmadığı için bilesen.css'in «her kural .b-» denetimine girmesin diye çerçevede).

**Davranış:** yollar, kısayollar (Ctrl K, /, Ctrl ., oklar, Home/End, Enter, Esc, Sekme tuzağı), odak dönüşü, basılı tut + sürükle seçimi, `aria-*` rolleri, canlı bölgeler ve kimlikler aynı. Görünüşte bilerek değişenler (ölçeğe uydurma): karşılama aralığı 22 → 16 px ve bilgi satırlarının −10 px kaydırması kalktı; Ayarlar grup aralığı 28 → 16 px, gezinme bağlantısı 40 → 44 px yükseklik; Tanışma sütun aralığı 24 → 16 px; Tanışma ve Ayarlar artık aynı kırılımda (820 px) alt alta (Ayarlar önce 720 px); «King'in anladığı» satırları çizgi ayraçlı satırdan liste satırı kutusuna geçti (konu notta, metin üstte), notun italiği kalktı (« » tırnakları duruyor); komut çubuğu dolguları 4/14 → 4/16, 6 → 8, 10/12 → 8/12 (satır yine en az 44 px).

## Yeni bloklar
Katalog 22 → 28 taş (`kabuk/bilesen.js`, `bilesen.css`, `bilesen.html` 23–28, `tools/bilesen_goruntu.js` beklenen bölüm 28):
- **23 · Karşılama** `karsilama({selam, sira?: {ust, metin}, adim?, eylem, baglanti?: {metin, href}, ekler?})` — h1 selam, tek ana düğme, tek bağlantı, bilgi satırları aynı genişlikte (≤ 760 px). Selamın `clamp(2rem,7vw,3.4rem)` boyu ölçeğin dışındaki tek yazı boyu (karşılama A'nın büyük cümlesi; h1 de kabuk.css'te clamp).
- **24 · Halka** `halka({id, ad, ogeler: [{ad, yol}]})` — role=menu/menuitem, gizli çizilir, ilki tepede saat yönünde (`--a`). Zemin yuvarlak (sahibin kararı): `border-radius` yasak olduğu için radyal geçişle çizildi.
- **25 · Komut çubuğu** `komut({id, ad, yerTutucu})` + `komutListe({id, ogeler})` — dialog/combobox/listbox/canlı durum; boş sonuç «Sonuç yok».
- **26 · Sohbet** `sohbet({ad, gecmis: [{soru, cevap[] | atlandi, eylem?}], simdi: {soru?: {metin, id, canli, odak}, govde, form? | etiket}})`.
- **27 · Çipler** `cipler({ad, ogeler})` — fieldset + gizli legend + aria-pressed düğmeler.
- **28 · Yanlı düzen** `yanli({taraf: sol|sag, yan, ana, tamamlayici?})` + `gezinme({ad, ogeler: [{metin, href}]})`.
- Var olan taşlara seçenek: `satir.form {veri, govde}` (yerinde düzenleme), `liste.canli` (aria-live), `kart.ust`, `serit.duyuru`.

Zorunlu renk kipine halka öğesi, komut çubuğu ve sohbet balonu kenarlıkla, seçili halka/komut öğesi Highlight çerçeveyle eklendi.

## Arama kapsamı
`kabuk/arama.js`'e iki saf arama, `ara()`'ya iki grup (sıra: Dersler, Notlar, **Tekrar kartları**, **Plan**, Kayıtlar, Yerler ve ayarlar):
- **`kartAra(kartlar, sorgu)`**: kaynak `lifeos.tekrar.kartlar` (elle eklenen, ders alıştırmasından gelen ve kapıda kalınan kartlar). Her kelime ön ya da arka yüzde geçmeli; ön yüzde geçen önce (kelime başı +2), eşitlikte kayıt sırası. Arkada geçen kelimenin çevresi satırın notunda «Cevap: …». Kapıda kalınan, içeriği onaylanmamış kart `taslak` rozetiyle. En çok 10 sonuç; fazlası «N sonuçtan ilk M» der.
- **Tek kart sayfası** `#/motor/tekrar/kart/<kimlik>` (`araclar.js` `sayfaKart`, aynı `B.kart` taşı): ön yüz; «Cevabı göster» arka yüzü açar ve odağa alır; üst satırda vade («bugün sırada», «sıradaki tekrar …», «taslak: onaylanınca tekrara girer»); başlık altında kaynak ve etiketli hatırlama. **Burada not verilmez**: zamanlama yalnız bugünün sırasında değişir; arka açılınca «Tekrar'a dön». Bilinmeyen kimlikte «Bu kart bulunamadı.».
- **`planAra(plan, sablon, bugun, sorgu)`**: her kelime adda geçmeli. Bugünün planındaki bloklar (mola ve sabitin günlük kopyası hariç; not «Bugünün planı · 09:00–09:30», bağlantı `#/motor/plan`), plandaki işler (bugün bloğu olan iş ikinci kez yazılmaz; «İş · 30 dk · son …», `#/motor/plan`), hafta şablonundaki sabit bloklar («Sabit blok · 23:00–07:00 · her gün», `#/motor/plan/hafta`). Başka güne ait kalmış plan aranmaz; gün devri Plan sayfasının kuralıyla (`Arac.planGunDevri`) yalnız okunarak uygulanır, arama hiçbir şey yazmaz.
- Sayfa alt yazısı ve boş durum yeni kaynakları sayar. Yerel ve ağsız kaldı. Ölçüm (gezi verisi, ölçüldü): 544 ders, bir sorgu + çizim ortanca 2,1 ms (en çok 2,6 ms), soğuk açılışta dizin 83 ms.
- Testler: `kabuk.test.js` +2 (kart: ön/arka, sıra, parça, taslak, aksansız yazım, bozuk kayıt, boş kaynak; plan: blok/iş/sabit, mola ve kopya yok, eski gün, plan yoksa boş); «hepsi birlikte» testinin grup listesi altı gruba göre güncellendi. Gezi +10 denetim.
- `faz3-arama-king-sayfa.md` Açık sorular 3 («Tekrar kartları ve Plan işleri aranmıyor») bununla kapandı; o belgeye dokunulmadı (yetki dışı).

## Önizlemeler
`belgeler/ekip/sadelesme/kabuk-onizleme/`: yalnız aynı adlı dosyaların üstüne yazıldı, yeni dosya yok.
- Değişen ekranlar (1280/390 × açık/koyu): `karsilama-*`, `halka-*`, `komut-*`, `ayarlar-*`, `tanisma-ilk-*`, `tanisma-orta-*`, `tanisma-onay-*`, `tekrar-*` (kartın üst satırı), `deneme-soru-*` (şerit), `arama-*`, `onay-bugun-*` (Bugün karşılaması) ve `bilesen-*` (katalog, 28 taş). Komutlar: `node tools/kabuk_gez.js --goruntu=karsilama,halka,komut,ayarlar,tanisma-,tekrar,deneme-soru,arama,onay-bugun,yer-` ve `node tools/bilesen_goruntu.js`. Halka, komut, ayarlar ve tanışma görüntüleri önceden tek seferlik çekimdi; artık gezi üretiyor.
- Eski `yer-1…7` aynı ekranlardan, aynı iki görünümle (`masaustu-koyu`, `telefon-acik`) yeniden çekildi ve **artık gezi üretiyor** (`goruntu(…, { yalniz: YER })`): yer-1 Dil boş alan seçimi, yer-2 yerleştirme sorusu, yer-3 sonuç, yer-4 atlanan aşama, yer-5 kapıda kalınca (gezi önce boş gönderip kalıyor, sonra geçiyor), yer-6 Tekrar'da kapıda kalınan kartlar, yer-7 not ağı.
- Gezinin çekimleri `animations: 'disabled'` ile (sohbetin giriş hareketi yarıda yakalanmasın).
- Bakıldı: Tanışma ve Bugün iki temada ve telefonda okunur. Halkanın perdesi telefonda tam sayfa görüntünün yalnız ilk ekranını örter (perde `position:fixed`; önceki davranış).
- Yeni tek kart sayfası (`kart-sayfa`) gezide telefon taşmasıyla denetleniyor; önizlemesi çekilmedi (görev: yalnız değişen ekranlar).

## Testler
Son durum (madde 2'den sonra, çalışma ağacı): `bilesen.test.js` **21/21**, `kabuk.test.js` **66/66** (önce 64), `tanisma.test.js` 25/25, `onay.test.js` 14/14, `deneme.test.js` 6/6, `depo.test.js` 13/13; `python kalite/katman.py` tamam (1 bilinen istisna, yeni bozulma yok); `python kalite/olcum.py --denetle` 28 bütçe, aşım yok; gezi 316/316. Her madde bitince hepsi ayrı ayrı koşuldu.

Madde 1 sonrası (çalışma ağacı): `bilesen.test.js` 21/21 (önce 18; +3 test: karşılama; halka + komut çubuğu; sohbet, çipler, yanlı düzen, satır formu, canlı liste, kart üst satırı, şerit duyurusu; her biri kötü girdi dahil), `kabuk.test.js` 64/64, `tanisma.test.js` 25/25, `onay.test.js` 14/14, `deneme.test.js` 6/6, `depo.test.js` 13/13. `python kalite/katman.py` tamam (1 bilinen istisna); `python kalite/olcum.py --denetle` 28 bütçe, aşım yok. `node tools/bilesen_goruntu.js` 4/4 görünüm, 28 taş, taşma 0, konsol temiz.

**Test değişikliği (tek gevşeme sayılabilecek yer, açıkça):** `bilesen.test.js`'in «yalnız kabuk.css jetonları» denetimi `var(--a/--x/--y/--r)`'ye izin veriyor: bunlar renk ya da tema jetonu değil, halkanın konum değişkenleri (`--a`'yı taş düğmeye satır içi yazar, `--x --y --r`'yi ekran açarken). Aynı testte bu dört adın hiçbir CSS'te jeton olarak tanımlanmadığı ve taşın `--a`'yı gerçekten yazdığı ayrıca denetleniyor; renk, yeni jeton, köşe ve yazı tipi kuralları aynen.

## Gezi
`node tools/kabuk_gez.js` (kendi sunucusu 4397'de, geçici veri, tek başsız Chromium, sonunda kapandı; sahibin çalışan LifeOS'una dokunulmadı) → **316 denetim, hepsi geçti** (önce 275; +41). Önizleme koşusu (`--goruntu=…`) da 316/316.

Seçici değişiklikleri yalnız taşınan işaretlemede: `.karsila …` → `.b-karsilama …`, `.karsila__sira/__selam` → `.b-karsilama__sira/__selam`, `.karsila__plan` → `.b-karsilama__baglanti`. Hiçbir denetim çıkarılmadı ya da gevşetilmedi.

Yeni denetimler: Bugün'de tek h1 selam, «Sırada», tek ana düğme; halka Ctrl . ile açılır (menü 3–6 yer, ilki odakta), → sonraki yer, Esc kapatır ve odak düğmeye döner, End + Enter o yere gider; komut çubuğu dialog + combobox, ilk seçenek etkin, sonuç sayısı canlı satırda, ↓ ikinciyi etkin yapar, eşleşmesizken yalnız «Her şeyde ara», Esc kapatır; Ayarlar'da yanlı düzen ve her grup için bir gezinme bağlantısı (hedef bölüm var); Tanışma'da sohbet bölümü, canlı soru, gizli başlıklı çipler, panel `<aside>`; cevap geçmişte «Değiştir»le, anlaşılanlar canlı listede, yazma alanı odakta; «Düzelt» satırı yerinde forma çevirir (alan odakta), «Vazgeç» geri getirir (odak «Düzelt»e); onay sorusu bölüm başlığı ve odakta; arama: kart ön ve arka yüzden bulunur ve tam o kartı açar, arka gizli/göster ve odak, bilinmeyen kart; plan bloğu günün planını, sabit blok hafta planını açar; yerleştirme sonrası boş kapı kalınca sorular Tekrar'ın taslak bölümüne düşer; yeni görünümlerin telefon taşması.

Zamanlamayla ilgili tek düzeltme: halka kabı 0 × 0 olduğu için Playwright'ın «görünür» denetimi açık halkayı kapalı sanıyordu; açıklık `hidden` niteliğinden okunuyor (denetim daha sıkı).

## Açık sorular
1. **Önce örnek kuralı atlandı** (AGENTS §0.1 kural 6), sahibin «sorma» talimatıyla. Görünüşte değişenler «Bloklara taşınanlar»ın sonunda tek tek yazılı; beğenilmeyen her biri tek taşın CSS'inde.
2. **Kırıntı ve üst sıra hâlâ çerçevede elle:** `<a class="kirinti">…` alt sayfalarda (Not, Araç, Kayıt haftası, Plan haftası, deneme, tek kart) ayrı ayrı yazılıyor. Bir `kirinti` taşı ya da `I.kirinti(yer, alt)` ile tek yere alınabilir; bu paketin listesinde değildi.
3. **Tek kart sayfasında not verilmiyor.** Aramadan açılan kart yalnız okunur; oradan cevaplamak istenirse Tekrar'ın not düğmeleri aynı taşla eklenir (zamanlama kuralı motorda).
4. **Kart araması depodaki kartlara bakar:** onaylanan derslerin alıştırma kartları Tekrar sayfası bir kez açılınca depoya yazılır; o zamana kadar aramada çıkmaz (arama yazmaz).
5. **Plan araması bugünle sınırlı:** hafta öngörüsündeki ileri günlerin blokları depoda yok (her açılışta hesaplanır), aranmaz; işler ve sabit bloklar aranıyor.
6. **Halkanın konum değişkenleri** için `bilesen.test.js`'e dar bir istisna eklendi (`--a --x --y --r`, Testler bölümü). Uygun görülmezse alternatif: konumu JS'in satır içi `left/top/transform` olarak yazması (açılış hareketi biraz değişir).
7. Selam boyu (`clamp(2rem,7vw,3.4rem)`) ölçeğin dışında kalan tek yazı boyu; karşılama A'nın büyük cümlesi olduğu için bırakıldı.
8. Tanışma panelinde uzun bir «kendi sözün» satırı, rozet ve iki düğmeyle birlikte masaüstünde dar sütunda sarılıyor (görüntüde okunur); istenirse düğmeler satırın altına alınabilir.
