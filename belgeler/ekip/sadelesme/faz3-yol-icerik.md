# Faz 3 · Yol motoru ve içerik şeması (Felsefe 1. aşama)

Tarih: 2026-11-13 · Dal: `sadelesme` · Yazan: model (ekip üyesi, Yol + şema) · Commit yok.

## Özet
- **Şema** `alan/SEMA.md`, **denetçi** `alan/denetle.py` (+ `alan/denetle_test.py`), **içerik**
  `alan/felsefe/asama-1.json`, **motor** `motor/yol.js` (+ `motor/yol.test.js`). Başka dosyaya dokunulmadı;
  `C:\gemini-data` yalnız okundu.
- Felsefe 1. aşama «Soruyu tanımak»: **3 ünite, 9 ders, 37 alıştırma (18'i kapı sorusu), 19 kaynak**
  (denetçinin sayımı, ölçüldü). Hepsi `taslak`, `yazan: model`; kaynakların hepsi `dogrulanmamis`.
- Testler yeşil: `node motor/yol.test.js` 13/13, `python alan/denetle_test.py` 14/14,
  `python alan/denetle.py alan/felsefe` çıkış 0.
- Ana bulgu: gemini-data'da **giriş dersi yok** («felsefe nedir, felsefi soru neye benzer»); ilk ders üç
  dağınık satırdan kuruldu. Kaynakta 8 hata/şüphe bulundu (aşağıda); bunlar derse alınmadı, dersin `not`
  alanına yazıldı.

## Şema
`alan/SEMA.md` (sürüm 1). Düzey: Alan → Aşama → Ünite → Ders → Alıştırma, yanında Kaynak.
Kararlar:
- **Yükleme birimi aşamadır**: `alan/<alan>/asama-<n>.json`. İçerik koddan ayrı, gerektiğinde yüklenir.
- **Ad kuralı AYS ders verisiyle aynı** (`onKosul`, `kazanim`, `soru`, `sec`, `dogru` harf, `cozum`;
  `AYS/src/js/data/derin-*.js`; envanter-ays §6: «Yol ve Soru motorlarının ortak biçimine en yakın veri»).
  icerik-hatti §4.1'in `on_kosul` önerisi yerine bu seçildi: AYS'nin 184 konusu dönüştürülmeden okunabilsin.
- **İki eksen ayrı** (icerik-hatti §4.2): içerik için `durum` (`taslak`|`onayli`) + `yazan` (`model`|`insan`)
  + kaynak başına `dogrulama` (`dogrulanmamis`|`kaynakli`|`denetlendi`); öğrenenin sayıları için motorun
  dört etiketi (`ölçüldü`, `tahmin`, `hesaplandı`, `veri yok`).
- **Kaynak kaydı** aşama başında bir kez (`k1`…), ders ve alıştırma kimlikle bağlanır; her kaynak dosya yolu,
  başlık ve **satır aralığı** taşır, denetleyen kişi doğrudan o satıra gider.
- **Kapı soruları dersten ayrı** (`kapi.sorular`, en az 3), yalnız `secmeli` (puanlanabilir). `acik`
  alıştırma (öz değerlendirme) hiçbir kapıya ve tekrara girmez.
- `onayli` yalnız `onaylayan` + `onayTarihi` ile birlikte geçerli; model `onayli` yazmaz.

## Doğrulayıcı
`alan/denetle.py`, yalnız standart kütüphane. `python alan/denetle.py alan/felsefe` → 0 temiz, 1 hata.
Hata satırı biçimi `✕ <dosya> <kimlik>: <Türkçe açıklama>`, son satırda sayım. Denetler: zorunlu alanlar,
şema sürümü, yinelenen kimlik (klasör genelinde), kimliğin üst öğenin altında olması, bilinmeyen önkoşul,
kendine önkoşul, **önkoşul döngüsü** (yinelemesiz DFS), kaynaksız ders/alıştırma, bilinmeyen kaynak
kimliği, cevap anahtarı yok ya da seçeneklerle uyuşmuyor, `acik` alıştırmada ölçüt yok, kapıda 3'ten az
soru ya da `acik` soru, eşik (0, 1] dışında, geçersiz `durum`/`yazan`/`tur`/`dogrulama`, onay bilgisi eksik
`onayli`. Gerçek bozuk örnek çıktısı (gecici kopya üzerinde):

```
✕ asama-1.json felsefe.1.1.2: kaynaksız (kaynak listesi boş ya da yok)
✕ asama-1.json felsefe.1.1.3.a1: cevap anahtarı yok (dogru)
✕ felsefe.1.1.1: önkoşul döngüsü: felsefe.1.1.1 → felsefe.1.1.3 → felsefe.1.1.2 → felsefe.1.1.1
3 hata · 1 dosya, 1 aşama, 3 ünite, 9 ders, 37 alıştırma, 19 kaynak
```

## Felsefe 1. aşama
`alan/felsefe/asama-1.json` — «Soruyu tanımak» (ad ESP merdiveni rank 1'den, `ESP/src/js/data/curriculum.js`).

| Ünite | Dersler | Kapı |
|---|---|---|
| 1.1 Felsefe ne sorar? (FEL.10.1.1) | Felsefe sözcüğü ve ilk filozof · Sorarak düşünmek: Sokrates · Görünüş ve gerçek: Platon'un mağarası | 4 soru, eşik 0,75 |
| 1.2 Kavram ve tanım (FEL.10.2.1–2) | Kavram ve önerme · Beş tümel · İyi bir tanım nasıl kurulur? (+ kanıt işi, `acik`) | 4 soru, eşik 0,75 |
| 1.3 Felsefenin üç temel alanı (FEL.10.3.1, 4.1, 5.1) | Bilgi felsefesi · Varlık felsefesi · Ahlak felsefesi | 4 soru, eşik 0,75 |
| Aşama kapısı | — | 6 karma soru, eşik 0,8 (5/6) |

Sayım (ölçüldü): 37 alıştırma = 18 ders alıştırması (seçmeli) + 1 açık uçlu kanıt işi + 18 kapı sorusu.
Cevap harfi dağılımı A 7, B 11, C 10, D 8. Sıra: ünite 1.2 ← 1.1, 1.3 ← 1.2; ünite içinde dersler zincir.
Kaynaklar (19): `MUFREDAT/felsefe.md` (MEB kazanımları), `ESP/dil/ceviri_kurami_…` (etimoloji satırı),
`ESP/felsefe/filozoflar_akimlar_dusunce_deneyleri.md` (11 ayrı satır/bölüm), `ESP/felsefe/klasik_mantik_…`
(3 bölüm), `AYS/ayt/ayt_felsefe_grubu_…_tyt_felsefe_akimlari_…` (3 bölüm). Satır aralıkları 2026-11-13'te
`grep -n` ile denetlendi. Dersteki her olgu iddiası bir kaynak satırına dayanır.

## Yol motoru
`motor/yol.js` — `LIFEOS.Motor.Yol` (tarayıcı) ve `module.exports` (Node). Saf fonksiyonlar; zaman
(ms) dışarıdan gelir, her yazan fonksiyon yeni kayıt döndürür. Kayıt düz JSON:
`{ dersler, cevaplar, kapilar, asamalar }`.

| Fonksiyon | İş |
|---|---|
| `yukle(veri)` | aşamayı dizinler; yinelenen kimlik, bilinmeyen önkoşul, puanlanamayan kapı sorusunda hata fırlatır |
| `acikMi(y, kayit, id)` | önkoşullardan açıklık: ünite ← kapısı geçilmiş ünite, ders ← okunmuş ders, aşama ← kayıtta geçilmiş aşama; üst öğe kilitliyse alt öğe de kilitli |
| `dersOku`, `cevapla` | okuma ve ders alıştırması sonucu; kilitliye yazmaz; `acik` puanlanmaz (`dogru: null`); kapı sorusu buradan cevaplanamaz |
| `kapiDene(y, kayit, sahip, cevaplar, zaman, ayar)` | ustalık kapısı; boş = yanlış; eşik `ayar.esik` ile değişir; aşama kapısı yalnız bütün üniteler geçilince açılır; sonuç `taslak: true` ile taslak soruları işaretler |
| `tekrarAdaylari(y, kayit)` | yalnız onaylı derste, onaylı, seçmeli ve en az bir kez cevaplanmış alıştırma; taslak hiçbir zaman; kapı soruları girmez. Her aday `icerik: 'onayli'` taşır (Tekrar motorunun kart alanı) |
| `durum(y, kayit)` | ünite/ders açıklığı, taslak etiketi, kapı özeti ve etiketli ilerleme: okunan ders `ölçüldü`, kapı oranı `ölçüldü`, geçilen ünite ve aşama ilerlemesi `hesaplandı`, hiç denenmemiş `veri yok` |

Ustalık kuralı kodda: ünite yalnız kapı oranı eşiği tutunca geçer; aşama ilerlemesi yalnız geçilen
kapılardan hesaplanır, okuma ve alıştırma sayısı hiç girmez. Bilinçli seçimler (sahip değiştirebilir):
ünite kapısı dersleri okumadan da denenebilir (bilen sıfırdan başlamasın); geçmiş bir başarılı deneme
yeterlidir; `tahmin` etiketi tanımlı ama yerleştirme sınavı bu turda yok, o yüzden üretilmiyor.

## Testler
- `node motor/yol.test.js` → **13/13 ✓** (çıkış 0). Kapsam: yükleme ve bozuk veri, kilit/açılma, saflık,
  puanlama, «100 doğru alıştırma + bütün dersler okundu → ünite geçmez», eşik altı/tam eşik, eşik ayarı,
  aşama kapısı sırası, aşamalar arası önkoşul, tekrar adayları (taslak, onaylı, açık uçlu, taslak ders
  içinde onaylı soru), etiketli ilerleme, ve **`alan/felsefe` uçtan uca**: bütün dersler okunur, bütün
  alıştırmalar doğru cevaplanır, ünite yine geçmez; kapılar geçilince aşama geçer; tekrar adayı 0 (taslak).
- `python alan/denetle_test.py` → **14/14 ✓** (çıkış 0). Geçici klasörde 12 örnek (temiz, eksik alan,
  bilinmeyen önkoşul, döngü, kaynaksız ders, bilinmeyen kaynak, anahtarsız alıştırma, uyuşmayan anahtar,
  yinelenen kimlik, kapıda açık soru, onaysız «onayli», geçersiz eşik) + gerçek `alan/felsefe` çıkış 0 +
  bozuk klasörde komut satırı çıkış 1.

## Kaynak ve kalite notları
1. **Giriş malzemesi yok.** gemini-data'da «felsefe nedir», felsefi düşüncenin özellikleri, felsefi soru ile
   bilimsel/gündelik soru farkı için bir bölüm bulunamadı (`grep` «philosophia», «felsefi soru», «bilgelik
   sevgisi»). Ders 1.1.1 üç satırdan kuruldu: etimoloji (bir dil atlasından, satır 117), Thales satırı, MEB
   kazanımı. Bu tam karşılayan içerik depoda var ama gemini-data dışında: `AYS/src/js/data/anlatim-ts.js` ve
   `derin-ts.js` `ts-f1` (o da doğrulanmamış).
2. **Hiçbir kaynak doğrulanmış değil.** gemini-data model çıktısıdır; kaynakçalarında URL yok (icerik-hatti §1.3).
   `MUFREDAT/felsefe.md` kendisi «insan doğrulaması yapılmamıştır» diyor; MEB PDF adresi açılıp denetlenmedi.
3. **Kaynakta bulunan hata ve şüpheler** (derse alınmadı ya da `not` ile işaretlendi):
   - `klasik_mantik_…` satır 19-50: insanın cinsi tabloda «canlı», şemada «hayvan / canlı»; tam tanım örneği
     «düşünen canlı». Klasik metinlerdeki yaygın biçim «hayvan»dır; alıştırmalar yakın cinsin adını sormuyor.
   - `ayt_felsefe_grubu_…` satır 56: idealizm altında Aristoteles; aynı derlemenin `filozoflar_akimlar_…`
     satır 20'si Aristoteles'i «klasik gerçekçilik» sayıyor. Çelişki; Aristoteles'in akımı sorulmadı.
   - Aynı dosya satır 19-20: rasyonalizm «doğuştan (a priori)» diye tanımlanıyor (iki ayrı kavram) ve listede
     Sokrates, Aristoteles var; liste kullanılmadı.
   - Satır 42: pragmatizm «Faydacılık» diye çevrilmiş; ahlaktaki faydacılıkla (utilitarizm, satır 75) çakışıyor.
   - Satır 38-40: «kalp gözü ve manevi sezgi» Bergson'a da yükleniyor; satır 34-36: analitik felsefe ile
     mantıkçı pozitivizm eşitleniyor. İkisi de kullanılmadı.
   - Satır 61: yazım bozukluğu («maddenin beynin bir ürünüdür»).
   - `filozoflar_akimlar_…` satır 77: doxa «fenomen» ile eşitleniyor (Kant'ın fenomeniyle karışır); kullanılmadı.
   - Kant alıntısı «Görüsüz kavramlar boş, kavramsız görüler kördür» birincil metinle karşılaştırılmadı.
4. **Benim (model) yazdıklarım:** bütün ders metni kaynağın özetidir; ayrıca örnekler («insan», «cesaret»,
   «Kare dört kenarlı şekildir», «Zaman saatin ölçtüğü şeydir», «Kuş uçan hayvandır», arkadaşlık örnek
   cevabı), çeldiriciler ve ders 1.2.3'teki Sokrates bağlantı cümlesi. Hepsi `yazan: model`, `taslak`.
5. Bilinçli dışarıda bırakılanlar: kavramlar arası dört ilişki ve karşı olum karesi (`ayt_felsefe_grubu_…`
   satır 126-137) 2. aşamaya (argüman) daha uygun; ESP/felsefe'nin 29 atlası ileri düzey, bu aşamada yok.
6. Sınır (kodda `shortcut` yorumu yok, burada): kapı soruları sabit bir set; aynı sorularla yeniden deneme
   ezberle geçmeye açık. Soru havuzu ya da bekleme süresi gerekirse sonraki tur.

## Açık sorular
1. **Taslak sorularla kapı geçilebilsin mi?** Şu an evet, sonuç `taslak: true` diye işaretlenir. Hayır
   denirse sahip onaylayana dek pilot yürünemez.
2. **Eşikler:** ünite 0,75 (3/4), aşama 0,8 (5/6). icerik-hatti 2/3 önermişti. Hangisi?
3. **Yeniden deneme:** sabit soru seti + «bir kez geçen geçti». Soru havuzu, karıştırma ya da bekleme süresi ister misin?
4. **Dersi okumadan kapı:** ünite kapısı okumadan denenebiliyor (bilen atlasın). Kalsın mı?
5. **Giriş boşluğu:** ders 1.1.1 için AYS `ts-f1` metni (depo, doğrulanmamış) kaynak olarak alınsın mı,
   yoksa sen mi yazarsın?
6. **Onay nerede durur?** `onaylayan`/`onayTarihi` içerik dosyasına mı yazılsın, ayrı bir onay kaydına mı?
7. **Terimler:** klasik mantık terimleri (hadd-i tâm, efradını câmi) parantez içinde kaldı. Kalsın mı?
8. **ESP merdiveninin süre kapısı** (`philo.minutes30 ≥ 180`) hacimdir, ustalık kuralına aykırı olduğu için
   alınmadı; `kanitIsi` puanlanmıyor. Onaylıyor musun?
