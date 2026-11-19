# icerik.md — içerik yoğunluk denetimi + sağlık aşama 1 derinleştirme (2026-11-18/19)

Durum: BİTTİ. Commit/push yok. (Limit kesmesinden sonra devam: 19 Kasım; alan/*.json dosyalarında o ana kadar değişiklik yoktu.)

## 1. Bütün alanların yoğunluk denetimi (ÖNCE)

Ölçüm betiği: scratchpad `icerik/olc.py` (kelime = boşlukla ayrılan sözcük; tek kaynaklı = ders `kaynak` listesinde ≤1 kimlik).

| Dosya | Ders | Ort. kelime | Min | Ort. paragraf | Tek kaynaklı | Alıştırmasız | Ort. alıştırma | Onaylı | Kaynak türleri |
|---|---|---|---|---|---|---|---|---|---|
| akademik/asama-1.json | 368 | 192 | 99 | 16.0 | 363 | 0 | 3.3 | 0 | {'depo': 369} |
| akademik/asama-2.json | 9 | 157 | 106 | 4.8 | 0 | 0 | 2.6 | 0 | {'depo': 7, 'gemini': 12} |
| beslenme/asama-1.json | 10 | 121 | 82 | 3.6 | 1 | 0 | 2.5 | 0 | {'depo': 2, 'gemini': 13} |
| beslenme/asama-2.json | 9 | 161 | 119 | 4.6 | 2 | 0 | 3.0 | 0 | {'depo': 8, 'gemini': 13} |
| dil/asama-1.json | 14 | 143 | 87 | 5.8 | 6 | 0 | 2.4 | 0 | {'gemini': 16, 'kitap': 2, 'url': 1} |
| dil/asama-2.json | 9 | 172 | 120 | 4.6 | 0 | 0 | 2.3 | 0 | {'depo': 6, 'gemini': 4} |
| felsefe/asama-1.json | 9 | 236 | 200 | 6.0 | 1 | 0 | 3.4 | 0 | {'gemini': 19, 'kitap': 17} |
| felsefe/asama-2.json | 9 | 304 | 275 | 7.0 | 1 | 0 | 4.0 | 0 | {'gemini': 14, 'depo': 2, 'kitap': 7} |
| hareket/asama-1.json | 10 | 117 | 86 | 3.4 | 1 | 0 | 2.5 | 0 | {'depo': 4, 'gemini': 14} |
| hareket/asama-2.json | 9 | 163 | 104 | 4.6 | 0 | 0 | 3.0 | 0 | {'depo': 13, 'gemini': 7} |
| muzik/asama-1.json | 9 | 161 | 129 | 4.2 | 1 | 0 | 3.4 | 0 | {'depo': 8, 'gemini': 5} |
| muzik/asama-2.json | 9 | 168 | 131 | 5.0 | 0 | 0 | 2.8 | 0 | {'depo': 10, 'gemini': 5} |
| okuma/asama-1.json | 10 | 134 | 100 | 4.0 | 1 | 0 | 3.2 | 0 | {'gemini': 13, 'depo': 8} |
| okuma/asama-2.json | 9 | 148 | 133 | 4.8 | 0 | 0 | 2.2 | 0 | {'depo': 8, 'gemini': 6} |
| tahlil/asama-1.json | 9 | 136 | 114 | 4.7 | 0 | 0 | 2.3 | 0 | {'gemini': 8, 'depo': 8} |
| tahlil/asama-2.json | 9 | 157 | 95 | 5.0 | 0 | 0 | 2.6 | 0 | {'gemini': 7, 'depo': 16} |
| tarih/asama-1.json | 9 | 232 | 208 | 5.8 | 0 | 0 | 3.3 | 0 | {'gemini': 14, 'kitap': 4} |
| tarih/asama-2.json | 9 | 283 | 243 | 7.0 | 0 | 0 | 4.0 | 0 | {'depo': 8, 'gemini': 3, 'kurum': 1, 'kitap': 5} |
| tarih/asama-3.json | 24 | 445 | 366 | 11.0 | 0 | 0 | 3.3 | 0 | {'gemini': 15, 'kitap': 24} |
| tarih/asama-4.json | 24 | 410 | 364 | 11.0 | 0 | 0 | 3.2 | 0 | {'gemini': 19, 'kitap': 20} |
| tarih/asama-5.json | 30 | 368 | 271 | 9.1 | 0 | 0 | 3.2 | 0 | {'gemini': 23, 'kitap': 22} |
| uyku/asama-1.json | 10 | 102 | 83 | 4.0 | 0 | 0 | 2.4 | 0 | {'gemini': 10, 'depo': 2} |
| uyku/asama-2.json | 9 | 144 | 117 | 4.2 | 0 | 0 | 2.4 | 0 | {'depo': 12, 'gemini': 12} |

Tekrar eden 8+ kelimelik cümle: 7
- **çözümlü örnekler** (önce kendin dene, sonra çözüme bak) → ['akademik.1.1.2', 'akademik.1.1.4', 'akademik.1.1.6', 'akademik.1.1.8']
- örnek (orta): a ve b pozitif tam sayılardır. → ['akademik.1.4.2', 'akademik.1.4.8']
- bu bir toplum önerisidir, kişiye özel hedef değildir. → ['beslenme.2.1.3', 'beslenme.2.2.2']
- aşama): göğüs ağrısı, nefes darlığı, baş dönmesi ya da çarpıntı egzersizde normal değildir → ['hareket.2.1.1', 'hareket.2.3.2', 'hareket.2.3.3']
- kronik bir hastalık, gebelik, düzenli ilaç ya da geçmeyen bir ağrı varsa programa başlamad → ['hareket.2.1.1', 'hareket.2.3.2', 'hareket.2.3.3']
- unutma: referans aralıkları laboratuvardan laboratuvara değişir ve bir değerin senin için  → ['tahlil.1.1.1', 'tahlil.2.1.1', 'tahlil.2.1.2', 'tahlil.2.1.3']
- unutma: referans aralıkları laboratuvardan laboratuvara değişir ve yorum hekimindir. → ['tahlil.1.3.2', 'tahlil.2.3.3']

(Tablo ÖNCE durumudur: beslenme/hareket/uyku aşama 1 değiştirilmeden önce ölçüldü. Hiçbir alanda `onayli` ders yoktu, bu yüzden dokunulmadan bırakılan ders de yok.)

### En zayıf 5 nokta (önem sırasıyla)

1. **uyku/asama-1** — ders başına ort. 102 kelime (en az 83), 4 paragraf; tarih aşama 3-5'in dörtte biri. → bu turda düzeltildi.
2. **hareket/asama-1** — ort. 117 kelime, 3,4 paragraf. → düzeltildi.
3. **beslenme/asama-1** — ort. 121 kelime, 3,6 paragraf. → düzeltildi.
4. **Aşama 2'ler ve öbür kısa alanlar hâlâ ince**: uyku.2 144, okuma.1 134, tahlil.1 136, dil.1 143, okuma.2 148, beslenme.2 161, hareket.2 163, müzik 161-168 kelime; ortalama 4-6 paragraf. Sıradaki derinleştirme işi bunlar (önce sağlık aşama 2).
5. **Kaynak sığlığı**: akademik/asama-1'de 368 dersin 363'ü tek kaynaklı (hepsi `depo`); dil/asama-1'de 14 dersin 6'sı, beslenme/asama-2'de 2 ders tek kaynaklı. Kanıt tek bir dosyaya dayanıyor.

Sistem genelinde iki not daha:
- **Hiç onaylı ders yok** (bütün alanlarda 0). SEMA.md'ye göre onaysız içerik tekrara girmez; yani şu an hiçbir ders aralıklı tekrara girmiyor. Bu bir içerik eksiği değil, sahibin onay adımı.
- **Tekrar eden kalıp cümleler** (8+ kelime): tahlil'de «Unutma: referans aralıkları laboratuvardan laboratuvara değişir…» 6 derste, hareket.2'de aynı güvenlik cümlesi 3 derste, akademik'te «Çözümlü örnekler» başlığı 4 derste. Alıştırmasız ders yok.
- **Kaynak yolu bayatlamış**: beslenme.1 k1-k2, hareket.1 k1-k4 (`SPI/src/js/data/rehber.js`) ve uyku.1 k11 (`SPI/src/js/data/biomarkers.js`) çalışma ağacında yok; 8d0b542c («eski modüller kalktı») ile silinmiş, git geçmişinde duruyor (`git show 8d0b542c^:SPI/src/js/data/rehber.js`). Yol değiştirilmedi.

## 2. Derinleştirme (beslenme, hareket, uyku aşama 1)

Dosyalar: `alan/beslenme/asama-1.json`, `alan/hareket/asama-1.json`, `alan/uyku/asama-1.json`. Var olan her paragraf, ders kimliği, sıra, alıştırma (kimlik ve içerik), kapı, özet ve `not` aynen korundu (betikle karşılaştırılarak denetlendi); yalnız yeni paragraf, yeni kaynak ve her derse bir yeni seçmeli alıştırma (sıradaki `aN` kimliğiyle; doğru harfler A-D dağıtıldı) eklendi. Hepsi `taslak` / `model`. Dosya biçimi korundu (beslenme standart girinti, hareket/uyku elle sıkıştırılmış biçim), bu yüzden git diff yalnız eklemeleri gösterir.

| Aşama | Ders | Ort. kelime önce → sonra | En az | Ort. paragraf önce → sonra | Alıştırma önce → sonra | Kaynak önce → sonra |
|---|---|---|---|---|---|---|
| beslenme.1 | 10 | 121 → 356 | 82 → 305 | 3,6 → 9,2 | 25 → 35 | 15 → 27 |
| hareket.1 | 10 | 117 → 334 | 86 → 306 | 3,4 → 9,3 | 25 → 35 | 18 → 25 |
| uyku.1 | 10 | 102 → 322 | 83 → 306 | 4,0 → 10,1 | 24 → 34 | 12 → 18 |

30 dersin hepsi 8-12 paragraf ve 300-450 kelime aralığında (en kısa uyku.1.1.2 306, en uzun beslenme.1.3.3 447).

### Eklenen kaynaklar
- **DSÖ, birincil ve indirilmiş** (`veri/temiz/spi/who_rehberler.jsonl`, satır aralığıyla, `kaynakli`): sağlıklı beslenme 33-39 / 40-46 / 47-56, tuz 108-113, obezite 89-90, fiziksel aktivite 5-14 / 17-18, uyku için 9.
- **Kurum** (`kaynakli`, hafızadan künye): TÜBER 2022 (dört besin grubu), DSÖ 2020 fiziksel aktivite rehberi, ACSM Guidelines 11. baskı, UNESCO (Kırkpınar 2010, Türk okçuluğu 2019), AASM-SRS uzlaşısı (Watson 2015), AASM Healthy Sleep Habits, AASM kronik uykusuzluk rehberi (Edinger 2021).
- **Gemini** (`dogrulanmamis`, satır aralığıyla): Türk mutfağı (çorbalar 50-52, bulgur/mercimek 104-109), ayran (kahvaltılıklar 125-126, hidrasyon 122), kuru meyve/leblebi 16-72, tokluk 109-110, toparlanma piramidi 72-74, uyku apnesi 29, uyanış protokolü 39-43.
- **Depo taslak**: `veri/taslak/spi/egzersiz_kalistenik_rehberi.jsonl` 1-17.

### Türk geleneği (kanıtla bağdaştığı yerde, abartısız)
Mercimek, ezogelin, bulgur, mücendra, kuru fasulye-pilav, yoğurt/ayran/tarhana/yayla çorbası, kuru kayısı-incir (enerji yoğunluğu uyarısıyla), zeytinyağlılar (DSÖ pişirme önerisine yakın), ayranın tuzu (sodyum sayısıyla); yağlı güreş, peşrev, okçuluk, köyde taşıma işleri, çömelerek çalışma; yayla/köy hayatında güneşle kalkıp yatma, damda yatma. Kaynakta olmayan her bağlantı «(modelin bağlantı notu)» etiketli.

### Güvenlik dili
Teşhis, ilaç dozu ve takviye önerisi yok. Her dersin sonunda ilgili risk için «hekime danış» cümlesi var (böbrek/şeker hastalığı, gebelik, göğüs ağrısı, 112, bel ağrısı bacağa yayılırsa, horlama + nefes durması, kronik uykusuzluk, uykulu araç kullanma, mevsimsel karamsarlık). Melatonin hapı ve ışık cihazı açıkça «hekimle» kaydına bağlandı.

## 3. Doğrulama
- `python alan/denetle.py alan/beslenme` → Temiz · 19 ders, 97 alıştırma, 48 kaynak
- `python alan/denetle.py alan/hareket` → Temiz · 19 ders, 97 alıştırma, 45 kaynak
- `python alan/denetle.py alan/uyku` → Temiz · 19 ders, 90 alıştırma, 42 kaynak
- `python alan/denetle_test.py` → 27/27
- `node tools/kabuk_gez.js` → «hepsi geçti» (çıkış 0)
- Ekran görüntüsü alınmadı: yalnız içerik değişti, arayüz kodu değişmedi.

## 4. Sahibin bakması gereken, emin olmadığım noktalar
1. **TÜBER**: `veri/taslak/spi/tuber_beslenme_rehberi.jsonl` kendi denetiminde TÜBER sayılarını «kaynakta bulunamadı» diye işaretlemiş. Ben TÜBER'den sayı almadım, yalnız dört grubun adlarını aldım (hafızadan); PDF'ten bakılmalı.
2. **Kurum künyeleri hafızadan**: ACSM sayıları (5-10 dk ısınma, 10-30 sn germe, 8-12 tekrar × 2-4 set, 48 saat), AASM Healthy Sleep Habits maddeleri (30 dk cihaz, 20 dk kuralı, alkol/ağır yemek), Watson 2015 ve Edinger 2021 künyeleri, UNESCO yılları. Sayfalar indirilmedi; `kaynakli` dediğim yer bu.
3. **Gemini rakamları** (180 g mercimek 209 kcal / 14 g lif, 250 ml ayran 95 kcal / 450 mg sodyum, kuru incir 250-260 kcal/100 g) `dogrulanmamis`; tablo değeri 4-4-9 hesabıyla tam örtüşmüyor, derste bu söylendi.
4. **Model bağlantıları**: «yoğurt sözcüğü Türkçedir», peşrevin ısınmaya benzetilmesi, «sosyal jet-lag», kronik uykusuzluk eşiği (haftada 3 gece, 3 ay), «çift ilerleme» kuralı, kafein saat hesapları. Hepsi etiketli.
5. Var olan dersin eski bir cümlesi korundu ama yeni paragrafla kısmen örtüşüyor: hareket.1.3.2 (tendon kastan yavaş uyum sağlar) ve uyku.1.3.4 (7-9 saat + AASM 7+ saat). Sahip kısaltmak isterse bir paragraf silinebilir.

## Açık kalanlar
- Sağlık aşama 2'ler (144-163 kelime) ve okuma/tahlil/dil/müzik dersleri aynı derinleştirmeyi bekliyor.
- Bayat `SPI/src/...` kaynak yolları güncellenmeli (git geçmişindeki yola ya da `veri/` altındaki kopyaya).
- Onay adımı: hiçbir ders onaylı değil, tekrar çalışmıyor.
- Betikler (yeniden kullanılabilir): scratchpad `icerik/olc.py` (denetim tablosu), `uygula.py` + `spec_*.py` (derinleştirme), `bicim.py` (elle biçimi koruyan yazıcı).
