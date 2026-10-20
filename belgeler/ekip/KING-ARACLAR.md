# King'in araç kataloğu (King 2.0, B aşaması — 2026-10-20)

Depo sahibi: «kullanıcı modüllere gitmeden King'le konuşarak her şeyi
halledebilsin; isteyen yine modülden yapar».

## Nasıl çalışır

```
kullanıcı yazar ─► kural yolu (NIYET, giriş kapısı, yetki.js, kartlar, harita)  ── modelsiz
             └──► Merkez (HKM) bağlıysa: katalog + mesaj ─► model bir ARAÇ seçer
                    HKM/core/arac.py doğrular ─► king.js yeniden doğrular (brand/ortak/arac.js)
                    oku : modülün kodu çalışır ─► sonuç 2. turda HKM'ye ─► model cümleye çevirir
                          (cevaptaki her sayı sonuca karşı denetlenir: ai.uydurma_sayilar)
                    yaz : önizleme kartı ─► yalnız «Onayla / Evet, ekle» ile uygulanır, «Geri al» kalır
```

- Tek tip araç: `ad`, `aciklama`, `parametreler` (JSON şema altkümesi), `tur`
  («oku» kayıt ve ayar değiştirmez; «yaz» değiştirir) ve uygulayan fonksiyon.
- Model yalnız SEÇER. Bilinmeyen araç, tanımsız/eksik parametre, yanlış tip,
  enum ve sınır dışı değer iki yerde reddedilir (HKM ve istemci).
- Model seçtiği için küçük eylem de sorulur (seviye en az «orta»); büyük
  eylem bu yoldan kurulamaz.
- Kayıt (`kayit_gir`): önce kullanıcının KENDİ cümlesi modülün ayrıştırıcısına
  gider; olmazsa modelin cümlesi — o cümledeki her sayı kullanıcının
  cümlesinde (rakam ya da yazıyla) geçmek zorunda. Gelecek, olumsuz ve soru
  cümlesi kayıt sayılmaz.
- Yerel model: `gemma4:e2b` gibi araç çağıran model doğrudan `tools` ile
  (seçim turunda sıcaklık 0,1). `gemma3*` gibi araçsız modele katalog gitmez
  (motor «does not support tools» derse de bir kez araçsız sorulur): olağan
  sohbet cevabı verir, işi kural yolu yapar. Metin protokolü sahada denendi
  ve bırakıldı: gemma3:4b uymadı, yapmadığı işi «aktif edildi» diye anlattı.
- Model aracı çağırmadan «ekliyorum, karartıyorum, bakayım» derse bir kez
  düzeltme istenir; yine derse cevabın yerine kodun cümlesi geçer («Bunu şu an
  buradan yapamadım; hiçbir şeyi değiştirmedim…»).
- Bulut (Gemini, OpenRouter, OpenAI, Anthropic): aynı katalog, sağlayıcının
  kendi biçiminde (`arac.saglayici_araclari`).

## King'in ortak araçları (üç modülde)

| Araç | Tür | Ne yapar |
|---|---|---|
| sistem_haritasi | oku | ne var, hangi modülde, hangi sayfada, King'den nasıl yapılır |
| sayfa_ac | oku | katalogdaki bir sayfayı açar |
| kayit_gir | yaz | yapılan işi modülün ayrıştırıcısıyla kayda çevirir (önizleme + «Evet, ekle») |
| bugun_ozeti, istatistikler, yuk_durumu, oncelik_listesi | oku | modülün kendi özet ve kartları |
| soru_sor | oku | bankadan soru kartı |
| not_ara / not_ekle | oku / yaz | Defter'de arar / yeni not yazar |
| onaylari_listele, oneri_onayla, oneri_gec, onerilerin_hepsi | oku / yaz | Onaylar'daki öneriler (yetki.js) |
| ayar_degistir | yaz | tema, animasyon, zemin, müzik (yetki.js) |
| king_ayari | yaz | cevap biçimi, düşünme derinliği, tarz, ses |
| odak_baslat / odak_durdur | oku | odak sayacı (kayıt yazmaz) |
| merkez_raporu | oku | haftalık değerlendirme, çapraz bulgular (HKM'nin kural motoru) |
| eylem_* | yaz | modülün yetki eylemleri: toplantı (AYS), inceleme (SPİ, ESP), kitap ekle (ESP) |

## Modüllerin araçları

**AYS** (`AYS/src/js/core/kingarac.js`)
- Okuma: ofis ajanlarının veri araçlarının tamamı (`core/tools.js`, 14 araç):
  durum özeti, denemeler, yanlış defteri, konular, haftalar, günler, hedef ve
  net matrisi, tekrar kartları, video notları, mola, enerji, günün akışı,
  konu riski, puan tahmini. Kişisel alanlar süzülür.
- Yazma: plan eylemleri (`data/actions.js`): konuyu tekrara al, bugüne blok
  ekle, geciken tekrarları bugüne çek, yanlıştan kart üret, haftalık soru
  hedefi, kararı kapat, ara ver, geçici süre, günlük süre, bölüm aç/gizle.
  Önizleme `Proposals.preview`, uygulama `Proposals.hemen`, geri alma `undo`.
- Kayıt (`kayit_gir` → giriş kapısı): soru, süre, paragraf, problem, uyku,
  konu notu ve plan cümleleri («bu hafta ara», «günde 4 saat», «hedef 600»).

**SPİ** (`SPI/src/js/core/kingarac.js`)
- Okuma: günün kaydı, uyku (ortalamayı kod hesaplar), antrenmanlar,
  tahliller (değer ve referans; yorum ve teşhis yok).
- Yazma: bölüm aç/gizle (öneri kuyruğu, onayla).
- Kayıt: uyku, su, kilo, nabız, HRV, his, öğün, hazır öğün ve antrenman,
  hareket, kısa uyku, tahlil satırı (SP.Quick, SP.Hazir).

**ESP** (`ESP/src/js/core/kingarac.js`)
- Okuma: günün oturumları, son günlerin alan alan dakikası, kitaplar, dil
  kartları, yazı taslakları.
- Yazma: dil kartı ekle, kitabı bitir, kitap ekle (yetki eylemi).
- Kayıt: çalışma oturumu («45 dk gitar, 20 dakika kelime»).

## King'den yapılamayanlar (gerekçesiyle)

| İş | Neden |
|---|---|
| Hesap: parola, iki adım, cihazlar, yönetici, e-posta | AGENTS §1.1: King'in yetkisi dışında; Hesap sayfasından |
| Sıfırdan başlatma, dönüş noktasına dönme | Büyük eylem; modelin seçimiyle kurulmaz. Kullanıcı kendi cümlesiyle ister («AYS'yi sıfırla»), kural yolu ve «Onaylıyorum» |
| Hedef planını uygulamak, SPİ planı/programı | Katalogda `modelYok`: Hedeflerim'den |
| Tipli ölçüm eylemleri (soru-yaz, vital-yaz, öğün, seans, kısa uyku, tahlil, şikâyet) | Sayıyı model üretmesin: ölçüm yalnız `kayit_gir` ile kullanıcının cümlesinden |
| Fotoğraf, kamera, barkod, dosya/PDF, ses kaydı | Cihazın ve kullanıcının eli gerekir; King fotoğrafı modülün akışına teslim eder (king.js söz 11), okuma ve onay ekranda |
| Canlı oturumlar: deneme çalıştırma, GPS rota, canlı antrenman, metronom, telaffuz ve konuşma pratiği | Gerçek zamanlı ekran işi; King sayfayı açar |
| Çok alanlı formlar: deneme ayrıntısı, yanlış kök nedeni, konu ölçümleri, ilaç, tarif ve besin, bütçe ve fiyat, hafta imza/revizyon, haftalık planlar, hatırlatmalar, kitap notları ve kavram bağları, felsefe argümanları, tarih olayları, yazı düzenleme | Henüz tipli araç yok; sırası gelen aday. Sayfası `sayfa_ac` ile açılır |
| Yedek, içe/dışa aktarma, profil değiştirme, Merkez eşleştirme, model ve anahtar ayarları | Dosya seçimi ve gizli anahtar; anahtar King'e verilmez |
| Bildirim izni | Tarayıcı izni yalnız kullanıcıdan |

## Denetim

- `brand/ortak/arac.test.js`, `king.test.js` (araç kataloğu), `yetki.test.js`
  (tipli niyet), her modülde `tests/kingarac.test.js`.
- `HKM/tests/test_arac.py`: katalog, doğrulama, sağlayıcı biçimleri, araçsız
  model, «yaptım» iddiası, iki tur, uç.
- Canlı deneme (2026-10-20, Ollama, gemma4:e2b): «son bir haftada kaç saat
  uyumuşum» → `spi_uyku`; «bugün 2 litre su içtim, ekler misin» → `kayit_gir`;
  «ekranı karanlık yap» → `ayar_degistir` tema=koyu; «merhaba» → araçsız cevap.
