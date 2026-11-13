# Faz 7 · A10 cihaz zemini (cihaz başına anahtar, kapı anahtarı)

2026-11-13 · plan A10'un cihazsız kısmı. Canlı hiçbir şey değişmedi: `tekkapi.ETKIN` ve `veri.OKU` kapalı,
Tailscale çalıştırılmadı, gerçek portlarda sunucu açılmadı, gerçek veriye dokunulmadı. İş, hesap sınırına
takılan ilk ajanın diskte bıraktığından devam etti; onun her satırı güvenlik gözüyle yeniden okundu (aşağıda
«Güvenlik notları»), üç düzeltme eklendi.

## Özet

- **Cihaz başına Merkez anahtarı (hesap.py söz 30).** Admin hesabıyla girmiş cihaz artık Merkez'in ortak
  jetonunu (HKM `local_token`) almıyor. `/api/hesap/merkez` cihaza **kendi oturumuna bağlı** bir anahtar
  verir; cihaz Merkez'e/King'e hesap sunucusunun `/api/hesap/hkm/api/...` yolundan gider. Sunucu anahtarı
  oturuma çevirir, isteği bilgisayardaki Merkez'e ortak jetonla iletir. Ortak jeton bilgisayardan çıkmaz.
- **Tek dokunuşla geri alma.** Hesap › Cihazlar'dan çıkarılan cihazın oturumu silinir; Merkez anahtarı aynı
  satırda durduğu için o da ölür. Sonraki istek (eşitleme, gelen kutusu, Merkez/King) 401. Öbür cihazlar ve
  bilgisayar etkilenmez.
- **Kapı anahtarı (uzak.py).** `uzak.KAPILAR` bayrak kapalıyken bugünkü dört kapı (5173, 5183, 5193, 443→4200);
  `tekkapi.ETKIN` açılınca yalnız `443 → 4180`, eski üç kapı da `serve ... off` ile kapanır.
- İstemci (`brand/ortak/hesap.js`) en az değişiklikle: admin cihaz kendi anahtarını alır, ortak jetonu tutan
  eski admin cihaz bir kez kendiliğinden geçer. Eski istemci sözleşmesi korunur (`{url, token, adres}`).

## Bugünkü kimlik haritası

Değişiklikten önce bir cihaz üç ayrı sırla tanınıyordu:

| Sır | Nerede üretilir, nerede saklanır | Neyi açar | Cihaz çıkarılınca |
|---|---|---|---|
| **Oturum jetonu** (cihaz başına) | `giris`/`kur`te `secrets`; sunucuda yalnız SHA-256 özeti (`oturum.ozet`); cihazda `lifeos_hesap` çerezi (JS okur, `SameSite=Strict`, https'te `Secure`; kapılar arası ortak, çünkü çerez porta bağlı değil) | Eşitleme, gelen kutusu, Hesap sayfası, admin işleri | Satır silinir → sonraki istek 401 (zaten doğruydu) |
| **Merkez jetonu** (TEK, ortak) | `HKM/config.json` `local_token`, düz metin. Bilgisayardaki modüller HKM `/api/pair` ile alır (yalnız yerel). Uzak cihaz `/api/hesap/merkez` (admin oturumu) ya da `/api/uzak/merkez` (hesapsız, Tailscale sahibi kimliği) ile alıyordu; her modül kökeninin HKM ayarında (localStorage) durur | Merkez'in her ucu (King, kayıt, ses, yedek, ofis…) | **Hiçbir şey olmuyordu.** Tek yol cihazı Tailscale'den çıkarmak ya da jetonu değiştirmek (o da herkesi keser) |
| Erişim anahtarları (söz 16/21), takvim adresi (söz 17) | Cihazdan bağımsız, kullanıcı başına; özeti saklanır | Kısayollar/Siri, takvim aboneliği | Etkilenmez (cihaza değil kullanıcıya bağlı; kendi sayfasından yenilenir) |

Tek ortak sır Merkez jetonuydu (`her-yerden-erisim.md`: «Merkez jetonu cihaz başına değil, tek»).

## Cihaz başına anahtar

**Anahtar.** `Depo.merkez_anahtari(oturum_jetonu)` = `base64url(HMAC-SHA256(anahtar=oturum_jetonu,
"lifeos-merkez-anahtari"))`, 43 karakter. Sunucuda yalnız SHA-256 özeti `oturum.merkez` sütununda durur
(göç: `_gocur` her açılışta eksik sütunu ekler; sürüm kapısı yok, eski depo da alır). Anahtar oturum
jetonundan türer ama onu vermez (HMAC tek yönlü); oturum jetonu da Merkez anahtarı yerine geçmez (ayrı sütun,
ayrı özet, test eder).

**Neden HMAC, neden rastgele değil.** İlk ajan her alışta yeni rastgele anahtar üretip eskisini öldürüyordu.
Oturum çerezi üç modül kapısında ortak olduğundan (5173/5183/5193 aynı ana makine) üç modül aynı oturumla ayrı
ayrı anahtar ister; her biri öncekini öldürür ve modüller birbirini sonsuza dek 401'e düşürürdü. HMAC ile aynı
oturum hep aynı anahtarı alır; üç modül aynı anahtarı paylaşır. Geri alma yine oturumun silinmesiyle olur.

**Yol.** `/api/hesap/hkm/<HKM'nin /api/... yolu>` (`hesap.HKM_YOL`). `_merkez_ilet`:
1. Yalnız GET/POST; yol `HKM_ILET_RE` ile: `/api/` + harf/rakam/`_-.` bölümleri, bölüm `.` ile başlayamaz
   (`..` yok), `%` yok, boş bölüm yok; `/api/pair...` hiç geçmez (HKM eşlemesi jetonu verir). Aksi 404.
2. `/api/health` dışında: `Authorization: Bearer <anahtar>` → `merkez_oturum` → oturum yoksa ya da süresi
   dolmuşsa 401; hesap artık admin değilse 403.
3. Gövde: `Content-Length` sayı değilse ya da eksiyse 400, 24 MB üstü 413; okunur.
4. İstek `hkm_hedef()`'e (bugün `HKM/config.json`'dan `127.0.0.1:<port>/api`; tek kapıda aynı sürecin
   `/api/hkm`'si) ortak jetonla ve `X-Forwarded-For` ile iletilir: HKM onu «yerel» saymaz, eşleme kapısı
   ayrıca reddeder. Cihazın anahtarı Merkez'e gitmez.
5. Cevaptan yalnız kod, `Content-Type`, gövde döner (`Cache-Control: no-store`, CORS yalnız uygulama
   kökenine). Merkez kapalıysa 503.

**Uç.** `/api/hesap/merkez` (admin, POST, X-LifeOS) artık `{url: adres+HKM_YOL, yol: HKM_YOL, adres,
token: <cihaz anahtarı>}` döner; ortak jeton bu cevapta yok.

**İstemci.** `merkezBagla`: admin oturumu varsa (özel ağda da) `/api/hesap/merkez`'den kendi anahtarını
alır; `yol` geldiyse adresi isteklerin gittiği sunucuya ekler (uygulamada `v.adres`, tarayıcıda sayfanın kendi
kökeni: aynı köken, CORS gerekmez). Hesapsız özel ağ cihazı eskisi gibi `/api/uzak/merkez`.

**Bilgisayar.** Hiç değişmedi: modüller HKM'ye `127.0.0.1:4200`'den, `/api/pair` ile aldıkları jetonla gider
(`pcMi()` bu yolu hiç denemez). Bilgisayarın oturumu uzaktan kapatılsa bile şifreyle yeniden girer ve
saldırgan cihazı çıkarır (test eder); Merkez erişimi oturuma bağlı değil.

## Geri alma

«Cihazı çıkar» (`cihaz_cikar`) oturum satırını siler. Bir sonraki istekte o cihaz için geçersiz olanlar:

- oturum jetonu: eşitleme, ayar eşitleme, gelen kutusu, yayın, profil, cihazlar, yedek, göç paketi… (test 33
  korumalı uçta 401'i tek tek dener);
- Merkez anahtarı: `/api/hesap/hkm/...` 401, istek Merkez'e hiç ulaşmaz (test sayar).

Aynı etki: çıkış, «öteki cihazlardan çık», şifre değişince öteki oturumlar, kurtarma/yedekten dönüş (bütün
oturumlar), 400 gün kullanılmayan oturum. Admin'likten indirilen hesabın anahtarı 403 alır.

**Geri almanın kesmediği:** ortak jetonu daha önce almış bir cihazdaki kopya (bkz. Uyumluluk) ve hesapsız
Tailscale yolu. Bunlar yalnız Tailscale'den çıkarmakla ya da Merkez jetonunu bir kez değiştirmekle kesilir.

## Uyumluluk

Kural: **eski cihaz, çıkarılana ya da yeniden bağlanana kadar çalışır; yeni anahtara kendiliğinden geçer.**

- Yeni istemci + admin oturumu + ortak jeton kayıtlı (adres `HKM_YOL` ile bitmiyor): oturum başına bir kez kendi
  anahtarını alır, ortak jetonun üzerine yazar.
- Eski istemci (önbellekteki eski dist): Merkez 401 verince `/api/hesap/merkez`'i yeniden ister, yeni cevaptaki
  `url` (https, `adres + HKM_YOL`) ve `token` ile olduğu gibi çalışır, çünkü istemciler `url + '/api/...'` kurar.
  Cevabın alanları aynı (`url`, `token`, `adres`); yalnız `yol` eklendi.
- Ortak jeton HKM'de geçerli kalır: o jetonu tutan eski cihazlar Tailscale üzerinden HKM'ye doğrudan gitmeyi
  sürdürür (bilinçli: bayrak açılmadan kimse kesilmesin). Kesmek için: Tailscale'den çıkarma ya da tek seferlik
  jeton değişimi (Açık sorular 1).
- Bilgisayar, hesapsız özel ağ yolu, erişim anahtarları, takvim: değişmedi.
- Depo: yeni sütun eklenir, eski satırlarda boş; boş sütun hiçbir anahtarla eşleşmez.

## Kapı anahtarı

`sistem/uzak.py`:

- `KAPILAR`, `HESAP_KAPI` bugünkü değerleriyle kaldı (kalite/olcum.py onları çalıştırmadan okur).
  `ESKI_KAPILAR` (aynı dört kapı), `TEK_KAPILAR = {443: 4180}`.
- `kapilari_sec(tek)`: `tek` ise `KAPILAR = {443: 4180}`, `HESAP_KAPI = 443`; değilse bugünkü.
- `sistem/tekkapi.py` içe aktarılınca `uzak.kapilari_sec(ETKIN)` çağrılır. `ETKIN = False` olduğu sürece sonuç
  bugünkü dört kapı; tek kapı deneme kapısı (`--port`) da bunu değiştirmez. `python sistem/uzak.py --ac`
  da bayrağı okur.
- `ac()`: açtıktan sonra `ESKI_KAPILAR`'da olup `KAPILAR`'da olmayan kapıları `serve --https=N off` ile kapatır
  (bayrak kapalıyken bu küme boş: davranış bugünkü). `kapat()`: bugünkü kapılar + eski artıklar.
- `merkez()`: `adres` 443'te portsuz (`https://pc...ts.net`).
- `_hkm_ayni_surecte` (tekkapi): hesap.py'nin Merkez yolu tek kapıda aynı sürecin `/api/hkm`'sine gider, 4200'e
  değil (deneme kapısı da sahibin çalışan Merkez'ine istek atmaz).

Bayrak açılınca `durum()` yalnız 443→4180'e bakar; `_kokenleri_yaz` `.ts.net` kökeni yazmaz (tek köken, çapraz
köken yok).

## Testler

- `HKM/tests/test_hesap.py` (+2 test): **söz 30 depo**: iki cihaz iki ayrı anahtar; aynı oturum aynı anahtar;
  anahtar ≠ oturum jetonu, ikisi birbirinin yerine geçmez; yalnız özet saklanır; cihaz listesinde ne anahtar ne
  özeti; telefonu çıkar → telefonun ikisi ölür, tablet ve PC sürer; tablet «ötekilerden çık» dese de PC şifreyle
  döner ve tableti çıkarır. **HTTP söz 30**: gerçek modül sunucusu + sahte Merkez; iki cihaz Tailscale vekilinden
  (X-Forwarded-For) girer, anahtar alır; cevapta ortak jeton yok; iletilen istek Merkez'e ortak jetonla, vekil
  işaretli, gövdesi aynen; sağlık anahtarsız; anahtarsız/oturum jetonuyla/ortak jetonla 401; `/api/pair`,
  `..`, `//`, `/king` 404 ve Merkez'e ulaşmaz; telefon çıkarılınca Merkez yolu + 32 korumalı uç 401; tablet
  sürer; aynı cihazın ikinci modülü aynı anahtarı alır; eksi `Content-Length` 400; üyeye indirilen admin 403;
  PC'nin yalnız-bu-bilgisayar ucu sürer; sunucu günlüğünde hiçbir sır yok.
- `HKM/tests/test_uzak.py` (+1 test): bayrak kapalı → dört kapı, `ac()` hiçbir kapı kapatmaz, `kapat()` bugünkü
  sırayla; `kapilari_sec(True)` → yalnız 443→4180 açılır, 5173/5183/5193 kapanır, `durum` açık sayar, `kapat`
  dördünü kapatır, adres portsuz, köken listesinde `.ts.net` kalmaz; geri alınca bugünkü değerler.
- `brand/ortak/hesap.test.js` (`_merkezBagla`): cihaz anahtarı ve adresin sayfa kökeni + `/api/hesap/hkm`
  olması; bağ varken yeniden istememe; 401'de yeniden isteme; ortak jetonlu eski cihazın bir kez geçişi; özel
  ağda hesaplı cihazın da kendi anahtarını alması; hesapsız özel ağ yolunun aynen kalması.
- Sonuçlar (2026-11-13, bu kopyada):
  - `cd HKM && python -m tests.run`: **1096/1096 geçti** (yeni 3 test dahil).
  - `python tools/tekkapi_test.py`: **106/106 yeşil** (tek kapı HKM'yi aynı sürece alırken yeni `hkm_hedef`
    satırı da çalışır).
  - `python tools/ortak.py --yay` → `--denetle`: kopyalar kaynakla aynı (227 dosya, 678 kopya); üç modül
    `python build.py` + `build.py --denetle`: AYS, SPİ, ESP temiz.
  - `node tools/runtests.js` (SPİ, hesap.test.js dahil): **3269/3269 geçti**.

## Güvenlik notları (satır satır)

Önceki ajanın bıraktığı ve bu turda eklenen her satır okundu.

1. `merkez_anahtari` — ilk hali her alışta rastgele yeni anahtar yazıp eskisini öldürüyordu; çerez kapılar arası
   ortak olduğu için üç modül birbirini 401'e düşürecekti. **Düzeltildi:** HMAC-SHA256(oturum jetonu), aynı
   oturum aynı anahtar. Anahtar oturum jetonunu açığa vermez; oturum jetonu anahtar yerine geçmez.
2. `merkez_anahtari` UPDATE `WHERE ozet=özet(oturum jetonu)`; satır yoksa 401. Çağıran uç önce `oturum()` ile
   doğruluyor ve `_admin` istiyor; boş jeton hiçbir satırla eşleşmez.
3. Saklama: yalnız SHA-256 özeti (`oturum.merkez`); düz anahtar diskte, günlükte, cihaz listesinde yok (test).
   Ortak jeton zaten `HKM/config.json`'da düz metin; bu iş onu çoğaltmadı.
4. Karşılaştırma: anahtar `WHERE merkez=?` ile SHA-256 özetinden aranır (oturum jetonuyla aynı desen). Özet
   üzerinden arama zamanlama sızıntısı vermez (saldırgan özetin önekini seçemez); `hmac.compare_digest`
   gerekmiyor. `_oturum_bul`'daki `%s` yalnız koddaki iki sabit sütun adı (`ozet`, `merkez`), kullanıcıdan gelmez.
5. `_oturum_bul` — eski `oturum()` davranışı birebir: 200 karakter sınırı, 400 gün süresi dolanı siler, `son` ve
   `ip` günceller. Merkez anahtarıyla gelen istek de oturumu canlı tutar (cihaz kullanılıyor demek).
6. `_merkez_ilet` yöntem/yol: yalnız GET/POST, `HKM_ILET_RE` (`..`, `%`, `//`, sondaki `/` yok); `/api/pair`,
   `/api/pair/status`, `/api/pair/open` geçmez. Hedef adres sabit önek + `/` ile başlayan yol: ana makine
   değiştirilemez. Sorgu dizgisi aynen geçer (yola etkisi yok).
7. Kimlik: sağlık dışında anahtar şart; oturum yoksa 401. **Eklendi:** hesap admin değilse 403 (uç yalnız
   admine anahtar veriyor; sonradan üyeye indirilen hesap da kesilsin).
8. Gövde: **eklendi** eksi `Content-Length` 400 (`rfile.read(-1)` bağlantı kapanana dek iş parçacığını
   bekletirdi). Üst sınır 24 MB. Kimliksiz istekte gövde hiç okunmaz. (Aynı eksi değer `_govde`'de de var,
   değişmedi; orada da yalnız bir iş parçacığı bekler, istemci zaten yavaş gövdeyle aynısını yapabilir.)
9. İletme: ortak jeton yalnız sunucudan Merkez'e (127.0.0.1) gider; cihazın anahtarı Merkez'e gitmez.
   `X-Forwarded-For` Merkez'in «yerel» denetimlerini kapatır (eşleme ikinci kez reddedilir). Başlık değerlerinde
   satır sonu olamaz; geçersiz değer `ValueError` → 503.
10. Cevap: yalnız kod, `Content-Type`, gövde; Merkez'in öbür başlıkları (çerez vb.) geçmez; `no-store`; CORS yalnız
    `UYGULAMA_KOKENLERI`. Yabancı köken `_koken_izinli` ile 403. Kimlik çerez değil başlık olduğu için CSRF yok.
11. Sağlık ucu (`/api/health`) anahtarsız; HKM'de de öyle. Döndürdüğü: `ok`, `service`, başlangıç zamanı, model
    hali. Hesap sunucusu ev ağı kapısında da dinlediği için bu bilgi artık ev ağından da görünür (düşük önem).
12. Günlük: sunucu yalnız 2xx/3xx dışını yazar, istek satırını `gunluk_maskele` ile; anahtar başlıkta, istek
    satırında değil. Test, sunucunun stderr'inde hiçbir sırrın (ortak jeton, iki cihazın anahtarı ve oturumu,
    üyeye indirilen hesabın anahtarı) geçmediğini denetler.
13. İstemci: anahtar modülün HKM ayarına (localStorage, köken başına) yazılır; ortak jeton da eskiden aynı yere
    yazılıyordu, yani yeni bir saklama yeri açılmadı. Oturum jetonu localStorage'a yazılmaz. Sızan anahtar yalnız
    Merkez'i açar, hesabı açmaz (en az yetki); cihaz çıkarılınca ölür.
14. Bilgisayar kilitlenmez: PC'nin Merkez yolu oturuma bağlı değil; yalnız-bu-bilgisayar uçları `_yerel_mi`
    (vekil `VEKIL_IP` olarak işaretli); uzaktan «ötekilerden çık» denirse PC şifreyle döner (test).
15. `/api/hesap/merkez` cevabında artık ortak jeton yok (test). `uzak.merkez()` hâlâ jetonu okuyor (erişim
    kapalı/jeton boşsa None) ama hesap ucu yalnız `adres`'i kullanır.
16. `kapilari_sec`: bayrak kapalıyken `ac()`'ın kapattığı küme boş, `kapat()` aynı dört kapı aynı sırada (test).
    Açıkken eski kapılar kapanır: boşa düşen 4173/4183/4193'e ileride başka bir şey bağlanırsa özel ağa açık
    kalmasın.
17. `tekkapi._hkm_ayni_surecte`: hesap.py'nin Merkez yolu aynı sürecin `/api/hkm`'sine gider; istek
    `X-Forwarded-For` taşıdığı için tek kapı onu vekil sayar, HKM eşlemeyi yine reddeder.

## Cihazla denenecekler

Yalnız gerçek telefon/tabletle kanıtlanır (Samsung, iPad, gerçek iPhone):

1. Admin telefon Tailscale adresinden açılınca King cevabı `/api/hesap/hkm/...` yolundan gelir (ağ sekmesi);
   üç modül (AYS, SPİ, ESP) aynı anahtarı paylaşır, biri açılınca öbürü 401'e düşmez.
2. Hesap › Cihazlar'dan telefonu bilgisayardan çıkar: telefonda bir sonraki King isteği ve eşitleme reddedilir,
   tablet çalışmayı sürdürür.
3. Ortak jetonu tutan eski kurulu telefon, yeni sürüm gelince kendi anahtarına bir kez geçer (HKM ayarındaki
   adres `/api/hesap/hkm` ile biter).
4. iPhone kabuğu (yerel uygulama): adres `v.adres` (Tailscale) olur; ev ağı adresiyle girmiş olsa da çerez
   her yerde geçen adrese döner.
5. Ev ağı kapısında (kendi CA, 5183) aynı yol: sayfa kökeni https olduğu için anahtar orada da çalışır.
6. Bayrak açıldığında (P6): `tailscale serve status`'ta yalnız 443→4180; eski üç kapı yok.

## Açık sorular

1. **Ortak jetonun emekliye ayrılması.** Ortak jetonu daha önce almış cihazlar (ve hesapsız Tailscale yolu)
   Merkez'e doğrudan gitmeye devam ediyor; «cihazı çıkar» onları kesmez. Öneri: P6'da bayrak açılırken
   `local_token` bir kez yenilensin. Admin cihazlar 401 alıp kendi anahtarlarına kendiliğinden geçer; bilgisayar
   modülleri `/api/pair` ile yeniden eşleşir (bunun kendiliğinden olduğu ayrıca doğrulanmalı). Sahibin kararı.
2. **Hesapsız Tailscale yolu (`/api/uzak/merkez`).** Bugün bilgisayarın Tailscale sahibine ortak jetonu verir;
   cihaz başına değil, Hesap › Cihazlar'da da görünmez. Bayrak açıkken bu yolun Merkez adresi de eşleşmez
   (Merkez tek kapıda `/api/hkm/` altında, eski istemci `url + '/api/...'` kurar). Öneri: tek kapıda bu yol
   kapansın, cihaz admin hesabıyla girip kendi anahtarını alsın. Karar gerekiyor; kod değişmedi.
3. **Tek kapı ucuna uçtan uca test.** Kapandı (2026-11-13): `tools/tekkapi_test.py` «Merkez iletme yolu» bölümü tek kapıyı
   geçici veriyle açar, yerelden admin kurar, anahtarı aynı hesap.db'de `merkez_anahtari` ile alır ve zinciri dener: anahtarla
   üç okuma ortak jetonla aynı gövdeyi verir; anahtarsız, oturum jetonuyla ya da ortak jetonla 401; `/api/pair`, `..`, PUT
   iletilmez; POST gövdesi Merkez'in kendi cevabını alır; çıkıştan sonra anahtar 401. 19 denetim, ölçüldü (125/125 yeşil).
4. **Eski «sertifika» yolu (telefon.py, kendi CA).** Plan gereği emekliye ayrılacak; bu işte dokunulmadı. Ev ağı
   kapısı kapanınca sağlık ucunun ev ağına görünmesi de (not 11) kendiliğinden biter.
