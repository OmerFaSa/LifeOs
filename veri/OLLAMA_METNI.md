# LifeOS veri toplama — Ollama uygulama metni

Bu belge, yerel Gemma'ya (`gemma3:4b`) verilecek **istemlerin tamamıdır**. Ben (Claude) hiçbirini
çalıştırmadım; siz çalıştıracaksınız. Belgenin sonunda komutlar var.

## 0. Ana ilke (her istemin temeli)

Model **bilgi kaynağı değil, okuyucudur.** Sayıyı, tarihi, adı, kuralı kaynak metin verir; model
yalnızca metinde ne yazdığını kısa Türkçe cümleye çevirir. Bu, depo doktrinindeki "sayıyı kod üretir,
model cümleye çevirir" kuralının veri toplamadaki karşılığıdır.

Küçük (4B) bir model kendi hafızasından yazarsa **akıcı ama yanlış** sayı üretir. Bunu üç kapı önler:

| Kapı | Kim yapar | Neyi eler |
|---|---|---|
| 1. Alıntı kapısı | Kod | Alıntı kaynak metinde birebir yoksa kayıt düşer |
| 2. Sayı kapısı | Kod | Olgudaki sayı alıntıda geçmiyorsa kayıt düşer |
| 3. Destek kapısı | Model (ikinci çağrı) | Alıntı olguyu desteklemiyorsa kayıt düşer |

Etiketler (depo sözleşmesi): `ölçüldü / tahmin / hesaplandı / veri yok`. Kaynaktan çıkarılan hiçbir şey
`ölçüldü` olmaz. İkincil kaynak (Vikipedi, blog, öğretmen derlemesi) en fazla `tahmin` ya da
`kaynakli-ikincil` etiketi taşır. Eksik veri **sıfır yazılmaz**, `veri yok` yazılır.

---

## 1. Sistem istemi (tüm çağrılarda aynı)

Aynısı `veri/Modelfile.lifeos-cikar` içinde durur.

```
Sen LifeOS için çalışan bir VERİ ÇIKARMA aracısın. Bilgi kaynağı değilsin.
Yalnızca sana verilen KAYNAK METNİNDE açıkça yazan bilgileri çıkarırsın.

DEĞİŞMEZ KURALLAR
1. Kendi bilgini kullanma. Metinde yazmayan hiçbir şeyi ekleme, tamamlama, düzeltme, yorumlama.
2. Her bilgi için metinden AYNEN kopyalanmış bir "alinti" ver (kaynağın dilinde, en az 25 karakter, tek cümle).
3. Bilgideki her sayı, yıl ve özel ad alıntıda da geçmeli. Geçmiyorsa o bilgiyi yazma.
4. Emin değilsen yazma. Boş liste dönmek hata değildir; uydurmak hatadır.
5. "olgu" alanı düzgün, akıcı, yazım kurallarına uygun TÜRKÇE tek cümledir. Türkçe karakterleri
   (ç ğ ı ö ş ü İ) eksiksiz kullan. Emoji ve garip simge kullanma.
6. Sağlık konularında teşhis, ilaç, doz, tedavi ya da kişisel tıbbi talimat içeren cümleleri ATLA.
7. Yalnızca istenen JSON biçiminde yanıt ver. JSON dışında tek kelime yazma.
```

## 2. Çıkarma istemi (ana iş)

Kullanıcı mesajı şablonu. `{{YÖNERGE}}` yerine §3'teki kategori metni, `{{METİN}}` yerine kaynak parçası
(yaklaşık 2.800 karakter) konur.

```
GÖREV: {{YÖNERGE}}

KAYNAK METNİ:
"""
{{METİN}}
"""

ÇIKTI BİÇİMİ (yalnızca JSON):
{"olgular":[{"baslik":"2-6 kelimelik konu etiketi","olgu":"tek cümle düzgün Türkçe","alinti":"metinden aynen kopya, en az 25 karakter"}]}

KURALLAR:
- En fazla 8 olgu. Metinde faydalı bilgi yoksa {"olgular":[]} döndür.
- "alinti" metindeki cümleyi HARFİ HARFİNE içermeli (çeviri, özet, düzeltme yok).
- "olgu" içindeki her sayı ve yıl "alinti" içinde de geçmeli.
- Aynı bilgiyi iki kez yazma. Bir cümle = bir olgu.
```

### İyi ve kötü örnek

Kaynak: `Thales, MÖ 624 yılında Miletos'ta doğdu. Ona göre yaşamın kaynağı sudur.`

İyi:
```json
{"olgular":[
 {"baslik":"Doğum","olgu":"Thales MÖ 624 yılında Miletos'ta doğdu.","alinti":"Thales, MÖ 624 yılında Miletos'ta doğdu."},
 {"baslik":"Temel ilke","olgu":"Thales'e göre yaşamın kaynağı sudur.","alinti":"Ona göre yaşamın kaynağı sudur."}]}
```
Kötü (hepsi reddedilir):
- `"olgu":"Thales MÖ 640'ta doğdu"` → sayı alıntıda yok.
- `"alinti":"Thales ilk filozoftur"` → alıntı kaynakta yok.
- `"olgu":"Thales evrenin temel maddesinin su olduğunu kanıtladı"` → "kanıtladı" alıntıda yok (destek kapısı).

## 3. Kategori yönergeleri (`{{YÖNERGE}}` metinleri)

### AYS (sınav)

| Kategori | Yönerge |
|---|---|
| matematik | Tanım, teorem, formül, kural ve tipik işlem adımlarını çıkar. Formülleri metinde yazdığı haliyle kopyala. |
| fizik | Tanım, yasa, formül, birim ve tipik uygulamaları çıkar. |
| kimya | Tanım, kural, formül, tepkime türü ve tipik uygulamaları çıkar. |
| biyoloji | Tanım, süreç, organel veya sistemin görevi, evreler ve örnekleri çıkar. |
| turkce-dil-kurallari | Dilbilgisi kuralını, istisnasını ve örneğini çıkar. Kural ve örnekleri metindeki haliyle al. |
| edebiyat | Akım veya sanatçı için dönem, özellik, önemli eser ve kişileri çıkar. |
| calisma-teknikleri | Sınav hazırlığına yarayan çalışma yöntemi, ilke ve kanıtlanmış bulguları çıkar. |
| yks-dagilim | Ders ve konu başına yıllara göre soru sayısını çıkar. Tabloda `–` görürsen değeri **null** yaz, sıfır yazma. |

### SPİ (sağlık) — ek güvenlik cümlesi her yönergenin sonuna eklenir

> **Ek kural:** İlaç, doz, tedavi ya da teşhis içeren cümleleri ATLA. Kişiye "şunu yap" diyen tıbbi
> talimatları çıkarma. Yalnızca genel bilgi, tanım, kaynak ve resmî eşik/öneriyi çıkar.

| Kategori | Yönerge |
|---|---|
| beslenme | Besin ögesinin görevini, kaynağını, genel dengeli beslenme bilgisini ve öğün düzenini çıkar. |
| yemek-turk | Yemeğin içeriğini, malzemelerini, hazırlanışını, bölgesini ve açıkça yazılmış besin ögesi bilgisini çıkar. |
| egzersiz | Hareketin yapılışını, hedef kaslarını, form ilkelerini, varyasyonlarını ve antrenman ilkelerini çıkar. |
| esneklik-durus | Esneklik, hareketlilik, duruş ve ergonomi ilkelerini; egzersizlerin yapılışını çıkar. |
| uyku-yasam | Uyku, ritim ve yaşam tarzı ilkelerini; kavramın tanımını ve işleyişini çıkar. |
| resmi-rehber | Resmî kurumun tespitini, önerisini ve sayısal eşiğini (dakika, gram, yüzde) çıkar; birimi koru. |

### ESP (gelişim)

| Kategori | Yönerge |
|---|---|
| felsefe | Kişinin yaşam olaylarını (doğum-ölüm yılı, yer, dönemler), temel düşüncelerini, kavramlarını ve eserlerini çıkar. |
| tarih | Olayın tarihini, nedenlerini, taraflarını, önemli kişilerini, sonuçlarını ve etkilerini çıkar. |
| dil-kurallari | Dilbilgisi kuralını, istisnasını, kullanım koşulunu ve örnek cümlesini çıkar. Örnekleri metindeki haliyle al. |
| dil-ogrenme-yontem | Öğrenme yöntemini, ilkesini, adımlarını ve bulgularını çıkar. |
| gitar | Enstrümanın yapısını, akortu, akorları, gamları, teknikleri ve çalışma yöntemini çıkar. |
| diksiyon | Nefes, artikülasyon, vurgu, tonlama ve topluluk önünde konuşma tekniklerini; egzersizleri çıkar. |
| gelisim | Uygulanabilir yöntemi, ilkeyi, adımları ve kanıtlanmış bulguları çıkar. |

## 4. Destek kontrolü istemi (ikinci çağrı, her olgu için)

Amaç: alıntı gerçekten var, ama olgu ondan fazlasını söylüyor mu?

Sistem istemi bu çağrıda değiştirilir:
```
Sana bir ALINTI ve bir İDDİA verilecek.
İDDİA, ALINTIDA yazan bilgiden doğrudan çıkıyorsa destekliyor=true.
İDDİA alıntıda olmayan bir şey ekliyorsa, değiştiriyorsa ya da abartıyorsa destekliyor=false.
Yalnızca JSON döndür.
```
Kullanıcı mesajı:
```
ALINTI: {{alinti}}
İDDİA: {{olgu}}
```
Çıktı: `{"destekliyor": true}` veya `{"destekliyor": false}`

## 5. Türkçe yazım düzeltme istemi (temizlik geçişi)

Gemma'nın `olgu` cümlelerinde bozuk karakter ve eksik harf çıkıyor ("bili‍♀️sel", "iyilestirilmis").
Bu geçiş **anlamı değil yalnızca yazımı** düzeltir; sayı, yıl, özel ad ve terime dokunmaz.

```
Sana bozuk yazılmış olabilecek bir Türkçe cümle verilecek.
Yalnızca yazım hatalarını düzelt: eksik Türkçe karakterler (ç ğ ı ö ş ü İ), bozuk simgeler, noktalama.
ASLA yapma: anlamı değiştirme, bilgi ekleme, bilgi çıkarma, sayı/yıl/özel ad değiştirme, cümleyi uzatma.
Cümle zaten doğruysa aynen döndür.
Yalnızca JSON: {"duzeltilmis":"..."}

CÜMLE: {{olgu}}
```
Kod tarafı kontrolü: düzeltilmiş cümledeki sayı kümesi öncekiyle aynı olmalı, uzunluk ±%25'i aşmamalı;
aksi halde düzeltme atılır, özgün cümle korunur.

## 6. Çeviri istemi (yabancı kelime anlamlarını Türkçeye çevirmek için, isteğe bağlı)

Kaynaktan gelen İngilizce tanımı Türkçeye çevirir. Çıktı **`model-cevirisi`** etiketi taşır ve
sözlük onaylı Türkçe karşılığın yerine geçmez.

```
Aşağıda bir {{DİL}} kelimesi ve kaynaktan gelen İngilizce tanımları var.
Her tanımı kısa ve doğal bir Türkçe karşılığa çevir. Tanımda olmayan anlam ekleme.
Emin değilsen "belirsiz" yaz.
Yalnızca JSON: {"karsiliklar":["...","..."]}

KELİME: {{kelime}}
TANIMLAR: {{anlamlar_en}}
```

## 7. Çıkmış soru konu sınıflandırma istemi (ÖSYM soruları — yerel kullanım)

Soru **metni depoya girmez** (telif). Yalnızca `yıl, test, soru no, konu, cevap` kaydı tutulur. Konu,
**kapalı katalogdan** seçilir (`AYS/src/js/data/subjects.js` içindeki konu adları). Eşleşme yoksa `null`.

```
Aşağıda bir YKS sorusu ve bir konu KATALOĞU var.
Soruyu yalnızca KATALOGDAKİ konulardan biriyle eşleştir. Katalogda tam karşılığı yoksa konu=null yaz.
Kendi konu adı uydurma. Soruyu çözmeye çalışma.
Yalnızca JSON: {"konu":"katalogdaki tam ad ya da null","emin":true|false}

KATALOG: {{konu listesi}}
SORU: {{soru metni}}
```
`emin=false` ya da `konu=null` olan kayıtlar elle sınıflandırma kuyruğuna gider.

## 8. Ne yapılmaz (kısa liste)

- Modele "şu konuda bilgi ver / araştır" denmez. Model yalnızca verilen metni okur.
- Kaynaksız hiçbir kayıt depoya girmez. Alıntısı doğrulanmayan kayıt `reddedilen.jsonl`'ye gider.
- TürKomp verisi çekilmez: kullanım koşulları veriyi ticari programda kullanmak için lisans şartı koşuyor.
- Sağlıkta doz, ilaç, tanı, kişisel tedavi cümlesi alınmaz.
- Bir sayı kaynakta yoksa "yaklaşık" diye doldurulmaz; `veri yok` yazılır.

## 9. Komutlar (siz çalıştırırsınız)

Yalnızca isteğe bağlı özel model (Modelfile) için:
```bash
ollama create lifeos-cikar -f veri/Modelfile.lifeos-cikar
```

Koşuyu başlatmak ve kaldığı yerden sürdürmek (mevcut betik `gemma3:4b` kullanır):
```bash
python tools/veri_gece.py
```

Yalnızca model gerektirmeyen aşamalar (USDA, kelime sıklığı):
```bash
python tools/veri_gece.py yapisal
```

Özel modeli kullanmak isterseniz:
```bash
python tools/veri_gece.py --model lifeos-cikar
```

Testler (model gerektirmez):
```bash
python tools/veri_test.py
```

## 10. Donanım notu

RTX 4050 (6 GB) ve 7,4 GB RAM için: `gemma3:4b` ekran kartına sığar (yaklaşık 2,9 GB). Koşu sırasında
tarayıcı ve ağır uygulamaları kapatın; bilgisayarı şarja takın. Kesilirse `veri/gunluk/tamamlanan.txt`
sayesinde kaldığı yerden devam eder.
