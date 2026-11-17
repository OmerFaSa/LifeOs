# Akademik aşama 1 · cevap anahtarı denetimi (tur 17 Kasım d)

Kaynak: `alan/akademik/asama-1.json`, HEAD (b5941572) anlık görüntüsü. Yalnız okundu; dosyaya yazılmadı.
Düzeltmeler: `akademik-denetim.json` (liste; her öğe id, alan, eski, yeni, neden, kesinlik). Uygulamadan önce kontrol edildi: bulgulardaki soruların çalışan kopyadaki hâli anlık görüntüyle aynı.

Kapsam: ilk sürümden (5ac1a6af) gelen eski sorular. 1.4 Sayılar ile 1.16 AYT Cebir'in hepsi dışarıda bırakıldı. Sınav düzeyinde eklenen 218 soru atlandı.

## Sonuç

- **Denetlenen: 1727 soru** (alıştırma + kapı, 28 ünite + genel kapı), hepsi okundu.
- **Bulgu: kesin 0, olası 3** (2 soru). Hiçbir yanlış `dogru` harfi yok; iki doğru seçenekli, doğru seçeneği olmayan ya da çözümüyle çelişen soru yok.
- **Denetlenmeyen: yok.** (1.4, 1.16 ve sınav düzeyi soruları görev gereği dışarıda.)

## Ünite ünite (soru sayısı)

| Ünite | Soru | Yöntem | Bulgu |
|---|---|---|---|
| Genel kapı akademik.1.k1–k30 | 30 | okundu, sayısallar hesaplandı | 0 |
| 1.1 Türkçe Anlam | 39 | okundu | 0 |
| 1.2 Paragraf | 149 | metin–seçenek eşleşmesi tek tek okundu | 0 |
| 1.3 Dil bilgisi | 120 | TDK yazım/noktalama kurallarına ve dil bilgisi kurallarına göre okundu | 0 |
| 1.5 TYT Cebir | 68 | hesaplandı | 0 |
| 1.6 Problemler | 76 | hesaplandı | 0 |
| 1.7 TYT Analiz | 67 | hesaplandı (mantık, küme, polinom, olasılık) | 0 |
| 1.8 TYT Geometri | 71 | hesaplandı | 0 |
| 1.9 TYT Biyoloji | 56 | okundu, genetik oranları hesaplandı | 0 |
| 1.10 TYT Kimya | 75 | hesaplandı | 0 |
| 1.11 TYT Fizik | 109 | hesaplandı | 0 |
| 1.12 Din Kültürü | 49 | okundu | 0 |
| 1.13 Coğrafya | 85 | ölçek, yerel saat, yoğunluk hesaplandı | 1 olası (çözüm) |
| 1.14 Felsefe | 79 | okundu (psikoloji, sosyoloji, mantık dahil) | 0 |
| 1.15 Tarih | 81 | kronoloji sıralamaları tarihlerle denetlendi | 2 olası (soru+çözüm) |
| 1.17 AYT Analiz | 45 | limit/türev/integral hesaplandı | 0 |
| 1.18 Sayma | 28 | hesaplandı | 0 |
| 1.19 AYT Geometri | 44 | hesaplandı | 0 |
| 1.20 Mekanik | 72 | hesaplandı | 0 |
| 1.21 Elektrik | 44 | hesaplandı | 0 |
| 1.22 Dalga | 27 | hesaplandı | 0 |
| 1.23 Modern | 17 | hesaplandı | 0 |
| 1.24 Kimya Temel | 37 | hesaplandı | 0 |
| 1.25 Denge | 57 | hesaplandı (Kc, pH, Kçç, elektroliz) | 0 |
| 1.26 Organik | 28 | okundu, σ/π ve mol hesaplandı | 0 |
| 1.27 Genetik | 44 | olasılıklar, DNA→mRNA, kodon sayıları hesaplandı | 0 |
| 1.28 Fizyoloji | 85 | okundu | 0 |
| 1.29 Enerji | 18 | okundu | 0 |
| 1.30 Ekoloji | 27 | okundu | 0 |

Otomatik tarama (yinelenen seçenek, çözümdeki harf atfı ile `dogru` çelişkisi, sayısal seçenekte çözümün son sayısı ile doğru seçeneğin uyuşmazlığı): 9 aday çıktı, hepsi elle bakılınca yanlış alarm çıktı.

## Bulgular (hepsi olası, cevap harfini değiştirmiyor)

1. `akademik.1.13.k7` çözüm: ikinci cümle («Bu soru projeksiyona bağlı bozulmayı…») üretimden kalmış ilgisiz bir not, çıkarılmalı.
2. `akademik.1.15.k2` soru + çözüm: Herodot Halikarnaslıdır (Karya), İyon kenti değil. Örnek olarak Anaksimandros öneriliyor. MEB kitapları Herodot'u İyonya çevresine bağladığı için bu bulgu «olası» olarak işaretlendi.

## Yöntem notu

Matematik, fizik ve kimyada her sonuç yeniden hesaplandı. Hesaplar çoğunlukla elle yapıldı, otomatik tarama betiği scratchpad'de. Python yalnız tarama ve sayım için kullanıldı. Sözel sorularda gerekçe olarak kural ya da olgu yazıldı.
