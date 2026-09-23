/* HAFIZA — sistemin seni hatırlama biçimi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hafiza.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   ==================================================================

   DÖRT KATMAN

   Sistemin senin hakkında bildiği her şey dört katmandan birindedir ve
   katman HER ZAMAN görünür:

     ölçülen   modüllerin verisi (uyku, net, dakika). Burada SAKLANMAZ:
               modülün kendi kaydıdır ve zaten etiketlidir.
     soz       SENİN SÖZÜN — «hatırla: sabahları daha verimliyim».
               Yalnız sen yazarsın; hiçbir ajan değiştiremez.
     sohbet    SOHBETTEN — seçimlerinden ve konuşmalarından kural
               motorunun kaydettiği tercih («diksiyonu kapattı»).
     cikarim   ÇIKARIM — kural motorunun örüntü bulgusu. Her zaman
               «tahmin» etiketiyle görünür; yanlışsa silersin.

   MODEL HAFIZAYA YAZAMAZ. Bir dil modelinin «kullanıcı X'i sever»
   diye kalıcı kayıt bırakması, halüsinasyonu kalıcı yapmak olurdu
   (AGENTS.md §1.1). `kaynak:'model'` olan kayıt reddedilir; «senin
   sözün»e yalnız `kullanici`, «çıkarım»a yalnız `kural` yazar.

   HER MODÜL KENDİ HAFIZASINI TUTAR. HKM kapalıyken de hatırlanır
   (AGENTS.md §1.4). HKM bağlıysa (işaret açık, jeton var) her
   değişiklikte hafızanın ANLIK GÖRÜNTÜSÜ HKM'ye gider ve King onu
   okur; HKM kendi kopyasını eşitler (HKM core/memory.py esitle).
   Gönderim beklenmez ve hiçbir koşulda fırlatmaz.

   KOMUTLAR HKM ile aynıdır — iki yerde iki ayrı dil öğrenilmesin:
     «hatırla: …» · «bunu hatırla: …» · «unutma: …» · «aklında tut: …»
     «hafızam» · «neyi hatırlıyorsun» · «benim hakkımda ne biliyorsun»
     «3 unut» · «#3 unut» · «3 numarayı unut» */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Hafiza = (function(){
  const KATMANLAR = {
    soz:{ ad:'Senin sözün', etiket:'senin sözün',
      not:'Senin yazdığın. Hiçbir ajan değiştiremez.' },
    sohbet:{ ad:'Sohbetten', etiket:'sohbetten',
      not:'Seçimlerinden ve konuşmalarından kural motorunun kaydettiği tercih.' },
    cikarim:{ ad:'Çıkarım', etiket:'tahmin',
      not:'Kural motorunun örüntü bulgusu. Tahmindir; yanlışsa sil.' },
  };
  const KAYNAK_IZNI = { soz:['kullanici'], sohbet:['kullanici', 'kural'], cikarim:['kural'] };
  const MAX_METIN = 600;
  const MAX_KAYIT = 200;
  const ANAHTAR = 'meta/hafiza';

  function temizMetin(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  function yeniId(){
    return 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* Geçerli kayıt mı? Depodan gelen bozuk kayıt sessizce düşer. */
  function gecerli(k){
    return !!(k && typeof k === 'object' && typeof k.id === 'string'
      && KATMANLAR[k.katman] && temizMetin(k.metin));
  }

  function ekle(liste, kayit){
    const l = (liste || []).filter(gecerli);
    const k = kayit || {};
    const metin = temizMetin(k.metin);
    const katman = KATMANLAR[k.katman] ? k.katman : 'soz';
    const kaynak = k.kaynak || 'kullanici';
    if(!metin) return { ok:false, why:'Hatırlanacak bir şey yazılmamış.' };
    if(metin.length > MAX_METIN) return { ok:false, why:'Hafıza kaydı ' + MAX_METIN + ' karakteri geçemez.' };
    if(KAYNAK_IZNI[katman].indexOf(kaynak) < 0){
      return { ok:false, why:kaynak === 'model'
        ? 'Model hafızaya yazamaz; yalnız sen ve kural motoru yazar.'
        : 'Bu katmana bu kaynak yazamaz.' };
    }
    const ayni = l.filter(x => x.durum !== 'unutuldu' && x.katman === katman
      && x.metin.toLocaleLowerCase('tr') === metin.toLocaleLowerCase('tr'))[0];
    if(ayni) return { ok:false, why:'Bunu zaten hatırlıyorum.', kayit:ayni };
    const yeni = {
      id:k.id || yeniId(), metin, katman, kaynak,
      kapsam:String(k.kapsam || 'hepsi').slice(0, 24),
      at:k.at || new Date().toISOString(), durum:'etkin',
    };
    let sonuc = l.concat([yeni]);
    /* Sınır aşılırsa EN ESKİ çıkarım önce gider, sonra en eski sohbet;
       senin sözün en son gider — o senin yazdığındır. */
    ['cikarim', 'sohbet', 'soz'].forEach(kt => {
      while(sonuc.filter(x => x.durum !== 'unutuldu').length > MAX_KAYIT){
        const i = sonuc.findIndex(x => x.durum !== 'unutuldu' && x.katman === kt && x.id !== yeni.id);
        if(i < 0) break;
        sonuc = sonuc.slice(0, i).concat(sonuc.slice(i + 1));
      }
    });
    return { ok:true, liste:sonuc, kayit:yeni };
  }

  function unut(liste, id){
    const l = (liste || []).filter(gecerli);
    const k = l.filter(x => x.id === id && x.durum !== 'unutuldu')[0];
    if(!k) return { ok:false, why:'Böyle bir hafıza kaydı yok.' };
    return { ok:true, liste:l.filter(x => x.id !== id), kayit:k };
  }

  /* Etkin kayıtlar, eskiden yeniye. Kapsam verilirse o kapsam + 'hepsi'. */
  function etkin(liste, kapsam){
    return (liste || []).filter(gecerli).filter(x => x.durum !== 'unutuldu')
      .filter(x => !kapsam || x.kapsam === 'hepsi' || x.kapsam === kapsam)
      .sort((a, b) => String(a.at).localeCompare(String(b.at)));
  }

  /* Ajan istemine girecek metin. Her satır katman etiketini taşır:
     ajan «tahmin»i gerçek, «sohbetten»i senin sözün sanmasın. */
  function baglam(liste, opts){
    const o = opts || {};
    const l = etkin(liste, o.kapsam).slice(-(o.limit || 12));
    if(!l.length) return '';
    return 'KULLANICI HAKKINDA HATIRLANANLAR (etiketiyle; «tahmin» kesin değildir, '
      + '«senin sözün» kullanıcının kendi cümlesidir, değiştirme):\n'
      + l.map(x => '- (' + KATMANLAR[x.katman].etiket + ') ' + x.metin).join('\n');
  }

  /* ------------------------------------------------------- komutlar */

  const EKLE_ONEK = ['bunu hatırla:', 'hatırla:', 'bunu hatirla:', 'hatirla:', 'unutma:',
    'aklında tut:', 'aklinda tut:'];
  const LISTE = ['hafızam', 'hafizam', 'neyi hatırlıyorsun', 'neyi hatirliyorsun',
    'benim hakkımda ne biliyorsun', 'benim hakkımda neyi hatırlıyorsun'];

  function komut(metin){
    const ham = String(metin || '').trim();
    const k = ham.toLocaleLowerCase('tr').replace(/[?!.]+$/, '').trim();
    for(const on of EKLE_ONEK){
      if(k.indexOf(on) === 0) return { tur:'ekle', metin:ham.slice(on.length).trim() };
    }
    if(LISTE.indexOf(k) >= 0) return { tur:'liste' };
    const m = k.match(/^#?(\d+)\s*(?:numarayı|numaralı hafızayı|nolu|\.)?\s*(unut|sil)$/);
    if(m) return { tur:'unut', sira:Number(m[1]) };
    return null;
  }

  function listeMetni(liste){
    const l = etkin(liste);
    if(!l.length) return 'Henüz hatırladığım bir şey yok. «hatırla: …» diye yazarsan tutarım.';
    return l.map((x, i) => (i + 1) + '. (' + KATMANLAR[x.katman].etiket + ') ' + x.metin).join('\n')
      + '\n\nBirini silmek için «3 unut» gibi yaz.';
  }

  /* --------------------------------------------------------- depo

     Her uygulama kendi deposunu verir: `kur({ store:() => R.Store,
     durum:() => R.S, hkm:() => R.Beacon })`. Getter kullanılır çünkü
     testler depoyu her seferinde değiştirir. `hkm` verilmezse HKM'ye
     hiçbir şey gitmez. */
  function kur(ortam){
    const store = () => ortam.store();
    const durum = () => ortam.durum();
    function liste(){ return (durum().hafiza || []).slice(); }

    async function yukle(){
      let doc = null;
      try{ doc = await store().get(ANAHTAR); }catch(e){ doc = null; }
      durum().hafiza = (doc && Array.isArray(doc.items)) ? doc.items.filter(gecerli) : [];
      return durum().hafiza;
    }
    async function yaz(l){
      durum().hafiza = l;
      await store().set(ANAHTAR, { items:l });
    }
    /* HKM'ye bildirim — anlık görüntü. HKM isteğe bağlıdır: kapalıysa,
       yanıt vermezse ya da hata verirse hiçbir şey bozulmaz. Kaçan bir
       bildirim kaybolmaz: bir sonraki değişiklikte ya da açılışta
       hafızanın TAMAMI yeniden gider. */
    async function hkmeGonder(){
      try{
        const b = ortam.hkm ? ortam.hkm() : null;
        if(!b || typeof b.settings !== 'function') return { ok:false, reason:'yok' };
        const a = b.settings() || {};
        if(!a.enabled) return { ok:false, reason:'off' };
        if(!a.token || !b.urlOk(a.url)) return { ok:false, reason:'ayar' };
        const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
        if(!f) return { ok:false, reason:'yok' };
        const items = etkin(liste()).map(x => ({ id:x.id, metin:x.metin, katman:x.katman,
          kaynak:x.kaynak, at:x.at }));
        const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        const zaman = ctrl ? setTimeout(() => ctrl.abort(), 4000) : null;
        try{
          const res = await f(String(a.url).replace(/\/$/, '') + '/api/memory/sync/' + b.MODULE, {
            method:'POST',
            headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + a.token },
            body:JSON.stringify({ items }),
            signal:ctrl ? ctrl.signal : undefined,
          });
          return { ok:res.status === 200, status:res.status };
        }finally{
          if(zaman) clearTimeout(zaman);
        }
      }catch(e){
        return { ok:false, reason:'ag' };
      }
    }
    async function ekleK(metin, opts){
      const r = ekle(liste(), Object.assign({ metin }, opts || {}));
      if(r.ok){ await yaz(r.liste); hkmeGonder(); }
      return r;
    }
    async function unutK(id){
      const r = unut(liste(), id);
      if(r.ok){ await yaz(r.liste); hkmeGonder(); }
      return r;
    }
    /* Sohbet cümlesi bir hafıza komutuysa işler ve cevabı döndürür;
       değilse null. Cevabı kural motoru yazar. */
    async function komutIsle(metin, opts){
      const c = komut(metin);
      if(!c) return null;
      if(c.tur === 'liste') return { text:listeMetni(liste()) };
      if(c.tur === 'ekle'){
        const r = await ekleK(c.metin, Object.assign({ katman:'soz', kaynak:'kullanici' }, opts || {}));
        return { text:r.ok ? 'Hatırlıyorum: «' + r.kayit.metin + '». Silmek istersen «hafızam» de.'
          : r.why, kayit:r.kayit || null };
      }
      if(c.tur === 'unut'){
        const k = etkin(liste())[c.sira - 1];
        if(!k) return { text:c.sira + ' numaralı bir hafıza kaydı yok. «hafızam» diye bakabilirsin.' };
        await unutK(k.id);
        return { text:'Unuttum: «' + k.metin + '».' };
      }
      return null;
    }
    return { yukle, liste, ekle:ekleK, unut:unutK, hkmeGonder,
      etkin:kapsam => etkin(liste(), kapsam),
      baglam:opts => baglam(liste(), opts), komutIsle };
  }

  return { KATMANLAR, KAYNAK_IZNI, MAX_METIN, MAX_KAYIT, ANAHTAR,
    ekle, unut, etkin, baglam, komut, listeMetni, gecerli, kur };
})();
