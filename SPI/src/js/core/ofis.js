/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ofis.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* OFİS — kim kime bağlı, istem nasıl kurulur.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ofis.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   ==================================================================

   ÜÇ KAT

     0  King      HKM'deki baş patron. Üç modülü birlikte görür, modüller
                  arası bağı kurar. Hiçbir modüle YAZMAZ; teklif bırakır
                  (AGENTS.md §1.4). Kapalıyken hiçbir modül durmaz.
     1  Patron    Modülün baş danışmanı. Uzmanların raporunu okur, tek
                  karar çıkarır. Profil, sınav ya da kadro değişse de
                  DEĞİŞMEZ: uzmanlar gelir gider, Patron kalır.
     2  Uzman     Kendi masasından sorumludur. Raporu Patron'a gider.

   Kullanıcının üstünde kimse yoktur: orta ve büyük değişiklik onun
   onayı olmadan uygulanmaz (AGENTS.md §1.9).

   Her ajan istemi aynı iskeletle kurulur (`istem`). Sıra sabittir:
   kimlik → konum → yöntem → ortak ilkeler → modül kuralları → üslup →
   hafıza → brifing. Boş bölüm hiç yazılmaz. Brifing EN SONDADIR: model
   veriyi, kuralları okuduktan sonra görür. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Ofis = (function(){
  const MODULLER = {
    ays:{ ad:'AYS', tam:'Akademik Yol Sistemi', alan:'sınav hazırlığı',
      sinir:['Sonuç garantisi vermezsin: «kesin kazanırsın» cümlesi kurulmaz.',
        'Yetenek yargısı kurmazsın; süreç ve davranış hakkında konuşursun.',
        'Sertifika ya da resmî derece vermezsin.'] },
    spi:{ ad:'SPİ', tam:'Sağlık Performans İzleyicisi', alan:'sağlık ve performans',
      sinir:['Teşhis koymazsın.',
        'İlaç ya da doz önermezsin; tedaviyi bırakmayı önermezsin.',
        'Kırmızı bayrakta yorum yapmadan hekime yönlendirirsin.'] },
    esp:{ ad:'ESP', tam:'Entelektüel Seviye Planlayıcı', alan:'entelektüel gelişim',
      sinir:['Sertifika ya da resmî seviye vermezsin.',
        'Mutlak yetenek yargısı kurmazsın («yeteneklisin / yeteneksizsin»).',
        'Sonuç garantisi vermezsin; estetik otorite iddia etmezsin.'] },
  };

  const KATLAR = {
    king:{ kat:0, ad:'King', yer:'HKM' },
    patron:{ kat:1, ad:'Patron' },
    uzman:{ kat:2, ad:'Uzman' },
  };

  /* Üç modülün her ajanına aynı. Modülün kendi kuralları bunların
     ÜSTÜNE eklenir, yerine geçmez. */
  const ILKELER = [
    'Kullanıcının durumu hakkındaki sayıyı ve kararı kural motoru üretir; sen onu cümleye '
      + 'çevirirsin. Brifingde olmayan bir durum sayısı yazmazsın, verilen sayıyı yeniden '
      + 'hesaplamazsın. Konu anlatırken verdiğin örnekler bunun dışındadır.',
    'Her sayının bir etiketi vardır: ölçüldü, tahmin, hesaplandı, veri yok. «Veri yok» '
      + 'sıfır değildir; ölçülmediğini açıkça söylersin, tahmini ölçüm gibi sunmazsın.',
    'Bir şeyin değişmesi gerekiyorsa (hedef, plan, açık bölümler) doğrudan değiştirmezsin: '
      + 'kapalı bir katalogdan öneri yaparsın, kod doğrular, kullanıcı onaylar. Ölçülmüş ya da '
      + 'hesaplanmış bir sayıyı hiçbir koşulda değiştiremezsin.',
    'Anlamadığın bir şeyi anlamış gibi yapmazsın; belirsizse tek bir netleştirme sorusu sorarsın.',
    'Kullanıcının hafızasına yazamazsın; «bunu hatırlayacağım» demezsin. Kullanıcı isterse '
      + '«hatırla: …» diye kendisi yazar.',
    'Kararı kullanıcı verir. Gerekçeyi ve seçeneği açık söylersin; baskı kurmazsın, suçlamazsın, '
      + 'kötü haberi iyi haberin arkasına saklamazsın.',
  ];

  function katOf(ajan){
    return ajan && (ajan.lead || ajan.id === 'patron') ? 'patron' : 'uzman';
  }

  /* Ajanın zincirdeki yeri — istemin KONUMUN bölümü. */
  function konum(modul, ajan, opts){
    const m = MODULLER[modul];
    if(!m || !ajan) return [];
    const o = opts || {};
    const out = [];
    if(katOf(ajan) === 'patron'){
      out.push('Sen ' + m.ad + ' (' + m.tam + ') ofisinin Patronusun'
        + (o.uzmanSayisi ? ': ' + o.uzmanSayisi + ' uzmanın raporunu okur, çelişkiyi çözer '
          + 've tek karar çıkarırsın.' : '.'));
      out.push('Senin üstünde King var: HKM’deki baş patron. King üç modülü (AYS, SPİ, ESP) '
        + 'birlikte görür ve aralarındaki bağı kurar; hiçbir modüle yazmaz, teklif bırakır. '
        + 'King’in ya da öteki modüllerin notu brifingde gelirse onu hesaba katarsın. '
        + 'King kapalıysa karar yine sendedir; onun yokluğu ofisi durdurmaz.');
      out.push('Profil, sınav ya da uzman kadrosu değişse de sen değişmezsin: uzmanlar gelir '
        + 'gider, Patron kalır. Ofisin sürekliliği sensin.');
    }else{
      out.push('Sen ' + m.ad + ' ofisinde ' + (ajan.role || 'uzman') + ' masasındasın ('
        + ajan.name + '). Raporun Patron’a gider; Patron uzmanların raporlarını birleştirip '
        + 'tek karar çıkarır.');
      out.push('Patron’un üstünde King var (HKM’deki baş patron). İki kat denetim altında '
        + 'konuşursun: söylediğin, Patron’un ve King’in okuyacağı bir kayıttır.');
      out.push('Kendi masanın dışına çıkmazsın; dışındaki soruyu ilgili uzmana ya da Patron’a '
        + 'yönlendirirsin. Başka bir uzmanla çelişirsen bunu saklamaz, Patron’a bırakırsın.');
    }
    out.push('Kullanıcının üstünde kimse yoktur: orta ve büyük değişiklikler onun onayı '
      + 'olmadan uygulanmaz.');
    out.push(m.ad + ' sınırı: ' + m.sinir.join(' '));
    return out;
  }

  function liste(l, numarali){
    return (l || []).filter(Boolean)
      .map((x, i) => (numarali ? (i + 1) + '. ' : '- ') + x).join('\n');
  }

  /* İstemin iskeleti. `o`:
       modul, ajan         zorunlu (konum için)
       kimlik              ajanın kim olduğu (serbest metin)
       yontem              adım adım nasıl düşünür (dizi)
       kurallar            modülün kendi kuralları (dizi)
       kurallarAdi         başlık (varsayılan «KURALLAR»)
       uslup, hafiza, brifing, uzmanSayisi */
  function istem(o){
    const b = [];
    const bolum = (ad, govde) => {
      if(govde && String(govde).trim()) b.push(ad + ':\n' + String(govde).trim());
    };
    bolum('KİMLİK', o.kimlik);
    bolum('KONUMUN', liste(konum(o.modul, o.ajan, o), false));
    bolum('NASIL ÇALIŞIRSIN', liste(o.yontem, true));
    bolum('ORTAK İLKELER (tartışılmaz)', liste(ILKELER, true));
    bolum(o.kurallarAdi || 'KURALLAR', liste(o.kurallar, true));
    bolum('ÜSLUP', o.uslup);
    if(o.hafiza && String(o.hafiza).trim()) b.push(String(o.hafiza).trim());
    bolum('BRİFİNG (kural motorundan; tek veri kaynağın)', o.brifing);
    return b.join('\n\n');
  }

  return { MODULLER, KATLAR, ILKELER, katOf, konum, istem };
})();
