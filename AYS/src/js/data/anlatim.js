/* KONU ANLATIMI VE ÖRNEK SORULAR — her AYS konusunun uygulamanın İÇİNDE
   duran ders notu (Öğren › Anlatım ve Öğren › Sorular).

   Kullanıcı (2026-10-09): «daha çok ders notları olsun, örnek sorular olsun,
   daha detaylı anlatım olsun; konuları teker teker uygulamanın içinde
   öğreneyim». Kısa özet (data/ozetler.js) konunun özüydü; bu dosyalar onun
   ayrıntılı hâlidir: tanım, kural, formül, çözülmüş örnek ve ÖSYM biçiminde
   beş seçenekli sorular. Model kapalıyken, HKM yokken, internetsizken de
   okunur.

   KAYNAK VE DOĞRULUK
   LifeOS'un geliştirme oturumu (Claude) elle yazdı. Kapsam MEB ortaöğretim
   programlarının ve YKS'nin konu başlıklarıdır (R.SUBJECTS); metin bir
   kitaptan alıntı DEĞİLDİR ve hiçbir kaynakla satır satır doğrulanmadı:
   ekranda «elle yazıldı · doğrulanmadı» yazar. Sayılar yazılırken elle
   hesaplandı. Bir hata bulunursa YALNIZ ilgili dosyada düzeltilir.

   DOSYALAR: ders başına bir dosya, data/anlatim-<önek>.js (tr, tm, tf, ts,
   am, af, ak, ab). Her biri R.KONU_ANLATIM'a kendi konularını ekler.

   BİÇİM: R.KONU_ANLATIM[konuKimliği] = {
     giris:    1–3 cümle; konu nedir, sınavda nerede durur,
     bolumler: [{ baslik,
                  metin:   paragraf ya da [paragraf, …],
                  liste?:  [madde, …],
                  formul?: [satır, …],
                  ornek?:  { soru, cozum:[adım, …] },
                  dikkat?: en sık yapılan hata }]          (2–6 bölüm),
     sorular:  [{ soru, sec:[beş seçenek], dogru:'A'–'E',
                  cozum:[adım, …] }]                       (3–6 soru) }
   Metinde üç işaret açılır: **kalın**, x^{2} üst simge, H_{2}O alt simge.
   Biçimi ve eksiksizliği tests/anlatim.test.js sınar.

   BİLEREK YAPILMADI: hiçbir anlatıma «bu konudan kaç soru çıkar» ya da
   «kaç günde biter» yazılmadı; frekans R.SUBJECTS'te, süre plandadır. Puan
   ya da sıralama tahmini yoktur. */

window.R = window.R || {};
R.KONU_ANLATIM = R.KONU_ANLATIM || {};
