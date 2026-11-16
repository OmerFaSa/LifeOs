# Tur 2026-11-16b · Ekran içerikleri, dil ve eksikler

Sahip: içerik paketi ajanı. Dal `sadelesme`, commit yok. Sahibin isteği: «arayüzler hâlâ çok karmaşık ve anlaşılmaz; çok daha minimalist; eksikleri tamamla».

## Durum
- [x] 1 Adlandırma (LifeOS → Başbuğ, yalnız görünür metin; `lifeos.*` anahtarları, `X-LifeOS` başlıkları, yollar aynı kaldı)
- [x] 2 Dil temizliği (benim dosyalarımda; kabuk.js'e düşenler aşağıda «Açık kalanlar»da)
- [x] 3 Yönetim ayrımı + Tekrar çelişkisi
- [x] 4 Yazılanlar kaybolmasın (hızlı not, ayrıntılı not, Kayıt formu, King; King'de hata → metin geri + «Tekrar dene»)
- [x] 5 Plan çelişkisi (Gün ve Hafta tek kaynak)
- [x] 6 Sağlık panosu (yeni `kabuk/saglik.js`)
- [x] 7 Tahlil kaydı (`motor/kayit.js`)
- [x] Testler, görseller, işlev denetimi

## Değişen dosyalar
| Dosya | Ne |
|---|---|
| `kabuk/harita.js` | Yalnız metin: Onaylar → **Yönetim** («Ders onayları ve sistemin senden beklediği birkaç iş»); Hesap açıklamasından kalkmış `/kartlar/`; Kayıt «Su, öğün, uyku, hareket, tahlil»; Not «Her yerden açılan defter». |
| `kabuk/onay.js` | Yönetim sayfası; Bugün satırı kalktı. |
| `kabuk/king-sohbet.js` (+test) | Seçici yok, kaynak satırı yok, taslak, hata → metin geri + Tekrar dene. |
| `kabuk/ayar.js` | Yeni **King** grubu: «King’i kim cevaplasın» (Otomatik / Antigravity / Claude; `lifeos.king.saglayici`, King ekranından taşındı). Yazı tipi açıklaması «Uygulamadaki yazıların tipi.» (eski «Başlıklar her zaman piksel kalır» eskimişti). Ses satırlarına dokunulmadı. |
| `kabuk/araclar.js` | Taslaklar, plan tek kaynak, Tekrar boş iletisi, Kayıt tür bağlantısı + tahlil formu, metinler. |
| `kabuk/saglik.js` + `saglik.test.js` (yeni) | Sağlık panosu, `Kabuk.ek.saglik`. |
| `kabuk/index.html` | Yalnız `<script src="saglik.js">` satırı (onay.js'in ardından, kabuk.js'ten önce). |
| `kabuk/hesap*.js` (+testler) | Başbuğ; «Admin» → «Yönetici»; ekrandaki `python …` komutları kalktı; Bağlantılar'dan AYS/SPİ/ESP. |
| `kabuk/deneme.js`, `kabuk/acilis.js` | «LifeOS sunucusundan aç» → «Sayfayı yenile; sürerse Başbuğ’u kapatıp yeniden aç.»; açılış videosu satırı Başbuğ. |
| `motor/kayit.js` (+test) | `tahlil` türü, `TAHLIL_SIK`, `tahliller()`. |
| `kabuk/depo.test.js` | Yalnız AYARLAR listesine `lifeos.king.taslak`, `lifeos.taslak`. |
| `belgeler/DIZIN.md` | Bu raporun satırı. |

## 1 · Adlandırma
Benim dosyalarımdaki görünür «LifeOS»lar «Başbuğ» oldu (hesap, hesap-giris, hesap-yonetim, hesap-baglanti, deneme, acilis, araclar, onay). Yedek klasörü örneği `E:\Basbug-yedek`. Dokunulmayanlar: `lifeos.*` depo anahtarları, `X-LifeOS` başlığı, `lifeos-onay-*.json` dosya adı, `otpauth://…LifeOS` (sunucunun ürettiği kimlik; değişirse kayıtlı doğrulayıcılar bozulur), yorumlar.

## 2 · Dil
- «N alan taşındı» (Yol haritası) → «Her alanın aşamaları, üniteleri ve dersleri.»
- «havuzda N soru var» (Soru) → «Açtığın ünitelerden karışık N soru.»
- «AYS ve SPİ'den / AYS'den gelen…» (Plan, Soru eski kayıtlar) → «Önceki uygulamadan gelen…»
- King: «Cevaplayan» seçicisi Ayarlar › King'e gitti; «Kaynak: sağlayıcı · model · sn» ve köprü notu yazılmaz (depodaki eski «Kaynak:» satırları da süzülür); model konuşamadıysa tek satır «Şu an yalnız kısa cevap verebiliyorum.»; «Merkez cevap vermedi / Merkez'e ulaşılamadı» → «King şu an cevap veremedi» / «King’e ulaşılamadı. Bilgisayar açık mı?».
- Hesap: «Admin» → «Yönetici» (rol değeri `admin` aynı); `python sistem/hesap.py --iki-adim-kapat …` → «hesabın bilgisayarın kendisinden kurtarılır. Yedek kodlarını güvenli bir yerde sakla.»; `python sistem/hesap.py --geri-yukle` cümlesi kalktı.
- Hesap › Bağlantılar: AYS/SPİ/ESP sözleri kalktı; «AYS ve ESP’ye» tarifi silindi (modüller kalktı); gelen satırı «Onay bekliyor / Sırada»; boş durum «Satır Gelen kutusunda bekler, sen onaylayınca yazılır.».
- Yönetim: «Senin adımın» yazım hatası → «Senin adımların»; `python sistem/uzak.py --ac` → «Hesap › Her yerden erişim › Aç».
- **Kesinlik etiketleri (AGENTS §1.2) bilerek bırakıldı.** Bulguda «ölçüldü», «tahmin» de geliştirici dili sayılmış; ama §1.2 bir sözleşme ve `kabuk_gez` «etiketler gizlenmez» diye denetliyor. Yalnız kişinin ölçümü olmayan sayılardan (Yönetim'deki ders/mesaj sayıları) kaldırdım. **Sahibe karar:** «ölçüldü varsayılandır, yazılmaz; yalnız tahmin / hesaplandı / veri yok / eski kayıt yazılır» kuralı istenirse §1.2 değişir, sonra `bilesen.sayilar` + gezi denetimleri buna göre güncellenir.

## 3 · Yönetim ve Tekrar
- `#/onay` artık **Yönetim**: başlık «Sistemin senden beklediği işler. Acelesi yok.»; «Ders onayları» bölümünde düz cümle «544 ders onayını bekliyor, 0 ders onaylı. Taslak dersi okuyabilirsin; onaylayınca tekrara girer.» ve alan listesi («Aşama 1: 0/9 onaylı · …», sağda «18 bekliyor»). Altında üç **kapalı** açılır: «Senin adımların», «Onayları sakla», «King’in anlamasını iyileştir» (eski «Ölçüm için etiketle»; düğmeler «Mesajları işaretle», «Aramaları işaretle»; sayılar artık kesinlik rozetli sayı kutusu değil, tek cümle).
- Bugün: `Kabuk.onayBugun` tanımı kalktı → kabuk.js `Kabuk.onayBugun ? … : ''` boş çizer. `/api/kabuk/taslak` isteği de kalktı (sunucu ucu artık kullanılmıyor; kaldırmak altyapı paketinin işi).
- Tekrar çelişkisi: AGENTS §0.1 «onaysız içerik tekrara girmez» olduğu için taslak soruları sıraya almadım; **ileti gerçeği söylüyor**: sıra boşken kapıda kalınan soru varsa «Bugün tekrar sırası boş. Kapıda kalınan N soru aşağıda; cevaplarını oradan görürsün. Ders onaylanınca bu sorular da tekrara girer.» Kapının «N soru Tekrar'a düştü» cümlesi (kabuk.js) böylece doğru kalıyor.

## 4 · Yazılanlar kaybolmasın
- `araclar.js`: `data-taslak="<ad>"` taşıyan formun yazı alanları her tuşta `lifeos.taslak`'a (ayar deposu, localStorage; tek depoya eşitlenmez) yazılır, çizim oradan doldurur, kaydedilince silinir. Formlar: hızlı not (`not-hizli`), ayrıntılı not (`not:<id|yeni>`, geri gelince «Kaydedilmemiş yazın geri geldi.»), Kayıt (`kayit:<tür>`). Not silinince taslağı da silinir.
- `king-sohbet.js`: `lifeos.king.taslak`. Gönderince silinir; hata (HTTP ≥ 400 ya da ağ) → «ben» mesajı konuşmadan çıkar, metin kutuya ve taslağa döner, «Yazdığın kutuda duruyor.» + **Tekrar dene**.
- `depo.test.js` AYARLAR listesine iki anahtar eklendi.

## 5 · Plan tek kaynak
`bugunPlani(dr, simdi)`: kurulmuşsa günün planı, kurulmamışsa motorun **aynı girdilerle** önerisi (yazılmaz). Gün sayfası öneriyi «Önerilen plan; «Planı kur» deyince bugünün planı olur…» diye gösterir (bloklar işaretlenemez); Hafta sayfasının bugün sütunu ve haftalık toplamı aynı plandan. Bugün sayfası (kabuk.js) yalnız kurulmuş planı gösterir; «Günü planla» bağlantısı bununla tutarlı.

## 6 · Sağlık panosu (`kabuk/saglik.js`)
Yukarıdan aşağı: **Bugün** (Öğün: sayı + son öğün; Hareket: dk + seans; Gece uykusu; Kilo: son tartı ve günü) — kayıt yoksa «Henüz kayıt yok» + «Kaydet» (`#/motor/kayit/tur/<tür>`, tür seçili açılır). **Son 7 gün** yalnız kaydı olan ölçüler: küçük blok çizgisi (kayıtsız gün «·», sıfır değil), «ort. 7,2 saat · 5/7 gün kayıtlı», kesinlik rozeti motorun birleşik kuralından. **Tahliller** belirteç başına açılır satır (son değer · aralığa göre konum · gün; içinde bütün değerler yeniden eskiye), yoksa «Tahlil ekle». En altta dört alanın **Dersler** listesi. Sayı üretmez; hepsi `Kayit.gunluk / haftalik / tahliller`den.

## 7 · Tahlil kaydı (`motor/kayit.js`)
- Yeni tür `tahlil` («Tahlil sonucu», alan Tahlil): belirteç (zorunlu, serbest), değer (zorunlu), birim, referans alt/üst (isteğe bağlı). `sira` alanı formdaki sırayı verir.
- `TAHLIL_SIK` (15 belirteç + olağan birim): yazılan ad büyük-küçük harf farkıyla eşleşirse o yazımla saklanır, birim boşsa olağan birim yazılır. Formda `<datalist>` önerisi (serbest yazı da olur).
- Denetim: alt > üst reddedilir; belirteç ≤ 60, birim ≤ 20 harf. Teşhis yok: `konum` yalnız kaydın kendi aralığına göre `alt | ic | ust` («aralığın altında / aralıkta / üstünde»); aralık yoksa `null`.
- `tahliller(kayitlar)`: belirteç başına değerler (eskiden yeniye), en son yapılan önce. Günlük ölçüm özetine girmez (bir günde çok belirteç).
- Kayıt listesinde okunuş: «Ferritin · 40 ng/mL (ölçüldü) · aralık 15–150».

## Testler (hepsi yeşil, 2026-11-16)
```
node kabuk/onay.test.js            15 geçti, 0 kaldı
node kabuk/king-sohbet.test.js      6 geçti, 0 kaldı
node kabuk/saglik.test.js           6 geçti, 0 kaldı   (yeni)
node kabuk/hesap.test.js           12 geçti
node kabuk/hesap-giris.test.js     16 geçti
node kabuk/hesap-baglanti.test.js  14 geçti
node kabuk/hesap-yonetim.test.js   17 geçti
node kabuk/deneme / acilis / tanisma   6 / 2 / 25 geçti
node kabuk/kabuk.test.js           68 geçti   (ayar şeması dahil)
node kabuk/depo.test.js            19 test geçti
node motor/kayit.test.js           32/32   (2 yeni tahlil testi)
öteki kabuk/*.test.js, motor/*.test.js   yeşil
python kalite/katman.py            Katman tamam
python kalite/olcum.py --denetle   Bütçe tamam: 28 bütçe, aşım yok
python tools/belge_dizin_kabul_test.py   120 belge, her biri bir kez
```
İşlev denetimi (yalıtılmış sunucu 4423, Playwright, 15/15 ✓): Bugün'de onay satırı yok; hızlı not taslağı geri tuşunda ve yenilemede geri, kaydedince silinir; ayrıntılı not taslağı; Kayıt tür bağlantısı + taslak + tahlil kaydı (birim listeden) + tür değişince bağlantı dayatmaz; Sağlık panosu; King seçicisiz, taslak geri, 503'te metin kutuda + Tekrar dene, ikinci denemede cevap ve kaynak satırı yok; Ayarlar › King; Tekrar'da kapı kartıyla «Henüz kart yok» denmez. Betik depoda değil (`tools/` gezisi kabuk paketinin).

## Görseller
`icerik-gorsel/`: saglik, yonetim, king, notlar, plan, plan-hafta, kayit-tahlil × 1440/390 × açık/koyu (28 PNG, örnek kayıtlarla).

## Gezi (`tools/kabuk_gez.js`) — kabuk paketine
Kabuk paketi Tekrar (`tekrar: kartsız açılış`, ~378) ve King seçicisini (~877) zaten uyarlamış. Benim değişikliğimle **kırmızı olacak** denetimler (satırlar bugünkü dosyaya göre):
1. ~1074 `onay: Bugün'de «Onay bekleyen N ders» satırı #/onay'a götürür` — satır bilerek kalktı; denetim «Bugün'de onay satırı yok» olmalı.
2. ~1079 `onay: on alan, … «ölçüldü»` — satır notu artık «Aşama 1: 0/9 onaylı · Aşama 2: 0/9 onaylı», `.b-sayi` yok; sayı cümlede: «N ders onayını bekliyor».
3. ~1082 `onay: «Senin adımın» üç satır` — liste adı `Senin adımların`, kapalı `<details>` içinde (DOM'da var, sayılabilir).
4. ~1084–1088 etiket: `[data-etiket-govde] .b-sayilar` yok (cümle: «N mesaj ve M arama sorusu bekliyor.»); etiket bölümü kapalı açılır (`[data-etiket] summary`'ye tıklamadan `etiket-bas` düğmesi görünmez); düğme metinleri «Mesajları işaretle / Aramaları işaretle».
5. ~1138 `onay: Bugün'deki sayı bir azaldı` — Bugün'de sayı yok; Yönetim'deki cümleden okunmalı.

## Açık kalanlar / başka paketlerin işi
- **Kabuk paketi (kabuk.js):** kilitli ders/kapıda `yok()` kırıntısı «Bulunamadı» (kabuk.js:544) — kilitli için «Kilitli» olmalı; Sistem haritasında «halkada» notu (`sayfaHarita`); ayar grubu simgeleri `AYAR_SIMGE` (ses: `gece` = ay, hesap: `onay` = tik) — öneri hesap için `kisi`, yeni `king` grubu için `king` (sprite'ta var), ses için uygun simge sprite'ta yok; King sayfasının «King hakkında» bölümündeki «lifeos-king», «LifeOS'ta», «Antigravity'de Google'a» dipnotu; Ayarlar'dan Yönetim'e bir bağlantı (Hesap'taki gibi) istenirse `sayfaAyarlar`.
- **Altyapı paketi:** `.github/workflows/ci.yml` dosya dosya koşuyor: `node kabuk/saglik.test.js` eklenmeli. `sistem/tekkapi.py` `/api/kabuk/taslak` artık kullanılmıyor. `brand/ortak/hesap.js` `merkezHalMetni` «Bu cihaz henüz Merkez’e bağlı değil» gibi «Merkez» cümleleri üretiyor (Hesap › Her yerden erişim'de görünür).
- Eğilim çizgisi Unicode bloklarla (▁…█); ekran okuyucu blokları da okur (yanında düz cümle var). CSS gerektirmediği için seçildi; kabuk paketi isterse küçük bir çubuk taşı yapar.
- «ölçüldü/tahmin» kararı sahipte (yukarıda §2).
