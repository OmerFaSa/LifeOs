# Özellik analizi — düzeltilmesi ve eklenmesi gerekenler (2026-09-24)

> Bu belge bir **öneri listesidir**; hiçbir maddesi uygulanmadı ve kod
> değişmedi. Her öneri `ekip/HATALAR.md`'deki doğrulanmış bir bulguya ya da
> ölçülmüş bir sayıya dayanır. Dayanağı olmayan «şu da güzel olurdu» türü
> öneri bu listeye alınmadı (AGENTS.md §4, §5).
>
> Taban: `main` `65a7d16`. Uygulama sırası ve kararı depo sahibinindir.

## Nasıl süzüldü

Bir öneri listeye girmeden önce dört denetimden geçti:

1. **Var mı?** `tools/paket.py` §2 (modül yüzeyleri), `ekip/DEVIR.md`
   (57 kolaylık fikri ve durumları), `ekip/PLAN.md` (A/B/C önerileri),
   `LIFEOS2.md` §3 (bilerek bekleyenler) tarandı. Var olan ya da bekleyen
   bir şey yeniden önerilmedi. Kısmen varsa eksik kısmı yazıldı.
2. **Yapılmayacaklar listesine takılıyor mu?** `GELISTIRME_RAPORU.md`
   Bölüm 5: büyük dosya bölmek, XP'ye seri ya da sıralama, beşinci sistem,
   çerçeve, tek köken, eşik gevşetmek. Hiçbiri önerilmedi.
3. **Doktrinle uyumlu mu?** AGENTS.md §1'in dokuz maddesi. Uyumsuz görünen
   bir yer varsa açıkça yazıldı; doktrinin kendisine dair eleştiriler
   `HATALAR.md` §6'da.
4. **Dokuz aylık ufukta bir şey kırıyor mu?** Kırmıyorsa listeye girmedi.

**Boy:** K küçük (bir oturum) · O orta (birkaç dosya, test dahil) · B büyük
(sözleşme değişikliği, birden çok sistem).

## Özet

| # | Öneri | Tür | Kapattığı bulgu | Boy | Öncelik |
|---|---|---|---|---|---|
| A1 | Olumsuzluk ve kip süzgeci (ortak tek kaynak) | yeniden tasarım | KR-1 | O | 1 |
| A2 | Otomatik uygulama yalnız tercihe; ölçüm yazan eylem hep önizlemeli | yeniden tasarım | KR-1 | K | 1 |
| A3 | Sınav sonrası durumu | yeni durum | Y-2 | K | 2 |
| A4 | «Geri al»ın alan bazında ve sıralı olması | yeniden tasarım | Y-6 | O | 2 |
| A5 | HKM bağlantısında akış akış onay | yeniden tasarım | Y-8 | O | 2 |
| A6 | Profil kimliği HKM sözleşmesinde | sözleşme | Y-7, O-6 | B | 3 |
| A7 | Ölçüm çözünürlüğü = gün, tek yardımcı | yeniden tasarım | Y-3, O-1 | K | 2 |
| A8 | «Gün sürüyor» durumu | doktrin genişlemesi | O-9 | O | 3 |
| A9 | Telegram'da cevabın bağlamı | yeniden tasarım | Y-9 | K | 2 |
| A10 | Geçmiş gönderiminde gün gün sonuç | yeniden tasarım | Y-5, D-6 | K | 2 |
| A11 | HKM geri yüklemede kuru çalıştırma | yeni yetenek | Y-1 | K | 1 |
| A12 | İçe aktarmada geri alma kopyası güvencesi | yeniden tasarım | O-3 | K | 2 |
| A13 | Hafızada «düştü» ile «unutuldu» ayrımı | yeniden tasarım | O-6 | K | 3 |
| A14 | Yük azaltma ara gününe dokunmaz | yeniden tasarım | O-11 | K | 2 |
| B1 | Sözleşmelerin tek kaynaktan üretimi | derleme zamanı | D-12, PLAN A2 | O | 3 |
| B2 | Ayrıştırıcı kalite ölçümü | ölçüm | KR-1 | K | 2 |
| B3 | HKM'nin kendi sağlık sayaçları | ölçüm | O-7, D-15 | K | 3 |
| B4 | Öneri açlığı ölçüsü | ölçüm | Y-2 | K | 3 |
| B5 | Fiyat tablosu tazeliği | ölçüm | D-16 | K | 4 |
| B6 | HKM saat dilimi ayarı | yapılandırma | KO-1 | K | koşullu |
| B7 | Bildirimin service worker üzerinden gösterilmesi | platform | O-8 | K | 3 |
| B8 | SPİ hızlı girişte eksik kalıplar | küçük kolaylık | — | K | 4 |

---

## A. Düzeltilmesi ya da yeniden tasarlanması gereken özellikler

### A1 · Olumsuzluk ve kip süzgeci — üç modüle tek kaynaktan

- **Kanıt:** KR-1. «7 saat uyumadım» SPİ'de 420 dakikalık antrenman, AYS'de
  7 saat uyku; «40 soru çözmedim» 40 soru; «diksiyonu kapatma» bölüm
  kapatma önerisi. Hepsi gerçek tarayıcıda doğrulandı.
- **Bugün:** HKM'nin `core/dil.py` dosyasında `olumsuz()` var ve Telegram
  yolunu koruyor (`dil.rapor("7 saat uyumadım")` → `None`). Üç modülün
  ayrıştırıcısında (`AYS core/komut.js`, `SPI core/quickentry.js` ve
  `core/proposals.js fromText`, `ESP core/komut.js`) karşılığı yok.
- **Olması gereken:** Bir cümle ya da yan cümle olumsuzluk (-me/-ma,
  -mez/-maz, -medim, -emedim, «değil», «yok», «hiç», «istemiyorum»), gelecek
  ya da istek kipi («-acağım», «-mak istiyorum») ya da çelişki («5 değil 7»)
  taşıyorsa ayrıştırıcı ölçüm **yazmaz**, tercih **uygulamaz**; `sorular`
  listesine «Bunu … olarak mı anlamalıyım?» düşer.
- **Kabul ölçütü:** Tek bir ortak test tablosu (en az 40 cümle: olumlu,
  olumsuz, kipli, çelişkili) üç modülün ayrıştırıcısına verilir; olumsuz ve
  kipli cümlelerin hiçbiri `oneriler` üretmez. Tablo `brand/ortak/`'ta durur
  ve `tools/ortak.py` ile yayılır.
- **Doktrin:** §1.7'yi uygular. Model gerektirmez (§1.1 korunur).
- **Var mı?** Hayır. Modüllerde `olumsuz` araması yalnız `calib.js`'te
  ilgisiz bir hata metni buldu.
- **Boy:** O.

### A2 · Otomatik uygulama yalnız tercihe; ölçüm yazan eylem her zaman önizlemeli

- **Kanıt:** KR-1. Varsayılan `otomatikUygula:'istek'`
  (`AYS core/office.js:61`, `SPI core/office.js:31`) kullanıcının kendi
  cümlesinden gelen **küçük** eylemi sormadan uyguluyor. Küçük eylemlerin
  çoğu ölçüm yazıyor: `soru-yaz`, `uyku-yaz`, `sure-yaz`, `vital-yaz`,
  `seans-ekle`. «Geri al» her izi silmiyor: SPİ'de tek bir yanlış anlaşılmış
  cümle 8 kalıcı rozet bırakıyor (rozet «olay»dır, geri alınmaz).
- **Bugün:** AGENTS.md §1.9 küçük eylemin sormadan uygulanmasına izin
  veriyor, ama bunu «hedef, bir bloğun saati» gibi **tercih** örnekleriyle
  anlatıyor. Ölçüm yazan eylemler de aynı sınıfa girmiş.
- **Olması gereken:** Katalogda eyleme ikinci bir eksen: `yazdigi:
  'tercih' | 'olcum'`. Otomatik uygulama yalnız `tercih` için geçerli olur.
  Ölçüm yazan eylem ayrıştırıcının güveni ne olursa olsun tek satırlık bir
  önizleme gösterir («Uyku: girilmemiş → 7 saat · Yaz / Vazgeç»).
- **Kabul ölçütü:** `otomatikUygula` hangi değerde olursa olsun, ölçüm
  yazan bir eylem `approve` edilmeden deftere yazılmaz; bunu sınayan bir test.
- **Doktrin:** §1.1'deki ayrımı («tercih değiştirilebilir, ölçülmüş sayı
  değiştirilemez») eylem kataloğuna taşır.
- **Var mı?** Hayır. `ACTIONS` kataloğunda yalnız `level` ekseni var.
- **Boy:** K.

### A3 · Sınav sonrası durumu

- **Kanıt:** Y-2. Saat 2027-07-01'e alınınca AYS başlığı «−12 gün TYT
  (TAHMİNİ)» gösterdi, işaret HKM'ye `exam_days_left: −12` gönderdi, HKM her
  gün «Sınava −12 gün kaldı» önerdi ve 3–5. sıralar bir daha hiç duyulmadı.
  Dokuz aylık ufkun sonu tam olarak bu tarih.
- **Olması gereken:** Sınav günü ve sonrası AYS'de açık bir durum: «Sınav
  günü» (0), «Sınav geçti» (negatif). İşaret negatif `exam_days_left`
  göndermez (`missing` gönderir) ya da HKM sıra 2'yi yalnız `0 ≤ gün ≤ 7`
  aralığında ateşler. AYS başlığı negatif sayı yerine durumu yazar ve yeni
  sınav tarihi ya da arşiv seçeneği sunar.
- **Kabul ölçütü:** Saati sınav tarihinin 1 ve 30 gün sonrasına alan iki
  test: başlıkta eksi işareti yok, HKM önerisinde «Sınava −» yok.
- **Var mı?** Hayır. AYS'de `kalan < 0` için bir dal bulunamadı.
- **Boy:** K.

### A4 · «Geri al»ın alan bazında ve sıralı olması

- **Kanıt:** Y-6. «soru 40» ve «soru 20» ardından ilki geri alınınca toplam
  0 oluyor, ikincisi geri alınınca 40. Geri alınan blok «tamamlandı» kalıyor.
- **Olması gereken:** İki güvenli biçimden biri seçilmeli:
  (a) **fark ile geri alma.** `apply` eklediğini kaydeder (`+40`), `revert`
  onu çıkarır. Toplamaya dayalı eylemler için doğal olan bu.
  (b) **alan bazında yığın.** Bir alana sonradan başka bir eylem yazdıysa
  eski eylemin geri alması kapanır: «Bu değer sonradan değişti; önce
  sonrakini geri al.»
  Her iki yolda da `revert`, `apply`'ın değiştirdiği **bütün** alanları (blok
  durumu dahil) geri çevirir.
- **Kabul ölçütü:** Her küçük eylem için «art arda iki uygulama, ilkini geri
  al» testi; sonuç ikincisinin tek başına etkisine eşit.
- **Var mı?** `undo(id)` var; sıra ve fark yok.
- **Boy:** O.

### A5 · HKM bağlantısında akış akış onay

- **Kanıt:** Y-8. Onay kartı «tahlil, ilaç, semptom GİTMEZ» diyor. Aynı anahtar
  günlük tam yedeği, hafıza anlık görüntüsünü, hedef listesini, günün dil
  kartını ve King iş emirlerini de açıyor.
- **Olması gereken:** HKM kartı giden her akışı ayrı satırda, ayrı anahtarla
  gösterir: *günün özeti (sayılar)*, *otomatik yedek (bütün veri)*, *hafıza*,
  *hedefler*, *iş emirleri*. «Tahlil değeri gitmez» cümlesi yalnız özet
  satırının altında durur. Otomatik yedek varsayılan olarak **kapalı** olur
  ya da açılırken «bütün verin, tahliller dahil, HKM'nin klasörüne
  kopyalanır» cümlesini gösterir.
- **Kabul ölçütü:** Yalnız «günün özeti» açıkken `/api/yedek`,
  `/api/memory/sync`, `/api/hedef/sync` uçlarına hiçbir istek gitmez; bunu
  `tools/entegre.js` ölçer.
- **Doktrin:** §1.4 «modüller HKM'yi bilir» ile uyumlu. «Bilmez» diyen
  metinler (B-2) de kalkar.
- **Var mı?** HKM'de gizlilik panosu (Fikir 55) var, ama modele giden
  veriyi sayıyor, HKM'ye gideni değil.
- **Boy:** O.

### A6 · Profil kimliği HKM sözleşmesinde

- **Kanıt:** Y-7. SPİ hanesinde ya da AYS ek profilinde HKM iki profilden
  açıksa ölçümler, hafıza, hedefler ve günlük yedek karışıyor ya da
  birbirini eziyor.
- **Olması gereken:** Ya (a) sync, hafıza, hedef ve yedek gövdeleri
  `profil` taşır ve HKM `(modül, profil)` ile anahtarlar; VP ve brifing
  yalnız **birincil** profile bakar, ya da (b) HKM yalnız bir profilden
  bağlanmaya izin verir ve ikinci profilde «HKM bu cihazda başka bir
  profile bağlı» der.
  (b) daha küçüktür ve dokuz aylık ufuk için yeterlidir.
- **Kabul ölçütü:** İki profil aynı gün yedek yollar; HKM'de iki ayrı yedek
  durur ya da ikincisi reddedilir. Hafıza eşitlemesi öteki profilin
  kaydını unutturmaz.
- **Var mı?** Hayır (`grep profile HKM/core` yalnız `PASSTHROUGH`).
- **Boy:** B (a) · K (b).

### A7 · Ölçüm çözünürlüğü = gün: tek yardımcı

- **Kanıt:** Y-3 (etki), O-1 (ikiz). İşaret varsayılan olarak saatte bir
  gönderiyor; gün içi birikimli ara değerler ayrı ölçüm sayılıyor.
  `cross.py`, `streak.py` ve `twin.series` doğru yapıyor (günün son değeri),
  `twin.snapshot` ve `impact._seri` yapmıyor.
- **Olması gereken:** `db.py`'de tek bir `gun_son_degerleri(modul, metrik,
  bas, bit)` yardımcısı. Ham olayları okuyan her türetilmiş katman bunu
  kullanır; ham olay yine silinmez (MIMARI §8.5).
- **Kabul ölçütü:** Aynı gün 1 ve 5 gönderim yapılan iki ambarda ikiz,
  seri, etki, çapraz ve haftalık rapor aynı sonucu verir.
- **Boy:** K.

### A8 · «Gün sürüyor» durumu

- **Kanıt:** O-9. Saat 10:00'da gelen «20 soru, 60 dk» ANOMALİ sayılıyor ve
  HKM «AYS'nin günlük tabanı karşılanmadı» önerisini ambara yazıyor. Bugünün
  kısmi değeri seri tespitinde de «kırık gün» sayılıyor.
- **Olması gereken:** Günlük tabana göre hüküm yalnız **kapanmış** günler
  için verilir. Bugünün değeri «şimdiye kadar» olarak gösterilir, hüküm
  cümlesi kurulmaz ya da «saat 10:00 itibarıyla 20/80» biçiminde kurulur.
  Kapanış saati kullanıcının akşam yoklama saatinden okunabilir.
- **Doktrin:** Dört etiketin (`ölçüldü / tahmin / hesaplandı / veri yok`)
  yanında bir **zaman** ekseni gerekir; bkz. `HATALAR.md` §6, DK-4.
- **Boy:** O.

### A9 · Telegram'da cevabın bağlamı

- **Kanıt:** Y-9. Açık bir King teklifi varken «Kaç saat uyudun?» sorusuna
  verilen «4» teklife gidiyor; «1» ya da «2» ücretli işi onaylıyor.
- **Olması gereken:** Bir kanalda aynı anda **tek** açık «sayı bekleyen»
  istem olur. İkincisi açılırken birincisi ya kapanır ya da yeni mesaj
  «önce şu teklife cevap ver» der. Telegram'ın `reply_to_message` alanı
  varsa cevap hangi mesaja yazıldıysa ona gider. Ücretli bir teklifin onayı
  çıplak bir rakamla değil «1 onay» ya da düğmeyle olur.
- **Kabul ölçütü:** Açık teklif ve açık soru aynı anda varken «2» ne
  teklifi onaylar ne de sessizce düşer; kullanıcıya hangisini kastettiği
  sorulur.
- **Boy:** K.

### A10 · Geçmiş gönderiminde gün gün sonuç

- **Kanıt:** Y-5, D-6. ESP'de ilk 422 bütün gönderimi durduruyor ve ekranda
  yalnız «422 ile durdu» yazıyor.
- **Olması gereken:** Reddedilen gün atlanır, sebebi toplanır, gönderim
  sürer. Sonunda «58 gün gönderildi, 2 gün reddedildi: 12 Ağustos —
  synthesis_gap_days −12 aralık dışı» biçiminde bir özet çıkar. Ayrıca
  geçmiş güne «bugünden türeyen» hiçbir alan gitmez (retansiyona uygulanan
  kural sentez açığına ve SPİ toparlanma puanına da uygulanır, bkz. O-4).
- **Boy:** K.

### A11 · HKM geri yüklemede kuru çalıştırma

- **Kanıt:** Y-1. Sütun adları tutmayan bir yedek ambarı boşaltıp «ok»
  dönüyor.
- **Olması gereken:** `POST /api/restore` önce `kuru: true` ile çağrılır:
  tablo başına «yazılacak satır / atlanacak sütun / atlanacak satır» sayısı
  döner ve hiçbir şey yazılmaz. Gerçek geri yükleme ancak her tabloda
  yazılacak satır sayısı beyan edilen sayıya eşitse yapılır; değilse 409.
- **Boy:** K.

### A12 · İçe aktarmada geri alma kopyası güvencesi

- **Kanıt:** O-3. Kopya yazılamazsa eski kopya kalıyor; «geri al» yanlış
  duruma dönüyor.
- **Olması gereken:** NOTLAR §7.4'ün kendi önerisi: kopya yazılamazsa içe
  aktarma **reddedilir**. Ayrıca eski kopya içe aktarmadan önce silinir,
  kopyanın bir ömrü olur (ör. 7 gün) ve ekranda kopyanın tarihi
  «içe aktarmanın tarihi» ile karşılaştırılır.
- **Boy:** K.

### A13 · Hafızada «düştü» ile «unutuldu» ayrımı

- **Kanıt:** O-6. Eşitlemede eksik kalan kayıt kullanıcının «unut» sözüyle
  aynı duruma geçiyor ve bir daha dirilmiyor.
- **Olması gereken:** Yeni bir durum: `dustu` (modülün anlık görüntüsünde
  yok). `dustu` kayıt, modül onu yeniden yollarsa etkinleşir; `forgotten`
  yalnız kullanıcının «unut» komutuyla oluşur ve yalnız o kalıcıdır.
- **Boy:** K.

### A14 · Yük azaltma ara gününe dokunmaz

- **Kanıt:** O-11. Ara verilmiş bir güne onaylanan «yükü azalt» teklifi
  günü 90 dakikalık çalışma gününe çeviriyor (yük 0 → 0,5).
- **Olması gereken:** `hafiflet`, günün mevcut yükü hedeflenen yükten zaten
  düşükse (ara günü 0) hiçbir şey yazmaz ve «o gün zaten ara» der. Genel
  kural: bir «azaltma» eylemi günün yükünü hiçbir durumda artıramaz.
- **Kabul ölçütü:** Ara gününe `hafiflet` → `gunYuku` 0 kalır ve cevap
  «zaten ara» olur.
- **Boy:** K.

---

## B. Olması gereken ama olmayan yetenekler

### B1 · Sözleşmelerin tek kaynaktan üretimi

- **Kanıt:** D-12 (niyet kataloğu dört yerde), PLAN.md A2 (kesinlik
  etiketinin iki sözlüğü; `KESINLIK_ILE('olculdu')` hâlâ `undefined`).
- **Olması gereken:** Depo zaten derleme zamanında tek kaynaktan dağıtıyor
  (`tools/ortak.py`, `tools/seviye.py`, `tools/marka.py --kunye`). Aynı
  mekanizmayla `HKM/core/intents.py KINDS` ve kesinlik eşlemesinden
  `brand/ortak/sozlesme.js` üretilir; `--denetle` CI'da koşar.
- **Doktrin:** Paylaşım derleme zamanında olur, çalışma zamanında değil
  (README «Üçü neyi paylaşmaz»); §1.4 korunur.
- **Var mı?** Mekanizma var, bu iki sözleşmeye uygulanmamış.
- **Boy:** O.

### B2 · Ayrıştırıcı kalite ölçümü

- **Kanıt:** KR-1'i hiçbir ölçüm fark etmedi. Depo sürtünmeyi, Goodhart'ı
  ve kalibrasyonu ölçüyor ama «sistem beni doğru anladı mı» sorusunu
  ölçmüyor.
- **Olması gereken:** Otomatik uygulanıp ilk 10 dakikada geri alınan eylem
  oranı ve ayrıştırıcının `anlasilmayan` / `sorular` döndürme oranı, haftalık
  bir sayı olarak. Oran eşiği aşarsa sinyal katmanına (`core/signals.js`)
  tek bir soru düşer.
- **Var mı?** Hayır; `undone` yalnız `proposals.js` içinde geçiyor.
- **Boy:** K.

### B3 · HKM'nin kendi sağlık sayaçları

- **Kanıt:** O-7 (canlı denemede 102 kopuş, hiçbiri sayılmıyor), D-15
  (giden kutusunda eşzamanlı gönderim).
- **Olması gereken:** `tani.py` durum ekranına üç sayı: son 24 saatte kopan
  istek, bir satırın birden çok gönderildiği durum, modülden 422 alan
  gövde. Hepsi «ölçüldü», sıfırsa «0 · ölçüldü».
- **Var mı?** Durum ekranı (Fikir 48) var; bu sayılar yok.
- **Boy:** K.

### B4 · Öneri açlığı ölçüsü

- **Kanıt:** Y-2. Sıra 2 her gün kazanınca 3–5. sıralar haftalarca
  duyulmadı ve bunu hiçbir şey söylemedi.
- **Olması gereken:** Konsey satırına «ESP 23 gündür duyulmadı» gibi bir
  sayı. Doktrin «duyulmayan VP yanılmış değildir» diyor; ne kadar süredir
  duyulmadığı da görünmeli.
- **Boy:** K.

### B5 · Fiyat tablosu tazeliği

- **Kanıt:** D-16. `HKM/core/ai.py` `FIYAT` sabit bir tablo ve tarihi yok.
  Dokuz ayda sağlayıcı fiyatları değişir; tablodaki bir model eski fiyatla
  «ölçüldü» diye yazılmaya devam eder.
- **Olması gereken:** Tablonun yanında bir `FIYAT_TARIHI`; 90 günden
  eskiyse maliyet etiketleri «tahmin» olur ve durum ekranı söyler.
- **Boy:** K.

### B6 · HKM saat dilimi ayarı *(yalnız sunucuya taşınacaksa)*

- **Kanıt:** KO-1.
- **Olması gereken:** `config.json` → `saat_dilimi: "Europe/Istanbul"`;
  bütün `date.today()` ve `datetime.now()` tek bir yardımcıdan geçer.
  Standart kütüphanede `zoneinfo` var, bağımlılık gerektirmez.
- **Boy:** K.

### B7 · Bildirimin service worker üzerinden gösterilmesi

- **Kanıt:** O-8 (Android Chrome
  `new Notification` kurucusunu desteklemiyor).
- **Olması gereken:** Kayıtlı bir service worker varsa
  `registration.showNotification(...)`, yoksa sayfa içi kurucu. İkisi de
  yoksa «Bu cihazda bildirim gösterilemiyor» cümlesi ve anahtar kapalı.
- **Boy:** K.

### B8 · SPİ hızlı girişte eksik kalıplar

- **Kanıt:** «80 kilo», «tansiyon 12/8», «ilacımı aldım», «10 bin adım»
  `SP.Quick.parse` ile `null` dönüyor. Bir şey uydurmuyor (doğru davranış),
  ama en doğal yazılışlar tanınmıyor.
- **Olması gereken:** «tansiyon 12/8» → 120/80 (cmHg → mmHg, önizlemede
  açıkça yazılarak), «80 kilo» → kilo. «İlacımı aldım» hatırlatma işaretine
  bağlanır, ölçüm yazmaz.
- **Boy:** K.

---

## C. Bilerek önerilmeyenler

| Konu | Neden |
|---|---|
| Çok cihaz senkronu | LIFEOS2 §3'te bilerek bekliyor; depo sahibinin kararı «tek cihaz + elle yedek». |
| Tek anahtarlı deponun göçü | NOTLAR §7.3 «sormadan yapma». Bu turda yalnız ölçüm eklendi: dokuz aylık tipik AYS verisi kotanın %17'si, tek yazma 36 ms (bkz. HATALAR.md D-17). Kapasite dokuz ay için risk değil; toplu yazma hızı risk. |
| Büyük dosyaları bölmek | GELISTIRME_RAPORU Bölüm 5. |
| DEVIR «büyükler» (1, 2, 3, 7, 21, 29, 42, 43, 54) | Zaten onaylı sırada. |
| Part 9 tek tasarım | Çekmece haritası onay bekliyor. |
| XP'ye seri, sıralama ya da uyarı | Yapılmayacaklar listesinde. |
| Dil modelini ayrıştırıcı yapmak | §1.1'i zorlar; A1 aynı sorunu modelsiz çözüyor. Yine de doktrin tartışması olarak HATALAR.md §6'da (DK-1) yer alıyor. |

## D. Önerilen sıra

1. **Hemen (veri doğruluğu):** A2, A1, A11. Varsayılan ayarla her gün sahte
   ölçüm yazılmasını ve HKM ambarının «ok» diyerek boşalmasını durdurur.
2. **Dokuz aylık ufkun sonuna kadar:** A3 (sınav günü ufkun sonu), A7, A9,
   A10, A4, A5, A12, A14.
3. **Profil kullanılacaksa önce:** A6 (b), A13.
4. **Ölçüm:** B2, B3, B4. Bu turdaki hataların hiçbirini mevcut ölçümler
   göremedi; bu üçü benzerlerini görünür kılar.
5. **Sonra:** B1, B5, B7, B8; B6 yalnız HKM sunucuya taşınırsa.
