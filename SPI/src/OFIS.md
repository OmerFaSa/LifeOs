# Ofis — beş ajanlı sağlık ekibi

SPİ'nin içinde beş küçük ajan çalışır. Hepsi aynı veriyi değil, **kendi
alanındaki** veriyi okur; birbirleriyle konuşur; sonunda **tek bir karar** çıkar.

| Ajan | Rol | Neye bakar | Neye bakmaz |
|---|---|---|---|
| **Patron** | Baş danışman | Dört uzmanın raporu, çelişkinin çözümü, haftalık rapor | Kendi hesabını yapmaz |
| **Kerem** | Laboratuvar ve biyometri | Kan/idrar biyokimyası, hormonlar, vital bulgular, eğilimler | Öğün yazmaz, yük belirlemez, fiyat konuşmaz |
| **Nesrin** | Beslenme ve biyoyararlanım | Makro dengesi, mikro açıklar, emilim etkileşimleri, hane mutfağı | Tahlil yorumlamaz, doz önermez |
| **Barış** | Hareket ve toparlanma | Yük, kademeli ilerleme, toparlanma skoru, aşırı antrenman koruması | Tahlil yorumlamaz, öğün yazmaz |
| **Sedef** | Sağlık ekonomisi | Sepet maliyeti, eşdeğer ikame, toplu alım, bütçe sürdürülebilirliği | Sağlık hedefini indirmez |

Yetki ayrımı kasıtlıdır: bir ajan alan dışına çıkarsa soruyu sahibine
yönlendirir, cevap uydurmaz. Çelişkiyi Patron çözer.

---

## Temel ilke: kural motoru otoritedir

```
Bio / Nutri / Move / Money  →  brief(agentId)  →  model  →  ekranda cümle
   (hesap, eşik, karar)         (rapor, JSON)     (yorum)
```

- **Sayı** kural motorundan gelir. Ajan hesap yapmaz, geldiği gibi kullanır.
- **Karar** `SP.Calc.nextAction()`'dan gelir. Toplantı sonunda Patron kararı
  *gerekçelendirir*, değiştiremez. Model «bunun yerine şunu yap» derse
  tutanaktaki eylem yine kural motorununkidir.
- **Gündem** `SP.Office.agendaCandidates()` içindeki puanlamadan gelir; model
  gündem seçmez.
- **Model yoksa ofis kapanmaz.** Brifing doğrudan cümleye çevrilir
  (`SP.Office.ruleText`), ajanlar «kural motoru» rozetiyle konuşur.

Ekranda her cümlenin altında hangi kaynaktan geldiği yazar. Bu rozet süs
değildir: kullanıcının bir cümleye ne kadar güveneceğini belirler.

---

## Brifing — ajanın gördüğü tek şey

Her ajan yalnızca kendi brifingini görür. Brifing **saf bir nesnedir**:
ekranda da, modelde de, testte de aynı şey okunur. İçinde cümle değil ölçüm
vardır.

```js
SP.Office.labBrief()    // summary, flags, attention, overdue, lastLab
SP.Office.nutriBrief()  // targets, adjustments, gaps, absorbNotes
SP.Office.moveBrief()   // readiness, band, acwr, deload, progressionReady
SP.Office.moneyBrief()  // total, limit, estimatePct, coverageGaps, swaps
SP.Office.patronBrief() // dördü birden + cross + headline + next
```

**Modele giden şey budur ve fazlası değildir.** Ad, doğum tarihi ve ham tahlil
belgesi brifinge hiç girmez — bu bir test tarafından denetlenir
(`office.test.js` → «brifingde ad ve doğum tarihi geçmez»).

Danışma ekranında brifingin ham JSON'u açılabilir. Kullanıcı ajanın ne
gördüğünü tam olarak görebilmelidir; görmediği bir şeye dayanarak konuşamaz.

---

## Çıktı denetimi

Model çıktısı basılmadan önce ev kurallarına karşı denetlenir
(`SP.Office.validate`). Dört desen aranır:

| Denetim | Ne arar |
|---|---|
| Doz önerisi | «Günde 5000 IU … al» |
| Teşhis ifadesi | «Sende … hastalığı var» |
| Sonuç garantisi | «Kesinlikle üç ayda düzelir» |
| Tedaviyi bırakma | «İlacı bırak / kes / azalt» |

Bir ihlal bulunursa çıktı **basılmaz**. Yerine kural motorunun cümlesi geçer ve
ekranda «kurallara takıldı» rozeti görünür. Model susturulmaz, yalnızca
sınırın dışına çıkması engellenir.

---

## Çelişki çözümü

İki uzman ters şeyler söylediğinde Patron'un uyduğu sıra (`SP.PRECEDENCE`):

| Sıra | Kural |
|---|---|
| 1 | Kırmızı bayrak |
| 2 | Güvenlik |
| 3 | Laboratuvar bulgusu |
| 4 | Beslenme hedefi |
| 5 | Antrenman hedefi |
| 6 | Bütçe |

Üstteki alttakini her zaman yener.

**Örnek.** Sedef «bu hafta balık alma, bütçe aşıldı» derken Kerem «trigliserit
yüksek, omega-3 şart» diyorsa: sağlık bütçeyi yener. Ama Sedef'in işi bitmez —
hedefi bozmadan ucuz muadili (sardalya, hamsi) bulmak onun görevidir. Bütçenin
en sonda olması «yok sayılır» demek değildir.

---

## Masa notları

Not bir tavsiye değil **bulgudur**. Koşul sağlandığında kendiliğinden bırakılır,
koşul geçtiğinde kendiliğinden kalkar. Kullanıcı silmez.

| Tür | Ne zaman |
|---|---|
| **Kırmızı bayrak** | Bir ölçüm kritik eşiği geçtiğinde |
| **Birikmiş borç** | Aşırı yük, sepet aşımı, günlerdir açık karar |
| **Açık** | Süreklileşen besin açığı, tazelenmemiş panel |
| **Kazanım** | Üst basamak açıldığında, seri uzadığında, tasarruf çıktığında |
| **Bilgi** | İndirme haftası, tahmin fiyat payı, emilim engeli |

---

## Toplantı

Gündem seçilir, dört uzman sırayla konuşur, Patron kapatır. Her tur ayrı bir
çağrıdır ve **geldiği anda ekrana basılır** — hepsinin bitmesi beklenmez.
Uzun süren bir toplantıda kullanıcı ilerlemeyi görür.

Kapanışta Patron:

1. Uzmanların söylediklerini okur,
2. Çelişki varsa öncelik sırasına göre çözer,
3. Tek bir karar yazar ve gerekçelendirir.

Tutanaktaki karar `SP.Calc.nextAction()`'dan gelir; Patron onu değiştiremez.
«Kararı takibe al» düğmesi kararı takip listesine yazar. Kapanmamış karar iki
günden uzun sürerse ofis bunu gündeme taşır.

Karar vermek değil, **kararın ne yaptığını görmek** sistemi ilerletir. Bu yüzden
kapatırken sonuç yazılır: ne değişti, ölçümle.

---

## Günlük brifing

Günde tek model çağrısı. Sonuç güne yazılır; aynı gün tekrar çağrılmaz.
Bugün ekranındaki «Ofisten» kartı ve masa notları bunu gösterir.

Model kapalıysa brifing yine üretilir — kural motorunun cümlesiyle.
