# Ses paketi · tur 2026-11-16b

Bu paket ses ajanınındır. Dal: sadelesme. Commit ve push yapılmadı. Yalnız şu dosyalara dokunuldu: kabuk/ses.js, kabuk/ses.test.js, kabuk/gece.js, kabuk/gece.test.js, kabuk/ayar.js (ses satırları) ve kabuk/depo.test.js (yalnız AYARLAR listesi). kabuk/kabuk.js'e dokunulmadı.

## Durum
- [x] Mevcut kod okundu. ses.js'te 3 osilatör sesi vardı. kabuk.js şu çağrıları yapıyor: `tik` bağlantıda ve halka seçiminde, `ac` halka açılınca, `tamam` ders okununca ve kapı geçilince. gece.js'te tek rüzgâr katmanı, 5-6 sn'lik döngü gürültü ve saf sinüs cırcır vardı.
- [x] Ses ailesi (ses.js) yazıldı: 14 ses, tek akort (Re majör pentatonik). Tını FM, üstüne hafif aralıklı ikinci ses ve süzülmüş gürültü. Hepsi ortak yankıdan, sınırlayıcıdan ve düzey ayarından geçiyor.
- [x] Ambiyans (gece.js) yenilendi: rüzgâr dört katman ve bozkır havasında. Döngüler dikişsiz, cırcırlar daha doğal.
- [x] Ayar ve testler: `lifeos.ses.duzey` eklendi (kısık / orta / yüksek). Testler: ses 9/9, gece 6/6, depo 19, kabuk 68/0.
- [x] Gerçek Chromium'da sınandı: sesler OfflineAudioContext ile WAV'a işlendi, tepe ve RMS ölçüldü. Kabukta 12/12 tıklama sınaması geçti, ayrıca soru ve kapı akışı denendi.

## Değişen dosyalar
- **kabuk/ses.js**: baştan yazıldı.
  - Saf parçalar: `SESLER` kataloğu, `hz` (akort dışı nota hata verir), `izin` (hız sınırı), `susmali`, `duzeyKazanci`, `sure`.
  - Tarayıcı parçası: `zincir` (yankı dürtüsü, sıcaklık rafı, sınırlayıcı) ve `cevrimdisi(tur, duzey)` (ölçüm için).
  - Belge üstünde temsilci dinleyiciler var: click ve submit (yakalama evresinde), change ve `basbug-ses` özel olayı.
  - `Kabuk.Ses.cal('tik'|'ac'|'tamam')` arayüzü korundu. `tamam`, kapı formu gönderilirken `kapi`, öteki durumlarda `ders` olur.
  - `Kabuk.Ses.son()` en son çalan sesi verir (tarayıcı sınamaları için).
- **kabuk/ses.test.js**: 9 test. Kapsam: katalog, tek akort, zarf sınırları, süre sınırları, aç/kapa simetrisi, yanlışın cezalandırmaması, hız sınırı (20 ms arayla 10 tık verilince 4 ses çalar), düzey, sessiz saatler.
- **kabuk/gece.js**:
  - Rüzgâr dört katmanlı: gövde, esinti, ot hışırtısı ve bozkır ıslığı (dar bant, frekansı gezinir).
  - Rüzgâr üç yavaş dalgayla kabarır: 0,043, 0,117 ve 0,0071 Hz. Oranları düzensiz olduğu için desen tekrar etmez.
  - Döngü gürültüleri 7,9 / 11,3 / 13,7 sn uzunlukta. Her biri rastgele bir yerden başlar ve uçları eş güçle bindirilir (`dikis`), böylece döngü noktasında tık olmaz.
  - Cırcırlar 2–4 nabız çalar, her nabızda perde hafifçe iner. %18 olasılıkla susarlar. Biri uzakta durur: boğuk ve yankılı.
  - Kuşlar biraz kısıldı. Ana düzey 0,85'ten 0,4'e indi (`ANA`).
  - Ölçüm için `Gece.cevrimdisi(kip, sn)` eklendi.
- **kabuk/gece.test.js**: döngü dikişi testi eklendi. Dikişteki sıçrama sıradan bir örnek adımından büyük değil; ham döngü ise sıçrıyor.
- **kabuk/ayar.js**: `lifeos.ses.arayuz` satırının anahtarı aynı kaldı, yalnız açıklaması güncellendi. Yeni satır: `lifeos.ses.duzey` (secim: kisik, orta, yuksek; varsayılan orta; grup ses; eşitlenmez).
- **kabuk/depo.test.js**: AYARLAR listesine `lifeos.ses.duzey` eklendi.

## Ses kataloğu (ne zaman çalar)
Bütün tonlar Re majör pentatonikte (Re Mi Fa# La Si). Böylece iki ses art arda çalınca da birbirine uyar.

| Ses | Ne zaman | Tını |
|---|---|---|
| tik | Sekmeyle ya da bağlantıyla sayfa değişince, halkada bir yer seçilince (kabuk.js) | 22 ms süzülmüş gürültü ve inen La5 «tok» (55 ms) |
| sec | Ayar tercihinde, açılır listede ya da sınav radyosunda | Daha ince bir tık, Si5 (50 ms) |
| ac | Yerler halkası açılınca (kabuk.js) | Yükselen hava kabarması ve Re5'ten La5'e kayış (380 ms) |
| bas | Ana düğmeye basılınca (bağlantı ve gönder düğmeleri hariç) | Alçak «tok», Re5 (90 ms) |
| acik / kapali | Onay kutusunda, basılı düğmede (ambiyans düğmesi dahil) ya da Açık/Kapalı seçeneğinde | Mi5 ve La5: açılınca yükselir, kapanınca aynı iki nota iner ve daha koyudur (165 ms) |
| kayit | Not ya da kayıt kaydedilince, açık uçlu cevap kaydedilince, sayı ayarı yazılınca | La5 ve Re6, yumuşak bir «pop» (490 ms) |
| dogru | Doğru cevapta | La5'ten Re6'ya yükselen dörtlü (685 ms) |
| yanlis | Yanlış cevapta ya da geçilemeyen kapıda | Si4'ten Fa#4'e alçak, yumuşak iniş; cezalandırmaz (490 ms) |
| ders | Ders «okudum» ile bitince | Re Fa# La Re, dört notalı çan (1,27 sn) |
| kapi | Kapı geçilince | Re4 gövde, Re5 La5 Re6 Fa#6 akoru ve hava (1,41 sn) |
| uyari | Yeni bir hata çıkınca ya da girilen değer geçersizse | İki alçak La4 vuruşu (340 ms) |
| king | King'in cevabı DOM'a düşünce (en çok 2 dk beklenir) | Çok hafif Si5 ve Fa#6 (460 ms) |
| bildirim | `document.dispatchEvent(new CustomEvent('basbug-ses', {detail:'bildirim'}))` çağrılınca | Re6'dan La5'e inen dörtlü (670 ms) |

Kurallar:
- **Yalnız kullanıcının eylemine çalar.** Son 1,5 sn içinde gerçek bir dokunuş ya da tuş yoksa ses susar. Bu yüzden ilk açılış ve kendiliğinden yeniden çizimler sessizdir. İstisna bildirim ve King cevabıdır.
- **Hız sınırı.** 60 ms içinde eşit ya da daha az önemli ikinci bir ses çalmaz. Daha önemli olan çalar; örneğin tıktan hemen sonra gelen çan.
- **Ayarlar.**
  - Arayüz sesleri kapalıyken hiç ses yok. «Kapalı» seçildiği tıklama da sessizdir.
  - Sessiz saatlerde susar.
  - Düzey: kısık ×0,3, orta ×0,6, yüksek ×1.

## Ölçümler
Ölçüm gerçek Chromium'da (Playwright) yapıldı. Her ses OfflineAudioContext ile 48 kHz stereo işlendi. «Kısa RMS» 50 ms pencerelerin en yükseğidir ve algılanan yüksekliğe en yakın basit ölçüdür. Betikler: scratchpad `ses_olc.py`, `ses_canli.py`, `ses_soru.py`.

**Orta düzey:**

| ses | süre ms | tepe dBFS | kısa RMS dB | kırpma |
|---|---|---|---|---|
| tik | 55 | −20,8 | −34,1 | 0 |
| sec | 50 | −22,2 | −35,8 | 0 |
| ac | 380 | −23,0 | −31,1 | 0 |
| bas | 90 | −21,1 | −30,9 | 0 |
| acik | 165 | −20,9 | −31,0 | 0 |
| kapali | 165 | −21,2 | −31,5 | 0 |
| kayit | 490 | −20,2 | −27,0 | 0 |
| dogru | 685 | −18,4 | −24,0 | 0 |
| yanlis | 490 | −20,6 | −27,0 | 0 |
| ders | 1270 | −18,3 | −24,0 | 0 |
| kapi | 1410 | −14,5 | −22,0 | 0 |
| uyari | 340 | −17,6 | −25,9 | 0 |
| king | 460 | −24,2 | −31,8 | 0 |
| bildirim | 670 | −19,4 | −25,1 | 0 |
| ambiyans gece (24 sn) | – | −24,9 | −34,8 (bütün RMS −38,0) | 0 |
| ambiyans gündüz (24 sn) | – | −25,5 | −37,2 (bütün RMS −40,1) | 0 |

- **Denge.** Sesler bilerek üç kademeye ayrıldı:
  - Dokunuş sesleri (tik, sec) yaklaşık −35 dB.
  - Durum sesleri (ac, bas, acik, kapali, king) yaklaşık −31 dB.
  - Sonuç sesleri (kayit, yanlis, uyari, bildirim) −25 ile −27 dB arası, doğru ve ders −24 dB.
  - Kapı en görkemlisi: −22 dB.
- **Kırpma yok.** Üç düzeyde (42 ölçüm) hiçbir örnek 0,999'a ulaşmadı. Yüksek düzeyde en yüksek tepe −10,1 dBFS (kapi). Sınırlayıcının eşiği −8 dB olduğu için tek başına çalan seslerde sınırlayıcı devreye girmiyor, yalnız üst üste binmeyi tutuyor.
- **Düzey adımları.** Kısık orta'dan yaklaşık 6 dB, yüksek orta'dan yaklaşık 4,4 dB farklı.
- **Ambiyans.** Bütün RMS −38/−40 dB. Arayüz seslerinin altında, arka planda kalıyor. Ana düzey yarıya indi: önceki yapılandırma bu ölçüme göre yaklaşık 6 dB daha yüksekti.

**Canlı kabuk sınaması** (`kabuk/index.html`, Playwright'ın gerçek tıklamaları): 12/12 geçti.
- İlk açılışta ses yok. Kullanıcı eylemi olmadan gelen çağrı susar.
- Bağlantıya tıklayınca `tik`, düzey seçince `sec` çalıyor ve düzey yazılıyor.
- Arayüz sesleri «Kapalı» yapılınca o tıklama sessiz kalıyor. «Açık» yapılınca `acik` çalıyor.
- Onay kutusu `acik` çalıyor. Hızlı not kaydedilince `kayit` çalıyor.
- 5 hızlı tıkta tek tık sesi çıkıyor. Sayfa hatası yok.

**Soru ve kapı:**
- Ders sayfasında şık seçilince `yanlis` çaldı. Bu sınamada seçilen şıklar gerçekten yanlıştı. Doğru şıkta aynı yol `dogru` çalar.
- Kapı formunda radyo seçilince `sec`, geçilemeyen gönderimde `yanlis` çaldı.

## Örnek sesler (sahip dinlesin)
Klasör: `belgeler/ekip/sadelesme/tur-20261116b/ses-ornek/`. Hepsi orta düzeyde, 48 kHz (ambiyans 44,1 kHz), 16 bit stereo WAV. Ses dosyalarının sonunda yankının söndüğü yaklaşık 1,2 sn'lik bir kuyruk var.
- tik.wav, sec.wav, ac.wav, bas.wav, acik.wav, kapali.wav
- kayit.wav, dogru.wav, yanlis.wav, ders.wav, kapi.wav
- uyari.wav, king.wav, bildirim.wav
- ambiyans-gece.wav, ambiyans-gunduz.wav (24 sn)

Toplam boyut yaklaşık 13 MB; ambiyans dosyaları 4,2 MB'tır. Commit'e girip girmeyeceğine sahip karar verir.

## Açık kalanlar
1. **kabuk.js'teki tık hatası.** kabuk.js'in `baslat()` içindeki yakalama dinleyicisi `closest('a[href^="#/"], [data-yol]')` arıyor. `#sayfa` (main) da `data-yol` taşıdığı için sayfadaki **her** tıklama `tik` istiyordu; «sesler eksik/yanlış» hissinin bir kaynağı buydu. ses.js'te nötrlendi: tıklanan öğe gerçek bir gezinme değilse kabuk.js'ten gelen `tik` çalmaz. Asıl düzeltme kabuk.js sahibinin işi: seçiciden `#sayfa` dışlanmalı, örneğin `[data-yol]:not(#sayfa)`.
2. **`bildirim` sesinin tetikleyicisi yok.** Uygulamada bildirim düzeneği yok. Ses hazır; `basbug-ses` olayını çağıran bir yer gerekiyor.
3. **Sessiz kalan durumlar (bilerek).** Komut çubuğu (Ctrl K) açılışı, tarayıcının geri/ileri gezinmesi ve yerleştirme formlarının gönderimi ses çıkarmıyor.
4. **Ambiyans sessiz saatlere uymuyor.** Önceden de uymuyordu. Gece ambiyansı tam da sessiz saatlerde istenebilir, bu yüzden karar sahibin.
5. **King cevabı kipi.** King'in hata cevabı da («Merkez'e ulaşılamadı») `king` sesi çalıyor, `uyari` değil.
6. **Deneme provası.** Provada şıklar `sec` çalar, çünkü doğru cevap gösterilmiyor.
7. **Kulakla dinlenmedi.** Ölçümler sayısal (tepe, RMS, kırpma). Tını yargısı için sahibin WAV'ları dinlemesi gerekiyor. Katalogdaki kazanç ve nota değerleri tek yerde (`SESLER`) duruyor, ayarlaması kolay.
