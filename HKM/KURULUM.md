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
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/lifeos/HKM/db

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now hkm
journalctl -u hkm -f
```

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

`POST /api/wa/webhook` HKM'nin **tek** bearer'sız POST yoludur: isteği Meta
yollar ve bearer taşıyamaz. Kapısı **imzadır** — gövde, uygulama sırrıyla
HMAC-SHA256 imzalanmamışsa ayrıştırılmaz bile. Telegram imza yerine
kurulumda verdiğin gizli başlığı geri gönderir; sır tanımsızsa o webhook
kapalıdır.

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

## 5. Açmadan önce okunacak beş satır

1. **İzin listesi boşsa kimse yok.** Boş liste «herkes» demek değildir;
   tanımadığı numaradan gelen mesajın içeriği ambara bile yazılmaz.
2. **Sır sızmaz.** Jeton, uygulama sırrı ve doğrulama jetonu hiçbir çıktıda
   görünmez — ama `config.json` dosyanın kendisi `.gitignore`'dadır ve
   yedeklerken de öyle kalmalıdır.
3. **Günde tek mesaj.** Kanal bir bildirim akışı değildir.
4. **Komut seti kapalıdır:** `durum`, `kabul`, `ret`, `neden`, `capraz`,
   `yardim`. Serbest metin yorumlanmaz.
5. **HKM'nin uygulama ya da ekran düzeyinde hiçbir yetkisi yoktur.**
   Kabul ettiğin öneriyi uygulayan sensin; «ekran kapatma zorunlu kılındı»
   cümlesi kod düzeyinde bile yanlıştır.
