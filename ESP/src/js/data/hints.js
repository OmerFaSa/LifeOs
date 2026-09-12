/* Aciklama metinleri tek yerde.

   Amac: ekranlarda uzun paragraflar birakmamak. Ana alan veri ve eylem
   gosterir; "bu ne ise yarar" bilgisi ⓘ ipuclarina tasinir.
   t = baslik (2-4 kelime), b = kisa aciklama (bir cumle), more = detay. */

window.ESP = window.ESP || {};

ESP.HINTS = {

  /* --- gunluk --- */
  'next-action':{ t:'Sıradaki iş', b:'Ne yapacağını düşünmeden başlaman için tek bir öncelik gösterilir.',
    more:'Sıra sabittir ve ESP.PRECEDENCE ile aynıdır: tıkanmış temel → zamana bağlı hedef → vadesi geçmiş kart → sentez → yeni içerik. Sınırlı olan kaynak zamandır; bu sıra onu paylaştırır.' },
  'minimum-day':{ t:'Asgari gün', b:'Kötü günün alt sınırı: vadesi gelen kartlar, 10 dakika okuma, 15 dakika pratik.',
    more:'Mükemmel gün yerine hiçbir şey yapmamak seçilmesin diye vardır. Bu üçünü tutturduğun gün kayıp yoktur: unutma eğrisi durur, zincir kopmaz.' },
  'certainty':{ t:'Ölçüm kesinliği', b:'Her sayının nereden geldiği yanında yazar: ölçüldü, tahmin, hesaplandı ya da veri yok.',
    more:'Sistemin en önemli kuralının görünen yüzü: uydurulmuş sayı, ölçülmüş sayı gibi gösterilmez. «Veri yok» hiçbir zaman sıfır sayılmaz — entelektüel gelişim düzensiz ilerler ve bir haftalık boşluğu «0 performans» diye grafiğe sokmak yanlış alarm üretir.' },
  'practice-log':{ t:'Pratik kaydı', b:'Bir disiplinde geçirdiğin ölçülmüş süre. Zamanlayıcıdan ya da elle girilir.',
    more:'Elle girilen süre de «ölçüldü» sayılır: saatine bakıp yazdığın 30 dakika, tahmin değil ölçümdür. «Tahmin» etiketi öznel değerlendirmeler içindir (bugünkü çalışmam iyiydi gibi).' },
  'streak':{ t:'Seri', b:'Üst üste en az bir disiplinde pratik yapılan gün sayısı.',
    more:'Seri bir hedef değil bir gözlemdir. Kırıldığında sistem ceza vermez; yalnızca ne zaman kırıldığını söyler. Hiç girilmemiş gün seriyi kırar, «0 dakika» girilen gün de kırar — ikisi ayrı şeydir ve ayrı gösterilir.' },

  /* --- dil --- */
  'srs':{ t:'Aralıklı tekrar', b:'Bir kartı tam unutmadan hemen önce sorar; aralık her doğru cevapta uzar.',
    more:'Leitner kutularının SM-2 ile yumuşatılmış hâli. Kolay bulduğun kart daha uzun süre görünmez, zorlandığın kart başa döner. Amaç tekrar sayısını azaltmak değil, aynı hatırlamayı daha az tekrarla elde etmektir.' },
  'retention':{ t:'Retansiyon', b:'Bugün sorulsa hatırlama olasılığının ortalaması. R(t) = e^(−t/S).',
    more:'S kartın kendi kararlılığıdır ve her doğru cevapta büyür. Hiç çalışılmamış kart bu ortalamaya girmez: «veri yok» sıfır sayılmaz, yoksa bir gün ara vermek retansiyonu çökmüş gibi gösterirdi.' },
  'shadowing':{ t:'Shadowing', b:'Duyduğun konuşmayı birkaç kelime geriden, aynı tonlamayla tekrarlama.',
    more:'Süre ölçülür, kalite ölçülmez — sistem sesini dinlemez. Kendi işaretlediğin zorluk «tahmin» etiketiyle durur ve hiçbir skoru tek başına belirlemez.' },
  'i-plus-one':{ t:'i+1 üretim', b:'Bildiğinin bir adım üstünde üretim: tanıdığın kalıbın yeni bağlamda kullanımı.',
    more:'Kartı tanımak (pasif) ile cümlede kullanmak (aktif) farklı şeylerdir. Aktif kelime sayısı yalnızca üretimde geçen kelimeleri sayar; tanıdıkların ayrı tutulur.' },

  /* --- felsefe --- */
  'argument':{ t:'Argüman', b:'Tek cümlelik tez, destekleri ve itirazları. Uzun deneme gerekmez.',
    more:'Bir tez «açık» kalır: itirazı cevaplanmadıysa kapanmaz. Socrates cevabı yazmaz, soruyu sorar — cevabı sen verirsin. Açık tez bir eksiklik değil, çalışan bir düşüncedir; yalnızca 14 günden uzun sürerse masa notu düşer.' },
  'fallacy':{ t:'Safsata denetimi', b:'Metindeki mantık hatası kalıplarını arar: kişiye saldırı, korkuluk adam, kaçınılmaz sonuç.',
    more:'Denetim kalıp tabanlıdır ve kesin değildir: «bulgu» olarak işaretler, yargı vermez. Bir kalıbın yakalanması argümanın yanlış olduğunu göstermez — bakmaya değer olduğunu gösterir.' },
  'primary-text':{ t:'Primer metin', b:'Filozofun kendi metni; hakkında yazılmış yorum değil.',
    more:'Yorum okumak kötü değildir ama kaydı ayrı tutulur: sentez katsayısı yalnızca primer metinden kurulan bağları sayar. Yoksa bir özet kitabı on filozof okumuş gibi görünürdü.' },

  /* --- ses --- */
  'clean-bpm':{ t:'Temiz BPM', b:'Hata yapmadan çalabildiğin en yüksek tempo. Ulaşılan en yüksek tempo değil.',
    more:'Sistem yalnızca «temiz» işaretlenen tekrarların BPM\'ini eşik sayar. Hız eşiği kendiliğinden artar, kendiliğinden düşmez: bir kötü gün eşiği geri almaz, ama üst üste üç temiz tekrar yeni eşiği açar.' },
  'plateau':{ t:'Plato', b:'Bir teknikte 14+ gündür temiz BPM eşiğinin artmaması.',
    more:'Plato bir başarısızlık değil bir sinyaldir: aynı çalışma aynı sonucu veriyorsa çalışmanın kendisi değişmeli. Öncelik sırasında «tıkanmış temel» sayılır ve yeni repertuarın önüne geçer.' },
  'articulation':{ t:'Artikülasyon', b:'Sesleri tam ve ayrık çıkarabilme. Tekerleme hızıyla değil temizliğiyle ölçülür.',
    more:'Kayıt tutulur ama çözümlenmez — sistem konuşma tanıma modeli kullanmaz. Hata sayısını kendin işaretlersin; bu yüzden «tahmin» etiketi taşır ve kendi geçmişinle karşılaştırılır, başkasıyla değil.' },
  'wpm':{ t:'Konuşma hızı', b:'Dakikadaki kelime. Ölçülmüş süre ve sayılmış kelimeden hesaplanır.',
    more:'Yüksek WPM iyi değildir; hedef banda yakın WPM iyidir. Türkçe sunumda rahat okunan bant kabaca 120–150 arasıdır ve bu bir kural değil bir başlangıç çizgisidir; kendi kayıtların bandı yerine oturtur.' },

  /* --- okuma --- */
  'atomic-note':{ t:'Atomik not', b:'Tek bir fikri taşıyan, tek cümlelik kart. Kitap özeti değil.',
    more:'Zettelkasten\'in tek kuralı budur: bir not bir fikir. İki fikir taşıyan not hiçbir yere bağlanamaz, çünkü hangi fikirle bağlandığı belirsizdir.' },
  'syntopic':{ t:'Sentopik bağ', b:'İki farklı yazarın aynı kavram hakkında söylediğini birbirine bağlayan iz.',
    more:'Sentopik okuma aynı soruyu birden çok yazara sormaktır. Bağ kurulmamış not «henüz sermaye değil» sayılır — okunmuş ama yerleşmemiştir.' },
  'ssk':{ t:'Sentez katsayısı', b:'SSK = (bağlantılı not / toplam kitap) × log(1 + yazar sayısı).',
    more:'Orijinal formül log(yazar) idi ve tek yazarda log(1)=0 tüm sentezi sıfırlıyordu: bir kitabı derinlemesine analiz eden kullanıcı cezalandırılıyordu. log(1+n) bu tekilliği giderir ve henüz kitap yokken de tanımlı kalır.' },

  /* --- yazi --- */
  'readability':{ t:'Okunabilirlik', b:'Cümle uzunluğu ve kelime uzunluğundan hesaplanan bir okuma yükü göstergesi.',
    more:'Bir kalite yargısı değildir: uzun cümle kötü değildir, farkında olmadan uzayan cümle sorundur. Gösterge kendi geçmiş metinlerinle karşılaştırılır.' },
  'draft-ratio':{ t:'Taslak–revizyon', b:'Üretilen kelime ile revize edilen kelimenin oranı.',
    more:'Sürekli yeni taslak açıp hiçbirini revize etmemek en yaygın yazı tıkanmasıdır. Oran bir hedef değil bir aynadır; Montaigne yalnızca sayıyı söyler.' },

  /* --- ofis --- */
  'brief':{ t:'Brifing', b:'Ajanın gördüğü tek şey: ölçülmüş metrikler ve durum etiketleri.',
    more:'Ham ses kaydı, tam metin taslak ve kişisel not brifinge girmez. Ham JSON\'u Danışma ekranından açabilirsin: ajanın görmediği bir şeye dayanarak konuşmadığını görmen gerekir.' },
  'rule-engine':{ t:'Kural motoru', b:'Sayıyı ve kararı üreten katman. Model yalnızca cümleye çevirir.',
    more:'Model kapalıyken ofis kapanmaz: brifing doğrudan kural cümlesine çevrilir ve ajanlar «kural motoru» rozetiyle konuşur. Rozet süs değildir; bir cümleye ne kadar güveneceğini belirler.' },
  'handoff':{ t:'Masalar arası devir', b:'Bir masanın bulgusu başka bir masanın işi olduğunda düşen satır.',
    more:'Devir bir tavsiye değildir: «şu ölçüldü, şu masaya düşüyor» der. Ölçülmemiş bir şey devredilemez — tahmin devir üretmez.' },
  'pedagogic':{ t:'Pedagojik sınır', b:'Sistem sertifika vermez, yetenek yargısı kurmaz, sonuç garantisi etmez.',
    more:'SPİ\'nin klinik sınırının buradaki karşılığı. Seviye etiketi kişiye değil ÜRETİME verilir ve daima tarih aralığıyla birlikte: «son 30 günlük üretimin B2 bandının kriterlerini karşılıyor — bu bir öz-değerlendirmedir».' },
  'precedence':{ t:'Öncelik sırası', b:'İki uzman ters şey söylediğinde Patron\'un uyduğu sıra.',
    more:'Üstteki alttakini her zaman yener. Ama yenilen uzmanın işi bitmez: yeni parça yerine mevcut repertuarda ilerleme önerir. «Hiçbir şey yapma» demek değildir.' },
  'ehs':{ t:'Entelektüel hacim', b:'EHS = Σ (disiplin ağırlığı × ölçülen saat × kalite katsayısı).',
    more:'H_i yalnızca ölçülen pratik saatidir; «veri yok» günler toplama girmez. Bu yüzden EHS bir hedef değil bir hacim ölçüsüdür: iki haftada bir bakılır, her gün değil.' },
};
