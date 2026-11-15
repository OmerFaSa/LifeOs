# Faz 8 · Taze, sade, profesyonel (2026-11-15)

**Sahibin isteği:** «Görsel olarak minimalleştirerek güzelleştir; sistemin kalitesini artır, daha güzel ve profesyonel olsun. Optimizasyona devam et, animasyonları daha güzel yap. Genel sistem olarak daha taze, minimalist ve profesyonel bir plan çıkar, ajanlara bırak.»

**Tek cümlelik hedef:** LifeOS açıldığında sakin, hızlı ve özenli hissettirsin. Her ekranda bir şey öne çıksın, gerisi geri çekilsin. Hareket az olsun ama yerinde.

## Değişmeyecekler (sahibin önceki kararları)

- AGENTS.md kural 10: sade, profesyonel, az metin, önce görsel.
- Piksel manzara yalnız sayfanın üstünde (kapak ve Bugün sahnesi). Tam ekran arka plan yok; bu reddedildi.
- Yeni prosedürel piksel sanatı yok. Var olan sahneler (`brand/ortak/piksel-doga.js`) kullanılır.
- Hareket «az» ayarı ve sistemin «hareketi azalt» ayarı her animasyonu kapatır. Kare bütçesi: geçişlerde 50 ms'yi aşan kare olmaz.
- Bileşen kataloğu kuralları (`kabuk/bilesen.test.js`, A2):
  - `bilesen.css` yalnız jeton kullanır;
  - elle renk yazılmaz;
  - köşeler yalnız `--kose` / `--kose-k` jetonlarından gelir.
  Kabuğa özel dokunuşlar `kabuk.css`'e yazılır.
- Testlerin dayandığı işaretler korunur ya da test aynı turda güncellenir. Örnekler: `.b-eylemler .b-dugme--ana`, `#asama-ad`, `yer-baslik`, `[data-sayfa]`, `.b-acilir` sayısı.

## Bugünkü durum (ölçülen)

- `kabuk/*.css` + `kabuk/*.js`: yaklaşık 800 KB. `kabuk/index.html` 25 ayrı betik yüklüyor.
- Gzip ve ETag var (altyapı turu): soğuk açılış 1,08 MB, sıcak 16 KB.
- Geçişlerde en uzun kare 33–100 ms arasında oynuyor. Bilinen maliyet CSS hacmi (bkz. hafıza: akıcılık ölçümü).
- Görsel borçlar:
  - Başlık, satır ve kart boyutları sayfadan sayfaya küçük farklarla değişiyor.
  - Gölge ve köşe değerleri birkaç elle yazılmış varyantta.
  - Boş durumlar ve «Yükleniyor…» satırları düz metin.
  - Hesap, King, Not ve Plan sayfaları, Bugün ve öğrenme ekranları kadar özenli değil.

## Paketler (paralel; dosya sahipliği ayrık)

Her paket kendi git worktree'sinde ve kendi dalında çalışır. main'e birleştirmeyi ana oturum yapar (sahibin onayıyla).

### P1 · Görsel dil — dal `taze-gorsel`

**Sahip olduğu dosyalar:**
- `kabuk/bilesen.css`, `kabuk/bilesen.js` (taş çizimleri);
- `kabuk/kabuk.css` (hareket bloğu hariç; hareket bloğu P2'nin);
- sayfa çizimleri: `kabuk/kabuk.js`'te `sayfa*` işlevleri (rota ve geçiş kodu hariç);
- `kabuk/hesap*.js`.

**Yapılacaklar:**
1. **Ölçü sistemi:**
   - yazı ölçeği: 5 adım (gövde, küçük, h3, h2, h1);
   - boşluk ölçeği: 4/8/12/16/24/32/48;
   - köşe: 3 değer;
   - gölge: 3 kat.
   Hepsi `:root` jetonu olsun. Elle yazılmış varyantlar jetona bağlansın; kalan sapmaları listele, sonra kaldır.
2. **Yüzey hiyerarşisi:** zemin, yüzey, yükseltilmiş yüzey. Koyu temada kontrast WCAG AA (metin 4.5:1, büyük 3:1). Ölçüm betiği raporda.
3. **Bileşen durumları tek dilde:** dinlenme, üzerine gelme, basılı, odak, devre dışı, seçili. Düğme, satır, kart, sekme, tercih için. Odak halkası tek ve görünür.
4. **Boş ve yükleniyor durumları:** düz metin yerine küçük, sakin bir yer tutucu (iskelet satırlar ya da var olan piksel simgelerden biri). Kısa ve tek cümle.
5. **Sayfa cilası** (Bugün ve öğrenme ekranları düzeyine çıkar):
   - Hesap, King, Not, Plan, Sağlık alt sayfaları, Harita;
   - her sayfada tek öne çıkan şey, gereksiz açıklama metni azaltılır (kural 10).
6. **Telefon (390 px):** dokunma hedefi en az 44 px, taşma yok. Alt boşluk iOS güvenli alanına uysun.

**Bitti sayılır:**
- açık/koyu × masaüstü/390 px ekran görüntüleri önce/sonra (`belgeler/ekip/sadelesme/faz8-gorsel-rapor.md`);
- kontrast tablosu;
- jetona bağlanmayan değer sayısı önce/sonra;
- bütün kapılar yeşil.

### P2 · Hareket — dal `taze-hareket`

**Sahip olduğu dosyalar:**
- `kabuk/etkilesim.js`;
- `kabuk/kabuk.css`'teki «Hareket dili» bloğu ve `#halka` / `.rihtim` / `.yukle` kuralları;
- `kabuk/kabuk.js`'te `rota()` içindeki görünüm geçişi, `canlan`, `siraVer`, halka ve rıhtım kodu;
- `kabuk/gece.js` (yalnız düğme davranışı).

**Yapılacaklar:**
1. **Hareket sözlüğü:** üç süre (hızlı, orta, yavaş) ve iki eğri (`--akis`, `--yay`). Bütün animasyonlar bunlardan beslensin. Sözlük `kabuk.css` başında belgelensin.
2. **Paylaşılan öğe geçişi:** Bugün'deki alan kartı, Öğren listesindeki alan satırı ve Sıradaki kartı, açtıkları sayfanın başlığına ya da kapak simgesine akar (`view-transition-name`, yalnız tıklanan öğeye geçici). Desteklemeyen tarayıcıda düz geçiş.
3. **Mikro etkileşimler:**
   - doğru cevapta küçük onay işareti çizilsin, yanlışta hafif sarsma (hareket azsa yok);
   - ders bitince ilerleme çubuğu dolsun, sayı yumuşakça artsın;
   - ayar değişince seçili göstergenin kayması.
   Hepsi yalnız görsel olsun; testlerin okuduğu metin anında doğru kalsın (sayılar `aria-valuenow` ile hemen yazılır, yalnız görüntü süzülür).
4. **Var olanları incelt:** imleç parıltısı ve eğim yalnız gerçekten etkileşimli kartlarda kalsın; süzülme gecikmeleri kısalsın; aynı ekranda en çok iki hareket aynı anda.
5. **Ölçüm:** `tools/` altına kalıcı bir hareket gezisi ekle (hareket açık/az, geçiş yönü, yeniden oynama yok, kare bütçesi). Bugünkü scratchpad betikleri buna örnek. CI'ya da eklensin. Kare ölçümü CI'da yalnız bilgi verir; geçişte süzülme ve tekrar oynamama denetlenir.

**Bitti sayılır:**
- kısa ekran kaydı ya da kare dizisi (önce/sonra);
- kare ölçümü: geçişlerde 50 ms'yi aşan kare yok;
- hareket «az»da hiçbir animasyon çalışmıyor;
- kapılar yeşil.

### P3 · Optimizasyon — dal `taze-hiz`

**Sahip olduğu dosyalar:**
- `kabuk/index.html` (betik yükleme sırası ve biçimi);
- `sistem/`, `tools/`, `kalite/`;
- `brand/ortak/` yükleme yolu;
- CI.

CSS içeriğine ve sayfa çizimine dokunmaz. Gerekiyorsa P1/P2'ye öneri olarak raporlar.

**Yapılacaklar:**
1. **Taban ölçüm** (tekrar edilebilir betik; `kalite/` altına):
   - soğuk/sıcak açılış: ilk boyama, ilk anlamlı çizim, etkileşime hazır;
   - JS ve CSS ayrıştırma süreleri;
   - uzun görevler;
   - bellek.
2. **Betik yükleme:** 25 ayrı betiği ilk ekran için gerekenler ve sonradan yüklenenler diye ikiye ayır (`defer` ya da istek üzerine). Sıra bağımlılıkları korunsun. Alternatif: üretim için tek paket (araçla, elle değil); geliştirme ayrı dosyalarla kalsın. Önce/sonra sayıyla seç.
3. **CSS maliyeti:** kullanılmayan seçici ölçümü; pahalı seçiciler (`:has`, geniş `:is`) ve sürekli animasyonların stil yeniden hesaplama maliyeti. Bulgular P1/P2'ye öneri olarak.
4. **Veri yolları:**
   - alan JSON'larının ilk ekranda gereksiz yüklenmesi;
   - IndexedDB okuma sayısı;
   - `/api/kabuk/baslangic` tek istek mi.
   Ölç, düzelt.
5. **Merkez/King:** köprü gecikmesi ve kuyruk ölçümü (`HKM/core/kopru.py` sayaçları) bir sayfada ya da `--durum` çıktısında görünsün. Davranış değiştirme.

**Bitti sayılır:**
- ölçüm tablosu önce/sonra (`belgeler/ekip/sadelesme/faz8-hiz-rapor.md`);
- açılış hedefi: sıcak açılışta etkileşime hazır < 600 ms (taban ölçümden sonra gerçekçi hedef güncellenebilir);
- kapılar yeşil.

## Ortak kurallar (her paket)

- Kendi worktree'n: `git worktree add ../LifeOs-<dal> -b <dal> origin/sadelesme`. Ana klasörde (`LifeOs-sadelesme`) değişiklik, dal değişikliği ya da commit yok.
- Kapılar:
  - `node kabuk/*.test.js`
  - `node tools/kabuk_gez.js`
  - `node tools/kabuk_esit_gez.js`
  - `python tools/tekkapi_test.py`
  - `python HKM/tests/run.py`
  - `python kalite/olcum.py --denetle`
  - `python kalite/katman.py`
  Ya da hepsi birden: `python tools/ci_yerel.py` (uzun sürer, arka planda koştur).
- Commit küçük ve açıklamalı.
  - Git'te global kimlik yok: `-c user.name="$(git log -1 --format=%an)" -c user.email="$(git log -1 --format=%ae)"`.
  - Mesajın sonu: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Dalı origin'e it, main'e değil. CI'yı `curl https://api.github.com/repos/OmerFaSa/LifeOs/commits/<sha>/check-runs` ile oku (`gh` oturumu yok).
- API anahtarı, parola ve jeton log, URL ya da localStorage'a girmez. Modelin `onayli` ders onayı yazması yasak.
- Rapor: ne yapıldı, ölçümler önce/sonra, ekran görüntülerinin yolu, açık kalanlar, dal adı.

## Sıra ve birleştirme

1. Üç paket aynı anda başlar.
2. Birleştirme sırası: önce P3 (davranışı değiştirmez), sonra P1, en son P2.
3. Çakışma çıkarsa `kabuk.css`'te bölge sınırına göre çözülür. Her birleştirmeden sonra bütün kapılar ve CI çalışır.
4. Sonra main ve çalışan kopya (`python sistem/guncelle.py`).
