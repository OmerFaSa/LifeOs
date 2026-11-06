/* Bugün — sistemin günlük sayfası.

   Önceden iki ayrı ekran vardı: "Bugün" (özet) ve "Günlük ölçüm" (giriş);
   sonra tek sayfada üç sekme oldu (Giriş · Özet · Geçmiş). Yeni iskelette
   (belgeler/ekip/EKIP-PLANI.md §3) sekme yok:

     Bugün              Şimdi · Durum · Öneri — sık yazılan dört ölçüm ve
                        öğün satırı en üstte; toparlanma, asgari gün,
                        beslenme kutularda
     Bugün › Ayrıntı    Giriş · Özet · Geçmiş alt alta bölüm (`gun`)

   Yazmak önce gelir çünkü bu sayfaya girmenin sebebi çoğu zaman okumak
   değil YAZMAKtır. Hiçbir alan zorunlu değildir: eksik girdi sıfır
   sayılmaz, ağırlığı kalan girdilere dağıtılır. */
window.LIFEOS.PARCA.yazilar({
  'spi.today.bugun-2':'Bugün + ',
  'spi.today.son-30-gun':'Son 30 gün',
  'spi.today.ortalama-siddet':'Ortalama şiddet',
  'spi.today.tarttiysan-150-g-tavuk-yaz':'Tarttıysan «150 g tavuk» yaz, «ölçüldü» olur.',
  'spi.today.bu-aralikta-olcum-girilmemis':'Bu aralıkta ölçüm girilmemiş.',
  'spi.today.bugunun-olcumu-girilmedi':'Bugünün ölçümü girilmedi.',
  'spi.today.girilmeyen':'Girilmeyen: ',
  'spi.today.hedef-hesaplanamiyor':'Hedef hesaplanamıyor.',
  'spi.today.king-onayladi':'King onayladı',
  'spi.today.king-kismen-onayladi':'King kısmen onayladı',
  'spi.today.king-reddetti':'King reddetti',
  'spi.today.bam-calisiyor':'BAM çalışıyor',
  'spi.today.plandan-sonra':'Plandan sonra',
  'spi.today.bu-tarihe-hala-yetisilebilir':'Bu tarihe hâlâ yetişilebilir; plan olduğu gibi kalabilir.',
  'spi.today.plan-uygulandi':'Plan uygulandı · ',
  'spi.today.henuz-hic-yedek-almadin':'Henüz hiç yedek almadın.',
  'spi.today.son-yedegin':'Son yedeğin ',
  'spi.today.uyku-girilince-toparlanma-he':'Uyku girilince toparlanma hesaplanır.',
  'spi.today.bugunun-verisi-henuz-girilme':'Bugünün verisi henüz girilmedi.',
  'spi.today.girilmedi-kac-bardak-ictiyse':'Girilmedi · kaç bardak içtiysen o bardağa dokun',
  'spi.today.su-girilmedi-olarak-birakild':'Su girilmedi olarak bırakıldı',
  'spi.today.su-3':'Su · ',
  'spi.today.her-zamanki':'Her zamanki',
  'spi.today.bugun-3':'Bugün ',
  'spi.today.bugun-olculdu-saati-kayitli':'Bugün ölçüldü (saati kayıtlı değil)',
  'spi.today.kalan':'Kalan: ',
  'spi.today.bugun-tamam':'Bugün tamam.',
  'spi.today.gunun-akisi':'Günün akışı',
  'spi.today.uyku-gir':'Uyku gir',
  'spi.today.tatil-modu-3':'Tatil modu ',
  'spi.today.tatil-bitti-hos-geldin':'Tatil bitti; hoş geldin',
  'spi.today.hedef-guncellendi':'Hedef güncellendi',
  'spi.today.plan-uygulandi-geri-almak-is':'Plan uygulandı. Geri almak istersen «Planı geri al».',
  'spi.today.eski-plan-geri-alinamadi-hed':'Eski plan geri alınamadı; hedef değişmedi.',
  'spi.today.plan-geri-alindi-beslenme-he':'Plan geri alındı; beslenme hedefin plandan önceki haline döndü.',
  'spi.today.geri-alinamadi':'Geri alınamadı',
  'spi.today.gonderilemedi':'Gönderilemedi — ',
  'spi.today.kaydedildi':'Kaydedildi — ',
  'spi.today.bugun-tamam-toparlanma':'Bugün tamam, toparlanma ',
  'spi.today.bugun-tamam-toparlanma-2':'Bugün tamam — toparlanma ',
  'spi.today.uyku-suresini-yazman-bile-ye-2':'Uyku süresini yazman bile yeter: tek girdiyle anlamlı bir sonuç ',
  'spi.today.olcum-formu-sikayetler-ozet':'Ölçüm formu, şikâyetler, özet ve son iki hafta',
  'spi.today.hedef-danisma-da-konusularak':'Hedef Danışma’da konuşularak konur; planı burada önizler, onaylar ya da geri alırsın.',
});


window.SP = window.SP || {};
SP.Screens = SP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'spi', sira:40, id:'act:vitals', kind:'Eylem', label:'Günün ölçümünü gir', route:'today',
  hint:'Toparlanma', run:() => SP.App.go('today') });
window.LIFEOS.PARCA.yazilar({
  'spi.today.gece-uykusu-saat':'Gece uykusu (saat)',
  'spi.today.i-stirahat-nabzi':'İstirahat nabzı',
  'spi.today.hrv-ms':'HRV (ms)',
  'spi.today.buyuk-tansiyon':'Büyük tansiyon',
  'spi.today.kucuk-tansiyon':'Küçük tansiyon',
  'spi.today.oksijen':'Oksijen (%)',
  'spi.today.ates-c':'Ateş (°C)',
  'spi.today.kilo-kg':'Kilo (kg)',
  'spi.today.bel-cevresi-cm':'Bel çevresi (cm)',
  'spi.today.yag-orani':'Yağ oranı (%)',
  'spi.today.su-ml':'Su (ml)',
  'spi.today.1-bitkin':'1 · bitkin',
  'spi.today.2-yorgun':'2 · yorgun',
  'spi.today.3-normal':'3 · normal',
  'spi.today.4-iyi':'4 · iyi',
  'spi.today.5-zinde':'5 · zinde',
  'spi.today.gun-sec':'Gün seç',
  'spi.today.bugune-don':'Bugüne dön',
  'spi.today.bugun-bir-sikayetin-var-mi':'Bugün bir şikâyetin var mı?',
  'spi.today.dunku-sikayetler-suruyor':'Dünkü şikâyetler sürüyor',
  'spi.today.sikayetim-yok':'Şikâyetim yok',
  'spi.today.bir-sikayete-tiklayinca-sidd':'Bir şikâyete tıklayınca şiddeti artar: hafif → orta → şiddetli → kapalı.',
  'spi.today.adet-kanamasi':'Adet kanaması',
  'spi.today.bugun-kanama-var':'Bugün kanama var',
  'spi.today.payda-girilen-gun-sayisidir':'Payda girilen gün sayısıdır, otuz değil: işaretlenmemiş bir gün «şikâyet yok» sayılmaz.',
  'spi.today.gunun-olcumu':'Günün ölçümü',
  'spi.today.bos-biraktigin-alan-sifir-sa':'Boş bıraktığın alan sıfır sayılmaz — hesaba hiç girmez. Uyku ',
  'spi.today.kaydet':'Kaydet',
  'spi.today.bugun-nasil-hissediyorsun':'Bugün nasıl hissediyorsun?',
  'spi.today.gunun-hissi':'Günün hissi',
  'spi.today.not':'Not',
  'spi.today.hastalik-ilac-degisikligi-ol':'Hastalık, ilaç değişikliği, olağandışı bir gün…',
  'spi.today.ogun-ekle':'Öğün ekle',
  'spi.today.ev-olcusunden-gelen-gramaj-t':'Ev ölçüsünden gelen gramaj «tahmin» olarak işaretlenir. ',
  'spi.today.butun-ogunler':'Bütün öğünler',
  'spi.today.1-tabak-etli-kuru-fasulye':'1 tabak etli kuru fasulye, 1 bardak ayran',
  'spi.today.ogun-metni':'Öğün metni',
  'spi.today.ogune-ekle':'Öğüne ekle',
  'spi.today.girilen-degerler':'Girilen değerler',
  'spi.today.referans-araligi-laboratuvar':'Referans aralığı laboratuvarın normal saydığı yer; hedef bandı ',
  'spi.today.neden-bunlar':'Neden bunlar?',
  'spi.today.taban-cizgin':'Taban çizgin',
  'spi.today.hrv-ve-nabiz-mutlak-degil':'HRV ve nabız mutlak değil kişisel ölçektir: kendi ortalamana göre ',
  'spi.today.ortalama':'Ortalama',
  'spi.today.son-iki-hafta':'Son iki hafta',
  'spi.today.uyku':'Uyku',
  'spi.today.nabiz':'Nabız',
  'spi.today.hrv':'HRV',
  'spi.today.asgari-gun':'Asgari gün',
  'spi.today.asgari-gun-tamam':'Asgari gün tamam',
  'spi.today.bugunun-asgarisi-kapandi-ser':'Bugünün asgarisi kapandı. Seri, girilmiş günlerden sayılır; ',
  'spi.today.dunkunun-aynisi':'Dünkünün aynısı',
  'spi.today.aynisini-yaptiysan-tek-dokun':'Aynısını yaptıysan tek dokunuşla bugüne ekle; zorlanma puanı kopyalanmaz, sorulur.',
  'spi.today.bugune-ekle':'Bugüne ekle',
  'spi.today.seri':'Seri',
  'spi.today.yillik-tatil-siniri-bu-yil':'Yıllık tatil sınırı: bu yıl kalan',
  'spi.today.gun':'gün',
  'spi.today.yillik-tatil-siniri-gun':'yıllık tatil sınırı, gün',
  'spi.today.siniri-kaydet':'Sınırı kaydet',
  'spi.today.tatil-modu':'Tatil modu:',
  'spi.today.seri-korunuyor-hkm-soru':'· seri korunuyor, HKM soru sormuyor',
  'spi.today.tatili-bitir':'Tatili bitir',
  'spi.today.bugun-dondurulmus':'Bugün dondurulmuş (',
  'spi.today.seri-bozulmaz':') · seri bozulmaz',
  'spi.today.geri-al':'Geri al',
  'spi.today.kac-gun':'Kaç gün?',
  'spi.today.vazgec':'Vazgeç',
  'spi.today.kotu-gun':'Kötü gün',
  'spi.today.bugun-hastayim-seri-donsun':'Bugün hastayım · seri donsun',
  'spi.today.tatil-modu-2':'Tatil modu',
  'spi.today.kotu-gun-modu-antrenman-hafi':'Kötü gün modu: antrenman hafif, bugün asgari gün yeter (',
  'spi.today.normal-gune-don':'Normal güne dön',
  'spi.today.toparlanma':'Toparlanma',
  'spi.today.veri-gir':'Veri gir',
  'spi.today.hareketi-ac':'Hareketi aç',
  'spi.today.beslenme':'Beslenme',
  'spi.today.profilde':'Profilde ',
  'spi.today.profili-tamamla':'Profili tamamla',
  'spi.today.ogunleri-ac':'Öğünleri aç',
  'spi.today.protein':'Protein',
  'spi.today.lif':'Lif',
  'spi.today.yag':'Yağ',
  'spi.today.askiya-al':'Askıya al',
  'spi.today.surdur':'Sürdür',
  'spi.today.tamamlandi':'Tamamlandı',
  'spi.today.birak':'Bırak',
  'spi.today.plan-kurulamadi':'Plan kurulamadı.',
  'spi.today.kapat':'Kapat',
  'spi.today.plan-onizlemesi':'Plan önizlemesi',
  'spi.today.onaylanana-kadar-hicbir-sey':'— onaylanana kadar hiçbir şey değişmez.',
  'spi.today.enerji-ve-tempo-tahmindir-1':'Enerji ve tempo tahmindir: «1 kg ≈ 7700 kcal» yaygın bir yaklaşımdır, kaynağı henüz bağlanmadı. Plan geri alınabilir; geri alınca beslenme hedefin bugünkü haline döner.',
  'spi.today.plani-uygula':'Planı uygula',
  'spi.today.simdilik-degil':'Şimdilik değil',
  'spi.today.bugunun-verisiyle-yeniden-he':'Bugünün verisiyle yeniden hesap',
  'spi.today.secim-yapana-kadar-hicbir':'— seçim yapana kadar hiçbir şey değişmez.',
  'spi.today.secince-eski-plan-geri-alini':'Seçince eski plan geri alınır, hedef yeni tarih ve vakitle güncellenir; yeni planı önizleyip onaylarsın. Eski tarih hedefin geçmişinde kalır.',
  'spi.today.sonraki-kontrol':'Sonraki kontrol:',
  'spi.today.beklenen':') — beklenen',
  'spi.today.yeniden-hesapla':'Yeniden hesapla',
  'spi.today.hekim-talimatina-uyuluyor':'hekim talimatına uyuluyor.',
  'spi.today.bu-hafta':'Bu hafta (',
  'spi.today.hafta':'. hafta)',
  'spi.today.planlama-ofisi-programi-suru':'— Planlama Ofisi programı, sürüm',
  'spi.today.i-s-emri':'İş emri #',
  'spi.today.plani-geri-al':'Planı geri al',
  'spi.today.king-e-ilet':'King’e ilet',
  'spi.today.plani-gor':'Planı gör',
  'spi.today.zaman-butcesi-king':'Zaman bütçesi (King):',
  'spi.today.hedeflerim':'Hedeflerim',
  'spi.today.danisma-da-hedef-koy':'Danışma’da hedef koy',
  'spi.today.henuz-hedefin-yok-danisma-da':'Henüz hedefin yok. Danışma’da bir cümleyle yazabilirsin.',
  'spi.today.ornekler':'Örnekler',
  'spi.today.3-ay-icinde-3-kilo':'«3 ay içinde 3 kilo vermek istiyorum» ya da «VKİ’mi 24’e indirmek istiyorum» gibi yazabilirsin; gerçekçi olup olmadığını ve güvenli temposunu söylerim. Alışkanlık da kurabilirsin: «haftada 3 gün 30 dakika düzenli spor yapmak istiyorum».',
  'spi.today.king-bildirimi':'King bildirimi',
  'spi.today.okundu':'Okundu',
  'spi.today.bildirim-daha-hkm':'bildirim daha — HKM › Ofis’te.',
  'spi.today.ofisten':'Ofisten',
  'spi.today.ofisi-ac':'Ofisi aç',
  'spi.today.tazele':'Tazele',
  'spi.today.gunun-brifingi-henuz-uretilm':'Günün brifingi henüz üretilmedi.',
  'spi.today.butce':'Bütçe',
  'spi.today.finansi-ac':'Finansı aç',
  'spi.today.haftalik-sinir':'Haftalık sınır',
  'spi.today.bir-soru':'Bir soru',
  'spi.today.cevabin':'Cevabın:',
  'spi.today.soru-acik-kalir-ayrismanin-g':'Soru açık kalır: ayrışmanın gerçekten kapanıp kapanmadığı bir sonraki pencerede ölçülecek.',
  'spi.today.kisa-cevabin-istege-bagli':'Kısa cevabın (isteğe bağlı)',
  'spi.today.tek-cumle-yeter':'tek cümle yeter',
  'spi.today.cevabi-kaydet':'Cevabı kaydet',
  'spi.today.bu-soru-bana-uymuyor':'Bu soru bana uymuyor',
  'spi.today.hkm':'HKM',
  'spi.today.simdi-gonder':'Şimdi gönder',
  'spi.today.tarayici-verisi-silinirse-ta':'Tarayıcı verisi silinirse tahlil, ölçüm ve öğün geçmişin kaybolur.',
  'spi.today.yedek-al':'Yedek al',
  'spi.today.butun-alanlar':'Bütün alanlar',
  'spi.today.kisa-uyku':'Kısa uyku',
  'spi.today.ekle':'Ekle',
  'spi.today.gunun-toplami':'Günün toplamı',
  'spi.today.hesaplandi':'(hesaplandı)',
  'spi.today.gece-uykusuna-eklenmez-ayri':'Gece uykusuna eklenmez; ayrı sayılır',
  'spi.today.sure-dakika':'Süre (dakika)',
  'spi.today.baslangic':'Başlangıç',
  'spi.today.egilim':'Eğilim',
  'spi.today.olculmemis-gun-bos-kalir-ort':'Ölçülmemiş gün boş kalır; ortalamaya girmez, sıfır sayılmaz.',
  'spi.today.kilo':'Kilo',
  'spi.today.su':'Su',
  'spi.today.hedef':'Hedef: ',
  'spi.today.su-2':'Su ',
  'spi.today.hatirlatmalar':'Hatırlatmalar',
  'spi.today.gunu-kapat':'Günü kapat',
  'spi.today.gunu-duzenle':'Günü düzenle',
  'spi.today.sabah-tartisi':'Sabah tartısı',
  'spi.today.tarti':'Tartı',
  'spi.today.buyuk-rakam-sabit-birim':'Büyük rakam, sabit birim; ✓ ölçüm formuyla aynı kayda gider.',
  'spi.today.agirligi-kalanlara-dagitildi':'— ağırlığı kalanlara dağıtıldı.',
  'spi.today.siradaki':'Sıradaki',
  'spi.today.ust-uste':'üst üste.',
  'spi.today.asgari-gun-seriyi-surdurur':'Asgari gün seriyi sürdürür.',
  'spi.today.henuz-baslamadi':'Henüz başlamadı.',
  'spi.today.bugun-asgari-gunu-tamamlarsa':'Bugün asgari günü tamamlarsan seri başlar.',
  'spi.today.olcum-bekliyor':'Ölçüm bekliyor.',
  'spi.today.uyku-suresini-yazman-bile-ye':'Uyku süresini yazman bile yeter.',
  'spi.today.hedef-yok':'Hedef yok.',
  'spi.today.ogun-girilmedi':'Öğün girilmedi.',
  'spi.today.hedef-2':'Hedef ',
  'spi.today.bugun':'Bugün',
  'spi.today.saglik':'Sağlık',
  'spi.today.profilde-2':'Profilde',
  'spi.today.eksik-hedef-tahmin-edilmez':'eksik; hedef tahmin edilmez.',
  'spi.today.bugun-hic-ogun-girilmedi':'Bugün hiç öğün girilmedi.',
  'spi.today.enerji':'Enerji',
  'spi.today.son-olcumler':'Son ölçümler',
  'spi.today.eski-olcum-soluklasir-ve-yas':'Eski ölçüm soluklaşır ve yaşını yazar; ölçülmemiş değer sıfır sayılmaz.',
  'spi.today.esik':'eşik ',
  'spi.today.ogun':'Öğün',
  'spi.today.hareket':'Hareket',
  'spi.today.gunu-kaydet':'Günü kaydet',
  'spi.today.gece-uykusu':'Gece uykusu',
  'spi.today.bu-gecenin-uykusu-girilmedi':'Bu gecenin uykusu girilmedi.',
  'spi.today.planin-yuzde':'Planın yüzde ',
  'spi.today.son-yedi-gece':'Son yedi gece; ',
  'spi.today.toparlanma-2':'Toparlanma ',
  'spi.today.uyku-girilince-hesaplanir':'Uyku girilince hesaplanır.',
  'spi.today.son-14-gunun':'Son 14 günün ',
  'spi.today.haftanin-en-iyi-gecesi':'Haftanın en iyi gecesi',
  'spi.today.i-ncelemeye-git':'İncelemeye git',
  'spi.today.ogunler':'Öğünler',
  'spi.today.gun-2':'Gün',
  'spi.today.durum':'Durum',
  'spi.today.oneri':'Öneri',
  'spi.today.gunun-bolumleri':'Günün bölümleri',
  'spi.today.giris':'Giriş',
  'spi.today.ozet':'Özet',
  'spi.today.gecmis':'Geçmiş',
  'spi.today.hedef-motoru-yuklenmedi':'Hedef motoru yüklenmedi',
  'spi.today.hedefler-bu-derlemede-yok-di':'Hedefler bu derlemede yok; diğer ekranlar çalışmaya devam eder.',
  'spi.today.kotu-gun-modu-acik-yuk':'Kötü gün modu açık: yük hafifledi, asgari gün yeter.',
  'spi.today.normal-gune-donuldu':'Normal güne dönüldü',
  'spi.today.bugun-donduruldu-seri-bozulm':'Bugün donduruldu; seri bozulmaz. Geçmiş olsun.',
  'spi.today.dondurma-geri-alindi':'Dondurma geri alındı',
  'spi.today.yillik-tatil-siniri-icin-bir':'Yıllık tatil sınırı için bir gün sayısı yaz.',
  'spi.today.yillik-tatil-siniri':'Yıllık tatil sınırı ',
  'spi.today.bu-secenek-artik-gecerli-deg':'Bu seçenek artık geçerli değil; yeniden hesapla.',
  'spi.today.hedef-yeni-tarihle-guncellen':'Hedef yeni tarihle güncellendi; yeni planı önizleyip onayla.',
  'spi.today.okundu-isareti-merkeze-bildi':'Okundu işareti merkeze bildirilemedi; bildirim HKM’de okunmamış kalır.',
  'spi.today.hkm-u2019ye-gonderiliyor':'HKM\u2019ye gönderiliyor…',
  'spi.today.kaydedildi-sonucu-bir-sonrak':'Kaydedildi. Sonucu bir sonraki pencere gösterecek.',
  'spi.today.soru-kapatildi':'Soru kapatıldı',
  'spi.today.bugun-sikayet-yok-olarak-kay':'Bugün şikâyet yok olarak kaydedildi',
  'spi.today.dunku':'Dünkü ',
  'spi.today.once-degeri-yaz':'Önce değeri yaz.',
  'spi.today.kisa-uyku-kaydedildi':'Kısa uyku kaydedildi',
  'spi.today.kisa-uyku-silindi':'Kısa uyku silindi',
  'spi.today.i-saretlendi-kayit-gecmiste':'İşaretlendi — kayıt geçmişte duruyor',
  'spi.today.brifing-uretiliyor':'Brifing üretiliyor…',
  'spi.today.asgari-gun-2':'asgari gün',
  'spi.today.gun-seri':'gün seri',
  'spi.today.kirmizi-bayrak':'kırmızı bayrak',
  'spi.today.hedefler':'Hedefler',
});
window.LIFEOS.PARCA.sayfa({ id:'today', modul:'spi', king:{ sira:10, ad:'Bugün', es:['bugün', 'genel bakış', 'ölçüm'] }, cekmece:'bugun', ad:'Genel bakış', sira:10 });
window.LIFEOS.PARCA.sayfa({ id:'hedefler', modul:'spi', cekmece:'plan', ad:'Hedefler', sira:20 });

SP.Screens.today = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  function shownDate(){ return S.ui.mealDate || U.todayISO(); }

  /* Girilecek alanlar tek yerde tanimlanir; form da, kaydetme de bunu okur. */
  const FIELDS = [
    { id:'sleep',    label:yz('spi.today.gece-uykusu-saat'),        step:'0.5', min:0,  max:16,  marker:'sleep' },
    { id:'rhr',      label:yz('spi.today.i-stirahat-nabzi'),    step:'1',   min:30, max:140, marker:'rhr' },
    { id:'hrv',      label:yz('spi.today.hrv-ms'),           step:'1',   min:5,  max:250, marker:'hrv' },
    { id:'sbp',      label:yz('spi.today.buyuk-tansiyon'),     step:'1',   min:60, max:250, marker:'sbp' },
    { id:'dbp',      label:yz('spi.today.kucuk-tansiyon'),     step:'1',   min:30, max:160, marker:'dbp' },
    { id:'spo2',     label:yz('spi.today.oksijen'),        step:'1',   min:70, max:100, marker:'spo2' },
    { id:'temp',     label:yz('spi.today.ates-c'),          step:'0.1', min:33, max:43,  marker:'temp' },
    { id:'weight',   label:yz('spi.today.kilo-kg'),          step:'0.1', min:20, max:250, marker:'weight' },
    { id:'waist',    label:yz('spi.today.bel-cevresi-cm'),   step:'0.5', min:40, max:200, marker:'waist' },
    { id:'bodyfat',  label:yz('spi.today.yag-orani'),      step:'0.1', min:3,  max:60,  marker:'bodyfat' },
    { id:'water',    label:yz('spi.today.su-ml'),            step:'100', min:0,  max:8000, marker:null },
  ];

  const SORENESS = [
    { value:1, label:yz('spi.today.1-bitkin') }, { value:2, label:yz('spi.today.2-yorgun') },
    { value:3, label:yz('spi.today.3-normal') }, { value:4, label:yz('spi.today.4-iyi') },
    { value:5, label:yz('spi.today.5-zinde') },
  ];

  /* ZAMAN KAYDIRICI. Günler arasında gezinmek için üç düğme vardı:
     «‹ · bugün · ›». Geçmiş bir günü doldurmak zahmetliydi — on gün
     geriye gitmek on tıklamaydı.

     Şerit son on dört günü GÖSTERİR: her günün altında o gün veri
     girilip girilmediğini söyleyen bir nokta durur. Böylece «hangi
     günler eksik» sorusu tıklamadan cevaplanır. */
  const SERIT_GUN = 14;

  function dayNav(d){
    const bugun = U.todayISO();
    const gunler = [];
    for(let i = SERIT_GUN - 1; i >= 0; i--){
      const t = U.iso(U.addDays(U.parse(bugun), -i));
      const v = M.vitalsOf(t);
      /* Dolu sayılmak için tek alan yeter: sistem «eksik gün» demez,
         «hiç girilmemiş gün» der. */
      const dolu = !!(v && FIELDS.some(f => v[f.id] != null));
      gunler.push({ date:t, dolu, bugun:t === bugun, secili:t === d });
    }
    /* 023 YAZILABİLİR GÜN PENCERESİ: puan (XP) bugün + 7 gün geriye yazılır
       (brand/seviye/xp.js GERI_GUN). Daha eski gün KAYDEDİLİR — ölçüm
       ölçümdür — ama puan almaz; o yüzden taralı ama tıklanır. */
    const V = (window.LIFEOS || {}).VITRIN;
    const pencere = SP.XP && SP.XP.pencere ? SP.XP.pencere() : null;
    if(V && V.gunPenceresi && pencere){
      const acik = new Set(pencere);
      return html`<div class="daynav">${raw(V.gunPenceresi({ etiket:yz('spi.today.gun-sec'), pencere:pencere.length - 1,
        kilitAd:'taralı · puan yok', not:yz('spi.today.bugun-2') + (pencere.length - 1) + ' gün geri puana yazılır',
        gunler:gunler.map(g => ({ gun:String(U.parse(g.date).getDate()), bugun:g.bugun, secili:g.secili, dolu:g.dolu,
          kilitli:!acik.has(g.date), act:'open-day', data:{ 'data-date':g.date },
          ad:U.fmtDate(g.date) + (g.dolu ? ', veri var' : ', veri yok') + (acik.has(g.date) ? '' : ', puan yazılmaz'),
          baslik:U.fmtDate(g.date) + (g.dolu ? ' · veri var' : ' · veri yok') })) }))}
        ${when(d !== bugun, () => K.Button({ label:yz('spi.today.bugune-don'), size:'sm',
          act:'open-day', data:{ 'data-date':bugun } }))}</div>`;
    }
    return html`<div class="daynav">
      <div class="daynav__strip" role="group" aria-label="Gün seç">
        ${map(gunler, g => html`<button
          class="${cls('daybtn', g.secili && 'is-on', g.bugun && 'is-today')}"
          data-act="open-day" data-date="${g.date}"
          aria-pressed="${g.secili ? 'true' : 'false'}"
          title="${U.fmtDate(g.date) + (g.dolu ? ' · veri var' : ' · veri yok')}">
          <span class="daybtn__d">${U.parse(g.date).getDate()}</span>
          <span class="${cls('daybtn__dot', g.dolu && 'is-full')}" aria-hidden="true"></span>
        </button>`)}
      </div>
      ${when(d !== bugun, () => K.Button({ label:yz('spi.today.bugune-don'), size:'sm',
        act:'open-day', data:{ 'data-date':bugun } }))}
    </div>`;
  }

  /* SEMPTOM GİRİŞİ. Günlükte serbest metin bir not vardı, yapı yoktu.
     Serbest metin aranamaz, sayılamaz, eğilime dönmez.

     Şiddet üç basamak: daha ince bir ölçek kullanıcıdan olmayan bir
     kesinlik ister ve günlük giriş yükünü artırır.

     «Şikâyet yok» ile «girilmemiş» ayrı şeylerdir: işaretlemeden
     kaydeden bir gün ikincisidir ve sistem bunu karıştırmaz. */
  /* Dünün şikâyetleri (yalnız katalogdaki kimlikler), bu gün boşsa; yoksa null. */
  function dunkuSikayetler(d){
    const v = M.vitalsOf(d);
    if(Object.keys(SP.Symptom.ofDay(d)).length || (v && v.symptomsLogged)) return null;
    const dun = SP.Symptom.ofDay(U.iso(U.addDays(U.parse(d), -1)));
    const out = {};
    Object.keys(dun).forEach(id => { if(SP.SYMPTOM_BY_ID[id] && dun[id]) out[id] = dun[id]; });
    return Object.keys(out).length ? out : null;
  }

  function symptomEntry(){
    const d = shownDate();
    const secili = SP.Symptom.ofDay(d);
    const v = M.vitalsOf(d);
    const kadin = (S.profile || {}).sex === 'female';
    const w = SP.Symptom.window(30);
    /* DÜNKÜ ŞİKÂYETLER SÜRÜYOR (2026-10-25; kullanıcı: «spi için daha
       işlevli veri girişi, sürtünmeyi azaltacak teknikler ile daha güzel
       yap»). Süren bir şikâyeti her gün yeniden işaretlemek üç-dört
       dokunuştu. Düğme yalnız dün şikâyet varken ve bu gün hiç
       girilmemişken çıkar («şikâyet yok» denmiş günde çıkmaz). Bu
       kullanıcının BEYANIDIR, teşhis değil: şiddetleri olduğu gibi taşır. */
    const dunku = dunkuSikayetler(d);

    return K.Entry({
      label:yz('spi.today.bugun-bir-sikayetin-var-mi'), hint:'not-sikayet',
      meta:Object.keys(secili).length
        ? Object.keys(secili).length + ' işaretli'
        : (v && v.symptomsLogged ? 'şikâyet yok' : 'girilmedi'),
      /* Açıklama ⓘ'de (hints.js «not-sikayet»): sıkı ölçüde sabit not yok. */
      action:html`${when(dunku, () => K.Button({ label:yz('spi.today.dunku-sikayetler-suruyor'), size:'sm', act:'dunku-sikayet' }))}
        ${K.Button({ label:yz('spi.today.sikayetim-yok'), size:'sm', act:'no-symptoms' })}`,
      body:html`
        ${map(SP.SYMPTOM_GROUPS, g => html`
          <div class="symgrp">
            <div class="symgrp__h">${g.name}</div>
            <div class="symgrp__list">${map(
              SP.SYMPTOMS.filter(x => x.group === g.id), sx => {
                const sev = secili[sx.id];
                return html`<button
                  class="${cls('symbtn', sev && 'is-on', sev && 'sev-' + sev)}"
                  data-act="cycle-symptom" data-id="${sx.id}"
                  aria-pressed="${sev ? 'true' : 'false'}"
                  title="${sx.hint}">
                  <span>${sx.name}</span>
                  ${when(sev, () => html`<span class="symbtn__s">${
                    (SP.SYMPTOM_SEVERITY.find(z => z.value === sev) || {}).label}</span>`)}
                </button>`;
              })}</div>
          </div>`)}
        <p class="tiny dim mt-8">${yz('spi.today.bir-sikayete-tiklayinca-sidd')}</p>

        ${when(kadin, () => html`<div class="mt-16">
          ${K.Field({ label:yz('spi.today.adet-kanamasi'), hint:'ferritin ve hemoglobin yorumu buna bağlı',
            input:K.Checkbox({ id:'v-period', label:yz('spi.today.bugun-kanama-var'),
              checked:!!(v && v.period), act:'toggle-period' }) })}
        </div>`)}

        ${when(w.ok && w.rows.length, () => html`<div class="mt-16">
          ${K.Table({ tight:true, headers:[yz('spi.today.son-30-gun'), 'Gün', yz('spi.today.ortalama-siddet')],
            rows:w.rows.slice(0, 5).map(r => [r.symptom.name,
              r.days + ' / ' + w.loggedDays,
              (SP.SYMPTOM_SEVERITY.find(z => z.value === Math.round(r.avgSeverity))
                || { label:'—' }).label]) })}
          <p class="tiny dim mt-6">${yz('spi.today.payda-girilen-gun-sayisidir')}</p>
        </div>`)}`,
    });
  }

  /* O günün ÖLÇÜLMÜŞ antrenman süresi. `minutes` boş bırakılan bir
     antrenman «sıfır dakika» değil «veri yok»tur ve sayılmaz. */
  function OdakRozeti(d){
    if(!SP.Basarim) return '';
    const dk = (S.workouts || []).filter(w => w && w.date === d)
      .reduce((t, w) => t + (w.minutes != null ? Number(w.minutes) || 0 : 0), 0);
    return SP.Basarim.odakHtml(dk);
  }

  function formEntry(){
    const d = shownDate();
    const v = M.vitalsOf(d) || M.defaultVitals(d);
    return K.Entry({
      label:yz('spi.today.gunun-olcumu'),
      /* GÜNÜN ODAK ROZETİ — günün raporunda, tarihin yanında.
         Başarımlar sekmesindeki odak rozeti ömürlük rekordur; bu ise
         BU GÜNÜN kendisi (bkz. core/basarim.js, gununOdagi). Eşiğin
         altındaki gün rozet almaz ve boş döner. */
      meta:raw(SP.h.esc(U.fmtDate(d)) + OdakRozeti(d)),
      note:yz('spi.today.bos-biraktigin-alan-sifir-sa')
        + 'süresini yazman bile anlamlı bir sonuç üretir.',
      action:html`${dayNav(d)}
        ${K.Button({ label:yz('spi.today.kaydet'), tone:'primary', act:'save-vitals' })}`,
      body:html`
        <div class="grid-form">${map(FIELDS, f => K.Field({
          /* ALANIN SİMGESİ — kimlikten türer, burada ad kurulmaz
             (bkz. `brand/ortak/simge.js`). On bir alanlık bir ızgarada
             etiketler birbirine benziyordu: «Büyük tansiyon», «Küçük
             tansiyon», «İstirahat nabzı» üç satır aynı uzunlukta üç
             gri yazıydı ve göz hangisine baktığını her seferinde
             okuyarak buluyordu.

             SİMGE `marker` ALANINDAN gelir, `id`den DEĞİL. İkisi
             çoğu alanda aynı ama `water`ın `marker`ı bilerek `null`:
             su bir biyobelirteç değil. `|| f.id` diye bir geri
             düşüş yazılmıştı ve `olcum-water.webp` her açılışta 404
             dönüyordu — var olmayacağı bilinen bir dosyayı istemek.
             (Duman testi bunu yakaladı; her 404'te kırmızıya döner.)
             Markersız alan simgesiz kalır, etiketi olduğu gibi. */
          label:raw(window.LIFEOS.SIMGELI('olcum', f.marker || f.id, f.label)),   /* su: işareti yok, simgesi var */
          input:K.Input({ id:'v-' + f.id, type:'number', numeric:true, step:f.step,
            min:f.min, max:f.max, value:v[f.id] == null ? '' : v[f.id] }),
        }))}</div>
        ${KestirmeSatiri(d, true)}
        ${K.Field({ label:yz('spi.today.bugun-nasil-hissediyorsun'),
          hint:'cihazın göremediği tek girdi',
          input:K.Segmented({ act:'set-soreness', value:v.soreness == null ? '' : String(v.soreness),
            items:SORENESS, block:true, aria:yz('spi.today.gunun-hissi') }) })}
        ${K.Field({ label:yz('spi.today.not'),
          input:html`<div class="withmic">
            ${K.Textarea({ id:'v-note', rows:2, value:v.note || '',
              placeholder:yz('spi.today.hastalik-ilac-degisikligi-ol') })}
            ${K.Mic({ target:'v-note' })}
          </div>` })}`,
    });
  }

  function quickEntry(){
    return K.Entry({
      label:yz('spi.today.ogun-ekle'), hint:'portion',
      note:yz('spi.today.ev-olcusunden-gelen-gramaj-t')
        + yz('spi.today.tarttiysan-150-g-tavuk-yaz'),
      action:K.Button({ label:yz('spi.today.butun-ogunler'), act:'go', data:{ 'data-route':'meals' } }),
      body:html`
        <div class="quick">
          ${K.Mic({ target:'quick-meal' })}
          ${K.Input({ id:'quick-meal', placeholder:yz('spi.today.1-tabak-etli-kuru-fasulye'),
            aria:yz('spi.today.ogun-metni') })}
          ${K.Button({ label:yz('spi.today.ogune-ekle'), tone:'primary', act:'quick-meal' })}
        </div>`,
    });
  }

  function statusEntry(){
    const d = shownDate();
    const v = M.vitalsOf(d);
    if(!v) return '';
    const rows = FIELDS.filter(f => f.marker && v[f.id] != null).map(f => {
      const b = SP.BIO_BY_ID[f.marker];
      const r = SP.Bio.refFor(f.marker);
      return { marker:b, value:v[f.id], at:d, cert:'measured',
        status:SP.Bio.statusOf(f.marker, v[f.id]), ref:r.ref, optimal:r.optimal };
    });
    if(!rows.length) return '';
    return K.Entry({
      label:yz('spi.today.girilen-degerler'), hint:'ref-range',
      meta:rows.length + ' ölçüm',
      note:yz('spi.today.referans-araligi-laboratuvar')
        + 'bu sistemin istediği daha dar yer.',
      body:html`${map(rows, r => P.markerRow(r, {}))}`,
    });
  }

  function whyEntry(){
    return K.Entry({
      label:yz('spi.today.neden-bunlar'),
      meta:'toparlanmanın girdileri',
      body:html`<ul class="bullets small muted">
        ${map(SP.READINESS_INPUTS, i => html`<li><b>${i.label}</b> — ${i.note}</li>`)}
      </ul>`,
    });
  }

  function baselineEntry(){
    const rows = [['hrv', 'HRV'], ['rhr', yz('spi.today.i-stirahat-nabzi')], ['sleep', 'Uyku'], ['weight', 'Kilo']]
      .map(([key, label]) => {
        const b = SP.Move.baseline(key);
        return [label, b ? html`<b class="num">${U.fmtNet(b.mean)}</b>` : html`<span class="dim">—</span>`,
          b ? b.n + ' gün' : 'en az 3 gün gerekir'];
      });
    return K.Entry({
      label:yz('spi.today.taban-cizgin'),
      meta:'son 30 gün, bugün hariç',
      note:yz('spi.today.hrv-ve-nabiz-mutlak-degil')
        + 'okunur, başkasınınkiyle karşılaştırılmaz.',
      body:K.Table({ tight:true, headers:['Ölçüm', { label:yz('spi.today.ortalama'), num:true }, 'Kapsam'], rows }),
    });
  }

  function historyEntry(){
    const days = [];
    for(let i = 13; i >= 0; i--) days.push(U.iso(U.addDays(U.today(), -i)));
    const rows = days.filter(d => S.vitals[d]).reverse().map(d => {
      const v = S.vitals[d];
      const r = SP.Move.readiness(d);
      return [
        html`<button class="linkbtn" data-act="open-day" data-date="${d}">${U.fmtShort(d)}</button>`,
        v.sleep == null ? '—' : U.fmtNet(v.sleep),
        v.rhr == null ? '—' : U.fmtNum(v.rhr),
        v.hrv == null ? '—' : U.fmtNum(v.hrv),
        r.ok ? K.Badge({ label:String(r.score), tone:r.band.tone }) : html`<span class="dim">—</span>`,
      ];
    });
    if(!rows.length){
      return K.Entry({ label:yz('spi.today.son-iki-hafta'), meta:'kayıt yok',
        body:P.empty(yz('spi.today.bu-aralikta-olcum-girilmemis')) });
    }
    return K.Entry({
      label:yz('spi.today.son-iki-hafta'), meta:rows.length + ' gün',
      body:K.Table({ tight:true,
        headers:['Gün', { label:yz('spi.today.uyku'), num:true }, { label:yz('spi.today.nabiz'), num:true },
          { label:yz('spi.today.hrv'), num:true }, 'Toparlanma'],
        rows }),
    });
  }

  /* ---------------------------------------------------------- kartlar */  /* ---------------------------------------------------------- kartlar */

  function minimumEntry(){
    const m = SP.Calc.minimumDay();
    const streak = SP.Calc.streak();
    /* ASGARI GUN TAMAMLANDIGINDA bir satir degil bir SONUC yazilir.

       «4 / 4» ile «3 / 4» arasindaki fark ekranda bir rakamdi; gunun
       bittigini soyleyen sey o rakami okumak zorunda kalmaktı. Kart
       yalniz hepsi tamamken cizilir — yarim bir gunu tamamlanmis
       gostermek, olcmedigimiz bir seyi soylemek olurdu. */
    const bitti = m.total > 0 && m.done >= m.total;
    return K.Entry({
      label:yz('spi.today.asgari-gun'), hint:'minimum-day',
      meta:m.done + ' / ' + m.total + ' · seri ' + streak + ' gün',
      note:m.note,
      body:html`
        ${when(bitti, () => K.NextUp({ icon:'check', calm:true, sanat:'saglik',
          label:yz('spi.today.asgari-gun-tamam'),
          title:m.total + ' / ' + m.total + ' · seri ' + streak + ' gün',
          why:yz('spi.today.bugunun-asgarisi-kapandi-ser')
             + 'girilmemiş gün seriyi kırmaz, sayıya da katılmaz.' }))}
        <div class="mt-2">${map(m.rows, P.minRow)}</div>`,
    });
  }

  /* Dünkünün aynısı (core/dunku.js): dünün öğünü ya da antrenmanı tek
     dokunuşla bugüne. Yalnız bugün girilmemiş olan önerilir. */
  function dunkuEntry(){
    if(!SP.Dunku) return null;
    const a = SP.Dunku.adaylar(U.todayISO());
    if(!a.ogunler.length && !a.antrenmanlar.length) return null;
    return K.Entry({ label:yz('spi.today.dunkunun-aynisi'), meta:U.fmtShort(a.dun), wide:true,
      note:yz('spi.today.aynisini-yaptiysan-tek-dokun'),
      body:html`${map(a.ogunler, o => html`<div class="row between wrap gap-6 mt-4">
          <span class="small"><b>${o.ad}</b> <span class="tiny dim">${o.ozet}</span></span>
          ${K.Button({ label:yz('spi.today.bugune-ekle'), size:'sm', act:'dunku-ogun', data:{ 'data-id':o.id } })}</div>`)}
        ${map(a.antrenmanlar, w => html`<div class="row between wrap gap-6 mt-4">
          <span class="small"><b>${w.ad}</b> <span class="tiny dim">${w.dk} dk</span></span>
          ${K.Button({ label:yz('spi.today.bugune-ekle'), size:'sm', act:'dunku-antrenman', data:{ 'data-id':w.id } })}</div>`)}` });
  }

  /* Seri satiri her sekmede ustte: «Bugün hastayım» ve «Tatil modu» aranmaz. */
  function seriRow(){
    if(!SP.Seri) return null;
    return K.Entry({ label:yz('spi.today.seri'), hint:'streak', meta:SP.Calc.streak() + ' gün', wide:true,
      body:seriKontrol() });
  }

  /* Seri dondurma ve tatil modu (brand/ortak/seri.js): hasta gün ve tatil
     seriyi bozmaz; tatildeyken HKM soru sormaz. */
  /* Yıllık tatil sınırı kullanıcının ayarıdır (kullanıcı kararı 2026-09-24;
     brand/ortak/seri.js). Düşürmek var olan tatili silmez. */
  function TatilSiniri(){
    const sinir = SP.Seri.yillikTatil(), kalan = SP.Seri.kalanTatil();
    return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny dim">${yz('spi.today.yillik-tatil-siniri-bu-yil')} ${kalan} / ${sinir} ${yz('spi.today.gun')}</span>
      ${K.Input({ id:'seri-tatil-sinir', type:'number', size:'sm', numeric:true, value:sinir,
        aria:yz('spi.today.yillik-tatil-siniri-gun') })}
      ${K.Button({ label:yz('spi.today.siniri-kaydet'), size:'sm', act:'seri-tatil-sinir' })}</div>`;
  }

  function seriKontrol(){
    if(!SP.Seri) return '';
    const bugun = U.todayISO();
    const t = SP.Seri.aktifTatil(bugun);
    const k = SP.Seri.kayitOf(bugun);
    if(t) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">${yz('spi.today.tatil-modu')} ${U.fmtShort(t.bas)} – ${U.fmtShort(t.bit)} ${yz('spi.today.seri-korunuyor-hkm-soru')}</span>
      ${K.Button({ label:yz('spi.today.tatili-bitir'), size:'sm', act:'seri-tatil-bitir' })}</div>`;
    if(k) return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">${yz('spi.today.bugun-dondurulmus')}${LIFEOS.Seri.NEDEN[k.neden].toLocaleLowerCase('tr')}${yz('spi.today.seri-bozulmaz')}</span>
      ${K.Button({ label:yz('spi.today.geri-al'), size:'sm', act:'seri-coz', data:{ 'data-id':k.id } })}</div>`;
    if(S.ui.tatilSec) return html`<div class="row wrap gap-6 mt-6">
      <span class="tiny">${yz('spi.today.kac-gun')}</span>
      ${map([3, 7, 14], n => K.Button({ label:n + ' gün', size:'sm', act:'seri-tatil-gun', data:{ 'data-gun':String(n) } }))}
      ${K.Button({ label:yz('spi.today.vazgec'), size:'sm', act:'seri-tatil-vazgec' })}</div>
      ${TatilSiniri()}`;
    return html`${kotuGunSatiri()}<div class="row wrap gap-6 mt-6">
      ${when(SP.KotuGun && !SP.KotuGun.aktif(bugun), () => K.Button({ label:yz('spi.today.kotu-gun'), size:'sm', act:'kotu-gun' }))}
      ${K.Button({ label:yz('spi.today.bugun-hastayim-seri-donsun'), size:'sm', act:'seri-hasta' })}
      ${K.Button({ label:yz('spi.today.tatil-modu-2'), size:'sm', act:'seri-tatil' })}</div>`;
  }

  /* Kötü gün modu (core/kotugun.js): açıksa günün ölçüsü asgari gündür. */
  function kotuGunSatiri(){
    if(!SP.KotuGun || !SP.KotuGun.aktif(U.todayISO())) return '';
    const m = SP.Calc.minimumDay();
    return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny">${yz('spi.today.kotu-gun-modu-antrenman-hafi')}${m.done}/${m.total}${m.complete ? ', tamam' : ' · kalan: ' + m.rows.filter(r => !r.ok)
          .map(r => ({ protein:'protein', water:'su', move:'yürüyüş', sleep:'uyku' })[r.id] || r.id).join(', ')})</span>
      ${K.Button({ label:yz('spi.today.normal-gune-don'), size:'sm', act:'kotu-gun-kapat' })}</div>`;
  }

  function readinessEntry(){
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    if(!r.ok){
      return K.Entry({
        label:yz('spi.today.toparlanma'), hint:'readiness', meta:'ölçüm bekliyor',
        note:r.note,
        action:K.Button({ label:yz('spi.today.veri-gir'),
          act:'day-tab', data:{ 'data-tab':'giris' } }),
        body:P.empty(yz('spi.today.bugunun-olcumu-girilmedi')),
      });
    }
    return K.Entry({
      label:yz('spi.today.toparlanma'), hint:'readiness',
      meta:r.band.label,
      note:r.missing.length
        ? yz('spi.today.girilmeyen') + r.missing.join(', ') + ' — ağırlığı kalanlara dağıtıldı.'
        : null,
      action:K.Button({ label:yz('spi.today.hareketi-ac'), act:'go', data:{ 'data-route':'move' } }),
      body:html`
        <div class="row wrap" style="gap:26px">
          ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:126,
            bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
          <div class="grow" style="min-width:210px">${map(r.parts, p => html`
            <div class="${p.score == null ? 'readypart readypart--off' : 'readypart'}">
              <span class="readypart__label">${p.label}</span>
              <span class="small dim">${p.score == null ? 'girilmedi' : U.fmtNum(U.round(p.value, 1))}</span>
              <span class="readypart__score num">${p.score == null ? '—' : Math.round(p.score)}</span>
            </div>`)}</div>
        </div>
        ${K.Notice({ tone:r.band.tone === 'ok' ? 'ok' : r.band.tone, body:r.band.order })}`,
    });
  }

  function nutritionEntry(){
    const d = U.todayISO();
    const t = SP.Nutri.dayTotals(d);
    const tg = SP.Nutri.targets();

    if(!tg.ok){
      return K.Entry({
        label:yz('spi.today.beslenme'), meta:'hedef yok',
        note:yz('spi.today.profilde') + tg.missing.join(', ') + ' eksik. Bu üçü olmadan kalori ve '
          + 'protein hedefi tahmin edilmez.',
        action:K.Button({ label:yz('spi.today.profili-tamamla'),
          act:'go', data:{ 'data-route':'family' } }),
        body:P.empty(yz('spi.today.hedef-hesaplanamiyor')),
      });
    }
    if(t.empty){
      return K.Entry({
        label:yz('spi.today.beslenme'), meta:'hedef ' + U.fmtNum(tg.kcal) + ' kcal',
        action:K.Button({ label:yz('spi.today.ogun-ekle'),
          act:'go', data:{ 'data-route':'meals' } }),
        body:P.empty(yz('spi.today.bugun-hic-ogun-girilmedi')),
      });
    }
    return K.Entry({
      label:yz('spi.today.beslenme'),
      meta:t.meals + ' öğün · ' + Math.round(t.kcal) + ' / ' + tg.kcal + ' kcal',
      action:K.Button({ label:yz('spi.today.ogunleri-ac'), act:'go', data:{ 'data-route':'meals' } }),
      body:html`
        ${raw(UI.macroSplit({ protein:t.protein * 4, fat:t.fat * 9, carb:t.carb * 4 }))}
        <div class="nutgrid">
          ${P.nutCell({ label:yz('spi.today.protein'), got:t.protein, target:tg.protein.min, unit:'g' })}
          ${P.nutCell({ label:yz('spi.today.lif'), got:t.fiber, target:tg.fiber, unit:'g' })}
          ${P.nutCell({ label:yz('spi.today.yag'), got:t.fat, target:tg.fat.min, unit:'g' })}
        </div>
        ${map(t.notes.slice(0, 1), P.absorbNote)}`,
    });
  }

  /* HEDEFLERİM (core/hedefler.js + brand/ortak/hedef.js + core/plan.js).
     Hedef Danışma sohbetinde kurulur; burada görünür, planı kurulur,
     askıya alınır, bırakılır. Karar etiketiyle yazılır: dayanağı
     bağlanmamış eşiğin kararı «tahmin»dir.

     PLAN BÜYÜK AKSİYONDUR (AGENTS.md §1.9): önce ayrıntılı önizleme,
     sonra «Planı uygula» — önizleme onayın kendisidir — ve her zaman
     «Planı geri al». Önizleme açıkken hiçbir şey yazılmamıştır. */
  const BANT = { gercekci:'gerçekçi', zorlayici:'zorlayıcı',
    gercekci_degil:'bu sürede gerçekçi değil', guvensiz:'güvenli değil' };
  const KARAR_AD = { onay:yz('spi.today.king-onayladi'), kismi:yz('spi.today.king-kismen-onayladi'), ret:yz('spi.today.king-reddetti') };
  const EMIR_DURUM = { onaylandi:'sırada', kismen_onay:'sırada', basladi:yz('spi.today.bam-calisiyor'),
    bekliyor:'bekliyor (model ya da bütçe)', bitti:'bitti', kismen:'kısmen bitti',
    reddedildi:'reddedildi', iptal:'iptal edildi', hata:'hata verdi' };
  function kg(x){ return String(Math.round(x * 10) / 10).replace('.', ',') + ' kg'; }

  function durumDugmeleri(h){
    return html`
      ${h.durum === 'aktif'
        ? K.Button({ label:yz('spi.today.askiya-al'), size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'askida' } })
        : K.Button({ label:yz('spi.today.surdur'), size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'aktif' } })}
      ${K.Button({ label:yz('spi.today.tamamlandi'), size:'sm', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'tamam' } })}
      ${K.Button({ label:yz('spi.today.birak'), size:'sm', tone:'ghost', act:'hedef-durum', data:{ 'data-id':h.id, 'data-durum':'birakildi' } })}`;
  }

  function planOnizleme(h){
    const r = SP.Plan.kur(h, U.todayISO());
    if(!r.ok){
      return html`<div class="mt-8">${K.Notice({ tone:'warn', title:yz('spi.today.plan-kurulamadi'), body:r.why })}
        <div class="row gap-8 mt-8">${K.Button({ label:yz('spi.today.kapat'), size:'sm', act:'hedef-plan-kapat' })}</div></div>`;
    }
    const pl = r.plan;
    const satirlar = SP.Plan.onizleme(pl);
    const notlar = [].concat(pl.enerjiNeden ? [pl.enerjiNeden] : [], pl.hekim.notlar, pl.uyarilar);
    return html`<div class="mt-8">
      <p class="tiny dim"><b>${yz('spi.today.plan-onizlemesi')}</b> ${yz('spi.today.onaylanana-kadar-hicbir-sey')}</p>
      ${K.Table({ tight:true, headers:['', 'Şimdi', yz('spi.today.plandan-sonra')],
        rows:satirlar.map(x => [x.alan, x.once, x.sonra]) })}
      ${when(notlar.length, () => html`<div class="stack-sm mt-8">${map(notlar, n =>
        K.Notice({ tone:'info', body:n }))}</div>`)}
      <p class="tiny dim mt-8">${yz('spi.today.enerji-ve-tempo-tahmindir-1')}</p>
      <div class="row gap-8 mt-8" style="flex-wrap:wrap">
        ${K.Button({ label:yz('spi.today.plani-uygula'), size:'sm', tone:'primary', act:'hedef-plan-uygula',
          data:{ 'data-id':h.id } })}
        ${K.Button({ label:yz('spi.today.simdilik-degil'), size:'sm', act:'hedef-plan-kapat' })}
      </div></div>`;
  }

  /* UYARLAMA DÖNGÜSÜ (brand/ortak/hedef.js `uyarla`). Plan kontrolde geride
     kalınca hedef BUGÜNÜN verisiyle yeniden değerlendirilir; yetişmiyorsa
     seçenekler sunulur. Seçim yapana kadar hiçbir şey değişmez; seçince eski
     plan geri alınır, hedef güncellenir ve yeni plan yine önizleme ve
     onaydan geçer (büyük aksiyon). */
  function uyarlamaKutusu(h){
    const H = window.LIFEOS.Hedef;
    const u = H.uyarla(h, SP.Hedefler.PAKETLER.find(x => x.id === h.paket), {}, U.todayISO());
    return html`<div class="mt-8">
      <p class="tiny dim"><b>${yz('spi.today.bugunun-verisiyle-yeniden-he')}</b> ${yz('spi.today.secim-yapana-kadar-hicbir')}</p>
      <p class="small">${u.metin}</p>
      ${u.senaryolar.length ? html`<div class="row gap-8 mt-8" style="flex-wrap:wrap">${map(u.senaryolar, (x, i) =>
        K.Button({ label:x.ad + ' · ' + H.tarihYaz(x.son_tarih), size:'sm', act:'hedef-uyarla-sec',
          data:{ 'data-id':h.id, 'data-i':String(i) } }))}</div>
        <p class="tiny dim mt-8">${yz('spi.today.secince-eski-plan-geri-alini')}</p>`
        : K.Notice({ tone:'info', body:yz('spi.today.bu-tarihe-hala-yetisilebilir') })}
      <div class="row gap-8 mt-8">${K.Button({ label:yz('spi.today.kapat'), size:'sm', act:'hedef-uyarla-kapat' })}</div>
    </div>`;
  }

  function planOzeti(h, pl){
    const il = SP.Plan.ilerleme(pl, U.todayISO());
    const hafta = SP.Plan.buHafta(pl, U.todayISO());
    const e = pl.emir;
    const bas = yz('spi.today.plan-uygulandi') + pl.hafta + ' hafta, haftada ' + String(pl.tempo).replace('.', ',')
      + ' kg' + (pl.enerji ? ' · ' + Number(pl.enerji.kcal).toLocaleString('tr-TR') + ' kcal (tahmin)' : '')
      + (pl.protein ? ' · protein ' + pl.protein.min + '–' + pl.protein.max + ' g' : '');
    return html`<div class="stack-sm mt-8">
      <p class="small">${bas}</p>
      ${when(il.sonraki, () => html`<p class="tiny">${yz('spi.today.sonraki-kontrol')} <b>${U.fmtDate(il.sonraki.tarih)}</b>
        (${pl.tartiGunu.ad}, ${pl.tartiGunu.not}${yz('spi.today.beklenen')} ${kg(il.sonraki.beklenen)}</p>`)}
      ${K.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      ${S.ui.uyarla === h.id ? uyarlamaKutusu(h) : when(il.durum === 'geride', () => K.Button({
        label:yz('spi.today.yeniden-hesapla'), size:'sm', tone:'primary', act:'hedef-uyarla-ac', data:{ 'data-id':h.id } }))}
      ${when(pl.enerjiNeden, () => html`<p class="tiny dim">${pl.enerjiNeden}</p>`)}
      ${when(pl.hekim.talimatlar.length, () => html`<p class="tiny dim">${pl.hekim.talimatlar.length}
        ${yz('spi.today.hekim-talimatina-uyuluyor')}${pl.hekim.notlar.length ? ' ' + pl.hekim.notlar.join(' ') : ''}</p>`)}
      ${when(hafta, () => html`<div><p class="tiny"><b>${yz('spi.today.bu-hafta')}${hafta.no}${yz('spi.today.hafta')}</b> ${yz('spi.today.planlama-ofisi-programi-suru')} ${pl.program.surum}</p>
        <ul class="tiny dim" style="margin:4px 0 0 18px">${map(hafta.gorevler, g => html`<li>${g.metin}</li>`)}</ul></div>`)}
      ${when(e, () => html`<p class="tiny dim">${yz('spi.today.i-s-emri')}${e.id}: ${KARAR_AD[e.karar] || e.karar}${e.durum
        && EMIR_DURUM[e.durum] ? ' · ' + EMIR_DURUM[e.durum] : ''}${e.tahmin && e.tahmin.metin
        && e.durum !== 'bitti' ? ' · tahmini süre ' + e.tahmin.metin + ' (tahmin)' : ''}</p>`)}
      <div class="row gap-8" style="flex-wrap:wrap">
        ${K.Button({ label:yz('spi.today.plani-geri-al'), size:'sm', act:'hedef-plan-geri', data:{ 'data-id':h.id } })}
        ${when(!e || e.karar === 'ret', () => K.Button({ label:yz('spi.today.king-e-ilet'), size:'sm',
          act:'hedef-plan-king', data:{ 'data-id':h.id } }))}
        ${durumDugmeleri(h)}
      </div></div>`;
  }

  /* ALIŞKANLIK (brand/ortak/aliskanlik.js): planı yoktur; ilerleme doğrudan
     KAYITTAN sayılır. «Kayıt yok» «yapılmadı» demek değildir. */
  function aliskanlikOzeti(h){
    const il = SP.Hedefler.ALISKANLIK.ilerleme(h, SP.U.todayISO());
    return html`<div class="stack-sm mt-8">
      ${K.Notice({ tone:il.durum === 'geride' ? 'warn' : 'info', body:il.metin })}
      <div class="row gap-8" style="flex-wrap:wrap">${durumDugmeleri(h)}</div></div>`;
  }

  function hedefSatir(h){
    const g = h.gerceklik || {};
    const H = window.LIFEOS.Hedef;
    const pl = SP.Plan ? SP.Plan.aktif(h.id) : null;
    const onizle = !pl && S.ui.planOnizle === h.id && h.durum === 'aktif';
    return html`<div>
      <div><b class="small">${SP.Hedefler.ozet(h)}</b>
        <div class="tiny dim">${h.durum === 'askida' ? 'askıda · ' : ''}${h.son_tarih
          ? 'son tarih ' + H.tarihYaz(h.son_tarih) : 'tarihsiz'}${g.bant ? ' · ' + BANT[g.bant]
          + ' (' + (g.etiket === 'hesaplandi' ? 'hesaplandı' : 'tahmin') + ')' : ''}</div></div>
      ${h.paket === 'aliskanlik' && SP.Hedefler.ALISKANLIK ? aliskanlikOzeti(h)
        : pl ? planOzeti(h, pl) : onizle ? planOnizleme(h) : html`
        <div class="row gap-8 mt-6" style="flex-wrap:wrap">
          ${when(SP.Plan && h.durum === 'aktif' && h.paket === 'kilo', () => K.Button({ label:yz('spi.today.plani-gor'),
            size:'sm', tone:'primary', act:'hedef-plan-onizle', data:{ 'data-id':h.id } }))}
          ${durumDugmeleri(h)}
        </div>`}
    </div>`;
  }
  /* Zaman bütçesi (HKM core/hedefag.py): cümleyi HKM'nin kodu kurar;
     burası yalnız gösterir. HKM kapalıysa satır hiç çizilmez. */
  function butceSatiri(){
    const b = SP.Hedefler.ag ? SP.Hedefler.ag.butce() : null;
    if(!b || !b.metin) return '';
    return K.Notice({ tone:{ sigar:'info', sikisik:'warn', sigmaz:'warn' }[b.bant] || 'info', title:yz('spi.today.zaman-butcesi-king'), body:b.metin });
  }

  function hedefEntry(){
    if(!SP.Hedefler) return null;
    const l = SP.Hedefler.aktifler();
    return K.Entry({
      label:yz('spi.today.hedeflerim'), meta:l.length ? l.length + ' etkin' : 'yok',
      action:K.Button({ label:yz('spi.today.danisma-da-hedef-koy'), act:'go', data:{ 'data-route':'team' } }),
      body:l.length ? html`<div class="stack-sm">${raw((window.LIFEOS && window.LIFEOS.PANO) ? window.LIFEOS.PANO.hedefIzgara(l, U.todayISO()) : '')}${butceSatiri()}${map(l, hedefSatir)}</div>`
        : K.Ayrinti({ ozet:yz('spi.today.henuz-hedefin-yok-danisma-da'),
          etiket:yz('spi.today.ornekler'),
          govde:html`<p>${yz('spi.today.3-ay-icinde-3-kilo')}</p>` }),
    });
  }

  /* KING BİLDİRİMLERİ (HKM core/king.py). İş emrinin yolu: onaylandı,
     başladı, bitti, reddedildi… HKM kapalıysa hiç gelmez ve kart çizilmez;
     «Okundu» bildirimi merkezde silmez, yalnız işaretler. */
  const BILDIRIM_TON = { reddedildi:'warn', hata:'warn', bekliyor:'warn', kismen_onay:'warn' };
  function kingBildirimRow(){
    const l = S.ui.hkmBildirim || [];
    if(!l.length) return '';
    return K.Entry({ label:yz('spi.today.king-bildirimi'), hint:'hkm', meta:l.length + ' yeni', wide:true,
      body:html`${map(l.slice(0, 5), b => html`<div class="mt-8">
        ${K.Notice({ tone:BILDIRIM_TON[b.tur] || 'info', body:b.metin })}
        <div class="row gap-8 mt-6">${K.Button({ label:yz('spi.today.okundu'), size:'sm',
          act:'king-bildirim-okundu', data:{ 'data-id':String(b.id) } })}</div></div>`)}
        ${when(l.length > 5, () => html`<p class="tiny dim mt-8">${l.length - 5} ${yz('spi.today.bildirim-daha-hkm')}</p>`)}` });
  }

  function officeEntry(){
    const d = U.todayISO();
    const b = S.officeBriefings[d];
    const notes = SP.Office.notes().slice(0, 3);
    return K.Entry({
      label:yz('spi.today.ofisten'), hint:'office',
      meta:'beş ajan · günün notu',
      action:html`${K.Button({ label:yz('spi.today.ofisi-ac'), act:'go', data:{ 'data-route':'office' } })}
        ${K.Button({ label:yz('spi.today.tazele'), act:'refresh-briefing' })}`,
      body:html`
        ${when(b, () => html`<p class="small">${b.text}</p>`)}
        ${when(!b, () => html`<p class="small dim">${yz('spi.today.gunun-brifingi-henuz-uretilm')}</p>`)}
        ${when(notes.length, () => html`<div class="notes">${map(notes, n => html`
          <div class="note note--${n.tone}">
            ${P.avatar(n.agent, 'sm')}
            <div><b class="tiny">${n.name}</b> <span class="small">${n.text}</span></div>
          </div>`)}</div>`)}`,
    });
  }

  function moneyEntry(){
    const m = SP.Money.status();
    return K.Entry({
      label:yz('spi.today.butce'), hint:'budget-rank',
      meta:m.tone === 'ok' ? 'uyumlu' : m.tone === 'muted' ? 'boş' : 'gözden geçir',
      action:K.Button({ label:yz('spi.today.finansi-ac'), act:'go', data:{ 'data-route':'basket' } }),
      body:html`<p class="small">${m.text}</p>
        ${when(m.basket.limit != null && m.basket.rows.length,
          () => K.Meter({ label:yz('spi.today.haftalik-sinir'), value:Math.min(100, m.basket.pct || 0),
            text:U.fmtNum(Math.round(m.basket.total)) + ' / ' + U.fmtNum(m.basket.limit) + ' TL',
            tone:m.basket.over ? 'danger' : '' }))}`,
    });
  }

  /* Denetim sorusu — AYRI EKRAN DEĞİL, Bugün akışının içinde tek kart.

     Nöbetçi (core/goodhart.js) ve sürtünme ölçer (core/friction.js) arka
     planda çalışır; buraya yalnızca sıradaki TEK soru düşer. Soru yoksa
     kart hiç çizilmez — sistemin sormadığı gün, iyi gündür. */
  function signalEntry(){
    if(!SP.Signals) return null;
    const sig = SP.Signals.current();
    if(!sig) return null;
    if(!sig.seenAt) SP.Signals.markSeen(sig.id);

    return K.Entry({
      label:yz('spi.today.bir-soru'), hint:'signal',
      meta:sig.kind === 'friction' ? 'sürtünme' : 'gösterge',
      note:sig.title,
      body:html`
        ${K.Notice({ tone:'info', body:sig.question })}
        ${when(sig.answeredAt, () => html`
          <p class="small muted mt-8">${yz('spi.today.cevabin')} ${sig.answer}</p>
          <p class="tiny dim">${yz('spi.today.soru-acik-kalir-ayrismanin-g')}</p>`)}
        ${when(!sig.answeredAt, () => html`
          <div class="mt-8">
            ${K.Field({ label:yz('spi.today.kisa-cevabin-istege-bagli'),
              input:K.Input({ id:'sig-answer', placeholder:yz('spi.today.tek-cumle-yeter') }) })}
            <div class="row wrap mt-8">
              ${K.Button({ label:yz('spi.today.cevabi-kaydet'), size:'sm',
                act:'signal-answer', data:{ 'data-id':sig.id } })}
              ${K.Button({ label:yz('spi.today.bu-soru-bana-uymuyor'), size:'sm',
                act:'signal-dismiss', data:{ 'data-id':sig.id } })}
            </div>
          </div>`)}`,
    });
  }

  /* King ve HKM teklifleri, Danışma'nın bekleyen kayıtları Onaylar'da
     (screens/onaylar.js). Bugün yalnız en öndeki kartı gösterir. */

  /* ---------- HKM seridi: KUCUK ve HER GUN ORADA

     HKM ayarlari bir ayar ekraninin icinde duruyordu: gunde bir bakilan
     bir yerde, gun boyu acik duran bir baglantinin durumu. Bagli mi
     degil mi, en son ne zaman gitti — bunlar gunluk ekranda TEK SATIR
     olmali.

     Serit bir AYAR EKRANI DEGILDIR: durumu soyler ve tek bir is
     yaptirir. Ayarin yeri yine kendi ekranidir; iki yerde iki ayar
     olsaydi biri otekini sessizce yenerdi. */
  function saat(iso){
    if(!iso) return null;
    const d = new Date(iso);
    if(isNaN(d.getTime())) return null;
    return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes());
  }

  function hkmSeritRow(){
    if(!SP.Beacon) return '';
    const a = SP.Beacon.settings();

    if(!a.enabled){
      return K.Entry({ label:yz('spi.today.hkm'), hint:'hkm', meta:'bağlı değil',
        wide:true, body:html`<p class="tiny dim">Hayat Kontrol
          Merkezi'ne günün özetini göndermek istersen ayarlardan
          açabilirsin. SPİ bundan bağımsız çalışır: HKM kapalıyken
          hiçbir şey eksilmez.</p>` });
    }

    const gitti = saat(a.lastOkAt);
    const denendi = saat(a.lastAt);
    /* Basarisiz son deneme YUTULMAZ: «gonderildi» ile «gonderilmeye
       calisildi» ayri seylerdir. */
    const bozuk = a.lastStatus !== null && a.lastStatus !== undefined
      && a.lastStatus !== 202;

    return K.Entry({ label:yz('spi.today.hkm'), hint:'hkm', wide:true,
      meta:bozuk ? ('son deneme ' + (denendi || '—') + ' · başarısız')
        : (gitti ? ('son gönderim ' + gitti) : 'henüz gönderilmedi'),
      body:html`
        ${when(bozuk, () => K.Notice({ tone:'warn',
          body:(a.lastNote || 'Gönderilemedi.') + ' SPİ bundan etkilenmez; '
             + 'veri burada duruyor ve bir sonraki denemede gider.' }))}
        <div class="row gap-8 mt-8">
          ${K.Button({ label:yz('spi.today.simdi-gonder'), size:'sm', act:'hkm-gonder' })}
        </div>
        <p class="tiny dim mt-8">Giden şey günün ÖZETİDİR: etiketli
          ölçümler. Ham kayıt SPİ'de kalır.</p>` });
  }

  /* YEDEK UYARISI — GÜNLÜK EKRANDA, rehberin içinde değil.

     Uyarı daha önce yalnız Rehber → «Veri ve yedek» sekmesindeki bir
     rozette duruyordu: yedek almayı unutan birinin GİTMEDİĞİ sayfada.
     Eşik de otuz gündü. İkisi birleşince hatırlatma, kaybı önleyecek
     olan şey değil kaybın yanında duran bir not oluyordu.

     Kural ortak (`brand/ortak/yedek.js`): yedi gün, ve korunacak veri
     yokken hiç çıkmaz — ilk gün açan kullanıcıyı boş bir dosya
     indirmeye çağırmaz. */
  function yedekUyarisi(){
    if(!M.backupDue()) return '';
    const yas = M.backupAgeDays();
    return html`<div class="mb-16">${K.Notice({ tone:'info', title:'Yedekleme.',
      body:html`${yas === null ? yz('spi.today.henuz-hic-yedek-almadin')
        : yz('spi.today.son-yedegin') + yas + ' gün önce alındı.'} ${yz('spi.today.tarayici-verisi-silinirse-ta')}
        ${K.Button({ label:yz('spi.today.yedek-al'), size:'sm', act:'go',
          data:{ 'data-route':'guide' } })}` })}</div>`;
  }

  /* BUGÜN — üç blok (KOLAY-PLANI Faz 2; ayrıntısı render() üstünde):
     Şimdi (kapak) · Ne yaptın? · Gün. Durum ve Öneri Analiz'in başında.

     Geri kalan her kart «Bugün › Ayrıntı»dadır (renderAyrinti): bütün
     alanlarıyla ölçüm formu, şikâyetler, seri, HKM şeridi, özet ve geçmiş.
     Hiçbiri kalkmadı; yalnız yeri değişti. Sadelik bütçesi: sayfa boyu
     1800 px, görünen düğme 14, dolu düğme 1. */
  const AGIRLIK = { danger:3, warn:2, info:1 };
  /* Uyarılar en acilden: ilki Bugün'de, gerisi Ayrıntı'da. */
  function uyarilar(){
    const out = M.openFlags().map(f => ({ tone:'danger', kart:P.flagCard(f) }));
    const y = yedekUyarisi();
    /* Yedek hatırlatması SAKİNDİR: Bugün'de durmaz, Ayrıntı'da durur
       (kullanıcı, 2026-10-01: «yedekleme yazısını sil»). */
    if(y) out.push({ tone:'info', sakin:true, kart:y });
    return out.sort((a, b) => (AGIRLIK[b.tone] || 0) - (AGIRLIK[a.tone] || 0));
  }
  function bugunUyarisi(l){ return (l || uyarilar()).find(u => !u.sakin) || null; }

  /* Sık yazılan dört ölçüm. Kaydetmek yalnız burada yazılanı değiştirir:
     `save-vitals` ekranda olmayan alana dokunmaz. */
  const HIZLI_ALAN = ['sleep', 'rhr', 'hrv', 'weight'];

  /* d gününden ÖNCEKİ son ölçüm; hiç yoksa null (uydurulmaz). */
  function sonDeger(alan, d){
    const t = Object.keys(S.vitals || {}).filter(x => x < d && S.vitals[x] && S.vitals[x][alan] != null).sort().pop();
    return t ? Number(S.vitals[t][alan]) : null;
  }

  function OlcumKutusu(){
    const d = shownDate();
    const v = M.vitalsOf(d) || M.defaultVitals(d);
    const alanlar = FIELDS.filter(f => HIZLI_ALAN.indexOf(f.id) >= 0);
    return K.Kutu({ ad:yz('spi.today.gunun-olcumu'), class:'kahraman',
      yuva:raw(SP.h.esc((d === U.todayISO() ? 'bugün' : U.fmtDate(d)) + ' · ' + alanlar.filter(f => v[f.id] != null).length + '/' + alanlar.length) + OdakRozeti(d)),
      /* SADE (kullanıcı, 2026-10-02: «SPİ'de AYS kadar sade olmayan, göz
         yoran şeyler var»): Bugün'ün dört alanı simgesiz, yalnız etiket —
         renkli simgeler «Günü düzenle»nin tam formunda durur. «Boş alan
         sıfır sayılmaz» cümlesi ekranın ⓘ kartında (lede). */
      /* SON DEĞER YER TUTUCU (2026-10-25; kullanıcı: «spi için daha
         işlevli veri girişi, sürtünmeyi azaltacak teknikler ile daha güzel
         yap»): boş alanda gösterilen günden önceki son ölçüm gri yazar
         («son: 78,2»). Yalnız ipucudur: alanın değeri boş kalır, Kaydet
         onu yazmaz (save-vitals yalnız değişen alanı yazar). */
      govde:html`<div class="grid-form">${map(alanlar, f => {
          const son = v[f.id] == null ? sonDeger(f.id, d) : null;
          return K.Field({
            label:f.label,
            input:K.Input({ id:'v-' + f.id, type:'number', numeric:true, step:f.step,
              min:f.min, max:f.max, value:v[f.id] == null ? '' : v[f.id],
              placeholder:son == null ? null : 'son: ' + U.fmtNum(son) }),
          });
        })}</div>
        ${KestirmeSatiri(d, false)}
        <div id="suphe-yuva" aria-live="polite"></div>
        <div class="row wrap gap-8 mt-8">
          ${K.Button({ label:yz('spi.today.kaydet'), tone:'primary', act:'save-vitals' })}
          ${K.Button({ label:yz('spi.today.butun-alanlar'), tone:'ghost', act:'day-tab', data:{ 'data-tab':'giris' } })}
        </div>` });
  }

  /* KISA UYKULAR (core/uyku.js): gece uykusundan ayrı, birden çok.
     Bugün'ün düğme bütçesi (14, bugun.test) aşılmasın diye Bugün'de satır
     yalnız girilmiş kısa uyku varsa çizilir; ekleme «Ne yaptın?»
     kutusundan («öğlen 30 dk uyudum») ya da «Bütün alanlar»dan. */
  /* Toparlanma hesaplanamayan günün başlığı. Hareket ya da öğün girilmiş
     günü «veri girilmedi» diye yazmak yanlıştı (70 dk yürüyüş girilmişti). */
  function bosBaslik(d){
    const v = M.vitalsOf(d);
    const var_ = M.workoutsOf(d).length || M.mealsOf(d).length
      || (v && ['water', 'weight', 'rhr', 'hrv', 'soreness'].some(k => v[k] != null));
    return var_ ? yz('spi.today.uyku-girilince-toparlanma-he') : yz('spi.today.bugunun-verisi-henuz-girilme');
  }

  function KestirmeSatiri(d, ekle){
    if(!SP.Uyku) return '';
    const g = SP.Uyku.gun(d);
    if(!ekle && !g.kestirme.length) return '';
    return html`<div class="kestirme" aria-label="Kısa uykular">
      <span class="kestirme__ad">${yz('spi.today.kisa-uyku')}</span>
      ${g.kestirme.length ? map(g.kestirme, k => html`<span class="kestirme__oge">${k.bas ? k.bas + ' · ' : ''}${k.dk} dk
        <button type="button" class="kestirme__sil" data-act="kestirme-sil" data-id="${k.id}" aria-label="${k.dk} dakikalık kısa uykuyu sil">×</button></span>`)
        : html`<span class="tiny muted">girilmedi</span>`}
      ${when(ekle, () => K.Button({ label:yz('spi.today.ekle'), icon:'plus', size:'sm', tone:'ghost', act:'kestirme-ac' }))}
      ${when(g.toplamDk != null && g.kestirme.length, () => html`<span class="tiny muted">${yz('spi.today.gunun-toplami')} ${SP.Uyku.sureYaz(g.toplamDk)} ${yz('spi.today.hesaplandi')}</span>`)}
    </div>`;
  }
  function kestirmeSheet(hata){
    UI.sheet({ title:yz('spi.today.kisa-uyku'), subtitle:yz('spi.today.gece-uykusuna-eklenmez-ayri'),
      body:String(html`<div class="grid-form">
        ${K.Field({ label:yz('spi.today.sure-dakika'), input:K.Input({ id:'kz-dk', type:'number', numeric:true, min:1, max:240, placeholder:'30' }) })}
        ${K.Field({ label:yz('spi.today.baslangic'), hint:'isteğe bağlı', input:K.Input({ id:'kz-bas', type:'time' }) })}
      </div>${when(hata, () => html`<p class="small" role="alert">${hata}</p>`)}`),
      footer:String(html`${K.Button({ label:yz('spi.today.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.today.kaydet'), tone:'primary', act:'kestirme-kaydet' })}`) });
  }

  /* Sade Bugün (2026-10-16): öğün de «Ne yaptın?» kutusundan girilir
     («2 yumurta 1 çay»); bu kutu yalnız ortak kapı kurulmadıysa çizilir.
     Öğün ekranındaki ayrıntılı giriş yerinde. */
  function OgunKutusu(){
    return K.Kutu({ ad:yz('spi.today.ogun-ekle'),
      govde:html`<div class="quick">
          ${K.Mic({ target:'quick-meal' })}
          ${K.Input({ id:'quick-meal', placeholder:yz('spi.today.1-tabak-etli-kuru-fasulye'),
            aria:yz('spi.today.ogun-metni') })}
          ${K.Button({ label:yz('spi.today.ogune-ekle'), act:'quick-meal' })}
        </div>` });
  }

  /* ---------- D · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const vkutu = (ad, yuva, ic, o) => ic ? K.Kutu(Object.assign({ ad, yuva, class:'vkutu', govde:raw(ic) }, o || {})) : '';
  const GUN_AD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const gunAd = iso => GUN_AD[(new Date(iso + 'T12:00:00').getDay() + 6) % 7];
  const sonGunler = n => Array.from({ length:n }, (_, i) => U.iso(U.addDays(U.today(), i - n + 1)));

  /* 069 UYKU BANDI + 070 HAM + ORTALAMA: son günlerin DOKUSU. Bugün'ün üç
     alanı bugünü söyler; eğilim Bugün › Ayrıntı › Özet'te durur (sadelik:
     Bugün en çok 1 800 px, plan §1.2). Uyku: son gecenin süresi ve yedi
     gecenin dokusu. Kilo: son 14 günün tartısı; eksik gün ortalamaya girmez. */
  function egilimEntry(){
    if(!VT()) return null;
    const g = sonGunler(7).map(t => ({ ad:gunAd(t), saat:S.vitals[t] && S.vitals[t].sleep != null ? Number(S.vitals[t].sleep) : null }));
    const uyku = VT().uykuBandi({ geceler:g, sonAd:g[g.length - 1].saat != null ? 'bu gece' : 'son gece' });
    const noktalar = sonGunler(14).map(t => ({ tarih:t, deger:S.vitals[t] && S.vitals[t].weight != null ? Number(S.vitals[t].weight) : null }));
    const kilo = VT().hamOrtalama({ noktalar, birim:'kg' });
    if(!uyku && !kilo) return null;
    return K.Entry({ wide:true, label:yz('spi.today.egilim'), meta:'uyku 7 gece · kilo 14 gün',
      note:yz('spi.today.olculmemis-gun-bos-kalir-ort'),
      body:html`<div class="stack-sm">${raw(uyku || '')}${raw(kilo || '')}</div>` });
  }

  /* 073 SU — «n bardağa ayarla» (2026-10-25; kullanıcı: «spi için daha
     işlevli veri girişi, sürtünmeyi azaltacak teknikler ile daha güzel
     yap»). Önce bütün bardak sırası TEK düğmeydi (vitrin tekDokunus) ve
     her dokunuş bir bardak ekliyordu: 2 000 ml sekiz dokunuştu. Şimdi her
     bardak kendi değeridir: n'inci bardağa dokunmak günün suyunu n bardak
     yapar; en üstteki dolu bardağa yeniden dokunmak bir bardak azaltır.

     Denetim tek: bardaklardan çizilmiş bir radio grubu (role="radiogroup",
     düğme değil — Bugün'ün 14 düğme bütçesine girmez, bugun.test). Klavyede
     tek sekme durağı; oklar bir bardak artırır ya da azaltır, Boşluk/Enter
     dokunmakla aynıdır (suKlavye). Ortak tekDokunus AYS/ESP vitrin
     testlerinde de durduğu için ona dokunulmadı; çizim bu ekranda.

     Bardak ölçüsü SP.Quick.BARDAK_ML (yoksa 250 ml). Asgari günün eşiği
     2 000 ml (core/calc.js). Dokunulmamış gün null kalır; bir bardaktan
     aşağı inmek de «girilmedi»dir, 0 ml değil (state.js normVitals: günde
     0 ml su ölçüm sayılmaz). Küçük aksiyon: sormadan yazar, «Geri al».
     HATA (düzeldi): kutu todayISO()'yu okuyup yazıyordu; ölçüm ve his
     kutuları gösterilen güne yazar. Artık su da shownDate()'e. */
  const SU_ESIK = 2000, SU_EN_COK = 8000;
  function bardakMl(){
    const b = SP.Quick && Number(SP.Quick.BARDAK_ML);
    return b > 0 && isFinite(b) ? b : 250;
  }
  function suDurumu(d){
    const b = bardakMl(), v = M.vitalsOf(d);
    const ml = v && v.water != null ? Number(v.water) : null;
    const hedef = Math.ceil(SU_ESIK / b);
    const adet = ml == null ? null : Math.floor(ml / b);
    return { b, ml, hedef, adet };
  }
  /* Bir bardağa dokunmanın yazacağı ml (2026-10-25 düzeltmesi). HATA:
     yazılan hep n × bardaktı; 1 100 ml'de (adet 4) seçili bardağa dokunmak
     ya da sol ok 750 yazıyor, ölçülmüş 100 ml sessizce siliniyordu.
     Kural: niyet ±1 bardaksa (seçili bardak ya da bir alttaki = bir eksik,
     bir üstteki = bir fazla) gerçek ml'ye bir bardak eklenir/çıkarılır;
     bardağa denk gelmeyen kısım korunur. Komşu olmayan bardak açık bir
     «n bardak» seçimidir: n × bardak yazılır; etiketi o ml'yi söyler ve
     toast «Geri al» taşır, hiçbir şey sessizce gitmez. Bir bardaktan
     aşağısı null («girilmedi»), asla 0. */
  function suSonrasi(s, n){
    const { b, ml, adet } = s, a = adet || 0, simdi = ml || 0;
    const yeni = (adet >= 1 && (n === adet || n === adet - 1)) ? simdi - b
      : n === a + 1 ? simdi + b : n * b;
    return yeni < b ? null : yeni;
  }
  const BARDAK_SVG = dolu => window.LIFEOS.PIKSEL.figurSvg(dolu ? 'bardak_dolu' : 'bardak_bos');
  function SuKutusu(){
    if(!VT()) return '';
    const d = shownDate();
    const s = suDurumu(d), { b, ml, hedef, adet } = s;
    const n = adet || 0;
    /* Hedef dolunca bir bardak daha çizilir: hedefin ötesi de yazılabilsin. */
    const sayi = Math.min(Math.max(hedef, n + (n >= hedef ? 1 : 0)), Math.floor(SU_EN_COK / b));
    const gunAdi = d === U.todayISO() ? 'Bugün' : U.fmtDate(d);
    const grupAd = ml == null
      ? gunAdi + ' su girilmedi. Hedef ' + hedef + ' bardak; bir bardak ' + U.fmtNum(b) + ' ml.'
      : gunAdi + ' ' + U.fmtNum(ml) + ' ml su: ' + adet + ' / ' + hedef + ' bardak.';
    const bardaklar = [];
    for(let i = 1; i <= sayi; i++){
      const secili = adet != null && adet >= 1 && i === adet;
      const odak = secili || ((adet == null || adet < 1) && i === 1);
      /* Etiket dokunuşun yazacağını söyler; seçili bardak gerçek ml'yi (2026-10-25). */
      const sonra = secili ? ml : suSonrasi(s, i), etiketMl = sonra == null ? i * b : sonra;
      bardaklar.push('<span role="radio" class="su-bardak" data-act="su-ayarla" data-n="' + i + '" data-i="' + i + '"'
        + ' tabindex="' + (odak ? '0' : '-1') + '" aria-checked="' + (secili ? 'true' : 'false') + '"'
        + ' aria-label="' + SP.h.esc(i + ' bardak, ' + U.fmtNum(etiketMl) + ' ml' + (secili ? '; yeniden dokunursan bir bardak azalır' : '')) + '"'
        + (i <= n ? ' data-dolu="1"' : '') + ' style="display:inline-flex;cursor:pointer">' + BARDAK_SVG(i <= n) + '</span>');
    }
    const ic = '<div class="vk" data-oz="073"><div class="d x35">'
      + '<div class="bd" role="radiogroup" data-oz-su aria-label="' + SP.h.esc(grupAd) + '" style="flex-wrap:wrap">' + bardaklar.join('') + '</div>'
      + '<div class="sy">' + SP.h.esc(ml == null ? yz('spi.today.girilmedi-kac-bardak-ictiyse')
        : adet + ' / ' + hedef + ' bardak · ' + U.fmtNum(ml) + ' ml') + '</div></div></div>';
    return vkutu('Su', ml == null ? 'girilmedi' : U.fmtNum(ml) + ' ml', ic);
  }

  /* Vakti gelmiş (saati geçmiş, işaretlenmemiş) hatırlatmaları kapatır
     (core/hatirlat.js bugun + isaretle). Yön tek: ÖLÇÜM işareti kapatır;
     işaret ölçüm yazmaz (hatirlat söz 4). Yalnız bugün: hatırlatmalar
     günün saatleridir. Döner: kapatılan anahtarlar (geri al için). */
  function bugunSimdi(){
    const n = new Date(), t = U.parse(U.todayISO());
    t.setHours(n.getHours(), n.getMinutes(), 0, 0);
    return t;
  }
  async function hatirlatKapat(tur, d, tek){
    const H = SP.Hatirlat;
    if(!H || !H.bugun || !H.isaretle || d !== U.todayISO()) return [];
    let vakti = H.bugun(bugunSimdi()).filter(x => x.tur === tur && x.durum === 'vakti');
    /* Su (2026-10-25): bir artış en çok BİR işaret koyar, vakti gelmişlerin
       en sonuncusu (bugun() saate göre sıralı döner). Önce hepsi kapanıyordu:
       10:00, 13:00, 16:00 ve 17:00'de tek bardak, kullanıcının yapmadığı üç
       «yapıldı» kaydıydı (hatirlat söz 4). */
    if(tek) vakti = vakti.slice(-1);
    for(const x of vakti) await H.isaretle(x.anahtar, true, d);
    return vakti.map(x => x.anahtar);
  }
  async function hatirlatAc(anahtarlar, d){
    for(const k of anahtarlar || []) await SP.Hatirlat.isaretle(k, false, d);
  }

  /* Suyu yazar; artınca vakti gelen su hatırlatması kapanır. Geri al:
     önceki değer ve kapatılan işaretler. */
  /* Yazımın kendisi (Günü kapat da bunu kullanır): bildirim yok, geri al döner. */
  /* `src`: 'beyan' yalnız Günü kapat hedef satırından; geri al eski kaynağı da koyar. */
  async function suYazCekirdek(d, ml, src){
    const { ml:once } = suDurumu(d), srcOnce = (M.vitalsOf(d) || {}).waterSrc || null;
    const sonra = ml == null || ml <= 0 ? null : Math.min(ml, SU_EN_COK);
    await M.saveVitals(d, { water:sonra, waterSrc:src || null });
    const kapanan = sonra != null && sonra > (once || 0) ? await hatirlatKapat('su', d, true) : [];
    return { sonra, geriAl:async () => { await M.saveVitals(d, { water:once, waterSrc:srcOnce }); await hatirlatAc(kapanan, d); SP.App.render(); } };
  }
  async function suYaz(d, ml){
    const { b, hedef } = suDurumu(d);
    const r = await suYazCekirdek(d, ml), sonra = r.sonra;
    SP.App.render();
    UI.toast(sonra == null ? yz('spi.today.su-girilmedi-olarak-birakild')
      : yz('spi.today.su-3') + Math.floor(sonra / b) + ' / ' + hedef + ' bardak (' + U.fmtNum(sonra) + ' ml)',
      { undo:r.geriAl });
  }

  /* GÜNÜ KAPAT — SPİ satırları (KOLAY-PLANI Faz 1; çekirdek core/gunukapat.js).
     Depo sahibi (2026-10-25): ölçüm satırları toplu onaylanmaz, tek satırla
     yazılır. Satırlar dürüst kurulur:
       · Su (beyan): hedefin (SU_ESIK) altındaysa «Hedef: 2.000 ml», suYaz
         yolundan; hedefe ulaştıysa «kaydedildi».
       · Öğünler (beyan): boş her öğün yuvası için «her zamanki» YALNIZ son
         7 günün en az 4'ünde aynı öğünden (aynı yuva, aynı gıdalar; kalip()).
         Kalıp yoksa öneri yok: öğün uydurulmaz.
       · Hatırlatmalar (beyan, yalnız bugün): vakti gelmiş, işaretlenmemişler
         tek satır, isaretleHepsi ile. Doz ve ilaç adı görünmez.
       · Uyku, nabız, HRV, kilo (ölçüm): yazma işlevi yok; son değer yalnız
         ipucu. Her satırın boş sayı kutusu (2026-10-26) çekirdekte tek satır
         metnine çevrilir («uyku 7.5») ve tek satırla aynı yoldan yazılır
         (GIRIS, SP.Quick); boş kutu yazılmaz, kutu asla önceden dolmaz. */
  const GK_OLCUM = [
    { id:'uyku', alan:'sleep', ad:yz('spi.today.uyku'), birim:'sa', soz:'uyku' },
    { id:'nabiz', alan:'rhr', ad:yz('spi.today.i-stirahat-nabzi'), birim:'atım/dk', soz:'nabız' },
    { id:'hrv', alan:'hrv', ad:yz('spi.today.hrv'), birim:'ms', soz:'hrv' },
    { id:'kilo', alan:'weight', ad:yz('spi.today.kilo'), birim:'kg', soz:'kilo' },
  ];
  function gkOgunOzet(m){
    return m.items.map(it => {
      const f = SP.FOOD_BY_ID && SP.FOOD_BY_ID[it.foodId];
      const g = it.g != null ? it.g : (it.kg != null ? Math.round(it.kg * 1000) : null);
      return (f ? f.name : it.foodId) + (g ? ' ' + U.fmtNum(g) + ' g' : '');
    }).join(', ');
  }
  const GK_OGUN_NOTU = yz('spi.today.her-zamanki');
  const gkAnahtar = m => (m.items || []).map(it => it && it.foodId).filter(Boolean).sort().join('+');
  function gkSatirlari(gun){
    const G = window.LIFEOS && window.LIFEOS.GUNUKAPAT;
    const out = [];
    const s = suDurumu(gun);
    if(s.ml != null && s.ml >= SU_ESIK) out.push({ id:'su', ad:yz('spi.today.su'), tur:'beyan', yazildi:true, ipucu:U.fmtNum(s.ml) + ' ml' });
    /* Satır kurulduktan sonra su değiştiyse (tek satır «su 2 bardak» yazdı)
       ölçülen değer hedef tahminiyle ezilmez: satır atlanır. */
    else{
      const suOnce = (M.vitalsOf(gun) || {}).water;
      out.push({ id:'su', ad:yz('spi.today.su'), tur:'beyan', oneri:{ metin:yz('spi.today.hedef') + U.fmtNum(SU_ESIK) + ' ml', kaynak:'plan' },
        yaz:async g => {
          const simdi = (M.vitalsOf(g) || {}).water;
          if(g !== gun || (simdi == null ? null : Number(simdi)) !== (suOnce == null ? null : Number(suOnce))) return { atlandi:true };
          const r = await suYazCekirdek(g, SU_ESIK, 'beyan'); return { metin:yz('spi.today.su-2') + U.fmtNum(SU_ESIK) + ' ml', geriAl:r.geriAl }; } });
    }

    const bugunkuler = M.mealsOf(gun).filter(m => m.items.length);
    (SP.Ogun ? SP.Ogun.liste() : []).forEach(sl => {
      const id = 'ogun-' + sl.id;
      const var_ = bugunkuler.filter(m => m.slot === sl.id);
      if(var_.length){ out.push({ id, ad:sl.label, tur:'beyan', yazildi:true, ipucu:var_.map(gkOgunOzet).join(' · ') }); return; }
      const kayit = [], son = {};
      for(let i = 1; i <= 7; i++){
        const d = U.iso(U.addDays(U.parse(gun), -i));
        /* Günü kapat'ın kendi yazdığı öğün kalıbı beslemez (kendini doğrulardı). */
        M.mealsOf(d).filter(m => m.slot === sl.id && m.items.length && m.note !== GK_OGUN_NOTU).forEach(m => {
          const a = gkAnahtar(m);
          if(!a) return;
          kayit.push({ gun:d, anahtar:a });
          if(!son[a]) son[a] = m;                         // en yeni örnek kopyalanır
        });
      }
      const k = G ? G.kalip(kayit, gun) : [];
      if(!k.length){ out.push({ id, ad:sl.label, tur:'beyan' }); return; }
      const ornek = son[k[0]];
      out.push({ id, ad:sl.label, tur:'beyan', oneri:{ metin:gkOgunOzet(ornek), kaynak:'kalip' },
        yaz:async g => {
          const yeni = Object.assign(M.newMeal(sl.id), { items:ornek.items.map(it => Object.assign({}, it)), note:GK_OGUN_NOTU });
          await M.addMeal(g, yeni);
          return { metin:sl.label, geriAl:async () => { await M.deleteMeal(g, yeni.id); } };
        } });
    });

    const H = SP.Hatirlat;
    if(gun === U.todayISO() && H && H.bugun && H.isaretleHepsi){
      const l = H.bugun(bugunSimdi());
      const vakti = l.filter(x => x.durum === 'vakti').map(x => x.anahtar);
      if(vakti.length) out.push({ id:'hatirlatma', ad:yz('spi.today.hatirlatmalar'), tur:'beyan',
        oneri:{ metin:vakti.length + ' hatırlatma · yapıldı', kaynak:'plan' },
        yaz:async g => { const r = await H.isaretleHepsi(vakti, g); return { metin:yz('spi.today.hatirlatmalar'), geriAl:r.geriAl }; } });
      else if(l.some(x => x.durum === 'yapildi')) out.push({ id:'hatirlatma', ad:yz('spi.today.hatirlatmalar'), tur:'beyan', yazildi:true, ipucu:'vakti gelenler işaretli' });
    }

    const v = M.vitalsOf(gun) || {};
    const onceki = Object.keys(S.vitals || {}).filter(t => t < gun).sort().reverse();
    GK_OLCUM.forEach(f => {
      const yaz = x => U.fmtNum(Number(x)) + ' ' + f.birim;
      if(v[f.alan] != null){ out.push({ id:f.id, ad:f.ad, tur:'olcum', yazildi:true, ipucu:yaz(v[f.alan]) }); return; }
      const t = onceki.find(x => S.vitals[x] && S.vitals[x][f.alan] != null);
      out.push({ id:f.id, ad:f.ad, tur:'olcum', yazildi:false,
        ipucu:t ? 'son: ' + yaz(S.vitals[t][f.alan]) + ' · ' + U.fmtShort(t) : 'son: veri yok',
        alanlar:[{ ad:f.ad, birim:f.birim, ipucu:t ? 'son ' + U.fmtNum(Number(S.vitals[t][f.alan])) : '' }], metin:d => f.soz + ' ' + d[0] });
    });
    return out;
  }
  /* Açık «Günü kapat» alt sayfası kayıttan ve geri almadan sonra tazelenir. */
  function gkTazele(){
    const G = window.LIFEOS && window.LIFEOS.GUNUKAPAT;
    const k = document.querySelector('#sheet [data-gunukapat]');
    if(!G || !k) return;
    k.outerHTML = G.cizim(k.getAttribute('data-gun'));
  }
  /* Yalnız bugün (2026-10-25): tek satırın ölçümü gün sözü yoksa bugüne
     yazılır; geçmiş gün açılsa ölçüm ve beyan ayrı günlere düşerdi.
     Geçmiş gün «Günü düzenle» yolundan girilir. */
  function gkAc(gun){
    const G = window.LIFEOS && window.LIFEOS.GUNUKAPAT;
    if(!G || !G.kuruluMu || !G.kuruluMu() || gun !== U.todayISO()){ SP.App.go('gun'); return; }
    UI.sheet({ title:yz('spi.today.gunu-kapat'), body:G.cizim(gun),
      footer:String(K.Button({ label:yz('spi.today.gunu-duzenle'), tone:'ghost', act:'go', data:{ 'data-route':'gun' } })) });
  }

  /* Radio grubunun klavyesi: oklar bir bardak, Boşluk/Enter dokunuş.
     Odak önce hedef bardağa taşınır; yeniden çizim onu korur (app.js
     focusSnapshot data-act + data-i). Belgedeki satır gezinmesi (↑/↓) bu
     grupta çalışmaz: olay burada durur. */
  function suKlavye(){
    const g = document.querySelector('[role="radiogroup"][data-oz-su]');
    if(!g || g.dataset.bagli) return;
    g.dataset.bagli = '1';
    g.addEventListener('keydown', e => {
      const el = e.target.closest && e.target.closest('[data-act="su-ayarla"]');
      if(!el) return;
      const d = shownDate(), s = suDurumu(d), adet = s.adet, n = adet || 0;
      let hedef = null;
      if(e.key === 'ArrowRight' || e.key === 'ArrowUp') hedef = n + 1;
      else if(e.key === 'ArrowLeft' || e.key === 'ArrowDown') hedef = n - 1;
      else if(e.key === ' ' || e.key === 'Enter'){
        e.preventDefault(); e.stopPropagation();
        /* ARIA radyo deseni: seçili radyoda Boşluk/Enter hiçbir şey yapmaz
           (2026-10-25 düzeltmesi; önce bir bardak siliyordu). */
        if(adet >= 1 && Number(el.dataset.n) === adet) return;
        handle['su-ayarla'](el); return;
      }
      if(hedef == null) return;
      e.preventDefault(); e.stopPropagation();
      if(hedef < 1 && adet == null) return;          // girilmemiş gün zaten boş
      const yeni = g.querySelector('[data-n="' + Math.max(1, hedef) + '"]');
      if(yeni) yeni.focus();
      /* Oklar gerçek ml'ye bir bardak ekler/çıkarır (suSonrasi kuralı);
         bir bardaktan aşağısı null. */
      const yeniMl = hedef > n ? (s.ml || 0) + s.b : (s.ml || 0) - s.b;
      suYaz(d, yeniMl < s.b ? null : yeniMl);
    });
  }

  /* 074 ENERJİ ÖLÇEĞİ: «Bugün nasıl hissediyorsun?» — günün hissi, beyan. */
  function EnerjiKutusu(){
    if(!VT()) return '';
    const v = M.vitalsOf(shownDate());
    return vkutu(yz('spi.today.gunun-hissi'), v && v.soreness != null ? 'beyan' : 'girilmedi', VT().enerjiOlcegi({ act:'set-soreness',
      deger:v && v.soreness != null ? Number(v.soreness) : null, soru:yz('spi.today.bugun-nasil-hissediyorsun'),
      adlar:SORENESS.map(x => x.label.replace(/^\d · /, '')), alt:'bitkin', ust:'zinde' }));
  }

  /* 088 ÖLÇÜM HATIRLATICISI: sabah tartısı hatırlatması (core/hatirlat.js
     «olcum» türü) ve bugünün tartı saati (kayıt anı; tahmin edilmez). */
  function TartiHatirlatici(){
    if(!VT() || !SP.Hatirlat) return '';
    const h = (SP.Hatirlat.durum().liste || []).find(x => x.tur === 'olcum');
    const v = M.vitalsOf(U.todayISO());
    const at = v && v.weight != null && v.weightAt ? new Date(v.weightAt) : null;
    return VT().olcumHatirlatici({ ad:yz('spi.today.sabah-tartisi'), saatler:h ? h.saatler : [], acik:!!h, act:'ht-ac', data:{ 'data-tur':'olcum' },
      olculdu:at ? yz('spi.today.bugun-3') + U.pad2(at.getHours()) + ':' + U.pad2(at.getMinutes()) + '’te ölçüldü'
        : (v && v.weight != null ? yz('spi.today.bugun-olculdu-saati-kayitli') : null) });
  }

  /* 077 ÖLÇÜM TUŞ TAKIMI: büyük rakam, dünkü değer yanında. ✓ ölçüm
     formunun kaydına gider (018 şüpheli giriş dahil). */
  let tusTampon = '';
  function tusHtml(){
    if(!VT()) return '';
    const d = shownDate();
    const once = Object.keys(S.vitals || {}).filter(t => t < d && S.vitals[t].weight != null).sort().reverse()[0];
    const v = M.vitalsOf(d);
    const metin = tusTampon || (v && v.weight != null ? String(v.weight).replace('.', ',') : '');
    return VT().tusTakimi({ metin, birim:'kg', dun:once ? Number(S.vitals[once].weight) : null,
      deger:metin ? Number(metin.replace(',', '.')) : null, act:'tus', kaydet:'tus-kaydet' });
  }
  function tusEntry(){
    const ic = tusHtml();
    if(!ic) return null;
    return K.Entry({ label:yz('spi.today.tarti'), meta:'tuş takımı', note:yz('spi.today.buyuk-rakam-sabit-birim'),
      body:html`<div id="tus-yuva">${raw(ic)}</div>` });
  }

  function ToparlanmaKutusu(){
    const r = SP.Move.readiness(shownDate());
    if(!r.ok) return K.Kutu({ ad:yz('spi.today.toparlanma'), yuva:'ölçüm bekliyor',
      govde:html`<p class="small muted">${r.note || yz('spi.today.bugunun-olcumu-girilmedi')}</p>` });
    /* 068 TOPARLANMA HALKASI (vitrin): dilim kaynağın ağırlığı, etiket
       kaynağın kesinliği; girilmemiş kaynak halkada boş. */
    const halka = VT() ? VT().toparlanmaHalkasi({ deger:r.score, bant:r.band.label,
      dilimler:r.parts.map(p => ({ ad:p.label, agirlik:p.weight, kesinlik:p.score == null ? 'missing' : 'measured' })) }) : '';
    return K.Kutu({ ad:yz('spi.today.toparlanma'), yuva:r.band.label,
      govde:html`${halka ? html`${raw(halka)}<p class="small mt-10">${r.band.order}</p>` : html`<div class="row wrap" style="gap:18px">
          ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:104,
            bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
          <p class="small grow minw0">${r.band.order}</p>
        </div>`}
        ${when(r.missing.length, () => html`<p class="tiny dim mt-8">Girilmeyen: ${r.missing.join(', ')}
          ${yz('spi.today.agirligi-kalanlara-dagitildi')}</p>`)}` });
  }

  function AsgariKutusu(){
    const m = SP.Calc.minimumDay();
    return K.Kutu({ ad:yz('spi.today.asgari-gun'), yuva:m.done + ' / ' + m.total + ' · seri ' + SP.Calc.streak() + ' gün',
      govde:html`${map(m.rows, P.minRow)}` });
  }

  /* DÖNEN DURUM (kullanıcı, 2026-10-02: «çok daha az yer kaplayan küçük
     widget'lar»). Durum'un büyük kartları Bugün'de iki küçük dönen karttır:
     «Bugün» (sıradaki hamle, asgari gün, seri) ve «Sağlık» (toparlanma,
     beslenme). Kartların kendisi Ayrıntı'nın başındadır, hiçbiri kalkmadı.
     Madde ve sayıyı kural motoru verir; eksik veri sayı değil cümledir. */
  /* analiz: Analiz'in başında seri ve toparlanma pano kartıdır; dönen
     kartta ikinci kez yazılmaz. Bugün'ün minik özeti (seçim sayfası) tam kalır. */
  function DonenKutular(analiz){
    const V = VT();
    if(!V || !V.donen) return '';
    const SAYI = (window.LIFEOS || {}).SAYI;
    const sayi = s => SAYI ? SAYI.html(s) : U.esc(String(s.deger == null ? '—' : s.deger) + (s.birim ? ' ' + s.birim : ''));
    const git = (label, route) => ({ label, act:'go', data:{ 'data-route':route } });

    const gun = [];
    const n = SP.Calc.nextAction();
    if(!n.calm && n.title){
      gun.push({ ust:yz('spi.today.siradaki'), cumle:n.title + '.', vurgu:n.action || n.why || '', sistem:'spi',
        dugme:n.route && n.route !== 'today' ? git('Aç', n.route) : null });
    }
    const m = SP.Calc.minimumDay();
    const kalan = m.rows.filter(x => !x.ok).map(x => x.label.toLocaleLowerCase('tr-TR'));
    const G = (window.LIFEOS || {}).GRAFIK;
    gun.push({ ust:yz('spi.today.asgari-gun'), sayi:sayi({ deger:m.done + '/' + m.total, kesinlik:'computed', formul:'tutulan madde / madde' }),
      gorsel:G && G.tikHtml ? G.tikHtml({ etiket:yz('spi.today.asgari-gun'), hedef:m.total, yapilan:m.done }) : '',
      cumle:'tamam.', vurgu:kalan.length ? yz('spi.today.kalan') + kalan.join(', ') + '.' : yz('spi.today.bugun-tamam'), sistem:'spi' });
    /* Seri sıfırken «0 gün, hesaplandı seri» okunuyordu; sıfır seri bir
       sayı değil, henüz başlamamış bir seridir. */
    const seri = SP.Calc.streak();
    gun.push(seri > 0
      ? { ust:yz('spi.today.seri'), sayi:sayi({ deger:seri, birim:'gün', kesinlik:'computed', formul:'asgari günün tutulduğu ardışık gün' }),
          cumle:yz('spi.today.ust-uste'), vurgu:yz('spi.today.asgari-gun-seriyi-surdurur'), sistem:'spi' }
      : { ust:yz('spi.today.seri'), cumle:yz('spi.today.henuz-baslamadi'), vurgu:yz('spi.today.bugun-asgari-gunu-tamamlarsa'), sistem:'spi' });

    const saglik = [];
    const r = SP.Move.readiness(shownDate());
    saglik.push(r.ok
      ? { ust:yz('spi.today.toparlanma'), sayi:sayi({ deger:r.score, birim:'/100', kesinlik:'computed', formul:'kaynakların ağırlıklı ortalaması' }),
          cumle:r.band.label.toLocaleLowerCase('tr-TR') + '.', vurgu:r.band.order || '', sistem:'spi' }
      : { ust:yz('spi.today.toparlanma'), cumle:yz('spi.today.olcum-bekliyor'), vurgu:yz('spi.today.uyku-suresini-yazman-bile-ye'), sistem:'spi' });
    const t = SP.Nutri.dayTotals(U.todayISO());
    const tg = SP.Nutri.targets();
    if(!tg.ok){
      saglik.push({ ust:yz('spi.today.beslenme'), cumle:yz('spi.today.hedef-yok'), vurgu:yz('spi.today.profilde') + tg.missing.join(', ') + ' eksik.', sistem:'spi', dugme:git('Profil', 'family') });
    }else if(t.empty){
      saglik.push({ ust:yz('spi.today.beslenme'), cumle:yz('spi.today.ogun-girilmedi'), vurgu:yz('spi.today.hedef-2') + U.fmtNum(tg.kcal) + ' kcal.', sistem:'spi' });
    }else{
      saglik.push({ ust:yz('spi.today.beslenme'), sayi:sayi({ deger:t.meals, birim:'öğün', kesinlik:'measured' }), cumle:'girildi.',
        vurgu:yz('spi.today.hedef-2') + U.fmtNum(tg.kcal) + ' kcal.', sistem:'spi', dugme:git('Öğünler', 'meals') });
    }

    /* Seçim sayfasının minik özeti (hesap.js söz 16); örnek profil yazmaz. */
    const ozet = SP.Ornek && SP.Ornek.acik() ? null : 'spi';
    const ayikla = l => analiz ? l.filter(x => x.ust !== 'Seri' && x.ust !== 'Toparlanma') : l;
    return raw(V.donen({ id:'spi-bugun', ad:yz('spi.today.bugun'), ozet:analiz ? null : ozet, maddeler:ayikla(gun) })
      + V.donen({ id:'spi-saglik', ad:yz('spi.today.saglik'), ozet:analiz ? null : ozet, maddeler:ayikla(saglik) }));
  }

  function BeslenmeKutusu(){
    const t = SP.Nutri.dayTotals(U.todayISO());
    const tg = SP.Nutri.targets();
    if(!tg.ok) return K.Kutu({ ad:yz('spi.today.beslenme'), yuva:'hedef yok',
      govde:html`<p class="small muted">${yz('spi.today.profilde-2')} ${tg.missing.join(', ')} ${yz('spi.today.eksik-hedef-tahmin-edilmez')}</p>` });
    if(t.empty) return K.Kutu({ ad:yz('spi.today.beslenme'), yuva:'hedef ' + U.fmtNum(tg.kcal) + ' kcal',
      govde:html`<p class="small muted">${yz('spi.today.bugun-hic-ogun-girilmedi')}</p>` });
    return K.Kutu({ ad:yz('spi.today.beslenme'), yuva:t.meals + ' öğün',
      govde:html`${K.Meter({ label:yz('spi.today.enerji'), value:tg.kcal ? 100 * t.kcal / tg.kcal : 0,
          text:U.fmtNum(Math.round(t.kcal)) + ' / ' + U.fmtNum(tg.kcal) + ' kcal' })}
        <div class="mt-8">${K.Meter({ label:yz('spi.today.protein'), value:tg.protein.min ? 100 * t.protein / tg.protein.min : 0,
          text:U.fmtNum(Math.round(t.protein)) + ' / ' + U.fmtNum(tg.protein.min) + ' g' })}</div>` });
  }

  /* 015 SON BİLİNEN DEĞER · 026 VERİ TAZELİĞİ (vitrin, pano «SPİ · Bugün»):
     her ölçümün son değeri, ne zaman ölçüldüğüyle. Eski ölçüm soluklaşır ve
     yaşını yazar; hiç ölçülmemişse «—». Bugünün değeri sayılmaz, yazılır. */
  function SonOlcumlerKutusu(){
    const SAYI = (window.LIFEOS || {}).SAYI;
    if(!SAYI) return '';
    const gunler = Object.keys(S.vitals || {}).sort().reverse();
    const son = alan => { const t = gunler.find(x => S.vitals[x] && S.vitals[x][alan] != null);
      return t ? { deger:Number(S.vitals[t][alan]), zaman:t } : null; };
    /* Bugün girilen değer «Günün ölçümü»nde yazılıdır; burada yalnız bugün
       girilmemiş ölçünün son değeri durur (sadelik, 2026-10-01). */
    const bugun = S.vitals && S.vitals[U.todayISO()] || {};
    const liste = [['Uyku', 'sleep', 'saat'], ['Kilo', 'weight', 'kg'], [yz('spi.today.i-stirahat-nabzi'), 'rhr', 'atım/dk'], ['HRV', 'hrv', 'ms']]
      .filter(([, alan]) => bugun[alan] == null);
    if(!liste.length) return '';
    const satirlar = liste
      .map(([ad, alan, birim]) => {
        const s = son(alan);
        return html`<li class="sonolcum__s"><span class="sonolcum__ad">${ad}</span>
          <span class="sonolcum__d">${raw(SAYI.html(s ? { deger:s.deger, birim, kesinlik:'measured', zaman:s.zaman,
            kaynak:'günlük ölçüm', tazelik:'gunluk' } : { deger:null, birim, kesinlik:'missing' }))}</span></li>`;
      });
    return K.Kutu({ ad:yz('spi.today.son-olcumler'), yuva:'ölçüldü', govde:html`<ul class="sonolcum">${satirlar}</ul>
      <p class="tiny dim mt-8">${yz('spi.today.eski-olcum-soluklasir-ve-yas')}</p>` });
  }

  /* BUGÜN KAPAĞI (kullanıcı, 2026-10-18: «Bugün kısmı bambaşka, ana sayfa
     gibi olsun»): levhanın üstünde. Selam perdedekiyle aynı açılıştan
     (brand/ortak/karsilama.js); cümle kural motorunun başlık cümlesi;
     sayılar bugünün KAYDINDAN — kayıt yoksa «—» (veri yok), sıfır değil.
     Tarih yok (2026-10-02 kararı). KOLAY-PLANI Faz 2 (2026-10-26): kapak
     yalnız cümle ve tek eylemdir; dört karo Analiz'in başındaki «Bugün»
     özetinde (ozet()). */
  function kapakSayilari(){
    const t = SP.U.todayISO();
    const v = SP.S.vitals[t] || {};
    const ogun = (SP.S.meals[t] || []).length;
    const ws = (SP.S.workouts || []).filter(w => w && w.date === t);
    /* Görsel pano (2026-10-20): halka yalnız hedef BİLİNİNCE — uyku planındaki
       bugünün süresi, su için sistemin 2000 ml eşiği (SU_ESIK), öğün için
       «Öğünlerim»deki öğün sayısı. Hareketin hedefi yok: halka yok, sütun var.
       Sütunlar son yedi günün kaydı; girilmemiş gün boş (sıfır değil). */
    const yedi = []; for(let i = 6; i >= 0; i--) yedi.push(SP.U.iso(SP.U.addDays(SP.U.today(), -i)));
    const HP = SP.HaftaPlan;
    const uykuPlani = HP ? HP.liste().find(p => p.tur === 'uyku') : null;
    const uyu = uykuPlani ? HP.uykuOf(uykuPlani, t) : null;
    const planDk = uyu ? HP.uykuDakika(uyu.yat, uyu.kalk) : null;
    const slot = SP.Ogun ? SP.Ogun.liste().length : 0;
    const hareketDk = d => { const l = (SP.S.workouts || []).filter(w => w && w.date === d); return l.length ? l.reduce((a, w) => a + (Number(w.minutes) || 0), 0) : null; };
    /* Kesinlik kaynağından (kit: measured · estimated · computed): Günü kapat'ın
       yazdığı su beyandır (estimated); öğün SAYISI hesaplanır (gramları tahmin);
       hareket dakikası cihazdan gelmez, kullanıcı beyanıdır. Girilmemiş uyku
       kitte «veri yok» çizilir. */
    const sayilar = [
      { ad:yz('spi.today.uyku'), deger:v.sleep == null ? null : SP.U.fmtNet(v.sleep), birim:'sa', kesinlik:'measured',
        oran:v.sleep != null && planDk ? Number(v.sleep) * 60 / planDk : null,
        halka:!!planDk, alt:planDk ? 'plan ' + HP.sureYaz(planDk) : '', git:'gun',
        seri:yedi.map(d => { const x = SP.S.vitals[d]; return x && x.sleep != null ? Number(x.sleep) : null; }) },
      { ad:yz('spi.today.su'), deger:v.water == null ? null : Number(v.water).toLocaleString('tr-TR'), birim:'ml', kesinlik:v.waterSrc === 'beyan' ? 'estimated' : 'measured',
        oran:v.water == null ? null : Number(v.water) / SU_ESIK, halka:true, alt:yz('spi.today.esik') + U.fmtNum(SU_ESIK) + ' ml', git:'gun' },
      { ad:yz('spi.today.ogun'), deger:ogun || null, birim:slot ? '/ ' + slot : '', kesinlik:'computed',
        oran:ogun && slot ? ogun / slot : null, halka:slot > 0, git:'meals' },
      { ad:yz('spi.today.hareket'), deger:hareketDk(t), birim:'dk', kesinlik:'estimated', seri:yedi.map(hareketDk), git:'move' },
    ];
    return sayilar;
  }
  function kapak(){
    const KS = window.LIFEOS && window.LIFEOS.KARSILAMA;
    if(!KS) return '';
    return KS.kapakHtml({ modul:'spi', selam:KS.acilis('spi').selam, cumle:SP.Screens.today.headline(), sayilar:[],
      /* Günü kapat (KOLAY-PLANI Faz 1): alt sayfa; «Günü düzenle» onun içinde. */
      eylem:String(K.Button({ label:yz('spi.today.gunu-kaydet'), tone:'primary', act:'gunu-kapat' })),
      ikincil:('<button type="button" class="btn btn--ghost" data-kapak-asagi>' + yz('spi.today.gunun-akisi') + '</button>') });
  }

  /* PANO KARTLARI (2026-10-20, kullanıcı onaylı katalog; brand/ortak/pano.js).
     Kapağın altında üç kart: gece uykusu (plan biliniyorsa halka, son yedi
     gece sütun), toparlanma (yarım gösterge, bant adıyla), seri (14 kare).
     Kayıt yoksa kart boş hâliyle çizilir; sayı uydurulmaz. */
  function PanoUst(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const t = U.todayISO();
    const gunler = n => { const l = []; for(let i = n - 1; i >= 0; i--) l.push(U.iso(U.addDays(U.today(), -i))); return l; };
    const git = (label, route) => ({ label, act:'go', data:{ 'data-route':route } });
    const HP = SP.HaftaPlan;
    /* Gece uykusu */
    const v = S.vitals[t] || {};
    const plan = HP ? HP.liste().find(p => p.tur === 'uyku') : null;
    const uyu = plan ? HP.uykuOf(plan, t) : null;
    const planDk = uyu ? HP.uykuDakika(uyu.yat, uyu.kalk) : null;
    const yedi = gunler(7).map(d => { const x = S.vitals[d]; return x && x.sleep != null ? Number(x.sleep) : null; });
    const sureYaz = dk => HP ? HP.sureYaz(dk) : U.fmtNet(dk / 60) + ' sa';
    let uyku;
    if(v.sleep == null){
      uyku = P.kart({ tur:'uyku', ad:yz('spi.today.gece-uykusu'), simge:'uyku', bos:{ cumle:yz('spi.today.bu-gecenin-uykusu-girilmedi'), dugme:git(yz('spi.today.uyku-gir'), 'gun') } });
    }else{
      const dk = Math.round(Number(v.sleep) * 60);
      const oran = planDk ? dk / planDk : null;
      const fark = planDk ? planDk - dk : null;
      uyku = P.kart({ tur:'uyku', ad:yz('spi.today.gece-uykusu'), simge:'uyku', yuva:'ölçüldü',
        govde:'<div class="pk__yan">' + (planDk ? P.halka({ oran, etiket:yz('spi.today.planin-yuzde') + Math.round(oran * 100) + '\'i' }) : '')
          + P.deger(sureYaz(dk), '', planDk ? 'plan ' + sureYaz(planDk) + (fark > 0 ? ' · ' + sureYaz(fark) + ' eksik' : ' · plan tuttu') : 'uyku planı yok') + '</div>'
          + P.sutun({ degerler:yedi, yukseklik:32, etiket:yz('spi.today.son-yedi-gece') + yedi.filter(x => x == null).length + ' gece kayıt yok' })
          + P.not('son 7 gece · kesik kutu: kayıt yok') });
    }
    /* Toparlanma */
    const r = SP.Move.readiness(t);
    const bantlar = (SP.READINESS_BANDS || []).slice().reverse().map(b => b.label);
    const topar = r.ok
      ? P.kart({ tur:'toparlanma', ad:yz('spi.today.toparlanma'), simge:'kalp', yuva:'hesaplandı',
          govde:P.gosterge({ deger:r.score, en:100, bantlar, bant:r.band.label, etiket:yz('spi.today.toparlanma-2') + r.score + ' / 100, ' + r.band.label.toLocaleLowerCase('tr-TR') })
            + P.not(r.band.order || '') })
      : P.kart({ tur:'toparlanma', ad:yz('spi.today.toparlanma'), simge:'kalp', bos:{ cumle:yz('spi.today.uyku-girilince-hesaplanir'), dugme:git(yz('spi.today.uyku-gir'), 'gun') } });
    /* Seri: son 14 gün */
    const seri = SP.Calc.streak();
    const durum = gunler(14).map(d => {
      const tamam = SP.Calc.minimumDay(d).complete;
      if(d === t) return tamam ? 'dolu' : 'bugun';
      if(tamam) return 'dolu';
      return SP.Seri && SP.Seri.donmusMu && SP.Seri.donmusMu(d) ? 'donmus' : 'bos';
    });
    const tutulan = durum.filter(x => x === 'dolu').length;
    const seriKart = P.kart({ tur:'seri', ad:yz('spi.today.seri'), simge:'alev', yuva:seri > 0 ? seri + ' gün üst üste' : 'henüz başlamadı',
      govde:P.kareler({ durumlar:durum, sutun:14, etiket:yz('spi.today.son-14-gunun') + tutulan + '\'inde asgari gün tutuldu' })
        + P.not('dolu: asgari gün tutuldu · çerçeve: bugün') });
    /* Haftanın en iyi gecesi (yıldız): son yedi gecenin en uzunu; en az üç
       gece kayıtlıysa. */
    const kayitli = gunler(7).map((d, i) => ({ d, v:yedi[i] })).filter(x => x.v != null);
    let gece = '';
    if(kayitli.length >= 3){
      const en = kayitli.reduce((m, x) => x.v > m.v ? x : m, kayitli[0]);
      const ort = kayitli.reduce((a, x) => a + x.v, 0) / kayitli.length;
      gece = P.kart({ tur:'en-iyi-gece', ad:yz('spi.today.haftanin-en-iyi-gecesi'), yildiz:true,
        govde:P.deger(sureYaz(Math.round(en.v * 60)), '', (U.fmtShort ? U.fmtShort(en.d) : en.d) + ' · haftanın ortalaması ' + sureYaz(Math.round(ort * 60)))
          + P.not('o günün akşamını tekrar etmeye değer: neyi farklı yaptın?') });
    }
    /* Öne çıkan bulgu (yıldız): İnceleme'nin açılmış ilk karşılaştırması
       (eşikten geçmiş, gün sayılı); yoksa kart yok. */
    let bulgu = '';
    const f = SP.Inceleme ? SP.Inceleme.fikirler().find(x => x.acik) : null;
    if(f){
      bulgu = P.kart({ tur:'bulgu', ad:f.baslik, yildiz:'verinden',
        govde:P.cubuklar({ satirlar:[{ ad:f.a.ad, oran:Math.abs(f.a.ort) / Math.max(Math.abs(f.a.ort), Math.abs(f.b.ort)), metin:SP.Inceleme.sayi(f.a.ort, f.birim) + ' ' + f.birim },
            { ad:f.b.ad, oran:Math.abs(f.b.ort) / Math.max(Math.abs(f.a.ort), Math.abs(f.b.ort)), metin:SP.Inceleme.sayi(f.b.ort, f.birim) + ' ' + f.birim, renk:'n' }] })
          + P.not(f.a.n + ' ve ' + f.b.n + ' gün · birliktelik, neden değil'),
        ayak:P.dugmeHtml({ label:yz('spi.today.i-ncelemeye-git'), act:'go', data:{ 'data-route':'meeting' } }, 'pk__dugme pk__dugme--ikincil') });
    }
    return '<div class="pk-ust">' + P.izgara([uyku, topar, seriKart, gece, bulgu]) + '</div>';
  }

  /* GÜN (KOLAY-PLANI Faz 2): bugünün öğün yuvaları tek kutuda, her biri
     girildi mi; ayrıntı ve giriş Öğün ekranında. Hedef yoksa ölçer yok. */
  function GunKutusu(){
    const t = U.todayISO();
    const dolu = M.mealsOf(t).filter(m => m.items.length);
    const yuvalar = SP.Ogun ? SP.Ogun.liste() : [];
    const top = SP.Nutri.dayTotals(t), tg = SP.Nutri.targets();
    return K.Kutu({ ad:yz('spi.today.ogunler'), yuva:dolu.length ? dolu.length + ' öğün girildi' : 'girilmedi',
      govde:html`${map(yuvalar, sl => {
          const v = dolu.filter(m => m.slot === sl.id);
          return P.minRow({ ok:v.length > 0, label:sl.label, detail:v.length ? v.map(gkOgunOzet).join(' · ') : '—' });
        })}
        ${when(tg.ok && !top.empty, () => html`<div class="mt-8">${K.Meter({ label:yz('spi.today.enerji'), value:tg.kcal ? 100 * top.kcal / tg.kcal : 0,
          text:U.fmtNum(Math.round(top.kcal)) + ' / ' + U.fmtNum(tg.kcal) + ' kcal' })}</div>`)}
        <div class="row wrap gap-8 mt-8">${K.Button({ label:yz('spi.today.ogun'), size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'meals' } })}</div>` });
  }

  /* BUGÜN — üç blok (KOLAY-PLANI Faz 2, 2026-10-26; Bugün ~11 kutuydu ve
     «uyku girilmedi»yi altı kez söylüyordu):
       ŞİMDİ      kapak: günün cümlesi ve tek eylem («Günü kaydet»)
       NE YAPTIN? tek satır, günün ölçümü (dört alan), his ve su bardakları
       GÜN        en acil uyarı, öğün yuvaları, vakti gelen hatırlatma, günün sorusu
     Kapağın karoları, pano kartları, Durum ve Öneri kalkmadı: Analiz'in
     başındaki «Bugün» özetinde (ozet()). */
  LIFEOS.PARCA.blok({ id:'today.gunun-sorusu', sayfa:'today', yer:'y1', sira:10, ad:'Günün sorusu', ciz({ acil, vakti, sig, soruKart, soru }){
    return when(soru, () => K.Ledger([soru]));
  } });
  LIFEOS.PARCA.blok({ id:'today.soru-karti', sayfa:'today', yer:'y2', sira:10, ad:'Soru kartı', ciz({ acil, vakti, sig, soruKart, soru }){
    return raw(soruKart);
  } });
  /* Öğrenme motoru: yalnız tekrar varken görünen tek satır; kart değil (Y2 yoğunluğu). */
  LIFEOS.PARCA.blok({ id:'today.ogrenme', sayfa:'today', yer:'y3', sira:20, ad:'Öğrenme tekrarı', ciz(){
    return raw(window.LIFEOS.OMEKRAN ? window.LIFEOS.OMEKRAN.bugunSatiri() : '');
  } });
  LIFEOS.PARCA.blok({ id:'today.zamani-gelen-is', sayfa:'today', yer:'y3', sira:10, ad:'Zamanı gelen iş', ciz({ acil, vakti, sig, soruKart, soru }){
    return when(vakti, () => K.Ledger([vakti]));
  } });
  LIFEOS.PARCA.blok({ id:'today.gunkutusu', sayfa:'today', yer:'y4', sira:10, ad:'Gün', ciz({ acil, vakti, sig, soruKart, soru }){
    return GunKutusu();
  } });
  LIFEOS.PARCA.blok({ id:'today.acil-uyari', sayfa:'today', yer:'y5', sira:10, ad:'Acil uyarı', ciz({ acil, vakti, sig, soruKart, soru }){
    return when(acil, () => acil.kart);
  } });
  LIFEOS.PARCA.blok({ id:'today.ogun-kutusu', sayfa:'today', yer:'y6', sira:10, ad:'Öğün kutusu', ciz({ acil, vakti, sig, soruKart, soru }){
    return (window.LIFEOS && window.LIFEOS.GIRIS && window.LIFEOS.GIRIS.kuruluMu()) ? '' : OgunKutusu();
  } });
  LIFEOS.PARCA.blok({ id:'today.sukutusu', sayfa:'today', yer:'y7', sira:10, ad:'Su', ciz({ acil, vakti, sig, soruKart, soru }){
    return SuKutusu();
  } });
  LIFEOS.PARCA.blok({ id:'today.enerjikutusu', sayfa:'today', yer:'y8', sira:10, ad:'Enerji', ciz({ acil, vakti, sig, soruKart, soru }){
    return EnerjiKutusu();
  } });
  LIFEOS.PARCA.blok({ id:'today.olcumkutusu', sayfa:'today', yer:'y9', sira:10, ad:'Ölçüm', ciz({ acil, vakti, sig, soruKart, soru }){
    return OlcumKutusu();
  } });
  LIFEOS.PARCA.blok({ id:'today.hizli-giris-kutusu', sayfa:'today', yer:'y10', sira:10, ad:'Hızlı giriş kutusu', ciz({ acil, vakti, sig, soruKart, soru }){
    return raw(window.LIFEOS && window.LIFEOS.GIRIS ? window.LIFEOS.GIRIS.kutuHtml() : '');
  } });
  LIFEOS.PARCA.blok({ id:'today.onay-bekleyen-teklifler', sayfa:'today', yer:'y11', sira:10, ad:'Onay bekleyen teklifler', ciz({ acil, vakti, sig, soruKart, soru }){
    return (SP.S.ui.kingTeklifler || []).length ? html`<section class="bugun__alan" aria-label="Onay bekliyor">
          ${SP.Screens.onaylar.kingKart()}</section>` : '';
  } });
  async function render(){
    /* Karşılamanın notu: bugünün kural cümlesi (Siri'ye giden aynı cümle). */
    if(window.LIFEOS && window.LIFEOS.KARSILAMA && SP.Screens.today.sesli) window.LIFEOS.KARSILAMA.notYaz(SP.Screens.today.sesli(), SP.U.todayISO());
    /* Seçim sayfasının minik özeti Bugün açılınca yazılır (hesap.js söz 16);
       dönen kartın kendisi Analiz'de çizilir. */
    DonenKutular();
    const acil = bugunUyarisi();
    const vakti = SP.HatirlatUI ? SP.HatirlatUI.vaktiRow() : '';
    /* «Bir soru»: ortak sade kart (brand/ortak/sorukart.js). */
    const sig = SP.Signals ? SP.Signals.current() : null;
    if(sig && !sig.seenAt) SP.Signals.markSeen(sig.id);
    const soruKart = sig && window.LIFEOS && window.LIFEOS.SORUKART ? window.LIFEOS.SORUKART.kartHtml(sig) : '';
    const soru = soruKart ? null : signalEntry();

    const parcaB = { acil, vakti, sig, soruKart, soru };
    return String(html`<div class="bugun" data-oz="003">
      <div class="bugun__sol">
        
        ${LIFEOS.PARCA.yer('today', 'y11', K, parcaB, typeof raw === 'undefined' ? null : raw)}
        <section class="bugun__alan" aria-label="Ne yaptın?">
          ${LIFEOS.PARCA.yer('today', 'y10', K, parcaB, typeof raw === 'undefined' ? null : raw)}
          ${LIFEOS.PARCA.yer('today', 'y9', K, parcaB, typeof raw === 'undefined' ? null : raw)}
          <div class="bugun__cift">${LIFEOS.PARCA.yer('today', 'y8', K, parcaB, typeof raw === 'undefined' ? null : raw)}${LIFEOS.PARCA.yer('today', 'y7', K, parcaB, typeof raw === 'undefined' ? null : raw)}</div>
          ${LIFEOS.PARCA.yer('today', 'y6', K, parcaB, typeof raw === 'undefined' ? null : raw)}
        </section>
      </div>
      <div class="bugun__sag">
        <section class="bugun__alan" aria-label="Gün"><h2 class="bugun__etiket" aria-hidden="true">${yz('spi.today.gun-2')}</h2>
          ${LIFEOS.PARCA.yer('today', 'y5', K, parcaB, typeof raw === 'undefined' ? null : raw)}
          ${LIFEOS.PARCA.yer('today', 'y4', K, parcaB, typeof raw === 'undefined' ? null : raw)}
          ${LIFEOS.PARCA.yer('today', 'y3', K, parcaB, typeof raw === 'undefined' ? null : raw)}
          ${LIFEOS.PARCA.yer('today', 'y2', K, parcaB, typeof raw === 'undefined' ? null : raw)}
          ${LIFEOS.PARCA.yer('today', 'y1', K, parcaB, typeof raw === 'undefined' ? null : raw)}
        </section>
      </div>
    </div>`);
  }

  /* BUGÜNÜN ÖZETİ (Analiz'in başı, KOLAY-PLANI Faz 2): Bugün'den taşınan
     dört karo, pano kartları, Durum ve Öneri. Karolar kapağın kendi
     çiziminden alınır (brand/ortak/karsilama.js), ayrı kopya yazılmaz.
     Öneri kartının düğmeleri Onaylar'ın işleyicisine gider (onayHandle). */
  function ozet(){
    const KS = window.LIFEOS && window.LIFEOS.KARSILAMA;
    const k = document.createElement('div');
    k.innerHTML = KS ? KS.kapakHtml({ modul:'spi', sayilar:kapakSayilari() }) : '';
    const karolar = k.querySelector('.kapak__sayilar');
    const oneri = SP.Screens.onaylar && SP.Screens.onaylar.bekleyen() ? SP.Screens.onaylar.oneriAlani() : '';
    return String(html`<section class="analiz-bugun mb-16" aria-label="Bugünün özeti">
      ${raw(karolar ? karolar.outerHTML : '')}
      <section class="bugun__alan mt-16" aria-label="Durum"><h2 class="bugun__etiket" aria-hidden="true">${yz('spi.today.durum')}</h2>
        ${DonenKutular(true)}
        ${when(S.ui.haftaOzet && window.LIFEOS.HaftaOzet, () => raw(window.LIFEOS.HaftaOzet.kartHtml(S.ui.haftaOzet)))}
        ${raw(window.LIFEOS.ONERI && SP.Hedefler && SP.Hedefler.ag ? window.LIFEOS.ONERI.butceCakismaHtml(SP.Hedefler.ag.butce()) : '')}
      </section>
      ${when(oneri, () => html`<section class="bugun__alan mt-16" aria-label="Öneri"><h2 class="bugun__etiket" aria-hidden="true">${yz('spi.today.oneri')}</h2>${oneri}</section>`)}
    </section>`);
  }

  /* GÜNÜN AYRINTISI (Bugün › Ayrıntı). Önce Günlük'ün üç sekmesiydi
     (Giriş · Özet · Geçmiş); şimdi üçü alt alta bölümdür ve eski sekme
     eylemi (`day-tab`) bölüm çubuğunda kalır. Bugün'de duran şey (hızlı
     öğün, günün sorusu, en acil uyarı) burada tekrar çizilmez; ölçüm
     formu burada bütün alanlarıyla durur. */
  async function renderAyrinti(){
    const tum = uyarilar(), acil = bugunUyarisi(tum);
    const banners = tum.filter(u => u !== acil).map(u => u.kart);
    const giris = K.Ledger([dunkuEntry(), formEntry(), tusEntry(), symptomEntry(), statusEntry(), whyEntry()].filter(Boolean));
    const ozet = K.Ledger([egilimEntry(), readinessEntry(), nutritionEntry(), minimumEntry(),
      SP.HatirlatUI ? SP.HatirlatUI.ozetEntry() : null, officeEntry(), moneyEntry()].filter(Boolean));
    const gecmis = K.Ledger([historyEntry(), baselineEntry()]);
    return String(html`
      ${when(banners.length, () => html`<div class="stack-sm mb-16">${banners}</div>`)}
      ${/* Bugün'deki dönen kartların açık hâli: Durum kartları burada. */''}
      <section class="bugun__alan mb-16" aria-label="Durum">${ToparlanmaKutusu()}${AsgariKutusu()}${BeslenmeKutusu()}${raw(TartiHatirlatici())}${SonOlcumlerKutusu()}</section>
      ${when((S.ui.hkmBildirim || []).length, () => html`<div class="mb-16">${K.Ledger([kingBildirimRow()])}</div>`)}
      <div class="mb-16">${K.Ledger([hkmSeritRow()].concat(SP.Seri ? [seriRow()] : []))}</div>
      ${K.SayfaBolumleri({ act:'day-tab', aria:yz('spi.today.gunun-bolumleri'), bolumler:[
        { id:'giris', ad:yz('spi.today.giris'), govde:giris },
        { id:'ozet', ad:yz('spi.today.ozet'), govde:ozet },
        { id:'gecmis', ad:yz('spi.today.gecmis'), govde:gecmis },
      ] })}
      <div class="mt-24">${raw(UI.rail(['readiness', 'ref-range', 'next-action', 'minimum-day', 'certainty']))}</div>`);
  }

  /* Başka ekrandan istenen bölüm (Bugün'deki «Bütün alanlar» gibi)
     çizimden sonra görünür yapılır. */
  function afterRenderAyrinti(){
    const t = S.ui.dayTab;
    S.ui.dayTab = null;
    if(t && t !== 'giris') K.bolumeGit(t);
  }

  /* PLAN › HEDEFLER. Hedefler Bugün'ün Özet sekmesindeydi; kural «Plan:
     hafta, hedefler, merdiven tek yerde» (CEKMECE-HARITASI). Kart ve
     işleyiciler aynı: plan önizlemesi, uyarlama ve geri alma burada. */
  async function renderHedefler(){
    const e = hedefEntry();
    if(!e) return String(K.Kutu({ ad:yz('spi.today.hedef-motoru-yuklenmedi'),
      govde:html`<p class="small muted">${yz('spi.today.hedefler-bu-derlemede-yok-di')}</p>` }));
    return String(html`${K.Ledger([e])}`);
  }

  async function dunkuEkle(tur, id){
    const bugun = U.todayISO();
    const r = tur === 'ogun' ? await SP.Dunku.ogunKopyala(bugun, id) : await SP.Dunku.antrenmanKopyala(bugun, id);
    if(!r.ok){ UI.toast(r.why); return; }
    UI.toast(r.ad + ' bugüne eklendi', { undo:async () => { await SP.Dunku.geriAl(bugun, tur, r.id); SP.App.render(); } });
    SP.App.render();
  }

  /* Öneri alanındaki kartın düğmeleri Onaylar ekranının işleyicilerine
     gider: onay TEK yoldan geçer, iki ekranda iki ayrı kod durmaz. */
  const ONAY_EYLEMLERI = ['king-onayla', 'king-parca', 'king-iptal', 'hkm-toplu', 'hkm-intent-yes',
    'hkm-intent-apply', 'hkm-intent-no', 'hkm-doubt-ok', 'bekleyen-onay', 'bekleyen-ret',
    'oneri-uygula', 'oneri-gec', 'oneri-gec-neden', 'oneri-onizle'];
  const onayIsleyici = a => el => SP.Screens.onaylar.handle[a](el);

  /* 018 şüpheli giriş durumu: hangi alan soruldu, soru geçildi mi. */
  let supheGecti = false, supheAlan = null;

  const handle = {
    async 'dunku-ogun'(el){ await dunkuEkle('ogun', el.dataset.id); },
    async 'dunku-antrenman'(el){ await dunkuEkle('antrenman', el.dataset.id); },
    /* Kapak bugünü gösterir: sayfa da bugünü açar (gizli görünen gün değil). */
    'gunu-kapat'(){ gkAc(U.todayISO()); },
    async 'kotu-gun'(){
      const r = await SP.KotuGun.ac();
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast(yz('spi.today.kotu-gun-modu-acik-yuk'), { undo:async () => {
        await SP.KotuGun.kapat(r.gun); SP.App.render(); } });
      SP.App.render();
    },
    async 'kotu-gun-kapat'(){
      const r = await SP.KotuGun.kapat();
      if(r.ok) UI.toast(yz('spi.today.normal-gune-donuldu'));
      SP.App.render();
    },
    async 'seri-hasta'(){
      const r = await SP.Seri.dondur(U.todayISO(), null, 'hasta');
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast(yz('spi.today.bugun-donduruldu-seri-bozulm'), { undo:async () => {
        await SP.Seri.coz(r.kayit.id); SP.App.render(); } });
      SP.App.render();
    },
    async 'seri-coz'(el){ await SP.Seri.coz(el.dataset.id); UI.toast(yz('spi.today.dondurma-geri-alindi')); SP.App.render(); },
    async 'seri-tatil'(){ S.ui.tatilSec = true; SP.App.render(); },
    async 'seri-tatil-vazgec'(){ S.ui.tatilSec = false; SP.App.render(); },
    async 'seri-tatil-sinir'(){
      const e = document.getElementById('seri-tatil-sinir');
      const ham = e ? String(e.value).trim() : '';
      if(!ham){ UI.toast(yz('spi.today.yillik-tatil-siniri-icin-bir')); return; }
      const r = await SP.Seri.yillikTatilAyarla(Number(ham));
      if(!r.ok){ UI.toast(r.why, { life:5000 }); return; }
      SP.App.render();
      UI.toast(yz('spi.today.yillik-tatil-siniri') + r.sinir + ' gün', { undo:async () => {
        await SP.Seri.yillikTatilAyarla(r.onceki); SP.App.render(); } });
    },
    async 'seri-tatil-gun'(el){
      S.ui.tatilSec = false;
      const bugun = U.todayISO();
      const bit = SP.Seri.gunEkle(bugun, Number(el.dataset.gun) - 1);
      const r = await SP.Seri.dondur(bugun, bit, 'tatil');
      UI.toast(r.ok ? yz('spi.today.tatil-modu-3') + U.fmtShort(bugun) + ' – ' + U.fmtShort(bit) + ': seri korunuyor, HKM soru sormuyor'
        : r.why, { life:5000 });
      if(r.ok && SP.Hedefler && SP.Hedefler.ag) SP.Hedefler.ag.planla();
      SP.App.render();
    },
    async 'seri-tatil-bitir'(){
      const r = await SP.Seri.tatiliBitir();
      UI.toast(r.ok ? yz('spi.today.tatil-bitti-hos-geldin') : r.why);
      if(r.ok && SP.Hedefler && SP.Hedefler.ag) SP.Hedefler.ag.planla();
      SP.App.render();
    },
    async 'hedef-durum'(el){
      const r = await SP.Hedefler.durumDegistir(el.dataset.id, el.dataset.durum);
      UI.toast(r.ok ? yz('spi.today.hedef-guncellendi') + (r.not ? '. ' + r.not : '') : r.why);
      SP.App.render();
    },
    async 'hedef-plan-onizle'(el){ S.ui.planOnizle = el.dataset.id; SP.App.render(); },
    async 'hedef-plan-kapat'(){ S.ui.planOnizle = null; SP.App.render(); },
    async 'hedef-plan-uygula'(el){
      const r = await SP.Plan.uygulaHedef(el.dataset.id);
      S.ui.planOnizle = null;
      if(r.ok) SP.UI.onayMuhru();
      UI.toast(r.ok ? yz('spi.today.plan-uygulandi-geri-almak-is') : r.why);
      SP.App.render();
    },
    async 'hedef-uyarla-ac'(el){ S.ui.uyarla = el.dataset.id; SP.App.render(); },
    async 'hedef-uyarla-kapat'(){ S.ui.uyarla = null; SP.App.render(); },
    async 'hedef-uyarla-sec'(el){
      const H = window.LIFEOS.Hedef;
      const h = SP.Hedefler.liste().find(x => x.id === el.dataset.id);
      if(!h) return;
      const paket = SP.Hedefler.PAKETLER.find(x => x.id === h.paket);
      const bugun = U.todayISO();
      const u = H.uyarla(h, paket, {}, bugun);
      const x = u.senaryolar[Number(el.dataset.i)];
      if(!x){ UI.toast(yz('spi.today.bu-secenek-artik-gecerli-deg')); return; }
      const g = await SP.Plan.geriAlHedef(h.id);
      if(!g.ok && SP.Plan.aktif(h.id)){ UI.toast(g.why || yz('spi.today.eski-plan-geri-alinamadi-hed')); return; }
      await SP.Hedefler.kaydet(H.uyarlamaUygula(u.hedef, x, paket, {}, bugun));
      S.ui.uyarla = null;
      S.ui.planOnizle = h.id;
      UI.toast(yz('spi.today.hedef-yeni-tarihle-guncellen'));
      SP.App.render();
    },
    async 'hedef-plan-geri'(el){
      const r = await SP.Plan.geriAlHedef(el.dataset.id);
      UI.toast(r.ok ? yz('spi.today.plan-geri-alindi-beslenme-he')
        : (r.why || yz('spi.today.geri-alinamadi')));
      SP.App.render();
    },
    async 'hedef-plan-king'(el){
      const r = await SP.Plan.kingeIlet(el.dataset.id);
      UI.toast(r.metin);
      SP.App.render();
    },
    async 'king-bildirim-okundu'(el){
      const id = el.dataset.id;
      S.ui.hkmBildirim = (S.ui.hkmBildirim || []).filter(b => String(b.id) !== String(id));
      SP.App.render();
      const r = await SP.Plan.okundu(id);
      if(!r.ok) UI.toast(yz('spi.today.okundu-isareti-merkeze-bildi'));
    },
    /* Elle gonderim: kullanicinin ACIKCA istedigi an. Kapaliyken
       zorlanmaz — kapali bir seyi «bir kerelik» calistirmak, kapali
       olmasini anlamsiz kilardi. */
    async 'hkm-gonder'(){
      UI.toast(yz('spi.today.hkm-u2019ye-gonderiliyor'));
      const r = await SP.Beacon.send({ reason:'manual' });
      UI.toast(r.ok ? 'HKM\u2019ye gönderildi.'
        : (yz('spi.today.gonderilemedi') + (r.note || r.reason || 'sebep bilinmiyor')));
      SP.App.render();
    },

    async 'signal-answer'(el){
      const inp = document.getElementById('sig-answer');
      const r = await SP.Signals.answer(el.dataset.id, inp ? inp.value : '');
      if(!r.ok){ UI.toast(r.error); return; }
      UI.toast(yz('spi.today.kaydedildi-sonucu-bir-sonrak'));
      SP.App.render();
    },

    async 'signal-dismiss'(el){
      await SP.Signals.dismiss(el.dataset.id);
      UI.toast(yz('spi.today.soru-kapatildi'));
      SP.App.render();
    },

    /* Eski sekme eylemi: Ayrıntı'nın bölümüne gider. Başka ekrandaysa önce
       Ayrıntı açılır, bölüm çizimden sonra görünür yapılır. */
    async 'day-tab'(el){
      const t = el.dataset.tab || 'giris';
      if(S.route !== 'gun'){ S.ui.dayTab = t; SP.App.go('gun'); return; }
      K.bolumeGit(t);
    },
    async 'shift-day'(el){
      const n = Number(el.dataset.value);
      S.ui.mealDate = n === 0 ? null : U.iso(U.addDays(U.parse(shownDate()), n));
      if(S.ui.mealDate === U.todayISO()) S.ui.mealDate = null;
      SP.App.render();
    },
    /* Şiddet tek düğmeden döner: hafif → orta → şiddetli → kapalı.
       Ayrı bir seçici koymak günlük giriş yükünü artırırdı. */
    async 'cycle-symptom'(el){
      const d = shownDate();
      const simdi = SP.Symptom.ofDay(d)[el.dataset.id] || 0;
      const sonraki = simdi >= 3 ? 0 : simdi + 1;
      await SP.Symptom.setSymptom(d, el.dataset.id, sonraki);
      await M.saveVitals(d, { symptomsLogged:true });
      SP.App.render();
    },
    async 'no-symptoms'(){
      const d = shownDate();
      await M.saveVitals(d, { symptoms:{}, symptomsLogged:true });
      UI.toast(yz('spi.today.bugun-sikayet-yok-olarak-kay'));
      SP.App.render();
    },
    async 'toggle-period'(el){
      const d = shownDate();
      await M.saveVitals(d, { period:!!el.checked });
      SP.App.render();
    },
    async 'open-day'(el){
      S.ui.mealDate = el.dataset.date === U.todayISO() ? null : el.dataset.date;
      SP.App.render();
    },
    /* Bir bardak ekler (eski tek dokunuş; bildirim ve betikler için
       duruyor). Gösterilen güne yazar (2026-10-25 düzeltmesi). */
    async 'su-ekle'(){
      const d = shownDate();
      const { b, ml } = suDurumu(d);
      await suYaz(d, (ml || 0) + b);
    },
    /* n'inci bardak: günü n bardak yapar; en üstteki doluysa bir azaltır.
       ±1 bardak gerçek ml'nin üstünden işler (suSonrasi, 2026-10-25). */
    async 'su-ayarla'(el){
      const n = Math.floor(Number(el && el.dataset && el.dataset.n));
      if(!(n >= 1)) return;
      const d = shownDate();
      await suYaz(d, suSonrasi(suDurumu(d), n));
      const y = document.querySelector('.su-bardak[data-n="' + n + '"][data-dolu]');
      if(y) y.classList.add('is-zip');
    },
    async 'dunku-sikayet'(){
      const d = shownDate();
      const dunku = dunkuSikayetler(d);
      if(!dunku){ SP.App.render(); return; }
      const v = M.vitalsOf(d);
      const once = { symptoms:Object.assign({}, (v && v.symptoms) || {}), symptomsLogged:!!(v && v.symptomsLogged) };
      await M.saveVitals(d, { symptoms:Object.assign({}, dunku), symptomsLogged:true });
      SP.App.render();
      UI.toast(yz('spi.today.dunku') + Object.keys(dunku).length + ' şikâyet bu güne yazıldı',
        { undo:async () => { await M.saveVitals(d, once); SP.App.render(); } });
    },
    async tus(el){
      const k = el.dataset.k;
      if(k === '⌫') tusTampon = tusTampon.slice(0, -1);
      else if(k === ','){ if(tusTampon.indexOf(',') < 0) tusTampon = (tusTampon || '0') + ','; }
      else if(tusTampon.replace(',', '').length < 5) tusTampon += k;
      const y = document.getElementById('tus-yuva');
      if(y) y.innerHTML = tusHtml(); else SP.App.render();
    },
    async 'tus-kaydet'(){
      const n = Number(String(tusTampon).replace(',', '.'));
      if(!tusTampon || !isFinite(n)){ UI.toast(yz('spi.today.once-degeri-yaz')); return; }
      const g = document.getElementById('v-weight');
      if(g){ g.value = String(n); await handle['save-vitals'](); return; }
      await M.saveVitals(shownDate(), { weight:n, weightAt:shownDate() === U.todayISO() ? new Date().toISOString() : undefined });
      tusTampon = '';
      SP.App.render();
    },
    async 'set-soreness'(el){
      await M.saveVitals(shownDate(), { soreness:Number(el.dataset.value) });
      SP.App.render();
    },
    'kestirme-ac'(){ kestirmeSheet(null); },
    async 'kestirme-kaydet'(){
      const dk = (document.getElementById('kz-dk') || {}).value || '';
      const bas = (document.getElementById('kz-bas') || {}).value || null;
      const d = shownDate();
      const r = await SP.Uyku.ekle(d, { dk:Number(String(dk).replace(',', '.')), bas });
      if(!r.ok){ kestirmeSheet(r.why); return; }
      UI.closeSheet();
      UI.toast(yz('spi.today.kisa-uyku-kaydedildi'), { undo:async () => { await SP.Uyku.sil(d, r.kayit.id); SP.App.render(); } });
      SP.App.render();
    },
    async 'kestirme-sil'(el){
      const d = shownDate();
      const eski = await SP.Uyku.sil(d, el.dataset.id);
      if(!eski) return;
      UI.toast(yz('spi.today.kisa-uyku-silindi'), { undo:async () => { await SP.Uyku.ekle(d, eski); SP.App.render(); } });
      SP.App.render();
    },
    async 'save-vitals'(){
      /* YALNIZ DEĞİŞTİRİLEN ALAN YAZILIR (hesap.js, 2026-10-05). Form
         çizildikten sonra öteki cihazdan gelen değer modelde tazelenir,
         ama kullanıcı yazarken ekran yeniden çizilmez (yazılan silinmesin).
         Dokunulmamış alanın formdaki ESKİ değerini yazmak o değişikliği
         ezerdi. «Değişti» = alanın değeri çizildiği değerden farklı;
         boşaltmak da değişikliktir. */
      const degisti = el => el.value !== el.defaultValue;
      const patch = {};
      FIELDS.forEach(f => {
        const el = document.getElementById('v-' + f.id);
        if(!el || !degisti(el)) return;
        const raw = el.value.trim();
        patch[f.id] = raw === '' ? null : Number(raw.replace(',', '.'));
      });
      /* 018 ŞÜPHELİ GİRİŞ: önceki ölçümden çok sapan sayı kaydedilmeden
         önce sorulur («714 kg» → «71,4 kg olarak kaydet»). Önceki değer
         yoksa soru yok: veri yok sıfır değildir. Seçim bir kez geçerlidir. */
      const SAYI = (window.LIFEOS || {}).SAYI;
      const yuva = document.getElementById('suphe-yuva');
      if(SAYI && yuva && !supheGecti){
        const d = shownDate();
        const once = Object.keys(S.vitals || {}).filter(t => t < d).sort().reverse();
        /* Eşik: kilo katalogdaki %5; uyku ve nabız gün gün doğal olarak
           oynar, yalnız yazım hatası boyundaki sapma (×2) sorulur. */
        for(const [alan, tur, birim, oran] of [['weight', 'kilo', 'kg', null], ['sleep', 'uyku', 'saat', 1], ['rhr', 'nabiz', 'atım', 1]]){
          if(patch[alan] == null) continue;
          const t = once.find(x => S.vitals[x] && S.vitals[x][alan] != null);
          const r = SAYI.suphe(patch[alan], t ? Number(S.vitals[t][alan]) : null, oran ? { tur, birim, oran } : { tur, birim });
          if(r.supheli){ supheAlan = alan; yuva.innerHTML = SAYI.supheHtml(r); return; }
        }
      }
      supheGecti = false; supheAlan = null;
      const note = document.getElementById('v-note');
      if(note && degisti(note)) patch.note = note.value.trim();
      /* 088: tartının KAYIT ANI (yalnız bugün girilen ve değişen tartı). */
      const d = shownDate();
      const eski = M.vitalsOf(d);
      if(patch.weight != null && d === U.todayISO() && (!eski || eski.weight !== patch.weight)) patch.weightAt = new Date().toISOString();
      tusTampon = '';
      /* GERİ AL (2026-10-25; kullanıcı: «spi için daha işlevli veri
         girişi, sürtünmeyi azaltacak teknikler ile daha güzel yap»): yalnız
         yazılan alanların önceki değeri saklanır; geri al onları geri koyar
         ve bu kaydın kapattığı tartı hatırlatmasını yeniden açar. */
      const onceki = {};
      Object.keys(patch).forEach(k => { onceki[k] = eski && eski[k] !== undefined ? eski[k] : (k === 'note' ? '' : null); });
      await M.saveVitals(d, patch);
      /* Kaydedilen tartı vakti gelen «sabah ölçümü» hatırlatmasını kapatır. */
      const kapanan = patch.weight != null ? await hatirlatKapat('olcum', d) : [];
      const flags = M.openFlags().filter(f => !f.ack);
      UI.toast(flags.length ? yz('spi.today.kaydedildi') + flags.length + ' kırmızı bayrak açık' : 'Kaydedildi',
        { undo:async () => { await M.saveVitals(d, onceki); await hatirlatAc(kapanan, d); SP.App.render(); } });
      SP.App.render();
    },
  
    /* 018: seçilen değer alana yazılır ve kayıt SORUSUZ bir kez daha denenir. */
    async 'suphe-kaydet'(el){
      const g = supheAlan && document.getElementById('v-' + supheAlan);
      if(g) g.value = el.dataset.deger;
      supheGecti = true;
      await handle['save-vitals']();
    },
    async 'suphe-duzelt'(){
      const y = document.getElementById('suphe-yuva');
      if(y) y.innerHTML = '';
      const g = supheAlan && document.getElementById('v-' + supheAlan);
      if(g){ g.focus(); g.select && g.select(); }
    },

    async 'flag-ack'(el){
      await M.ackFlag(el.dataset.id);
      UI.toast(yz('spi.today.i-saretlendi-kayit-gecmiste'));
      SP.App.render();
    },
    async 'refresh-briefing'(){
      UI.toast(yz('spi.today.brifing-uretiliyor'));
      await SP.Office.dailyBriefing(true);
      SP.App.render();
    },
    async 'quick-meal'(){
      const el = document.getElementById('quick-meal');
      if(!el || !el.value.trim()) return;
      const parsed = SP.Parse.parseMeal(el.value);
      if(!parsed.items.length){ UI.toast(parsed.note); return; }
      const slot = SP.Screens.meals.guessSlot();
      const meal = M.newMeal(slot);
      meal.items = parsed.items.map(i => ({ foodId:i.foodId, g:i.g, cert:i.cert, portion:i.portion }));
      meal.note = el.value.trim();
      await M.addMeal(U.todayISO(), meal);
      el.value = '';
      UI.toast(parsed.items.length + ' gıda eklendi'
        + (parsed.unmatched.length ? ' · ' + parsed.unmatched.length + ' parça eşleşmedi' : ''));
      SP.App.render();
    },
  };

  const onayHandle = {};
  ONAY_EYLEMLERI.forEach(a => { handle[a] = onayHandle[a] = onayIsleyici(a); });

  return {
    id:'today',
    /* iPhone Faz 6 (2026-10-02): Bugün'de açık dört giriş kartı vardı; günün
       hissi isteğe bağlı bir kayıttır — şerit, dokununca açılır. */
    kucukVarsayilan:['günün-hissi', 'günün-ölçümü'],
    title:yz('spi.today.bugun'),
    /* Bu sayfanın başlığı BUGÜNÜ anlatır. Sıradaki hamle başka bir
       bölüme aitse (tahlil, sepet) onu buraya başlık yapmak kafa
       karıştırıyordu: kullanıcı günlük sayfasını açıp tahlil cümlesi
       okuyordu. Hamle artık düğme olarak duruyor, başlık olarak değil. */
    headlineOz:'004',
    /* Siri «Bugün ne var?» (hesap sunucu sözü 21): bugünün cümlesi ve
       sıradaki hatırlatma. İlaç adı SÖYLENMEZ (hatirlat.js söz 3): yalnız
       «ilaç ya da takviye». Kural metni, model yok. */
    kapak,
    /* Analiz'in başındaki «Bugün» özeti ve onun öneri düğmeleri (Faz 2). */
    ozet, panoUst:PanoUst, onayHandle,
    /* Günü kapat: app.js kurar (GUNUKAPAT.kur); satırlar ve tazeleme burada. */
    gunuKapat:{ satirlar:gkSatirlari, tazele:gkTazele, ac:gkAc },
    sesli(simdi){
      const now = simdi || new Date();
      const r = SP.Move.readiness(SP.U.todayISO());
      let c = !r.ok ? bosBaslik(SP.U.todayISO())
        : (SP.Calc.minimumDay().complete ? yz('spi.today.bugun-tamam-toparlanma') : yz('spi.today.toparlanma-2'))
          + r.band.label.toLocaleLowerCase('tr-TR') + '.';
      const h = SP.Hatirlat ? SP.Hatirlat.bugun(now).find(x => x.durum === 'sonra') : null;
      if(h) c += ' Sıradaki hatırlatma ' + h.saat + ', ' + (h.tur === 'ilac' ? 'ilaç ya da takviye' : h.ad.toLocaleLowerCase('tr-TR')) + '.';
      return c;
    },
    headline(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      if(!r.ok) return bosBaslik(d);
      const m = SP.Calc.minimumDay();
      if(m.complete) return yz('spi.today.bugun-tamam-toparlanma-2')
        + r.band.label.toLocaleLowerCase('tr-TR') + '.';
      return yz('spi.today.toparlanma-2') + r.band.label.toLocaleLowerCase('tr-TR') + '.';
    },
    lede(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      if(!r.ok){
        return yz('spi.today.uyku-suresini-yazman-bile-ye-2')
          + 'çıkar. Boş bıraktığın alan sıfır sayılmaz, hesaba hiç girmez. Öğünde ev '
          + 'ölçüsü «tahmin», tartılmış gram «ölçüldü» olarak yazılır.';
      }
      const m = SP.Calc.minimumDay();
      const eksik = m.rows.filter(x => !x.ok).map(x => x.label.toLocaleLowerCase('tr-TR'));
      return r.band.order
        + (eksik.length ? ' Asgari gün için kalan: ' + eksik.join(', ') + '.' : '')
        + ' Boş bıraktığın alan sıfır sayılmaz; uyku tek başına yeter. Öğünde ev ölçüsü «tahmin», '
        + 'tartılmış gram «ölçüldü» olarak yazılır.';
    },
    stats(){
      const m = SP.Calc.minimumDay();
      const r = SP.Move.readiness(shownDate());
      const out = [];
      if(r.ok) out.push({ value:r.score, unit:'/100', label:'toparlanma' });
      out.push({ value:m.done + '/' + m.total, label:yz('spi.today.asgari-gun-2') });
      out.push({ value:SP.Calc.streak(), label:yz('spi.today.gun-seri') });
      const f = M.openFlags().filter(x => !x.ack).length;
      if(f) out.push({ value:f, label:yz('spi.today.kirmizi-bayrak') });
      return out.slice(0, 4);
    },
    /* v5: tarih ve toparlanma üst satırdadır; alt başlık tekrar etmez. */
    ust(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      /* Tarihsiz (kullanıcı, 2026-10-02); «veri bekliyor» başlıkta zaten
         yazılı. Satır başlığın yanındaki bilgi kartında durur. */
      return r.ok ? U.esc(yz('spi.today.toparlanma-2') + r.score + '/100') : '';
    },
    subtitle(){ return ''; },
    /* Sayfa başı sade (kullanıcı, 2026-10-02): sıradaki hamle başlıkta
       düğme değil, «Bugün» widget'ının ilk maddesidir. */
    actions(){ return ''; },
    render, handle,
    /* Su bardaklarının klavyesi (radio grubu) her çizimden sonra bağlanır. */
    afterRender:suKlavye,
    /* Bugün › Ayrıntı: aynı işleyiciler, ayrı bir çizim. */
    ayrinti:{
      id:'gun',
      /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
         bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
         «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
      kucukVarsayilan:['neden-bunlar', 'taban-çizgin', 'son-iki-hafta'],
      title:yz('spi.today.gunu-duzenle'),
      subtitle(){ return yz('spi.today.olcum-formu-sikayetler-ozet'); },
      actions(){ return ''; },
      render:renderAyrinti, afterRender:afterRenderAyrinti, handle,
    },
    /* Plan › Hedefler: aynı işleyiciler, ayrı bir çizim. */
    hedefler:{
      id:'hedefler',
      title:yz('spi.today.hedefler'),
      subtitle(){
        const n = SP.Hedefler ? SP.Hedefler.aktifler().length : 0;
        return n ? n + ' etkin hedef' : 'henüz hedef yok';
      },
      lede(){ return yz('spi.today.hedef-danisma-da-konusularak'); },
      actions(){ return ''; },
      render:renderHedefler, handle,
    },
  };
})();

SP.Screens.gun = SP.Screens.today.ayrinti;
SP.Screens.hedefler = SP.Screens.today.hedefler;
