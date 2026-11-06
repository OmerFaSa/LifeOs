# Öğrenme motoru

Kullanıcı (2026-11-06): kişinin çok rahat anlayacağı, her konuda; sistemdeki ve sistemde olmayan bilgiler dahil anlayıp kavraması için eylemler, anlatım biçimleri, teknikler. Kullanıcı «eksikleri sorma, geliştir» dedi; sıralamayı ve kapsamı bu belgedeki gerekçeyle Claude seçti.

Çekirdek: `brand/ortak/ogrenmotor.js` (`LIFEOS.OGRENMOTOR`), ekran `ogrenmotor-ekran.js` (`LIFEOS.OMEKRAN`), biçim `ogrenmotor.css`, test `ogrenmotor.test.js`. Modül bağlantısı her modülde `js/screens/ogrenme.js`. Ölçek `usta.js`'tir, yeni ölçek yok; `kavrat.js`, `ogret.js`, `grafik.js`, `pano.js` kullanılır.

## Önce neydi (2026-11-06 taraması)

| Aşama | AYS | SPİ | ESP |
|---|---|---|---|
| Anlatım | 184 konu, tek uzun sayfa | 10 anlatım, tek uzun sayfa; 30 kavram ayrı | 14 anlatım; 68 kart kısa |
| Yoklama | 1847 soru var, kalıcılığa girmiyordu | 50 açık soru **hiçbir ekrana bağlı değildi**; kavram sorusu yalnız King'de | Alan sınaması kısa ve öz değerlendirme |
| Onarım | Çözüm görünür; «neden yanlış» adımı yok | Yok | «Tutmadı»dan sonra hiçbir şey yok |
| Aralıklı tekrar | Kart ve blok var; Öğren soruları ve karma test sayılmıyordu; kartı olmayan konu sıraya hiç girmiyordu | Yalnız King'de 1/3/7 | Kart var; konu Bugün'e düşmüyordu |
| Aktarım | «İleri» soru var, aşamaya bağlı değil | Yok | Alan sınamasında var |
| Sistemde olmayan konu | King'de model şartı (PDF ya da metin) | Aynı | Aynı |

## Şimdi akış

**2026-11-06 sonrası (OGRETME-PLANI Faz 2):** «Adım adım öğren» planı aşamadan kurar. Veri yok/öğreniyor: sezgi → parça parça anlatım → çözülmüş örnek → kendin dene (2 soru, yanlışta ipucu merdiveni) → alan görevi → kartlar. Tutuyor: aklında kalan → sorular → görev → kartlar. Kalıcı: tekrar ve aktarım. Aşağıdaki uzun akış artık «Derinleş» düğmesidir; hata türü seçtirmek yalnız orada.


Yeni konu: **Tahmin → parça parça anlatım → kendi cümlenle → çözümlü örnek → hatırla (güven işaretiyle) → yanlışsa hatayı onar, araya bir soru girdikten sonra benzer soru → başkasına anlat → yeni durumda kullan → nerede kullanacaksın → sonuç.**

Tekrar: aklında kalanı yaz → yeni sorular → kalıcıysa aktarım. Karışık tekrar: vadesi gelen konulardan birer soru, konu adı cevaptan önce söylenmez.

| Teknik | Motordaki yeri | Kanıt | Güç | Sınır |
|---|---|---|---|---|
| Geri getirme | Hatırla, Aklında ne kaldı | Dunlosky 2013 | Yüksek | Okuma ve süre kanıt değildir |
| Aralıklı tekrar | `usta.js` vadesi, Bugün satırı | Dunlosky 2013 | Yüksek | Eşikler sistem ayarıdır |
| Karışık alıştırma | Karışık tekrar; `usta.sira` | Rohrer 2020; Kremer'de daha küçük | Orta | Konu adı gizli kalır |
| Güven ve düzeltme | Eminim/Kararsızım/Tahmin; emin yanlış başa | Butterfield-Metcalfe 2001, Butler 2011 | Orta | Puan değil, üstbiliş sinyali |
| Kendi kendine açıklama, «neden?» | Kendi cümlenle | Dunlosky 2013 («orta») | Orta | Yazmak zorunlu değil |
| Çözümlü örnek, adım adım | Çözümlü örnek | Bilişsel yük literatürü; bu taramada kaynak açılmadı | Orta (bellekten) | Doğrulanacak |
| Önce tahmin | Tahmin | Ön test etkisi; bu taramada kaynak açılmadı | Orta (bellekten) | Ölçüm sayılmaz, kanıta girmez |
| Başkasına anlatma | Başkasına anlat | Kobayashi 2019 (USTA-PLANI; etki büyüklüğü okunmadı) | Orta | Kod yalnız terimi sayar, anlamı yargılamaz |
| Ölçülü zorluk | Seviye aşamaya göre seçilir | Sistem kararı | — | Seviye yazar değerlendirmesidir |
| Uygulama niyeti | Nerede kullanacaksın | Bu taramada kaynak açılmadı | Bellekten | SPİ'de davranış bilgisiyle sınırlı |

«Bellekten» yazılı satırlar kaynağı açılarak denetlenmedi; yöntem zararsız ve geçilebilir olduğu için kondu. USTA-PLANI'ndaki kurala göre bu sayılar ekrana yazılmaz.

## Sistemde olmayan bilgi

Öğrenme › «Sistemde olmayan bir konu öğren»:

1. Konu sistemde varsa önce o önerilir (`OGRET.bul`); yine de ayrı açılabilir.
2. **Metin varsa (kitap, not, makale):** parçalara bölünür; terim tanım cümlelerinden, kalın yazılardan, tekrar eden kelimelerden çıkar; soru metnin kendi cümlesinde bir terimin boşluk olmasıdır, çeldiriciler aynı metnin terimleridir. Model gerekmez, bilgi uydurulmaz.
3. **Metin yoksa:** Vikipedi araması, kendi sorusunu yazma, model bağlıysa taslak. Taslak yalnız metindir; soruları yine kod çıkarır, «model taslağı · doğrulanmadı» etiketi kalır.
4. Kendi konu da aynı tekrar sırasına girer. Silmek iki adımdır ve kaydıyla gider.

## Model ne yapar, ne yapmaz

- Anlamadım › Başka türlü anlat (sade, benzetme, örnek, sorarak) ve kaynaksız konu taslağı. Başka hiçbir şey.
- Kaynakta olmayan sayı getiren cevap gösterilmez (`sayiTemiz`); her çıktı «doğrulanmadı» der.
- Aşamaya, sıraya, soruya, cevaba dokunmaz. Model kapalıyken düğmeleri çıkmaz, akış aynıdır.
- 2026-11-06 denemesi (`gemma4:e2b`, yerel): sadeleştirme 1 sn, taslak 4 sn; Türkçesi okunur. Bir sadeleştirmede «hesaplamak zor değildir» gibi metinde olmayan bir yargı yazdı: sayı denetimi bunu yakalamaz, «doğrulanmadı» etiketi bu yüzden şarttır.

## Kayıt

`meta/omKayit` (cevaplar, kendi cümleleri, hata türleri) ve `meta/omAtolye` (kendi konuları), modülün `Store`'unda: eşitlemeye ve yedeğe girer. XP'ye, plana, kapanışa, ölçümlere yazmaz. Kanca ile: AYS'de `R.Ogren.cevapla`, ESP'de `ESP.Alan.kaydet`. Kanıt okuma: AYS'de Öğren ilk cevapları ve karma testler (`OgrenTest.konuKanit`), ESP'de alan kaydı; AYS Sınama'nın konu kalıcılığı da motorun kanıtını okur.

Konunun günlük kanıtı doğruluk ≥ 2/3 ise isabettir (sistem ayarı); ön tahmin girmez, yalnız ipuçlu cevap aşama kazandırmaz.

## İçerik sınırları

- Yeni soru ya da anlatım yazılmadı. Yazılmış içerikte boşluklu soru yalnız yazarın kalın terimlerinden üretilir; kalın terim yoksa üretilmez.
- SPİ: hareket kartlarının `prescription` alanı kullanılmaz; teşhis ve doz yok. Bağlanan içeriğin uzman incelemesi beklediği etikette yazar.
- ESP ve AYS: sertifika, yetenek yargısı, sonuç garantisi yok. «Sağlam» kaydın durumudur.

## Doğrulanmayanlar ve açıklar

- Öğrenme etkisi ölçülmedi: kimse bu akışla gerçekten çalışmadı, mekanik sınandı.
- Model düğmeleri gerçek uygulamada King köprüsüyle (`KING_IC.merkezeSor`) denenmedi; komutlar Ollama'da, köprü sahte modelle sınandı.
- Telefonda açılmadı.
- King'in 1/3/7 tekrarı (`OGRET`) ve kavrat kartları ayrı kayıtta; motora bağlı değil.
- Sesle cevap verme yok. PDF'ten konu yok (metin yapıştırılır).
