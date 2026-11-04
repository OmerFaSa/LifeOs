/* ÖĞREN çekmecesi — Konular · Anlatım · Sorular · Koç (Ders notları
   screens/learn.js'te, aynı çekmecede).

   Kullanıcı (2026-10-09): «konu öğrenmek başlığı altında sol tarafa bölüm
   aç; ders notları, örnek sorular, daha detaylı anlatım olsun, koçla da
   orada iletişim olsun; daha anlaşılır bir ekran olsun».

   Dört bölüm aynı konuya bakar (core/ogren.js söz 2); üstteki konu çubuğu
   konuyu değiştirir, ‹ › bir önceki ya da sonraki konuya geçer. Her
   bölümün tek işi var: Konular seçtirir, Anlatım okutur, Sorular
   çözdürür, Koç anlatır. Ölçüm ve kapanış Çalışma › Konu çalış'tadır;
   burada yalnız okunur.

   Yazım biçimi: STIL.md. */
window.LIFEOS.PARCA.yazilar({
  'ays.ogren.onceki-konu':'Önceki konu',
  'ays.ogren.kaldigin-yer':'Kaldığın yer',
  'ays.ogren.devam-et':'Devam et',
  'ays.ogren.konuyu-sec-anlatim-ornek-sor':'Konuyu seç; anlatım, örnek soru ve koç aynı konuya bakar',
  'ays.ogren.sinavda-nasil-sorulur':'Sınavda nasıl sorulur',
  'ays.ogren.bu-konunun-ayrintili-anlatim':'Bu konunun ayrıntılı anlatımı henüz yazılmadı. Aşağıda kısa özeti var; derin anlatım için «Konu anlatımı iste» ya da koça sor.',
  'ays.ogren.kartlara-cevir':'Kartlara çevir (',
  'ays.ogren.kartlara-cevir-2':'Kartlara çevir',
  'ays.ogren.yazdigin-kendiliginden-kayde':'Yazdığın kendiliğinden kaydedilir.',
  'ays.ogren.nota-ekle':'Nota ekle',
  'ays.ogren.henuz-not-yok':'Henüz not yok.',
  'ays.ogren.youtube-uygulamada-acilir':'YouTube · uygulamada açılır',
  'ays.ogren.bugunun-seti-bitti-2':'Bugünün seti bitti',
  'ays.ogren.sete-devam-et':'Sete devam et · ',
  'ays.ogren.bugunun-setini-coz':'Bugünün setini çöz',
  'ays.ogren.bam-bu-konu-icin-kaynakli':'BAM bu konu için kaynaklı yazar',
  'ays.ogren.konu-anlatimi-iste':'Konu anlatımı iste',
  'ays.ogren.youtube-baglantisi-ogrenme-d':'YouTube bağlantısı Öğrenme’de gömülü açılır',
  'ays.ogren.soru-metni-kopyalanmaz-soruy':'Soru metni kopyalanmaz: soruyu kitapçıktan çözersin, harfini burada girersin.',
  'ays.ogren.dogru-olculdu':'Doğru · ölçüldü',
  'ays.ogren.yanlis-olculdu':'Yanlış · ölçüldü',
  'ays.ogren.cevabin-girildi-anahtar-giri':'Cevabın girildi · anahtar girilince ölçülür',
  'ays.ogren.yanlis-defterine-eklendi-kok':'Yanlış defterine eklendi · kök nedenini orada yaz',
  'ays.ogren.king-e-iletildi':'King’e iletildi.',
  'ays.ogren.dogrulanmadi-kaynaksiz-model':'Doğrulanmadı: kaynaksız, modelin bilgisidir. ',
  'ays.ogren.karar-vermeden-once-bir-kayn':'Karar vermeden önce bir kaynağa bak.',
  'ays.ogren.dunlosky-2013':'Dunlosky 2013',
  'ays.ogren.bu-satirlarin-karti-zaten-va':'Bu satırların kartı zaten var',
  'ays.ogren.cozume-bakildi-dogru-cevap':'Çözüme bakıldı · doğru cevap ',
  'ays.ogren.yanlis-senin-cevabin':'Yanlış · senin cevabın ',
  'ays.ogren.ornek-sorular':'Örnek sorular',
  'ays.ogren.sinav-provasi-2':'Sınav provası · ',
  'ays.ogren.konular-karisik-gelir-her-so':'Konular karışık gelir; her sorunun ilk cevabı sayılır',
  'ays.ogren.provayi-simdi-bitir':'Provayı şimdi bitir',
  'ays.ogren.testi-simdi-bitir':'Testi şimdi bitir',
  'ays.ogren.bu-soru-icerikten-kaldirildi':'Bu soru içerikten kaldırıldı; boş sayılır.',
  'ays.ogren.test-sonucu':'Test sonucu',
  'ays.ogren.gercek-sinavin-sirasi-orani':'Gerçek sınavın sırası, oranı ve temposu; sonuç bitince',
  'ays.ogren.havuzda-2':'Havuzda ',
  'ays.ogren.prova-sonucu':'Prova sonucu',
  'ays.ogren.suren-bir-karma-test-var':'Süren bir karma test var; prova için önce onu bitir ya da vazgeç.',
  'ays.ogren.suren-bir-sinav-provasi-var':'Süren bir sınav provası var.',
  'ays.ogren.bu-derste-yanlisin-yok':'Bu derste yanlışın yok.',
  'ays.ogren.yanlisin-yok-konu-sorularind':'Yanlışın yok. Konu sorularında ya da karma testte yanlış çözdüğün, çözümüne baktığın sorular burada toplanır.',
  'ays.ogren.yeniden-coz':'Yeniden çöz',
  'ays.ogren.bugunun-paragraf-cipasi':'Bugünün paragraf çıpası: ',
  'ays.ogren.konular-karisik-sonuc-konu-k':'Konular karışık; sonuç konu konu',
  'ays.ogren.gercek-sinavin-temposu-sonuc':'Gerçek sınavın temposu; sonuç bitince',
  'ays.ogren.yanlis-cozduklerini-yeniden':'Yanlış çözdüklerini yeniden çöz',
  'ays.ogren.her-gun-birkac-paragraf-biti':'Her gün birkaç paragraf; bitince gün kaydına',
  'ays.ogren.deftere-ekle':'Deftere ekle',
  'ays.ogren.bu-konudaki-ornek-soru-cevap':'Bu konudaki örnek soru cevapların silinir; yeniden çözdüğünde yeni ilk cevabın sayılır.',
  'ays.ogren.bu-sorunun-cozumunu-anlamadi':'Bu sorunun çözümünü anlamadım; adım adım, başka bir yoldan anlat.',
  'ays.ogren.uygulamadaki-cevap-degismez-2':'Uygulamadaki cevap değişmez. Soru karma testten çıkar ve Yanlışlarım’ın altında ',
  'ays.ogren.bildirildi-soru-karma-testte':'Bildirildi · soru karma testten çıktı',
  'ays.ogren.bugunun-paragraf-sayisina':'Bugünün paragraf sayısına +',
  'ays.ogren.testten-vazgec':'Testten vazgeç',
  'ays.ogren.bu-test-silinir-gecmise-hicb':'Bu test silinir; geçmişe hiçbir şey yazılmaz.',
  'ays.ogren.ofis-ayarlarindan-ucretsiz-b':'Ofis ayarlarından ücretsiz bir sağlayıcı bağlarsan koç bu konunun içinde, anlamadığın yeri anlatır. ',
  'ays.ogren.anlatim-ve-ornek-sorular-mod':'Anlatım ve örnek sorular modelsiz de çalışır.',
  'ays.ogren.neyi-anlamadin':'Neyi anlamadın?',
  'ays.ogren.konunun-kocu':'Konunun koçu',
  'ays.ogren.karta-cevrildi-modelin-anlat':'Karta çevrildi · modelin anlatımı, yanlışsa düzelt',
  'ays.ogren.kart-yapilamadi':'Kart yapılamadı',
});


window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:30, group:'Git', label:'Öğren — konu anlatımı, örnek soru, koç', icon:'book', route:'ogren', run(){ R.App.go('ogren'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:40, group:'Git', label:'Günlük paragraf — bugünün seti', icon:'book', route:'sorular', run(){ R.S.ui.ogrenKip = 'paragraf'; R.S.ui.ogrTekrar = null; R.App.go('sorular'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:50, group:'Git', label:'Karma test — konular karışık', icon:'zap', route:'sorular', run(){ R.S.ui.ogrenKip = 'karma'; R.S.ui.ogrTekrar = null; R.App.go('sorular'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:60, group:'Git', label:'Yanlışlarım — yeniden çöz', icon:'list', route:'sorular', run(){ R.S.ui.ogrenKip = 'yanlis'; R.S.ui.ogrTekrar = null; R.App.go('sorular'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:180, group:'Git', label:'Koç — verine bakarak yanıtlar', icon:'zap', route:'coach', run(){ R.App.go('coach'); } });
window.LIFEOS.PARCA.yazilar({
  'ays.ogren.ders':'Ders',
  'ays.ogren.konu':'Konu',
  'ays.ogren.karma-teste-don':'Karma teste dön',
  'ays.ogren.yanlislarim':'Yanlışlarım · ',
  'ays.ogren.dersler':'Dersler',
  'ays.ogren.hepsi':'Hepsi',
  'ays.ogren.okunmadi':'Okunmadı',
  'ays.ogren.soru-bekliyor':'Soru bekliyor',
  'ays.ogren.yanlisi-olan':'Yanlışı olan',
  'ays.ogren.tamam':'Tamam',
  'ays.ogren.bu-suzgecte-konu-yok':'Bu süzgeçte konu yok.',
  'ays.ogren.notlarim':'Notlarım',
  'ays.ogren.konular':'Konular',
  'ays.ogren.ornek':'Örnek',
  'ays.ogren.cozum':'Çözüm',
  'ays.ogren.bu-konunun-sonunda':'Bu konunun sonunda',
  'ays.ogren.once-bunlari-bil':'Önce bunları bil',
  'ays.ogren.cozumlu-ornekler':'Çözümlü örnekler',
  'ays.ogren.once-kagitta-kendin-dene-tak':'Önce kâğıtta kendin dene; takılınca çözümü aç.',
  'ays.ogren.cozumu-goster':'Çözümü göster',
  'ays.ogren.elle-yazildi-dogrulanmadi':'elle yazıldı · doğrulanmadı',
  'ays.ogren.neden-calisir':'Neden çalışır?',
  'ays.ogren.karsi-ornek':'Karşı örnek:',
  'ays.ogren.sik-dusulen-tuzak':'Sık düşülen tuzak:',
  'ays.ogren.ayirt-edici-soru':'Ayırt edici soru:',
  'ays.ogren.kendin-dene':'Kendin dene:',
  'ays.ogren.i-pucu':'İpucu:',
  'ays.ogren.hizli-kontrol-sorulari':'Hızlı kontrol soruları (',
  'ays.ogren.sinir':'Sınır:',
  'ays.ogren.ac':'Aç ↗',
  'ays.ogren.kaynaklar':'Kaynaklar',
  'ays.ogren.baglantilar-dersin-tamami-ic':'Bağlantılar dersin tamamı içindir, bu konuya özel değildir; elle doğrulanmadı.',
  'ays.ogren.resmi-meb':'Resmî (MEB)',
  'ays.ogren.ek-kaynak-resmi-degil':'Ek kaynak · resmî değil, İngilizce',
  'ays.ogren.bu-konuda':'Bu konuda',
  'ays.ogren.akilda-kalsin':'Akılda kalsın',
  'ays.ogren.ornek-soru':'örnek soru',
  'ays.ogren.ornek-2':'Örnek:',
  'ays.ogren.okundu':'Okundu',
  'ays.ogren.i-sareti-kaldir':'İşareti kaldır',
  'ays.ogren.okudum':'Okudum',
  'ays.ogren.sorulara-gec':'Sorulara geç',
  'ays.ogren.stratejiler':'Stratejiler',
  'ays.ogren.bilimsel-ogrenme-yontemleri':'Bilimsel öğrenme yöntemleri',
  'ays.ogren.koca-sor':'Koça sor',
  'ays.ogren.elle-yazildi-dogrulanmadi-2':'· elle yazıldı · doğrulanmadı',
  'ays.ogren.ders-kitabinin-yerini-tutmaz':'Ders kitabının yerini tutmaz; kritik tanım ve formülü kitabınla karşılaştır.',
  'ays.ogren.notum':'Notum',
  'ays.ogren.on-arka-bicimindeki-satirlar':'«ön :: arka» biçimindeki satırlar tekrar kartı olur',
  'ays.ogren.nota-eklendi':'Nota eklendi',
  'ays.ogren.videolar-ve-notlarin':'Videolar ve notların',
  'ays.ogren.video-ekle':'Video ekle',
  'ays.ogren.ders-notu-ekle':'Ders notu ekle',
  'ays.ogren.ac-2':'Aç',
  'ays.ogren.tarayicida':'Tarayıcıda',
  'ays.ogren.bu-konuya-bagli-video-yok':'Bu konuya bağlı video yok. «Video ekle» ile bir YouTube ya da başka bir ders bağlantısı koy; Öğrenme’de gömülü açılır, izlerken zaman damgalı not alırsın, notlar burada anlatımın yanında durur.',
  'ays.ogren.cevaplanmadi':'cevaplanmadı',
  'ays.ogren.cikmis-sorular':'Çıkmış sorular',
  'ays.ogren.soru-bagla':'Soru bağla',
  'ays.ogren.kitapcik':'Kitapçık',
  'ays.ogren.yanlis-defterine-ekle':'Yanlış defterine ekle',
  'ays.ogren.anahtari-gir':'Anahtarı gir',
  'ays.ogren.kaldir':'Kaldır',
  'ays.ogren.bu-konudan-cikmis-bir-osym':'Bu konudan çıkmış bir ÖSYM sorusunu bağla: sınav, yıl, soru numarası ve resmî kitapçığın bağlantısı. Soruyu kitapçıktan çöz, harfini burada gir; cevap anahtarını girdiysen doğru ya da yanlış diye ölçülür.',
  'ays.ogren.soru-metinleri-osym-ye-aitti':'Soru metinleri ÖSYM’ye aittir ve uygulamaya kopyalanmaz; resmî kitapçıklar ve cevap anahtarları ÖSYM’nin sitesinde yayımlanır.',
  'ays.ogren.gunluk-paragraf':'Günlük paragraf',
  'ays.ogren.bu-konudan-havuzda':'bu konudan havuzda ',
  'ays.ogren.paragraf-her-gun-calisilan-b':'Paragraf her gün çalışılan bir beceridir. Günlük paragraf her gün birkaç soru getirir; bitince çözdüğün sayı Bugün’deki paragraf çıpasına yazılabilir.',
  'ays.ogren.konu-anlatimi':'Konu anlatımı',
  'ays.ogren.kavram-sozlugu':'Kavram sözlüğü',
  'ays.ogren.calisma-kagidi':'Çalışma kâğıdı',
  'ays.ogren.daha-derin':'Daha derin',
  'ays.ogren.anlatim':'Anlatım',
  'ays.ogren.konu-yok':'Konu yok.',
  'ays.ogren.okundu-2':'Okundu · ',
  'ays.ogren.okudum-isareti-kaldirildi':'«Okudum» işareti kaldırıldı',
  'ays.ogren.konuya-video-ekle':'Konuya video ekle',
  'ays.ogren.video-baglantisi':'Video bağlantısı',
  'ays.ogren.baslik-istege-bagli':'Başlık (isteğe bağlı)',
  'ays.ogren.or':'ör. ',
  'ays.ogren.vazgec':'Vazgeç',
  'ays.ogren.ekle':'Ekle',
  'ays.ogren.baglanti-http-ya-da-https':'Bağlantı http:// ya da https:// ile başlamalı',
  'ays.ogren.video-konuya-baglandi-ogrenm':'Video konuya bağlandı · Öğrenme’de de görünür',
  'ays.ogren.cikmis-soru-bagla':'Çıkmış soru bağla',
  'ays.ogren.sinav':'Sınav',
  'ays.ogren.yil':'Yıl',
  'ays.ogren.soru-no':'Soru no',
  'ays.ogren.test-istege-bagli':'Test (isteğe bağlı)',
  'ays.ogren.or-temel-matematik':'ör. Temel Matematik',
  'ays.ogren.resmi-kitapcik-baglantisi-is':'Resmî kitapçık bağlantısı (isteğe bağlı)',
  'ays.ogren.cevap-anahtarindaki-harf-bil':'Cevap anahtarındaki harf (biliyorsan)',
  'ays.ogren.bilmiyorum':'— bilmiyorum —',
  'ays.ogren.not-istege-bagli':'Not (isteğe bağlı)',
  'ays.ogren.or-sekilli-soru-ikinci-oturu':'ör. şekilli soru, ikinci oturum',
  'ays.ogren.bagla':'Bağla',
  'ays.ogren.baglandi':'Bağlandı · ',
  'ays.ogren.cevap-anahtari':'Cevap anahtarı',
  'ays.ogren.yayimlanmis-cevap-anahtarind':'Yayımlanmış cevap anahtarındaki harf:',
  'ays.ogren.ogrenme-stratejileri':'Öğrenme Stratejileri',
  'ays.ogren.kanita-dayali-calisma-ve-pek':'Kanıta dayalı çalışma ve pekiştirme yöntemleri (Dunlosky 2013 / IES 2007)',
  'ays.ogren.bu-yontemler-zihinsel-kavray':'Bu yöntemler zihinsel kavrayışı derinleştirmek ve öğrenmeyi kalıcı kılmak için bilimsel rehberlerden derlenmiştir:',
  'ays.ogren.kapat':'Kapat',
  'ays.ogren.sure-doldu-prova-bitti':'Süre doldu; prova bitti.',
  'ays.ogren.dogru-cevap':'doğru cevap',
  'ays.ogren.isaretledigin':'işaretlediğin',
  'ays.ogren.senin-cevabin':'senin cevabın',
  'ays.ogren.karala':'Karala',
  'ays.ogren.akilli-taktik':'Akıllı Taktik',
  'ays.ogren.i-pucu-2':'İpucu',
  'ays.ogren.taktik':'Taktik',
  'ays.ogren.cevaplamadan-cozumu-gor':'Cevaplamadan çözümü gör',
  'ays.ogren.i-saretlendi':'İşaretlendi:',
  'ays.ogren.dogru-cevap-ve-cozum':'· doğru cevap ve çözüm prova bitince',
  'ays.ogren.karta-cevir':'Karta çevir',
  'ays.ogren.bildirimi-geri-al':'Bildirimi geri al',
  'ays.ogren.hata-bildir':'Hata bildir',
  'ays.ogren.bu-konunun-ornek-sorulari-he':'Bu konunun örnek soruları henüz yazılmadı.',
  'ays.ogren.koc-bir-soru-sorsun':'Koç bir soru sorsun',
  'ays.ogren.bastan-coz':'Baştan çöz',
  'ays.ogren.soru':'Soru ',
  'ays.ogren.soru-notu':'Soru notu · ',
  'ays.ogren.onceki':'Önceki',
  'ays.ogren.sonraki-soru':'Sonraki soru',
  'ays.ogren.sonraki-konu':'Sonraki konu',
  'ays.ogren.sorular-elle-yazildi-dogrula':'Sorular elle yazıldı, doğrulanmadı. İlk cevabın bu konunun kaydına yazılır; hiçbir plan ya da kapanış ona bakmaz — kapanış Çalışma › Konu kapanışı’ndaki testle ölçülür.',
  'ays.ogren.butun-dersler':'Bütün dersler',
  'ays.ogren.okuduklarim':'Okuduklarım · ',
  'ays.ogren.hepsi-2':'Hepsi · ',
  'ays.ogren.seviye':'Seviye',
  'ays.ogren.sinav-tarzi':'Sınav tarzı · ',
  'ays.ogren.soru-sayisi':'Soru sayısı',
  'ays.ogren.testi-baslat':'Testi başlat',
  'ays.ogren.seceneklerdeki-sayi-havuzdak':'Seçeneklerdeki sayı havuzdaki soru sayısıdır. Sonuç yalnız burada ölçüm olarak durur: plan, kapanış ve konunun örnek soru kaydı ona bakmaz. Yarım kalan test, uygulamayı kapatsan da kaldığın sorudan sürer.',
  'ays.ogren.gecmis-testler':'Geçmiş testler',
  'ays.ogren.dogru':'doğru',
  'ays.ogren.tempo-cevaplanan-gecen':'Tempo · cevaplanan / geçen süre',
  'ays.ogren.kalan':'kalan ·',
  'ays.ogren.testi-bitir':'Testi bitir',
  'ays.ogren.yeni-test':'Yeni test',
  'ays.ogren.dogru-2':'Doğru',
  'ays.ogren.yanlis':'Yanlış',
  'ays.ogren.bos':'Boş',
  'ays.ogren.cozume-bakildi':'Çözüme bakıldı',
  'ays.ogren.ortalama':'Ortalama ',
  'ays.ogren.konu-konu-yanlisi-olan':'Konu konu · yanlışı olan önce',
  'ays.ogren.yanlislari-yeniden-coz':'Yanlışları yeniden çöz',
  'ays.ogren.bu-sonuc-bir-olcumdur-plan':'Bu sonuç bir ölçümdür; plan ve kapanış ona bakmaz. Boş bırakılan soru yanlış sayılmaz.',
  'ays.ogren.provayi-baslat':'Provayı başlat',
  'ays.ogren.sure-gercek-sinavin-soru-bas':'Süre gerçek sınavın soru başına süresiyle ölçeklenir (',
  'ays.ogren.dk':'dk /',
  'ays.ogren.soru-osym-sinavda-dogru-yanl':'soru, ÖSYM). Sınavda doğru/yanlış ve çözüm görünmez; ilk işaretin kilitlenir, süre dolunca prova biter. Net ÖSYM kuralıyla hesaplanır: doğru − yanlış / 4. Sonuç bir ölçümdür; plan ve kapanış ona bakmaz.',
  'ays.ogren.net':'net ',
  'ays.ogren.yeni-prova':'Yeni prova',
  'ays.ogren.net-hesaplandi':'Net · hesaplandı',
  'ays.ogren.dk-kullanildi':'dk kullanıldı',
  'ays.ogren.test-test-cubuk-dogru':'Test test · çubuk doğru oranı',
  'ays.ogren.net-dogru-yanlis':'Net = doğru − yanlış / 4 (ÖSYM). Boş net düşürmez.',
  'ays.ogren.gecmis-provalar':'Geçmiş provalar',
  'ays.ogren.provaya-don':'Provaya dön',
  'ays.ogren.yanlislarim-2':'Yanlışlarım',
  'ays.ogren.sirayla-coz':'Sırayla çöz',
  'ays.ogren.bir-soru-yeniden-dogru-cozul':'Bir soru yeniden doğru çözülünce listeden düşer; ilk ölçüm silinmez.',
  'ays.ogren.listeye-don':'Listeye dön',
  'ays.ogren.dogru-cozdun-yanlislarim-dan':'Doğru çözdün: Yanlışlarım’dan düştü.',
  'ays.ogren.siradaki-yanlis':'Sıradaki yanlış',
  'ays.ogren.bildirdigin-hatalar':'Bildirdiğin hatalar',
  'ays.ogren.listeyi-kopyala':'Listeyi kopyala',
  'ays.ogren.uygulamadaki-cevap-degismez':'Uygulamadaki cevap değişmez; soru düzeltilip yenilenince bildirimin kendiliğinden kapanır.',
  'ays.ogren.paragraf-havuzu-henuz-bos':'Paragraf havuzu henüz boş.',
  'ays.ogren.gunde':'Günde',
  'ays.ogren.paragraf':'Paragraf ',
  'ays.ogren.sonraki-paragraf':'Sonraki paragraf',
  'ays.ogren.bugunun-seti-bitti':'Bugünün seti bitti:',
  'ays.ogren.olculdu':'· ölçüldü',
  'ays.ogren.geri-almak-istersen-onaylar':'Geri almak istersen Onaylar’dan geri alabilirsin.',
  'ays.ogren.gunun-paragraf-sayisina-ekle':'Günün paragraf sayısına ekle (+',
  'ays.ogren.bugun-deki-paragraf-cipasina':'Bugün’deki paragraf çıpasına yazılır; Onaylar’dan geri alınabilir. Çözümüne baktığın sorular sayılmaz.',
  'ays.ogren.butun-sorularin-cozumune-bak':'Bütün soruların çözümüne bakıldı; gün kaydına yazılacak çözülmüş soru yok.',
  'ays.ogren.havuzda':'Havuzda',
  'ays.ogren.paragraf-sorusu-var':'paragraf sorusu var;',
  'ays.ogren.tanesi-henuz-sana-gelmedi-se':'tanesi henüz sana gelmedi. Set her gün kodla seçilir: önce iki gün önce yanlış yaptıkların, sonra yeniler. Sorular elle yazıldı, doğrulanmadı; hiçbir plan ya da kapanış bu cevaplara bakmaz.',
  'ays.ogren.soru-kipi':'Soru kipi',
  'ays.ogren.bu-konu':'Bu konu',
  'ays.ogren.karma-test':'Karma test',
  'ays.ogren.sinav-provasi':'Sınav provası',
  'ays.ogren.sorular':'Sorular',
  'ays.ogren.karalaman-deftere-eklendi-no':'Karalaman deftere eklendi · Notlarım’da',
  'ays.ogren.karta-cevrildi-tekrar-da-sor':'Karta çevrildi · Tekrar’da sorar',
  'ays.ogren.bu-soruda-hata-var':'Bu soruda hata var',
  'ays.ogren.ne-yanlis-istege-bagli':'Ne yanlış? (isteğe bağlı)',
  'ays.ogren.or-b-de-dogru-cozumde':'ör. B de doğru; çözümde 2. adım hatalı; şekil soruyla uyuşmuyor',
  'ays.ogren.bildir':'Bildir',
  'ays.ogren.bildirim-geri-alindi':'Bildirim geri alındı',
  'ays.ogren.liste-kopyalandi':'Liste kopyalandı',
  'ays.ogren.kopyalanamadi-metni-secip-ko':'Kopyalanamadı; metni seçip kopyala',
  'ays.ogren.havuz-yetmedi':'Havuz yetmedi: ',
  'ays.ogren.daha-basit-anlat':'Daha basit anlat',
  'ays.ogren.bu-konuyu-en-bastan-cok':'Bu konuyu en baştan, çok basit bir dille ve günlük hayattan bir örnekle anlat.',
  'ays.ogren.bir-ornek-daha':'Bir örnek daha',
  'ays.ogren.bu-konudan-osym-tarzinda-bir':'Bu konudan ÖSYM tarzında bir örnek soru yaz ve adım adım çöz.',
  'ays.ogren.beni-sina':'Beni sına',
  'ays.ogren.bana-bu-konudan-tek-bir':'Bana bu konudan tek bir kısa soru sor. Cevabı hemen söyleme; ben cevaplayınca söyle.',
  'ays.ogren.sik-yapilan-hatalar':'Sık yapılan hatalar',
  'ays.ogren.bu-konuda-en-sik-yapilan':'Bu konuda en sık yapılan hataları ve onlardan nasıl kaçınacağımı söyle.',
  'ays.ogren.formulleri-ozetle':'Formülleri özetle',
  'ays.ogren.bu-konunun-kurallarini-ve-fo':'Bu konunun kurallarını ve formüllerini madde madde, kısa özetle.',
  'ays.ogren.koc':'Koç',
  'ays.ogren.model-bagli-degil':'Model bağlı değil.',
  'ays.ogren.ofis-ayarlarini-ac':'Ofis ayarlarını aç',
  'ays.ogren.anlatima-don':'Anlatıma dön',
  'ays.ogren.yeni-konusma':'Yeni konuşma',
  'ays.ogren.anlamadigin-yeri-yaz-ya-da':'Anlamadığın yeri yaz ya da aşağıdan birini seç. Koç yalnız bu konuyu, uygulamadaki özetle aynı dilde anlatır.',
  'ays.ogren.dogrulanmadi-modelin-anlatim':'doğrulanmadı · modelin anlatımı',
  'ays.ogren.baglam':'Bağlam:',
  'ays.ogren.kaldir-2':'kaldır',
  'ays.ogren.anlamadigin-yer':'Anlamadığın yer',
  'ays.ogren.anlamadigin-yeri-yaz-ya-da-2':'Anlamadığın yeri yaz ya da anlatımdan yapıştır…',
  'ays.ogren.cevap-kaynaksizdir-ve-kayded':'Cevap kaynaksızdır ve kaydedilmez; konuşma bu açılışta durur. Bir tanım ya da formül kritikse kitabınla karşılaştır.',
  'ays.ogren.neyi-anlamadigini-bir-cumley':'Neyi anlamadığını bir cümleyle yaz.',
});
/* ÖĞREN (kullanıcı, 2026-10-09: «konu öğrenmek başlığı altında sol
tarafa bölüm aç»): konuyu uygulamanın içinde teker teker öğrenmek.
Dört bölüm aynı konuya bakar (core/ogren.js); Ders notları
Çalışma'dan buraya taşındı — aynı şey iki yerde durmaz. */
window.LIFEOS.PARCA.sayfa({ id:'ogren', modul:'ays', cekmece:'ogren', ad:'Konular', ikon:'list', sira:10 });
window.LIFEOS.PARCA.sayfa({ id:'anlatim', modul:'ays', cekmece:'ogren', ad:'Anlatım', ikon:'book', sira:20 });
window.LIFEOS.PARCA.sayfa({ id:'sorular', modul:'ays', cekmece:'ogren', ad:'Sorular', ikon:'check', sira:30 });
window.LIFEOS.PARCA.sayfa({ id:'koc', modul:'ays', cekmece:'ogren', ad:'Koç', ikon:'zap', sira:40 });

(function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls } = R.h;
  const K = R.C;
  const O = () => R.Ogren;

  /* ---------- ortak ---------- */

  /* Metindeki küçük işaretler (**kalın**, x^{2}, H_{2}O; iç içe olabilir)
     tek ayrıştırıcıdan geçer: core/ogren.js metinHtml. */
  const fmt = s => raw(O().metinHtml(s));
  /* Şekil ve tablo (core/sekil.js): tarif yoksa boş. */
  const sekilHtml = x => x && (x.sekil || x.tablo) && R.Sekil ? raw(R.Sekil.svg(x.sekil) + R.Sekil.tablo(x.tablo)) : '';
  const dizi = x => x == null ? [] : Array.isArray(x) ? x : [x];
  const kisaAd = s => s.name;

  /* Konu çubuğu: ‹ ders · konu › — dört bölümde aynı. Uçta ok yerine boşluk. */
  function konuCubugu(x){
    const { subject, topic } = x;
    const once = O().komsu(subject.id, topic.id, -1), sonra = O().komsu(subject.id, topic.id, 1);
    const ok = (k, yon, ad) => k
      ? K.IconButton({ icon:yon < 0 ? 'left' : 'right', plain:true, act:'ogren-komsu', data:{ 'data-yon':String(yon) },
          aria:ad + ': ' + k.topic.name, title:ad + ': ' + k.topic.name })
      : html`<span class="ogr-cubuk__bos" aria-hidden="true"></span>`;
    return html`<div class="ogr-cubuk" role="group" aria-label="Konu seçimi">
      ${ok(once, -1, yz('ays.ogren.onceki-konu'))}
      <span class="ogr-cubuk__secim">
        ${K.Select({ id:'ogren-ders', options:R.SUBJECTS.map(s => ({ value:s.id, label:kisaAd(s) })),
          value:subject.id, change:'ogren-ders', aria:yz('ays.ogren.ders') })}
        ${K.Select({ id:'ogren-konu', options:subject.topics.map(t => ({ value:t.id, label:t.order + '. ' + t.name })),
          value:topic.id, change:'ogren-konu', aria:yz('ays.ogren.konu') })}
      </span>
      ${ok(sonra, 1, yz('ays.ogren.sonraki-konu'))}
    </div>`;
  }

  /* Seçili konuyu bölüm açılırken kesinleştirir (son açılan yazılır). */
  async function hazirla(){
    const x = O().secili();
    if(x.topic) await O().sec(x.subject.id, x.topic.id);
    return x;
  }

  const ortakChange = {
    async 'ogren-ders'(el){
      const s = R.SUBJECTS.find(x => x.id === el.value);
      if(!s) return;
      const st = O().sonAcilan();
      const t = st && st.subject.id === s.id ? st.topic : s.topics[0];
      await O().sec(s.id, t.id);
      R.App.render();
    },
    async 'ogren-konu'(el){
      await O().sec(S.ui.ogrenDers, el.value);
      R.App.render();
    },
  };
  const ortakHandle = {
    async 'ogren-komsu'(el){
      const x = O().secili();
      const k = x.topic && O().komsu(x.subject.id, x.topic.id, Number(el.dataset.yon) || 1);
      if(!k) return;
      await O().sec(k.subject.id, k.topic.id);
      window.scrollTo(0, 0);
      R.App.render();
    },
    /* Sorular'ın kipi (Bu konu · Karma test · Yanlışlarım); Öğren'in her
       bölümünden açılabilir. */
    async 'sorular-kip'(el){
      S.ui.ogrenKip = el.dataset.tab || 'konu';
      if(S.ui.ogrenKip !== 'yanlis') S.ui.ogrTekrar = null;
      if(S.route !== 'sorular'){ R.App.go('sorular'); return; }
      window.scrollTo(0, 0);
      R.App.render();
    },
  };

  /* ================================================================
     KONULAR — hangi konudasın, sırada ne var; dersler ve konu listesi.
     ================================================================ */

  /* Konu konu açık yanlış sayısı (core/ogrentest.js söz 5). */
  function acikYanlislar(){
    const say = {};
    if(R.OgrenTest) R.OgrenTest.yanlislar().forEach(y => { say[y.topic.id] = (say[y.topic.id] || 0) + 1; });
    return say;
  }
  const tamamMi = d => !!(d.okundu && d.skor.toplam && d.skor.cevaplanan === d.skor.toplam);

  function devamKarti(yanlisSay){
    const son = O().sonAcilan();
    const x = son || O().secili();
    if(!x.topic) return null;
    const s = O().sirada(x.subject.id, x.topic.id);
    const hedef = s && s.sonraki ? s.sonraki : x;
    const a = R.OgrenTest && R.OgrenTest.aktif();
    const y = Object.keys(yanlisSay).reduce((t, k) => t + yanlisSay[k], 0);
    return html`<div class="ogr-devam">${K.NextUp({ icon:'book', label:son ? yz('ays.ogren.kaldigin-yer') : 'Başla',
      title:x.topic.name, why:x.subject.name + (s ? ' · sırada: ' + s.ad.toLocaleLowerCase('tr-TR') : ' · bütün adımlar tamam'),
      action:K.Button({ label:son ? yz('ays.ogren.devam-et') : 'Başla', tone:'primary', size:'sm', act:'ogren-git',
        data:{ 'data-route':s ? s.route : 'anlatim', 'data-subject':hedef.subject.id, 'data-topic':hedef.topic.id } }) })}
      ${when(a || y, () => html`<div class="row wrap gap-6 mt-10">
        ${/* Sade (2026-10-16): «Günlük paragraf» ve «Karma test» düğmeleri
             Sorular sekmesinin içindekileri tekrar ediyordu; burada yalnız
             DURUM kalır: süren bir karma test ve açık yanlışlar. */ ''}
        ${when(a, () => K.Button({ label:yz('ays.ogren.karma-teste-don'), icon:'zap', size:'sm', tone:'ghost', act:'sorular-kip', data:{ 'data-tab':'karma' } }))}
        ${when(y, () => K.Button({ label:yz('ays.ogren.yanlislarim') + y, icon:'list', size:'sm', tone:'ghost', act:'sorular-kip', data:{ 'data-tab':'yanlis' } }))}
      </div>`)}</div>`;
  }

  /* Sekiz ders yan yana: kaç konu okundu, örnek soruların kaçı doğru.
     Ders seçici de budur: dokunulan dersin konuları aşağıda listelenir. */
  function derslerKarti(secili){
    const l = R.SUBJECTS.map(s => ({ s, oz:O().dersOzeti(s.id) }));
    const top = l.reduce((a, y) => ({ konu:a.konu + y.oz.konu, okunan:a.okunan + y.oz.okunan, soru:a.soru + y.oz.soru, dogru:a.dogru + y.oz.dogru }),
      { konu:0, okunan:0, soru:0, dogru:0 });
    return K.Card({ title:yz('ays.ogren.dersler'), wide:true,
      sub:top.okunan + ' / ' + top.konu + ' konu okundu' + (top.soru ? ' · ' + top.dogru + ' / ' + top.soru + ' örnek soru doğru' : ''),
      body:html`<div class="ogr-dersler" role="group" aria-label="Ders seç">${map(l, y => html`<button type="button"
          class="${cls('ogr-ders', y.s.id === secili && 'is-on')}" data-act="ogren-liste-sec" data-subject="${y.s.id}"
          aria-pressed="${y.s.id === secili ? 'true' : 'false'}">
        <span class="small strong ogr-ders__ad">${kisaAd(y.s)}</span>
        ${K.Bar({ value:y.oz.konu ? y.oz.okunan * 100 / y.oz.konu : 0 })}
        <span class="tiny dim">${y.oz.okunan} / ${y.oz.konu} okundu${y.oz.soru ? ' · ' + y.oz.dogru + ' / ' + y.oz.soru + ' doğru' : ''}</span>
      </button>`)}</div>` });
  }

  /* Konu süzgeci: kural kodda, adı ekranda. «Yanlışı olan» = konunun
     Yanlışlarım'da en az bir sorusu var (son denemesi doğru değil). */
  const SUZGEC = [
    { id:'hepsi', ad:yz('ays.ogren.hepsi'), f:() => true },
    { id:'okunmadi', ad:yz('ays.ogren.okunmadi'), f:d => !d.okundu },
    { id:'soru', ad:yz('ays.ogren.soru-bekliyor'), f:d => d.okundu && d.skor.cevaplanan < d.skor.toplam },
    { id:'yanlis', ad:yz('ays.ogren.yanlisi-olan'), f:(d, y) => y > 0 },
    { id:'tamam', ad:yz('ays.ogren.tamam'), f:d => tamamMi(d) },
  ];

  function konuSatiri(subject, t, d, yanlis){
    const parca = [];
    if(d.okundu) parca.push('okundu');
    /* Sade liste (2026-10-16): başlanmamış konunun altında her satırda
       aynı «10 örnek soru» tekrar ediyordu; yalnız durum yazılır. */
    if(d.skor.cevaplanan) parca.push(d.skor.dogru + '/' + d.skor.toplam + ' soru doğru');
    if(yanlis) parca.push(yanlis + ' yanlış açık');
    if(!d.anlatim) parca.push('anlatım yazılıyor');
    const tamam = tamamMi(d);
    return html`<button class="${cls('listitem listitem--tap ogr-konu', tamam && 'is-tamam')}" data-act="ogren-git"
        data-route="anlatim" data-subject="${subject.id}" data-topic="${t.id}">
      <span class="ogr-konu__no num" aria-hidden="true">${tamam ? raw(UI.icon('check')) : t.order}</span>
      <span class="grow minw0"><span class="small strong ogr-konu__ad">${t.name}</span>
        ${when(parca.length, () => html`<span class="tiny dim">${parca.join(' · ')}</span>`)}</span>
      <span class="ogr-konu__ok" aria-hidden="true">${raw(UI.icon('right'))}</span>
    </button>`;
  }

  function konularKarti(subject, yanlisSay){
    const oz = O().dersOzeti(subject.id);
    const sz = SUZGEC.find(x => x.id === S.ui.ogrenSuzgec) || SUZGEC[0];
    const satirlar = subject.topics.map(t => ({ t, d:O().durum(subject.id, t.id), y:yanlisSay[t.id] || 0 }));
    const gruplar = [];
    satirlar.filter(r => sz.f(r.d, r.y)).forEach(r => {
      const k = r.t.group || '—';
      let g = gruplar.find(y => y.ad === k);
      if(!g){ g = { ad:k, l:[] }; gruplar.push(g); }
      g.l.push(r);
    });
    return K.Card({ title:subject.name, wide:true,
      sub:oz.konu + ' konu · ' + oz.okunan + ' okundu' + (oz.soru ? ' · ' + oz.dogru + '/' + oz.soru + ' örnek soru doğru' : ''),
      /* Sade (2026-10-16): sayısı 0 olan süzgeç çizilmez («Tamam · 0»,
         «Yanlışı olan · 0» beş çipi gürültüye çeviriyordu); Hepsi ve seçili
         süzgeç her zaman durur. */
      body:html`<div class="row wrap gap-6 mb-10" role="group" aria-label="Konu süzgeci">${map(SUZGEC
          .map(x => ({ x, n:satirlar.filter(r => x.f(r.d, r.y)).length }))
          .filter(o => o.n > 0 || o.x.id === 'hepsi' || o.x.id === sz.id), o =>
          K.Chip({ label:o.x.ad + ' · ' + o.n, act:'ogren-suzgec', on:o.x.id === sz.id,
            data:{ 'data-f':o.x.id, 'aria-pressed':o.x.id === sz.id ? 'true' : 'false' } }))}</div>
        ${gruplar.length ? html`<div class="stack-sm" data-raf-tam>${map(gruplar, g => html`<div class="ogr-grup">
          ${when(gruplar.length > 1, () => html`<div class="ogr-grup__ad tiny dim">${g.ad}</div>`)}
          <div class="list list--sik">${map(g.l, r => konuSatiri(subject, r.t, r.d, r.y))}</div>
        </div>`)}</div>`
        : html`<p class="small muted">${yz('ays.ogren.bu-suzgecte-konu-yok')}</p>`}` });
  }

  /* NOTLARIM (core/konunotu.js): notu olan konular tek yerde; dokununca
     konunun Anlatım'ı (Notum kutusu orada). Not yoksa kart çizilmez. */
  function notlarimKarti(){
    const l = R.KonuNotu ? R.KonuNotu.hepsi() : [];
    if(!l.length) return '';
    const kisalt = s => { const t = s.replace(/\s+/g, ' '); return t.length > 120 ? t.slice(0, 117) + '…' : t; };
    return K.Card({ title:yz('ays.ogren.notlarim'), sub:U.plural(l.length, 'konuda not', 'konuda not') + ' · Anlatım’daki «Notum»dan',
      body:html`<div class="stack-xs">${map(l, x => html`<button type="button" class="listitem listitem--tap" data-act="ogren-git"
          data-route="anlatim" data-subject="${x.subject.id}" data-topic="${x.topic.id}">
          <span class="grow minw0"><b class="small">${x.topic.name}</b> <span class="tiny dim">· ${x.subject.name}${x.kart ? ' · ' + x.kart + ' kart satırı' : ''}</span>
          <span class="small dim block">${kisalt(x.not)}</span></span></button>`)}</div>` });
  }

  LIFEOS.PARCA.blok({ id:'ogren.devamkarti', sayfa:'ogren', yer:'ana', sira:10, ad:'Kaldığın yer', ciz({ x, sid, subject, y }){ return devamKarti(y); } });
LIFEOS.PARCA.blok({ id:'ogren.notlarimkarti', sayfa:'ogren', yer:'ana', sira:20, ad:'Notlarım', ciz({ x, sid, subject, y }){ return notlarimKarti(); } });
LIFEOS.PARCA.blok({ id:'ogren.derslerkarti', sayfa:'ogren', yer:'ana', sira:30, ad:'Dersler', ciz({ x, sid, subject, y }){ return derslerKarti(subject.id); } });
LIFEOS.PARCA.blok({ id:'ogren.konularkarti', sayfa:'ogren', yer:'ana', sira:40, ad:'Konular', ciz({ x, sid, subject, y }){ return konularKarti(subject, y); } });
  R.Screens.ogren = {
    id:'ogren',
    title:yz('ays.ogren.konular'),
    subtitle(){ return yz('ays.ogren.konuyu-sec-anlatim-ornek-sor'); },
    actions(){ return ''; },
    async render(){
      const x = O().secili();
      const sid = S.ui.ogrenListe || (x.subject ? x.subject.id : R.SUBJECTS[0].id);
      const subject = R.SUBJECTS.find(s => s.id === sid) || R.SUBJECTS[0];
      const y = acikYanlislar();
      const parcaB = { x, sid, subject, y };
      return String(K.Grid([K.Span(12, K.Stack(LIFEOS.PARCA.liste('ogren', 'ana', K, parcaB)))]));
    },
    handle:Object.assign({}, ortakHandle, {
      async 'ogren-liste-sec'(el){ S.ui.ogrenListe = el.dataset.subject; R.App.render(); },
      async 'ogren-suzgec'(el){ S.ui.ogrenSuzgec = el.dataset.f || 'hepsi'; R.App.render(); },
    }),
    change:Object.assign({}, ortakChange),
  };

  /* ================================================================
     ANLATIM — konunun ayrıntılı ders notu, uygulamanın içinde.
     ================================================================ */

  function ornekHtml(o){
    return html`<div class="ders__ornek">
      <div class="ders__etiket tiny">${yz('ays.ogren.ornek')}</div>
      ${soruMetni(o.soru, o)}
      <div class="ders__etiket tiny mt-10">${yz('ays.ogren.cozum')}</div>
      <ol class="ders__adimlar">${map(dizi(o.cozum), c => html`<li>${fmt(c)}</li>`)}</ol>
    </div>`;
  }

  /* Seviye rozeti: yazarın değerlendirmesi (ölçüm değil). */
  const seviyeRozeti = sv => html`<span class="${cls('ogr-seviye', 'is-' + (sv || 'temel'))}">${O().SEVIYE[sv] || 'Temel'}</span>`;

  /* DERİN BLOKLAR (data/derin-*.js): kazanımlar ve ön koşullar başta;
     çözümlü örnekler, sınav kalıpları ve sık hatalar anlatımın sonunda. */
  function kazanimHtml(d){
    return html`<div class="ders__kazanim" id="ders-kazanim">
      <div class="ders__etiket tiny">${yz('ays.ogren.bu-konunun-sonunda')}</div>
      <ul class="ders__liste">${map(d.kazanim, m => html`<li>${fmt(m)}</li>`)}</ul>
    </div>`;
  }
  function onKosulHtml(d){
    const l = (d.onKosul || []).map(id => O().konuyuBul(id)).filter(y => y.topic);
    if(!l.length) return '';
    return html`<div class="ders__onkosul"><span class="ders__etiket tiny">${yz('ays.ogren.once-bunlari-bil')}</span>
      <div class="row wrap gap-6">${map(l, y => {
        const ok = O().durum(y.subject.id, y.topic.id).okundu;
        return K.Chip({ label:(ok ? '✓ ' : '') + y.topic.name, act:'ogren-git',
          data:{ 'data-route':'anlatim', 'data-subject':y.subject.id, 'data-topic':y.topic.id,
            'aria-label':y.topic.name + (ok ? ', okundu' : ', okunmadı') } });
      })}</div></div>`;
  }
  function orneklerHtml(d){
    return html`<section class="ders__bolum ders__ek" id="ders-ornekler">
      <h3 class="ders__baslik">${yz('ays.ogren.cozumlu-ornekler')}</h3>
      <p class="small dim">${yz('ays.ogren.once-kagitta-kendin-dene-tak')}</p>
      ${map(d.ornekler, (o, i) => html`<div class="ders__ornek">
        <div class="row between gap-8 mb-6"><span class="ders__etiket tiny">${yz('ays.ogren.ornek')} ${i + 1}</span>${seviyeRozeti(o.seviye)}</div>
        ${soruMetni(o.soru, o)}
        <details class="ders__cozum"><summary>${yz('ays.ogren.cozumu-goster')}</summary>
          <ol class="ders__adimlar">${map(dizi(o.cozum), c => html`<li>${fmt(c)}</li>`)}</ol>
        </details>
      </div>`)}
    </section>`;
  }
  /* SADE ANLATIM (kullanıcı, 2026-10-16: «öğrenme kısmını minimalleştir,
     sadeleştir»): ek bloklar (sınav kalıpları, sık hatalar, kaynaklar)
     başlık olarak KAPALI durur, dokununca açılır; hiçbiri kalkmadı. Asıl
     anlatım ve çözümlü örnekler açık kalır. «Bu konuda» bağlantısı kapalı
     bloğu açarak oraya gider. */
  function listeBlogu(id, baslik, l, sinif){
    return html`<details class="${cls('ders__bolum ders__ek ders__katlanir', sinif)}" id="${id}">
      <summary><h3 class="ders__baslik">${baslik}</h3><span class="ders__say tiny dim">${l.length}</span></summary>
      <ul class="ders__liste">${map(l, m => html`<li>${fmt(m)}</li>`)}</ul>
    </details>`;
  }

  /* Akıllı Karar & Taktik Notu (data/akilli.js) */
  function akilliNotHtml(an){
    return html`<section class="ders__bolum ders__ek ders__akilli" id="ders-akilli">
      <div class="row between gap-8 mb-8">
        <h3 class="ders__baslik mb-0"><span class="ders__no num" aria-hidden="true">★</span>Akıllı Karar & Taktik Notu</h3>
        ${seviyeRozeti(an.duzey)}
      </div>
      <p class="tiny dim mb-8">${yz('ays.ogren.elle-yazildi-dogrulanmadi')}</p>
      <div class="ders__taktik-kutu">
        <h4 class="ders__taktik-baslik">${an.baslik}</h4>
        <p class="ders__taktik-vurgu"><b>Taktik:</b> ${fmt(an.taktik)}</p>
        <p class="small dim mt-6">${fmt(an.kisa_not)}</p>
        <div class="ders__taktik-madde small mt-8"><b>${yz('ays.ogren.neden-calisir')}</b> ${fmt(an.neden)}</div>
        ${when(an.karsi_ornek, () => html`<div class="ders__taktik-madde small mt-4"><b>${yz('ays.ogren.karsi-ornek')}</b> ${fmt(an.karsi_ornek)}</div>`)}
        ${when(an.tuzak, () => html`<div class="ders__taktik-tuzak small mt-6">
          <b>${yz('ays.ogren.sik-dusulen-tuzak')}</b> ${fmt(an.tuzak)}
          ${when(an.ayirt_edici, () => html`<span class="dim block mt-2">${yz('ays.ogren.ayirt-edici-soru')} ${fmt(an.ayirt_edici)}</span>`)}
        </div>`)}
        ${when(an.mini, () => html`<details class="ders__cozum mt-10">
          <summary>${yz('ays.ogren.kendin-dene')} ${fmt(an.mini.soru)}</summary>
          <div class="ders__mini-govde pt-8">
            ${when(an.mini.ipucu, () => html`<p class="small dim mb-6"><b>${yz('ays.ogren.i-pucu')}</b> ${fmt(an.mini.ipucu)}</p>`)}
            <div class="small"><b>Cevap:</b> ${fmt(an.mini.cevap)}</div>
          </div>
        </details>`)}
        ${when(an.kontroller && an.kontroller.length, () => html`<details class="ders__cozum mt-6">
          <summary>${yz('ays.ogren.hizli-kontrol-sorulari')}${an.kontroller.length} soru)</summary>
          <ul class="ders__liste small mt-8">
            ${map(an.kontroller, c => html`<li><b>${fmt(c.soru)}</b> → <span class="dim">${fmt(c.cevap)}</span></li>`)}
          </ul>
        </details>`)}
        ${when(an.sinir, () => html`<p class="tiny dim mt-10 mb-0"><b>${yz('ays.ogren.sinir')}</b> ${fmt(an.sinir)}</p>`)}
      </div>
    </section>`;
  }

  /* Kaynaklar (data/akilli.js). Bağlantılar DERS düzeyindedir (aynı özet
     o dersin bütün konularında tekrar eder) ve elle doğrulanmadı; ekran
     «bu konunun özeti» demez. Resmî olan yalnız MEB'in kendi yayınıdır;
     OpenStax gibi yabancı ders kitapları ayrı ve «ek kaynak» olarak durur
     (denetim 2026-10-15). */
  const resmiMi = k => /\bMEB\b/.test(String(k.kurum || ''));
  function kaynakSatiri(k){
    return html`<div class="ders__kaynak-satir">
      <div class="small minw0"><b>${k.baslik || k.id}</b> <span class="dim">· ${k.kurum || 'kurum belirtilmedi'}</span></div>
      ${when(k.url, () => html`<a href="${k.url}" target="_blank" rel="noopener noreferrer" class="btn btn--sm btn--ghost ders__kaynak-ac">${yz('ays.ogren.ac')}</a>`)}
    </div>`;
  }
  function kaynaklarHtml(kr){
    const resmi = kr.filter(resmiMi), ek = kr.filter(k => !resmiMi(k));
    return html`<details class="ders__bolum ders__ek ders__kaynaklar ders__katlanir" id="ders-kaynaklar">
      <summary><h3 class="ders__baslik">${yz('ays.ogren.kaynaklar')}</h3><span class="ders__say tiny dim">${kr.length}</span></summary>
      <p class="small dim mb-10">${yz('ays.ogren.baglantilar-dersin-tamami-ic')}</p>
      ${when(resmi.length, () => html`<div class="ders__etiket tiny mb-6">${yz('ays.ogren.resmi-meb')}</div><div class="stack-xs">${map(resmi, kaynakSatiri)}</div>`)}
      ${when(ek.length, () => html`<div class="ders__etiket tiny mt-12 mb-6">${yz('ays.ogren.ek-kaynak-resmi-degil')}</div><div class="stack-xs">${map(ek, kaynakSatiri)}</div>`)}
    </details>`;
  }

  function dersHtml(a, d, topic){
    const an = topic ? O().akilliNot(topic.id) : null;
    const kr = topic ? O().kaynaklar(topic.id) : [];
    return html`<div class="ders__govde">
      ${when(a.giris, () => html`<p class="ders__giris">${fmt(a.giris)}</p>`)}
      ${when(d && d.kazanim, () => kazanimHtml(d))}
      ${when(d && d.onKosul, () => onKosulHtml(d))}
      ${map(a.bolumler, (b, i) => html`<section class="ders__bolum" id="${'ders-b' + (i + 1)}">
        <h3 class="ders__baslik"><span class="ders__no num" aria-hidden="true">${i + 1}</span>${b.baslik}</h3>
        ${map(dizi(b.metin), p => html`<p>${fmt(p)}</p>`)}
        ${sekilHtml(b)}
        ${when(b.liste, () => html`<ul class="ders__liste">${map(b.liste, m => html`<li>${fmt(m)}</li>`)}</ul>`)}
        ${when(b.formul, () => html`<div class="ders__formul">${map(b.formul, f => html`<div>${fmt(f)}</div>`)}</div>`)}
        ${when(b.ornek, () => ornekHtml(b.ornek))}
        ${when(b.dikkat, () => html`<p class="ders__dikkat"><b>Dikkat:</b> ${fmt(b.dikkat)}</p>`)}
      </section>`)}
      ${when(an, () => akilliNotHtml(an))}
      ${when(d && d.ornekler && d.ornekler.length, () => orneklerHtml(d))}
      ${when(d && d.kaliplar && d.kaliplar.length, () => listeBlogu('ders-kaliplar', yz('ays.ogren.sinavda-nasil-sorulur'), d.kaliplar))}
      ${when(d && d.hatalar && d.hatalar.length, () => listeBlogu('ders-hatalar', yz('ays.ogren.sik-yapilan-hatalar'), d.hatalar, 'ders__hatalar'))}
      ${when(kr && kr.length, () => kaynaklarHtml(kr))}
    </div>`;
  }

  /* Geniş ekranda sağda «Bu konuda»: bölümler, özet ve sorular. Dar
     ekranda gizlenir (sayfa zaten tek sütun). */
  function icindekiler(x, a){
    const n = O().sorular(x.topic.id).length;
    const d = O().derin(x.topic.id) || {};
    const an = O().akilliNot(x.topic.id);
    const kr = O().kaynaklar(x.topic.id);
    const ek = [
      ['ders-akilli', yz('ays.ogren.akilli-taktik'), an ? [1] : null],
      ['ders-ornekler', yz('ays.ogren.cozumlu-ornekler'), d.ornekler],
      ['ders-kaliplar', yz('ays.ogren.sinavda-nasil-sorulur'), d.kaliplar],
      ['ders-hatalar', yz('ays.ogren.sik-yapilan-hatalar'), d.hatalar],
      ['ders-kaynaklar', 'Kaynaklar', kr && kr.length ? [1] : null],
    ].filter(y => y[2] && y[2].length);
    return html`<nav class="ders__icindekiler" aria-label="Bu konuda">
      <div class="ders__etiket tiny">${yz('ays.ogren.bu-konuda')}</div>
      ${map(a ? a.bolumler : [], (b, i) => html`<button type="button" class="ders__git" data-act="ders-git"
        data-hedef="${'ders-b' + (i + 1)}"><span class="num">${i + 1}</span>${b.baslik}</button>`)}
      ${map(ek, y => html`<button type="button" class="${cls('ders__git', y[0] === 'ders-akilli' && 'ders__git--akilli')}" data-act="ders-git" data-hedef="${y[0]}"><span aria-hidden="true">${y[0] === 'ders-akilli' ? '★' : '·'}</span>${y[1]}</button>`)}
      ${when((R.KONU_OZET || {})[x.topic.id], () => html`<button type="button" class="ders__git" data-act="ders-git"
        data-hedef="ders-akilda"><span aria-hidden="true">·</span>${yz('ays.ogren.akilda-kalsin')}</button>`)}
      ${when(n, () => html`<button type="button" class="ders__git" data-act="ogren-git" data-route="sorular"
        data-subject="${x.subject.id}" data-topic="${x.topic.id}"><span aria-hidden="true">›</span>${n} ${yz('ays.ogren.ornek-soru')}</button>`)}
    </nav>`;
  }

  function akildaKarti(topic){
    const o = (R.KONU_OZET || {})[topic.id];
    if(!o) return '';
    return html`<div class="ders__akilda" id="ders-akilda">
      <div class="ders__etiket tiny">${yz('ays.ogren.akilda-kalsin')}</div>
      <ul class="ders__liste">${map(o.ana, m => html`<li>${fmt(m)}</li>`)}</ul>
      ${when(o.dikkat, () => html`<p class="ders__dikkat"><b>Dikkat:</b> ${fmt(o.dikkat)}</p>`)}
      ${when(o.ornek, () => html`<p class="small mt-6"><b>${yz('ays.ogren.ornek-2')}</b> ${fmt(o.ornek)}</p>`)}
    </div>`;
  }

  function anlatimKarti(x){
    const { subject, topic } = x;
    const a = O().anlatim(topic.id);
    const d = O().durum(subject.id, topic.id);
    const kavramlar = O().kavramlar(topic.id);
    const eylem = K.Row([
      d.okundu
        ? K.Button({ label:yz('ays.ogren.okundu'), icon:'check', size:'sm', tone:'ghost', act:'ogren-okundu-geri', title:yz('ays.ogren.i-sareti-kaldir') })
        : K.Button({ label:yz('ays.ogren.okudum'), icon:'check', size:'sm', tone:'primary', act:'ogren-okundu' }),
      when(d.skor.toplam, () => K.Button({ label:yz('ays.ogren.sorulara-gec'), icon:'right', size:'sm', tone:d.okundu ? 'primary' : null,
        act:'ogren-git', data:{ 'data-route':'sorular', 'data-subject':subject.id, 'data-topic':topic.id } })),
      K.Button({ label:yz('ays.ogren.stratejiler'), icon:'book', size:'sm', tone:'ghost', act:'ogren-strateji', title:yz('ays.ogren.bilimsel-ogrenme-yontemleri') }),
      K.Button({ label:yz('ays.ogren.koca-sor'), icon:'zap', size:'sm', tone:'ghost', act:'ogren-git',
        data:{ 'data-route':'koc', 'data-subject':subject.id, 'data-topic':topic.id } }),
    ], { wrap:true });
    /* Başlıksız geniş satır: konu adı gövdede büyük başlık olur. Uzun
       anlatım raf düzeninde kısaltılmaz (data-raf-tam): okunacak metin. */
    return K.Card({ wide:true,
      body:html`<div class="ders-duzen">
        <article class="ders" data-raf-tam aria-labelledby="ders-baslik">
          <header class="ders__bas">
            <h2 id="ders-baslik">${topic.name}</h2>
            <p class="small dim">${subject.name + (topic.group ? ' · ' + topic.group : '')} ${yz('ays.ogren.elle-yazildi-dogrulanmadi-2')}</p>
            ${when(kavramlar && kavramlar.length, () => html`<div class="ders__kavramlar mt-8 mb-6" role="list" aria-label="Konu kavramları">
              <span class="tiny dim mr-4">Kavramlar:</span>
              ${map(kavramlar, k => html`<span class="ogr-kavram" role="listitem">${fmt(k)}</span>`)}
            </div>`)}
          </header>
          ${a ? dersHtml(a, O().derin(topic.id), topic) : html`<div class="mb-10">${K.Notice({ tone:'info',
            body:yz('ays.ogren.bu-konunun-ayrintili-anlatim') })}</div>`}
          ${akildaKarti(topic)}
          <div class="ders__ayak">${eylem}
            <p class="tiny dim mt-10">${yz('ays.ogren.ders-kitabinin-yerini-tutmaz')}</p></div>
        </article>
        ${icindekiler(x, a)}
      </div>`,
    });
  }

  /* NOTUM (core/konunotu.js): konuyu okurken kendi notun. Konu durumunun
     `note` alanıdır; yazınca kendiliğinden kaydolur. Anlatımda bir cümleyi
     seçince çıkan «Nota ekle» onu sona ekler; «ön :: arka» satırları
     «Kartlara çevir» ile tekrar kartı olur. */
  function kartDugmeEtiketi(n){ return n ? yz('ays.ogren.kartlara-cevir') + n + ')' : yz('ays.ogren.kartlara-cevir-2'); }
  function notumKarti(subject, topic){
    const N = R.KonuNotu;
    if(!N) return '';
    const metin = N.oku(subject.id, topic.id);
    const n = N.kartAdaylari(metin).length;
    /* Sade (2026-10-16): «kendiliğinden kaydedilir» alttaki durum satırında,
       kart sözdizimi («::») ⓘ'de değil yer tutucuda tek örnekle. */
    return K.Card({ title:yz('ays.ogren.notum'),
      actions:K.Button({ label:kartDugmeEtiketi(n), icon:'cards', size:'sm', tone:'ghost', act:'konu-notu-kart',
        data:{ id:'konu-notu-kart' }, disabled:!n, title:yz('ays.ogren.on-arka-bicimindeki-satirlar') }),
      body:html`<textarea class="input konu-notu" id="konu-notu" rows="${Math.min(14, Math.max(4, metin.split('\n').length + 1))}"
          maxlength="${N.SINIR}" data-change="konu-notu" data-debounce="600" aria-label="${topic.name + ' konusu için notum'}"
          placeholder="Kendi cümlelerinle yaz. «soru :: cevap» satırı tekrar kartı olur.">${metin}</textarea>
        <p class="tiny dim mt-6 mb-0" id="konu-notu-durum" aria-live="polite">${metin ? metin.length + ' / ' + N.SINIR + ' karakter' : yz('ays.ogren.yazdigin-kendiliginden-kayde')}</p>` });
  }

  /* Anlatımda seçili metin → «Nota ekle» (belge düzeyinde BİR KEZ bağlanır). */
  let secimBagli = false;
  function secimiBagla(){
    if(secimBagli || typeof document === 'undefined') return;
    secimBagli = true;
    const dugme = () => document.getElementById('nota-ekle');
    const gizle = () => { const d = dugme(); if(d) d.remove(); };
    const goster = () => {
      const sel = window.getSelection ? window.getSelection() : null;
      const metin = sel ? String(sel).replace(/\s+/g, ' ').trim() : '';
      const ders = document.querySelector('article.ders');
      if(!sel || sel.rangeCount === 0 || metin.length < 3 || metin.length > 500 || !ders
        || !ders.contains(sel.anchorNode) || !document.getElementById('konu-notu')){ gizle(); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      let d = dugme();
      if(!d){
        d = document.createElement('button');
        d.type = 'button'; d.id = 'nota-ekle'; d.className = 'nota-ekle';
        d.textContent = yz('ays.ogren.nota-ekle');
        d.addEventListener('mousedown', e => e.preventDefault());   // seçim kaybolmasın
        d.addEventListener('click', async () => {
          const x = O().secili();
          const s = d.dataset.metin || '';
          gizle();
          if(!x.topic || !s) return;
          const yeni = await R.KonuNotu.ekle(x.subject.id, x.topic.id, '«' + s + '»');
          const kutu = document.getElementById('konu-notu');
          if(kutu && yeni != null){ kutu.value = yeni; notDurumu(yeni); }
          if(window.getSelection) window.getSelection().removeAllRanges();
          UI.toast(yz('ays.ogren.nota-eklendi'));
        });
        document.body.appendChild(d);
      }
      d.dataset.metin = metin;
      d.style.left = Math.max(8, Math.min(window.innerWidth - 120, r.left + r.width / 2 - 50)) + 'px';
      d.style.top = Math.max(8, r.top - 44) + 'px';
    };
    document.addEventListener('mouseup', () => setTimeout(goster, 0));
    document.addEventListener('touchend', () => setTimeout(goster, 250));
    document.addEventListener('keyup', e => { if(e.shiftKey || e.key === 'Shift') goster(); });
    window.addEventListener('scroll', gizle, { passive:true, capture:true });
  }
  function notDurumu(metin){
    const N = R.KonuNotu;
    const p = document.getElementById('konu-notu-durum');
    if(p) p.textContent = metin ? metin.length + ' / ' + N.SINIR + ' karakter · kaydedildi' : yz('ays.ogren.henuz-not-yok');
    const b = document.getElementById('konu-notu-kart');
    if(b){
      const n = N.kartAdaylari(metin).length;
      b.disabled = !n;
      const e = b.querySelector('.btn__label') || b;
      e.textContent = kartDugmeEtiketi(n);
    }
  }

  /* VİDEOLAR VE NOTLAR — bu konuya bağlı dersler (screens/learn.js'in
     kaydı, S.videoNotes). Kullanıcı (2026-10-10): «o konuya video URL'si
     koyabilelim». Video burada bağlanır, Öğrenme'de gömülü oynatıcıyla
     açılır ve zaman damgalı notlar orada alınır; ikinci bir video kaydı
     kurulmaz. Bağlantı yalnız http(s) olabilir (core/cikmis.js baglanti). */
  function videoAdi(n){
    if(n.title) return n.title;
    try{ return new URL(n.url).hostname.replace(/^www\./, ''); }catch(e){ return 'Video'; }
  }
  function notlarKarti(subject, topic){
    const notlar = (S.videoNotes || []).filter(n => n.subjectId === subject.id && n.topicId === topic.id);
    const seg = [];
    notlar.forEach(n => (n.segments || []).forEach(s => seg.push({ n, s })));
    const guvenli = u => R.Cikmis && R.Cikmis.baglanti(u) ? u : null;
    return K.Card({ title:yz('ays.ogren.videolar-ve-notlarin'),
      sub:notlar.length ? U.plural(notlar.length, 'video', 'video') + (seg.length ? ' · ' + U.plural(seg.length, 'not', 'not') : '') : null,
      actions:html`${K.Button({ label:yz('ays.ogren.video-ekle'), icon:'play', size:'sm', tone:'ghost', act:'ogren-video-ekle' })}
        ${K.Button({ label:yz('ays.ogren.ders-notu-ekle'), icon:'plus', size:'sm', tone:'ghost', act:'ogren-not' })}`,
      body:notlar.length ? html`<div class="stack-sm">
          <div class="list list--sik">${map(notlar, n => html`<div class="listitem">
            <span class="grow minw0"><span class="small strong">${videoAdi(n)}</span>
              <span class="tiny dim">${n.provider === 'youtube' ? yz('ays.ogren.youtube-uygulamada-acilir') : 'bağlantı'}${(n.segments || []).length ? ' · ' + n.segments.length + ' not' : ''}</span></span>
            ${K.Button({ label:yz('ays.ogren.ac-2'), icon:'play', size:'sm', tone:'ghost', act:'ogren-video-ac', data:{ 'data-id':n.id } })}
            ${when(guvenli(n.url), () => html`<a class="btn btn--sm btn--ghost" href="${n.url}" target="_blank" rel="noopener noreferrer">${yz('ays.ogren.tarayicida')}</a>`)}
          </div>`)}</div>
          ${when(seg.length, () => html`<div class="stack-xs">${map(seg.slice(0, 8), y => html`<div class="row-top gap-8">
            <a class="seg-row__ts num" href="${R.Model.tsUrl(y.n, y.s.ts)}" target="_blank" rel="noopener">${R.Model.fmtTs(y.s.ts)}</a>
            <span class="small">${y.s.text}</span></div>`)}</div>`)}</div>`
        : html`<p class="small muted">${yz('ays.ogren.bu-konuya-bagli-video-yok')}</p>` });
  }

  /* ÇIKMIŞ SORULAR (core/cikmis.js): konuya bağlı ÖSYM soru künyeleri.
     Soru metni kopyalanmaz; resmî kitapçık bağlantısı ve soru numarası
     durur, cevap burada girilir, anahtar varsa kodla ölçülür. */
  const CIKMIS_DURUM = { bos:yz('ays.ogren.cevaplanmadi'), isaretlendi:'cevabın girildi · anahtar yok', dogru:'doğru · ölçüldü', yanlis:'yanlış · ölçüldü' };
  function cikmisKarti(subject, topic){
    if(!R.Cikmis) return null;
    const l = R.Cikmis.konununki(topic.id), oz = R.Cikmis.ozet(topic.id);
    return K.Card({ title:yz('ays.ogren.cikmis-sorular'),
      sub:l.length ? U.plural(l.length, 'soru', 'soru') + (oz.cevaplanan ? ' · ' + oz.dogru + ' doğru, ' + oz.yanlis + ' yanlış' : '') : 'resmî kitapçıktan çöz, cevabını burada gir',
      actions:K.Button({ label:yz('ays.ogren.soru-bagla'), icon:'plus', size:'sm', tone:'ghost', act:'cikmis-ekle' }),
      body:html`${l.length ? html`<div class="list list--sik">${map(l, k => {
          const d = R.Cikmis.durum(k);
          return html`<div class="${cls('listitem cikmis', 'is-' + d)}">
            <span class="grow minw0"><span class="small strong">${R.Cikmis.kunye(k)}</span>
              <span class="tiny dim">${CIKMIS_DURUM[d]}${k.cevap ? ' · cevabın ' + k.cevap.h : ''}${k.dogru && k.cevap ? ', anahtar ' + k.dogru : ''}${k.not ? ' · ' + k.not : ''}</span>
              ${when(d === 'bos', () => html`<span class="row wrap gap-6 mt-6" role="group" aria-label="${R.Cikmis.kunye(k) + ' cevabın'}">${map(O().HARFLER, h =>
                K.Button({ label:h, size:'sm', tone:'ghost', act:'cikmis-cevap', data:{ 'data-id':k.id, 'data-harf':h } }))}</span>`)}</span>
            <span class="row wrap gap-6">
              ${when(k.url, () => html`<a class="btn btn--sm btn--ghost" href="${k.url}" target="_blank" rel="noopener noreferrer">${yz('ays.ogren.kitapcik')}</a>`)}
              ${when(d === 'yanlis', () => R.Cikmis.defterde(k) ? K.Chip('yanlış defterinde')
                : K.Button({ label:yz('ays.ogren.yanlis-defterine-ekle'), icon:'list', size:'sm', tone:'ghost', act:'cikmis-defter', data:{ 'data-id':k.id } }))}
              ${when(!k.dogru, () => K.Button({ label:yz('ays.ogren.anahtari-gir'), size:'sm', tone:'ghost', act:'cikmis-anahtar', data:{ 'data-id':k.id } }))}
              ${K.Button({ label:yz('ays.ogren.kaldir'), size:'sm', tone:'ghost', act:'cikmis-sil', data:{ 'data-id':k.id } })}
            </span></div>`;
        })}</div>` : html`<p class="small muted">${yz('ays.ogren.bu-konudan-cikmis-bir-osym')}</p>`}
        <div class="row between wrap gap-6 mt-10"><p class="tiny dim minw0">${yz('ays.ogren.soru-metinleri-osym-ye-aitti')}</p>
          <a class="btn btn--sm btn--ghost" href="https://www.osym.gov.tr/" target="_blank" rel="noopener noreferrer">osym.gov.tr</a></div>`,
    });
  }

  /* Paragraf konularında günlük paragrafın bu konudaki havuzu (core/paragraf.js). */
  function parAnlatimKarti(topic){
    const P_ = R.Paragraf;
    if(!P_ || P_.KONULAR.indexOf(topic.id) < 0) return null;
    const n = P_.konuSorulari(topic.id).length;
    if(!n) return null;
    const g = P_.gunu(), o = g ? P_.ozet() : null;
    return K.Card({ title:yz('ays.ogren.gunluk-paragraf'), sub:yz('ays.ogren.bu-konudan-havuzda') + n + ' soru',
      body:html`<p class="small">${yz('ays.ogren.paragraf-her-gun-calisilan-b')}</p>
        <div class="row wrap gap-6 mt-10">${K.Button({ label:o && o.bitti ? yz('ays.ogren.bugunun-seti-bitti-2') : o && o.cevaplanan ? yz('ays.ogren.sete-devam-et') + o.cevaplanan + '/' + o.toplam : yz('ays.ogren.bugunun-setini-coz'),
          icon:'book', size:'sm', tone:o && o.bitti ? 'ghost' : 'primary', act:'sorular-kip', data:{ 'data-tab':'paragraf' } })}</div>` });
  }

  /* KONUNUN MALZEMELERİ (BAM; brand/ortak/urun.js söz 6). «Konu anlatımı
     iste» kaynaklı derin anlatımı ister; kavram sözlüğü ve çalışma kâğıdı
     ayrı. Her istek King'in onay kapısından geçer (model kotası harcar);
     ürün Onaylar'dan gelir ve burada, konusunun yanında açılır. HKM
     kapalıyken gelmiş olanlar okunur. Etiket modülün kendi bağıdır. */
  const MALZEME = [
    { tur:'ders_notu', ad:yz('ays.ogren.konu-anlatimi') },
    { tur:'sozluk', ad:yz('ays.ogren.kavram-sozlugu') },
    { tur:'calisma_kagidi', ad:yz('ays.ogren.calisma-kagidi') },
  ];
  function etiketOf(subject, topic){ return 'ays:konu:' + subject.id + '/' + topic.id; }
  function malzemeler(subject, topic){
    const Ur = R.Urunler;
    if(!Ur || !Ur.etiketli) return null;
    const et = etiketOf(subject, topic);
    return { urunler:Ur.etiketli(et), bekleyen:Ur.bekleyen(et) };
  }
  function malzemeKarti(subject, topic){
    const m = malzemeler(subject, topic);
    if(!m) return null;
    const var_ = tur => m.urunler.some(u => u.urun === tur);
    const istendi = tur => m.bekleyen.some(y => y.tur === tur);
    const eksik = MALZEME.filter(y => !var_(y.tur));
    return K.Card({ title:yz('ays.ogren.daha-derin'), hint:'ogren-bam',
      sub:m.urunler.length ? m.urunler.length + ' malzeme · internetsiz de açılır' : yz('ays.ogren.bam-bu-konu-icin-kaynakli'),
      body:html`
        ${when(m.urunler.length, () => html`<div class="stack-xs">${map(m.urunler, u => html`
          <div class="row between gap-8">
            <span class="small minw0"><b>${u.urunAd}</b> <span class="dim">${u.baslik}</span>
              <span class="tiny dim">· ${LIFEOS.Urun.etiketAdi(u.dogruluk)}</span></span>
            ${K.Button({ label:yz('ays.ogren.ac-2'), size:'sm', act:'konu-urun-ac', data:{ 'data-id':u.id } })}
          </div>`)}</div>`)}
        ${when(eksik.length, () => html`<div class="row wrap gap-6 ${m.urunler.length ? 'mt-12' : ''}">${map(eksik, y => istendi(y.tur)
          ? K.Chip(y.ad + ' · istendi')
          : K.Button({ label:y.tur === 'ders_notu' ? yz('ays.ogren.konu-anlatimi-iste') : y.ad, icon:y.tur === 'ders_notu' ? 'book' : null,
              size:'sm', tone:'ghost', act:'konu-malzeme', data:{ 'data-tur':y.tur } }))}</div>`)}`,
    });
  }

  LIFEOS.PARCA.blok({ id:'anlatim.konu-cubugu', sayfa:'anlatim', yer:'ana', sira:10, ad:'Konu çubuğu', ciz({ x }){ return raw(konuCubugu(x)); } });
LIFEOS.PARCA.blok({ id:'anlatim.anlatimkarti', sayfa:'anlatim', yer:'ana', sira:20, ad:'Konu anlatımı', ciz({ x }){ return anlatimKarti(x); } });
LIFEOS.PARCA.blok({ id:'anlatim.notumkarti', sayfa:'anlatim', yer:'ana', sira:30, ad:'Notum', ciz({ x }){ return notumKarti(x.subject, x.topic); } });
LIFEOS.PARCA.blok({ id:'anlatim.paranlatimkarti', sayfa:'anlatim', yer:'ana', sira:40, ad:'Paragraf anlatımı', ciz({ x }){ return parAnlatimKarti(x.topic); } });
LIFEOS.PARCA.blok({ id:'anlatim.cikmiskarti', sayfa:'anlatim', yer:'ana', sira:50, ad:'Çıkmış sorular', ciz({ x }){ return cikmisKarti(x.subject, x.topic); } });
LIFEOS.PARCA.blok({ id:'anlatim.notlarkarti', sayfa:'anlatim', yer:'ana', sira:60, ad:'Notlar', ciz({ x }){ return notlarKarti(x.subject, x.topic); } });
LIFEOS.PARCA.blok({ id:'anlatim.malzemekarti', sayfa:'anlatim', yer:'ana', sira:70, ad:'Malzemeler', ciz({ x }){ return malzemeKarti(x.subject, x.topic); } });
  R.Screens.anlatim = {
    id:'anlatim',
    /* Sade anlatım: sayfa «Notum»da biter; ara sıra açılan kartlar küçük başlar. */
    kucukVarsayilan:['çıkmış-sorular', 'videolar-ve-notların', 'daha-derin'],
    title:yz('ays.ogren.anlatim'),
    subtitle(){ const x = O().secili(); return x.topic ? x.subject.name + ' · ' + x.topic.name : yz('ays.ogren.konu-anlatimi'); },
    actions(){ return ''; },
    async render(){
      const x = await hazirla();
      if(!x.topic) return String(K.Card({ body:K.Empty({ icon:'book', text:yz('ays.ogren.konu-yok') }) }));
      const parcaB = { x };
      return String(K.Grid([K.Span(12, K.Stack(LIFEOS.PARCA.liste('anlatim', 'ana', K, parcaB)))]));
    },
    handle:Object.assign({}, ortakHandle, {
      async 'ders-git'(el){
        const h = document.getElementById(el.dataset.hedef);
        if(!h) return;
        /* Kapalı blok (sade anlatım) açılarak gidilir. */
        const d = h.tagName === 'DETAILS' ? h : h.closest('details');
        if(d) d.open = true;
        h.scrollIntoView({ behavior:'smooth', block:'start' });
      },
      async 'ogren-okundu'(){
        const x = O().secili();
        if(!x.topic) return;
        await R.OgrenYolu.okundu(x.subject.id, x.topic.id, true);
        UI.toast(yz('ays.ogren.okundu-2') + (O().skor(x.subject.id, x.topic.id).toplam ? 'sırada örnek sorular' : 'öğrenme yoluna sayıldı'));
        R.App.render();
      },
      async 'ogren-okundu-geri'(){
        const x = O().secili();
        if(!x.topic) return;
        await R.OgrenYolu.okundu(x.subject.id, x.topic.id, false);
        UI.toast(yz('ays.ogren.okudum-isareti-kaldirildi'));
        R.App.render();
      },
      async 'ogren-video-ekle'(){
        const x = O().secili();
        if(!x.topic) return;
        UI.sheet({ title:yz('ays.ogren.konuya-video-ekle'), subtitle:x.subject.name + ' · ' + x.topic.name,
          body:String(K.Stack([
            K.Field({ label:yz('ays.ogren.video-baglantisi'), hint:yz('ays.ogren.youtube-baglantisi-ogrenme-d'),
              input:K.Input({ id:'ov-url', placeholder:'https://www.youtube.com/watch?v=…' }) }),
            K.Field({ label:yz('ays.ogren.baslik-istege-bagli'), input:K.Input({ id:'ov-title', placeholder:yz('ays.ogren.or') + x.topic.name + ' konu anlatımı' }) }),
          ])),
          footer:String(html`${K.Button({ label:yz('ays.ogren.vazgec'), act:'sheet-close' })}
            ${K.Button({ label:yz('ays.ogren.ekle'), tone:'primary', act:'ogren-video-kaydet' })}`) });
      },
      async 'ogren-video-kaydet'(){
        const x = O().secili();
        const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
        const url = val('ov-url');
        if(!url || !R.Cikmis.baglanti(url)){ UI.toast(yz('ays.ogren.baglanti-http-ya-da-https')); return; }
        const note = R.Model.newVideoNote({ title:val('ov-title'), url, subjectId:x.subject.id, topicId:x.topic.id });
        await R.Model.saveVideoNote(note);
        UI.closeSheet();
        UI.toast(yz('ays.ogren.video-konuya-baglandi-ogrenm'));
        R.App.render();
      },
      async 'ogren-video-ac'(el){
        S.ui.noteOpen = el.dataset.id;
        R.App.go('learn');
      },
      /* Çıkmış sorular */
      async 'cikmis-ekle'(){
        const x = O().secili();
        if(!x.topic) return;
        const sinav = x.subject.id.indexOf('ayt') === 0 ? 'AYT' : 'TYT';
        UI.sheet({ title:yz('ays.ogren.cikmis-soru-bagla'), subtitle:x.subject.name + ' · ' + x.topic.name,
          body:String(K.Stack([
            K.Cols(3, [
              K.Field({ label:yz('ays.ogren.sinav'), input:K.Select({ id:'ck-sinav', value:sinav, options:R.Cikmis.SINAVLAR.map(v => ({ value:v, label:v })) }) }),
              K.Field({ label:yz('ays.ogren.yil'), input:K.Input({ id:'ck-yil', type:'number', min:1990, max:2100, placeholder:String(new Date().getFullYear() - 1) }) }),
              K.Field({ label:yz('ays.ogren.soru-no'), input:K.Input({ id:'ck-no', type:'number', min:1, max:200, placeholder:'12' }) }),
            ]),
            K.Field({ label:yz('ays.ogren.test-istege-bagli'), input:K.Input({ id:'ck-test', placeholder:yz('ays.ogren.or-temel-matematik') }) }),
            K.Field({ label:yz('ays.ogren.resmi-kitapcik-baglantisi-is'), input:K.Input({ id:'ck-url', placeholder:'https://…' }) }),
            K.Field({ label:yz('ays.ogren.cevap-anahtarindaki-harf-bil'), input:K.Select({ id:'ck-dogru', value:'',
              options:[{ value:'', label:yz('ays.ogren.bilmiyorum') }].concat(O().HARFLER.map(h => ({ value:h, label:h }))) }) }),
            K.Field({ label:yz('ays.ogren.not-istege-bagli'), input:K.Input({ id:'ck-not', placeholder:yz('ays.ogren.or-sekilli-soru-ikinci-oturu') }) }),
            K.Notice({ tone:'info', body:yz('ays.ogren.soru-metni-kopyalanmaz-soruy') }),
          ])),
          footer:String(html`${K.Button({ label:yz('ays.ogren.vazgec'), act:'sheet-close' })}
            ${K.Button({ label:yz('ays.ogren.bagla'), tone:'primary', act:'cikmis-kaydet' })}`) });
      },
      async 'cikmis-kaydet'(){
        const x = O().secili();
        const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
        const r = await R.Cikmis.ekle({ konu:x.topic && x.topic.id, sinav:val('ck-sinav'), yil:val('ck-yil'), soruNo:val('ck-no'),
          test:val('ck-test'), url:val('ck-url'), dogru:val('ck-dogru') || null, not:val('ck-not') });
        if(!r.ok){ UI.toast(r.neden); return; }
        UI.closeSheet();
        UI.toast(yz('ays.ogren.baglandi') + R.Cikmis.kunye(r.kayit));
        R.App.render();
      },
      async 'cikmis-cevap'(el){
        const r = await R.Cikmis.cevapla(el.dataset.id, el.dataset.harf);
        if(r.ok) UI.toast(r.durum === 'dogru' ? yz('ays.ogren.dogru-olculdu') : r.durum === 'yanlis' ? yz('ays.ogren.yanlis-olculdu') : yz('ays.ogren.cevabin-girildi-anahtar-giri'));
        R.App.render();
      },
      async 'cikmis-anahtar'(el){
        const k = R.Cikmis.bul(el.dataset.id);
        if(!k) return;
        UI.sheet({ title:yz('ays.ogren.cevap-anahtari'), subtitle:R.Cikmis.kunye(k),
          body:String(html`<p class="small">${yz('ays.ogren.yayimlanmis-cevap-anahtarind')}</p>
            <div class="row wrap gap-6 mt-10">${map(O().HARFLER, h => K.Button({ label:h, act:'cikmis-anahtar-yaz', data:{ 'data-id':k.id, 'data-harf':h } }))}</div>`) });
      },
      async 'cikmis-anahtar-yaz'(el){
        await R.Cikmis.anahtarYaz(el.dataset.id, el.dataset.harf);
        UI.closeSheet();
        R.App.render();
      },
      async 'cikmis-defter'(el){
        const e = await R.Cikmis.deftereEkle(el.dataset.id);
        UI.toast(e ? yz('ays.ogren.yanlis-defterine-eklendi-kok') : 'Eklenemedi');
        R.App.render();
      },
      async 'cikmis-sil'(el){
        const k = R.Cikmis.bul(el.dataset.id);
        if(!k) return;
        UI.confirmSheet('Kaldır', R.Cikmis.kunye(k) + ' bu konudan kaldırılsın mı? Yanlış defterine eklenmişse oradaki kayıt kalır.',
          async () => { await R.Cikmis.sil(k.id); UI.closeSheet(); R.App.render(); }, true, 'Kaldır');
      },
      async 'ogren-not'(){
        const x = O().secili();
        S.ui.noteOpen = null;
        R.App.go('learn');
        setTimeout(() => R.Screens.learn.handle['note-new']({ dataset:{
          subject:x.subject ? x.subject.id : '', topic:x.topic ? x.topic.id : '' } }), 80);
      },
      /* «Konu anlatımı iste» ve öteki malzemeler: açık istek, konu etiketiyle. */
      async 'konu-malzeme'(el){
        const { subject, topic } = O().secili();
        const m = MALZEME.find(y => y.tur === el.dataset.tur);
        if(!subject || !topic || !m || !R.Urunler) return;
        const sinav = subject.id.indexOf('ayt') === 0 ? 'AYT' : 'TYT';
        const konu = topic.name + ' (' + subject.name + ')';
        const ayrinti = 'YKS ' + sinav + ' hazırlığı: ' + subject.name + (topic.group ? ' › ' + topic.group : '')
          + ' › ' + topic.name + '. Lise düzeyinde; tanımlar, adım adım çözülmüş örnekler, sık yapılan hatalar '
          + 've ÖSYM soru tarzına uygun kısa alıştırmalar.';
        const r = await R.Urunler.iste(m.ad + ': ' + konu, { tur:m.tur, konu, ayrinti, etiket:etiketOf(subject, topic) });
        UI.toast(r.metin || (r.ok ? yz('ays.ogren.king-e-iletildi') : 'İletilemedi.'), { life:r.ok ? 5000 : 6000 });
        R.App.render();
      },
      /* Malzeme KUTUDA açılır (brand/ortak/urun.js söz 2): betik çalışmaz. */
      async 'konu-urun-ac'(el){
        const u = R.Urunler && R.Urunler.bul(el.dataset.id);
        if(!u) return;
        UI.sheet({ title:u.baslik, wide:true,
          subtitle:u.urunAd + ' · ' + LIFEOS.Urun.etiketAdi(u.dogruluk),
          note:u.dogruluk === 'dogrulanmadi' ? yz('ays.ogren.dogrulanmadi-kaynaksiz-model')
            + yz('ays.ogren.karar-vermeden-once-bir-kayn') : null,
          body:LIFEOS.Urun.cerceve(u) });
      },
      async 'ogren-strateji'(){
        const l = O().stratejiler();
        UI.sheet({
          title:yz('ays.ogren.ogrenme-stratejileri'),
          subtitle:yz('ays.ogren.kanita-dayali-calisma-ve-pek'),
          body:String(K.Stack([
            html`<p class="small dim">${yz('ays.ogren.bu-yontemler-zihinsel-kavray')}</p>`,
            html`<div class="stack-sm">${map(l, y => html`<div class="ogr-strateji">
              <div class="row between gap-8 mb-4">
                <b class="small">${y.ad}</b>
                <span class="tiny dim">${y.dayanak === 'ogrenme-dunlosky-2013' ? yz('ays.ogren.dunlosky-2013') : 'IES 2007'}</span>
              </div>
              <p class="small mb-6">${y.kullanim}</p>
              <p class="tiny dim mb-0"><b>Kontrol:</b> ${y.kontrol}</p>
            </div>`)}</div>`
          ])),
          footer:String(K.Button({ label:yz('ays.ogren.kapat'), act:'sheet-close' }))
        });
      },
      async 'konu-notu-kart'(){
        const x = O().secili();
        if(!x.topic) return;
        /* Bekleyen yazım (gecikmeli kayıt) önce diske: kart son metinden açılır. */
        const kutu = document.getElementById('konu-notu');
        if(kutu) await R.KonuNotu.yaz(x.subject.id, x.topic.id, kutu.value);
        const r = await R.KonuNotu.kartlaraCevir(x.subject.id, x.topic.id);
        UI.toast(r.acilan ? r.acilan + ' tekrar kartı açıldı' + (r.vardi ? ' · ' + r.vardi + ' tanesi zaten vardı' : '')
          : r.vardi ? yz('ays.ogren.bu-satirlarin-karti-zaten-va') : '«ön :: arka» biçiminde satır yok');
      },
    }),
    change:Object.assign({}, ortakChange, {
      async 'konu-notu'(el){
        const x = O().secili();
        if(!x.topic) return;
        const m = await R.KonuNotu.yaz(x.subject.id, x.topic.id, el.value);
        notDurumu(m);
      },
    }),
    afterRender(){ secimiBagla(); },
    malzemeler, etiketOf,
  };

  /* ================================================================
     SORULAR — üç kip, aynı soru gövdesi:
       Bu konu      örnek sorular birer birer; ilk cevap ölçümdür.
       Karma test   konular karışık (core/ogrentest.js söz 1–4).
       Yanlışlarım  son denemesi doğru olmayanları yeniden çöz (söz 5).
     Soru kartları başlıksızdır: içinde soru çözülen bir kart gizlenip
     küçültülecek bir bölüm değildir (core/gizle.js başlıklı kartı alır).
     ================================================================ */

  const T = () => R.OgrenTest;
  const DURUM_AD = { bos:yz('ays.ogren.cevaplanmadi'), bakildi:'çözüme bakıldı', dogru:'doğru', yanlis:'yanlış', isaretli:'işaretlendi' };
  const durumOf = (q, v) => !v ? 'bos' : v.bak ? 'bakildi' : v.h === q.dogru ? 'dogru' : 'yanlis';
  const KAYNAK_AD = { konu:'konu sorusu', test:'karma test', tekrar:'yeniden çözüm' };

  /* Sorunun ekrandaki adı: konu sorusu «Soru 3», günlük paragraf
     havuzunun sorusu «Paragraf 14» (core/paragraf.js). */
  function soruAdi(s){ return typeof s.i === 'string' ? yz('ays.ogren.paragraf') + Number(String(s.i).slice(1)) : yz('ays.ogren.soru') + (Number(s.i) + 1); }

  function soruNo(x){
    const l = O().sorular(x.topic.id);
    const i = Math.max(0, Math.min(l.length - 1, Number(S.ui.ogrenSoru) || 0));
    return { l, i };
  }

  /* Kartın kendi başlığı (başlıksız kartın gövdesinde). */
  function kartBasi(ad, alt, eylem){
    return html`<div class="ogr-bas"><div class="minw0"><h2 class="ogr-bas__ad">${ad}</h2>
      ${when(alt, () => html`<p class="small dim">${alt}</p>`)}</div>${eylem || ''}</div>`;
  }

  /* n soru için numaralı noktalar; durum(k) → bos|bakildi|dogru|yanlis. */
  function noktalar(n, i, durum, act){
    const l = [];
    for(let k = 0; k < n; k++) l.push(k);
    return html`<div class="ogr-noktalar" role="group" aria-label="Sorular">${map(l, k => {
      const d = durum(k);
      return html`<button class="${cls('ogr-nokta', 'is-' + d, k === i && 'is-sirada')}" data-act="${act}"
        data-i="${k}" aria-label="${yz('ays.ogren.soru') + (k + 1) + ': ' + DURUM_AD[d]}" aria-current="${k === i ? 'true' : 'false'}">${k + 1}</button>`;
    })}</div>`;
  }

  /* Paragraflı soruda son satır soru köküdür: paragraf ayrı, kök kalın.
     Şekil ve tablo (core/sekil.js) paragrafla kök arasına girer: sınav
     kitapçığındaki gibi önce metin, sonra çizim, en son soru. ek: soru ya
     da örnek nesnesi (sekil, tablo alanları). */
  function soruMetni(metin, ek){
    const l = String(metin || '').split('\n');
    const kok = l.pop();
    const sekilli = !!(ek && (ek.sekil || ek.tablo));
    return html`${map(l, p => html`<p class="ogr-soru__parca">${fmt(p)}</p>`)}${sekilHtml(ek)}<p class="ogr-soru__metin">${l.length || sekilli ? html`<b>${fmt(kok)}</b>` : fmt(kok)}</p>`;
  }

  /* ---------- soru bazlı kronometre ve tempo (ölçüm) ---------- */
  let soruTimerId = null;
  function baslatSoruSayac(){
    if(typeof window === 'undefined') return;
    if(soruTimerId){ clearInterval(soruTimerId); soruTimerId = null; }
    const el = document.getElementById('ogr-soru-sayac') || document.getElementById('ogr-prova-kalan');
    if(!el) return;
    if(!S.ui.soruGiris) S.ui.soruGiris = Date.now();
    const guncelle = () => {
      const pk = document.getElementById('ogr-prova-kalan');
      if(pk){
        const kalan = T().kalanSn();
        pk.textContent = sureYaz(kalan);
        if(kalan === 0 && !S.ui.provaBitiyor){
          S.ui.provaBitiyor = true;
          T().bitir().then(oz => { S.ui.provaSonuc = oz ? oz.id : null; S.ui.provaBitiyor = false;
            UI.toast(yz('ays.ogren.sure-doldu-prova-bitti')); R.App.render(); });
        }
      }
      const g = document.getElementById('ogr-soru-sayac');
      if(!g && !pk){ if(soruTimerId){ clearInterval(soruTimerId); soruTimerId = null; } return; }
      if(!g) return;
      const sn = Math.max(0, Math.floor((Date.now() - (S.ui.soruGiris || Date.now())) / 1000));
      const dk = Math.floor(sn / 60);
      const s = sn % 60;
      g.textContent = (dk < 10 ? '0' : '') + dk + ':' + (s < 10 ? '0' : '') + s;
    };
    guncelle();
    soruTimerId = setInterval(guncelle, 1000);
  }

  function gecenSure(){
    const bas = S.ui.soruGiris || Date.now();
    const sn = Math.max(1, Math.min(1800, Math.round((Date.now() - bas) / 1000)));
    S.ui.soruGiris = Date.now();
    return sn;
  }
  function soruSifirlaSure(){
    S.ui.soruGiris = Date.now();
  }

  function tempoRozeti(sn, dersId){
    if(!sn || sn <= 0) return '';
    const aytMi = dersId && String(dersId).indexOf('ayt') === 0;
    const ideal = aytMi ? 120 : 75;
    const makul = aytMi ? 165 : 105;
    let rozetCls = 'ogr-tempo--ideal';
    let ikon = '⚡';
    let yorum = 'ideal tempo (sınav ritmi)';
    if(sn <= ideal){
      rozetCls = 'ogr-tempo--ideal';
      ikon = '⚡';
      yorum = 'seri tempo';
    } else if(sn <= makul){
      rozetCls = 'ogr-tempo--makul';
      ikon = '⏱️';
      yorum = 'dengeli tempo';
    } else {
      rozetCls = 'ogr-tempo--yavas';
      ikon = '⏳';
      yorum = 'süre aşımı (derinleş / hızlan)';
    }
    const dk = Math.floor(sn / 60);
    const artanSn = sn % 60;
    const sureStr = dk > 0 ? dk + ' dk ' + (artanSn ? artanSn + ' sn' : '') : sn + ' sn';
    return html`<div class="ogr-tempo ${rozetCls} mt-4 mb-6">
      <span>${ikon} <b>${sureStr}</b> · ${yorum}</span>
    </div>`;
  }

  /* Üç kipin ortak soru gövdesi. v: { h, bak, ip? } ya da null (cevapsız).
     o: { etiket, seviye?, ipucu?: anahtar, cevapAct, bakAct?, ust?, eylemler, ders? }
     İpucu cevaptan önce açılır; açıldıktan sonra verilen cevap «ipucuyla»
     diye yazılır (ölçüm dürüst kalsın). */
  /* KARALAMA (2026-10-17, «soru çözümünde yazarak, çizerek not alma»): soru
     metni üstte, kareli kâğıtta kalemle; o sorunun Defter notuna eklenir
     (aynı soru için yeniden karalanırsa aynı notun sonuna). */
  const KARALA = new Map();
  function karalaKaydi(k, q){
    const id = 'k' + (KARALA.size + 1);
    KARALA.set(id, { baslik:k.baslik, soru:String(q.soru || ''), sec:(q.sec || []).slice() });
    return id;
  }
  function soruGovdesi(q, v, o){
    const acik = !!v;
    const ipAcik = !!(o.ipucu && S.ui.ipucu === o.ipucu);
    const tkAcik = !!(o.taktik && S.ui.taktik === o.taktik);
    const secenek = (metin, k) => {
      const harf = O().HARFLER[k];
      const durum = !acik ? '' : o.gizli ? (v.h === harf ? 'is-secili' : 'is-soluk')
        : harf === q.dogru ? 'is-dogru' : v.h === harf ? 'is-yanlis' : 'is-soluk';
      return html`<button class="${cls('secenek', durum)}" data-act="${o.cevapAct}" data-harf="${harf}"
          ${acik ? raw('disabled aria-disabled="true"') : ''}>
        <span class="secenek__harf" aria-hidden="true">${harf}</span><span class="secenek__metin">${fmt(metin)}</span>
        ${when(acik && !o.gizli && harf === q.dogru, () => html`<span class="sr-only">${yz('ays.ogren.dogru-cevap')}</span>`)}
        ${when(acik && o.gizli && v.h === harf, () => html`<span class="sr-only">${yz('ays.ogren.isaretledigin')}</span>`)}
        ${when(acik && !o.gizli && v.h === harf && harf !== q.dogru, () => html`<span class="sr-only">${yz('ays.ogren.senin-cevabin')}</span>`)}
      </button>`;
    };
    const d = durumOf(q, v);
    const sonuc = (d === 'bakildi' ? yz('ays.ogren.cozume-bakildi-dogru-cevap') + q.dogru
      : d === 'dogru' ? 'Doğru' : yz('ays.ogren.yanlis-senin-cevabin') + (v && v.h) + ', doğrusu ' + q.dogru) + (v && v.ip ? ' · ipucuyla' : '');
    return html`<div class="ogr-soru" aria-live="polite" data-raf-tam>
      <div class="row between gap-8 mb-6">
        <span class="ders__etiket tiny">${o.etiket}</span>
        <span class="row gap-6 align-center">
          ${when(o.karala && window.LIFEOS && window.LIFEOS.DEFTER && window.LIFEOS.DEFTER.kuruluMu(), () => K.Button({ label:yz('ays.ogren.karala'), icon:'edit', size:'sm', tone:'ghost',
            act:'soru-karala', data:{ 'data-karala':karalaKaydi(o.karala, q) } }))}
          ${when(!acik, () => html`<span class="ogr-sayac tiny dim" title="Bu soruda geçen süre" id="ogr-soru-sayac">00:00</span>`)}
          ${when(o.seviye, () => seviyeRozeti(o.seviye))}
        </span>
      </div>
      ${soruMetni(q.soru, q)}
      ${when(q.ipucu && (ipAcik || (acik && v.ip)), () => html`<p class="ogr-ipucu small"><b>${yz('ays.ogren.i-pucu')}</b> ${fmt(q.ipucu)}</p>`)}
      ${when(o.taktikNot && (tkAcik || (acik && d === 'yanlis')), () => html`<div class="ders__taktik-kutu small mt-8 mb-8">
        <div class="row between gap-6"><b class="small" style="color:var(--accent)">${o.taktikNot.baslik}</b><span class="tiny dim">${yz('ays.ogren.akilli-taktik')}</span></div>
        <p class="small mb-0 mt-4">${fmt(o.taktikNot.taktik)}</p>
      </div>`)}
      <div class="secenekler">${map(q.sec, secenek)}</div>
      ${when(!acik && (o.bakAct || (q.ipucu && o.ipucu && !ipAcik) || (o.taktikNot && o.taktik && !tkAcik)), () => html`<div class="row wrap gap-6 mt-10">
        ${when(q.ipucu && o.ipucu && !ipAcik, () => K.Button({ label:yz('ays.ogren.i-pucu-2'), icon:'info', size:'sm', tone:'ghost', act:'soru-ipucu', data:{ 'data-ip':o.ipucu } }))}
        ${when(o.taktikNot && o.taktik && !tkAcik, () => K.Button({ label:yz('ays.ogren.taktik'), icon:'zap', size:'sm', tone:'ghost', act:'soru-taktik', data:{ 'data-tk':o.taktik } }))}
        ${when(o.bakAct, () => K.Button({ label:yz('ays.ogren.cevaplamadan-cozumu-gor'), size:'sm', tone:'ghost', act:o.bakAct }))}
      </div>`)}
      ${when(acik && o.gizli, () => html`<div class="ogr-sonuc is-isaretli"><p class="small"><b>${yz('ays.ogren.i-saretlendi')} ${v.h}</b>
        ${yz('ays.ogren.dogru-cevap-ve-cozum')}</p></div>`)}
      ${when(acik && !o.gizli, () => html`<div class="${cls('ogr-sonuc', 'is-' + d)}">
        <p class="small"><b>${sonuc}</b></p>
        ${when(v && v.sure, () => tempoRozeti(v.sure, o.ders))}
        ${o.ust || ''}
        <div class="ders__etiket tiny mt-10">${yz('ays.ogren.cozum')}</div>
        <ol class="ders__adimlar">${map(dizi(q.cozum), s => html`<li>${fmt(s)}</li>`)}</ol>
        <div class="row wrap gap-6 mt-10">${o.eylemler || ''}</div>
      </div>`)}
    </div>`;
  }

  /* Çözümden sonra: koça sor, karta çevir, yanlışsa deftere ekle. Karma
     ve yeniden çözümde soru, kimliğiyle (data-k: tm-05#2) bilinir. */
  function soruEylemleri(s, v, k){
    const data = k ? { 'data-k':k } : {};
    const yanlis = !!(v && !v.bak && v.h && v.h !== s.q.dogru);
    const defterde = yanlis && O().deftere(s.subject.id, s.topic.id, s.i);
    /* Hata bildirimi (core/ogrentest.js söz 6): kimlik her kipte aynı. */
    const ak = k || (s.topic.id + '#' + s.i), isaret = T().isaretOf(ak);
    return html`
      ${K.Button({ label:yz('ays.ogren.koca-sor'), icon:'zap', size:'sm', tone:'ghost', act:'soru-koca', data })}
      ${K.Button({ label:yz('ays.ogren.karta-cevir'), icon:'cards', size:'sm', tone:'ghost', act:'soru-kart', data })}
      ${when(yanlis, () => defterde
        ? K.Chip('yanlış defterinde')
        : K.Button({ label:yz('ays.ogren.yanlis-defterine-ekle'), icon:'list', size:'sm', tone:'ghost', act:'soru-defter',
            data:Object.assign({ 'data-h':v.h }, data) }))}
      ${isaret
        ? html`${K.Chip('hata bildirdin')}${K.Button({ label:yz('ays.ogren.bildirimi-geri-al'), size:'sm', tone:'ghost', act:'soru-isaret-kaldir', data:{ 'data-k':ak } })}`
        : K.Button({ label:yz('ays.ogren.hata-bildir'), icon:'flag', size:'sm', tone:'ghost', act:'soru-isaret', data:{ 'data-k':ak } })}`;
  }

  /* ---------- Bu konu ---------- */

  function soruKarti(x){
    const { subject, topic } = x;
    const { l, i } = soruNo(x);
    if(!l.length){
      return K.Card({ wide:true,
        body:html`${kartBasi(yz('ays.ogren.ornek-sorular'))}${K.Empty({ icon:'search', text:yz('ays.ogren.bu-konunun-ornek-sorulari-he'),
          action:K.Button({ label:yz('ays.ogren.koc-bir-soru-sorsun'), size:'sm', act:'ogren-git',
            data:{ 'data-route':'koc', 'data-subject':subject.id, 'data-topic':topic.id } }) })}` });
    }
    const q = l[i], c = O().cevaplar(subject.id, topic.id), v = c[i] || null;
    const sk = O().skor(subject.id, topic.id);
    const acik = !!v;
    const sonMu = i === l.length - 1;
    const sonraki = O().komsu(subject.id, topic.id, 1);
    return K.Card({ wide:true,
      body:html`
        ${kartBasi(yz('ays.ogren.ornek-sorular'), sk.cevaplanan ? sk.dogru + ' / ' + sk.toplam + ' doğru · ölçüldü' : sk.toplam + ' soru · ilk cevabın sayılır',
          when(sk.cevaplanan, () => K.Button({ label:yz('ays.ogren.bastan-coz'), icon:'refresh', size:'sm', tone:'ghost', act:'soru-sifirla' })))}
        ${noktalar(l.length, i, k => durumOf(l[k], c[k]), 'soru-git')}
        ${soruGovdesi(q, v, { etiket:yz('ays.ogren.soru') + (i + 1) + ' / ' + l.length, seviye:O().seviye(topic.id, i),
          ipucu:'konu:' + topic.id + '#' + i, taktik:'konu:' + topic.id, taktikNot:O().akilliNot(topic.id),
          ders:subject.id, karala:{ baslik:yz('ays.ogren.soru-notu') + topic.name + ' · ' + (i + 1) + '. soru' },
          cevapAct:'soru-cevap', bakAct:'soru-bak',
          eylemler:soruEylemleri({ subject, topic, i, q }, v, null) })}
        <div class="row between wrap gap-6 mt-16">
          ${i > 0 ? K.Button({ label:yz('ays.ogren.onceki'), icon:'left', size:'sm', tone:'ghost', act:'soru-git', data:{ 'data-i':String(i - 1) } }) : html`<span></span>`}
          ${!sonMu ? K.Button({ label:yz('ays.ogren.sonraki-soru'), icon:'right', size:'sm', tone:acik ? 'primary' : null, act:'soru-git', data:{ 'data-i':String(i + 1) } })
            : sonraki ? K.Button({ label:yz('ays.ogren.sonraki-konu'), icon:'right', size:'sm', tone:acik ? 'primary' : null, act:'ogren-git',
                data:{ 'data-route':'anlatim', 'data-subject':sonraki.subject.id, 'data-topic':sonraki.topic.id } })
            : html`<span></span>`}
        </div>
        <p class="tiny dim mt-12">${yz('ays.ogren.sorular-elle-yazildi-dogrula')}</p>`,
    });
  }

  /* ---------- Karma test ---------- */

  function kapsamAdi(k){
    if(k && k.prova) return yz('ays.ogren.sinav-provasi-2') + ((T().PROVA[k.prova] || {}).ad || k.prova);
    const s = R.SUBJECTS.find(x => x.id === (k && k.ders));
    return (s ? s.name : yz('ays.ogren.butun-dersler')) + ' · ' + (k && k.konular === 'okunan' ? 'okuduğum konular' : 'bütün konular')
      + (k && k.seviye === 'sinav' ? ' · sınav tarzı' : '');
  }
  const tarihAdi = iso => { try{ return U.fmtShort(String(iso).slice(0, 10)); }catch(e){ return String(iso).slice(0, 10); } };
  const DERSLER = () => [{ value:'hepsi', label:yz('ays.ogren.butun-dersler') }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name })));
  /* Seçilmemişse kapsam: okuduğun konularda yeterli soru varsa onlar. */
  function karmaKapsami(){
    const ders = S.ui.karmaDers || 'hepsi';
    const okunan = T().havuz({ ders, konular:'okunan' }).length;
    return { ders, okunan, konular:S.ui.karmaKonular || (okunan >= T().EN_AZ ? 'okunan' : 'hepsi'),
      seviye:S.ui.karmaSeviye === 'sinav' ? 'sinav' : 'hepsi' };
  }

  function karmaKurulum(){
    const k = karmaKapsami();
    const hepsi = T().havuz({ ders:k.ders, konular:'hepsi' }).length;
    const boy = T().BOYLAR.indexOf(Number(S.ui.karmaBoy)) >= 0 ? Number(S.ui.karmaBoy) : T().BOYLAR[0];
    return K.Card({ wide:true,
      body:html`${kartBasi(yz('ays.ogren.karma-test'), yz('ays.ogren.konular-karisik-gelir-her-so'))}
        <div class="ogr-kurulum">
          ${K.Field({ label:yz('ays.ogren.ders'), input:K.Select({ id:'karma-ders', options:DERSLER(), value:k.ders, change:'karma-ders', aria:yz('ays.ogren.ders') }) })}
          <div><span class="ders__etiket tiny">${yz('ays.ogren.konular')}</span>${K.Segmented({ act:'karma-konular', value:k.konular, aria:yz('ays.ogren.konular'), items:[
            { value:'okunan', label:yz('ays.ogren.okuduklarim') + k.okunan }, { value:'hepsi', label:yz('ays.ogren.hepsi-2') + hepsi }] })}</div>
          <div><span class="ders__etiket tiny">${yz('ays.ogren.seviye')}</span>${K.Segmented({ act:'karma-seviye', value:k.seviye, aria:yz('ays.ogren.seviye'), items:[
            { value:'hepsi', label:yz('ays.ogren.hepsi') }, { value:'sinav', label:yz('ays.ogren.sinav-tarzi') + T().havuz({ ders:k.ders, konular:k.konular, seviye:'sinav' }).length }] })}</div>
          <div><span class="ders__etiket tiny">${yz('ays.ogren.soru-sayisi')}</span>${K.Segmented({ act:'karma-boy', value:boy, aria:yz('ays.ogren.soru-sayisi'),
            items:T().BOYLAR.map(n => ({ value:n, label:String(n) })) })}</div>
        </div>
        <div class="mt-16">${K.Button({ label:yz('ays.ogren.testi-baslat'), icon:'right', tone:'primary', act:'karma-baslat' })}</div>
        <p class="tiny dim mt-12">${yz('ays.ogren.seceneklerdeki-sayi-havuzdak')}</p>` });
  }

  function gecmisKarti(){
    const l = T().gecmis();
    if(!l.length) return null;
    return K.Card({ title:yz('ays.ogren.gecmis-testler'), sub:U.plural(l.length, 'test', 'test') + ' · ölçüldü',
      body:html`<div class="list list--sik">${map(l.slice(0, 8), t => html`<button class="listitem listitem--tap ogr-konu" data-act="karma-sonuc" data-id="${t.id}">
        <span class="grow minw0"><span class="small strong">${t.dogru} / ${t.toplam} ${yz('ays.ogren.dogru')}</span>
          <span class="tiny dim">${tarihAdi(t.at)} · ${kapsamAdi(t.kapsam)}${t.bos ? ' · ' + t.bos + ' boş' : ''}</span></span>
        <span class="ogr-konu__ok" aria-hidden="true">${raw(UI.icon('right'))}</span></button>`)}</div>` });
  }

  /* SINAV PROVASI (core/ogrentest.js söz 7): geri sayım ve tempo. Tempo
     eşik çubuğu: cevaplanan oranı, geçen sürenin oranına karşı; üstündeysen
     sınav temposunun önündesin. */
  const sureYaz = sn => { sn = Math.max(0, Number(sn) || 0); const d = Math.floor(sn / 60), s = sn % 60; return (d < 10 ? '0' : '') + d + ':' + (s < 10 ? '0' : '') + s; };
  function provaUst(a, sy){
    const kalan = T().kalanSn(), top = a.prova.sureDk * 60;
    const gecen = Math.max(0, top - (kalan || 0));
    const G = (window.LIFEOS || {}).GRAFIK;
    const tempo = G ? G.esikCubukHtml({ deger:Math.round(sy.cevaplanan * 100 / sy.toplam), esik:Math.round(gecen * 100 / top),
      olcek:100, birim:'%', etiket:yz('ays.ogren.tempo-cevaplanan-gecen'), yon:'artis-iyi' }) : '';
    return html`<div class="ogr-prova-ust mt-10">
      <span class="ogr-prova-kalan" id="ogr-prova-kalan" role="timer" aria-label="Kalan süre">${sureYaz(kalan)}</span>
      <span class="tiny dim">${yz('ays.ogren.kalan')} ${a.prova.sureDk} dk</span></div>
      <div class="mt-8">${raw(tempo)}</div>`;
  }

  function karmaSoruKarti(){
    const a = T().aktif(), y = T().siradaki(), sy = T().say(a);
    const prova = !!a.prova;
    const sonMu = y.sira === y.toplam - 1;
    const durum = k => { const s = T().soruOf(a.sorular[k]); return !s ? 'bos' : prova ? (a.cevaplar[k] ? 'isaretli' : 'bos') : durumOf(s.q, a.cevaplar[k]); };
    const bas = html`${kartBasi(prova ? yz('ays.ogren.sinav-provasi') : yz('ays.ogren.karma-test'), kapsamAdi(a.kapsam) + ' · ' + sy.cevaplanan + ' / ' + sy.toplam + (prova ? ' işaretlendi' : ' cevaplandı'),
      K.Button({ label:yz('ays.ogren.vazgec'), size:'sm', tone:'ghost', act:'karma-vazgec' }))}${prova ? provaUst(a, sy) : ''}`;
    const nav = html`<div class="row between wrap gap-6 mt-16">
      ${y.sira > 0 ? K.Button({ label:yz('ays.ogren.onceki'), icon:'left', size:'sm', tone:'ghost', act:'test-git', data:{ 'data-i':String(y.sira - 1) } }) : html`<span></span>`}
      ${!sonMu ? K.Button({ label:yz('ays.ogren.sonraki-soru'), icon:'right', size:'sm', tone:y.v ? 'primary' : null, act:'test-git', data:{ 'data-i':String(y.sira + 1) } })
        : K.Button({ label:yz('ays.ogren.testi-bitir'), icon:'check', size:'sm', tone:'primary', act:'karma-bitir' })}
    </div>`;
    const erken = when(!sonMu, () => html`<div class="mt-10">${K.Button({ label:prova ? yz('ays.ogren.provayi-simdi-bitir') : yz('ays.ogren.testi-simdi-bitir'), size:'sm', tone:'ghost', act:'karma-bitir' })}</div>`);
    if(!y.s){
      return K.Card({ wide:true, body:html`${bas}${noktalar(y.toplam, y.sira, durum, 'test-git')}
        ${K.Notice({ tone:'info', body:yz('ays.ogren.bu-soru-icerikten-kaldirildi') })}${nav}${erken}` });
    }
    const ust = y.v && !prova ? html`<p class="tiny dim mt-6">Konu: ${y.s.subject.name} · ${y.s.topic.name}</p>` : '';
    return K.Card({ wide:true,
      body:html`${bas}
        ${noktalar(y.toplam, y.sira, durum, 'test-git')}
        ${soruGovdesi(y.s.q, y.v, prova
          ? { etiket:y.s.subject.name + ' · soru ' + (y.sira + 1) + ' / ' + y.toplam, cevapAct:'test-cevap', ders:y.s.subject.id, gizli:true }
          : { etiket:yz('ays.ogren.soru') + (y.sira + 1) + ' / ' + y.toplam, seviye:O().seviye(y.s.topic.id, y.s.i),
          ipucu:'test:' + a.id + '#' + y.sira, cevapAct:'test-cevap', bakAct:'test-bak',
          ders:y.s.subject.id,
          ust, eylemler:soruEylemleri(y.s, y.v, y.s.k) })}
        ${nav}${erken}` });
  }

  function karmaSonucKarti(oz){
    return K.Card({ wide:true,
      body:html`${kartBasi(yz('ays.ogren.test-sonucu'), tarihAdi(oz.at) + ' · ' + kapsamAdi(oz.kapsam) + ' · ölçüldü',
          K.Button({ label:yz('ays.ogren.yeni-test'), size:'sm', tone:'ghost', act:'karma-yeni' }))}
        <div class="ogr-sayilar">
          ${K.Stat({ label:yz('ays.ogren.dogru-2'), value:oz.dogru, unit:' / ' + oz.toplam })}
          ${K.Stat({ label:yz('ays.ogren.yanlis'), value:oz.yanlis })}
          ${K.Stat({ label:yz('ays.ogren.bos'), value:oz.bos })}
          ${K.Stat({ label:yz('ays.ogren.cozume-bakildi'), value:oz.bakildi })}
        </div>
        ${when(oz.ortSure, () => html`<div class="mt-10 row gap-6 align-center">
          ${K.Chip({ label:yz('ays.ogren.ortalama') + oz.ortSure + ' sn / soru', tone:oz.ortSure <= 80 ? 'ok' : oz.ortSure <= 120 ? 'warn' : 'danger' })}
          <span class="tiny dim">${oz.ortSure <= 80 ? '⚡ seri tempo (sınav ritmi)' : oz.ortSure <= 120 ? '⏱️ dengeli tempo' : '⏳ yavaş tempo'}</span>
        </div>`)}
        ${when(oz.konular.length, () => html`<div class="ders__etiket tiny mt-16">${yz('ays.ogren.konu-konu-yanlisi-olan')}</div>
          <div class="list list--sik" data-raf-tam>${map(oz.konular, k => html`<div class="listitem ogr-konu">
            <span class="${cls('ogr-konu__no', k.dogru === k.n ? 'is-tamam' : 'is-eksik')}" aria-hidden="true">${raw(UI.icon(k.dogru === k.n ? 'check' : 'close'))}</span>
            <span class="grow minw0"><span class="small strong ogr-konu__ad">${k.topic.name}</span>
              <span class="tiny dim">${k.subject.name} · ${k.dogru} / ${k.n} ${yz('ays.ogren.dogru')}</span></span>
            ${when(k.dogru < k.n, () => K.Button({ label:yz('ays.ogren.anlatim'), size:'sm', tone:'ghost', act:'ogren-git',
              data:{ 'data-route':'anlatim', 'data-subject':k.subject.id, 'data-topic':k.topic.id } }))}
          </div>`)}</div>`)}
        ${when(oz.yanlis + oz.bakildi, () => html`<div class="mt-16">${K.Button({ label:yz('ays.ogren.yanlislari-yeniden-coz'), icon:'right', tone:'primary', size:'sm',
          act:'sorular-kip', data:{ 'data-tab':'yanlis' } })}</div>`)}
        <p class="tiny dim mt-12">${yz('ays.ogren.bu-sonuc-bir-olcumdur-plan')}</p>` });
  }

  function provaKurulum(){
    const sinav = T().PROVA[S.ui.provaSinav] ? S.ui.provaSinav : 'TYT';
    const boy = T().PROVA_BOY.indexOf(Number(S.ui.provaBoy)) >= 0 ? Number(S.ui.provaBoy) : T().PROVA_BOY[0];
    const p = T().provaPlani(sinav, boy), P = T().PROVA[sinav];
    return K.Card({ wide:true,
      body:html`${kartBasi(yz('ays.ogren.sinav-provasi'), yz('ays.ogren.gercek-sinavin-sirasi-orani'))}
        <div class="ogr-kurulum">
          <div><span class="ders__etiket tiny">${yz('ays.ogren.sinav')}</span>${K.Segmented({ act:'prova-sinav', value:sinav, aria:yz('ays.ogren.sinav'),
            items:Object.keys(T().PROVA).map(k => ({ value:k, label:T().PROVA[k].ad })) })}</div>
          <div><span class="ders__etiket tiny">${yz('ays.ogren.soru-sayisi')}</span>${K.Segmented({ act:'prova-boy', value:boy, aria:yz('ays.ogren.soru-sayisi'),
            items:T().PROVA_BOY.map(n => ({ value:n, label:String(n) })) })}</div>
        </div>
        <div class="ogr-prova-plan mt-12">${map(p.dersler, d => html`<span class="${cls('ogr-prova-ders', d.havuz < d.n && 'is-eksik')}"
          title="${d.havuz < d.n ? yz('ays.ogren.havuzda-2') + d.havuz + ' soru var' : ''}"><b>${d.n}</b> ${d.ad}</span>`)}
          <span class="ogr-prova-ders"><b>${p.sureDk}</b> dk</span></div>
        <div class="mt-16">${K.Button({ label:yz('ays.ogren.provayi-baslat'), icon:'right', tone:'primary', act:'prova-baslat' })}</div>
        <p class="tiny dim mt-12">${yz('ays.ogren.sure-gercek-sinavin-soru-bas')}${P.ad}: ${P.dk} ${yz('ays.ogren.dk')} ${P.soru} ${yz('ays.ogren.soru-osym-sinavda-dogru-yanl')}</p>` });
  }
  function provaSonucKarti(oz){
    const p = oz.prova, P = (window.LIFEOS || {}).PANO;
    const virgul = x => String(x).replace('.', ',');
    const satir = d => ({ ad:d.ad, oran:d.n ? d.dogru / d.n : null, metin:yz('ays.ogren.net') + virgul(d.net) });
    return K.Card({ wide:true,
      body:html`${kartBasi(yz('ays.ogren.prova-sonucu'), tarihAdi(oz.at) + ' · ' + p.ad + ' · ' + oz.toplam + ' soru',
          K.Button({ label:yz('ays.ogren.yeni-prova'), size:'sm', tone:'ghost', act:'prova-yeni' }))}
        <div class="ogr-sayilar">
          ${K.Stat({ label:yz('ays.ogren.net-hesaplandi'), value:virgul(p.net), unit:' / ' + oz.toplam })}
          ${K.Stat({ label:yz('ays.ogren.dogru-2'), value:oz.dogru })}
          ${K.Stat({ label:yz('ays.ogren.yanlis'), value:oz.yanlis })}
          ${K.Stat({ label:yz('ays.ogren.bos'), value:oz.bos })}
        </div>
        ${when(p.kullanilanDk != null, () => html`<p class="small mt-10">${Math.min(p.kullanilanDk, p.sureDk)} / ${p.sureDk} ${yz('ays.ogren.dk-kullanildi')}</p>`)}
        ${when(P && p.dersler.length, () => html`<div class="ders__etiket tiny mt-16">${yz('ays.ogren.test-test-cubuk-dogru')}</div>
          <div class="mt-8">${raw(P.cubuklar({ satirlar:p.dersler.map(satir),
            etiket:p.dersler.map(d => d.ad + ': ' + d.dogru + ' doğru, ' + d.yanlis + ' yanlış, ' + d.bos + ' boş, net ' + virgul(d.net)).join('; ') }))}</div>`)}
        <p class="tiny dim mt-12">${yz('ays.ogren.net-dogru-yanlis')}</p>` });
  }
  function provaKip(){
    const a = T().aktif();
    if(a && a.prova) return [karmaSoruKarti()];
    if(a) return [K.Card({ wide:true, body:html`${K.Notice({ tone:'info', body:yz('ays.ogren.suren-bir-karma-test-var') })}
      <div class="mt-10">${K.Button({ label:yz('ays.ogren.karma-teste-don'), size:'sm', tone:'primary', act:'sorular-kip', data:{ 'data-tab':'karma' } })}</div>` })];
    const oz = S.ui.provaSonuc ? T().gecmis().find(t => t.id === S.ui.provaSonuc) : null;
    const gecmis = T().gecmis().filter(t => t.prova);
    const liste = gecmis.length ? K.Card({ title:yz('ays.ogren.gecmis-provalar'), sub:U.plural(gecmis.length, 'prova', 'prova') + ' · net hesaplandı',
      body:html`<div class="list list--sik">${map(gecmis.slice(0, 8), t => html`<button class="listitem listitem--tap ogr-konu" data-act="prova-sonuc" data-id="${t.id}">
        <span class="grow minw0"><span class="small strong">net ${String(t.prova.net).replace('.', ',')} · ${t.dogru} / ${t.toplam} ${yz('ays.ogren.dogru')}</span>
          <span class="tiny dim">${tarihAdi(t.at)} · ${t.prova.ad}</span></span>
        <span class="ogr-konu__ok" aria-hidden="true">${raw(UI.icon('right'))}</span></button>`)}</div>` }) : null;
    return (oz && oz.prova ? [provaSonucKarti(oz), karmaSonucKarti(oz)] : [provaKurulum()]).concat(liste ? [liste] : []);
  }

  function karmaKip(){
    const ak = T().aktif();
    if(ak && ak.prova) return [K.Card({ wide:true, body:html`${K.Notice({ tone:'info', body:yz('ays.ogren.suren-bir-sinav-provasi-var') })}
      <div class="mt-10">${K.Button({ label:yz('ays.ogren.provaya-don'), size:'sm', tone:'primary', act:'sorular-kip', data:{ 'data-tab':'prova' } })}</div>` })];
    if(ak) return [karmaSoruKarti()];
    const sid = S.ui.karmaSonuc;
    const oz = sid ? T().gecmis().find(t => t.id === sid) : null;
    return oz ? [karmaSonucKarti(oz), gecmisKarti()] : [karmaKurulum(), gecmisKarti()];
  }

  /* ---------- Yanlışlarım ---------- */

  /* Sıradaki yanlış: en eski deneme önce — yeniden yanlış çözülen soru
     en yeni olur ve sıranın sonuna gider, aynı iki soru arasında dönülmez. */
  const enEski = l => l.reduce((a, b) => (b.son.at < a.son.at ? b : a), l[0]);
  function kisaSoru(q){
    const kok = O().duzMetin(q.soru).split('\n').pop();
    return kok.length > 90 ? kok.slice(0, 89).replace(/\s+\S*$/, '') + '…' : kok;
  }

  function yanlisListesi(){
    const ders = S.ui.yanlisDers || 'hepsi';
    const l = T().yanlislar(ders);
    const hepsi = ders === 'hepsi' ? l.length : T().yanlislar().length;
    return K.Card({ title:yz('ays.ogren.yanlislarim-2'), wide:true,
      sub:l.length ? U.plural(l.length, 'soru', 'soru') + ' · son denemesi doğru olmayanlar' : null,
      actions:when(hepsi, () => K.Select({ id:'yanlis-ders', options:DERSLER(), value:ders, change:'yanlis-ders', aria:yz('ays.ogren.ders'), size:'sm' })),
      body:l.length ? html`<div class="stack-sm">
          <div>${K.Button({ label:yz('ays.ogren.sirayla-coz'), icon:'right', tone:'primary', size:'sm', act:'tekrar-ac', data:{ 'data-k':enEski(l).k } })}</div>
          <div class="list list--sik" data-raf-tam>${map(l, y => html`<button class="listitem listitem--tap ogr-konu" data-act="tekrar-ac" data-k="${y.k}">
            <span class="ogr-konu__no num" aria-hidden="true">${typeof y.i === 'string' ? 'P' : y.i + 1}</span>
            <span class="grow minw0"><span class="small strong ogr-konu__ad">${y.topic.name}</span>
              <span class="tiny ogr-konu__ad">${kisaSoru(y.q)}</span>
              <span class="tiny dim">${y.subject.name} · ${y.son.bak ? 'çözüme bakıldı' : 'cevabın ' + y.son.h} · ${KAYNAK_AD[y.son.kaynak]} · ${tarihAdi(y.son.at)}</span></span>
            <span class="ogr-konu__ok" aria-hidden="true">${raw(UI.icon('right'))}</span></button>`)}</div>
          <p class="tiny dim">${yz('ays.ogren.bir-soru-yeniden-dogru-cozul')}</p></div>`
        : K.Empty({ icon:'check', text:hepsi ? yz('ays.ogren.bu-derste-yanlisin-yok')
            : yz('ays.ogren.yanlisin-yok-konu-sorularind') }) });
  }

  function tekrarKarti(){
    const t = S.ui.ogrTekrar;
    const s = t && T().soruOf(t.k);
    if(!s){ S.ui.ogrTekrar = null; return yanlisListesi(); }
    const v = t.h ? { h:t.h, ip:t.ip, sure:t.sure } : null;
    const kalan = T().yanlislar(S.ui.yanlisDers || 'hepsi').filter(y => y.k !== t.k);
    return K.Card({ wide:true,
      body:html`${kartBasi(yz('ays.ogren.yeniden-coz'), s.subject.name + ' · ' + s.topic.name + (kalan.length ? ' · ' + kalan.length + ' yanlış daha' : ''),
          K.Button({ label:yz('ays.ogren.listeye-don'), size:'sm', tone:'ghost', act:'tekrar-kapat' }))}
        ${soruGovdesi(s.q, v, { etiket:soruAdi(s), seviye:O().seviye(s.topic.id, s.i), ipucu:'tekrar:' + s.k, cevapAct:'tekrar-cevap',
          ders:s.subject.id,
          ust:v && v.h === s.q.dogru ? html`<p class="tiny dim mt-6">${yz('ays.ogren.dogru-cozdun-yanlislarim-dan')}</p>` : '',
          eylemler:soruEylemleri(s, v, s.k) })}
        ${when(v, () => html`<div class="row between wrap gap-6 mt-16">
          ${K.Button({ label:yz('ays.ogren.anlatim'), icon:'book', size:'sm', tone:'ghost', act:'ogren-git',
            data:{ 'data-route':'anlatim', 'data-subject':s.subject.id, 'data-topic':s.topic.id } })}
          ${kalan.length ? K.Button({ label:yz('ays.ogren.siradaki-yanlis'), icon:'right', size:'sm', tone:'primary', act:'tekrar-ac', data:{ 'data-k':enEski(kalan).k } })
            : K.Button({ label:yz('ays.ogren.listeye-don'), size:'sm', tone:'primary', act:'tekrar-kapat' })}
        </div>`)}` });
  }

  /* Bildirdiğin hatalar: işaretli sorular, notlarıyla; liste kopyalanıp
     iletilebilir. Cevap anahtarı değişmez (core/ogrentest.js söz 6). */
  function isaretKarti(){
    const l = T().isaretliler();
    if(!l.length) return '';
    return K.Card({ title:yz('ays.ogren.bildirdigin-hatalar'), wide:true,
      sub:U.plural(l.length, 'soru', 'soru') + ' · karma testten çıkarıldı',
      actions:K.Button({ label:yz('ays.ogren.listeyi-kopyala'), icon:'file', size:'sm', tone:'ghost', act:'isaret-kopyala' }),
      body:html`<div class="list list--sik" data-raf-tam>${map(l, y => html`<div class="listitem ogr-konu">
          <span class="grow minw0"><span class="small strong ogr-konu__ad">${y.topic.name}</span>
            <span class="tiny ogr-konu__ad">${kisaSoru(y.q)}</span>
            <span class="tiny dim">${y.subject.name} · ${tarihAdi(y.isaret.at)}${y.isaret.not ? ' · «' + y.isaret.not + '»' : ''}</span></span>
          ${K.Button({ label:yz('ays.ogren.ac-2'), size:'sm', tone:'ghost', act:'tekrar-ac', data:{ 'data-k':y.k } })}
          ${K.Button({ label:yz('ays.ogren.kaldir'), size:'sm', tone:'ghost', act:'soru-isaret-kaldir', data:{ 'data-k':y.k } })}</div>`)}</div>
        <p class="tiny dim">${yz('ays.ogren.uygulamadaki-cevap-degismez')}</p>` });
  }

  function yanlisKip(){ return [S.ui.ogrTekrar ? tekrarKarti() : yanlisListesi(), isaretKarti()]; }

  /* ---------- Günlük paragraf (core/paragraf.js) ----------
     Paragraf çıpasının uygulama içindeki hâli: günün seti kodla seçilir,
     ilk cevap kilitlidir; set bitince çözülen sayı kullanıcının dokunuşuyla
     katalogdaki 'paragraf-yaz' eylemiyle gün kaydına yazılır. */
  const P = () => R.Paragraf;
  function parKarti(){
    const g = P() && P().gunu();
    const l = g ? g.sorular.map(id => P().bul(id)).filter(Boolean) : [];
    if(!l.length){
      return K.Card({ wide:true, body:html`${kartBasi(yz('ays.ogren.gunluk-paragraf'))}${K.Empty({ icon:'book', text:yz('ays.ogren.paragraf-havuzu-henuz-bos') })}` });
    }
    const i = Math.max(0, Math.min(l.length - 1, Number(S.ui.parSira) || 0));
    const q = l[i], v = g.cevaplar[q.id] || null, o = P().ozet(), du = P().durum(), yazim = P().yazim();
    const x = O().konuyuBul(q.konu), ak = P().anahtar(q);
    const day = S.days[U.todayISO()];
    const cipa = day && Number(day.paragraphTarget) > 0
      ? yz('ays.ogren.bugunun-paragraf-cipasi') + (day.paragraphActual == null ? '—' : day.paragraphActual) + ' / ' + day.paragraphTarget : null;
    const sonMu = i === l.length - 1;
    return K.Card({ wide:true,
      body:html`
        ${kartBasi(yz('ays.ogren.gunluk-paragraf'), (o.cevaplanan ? o.dogru + ' / ' + o.toplam + ' doğru · ölçüldü' : o.toplam + ' soru · ilk cevabın sayılır')
          + (cipa ? ' · ' + cipa : ''))}
        ${when(!o.cevaplanan && !yazim, () => html`<div class="row wrap gap-6 mb-10" role="group" aria-label="Günlük soru sayısı">
          <span class="tiny dim">${yz('ays.ogren.gunde')}</span>
          ${map(P().BOYLAR, n => K.Button({ label:n + ' soru', size:'sm', tone:n === du.boy ? 'primary' : 'ghost', act:'par-boy',
            data:{ 'data-n':String(n), 'aria-pressed':n === du.boy ? 'true' : 'false' } }))}</div>`)}
        ${noktalar(l.length, i, k => durumOf(l[k], g.cevaplar[l[k].id]), 'par-git')}
        ${soruGovdesi(q, v, { etiket:yz('ays.ogren.paragraf') + (i + 1) + ' / ' + l.length + ' · ' + (x.topic ? x.topic.name : ''), seviye:q.seviye || 'orta',
          ipucu:'par:' + q.id, cevapAct:'par-cevap', bakAct:'par-bak',
          ders:'tyt-turkce',
          eylemler:x.topic ? soruEylemleri({ subject:x.subject, topic:x.topic, i:q.id, q }, v, ak) : '' })}
        <div class="row between wrap gap-6 mt-16">
          ${i > 0 ? K.Button({ label:yz('ays.ogren.onceki'), icon:'left', size:'sm', tone:'ghost', act:'par-git', data:{ 'data-i':String(i - 1) } }) : html`<span></span>`}
          ${!sonMu ? K.Button({ label:yz('ays.ogren.sonraki-paragraf'), icon:'right', size:'sm', tone:v ? 'primary' : null, act:'par-git', data:{ 'data-i':String(i + 1) } }) : html`<span></span>`}
        </div>
        ${when(o.bitti, () => html`<div class="ogr-sonuc is-${o.yanlis || o.bakildi ? 'yanlis' : 'dogru'} mt-16">
          <p class="small"><b>${yz('ays.ogren.bugunun-seti-bitti')} ${o.dogru} / ${o.toplam} ${yz('ays.ogren.dogru')}</b>${o.bakildi ? ' · ' + o.bakildi + ' sorunun çözümüne bakıldı' : ''} ${yz('ays.ogren.olculdu')}</p>
          ${yazim
            ? html`<div class="row wrap gap-6 mt-10">${K.Chip('gün kaydına yazıldı · +' + yazim.n)}</div>
                <p class="tiny dim mt-6">${yz('ays.ogren.geri-almak-istersen-onaylar')}</p>`
            : o.cozulen
              ? html`<div class="row wrap gap-6 mt-10">${K.Button({ label:yz('ays.ogren.gunun-paragraf-sayisina-ekle') + o.cozulen + ')', icon:'plus',
                  size:'sm', tone:'primary', act:'par-yaz' })}</div>
                <p class="tiny dim mt-6">${yz('ays.ogren.bugun-deki-paragraf-cipasina')}</p>`
              : html`<p class="tiny dim mt-6">${yz('ays.ogren.butun-sorularin-cozumune-bak')}</p>`}
        </div>`)}
        <p class="tiny dim mt-12">${yz('ays.ogren.havuzda')} ${du.toplam} ${yz('ays.ogren.paragraf-sorusu-var')} ${du.yeni} ${yz('ays.ogren.tanesi-henuz-sana-gelmedi-se')}</p>`,
    });
  }
  function parKip(){ return [parKarti()]; }

  /* ---------- ekran ---------- */

  function kipSekmeleri(kip){
    const a = T().aktif(), n = T().yanlislar().length;
    const po = P() && P().gunu() ? P().ozet() : null;
    return K.Subtabs({ act:'sorular-kip', value:kip, aria:yz('ays.ogren.soru-kipi'), items:[
      { id:'konu', label:yz('ays.ogren.bu-konu') },
      { id:'paragraf', label:yz('ays.ogren.gunluk-paragraf'), count:po && po.toplam ? po.cevaplanan + '/' + po.toplam : null },
      { id:'karma', label:yz('ays.ogren.karma-test'), count:a && !a.prova ? T().say(a).cevaplanan + '/' + a.sorular.length : null },
      { id:'prova', label:yz('ays.ogren.sinav-provasi'), count:a && a.prova ? T().say(a).cevaplanan + '/' + a.sorular.length : null },
      { id:'yanlis', label:yz('ays.ogren.yanlislarim-2'), count:n || null },
    ] });
  }
  const kipOf = () => ['konu', 'paragraf', 'karma', 'prova', 'yanlis'].indexOf(S.ui.ogrenKip) >= 0 ? S.ui.ogrenKip : 'konu';

  /* Bir sorunun kimliği: data-k varsa o (karma, yeniden çözüm), yoksa
     bu konunun ekrandaki sorusu. */
  function soruRef(el){
    const k = el && el.dataset && el.dataset.k;
    if(k){ const s = T().soruOf(k); return s ? { subject:s.subject, topic:s.topic, i:s.i, q:s.q } : null; }
    const x = O().secili();
    if(!x.topic) return null;
    const { l, i } = soruNo(x);
    return l[i] ? { subject:x.subject, topic:x.topic, i, q:l[i] } : null;
  }

  LIFEOS.PARCA.blok({ id:'sorular.soru-sekmeleri', sayfa:'sorular', yer:'ana', sira:10, ad:'Soru sekmeleri', ciz({ kip, sekme, x }){ return sekme; } });
LIFEOS.PARCA.blok({ id:'sorular.konu-cubugu', sayfa:'sorular', yer:'ana', sira:20, ad:'Konu çubuğu', ciz({ kip, sekme, x }){ return raw(konuCubugu(x)); } });
LIFEOS.PARCA.blok({ id:'sorular.sorukarti', sayfa:'sorular', yer:'ana', sira:30, ad:'Soru kartı', ciz({ kip, sekme, x }){ return soruKarti(x); } });
  R.Screens.sorular = {
    id:'sorular',
    title:yz('ays.ogren.sorular'),
    subtitle(){
      const kip = kipOf();
      if(kip === 'karma') return yz('ays.ogren.konular-karisik-sonuc-konu-k');
      if(kip === 'prova') return yz('ays.ogren.gercek-sinavin-temposu-sonuc');
      if(kip === 'yanlis') return yz('ays.ogren.yanlis-cozduklerini-yeniden');
      if(kip === 'paragraf') return yz('ays.ogren.her-gun-birkac-paragraf-biti');
      const x = O().secili(); return x.topic ? x.subject.name + ' · ' + x.topic.name : yz('ays.ogren.ornek-sorular');
    },
    actions(){ return ''; },
    async render(){
      const kip = kipOf();
      const sekme = raw(kipSekmeleri(kip));
      setTimeout(baslatSoruSayac, 30);
      if(kip === 'karma') return String(K.Grid([K.Span(12, K.Stack([sekme].concat(karmaKip())))]));
      if(kip === 'prova'){
        const a = T().aktif();
        if(a && a.prova && T().kalanSn() === 0){ const oz = await T().bitir(); S.ui.provaSonuc = oz ? oz.id : null; }
        return String(K.Grid([K.Span(12, K.Stack([raw(kipSekmeleri(kip))].concat(provaKip())))]));
      }
      if(kip === 'yanlis') return String(K.Grid([K.Span(12, K.Stack([sekme].concat(yanlisKip())))]));
      if(kip === 'paragraf'){
        if(P()) await P().hazirla();
        return String(K.Grid([K.Span(12, K.Stack([raw(kipSekmeleri(kip))].concat(parKip())))]));
      }
      const x = await hazirla();
      if(!x.topic) return String(K.Card({ body:K.Empty({ icon:'search', text:yz('ays.ogren.konu-yok') }) }));
      const parcaB = { kip, sekme, x };
      return String(K.Grid([K.Span(12, K.Stack(LIFEOS.PARCA.liste('sorular', 'ana', K, parcaB)))]));
    },
    handle:Object.assign({}, ortakHandle, {
      /* Bu konu */
      async 'soru-git'(el){ S.ui.ogrenSoru = Number(el.dataset.i) || 0; soruSifirlaSure(); R.App.render(); },
      async 'soru-cevap'(el){
        const x = O().secili(), { i } = soruNo(x);
        const sure = gecenSure();
        await O().cevapla(x.subject.id, x.topic.id, i, el.dataset.harf, S.ui.ipucu === 'konu:' + x.topic.id + '#' + i, sure);
        R.App.render();
      },
      async 'soru-ipucu'(el){ S.ui.ipucu = el.dataset.ip || null; R.App.render(); },
      async 'soru-karala'(el){
        const D = window.LIFEOS && window.LIFEOS.DEFTER, k = KARALA.get(el.dataset.karala);
        if(!D || !k) return;
        const H = O().HARFLER;
        const ust = U.esc(k.soru) + (k.sec.length ? '<br/>' + k.sec.map((s, j) => '<b>' + H[j] + ')</b> ' + U.esc(s)).join(' · ') : '');
        D.tuval({ baslik:k.baslik, ust, kagit:'kareli', dugme:yz('ays.ogren.deftere-ekle'), kaydet:async b => {
          const n = await D.notOlustur({ baslik:k.baslik, ekle:true,
            govde:'> ' + k.soru.replace(/\s+/g, ' ').slice(0, 400) + '\n{{ekler}}\n\n#soru', ekler:[{ blob:b, ad:'karalama.png', tur:'cizim' }] });
          UI.toast(yz('ays.ogren.karalaman-deftere-eklendi-no'), { undo:async () => { /* not birikir; yalnız tek karalamalıysa sil */ if((n.govde.match(/medya:/g) || []).length === 1) await D.sil(n.id); } });
        } });
      },
      async 'soru-taktik'(el){ S.ui.taktik = S.ui.taktik === el.dataset.tk ? null : el.dataset.tk; R.App.render(); },
      async 'soru-bak'(){
        const x = O().secili(), { i } = soruNo(x);
        const sure = gecenSure();
        await O().bak(x.subject.id, x.topic.id, i, sure);
        R.App.render();
      },
      async 'soru-sifirla'(){
        const x = O().secili();
        UI.confirmSheet(yz('ays.ogren.bastan-coz'), yz('ays.ogren.bu-konudaki-ornek-soru-cevap'),
          async () => { await O().sifirla(x.subject.id, x.topic.id); S.ui.ogrenSoru = 0; soruSifirlaSure(); R.App.render(); }, false, yz('ays.ogren.bastan-coz'));
      },
      /* Üç kipte ortak: soruyu koça, karta, deftere. */
      async 'soru-koca'(el){
        const r = soruRef(el);
        if(!r) return;
        const d = O().duzMetin, q = r.q;
        await O().sec(r.subject.id, r.topic.id);
        S.ui.kocParca = { etiket:soruAdi(r), metin:d(q.soru) + (O().ekMetni(q) ? '\n' + O().ekMetni(q) : '') + '\n'
          + q.sec.map((m, k) => O().HARFLER[k] + ') ' + d(m)).join('\n')
          + '\nDoğru cevap: ' + q.dogru + '\nUygulamadaki çözüm: ' + dizi(q.cozum).map(d).join(' ') };
        S.ui.kocTaslak = yz('ays.ogren.bu-sorunun-cozumunu-anlamadi');
        R.App.go('koc');
      },
      async 'soru-kart'(el){
        const r = soruRef(el), y = r && O().kartYuzu(r.topic.id, r.i);
        if(!y) return;
        const card = R.Model.newCard({ front:y.front, back:y.back, subjectId:r.subject.id, topic:r.topic.name, source:'ogren' });
        await R.Model.saveCard(card);
        UI.toast(yz('ays.ogren.karta-cevrildi-tekrar-da-sor'));
      },
      async 'soru-isaret'(el){
        const k = el.dataset.k, s = k && T().soruOf(k);
        if(!s) return;
        UI.sheet({ title:yz('ays.ogren.bu-soruda-hata-var'), subtitle:s.subject.name + ' · ' + s.topic.name,
          body:String(K.Stack([
            K.Field({ label:yz('ays.ogren.ne-yanlis-istege-bagli'), input:K.Textarea({ id:'isaret-not', rows:3,
              placeholder:yz('ays.ogren.or-b-de-dogru-cozumde') }) }),
            K.Notice({ tone:'info', body:yz('ays.ogren.uygulamadaki-cevap-degismez-2')
              + '«Bildirdiğin hatalar»da durur; oradan listeyi kopyalayıp iletebilirsin.' }),
          ])),
          footer:String(html`${K.Button({ label:yz('ays.ogren.vazgec'), act:'sheet-close' })}
            ${K.Button({ label:yz('ays.ogren.bildir'), tone:'primary', act:'soru-isaret-kaydet', data:{ 'data-k':k } })}`) });
      },
      async 'soru-isaret-kaydet'(el){
        const n = document.getElementById('isaret-not');
        const r = await T().isaretle(el.dataset.k, n ? n.value : '');
        UI.closeSheet();
        UI.toast(r.ok ? yz('ays.ogren.bildirildi-soru-karma-testte') : 'Bildirilemedi');
        R.App.render();
      },
      async 'soru-isaret-kaldir'(el){
        await T().isaretKaldir(el.dataset.k);
        UI.toast(yz('ays.ogren.bildirim-geri-alindi'));
        R.App.render();
      },
      async 'isaret-kopyala'(){
        const metin = T().isaretMetni();
        let ok = false;
        try{ if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(metin); ok = true; } }catch(e){ ok = false; }
        if(ok){ UI.toast(yz('ays.ogren.liste-kopyalandi')); return; }
        UI.sheet({ title:yz('ays.ogren.bildirdigin-hatalar'), subtitle:yz('ays.ogren.kopyalanamadi-metni-secip-ko'),
          body:String(K.Textarea({ id:'isaret-metin', rows:12, value:metin })) });
      },
      async 'soru-defter'(el){
        const r = soruRef(el);
        if(!r) return;
        const e = await O().yanlisaEkle(r.subject.id, r.topic.id, r.i, el.dataset.h || null);
        UI.toast(e ? yz('ays.ogren.yanlis-defterine-eklendi-kok') : 'Eklenemedi');
        R.App.render();
      },
      /* Karma test */
      async 'karma-konular'(el){ S.ui.karmaKonular = el.dataset.value; R.App.render(); },
      async 'karma-seviye'(el){ S.ui.karmaSeviye = el.dataset.value; R.App.render(); },
      async 'karma-boy'(el){ S.ui.karmaBoy = Number(el.dataset.value) || T().BOYLAR[0]; R.App.render(); },
      async 'karma-baslat'(){
        const k = karmaKapsami();
        const r = await T().baslat({ ders:k.ders, konular:k.konular, seviye:k.seviye }, S.ui.karmaBoy || T().BOYLAR[0]);
        if(!r.ok){ UI.toast(r.metin, { life:6000 }); return; }
        S.ui.karmaSonuc = null;
        soruSifirlaSure();
        window.scrollTo(0, 0);
        R.App.render();
      },
      async 'test-git'(el){ await T().git(Number(el.dataset.i) || 0); soruSifirlaSure(); R.App.render(); },
      async 'test-cevap'(el){
        const y = T().siradaki(), a = T().aktif();
        const sure = gecenSure();
        const r = y ? await T().cevapla(y.sira, el.dataset.harf, !a.prova && S.ui.ipucu === 'test:' + a.id + '#' + y.sira, sure) : null;
        if(r && r.neden === 'sure'){ const oz = await T().bitir(); S.ui.provaSonuc = oz ? oz.id : null; UI.toast(yz('ays.ogren.sure-doldu-prova-bitti')); }
        R.App.render();
      },
      async 'test-bak'(){
        const y = T().siradaki();
        const sure = gecenSure();
        if(y) await T().bak(y.sira, sure);
        R.App.render();
      },
      /* Günlük paragraf */
      async 'par-ac'(){ S.ui.ogrenKip = 'paragraf'; S.ui.ogrTekrar = null; soruSifirlaSure(); R.App.render(); },
      async 'par-git'(el){ S.ui.parSira = Number(el.dataset.i) || 0; soruSifirlaSure(); R.App.render(); },
      async 'par-cevap'(el){
        const g = P().gunu(), i = Math.max(0, Number(S.ui.parSira) || 0), id = g && g.sorular[i];
        const sure = gecenSure();
        if(id) await P().cevapla(id, el.dataset.harf, S.ui.ipucu === 'par:' + id, sure);
        R.App.render();
      },
      async 'par-bak'(){
        const g = P().gunu(), id = g && g.sorular[Math.max(0, Number(S.ui.parSira) || 0)];
        const sure = gecenSure();
        if(id) await P().bak(id, sure);
        R.App.render();
      },
      async 'par-boy'(el){ await P().boyAyarla(Number(el.dataset.n)); S.ui.parSira = 0; soruSifirlaSure(); R.App.render(); },
      async 'par-yaz'(){
        const r = await P().gunKaydinaYaz();
        UI.toast(r.ok ? yz('ays.ogren.bugunun-paragraf-sayisina') + r.n + ' yazıldı · Onaylar’dan geri alınabilir' : r.why);
        R.App.render();
      },
      async 'karma-bitir'(){
        const a = T().aktif();
        if(!a) return;
        const bos = T().say(a).bos, prova = !!a.prova;
        const bitir = async () => { const oz = await T().bitir(); S.ui[prova ? 'provaSonuc' : 'karmaSonuc'] = oz ? oz.id : null; window.scrollTo(0, 0); R.App.render(); };
        if(!bos) return bitir();
        UI.confirmSheet(yz('ays.ogren.testi-bitir'), U.plural(bos, 'soru', 'soru') + ' cevapsız: boş sayılır, yanlış sayılmaz.', bitir, false, 'Bitir');
      },
      async 'karma-vazgec'(){
        UI.confirmSheet(yz('ays.ogren.testten-vazgec'), yz('ays.ogren.bu-test-silinir-gecmise-hicb'),
          async () => { await T().vazgec(); R.App.render(); }, true, 'Vazgeç');
      },
      async 'prova-sinav'(el){ S.ui.provaSinav = el.dataset.value; R.App.render(); },
      async 'prova-boy'(el){ S.ui.provaBoy = Number(el.dataset.value) || T().PROVA_BOY[0]; R.App.render(); },
      async 'prova-baslat'(){
        const r = await T().provaBaslat(T().PROVA[S.ui.provaSinav] ? S.ui.provaSinav : 'TYT', S.ui.provaBoy || T().PROVA_BOY[0]);
        if(!r.ok){ UI.toast(r.metin, { life:6000 }); return; }
        if(r.eksik.length) UI.toast(yz('ays.ogren.havuz-yetmedi') + r.eksik.join(', ') + '. Prova ' + r.n + ' soruyla, ' + r.sureDk + ' dk.', { life:6000 });
        S.ui.provaSonuc = null;
        soruSifirlaSure();
        window.scrollTo(0, 0);
        R.App.render();
      },
      async 'prova-sonuc'(el){ S.ui.provaSonuc = el.dataset.id; window.scrollTo(0, 0); R.App.render(); },
      async 'prova-yeni'(){ S.ui.provaSonuc = null; R.App.render(); },
      async 'karma-sonuc'(el){ S.ui.karmaSonuc = el.dataset.id; window.scrollTo(0, 0); R.App.render(); },
      async 'karma-yeni'(){ S.ui.karmaSonuc = null; soruSifirlaSure(); R.App.render(); },
      /* Yanlışlarım */
      async 'tekrar-ac'(el){ S.ui.ogrTekrar = { k:el.dataset.k, h:null }; soruSifirlaSure(); window.scrollTo(0, 0); R.App.render(); },
      async 'tekrar-kapat'(){ S.ui.ogrTekrar = null; R.App.render(); },
      async 'tekrar-cevap'(el){
        const t = S.ui.ogrTekrar;
        if(!t || t.h) return;
        const ip = S.ui.ipucu === 'tekrar:' + t.k;
        const sure = gecenSure();
        const r = await T().tekrarCevapla(t.k, el.dataset.harf, ip, sure);
        if(r.ok){ t.h = String(el.dataset.harf).toUpperCase(); t.ip = ip; t.sure = sure; }
        R.App.render();
      },
    }),
    change:Object.assign({}, ortakChange, {
      async 'karma-ders'(el){ S.ui.karmaDers = el.value; S.ui.karmaKonular = null; R.App.render(); },
      async 'yanlis-ders'(el){ S.ui.yanlisDers = el.value; R.App.render(); },
    }),
  };

  /* ================================================================
     KOÇ — bu konunun içinde anlatan koç (core/konusor.js).
     ================================================================ */

  const HAZIR = [
    { ad:yz('ays.ogren.daha-basit-anlat'), metin:yz('ays.ogren.bu-konuyu-en-bastan-cok') },
    { ad:yz('ays.ogren.bir-ornek-daha'), metin:yz('ays.ogren.bu-konudan-osym-tarzinda-bir') },
    { ad:yz('ays.ogren.beni-sina'), metin:yz('ays.ogren.bana-bu-konudan-tek-bir') },
    { ad:yz('ays.ogren.sik-yapilan-hatalar'), metin:yz('ays.ogren.bu-konuda-en-sik-yapilan') },
    { ad:yz('ays.ogren.formulleri-ozetle'), metin:yz('ays.ogren.bu-konunun-kurallarini-ve-fo') },
  ];
  let kocBusy = false;

  function kocKarti(x){
    const { subject, topic } = x;
    const KS = R.KonuSor;
    if(!KS || !KS.hazir()){
      return K.Card({ title:yz('ays.ogren.koc'), wide:true,
        body:html`${K.Notice({ tone:'info', title:yz('ays.ogren.model-bagli-degil'),
          body:yz('ays.ogren.ofis-ayarlarindan-ucretsiz-b')
            + yz('ays.ogren.anlatim-ve-ornek-sorular-mod') })}
          <div class="row wrap gap-6 mt-12">
            ${K.Button({ label:yz('ays.ogren.ofis-ayarlarini-ac'), icon:'gear', size:'sm', tone:'primary', act:'koc-ayar' })}
            ${K.Button({ label:yz('ays.ogren.anlatima-don'), size:'sm', tone:'ghost', act:'ogren-git',
              data:{ 'data-route':'anlatim', 'data-subject':subject.id, 'data-topic':topic.id } })}
          </div>` });
    }
    const l = KS.konusmaOf(subject.id, topic.id);
    const ciftler = [];
    for(let k = 0; k + 1 < l.length; k += 2) ciftler.push({ soru:l[k].metin, cevap:l[k + 1].metin, i:k / 2 });
    const parca = S.ui.kocParca;
    return K.Card({ title:yz('ays.ogren.koc'), wide:true, sub:topic.name + ' · koçun modeli bu konunun içinde anlatır',
      actions:when(ciftler.length, () => K.Button({ label:yz('ays.ogren.yeni-konusma'), size:'sm', tone:'ghost', act:'konusor-unut' })),
      body:html`
        <div class="sohbet" aria-live="polite" data-raf-tam>
          ${when(!ciftler.length, () => html`<p class="small muted">${yz('ays.ogren.anlamadigin-yeri-yaz-ya-da')}</p>`)}
          ${map(ciftler, c => html`
            <div class="sohbet__sen"><p class="small">${c.soru}</p></div>
            <div class="sohbet__koc">
              <p class="small konusor__cevap">${c.cevap}</p>
              <div class="row between gap-6 mt-6"><span class="tiny dim">${yz('ays.ogren.dogrulanmadi-modelin-anlatim')}</span>
                ${K.Button({ label:yz('ays.ogren.karta-cevir'), icon:'cards', size:'sm', tone:'ghost', act:'konusor-kart', data:{ 'data-i':String(c.i) } })}</div>
            </div>`)}
          <div id="konusor-akis" class="sohbet__koc small konusor__cevap"></div>
        </div>
        <div class="row wrap gap-6 mt-12" role="group" aria-label="Hazır sorular">${map(HAZIR, (h, k) =>
          K.Chip({ label:h.ad, act:'koc-hazir', data:{ 'data-i':String(k) } }))}</div>
        ${when(parca, () => html`<div class="ogr-parca mt-12"><span class="tiny dim">${yz('ays.ogren.baglam')} ${parca.etiket}</span>
          <button type="button" class="linkbtn tiny" data-act="koc-parca-kaldir">${yz('ays.ogren.kaldir-2')}</button></div>`)}
        <div class="mt-12">${K.Field({ label:ciftler.length ? yz('ays.ogren.devam-et') : yz('ays.ogren.neyi-anlamadin'),
          input:K.Textarea({ id:'konusor-soru', rows:3, aria:yz('ays.ogren.anlamadigin-yer'), value:S.ui.kocTaslak || '',
            placeholder:yz('ays.ogren.anlamadigin-yeri-yaz-ya-da-2') }) })}</div>
        <div class="row wrap gap-6 mt-10">
          ${K.Button({ label:kocBusy ? 'Anlatıyor…' : 'Sor', icon:'zap', size:'sm', tone:'primary', act:'konusor-sor', disabled:kocBusy })}
        </div>
        <p class="tiny dim mt-10">${yz('ays.ogren.cevap-kaynaksizdir-ve-kayded')}</p>`,
    });
  }

  async function sor(metin){
    const x = O().secili();
    if(!x.topic || kocBusy || !R.KonuSor) return;
    if(String(metin || '').trim().length < 3){ UI.toast(yz('ays.ogren.neyi-anlamadigini-bir-cumley')); return; }
    kocBusy = true;
    S.ui.kocTaslak = '';
    const akis = document.getElementById('konusor-akis');
    if(akis) akis.textContent = 'Anlatıyor…';
    let r = null;
    try{
      r = await R.KonuSor.sor(x.subject.id, x.topic.id, metin, { parca:S.ui.kocParca ? S.ui.kocParca.metin : null,
        onText:t => { if(akis) akis.textContent = t; } });
    }finally{ kocBusy = false; }
    if(r && !r.ok) UI.toast(r.metin, { life:6000 });
    R.App.render();
  }

  LIFEOS.PARCA.blok({ id:'koc.konu-cubugu', sayfa:'koc', yer:'ana', sira:10, ad:'Konu çubuğu', ciz({ x }){ return raw(konuCubugu(x)); } });
LIFEOS.PARCA.blok({ id:'koc.kockarti', sayfa:'koc', yer:'ana', sira:20, ad:'Koç', ciz({ x }){ return kocKarti(x); } });
  R.Screens.koc = {
    id:'koc',
    title:yz('ays.ogren.koc'),
    subtitle(){ const x = O().secili(); return x.topic ? x.subject.name + ' · ' + x.topic.name : yz('ays.ogren.konunun-kocu'); },
    actions(){ return ''; },
    async render(){
      const x = await hazirla();
      if(!x.topic) return String(K.Card({ body:K.Empty({ icon:'zap', text:yz('ays.ogren.konu-yok') }) }));
      const parcaB = { x };
      return String(K.Grid([K.Span(12, K.Stack(LIFEOS.PARCA.liste('koc', 'ana', K, parcaB)))]));
    },
    handle:Object.assign({}, ortakHandle, {
      async 'konusor-sor'(){
        const kutu = document.getElementById('konusor-soru');
        await sor(kutu ? kutu.value : '');
      },
      async 'koc-hazir'(el){
        const h = HAZIR[Number(el.dataset.i) || 0];
        if(h) await sor(h.metin);
      },
      async 'koc-parca-kaldir'(){ S.ui.kocParca = null; R.App.render(); },
      async 'koc-ayar'(){
        R.App.go('office');
        setTimeout(() => R.Screens.office && R.Screens.office.handle['office-settings']({ dataset:{} }), 80);
      },
      async 'konusor-kart'(el){
        const x = O().secili();
        if(!x.topic) return;
        const k = await R.KonuSor.kartYap(x.subject.id, x.topic.id, Number(el.dataset.i) || 0);
        UI.toast(k ? yz('ays.ogren.karta-cevrildi-modelin-anlat') : yz('ays.ogren.kart-yapilamadi'));
        R.App.render();
      },
      async 'konusor-unut'(){
        const x = O().secili();
        if(x.topic) R.KonuSor.unut(x.subject.id, x.topic.id);
        S.ui.kocParca = null;
        R.App.render();
      },
    }),
    change:Object.assign({}, ortakChange),
  };
})();
