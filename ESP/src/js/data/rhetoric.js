/* Yazı araçları — retorik figürler, revizyon listesi, yapı kalıpları.

   Bu dosya ESP'nin estetik otorite iddia etmeme sınırının (ESP.PEDAGOGIC
   §aesthetic) tam kenarında durur ve o yüzden dikkatle yazıldı: burada
   hiçbir madde «iyi yazı böyle olur» demez. Hepsi ARAÇ tanımıdır —
   aracın ne yaptığı söylenir, kullanılıp kullanılmayacağı yazarındır.

   Revizyon listesi de bir kalite ölçütü değil bir GEÇİŞ listesidir:
   maddeleri işaretlemek metni iyi yapmaz, yalnızca hangi geçişlerin
   yapıldığını kaydeder. */

window.ESP = window.ESP || {};

ESP.RHETORIC = [
  { id:'uclu', label:'Üçleme', what:'Üç öğeyi sıralamak.',
    why:'Üç, eksiksiz görünen en kısa listedir.',
    ex:'Geldim, gördüm, yendim.' },
  { id:'karsitlik', label:'Karşıtlık (antitez)', what:'İki zıt öğeyi simetrik kurmak.',
    why:'Fark, benzer yapıda daha keskin duyulur.',
    ex:'Az söyledi, çok anlattı.' },
  { id:'tekrar', label:'Baş yinelemesi', what:'Ardışık cümleleri aynı sözle açmak.',
    why:'Ritim kurar ve vurguyu taşır.',
    ex:'Biz çalıştık. Biz bekledik. Biz sustuk.' },
  { id:'soru', label:'Sözde soru', what:'Cevabı beklenmeyen soru sormak.',
    why:'Okuru cevabı kendi kurmaya çağırır.',
    ex:'Bunu kim ister ki?' },
  { id:'eksiltme', label:'Eksiltme', what:'Bilinen öğeyi düşürmek.',
    why:'Hız kazandırır; okur boşluğu kendi doldurur.',
    ex:'Kimi gitti, kimi kaldı.' },
  { id:'benzetme', label:'Benzetme', what:'Bilinmeyeni bilinene bağlamak.',
    why:'Yeni kavram tanıdık bir zemine oturur.',
    ex:'Bellek, üstü sürekli yazılan bir tahtadır.' },
  { id:'eğretileme', label:'Eğretileme (metafor)', what:'Benzetmeyi «gibi»siz kurmak.',
    why:'İki alanı üst üste bindirir; daha güçlü, daha riskli.',
    ex:'Bu tartışma bir bataklık.' },
  { id:'abartma', label:'Abartma', what:'Ölçüyü bilerek aşmak.',
    why:'Duyguyu görünür kılar; sık kullanılırsa güven kaybettirir.',
    ex:'Bin kere söyledim.' },
  { id:'hafifletme', label:'Hafifletme (litotes)', what:'Olumsuzu olumsuzlayarak söylemek.',
    why:'Ölçülü bir vurgu kurar.',
    ex:'Hiç fena değil.' },
  { id:'siralama', label:'Yığma', what:'Bağlaçsız uzun sıralama.',
    why:'Bolluk ya da yorgunluk hissi verir.',
    ex:'Kitaplar, notlar, fişler, kartlar, listeler.' },
  { id:'ara', label:'Ara söz', what:'Cümlenin ortasına açıklama sokmak.',
    why:'İkinci bir sesi duyurur; aşırısı cümleyi boğar.',
    ex:'Bu fikir — kendisi de yeni değil — yine tartışılıyor.' },
  { id:'kisilestirme', label:'Kişileştirme', what:'Cansıza eylem yüklemek.',
    why:'Soyut bir süreci failli hale getirir.',
    ex:'Piyasa korktu.' },
  { id:'dereceleme', label:'Dereceleme', what:'Artan ya da azalan sırayla dizmek.',
    why:'Yönü hissettirir; sonu vurgular.',
    ex:'Şaşırdı, ürktü, kaçtı.' },
  { id:'tanim', label:'Yeniden tanımlama', what:'Tartışmalı kelimeyi baştan tanımlamak.',
    why:'Tartışmanın zeminini kurar — ve kurduğunu görünür yapar.',
    ex:'Özgürlükten kastım seçenek çokluğu değil.' },
  { id:'itiraf', label:'Önden kabul', what:'Karşı tarafın haklı yanını önce vermek.',
    why:'Güven kazandırır; itirazı erken karşılar.',
    ex:'Bu eleştiri büyük ölçüde doğru. Ama...' },
  { id:'kiyas', label:'Kıyas', what:'İki durumu aynı ölçüte vurmak.',
    why:'Tutarlılık talebi kurar.',
    ex:'Aynı kuralı ötekine de uygulayacak mıyız?' },
];

/* Revizyon geçişleri. Sıra önemlidir: yapı düzelmeden cümle cilalamak,
   silinecek paragrafı güzelleştirmektir. */
ESP.REVISION_PASSES = [
  { id:'yapi', order:1, label:'Yapı geçişi',
    ask:'Her paragraf bir iş yapıyor mu? Yapmayan paragraf hangisi?',
    note:'Önce burası. Yapı düzelmeden cümle cilalamak, silinecek paragrafı '
       + 'güzelleştirmektir.' },
  { id:'iddia', order:2, label:'İddia geçişi',
    ask:'Metnin tek cümlelik iddiası ne? Metin onu mu savunuyor?',
    note:'İddiayı yazının dışına, kenara yaz. Metinde bulamıyorsan okur da bulamaz.' },
  { id:'kanit', order:3, label:'Kanıt geçişi',
    ask:'Her iddianın arkasında bir örnek, sayı ya da alıntı var mı?',
    note:'Kanıtsız iddia bir görüştür; görüş olduğunu söylemek de bir çözümdür.' },
  { id:'kisalt', order:4, label:'Kısaltma geçişi',
    ask:'Hangi kelime çıkarılsa anlam değişmez?',
    note:'Hedef yüzde yirmi. Kısalan metin hızlanmaz, netleşir.' },
  { id:'cumle', order:5, label:'Cümle geçişi',
    ask:'Uzun cümleler bölünebilir mi? Art arda kaç uzun cümle var?',
    note:'Okunabilirlik ölçümü bu geçişten SONRA alınır.' },
  { id:'tekrar', order:6, label:'Tekrar geçişi',
    ask:'Aynı kelime üç paragrafta kaç kez geçiyor?',
    note:'Bilerek yapılan tekrar figürdür; farkında olunmayan tekrar gürültü.' },
  { id:'sesli', order:7, label:'Sesli okuma',
    ask:'Nerede nefesin kesiliyor?',
    note:'Kulağın gözden daha iyi bulduğu tek şey ritimdir.' },
];

/* Yapı kalıpları — metnin iskeleti. Bir kalıp seçmek yaratıcılığı
   sınırlamaz; boş sayfayı sınırlar. */
ESP.STRUCTURES = [
  { id:'tez', label:'Tez–karşı tez–sentez',
    shape:['İddia', 'En güçlü itiraz', 'İkisini de kapsayan konum'],
    when:'Tartışmalı bir konuda konum kurarken.' },
  { id:'sorun', label:'Sorun–çözüm',
    shape:['Sorun neden sorun', 'Denenmiş çözümler', 'Önerilen çözüm', 'Bedeli'],
    when:'Bir öneriyi savunurken.' },
  { id:'anlati', label:'Anlatı',
    shape:['Durum', 'Kırılma', 'Sonuç', 'Çıkarılan şey'],
    when:'Deneyimden fikre giderken.' },
  { id:'karsilastirma', label:'Karşılaştırma',
    shape:['Ortak ölçüt', 'A', 'B', 'Fark neden önemli'],
    when:'İki konumu ya da iki dönemi yan yana koyarken.' },
  { id:'tanimdan', label:'Tanımdan yürüyüş',
    shape:['Kelimenin yaygın kullanımı', 'Sorunu', 'Yeni tanım', 'Sonuçları'],
    when:'Kavram tartışmasında.' },
  { id:'liste', label:'Numaralı sav',
    shape:['Kısa giriş', '3–7 madde', 'Maddeleri bağlayan sonuç'],
    when:'Çok sayıda bağımsız gerekçe varken.' },
];
