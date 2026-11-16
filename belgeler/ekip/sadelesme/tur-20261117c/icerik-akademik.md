# İçerik kalitesi · alan/akademik (tur 2026-11-17c)

Sahibin isteği: «öğrenmek için içerikleri daha kaliteli yap». Dosyalar: yalnız `alan/akademik/*.json`.

## Durum
- [x] Ölçüm (önce)
- [x] Düzeltmeler (4 tur, 109 ders yeni alıştırmalı)
- [x] Kalite kapısı: denetle_test 27/27, denetle «Temiz», yol.test 24/24, kabuk.test 71/71, kabuk_gez «hepsi geçti» (çıkış 0)
- [x] Ölçüm (sonra)

## Ölçüm (önce)
Ölçer: scratchpad `olc.py` (her ders: metin uzunluğu, paragraf, alıştırma, çözümsüz soru, özet=ilk paragraf, örnek/hata/sınav işaretleri).
- 377 ders (aşama 1: 368, aşama 2: 9), 33 ünite, 1900 alıştırma+kapı sorusu; `onayli` ders: 0 (hepsi taslak).
- Metin: en kısa 639, ortanca 1206, en uzun 3063 karakter; paragraf ortanca 15. İskelet/yer tutucu ders yok (<800 karakter: 3).
- Yapı: aşama 1'de her konu iki derstir: «<konu>» (anlatım + 4 alıştırma) ve «<konu>: sınav düzeyi» (çözümlü örnek, sınavda nasıl sorulur, sık hata; **0 alıştırma**). 179 ders alıştırmasız: ekranda yalnız «Oku → Bitir», öğrenci sınav düzeyini denemeden geçiyor. En büyük zayıflık bu.
- 184 derste `metin[0]` = `ozet` birebir: ekranda özet ve ilk paragraf aynı cümleyi iki kez gösteriyor.
- Çözümsüz soru (`cozum` yok): 9 derste (hepsi aşama 2), 23 soru.
- Biçim hatası: aynı seçenek iki kez 0, geçersiz cevap harfi 0. Cevap harfi dağılımı A176 B193 C191 D168 E116 (E az ama makul).
- Kısıt: anlatım derslerinde alıştırma SIRASI eski AYS ilerlemesine bağlı (motor/yol.js göç: `ornek[i]` → `alistirmalar[i]`); mevcut alıştırmalar yerinde kalır, yeni sorular yalnız sona eklenir.

## Ölçüm (sonra)
| | önce | sonra |
|---|---|---|
| ders / ünite / kimlikler | 377 / 33 | 377 / 33 (aynı) |
| alıştırma + kapı sorusu | 1900 | 2118 (+218 yeni seçmeli) |
| alıştırmasız ders | 179 | 70 |
| çözümsüz seçmeli soru | 22 | 0 |
| özet = ilk paragraf | 184 | 0 |
| «Yöntemin sınırı» kalıbı | 24 paragraf / 8 ders | 0 |
| `onayli` ders | 0 | 0 (hiçbir onaylıya dokunulmadı) |

## Değişen dersler
Hepsi `durum: taslak`, `yazan: model`; kimlik ve ders sayısı aynı; yeni sorular dersin kendi kaynağını (`kaynak`) taşır. Uygulayıcı: scratchpad `uygula.py` (veri `ek1.py`, `ek2.py`, `temiz.py`), tekrar çalıştırılırsa dolu dersi atlar.

**Tur 1 · her grubun ilk ünitesi (öğrencinin ilk gördüğü):** «sınav düzeyi» derslerine ikişer ÖSYM tarzı 5 seçenekli alıştırma, adım adım `cozum` ve adı konmuş çeldirici (46 ders, 92 soru; matematik/fizik/kimya sonuçları Python ile hesaplandı):
1.1.2, 1.1.4, 1.1.6, 1.1.8 (Türkçe Anlam) · 1.4.2, 1.4.4, 1.4.6, 1.4.8, 1.4.10 (Sayılar) · 1.9.2–1.9.12 çiftler (TYT Biyoloji) · 1.12.2–1.12.10 çiftler (Din Kültürü) · 1.16.2–1.16.18 çiftler (AYT Cebir) · 1.20.2–1.20.16 çiftler (AYT Mekanik) · 1.24.2–1.24.8 çiftler (AYT Kimya Temel) · 1.27.2–1.27.10 çiftler (AYT Genetik). Bu derslerde ekran artık «Oku → Alıştır → Bitir».

**Tur 3 · TYT Fen (Kimya, Fizik):** 20 ders, 40 soru: 1.10.2–1.10.16 çiftler · 1.11.2–1.11.24 çiftler (harf dağılımı baştan dengeli: A7 B9 C8 D8 E8).

**Tur 4 · AYT Matematik’in kalan üç ünitesi:** 13 ders, 26 soru: 1.17.2–1.17.10 çiftler (Analiz) · 1.18.2, 1.18.4, 1.18.6 (Sayma) · 1.19.2–1.19.10 çiftler (Geometri).

**Tur 2 · TYT Temel Matematik’in kalan dört ünitesi:** aynı biçimde 30 ders, 60 soru: 1.5.2–1.5.14 çiftler (Cebir) · 1.6.2–1.6.16 çiftler (Problemler) · 1.7.2–1.7.14 çiftler (Analiz) · 1.8.2–1.8.16 çiftler (Geometri). Bütün sonuçlar Python ile yeniden hesaplandı.

**Cevap harfi dengesi:** ilk yazımda yeni 152 sorunun doğru harfi A11 B40 C52 D37 E12 idi (orta şıklara yığılma, öğrenci «C’yi işaretle» alışkanlığı edinir). Çözümde harf anılmayan 17 sözel sorunun seçenekleri yer değiştirdi, 20 sayısal sorunun çeldirici kümesi (artan sırada kalarak) yenilendi: şimdi yaklaşık A26 B34 C29 D29 E34. Değişenler çözümde harf geçenlerle tek tek karşılaştırıldı.

**Özet tekrarı:** 184 anlatım dersinde özetle birebir aynı olan ilk paragraf silindi (ekranda iki kez görünüyordu).

**Çözümlü örnek sadeleştirme (8 ders):** 1.2.4, 1.4.8, 1.11.12, 1.13.4, 1.17.6, 1.20.2, 1.24.4, 1.27.2 — «Neden: … Yöntemin sınırı: … İpucu: …» diye uzayan, yer yer bozuk Türkçeli adımlar tek «Dikkat:» cümlesine indi; hesaplar yeniden doğrulandı.

**Aşama 2 çözümleri:** 22 seçmeli alıştırmaya `cozum` (2.1.1.a1 … 2.3.3.a3; tek açık uçlu 2.1.3.a3 ölçütlüdür, çözüm istemez).

## Düzeltilen yanlış cevaplar
Bulunmadı. Örneklem denetimi: 1.4 Sayılar (49 soru) ve 1.16 AYT Cebir (83 soru) alıştırma + kapı anahtarlarının tamamı elle/hesapla doğrulandı; aşama 2’nin 22 sorusu ve 46 sınav düzeyi dersindeki çözümlü örnekler de doğru. Kalan ~1600 sorunun anahtarı denetlenmedi.

## Betik çakışması (koordinatör uyarısı)
Ortak scratchpad’de Tarih/Felsefe ajanıyla aynı adlı `uygula.py` vardı. Denetlendi: benim `uygula.py` yalnız `alan/akademik/asama-1.json` ve `asama-2.json` yolunu yazar (KOK sabit); `git status alan/` yalnız bu iki dosyayı değişmiş gösterir, `alan/tarih` ve `alan/felsefe`’ye dokunulmadı. Betiklerim artık scratchpad `akademik-ajan\` altında.

## Açık kalanlar
1. **Ekranda ham işaretleme (en görünür kusur, kod işi):** Akademik metinlerinde 3724 `**kalın**` işareti, 2351 `^{…}` üs ve 1670 `_{…}` alt simge var; `kabuk/kabuk.js` `dersMetni` metni yalnız kaçışlayıp `<p>` içine koyuyor, yani öğrenci «**Gerçek, yan ve mecaz anlam**» ve «x^{2}» görüyor. Öteki alanlarda bu işaretleme yok. Önerilen tek yerlik düzeltme (`kac(m)` sonrası): `\*\*(.+?)\*\*` → `<b>$1</b>`, `\^\{([^}]*)\}` → `<sup>$1</sup>`, `_\{([^}]*)\}` → `<sub>$1</sub>`; alıştırma soru/çözüm çiziminde de aynısı. İçerikten silmedim: silmek yapıyı yok ederdi, işleyici gelince hepsi düzgün görünür. Yeni sorularda üs/alt simgeyi Unicode (x², CO₂) yazdım, iki durumda da okunur. «Tablo — a | b ; c» satırları da düz metin görünüyor.
2. **70 sınav düzeyi dersi hâlâ alıştırmasız:** TYT Dil bilgisi 1.3 (12), Coğrafya 1.13 (9), Felsefe 1.14 (8), Tarih 1.15 (8); AYT Elektrik 1.21 (5), Dalga 1.22 (3), Modern 1.23 (2), Denge 1.25 (6), Organik 1.26 (3), Fizyoloji 1.28 (9), Enerji 1.29 (2), Ekoloji 1.30 (3). Aynı betikle (scratchpad `akademik-ajan/uygula.py ekN`) sürdürülebilir; alıştırması olan dersi atlar.
3. **Cevap anahtarı denetimi örneklemle sınırlı:** 1.4 ve 1.16’nın 132 sorusu + aşama 2 doğrulandı, hata çıkmadı; kalan ~1600 eski sorunun anahtarı denetlenmedi (sözel ünitelerde «birden çok doğru» riskine bakılmadı).
4. **Eski 1900 sorunun harf dağılımı** A176 B193 C191 D168 E116: E az; yeniden sıralanmadı (anlatım alıştırmalarının sırası eski AYS ilerlemesine bağlı; kapı sorularına dokunulmadı).
5. Kaynaklar `dogrulama: dogrulanmamis` kaldı; yeni sorular dersin mevcut kaynak kimliğini taşır (konu kaynağı), soru metni modelin yazımıdır. Hepsi taslak, sahibin onayını bekler.
