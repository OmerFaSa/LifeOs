# Uzak motor planı — dil modeli başka bilgisayarda, LifeOS sunucusu bu bilgisayarda

> Bu belge iki okura yazıldı: **depo sahibine** (A: kurulum adımları) ve
> **bu işi devralacak ajanlara** (B: kod işleri). Doktrin `AGENTS.md`'dedir;
> bu plan onu değiştirmez.

## 0. Durum — bugün ne var, ne yok

Şema:

```
[Bilgisayar 1: LifeOS sunucusu]  ──http(s)──▶  [Bilgisayar 2: Ollama + model, RAM'de]
  HKM (veri, hafıza, senkron)                    yalnız işlem yapan motor
```

**Kodda zaten olanlar** (PR OmerFaSa/LifeOs#14 ile `main`'de):

- `HKM/core/models.py`:
  - `adres_denetle`: `http` yalnız aynı makinede ve yerel ağda (192.168.x, 10.x, `.local`, Tailscale 100.64/10) kabul edilir; internetteki bir adres `https` olmak zorundadır.
  - `yerel_kok`, `yerel_uclari`: motor adresi ayarlanabilir. Sohbet ucu `<adres>/v1/chat/completions`, model listesi `<adres>/v1/models` (OpenAI uyumlu).
  - «yerel» sağlayıcının anahtarı `Authorization: Bearer …` olarak gönderilir. Uzak motorun önüne jeton isteyen bir vekil koyulursa jeton buraya yazılır.
- `HKM/core/motor.py`:
  - `dugum_durumu`: sunucu motora ulaşılıp ulaşılamadığını, gecikmeyi ve modelleri bilir (`GET /api/ai/dugum`).
  - `merdiven`: hibritte motor kapalıysa ya da zorlanırsa iş buluta geçer. Yerel modda sistem kural motoruyla sürer.
- Panoda **Ayarlar → Nerede çalışsın** bölümü var: yer seçimi, motor adresi, yerel modeller ve «Yerel sunucuyu sına» düğmesi.

**Görülmeyenler ya da eksikler** (B'de iş olarak yazıldı):

1. Uzak motor için zaman aşımı ayrı değil. İşlemcide çalışan bir model ilk cevapta yavaş olabilir.
2. Panoda «yerel» sağlayıcı için jeton alanının görünüp görünmediğini göremedim; doğrulanmalı.
3. Soğuk başlangıç görünmüyor: model RAM'e yüklenirken geçen ilk çağrı «ulaşılamadı» ile karışabilir.
4. Gerçek iki makineyle deneme hiç yapılmadı. Denemeler sahte bir motorla, tek makinede yapıldı.
5. Windows güvenlik duvarı ve Ollama'nın yalnız `127.0.0.1`'i dinlemesi belgelenmedi.

## A. Depo sahibinin yapacakları (kod gerekmez)

### A1. Model bilgisayarı (Bilgisayar 2)

1. Ollama'yı kur: <https://ollama.com/download>.
2. Bir model indir. RAM'e göre seç:

   | RAM | Önerilen model |
   |---|---|
   | 8 GB | `ollama pull qwen2.5:3b` ya da `llama3.2:3b` |
   | 16 GB | `ollama pull qwen2.5:7b` ya da `llama3.1:8b` |
   | 32 GB+ | `ollama pull qwen2.5:14b` |

3. **Ollama'yı ağa aç.** Varsayılan olarak yalnız kendi makinesini dinler. Windows'ta:
   - Başlat → «Sistem ortam değişkenlerini düzenle» → Ortam Değişkenleri → Yeni:
     `OLLAMA_HOST` = `0.0.0.0:11434`
   - Ollama'yı görev çubuğundan kapatıp yeniden aç.
4. **Güvenlik duvarında 11434'ü yalnız yerel ağa aç.** PowerShell'i yönetici olarak açıp şunu çalıştır:
   ```powershell
   New-NetFirewallRule -DisplayName "Ollama LAN" -Direction Inbound -Protocol TCP -LocalPort 11434 -RemoteAddress LocalSubnet -Action Allow
   ```
5. IP adresini öğren: `ipconfig` → «IPv4 Address», ör. `192.168.1.20`.
6. Kendi içinde sına: `curl http://127.0.0.1:11434/v1/models`.

### A2. Bağlantının türünü seç

| Durum | Yol | Adres örneği |
|---|---|---|
| İki bilgisayar aynı evde, aynı modemde | Doğrudan yerel ağ | `http://192.168.1.20:11434` |
| Farklı yerlerde (ör. model evde, sunucu başka yerde) | **Tailscale (önerilen):** iki makineye kur, aynı hesapla gir. 11434'ü internete açma. | `http://100.x.y.z:11434` |
| Tailscale istemiyorsan | https veren bir vekil (Caddy vb.) + jeton | `https://motor.alanadin.com` |

11434 kapısını modemden internete **açma**. Ollama'da parola yoktur; açık bir kapı, modelini herkese açar.

### A3. Sunucu bilgisayarı (Bilgisayar 1)

1. Sunucu bilgisayarından model bilgisayarına ulaşılıyor mu, sına:
   `curl http://192.168.1.20:11434/v1/models`
   Model listesi dönmeli.
2. LifeOS'u başlat (`python baslat.py`), panoyu aç.
3. **Ayarlar → Nerede çalışsın:**
   - Yer: **Hibrit** (önerilen: model kapalıyken buluta geçer) ya da **Yerel** (bulut hiç kullanılmaz).
   - Motor adresi: `http://192.168.1.20:11434`.
   - Ekonomik/Standart için yerel model adı: ör. `qwen2.5:7b` (`ollama list`'te göründüğü gibi).
   - **Yerel sunucuyu sına** düğmesine bas. «Motor servisi cevap verdi» yazmalı.
4. Sohbette «merhaba» yaz. Cevabın altında sınıf ve `$0` görünmeli.
5. Model bilgisayarında Ollama'yı kapat ve tekrar yaz:
   - Hibritte cevap buluttan gelmeli.
   - Yerelde sistem kapanmamalı, kural motoruyla sürmeli.

## B. Ajan işleri (kod) — sırasıyla

Her iş şu kurallara uyar:

- Önce kırmızı test yazılır (`AGENTS.md` §2).
- `cd HKM && python3 -m tests.run && python3 tools/perf.py && node tools/yuz.js` ve depo kökünde `node tools/entegre.js` geçer.
- Yeni bağımlılık eklenmez; yalnız standart kütüphane kullanılır (§1.3).

### B1. Uzak motor zaman aşımı
- **Nerede:** `core/ai.py` `_cagir` ve `core/models.py` `probe`.
- **Ne:** `adres_denetle` sınıfı `yerel_ag` ya da `internet` ise sohbet çağrısında daha uzun bir süre kullanılsın, ör. 120 sn. Sınama süresi 5 sn olarak kalsın.
- **Test:** sahte transport ile sınıfa göre verilen `timeout` değerini doğrula.

### B2. Panoda «yerel» jeton alanı
- **Nerede:** `web/index.html` → Nerede çalışsın bölümü.
- **Ne:** Önce doğrula: bugün «yerel» sağlayıcıya anahtar girilebiliyor mu?
  - Girilemiyorsa motor adresinin altına isteğe bağlı bir «Motor jetonu» alanı ekle. Alan `keys.yerel`'e yazsın.
  - Adres `internet` sınıfındaysa ve jeton yoksa, sına sonucunda Türkçe bir uyarı göster.
- **Test:** `test_models` → jetonlu adres doğrulaması. `tools/yuz.js` → 390 pikselde taşma yok.

### B3. Soğuk başlangıç ile kapalı servisi ayır
- **Nerede:** `core/motor.py` `dugum_durumu`, `core/ai.py`.
- **Ne:**
  - Model listesi dönüyorsa ama ilk çağrı zaman aşımına uğruyorsa not «Motor ayakta, model belleğe yükleniyor olabilir» olsun, «ulaşılamadı» değil.
  - Hibritte bu durumda bir kez buluta geçmek doğru. Yerel modda kullanıcıya söylensin.
- **Test:** probe başarılı, çağrı `TimeoutError` → doğru not ve doğru yükselme.

### B4. Kurulum belgesi
- **Nerede:** `HKM/KURULUM.md`.
- **Ne:** A1–A3'ü oraya kısa bir «Modeli başka bilgisayarda çalıştır» bölümü olarak taşı. `OLLAMA_HOST`, güvenlik duvarı kuralı ve «11434'ü internete açma» uyarısı dahil. Bu dosya o zaman silinebilir.

### B5. (İsteğe bağlı) Uçtan uca deneme betiği
- **Nerede:** `HKM/tools/motor_sina.py`, yalnız standart kütüphane.
- **Ne:** Adres alır. Şunları tek raporda yazar:
  - Adres sınıfı.
  - `/v1/models` cevabı ve süresi.
  - Tek jetonluk bir sohbet çağrısı ve süresi.
- Kullanıcının iki makine arasında «çalışıyor mu» sorusuna tek komutla cevap verir. CI'ya girmez; ağ ister.

## Kabul ölçütü

- A3.4 ve A3.5 gerçek iki makinede geçti:
  - Yerel cevap `$0`.
  - Motor kapanınca hibrit buluta geçti, yerel mod bozulmadı.
- B1–B3 testli olarak `main`'de. HKM testleri, `perf.py`, `yuz.js` ve `entegre.js` temiz.
- Hiçbir modül (AYS/SPİ/ESP) motorun yerini bilmiyor; yalnız HKM biliyor (§1.4).
