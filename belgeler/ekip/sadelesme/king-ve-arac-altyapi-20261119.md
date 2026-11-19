# King/HKM ve Geliştirme Araçları Altyapı Turu (2026-11-19)

**Dal:** `ag/king-ve-arac-altyapi-20261119` (taban: `755d8c50`)
**Bağımsız inceleme:** İki ayrı `code-reviewer` (`Model: 'pro'`) alt ajanı — King/HKM (`cb545ec5`, **TEMİZ**) ve Araçlar/CI (`adcf0dc8`, **TEMİZ**)

---

## 1. Neyi Neden Seçtik?

1. **King ve HKM çekirdeğinde gizli yavaşlık ve çökme açıkları:**
   - `king/arama.py` içinde `mcp_notlari()` her ilk çağrıda `spec_from_file_location("king_mcp", ...)` ile `king/mcp.py` modülünü ikinci kez yüklüyordu; ayrıca sıcak `_ALAN_INDEKS` varken bile `alan_kaynaklari()` 23 dosya (~2,5 MB+ metin) içindeki her parçayı tek tek tarıyordu.
   - `HKM/core/depo.py` içinde önceki incelemede yakalanan non-dict JSON (`[]`, `123`, `null`, `Infinity`) çökmesi (`AttributeError` / `OverflowError`) ile `tarayici()` içinde limit ötesi ve çift `govde` ayrıştırması duruyordu.
   - `HKM/core/ses.py` `_ema_kapat()` alt süreci öldürürken boruları kapatmıyor, `wait()` ve kuyruk okuyucu iş parçacığı temizliğini yapmıyordu; ayrıca `akis()` boş ilk parça geldiğinde kilidi yedek motora geçerken serbest bırakmıyordu.
2. **Ekibin ve ajanların işini hızlandıracak, profesyonelleştirecek araç altyapısı (`tools/`):**
   - `tools/ci_yerel.py` yalnız tüm 51 adımı ya da elle `-k` süzgecini koşabiliyordu; iç döngülerde `--hizli` (tarayıcısız `46/51`) ve `--degisen [TABAN]` (değişen dosyalardan etkilenen adımları güvenli geri düşüşle seçen akıllı koşucu) eklendi.
   - Görsel değişikliklerde her seferinde tek kullanımlık Playwright betiği yazmak yerine yeniden kullanılabilir `tools/pano_cek.js` eklendi (`cek`: yalıtılmış tek kapıda PNG + yatay taşma / 40 px dokunma / konsol hatası `denetim.json`; `birlestir`: yan yana `ÖNCE | SONRA` PNG panosu).

---

## 2. Yapılan Değişiklikler

### King ve HKM
- [`king/arama.py`](../../../king/arama.py):
  - Kilitli `_mcp_mod()` eklendi: `__main__`, `mcp`, `king.mcp` yolunu denetleyerek tek kanonik modülü döner; `sys.modules["mcp"]` yabancı bir modülle gölgelenmişse bile yanlış modüle düşmeden doğrudan gerçek `king/mcp.py` yolunu yükler.
  - `_alan_ozet()` içinde dosya başına birleştirilmiş `tum_kucuk` ön-süzgeci eklendi; `alan_kaynaklari()` dosya eşik denetiminden geçmeyen dosyaları C hızında atlar, `os.path.normcase(os.path.abspath(...))` ve `mtime_ns` sırasıyla önbelleği korur.
  - Testler ([`king/arama_test.py`](../../../king/arama_test.py)): `test_mcp_tek_modul`, `test_alan_on_suzgec_esik` (1–5 terim, yinelenen terim, parça sınırı, Türkçe küçültme `İŞĞÜÖÇ`, Windows `normcase`).
- [`HKM/core/depo.py`](../../../HKM/core/depo.py):
  - `_json(x, bos)` dict beklendiğinde non-dict JSON'u güvenli biçimde `bos` değerine çevirir; ortak `_dayanak_id()` yardımcısı `bool`, `float` (`Infinity` dahil) ve listeleri eler.
  - `tarayici()`, `_tazelik()`, `kayit_depo()`, `eslesen()`, `taze_mi()`, `kullanilmayan()` non-dict JSON ve non-dict `kaynaklar` öğelerine karşı sertleştirildi; `tarayici()` non-`arastirma` satırlarında `govde`'yi tek kez ayrıştırır, `toplam` ve `sayim`'ı bozmadan `limit` sonrası `arastirma` gövde ayrıştırmasını atlar.
  - TDD testleri ([`HKM/tests/test_depo.py`](../../../HKM/tests/test_depo.py)): `t_bozuk_json_koruma`, `t_tarayici_tek_cozum`.
- [`HKM/core/ses.py`](../../../HKM/core/ses.py):
  - `_EMA_KILIT` `threading.RLock()` yapıldı; `_ema_kapat(engelsiz=False)` atomik durum sıfırlama + `kill -> wait(2) -> join(1) -> stdin.close() -> (t canlı değilse stdout.close())` sırası ve `atexit.register(_ema_kapat, True)` ile kapatmada kilit blokajını önler.
  - `ema_bul()` ve `_ema_nobet(hedef_p)` kilitsiz çift/üçlü `_EMA` okumalarından temizlendi; `akis()` boş ilk parçada `g.close()` ile `_EMA_KILIT` sızıntısını önler.
  - TDD testi ([`HKM/tests/test_ses.py`](../../../HKM/tests/test_ses.py)): `t_ema_kapat_temiz`.

### Araçlar (`tools/`) ve CI
- [`tools/ci_yerel.py`](../../../tools/ci_yerel.py): `--hizli` ve `--degisen [TABAN]` eklendi; `.github/`, ortak CI dosyaları ve bilinmeyen kök yollarda ya da `git` hatasında güvenli geri düşüşle tüm adımları koşar, bilinen modül ve `tools/` dosyalarında çapraz bağımlılıkları seçer, `--selftest` tüm senaryoları doğrular.
- [`tools/pano_cek.js`](../../../tools/pano_cek.js) ve [`tools/pano_cek.test.js`](../../../tools/pano_cek.test.js):
  - `cek` ve `birlestir` alt komutları; Playwright yalnız çalışma anında tembel yüklenir (`playwrightsiz.test.js` uyumlu, 7 birim testi yeşil).
  - Tüm `LIFEOS_*_KLASOR`, `HOME`, `LOCALAPPDATA`, `APPDATA`, `LIFEOS_DIR` geçici dizinde yalıtılır; mobilde `hasTouch: true` ve gerçek Kabuk etkileşimli seçicileri kullanılır; `#sayfa[data-ciz]` + `[aria-busy="true"]` bitişi beklenir.
- [`tools/DIZIN.md`](../../../tools/DIZIN.md) ve [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml): Dizin kayıtları ve `Görsel pano aracı (Playwright'sız birim testi)` CI adımı eklendi (`51` adım).

---

## 3. Önce / Sonra Ölçümleri

Aynı makinede (`C:\Users\ASUS\LifeOs-ag`) `origin/main` tabanı ve son düzeltmeler sonrasında ölçülen gerçek değerler (1 ısınma + 30 koşu):

| Ölçüm | Önce (taban) | Sonra (son hâl) | Fark |
|---|---|---|---|
| `arama.alan_kaynaklari` (2 terim: `sokrates`, `bilgi`) | median `14,622 ms` (ort. `15,161 ms`, `2` kaynak) | median `7,833 ms` (ort. `7,904 ms`, `2` kaynak) | **1,87×** hızlı, birebir aynı sonuç |
| `arama.alan_kaynaklari` (5 terim: `sokrates`…`felsefe`) | median `20,729 ms` (ort. `21,680 ms`, `2` kaynak) | median `12,038 ms` (ort. `12,080 ms`, `2` kaynak) | **1,72×** hızlı, birebir aynı sonuç |
| `depo.tarayici` (`limit=50`, `400` BAM kaydı) | median `4,324 ms` (ort. `4,395 ms`), `600` `json.loads` | median `2,388 ms` (ort. `2,438 ms`), `200` `json.loads` | **1,81×** hızlı, **3,00×** az ayrıştırma |
| `ci_yerel.py --hizli` adım sayısı | `51` adım | `46` adım (`5` `[tarayıcı]` hariç) | Hızlı iç döngü hazır |
| `pano_cek.js cek` (`bugun`, `1280x800:koyu`, uçtan uca) | Tek kullanımlık betikler yazma gereksinimi | `1401 ms` (sunucu + çekim + temizlik) | Yeniden kullanılabilir standart araç |

---

## 4. Kullanım Örnekleri

```bash
# Yalnız değişen dosyalardan etkilenen adımları gör / koş (tarayıcısız hızlı döngü)
python tools/ci_yerel.py --degisen origin/main --hizli --liste
python tools/ci_yerel.py --hizli

# Görsel denetim + ekran görüntüsü (önce / sonra klasörleri ve pano birleştirme)
node tools/pano_cek.js cek --yer=bugun,ayarlar,alan/felsefe --boy=1280x800:koyu,390x844:acik --cikti=gecici-once
node tools/pano_cek.js cek --yer=bugun,ayarlar,alan/felsefe --boy=1280x800:koyu,390x844:acik --cikti=gecici-sonra
node tools/pano_cek.js birlestir --once=gecici-once --sonra=gecici-sonra --cikti=gecici-pano --baslik="Kabuk Önce / Sonra"
```

---

## 5. Bağımsız İnceleme ve Doğrulama

- **`cb545ec5` (`King & HKM Infra Reviewer`, `Model: 'pro'`):** İlk turda `king/arama.py` yabancı `mcp` gölgelemesi / `normcase`, `HKM/core/depo.py` `float`/`Infinity` `dayanak` + kaynak sayımı, `HKM/core/ses.py` `RLock` / `akis` boş parça / `ema_bul` tekil okuma ve ikinci turda `_ema_nobet` + `atexit(engelsiz=True)` bulgularını yakaladı; tümü TDD testleriyle giderilip **TEMİZ** onaylandı (`git show` komutları oturumda araç kısıtı nedeniyle «göremedim» olarak not edildi).
- **`adcf0dc8` (`Tools & CI Infra Reviewer`, `Model: 'pro'`):** İlk turda `pano_cek.js` `#govde` yerine `#sayfa[data-ciz]`, tam `LIFEOS_*_KLASOR` ortam yalıtımı, `hasTouch` / Kabuk dokunma seçicileri, boşluklu bayraklar ve `ci_yerel.py` çapraz bağımlılık / `HEAD` yedek hatası / `--selftest` bulgularını yakaladı; tümü giderilip **TEMİZ** onaylandı.
- Birim/kabul testleri: `HKM python -m tests.run` (`1081/1081`), `king/arama_test.py` (`16/16`), `tools/pano_cek.test.js` (`7/7`), `tools/ci_yerel.py --selftest` (`51 adım`), `tools/tools_dizin_kabul_test.py`, `tools/belge_dizin_kabul_test.py`, `kalite/olcum.py --denetle`.
- Tam yerel CI (`python tools/ci_yerel.py --sira`): **51/51 yeşil, 292 sn** (`755d8c50` üstüne rebase sonrası tam koşum).
