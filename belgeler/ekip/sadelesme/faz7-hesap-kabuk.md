# Faz 7 · Hesap ekranı kabukta (`#/hesap`)

Durum: ilk sürüm bitti, commit edilmedi (çalışma ağacında). 2026-11-14.

## Kapsam

Hesap ve sistem panelinin ilk, dürüst sürümünü yeni kabuğa (`kabuk/`) taşımak; `/kartlar/` yerinde kalır (önce eşdeğerlik).
Öncelik sırası: 1) oturum durumu + çıkış, 2) cihazlar (liste, yeni cihaz kodu + QR, cihaz kaldırma onaylı),
3) güncelleme, 4) Ayarlar/harita bağlantıları.

## Envanter

- Kabuk zaten eski istemciyi yüklüyor: `kabuk/kabuk.js` `baslat` → `/parca.js` + `/hesap.js` (`window.LIFEOS.HESAP`).
  Oturum jetonu bu istemcinin `lifeos_hesap` çerezinde; yeni ekran jetona hiç dokunmaz, yalnız istemcinin dışa açık
  işlevlerini çağırır: `durum()` (oturum: ad, görünen ad, rol), `cikisYap()`, `cihazlar()`, `cihazCikar(id)`,
  `bagKoduAc()`, `bagDurum(id)`. Bunlar sunucuda `/api/hesap/cikis`, `/cihazlar`, `/cihaz-cikar`, `/bag-kodu`, `/bag-durum`.
- Herkese açık uçlar (jetonsuz): `GET /api/hesap/durum` (kurulum, yerel mi, `ev_agi` = Tailscale adı → QR adresi),
  `GET /api/guncelleme` (git durumu: geride, yeni kayıtlar, yedeklenebilir), `POST /api/guncelle` (`X-LifeOS: guncelle`,
  yalnız bu bilgisayarın kökeninden; deneme kapısında `--port` 403), `POST /api/yeniden`, `GET /api/durum`.
- Dışa açık olmayanlar: `bagKapat` (kod 5 dakikada kendiliğinden biter; yeni kod eskisini siler), `sistemDurum`/`sistemGuncelle`
  (telefondan parolayla güncelleme). Kurulu sürüm (`guncelle.surum()`) jetonsuz hiçbir uçta yoktu.
- QR: `/qr.js` (`LIFEOS.QR.svg`), eski panel gibi yalnız Tailscale adresi ya da https kökeni varsa çizilir.
- Eski panelde kalan büyük parçalar: giriş/kayıt/kurtarma, iki adım, bağlantılar (takvim, erişim anahtarları, gelen kutusu),
  profil, güvenlik kontrolü, etkinlik, yedekler, kullanıcı yönetimi, her yerden erişim, Merkez, dışa aktarma, hesabı silme.

## Yapılan

Ekran `#/hesap` (`kabuk/hesap.js`, yalnız katalog taşları: baslik, bolum, ayar, uyari, liste/satir, panel, eylemler, bos; yeni CSS yok):
1. **Oturum**: hesap adı (@ad), rol, bu cihazın adı; «Çıkış yap» onay adımıyla (`HESAP.cikisYap`). Girişsizse ne olduğunu söyler,
   «Giriş yap» / «Hesap kur» düğmesi `/kartlar/`'a gider (parolayla giriş şimdilik orada).
2. **Cihazlar**: liste (bu cihaz «bu cihaz» rozetli, çıkarılamaz — o çıkıştır; öteki cihazlar «son görülme»li). «Çıkar» önce sorar
   («Evet, çıkar» / «Vazgeç»). «Yeni cihaz bağla»: altı haneli kod, saniye saniye geri sayım, 2,5 sn'de bir «bağlandı mı?» yoklaması;
   bağlanınca «iPad bağlandı» der ve listeyi tazeler; süresi dolunca «Yeni kod». QR `/qr.js`'ten tembel yüklenir, eski paneldeki
   kuralla yalnız telefonun açabileceği adres varsa (oturum sunucusu, https kökeni ya da Tailscale adı) çizilir; yoksa nedeni yazılır.
3. **Güncelleme**: «Güncellemeyi denetle» (`GET /api/guncelleme?taze=1`; her açılışta ağa çıkmasın diye düğmeyle) → kurulu sürüm,
   güncel/yenilik var/ayrışmış dal/zip/git yok; ilk 5 yenilik listesi. «Güncelle» / «Yedekle ve güncelle» yalnız bu bilgisayarda
   (`/api/hesap/durum` `yerel`) çıkar; akış eski panelinkinin aynısı (indir; gerekirse `/api/yeniden` ve `/api/durum` ile dönüşü bekle).
4. **Bağlantılar**: haritada yeni yer `hesap` (dal `ayarlar`, durum `yeni`); Ayarlar › «Hesap ve güvenlik» bölümünün başlığında
   «Hesap ve cihazlar» düğmesi (`kabuk/kabuk.js` tek satır). `eskisistem` (`#/eski` → `/kartlar/`) yerinde, açıklaması kalan işleri söyler;
   ekranın sonunda «Eski panelde kalanlar» bölümü panele bağlanır. `/kartlar/` ve `brand/ortak/hesap.js` dokunulmadı.

Güvenlik: jeton yeni koda hiç gelmez (eski istemcinin çerezinde kalır, istekleri o yapar); depoya yeni anahtar yazılmaz
(`depo.test.js` değişmedi); ekran HTML'inde jeton olmadığı hem birim testte hem tarayıcıda denetlenir.

Sunucu: `sistem/sunucu.py` `GET /api/guncelleme` cevabına `surum` (`guncelle.surum()`: tarih, kısa kimlik) eklendi; kurulu sürüm
jetonsuz başka hiçbir uçta yoktu. Önbellekteki sözlüğe dokunulmaz (kopyası döner). Testi `tools/tekkapi_test.py`'de.

Değişen dosyalar: `kabuk/hesap.js` (yeni), `kabuk/hesap.test.js` (yeni), `kabuk/index.html` (bir betik), `kabuk/harita.js` (bir yer +
`eskisistem` açıklaması), `kabuk/kabuk.js` (Ayarlar'da bir satır), `tools/kabuk_gez.js` (Hesap adımları, en sonda), `tools/tekkapi_test.py`
(bir denetim), `.github/workflows/ci.yml` (hesap testi adımı), `sistem/sunucu.py` (bir satır), önizlemeler `kabuk-onizleme/hesap-*.png`.

## Testler

- `node kabuk/hesap.test.js` → 11 geçti, 0 kaldı
- `node kabuk/kabuk.test.js` → 68 geçti, 0 kaldı
- `node kabuk/bilesen.test.js` → 21 geçti, 0 kaldı
- `node kabuk/depo.test.js` → 19 test geçti
- `node kabuk/onay.test.js` → 15 geçti, 0 kaldı
- `node kabuk/tanisma.test.js` → 25 geçti, 0 kaldı
- `python tools/tekkapi_test.py` → 116/116 yeşil (yeni: «güncelleme durumu kurulu sürümü de söyler»)
- `cd HKM && python -m tests.run` → 1056/1056 test gecti
- `python kalite/olcum.py --denetle` → tek satır: `AŞIM: Sayfa 42 → 43 (son kayıt 2026-11-14); bütçe «azalmali»` — yeni Hesap sayfasından;
  kalite kayıtlarına dokunulmadı. Eski panelin parçaları kabuğa geçip `/kartlar/` kalkınca sayı geri iner.
- `node tools/kabuk_gez.js` → hepsi geçti (yeni 11 Hesap denetimi: Ayarlar'dan açılış, girişsiz, oturum, jeton sayfada yok,
  çıkarma vazgeç/onay, kod + geri sayım, telefonda taşma yok, kodla bağlanınca «bağlandı», güncelleme denetimi (taklit yanıt), çıkış, konsol temiz)
- `node tools/kabuk_esit_gez.js` → hepsi geçti
- Önizlemeler (yalıtılmış tek kapı 4396, uydurma hesap, QR için Tailscale adı yalnız tarayıcıda taklit): `kabuk-onizleme/hesap-masaustu-acik.png`,
  `hesap-masaustu-koyu.png`, `hesap-telefon-acik.png`, `hesap-telefon-koyu.png`, `hesap-girissiz-masaustu-acik.png`, `hesap-girissiz-telefon-acik.png`.
  Bakıldı: taşma yok, koyu temada QR beyaz zeminde (okunsun diye), bağlama kodu Ayar satırında (kataloğun büyük rakam taşı yok).

## Açık kalanlar

- `/kartlar/`'da kalanlar (bilerek): parolayla giriş, hesap açma, kurtarma; iki adımlı doğrulama; bağlantılar (takvim aboneliği, erişim anahtarları,
  gelen kutusu); profil (ad, renk, hitap); güvenlik kontrolü ve etkinlik; yedekler; kullanıcı yönetimi; her yerden erişim ve Merkez; dışa aktarma,
  hesabı silme; telefondan parolayla güncelleme. Her biri parola ya da gizli değer taşıyor ya da ayrı bir akış; bir sonraki pakette tek tek taşınmalı.
- Bağlama kodunda «Vazgeç» kodu yalnız ekrandan kaldırır: `bagKapat` eski istemcide dışa açık değil. Kod sunucuda 5 dakikada biter, yeni kod eskisini siler.
  Eski istemcinin dışa açtığı listeye `bagKapat` eklenirse tek satırla bağlanır.
- Güncelleme «Güncelle» akışı tarayıcıda uçtan uca denenmedi (deneme kapısı güncellemeyi 403'le kapatır, gerçek depoda denemek riskli);
  kod eski panelin akışının birebir aynısı. Telefonda güncelleme düğmesi gösterilmez, «bu bilgisayardan başlatılır» yazar.
- Kabuk eski `hesap.js`'i yüklediği için onun `durumYaz`'ı üst çubuktaki `.ust__hesap` düğmesinin etiketini değiştirir (önceden de böyleydi).
