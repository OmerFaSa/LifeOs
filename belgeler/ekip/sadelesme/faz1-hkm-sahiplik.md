# Faz 1 · HKM kayıtlarına sahip (P6 öncesi, 2026-11-13)

Paket: gerçek koşuda sahipsiz kalan HKM kayıtlarının her birine bir sahip (motor, King hafızası ya da «arşiv»).
Kaynak kararlar: AGENTS §0.1 (her şey taşınır, türetilmiş yeniden hesaplanır; King notları okur, özeli okumaz; model
hafızaya yazmaz, önerir; HKM ayrı yapı olarak kalkar, çekirdeği tek sunucuya katılır), `king-hkm.md` (BAM bilgi
kayıtları → tek depo Not/Arama; `bam_iz` kökleri korunmalı), `veri-katmani.md` §1c.

## Özet

- **HKM'de sahipsiz kayıt 350 → 0.** Gerçek satırı olan 17 HKM tablosunun hepsinin sahibi var: King 3 tablo
  (339 kayıt: sohbet 168, kullanım 166, hafıza 5), Not 1 (BAM araştırma kaydı 1), arşiv 5 (13 kayıt), türetilmiş
  (taşınmaz, yeniden hesaplanır) 7 tablo (159 satır) + `raw_events` (115, aslı cihazda). HKM'de ret 0, çökme 0,
  sessiz düşen alan 0, öneriye inen hafıza 0. Bütün depoda sahipsiz 376 → 21 (hiçbiri HKM değil).
- **Bir sınıflandırma düzeltmesi:** `bam_iz` (3 satır) `goc.py`'de türetilmiş sayılıp atlanıyordu; BAM'in köken
  zinciridir (`bam.py` `iz_zinciri`), yeniden hesaplanamaz ve `king-hkm.md` korunmasını istiyor. Gerçek tablolara
  alındı, arşivde. Canlı kayıt 394 → 397, göç kimliği `ab38280667e3fef4` → `b0ad37c8b0aa6e58`.
- **Yeni:** `king/hafiza.py` (King'in kendi verisi: GOC bağdaştırıcıları, `listele`, `oner`; yazan işlev yok),
  `Not.goc.bamKayit` (`motor/not.js` sonunda tek ek blok; var olan satıra dokunulmadı), `goc.HKM_ARSIV` (arşiv
  tabloları ve nedenleri), `tools/gercek_kosu.py` `kos_py` (HKM'nin Python sahipleri) ve `raw_events` kapsam satırı.
- **Kapı için yeni bulgu:** HKM `raw_events` (türetilmiş, taşınmaz) 47 modül-günün 38'i kuru depoda yok (AYS 14,
  ESP 13, SPİ 11). Modüllerin gün kopyasıdır; aslı cihazlarda, P2 paketleriyle gelir. Paketlerden sonra bu sayı 0
  olmalı ya da sahibi karar vermeli (Açık 1).

## Tablo sahipliği

Gerçek satırı olan HKM tabloları (sayılar `tools/gercek_kosu.py`'nin bayt kopyasından, yalnız adet):

| Tablo | Satır | goc türü | Sahip | Neden |
|---|---:|---|---|---|
| `conversations` | 168 | sohbet | **King** (`king/hafiza.py` `sohbet`) | King'in kendi konuşma geçmişi; bağlamı o okur. Arşive kalkmış satır (`arsiv=1`) taşınır, görünmez. |
| `usage` | 166 | kullanim | **King** (`hafiza.kullanim`) | Model çağrısının ölçülmüş maliyet defteri (satırın fiyatı ve kuru dondurulmuş); tek sistemde modeli çağıran King. Sütunlar adıyla ve değeriyle kalır. |
| `memories` | 5 | kisi_bilgisi | **King hafızası** (`hafiza.hafiza`) | Kişi modeli hafızanın kendisi (AGENTS §1, kişi modeli). Model yazamaz: izinsiz kaynaklı etkin satır öneriye iner. |
| `bam_kayitlar` | 1 | bam | **Not** (`Not.goc.bamKayit`, tür `belge`) | `king-hkm.md` adım 3: bilgi kayıtları tek depoda Not/Arama kaydı olur; King notu okur, Arama arar. |
| `bildirimler` | 6 | akis | **arşiv** | İş emri bildirim kuyruğu; kuyruk tek süreçte kalkar. Okunmamışlar yeniden gösterilmez. |
| `bam_iz` | 3 | bam (eskiden türetilmiş) | **arşiv** | BAM köken zinciri; yeniden hesaplanamaz, Not'taki bam kaydının kökü. |
| `is_emirleri` | 2 | akis | **arşiv** | BAM'a giden iş emri; ofis ajanları arşivde (§0.1, §1.6), zincir yeniden başlamaz. |
| `intents` | 1 | akis | **arşiv** | Niyet kuyruğu; tek süreçte teklif yerine doğrulanmış yazma gelir. Bekleyen niyet yeniden önerilmez. |
| `bam_isler` | 1 | bam | **arşiv** | BAM işinin ofis adımları; ofisler arşivde, iş yeniden koşmaz. |
| `raw_events` | 115 | türetilmiş | modülün gün kaydı (Kayıt/Plan, paketle) | Modülün HKM'ye yolladığı gün kopyası; aslı cihazda. **38 gün yalnız burada** (Açık 1). |
| `audits` | 115 | türetilmiş | yeniden hesaplanmaz (ofis ajanı çıktısı) | `raw_events` üstüne VP denetimi; ofis ajanları arşivde, yerine Kalite ölçümü. |
| `bam_depo_rapor` | 25 | türetilmiş | yeniden hesaplanır | Depolama bürosunun günlük raporu. |
| `goruntu_sira` | 6 | türetilmiş | taşınmaz | Anlık görüntü sırası; `db.py`: «yedeğe girmez». |
| `web_sayac` | 4 | türetilmiş | taşınmaz | Günlük web çağrı sayacı; Arama'nın bütçesi kendi sayar. |
| `hafiza_gomme` | 3 | türetilmiş | Arama yeniden gömer | Hafıza/kayıt gömme vektörü. |
| `web_onbellek` | 3 | türetilmiş | taşınmaz | Web önbelleği; Arama'nın önbelleği süreç içi. |
| `yarin_ozet` | 3 | türetilmiş | Plan yeniden hesaplar | Modülün «yarın» anlık görüntüsü. |

Satırı olmayan tablolar (bugün 0; satır gelirse koşu onları «sahipsiz» gösterir, kapı kırmızı olur):
- Planlanan sahip, bağdaştırıcı satır gelince yazılır: `para` → Kayıt (para hareketi), `motto_*` → Not
  (kullanıcının kendi yazısı, sürümleriyle), `meydan_isaret`/`meydan_yanit` → Tekrar, `meydan_not` → Not,
  `eylem`/`king_olaylar`/`king_*` → King, `sorular` → King (eksik veri sorusu), `zaman_butcesi` → Plan,
  `susturmalar` → Çekirdek tercih. `meydan_deste` zaten `tekrar.meydan`'da.
- Arşiv (`goc.HKM_ARSIV`, satır gelirse koşu «arşiv» sayar): `outbox`, `inbox_seen`, `attachments`.
- Türetilmiş, satırsız: `aktif_is`, `aktif_tur`, `decisions`, `decision_sources`, `dil_karti`, `duyurular`,
  `hedef_ozet`, `meydan_hikaye`, `model_tarife`, `para_taslak`, `tatil_ozet`.

## Bağdaştırıcılar

Alan adları `HKM/core/db.py` şemasıyla (göçleriyle: `MIGRATIONS`) ve gerçek kopyanın `PRAGMA table_info`'suyla
denetlendi; testler satırları `core.db.connect(":memory:")` ile gerçek şemadan kurar.

- `king/hafiza.py` `GOC` (Python; `OKUR` her tablonun okuduğu sütunlar, `EKSIK` taşınamayan, adıyla):
  - `hafiza(memories)` → `{id:"hafiza/N", tur:"hafiza", metin, katman, kaynak, durum, kapsam, alan, gorenler, modul,
    dis_id, olusturma, bitis, son_kullanim, unutulma, onay}`. Durum: active→etkin, aday→oneri, forgotten→unutuldu,
    reddedildi, dustu. Boş katman «soz» (memory.py: eski satır «senin sözün»). Katmanın izin vermediği kaynaktan
    etkin satır → «oneri» (model yazmaz). Ret: boş metin, bilinmeyen durum ya da katman.
  - `sohbet(conversations)` → `{id:"sohbet/N", tur:"sohbet", rol (user→kisi, manager→king), metin, kanal, gorevli,
    arsiv, ses, zaman}`. Ret: boş metin.
  - `kullanim(usage)` → bütün ölçü sütunları adıyla ve değeriyle + `id:"kullanim/N"`.
  - Taşınamayan: kişi adı `user` (tek kişi; «ben» olmayan satır ayrıca sayılır: gerçekte 0), ses dosyasının kendisi
    (depoda hiç yoktu), gömme vektörü (türetilmiş), `is_id`'nin işi (arşivde, kimlik kalır).
  - Zamanlar HKM'deki ISO metin olarak kalır: saat dilimi tahmin edilmez (Not ms kullanır; tek süreçte ortak
    zaman biçimi seçilince çevrilir, Açık 4).
- `Not.goc.bamKayit(liste, {zaman})` (`motor/not.js` sonunda ayrı blok) → `{id:"bam/N", tur:"belge", baslik,
  govde: ozet + «- iddia» satırları, kaynak:{yapi:"bam", yol}, olusturma, ozellik.bam:{tur, dogruluk, surum,
  onceki_id, is_id, anahtar, talep, denetim, govde (bütün JSON, kaynakça dahil)}}`. `etiketler` sütunu etiket
  değil, işin talep cümlesi (`bam.py:531`): `ozellik.bam.talep`. JSON olmayan gövde metin olarak kalır. Taşınamayan
  (raporunda): sürüm zinciri bağ değil, doğruluk/denetim etiket değil, iş ve köken arşivde.
- Arşiv: bağdaştırıcı yok; `goc.HKM_ARSIV` tablo → neden. Satır `goc.py`'nin yazdığı gibi (sütun → değer) tek
  depoda kalır, hiçbir motor yazmaz. Koşu «arşiv» diye sayar, nedeni taşınamayan tablosunda «salt okur: …».
- `tools/gercek_kosu.py` `kos_py`: `hkm:<tablo>` King'in `GOC`'unda ise Python bağdaştırıcısı (ret; çökme yalnız
  istisna türü ve `king/hafiza.py:satır`; sessiz sütun `OKUR`/`EKSIK`'e göre), `HKM_ARSIV`'de ise arşiv; değilse
  rota Node'a (`tools/gercek_kosu.js` `ROTA`; `hkm:bam_kayitlar` → `not.bamKayit` eklendi).
- `tools/gercek_kosu.py` `ham_kapsam`: HKM `raw_events` modül-günlerinden kaçının kuru depoda aynı modülde o
  tarihi taşıyan kaydı yok (rapor başında tek satır).

## King verisi

`king/hafiza.py` King'in deposu değil, **biçimi ve kapısıdır**: kayıtlar tek depoda durur (göçte `goc.py` yazar,
sonra tek süreç). Üç tür: `hafiza`, `sohbet`, `kullanim`.

- `listele(kayitlar, tur, durum="etkin", simdi, sinir)`: King'in okuma kapısı, en yeni önce. Hafıza yalnız verilen
  durumda ve süresi geçmemiş (`memory.list_active` ile aynı), sohbet arşive kalkmamış; `ozel:true` hiç dönmez.
- `oner(metin, katman, kaynak)`: **yazmaz**, yalnız `{durum:"oneri"}` nesnesi döner (boş ya da 600 karakterden uzun
  ret). Etkin hafıza ancak kullanıcının onayıyla ve kaydet kapısıyla olur (tek süreçten sonra).
- «Ders» ve iş tabloları (`king_beceriler`, `king_sozler`, `king_bekleyen`, `king_olaylar`, `eylem`) bugün boş;
  satır gelirse King'e bağdaştırıcısı yazılır (koşu sahipsiz gösterir).
- Test, modül kaynağında `sqlite3`, `open(`, `INSERT`, `UPDATE` olmadığını da denetler.

## Gerçek koşu sonrası

`python tools/gercek_kosu.py` (aynı kopya düzeneği, yalnız sayılar): çıkış 0, göç kimliği `b0ad37c8b0aa6e58`, sayı
dengesi tutuyor, gidiş-dönüş birebir, çökme 0, sessiz düşen alan 0, geçici klasör kalmadı.

| Rota | Bağdaştırıcı | Okunan | Çıktı | Ret | Boş | Çöktü | Önce |
|---|---|---:|---:|---:|---:|---:|---|
| hkm:conversations | king.sohbet | 168 | 168 | 0 | 0 | 0 | sahipsiz |
| hkm:usage | king.kullanim | 166 | 166 | 0 | 0 | 0 | sahipsiz |
| hkm:memories | king.hafiza | 5 | 5 | 0 | 0 | 0 | sahipsiz |
| hkm:bam_kayitlar | not.bamKayit | 1 | 1 | 0 | 0 | 0 | sahipsiz |
| hkm:bildirimler | arşiv | 6 | 6 | 0 | 0 | 0 | sahipsiz |
| hkm:bam_iz | arşiv | 3 | 3 | 0 | 0 | 0 | türetilmiş (atlanıyordu) |
| hkm:is_emirleri | arşiv | 2 | 2 | 0 | 0 | 0 | sahipsiz |
| hkm:intents | arşiv | 1 | 1 | 0 | 0 | 0 | sahipsiz |
| hkm:bam_isler | arşiv | 1 | 1 | 0 | 0 | 0 | sahipsiz |

| | Önce (ilk koşu) | HKM sonrası |
|---|---:|---:|
| Canlı kayıt | 394 | 397 |
| Sahibi olan (modül boşlukları paketi dahil) | 18 | 376 |
| Sahipsiz | 376 | 21 |
| Sahipsiz HKM | 350 | 0 |
| `raw_events` günü depoda yok | ölçülmüyordu | 38 / 47 |

Kalan 21 sahipsiz HKM değil: modül `meta` 7, profil 2, `esp:prefs` 1, `spi:basarim/seviye/chats` 3,
`ays:defterklasor` 1 (bilerek), `gun_kopya` 2, PC tercih 4 ve planlama 1. Sonuç
`gercek-kosu-20261113.md` «HKM sonrası» bölümüne de yazıldı.

## Testler

- `python king/hafiza_test.py` 29/29: şema (her gerçek sütun okunur ya da EKSIK'te adıyla; okunanlar gerçek şemada),
  hafıza durumları, model kaynaklı satırın öneriye inmesi, kişi adı, retler; sohbet rolü, arşiv ve ses; kullanım
  sütunları değeriyle aynı; `listele` (öneri, süresi geçmiş, özel, arşivli dışarıda); `oner` yalnız nesne; yazan yol yok.
- `node motor/not-hkm.test.js` 7/7 (ayrı dosya: `not.test.js`'e başka paket yazıyor): belge notu, JSON olmayan gövde,
  boş ve yinelenen ret, okunamayan zaman, göç anı zorunlu, her gerçek sütun adıyla, rapor biçimi.
- `python tools/gercek_kosu_test.py` 26/26: önceki 19'a ek King (`king.hafiza` 2/1/1), Not (`not.bamKayit`), arşiv,
  sahipsiz HKM (`para`), King'de sessiz sütun, `raw_events` kapsam satırı, King çökmesi `@ king/hafiza.py:`; içerik
  basılmadı, canlı dosya açılmadı.
- Motor: kayıt 29/29, not 27/27, plan 27/27, soru 33/33, tekrar 21/21, yol 13/13. King: niyet 73, katalog 58,
  bağlam 35, mcp 81, arama OK. `goc_test.py` 35 ✓, `gocpaket_test.py` 18 ✓, `belge_dizin_kabul_test.py` ve
  `tools_dizin_kabul_test.py` yeşil.
- CI: `motor/not-hkm.test.js` «Motorlar (Yol, Tekrar, Not)» adımına, `king/hafiza_test.py` «King çekirdeği»
  adımına eklendi.

## Açık konular

1. **`raw_events` kapısı (P6'dan önce).** 38 modül-gün yalnız HKM'nin gün kopyasında. Her cihazda «Bilgisayara
   gönder»den sonra koşu yeniden: 0 değilse sahibi karar verir (kalanlar `raw_events.payload`'dan «eski kayıt»
   etiketiyle mi taşınsın, yoksa bırakılsın mı). Eşleştirme kaba: o modülde o tarihi taşıyan herhangi bir kayıt.
2. **`audits` (115)** türetilmiş sayılıyor ama yeniden hesaplanmayacak (VP ofis ajanları arşivde): kaybolur. Sahibi
   arşivde tutmak isterse `HKM_TURETILMIS`'ten `HKM_GERCEK` + `HKM_ARSIV`'e tek satır.
3. **Bekleyen akış:** `intents`, `is_emirleri`, `bam_isler`, `bildirimler` içinde hâlâ «bekliyor/okunmadı» olan
   satır varsa tek sistemde yeniden önerilmez; adedi ölçülmedi (durum sütunu sayılabilir, içerik gerekmez).
4. **Zaman biçimi:** King kayıtları ISO metin, Not ms. Tek süreç ortak biçimi seçince çevrilir; HKM'nin `_simdi`
   biçimi (saat dilimli mi) o gün okunmalı.
5. **Hafıza üç yerde:** modüllerin `meta/hafiza` öğeleri (`ays/esp/spi:meta`, sahipsiz 7 kaydın içinde) aynı kişi
   modelidir; tek hafızaya birleşmesi (`dis_id` ile) bu paketin dışında, `meta` sahibi belirlenirken.
6. **Boş tablolar:** `para`, `motto_*`, `king_*`, `eylem`, `sorular`, `zaman_butcesi`, `susturmalar`, `meydan_*`
   satır alırsa koşu onları sahipsiz gösterir; bağdaştırıcı o gün planlanan sahibe yazılır.
