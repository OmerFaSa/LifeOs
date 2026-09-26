# HKM — kurulum, sunucu ve kanallar

> Yerel kullanım **tek tıktır** (§1). Bu belgenin geri kalanı HKM'yi
> dışarı açmakla ilgilidir ve o bir **altyapı kararıdır**: maliyeti burada
> yazılıdır. Kanallar kapalıyken HKM ve üç sistem olduğu gibi çalışır —
> §2'den sonrası zorunlu değildir.

## 1. Yerel çalıştırma — TEK TIK

`HKM` klasöründeki başlatıcıya çift tıkla:

| İşletim sistemi | Dosya |
|---|---|
| macOS | `BASLAT.command` |
| Windows | `BASLAT.bat` |
| Linux | `baslat.sh` (ya da `python3 baslat.py`) |

Tek tık şunları yapar ve **her satırı gerçekten dener**: yapılandırmayı
yazar (var olanı **ezmez**), şemayı kurar, daemon ayakta değilse başlatır
ve cevap verene kadar bekler, yüz için kısa bir eşleme penceresi açar,
tarayıcıyı açar. Jeton **hiçbir yerde görünmez** — ne ekranda, ne adres
çubuğunda: yüz onu eşleme penceresinden alır ve yalnız kendi tarayıcısında
saklar.

Durdurmak: `python3 baslat.py --dur`. Pencereyi kapatmak yetmez; daemon
arka planda çalışır.

Üç sistemi bağlamak da jeton kopyalamadan olur:

1. Yüzde **Yönetim → Cihazları bağla** — iki dakikalık, **tek kullanımlık**
   bir pencere açılır
2. AYS / SPİ / ESP → Ayarlar → HKM işareti → **Bağlan**

Pencereyi yalnız jetonu zaten bilen taraf açabilir; jeton yalnız yerel
kökene verilir ve pencere ilk cihazda kapanır. Her sistem için pencereyi
yeniden aç. Jetonu elle yazmak da çalışmaya devam eder.

`python3 kur.py --durum` hiçbir şeyi değiştirmeden durumu yazar.

- Daemon yalnız `127.0.0.1`'e bağlanır. `host` değerini değiştirmek
  **bilinçli bir karardır** ve o andan itibaren ağdaki herkes kapıyı görür.

Doğrulama:

```bash
python3 -m tests.run            # HKM'nin kendi denetimleri
node tools/yuz.js               # yüz: taşma, hedef boyu, etiket, kontrast
node ../tools/entegre.js        # üç arayüz + HKM: uçtan uca
```

## 2. Sunucuda sürekli çalıştırma (systemd)

`/etc/systemd/system/hkm.service`:

```ini
[Unit]
Description=HKM — Hayat Kontrol Merkezi
After=network.target

[Service]
Type=simple
User=hkm
WorkingDirectory=/opt/lifeos/HKM
ExecStart=/usr/bin/python3 /opt/lifeos/HKM/daemon.py
Restart=on-failure
RestartSec=5
# Sertlestirme: servis kendi dizini disinda hicbir yere yazamaz.
# HKM klasoru yazilabilir olmali: Ayarlar ekrani config.json'u yazar
# (gecici dosya + yer degistirme). Yalniz db/ yazilabilir olursa ayar
# ekrandan kaydedilemez.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/lifeos/HKM
# Yazilan her dosya yalniz sahibine acik (HKM acilista da bunu yapar).
UMask=0077

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now hkm
journalctl -u hkm -f
```

**Saat dilimi.** HKM'nin günü **Europe/Istanbul**'a göre döner; sunucunun
kendi saat dilimi (çoğu VPS'te ve kapta UTC) önemli değildir. Başka bir
dilim için `config.json`'a `"saat_dilimi": "Europe/Berlin"` yaz. Tanınmayan
bir ad kurulmaz, günlüğe yazılır. Etkin dilim `/api/tani` cevabında
`saat_dilimi` alanında görünür.

**Dosya izinleri.** `config.json` (jetonlar, anahtarlar), ambar, kopyalar,
`db/yedek/` ve `db/media/` yalnız HKM'yi çalıştıran kullanıcıya açıktır
(dosya 0600, klasör 0700). Daha önce geniş izinle yazılmış olanlar açılışta
daraltılır; ambarın durduğu üst klasöre dokunulmaz.

**Yedek:** bütün durum tek bir dosyadadır — `HKM/db/hkm.db`. Kopyalamak
yeterlidir; kopyalamamak, dokuz aylık kaydı tek bir disk hatasına bağlar.

## 3. WhatsApp (Meta Cloud API)

Gereken dört şey `config.json` → `channels.whatsapp` altına yazılır:

| Alan | Nereden gelir |
|---|---|
| `phone_number_id` | Meta uygulamanın WhatsApp numarası kimliği |
| `token` | kalıcı erişim jetonu |
| `app_secret` | uygulama sırrı — gelen webhook imzasını doğrular |
| `verify_token` | webhook kurulumunda senin belirlediğin dize |
| `allow_from` | **cevap verilecek numaralar.** Boş liste «kimse» demektir |

Sonra `"enabled": true`.

**Meta'nın HKM'ye ulaşabilmesi gerekir.** İki yol vardır ve ikisi de bir
karardır:

- **Tünel** (cloudflared, tailscale funnel, ngrok): makine evde kalır,
  yalnız webhook yolu dışarı açılır. Daha küçük yüzey, bir üçüncü tarafa
  bağımlılık.
- **Sunucu**: HKM bir VPS'te koşar, önünde TLS sonlandıran bir ters vekil
  (nginx/caddy) durur. Daha çok kontrol, daha çok bakım.

Ters vekil kullanıyorsan **yalnız webhook yolunu** aç:

```nginx
location /api/wa/webhook { proxy_pass http://127.0.0.1:4200; }
location /api/tg/webhook { proxy_pass http://127.0.0.1:4200; }
# Baska hicbir yol disari acilmaz: brifing, ikiz ve karar yollari yereldir.
```

Webhook kurulumunda Meta önce bir `GET` doğrulaması yapar; HKM yalnızca
`verify_token` eşleşirse meydan okumayı yansıtır.

### Neden bu iki yol bearer istemez

Bearer'sız POST yolu **üçtür**; her birinin kendi kapısı vardır:

- `POST /api/wa/webhook` — isteği Meta yollar ve bearer taşıyamaz. Kapısı
  **imzadır**: gövde, uygulama sırrıyla HMAC-SHA256 imzalanmamışsa
  ayrıştırılmaz bile.
- `POST /api/tg/webhook` — Telegram imza yerine kurulumda verdiğin **gizli
  başlığı** geri gönderir; sır tanımsızsa bu webhook kapalıdır.
- `POST /api/pair` — cihaz eşleme. İsteyen taraf jetonu zaten bilmez;
  kapısı HKM yüzünde «Cihazları bağla» ile açılan **tek kullanımlık, süreli
  pencere**, yalnız yerel köken ve deneme sınırıdır.

## 4. Telegram — iki yol, biri hiçbir kapı açmaz

Telegram'da **iki yön** vardır ve gereksinimleri farklıdır:

| Yön | Ne gerekir |
|---|---|
| **Giden** (HKM → telefonun) | hiçbir şey; HKM dışarı çıkar |
| **Gelen** (sen → HKM) | ya **yoklama** ya **webhook** |

### 4.1 Yoklama — önerilen

HKM dışarı çıkıp «bana mesaj var mı» diye sorar (`getUpdates`). Bilgisayarı
internete açmak, alan adı almak, sertifika kurmak **gerekmez**.

1. @BotFather → `/newbot` → jetonu al
2. @userinfobot → `/start` → **Id**'ni al
3. HKM → Ayarlar → Sohbet kanalları → Telegram: bot jetonu ve izin
   listesine kendi Id'n. **Kaydet**, sonra **Aç**.
4. Aynı yerdeki **«Mesajları sorarak al (yoklama)»** kutusunu işaretle ve
   kaydet. **«Şimdi dene»** bağlantıyı sınar.
5. Telegram'da botuna `/start` yaz (Telegram, başlatmadığın bir bottan
   mesaj almana izin vermez), sonra `durum` yaz.

**Botun anladıkları:** `durum` · `kabul` · `ret` · `neden` · `capraz` ·
`seri` · `etki` · `yardim` · `basla`. Eğik çizgili biçim (`/durum`) ve
gruplardaki `@botadı` eki de tanınır. Uygulamada «/» yazınca komut menüsü
çıkar — «Şimdi dene» düğmesi menüyü de kurar.

«yarın 2 saat matematik» gibi bir cümle yazarsan ilgili sisteme **teklif**
bırakılır; sistemi açtığında onayına sunulur.

**Serbest cümleyle konuşmak** için ayrı bir ayar yok: King'e bir model
atadıysan (Ayarlar → Yapay zekâ), Telegram da onunla konuşur — ekranla
aynı katmandan geçer. Model atanmamışsa ya da bütçe bittiyse komutlar
çalışmaya devam eder; «yapay zekâ yok» ile «sistem bozuk» ayrı şeylerdir.

Komut her zaman **önce** denenir: «durum» yazdığında modele gidilmez,
para harcanmaz.

### Otomatik mesajlar

Ayarlar → Sunucu → **Otomatik mesajlar**: sabah brifingi, akşam kapanışı,
haftalık rapor. Varsayılan kapalı; boş bırakılan saat o mesajın kapalı
olduğu anlamına gelir. Kanal seçmezsen **açık olan** kanala gider.

Webhook ile yoklama **aynı anda olmaz**: Telegram, webhook tanımlıyken
`getUpdates`'i reddeder. «Şimdi dene» webhook'u önce siler ve bunu söyler.

### 4.2 Webhook — sunucuda çalıştırıyorsan

```json
"telegram": { "enabled": true, "bot_token": "…", "webhook_secret": "…",
              "allow_from": ["<sohbet kimliğin>"] }
```

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://alanadin/api/tg/webhook" \
  -d "secret_token=<webhook_secret>"
```

> HKM'yi dışarı açmak bir **altyapı kararıdır**. Ev bilgisayarında
> yoklama, hem daha az yüzey hem daha az iş.

## 5. Yapay zekâ anahtarı — isteğe bağlı

HKM **modelsiz de çalışır**: kural motoru bütün sayıları üretir, komutlar
cevap verir, teklifler işler. Model yalnız *cümle kurar*. Bu yüzden
anahtar girmek bilinçli ve **parası olan** bir karardır.

**Önerilen: OpenRouter** — tek hesap, tek bakiye; OpenAI, Claude, Gemini,
DeepSeek ve diğerleri aynı anahtarla. Anahtar başına aylık limit
koyulabilir: bütçe sayacından bağımsız **ikinci bir kilit**.

1. Ayarlar → **Yapay zekâ** → Sağlayıcılar → OpenRouter satırındaki
   «anahtar al →» bağlantısından anahtarı oluştur.
2. **«+ Anahtar ekle»** de; açılan satıra bir **ad** («Benim»), bir
   **sahip** («ben») ve anahtarın kendisini yaz. **«Anahtarları kaydet».**
3. Satırdaki **«Sına»** düğmesi anahtarı sınar — model çağırmaz, para
   harcamaz. *Kurulu olmak, çalışmak değildir.*
4. **Görev dağılımı**nda King'e bir sağlayıcı ve model seç. Alt kademeler
   atama yoksa King'den **miras** alır; hepsini tek tek doldurmak
   gerekmez. **Fiş okuma** («Para · Fiş okuyan» kademesi) görsel okuyabilen
   bir model ister (Gemini 2.5 Flash, Claude, GPT-5 ailesi okur). King'in
   modeli görsel okumuyorsa bu kademeye ayrıca bir model ata.
5. Ayarlar → **Bütçe**: aylık tavan (TL), USD/TRY kuru ve kurun tarihi.
   Kur elle girilir; sınıra varıldığında ücretli çağrı **durur**.

**Çalışmıyorsa tahmin etme, sına.** Aynı ekrandaki **«Sohbeti dene»**
düğmesi zinciri baştan sona koşturur ve hangi adımda koptuğunu yazar:
atama → model adı → anahtar → bütçe → bağlam → sağlayıcıya çağrı →
cevabın denetimi. Sağlayıcı bir hata döndürdüyse **onun kendi cümlesi**
gösterilir («model not found: …» gibi) — çünkü «HTTP 404» kullanıcıya
hiçbir şey söylemez.

> En sık iki tuzak: **model adı** elle yanlış yazılmış olur (artık
> listeden seçilebiliyor), ve **tavan TL seçiliyken kur girilmemiştir** —
> o zaman hiçbir çağrı yapılmaz ve Bütçe ekranı bunu kırmızı yazar.

**Birden çok anahtar** ekleyebilirsin — örneğin biri senin, biri
kardeşinin. Harcama, anahtarın **sahibinin** defterine yazılır ve bütçe
ekranında kimin ne harcadığı ayrı görünür. Hangi kademenin hangi anahtarla
ödeyeceğini «Görev dağılımı»ndaki anahtar seçicisinden belirlersin;
seçmezsen o sağlayıcının ilk anahtarı kullanılır.

Kayıtlı bir anahtarın değeri ekrana **hiçbir zaman geri gelmez**, maske
görünür. Değer alanını boş bırakıp kaydedersen sır **korunur** (yalnız adı
ve sahibi güncellenir); silmek için satırı «Sil» ile kaldırıp kaydet.

## 5.1 Modeli başka bilgisayarda çalıştır (Ollama)

Sunucu merkezdir: veri, hafıza ve senkron burada kalır. Model ayrı bir
**motor servisi**dir; aynı bilgisayarda da, evdeki başka bir bilgisayarda
da çalışabilir. Hibritte motor kapalıysa iş buluta geçer; yerel modda
sistem kural motoruyla sürer — hiçbir şey kapanmaz.

**Model bilgisayarında:**

1. Ollama'yı kur (<https://ollama.com/download>) ve RAM'e göre bir model
   indir: 8 GB → `ollama pull qwen2.5:3b` · 16 GB → `ollama pull qwen2.5:7b`
   · 32 GB+ → `ollama pull qwen2.5:14b`.
2. **Ollama'yı ağa aç** — varsayılanda yalnız kendi makinesini dinler.
   Windows: Başlat → «Sistem ortam değişkenlerini düzenle» → Ortam
   Değişkenleri → Yeni: `OLLAMA_HOST` = `0.0.0.0:11434`. Ollama'yı görev
   çubuğundan kapatıp yeniden aç.
3. **Güvenlik duvarında 11434'ü yalnız ev ağına aç** (PowerShell,
   yönetici):
   ```powershell
   New-NetFirewallRule -DisplayName "Ollama LAN" -Direction Inbound -Protocol TCP -LocalPort 11434 -RemoteAddress LocalSubnet -Action Allow
   ```
4. `ipconfig` → «IPv4 Address» (ör. `192.168.1.20`).

**Bağlantının yolu:**

| Durum | Yol | Motor adresi |
|---|---|---|
| Aynı ev, aynı modem | doğrudan ev ağı | `http://192.168.1.20:11434` |
| Farklı yerler | **Tailscale** (iki makineye kur, aynı hesap) | `http://100.x.y.z:11434` |
| Tailscale yoksa | https veren bir vekil + jeton | `https://motor.alanadin.com` |

> **11434'ü modemden internete açma.** Ollama'da parola yoktur; açık kapı
> modelini herkese açar. İnternetteki bir motoru HKM zaten yalnız `https`
> ile kabul eder; jetonu Sağlayıcılar → **Yerel sunucu** satırına gir
> (jetonsuzsa sınama uyarır).

**Sunucu bilgisayarında:**

1. Tek komutla sına — adres kuralı, model listesi, tek kısa sohbet:
   ```bash
   python tools/motor_sina.py http://192.168.1.20:11434 --model qwen2.5:7b
   ```
   Her adım ✓/✗ ile ve kaldıysa nedeniyle yazılır («OLLAMA_HOST ayarlı
   mı?», «model motorda yok», «belleğe yükleniyor olabilir»).
2. Ayarlar → Yapay zekâ → **Nerede çalışsın**: **Hibrit** (önerilen) ya da
   **Yerel**; motor adresini ve Ekonomik/Standart için model adını
   (`ollama list`'te göründüğü gibi) yaz, **«Yerel sunucuyu sına»**.
3. Sohbette «merhaba» yaz: cevabın altında sınıf ve `$0` görünür.

**Bilinmesi gereken iki şey:**

- Başka makinedeki motor için bir cevap **120 saniyeye** kadar beklenir
  (işlemcide çalışan model yavaştır); aynı makinede ve bulutta 60 saniye.
- İlk çağrıda model belleğe yüklenir. Motor ayakta ama cevap zamanında
  gelmediyse bu «ulaşılamadı» sayılmaz: hibritte o istek **bir kez**
  buluta geçer (ikinci yerel model beklenmez), yerel modda «model belleğe
  yükleniyor olabilir» denir. «Yerel sunucuyu sına» 15 dakika boyunca bunu
  söyler.

## 6. Açmadan önce okunacak beş satır

1. **İzin listesi boşsa kimse yok.** Boş liste «herkes» demek değildir;
   tanımadığı numaradan gelen mesajın içeriği ambara bile yazılmaz.
2. **Sır sızmaz.** Jeton, uygulama sırrı ve doğrulama jetonu hiçbir çıktıda
   görünmez — ama `config.json` dosyanın kendisi `.gitignore`'dadır ve
   yedeklerken de öyle kalmalıdır.
3. **Günde tek mesaj.** Kanal bir bildirim akışı değildir.
4. **Komut seti kapalıdır:** `durum`, `kabul`, `ret`, `neden`, `capraz`,
   `yardim` — ve önce bunlar denenir. Serbest metin, yalnız bir model
   atandıysa cevaplanır; atanmadığında yorumlanmaz ve uydurulmaz.
5. **HKM'nin uygulama ya da ekran düzeyinde hiçbir yetkisi yoktur.**
   Kabul ettiğin öneriyi uygulayan sensin; «ekran kapatma zorunlu kılındı»
   cümlesi kod düzeyinde bile yanlıştır.
