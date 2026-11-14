# Bu depoda çalışan her ajan için kurallar

> Bu dosya insan için değil, **ajanlar** için yazıldı (Codex `AGENTS.md`
> okur; Claude Code da bunu okuyor). Amacı tek: iki farklı ajan aynı depoda
> çalışırken birbirinin işini bozmasın ve depo doktrini her turda yeniden
> anlatılmak zorunda kalmasın.

## 0. Otuz saniyede depo

Tek sistem (kapanış, Faz 7): bir uygulama, bir adres, bir süreç. `sistem/tekkapi.py` 4180'de
kabuğu (`kabuk/`), alan içeriğini (`alan/`), motorları (`motor/`), bütün `/api/...` yollarını ve
Merkez çekirdeğini (`HKM/core`, `/api/hkm/`) aynı süreçte sunar; King `king/` (MCP ucu dahil),
kalite `kalite/`. Hesap, cihaz ve güncelleme paneli `/kartlar/`. Cihaz yolu yalnız Tailscale.
Eski üç modül (AYS, SPİ, ESP), HKM yüzü, kopya dağıtımı ve ev ağı sertifikası kalktı; kodları
`c293d421`'de. Ayrıntı: `README.md` (kısa), `belgeler/TEKNIK.md`; belgelerin dizini
`belgeler/DIZIN.md`, araçlarınki `tools/DIZIN.md`.

**Kök klasör sade kalır** (depo sahibinin isteği): kökte yalnız
`BASLAT.bat`, `GUNCELLE.bat`, `README.md`, `AGENTS.md` ve klasörler
durur. Başlatıcı, sunucu, güncelleyici `sistem/`; belge, rapor, ekip
notu `belgeler/`. Köke yeni dosya eklenmez.

## 0.1 Yön: tek sistem (2026-11-12, depo sahibinin kararı)

Dört bağımsız sistem sözleşmesi bırakıldı. Hedef **tek kişi, tek sistem, tek
veri**: bir uygulama, bir adres, bir depo; katmanlar Kabuk → Alanlar → Motorlar
→ King → Çekirdek → Kalite. Plan ve on altı karar: `belgeler/ekip/sadelesme/plan.html`
(envanter ve sentez aynı klasörde).

**Geçiş:** yeni kabuk eskisinin yanında kurulur, alanlar tek tek taşınır, eskisi
silme kapısından sonra kapanır. **Kapanış yapıldı** (`belgeler/ekip/sadelesme/faz7-kapanis.md`):
aşağıdaki eski modül sözleşmeleri artık tarihçedir. Eski modüller (AYS, SPİ, ESP, HKM yüzü)
**dondurulmuştur**: yeni özellik almaz, yalnız hata düzeltmesi. Tek yazılı
istisna, her cihazdan veri alan göç paketi düğmesidir. Bir faz kapısı ölçümle
geçilmeden sonraki faz başlamaz. Aşağıdaki §1 sözleşmeleri, alanı taşınana
kadar eski modüller için geçerlidir; yeni kod bu bölüme göre yazılır.

**Sekiz kural:**
1. Tek kişi, tek sistem, tek veri.
2. Tek ekran, tek iş: her sayfa tam ekrandır ve bir ana eylemi vardır.
3. Bir özellik, bir yer: ortak iş motordur; kopyalanmaz, çağrılır.
4. Öğrenme önce: yol haritasındaki bir adıma hizmet etmeyen özellik kalmaz.
5. Bir giren, bir çıkar: karmaşıklık bütçesi aşılırsa yeni parça ancak eskisi çıkınca girer.
6. Önce örnek, sonra kod: tasarım değişikliği varyasyonla gösterilir, sahibi seçer.
7. Ölçmeden değişmez: her değişiklik bir eğriyi yükseltir ya da bir bütçeyi düşürür.
8. Sayıyı kod üretir: King açıklar, öğretir, araştırır; hesap ve kayıt koddadır (§1.1, §1.2, §1.3 aynen kalır).

**Yeni kodda değişen sözleşmeler:** §0 ve §1.4 → tek sistem; HKM ve BAM ayrı
yapı olarak kalkar, çekirdekleri tek sunucuya katılır. §1.4 «fotoğraflar
eşitlenmez» → PC'ye eşitlenir; «son yazan kazanır» → mantıksal saat, alan
düzeyi çakışma. §1.6 seviye, rütbe, rozet, ofis ajanları, sahne ve radyo →
arşiv. §1.10 piksel oda ve kâğıt yaprak → tam ekran çerçeve; piksel kimlik
(yazı, renk jetonu) kalır, oda park edilir. §1.11 Lego kaydı kalır; her parça ya
kabuğa, ya bir motora, ya bir alana aittir.

**Öteki kararlar:** King önce Claude uygulamasında MCP ile (yazma tek süreçten
sonra); gezinme basılı tut halkası ve komut çubuğu, karşılama A; cihaz yolu
yalnız Tailscale; pilot alan Felsefe, alanlar plandaki on alan (Diksiyon Dil'in
içinde); göçte her şey taşınır, türetilmiş kayıtlar yeniden hesaplanır,
etiketsiz sayı «eski kayıt» etiketi alır; onaysız içerik taslak etiketiyle
görünür ve tekrara girmez; aşama geçişinde ustalık kapısı zorunlu, tekrar
FSRS; King notları okur, hafızaya yalnız öneri yazar.

## 1. Değişmeyen kurallar

Bunlar tercih değil **sözleşmedir**; bir öneri bunlardan birini kırıyorsa
önce kuralı tartış, kodu sonra değiştir.

1. **Kural motoru otoritedir.** Sayıyı ve kararı kod üretir; dil modeli
   yalnızca cümleye çevirir. Model kapalıyken hiçbir sistem kapanmaz.
   Ajan kullanıcının **tercihini** değiştirebilir (hedef, plan, açık
   bölümler, üslup) — ama yalnız kapalı bir katalogdan tipli bir aksiyonla
   ve kodun doğrulamasından geçerek. **Ölçülmüş ya da hesaplanmış** bir
   sayıyı (net, uyku ortalaması, sıralama tahmini) hiçbir ajan değiştiremez.
   **King'in yetkisi (2026-10-17, depo sahibinin kararı):** King, kişinin
   kendi hesabı (parola, iki adım, cihazlar, yönetici, e-posta) HARİÇ
   sistem içindeki her değişikliği kullanıcının açık isteğiyle yapabilir:
   onaylamak, ayar değiştirmek, bir modülü sıfırdan başlatmak dahil. Yol
   yine kapalı katalogdur (`brand/ortak/yetki.js`); eylemi modülün kendi
   kodu uygular, seviyeyi katalog belirler (§1.9) ve büyük eylemden önce
   dönüş noktası alınır. King hiçbir sayıyı uydurmaz.
   **Kişi modeli (2026-10-17, depo sahibinin kararı, `belgeler/ekip/KISI-PLANI.md`):**
   King kullanıcıyı 14 yaşam alanında tanır (inanç, maddiyat, ruh hâli
   dahil); kişi modeli hafızanın kendisidir (`brand/ortak/kisi.js`). Açık
   beyan («X'i sevmem») kural motoruyla kendiliğinden yazılır, «Geri al»
   kalır; model yine kalıcı kayıt yazamaz. Her kayıt görünür ve silinir;
   teşhis ve yetenek yargısı yok (§1.5). Kullanıcının kararıyla hassas
   alanlar dahil kişi özeti modele gidebilir; ajan yalnız alanının izinli
   kısmını görür, King hepsini.
2. **Eksik veri sıfır değildir.** Dört etiket: `ölçüldü / tahmin /
   hesaplandı / veri yok`. Etiketsiz sayı hiçbir katmana girmez.
3. **Sıfır çalışma zamanı bağımlılığı.** Üç arayüzde çerçeve, paket,
   derleyici yok; HKM'de yalnız Python standart kütüphanesi. Playwright
   yalnız denetim betikleri için. İstisna yok.
   **Tarihçe:** 2026-09-26 ile 2026-09-27 arasında AYS ve SPİ'nin canlı 3B
   ofisi için Three.js 0.160.1 istisnası tanımlanmıştı; depo sahibinin
   2026-09-28 kararıyla istisna geri alındı, `ofis3d/` (Three.js + sahne.js)
   iki sistemden de kalıcı olarak kaldırıldı. `js/core/ofis3b.js` köprüsü ve
   CSS ofis kaldı — dosya yokken zaten hafif odaya dönüyordu, bu davranış
   değişmedi. 2026-10-02'de depo sahibinin kararıyla AYS Ofis'teki 3B oda,
   kat planı ve AYS'nin `ofis3b.js` köprüsü de kaldırıldı (kaldırılan eylemler
   `belgeler/ekip/envanter/kaldirilan.json`'da). Aynı gün SPİ'nin 3B kampüsü
   ve `ofis3b.js` köprüsü de kalktı: iki sistemde de 3B yüz yok.
   **Telefon kabuğu istisnası (2026-10-04, depo sahibinin kararı):** ekran
   kapalıyken rota kaydı tarayıcıda olmaz; bu yüzden `uygulama/` altında
   telefon için yerel bir kabuk var (önce iOS, Swift). Sınırları: çerçeve ve
   üçüncü taraf paket YOK (Capacitor/Cordova değil; yalnız Apple'ın kendi
   kitaplıkları); üç arayüzün web kodu değişmez ve sıfır bağımlılık kalır;
   kabuk derlenmiş tek dosyaları (`dist/`) içine alır ve telefonda yerel bir
   sunucuyla 4173/4183/4193'te açar. Derleme araçları (Xcode, XcodeGen)
   yalnız CI'da koşar. Ayrıntı: `belgeler/UYGULAMA.md`.
   **Durdu (2026-11-14, kapanış):** paketlediği üç modül kalktı; cihaz yolu yalnız Tailscale (§0.1),
   sahip «telefonda kayıt yok» dedi. Derleme (`ios.yml`) kaldırıldı; kod `uygulama/ios`'ta bekliyor.
   Geri gelirse tek kapının kabuğunu açacak biçimde yeniden yazılır ve derleme yeniden eklenir.
   **Kabuk web kodunu indirebilir (2026-11-05, depo sahibinin isteği: «her güncellemede
   PC bağlamam lazım»):** kabuk içindeki `dist/` yedek olarak kalır; daha yeni web kodunu
   yalnız yeşil derlemeden, özet doğrulamasıyla kendisi indirir (`WebGuncelleme.swift`).
   Yalnız kod iner, hiçbir kayıt gitmez. Sayfa yeni bir yerel köprü isterse `project.yml`
   › `LifeOSWebUyum` artırılır: eski kabuk o paketi almaz.
   **Masaüstü kabuğu (2026-11-05):** `uygulama/masaustu/` Electron'un resmî paketine giren
   kabuktur (depodaki kodu olduğu gibi çalıştırır, çerçeve ya da paket eklemez); web kodu
   ona bağlı değildir. `sistem/kur.ps1` kurar, «Güncelle» tazeler.
4. **Modüller HKM'yi bilir ama ona bağımlı değildir.** AYS/SPİ/ESP,
   HKM'nin üst patron (King) olduğunu bilir ve onunla konuşabilir; ama HKM
   kapalıyken, yanıt vermezken ya da hata verirken hiçbiri bozulmaz,
   yavaşlamaz, veri kaybetmez. HKM hiçbir modüle **yazmaz**; teklif yazar,
   modül kendi koduyla uygular (`HKM/core/intents.py`). BAM, HKM'nin alt
   modülüdür; beşinci bir sistem değildir.
   **Hesap ve eşitleme (2026-10-04, depo sahibinin kararı):** PC, telefon
   ve tablet aynı hesapla girer; kayıtların kopyası kullanıcının KENDİ
   PC'sindeki LifeOS sunucusunda durur (`sistem/hesap.py`, her modül
   kapısında `/api/hesap/`; istemci `brand/ortak/hesap.js`). Aynı kural
   geçerlidir: sunucu kapalıyken modül bozulmaz, yavaşlamaz; değişiklik
   cihazda sıraya girer, bağlanınca akar. Veri hiçbir şirketin sunucusuna
   gitmez. Admin yalnız PC'nin kendisinden kurulur; parola düz tutulmaz.
   Kayıt düzeyinde son yazan kazanır; bir cihazın ilk eşitlemesi
   sunucudakini ezmez. Fotoğraflar eşitlenmez (çekildiği cihazda kalır).
   **Her yerden erişim (2026-11-06, depo sahibinin kararı: «apisiz, ücretsiz»):** telefon ve tablet
   evden uzakta Merkez'e ve yerel modele kullanıcının özel Tailscale ağından ulaşır (`sistem/uzak.py`);
   `tailscale serve`, asla `funnel`. Vekil isteği «bu bilgisayar» sayılmaz. Bilgisayar kapalıyken AI
   yoktur, modüller ve King'in kural yolları çalışır; model cihaza kurulmaz. King ve Hesap › Bağlantılar ›
   Her yerden erişim hâli adıyla söyler: bilgisayara ulaşılamıyor, Merkez kapalı, model meşgul, bağlı. Bilgisayar
   kapalıyken soru ve sayfa beklemez (`brand/ortak/sw.js`, `hesap.js` merkezHali). Bilgisayar açılınca başlama
   kullanıcının düğmesidir, varsayılan kapalı; uyku ve güç ayarına dokunulmaz.
   **Bağlantılar (2026-10-08, depo sahibinin isteği):** iki adımlı
   doğrulama (TOTP, yedek kodlar), kodla cihaz bağlama, erişim anahtarıyla
   gelen kutusu (iPhone Kısayollar, Home Assistant) ve takvim aboneliği de
   aynı sunucudadır (`sistem/hesap.py` sözleri 14–17). Gelen satırı sunucu
   anlamaz ve hiçbir modüle yazmaz; satırı yalnız gönderildiği modül
   (AYS, SPİ, ESP) alır ve kendi koduyla Onaylar'a öneri yapar; ölçüm
   onaysız yazılmaz. Takvimi modül üretir (AYS, ESP), sunucu yalnız
   birleştirip sunar. Hesap deposu her gün yedeklenir; geri yükleme büyük
   aksiyondur ve cihazların sonraki değişikliğini ezmez (sunucu sözü 20).
   Admin, şifresiyle, bilgisayardaki LifeOS'u telefondan ya da tabletten
   güncelleyebilir (sunucu sözü 28): güncelleyicinin sözleri aynıdır, veriye
   dokunmaz. Ev ağını açmak yine yalnız bilgisayarın kendisinden.
   Siri «Bugün ne var?»: her modül günün cümlesini KENDİ kuralıyla yazıp
   yayınlar; sunucu yalnız dizer, bugüne ait olmayanı «henüz açılmadı» der
   (sunucu sözü 21).
5. **Sınırlar:** SPİ teşhis koymaz ve doz önermez; ESP/AYS sertifika
   vermez, yetenek yargısı kurmaz, sonuç garantisi etmez.
6. **XP karar vermez.** Seviye sistemi (`brand/seviye/`) yalnızca
   görünürlüktür: hiçbir plan, reçete, uyarı ya da teşhis XP'ye bakmaz.
   Her sistemin KENDİ seviyesi vardır; ortak olan yalnız tanımdır (ad,
   renk, eşik) ve o tanım TEK KAYNAKTAN dağıtılır — kopyalar elle
   düzenlenmez.
7. **Anlamadığını anlamış gibi yapma.** Belirsiz girdi tahmin edilmez,
   sorulur. Ölçülmemiş bir şey «temiz» diye raporlanmaz.
8. **Kullanıcıya giden metin düzgün Türkçe'dir.** Kod yorumları ASCII
   olabilir; ekranda görünen cümle olamaz.
9. **Aksiyonların üç seviyesi vardır.** Seviyeyi katalog belirler, model
   değil:
   - **küçük** — tek gün, tek kayıt (hedef, bir bloğun saati). Sormadan
     uygulanır, ekranda «Geri al» kalır.
   - **orta** — bir hafta ya da bir dönem (ara haftası, geçici süre
     değişikliği, bölüm kapatma). Önizleme + tek onay.
   - **büyük** — sınav değiştirmek, planı baştan kurmak. Ayrıntılı
     önizleme + onay + geri dönüş noktası.
   Geri alınamayan hiçbir aksiyon küçük sayılamaz. Hangi küçük türlerin
   sormadan uygulanacağını kullanıcı ayarlar; ayar kapalıysa küçük de sorar.
10. **Görsel dil: sade, profesyonel, az metin.** (Kullanıcı, 2026-10-20:
   «görselleştirme birçok şeyi minimalleştirebilir; var olanları bu yöne
   çek, yeni yapılacakları böyle yap.») Bir sayının hedefi varsa cümle
   yerine çizilir: küçük tam sayı hedef → tik sayacı (`GRAFIK.tikHtml`),
   eşik → eşik çubuğu (`GRAFIK.esikCubukHtml`), günün oranı → ince halka;
   gidişat → mini sütun / eğilim (`GRAFIK.egilimHtml`), dağılım → tek
   yığılmış çubuk. Metin yalnız görselin söyleyemediğini söyler (neden,
   ne yapılır). Kurallar: renk ölçüyü ayırır, iyi/kötü yalnız yönü
   bilinen eşikte; gölge, parıltı, süs deseni yok; ince çizgi, bol boşluk,
   tek vurgu rengi. Görsel veri uydurmaz: hedef yoksa halka/çubuk yok,
   girilmemiş gün nokta ya da boşluk (sıfır değil), her görselin
   `aria-label`'ı sayıyı cümleyle söyler.
   **Tek tema: piksel (2026-11-04, depo sahibinin kararı: «tüm sisteme uygula», «buzul temayı sil, sadece bu
   piksel tema kalsın»):** `brand/ortak/piksel.css` ve `piksel.js`: üstte akşam odası, bütün içerik tek kâğıt
   yaprakta. Ekranlar tema bilmez, yalnız jeton değişir. Cam, Yumuşak ve Sade zemin, duvar kâğıdı, Yüzey ve
   minik seçicileri kalktı. Süs sayı üretmez; oda veri okumaz.

11. **Sistem Lego gibi kurulur** (2026-11-04, depo sahibi: «her sayfanın, her özelliğin,
   her yazının bir Lego gibi parça olması lazım»). Dosya `brand/parcalar.txt`'e tek satır,
   tercih `animasyon.js` › `KATALOG`'a tek satır, sayfa/blok/komut/yazı/bilgi/tepki `brand/ortak/parca.js`
   ile kaydedilir. Yeni iş bu kalıpla yazılır; eski ekrana dokunan, onu da kalıba çevirir.

## 2. Denetimler — birleştirmeden önce koşar

```bash
# tek sistem (her biri kendi kodunu doner; CI ayni listeyi kosar)
for f in kabuk/*.test.js motor/*.test.js kalite/*.test.js; do node "$f"; done
for f in king/*_test.py kalite/*_test.py alan/denetle_test.py; do python3 "$f"; done
python3 kalite/katman.py            # katman denetimi (motor/kabuk/alan sinirlari)
python3 kalite/olcum.py --denetle   # karmasiklik ve hiz butcesi (son kayda ve tabana karsi)
python3 tools/tekkapi_test.py       # tek kapi: gecici veri, bos portlar, eski kapi yollari 404
python3 tools/goc_test.py && python3 tools/tekdepo_test.py && python3 tools/tasi_test.py
python3 tools/tools_dizin_kabul_test.py && python3 tools/belge_dizin_kabul_test.py
(cd tools && npm ci) && node tools/kabuk_gez.js   # yeni kabuk gercek tarayicida (Playwright yalniz denetimde)
python3 tools/marka.py --sina        # /marka/ yol muhafizi
python3 tools/marka.py --kunye --denetle && python3 tools/vitrin.py --denetle
cd HKM && python3 -m tests.run && python3 tools/perf.py   # Merkez cekirdegi
python3 uygulama/ios/web_paket_test.py
```

**Kural:** bir değişiklik, dokunduğu sistemin testleri ve duman testi
geçmeden önerilmez. Yeni davranış **testsiz gelmez**; düzeltilen her hata
için önce o hatayı yakalayan bir test yazılır.

**Uçtan uca kural:** `sistem/`, `kabuk/`, `HKM/core/` ya da `HKM/daemon.py`'ye dokunan bir
değişiklik commit'ten önce `python3 tools/tekkapi_test.py` ve `node tools/kabuk_gez.js` koşar
(eski `tools/entegre.js` modüllerle kalktı). Bunlar sistemlerin birbirine değdiği yerlerdir; tek
sistemin testi oradaki kırılmayı görmez. Kırmızı «bilinen aralıklı hata»
diye geçilmez: ya düzeltilir ya da değişikliksiz HEAD'de de kırmızı olduğu
**gösterilir** ve commit mesajına yazılır. Zaten kırmızı bir alarm yeni
kırmızıyı gizler: 2026-10-03'te iki HKM tasarım commit'inden gelen W6
gerilemesi fark edilmeden kaldı; entegre o sırada bir yarış yüzünden zaten
«arada bir kırmızı» idi. CI entegre'yi yalnız push'ta koşar; push
edilmemiş commit CI'dan geçmemiştir. Denetim araçlarının portları
sabittir: iki oturum aynı denetimi aynı anda koşarsa birbirinin
sunucusuyla konuşur. entegre portu doluysa başlamaz (çıkış 2 = koşulamadı,
kırmızı değil); o bitince yeniden koşulur.

## 3. Dal ve birleştirme düzeni

| Kim | Nerede çalışır | Nasıl teslim eder |
|---|---|---|
| Claude Code (bu oturum) | `main` | doğrudan commit + push |
| Diğer ajanlar (Codex vb.) | `gpt/<konu>` dalı | **pull request** |
| Antigravity | `C:\Users\ASUS\LifeOs-ag` klasöründe `ag/<görev>` dalı | dalı push eder; Claude Code gözden geçirip `main`'e alır |

**Antigravity görev düzeni (2026-10-31, depo sahibinin kararı):** Antigravity
yalnız `belgeler/ekip/gorevler/` kuyruğundaki görevleri yapar; akış, sınırlar ve
şablon `belgeler/ekip/gorevler/README.md`'dedir. Asıl klasöre
(`C:\Users\ASUS\LifeOs`) ve çalışan kopyaya dokunmaz; tasarım, `brand/ortak/`,
`sistem/`, King ve §1'e dokunan işler görevde açıkça yazmıyorsa onun değildir.
Aynı gün: Antigravity'yi Claude Code `tools/ajan.py` ile bir ofis gibi
yönetir: Uygulayıcı (görev, kendi klasörü `C:\Users\ASUS\LifeOs-ajan\<görev>` ve
portları `47n1–47n3`), Denetçi (teslim edilen dalı önce inceler), Araştırmacı
(soru). Bir rolün sohbeti boş ve kısa oldukça sonraki iş aynı sohbete gider.
Efor modeli seçer (düşük `flash_lite`, orta `flash`, yüksek `pro`). Koruma
kancası (`tools/ajan_kanca.py`) ajanı klasörüne ve izinli araçlara bağlar.
Ayrıntı ve izleme: `belgeler/ekip/gorevler/README.md`, Görev Takibi.
**Claude Code: ofisi kullanmadan önce `belgeler/ekip/OFIS.md`'yi oku** (tek
sayfa: ne ofise gider, en az çağrılı akış, kalite kuralları, tuzaklar).
Depo sahibinin kararı (2026-10-31): görsel, animasyon ve asıl altyapı dışındaki,
tanımı yazılabilen işlerde **varsayılan ofistir** (token tasarrufu); yasak bölge
`tools/ajan.py` `YASAK_BOLGE` listesinde kodla korunur (OFIS.md §3).

- `main`'e doğrudan push **yalnız** depo sahibinin oturumundan yapılır.
- **Çalışan kopyada geliştirme yapılmaz.** Masaüstü uygulaması (LifeOS.exe)
  depoyu `%USERPROFILE%\LifeOS-Sistem` kopyasından çalıştırır; o kopya
  yalnız «Güncelle» ile ileri sarılır, orada commit yapılmaz. 2026-09-29'da
  orada yapılan dört commit gönderilmeden kaldı, dal ayrıştı ve PC bir hafta
  eski sürümde takıldı (kurtarıldı: 613875c4…87409f24). Ayrışırsa giriş
  sayfası «Yedekle ve güncelle» der: yerel kayıtlar `yedek/yerel-…` dalına.
- Her PR: ne değişti, hangi denetimler koşturuldu, hangi çıktı alındı.
- Çakışma olursa **doktrin kazanır**, sonra testler, sonra tarih sırası.

## 4. Bir bulgu neye benzer

```
dosya:satır · ne yanlış · hangi girdide bozulur · nasıl doğrulanır
```

«Şu daha iyi olurdu» bir bulgu değildir. «Şu girdi ile şu çıktı yanlış»
bir bulgudur. Emin değilsen **«göremedim»** yaz, «yok» yazma: bu depoda
üç tur, var olan özellikler «eksik» diye raporlandı.

## 5. Sık yapılan üç hata

1. **Var olanı yeniden önermek.** `tools/paket.py` çıktısının §2'si modül
   yüzeylerini listeler;
   orada adı geçen şey vardır.
2. **Genel yazılım tavsiyesi.** «Test yazın, CI kurun, tip ekleyin» —
   2 600+ test ve on denetim aracı var; sayılar `README.md`'de ve elle
   yazılmaz, `tools/sayilar.py` üretir.
3. **On yıllık mimari.** Ufuk **dokuz aydır**: her gün kullanılacak bir
   sistem için ne kırılır, o konuşulur.
