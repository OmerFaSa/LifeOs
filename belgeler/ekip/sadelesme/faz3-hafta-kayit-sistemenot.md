# Faz 3 · Hafta planı, Kayıt haftası, Sisteme not (kabuk)

## Özet
Dal `sadelesme` (e3f76523 üstünde), 2026-11-14. Commit yok; koordinatör kalite kapısından sonra commit eder. Üç iş bitti, hepsi test ve gerçek tarayıcı gezisiyle yeşil.

1. **Hafta planı** (`#/motor/plan/hafta`): bugünden yedi gün `Plan.haftaPlani`'nden; sahibin sabit blokları (uyku, okul, antrenman…) bir kez yazılan şablondan her haftaya ve günün planına girer; devir motorun hesabı.
2. **Kayıt haftası** (`#/motor/kayit/hafta`) ve **geçmiş güne kayıt**: tür başına yedi gün, boş gün nokta; haftanın toplamı; toparlanma ve yük `Kayit.Kural`'dan olduğu gibi. Kayıt formunda «Hangi gün?» (bugün + 7 gün geri, gelecek yok).
3. **Sisteme not** (`#/motor/not/arac/…`): Not içinde «Yeni araç»; aracın sistem notu (King okuyabilsin, ne anlamalı, nasıl kullanmalı). İzin **varsayılan kapalı**; kapalı aracın ve özel notun King yolundan geçmediği motorun süzgecine karşı test edildi.

**Önce örnek kuralı atlandı:** AGENTS §0.1 kural 6 («önce örnek, sonra kod») bu üç ekran için uygulanmadı; sahibin «sorma» talimatıyla doğrudan kod yazıldı. Ekran görüntüleri aşağıda; sahip beğenmezse yalnız çizim değişir, kural motorda.

**Motor değişiklikleri (küçük, testli):** `motor/kayit.js` geriye yazma penceresi (`GERI_GUN`, isteğe bağlı `bugun`); `motor/not.js` araç kaydı (`yeniArac`, `aracDogrula`, `kingAraclar`, `klasorde`) ve `kingIzin`'in araç izni. `motor/plan.js` değişmedi.

Değişen dosyalar: `kabuk/araclar.js`, `kabuk/kabuk.css`, `kabuk/kabuk.test.js`, `motor/kayit.js`, `motor/kayit.test.js`, `motor/not.js`, `motor/not.test.js`, `tools/kabuk_gez.js`, bu rapor, 16 ekran görüntüsü.

## Hafta planı
Bitti, test ve gezi yeşil. Motor değişmedi (`Plan.haftaPlani`, `gunPlani` `sabitler` girdisi ve `yardimci.haftaGunu` yetti).

- **Ekran:** `#/motor/plan/hafta` (Plan sayfasında «Hafta planı ve sabit bloklar» bağlantısı). Bugünden başlayan yedi gün, her gün kendi kartında:
  sabit bloklar, motorun yerleştirdiği işler ve ders, günün planlanan dakikası (etiketli), sığmayanlar nedeniyle. Altta «Gelecek haftaya devreder»
  (motorun `devir`, en çok 2) ve «Bekleyen» (`bekleyen`, kaybolmaz). Üstte haftanın toplamı `hesaplandı` etiketiyle; iş yoksa «plana girecek iş yok» (sıfır yazılmaz).
- **Neden bugünden:** motor geçmiş günü planlamaz («Geçmiş gün yeniden planlanmaz»); Pazartesi'den başlayan hafta çarşamba günü hata verirdi.
- **Sabit bloklar şablonu:** ad, başlangıç, bitiş, günler (Pzt–Paz onay kutuları; hafta içi hazır işaretli). Bir kez yazılır, her hafta o günlere girer.
  Kayıt Plan ekranıyla aynı yolla: `localStorage` `lifeos.plan.sablon` = `{ sabitler: [{id, ad, bas, bit, gunler}] }` (yalnız bu tarayıcıda; P6 sonrası tek depo).
  Ayrı anahtar seçildi: günün `lifeos.plan.durum` nesnesi her eylemde yeniden kuruluyor, şablon orada kaybolabilirdi.
- **Gece yarısını geçen blok** (Uyku 23:00–07:00): motor tek günde bitişin başlangıçtan sonra olmasını ister; kabuk bloğu ikiye böler: akşamı o gün 23:59'a kadar
  (ekranda 24:00), sabahı ertesi gün 00:00'dan. Saatlerin geçerliliğine motor karar verir (aynı cümle); ad ve gün seçimi kabukta denetlenir.
- **Günün planı da şablonu alır:** `planKur` artık o haftagününün sabitlerini `sabitler` olarak verir; tek şablon iki ekranı besler.
- **Devir:** motorun hesabı. Sığmayan iş ertesi güne devreder (`devir` sayısıyla blokta «2. gün»), hafta sonunda en öncelikli 2'si gelecek haftaya.
  Bugün «Yapıldı» işaretlenen iş öngörüye girmez.
- **Sınırlar (kodda not):** ders olarak yalnız üzerinde çalışılan alanın sıradaki tek dersi girer (Plan günündekiyle aynı); Tekrar kartları yalnız bugüne
  (ertesi günlerin vadesi bugünkü cevaplara bağlı). Hafta öngörüdür, kaydedilmez; her açılışta motordan yeniden hesaplanır.
- Dosyalar: `kabuk/araclar.js` (saf: `sabitlerGunu`, `sabitEkle`, `haftaKur`; ekran: `sayfaPlanHafta`), `kabuk/kabuk.css` (`.hafta`, `.blok--sabit`, `.gunsec`).

## Kayıt haftası
Bitti, test ve gezi yeşil. **Motor değişti (küçük):** `motor/kayit.js`'te geriye yazma penceresi yoktu; Kayıt hiçbir tarihi reddetmiyordu.

- **Motor:** `Kayit.GERI_GUN = 7` (eski kaynak: SPI `core/xp.js:85-93`, «pencere bir hafta: bundan eskisi ve gelecek reddedilir»). `kaydet`'in bağına
  isteğe bağlı `bugun` eklendi: verilirse gelecek gün «Gelecek bir güne kayıt yazılmaz.», 7 günden eskisi «En çok 7 gün geriye kayıt yazılır.» ile reddedilir.
  `bugun` verilmezse (göç bağdaştırıcıları) davranış aynen eskisi. `motor/kayit.test.js` +1 test (29 → 30).
- **Geçmiş güne kayıt:** Kayıt formunda «Hangi gün?» seçimi: Bugün, Dün ve 6 gün daha (liste `Kayit.GERI_GUN`'den; gelecek yok). Gün değişince yazılan sayılar
  kalır; günün özeti ve kayıt listesi seçili güne geçer («Dün için kayıt yok…»). Pencereye motor karar verir: kabuk `bugun`'u motora verir, cümleyi motor yazar.
  Kayıt anı (zaman) giriş anıdır; geçmiş günün kaydında listede saat gösterilmez.
- **Haftalık özet:** `#/motor/kayit/hafta` (Kayıt formunda «Haftalık özet»). Son yedi gün `Kayit.haftalik(kayitlar, bugün)`'den:
  - Tablo: tür başına satır (su, gece uykusu, kısa uyku, hareket, çalışma, öğün, öğün enerjisi, enerji ve ruh hâli, mola, ölçümler), gün başına hücre.
    Veri olmayan gün **nokta** (ekran okuyucuya «veri yok»), asla sıfır. Satırın bütün sayıları aynı etiketi taşıyorsa etiket satırın başında bir kez,
    karışıksa (ör. bir gece tahmin, bir gece ölçüldü) her hücrenin altında. Yalnız en az bir günü dolu türler satır olur.
  - «Haftanın toplamı»: motorun ortalamaları (yalnız kaydı olan günlerden, «N günün ortalaması») ve toplamları, etiketiyle.
  - «Toparlanma ve yük»: `Kayit.Kural.toparlanma` (puan, bant, eksik girdiler, ince ölçüm, ateş/oksijen bayrağı), `akutKronik` (oran, bölge),
    `haftalikBuyume` (değişim yüzdesi, bu haftaya en çok yük ve süre, %10 aşımı), `indirmeHaftasi`. Sayılar motorun etiketiyle (`hesaplandı`);
    veri yoksa motorun kendi cümlesi («Henüz antrenman kaydı yok.»). Teşhis ve doz dili yok (AGENTS §1.5): test, çıktıda «teşhis, tanı, hastalık,
    doz, ilaç, tedavi, reçete» kelimelerinin geçmediğini denetler. Bayrak cümlesi yalnız kuralı söyler: «Ateş kaydı 38,5 °C ya da üstünde: kural bugünü dinlenme günü sayar.»
- Telefonda tablo kendi kabında yatay kayar (sayfa taşmaz); ilk sürümde gizli etiketler kabın dışına taşıyordu, gezi yakaladı, düzeltildi.
- Dosyalar: `kabuk/araclar.js` (saf: `gunSatirlari`, `kayitGunleri`, `haftaOzeti`, `yukOzeti`, `kayitEkle(..., bugun)`; ekran: `sayfaKayitHafta`, gün seçimi),
  `kabuk/kabuk.css` (`.khafta`), `motor/kayit.js`, `motor/kayit.test.js`.

## Sisteme not
Bitti, test ve gezi yeşil. **Motor değişti:** `motor/not.js`'te araç tanımı yoktu (yalnız tasarım belgesinde: `not-ve-tekrar.md` §3a `arac/<id>` … `sistemNotu {kingOkur, anlam, kullanim}`). En küçük hâli eklendi, alan adları belgedeki gibi.

- **Kayıt biçimi:** `{ id, ad, klasor, gorunum: 'liste'|'ag', sistemNotu: { kingOkur, anlam, kullanim }, olusturma, guncelleme }`. `aracDogrula` Türkçe cümleyle reddeder
  (bilinmeyen alan, boş ad, boş/bozuk klasör, bilinmeyen görünüm, 1000 karakteri aşan metin). `yeniArac` eksikleri doldurur: klasör addan, görünüm liste,
  **`kingOkur: false` (güvenli varsayılan)**. Aracın kapsamı klasörüdür (alt klasörler dahil); not araca klasörüyle bağlanır, ayrı alan yok.
- **King süzgeci:** `kingIzin(n, { araclar })` King'e kapalı her aracın klasörünü kapalı sayar (`kingOkur` açıkça `true` değilse kapalı; bozuk kayıt da).
  `kingOkur` bunu kullandığı için kapalı nota giden bağın adı da «özel not» olur. `kingAraclar(araclar)` King'e yalnız izinli araçların sistem notunu verir;
  kapalı bir aracın altındaki araç da kapalıdır. Özel not her durumda dışarıda.
- **Ekranlar:**
  - Not sayfasında «Araçlar» bölümü: her araç klasörü, not sayısı, görünümü ve «King okur / King okumaz» puluyla; «Yeni araç».
  - «Yeni araç» formu (`#/motor/not/arac/yeni`): ad, klasör (boşsa ad), görünüm (Liste / Ağ), «Sisteme not» kutusu: «King okuyabilsin» (işaretsiz gelir),
    «King bundan ne anlamalı?», «King bunu nasıl kullanmalı?». Geçersizse motorun cümlesi, yazılan kaybolmaz.
  - Araç sayfası (`#/motor/not/arac/<id>`): sistem notu kutusu (iki metin, izin pulu, «King bu aracın notlarını ve bu notu okumaz / okur»),
    «Bu araçta yeni not» (not aracın klasörüne yazılır, formda «Araç: … · King okumaz»), «Aracı düzenle», aracın notları (görünüm Ağ ise not ağı da).
  - Düzenlemede **klasör salt okunur**: kapalı bir aracın klasörü değişseydi eski klasördeki notlar King'e açılırdı. Aynı klasörü iki araç kullanamaz.
  - **Araç silme yok** (bilerek): silinen kapalı aracın notları King'e açılırdı. Açık sorularda.
- **Kayıt:** `localStorage` `lifeos.not.araclar` (notlar gibi yalnız bu tarayıcıda).
- **King'in bugünkü okuma yolu:** `king/kopru.js` notları göç kaynaklarından okuyup `kingOkur(tum, { kapaliKlasorler })` çağırır; kabuğun tarayıcıdaki notlarını ve
  araçlarını hiç görmez, yani bugün kabukta yazılan hiçbir not King'e ulaşmıyor. Tek depoya geçince köprünün `araclar`'ı da vermesi gerekir (king/ bu dalgada benim alanım değil).
  Süzgecin kendisi şimdiden hazır ve testli.
- **Kanıt:** `motor/not.test.js` «araç ve sisteme not»: varsayılan kapalı; kapalı aracın notu (alt klasörü ve içindeki «açık» işaretli araç dahil) ve özel not `kingOkur`'dan
  çıkmaz; bağ yoluyla adları sızmaz; King araması bulamaz; bozuk izin kapalı sayılır. `kabuk/kabuk.test.js` aynı şeyi kabuğun yazdığı kayıtlarla (`aracKaydet`, `notKaydet`)
  motorun süzgecinden geçirerek denetler. Gezi gerçek tarayıcıda `LIFEOS.Motor.Not.kingOkur` ile izin kapalıyken notun dışarıda, açılınca içeride olduğunu ölçer.

## Testler
Hepsi 2026-11-14'te bu ağaçta koşuldu (ölçüldü).

| Komut | Sonuç |
|---|---|
| `node kabuk/kabuk.test.js` | 51 geçti, 0 kaldı (önce 45; +6: hafta ×2, kayıt geçmiş gün, kayıt haftası ×2, sisteme not) |
| `node kabuk/deneme.test.js` | 6 geçti, 0 kaldı |
| `node kabuk/tanisma.test.js` | 25 geçti, 0 kaldı |
| `node motor/plan.test.js` | 27/27 (dokunulmadı) |
| `node motor/kayit.test.js` | 30/30 (önce 29; +1 geriye yazma penceresi) |
| `node motor/not.test.js` | 28/28 (önce 27; +1 araç ve King süzgeci) |
| `node motor/not-hkm.test.js`, `tekrar`, `yol`, `soru` | 7/7, 21/21, 24/24, 33/33 |
| `python king/mcp_test.py` | TEMİZ, 0 kırmızı (Not'un King süzgecini kullanır) |
| `python kalite/katman_test.py` | TAMAM, 0 hata |
| `python kalite/katman.py` | Katman tamam, 1 bilinen istisna, yeni bozulma yok |
| `python kalite/olcum.py --denetle` | Bütçe tamam: 28 bütçe, aşım yok |

Yeni testler ayrı dosyaya değil `kabuk/kabuk.test.js`'e eklendi: CI dosyaları adıyla koşuyor (`.github/workflows/ci.yml`) ve CI benim düzenleme alanımda değil.

## Gezi
`node tools/kabuk_gez.js`: **199 ✓, 0 ✕, «hepsi geçti»** (tek headless Chromium, yalıtılmış veri, iş bitince kapandı). Her işten sonra koşuldu; son koşu üçü bittikten sonra.

Yeni denetimler:
- **Hafta (8):** yedi gün ve «bugün»; sıradaki ders öngörüde, bugün yapılan iş yok, özet etiketli; adsız sabit blok reddi; okul yalnız hafta içi beş güne, uyku (23:00–07:00)
  her güne iki parça; «gece yarısını geçer» işareti; şablon yenilemeden sonra duruyor; telefonda taşma yok; silinen blok günlerden çıkar.
- **Kayıt (7):** gün seçimi bugün + 7 gün geri, gelecek yok; gün değişince yazılan sayı kalır, özet o güne geçer; düne kayıt; haftalık tabloda dün 300, bugün 500,
  boş günler nokta («veri yok»), sıfır yok; satır ve toplam etiketli; toparlanma/yük motorun cümlesiyle; telefonda taşma yok.
- **Sisteme not (11):** «King okuyabilsin» işaretsiz gelir; adsız araç reddi; araç sayfası notu ve «King okumaz»; araçta yeni not izni söyler; not aracın klasöründe ve King
  süzgeci onu ve sistem notunu dışarıda bırakır; araç sayfasında not listelenir; düzenlerken klasör salt okunur; izin açılınca King okur; Not sayfasında araç listesi; iki görünümde telefonda taşma yok.

Gezi aracına ekleme: `--goruntu=önek1,önek2` yalnız adı bu öneklerle başlayan dört görünümlü görüntüleri yeniler, ötekilere dokunmaz.
Zamanlama düzeltmeleri (denetim gevşetilmedi): hafta sayfasında dersin yüklenmesi beklenir (`.hafta .blok--ders`); gizli `klasor` alanı `state: 'attached'` ile beklenir.
Gezinin yakaladığı gerçek hata: kayıt haftası tablosundaki gizli etiketler (absolute) kaydırma kabının dışına taşıp telefonda sayfayı 560 px yapıyordu; kap `position:relative` oldu.

## Ekran görüntüleri
`belgeler/ekip/sadelesme/kabuk-onizleme/` altında, 1280 ve 390 genişlikte, açık ve koyu (16 PNG):

- `hafta-{masaustu,telefon}-{acik,koyu}.png`: hafta planı, okul ve uyku sabit blokları, bugün sıradaki ders, şablon formu.
- `kayit-hafta-{masaustu,telefon}-{acik,koyu}.png`: kayıt haftası tablosu (boş gün nokta), haftanın toplamı, toparlanma ve yük.
- `sisteme-not-form-{masaustu,telefon}-{acik,koyu}.png`: «Yeni araç» formu, sistem notu dolu, «King okuyabilsin» işaretsiz.
- `sisteme-not-{masaustu,telefon}-{acik,koyu}.png`: araç sayfası, sistem notu kutusu, aracın notu.

**Koordinatöre dikkat:** ilk koşuyu yanlışlıkla bütün görüntüleri yenileyen `--goruntu` ile yaptım. Başka ekranların 19 PNG'si yeniden çekildi (git'te `M`: akademik,
deneme-*, felsefe, kayit, not, plan, soru, tekrar) ve depoda olmayan 12 PNG oluştu (`not-agi-*`, `yerlestirme-soru-*`, `yerlestirme-sonuc-*`). Geri almak istedim
(`git show HEAD:… > …`), izin sistemi reddetti; olduğu gibi bıraktım. Commit'e alınmayabilir ya da HEAD'den geri konabilir; içerik aynı ekranların bugünkü hâlidir.

## Açık sorular
1. **Araç izni varsayılanı:** plan kararı «King notları okur» (not başına varsayılan açık). Yeni araçta izni güvenli tarafta, **kapalı** başlattım (görev «güvenli değer» dedi;
   sahibin maketinde örnek araçta «açık» yazıyordu). Sahip «yeni araç da açık başlasın» derse tek satır (`yeniArac`).
2. **King köprüsü:** `king/kopru.js` `kingOkur`'a `araclar`'ı vermiyor (bugün kabuğun notları King'e hiç gitmiyor). Tek depoya geçerken araçlar da köprüye verilmeli; king/ ekibinin işi.
3. **Araç silme:** yok. Silinen kapalı aracın notları King'e açılır; seçenekler: silince notları «özel» yapmak ya da klasörü kapalı listede tutmak. Sahibin kararı.
4. **Geriye yazma penceresi 7 gün:** SPİ XP penceresinden alındı (kayıt girişi için eski bir kural yoktu). Değişirse `Kayit.GERI_GUN`.
5. **Hafta öngörüsünde ders:** yalnız üzerinde çalışılan alanın sıradaki tek dersi giriyor (gün planıyla aynı); haftaya birden çok ders Yol'dan sıradaki N dersi istemeyi gerektirir.
   Tekrar kartları yalnız bugüne giriyor.
6. **Gece yarısını geçen sabit blok** ikiye bölünüyor (akşam 23:59'a kadar, ekranda 24:00; sabahı ertesi gün). Motor günü 23:59'da bitirdiği için son dakika boş sayılır.
7. **Kayıt haftası** son yedi günü gösterir; önceki haftalara gitme yok (`haftaOzeti(…, bitis)` zaten tarih alıyor).
8. Geçmiş güne yazılan kaydın zamanı giriş anıdır (o günün saati değil); listede saat gösterilmez.
