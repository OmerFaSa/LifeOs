# Gece Altyapı İyileştirme Raporu (2026-11-19)

- **Dal:** `ag/gece-altyapi-20261119` (`origin/main` `16e94892` tabanından)
- **Kapsam:** Başbuğ/King yapay zekâ köprüsü ve MCP (Faz 1), ağ/HTTP ve kabuk çizim altyapısı (Faz 2), öğrenme ve karar motorları (Faz 3), tek depo, istemci eşitlemesi ve eşzamanlı dosya yazma güvenliği (Faz 4), salt-okunur denetim ve bütçe/CI doğrulaması (Faz 5).
- **Dokunulmayan alanlar:** `brand/ortak/`, `sistem/hesap.py`, `HKM/daemon.py`, `HKM/core/{king,ollama,ses,aktif}.py`, veritabanı şemaları (`HKM/core/db.py`, `sistem/goc.py` `SEMA`), çalışan kopya ve kullanıcı verileri.

## 1. Yapılan İyileştirmeler

### Faz 0 — Çalışma Zemini ve Windows CI Uyumluluğu (`d505a929`)
- İş ağacı yerel ayarında (`core.autocrlf=false`) satır sonları LF'e sabitlendi ve bayt/satır taban ölçümleri alındı.
- `tools/ci_yerel.py` (`_bash()`): Windows üzerinde Git Bash yolu (`PATH`, `Program Files\Git`, `LocalApplicationData\Programs\Git`) otomatik bulunacak biçimde güncellendi; varsayılan PowerShell oturumunda 50 adımın tamamı dış kabuğa bağımlı olmadan çalışır duruma getirildi (`--selftest` 50 adım yeşil).

### Faz 1 — Başbuğ / King Altyapısı (`a31c8b8a`)
- `HKM/core/kopru.py` (`_HAL_KILIT`, `_KONUSMA_KILIT`, `_dokum_oku`, `_AG_BEKLE`, `gecmis_butcele()`, `_claude()`): hal/konuşma yazımlarında kilitleme ve atomik değiştirme, dosya başı-sonu artımlı döküm okuma, ağ hatalarında sınırlı yeniden deneme, `O(N)` geçmiş bütçelemesi ve işbirlikçi `iptal` sinyali eklendi (`test_kopru` 19/19, HKM tüm paket `1075/1075`).
- `king/arama.py`: alan indeksinde `(mtime_ns, size)` önbelleği, tek geçişte `"dogrulanmamis"` denetimi (`_alan_ozet()`), `_uyar_kucuk`, önbellekli `_MCP_MOD` ve `ONBELLEK_SINIR = 128` sınırlaması eklendi (`arama_test` 13 test yeşil).
- `king/baglam.py`: `_en_uzun_liste_bilgi()` ile tek geçişli `O(N)` `kirp()` algoritması ve `derle()` içinde tek SQLite anlık kopyası (`with mcp.oturum_anlik():`) eklendi (`baglam_test` yeşil).
- `king/kopru.js` ve `king/mcp.py`: `--surekli` kalıcı NDJSON Node işçisi (`mtimeMs` önbellek geçersizleştirme, 30 sn zaman aşımı, `atexit` kapatma ve tek-seferlik yedek yol), `t_yol()` için `ders` indeksli `(mtime_ns, size)` önbelleği, `oturum_anlik()` bağlam yöneticisi ve `t_kayit_ara()` tek dosya açılışı eklendi (`mcp_test` yeşil).
- `kabuk/king-sohbet.js` ve `kabuk/kabuk.css`: kaçışlı kod blokları (`<pre class="king-md-kod"><code>`), daraltılmış `MutationObserver` (`{ childList: true }`), `gonder()` içinde `AbortController` 200 sn zaman aşımı ve 390 px mobil taşma koruması eklendi (`king-sohbet.test.js` 10/10).

### Faz 2 — Ağ, HTTP/1.1 Keep-Alive ve Kabuk Çizim Altyapısı (`4f22b037`)
- `sistem/sunucu.py` (`kabuk_paketi()`, `_STIL_ETIKET`, `Giris._kabuk_sun()`, `Giris._json()`): yerel `/kabuk/*.css` dosyaları `/kabuk/paket.css` altında tek istek, ETag, `Last-Modified`, 304 ve gzip ile birleştirildi; `../brand/ortak/piksel-yazi.css` göreli yazı tipi yolları bozulmasın diye ayrı bırakıldı. Okunmamış gövdeli `POST >= 400` yanıtlarına `Connection: close` eklendi.
- `sistem/tekkapi.py` (`TekKapi`, `_devret()`, `end_headers()`): `HTTP/1.1` Keep-Alive (`timeout = 15`, `disable_nagle_algorithm = True`) etkinleştirildi; gövdeyi okumadan 4xx/5xx dönebilen devredilmiş olmayan `POST`/`DELETE` yanıtları ve `_devret()` altındaki `POST`/diğer istekler soket kaymasını önlemek için `Connection: close` ile kapatıldı (`tekkapi_test.py` 185/185, `kuyruk_test.py` temiz).
- `kabuk/kabuk.js`: `sahneBoyut()` ile `manzara()` ve `sahneleriHazirla()` piksel/önbellek anahtarı birleştirildi; `getBoundingClientRect()` DOM değiştiren `amblemKoy()` öncesine alınarak zoraki reflow kaldırıldı; `sahneOnbellek` 24 tuval ile sınırlandı (`sahneSakla()`); `sozEk()` başlangıçta kapalı `<details data-soz-ek>` öğeleriyle hafif DOM üretip açıldığında capture `toggle` dinleyicisiyle (`sozEkIc()`) dolduruldu (`kabuk.test.js` 78/78, `kabuk_gez.js` ve `hareket_gez.js` yeşil).

### Faz 3 — Öğrenme ve Karar Motorları (`148a488a`)
- `motor/kayit.js`: `_gunKova()` ve `_gunlukKovadan()` ile `gunluk()`, `haftalik()`, `guncelKilo()`, `taban()`, `toparlanma()`, `yukBilgisi()`, `ilkHareket()`, `akutKronik()` ve `haftalikBuyume()` tek geçişli taramaya dönüştürüldü (`kayit.test.js` 33/33).
- `motor/not.js`: ASCII `katla()` hızlı yolu, `#` içermeyen gövdelerde `govdeEtiketleri()` kısa yolu, `kingOkur()` içinde tek `_kapali` hesabı ve boş `ozellik` kestirmesi, `ara()` içinde `parca()` özetinin sıralama sonrası yalnız ilk `sinir` sonuca ertelenmesi ve `klasorler()` içinde `O(not * 3)` önek sayımı uygulandı (`not.test.js` 31/31).
- `motor/yol.js` ve `motor/tekrar.js`: `Yol.durum()` içinde önkoşul sonuçları önbelleklendi ve `gectiA` yeniden hesaplanmadı (`yol.test.js` 25/25); `Tekrar.plan()` içinde Schwartzian sıralaması (`yeni`/`tekrar` `Infinity` eşitlik korumalı) eklendi (`tekrar.test.js` 22/22).
- `kabuk/araclar.js`: `notSatiri()` / `notOzet()` ve `sayfaKayit` içinde yinelenen `Not.ad(n)` ile `kayitMetni(Kayit, r)` çağrıları tekilleştirildi.

### Faz 4 — Tek Depo, İstemci Eşitleme ve Dosya Yazma Güvenliği (`87d8384e`)
- `sistem/veri.py` (veritabanı şemasına dokunulmadan): yeniden girilebilir `Depo.islem()` bağlam yöneticisi, `yaz()` / `degistir()` / `sil()` iç içe işlem uyumu, `_kaydet()` içinde `cur.lastrowid` (`_son_sira`), `Kopru.__call__()`, `kabuk_yaz()` ve `esle()` toplu işlemlerinin tek SQLite işlemine alınması ve `karsilastir()` içinde çift `depo.oku()` çağrısının teke indirilmesi sağlandı (`tekdepo_test.py` yeşil).
- `kabuk/depo.js`: geçici ağ/`429`/`5xx` hatalarında üssel geri çekilme (`yenidenTaban = 2000 ms`, `yenidenTavan = 60000 ms`, `400/401/403/404` için yeniden deneme yok), `visibilitychange` (`hidden`) ve `pagehide` anında bekleyen yazıların hemen gönderilmesi, `BroadcastChannel` kurucu koruması ve `dinle` bildirimi eklendi (`depo.test.js` 22/22, `kabuk_esit_gez.js` yeşil).
- `sistem/ayar.py`, `sistem/planlama.py`, `sistem/ice.py`, `sistem/muzik.py`, `sistem/sunucu.py`: modül içi kilitleme (`_kilit` / `_YAZ_KILIT` / `_KILIT`), PID + iş parçacığı kimlikli benzersiz geçici dosya (`os.replace` + hata durumunda temizlik) ve `rfile.read()` öncesi kesin `Content-Length` 413 + `close_connection = True` sınırı eklendi.

## 2. Önce / Sonra Ölçümleri

Karşılaştırma tabanı (`baseline.txt`, `d505a929` LF tabanı) ve final (`after.txt`, `87d8384e`) koşuları aynı makinede çalıştırıldı. Ölçülmeyen alanlar için tahmin yürütülmemiştir (`veri yok`).

### Karmaşıklık Bütçeleri (`kalite/olcum.py`)

| Ölçüt | Önce (LF Taban) | Sonra | Hedef / Durum |
|---|---|---|---|
| `Sistem · Optimizasyon` / `Kabuk açılış yükü` | `928852 bayt` | `938301 bayt` | `≤ 1000000` (ölçüldü) |
| `En büyük alan paketi` | `2481429 bayt` | `2481429 bayt` | `≤ 2500000` (ölçüldü) |
| Bütçe aşımı (`olcum.py --denetle`) | `0` (`28 bütçe, aşım yok`) | `0` (`28 bütçe, aşım yok`) | yeşil |
| Katman denetimi (`katman.py`) | `0 istisna, yeni bozulma yok` | `0 istisna, yeni bozulma yok` | yeşil |

### Kabuk Açılış Hızı (`kalite/hiz_olcum.js`, 3 tekrar medyanı)

| Ölçüt | Önce (CPU 1×) | Sonra (CPU 1×) | Önce (CPU 4×, 40 ms) | Sonra (CPU 4×, 40 ms) |
|---|---|---|---|---|
| İstek sayısı | `18` | `15` | `18` | `15` |
| Aktarılan (soğuk / sıcak) | `464.3 KB` / `5.4 KB` | `462.0 KB` / `4.5 KB` | `464.3 KB` / `5.4 KB` | `462.0 KB` / `4.5 KB` |
| DOM düğümü (soğuk / sıcak) | `2129` / `4250` | `1437` / `2866` | `2086` / `4176` | `1394` / `2787` |
| İlk boyama FP (soğuk) | `76 ms` | `64 ms` | `212 ms` | `212 ms` |
| İlk anlamlı çizim FCP (soğuk) | `216 ms` | `200 ms` | `876 ms` | `864 ms` |
| En büyük çizim LCP (soğuk / sıcak) | `236 ms` / `104 ms` | `216 ms` / `88 ms` | `976 ms` / `260 ms` | `980 ms` / `252 ms` |
| Uzun görev (soğuk, CPU 1×) | `0` (`0 ms`) | `0` (`0 ms`) | `2` (`158 ms`) | `3` (`246 ms`) |

### King / Başbuğ ve Motor Mikro-Ölçümleri

| Ölçüm | Önce | Sonra | Hızlanma |
|---|---|---|---|
| `arama.alan_kaynaklari (5 sorgu)` | `604.18 ms` | `123.99 ms` | `4.9×` |
| `mcp.t_yol (akademik.1.1.1 x10)` | `201.12 ms` | `26.07 ms` | `7.7×` |
| `baglam.kirp (500 oge -> 1500 tok)` | `156.41 ms` | `2.83 ms` | `55.3×` |
| `baglam.derle (yonet)` | `72.45 ms` | `60.08 ms` | `1.2×` |
| `baglam.derle (ogren)` | `127.90 ms` | `13.69 ms` | `9.3×` |
| `Kayit.gunluk x50` (3926 kayıt) | `24.32 ms` | `3.07 ms` | `7.9×` |
| `Kayit.haftalik x50` | `160.16 ms` | `8.36 ms` | `19.2×` |
| `Kayit.Kural.toparlanma x50` | `87.39 ms` | `10.61 ms` | `8.2×` |
| `Kayit.Kural.akutKronik x50` | `48.45 ms` | `4.12 ms` | `11.8×` |
| `Kayit.Kural.haftalikBuyume x50` | `27.90 ms` | `2.22 ms` | `12.6×` |
| `Yol.durum (akademik.1) x20` | `9.69 ms` | `3.70 ms` | `2.6×` |
| `Tekrar.plan (1000 kart) x50` | `15.80 ms` | `15.53 ms` | `1.0×` |
| `Not.kingOkur (1000 not) x20` | `57.20 ms` | `30.01 ms` | `1.9×` |
| `Not.ara (okur, "felsefe") x20` | `164.63 ms` | `93.46 ms` | `1.8×` |
| `HKM/tools/perf.py` (tüm sorgular bütçede) | `0.0–95.9 ms` | `15.8–101.0 ms` | bütçe içi |
| Anlama / Arama / Hafıza canlı model eğrileri | `veri yok` | `veri yok` | bu turda koşulmadı |

## 3. Dokunulmayan Yüksek Etkili Modüllerin Salt-Okunur Denetim Bulguları

Bu bölümdeki dosyalar sözleşme gereği değiştirilmemiş, yalnız okunarak denetlenmiştir. Okunan aralıkların dışındaki satırlar için durum «göremedim» biçimindedir.

- `sistem/hesap.py:2637-2644` · `_govde(h)` fonksiyonunda `n = int(h.headers.get("Content-Length") or 0)` negatif sayı denetimi yapmıyor (`_merkez_ilet` `:2694`'teki `if n < 0:` koruması yok) · İstemci `Content-Length: -1` gönderdiğinde `n > GOVDE_EN_BUYUK` yanlış olur ve `h.rfile.read(-1)` bağlantı kapanana dek bloklanır · `/api/hesap/giris` handler'ına `Content-Length: -1` ile sahte istek gönderip `400` yerine okuma hatası/askıda kalma gözlenerek doğrulanır. (`sistem/hesap.py`'nin diğer akışları tam satır okunmadığından: «göremedim».)
- `HKM/core/aktif.py:214-235` · `icerik()` içinde `depo.tarayici(con, limit=200, ...)` sonrasında her eski kayıt için döngü içinde `bam.kayit_getir(con, k["id"])` ve `_acik_mi(con, ...)` çağrılarak N+1 SQLite sorgusu çalıştırılıyor · Bayat BAM kaydı sayısı yüksek (ör. 100–200 kayıt) veritabanlarında özet yanıtını gereksiz yavaşlatır · Test veritabanında 200 bayat `bam_kayitlar` satırıyla `set_trace_callback` altında sorgu sayısı sayılarak doğrulanır. (`HKM/core/aktif.py` 1-144 ve 241-389 arası: «göremedim».)
- `HKM/core/ses.py:411-418` · `_ema_kapat()` alt süreç üzerinde `p.kill()` çağırıp `p.stdin`/`p.stdout` borularını kapatmıyor ve `p.wait()` çağırmıyor · EMA ses işçisi sık yeniden başlatıldığında Windows'ta süreç tutamaçları GC'ye dek açık kalabilir · Sıcak EMA süreci art arda kapatılıp açılarak `ResourceWarning` / açık dosya tutamaç sayısı izlenerek doğrulanır. (`HKM/core/ses.py` 1-409, 496-634 ve 711-746 arası: «göremedim».)
- `HKM/core/ollama.py`, `HKM/core/king.py`, `brand/ortak/piksel-doga.js` · Okunan kesitlerde (`ollama.py:120-175, 275-360`, `king.py:180-255`, `piksel-doga.js:1155-1255`): `ollama._gomme_gonder`/`gomme` içinde `_gomme_hata[0]` kilitsiz güncelleniyor; okunan diğer kısımlarda kritik mantık hatası görülmedi, ancak tamamı satır satır okunmayan bölümler için: «göremedim».

## 4. Bağımsız Kod İncelemesi (`code-reviewer`) ve Son Doğrulama

Faz 0–5 değişikliklerinin tamamı (3557 satırlık yama ve kaynak dosyalar) bağımsız `code-reviewer` alt ajanı tarafından salt-okunur denetlendi; raporlanan 9 köşe-durum bulgusunun tamamı önce regresyon testi yazılıp ardından en küçük düzeltmeyle giderildi:

1. **YÜKSEK · `kabuk/depo.js` (`acildi` öncesi senkron silme yarışı):** `ac()` sırasında `acildi` çözülmeden `pagehide`/`visibilitychange` tetiklenince `kip === 'yerel'` okumasının IDB'deki anahtarı `null` sanıp silmesini önlemek için `hazir`/`hazirSoz` bekletmesi ve çift dinleyici koruması eklendi (`kabuk/depo.test.js`: 23 test geçti).
2. **ORTA · `sistem/tekkapi.py` (HTTP/1.1 Keep-Alive çerçeveleme güvenliği):** `_SayacRfile` ve `Content-Length` izlemesiyle gövdeyi tüketmeyen `< 400` `POST`/`DELETE` yanıtları (`302`, `202` vb.) da `Connection: close` ile kapatıldı; `Transfer-Encoding` istekleri `501 + Connection: close` ile reddedildi (`tools/tekkapi_test.py`: 187/187 yeşil).
3. **ORTA · `HKM/core/kopru.py` (`_dokum_oku` satır ayrımı):** `.splitlines()` yerine `.split("\n")` + `rstrip("\r")` kullanılarak JSON dizgileri içindeki ham `\u2028`/`\u2029` ayırıcılarının geçerli JSON satırını bölmesi önlendi (`HKM/tests/test_kopru.py`: 19 test, 0 hata).
4. **ORTA + DÜŞÜK · `sistem/veri.py` (`Depo.islem()` hata toparlama ve `kirp()` kilidi):** `commit()` istisnasında açık işlem kalmaması için `rollback()` koruması eklendi; `kirp()` `self._kilit` altına ve `yaz()`/`degistir()`/`sil()` `islem()` içine taşındı (`tools/tekdepo_test.py`: temiz).
5. **ORTA · `sistem/planlama.py` (`acilis_gorevi` sırasında `son`/`bekleyen` yarışı):** `zamanlayici.kilit` altında `yaz()` öncesinde güncel `son` ve `bekleyen` yeniden okunarak korundu (`tools/planlama_test.py`: temiz).
6. **DÜŞÜK · `sistem/ice.py` (`takvim_tazele` yazma yarışı):** Ağ çekimi sonrası `_KILIT` altında dosya yeniden okunup adres değişmediyse yalnız `takvim` güncellendi (`tools/ice_test.py`: temiz).
7. **DÜŞÜK · `king/kopru.js` (`harita()` önbellek anahtarı):** `require.resolve(path.resolve(g.harita))` ile uzantısız/farklı biçimli yollarda da önbellek tazeleme sağlandı (`king/mcp_test.py`: temiz · 0 kırmızı).
8. **DÜŞÜK · `king/arama.py` & `king/mcp.py` (önbellek eşzamanlılığı):** `_ALAN_INDEKS`, `ONBELLEK` (`_ONBELLEK_KILIT`) ve `_ALAN_ASAMA` (`_ALAN_ASAMA_KILIT`) iş parçacığı kilitleriyle korundu (`king/arama_test.py`: 14/14 OK; `king/mcp_test.py`: temiz · 0 kırmızı).

Son kalite kapıları (`kalite/olcum.py --denetle`, `tools/belge_dizin_kabul_test.py` ve `tools/ci_yerel.py --sira`) bu düzeltmelerin ardından çalıştırıldı; yasak yollara sıfır dokunuş ve LF satır sonu uyumu doğrulandı.
