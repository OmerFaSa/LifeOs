# Tur 2026-11-18c · Alan tek sayfa, ders ayrı öğrenme ekranı

Sahibin isteği (2026-11-18, özü): «Aşamalar ve dersler kısmı istemediğim gibi; derslere girince yazı ve sesle ilgili testler çıkıyor, öyle olmasın. Tek bir sayfa olsun: önce hangi bölümde, hangi seviyede olduğumuz; altında hangi derslerin olduğu, ayrıntılı aşamalar; altında derslerle ilgili neler yaptığımız. Derse tıklayınca bambaşka bir ekrana, öğrenme kısmına atsın; orada o konuyu öğrenelim.»

## Alan sayfası (`kabuk/kabuk.js` `sayfaAlan`, `neredesin`, `sonCalisilan`)
- Sekmeler (Dersler / Konular / Aşamalar) kalktı; her şey tek sayfada, sırayla:
  1. **Neredesin kartı:** «Seviye · Aşama n / N» ve aşamanın adı, hedef cümlesi, **Bölüm** (ünite · ders k / m) ve **Sıradaki ders**, okunan ders çizgisi, tek ana düğme «Öğrenmeye başla / devam et» (dersler bitince «Ünite kapısına geç», aşama bitince «Sonraki aşama»). «Biliyorsan: seviyemi bul» küçük bağlantı olarak kaldı, kendiliğinden açılmaz.
  2. **Dersler:** ünite ünite dersler (eski yol çizgisi).
  3. **Son çalıştıkların:** bu aşamada okunan son dört ders, en yeni üstte; «bugün/dün/tarih okundu · alıştırma k/m doğru».
  4. **Aşamalar:** birden çok aşama varsa aşama kartları (durum, hedef, ilerleme).
  5. **Konu haritası:** haritası olan alanda dallar (kapalı; seçili dal açık).
- **Sınavlar girişte yok:** ünite kapısı, ünitenin bütün dersleri okununca (ya da denenmiş/geçilmişse) görünür; aşama kapısı bütün üniteler geçilince.
- Eski `?b=konular` / `?b=asamalar` adresleri aynı tek sayfayı açar.

## Öğrenme ekranı (`sayfaDers`)
- Uygulama çubuğu ve telefonda alt çubuk yok; yalnız konum satırı (‹ Alan / Ünite / Ders n/N). Zemin alanın tonunda sakin, ders ortada kâğıt sayfa.
- Girişte yalnız anlatım: özet, metin, Özetle, kaynaklar. Sorular yok.
- Sonda: sıradaki dersin adı, isteğe bağlı **«Kendini dene · n kısa soru»** bağlantısı (`?dene`), «Bitir, sıradakine geç» (sormadan bitirir) ve «King'le çalış».
- `?dene` adımı: aynı kâğıtta «Kendini dene» başlığı, sorular, özet; «Bitir» cevaplanmamış soru varsa bir kez sorar, «Derse dön».

## Önce/sonra
`alan-gorsel/`: `once-alan-1280.png`, `once-ders-1280.png`; `sonra-alan-1280.png`, `sonra-ders-ve-dene-1280.png` (solda ders, sağda Kendini dene), `sonra-telefon-390.png`, `sonra-koyu-1280.png` (Felsefe, konu haritasıyla).

## Testler
`tools/kabuk_gez.js`: tek sayfa sırası (kart, Dersler, Aşamalar, Konu haritası; sekme yok), kapılar dersler bitmeden görünmez, öğrenme ekranında soru ve uygulama sekmesi yok + «Kendini dene» bağlantısı, soru adımında Bitir'in yumuşak sorusu, «Son çalıştıkların» üç ders; yerleştirme: tek düğme «Öğrenmeye başla». `tools/hareket_gez.js` cevap hareketleri `?dene` adımında. Hepsi geçti; kabuk birim testleri, `kabuk_esit_gez`, `kalite/olcum.py --denetle` temiz.
