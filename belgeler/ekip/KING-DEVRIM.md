# King: kişisel yasalar, kendi kendini süren gün, her şeyi derse çevirmek

Depo sahibi (2026-10-22): «devrimsel bir şey yapmamız lazım» → dört fikir,
«hepsini yap, araçlar kısmını daha geniş bir arayüzde yap; King'in arayüzünü
biraz büyüt, biraz saydam yap, arka plan görünsün; profesyonel». Kod:
`brand/ortak/king.js` («DEVRİM» bölümleri), modüllerde `kartlar.gun`.

Bütün parçalar AGENTS §1'e bağlı: sayıyı kod üretir, model yalnız cümle
kurar; etiketsiz sayı yok; eksik veri sıfır değil; neden-sonuç iddiası yok.

## 1. Kişisel yasalar («yasalarım», «beni ne etkiliyor»)

Girdi modülün kendi günlük ölçüleridir (`kartlar.olcu`: AYS doğruluk ve
çalışma süresi, SPİ uyku, günün hissi, yatış saati, ESP çalışma süresi);
son 120 gün. Her ölçü çifti (A, B) için aynı gün ve ertesi gün:

- A'nın ve B'nin ikisinin de ölçüldüğü günler; A medyanla ikiye ayrılır.
- Her grupta en az 8 gün yoksa söz yok («veri yetersiz»).
- B'nin iki grup ortalaması farkı, birleşik standart sapmaya bölünür
  (etki büyüklüğü); 0,5'ten küçükse söz yok.
- Söz kalıbı: «<A> <medyan> üstündeyken (ertesi gün) <B> ortalama <x>
  daha yüksek/düşük», altında n'ler, etiket «hesaplandı · ilişki, neden değil».
- «Deneye çevir» kişisel deneyi (söz 34) başlatır; «Modüller arası» Merkez'in
  çapraz bulgusunu (söz 33) getirir.

## 2. Kendi kendini süren gün («günüm», «bugün ne yapayım», «günü kapat»)

Modül günün maddelerini verir (`kartlar.gun() → { ogeler:[{ ad, alt, durum,
dk, konu }], not }`; durum: bitti · simdi · sirada · atlandi):
AYS bugünkü blokları, SPİ bugünkü plan maddeleri (zamanıyla, kayıttan
sayılır), ESP haftalık rotanın ilk üç disiplini ve bugünkü oturumları.

King gün kartını çizer: zaman çizgisi, «şimdi» satırında «Başlat» (odak
sayacı, maddenin süresi) ve «Modülde aç». Uyarlama kuraldır: saat 18'den
sonra bekleyen madde sayısı kalan çalışma saatini aşıyorsa King hangisinin
öne alınacağını söyler (modülün sırası). Yazma yok; planı modül değiştirir.
«Günü kapat»: kalanlar ve sesli özet.

## 3. Her şeyi derse çevirmek («derse çevir», PDF'ten sonra «Derse çevir»)

Kaynak: King'e verilen PDF'in metni (Merkez çıkarır) ya da yapıştırılan uzun
metin. Merkez'deki model kaynaktan ders ve soru yazar (JSON); KOD her bölümün
ve her sorunun `alinti`sını kaynak metinde arar (boşluk ve büyük-küçük harf
bağımsız). Alıntısı kaynakta olmayan bölüm ve soru ATILIR; iki bölümden azı
kalırsa ders kurulmaz. Ders «Derslerim»de durur (son 20); sorular King'in
kendi tekrarıyla sorulur (yanlış 1, doğru 3 ve 7 gün sonra). Ekranda
«Merkez yazdı · her bölüm kaynaktan alıntıyla doğrulandı».

## 4. Sınav yolculuğu

Zaten var: AYS › Analiz › Gelecek (core/gelecek.js; Theil–Sen gidiş, aralık,
yalnız ölçülen etkiyle «ne olursa»). King'den «sınav yolculuğum», «bu
gidişle» ve Araçlar › Sınav yolculuğu oraya götürür.

## Arayüz: geniş Araçlar ve saydam pencere

- Raydaki Araçlar sohbetin yerine GENİŞ vitrini açar: başta dört öne çıkan
  kart (Kişisel yasalar, Günüm, Derse çevir, Sınav yolculuğu), sonra gruplar;
  her yetenek bir kart (simge, ad, tek cümle, örnek, eylem). Arama bütün
  vitrinde süzer. Liste sütunu grupların dizinidir. Bir kartın eylemi sohbete
  döner ve çalışır.
- Pencere büyür (en çok 1680 × 1040, kenar payı 12 px) ve yüzey yarı
  saydamdır (yüzey %84, bulanıklık 28 px): arka plan görünür, metin kontrastı
  korunur (palettecheck). Perde hafifler.
