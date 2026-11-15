# Tur 2026-11-16 · King paketi

Durum: BİTTİ (commit yok; koordinatör commit'leyecek). Bütün kapılar yeşil; kabuk_gez'de King dışı 8 kırmızı var (aşağıda).

## 1. İnceleme (önce ne vardı)
- **Geçmiş:** sunucu tarafında, ambardan (`HKM/daemon.py _sohbet_gecmisi`, istemcinin gönderdiği geçmişe güvenilmez). Kabuk
  `baslangic` göndermiyordu: «yeni konuşma» sunucuda sıfırlanmıyordu; son 12 satır gidiyordu. Kabuktaki geçmiş yalnız sekme belleğinde
  (yenileyince gidiyordu), son 20 tur.
- **Antigravity:** her mesaj YENİ konuşma (`new-conversation`), geçmiş istem metnine gömülü; `--model` varsayılanı `flash`.
- **Claude:** `claude -p --no-session-persistence`, geçmiş istem metnine gömülü; bütçe yalnız 24k harf baştan kırpma (eski turlar
  ile son turlar ayrımı yok).
- **Bağlam:** HKM'nin eski özeti (`sohbet.baglam`, manager.brief). King çekirdeğinin derleyicisi (`king/baglam.py derle`, Not motorunun
  King süzgeci + `ozelsiz`) yalnız MCP'deydi; kabuk sohbetine hiç girmiyordu. Ders bağlamı yoktu.
- **Ekran:** başlık + alt yazı + «King hakkında» bölümü (üç açılır) + dipnot + «Burada konuş» bölümü; Cevaplayan seçimi göze batan
  bir select; yazma kutusu 2 satır sabit, Enter gönderiyordu.

## 2. Hydrogen denemesi (gerçek çağrı, 2026-11-16 01:43)
`agentapi new-conversation --help`: «If the model is not available, the conversation runs on the flash tier instead» — yani
geçersiz kimlik SESSİZCE flash'a düşer; cevap metni kanıt değildir. Kanıt `get-conversation-metadata` içindeki `planModel`:

| --model | planModel |
|---|---|
| (yok) | MODEL_PLACEHOLDER_M322 |
| flash | M322 |
| yok-boyle-model | M322 (sessiz düşüş) |
| gemini-4-hydrogen-high | M525 |
| gemini-4-hydrogen-medium | M526 |
| gemini-4-hydrogen-low | M527 |

Sonuç: `--model=gemini-4-hydrogen-medium` biçimi KABUL EDİLİYOR (flash'tan farklı model yuvası); cevap da «Gemini 4 Hydrogen».
`send-message <id> <metin>` aynı konuşmaya devam ediyor (planModel M526 kaldı, model önceki cevabını aynen tekrarladı, 5 sn).
Eski «pro==flash» ölçümü doğruydu: `pro` takma adı da M322'ye gidiyordu; artık kimlik tam yazılıyor.

## 2b. Uçtan uca gerçek çağrı (geçici HKM deposu, gerçek Antigravity)
`sohbet.konus(kip="ogretmen", ders=felsefe.1.1.1, lifeos=True)` iki tur, `kopru.OTURUM` verili:
- Tur 1: yeni konuşma, `antigravity · gemini-4-hydrogen-medium`, 11,3 sn; cevap ders metnine dayandı, tek adım + tek soru.
- Tur 2 («phil sevgi, soph bilgelik demek, doğru mu?»): AYNI conversationId (send-message), 4,7 sn; «Doğru, …» ile başladı ve
  ikinci adıma geçti. Konuşmanın `planModel`'i `MODEL_PLACEHOLDER_M526` (= hydrogen-medium).

## 3. Değişenler
**Sunucu (HKM)**
- `HKM/core/kopru.py`: Antigravity varsayılanı `gemini-4-hydrogen-medium`; `pro`→hydrogen-high, `flash_lite`→hydrogen-low (`ag_model`);
  modeller listesi hydrogen medium/high/low + flash. **Süreklilik:** `OTURUM` contextvar'ı (daemon koyar); `ag_devam_mi` (saf) geçmişin
  sondan üçüncü mesajı o konuşmaya en son gönderilen soruysa `send-message` ile devam eder, değilse (arada başka sağlayıcı cevapladı,
  geçmiş sıfırlandı, 6 saat bayat) tam ve bütçeli geçmişle yeni konuşma. Devamda cevap dökümün gönderimden SONRAKİ kısmından okunur
  (önceki DONE cevap yeni sanılmasın). **Bütçe:** `gecmis_butcele` (saf): son 6 mesaj tam, eskiler 280 harfe kısalır, toplam 14k harfi
  aşarsa en eskiden atılır, son mesaj hiç atılmaz; `istem()` bunu kullanır (Claude her turda bütçeli geçmiş alır).
- `HKM/core/models.py`: Antigravity model listesi (ilk = varsayılan).
- `HKM/core/sohbet.py`: `KIP_TALIMAT` (ortak / ogretmen / filozof), `kip_of`; `ders_blogu` (saf: ad, yer, özet, metin; alıştırma cevabı
  ve kapı sorusu GİTMEZ; 4000 harf tavan), `ders_oku` (kimlik doğrulanır, metin `king/mcp.py t_yol` ile alan JSON'undan okunur;
  istemcinin metnine güvenilmez); `lifeos_blogu` (saf: `king/baglam.py derle` çıktısı, dilim başına tek satır, `ozel:true` ikinci kez
  atılır, 4500 harf); `konus(kip, ders, lifeos)`. Öğretmen kipinde eski OGRETMEN_RE talimatı ikinci kez eklenmez.
- `HKM/core/gizlilik.py`: veri türü adları «ders», «lifeos» (gizlilik panosu).
- `HKM/daemon.py`: `/api/chat` gövdesinde `kip` varsa kip + ders + LifeOS bloğu; `baslangic` geçerliyse `kopru.OTURUM` =
  baslangic|kip|ders (her istekte yeniden kurulur, keep-alive iş parçacığına sızmaz). Yeni sohbette geçmiş 12 → 24 satır.
- `HKM/tests/test_kopru.py`: 6 yeni test (hydrogen varsayılanı, geçmiş bütçesi, devam koşulu, send-message akışı, kip/ders/LifeOS
  blokları, kip ve dersin sistem metnine girmesi); eski `antigravity:pro` testi hydrogen-high'a.

**Kabuk**
- `kabuk/king-sohbet.js` (yeniden yazıldı): mesajlaşma düzeni (sen sağda, King solda, en yeni altta; akış kendi içinde kayar, yazma alanı
  altında), tek satırdan 240 px'e kadar büyüyen yazma alanı (Enter gönderir, Shift+Enter yeni satır), yuvarlak Gönder, sakin üç nokta
  «yazıyor», «Yeni konuşma», kip seçici (Düşünce ortağı · Öğretmen · Filozof), ders bağlamı hapı (× ile kalkar), kipine göre örnek
  sorular. Geçmiş `lifeos.king.sohbet`'te (yenilemede kalır, 80 mesaj, mesaj başına 20k harf; bozuk depo → boş konuşma). İstek gövdesi:
  `kip`, `baslangic` (yerel ISO; sunucu geçmişi buradan başlatır, «Yeni konuşma» sunucuda da sıfırlar), `baglam {tur:'ders', alan, id}`.
  Güvenli biçim (`bicimle`): önce her şey kaçırılır, sonra yalnız paragraf, satır sonu, madde, numaralı liste, tablo, kalın, kod.
  «Cevaplayan» yazma alanının altında küçük, kenarsız seçim.
- `kabuk/kabuk.js` (yalnız King yerleri): `kingGovde` → başlık (alt yazısız) + tek kapalı «King hakkında» (eski üç açılır + dipnot
  içinde; dipnot artık Antigravity/Google ve Claude/Anthropic'i söylüyor). `sayfaDers`: eylemlere tek sakin «King'le çalış»
  (`href="#/king"`, `data-king-calis`): King o dersin bağlamıyla Öğretmen kipinde açılır; başka dersten gelirse yeni konuşma.
- `kabuk/kabuk.css` (yalnız King kuralları): eski `.b-sohbet` tabanlı King kuralları çıktı, `king-*` kuralları girdi (yalnız jeton;
  azaltılmış harekette noktalar durur; dar ekranda ipucu gizli, kip düğmeleri sıkı).
- `kabuk/king-sohbet.test.js`: 3 yeni test (gövde, depo okuma, güvenli biçim + enjeksiyon). `kabuk/depo.test.js`: AYARLAR'a
  `lifeos.king.saglayici`, `lifeos.king.sohbet`. `tools/kabuk_gez.js`: King adımı yeni seçicilerle + yenileme/«Yeni konuşma» denetimi.

## 4. Testler (2026-11-16, bu çalışma kopyasında; başkalarının eşzamanlı değişiklikleri de içinde)
- `cd HKM && python -m tests.run`: **1068/1068 geçti**. `HKM/tools/perf.py`: bütün sorgular bütçede.
- Kabuk birim: king-sohbet 7/7, kabuk 68/68, bilesen 22/22, depo 19/19; öteki 11 kabuk testi de yeşil.
- `king/*_test.py` 6/6 yeşil; `kalite/olcum.py --denetle`: 28 bütçe, aşım yok; `kalite/katman.py`: yeni bozulma yok.
- `tools/tekkapi_test.py`: 165/165.
- `tools/kabuk_gez.js`: 336 ✓, **8 ✕ hepsi King dışı**: «tarih/dil/muzik/okuma/beslenme/hareket/uyku/tahlil: bütün üniteler açık
  gelir». Neden: aynı çalışma kopyasında başka birinin `kabuk.js` değişikliği («kilitli üniteler kapalı gelir», sahibin 2026-11-16
  isteği); test eski davranışı bekliyor. O değişikliğin sahibi testi güncellemeli. King adımları (5) yeşil.
- King görsel doğrulama (gerçek Chromium, yalıtılmış tek kapı, sahte King cevabı): 21/21 (Enter/Shift+Enter, büyüyen kutu,
  «yazıyor», istek gövdesi, liste/tablo biçimi, akış en altta, yenilemede geçmiş, yazma alanı 1280 ve 390 px'te ekranda, Yeni
  konuşma, ders girişi → bağlam + Öğretmen, istekte ders kimliği, bağlam kaldırma, 390 px'te yatay taşma yok). Betik oturumun
  scratchpad'inde (`king_goruntu.js`), depoya alınmadı.
- Ekran görüntüleri (bu klasörde): `king-bos-*`, `king-konusma-*`, `king-ders-*` (masaustu/telefon × acik/koyu) ve
  `king-ders-girisi-masaustu-acik.png`.

## 5. Açık kalanlar
- Canlı LifeOS (4180) yeniden başlatılınca devreye girer; canlı Merkez ayarında Antigravity ataması `flash` ise «Otomatik» yine flash
  kullanır (açık seçim saygı görür). Hydrogen için Cevaplayan'da «Antigravity» seçmek ya da Merkez atamasını hydrogen yapmak yeter.
- Antigravity `send-message` iletisini dökümde SYSTEM_MESSAGE olarak kaydediyor («not actually sent by the user» çerçevesiyle);
  model yine de soruyu cevaplıyor (ölçüldü), ama ileride agentapi değişirse ilk bakılacak yer burası.
- Süreklilik haritası (`_AG_KONUSMA`) yalnız süreç belleğinde: sunucu yeniden başlarsa ilk mesaj yeni konuşma açar (tam geçmişle;
  kayıp yok, yalnız bir kez yavaş).
- Claude köprüsünde süreklilik yok (`--no-session-persistence` korundu); her tur bütçeli geçmiş gider.
- Ders girişi dersin sonunda (eylemler satırı). Okurken yanda King paneli istenirse ayrı tasarım turu (kural 6: önce örnek).
- Öğretmen kipi taslak derste cevaba «taslak» uyarısıyla başlıyor (dürüst ama tekrarlıyor); istenirse yalnız ilk turda söylesin.
- `[[grafik: …]]` işaretleri (OGRETMEN_TALIMAT) kabukta çizilmez, düz metin kalır.
