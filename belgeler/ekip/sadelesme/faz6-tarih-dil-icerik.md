# Faz 6 · Tarih ve Dil 1. aşama içeriği

Tarih: 2026-11-13 · Dal: `sadelesme` · Yazan: model (ekip üyesi, içerik) · Commit yok.

## Özet
İki alanın 1. aşaması şemaya uygun yazıldı ve denetleyiciden temiz geçti: **Tarih** 3 ünite, 9 ders, 22 ders alıştırması, 16 kapı sorusu, 14 kaynak; **Dil** (Diksiyon içinde) 3 ünite, 10 ders, 22 ders alıştırması, 16 kapı sorusu, 15 kaynak. Her ders gemini-data'dan dosya + satır aralığı gösterir; her öğe `taslak` / `yazan: "model"`, her kaynak `dogrulanmamis`. Kaynakta görülen hatalar derse alınmadı, ders `not` alanına ve aşağıya yazıldı. Dil malzemesi ince: bir dilin A1 dersi gemini-data'da yok, bu yüzden Dil 1. aşaması dilden bağımsız temellerdir (yazı ve ses, Türkçe diksiyon, dil edinimi yöntemi). Commit yok.

## Tarih 1. aşama

Dosya: `alan/tarih/asama-1.json` · aşama `tarih.1` «Kanıt ve ilk uygarlıklar».
Sayılar (denetleyiciden): 3 ünite, 9 ders, 38 alıştırma (ders alıştırması 22, ünite kapı sorusu 12, aşama kapı sorusu 4), 14 kaynak. Hepsi `durum: "taslak"`, `yazan: "model"`, kaynaklar `dogrulama: "dogrulanmamis"`.

Sıra gerekçesi: gemini-data'da çağlar/kronoloji iskeleti yok (içerik hattı raporu §2). Bu yüzden en temelden başlandı: önce «tarih nasıl bilinir» (kanıt, kaynak tenkidi), sonra bu yöntemle en eski kanıtlara (yazı öncesi yerleşimler → yazı) ve ilk Anadolu devletlerine gidildi. Her ünite bir öncekine önkoşullu; ünite kapısı eşiği 0,75 (4 soru), aşama kapısı 0,8 (4 soru, üç üniteyi karıştırır).

| Ünite | Dersler | Kaynak (gemini-data, satır) |
|---|---|---|
| 1.1 Tarih nasıl bilinir? | Kanıt ve kaynak tenkidi · Anakronizm · Çok nedenli düşünme ve Braudel'in zaman katmanları | `ESP/tarih/dunya_ve_turk_tarihi_kirilmalar.md` 11-44 |
| 1.2 İlk yerleşimler ve yazının doğuşu | Göbeklitepe · Çatalhöyük · Mezopotamya ve yazının icadı | `ESP/tarih/anadolu_uygarliklari_hitit_…_atlasi.md` 15-30; `ESP/tarih/anadolu_ve_mezopotamya_…_atlasi.md` 14-26; `kirilmalar.md` 52 |
| 1.3 Anadolu'nun ilk devletleri | Hititler · Frigler ve Lidyalılar · Urartular ve Geç Tunç Çağı çöküşü | `anadolu_uygarliklari_hitit_…_atlasi.md` 38-62; `kirilmalar.md` 53-54 |

Modelin kendi bağlantı cümleleri metin içinde «(model)» / «modelin bağlantı notu» diye işaretli (ör. ünite 1'in yöntemini Göbeklitepe yorumuna ve Tunç Çağı çöküşüne uygulayan cümleler, kronoloji özeti). Açık alıştırmalar (4) puanlanmaz; örnek cevap + ölçüt taşır.

## Dil 1. aşama

Dosya: `alan/dil/asama-1.json` · aşama `dil.1` «Ses, yazı ve öğrenme yolu».
Sayılar: 3 ünite, 10 ders, 38 alıştırma (ders 22, bunun 3'ü açık uçlu; ünite kapısı 12; aşama kapısı 4), 15 kaynak. Kapı eşikleri Tarih ile aynı (ünite 0,75, aşama 0,8). Kanıt işi: ESP merdiveni Dil 1. basamağındaki «kendini üç cümleyle tanıtan kayıt», bu aşamanın diksiyon kurallarına bağlandı.

Sıra gerekçesi: gemini-data'daki dil dosyalarının hepsi ileri düzey (C1/C2, etimoloji, dilbilim); hiçbir dil için A1 dersi yok (içerik hattı raporu §2). Kaynağın taşıyabildiği en temel şey, her dilden önce gelen bilgidir: sesin yazıya geçişi, sesi IPA ile yazmak, Türkçe diksiyon ve dilin nasıl öğrenildiği.

| Ünite | Dersler | Kaynak (gemini-data, satır) |
|---|---|---|
| 1.1 Yazı ve ses | Yazı sistemlerinin türleri · Akrofoni ve Orhun yazısı · IPA ve Türkçenin 8 ünlüsü | `ESP/dil/dunya_alfabeleri_…_ipa_atlasi.md` 13-22, 42-47, 61-71, 75-96 |
| 1.2 Diksiyonun temelleri | Nefes, ses telleri, rezonans · ğ, iki e, ulama · Vurgu, es, tekerleme · Sesini korumak | `ESP/muzik_diksiyon/gitar_armoni_ve_diksiyon_ustalik.md` 93-136, 158-161; `ESP/muzik_diksiyon/vokal_rezonans_…_kanonlari.md` 13-40, 50-54 |
| 1.3 Dil nasıl öğrenilir? | Krashen'in hipotezleri · Swain'in anlaşılır çıktısı · Kelime sıklığı, eşdizim, CEFR | `ESP/dil_ogrenimi/ikinci_yabanci_dil_edinimi_krashen_…_atlasi.md` 36-71, 75-86, 112-116 |

Modelin bağlantı ve düzeltme cümleleri metinde «(model)» diye işaretli. «Sesini korumak» dersine «tıbbi tavsiye değildir» sınır notu eklendi.

## Kaynak hataları

### Tarih (derse alınmadı, ders `not` alanında da yazılı)
- **Kadeş Antlaşması'nın tarihi üç farklı:** `anadolu_uygarliklari_hitit_…` satır 40 «MÖ 1258», `kirilmalar.md` satır 53 «MÖ ~1259», `anadolu_ve_mezopotamya_…` satır 35 «MÖ 1280». 1280 ötekilerle uyuşmuyor. Derste yalnız «MÖ 13. yüzyıl».
- **«İlk yazılı kanunlar: Urukagina (MÖ 2375)»** (`anadolu_ve_mezopotamya_…` satır 23): Urukagina metinleri reform yazıtıdır, kanun derlemesi değildir; doğrulanamadı, alınmadı. Babil'in Asma Bahçeleri (satır 25) varlığı tartışmalı, alınmadı.
- **Göbeklitepe yorumu kesinlik diliyle:** «tezi yerle bir etmiştir» / «kanıtlamıştır» (`anadolu_uygarliklari_…` satır 18, `anadolu_ve_mezopotamya_…` satır 16). Derste yorum olarak verildi.
- **Göbeklitepe hayvanları çelişkili:** bir atlas leopar (satır 22), öteki aslan (satır 17) sayıyor; ikisi de alınmadı.
- **Çatalhöyük «8.000 kişilik»** (`anadolu_ve_mezopotamya_…` satır 20): öteki atlasta yok, doğrulanamadı, alınmadı.
- **Abartılı nitelemeler alınmadı:** Pankuş «ilk meşruti meclis», anal yıllıkları «ilk tarafsız tarih yazıcılığı», sikkeyle «küresel serbest piyasa ticareti başladı», Şamran Kanalı «suyu sıfır kayıpla taşıyan».

### Dil (derse alınmadı)
- **Çerkesçe hece yazısı sayılmış** (`dunya_alfabeleri_…` satır 18): Çerkesçe Kiril alfabesiyle yazılır.
- **Krashen «kanıtlamıştır», i+1 «tek motor»** (`ikinci_yabanci_dil_…` satır 38, 61): tartışmalı hipotezler; derste hipotez olarak verildi.
- **«Paul Nation'ın Cambridge araştırmaları»** (satır 77): Nation Cambridge'de değil, kitabı Cambridge UP'den; ifade alınmadı. Kapsama yüzdeleri «kaynağa göre» diye aktarıldı (doğrulanmadı).
- **Nefesi 16 saniye tutma** (`gitar_armoni_…` satır 96): sağlık riski olabilir, alınmadı.
- **Kaba sözcük içeren tekerleme** (`gitar_armoni_…` satır 130), değer yargısı «dünyanın en rasyonel alfabesi» (Hangul, satır 61) alınmadı.
- **Kapalı/açık e örneklerinde «ben», «sen»** (satır 112-113): ağza göre değişir, doğrulanamadı, alınmadı.
- **Doğrulanamayan sayılar**: fısıltının «iki kat» zararı, reflünün «bir numaralı sebep» oluşu, «uykudan 3 saat önce» (`vokal_rezonans_…` satır 52-54); rezonans frekans aralıkları ve konuşmacı formantı (satır 37-46) alınmadı.

## Eksikler

### Tarih
- Çağlar ve takvim iskeleti (Tarih öncesi / İlk Çağ / Orta Çağ …, MÖ-MS, hicri-miladi) gemini-data'da yok (`grep` ile tarih atlaslarında ve AYS tarih atlaslarında aranıp bulunamadı). Bu yüzden 1. aşama çağ sınıflamasını öğretmiyor; sahip ya da kurum kaynağı (MEB tarih programı) gerekli.
- Türk tarihinin başlangıcı (Hunlar, Göktürkler) `kirilmalar.md` tablosunda tek satırlar halinde var (satır 57, 61); ders biçimine yetecek ayrıntı yok, 2. aşamaya bırakıldı.

### Dil
- **Hiçbir dil için başlangıç dersi yok.** İngilizce A1 (alfabe, to be, sayılar, ilk 500 kelime) gemini-data'da yok; kendi bilgimle doldurmadım. 2. aşama (ilk hedef dil) için kaynak gerekiyor: depo içinde `ESP/src/js/data/grammar.js`, `lessons.js`, `kelimesiklik.js`, `kelimeornek.js` (Tatoeba) alıştırma malzemesi var ama ders metni yok.
- **Ses yok:** diksiyon ve IPA dersleri dinleme örneği ister; ses dosyası yok. Açık alıştırmalar öğrenenin kendi kaydına dayanıyor.
- Türkçe ses bilgisi kuralları (ünlü düşmesi, benzeşme) `AYS/tyt/tyt_turkce_dil_bilgisi_…` dosyasında var ama akademik alanın (YKS Türkçe) işi sayıldı, buraya alınmadı.

### Sahibe açık sorular
1. Dil 2. aşaması hangi dil ile başlasın (İngilizce önerilir) ve A1 ders metni nereden gelsin: kurum kaynağı (CEFR/British Council benzeri), sahibin yazdığı metin, yoksa King taslağı?
2. Diksiyon ayrı bir alt yol mu olsun, yoksa her aşamada bir ünite olarak mı kalsın?
3. Tarih 2. aşaması için çağlar/takvim iskeleti hangi kurum kaynağına (MEB tarih programı?) dayansın?

## Doğrulama
- `python alan/denetle.py alan/dil` → «Temiz · 1 dosya, 1 aşama, 3 ünite, 10 ders, 38 alıştırma, 15 kaynak» (çıkış 0).
- `python alan/denetle.py alan/felsefe` hâlâ temiz (dokunulmadı).
- Kapı soruları ders alıştırmalarından ayrı yazıldı (şema: «derste gösterilmeyen sorular»); bunu denetleyici sınamıyor, elle kontrol edildi.
- Dokunulan dosyalar yalnız `alan/tarih/asama-1.json`, `alan/dil/asama-1.json` ve bu rapor; git işlemi yapılmadı.
- `python alan/denetle.py alan/tarih` → «Temiz · 1 dosya, 1 aşama, 3 ünite, 9 ders, 38 alıştırma, 14 kaynak» (çıkış 0).
