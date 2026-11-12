# İçerik hattı ve yol haritası keşfi

Tarih: 2026-11-12 · Salt okur keşif. Kaynaklar: `C:\gemini-data`, `C:\Users\ASUS\LifeOs-sadelesme` (origin/main temiz kopya).
Kanıt kuralı: her sayı diskten sayıldı; bulunamayan şey «göremedim» diye yazıldı.

## 1. C:\gemini-data denetimi

### 1.1 Dosya ve konu çifti sayımı (diskten, `find`)

Toplam dosya: **1.306** (`find C:\gemini-data -type f`). Konu çifti = aynı adlı `.json` + `.md`. Her alt klasörde eşsiz dosya sayısı 0 (json sayısı = md sayısı = çift sayısı).

| Klasör | Alt klasör | Çift | | Klasör | Alt klasör | Çift |
|---|---|---|---|---|---|---|
| AYS (294 dosya, 147 çift) | ayt | 56 | | KING (292 dosya, 146 çift) | kocluk_metodolojisi | 28 |
| | tyt | 20 | | | potansiyel_ve_ustalik | 26 |
| | evrensel_akademi | 19 | | | iletisim_ve_karizma | 25 |
| | ogrenme_bilimi | 16 | | | davranis_mimarisi | 21 |
| | soru_bankasi_kaliplari | 9 | | | yasam_tasarimi | 18 |
| | yks_genel | 8 | | | kriz_ve_geri_donus | 11 |
| | deneme_ve_analiz_motoru | 5 | | | ic_disiplin | 6 |
| | kavram_haritalari | 5 | | | strateji | 6 |
| | deney_ve_gozlem | 3 | | | zihinsel_modeller | 5 |
| | formuller_ve_ispatlar, grafik_ve_sekil_okuma, hafiza_ve_kodlama | 2+2+2 | | SPI (428 dosya, 214 çift) | saglik | 80 |
| ESP (250 dosya, 125 çift) | felsefe | 29 | | | beslenme | 71 |
| | edebiyat_kitap | 17 | | | hareket | 63 |
| | tarih | 15 | | MUFREDAT (12 dosya) | kök (biyoloji, cografya, felsefe, fizik, kimya, matematik) | 6 |
| | sosyoloji_ve_toplum | 14 | | MEDYA (24 dosya) | AYS, ESP, KING, SPI | 3+3+3+3 = 12 |
| | sanat_ve_estetik | 11 | | _araclar | `denetle.py`, `KARAR_BEKLEYEN.md` | – |
| | muzik_diksiyon | 9 | | kök | manifest.json (286 KB), DIREKTOR.md, DENETIM_VE_KALITE_RAPORU.md, GEMINI_GOREV.md | – |
| | dil | 8 | | | | |
| | psikoloji_ve_insan, strateji_ve_karar | 6+6 | | | | |
| | dil_ogrenimi, yazi_ve_kompozisyon | 4+4 | | | | |
| | okuma_ve_sentez | 2 | | | | |

Notlar:
- **MEDYA'da `.svg` dosyası göremedim.** 24 dosya, 12 json+md çiftidir; SVG kodu JSON içinde gömülü (`grep -c '<svg'` 12 JSON'da 2–4 arası) (`C:\gemini-data\MEDYA\*\*.json`). Görevdeki «24 SVG» tanımı diske uymuyor.
- Dört ana modülde 632 çift (147+125+146+214); bu sayı `DENETIM_VE_KALITE_RAPORU.md` satır 20'deki «632 JSON–MD çifti» ile uyuşuyor. Aynı raporun satır 31'i SPI için denetim anında 220 diyor, diskte 214.

### 1.2 JSON geçerliliği ve şekilleri

Betik: her `.json` (manifest hariç 650 dosya) `json.load` ile açıldı.

| Ölçü | Sonuç |
|---|---|
| Geçerli JSON | **650 / 650 (%100)**, bozuk dosya yok |
| U+FFFD (bozuk karakter) içeren dosya | 0 json, 0 md |
| Farklı üst düzey anahtar kümesi (şekil) | **521** (650 dosyada) |
| Yalnız tek dosyada görülen şekil | 504 |
| En sık şekil | 52 dosya (KING): `baslik, alt_baslik, bolumler, dalga, dokuman_id, kategori, modul, temel_felsefe, kalite_…` — ör. `KING\davranis_mimarisi\bilissel_esneklik_kabul_ve_kararlilik_act_psikolojik_dayaniklilik_atlasi.json` |
| 2. şekil | 16 dosya (SPI): `aciklama, baslik, bolumler, modul, kalite_…` — ör. `SPI\beslenme\fitobesinler_sulforafan_indole3carbinol_ve_hormezis_atlasi.json` |
| 3. şekil | 14 dosya (ESP): `aciklama, bolumler, dal, modul, paket, versiyon, kalite_…` — ör. `ESP\dil\dunya_alfabeleri_yazi_sistemleri_tipografi_ve_fonetik_transkripsiyon_ipa_atlasi.json` |
| Diğer örnekler | AYS: `atlas_adi, kod, seviye, bolumler|moduller` (`AYS\ayt\ayt_fizik_mekanik_…_atlasi.json`); `veri_seti_adi, kapsam, kategori, seviye, versiyon` (`AYS\ayt\ayt_sayisal_ustalik_rehberi.json`); SPI tablo: `metadata, kalemler, kategori_dagilimi` (`SPI\beslenme\akdeniz_ve_mavi_bolgeler_…_atlasi.json`); MÜFREDAT: `ders, program, kaynak_url, kazanim_sayisi, kazanimlar` (`MUFREDAT\biyoloji.json`) |

Sonuç: JSON'lar ayrıştırılabilir ama **ortak bir şema yok**; tek ortak anahtar kalite bloğu. Gövde metni için güvenilir kaynak `.md` dosyasıdır; JSON'dan içerik okumak için 500+ şekle uyarlayıcı gerekir.

Bozuk LaTeX: `\to` gibi kaçışlar JSON'da sekme karakterine dönüşmüş; **29 md dosyasında `$…<TAB>o$` deseni** var (ör. `SPI\beslenme\cig_pismis_agirlik_donusum_katsayilari_ve_mutfak_olcu_birimleri_atlasi.md` başlık 4: «Ev Ölçüsü $<TAB>o$ Net Gramaj»).

### 1.3 Kalite bloğu ve kaynak doğrulama

| Ölçü | Sonuç |
|---|---|
| `kalite_dogrulama_ve_kaynakca` bloğu olan JSON | **650 / 650** (AYS 147, ESP 125, KING 146, SPI 214, MÜFREDAT 6, MEDYA 12) |
| Blok içi alt anahtarlar | `teknik_butunluk` 650, `mufredat_ve_kullanilabilirlik_filtresi` 650, `birincil_kaynaklar_ve_akademik_dogrulama` 650, `ozgun_alanlar` 127 |
| Kaynak girdisi toplamı | **2.523**; 2.274'ü düz metin, 249'u `yazar/eser…` nesnesi |
| URL içeren kaynak girdisi | **0** (yalnız MÜFREDAT'ın 6 dosyası blok düzeyinde `url` taşıyor) |
| Kaynak başına «doğrulandı / doğrulanmadı» alanı | **0 girdi** — böyle bir alan hiç yok |
| Kaynakçası boş dosya | 16 |
| Açıkça «kaynakça eklenmeli» diyen | 10 SPI dosyası (`durum: "Bu dosyada standart kaynakça alanı yok; kaynakça eklenmeli"`, ör. `SPI\hareket\hiz_tabanli_antrenman_vbt_ve_hiz_kaybi_esikleri_atlasi.json`) |
| Açıkça «insan doğrulaması yapılmadı» diyen | 6 MÜFREDAT dosyası (`teknik_butunluk.durum`) |
| `teknik_butunluk` metni | 422 dosyada «JSON Sözdizimi ve UTF-8 … Doğrulandı (%100)», 115'inde «JSON ayrıştırıldı (2026-11-10)», 42'sinde «ONAYLANDI» — hepsi modelin kendi beyanı |

Sonuç: **Kaynakların hiçbiri tek tek doğrulanmış olarak işaretli değil.** «Doğrulanmamış» işareti de yok; yani doğrulama durumu bilinmiyor. İçe aktarırken 650 dosyanın tamamı «doğrulanmamış» sayılmalı.

### 1.4 Dil, derinlik ve tür (örneklem: klasör başına 5+ konu)

Md boyutu (bayt, min / ortanca / maks): AYS 4.857 / 11.893 / 119.477 · ESP 8.850 / 12.799 / 32.877 · KING 4.273 / 9.427 / 59.213 · SPI 3.882 / 9.914 / 95.119.

Pedagojik iz (md'lerde regex, dosya sayısı): alıştırma/çözümlü soru → AYS 5, ESP 9, KING 7, SPI 3 · ön koşul → AYS 6, ESP 2, KING 0, SPI 1 · «sıfırdan/başlangıç/A1» → AYS 25, ESP 10, KING 22, SPI 22 · tablo → AYS 62/147, ESP 116/125, KING 102/146, SPI 182/214.

| Klasör | İncelenen dosyalar | Tür | Doğruluk (kontrol edebildiğim yer) | Sıralı mı |
|---|---|---|---|---|
| AYS | `tyt\tyt_matematik_sayilar_cebir_…_atlasi.md`, `ayt\ayt_felsefe_grubu_…_tam_atlasi.md`, `kavram_haritalari\yks_tum_branslar_konu_on_kosul_zinciri_…_atlasi.md`, `ogrenme_bilimi\akademik_arastirma_ve_problem_cozme_mental_modeller.md`, `ayt\ydt_ingilizce_…_atlasi.md` | Sınav **tekrar atlası** / soru kalıbı özeti («tuzak», «banko soru»); konu anlatımı değil, konuyu bilen için | Başlıklar müfredata uygun; ayrıntı denetlenmedi | Tek tek bağımsız; **tek istisna** ön-koşul zinciri dosyası (branş branş bağımlılık grafı) — yol haritası için değerli |
| ESP | `dil\ingilizce_c1_c2_ustalik_…dunya_dilleri.md`, `felsefe\elestirel_teori_frankfurt_okulu_…_atlasi.md`, `tarih\anadolu_uygarliklari_…_atlasi.md`, `muzik_diksiyon\gitar_armoni_ve_diksiyon_ustalik.md`, `dil_ogrenimi\ikinci_yabanci_dil_edinimi_krashen_…_atlasi.md` | **Referans atlas**, ileri düzey (C1/C2, Frankfurt Okulu, CAGED) | Gitar: CAGED kök sesleri (C 5-2, A 5-3, G 6-3-1, E 6-4-1, D 4-2) ve aralık tablosu doğru; Hitit/Frig/Lidya/Urartu tarihleri makul | Bağımsız; başlangıç dersi yok |
| KING | `kocluk_metodolojisi\bilissel_esneklik_…_protokolleri.md`, `ic_disiplin\stoaci_zihinsel_dayaniklilik_…_atlasi.md`, `potansiyel_ve_ustalik\entelektuel_tevazu_…_atlasi.md`, `strateji\donusturucu_liderlik_…_atlasi.md`, `yasam_tasarimi\dijital_minimalizm_…_rehberi.md` | **Koçluk metni** (isim + model + «protokol»): Ellis REBT, Byron Katie, Seligman 3P, Bass 4I, Newport | Modeller doğru adlandırılmış; dil abartılı («cerrahi çürütme») | Bağımsız |
| SPI | `beslenme\cig_pismis_agirlik_donusum_…_atlasi.md`, `hareket\asimetri_analizi_…_norofizyolojisi.md`, `saglik\sirkadiyen_biyoloji_…_atlasi.md`, `saglik\biyoaktif_peptitler_bpc157_…_atlasi.md` | **Referans atlas** + tablo (ölçü/katsayı); fizyoloji özeti | BPC-157 dosyasında doz önerisi göremedim (iyi); uyku dosyasında abartılı başlık («Mavi Işık Toksisitesi ve Melatonin Felci») | Bağımsız |
| MÜFREDAT | 6 dosya | **MEB kazanım listesi** (PDF'ten otomatik), `kod, sinif, unite, kazanim` | İnsan doğrulaması yok (kendi beyanı); bazı kazanımlara «Öğrenme çıktısı numarası» artığı karışmış (`cografya.json` ilk kazanım) | Sınıf/ünite sırası var |
| MEDYA | 12 dosya | Gömülü SVG şema + «telifsiz medya kataloğu» | Denetlemedim | Bağımsız |

Genel yargı: Türkçe akıcı, başlıklar tutarlı, ama içeriğin büyük kısmı **zaten bilen birine yönelik başvuru atlası veya koçluk metni**; «ders» (tek kavram, örnek, alıştırma, kontrol sorusu) biçiminde değil, sıralı değil.

### 1.5 Yinelenenler

- Tam aynı H1 başlığı: **0** (632 md'nin ilk `# ` satırı normalleştirilip karşılaştırıldı).
- Dosya adı benzerliği (Jaccard ≥ 0,45): **15 çift**. En belirginleri:

| Benzerlik | Dosya A | Dosya B |
|---|---|---|
| 0,90 | `AYS\ayt\ayt_matematik_trigonometri_toplam_fark_yarim_aci_ve_denklemler_cerrahi_atlasi` | `…_cerrahi_cozum_atlasi` |
| 0,83 | `AYS\ayt\ayt_sosyal_2_felsefe_grubu_…_din_kulturu_tam_atlasi` | `AYS\ayt\ayt_sosyal_2_tarih_cografya_felsefe_grubu_…_tam_atlasi` |
| 0,70 | `AYS\ayt\ayt_fizik_basit_harmonik_hareket_ve_sarkaclar_…` | `AYS\ayt\ayt_fizik_basit_harmonik_hareket_yay_ve_basit_sarkac_…` |
| 0,67 | `KING\ic_disiplin\stoaci_zihinsel_dayaniklilik_…` | `KING\kriz_ve_geri_donus\krizde_stoaci_dayaniklilik_…` |
| 0,60 | `ESP\yazi_ve_kompozisyon\akademik_makale_deneme_hikaye_…` | `ESP\yazi_ve_kompozisyon\deneme_akademik_makale_ve_dramatik_hikaye_…` |
| 0,60 | `AYS\ayt\ayt_kimya_organik_kimyaya_giris_hibritlesme_sigma_pi_…` | `AYS\ayt\ayt_kimya_organik_kimyaya_giris_hibritlesme_ve_vsepr_atlasi` |
| 0,54 | `KING\iletisim_ve_karizma\yazili_iletisim_ikna_edici_metin_mimarisi_soguk_eposta_…` | `…_ve_net_dusunme_sanati_atlasi` |
| 0,45 | `ESP\felsefe\dogu_ve_islam_felsefesi_hikmet_gelenegi_…` | `ESP\felsefe\islam_dusunce_ekolleri_ve_dogu_felsefesi_…` |

Kalan 7 çift AYS içinde (coğrafya harita, sosyal bilimler, kontrol teorisi, hücresel solunum, kavram ikilileri). İçerik düzeyinde benzerlik ölçmedim.

## 2. Sahibin hedefine göre kapsam (alan alan)

Sayılar `C:\gemini-data` dosya adlarından (`ls … | grep -c`). «Sıfırdan başlanır mı» sütunu örneklem okumasına dayanır (§1.4).

| Alan | Var olan (gemini-data) | Başladığı düzey | Sıfırdan başlayan biri kullanabilir mi | Başlıca boşluklar |
|---|---|---|---|---|
| **Dil** | `ESP\dil` 8 + `ESP\dil_ogrenimi` 4 = 12 konu; adında geçen diller: İngilizce 2 (`ingilizce_c1_c2_…`, `AYS\ayt\ydt_ingilizce_…`), Arapça/Latince/Grekçe 1 dosyada (etimoloji), başka dil göremedim | C1/C2, dilbilim, etimoloji, poliglot yöntemi (Krashen, Nation) | **Hayır.** «present simple» geçen ESP dosyası 0; A1 düzeyi ders göremedim. Alfabe: yalnız genel `dunya_alfabeleri_…_ipa_atlasi` (yazı sistemleri, IPA) | İngilizce A1→B2 tüm basamaklar; ses/telaffuz ünitesi; temel kelime listesi; dinleme/konuşma alıştırması; ikinci dil hiç yok |
| **Müzik / gitar** | `ESP\muzik_diksiyon` 9 konu; gitara özgü 1: `gitar_armoni_ve_diksiyon_ustalik.md` (aralık, gam, mod, CAGED, akor formülü) | Orta-ileri armoni | **Hayır.** Klavyedeki notalar, tutuş, akort, ilk akorlar, ritim tutma dersi göremedim. CAGED/aralık tablosu doğru (§1.4) | Gitar 0–2. aşama tamamen; müzik tarihi/makam/ritim (3 dosya) ileri aşamalarda referans |
| **Felsefe** | `ESP\felsefe` 29 konu + `AYS\ayt` felsefe adlı 5 + `MUFREDAT\felsefe.json` 22 MEB kazanımı + `MEDYA\ESP\esp_felsefe_ve_mantik_…` | Akım/filozof atlası (Frankfurt, fenomenoloji, Derrida…); mantık ve safsatalar | **Kısmen.** Mantık (`mantik_safsatalar_40_…`, `klasik_mantik_isagoci_…`), etik ikilemler, `klasik_metinler_okuma_rehberi_40_…` başlangıca yakın; «felsefi düşünme nedir» dersi göremedim | Giriş aşaması (soru sorma, argüman, kavram analizi) yazılmalı; konular var ama sırasız |
| **Tarih** | `ESP\tarih` 15 + AYS tarih adlı 7 | Uygarlık, diplomasi, bilim tarihi atlasları | **Kısmen.** Kronolojik omurga (çağlar zaman çizelgesi) göremedim; AYS tarih atlasları sınav odaklı | Kronoloji iskeleti; Türk tarihi temel dönemler sırası |
| **Okuma ve yazı** | `ESP\okuma_ve_sentez` 2, `ESP\yazi_ve_kompozisyon` 4 (2'si benzer, §1.5), `ESP\edebiyat_kitap` 17 | Adler analitik okuma, deneme/makale yapısı, edebiyat atlası | **Kısmen** (Adler yöntemi başlangıçta kullanılabilir) | Paragraf, cümle, özet yazma alıştırmaları; okuma listesi düzeyleri |
| **Beslenme** | `SPI\beslenme` 71 | Gıda atlasları (Atwater kalori, makro), biyokimya | **Kısmen.** `etiket_okuryazarligi_…`, `turk_mutfagi_ve_temel_besinler_kalori_makro`, `cig_pismis_agirlik_…` pratik; «ne yemeliyim» temel dersi göremedim | Temel ilkeler ünitesi (enerji dengesi, protein, tabak); çok sayıda örtüşen «fonksiyonel … atwater» dosyası (adında `atwater` geçen çok) |
| **Hareket** | `SPI\hareket` 63 | Biyomekanik/fizyoloji ileri (VBT, Prilepin, EMG) | **Hayır, büyük ölçüde.** «yeni başla/acemi/novice» geçen beslenme+hareket md: 4. Temel hareket kalıpları (squat, menteşe, itme, çekme) dersi göremedim | Başlangıç programı, teknik öğretimi, güvenlik |
| **Uyku** | adında uyku/sirkadiyen/melatonin geçen 5 SPI dosyası (ör. `SPI\saglik\uyku_mimarisi_rem_nrem_…_atlasi.json`) | Fizyoloji atlası | **Kısmen** (`sirkadiyen_biyoloji_…` içinde «24 saatlik rehber» bölümü) | Uyku hijyeni adımları; abartılı dil ayıklanmalı (§1.4) |
| **Tahlil** | ad eşleşmesiyle 13 SPI dosyası; doğrudan ilgili olanlar `SPI\saglik\fizyolojik_biyoizleme_biyobelirtecler_apob_hba1c_…`, `SPI\saglik\uyku_sirkadiyen_ve_tahlil_referanslari.json`, `…hematopoiez_…`, `…endokrin_sistem_…` | Biyobelirteç/referans atlası | Bir öğrenme yolu değil; referans tablo | Tıbbi tavsiye sınırı; referans aralıklarının kaynağı tek tek doğrulanmalı |
| **Akademik (YKS)** | `AYS\tyt` 20 + `AYS\ayt` 56; ad eşleşmesi: matematik 12, geometri 5, fizik 14, kimya 15, biyoloji 15, Türkçe 5, edebiyat 4, tarih 7, coğrafya 7, felsefe 5, din 6, İngilizce 1 · `MUFREDAT` 6 ders, 444 kazanım (biy 75, coğ 74, fel 22, fiz 105, kim 93, mat 75) · `AYS\kavram_haritalari\yks_tum_branslar_konu_on_kosul_zinciri_…` | Sınav tekrar atlası, soru kalıpları | **Hayır.** Konuyu bilen için tekrar; konu anlatımı değil | Türkçe, edebiyat, tarih, coğrafya, din MÜFREDAT'ta yok; konu anlatımı + çözümlü örnek + alıştırma yok |

Ek: KING (146 çift) ve ESP'nin `psikoloji_ve_insan`, `sosyoloji_ve_toplum`, `sanat_ve_estetik`, `strateji_ve_karar` (37 çift) sahibin on alanından hiçbirine doğrudan düşmüyor; King'in koçluk bilgisi ya da Felsefe/Okuma ileri aşamalarına referans olabilir.

## 3. Depoda zaten olan müfredat ve içerik

Kök: `C:\Users\ASUS\LifeOs-sadelesme`. Boyutlar `wc -c`, sayılar `grep -c` ile.

### 3.1 ESP merdiveni — `ESP/src/js/data/curriculum.js` (23.471 B, 496 satır)

| Öğe | Bulgu |
|---|---|
| Kademe | **Altı** kademe (`ESP.LEVELS`, rank 0–5): Temas, Acemi, Çırak, Kalfa, Usta, Üstat. Görevdeki «beş kademe» = rank 1–5'in tanımlı basamakları; rank 0 «ölçüm yok» konumu |
| Disiplin | 7: `lang`, `philo`, `music`, `diction`, `reading`, `writing`, `history` (satır 65, 131, 188, 244, 298, 353, 407) |
| Basamak | 35 `title` (7 × 5). Her basamakta `study[]` (ne çalışılır), `gates[]` (ölçülebilir kapı: `metric`, `min`, `max?`, `label`), `proof` (kapanış işi) |
| Kapı örneği | Dil 1 «Ses ve ilk 500 kelime»: `lang.cards ≥ 100`, `lang.days14 ≥ 5`, kanıt «kendini üç cümleyle tanıtan bir kayıt» (satır 80–87) |
| Felsefe | 1 «Soruyu tanımak» (dört ana soru, Sokratik diyalog, kavram sözlüğü; kapı `philo.concepts ≥ 5`), 2 «İlk tez» (öncül–sonuç, safsata kataloğu, primer metin; kapı `philo.args ≥ 3`), 3 «İtirazla yaşamak» (satır 140–160) |
| `blind[]` | Her disiplinde kapıların ölçemediği şeylerin listesi (dürüstlük alanı) |
| Yerleştirme | `ESP.PLACEMENT` (satır 475): 3 öz-beyan sorusu (kaç yıl, üretim, öğretme); sonuç «tahmin» etiketli, ilk ölçümle silinir |
| Yeniden kullanım | **Yüksek.** Kapı + kanıt + kör nokta fikri Yol motorunun ünite kapısının hazır modeli. Eksik: basamaklar ders değil, `study[]` yalnız başlık; Gitar ayrı değil (`music` içinde) |

### 3.2 Diğer ESP verisi (`ESP/src/js/data/`, toplam 1.469.854 B)

| Dosya | Boyut | Ne |
|---|---|---|
| `topics.js` | 23.690 | 68 konu kimliği; başlıktaki not: konu ilerlemesi «ölçüm değil beyan» |
| `ogrenmekartlari.js` | 150.388 | 68 kart, her biri bir `esp_topic_id`'ye bağlı; kaynak «esp-veriseti & esp-profesyonel-v4» |
| `lessons.js` | 10.020 | Ünite listesi (ör. `temel-fiil`, `gundelik`, `zaman`, `baglac`, `tartisma`, `akademik`, tarih `ilkcag`…`dusunce`); başlık: «Ünite bir DERS DEĞİLDİR», on kelimeyi desteye ekler |
| `grammar.js` | 5.588 | CEFR bandlı dilbilgisi konusu: A1 3, A2 3, B1 3, B2 3, C1 2, C2 1 (`band:` sayımı) |
| `kelimesiklik.js` | 115.449 | Üretilmiş; kaynak `veri/temiz/esp/kelime_sikligi.jsonl` (bu dosyayı depoda göremedim) |
| `kelimeornek.js` | 596.032 | Üretilmiş, Tatoeba (CC BY 2.0 FR) cümle çiftleri; 7 dil anahtarı: ar, de, en, es, fr, it, ru |
| `paralelcumleler.js`, `gamkatalog.js`, `guitar_tabs.js`, `phonetics.js`, `eartraining.js`, `canon.js`, `history.js`, `reading_method.js`, `rhetoric.js` | 87.038 / 81.840 / 6.918 / 6.515 / 4.653 / 11.280 / 22.653 / 4.221 / 6.423 | Alıştırma ve referans verisi (gam, tab, tekerleme, kulak eğitimi, kanon listesi, tarih) |

### 3.3 AYS ders içeriği (`AYS/src/js/data/`, toplam 2.253.783 B)

| Öğe | Bulgu |
|---|---|
| Konu listesi | `subjects.js` 32.826 B, 192 konu kimliği (`id:'xx-NN'`) |
| Konu anlatımı | `anlatim-{tr,tm,tf,ts,am,af,ak,ab}.js`: **184 konu** (tr 21, tm 35, tf 26, ts 30, am 22, af 18, ak 13, ab 19). Biçim (`anlatim.js` başlığı): `giris`, `bolumler[{baslik, metin, liste?, formul?, ornek{soru, cozum[]}, dikkat?}]` (2–6), `sorular[{soru, sec[5], dogru, cozum[]}]` (3–6). Etiket: «elle yazıldı · doğrulanmadı» |
| Derin anlatım | `derin-*.js` aynı 184 konu: `kazanim`, `kaliplar`, `hatalar`, `ornekler`, `sorular` |
| Özet | `ozetler.js` 143.322 B, 184 konu |
| Değer | **Depodaki tek gerçek «ders» biçimi.** Yol motorunun Ders şeması buradan türetilmeli |

### 3.4 veri/ katmanları ve kural

Kural (`tools/veri_denetle.py` satır 1–15): `temiz/` yalnız bir kaynaktan indirilen ya da hesaplanan kayıt (etiket `kaynakli-birincil|kaynakli-ikincil|tahmin|hesaplandı`, `kaynak` URL ya da `veri/ham/<id>.meta.json`, kanıt `alinti` ya da `tatoeba_id`); `taslak/` elle yazılan kayıt, etiket `dogrulanmamis`, «Hiçbir arayüze gitmez»; `reddedilen.jsonl` `neden` zorunlu.

| Katman | Dosyalar (satır) |
|---|---|
| `veri/temiz/ays` | `ansiklopedi_yks` (59 KB), `ipuclari`, `konu_dagilimi`, `reddedilen` |
| `veri/temiz/esp` | `ansiklopedi_genel.jsonl` 186 kayıt (Vikipedi tarzı `olgu`, ör. Thales) |
| `veri/temiz/spi` | `who_rehberler.jsonl` 191 kayıt (WHO, URL + lisans + `alinma`), `olgular`, `ansiklopedi_saglik`, `tuber_dogrulanan`, `reddedilen` |
| `veri/taslak/ays` | 6 dosya (`yks_mufredat_kazanimlari` 19, `formuller_kurallar`, `tdk_dilbilgisi`, …) |
| `veri/taslak/esp` | 8 dosya (`felsefe_filozoflar` 35, `gitar_akor_gam_katalogu` 14, `mantik_ve_safsatalar_ansiklopedisi`, `tarih_kronoloji`, …) |
| `veri/taslak/spi` | 7 dosya (`laboratuvar_referans` 46, `turk_yemekleri` 43, `uyku_hijyeni_rehberi` 7, …) |
| `veri/plan/konular.json` | **1.309 konu satırı** (AYS 314, ESP 665, SPI 330); biçim `{no, sistem, yol:[Ders, Konu, Alt?], kodlar}`. Kodlar (`veri/konu_plani.txt` satır 7–10): T tanım, K kural, F formül, A adım, Ö örnek, İ istisna, H hata, S sayı, N neden-sonuç, Y yöntem, B biyografi, G işleyiş, V sıra, E eser, R resmî eşik |
| `veri/KONULAR.json`, `KONULAR_EK.json` | 16.955 / 20.972 B; 18 + 19 kategori |

`veri/plan/konular.json` dil ve gitar için **hazır başlık iskeleti** içeriyor: İngilizce 24 (4.B.01 «Alfabe, sesler, telaffuz (IPA), vurgu» … 4.B.24), Almanca 20, Japonca 19, Rusça 17, İspanyolca 13, Arapça 12, Fransızca 12, Çince 10, Korece 9; Gitar 42 (4.N.01 «Gitar türleri» … 4.N.11 «Açık akorlar» … 4.N.21 «CAGED»); Felsefe 46 + 22 dönem/akım satırı; SPI Kalistenik 34, Esneklik 24, Uyku 20 (`plan/4-esp-diller-beceri.txt` satır 26–49, 200, 210–234).

Depo dışı not: `C:\Users\ASUS\LifeOs\veri` (çalışan kopya) altında `taslak/king`, `temiz/mufredat` olduğu önceki ajanın izinden anlaşılıyor; görev «başka klasöre dokunma» dediği için **açmadım, göremedim**.

### 3.5 SPI bilgi verisi (`SPI/src/js/data/`, toplam 724.439 B)

`egzersizkatalog.js` 246.388, `met.js` 130.167, `ogrenme.js` 79.304 (başlık beyanı: 30 kavram, 50 soru, 6 derin analiz, 22 kanıt kartı, 12 senaryo; `concept-` kimliği 30 sayıldı), `foods.js` 44.673, `biomarkers.js` 27.296, `movement.js` 19.551, `nutrients.js` 10.232. Kural: «kişiye özel doz/teşhis üretilmez» (`ogrenme.js` satır 3).

### 3.6 Öğretme motoru — bugün «ders» nedir

| Dosya | Satır | Rolü |
|---|---|---|
| `brand/ortak/ogrenmotor.js` | 901 | Konu biçimi: `{id, ad, grup, etiket, giris, kazanim[], akilda[], parcalar[{baslik, metin, liste?, formul?, dikkat?, ornek?, cizim?}], ornekler[], hatalar[], onKosul[id], terimler[], sorular[{id, soru, sec, dogru, ipucu?, cozum, seviye?}], acik[], aktarim[], niyet?, sinir?}` (satır 15–20). Akış: tahmin → anlatım → açıklama → örnek → yoklama → onarım → anlatma → aktarım → aralıklı tekrar. Günün kanıtı eşiği `ESIK = 2/3` (satır 66). Kayıt: modülün Store'u, yoksa `localStorage` `<modul>.<anahtar>` (satır 94–101). Etiketler: «elle yazıldı · doğrulanmadı», «model taslağı · doğrulanmadı», «senin metnin» |
| `brand/ortak/ogrenmotor-ekran.js` | 882 | Ekran |
| `brand/ortak/ogret.js` | 273 | Teşhis (kavram/işlem/dikkat/bilmiyor), Sokratik yönlendirme, **1/3/7 gün** tekrar, üçüncü doğruda kavram kapanır; kayıt `{[kavram]:{n, sonraki|bitti, ogeler?, y?}}` |
| `brand/ortak/usta.js` | 130 | Ustalık ölçeği: `yok, ogreniyor, tutuyor, kalici, saglam`; aralık `ilk 1, kalici 7, saglam 21, koru 60` gün (satır 45–46) |
| Kullanan | – | AYS `core/quiz.js` 92, `core/rehber.js` 53, `core/state.js` 1290, `core/ogrentest.js` 123 |

Sonuç: Yol motorunun **Ders + Alıştırma + tekrar + ustalık** katmanı büyük ölçüde hazır (`ogrenmotor` konu biçimi ≈ Ders). Eksik olan üst katman: Alan → Aşama → Ünite hiyerarşisi, ünite kapısı ve yerleştirme. `brand/ortak/king-yol.js` (1.543 satır) adına rağmen King yönlendirmesidir, öğrenme yolu değil.

## 4. Yol motoru için önerilen müfredat şeması

İlke: yeni şema icat etmek yerine var olan iki biçimi birleştir. **Ders = `ogrenmotor.js` konu biçimi** (§3.6, AYS `anlatim-*.js` ile uyumlu); **Aşama kapısı = ESP merdiveninin `gates/proof/blind` modeli** (§3.1). Üste yalnız Alan → Aşama → Ünite iskeleti eklenir.

### 4.1 Alanlar

| Düzey | Zorunlu alanlar | İsteğe bağlı | Not |
|---|---|---|---|
| **Alan** | `id`, `ad`, `hedef` (bir cümle), `asamalar[]` | `kor_noktalar[]` (merdivenin `blind`'ı), `yerlestirme` | 10 alan: akademik, dil-<kod>, felsefe, tarih, muzik-gitar, okuma-yazi, beslenme, hareket, uyku, tahlil |
| **Aşama** | `id`, `sira`, `ad`, `uniteler[]`, `kapi` | `kanit_isi` (merdivenin `proof`'u), `merdiven_rank` | Aşama kapısı = birimlerin hepsi `tutuyor`+ **ve** `kapi.olcutler` (merdiven metrikleri) |
| **Ünite** | `id`, `ad`, `dersler[]`, `kapi:{tur:'test', soru_sayisi, esik}` | `on_kosul[]` (ünite id) | **Ustalık kapısı**: ünite sonu karma test, eşik `ogrenmotor` `ESIK` (2/3) ya da üstü; geçmeden sonraki ünite «kilitli değil ama önerilmez» |
| **Ders** | `id`, `ad`, `durum`, `dogrulama`, `kaynaklar[]` | `ogrenmotor` konu alanlarının tümü (`giris, parcalar, ornekler, hatalar, terimler, sorular, acik, aktarim`), `on_kosul[]`, `dis_okuma[]` (gemini-data atlası) | `durum: 'iskelet' | 'taslak' | 'onayli'`; `iskelet` = yalnız başlık, King ilk açılışta üretir |
| **Alıştırma** | Dersin `sorular[]` (çoktan seçmeli), `acik[]` (açık uçlu + `olcut`), `aktarim[]` | `tur: 'dikte' | 'kart' | 'calma' | 'uygulama'` (dil/gitar/hareket için) | Puanlama ve tekrar: `ogret.js` 1/3/7 gün + `usta.js` aşamaları; yeni ölçek yok |
| **Kaynak** | `ad`, `tur: 'kitap'|'url'|'kurum'|'derlem'`, `dogrulama` | `url`, `sayfa`, `alinti`, `lisans` | `temiz/` kuralındaki `kaynak` + `alinti` ile aynı adlar |

### 4.2 Doğrulama durumu ve dört etiket — iki ayrı eksen

| Eksen | Değerler | Nereye | Dayanak |
|---|---|---|---|
| **İçeriğin doğruluğu** (ders, kaynak) | `dogrulanmamis` (model ya da elle yazıldı) · `kaynakli` (kaynak gösterildi, satır satır denetlenmedi) · `denetlendi` (sahip ya da `tools/veri_dogrula.py` kaynak metniyle eşledi) | Ders ve kaynak kartında rozet: «model taslağı · doğrulanmadı», «elle yazıldı · doğrulanmadı» | `ogrenmotor.js` etiketleri (`ortak.om.etiket-*`), `veri_denetle.py` katmanları |
| **Öğrenenin sayıları** (dört etiket, AGENTS §1.2 satır 49–50) | `ölçüldü` (test cevabı, dakika) · `tahmin` (yerleştirme sonucu) · `hesaplandı` (ustalık %, aşama ilerlemesi) · `veri yok` (hiç denenmemiş ünite) | İlerleme çubukları, kapı göstergeleri, yerleştirme | `ESP.PLACEMENT` notu «tahmin» etiketi, merdiven «missing» kapısı |

### 4.3 Yerleştirme (alfabeyi bilen sıfırdan başlamasın)

1. Alan ilk açıldığında 2 seçenek: «Baştan başla» ya da «Seviyemi bul».
2. «Seviyemi bul»: her aşamanın ünite kapı sorularından **aşama başına 5–8 soru** kolaydan zora sorulur; bir aşamada eşiğin (2/3) altına düşülen ilk yerde durulur.
3. Geçilen aşamaların üniteleri `yerlestirme` işaretiyle **atlandı** olur, «öğrenildi» değil; sayı etiketi `tahmin`. Ünite tekrar listesine girmez ama kişi isterse açar.
4. İlk normal ünite kapısı geçilince `tahmin` silinir (merdivenin «ilk ölçümler geldiğinde tahmin silinir» kuralı, `curriculum.js` satır 476–477).
5. Dil ve gitar gibi beceri alanlarında soru yetmez: yerleştirme bir **üretim görevi** de ister (3 cümle yaz / bir akor geçişini çal ve işaretle) — merdivenin `proof`'u.

### 4.4 Somut örnek (Felsefe, 1. aşama, 1. ünite)

```json
{
  "id": "felsefe",
  "ad": "Felsefe",
  "hedef": "Felsefi düşünmeyi sıfırdan öğrenip kendi tezini savunabilmek",
  "kor_noktalar": ["Bir argümanın gerçek bir tartışmada ikna edip etmediği"],
  "asamalar": [{
    "id": "felsefe.1", "sira": 1, "ad": "Soruyu tanımak", "merdiven_rank": 1,
    "kapi": { "olcutler": [{ "metric": "philo.concepts", "min": 5 }] },
    "kanit_isi": "Bir kavramı kendi cümlenle tanımlamak",
    "uniteler": [{
      "id": "felsefe.1.1", "ad": "Felsefe ne sorar?",
      "kapi": { "tur": "test", "soru_sayisi": 8, "esik": 0.67 },
      "dersler": [{
        "id": "felsefe.1.1.1", "ad": "Merak, şaşırma ve felsefi soru",
        "durum": "iskelet", "dogrulama": "dogrulanmamis",
        "kaynaklar": [{ "ad": "MEB Felsefe Öğretim Programı, FEL.10.1.1", "tur": "kurum",
                        "url": "<MUFREDAT/felsefe.json kaynak_url>", "dogrulama": "kaynakli" }],
        "dis_okuma": ["gemini:ESP/felsefe/filozoflar_akimlar_dusunce_deneyleri"],
        "giris": null, "parcalar": [], "sorular": []
      }]
    }]
  }]
}
```

### 4.5 Var olan içerik bu şemaya nasıl oturur

| Kaynak | Şemadaki yeri | Nasıl |
|---|---|---|
| ESP merdiveni (35 basamak) | **Aşama** | rank 1–5 → aşama 1–5; `title` → aşama adı; `study[]` → ünite adı tohumu; `gates` → `kapi.olcutler`; `proof` → `kanit_isi`; `blind` → `kor_noktalar`. Gitar için `music` merdiveni ayrılmalı |
| `veri/plan/konular.json` (1.309 satır) | **Ünite / Ders başlığı** | `yol[1]` → ünite, `yol[2]` → ders; `kodlar` (T/K/Ö/H…) → dersin hangi parçaları olacağı (tanım, kural, örnek, hata) |
| AYS `anlatim-*.js` + `derin-*.js` (184) | **Ders** (doğrudan) | Biçim zaten `ogrenmotor` konu biçimi; `durum: 'taslak'`, `dogrulama: 'dogrulanmamis'` |
| MÜFREDAT (444 kazanım) | **Ünite/Ders hedefi** (`kazanim[]`) ve kaynak | Kazanım kodu (ör. `FEL.10.1.1`) ders kimliğine iliştirilir |
| gemini-data atlasları (632 çift) | **Ders değil, `dis_okuma` / King bağlamı** | Atlaslar ders biçiminde değil (§1.4); King ders üretirken bağlam olarak okur, öğrenene «ileri okuma» olarak gösterilir |
| `veri/temiz` (WHO, ansiklopedi, Tatoeba) | **Kaynak** + alıştırma malzemesi | `kaynakli-birincil` kayıtlar `dogrulama: 'kaynakli'`; Tatoeba cümleleri dil dikte/çeviri alıştırması |

### 4.6 Dosyalar nerede durmalı (veri kuralına göre)

Çelişki: kural «`taslak/` hiçbir arayüze gitmez» (`tools/veri_denetle.py` satır 11–12) diyor, ama AYS'nin elle yazılmış, doğrulanmamış anlatımları arayüzde etiketle gösteriliyor (`AYS/src/js/data/anlatim.js` satır 11–16). Yani depoda fiilen iki sınıf var: **olgu verisi** (`veri/`) ve **ders metni** (uygulama içeriği).

| Ne | Önerilen yer | Gerekçe |
|---|---|---|
| Ham gemini-data kopyası | `veri/ham/gemini/` (git dışı, `.gitignore` satır 43) | Kural: toplanan ham veri git dışı |
| Alan iskeleti (elle yazılır) | `icerik/<alan>/yol.json` | Ders metni sınıfı; arayüze gider, etiketli |
| Ders metni | `icerik/<alan>/dersler/<ders-id>.json`, yayında alan/ünite başına bir paket | Tembel yükleme birimi ünite |
| Kaynaklı olgu | `veri/temiz/<alan>/…jsonl` (değişmez) | Mevcut kural |
| gemini-data'dan seçilen ama ders olmayan atlas | `veri/taslak/<alan>/gemini_*.jsonl` | Elle/model yazımı → taslak; King bağlamı olarak okunur, arayüze ders diye gitmez |

Bu ayrım **sahibin kararı** (bkz. §7 açık soru 1). `icerik/` adı öneridir; depoda böyle bir klasör göremedim.

## 5. İçe aktarma hattı

Hedef: `C:\gemini-data` → paketlenmiş, tembel yüklenen içerik. Toplu aktarım yok: **önce iskelet, sonra iskeletin istediği dosyalar** (sahibin «yeni toplu veri yok» önerisiyle uyumlu).

| # | Adım | Girdi → çıktı | Yeniden kullanılacak araç | Kapı (geçmezse dur) |
|---|---|---|---|---|
| 0 | Ham kopya | `C:\gemini-data` → `veri/ham/gemini/` (git dışı) + `manifest` SHA-256 listesi | – (kopya) | Dosya sayısı 1.306, SHA listesi |
| 1 | Yapı denetimi | ham → rapor | `C:\gemini-data\_araclar\denetle.py` (109 satır, salt okur, kalite bloğu + seviye kodu denetler) | 650/650 JSON geçerli (bugün geçiyor) |
| 2 | Normalleştirme | `.md` gövdesi → `{id, alan, baslik, bolumler[{baslik, metin}], kaynaklar[], gemini_yolu, sha}` | Yeni küçük betik (yalnız standart kütüphane; `tools/veri_cikar.py`'nin «tablo kodla, model yok» yolu örnek) | Bozuk LaTeX (29 md, §1.2) düzeltilir ya da işaretlenir; JSON'un 521 şekli **okunmaz**, gövde md'den alınır |
| 3 | Yineleme ayıklama | normal kayıtlar → tekil + `reddedilen.jsonl` (`neden: 'yineleme'`) | Ad benzerliği (Jaccard, §1.5) + gövde benzerliği; `_araclar\KARAR_BEKLEYEN.md` §3'teki 3 aday | 15 aday çiftin her biri karar almış |
| 4 | Doğrulama durumu | her kayıt `dogrulama: 'dogrulanmamis'` | `tools/veri_denetle.py` (taslak etiketi) | Hiçbir kayıt kendi beyanıyla (`teknik_butunluk` «%100», «ONAYLANDI») `denetlendi` olmaz |
| 5 | Kaynak denetimi (yalnız seçilenler) | Dersin dayandığı iddia → kaynak metni | `tools/veri_dogrula.py` (192 satır: taslak kaydı resmî kaynak metniyle eşler, eşleşeni `temiz/`e alır) | Kaynak URL'si olmayan 2.523 girdi için önce URL/kitap bulunmalı (§1.3: URL'li girdi 0) |
| 6 | İskelete bağlama | kayıt → `ders.dis_okuma[]` ya da `ders` taslağı | Elle (sahip + Claude); `veri/plan/konular.json` başlıklarıyla ad eşleme önerisi | Her bağ bir ders kimliğine düşer; bağsız kayıt `veri/taslak/<alan>/gemini_*.jsonl`'da bekler |
| 7 | Ders üretimi (istek üzerine) | iskelet ders + bağlı atlas + kazanım → `ogrenmotor` konu biçimi | King; sayı ve olgu yalnız bağlamdan (`ogrenmotor` söz 1: «kaynakta olmayan sayı getiren cevap gösterilmez», `sayiTemiz`) | `durum: 'taslak'`, rozet «model taslağı · doğrulanmadı» |
| 8 | Sahip onayı | taslak → `onayli` | Arayüzde «onayla / düzelt / reddet»; reddedilen `neden`'le kayda | Onaysız ders tekrar takvimine girer ama rozeti kalır |
| 9 | Paketleme | `icerik/<alan>/…` → alan/ünite başına tek JS/JSON paket | `tools/veri_esp_siklik.py` ve `tools/veri_plan.py` deseni («ÜRETİLMİŞ DOSYA — BURAYI DÜZENLEME» başlığı, `--denetle` ile CI) | Paket güncel mi (`--denetle`) |
| 10 | Tembel yükleme | ünite açılınca paket istenir | AYS `core/state.js` satır 1290'daki `OGRENMOTOR.yukle()` kancası | İnternetsiz çalışır (paket önbellekte) |

Dikkat edilecekler:
- **Sağlık alanları (Beslenme, Hareket, Uyku, Tahlil)**: `ogrenmotor` söz 6 ve `SPI/src/js/data/ogrenme.js` satır 3 «teşhis ve doz yok». Adım 2'de doz/teşhis cümleleri ayıklanmalı; BPC-157 gibi konular (`SPI\saglik\biyoaktif_peptitler_…`) ders havuzuna alınmamalı.
- Lisans: `lisans`/`license` anahtarı yalnız 9 MEDYA JSON'unda var; öteki 641 JSON'da göremedim. İçerik model çıktısıdır; telifli eserden uzun alıntı olup olmadığını denetlemedim.

## 6. Pilot taslak yol haritaları

Kısaltmalar: **G:** = `C:\gemini-data\…` · **R:** = depo dosyası · **Boşluk** = içerik yok, King üretir ya da elle yazılır. «Kısmi» = konu geçiyor ama ders biçiminde değil. Aşama adları ESP merdiveninden (`R: ESP/src/js/data/curriculum.js`).

### 6.1 Felsefe — sıfırdan uzmanlığa

| Aşama | Ad (merdiven) | Üniteler | Kapı |
|---|---|---|---|
| 1 | Soruyu tanımak | 1.1 Felsefe ne sorar · 1.2 Kavram ve tanım · 1.3 Felsefenin alanları | Ünite testleri ≥ 2/3 + `philo.concepts ≥ 5` + kanıt: bir kavramı kendi cümlenle tanımla |
| 2 | İlk tez | 2.1 Argümanın yapısı · 2.2 Geçerlilik ve akıl yürütme türleri · 2.3 Safsatalar · 2.4 İlk primer metin | Testler + `philo.args ≥ 3`, `philo.primaryBooks ≥ 1` + kanıt: bir teze itiraz yazıp cevapla |
| 3 | İtirazla yaşamak | Bilgi · varlık · ahlak · siyaset · düşünce deneyleri | Her alanda bir karşıt-konum yazısı |
| 4 | Gelenekler arası | Antik → Ortaçağ/İslam → modern → çağdaş; Doğu düşüncesi | Dönemler arası karşılaştırma yazısı |
| 5 | Kendi sorusu | Primer metin derin okuma, çağdaş tartışmalar, kendi makalesi | Özgün kısa makale (merdiven `proof`) |

**Aşama 1 dersleri**

| # | Ders | Var olan içerik | Durum |
|---|---|---|---|
| 1 | Felsefe nedir: merak ve felsefi soru | R: `AYS/src/js/data/anlatim-ts.js` `ts-f1` «Felsefeyi tanıma» (satır 436+, ders biçiminde, sorulu) + `derin-ts.js` `ts-f1`; G: `MUFREDAT/felsefe.json` FEL.10.1.1 | **Var** (doğrulanmamış) |
| 2 | Felsefi soru, bilimsel soru, gündelik soru | `ts-f1` içinde «öteki alanlardan farkı» bölümü | Kısmi |
| 3 | Sokrates ve sorarak düşünmek | G: `MEDYA/KING/king_sokratik_sorgulama_ve_karar_agaclari_svg_semalari`, G: `ESP/dil/tartisma_munazara_sokratik_sorgulama_…`; R: `veri/temiz/esp/ansiklopedi_genel.jsonl` (Sokrates geçen 7 kayıt) | Kısmi (atlas + olgu) |
| 4 | Kavram nedir, iyi bir tanım nasıl kurulur | G: `MUFREDAT/felsefe.json` FEL.10.2.1 (yalnız kazanım) | **Boşluk** |
| 5 | Bilgi felsefesi: ne bilebiliriz | R: `anlatim-ts.js` `ts-f2`; G: `ESP/felsefe/epistemoloji_ve_hakikat_teorileri_…` (ileri) | Var |
| 6 | Varlık felsefesi | R: `anlatim-ts.js` `ts-f3`; R: `veri/plan/3-esp-felsefe-tarih.txt` 3.A.04 | Var |
| 7 | Değer alanları: ahlak, sanat, din, siyaset, bilim | R: `anlatim-ts.js` `ts-f4`, `ts-f5`; G: FEL.10.5.1–10.9.1 | Var |
| 8 | Felsefe tarihinin dönemlerine ilk bakış | R: `veri/plan/…` 3.A.02; R: `ansiklopedi_genel.jsonl` (`felsefe` kategorisi 103 kayıt); G: `ESP/felsefe/filozoflar_akimlar_dusunce_deneyleri` | Kısmi |

**Aşama 2 dersleri**

| # | Ders | Var olan içerik | Durum |
|---|---|---|---|
| 1 | Önerme, öncül, sonuç | R: `anlatim-ts.js` `ts-f8` «Mantık»; G: `ESP/felsefe/klasik_mantik_isagoci_beş_sanat_ve_modern_epistemoloji`; G: FEL.10.2.2 | Var |
| 2 | Tümdengelim, tümevarım, analoji | G: `klasik_mantik_…` (atlas) | Kısmi |
| 3 | Geçerlilik ile doğruluk farkı | – | **Boşluk** |
| 4 | Safsatalar: en sık 10 hata | G: `ESP/felsefe/mantik_safsatalar_40_mantik_hatasi_…`; G: `ESP/yazi_ve_kompozisyon/retorik_kompozisyon_ve_mantiksal_safsatalar`; R: `veri/taslak/esp/mantik_ve_safsatalar_ansiklopedisi.jsonl` (7 kayıt) | Kısmi (malzeme bol, ders yok) |
| 5 | Düşünce deneyleriyle düşünmek | G: `ESP/felsefe/etik_ikilemler_adalet_teorileri_…_50_dusunce_deneyi`, G: `paradoks_atlasi_…_60_paradoks`; R: `veri/taslak/esp/dusunce_deneyleri.jsonl` (7) | Kısmi |
| 6 | İlk primer metin: nasıl okunur | G: `ESP/felsefe/klasik_metinler_okuma_rehberi_40_kurucu_felsefe_eseri_serhi`; G: `ESP/okuma_ve_sentez/adler_analitik_syntopical_okuma_…` | Kısmi |
| 7 | Kendi tezini yazmak ve itiraz etmek | R: merdiven `philo` rank 2 `proof` (yalnız tanım) | **Boşluk** (alıştırma) |

Aşama 3–5 için G: `ESP\felsefe` 29 atlasın neredeyse tamamı ileri okuma olarak bağlanabilir (etik, siyaset, fenomenoloji, Frankfurt, postyapısalcılık, İslam ve Doğu felsefesi).

### 6.2 Dil (İngilizce) — sıfırdan C düzeyine

| Aşama | Ad (merdiven) | CEFR | Üniteler | Kapı |
|---|---|---|---|---|
| 1 | Ses ve ilk 500 kelime | A1 | 1.1 Alfabe ve sesler · 1.2 Kendini tanıtma · 1.3 Sayı, saat, gün · 1.4 İlk zamanlar · 1.5 İlk 500 kelime | Testler + `lang.cards ≥ 100`, `lang.days14 ≥ 5` + kanıt: kendini üç cümleyle tanıtan kayıt |
| 2 | Kalıptan cümleye | A2 | Geçmiş · gelecek · edatlar · soru kurma · gündelik diyalog · dinleme | `lang.cards ≥ 400`, hatırlama ≥ %70, 30 günde 600 dk + kanıt: sözlüksüz 150 kelimelik metin |
| 3 | i+1 üretim | B1–B2 | Koşul, edilgen, ilgi cümlesi, dolaylı anlatım; kendi alanında okuma; hata günlüğü | Merdiven rank 3 kapıları |
| 4 | Düşünce dili | C1 | Akademik yazı, hedging, eşdizim, phrasal verb sistemi | Merdiven rank 4 kapıları |
| 5 | Aktarım | C2 | Çeviri, geri çeviri, öğretme | Merdiven rank 5 kapıları |

**Aşama 1 dersleri**

| # | Ders | Var olan içerik | Durum |
|---|---|---|---|
| 1 | İngiliz alfabesi ve harf adları | R: `veri/plan/4-esp-diller-beceri.txt` 4.B.01 (yalnız başlık) | **Boşluk** |
| 2 | Sesler ve IPA ile okuma | G: `ESP/dil/dunya_alfabeleri_yazi_sistemleri_tipografi_ve_fonetik_transkripsiyon_ipa_atlasi` (genel, İngilizceye özgü değil) | Kısmi |
| 3 | Selamlaşma ve kalıplar | R: `ESP/src/js/data/lessons.js` `gundelik` (A1, hedef + görev + kart öğeleri; ders metni yok) | Kısmi |
| 4 | to be, zamirler, kendini tanıtma | R: plan 4.B.05 | **Boşluk** |
| 5 | a/an/the, çoğul, sayılabilirlik | R: plan 4.B.03–04 | **Boşluk** |
| 6 | Sayılar, saat, günler, yön | R: merdiven `lang` rank 1 `study` | **Boşluk** |
| 7 | Şimdiki ve geniş zaman | R: `ESP/src/js/data/grammar.js` `simdiki` (A1, harita girdisi) | Kısmi |
| 8 | En sık 30 fiil ve ilk 500 kelime | R: `lessons.js` `temel-fiil` (A1); R: `ESP/src/js/data/kelimesiklik.js` (`en`), `kelimeornek.js` (`en`, Tatoeba cümle çiftleri, `temiz`) | **Var** (kelime + örnek cümle; ders değil, kart malzemesi) |

**Aşama 2 dersleri**

| # | Ders | Var olan içerik | Durum |
|---|---|---|---|
| 1 | Geçmiş zaman ve düzensiz fiiller | R: `grammar.js` `gecmis` (A2); R: plan 4.B.10–11 | Kısmi |
| 2 | Gelecek ve niyet | R: `grammar.js` `gelecek` (A2) | Kısmi |
| 3 | Zaman ve sıklık zarfları | R: `lessons.js` `zaman` (A2) | Kısmi |
| 4 | Edatlar (zaman, yer, hareket) | R: `grammar.js` `edat` (A2); plan 4.B.08 | Kısmi |
| 5 | Soru kurma ve soru ekleri | R: plan 4.B.20 | **Boşluk** |
| 6 | Sıfatlar ve karşılaştırma | R: plan 4.B.06 | **Boşluk** |
| 7 | can / must / have to | R: plan 4.B.12 | **Boşluk** |
| 8 | Gündelik diyalog ve dinleme günlüğü | R: merdiven `lang` rank 2 `study` | **Boşluk** (dinleme malzemesi hiç yok) |

Aşama 4 için G: `ESP/dil/ingilizce_c1_c2_ustalik_ve_karsilastirmali_dunya_dilleri` ve G: `AYS/ayt/ydt_ingilizce_akademik_dil_…` hazır ileri okuma; G: `ESP/dil_ogrenimi` (Krashen, Nation) yöntem dersleri olarak her aşamaya «nasıl çalışılır» notu verir.

### 6.3 Dört alan — yalnız aşamalar

| Aşama | Gitar | Beslenme | Hareket | Akademik (YKS) |
|---|---|---|---|---|
| 1 | **El ve ses**: gitarın bölümleri, akort, tutuş, klavyedeki notalar, ilk açık akorlar (R: plan 4.N.01–11; R: `veri/taslak/esp/gitar_akor_gam_katalogu.jsonl` 14) — çoğu boşluk | **Temeller**: enerji dengesi, makro besinler, tabak, etiket okuma (G: `SPI/beslenme/etiket_okuryazarligi_…`, `turk_mutfagi_ve_temel_besinler_kalori_makro`; R: `veri/temiz/spi/who_rehberler.jsonl`) | **Güvenli başlangıç**: ısınma, temel kalıplar (çömelme, menteşe, itme, çekme, taşıma) (R: `veri/taslak/spi/egzersiz_kalistenik_rehberi.jsonl`; R: `SPI/src/js/data/egzersizkatalog.js`) — ders boşluk | **Yöntem ve tanı**: nasıl çalışılır, ön-koşul haritası, ilk deneme (G: `AYS/ogrenme_bilimi` 16, G: `AYS/kavram_haritalari/yks_tum_branslar_konu_on_kosul_zinciri_…`) |
| 2 | **Temiz tempo**: ritim, metronom, akor geçişi, barre (R: plan 4.N.09–16; R: `ESP/src/js/data/guitar_tabs.js`) | **Uygulama**: öğün kurma, porsiyon, ölçü, dışarıda yemek (G: `cig_pismis_agirlik_…`, `kahvalti_kombinasyonlari_…`, `yemekhane_restoran_…`) | **Düzenli program**: haftada 3 tam vücut, ilerleme kuralı (G: `SPI/hareket/antrenman_programlama_mimarileri_…`) | **TYT temelleri**: R: `anlatim-tr/tm/tf/ts.js` 112 konu (ders biçiminde) |
| 3 | **Repertuar**: gamlar, pentatonik, şarkı (R: `ESP/src/js/data/gamkatalog.js`, plan 4.N.17–19) | **Hedefe göre**: kilo, performans (G: `hedefe_gore_makro_periyodizasyonu_…`, `spor_beslenmesi_…`) | **Kuvvet ve kas ilkeleri**: hacim, RIR/RPE (G: `hipertrofi_*` 3 dosya) | **AYT alan dersleri**: R: `anlatim-am/af/ak/ab.js` 72 konu; Edebiyat, Tarih-2, Coğrafya-2, Felsefe grubu için ders dosyası göremedim |
| 4 | **Müzikalite**: armoni, CAGED, modlar, kulak (G: `ESP/muzik_diksiyon/gitar_armoni_ve_diksiyon_ustalik`; R: `eartraining.js`) | **Mikro besin ve sağlık**: vitamin, mineral, sindirim (G: `vitaminler_ve_mineraller_27_…`; R: `nutrients.js`) | **Kondisyon ve hareketlilik**: VO2max, polarize, mobilite (G: `dayaniklilik_*`, `esneklik_*`) | **Soru kalıpları ve hız** (G: `AYS/soru_bankasi_kaliplari` 9, tyt/ayt atlasları) |
| 5 | **Kendi sesi**: doğaçlama, beste (G: `makam_teorisi_…`, `ritim_matematigi_…`) | **İleri ve kanıt okuma**: mikrobiyota, nutrigenomik (G: ileri atlaslar) | **İleri programlama**: blok periyodizasyon, VBT (G: `blok_periyodizasyonu_…`, `hiz_tabanli_antrenman_vbt_…`) | **Deneme ve ince ayar** (G: `AYS/deneme_ve_analiz_motoru` 5) |

## 7. Öneri, eksik tahmini, açık sorular

### 7.1 Pilot: **Felsefe**

§6'daki ilk iki aşamanın ders tablolarından sayım:

| | Ders | Var | Kısmi | Boşluk |
|---|---|---|---|---|
| Felsefe (aşama 1–2) | 15 | 5 | 7 | 3 |
| İngilizce (aşama 1–2) | 16 | 1 | 7 | 8 |

Gerekçe:
1. Felsefede **ders biçiminde, sorulu** 6 konu zaten var (`AYS/src/js/data/anlatim-ts.js` ve `derin-ts.js`: `ts-f1`–`ts-f5`, `ts-f8`); `ogrenmotor` bunları bugün çalıştırıyor. İngilizcede ders metni olan bir konu göremedim (`lessons.js` üniteleri kelime kartıdır, «Ünite bir DERS DEĞİLDİR»).
2. Felsefe için kaynak malzeme en zengin alan: 29 G atlası, 22 MEB kazanımı (`MUFREDAT/felsefe.json`), `veri/temiz/esp/ansiklopedi_genel.jsonl` içinde 103 felsefe kaydı, taslakta filozof (35), safsata (7), düşünce deneyi (7).
3. Felsefe yalnız metin ister; dil ve gitar ses, telaffuz, dinleme ve çalma kanıtı ister. Bu malzeme ve altyapı hiç yok (ses dosyası ya da dinleme içeriği göremedim).
4. Doğrulama daha kolay: felsefe dersindeki iddialar kanonik metinlere dayanır, sağlık alanlarındaki doz/teşhis riski yoktur.

İngilizce ikinci pilot olmalı: kart, SRS, sıklık listesi ve Tatoeba cümleleri (`kelimesiklik.js`, `kelimeornek.js`, `temiz` katmanı) hazır olduğu için **alıştırma** tarafı güçlü, **ders** tarafı boş.

### 7.2 Eksik içerik tahmini (etiket: tahmin)

| Alan | Var olan ders biçiminde içerik | Kaba hedef (5 aşama × ~5 ünite × ~5 ders) | Eksik |
|---|---|---|---|
| Akademik (YKS) | 184 konu (`anlatim-*`), `subjects.js` 192 konunun ~%96'sı | ~190 (sınav konusu kadar) + AYT Edebiyat / Sosyal-2 | Az; AYT sözel ve EA dersleri yok, hepsi doğrulanmamış |
| Felsefe | 6 | ~125 | ~%95 |
| Dil (her dil için) | 0 | ~125 | ~%100 (kelime/cümle alıştırma malzemesi var) |
| Gitar, Tarih, Okuma-yazı, Beslenme, Hareket, Uyku | 0 (G'de yalnız atlas) | ~125'er | ~%100 |
| Tahlil | 0 | Yol değil, başvuru tablosu olmalı | – |

Toplam: Akademik dışında **yaklaşık 900–1.000 ders** eksik (8 alan × ~125; tek dil sayılarak). gemini-data bu eksiği **ders olarak** kapatmıyor; King'in ders yazarken okuyacağı bağlam ve öğrenene «ileri okuma» olarak işe yarıyor. Sahibin «iskelet önce, ders istek üzerine» önerisi bu sayılar karşısında tek gerçekçi yol: pilotta yalnız iskelet + aşama 1–2'nin 15 dersi.

### 7.3 Sahibe açık sorular

1. **Ders metni nerede durur?** Kural «`taslak/` arayüze gitmez» (`tools/veri_denetle.py`), ama AYS anlatımları elle yazılmış ve arayüzde. Önerim: ayrı bir `icerik/` sınıfı (ders metni, etiketli) + `veri/` (olgu). Kabul mü?
2. **Onaysız ders tekrar takvimine girsin mi?** Yoksa King'in ürettiği ders, sen onaylayana kadar yalnız okunur mu?
3. **gemini-data'nın 2.523 kaynak girdisinin hiçbiri URL taşımıyor ve hiçbiri doğrulanmış değil.** Kaynak denetimi yalnız pilotta seçilen dersler için mi yapılsın (önerim), yoksa toptan mı?
4. **KING klasörü (146 çift) ve ESP'nin psikoloji/sosyoloji/sanat/strateji alt klasörleri (37 çift)** on alana düşmüyor. King'in bilgi tabanı mı olsun, yoksa bırakılsın mı?
5. **Dil sırası**: İngilizceden sonra hangisi? `veri/plan/konular.json` 11 dil için başlık taşıyor (Almanca 20, Japonca 19, Rusça 17 …).
6. **Ses**: dil ve gitar için telaffuz/dinleme nereden gelecek (yerel TTS, kayıt, dış kaynak)?
7. **YKS alanı**: SAY mı, EA mı? AYT Edebiyat ve Sosyal-2 için ders dosyası göremedim.
8. **Yerleştirme**: bugünkü `ESP.PLACEMENT` öz-beyan (3 soru). Test temelli yerleştirmeye (§4.3) geçilsin mi?
9. **Yinelenen adaylar**: `C:\gemini-data\_araclar\KARAR_BEKLEYEN.md` §3'teki 3 çift ve bu raporun §1.5'teki 15 çifti için hangisi kalsın?
10. **Sağlık sınırı**: BPC-157 gibi konular (`SPI\saglik\biyoaktif_peptitler_…`) ve abartılı başlıklar (§1.4) hiç alınmasın mı?

### 7.4 Göremediklerim / doğrulayamadıklarım

- gemini-data içeriğinin konu konu doğruluğu: yalnız gitar (CAGED, aralıklar), tarih tarihleri ve birkaç başlık kontrol edildi; geri kalanı örneklemle yargılandı.
- İçerik düzeyinde yineleme (gövde benzerliği) ölçülmedi; yalnız ad benzerliği.
- Çalışan kopya `C:\Users\ASUS\LifeOs\veri` (görev dışı klasör) açılmadı.
- `veri/temiz/esp/kelime_sikligi.jsonl` ve `cumle_ciftleri*.jsonl` git dışı (`.gitignore` satır 47–48); depoda göremedim, yalnız üretilmiş JS'lerini gördüm.
- ESP `topics.js`'in 68 konusunun disiplin dağılımını çıkaramadım.
