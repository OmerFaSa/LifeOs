# Faz 0 sentezi · 12 Kasım 2026

> Dokuz raporun ve `plan.html` §4, §8, §9, §10, §11'in salt okur birleşimi. Her iddia rapor adı + § ile.
> Kısaltmalar: DZ depo-zemini · AYS envanter-ays · SPİ envanter-spi · ESP envanter-esp · KS envanter-kabuk-sunucu ·
> KH king-hkm · VK veri-katmani · İH icerik-hatti · NT not-ve-tekrar. «tahmin» yazmayan sayılar raporlarda ölçülmüştür.

## 1. Rapor başına özet

**DZ (depo-zemini)**
- 92 yerel dal: 84'ü `origin/main`'de; 8 dal girmemiş, toplam 17 kayıt (DZ §Özet, §sekiz dal). İçeriklerine bakılmadı (DZ §sekiz dal).
- 17 çalışma kopyası; ana kopya 36 kayıt geride, 22 izlenen dosyada bitmemiş iş (DZ §Özet).
- Yapıldı: ana kopya `yedek/ana-kopya-20261112` (`21b28793`) dalına alındı, `origin/main`'e sarıldı; 75 birleşmiş dal silindi; kalan 18 dal, 16 kopya (DZ §Temizlik 1, 2, 4).
- Ana kopyada izlenmeyen `veri/taslak/{ays 12, esp 12, spi 3, king 1}` + `veri/temiz/mufredat 1` (DZ §bitmemiş iş).

**AYS (envanter-ays)**
- 25 ekran dosyası (20 797 satır), 29 kayıtlı sayfa, 9 çekmece, 38 iç bölüm, 160 blok, 35 komut (AYS §1).
- `core/` 161 dosya: 97 ortak kopya, 3 `brand/seviye` kopyası, 61 yalnız AYS (AYS §1, §3); 155 test dosyası (AYS §1).
- Veri: 35 depo öneki + 14 `meta/*` + 2 `plan/*`; şema v5, tek localStorage anahtarı `rota84285.v2` (AYS §5).
- İçerik: 8 ders, 184 konu, anlatımda 744, derin katmanda 1 104, paragrafta 100 soru; yalnız sayısal alan (AYS §6).
- Tekrarlar: dört pratik yolu, iki öğrenme yolu, konu beş yerde, not beş yerde, sınav analizi dört yerde (AYS §8).

**SPİ (envanter-spi)**
- 20 ekran dosyası (16 247 satır + `app.js` 2 280), 21 menü sayfası, 40 `TABS` sekmesi, 76 blok (SPİ §1).
- `core/` 162 dosya: 97 ortak kopya, 65 modüle özgü (3'ü yine `brand/seviye` kopyası) (SPİ §1, §3).
- Kural motorları güçlü ve testli: `bio.js` 72, `nutri.js` 50, `move.js` 50, `rota.js` 53 test; 58 biyobelirtecin 40'ında kırmızı bayrak eşiği (SPİ §4).
- Veri: `spi.v1.<profil>`, şema v1, göç yalnız sürüm yazar; fotoğraflar IndexedDB `spi-foto`, yedeğe girmez → göçte kayıp riski (SPİ §5).
- İçerik: egzersiz kataloğunda 57 kartın 50'si, 30 kavramın 30'u, 20 programın 20'si «uzman incelemesi bekliyor» (SPİ §6).

**ESP (envanter-esp)**
- 19 ekran dosyası (12 730 satır), 18+1 kayıtlı sayfa, 8 çekmece, 42 sekme, 54 blok; altı disiplin ekranında 114, bütün ekranlarda 234 `K.Entry` açılır araç çağrısı (ESP §1).
- `core/` 156 dosya: 97 ortak kopya, 56 gerçek ESP + 3 `brand/seviye` kopyası; 152 test dosyası (ESP §1, §4).
- Merdiven: 7 merdiven × 5 basamak, **6 kademe** (Temas…Üstat), 86 kapı, 38 metrik, 76 egzersiz; kapıların çoğu hacim ölçer, bilgi değil (ESP §7).
- Sıralı ders yolu veri olarak yok: 68 konu (önkoşul alanı 0), 68 kart hepsi `ready_for_app:false`, 14 anlatım (ESP §3).
- İki tekrar takvimi (`srs.js` Leitner+SM-2 ve `ogret.js` `[1,3,7]`), kolaylık iki sınırda (2.8 / 3.2); 9 ajanlı ofis + 7 disiplinde ayrı Uzman masası (ESP §5, §8, §9).

**KS (envanter-kabuk-sunucu)**
- `brand/ortak` 228 dosya (147 test dışı); `tools/ortak.py` `DOSYALAR` **226 girdi**, her biri 3 modüle kopya (KS §1).
- Ayar: `KATALOG` 72 anahtar + `SECIMLER` 15; `TEKNIK.md`'nin «altı yer»inin beşi zaten katalogdan türetiliyor, elle kalan `SECIMLER` + panel HTML'i; 8 seçimin denetimi çizilmiyor (KS §3a).
- Sunucu: tek `sunucu.py` süreci 4173/4183/4193/4180 + ev ağı 5173/5183/5193/5180; HKM ayrı süreç 4200; hesap dışı 19 + hesap 70 `/api/` yolu (KS §5a, §5b).
- Cihaz: 9 bağlanma yolu sayıldı (PC tarayıcı, Electron, tek dosya, ev ağı, Tailscale, iOS kabuğu, Android, Kısayollar, takvim) (KS §6a); emekliye ayrılacak ev ağı kodu ≈ 713 satır (434 + 279) (KS §6c).
- Sahne 14 dosya 544 660 bayt, ama piksel dili 426 `[data-zemin="piksel"]` seçicisine bağlı; `brand/seviye` medyası 84 MB (57 MB mp4) git'te (KS §4a-c, §7a).

**KH (king-hkm)**
- Bir mesaj iki kural motorundan geçer (istemci `king-yol.js` `isle()`: 101 `return`, 33 regex, 23 «King-Bench» yaması; sunucu `sohbet.py` `_kural_yolu`), model en sonda (KH §1).
- Felsefe→sayfa kökü tasarımda: `NIYET` 13 regex + `parca-rehber.js` 26 sayfa/76 sözcük, dar `merkezYolu`, geniş `SISTEM_KONUSU`; serbest sohbette bağlam yalnız tarih satırı. Claude'a geçmek yalnız model kısmını çözer (KH §2).
- Araç: model kataloğu **124** (57 oku / 67 yaz), yetki/niyet/Patron ile **162**; modül başına ≈69/56/59, modele en çok 4 gider; 12 üst araç önerildi (KH §3).
- HKM: 93 `core/*.py` + `daemon.py` 2 409 satır, 126 `/api/` yolu; MCP kodu yok, araçlar tarayıcıda çalıştığı için MCP bugün yazamaz (KH §7, §9).
- Ölçüm: `king_sinav.json` 358 cümle (293/300'ün sürümü belirsiz), King-Bench 13 paket 350 vaka; «Kendini eğitme» eğrisi için düzenek yok (KH §8).

**VK (veri-katmani)**
- Doğruluk kaynakları: 3 modül localStorage (tek JSON anahtar, ~5 MB/köken) + 4180 Gün kökeni (`lifeos.gun.<tarih>`, sunucuda yalnız son gün) + IndexedDB (`spi-foto`, `ays-soru-foto`, `lifeos-defter-<modul>`; eşitlenmez) + `hkm.db` + `ayar.json`; `hesap.db` kayıtlar için yalnız **kopya** (VK §1a-c).
- `hkm.db` **50 tablo** (51 `CREATE TABLE`'dan biri yorum), 35'i yedekte; `hesap.db` 15 tablo; koleksiyon önekleri AYS 34, SPİ 26, ESP 33 (VK §1a, §1c).
- Eşitleme: duvar saati + kayıt düzeyi «son yazan kazanır», ilk eşitlemede `z:1`, mezar taşları budanmıyor (VK §2).
- Hipotez «hesap sunucusu her şeyi tutuyor»: **kısmen doğru**; açılmamış profiller, bekleyen sıra, ana depo dışı anahtarlar, fotoğraflar, Gün geçmişi ve HKM verisi eksik (VK §3).
- Kesinlik etiketi iki dilde (`derived`/`computed`) ve dört yerleşimde; SPİ vitals'ta etiket yok, AYS `normMood` boş enerjiyi 3 yapıyor (VK §4, §7 R2-R3).

**İH (icerik-hatti)**
- `C:\gemini-data` 1 306 dosya; 4 modülde 632 json+md çifti (AYS 147, ESP 125, KING 146, SPİ 214) + MÜFREDAT 6 + MEDYA 12; 650/650 JSON geçerli ama 521 farklı şekil, ortak şema yok (İH §1.1-1.2).
- 2 523 kaynak girdisinin URL taşıyanı 0, doğrulama alanı 0 → hepsi «doğrulanmamış» sayılmalı; 29 md'de bozuk LaTeX, 15 benzer ad çifti (İH §1.2-1.5).
- İçerik ders değil, «bilene başvuru atlası»; Dil A1, gitar 0-2. aşama, hareket başlangıcı yok (İH §1.4, §2).
- Depodaki tek gerçek ders biçimi AYS `anlatim-*` (184 konu); Ders = `ogrenmotor.js` konu biçimi, Aşama kapısı = ESP merdiveni; `veri/plan/konular.json` 1 309 başlık iskeleti hazır (İH §3, §4).
- Pilot önerisi Felsefe (aşama 1-2: 15 ders, 5 var / 7 kısmi / 3 boşluk; İngilizce 16 ders, 1/7/8); Akademik dışında ≈900-1 000 ders eksik (tahmin) (İH §7.1-7.2).

**NT (not-ve-tekrar)**
- `defter.js` 1 968 satır, 96 fonksiyon, 29 özellik, 19 dosyadan çağrılıyor; bağlantı başlıkla kurulur (yeniden adlandırmada kopar), King izin alanı yok (NT §1).
- Not benzeri 13 ayrı yapı (notum, konu notu, video notu, ESP notes/args/drafts, öğrenme motoru notu, sözlük, Bilinç haritası…); iki ayrı ağ çizimi (`defter.js` + `bilinc.js`) (NT §2, §3b).
- Önerilen Not motoru: 4 kayıt (`not`, `klasor`, gövdeden türeyen bağ `[[not:ID|Ad]]`, `arac`) + 3 çağrı (`NOT.ac/bagli/secileniEkle`) (NT §3a, §3c).
- **9 ayrı zamanlayıcı** + 1 yetim tablo (`meydan_deste`); üçü (#6 ogret, #7 king-devrim, #9 kavrat) yalnız localStorage'da, eşitlenmiyor (NT §4).
- Öneri: FSRS biçiminde tek Tekrar motoru, yayımlanmış varsayılan ağırlıklarla (~150 satır, tahmin); göç vadeyi değiştirmez (NT §5).

## 2. Birleşik aday listesi

| # | Aday | Raporlar | Hedef | Paket · faz | Risk |
|---|---|---|---|---|---|
| 1 | Beş ayrı veri yeri → tek depo (3 köken + 4180 Gün + `hkm.db` + IndexedDB medya) | VK §3, §6 · KS §8a#1 | birleştir (Çekirdek) | A3 · Faz 1 | **yüksek**, veri kaybı: fotoğraflar, açılmamış profiller, bekleyen sıra, Gün geçmişi |
| 2 | HKM ayrı süreci, web yüzü (7 873 satır), köprüler `yedekag/hkmbag/hedefag` | KH §7 · KS §1d, §8a#7 | SİL köprüler; çekirdek → tek sunucu | A4 · Faz 1; yüz Faz 7 | **yüksek**: `para`, `motto_*`, `memories`, `conversations` yalnız `hkm.db`'de (VK §1c) |
| 3 | BAM (`bam.py` 1 506) + iki araştırma kodu (`bam.py`, `arastir.py`) | KH §6 | MOTOR:Arama, kalan ARŞİV | A7 · Faz 5 | orta: `bam_kayitlar` göçü; 15 test dosyası |
| 4 | Ofis ve ajanlar (AYS 6, SPİ 5, ESP 9), toplantı, brifing, `ekip.py`, `gorev.py` | AYS §8#1 · SPİ §8#1 · ESP §9#2 · KH §7 | KING (validate, kart üretimi, defter); kişilikler SİL; tutanak ARŞİV | A7 · Faz 5-6 | orta: `meetings/`, `chats/`, `journal/` arşive; SPİ `office.test.js` 55 test |
| 5 | ESP Uzman masası (7 disiplinde, Ses'te 2) | ESP §2b, §9#1 | SİL; sohbet KING, ek MOTOR:Not, hatırlatma MOTOR:Plan | A6 · Faz 3/6 | orta: `assets`, `reminders` yetim kalır |
| 6 | Üç öneri kutusu + Onaylar ekranları + `kingteklif.js` | AYS §7a · SPİ §8#2 · ESP §2c | birleştir → KING tek onay kapısı | A7 · Faz 5 | orta: onay kapısı kaybolmamalı |
| 7 | XP/rütbe/başarım/perde (`brand/seviye` ×3, 3 Rütbe sayfası, 84 MB medya) | AYS §8#2 · SPİ §8#9 · ESP §9#7 · KS §7 | ARŞİV ya da tek kabuk XP (karar 5) | A2 karar, A5 · Faz 2 | orta: `seviye`/`basarim` defteri; yeniden üretim doğrulanmadı (KS §7c tahmin) |
| 8 | Dürüstlük katmanı: calib, goodhart, friction, signals, audit, EHS | AYS §8#3 · SPİ §8#4 · ESP §9#5 | ARŞİV (SPİ `signals`, `audit` → MOTOR:Kayıt) | A2 · Faz 6 | düşük: `forecasts`, `usage` veri kalır |
| 9 | 9 zamanlayıcı → tek Tekrar (AYS SRS, ESP Leitner+SM-2, ogret, king-devrim, usta, kavrat…) | NT §4-5 · ESP §9#3-4 · AYS §8#4 | MOTOR:Tekrar | A6 · Faz 3 | orta: 3 kaynak yalnız localStorage; vade aynen taşınmalı |
| 10 | Not benzeri 13 yapı → tek Not motoru (+ iki ağ çizimi tek ağ) | NT §2-3 · AYS §8#9 · ESP §9#9 | MOTOR:Not | A6 · Faz 3 | orta: ESP koleksiyonlarının şeması okunmadı; Bilinç yalnız 4180'de |
| 11 | Öğrenme yolları (AYS 2 yol, SPİ 4 yer, ESP Kütüphanem › Öğrenme + Öğren sekmeleri) | AYS §8#5 · SPİ §8#8 · ESP §9#8 | MOTOR:Yol | A6, A8 · Faz 3 | düşük: ortak `ogrenmotor.js` var |
| 12 | Pratik ve sınav: 4 pratik yolu, sınav analizi 4 yerde, konu 5 yerde | AYS §8#4, #6, #7 | MOTOR:Soru + MOTOR:Yol | A6 · Faz 6 | düşük |
| 13 | Plan/hedef dağınıklığı (AYS hedef 5 yerde, ESP 2 hedef koleksiyonu, HKM `program.py`+`planlama.py`) | AYS §8#8 · VK §4 · KH §7 | MOTOR:Plan | A6 · Faz 6 | orta: hedef biçimleri farklı |
| 14 | Özet/analiz tekrarı (SPİ Ayrıntı↔Özet↔Haftalık rapor, Testler 4 «Daha» sekmesi, ESP Analiz) | SPİ §8#3, #6, #7 · ESP §9#6 | birleştir → MOTOR:Kayıt / alan İlerleme | A5, A6 · Faz 6 | düşük |
| 15 | SPİ Bütçe (`basket.js` 841, `money.js` 413, `prices.js`) | SPİ §8#5 | ARŞİV | A2 · Faz 6 | düşük: `money.test.js` 42 test arşive |
| 16 | Statik tablo «araçlar» ve 11-13 araçlı sekmeler → ders içeriği | ESP §2a, §9#10 | birleştir (ALAN ders) | A8 · Faz 3/6 | düşük: içerik silinmez |
| 17 | King sözcük yönlendirmesi (`NIYET` 13, `parca-rehber` 76 sözcük, 23 yama) + 124 araç → 12 üst araç | KH §2a, §3 | KING | A7 · Faz 5 | orta: sınav kararları değişir |
| 18 | Kenar çubuğu, port geçişi, 3 `go()/render()`, 4180'e gömülü iki sayfa | KS §2a, §8a#3, #8 | KABUK (tek URL'li yönlendirici) | A5 · Faz 2 | orta: 3 `app.js` 7 205 satır |
| 19 | Sahne (14 dosya, 544 660 bayt) + 8 denetimsiz seçim + ölü `data-*` | KS §3b, §4, §8a#5, #9 | ARŞİV (önce `piksel.css` ayrımı) | A5 · Faz 2 | orta: 426 seçici piksel dilini taşıyor |
| 20 | Kopya dağıtımı (`tools/ortak.py`, `YERTUTUCU`, `tools/seviye.py`) + ev ağı https (≈713 satır) + tek dosya `dist` | KS §6c, §7c, §8a#4, #6 | SİL | A10 · Faz 7 | orta: Tailscale'siz cihaz kesilir |

## 3. §10 başarı ölçütleri için yeni sayılar

| Ölçüt | Plandaki | Raporlardaki | Önerilen hedef | Kaynak |
|---|---|---|---|---|
| Uygulama | 4 | 4 doğru (AYS, SPİ, ESP, HKM); ayrıca 4180'de Python'a gömülü giriş + Ana sayfa yüzü | 1 | KS §2d |
| Kapı (adres) | 5 + 4 | doğru: 4173/4183/4193/4180/4200 + 5173/5183/5193/5180; ek olarak Tailscale `:443` → 4200 | 1 | KS §5a, §6a |
| Verinin doğrusu | 5 ayrı yer | en az 6 (3 köken + 4180 Gün + `hkm.db` + IndexedDB medya: `spi-foto`, `ays-soru-foto`, `lifeos-defter-<modul>`) + tercih için `ayar.json`; `hesap.db` kayıtta kopya, kimlikte tek kaynak (hesaplandı) | 1 depo + cihazda önbellek; medya için karar | VK §1a-c, §3 |
| Üçe kopyalanan dosya | 326 (244'ü aynı) | 226 `DOSYALAR` girdisi + `brand/seviye` 10 dosya, her biri ×3; «244 aynı» hiçbir raporda ölçülmedi | 0 | KS §1, §7a |
| Bir ayar için dokunulan yer | 6 | 2: `SECIMLER` satırı + panel HTML'i; öteki dördü `KATALOG`'dan türetiliyor (TEKNIK.md eskimiş); 8 seçimin denetimi yok | 1 şema satırı; denetimsiz seçim 0 | KS §3a, §3e |
| King'in gördüğü araç | ≈ 100 | model kataloğu 124 (57 oku / 67 yaz), yetki + niyet + Patron ile 162; modül başına ≈69/56/59; modele en çok 4 gidiyor | ≤ 12 (öneri tam 12) | KH §3 |
| İç içelik | 3 kat | ESP'de 4: çekmece › disiplin › sekme › açılır araç (234 `K.Entry`); Uzman masası içinde 5 kat daha | ≤ 2 | ESP §1, §2b |
| Cihaz yolu | 4 | 4 ağ yolu doğru (tek dosya, ev ağı, Tailscale, iOS kabuğu); bağlanma biçimi toplam 9 (PC, Electron, Android, Kısayollar, takvim dahil) | 1 (Tailscale) + PC yereli; iOS kabuğu kararı | KS §6a, §6c |
| Ekran ve parça sayısı | 64 · 1.015 | ekran dosyası 25 + 20 + 19 = 64 doğru; «1.015» `parcalar.txt` satırına denk (1 036 satır, 585'i test, test dışı 431); kayıtlı parça 79 sayfa + 304 blok + 69 komut | sayfa ≤ 40, ekran içi sekme 120 → 0, test dışı yükleme satırı ≤ 215 (üçü de **tahmin**: 5 harita dalı, sekmesiz yol sayfası, yarıya iniş) | AYS §1 · SPİ §1 · ESP §1 · KS §2b-c |
| On üç eğri | ölçülmedi | KH 10 King eğrisini eşledi; «Kendini eğitme» için düzenek yok; sınav 358 cümle, Bench 350 vaka, serbest sohbet ölçülmüyor | taban Faz 4'te (değişmez) | KH §8 |
| Ek: tekrar zamanlayıcısı | (A6: «üç») | 9 + 1 yetim tablo | 1 | NT §4 |
| Ek: not biçimi | — | 13 not benzeri yapı, ağ çizimi 2 | 1 motor, 1 ağ | NT §2, §3b |
| Ek: kesinlik etiketi dili | 4 etiket | 2 dil (`derived`/`computed`), 4 yerleşim, SPİ vitals'ta yok | 1 dil, sayı başına zorunlu | VK §4 |

## 4. Sahibine sorular, tekilleştirilmiş

Kararlar (plan §11): 1 tek sistem · 2 geçiş yolu · 3 kural metriği · 4 King'in yeri · 5 yan sistemler · 6 tasarım · 7 pilot alan · 8 cihaz yolu.

| Soru | Bağlı karar | Neden önemli | Raporlar |
|---|---|---|---|
| Çok profil ve hane kalsın mı; AYS `main` ile SPİ/ESP `ben` aynı kişi mi; hesap çok kullanıcılı kalsın mı? | 1 | Depo profil başına; profil listesi 5 yerde; göç eşlemesi buna bağlı | AYS §9.5 · SPİ §9.1 · KS §8b.7 · VK §7.2, §7.9 |
| Depo bulut kipi (`window.claude.use('db')`) birleşik katmanda kalsın mı? | 1 | `depo.js` iki kipli | AYS §9.10 |
| XP/rütbe: tek genel seviye mi, alan başına mı, tümden arşiv mi; perde ve 84 MB medya (LFS?) | 5 | 3 modülü birden etkiler; SPİ'de 2026-11-06'da «dokunma» denmiş | AYS §9.1 · SPİ §9.5 · ESP Soru 3 · KS §8b.1, §8b.8 |
| Ofis tamamen King'e mi; «uzman sesi» (Sokrates, Herodot…) King'de kişilik olarak kalsın mı; tutanak/sohbet/defter arşiv mi silme mi? | 5 | 20 ajan, 3 ofis; koç adları merdivenlerde `coach` alanı | AYS §9.6 · ESP Soru 5 · SPİ §8#1 |
| Kalibrasyon, sürtünme, deney, veli raporu, ruh hâli tahmini, Günün sorusu kalsın mı? | 5 | Raporlar SORU ile ARŞİV arasında bölünmüş (§6) | AYS §9.2, §9.4 · SPİ §9.10 |
| Bütçe ve Mutfak arşive mi? | 5 | 4 + 1 sekme, hane özelliğine bağlı | SPİ §9.2, §9.3 |
| Radyo ve kendi müzik dosyaları; sahne (apartman, doğa, minikler, sinematik) tümden park mı? | 5, 6 | `ses.js` 67 KB, 8 ayar anahtarı; piksel dili ayrımının kapsamı | KS §8b.5, §8b.6 |
| BAM ürünleri, Patron/VP görünürlüğü, WhatsApp/Telegram, King sesi | 5 | Kanal kalırsa tek sunucuda kanal katmanı gerekir | KH §10.4-7 |
| Uygulama kapalıyken/telefondan kim cevaplasın; Claude API aylık tavanı (bugün 20 USD) | 4 | MCP yalnız masaüstü açıkken çalışır | KH §10.2, §10.3 |
| Sohbet niyetinde King sayfa açsın mı, «açayım mı?» mı sorsun? | 4 | Felsefe → sayfa sorununun kapanışı | KH §10.1 |
| Ana ekran: hızlı giriş kutusu ile King kayıt niyeti tek kutu mu? | 6 | `quickentry.js` 655 satır modelsiz çalışıyor | SPİ §9.6 |
| Adres çubuğunda sayfa yolu (geri tuşu, yer imi) istiyor musun? | 6 | Bugün URL yok; yönlendirici tasarımı | KS §8b.10 |
| Kütüphanem rafı ve «haftanın notu» kartı kalsın mı? | 6 | NT «at» önerdi | NT §6.5 |
| iOS kabuğu kalsın mı; ev ağı kapansın mı; Tailscale'siz cihaz var mı; tek dosya `dist` gerekli mi? | 8 | ≈713 satır ev ağı kodu, 3 `build.py`, SPİ canlı rota | KS §8b.2-4 |
| Haftalık sözleşme, aylık karar kapısı, telafi, kötü gün, dünün aynısı, süreölçer: Plan/Kayıt kuralı mı? | 3 («bir giren bir çıkar») | Küçük ama günlük kullanılıyor olabilir; kullanım sayacı yok | AYS §9.3, §9.9 · ESP Soru 10 |
| Pilot için ses kaynağı (dil, gitar telaffuz/dinleme) | 7 | Felsefe sesi gerektirmez; Dil seçilirse altyapı yok | İH §7.3.6 |
| **YENİ-1** Alan listesi ve kapsamı: Diksiyon nereye; Okuma+Yazı tek merdiven mi; 8 dil mi en/de mi, sonraki dil; YKS SAY/EA/sözel; Uyku ilk turda mı; İlaç ekranı; «Testler» → «Tahlil» | YENİ | Plan alan listesinde Diksiyon yok; konu ağacı yalnız sayısal | ESP Soru 1, 2, 8 · AYS §9.7 · İH §7.3.5, §7.3.7 · SPİ §9.4, §9.9, §9.11 |
| **YENİ-2** Göç kapsamı ve etiket: türetilmiş kayıtlar, ofis/XP geçmişi, HKM tabloları, `meydan_deste` taşınsın mı; SPİ vitals etiketsiz sayı ve AYS enerji = 3 nasıl işaretlensin? | YENİ | Kuru koşu etiketsiz sayıyı reddeder; karar yoksa göç durur | VK §7.3-5, §7.8 · ESP Soru 9 · NT §6.9 |
| **YENİ-3** Fotoğraf ve medya PC'ye eşitlensin mi (AGENTS §1.4)? | YENİ | Eşitlenmezse tek depoda da cihaz kaybında gider | SPİ §9.7 · VK §7.1 · NT §6.4 |
| **YENİ-4** İçerik onayı: `icerik/` sınıfı; onaysız ders tekrara girsin mi; kaynak denetimi yalnız pilotta mı; KING klasörü (146 çift); sağlık sınırı (BPC-157); «inceleme bekliyor» kartları taslak etiketiyle girsin mi; yinelenen 15 çift | YENİ | 2 523 kaynak URL'siz; 68 + 30 + 50 kart onaysız | İH §7.3.1-4, §7.3.9-10 · ESP Soru 7 · SPİ §9.8 |
| **YENİ-5** Ustalık kapısı: basamak geçişinde bilgi sınaması zorunlu mu; yerleştirme test temelli mi? | YENİ | 86 kapının çoğu hacim ölçüyor | ESP Soru 6 · İH §7.3.8 |
| **YENİ-6** Tekrar algoritması: FSRS mi sabit aralık mı; hedef hatırlama oranı ve günlük tavan; «3 doğruda kapanır»; geçmiş sınırı 40/50 | YENİ | Faz 3 Tekrar motorunun şekli | NT §6.6-8, §6.10 |
| **YENİ-7** King'in veri izni ve hafızası: notları varsayılan okusun mu; model hafızaya hiç yazamaz kuralı; ders havuzu hangi hesapları kapsar; Bilinç ayrı depo mu; «Yeni araç» kodsuz mu | YENİ | Defter'de izin yok, Bilinç'te iki düzey var | NT §6.1-3 · KH §10.8-9 |
| **YENİ-8** Diskte şifreleme (EFS/BitLocker) yeterli mi? | YENİ | Sağlık ve para verisi düz metin; TOTP sırrı açık | VK §1b, §7.7 |
| (Doğrulama, karar değil) 293/300 hangi sınav sürümü; canlı ayarda hangi model atanmış | A1 | Anlama eğrisinin tabanı; `gemma3` ise katalog hiç gitmiyor | KH §10.10-11 |

## 5. Plana etkiler

**Sıra ve büyüklük**
- **A3 büyüyor (Faz 1).** Göç `hesap.db`'den başlayabilir ama bitemez (VK §3): her cihazdan, her kökenden, bütün profilleri ve IndexedDB medyasını taşıyan bir «göç paketi» gerekir (VK §6 kaynak 2-3). Bu, donmuş eski modüllere eklenecek tek düğmedir; §9 «Dondurma» kuralına yazılı istisna olmalı. Faz 1 kapısı «kullanıcı için görünür değişiklik yok» bu yüzden tam doğru değil.
- **A3'ün ön koşulu iki karar (YENİ-2, YENİ-3).** Kuru koşu etiketsiz sayıyı reddediyor (VK §6); SPİ vitals etiketsiz, AYS enerji 3. Karar gelmeden Faz 1 kapısı geçilemez.
- **A3 kaynak sayısı 5** (hesap.db, köken paketleri, 4180 Gün, `hkm.db`, PC dosyaları) (VK §6); HKM süreci (A4) bu göç doğrulanmadan kapanmamalı.
- **A4 → A7 bağı.** MCP bugün yazamaz, çünkü araçlar tarayıcıda çalışıyor (KH §9). Plan §6 «önce MCP ucu» yazma için Faz 1 sonrasına bağlı; Faz 1'den önce yalnız salt okur MCP mümkün (KH §9, «okuyabilir ama yazamaz»).
- **A5 küçülüyor, bir ön adım ekleniyor.** Ayar şeması sanıldığından küçük (5/6 yer zaten katalogdan, KS §3a); ama sahne park edilmeden önce `piksel.css` token/bileşen ↔ sahne olarak bölünmeli (426 seçici, KS §4c-d).
- **A6 Tekrar büyüyor.** Plan «üç tekrar düzeni» diyor, NT §4 dokuz sayıyor; FSRS kararı (YENİ-6) Faz 3'ten önce. Not motoru 13 yapıyı karşılamalı; pilot Felsefe seçilirse ESP `args` (tez) türlü notu ilk sürümde gerekli (NT §2, §3a).
- **A7'nin bir parçası öne alınabilir (öneri).** Felsefe→sayfa sorunu modelden değil sözcük yönlendirmesinden (KH §2a, §2c); `NIYET` + `parca-rehber` kaldırılması küçük ve bağımsız. Dondurma altında «hata düzeltmesi» sayılıp Faz 2'ye çekilebilir; ama önce Anlama tabanı alınmalı, yoksa önce/sonra farkı kaybolur (KH §8: serbest sohbet cümlesi sınavda yok).
- **A9 tabanı Faz 0'da kısmen.** Faz 2 kapısı «anlaşılabilirlik eğrisi tabandan iyi» Faz 4'ten önce bir taban ister; Sistem eğrileri (adım sayısı, iç içelik) Faz 0'da kaydedilmeli.
- **A8 pilot: Felsefe.** Aşama 1-2'de 15 dersin 5'i var, 7'si kısmi, 3'ü boş; İngilizcede 16'nın 1'i var, 8'i boş (İH §7.1). Felsefe yalnız metin ister, kaynak (29 atlas, 22 MEB kazanımı, 103 ansiklopedi kaydı) en zengini, sağlık riski yok; Dil ses/dinleme altyapısı ister ve hiç yok. Dil ikinci pilot: alıştırma tarafı (kart, SRS, Tatoeba) hazır (İH §7.1). Pilot için yazılacak ders ≈10 (7 kısmi + 3 boşluk; tahmin).
- **A8 gerçek ölçek.** Akademik dışında ≈900-1 000 ders eksik (İH §7.2, tahmin); «iskelet önce, ders istek üzerine» tek gerçekçi yol. Takvim A2'den sonra hesaplanırken bu sayı girdi olmalı.
- **A1'e iki madde.** `brand/seviye/medya` 84 MB (57 MB mp4) git'te, LFS yok (KS §7a); 8 dal için karar bekliyor (DZ §Temizlik 3).

**Plan §9 risk tablosuna eklenecek satırlar**

| Risk | Önlem |
|---|---|
| Fotoğraf ve medya kaybı (IndexedDB, cihaza bağlı, eşitlenmiyor) | Her cihazdan ayrı göç paketi; medya sayısı kuru koşu raporunda (SPİ §5, VK §3, NT §1a) |
| Cihazda bekleyen, PC'ye gitmemiş değişiklik | Faz 1 öncesi her cihaz, her modülde «bekleyen 0» denetimi (VK §6 #0, KS §8b.9) |
| Kesinlik etiketinin göçte uydurulması | `derived→computed` çevrimi sayılır; etiketsiz sayı «eski kayıt» işaretiyle, sahibin kararıyla (VK §7 R2-R3) |
| Geçişte saat kayması ve kayıt düzeyi ezme (köprüden yazan eski modül) | Köprü de HLC + alan düzeyi çakışma kullanır; köprü 79 + 93 eşitleme testini geçer (VK §2, §6) |
| Yalnız `hkm.db`'deki gerçek veri (para, motto, hafıza, sohbet, eylem) | HKM göç doğrulanmadan kapanmaz; `hkm.db` ayrı göç kaynağı (VK §1c) |
| Sahneyle birlikte piksel dilinin düşmesi | Önce `piksel.css` ikiye bölünür, sonra sahne park (KS §4d) |
| Sağlık güvenlik metinlerinin ekranla birlikte silinmesi (kırmızı bayrak, «karar hekimindir», Sınırlar) | Kural metni ve motorlar alan kuralına taşınır; testleri (bio 72, nutri 50, move 50) korunur (SPİ §2, §4) |
| Sınav puanının yanıltması | Anlama setine gerçek serbest sohbet cümleleri; her King değişikliğinden önce taban (KH §8) |
| Sırların göç paketine girmesi (`*.llm.keys`) | Paketten hariç, kasaya alınır (VK §7 R8) |
| Tek kökende 5 MB localStorage sınırı | Yeni kabuk IndexedDB; `persist()` istenir (VK §7 R6, KS §5d) |

## 6. Çelişkiler

| # | Konu | Bir yanda | Öbür yanda |
|---|---|---|---|
| 1 | Üçe kopyalanan dosya | plan §1, §10: 326, 244'ü aynı | KS §1: `DOSYALAR` 226 girdi (+ `brand/seviye` 10); AYS/SPİ/ESP §1: modül başına 97 çekirdek kopya. «244» ölçülmedi |
| 2 | HKM tablo sayısı | plan §1, §3: 51 | VK §1c: 50 (51 `CREATE TABLE`'dan biri yorum) |
| 3 | King aracı | plan §1, §10: ≈100 | KH §3: 124 model kataloğu, 162 toplam |
| 4 | Bir ayar için dokunulan yer | plan §1, §10: 6 (TEKNIK.md'den) | KS §3a: 2 elle, 4 türetilmiş; TEKNIK.md eskimiş |
| 5 | Tekrar düzeni | plan §4 A6: üç | NT §4: dokuz + yetim tablo; ESP §5: yalnız ESP'de iki |
| 6 | ESP merdiveni | plan §7: «beş kademeli» | ESP §7, İH §3.1: altı kademe (rank 0-5), beş basamak |
| 7 | gemini-data | plan §7: 1.302 dosya, ≈650 konu, «görsel 24» | İH §1.1: 1 306 dosya, 632 çift + 18 JSON = 650; SVG dosyası yok, 12 JSON'a gömülü; SPİ denetim raporunda 220, diskte 214 |
| 8 | Ana kopyadaki aktarım karşılaştırması | plan §7: «içerik ajanı ikisini karşılaştırıyor»; DZ §bitmemiş iş aynısı | İH §3.4, §7.4: ana kopyanın `veri/` klasörü açılmadı, karşılaştırma yapılmadı |
| 9 | AYS konu sayısı | AYS §6: `subjects.js` 184 konu | İH §3.3: `subjects.js` 192 konu kimliği (anlatım 184) |
| 10 | Hesap uçları | KS §5b: `/api/hesap/` 70 yol | VK §2: 48 yol (sayım yöntemi farklı olabilir) |
| 11 | King sınavı | plan §1: 293/300 | KH §8: `king_sinav.json` 358 cümle; «300»ün sürümü bulunamadı, puan doğrulanmadı |
| 12 | Eğri sayısı | plan §6: on üç | KH §8: on King eğrisi eşlendi; üç Sistem eğrisi kapsam dışı kaldı |
| 13 | «Kayıtlı parça 1.015» | plan §1: kayıtlı parça | KS §2b-c: 1 036 `parcalar.txt` satırı (585'i test); `PARCA` kaydı 79 sayfa + 304 blok + 69 komut |
| 14 | `evidence.js` kararı | AYS §3: Çekirdek · SPİ §4, §7: ALAN:Tahlil, kalmalı | ESP §8: ARŞİV |
| 15 | `signals.js`, `audit.js` | SPİ §3, §7: MOTOR:Kayıt | AYS §3, ESP §4: ARŞİV |
| 16 | `calib.js`, `friction.js` | AYS §3, §7c: SORU (ölçüm ucuz) | SPİ §3, ESP §8: ARŞİV |
| 17 | Canlı model ayarı | plan §6: «bütün kademeler yerel modeldeydi» | KH §1: canlı ayar okunmadı, doğrulanmadı |
| 18 | `seri.js` ↔ seviye | KS §1f: «seviye ile ilişkili» | KS §7c: grep boş, doğrulanamadı (rapor içi) |
