# Faz 1 P5 — Tek kapı, tek süreç (A4)

## Özet
`sistem/tekkapi.py` tek süreçte, tek adreste giriş + Gün (`/`, `/gun/`), üç modülün dist'ini (`/ays/`, `/spi/`, `/esp/`), 4180'in ve modül kapılarının bütün `/api/...` yollarını ve HKM çekirdeğini (`/api/hkm/...`, aynı süreçte) sunar; `/kabuk/` ayrıldı. Mevcut işleyicilere istek devredilerek yapıldı, işleyici yeniden yazılmadı. Boşta bellek (ölçüldü, 3 tur ortanca): eski topoloji 97,7 MB → tek kapı 65,6 MB. `tools/tekkapi_test.py` 74/74 yeşil (eski ve yeni yan yana, geçici veri, boş portlar); HKM `tests.run` 1093/1093, `giris_sayfa_test.js` temiz, `dist_sun_test.py` temiz. **Devrede değil**: `ETKIN = False`, BASLAT değişmedi; açılış P6'ya bağlı (köken değişir).

## Tasarım
- Yeni dosya `sistem/tekkapi.py`. Bugünkü topoloji: `sunucu.py` TEK süreçte dört kapı (4180 giriş+Gün, 4173/4183/4193 modüller; ev ağı açıksa 5173/5183/5193+5180) ve HKM AYRI süreç (`HKM/daemon.py`, 4200). Tek kapı: hepsi bir adres, bir süreç.
- **Hiçbir işleyici yeniden yazılmadı.** `TekKapi(sunucu.Giris)` yolun önekine bakar ve isteği mevcut işleyici sınıfına **devreder** (`_devret`: aynı soket, aynı başlıklar ve istemci adresi, yalnız `path` değişir; `close_connection` geri alınır). Modüller: `sunucu.Sunucu`'nun modül alt sınıfı (`_sunucu_kur` ile aynı: `repo`, `directory=src`), önek atılarak (`/ays/x` → `/x`). HKM: `HKM/daemon.Handler`, `/api/hkm/x` → `/api/x`, `server` olarak aynı süreçte kurulan çekirdek nesnesi.
- HKM çekirdeği aynı süreçte: `daemon.main()`'in kurulum kısmı `daemon.hazirla(srv, cfg, config_path)` olarak ayrıldı (ayar, veritabanı, tarife, eşikler, ritim + görev işçisi + yoklama iş parçacıkları); `main()` onu çağırır, tek kapı da. Ayar yoksa ya da `local_token` boşsa HKM kurulmaz, tek kapı yine açılır (sunucu.py kural 1), `/api/hkm/` 503 verir. `--hkm-ayri` HKM'yi sürece almaz.
- Tek kapı sürecinde (yalnız orada) `sunucu.hkm_ayakta/hkm_eski/hkm_ac/hkm_yeniden` aynı süreci gösterir: `/api/durum` `hkm:true`, `POST /api/hkm` ve `/api/merkez/ac` 4200'de ikinci bir HKM açmaz; `gun_cumlesi` aynı kapının `/api/hkm/king/cumle`'sine, çekirdeğin jetonuyla gider. `sunucu.GIRIS_PORT` tek kapının portuna eşitlenir (Origin denetimleri o kapıya bakar; devrede 4180).
- Dist'in ayrı betiği/stili (`/dist-betik.js?v=…`, `/dist-stil.css?v=…`) sayfada mutlak adrestir; üç modül aynı adı kullanır. Tek kapı sürümden (`v`) sahibini bulur; hiçbir modülün sürümü değilse 404. Dist içindeki öteki adresler göreli (`img/seviye/…`, `sw.js`), `/ays/` altında doğal çözülür.
- Bilinmeyen yol 404 (Giriş her bilinmeyen yola giriş sayfasını veriyordu). Kökte `HEAD` 405 (Giriş'te `HEAD` çalışma klasöründen dosya veriyordu).
- Tailscale vekil işareti (`uzak.vekilden_mi` → `VEKIL_IP`) tek kapıda da yapılır: P6'da `serve` bu kapıya gelecek; Giriş'te yoktu çünkü serve 4180'e gelmiyordu.
- Deneme kipi (`ETKIN = False`): yalnız `--port` ile açılır; zamanlayıcı ve bekçi başlamaz (eski sunucu zaten çalıştırıyor), `POST /api/guncelle` ve `/api/yeniden` 403 (deneme kapısı çalışan sistemi güncellemez, yeniden başlatmaz). Ev ağı kapıları açılmaz (karar 8).

## Yollar tablosu
| Yol | Bugün | Tek kapıda | İşleyici |
|---|---|---|---|
| `/`, `/index.html`, `/kartlar/` | 4180 | aynı (çerezle `/` → `/gun/` 302) | `Giris.do_GET` |
| `/gun`, `/gun/`, `/gun/ortak/<ad>` | 4180 | aynı | `Giris` + `gun.gun_html` |
| `/hesap.js` … `/piksel-yazi.css` (14 sabit dosya), `/logo/<s>.png`, `/marka/<ad>` | 4180 | aynı | `Giris` |
| `/ays/…`, `/spi/…`, `/esp/…` (`/ays` → 301 `/ays/`) | 4173/4183/4193 `/…` | önek atılır | modül `Sunucu` (dist, src yedeği, `/dist/…`, `img/…`) |
| `/dist-betik.js?v=`, `/dist-stil.css?v=` | her modül kapısı | sürümün sahibi modül | modül `Sunucu` |
| `/img/seviye/…`, `/img/marka/…` | modül kapıları | kökte de | modül `Sunucu` (KOK'tan, modülden bağımsız) |
| `/api/hesap/…` (70 yol + takvim `.ics`), `/api/ayar`, `/api/ice…`, `/api/muzik…`, `/api/zemin/…`, `/api/planlama…` | hepsi | aynı | `hesap.isle`, `ayar.isle`, … (Giris üzerinden) |
| `/api/gun/cumle` | 4180 → HKM 4200 | aynı süreçteki HKM'ye | `Giris` + `gun_cumlesi(adres, jeton)` |
| `/api/guncelleme`, `/api/durum` | 4180 | aynı (`hkm` = aynı süreç) | `Giris` |
| `POST /api/guncelle`, `/api/yeniden` | 4180 | deneme kipinde 403; devrede aynı | `Giris` |
| `POST /api/hkm`, `/api/hkm/yeniden` (`X-LifeOS: guncelle`) | 4180 | aynı izin; HKM aynı süreçteyse açma/yeniden başlatma yok, `ok` | `Giris` |
| `POST /api/merkez/ac`, `/api/uzak/merkez` | modül kapıları | kökte | modül `Sunucu.do_POST` |
| `/api/hkm/<yol>` | 4200 `/api/<yol>` | aynı süreç; HKM yoksa 503 | `HKM/daemon.Handler` |
| `/kabuk/…`, `/motor/*.js`, `/alan/**/*.json` | — | yeni kabuk, kapalı liste (2026-11-13; ayrıntı `faz2-kabuk.md`) | `kabuk_dosyasi` + `_kabuk_sun` |
| başka her yol | 4180'de giriş sayfası | 404 | — |

## Dokunulan mevcut dosyalar
- `HKM/daemon.py`: `main()`'in kurulum gövdesi `hazirla(srv, cfg, config_path=None)` fonksiyonuna taşındı; `main()` onu çağırır. Tek fark: izin daraltma `CONFIG_PATH` yerine `srv.config_path`'e bakar (main'de aynı değer). Davranış aynı.
- `sistem/sunucu.py`: `gun_cumlesi(govde, adres=None, jeton=None)` — iki isteğe bağlı parametre; verilmezse eskisi gibi `HKM/config.json` + 4200.
- Başka mevcut dosyaya dokunulmadı (brand/, AYS/, SPI/, ESP/, motor/, alan/, kalite/, kabuk/ yok).

## Bellek ölçümü
Komut: `python tools/tekkapi_test.py --bellek` (2026-11-13). Her tur yeni geçici veri klasörü ve boş yüksek portlar; süreç açıldıktan (cevap verdikten) 15 sn sonra, hiç istek yokken Windows çalışma kümesi (`tasklist` «Mem Usage»). Eski topoloji = `sunucu.py` (giriş + 3 modül kapısı, dist ısıtması dahil) + `HKM/daemon.py`; ikisinde de zamanlayıcı ve bekçi kapalı (tek kapı deneme kipinde de kapalı, eşit koşul). Ölçüm öncesi boş bellek 1318–1409 MB.

| Tur | Eski (sunucu + HKM) | Tek kapı |
|---|---|---|
| 1 | 54,4 + 42,6 = 97,0 MB | 65,6 MB |
| 2 | 55,2 + 42,7 = 97,9 MB | 65,5 MB |
| 3 | 55,2 + 42,5 = 97,7 MB | 65,7 MB |
| **Ortanca** | **97,7 MB** | **65,6 MB** (−32,1 MB, −%33) |

Kesinlik: **ölçüldü** (n=3, makinede). Sınırlar: çalışma kümesi (özel bayt değil); boşta, sayfa açılmadan; sahibin gerçek verisi ve ev ağı kapıları yokken. HKM'yi aynı sürece almak bellek açısından uygun: ikinci yorumlayıcının ~42 MB'ı yerine tek süreç ~11 MB büyüyor. Plan hedefi (boşta bugünden düşük) tutuyor.

## Testler
- `python tools/tekkapi_test.py` → **74/74 yeşil** (2026-11-13). Eski topolojiyi (sunucu.py, zamanlayıcı/bekçi kapalı + HKM daemon) ve tek kapıyı geçici veriyle (LOCALAPPDATA/APPDATA, hesap/ayar/ice/müzik/plan/zemin/telefon/kabuk klasörleri ve HKM config+db geçici) boş yüksek portlarda açar, aynı isteği ikisine sorar; kod, Content-Type, Cache-Control/Pragma/Expires, ACAO ve gövde karşılaştırılır. Kapsam: kök sayfalar ve 4180 sabit dosyaları, `/gun/`, `/api/ayar|guncelleme|planlama|zemin|muzik|ice`, çerezle 302, üç modülün dist sayfası + bölünmüş betik/stil (sürümle), `sw.js`, `img/seviye`, önek altında hesap, 301'ler, `..` kaçışı; hesap durumu, yabancı köken 403, telefon uygulaması kökeninin OPTIONS'ı, aynı köken, Tailscale vekil işareti; `/api/gun/cumle`, `/api/hkm`, `/api/merkez/ac`, `/api/uzak/merkez` izinsiz 403; deneme kapısında güncelle/yeniden 403; HKM health/memory/settings/king durumu jetonlu ve jetonsuz aynı kod, HKM CORS ön isteği; `/api/durum` Merkez aynı süreçte; bilinmeyen yollar 404, `/kabuk/` ayrılmış, kökte HEAD dosya vermez, `--port`'suz açılmaz.
- Eski olanın bozulmadığı: `cd HKM && python -m tests.run` → 1093/1093; `node tools/giris_sayfa_test.js` → temiz; `python tools/dist_sun_test.py` → temiz.
- Sınanmadı: akan cevap (`/api/chat/akis`, aynı soket üzerinden devredilir, kuramsal olarak çalışır), gerçek tarayıcıda modül açılışı (kabuk/ yok, modüllerin istemcileri hâlâ porttan adres kuruyor), modül `smoke.js`/`portmuhafiz.test.js`/`entegre.js`'in yeni yolla koşusu (P6/kabuk ile).

## Devreye alma (P6 ile)
Kokenler değişir (`127.0.0.1:4173` → `127.0.0.1:4180/ays/`): tarayıcı deposu köken başınadır, eski veri yeni yolda görünmez. Bu yüzden tek kapı eski kapıların yerini **almaz**; her cihaz göç paketini yollayıp bekleyen değişiklik sıfırlanınca (P6):
1. `sistem/tekkapi.py`'de `ETKIN = True` (o zaman `--port`'suz 4180'de açılır ve zamanlayıcıyı başlatır); `sistem/baslat.py` `sunucu.py` yerine `tekkapi.py`'yi başlatır, HKM'yi ayrıca başlatmaz (`--hkmsiz` yolu gibi).
2. Aynı anda 4180'de yalnız biri çalışabilir: eski `sunucu.py` ve HKM daemon'u kapanır (4173/4183/4193/4200 ve ev ağı 51xx kapanır, karar 8).
3. `uzak.KAPILAR` (Tailscale serve: 5173/5183/5193→modüller, 443→4200) tek hedefe, 4180'e iner.
4. İstemciler: `brand/ortak/kabuk.js adres()`, `gun.py` `MPORT`, modüllerin HKM taban adresi (4200) port yerine yol kurmalı (`/ays/`, `/api/hkm/`); bu kabuk/ işinin parçası. **Adresler yapıldı (2026-11-13):** `kabuk.js adres()` modül `/ays/…` yolunda açılmışsa ötekileri aynı kökenin yolundan verir (Merkez yok), `girisAdres()` kökü verir; Gün sayfası `TEK` bayrağıyla (`sunucu.TEK_KAPI`, `tekkapi.kur()` açar) modülleri yoldan açar. Eski kapılarda davranış aynı. Ölçüldü: gerçek tarayıcıda tek kapıdan üç modül hatasız açıldı ve dördü de doğru adresi kurdu; modül takımları 3478 / 3269 / 2962, `tekkapi_test` 106/106, HKM 1093/1093. Kalan: modüllerin HKM taban adresi (4200 → `/api/hkm/`) ve HKM jetonu (açık soru 1); HKM'siz açılışta modüller çalışır, King ve eşitleme bağlanmaz.
5. Deneme: `python sistem/tekkapi.py --port 4380` (boş bir port) ile bugün de açılabilir; çalışan sistemi güncellemez, yeniden başlatmaz, zamanlamaz.

## Açık sorular
1. HKM jetonu: HKM `LIFEOS_PORTS = (4173, 4183, 4193, 4200)` kokenlerine eşleme penceresiz jeton veriyor; tek kapının kökeni (4180) listede yok. Kabuk jetonu nasıl alacak (aynı süreçte olduğu için sayfaya gömmek mi, listeye 4180 mi)? Karar P6/kabuk.
2. `/api/hkm` ve `/api/hkm/yeniden` (4180'in «HKM'yi aç/yeniden başlat» uçları) `/api/hkm/` önekiyle çakışıyor; şimdilik bu iki tam yol eski anlamında (HKM aynı süreçteyse ok döner, bir şey açmaz). HKM'nin kendi `/api/yeniden`'i yok, kayıp yok. P6'da bu iki uç silinebilir.
3. HKM'nin `/`, `/atolye` sayfası, `/brand/...` ve kendi `/img/...` yolları bağlanmadı (arayüz kalktı kararı); gerekirse `/api/hkm/` dışında bir önek gerekir.
4. HKM kodu güncellenince tek kapıda «yalnız HKM'yi yeniden başlat» yok; bütün süreç yeniden başlar (planlama işi «hkm» tek kapıda no-op).
5. `--hkm-ayri` kipinde `/api/hkm/` 503 verir (vekil yazılmadı, bellek ölçümü HKM'yi aynı süreçte almayı destekledi). HKM ayrı kalmak zorunda kalırsa küçük bir vekil gerekir.
6. Bilinmeyen yollar artık 404; eski 4180 her yola giriş sayfası veriyordu. Bu davranışa bağlı bir bağlantı (ör. `/favicon.ico`, eski yer imleri) varsa P6'da görülür.
