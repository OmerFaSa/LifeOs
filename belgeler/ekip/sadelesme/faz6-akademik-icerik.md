# Faz 6 hazırlığı: Akademik alan içeriği, 1. aşama

## Özet
AYS'nin bütün ders verisi (184 konu) müfredat şemasına (alan/SEMA.md) dönüştürüldü: `alan/akademik/asama-1.json`, tek aşama «YKS konu temeli», 30 ünite, 368 ders, 1 859 alıştırma/kapı sorusu, 369 kaynak. Denetçi temiz. Her şey `durum: "taslak"`; hiçbir şey `onayli` değil. Metin değiştirilmedi, yalnız biçim dönüştürüldü; yeni soru uydurulmadı. Dönüştürücü: `alan/akademik/donustur.js` (Node, bağımlılıksız; `node alan/akademik/donustur.js`).

## Dönüştürme
- Kaynak dosyalar (yalnız okundu): `AYS/src/js/data/subjects.js` (R.SUBJECTS), `anlatim-{tr,tm,tf,ts,am,af,ak,ab}.js` (R.KONU_ANLATIM), `derin-*.js` (R.KONU_DERIN), `paragraf.js` (R.PARAGRAF_HAVUZU). `vm` bağlamında yüklenir; `curriculum.js`, `ozetler.js`, `akilli.js` kullanılmadı (40 haftalık plan Plan motorunun işi; özetler Tekrar kartı kaynağı).
- Eşleme:
  - **Ünite** = bir dersin konu grubu (`topic.group`, ör. «TYT Temel Matematik · Cebir»); sıra R.SUBJECTS sırası (TYT Türkçe, Temel Matematik, Fen, Sosyal, sonra AYT Matematik, Fizik, Kimya, Biyoloji), grup içi `order`.
  - **Her konu iki ders**: (1) anlatım dersi: `giris` → `ozet` ve ilk paragraf; bölümler başlık (**kalın**), metin, liste (•), formül satırları, tablo (düz metin), çözümlü örnek, «Dikkat:» olarak `metin`e; anlatım soruları → ders alıştırması. `kazanim` ← derin `kazanim`. (2) «sınav düzeyi» dersi: derin `ornekler` (çözümü «Çözüm: 1) …» satırında), `kaliplar`, `hatalar`; önkoşulu kendi anlatım dersi. Türkçe paragraf konularında (tr-05…tr-09) paragraf havuzunun 100 sorusu bu derse alıştırma olarak eklendi.
  - **Önkoşul**: derin `onKosul` (konu) → anlatım dersi önkoşulu (önkoşul konunun anlatım dersi); ünite önkoşulu = başka ünitedeki konuya bağ varsa o ünite. Döngü kuran ünite bağı atlanacaktı; çıkan 0.
  - **Ünite kapısı** (eşik 0,75) = ünitedeki konuların derin soruları (derste gösterilmeyen sorular). **Aşama kapısı** (eşik 0,80) = her üniteden ayrılan ilk «ileri» düzey derin soru (30 soru; ünite kapısında yinelenmez).
  - **Kaynak**: her ders kendi dosyasına ve anahtarına bağlı: `tur: "depo"`, `yol: AYS/src/js/data/anlatim-tm.js`, `bolum: R.KONU_ANLATIM['tm-01']`, `satir` = anahtarın satırı; `dogrulama: "dogrulanmamis"` (AYS başlıkları «elle yazıldı · doğrulanmadı» der).
  - `yazan: "model"`: görev metni `yazan: "ays"` istiyordu, şema yalnız `model | insan` tanıyor; AYS metinlerini LifeOS'un geliştirme oturumu (Claude) yazdığı için doğru değer `model`. Kökeni `kaynak` alanı taşıyor.

## Sayılar ve kapsam
| | Sayı |
|---|---|
| Konu | 184 / 184 (kapsam tam; eksik konu 0) |
| Ünite | 30 |
| Ders | 368 (184 anlatım + 184 sınav düzeyi) |
| Ders alıştırması | 844 (744 anlatım sorusu + 100 paragraf) |
| Ünite kapısı sorusu | 985 (ünite başına 9–71) |
| Aşama kapısı sorusu | 30 |
| Alınmayan soru | 89 derin sorusu (şekilli; aşağıda) |
| Kapı: tam / `eksik` | 30 / 0 (her ünitede gerçek soru var) |
| Kaynak | 369 (368 ders kaynağı + paragraf havuzu) |
| Ders önkoşul bağı | 386 (184 kendi anlatımı + 202 konu önkoşulu) |

Kapı cevap harfleri dengeli (A 199, B 219, C 195, D 193, E 179). Dosya 2,2 MB.

## Kalite notları
- Kaynakta biçim hatası yok: bütün sorular 5 seçenekli, cevap anahtarı geçerli, yinelenen seçenek yok, bilinmeyen önkoşul konusu yok, döngü yok.
- **Alınmayan 89 soru**: derin sorularında `sekil` (core/sekil.js çizimi) olanlar; şema şekil taşımıyor, kapıda şekilsiz soru adil olmaz. Liste dönüştürücü çıktısında (`DISARIDA` satırları; tm 15, tf 18, am 16, af 16, ab 12, ak 8, ts 4, tr 0). Metinde şekil yoktu; `tablo`lu 11 soru (5 tablo da ders metnindeki örneklerde) tablo düz metin olarak sorunun altına yazılarak alındı, ekranda okunaklılığı denetlenmedi.
- 5 ders alıştırmasının kökü bir kapı sorusunun köküyle aynı (seçenekler farklı): 1.1.5.a1/1.1.k16, 1.3.15.a3/1.3.k46, 1.3.17.a2/1.3.k52, 1.3.23.a1/1.3.k70, 1.10.5.a3/1.10.k13. Aynen yinelenen soru 0.
- İçerik doğruluğu bu turda denetlenmedi (tamamı model yazımı, kitapla karşılaştırılmadı); sahibin onayına kadar taslak.
- «TYT Sosyal Bilimler · Felsefe» ünitesi `alan/felsefe` ile konu olarak örtüşüyor; birleştirilmedi.
- Metin işaretleri (`**kalın**`, `x^{2}`, `H_{2}O`) olduğu gibi kaldı; Yol ekranı bunları AYS gibi açmalı.

## Doğrulama
`PYTHONIOENCODING=utf-8 python alan/denetle.py alan/akademik` → `Temiz · 1 dosya, 1 aşama, 30 ünite, 368 ders, 1859 alıştırma, 369 kaynak`. Dönüştürücü yeniden koşunca aynı dosyayı üretir (sıralı, rastgelelik yok). Ayrıca Node ile yinelenen soru, harf dağılımı ve önkoşul sayımı yapıldı.

## Açık konular
1. **Şema boşlukları** (şemaya dokunulmadı): (a) şekil/tablo alanı yok → 89 soru dışarıda; (b) `ipucu` ve `seviye` alanı yok → alıştırmalarda ek alan olarak bırakıldı (denetçi yok sayıyor; motor kullanmak isterse şemaya eklenmeli); (c) `yazan: "ays"` yok; (d) kapı `eksik` işareti şemada tanımlı değil (bu alanda gerekmedi).
2. **Yükleme birimi**: tek aşama 2,2 MB. TYT/AYT diye iki aşamaya bölmek (asama-2 AYT) ya da şemada aşamanın birden çok dosyaya bölünmesi sahibin/motorun kararı.
3. **Kimlikler sıra numarasıdır**: AYS verisinde konu eklenir/silinirse dönüştürücü kimlikleri kaydırır; öğrenen kaydı başladıktan sonra AYS kaynağı değil `asama-1.json` düzenlenmeli (ya da kimlik eşlem tablosu tutulmalı).
4. Eşikler (ünite 0,75, aşama 0,80) Felsefe örneğinden alındı; sahip onaylamalı.
5. Sahip onayı: 368 ders, 1 859 soru taslak; onay sırası önerisi önce TYT Temel Matematik ve Türkçe.
