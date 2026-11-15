# Faz 8 · P2 Hareket raporu (2026-11-15)

Dal: `taze-hareket`. Taban: `origin/sadelesme` e4702159.

## Ne yapıldı

**1. Hareket sözlüğü.** `kabuk.css` «Hareket dili» bloğunun başında belgelendi:

| Jeton | Değer | Nerede |
|---|---|---|
| `--hizli` | `--sure × 1,25` ≈ 200 ms | üzerine gelme, renk, sayfadan çıkış; basma anı bunun yarısı |
| `--orta` | `--sure × 2,25` ≈ 360 ms | sayfaya giriş, liste süzülmesi, rıhtım, halka, tercih göstergesi |
| `--yavas` | `--sure × 3,75` ≈ 600 ms | dalga, onay çizimi, sarsma, ilerleme dolması |
| `--akis` | `cubic-bezier(.22,1,.36,1)` | varsayılan eğri |
| `--yay` | `cubic-bezier(.34,1.4,.64,1)` | simge, halka taşı, düğmenin bırakılması |

- Bloktaki bütün `calc(var(--sure) * n)` değerleri bu jetonlara bağlandı. Bölgede `--sure`'yi doğrudan kullanan kural kalmadı.
- Hepsi `--sure`'den türediği için hareket «az» ve «hareketi azalt» hepsini sıfırlar.

**2. Paylaşılan öğe geçişi** (`kabuk.js` rota, `paylasKaynak`):
- Bugün'deki alan kartının ya da Öğren'deki simgeli satırın simgesi, açılan sayfanın kapak simgesine akar.
- «Sıradaki» kartının ve Bugün karşılamasının ana düğmesi: başlık, açılan dersin (ya da kapının) başlığına akar.
- `view-transition-name: paylasilan` yalnız tıklanan öğeye ve hedefe, yalnız geçiş süresince verilir; `gecisBitti` siler.
- Desteklemeyen tarayıcıda ya da hareket kapalıyken düz geçiş olur.

**3. Mikro etkileşimler** (`etkilesim.js`). Hepsi yalnız görüntüde: tıklama yakalama evresinde önceki durum alınır, kabuk.js yeniden çizer, süs bir sonraki karede eklenir.
- **Cevap:** yalnız yeni verilen cevapta (`.yeni-cevap`) yanlış şık hafifçe sarsılır, doğrunun «✓» işareti soldan çizilir. «Doğru./Yanlış.» metni çizimle birlikte hemen gelir.
- **İlerleme:** çubuk değerleri sayfa + ad anahtarıyla hatırlanır (`#sayfa` için MutationObserver). Değer artınca yeni dilimler soldan dolar, sayı aşağıdan kayar; geçiş bittikten sonra başlar. `aria-valuenow` zaten yeni değerdedir.
- **Tercih:** ayar değişince seçili göstergenin geçici kopyası eski yerden yenisine kayar (WAAPI, `--orta`, `--akis`). `aria-checked` hemen yazılır.
- Saf hesap `artanlar(önce, şimdi)` için `etkilesim.test.js`'e test eklendi.

**4. İnceltme:**
- Işık ve eğim artık yalnız tıklanan kartlarda: alan kartı, bağlantı satırı, ders. Düğme, sayı kutusu ve Hesap kimliği sakin; sayı kutusunun üzerine gelince kalkması da kalktı.
- Süzülme kısaldı:
  - öğe başı gecikme 72 → 40 ms;
  - taban gecikme 96 → 60 ms;
  - süre 580 → 360 ms;
  - onuncu öğe 1,3 sn yerine yaklaşık 0,8 sn'de oturur;
  - `canlan` 1,4 sn yerine 1,0 sn'de kalkar.
- Aynı anda en çok iki hareket: geçişle gelinince yalnız sayfa ve liste süzülür. Kapak simgesi, Hesap baş harfi ve uyarı ayrıca oynamaz (`.canlan--gecis`).
- Gece düğmesinin nefesi ve açılış fidesi (`.yukle`) artık hem «az»da hem sistemin «hareketi azalt»ında durur. Eskiden açılış fidesi «az»ı dinlemiyordu, nefes de «hareketi azalt»ı.

**5. Hareket gezisi** `tools/hareket_gez.js`, CI'da «Hareket gezisi» adımı.
- Ortam: yalıtılmış (geçici veri klasörü, HKM'siz, port 4394; 4397'yi `kabuk_gez.js` kullandığı için ayrı port seçildi).
- Üç bağlam: hareket açık, «az», sistemin «hareketi azalt»ı.
- Sınananlar:
  - yeni sayfa bir kez süzülür;
  - geçiş yönü sekme sırasına uyar ve bitince iz kalmaz;
  - aynı sayfanın yeniden çizimi hiçbir şeyi yeniden oynatmaz;
  - alan kartı kapak simgesine akar ve geçici ad geride kalmaz;
  - sarsma, onay çizimi, ilerleme dolması ve tercih kayması yalnız hareket açıkken oynar (metin ve aria hemen doğru);
  - hareket kapalıyken görünüm geçişi hiç başlamaz ve gezintide oynayan animasyon yoktur;
  - sayfada ve konsolda hata yoktur.
- Kare ölçümü yalnız bilgi verir; `--kati` verilirse kapı olur.

## Kare ölçümü (önce → sonra)

Yöntem:
- Headless Chromium, 1100×700.
- Sekme ve alt sayfalar arasında 8 geçiş (Bugün, Öğren, Sağlık, Notlar, Plan, Felsefe, Ayarlar, Akademik), her biri 650 ms.
- Ölçülen rAF aralıkları; 3 tur.

| | En uzun kare | 50 ms'yi aşan kare |
|---|---|---|
| Önce (e4702159) | 33 / 33 / 33 ms (gezinin ilk koşusunda bir kez 50 ms) | 0 |
| Sonra | 33 / 33 / 33 ms (gezide 33–34 ms) | 0 |
| «az» ve «hareketi azalt» | 17 ms | 0 |

Paylaşılan öğe, sarsma ve dolma kare süresini artırmadı. Animasyonlar yalnız opaklık ve transform kullanıyor. İki istisna: işaretin `clip-path`'i ve dilimin `background-size`'ı; ikisi de birkaç piksellik öğelerde, 600 ms boyunca.

## Kare dizileri (önce / sonra)

`belgeler/ekip/sadelesme/faz8-hareket/`. Her şeritte geçişin ilk 5 karesi (yaklaşık 100 ms arayla) ve son durum:
- `once-bugun-alan.jpg` → `sonra-bugun-alan.jpg`: Bugün'de alan kartına tıklayınca kartın simgesi kapak simgesine uçuyor;
- `once-sira-ders.jpg` → `sonra-sira-ders.jpg`: «Sıradaki» → ders başlığı.

## Kapılar

Hepsi worktree içinde koşuldu:

| Kapı | Sonuç |
|---|---|
| `node kabuk/*.test.js` (14 dosya) | hepsi yeşil |
| `node tools/kabuk_gez.js` | hepsi geçti |
| `node tools/kabuk_esit_gez.js` | hepsi geçti |
| `python tools/tekkapi_test.py` | 147/147 |
| `python kalite/olcum.py --denetle` | 28 bütçe, aşım yok |
| `python kalite/katman.py` | yeni bozulma yok |
| `python tools/ci_yerel.py --selftest` | 49 adım (yeni adım okunuyor) |
| `node tools/hareket_gez.js --kati` | hepsi geçti |

`python HKM/tests/run.py` koşulmadı; bu paket HKM'ye dokunmadı.

## Dosya sahipliği

Yalnız şunlara dokunuldu:
- `kabuk/etkilesim.js` (+ testi);
- `kabuk.css`:
  - «Hareket dili» bölgesi (`#halka`, `.rihtim`, `.yukle` dahil);
  - yeni kurallar «Öğrenme ekranları»ndan hemen önce eklendi;
  - bölge içinde `.b-tercih{position:relative}` var: kayan kopya için gerekiyor.
- `kabuk.js`:
  - `rota()` geçişi;
  - `canlan`;
  - paylaşılan öğe yakalayıcısı;
- `tools/hareket_gez.js` ve `ci.yml`'de tek adım.

Sayfa çizimine ve `bilesen.css`'e dokunulmadı. `siraVer` adlı bir işlev kodda yok; «Sıradaki» kartı `siraKarti` işlevi ve ona dokunulmadı.

## Açık kalanlar

- Paylaşılan öğe geçişi yalnız Bugün → alan yolunda gezide sınanıyor. «Sıradaki» → ders yolu yalnız kare dizisiyle görüldü.
- Telefonda gerçek dokunuşla denenmedi. Işık ve eğim zaten yalnız ince imleçte çalışıyor; sarsma, dolma ve kayma dokunmatikte de çalışır.
- Kapak manzarasının kayması (`.kapak__sahne`, `--sure × 6`) ve `.canlan .kapak__simge` P1 bölgesinde kaldı; sözlüğe bağlanmadı. Birleştirmede `--yavas`'a bağlanabilir.
- `gece.js` düğme davranışına dokunulmadı; yalnız CSS'teki nefes «hareketi azalt»a bağlandı.
- Kare ölçümü headless Chromium'da yapıldı. Gerçek pencerede ve zayıf makinede ölçülmedi.
