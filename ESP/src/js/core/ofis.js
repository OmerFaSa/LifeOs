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
window.LIFEOS.PARCA.yazilar({
  'ortak.ofis.akademik-yol-sistemi':'Akademik Yol Sistemi',
  'ortak.ofis.sonuc-garantisi-vermezsin-ke':'Sonuç garantisi vermezsin: «kesin kazanırsın» cümlesi kurulmaz.',
  'ortak.ofis.yetenek-yargisi-kurmazsin-su':'Yetenek yargısı kurmazsın; süreç ve davranış hakkında konuşursun.',
  'ortak.ofis.sertifika-ya-da-resmi-derece':'Sertifika ya da resmî derece vermezsin.',
  'ortak.ofis.saglik-performans-i-zleyicis':'Sağlık Performans İzleyicisi',
  'ortak.ofis.teshis-koymazsin':'Teşhis koymazsın.',
  'ortak.ofis.i-lac-ya-da-doz-onermezsin':'İlaç ya da doz önermezsin; tedaviyi bırakmayı önermezsin.',
  'ortak.ofis.kirmizi-bayrakta-yorum-yapma':'Kırmızı bayrakta yorum yapmadan hekime yönlendirirsin.',
  'ortak.ofis.entelektuel-seviye-planlayic':'Entelektüel Seviye Planlayıcı',
  'ortak.ofis.sertifika-ya-da-resmi-seviye':'Sertifika ya da resmî seviye vermezsin.',
  'ortak.ofis.mutlak-yetenek-yargisi-kurma':'Mutlak yetenek yargısı kurmazsın («yeteneklisin / yeteneksizsin»).',
  'ortak.ofis.sonuc-garantisi-vermezsin-es':'Sonuç garantisi vermezsin; estetik otorite iddia etmezsin.',
  'ortak.ofis.kullanicinin-durumu-hakkinda':'Kullanıcının durumu hakkındaki sayıyı ve kararı kural motoru üretir; sen onu cümleye ',
  'ortak.ofis.her-sayinin-bir-etiketi-vard':'Her sayının bir etiketi vardır: ölçüldü, tahmin, hesaplandı, veri yok. «Veri yok» ',
  'ortak.ofis.bir-seyin-degismesi-gerekiyo':'Bir şeyin değişmesi gerekiyorsa (hedef, plan, açık bölümler) doğrudan değiştirmezsin: ',
  'ortak.ofis.anlamadigin-bir-seyi-anlamis':'Anlamadığın bir şeyi anlamış gibi yapmazsın; belirsizse tek bir netleştirme sorusu sorarsın.',
  'ortak.ofis.kullanicinin-hafizasina-yaza':'Kullanıcının hafızasına yazamazsın; «bunu hatırlayacağım» demezsin. Kullanıcı isterse ',
  'ortak.ofis.karari-kullanici-verir-gerek':'Kararı kullanıcı verir. Gerekçeyi ve seçeneği açık söylersin; baskı kurmazsın, suçlamazsın, ',
  'ortak.ofis.kendi-adinla-ve-rolunle-konu':'Kendi adınla ve rolünle konuşursun; kendini «yapay zekâ», «dil modeli» ya da «asistan» diye ',
  'ortak.ofis.sen':'Sen ',
  'ortak.ofis.senin-ustunde-king-var-hkm-d':'Senin üstünde King var: HKM’deki baş patron. King üç modülü (AYS, SPİ, ESP) ',
  'ortak.ofis.king-in-ya-da-oteki-moduller':'King’in ya da öteki modüllerin notu brifingde gelirse onu hesaba katarsın. ',
  'ortak.ofis.king-kapaliysa-karar-yine-se':'King kapalıysa karar yine sendedir; onun yokluğu ofisi durdurmaz.',
  'ortak.ofis.profil-sinav-ya-da-uzman':'Profil, sınav ya da uzman kadrosu değişse de sen değişmezsin: uzmanlar gelir ',
  'ortak.ofis.patron-un-ustunde-king-var-h':'Patron’un üstünde King var (HKM’deki baş patron). İki kat denetim altında ',
  'ortak.ofis.kendi-masanin-disina-cikmazs':'Kendi masanın dışına çıkmazsın; dışındaki soruyu ilgili uzmana ya da Patron’a ',
  'ortak.ofis.kullanicinin-ustunde-kimse-y':'Kullanıcının üstünde kimse yoktur: orta ve büyük değişiklikler onun onayı ',
  'ortak.ofis.ortak-i-lkeler-tartisilmaz':'ORTAK İLKELER (tartışılmaz)',
  'ortak.ofis.cumlelerini':'Cümlelerini ',
  'ortak.ofis.hangi-modelle-calistigin-sor':'Hangi modelle çalıştığın sorulursa bunu dürüstçe söylersin.',
  'ortak.ofis.kisa-bir-selamlasma-ya-da':'Kısa bir selamlaşma ya da sohbet. Rapor okuma, sayı söyleme. Adınla, ',
  'ortak.ofis.bri-fi-ng-kural-motorundan-t':'BRİFİNG (kural motorundan; tek veri kaynağın)',
  'ortak.ofis.bearer':'Bearer ',
  'ortak.ofis.dogru':'Doğru: ',
  'ortak.ofis.maddeler-kalite-kontrolunden':'Maddeler kalite kontrolünden geçince burada teklif olarak görünür; ',
  'ortak.ofis.arastirma-bitince-hkm-ofis-t':'Araştırma bitince HKM › Ofis’te okursun. Kaynağa erişim henüz olmadığı ',
  'ortak.ofis.hkm-bagli-degil':'HKM bağlı değil.',
  'ortak.ofis.bu-ortamda-ag-istegi-yok':'Bu ortamda ağ isteği yok.',
  'ortak.ofis.hkm-cevabi-okunamadi':'HKM cevabı okunamadı.',
  'ortak.ofis.hkm-ye-ulasilamadi':'HKM’ye ulaşılamadı.',
  'ortak.ofis.bunu-hkm-deki-bam-hazirlar-a':'Bunu HKM’deki BAM hazırlar ama HKM bağlı değil. ',
  'ortak.ofis.rehber-hkm-den-baglaninca-ye':'Rehber › HKM’den bağlanınca yeniden iste.',
  'ortak.ofis.materyal-hkm-ofis-te-hazir':'Materyal HKM › Ofis’te hazır olur; bu sistem onu henüz kart olarak alamıyor.',
  'ortak.ofis.bam-a-ilettim-is':'BAM’a ilettim (iş #',
  'ortak.ofis.bu-is-bam-da-zaten-acik':'Bu iş BAM’da zaten açık (#',
  'ortak.ofis.bam-isi-acamadi':'BAM işi açamadı.',
  'ortak.ofis.hkm-ye-ulasilamadi-is-acilma':'HKM’ye ulaşılamadı; iş açılmadı. HKM açıkken yeniden iste.',
});


window.LIFEOS = window.LIFEOS || {};

LIFEOS.Ofis = (function(){
  const MODULLER = {
    ays:{ ad:'AYS', tam:yz('ortak.ofis.akademik-yol-sistemi'), alan:'sınav hazırlığı',
      sinir:[yz('ortak.ofis.sonuc-garantisi-vermezsin-ke'),
        yz('ortak.ofis.yetenek-yargisi-kurmazsin-su'),
        yz('ortak.ofis.sertifika-ya-da-resmi-derece')] },
    spi:{ ad:'SPİ', tam:yz('ortak.ofis.saglik-performans-i-zleyicis'), alan:'sağlık ve performans',
      sinir:[yz('ortak.ofis.teshis-koymazsin'),
        yz('ortak.ofis.i-lac-ya-da-doz-onermezsin'),
        yz('ortak.ofis.kirmizi-bayrakta-yorum-yapma')] },
    esp:{ ad:'ESP', tam:yz('ortak.ofis.entelektuel-seviye-planlayic'), alan:'entelektüel gelişim',
      sinir:[yz('ortak.ofis.sertifika-ya-da-resmi-seviye'),
        yz('ortak.ofis.mutlak-yetenek-yargisi-kurma'),
        yz('ortak.ofis.sonuc-garantisi-vermezsin-es')] },
  };

  const KATLAR = {
    king:{ kat:0, ad:'King', yer:'HKM' },
    patron:{ kat:1, ad:'Patron' },
    uzman:{ kat:2, ad:'Uzman' },
  };

  /* Üç modülün her ajanına aynı. Modülün kendi kuralları bunların
     ÜSTÜNE eklenir, yerine geçmez. */
  const ILKELER = [
    yz('ortak.ofis.kullanicinin-durumu-hakkinda')
      + 'çevirirsin. Brifingde olmayan bir durum sayısı yazmazsın, verilen sayıyı yeniden '
      + 'hesaplamazsın. Konu anlatırken verdiğin örnekler bunun dışındadır.',
    yz('ortak.ofis.her-sayinin-bir-etiketi-vard')
      + 'sıfır değildir; ölçülmediğini açıkça söylersin, tahmini ölçüm gibi sunmazsın.',
    yz('ortak.ofis.bir-seyin-degismesi-gerekiyo')
      + 'kapalı bir katalogdan öneri yaparsın, kod doğrular, kullanıcı onaylar. Ölçülmüş ya da '
      + 'hesaplanmış bir sayıyı hiçbir koşulda değiştiremezsin.',
    yz('ortak.ofis.anlamadigin-bir-seyi-anlamis'),
    yz('ortak.ofis.kullanicinin-hafizasina-yaza')
      + '«hatırla: …» diye kendisi yazar.',
    yz('ortak.ofis.karari-kullanici-verir-gerek')
      + 'kötü haberi iyi haberin arkasına saklamazsın.',
    yz('ortak.ofis.kendi-adinla-ve-rolunle-konu')
      + 'tanıtmaz, duygun olup olmadığını tartışmazsın. Kullanıcıya «sen» diye hitap edersin; '
      + '«Kullanıcı» demezsin.',
  ];

  /* SELAMLASMA — kisa sosyal mesaj. Selama RAPOR GONDERILMEZ: brifing
     modelin onundeyse model onu okur («merhaba» → «aktif kelime sayin 0»).
     AYS'nin CHAT_KINDS.selam kalibiyla ayni; yalniz kisa mesajda gecerli. */
  const SELAM_RE = /^\s*(selam|merhaba|meraba|mrb|slm|sa[,.! ]|sa$|aleyküm|günaydın|iyi akşamlar|iyi geceler|iyi günler|naber|ne haber|nasılsın|nasilsin|napıyorsun|hey|hi[,.! ]|hello|kanka|hocam|müsait misin|orada mısın|teşekkür|sağol|sağ ol|tşk|tsk|eyvallah|görüşürüz|hoşça kal|hoşçakal|tamam|peki|süper|harika|kimsin|sen kimsin|ne iş yaparsın)/i;
  function selamMi(text){
    const q = String(text || '').trim().toLocaleLowerCase('tr');
    return !!q && q.length <= 64 && SELAM_RE.test(q);
  }

  /* SAYI HAVUZU — ajanin yazabilecegi sayilar brifingin DEGERLERIDIR.
     Anahtar adlari ve YAPI sayilari (kutu sirasi, pencere uzunlugu, surum)
     olcum degildir: gemma3:4b «box:5»i «5 kart», «windowDays:14»u
     «shadowing suresi 14 gun» diye okudu ve metin icinde arama bunu
     yakalamadi. Yapi anahtarinin altindaki sayi havuza girmez. */
  /* YANKI — kucuk model istemi geri kusabilir: brifing JSON'unu ya da
     bolum basligini («BRİFİNG:», «KURALLAR») oldugu gibi yazar. Bu bir
     cevap degildir; kural motorunun cumlesi gecer. */
  const YANKI_RE = /(BRİFİNG|KURALLAR|ORTAK İLKELER|NASIL ÇALIŞIRSIN|KİMLİK:|KONUMUN:|"cert"\s*:|\{\s*"[a-zA-Z_]+"\s*:)/;
  function yankiMi(text){ return YANKI_RE.test(String(text || '')); }

  const YAPI_ANAHTARI = { box:1, windowDays:1, rank:1, version:1, index:1, order:1 };
  function sayiHavuzu(brief){
    const out = [];
    const sayilar = s => (String(s).match(/\d+(?:[.,]\d+)?/g) || [])
      .map(x => Number(x.replace(',', '.'))).filter(Number.isFinite);
    const walk = (v, anahtar) => {
      if(v == null || YAPI_ANAHTARI[anahtar]) return;
      if(typeof v === 'number'){ if(Number.isFinite(v)) out.push(v); return; }
      if(typeof v === 'string'){ sayilar(v).forEach(n => out.push(n)); return; }
      if(Array.isArray(v)){ v.forEach(x => walk(x, anahtar)); return; }
      if(typeof v === 'object') Object.keys(v).forEach(k => walk(v[k], k));
    };
    walk(brief, '');
    return out;
  }

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
      out.push(yz('ortak.ofis.sen') + m.ad + ' (' + m.tam + ') ofisinin Patronusun'
        + (o.uzmanSayisi ? ': ' + o.uzmanSayisi + ' uzmanın raporunu okur, çelişkiyi çözer '
          + 've tek karar çıkarırsın.' : '.'));
      out.push(yz('ortak.ofis.senin-ustunde-king-var-hkm-d')
        + 'birlikte görür ve aralarındaki bağı kurar; hiçbir modüle yazmaz, teklif bırakır. '
        + yz('ortak.ofis.king-in-ya-da-oteki-moduller')
        + yz('ortak.ofis.king-kapaliysa-karar-yine-se'));
      out.push(yz('ortak.ofis.profil-sinav-ya-da-uzman')
        + 'gider, Patron kalır. Ofisin sürekliliği sensin.');
    }else{
      out.push(yz('ortak.ofis.sen') + m.ad + ' ofisinde ' + (ajan.role || 'uzman') + ' masasındasın ('
        + ajan.name + '). Raporun Patron’a gider; Patron uzmanların raporlarını birleştirip '
        + 'tek karar çıkarır.');
      out.push(yz('ortak.ofis.patron-un-ustunde-king-var-h')
        + 'konuşursun: söylediğin, Patron’un ve King’in okuyacağı bir kayıttır.');
      out.push(yz('ortak.ofis.kendi-masanin-disina-cikmazs')
        + 'yönlendirirsin. Başka bir uzmanla çelişirsen bunu saklamaz, Patron’a bırakırsın.');
    }
    out.push(yz('ortak.ofis.kullanicinin-ustunde-kimse-y')
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
    /* Selamda yontem ve kurallar gitmez: kucuk model onlari kopyaliyordu
       («son 30 günlük üretimin…»). Ortak ilkeler kalir. */
    bolum('NASIL ÇALIŞIRSIN', o.selam ? '' : liste(o.yontem, true));
    bolum(yz('ortak.ofis.ortak-i-lkeler-tartisilmaz'), liste(ILKELER, true));
    bolum(o.kurallarAdi || 'KURALLAR', o.selam ? '' : liste(o.kurallar, true));
    bolum('ÜSLUP', o.uslup);
    if(o.model) bolum('ARKADAKİ MODEL', yz('ortak.ofis.cumlelerini') + o.model + ' dil modeli kuruyor. '
      + yz('ortak.ofis.hangi-modelle-calistigin-sor'));
    if(o.hafiza && String(o.hafiza).trim()) b.push(String(o.hafiza).trim());
    if(o.selam){
      bolum('BU MESAJ', yz('ortak.ofis.kisa-bir-selamlasma-ya-da')
        + 'sıcak ve kısa karşılık ver (en fazla iki cümle); istersen ne konuşmak istediğini sor.');
      return b.join('\n\n');
    }
    bolum(yz('ortak.ofis.bri-fi-ng-kural-motorundan-t'), o.brifing);
    return b.join('\n\n');
  }

  /* ---------------------------------------------- patronlar arası kanal

     Üç Patron birbirini doğrudan tanımaz; aralarındaki bağ King'dir.
     HKM /api/kanal/<modül> öteki iki modülün BUGÜNKÜ denetim hükmünü ve
     King'in önerisini verir (HKM core/kanal.py; yalnız okur). Modül onu
     Patron brifingine koyar.

     - Bellekte durur, yedeğe girmez; bugüne ait değilse kullanılmaz.
     - HKM kapalıysa kanal yoktur: Patron kararı yine kendisi verir.
     - Hiçbir koşulda fırlatmaz, beklenmez (AGENTS.md §1.4).
     - Gelen metin süzülür: bilinmeyen alan, etiketsiz bulgu, boş satır
       brifinge girmez. */
  const HUKUM = { ANOMALY:'eşik kırıldı', INCOMPLETE:'eksik veri', APPROVED:'eşikler içinde' };
  const ETIKET = { measured:'ölçüldü', estimated:'tahmin', computed:'hesaplandı', missing:'veri yok' };

  function kanalTemizle(g, modul){
    if(!g || typeof g !== 'object' || !g.ok || typeof g.date !== 'string'
      || !g.moduller || typeof g.moduller !== 'object') return null;
    const moduller = {};
    Object.keys(MODULLER).filter(m => m !== modul && g.moduller[m]).forEach(m => {
      const x = g.moduller[m] || {};
      moduller[m] = {
        verdict:HUKUM[x.verdict] ? x.verdict : null,
        bulgular:(Array.isArray(x.bulgular) ? x.bulgular : []).slice(0, 5)
          .filter(b => b && typeof b.text === 'string' && b.text.trim())
          .map(b => ({ text:b.text.trim().slice(0, 300), cert:ETIKET[b.cert] ? b.cert : null })),
      };
    });
    const k = g.king && typeof g.king.text === 'string' && g.king.text.trim()
      ? { text:g.king.text.trim().slice(0, 400), state:String(g.king.state || '') } : null;
    return { date:g.date, king:k, moduller };
  }

  /* `kanalKur({ hkm:() => R.Beacon, bugun:() => R.U.todayISO() })` */
  function kanalKur(ortam){
    let son = null;
    async function cek(){
      try{
        const b = ortam.hkm ? ortam.hkm() : null;
        if(!b || typeof b.settings !== 'function') return null;
        const a = b.settings() || {};
        if(!a.enabled || !a.token || !b.urlOk(a.url)) return null;
        const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
        if(!f) return null;
        const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        const zaman = ctrl ? setTimeout(() => ctrl.abort(), 4000) : null;
        try{
          const res = await f(String(a.url).replace(/\/$/, '') + '/api/kanal/' + b.MODULE
            + '?date=' + encodeURIComponent(ortam.bugun()), {
            headers:{ 'Authorization':yz('ortak.ofis.bearer') + a.token },
            signal:ctrl ? ctrl.signal : undefined,
          });
          if(res.status !== 200) return null;
          const temiz = kanalTemizle(await res.json(), b.MODULE);
          if(temiz) son = temiz;
          return temiz;
        }finally{
          if(zaman) clearTimeout(zaman);
        }
      }catch(e){
        return null;
      }
    }
    function guncel(){ return son && son.date === ortam.bugun() ? son : null; }
    /* Patron brifingine girecek biçim: Türkçe hüküm, etiketli bulgu. */
    function brifingIcin(){
      const k = guncel();
      if(!k) return null;
      const out = { kaynak:'HKM (King) · ' + k.date, moduller:{} };
      if(k.king){
        out.king_onerisi = k.king.text
          + (k.king.state === 'proposed' ? ' (kullanıcının onayını bekliyor)' : '');
      }
      Object.keys(k.moduller).forEach(m => {
        const x = k.moduller[m];
        out.moduller[MODULLER[m].ad] = x.verdict
          ? { hukum:HUKUM[x.verdict],
            bulgular:x.bulgular.map(b => b.text + (b.cert ? ' (' + ETIKET[b.cert] + ')' : '')) }
          : { hukum:'bugün veri gelmedi' };
      });
      return out;
    }
    return { cek, guncel, brifingIcin };
  }

  /* ----------------------------------------------------- BAM'a iş iletmek

     Modül sohbetinde «10 soru hazırla» ya da «… araştır» denirse iş
     HKM'deki BAM'a gider (HKM core/bam.py): modül → modül Patronu → BAM
     Patronu → ofisler. Sonuç teklif olarak geri döner; modül kendi koduyla
     uygular. Karar kurallıdır. HKM kapalıysa iş açılmaz ve bu SÖYLENİR. */
  function kucuk(s){
    return String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  }
  function bamIstegi(metin){
    const k = kucuk(metin);
    /* Katalog ürünü («türev hakkında özet hazırla»): önce o sınanır, çünkü
       «kaynaklı rapor hazırla, araştırarak» bir araştırma değil üründür —
       HKM sohbeti de bu sırayla bakar (core/sohbet.py). */
    if(window.LIFEOS && LIFEOS.Urun && LIFEOS.Urun.istekMi(metin)) return { tur:'urun' };
    if(/araştır(?:\b|ır mısın|sana|mani|manı)/.test(k)) return { tur:'arastirma' };
    if(/(hazırla|üret)/.test(k) && /(soru|test|kart|flashcard|alıştırma)/.test(k)){
      return { tur:'uretim' };
    }
    return null;
  }

  /* BAM maddesini karta çevirir — modülün KENDİ doğrulaması. HKM'nin
     kalite kontrolüne güvenip bozuk maddeyi yazmak, sözleşmeyi karşı
     tarafa devretmek olurdu. Soru: beş farklı şık ve tek doğru harf;
     alıştırma: yönerge + madde + cevap; kart: ön + arka. Bozuk madde düşer.
     AYS ve ESP aynı kuralı kullanır (iki kopya bir gün ayrışırdı). */
  const HARF = 'ABCDE';
  function bamMadde(tur, m){
    const t = (x, n) => {
      const v = String(x == null ? '' : x).trim();
      return v && v.length <= n ? v : null;
    };
    if(!m || typeof m !== 'object') return null;
    if(tur === 'soru'){
      const soru = t(m.soru, 1500), cozum = t(m.cozum, 2000);
      const sec = Array.isArray(m.secenekler) && m.secenekler.length === 5
        ? m.secenekler.map(x => t(x, 300)) : null;
      if(!soru || !cozum || !sec || sec.indexOf(null) >= 0) return null;
      if(new Set(sec.map(x => x.toLocaleLowerCase('tr'))).size !== 5) return null;
      const i = typeof m.dogru === 'string' && m.dogru.length === 1 ? HARF.indexOf(m.dogru) : -1;
      if(i < 0) return null;
      return { front:soru + '\n\n' + sec.map((x, k) => HARF[k] + ') ' + x).join('\n'),
        back:yz('ortak.ofis.dogru') + HARF[i] + ') ' + sec[i] + '\n\n' + cozum };
    }
    if(tur === 'alistirma'){
      const y = t(m.yonerge, 300), md = t(m.madde, 500), c = t(m.cevap, 200);
      return y && md && c ? { front:y + '\n' + md, back:c } : null;
    }
    if(tur === 'kart'){
      const on = t(m.on, 500), arka = t(m.arka, 500);
      return on && arka ? { front:on, back:arka } : null;
    }
    return null;
  }

  const BAM_SONRASI = {
    uretim:yz('ortak.ofis.maddeler-kalite-kontrolunden')
      + 'onaylarsan kart olarak eklenir.',
    arastirma:yz('ortak.ofis.arastirma-bitince-hkm-ofis-t')
      + 'için «doğrulanmadı» diye işaretli olur.',
  };
  const OFIS_ADI = { kayit:'Kayıt', arastirma:'Araştırma', planlama:'Planlama', uretim:'Üretim' };

  /* MERKEZ MODELİ (2026-10-20, kullanıcı: «model ayarlarının hepsi HKM'de
     olmalı»). Modül anahtar tutmaz: ofis ajanının cümlesini HKM kurar
     (HKM core/ofismodel.py, rol «<modül>.sohbet», atama yoksa King'den
     miras). HKM kapalıysa ya da model atanmamışsa sebep döner; modül kendi
     kural cümlesine düşer (AGENTS §1.4: bağımlı değil). Durum önbellekte
     tutulur: ekran beklemez.
     `merkezModelKur({ hkm:() => Beacon, fetch? })` → { bagli(), durum(), tazele(), sor(req) } */
  function merkezModelKur(ortam){
    let son = null;          // sohbet: { ok, model, provider, note, at }
    let sonGorsel = null;    // gorsel (görüntü okuma) kademesi
    function baglanti(){
      const b = ortam.hkm ? ortam.hkm() : null;
      const a = b && typeof b.settings === 'function' ? (b.settings() || {}) : {};
      if(!b || !a.enabled || !a.token || !(b.urlOk ? b.urlOk(a.url) : a.url)) return null;
      return { b, url:String(a.url).replace(/\/$/, ''), token:a.token };
    }
    async function istek(yol, govde, sureMs){
      const c = baglanti();
      if(!c) return { ok:false, reason:'hkm-yok', note:yz('ortak.ofis.hkm-bagli-degil') };
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      if(!f) return { ok:false, reason:'hkm-yok', note:yz('ortak.ofis.bu-ortamda-ag-istegi-yok') };
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const zaman = ctrl ? setTimeout(() => ctrl.abort(), sureMs) : null;
      try{
        const res = await f(c.url + yol, Object.assign({ headers:{ 'Content-Type':'application/json', 'Authorization':yz('ortak.ofis.bearer') + c.token },
          signal:ctrl ? ctrl.signal : undefined }, govde ? { method:'POST', body:JSON.stringify(govde) } : {}));
        const g = await res.json();
        return g && typeof g === 'object' ? g : { ok:false, reason:'bozuk', note:yz('ortak.ofis.hkm-cevabi-okunamadi') };
      }catch(e){
        return { ok:false, reason:'hkm-ulasilamadi', note:yz('ortak.ofis.hkm-ye-ulasilamadi') };
      }finally{ if(zaman) clearTimeout(zaman); }
    }
    const modul = () => { const c = baglanti(); return c && c.b.MODULE ? String(c.b.MODULE).toLowerCase() : ''; };
    async function tazele(){
      if(!baglanti()){ son = { ok:false, reason:'hkm-yok', note:yz('ortak.ofis.hkm-bagli-degil'), at:Date.now() }; return son; }
      const r = await istek('/api/ofis/durum?modul=' + encodeURIComponent(modul()), null, 4000);
      son = Object.assign({}, r, { at:Date.now() });
      const g = await istek('/api/ofis/durum?modul=' + encodeURIComponent(modul()) + '&yetenek=gorsel', null, 4000);
      sonGorsel = Object.assign({}, g, { at:Date.now() });
      return son;
    }
    /* req: { sistem, mesajlar:[{ role, text, images? }], baglam, yetenek?:'sohbet'|'gorsel' }.
       Görüntü son kullanıcı mesajından alınır ({ mime, data } base64). */
    async function sor(req){
      const yetenek = req.yetenek === 'gorsel' ? 'gorsel' : 'sohbet';
      const ms = req.mesajlar || [];
      const sonM = ms[ms.length - 1] || {};
      const r = await istek('/api/ofis/cevap', { modul:modul(), yetenek, sistem:String(req.sistem || ''),
        mesajlar:ms.map(m => ({ role:m.role, text:m.text })), baglam:String(req.baglam || ''),
        gorseller:yetenek === 'gorsel' ? (sonM.images || []).map(x => ({ mime:x.mime, data:x.data })) : undefined }, 90000);
      if(r && r.reason === 'no-model'){
        const k = { ok:false, reason:'no-model', note:r.note, at:Date.now() };
        if(yetenek === 'gorsel') sonGorsel = Object.assign({}, sonGorsel || {}, k); else son = Object.assign({}, son || {}, k);
      }
      return r;
    }
    return { bagli:() => !!baglanti(), durum:() => son, gorselDurum:() => sonGorsel,
      hazir:() => !!(son && son.ok && baglanti()), gorselHazir:() => !!(sonGorsel && sonGorsel.ok && baglanti()), tazele, sor };
  }

  /* `bamKur({ hkm:() => R.Beacon })` → { ilet(talep) } */
  function bamKur(ortam){
    async function ilet(talep){
      const istek = bamIstegi(talep) || { tur:'uretim' };
      /* Ürün King'in iş emriyle yapılır (modül adına); bitince modüle
         `urun.add` teklifi olarak döner (brand/ortak/urun.js). */
      if(istek.tur === 'urun' && window.LIFEOS && LIFEOS.Urun){
        return await LIFEOS.Urun.kur({ hkm:ortam.hkm, fetch:ortam.fetch,
          store:() => null }).iste(talep);
      }
      const b = ortam.hkm ? ortam.hkm() : null;
      const a = b && typeof b.settings === 'function' ? (b.settings() || {}) : {};
      if(!b || !a.enabled || !a.token || !b.urlOk(a.url)){
        return { ok:false, metin:yz('ortak.ofis.bunu-hkm-deki-bam-hazirlar-a')
          + yz('ortak.ofis.rehber-hkm-den-baglaninca-ye') };
      }
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      try{
        const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        const zaman = ctrl ? setTimeout(() => ctrl.abort(), 4000) : null;
        let res, g;
        try{
          res = await f(String(a.url).replace(/\/$/, '') + '/api/bam/is', {
            method:'POST',
            headers:{ 'Content-Type':'application/json', 'Authorization':yz('ortak.ofis.bearer') + a.token },
            body:JSON.stringify({ talep:String(talep || '').slice(0, 2000),
              hedef_modul:b.MODULE, kaynak:b.MODULE }),
            signal:ctrl ? ctrl.signal : undefined,
          });
          g = await res.json();
        }finally{
          if(zaman) clearTimeout(zaman);
        }
        if(res.status === 200 && g && g.ok){
          const yol = (g.ofisler || []).map(o => OFIS_ADI[o] || o).join(' → ');
          /* Materyali kart olarak alabilen AYS ve ESP (material.add). Oteki
             modul icin «burada gorunur» demek yalan olurdu. ESP seti yalniz
             dil ya da tarih destesine alir. */
          const sonra = istek.tur === 'uretim' && ['ays', 'esp'].indexOf(b.MODULE) < 0
            ? yz('ortak.ofis.materyal-hkm-ofis-te-hazir')
            : istek.tur === 'uretim' && b.MODULE === 'esp'
              ? BAM_SONRASI.uretim + ' Kartlar setin konusuna göre dil ya da tarih destesine girer.'
              : BAM_SONRASI[istek.tur];
          return { ok:true, id:g.id, metin:(g.yeni ? yz('ortak.ofis.bam-a-ilettim-is') + g.id + ': ' + yol + '). '
            : yz('ortak.ofis.bu-is-bam-da-zaten-acik') + g.id + '). ') + sonra };
        }
        return { ok:false, metin:(g && (g.soru || g.note)) || yz('ortak.ofis.bam-isi-acamadi') };
      }catch(e){
        return { ok:false, metin:yz('ortak.ofis.hkm-ye-ulasilamadi-is-acilma') };
      }
    }
    return { ilet };
  }

  return { MODULLER, KATLAR, ILKELER, katOf, konum, istem, selamMi, sayiHavuzu, yankiMi, kanalKur, bamIstegi, bamKur, bamMadde, merkezModelKur };
})();
