/* Düşünce deneyleri ve mantık alıştırmaları — felsefenin ikinci ekseni.

   Bir tez yazmak ile bir tezi SINAMAK ayrı işlerdir. Düşünce deneyi
   sınamanın en ucuz aracıdır: laboratuvar gerektirmez, yalnızca dürüstlük
   ister.

   Buradaki deneylerin hiçbirinin «doğru cevabı» yazılmadı ve bu bilinçli:
   cevabı veren bir liste, deneyi bir bilgi yarışması sorusuna çevirir.
   Yazılan tek şey, deneyin HANGİ AYRIMI zorladığıdır. */

window.ESP = window.ESP || {};

ESP.EXPERIMENTS = [
  { id:'tramvay', label:'Tramvay problemi', field:'etik',
    setup:'Beş kişiye doğru giden tramvayı bir makasla çevirirsen bir kişi ölür. '
        + 'Çevirir misin? Ya çevirmek yerine birini itmek gerekseydi?',
    tests:'Sonuççuluk ile eylemin kendisi arasındaki ayrım.' },
  { id:'gemi', label:'Theseus\'un gemisi', field:'kimlik',
    setup:'Geminin bütün tahtaları tek tek değiştirildi. Aynı gemi mi? '
        + 'Eski tahtalardan ikinci bir gemi kurulursa hangisi asıl?',
    tests:'Özdeşliğin süreklilik mi yapı mı olduğu.' },
  { id:'oda', label:'Çin odası', field:'zihin',
    setup:'Çince bilmeyen biri, kurallara bakarak Çince cevaplar üretiyor. '
        + 'Anlıyor mu?',
    tests:'Sembol işleme ile anlama arasındaki fark.' },
  { id:'mary', label:'Mary\'nin odası', field:'zihin',
    setup:'Renk hakkındaki her fiziksel olguyu bilen Mary siyah-beyaz bir odada '
        + 'yaşadı. İlk kez kırmızı gördüğünde yeni bir şey öğrenir mi?',
    tests:'Fiziksel bilgi ile deneyimin aynı şey olup olmadığı.' },
  { id:'peçe', label:'Cehalet peçesi', field:'siyaset',
    setup:'Toplumun kurallarını, kim olacağını bilmeden seçeceksin. '
        + 'Hangi kuralları koyardın?',
    tests:'Adalet ile kişisel çıkar arasındaki ayrım.' },
  { id:'zeno', label:'Aşil ve kaplumbağa', field:'mantik',
    setup:'Aşil, önde başlayan kaplumbağanın bulunduğu yere vardığında '
        + 'kaplumbağa biraz ilerlemiştir. Nasıl geçer?',
    tests:'Sonsuz bölünebilirlik ile hareketin bağdaşması.' },
  { id:'yiğit', label:'Yığın (sorites)', field:'mantik',
    setup:'Bir kum tanesi yığın değil. Bir tane eklemek yığın yapmaz. '
        + 'O hâlde hiçbir şey yığın değil mi?',
    tests:'Belirsiz sınırlı kavramların mantığı.' },
  { id:'beyin', label:'Fıçıdaki beyin', field:'bilgi',
    setup:'Bütün algıların bir makine tarafından üretiliyor olabilir. '
        + 'Bunu nasıl çürütürsün?',
    tests:'Bilginin temeli ve şüphenin sınırı.' },
  { id:'kelebek', label:'Zhuangzi\'nin kelebeği', field:'bilgi',
    setup:'Rüyasında kelebek olduğunu gören adam mı, yoksa şimdi adam olduğunu '
        + 'gören kelebek mi?',
    tests:'Uyanıklık ölçütünün kendisi.' },
  { id:'ebedi', label:'Bengi dönüş', field:'etik',
    setup:'Bu hayatı, aynı ayrıntılarla sonsuz kez yeniden yaşayacaksın. '
        + 'Bu haber sevindirir mi, ezer mi?',
    tests:'Hayatın kendisini onaylayıp onaylamadığın.' },
  { id:'utopya', label:'Deneyim makinesi', field:'deger',
    setup:'İstediğin her deneyimi yaşatan bir makineye bağlanabilirsin; '
        + 'gerçek olmadığını bilmeyeceksin. Bağlanır mısın?',
    tests:'Hazzın mı yoksa gerçeklikle temasın mı değerli olduğu.' },
  { id:'ikizdunya', label:'İkiz Dünya', field:'dil',
    setup:'Her şeyi aynı ama sudaki maddesi farklı bir gezegende «su» kelimesi '
        + 'aynı şeyi mi gösterir?',
    tests:'Anlamın kafanın içinde mi dünyada mı olduğu.' },
  { id:'kutup', label:'Kütüphaneci', field:'mantik',
    setup:'Kendini içermeyen bütün kümelerin kümesi kendini içerir mi?',
    tests:'Kendine gönderme yapan tanımların çelişkisi.' },
  { id:'gyges', label:'Gyges\'in yüzüğü', field:'etik',
    setup:'Görünmez olsan ve asla yakalanmayacağını bilsen, adil davranır mıydın?',
    tests:'Adaletin içsel mi yoksa yaptırıma bağlı mı olduğu.' },
  { id:'ata', label:'Atalarımızın borcu', field:'siyaset',
    setup:'Doğmamış kuşaklara karşı bir yükümlülüğün var mı? Onlar henüz yok.',
    tests:'Hakkın var olmayan taraflara genişleyip genişlemediği.' },
];

ESP.EXPERIMENT_FIELDS = [
  { id:'etik',     label:'Etik' },
  { id:'zihin',    label:'Zihin felsefesi' },
  { id:'bilgi',    label:'Bilgi kuramı' },
  { id:'mantik',   label:'Mantık' },
  { id:'siyaset',  label:'Siyaset felsefesi' },
  { id:'dil',      label:'Dil felsefesi' },
  { id:'kimlik',   label:'Kimlik' },
  { id:'deger',    label:'Değer' },
];

/* Argüman kurma alıştırmaları. Safsata listesi core/intellect.js içinde
   DESEN olarak durur (metinde arar); buradakiler EGZERSIZDIR. */
ESP.ARGUMENT_DRILLS = [
  { id:'steelman', label:'Çelik adam',
    task:'Katılmadığın bir görüşü, savunucusunun kabul edeceği güçte yaz.',
    note:'Karşı tarafı zayıf kurmak tartışmayı kazandırır, doğruyu kaybettirir.' },
  { id:'oncul', label:'Öncül ayıklama',
    task:'Bir paragraftaki gizli öncülü bul: söylenmeyen ama gerekli olan varsayım.',
    note:'Çoğu tartışma öncülde biter, sonuçta değil.' },
  { id:'tersine', label:'Tersine çevirme',
    task:'Kendi tezini çürüten tek bir örnek bul. Bulamıyorsan tez fazla geniştir.',
    note:'Yanlışlanamayan tez bir iddia değil bir inançtır.' },
  { id:'sinir', label:'Sınır çizme',
    task:'Tezin hangi durumda geçersiz olduğunu yaz.',
    note:'Sınırı olmayan tez her şeyi açıklar, yani hiçbir şeyi.' },
  { id:'cevir', label:'Kendi diline çevirme',
    task:'Okuduğun bir argümanı, metne bakmadan kendi kelimelerinle yaz.',
    note:'Çeviremiyorsan anlamamışsındır; bu bir kusur değil bir ölçüdür.' },
  { id:'zincirle', label:'Zincirleme',
    task:'İddianı üç adımda sonuca bağla; her adımı ayrı cümle yap.',
    note:'Atlanan adım genellikle en tartışmalı olandır.' },
];
