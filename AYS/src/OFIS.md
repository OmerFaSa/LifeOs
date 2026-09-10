# Ofis — beş ajanlı çalışma ekibi

Rota'nın içinde beş küçük ajan çalışır. Hepsi aynı veriyi değil, **kendi
alanındaki** veriyi okur; birbirleriyle konuşur; sonunda **tek bir karar** çıkar.

> Eskiden ayrı bir "AI koç" katmanı vardı; kaldırıldı. Koçluk işini artık bu
> ofis yapar. Koçun taşıdığı iki yetenek ofise devredildi ve ücretsiz
> modellerle de çalışır hâle geldi: **çıktı doğrulama** (`Office.validate`) ve
> **nottan kart üretimi** (`Office.generateCards`). Ev kuralları
> `data/rules.js` içinde ortak kaynak olarak durur.

| Ajan | Rol | Neye bakar | Neye bakmaz |
|---|---|---|---|
| **Patron** | Ofis şefi | Dört uzmanın raporu, sıradaki hamle, karar kapısı | Kendi hesabını yapmaz |
| **Tuna** | TYT uzmanı | TYT kapanışı, TYT denemeleri, TYT net bandı | AYT'ye karışmaz |
| **Yaman** | AYT uzmanı | AYT kapanışı, AYT denemeleri, alan dersleri | TYT'ye karışmaz |
| **Rana** | Rehberlik | Uyku, enerji, plan tamamlama, sapma nedenleri | Net ve konu yorumlamaz |
| **Deniz** | Analist | Denemeler, hata paretosu, risk sıralaması, borçlar | Tavsiye vermez, bulgu bildirir |

Yetki ayrımı kasıtlıdır: bir ajan alan dışına çıkarsa sahibine yönlendirir.
Çelişkiyi Patron çözer.

## Temel ilke: kural motoru otoritedir

Bu, koç katmanıyla (`core/coach.js`) aynı doktrindir ve ofiste de bozulmaz.

```
calc.js / analytics.js   →  brief(agentId)  →  LLM  →  ekranda cümle
   (hesap, eşik, karar)      (rapor, JSON)     (yorum)
```

- **Sayı** kural motorundan gelir. Ajan hesap yapmaz, geldiği gibi kullanır.
- **Karar** `Calc.nextAction()`'dan gelir. Toplantı sonunda Patron kararı
  *gerekçelendirir*, değiştiremez. Model "bunun yerine şunu yap" derse
  tutanaktaki eylem yine kural motorununkidir.
- **Gündem** `Office.agendaCandidates()` içindeki puanlamadan gelir; LLM gündem seçmez.
- **Model yoksa ofis kapanmaz.** Brifing doğrudan cümleye çevrilir
  (`Office.ruleText`), ajanlar "kural motoru" rozetiyle konuşur.

Çıktı ayrıca `Coach.validate()` ile ev kurallarına karşı denetlenir: garanti
vermek, kaynak değiştirmeyi önermek, uykudan feda ettirmek, tıbbi tavsiye —
bunlar yakalanır ve kullanıcıya düzeltme notu olarak gösterilir.

## Üç ekran

| Ekran | Yol | Ne yapar |
|---|---|---|
| **Ofis** | `office` | Pano, beş masa, günün tek işi, takipteki kararlar, kota ve model ayarları |
| **Ekip sohbeti** | `team` | Seçilen ajanla konuşma; ajan yalnız kendi raporunu görür |
| **Toplantı odası** | `meeting` | Tur tur ilerleyen canlı toplantı + rapor + tutanak arşivi |

## Toplantı akışı

Toplantı tek turluk bir yoklama değil, **tur tur ilerleyen bir fikir
patlamasıdır**. Her turun ayrı bir sorusu vardır; bu yüzden ajanlar aynı
cümleyi tekrarlamaz:

| Tur | Ajanlardan istenen |
|---|---|
| 1. Durum tespiti | Kendi alanından tek bulgu |
| 2. Fikir turu | Gündemi çözecek tek somut fikir, öncekilerden farklı |
| 3. İtiraz turu | Masadaki hangi fikir tutmaz, neden |
| 4. Oylama turu | Fikirlerden birini seç, numarasıyla başla |
| 5. Toparlama | Kendi alanına düşen tek iş |

**Çapraz soru.** Tur aralarında kural motoru iki masanın verisi arasında
çelişki arar (plan tutmuş görünürken analiz borcu duruyorsa, kapanış yüksekken
medyan düşüyorsa, plan tutmuş ama uyku düşmüşse, kapanış yüksekken tekrar borcu
birikmişse). Çelişki bulunursa Patron ilgili ajana **tek** takip sorusu sorar ve
o ajan yanıtlar. Çelişkiyi kural motoru bulur; model çelişki uyduramaz.
Aynı çelişki bir toplantıda iki kez sorulmaz.

**Oylama.** Fikir turundaki öneriler numaralanır, her uzman birini seçer.
Sayımı kural motoru yapar ve oyları **güven skoruyla ağırlıklandırır**:
önerisi tutan ajanın oyu daha ağır basar. Model numara yazmadıysa oy sayılmaz —
uydurma bir oy tabloyu bozar. Kural motoru modunda oy deterministiktir:
sıradaki işin sahibi olan ajanın fikrine gider.

Her turda dört uzman sırayla konuşur: `Deniz → Tuna → Yaman → Rana`.
Patron açar; açık bir karar varsa **önce onun hesabını sorar**.

**Toplantıyı sen bitirirsin.** İstediğin turda "Bitir ve rapor al"a basarsın;
turlar dolarsa toplantı kendiliğinden durur ama kapanmaz — kapatmak yine
senin kararın. Araya girip **söz alabilirsin**; söylediğin tutanağa girer ve
sonraki ajanlar onu görür.

Her uzman şunları görür: **gündem** + **turun sorusu** + **kendi brifingi** +
**o ana kadar söylenenlerin son dördü** + **kendi geçmiş sözleri** (tekrar
etmesin diye). Ham veriye hiçbir ajan erişemez.

### Rapor

Toplantı bitince rapor üretilir ve tutanakla birlikte saklanır:

- Patron'un kapanış metni (özet)
- Karar — kural motorunun belirlediği tek iş
- **Kim ne dedi** — ajan başına, tur tur
- Senin sözlerin
- Kural motoru uyarıları
- **Dayandığı veri** — kararın verildiği andaki sayılar

Rapor ayrıca **oylama tablosunu** ve **çapraz soru yanıtlarını** taşır.
`Office.reportText(m)` raporu düz metne çevirir; ekrandaki "Kopyala" ve
"Raporu indir" bunu kullanır. Tutanaklar `meetings/<id>` altında saklanır;
en son 20 tanesi tutulur ve arşivde aranabilir.

Toplantı **sesli dinlenebilir**: her ajanın sesi perde ve hızla ayrılır,
kimin konuştuğu bakmadan anlaşılır. Konuşma metninde geçen ajan adları
tıklanabilir — "bu Tuna'nın alanı" dendiğinde o masaya geçilir.

### Karar takibi

Her toplantı bir **karar** bırakır ve karar `open` durumda başlar. Ofis
ekranındaki "Takipteki kararlar" kartından `yapıldı` ya da `devret` ile
kapatılır. Kapanmayan karar bir sonraki toplantının açılışında Patron'un
önüne düşer — ofisi gerçek yapan şey budur.

## Ücretsiz modeller

Ofis, tarayıcıdan doğrudan çağrılabilen ücretsiz uçları destekler
(`data/providers.js`):

| Sağlayıcı | Anahtar | Dakikada | Günde | Not |
|---|---|---|---|---|
| Yerleşik | gerekmez | — | — | Uygulama Claude içinde çalışıyorsa açıktır |
| OpenRouter | `sk-or-…` | 20 | 50 · kredi yüklediysen 1000 | Ücretsiz modellerin çoğu burada |
| Groq | `gsk_…` | 30 | 1000–14 400 | En hızlısı; toplantı için en akıcı |
| Google AI Studio | `AIza…` | 15 (Flash-Lite 30) | 1500 | Günlük hakkı en geniş olan |
| Özel uç | değişir | sen yazarsın | sen yazarsın | OpenAI uyumlu `/chat/completions` |

Sayılar `data/providers.js` içinde `limits` alanında, kaynağı ve tarihi
`checked` alanında durur. Hesabında farklıysa Ofis → Ayarlar'dan düzeltebilirsin.

### İstek sınırı hiç aşılmaz

`core/quota.js` sınırı **motorda** uygular; ekranların bunu düşünmesi gerekmez:

- **Aralık koyar.** İki istek arasına en az `60000/RPM` ms boşluk bırakır, yani
  patlama hiç oluşmaz. Toplantının "sırayla konuşuluyor" ritmi bundan gelir.
- **Günü sayar.** Günlük sayaç `localStorage`'da durur, sayfa yenilense de
  kaybolmaz. Gün dolduysa beklemek yerine açıkça söyler (`daily_quota`).
- **Cezalandırır.** Sağlayıcı yine de 429 dönerse pencere kapatılır ve
  `Retry-After` kadar beklenir.

Güvenlik payı (%15) **yalnız dakikalık sınıra** uygulanır. Günlük sayaçta pay
yoktur: orası bir zamanlama sorunu değil düz bir sayımdır ve pay düşmek
ücretsiz hakkın bir kısmını harcamadan çürütürdü.

Sayaçlar sağlayıcı+model başına ayrıdır: Groq'ta sınıra takılmak Gemini'yi durdurmaz.

**Model kimlikleri eskir.** Listedeki kimlikler sağlayıcılar tarafından
değiştirilir; ayar sayfasındaki *"Model kimliğini elle yaz"* alanı bu yüzden
vardır. Listeyi güncellemek için yalnızca `data/providers.js` düzenlenir.

### Anahtar nerede durur

`localStorage['rota.llm.keys']` — **uygulama verisinden ayrı** bir anahtarda.
Yedeğe girmez (`Store.exportAll` başka bir anahtarı okur), buluta gitmez,
modele gönderilmez, ekranda hep maskeli gösterilir.

### Çoklu anahtar

Bir sağlayıcıya **birden çok API anahtarı** verilebilir. Kota anahtar başına
sayıldığı için ikinci anahtar günlük hakkı ikiye katlar — ücretsiz katmanda en
ucuz büyüme yolu. Motor kotası müsait olanı seçer, dolanı atlar. Ayar ekranı
anahtarları tek tek listeler ve her birinin günlük kullanımını gösterir.

### Çevrimdışı

Bağlantı yokken istek hiç gönderilmez: kota harcanmaz, sebep doğru söylenir.
Toplantı bitmez **duraklar**; konuşulanlar durur ve bağlantı gelince kaldığı
yerden devam eder.

### Yedek zinciri

Ücretsiz modeller sık sık istek sınırına takılır. `Office.chainFor()` şu sırayı
kurar ve ilk çalışanı kullanır:

```
ajanın kendi modeli → ofis varsayılanı → aynı sağlayıcının diğer ücretsiz modelleri → yerleşik
```

Sınır, sunucu hatası, bilinmeyen model ve zaman aşımı yedeğe geçirir.
Anahtar hatası geçirmez — beklemenin anlamı yoktur. Zincirin tamamı düşerse
ajan kural motoru metnine döner ve bunu rozetle söyler.

Bir toplantı 6 model çağrısıdır; ajan başına model seçerek Patron'a güçlü,
uzmanlara hızlı model verilebilir.

### Yanıt bütünlüğü — cümle yarıda kalmaz

Ajanların yazısının yarıda kesilmesinin dört ayrı nedeni vardı; dördü de
`core/llm.js` içinde kapatıldı ve testle kilitlendi:

| Neden | Ne oluyordu | Çözüm |
|---|---|---|
| **Akışın son karesi** | SSE gövdesi son `data:` satırını yeni satırla kapatmadan bitiyor, o satır tamponda kalıp atılıyordu | Akış bitince tampon boşaltılır |
| **Çok baytlı harf** | `ç ğ ı ö ş ü` iki bayttır; parça sınırına denk gelirse son harf düşüyordu | Bitişte çözücü de boşaltılır (`decode()`) |
| **Token sınırı** | `max_tokens` 200–420'ydi ve `finish_reason` hiç okunmuyordu: model cümle ortasında kesiliyor, kimse fark etmiyordu | Bütçeler üçe katlandı (`BUDGET`), bitiş sebebi okunur |
| **Gemini düşünmesi** | 2.5 ailesinde "düşünme" aynı bütçeden yer; cevap boş ya da yarım dönüyordu | Destekleyen modelde `thinkingBudget: 0` |

Kesilme yine de olursa üç kademe devreye girer:

1. **Devam isteği.** Yanıt `finish_reason: length` ile dönerse model kaldığı
   yerden sürdürülür (en fazla 2 ek istek). Yarım kalmış son kelime atılır ve
   modele nerede kesildiği gösterilir, böylece birleştirme ne kelime böler ne
   kelime kaybeder. Örtüşen tekrar tek kez yazılır.
2. **Sarkan cümleyi kırp.** Devam hakkı bittiyse yarım kalan son cümle atılır —
   ama yalnız metnin gövdesi korunuyorsa. Kesilen cümle metnin çoğuysa
   kırpılmaz: yarım cümle kötüdür, boş ekran daha kötüdür.
3. **Söyle.** Yanıt hâlâ kesikse `truncated` bayrağı ekrana kadar gider;
   kullanıcı eksik cümleyi sessizce okumaz.

Devam isteği düşerse eldeki sağlam metin döner — hata gösterilmez.
Bütçeler `core/office.js` içindeki `BUDGET` tablosunda tek yerde durur.

## Ajan defteri — uydurmadan hatırlama

Bir ekip üyesini değerli yapan şey aylardır seni izliyor olmasıdır. Ama LLM'e
"hatırla" demek ona uydurma izni vermektir. Bu yüzden hafıza, modelin
hatırladığı değil **verinin desteklediği** şeydir (`core/journal.js`):

**Bulunan gözlem.** Kural motoru geçmişi tarar ve örüntüyü kendisi bulur:
hangi gün daha çok blok atlanıyor, plan kaç haftadır hedefin altında, aynı
atlama nedeni tekrar ediyor mu, uykunun deneme netine ölçülebilir etkisi var mı,
analiz borcu alışkanlığa mı dönüştü, kapanan konu yeniden açılıyor mu.
Saklanmaz — her okumada yeniden hesaplanır, bu yüzden bayatlamaz. Belirgin bir
fark yoksa gözlem üretilmez: zayıf ilişkiden çıkarım yapılmaz.

**Önerilen gözlem.** Ajan yapısal bir ölçüt önerir (`{ölçüt, karşılaştırma,
eşik}`); ölçüt listesi **kapalıdır**, ajan yeni ölçüt uyduramaz. Kural motoru
gözlemi veri üzerinde çalıştırır; doğrulanmayan gözlem deftere girmez. Deftere
girmiş gözlem de her okumada yeniden doğrulanır ve artık doğru değilse düşer.

Serbest metin hiçbir yoldan hafızaya giremez.

**Güven skoru.** Kararın hangi ajanın alanına düştüğü kural motorunun iş
anahtarından (`Calc.nextAction`) türetilir; bir ajanın alanına düşen kararların
kaçı uygulandı ölçülebilir. Oylamada oy ağırlığı buradan gelir.

## Masa notları — ofis sen kapısını açmadan çalışır

On eşik izlenir; aşılınca ilgili ajan masasına not bırakır: analiz borcu,
tekrar borcu, açık yanlış, uyku, plan tamamlama, davranış serisi, TYT/AYT
düşüşü, bekleyen ikinci ölçüm, açık karar. Notlar **tamamen kural motorundan**
üretilir: model gerekmez, kota harcanmaz, çevrimdışı çalışır. Önem sırasına
dizilir ve Bugün ekranındaki "Ofisten" kartında da görünür.

**Günlük brifing.** Patron sabah masaları tek cümleyle özetler; gün boyu
önbellekten okunur (günde 1 istek, ayarlardan kapatılabilir). Brifing dayandığı
not kümesinin parmak izini taşır: notlar gün içinde değişirse **bayat**
işaretlenir. Kural motoru modunda bayat brifing kendiliğinden tazelenir;
model bağlıyken kota harcamamak için tazeleme kullanıcıya bırakılır.

**Bildirim.** Ofis acil bir not bulduğunda ya da karar iki gündür açık
kaldığında haber verir. İzin açıkça istenir, günde en fazla bir bildirim gider.

## Çıktı denetimi — modelin yazdığı da denetlenir

Ajanın her yanıtı üç katmanda denetlenir (`Office.validate`):

| Katman | Ne arar |
|---|---|
| Ev kuralları | Garanti, kaynak değiştirme, uykudan feda, tıbbi tavsiye |
| **Sayı sadakati** | Metindeki her sayı brifingde var mı — yoksa uydurmadır |
| Alan ihlali | Uzman kendi masasının dışına çıktı mı |

Sayı denetimi Türkçe yazımı tanır (`19,50` ondalık · `1.500` binlik · `%78`
yüzde) ve doğal dil sayılarını (≤12) ile yılları eler — yanlış pozitif
kullanıcıyı yorar.

`tools/evalagents.js` sabit senaryolarla her ajanı konuşturup makineyle puanlar:
uydurulan sayı, alan ihlali, ev kuralı, cümle sınırı, Türkçe harf oranı, süre.
Birden çok model tek komutla karşılaştırılabilir.

```bash
ROTA_PROVIDER=groq ROTA_KEY=gsk_… ROTA_MODEL=llama-3.3-70b-versatile,llama-3.1-8b-instant   node tools/evalagents.js
```

## Öneri kutusu — ofis artık sisteme dokunabilir

Ofis bugüne kadar yalnızca **okuyordu**. Artık yazabilir, ama tek bir yoldan:

```
ajan önerir → kural motoru DOĞRULAR → SEN onaylarsın → motor uygular → geri alınabilir
```

**Onaysız hiçbir şey değişmez.** `core/proposals.js` içinde "otomatik uygula"
diye bir yol yoktur ve olmamalıdır: ofisin değeri önerisinde, yetkisinde değil.

### Üç kural

1. **Kapalı katalog.** Ajan yalnızca `data/actions.js`'teki bir eylemi
   önerebilir. Serbest metin hiçbir yoldan eyleme dönüşmez — ajan
   defterindeki "kapalı ölçüt listesi" ile aynı doktrin.
2. **Yapısal parametre.** Her eylemin parametreleri adıyla ve türüyle
   yazılıdır. Fazladan alan taşınmaz, uydurulan değer kural motorunda
   doğrulanamaz ve geçmez.
3. **Geri alınabilirlik.** Uygulanan her eylem, uygulamadan **önce** alınmış
   bir anlık görüntü bırakır; tek dokunuşla geri alınır.

### Katalog

| Eylem | Kim önerebilir | Neye dokunur |
|---|---|---|
| `topic-review` | Tuna, Yaman | Konu durumu — kapalı görünen konu yeniden açılır |
| `block-add` | Rana, Tuna, Yaman | Bugünün planı — tekrar bloğu eklenir |
| `cards-due-today` | Deniz | Tekrar kartları — geciken tekrarlar bugüne çekilir |
| `card-from-error` | Deniz | Tekrar kartları — açık yanlıştan kart üretilir |
| `week-target` | Patron, Rana | Haftalık soru hedefi |
| `decision-close` | Patron | Karar takibi |

Yetki ayrımı burada da geçerlidir: Rana konu durumuna dokunamaz, Deniz
haftalık hedefi değiştiremez. `agents` alanı bunu kilitler.

### İki öneri kaynağı, tek kapı

- **Kural motoru** (`Proposals.suggest`) veriden kendisi çıkarır: model
  gerekmez, kota harcamaz, çevrimdışı çalışır. Masa notlarıyla aynı doktrin —
  eşik aşılırsa öneri doğar, aşılmazsa doğmaz.
- **Ajan** (`Proposals.fromModel`) yanıtının sonuna tek bir JSON nesnesi
  ekleyebilir. Nesne katalog ve şemaya uymuyorsa **sessizce düşürülür**;
  konuşma metninden ayrılır, ekranda JSON görünmez.

Doğrulama her iki kaynakta da aynıdır ve **her çizimde yeniden** çalışır:
bekleyen bir öneri, arada veri değiştiği için geçersizleşmiş olabilir —
o öneri kullanıcıya hiç gösterilmez. Onay anında da yeniden doğrulanır;
veri değişmişse öneri `stale` işaretlenir ve uygulanmaz.

### Ekranda

Ofis ekranındaki **kat planı** beş masayı bir zemin üzerinde gösterir: kimin
ışığı yanıyor, kimin masasında iş birikmiş, kim şu an konuşuyor. Masaya
dokununca o masanın raporu açılır.

**Ofisin önerileri** kartı ne değişeceğini onaydan önce *önce → sonra*
satırlarıyla gösterir. Uygulananlar ayrı bölümde durur ve "Geri al" düğmesi
taşır.

## Gizlilik

Modele giden her nesne `CoachTools.sanitize()` süzgecinden geçer: ad, şehir,
okul, e-posta gibi anahtarlar her derinlikte silinir; profildeki kişisel
değerler metin içinde de maskelenir. Ofis brifingleri yalnızca davranışsal ve
akademik metrik taşır.

## Dosya haritası

| Dosya | Sorumluluk |
|---|---|
| `data/agents.js` | Beş ajanın kimliği, yetki alanı, tur soruları, istemleri (deklaratif) |
| `data/actions.js` | Ajanların önerebileceği eylemlerin kapalı kataloğu (deklaratif) |
| `core/proposals.js` | Öneri kutusu: doğrulama, önizleme, onay, uygulama, geri alma |
| `data/providers.js` | Sağlayıcı, model ve istek sınırı kataloğu (deklaratif, sık değişir) |
| `data/rules.js` | Ev kuralları, yasak kalıplar, üslup, kart kuralları |
| `core/quota.js` | İstek sınırı: aralık koyar, günü sayar, 429'u cezalandırır |
| `core/journal.js` | Ajan defteri: doğrulanabilir gözlem, örüntü bulma, güven skoru |
| `core/llm.js` | Taşıma: fetch, SSE akış, hata haritası, anahtar deposu, yedek zinciri |
| `core/tools.js` | Veri okuma katmanı + gizlilik süzgeci (`sanitize`) |
| `core/office.js` | Brifingler, sohbet, gündem, turlu toplantı, rapor, karar takibi |
| `screens/office.js` | Pano, masalar, günün kararı, kota, model ayarları |
| `screens/team.js` | Ajanla sohbet |
| `screens/meeting.js` | Canlı turlu toplantı + rapor + tutanak arşivi |
| `tests/office.test.js` | 150 test: kayıt, brifing, yetki, gizlilik, gündem, tur, oylama, çapraz soru, defter, not, rapor, karar, kota, taşıma |
| `tools/evalagents.js` | Model karşılaştırma: ajanları senaryolarda konuşturup makineyle puanlar |

## Yeni ajan eklemek

1. `data/agents.js`'e kimlik ve istem ekle (`id`, `name`, `role`, `initial`,
   `desk`, `scope`, `reads`, `system`, `ask`, `maxSentences`).
2. `core/office.js` içindeki `BRIEFS`'e o ajanın kural motoru brifingini yaz —
   `headline`, üç `metrics`, sıralı `findings`, tek `suggestion`, `data`.
3. Toplantıda konuşacaksa `R.MEETING_ORDER`'a ekle.
4. `css/tokens.css`'e `--agent-<id>` rengini üç blokta da tanımla
   (açık, `prefers-color-scheme`, `[data-theme="dark"]`) ve
   `components.css`'e `.agentav--<id>` kuralını ekle.
5. `tests/office.test.js` kayıt testleri sayıyı doğrular; beklenen sayıyı güncelle.

## Doğrulama

```bash
python devserver.py                       # http://localhost:4173
node tools/runtests.js                    # 642 testin tamamı geçmeli (Playwright ile)
python build.py                           # dist/rota.html
python tools/audit.py                     # satır, concat, sınıf sayıları
```
