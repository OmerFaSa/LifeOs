# King'in büyük penceresi (G aşaması)

Kullanıcının onayladığı yerleşim (2026-10-21): «Bu stili beğendim; daha
profesyonel, daha ustaca, sisteme daha uyacak şekilde yap.» Kod:
`brand/ortak/king.js` (görünüm: `govde`, `rayHtml`, `listeHtml`, `alanHtml`),
biçim `brand/ortak/king.css` («G AŞAMASI» bölümü). Yeni jeton yok: ölçüler
`jeton.css`'in boşluk, köşe, yazı ve renk adlarıdır.

## Yerleşim

```
┌────┬──────────────┬────────────────────────────────┬──────────────────┐
│ray │ liste        │ başlık: küre King · AYS · 2 iş │ çalışma alanı    │
│ 56 │ 264 (kapanır)│        · kip ▾ · küçült · ✕    │ 360 (açılır)     │
│    │              │                                │                  │
│ ◯  │ ara          │   sohbet (en çok 720 px)       │ görev panosu,    │
│ ☐  │ Bugün        │   karşılama → cevap kartları   │ işler, rutinler, │
│ ↻  │ Dün …        │   «Neden?»                     │ araştırma, kamera│
│ ▤  │              │   kip şeridi (ekran, kamera)   │ ya da ekran,     │
│    │              │   [+ | yaz…          | 🎤 | ↑] │ ayarlar          │
│ ⚙  │              │                                │                  │
└────┴──────────────┴────────────────────────────────┴──────────────────┘
```

- **Araçlar** (2026-10-22, kullanıcı: «King'in özelliklerinin hepsini oradan
  görebilirim ki aklımızda tutmak yerine»): raydaki ikinci bölüm. King'in
  yapabildiği her şey gruplu ve aranır (`yetenekler()`): Şimdi (saat, gün ve
  modülün sunduklarından en çok üç öneri), Kart ve soru, Araştır ve oku, Gör,
  Planla ve takip et, Kaydet, Rutin ve hafıza, modüllerin işleri (Tüm işler ile
  aynı kaynak), Sistem. Satırın sağındaki simge türünü söyler: oynat hemen
  sorar, kalem örneği yazı alanına koyar (gönderilmez), ok açar. Merkez
  isteyen satır bağlı değilken sönük ve «Merkez» etiketli. Her örnek King'in
  gerçek tetiğidir; `king.test.js` «Araçlar: her örnek …» bunu koşturarak
  sınar, koşulu sağlanmayan satır çizilmez.
- Pencere 2026-10-22'de genişledi: en çok 1520 × 960, kenar payı 16 px;
  sütunlar liste 280 (1700 px üstü 300), çalışma alanı 380 (1400 px üstü
  420), sohbet 760 → 820 → 880.
- **Ray** (`.king__ray`, `data-king="bolum:<ad>"`): Sohbet, Araçlar, Görevler, Rutinler
  (beceriler ve sözler), Kütüphane (araştırmalar, klasörler, kayıtlı
  sohbetler); en altta Ayarlar (`data-king="menu"`). İkon 20 px, düğme
  40 × 40, köşe `--r-sm`. Üzerine gelince adı (ipucu, `--ink` zemin). Seçili
  bölüm nötr ton (`--surface-3`); renk yok. Görevler'in yanında iş varken
  canlı nokta.
- **Liste** (`.king__yan`, `data-king="yan"` kapatır; kapalıyken sol kenarda
  çıkıntı): seçili bölümün listesi. Başlık 48 px (`--fs-md` 600) ve eylem
  düğmeleri 32 px; arama 34 px; grup adı `--fs-xs` 600 `--text-3`; satır en
  az 40 px, köşe `--r-sm`, açık sohbet `--surface-3`.
  - Sohbet: arama, Sabitlenenler, sonra günlere göre: Bugün, Dün, Son 7 gün,
    Son 30 gün, Daha eski.
  - Görevler: görevler (hedef, adım sayısı, ince çubuk) ve arka plandaki
    işler; satır panoyu çalışma alanında açar.
  - Rutinler: beceriler (anahtar, tetik) ve açık sözler; satır paneli açar.
  - Kütüphane: araştırmalar (bu sohbetteki kartlar), klasörler (oluştur,
    taşı, kaldır), kayıtlı sohbetler.
- **Sohbet** (`.king__ana`): başlık 56 px yalnız küre, King, modül, canlı iş
  rozeti («2 iş» → çalışma alanında işler), odak sayacı (varsa), kip seçici,
  küçült, kapat. Sütun en çok 720 px, mesaj arası 20 px.
- **Çalışma alanı** (`.king__alan`, eski `menu` durumu): sohbetin yanında
  açılır, sohbet kapanmaz. Başlık 52 px (geri, ad, kapat
  `data-king="alan-kapat"`), gövde 16/20 px iç boşluk. İçerik: Ayarlar,
  görev panosu ve işler (K1), beceriler ve sözler (K2), Beni nasıl
  tanıyorsun, kayıtlı sohbet, araştırma ayrıntısı, kamera ya da ekranın
  büyük önizlemesi. Esc önce bunu kapatır.
- **Yazma kutusu** (`.king__yaz`, tek parça, köşe 24 px, ince çizgi):
  «+» (Fotoğraf, Kamera, Ekran, PDF, Barkod; çizginin altında Bu sayfayı
  göster, Tüm işler), metin, mikrofon (dokun: söyle, yazıya dökülsün ve
  gitsin; basılı tut: sesli sohbet), gönder (boşken sönük).

## Ayarlar (çalışma alanında, bölümlü)

Bağlantı (yapay zekâ · yerel) · Konuşma (Cevaplar, Tarz, Düşünme) · Ses (Ses,
Hız, son okuyan) · Dinleme (Algılama, Mikrofon ve deneme, «King» deyince
uyan) · Görüntü (Kamera, Arada yorum) · Hafıza (Beni nasıl tanıyorsun,
sormadan eklenenler) · Sohbet (Kaydet, Kayıtlı sohbetler, Temizle). Satır:
solda ad (`--fs-sm` 600 `--text-2`), sağda seçici; dar alanda alt alta.

## Cevap kartları

Kart: `--surface` zemin, 1 px `--border`, köşe `--r-md`, iç 14/16 px; gölge
yok. Başlık etiketi `--fs-xs` 600 `--text-2`. Araştırma (Özet, İzle, Oku,
Sıradaki adım), istatistik (ad, değer, etiket, eğilim), onay (Eklenecek, ana
düğme `--text` zemin, ikincil ince çizgi), soru, sıralı liste, bulunan
kayıtlar. **Neden?** (`data-king-neden`): cevabın altında küçük açılır satır;
şimdilik yalnız bilinen kaynağı söyler (modülün kodu, etiket, ajan, kaynak
sayısı). K6 burayı doldurur.

## Renk ve durum

Tek vurgu Merkez'in rengidir (`--mer`, King Merkez'in ajanı): yalnız canlı
durumda — iş çalışıyor (nabız), kayıt açık (mikrofon), paylaşım açık (canlı
nokta). Seçili, üzerine gelme ve odak nötr ton ve halkadır. Açık ve koyu
temada aynı düzen; küre ve kenar ışığı kısık.

## Boş ekranlar

- Sohbet: küre (44 px), selam (`--fs-display`), modülün kartları ve özeti,
  hazır cevaplar; ilk mesajla gider.
- Liste boşken tek cümle ve yapılacak iş («Yeni sohbet» dediğinde ya da gün
  değişince sohbet buraya geçer»; «Görev yok. ‹Bu hafta B1'e hazırla beni›
  gibi yaz»).
- Merkez bağlı değilse Görevler ve Rutinler bunu söyler.

## Dar ekran

- Tablet (≤ 1023 px): ray solda kalır; liste soldan, çalışma alanı sağdan
  sohbetin üstüne açılan katman.
- Telefon (≤ 679 px): ray alta iner (beş sekme, 56 px); liste ve çalışma
  alanı alttan açılan sayfa (köşe 20 px, tutamak).
- Küçük King (`is-mini`) değişmedi.

## Öğretmen (2026-10-22)

«türevi anlat», «bana olasılığı öğret», «ders: paragraf» → modülün KENDİ
anlatımından ders kartı (`kartlar.ders`; AYS konu anlatımı ya da çekirdek
özet, ESP öğrenme kartı, SPİ kavramı). Kart: modül ve etiket («elle yazıldı ·
doğrulanmadı»), ince ilerleme çubuğu, bölüm başlığı, metin, liste, «Dikkat»;
altta Önceki · Devam · Anladım, soru sor · Dinle · Modülde aç. Soru modülün
bankasından gelir (söz 32 yolu); yanlışta «Konuyu yeniden anlat» çipi aynı
dersi baştan açar. Modülde konu yoksa ders kurulmaz, mesaj Merkez'e gider.

## K4: Merkez sırası ve sesli özet (2026-10-22)

- Merkez kurulu ama ulaşılamıyorsa Merkez'e giden soru cihazda sıraya
  girer (`lifeos.king.merkez-sira`, TASINAN'da; en çok 20, 7 gün). King
  açılınca, cihaz çevrimiçi olunca ve açıkken dakikada bir yoklanır; cevap
  sohbete düşer, soru balonunda «sıradan · ne zaman». Başarısız yeniden
  deneme sohbete yazılmaz. Kütüphane › «Sırada · Merkez bekleniyor» (çıkar).
- «sesli özet», «günümü özetle»: modülün günlük cümleleri ve değerli
  kartları (etiketiyle) sesli; Kütüphane › «Sesli özetler»de kalır (son 20),
  satıra dokununca yeniden okunur.

## Sonra gelecekler için yer

K6 («neden», çizim): `data-king-neden` satırı ve
çalışma alanında «çizim» içeriği.
