# Kabuk paketi · tur 2026-11-17

Durum: BİTTİ (taban 8137f67b, dal sadelesme). Commit/push yok (koordinatör yapar).

## 1. Üst/alt çubuk binme hatası + yüzen düğme
Bulgular (yalıtılmış sunucuda 320…1440 px × {varsayılan, piksel yazı, en büyük yazı, ikisi} ölçüldü):
- 641–860 px'te arama düğmesi yuvarlak olmuyordu: `@media (max-width:860px){ .ust__ara{ width:36px } }` kuralını dosyanın
  sonundaki `.ust__ara{ width:200px }` eziyordu (aynı ağırlık, sonra gelen kazanır). 200 px'lik boş «hap» + seçili sekmenin adı
  sığmıyor, «Bugün» etiketi kırpılıyor/aramanın altına giriyordu. Piksel yazı tipi (Ayarlar › Yazı tipi) ve büyük yazı boyunda
  700 px'e kadar taşma.
- Seçili sekme etiketi `--govde` yazısını kullanıyordu; Yazı tipi «Piksel» seçiliyse çubuk da piksel oluyordu.
- En büyük yazıda «İçeriğe geç» atlama bağlantısı ekranın üstünden 3 px görünüyordu (top:-48px sabitti).
- «Sağ altta kare, katmanlar simgeli yüzen düğme»: kabukta başka sabit (fixed) öğe yok (13 sayfada ölçüldü); telefonda aşağı
  kaydırınca alt çubuğun adları gizleniyor, yalnız simgeler kalıyor ve seçili «Öğren»in katmanlar simgesi kare bir hap
  içinde tek başına «yüzen düğme» gibi görünüyordu.

Düzeltme (kabuk.css sonu «Tur 2026-11-17» bloğu): sekme adı yalnız ≥1100 px'te (altında yalnız simge, seçili sekme tonlu hap);
arama 1100 px altında yuvarlak (dokunmatikte 44 px); logo/arama/hesap `flex:none`; çubuklar her zaman cihaz yazısında
(`--baslik`), piksel ayarı yalnız içeriği değiştirir; «İçeriğe geç» `translateY(-110%)` ile gizli; alt çubukta adlar hep görünür
(kaydırınca küçülme ve ad gizleme kalktı). Ölçüm (13 genişlik × 4 yazı ayarı × 7 sayfa): kesişme 0, taşma 0.

## 2. Konu listeleri (alan genel bakışı, harita.json, dal seçimi)
- [x] Saf işlevler (kabuk.js, testli): `uniteGruplari` (ünite adını « · » ya da « — » öncesinden gruplar; veride ayraç « · »),
      `haritaSuz` (harita.json güvenilmez girdi: sema 1, bozuk dal/bölüm/konu atılır, ders/unite yalnız `<alan>.n.n…` biçiminde).
- [x] `haritaYukle` aşama dosyalarıyla aynı yoldan (`../alan/<id>/harita.json`), yalnız alan sayfası açılınca ya da dalı seçilmiş
      alanın Bugün kartı için; 404 → null, sessiz. Gelince yalnız aynı adres hâlâ açıksa yeniden çizilir (ders sayfası bozulmaz).
- [x] Genel bakış sırası: sıradaki kartı → Konu haritası (dallar; seçili dal en üstte ve açık, öbürleri kapalı) → «Dersler · Aşama n»
      (Akademik'te 8 grup: TYT Türkçe 3, TYT Temel Matematik 5, TYT Fen 3, TYT Sosyal 4, AYT Matematik 4, Fizik 4, Kimya 3,
      Biyoloji 4 ünite; grup → ünite (kısa ad «Anlam») → dersler; masaüstünde gruplar açık/üniteler kapalı, telefonda yalnız
      şu anki grup açık) → Aşamalar.
- [x] Konu satırı: derse bağlıysa bağlantı (okundu ✓ / sıradaki ders / ders / kilitli ders), üniteye bağlıysa aşama sayfası,
      bağsızsa «henüz ders yok · King’le çalış» (`<a href="#/king" data-king-konu data-alan>`).
- [x] Dal seçimi: «Bu dalı çalış» (`data-ac="dal-sec"`) → `lifeos.alan.<alan>.dal`; seçili dal «Çalıştığın dal», sayfa alt başlığı
      «Çalıştığın dal: …», Bugün'deki alan kartının alt başlığı dalın adı.

- [x] Testler: kabuk.test.js +2 (gruplama, harita süzme; gerçek tarih/felsefe haritasında hiçbir konu atılmıyor);
      depo.test.js AYARLAR'a `lifeos.alan.tarih.dal` (ayar, kayıt değil); kabuk_gez.js: çubuk kesişmesi (10 genişlik × 2 yazı
      ayarı × 3 sayfa), konu haritası (dal sırası, kapalı başlangıç, ders bağlantısı, King bağlantısı), dal seçimi (kayıt, en üstte
      açık, yenilemede kalır, Bugün kartı), Akademik grupları (8 grup, 30 ünite, kısa ad), telefonda tek açık grup. Ünite
      seçicileri `.yol > .b-acilir` oldu (dallar ve gruplar da açılır); 404 süzgecine `harita.json` (kabuk_gez, hareket_gez).

## 3. Sadelik / estetik turu
On bir ekran 1440/390 × açık/koyu çekildi (önce: HEAD'in `git archive` kopyası; sonra: çalışma ağacı) → `kabuk-gorsel/once-*`, `sonra-*` (88 görüntü).
- [x] Üst çubuk her sayfada aynı hizada: düz şeritli sayfalarda (Hesap, Ayarlar, ders…) logo 16 px sola kayıyordu; artık
      manzaralı sayfalarla birebir (`.ust--duz` iç payı `50vw - 600px + --a4`).
- [x] Çubuk tutarlılığı: dar ekranda yalnız simge + tonlu hap, geniş ekranda seçili sekmenin adı; alt çubuk adları sabit.
- [x] Konu satırları sakin: bağsız konu adı ikincil renkte, «henüz ders yok · King’le çalış» küçük soluk (bağlantı altı çizgili, vurgu
      rengi yalnız üstüne gelince); telefonda not adın altına iner, dokunma alanı 44 px ama satır büyümez. Seçili dal işareti tek yerde.
- Bakıldı, değiştirilmedi (dosya benim değil ya da bilgi kaybı riski): Plan'da birden çok eşit düğme (araclar.js), Not'ta
  «Ayrıntılı not» manzaranın üstünde sağda (araclar.js başlık eylemi), Ayarlar uzun tek sütun (bilinçli: arama kutusu var).

## Kalite kapısı (son koşu, gerçek çıktı)
- `node kabuk/kabuk.test.js` → «70 geçti, 0 kaldı»; `node kabuk/bilesen.test.js` → «22 geçti, 0 kaldı»
- Öbür `kabuk/*.test.js`: acilis 2, deneme 6, depo «19 test geçti», etkilesim «hepsi geçti», gece 6, hesap-baglanti 14, hesap-giris 16,
  hesap-yonetim 17, hesap 12, king-sohbet 8, onay 15, saglik 6, ses 9, tanisma 25 — hepsinde «0 kaldı»
- `node tools/kabuk_gez.js` → 364 ✓, «hepsi geçti» (exit 0)
- `node tools/kabuk_esit_gez.js` → «hepsi geçti»; `node tools/hareket_gez.js` → «hepsi geçti» (kareler hareketi azalt: enUzun 17 ms, uzun 0)
- `node kalite/hiz_olcum.js --tekrar 1 --denetle` → soğuk istek 13 ≤ 20, 415 KB ≤ 600, alan JSON 2 ≤ 3, sıcak 4 KB ≤ 40, betik 4 ≤ 6 (hepsi ✓;
  harita.json Bugün'de istenmez, yalnız alan sayfasında ya da dal seçilmişse)
- `node tools/ortak_test.js` → «276 geçti, 0 kaldı, 23 eski modül vakası atlandı»
- `python kalite/olcum.py --denetle` → «Bütçe tamam: 28 bütçe, aşım yok.»

## Değişen dosyalar
`kabuk/kabuk.js` (KAPAK'a dokunulmadı), `kabuk/kabuk.css`, `kabuk/kabuk.test.js`, `kabuk/depo.test.js`, `tools/kabuk_gez.js`, `tools/hareket_gez.js`.

## Açık kalanlar
- Sahibin ekran görüntüsündeki tam genişlik/ayar bilinmiyor; 320–1440 × piksel/en büyük yazıda ölçüldü. «Sağ alttaki kare düğme»
  kabukta başka sabit öğe olmadığından alt çubuğun kaydırınca adsız kalan hâli sayıldı; değilse (ör. iOS paketi eski `dist/`) içerik/paket ajanına.
- Grup açık/kapalı kararı çizim anındaki genişlikten (pencere sonradan daraltılırsa yeniden çizilene kadar eski hâl).
- Dal seçimi yalnız bu cihazda (localStorage ayarı, eşitlenmez); seçimi kaldırma düğmesi yok (başka dal seçilebilir).
- Gerçek uygulamada (4180, sahibin verisiyle) gezinilmedi; yalnız yalıtılmış sunucu.
