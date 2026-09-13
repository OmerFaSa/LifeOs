# Dürüstlük katmanı — sistemin kendini denetlemesi

Bu belge, dışarıdan gelen üç ayrı eleştirinin (Gemini, GPT-5.6, Grok)
koda dönüşmüş hâlini anlatır. Üçü de farklı şeyler söyledi ama üç noktada
buluştular ve o üç nokta haklıydı:

1. **Ölçüm fetişizmi.** Her şeyi ölçmek her zaman daha iyi yönetim demek
   değildir. Aday bir noktadan sonra ders çalışmak yerine kendi çalışma
   sistemini yönetmeye başlayabilir.
2. **Goodhart yasası.** Bir ölçü hedef hâline geldiğinde iyi bir ölçü
   olmaktan çıkar. Soru sayısı bir hedefe dönüştüğünde kolay sorular
   seçilir, yanlışlar incelenmez, süre tutulmaz.
3. **Karar bağımlılığı.** Her sayıyı sistemden bekleyen aday, sistem
   kapandığında hiçbir şey bilmiyordur. Sınav salonunda hiçbir ekran yoktur.

Üçüne karşı da yazılmış bir uyarı cümlesi işe yaramaz; uyarı da bir
ekrandır. Tek dürüst cevap, üçünü de **ölçmektir**.

---

## 1. Sürtünme — `core/friction.js`

Sistemi yönetmeye giden süre ile çalışmaya giden sürenin payını ölçer.

| Karar | Sebep |
|---|---|
| Süre duvar saatinden gelir | Arka plan sekmesinde tik durur, saat durmaz |
| Son bir dakikada etkileşim yoksa süre sayılmaz | Açık unutulmuş sekme sürtünme değildir |
| Süreli deneme açıkken geçen süre sayılmaz | O süre sınavdır; kronometreye bakmak da sınavın parçası |
| Çalışma süresi **gerçekleşen** bloklardan okunur | Planlananla karşılaştırmak sürtünmeyi olduğundan küçük gösterirdi |
| Bütçe (15 dk/gün) **ve** oran (%25) birlikte aşılmadıkça susar | Hafta planı kurulan gün doğal olarak yönetim ağırlıklıdır |
| Öneriler yalnızca yükü **azaltır** | Kendi lehine karar veren bir ölçü, ölçü değildir |

Ölçüm yoksa sonuç `unknown`'dır. Ölçülmemiş sürtünme sıfır sürtünme
değildir — deponun en eski kuralı burada da geçerli.

## 2. Goodhart nöbetçisi — `core/goodhart.js`

Çabayı temsil eden bir sayı ile sonucu temsil eden bir sayı, iki bitişik
28 günlük pencerede karşılaştırılır.

| Çift | Çaba | Sonuç |
|---|---|---|
| `questions-vs-net` | çözülen soru | deneme medyan neti |
| `questions-vs-accuracy` | çözülen soru | doğruluk oranı |
| `minutes-vs-closed` | çalışma dakikası | kapanan konu |
| `exams-vs-net` | çözülen deneme | medyan net |
| `errors-vs-analysis` | işaretlenen hata | kapanan hata oranı |

Dört kural: nöbetçi **hüküm vermez, soru sorar** (ayrışmanın meşru
sebepleri vardır); iki tarafta da ölçüm yoksa ayrışma yoktur; **çaba
düşerken uyarı üretilmez** (nöbetçinin işi tembelliği değil verimsiz
gayreti görmektir); eşiğin altındaki hacim değerlendirilmez.

## 3. Kalibrasyon defteri — `core/calib.js`

Sistem söylemeden önce aday söyler; fark biriktirilir.

Sınav hazırlığında bu bir süs değil **asıl beceridir**: kendi netini
kestirebilen aday hangi testte zaman harcayacağını, hangi soruyu
bırakacağını ve bir denemenin kötü mü yoksa zor mu olduğunu bilir.

- **Tahmin kör olmak zorundadır.** Deneme ekleme formunda tahmin alanı
  sonuç satırlarının üstündedir ve körlük *yazıldığı anda* damgalanır:
  sonuçlar girildikten sonra yazılan tahmin `blind:false` işaretlenir ve
  puana katılmaz. Bir kez "kör değil" olan tahmin geri kör olamaz —
  satırları silmek, sonucu görmüş olmayı geri almaz.
- **Tahmin etmemek hata değildir.** Defter boşsa "kalibrasyonun kötü"
  denmez, "veri yok" denir.
- **Puan kişiye değil tahmine verilir.** "Kendini tanımıyorsun" denmez;
  "son 12 tahminin ortalama sapması %18" denir.
- **Beşin altında kayıt hüküm vermez.**
- **Yanlılık ayrı ölçülür.** Sürekli kendini abartan aday ile rastgele
  sapan aday aynı ortalama hataya sahip olabilir ama farklı şeyler
  yapmaları gerekir.

Sapma, gerçek değere bölünür: 5 neti 10 tahmin etmek, 60 neti 65 tahmin
etmekten çok daha büyük bir hatadır.

---

## Nerede görünür

Analiz ekranında **Dürüstlük** sekmesi. Üçü de kötü çıkabilir; bu bir
arıza değil, ölçüldüğü için görünür olmasıdır.

## Duman testi

`tools/smoke.js` bu güncellemeyle birlikte geldi — AYS uzun süre bu
araçtan yoksundu. Birim testleri fonksiyonları denetliyordu ama hiçbir
şey ekranın çizilip çizilmediğini denetlemiyordu: bir ekranda tanımsız
bir değişken, bütün testler geçerken sessizce yaşayabilirdi.

Betik 18 ekranı ve 16 sekmeyi hem kaynakta hem `dist/rota.html`'de gezer,
çizilen metinde sızıntı arar (`undefined`, `NaN`, `[object Object]`) ve
kör net tahmini akışını uçtan uca dener. İlk koşumunda gerçek bir hata
buldu: körlük denetimi test **adı** alanına da bakıyordu ve o alan
şablondan dolu geldiği için her tahmini "kör değil" sayıyordu.
