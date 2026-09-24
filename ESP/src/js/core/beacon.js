/* HKM işareti (beacon) — «varsa gönder», asla bekletme.

   ESP HKM'yi BİLİR ama ona BAĞIMLI DEĞİLDİR (AGENTS.md §1.4): HKM
   kapalıyken, yanıt vermezken ya da hata verirken ESP bozulmaz,
   yavaşlamaz, veri kaybetmez. HKM ile konuşan her dosya (bu dosya,
   `kingteklif.js`, `yedekag.js`, `urun.js`) şu sınırlara uyar:

   1. HİÇBİR ÇİZİMDE ÇALIŞMAZ. Gönderim yalnızca kullanıcının açıkça
      istediği anda ya da gün kapanışında tetiklenir; bir ekranın açılması
      ağ trafiği doğurmaz.

   2. HİÇBİR KAYDI BLOKLAMAZ. Gönderim ateşle-ve-unut'tur; hata yakalanır
      ve yutulur. HKM kapalıyken, yavaşken ya da yokken ESP arayüzünde
      bekleme, hata ya da bozulma OLMAZ.

   3. ETİKETSİZ SAYI GÖNDERİLMEZ. Her metrik alanı dört kesinlik
      etiketinden birini taşır. Sözleşmeyi bu taraf da denetler: HKM'nin
      422 döndürmesini beklemek yerine, hatalı gövde hiç yola çıkmaz.

   4. VARSAYILAN KAPALIDIR. Açmak bilinçli bir karardır; adres, jeton ve
      gönderilen alanların tamamı kullanıcıya gösterilir.

   5. AÇIK METİN JETON AĞA ÇIKMAZ. Yerel olmayan bir adrese düz `http` ile
      gönderim reddedilir — jeton ağda açık gider. Yerel adres (127.0.0.1,
      localhost) ya da `https` şarttır.

   Bu katman bir senkronizasyon değil bir İŞARETTİR: tek yön, en iyi çaba,
   geri dönüşü yok sayılabilir. ESP'in verisi ESP'te kalır; HKM'ye giden
   şey günün ÖZETİDİR. */

window.ESP = window.ESP || {};

ESP.Beacon = (function(){
  const U = ESP.U;
  const S = ESP.S;

  const MODULE = 'esp';
  const CONTRACT = 1;              // gövde sürümü — HKM tarafıyla ortak
  const ASGARI_ARA_DK = 15;        // aynı gün içinde en sık bu kadar

  const VARSAYILAN = {
    enabled:false,
    url:'http://127.0.0.1:4200',
    token:'',
    intervalMinutes:60,
    level:'ozet',            // ozet | gelismis
    lastAt:null,                   // son DENEME
    lastOkAt:null,                 // son BAŞARILI gönderim
    lastStatus:null,               // 202 | 422 | 401 | 0 (ulaşılamadı)
    lastNote:'',
  };

  /* Yüklenmeden önce her şey KAPALIDIR. Bir ayar dosyası okunamadığında
     «varsayılan açık» davranmak, kullanıcının seçmediği bir şeyi yapmaktır. */
  let AYAR = null;
  let DEFTER = null;   // teklif defteri (asagida)

  function settings(){ return Object.assign({}, VARSAYILAN, AYAR || {}); }

  async function load(){
    try{ AYAR = (await ESP.Store.get('hkm')) || {}; }
    catch(e){ AYAR = {}; }
    /* Teklif defterinin bellekteki kopyasi da tazelenir: ambar
       degistiginde (acilis, hesap degisimi) eski kopyayla devam etmek,
       cevaplanmis bir teklifi cevapsiz sanmak olurdu. */
    DEFTER = null;
    return settings();
  }

  async function save(patch){
    AYAR = Object.assign({}, settings(), patch || {});
    await ESP.Store.set('hkm', AYAR);
    return settings();
  }


  /* --------------------------------------------------------- kapsam seviyesi

     Ilk surum gunde birkac sayi goruyordu; bu, «bu haftayi analiz et» gibi
     sorulari cevaplanamaz kiliyordu. Cozum gonderimi genisletmek ama
     GENISLIGI KULLANICININ SECMESI:

       ozet      — yuk kararini etkileyen cekirdek olcumler (VARSAYILAN)
       gelismis  — bolum bazinda ilerleme de gider

     Iki seviyede de giden sey SAYIDIR: icerik hicbir seviyede gitmez.
     Seviye degistirmek yeni bir izin ister gibi davranir: ne gonderilecegi
     yine satir satir gosterilir. */
  const LEVELS = [
    { id:'ozet', label:'Özet',
      note:'Yalnız yük kararını etkileyen çekirdek ölçümler.' },
    { id:'gelismis', label:'Gelişmiş',
      note:'Bölüm bazında ilerleme de gider — hâlâ yalnız sayı.' },
  ];

  function levelOf(){
    const id = settings().level;
    return LEVELS.some(function(l){ return l.id === id; }) ? id : 'ozet';
  }

  /* Gecmis bir gun icin GERIYE DONUK hesaplanamayan alanlar gonderilmez:
     bugunku degeri dunun tarihiyle yollamak, ambara sahte bir olcum
     yazmaktir. */
  function gecmisMi(dateISO){ return String(dateISO) !== U.todayISO(); }

  /* ----------------------------------------------------------- sözleşme

     Yerel kesinlik sözlüğü ile HKM'ninki birebir aynı DEĞİL: bu depoda
     hesaplanmış değerler yer yer «derived» diye etiketlenir. Eşleme
     AÇIK yazılır; bilinmeyen bir etiket sessizce «measured» sayılmaz,
     gövdeyi reddeder. */
  const CERT_MAP = {
    measured:'measured',
    estimated:'estimated',
    computed:'computed',
    derived:'computed',
    missing:'missing',
  };
  const CERTS = ['measured', 'estimated', 'computed', 'missing'];

  function metric(value, cert){
    const c = CERT_MAP[cert] || null;
    if(!c) return { value:null, cert:null, raw:cert };
    if(c === 'missing' || value == null || !isFinite(Number(value))){
      return { value:null, cert:'missing' };
    }
    return { value:Number(value), cert:c };
  }

  /* Eksik veri SIFIR DEĞİLDİR: değeri olmayan alan «missing» gider,
     0 değil. Bu kural gövdenin tek satırında bile bozulmamalı. */
  function contract(body){
    const hata = [];
    if(!body || typeof body !== 'object') return ['gövde yok'];
    if(body.module !== MODULE) hata.push('modül adı yanlış');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(body.date || ''))) hata.push('tarih ISO değil');
    const m = body.metrics;
    if(!m || typeof m !== 'object' || !Object.keys(m).length){
      hata.push('metrik yok');
      return hata;
    }
    Object.keys(m).forEach(function(k){
      const x = m[k];
      if(!x || typeof x !== 'object' || !x.cert){ hata.push(k + ': etiket yok'); return; }
      if(CERTS.indexOf(x.cert) < 0){ hata.push(k + ': geçersiz etiket ' + x.cert); return; }
      if(x.cert !== 'missing' && typeof x.value !== 'number'){
        hata.push(k + ': ' + x.cert + ' etiketli alanda sayı yok');
      }
      if(x.cert === 'missing' && x.value != null){
        hata.push(k + ': veri yok etiketiyle değer gönderilemez');
      }
    });
    return hata;
  }

  /* ------------------------------------------------------------ toplama

     Gönderilen şey GÜNÜN ÖZETİDİR: kart metni, not içeriği, kitap adı
     gitmez. HKM'ye giden en küçük veri kümesi, onun işini görebilecek
     kadarıdır — fazlası bir maliyet, bir sızıntı yüzeyi ve bir iddiadır. */
  function collect(dateISO){
    const d = dateISO || U.todayISO();
    const out = {};

    /* Retansiyon BUGÜNÜN kart durumundan hesaplanır: kartın kararlılığı ve
       son tekrardan bu yana geçen süre. Geçmiş bir gün için bu sayı o günün
       ölçümü DEĞİLDİR — o yüzden geçmişte gönderilmez. */
    if(gecmisMi(d)){
      out.retention = metric(null, 'missing');
      out.retention_cards = metric(null, 'missing');
    }else{
      const ret = ESP.SRS.retention(null, d);
      out.retention = metric(ret.value, ret.cert);
      out.retention_cards = ret.n ? metric(ret.n, 'computed') : metric(null, 'missing');
    }

    const dk = ESP.Model.minutesOf(d);
    out.practice_minutes = dk == null ? metric(null, 'missing') : metric(dk, 'measured');

    /* Sentez açığı: en eski BAĞLANMAMIŞ notun yaşı. Hiç not yoksa bu bir
       «0 gün açık» değil, ölçülmemiş bir alandır. */
    const notlar = (S.notes || []);
    if(!notlar.length){
      out.synthesis_gap_days = metric(null, 'missing');
    }else{
      const bagsiz = ESP.Intellect.unlinkedNotes();
      if(!bagsiz.length){
        out.synthesis_gap_days = metric(0, 'computed');
      }else{
        const yas = bagsiz.map(function(n){
          return U.diffDays(String(n.createdAt || '').slice(0, 10), d);
        }).filter(function(x){ return isFinite(x); });
        out.synthesis_gap_days = yas.length
          ? metric(Math.max.apply(null, yas), 'computed')
          : metric(null, 'missing');
      }
    }


    /* SEVİYE — üçünde de AYNI sözleşme (bkz. brand/seviye/).

       HKM bu üç sayıyı yan yana koyabilsin diye gönderilir; HKM'nin
       kendi XP'si YOKTUR ve olmamalı: üçünün üstünde değil yanındadır.

       Geçmiş bir gün için yalnız O GÜNÜN XP'si anlamlıdır; toplam ve
       kademe BUGÜNÜN durumudur ve geçmişe yazılmaz. Deftere hiç kayıt
       düşmemiş bir gün «0 XP» değil «veri yok»tur. */
    if(ESP.XP && ESP.XP.durum()){
      const sv = ESP.XP.durum();
      out.xp_today = ESP.XP.gunuVar(d)
        ? metric(ESP.XP.gunToplami(d), 'computed') : metric(null, 'missing');
      if(!gecmisMi(d)){
        out.xp_total = metric(sv.toplam, 'computed');
        out.level_step = metric(sv.bitmisBasamak, 'computed');
        out.level_tier = metric(sv.kademe, 'computed');
        /* Kademe İÇİNDEKİ adım (1–3) de gönderilir. «basamak
           numarasından hesaplanır» demek, aynı formülü merkezde ikinci
           kez yazmak ve iki kopyanın bir gün ayrışması demekti. */
        out.level_sub = metric(sv.basamak, 'computed');
      }
    }

    /* ROZET SAYAÇLARI — merkez profilinin girdisi.

       Üç arayüz birbirini GÖRMEZ (AGENTS.md §1.4); «bütün alanların
       toplamı 5000 saat» gibi bir rozet yalnız merkezde hesaplanabilir
       ve bu satırlar onun girdisidir. Merkez bunları TOPLAR, kendi
       rozetini kendi verir; modülün kendi rozetiyle karışmaz.

       Kademe gibi bunlar da BUGÜNÜN durumudur ve geçmişe yazılmaz:
       «üç ay önceki gün toplam 400 saatti» diye bir ölçüm yoktur,
       olan tek şey bugünkü toplamdır. */
    if(!gecmisMi(d) && ESP.Basarim){
      const rz = ESP.Basarim.isaret();
      if(rz){
        Object.keys(rz).forEach(function(k){
          out[k] = metric(rz[k], 'computed');
        });
      }
    }
    if(levelOf() === 'gelismis') Object.assign(out, genis(d));
    return out;
  }

  /* Gelişmiş kapsam — disiplin disiplin dakika. Hangi kitabı okuduğun,
     hangi parçayı çalıştığın ve not içeriği gitmez; giden şey AÇIK olan
     disiplinlerin o günkü ölçülmüş dakikasıdır.

     Kapalı bir disiplin hiç gönderilmez: kapalı bölümün «0 dakika»sı bir
     ölçüm değil, olmayan bir sorunun cevabıdır. */
  function genis(d){
    const out = {};
    (ESP.DISCIPLINES || []).forEach(function(disc){
      if(ESP.Mod && !ESP.Mod.isOn(disc.id)) return;
      const dk = ESP.Model.minutesOf(d, disc.id);
      out['disc.' + disc.id + '.minutes'] = dk == null
        ? metric(null, 'missing') : metric(dk, 'measured');
    });
    const oturum = ESP.Model.sessionsOf(d);
    out.sessions = oturum.length ? metric(oturum.length, 'measured')
      : metric(null, 'missing');

    if(gecmisMi(d)) return out;
    out.cards_total = metric((S.cards || []).length, 'measured');
    out.cards_due = metric((S.cards || []).filter(function(c){
      return c.dueAt && c.dueAt <= d; }).length, 'computed');
    return out;
  }


  function payload(dateISO){
    const d = dateISO || U.todayISO();
    return { module:MODULE, date:d, version:CONTRACT, metrics:collect(d) };
  }

  /* ETİKETİN TÜRKÇESİ BURADA YAZILMAZ.

     Bu dört karşılık üç arayüzün `beacon.js` dosyasında AYRI AYRI
     yazılıydı. Üçü de aynıydı; aynı kalacaklarını söyleyen hiçbir şey
     yoktu — ve ayrıştıklarında fark ancak iki ekran yan yana konunca
     görülürdü. Tek kaynak `brand/ortak/kesinlik.js`; oradan üçe
     yayılır ve `tools/ortak.py --denetle` ayrışmayı CI'da yakalar.

     Katalog yüklenmemişse KİMLİK yazılır, uydurma bir karşılık
     değil (AGENTS.md §1.7). */
  function etiketAdi(cert){
    const L = window.LIFEOS;
    const e = L && L.KESINLIK_ILE ? L.KESINLIK_ILE(cert) : null;
    return e ? e.ad : String(cert);
  }

  /* Kullanıcı ne gönderildiğini GÖRMEDEN açmamalı. */
  function preview(dateISO){
    const p = payload(dateISO);
    const satirlar = Object.keys(p.metrics).map(function(k){
      const m = p.metrics[k];
      return { key:k, value:m.value, cert:m.cert,
        label:etiketAdi(m.cert) };
    });
    return { payload:p, rows:satirlar, errors:contract(p) };
  }


  /* ------------------------------------------------------------- esleme

     Jetonu elle yapistirmak, HKM'nin hic acilmamasinin en olasi sebebiydi.
     Esleme, jetonu gevsetmeden bu surtunmeyi kaldirir: HKM yuzunde iki
     dakikalik bir pencere acilir, bu dugme jetonu dogrudan alir ve yalniz
     bu cihazda saklar. Pencere kapaliysa hicbir sey olmaz — ve bu bir
     hata degil, dogru davranistir. */
  async function pair(url){
    const adres = String(url || settings().url || '').replace(/\/$/, '');
    if(!urlOk(adres)){
      return { ok:false, note:'Yerel olmayan bir adresle eşleme yapılmaz.' };
    }
    let res;
    try{
      res = await fetch(adres + '/api/pair', { method:'POST' });
    }catch(e){
      return { ok:false, note:'HKM\'ye ulaşılamadı. Daemon çalışıyor mu?' };
    }
    let govde = null;
    try{ govde = await res.json(); }catch(e){ govde = null; }
    if(res.status !== 200 || !govde || !govde.token){
      return { ok:false, status:res.status,
        note:(govde && govde.note) || 'Eşleme penceresi kapalı. HKM yüzünde '
           + '«Cihazları bağla» dedikten sonra iki dakika içinde dene.' };
    }
    await save({ url:adres, token:govde.token, enabled:true });
    return { ok:true, note:'Bağlandı. İşaret açıldı; ne gönderildiği aşağıda yazıyor.' };
  }

  /* ------------------------------------------------------------- gönderim */

  function urlOk(url){
    const s = String(url || '');
    if(/^https:\/\//i.test(s)) return true;
    return /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?(\/|$)/i.test(s);
  }

  /* Kısıt bir hız sınırı değil, bir GÜRÜLTÜ sınırıdır: aynı günün aynı
     özeti dakikada bir gönderilirse HKM'nin ambarı bilgi değil tekrar
     biriktirir. */
  function due(nowMs){
    const a = settings();
    if(!a.lastAt) return true;
    const ara = Math.max(ASGARI_ARA_DK, Number(a.intervalMinutes) || 60);
    const fark = (nowMs || Date.now()) - Date.parse(a.lastAt);
    return !(fark >= 0 && fark < ara * 60000);
  }

  /* Tek giriş noktası. HİÇBİR KOŞULDA fırlatmaz: çağıran taraf bir
     arayüz akışının ortasındadır ve orada bir ağ hatası, kaydı kaybetmek
     için sebep değildir. */
  async function send(opts){
    const o = opts || {};
    const a = settings();
    if(!a.enabled && !o.force) return { ok:false, reason:'off', note:'HKM işareti kapalı.' };
    if(!a.token) return { ok:false, reason:'no-token', note:'Jeton girilmemiş.' };
    if(!urlOk(a.url)){
      return { ok:false, reason:'unsafe-url',
        note:'Yerel olmayan bir adrese düz http ile gönderim yapılmaz: jeton '
           + 'ağda açık gider. https ya da yerel adres gerekir.' };
    }
    if(!o.force && !due(Date.now())){
      return { ok:false, reason:'throttled', note:'Son gönderimin üzerinden yeterli süre geçmedi.' };
    }
    const body = payload(o.date);
    const hata = contract(body);
    if(hata.length){
      await save({ lastAt:new Date().toISOString(), lastStatus:0,
        lastNote:'Gövde sözleşmeyi geçmedi: ' + hata[0] });
      return { ok:false, reason:'contract', errors:hata,
        note:'Etiketsiz ya da bozuk alan var; gövde yola çıkmadı.' };
    }
    let durum = 0, not = '';
    try{
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const zaman = ctrl ? setTimeout(function(){ ctrl.abort(); }, 4000) : null;
      const res = await fetch(String(a.url).replace(/\/$/, '') + '/api/sync/' + MODULE, {
        method:'POST',
        headers:{ 'Content-Type':'application/json',
          'Authorization':'Bearer ' + a.token },
        body:JSON.stringify(body),
        signal:ctrl ? ctrl.signal : undefined,
      });
      if(zaman) clearTimeout(zaman);
      durum = res.status;
      not = durum === 202 ? 'Gönderildi.'
        : durum === 422 ? 'HKM gövdeyi reddetti (etiket ya da biçim).'
        : durum === 401 ? 'Jeton kabul edilmedi.'
        : 'Beklenmeyen yanıt: ' + durum;
    }catch(e){
      durum = 0;
      not = 'HKM\'ye ulaşılamadı. Bu bir hata değil bir DURUMDUR: HKM '
          + 'isteğe bağlıdır ve kapalıyken ' + MODULE.toUpperCase() + ' olduğu gibi çalışır.';
    }
    const simdi = new Date().toISOString();
    await save(Object.assign({ lastAt:simdi, lastStatus:durum, lastNote:not },
      durum === 202 ? { lastOkAt:simdi } : {}));
    return { ok:durum === 202, status:durum, note:not, payload:body };
  }


  /* ------------------------------------------------------------- geçmiş

     Capraz bulgu ve yon tahlili GECMIS ister: bugunden itibaren biriken bir
     ambar ilk iki ay hicbir sey soyleyemez. «Gecmisi gonder» o boslugu
     kapatir — ama yalnizca geriye donuk hesaplanabilen alanlarla. */
  async function backfill(days, onProgress){
    const a = settings();
    if(!a.enabled) return { ok:false, reason:'off', sent:0 };
    if(!a.token) return { ok:false, reason:'no-token', sent:0 };
    if(!urlOk(a.url)) return { ok:false, reason:'unsafe-url', sent:0 };
    const n = Math.max(1, Math.min(Number(days) || 30, 180));
    const bugun = U.todayISO();
    let gonderilen = 0, bos = 0, hata = null;
    for(let i = n - 1; i >= 0; i--){
      const t = U.iso(U.addDays(U.parse(bugun), -i));
      const govde = payload(t);
      /* Bir gunun gonderilmesi icin en az bir OLCULMUS alan gerekir.
         «Hesaplandi» yetmez: sinava kalan gun her tarih icin hesaplanabilir
         ve yalniz onu tasiyan bir govde, kullanicinin o gun bir sey yaptigi
         izlenimini birakir. Ambarda «gorulen gun» sayisini boyle sismek,
         sessiz bir yalandir. */
      const dolu = Object.keys(govde.metrics).some(function(k){
        return govde.metrics[k].cert === 'measured';
      });
      if(!dolu || contract(govde).length){ bos++; continue; }
      let durum = 0;
      try{
        const res = await fetch(String(a.url).replace(/\/$/, '') + '/api/sync/' + MODULE, {
          method:'POST',
          headers:{ 'Content-Type':'application/json',
            'Authorization':'Bearer ' + a.token },
          body:JSON.stringify(govde),
        });
        durum = res.status;
      }catch(e){ durum = 0; }
      if(durum !== 202){ hata = durum; break; }
      gonderilen++;
      if(typeof onProgress === 'function') onProgress(gonderilen, n);
    }
    await save({ lastAt:new Date().toISOString(),
      lastStatus:hata == null ? 202 : hata,
      lastNote:hata == null
        ? gonderilen + ' günlük geçmiş gönderildi (' + bos + ' gün ölçümsüz).'
        : 'Geçmiş gönderimi ' + hata + ' ile durdu.' });
    return { ok:hata == null, sent:gonderilen, empty:bos, status:hata || 202 };
  }


  /* --------------------------------------------------------- niyet kuyrugu

     HKM bu sisteme YAZMAZ. «Yarin iki saat matematik» gibi bir istek
     HKM'de bir NIYET olur; burasi acilista kuyrugu SORAR, kullaniciya
     gosterir ve onaylanirsa ESP kendi koduyla uygular.

     Uc kural:

     1. Kuyruk okumak bir izin degildir: gelen sey bir TEKLIFTIR ve
        kullanici gormeden hicbir sey uygulanmaz.
     2. Tanimadigimiz bir tur SESSIZCE ATLANIR — uzaktan gelen bir sozluk,
        bu sistemde calistirilacak bir komut degildir.
     3. HKM kapali, yavas ya da yoksa hicbir sey olmaz: kuyruk bos gelir. */
  const INTENT_KINDS = ['plan.add', 'focus.set', 'load.reduce', 'material.add', 'kayit.add',
    'urun.add', 'unite.add', 'belge.add'];

  /* ---------- teklif defteri: cevabin SAHIBI bu taraftir

     Kuyruk artik acik teklifleri her soruşta yeniden veriyor (cevaplanmamis
     bir teklif sayfa yenilendiginde kaybolmasin diye). Bu, tek basina yeni
     bir tehlike dogurur: aynı teklif iki kez UYGULANABILIR.

     Bu yuzden cevabin kaydi burada, YEREL olarak tutulur ve ag'dan ONCE
     yazilir. Uc hal ayrilir:

       applying      — uygulama basladi, bitip bitmedigi BILINMIYOR
       applied       — uygulandi
       acknowledged  — goruldu; uygulamak kullanicinin isi
       dismissed     — istenmedi
       unknown       — yarida kalmisti, kullanici kapatti

     «applying» bir basarisizlik degil bir BILINMEZLIKTIR: uygulama
     sirasinda sekme kapanirsa teklif ne yeniden uygulanir ne de sessizce
     yutulur; kullaniciya «belirsiz» diye gosterilir. Uydurmak yerine
     bilmedigimizi soylemek, bu sistemin her yerindeki kural.

     `reported` alani ayri bir sozdur: is YERELDE bitmis ama merkeze
     BILDIRILEMEMIS olabilir. O kayit silinmez; bir sonraki kuyruk
     sorusunda bildirim tekrar denenir. */
  const DEFTER_YOLU = 'hkmIntentLog';
  const DEFTER_SINIR = 200;             // defter sinirsiz buyumez

  async function intentLog(){
    if(DEFTER) return DEFTER;
    let ham = null;
    try{ ham = await ESP.Store.get(DEFTER_YOLU); }catch(e){ ham = null; }
    DEFTER = (ham && typeof ham === 'object' && ham.entries
      && typeof ham.entries === 'object') ? ham.entries : {};
    return DEFTER;
  }

  async function markIntent(id, state, reported, note, closed){
    const d = await intentLog();
    d[String(id)] = { state:state, reported:!!reported, closed:!!closed,
      note:String(note || ''), at:new Date().toISOString() };
    const anahtar = Object.keys(d);
    if(anahtar.length > DEFTER_SINIR){
      anahtar.sort(function(x, y){
        return String(d[x].at).localeCompare(String(d[y].at)); });
      anahtar.slice(0, anahtar.length - DEFTER_SINIR)
        .forEach(function(k){ delete d[k]; });
    }
    try{ await ESP.Store.set(DEFTER_YOLU, { entries:d }); }catch(e){ /* yerel */ }
    return d[String(id)];
  }

  async function forgetIntent(id){
    const d = await intentLog();
    delete d[String(id)];
    try{ await ESP.Store.set(DEFTER_YOLU, { entries:d }); }catch(e){ /* yerel */ }
  }

  /* Bildirilememis cevaplar — bağlantı gelince tekrar denenir. */
  async function flushIntentReports(){
    const d = await intentLog();
    let denenen = 0, basarili = 0;
    for(const id of Object.keys(d)){
      const k = d[id];
      if(k.reported || k.closed || k.state === 'applying') continue;
      denenen++;
      const r = await answerIntent(id, k.state);
      if(r.ok){ basarili++; await markIntent(id, k.state, true, k.note); continue; }
      /* Merkez «boyle bir niyet yok» (404) ya da «zaten baska bir cevabi
         var» (409) diyorsa tekrar denemek bir sey duzeltmez; sonsuza
         kadar denemek de o kaydi asla kapatmamak olurdu. Kayit KAPANIR
         ama «bildirildi» YAZILMAZ: bildirilmedi, denenmeyecek. */
      if(r.status === 404 || r.status === 409){
        await markIntent(id, k.state, false, k.note, true);
      }
    }
    return { tried:denenen, ok:basarili };
  }

  /* Uygulanip uygulanmadigi BILINMEYEN teklifler. Arayuz bunlari bir
     eylem olarak degil bir UYARI olarak gosterir. */
  async function intentDoubts(){
    const d = await intentLog();
    return Object.keys(d).filter(function(id){ return d[id].state === 'applying'; })
      .map(function(id){ return Object.assign({ id:id }, d[id]); });
  }

  async function intents(){
    const a = settings();
    if(!a.enabled || !a.token || !urlOk(a.url)) return [];
    let res;
    try{
      res = await fetch(String(a.url).replace(/\/$/, '') + '/api/intents/'
        + MODULE + '/take', {
        method:'POST',
        headers:{ 'Content-Type':'application/json',
          'Authorization':'Bearer ' + a.token },
      });
    }catch(e){ return []; }
    if(res.status !== 200) return [];
    let govde = null;
    try{ govde = await res.json(); }catch(e){ return []; }
    const liste = (govde && govde.intents) || [];
    const defter = await intentLog();
    /* Merkez hala acik sanıyorsa ama biz cevaplamissak: gosterme, BILDIR.
       Kuyruk acik teklifi tekrar tekrar verir; ikinci kez sormak
       kullaniciya ayni seyi iki kez sordurmak olurdu. */
    const gosterilecek = liste.filter(function(n){
      if(!n || INTENT_KINDS.indexOf(n.kind) < 0 || !n.payload) return false;
      return !defter[String(n.id)];
    });
    /* Gunun kaydi ONAYDAN ONCE okunur: kart «ESP şöyle okudu» der. */
    for(const n of gosterilecek){
      if(n.kind !== 'kayit.add') continue;
      try{ n.okuma = kayitOku(n); }catch(e){ n.okuma = null; }
    }
    /* BAM ünitesi de ONAYDAN ONCE sinanir (core/unite.js): kart «ESP şunu
       ekleyecek» der ya da neden ekleyemeyecegini soyler. */
    for(const n of gosterilecek){
      if(n.kind !== 'unite.add' || !ESP.Unite) continue;
      try{ n.unite = await ESP.Unite.onizle(n); }catch(e){ n.unite = null; }
    }
    for(const n of gosterilecek){
      if(n.kind !== 'belge.add' || !ESP.Belge) continue;
      try{ n.belge = await ESP.Belge.onizle(n); }catch(e){ n.belge = null; }
    }
    flushIntentReports().catch(function(){});
    return gosterilecek;
  }

  /* Kullanicinin cevabi HKM'ye bildirilir: gorulmemis bir niyetle
     reddedilmis bir niyeti ayirmak, kuyrugun tek anlamli tarafi.

     Ikinci parametre artik bir bayrak degil bir DURUM da olabilir:

       applied      — modul teklifi kendi koduyla uyguladi
       acknowledged — teklif goruldu; uygulamak kullanicinin isi
       dismissed    — istenmedi
       unknown      — uygulama yarida kaldi, sonuc BILINMIYOR

     Dordunu bire indirmek, birbirinden farkli dort sonucu tek kelimeyle
     anlatmak olurdu; merkezdeki kayit da o kadar dogru olurdu. */
  function _durumAdi(applied){
    if(applied === true) return 'applied';
    if(applied === false) return 'dismissed';
    return String(applied);
  }

  async function answerIntent(id, applied){
    const a = settings();
    const durum = _durumAdi(applied);
    if(['applied', 'acknowledged', 'dismissed', 'unknown'].indexOf(durum) < 0){
      return { ok:false, error:'Geçersiz durum.' };
    }
    if(!a.enabled || !a.token || !urlOk(a.url)) return { ok:false };
    try{
      const res = await fetch(String(a.url).replace(/\/$/, '') + '/api/intent/'
        + id + '/' + durum, {
        method:'POST',
        headers:{ 'Content-Type':'application/json',
          'Authorization':'Bearer ' + a.token },
      });
      return { ok:res.status === 200, status:res.status };
    }catch(e){ return { ok:false }; }
  }

  /* Bir niyeti UYGULAMAK: yazan ESP'nin kendi kodudur.

     ESP'de bir «oturum» ölçülmüş bir çalışmadır; ileriye dönük bir teklif
     oturum olarak yazılamaz — yazılsaydı yapılmamış bir çalışma ölçülmüş
     görünürdü. Teklif bu yüzden bir HATIRLATICI olur. */
  const APPLIABLE = ['plan.add', 'material.add', 'kayit.add', 'urun.add', 'unite.add', 'belge.add'];

  function canApply(n){
    if(!n || APPLIABLE.indexOf(n.kind) < 0) return false;
    if(n.kind === 'kayit.add') return !!(n.okuma && n.okuma.yazilacak.length);
    if(n.kind === 'unite.add') return !!(n.unite && n.unite.ok);
    if(n.kind === 'belge.add') return !!(n.belge && n.belge.ok);
    return true;
  }

  /* GÜNÜN KAYDI (kayit.add) — akşam yoklamasının cevabı.

     Hatırlatıcı kuralının tersi burada geçerlidir ve sebebi aynıdır:
     `plan.add` YAPILACAK bir işti, oturum olarak yazılsaydı yapılmamış
     çalışma ölçülmüş görünürdü. `kayit.add` ise kullanıcının YAPTIM dediği
     iştir; komut paletine «30 dakika gitar çaldım» yazmakla aynı yoldan
     oturum olur. HKM cümleyi yalnız yönlendirir: ESP onu KENDİ
     ayrıştırıcısıyla okur (core/parse.js), neyin yazılacağını gösterir ve
     kullanıcı «Kaydet» derse yazar. Süresi ya da disiplini tanınmayan
     parça sebebiyle gösterilir, uydurulmaz. */
  function kayitOku(n){
    const p = (n && n.payload) || {};
    const gun = String(p.date || '');
    const metin = String(p.metin || '').trim().slice(0, 400);
    const out = { gun, yazilacak:[], yazilamaz:[], anlasilmayan:[] };
    if(!U.isISO(gun) || gun > U.todayISO()){
      out.yazilamaz.push({ metin, why:'Tarih geçersiz ya da ileri bir gün; kayıt ancak geçmiş bir güne yazılır.' });
      return out;
    }
    if(!metin || !ESP.Parse){ out.anlasilmayan.push(metin); return out; }
    const r = ESP.Parse.parseSession(metin);
    r.rows.forEach(function(x){
      const d = ESP.DISCIPLINE_BY_ID[x.disc];
      out.yazilacak.push({ baslik:'Oturum', metin:x.note,
        satirlar:[(d ? d.label : x.disc) + ': ' + U.fmtMin(x.minutes)
          + (x.count != null ? ' · ' + U.fmtNum(x.count) + ' ' + (x.countWhat || '') : '')],
        disc:x.disc, minutes:x.minutes, count:x.count });
    });
    r.unmatched.forEach(function(u){ out.yazilamaz.push({ metin:u.text, why:u.why }); });
    return out;
  }

  async function kayitUygula(n){
    const o = kayitOku(n);     /* onay aninda YENIDEN okunur */
    if(!o.yazilacak.length){
      return { ok:false, error:'ESP bu kayıttan yazılacak bir şey çıkaramadı.' };
    }
    const yazilan = [];
    for(const y of o.yazilacak){
      await ESP.Model.addSession(o.gun, { disc:y.disc, minutes:y.minutes, count:y.count,
        note:'HKM kaydı' });
      yazilan.push(y.satirlar[0]);
    }
    return { ok:true, note:yazilan.length + ' oturum yazıldı (' + o.gun + ': '
      + yazilan.join(', ') + '). Yanlışsa o günün oturumlarından silebilirsin.' };
  }

  /* BAM MATERYALİ — Üretim Ofisi'nin kalite kontrolünden geçen set (HKM
     core/bam.py). Kayıt HKM'den ÇEKİLİR, maddeler ESP'nin KENDİ koduyla
     yeniden doğrulanır (LIFEOS.Ofis.bamMadde) ve kart olarak eklenir.

     HANGİ DESTE? ESP'nin iki tür destesi var: dil desteleri ve tarih
     destesi. Deste setin başlığından ve konusundan KURALLA okunur: bir dil
     adı geçiyorsa o dilin destesi, tarih konusuysa tarih destesi. İkisi de
     değilse set EKLENMEZ ve bu söylenir — felsefe kartlarını İngilizce
     destesine koymak, desteyi bozmak olurdu (AGENTS.md §1.7).

     Aynı set iki kez eklenmez; HKM'ye ulaşılamazsa hiçbir kart yazılmaz.
     Kartlar «bam» etiketi taşır ve kaynağı doğrulanmadı sayılır. */
  const TARIH_RE = /(tarih|yüzyıl|imparatorluk|savaş|devrim|antlaşma|hanedan|osmanlı|selçuklu|roma|bizans)/;
  function desteOf(kayit){
    const k = String((kayit.baslik || '') + ' ' + ((kayit.govde || {}).konu || ''))
      .replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
    /* Dil adı TAM hâliyle aranır («rusça», «ingilizce»): kökten aramak
       «Rus Devrimi»ni Rusça destesine koyardı. */
    const dil = (ESP.LANGS || []).find(function(l){
      const ad = String(l.label || '').replace(/İ/g, 'i').toLocaleLowerCase('tr');
      return (ad && k.indexOf(ad) >= 0) || k.indexOf(String(l.native || '').toLowerCase()) >= 0;
    });
    if(dil) return { deck:dil.id, ad:dil.label + ' destesi' };
    if(TARIH_RE.test(k)) return { deck:ESP.HISTORY_DECK || 'history', ad:'tarih destesi' };
    return null;
  }

  async function materyalUygula(p){
    const kid = Number(p.kayit_id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, error:'Materyal kimliği geçersiz.' };
    const etiket = 'bam:' + kid;
    if((ESP.S.cards || []).some(function(c){ return (c.tags || []).indexOf(etiket) >= 0; })){
      return { ok:false, error:'Bu set zaten eklenmiş.' };
    }
    const a = settings();
    if(!a.token || !urlOk(a.url)) return { ok:false, error:'HKM bağlantısı kurulmamış; materyal alınamaz.' };
    let kayit = null;
    try{
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const zaman = ctrl ? setTimeout(function(){ ctrl.abort(); }, 4000) : null;
      const res = await fetch(String(a.url).replace(/\/$/, '') + '/api/bam/kayit/' + kid, {
        headers:{ 'Authorization':'Bearer ' + a.token },
        signal:ctrl ? ctrl.signal : undefined,
      });
      if(zaman) clearTimeout(zaman);
      if(res.status === 200){ const g = await res.json(); kayit = g && g.kayit; }
    }catch(e){ kayit = null; }
    if(!kayit || kayit.tur !== 'materyal' || !kayit.govde){
      return { ok:false, error:'Materyal HKM’den alınamadı; HKM açıkken yeniden dene.' };
    }
    const deste = desteOf(kayit);
    if(!deste){
      return { ok:false, error:'Bu setin hangi desteye gireceğini anlayamadım: başlığında bir dil '
        + 'ya da tarih konusu yok. ESP şimdilik yalnız dil ve tarih destelerine kart alır.' };
    }
    const tur = kayit.govde.tur;
    const kartlar = (Array.isArray(kayit.govde.maddeler) ? kayit.govde.maddeler : [])
      .slice(0, 50).map(function(m){ return window.LIFEOS.Ofis.bamMadde(tur, m); }).filter(Boolean);
    if(!kartlar.length) return { ok:false, error:'Setteki maddelerin hiçbiri ESP’nin denetimini geçmedi.' };
    for(const k of kartlar){
      await ESP.Model.saveCard(ESP.Model.newCard({ front:k.front, back:k.back, lang:deste.deck,
        context:'BAM #' + kid + ' — kaynağı doğrulanmadı', tags:['bam', etiket] }));
    }
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
    return { ok:true, note:kartlar.length + ' kart ' + deste.ad + 'ne eklendi («'
      + String(kayit.baslik || '').slice(0, 60) + '», BAM #' + kid + '). Kaynağı doğrulanmadı; '
      + 'yanlış bulduğun kartı sil.' };
  }

  async function applyIntent(n){
    if(n && n.kind === 'kayit.add') return await kayitUygula(n);
    if(n && n.kind === 'belge.add'){
      if(!ESP.Belge) return { ok:false, error:'Belge modülü yüklenmedi.' };
      return await ESP.Belge.uygula(n.payload || {});
    }
    if(n && n.kind === 'unite.add'){
      if(!ESP.Unite) return { ok:false, error:'Ünite modülü yüklenmedi.' };
      return await ESP.Unite.uygula(n.payload || {});
    }
    if(n && n.kind === 'urun.add'){
      /* BAM ürünü (özet, rapor, sunum, pankart…): kayıt HKM'den çekilir,
         modülün KENDİ koduyla sınanır, kendi deposuna yazılır
         (core/urun.js, ortak). Ofis ekranındaki BAM ürünlerinden açılır. */
      ESP.Urunler = ESP.Urunler || (window.LIFEOS && LIFEOS.Urun
        ? LIFEOS.Urun.kur({ store:() => ESP.Store, hkm:() => ESP.Beacon }) : null);
      if(!ESP.Urunler) return { ok:false, error:'Ürün modülü yüklenmedi.' };
      return await ESP.Urunler.uygula(n.payload || {});
    }
    if(!canApply(n)) return { ok:false, error:'Bu teklif türü uygulanmaz.' };
    if(n.kind === 'material.add') return await materyalUygula(n.payload || {});
    const p = n.payload || {};
    if(!U.isISO(String(p.date || ''))) return { ok:false, error:'Tarih geçersiz.' };
    /* Gecersiz sure sinirlandirilmaz, REDDEDILIR: -5 dakikayi 5 dakikaya
       cekmek, teklifi sessizce baska bir teklife cevirmektir. */
    const dk = Number(p.minutes);
    if(!isFinite(dk) || dk <= 0 || dk > 480){
      return { ok:false, error:'Süre geçersiz (5–480 dakika bekleniyor).' };
    }
    const disc = (ESP.DISCIPLINES || []).some(function(d){ return d.id === p.disc; })
      ? p.disc : 'lang';
    const r = await ESP.Model.saveReminder({
      disc:disc, due:p.date, repeat:'none',
      text:Math.round(dk) + ' dakika ' + disc + ' (HKM teklifi)',
    });
    if(!r.ok) return { ok:false, error:r.error || 'Hatırlatıcı yazılamadı.' };
    return { ok:true, note:p.date + ' için hatırlatıcı eklendi — ölçülmüş bir '
      + 'oturum olarak DEĞİL: yapılmamış bir çalışma ölçülmüş görünmemeli.' };
  }

  /* ---------- teklifi KAPATMAK: tek kapi

     Arayuz artik `applyIntent` + `answerIntent` ikilisini kendisi
     sirayla cagirmaz. Dort hatanin dordu de o sirada dogmustu:

       - iki tiklama iki blok yaziyordu,
       - uygulamadan sonra baglanti koparsa merkez «cevapsiz» kaliyordu,
       - bildirim basarisiz olunca kullaniciya «uygulandi» deniyordu,
       - sayfa yenilenince is bastan yapilabiliyordu.

     Sira burada tektir ve defter AG'DAN ONCE yazilir. */
  const ISLEMDE = {};

  async function resolveIntent(n, action){
    if(!n || n.id == null) return { ok:false, error:'Teklif bulunamadı.' };
    const anahtar = String(n.id);
    if(['apply', 'seen', 'dismiss'].indexOf(action) < 0){
      return { ok:false, error:'Bilinmeyen işlem.' };
    }
    /* Cift tiklama: es zamanli iki cagri tek is olur. */
    if(ISLEMDE[anahtar]) return { ok:false, error:'Bu teklif işleniyor.' };
    ISLEMDE[anahtar] = true;
    try{
      const defter = await intentLog();
      const onceki = defter[anahtar];
      const durum = action === 'apply' ? 'applied'
        : (action === 'seen' ? 'acknowledged' : 'dismissed');
      let not = '';
      let uygulandi = false;
      let geriAl = null;
      if(action === 'apply'){
        if(onceki && (onceki.state === 'applied' || onceki.state === 'applying')){
          /* En fazla BIR KEZ: daha once uygulanmis (ya da uygulanmis
             olabilecek) bir teklif tekrar plana yazilmaz. */
          not = 'Bu teklif daha önce uygulanmıştı; ikinci kez yazılmadı.';
        }else{
          await markIntent(n.id, 'applying', false, '');
          const r = await applyIntent(n);
          if(!r.ok){
            await forgetIntent(n.id);
            return { ok:false, error:r.error };
          }
          not = r.note;
          geriAl = r.geriAl || null;
          uygulandi = true;
        }
      }
      await markIntent(n.id, durum, false, not);
      const bildirim = await answerIntent(n.id, durum);
      if(bildirim.ok) await markIntent(n.id, durum, true, not);
      return { ok:true, applied:uygulandi, state:durum,
        reported:!!bildirim.ok, note:not, geriAl };
    }finally{
      delete ISLEMDE[anahtar];
    }
  }

  /* Belirsiz bir teklifi KAPATMAK. Kullanici planina bakip karar verir;
     merkeze «uygulandi» da «istenmedi» de denmez — BILINMIYOR denir. */
  async function clearDoubt(id){
    await markIntent(id, 'unknown', false, '');
    const bildirim = await answerIntent(id, 'unknown');
    if(bildirim.ok) await markIntent(id, 'unknown', true, '');
    return { ok:true, reported:!!bildirim.ok };
  }

  /* Ateşle ve unut: arayüz akışlarının çağırdığı biçim. Söz vermez,
     beklemez, hata fırlatmaz. */
  function ping(opts){
    try{
      const p = send(opts);
      if(p && typeof p.catch === 'function') p.catch(function(){});
    }catch(e){ /* işaret, akışı asla bozmaz */ }
  }

  return { load, save, settings, collect, payload, preview, contract, metric,
    urlOk, due, send, ping, pair, backfill, levelOf, LEVELS,
    intents, answerIntent, applyIntent, canApply, INTENT_KINDS, APPLIABLE, desteOf, kayitOku,
    resolveIntent, intentLog, markIntent, forgetIntent, flushIntentReports,
    intentDoubts, clearDoubt,
    MODULE, CONTRACT, ASGARI_ARA_DK };
})();
