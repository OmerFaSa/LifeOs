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
| 4. Toparlama | Kendi alanına düşen tek iş |
| 5. Serbest tur | Son söz (yoksa "ekleyecek bir şey yok") |

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

`Office.reportText(m)` raporu düz metne çevirir; ekrandaki "Kopyala" bunu kullanır.
Tutanaklar `meetings/<id>` altında saklanır; en son 20 tanesi tutulur.

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

## Gizlilik

Modele giden her nesne `CoachTools.sanitize()` süzgecinden geçer: ad, şehir,
okul, e-posta gibi anahtarlar her derinlikte silinir; profildeki kişisel
değerler metin içinde de maskelenir. Ofis brifingleri yalnızca davranışsal ve
akademik metrik taşır.

## Dosya haritası

| Dosya | Sorumluluk |
|---|---|
| `data/agents.js` | Beş ajanın kimliği, yetki alanı, tur soruları, istemleri (deklaratif) |
| `data/providers.js` | Sağlayıcı, model ve istek sınırı kataloğu (deklaratif, sık değişir) |
| `data/rules.js` | Ev kuralları, yasak kalıplar, üslup, kart kuralları |
| `core/quota.js` | İstek sınırı: aralık koyar, günü sayar, 429'u cezalandırır |
| `core/llm.js` | Taşıma: fetch, SSE akış, hata haritası, anahtar deposu, yedek zinciri |
| `core/tools.js` | Veri okuma katmanı + gizlilik süzgeci (`sanitize`) |
| `core/office.js` | Brifingler, sohbet, gündem, turlu toplantı, rapor, karar takibi |
| `screens/office.js` | Pano, masalar, günün kararı, kota, model ayarları |
| `screens/team.js` | Ajanla sohbet |
| `screens/meeting.js` | Canlı turlu toplantı + rapor + tutanak arşivi |
| `tests/office.test.js` | 78 test: kayıt, brifing, yetki, gizlilik, gündem, tur, rapor, karar, kota, taşıma |

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
node tools/runtests.js                    # 570 testin tamamı geçmeli (Playwright ile)
python build.py                           # dist/rota.html
python tools/audit.py                     # satır, concat, sınıf sayıları
```
