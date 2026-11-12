# Depo zemini denetimi (A1) · 12 Kasım 2026

> Salt okuma denetimi. Hiçbir dal, çalışma kopyası ya da dosya değiştirilmedi.
> Ölçüm: `git worktree list`, `git rev-list --left-right --count HEAD...origin/main`,
> `git status --porcelain`, `git for-each-ref refs/heads`. `origin/main` = `d375ef2d` (9 Kasım).

## Özet

| Ne | Sayı | Anlamı |
|---|---|---|
| Yerel dal | 92 | 84'ünün bütün kayıtları `origin/main`'de; silinmeleri kayıp doğurmaz |
| `origin/main`'e girmemiş dal | 8 | Toplam 17 kayıt; tek tek karar ister (aşağıda) |
| Çalışma kopyası | 17 | `sadelesme` dahil. Biri dışında hiçbirinde `origin/main`'de olmayan kayıt yok |
| Klasörü silinmiş kopya kaydı | 1 | `wt-head`; `git worktree prune` ile temizlenir |
| Ana kopya (`C:\Users\ASUS\LifeOs`) | 36 kayıt geride | 22 izlenen dosyada bitmemiş değişiklik (253 ekleme, 34 silme) ve izlenmeyen veri klasörleri |
| Çalışan kopya (`LifeOS-Sistem`) | güncel, temiz | `d375ef2d`; dokunulmayacak |

## Çalışma kopyaları

| Kopya | Dal | İleri | Geri | Bitmemiş dosya | Son kayıt | Öneri |
|---|---|---|---|---|---|---|
| LifeOs | main | 0 | 36 | 60 | 7 Kas | Aşağıdaki «ana kopya» adımı |
| LifeOs-sadelesme | sadelesme | 0 | 0 | raporlar | 9 Kas | Bu planın kopyası; kalır |
| LifeOs-anasayfa | ana-sayfa | 0 | 0 | 0 | 9 Kas | Birleşmiş; kapatılabilir |
| LifeOs-king | king5-kamera | 0 | 7 | 1 | 9 Kas | Bitmemiş 1 dosyaya bakılır, sonra kapatılır |
| LifeOs-gecis | gecis-tanitim | 0 | 33 | 1 | 7 Kas | Bitmemiş 1 dosyaya bakılır, sonra kapatılır |
| LifeOs-bench-ilk, LifeOs-bench-simdi | kopuk | 0 | 25, 13 | 0 | 8–9 Kas | Ölçüm için açılmış; kapatılabilir |
| birlesim-alti-is | claude/birlesim-alti-is | 0 | 51 | 1 | 7 Kas | Bitmemiş 1 dosyaya bakılır, sonra kapatılır |
| telefon-hiz, yarim-isler, yasayan-apartman | kopuk | 0 | 68–72 | 0 | 6 Kas | Kapatılabilir |
| LifeOs-ag | ag/baslangic | 0 | 505 | 0 | 31 Eki | Ofis kullanılacaksa `origin/main`'e sarılır, yoksa kapatılır |
| ofis-arastirma, ofis-denetim | kopuk | 0 | 365, 473 | 0 | 1 Kas | Ofis kullanılacaksa yenilenir |
| ofis-test | kopuk | 1 | 256 | 9 | 2 Kas | 1 kayıt ve 9 dosya incelenir |
| wt-base (geçici klasörde) | kopuk | 0 | 149 | 0 | 5 Kas | Kapatılabilir |

## `origin/main`'e girmemiş sekiz dal

| Dal | Kayıt | Tarih |
|---|---|---|
| gpt/analiz-duzeltme | 4 | 19 Eki |
| claude/stoic-wescoff-1056d4 | 3 | 3 Eki |
| ag/008-veri-dogrula-test | 3 | 1 Kas |
| claude/yasayan-apartman-0339d0 | 2 | 5 Kas |
| claude/keen-tharp-6c4d6f | 2 | 3 Eki |
| gpt/analiz-kalan-duzeltmeler | 1 | 19 Eki |
| ag/072-ogret-belge | 1 | 2 Kas |
| claude/charming-brattain-4d21bd | 1 | 2 Eki |

Her biri için karar: içeriği hâlâ isteniyor mu (o zaman `main`'e alınır), yoksa etiketlenip kapatılır mı.
İçeriklerine bakmadım; «göremedim».

## Ana kopyadaki bitmemiş iş

- İzlenen dosyalarda değişiklik: `brand/ortak/king.js`, `king-ses.js`, `king.test.js`, `parca-rehber.js`,
  üç modülde `src/js` altında dörder dosya, `HKM/tests/test_daemon.py` ve `dist` çıktıları.
  Hafıza notuna göre bu, başka bir oturumun King çalışması.
- İzlenmeyen klasörler: `veri/taslak/ays` (12 giriş), `veri/taslak/esp` (12), `veri/taslak/spi` (3),
  `veri/taslak/king` (1), `veri/temiz/mufredat` (1). En son değişen dosya 10 Kasım 15:46 tarihli `DENETIM.md`.
  Bu, Gemini verisinin sisteme kısmen aktarılmış ama kayda girmemiş hâli olabilir; içerik ajanı karşılaştırıyor.

## Temizlik sırası

1. **Yapıldı (12 Kas, sahibin «Evet, temizle» onayıyla):** ana kopyadaki bitmemiş iş yerel
   `yedek/ana-kopya-20261112` dalına (`21b28793`) kaydedildi. İzlenen 28 dosya yedekle birebir; izlenmeyen
   54 veri ve belge dosyasının hepsi yedekte. `.claude/` altındaki 6 eski önizleme dosyası yedeğe girmedi,
   yerinde duruyor. Dal yalnız yerel, push edilmez.
2. **Yapıldı:** ana kopya `origin/main`'e (`d375ef2d`) sarıldı. İzlenmeyen dosyalar silinmedi, yerinde duruyor.
3. Bekliyor: sekiz dal için karar verilir; alınmayanlar `arsiv/<ad>` etiketiyle saklanıp silinir.
4. **Kısmen yapıldı:** `origin/main`'e tam birleşmiş 75 dal `git branch -d` ile silindi. Ad ve kayıt listesi
   `silinen-dallar-20261112.txt` dosyasında; hepsi `main`'in geçmişinde olduğu için `git branch <ad> <sha>`
   ile geri gelir. `ag/003-olu-css` silinmedi, çünkü uzak dalında yerelde olmayan kayıt var.
   Klasörü kalmamış `wt-head` kaydı budandı. Kalan: 18 dal, 16 çalışma kopyası.
   Kapatılabilir çalışma kopyaları **kapatılmadı**; ayrı onay ister.
5. Hedef: bir ana dal, bir plan dalı (`sadelesme`), ofis kullanılıyorsa üç ofis kopyası.
