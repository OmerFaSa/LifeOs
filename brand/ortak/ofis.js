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
            headers:{ 'Authorization':'Bearer ' + a.token },
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
        back:'Doğru: ' + HARF[i] + ') ' + sec[i] + '\n\n' + cozum };
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
    uretim:'Maddeler kalite kontrolünden geçince burada teklif olarak görünür; '
      + 'onaylarsan kart olarak eklenir.',
    arastirma:'Araştırma bitince HKM › Ofis’te okursun. Kaynağa erişim henüz olmadığı '
      + 'için «doğrulanmadı» diye işaretli olur.',
  };
  const OFIS_ADI = { kayit:'Kayıt', arastirma:'Araştırma', planlama:'Planlama', uretim:'Üretim' };

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
        return { ok:false, metin:'Bunu HKM’deki BAM hazırlar ama HKM bağlı değil. '
          + 'Rehber › HKM’den bağlanınca yeniden iste.' };
      }
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      try{
        const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        const zaman = ctrl ? setTimeout(() => ctrl.abort(), 4000) : null;
        let res, g;
        try{
          res = await f(String(a.url).replace(/\/$/, '') + '/api/bam/is', {
            method:'POST',
            headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + a.token },
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
            ? 'Materyal HKM › Ofis’te hazır olur; bu sistem onu henüz kart olarak alamıyor.'
            : istek.tur === 'uretim' && b.MODULE === 'esp'
              ? BAM_SONRASI.uretim + ' Kartlar setin konusuna göre dil ya da tarih destesine girer.'
              : BAM_SONRASI[istek.tur];
          return { ok:true, id:g.id, metin:(g.yeni ? 'BAM’a ilettim (iş #' + g.id + ': ' + yol + '). '
            : 'Bu iş BAM’da zaten açık (#' + g.id + '). ') + sonra };
        }
        return { ok:false, metin:(g && (g.soru || g.note)) || 'BAM işi açamadı.' };
      }catch(e){
        return { ok:false, metin:'HKM’ye ulaşılamadı; iş açılmadı. HKM açıkken yeniden iste.' };
      }
    }
    return { ilet };
  }

  return { MODULLER, KATLAR, ILKELER, katOf, konum, istem, kanalKur, bamIstegi, bamKur, bamMadde };
})();
