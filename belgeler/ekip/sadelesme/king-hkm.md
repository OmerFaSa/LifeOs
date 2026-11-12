# King ve HKM keşfi (sadeleşme girdisi)

Depo: `C:\Users\ASUS\LifeOs-sadelesme` · HEAD `d375ef2d` · salt okuma, 2026-11-12.
Kanıt kuralı: her iddia dosya/sembol ile; bulunamayan «göremedim». Sayılar sayıldı.

## 1. Bugün bir mesajın yolu

Tek mesaj iki ayrı kural motorundan geçer (önce tarayıcı, sonra HKM); model en sonda ve ancak ikisi de "anlamadım" derse çağrılır.

| # | Yer (dosya · fonksiyon) | Ne olur |
|---|---|---|
| 1 | `brand/ortak/king-yol.js` · `isle()` (s.228–927) | Büyük harf küçültme, `yazimDuzelt`, ritim/günlük, `ACIL_RE/KRIZ_RE`, alıştırma, denklem, grafik, telaffuz, gizlilik, kalori, düzeltme, geri al, "King ne yaptı", ölçü soruları, hafıza komutları… Bu aralıkta **101 `return`**, **33 `_RE.test`** ve **23 "King-Bench" yaması** yorumu sayıldı. Her biri modelsiz erken çıkış. |
| 2 | `brand/ortak/king.js` · `yorumla()` (s.1060) | Sıra: özet → notlar → fiil sonda "git/aç" komutu (`sayfaBul`) → modülün veri önizlemesi (`veri.onizle` / `L.GIRIS`) → eksik kayıt (`L.GIRIS.sor`) → **`NIYET` (s.502, 13 regex)** → `sayfaBul` (`L.PARCA_REHBER`). Çıktı: `veri / git / sor / ozet / bilinmiyor`. |
| 3 | `king-yol.js` s.817 `ARAC().kuralla`, s.826 yetki kataloğu, s.899–915 `niyetSinif/niyet` | Cümleden parametresi çıkan araç modelsiz çalışır (A3 hızlı yol); kalıba uymayan emir için niyet çözücü. |
| 4 | `king-yol.js` s.885–894 | `git` sonucunu `bilinmiyor`a çeviren yamalar: "anlat/açıkla/nedir", `HIS_RE`, sayılı rapor, durum cümlesi, >4 kelimelik soru. |
| 5 | `king-yol.js` · `merkezYolu()` (s.929) | Merkez'e gider **yalnız** `bilinmiyor`, `ozet`, `bulunan` ya da (`git` + kaynak≠komut + (`soruMu` ya da sayfa sözü ve >3 kelime)). Aksi halde `yerel()` (s.1001): `git` ise "Tamam./Kolay gelsin" deyip 650 ms sonra sayfayı açar. |
| 6 | `king.js` · `merkezeSor()` (s.1250) | `POST /api/chat/akis` (yoksa `/api/chat`), gövde `{text, agent:'king', date, modul, derinlik?, uslup?, baslangic?, araclar: KI.ARAC().modelIcin()}`. Geçmiş istemciden gitmez. |
| 7 | `HKM/daemon.py` s.1896 | Gövde denetimi; geçmiş **ambardan** (`_sohbet_gecmisi`); `sohbet.konus(...)`, NDJSON akış + 10 sn nabız. |
| 8 | `HKM/core/sohbet.py` · `_kural_yolu()` (s.934–1170) | Sunucu kural motoru, modelden önce: hafıza komutu, `iliski.cevap`, selam, teklif cevabı, beceri/söz, fiş, para, giriş kapısı (`kapi`), ekip görevi (`gorev`), çoklu iş, `program.tani`, `urun_istegi`, araştırma (`arastir` → BAM), eksik soru cevabı, `patron` komut/istek/rapor (`dil.istek`, `dil.rapor`). |
| 9 | `sohbet.py` · `_konus()` (s.1216) | `seviye.sinifla(metin)` → alt/orta/üst (`HKM/core/seviye.py` s.81: `UST_SINYAL`, `ORTA_SINYAL`, >25 kelime). `ai.hazir_mi` değilse `patron.respond` (kural) cevabı. |
| 10 | `sohbet.py` s.1290–1345 bağlam | `baglam()` ya da yerel modelde `_kisa_baglam()`; **serbest sohbette yalnız tarih satırı** (`bg = _tarih_satiri(date)`); `LIFEOS_BILGI` (1238 harf) yalnız uzun istek ya da `LIFEOS_SOZ` (`lifeos|sistem|mimari|modüller|hkm`); bulunulan bölüm satırı; `memory.context(..., butce = baglam_butcesi(rol)//5)`. |
| 11 | sistem metni | `sistem_metni()` (s.182): bulut `SISTEM_METNI` 1223 harf; yerel `SISTEM_KISA` / `SISTEM_SERBEST` = `KISA_KIMLIK` 1198 harf + ek. Ekler: `HAFIZA_ADAYI_KURALI` 346 / `_KISA` 146, `ARAC_TALIMATI` 634, `OGRETMEN_TALIMAT` 861, `HIS_TALIMAT` 312, `UZUN_TALIMAT` 200 (harf; `ast` ile ölçüldü). Bütçe: `ai.BAGLAM_BUTCE` king 3500 jeton (4 harf=1 jeton, `KARAKTER_BASINA_JETON`), aşılırsa en eski geçmiş düşer (`butceye_sigdir`). Geçmiş: alt 4, orta 8, üst 12 mesaj (`BAGLAM_SINIRI`). |
| 12 | araç seçimi | `arac.dar_katalog(katalog, metin)` (`HKM/core/arac.py` s.149): mesajla kelime örtüşen **en çok 4 araç** (`DAR_EN_COK`); örtüşme yoksa araçsız. `arac.aracsiz_mi(model)`: `gemma3, gemma2, llama2, phi3…` modellerine **katalog hiç gitmez** (s.52). Yerel modelde iki aşama: önce `SISTEM_ARAC` ile `yalniz_arac=True` seçim turu, sonra araçsız sohbet. `HIS_RE` eşleşirse araç kapalı + `HIS_TALIMAT`. |
| 13 | model çağrısı | `ai.ask` → `motor.merdiven` (basamaklar) → `ai._cagir` (s.381). |
| 14 | doğrulama | `ai._temizle` (s.641): buyurgan kip (`manager.imperatives`) ve **dayanaksız sayı** (`uydurma_sayilar`) cevabı düşürür; `ARAC_IDDIA` (yapmadığı işi anlatma) → bir düzeltme turu, olmazsa `ARAC_YAPILMADI`; `bolum_ayikla`; `GERCEK_DISI` → düzeltme turu; `arac.cagri_dogrula` (kapalı katalog, ≤3 çağrı); `memory.aday_ayikla`. İstemcide `KI.aracIsle`: okuma çalışır, yazma onay ister. |

**Kademe başına varsayılan model (kodda):**

| Durum | Kaynak | Model |
|---|---|---|
| Hiç atama yok | `models.resolve` (s.459) | Yok ("atanmamış"); `HKM/config.example.json`'da model bölümü yok → kural cevabı (`patron.respond`). |
| Paket A/A+/S/S+ seçili | `motor.SINIF_MODELI` (s.44), `PAKET_POLITIKASI` (s.56) | ekonomik `google/gemini-2.5-flash-lite`, standart `openai/gpt-5-mini`, güçlü `anthropic/claude-sonnet-5`, uzman `anthropic/claude-opus-5.5` (hepsi OpenRouter); ses `gemini-3.6-flash / gemini-2.5-pro` (Google). A paketi alt/orta: ekonomik→standart. |
| Yerel / hibrit | `ollama.EKONOMIK_TERCIH` (s.78), `motor._yerel_bulut` (s.360), `seviye.zorluk` (s.110) | Yerel `gemma4:e2b` tercih. Hibritte alt/orta seviye **yerel**, üst/araştırma, döngü adımı ≥2 ya da >3000 jeton **bulut**; her bulut merdiveninin sonuna yerel yedek. |
| Canlı ayar | `%LOCALAPPDATA%` altındaki HKM config | **göremedim** (kural gereği canlı ayar okunmadı). Hafıza notu "live config still all-gemma3" diyor; doğrulanmadı. |

## 2. Kötü deneyimin kök nedeni

Kod okunarak izlendi, çalıştırılmadı.

### 2a. Felsefe sohbeti yemek/çalışma sayfasına gidiyor (YÖNLENDİRME TASARIMI)

| Neden | Kanıt | Etki |
|---|---|---|
| Sözcük → sayfa tablosu model'den önce çalışıyor | `king.js` `NIYET` (s.502, 13 kural): `felsefe`→ESP symposium, `yemek/besin/öğün/yedim`→SPİ meals, `test|soru`→AYS solve, `konu|ders`→AYS subjects, `tekrar|kart`→cards, `dil|kelime`→ESP lang, `kitap|okuma`→library, `yazı`→writing | "felsefe hakkında konuşalım", "sana bir soru soracağım", "yemek üzerine düşünüyordum" gibi cümleler `tur:'git'` olur. |
| Ayrıca 26 sayfa · 76 anahtar sözcük | `brand/ortak/parca-rehber.js` (`es:` dizileri; `'felsefe'`, `'soru'`, `'ders'`, `'kitap'`, `'yemek'` dahil) → `sayfaBul` | Aynı etki, `kaynak:'sayfa'`. |
| Model'e gitme koşulu dar | `king-yol.js` `merkezYolu` s.948: `git` sonucu Merkez'e yalnız **soru biçimindeyse** (`soruMu`: `?` ya da "ne, neden, mı…") ya da sayfa sözü + >3 kelime ise gider | Soru eki olmayan düz sohbet cümlesi (`kaynak:'niyet'`) hiç modele gitmez; `yerel()` s.1025 "Kolay gelsin" deyip sayfayı açar. |
| Yamalar belirti tedavisi | s.885–894: "anlat/nedir", `HIS_RE`, sayılı rapor, durum cümlesi için ayrı istisnalar; 23 "King-Bench" yorumu | Her yeni cümle kalıbı yeni bir regex ister; sınav (293/300) bu kalıplarda ölçüyor, gerçek sohbette kaçıyor. |
| Sunucu: felsefe "sistem konusu" sayılıyor | `sohbet.py` `SISTEM_KONUSU` (s.133) içinde `felsefe, kitap, okuma, ders, soru, öner, analiz, çalış, gelişim…` | `serbest=False` olur → "Bugünün ölçümleri" listesi ve modül satırları bağlama girer; küçük model cevabı modüle bağlar. |
| Model kendi kendine yönlendiriyor, regex süzüyor | `BOLUM_YONLENDIR` + `bolum_ayikla` (s.785–797; yorum: "küçük model bunu her cevaba ekliyordu") | Yalnız "AYS/SPİ/ESP bölüm…" cümlesi atılır; "Öğün sayfana bak" gibi diğer yönlendirmeler süzülmez. |

### 2b. LifeOS'tan habersiz (BAĞLAM TASARIMI, küçük modelde ağırlaşıyor)

| Neden | Kanıt |
|---|---|
| Yerel modelde serbest sohbet = **yalnız tarih satırı** | `_konus` s.1300: `serbest = kisa and not uzun and not sistem_konusu(metin)`; `if serbest: bg = _tarih_satiri(date)` |
| LifeOS tanımı yalnız anahtar sözcükle | `LIFEOS_BILGI` yalnız `uzun_istek` ya da `LIFEOS_SOZ` (`lifeos|sistem|mimari|modüller|hkm`) eşleşirse (s.1306) |
| Kişi modeli / 14 alan sohbete girmiyor | `sohbet.py` `_konus` içinde `kisi` çağrısı **göremedim**; hafıza alt seviyede en çok 3 kayıt (`BAGLAM_SINIRI["alt"]["hafiza"]=3`) |
| Araçsız model veriyi okuyamaz | `arac.ARACSIZ` (`gemma3…`) → katalog yok; `dar_katalog` örtüşme yoksa araç yok |
| Geçmiş kısa | alt seviye 4 mesaj (`BAGLAM_SINIRI`), toplam 3500 jeton (`ai.BAGLAM_BUTCE["king"]`) |

### 2c. Genel sohbet botu gibi (İSTEM + MODEL)

| Neden | Kanıt | Tür |
|---|---|---|
| Kimlik metni "Her konuda konuşabilirsin", "Kısa yaz (çoğunlukla bir üç cümle)", "Doğrudan cevapla başla", iç adları kullanma | `KISA_KIMLIK` (s.110) | İstem |
| Kullanıcıya özgü bilgi yok, rol "asistan" | 2b | Tasarım |
| Sayı denetimi cevabı düşürür, kalıp cümleye döner | `ai._temizle` → `uydurma_sayilar`; `GERCEK_DISI` → `GERCEK_YOK` / `GERCEK_KISMI` | Tasarım (güvenlik için doğru, ama küçük modelde sık tetiklenir) |
| Alt seviye cevap tavanı 500 jeton | `motor.CEVAP_JETON["alt"]` (s.76) | Tasarım |
| Küçük modelin Türkçe akıl yürütmesi, araç protokolüne uymaması | Yorumlar: `arac.py` s.28–32 ("gemma3:4b protokole uymadı"), `sohbet.py` s.1366 ("Ölçüm 6: 0/24"), `KISA_KIMLIK` üstü yorumlar ("Benim adım Sen HKM") | Model |

**Ayrım özeti.** Model kaynaklı: kalitesiz Türkçe, araç çağıramama, "bölüme yönlendir" alışkanlığı, kimlik karışıklığı. Tasarım kaynaklı (model değişse de sürer): `NIYET` + `parca-rehber` sözcük yönlendirmesi ve dar `merkezYolu` koşulu (felsefe → sayfa), `SISTEM_KONUSU`'nun geniş sözlüğü, serbest sohbette boş bağlam, kişi modelinin istemde olmaması. Claude'a geçmek 2c'nin model kısmını çözer; 2a ve 2b'yi çözmez.

## 3. Araç envanteri ve ≤12 üst araç önerisi

Sayım betiği (salt okur, kaynaktan `ad:'…', tur:'…'` + `dis('…')` + AYS `tools.js` adları + `actions.js` içinden `modelYok/olcum` olmayanlar + `ogret.js` 2×3) ve elle eklenen `gun_kaydi`, `gun_kaydi_yaz`.

**Sayılar.**

| Katalog | Kaynak | Adet | oku / yaz |
|---|---|---|---|
| Ortak King araçları | `brand/ortak/king-arac.js` (`liste`, `disAraclar` s.754, `gunAraclari` s.930) | 28 | 15 / 13 |
| AYS | `AYS/src/js/core/kingarac.js` `liste()` s.1056 = `okuma()` (`core/tools.js` 14) + `yazma()` (`data/actions.js` 17 eylemden 10'u) + elle 14 | 38 | 15 / 23 |
| SPİ | `SPI/src/js/core/kingarac.js` `liste()` s.1074 | 25 | 12 / 13 |
| ESP | `ESP/src/js/core/kingarac.js` `liste()` s.376 | 27 | 9 / 18 |
| Öğretme | `brand/ortak/ogret.js` s.244, 258 (`<modül>_tekrarlarim`, `<modül>_yanlis_teshis`) | 6 | 6 / 0 |
| **Model kataloğu toplam** | | **124** | 57 / 67 |
| Yetki kataloğu (9 ortak: kural yolu `king-yol.js` s.826; 4 modül eki `eylem_<id>` adıyla modele de gider, `king-arac.js` s.1158) | `brand/ortak/yetki.js` 9 + modül ekleri (`AYS/src/js/app.js` s.2004 `toplanti`; `SPI/src/js/app.js` s.1928 `inceleme`; `ESP/src/js/app.js` s.2222 `kitap-ekle`, `inceleme`) | 13 | — / 13 |
| Sunucu niyet türleri | `HKM/core/intents.py` `KINDS` (s.44) | 16 | teklif |
| Sunucu Patron komutları | `HKM/core/patron.py` `COMMANDS` (s.38) | 9 | çoğu oku |
| **Genel toplam** | | **162** | |

Bir modülün King'e sunduğu katalog: ortak 28 + kendi + öğretme 2 + eylem → AYS ≈69, SPİ ≈56, ESP ≈59; sunucu en çok 80 alır (`arac.EN_COK_ARAC`), modele en çok 4 gider (`DAR_EN_COK`). Kademe: AYS eylemleri `level` taşır; SPİ/ESP yazma araçlarının çoğunda `seviye` alanı yok → `king-arac.js` s.1175: seviyesiz yazma "Onayla" ister, `buyuk` dönüş noktası alır, `dis` "Onaylıyorum" ister.

**Envanter (motor bazında; ad · tür · kademe).** Kısaltma: o=oku, y=yaz, k/o/b = küçük/orta/büyük, "—" = tanımda kademe yok.

| Motor | Araçlar |
|---|---|
| **Kayıt** | `kayit_gir` y — (her modülün genel kayıt kapısı) · `istatistikler` o · `bugun_ozeti` o · `merkez_raporu` o (hafta/çapraz) · `ays_gunler` o · `ays_enerji_durumu` o · `ays_enerji` y k · `ays_mesgale_ekle` y k · `ays_mesgaleler` o · `spi_uyku` o · `spi_antrenmanlar` o · `spi_tahliller` o · `spi_gun_kaydi` o · `spi_butce` o · `spi_kiler_oku` o · `spi_kiler` y · `spi_ilac` y · `spi_ilac_alim` y · `spi_gida` y · `spi_barkod_ogun` y · `spi_ogun_sil` y · `spi_antrenman_sil` y · `spi_tahlil_sil` y · `esp_gun` o · `esp_hafta` o · `esp_oturum` y · `esp_kitap_bitir` y · `esp_ses_kaydi` y · `eylem_inceleme` y k · niyet `kayit.add, besin.add, fiyat.add, urun.add, yer.add, measure.ask` |
| **Plan** | `oncelik_listesi` o · `yuk_durumu` o · `odak_baslat` o · `odak_durdur` o · `gun_kaydi` o · `gun_kaydi_yaz` y · `ays_durum_ozeti` o · `ays_haftalar` o · `ays_gunun_akisi` o · `ays_takvim` y o · `ays_telafi` y o · `ays_mola` y k · `ays_ara_ver` y o · `ays_gecici_sure` y o · `ays_gunluk_sure` y o · `ays_week_target` y k · `ays_block_add` y k · `ays_etkinlik` y o · `ays_hafta_degerlendirme` y o · `ays_decision_close` y k · `spi_planlar` o · `spi_hedefler` o · `spi_mutfak` o · `spi_market` y · `spi_karar_kapat` y · `esp_hatirlatma` y · `esp_hedef` y · `esp_zincir` y · `esp_karar_kapat` y · niyet `plan.add, focus.set, load.reduce, plan.apply` |
| **Tekrar** | `ays_kartlar` o · `ays_kart` y o · `ays_card_from_error` y k · `ays_cards_due_today` y o · `esp_kartlar` o · `esp_kart_ekle` y · `esp_kart_sil` y · `ays/spi/esp_tekrarlarim` o · niyet `kart.add` |
| **Soru** | `soru_sor` o · `ays_denemeler` o · `ays_deneme` y o · `ays_hatalar` o · `ays_yanlis` y o · `ays_puan_tahmini` o · `ays/spi/esp_yanlis_teshis` o |
| **Yol** | `ays_konular` o · `ays_konu_riski` o · `ays_konu_durumu` y o · `ays_topic_review` y k · `ays_hedef_ve_net_matrisi` o · `esp_merdiven` o · `esp_repertuvar` o · `esp_eser` y · niyet `mufredat.add, unite.add` |
| **Not** | `not_ara` o · `not_ekle` y · `ays_video_notlari` o · `ays_video_notu` y o · `esp_kitaplar` o · `esp_kitap` y · `esp_yazilar` o · `esp_taslak` y · `esp_alinti_ekle` y · `esp_argumanlar` o · `esp_arguman` y · `esp_olaylar` o · `esp_olay` y · `esp_dosya` y · `esp_not_sil` y · `eylem_kitap_ekle` y k · niyet `kitap.add, belge.add` |
| **Arama** | `spi_besin` o · `spi_barkod` o · `esp_kaynak` y · niyet `material.add` · (sunucu `arastir` hızlı yolu, araç değil) |
| **Ayar/Sistem** | `sistem_haritasi` o · `sayfa_ac` o · `modul_bilgileri` o · `king_harcama` o · `ayar_degistir` y · `king_ayari` y · `onaylari_listele` o · `oneri_onayla` y · `oneri_gec` y · `onerilerin_hepsi` y · `ays_bolum_ac_kapa` y o · `spi_bolum_ac_kapa` y o · `ays_profil` y o · `ays_profiller` o · `spi_profil` y · `spi_hane` y · `spi_hane_oku` o · `pc_dosya_ac` y dış · `pc_uygulama_baslat` y dış · `pc_ekran_oku` y dış · `telefona_gonder` y dış · `dis_izin` y dış · `eylem_toplanti` y o · yetki `tema` k, `animasyon` k, `muzik` k, `onay-tek` o, `onay-hepsi` o, `red-tek` k, `red-hepsi` o, `sifirdan` b, `donus` b · Patron `durum, kabul, ret, neden, capraz, seri, etki, yardim, basla` |

Not: `odak_baslat/odak_durdur` kodda `tur:'oku'` işaretli (sayaç başlatıyor; yazma sayılmıyor).

**Önerilen ≤12 üst araç** (her biri `eylem` + `param` alır; alttakiler katalog eylemi olur):

| # | Üst araç | Motor | Altına katlananlar |
|---|---|---|---|
| 1 | `kaydet` | Kayıt | `kayit_gir`, `gun_kaydi_yaz`, `*_sil`, `spi_ilac(_alim)/gida/kiler/barkod_ogun`, `esp_oturum/kitap_bitir/ses_kaydi`, `ays_enerji/mesgale_ekle`, niyet `kayit/besin/fiyat/urun/yer.add` |
| 2 | `kayit_oku` | Kayıt | `istatistikler`, `bugun_ozeti`, `gun_kaydi`, `merkez_raporu`, `spi_uyku/antrenmanlar/tahliller/gun_kaydi/butce/kiler_oku`, `esp_gun/hafta`, `ays_gunler/enerji_durumu/mesgaleler`, `measure.ask` |
| 3 | `plan` | Plan | `oncelik_listesi`, `yuk_durumu`, `odak_*`, `ays_takvim/telafi/mola/ara_ver/*_sure/week_target/block_add/etkinlik/hafta_degerlendirme/decision_close/durum_ozeti/haftalar/gunun_akisi`, `spi_planlar/hedefler/mutfak/market/karar_kapat`, `esp_hatirlatma/hedef/zincir/karar_kapat`, niyet `plan.*`, `focus.set`, `load.reduce` |
| 4 | `tekrar` | Tekrar | `*_tekrarlarim`, `ays_kart(lar)/card_from_error/cards_due_today`, `esp_kart_ekle/kartlar/kart_sil`, `kart.add` |
| 5 | `soru` | Soru | `soru_sor`, `ays_denemeler/deneme/hatalar/yanlis/puan_tahmini`, `*_yanlis_teshis` |
| 6 | `ogren` | Yol | `ays_konular/konu_riski/konu_durumu/topic_review/hedef_ve_net_matrisi`, `esp_merdiven/repertuvar/eser`, `mufredat.add`, `unite.add`, istemcideki öğretmen yolları (`king-yol.js` s.674) |
| 7 | `not` | Not | `not_ara/ekle`, `ays_video_not*`, `esp_kitap(lar)/yazilar/taslak/alinti_ekle/arguman(lar)/olay(lar)/dosya/not_sil`, `eylem_kitap_ekle`, `kitap.add`, `belge.add` |
| 8 | `ara` | Arama | `spi_besin`, `spi_barkod`, `esp_kaynak`, `material.add`, bugünkü `arastir` hızlı yolu |
| 9 | `ayar` | Ayar | `ayar_degistir`, `king_ayari`, `*_bolum_ac_kapa`, `*_profil(ler)`, `spi_hane(_oku)`, yetki `tema/animasyon/muzik/sifirdan/donus` |
| 10 | `onay` | Sistem | `onaylari_listele`, `oneri_onayla/gec`, `onerilerin_hepsi`, yetki `onay-*`, `red-*`, Patron `kabul/ret/neden`, geri al |
| 11 | `sistem` | Sistem | `sistem_haritasi`, `sayfa_ac`, `modul_bilgileri`, `king_harcama`, `eylem_toplanti`, `eylem_inceleme`, Patron `durum/capraz/seri/etki/yardim/basla` |
| 12 | `dis_dunya` | Sistem | `pc_dosya_ac`, `pc_uygulama_baslat`, `pc_ekran_oku`, `telefona_gonder`, `dis_izin` |

Sohbet niyetinde yalnız 2, 5, 6, 7, 8 açılabilir; `sistem.sayfa_ac` sohbette kapalı kalmalı (2a'daki yönlendirmeyi keser).

## 4. Sağlayıcılar

İki ayrı taşıma katmanı var; **King yalnız HKM'ninkini kullanır** (`king*.js` içinde `LLM` çağrısı göremedim; `llm.js` kullananlar AYS ofisi, `konusor.js`, `denemefoto.js`).

| Katman | Sağlayıcılar | Biçim | Önbellek / akış / araç |
|---|---|---|---|
| `HKM/core/models.py` `PROVIDERS` (s.66) + `ai._cagir` (s.381) | `openrouter` (önerilen), `anthropic` (claude-opus-5, claude-sonnet-5, claude-haiku-4-5), `openai`, `google` (Gemini), `yerel` (Ollama/LM Studio, `127.0.0.1:11434`) | OpenAI uyumlu (openrouter/openai/yerel), Anthropic Messages (`anthropic-version: 2023-06-01`), Gemini `generateContent` | **Prompt önbelleği**: Anthropic ve OpenRouter yolunda sistem metnine `cache_control: ephemeral` (ai.py s.425, 460); okunan önbellek jetonu ölçülür (`cache_read_input_tokens`, `cached_tokens`). Sabit talimat bağlamın önüne konur (`sistem_metni` yorumu). **Akış**: üçünde de (`stream`, Gemini `streamGenerateContent`). **Araç**: `arac.saglayici_araclari` üç biçime çevirir; `openai_cagrilari / anthropic_cagrilari / google_cagrilari` geri okur; araçsız modelde metinden `metin_cagrilari`. OpenRouter `reasoning.effort`; yerel gemma4/qwen3'te düşünme kapalı (s.408). |
| `brand/ortak/llm.js` + `providers.js` | `builtin` (Artifact içinde `window.claude.use`, anahtarsız), `openrouter`, `groq`, `gemini`, `ollama`, `lmstudio`, `custom` | openai / gemini / builtin | DeepSeek ve Anthropic doğrudan yok (OpenRouter üstünden). Anahtar `__DEPO__.llm.keys`, yedeğe girmez. |

DeepSeek: yalnız OpenRouter model listesinde (`deepseek/deepseek-chat`, models.py s.82); doğrudan uç göremedim.

**Ayar ve anahtar.** HKM config'de `models` bölümü: `assignments` (rol → `{provider, model, key, efor}`), `paket` (A/A+/S/S+), `yer` (yerel/hibrit/bulut), yerel sınıflar; anahtarlar sağlayıcı başına liste (`models.key_list`, `key_value`), `models.apply/validate` ile yazılır, `probe` ile doğrulanır. Rol ağacı `models.ROLES` (`_rol`, s.144); atama yoksa üst role bakılır, en üstte de yoksa model **yok** (uydurma varsayılan yok, `resolve` s.459).

**Bütçe** (`HKM/core/butce.py`): varsayılan aylık tavan 20 USD (ya da 850 TL), uyarı bantları %50/80/95, %100'de ücretli çağrı durur (`VARSAYILAN` s.35); `guard()` (s.336) her çağrıdan önce en kötü durum maliyetini (+ yoldaki çağrıların ayrılmış payı) sınar; `record()` kullanımı yazar. Kural yolları bütçeden etkilenmez. Fiyat tablosu `ai.FIYAT` (s.1176), bilinmeyen model 1/5 USD taban (`BILINMEYEN_FIYAT`). Bulut kotası (429) 30 dk pencereyle atlanır (`motor.KOTA_PENCERE`).

**Claude'u varsayılan yapmak için eksikler.**

| Eksik | Neden |
|---|---|
| Claude masaüstü uygulaması içinden MCP yolu yok | HKM yalnız HTTP API anahtarıyla çağırır; "Claude uygulaması King'in beyni" akışı için King araçlarını MCP sunucusu olarak açmak gerekir (bkz. §9). |
| Varsayılan atama yok | `config.example.json` model bölümü taşımıyor; `SINIF_MODELI` Claude'u yalnız güçlü/uzman sınıfta ve OpenRouter üstünden kullanıyor. Doğrudan `anthropic` sağlayıcısı paket politikasında hiç yok. |
| Claude için ayrı istem yok | Yerel küçük model için yazılmış kısıtlar (`KISA_KIMLIK`, `SISTEM_KONUSU`, `serbest` boş bağlam, `BAGLAM_SINIRI`) bulutta da kısmen geçerli; `kisa` bayrağı paket "alt" seviyesinde de açılır (`BAGLAM_SINIRI["alt"]["kisa"]=True`). |
| Bağlam bütçesi 8K Ollama'ya göre | `ai.BAGLAM_BUTCE` king 3500 jeton; Claude için gereksiz dar. |
| Fiyat ve önbellek ölçümü | `ai.FIYAT` Claude satırları var mı tek tek doğrulamadım (**göremedim**); önbellek yalnız sistem metninde, araç tanımlarında `cache_control` göremedim. |

## 5. Hafıza

| Parça | Nerede | Ne tutar | İsteme nasıl girer |
|---|---|---|---|
| Üç katman | `HKM/core/memory.py` `KATMANLAR` (s.34), `KAYNAK_IZNI` | `soz` "senin sözün" (yalnız kullanıcı), `sohbet` "sohbetten" (kullanıcı/kural), `cikarim` "tahmin" (yalnız kural). **Model hiçbir katmana yazamaz** (`_izin`). Kapsam `all/king/ays/spi/esp`; King hepsini görür. Metin ≤600 harf. | `memory.context()` (s.127): `- [hafıza #id · etiket] metin` satırları; `ilgili` verilirse gömme (`ara`, eşik `ESIK=0.35`) ya da kök örtüşmesi; `butce` aşılırsa en az ilgili düşer. `_konus` bütçesi `baglam_butcesi(rol)//5` ≈ 700 jeton; alt seviye en çok 3, orta 6, üst 12 kayıt. |
| "Olanlar" | `memory._derlem` (s.426) | `eylem` tablosundan uygulanmış son 100 eylem, `king_olaylar` 100, `king_beceriler` 40 | Gömme eşleşirse en çok 3 `[olan · tarih]` satırı (`EN_COK_OLAN`). |
| Hafıza adayı | `memory.aday_ayikla/aday_ekle` (s.198, 216) | Model cevabın sonuna `[[HAFIZA ADAYI: …]]` bırakır; sağlık sözcükleri aday olmaz (`SAGLIK`); en çok 20 bekleyen | Onaylanana dek bağlama girmez; kullanıcıya "aday N kaydet" sorulur. |
| Kişi modeli | `brand/ortak/kisi.js` `ALANLAR` (s.80) | **14 alan**: kimlik, deger, gorus, kisilik, ruh, fizyoloji, ogrenme, gelisim, maddiyat, iliski, sevgi, hobi, ritim, uslup. Ayrı depo değil: hafıza kaydına `alan` + `gorenler` eklenir; yalnız açık beyan (birinci tekil cümle) ve günde bir tanışma sorusu. | Sunucuda `memories.alan, gorenler` sütunları (`memory.list_active` s.86); sohbet bağlamında alan bazlı özet **göremedim** (yalnız sıradan hafıza satırı olarak). `kisi.js` `ozet()` (s.180) istemci tarafında. |
| Eylem defteri | `HKM/core/eylem.py` (`kaydet`, `istemciden`, `listele`); `daemon.py` `GET/POST /api/eylem`, `POST /api/eylem/<id>/geri` (s.95–103, 1328) | King'in yazdığı her eylem: araç, özet (≤200), param (≤2000), geri alma tarifi, modül | Doğrudan istemde yok; yalnız "olanlar" gömme araması üzerinden ve istemcide "King ne yaptı" kuralı (`king-yol.js` s.612). |
| Hayat Mottosu | `HKM/core/motto.py` `king_baglami` | Öne çıkarılan ilkeler | `baglam()` s.245 ve `_kisa_baglam()` s.305; serbest sohbette yok (bağlam yalnız tarih). |
| Ölçüm brifingi | `manager.brief`, `cross.findings`, `streak.findings` | Modül hükümleri, kurul, çapraz bulgular | `baglam()` / `_kisa_baglam()`; serbest sohbette hiç. |

**Bağlam kurucunun yeniden kullanabileceği parçalar:** `memory.context` (bütçeli, ilgiye göre sıralı, zaten jeton tahminiyle kesiyor), `memory.ara` (gömme araması, `qwen3-embedding:0.6b`), `_kisa_baglam` (tekrarları tek satıra indiren brifing sıkıştırıcı), `ai.butceye_sigdir` (geçmiş kırpma), `ai._jeton_tahmini`, `eylem.listele` (son işler), `kisi.js` alanları (niyete göre süzme anahtarı olarak: sohbet → `gorus/deger/hobi/uslup`, öğren → `ogrenme`, kayıt → `fizyoloji/ritim`). Eksik: niyet → hangi alan/özet eşlemesi ve tek bir "bağlam bütçesi" sözleşmesi (bugün dağınık: `BAGLAM_SINIRI`, `BAGLAM_BUTCE`, `//5`, `EN_COK_OLAN`).

## 6. BAM ve araştırma

| Dosya | Ne yapar |
|---|---|
| `HKM/core/bam.py` (1506 satır) | "Bilgi ve Aksiyon Modülü": dört ofis (Depolama `depo.py`, Araştırma `kaynakli.py`, Planlama `planlama.py`, Üretim) ile iş emri yürütür; sonucu **niyet kuyruğuna teklif** bırakır, modüle yazmaz; `bam_kayitlar`, `bam_isler` tabloları. |
| `HKM/core/arastir.py` (696 satır) | Sohbet içi hızlı araştırma (H1): modül profili seç → kod web'de arar, sayfa okur, YouTube'da arar, altyazıda anı bulur → model (`bam.arastirma` rolü) en çok N adım araç çağırır (`web_ara, sayfa_oku, video_ara, video_ici_ara`) → kaynaksız cümle atılır, sayı/alıntı kodla denetlenir → şablon "Özet · İzle · Oku · Sıradaki adım". `_kural_yolu` s.1094–1120'den çağrılır. |

**Kim çağırıyor (dosya sayısı, sayıldı).**

| Alan | `bam` | `arastir` | `/api/bam…` kullanan istemci |
|---|---|---|---|
| HKM/core | 3 (`aktif.py`, `king.py`, `outbox.py`) | 3 (`ekip.py`, `kodlama.py`, `sohbet.py`) | — |
| HKM/daemon.py | 1 | 1 | — |
| HKM/tests | 15 | 1 | — |
| HKM/web | — | — | 1 (`index.html`: `api/bam`, `/depo`, `/depo/tara`, `/ilerlet`, `/is`, `/kayit/`, `/tahmin`) |
| AYS | — | — | 4 (`beacon.js`, `ofis.js`, `sinavprofil.js`, `urun.js`) |
| SPİ | — | — | 4 (`bilgi.js`, `ofis.js`, `plan.js`, `urun.js`) |
| ESP | — | — | 5 (`beacon.js`, `belge.js`, `ofis.js`, `unite.js`, `urun.js`) |
| brand/ortak | — | — | 2 (`ofis.js` → `/api/bam/is`, `urun.js` → `/api/bam/kayit/<id>` ve `/cikti`) |

`bam_kayitlar/bam_isler` tablosuna dokunan çekirdek dosyalar: `bam.py` 15, `depo.py` 9, `db.py` 9, `king.py` 4, `aktif.py` 1 satır.

**Modüllerin BAM'den aldığı.**

| Modül | Dosya | Aldığı |
|---|---|---|
| AYS | `sinavprofil.js` | Yeni sınav profili (ders → konu) kaydı |
| AYS | (`HKM/core/kitap.py`) | Bölümlü test kitabı: Üretim bürosu her tikte bir bölüm üretir, bağımsız çözümle denetler |
| SPİ | `bilgi.js` | Besin değeri, fiyat, yer kayıtları (Mutfak) — `HKM/core/spibilgi.py` |
| SPİ | `plan.js` | Plan kodda; BAM Planlama v1 (kilo planı) kayıtlarını okur |
| ESP | `unite.js` | Dil ünitesi (`HKM/core/unite.py`) |
| ESP | `belge.js` | Felsefe/tarih kaynaklı belge (`HKM/core/espbelge.py`) |
| Hepsi | `ofis.js`, `urun.js`, `beacon.js` | İş emri açma, ürün (özet, rapor, sunum, pankart; `cikti.py`), HKM işareti |
| Kütüphanem | `brand/ortak/defter.js` s.49 | BAM'e bağlı **değil** (defter.js'de `bam`/`urun` geçmiyor): yerel not/belge/dosya rafı |

**Kaldırma sırası (önce yerine konacak olan).**

| Sıra | Adım | Önce gereken |
|---|---|---|
| 1 | `Arama` motorunu `arastir.py` + `web.py` + `youtube.py` + `kaynakli.py` çekirdeğinden kur; King `araştır` niyeti buna bağlansın | Tek araştırma sözleşmesi (kaynaklı özet + kayıt) |
| 2 | Üretim işlerini taşı: test kitabı (`kitap.py`) → **Soru** motoru, dil ünitesi (`unite.py`) → **Yol**, kart → **Tekrar** | Soru/Yol/Tekrar motorlarında "üret + bağımsız denetle" adımı (bugün `bam.py` Üretim bürosunda) |
| 3 | Bilgi kayıtlarını taşı: besin/fiyat/yer (`spibilgi.py`), felsefe/tarih belgesi (`espbelge.py`), sınav profili → tek depo `Not`/`Arama` kayıtları | `bam_kayitlar` → tek depo göçü (geçmiş kayıtlar ve `bam_iz` kökleri korunmalı) |
| 4 | Planlama v1 (`planlama.py`) → **Plan** motoru | SPİ kilo planı testi |
| 5 | Ürünler (`cikti.py`, `urunler.py`, `urun.js`) → King "yönet/ürün" eylemi ya da ARŞİV | Sahibinin kullanıp kullanmadığı (SORU) |
| 6 | İstemci `ofis.js`/`beacon.js`'teki `/api/bam/is` çağrıları ve `HKM/web/index.html` BAM panelleri | 1–5 tamam |
| 7 | `daemon.py` `/api/bam*` uçları, `bam.py`, `depo.py`, 15 test dosyası | 6 tamam; `bam` rolü `models.ROLES`'tan ve `BAM_EFOR_POLITIKASI`'ndan (`motor.py` s.87) çıkar |

## 7. HKM envanteri

`HKM/core/*.py` = **93 dosya** (`__init__.py` dahil), + `daemon.py` 2409, `hkm.py` 236 satır. Satır sayısı `str.count('\n')`, rol modül belge dizesinin ilk satırından.

| Öneri | Dosyalar (satır · rol) |
|---|---|
| **ÇEKİRDEK** (tek sunucuda kalır) | `daemon.py` (2409 · yalnız 127.0.0.1, bearer'lı HTTP; bölünmeli) · `db.py` (1460 · SQLite şeması) · `ai.py` (1241 · model çağrısının tek kapısı) · `models.py` (892 · sağlayıcı/rol/anahtar) · `motor.py` (681 · merdiven, kota) · `seviye.py` (120 · seviye/zorluk) · `ollama.py` (540 · yerel model keşfi) · `butce.py` (429) · `tarife.py` (122 · güncel fiyat) · `kasa.py` (151 · anahtarları OS kasasında) · `settings.py` (303) · `saat.py` (74) · `izin.py` (69 · dosya izinleri) · `gizlilik.py` (66 · modele ne gitti) · `tani.py` (104 · bozuk olanı söyleyen ekran) · `yedek.py` (269) · `sync_engine.py` (190 · etiketsiz sayı ambara girmez) · `certainty.py` (56) · `thresholds.py` (67) · `adlar.py` (121) · `tarihsoz.py` (192 · Türkçe zaman ifadeleri) · `belge.py` (316 · belge okuma) · `pdf.py` (724 · PDF yazıcı) · `cozumle.py` (129 · belge/ses/video ek çözümleme) · `web.py` (639 · internete tek kapı) · `goruntu.py` (56) · `kutu.py` (69 · modüller arası kayıt kutusu) |
| **KING** (yeni King çekirdeği) | `sohbet.py` (1571 · konuşma; niyet/bağlam/doğrulama buradan ayrılmalı) · `arac.py` (437 · kapalı katalog, doğrulama) · `memory.py` (545 · hafıza) · `eylem.py` (128 · eylem defteri, geri al) · `dil.py` (538 · serbest cümle → kapalı komut) · `eksik.py` (143 · tek soruyla eksik veri) · `iliski.py` (117 · modüller arası ilişki sorusu) · `teklif.py` (411 · işin bedeli/süresi önceden) · `king.py` (1282 · onay zinciri, iş emri) · `kendiliginden.py` (305 · kendiliğinden model kullanımı tek anahtarı) · `beceri.py` (642 · konuşarak öğretilen iş) · `soz.py` (239 · gelecek planı sözü) · `bekleyen.py` (152 · bekleyen mesaj) · `is_kuyrugu.py` (210 · arka plan işleri) · `disdunya.py` (136 · PC/telefon işleri) · `gelen.py` (108 · gelen mesajın tek yolu) · `bildirim.py` (245 · sessiz saat, sınır) · `intents.py` (413 · niyet kuyruğu → tek depoda doğrudan doğrulanmış yazmaya dönüşür) |
| **MOTOR:Plan** | `program.py` (473 · Planlama v2, haftalık program) · `planlama.py` (325 · Planlama v1, kural) · `hedefag.py` (435 · hedef ağı, zaman bütçesi) · `schedule.py` (418 · günlük ritim) · `weekly.py` (359 · haftalık rapor) |
| **MOTOR:Kayıt** | `para.py` (330 · para kolu) · `fis.py` (280 · fiş okuma) · `spibilgi.py` (390 · besin/fiyat/yer) · `streak.py` (168 · seri) · `cross.py` (209 · çapraz bulgu) · `twin.py` (213 · dijital ikiz) · `impact.py` (225 · HKM'nin kendi faydası) · `manager.py` (355 · brifing taşıyıcı) · `vp_base.py` (80), `vp_bio.py` (56), `vp_academic.py` (56), `vp_intellect.py` (54) · `precedence.py` (88 · çelişki çözümü) · `profil.py` (254 · dört alan tek sayfa) |
| **MOTOR:Arama** | `arastir.py` (696 · hızlı araştırma) · `kaynakli.py` (301 · kaynaklı araştırma v2) · `youtube.py` (298 · video ve altyazı anı) · `depo.py` (555 · kayıt güncellik denetimi; BAM'den ayrılıp Arama önbelleği olur) · `gorsel.py` (130 · görsel/sesli öğrenme kaynakları) |
| **MOTOR:Soru / Yol / Tekrar / Not** | `kitap.py` (106 · test kitabı → Soru) · `editor.py` (150 · Üretim editör + kalite kodu → Soru) · `mufredat.py` (186 · müfredat iskeleti → Yol) · `unite.py` (310 · dil ünitesi → Yol) · `kodlama.py` (108 · hafıza kodlama adayı → Tekrar) · `espbelge.py` (467 · felsefe/tarih belgesi → Not) · `motto.py` (545 · Hayat Mottosu → Not) · `kapi.py` (156 · giriş kapısı: test kitabı, gitar, ünite, kelime → King `kaydet/ogren`) |
| **ARŞİV** (BAM ve çoklu yüz) | `bam.py` (1506) · `urunler.py` (358 · ürün kataloğu) · `cikti.py` (546 · BAM kayıtlarını basılır yapar) · `ofismodel.py` (91 · modül ofislerine model) · `ekip.py` (215 · dört alt ajan) · `gorev.py` (721 · çok adımlı görev) · `kanal.py` (54 · Patronlar arası kanal) · `merkez.py` (183 · "katalog 119, 120, 126") · `aktif.py` (389 · aktif kip) |
| **SORU** (sahibine) | `patron.py` (540 · "Büyük Patron", kanaldan konuşan ağız; kural yedeği olarak `_konus` kullanıyor) · `channels.py` (358 · WhatsApp + Telegram) · `yoklama.py` (251 · Telegram yoklaması) · `media.py` (151 · Telegram ekleri) · `outbox.py` (245 · giden kutusu) · `ses.py` (746 · King'in sesi) · `dinle.py` (477 · konuşmayı yazıya dökme) |
| SİL | Kesin silinecek dosya **göremedim**; ARŞİV satırı BAM kaldırıldıktan sonra silinebilir. |

**Yüzler ve kanallar.**

| Parça | Kanıt | Durum |
|---|---|---|
| HKM web yüzü | `HKM/web/index.html` (7873 satır), `merkez.html` (41) | Görünen sayfa adları: `bugun, sohbet, gorevler, profil, motto, para, butce, kanallar, ayarlar, tani` (dizgelerden); BAM düğmeleri `bam-gonder`, `bam-ilerlet`, `depo-ara`, `depo-denetle`. Tek uygulamaya taşınınca bu yüz kalkar; Ayarlar → yapay zekâ/bütçe/kanallar tek uygulamanın Ayar'ına. |
| WhatsApp | `channels.py` s.40 (Meta Cloud API, `allow_from`), varsayılan kapalı | SORU |
| Telegram | `channels.py` s.49 (webhook ya da `polling`), `yoklama.py`, `media.py`; 25 çekirdek dosyada "telegram" geçiyor | SORU |
| Ses | `ses.py` (Gemini/yerel TTS), `dinle.py` (STT), istemci `king-ses.js` (1058) | King'in "ses" yeteneği olarak KING altında kalabilir |
| Patron / Motto | `patron.py` `COMMANDS` 9 komut; `motto.py` | Patron'un kural cevabı yeni kural motoruna, Motto Not motoruna |

## 8. Mevcut ölçüm

| Araç | Ne ölçer, nasıl | Boyut (sayıldı) |
|---|---|---|
| `tools/king_sinav.js` (194) + `king_sinav.json` | Gerçek Türkçe cümle → beklenen **karar** (`git:<modül>:<rota>`, `veri`, `arac:<ad>`, `merkez`, `tur:<tür>`); modül sayfası Playwright'ta açılır, Merkez çağrısı yakalanır, kayıt yazılmaz. Cevabın **içeriğini** ölçmez; yalnız yönlendirme kararını. | 358 cümle (`cumleler`) |
| `tools/king_bench/bench.py` (136) + `bench.js` (169) + `surucu.js` (82) | King-Bench: 233 günlük klon verisinde, gerçek tarayıcı + gerçek HKM + yerel model. Sert kontroller: `modelsiz` (kuralla cevaplanmalı), `sure` ms, `ifade` (veri farkı, ör. soru sayısı tam 30 artmalı), `ayni` (aynı sorunun söylenişleri aynı sayı). Zorluk 1–3 ağırlıklı paket puanı; King puanı = paket ortalaması. | 13 paket, 350 `id`: kayıt 52, öğrenme 53, içgörü 48, diyalog 33, güven 29, hafıza 26, gün 21, koçluk 21, plan 19, öğretmen 18, görsel 15, dayanıklılık 12, proaktif 3 |
| `tools/king_bench/gercek.js` (69) | Her mesajdan önce/sonra modül verisinin parmak izi: "ekledim" deyip değişmeyen veri, önizlemede olmayan sayı | — |
| `tools/king_bench/oz.py` (75) | Koşu sonrası kural tabanlı öz-değerlendirme: eksik yetenek / yanlış yol / önceki koşuyla fark | — |
| `tools/king_bench/bilinc_bench.py` (137) | Düşünce ortaklığı: `POST /api/king/cumle`, cevap kodla puanlanır (yanıt, uydurma sayı…) | 9 vaka |
| `brand/ortak/king.test.js` (4128) | İstemci birim testleri (yorumla, yol, araç, kayıt…) | 214 `test(`/`it(` |
| `HKM/tests/` (`run.py`, `harness.py`, ağ kapalı) | Sunucu birim testleri; model cevabı enjekte edilir; `metric()` ölçüm etiketi | 77 test dosyası, 1093 `test(` kaydı |

**On eğri ve mevcut kapsam.**

| Eğri | Bugün kısmen ölçen | Eksik veri / düzenek |
|---|---|---|
| Tanıma | Bench `hafiza` (26), `bilinc_bench`; `HKM/tests/test_memory.py`, `test_hafiza3.py`, `test_hafiza_uc.py` | Kişi modelinden (14 alan) gizli tutulan gerçekler + bunları dolaylı soran sorular; cevapta doğru kullanımı puanlayan değerlendirici |
| Öğretme | Bench `ogretmen` (18), `ogrenme` (53) | Ön test → ders → son test kazancı; aynı konuda haftalar sonra tutma |
| Anlama | `king_sinav.js` (358 karar etiketi), bench `modelsiz` kontrolü | Etiketleri yeni beş niyete (sohbet/kayıt/öğren/araştır/yönet) çevirmek; **serbest sohbet cümleleri**: 358 cümlede "felsefe/sohbet/konuşalım" geçen yalnız 4 cümle var ve tek soru biçimli olan ("Stoacı felsefe … nasıl uygulanır") `merkez` bekliyor; soru eki olmayan felsefe sohbeti (2a) sınanmıyor |
| Üretim | `bam.py` Üretim bürosunun iç denetimi (bağımsız çözüm, `editor.py`) | Üretilen soru/kartlardan örneklem + cevap anahtarı doğrulama + insan puanı seti |
| Arama | `HKM/tests` içinde `arastir` testi (1 dosya) | Gerçek sorgu seti, kaynak isabeti, alıntı doğruluğu, süre/maliyet |
| Kontrol | Bench `kayit` (52), `plan` (19), `gun` (21), `gercek.js`; sınavın `arac:<ad>` kararları | 12 üst araç için eylem başarı oranı, onay/geri al turu, yanlış yazma sayısı |
| Kendini eğitme | **göremedim** (hesaplar arası ders defteri yok; `oz.py` yalnız koşu raporu) | Hata → ders kaydı (ders defteri) + yeni hesapta aynı vakanın yeniden koşusu |
| Tekrar (hata tekrarı) | `oz.py` önceki koşuyla fark | Hata kimliği (vaka + kök neden) ve tekrar sayacı |
| Sağlayıcı kalitesi | `butce.record` (giriş/çıkış jeton, USD), `butce.ai_olcum`, `motor_bilgi.baglam.sistem_harf`, önbellek okunan jeton; bench `sure` | İstek başına toplam jeton + "boşa çağrı" sayısı (`ARAC_DUZELT`, `GERCEK_DUZELT`, araçsız ikinci tur yeniden sorma) tek tabloda |
| Hafıza | `memory.ESIK` (Ölçüm 3b yorumu: doğru eşleşme ortancası 0,45), bench `hafiza` | Hafıza bütçesi (jeton) eksenine karşı cevap kalitesi eğrisi; bugünkü sabitler (`//5`, `EN_COK_OLAN=3`) bunun için parametre olmalı |

Not: `king_sinav.js` ve King-Bench Playwright ve çalışan sunucu ister; bu keşifte **çalıştırılmadı**, puanlar (293/300) doğrulanmadı. Sınav dosyası bugün 358 cümle; "300" sayısının hangi sürüme ait olduğunu göremedim.

## 9. MCP hazırlığı

**Bugün MCP kodu:** LifeOS'un kendisinde MCP sunucusu ya da istemcisi **göremedim**. "MCP" yalnız ofis ajanı kancasında geçiyor: `tools/ajan_kanca.py` s.31 `IZINLI_MCP = ("playwright",)` (Antigravity ajanlarına yalnız playwright açık; `hkm-sqlite` kişisel veri diye kapalı), `tools/ajan.py` s.123, 578.

**En büyük engel:** araçlar **tarayıcıda** çalışır. Sunucu yalnız seçimi doğrular (`sohbet._konus` belgesi: "araci istemci calistirir"; `arac.cagri_dogrula`), yazma modülün kendi koduyla ve kullanıcı onayıyla yapılır (`king-arac.js` `onizle`/`uygula`; `intents.py`: "HKM hiçbir modüle yazmaz"). HKM modül verisini yalnız eşitleme anlık görüntüsü olarak görür (`/api/sync/`, `/api/memory/sync/`, `/api/hedef/sync/`). Yani bugün bir MCP sunucusu HKM'ye bağlansa okuyabilir ama **yazamaz**; tek veri deposu (sadeleşme planı) bu engelin ön koşulu.

**Arka uç olabilecek uçlar** (`HKM/daemon.py`, toplam **126** benzersiz `/api/` yolu):

| Üst araç | Bugünkü uç |
|---|---|
| `kayit_oku` | `GET /api/briefing`, `/api/twin`, `/api/weekly`, `/api/streak`, `/api/series`, `/api/cross`, `/api/merkez/gunluk`, `/api/merkez/hafta` |
| `kaydet` | `/api/para`, `/api/para/fis` (HKM'nin kendi kaydı); modül kayıtları için `/api/intent/` (teklif) — doğrudan yazma yok |
| `plan` | `/api/hedefler`, `/api/decisions`, `/api/decision/`, `/api/intents/` |
| `not` | `/api/motto*` (12 yol), `/api/hafiza`, `/api/memory*` |
| `ara` | `/api/bam/ara`, `/api/web`, `/api/web/dene` |
| `onay` | `/api/king/teklifler/`, `/api/eylem` (+ `/<id>/geri`) |
| `sistem` | `/api/health`, `/api/tani`, `/api/gizlilik`, `/api/ai_olcum`, `/api/budget` |
| `dis_dunya` | `/api/dis`, `/api/dis/izin` |
| sohbet (King kendisi) | `/api/chat`, `/api/chat/akis`, `/api/king/cumle` |

**≤12 aracı açan MCP sunucusu için gerekenler.**

| Konu | Öneri / bugünkü dayanak |
|---|---|
| Nerede çalışır | Kullanıcının bilgisayarında, Claude masaüstü uygulamasının başlattığı **stdio** süreci (ağ kapısı açmaz); tek sunucuya `127.0.0.1` üstünden konuşur. HKM zaten yalnız `127.0.0.1` dinler (`daemon.py` s.2, 114). |
| Kimlik | Bugünkü bearer (`local_token`, `daemon.py` s.52–55 eşleme penceresi) MCP sürecinin ortamına verilir; anahtar `kasa.py` ile OS kasasında tutulabilir. Kullanıcıya hiç gösterilmez. |
| Yazma güvenliği | Her yazan araç önce `onizle` döndürür, ikinci çağrıda onay belirteciyle uygular; `eylem.kaydet` geri alma tarifini yazar (bugünkü `/api/eylem/<id>/geri` deseni). Kademe (küçük/orta/büyük/dış) MCP araç açıklamasında. |
| Doğrulama | `arac.param_dogrula` + `cagri_dogrula` kapalı katalog mantığı aynen MCP girişine taşınır (bugün `EN_COK_CAGRI=3`, şema tipleri). |
| Bağlam | MCP "resource" olarak niyet başına özet (kişi alanları, bugünün brifingi, son eylemler) — §5'teki parçalardan. |
| Ölçüm | Her MCP çağrısı `butce.record` benzeri bir defterle (jeton yok ama süre, başarı, onay/red) Kontrol ve Sağlayıcı eğrilerine yazılır. |
| Yedek sağlayıcı | MCP yoksa aynı 12 araç `ai._cagir` üzerinden Claude API ya da yerel modele sunulur (`saglayici_araclari` üç biçimi zaten çeviriyor). |

## 10. Sahibine açık sorular

| # | Soru | Neden önemli |
|---|---|---|
| 1 | Sohbet niyetinde King **hiç sayfa açmasın** mı, yoksa "açayım mı?" diye sorsun mu? | `NIYET`/`parca-rehber` sözcük yönlendirmesi (2a) kalkınca sayfaya gitmenin tek yolu açık komut olur. |
| 2 | Claude masaüstü (MCP) birincil olunca, uygulama kapalıyken ya da telefondan (Telegram) gelen mesajı kim cevaplasın: Claude API, yerel model, yoksa yalnız kural motoru? | MCP yalnız masaüstü uygulaması açıkken çalışır. |
| 3 | Claude API için aylık tavan ne olsun? Bugünkü varsayılan 20 USD (`butce.VARSAYILAN`). | Sağlayıcı eğrisi ve otomatik düşüş kuralı buna bağlı. |
| 4 | WhatsApp ve Telegram kanalları kalsın mı? (`channels.py`, `yoklama.py`, `media.py`, `outbox.py`) | Kalırsa tek sunucuda "kanal" katmanı ve kural yedeği gerekir. |
| 5 | Ses (King'in sesi `ses.py`, dinleme `dinle.py`, istemci `king-ses.js` 1058 satır) birinci sürümde gerekli mi? | Büyük yüzey; ertelenebilir. |
| 6 | BAM ürünleri (özet, rapor, sunum, pankart — `urunler.py`, `cikti.py`) kullanılıyor mu? | Kullanılmıyorsa ARŞİV; kullanılıyorsa King'in "yönet" niyetine bir eylem. |
| 7 | Patron/VP katmanı (`patron.py`, `vp_*.py`, `manager.py`, kurul satırları) yeni King'de görünür kalsın mı, yoksa yalnız brifing üreten iç kod mu olsun? | Bugün istem "baş patron" kimliğiyle başlıyor (`KONUM["king"]`). |
| 8 | Hafıza "kendiliğinden öğrenme" kuralı aynı mı kalsın: model asla yazamaz, yalnız aday önerir, kullanıcı onaylar? | Tanıma eğrisinin hızı bu karara bağlı. |
| 9 | Hesaplar arası ders defteri (Kendini eğitme eğrisi) hangi hesapları kapsar: yalnız senin cihazların mı, başka kullanıcılar mı? | Gizlilik ve veri yeri kararı. |
| 10 | 293/300 sınav puanı hangi sınav sürümüne ait? Bugünkü `king_sinav.json` 358 cümle. | Yeni Anlama eğrisinin taban çizgisi. |
| 11 | Canlı ayarda hangi model atanmış? (Bu keşif canlı config'i okumadı.) | `gemma3` ise araç kataloğu hiç gitmiyor (`arac.ARACSIZ`), 2b'yi ağırlaştırır. |
