# Faz 5 · King yolu: çekirdek ve Arama, Claude uygulamasındaki MCP ucunda

Tarih: 2026-11-13 · Dal: `sadelesme` · Dosyalar: `king/mcp.py`, `king/mcp_test.py`, `king/KURULUM.md`,
`king/katalog.py` (kapı eşlemesi), `king/arama.py` (kapı sorusu süzgeci)

## Özet

Sahibin bugün kullandığı King yolu, Claude masaüstü uygulamasındaki salt okur MCP sunucusudur (`king/mcp.py`).
Yeni King çekirdeği (`king/niyet.py`, `baglam.py`, `katalog.py`) ve Arama motoru (`king/arama.py`) bu sunucuya üç
araçla bağlandı: `niyet`, `kayit_cozumle`, `arastir`. Toplam 11 araç (sınır 12; bir yer boş kaldı). Yazan araç yok,
canlı depo yalnız kopyadan okunur, özel notlar dönmez. Bağlarken bir sızıntı bulundu ve kökünden kapatıldı: Arama
motoru alan dosyalarındaki kapı sorularını (ve cevap seçeneklerini) kaynak yapıyordu; `yol_haritasi`'nın «kapı
soruları verilmez» sözü `arastir` ile delinirdi. Bütün `king/*_test.py` yeşil.

## Eklenen araçlar

| Araç | Ne döner | Çağırdığı kod |
|---|---|---|
| `niyet(metin)` | Beş niyetten hangisi, güven (tahmin), hangi kural; masadaki kapılar ve her birinin motoru; King'in derleyeceği bağlam: dilimler (veriyle), jeton tahmini, bütçe, dışarıda kalanlar ve nedeni. Kayıt niyetinde «model yolu yok, Kayıt motorunun kaydet kapısı» ve öneri. | `baglam.derle` (içinde `niyet.siniflandir`, `katalog.model_araclari`), `katalog.KAPILAR` |
| `kayit_cozumle(metin)` | «Bugün 20 dakika yürüdüm» → `{tur: antrenman, gun, alanlar: {etkinlik, sure_dk: {deger: 20, kesinlik: ölçüldü}}, durum: oneri}`, `yazildi: false` ve «yazma tek süreçten sonra kaydet kapısından ve onayınla» cümlesi. Kayıt değilse öneri yok, niyetini söyler. | `niyet.siniflandir` → `kayit_ayristir` |
| `arastir(soru)` | Plan (not → alan → web), her biri kaynaklı iddialar («kaynakta birebir» ya da «tahmin»), kaynak listesi, atılan cümle sayısı, bütçe (ağ çağrısı/sınır), önbellekten gelenler, `hafiza_onerisi.yazildi: false`, ağ durumu cümlesi. | `arama.ara`; notlar `t_notlar` (kingOkur süzgeci) üzerinden |

**Neden bu üçü, neden dört değil.** Görevdeki dört öneriden `niyet` ile `baglam` birleşti: `baglam.derle` niyeti
zaten hesaplıyor, ayrı bir `niyet` aracı onun kesin alt kümesi olurdu ve modele gereksiz bir seçim bırakırdı.
`kayit_cozumle` ayrı kaldı, çünkü Claude'da sahibin en sık cümlesi kayıt cümlesi; adı aracı bulduruyor ve sonucu
«yazılmadı» diye açıkça söylüyor. Ad `kayit_oner` değil: mevcut test «yazan araç yok» denetiminde `oner`'i yasak
sayıyor; öneri yazmak da bu sürümde yok, o güvenceyi gevşetmedim. Boş kalan on ikinci yer, yazma tek süreçle
geldiğinde `kaydet` ya da Soru motorunun okuma kapısı için.

**Arastir ayrıntıları.**
- Model çağrısı yok: Claude zaten model; motor kodla kaynaktan birebir cümle çıkarır (`yazar=None`). Anahtar okunmaz.
- Bütçe motorun kendi bütçesi (`ag` 8, `kaynak` 10, `iddia` 4); yalnız `sure` 25 sn'ye indirildi, çünkü Claude
  uygulamasının istek sınırı 60 sn ve tek sayfa okuması 12 sn sürebilir (`web.ZAMAN`).
- Önbellek: not/alan taraması motorun süreç önbelleği (10 dk); web araması ve sayfaları HKM `web_onbellek`'inde,
  sunucu süreci boyunca yaşayan bir `:memory:` bağlantısında. Sahibin HKM deposuna yazılmaz.
- Notlar `t_notlar({"ara": konu})` ile gelir; Not motorunun arama sonucunda metin `parca` alanında olduğundan
  motora `metin = parca` verildi (faz5-arama.md açık konu 6 bu yolda kapandı). Node yoksa araştırma notsuz sürer
  ve `uyari` der; süzgeçsiz not hiç dönmez.
- Çevrimdışı: `LIFEOS_KING_CEVRIMDISI=1` ağı kapatır, sonuç «çevrimdışı kip» der. Ağ yoksa ya da zaman aşımında
  «Web'den kaynak gelmedi … cevap yalnız yerel kaynaklardan» der. `arastir` aracı `openWorldHint: true` taşır
  (web'e çıkan tek araç), öbürleri `false`.

**Katalog eşlemesi** (`katalog.KAPILAR`, `katalog_test` her MCP aracının tam bir kapıda olmasını ister):
`arastir` → `ara` (Arama), `kayit_cozumle` → `kaydet` (Kayıt; yalnız öneri gösterir), `niyet` → `sistem` (Kabuk:
King'in bağlam ve harcaması).

## Güvenceler

| Güvence | Nasıl korunuyor | Testi |
|---|---|---|
| Salt okur, yazan araç yok | Üç araç da yalnız döner; `kayit_cozumle` ve `niyet` öneride `yazildi: false`; `arastir` hafıza önerisini yazmaz | `kayıt önerisi: yazılmadı…`, `araştır: hafızaya yazmaz`, ad denetimi |
| Canlı depo yalnız kopyadan | `niyet` bağlamı `t_bugun/t_notlar/...` üzerinden (kopya), `arastir` notları `t_notlar`'dan | `canlı dosya hiç açılmadı`, `canlı klasör bayt bayt aynı` (yeni araçlar bu bölümden önce çağrılıyor) |
| Özel not dönmez | Not süzgeci (kingOkur) + `baglam.ozelsiz` + `arama._ozel_mi`; `arastir` notu süzgeçli `parca`'dan okur | Genel GIZLI taraması bütün çıktılarda; `araştır: notlar süzgeçten, özel nota giden bağın adı silinmiş` |
| Kapı soruları verilmez | `arama.alan_kaynaklari` `kapi` yolundaki metni kaynak saymaz (yeni) | Test fixture'ındaki kapı sorusu konuyla eşleşiyor; süzgeç kaldırılınca iddia kapı sorusu oluyor (elle denendi), testte GIZLI taraması yakalar |
| Sayıyı kod üretir | Öneri sayıları `{deger, kesinlik}`; güven ve jeton «tahmin» | `sure_dk == {deger: 20, kesinlik: ölçüldü}`, `jeton.kesinlik == tahmin` |
| En çok 12 araç | 11 | `King yolu: … toplam on bir` |
| Ağ yalnız `arastir`'da | Öbür araçlar HKM'yi yüklemez; `openWorldHint` yalnız onda | `yalnız arastir web'e çıkar`; testte `web._ag` hata atar ve hiç çağrılmaz |

## Testler

`python king/mcp_test.py`: 81 denetim, 0 kırmızı (önce 67; 14 yeni, stdio'daki 2 denetim dört yanıta genişledi). Eklenenler:
araç listesi (11 araç, üç yeni ad; yalnız `arastir` açık dünya); `kayit_cozumle` (tipli öneri ve etiket, yazılmadı
ve «tek süreç», kayıt olmayan cümle); `niyet` (kayıt → kaydet kapısı ve boş bağlam; öğren → kapılar, notlu bağlam,
jeton bütçe içinde); `arastir` çevrimdışı (ağa çıkmaz ve söyler, her iddia kaynaklı, alan içeriğinden birebir ve
kapı sorusu kaynak değil, hafızaya yazmaz, notlar süzgeçten), ağ yok (taşıyıcı hata atar → yerel kaynakla cevap ve
«gelmedi»), Node yok (notsuz sürer, uyarır); stdio uçtan uca dördüncü çağrı `niyet` (sunucu `__main__` iken
çekirdeğin `import mcp`'si çalışıyor). Test hiçbir zaman gerçek ağa çıkmaz: `web._ag` hata atan sahteyle değişir.

Bütün King testleri: `arama_test` 11/11 OK, `baglam_test` yeşil, `katalog_test` yeşil (yeni eşlemeyle), `mcp_test`
temiz, `niyet_test` yeşil. Ayrıca `python king/mcp.py --denetle` gerçek veriye dokunmadan (olmayan depo yolu,
`LIFEOS_KING_CEVRIMDISI=1`) on bir aracın hepsini hatasız çağırdı.

## Kurulum

`king/KURULUM.md` güncellendi: on bir araçlık tablo (araç, ne yapar, motor), `kayit_cozumle`'nin yazmadığı,
`arastir`'ın sorunun konusunu Vikipedi'ye gönderdiği (en çok 8 çağrı, 25 sn, önbellek bellekte) ve
`LIFEOS_KING_CEVRIMDISI` ortam değişkeni. Claude yapılandırması değişmedi; çalışan kopya güncellenip Claude yeniden
açılınca yeni araçlar görünür. Sahibin adımı: «Güncelle» → Claude'dan tamamen çık, yeniden aç.

## Açık konular

1. **Model yazarı yok.** `arastir` iddiaları kaynaktan birebir cümledir; özetlemeyi Claude yapar. King'in kendi
   (uygulama içi) yolunda `arama.hkm_yazari` bağlanınca aynı araç model cümlesini denetleyerek verebilir.
2. **Boş konu.** «araştır lütfen» gibi konusuz soruda motor her alan metnini eşleşmiş sayar (bütçeyle sınırlı,
   kaynaklı ama gürültülü). Yalnız üç harften kısa soru reddediliyor; konu boşsa reddetmek `arama.ara`'da olmalı.
3. **Web önbelleği süreçle ölür.** Kalıcı önbellek için HKM deposu gerekir; o yazma demek, tek süreçten sonra.
4. **Kayıt yazma.** `kayit_cozumle` önerisi `kaydet` kapısının girdi biçimidir (`katalog.KAPI_SEMA["kaydet"]`);
   yazma tek süreç kurulunca bu öneri onayla kaydet'e gider. On ikinci araç yeri bunun için boş.
5. **Canlı denenmedi.** Kurala uygun olarak sahibin gerçek verisiyle ve Claude uygulamasında çalıştırılmadı; ağ
   kipi yalnız sahte taşıyıcıyla sınandı. İlk gerçek kullanımda `--denetle` ve bir `arastir` çağrısı bakılmalı.
6. Arama motorundaki kapı sorusu süzgeci uygulama içi King'in Arama yolunu da etkiler (doğru yönde); `arama_test`
   yeşil.
