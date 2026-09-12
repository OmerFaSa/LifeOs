/* Diksiyon referansi — tekerlemeler, artikulasyon calismalari ve nefes.
   YALNIZCA VERI.

   Her calismanin bir HEDEFI vardir ve hedef "hizli soylemek" degildir:
   hangi sesin duzeltildigi yazar. Hizli ama bozuk bir tekerleme calismanin
   basarisi degil basarisizligidir.

   `words` kelime sayisi ELLE sayilmistir ve WPM hesabinin paydasidir;
   kullanici metni degistirirse kendi sayisini girer. Sistem metni cozmez,
   sesi dinlemez. */

window.ESP = window.ESP || {};

/* Turkce ses gruplari — hangi calismanin neyi hedefledigi bunlara dayanir. */
ESP.PHONEME_GROUPS = [
  { id:'patlayici', label:'Patlayıcılar', sounds:'p b t d k g',
    note:'Ağız kapanıp açılır. Sonu yutulan hece en çok burada olur.' },
  { id:'surtunmeli', label:'Sürtünmeliler', sounds:'f v s z ş j h',
    note:'Hava sürtünerek çıkar. «s» ile «ş» ayrımı en sık kaybolan ayrım.' },
  { id:'akici', label:'Akıcılar', sounds:'l r',
    note:'Türkçede «r» dil ucuyla tek vuruştur; uzatılırsa yabancı duyulur.' },
  { id:'genizsi', label:'Genizsiler', sounds:'m n',
    note:'Ses burundan çıkar. Nezlede ilk bozulan grup.' },
  { id:'kalin-unlu', label:'Kalın ünlüler', sounds:'a ı o u',
    note:'Dil geride. Türkçe ses uyumunun bir yarısı.' },
  { id:'ince-unlu', label:'İnce ünlüler', sounds:'e i ö ü',
    note:'Dil önde. «ö» ve «ü» dudak yuvarlaklığı ister.' },
];

/* Tekerlemeler. `level` zorluk, `target` hangi ses grubunu calistirdigi.

   Kisa olanlar once gelir: uzun bir tekerlemede nerede bozuldugunu bulmak
   zordur ve kullanici "kotu yaptim" diye isaretler — oysa hata tek bir
   hecededir. */
ESP.TONGUE_TWISTERS = [
  { id:'kartal', level:1, target:'patlayici', words:8,
    text:'Kartal kalkar dal sarkar, dal sarkar kartal kalkar.' },
  { id:'bir-berber', level:1, target:'akici', words:14,
    text:'Bir berber bir berbere bir berber dükkânı açalım demiş.' },
  { id:'siseci', level:2, target:'surtunmeli', words:10,
    text:'Şu köşe yaz köşesi, şu köşe kış köşesi, ortada su şişesi.' },
  { id:'cakil', level:2, target:'patlayici', words:9,
    text:'Çatalca\'da topal çoban çatal yapıp çatal satar.' },
  { id:'ibiş', level:2, target:'genizsi', words:11,
    text:'İbiş ile Memiş mahkemeye gitmiş, mahkemeleşmiş mi, mahkemeleşmemiş mi?' },
  { id:'degirmen', level:3, target:'akici', words:12,
    text:'Değirmene girdi köpek, değirmenci çaldı kötek; hem kepek yedi köpek, hem kötek yedi köpek.' },
  { id:'al-bu', level:3, target:'surtunmeli', words:13,
    text:'Al şu takatukaları, takatukacıya takatukalatmaya götür; takatukacı takatukaları takatukalamam derse…' },
  { id:'kirk-kup', level:3, target:'patlayici', words:12,
    text:'Kırk küp, kırkının da kulpu kırık küp.' },
  { id:'bu-yogurdu', level:2, target:'kalin-unlu', words:10,
    text:'Bu yoğurdu sarımsaklasak da mı saklasak, sarımsaklamasak da mı saklasak?' },
  { id:'ustunde', level:3, target:'ince-unlu', words:12,
    text:'Üstü üzümlü üzüm küfesi, üzümünü üzmeden üzüm küfesinden üzüm ye.' },
];

ESP.TWISTER_BY_ID = ESP.TONGUE_TWISTERS.reduce(function(m, t){ m[t.id] = t; return m; }, {});

/* Nefes ve duruş calismalari. Sure verilir cunku olculen sey suredir;
   "iyi yaptim" degil. */
ESP.BREATH_DRILLS = [
  { id:'diyafram', label:'Diyafram nefesi', seconds:120,
    note:'Sırtüstü, karına el. Göğüs değil karın kalkar. Konuşma desteğinin tamamı buradan.' },
  { id:'sayma', label:'Tek nefeste sayma', seconds:60,
    note:'Tek nefeste kaça kadar rahat sayabildiğini ölç. Zorlama — ölçüm kırmızıya dönmemeli.' },
  { id:'uzatma', label:'Ünlü uzatma', seconds:90,
    note:'Tek nefeste «aaa» — ses titremeden düz kalmalı. Titreme destek eksikliğidir.' },
  { id:'kesik', label:'Kesik nefes', seconds:60,
    note:'«ha-ha-ha» ile diyaframı sıçratma. Vurgulu konuşmanın motoru.' },
];

/* Vurgu calismasi: AYNI cumle, farkli vurgu, farkli anlam.

   Bu calisma kayit gerektirmez ve en cok sey ogreten calismadir: anlamin
   kelimede degil vurguda oldugunu bir kerede gosterir. */
ESP.STRESS_DRILLS = [
  { id:'ben-demedim', sentence:'Ben bunu ona demedim.',
    readings:[
      { stress:'Ben', means:'Başkası demiş olabilir.' },
      { stress:'bunu', means:'Başka bir şey demiş olabilirim.' },
      { stress:'ona', means:'Başkasına demiş olabilirim.' },
      { stress:'demedim', means:'Yazmış ya da ima etmiş olabilirim.' },
    ] },
  { id:'yarin-gel', sentence:'Yarın sen de gel.',
    readings:[
      { stress:'Yarın', means:'Bugün değil.' },
      { stress:'sen', means:'Yalnız o değil.' },
      { stress:'gel', means:'Aramak yetmez.' },
    ] },
];

/* Konusma hizi bandi — core/acoustic.js'teki WPM_BAND ile AYNI sayilar.
   Burada tarifi, orada hesabi durur; sayiyi iki yere yazmamak icin
   acoustic.js kendi sabitini tutar ve bu satir yalnizca ACIKLAR. */
ESP.WPM_NOTE = 'Türkçe sunumda rahat izlenen bant kabaca 120–150 kelime/dakika. '
  + 'Bu bir kural değil başlangıç çizgisidir: kendi kayıtların bandı yerine oturtur. '
  + 'Yüksek hız iyi değildir; banda yakın hız iyidir.';

/* Sik gorulen artikulasyon hatalari — kullanici kendi kaydini isaretlerken
   listeden secer. Serbest metin yerine liste olmasi kasitli: ayni hatayi
   iki farkli kelimeyle yazan kullanicinin egrisi iki ayri seriye bolunur. */
ESP.ARTICULATION_ERRORS = [
  { id:'yutulan-hece', label:'Yutulan hece',
    note:'Kelime sonu düşüyor: «geliyorum» → «geliyom».' },
  { id:'r-bozulmasi', label:'«r» bozulması',
    note:'Dil ucu vuruşu yerine sürtünme; en çok hızlanınca olur.' },
  { id:'s-s', label:'«s» / «ş» karışması',
    note:'İki sürtünmelinin ayrımı kayboluyor.' },
  { id:'vurgu-kaymasi', label:'Vurgu kayması',
    note:'Türkçede vurgu genelde son hecede; öne kayınca cümle yabancı duyuluyor.' },
  { id:'hizlanma', label:'Cümle sonuna doğru hızlanma',
    note:'En yaygın sunum hatası. Nefes cümle ortasında bitiyor.' },
  { id:'monoton', label:'Tek düzelik',
    note:'Ton hiç değişmiyor; dinleyici on saniyede kopuyor.' },
  { id:'dolgu', label:'Dolgu sesi',
    note:'«eee», «ıı», «şey». Sessizlik dolgudan daha iyidir.' },
];

ESP.ERROR_BY_ID = ESP.ARTICULATION_ERRORS.reduce(function(m, e){ m[e.id] = e; return m; }, {});
