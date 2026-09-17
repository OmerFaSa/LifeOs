# Bu depoda çalışan her ajan için kurallar

> Bu dosya insan için değil, **ajanlar** için yazıldı (Codex `AGENTS.md`
> okur; Claude Code da bunu okuyor). Amacı tek: iki farklı ajan aynı depoda
> çalışırken birbirinin işini bozmasın ve depo doktrini her turda yeniden
> anlatılmak zorunda kalmasın.

## 0. Otuz saniyede depo

Dört bağımsız sistem: **AYS** (sınav), **SPİ** (sağlık), **ESP** (gelişim)
tarayıcıda çalışan sıfır bağımlılıklı tek sayfa uygulamalarıdır; **HKM**
onların yanında duran isteğe bağlı bir Python servisidir. Ayrıntı:
`README.md` ve her sistemin `MIMARI.md`'si. Dış inceleme için hazır özet
`python3 tools/paket.py` ile ÜRETİLİR (`PAKET.md`); depoda durmaz, çünkü
üretilmiş bir dosya bir gün kaynağıyla ayrışır.

## 1. Değişmeyen kurallar

Bunlar tercih değil **sözleşmedir**; bir öneri bunlardan birini kırıyorsa
önce kuralı tartış, kodu sonra değiştir.

1. **Kural motoru otoritedir.** Sayıyı ve kararı kod üretir; dil modeli
   yalnızca cümleye çevirir. Model kapalıyken hiçbir sistem kapanmaz.
2. **Eksik veri sıfır değildir.** Dört etiket: `ölçüldü / tahmin /
   hesaplandı / veri yok`. Etiketsiz sayı hiçbir katmana girmez.
3. **Sıfır çalışma zamanı bağımlılığı.** Üç arayüzde çerçeve, paket,
   derleyici yok; HKM'de yalnız Python standart kütüphanesi. Playwright
   yalnız denetim betikleri için.
4. **HKM'ye bağımlılık tek yönlüdür.** AYS/SPİ/ESP, HKM'nin var olduğunu
   bilmez ve o kapalıyken bozulmaz. HKM hiçbir modüle **yazmaz**; teklif
   yazar, modül kendi koduyla uygular (`HKM/core/intents.py`).
5. **Sınırlar:** SPİ teşhis koymaz ve doz önermez; ESP/AYS sertifika
   vermez, yetenek yargısı kurmaz, sonuç garantisi etmez.
6. **XP karar vermez.** Seviye sistemi (`brand/seviye/`) yalnızca
   görünürlüktür: hiçbir plan, reçete, uyarı ya da teşhis XP'ye bakmaz.
   Her sistemin KENDİ seviyesi vardır; ortak olan yalnız tanımdır (ad,
   renk, eşik) ve o tanım TEK KAYNAKTAN dağıtılır — kopyalar elle
   düzenlenmez.
7. **Anlamadığını anlamış gibi yapma.** Belirsiz girdi tahmin edilmez,
   sorulur. Ölçülmemiş bir şey «temiz» diye raporlanmaz.
8. **Kullanıcıya giden metin düzgün Türkçe'dir.** Kod yorumları ASCII
   olabilir; ekranda görünen cümle olamaz.

## 2. Denetimler — birleştirmeden önce koşar

```bash
# depo koku: seviye sistemi tek kaynaktan yayilir
python3 tools/seviye.py --yay        # brand/seviye/ -> uc arayuz
python3 tools/seviye.py --denetle    # kopyalar kaynakla ayni mi (CI de kosar)

# her sistem kendi dizininde
node tools/runtests.js      # birim testleri
node tools/smoke.js         # uygulamayı gerçekten açar, ekranları gezer
node tools/a11ycheck.js     # erişilebilirlik
node tools/layoutcheck.js   # 390 pikselde taşma ve 24px dokunma hedefi
node tools/perfcheck.js     # dokuz aylık veriyle çizim bütçesi

# HKM
cd HKM && python3 -m tests.run && python3 tools/perf.py && node tools/yuz.js

# depo kökü: hepsi + belgelerdeki sayıları tazeler
python3 tools/sayilar.py --tam --yaz
node tools/entegre.js       # üç arayüz + HKM uçtan uca
```

**Kural:** bir değişiklik, dokunduğu sistemin testleri ve duman testi
geçmeden önerilmez. Yeni davranış **testsiz gelmez**; düzeltilen her hata
için önce o hatayı yakalayan bir test yazılır.

## 3. Dal ve birleştirme düzeni

| Kim | Nerede çalışır | Nasıl teslim eder |
|---|---|---|
| Claude Code (bu oturum) | `main` | doğrudan commit + push |
| Diğer ajanlar (Codex vb.) | `gpt/<konu>` dalı | **pull request** |

- `main`'e doğrudan push **yalnız** depo sahibinin oturumundan yapılır.
- Her PR: ne değişti, hangi denetimler koşturuldu, hangi çıktı alındı.
- Çakışma olursa **doktrin kazanır**, sonra testler, sonra tarih sırası.

## 4. Bir bulgu neye benzer

```
dosya:satır · ne yanlış · hangi girdide bozulur · nasıl doğrulanır
```

«Şu daha iyi olurdu» bir bulgu değildir. «Şu girdi ile şu çıktı yanlış»
bir bulgudur. Emin değilsen **«göremedim»** yaz, «yok» yazma: bu depoda
üç tur, var olan özellikler «eksik» diye raporlandı.

## 5. Sık yapılan üç hata

1. **Var olanı yeniden önermek.** `tools/paket.py` çıktısının §2'si modül
   yüzeylerini listeler;
   orada adı geçen şey vardır.
2. **Genel yazılım tavsiyesi.** «Test yazın, CI kurun, tip ekleyin» —
   2 600+ test ve on denetim aracı var; sayılar `README.md`'de ve elle
   yazılmaz, `tools/sayilar.py` üretir.
3. **On yıllık mimari.** Ufuk **dokuz aydır**: her gün kullanılacak bir
   sistem için ne kırılır, o konuşulur.
