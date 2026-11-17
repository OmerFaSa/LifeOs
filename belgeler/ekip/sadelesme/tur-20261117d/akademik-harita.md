# Akademik konu haritası (alan/akademik/harita.json)

Durum: bitti (2026-11-17). Yalnız `alan/akademik/harita.json` yazıldı (yeni). Aşama dosyalarına ve koda dokunulmadı.

## Sayılar
- 23 dal, 106 bölüm, 468 konu. 351 konu bir derse bağlı, 117 konu bağsız («henüz ders yok · King'le çalış»).
- Dallar (kimlik): TYT Türkçe (tyt-turkce), TYT Matematik (tyt-mat), TYT Geometri (tyt-geo), TYT Fizik (tyt-fizik),
  TYT Kimya (tyt-kimya), TYT Biyoloji (tyt-biyo), TYT Tarih (tyt-tarih), TYT Coğrafya (tyt-cog), TYT Felsefe (tyt-felsefe),
  TYT Din Kültürü (tyt-din); AYT Matematik (ayt-mat), AYT Geometri (ayt-geo), AYT Fizik (ayt-fizik), AYT Kimya (ayt-kimya),
  AYT Biyoloji (ayt-biyo), AYT Türk Dili ve Edebiyatı (ayt-edebiyat), AYT Tarih-1 (ayt-tarih1), AYT Tarih-2 (ayt-tarih2),
  AYT Coğrafya-1 (ayt-cog1), AYT Coğrafya-2 (ayt-cog2), AYT Felsefe Grubu (ayt-felsefe), AYT Din Kültürü (ayt-din);
  ek olarak «Deneme ve soru tekniği» (deneme), aşama 2'nin sınav becerisi dersleri için.
- Bağlar yalnız `ders` ile kuruldu (ünite bağı kullanılmadı). 377 dersten 193'ü bağlı.

## Bağlanmayan dersler (184)
- Hepsi «…: sınav düzeyi» eşleri. Aşama 1'de her konu dersinin hemen ardından gelirler, kimlikleri tabanınkinden bir
  fazladır (akademik.1.1.1 → 1.1.2). Bir konu tek `ders` alır; sınav düzeyi dersini ayrı bir konuya bağlamak sahte
  konu yaratırdı. Sınav düzeyi dışında bağsız ders yok (aşama 2'nin 9 dersi de bağlı).
- Kabuk için öneri: konudan açılan dersin ardından sınav düzeyi eşi zaten sıradaki ders olarak gelir. İstenirse konu
  satırında eşi de gösterilebilir (kimlik +1, ad «: sınav düzeyi» ile biter).

## Bağlama kuralı
- Konu, o dersin kapsamına giriyorsa bağlandı. Şüpheli alt konular ders metninde aranarak denetlendi
  (ör. hal değişimi Isı dersinde geçmiyor → bağsız; ondalık sayılar Rasyonel sayılar dersinde geçiyor → bağlı).
- TYT Felsefe ünitesindeki Psikoloji, Sosyoloji ve Mantık dersleri AYT Felsefe Grubu dalına bağlandı (YKS'de orada sorulurlar).
- Bir ders birden çok konuya bağlı olabilir (SEMA buna izin veriyor). TYT ile AYT'nin ortak konuları (Millî Mücadele vb.)
  iki dalda da aynı derse gider.

## Kaynak notu
- Liste kendi bilgimden derlendi: ÖSYM YKS kılavuzunun test yapısı (TYT 4 test; AYT Matematik, Fen, Edebiyat-Sosyal-1,
  Sosyal-2) ve MEB 2018 ortaöğretim öğretim programlarının ünite adları. Sıralama yaygın dershane konu listelerine göre.
- Tarih-2 ve Coğrafya-2 dalları yalnız ek konuları listeler; özetleri «önceki testin bütün konuları + bunlar» der.
  Aynı şekilde AYT Tarih-1 ve Coğrafya-1 TYT konularını tekrar yazmaz, bunu özette söyler.

## Emin olunamayanlar (eklenmedi ya da dikkat)
- Eklenmeyenler: modüler aritmetik (2018 programdan çıkarılmış olabilir), integralle hacim (ders bunu anlatıyor ama güncel
  AYT kapsamında olduğundan emin değilim; ders yine «Belirli integralle alan hesabı» konusuna bağlı), matris/determinant,
  faiz problemleri, sanayileşme süreçleri (ülke örnekleri), ekolojik ayak izi.
- Coğrafya-1 / Coğrafya-2 ayrımı: 11. sınıf konuları Coğrafya-1'e, 12. sınıf konuları Coğrafya-2'ye kondu. ÖSYM'nin tam
  sınırı doğrulanmalı.
- Tarih-2'nin çağdaş tarih başlıkları ünite adı olarak değil, konu olarak yazıldı (İnkılap Tarihi ile Çağdaş Türk ve Dünya
  Tarihi derslerinden hangisine ait oldukları kesin değil).
- Din Kültürü 9–10. sınıf konuları ünite adıyla değil konu adıyla yazıldı (ünite adlarından emin değilim). 11–12. sınıf
  ünite adları MEB 2018 programından.
- 2024'te 9. sınıftan başlayan Maarif Modeli programı YKS'ye yansıyınca liste gözden geçirilmeli.

## Kalite kapısı
- `python alan/denetle_test.py`: 27/27 geçti.
- `python alan/denetle.py alan/akademik`: Temiz · harita: 23 dal, 468 konu.
- `node kabuk/kabuk.test.js`: 70 geçti, 1 kaldı. Kalan, beklenen bayrak testi: «akademik «harita» bayrağı dosyayla
  uyuşmalı». `kabuk/harita.js`'te akademik satırına `harita: true` eklenince yeşile dönmeli. (İlk koşuda
  `kabuk/araclar.js:490`'da başkasının yarım düzenlemesinden gelen bir SyntaxError vardı; ikinci koşuda düzelmişti.)
