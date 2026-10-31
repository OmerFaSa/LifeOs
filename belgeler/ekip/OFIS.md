# Ofis: Claude Code'un Antigravity ekibi (tek sayfa)

> Bu sayfa bu depoda çalışan **Claude Code** içindir: okuyunca ofisi tek
> seferde kullanabilmelisin. Ayrıntı: `belgeler/ekip/gorevler/README.md`.
> Depo sahibinin kararları (2026-10-31): «Antigravity'yi senin için çalışan
> bir ofis gibi yönet; verimli ol, kaliteden ödün verme; kritik işler ve
> tasarım sende.»

## 1. Ne var

PC'de Antigravity (Pro) açık; `tools/ajan.py` onu yerel dil sunucusundan
sürer. Üç rol, her biri bir Antigravity sohbeti:

| Rol | Komut | Ne yapar |
|---|---|---|
| Uygulayıcı | `baslat NNN` | `belgeler/ekip/gorevler/NNN-*.md`'yi kendi klasöründe yapar, test koşar, `ag/NNN-…` dalını push eder |
| Denetçi | `gozden NNN` (teslimde kendiliğinden) | Dalı senden önce inceler: `KARAR: temiz` ya da AGENTS.md §4 biçiminde bulgu |
| Araştırmacı | `sor "…"` | Salt okunur; kanıtla (dosya:satır) cevap |
| Testçi (betik, model değil) | `tools/ofis_test.py NNN` | main + dalın deneme birleşmesinde §2 tam denetimleri; ham çıktı `LifeOs-ajan/test/NNN/` |
| Pilot (arka plan süreci) | `pilot baslat` | Kuyruğu yürütür: başlatır, Denetçi turu, Testçi, «hazır» işareti (§7) |

Koruma kancası (`tools/ajan_kanca.py`, kullanıcı onayıyla kurulu) ajanı
klasörüne kilitler, main'e, ana klasöre, kişisel veriye ve kullanıcının dış
hesaplarına (Notion, Linear, Netlify, Canva, Figma) dokunmasını engeller, iş
bitmeden durmasına izin vermez. İzleme penceresi: `tools/gorev_takip.py`
(kullanıcı için; sen bakma, `rapor` yeter).

## 2. Maliyet modeli: neden bu kurallar

Senin harcaman ≈ **çağrı sayısı × oturum bağlamı**. Her araç çağrısı ve her
bildirim turu bütün bağlamı yeniden okur. Ofis Antigravity'nin kotasını
harcar, seninkini değil; ama yazma, bekleme ve inceleme senin çağrındır.
Ölçülen: 10 satırlık bir işi (004) ofise vermek ~10–12 çağrı tuttu, kendin
yapmak ~6 tutardı. Takvim tekrarı (001, 355 satır) gibi bir işte ofis
~%60–70 kazandırır.

## 3. Ne ofise, ne sende

**Depo sahibinin kararı (2026-10-31):** «Antigravity'yi ordun gibi kullan,
token'dan büyük tasarruf et; ama animasyon, görsel ve asıl altyapı çalışması
ona dokunmasın, onları senin kalitende yapamaz; yaratıcılıkta sen daha iyisin.»
Bu yüzden **varsayılan ofistir**: her işe başlamadan önce sor: «Görsel,
animasyon ya da altyapı mı?» Değilse ve tanımı yazılabiliyorsa görev yaz.

**Yasak bölge (kodda, pazarlık yok):** `ajan.py` içindeki `YASAK_BOLGE`
listesi: CSS, HTML, görseller, yazı tipleri, `brand/`, `css|img|fonts|medya`
klasörleri, animasyon/hareket/geçiş/tema JS'i, modül çekirdeği (`src/js/core`,
`build.py`, `devserver.py`, `sw.js`), `sistem/` sunucu-başlatma-güncelleme-hesap,
HKM çekirdeği, `uygulama/`, başlatıcılar, `tools/ortak.py` ve ofisin kendi
araçları, AGENTS.md, CI. Üç kat korunur: «Dokunulacak dosyalar»da yasak yol olan
görevi `baslat` reddeder; kanca o dosyalara yazmayı engeller; pilot dalın
diff'inde yasak yol görürse işi durdurur. Listeyi yalnız depo sahibi genişletir
ya da daraltır.

**Üç kademe (depo sahibi, 2026-11-01: «tasarruf, hız ve profesyonellik birlikte»):**

| Kademe | Ne | Kim | Kapı |
|---|---|---|---|
| Kırmızı | yasak bölge: görsel, animasyon, çekirdek altyapı, veri katmanı; mimari ve yeni özellik tasarımı | sen | kodda kilit (`YASAK_BOLGE`) |
| Sarı | veriye dokunan mantık: modül `core/` ve `screens/` mantığı, `sistem/` özellik modülleri, `HKM/motor`, `tools/veri_*`, `veri/` | ofis | **kabul testi zorunlu** (`SARI_BOLGE`: `baslat` ve `birlestir` testsizi durdurur), Denetçi turu, satır satır son inceleme |
| Yeşil | araçlar, testler, belgeler, tarama, veri üretimi | ofis | Testçi + diff okuma |

Ağır kodlama ekipte kalır (tasarruf, hız); doğruluğu ajanın sözü değil senin yazdığın test belirler.

**Sende kalır:** yasak bölgenin hepsi; tasarım ve yaratıcı kararlar; King;
AGENTS.md §1'e dokunan karar; ~20 satırın altındaki iş (ofis daha pahalı);
görev yazımı ve kabul testi; son inceleme, tam denetimler (§2), birleştirme,
derleme, push. Bir işin içinde hem mantık hem görsel varsa **böl**: mantığı
(veri, hesap, ekran dışı JS, test) ofise ver, görsel katmanı kendin yap.

**Ofise gider (varsayılan):** tanımı net, ölçütü yazılabilen orta ve büyük
işler: ekran mantığı (`src/js/screens`, CSS'siz), veri ve hesap modülleri,
`sistem/` altındaki özellik modülleri (ice, müzik, planlama…), araç betikleri,
testler, belgeler, veri üretimi; ve
**döngü işleri**, yani senin bağlamını tur tur şişirecek olanlar:
- kırmızı testi düzelt, koş, tekrar düzelt döngüsü (görev: «şu testler yeşil
  olsun, şu dosyalara dokunma»);
- aynı kalıbın çok dosyada tekrarı (yeniden adlandırma, toplu ekleme);
- veri ya da belge üretimi, uzun tarama ve listeleme (`sor`);
- uzun süren, çıktısı tek satırla özetlenebilen koşular.
Tek bir grep ya da okuma ile çözülecek soruyu `sor`'a verme; kendin yap.

**Token tasarrufu, kaliteyi düşürmeden:**
- Pahalı olan senin bağlamındır: geniş okuma, tarama, deneme-yanılma döngüsü.
  Bunları ofise ver; sen yalnız görevi, kabul testini ve son incelemeyi yaz.
- Görevi kısa ama kesin yaz: dosyalar, «Dokunma», kabul testi. Uzun açıklama
  yerine kabul testi; ajan ne yapacağını testten okur.
- İncelemede `rapor NNN` tek çağrı; diff'i oku, bütün dosyaları yeniden açma.
- Pilotu aç, birden çok görevi birlikte kuyruğa koy, sonuçları toplu incele.

## 4. Akış (en az çağrıyla)

**Standart tur (2026-10-31, en az çağrı):**
```
# 0) adayları sen tarama; Araştırmacı tarasın (kanıtlı, ofise uygun, biçimli)
python tools/ajan.py aday 5 [odak]   →  python tools/ajan.py cevap s-N
# 1) 3–4 adayı seç; her biri için kabul testi + görev dosyası; tek commit + push
python tools/ajan.py pilot baslat
# 2) TEK arka plan çağrısı (pilot.json'da hepsi «hazır» olana dek); yoklama yapma
# 3) toplu inceleme, tek çağrı
python tools/ajan.py rapor 007 008 009
# 4) her iş tek komut: Testçi'nin denediği commit mi, yasak bölge, kabul testi
#    değişmedi mi → merge --no-ff, kabul ve yeni testler CI'a, ders, kapat, push
python tools/ajan.py birlestir 007 --push
python tools/ajan.py birlestir 008 --not "kısa ders" --push
python tools/ajan.py pilot dur
```
`birlestir` main Testçi'den sonra ilerlediyse söyler: o zaman §2'yi main'de koş.
Bulgu varsa birleştirme yerine `mesaj NNN "…"` ve yeniden bekle.

- **Toplu ver, toplu incele:** 3–4 görevi birlikte başlat; tek `bekle`, tek
  inceleme turu. İş başına sabit maliyet ~10 çağrıdan ~4'e iner.
- **Aynı sohbette devam kendiliğinden:** rolün sohbeti boşsa, 3'ten az işi
  varsa ve bağlamı <200 bin ise yeni iş oraya gider (kuralları yeniden okumaz).
- **Efor = model:** düşük `flash_lite` (mekanik iş), orta `flash` (çoğu iş),
  yüksek `pro` (mantık ağır, ör. takvim tekrar kuralları). Görev dosyasında
  `**Efor:**` satırı. **Ölçülen (2026-10-31):** agentapi `pro` ile `flash`'ı
  aynı modele açıyor (meta veride ikisi de M322); Antigravity arayüzünde seçili
  Gemini 4 Argon (M417) agentapi'den seçilemiyor. Pratikte iki kademe var:
  `flash_lite` (M198) ve `flash`/`pro` (M322). Mantık ağır iş için yüksek
  efor yine yazılır (Antigravity eşlemeyi değiştirirse kendiliğinden güçlenir)
  ama asıl güvence kabul testidir.
- **Kendi oturumun uzadıysa** (bağlam >~200 bin) kullanıcıya yeni oturum öner:
  her şey dosyada ve hafızada, taze oturum aynı işi ~10 kat ucuza yapar.

**Pilotla (önerilen, 2026-10-31):** görev dosyalarını yaz, commit + push,
`python tools/ajan.py pilot baslat`. Pilot sıradakileri başlatır, Denetçi
bulgusunu geri gönderir, Testçi'yi koşturur; iş «hazır» olunca tek çağrı:
`python tools/ajan.py rapor NNN` (Sonuç, Denetçi, Testçi tablosu, diff).
Kırmızı varsa `testler NNN` ham çıktının son satırlarını verir. Gerisi aynı:
diff'i oku, `birlestir NNN --push`.
Uygulayıcı'nın istemine görevin dokunduğu modülün belgesi (`SPI/src/MIMARI.md`,
`ESP/src/MIMARI.md`, `AYS/src/DURUSTLUK.md`, `HKM/MIMARI.md`…) kendiliğinden
girer: var olan kalıbı izler.

## 5. Kalite kuralları (pazarlık yok)

- Denetçi'nin «temiz»i birleştirme izni değildir: diff'i oku, §2 denetimlerini koş.
- Ucuz modelin iddiasını doğrula (Araştırmacı bir aracın testi «yok» dedi, vardı).
- Görev dosyası: «şu girdiyle şu çıktı» biçiminde kabul ölçütü, «Dokunma»
  listesi, koşulacak testler. Belirsiz görev yazma; ajan tahmin eder.
- Bulguyu aynı sohbete geri gönder (001'de RECURRENCE-ID böyle düzeldi).
- **Kabul testi önce (2026-10-31):** mantığı olan her görevde kabul testini
  SEN yazarsın, görevle birlikte commit edersin; kırmızıdır. Görev dosyasında
  `**Kabul testi:** \`tools/x_kabul_test.py\``. Yeni dosya olsun (CI listesinde
  değil; birleştirirken `.github/workflows/ci.yml`'e eklersin). Kanca ajanın onu
  değiştirmesini engeller, Denetçi diff'te değişmediğini doğrular, Testçi önce
  onu koşar, pilot dalda değiştiyse işi «hazır» yapıp söyler. Ölçütü ajan değil
  test belirler; ajanın kendi testi ek güvencedir. Kabul testi `.py`'dir; modül JS
  mantığını `tools/kabul_js.py` ile Node'da (tarayıcısız) sınar:
  `J.calistir("SPI", ["src/js/core/utils.js", "src/js/core/x.js"], "SP.X.f(...)")`.
  Testçi ayrıca CI'daki bütün Python test komutlarını koşar (`python` satırı).
- **Denetçi bir üst kademede ve bozmaya çalışır:** düşük işi orta, ortayı yüksek
  denetler; en az iki kenar girdiyi gerçekten çalıştırıp `DENEME:` satırı
  yazmak zorunda. Denemesiz «temiz»e pilot bir kez geri sorar.
- **Sonuç biçimi:** dört alan (Ne değişti · Koşan testler · Kabul testi · Açık
  kalan) dolu olmalı; pilot eksiği Denetçi'den önce bir kez geri gönderir.
- **Ders defteri:** her birleştirmede son incelemeni kaydet:
  `python tools/ajan.py ders NNN temiz` ya da `ders NNN "kısa kural"`. Ders
  `gorevler/DERSLER.md`'ye düşer (commit et); son 10 madde Uygulayıcı'nın ve
  Denetçi'nin istemine girer. Ölçüm «son incelemede temiz» oranını gösterir.

## 6. Bilinen tuzaklar

- Antigravity'nin kabuğu ajanın klasöründe değil `C:\Users\ASUS\LifeOs`'ta
  açılır; kanca `Set-Location` ekler. Kanca kapalıysa ajan main'e yazabilir
  (2026-10-31'de oldu, geri alındı).
- Kancada PreToolUse'a boş cevap (`{}`) = reddet; bizim olmayan sohbete
  `{"decision":"ask"}`.
- Pro, arka planda testi başlatıp «bekleniyor» deyip durabilir; kanca devam
  ettirir. «turu bitti» ≠ teslim; `rapor` dalı gösterir.
- Ajan worktree'sinde `olucss.py` güvenilmez (derleme dosyası yok); main'de ölç.
- Antigravity kapalıysa komutlar «Antigravity açık değil» der; kullanıcıdan aç.
- Testçi'nin portları senin denetimlerinle aynıdır (sabit): o koşarken sen
  §2'yi koşarsan ikiniz de «koşulamadı» (çıkış 2) alırsınız. `LifeOs-ajan/test/kilit`
  varsa bekle.

## 7. Otomatik pilot, Testçi, ölçüm

**Pilot** (`tools/ofis_pilot.py`, `ajan.py pilot baslat|dur|durum`): pythonw ile
ayrık çalışır, 30 sn'de bir tur atar, nabzını `LifeOs-ajan/pilot.nabiz`'e yazar.
Her tur: koruma kancası kurulu değilse ya da Antigravity kapalıysa **durur**;
main'e commit edilmiş «bekliyor» görevlerden en çok 3 paralel, günde en çok 8
başlatır (paralel işler aynı sohbeti paylaşmaz). Her işte karar tablosu
(`adim()`, saf işlev, testli):

| Durum | Pilotun adımı |
|---|---|
| Uygulayıcı çalışıyor | bekler |
| «sorun» (hata, sessiz) | bırakır → hazır («bırakıldı: …») |
| kota/RESOURCE_EXHAUSTED hatası | bir kez alt modelle yeniden (pro→flash→flash_lite); klasördeki yarım iş kalır |
| teslim (bitti + commit + push) bu commit'te denetlenmedi | `gozden` (Denetçi aynı anda tek iş: ortak klasör) |
| Denetçi bulgu, tur < 2 | bulguyu `mesaj` ile Uygulayıcı'ya; yeni commit gelince yeniden `gozden` |
| temiz ya da tur bitti, bu commit test edilmedi | Testçi (kilit boşsa) |
| Testçi kırmızı, test turu < 1 | ham log yolu ve son satırlarla düzeltme mesajı |
| koşulamadı (port dolu) | en çok 3 kez yeniden |
| geri kalan | **hazır**: `pilot.json`, `bildirim.jsonl`, `olcum.jsonl` |

Pilot ASLA birleştirmez, push etmez, görev yazmaz; işi kapatmaz (klasör
`kapat`'a kadar durur). Her kararı `pilot.jsonl`'dedir; `pilot durum`
özetler. **Pilotun «hazır»ı birleştirme izni değildir**: §5 aynen geçerli.

**Testçi** (`tools/ofis_test.py NNN`, LLM yok): `LifeOs-ajan/ofis-test`
(ayrık) klasörünü main + dalın `merge --no-ff` birleşmesine getirir (push yok,
dal yok), üç modülü derler, her modülde runtests, smoke, a11ycheck,
layoutcheck, palettecheck, perfcheck; sonra entegre (~20–30 dk). Her adımın ham
çıktısı `LifeOs-ajan/test/NNN/<modül>-<ad>.log`, tablo `ozet.json`. Aynı anda
tek koşu (`test/kilit`); çıkış 2 «koşulamadı»dır, kırmızı değildir. Elle de
koşulur (arka planda): `python tools/ofis_test.py NNN`.

**Ölçüm:** her hazır iş `olcum.jsonl`'e efor, model, Denetçi'nin ilk kararı,
tur, token, süre ve sonucu yazar. Görev Takibi model başına «ilk turda temiz»
oranını gösterir; yalnız öneridir, eforu sen seçersin.

**Görev Takibi:** pilot paneli (canlı mı, son kararlar, başlat/durdur komutu),
Testçi tablosu (renk: yeşil geçti, kırmızı kaldı, gri koşulamadı), model
ölçümü ve «iş iste» kutusu. Kutu yalnız 127.0.0.1'den ve `X-LifeOS-Ofis`
başlığıyla yazar (başka site gönderemez); istek `LifeOs-ajan/istekler.jsonl`'e
düşer, görevi sen planlarsın.

**Telefon bildirimi: yok (2026-10-31 bakıldı).** iPhone'daki bildirimler
yereldir: modülün web kodu telefonda `BildirimKoprusu.swift` ile
`UNUserNotificationCenter`'a kurar. PC sunucusundan (`sistem/hesap.py`)
telefona itme yolu (APNs vb.) yoktur; gelen kutusu ters yönlüdür (telefon →
PC). Uydurma kurulmadı; «hazır» Görev Takibi'nde ve `bildirim.jsonl`'dedir.

**Oturum açılışında kendiliğinden başlatma YOK** (2026-10-31, depo sahibinin
kararı: «bizim kararımız ile başlasın»): zamanlanmış görev ya da Başlangıç
klasörü kurulmaz; pilotu Claude Code gerektiğinde `pilot baslat` ile açar, iş
bitince `pilot dur` ile kapatır.
