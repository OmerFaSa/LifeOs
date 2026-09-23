# Ortak kaynak — tek kaynak burasıdır

Bu klasördeki dosyalar AYS, SPİ ve ESP'nin **aynısını kullandığı**
şeylerdir. `python3 tools/ortak.py --yay` onları üç arayüzün kendi
klasörlerine dağıtır, `--denetle` ayrışmayı yakalar (CI de koşar).

```bash
python3 tools/ortak.py --yay       # buradan üç arayüze
python3 tools/ortak.py --denetle   # kopyalar kaynakla aynı mı
```

Üç CSS dosyasıyla başladı, on yediye çıktı. Her eklenen dosya aynı
ölçütü geçti: **üç arayüzde birebir aynı olmak zorunda mı?**

## Ne var burada

| Dosya | Nereye | Ne için |
|---|---|---|
| `base.css` | `src/css/` | sıfırlama, tipografi, erişilebilirlik temelleri |
| `layout.css` | `src/css/` | kabuk ızgarası, künye, alt bant, telefon düzeni |
| `designs.css` | `src/css/` | beş tasarım dilinin ortak gövdesi |
| `kesinlik.*` | `js/core`, `css`, `tests` | dört kesinlik etiketi (ölçüldü / tahmin / hesaplandı / veri yok) |
| `tanitim.*` | `js/core`, `css`, `tests` | ilk kurulumun üç adımı |
| `simge.*` | `js/core`, `css`, `tests` | kimlikten görsel adına giden tek kural |
| `medya.js` | `js/core` | **üretilmiş** künye — hangi görsel gerçekten var (`tools/marka.py --kunye`) |
| `quota.js` | `js/core` | ücretsiz modelin istek sınırı — **kalıp** |
| `quota.test.js` | `tests` | kotanın 20 testi — **kalıp** |
| `llm.js` | `js/core` | model taşıma katmanı — **kalıp**, yalnız SPİ + ESP |
| `store.test.js` | `tests` | gerçek deponun 24 testi — **kalıp** |
| `urun.*` | `js/core`, `tests` | BAM ürünleri (özet, rapor, sunum, pankart): ön süzgeç, modülün kendi denetimi, sandbox iframe, kendi deposu |

Kopyalar «ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME» başlığı taşır. Elle
düzenlenen bir kopya bir sonraki yayında kaybolur; `--denetle` bunu
daha önce söyler.

`src/` değiştiği için yayından sonra üç `build.py` de yeniden koşmalı.

## Aynı adla yazılır — çünkü SIRA ANLAMDIR

`--yay` dosyayı her uygulamanın kendi klasörüne **aynı adla** yazar.
Bu bilinçli: `index.html` değişmez, CSS'in yükleme sırası korunur ve
`build.py`'nin satır içine alma düzeni bozulmaz.

## Kalıp dosyalar — aynı gövde, başka ad alanı

Bir dosya üç arayüzde aynı İŞİ yapıp yalnızca **ad alanında**
ayrılabilir. O zaman kaynakta yer tutucu taşır:

| Yer tutucu | AYS | SPİ | ESP |
|---|---|---|---|
| `__NS__` | `R` | `SP` | `ESP` |
| `__DEPO__` | `rota` | `spi` | `esp` |
| `__BASLIK__` | `Rota — YKS ofisi` | `SPİ — sağlık ofisi` | `ESP — entelektüel ofis` |

Değiştirme **düz bir dize değiştirmedir**: koşul yok, döngü yok,
içerme yok. Bir gün bunlardan biri gerekirse çözüm şablon motoru
eklemek değil, o dosyayı paylaşmamaktır. Değiştirilememiş bir yer
tutucu sessizce geçmez — `tools/ortak.py` hata atar.

**Neden bu gerekliydi:** `quota.js`'in üç kopyası 280 satırdı ve
aralarındaki tek fark bu iki yer tutucuydu. `status()` içindeki
«sınır bilinmiyorsa alanlar NULL döner» düzeltmesi SPİ kopyasına
yazıldı, AYS ve ESP kopyalarında **unutuldu**. Hiçbir denetim
söylemedi. Tek kaynak bunu imkânsız kılar.

## Her dosya üç sisteme gitmez

`tools/ortak.py` içindeki `YALNIZ` tablosunda adı geçen dosya yalnız
orada yazan sistemlere yayılır. `llm.js` böyledir: SPİ ile ESP
kopyaları aynı dosyanın iki kopyasıydı (737 satır, fark yalnız ad
alanı), **AYS'ninki ise başka bir şeydir** — 1337 satır ve otuz fazla
işlev (`diagnose`, `listModels`, `visionChain`, `stripThinking`,
`keyProblem`, `classify`…). Üç kopyayı zorla birleştirmek AYS'nin
gelişimini geri almak olurdu.

## Burada olmayanlar — ve nedenleri

| Dosya | Durum | Neden burada değil |
|---|---|---|
| `tokens.css` | 78 satır fark | ajan renkleri ve grafik serisi renkleri uygulamaya özel |
| `palettes.css` | 52 satır fark | aynı biçim |
| `components.css` | ~50 satır fark | uygulamaya özel birkaç bileşen |
| `fonts.css` | üçünde aynı | **üretilmiş** dosya: kaynağı `<APP>/tools/fonts.py`. İki sahipli bir dosya yapmamak için dokunulmaz |
| `seviye.css` | zaten yayılıyor | kaynağı `brand/seviye/` |
| `rota.css`, `esp.css` | uygulamaya özel | — |
| HKM'nin yüzü | tek dosya | HKM üç arayüzün **yanında** durur, içinde değil (AGENTS.md §1.4). Ortak olan cümledir, dosya değil — `HKM/tests/test_yuz.py` iki tarafın aynı şeyi söylediğini sınar |

Kısmen ortak olan üçü «ortak gövde + uygulama kuyruğu» ayrımını
gerektirir. Bu bir tasarım kararıdır, bir kopyalama işi değil; ayrı
bir turda yapılır.
