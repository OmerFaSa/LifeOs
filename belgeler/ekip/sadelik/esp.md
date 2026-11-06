# ESP sadelik dökümü

> 2026-11-06 · Dal `claude/esp-arayuz-2de764` · Kullanıcının sözü: «bir bölümde birden fazla
> özellik olduğundan anlaşılmıyor ve karmaşık gözüküyor». Ölçü: telefon 390 px, dolu profil
> (`tools/envanter.js` verisi). «Ekran» = sayfa boyu ÷ 844 px, «kelime» = görünen yazı.

## 2. tur (2026-11-06, dal `claude/esp-sadelik-son-0b854f`): «Diğer» kalktı

Kullanıcının sözü: «karmaşıklığı en akıllıca, en anlaşılır seviyeye getir». 1. turun «Diğer»
çekmecesi bir yerine iki dokunuş ve gizli bir liste demekti; yerine **her alanda aynı dört iş**:

| Alan | Çubuk |
|---|---|
| Dil | Çalış · Kartlarım · Öğren · İlerleme |
| Felsefe | Çalış · Tezlerim · Öğren · İlerleme |
| Tarih | Çalış · Olaylar · Öğren · İlerleme |
| Ses | Müzik · Diksiyon · Öğren · İlerleme |
| Okuma | Çalış · Not ve kitap · Öğren · İlerleme |
| Yazı | Çalış · Taslaklarım · Öğren · İlerleme |
| Analiz | Özet · Alanlar · Zaman · Rapor |
| Plan | Durum · Basamaklar · Projeler · Sınama (alan seçici yalnız Basamaklar'da) |
| Ofis | Bu hafta · Uzmana sor (masalar sohbetin altında, katlı) |

- **Çalış** «şimdi ne yapacağım»ı cevaplar: kayıt yoksa ilk adım (`Parts.simdi`, «İlk taslağını aç»),
  varsa sıradaki iş; hangisi olduğunu kod seçer. Altında bugünkü reçete (`Parts.recete`) ve kapalı
  uzman masası. Künye yaptığının sonucunu söyler: «bugün 25 dk»; girilmemiş gün «0 dk» yazılmaz.
- Eski ikincil bölümler işin yanına girdi: kart listesi Kartlarım'da, dilbilgisi Öğren'de, yol
  haritası İlerleme'de (Analiz'de değil, Plan'a bağlantı), radar Alanlar'da, dürüstlük Rapor'da.
- Uzman masası beş satır (Uzmanla konuş, Ekler, Hatırlatma, Öneriler, Bakım), başta hepsi kapalı;
  reçete ve harita masadan çıktı. Anlatımlar menüde ayrı satır değil, Öğrenme'nin altında.
- Boş ekranda boş kart yok: Analiz, Plan, Tarih, Felsefe, Yazı kayıt yokken tek ilk adım gösterir.

Ölçü (`tools/envanter.js` dolu profili, 390 px, main → dal, ilk sekme):

| Ekran | Ekran boyu | Kelime |
|---|---|---|
| Analiz | 5,8 → 1,6 | 444 → 92 |
| Onaylar | 4,4 → 1,6 | 299 → 59 |
| Plan | 1,8 → 1,0 | 93 → 24 |
| Dil | 1,8 → 1,4 | 107 → 58 |
| Okuma | 1,9 → 1,4 | 103 → 54 |
| Yazı | 1,3 → 1,4 | 73 → 45 |
| Felsefe | 1,1 → 1,0 | 42 → 30 |
| Ses | 2,4 → 2,3 | 135 → 118 |
| Bugün | 2,0 → 1,8 | 66 → 51 |
| Ofis | 1,5 → 1,4 | 68 → 57 |
| Tarih | 1,3 → 1,9 | 52 → 95 (ilk sekme artık şerit değil bugünün egzersizi + deste) |

### Dört sorunun cevabı (kullanıcı, 2026-11-06)

1. **Bugün › «Günün akışı»** kalktı: kapağın aşağı oku aynı işi yapar.
2. **Öğrenme** böyle kalır: alanın «Öğren»i o alanın konuları, Kütüphanem › Öğrenme adım adım yol
   (Anlatımlar onun altında); ikisi birbirine bağlı.
3. **Masalar Uzmana sor'a katıldı:** Ofis iki iş. Masa, toplantı, devir, uzman masaları, öneriler,
   haftalık plan ve öncelik sırası sohbetin altında katlı; Patron satırı tekrar çizilmez (sohbet
   Patron'la açılır). `office` rotası ve komutu çalışır, menüde yok; bekleyen rozeti Uzmana sor'da.
4. **Plan seçici** yalnız Basamaklar'ın başında (Projeler'in kendi süzgeci var).

Aşağıdaki 1. tur dökümü tarihçedir; «Diğer» kuralı geçersiz.

## Bulunan kök sorunlar

1. **İş ilk ekranda değildi.** Dil'de sekmelerin üstünde üç grafik duruyordu; «12 kartı çalış»
   düğmesi 870 px aşağıdaydı. Felsefe, Ses ve Okuma'da da aynıydı.
2. **Çubukta yedi sekme vardı, ikisi ekrana sığmıyordu.** Altı alanın sırası da birbirini tutmuyordu.
3. **Analiz tek yazıda dokuz kart, altı ekran.** Sekmeler yalnız «Ayrıntılı okumalar»a basınca çıkıyordu.
4. **Onaylar 21 öneriyi sekiz kart olarak diziyordu.** Üç soru üç kırmızı düğme demekti; geçmiş aynı yerdeydi.
5. **Konu anlatımı kartı her sekmenin altına ekleniyordu**, «Öğren» sekmesi varken.
6. **Düğme ne yapacağını söylemiyordu.** Bugün'ün ana düğmesinde «Kartları hatırlama oranı düşük» yazıyordu.
7. **Bozuk düzen:** Plan › Yol'da kademe içeriği 100 px'e sıkışıyordu (`.step` sınıfı başka bir bileşenin ızgarasını getiriyordu).
8. **İç terim:** «Tezgâh», «Açık», «Kapalı», «Şerit», «Zincir», «Matris», alan içindeki ikinci «Çalışma».
9. **Düzen denetimi körmüş:** `layoutcheck` eski `.subtabs` adını arıyordu, sekmelerin çoğunu hiç ölçmüyordu. Düzeltildi; 182 yer geziliyor.

## Ortak kural (yeni)

Çubukta en çok dört ad: **işin kendisi** ve **Diğer**. «Diğer» bir listedir; her satır ne işe
yaradığını söyler, dokununca o bölüm açılır, üstte «‹ Diğer» geri götürür. Bütün bölümler yerinde
durur, adres ve komutlar (`S.ui.langTab`, Ctrl+K, King) aynı çalışır. Grafik «İlerleme»de, konu
kartı «Öğren»de. Bileşen: `core/components.js` › `SayfaBolumleri` (`ikincil:true`, `not`); çağrı
`core/parts.js` › `bolumler` (`ust` = bölüm başı kartları).

## Ekran ekran, en karmaşıktan sadeye

«Özellik» o bölümde aynı anda gördüğün ayrı iş sayısıdır. Tek iş sütunu bölümün bir cümlelik görevidir.

| Ekran | Tek iş | Özellik önce → sonra | Kelime | Ekran | Birincil eylem önce → sonra |
|---|---|---|---|---|---|
| Analiz | Nasıl gidiyorum? | 9 kart + 5 gizli → Özet (3 kart, 1 sayı, 1 düğme) | 425 → 68 | 5,8 → 1,4 | yok → yok (okuma ekranı; öneri için tek düğme) |
| Onaylar | Bekleyeni karara bağla | 3 soru + filtre + 8 kart + geçmiş → 1 açık kart + 7 satır | 292 → 49 | 4,4 → 1,6 | 3 → kartın kendi düğmeleri; soru sekmesinde 1 |
| İnceleme | Bu haftanın tek kararı | 5 kutu → karar + sayılar, 3 satır katlı | 226 → 84 | 3,2 → 1,6 | 1 (ama ikinci ekranda) → 1 (ilk ekranda) |
| Ses | Bugün çal, söyle, kaydet | 6 sekme + tempo grafikleri → 3 + Diğer | 128 → 85 | 2,4 → 1,6 | 1 → 1, üç grafik altında değil |
| Dil | Sırası gelen kartları çalış | 7 sekme + 3 grafik → 3 + Diğer | 103 → 33 | 1,8 → 1,0 | 1 (870 px aşağıda) → 1 (ilk ekranda) |
| Okuma | Not al | 6 sekme + grafik → 3 + Diğer | 94 → 76 | 1,9 → 1,7 | 1 → 1 |
| Plan | Sıradaki basamak | Karışık sınama + 4 sekme → 4 sekme, sınama kendi sekmesinde | 85 → 72 | 1,8 → 1,6 | yok → yok (Sınama'da 1) |
| Yazı | Taslağına dön | 5 sekme → 3 + Diğer | 71 → 54 | 1,3 → 1,1 | 1 → 1 |
| Bugün | Ne yaptın? | 7 kısayol + 4 sık + 5 sütun → 4 kısayol + 3 sık + 2 sütun | 58 → 48 | 2,0 → 1,9 | 2 kırmızı → kapakta 1; «Günü kapat» sade |
| Tarih | Olayları zamana diz | 7 sekme; olay başına 5 düğme → 3 + Diğer; «İşlemler» katlı, form katlı | 50 → 32 | 1,3 → 1,1 | Olaylar'da form açıktı → liste önde |
| Felsefe | Tez yaz, itiraz et | 7 sekme + grafik → 3 + Diğer | 40 → 23 | 1,1 → 1,0 | 1 → 1 |
| Ofis › Masalar | Sıradaki iş, kime sorarım | Altı satır önde → önce Patron | 71 → 71 | 1,5 → 1,5 | Danış, altta → Danış, en üstte |
| Ofis › Danışma | Uzmana sor | Sohbet + masa kartı → sohbet, masa katlı | 88 → — | 1,9 → — | gönder → aynı |

Ekle sekmeleri ayrıca: Dil › Ekle 71 → 34 kelime (bağlam, eş ve zıt anlam katlı; «Kart ekle» birincil,
«Sık kelimeler» katlı; «Liste yapıştır» açık kaldı, Ctrl+K komutu oraya odaklanıyor). Ses › Diksiyon
150 → 129 kelime (hata etiketleri ve konuşma hızı katlı).

Dokunulmadı, tek iş ve kısa: Kütüphanem (Notlar, Öğrenme, Anlatımlar, Ürünler), Ayarlar › Profil, Genel.
Kılavuz 5,7 ekran ama bir belgedir. **Rütbe'ye dokunulmadı** (sınır).

### Yeni sekme adları

| Alan | Çubuk | Diğer |
|---|---|---|
| Dil | Çalış · Ekle · Öğren | Kartlar · Dilbilgisi · İlerleme · Uzman masası |
| Felsefe | Tezler · Yeni tez · Öğren | Kapanan tezler · Metinler · Deneyler · İlerleme · Uzman masası |
| Tarih | Zaman şeridi · Olaylar · Öğren | Alıştırma · Kaynaklar · Neden zinciri · Uzman masası |
| Ses | Müzik · Diksiyon · Öğren | Kulak · İlerleme · Uzman masaları |
| Okuma | Notlar · Kaynaklar · Öğren | Not bağları · Yöntem · İlerleme · Uzman masası |
| Yazı | Taslaklar · Ölçüm · Öğren | Araçlar · Uzman masası |
| Analiz | Özet · Alanlar · Zaman | Yol haritası · Radar · Seriler · Rapor · Dürüstlük · Rubrik · Veri aktar |
| Onaylar | Öneriler · Sorular · Son kararlar | (yok) |
| Plan | Genel · Yol · Projeler · Sınama | (yok) |

Felsefe ve Okuma'da «İlerleme» yalnız veri varken listelenir: boş bölüm satır olmaz (§1.2).

## Ortak gerekli (`brand/ortak/` ya da kök araç; bu oturum dokunmadı)

- `tools/mobil_tara.js` yalnız çubuğu gezer; «Diğer» altındaki bölümleri açmaz. `.diger-satir` de gezilmeli.
  ESP'de `layoutcheck` bu bölümlere bakıyor, ama dokunmatik taraması bakmıyor.
- Öneri kartı (ortak köprü) «orta», «geri alınabilir», iki düğme ve gerekçeyi alt alta dizer. Tek satıra inerse Onaylar bir ekrana iner.
- `brand/ortak/kisayol.js` Bugün'e «Notlarım» ve «King'e sor» düğmelerini kendi ekler; dört düğme telefonda iki sıra olabiliyor.
- `tools/ortak.py --denetle` ve `tools/parca_test.py` bu Windows kopyasında kırmızı: `parca-rehber.js` yalnız satır sonu (CRLF) yüzünden uyuşmuyor; `--yay` sonrası içerik farkı sıfır. Değişiklikten bağımsız.
- «Diğer» kalıbı AYS ve SPİ'de de işe yarar; `components.js` modül başınadır, kopyalanması gerekir.

## Kullanıcıya sorulan (1. tur; cevaplar yukarıda)

1. **Bugün › «Günün akışı» düğmesi** yalnız sayfayı aşağı kaydırıyor. Kalksın mı?
2. **Öğrenmenin üç yeri var:** her alanda «Öğren», Kütüphanem › Öğrenme, Kütüphanem › Anlatımlar. Tek yerde toplansın mı?
3. **Ofis ile Danışma çakışıyor:** Masalar › Masa, Günün toplantısı, Uzman masaları ile Danışma aynı kişileri gösteriyor. Birleşsin mi?
4. **Plan'ın alan seçicisi** yalnız Yol ve Projeler'i etkiliyor ama başta duruyor (2026-10'da başta olması istenmişti, test de bunu söylüyor). Yalnız ilgili sekmede dursun mu?

## Yapılmayanlar

- Bugün hâlâ 1,9 ekran: sayfa, kapak + kutu + gün olarak zaten üç blok; daha fazlası ortak kısayol ve giriş kutusuna dokunmayı gerektirir.
- Müzik sekmesinde metronom, tekrar kaydı ve parça listesi birlikte kaldı: tek çalışma akışı, ayrılırsa dokunuş artar.
- Kart sekmesi ve Kaynaklar'ın satır düğmeleri (Bitir, Sil) yerinde; Tarih'teki gibi katlanabilir.
- Gerçek telefonda denenmedi; ölçümler tarayıcıda 390 px.
- `ESP/dist` derlemesi commit'e girmedi: üç oturum aynı anda çalışıyor, birleştirmede tek seferde üretilmeli.

## Denetim çıktıları (2026-11-06, oyun kapalı, sırayla)

| Denetim | Çıktı |
|---|---|
| `node tools/runtests.js` | 2872/2872 |
| `node tools/smoke.js` | 2 hedefte 42 ekran, temiz |
| `node tools/layoutcheck.js` | 390 ve 820 pikselde 182 yerde taşma yok, dokunma tabanı 24 px |
| `node tools/a11ycheck.js` | temiz (Gam cetvelinin iki seçim kutusuna etiket eklendi) |
| `node tools/perfcheck.js` | bütçede, en ağırı Analiz 25 ms / 100 ms |
| `node tools/mobil_tara.js ESP` | 240 ölçüm, 0 bulgu (yalnız çubuk; yukarıdaki not) |
| `python tools/yazi.py --denetle` | temiz |
| `node tools/pusula.js` | ESP Y1 3 eylem, 9 sn tahmin; Y2 1; Y3 4 (hedefte) |
