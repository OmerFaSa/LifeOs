# Ofis — altı ajanlı çalışma ekibi

Rota'nın içinde altı küçük ajan çalışır. Hepsi aynı veriyi değil, **kendi
alanındaki** veriyi okur; birbirleriyle konuşur; sonunda **tek bir karar** çıkar.

> Eskiden ayrı bir "AI koç" katmanı vardı; kaldırıldı. Koçluk işini artık bu
> ofis yapar. Koçun taşıdığı iki yetenek ofise devredildi ve ücretsiz
> modellerle de çalışır hâle geldi: **çıktı doğrulama** (`Office.validate`) ve
> **nottan kart üretimi** (`Office.generateCards`). Ev kuralları
> `data/rules.js` içinde ortak kaynak olarak durur.

| Ajan | Rol | Neye bakar | Neye bakmaz |
|---|---|---|---|
| **Patron** | Ofis şefi | Uzmanların raporu, sıradaki hamle, karar kapısı | Kendi hesabını yapmaz |
| **Tuna** | TYT uzmanı | TYT kapanışı, TYT denemeleri, TYT net bandı | AYT'ye karışmaz |
| **Yaman** | AYT uzmanı | AYT kapanışı, AYT denemeleri, alan dersleri | TYT'ye karışmaz |
| **Rana** | Rehberlik | Uyku, enerji, plan tamamlama, sapma nedenleri | Net ve konu yorumlamaz |
| **Deniz** | Analist | Denemeler, hata paretosu, risk sıralaması, borçlar | Tavsiye vermez, bulgu bildirir |
| **Kerem** | Soru koçu | Çözülen sorular, konu başına oran, kaynak zorluğu | Deneme neti yorumlamaz |

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

### Ofis ekranı iki görünüm taşır

| Görünüm | Ne verir |
|---|---|
| **3B oda** (varsayılan) | Masalar bir zeminin üstünde durur, Patron dipte karşıdadır, uzmanlar iki sıra hâlinde önünde oturur. Oda sürüklenerek ya da başlıktaki oklarla çevrilir. |
| **Kat planı** | Aynı beş masa, düz ızgarada. Dar ekranda ve hareket istemeyen kullanımda daha sakin. |

Tercih kalıcıdır (`office/settings → room3d`), kamera açısı yeniden çizimler
arasında korunur.

3B oda bir resim değil, **aynı arayüzün başka bir çizimidir**: her masa yine bir
`<button>`, yine `data-act="office-desk"`, yine klavyeyle gezilir. Ad kartları
sahnenin **ters dönüşümünü** alır (`rotateZ(-turn) rotateX(-tilt)`), böylece oda
hangi açıda olursa olsun yazı düz okunur.

Kütüphane yok: uygulamanın hiçbir bağımlılığı yok ve tek dosyalık bir HTML
olarak yayımlanıyor; beş masalık bir oda için WebGL hem ağır hem gereksizdir.
Sahne tek bir CSS dönüşümüyle eğilir.

İki tuzak vardı, ikisi de kilitlendi:

- **Dekor imlece görünmezdir** (`pointer-events:none`). `preserve-3d` bağlamında
  kardeşler tek bir derinlik değerine göre sıralanır ve zemin gibi büyük bir
  düzlem, kendisiyle aynı düzlemde duran masa düğmelerini isabet testinde
  örtüyordu: Patron'un ve bir uzmanın masası **hiç tıklanamıyordu**.
- **Ad kartı masanın düzlemini kesmez.** Kestiğinde masa üstü yazının bir kısmını
  boyuyor, adlar yarım görünüyordu; kart artık masanın ön kenarına çakılmış bir
  tabela gibi dikilir ve hiçbir noktası masa düzleminin altına inmez.

Durum metni ad kartında **yalnız söylenecek bir şey varken** çıkar: her şey
yolundayken ışık yeter, kota dolunca ya da sıra oluşunca yazı belirir. Masanın
tam durumu `title`'da ve raporunda durur.

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

Her turda beş uzman sırayla konuşur: `Deniz → Tuna → Yaman → Rana → Kerem`.
Koç en sonda konuşur: önce konu ve net tablosu masaya konur, sonra "peki
gerçekten çözebiliyor mu" sorusu gelir.
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

## Ajanlar rapor okumaz, konuşur

Şikâyet netti: *"merhaba yazıyorum, adam direkt masamdaki rapor diyor."*
Sebep tek bir hata değil, **istemin kendisiydi**: her çağrıda ajanın önüne JSON
rapor konup "bunu yorumla" deniyordu. Bir modelin önüne JSON koyup yorumlamasını
istemek, ona onu **sesli okutmaktır**.

### Gelen mesaj önce sınıflanır

Sınıflama kural motorundadır (`Office.chatKind`), modelde değil: deterministik,
testlenebilir ve model bağlı olmasa da çalışır. Kalıplar `data/agents.js`
içinde `R.CHAT_KINDS` altında durur.

| Tür | Ne zaman | Ajanın eline ne verilir |
|---|---|---|
| `selam` | Kısa selamlaşma, teşekkür, hâl hatır | **Hiçbir şey.** Rapor gönderilmez |
| `hal` | Dert yanma ("moralim bozuk") | Hiçbir şey; önce insan gibi karşılık |
| `konu` | Ders/konu sorusu | Kural motorunun **düz cümle** özeti (JSON değil) |
| `veri` | Adayın kendi durumu | Masasındaki tam tablo (eski davranış) |

Sıra kasıtlıdır: `hal` **`veri`den önce** gelir. "Moralim bozuk, netlerim de
düşüyor" diyen birine önce tablo okumak, sorulan soruya değil sorulmayan soruya
cevap vermektir. Hiçbiri tutmazsa `veri` — uygulama bir çalışma sistemidir.

**Türkçe ve `\b` tuzağı:** JavaScript'te `\b` yalnız `[A-Za-z0-9_]` harflerini
kelime sayar. `/nasıl çalış\b/` ifadesi *"nasıl çalışılır"* içinde **eşleşmez**,
çünkü `ş` ile `ı` arasında ASCII açısından sınır yoktur. İlk yazımda tam olarak
bu oldu ve bütün konu soruları `veri` olarak sınıflandı. Kalıplarda sonda sınır
yoktur (ek gelir), baştaki sınır Türkçe harfleri de içeren açık bir sınıftır ve
metin önce `toLocaleLowerCase('tr')` ile küçültülür.

### Konu anlatmak serbesttir, adayın sayıları değil

Ev kuralı şuydu: *"Veride karşılığı olmayan genel tavsiye verme."* Bu, "veri
dışında hiçbir şey konuşma" diye okunuyordu ve ders anlatmayı da yasaklıyordu.
Kuralın gerçek amacı **adayın durumu hakkındaki iddiaları** veriye bağlamak;
ders bilgisi bunun dışındadır. Kural buna göre düzeltildi.

Aynı ayrım denetimde de var: sayı sadakati (`numberFidelity`) yalnız `veri`
turunda çalışır. Konu anlatırken geçen bir sayı ("TYT'de 40 soru var") adayın
verisi hakkında bir iddia değildir; brifingde aranması yanlış uyarı üretirdi.
Ev kuralları ve alan gardı her turda çalışmaya devam eder.

Selamlaşma ayrıca **öneri kutusuna girmez**: "merhaba"nın karşılığı bir sistem
değişikliği önerisi olamaz.

### Konuşma kaydı — her isteme eklenir

`R.OFFICE_PROMPTS.SPEECH` raporu ele veren kalıpları açıkça yasaklar; bir insan
"raporuma göre" demez:

> Rapor okumuyorsun, konuşuyorsun. Elindeki tablo arka plandır: ona bakarsın,
> ondan konuşursun, ama onu aktarmazsın. Şu kalıpları ASLA kullanma:
> "raporuma göre", "masamdaki rapor", "verilere göre", "JSON", alan adları.
> Bir cümlede en fazla bir sayı.

### Toplantı bir tutanak değil, bir konuşma

Toplantı istemlerinde **sıra değişti**: önce odada ne olup bittiği (kimin ne
dediği), sonra arka plandaki tablo. Tersi, ajana "önce raporunu oku" demek
oluyordu ve toplantı beş kişinin sırayla tablo aktarmasına dönüyordu.

Turlar da kısaldı: her turun kendi uzunluk tavanı var (`ROUNDS[].sentences`,
**2 cümle**) ve bu tavan ajanın sohbet uzunluğunun yerine geçer. Beş kişi
sırayla dört cümle kurunca toplantı okunmaz hâle geliyordu. Tur soruları da
form doldurma emri değil, masadaki birine sorulan soru gibi yazılır:

| Eski | Yeni |
|---|---|
| "Kendi alanindan gundemle ilgili TEK bulgu bildir. Sayilari raporundan al." | "Kendi alanında bu konuyla ilgili gördüğün tek şeyi söyle." |
| "Konusulanlardan kendi alanina dusen tek isi soyle…" | "Bu işin sana düşen kısmı ne? Tek cümlede söyle." |

### Ses ve okuma ritmi — biri bitmeden diğeri başlamaz

Toplantı okunamayacak kadar hızlı akıyordu ve sesli modda konuşmalar üst üste
biniyordu. İkisi de tek bir kurala bağlandı:

> **Bir konuşma teslim edilmeden sıradaki başlamaz.**
> Bir konuşma, okunması için gereken süreden az ekranda kalmaz.

Teslim etmek sesli modda konuşmanın **gerçekten bitmesini** beklemektir
(`Voice.speak` bir söz verir ve `onend` geldiğinde çözülür), sessiz modda ise
metnin okunmasına yetecek kadar durmaktır. Bekleme döngünün içinde olduğu için
**sonraki model çağrısı da gecikir** — ücretsiz katmanda bu bir kayıp değil
kazançtır: kota kendiliğinden rahatlar.

Okuma molası metnin uzunluğuna göre hesaplanır (`Voice.holdMs`) ve metnin
**zaten ekranda geçirdiği süreyi düşer**: model akarken metin harf harf gelir ve
kullanıcı o sırada okur. Kota kuyruğunda beklenen süre okuma sayılmaz (ekranda
"sırada" yazıyordu), o yüzden düşülmez.

| Hız | Kelime/sn | Taban–tavan |
|---|---|---|
| Hızlı | 4,2 | 0,5–5 sn |
| Normal | 2,8 | 0,9–9 sn |
| Yavaş | 1,8 | 1,4–14 sn |

Tercih kalıcıdır (`office/settings → meetingPace`), toplantı başlamadan da
seçilebilir.

### Her ajanın kendi sesi

Tarayıcının ses listesinden Türkçe sesler ayıklanır ve ajanlara **dağıtılır**;
aynı ses ikinci kez kullanılmadan önce hepsi bir kez kullanılır. Cihazda tek
Türkçe ses varsa perde ve hız ayrımı devreye girer — kimin konuştuğu bakmadan
anlaşılmalıdır. Konuşan masanın yanında dalga işareti yanar ve ses bitince söner.

Web Speech API'nin üç tuzağı `core/voice.js` içinde kapatılır:

| Tuzak | Ne olurdu | Çözüm |
|---|---|---|
| `getVoices()` ilk çağrıda **boş** döner | İlk konuşma varsayılan sesle okunurdu | `voiceschanged` beklenir (zaman aşımıyla) |
| Chrome uzun metinde ~15 sn sonra sessizce durur, `onend` hiç gelmez | Toplantı orada kilitlenirdi | Metin cümlelere bölünür; her parça kısa |
| `onend` hiç gelmeyebilir (sekme arka planda, ses aygıtı düşer) | Aynı kilit | Parça uzunluğuna göre emniyet süresi |

Dördüncü bir tuzak da testte yakalandı: **cihazda hiç ses yoksa** konuşma anında
"bitmiş" dönüyor ve toplantı 300 ms'de bir tur atıyordu — yani sesli mod,
şikâyet edilen hızlı akışın daha beteri oluyordu. `holdMs` kuralı bunu kapatır
ve durum kullanıcıya bir kez söylenir.

Ses yoksa ya da bozuksa hiçbir şey kırılmaz: `speak()` hemen çözülür, toplantı
sessiz akmaya devam eder.

### Model yokken de sohbet edilir

Kural motoru soruyu **okuyamaz** — bu doğru ve saklanmaz. Ama sohbetin
**türünü** okuyabilir, ve bir selamlaşmaya tablo okumak, cevap veremiyor
olmaktan daha kötüdür. Model bağlı değilken ajan artık selamlaşmaya selamla
karşılık verir, konu sorusunda ve dert yanmada durumu dürüstçe söyler, yalnız
gerçekten veri sorulduğunda tabloyu aktarır. "Model bağlı değil" notu sohbet
başına **bir kez** verilir; her mesajda tekrarlamak sohbet değil uyarı
yağmurudur.

## Ücretsiz modeller

Ofis, tarayıcıdan doğrudan çağrılabilen ücretsiz uçları destekler
(`data/providers.js`):

| Sağlayıcı | Anahtar | Dakikada | Günde | Not |
|---|---|---|---|---|
| Yerleşik | gerekmez | — | — | Uygulama Claude içinde çalışıyorsa açıktır |
| OpenRouter | `sk-or-…` | 20 | 50 · kredi yüklediysen 1000 | Ücretsiz modellerin çoğu burada |
| Groq | `gsk_…` | 30 | 1000–14 400 | En hızlısı; toplantı için en akıcı |
| Google AI Studio | `AIza…` ya da `AQ.…` | 10–30 | 1000–1500 | Günlük hakkı en geniş olan |
| Ollama · LM Studio | gerekmez | — | — | Kendi bilgisayarında; kota yok |
| Özel uç | isteğe bağlı | sen yazarsın | sen yazarsın | OpenAI uyumlu bir adres yeter |

Sayılar `data/providers.js` içinde `limits` alanında, kaynağı ve tarihi
`checked` alanında durur. Hesabında farklıysa Ofis → Ayarlar'dan düzeltebilirsin.
Bilinmeyen sınır **yazılmaz**: uydurma bir sayı, sayı olmamasından kötüdür —
alan boşsa sağlayıcının dar varsayılanına düşülür.

### Anahtar biçimi — engellemez, söyler

Yanlış sağlayıcıya yapıştırılan anahtar en sık arızadır. Biçim bilgisi
`data/providers.js` içinde `keyPattern` alanında durur ve motor okur
(`LLM.keyProblem`). Üç sonuç vardır:

- **Tanıdık biçim** → sessiz.
- **Tanınmayan biçim** → yalnız uyarı, kayıt engellenmez. Sağlayıcılar önek
  değiştirebiliyor; geçerli bir anahtarı reddetmek en kötü arıza olurdu.
- **Başka sağlayıcının biçimi** → kaydetme durdurulur. Kaydetmenin tek sonucu
  401 olurdu.

Bunun bedeli ödendi: Google, Eylül 2026'da anahtar biçimini değiştirdi
(yeni "auth key"ler `AQ.` ile başlar, eskileri `AIza`). Yalnız `AIza`'yı kabul
eden sabit denetim, yeni anahtar alan **herkesi** kapıda durduruyordu. Artık
ikisi de tanınır ve biçim tek yerde durur.

### Google anahtarı başlıkla gider

Gemini çağrısında anahtar `x-goog-api-key` **başlığıyla** gönderilir, adres
satırındaki `?key=` ile değil: sorgu dizesi anahtarı tarayıcı geçmişine,
`Referer` başlığına ve aradaki vekil günlüklerine düşürür.

### Uç adresi sızmaz, eksik yazılan tamamlanır

Adres **yalnızca** kendi adresini düzenleyebilen sağlayıcılarda (`editableEndpoint`)
dikkate alınır; diğerlerinde katalogdaki resmî uç kullanılır. Eskiden ayar
ekranı adres alanı olmayan bir sağlayıcı için de kayıtlı adresi geri veriyordu:
Ollama'dan Groq'a geçen kullanıcının bütün istekleri `localhost:11434`'e gidiyor
ve "model çağrılamıyor" oluyordu.

Eksik yazılan adres tamamlanır: `…/v1` → `…/v1/chat/completions`,
`localhost:11434` → `http://localhost:11434/v1/chat/completions`. Sorgu dizesi
korunur.

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

### Katalog eskir — ve bu artık arıza değil

Ücretsiz model kimlikleri aylık döner: OpenRouter'ın `":free"` listesi sürekli
değişir, Google 2.0 Flash'i Mart 2026'da emekli etti. Sabit bir katalog bu yüzden
er geç "model bulunamadı" duvarına çıkar ve kullanıcının doğru kimliği bilmesinin
hiçbir yolu olmaz.

Bunun için `data/providers.js` artık tek kaynak değil **tohumdur**. Ayar
sayfasındaki **"Modelleri yenile"** sağlayıcının kendi listesini çeker
(`LLM.listModels`) ve tarayıcıda saklar (`localStorage['rota.llm.catalog']`):

- OpenRouter/Groq/yerel uçlar: `GET …/v1/models`
- Google: `GET …/v1beta/models` — yalnız `generateContent` destekleyenler kalır,
  gömme (embedding) modelleri ayıklanır
- OpenRouter'da ücretli modeller ayıklanır (kullanıcıyı 402'ye göndermesin)

Liste çekmek bir **sohbet isteği değildir**: günlük kotadan düşmez. Canlı liste
varken katalog yalnızca okunabilir etiketi verir ("Llama 3.3 70B · denge"),
kimlik canlı listeden gelir. Yedek zinciri de canlı listeyi kullanır — yoksa
katalog eskidiğinde zincirin tamamı aynı hataya düşerdi.

Elle yazılmış model kimliği artık kaybolmuyor: liste dışı bir kimlik ayar
sayfası yeniden açıldığında "elle yaz" alanında geri gelir. Eskiden boş
görünüyor ve kaydetme onu listenin ilk modeliyle sessizce değiştiriyordu.

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

### Akıl yürütmenin iç sesi cevaba karışmaz

Akıl yürüten ücretsiz modeller (DeepSeek R1, Qwen3, birçok `":free"` uç) iç
seslerini iki yoldan sızdırır: gövdeye `<think>…</think>` yazarlar ya da ayrı
bir `reasoning` alanına koyarlar. Birincisi ekrana **"ajanın yanıtı" diye
çiziliyordu** — kullanıcının gördüğü "yanlış yanıt"ın en sık sebebi buydu.

`LLM.stripThinking` bunu akışta da ayıklar: kapanmamış bir `<think>` açılışından
sonrası henüz cevap değildir, kesilir. Model **yalnızca** düşünme döndürdüyse
sonuç "boş yanıt" değil ayrı bir hatadır (`thinking_only`) — çünkü "tekrar dene"
yanlış tavsiyedir, aynı model aynı şeyi yapar. Hata yeniden denenebilir sayılır,
böylece yedek zinciri akıl yürütmeyen bir modele geçer.

### Hata gövdesi okunur

HTTP kodu tek başına yetmez ve okumadan sınıflamak kullanıcıyı yanlış yere
gönderir. Google geçersiz anahtarı **400** ile bildirir; "istek reddedildi"
diyen bir mesaj, anahtarını yenilemesi gereken kullanıcıya hiçbir şey söylemez.
`LLM.classify(status, gövde)` önce gövdeye bakar:

| Gövdede geçen | Sonuç | Mesaj ne der |
|---|---|---|
| `API key not valid` | `unauthorized` | Anahtarı kontrol et ya da yenisini üret |
| `ACCESS_TOKEN_TYPE_UNSUPPORTED` | `key_type` | Bu anahtar türü kabul edilmiyor; AI Studio'da yeni bir tane üret |
| `model … does not exist` | `bad_model` | "Modelleri yenile" ile güncel listeden seç |
| 429 + `per day` / `quota` | `daily_quota` | Günlük hak doldu, yarın sıfırlanır |
| yerel adrese `TypeError` | `local_cors` | Sunucu açık mı; Ollama için `OLLAMA_ORIGINS="*"` |

### Parametre onarımı

Uçlar "OpenAI uyumlu" olsa da parametrelerde ayrışır: bazıları `max_tokens`
yerine `max_completion_tokens` ister, bazısı `temperature` kabul etmez,
Gemini 3 `thinkingBudget` yerine `thinkingLevel` bekler. Hepsi 400 döner ve
kullanıcıya "istek reddedildi" diye görünürdü.

400'ün gövdesi hangi alandan şikâyet ediyorsa o alan düzeltilir ve istek **bir
kez** tekrarlanır. Düzeltme model başına hatırlanır, böylece ikinci istekten
sonra fazladan tur olmaz.

### Tanılama — zincirin ilk kırılan halkası

"Bağlanamadı" tek başına hiçbir şey öğretmez: sorun anahtarda mı, model
kimliğinde mi, adreste mi, ortamda mı? Ayar sayfasındaki **"Tanıla"**
(`LLM.diagnose`) sırayla bakar ve her adımın sonucunu yazar:

```
Sağlayıcı → Ortam → Uç adresi → API anahtarı → Model listesi → Seçili model → Sohbet çağrısı
```

İlk kırmızı satır sorunun kendisidir; sonrakiler onun sonucudur. Model listesi
adımı anahtarı da doğrular ve günlük kotadan düşmez.

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
| `data/agents.js` | Beş ajanın kimliği, yetki alanı, tur soruları, istemleri, sohbet türü kalıpları (deklaratif) |
| `data/actions.js` | Ajanların önerebileceği eylemlerin kapalı kataloğu (deklaratif) |
| `core/proposals.js` | Öneri kutusu: doğrulama, önizleme, onay, uygulama, geri alma |
| `data/providers.js` | Sağlayıcı tohum kataloğu: uç, anahtar biçimi, model listesi, sınırlar (deklaratif, sık eskir) |
| `data/rules.js` | Ev kuralları, yasak kalıplar, üslup, kart kuralları |
| `core/quota.js` | İstek sınırı: aralık koyar, günü sayar, 429'u cezalandırır |
| `core/journal.js` | Ajan defteri: doğrulanabilir gözlem, örüntü bulma, güven skoru |
| `core/llm.js` | Taşıma: fetch, SSE akış, hata sınıflama, parametre onarımı, canlı model listesi, tanılama, anahtar deposu, yedek zinciri |
| `core/tools.js` | Veri okuma katmanı + gizlilik süzgeci (`sanitize`) |
| `core/office.js` | Brifingler, sohbet, gündem, turlu toplantı, rapor, karar takibi |
| `core/voice.js` | Ajan sesleri, ses kalitesi seçimi, okunuş dönüşümü (`speechText`), okuma ritmi (`holdMs`) |
| `screens/office.js` | Pano, 3B oda / kat planı, masalar, günün kararı, kota, model ayarları ve tanılama |
| `screens/team.js` | Ajanla sohbet |
| `screens/meeting.js` | Canlı turlu toplantı + rapor + tutanak arşivi |
| `tests/office.test.js` | Kayıt, brifing, yetki, gizlilik, gündem, tur, oylama, çapraz soru, defter, not, rapor, karar, kota, taşıma, API bağlantısı, 3B oda |
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
node tools/runtests.js                    # 837 testin tamamı geçmeli (Playwright ile)
python build.py                           # dist/rota.html
python tools/audit.py                     # satır, concat, sınıf sayıları
```
