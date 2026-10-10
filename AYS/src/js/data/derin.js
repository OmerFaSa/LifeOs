/* KONU DERİNLEŞTİRME — her konunun anlatımının üstüne ikinci kat:
   kazanımlar, ön koşul konular, seviyeli çözümlü örnekler, «sınavda nasıl
   sorulur», sık yapılan hatalar ve orta/ileri seviye sorular.

   Kullanıcı (2026-10-09): «konu öğrenme kısmını çok daha profesyonel yap;
   eksikler var mı bak, örnekleri arttır». Temel anlatım (data/anlatim-*.js)
   kavramı verir ve dört temel soruyla sınar; bu dosyalar konuyu sınav
   düzeyine taşır: önce kendin dene diye çözümü kapalı örnekler, ÖSYM
   kalıpları ve ipuçlu orta–ileri sorular.

   KAYNAK VE DOĞRULUK: anlatım dosyalarıyla aynı. LifeOS'un geliştirme
   oturumu (Claude) elle yazdı; her soru yazılırken çözüldü, sonra ayrıca
   yeniden çözülerek denetlendi. Bir kitaptan alıntı değildir; ekranda
   «elle yazıldı · doğrulanmadı» yazar. SEVİYE yazarın değerlendirmesidir,
   ölçüm değildir; hiçbir plan, kapanış ya da eşik ona bakmaz.

   DOSYALAR: data/derin-<önek>.js (tr, tm, tf, ts, am, af, ak, ab).

   BİÇİM: R.KONU_DERIN[konuKimliği] = {
     kazanim:  [madde, …]                  2–5; «bu konunun sonunda» yapabileceklerin
     onKosul:  [konuKimliği, …]            0–3; önce bilinmesi gereken konular
     ornekler: [{ seviye, soru, cozum:[adım, …] }]   2–4; çözüm ekranda kapalı gelir
     kaliplar: [madde, …]                  2–4; sınavda bu konu nasıl sorulur
     hatalar:  [madde, …]                  2–4; sık yapılan hatalar
     sorular:  [{ seviye, soru, sec:[beş seçenek], dogru:'A'–'E', ipucu, cozum:[adım, …],
                  sekil?, tablo?, yenilendi? }]
   }
   seviye: 'temel' | 'orta' | 'ileri'. Sorular konunun temel sorularının
   ARDINA eklenir (core/ogren.js sorular): kayıtlı cevaplar sıra numarasıyla
   tutulduğu için yeni soru hep sona yazılır, araya girmez.

   SEVİYE ÖLÇÜTÜ (yazar böyle değerlendirir; ölçüm değildir):
     orta  — tek kavram ya da tek adımlı işlem; örneklerdeki yolu doğrudan
             uygular, bilgiyi tanır.
     ileri — iki ya da daha çok adım, kavramları birleştirme, şekilden ya da
             tablodan veri okuyup yorumlama, ya da tuzak seçeneği ayırt etme
             (ör. «kesinlikle», «olamaz», «yanlıştır» kökleri) gerektirir.
   ŞEKİL VE TABLO: sekil ve tablo tarifleri core/sekil.js'in kapalı
   kataloğuyla yazılır; ekran okuyucu ve düz metin için alt cümlesi zorunlu.
   YENİLENDİ: yerinde düzeltilen soruya o anın ISO zamanı yazılır; ondan
   önceki cevaplar ve deneme kayıtları sayılmaz (core/ogren.js söz 5).
   TEKRAR YOK: soru, kendi konusunun çözümlü örneğinin cevabını yeniden
   sormaz; Anlatım ve paragraf havuzundaki bir sorunun aynısı olmaz
   (tests/derin.test.js söz 3a–3b).
   Biçimi ve eksiksizliği tests/derin.test.js sınar. */

window.R = window.R || {};
R.KONU_DERIN = R.KONU_DERIN || {};
