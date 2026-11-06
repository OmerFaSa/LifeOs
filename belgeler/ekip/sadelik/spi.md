# SPİ sadelik dökümü

> 2026-11-06. Kullanıcı: «bir bölümde birden fazla özellik olduğundan anlaşılmıyor ve karmaşık
> gözüküyor». Kural: bir bölüm bir iş yapar; hiçbir özellik silinmez, yalnız yeri değişir.
> Sayılar ölçüldü: gerçek tarayıcı, 390 px, dolu profil (`tools/envanter.js` verisi), `#main` içinde.
> Sayı ve karar kodu değişmedi; tema ve Rütbe'ye dokunulmadı.

## Bulunan kök neden

1. **Seçicinin dışında duran işler.** Analiz, Öğün ve Hareket'te özet kartları sekmelerin üstünde,
   Analiz'de ayrıca altında duruyordu. Sekme değişse de sayfa aynı kalıyordu, asıl iş aşağıda kalıyordu.
2. **Telefona sığmayan seçici.** Testler 7, Hareket 6 sekme. Sığmayan sekme görünmediği için var olduğu
   da anlaşılmıyordu.
3. **Aynı yere giden düğmeler.** Sayfa başındaki düğmelerin çoğu hemen altındaki sekmeye gidiyordu
   (Test gir, Öğün ekle, Öneriyi aç, İnceleme); Bütçe'de üç düğme her sekmede duruyordu.
4. **Her şey aynı anda açık.** Her egzersizin bütün basamakları, yedi seans şablonu, altı süzgeç çipi.
5. **İç terimler.** «Modül 1», «Orkestratör», «orkestrasyon», «Talep tablosu», «yük emri».

## Çözümün kalıbı

`K.SayfaBolumleri` artık `grup` alır (`SPI/src/js/core/components.js`): gruptaki bölümler çubukta tek
düğmede toplanır, düğme adlarını sıralayan kısa bir liste açar, bölümde «‹ geri» durur. Bölümler ve
gizli düğmeleri yerinde kalır; King'in ve Ofis'in bölüm bağlantıları (`S.ui.labTab` gibi), arama ve
`layoutcheck`, `mobil_tara` aynen ulaşır.

## Ekran ekran: önce / sonra (en karmaşıktan)

| Ekran | Tek işi | Özellik: önce → sonra (ilk görünüş) | Birincil eylem | Boy px | Kelime | Düğme |
|---|---|---|---|---|---|---|
| Analiz | Bugün nasılım | 8 iş alt alta → 1 iş; seçici 4+gizli 2 → Özet · Hafta · Eğilim · Bağlar · Daha | yok (okuma ekranı) | 5505 → 888 | 534 → 52 | 24 → 13 |
| Hareket › Bugün | Bugünkü seansı seç | 5 iş → 3 iş; seçici 6 → Bugün · Egzersizler · İlerleme; 7 şablon → önerilenler + serbest | sayfa başı «Seans ekle» kalktı; seçili öneri | 1598 → 976 | 174 → 101 | 20 → 18 |
| Hareket › Kuvvet | Basamağımı gör | her hareket 6 basamak + 2 düğme → şu anki basamak; gerisi açılır | «Üst basamağa geç» yalnız hazırsa | 1580 → 1261 | 574 → 199 | sayım açılır dahil |
| Öğün › Öğünler | Öğünü yaz | 5 iş → 3 iş (yaz, günün listesi, hazır öğünler); özet «Özet» bölümünde | Ekle (tek) | 1995 → 1284 | 158 → 94 | 28 → 29 |
| Testler › Sonuçlar | Sonucumu gör | 7 sekme + 2 başlık düğmesi + 6 çip → Sonuçlar · Test gir · Geçmiş · Daha; süzgeç açılır | yok (okuma) | 842 → 842 | 102 → 85 | 25 → 23 |
| Testler › Test gir | Testi yaz | 4 alan + not + değerler → tarih, açlık, değerler; laboratuvar ve saat açılır | Testi kaydet | 1436 → 1289 | 240 → 232 | 13 → 11 |
| Bugün | Günü kaydet | Ne yaptın + 4 alanlı form + his + su + öğünler → form şerit («bugün · 0/4») | Günü kaydet (form «Kaydet»i şeritte) | 1649 → 1254 | 60 → 50 | 13 → 12 |
| İnceleme | Haftanın kararı | 7 kart, karar ikinci sırada → karar ilk, iki kart şerit | Oraya git | 1773 → 1349 | 156 → 95 | 3 → 4 |
| Danışma | Uzmana sor | sohbet + açık sesli kart → sohbet; sesli kart şerit; «Modül N» → alan adı | Gönder | 1264 → 1054 | 90 → 78 | 16 → 16 |
| Bütçe | Bu ayın durumu | 3 başlık düğmesi her bölümde → her düğme kendi bölümünde | Sepet'te «Kalem ekle» | 910 → 962 | 86 → 89 | 8 → 9 |
| Ofis › Masalar | Günün özeti | başlık düğmesi ve «orkestrasyon» kalktı; 2 açık + 7 şerit aynı | yok | 1109 → 1108 | 115 → 114 | 18 → 18 |
| Mutfak | Yemeği böl | değişmedi: tek iş, ikincil ikisi zaten şerit | yok | 1125 | 145 | 8 |
| Onaylar | Karar ver | değişmedi: kart başına bir «Doğru, kaydet» | kart başına | 949 | 97 | 9 |
| Profil, Genel, Planlar, Hedefler, Notlar, Kütüphane, Anlatımlar, Kılavuz | tek iş | değişmedi | — | — | — | — |

Bütçe'de boyun az artması bilerek: düğme başlıktan kendi bölümüne indi, başlığın yeri seçiciyle kapandı.

### Yeni yerler

| Eski yer | Yeni yer |
|---|---|
| Analiz › başta pano kartları, «Bu hafta» | Analiz › Hafta |
| Analiz › «Kategoriler», «Seriler» | Analiz › Eğilim |
| Analiz › «Çapraz bağlar» | Analiz › Bağlar |
| Analiz › Haftalık rapor, Denetim, Kavramlar, Dürüstlük, Yol haritası, içe aktarma | Analiz › Daha |
| Hareket › başta özet | Hareket › İlerleme |
| Hareket › Kardiyo, Kuvvet, Esneklik, Dinlenme | Hareket › Egzersizler |
| Öğün › başta özet, dönen kart | Öğün › Özet |
| Testler › Karşılaştır, Paneller, İlaç, Eğilim | Testler › Daha |
| Bütçe › başlıktaki düğmeler | Bütçe, Sepet, Fiyat bölümlerinde |

### Ad değişiklikleri

Talep tablosu → Aylık ihtiyaç · Günün yük emri → Bugünkü yük · Orkestratör → Baş danışman ·
Modül 1–4 → Tahlil, Beslenme, Hareket, Bütçe (Danışma ve komut paleti) · Çapraz bağlar (seçicide) → Bağlar.
Kırmızı bayraklar Testler'de seçicinin üstünde kaldı (testli); sınır satırı ve uyarılar yerinde.

## Ortak gerekli (`brand/ortak/`, bu işte dokunulmadı)

1. **Çekmece seçicisi telefonda sığmıyor.** Çalışma'nın beş bölümü 390 px'e sığmıyor, Testler
   sola kayıp kesiliyor. Çekmece seçicisi ile sayfa seçicisi piksel temada aynı görünüyor; üst üste iki
   sekme satırı karmaşanın kalan büyük parçası. `piksel.css` ve `kabuk.js`.
2. **«N bölüm gizli» notu.** `gizle.js` sayfanın bütün bölümlerini sayıyor; Analiz'in her bölümünde
   «Raporun mantığı gizli» yazıyor. Yalnız açık bölüm sayılmalı.
3. **Grup kalıbı.** AYS ve ESP isterse `components.js` üç modülde ayrı kopya; ortağa alınabilir.
4. **Windows'ta yanlış kırmızı.** `tools/ortak.py --denetle` ve `tools/parca_test.py`, satır sonu farkı
   yüzünden kırmızı (`parca-rehber.js`, CRLF). `brand/` bu dalda değişmedi; içerik satır satır aynı.

## Sana sorulacaklar (silme önerisi, yapılmadı)

Aynı bilginin iki kez durduğu yerler; hiçbiri silinmedi:
- Analiz › Hafta: «Bu hafta» kartı ile pano kartları (uyku ve toparlanma iki kez).
- Ofis › İnceleme «Son yedi gün» ile Analiz › Hafta.
- Ofis › Masalar: «Günün özeti» ile «Patron masası» aynı cümleleri söylüyor.
- Öğün: «Hazır öğünler» ile yazma kutusunun altındaki öneri çipleri.

## Denetim çıktıları (2026-11-06)

| Denetim | Sonuç |
|---|---|
| `SPI: node tools/runtests.js` | 3174/3174 (önce 3164; 10 yeni test `bolumler.test.js`) |
| `SPI: node tools/smoke.js` | temiz, 2 hedefte 42 ekran |
| `SPI: node tools/layoutcheck.js` | temiz, 390 ve 820 px, 114 yer |
| `SPI: node tools/a11ycheck.js` | temiz (1 bilinen eksik izin listesinde) |
| `node tools/mobil_tara.js SPI` | 256 ölçüm, 0 bulgu |
| `python tools/yazi.py --denetle` | temiz |
| `node tools/pusula.js` | SPİ Y1 3 eylem, 15 sn tahmin; Y2 2; Y3 4 (hedefte) |
| `node tools/sadelik.js SPI --denetle` | yalnız Rütbe aşıyor (6 açık kart; dokunma kararı) |
| Elle yürüyüş, gerçek tıklama, 390 px | şerit açma + ölçüm yazma, Daha › İlaç › geri, yeniden çizim, bölüm bağlantıları, serbest seans, Kalem ekle: hepsi çalıştı, sayfa hatası yok |

## Yapılmayanlar

- Gerçek telefonda denenmedi; ölçüm tarayıcıda 390 px.
- Masaüstü yalnız ekran görüntüsüyle bakıldı (Analiz); ayrı düzen denetimi 820 px'te bitiyor.
- Test gir'in 54 alanı aynı: katalog kendi başına uzun, liste zaten «Tamamını göster» ile kısalıyor.
- Hareket › İlerleme 2429 px kaldı (beden, yük eğrisi, geçmiş); sıradaki aday.
- Analiz › Eğilim 2067 px ve Fizyoloji 722 kelime kaldı; başvuru metni.
- `tools/entegre.js` koşulmadı: `brand/ortak`, `HKM` ve sunucu değişmedi (AGENTS §2).
- `tools/envanter.js` koşulamadı (port 4391 başka oturumda). Eylem kaldırılmadı; kalkan tek işleyici
  `spi-analiz-ayrinti` tabanda yok (arandı).
