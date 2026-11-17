# Akademik · alıştırmasız sınav düzeyi derslerine soru (tur 2026-11-17d)

Görev: `alan/akademik/asama-1.json`'da alıştırması olmayan ~70 «sınav düzeyi» derse ÖSYM tarzı ikişer 5 seçenekli soru. Dosya: yalnız `asama-1.json` (aşama 2'ye, öteki alanlara, koda dokunulmadı).

## Durum
- [x] Ölçüm (önce)
- [x] Sorular (gruplar halinde)
- [x] Uygulama
- [x] Kalite kapısı
- [x] Ölçüm (sonra)

Betikler: scratchpad `ak2\` (önceki tur `akademik-ajan\`'dan kopya; `uygula1.py` yalnız aşama 1'e ekler).

## Ölçüm (önce)
- aşama 1: 30 ünite, 368 ders; ders alıştırması 1062 (kapı soruları hariç); alıştırmasız ders **70** (hepsi «sınav düzeyi», hepsi taslak).
- Ders alıştırmalarının doğru harfi: A215 B242 C232 D212 E161 (E az: yeni sorularda E biraz fazla tutulacak).
- Alıştırmasız dersler: 1.3.2–1.3.24 çiftler (TYT Dil bilgisi, 12) · 1.13.2–1.13.18 (Coğrafya, 9) · 1.14.2–1.14.16 (Felsefe/Psikoloji/Sosyoloji/Mantık, 8) · 1.15.2–1.15.16 (Tarih, 8) · 1.21.2–1.21.10 (Elektrik-manyetizma, 5) · 1.22.2–1.22.6 (Çembersel, BHH, dalga, 3) · 1.23.2–1.23.4 (Modern fizik, 2) · 1.25.2–1.25.12 (Enerji, hız, denge, asit-baz, çözünürlük, elektrokimya, 6) · 1.26.2–1.26.6 (Organik, 3) · 1.28.2–1.28.18 (Fizyoloji, 9) · 1.29.2–1.29.4 (Fotosentez, solunum, 2) · 1.30.2–1.30.6 (Bitki, ekoloji, 3).

## İlerleme
- Yazıldı (henüz uygulanmadı): `ek6.py` Dil bilgisi 12 ders, `ek7.py` Coğrafya 9 ders, `ek8.py` Felsefe 8 + Tarih 8 ders (37 ders, 74 soru). Kuru koşu harf dağılımı A15 B14 C14 D15 E16.
- Sırada: fizik (1.21–1.23), kimya (1.25–1.26), biyoloji (1.28–1.30).

- Devralındı (2026-11-17, yeni ajan): hesap sınırında kesilen işi aldım; betikler yeni scratchpad `ak2\`e kopyalandı. ek6–ek8 uygulanmamıştı, ek9 yarımdı.
- `ek9.py` (fizik 1.21–1.23, 10 ders) tamamlanmış; sayısallar yeniden denetlendi. ek6–ek9 kuru koşu: 47 ders, A18 B18 C19 D19 E20.
- Sırada: kimya 1.25–1.26 (9), biyoloji 1.28–1.30 (14) → `ek10.py`, `ek11.py`.
- `ek10.py` kimya 1.25–1.26 (9 ders, 18 soru) yazıldı; sayısallar Python ile yeniden hesaplandı (−891, +33, 8 kat, AB = 1 mol, pH 12, s = 2·10⁻⁴, 1,10 V, 5,4 g, 1,2/2 mol). Kuru koşu A3 B4 C4 D5 E2.
- `ek11.py` biyoloji 1.28–1.30 (14 ders, 28 soru) yazıldı (nüfus 510 Python ile). ek6–ek8 gözden geçirildi; 1.3.6 soru kökü ve 1.14.16 çözümündeki «(E)/(A)» önerme etiketleri (seçenek harfiyle karışıyordu) düzeltildi.
- **Uygulandı**: `uygula1.py ek6 … ek11` → 70 ders, 140 soru, A27 B27 C28 D28 E30.

## Kalite kapısı
- `python alan/denetle.py alan/akademik`: Temiz (3 dosya, 2 aşama, 33 ünite, 377 ders, 2258 alıştırma).
- `python alan/denetle_test.py` ✓ · `node motor/soru.test.js` 27/27 · `node motor/yol.test.js` 33/33 (+24/24) · `python kalite/olcum.py --denetle`: bütçe tamam.
- Diff yalnız `alan/akademik/asama-1.json`: 70 satır `"alistirmalar": []` yerine dolu dizi; başka silme yok. Kimlikler, ders/ünite sayısı, mevcut sorular aynı.

## Ölçüm (sonra)
- aşama 1: 30 ünite, 368 ders; ders alıştırması 1062 → **1202** (+140); alıştırmasız ders **70 → 0**.
- Doğru harf (aşama 1 bütün dersler): A242 B269 C260 D240 E191 (yeni 140 soru: A27 B27 C28 D28 E30).
- Hepsi `taslak` / `yazan: model`; onaylı alıştırma 0.

## Açık kalan
- Sorular model yazımı, taslak: sahibin/öğretmenin gözden geçirmesi gerekir (özellikle Dil bilgisi ve Felsefe sözel tek-doğru soruları).
- E harfi tüm dosyada hâlâ az (191); sonraki turlarda E’ye ağırlık.
- Commit yapılmadı (toplayan ajan yapacak). Betikler: `C:\Users\ASUS\AppData\Local\Temp\claude\a07d60aca3a8e2f6\2442b814-3c20-4478-aba9-436206434487\scratchpad\ak2\` (ek6–ek11.py, uygula1.py).
