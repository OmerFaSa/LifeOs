# Not Planı — Defter (Obsidian benzeri)

> Depo sahibinin isteği (2026-10-17): «Not kısmı, kütüphane, kendi verilerini
> ekleme kısımları çok zayıf. Profesyonel bir not uygulaması gibi: notun içine
> resim koyabileyim, resim çizebileyim, video koyabileyim ve orada oynasın, ses
> koyabileyim; kendi dosyamı ekleyebileyim, dosya oluşturabileyim.»

## 0. Bugün ne vardı

`brand/ortak/notum.js`: bağlam başına (konu, kavramlar) **düz metin**, en çok
4 000 karakter; «Notlarım» paneli yalnız listeler. Resim, çizim, video, ses,
dosya, bağlantı, etiket yok.

## 1. Sözleşme

1. **Not senindir; metin eşitlenir, medya cihazda kalır.** Notun metni modülün
   kendi deposunda (`defter/<id>`) durur: yedeğe girer, hesapla öteki
   cihazlara gider. Resim, çizim, video, ses ve dosyalar tarayıcının
   IndexedDB'sinde, **yalnız o cihazda** durur (fotoğraflarla aynı kural,
   AGENTS §1.4); not bunu yazar.
2. **Not ölçüm değildir** (notum.js söz 3): hiçbir sayıyı, kapıyı, kararı
   değiştirmez.
3. **Güvenli görüntü.** Not metni önce kaçırılır, sonra biçimlenir; yalnız
   `https:` bağlantıları açılır (yeni sekmede, `noopener`).
4. **Sıfır bağımlılık** (§1.3): düzenleyici, çizim tuvali, ses kaydı
   tarayıcının kendi API'leriyle (Canvas, MediaRecorder, IndexedDB).
5. **Eski notlar kaybolmaz.** Bağlam notları (konu, kavram) Defter'de ayrı bir
   bölümde listelenir ve kendi ekranında açılır.

## 2. Özellikler

| Özellik | Faz |
|---|---|
| Notlar: başlık, gövde, sabitle, sil, otomatik kayıt | 1 |
| Biçim: başlık, kalın, italik, kod, liste, yapılacak kutusu, ayraç | 1 |
| `[[Not adı]]` bağlantısı, geri bağlantılar, `#etiket`, arama | 1 |
| Resim ekle (seç, yapıştır, sürükle) | 1 |
| Elle çizim (kalem, renk, kalınlık, silgi, geri al) | 1 |
| Video ekle, notun içinde oynar | 1 |
| Ses kaydet ya da ses dosyası ekle, notun içinde çalar | 1 |
| Herhangi bir dosya ekle, indir | 1 |
| Notu dosya olarak dışa aktar (.md) | 1 |
| Klasörler, şablonlar, grafik görünümü (bağlantı ağı) | 2 |
| King'in notları okuması ve nota eklemesi | 2 |
| Medyayı PC sunucusuna yedekleme (isteğe bağlı) | 3 |

## 3. Durum

- 2026-10-17: **Faz 1 yapıldı.** `brand/ortak/defter.js` + `defter.css`: notlar
  (başlık, gövde, sabitle, sil, otomatik kayıt), biçim, `[[bağlantı]]` ve geri
  bağlantılar, `#etiket` araması, yapılacak kutuları; resim (seç / yapıştır /
  sürükle), elle çizim (renk, kalınlık, silgi, geri al), video (içinde oynar),
  ses kaydı (MediaRecorder) ya da ses dosyası, herhangi bir dosya (indir);
  .md dışa aktarma. Eski bağlam notları «Ekran notları»nda. King, kısayol
  çipi ve AYS paleti «Notlarım»da Defter'i açar.
- 2026-10-17: **Faz 1b** («temayla uyumlu, sade ama daha zengin; kalemle yazma,
  vurgulama»): dış kap King paneliyle aynı cam, yazı alanı opak kâğıt kartı;
  Oku | Yaz seçici; simge araç çubuğu (kalın, italik, başlık, vurgu kalemi,
  alıntı, liste, yapılacak, kod, bağlantı | resim, kalem, video, ses, dosya) ve
  Ctrl+B/I/K, Ctrl+Shift+H; `==vurgu==`, `~~üstü çizili~~`, `> alıntı`;
  kalemle yazma tuvali (kalem basınçlı, fosforlu kalem tek parça, silgi kâğıdı
  silmez; düz/çizgili/kareli kâğıt; geri al/ileri al); şablonlar (ders notu,
  günlük, kitap notu, plan); kelime sayısı ve okuma süresi.
- Sıradaki (Faz 2): klasör, bağlantı ağı görünümü, King'in notları okuyup nota
  eklemesi.
