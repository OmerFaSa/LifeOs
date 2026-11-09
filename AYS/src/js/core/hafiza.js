/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/hafiza.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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

   SIRA: gönderim beklenmediği için görüntüler HKM'ye gönderildiği
   sırayla VARMAYABİLİR — «ekle»nin görüntüsü geç gelirse «unut»la
   silinen kaydı HKM'de diriltirdi. Bu yüzden her görüntü sayfa başına
   bir `oturum` ve her gönderimde artan bir `sira` taşır; HKM aynı
   oturumda uygulanandan eski görüntüyü yok sayar. Görüntü ile sıra
   aynı anda, ilk beklemeden önce alınır: büyük sıra hep daha yeni
   görüntüdür. Saat kullanılmaz; saat geri gidebilir.

   KOMUTLAR HKM ile aynıdır — iki yerde iki ayrı dil öğrenilmesin:
     «hatırla: …» · «bunu hatırla: …» · «unutma: …» · «aklında tut: …»
     «hafızam» · «neyi hatırlıyorsun» · «benim hakkımda ne biliyorsun»
     «3 unut» · «#3 unut» · «3 numarayı unut» */
window.LIFEOS.PARCA.yazilar({
  'ortak.hafiza.senin-sozun':'Senin sözün',
  'ortak.hafiza.senin-yazdigin-hicbir-ajan-d':'Senin yazdığın. Hiçbir ajan değiştiremez.',
  'ortak.hafiza.secimlerinden-ve-konusmalari':'Seçimlerinden ve konuşmalarından kural motorunun kaydettiği tercih.',
  'ortak.hafiza.kural-motorunun-oruntu-bulgu':'Kural motorunun örüntü bulgusu. Tahmindir; yanlışsa sil.',
  'ortak.hafiza.hatirlanacak-bir-sey-yazilma':'Hatırlanacak bir şey yazılmamış.',
  'ortak.hafiza.hafiza-kaydi':'Hafıza kaydı ',
  'ortak.hafiza.model-hafizaya-yazamaz-yalni':'Model hafızaya yazamaz; yalnız sen ve kural motoru yazar.',
  'ortak.hafiza.bu-katmana-bu-kaynak-yazamaz':'Bu katmana bu kaynak yazamaz.',
  'ortak.hafiza.bunu-zaten-hatirliyorum':'Bunu zaten hatırlıyorum.',
  'ortak.hafiza.boyle-bir-hafiza-kaydi-yok':'Böyle bir hafıza kaydı yok.',
  'ortak.hafiza.kullanici-hakkinda-hatirlana':'KULLANICI HAKKINDA HATIRLANANLAR (etiketiyle; «tahmin» kesin değildir, ',
  'ortak.hafiza.henuz-hatirladigim-bir-sey-y':'Henüz hatırladığım bir şey yok. «hatırla: …» diye yazarsan tutarım.',
  'ortak.hafiza.bearer':'Bearer ',
  'ortak.hafiza.hatirliyorum':'Hatırlıyorum: «',
  'ortak.hafiza.unuttum':'Unuttum: «',
});


window.LIFEOS = window.LIFEOS || {};

LIFEOS.Hafiza = (function(){
  const KATMANLAR = {
    soz:{ ad:yz('ortak.hafiza.senin-sozun'), etiket:'senin sözün',
      not:yz('ortak.hafiza.senin-yazdigin-hicbir-ajan-d') },
    sohbet:{ ad:'Sohbetten', etiket:'sohbetten',
      not:yz('ortak.hafiza.secimlerinden-ve-konusmalari') },
    cikarim:{ ad:'Çıkarım', etiket:'tahmin',
      not:yz('ortak.hafiza.kural-motorunun-oruntu-bulgu') },
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
  /* BAĞLAM HARİTASI (King-Bench hafıza paketi): her kayıt bir DOSYAYA girer; uzun kullanımda hafıza şişse de
     ajana yalnız soruyla ilgili kayıtlar gider. Dosya kural motorunun sınıfıdır (kelime haritası), model değil. */
  const DOSYALAR = [
    ['saglik', 'Sağlık', /(ilaç|hap|doktor|hekim|alerji|intolerans|hasta|ağrı|tansiyon|vitamin|tahlil|ameliyat|migren|astım|kronik)/],
    ['uyku', 'Uyku', /(uyku|uyu|yatarım|kalkarım|gece kuşu|sabahçı|horla)/],
    ['beslenme', 'Beslenme', /(kahve|çay|yemek|yerim|yemem|içerim|içmem|içiyorum|vegan|vejetaryen|şeker|tatlı|kahvaltı|diyet|laktoz|gluten|(?:^|\s)et(?:\s|$))/],
    ['calisma', 'Çalışma ve öğrenme', /(ders|sınav|soru|çalış|verimli|konu|matematik|fizik|kimya|biyoloji|türkçe|okul|deneme|kitap|okum|kelime|almanca|ingilizce|odak)/],
    ['aliskanlik', 'Alışkanlıklar', /(her gün|her sabah|her akşam|genelde|alışkanlık|rutin|spor|koşu|yürüyüş|antrenman|oyun)/],
    ['insanlar', 'İnsanlar', /(annem|babam|kardeş|arkadaş|sevgili|eşim|öğretmen|hoca|ailem)/],
    ['hedef', 'Hedefler', /(hedef|olmak istiyorum|kazanmak|üniversite|bölüm|meslek)/],
  ];
  function dosyaBul(metin){
    const t = String(metin || '').toLocaleLowerCase('tr');
    const d = DOSYALAR.find(x => x[2].test(t));
    return d ? d[0] : 'genel';
  }
  const DOSYA_AD = DOSYALAR.reduce((m, d) => { m[d[0]] = d[1]; return m; }, { genel:'Genel' });
  const DURAK = new Set(['bunu', 'şunu', 'aklında', 'aklinda', 'tut', 'ben', 'benim', 'bana', 'beni', 'çok', 'daha', 'artık', 'bundan', 'sonra',
    'eskiden', 'hep', 'için', 'olan', 'olarak', 'gibi', 'ama', 'fakat', 'yani', 'şey']);
  /* Kelime kökü (kaba): 5 harf; Türkçe çekim eklerinde aynı kelimeyi yakalamaya yeter. */
  function kokler(metin){
    return [...new Set(String(metin || '').toLocaleLowerCase('tr').split(/[^a-zçğıöşü0-9]+/).filter(w => (w.length >= 3 || /^\d+$/.test(w)) && !DURAK.has(w)).map(w => /^\d+$/.test(w) ? w : w.slice(0, 5)))];
  }
  const OLUMSUZ = /(?:mem|mam|meyiz|mayız|miyorum|mıyorum|muyorum|müyorum|mez|maz)(?:\s|$|[.,!])|(?:^|\s)(?:değil|yok|hiç|asla)(?:\s|$)/;
  /* Gizli bilgi hafızaya yazılmaz (King-Bench güven: «kart numaram 4543 …, hafızana yaz»). */
  const GIZLI = /(şifre|parola|pin kod|kart numar|kredi kart|iban|kimlik numar|tc kimlik|(?:\d[ -]?){12,19})/i;

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
    if(!metin) return { ok:false, why:yz('ortak.hafiza.hatirlanacak-bir-sey-yazilma') };
    if(metin.length > MAX_METIN) return { ok:false, why:yz('ortak.hafiza.hafiza-kaydi') + MAX_METIN + ' karakteri geçemez.' };
    if(KAYNAK_IZNI[katman].indexOf(kaynak) < 0){
      return { ok:false, why:kaynak === 'model'
        ? yz('ortak.hafiza.model-hafizaya-yazamaz-yalni')
        : yz('ortak.hafiza.bu-katmana-bu-kaynak-yazamaz') };
    }
    if(GIZLI.test(metin)) return { ok:false, why:'Şifre, kart, IBAN ya da kimlik numarası gibi bilgileri hafızaya yazmam; bunlar güvenli bir yerde durmalı.' };
    const ayni = l.filter(x => x.durum !== 'unutuldu' && x.katman === katman
      && x.metin.toLocaleLowerCase('tr') === metin.toLocaleLowerCase('tr'))[0];
    if(ayni) return { ok:false, why:yz('ortak.hafiza.bunu-zaten-hatirliyorum'), kayit:ayni };
    /* Benzer kayıt (kökleri %75 ortak) yeniden yazılmaz: hafıza tekrarla şişmez. */
    const kk = kokler(metin), ortak = x => { const b = kokler(x.metin); const kes = kk.filter(w => b.indexOf(w) >= 0).length; return { kes, j:kes / (new Set(kk.concat(b)).size || 1) }; };
    const yeniOlumsuz = OLUMSUZ.test(metin.toLocaleLowerCase('tr') + ' '), degisti = /(?:^|\s)(?:artık|bundan sonra|eskiden|şimdi)(?:\s|$)/i.test(metin);
    let guncellenen = null;
    const eskiler = [];
    /* Yalnız kullanıcının hafıza komutu («aklında tut», «hatırla:») akıllı eklenir; envanter, tanışma gibi
       kural yazımları aynen yazılır (beş kişilik boyutu birbirinin «güncellemesi» sanılmasın). */
    for(const x of (k.akilli ? l : []).filter(x => x.durum !== 'unutuldu' && x.katman === katman)){
      const o2 = ortak(x), xOlumsuz = OLUMSUZ.test(x.metin.toLocaleLowerCase('tr') + ' ');
      if(kk.length >= 2 && o2.j >= 0.75 && xOlumsuz === yeniOlumsuz && !degisti) return { ok:false, why:yz('ortak.hafiza.bunu-zaten-hatirliyorum'), kayit:x };
      /* Çelişki: aynı konu (ortak kök), ters yön ya da «artık …» — yeni söz eskisinin yerine geçer. */
      if(o2.kes >= 1 && (xOlumsuz !== yeniOlumsuz || degisti) && dosyaBul(x.metin) === dosyaBul(metin)) eskiler.push(x);
    }
    /* Aynı konudaki BÜTÜN eski sözler yeni sözle yer değiştirir («kahve içmem», «sabahları kahve içmem» → «artık içiyorum»). */
    if(eskiler.length){ guncellenen = { metin:eskiler.map(x => x.metin).join('», «'), liste:eskiler }; eskiler.forEach(x => l.splice(l.indexOf(x), 1)); }
    const yeni = {
      id:k.id || yeniId(), metin, katman, kaynak,
      kapsam:String(k.kapsam || 'hepsi').slice(0, 24),
      at:k.at || new Date().toISOString(), durum:'etkin',
    };
    /* Kişi modeli (kisi.js, 2026-10-17): kaydın yaşam alanı; yoksa «genel». */
    if(typeof k.alan === 'string' && /^[a-z]{2,16}$/.test(k.alan)) yeni.alan = k.alan;
    yeni.dosya = dosyaBul(metin);
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
    return { ok:true, liste:sonuc, kayit:yeni, guncellenen };
  }

  function unut(liste, id){
    const l = (liste || []).filter(gecerli);
    const k = l.filter(x => x.id === id && x.durum !== 'unutuldu')[0];
    if(!k) return { ok:false, why:yz('ortak.hafiza.boyle-bir-hafiza-kaydi-yok') };
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
    /* Kişi modeli izni (kisi.js, Faz 5): ajan yalnız izinli alanı görür. */
    const K = (window.LIFEOS || {}).KISI;
    const hepsi = etkin(liste, o.kapsam).filter(x => !o.ajan || !x.alan || !K || K.izinli(x.alan, o.ajan));
    let l = hepsi.slice(-(o.limit || 12));
    if(o.soru && hepsi.length > (o.limit || 12)){
      /* Şişmeyen bağlam: soruyla kökü ya da dosyası ortak en çok 6 kayıt + en yeni 4 (sıra korunur). */
      const sk = kokler(o.soru), sd = dosyaBul(o.soru);
      const puan = x => kokler(x.metin).filter(w => sk.indexOf(w) >= 0).length * 2 + ((x.dosya || dosyaBul(x.metin)) === sd && sd !== 'genel' ? 1 : 0);
      const ilgili = hepsi.map(x => [x, puan(x)]).filter(p => p[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6).map(p => p[0]);
      const sec = new Set(ilgili.concat(hepsi.slice(-4)));
      l = hepsi.filter(x => sec.has(x));
    }
    if(!l.length) return '';
    return yz('ortak.hafiza.kullanici-hakkinda-hatirlana')
      + '«senin sözün» kullanıcının kendi cümlesidir, değiştirme):\n'
      + l.map(x => '- (' + KATMANLAR[x.katman].etiket + ') ' + x.metin).join('\n');
  }

  /* ------------------------------------------------------- komutlar */

  const EKLE_ONEK = ['bunu hatırla:', 'hatırla:', 'bunu hatirla:', 'hatirla:', 'unutma:',
    'aklında tut:', 'aklinda tut:'];
  const LISTE = ['hafızam', 'hafizam', 'neyi hatırlıyorsun', 'neyi hatirliyorsun',
    'benim hakkımda ne biliyorsun', 'benim hakkımda neyi hatırlıyorsun'];

  /* Doğal biçim (King 5 deneme kullanımı, 2026-11-08: «kahve içmem, bunu aklında tut» bir ders aracına
     gidiyordu). «unutma» ve «hatırla» yalnız «bunu» ile: «ilacımı içmeyi unutma» bir hatırlatma isteğidir. */
  const EKLE_SON = /^(.{3,200}?)\s*[,;–-]?\s+(?:(?:bunu|şunu)\s+)?(?:aklında|aklinda)\s+(?:tut|olsun)$|^(.{3,200}?)\s*[,;–-]?\s+(?:bunu|şunu)\s+(?:unutma|hatırla|hatirla)$/;
  const EKLE_BAS = /^(?:(?:bunu|şunu)\s+)?(?:aklında|aklinda)\s+tut\s*[,:]?\s+(.{3,200})$/;

  function komut(metin){
    const ham = String(metin || '').trim();
    const k = ham.toLocaleLowerCase('tr').replace(/[?!.]+$/, '').trim();
    for(const on of EKLE_ONEK){
      if(k.indexOf(on) === 0) return { tur:'ekle', metin:ham.slice(on.length).trim() };
    }
    if(ham.indexOf('?') < 0){
      /* k, ham'ın küçük harfli hâlidir; sondaki noktalama dışında konumlar aynıdır. */
      const s = k.match(EKLE_SON);
      if(s) return { tur:'ekle', metin:ham.slice(0, (s[1] || s[2]).length).replace(/[\s,;–-]+$/, '') };
      const b = k.match(EKLE_BAS);
      if(b) return { tur:'ekle', metin:ham.slice(k.length - b[1].length, k.length).trim() };
    }
    if(LISTE.indexOf(k) >= 0) return { tur:'liste' };
    if(/^(?:hafızamı|hafizami|bildiklerini) (?:dosyalara|dosya dosya|konulara|kategorilere) göre (?:göster|ayır|listele)$|^hafıza (?:dosyalarım|haritam)$|^hafızamın haritası$/.test(k)) return { tur:'dosyalar' };
    const da = k.match(/^(sağlık|uyku|beslenme|çalışma|alışkanlık|insanlar|hedef)\w* dosyamı? (?:göster|aç)$/);
    if(da) return { tur:'dosya', dosya:(DOSYALAR.find(d => d[1].toLocaleLowerCase('tr').indexOf(da[1].slice(0, 5)) === 0) || [])[0] || 'genel' };
    const ui = k.match(/^(.{2,40}?)(?:[' ]?(?:la|le|yla|yle))? ilgili (?:hatırladıklarını|hatırladığın her şeyi|olanları|her şeyi|bildiklerini) unut$/);
    if(ui) return { tur:'unutIcerik', kelime:ui[1].trim() };
    const m = k.match(/^#?(\d+)\s*(?:numarayı|numaralı hafızayı|nolu|\.)?\s*(unut|sil)$/);
    if(m) return { tur:'unut', sira:Number(m[1]) };
    return null;
  }

  function dosyaMetni(liste, tek){
    const l = etkin(liste);
    if(!l.length) return yz('ortak.hafiza.henuz-hatirladigim-bir-sey-y');
    const g = {};
    l.forEach((x, i) => { const d = x.dosya || dosyaBul(x.metin); (g[d] = g[d] || []).push((i + 1) + '. ' + x.metin); });
    const sira = DOSYALAR.map(d => d[0]).concat(['genel']).filter(d => g[d] && (!tek || d === tek));
    if(!sira.length) return (DOSYA_AD[tek] || 'Bu') + ' dosyasında kayıt yok.';
    return sira.map(d => DOSYA_AD[d] + ' (' + g[d].length + '): ' + g[d].join(' · ')).join('\n') + '\n\nBirini silmek için «3 unut», bir konudakileri silmek için «sporla ilgili hatırladıklarını unut» yaz.';
  }

  function listeMetni(liste){
    const l = etkin(liste);
    if(!l.length) return yz('ortak.hafiza.henuz-hatirladigim-bir-sey-y');
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
    /* Görüntü sırası (yukarıda SIRA): sayfa başına bir oturum. */
    const oturum = 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    let sayac = 0;
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
        /* Görüntü ve sırası BİRLİKTE, ilk await'ten önce. */
        const items = etkin(liste()).map(x => ({ id:x.id, metin:x.metin, katman:x.katman,
          kaynak:x.kaynak, at:x.at, alan:x.alan || null,
          gorenler:x.alan && window.LIFEOS.KISI ? window.LIFEOS.KISI.gorenler(x.alan) : null }));
        const sira = ++sayac;
        const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        const zaman = ctrl ? setTimeout(() => ctrl.abort(), 4000) : null;
        try{
          const res = await f(String(a.url).replace(/\/$/, '') + '/api/memory/sync/' + b.MODULE, {
            method:'POST',
            headers:{ 'Content-Type':'application/json', 'Authorization':yz('ortak.hafiza.bearer') + a.token },
            body:JSON.stringify({ items, oturum, sira }),
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
        const r = await ekleK(c.metin, Object.assign({ katman:'soz', kaynak:'kullanici', akilli:true }, opts || {}));
        if(r.ok && r.guncellenen) return { text:'Güncelledim: «' + r.guncellenen.metin + '» yerine artık «' + r.kayit.metin + '» (' + DOSYA_AD[r.kayit.dosya] + ' dosyası).', kayit:r.kayit };
        return { text:r.ok ? yz('ortak.hafiza.hatirliyorum') + r.kayit.metin + '» (' + DOSYA_AD[r.kayit.dosya] + ' dosyası). Silmek istersen «hafızam» de.'
          : r.why, kayit:r.kayit || null };
      }
      if(c.tur === 'dosyalar') return { text:dosyaMetni(liste()) };
      if(c.tur === 'dosya') return { text:dosyaMetni(liste(), c.dosya) };
      if(c.tur === 'unutIcerik'){
        const kk = kokler(c.kelime);
        const l = etkin(liste()).filter(x => kokler(x.metin).some(w => kk.some(v => w.indexOf(v.slice(0, 5)) === 0)));
        if(!l.length) return { text:'«' + c.kelime + '» ile ilgili bir hafıza kaydı yok.' };
        for(const x of l) await unutK(x.id);
        return { text:'Unuttum (' + l.length + '): ' + l.map(x => '«' + x.metin + '»').join(', ') + '.' };
      }
      if(c.tur === 'unut'){
        const k = etkin(liste())[c.sira - 1];
        if(!k) return { text:c.sira + ' numaralı bir hafıza kaydı yok. «hafızam» diye bakabilirsin.' };
        await unutK(k.id);
        return { text:yz('ortak.hafiza.unuttum') + k.metin + '».' };
      }
      return null;
    }
    return { yukle, liste, ekle:ekleK, unut:unutK, hkmeGonder,
      etkin:kapsam => etkin(liste(), kapsam),
      baglam:opts => baglam(liste(), opts), komutIsle };
  }

  /* Hafızadakini doğrudan soran cümle (King 5 deneme 2026-11-08: «ben ne içmem?» sorusunda küçük model
     «kahve içmem» kaydını görmezden gelip kahve önerdi). Cevabı kural motoru kaydın kendisiyle verir
     (AGENTS §1.1). Yalnız «ne / neyi / ne zaman / hangi / nerede / kaç» sorusu, kişinin kendisine dair
     («ben», «sınavım») ve kayıtla ortak bir kelimesi varsa; ölçüm sorusu («uykum nasıl») buraya düşmez. */
  const SORU_DURAK = new Set(['ben', 'benim', 'bana', 'beni', 'neyi', 'nedir', 'zaman', 'nerede', 'hangi', 'acaba',
    'peki', 'king', 'hatırlıyor', 'musun', 'müsün', 'misin', 'mısın', 'mıyım', 'miyim', 'hatırla']);
  function sorudaBul(liste, soru){
    const k = String(soru || '').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if(!/(?:^|\s)(?:ne|neyi|neydi|ne zaman|nedir|nerede|hangi|hangisi|hangisiydi|kaç|kimdi|mı|mi|mu|mü|mıyım|miyim|muyum|müyüm)(?:\s|$)/.test(k)) return [];
    /* Geçmiş zaman fiili («çözdüm», «çalıştım») bir ölçü sorusudur, hafıza sorusu değil (King 5 tur 5:
       «bu hafta kaç soru çözdüm» → «Bana şöyle demiştin: … deneme çözdüm 61 net»). */
    const FIIL = /(d|t)(ı|i|u|ü)m$/;
    const sozc = k.split(' ').filter(w => w.length >= 4 && !SORU_DURAK.has(w) && !FIIL.test(w));
    const kendi = /(?:^|\s)(?:ben|benim|bana|beni)(?:\s|$)/.test(k) || sozc.some(w => /m$/.test(w));
    if(!kendi || !sozc.length) return [];
    const kok = w => w.slice(0, Math.max(4, w.length - 2));
    return etkin(liste).filter(x => {
      /* Tanışma kaydı «soru → cevap»: yalnız kişinin cevabı eşleşir, sorunun kelimeleri değil; iki kelime gerekir
         (King 5 tur 5: «hasta olduğum günlerden sonra toparlanmam…» tek kelimeyle bir tanışma kaydına düşüyordu). */
      const tanisma = String(x.metin).indexOf('→') >= 0;
      const kw = String(x.metin).split('→').pop().toLocaleLowerCase('tr').split(/[^a-zçğıöşü0-9]+/);
      return sozc.filter(w => kw.some(v => v.length >= 4 && v.startsWith(kok(w)))).length >= (tanisma ? 2 : 1);
    }).slice(0, 3);
  }

  return { KATMANLAR, KAYNAK_IZNI, MAX_METIN, MAX_KAYIT, ANAHTAR, DOSYALAR,
    ekle, unut, etkin, baglam, komut, listeMetni, dosyaMetni, dosyaBul, gecerli, sorudaBul, kur };
})();
