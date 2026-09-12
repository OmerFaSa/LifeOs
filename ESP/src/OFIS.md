# Ofis — yedi ajanlı entelektüel ekip

ESP'nin içinde yedi küçük ajan çalışır: altı uzman ve bir orkestratör. Hepsi
aynı veriyi değil, **kendi alanındaki** veriyi okur; birbirleriyle konuşur;
sonunda **tek bir karar** çıkar.

| Ajan | Rol | Neye bakar | Neye bakmaz |
|---|---|---|---|
| **Patron** | Baş danışman | Altı uzmanın raporu, çelişkinin çözümü, haftalık rota | Kendi hesabını yapmaz |
| **Polyglot Mentor** | Yabancı dil | Aktif kelime, SRS retansiyonu, shadowing süresi, i+1 üretim | Felsefi tez, müzik teorisi, üslup |
| **Socrates** | Felsefe ve diyalektik | Argüman tutarlılığı, safsata bulguları, açık tezler, primer metin | Dil hatası, gitar tekniği |
| **Maestro** | Müzik ve gitar | Temiz BPM eşiği, akor/mod deşifresi, tıkanılan geçişler, repertuar | Diksiyon, dil grameri |
| **Demosthenes** | Diksiyon ve hitabet | Artikülasyon, nefes, vurgu, konuşma hızı | Argüman analizi, gitar |
| **Aristoteles** | Derin okuma | Atomik not, kavram bağlantı matrisi, sentez katsayısı | Konuşma pratiği, yazı üslubu |
| **Montaigne** | Yazı ve üslup | Kelime üretimi, cümle uzunluğu, tekrar, taslak–revizyon | Kaynak doğrulama, tezin doğruluğu |

Yetki ayrımı kasıtlıdır: bir ajan alan dışına çıkan bir soru görürse sahibine
yönlendirir, **cevap uydurmaz**. Çelişkiyi Patron çözer.

Ad seçimi bir süs değildir: kullanıcı «diksiyon ajanı» demez, «Demosthenes»
der ve hangi masaya gittiğini hatırlar.

---

## Temel ilke: kural motoru otoritedir

```
Intellect / SRS / Acoustic / Planner  →  brief(agentId)  →  model  →  ekranda cümle
     (skor, eşik, sıradaki adım)          (rapor, JSON)     (yorum)
```

- **Sayı** kural motorundan gelir. Ajan hesap yapmaz, geldiği gibi kullanır.
- **Karar** `ESP.Planner.nextAction()`'dan gelir. Toplantı sonunda Patron kararı
  *gerekçelendirir*, değiştiremez. Model «bunun yerine şunu yap» derse
  tutanaktaki eylem yine kural motorununkidir.
- **Gündem** `ESP.Office.agendaCandidates()` içindeki puanlamadan gelir; model
  gündem seçmez.
- **Model yoksa ofis kapanmaz.** Brifing doğrudan cümleye çevrilir
  (`ESP.Office.ruleText`) ve ajanlar «kural motoru» rozetiyle konuşur.

Ekranda her cümlenin altında hangi kaynaktan geldiği yazar. Bu rozet süs
değildir: kullanıcının bir cümleye ne kadar güveneceğini belirler.

---

## Brifing — ajanın gördüğü tek şey

Her ajan yalnızca kendi brifingini görür. Brifing **saf bir nesnedir**: ekranda
da, modelde de, testte de aynı şey okunur. İçinde cümle değil ölçüm vardır ve
her sayının yanında kesinlik etiketi durur.

```js
ESP.Office.langBrief()      // kart sayısı, vade, retansiyon, pratik süresi
ESP.Office.philoBrief()     // açık tez, cevaplanmamış itiraz, primer metin
ESP.Office.musicBrief()     // temiz eşikler, plato, hedefe ulaşma oranı
ESP.Office.dictionBrief()   // WPM, hata oranı, eğilim
ESP.Office.readingBrief()   // not, bağ, kaynak, yazar, SSK
ESP.Office.writingBrief()   // haftalık kelime, revizyon, okunabilirlik
ESP.Office.patronBrief()    // altısı birden + çapraz bulgu + sıradaki iş
```

**Modele giden şey budur ve fazlası değildir.** Ham ses kaydı yoktur (dosya hiç
oluşmaz); atomik notun cümlesi, taslağın metni, tezin metni ve profil adı
brifinge **girmez**. Bu dört ayrı testle denetlenir (`office.test.js`).

Tek istisna kullanıcının **açıkça paylaştığı** parçadır: Sempozyum'da bir teze
tıklayıp «Socrates'e sor» dendiğinde tezin metni **sorunun içinde** gider.
Fark önemli: brifing her çağrıda otomatik gider, soru yalnızca kullanıcı
istediğinde.

Danışma ekranında brifingin ham JSON'u açılabilir. Kullanıcı ajanın ne
gördüğünü tam olarak görebilmelidir; görmediği bir şeye dayanarak konuşamaz.

---

## Çelişki çözümü — öncelik sırası

Altı disiplin aynı anda zaman ister; sınırlı olan kaynak **zamandır**, doğruluk
değil. `ESP.PRECEDENCE`:

| Sıra | Kural | Neden |
|---|---|---|
| 1 | Tıkanmış temel | Yeni içerik eskiyi çökertmeden eklenmez |
| 2 | Zamana bağlı hedef | Dış dünyanın takvimi iç plandan önce gelir |
| 3 | Vadesi geçmiş SRS kartları | Unutma eğrisi beklemez |
| 4 | Sentopik sentez | Derinlik, hacimden sonra gelir |
| 5 | Yeni içerik / repertuar genişletme | En son — mevcut temel sağlamken |

Üstteki alttakini her zaman yener.

**Örnek.** Maestro «bu hafta yeni bir parçaya geçmeye hazırsın» derken Polyglot
«SRS retansiyonun %38'e düştü» diyorsa: temel disiplin yeni içeriği yener. Ama
Maestro'nun işi bitmez — mevcut repertuarda BPM artışıyla ilerleme önerir.
*«Hiçbir şey yapma» demek değildir.*

---

## Masalar arası devir

Doktrinin merkezinde **«her ajan yalnızca kendi alanına bakar»** durur. Ama bir
masanın BULGUSU başka bir masanın İŞİ olabilir. Patron'un tek işi o devri
görmek ve sıraya koymaktır.

```js
ESP.Office.handoffs()             // { id, from, to, finding, route }
ESP.Office.handoffsFor('polyglot')  // { out:[…], in:[…] } — masanın kendi defteri
```

Beş kaynak, hepsi kural motorundan:

| Devir | Kaynak |
|---|---|
| Polyglot → Aristoteles | Dil çalışılıyor ama okuma hiç girilmemiş: kartlar bağlamda görülmüyor |
| Aristoteles → Montaigne | Not birikiyor, yazı oturumu yok: not yığını yazılana kadar sermaye değil |
| Maestro → Demosthenes | Enstrüman çalışılıyor, diksiyon hiç açılmamış: ikisi aynı zamanlama duyusunu kullanır |
| Socrates → Montaigne | Açık tez var, yazı yok: bir tez çoğu zaman yazılırken kapanır |
| Polyglot → Patron | Kart birikmiş ve seri kopmuş: asgari gün borcu büyütmeden kapatır |

Üç kural devri dürüst tutar:

1. **Devir bir tavsiye değildir.** «Şu ölçüldü, şu masaya düşüyor» der.
2. **Ölçülmemiş bir şey devredilemez.** Tahmin devir üretmez.
3. **Her satır tıklanabilir.** Bulgunun düştüğü ekranı açar; yoksa devir bir
   cümleden ibaret kalır.

### Renk ayrımı

Masanın sol kenarındaki kimlik şeridi **bir durum değil bir imzadır**: masanın
kime ait olduğunu söyler. Durum renkleri (kırmızı/sarı/yeşil) kimlik şeridinde
asla kullanılmaz. İki renk sistemi aynı yüzeyde karışmaz — karışırsa ofis
okunamaz hale gelir.

---

## Çıktı denetimi

Model çıktısı basılmadan önce ev kurallarına karşı denetlenir
(`ESP.Office.validate`). Üç şey aranır:

| Denetim | Ne arar |
|---|---|
| Sahte sertifikasyon | «Artık C1 seviyesindesin, sertifikaya hazırsın» |
| Mutlak yetenek yargısı | «Bu alanda yeteneklisin / yeteneksizsin» |
| Sonuç garantisi | «Bu tempoyla kesinlikle üç ayda konsere çıkarsın» |
| Estetik otorite | «Bu deneme yayımlanmaya hazır, kusursuz» |
| Alan ihlali | Ajan kendi disiplininden hiç söz etmeden başkasınınkini konuşuyor |
| Desteksiz sayı | Metinde geçen ama brifingde bulunmayan sayı |

**`validate` metni yeniden yazmaz, işaretler.** Sessizce düzeltmek anlamı
tersine çevirebilir. Çağıran ya uyarıyı gösterir ya kural motorunun cümlesine
düşer; ekranda «kurallara takıldı» rozeti görünür. Model susturulmaz, yalnızca
sınırın dışına çıkması engellenir.

Küçük sayılar desteksiz sayılmaz (`ESP.GROUNDING.numberFloor = 4`): «iki
itiraz» ya da «3 gün» bir ölçüm iddiası değil dilin kendisidir.

---

## Masa notları

Not bir tavsiye değil **bulgudur**. Koşul sağlandığında kendiliğinden bırakılır,
koşul geçtiğinde kendiliğinden kalkar. Kullanıcı silmez.

| Tür | Ne zaman |
|---|---|
| **Tıkanma** | Bir teknik ya da kavram 14+ gündür ilerlemiyor |
| **Vadesi geçmiş** | SRS kartı ya da sentopik not güncellemesi gecikti |
| **Kazanım** | Yeni BPM eşiği, seri rekoru, kapanan bir açık |
| **Bilgi** | Haftalık pratik dağılımı dengesiz |

---

## Toplantı

Gündem seçilir, altı uzman sırayla konuşur, Patron kapatır. Her tur **ayrı bir
çağrıdır** ve geldiği anda ekrana basılır — hepsinin bitmesi beklenmez. Uzun
süren bir toplantıda kullanıcı ilerlemeyi görür.

Kapanışta Patron uzmanların söylediklerini okur, çelişki varsa öncelik sırasına
göre çözer, tek bir karar yazar ve gerekçelendirir. Tutanaktaki karar
`ESP.Planner.nextAction()`'dan gelir; Patron onu değiştiremez.

«Kararı takibe al» düğmesi kararı takip listesine yazar. **Kapanmamış karar iki
günden uzun sürerse** ofis bunu gündeme taşır. Karar vermek değil, **kararın ne
yaptığını görmek** sistemi ilerletir: bu yüzden kapatırken sonuç yazılır —
sonuç yazılmadan karar kapanmaz.

---

## Haftalık rapor

*«İyi haberi kötü haberin arkasına saklama.»* Kötü olan önce söylenir:

> «Diksiyon pratiği bu hafta hiç yapılmadı **fakat** felsefi okuma hedefi %140
> aşıldı ve iki yeni sentopik bağlantı kuruldu.»

---

## Günlük brifing

Günde tek model çağrısı. Sonuç güne yazılır; aynı gün tekrar çağrılmaz. Model
kapalıysa brifing yine üretilir — kural motorunun cümlesiyle.
