# 020 · King sınavı 300 cümleye

**Durum:** bekliyor
**Dal:** `ag/020-king-sinav-300`
**Efor:** orta
**Kabul testi:** `tools/king_sinav_300_kabul_test.py`

## Amaç
KING-4 §A5: King sınavı «300 gerçek Türkçe cümle ve her biri için beklenen araç». Bugün `tools/king_sinav.json` 100 cümle. 200 yeni cümle eklenir; ölçü King değişikliklerinin puanı düşürüp düşürmediğini görmek için genişler. Sınav **doğru King'in** ne yapması gerektiğini yazar, bugünkü King'in ne yaptığını değil: puanın düşük çıkması beklenir, kodu düzeltmek bu görevin işi değildir.

## Dokunulacak dosyalar
- `tools/king_sinav.json` — `cumleler` dizisinin SONUNA 200 cümle. İlk 100 cümleye (sıra, metin, beklenen) dokunulmaz.

## Cümle biçimi ve beklenen kararlar
Her cümle: `{ "g": grup, "m": söylendiği modül, "c": cümle, "b": [kabul edilen kararlar], "a"?: {araç argümanlarından beklenen alt küme} }`. Biçim `tools/king_sinav.js` başındaki yorumda. Grup sayıları (en az): ays 95, spi 90, esp 70, genel 45 (genel = her modülde King'in ortak işi: odak, not, ayar, öneriler, harita, sohbet; `m` yine bir modül).

Kararlar:
- `arac:<ad>` — okuma sorusu («… nasıl», «kaç …», «son …larım», «… ne») modülün okuma aracıyla cevaplanır, sayfa açılmaz. Yazma isteği («… kart yap», «kitabı bitirdim», «ara ver») modülün yazma aracına gider.
- `veri` ya da `arac:kayit_gir` — kullanıcının yaptığı ölçülebilir iş («40 soru çözdüm», «7 saat uyudum», «45 dk gitar»); ikisi birlikte `b`'ye yazılır.
- `git:<modül>:<rota>` — yalnız açık sayfa komutu («mutfağa git», «denemeleri aç»). Rota King'in sayfa kataloğundan (`node tools/king_sinav.js --adlar` → `rotalar`).
- `merkez` — açık uçlu soru, öneri, sohbet, yorum isteyen cümle («uykum az, antrenmanı hafif mi tutayım»).
- `tur:<tür>` — yerel araç kutusu ve komutlar (hesap, birim, vki, hatirlat, yap, odak). Mevcut 100 cümlede kullanılan türlerden seç.
- Bir cümle gerçekten iki biçimde doğruysa `b`'ye ikisi de yazılır; tahmine dayalı geniş liste yazılmaz (en çok 3).
- Başka modülün işi söylendiyse `m` bulunduğun modül, beklenen o işin modülü değil bu modüldeki doğru karar (ör. AYS'de «son tahlillerim» → `merkez` ya da o modüle iletme; emin değilsen böyle cümle yazma).

Cümleler:
- Gerçek kullanıcı dili: kısa, günlük, yazım hatası ve büyük/küçük harf çeşitliliği az da olsa olsun («kac net yaptim»). Aynı kalıbın yalnız kelimesi değişen kopyaları yazılmaz (ör. on ayrı «X'ten N soru çözdüm»): her cümle başka bir kalıp ya da başka bir iş.
- Modülün her aracı (`ays_`, `spi_`, `esp_`, `eylem_` ile başlayanlar; `--adlar` çıktısı) en az iki cümlede beklenir.
- Sağlık cümlelerinde teşhis ya da doz isteyen cümle `merkez` beklenir (SPİ teşhis koymaz; AGENTS §1.5).
- Kişisel veri yok (gerçek isim, telefon, adres). Barkod için 4006381333931 gibi herkese açık ürün kodları.

## Dokunma
- `tools/king_sinav.js` (koşucu), King ve modül kodu, ilk 100 cümle, kabul testi dosyası.

## Kabul ölçütü
- `tools/king_sinav.json` ≥ 300 cümle, ilk 100'ün özeti değişmemiş, grup sayıları tutuyor.
- Her cümlenin biçimi geçerli; aynı modülde aynı cümle iki kez yok.
- Beklenen her `arac:` o modülün araç kaydında, her `git:` King'in sayfa kataloğunda var.
- Her modül aracı en az iki cümlede beklenir.
- `node tools/king_sinav.js` 300 cümleyi puanlar (puan ne çıkarsa; Sonuç'a yaz).

## Koşulacak testler
- `python tools/king_sinav_300_kabul_test.py` (önce kırmızı, sonra yeşil)
- `node tools/king_sinav.js` (puanı ve grup puanlarını Sonuç'a yaz)

## Sonuç
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
