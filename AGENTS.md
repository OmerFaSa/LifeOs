# Bu depoda çalışan her ajan için kurallar

> Bu dosya insan için değil, **ajanlar** için yazıldı (Codex `AGENTS.md`
> okur; Claude Code da bunu okuyor). Amacı tek: iki farklı ajan aynı depoda
> çalışırken birbirinin işini bozmasın ve depo doktrini her turda yeniden
> anlatılmak zorunda kalmasın.

## 0. Otuz saniyede depo

Dört bağımsız sistem: **AYS** (sınav), **SPİ** (sağlık), **ESP** (gelişim)
tarayıcıda çalışan sıfır bağımlılıklı tek sayfa uygulamalarıdır; **HKM**
onların yanında duran isteğe bağlı bir Python servisidir. Ayrıntı:
`README.md` (kısa), `belgeler/TEKNIK.md` (ayrıntı) ve her sistemin `MIMARI.md`'si. Dış inceleme için hazır özet
`python3 tools/paket.py` ile ÜRETİLİR (`PAKET.md`); depoda durmaz, çünkü
üretilmiş bir dosya bir gün kaynağıyla ayrışır.

**Kök klasör sade kalır** (depo sahibinin isteği): kökte yalnız
`BASLAT.bat`, `GUNCELLE.bat`, `README.md`, `AGENTS.md` ve klasörler
durur. Başlatıcı, sunucu, güncelleyici `sistem/`; belge, rapor, ekip
notu `belgeler/`. Köke yeni dosya eklenmez.

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
   **Bağlantılar (2026-10-08, depo sahibinin isteği):** iki adımlı
   doğrulama (TOTP, yedek kodlar), kodla cihaz bağlama, erişim anahtarıyla
   gelen kutusu (iPhone Kısayollar, Home Assistant) ve takvim aboneliği de
   aynı sunucudadır (`sistem/hesap.py` sözleri 14–17). Gelen satırı sunucu
   anlamaz ve hiçbir modüle yazmaz; satırı yalnız gönderildiği modül
   (AYS, SPİ, ESP) alır ve kendi koduyla Onaylar'a öneri yapar; ölçüm
   onaysız yazılmaz. Takvimi modül üretir (AYS, ESP), sunucu yalnız
   birleştirip sunar. Hesap deposu her gün yedeklenir; geri yükleme büyük
   aksiyondur ve cihazların sonraki değişikliğini ezmez (sunucu sözü 20).
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
   **Cam ve sıcak ışık istisnası (2026-10-27, depo sahibinin kararı:
   «sıcak ışıklar, yansımalar… tasarımı değiştirme pahasına izin
   veriyorum»):** yüzey dili `brand/ortak/cam.css`'tir (süzülen cam kart,
   kalın cam plaka, yüzen kenar). Parıltı yalnız orada sayılı üç yerde
   ve duran ışıktır: zemin altındaki sıcak ışık ve yansıma çizgisi, cam
   kartın alt kenarındaki sıcak yansıma, dolu çubuk ile ana düğmenin
   hâlesi. Sürekli oynayan parıltı yine yok; renk yine ölçüyü ayırır.
   «Sade» zeminde bu katmanın hiçbiri çalışmaz.

## 2. Denetimler — birleştirmeden önce koşar

```bash
# depo koku: tek kaynaktan yayilan iki sey
python3 tools/seviye.py --yay        # brand/seviye/ -> uc arayuz
python3 tools/seviye.py --denetle    # kopyalar kaynakla ayni mi (CI de kosar)
python3 tools/ortak.py --yay         # brand/ortak/  -> uc arayuze
python3 tools/ortak.py --denetle     # kopyalar kaynakla ayni mi (CI de kosar)
python3 tools/marka.py --kunye       # brand/medya/ -> brand/ortak/medya.js
python3 tools/marka.py --kunye --denetle   # kunye taze mi (CI de kosar)
python3 tools/marka.py --sina        # ad kurali ve yol muhafizi (CI de kosar)
python3 tools/vitrin.py              # belgeler/ekip/vitrin.html -> brand/ortak/vitrin.css (kart bicimi)
python3 tools/vitrin.py --denetle    # vitrin.css vitrinle ayni mi (CI de kosar)
python3 tools/rutbe.py <klasor>      # rutbe gorsellerini medya/'ya isler (kayipsiz)
python3 tools/rutbe.py --liste       # medya/ altinda ne var
python3 tools/rutbe.py --eksik       # katalog ne bekliyor da yok (node ile)
python3 tools/yazi.py --denetle      # ekran basliklari: cumle duzeni, «&» yok, emoji ve ic terim yok
python3 tools/olucss.py              # hicbir ogeye uyamayan CSS kurali (--sil ile siler, sonra --yay + build)
node tools/pusula.js                 # Kolay LifeOS pusulasi: iyi gun kaydi eylem sayisi, Bugun ve menu (belgeler/ekip/KOLAY-PLANI.md)

# her sistem kendi dizininde
node tools/runtests.js      # birim testleri
node tools/smoke.js         # uygulamayı gerçekten açar, ekranları gezer
node tools/a11ycheck.js     # erişilebilirlik
node tools/layoutcheck.js   # 390 pikselde taşma ve 24px dokunma hedefi
node tools/palettecheck.js  # bütün paletlerde kontrast
node tools/perfcheck.js     # dokuz aylık veriyle çizim bütçesi
node tools/loadcheck.js     # BEŞ YILLIK veriyle çizim (ağır; haftalık CI işi)

# depo koku: kapsam OLCULUR, elle yazilmaz
node tools/kapsam.js                # uc arayuzun islev kapsami
node tools/kapsam.js AYS --ayrinti  # hangi islev hic kosmadi
node tools/kapsam.js --esik 40      # esigin alti KIRMIZI (cikis 1)

# HKM
cd HKM && python3 -m tests.run && python3 tools/perf.py && node tools/yuz.js

# depo kökü: hepsi + belgelerdeki sayıları tazeler
python3 tools/sayilar.py --tam --yaz
node tools/entegre.js       # üç arayüz + HKM uçtan uca
node tools/portmuhafiz.test.js  # sabit portlu her denetim port doluysa başlamaz (çıkış 2)
```

**Kural:** bir değişiklik, dokunduğu sistemin testleri ve duman testi
geçmeden önerilmez. Yeni davranış **testsiz gelmez**; düzeltilen her hata
için önce o hatayı yakalayan bir test yazılır.

**Uçtan uca kural:** `brand/ortak/`, `HKM/core/`, `HKM/daemon.py` ya da
`HKM/web/`'e dokunan bir değişiklik commit'ten önce `node tools/entegre.js`
koşar (~1,5 dk). Bunlar sistemlerin birbirine değdiği yerlerdir; tek
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
