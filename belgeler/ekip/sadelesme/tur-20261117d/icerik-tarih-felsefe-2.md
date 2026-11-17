# Tarih ve Felsefe aşama 2: öğretim kalitesi (tur 2026-11-17d)

Durum: **bitti** (tarih.2 ve felsefe.2; commit yok).

Devralındı (2026-11-17): önceki ajan hesap sınırında kesildi (ölçüm bitmişti); yeni ajan ders yazımına devam ediyor.

Kapsam: alan/tarih/asama-2.json, alan/felsefe/asama-2.json. Aşama 1'ler, Akademik ve kod değişmedi.
Örnek: tur-20261117c/icerik-tarih-felsefe.md (aşama 1 düzeyi).

## Ölçüm önce

Ölçüm betiği önceki turunki (ders başına metin karakteri, paragraf, alıştırma türü, `cozum`suz soru).

| Aşama | Ders | Ort. metin | Alıştırma | Çözümlü seçmeli | Çözümlü kapı |
|---|---|---|---|---|---|
| tarih.2 | 9 | 967 kr (771-1221), 4-5 p | 21 (20 s, 1 a) | 0/20 | 0/17 |
| felsefe.2 | 9 | 940 kr (733-1315), 4-5 p | 20 (19 s, 1 a) | 0/19 | 0/18 |

- Hiç `onayli` yok; hepsi `taslak/model`. Hiçbir seçmeli ve kapı sorusunda `cozum` yok.
- Dersler doğru ama ders gibi değil, liste gibi: giriş sorusu, «neden», somut çalışılmış örnek ve «Özetle» yok. Metinde iç etiketler kalmış («Modelin bağlantı notu:», «ESP'nin olay listesi…»).
- Ezber soruları: «Kaynağa göre Celali takvimi hangi devlet…», «Kaynağa göre hicri ay kaç gün kayar», «Sonucun yüklemi olan terime ne denir», «Kaynağa göre sağlam argüman…», «ESP iskeletinde Çağdaş dönem hangi yılla başlar» gibi; 18 dersten 14'ünde yalnız 2 alıştırma.
- tarih.2.2.3'te kaynaktan gelen bir olgu sorunu: «karanlık çağ» adlandırması yalnız «19. yüzyıl yargısı» değildir, fikir Petrarca'ya (14. yy) ve Rönesans hümanistlerine uzanır (bkz. sahibe notlar).

## Değişen dersler

Hepsi `taslak/model`; kimlikler aynı, eski alıştırma kimliklerinin hiçbiri silinmedi. Betik (`uygula.py`) `onayli` öğede, düşen alıştırma kimliğinde ve bilinmeyen kaynakta durur. Her ders: giriş sorusu → kavram → çalışılmış örnek → neden-sonuç / kanıt-yorum ayrımı → sık yanılgı → «Özetle». İç etiketler («Modelin bağlantı notu», «ESP'nin…», «Kaynağa göre») metinden çıktı; kaynak ayrıntısı dersin `not` alanında.

### Felsefe 2 · «İlk tez» (bitti)

| Ders | Değişiklik |
|---|---|
| felsefe.2.1.1 | «Gençler kitap okumuyor» girişi; affirmo/nego; mantıkta «bazı» = en az bir; tekil önerme; Türkçe tuzak «Bütün öğrenciler gelmedi» (E mi O mu); a2 ezberden örneğe, a3, a4 |
| felsefe.2.1.2 | kuğu girişi; kare çizilerek dört ilişki; A yanlış → O doğru, E/I belirsiz çalışılmış örnek; «önce çelişikten başla»; a4 (E yanlışsa I) |
| felsefe.2.1.3 | Analytica Priora tanımı; terimleri sonuçtan bulma; kümelerle zorunluluk; Barbara/Celarent; büyük öncül ≠ ilk öncül; a2 ezberden Celarent örneğine, a3, a4 |
| felsefe.2.2.1 | Russell'ın tavuğu; Hume'un tümevarım sorunu; Popper asimetrisi; analojinin gücü = ilgili benzerlik; a2 «Kaynağa göre» → domates analojisi, a3, a4 |
| felsefe.2.2.2 | dört birleşim (yunus, hamsi, Sokrates örnekleri); tek imkânsız birleşim; karşı örnekle çürütme yöntemi; a1 «Kaynağa göre sağlam» → «sonuç yanlışsa ne çıkar», a3, a4 |
| felsefe.2.2.3 | geçerli eşler eklendi (önbileşeni onaylama, artbileşeni inkâr etme); dört koşullu çıkarım tablosu; a3 (geçerli kalıbı tanı), a4 (dört terim, «Gül») |
| felsefe.2.3.1 | Sofistik Çürütmeler; beş sanat; kişiye/otoriteye her başvuru safsata değildir (tanık, kardiyolog); test sorusu; a3, a4 (kırmızı ringa) |
| felsefe.2.3.2 | her hataya bir «karşı soru»; kaygan zemin her zaman safsata değil; tablet çalışılmış örneği; a3 (cımbızlama), a4 (döngüsel) |
| felsefe.2.3.3 | Toulmin 1958 + dayanak ve istisnalı şemsiye örneği; çelik adamın gerekçesi; Rapoport kuralları Dennett (2013) üzerinden; a1 örneğe bağlandı, a4 (çelik adam cevabı) |

Kapı: 18 sorunun hepsine `cozum`. Ezberden uygulamaya (aynı kimlik): felsefe.2.k6 (Rapoport «son adım» → ne yapar), felsefe.2.1.k4 (terimin adı → kıyasta orta terimi bul), felsefe.2.2.k2 («Kaynağa göre» → yarasa argümanı), felsefe.2.3.k4 (Toulmin adı → cümlede istisnayı bul). Soru sayıları aynı (aşama 6, ünite 4).

Cevap anahtarı dengesi: B ağırlıklıydı (tarih 23/52, felsefe 21/53). Çözümünde harf anmayan B soruları seçenek takasıyla dağıtıldı → tarih A12 B18 C11 D11, felsefe A11 B16 C15 D11.

### Tarih 2 · «İskelet kronoloji» (bitti)

| Ders | Değişiklik |
|---|---|
| tarih.2.1.1 | Ramazan girişi; 33 yıllık mevsim döngüsü; hicri→miladi yaklaşık çevirme (1400 → 1979-80); a2 ezberden «neden güneş takvimi», a3 (Ramazan kayması), a4 (hicri 1255 ≈ 1839) |
| tarih.2.1.2 | sıfır yılı yok, çağlar arası sayım (Sezar-Augustus 57 yıl); Dionysius Exiguus; a4 (MÖ 20 - MS 30 = 49 yıl) |
| tarih.2.1.3 | Kadeş çözüldü: savaş ~1274, antlaşma ~1259 (Bryce); 1299 gelenek / 1302 Bafeus (Pakhymeres); a3, a4 eklendi |
| tarih.2.2.1 | buluntu tek, yorum çok; tarım → artı ürün → kayıt → yazı zinciri; Mezopotamya ile Anadolu'nun eşzamansızlığı; a3 (kazı çıkarımı), a4 (neden-sonuç) |
| tarih.2.2.2 | dönem = soruya verilen cevabın değiştiği yer; sınır kuralının gerekçesi; Talas ve 1492 çalışılmış örnek; a4 eklendi |
| tarih.2.2.3 | **«karanlık çağ» düzeltildi** (Petrarca, 14. yy; hümanistler; Aydınlanma); kanıt/yorum ayrımı; Türkiye okul kitaplarında 375; Çin hanedanları; a2 yeniden yazıldı (doğru cevap C), a3, a4 eklendi |
| tarih.2.3.1 | olay zinciri; Atina demokrasisinin sınırları; Talas-kâğıt anlatısı sınandı (Bloom); a3, a4 eklendi |
| tarih.2.3.2 | eşzamanlılık ≠ nedensellik; Vestfalya «egemen devlet» yorumuna itiraz (Osiander); Kara Veba'nın Doğu/Batı farklı sonucu; a3, a4 eklendi |
| tarih.2.3.3 | olay (nokta) / süreç (çubuk); Fransız Devrimi → Tanzimat → Meşrutiyet → Cumhuriyet zinciri yorum olarak; a4 eklendi |

Kapı: 17 sorunun hepsine `cozum`. Ezberden anlamaya çevrilenler (aynı kimlik): tarih.2.k3 («ESP iskeletinde hangi yıl» → 1945'in gerekçesi), tarih.2.k4, tarih.2.1.k1 (hicri «kaç gün» → bayram kayması hesabı), tarih.2.1.k4 (kart ezberi → anı defteri senaryosu), tarih.2.2.k1 (maden ezberi → kazı çıkarımı), tarih.2.2.k4 (iki yıl ezberi → ortak zaafı), tarih.2.3.k3-k4 («iki kaynakta da» kalktı). Soru sayıları aynı (aşama 5, ünite 4).

## Eklenen kaynaklar

Hepsi `dogrulama: dogrulanmamis`; gerçek eserler, sayfa/bölüm basılı nüshayla karşılaştırılmadı.

- tarih.2 k12: Takvimde Tarih Mebdeinin Tadili Hakkında Kanun (26 Aralık 1925), tür kurum
- tarih.2 k13: Trevor Bryce, The Kingdom of the Hittites (OUP, 2005)
- tarih.2 k14: Cemal Kafadar, Between Two Worlds (University of California Press, 1995)
- tarih.2 k15: Theodor E. Mommsen, «Petrarch's Conception of the 'Dark Ages'», Speculum 17 (1942)
- tarih.2 k16: Jonathan M. Bloom, Paper Before Print (Yale University Press, 2001)
- tarih.2 k17: Andreas Osiander, «Sovereignty, International Relations, and the Westphalian Myth», International Organization 55 (2001)

- felsefe.2 k17: Aristoteles, Birinci Analitikler (Analytica Priora), I. kitap
- felsefe.2 k18: Aristoteles, Sofistik Çürütmeler (Sophistici Elenchi), 4-5. bölümler
- felsefe.2 k19: Bertrand Russell, The Problems of Philosophy (1912), VI. bölüm
- felsefe.2 k20: David Hume, An Enquiry Concerning Human Understanding (1748), IV. bölüm
- felsefe.2 k21: Karl Popper, The Logic of Scientific Discovery (1959; Logik der Forschung, 1934)
- felsefe.2 k22: Stephen Toulmin, The Uses of Argument (Cambridge University Press, 1958)
- felsefe.2 k23: Daniel C. Dennett, Intuition Pumps and Other Tools for Thinking (W. W. Norton, 2013)

## Ölçüm sonra

| Aşama | Ders | Ort. metin | Alıştırma | Çözümlü seçmeli | Çözümlü kapı |
|---|---|---|---|---|---|
| tarih.2 | 9 | 2005 kr (1709-2269), 7-7 p | 36 (35 s, 1 a) | 35/35 | 17/17 |
| felsefe.2 | 9 | 2185 kr (1974-2395), 7-7 p | 36 (35 s, 1 a) | 35/35 | 18/18 |

Açık alıştırmalara da (tarih.2.3.3.a3, felsefe.2.3.3.a3) yol gösteren `cozum` eklendi. 18 dersin hepsinde 4 alıştırma (önce 14'ünde 2).

Kalite kapısı: `denetle.py alan/tarih` temiz, `denetle.py alan/felsefe` temiz, `denetle_test.py` 27/27, `motor/yol.test.js` 24/24, `motor/soru.test.js` 33/33, `kalite/olcum.py --denetle` bütçe tamam.

## Sahibe notlar

- **Olgu düzeltmesi (tarih.2.2.3):** «karanlık çağ» artık «19. yüzyıl yargısı» değil; fikir Petrarca'dan (14. yy) ve hümanistlerden başlar, Aydınlanma'da yaygınlaşır (Mommsen 1942). Kaynak dosya `ESP/src/js/data/history.js` (ESP.ERAS) hâlâ eski cümleyi taşıyor; ESP tarafında da düzeltilmeli (bu turda dokunulmadı).
- **Kadeş çözüldü (tarih.2.1.3):** kaynaklardaki dört yıl iki ayrı olayı karıştırıyor: savaş ~MÖ 1274, antlaşma ~MÖ 1259 (Bryce; Mısır kronolojisinin yaygın hesabı). ESP olay listesi ikisini tek satırda -1274'e koyuyor; ESP'de iki satıra ayrılmalı.
- **Türkiye okul kitapları:** tarih.2.2.3'te «Orta Çağ çoğunlukla 375 (Kavimler Göçü) ile açılır, Yakın Çağ günümüze uzanır» deniyor; model bilgisi, güncel MEB kitabıyla karşılaştırılmadı.
- **Kanıt/yorum ayrımı yeni yerlere geldi:** Talas-kâğıt anlatısı (Bloom), Vestfalya «egemen devlet sistemi» (Osiander), Kara Veba'nın Doğu/Batı farklı sonucu. Üçü de tartışmalı olarak işaretli.
- Birincil kaynak atıfları (Analytica Priora 24b18-20, Sophistici Elenchi 4-5, Russell VI, Hume IV, Toulmin III) model bilgisinden; basılı çeviriyle karşılaştırılmadı, hepsi `dogrulanmamis`.
- Hicri-miladi örnekleri (1 Muharrem 1400 = 21 Kasım 1979; 1255 ≈ 1839) model hesabıdır.

## Açık kalanlar

- Hiçbir şey `onayli` değil; 18 ders ve 105 seçmeli sahibin onayını bekliyor.
- Cevap anahtarında B hâlâ hafif ağır (çözümü harf anan sorular takaslanmadı).
- ESP kaynak verisindeki iki düzeltme (karanlık çağ, Kadeş satırı) ESP deposunda yapılmadı.
- `node kabuk/kabuk.test.js` ve `node tools/kabuk_gez.js` bu turda koşulmadı (kabuk/ başka ajanın çalışma alanında, görev kapısında yoktu).
