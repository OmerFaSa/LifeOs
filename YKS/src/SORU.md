# Soru çözüm sistemi

Soruyu **yaz ya da fotoğrafla**, çözümü adım adım al, ve çözüleni **kayda
bağla**. Ekranın asıl işi çözüm üretmek değil: her çözülen soruyu bir konuya,
bir zorluğa ve bir sonuca oturtmak. Konu takibi ve kaynak zorluğu bu
kayıtlardan beslenir.

## Temel ilke: model çözer, kural motoru doğrular

Ofis katmanıyla aynı doktrin, tek farkla: **çözüm metni modelden gelir**.
Bir soruyu çözmek hesap işidir ve orada modele mecburuz. Ama modelin
çözümün yanında bildirdiği her ŞEY denetlenir:

| Model ne bildirir | Nasıl doğrulanır |
|---|---|
| ders + konu | **Kapalı katalogdan** (`R.SUBJECTS`) eşleştirilir. Eşleşmezse kayda bağlanmaz |
| zorluk | **Kapalı ölçekten** (`R.DIFFICULTY`, 1–5). Ölçek dışı değer atılır |
| cevap, tuzak | Kırpılır (80 / 240 karakter) |

Neden bu kadar katı: bu kayıtlar konu takibini, risk sıralamasını ve kaynak
zorluğunu besliyor. **Uydurulmuş tek bir konu adı, o hesabın tamamını sessizce
bozar.** Eşleşme yoksa `matchTopic` tahmin yürütmez, `null` döner ve doğru
konuyu kullanıcı seçer — ekran modelin ne yazdığını da gösterir ki neyi
düzelttiğini bilsin.

Eşleştirme üç kademelidir: tam ad → Türkçe harf farkları giderilmiş ad
(`U.norm`, "sozcukte" ile "Sözcükte" eşleşir) → içerme. İçermede **en dar
konu** seçilir, böylece geniş bir konu adı dar bir konuyu yutmaz.

## Çıktı sözleşmesi

Model önce **anlatımı** yazar, en sona tek satırlık JSON ekler:

```
…adım adım çözüm…
Cevap: 2 ve 3
{"ders":"…","konu":"…","zorluk":1-5,"cevap":"…","tuzak":"…"}
```

`Solver.parse` ikisini ayırır: ekranda anlatım kalır, makine okunacak kısım
ayrılır. Aynı desen öneri kutusunda da kullanılıyor. JSON kuyruğu ekrana
**asla** sızmaz; akış sırasında da ayıklanır.

Kuyruk gelmezse ya da bozuksa metin olduğu gibi gösterilir — çözüm kaybolmaz,
yalnız konu/zorluk elle seçilir.

## Fotoğraflı soru

### Görsel taşıma

`core/llm.js` artık mesajlara `images:[{mime, data}]` alabiliyor:

- **OpenAI uyumlu uçlar** → içerik parça dizisine döner:
  `[{type:'text'}, {type:'image_url', image_url:{url:'data:…;base64,…'}}]`
  Görsel yoksa **düz metin biçimi korunur**: bazı küçük uçlar dizi biçimini
  hiç tanımıyor.
- **Gemini** → `parts:[{text}, {inline_data:{mime_type, data}}]`
- **Yerleşik yetenek** görsel almaz; istek hiç gönderilmez.

### Fotoğraf küçültülür

Ham telefon fotoğrafı 4–8 MB eder ve base64 bunu bir kat daha büyütür: istek ya
reddedilir ya da dakikalık jeton sınırını tek başına doldurur.
`Solver.prepareImage` tarayıcıda küçültür — en uzun kenar 1400 px, JPEG %82 —
ve 3 MB'ı hâlâ aşan görseli göndermez. Şeffaf PNG'ler JPEG'de siyaha döndüğü
için tuvale önce beyaz zemin basılır.

### Hangi model görsel okur?

| Sağlayıcı | Görsel |
|---|---|
| Google AI Studio (Gemini) | **Evet** — ücretsiz katmanda çalışan tek seçenek |
| Groq | Hayır (ücretsiz katmandaki modeller metin) |
| OpenRouter | Modele göre — canlı listeden `architecture.input_modalities` okunur |
| Yerleşik | Hayır |

`LLM.supportsVision(cfg)` bunu çağrı yapmadan söyler. **Bilinmiyorsa denenir**:
yanlış bir "hayır", çalışan bir modeli kullanıcıdan saklamak olurdu.
`LLM.visionChain(cfg)` görsel okuyan modellerden bir yedek zinciri kurar, ve
`no_vision` yeniden denenebilir bir hatadır — zincirde görsel okuyan bir model
varsa istek oraya düşer.

## Sonuç işareti — en değerli tek bilgi

| İşaret | Çözülmüş sayılır mı |
|---|---|
| Kendim çözdüm | ✓ |
| Zorlanarak çözdüm | ✓ |
| Yanlış yaptım | ✗ |
| Boş bıraktım | ✗ |
| Çözüme baktım | ✗ |

"Çözüme baktım" ile "kendim çözdüm" arasındaki fark, konu takibinin en değerli
bilgisidir: bir konuda 20 soru çözmek, o konuyu bildiğin anlamına gelmez.
`byTopic()` oranı bu ayrımdan çıkarır ve **en düşük oranı üste** koyar.

## Takip sorusu

Çözümü anlamadıysan "üçüncü adımda neden 2 ile çarptın?" diye sorabilirsin.
Takip istemi çözümü bağlamda tutar ve modelden **yalnız o adımı** açıklamasını
ister — çözümü baştan yazmasını değil.

## Kaynak (yayın) zorluğu

İki ayrı şey vardır ve karıştırılmamalıdır:

| | Ne | Nereden |
|---|---|---|
| **Etiket** | Kaynağın kademesi: temel / orta / üst / resmî | Tohum listeden ya da senin seçiminden. Bir **başlangıç noktası** |
| **Ölçüm** | O kaynaktan çözdüğün sorularda **senin** oranın | Kendi çözüm kayıtlarından. **Asıl bilgi bu** |

Genel olarak %75 çözüp bir kitapta %45'te kalıyorsan **o kitap sana zordur** —
etiketinde ne yazarsa yazsın. `Sources.relative(id)` bunu söyler: kaynağın
oranını senin genel oranınla karşılaştırır ve ±15 puanlık sapmayı "sana zor" /
"sana kolay" diye adlandırır.

> 3D sana göre **ZOR**: burada %25 çözüyorsun, genel oranın %59 (−34).

### Tohum liste uydurulmadı

Kaynak listesi ve kademeleri uygulamanın **zaten taşıdığı** iki yerden derlendi:
`R.PUBLISHER_LADDER` (yayın merdiveni) ve `R.SUBJECTS[].sources` (ders başına
kaynak mimarisi). Yani kademeler benim yargım değil, sistemin kendi içeriği —
her kaydın `from` alanı nereden geldiğini söyler. Listede olmayan yayını
kullanıcı kendisi ekler, kademesini değiştirebilir.

Tohum **bir kez** yüklenir: sildiğin kaynak geri gelmez, değiştirdiğin kademe
üzerine yazılmaz.

### Tek ölçümle karar verilmez

Ev kuralı burada da geçerli. Altı sorudan çıkan bir oran gürültüdür:
`R.SOURCE_MIN_SAMPLE` (8) altında oran **hiç hesaplanmaz** ve ekran "5/8" der,
"%20" demez. Uydurma bir zorluk etiketi, etiketsiz bırakmaktan kötüdür.

"Çözüme baktım" burada da çözülmüş sayılmaz — bir kitapta 20 soruya bakmak, o
kitabı çözebildiğin anlamına gelmez.

### Merdiven kuralı

Uygulamanın kendi kuralı: *"Temel oturmadan üst seviye yayına geçilmez."*
`Sources.ladderWarning()` bunu **veri destekliyorsa** söyler: konu kapanışın
%55'in altındayken son 20 sorunun üçü ya da fazlası üst seviye kaynaktan
geldiyse uyarı çıkar. Kapanış iyiyse ya da üst seviyeden çözmüyorsan hiçbir şey
yazmaz — koşulsuz uyarı, okunmayan uyarıdır.

## Dosya haritası

| Dosya | Sorumluluk |
|---|---|
| `data/solver.js` | İstemler, zorluk ölçeği, sonuç işaretleri, çıktı sözleşmesi (deklaratif) |
| `data/sources.js` | Kaynak kademeleri, türleri, tohum liste (deklaratif) |
| `core/solver.js` | Kapalı katalog eşleşmesi, çıktı ayrımı, doğrulama, fotoğraf hazırlama, kayıt, ölçüm |
| `core/sources.js` | Kaynak kaydı ve **ölçülen** zorluk: senin oranın vs. genel oranın |
| `screens/solve.js` | Soru kutusu, çözüm, kayda geçirme, kaynaklar, geçmiş |
| `tests/solver.test.js` | Katalog eşleşmesi, ayrım, doğrulama, kayıt, görsel taşıma, kaynak ölçümü |

## Doğrulama

```bash
node tools/runtests.js       # 805 testin tamamı geçmeli
```
