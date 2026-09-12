/* Felsefe ve edebiyat kanonu — YALNIZCA VERI.

   Burada mantik yoktur, hesap yoktur, durum yoktur. Bir eserin hangi
   gelenege ait oldugu ve hangi kavramlari tasidigi yazar; bunlari kim nasil
   kullanacagina core/ karar verir.

   Ne ise yarar? Iki sey:

     1. Kaynak eklerken yazar ve donem elle yazilmaz — secilir. Yazar adinin
        iki farkli yazimi (Nietzsche / Nietzche) SSK'nin yazar sayisini
        ikiye katliyordu; liste bunu kapatir.
     2. Kavram etiketleri sentopik matrisin omurgasidir. Iki not ancak ortak
        bir KAVRAM tasidiginda onerilebilir; kavramlar serbest metinden
        cikarilsaydi "ozgurluk" ile "hurriyet" ayri dugum olurdu.

   Liste eksiksiz DEGILDIR ve olmasi da gerekmez: kullanici kendi kaynagini
   ekleyebilir. Buradaki isim yalnizca yazim birligi saglar. */

window.ESP = window.ESP || {};

/* Kavramlar — sentopik matrisin dugumleri.

   `same` ayni kavramin baska yazimlaridir: kullanici "hurriyet" yazsa da
   "ozgurluk" dugumune duser. Bu, matrisin dagilmasini onleyen tek sey. */
ESP.CONCEPTS = [
  { id:'ozgurluk',   label:'Özgürlük',        same:['hürriyet', 'freedom', 'liberty'] },
  { id:'adalet',     label:'Adalet',          same:['justice', 'hakkaniyet'] },
  { id:'bilgi',      label:'Bilgi',           same:['epistemoloji', 'knowledge', 'episteme'] },
  { id:'varlik',     label:'Varlık',          same:['ontoloji', 'being', 'ontology'] },
  { id:'ahlak',      label:'Ahlak',           same:['etik', 'ethics', 'moral'] },
  { id:'guc',        label:'Güç',             same:['iktidar', 'power'] },
  { id:'zaman',      label:'Zaman',           same:['time', 'süre', 'duration'] },
  { id:'bilinc',     label:'Bilinç',          same:['consciousness', 'şuur'] },
  { id:'dil',        label:'Dil',             same:['language', 'lisan'] },
  { id:'anlam',      label:'Anlam',           same:['meaning', 'mana'] },
  { id:'olum',       label:'Ölüm',            same:['death', 'fanilik'] },
  { id:'erdem',      label:'Erdem',           same:['virtue', 'arete', 'fazilet'] },
  { id:'devlet',     label:'Devlet',          same:['state', 'siyaset', 'polis'] },
  { id:'sanat',      label:'Sanat',           same:['estetik', 'art', 'aesthetics'] },
  { id:'akil',       label:'Akıl',            same:['reason', 'us', 'logos'] },
  { id:'irade',      label:'İrade',           same:['will', 'istenç'] },
  { id:'tarih',      label:'Tarih',           same:['history', 'historicity'] },
  { id:'birey',      label:'Birey',           same:['individual', 'özne', 'subject'] },
  { id:'yabancilasma', label:'Yabancılaşma',  same:['alienation', 'entfremdung'] },
  { id:'mutluluk',   label:'Mutluluk',        same:['eudaimonia', 'happiness', 'saadet'] },
];

ESP.CONCEPT_BY_ID = ESP.CONCEPTS.reduce(function(m, c){ m[c.id] = c; return m; }, {});

/* Bir serbest metin etiketini kanonik kavrama cevirir. Bulamazsa `null`
   doner — UYDURMAZ. Eslesmeyen etiket kullanicinin kendi kavrami olarak
   durur, sisteme yamanmaz. */
ESP.conceptOf = function(text){
  const t = String(text || '').toLocaleLowerCase('tr-TR').trim();
  if(!t) return null;
  for(const c of ESP.CONCEPTS){
    if(c.id === t) return c;
    if(c.label.toLocaleLowerCase('tr-TR') === t) return c;
    if(c.same.some(s => s.toLocaleLowerCase('tr-TR') === t)) return c;
  }
  return null;
};

/* Gelenekler — bir eserin nereye ait oldugu. Sentopik okuma FARKLI
   geleneklerden gelen metinleri karsilastirdiginda en cok sey soyler. */
ESP.TRADITIONS = [
  { id:'antik',       label:'Antik Yunan' },
  { id:'helenistik',  label:'Helenistik' },
  { id:'islam',       label:'İslam felsefesi' },
  { id:'ortacag',     label:'Ortaçağ' },
  { id:'modern',      label:'Modern (17–18. yy)' },
  { id:'alman',       label:'Alman idealizmi' },
  { id:'varolusçu',   label:'Varoluşçu' },
  { id:'analitik',    label:'Analitik' },
  { id:'kita',        label:'Kıta felsefesi' },
  { id:'turk',        label:'Türk düşüncesi' },
  { id:'edebiyat',    label:'Edebiyat' },
];

/* Kanon. `kind` primer metin mi yorum mu oldugunu soyler: sentez katsayisi
   yalnizca PRIMER metinlerden kurulan baglari sayar (bkz. hints §primer). */
ESP.CANON = [
  { id:'devlet', title:'Devlet', author:'Platon', tradition:'antik', year:-375,
    kind:'primary', concepts:['adalet', 'devlet', 'bilgi', 'erdem'] },
  { id:'nikomakhos', title:'Nikomakhos\'a Etik', author:'Aristoteles', tradition:'antik', year:-340,
    kind:'primary', concepts:['erdem', 'mutluluk', 'ahlak', 'akil'] },
  { id:'dusunceler', title:'Düşünceler', author:'Marcus Aurelius', tradition:'helenistik', year:175,
    kind:'primary', concepts:['erdem', 'olum', 'zaman', 'ahlak'] },
  { id:'mektuplar', title:'Lucilius\'a Mektuplar', author:'Seneca', tradition:'helenistik', year:64,
    kind:'primary', concepts:['zaman', 'olum', 'erdem'] },
  { id:'el-kitabi', title:'El Kitabı (Encheiridion)', author:'Epiktetos', tradition:'helenistik', year:125,
    kind:'primary', concepts:['ozgurluk', 'irade', 'erdem'] },
  { id:'itiraflar', title:'İtiraflar', author:'Augustinus', tradition:'ortacag', year:400,
    kind:'primary', concepts:['zaman', 'bilinc', 'varlik'] },
  { id:'tehafut', title:'Tehâfüt el-Felâsife', author:'Gazâlî', tradition:'islam', year:1095,
    kind:'primary', concepts:['bilgi', 'akil', 'varlik'] },
  { id:'ibn-rusd', title:'Tehâfüt et-Tehâfüt', author:'İbn Rüşd', tradition:'islam', year:1180,
    kind:'primary', concepts:['akil', 'bilgi', 'varlik'] },
  { id:'muka', title:'Mukaddime', author:'İbn Haldûn', tradition:'islam', year:1377,
    kind:'primary', concepts:['tarih', 'devlet', 'guc'] },
  { id:'denemeler', title:'Denemeler', author:'Montaigne', tradition:'modern', year:1580,
    kind:'primary', concepts:['birey', 'olum', 'ahlak', 'bilgi'] },
  { id:'meditasyonlar', title:'Meditasyonlar', author:'Descartes', tradition:'modern', year:1641,
    kind:'primary', concepts:['bilgi', 'bilinc', 'varlik'] },
  { id:'leviathan', title:'Leviathan', author:'Hobbes', tradition:'modern', year:1651,
    kind:'primary', concepts:['devlet', 'guc', 'ozgurluk'] },
  { id:'etika', title:'Etika', author:'Spinoza', tradition:'modern', year:1677,
    kind:'primary', concepts:['ozgurluk', 'ahlak', 'varlik', 'irade'] },
  { id:'insan-anligi', title:'İnsan Anlığı Üzerine Bir Deneme', author:'Locke', tradition:'modern', year:1689,
    kind:'primary', concepts:['bilgi', 'bilinc', 'birey'] },
  { id:'soru-sozlesme', title:'Toplum Sözleşmesi', author:'Rousseau', tradition:'modern', year:1762,
    kind:'primary', concepts:['ozgurluk', 'devlet', 'adalet'] },
  { id:'saf-akil', title:'Arı Usun Eleştirisi', author:'Kant', tradition:'alman', year:1781,
    kind:'primary', concepts:['bilgi', 'akil', 'zaman', 'varlik'] },
  { id:'tinin-gorungubilimi', title:'Tinin Görüngübilimi', author:'Hegel', tradition:'alman', year:1807,
    kind:'primary', concepts:['bilinc', 'tarih', 'ozgurluk'] },
  { id:'istenc', title:'İstenç ve Tasarım Olarak Dünya', author:'Schopenhauer', tradition:'alman', year:1818,
    kind:'primary', concepts:['irade', 'sanat', 'olum'] },
  { id:'korku-titreme', title:'Korku ve Titreme', author:'Kierkegaard', tradition:'varolusçu', year:1843,
    kind:'primary', concepts:['birey', 'irade', 'ahlak'] },
  { id:'kapital', title:'Kapital I', author:'Marx', tradition:'kita', year:1867,
    kind:'primary', concepts:['yabancilasma', 'guc', 'tarih'] },
  { id:'ahlakin-soykutugu', title:'Ahlakın Soykütüğü', author:'Nietzsche', tradition:'kita', year:1887,
    kind:'primary', concepts:['ahlak', 'guc', 'erdem', 'tarih'] },
  { id:'tractatus', title:'Tractatus Logico-Philosophicus', author:'Wittgenstein', tradition:'analitik', year:1921,
    kind:'primary', concepts:['dil', 'anlam', 'akil'] },
  { id:'felsefi-sorusturmalar', title:'Felsefi Soruşturmalar', author:'Wittgenstein', tradition:'analitik', year:1953,
    kind:'primary', concepts:['dil', 'anlam'] },
  { id:'varlik-zaman', title:'Varlık ve Zaman', author:'Heidegger', tradition:'kita', year:1927,
    kind:'primary', concepts:['varlik', 'zaman', 'olum', 'birey'] },
  { id:'varlik-hiclik', title:'Varlık ve Hiçlik', author:'Sartre', tradition:'varolusçu', year:1943,
    kind:'primary', concepts:['ozgurluk', 'bilinc', 'birey'] },
  { id:'sisifos', title:'Sisifos Söyleni', author:'Camus', tradition:'varolusçu', year:1942,
    kind:'primary', concepts:['anlam', 'olum', 'ozgurluk'] },
  { id:'gozetleme', title:'Hapishanenin Doğuşu', author:'Foucault', tradition:'kita', year:1975,
    kind:'primary', concepts:['guc', 'devlet', 'birey'] },
  { id:'adalet-teorisi', title:'Bir Adalet Teorisi', author:'Rawls', tradition:'analitik', year:1971,
    kind:'primary', concepts:['adalet', 'devlet', 'ozgurluk'] },
  { id:'siradan-seyler', title:'Sıradan Şeylerin Dönüşümü', author:'Danto', tradition:'analitik', year:1981,
    kind:'primary', concepts:['sanat', 'anlam'] },
  { id:'kendine-ait-oda', title:'Kendine Ait Bir Oda', author:'Virginia Woolf', tradition:'edebiyat', year:1929,
    kind:'primary', concepts:['ozgurluk', 'birey', 'sanat'] },
  { id:'karamazov', title:'Karamazov Kardeşler', author:'Dostoyevski', tradition:'edebiyat', year:1880,
    kind:'primary', concepts:['ahlak', 'ozgurluk', 'olum', 'adalet'] },
  { id:'huzur', title:'Huzur', author:'Ahmet Hamdi Tanpınar', tradition:'turk', year:1949,
    kind:'primary', concepts:['zaman', 'sanat', 'tarih'] },
  { id:'saatleri-ayarlama', title:'Saatleri Ayarlama Enstitüsü', author:'Ahmet Hamdi Tanpınar', tradition:'turk', year:1961,
    kind:'primary', concepts:['zaman', 'devlet', 'tarih'] },
  { id:'tutunamayanlar', title:'Tutunamayanlar', author:'Oğuz Atay', tradition:'turk', year:1972,
    kind:'primary', concepts:['yabancilasma', 'birey', 'dil'] },
];

ESP.CANON_BY_ID = ESP.CANON.reduce(function(m, b){ m[b.id] = b; return m; }, {});

/* Kanondaki benzersiz yazarlar — kaynak eklerken yazim birligi icin. */
ESP.CANON_AUTHORS = (function(){
  const set = [];
  ESP.CANON.forEach(function(b){ if(set.indexOf(b.author) < 0) set.push(b.author); });
  return set.sort(function(a, b){ return a.localeCompare(b, 'tr'); });
})();

/* Sokratik soru kaliplari.

   Model kapaliyken Socrates'in sordugu sorular buradan gelir. Kalip
   olmalari kasitli: bir soru ancak TEZE bagli oldugunda ise yarar, bu
   yuzden her kalip tezin bir parcasini ister.

   Bunlar model ciktisi DEGILDIR — kural motorunun kendi sorulari. */
ESP.SOCRATIC = [
  { id:'tanim', q:'Bu tezdeki en belirsiz kelime hangisi ve onu nasıl tanımlıyorsun?' },
  { id:'karsit', q:'Bu tezin en güçlü hâliyle karşı tezi ne olurdu?' },
  { id:'ornek', q:'Tezi yanlışlayacak tek bir örnek düşünebiliyor musun?' },
  { id:'sonuc', q:'Bu tez doğruysa kabul etmek zorunda kalacağın başka ne var?' },
  { id:'kaynak', q:'Bu iddia hangi gözleme ya da metne dayanıyor?' },
  { id:'sinir', q:'Bu tez hangi durumda geçerliliğini yitirir?' },
  { id:'ayrim', q:'Burada iki ayrı iddia birleştirilmiş olabilir mi?' },
  { id:'kim', q:'Bu tezi kabul etmesi en zor olan kim olurdu ve neden?' },
];
