# Telefon ve tablet hızı — durum (2026-11-06)

Dal: `claude/telefon-hiz-f459e1`. `main`'e alınmadı, gönderilmedi. Telefonun görmesi için dal `main`'e
girmeli, sonra LifeOS «Güncelle» (sunucu dosyası değiştiği için kendiliğinden yeniden başlar).

## Bulunan darboğazlar (ölçüldü)

1. **Telefon tek dosya yerine yüzlerce dosya alıyordu.** `brand/ortak` iki işte değişip «Derlemeler»
   unutulunca (`d415ba8c`, `adbe59a7`; 11 dosya) kapı güvenli tarafa kaçıp `src`'yi sunuyordu: SPİ 251, AYS 273 istek.
2. **Bu yığın uygulamayı bozuyordu.** Vekil (`tailscale serve`) tarayıcıya HTTP/2 verir, 250 isteği aynı anda
   sunucuya yollar; bazı betikler **502** döner, uygulama açılmaz ya da «Render hatası» ile yarım açılır.
   Normal 4G taklidinde 5 denemenin 4'ünde, yavaş 4G'de arada görüldü. Eski yerel ağ yolunda tarayıcı 6 bağlantıyla
   sınırlı olduğundan görünmüyordu. 502'nin tam nedeni (kabul kuyruğu mu, başka bir şey mi) ölçülmedi.
3. **Sıkıştırma yoktu**, her yanıt `no-store`: her açılışta her şey baştan iniyordu.
4. **Önbellek işçisi her dosyayı ikinci kez indiriyordu** (`sw.js` `doldur`, `no-store`): ilk açılış 7,2 MB sayfa + 7,2 MB kasa.
5. Sürümlü dosyaların eski kopyaları kasada birikiyordu (her güncelleme ~7 MB).

## Yapılanlar (dalda, testli)

- `sistem/sunucu.py`: dist eskiyse aynı kaynaktan **bellekte derlenir** (`_canli_bol`, `build.py › derle()`), diske yazmaz,
  kaynak değişince yeniden derlenir; derlenemezse eskisi gibi `src`.
- Telefon ve tablet: **gzip** (önbellekli, `_sikistir`); sayfa `no-cache` + ETag → değişmediyse 304; görseller `no-cache` + Last-Modified → 304.
  Bu bilgisayar değişmedi (ham, `no-store`). Vekil işareti ve köken denetimlerine dokunulmadı.
- `brand/ortak/sw.js`: kasa dolarken `force-cache` (ikinci indirme yok), sürümlü dosya kasadaysa ağa sorulmaz,
  yeni sürüm eskisini siler, kasa `v2` (eski 250 dosya temizlenir).
- Test: `tools/dist_sun_test.py`, `brand/ortak/pwa.test.js`; `smoke.js`'lerde kasa adı.

## Önce / sonra

Ölçüm: telefon taklidi (393×852, dokunmatik), bütün trafik tek kısıtlı tünelden. «Normal 4G» 10 Mbit/50 ms, «yavaş 4G» 1,6 Mbit/150 ms
(Lighthouse). Önce = gerçek adres (çalışan kopya); sonra = bu dal, geçici sunucu, vekil işaretli. «Hazır» = uygulama çizildi (giriş ekranı dahil).

| Durum | | İlk boyama | Hazır | İnen | Sayfa + işçi isteği |
|---|---|---|---|---|---|
| SPİ yavaş 4G, ilk | önce | 10,9 sn | 38,5 sn | 14,1 MB | 254 + 252 |
| | sonra | 2,5 sn | 11,1 sn | 2,0 MB | 5 + 6 |
| SPİ yavaş 4G, tekrar | önce | 10,2 sn | 37,8 sn | 7,1 MB | 261 + 251 |
| | sonra | 0,3 sn | 0,65 sn | 19 KB | 5 + 2 |
| SPİ normal 4G, ilk | önce | 2,1 sn | 6,6 sn (4/5 açılmadı, 502) | 13,4 MB | 253 + 252 |
| | sonra | 0,6 sn | 2,5 sn | 2,0 MB | 5 + 6 |
| SPİ normal 4G, tekrar | önce | 1,9 sn | açılmadı (502) | 6,6 MB | 251 |
| | sonra | 0,17 sn | 0,47 sn | 19 KB | 5 + 2 |
| AYS yavaş 4G, ilk | önce | ölçülmedi | ölçülmedi | ölçülmedi | — |
| | sonra | 5,1 sn | 13,8 sn | 2,6 MB | 5 + 5 |
| AYS yavaş 4G, tekrar | sonra | 0,27 sn | 0,63 sn | 1 KB | 5 + 2 |
| AYS normal 4G, ilk | önce | 2,1 sn | açılmadı (502) | 7,3 MB (işçi hariç) | 273 |

Sonuncu AYS tekrar satırı HTTP/1.1 ile: Chromium ETag'i HTTP/1.0 yanıtta yok sayar. Vekil telefona HTTP/2 verdiği için (ölçüldü: `h2`)
Tailscale yolunda 304 çalışmalı. **Gerçek adreste sonra ölçümü yapılmadı**, dal `main`'e girip güncellenince ölçülmeli.

## Bilinen sınır

- Ev ağı kapısı (5183 doğrudan, Python HTTP/1.0): gzip ve görsel 304'ü çalışır, sayfa 304'ü çalışmaz (AYS her açılış 526 KB). `Last-Modified`
  eklemek ya da HTTP/1.1'e geçmek çözer; Wi-Fi'da önemsiz sayıldı.
- Bellekte derlenen sayfanın derleme damgası (`SP.BUILD`) depodaki son damgayı gösterir (`src` ile aynı davranış).

## Yapılmadı (sonraki oturum)

Öncelik sırasıyla:

1. **Gerçek adreste sonra ölçümü** ve iPhone'da deneme. Betik: `olc.js` şu an scratchpad'de; bu dosyanın sonundaki tarifle yeniden yazılır.
2. **Bilgisayar kapalıyken açılış süresi ölçülmedi.** `sw.js` «ağ önce»: vekil yanıt vermezse sayfa kasadan ancak bağlantı zaman aşımında açılabilir
   (tahmin, ölçülmedi). Ölçüp gerekirse gezintide 3-4 sn süre sınırı ve kasadan açma. §1.4 ile doğrudan ilgili.
3. **İlk açılış bayt azaltma.** Sıkıştırılmış betik ~1,6 MB, stil ~0,4 MB (yazı tipleri gömülü), AYS sayfası 525 KB (`[tembel]` metni sayfada), ESP 308 KB.
   Her güncellemede hepsi yeniden iner. Adaylar: tembel metni sürümlü ayrı dosyaya taşımak, ESP `data/kelimeornek.js` (582 KB) ve SPİ `data/egzersizkatalog.js` (240 KB) için `[tembel]`.
4. **Ekran geçişleri ve arka plan sahnesi ölçülmedi.** `perfcheck` koşulmadı, dokunmatikte geçiş ölçümü yok. Sahne 12 kare/sn; `piksel.js` `dongu`, 125 ms'lik `kingOda` döngüsü her zaman tarar. Görünüm değişmeden maliyet ölçülmeli.
5. **Açılış API istekleri:** girişli olmayan telefonda tekrar açılışta 10+ `/api/...` (memory, kanal, king, sync, intents, bildirim, hedef, ofis) görüldü; gereksiz yoklama sayılmadı. `her-yerden-erisim` alanına değer.
6. **Ayrı hata, `her-yerden-erisim` için:** gerçek adreste `/api/king/teklifler/spi` tarayıcıda köken hatası veriyor (`:5183` sayfasından 443'teki Merkez'e). Bu işte dokunulmadı.
7. `node tools/mobil_tara.js AYS` ve `ESP` koşulmadı (limit); SPİ temiz (216 ölçüm, 0 bulgu). Birleştirmeden önce koşulmalı.

## Ölçüm tarifi

Node `net` ile tünel: `chromium.launch({ args:['--host-resolver-rules=MAP <host> 127.0.0.1:<tünel>'] })`, iki yönde tek FIFO kuyruk (paket sırası bozulmasın,
tek zamanlayıcı), sunucu kapatınca kuyruk boşalmadan kapatma. CDP kısıtı kullanma: önbellek işçisinin isteklerini kısmaz, tekrar açılışı olduğundan iyi gösterir.
Geçici sunucu: `LOCALAPPDATA` ve `LIFEOS_HESAP_KLASOR` geçici klasöre, `sunucu.uzak.vekilden_mi = lambda ip, b: True`, adres `http://telefon.localhost:<port>/` (işçi yalnız güvenli kökende çalışır).
