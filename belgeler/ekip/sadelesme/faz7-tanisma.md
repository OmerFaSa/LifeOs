# Faz 7 · Tanışma ekranı

## Özet
Plan madde 11'deki Tanışma, kabukta `#/tanisma` adresinde çalışıyor. Ekranın solunda sakin bir sohbet sütunu var: sorular tek tek gelir, her soru kendi sözlerinle yazılabilir ve hızlı seçenekler sunar. Sağda «King'in anladığı · düzeltebilirsin» paneli var; her satır düzeltilebilir ve silinebilir. Telefonda panel sohbetin altına iner.
LifeOS'un içinde dil modeli yok (karar: King önce Claude uygulamasında MCP ile). Sorular bir kural tablosundan gelir. «Anlaşılan» bir şey yalnız iki kaynaktan çıkar: açık seçimler ve test edilmiş Türkçe desenler. Desenin çözemediği yazı yorumlanmaz, «kendi sözün» olarak olduğu gibi saklanır. Bu, plandaki «King kapalıysa aynı sorular kısa bir form olarak sorulur» maddesinin sohbet görünümlü hâlidir.
Son adımda onay verilmeden hiçbir şey yazılmaz. Yarıda bırakılan görüşme taslak olarak durur ve aynı sorudan sürer. Onaylanan her satır panelden geri alınır.

Dosyalar:
- Yeni: `kabuk/tanisma.js`, `kabuk/tanisma.test.js`.
- En küçük kayıt düzenlemeleri:
  - `kabuk/harita.js`: tek satır, `harita` satırının altında. On alan satırına dokunulmadı.
  - `kabuk/index.html`: tek `<script>`.
  - `kabuk/kabuk.js`: Bugün ekranına tek satırlık davet çağrısı.
- Biçim: `kabuk.css` değişmedi. Ekranın küçük stili `tanisma.js` içinde, var olan jetonlarla (`--yuzey`, `--cizgi`, `--vurgu`, `--sure`…) bir kez eklenir.

## Soru akışı
Kural tablosu (`sorular(t)`, `siradaki(t)`) sırayı her seferinde cevaplardan yeniden türetir. Bu yüzden bir cevap değişince akış da kendiliğinden düzelir.

| Sıra | Soru | Ne zaman | Hızlı seçenekler |
|---|---|---|---|
| 1 | `hedef`: Şu sıralar en çok neyi değiştirmek istiyorsun? | her zaman | sınav, yeni bir şey öğrenmek, sağlık ve form, günüme düzen |
| 2 | `alanlar`: Hangi alanlarla başlamak istersin? (birden çok seçilebilir) | her zaman | haritadaki on alan |
| 3…n | `seviye:<alan>`: o alanda kendini nasıl görüyorsun / neler yapıyorsun | seçilen her alan için, seçim sırasıyla | Yeni başlıyorum · Temelim var · Rahatım, ilerlemek istiyorum |
| n+1 | `sure`: Günde ne kadar zaman ayırabilirsin? | her zaman | 15 dk · 30 dk · 1 saat · 2 saat ya da daha çok |
| n+2 | `beden`: boy, doğum yılı, cinsiyet (beslenme hesabı için) | yalnız Sağlık dalından bir alan seçildiyse | Kadın · Erkek · Belirtmek istemiyorum |
| n+3 | `saglik`: bilmemi istediğin bir sağlık durumu | yalnız Sağlık dalından bir alan seçildiyse | Yok |
| son | Onay: «Anladıklarımı kaydedeyim mi?» ve başlangıç önerisi | sorular bitince ya da «Şimdilik bu kadar» denince | — |

- Her soruda «Atla» var.
- Geçmiş her cevabın yanında «Değiştir» durur.
- Alan sorusunda bazı seçenekler önceden basılı gelir:
  - hedef sınavsa Akademik;
  - hedef sağlıksa Hareket, Beslenme ve Uyku;
  - hedef yazısında adı geçen alanlar.

  Bunlar yalnız öneridir; gönderen yine kişinin kendisidir.
- Panelden bir alan satırı silinirse o alanın sorusu da akıştan çıkar.
- Test, bütün yolların bittiğini ve ölü soru kalmadığını gösterir: 5 hedef × 1024 alan altkümesi × (atla / ilk seçenek) = 10 240 yol.

## Anlaşılanlar
Desenler katlanmış metin üzerinde çalışır. Katlama `Kabuk.katla` ile yapılır (ç→c, ı→i, …).

- **Sayı + birim + sıklık.**
  - Örnekler: «haftada 2» (→ haftada 2 kez), «günde 30 dk», «haftada iki gün», «günde on beş dakika», «bir buçuk saat», «yarım saat», «1,5 saat», «20-30 dakika» (aralık), «her gün 20 dakika», «ayda 2 kez».
  - Birimler: dk/dakika, saat, gün, kez/kere/defa/sefer, km, sayfa.
  - Sıklık ya da birimden biri şarttır. Çıplak sayı («1998 doğumluyum»), «bir gün» deyimi, sözcük içi parçalar («ikinci», «beslenme») ve «saat 7» alınmaz.
- **Alan adları.**
  - Alan adı ve yakın sözcükler eklerle birlikte tanınır: «matematikte», «İngilizceyi», «kitapları», «spora», «uykum».
  - Ek listesi kapalıdır. Bu yüzden «yazılımcı», «mantıklı», «neyi» alan sayılmaz.
  - Olumsuz cümlecikten alan çıkmaz: «felsefe değil, tarih olsun» → yalnız Tarih.
  - Alan tanıma yalnız alan sorusunda ve hedef yazısındaki öneri için kullanılır.
- **Beden.**
  - Boy: «178 cm», «boyum 1,82», «boy: 165». Doğum yılı: dört haneli yıl.
  - Sınırlar `kabuk/ayar.js` şemasından gelir: 100–230 cm ve 1920–2020. Şema dışındaki sayı alınmaz.
- **Kendi sözün.**
  - Desenlerin aldığı parçalar çıkarıldıktan sonra anlamlı sözcük kalıyorsa yazının tamamı aynen not olur. «kadar», «yaklaşık» gibi dolgu sözcükleri sayılmaz.
  - Sağlık notu desene hiç sokulmaz; her zaman olduğu gibi saklanır.
- **Sınırlar.**
  - Düzey yalnız seçimden gelir. «Matematik fena değil, fizikte elektrik takılıyor» bir yargıya ya da olguya dönüşmez, kendi sözü olarak kalır (§1: teşhis ve yetenek yargısı yok).
  - Ünsüz yumuşaması tanınmaz: «matematiğe» bulunamaz, ama aynı cümle not olarak durur.
  - Olumsuzluk yalnız aynı cümlecikteki «değil, istemiyorum, istemem, hariç, olmasın, yok» sözleriyle anlaşılır.
  - Düzeltilen satır yeniden yorumlanmaz. Tek istisna boy ve doğum yılıdır; bunlar aynı desenle yeniden okunur.

## Kayıt biçimi
Yeni sistemde kişi kaydı türü yok:
- `motor/kayit.js` yalnız ölçüm türlerini tanır.
- `brand/ortak/kisi.js` eski modüllerin hafızasına bağlı.

Bu yüzden en küçük tür `tanisma.js` içinde tanımlandı:

```
olgu { id: '<soru>|<parça>', soru, konu, metin, tur: secim|desen|not|duzeltme,
       kesinlik: 'soz', kisi: <kisi.js yaşam alanı>, kaynak: 'tanisma', deger?: {v, ust?, birim, siklik}, ayar?: {anahtar, deger}, zaman }
```

- **`kesinlik: 'soz'`:** `kisi.js`'teki «senin sözün» katmanıdır; `beyan` yerine şemadaki en yakın etiket bu.
- **`kisi`:** kimlik, gelisim, ogrenme, fizyoloji ya da ritim. Böylece olgular göçte kişi modeline doğrudan taşınır.
- **Ekrandaki etiketler:** seçtin / yazdığından / kendi sözün / düzelttin.
- **Profil verisi:** Cinsiyet, boy ve doğum yılı ayrı bir yere yazılmaz; var olan Ayarlar › Beden satırlarına `Ayar.yaz` ile, şemadan geçerek yazılır. Böylece Kayıt ekranının enerji hedefi bunları hemen kullanır. Onaydan önceki ham değerler `ayarEski`'de saklanır; geri almada bu değerler geri konur.
- **Depo:**
  - `lifeos.tanisma.taslak`: yarım görüşme. Yalnız cevaplar tutulur, olgu tutulmaz.
  - `lifeos.tanisma.kayit`: `{ surum, zaman, olgular, oneriler, ayarEski }`; yalnız `onayla()` yazar.
  - `lifeos.tanisma.davet`: «Sonra» denince yazılır.
- **Yol önerisi (seçilen her alan için):**
  - Biçim: `{ alan, ad, ilk, baslangic: bas|kapi|eski, metin, yol, onay? }`.
  - İlk açılacak alan, hedefe bağlı taşınmış alandır; yoksa seçimdeki ilk taşınmış alan.
  - «Rahatım» diyen için öneri ilk ünite kapısını denemektir. Ustalık kapısı geçirir, okumak geçirmez.
  - Taşınmamış alan için yalnız bilgi verilir.
  - Yerleşme bir öneri olarak kalır. «Buradan başla» tek dokunuşla onaylar: `onay` zamanı yazılır, `lifeos.yol.son` o alan olur, alan sayfası açılır.
- **Not:** `shortcut` bu tarayıcının deposudur. P6 göçünde tek depoya (`sistem/veri.py`) bağlanmalı; diğer araç ekranlarıyla aynı durumda.

## Ekran
- **Erişim:** Ana sayfa dalında yeni bir yer olarak durur: Sistem haritası ve komut çubuğu («tanış» yazınca ilk sonuç). Halkadan iki adımdadır, `denetle()` boş liste döner.
- **Bugün daveti:** Kayıt yokken Bugün ekranında tek bir sessiz satır çıkar: «Seni biraz tanıyayım mı? Birkaç kısa soru.» → «Tanışalım» ya da «Sonra». Taslak varsa satır «Devam et» olur. Kayıt varken ya da «Sonra» denince gösterilmez.
- **Klavye:** Enter gönderir, Shift+Enter yeni satır açar. Hızlı seçenekler `aria-pressed` düğmeleridir ve tek seçimli sorularda biri seçilir.
- **Erişilebilirlik:**
  - Soru metni `aria-live` ile okunur ve yazı alanını tanımlar.
  - Paneldeki her düğmenin etiketi, satırın konusunu ve metnini söyler.
  - Düzeltmeden sonra odak aynı satıra döner.
- **Hareket:** Yeni balonun girişi `--sure` ile ölçeklenir; az hareket ayarında ve `prefers-reduced-motion`'da süre sıfırdır.
- **Sonrası:** Onaydan sonra «Kaydedildi» görünür. Panel kayıtlı satırları gösterir ve her satırda «Geri al» vardır. «Hepsini geri al» bütün kaydı geri alır, cevaplar taslak olarak kalır. Kalan sorular varsa «Kalan sorulara devam et» çıkar.

## Testler
- **`node kabuk/tanisma.test.js`: 25 geçti, 0 kaldı.**
  - Desenler: sayı, yazıyla sayı, aralık, ret durumları, alan, olumsuzluk, beden, artakalan.
  - Kural tablosu: sıra, sağlık dalı, 10 240 yolun hepsi biter, geçersiz cevap reddedilir.
  - Anlaşılanlar: türler; çözülemeyen yazı olguya dönüşmez.
  - Panel: sil ve düzelt.
  - Yarım bırakma ve devam.
  - Onaysız yazım olmaz; onay yazar.
  - Tek satırı ve hepsini geri alma.
  - Yeniden onayda Ayar geri dönüşü.
  - Yol önerisi ve tek dokunuş onayı.
  - Harita kaydı.
- **`node kabuk/kabuk.test.js`: 39 geçti, 0 kaldı.**
- **`node tools/kabuk_gez.js`: hepsi geçti** (kendi sunucusunu açar, tek Chromium).
- **Gerçek tarayıcı yürüyüşü** (file://, tek headless Chromium; betik yalnız görüntü almak için, depoda değil). Doğrulananlar:
  - Bugün daveti.
  - Önerilen alanların basılı gelmesi.
  - Cevaplamanın yalnız taslak yazması.
  - Düzelt ve sil.
  - Onaydan önce kayıt ve Beden ayarı olmaması.
  - Onayla gelen yazım.
  - Tek satırı geri alma.
  - «Buradan başla».
  - Harita ve komut çubuğu.
  - Telefonda yatay taşma olmaması.
  - Sayfa hatası olmaması.
- **CI:** Testi CI'a eklemek koordinatöre kaldı. `.github/workflows/ci.yml` başkası tarafından değiştirilmiş görünüyor; dokunmadım.

## Ekran görüntüleri
Klasör: `belgeler/ekip/sadelesme/kabuk-onizleme/`. 12 PNG, tam sayfa, adlandırma: `tanisma-{ilk, orta, onay}-{masaustu (1280), telefon (390)}-{acik, koyu}.png`.
- `ilk`: ilk soru.
- `orta`: görüşmenin ortası (Hareket sorusu, panel dolu).
- `onay`: onay adımı ve başlangıç önerisi.

## Açık sorular
1. **Panel başlığı.** Onaylı maketteki «King'in anladığı» korundu. Ama bu ekranda anlayan kural motoru, model değil. «Anladıklarım» mı denmeli?
2. **Plan'a yazım.** Günlük süre şimdilik yalnız olgu olarak duruyor. Plan motorunun `gunlukDakika` ayarına da önerilsin mi? Bu, başka bir motorun deposuna yazmak demek.
3. **Kişi modeli.** Olgular `kisi.js` alanlarıyla etiketli. Tek depoda ayrı bir «kişi» türü mü olsun, yoksa göçte hafızaya mı katılsın?
4. **Takip sorusu.** Maketteki takip sorusu («Elektrikte takıldığın yer formüller mi…») modelsiz sorulamıyor. King MCP'den bağlanınca serbest söz notlarını okuyup öneri olarak mı soracak?
5. **Davet.** Bugün'deki davet «Sonra» ile kalıcı olarak kapanıyor. Belli bir süre sonra bir kez daha sorulsun mu?

## Teslim notu (koordinatör, 2026-11-13)
Ajan ekran görüntülerini alırken hesap sınırına takıldı; kod, test ve rapor tamdı. Sonradan on alanın onu da kabuğa taşındığı için öneride «eski alan yalnız bilgi» yolu gerçek haritada artık çıkmıyor (kod duruyor); iki test beklentisi buna göre güncellendi. `node kabuk/tanisma.test.js` 25/25, CI'da «Tanışma görüşmesi kuralları» adımı. `tools/kabuk_gez.js` Tanışma'yı yürümüyor; ajanın kendi tarayıcı denetimi depoya alınmadı.
