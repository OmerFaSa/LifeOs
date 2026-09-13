/* Aciklama metinleri tek yerde.

   Amac: ekranlarda uzun paragraflar birakmamak. Ana alan veri ve eylem
   gosterir; "bu ne ise yarar" bilgisi ⓘ ipuclarina ve kenar rayina tasinir.
   t = baslik (2-4 kelime), b = kisa aciklama (bir cumle), more = detay. */

window.SP = window.SP || {};

SP.HINTS = {

  /* --- gunluk --- */
  'next-action':{ t:'Sıradaki hamle', b:'Ne yapacağını düşünmeden başlaman için tek bir öncelik gösterilir.',
    more:'Sıra sabittir ve SP.PRECEDENCE ile aynıdır: kırmızı bayrak → güvenlik → ölçüm borcu → besin açığı → antrenman → bütçe. Bu sıra tartışmaya açık değildir; ajanlar da buna uyar.' },
  'minimum-day':{ t:'Asgari gün', b:'Kötü günün alt sınırı: protein tabanı, 2 litre su, 15 dakika yürüyüş, 7 saat yatak.',
    more:'Mükemmel gün yerine hiçbir şey yapmamak seçilmesin diye vardır. Bu dördünü tutturduğun gün kayıp yoktur; zincir kopmaz, borç birikmez.' },
  'readiness':{ t:'Toparlanma skoru', b:'Uyku, HRV, istirahat nabzı ve kendi bildirdiğin his birleşerek 0–100 arası bir skor verir.',
    more:'Eksik girdi sıfır sayılmaz; ağırlığı kalan girdilere dağıtılır. Akıllı saati olmayan biri de uyku ve nabızla anlamlı bir skor alır. Skor bandı günün yük emrini belirler.' },
  'certainty':{ t:'Ölçüm kesinliği', b:'Her sayının nereden geldiği yanında yazar: ölçüldü, tahmin, hesaplandı ya da veri yok.',
    more:'Bu, sistemin en önemli kuralının görünen yüzüdür: uydurulmuş sayı, ölçülmüş sayı gibi gösterilmez. "Veri yok" hiçbir zaman sıfır sayılmaz.' },

  /* --- laboratuvar --- */
  'ref-range':{ t:'Referans aralığı', b:'Laboratuvarın "normal" dediği geniş bant. Dışına çıkmak incelenmesi gereken bir bulgudur.',
    more:'Referans aralığı sağlıklı bir topluluğun %95\'ini kapsar; "en iyi" değil "yaygın" demektir. Bu yüzden ayrıca daha dar bir hedef bant tutulur.' },
  'optimal-band':{ t:'Hedef bant', b:'Referans aralığının içinde ama daha dar olan, hedeflenen bölge.',
    more:'Hedef bandın dışında olmak bir uyarı değildir; yalnızca iyileştirme alanıdır. Örnek: B12 için referans 200 pg/mL\'den başlar ama belirtiler çoğu zaman 400 altında görülür.' },
  'trend':{ t:'Bireysel eğilim', b:'Tek ölçüm değil, senin kendi geçmişindeki yön okunur.',
    more:'Referans aralığının içinde kalan ama altı ayda kademeli düşen bir ferritin, aralığın dışına çıkmış tek bir ölçümden daha çok şey söyler. Sistem en az üç ölçüm gördüğünde eğilim hesaplar.' },
  'red-flag':{ t:'Kırmızı bayrak', b:'Sistemin yorum yapmayı bıraktığı eşik. Öneri üretilmez, hekime yönlendirilir.',
    more:'Bayrak açıkken plan tartışılmaz. Bu bir teşhis değildir; "burada karar benim değil hekimin" demenin sistemdeki karşılığıdır. Bayrak 30 gün açık kalır ve kapatılsa da geçmişte durur.' },
  'derived':{ t:'Hesaplanan ölçüm', b:'HOMA-IR, non-HDL ve transferrin satürasyonu girilen iki ölçümden formülle üretilir.',
    more:'Girdilerden biri eksikse ölçüm hiç yazılmaz. Tahmin edilmez: eksik veri, uydurulmuş veriden iyidir.' },
  'lab-paste':{ t:'Tahlil yapıştırma', b:'Laboratuvar raporunun metnini olduğu gibi yapıştır; değerler ayıklanıp şemaya oturur.',
    more:'Ayıklayıcı satır satır okur, bilinen isim ve kısaltmaları eşler, birimi doğrular. Emin olamadığı satırı atmaz; "eşleşmedi" olarak gösterir ve elle bağlamana izin verir.' },

  /* --- beslenme --- */
  'macro-target':{ t:'Makro hedefi', b:'Protein kilogram başına, yağ kalori yüzdesi olarak, karbonhidrat kalandan hesaplanır.',
    more:'Tek bir doğru sayı yoktur, bu yüzden aralık verilir. Kilo verirken protein üst banda yaklaşır: açık verirken kaybedilen dokunun kas değil yağ olmasını sağlayan tek ayar budur.' },
  'bioavailability':{ t:'Biyoyararlanım', b:'Ne kadar aldığın kadar ne kadarını emebildiğin de sayılır.',
    more:'Bitkisel demir tek başına yaklaşık %5 emilir. Aynı öğünde C vitamini bunu üç katına çıkarır; çay ve kahve yarıya indirir. Sistem öğünü bu etkileşimlerle birlikte hesaplar.' },
  'nutri-gap':{ t:'Besin açığı', b:'Hedefin altında kalan öğeler, hangi gıdayla kapatılabileceğiyle birlikte listelenir.',
    more:'Açık, tek günün değil son 7 günün ortalamasından okunur. Bir günün eksiği açık sayılmaz; süreklileşen eksiklik sayılır.' },
  'lab-linked-food':{ t:'Tahlile bağlı reçete', b:'Laboratuvarda düşük çıkan öğe, beslenme hedefini doğrudan değiştirir.',
    more:'Ferritin düşükse demir hedefi yükselir ve C vitamini eşleşmesi zorunlu hâle gelir. D vitamini düşükse yağlı öğünle eşleştirme önerilir. Bu, Modül 1 ile Modül 2 arasındaki tek yönlü bağdır.' },
  'portion':{ t:'Porsiyon tahmini', b:'"1 tabak etli kuru fasulye" yazman yeter; gramaj ev ölçüsü tablosundan gelir.',
    more:'Tartılmadığı için bu bir tahmindir ve öyle etiketlenir. Tartmak istersen gramı doğrudan yazabilirsin; o zaman "ölçüldü" olur.' },
  'household':{ t:'Hane mutfağı', b:'Tek tencere yemek, her bireyin hedefine göre porsiyon çarpanıyla paylaştırılır.',
    more:'Herkese ayrı yemek pişirmek sürdürülebilir değildir. Sistem pişen yemeğin 100 gramdaki profilini bilir ve kişi başına düşen porsiyonu hedefe göre büyütür ya da küçültür; farkı yan gıdayla kapatır.' },

  /* --- hareket --- */
  'load':{ t:'Akut/kronik yük', b:'Son 7 günün ortalama yükü, son 28 günün ortalamasına bölünür.',
    more:'0,8 altı kondisyonun gerilediği, 1,5 üstü sakatlanma riskinin belirgin arttığı bölgedir. Aradaki bant "alıştığın yük" demektir.' },
  'progression':{ t:'Kademeli ilerleme', b:'Her hareketin kendi merdiveni vardır; basamak hedefe ulaşılmadan atlanmaz.',
    more:'Aşırı yüklenmenin en yaygın sebebi basamak atlamaktır. Sistem bir üst basamağı ancak mevcut basamağın hedefi tutturulduğunda açar.' },
  'deload':{ t:'Yük indirme haftası', b:'Beş haftada bir toplam yük %40 azaltılır.',
    more:'Kazanç antrenmanda değil, antrenmandan sonraki toparlanmada oluşur. İndirme haftası bir geri adım değil, planın parçasıdır.' },
  'recovery-order':{ t:'Günün yük emri', b:'Toparlanma bandı, planlanan yükün ne kadarının uygulanacağını söyler.',
    more:'Skor düşükken ağır yük kazanç değil borç üretir. Sistem yükü kendiliğinden azaltır ve nedenini yazar; kararı yine sen verirsin.' },

  /* --- ekonomi --- */
  'price-estimate':{ t:'Fiyat tahmini', b:'Uygulama market taramaz. Başlangıç fiyatları tahmindir ve öyle işaretlenir.',
    more:'Kendi fişinden girdiğin fiyat tahmini ezer ve "ölçüldü" olur. Tahminin üzerinden geçen her ay ekranda yazar; eskidikçe güven düşer.' },
  'substitute':{ t:'Eşdeğer ikame', b:'Pahalı bir besinin yerine, aynı işi gören uygun fiyatlı yerel muadili önerilir.',
    more:'Öneri neyi koruduğunu ve neyi kaybettiğini birlikte söyler. Sardalya somonun omega-3\'ünü korur ama D vitamini içeriği üçte biridir; karar bu ikisi görülerek verilir.' },
  'bulk':{ t:'Toplu alım', b:'Hane genelinde tüketilen ve bozulmadan saklanan kalemlerde kişi başı maliyet düşer.',
    more:'Yalnızca kuru bakliyat, yağ ve konserve gibi kalemler listeye girer. Taze üründe toplu alım tasarruf değil israf üretir.' },
  'budget-rank':{ t:'Bütçenin yeri', b:'Bütçe çelişki sırasında en sonda gelir ama yok sayılmaz.',
    more:'"En son gelir" demek, sağlık hedefini indirmek yerine hedefi bozmadan en ucuz yolu aramak demektir. Bu ayrım Sedef\'in işini tanımlar.' },

  /* --- ofis --- */
  'office':{ t:'Beş ajanlı ofis', b:'Dört uzman kendi alanına bakar, Patron çelişkiyi çözer ve tek karar çıkar.',
    more:'Yetki ayrımı kasıtlıdır: bir ajan alan dışına çıkarsa soruyu sahibine yönlendirir. Sayı kural motorundan gelir; ajan hesap yapmaz, yalnızca cümleye çevirir.' },
  'evidence':{ t:'Eşiğin dayanağı', b:'Her eşik kendi kaynağını taşır; kaynağın derecesi eşiğin ne kadar güçlü konuşabileceğini belirler.',
    more:'Deterministik olmak, bilimsel olarak doğru olmak demek değildir: yanlış seçilmiş bir eşik, son derece güvenilir görünen yanlış bir sonuç üretir. Dört derece vardır — kılavuz ve uzlaşı yönlendirebilir; gözlemsel ilişki ve sistemin kendi seçimi yalnızca gözlem bildirir. Kaynağı yazılmamış eşik de yönlendiremez: bilinmeyen kaynak, iyi kaynak değildir.' },
  'grounding':{ t:'Halüsinasyon engeli', b:'Model serbest sayı üretmez; sayıyı kural motoru verir, model yorumlar.',
    more:'Çıktı ayrıca ev kurallarına karşı denetlenir: doz, teşhis, garanti ve tedavi bırakma ifadeleri reddedilir ve yerine kural motorunun cümlesi basılır.' },
  'no-model':{ t:'Model olmadan', b:'Dil modeli bağlı değilse ofis kapanmaz; brifing doğrudan cümleye çevrilir.',
    more:'Ajanlar bu durumda "kural motoru" rozetiyle konuşur. Sistemin ürettiği hiçbir sayı modele bağlı değildir; model yalnızca anlatım katmanıdır.' },
  'privacy':{ t:'Veri mahremiyeti', b:'Tahlil ve kimlik verisi cihazda kalır; modele yalnızca özet brifing gider.',
    more:'Ad, doğum tarihi ve ham tahlil belgesi hiçbir zaman gönderilmez. Gönderilen şey sayılar ve durum etiketleridir. Hiçbir veri ticari model eğitimine verilmez.' },
  'decision':{ t:'Takipteki karar', b:'Ofiste alınan her karar tarihiyle kaydedilir ve sonucu sorulur.',
    more:'Kapanmamış karar iki günden uzun sürerse ofis bunu gündeme taşır. Karar vermek değil, kararın ne yaptığını görmek sistemi ilerletir.' },

  /* --- sistem --- */
  'profiles':{ t:'Hane profilleri', b:'Her aile bireyi kendi anahtarında durur; veriler karışmaz.',
    more:'Profiller arası geçişte tüm veri seti değişir. Karşılaştırma ve mutfak paylaştırması yalnızca özet okur, ham tahlil verisi profiller arasında dolaşmaz.' },
  'backup':{ t:'Yedek', b:'Veriler bu cihazda tutulur. Yedek dosyası şifresizdir.',
    more:'Tarayıcı verisi silinirse kayıt gider. Ayda bir yedek almak yeterlidir. Yedek dosyası paylaşılan bir dizine konmaz.' },
};
