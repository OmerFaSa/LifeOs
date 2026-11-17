# Tur 2026-11-17e · İkincil ekranlar (Not, Plan, Kayıt, Tekrar, Sağlık, Yönetim, Hesap, Tanışma, Deneme, King)

Durum: BİTTİ (b88e0826 üstünde, commit yok). Dokunulan: kabuk/araclar.css (17e bloğu), kabuk/saglik.js (1 satır), kabuk/king-sohbet.js (2 satır), kabuk/araclar.js (Plan özeti, 2 satır).
Dil sözleşmesinden kullanılan: `--baslik-serif`, `--okuma` (piksel yazı tipinde piksele dönerler), mevcut renk/gölge jetonları. Yeni jeton yok, kabuk.css'e yazılmadı.

## Adımlar
- [x] Okuma: yon.md, AGENTS §0.1, bilesen.test.js kuralları, tur-20261117d/not-saglik.md, dil.md Sözleşme
- [x] Önce görselleri (HEAD b88e0826 arşivinden, yalıtılmış sunucu)
- [x] Stil değişiklikleri + bir yineleme (hizalı rakam, Hesap giriş cümlesi, Hesap kimlik kartı kenarı)
- [x] Testler, kabuk_gez, olcum --denetle
- [x] Sonra görselleri, dürüst bakış

## Ne değişti
- **Not:** hızlı yazma kutusu ve not gövdesi okuma serifinde. Not listesinde ad serif başlık, özet okuma serifi. «Notu düzenle» bir kâğıt yaprağı: başlık alanı kutusuz, serif ve büyük; gövde sıcak beyaz yüzeyde, geniş iç boşluklu, satır aralığı 1.75.
- **Plan:** mola satırları sakin (küçük, soluk, süre satırı yok). Sıradaki blok ılık tonda. Yapılan blok üstü çizili. Özet sayıları («105 dk · 90 dk · 3 mola») büyük serif ve hizalı rakamla; metin aynı, gezi testi değişmedi.
- **Kayıt:** gün özetinde değer («800 ml», «72,4 kg») ayın altında büyük serif, hizalı rakamla.
- **Tekrar:** kartın önü serif soru (h2 boyu), arkası okuma serifinde. Sayılar tabular.
- **Sağlık:** ölçü değeri büyük serif, hizalı ve tabular rakamla; birim küçük ve soluk (`<small class="sg-olcu__birim">`, saglik.js). Aria-label değişmedi.
- **Yönetim:** alan adları serif; sayılar tabular.
- **Hesap:** giriş/kurulum: giriş cümlesi okuma serifinde büyük, form 28rem dar sütun (nefes, tek ana eylem aynı). Oturumdaki kimlik kartında ince iç çerçeve kalktı (kenar çizgisi yok kararı), yerine orta gölge geldi. Ad serif, sayılar hizalı.
- **Tanışma:** o anki soru, kutusuz büyük serif başlık oldu; cevap alanı okuma serifinde.
- **Deneme:** geri sayım büyük serif ve hizalı rakamla, soru metni okuma serifinde.
- **King:** kullanıcı balonu sakin yüzey tonunda (vurgu karışımı yok). King cevabı balonsuz bir kitap paragrafı: okuma serifi, 1.15rem, satır aralığı 1.72, en çok 66ch; koyuda yazı %88 tonda, parlamaz. Yazıyor göstergesi de balonsuz. Divan'da hükümdar seçilince adı, iki yanında altın tonlu ince süs çizgisiyle serif bir satırda çıkıyor (`.king-divan`, aria-hidden; okuyucu adı basılı çipten duyar). Yazma alanı okuma serifinde, gönder düğmesi ana düğme renginde.
- **Boş durumlar** (araç sayfaları + Sağlık): başlık serif, metin 44ch ortalı.
- Yüksek kontrast: not gövdesi, kullanıcı balonu ve kimlik kartında ince çerçeve geri gelir. Hesap başlık alanının altında da bir çizgi çıkar.
- Öğe sayısı: tek ek öğe Divan'daki hükümdar adı satırı (istenen süs). Başka ekrana öğe eklenmedi.

## Görseller
`ikincil-gorsel/`: `once-*` (HEAD arşivi) ve `sonra-*` (çalışma ağacı; öbür üç ajanın o anki işi de içinde). 25 ekran × 1440/390 × açık/koyu = 200 webp (q84; png 19 MB idi). Ekranlar:
not-bos, not-dolu, not-acik, plan-bos, plan-dolu, kayit-bos, kayit-dolu, tekrar-bos, tekrar-dolu, saglik-bos, saglik-dolu, yonetim, hesap-giris, hesap-genel/guvenlik/baglanti/veri/sistem (geçici sunucuda deneme hesabıyla), tanisma, deneme-baslangic, deneme-soru, king-bos, king-dolu, king-divan-bos, king-divan-dolu.
King görüntüleri ekran boyunda, öbürleri tam sayfa. Tam sayfada sabit üst/alt çubuk içeriğin ortasına biner; gerçek ekranda bu olmaz. King ucu sahte cevapla yakalandı, gerçek modele istek gitmedi; canlı veriye yazılmadı.
390 açık/koyu hiçbir ekranda yatay taşma yok (betik her görünümde ölçtü).

Dürüst bakış: en büyük fark King (kitap paragrafı), Not düzenleme (kâğıt yaprağı), Tanışma (serif soru), Sağlık/Plan sayıları ve Divan adı. Kayıt, Yönetim ve Deneme'deki farklar küçük, yazı düzeyinde. Sitka Text koyu temada açık renkte kalın görünüyor; King paragrafında rengi %88'e indirerek yumuşattım. Ders metni için de aynısı düşünülebilir (dil/sayfalar).

## Sayfalar ajanına istek
- Yok (kabuk.css'e kural gerekmedi). Bilgi: King'in sohbet kuralları (`.king-balon`, `.king-msj--ben`, `.king-yaziyor`, `.king-yaz textarea`, `.king-gonder`) araclar.css'te eşit ağırlıkla ezildi; araclar.css sonra yüklendiği için kazanır. kabuk.css'teki o kuralları değiştirirsen burada geri ezildiğini bil. `.king-giris` (italik serif) senin, dokunmadım.
- kabuk_gez'de değişiklik gerekmedi (371 ✓).

## Testler (gerçek satırlar)
- Değiştirdiklerim: `saglik.test.js` 6 geçti, 0 kaldı · `king-sohbet.test.js` 8 geçti, 0 kaldı · araclar.js'in birim testi yok (kabuk_gez kapsıyor).
- Tüm kabuk/*.test.js: acilis 2/0, bilesen 24/0, deneme 6/0, depo «19 test geçti», etkilesim «hepsi geçti», gece 6/0, hesap-baglanti 14/0, hesap-giris 16/0, hesap-yonetim 17/0, hesap 12/0, kabuk 73/0, king-sohbet 8/0, onay 15/0, saglik 6/0, ses 10/0, tanisma 25/0.
- `node tools/kabuk_gez.js`: 371 ✓, «hepsi geçti», çıkış 0.
- `python kalite/olcum.py --denetle`: **KIRMIZI**: «AŞIM: Kabuk açılış yükü (bayt) 1027181 > tavan 1000000». Benim payım yalnız bu değil. HEAD'de yük yaklaşık 981 KB'tı (o anki çalışma ağacı eksi farklar). Dosya başına artış: piksel-doga.js +16,5 KB, kabuk.css +14,1 KB, araclar.css +7,8 KB (benim; sıkıştırıldı, ilk hâli 8,6 KB), kabuk.js +3,8 KB, bilesen.css +2,9 KB, king-sohbet.js +0,4 KB, saglik.js ve araclar.js 0,1 KB. Birleştirmeden önce koordinatör yükü dağıtmalı; gerekirse araclar.css'ten Kayıt/Yönetim/Deneme küçük kuralları (~1,5 KB) çıkarılabilir.

## Açık kalan
- Açılış yükü bütçesi aşımı (yukarıda; ekip toplamı).
- King akışı (`.king-akis`) kendi içinde kayan kutu; cevaplar büyüyünce kutu daha erken kayıyor. Sayfa düzeni sayfalar ajanında.
- Sitka Text'in koyu temadaki kalın görünümü genel bir dil kararı (dil ajanı).
- hareket_gez ve hiz_olcum koşulmadı: dokunduklarım yalnız yazı/renk, hareket yok.
