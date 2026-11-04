/* Bugün — günlük operasyon ekranı.

   ŞABLON DÜZENİ (diğer ekranlar için referans):
   - Görünüm h.html`` ile yazılır; araya giren değerler otomatik kaçırılır.
   - Yapı parçaları C.* bileşenlerinden gelir (Card, Stat, Button, Notice…).
   - Yapısal HTML gerektiğinde h.raw() ile işaretlenir.
   - Etkileşim yalnız data-act / data-change ile bağlanır; inline onclick yok.
   - render() tek bir C.Grid döndürür; kolonlar C.Span ile verilir. */
window.LIFEOS.PARCA.yazilar({
  'ays.today.odak-moduna-don':'Odak moduna dön — ',
  'ays.today.blogu-bitir':'Bloğu bitir',
  'ays.today.baslat-2':'Başlat: ',
  'ays.today.minimum-standardi-tutturunca':'Minimum standardı tutturunca seri başlar.',
  'ays.today.odul-nete-degil-duzene-bagli':'Ödül nete değil düzene bağlı.',
  'ays.today.plandan-sonra':'Plandan sonra',
  'ays.today.bu-tarihe-hala-yetisilebilir':'Bu tarihe hâlâ yetişilebilir; plan olduğu gibi kalabilir.',
  'ays.today.adimlari-gor':'Adımları gör',
  'ays.today.henuz-hic-yedek-almadin':'Henüz hiç yedek almadın.',
  'ays.today.son-yedegin':'Son yedeğin ',
  'ays.today.yedek-al':'Yedek al',
  'ays.today.analize-git':'Analize git',
  'ays.today.i-lk-esik':'İlk eşik',
  'ays.today.bugun-paragraf-ve-problem-yo-2':'Bugün paragraf ve problem yok; seri dakika ve kartla korunuyor.',
  'ays.today.hedef-minimuma-indi-seri-kor':'Hedef minimuma indi, seri korunuyor.',
  'ays.today.gecici-sure-ders-gunlerinde':'Geçici süre: ders günlerinde ',
  'ays.today.bugun-ara-gunu-plan-bos':'Bugün ara günü: plan boş.',
  'ays.today.sinava-kalan':'Sınava kalan',
  'ays.today.tyt-tarihi-tahmini':'TYT tarihi tahmini',
  'ays.today.tyt-tarihine':'TYT tarihine',
  'ays.today.plan-disi-2':'Plan dışı: ',
  'ays.today.unutma-egrisi-yanlis-cozulen':'Unutma eğrisi: yanlış çözülen soruları aralıklı tekrarla kalıcılaştır.',
  'ays.today.acik-yanlis-soru-yok-hafiza':'Açık yanlış soru yok; hafıza taze.',
  'ays.today.hedef':'Hedef ',
  'ays.today.paragraf-ve-problem-girilmed':'Paragraf ve problem girilmedi.',
  'ays.today.i-lk-tam-deneme':'İlk tam deneme.',
  'ays.today.esigin-ustunde':'Eşiğin üstünde.',
  'ays.today.esik-10':'Eşik %10.',
  'ays.today.tyt-tahmini-tarih':'TYT, tahmini tarih.',
  'ays.today.plana-bak':'Plana bak',
  'ays.today.bugun-ara-gunu-plan-bos-2':'Bugün ara günü; plan boş.',
  'ays.today.bugunun':'Bugünün ',
  'ays.today.tyt-tarihi-bugun':'TYT tarihi − bugün',
  'ays.today.programini-kuralim':'Programını kuralım.',
  'ays.today.bugun-icin-plan-yok':'Bugün için plan yok.',
  'ays.today.tam-plan':'Tam plan',
  'ays.today.simdi':'Şimdi: ',
  'ays.today.sirada':'Sırada: ',
  'ays.today.bugunun-bloklari-kapandi':'Bugünün blokları kapandı.',
  'ays.today.blok-bitince-cozulen-soru-gi':'Blok bitince çözülen soru girilir; girilmeden sıfır sayılmaz.',
  'ays.today.gunun-soru-hedefi-tamam':'Günün soru hedefi tamam.',
  'ays.today.her-blogu-adiyla-ayri-yaz':'Her bloğu adıyla ayrı yaz.',
  'ays.today.bu-gunun-kaydi-acilmamis-hic':'Bu günün kaydı açılmamış; hiçbir şey yazılmadı.',
  'ays.today.olcum-satiri-bu-surumde-okun':'Ölçüm satırı bu sürümde okunamıyor; hiçbir şey yazılmadı.',
  'ays.today.satiri-okuyamadim-hicbir-sey':'Satırı okuyamadım; hiçbir şey yazılmadı.',
  'ays.today.anlasilmadi':'Anlaşılmadı: «',
  'ays.today.bu-satirda-olcum-bulamadim-o':'Bu satırda ölçüm bulamadım. Örneğin ',
  'ays.today.bu-satir-yalniz-olcum-icindi':'Bu satır yalnız ölçüm içindir; «',
  'ays.today.uyku-2':'Uyku: ',
  'ays.today.paragraf-2':'Paragraf: ',
  'ays.today.problem-2':'Problem: ',
  'ays.today.tatil-bitti-bugunden-kademel':'Tatil bitti; bugünden kademeli dönüş',
  'ays.today.bugun-ve-sonraki-gunler-yeni':'Bugün ve sonraki günler yeniden plana göre kurulur. Geçmiş ara günleri ara olarak kalır.',
  'ays.today.ara-bitti-bugunun-plani-kuru':'Ara bitti; bugünün planı kuruldu',
  'ays.today.hedef-guncellendi':'Hedef güncellendi',
  'ays.today.plan-uygulandi-geri-almak-is':'Plan uygulandı. Geri almak istersen «Planı geri al».',
  'ays.today.eski-plan-geri-alinamadi-hed':'Eski plan geri alınamadı; hedef değişmedi.',
  'ays.today.plan-geri-alindi-hafta-tasla':'Plan geri alındı; hafta taslağı eski sırasına döndü.',
  'ays.today.geri-alinamadi':'Geri alınamadı',
  'ays.today.gonderilemedi':'Gönderilemedi — ',
  'ays.today.bugunun-hedefi-minimum-gune':'Bugünün hedefi minimum güne iner, kalan bloklar “kötü gün” nedeniyle atlanır ve ',
  'ays.today.bugunu-minimuma-indir':'Bugünü minimuma indir',
  'ays.today.bloklar-sayaclar-ve-gunun-bu':'Bloklar, sayaçlar ve günün bütün kartları',
});


window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:10, group:'Git', label:'Bugün', icon:'today', route:'today', run(){ R.App.go('today'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:300, uret(){
  const day = R.S.days[R.U.todayISO()];
  if(!day) return [];
  const running = day.blocks.find(b => b.startedAt);
  if(running) return [
    { group:'Odak', label:yz('ays.today.odak-moduna-don')+running.topic, icon:'clock', run(){ R.Palette.openFocus(); } },
    { group:'Odak', label:yz('ays.today.blogu-bitir'), icon:'stop', run(){ R.Screens.today.handle['timer-stop']({ dataset:{ block:running.id } }); } },
  ];
  return day.blocks.filter(b => b.status === 'pending' && b.slot !== 'Dinlenme').map(b => ({ group:'Odak', label:yz('ays.today.baslat-2')+b.topic, icon:'play', run(){
    R.App.go('today');
    setTimeout(()=>R.Screens.today.handle['timer-start']({ dataset:{ block:b.id } }), 60);
  }}));
} });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:410, group:'Sistem', label:'Bugün olmuyor — minimum güne in', icon:'moon', run(){ R.Screens.today.handle['bad-day'](); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:420, group:'Sistem', label:'Hafta özetini paylaş', icon:'upload', run(){ R.Screens.today.handle['share-week'](); } });
window.LIFEOS.PARCA.yazilar({
  'ays.today.paragraf':'Paragraf',
  'ays.today.problem':'Problem',
  'ays.today.plan-disi':'Plan dışı:',
  'ays.today.bir-derse-baglanmadan-girild':'— bir derse bağlanmadan girildi, günün toplamına yazıldı.',
  'ays.today.blok-konusu':'blok konusu',
  'ays.today.bitir':'Bitir',
  'ays.today.sonraya-al':'Sonraya al',
  'ays.today.baslat':'Başlat',
  'ays.today.blok-durumu':'blok durumu',
  'ays.today.ders':'Ders',
  'ays.today.baglanmadi':'— bağlanmadı —',
  'ays.today.konu':'Konu',
  'ays.today.dogruluk':'Doğruluk %',
  'ays.today.neden-atlandi':'Neden atlandı?',
  'ays.today.blok-tasindi':'Blok taşındı',
  'ays.today.once-ders':'— önce ders —',
  'ays.today.konu-2':'— konu —',
  'ays.today.davranis-serisi':'Davranış serisi',
  'ays.today.gun':'gün',
  'ays.today.yillik-tatil-siniri-bu-yil':'Yıllık tatil sınırı: bu yıl kalan',
  'ays.today.yillik-tatil-siniri-gun':'yıllık tatil sınırı, gün',
  'ays.today.siniri-kaydet':'Sınırı kaydet',
  'ays.today.tatil-modu':'Tatil modu:',
  'ays.today.seri-korunuyor-hkm-soru':'· seri korunuyor, HKM soru sormuyor',
  'ays.today.tatili-bitir':'Tatili bitir',
  'ays.today.bugun-dondurulmus':'Bugün dondurulmuş (',
  'ays.today.seri-bozulmaz':') · seri bozulmaz',
  'ays.today.geri-al':'Geri al',
  'ays.today.kac-gun':'Kaç gün?',
  'ays.today.vazgec':'Vazgeç',
  'ays.today.bugun-hastayim-seri-donsun':'Bugün hastayım · seri donsun',
  'ays.today.tatil-modu-2':'Tatil modu',
  'ays.today.uyku':'Uyku',
  'ays.today.7-gun-ort':'7 gün ort.',
  'ays.today.uyku-saati':'uyku saati',
  'ays.today.saat-hedef':'saat · hedef',
  'ays.today.uyku-bellek-pekismesinin-par':'Uyku bellek pekişmesinin parçasıdır — bugünkü hedefi hafiflet.',
  'ays.today.haftalik-sozlesmeyi-ac':'Haftalık sözleşmeyi aç',
  'ays.today.deneme-ekle':'Deneme ekle',
  'ays.today.haftalik-degerlendirmeyi-ac':'Haftalık değerlendirmeyi aç',
  'ays.today.bugunun-ritueli':'Bugünün ritüeli',
  'ays.today.due-kartlar':'Due kartlar',
  'ays.today.bugun-icin-bekleyen-kart-yok':'Bugün için bekleyen kart yok. Yeni kartlar deneme analizinden otomatik üretilir.',
  'ays.today.tumu':'Tümü',
  'ays.today.cevabi-gormek-icin-karta-dok':'Cevabı görmek için karta dokun',
  'ays.today.tamir-kuyrugu':'Tamir kuyruğu',
  'ays.today.acik-yanlislarin-receteleri':'Açık yanlışların reçeteleri',
  'ays.today.yanlis-defteri':'Yanlış defteri',
  'ays.today.yapildi':'Yapıldı',
  'ays.today.hafta':'Hafta ',
  'ays.today.ac':'Aç',
  'ays.today.bu-haftanin-ana-konulari':'Bu haftanın ana konuları',
  'ays.today.soru':'soru · %',
  'ays.today.plan-tamamlama':'Plan tamamlama',
  'ays.today.soru-gerceklesme':'Soru gerçekleşme',
  'ays.today.askiya-al':'Askıya al',
  'ays.today.surdur':'Sürdür',
  'ays.today.tamamlandi':'Tamamlandı',
  'ays.today.birak':'Bırak',
  'ays.today.deneme-gunu':'Deneme günü:',
  'ays.today.cozum-analiz':'(çözüm + analiz',
  'ays.today.plan-kurulamadi':'Plan kurulamadı.',
  'ays.today.kapat':'Kapat',
  'ays.today.plan-onizlemesi':'Plan önizlemesi',
  'ays.today.onaylanana-kadar-hicbir-sey':'— onaylanana kadar hiçbir şey değişmez.',
  'ays.today.i-lk-hafta':'İlk hafta',
  'ays.today.kontrol-noktalari':'Kontrol noktaları:',
  'ays.today.plan':'Plan',
  'ays.today.geri-alinabilir-geri-alinca':'. Geri alınabilir; geri alınca hafta taslağı eski sırasına döner.',
  'ays.today.plani-uygula':'Planı uygula',
  'ays.today.simdilik-degil':'Şimdilik değil',
  'ays.today.bugunun-verisiyle-yeniden-he':'Bugünün verisiyle yeniden hesap',
  'ays.today.secim-yapana-kadar-hicbir':'— seçim yapana kadar hiçbir şey değişmez.',
  'ays.today.secince-eski-plan-geri-alini':'Seçince eski plan geri alınır, hedef yeni tarih ve vakitle güncellenir; yeni planı önizleyip onaylarsın. Eski tarih hedefin geçmişinde kalır.',
  'ays.today.plan-uygulandi':'Plan uygulandı',
  'ays.today.bu-hafta':'Bu hafta (',
  'ays.today.sonraki-kontrol':'Sonraki kontrol:',
  'ays.today.beklenen':'— beklenen',
  'ays.today.odak-konulari':'Odak konuları:',
  'ays.today.yeniden-hesapla':'Yeniden hesapla',
  'ays.today.plani-geri-al':'Planı geri al',
  'ays.today.plani-gor':'Planı gör',
  'ays.today.zaman-butcesi-king':'Zaman bütçesi (King):',
  'ays.today.hedeflerim':'Hedeflerim',
  'ays.today.ekip-sohbetinde-hedef-koy':'Ekip sohbetinde hedef koy',
  'ays.today.baska-ornek':'Başka örnek',
  'ays.today.henuz-hedefin-yok-ekip-sohbe':'Henüz hedefin yok. Ekip sohbetinde Patron’a «TYT’de 90 nete çıkmak istiyorum» gibi yaz; ',
  'ays.today.tyt-matematigi-100-gunde-bit':'«TYT matematiği 100 günde bitirmek istiyorum» da olur; olmuyorsa olacağı tarihi söylerim. Alışkanlık da kurabilirsin: «her gün 2 saat ders çalışma alışkanlığı kazanmak istiyorum».',
  'ays.today.bir-soru':'Bir soru',
  'ays.today.cevabin':'Cevabın:',
  'ays.today.soru-acik-kalir-ayrismanin-g':'Soru açık kalır: ayrışmanın gerçekten kapanıp kapanmadığı bir sonraki pencerede ölçülecek.',
  'ays.today.kisa-cevabin-istege-bagli':'Kısa cevabın (isteğe bağlı)',
  'ays.today.tek-cumle-yeter':'tek cümle yeter',
  'ays.today.kaydet':'Kaydet',
  'ays.today.bu-soru-bana-uymuyor':'Bu soru bana uymuyor',
  'ays.today.program':'Program',
  'ays.today.tarihinde-basliyor-hafta-1-i':'tarihinde başlıyor. Hafta 1 içeriği şimdiden önizleme olarak açık.',
  'ays.today.protokolu':'protokolü',
  'ays.today.tarihine-kadar-aktif':'tarihine kadar aktif.',
  'ays.today.telafi-tetiklendi':'Telafi tetiklendi.',
  'ays.today.protokolu-oneriliyor':'protokolü öneriliyor.',
  'ays.today.tarayici-verisi-silinirse-ca':'Tarayıcı verisi silinirse çalışma geçmişin kaybolur.',
  'ays.today.analiz-borcu':'Analiz borcu.',
  'ays.today.denemenin-analizi-24-saati-a':'denemenin analizi 24 saati aştı. Analiz edilmemiş deneme, analiz edilenden daha düşük değerlidir.',
  'ays.today.gunun-akisi':'Günün akışı',
  'ays.today.i-zle-not-soru':'İzle → not → soru → kart → mola',
  'ays.today.git':'Git',
  'ays.today.sistem-onerileri':'Sistem önerileri',
  'ays.today.otomasyon-onerir-sen-onaylar':'Otomasyon önerir, sen onaylarsın',
  'ays.today.uygula':'Uygula',
  'ays.today.plan-sagligi':'Plan sağlığı',
  'ays.today.plani-yeniden-hesapla':'Planı yeniden hesapla',
  'ays.today.enerji':'Enerji',
  'ays.today.gunde-tek-soru-plan':'Günde tek soru — plan buna göre esner',
  'ays.today.7-gun-ort-2':'7 gün ort. ',
  'ays.today.mola':'Mola',
  'ays.today.bugun-alinan':'Bugün alınan: ',
  'ays.today.dk':'dk ·',
  'ays.today.aldim':'Aldım',
  'ays.today.minimum-gun':'Minimum gün',
  'ays.today.analiz':'Analiz',
  'ays.today.tekrar':'Tekrar',
  'ays.today.bugunun-odulu':'Bugünün ödülü',
  'ays.today.tam-gun':'tam gün',
  'ays.today.bugun-kotu-gun-olarak-isaret':'Bugün kötü gün olarak işaretli',
  'ays.today.soru-da-yok':'Soru da yok',
  'ays.today.i-saretle':'İşaretle',
  'ays.today.bolunme':'Bölünme',
  'ays.today.1-bolundum':'+1 bölündüm',
  'ays.today.sifirla':'Sıfırla',
  'ays.today.ofisten':'Ofisten',
  'ays.today.ekibin-bugunku-notu':'Ekibin bugünkü notu',
  'ays.today.acik-karar':'Açık karar:',
  'ays.today.ofise-git':'Ofise git',
  'ays.today.patron-a-sor':'Patron’a sor',
  'ays.today.hkm':'HKM',
  'ays.today.bagli-degil':'bağlı değil',
  'ays.today.rehber-u2019de-ac':'Rehber\u2019de aç',
  'ays.today.teklif-bekliyor-onaylar-da':'teklif bekliyor — Onaylar’da.',
  'ays.today.simdi-gonder':'Şimdi gönder',
  'ays.today.ayarlar':'Ayarlar',
  'ays.today.bugun-ara-gunu':'Bugün ara günü',
  'ays.today.blok-yok-ve-bu':'. Blok yok ve bu gün kaçırılmış sayılmaz; haftalık soru hedefi ara günleri oranında küçüldü. Plan',
  'ays.today.gunu-kaldigi-yerden-surer':'günü kaldığı yerden sürer.',
  'ays.today.arayi-bugun-bitir':'Arayı bugün bitir',
  'ays.today.suruyor':'Sürüyor',
  'ays.today.siradaki':'Sıradaki',
  'ays.today.bitti':'Bitti',
  'ays.today.yarim':'Yarım',
  'ays.today.atlandi':'Atlandı',
  'ays.today.gunu-kapat':'Günü kapat',
  'ays.today.bloklari-ve-sayaclari-ac':'Blokları ve sayaçları aç',
  'ays.today.bugun':'bugün',
  'ays.today.ozet':'Özet',
  'ays.today.gunluk-sayac':'Günlük sayaç',
  'ays.today.gunluk-hedef':'Günlük hedef',
  'ays.today.buraya-birak':'Buraya bırak · ',
  'ays.today.buraya-birak-en-sona':'Buraya bırak · en sona',
  'ays.today.en-sona-birak':'En sona bırak',
  'ays.today.son-deneme':'Son deneme',
  'ays.today.henuz-tam-tyt-denemesi-yok':'Henüz tam TYT denemesi yok;',
  'ays.today.burada-kendiliginden-cikar':'burada kendiliğinden çıkar.',
  'ays.today.denemelere-git':'Denemelere git',
  'ays.today.son-denemelerin-tyt-neti':'Son denemelerin TYT neti',
  'ays.today.dogru':'doğru',
  'ays.today.yanlis':'yanlış',
  'ays.today.tekrar-borcu':'Tekrar borcu',
  'ays.today.esik-ustu':'eşik üstü',
  'ays.today.tekrara-git':'Tekrara git',
  'ays.today.hafiza-yoklamasi':'Hafıza yoklaması',
  'ays.today.tekrar-bekliyor':'tekrar bekliyor',
  'ays.today.yanlislari-coz':'Yanlışları çöz',
  'ays.today.cozuldu':'çözüldü.',
  'ays.today.bugun-sayac-bos':'Bugün sayaç boş.',
  'ays.today.henuz-tam-deneme-yok':'Henüz tam deneme yok.',
  'ays.today.net-ilk-denemeyle-cikar':'Net ilk denemeyle çıkar.',
  'ays.today.tekrar-borcu-2':'tekrar borcu.',
  'ays.today.tekrar-karti-yok':'Tekrar kartı yok.',
  'ays.today.borc-ilk-kartla-olculur':'Borç ilk kartla ölçülür.',
  'ays.today.tekrar-bekliyor-2':'tekrar bekliyor.',
  'ays.today.aralikli-tekrar-yanlis-cozul':'Aralıklı tekrar: yanlış çözülen soruları zihinde pekiştir.',
  'ays.today.sorulari-coz':'Soruları çöz',
  'ays.today.sinav':'Sınav',
  'ays.today.kaldi':'kaldı.',
  'ays.today.seri':'Seri',
  'ays.today.ust-uste':'üst üste.',
  'ays.today.minimum-gun-tutuldu':'Minimum gün tutuldu.',
  'ays.today.henuz-baslamadi':'Henüz başlamadı.',
  'ays.today.bugun-minimum-gunu-tamamlars':'Bugün minimum günü tamamlarsan seri başlar.',
  'ays.today.bugun-2':'Bugün',
  'ays.today.gidisat':'Gidişat',
  'ays.today.tyt-tarihi':'TYT tarihi',
  'ays.today.gunun-blogu':'günün bloğu',
  'ays.today.kuruluma-basla':'Kuruluma başla',
  'ays.today.basla':'Başla',
  'ays.today.gunun-bloklari':'Günün blokları',
  'ays.today.bugun-icin-blok-yok':'Bugün için blok yok.',
  'ays.today.programin':'Programın ',
  'ays.today.tekrar-kartlari':'Tekrar kartları',
  'ays.today.tekrar-karti-yok-borc-ilk':'Tekrar kartı yok; borç ilk kartla ölçülür.',
  'ays.today.tekrar-borcu-yuzde':'Tekrar borcu yüzde ',
  'ays.today.son-14-gunun':'Son 14 günün ',
  'ays.today.soru-2':'Soru',
  'ays.today.gunun-sorusu':'Günün sorusu',
  'ays.today.bunu-bir-daha-coz':'Bunu bir daha çöz',
  'ays.today.soruyu-ac':'Soruyu aç',
  'ays.today.gun-2':'Gün',
  'ays.today.durum':'Durum',
  'ays.today.oneri':'Öneri',
  'ays.today.bloklari':'blokları',
  'ays.today.gunun-notu':'Günün notu',
  'ays.today.bugun-ne-engelledi-ne-kolayl':'Bugün ne engelledi, ne kolaylaştırdı?',
  'ays.today.obur-kayitlar':'Öbür kayıtlar',
  'ays.today.enerji-kotu-gun-bolunme-seri':'enerji, kötü gün, bölünme, seri, uyku, ritüel',
  'ays.today.tamamlandi-2':'tamamlandı',
  'ays.today.bugun-donduruldu-seri-bozulm':'Bugün donduruldu; seri bozulmaz. Geçmiş olsun.',
  'ays.today.dondurma-geri-alindi':'Dondurma geri alındı',
  'ays.today.yillik-tatil-siniri-icin-bir':'Yıllık tatil sınırı için bir gün sayısı yaz.',
  'ays.today.yillik-tatil-siniri':'Yıllık tatil sınırı ',
  'ays.today.tatil-modu-3':'Tatil modu ',
  'ays.today.bu-secenek-artik-gecerli-deg':'Bu seçenek artık geçerli değil; yeniden hesapla.',
  'ays.today.hedef-yeni-tarihle-guncellen':'Hedef yeni tarihle güncellendi; yeni planı önizleyip onayla.',
  'ays.today.hkm-u2019ye-gonderiliyor':'HKM\u2019ye gönderiliyor…',
  'ays.today.kaydedildi-sonucu-bir-sonrak':'Kaydedildi. Sonucu bir sonraki pencere gösterecek.',
  'ays.today.soru-kapatildi':'Soru kapatıldı',
  'ays.today.bugun-minimuma-indi-seri':'Bugün minimuma indi — seri korunuyor',
  'ays.today.bugun-paragraf-ve-problem-yo':'Bugün paragraf ve problem yok',
  'ays.today.normal-plana-donuldu':'Normal plana dönüldü',
  'ays.today.hafta-ozeti':'Hafta özeti',
  'ays.today.paylasmadan-once-istemedigin':'Paylaşmadan önce istemediğin satırı sil',
  'ays.today.veli-koc-raporu':'Veli / koç raporu',
  'ays.today.kopyala':'Kopyala',
  'ays.today.paylas':'Paylaş',
  'ays.today.tek-sayfa-yazdirilabilir':'tek sayfa · yazdırılabilir',
  'ays.today.pdf-olarak-kaydet':'PDF olarak kaydet',
  'ays.today.yazdir':'Yazdır',
  'ays.today.yazdir-penceresinde-hedef-ol':'Yazdır penceresinde hedef olarak «PDF olarak kaydet»i seç.',
  'ays.today.ozet-kopyalandi':'Özet kopyalandı',
  'ays.today.kopyalanamadi-metni-secip-ke':'Kopyalanamadı; metni seçip kendin kopyala',
  'ays.today.rota-hafta-ozeti':'Rota — hafta özeti',
  'ays.today.paylasim-bu-tarayicida-yok-o':'Paylaşım bu tarayıcıda yok; özet kopyalandı',
  'ays.today.mola-kaydedildi-donunce-blok':'Mola kaydedildi — dönünce blok seni bekliyor',
  'ays.today.blok-eski-yerine-dondu':'Blok eski yerine döndü.',
  'ays.today.sonraki-tekrar':'Sonraki tekrar: ',
  'ays.today.recete-tamamlandi':'Reçete tamamlandı',
  'ays.today.gunu-duzenle':'Günü düzenle',
  'ays.today.ozeti-paylas':'Özeti paylaş',
});
window.LIFEOS.PARCA.sayfa({ id:'today', modul:'ays', king:{ sira:70, ad:'Bugün', es:['bugün', 'genel bakış'] }, cekmece:'bugun', ad:'Genel bakış', ikon:'today', sira:10 });

R.Screens.today = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls } = R.h;
  const c = R.C;

  /* Ekran hangi gün için çizildiyse dokunuş o güne yazılır: gece yarısını
     geçip yeniden çizilmeyen ekranda giriş ertesi güne kaymaz, kaybolmaz. */
  let cizilenGun = null;
  function todayDoc(){ return S.days[cizilenGun] || S.days[U.todayISO()]; }
  /* Dakikanın kesinliği (AGENTS §1.2): plandan doldurulan dakika
     «tahmin»dir; sayaç ya da elle yazılan «ölçüldü». Tahmine eklenen
     sayaç dakikası toplamı ölçüme çevirmez. Etiketsiz eski kayıt ölçümdür. */
  function planDakikasi(b){ b.actualMin = b.targetMin; b.minCert = 'estimated'; }
  function sayacDakikasi(b, dk){
    b.actualMin = (b.actualMin || 0) + dk;
    if(b.minCert !== 'estimated') b.minCert = 'measured';
  }

  /* ---------- zamanlayici ---------- */
  let tickHandle = null;

  /* Çalışan sayaç çizilen günde, yoksa bir önceki günde aranır: 23:30'da
     başlayıp 00:20'de duran sayacın dakikası başladığı güne yazılır. */
  function calisan(id){
    const g = cizilenGun || U.todayISO();
    for(const iso of [g, U.iso(U.addDays(U.parse(g), -1))]){
      const day = S.days[iso], b = day && day.blocks.find(x => x.startedAt && (!id || x.id === id));
      if(b) return { day, b };
    }
    return null;
  }
  function runningBlock(){ const r = calisan(); return r ? r.b : null; }
  function elapsedSeconds(block){
    if(!block || !block.startedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(block.startedAt).getTime())/1000));
  }
  /* Verimli saat (calc.verimliSaat, fikir 21): zamanlayıcı oturumunun
     BAŞLADIĞI saat ve süresi ölçümdür; blokta saklanır. */
  function oturumYaz(block, dk){
    if(!block || !block.startedAt || !(dk > 0)) return;
    block.oturumlar = (block.oturumlar || []).concat([{ bas:block.startedAt, dk }]).slice(-12);
  }
  function startTick(){
    stopTick();
    tickHandle = setInterval(() => {
      const b = runningBlock();
      const el = document.getElementById('timer-clock');
      if(!b || !el){ stopTick(); return; }
      el.textContent = U.fmtClock(elapsedSeconds(b));
      const g = document.getElementById('geri-sayim');
      if(g && elapsedSeconds(b) % 30 === 0) g.innerHTML = geriSayimHtml(b);
    }, 1000);
  }
  function stopTick(){
    if(tickHandle){ clearInterval(tickHandle); tickHandle = null; }
  }

  /* ---------- parcalar ---------- */

  function AnchorTile(o){
    const pct = o.target ? Math.min(100, 100*o.actual/o.target) : 0;
    const step = d => c.Button({ label:d > 0 ? '+'+d : '−', size:'sm', class:'grow',
      aria:(d > 0 ? 'artır' : 'azalt'), act:'anchor', data:{ 'data-kind':o.kind, 'data-delta':d } });
    return c.Card({ pad:'sm', body:html`
      <div class="stack-xs">
        <div class="row between">
          <span class="stat__label">${o.label}</span>
          ${o.actual != null && o.actual >= o.target ? c.Badge({ label:'tamam', tone:'ok' }) : html`<span class="tiny dim">${o.hint}</span>`}
        </div>
        ${VT() && VT().adimliSayi
          /* 168 ADIMLI SAYI: küçük sayı için büyük artı/eksi (48 px); +5 yanında. */
          ? html`${raw(VT().adimliSayi({ etiket:o.label + ' · bugün', ad:o.label, deger:o.actual == null ? null : Number(o.actual),
              birim:'/ ' + o.target + ' soru', act:'anchor', data:{ 'data-kind':o.kind }, not:'tek dokunuş · +5 aşağıda' }))}
            <div class="row row--tight">${step(5)}</div>`
          : html`<span class="anchor__value num">${o.actual == null ? '—' : o.actual}<span class="dim">/${o.target}</span></span>
            ${c.Bar({ value:pct, tone:'' })}
            <div class="row row--tight">${step(-1)}${step(1)}${step(5)}</div>`}
      </div>` });
  }

  /* Plan dışı soru: «soru 40» (Telegram, derssiz giriş) bir bloğa değil
     günün toplamına yazılır; burada görünmezse kayıt kaybolmuş sanılır. */
  function AnchorPane(day){
    const serbest = Number(day.freeQ) || 0;
    const dogru = day.freeCorrect == null ? null : Number(day.freeCorrect);
    return html`${c.Cols(2, html`
      ${AnchorTile({ label:yz('ays.today.paragraf'), actual:day.paragraphActual, target:day.paragraphTarget, kind:'paragraph', hint:'günlük 15–20' })}
      ${AnchorTile({ label:yz('ays.today.problem'), actual:day.problemActual, target:day.problemTarget, kind:'problem', hint:'günlük 15–20' })}`)}
      ${when(serbest > 0, () => html`<p class="tiny dim mt-6">${yz('ays.today.plan-disi')} ${serbest} soru${
        dogru ? ' · ' + dogru + ' doğru' : ''} ${yz('ays.today.bir-derse-baglanmadan-girild')}</p>`)}`;
  }

  function StatusBadge(status){
    const m = { done:['Tamamlandı','ok'], partial:['Yarım','warn'], skipped:['Atlandı','muted'], pending:['Bekliyor','muted'] };
    const [label, tone] = m[status] || m.pending;
    return c.Badge({ label, tone, icon:status === 'done' });
  }

  const STATUSES = [['pending','Bekliyor'],['done','Tamamlandı'],['partial','Yarım'],['skipped','Atlandı']];

  /* GÜNÜN ODAK ROZETİ — blokların başlığının yanında, o günün
     raporunda. Başarımlar sekmesindeki odak rozeti ömürlük rekordur;
     bu ise BU GÜNÜN kendisi (bkz. core/basarim.js, gununOdagi).
     Yalnız ÖLÇÜLMÜŞ süre sayılır: `actualMin` boş bırakılan blok
     «sıfır dakika» değil «veri yok»tur. Eşiğin altındaki gün rozet
     almaz ve boş döner. */
  function OdakRozeti(day){
    if(!R.Basarim) return '';
    const dk = ((day && day.blocks) || []).reduce(function(t, b){
      return t + (b && b.actualMin != null ? Number(b.actualMin) || 0 : 0);
    }, 0);
    return R.Basarim.odakHtml(dk);
  }

  function BlockCard(b){
    const running = !!b.startedAt;
    const done = b.status === 'done' || b.status === 'partial';
    const acc = (b.actualQ && b.correctQ != null) ? U.pct(b.correctQ, b.actualQ) : null;

    const numField = (label, field, value) => c.Field({ label, input:c.Input({
      type:'number', min:0, size:'sm', numeric:true, value:value == null ? '' : value,
      change:'block-num', data:{ 'data-field':field, 'data-block':b.id } }) });

    return html`
      <article class="${R.h.cls('block', running && 'is-running', !running && b.status === 'done' && 'is-done',
        !running && b.status === 'partial' && 'is-partial', b.status === 'skipped' && 'is-skipped')}">
        <div class="row between block__top">
          <div class="grow">
            <div class="block__slot">${b.slot} · ${b.targetMin} dk${when(b.targetQ, () => html` · ${b.targetQ} soru`)}</div>
            ${c.Input({ class:'input--ghost block__topic', value:b.topic, aria:yz('ays.today.blok-konusu'),
              change:'block-topic', data:{ 'data-block':b.id } })}
            <div class="tiny dim block__subject">${b.subject}</div>
          </div>
          ${running
            ? html`<div class="stack-xs block__timer-wrap">
                <span class="block__timer" id="timer-clock">${U.fmtClock(elapsedSeconds(b))}</span>
                ${c.Button({ label:yz('ays.today.bitir'), icon:'stop', tone:'primary', size:'sm', act:'timer-stop', data:{ 'data-block':b.id } })}
              </div>`
            : b.status === 'pending'
              ? html`<div class="row-sm">${when(sonrakiBekleyen(b), () => c.Button({ label:yz('ays.today.sonraya-al'), size:'sm', tone:'ghost',
                  act:'block-sonra', data:{ 'data-block':b.id } }))}${c.Button({ label:yz('ays.today.baslat'), icon:'play', size:'sm', act:'timer-start', data:{ 'data-block':b.id } })}</div>`
              : StatusBadge(b.status)}
        </div>

        ${c.Segmented({ items:STATUSES.map(s => ({ value:s[0], label:s[1] })), value:b.status,
          act:'block-status', block:true, primary:true, aria:yz('ays.today.blok-durumu'), data:{ 'data-block':b.id } })}

        ${c.Cols(2, html`
          ${c.Field({ label:yz('ays.today.ders'), input:c.Select({ size:'sm', value:b.subjectId || '',
            change:'block-subject', data:{ 'data-block':b.id },
            options:[{ value:'', label:yz('ays.today.baglanmadi') }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name }))) }) })}
          ${c.Field({ label:yz('ays.today.konu'), input:c.Select({ size:'sm', value:b.topicId || '',
            change:'block-topic-ref', data:{ 'data-block':b.id },
            options:blockTopicOptions(b.subjectId) }) })}
        `)}

        ${when(done, () => html`
          <div class="cols-3">
            ${numField('Dakika','actualMin', b.actualMin)}
            ${numField('Soru','actualQ', b.actualQ)}
            ${numField('Doğru','correctQ', b.correctQ)}
          </div>
          ${when(acc != null, () => html`<div class="${acc >= 70 ? 'tiny dim' : 'tiny tone-warn'}">${yz('ays.today.dogruluk')}${acc}${acc < 70 ? ' — hedef eşiğin altında' : ''}</div>`)}`)}

        ${when(b.status === 'skipped', () => html`
          <div class="stack-xs">
            <span class="mono-label">${yz('ays.today.neden-atlandi')}</span>
            <div class="row wrap row--tight">
              ${map(R.SKIP_REASONS, r => c.Chip({ label:r, on:b.skipReason === r, act:'skip-reason',
                data:{ 'data-block':b.id, 'data-reason':r } }))}
            </div>
          </div>`)}
      </article>`;
  }

  /* 054 TAŞIMA GÖLGESİ: bekleyen blok bir sonraki bekleyen bloğun
     arkasına alınır (küçük aksiyon: tek gün, tek kayıt). Eski yeri hayalet
     çizgiyle kalır, «Geri al» ekrandadır. */
  let sonTasima = null;   // { date, id, eski }
  function sonrakiBekleyen(b){
    const day = todayDoc();
    if(!day || b.startedAt) return null;
    const i = day.blocks.indexOf(b);
    return day.blocks.slice(i + 1).find(x => x.status === 'pending' && !x.startedAt && x.slot !== 'Dinlenme') || null;
  }
  function tasimaKutusu(day){
    const V = VT();
    if(!V || !sonTasima || !day || sonTasima.date !== day.date) return '';
    const b = day.blocks.find(x => x.id === sonTasima.id);
    if(!b) return '';
    const ad = x => x.topic || x.subject || x.slot;
    const liste = [];
    day.blocks.filter(x => x.slot !== 'Dinlenme').forEach((x, i) => {
      if(i === sonTasima.eski) liste.push({ ad:ad(b), hayalet:true });
      if(x.id === b.id) liste.push({ ad:ad(b), not:'yeni yeri', tasinan:true });
      else liste.push({ ad:ad(x), not:x.slot });
    });
    return c.Kutu({ ad:yz('ays.today.blok-tasindi'), yuva:'küçük · geri alınır', class:'vkutu',
      govde:raw(V.tasimaGolgesi({ bloklar:liste, act:'block-geri' })) });
  }

  function blockTopicOptions(subjectId){
    const s = R.SUBJECTS.find(x => x.id === subjectId);
    if(!s) return [{ value:'', label:yz('ays.today.once-ders') }];
    return [{ value:'', label:yz('ays.today.konu-2') }].concat(s.topics.map(t => ({ value:t.id, label:t.name })));
  }

  function StreakCard(){
    const s = C.behaviorStreak();
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">${yz('ays.today.davranis-serisi')}${raw(UI.hint('streak'))}</span>
        <b class="num">${s.streak}<span class="dim streak__unit"> ${yz('ays.today.gun')}</span></b>
      </div>
      <div class="streak">
        <div class="streak__dots">
          ${map(s.days, d => html`<span class="${R.h.cls('streak__dot', d.met && 'is-on', d.today && 'is-today')}"
            title="${U.fmtShort(d.iso)}${d.met ? ' · tamam' : ''}"></span>`)}
        </div>
      </div>
      <p class="tiny dim">${s.streak === 0 ? yz('ays.today.minimum-standardi-tutturunca') : yz('ays.today.odul-nete-degil-duzene-bagli')}</p>
      ${SeriKontrol()}` });
  }

  /* Seri dondurma ve tatil modu (brand/ortak/seri.js, core/tatil.js): hasta
     gün ve tatil seriyi bozmaz; tatilde plan ara, dönüşte iki gün yarım süre. */
  /* Yıllık tatil sınırı kullanıcının ayarıdır (kullanıcı kararı 2026-09-24;
     brand/ortak/seri.js). Düşürmek var olan tatili silmez. */
  function TatilSiniri(){
    const sinir = R.Seri.yillikTatil(), kalan = R.Seri.kalanTatil();
    return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny dim">${yz('ays.today.yillik-tatil-siniri-bu-yil')} ${kalan} / ${sinir} ${yz('ays.today.gun')}</span>
      ${c.Input({ id:'seri-tatil-sinir', type:'number', size:'sm', numeric:true, value:sinir,
        aria:yz('ays.today.yillik-tatil-siniri-gun') })}
      ${c.Button({ label:yz('ays.today.siniri-kaydet'), size:'sm', act:'seri-tatil-sinir' })}</div>`;
  }

  function SeriKontrol(){
    if(!R.Seri) return '';
    const bugun = U.todayISO();
    const t = R.Seri.aktifTatil(bugun);
    const k = R.Seri.kayitOf(bugun);
    if(t) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">${yz('ays.today.tatil-modu')} ${U.fmtShort(t.bas)} – ${U.fmtShort(t.bit)} ${yz('ays.today.seri-korunuyor-hkm-soru')}</span>
      ${c.Button({ label:yz('ays.today.tatili-bitir'), size:'sm', act:'seri-tatil-bitir' })}</div>`;
    if(k) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">${yz('ays.today.bugun-dondurulmus')}${LIFEOS.Seri.NEDEN[k.neden].toLocaleLowerCase('tr')}${yz('ays.today.seri-bozulmaz')}</span>
      ${c.Button({ label:yz('ays.today.geri-al'), size:'sm', act:'seri-coz', data:{ 'data-id':k.id } })}</div>`;
    if(S.ui.tatilSec) return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny">${yz('ays.today.kac-gun')}</span>
      ${map([3, 7, 14], n => c.Button({ label:n + ' gün', size:'sm', act:'seri-tatil-gun', data:{ 'data-gun':String(n) } }))}
      ${c.Button({ label:yz('ays.today.vazgec'), size:'sm', act:'seri-tatil-vazgec' })}</div>
      ${TatilSiniri()}`;
    return html`<div class="row wrap gap-6 mt-6">
      ${c.Button({ label:yz('ays.today.bugun-hastayim-seri-donsun'), size:'sm', act:'seri-hasta' })}
      ${c.Button({ label:yz('ays.today.tatil-modu-2'), size:'sm', act:'seri-tatil' })}</div>`;
  }

  function SleepCard(day){
    const avg = C.sleepAverage(7);
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">${yz('ays.today.uyku')}${raw(UI.hint('sleep'))}</span>
        ${when(avg != null, () => html`<span class="tiny dim">${yz('ays.today.7-gun-ort')} ${avg} sa</span>`)}
      </div>
      <div class="row sleep__row">
        ${c.Input({ type:'number', step:0.5, min:0, max:14, size:'sm', numeric:true, class:'sleep__input',
          value:day.sleepHours == null ? '' : day.sleepHours, aria:yz('ays.today.uyku-saati'), change:'sleep' })}
        <span class="small muted">${yz('ays.today.saat-hedef')} ${S.profile.sleepTarget}</span>
      </div>
      ${when(day.sleepHours != null && day.sleepHours < 6.5,
        () => html`<p class="tiny tone-warn">${yz('ays.today.uyku-bellek-pekismesinin-par')}</p>`)}` });
  }

  function RitualCard(day){
    const ritual = R.WEEKDAYS[day.dow].ritual;
    if(!ritual) return '';
    const list = R.CHECKLISTS[{ contract:'monday', exam:'saturday', review:'sunday' }[ritual]];
    const state = day.checklist || {};
    const cta = ritual === 'contract'
      ? c.Button({ label:yz('ays.today.haftalik-sozlesmeyi-ac'), tone:'primary', block:true, act:'go', data:{ 'data-route':'week' } })
      : ritual === 'exam'
        ? c.Button({ label:yz('ays.today.deneme-ekle'), tone:'primary', block:true, act:'go', data:{ 'data-route':'exams' } })
        : c.Button({ label:yz('ays.today.haftalik-degerlendirmeyi-ac'), tone:'primary', block:true, act:'open-review' });

    return c.Card({ title:list.label, sub:yz('ays.today.bugunun-ritueli'), body:html`
      <div class="stack-xs">
        ${map(list.items, (it, i) => c.Checkbox({ label:it, checked:!!state[ritual+'-'+i],
          act:'checklist', data:{ 'data-key':ritual+'-'+i } }))}
      </div>
      <div class="ritual__cta">${cta}</div>` });
  }

  function DueCards(){
    const due = C.dueCards().sort((a,b) => a.dueAt.localeCompare(b.dueAt));
    const overdue = C.overdueCards().length;
    if(!due.length){
      return c.Card({ title:yz('ays.today.due-kartlar'), badge:c.Badge({ label:'temiz', tone:'ok' }),
        body:html`<p class="small muted">${yz('ays.today.bugun-icin-bekleyen-kart-yok')}</p>` });
    }
    const card = due[0];
    const flipped = !!S.ui.flipped[card.id];
    const rate = (rating, label, tone) => c.Button({ label, tone, class:'grow', act:'rate',
      data:{ 'data-id':card.id, 'data-rating':rating } });

    return c.Card({
      title:yz('ays.today.due-kartlar'), sub:due.length+' kart bekliyor'+(overdue ? ' · '+overdue+' gecikmiş' : ''),
      actions:c.Button({ label:yz('ays.today.tumu'), size:'sm', act:'go', data:{ 'data-route':'cards' } }),
      body:html`
        <div class="flashcard flashcard--sm" data-act="flip" data-id="${card.id}" role="button" tabindex="0">
          <span class="flashcard__side">${flipped ? 'Arka' : 'Ön'}</span>
          <span class="flashcard__text">${flipped ? (card.back || '—') : card.front}</span>
        </div>
        ${flipped
          ? html`<div class="row row--tight due__actions">
              ${rate('forgot','Hatırlamadım','danger')}${rate('hard','Zorlandım')}${rate('remembered','Hatırladım','primary')}
            </div>`
          : html`<p class="tiny dim center due__hint">${yz('ays.today.cevabi-gormek-icin-karta-dok')}</p>`}` });
  }

  function RepairQueue(){
    const open = C.openErrors().filter(e => !e.repairDoneAt).slice(0, 6);
    if(!open.length) return '';
    return c.Card({ title:yz('ays.today.tamir-kuyrugu'), sub:yz('ays.today.acik-yanlislarin-receteleri'),
      actions:c.Button({ label:yz('ays.today.yanlis-defteri'), size:'sm', act:'go', data:{ 'data-route':'cards', 'data-tab':'notebook' } }),
      body:html`<div class="list">
        ${map(open, e => html`
          <div class="listitem">
            ${raw(UI.tagDot(e.tag))}
            <div class="grow">
              <div class="small strong">${e.topic || e.testName || 'Yanlış'}</div>
              <div class="tiny dim">${e.recipe}</div>
            </div>
            ${c.Button({ label:yz('ays.today.yapildi'), size:'sm', act:'repair-done', data:{ 'data-id':e.id } })}
          </div>`)}
      </div>` });
  }

  function WeekContext(week, n){
    const comp = C.planCompletion(n);
    const qr = C.questionRealization(n);
    const phase = M.phaseOf(n);
    return c.Card({
      title:yz('ays.today.hafta')+n+' bağlamı', sub:phase.label+' — '+phase.theme,
      actions:c.Button({ label:yz('ays.today.ac'), size:'sm', act:'go', data:{ 'data-route':'week' } }),
      body:html`
        <div class="stack-sm">
          <div class="stack-xs">
            <span class="mono-label">${yz('ays.today.bu-haftanin-ana-konulari')}</span>
            ${map(week.mainTopics, t => html`
              <div class="row between"><span class="small">${t.name}</span>
              <span class="tiny dim num">${t.questionTarget} ${yz('ays.today.soru')}${t.accuracy}</span></div>`)}
          </div>
          ${when(comp != null, () => c.Meter({ label:yz('ays.today.plan-tamamlama'), value:comp }))}
          ${when(qr && qr.pct != null, () => c.Meter({ label:yz('ays.today.soru-gerceklesme'), value:qr.pct, text:qr.solved+' / '+qr.target }))}
          ${c.Notice({ body:week.checkpoint, tone:'info' })}
        </div>` });
  }

  /* ---------- hedeflerim ----------
     HEDEFLERİM (core/hedefler.js + core/hedefplan.js). Hedef Ekip sohbetinde
     Patron'la konuşarak kurulur: «TYT matematiği 100 günde bitirmek istiyorum»,
     «TYT'de 90 nete çıkmak istiyorum». Burada görünür, planı kurulur,
     askıya alınır, bırakılır. PLAN BÜYÜK AKSİYONDUR (AGENTS.md §1.9): önce
     ayrıntılı önizleme, sonra «Planı uygula» — önizleme onayın kendisidir —
     ve her zaman «Planı geri al». Sayılar ve cümleler motorundur; ekran
     yalnız çizer. */
  const BANT = { gercekci:'gerçekçi', zorlayici:'zorlayıcı',
    gercekci_degil:'bu sürede olmaz', guvensiz:'güvenli değil' };

  function hedefDugmeleri(h){
    return html`
      ${h.durum === 'aktif'
        ? c.Button({ label:yz('ays.today.askiya-al'), size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'askida' } })
        : c.Button({ label:yz('ays.today.surdur'), size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'aktif' } })}
      ${c.Button({ label:yz('ays.today.tamamlandi'), size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'tamam' } })}
      ${c.Button({ label:yz('ays.today.birak'), size:'sm', tone:'ghost', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'birakildi' } })}`;
  }

  function haftaSatiri(w){
    const P = R.HedefPlan;
    const parca = w.konular.map(k => k.name + (k.bitti ? '' : ' (sürüyor)'));
    return html`<div class="stack-xs">
      ${when(parca.length, () => html`<p class="tiny"><b>Konular:</b> ${parca.join(' · ')}</p>`)}
      ${when(w.deneme, () => html`<p class="tiny"><b>${yz('ays.today.deneme-gunu')}</b> ${w.deneme.ad} ${yz('ays.today.cozum-analiz')} ${P.dkYaz(w.deneme.dk)})</p>`)}
      ${when(w.tekrar.length, () => html`<p class="tiny"><b>Tekrar:</b> ${w.tekrar.join(' · ')}</p>`)}
    </div>`;
  }

  function hedefOnizleme(h){
    const r = R.HedefPlan.kur(h, U.todayISO());
    if(!r.ok){
      return html`<div class="mt-8">${c.Notice({ tone:'warn', title:yz('ays.today.plan-kurulamadi'), body:r.why })}
        <div class="row gap-8 mt-8">${c.Button({ label:yz('ays.today.kapat'), size:'sm', act:'hedef-plan-kapat' })}</div></div>`;
    }
    const p = r.plan;
    return html`<div class="mt-8">
      <p class="tiny dim"><b>${yz('ays.today.plan-onizlemesi')}</b> ${yz('ays.today.onaylanana-kadar-hicbir-sey')}</p>
      ${c.Table({ tight:true, headers:['', 'Şimdi', yz('ays.today.plandan-sonra')],
        rows:R.HedefPlan.onizleme(p).map(x => [x.alan, x.once, x.sonra]) })}
      ${when(p.paket === 'konu' && p.haftalar.length, () => html`<p class="tiny mt-8"><b>${yz('ays.today.i-lk-hafta')}</b>
        (${U.fmtShort(p.haftalar[0].bas)} – ${U.fmtShort(p.haftalar[0].bit)})</p>${haftaSatiri(p.haftalar[0])}`)}
      ${when(p.paket === 'net', () => html`<p class="tiny mt-8"><b>${yz('ays.today.kontrol-noktalari')}</b>
        ${p.kontroller.map(k => U.fmtShort(k.tarih) + ' → ' + U.fmtNet(k.beklenen)).join(' · ')}</p>`)}
      ${when(p.uyarilar.length, () => html`<div class="stack-sm mt-8">${map(p.uyarilar, u =>
        c.Notice({ tone:'info', body:u }))}</div>`)}
      <p class="tiny dim mt-8">${yz('ays.today.plan')} ${p.etiket === 'hesaplandi' ? 'kendi denemelerinden hesaplandı'
        : 'müfredatın süre tahminlerine dayanır (tahmin)'}${yz('ays.today.geri-alinabilir-geri-alinca')}</p>
      <div class="row gap-8 mt-8" style="flex-wrap:wrap">
        ${c.Button({ label:yz('ays.today.plani-uygula'), size:'sm', tone:'primary', act:'hedef-plan-uygula',
          data:{ 'data-id':h.id } })}
        ${c.Button({ label:yz('ays.today.simdilik-degil'), size:'sm', act:'hedef-plan-kapat' })}
      </div></div>`;
  }

  /* UYARLAMA DÖNGÜSÜ (brand/ortak/hedef.js `uyarla`). Plan kontrolde geride
     kalınca hedef BUGÜNÜN verisiyle yeniden değerlendirilir; yetişmiyorsa
     seçenekler sunulur. Seçim yapana kadar hiçbir şey değişmez; seçince eski
     plan geri alınır, hedef güncellenir ve yeni plan yine önizleme ve
     onaydan geçer (büyük aksiyon). */
  function uyarlamaKutusu(h){
    const H = window.LIFEOS.Hedef;
    const u = H.uyarla(h, R.Hedefler.PAKET_BY_ID[h.paket], {}, U.todayISO());
    return html`<div class="mt-8">
      <p class="tiny dim"><b>${yz('ays.today.bugunun-verisiyle-yeniden-he')}</b> ${yz('ays.today.secim-yapana-kadar-hicbir')}</p>
      <p class="small">${u.metin}</p>
      ${u.senaryolar.length ? html`<div class="row gap-8 mt-8" style="flex-wrap:wrap">${map(u.senaryolar, (x, i) =>
        c.Button({ label:x.ad + ' · ' + H.tarihYaz(x.son_tarih), size:'sm', act:'hedef-uyarla-sec',
          data:{ 'data-id':h.id, 'data-i':String(i) } }))}</div>
        <p class="tiny dim mt-8">${yz('ays.today.secince-eski-plan-geri-alini')}</p>`
        : c.Notice({ tone:'info', body:yz('ays.today.bu-tarihe-hala-yetisilebilir') })}
      <div class="row gap-8 mt-8">${c.Button({ label:yz('ays.today.kapat'), size:'sm', act:'hedef-uyarla-kapat' })}</div>
    </div>`;
  }

  function hedefPlanOzeti(h, p){
    const bugun = U.todayISO();
    const il = R.HedefPlan.ilerleme(p, bugun);
    const w = p.paket === 'konu' ? R.HedefPlan.haftaOf(p, bugun) : null;
    return html`<div class="stack-sm mt-8">
      <p class="small">${yz('ays.today.plan-uygulandi')}${p.paket === 'konu' ? ' · günde ' + p.gunlukDk + ' dk'
        + (p.haftalikGun < 7 ? ', haftada ' + p.haftalikGun + ' gün' : '') : ''}</p>
      ${when(w, () => html`<p class="tiny dim">${yz('ays.today.bu-hafta')}${U.fmtShort(w.bas)} – ${U.fmtShort(w.bit)})</p>${haftaSatiri(w)}`)}
      ${when(p.paket === 'net' && il.sonraki, () => html`<p class="tiny">${yz('ays.today.sonraki-kontrol')} <b>${U.fmtDate(il.sonraki.tarih)}</b>
        ${yz('ays.today.beklenen')} ${U.fmtNet(il.sonraki.beklenen)} net</p>`)}
      ${when(p.paket === 'net' && p.odak.length, () => html`<p class="tiny dim">${yz('ays.today.odak-konulari')}
        ${p.odak.map(k => k.name).join(' · ')}</p>`)}
      ${c.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      ${S.ui.uyarla === h.id ? uyarlamaKutusu(h) : when(il.durum === 'geride', () => c.Button({
        label:yz('ays.today.yeniden-hesapla'), size:'sm', tone:'primary', act:'hedef-uyarla-ac', data:{ 'data-id':h.id } }))}
      <div class="row gap-8" style="flex-wrap:wrap">
        ${c.Button({ label:yz('ays.today.plani-geri-al'), size:'sm', act:'hedef-plan-geri', data:{ 'data-id':h.id } })}
        ${hedefDugmeleri(h)}
      </div></div>`;
  }

  /* ALIŞKANLIK (brand/ortak/aliskanlik.js): planı yoktur; ilerleme doğrudan
     KAYITTAN sayılır. «Kayıt yok» «yapılmadı» demek değildir. */
  function aliskanlikOzeti(h){
    const il = R.Hedefler.ALISKANLIK.ilerleme(h, U.todayISO());
    return html`<div class="stack-sm mt-8">
      ${c.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      <div class="row gap-8" style="flex-wrap:wrap">${hedefDugmeleri(h)}</div></div>`;
  }

  function hedefSatir(h){
    const g = h.gerceklik || {};
    const p = R.HedefPlan ? R.HedefPlan.aktif(h.id) : null;
    const onizle = !p && S.ui.planOnizle === h.id && h.durum === 'aktif';
    return html`<div>
      <div><b class="small">${R.Hedefler.ozet(h)}</b>
        <div class="tiny dim">${h.durum === 'askida' ? 'askıda · ' : ''}${h.son_tarih
          ? 'son tarih ' + U.fmtDate(h.son_tarih) : 'tarihsiz'}${h.kapasite && h.kapasite.gunluk_dk
          ? ' · günde ' + h.kapasite.gunluk_dk + ' dk' : ''}${g.bant ? ' · ' + BANT[g.bant]
          + ' (' + (g.etiket === 'hesaplandi' ? 'hesaplandı' : 'tahmin') + ')' : ''}</div></div>
      ${h.paket === 'aliskanlik' && R.Hedefler.ALISKANLIK ? aliskanlikOzeti(h)
        : p ? hedefPlanOzeti(h, p) : onizle ? hedefOnizleme(h) : html`
        <div class="row gap-8 mt-6" style="flex-wrap:wrap">
          ${when(R.HedefPlan && h.durum === 'aktif', () => c.Button({ label:yz('ays.today.plani-gor'), size:'sm',
            tone:'primary', act:'hedef-plan-onizle', data:{ 'data-id':h.id } }))}
          ${hedefDugmeleri(h)}
        </div>`}
    </div>`;
  }

  /* Zaman bütçesi (HKM core/hedefag.py): üç modülün hedefleri aynı günü
     paylaşır. Cümleyi HKM'nin kodu kurar; burası yalnız gösterir. HKM
     kapalıysa satır hiç çizilmez. */
  function butceSatiri(){
    const b = R.Hedefler.ag ? R.Hedefler.ag.butce() : null;
    if(!b || !b.metin) return '';
    return c.Notice({ tone:{ sigar:'info', sikisik:'warn', sigmaz:'warn' }[b.bant] || 'info', title:yz('ays.today.zaman-butcesi-king'), body:b.metin });
  }

  function HedefKart(){
    if(!R.Hedefler) return '';
    const l = R.Hedefler.aktifler();
    return c.Card({ title:yz('ays.today.hedeflerim'), badge:l.length ? c.Badge({ label:l.length + ' etkin', tone:'info' }) : null,
      actions:c.Button({ label:yz('ays.today.ekip-sohbetinde-hedef-koy'), size:'sm', act:'go', data:{ 'data-route':'team' } }),
      body:l.length ? html`<div class="stack-sm">${raw((window.LIFEOS && window.LIFEOS.PANO) ? window.LIFEOS.PANO.hedefIzgara(l, U.todayISO()) : '')}${butceSatiri()}${map(l, hedefSatir)}</div>`
        : c.Ayrinti({ etiket:yz('ays.today.baska-ornek'),
            ozet:yz('ays.today.henuz-hedefin-yok-ekip-sohbe')
              + 'vaktine ve denemelerine göre olup olmadığını söylerim.',
            govde:html`<p>${yz('ays.today.tyt-matematigi-100-gunde-bit')}</p>` }) });
  }

  /* ---------- uyarilar ---------- */
  /* Denetim sorusu — AYRI EKRAN DEĞİL, Bugün akışının içinde tek kart.

     Nöbetçi (core/goodhart.js) ve sürtünme ölçer (core/friction.js) arka
     planda çalışır; buraya yalnızca sıradaki TEK soru düşer. Grafik yok,
     pencere karşılaştırması yok — onlar isteyen için Analiz →
     Dürüstlük'te durur. Soru yoksa kart HİÇ ÇİZİLMEZ.

     Bir denetim mekanizmasının bir arayüz yüzeyi olması gerekmez; gerekli
     olan tek şey, doğru anda doğru sorunun sorulmasıdır. */
  function SignalCard(){
    if(!R.Signals) return '';
    const sig = R.Signals.current();
    if(!sig) return '';
    if(!sig.seenAt) R.Signals.markSeen(sig.id);
    /* Ortak sade kart (brand/ortak/sorukart.js); yoksa eski kart. */
    if(window.LIFEOS && window.LIFEOS.SORUKART) return raw(window.LIFEOS.SORUKART.kartHtml(sig));

    return c.Card({ title:yz('ays.today.bir-soru'), hint:'signal',
      sub:sig.kind === 'friction' ? 'sürtünme' : 'gösterge',
      body:html`
        <p class="small muted">${sig.title}</p>
        ${c.Notice({ tone:'info', body:sig.question })}
        ${when(sig.answeredAt, () => html`
          <p class="small muted mt-8">${yz('ays.today.cevabin')} ${sig.answer}</p>
          <p class="tiny dim">${yz('ays.today.soru-acik-kalir-ayrismanin-g')}</p>`)}
        ${when(!sig.answeredAt, () => html`
          <div class="mt-8">
            ${c.Field({ label:yz('ays.today.kisa-cevabin-istege-bagli'),
              input:c.Input({ id:'sig-answer', placeholder:yz('ays.today.tek-cumle-yeter') }) })}
            <div class="row wrap mt-8">
              ${c.Button({ label:yz('ays.today.kaydet'), tone:'primary', size:'sm',
                act:'signal-answer', data:{ 'data-id':sig.id } })}
              ${c.Button({ label:yz('ays.today.bu-soru-bana-uymuyor'), size:'sm',
                act:'signal-dismiss', data:{ 'data-id':sig.id } })}
            </div>
          </div>`)}`,
    });
  }

  function Banners(){
    const out = [];
    const untilStart = M.daysUntilStart();
    const goBtn = (label, route) => c.Button({ label, size:'sm', act:'go', data:{ 'data-route':route } });
    /* Her uyarı tonuyla döner; hepsi Ayrıntı'da durur (Faz 2: Bugün'de uyarı yok). */
    /* `sakin`: Bugün'de durmaz, yalnız Ayrıntı'da (yedek hatırlatması bir
       iş değil bir bakımdır; kullanıcı, 2026-10-01: «yedekleme yazısını sil»). */
    const ekle = (tone, o, sakin) => out.push({ tone, sakin:!!sakin, kart:c.Notice(Object.assign({ tone }, o)) });

    if(untilStart > 0){
      ekle('info', { title:untilStart+' gün sonra başlıyor.',
        body:html`${yz('ays.today.program')} ${U.fmtDate(R.PLAN.startISO)} ${yz('ays.today.tarihinde-basliyor-hafta-1-i')}` });
    }
    M.activeProtocols().forEach(p => {
      ekle('warn', { body:html`<b>${p.title}</b> ${yz('ays.today.protokolu')} ${U.fmtShort(p.endsAt)} ${yz('ays.today.tarihine-kadar-aktif')} ${goBtn(yz('ays.today.adimlari-gor'),'protocols')}` });
    });
    const triggers = C.protocolTriggers();
    if(triggers.length){
      const def = R.RECOVERY_PROTOCOLS.find(p => p.id === triggers[0].id);
      ekle('warn', { title:yz('ays.today.telafi-tetiklendi'),
        body:html`${triggers[0].detail} <b>${def.title}</b> ${yz('ays.today.protokolu-oneriliyor')} ${goBtn('İncele','protocols')}` });
    }
    if(M.backupDue()){
      const age = M.backupAgeDays();
      ekle('info', { title:'Yedekleme.',
        body:html`${age === null ? yz('ays.today.henuz-hic-yedek-almadin') : yz('ays.today.son-yedegin')+age+' gün önce alındı.'} ${yz('ays.today.tarayici-verisi-silinirse-ca')} ${goBtn(yz('ays.today.yedek-al'),'guide')}` }, true);
    }
    const debt = C.analysisDebt();
    if(debt.length){
      ekle('danger', { title:yz('ays.today.analiz-borcu'),
        body:html`${debt.length} ${yz('ays.today.denemenin-analizi-24-saati-a')} ${goBtn(yz('ays.today.analize-git'),'exams')}` });
    }
    return out;
  }

  /* ---------- render ---------- */
  /* ---------- günün akışı, enerji, mola, ödül ---------- */

  function FlowCard(){
    const flow = C.dailyFlow();
    return c.Card({
      title:yz('ays.today.gunun-akisi'), hint:'next-action',
      sub:yz('ays.today.i-zle-not-soru'),
      badge:c.Badge({ label:flow.done+'/'+flow.total, tone:flow.pct >= 100 ? 'ok' : 'muted' }),
      body:html`
        ${c.Bar({ value:flow.pct, tone:'' })}
        <div class="mt-12">${map(flow.steps, s => html`
          <div class="${s.done ? 'flowstep is-done' : 'flowstep'}">
            <span class="flowstep__dot">${raw(UI.icon(s.done ? 'check' : s.icon))}</span>
            <div class="minw0">
              <div class="flowstep__title">${s.title}</div>
              <div class="flowstep__why">${s.why}</div>
            </div>
            ${when(!s.done, () => c.Button({ label:yz('ays.today.git'), size:'sm', tone:'ghost',
              act:'go', data:{ 'data-route':s.route } }))}
          </div>`)}</div>`,
    });
  }

  function AutoCard(){
    const list = R.Auto.suggestions();
    if(!list.length) return null;
    return c.Card({
      title:yz('ays.today.sistem-onerileri'), sub:yz('ays.today.otomasyon-onerir-sen-onaylar'),
      badge:c.Badge({ label:String(list.length), tone:'muted' }),
      body:html`<div class="autolist">${map(list, s => html`
        <div class="autorow">
          <span class="autorow__icon">${raw(UI.icon(s.icon))}</span>
          <div class="minw0">
            <div class="small strong">${s.title}</div>
            <div class="tiny dim">${s.why}</div>
          </div>
          ${/* Oneri dugmesi dolu olmaz: ekranin tek dolu dugmesi ritueldir
               (sadelik butcesi). Onerinin onemi sirasinda ve ikonunda. */
            c.Button({ label:yz('ays.today.uygula'), size:'sm', act:s.act, data:s.data || {} })}
        </div>`)}</div>` });
  }

  function PlanHealthCard(){
    const h = M.planHealth();
    if(!h || h.status === 'yeni') return null;
    const tone = h.status === 'saglikli' ? 'ok' : h.status === 'sapma' ? 'warn' : 'danger';
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">${yz('ays.today.plan-sagligi')}</span>
        ${c.Badge({ label:h.pct == null ? '—' : '%'+h.pct, tone })}
      </div>
      ${c.Bar({ value:h.pct || 0, tone:tone === 'ok' ? '' : tone })}
      <p class="tiny dim mt-6">${h.note}</p>
      ${when(h.status !== 'saglikli', () => c.Button({ label:yz('ays.today.plani-yeniden-hesapla'), size:'sm',
        class:'mt-8', act:'auto-replan' }))}` });
  }

  function EnergyCard(){
    const today = U.todayISO();
    const mood = M.moodOf(today);
    const avg = M.energyAverage(7);
    const cur = mood ? mood.energy : null;
    return c.Card({
      title:yz('ays.today.enerji'), sub:yz('ays.today.gunde-tek-soru-plan'),
      badge:when(avg != null, () => c.Badge({ label:yz('ays.today.7-gun-ort-2')+avg, tone:'muted' })),
      body:html`
        <div class="energy">${map(R.ENERGY_SCALE, e => html`
          <button class="${cur === e.value ? 'is-on' : ''}" data-act="energy-set" data-value="${e.value}"
            aria-pressed="${cur === e.value ? 'true' : 'false'}" title="${e.note}">
            <b>${e.value}</b><span>${e.label}</span></button>`)}</div>
        ${when(cur != null, () => html`<p class="tiny dim mt-8">
          ${(R.ENERGY_SCALE.find(e => e.value === cur) || {}).note}</p>`)}`,
    });
  }

  function BreakCard(){
    const sug = C.suggestBreak();
    const taken = M.breaksOf(U.todayISO());
    if(!sug.ok){
      return c.Card({ title:yz('ays.today.mola'), sub:yz('ays.today.bugun-alinan')+taken.length,
        body:c.Notice({ tone:'info', body:sug.reason }) });
    }
    return c.Card({
      title:yz('ays.today.mola'), hint:'minimum-day', sub:sug.minutes+' dakika · '+taken.length+' mola alındı',
      body:html`
        <p class="small muted">${sug.why}</p>
        <div class="stack-xs mt-10">${map(sug.picks, a => html`
          <div class="row between">
            <div class="minw0"><b class="small">${a.name}</b>
              <div class="tiny dim">${a.minutes} ${yz('ays.today.dk')} ${R.ACTIVITY_KINDS[a.kind].label}</div></div>
            ${c.Button({ label:yz('ays.today.aldim'), size:'sm', act:'break-take',
              data:{ 'data-id':a.id, 'data-min':a.minutes } })}
          </div>`)}</div>`,
    });
  }

  function RewardCard(){
    const r = C.todayReward();
    const tier = C.rewardTier();
    const ALL = [
      { key:'minimum', label:yz('ays.today.minimum-gun'), icon:'check' },
      { key:'sleep', label:yz('ays.today.uyku'), icon:'moon' },
      { key:'analysis', label:yz('ays.today.analiz'), icon:'exam' },
      { key:'cards', label:yz('ays.today.tekrar'), icon:'cards' },
    ];
    const has = k => r.earned.some(e => e.key === k);
    return c.Card({
      title:yz('ays.today.bugunun-odulu'), hint:'streak', sub:r.title,
      badge:when(r.all, () => c.Badge({ label:yz('ays.today.tam-gun'), tone:'ok' })),
      body:html`
        <div class="reward">${map(ALL, a => html`
          <span class="${has(a.key) ? 'reward__item' : 'reward__item is-off'}">
            ${raw(UI.icon(has(a.key) ? 'check' : a.icon))}${a.label}</span>`)}</div>

        ${when(tier.current || tier.next, () => html`
          <div class="stack-xs mt-12">
            <div class="row between">
              <span class="small">${tier.current ? tier.current.name + ' eşiği geçildi' : yz('ays.today.i-lk-esik')}</span>
              ${when(tier.next, () => html`<span class="tiny dim num">${tier.next.name}’e ${tier.toNext} ${yz('ays.today.gun')}</span>`)}
            </div>
            ${c.Bar({ value:tier.next ? U.pct(tier.streak, tier.next.days) : 100,
              tone:tier.current ? '' : 'warn' })}
            <span class="tiny dim">${(tier.current || tier.next || {}).note || ''}</span>
          </div>`)}

        <p class="tiny dim mt-10">${r.note}</p>`,
    });
  }

  /* Kötü gün: sistem çökmesin diye tek düğmelik iniş. */
  function BadDayCard(day){
    if(day.badDay){
      return c.Card({ pad:'sm', class:'card--accent', body:html`
        <div class="row between wrap gap-8">
          <div class="minw0">
            <b class="small">${yz('ays.today.bugun-kotu-gun-olarak-isaret')}</b>
            <div class="tiny dim">${day.badDaySoruYok ? yz('ays.today.bugun-paragraf-ve-problem-yo-2') : yz('ays.today.hedef-minimuma-indi-seri-kor')}</div>
          </div>
          <div class="row gap-8">
            ${day.badDaySoruYok ? '' : c.Button({ label:yz('ays.today.soru-da-yok'), size:'sm', act:'bad-day-soru-yok' })}
            ${c.Button({ label:yz('ays.today.geri-al'), size:'sm', act:'bad-day-undo' })}
          </div>
        </div>` });
    }
    return c.Card({ pad:'sm', body:html`
      <div class="row between wrap gap-8">
        <div class="minw0">
          <b class="small">${R.BAD_DAY.label}</b>
          <div class="tiny dim">${R.BAD_DAY.note}</div>
        </div>
        ${c.Button({ label:yz('ays.today.i-saretle'), size:'sm', act:'bad-day' })}
      </div>` });
  }

  /* Dikkat dağılması: tek tık, kalıbı gösterir. */
  function DistractionCard(day){
    const n = day.distractions || 0;
    const trend = R.Analytics.distractionTrend(14);
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">${yz('ays.today.bolunme')}</span>
        <b class="num">${n}<span class="dim"> kez</span></b>
      </div>
      <div class="row gap-8 mt-8">
        ${c.Button({ label:yz('ays.today.1-bolundum'), size:'sm', class:'grow', act:'distract' })}
        ${when(n, () => c.Button({ label:yz('ays.today.sifirla'), size:'sm', tone:'ghost', act:'distract-reset' }))}
      </div>
      ${when(trend.ok && trend.avg >= 2, () => html`<p class="tiny dim mt-6">${trend.note}</p>`)}` });
  }

  /* Ofisten gelen — ekip sen ekrani acmadan da calisir. Notlar kural
     motorundan gelir; brifing gunde bir kez uretilip onbellekten okunur. */
  function OfficeCard(){
    const notes = R.Office.notes();
    /* Bayat brifing burada hic gosterilmez: notlar her zaman tazedir ve
       ikisi celisirse kullanici hangisine inanacagini bilemez. */
    const cached = R.Office.briefingOf();
    const brief = (cached && !cached.stale) ? cached : null;
    const open = R.Office.openDecisions();
    if(!notes.length && !brief && !open.length) return '';

    return c.Card({
      title:yz('ays.today.ofisten'), sub:yz('ays.today.ekibin-bugunku-notu'),
      badge:when(notes.length, () => c.Badge({ label:notes.length + ' not',
        tone:notes.some(n => n.tone === 'danger') ? 'danger' : 'warn' })),
      body:html`
        ${when(brief, () => html`<p class="small">${brief.text}</p>`)}
        ${when(notes.length, () => html`<div class="notes mt-10">${map(notes.slice(0, 3), n => html`
          <div class="${'note note--' + n.tone}">
            <span class="note__dot"></span>
            <span class="minw0"><b class="small">${n.name}:</b> ${n.text}</span>
          </div>`)}</div>`)}
        ${when(open.length, () => html`<div class="mt-10">${c.Notice({ tone:'warn',
          title:yz('ays.today.acik-karar'), body:open[0].title })}</div>`)}
        <div class="row wrap gap-6 mt-10">
          ${c.Button({ label:yz('ays.today.ofise-git'), size:'sm', act:'go', data:{ 'data-route':'office' } })}
          ${c.Button({ label:yz('ays.today.patron-a-sor'), size:'sm', tone:'ghost', act:'ask-agent',
            data:{ 'data-agent':'patron' } })}
        </div>`,
    });
  }

  /* ---------- HKM seridi: KUCUK ve HER GUN ORADA

     HKM ayarlari «Rehber» ekraninin icinde duruyordu: gunde bir bakilan
     bir ekranda, gun boyu acik duran bir baglantinin durumu. Bagli mi
     degil mi, en son ne zaman gitti, bekleyen teklif var mi — bunlar
     Bugun ekraninda TEK SATIR olmali.

     Serit bir AYAR EKRANI DEGILDIR: yalnizca durumu soyler ve tek bir
     is yaptirir (simdi gonder). Ayarin yeri yine Rehber'dir; iki yerde
     iki ayar olsaydi, biri otekini sessizce yenerdi. */
  /* Yalniz burada kullanilan bir gosterim bicimi: ortak araca eklemek,
     ortak araci tek bir ekranin ihtiyaciyla buyutmek olurdu. */
  function saat(iso){
    if(!iso) return null;
    const d = new Date(iso);
    if(isNaN(d.getTime())) return null;
    return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes());
  }

  function HkmSerit(){
    if(!R.Beacon) return '';
    const a = R.Beacon.settings();
    const teklif = (S.ui.hkmIntents || []).length;

    if(!a.enabled){
      /* Kapaliyken de GORUNUR ama bagirmaz: kapali olmak bir hata
         degildir, bir secimdir. */
      return c.Card({ title:yz('ays.today.hkm'), hint:'hkm', sub:yz('ays.today.bagli-degil'),
        body:html`<p class="tiny dim">Hayat Kontrol Merkezi'ne günün
          özetini göndermek istersen Rehber'den açabilirsin. AYS bundan
          bağımsız çalışır: HKM kapalıyken hiçbir şey eksilmez.</p>
          <div class="row gap-8 mt-8">
            ${c.Button({ label:yz('ays.today.rehber-u2019de-ac'), size:'sm', act:'go',
              data:{ 'data-route':'guide' } })}
          </div>` });
    }

    const gitti = saat(a.lastOkAt);
    const denendi = saat(a.lastAt);
    /* Basarisiz son deneme YUTULMAZ: «gonderildi» ile «gonderilmeye
       calisildi» ayri seylerdir. */
    const bozuk = a.lastStatus !== null && a.lastStatus !== undefined
      && a.lastStatus !== 202;
    const alt = bozuk ? ('son deneme ' + (denendi || '—') + ' · başarısız')
      : (gitti ? ('son gönderim ' + gitti) : 'henüz gönderilmedi');

    return c.Card({ title:yz('ays.today.hkm'), hint:'hkm', sub:alt,
      body:html`
        ${when(bozuk, () => c.Notice({ tone:'warn',
          body:(a.lastNote || 'Gönderilemedi.') + ' AYS bundan etkilenmez; '
             + 'veri burada duruyor ve bir sonraki denemede gider.' }))}
        ${when(teklif > 0, () => html`<p class="tiny dim">${teklif} ${yz('ays.today.teklif-bekliyor-onaylar-da')}</p>`)}
        <div class="row gap-8 mt-8">
          ${c.Button({ label:yz('ays.today.simdi-gonder'), size:'sm', act:'hkm-gonder' })}
          ${c.Button({ label:yz('ays.today.ayarlar'), size:'sm', act:'go',
            data:{ 'data-route':'guide' } })}
        </div>
        <p class="tiny dim mt-8">Giden şey günün ÖZETİDİR: etiketli
          ölçümler. Ham veri AYS\u2019te kalır.</p>` });
  }

  /* Bugun bir istisnanin icindeyse ekranda SOYLENIR: bos bir blok listesi
     «plan bozuldu» diye okunur, 240 dakikalik bloklar da «neden bu kadar
     uzun» sorusunu dogurur. */
  function IstisnaKart(day, dateISO){
    const ist = R.Istisna ? R.Istisna.gunIcin(dateISO) : null;
    if(!ist) return '';
    /* Takvim kaydı (tatil, okul sınavı…) buradan bitirilmez: Rehber ›
       İstisnalar'da durur ve orada kaldırılır. */
    const takvim = ist.kaynak === 'takvim';
    if(day.ara){
      const sonraki = U.iso(U.addDays(U.parse(ist.to), 1));
      return c.Notice({ tone:'info',
        title:yz('ays.today.bugun-ara-gunu') + (ist.neden ? ' — ' + ist.neden : ''),
        body:html`${R.Istisna.tanim(ist)}${yz('ays.today.blok-yok-ve-bu')} ${U.fmtShort(sonraki)}
          ${yz('ays.today.gunu-kaldigi-yerden-surer')}
          ${takvim
            ? html`<div class="tiny dim mt-8">Takvim kaydı — Rehber › İstisnalar'dan kaldırılır.</div>`
            : html`<div class="mt-8">${c.Button({ label:yz('ays.today.arayi-bugun-bitir'), icon:'play', size:'sm',
              tone:'ghost', act:'istisna-bitir', data:{ 'data-id':ist.id } })}</div>`}` });
    }
    if(ist.tur === 'sure' && day.istisnaId === ist.id){
      return c.Notice({ tone:'info',
        title:(takvim ? R.Istisna.tanim(ist).split(' · ')[0] + ': bugün ' : yz('ays.today.gecici-sure-ders-gunlerinde'))
          + ist.dakika + ' dk',
        body:R.Istisna.tanim(ist) + '. Tarih bitince temel plana döner; deneme ve '
          + 'kapanış günleri değişmez.' });
    }
    return '';
  }

  /* BUGÜN — üç blok (KOLAY-PLANI Faz 2, 2026-10-26; eskiden Şimdi · Durum ·
     Öneri ve ~12 kutu, «tekrar borcu» beş kez):

       ŞİMDİ        kapak: günün cümlesi ve TEK dolu eylem (kapak())
       NE YAPTIN?   tek satır giriş (brand/ortak/giris.js)
       GÜN          günün akışı ve «Günü kapat»; süren blokta geri sayım

     Sayılar, pano kartları, dönen Durum ve Öneri İlerleme › Özet'te
     (ozetHtml); uyarılar, günün sorusu ve öbür kartlar «Bugün › Ayrıntı»da
     (renderAyrinti). Bekleyen onay Onaylar rozetinde ve Özet'in Öneri'sinde. */
  const AGIRLIK = { danger:3, warn:2, info:1 };
  /* Uyarılar en acilden başlayarak (Ayrıntı'nın başında). */
  function uyarilar(){
    return Banners().sort((a, b) => (AGIRLIK[b.tone] || 0) - (AGIRLIK[a.tone] || 0));
  }

  function AkisSatiri(b, siradaki){
    const d = b.startedAt ? 'suruyor' : b.status;
    const sag = d === 'suruyor' ? c.Badge({ label:yz('ays.today.suruyor'), tone:'mod' })
      : b.id === siradaki ? c.Badge({ label:yz('ays.today.siradaki'), tone:'mod' })
      : d === 'done' ? html`<span class="akis__bitti">${yz('ays.today.bitti')}</span>`
      : d === 'partial' ? html`<span class="akis__yarim">${yz('ays.today.yarim')}</span>`
      : d === 'skipped' ? html`<span class="akis__atla">${yz('ays.today.atlandi')}</span>`
      : html`<span class="akis__sure">${b.targetMin} dk</span>`;
    /* 161 KAYDIRARAK İŞARETLE: bekleyen satır sağa kaydırılırsa bitti,
       sola kaydırılırsa bir sonrakinin arkasına ertelenir. Kaydırma bir
       KISAYOLDUR: aynı iki eylem Ayrıntı'daki blok kartında düğmedir
       (Tamamlandı · Sonra), klavye ve ekran okuyucu oradan erişir. */
    const kay = d === 'pending';
    const ad = b.topic || b.subject || b.slot;
    return html`<li class="${'akis__satir' + (d === 'done' || d === 'skipped' ? ' is-gecti' : '')}"${raw(kay
      ? ' data-kaydir="block-kaydir" data-block="' + b.id + '"' : '')}>
      <span class="akis__slot">${b.slot}</span>
      <span class="akis__nokta" aria-hidden="true"></span>
      <span class="akis__ad">${ad}</span>
      <span class="akis__sag">${sag}</span>
    </li>`;
  }

  /* Planlanan dakika okunur bicimde: 45 dk · 3 sa · 3 sa 15 dk. */
  function sureMetni(dk){
    const n = Math.round(Number(dk) || 0);
    const sa = Math.floor(n / 60), kalan = n % 60;
    return sa ? sa + ' sa' + (kalan ? ' ' + kalan + ' dk' : '') : n + ' dk';
  }

  function AkisKutusu(day){
    const bloklar = day.blocks.filter(b => b.slot !== 'Dinlenme');
    const bitti = bloklar.filter(b => b.status === 'done').length;
    const sira = (bloklar.find(b => b.status === 'pending' && !b.startedAt) || {}).id;
    /* Toplam sure eskiden ayri bir «Gunun acilisi» kartindaydi (006);
       ayni gun, ayni bloklar ikinci kez yazilmasin diye burada tek satir. */
    const dk = bloklar.reduce((t, b) => t + (Number(b.targetMin) || 0), 0);
    return c.Kutu({ ad:yz('ays.today.gunun-akisi'), yuva:bloklar.length ? bloklar.length + ' blok · ' + bitti + ' bitti'
      + (dk > 0 ? ' · ' + sureMetni(dk) : '') : '',
      bitisik:true,
      govde:bloklar.length
        ? html`<ol class="akis" data-oz="001">${map(bloklar, b => AkisSatiri(b, sira))}</ol>${raw(VT() && bloklar.some(b => b.status === 'pending' && !b.startedAt) ? VT().kaydirIpucu() : '')}`
        : html`<p class="akis__bos small muted">${day.ara ? yz('ays.today.bugun-ara-gunu-plan-bos') : yz('ays.today.bugun-icin-blok-yok')}</p>`,
      /* «Günü kapat» (KOLAY Faz 1): ortak çekirdek kuruluysa; ince düğme,
         Bugün'ün tek dolu düğmesi kahramanda kalır. Günü düzenle yerinde. */
      ayak:html`${window.LIFEOS && window.LIFEOS.GUNUKAPAT && window.LIFEOS.GUNUKAPAT.kuruluMu()
        ? c.Button({ label:yz('ays.today.gunu-kapat'), icon:'check', size:'sm', tone:'ghost', act:'gunu-kapat' }) : ''}${c.Button({ label:yz('ays.today.bloklari-ve-sayaclari-ac'), size:'sm', tone:'ghost', act:'go',
        data:{ 'data-route':'gun' } })}` });
  }

  function OzetKutusu(day, dateISO){
    const z = ozetSayilari(day, dateISO);
    const SAYI = z.L && z.L.SAYI;
    const seri = C.behaviorStreak();
    /* Sayı bileşeni yüklü değilse (eski kabuk) düz yazılır; kesinlik yine
       notta söylenir. */
    const sayi = s => SAYI ? raw(SAYI.html(s))
      : html`${s.deger}${when(s.birim, () => html`<small> ${s.birim}</small>`)}`;
    const hucre = (ad, s, not) => html`<div class="ozet__hucre">
      <span class="ozet__ad">${ad}</span>
      <b class="ozet__deger">${sayi(s)}</b>
      <span class="ozet__not">${not}</span></div>`;
    /* Yalniz Durum'da OLMAYAN iki sayi: gunun blogu basliktadir ve Gunun
       akisi'nda, tekrar karti Tekrar borcu kutusunda. Ikinci kez yazilan
       kart sayisi bir de «%0» diyerek «veri yok» ile celisiyordu. */
    const yuva = SAYI ? html`${raw(SAYI.kutuGlifi([z.kalan, z.seri]))}<span>${yz('ays.today.bugun')}</span>` : 'bugün';
    return c.Kutu({ ad:yz('ays.today.ozet'), yuva, bitisik:true, govde:html`<div class="ozet">
      ${hucre(yz('ays.today.sinava-kalan'), z.kalan, z.kalan.kesinlik === 'estimated' ? yz('ays.today.tyt-tarihi-tahmini') : yz('ays.today.tyt-tarihine'))}
      ${hucre('Seri', z.seri, seri.streak ? 'minimum gün tutuldu' : 'minimum gün başlatır')}
    </div>` });
  }

  function SayacKutusu(day, dateISO){
    const minMet = C.minimumDayMet(dateISO);
    const satir = (ad, n, hedef) => {
      /* 030 tik sayacı: hedef küçükse kutucuklar; büyükse (ya da kitaplık
         yoksa) eski çubuk. Girilmemiş sayı «—», sıfır değil. */
      const G = VL().GRAFIK;
      const tik = G && Number.isInteger(hedef) ? G.tikHtml({ etiket:ad, yapilan:n == null ? null : n, hedef }) : '';
      if(tik) return html`<div class="sayac__satir">${raw(tik)}</div>`;
      const oran = hedef ? Math.min(100, Math.round(100 * (n || 0) / hedef)) : 0;
      return html`<div class="sayac__satir"><div class="row between"><span>${ad}</span>
        <b class="num">${n == null ? '—' : n} / ${hedef || 0}</b></div>${c.Bar({ value:oran, tone:'' })}</div>`;
    };
    /* Plan dışı soru (Telegram «soru 40», derssiz giriş) günün toplamına
       yazılır; burada görünmezse kayıt kaybolmuş sanılır. */
    const serbest = Number(day.freeQ) || 0;
    const dogru = day.freeCorrect == null ? null : Number(day.freeCorrect);
    return c.Kutu({ ad:yz('ays.today.gunluk-sayac'), yuva:day.ara ? 'ara günü' : html`${terim('minimum-gun', 'minimum')} ${minMet ? 'tamam' : 'açık'}`,
      govde:html`${satir('Paragraf', day.paragraphActual, day.paragraphTarget)}
        ${satir('Problem', day.problemActual, day.problemTarget)}`,
      ayak:serbest > 0 ? yz('ays.today.plan-disi-2') + serbest + ' soru' + (dogru ? ' · ' + dogru + ' doğru' : '') : null });
  }

  /* v5 DURUM KARTLARI (Tasarım Dili «AYS · Bugün»): günlük sayaç, son
     deneme, tekrar borcu yan yana. Sayı KODDAN gelir ve etiketini taşır;
     deneme yoksa «veri yok» yazar, sıfır yazmaz. */
  /* Vitrin kartları (brand/ortak): sayı 024/025/015, fark 028, çizgi 027,
     eşik çubuğu 029, tik sayacı 030, terim ipucu 016. Kitaplık yüklü
     değilse (eski kabuk) aynı bilgi düz yazılır; hiçbiri sayı uydurmaz. */
  const VL = () => window.LIFEOS || {};
  const terim = (id, metin) => VL().SOZLUK ? raw(VL().SOZLUK.html(id, metin)) : (metin || id);
  const sayiH = (s, o) => VL().SAYI ? raw(VL().SAYI.html(s, o))
    : html`${s.deger == null ? '—' : s.deger}${when(s.birim, () => html`<small> ${s.birim}</small>`)}`;

  /* ---------- C · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  function hedefKutusu(day){
    const p = hedefAyariHtml(day, 'paragraph'), q = hedefAyariHtml(day, 'problem');
    if(!p && !q) return '';
    return c.Kutu({ ad:yz('ays.today.gunluk-hedef'), yuva:'küçük · geri alınır', class:'vkutu',
      govde:html`<div class="vkutu__ikili">${raw(p)}${raw(q)}</div>` });
  }
  const VT = () => VL().VITRIN;
  const bloklarOf = day => (day && day.blocks || []).filter(b => b.slot !== 'Dinlenme');

  /* 043 GERİ SAYIM: süren bloğun PLANLANAN bitişine kalan dakika. Blok
     saati yazılmadığı için başlangıca değil bitişe sayılır; sayı
     kronometreden gelir (ölçüm), plan dakikası bloğun kaydından. */
  function geriSayimHtml(b){
    if(!b || !b.startedAt || !VT() || !(b.targetMin > 0)) return '';
    const kalan = b.targetMin - elapsedSeconds(b) / 60;
    return kalan >= 0 ? VT().geriSayim({ dakika:kalan, ad:b.topic || b.subject || b.slot }) : '';
  }

  /* 157 BIRAKMA ALANI: blok kartı tutulup sürüklenince aralarda bırakma
     yerleri açılır; yaklaşılan yer kesikliden dolu çerçeveye geçer.
     Bırakmak bloğun SIRASINI değiştirir (küçük aksiyon, «Geri al» kalır:
     «Blok taşındı» kutusu). Sürükleme olmayan cihazda «Sonra» düğmesi
     aynı işi yapar. */
  function surukleListesi(day){
    const V = VT();
    const bl = day.blocks;
    if(!V || !V.birakmaAlani) return String(html`${map(bl, BlockCard)}`);
    const ad = b => b.topic || b.subject || b.slot;
    let h = '<div class="bloklar" data-suruklenebilir="">';
    bl.forEach((b, i) => {
      h += V.birakmaAlani({ sira:i, metin:yz('ays.today.buraya-birak') + (i + 1) + '. sıra', etiket:(i + 1) + '. sıraya bırak' });
      const tas = b.status === 'pending' && !b.startedAt;
      h += '<div' + (tas ? ' data-surukle="' + b.id + '" draggable="true" aria-label="' + ad(b).replace(/"/g, '&quot;') + ' — sürükleyip sırasını değiştir"' : '') + '>'
        + String(BlockCard(b)) + '</div>';
    });
    h += V.birakmaAlani({ sira:bl.length, metin:yz('ays.today.buraya-birak-en-sona'), etiket:yz('ays.today.en-sona-birak') }) + '</div>';
    return h;
  }
  let surukleKurulu = false;
  function surukleKur(){
    if(surukleKurulu) return;
    surukleKurulu = true;
    let tutulan = null;
    const liste = () => document.querySelector('[data-suruklenebilir]');
    document.addEventListener('dragstart', e => {
      const el = e.target.closest && e.target.closest('[data-surukle]');
      if(!el) return;
      tutulan = el.dataset.surukle;
      el.classList.add('is-surukleniyor');
      try{ e.dataTransfer.setData('text/plain', tutulan); e.dataTransfer.effectAllowed = 'move'; }catch(x){}
      const l = liste(); if(l) l.classList.add('is-suruklen');
    });
    document.addEventListener('dragover', e => {
      const z = tutulan && e.target.closest && e.target.closest('[data-birak]');
      document.querySelectorAll('.vk-birak.is-yakin').forEach(x => { if(x !== z) x.classList.remove('is-yakin'); });
      if(!z) return;
      e.preventDefault();
      z.classList.add('is-yakin');
    });
    document.addEventListener('drop', e => {
      const z = tutulan && e.target.closest && e.target.closest('[data-birak]');
      if(!z) return;
      e.preventDefault();
      const id = tutulan; tutulan = null;
      handle['block-sira']({ dataset:{ block:id, sira:z.dataset.birak } });
    });
    document.addEventListener('dragend', () => {
      tutulan = null;
      document.querySelectorAll('.is-surukleniyor').forEach(x => x.classList.remove('is-surukleniyor'));
      document.querySelectorAll('.vk-birak.is-yakin').forEach(x => x.classList.remove('is-yakin'));
      const l = liste(); if(l) l.classList.remove('is-suruklen');
    });
  }

  /* 006 GÜNÜN AÇILIŞI: hiçbir blok başlamamışken iş sayısı, planlanan
     süre ve ilk iş. 007 GÜN KAPANIŞI: bekleyen blok kalmayınca üç sayı;
     süre yalnız ÖLÇÜLMÜŞ dakikadır (girilmemişse «—»). */
  function gunUcuHtml(day, acilisDa){
    const bl = bloklarOf(day);
    if(!VT() || !bl.length || runningBlock()) return '';
    const bekleyen = bl.filter(b => b.status === 'pending');
    if(bekleyen.length === bl.length && !bl.some(b => b.startedAt)){
      /* Bugun'de kahraman (042) ayni ilk isi ve ayni «basla»yi zaten
         gosterir; acilis karti yalniz Ayrinti'da cizilir. */
      if(!acilisDa) return '';
      const ilk = bekleyen[0];
      return VT().gunAcilisi({ is:bl.length, dk:bl.reduce((t, b) => t + (Number(b.targetMin) || 0), 0),
        modul:'ays', sistem:'AYS', ilk:{ ad:ilk.topic || ilk.subject || ilk.slot, not:ilk.slot },
        act:'timer-start', data:{ 'data-block':ilk.id } });
    }
    if(bekleyen.length) return '';
    const olculen = bl.filter(b => b.actualMin != null);
    return VT().gunKapanisi({ biten:bl.filter(b => b.status === 'done' || b.status === 'partial').length, toplam:bl.length,
      dk:olculen.length ? olculen.reduce((t, b) => t + (Number(b.actualMin) || 0), 0) : null,
      ertelenen:bl.filter(b => b.status === 'skipped').length });
  }

  /* 060 BLOK BİTİŞ ÖZETİ: son biten blok ve sıradaki iş. Sayılar bloğun
     kaydından; girilmemiş sayı «—». Süren blok varken çizilmez. */
  function blokBitisHtml(day){
    if(!VT() || !day || runningBlock()) return '';
    const b = bloklarOf(day);
    let son = -1;
    b.forEach((x, i) => { if(x.status === 'done' || x.status === 'partial') son = i; });
    if(son < 0) return '';
    const x = b[son];
    const sira = b.slice(son + 1).find(y => y.status === 'pending') || b.find(y => y.status === 'pending');
    const n = x.actualQ == null ? null : Number(x.actualQ);
    const d = x.correctQ == null || n == null ? null : Number(x.correctQ);
    return VT().blokBitis({ ad:x.topic || x.subject || x.slot, soru:n, dogru:d, digerleri:d == null ? null : Math.max(0, n - d),
      dk:x.actualMin == null ? null : Number(x.actualMin), planDk:x.targetMin,
      sonraki:sira ? { ad:sira.topic || sira.subject || sira.slot, dk:sira.targetMin, act:'timer-start',
        data:{ 'data-block':sira.id } } : null });
  }

  /* 064 HEDEF AYARI: günün çıpa hedefi; hafta toplamı bu haftanın yedi
     gününün hedefinden (açılmamış gün şablonun varsayılanıyla). */
  function hedefAyariHtml(day, kind){
    if(!VT() || !day) return '';
    const alan = kind === 'paragraph' ? 'paragraphTarget' : 'problemTarget';
    const toplam = M.weekDates(M.currentWeek()).reduce((a, d) => {
      const g = S.days[U.iso(d)];
      return a + (g ? Number(g[alan]) || 0 : 18);
    }, 0);
    return VT().hedefAyari({ etiket:(kind === 'paragraph' ? 'Paragraf' : 'Problem') + ' hedefi · bugün',
      ad:(kind === 'paragraph' ? 'paragraf' : 'problem') + ' hedefi', hedef:Number(day[alan]) || 0, haftaToplam:toplam,
      act:'hedef-ayar', data:{ 'data-kind':kind } });
  }

  function SonDenemeKutusu(){
    const L = VL();
    const tyt = (S.exams || []).filter(e => e.family === 'TYT' && e.kind === 'full')
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if(!tyt.length){
      return c.Kutu({ ad:yz('ays.today.son-deneme'), yuva:'veri yok', class:'durumkart',
        govde:html`<p class="durumkart__bos">${yz('ays.today.henuz-tam-tyt-denemesi-yok')} ${terim('net', 'net')} ${yz('ays.today.burada-kendiliginden-cikar')}</p>`,
        ayak:c.Button({ label:yz('ays.today.denemelere-git'), size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'exams' } }) });
    }
    const son = tyt[tyt.length - 1];
    const net = M.examNet(son);
    const once = tyt.length > 1 ? M.examNet(tyt[tyt.length - 2]) : null;
    const fark = once == null ? null : Math.round((net - once) * 100) / 100;
    const netler = tyt.slice(-3).map(M.examNet).sort((x, y) => x - y);
    const medyan = tyt.length >= 3 ? netler[1] : null;
    const d = (son.tests || []).reduce((a, x) => a + Number(x.correct || 0), 0);
    const y = (son.tests || []).reduce((a, x) => a + Number(x.wrong || 0), 0);
    const farkH = fark == null ? '' : L.SAYI
      ? raw(L.SAYI.farkHtml({ deger:fark, yon:L.SAYI.YON.ARTIS_IYI, ondalik:2, ek:'önceki denemeden' }))
      : html`<span class="durumkart__fark">${fark > 0 ? '+' : ''}${U.fmtNet(fark)}</span>`;
    const egri = L.GRAFIK && tyt.length > 1
      ? raw(L.GRAFIK.cizgiSvg(tyt.slice(-8).map(e => ({ tarih:e.date, deger:M.examNet(e) })),
        { gen:132, yuk:36, pay:4, etiket:yz('ays.today.son-denemelerin-tyt-neti'), birim:'net' })) : '';
    return c.Kutu({ ad:yz('ays.today.son-deneme'), yuva:'hesaplandı', class:'durumkart',
      govde:html`<div class="durumkart__ust"><div class="durumkart__sayi">${sayiH({ deger:Math.round(net * 100) / 100,
          birim:'net', ondalik:2, kesinlik:'computed', formul:'doğru − yanlış ÷ 4',
          girdiler:[{ ad:yz('ays.today.dogru'), deger:d, kesinlik:'measured' }, { ad:yz('ays.today.yanlis'), deger:y, kesinlik:'measured' }],
          zaman:son.date })}${farkH}</div>${when(egri, () => html`<div class="durumkart__egri">${egri}</div>`)}</div>
        <p class="durumkart__not">${U.fmtDate(son.date)}${when(medyan != null, () => ' · son üçün medyanı ' + U.fmtNet(medyan))}</p>` });
  }

  function TekrarBorcuKutusu(){
    const L = VL();
    const vadeli = C.dueCards().length;
    const geciken = C.overdueCards ? C.overdueCards().length : null;
    const esik = 10;
    /* Hiç kart yoksa borç ÖLÇÜLMEMİŞTİR: «%0» değil «—» (eksik veri sıfır değildir). */
    const kartVar = (S.cards || []).length > 0;
    const borc = kartVar ? C.cardDebt() : null;
    const cubuk = borc != null && L.GRAFIK
      ? raw(L.GRAFIK.esikCubukHtml({ etiket:yz('ays.today.tekrar-borcu'), deger:borc, esik, olcek:Math.max(50, borc), birim:'%', yon:'azalis-iyi' })) : '';
    return c.Kutu({ ad:terim('tekrar-borcu', yz('ays.today.tekrar-borcu')), yuva:!kartVar ? 'veri yok' : vadeli ? 'hesaplandı' : 'sırası gelen kart yok', class:'durumkart',
      govde:html`<div class="durumkart__sayi">${sayiH({ deger:borc, birim:'%', kesinlik:kartVar ? 'computed' : 'missing',
          formul:'geciken kart ÷ vadeli kart', girdiler:kartVar ? [{ ad:'geciken', deger:geciken, kesinlik:'measured' },
            { ad:'vadeli', deger:vadeli, kesinlik:'measured' }] : [] })}
          ${when(!cubuk && borc != null && borc > esik, () => html`<span class="durumkart__fark is-azaldi">${yz('ays.today.esik-ustu')}</span>`)}</div>
        ${cubuk}
        ${/* Eşik çubuğu (029) eşiği ve farkı zaten yazar; not yalnız sayımı
             söyler (sadelik: aynı değer üç kez yazıyordu). */''}
        <p class="durumkart__not">${cubuk ? '' : html`${terim('esik', 'Eşik')} %${esik}`}${when(vadeli && geciken != null, () => (cubuk ? '' : ' · ') + geciken + ' geciken ÷ ' + vadeli + ' vadeli kart')}</p>`,
      ayak:vadeli ? c.Button({ label:yz('ays.today.tekrara-git'), size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'cards' } }) : null });
  }

  function HafizaKutusu(){
    const yanlislar = R.OgrenTest ? R.OgrenTest.yanlislar() : [];
    const n = yanlislar.length;
    return c.Kutu({ ad:yz('ays.today.hafiza-yoklamasi'), yuva:n ? n + ' soru bekliyor' : 'temiz', class:'durumkart',
      govde:html`<div class="durumkart__sayi">${sayiH({ deger:n, birim:'soru', kesinlik:'measured' })}
          ${when(n > 0, () => html`<span class="durumkart__fark is-azaldi">${yz('ays.today.tekrar-bekliyor')}</span>`)}</div>
        <p class="durumkart__not">${n ? yz('ays.today.unutma-egrisi-yanlis-cozulen') : yz('ays.today.acik-yanlis-soru-yok-hafiza')}</p>`,
      ayak:n ? c.Button({ label:yz('ays.today.yanlislari-coz'), size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'sorular', 'data-tab':'yanlis' } }) : null });
  }

  /* DÖNEN DURUM (kullanıcı, 2026-10-02: «çok daha az yer kaplayan, modern
     ve minimal küçük widget'lar»). Durum'un dört kartı (sayaç, son deneme,
     tekrar borcu, özet) Bugün'de TEK küçük dönen karttır; kartların kendisi
     Ayrıntı'nın başında durur, hiçbiri kalkmadı. Maddeyi ve sayıyı kural
     motoru verir; sayı kesinlik işaretini taşır (SAYI); eksik veri sayı
     değil cümledir. */
  /* analiz: İlerleme › Özet'te seri, tekrar borcu ve sınav pano kartıdır;
     dönen kart ikinci kez yazmaz, seçim sayfasının özetine de dokunmaz. */
  function DonenKutu(day, dateISO, yalnizOzet, analiz){
    const V = VT();
    if(!V || !V.donen) return '';
    const L = VL();
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger == null ? '—' : s.deger) + (s.birim ? ' ' + s.birim : ''));
    const git = (label, route) => ({ label, act:'go', data:{ 'data-route':route } });
    const m = [];

    if(!day.ara){
      const p = Number(day.paragraphActual) || 0, q = Number(day.problemActual) || 0;
      const hedef = (Number(day.paragraphTarget) || 0) + (Number(day.problemTarget) || 0);
      /* 0 «girilmedi»dir, ölçüm değil (HATALAR O-5). Plan dışı soru
         (Telegram «soru 40», derssiz giriş) burada görünmezse kayıt
         kaybolmuş sanılır. */
      const serbest = Number(day.freeQ) || 0;
      const dogru = day.freeCorrect == null ? null : Number(day.freeCorrect);
      const planDisi = serbest > 0 ? yz('ays.today.plan-disi-2') + serbest + ' soru' + (dogru ? ' · ' + dogru + ' doğru' : '') : '';
      m.push(p + q > 0
        ? { ust:yz('ays.today.gunluk-sayac'), sayi:sayi({ deger:p + q, birim:'soru', kesinlik:'measured' }), cumle:yz('ays.today.cozuldu'),
            vurgu:planDisi || (hedef ? yz('ays.today.hedef') + hedef + '.' : ''), sistem:'ays', dugme:git('Sayaçlar', 'gun') }
        : { ust:yz('ays.today.gunluk-sayac'), cumle:yz('ays.today.bugun-sayac-bos'), vurgu:planDisi || yz('ays.today.paragraf-ve-problem-girilmed'), sistem:'ays', dugme:git('Sayaçlar', 'gun') });
    }

    const tyt = (S.exams || []).filter(e => e.family === 'TYT' && e.kind === 'full')
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if(tyt.length){
      const net = Math.round(M.examNet(tyt[tyt.length - 1]) * 100) / 100;
      const once = tyt.length > 1 ? M.examNet(tyt[tyt.length - 2]) : null;
      const fark = once == null ? null : Math.round((net - once) * 100) / 100;
      m.push({ ust:yz('ays.today.son-deneme'), sayi:sayi({ deger:net, birim:'net', ondalik:2, kesinlik:'computed', formul:'doğru − yanlış ÷ 4' }),
        cumle:'', vurgu:fark == null ? yz('ays.today.i-lk-tam-deneme') : (fark > 0 ? '+' : '') + U.fmtNet(fark) + ' öncekinden.',
        sistem:'ays', dugme:git('Denemeler', 'exams') });
    }else{
      m.push({ ust:yz('ays.today.son-deneme'), cumle:yz('ays.today.henuz-tam-deneme-yok'), vurgu:yz('ays.today.net-ilk-denemeyle-cikar'), sistem:'ays', dugme:git('Denemeler', 'exams') });
    }

    const vadeli = C.dueCards().length;
    if((S.cards || []).length){
      const borc = C.cardDebt();
      m.push({ ust:yz('ays.today.tekrar-borcu'), sayi:sayi({ deger:borc, birim:'%', kesinlik:'computed', formul:'geciken kart ÷ vadeli kart' }),
        cumle:yz('ays.today.tekrar-borcu-2'), vurgu:borc > 10 ? yz('ays.today.esigin-ustunde') : yz('ays.today.esik-10'), sistem:'ays',
        gorsel:(window.LIFEOS || {}).GRAFIK && borc != null ? window.LIFEOS.GRAFIK.esikCubukHtml({ etiket:yz('ays.today.tekrar-borcu'), deger:borc, esik:10, olcek:Math.max(50, borc), birim:'%', yon:'azalis-iyi' }) : '',
        dugme:vadeli ? git(yz('ays.today.tekrara-git'), 'cards') : null });
    }else{
      m.push({ ust:yz('ays.today.tekrar-borcu'), cumle:yz('ays.today.tekrar-karti-yok'), vurgu:yz('ays.today.borc-ilk-kartla-olculur'), sistem:'ays' });
    }

    const yanlislar = R.OgrenTest ? R.OgrenTest.yanlislar() : [];
    if(yanlislar.length){
      m.push({ ust:yz('ays.today.hafiza-yoklamasi'), sayi:sayi({ deger:yanlislar.length, birim:'soru', kesinlik:'measured' }),
        cumle:yz('ays.today.tekrar-bekliyor-2'), vurgu:yz('ays.today.aralikli-tekrar-yanlis-cozul'), sistem:'ays',
        dugme:{ label:yz('ays.today.sorulari-coz'), act:'go', data:{ 'data-route':'sorular', 'data-tab':'yanlis' } } });
    }

    const z = ozetSayilari(day, dateISO);
    m.push({ ust:yz('ays.today.sinav'), sayi:sayi(z.kalan), cumle:yz('ays.today.kaldi'), vurgu:z.kalan.kesinlik === 'estimated' ? yz('ays.today.tyt-tahmini-tarih') : 'TYT.',
      sistem:'ays', dugme:git(yz('ays.today.plana-bak'), 'plan') });
    const seri = C.behaviorStreak();
    /* Sıfır seri bir sayı değil, henüz başlamamış bir seridir («0 gün, hesaplandı seri» okunuyordu). */
    m.push(seri.streak
      ? { ust:yz('ays.today.seri'), sayi:sayi(z.seri), cumle:yz('ays.today.ust-uste'), vurgu:yz('ays.today.minimum-gun-tutuldu'), sistem:'ays' }
      : { ust:yz('ays.today.seri'), cumle:yz('ays.today.henuz-baslamadi'), vurgu:yz('ays.today.bugun-minimum-gunu-tamamlars'), sistem:'ays' });

    /* İki küçük widget yan yana (iOS gibi): «Bugün» günün kendisi, «Gidişat»
       haftaların toplamı. Her biri kendi başına döner. */
    const bugunAd = [yz('ays.today.gunluk-sayac'), 'Seri', yz('ays.today.hafiza-yoklamasi')];
    /* Seçim sayfasının minik özeti (hesap.js söz 16); örnek profil yazmaz. */
    const ozet = R.Ornek && R.Ornek.acik() ? null : 'ays';
    const m2 = analiz ? m.filter(x => ['Seri', yz('ays.today.tekrar-borcu'), 'Sınav'].indexOf(x.ust) < 0) : m;
    const bugun = m2.filter(x => bugunAd.indexOf(x.ust) >= 0), gidisat = m2.filter(x => bugunAd.indexOf(x.ust) < 0);
    /* yalnizOzet: kart çizilmez, yalnız seçim sayfasının özeti yazılır (Bugün). */
    if(yalnizOzet){
      const H = (window.LIFEOS || {}).HESAP;
      if(ozet && H && H.ozetYaz){ try{ H.ozetYaz(ozet, 'ays-bugun', bugun); H.ozetYaz(ozet, 'ays-gidisat', gidisat); }catch(e){ /* özet yazılamadı */ } }
      return '';
    }
    return raw(V.donen({ id:'ays-bugun', ad:yz('ays.today.bugun-2'), ozet:analiz ? null : ozet, maddeler:bugun })
      + V.donen({ id:'ays-gidisat', ad:yz('ays.today.gidisat'), ozet:analiz ? null : ozet, maddeler:gidisat }));
  }

  /* 04 SAYFA BAŞI CÜMLESİ (belgeler/ekip/EKIP-PLANI Ek A) — günün durumu TEK cümle,
     KODDAN: bloklar, sıradaki iş ve (eşik aşıldıysa) tekrar borcu. Dil
     modeli hiç çağrılmaz; model kapalıyken de aynı cümle çıkar. Kural
     `C.nextAction` ile aynı eşiği kullanır (borç %10). Soru eki gerektiren
     çekimden kaçınılır («1/3 blok bitti»). */
  function bugunCumlesi(day, dateISO){
    if(!day || (R.Setup && R.Setup.needed && R.Setup.needed())) return '';
    if(day.ara) return yz('ays.today.bugun-ara-gunu-plan-bos-2');
    const bloklar = (day.blocks || []).filter(b => b.slot !== 'Dinlenme');
    if(!bloklar.length) return yz('ays.today.bugun-icin-blok-yok');
    const n = bloklar.length;
    const bitti = bloklar.filter(b => b.status === 'done').length;
    const suren = bloklar.find(b => b.startedAt);
    const sira = bloklar.find(b => b.status === 'pending' && !b.startedAt);
    const ad = b => b.topic || b.subject || b.slot;
    let cumle;
    if(suren) cumle = ad(suren) + ' bloğu sürüyor; ' + bitti + '/' + n + ' blok bitti';
    else if(!sira) cumle = yz('ays.today.bugunun') + n + ' bloğu da kapandı'
      + (C.minimumDayMet(dateISO) ? '; minimum gün tutuldu' : '');
    else cumle = bitti + '/' + n + ' blok bitti; sırada ' + ad(sira);
    const borc = C.cardDebt();
    if(borc > 10) cumle += '; tekrar borcu %' + borc;
    return cumle + '.';
  }

  /* Durum satırı TARİHSİZ (kullanıcı, 2026-10-02: «böyle tarih yazmasın»):
     sayfa «Bugün»; tarih bilgi taşımaz. Satır başlığın yanındaki bilgi
     kartında durur (kabuk sayfaBasi). */
  function tarihSatiri(){
    return yz('ays.today.hafta') + M.currentWeek() + '/' + R.PLAN.totalWeeks;
  }

  /* Özet kutusunun sayıları (024): her sayı kesinlik etiketi ve köken kartı
     taşır. Sınav tarihi profilde yazılı değilse planın varsayılanıdır ve
     «tahmin — ÖSYM duyurusuyla güncellenir» (data/curriculum.js): kalan gün
     o zaman TAHMİNDİR. */
  function ozetSayilari(day, dateISO){
    const L = window.LIFEOS;
    const bloklar = day.blocks.filter(b => b.slot !== 'Dinlenme');
    const bitti = bloklar.filter(b => b.status === 'done').length;
    const profilTarihi = !!(S.profile && S.profile.examTytISO);
    const seri = C.behaviorStreak();
    return {
      kalan:{ deger:U.diffDays(dateISO, R.PLAN.examTytISO), birim:'gün',
        kesinlik:profilTarihi ? 'computed' : 'estimated',
        formul:yz('ays.today.tyt-tarihi-bugun'), girdiler:[{ ad:yz('ays.today.tyt-tarihi'), deger:R.PLAN.examTytISO,
          kesinlik:profilTarihi ? 'measured' : 'estimated' }],
        kaynak:profilTarihi ? 'profildeki sınav tarihi' : 'planın varsayılan tarihi; ÖSYM duyurusuyla güncellenir' },
      blok:{ deger:bitti + '/' + bloklar.length, kesinlik:'computed',
        formul:'biten blok / günün bloğu', girdiler:[{ ad:'biten', deger:bitti, kesinlik:'measured' },
          { ad:yz('ays.today.gunun-blogu'), deger:bloklar.length, kesinlik:'measured' }] },
      kart:{ deger:C.dueCards().length, kesinlik:'computed', formul:'vadesi bugün ya da geçmiş kart' },
      seri:{ deger:seri.streak, birim:'gün', kesinlik:'computed', formul:'minimum günün tutulduğu ardışık gün' },
      L:L,
    };
  }

  /* BUGÜN KAPAĞI (kullanıcı, 2026-10-18: «Bugün kısmı bambaşka, ana sayfa
     gibi olsun»): levhanın üstünde, zeminin üzerinde. Selam perdedekiyle
     aynı açılıştan (brand/ortak/karsilama.js); cümle kural motorunun günün
     cümlesi. Tarih yok (2026-10-02 kararı).
     KOLAY-PLANI Faz 2 (2026-10-26): kapak Bugün'ün «Şimdi»sidir — cümle ve
     TEK dolu eylem. Sayı karoları yok: dört sayı (blok, tekrar kartı, seri,
     sınava kalan gün) İlerleme › Özet'teki pano kartlarında. Eski Şimdi
     kartının «15 dakikam var»ı burada ince düğme; seçiliyken cümle ve eylem
     süreye sığan işi söyler (calc.js onbesDakika). */
  function kapak(){
    const K = window.LIFEOS && window.LIFEOS.KARSILAMA;
    if(!K) return '';
    const dateISO = U.todayISO(), day = S.days[dateISO];
    const kur = R.Setup && R.Setup.needed && R.Setup.needed();
    const kisa = !kur && !!S.ui.onbesDk;
    const a = kur ? null : kisa ? C.onbesDakika(15) : C.nextAction();
    const cumle = kur ? yz('ays.today.programini-kuralim') : kisa ? '15 dakikan var: ' + a.title + '.'
      : ((day && bugunCumlesi(day, dateISO)) || yz('ays.today.bugun-icin-plan-yok'));
    const eylem = kur ? String(c.Button({ label:yz('ays.today.kuruluma-basla'), tone:'primary', act:'setup-open' }))
      : a && (a.route || a.act) ? String(c.Button({ label:yz('ays.today.basla'), tone:'primary', act:'next-action',
        data:{ 'data-route':a.route || '', 'data-next':a.act || '', 'data-block':a.blockId || '', 'data-tab':a.tab || '' } })) : '';
    return K.kapakHtml({ modul:'ays', selam:K.acilis('ays').selam, cumle, sayilar:[], eylem,
      ikincil:kur ? '' : String(c.Button({ label:kisa ? yz('ays.today.tam-plan') : '15 dakikam var', tone:'ghost', act:'onbes-dk' })) });
  }

  /* PANO KARTLARI (2026-10-20, kullanıcı onaylı katalog; brand/ortak/pano.js).
     Kapağın altında: günün blokları süreyle orantılı şeritte, sınava kalan
     gün ve programın geçen haftaları, tekrar borcu eşik çubuğunda, son 14
     günün minimum günleri karelerde. Kayıt yoksa boş hâl. */
  function PanoUst(day, dateISO){
    const P = (window.LIFEOS || {}).PANO;
    if(!P || R.Setup.needed()) return '';
    const git = (label, route) => ({ label, act:'go', data:{ 'data-route':route } });
    const bloklar = (day.blocks || []).filter(b => b.slot !== 'Dinlenme');
    const ad = b => b.subject || b.topic || b.slot;
    const durum = b => b.status === 'done' ? 'bitti' : b.startedAt ? 'simdi' : 'sira';
    const bitti = bloklar.filter(b => b.status === 'done').length;
    const suren = bloklar.find(b => b.startedAt && b.status !== 'done');
    const sira = bloklar.find(b => b.status === 'pending' && !b.startedAt);
    const blokKart = bloklar.length
      ? P.kart({ tur:'bloklar', ad:yz('ays.today.gunun-bloklari'), simge:'blok', yuva:bitti + ' / ' + bloklar.length + ' bitti',
          govde:P.serit({ parcalar:bloklar.map(b => ({ ad:ad(b), sure:Number(b.targetMin) || 1, durum:durum(b) })),
              etiket:bloklar.length + ' blok: ' + bitti + ' bitti' + (suren ? ', ' + ad(suren) + ' sürüyor' : '') })
            + P.not(suren ? yz('ays.today.simdi') + ad(suren) : sira ? yz('ays.today.sirada') + ad(sira) + (sira.targetMin ? ' · ' + sira.targetMin + ' dk' : '') : yz('ays.today.bugunun-bloklari-kapandi')) })
      : P.kart({ tur:'bloklar', ad:yz('ays.today.gunun-bloklari'), simge:'blok', bos:{ cumle:yz('ays.today.bugun-icin-blok-yok'), dugme:git(yz('ays.today.plana-bak'), 'plan') } });
    const kalan = U.diffDays(dateISO, R.PLAN.examTytISO);
    const hafta = M.currentWeek(), topHafta = R.PLAN.totalWeeks;
    const tahmini = !(S.profile && S.profile.examTytISO);
    const sinavKart = P.kart({ tur:'sinav', ad:'TYT’ye', simge:'takvim', yuva:tahmini ? 'tahmini tarih' : 'hesaplandı',
      govde:P.deger(String(kalan), 'gün', yz('ays.today.hafta') + hafta + ' / ' + topHafta)
        + P.esik({ deger:hafta, esik:hafta, olcek:topHafta, etiket:yz('ays.today.programin') + hafta + '. haftası, toplam ' + topHafta })
        + P.not('programın %' + Math.round(hafta / topHafta * 100) + '’i geçti') });
    const vadeli = C.dueCards().length;
    const borc = (S.cards || []).length ? C.cardDebt() : null;
    const kartKart = borc == null
      ? P.kart({ tur:'tekrar', ad:yz('ays.today.tekrar-kartlari'), simge:'kart', bos:{ cumle:yz('ays.today.tekrar-karti-yok-borc-ilk') } })
      : P.kart({ tur:'tekrar', ad:yz('ays.today.tekrar-kartlari'), simge:'kart', yuva:'hesaplandı', dugme:vadeli ? git(yz('ays.today.tekrara-git'), 'cards') : null,
          govde:P.deger(String(vadeli), 'vadeli', 'tekrar borcu %' + borc)
            + P.esik({ deger:borc, esik:10, olcek:Math.max(50, borc), yon:'azalis-iyi', etiket:yz('ays.today.tekrar-borcu-yuzde') + borc + ', eşik yüzde 10' })
            + P.not(borc > 10 ? 'eşik %10 · ' + (borc - 10) + ' puan üstünde' : 'eşik %10 · altında') });
    const gunler = []; for(let i = 13; i >= 0; i--) gunler.push(U.iso(U.addDays(U.today(), -i)));
    const seri = C.behaviorStreak();
    const kareler = gunler.map(d => {
      const t = C.minimumDayMet(d);
      return d === dateISO ? (t ? 'dolu' : 'bugun') : t ? 'dolu' : 'bos';
    });
    const seriKart = P.kart({ tur:'seri', ad:yz('ays.today.seri'), simge:'alev', yuva:seri.streak ? seri.streak + ' gün üst üste' : 'henüz başlamadı',
      govde:P.kareler({ durumlar:kareler, sutun:14, etiket:yz('ays.today.son-14-gunun') + kareler.filter(x => x === 'dolu').length + '’inde minimum gün tutuldu' })
        + P.not('dolu: minimum gün tutuldu · çerçeve: bugün') });
    /* Soru sayacı: günün bloklarının soru hedefi (plan) ve girilen soru. */
    const hedefQ = bloklar.reduce((a, b) => a + (Number(b.targetQ) || 0), 0);
    const yapilanQ = bloklar.some(b => b.actualQ != null) ? bloklar.reduce((a, b) => a + (Number(b.actualQ) || 0), 0) : null;
    const soruKart = hedefQ
      ? P.kart({ tur:'soru', ad:yz('ays.today.soru-2'), simge:'tik', yuva:(yapilanQ == null ? '—' : yapilanQ) + ' / ' + hedefQ,
          govde:(hedefQ <= 60
            ? P.segment({ hedef:hedefQ, yapilan:yapilanQ, etiket:yz('ays.today.gunun-sorusu'), sutun:Math.min(12, hedefQ) })
            : P.esik({ deger:yapilanQ || 0, esik:hedefQ, yon:'artis-iyi', etiket:(yapilanQ || 0) + ' soru, hedef ' + hedefQ }))
            + P.not(yapilanQ == null ? yz('ays.today.blok-bitince-cozulen-soru-gi') : yapilanQ >= hedefQ ? yz('ays.today.gunun-soru-hedefi-tamam') : (hedefQ - yapilanQ) + ' soru kaldı.') })
      : '';
    /* Günün sorusu (yıldız): son yanlış çözülen sorulardan biri, tarihe bağlı
       seçilir (gün içinde değişmez). Yanlış yoksa kart yok. */
    const yanlis = R.OgrenTest ? R.OgrenTest.yanlislar() : [];
    let tekrar = '';
    if(yanlis.length){
      const s = yanlis[Number(dateISO.replace(/-/g, '')) % yanlis.length];
      const metin = String((s.q && s.q.soru) || '').replace(/[*_`#>$\\]/g, '').replace(/\s+/g, ' ').trim();
      tekrar = P.kart({ tur:'tekrar-sorusu', ad:yz('ays.today.bunu-bir-daha-coz'), yildiz:'günün sorusu',
        govde:'<p class="pk__soru">' + U.esc(metin.length > 180 ? metin.slice(0, 178) + '…' : metin) + '</p>'
          + P.not((s.subject && s.subject.name ? s.subject.name + ' · ' : '') + yanlis.length + ' soru tekrar bekliyor'),
        ayak:P.dugmeHtml({ label:yz('ays.today.soruyu-ac'), act:'go', data:{ 'data-route':'sorular', 'data-tab':'yanlis' } }, 'pk__dugme') });
    }
    return '<div class="pk-ust">' + P.izgara([tekrar, blokKart, sinavKart, soruKart, kartKart, seriKart]) + '</div>';
  }

  LIFEOS.PARCA.blok({ id:'today.akiskutusu', sayfa:'today', yer:'y1', sira:10, ad:'Akış kutusu', ciz({ dateISO, n, day }){
    return AkisKutusu(day);
  } });
  LIFEOS.PARCA.blok({ id:'today.geri-sayim', sayfa:'today', yer:'y2', sira:10, ad:'Geri sayım', ciz({ dateISO, n, day }){
    return when(runningBlock(), () => html`<div id="geri-sayim" class="bugun__vitrin">${raw(geriSayimHtml(runningBlock()))}</div>`);
  } });
  LIFEOS.PARCA.blok({ id:'today.hizli-giris-kutusu', sayfa:'today', yer:'y3', sira:10, ad:'Hızlı giriş kutusu', ciz({ dateISO, n, day }){
    return raw(window.LIFEOS && window.LIFEOS.GIRIS ? window.LIFEOS.GIRIS.kutuHtml() : '');
  } });
  LIFEOS.PARCA.blok({ id:'today.onay-bekleyen-teklifler', sayfa:'today', yer:'y4', sira:10, ad:'Onay bekleyen teklifler', ciz({ dateISO, n, day }){
    return (R.S.ui.kingTeklifler || []).length ? html`<section class="bugun__alan" aria-label="Onay bekliyor">
          ${R.Screens.onaylar.kingKart()}</section>` : '';
  } });
  async function render(){
    const dateISO = cizilenGun = U.todayISO();
    const n = M.currentWeek();
    await M.ensureWeek(n);
    const day = await M.ensureDay(U.today());
    /* Karşılamanın notu: bugünün kural cümlesi (Siri'ye giden aynı cümle). */
    if(window.LIFEOS && window.LIFEOS.KARSILAMA) window.LIFEOS.KARSILAMA.notYaz(bugunCumlesi(day, dateISO) || yz('ays.today.bugun-icin-plan-yok'), dateISO);
    /* Dönen kart İlerleme › Özet'te; seçim sayfasının özeti yine Bugün'le tazelenir. */
    DonenKutu(day, dateISO, true);

    const parcaB = { dateISO, n, day };
    return html`<div class="bugun" data-oz="003">
      <div class="bugun__sol">
        
        ${LIFEOS.PARCA.yer('today', 'y4', R.C, parcaB, typeof raw === 'undefined' ? null : raw)}
        <section class="bugun__alan" aria-label="Ne yaptın?">
          ${LIFEOS.PARCA.yer('today', 'y3', R.C, parcaB, typeof raw === 'undefined' ? null : raw)}
        </section>
        <section class="bugun__alan" aria-label="Gün"><h2 class="bugun__etiket" aria-hidden="true">${yz('ays.today.gun-2')}</h2>
          ${LIFEOS.PARCA.yer('today', 'y2', R.C, parcaB, typeof raw === 'undefined' ? null : raw)}
          <div class="bugun__genis">${LIFEOS.PARCA.yer('today', 'y1', R.C, parcaB, typeof raw === 'undefined' ? null : raw)}</div>
        </section>
      </div>
    </div>`;
  }

  /* İLERLEME › ÖZET (KOLAY-PLANI Faz 2, 2026-10-26). Bugün üç bloğa indi
     (Şimdi: kapak · Ne yaptın? · Gün); günün sayıları buraya taşındı,
     hiçbiri kalkmadı: pano kartları (kapağın eski dört karosunun sayıları
     da bunlarda: blok, tekrar kartı, seri, sınava kalan gün), dönen Durum
     kartı, Merkez'in haftalık özeti ve bekleyen öneri. */
  async function ozetHtml(){
    const dateISO = U.todayISO();
    await M.ensureWeek(M.currentWeek());
    const day = await M.ensureDay(U.today());
    const oneri = R.Screens.onaylar && R.Screens.onaylar.bekleyen() ? R.Screens.onaylar.oneriAlani() : '';
    return String(html`${raw(PanoUst(day, dateISO))}<div class="bugun" data-ozet="ilerleme">
      <div class="bugun__sol">
        <section class="bugun__alan" aria-label="Durum"><h2 class="bugun__etiket" aria-hidden="true">${yz('ays.today.durum')}</h2>
          ${DonenKutu(day, dateISO, false, true)}
          ${when(S.ui.haftaOzet && window.LIFEOS.HaftaOzet, () => raw(window.LIFEOS.HaftaOzet.kartHtml(S.ui.haftaOzet)))}
        </section>
        ${when(oneri, () => html`<section class="bugun__alan" aria-label="Öneri"><h2 class="bugun__etiket" aria-hidden="true">${yz('ays.today.oneri')}</h2>${oneri}</section>`)}
      </div>
    </div>`);
  }

  /* GÜNÜN AYRINTISI (Bugün › Ayrıntı) — Bugün'ün üç alanına sığmayan her
     kart burada: blokların sayacı ve alanları, çıpa sayaçları, enerji, mola,
     ritüel, seri, telafi… Hiçbiri kalkmadı; yalnız yeri değişti (envanter
     tabanı bunu denetler). Bugün'de duran şey burada tekrar çizilmez. */
  async function renderAyrinti(){
    const dateISO = cizilenGun = U.todayISO();
    const n = M.currentWeek();
    await M.ensureWeek(n);
    const day = await M.ensureDay(U.today());
    const week = S.weeks[M.weekId(n)];
    const wd = R.WEEKDAYS[day.dow];

    /* Faz 2 (2026-10-26): Bugün'ün eski Şimdi alanındaki acil uyarı, günün
       sorusu ve blok bitiş özeti de burada (Bugün üç bloğa indi). */
    const banners = uyarilar().map(b => b.kart);
    const soru = R.Signals && R.Signals.current() ? (window.LIFEOS && window.LIFEOS.SORUKART ? SignalCard() : c.Ledger([SignalCard()])) : '';

    return c.Grid(html`
      ${when(banners.length, () => c.Span(12, html`<div class="stack-sm">${banners}</div>`))}
      ${when(soru, () => c.Span(12, soru))}
      ${/* Bugün'deki dönen kartın açık hâli: dört Durum kartı burada. */''}
      ${c.Span(12, html`<section class="bugun__alan" aria-label="Durum">
        ${SayacKutusu(day, dateISO)}${SonDenemeKutusu()}${TekrarBorcuKutusu()}${HafizaKutusu()}${OzetKutusu(day, dateISO)}</section>`)}
      ${c.Span(12, HkmSerit())}
      ${when(gunUcuHtml(day, true) + blokBitisHtml(day), () => c.Span(12, raw(gunUcuHtml(day, true) + blokBitisHtml(day))))}

      ${c.Span(6, c.Stack(html`
        ${AutoCard()}
        <div id="pane-flow">${FlowCard()}</div>
        ${c.SectionTitle(html`${wd.label} ${yz('ays.today.bloklari')}${raw(UI.hint('block'))}`, html`${raw(OdakRozeti(day))}<span class="small dim">${U.fmtDate(dateISO)}</span>`)}
        ${IstisnaKart(day, dateISO)}
        ${tasimaKutusu(day)}
        ${raw(surukleListesi(day))}
        ${c.Card({ pad:'sm', body:c.Field({ label:yz('ays.today.gunun-notu'),
          input:c.Textarea({ rows:2, value:day.note, change:'day-note', placeholder:yz('ays.today.bugun-ne-engelledi-ne-kolayl') }) }) })}
      `))}

      ${c.Span(4, c.Stack(html`
        ${HedefKart()}
        ${OfficeCard()}
        <div id="pane-anchors">${AnchorPane(day)}</div>
        <div id="pane-hedef">${hedefKutusu(day)}</div>
        ${/* SADE (2026-10-02): günün ara sıra dokunulan kayıtları tek
             katlanır kartta (baştan küçük); hiçbiri kalkmadı. */''}
        ${c.Card({ title:yz('ays.today.obur-kayitlar'), sub:yz('ays.today.enerji-kotu-gun-bolunme-seri'), body:c.Stack(html`
          <div id="pane-energy">${EnergyCard()}</div>
          ${BadDayCard(day)}
          ${DistractionCard(day)}
          ${PlanHealthCard()}
          ${StreakCard()}
          ${SleepCard(day)}
          <div id="pane-ritual">${RitualCard(day)}</div>`) })}
        <div id="pane-reward">${RewardCard()}</div>
        <div id="pane-break">${BreakCard()}</div>
        <div id="pane-due">${DueCards()}</div>
        ${RepairQueue()}
        ${WeekContext(week, n)}
      `))}

      ${c.Span(12, raw(UI.rail(['next-action','anchor','minimum-day','timer','streak','skip-reason'])))}
    `);
  }

  function afterRender(){
    if(VT() && VT().kaydirmaKur) VT().kaydirmaKur();
    surukleKur();
    if(runningBlock()) startTick(); else stopTick();
  }

  /* Öneri alanındaki kartın düğmeleri Onaylar ekranının işleyicilerine
     gider: onay TEK yoldan geçer, iki ekranda iki ayrı kod durmaz. */
  const ONAY_EYLEMLERI = ['king-onayla', 'king-parca', 'king-iptal', 'hkm-toplu', 'hkm-intent-yes',
    'hkm-intent-seen', 'hkm-intent-no', 'hkm-doubt-ok', 'office-approve', 'office-reject', 'office-undo',
    'oneri-uygula', 'oneri-gec', 'oneri-gec-neden', 'oneri-onizle'];

  /* ---------- GÜNÜ KAPAT (KOLAY-PLANI Faz 1; brand/ortak/gunukapat.js) ----------

     Akşam tek alt sayfa: satırları bu ekran kurar, ortak çekirdek çizer ve
     yazar; bağlantı app.js'te (R.App.gunuKapatKur). Depo sahibinin
     kararları (2026-10-25) ve doktrin (AGENTS §1.1, §1.2, §1.7):

       · BEYAN yalnız bekleyen bloğun «tamamlandı»sıdır: durum 'done' ve
         actualMin boşsa planlanan dakika — «block-kaydir» ile aynı emsal.
         actualQ / correctQ bu satırda ASLA yazılmaz. Blok kaydında
         dakikanın kesinlik alanı yok; satırda kaynağı «plan» diye görünür.
       · ÖLÇÜM satırları (blok başına soru / doğru, paragraf, problem,
         uyku) toplu yazılmaz ve ön doldurulmaz; plan ve son değer yalnız
         ipucudur. Ölçüm ekranın tek satırına yazılır ve AYS'nin
         ayrıştırıcısından geçer (core/komut.js → core/entry.js).
       · SORU BLOĞA YAZILIR, BLOK UYDURULMAZ. Satırdaki her soru parçası
         için hedef blok şu sırayla bulunur:
           1. parçada bir bloğun adı (konu, ders ya da yuva) geçiyorsa o
              blok; iki bloğun adı birden geçiyorsa reddedilir;
           2. ayrıştırıcı bir ders bulduysa o dersin bugünkü TEK bloğu;
              o derste birden çok blok varsa ya da hiç yoksa reddedilir;
           3. ad da ders de yoksa: günde tek blok varsa o, birden çoksa
              reddedilir («bugün 2 blok var; bölüştürmem»).
         Toplam bloklara ASLA bölüştürülmez. Bloğu hiç olmayan günde (ara
         günü) soru ayrıştırıcının kendi yoluyla günün plan dışı toplamına
         gider (soru-yaz). Bloğa yazım Günü düzenle'nin blok alanıyla aynı
         alanlara gider (actualQ, correctQ; ekleyerek, soru-yaz gibi) ama
         bloğun DURUMUNA dokunmaz: işaretini kaldırdığın «tamamlandı»
         satırı ölçüm yüzünden yazılmış olmasın.
       · Belirsiz parça tahmin edilmez: anlaşılmayan, iki ölçümü tek
         parçada taşıyan («20 soru 15 doğru 7 saat uyudum» yalnız uykuyu
         okurdu), boş sayısı söylenmemiş «yanlış» (doğru = çözülen − yanlış
         varsayımı) ve plan komutu reddedilir; hiçbir şey yazılmaz. */
  const GK_OLCUM = { 'soru-yaz':1, 'uyku-yaz':1, 'paragraf-yaz':1, 'problem-yaz':1, 'sure-yaz':1 };
  /* Ölçüm dilinin sözcükleri blok adı sayılmaz. */
  const GK_DIL = ['soru', 'dogru', 'yanlis', 'bos', 'net', 'tane', 'dakika', 'saat', 'uyku', 'ders'];
  /* Bir parçada görülüp de okunmayan ölçüm (normalize metinde). */
  const GK_AILE = [
    ['uyku-yaz', /uyu|uyku/],
    ['soru-yaz', /\d\s*(?:tane\s*)?soru|soru\s+\d/],
    ['paragraf-yaz', /\d\s*(?:tane\s*)?paragraf|paragraf\s+\d/],
    ['problem-yaz', /\d\s*(?:tane\s*)?problem|problem\s+\d/],
  ];
  const GK_ORNEK = '«20 soru 15 doğru, 7 saat uyudum»';
  const gkBloklar = day => ((day && day.blocks) || []).filter(b => b.slot !== 'Dinlenme');
  const gkAd = b => b.topic || b.subject || b.slot || 'Blok';
  const gkNorm = s => U.norm(s).replace(/[^a-z0-9]+/g, ' ').trim();

  /* Son değer (ipucu): bu günden önceki en yakın kayıt. */
  function gkSon(gun, alan, gecerli){
    const d = Object.keys(S.days || {}).filter(x => x < gun).sort().reverse()
      .find(x => gecerli(S.days[x] && S.days[x][alan]));
    return d ? { deger:S.days[d][alan], gun:d } : null;
  }

  function gkSatirlar(gun){
    const day = S.days[gun];
    if(!day) return [];
    const bl = gkBloklar(day);
    const out = [];
    bl.forEach(b => {
      const id = 'blok:' + b.id, ad = gkAd(b);
      if(b.status === 'pending' && b.startedAt){
        out.push({ id, ad, tur:'beyan', ipucu:'sürüyor · önce «Bitir»' });
      }else if(b.status === 'pending'){
        const dk = b.actualMin != null ? b.actualMin + ' dk' : Number(b.targetMin) > 0 ? 'planlanan ' + b.targetMin + ' dk' : '';
        out.push({ id, ad, tur:'beyan', oneri:{ metin:yz('ays.today.tamamlandi-2') + (dk ? ' · ' + dk : ''), kaynak:'plan' },
          yaz:() => gkBlokBitti(gun, b.id) });
      }else{
        const durum = (STATUSES.find(s => s[0] === b.status) || [, b.status])[1].toLocaleLowerCase('tr');
        out.push({ id, ad, tur:'beyan', yazildi:true,
          ipucu:durum + (b.actualMin != null ? ' · ' + b.actualMin + ' dk' : '') });
      }
    });
    bl.forEach(b => {
      const q = b.actualQ != null;
      out.push({ id:'soru:' + b.id, ad:gkAd(b), tur:'olcum', yazildi:q,
        ipucu:q ? 'girildi: ' + b.actualQ + ' soru' + (b.correctQ != null ? ', ' + b.correctQ + ' doğru' : '')
          : 'soru / doğru · ' + (Number(b.targetQ) > 0 ? 'plan: ' + b.targetQ + ' soru' : 'planda soru yok'),
        alanlar:[{ ad:gkAd(b) + ' soru', birim:'soru', ipucu:Number(b.targetQ) > 0 ? 'plan ' + b.targetQ : '' },
          { ad:gkAd(b) + ' doğru', birim:'doğru' }],
        metin:v => gkBlokMetni(gun, b, v[0], v[1]) });
    });
    [['paragraphActual', 'paragraphTarget', 'Paragraf'], ['problemActual', 'problemTarget', 'Problem']].forEach(([alan, hedef, ad]) => {
      const n = day[alan], girildi = n != null;
      const son = gkSon(gun, alan, v => Number(v) > 0);
      const par = alan === 'paragraphActual';
      out.push({ id:par ? 'paragraf' : 'problem', ad, tur:'olcum', yazildi:girildi,
        ipucu:girildi ? 'girildi: ' + n : [son ? 'son: ' + son.deger + ' · ' + U.fmtShort(son.gun) : '',
          Number(day[hedef]) > 0 ? 'hedef: ' + day[hedef] : ''].filter(Boolean).join(' · ') || 'girmezsen boş kalır',
        alanlar:[{ ad, ipucu:Number(day[hedef]) > 0 ? 'hedef ' + day[hedef] : son ? 'son ' + son.deger : '' }],
        metin:v => v[0] + (par ? ' paragraf yaptım' : ' problem çözdüm') });
    });
    const sonUyku = gkSon(gun, 'sleepHours', v => v != null);
    out.push({ id:'uyku', ad:yz('ays.today.uyku'), tur:'olcum', yazildi:day.sleepHours != null,
      alanlar:[{ ad:yz('ays.today.uyku'), birim:'saat', ipucu:sonUyku ? 'son ' + sonUyku.deger : '' }],
      metin:v => v[0] + ' saat uyudum',
      ipucu:day.sleepHours != null ? 'girildi: ' + day.sleepHours + ' saat'
        : sonUyku ? 'son: ' + sonUyku.deger + ' saat · ' + U.fmtShort(sonUyku.gun) : 'ölçtüysen aşağıya yaz' });
    return out;
  }

  /* Kutulardaki soru / doğru → bu bloğun parçası. Ayrıştırıcının bölmediği
     (virgül, «ve», «sonra» ayıklanmış) adlardan denetimin TAM bu bloğa
     yazdığı ilki seçilir («Paragraf» konulu blok «türkçe …» ile gider);
     hiçbiri olmazsa ilki gider, denetim nedenini söyler. Yalnız doğru
     yazılmışsa soru uydurulmaz: parça denetimde reddedilir. */
  function gkBlokMetni(gun, b, soru, dogru){
    const ek = soru == null ? dogru + ' doğru' : soru + ' soru' + (dogru != null ? ' ' + dogru + ' doğru' : '');
    const adaylar = [gkAd(b), b.subject, b.slot].filter(Boolean)
      .map(a => a.replace(/[,;\n]|\s+(?:ve|sonra)\s+/gi, ' ').trim().toLocaleLowerCase('tr') + ' ' + ek);
    const tam = t => { const d = gkDenetle(t, gun); return !!d.plan && d.plan.length === 1 && !!d.plan[0].blok && d.plan[0].blok.id === b.id; };
    return (soru != null && adaylar.find(tam)) || adaylar[0];
  }

  /* Beyan: yalnız durum ve (boşsa) planlanan dakika. Geri al ikisini
     olduğu gibi geri koyar. Satır o arada başka yoldan yazıldıysa
     (ör. ölçüm satırındaki «matematik 50 dk») dokunulmaz. */
  async function gkBlokBitti(gun, id){
    const bul = () => { const d = S.days[gun]; return d && (d.blocks || []).find(x => x.id === id); };
    const b = bul();
    if(!b) throw new Error('Blok bulunamadı');
    if(b.status !== 'pending' || b.startedAt) return { atlandi:true };
    const once = { status:b.status, actualMin:b.actualMin, minCert:b.minCert };
    b.status = 'done';
    if(b.actualMin == null && Number(b.targetMin) > 0) planDakikasi(b);
    await M.saveDay(gun);
    return { metin:gkAd(b) + ' tamamlandı', geriAl:async () => {
      const y = bul();
      if(!y) return;
      y.status = once.status; y.actualMin = once.actualMin; y.minCert = once.minCert;
      await M.saveDay(gun);
    } };
  }

  /* Parçada adı geçen bloklar: önce tam ad (en uzun eşleşme kazanır),
     yoksa yalnız bir bloğa ait ayırt edici sözcük (≥ 4 harf; ek alabilir:
     «noktalamadan»). */
  function gkAdiGecen(metin, bl){
    const t = ' ' + gkNorm(metin);
    const anahtar = b => [gkAd(b), b.subject, b.slot].filter(Boolean).map(gkNorm).filter(k => k.length >= 3);
    const puan = bl.map(b => Math.max(0, ...anahtar(b).filter(k => t.indexOf(' ' + k) >= 0).map(k => k.length)));
    const en = Math.max(0, ...puan);
    if(en) return bl.filter((b, i) => puan[i] === en);
    const sozcuk = t.trim().split(' ');
    const sahip = {};
    bl.forEach((b, i) => anahtar(b).join(' ').split(' ').forEach(w => {
      if(w.length >= 4 && GK_DIL.indexOf(w) < 0) (sahip[w] = sahip[w] || new Set()).add(i);
    }));
    return bl.filter((b, i) => Object.keys(sahip).some(w => sahip[w].size === 1 && sahip[w].has(i)
      && sozcuk.some(s => s.indexOf(w) === 0)));
  }

  function gkHedef(o, bl){
    const p = o.params || {};
    const adlar = bl.map(b => '«' + gkAd(b) + '»').join(', ');
    const ornek = bl.length ? ' Örneğin «' + gkAd(bl[0]).toLocaleLowerCase('tr') + ' 20 soru 15 doğru».' : '';
    const adli = gkAdiGecen(o.metin || '', bl);
    if(adli.length === 1) return { blok:adli[0] };
    if(adli.length > 1) return { red:'«' + o.metin + '»: birden çok bloğun adı geçiyor (' + adli.map(b => '«' + gkAd(b) + '»').join(', ')
      + '); her bloğu ayrı parçada yaz.' };
    const s = p.subjectId ? (R.SUBJECTS || []).find(x => x.id === p.subjectId) : null;
    if(s){
      const l = bl.filter(b => b.subjectId === s.id || (b.subject && U.norm(b.subject) === U.norm(s.name)));
      if(l.length === 1) return { blok:l[0] };
      if(!bl.length) return { planDisi:true };
      return { red:'«' + o.metin + '»: ' + s.name + (l.length ? ' için bugün ' + l.length + ' blok var' : ' için bugün blok yok')
        + '; bloğun adıyla yaz (' + adlar + ').' + ornek };
    }
    if(bl.length === 1) return { blok:bl[0] };
    if(!bl.length) return { planDisi:true };
    return { red:'«' + o.metin + '»: bugün ' + bl.length + ' blok var (' + adlar + '); toplamı bloklara bölüştürmem. '
      + yz('ays.today.her-blogu-adiyla-ayri-yaz') + ornek };
  }

  /* Satırın tamamı yazılabilir mi? { plan:[…] } ya da { red:'neden' }. */
  function gkDenetle(metin, gun){
    const t = String(metin || '').trim();
    if(!t) return { plan:[] };
    const day = S.days[gun];
    if(!day) return { red:yz('ays.today.bu-gunun-kaydi-acilmamis-hic') };
    if(!R.Komut || !R.Entry) return { red:yz('ays.today.olcum-satiri-bu-surumde-okun') };
    /* Soru sayısı olmadan doğru: çözülen uydurulmaz. */
    const yalnizDogru = t.split(/[,;\n]/).find(p => /\d\s*(?:tane\s*)?dogru/.test(gkNorm(p)) && !/soru|paragraf|problem/.test(gkNorm(p)));
    if(yalnizDogru) return { red:'«' + yalnizDogru.trim() + '»: doğru tek başına yazılmaz; kaç soru çözdüğünü de yaz, örneğin ' + GK_ORNEK + '.' };
    let r;
    try{ r = R.Komut.anla(t, { date:gun }); }catch(e){ return { red:yz('ays.today.satiri-okuyamadim-hicbir-sey') }; }
    if((r.sorular || []).length) return { red:r.sorular.map(x => x.soru).join(' ') };
    if((r.anlasilmayan || []).length) return { red:yz('ays.today.anlasilmadi') + r.anlasilmayan.join('», «') + '». Örneğin ' + GK_ORNEK + '.' };
    if(!r.oneriler.length) return { red:yz('ays.today.bu-satirda-olcum-bulamadim-o') + GK_ORNEK + '.' };
    const disi = r.oneriler.filter(o => !GK_OLCUM[o.action]);
    if(disi.length) return { red:yz('ays.today.bu-satir-yalniz-olcum-icindi') + (disi[0].metin || t) + '» bir plan değişikliği. Onu «Ne yaptın?» kutusuna yaz.' };
    const gruplar = {};
    r.oneriler.forEach(o => { const m = o.metin || t; (gruplar[m] = gruplar[m] || []).push(o.action); });
    for(const m of Object.keys(gruplar)){
      const n = U.norm(m);
      if(GK_AILE.some(([a, re]) => re.test(n) && gruplar[m].indexOf(a) < 0))
        return { red:'«' + m + '»: iki ölçüm tek parçada kaldı; virgülle ayır, örneğin ' + GK_ORNEK + '.' };
    }
    const bl = gkBloklar(day);
    const plan = [];
    for(const o of r.oneriler){
      if(o.action !== 'soru-yaz'){ plan.push({ tur:'komut', o }); continue; }
      const ps = R.Entry.parseSoru(o.metin || t);
      if(ps && ps.bosVarsayim) return { red:'«' + o.metin + '»: boş sayısını da yaz («20 soru 4 yanlış 1 boş») ya da doğruyu yaz; boşu sıfır saymam.' };
      const h = gkHedef(o, bl);
      if(h.red) return { red:h.red };
      plan.push(h.blok ? { tur:'blok', o, blok:h.blok } : { tur:'komut', o });
    }
    return { plan };
  }

  function gkParcaMetni(x){
    const p = x.o.params || {};
    const sr = (n, d) => n + ' soru' + (d != null ? ', ' + d + ' doğru' : '');
    if(x.tur === 'blok') return gkAd(x.blok) + ': ' + sr(p.count, p.correct);
    if(x.o.action === 'soru-yaz') return yz('ays.today.plan-disi-2') + sr(p.count, p.correct);
    if(x.o.action === 'uyku-yaz') return yz('ays.today.uyku-2') + p.hours + ' saat';
    if(x.o.action === 'paragraf-yaz') return yz('ays.today.paragraf-2') + p.count;
    if(x.o.action === 'problem-yaz') return yz('ays.today.problem-2') + p.count;
    const s = (R.SUBJECTS || []).find(y => y.id === p.subjectId);
    return (s ? s.name : 'Süre') + ': ' + p.minutes + ' dk';
  }

  /* GIRIS kapısının önizlemesi (Günü kapat bağlamında; app.js). Yazılamaz
     satır null döner: çekirdek o zaman hiçbir şey yazmaz. */
  function gkOnizle(metin, gun){
    const d = gkDenetle(metin, gun);
    if(d.red || !d.plan.length) return null;
    return {
      tur:d.plan.every(x => x.o.action === 'uyku-yaz') ? 'uyku' : 'calisma',
      metin:d.plan.map(gkParcaMetni).join(' · '),
      ipucu:'',
      kaydet:() => gkOlcumYaz(gun, d.plan, String(metin || '').trim()),
    };
  }

  /* Hepsi ya da hiçbiri: herhangi bir adım patlarsa bu işlevin o ana dek
     yaptığı (blok sorusu, uygulanan öneri) geri alınır, hata çekirdeğe gider. */
  async function gkOlcumYaz(gun, plan, metin){
    const geri = [];
    const hepsiniGeriAl = async () => { while(geri.length) await geri.pop()(); };
    const uygulanan = () => (S.officeProposals || []).filter(p => p.status === 'applied').map(p => p.id);
    const onceki = new Set(uygulanan());
    try{
      const bloklu = plan.filter(x => x.tur === 'blok');
      if(bloklu.length){
        const day = S.days[gun];
        const once = {};
        geri.push(async () => {
          const g = S.days[gun];
          (g && g.blocks || []).forEach(b => { if(once[b.id]){ b.actualQ = once[b.id].actualQ; b.correctQ = once[b.id].correctQ; } });
          await M.saveDay(gun);
        });
        bloklu.forEach(x => {
          const b = day.blocks.find(y => y.id === x.blok.id);
          if(!(b.id in once)) once[b.id] = { actualQ:b.actualQ, correctQ:b.correctQ };
          const p = x.o.params;
          b.actualQ = (Number(b.actualQ) || 0) + Math.round(Number(p.count));
          if(p.correct != null) b.correctQ = (Number(b.correctQ) || 0) + Math.round(Number(p.correct));
        });
        await M.saveDay(gun);
      }
      const komut = plan.filter(x => x.tur === 'komut').map(x => x.o);
      if(komut.length){
        /* Ayrıştırıcının kendi yolu: öneri kutusu, kaynak 'istek', ölçüm
           onayla yazılır (Kaydet dokunuşu onaydır; palette.js kingOnizle ile aynı).
           Yarıda patlarsa bu satırla uygulanan her öneri geri alınır. */
        const yeniler = async () => { for(const id of uygulanan().filter(id => !onceki.has(id)).reverse()) await R.Proposals.undo(id); };
        geri.push(yeniler);
        const islem = await R.Komut.isle({ oneriler:komut, sorular:[] }, { metin });
        const onay = await R.Komut.onayla(islem.bekleyen.map(k => k.row.id));
        const ids = islem.yapilan.concat(islem.bekleyen).map(k => k.row && k.row.id).filter(id =>
          id && (S.officeProposals || []).some(p => p.id === id && p.status === 'applied'));
        geri.splice(geri.indexOf(yeniler), 1, async () => { for(const id of ids.slice().reverse()) await R.Proposals.undo(id); });
        if(ids.length !== komut.length){
          /* Yarım kayıt bırakılmaz: neden söylenir (geri alma aşağıda). */
          const neden = islem.dusen.map(k => k.why).concat(onay.why || []).filter(Boolean).join(' · ');
          throw new Error(neden || 'ölçüm yazılamadı');
        }
      }
    }catch(e){
      try{ await hepsiniGeriAl(); }
      catch(e2){ throw new Error(((e && e.message) || 'ölçüm yazılamadı') + '; satırın bir kısmı geri alınamadı'); }
      throw e;
    }
    return { metin:plan.length === 1 ? 'Kaydedildi.' : plan.length + ' ölçüm yazıldı.', geriAl:hepsiniGeriAl };
  }

  /* Alt sayfa: Bugün › Günün akışı › «Günü kapat». Çekirdek kurulmadıysa
     (eski kabuk) Günü düzenle açılır. */
  function gkAc(gun){
    const G = window.LIFEOS && window.LIFEOS.GUNUKAPAT;
    const g = gun || U.todayISO();
    if(!G || !G.kuruluMu()){ R.App.go('gun'); return false; }
    UI.sheet({ title:yz('ays.today.gunu-kapat'), subtitle:U.fmtDate(g), body:G.cizim(g), noFocus:true });
    setTimeout(() => { const i = document.getElementById('gk-olcum'); if(i) i.focus(); }, 40);
    return true;
  }

  /* ---------- eylemler ---------- */
  const handle = {
    async 'gunu-kapat'(){ gkAc(U.todayISO()); },
    async 'seri-hasta'(){
      const r = await R.Seri.dondur(U.todayISO(), null, 'hasta');
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast(yz('ays.today.bugun-donduruldu-seri-bozulm'), { undo:async () => {
        await R.Seri.coz(r.kayit.id); R.App.render(); } });
      R.App.render();
    },
    async 'seri-coz'(el){ await R.Seri.coz(el.dataset.id); UI.toast(yz('ays.today.dondurma-geri-alindi')); R.App.render(); },
    async 'seri-tatil'(){ S.ui.tatilSec = true; R.App.render(); },
    async 'seri-tatil-vazgec'(){ S.ui.tatilSec = false; R.App.render(); },
    async 'seri-tatil-sinir'(){
      const e = document.getElementById('seri-tatil-sinir');
      const ham = e ? String(e.value).trim() : '';
      if(!ham){ UI.toast(yz('ays.today.yillik-tatil-siniri-icin-bir')); return; }
      const r = await R.Seri.yillikTatilAyarla(Number(ham));
      if(!r.ok){ UI.toast(r.why, { life:5000 }); return; }
      R.App.render();
      UI.toast(yz('ays.today.yillik-tatil-siniri') + r.sinir + ' gün', { undo:async () => {
        await R.Seri.yillikTatilAyarla(r.onceki); R.App.render(); } });
    },
    async 'seri-tatil-gun'(el){
      S.ui.tatilSec = false;
      const r = await R.Tatil.baslat(Number(el.dataset.gun));
      if(!r.ok){ UI.toast(r.why); R.App.render(); return; }
      UI.toast(yz('ays.today.tatil-modu-3') + U.fmtShort(r.bas) + ' – ' + U.fmtShort(r.bit) + ': plan ara, seri korunuyor'
        + (r.donus ? '; dönüşte 2 gün ' + r.donus.dakika + ' dk' : ''), { life:6000 });
      if(R.Hedefler && R.Hedefler.ag) R.Hedefler.ag.planla();
      R.App.render();
    },
    async 'seri-tatil-bitir'(){
      const r = await R.Tatil.bitir();
      UI.toast(r.ok ? yz('ays.today.tatil-bitti-bugunden-kademel') + (r.donus ? ' (' + r.donus.dakika + ' dk)' : '')
        : r.why, { life:5000 });
      if(R.Hedefler && R.Hedefler.ag) R.Hedefler.ag.planla();
      R.App.render();
    },
    'istisna-bitir'(el){
      const id = el.dataset.id;
      UI.confirmSheet(yz('ays.today.arayi-bugun-bitir'),
        yz('ays.today.bugun-ve-sonraki-gunler-yeni'),
        async () => {
          const r = await R.Istisna.bitir(id);
          UI.toast(r.ok ? yz('ays.today.ara-bitti-bugunun-plani-kuru') : r.why);
          R.App.render();
        }, false, yz('ays.today.arayi-bugun-bitir'));
    },

    /* HKM teklifleri: uygulayan AYS'in kendi kodudur. */
    /* Uc dugmenin ucu de TEK kapidan gecer: uygulama, yerel kayit ve
       merkeze bildirim tek sirada olur. «Uygulandı ama merkeze
       bildirilemedi» hali yutulmaz, SOYLENIR. */
    async 'hedef-durum'(el){
      const r = await R.Hedefler.durumDegistir(el.dataset.id, el.dataset.durum);
      UI.toast(r.ok ? yz('ays.today.hedef-guncellendi') + (r.not ? '. ' + r.not : '') : r.why);
      R.App.render();
    },
    async 'hedef-plan-onizle'(el){ S.ui.planOnizle = el.dataset.id; R.App.render(); },
    async 'hedef-plan-kapat'(){ S.ui.planOnizle = null; R.App.render(); },
    async 'hedef-plan-uygula'(el){
      const r = await R.HedefPlan.uygulaHedef(el.dataset.id);
      S.ui.planOnizle = null;
      if(r.ok) R.UI.onayMuhru();
      UI.toast(r.ok ? yz('ays.today.plan-uygulandi-geri-almak-is') : r.why);
      R.App.render();
    },
    async 'hedef-uyarla-ac'(el){ S.ui.uyarla = el.dataset.id; R.App.render(); },
    async 'hedef-uyarla-kapat'(){ S.ui.uyarla = null; R.App.render(); },
    async 'hedef-uyarla-sec'(el){
      const H = window.LIFEOS.Hedef;
      const h = R.Hedefler.liste().find(x => x.id === el.dataset.id);
      if(!h) return;
      const paket = R.Hedefler.PAKET_BY_ID[h.paket];
      const bugun = U.todayISO();
      const u = H.uyarla(h, paket, {}, bugun);
      const x = u.senaryolar[Number(el.dataset.i)];
      if(!x){ UI.toast(yz('ays.today.bu-secenek-artik-gecerli-deg')); return; }
      const g = await R.HedefPlan.geriAlHedef(h.id);
      if(!g.ok && R.HedefPlan.aktif(h.id)){ UI.toast(g.why || yz('ays.today.eski-plan-geri-alinamadi-hed')); return; }
      await R.Hedefler.kaydet(H.uyarlamaUygula(u.hedef, x, paket, {}, bugun));
      S.ui.uyarla = null;
      S.ui.planOnizle = h.id;
      UI.toast(yz('ays.today.hedef-yeni-tarihle-guncellen'));
      R.App.render();
    },
    async 'hedef-plan-geri'(el){
      const r = await R.HedefPlan.geriAlHedef(el.dataset.id);
      UI.toast(r.ok ? yz('ays.today.plan-geri-alindi-hafta-tasla') : (r.why || yz('ays.today.geri-alinamadi')));
      R.App.render();
    },

    async 'onbes-dk'(){ S.ui.onbesDk = !S.ui.onbesDk; R.App.render(); },

    /* Elle gonderim: kullanicinin ACIKCA istedigi an. Kapaliyken de
       zorlanmaz — kapali bir seyi «bir kerelik» calistirmak, kapali
       olmasini anlamsiz kilardi. */
    async 'hkm-gonder'(){
      UI.toast(yz('ays.today.hkm-u2019ye-gonderiliyor'));
      const r = await R.Beacon.send({ reason:'manual' });
      UI.toast(r.ok ? 'HKM\u2019ye gönderildi.'
        : (yz('ays.today.gonderilemedi') + (r.note || r.reason || 'sebep bilinmiyor')));
      R.App.render();
    },

    async 'signal-answer'(el){
      const inp = document.getElementById('sig-answer');
      const r = await R.Signals.answer(el.dataset.id, inp ? inp.value : '');
      if(!r.ok){ UI.toast(r.error); return; }
      UI.toast(yz('ays.today.kaydedildi-sonucu-bir-sonrak'));
      R.App.render();
    },

    async 'signal-dismiss'(el){
      await R.Signals.dismiss(el.dataset.id);
      UI.toast(yz('ays.today.soru-kapatildi'));
      R.App.render();
    },

    async 'bad-day'(){
      UI.confirmSheet(R.BAD_DAY.label,
        yz('ays.today.bugunun-hedefi-minimum-gune')
        + 'davranış serin kırılmaz. Yarın normal plana dönersin.', async () => {
          await M.badDay();
          UI.closeSheet();
          UI.toast(yz('ays.today.bugun-minimuma-indi-seri'));
          R.App.render();
        }, false, yz('ays.today.bugunu-minimuma-indir'));
    },
    async 'bad-day-soru-yok'(){
      await M.badDay(null, { soruYok:true });
      UI.toast(yz('ays.today.bugun-paragraf-ve-problem-yo'));
      R.App.render();
    },
    async 'bad-day-undo'(){
      await M.undoBadDay();
      UI.toast(yz('ays.today.normal-plana-donuldu'));
      R.App.render();
    },
    async 'distract'(){
      const n = await M.addDistraction();
      UI.toast(n + '. bölünme kaydedildi');
      R.App.render();
    },
    async 'distract-reset'(){
      const day = todayDoc();
      day.distractions = 0;
      await M.saveDay(day.date);
      R.App.render();
    },
    /* Paylaşılabilir hafta özeti (fikir 28): ÖNCE önizleme — metin
       düzenlenebilir, istemediğin satırı silersin; sonra Paylaş ya da
       Kopyala. Kendiliğinden hiçbir yere gitmez. */
    async 'share-week'(){
      const text = C.haftaOzetMetni(M.currentWeek());
      UI.sheet({
        title:yz('ays.today.hafta-ozeti'), subtitle:yz('ays.today.paylasmadan-once-istemedigin'),
        body:String(c.Textarea({ id:'share-box', rows:9, value:text })),
        footer:String(html`${c.Button({ label:yz('ays.today.veli-koc-raporu'), act:'veli-rapor' })}
          ${c.Button({ label:yz('ays.today.kopyala'), act:'share-week-copy' })}
          ${c.Button({ label:yz('ays.today.paylas'), tone:'primary', act:'share-week-send' })}`),
      });
    },
    /* Veli / koç raporu (DEVIR Y10, core/haftarapor.js): yazdırılabilir tek
       sayfa; hiçbir yere kendiliğinden gitmez. PDF'i tarayıcı yazar (SPİ
       hekim özetiyle aynı yol): dosya adı başlıktan alınır. */
    async 'veli-rapor'(){
      UI.sheet({ title:yz('ays.today.veli-koc-raporu'), subtitle:yz('ays.today.tek-sayfa-yazdirilabilir'), wide:true,
        body:R.HaftaRapor.html(M.currentWeek()), noFocus:true,
        footer:String(html`${c.Button({ label:yz('ays.today.kapat'), act:'sheet-close' })}
          ${c.Button({ label:yz('ays.today.pdf-olarak-kaydet'), act:'veli-rapor-pdf' })}
          ${c.Button({ label:yz('ays.today.yazdir'), tone:'primary', act:'veli-rapor-yazdir' })}`) });
    },
    async 'veli-rapor-yazdir'(){ window.print(); },
    async 'veli-rapor-pdf'(){
      const eski = document.title;
      document.title = 'AYS-haftalik-rapor-' + U.todayISO();
      const geri = () => { document.title = eski; window.removeEventListener('afterprint', geri); };
      window.addEventListener('afterprint', geri);
      UI.toast(yz('ays.today.yazdir-penceresinde-hedef-ol'), { life:5000 });
      window.print();
    },
    async 'share-week-copy'(){
      const el = document.getElementById('share-box');
      try{ await navigator.clipboard.writeText(el ? el.value : ''); UI.toast(yz('ays.today.ozet-kopyalandi')); }
      catch(e){ if(el){ el.select(); } UI.toast(yz('ays.today.kopyalanamadi-metni-secip-ke')); }
    },
    async 'share-week-send'(){
      const el = document.getElementById('share-box');
      const text = el ? el.value : '';
      try{
        if(navigator.share){ await navigator.share({ title:yz('ays.today.rota-hafta-ozeti'), text }); UI.closeSheet(); return; }
        await navigator.clipboard.writeText(text);
        UI.toast(yz('ays.today.paylasim-bu-tarayicida-yok-o'));
      }catch(e){ /* kullanıcı paylaşımı kapattı: metin kutuda duruyor */ }
    },
    async 'energy-set'(el){
      await M.saveMood(U.todayISO(), { energy:Number(el.dataset.value) });
      if(!R.App.patch('#pane-energy', EnergyCard())) R.App.render();
      else R.App.patch('#pane-break', BreakCard());
    },
    async 'break-take'(el){
      await M.saveBreak({ activityId:el.dataset.id, minutes:Number(el.dataset.min) || 5 });
      UI.toast(yz('ays.today.mola-kaydedildi-donunce-blok'));
      if(!R.App.patch('#pane-break', BreakCard())) R.App.render();
      else R.App.patch('#pane-flow', FlowCard());
    },
    async 'block-sira'(el){
      const day = todayDoc();
      const b = day && day.blocks.find(x => x.id === el.dataset.block);
      const hedef = Number(el.dataset.sira);
      if(!b || !Number.isInteger(hedef)) return;
      const eskiSira = day.blocks.map(x => x.id);
      const i = day.blocks.indexOf(b);
      if(hedef === i || hedef === i + 1) return;
      const eski = day.blocks.filter(x => x.slot !== 'Dinlenme').indexOf(b);
      day.blocks.splice(i, 1);
      day.blocks.splice(hedef > i ? hedef - 1 : hedef, 0, b);
      await M.saveDay(day.date);
      sonTasima = { date:day.date, id:b.id, eski, sira:eskiSira };
      R.App.render();
    },
    async 'block-kaydir'(el){
      const day = todayDoc();
      const b = day && day.blocks.find(x => x.id === el.dataset.block);
      if(!b || b.status !== 'pending' || b.startedAt) return;
      if(el.dataset.yon === 'sol') return handle['block-sonra'](el);
      const once = { status:b.status, actualMin:b.actualMin, minCert:b.minCert };
      b.status = 'done';
      if(b.actualMin == null) planDakikasi(b);
      await M.saveDay(day.date);
      /* Küçük aksiyon: sormadan uygulanır, «Geri al» kalır. */
      UI.toast((b.topic || b.subject || b.slot) + ' bitti.', { undo:async () => {
        b.status = once.status; b.actualMin = once.actualMin; b.minCert = once.minCert; await M.saveDay(day.date); R.App.render(); } });
      R.App.render();
    },
    async 'block-sonra'(el){
      const day = todayDoc();
      const b = day && day.blocks.find(x => x.id === el.dataset.block);
      const hedef = b && sonrakiBekleyen(b);
      if(!hedef) return;
      const eskiSira = day.blocks.map(x => x.id);
      const eski = day.blocks.filter(x => x.slot !== 'Dinlenme').indexOf(b);
      day.blocks.splice(day.blocks.indexOf(b), 1);
      day.blocks.splice(day.blocks.indexOf(hedef) + 1, 0, b);
      await M.saveDay(day.date);
      sonTasima = { date:day.date, id:b.id, eski, sira:eskiSira };
      R.App.render();
    },
    async 'block-geri'(){
      const day = todayDoc();
      if(!day || !sonTasima || sonTasima.date !== day.date) return;
      const sira = sonTasima.sira;
      day.blocks.sort((a, b) => sira.indexOf(a.id) - sira.indexOf(b.id));
      sonTasima = null;
      await M.saveDay(day.date);
      UI.toast(yz('ays.today.blok-eski-yerine-dondu'));
      R.App.render();
    },
    /* 064 küçük aksiyon: sormadan uygulanır, «Geri al» kalır (AGENTS §1.9). */
    async 'hedef-ayar'(el){
      const day = todayDoc();
      if(!day) return;
      const alan = el.dataset.kind === 'paragraph' ? 'paragraphTarget' : 'problemTarget';
      const once = Number(day[alan]) || 0;
      const sonra = Math.max(0, once + Number(el.dataset.delta || 0));
      if(sonra === once) return;
      day[alan] = sonra;
      await M.saveDay(day.date);
      const yenile = () => { if(!R.App.patch('#pane-hedef', hedefKutusu(day))) R.App.render(); };
      yenile();
      UI.toast((el.dataset.kind === 'paragraph' ? 'Paragraf' : 'Problem') + ' hedefi bugün ' + sonra + ' soru.', { undo:async () => {
        day[alan] = once; await M.saveDay(day.date); yenile();
      } });
    },
    async anchor(el){
      const day = todayDoc();
      const field = el.dataset.kind === 'paragraph' ? 'paragraphActual' : 'problemActual';
      day[field] = Math.max(0, (day[field]||0) + Number(el.dataset.delta));
      await M.saveDay(day.date);
      // yalniz cipa panelini yenile; tam cizim gerekmez
      if(!R.App.patch('#pane-anchors', AnchorPane(day))) R.App.render();
    },
    async 'block-status'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.status = el.dataset.value;
      if(b.status === 'done' && b.actualMin == null && !b.startedAt) planDakikasi(b);
      if(b.status !== 'skipped') b.skipReason = null;
      if(b.startedAt){ oturumYaz(b, Math.round(elapsedSeconds(b)/60)); sayacDakikasi(b, Math.round(elapsedSeconds(b)/60)); b.startedAt = null; }
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'skip-reason'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.skipReason = el.dataset.reason;
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'timer-start'(el){
      const day = todayDoc();
      day.blocks.forEach(b => {
        if(b.startedAt){ oturumYaz(b, Math.round(elapsedSeconds(b)/60)); sayacDakikasi(b, Math.round(elapsedSeconds(b)/60)); b.startedAt = null; }
      });
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.startedAt = new Date().toISOString();
      await M.saveDay(day.date);
      try{ window.dispatchEvent(new CustomEvent('lifeos:calisma', { detail:{ acik:true } })); }catch(e){}   // müzik: Çalışırken listesi
      R.App.render();
    },
    async 'timer-stop'(el){
      const r = calisan(el.dataset.block);
      if(!r){ R.App.render(); return; }   /* çalışan sayaç yok: 0 dk «yarım» yazılmaz */
      const { day, b } = r;
      const mins = Math.round(elapsedSeconds(b)/60);
      oturumYaz(b, mins);
      sayacDakikasi(b, mins);
      b.startedAt = null;
      if(b.status === 'pending') b.status = mins >= b.targetMin*0.8 ? 'done' : 'partial';
      await M.saveDay(day.date);
      try{ window.dispatchEvent(new CustomEvent('lifeos:calisma', { detail:{ acik:false } })); }catch(e){}
      UI.toast(mins+' dakika kaydedildi');
      R.App.render();
    },
    async checklist(el){
      const day = todayDoc();
      day.checklist = day.checklist || {};
      day.checklist[el.dataset.key] = el.checked;
      await M.saveDay(day.date);
      if(!R.App.patch('#pane-ritual', RitualCard(day))) R.App.render();
    },
    async flip(el){
      S.ui.flipped[el.dataset.id] = !S.ui.flipped[el.dataset.id];
      if(!R.App.patch('#pane-due', DueCards())) R.App.render();
    },
    async rate(el){
      const card = S.cards.find(x => x.id === el.dataset.id);
      M.schedule(card, el.dataset.rating);
      await M.saveCard(card);
      delete S.ui.flipped[card.id];
      UI.toast(yz('ays.today.sonraki-tekrar')+U.fmtShort(card.dueAt));
      R.App.render();
    },
    async 'repair-done'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      err.repairDoneAt = new Date().toISOString();
      await M.saveError(err);
      UI.toast(yz('ays.today.recete-tamamlandi'));
      R.App.render();
    },
    async 'open-review'(){ R.Screens.week.openReview(); },
  };
  ONAY_EYLEMLERI.forEach(a => { handle[a] = el => R.Screens.onaylar.handle[a](el); });

  const change = {
    async 'block-subject'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.subjectId = el.value || null;
      b.topicId = null;
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'block-topic-ref'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.topicId = el.value || null;
      await M.saveDay(day.date);
    },
    async 'block-topic'(el){
      const day = todayDoc();
      day.blocks.find(x => x.id === el.dataset.block).topic = el.value;
      await M.saveDay(day.date);
    },
    async 'block-num'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b[el.dataset.field] = el.value === '' ? null : Number(el.value);
      if(el.dataset.field === 'actualMin') b.minCert = el.value === '' ? null : 'measured';
      await M.saveDay(day.date);
      R.App.render();
    },
    async sleep(el){
      const day = todayDoc();
      day.sleepHours = el.value === '' ? null : Number(el.value);
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'day-note'(el){
      const day = todayDoc();
      day.note = el.value;
      await M.saveDay(day.date);
    },
  };

  return {
    id:'today',
    title:yz('ays.today.bugun-2'),
    subtitle(){ return ''; },
    /* v5: tarih üst satırda, günün cümlesi büyük başlık (004). */
    ust(){ return U.esc(tarihSatiri()); },
    headlineOz:'004',
    headline(){
      const d = S.days[U.todayISO()];
      return (d && bugunCumlesi(d, U.todayISO())) || 'Bugün';
    },
    /* Siri «Bugün ne var?» (hesap sunucu sözü 21): günün cümlesi; kural
       metni, model yok. Plan yoksa bu söylenir. */
    sesli(){
      const d = S.days[U.todayISO()];
      return (d && bugunCumlesi(d, U.todayISO())) || yz('ays.today.bugun-icin-plan-yok');
    },
    lede(){ return ''; },
    kapak,
    /* İlerleme › Özet: Bugün'den taşınan sayılar ve Öneri (progress.js). */
    ozet:ozetHtml, onayEylemleri:ONAY_EYLEMLERI,
    cumle:bugunCumlesi,
    ozetSayilari,
    sureMetni,
    /* Sayfa başı sade (kullanıcı, 2026-10-02: «özeti paylaş, deneme ekle
       oradan kalksın»): ikisi Bugün › Ayrıntı'nın başında durur. */
    actions(){ return ''; },
    render, afterRender, handle, change,
    /* Günü kapat (KOLAY Faz 1): satırlar, ölçüm satırının denetimi ve
       önizlemesi, alt sayfa. Bağlantı app.js'te (R.App.gunuKapatKur). */
    gunuKapat:{ satirlar:gkSatirlar, denetle:gkDenetle, onizle:gkOnizle, ac:gkAc, adiGecen:gkAdiGecen },
    /* Bugün › Ayrıntı: aynı işleyiciler, aynı sayaç; ayrı bir çizim. */
    ayrinti:{
      id:'gun',
      /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
         bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
         «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik.
         Gunluk hedef ara sira degisen bir ayardir; hedef sayisi sayaclarin
         altinda («/ 18 soru») zaten yazili (iPhone §8 «boy»). */
      kucukVarsayilan:['hafta-bağlamı', 'bugünün-ödülü', 'öbür-kayıtlar', 'günlük-hedef'],
      title:yz('ays.today.gunu-duzenle'),
      subtitle(){ return yz('ays.today.bloklar-sayaclar-ve-gunun-bu'); },
      actions(){
        return String(html`
          ${c.Button({ label:yz('ays.today.ozeti-paylas'), icon:'upload', size:'sm', act:'share-week' })}
          ${c.Button({ label:yz('ays.today.deneme-ekle'), icon:'exam', size:'sm', act:'go', data:{ 'data-route':'exams' } })}`);
      },
      render:renderAyrinti, afterRender, handle, change,
    },
  };
})();

R.Screens.gun = R.Screens.today.ayrinti;
