# Ajan A · tarih.3 raporu

Dosya: `alan/tarih/asama-3.json` · id `tarih.3`, sira 3, «İslamiyet öncesi Türk tarihi: bozkırın devletleri», onKosul [] (hemen açık).
Kurucu betik (geçici): scratchpad `t3/` (b.py, kok.py, u1-u5.py). Commit/push yapılmadı.

## Sayılar
- 5 ünite, 24 ders, 79 ders alıştırması (8'i açık uçlu), 20 ünite kapı sorusu (4'er, eşik 0.75), 6 aşama kapı sorusu (eşik 0.8). Toplam 105 alıştırma.
- 43 kaynak (15 gemini «dogrulanmamis», 24 kitap «kaynakli»); hepsi en az bir yerde kullanılıyor.
- Doğru harf dağılımı: A 23, B 25, C 25, D 24.
- Bütün içerik `durum: taslak`, `yazan: model`; «onayli» yok. Kaynakta olmayan bilgiler paragraf sonunda «(modelin bağlantı notu)».

## Üniteler
1. tarih.3.1 Türklerin anayurdu ve ilk izler (4 ders): anayurt görüşleri ve bozkır; at, Afanasyevo/Andronovo, kurganlar (Arjan, Pazırık, Esik); Sakalar ve Alp Er Tunga; göçlerin nedenleri ve sonuçları.
2. tarih.3.2 Hunlar (5 ders): Teoman ve Mete; onlu ordu, Baideng, heqin, Çin seddi; bölünme ve dağılış (Wudi, Zhizhi, 48, 89-91, Liu Yuan 304); Kavimler Göçü, Balamir, Uldız, Rua; Attila (Margus 435, Anatolius 443 ve 447-448, Priskos 449, Katalaunum 451, İtalya 452, ölüm 453, Nedao 454) ve Ak Hunlar.
3. tarih.3.3 Göktürkler (5 ders): Bumin-İstemi 552; Maniakh 568, Zemarkhos, 576 kopuş; bölünme 582, 630-682 Çin hakimiyeti, Kür Şad 639; Kutluk 682, Kapgan, Bilge, Kül Tigin, Tonyukuk; Orhon yazıtları ve 744.
4. tarih.3.4 Uygurlar ve öteki Türk toplulukları (5 ders): Uygur Kağanlığı ve Karabalgasun; Mani dini, 840, Kırgızlar, Koço; Avarlar, Bulgarlar, Macarlar; Hazarlar, Peçenekler, Kumanlar-Kıpçaklar; Türgişler, Karluklar (Talas 751), Oğuzlar.
5. tarih.3.5 İslamiyet öncesi Türk kültürü (5 ders): kut, töre, kurultay, ikili teşkilat; ordu ve ekonomi; inanç, yuğ, balbal; sanat ve alfabeler; destanlar ve semboller.

## Kaynaklar
- gemini: tarih_100 (TAR-010..020), ayt_tarih sözlüğü, ESP kırılmalar (satır 57, 60-61, 63-65), iki mitoloji atlası, iki etimoloji dosyası (Orhun pasajı, Alp Er Tunga sagusu), MEDYA soyağacı, TYT sosyal, mnemonik TAR_MNEM_09.
- kitap: Tekin (Orhon Yazıtları, TDK), Ergin, Ögel (3 eser), Kafesoğlu, Taşağıl (Gök-Türkler), Golden, Sinor (Cambridge), Maenchen-Helfen, Kurat, Mackerras, Rudenko, Emel Esin, Kaşgarlı (Atalay), Herodot (Ökmen), Anthony, Kuz'mina, MEB Tarih 9, Blockley (Menandros), İbn Fadlan (Şeşen), Sima Qian (Watson), Jordanes (Mierow), Şehnâme (Lugal).

## Kaynakta görülen hatalar (ders `not` alanlarına yazıldı)
- k13: onlu teşkilat «modern orduların temeli» abartılı; Asya Hun «MÖ 220» yaklaşık.
- k2/k11: Tonyukuk yazıtı için kesin «720» (yaklaşık 720'ler olmalı); «ilk Türkçe yazılı belge» inceltildi.
- Edebiyat indeksi: Yollug Tigin üç yazıtın da yazarı gibi gösterilmiş; Tonyukuk yazıtı onun değil.
- k3/k15: Maniheizmin et ve savaş «yasağı» seçilmişler içindir; «matbaa/hareketli harf», freskler Koço dönemine ait; «Hun/Göktürkte kalıcı mimari yok» abartılı.
- k1/k4: töre dört ilkesi Kafesoğlu'nun yorumu, yazıtta liste değil.
- k8/k9: kurdu «Asena» diye adlandırmak (Çin kaynağında Aşina soyun adı); Türeyiş'te «Uygur hakanı» (kaynakta Hun hükümdarı); Göç Destanı'nda «Yada taşı» / «Kutlu Dağ» çelişkisi; Manas uzunluğu derlemeye göre değişir; Oğuz Kağan = Mete eşleştirmesi görüştür; Erlik ve üç âlem 19. yy Altay derlemeleri.

## Emin olmadığım noktalar
- Margus Antlaşması yılı (434/435/439) ve Anatolius barışlarının yılları (443; 447/448).
- Bazı kitap künyelerinde yayınevi adı (ör. Ögel'in Kültür Bakanlığı baskıları, Kurat'ın Murat Kitabevi baskısı) baskıya göre farklı olabilir.
- Orhon yazıtlarından aktarılan cümleler Tekin çevirisinden ezberle, yazıt yüzü ve satır numarası verilmeden yazıldı; sahip kanıt işinde kaynaktan doğrulamalı.
- Yanran yazıtı (2017), Temim bin Bahr ve Mesudi'nin yedi yargıcı gibi ayrıntılar modelin bağlantı notu; ilgili kitaplarda doğrulanmalı.
- Esik ve Pazırık tarihleri araştırmalara göre değişiyor; yaklaşık verildi.

## denetle.py
- Yalnız asama-1, 2, 3 ve harita.json ile ayrı klasörde: «Temiz · 4 dosya, 3 aşama, 11 ünite, 42 ders, 204 alıştırma, 74 kaynak», çıkış 0.
- `alan/tarih` bütününde tek hata başka ajanın yarım dosyasından: «asama-5.json tarih.5 kapı: kapıda en az 3 soru olmalı». asama-3.json için hata yok.
