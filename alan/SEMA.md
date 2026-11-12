# Müfredat şeması (sürüm 1)

İçerik koddan ayrıdır: her aşama `alan/<alan>/asama-<n>.json` dosyasında durur ve
gerektiğinde yüklenir (yükleme birimi aşamadır). Denetim: `python alan/denetle.py alan/<alan>`
(0 = temiz, 1 = hata satırları). Motor: `motor/yol.js`.

Düzey sırası: **Alan → Aşama → Ünite → Ders → Alıştırma**, yanında **Kaynak**.
Ad kuralı AYS ders verisiyle aynıdır (`onKosul`, `kazanim`, `soru`, `sec`, `dogru`, `cozum`;
`AYS/src/js/data/derin-*.js`), böylece eski dersler dönüştürülmeden okunur.

## Kimlikler

Nokta ile iç içe: aşama `felsefe.1`, ünite `felsefe.1.2`, ders `felsefe.1.2.3`,
ders alıştırması `felsefe.1.2.3.a1`, ünite kapı sorusu `felsefe.1.2.k1`,
aşama kapı sorusu `felsefe.1.k1`. Bir alan klasöründe her kimlik bir kez geçer.
Kaynak kimliği (`k1`, `k2` …) yalnız kendi aşama dosyası içinde tekildir.

## Aşama (dosyanın kökü)

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `sema` | sayı | evet | şu an `1` |
| `alan` | metin | evet | alan kimliği (`felsefe`) |
| `id` | metin | evet | `<alan>.<sira>` |
| `sira` | tam sayı | evet | 1'den başlar |
| `ad` | metin | evet | |
| `hedef` | metin | evet | bir cümle |
| `onKosul` | kimlik[] | evet (boş olabilir) | önce geçilmesi gereken aşamalar |
| `kapi` | Kapı | evet | aşama kapısı |
| `kaynaklar` | Kaynak[] | evet, en az 1 | |
| `uniteler` | Ünite[] | evet, en az 1 | |
| `kanitIsi` | metin | hayır | sahibin değerlendireceği üretim işi (puanlanmaz) |

## Ünite

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `id`, `ad` | metin | evet | |
| `onKosul` | kimlik[] | evet (boş olabilir) | önce geçilmesi gereken üniteler |
| `kazanim` | metin[] | hayır | MEB kodu ya da cümle (`FEL.10.1.1`) |
| `kapi` | Kapı | evet | ünite kapısı |
| `dersler` | Ders[] | evet, en az 1 | |

## Ders

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `id`, `ad` | metin | evet | |
| `onKosul` | kimlik[] | evet (boş olabilir) | önce okunması gereken dersler |
| `kazanim` | metin[] | hayır | |
| `durum` | `taslak` \| `onayli` | evet | onaysız içerik taslak etiketiyle görünür, tekrara girmez |
| `yazan` | `model` \| `insan` | evet | metni kim yazdı (kaynaktan özetleyen model de `model`) |
| `kaynak` | kaynak kimliği[] | evet, en az 1 | kaynaksız ders yoktur |
| `ozet` | metin | evet | bir iki cümle |
| `metin` | metin[] | evet, en az 1 | paragraflar |
| `alistirmalar` | Alıştırma[] | evet (boş olabilir) | |
| `not` | metin | hayır | kaynakta görülen sorun, sahibe not |
| `onaylayan`, `onayTarihi` | metin | `durum: onayli` ise evet | |

## Alıştırma (ders alıştırması ve kapı sorusu aynı biçim)

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `id` | metin | evet | |
| `tur` | `secmeli` \| `acik` | evet | kapı sorusu yalnız `secmeli` olur |
| `soru` | metin | evet | |
| `sec` | metin[] | `secmeli` ise evet, 2–5 seçenek | |
| `dogru` | metin | evet (cevap anahtarı) | `secmeli`: harf (`A` …); `acik`: örnek cevap |
| `olcut` | metin[] | `acik` ise evet | öz değerlendirme ölçütleri |
| `cozum` | metin[] | hayır | |
| `durum`, `yazan`, `kaynak` | | evet | Ders ile aynı kurallar |

`acik` alıştırma puanlanmaz: kapıya, ilerleme oranına ve tekrara girmez.

## Kapı (ustalık kapısı)

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `esik` | sayı, 0 < e ≤ 1 | evet | doğru oranı; motor `ayar.esik` ile değiştirebilir |
| `sorular` | Alıştırma[] (`secmeli`) | evet, en az 3 | derste gösterilmeyen sorular |

Kural: ünite yalnız kapısı eşiği tuttuğunda **geçer**; ders okumak ve alıştırma çözmek
(hacim) tek başına hiçbir şeyi geçirmez. Aşama, bütün üniteleri ve kendi kapısı geçilince geçer.

## Kaynak

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `id` | metin | evet | aşama içinde tekil |
| `ad` | metin | evet | |
| `tur` | `gemini` \| `kurum` \| `kitap` \| `url` \| `depo` | evet | `gemini` = `C:\gemini-data` dosyası |
| `yol` | metin | evet | dosya yolu ya da adres |
| `bolum` | metin | hayır | başlık |
| `satir` | metin | hayır | `"15"` ya da `"72-79"` |
| `dogrulama` | `dogrulanmamis` \| `kaynakli` \| `denetlendi` | evet | kaynağın kendi doğruluğu |

İki eksen ayrıdır: **içerik** (`durum` + `dogrulama`) ve **öğrenenin sayıları**
(motorun dört etiketi: `ölçüldü`, `tahmin`, `hesaplandı`, `veri yok`).

## Onay

`taslak` → `onayli` yalnız sahibin kararıyla olur: `durum: "onayli"`, `onaylayan`, `onayTarihi`
(ISO tarih) birlikte yazılır. Model hiçbir zaman `onayli` yazmaz.
