# Faz 5 · Arama motoru (A6/A7)

## Özet
Tek Arama motoru yazıldı: `king/arama.py` (sorgu → plan → bütçeli, önbellekli toplama → her iddiası kaynaklı, kesinlik etiketli cevap → hafıza önerisi; hiçbir şey yazmaz). Testi `king/arama_test.py` (11/11 geçti, ağsız), BAM kapısı ölçümü `king/arama_olc.py`. Örnek fixture setinde (6 soru, **vekil**, gerçek eğri değil) yeni motor isabet 5/6, eski hızlı yol 4/6, BAM iş emri 4/6; işaretsiz uydurma yeni 0, eskiler 1'er. BAM silinmedi, HKM'ye dokunulmadı.

## Birleştirilenler
Yeni motor `king/arama.py` hiçbir arama/okuma kodunu kopyalamaz; HKM'nin kendi kodunu içe aktarır (AGENTS §0.1 kural 3):

| Parça | Nereden | Yeni motorda |
|---|---|---|
| Web araması, alaka süzgeci (başlıkta kökün yarısı), öncelikli alan sırası | `HKM/core/arastir.py` `web_ara` + `kaynakli.aday_sec`, `kaynakli.ONCELIK` | `web` adımı |
| Sayfa okuma, web önbelleği (arama 1 gün, sayfa 7 gün), günlük web sınırı | `arastir.sayfa_oku` → `web.getir` / `web.ara`, `web_onbellek`, `web._harca` | aynen; SSRF denetimi (`web.url_uygun_mu`, DNS çözümlü) canlı kipte motor tarafından ayrıca çağrılır, çünkü motorun sayaç taşıyıcısı `getir`'in kendi çözümlemesini kapatır |
| YouTube araması, kanal/süre süzgeci, altyazıda konunun anı | `arastir.video_ara`, `video_ici_ara` (`youtube.py`) | `video` adımı (yalnız video istendiğinde) |
| Kaynak defteri (numara, aynı adres bir kez, en çok 14) | `arastir._Durum` | aynen |
| Cümle denetimi: kaynaksız cümle, kaynakta olmayan sayı/alıntı, liste satırı, yalnız video başlığı atılır | `arastir.denetle` | hem model hem kodla çıkarılan iddiaya uygulanır |
| Model istemi ve rolü | `arastir.SISTEM`, `GOREV`, `SON_TUR`, rol `bam.arastirma` | `hkm_yazari()` (araçsız tek çağrı) |
| Alıntı normalleştirme | `kaynakli._norm` | `verified` kararı |
| Kişisel notlar (kingOkur süzgeci) | `king/mcp.py` `t_notlar` | `not` adımı (`mcp_notlari`) |
| Konu yalınlaştırma, Türkçe kök | `arastir.yalin`, `youtube.kokler` | aynen |

BAM'in iş emri yolundan (`bam.py` `_arastirma_kaynakli`: mimar → tarayıcı → okuma → yazar → derin) **alınmayan**: çok tıklı iş emri, `bam_kayitlar` sürümleri, Depolama Bürosu, derin tur. Bunlar kayıt/üretim işidir (king-hkm.md §6 adım 2–3); Arama motoru tek seferde biter ve yazmaz.

## Motor
`ara(sorgu, kaynaklar, butce, con, cfg, tasiyici, notlar, alan_kok, yazar, cevrimdisi, onbellek)` →
`{ok, konu, plan, kaynaklar, iddialar, atilan, hafiza_onerisi, butce, izler, onbellekten, saniye, note}`.

1. **Konu.** İstek fiili ve not sözcükleri konudan kodla düşer («fotosentezi araştır» → «fotosentezi»; bugün bunu `sohbet._kural_yolu` yapıyordu), sonra `arastir.yalin` + `youtube.kokler`.
2. **Plan (kodla).** Sıra: `not` (kendi notların) → `alan` (alan/**/*.json içeriği) → `web` → `video` (yalnız video istenince). «notlarımda …» gibi yerel soru web'e çıkmaz. Çevrimdışı kipte web adımı yalnız verilen (fixture) taşıyıcıyla vardır.
3. **Bütçe.** Varsayılan `{"ag": 8, "kaynak": 10, "sure": 40, "iddia": 4}`. Ağ çağrısını motorun sayaç taşıyıcısı sayar; sınır dolunca ağa çıkmaz, `butce_doldu: true`. HKM'nin günlük web sınırı (`web._harca`) ayrıca geçerli.
4. **Önbellek.** Web: HKM `web_onbellek` (aynı `con` verilirse kalıcı; verilmezse süreç içi `:memory:`). Not/alan taraması: motor önbelleği, 10 dk.
5. **İddia.** Model yazarı verilirse (`hkm_yazari`: BAM hızlı yolunun istemi ve `bam.arastirma` rolü, araçsız tek çağrı) cevabı `arastir.denetle`'den geçer; model hiçbir kaynaklı cümle bırakmazsa ya da yazar yoksa kod konuya uyan cümleleri kaynaklardan birebir çıkarır. Kaynak yoksa model hiç çağrılmaz.
6. **Kesinlik.** Her iddia `estimated`; yalnız iddia gösterdiği kaynağın metninde birebir (normalleştirilmiş) geçiyorsa `verified`. Anlamı «kaynak bunu söylüyor»dur, doğruluğu değil. Alan içeriği `dogrulanmamis` işaretliyse kaynakta `taslak: true`.
7. **Özel not.** Varsayılan not kaynağı `king/mcp.py` `t_notlar` (kingOkur süzgeci, canlı dosyanın kopyası); motor ayrıca `ozel/kapali/gizli` işaretli notu atar.
8. **Hafıza.** `hafiza_onerisi = {yazildi: false, onay: "sahibin", oneriler: [...]}`: yalnız `verified` ve not dışı kaynaklı iddialar önerilir; motor hiçbir tabloya yazmaz (yalnız HKM'nin web önbelleği/sayacı ve model çağrısı varsa `usage` defteri).
9. **Güvenlik.** Canlı kipte okunacak her adres önce `web.url_uygun_mu(url, cozumle=True)`'dan geçer (SSRF: yerel/özel ağ adresi okunmaz).

## Ölçüm ve BAM kapısı
`python king/arama_olc.py` üç motoru (eski hızlı yol `arastir.yap`, eski BAM iş emri `bam.is_ac`+`ilerlet` kaynaklı yolu, yeni `arama.ara`) aynı soruda, aynı web fixture'ı ve aynı sahte model cevabıyla ağsız koşar. Kesinlik etiketi **vekil**: 6 örnek soruyu ben yazdım; sahibin gerçek sorgu seti değildir, Arama eğrisinin değeri sayılmaz.

| Motor | İsabet | İşaretsiz uydurma | Kaynaksız iddia | Ağ çağrısı | Kalıcı yazım (satır) |
|---|---|---|---|---|---|
| eski: hızlı yol (arastir) | 4/6 | 1 | 0 | 26 | 4 (`usage`) |
| eski: BAM iş emri | 4/6 | 1 | 1 | 11 | 30 (iş, kayıt, iz, `usage`) |
| **yeni: Arama** | **5/6** | **0** | **0** | **10** | 4 (`usage`) |

Sorular ve farklar: hızlı yol kaynakta olmayan ama sayı/alıntı içermeyen cümleyi («Fotosentez yalnız geceleri olur [1].») işaretsiz gösterir; yeni motor aynı cümleyi `estimated` işaretler, BAM alıntı denetimiyle «doğrulanamadı» der. BAM alaka süzgeci olmadığı için «Suç ve Ceza» sorusunda «Uluslararası Ceza Mahkemesi» sayfasından iddia gösterir; hızlı yol ve yeni motor sayfayı eler. Model sessiz kalınca hızlı yol ve BAM özet vermez; yeni motor kaynaktan birebir cümle çıkarır. Kaynak yoksa BAM model bilgisini «doğrulanmadı» etiketiyle kayda yazar (kaynaksız 1); yeni motor iddia üretmez. Yeni motorun kaçırdığı soru (fotosentez): doğru kısa cümle «Fotosentez kloroplastlarda gerçekleşir.» `arastir.denetle`'nin «4 sözcükten kısa = liste satırı» kuralıyla atılır; aynı kural hızlı yolda da var (paylaşılan kod).

**BAM kapısı (öneri).** BAM ancak şu üçü birlikte tutunca kaldırılır: (1) sahibin etiketli gerçek seti `kalite/veri/arama.jsonl` (biçim `arama_olc.py` başında: `{"soru","beklenen","kaynak","yasak","etiket"}`), en az 30 soru; (2) bu sette yeni motor isabeti iki eski motorun her birinden düşük değil ve işaretsiz uydurma 0; (3) BAM'in arama dışı işleri (kayıt sürümleri, Üretim, Planlama; king-hkm.md §6 adım 2–5) başka motorlara taşınmış. Bugün yalnız vekil var: kapı **geçilmedi**.

**Eğri kancası (kalite/egri/arama.py'ye dokunulmadı).** `olc(kok)` şu olabilir: `kalite/veri/arama.jsonl` yoksa bugünkü «ölçülmedi»; varsa `king/arama_olc.py --json` (gerçek set + canlı web ile) çalıştırılır, `deger = ozet["yeni: Arama"]["isabet"] / n`, `etiket = "ölçüldü"`, `ayrinti` = üç motorun özeti. Vekil koşu eğriye değer olarak yazılmamalı.

## Testler
`python king/arama_test.py` — 11 test, ağa çıkmaz (web/YouTube cevapları HKM'nin kendi `tests/test_arastir.py` fixture'ları, içe aktarılır; not ve alan içeriği geçici klasörde). Sınananlar: her iddia kaynaklı; ağ/kaynak/iddia bütçesi; özel not hiçbir alana sızmaz; ikinci koşu ağa çıkmaz (önbellek); hiçbir tabloya ve dosyaya yazılmaz, hafıza önerisi `yazildi=False`; çevrimdışı kipte `web._ag` hiç çağrılmaz; plan (yerel soru web'e çıkmaz, video yalnız istenince); altyazı anı; eşitlik: `test_arastir` t_dongu_web/t_denetle (uydurma sayı, kaynaksız cümle, olmayan alıntı atılır; doğru cümle kalır) ve `test_bam` t_research_is_unverified (kaynaksız araştırma doğrulanmış sayılmaz; yeni motorda kaynak yoksa model hiç çağrılmaz). Ek: `test_olcum_kosar` ölçüm betiğinin üç motorla hatasız koştuğunu, yeni motorda işaretsiz uydurmanın 0 olduğunu ve etiketin «vekil» olduğunu sınar. Sonuç: **11/11 geçti** (0,6 sn).

## Açık konular
1. **Gerçek set yok.** Sahibin etiketli sorguları olmadan Arama eğrisi «ölçülmedi» kalır; `arama_olc.py` bugün gerçek seti okumuyor (canlı web ister; `shortcut:` notu dosyada).
2. **Bağlanmadı.** King `araştır` niyeti ve `sohbet._kural_yolu` hâlâ `arastir.yap`'ı çağırır; bağlama King çekirdeği (king/niyet.py) ve tek sunucu işidir, bu pakette yapılmadı.
3. **Şablon yok.** Yeni motor «Özet · İzle · Oku · Sıradaki adım» kartını kurmaz (veri döner); kart kabuk/motor işi. `arastir.sablon_kur` istenirse çağrılabilir.
4. **Model döngüsü yok.** Hızlı yolun «model araç çağırır (en çok 4 adım)» döngüsü alınmadı; motor kodla arar, model yalnız yazar. Ölçümde fark çıkmadı; gerçek sette yeniden bakılmalı.
5. **Kısa doğru cümle atılıyor** (`arastir.denetle` 4 sözcük kuralı). HKM dondurulmuş; düzeltme ya yeni motorda kendi denetimi ya HKM hata düzeltmesi olarak — sahibin kararı.
6. **Not alanları.** Not kapısının döndürdüğü not nesnesinde metin alanının adı (`metin/govde/icerik/ozet`) motor tarafından tahminle okunuyor; canlı veriyle denenmedi (kurala uygun olarak gerçek veriye dokunulmadı).
7. **Video bütçesi.** Altyazı taraması ağ bütçesini hızlı tüketir (video başına 2–3 çağrı); gerçek kullanımda `ag` sınırı ayarlanmalı.
8. CI'ın `king/*_test.py`'yi koşup koşmadığına bakmadım; koordinatör eklemeli.
