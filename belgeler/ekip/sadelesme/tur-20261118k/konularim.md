# konularim · Kendi başlıkların (2026-11-18/19)

Sahibin sözü: «Derslere biz de bir şeyler ekleyebilelim: başlık ve onun altına konular … sonra Başbuğ'dan bunu düzeltmesini ve altında derslerle ilgili bilgileri toplamasını isteyeyim.»

Durum: **bitti** (commit yok, push yok).

## Ne yapıldı
- **Alan sayfasının sonunda «Kendi başlıkların»** (`Kabuk.ek.alanSonu`; kabuk.js'e dokunulmadı). Boşken tek satır: «Kendi başlığını ekle» + Ekle. Doluyken her başlık yumuşak gölgeli bir kart (kenar çizgisi yok); konu satırları konu haritasının `.konu` dilinde.
  - Başlık ekle → odak hemen o başlığın «Konu ekle» kutusuna gelir; konular ardı ardına yazılıp Enter'la eklenir.
  - Her başlık ve konuda «⋯» seçenekleri (yerel `<details>`): Yukarı taşı / Aşağı taşı (uçta olan gizli) / Adını düzelt (satır içi form, Esc bırakır) / Sil (`confirm`: başlıkta «ve altındaki N konu» der).
- **Konu satırında «Başbuğ'la çalış»**: mevcut konu bağlamı (`data-king-konu` + `data-alan`) ile sohbeti Öğretmen kipinde açar; ad = «Başlık › Konu» (asistan başlığı da bilir), ek olarak `data-king-kid` (konunun kimliği).
- **Başlıkta «Başbuğ düzenlesin»**: sohbeti başlık bağlamıyla açar ve hazır isteği yazma kutusuna koyar (göndermez; kişi Enter'a basar). İstek: başlık + numaralı konular; 1) yazım/ad düzeltmesi, 2) en çok beş eksik konu önerisi, 3) her konu için kısa ders bilgisi (ne olduğu, temel kavramlar, kişi/yer/tarih, nereden okunur); «emin olmadığını kesin gibi yazma».
- **«Konuya kaydet»**: yalnız kendi konusuyla (kid'li bağlam) açılmış sohbette, Başbuğ'un her cevabının altında. Kaydedilen metin o konunun (ya da başlığın) altında açılır-kapanır **«Başbuğ'un notu»** olur (aynı güvenli biçimleyiciyle: `KingSohbet.bicimle`); ikinci kayıt eskinin altına eklenir (üstüne yazmaz). «Notu sil» (onaylı). Düğme kaydedince «Konuya kaydedildi» olur (yenilemede kalır); konu silinmişse «Konu listende yok, kaydedilemedi».

## Veri
- Anahtar `lifeos.not.konularim` (tek anahtar, alan alan): `{ <alan>: [{ id, ad, not?, konular: [{ id, ad, not? }] }] }`. `not.` öneki kabuk/depo.js KAYIT ve sistem/veri.py KABUK_ANAHTAR'da zaten var → IndexedDB'de durur ve tek depoya eşitlenir; depo.js'e dokunmak gerekmedi.
- Sınırlar: ad tek satır ≤80, alan başına ≤40 başlık, başlık başına ≤60 konu, not ≤20000. Okumada bozuk/yabancı veri atılır.

## Sunucu
- Değişiklik **yok**. `HKM/core/sohbet.py konu_blogu` {tur:'konu', alan, ad} ile çalışıyor; kid istemcide kalır, `istekGovdesi` sunucuya yalnız {tur, alan, ad} gönderir.
- Not: sunucunun konu talimatı «bu konuyu baştan anlat» der; «Başbuğ düzenlesin»de kullanıcının isteği bunu yönlendirir. Ayrı bir «düzenle» talimatı istenirse konu_blogu'na küçük bir dal eklenebilir (yapılmadı).

## Dosyalar
- Yeni: `kabuk/konularim.js`, `kabuk/konularim.test.js`, `kabuk/konularim.css`
- `kabuk/index.html`: yalnız iki satır (araclar.css'in ardına `konularim.css`; araclar.js'in ardına, kabuk.js'ten önce `konularim.js`)
- `kabuk/king-sohbet.js` (en küçük değişiklik): konu bağlamında isteğe bağlı `kid` ([a-z0-9]{1,24}); `ayniBaglam` kid'i karşılaştırır; `istekGovdesi` kid'i göndermez; `konuylaCalis` `data-king-kid` ve `data-king-istem`i (taslağa) okur; `mesajHtml` «Konuya kaydet» düğmesi; tıklama işleyicisi `Kabuk.Konularim.notKaydet`; `sohbetOku` «kayit: 'tamam'»ı korur.
- `kabuk/king-sohbet.test.js`: +1 test (kid). `kabuk/depo.test.js`: KAYITLAR'a `lifeos.not.konularim`, taranan dosyalara `konularim.js`.
- `tools/kabuk_gez.js`: yalnız yeni blok («Kendi başlıkların», 390 px; Başbuğ uç noktası sahte cevapla), 5 denetim.

## Testler
- `node kabuk/konularim.test.js` → 5 geçti, 0 kaldı
- `node kabuk/king-sohbet.test.js` → 9 geçti, 0 kaldı
- `node kabuk/depo.test.js` → 19 test geçti
- `node kabuk/kabuk.test.js` → 76 geçti, 0 kaldı
- `node tools/kabuk_gez.js` → hepsi geçti (yeni 5 denetim dahil). İlk koşuda tek kırmızı «klasör: yeni klasör açılır» (Not sayfası, bu işle ilgisiz; o sırada başka ajanlar motor/not.js ve araclar.js üzerinde çalışıyordu); ikinci koşu tamamen yeşil.

## Görüntüler
`belgeler/ekip/sadelesme/tur-20261118k/konularim-gorsel/`: bos-, dolu-, not-acik-, sohbet-kaydet-, duzenlesin- × telefon-light / telefon-dark (390 px) / masaustu-light (1280). 390 px'te yatay taşma yok. Betik: scratchpad `cek_konularim.js`.

## Açık kalanlar
- «Başbuğ düzenlesin» sohbetinde yazma kutusu uzun istekle büyüyünce (sohbetin yapışkan yazma alanı) boş sohbetteki örnek soruların üstüne biniyor; işlevsel ama göze takılabilir (araclar.css king-yaz, bana ait değil).
- Başbuğ'un önerdiği düzeltmeler listeye kendiliğinden uygulanmaz (kişi elle düzeltir); otomatik uygulama istenirse yapılandırılmış cevap gerekir.
- Silme `confirm()` ile (görev «onayla» dedi); AGENTS kural 9 «Geri al» kalıbı istenirse araclar.js silGeriAlinir gibi bir ileti eklenebilir.
