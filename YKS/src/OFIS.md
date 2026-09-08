# Ofis — beş ajanlı çalışma ekibi

Rota'nın içinde beş küçük ajan çalışır. Hepsi aynı veriyi değil, **kendi
alanındaki** veriyi okur; birbirleriyle konuşur; sonunda **tek bir karar** çıkar.

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
| **Ofis** | `office` | Beş masa, her masanın raporu, günün tek işi, model ayarları |
| **Ekip sohbeti** | `team` | Seçilen ajanla konuşma; ajan yalnız kendi raporunu görür |
| **Toplantı odası** | `meeting` | Ajanların birbirleriyle konuştuğu yer + tutanak arşivi |

## Toplantı akışı

Sıra sabittir, altı turdur:

```
Patron açar  →  Deniz (analist)  →  Tuna (TYT)  →  Yaman (AYT)  →  Rana (rehber)  →  Patron kapatır
```

Her uzman şunları görür: **gündem** + **kendi brifingi** + **o ana kadar
söylenenlerin son dördü**. Ham veriye hiçbir ajan erişemez. Patron kapanışta
ekipteki çelişkiyi çözer ve kural motorunun belirlediği eylemi gerekçelendirir.

Tutanaklar `meetings/<id>` altında saklanır; en son 20 tanesi tutulur.

## Ücretsiz modeller

Ofis, tarayıcıdan doğrudan çağrılabilen ücretsiz uçları destekler
(`data/providers.js`):

| Sağlayıcı | Anahtar | Not |
|---|---|---|
| Yerleşik | gerekmez | Uygulama Claude içinde çalışıyorsa açıktır |
| OpenRouter | `sk-or-…` | Ücretsiz modellerin çoğu burada; günlük sınır var |
| Groq | `gsk_…` | Çok hızlı, dakikalık sınırı düşük |
| Google AI Studio | `AIza…` | Günlük hakkı geniş, uzun toplantılara uygun |
| Özel uç | değişir | OpenAI uyumlu `/chat/completions` (Ollama, LM Studio…) |

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
| `data/agents.js` | Beş ajanın kimliği, yetki alanı, istemleri (deklaratif) |
| `data/providers.js` | Sağlayıcı ve model kataloğu (deklaratif, sık değişir) |
| `core/llm.js` | Taşıma: fetch, SSE akış, hata haritası, anahtar deposu, yedek zinciri |
| `core/office.js` | Brifingler, sohbet, gündem seçimi, toplantı orkestrasyonu, kalıcılık |
| `screens/office.js` | Masalar, günün kararı, model ayarları |
| `screens/team.js` | Ajanla sohbet |
| `screens/meeting.js` | Canlı toplantı + tutanak arşivi |
| `tests/office.test.js` | 50 test: kayıt, brifing, yetki, gizlilik, gündem, toplantı, taşıma |

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
node tools/runtests.js                    # 549 testin tamamı geçmeli (Playwright ile)
python build.py                           # dist/rota.html
python tools/audit.py                     # satır, concat, sınıf sayıları
```
