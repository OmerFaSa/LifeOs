/* Tarih verisi — kronoloji iskeleti, kaynak turleri ve tarih yazimi okullari.

   Tarih ogrenmenin iki yaygin bicimi vardir ve ikisi de eksiktir: tarih
   SIRALAMASI ezberlemek (1453, 1789, 1923...) ve tarih HIKAYESI dinlemek.
   Ilki baglamsiz, ikincisi denetimsizdir.

   ESP'nin tarihi ucuncu bicimdir: bir olay, bir DONEME ve bir NEDEN
   zincirine baglanir; zincirin her halkasi bir KAYNAGA dayanir; kaynagin
   kendisi elestirilir. Ezber yalnizca iskelettir — iskeletsiz beden
   duramaz, ama iskelet tek basina beden degildir.

   Buradaki olay listesi bir MUFREDAT DEGIL bir TOHUMDUR: kullanici kendi
   olaylarini ekler. Tohumun isi bos bir zaman seridini kullanilabilir
   yapmaktir; bir tarihcinin kanonu olmak degil.

   Yil gosterimi: negatif yil MO demektir (-753 = MO 753). Tek bir sayi
   kullanmak karsilastirmayi aritmetige indirger; "MO 5. yuzyil" ile
   "5. yuzyil"i siralamak boylece hatasiz olur. */

window.ESP = window.ESP || {};

/* ------------------------------------------------------------------ donemler

   Donem sinirlari TARTISMALIDIR ve oyle gosterilir. "Ortacag 476'da basladi"
   demek bir kararidir, bir olcum degil. `disputed` alani bunu ekranda
   gorunur kilar: kullanici sinirin kendisinin bir yorum oldugunu bilmeli. */
ESP.ERAS = [
  { id:'tarihoncesi', label:'Tarih öncesi', from:-3000000, to:-3200,
    note:'Yazıdan önce. Kaynak: arkeoloji, antropoloji — yazılı tanık yok.',
    disputed:'Bitiş, yazının bulunuşuna bağlanır; yazı her yerde aynı anda çıkmadı.' },
  { id:'ilkcag', label:'İlk Çağ', from:-3200, to:476,
    note:'Yazının bulunuşundan Batı Roma\'nın yıkılışına.',
    disputed:'476 Batı\'ya özgü bir tarihtir; Doğu Roma 1453\'e kadar sürdü.' },
  { id:'ortacag', label:'Orta Çağ', from:476, to:1453,
    note:'Feodalite, üç büyük dinin kurumsallaşması, İslam biliminin yükselişi.',
    disputed:'«Karanlık çağ» adlandırması 19. yy Avrupa merkezli bir yargıdır.' },
  { id:'yenicag', label:'Yeni Çağ', from:1453, to:1789,
    note:'Coğrafi keşifler, Rönesans, Reform, mutlak monarşiler, bilim devrimi.',
    disputed:'1453 mü 1492 mi tartışmalıdır; ikisi de Avrupa merkezlidir.' },
  { id:'yakincag', label:'Yakın Çağ', from:1789, to:1945,
    note:'Devrimler, sanayileşme, ulus-devlet, sömürgecilik, iki dünya savaşı.',
    disputed:'Bitişi 1914, 1918 ya da 1945 sayılabilir; her biri ayrı bir tez.' },
  { id:'cagdas', label:'Çağdaş', from:1945, to:9999,
    note:'Soğuk Savaş, dekolonizasyon, bilgi çağı.',
    disputed:'Yaşanan dönemin tarihi yazılamaz denir; belge açılmamıştır.' },
];

ESP.ERA_BY_ID = ESP.ERAS.reduce(function(m, e){ m[e.id] = e; return m; }, {});

/* Bir yilin hangi doneme dustugu. Donemler ortusmez; ilk eslesen doner. */
ESP.eraOf = function(year){
  if(typeof year !== 'number' || !isFinite(year)) return null;
  for(let i = 0; i < ESP.ERAS.length; i++){
    const e = ESP.ERAS[i];
    if(year >= e.from && year <= e.to) return e;
  }
  return null;
};

/* Yuzyil. Dikkat: MO yuzyil hesabi farklidir ve "sifirinci yuzyil" yoktur.
   MS 1-100 => 1. yuzyil; MO 100-1 => MO 1. yuzyil. */
ESP.centuryOf = function(year){
  if(typeof year !== 'number' || !isFinite(year) || year === 0) return null;
  return year > 0 ? Math.ceil(year / 100) : -Math.ceil(-year / 100);
};

ESP.centuryLabel = function(c){
  if(c == null) return '—';
  return c > 0 ? c + '. yüzyıl' : 'MÖ ' + (-c) + '. yüzyıl';
};

ESP.yearLabel = function(y){
  if(typeof y !== 'number' || !isFinite(y)) return '—';
  return y < 0 ? 'MÖ ' + (-y) : String(y);
};

/* ------------------------------------------------------------------ alanlar

   Bir olayin turu. Sayma degil DENGE icin var: yalnizca savas tarihi
   calisan biri "tarih biliyor" sayilmaz; ekonomik ve dusunsel olaylar
   gorunmedikce nedensellik hep askeri kalir. */
ESP.EVENT_KINDS = [
  { id:'siyasi',    label:'Siyasi',    note:'Devlet, iktidar, savaş, antlaşma.' },
  { id:'ekonomik',  label:'Ekonomik',  note:'Ticaret, üretim, kriz, teknoloji.' },
  { id:'dusunsel',  label:'Düşünsel',  note:'Felsefe, bilim, din, sanat.' },
  { id:'toplumsal', label:'Toplumsal', note:'Nüfus, sınıf, şehir, salgın, göç.' },
];

ESP.EVENT_KIND_BY_ID = ESP.EVENT_KINDS.reduce(function(m, k){ m[k.id] = k; return m; }, {});

/* Bolgeler — "dunya tarihi" derken yalnizca Avrupa'ya bakmamak icin. */
ESP.REGIONS = [
  { id:'anadolu',  label:'Anadolu ve Türk dünyası' },
  { id:'avrupa',   label:'Avrupa' },
  { id:'ortadogu', label:'Orta Doğu' },
  { id:'asya',     label:'Asya' },
  { id:'afrika',   label:'Afrika' },
  { id:'amerika',  label:'Amerika' },
  { id:'dunya',    label:'Küresel' },
];

/* --------------------------------------------------------------- tohum olaylar

   Seksen kadar donum noktasi. Her biri bir DONEME, bir ALANA ve bir
   BOLGEYE baglidir; boylece "18. yuzyilda Asya'da ne oluyordu" sorusu
   cevaplanabilir hale gelir.

   `why` alani olayin NEDEN donum noktasi sayildigini soyler. Bir olayin
   onemi kendiliginden gorunmez; gorunur yapmak verinin isidir. */
ESP.SEED_EVENTS = [
  { year:-3200, title:'Çivi yazısının bulunuşu', region:'ortadogu', kind:'dusunsel',
    why:'Bellek kişiden çıkıp kuruma geçti: tarih burada başlar.' },
  { year:-2500, title:'Giza piramitleri', region:'afrika', kind:'siyasi',
    why:'Merkezî devletin artı ürünü seferber edebildiğinin kanıtı.' },
  { year:-1750, title:'Hammurabi kanunları', region:'ortadogu', kind:'siyasi',
    why:'Yazılı hukuk: iktidar keyfîlikten kurala geçmeye zorlanıyor.' },
  { year:-1274, title:'Kadeş Savaşı ve antlaşması', region:'ortadogu', kind:'siyasi',
    why:'Bilinen ilk yazılı barış antlaşması.' },
  { year:-753, title:'Roma\'nın kuruluşu (efsanevi)', region:'avrupa', kind:'siyasi',
    why:'Efsane ile tarihin ayrıldığı yer: tarih sayılan her tarih ölçülmüş değildir.' },
  { year:-563, title:'Buddha', region:'asya', kind:'dusunsel',
    why:'Hint düşüncesinde kurumsal dine karşı bireysel kurtuluş.' },
  { year:-551, title:'Konfüçyüs', region:'asya', kind:'dusunsel',
    why:'Çin devlet geleneğinin ahlakî temeli.' },
  { year:-508, title:'Atina demokrasisi', region:'avrupa', kind:'siyasi',
    why:'Yurttaşın yönetime doğrudan katılımı — sınırlı ama ilk.' },
  { year:-490, title:'Pers Savaşları', region:'avrupa', kind:'siyasi',
    why:'«Doğu–Batı» ayrımının tarih yazımındaki ilk kurgusu.' },
  { year:-399, title:'Sokrates\'in ölümü', region:'avrupa', kind:'dusunsel',
    why:'Düşünce ile şehir arasındaki gerilimin kalıcı simgesi.' },
  { year:-331, title:'Büyük İskender ve Helenizm', region:'asya', kind:'siyasi',
    why:'Kültürlerin karışması: fetih bir düşünce taşıyıcısı olabiliyor.' },
  { year:-221, title:'Çin\'in birleşmesi (Qin)', region:'asya', kind:'siyasi',
    why:'Standart yazı, ölçü ve para: devletin teknik altyapısı.' },
  { year:-146, title:'Kartaca\'nın yıkılışı', region:'afrika', kind:'siyasi',
    why:'Akdeniz ticaret rekabetinin askerî çözümü.' },
  { year:-44, title:'Caesar suikastı', region:'avrupa', kind:'siyasi',
    why:'Cumhuriyetten imparatorluğa geçişin kırılma anı.' },
  { year:313, title:'Milano Fermanı', region:'avrupa', kind:'dusunsel',
    why:'Hristiyanlığın yasaklıdan devlet ortağına dönüşü.' },
  { year:395, title:'Roma\'nın ikiye ayrılması', region:'avrupa', kind:'siyasi',
    why:'Doğu ve Batı\'nın bin yıllık ayrı yollarının başlangıcı.' },
  { year:476, title:'Batı Roma\'nın yıkılışı', region:'avrupa', kind:'siyasi',
    why:'Dönem sınırı olarak seçilmiş tarih — bir yorumun sayıya dönüşmesi.' },
  { year:622, title:'Hicret', region:'ortadogu', kind:'dusunsel',
    why:'Bir takvimin başlangıcı: zaman ölçüsü de bir tarihsel karardır.' },
  { year:751, title:'Talas Savaşı', region:'asya', kind:'ekonomik',
    why:'Kâğıdın Çin\'den batıya geçişi — bilgi taşıma maliyeti düşüyor.' },
  { year:800, title:'Charlemagne\'ın taç giymesi', region:'avrupa', kind:'siyasi',
    why:'Batı\'da imparatorluk fikrinin dinî meşruiyetle dirilişi.' },
  { year:1071, title:'Malazgirt', region:'anadolu', kind:'siyasi',
    why:'Anadolu\'nun Türkleşme sürecinin açılışı.' },
  { year:1095, title:'Haçlı Seferleri başlıyor', region:'ortadogu', kind:'siyasi',
    why:'İki uygarlığın uzun ve çift yönlü teması.' },
  { year:1206, title:'Moğol İmparatorluğu', region:'asya', kind:'siyasi',
    why:'Avrasya\'yı tek bir ticaret ve salgın ağına bağladı.' },
  { year:1215, title:'Magna Carta', region:'avrupa', kind:'siyasi',
    why:'İktidarın sınırlanabileceği fikrinin yazılı ilk örneği.' },
  { year:1299, title:'Osmanlı Beyliği', region:'anadolu', kind:'siyasi',
    why:'Altı yüzyıl sürecek bir devlet geleneğinin başlangıcı.' },
  { year:1347, title:'Kara Veba', region:'avrupa', kind:'toplumsal',
    why:'Nüfusun üçte biri: emek kıtlaşınca feodal bağ çözülüyor.' },
  { year:1377, title:'İbn Haldûn, Mukaddime', region:'afrika', kind:'dusunsel',
    why:'Tarihin kendisini bir bilim olarak kuran ilk deneme.' },
  { year:1453, title:'İstanbul\'un fethi', region:'anadolu', kind:'siyasi',
    why:'Orta Çağ\'ın sonu sayılan tarih; ticaret yolları yeniden çiziliyor.' },
  { year:1455, title:'Matbaa (Gutenberg)', region:'avrupa', kind:'ekonomik',
    why:'Kopyalama maliyeti çöküyor: fikir yayılımı sınıf atlıyor.' },
  { year:1492, title:'Amerika\'ya varış', region:'amerika', kind:'ekonomik',
    why:'Kıtalar arası biyolojik ve ekonomik takas — ve yıkım.' },
  { year:1517, title:'Reform', region:'avrupa', kind:'dusunsel',
    why:'Dinî otoritenin bölünmesi; okuryazarlık bir siyasi güç oluyor.' },
  { year:1543, title:'Kopernik', region:'avrupa', kind:'dusunsel',
    why:'İnsanın evrendeki merkez konumunu kaybetmesi.' },
  { year:1571, title:'İnebahtı', region:'avrupa', kind:'siyasi',
    why:'Akdeniz\'de deniz gücü dengesinin dönüm noktası.' },
  { year:1648, title:'Vestfalya Barışı', region:'avrupa', kind:'siyasi',
    why:'Egemen devlet sisteminin doğuşu — bugünkü dünya haritasının mantığı.' },
  { year:1687, title:'Newton, Principia', region:'avrupa', kind:'dusunsel',
    why:'Doğanın matematikle yazılabileceği iddiasının kanıtı.' },
  { year:1699, title:'Karlofça', region:'anadolu', kind:'siyasi',
    why:'Osmanlı\'nın ilk büyük toprak kaybı: yön değişiyor.' },
  { year:1760, title:'Sanayi Devrimi başlıyor', region:'avrupa', kind:'ekonomik',
    why:'Enerji kaynağı kas ve rüzgârdan kömüre geçiyor.' },
  { year:1776, title:'Amerikan Bağımsızlık Bildirgesi', region:'amerika', kind:'siyasi',
    why:'Haklar teorisinin devlet kuran bir metne dönüşmesi.' },
  { year:1789, title:'Fransız Devrimi', region:'avrupa', kind:'siyasi',
    why:'Egemenliğin hanedandan ulusa geçişi.' },
  { year:1839, title:'Tanzimat Fermanı', region:'anadolu', kind:'siyasi',
    why:'Osmanlı\'da hukuk devleti ve eşit yurttaşlık girişimi.' },
  { year:1848, title:'Halkların baharı', region:'avrupa', kind:'toplumsal',
    why:'Ulusçuluk ve işçi hareketinin aynı anda sahneye çıkışı.' },
  { year:1859, title:'Darwin, Türlerin Kökeni', region:'avrupa', kind:'dusunsel',
    why:'İnsanın doğa içindeki yerinin yeniden tanımlanması.' },
  { year:1869, title:'Süveyş Kanalı', region:'afrika', kind:'ekonomik',
    why:'Mesafe kısalınca sömürge yönetimi ucuzluyor.' },
  { year:1876, title:'I. Meşrutiyet', region:'anadolu', kind:'siyasi',
    why:'Osmanlı\'da anayasa ve meclis denemesi.' },
  { year:1884, title:'Berlin Konferansı', region:'afrika', kind:'siyasi',
    why:'Bir kıtanın masa başında paylaşılması.' },
  { year:1908, title:'II. Meşrutiyet', region:'anadolu', kind:'siyasi',
    why:'Siyasi partiler ve basın hayatının açılışı.' },
  { year:1914, title:'I. Dünya Savaşı', region:'dunya', kind:'siyasi',
    why:'İmparatorluklar çağının sonu.' },
  { year:1917, title:'Rus Devrimi', region:'avrupa', kind:'siyasi',
    why:'Kapitalizme alternatif bir devlet modelinin kuruluşu.' },
  { year:1918, title:'İspanyol gribi', region:'dunya', kind:'toplumsal',
    why:'Savaştan çok insan öldüren salgın — tarih yazımında uzun süre görünmedi.' },
  { year:1919, title:'Kurtuluş Savaşı başlıyor', region:'anadolu', kind:'siyasi',
    why:'İşgale karşı örgütlü direniş ve yeni bir meşruiyet kaynağı.' },
  { year:1923, title:'Cumhuriyet\'in ilanı', region:'anadolu', kind:'siyasi',
    why:'Egemenliğin kaynağının hanedandan millete geçişi.' },
  { year:1929, title:'Büyük Buhran', region:'dunya', kind:'ekonomik',
    why:'Piyasanın kendi kendini düzelttiği inancının kırılması.' },
  { year:1939, title:'II. Dünya Savaşı', region:'dunya', kind:'siyasi',
    why:'Sanayi kapasitesinin yok etmeye koşulması.' },
  { year:1945, title:'Atom bombası ve BM', region:'dunya', kind:'siyasi',
    why:'İnsanlığın kendini yok edebilme eşiği ve buna karşı kurulan düzen.' },
  { year:1948, title:'İnsan Hakları Evrensel Bildirgesi', region:'dunya', kind:'dusunsel',
    why:'Devletin yurttaşına karşı da sınırlanabileceği iddiası.' },
  { year:1948, title:'İsrail\'in kuruluşu', region:'ortadogu', kind:'siyasi',
    why:'Orta Doğu\'nun bugünkü sorunlarının merkezindeki kırılma.' },
  { year:1949, title:'Çin Halk Cumhuriyeti', region:'asya', kind:'siyasi',
    why:'Dünya nüfusunun beşte birinin yeni bir yola girmesi.' },
  { year:1960, title:'Afrika\'nın bağımsızlık yılı', region:'afrika', kind:'siyasi',
    why:'On yedi devletin aynı yıl kurulması: dekolonizasyon.' },
  { year:1969, title:'Ay\'a iniş', region:'dunya', kind:'dusunsel',
    why:'Teknolojik kapasitenin ve Soğuk Savaş rekabetinin zirvesi.' },
  { year:1973, title:'Petrol krizi', region:'dunya', kind:'ekonomik',
    why:'Enerji bağımlılığının siyasi silaha dönüşmesi.' },
  { year:1989, title:'Berlin Duvarı\'nın yıkılışı', region:'avrupa', kind:'siyasi',
    why:'İki kutuplu dünyanın sonu.' },
  { year:1991, title:'SSCB\'nin dağılması', region:'asya', kind:'siyasi',
    why:'On beş yeni devlet ve yeni bir güç boşluğu.' },
  { year:1991, title:'World Wide Web', region:'dunya', kind:'ekonomik',
    why:'Bilgi dağıtım maliyetinin ikinci kez çökmesi (ilki matbaa).' },
  { year:2008, title:'Küresel finans krizi', region:'dunya', kind:'ekonomik',
    why:'Finansallaşmanın sınırları ve kurtarma tartışması.' },
];

/* ------------------------------------------------------- kaynak elestirisi

   Tarih ogrenmenin en cok atlanan kismi budur: bir bilgi nereden geliyor?
   Her madde bir SORUDUR, bir kural degil — cevabi kullanici verir, sistem
   yalnizca sormayi birakmaz. */
ESP.SOURCE_KINDS = [
  { id:'primary', label:'Birincil', note:'Olayın tanığı ya da dönemin kendi belgesi: '
    + 'ferman, mektup, gazete, kitabe, arkeolojik buluntu.' },
  { id:'secondary', label:'İkincil', note:'Sonradan yazılmış inceleme: '
    + 'tarih kitabı, makale, tez.' },
  { id:'tertiary', label:'Üçüncül', note:'Derleme: ansiklopedi, ders kitabı, ' 
    + 'popüler özet. Başlangıç için iyi, kanıt için zayıf.' },
];

ESP.SOURCE_CRITIQUE = [
  { id:'kim', q:'Bu kaynağı kim yazdı ve olayla ilişkisi neydi?',
    note:'Tanık mı, duyan mı, çıkarı olan mı?' },
  { id:'ne-zaman', q:'Olaydan ne kadar sonra yazıldı?',
    note:'Arada geçen süre belleği ve niyeti değiştirir.' },
  { id:'kime', q:'Kime yazıldı?',
    note:'Bir padişaha yazılan zafername ile özel mektup aynı şeyi söylemez.' },
  { id:'cikar', q:'Yazarın bu anlatıdan kazancı ne?',
    note:'Meşrulaştırma, aklama, suçlama — hepsi bir çıkar biçimidir.' },
  { id:'ic-tutarlilik', q:'Metin kendi içinde tutarlı mı?',
    note:'Aynı olayı iki yerde farklı anlatıyor mu?' },
  { id:'dis-tutarlilik', q:'Bağımsız bir kaynak bunu doğruluyor mu?',
    note:'Tek kaynağa dayanan bir iddia bir tezdir, bir olgu değil.' },
  { id:'suskunluk', q:'Kaynağın söylemediği ne?',
    note:'Suskunluk kanıt değildir — ama sistematik suskunluk bir sorudur.' },
  { id:'dil', q:'Hangi dilde ve hangi çeviriden okuyorsun?',
    note:'Çeviri bir yorumdur; anahtar kavramlarda aslına bakılır.' },
];

/* ---------------------------------------------------------- tarih yazimi okullari

   Ayni olay, farkli okulda farkli bir hikayedir. Bunu gormek "tarih
   ogrenmek" ile "tarihsel dusunmek" arasindaki fark. */
ESP.HISTORIOGRAPHY = [
  { id:'olaysal', label:'Olaysal / siyasi tarih',
    note:'Savaşlar, antlaşmalar, hükümdarlar. En eski ve en yaygın biçim.',
    asks:'Ne oldu, kim yaptı, ne zaman?' },
  { id:'annales', label:'Annales okulu',
    note:'Uzun süre (longue durée), coğrafya, gündelik hayat. Olay yüzeydeki dalgadır.',
    asks:'Yüzyıllarca değişmeyen ne vardı?' },
  { id:'marksist', label:'Marksist tarih',
    note:'Üretim ilişkileri ve sınıf mücadelesi belirleyicidir.',
    asks:'Bu değişimden kim kazandı, kim kaybetti?' },
  { id:'kultureI', label:'Kültürel tarih',
    note:'Anlam, temsil, zihniyet. İnsanlar dünyayı nasıl kurguluyordu?',
    asks:'Dönemin insanı ne düşünüyordu, neye gülüyordu?' },
  { id:'mikro', label:'Mikro tarih',
    note:'Tek bir köy, tek bir yargılama, tek bir hayat üzerinden bütünü okumak.',
    asks:'Küçük bir vaka büyük yapıyı nasıl ele veriyor?' },
  { id:'kuresel', label:'Küresel / bağlantı tarihi',
    note:'Ulus birimini bırakır; ağ, ticaret ve dolaşımı izler.',
    asks:'Bu olay başka kıtayla nasıl bağlantılıydı?' },
  { id:'sozlu', label:'Sözlü tarih',
    note:'Yazılı belge bırakmamış olanların tanıklığı.',
    asks:'Belgede sesi olmayan kimdi?' },
  { id:'toplumsalcinsiyet', label:'Toplumsal cinsiyet tarihi',
    note:'Kaynakların erkek merkezli oluşunu bir veri sayar.',
    asks:'Kadınlar bu anlatının neresinde ve neden görünmüyor?' },
];

ESP.SCHOOL_BY_ID = ESP.HISTORIOGRAPHY.reduce(function(m, s){ m[s.id] = s; return m; }, {});

/* ------------------------------------------------------------- nedensellik

   Bir zincir kurarken kullanilan halka turleri. Ayrim onemlidir: uzun
   vadeli KOSUL ile ani TETIKLEYICI ayni sey degildir ve karistirmak
   tarihin en yaygin hatasidir ("savas suikastla cikti"). */
ESP.CAUSE_KINDS = [
  { id:'yapisal', label:'Yapısal koşul',
    note:'Yıllarca süren zemin: nüfus, iklim, ekonomi, teknoloji.' },
  { id:'kurumsal', label:'Kurumsal neden',
    note:'Hukuk, ordu, vergi düzeni gibi kurumların hâli.' },
  { id:'konjonktur', label:'Konjonktür',
    note:'Kısa dönemli durum: kıtlık, savaş yorgunluğu, kriz.' },
  { id:'tetikleyici', label:'Tetikleyici',
    note:'Ateşi yakan kıvılcım. Tek başına açıklamaz.' },
  { id:'fail', label:'Fail kararı',
    note:'Bir kişinin ya da grubun alabileceği başka kararlar da vardı.' },
  { id:'tesaduf', label:'Tesadüf',
    note:'Hava, hastalık, zamanlama. Tarihte vardır ve silinmemelidir.' },
];

/* Anakronizm tuzaklari — "bugunun gozuyle okumak". */
ESP.ANACHRONISMS = [
  { id:'ulus', label:'Ulus-devlet okuması',
    note:'1500\'de «Türkiye» ya da «Almanya» yoktu; hanedan ve din vardı.' },
  { id:'ahlak', label:'Bugünün ahlakıyla yargılama',
    note:'Geçmişi yargılamak açıklamanın yerine geçemez. Açıkla, sonra yargıla.' },
  { id:'kacinilmaz', label:'Kaçınılmazlık yanılgısı',
    note:'Olan şey olmak zorunda değildi. Sonucu bilmek nedeni değiştirmez.' },
  { id:'kahraman', label:'Büyük adam indirgemesi',
    note:'Tek kişi bir yüzyılı açıklamaz; koşullar olmadan karar iş görmez.' },
  { id:'geri', label:'Geriye dönük proje',
    note:'«Zaten hep buna doğru gidiyordu» demek, kaynağı değil sonucu okumaktır.' },
];

/* Tarih calisma bicimleri — koçun reçete yazarken kullandığı egzersizler. */
ESP.HISTORY_DRILLS = [
  { id:'serit', label:'Boş şerit', level:1,
    task:'On olayı tarihsiz karıştır, doğru sıraya diz. Yanlışları not et.' },
  { id:'yuzyil', label:'Yüzyıl eşlemesi', level:1,
    task:'Bir olayın yüzyılını, MÖ/MS ayrımını ve dönemini söyle.' },
  { id:'esanli', label:'Eşzamanlılık', level:2,
    task:'Bir olay seç: aynı yüzyılda başka üç bölgede ne oluyordu?' },
  { id:'zincir', label:'Neden zinciri', level:2,
    task:'Bir olaya iki yapısal koşul, bir konjonktür ve bir tetikleyici yaz.' },
  { id:'karsi', label:'Karşı-olgusal', level:4,
    task:'«Bu olmasaydı ne olurdu?» — ama yalnızca kaynakla savunulabilen kadarını yaz.' },
  { id:'kaynak', label:'Kaynak eleştirisi', level:3,
    task:'Bir birincil kaynak al, sekiz soruyu sırayla cevapla.' },
  { id:'ikiokul', label:'İki okul', level:4,
    task:'Aynı olayı iki tarih yazımı okulunun sorusuyla yeniden yaz.' },
  { id:'anakronizm', label:'Anakronizm avı', level:4,
    task:'Okuduğun bir metinde beş anakronizm tuzağından hangileri var?' },
  { id:'harita', label:'Harita üzerinde', level:2,
    task:'Olayı haritada göster; coğrafya nedenin neresinde?' },
  { id:'mikro', label:'Mikro vaka', level:5,
    task:'Tek bir kişinin ya da köyün hikâyesinden dönemin yapısını çıkar.' },
];

/* Tarih SRS kartlarinin destesi. Dil kartlariyla ayni motor, ayri deste:
   retansiyon ayri olculur (bkz. curriculum «history.retention»). */
ESP.HISTORY_DECK = 'history';
