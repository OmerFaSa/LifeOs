/* PLAN ISTISNALARI — temel plan + tarihli istisna.

   Kullanici «sadece gelecek hafta gunde 4 saat» ya da «bu hafta ara»
   dediginde TEMEL plan degismez. Degisiklik bitis tarihi olan bir
   istisna olarak durur; tarihi gecince plan kendiliginden temele doner.
   Temeli ezmek, «bir haftaligina» denen seyi kalici yapardi ve bunu
   geri almak kullanicinin isi olurdu.

   Iki tur:
     ara    araliktaki gunlerin bloklari bos; paragraf/problem hedefi 0.
            Ara gunu «kacirilmis gun» degildir ve haftalik soru hedefi
            ara gunleri oraninda kuculur (calc.js questionRealization).
     sure   aralikta ders gunlerinin toplam dakikasi degisir. Deneme
            (Cmt) ve kapanis (Paz) gunleri OLCEKLENMEZ: 165 dakikalik bir
            denemeyi «gunde 2 saat» diye kisaltmak onu deneme olmaktan
            cikarir.

   Kalici gunluk sure (profil.gunlukDakika) istisna degil TEMELdir;
   ayni olcekleme kuralini kullanir, istisna onu gecer.

   Degismezler:
     1. ILERLEMESI BASLAMIS GUNE DOKUNULMAZ. Blokta sure/soru girilmis,
        paragraf/problem sayilmis bir gun yeniden kurulmaz; onizleme bunu
        «korunan» diye soyler. Gercek ilerleme bir plan degisikligiyle
        kaybolmaz.
     2. GECMISE YAZILMAZ. Istisna bugunden once baslayamaz; kaldirilinca
        da yalniz bugun ve sonrasi yeniden kurulur. Gecmis bos bir gunu
        geriye donuk «kacirilmis» yapmak, cezalandirmak olurdu.
     3. SON EKLENEN KAZANIR. Ayni gune iki istisna dusuyorsa sonraki
        gecerlidir; ikisi de kayitta durur.

   TAKVIM KAYITLARI (Rehber › Istisnalar: tatil, okul sinavi, yogun gun,
   ekstra calisma) da bu modulden gecer. Eskiden yalniz haftanin «yuk»
   sayisini degistiriyorlardi: ekran «plan yuku guncellendi» diyordu ama
   tatil gunundeki bloklar oldugu gibi duruyordu. Simdi yuku 0 olan kayit
   ARA gunudur; otekiler ders gununun suresini yuk oraninda olcekler
   (deneme ve kapanis yine olceklenmez). Kendi istisnan takvim kaydinin
   ONUNE gecer: «Carsamba 5 saat calisacagim» demek, o gunun takvimdeki
   «yogun gun» isaretinden daha ozgul bir sozdur. Takvim kaydi burada
   SAKLANMAZ; kaydi R.Model.saveCalendar tutar, bu modul yalniz okur. */

window.R = window.R || {};

R.Istisna = (function(){
  const U = R.U;

  const STORE = 'plan/istisnalar';
  const MAX = 60;
  const TURLER = {
    ara:{ ad:'Ara', maxGun:21 },
    sure:{ ad:'Geçici süre', maxGun:42 },
  };
  const DAKIKA = { min:30, max:720 };
  /* Olceklenmeyen gun turleri — curriculum.js R.WEEKDAYS `ritual`. */
  const SABIT_RITUEL = ['exam', 'review'];
  const MIN_BLOK = 10;
  const YENILEME_UFKU = 60;   // kalici sure degisince kac gun ileriye bakilir

  function fail(why){ return { ok:false, why }; }

  function liste(){ return ((R.S && R.S.istisnalar) || []).slice(); }

  async function yukle(){
    let doc = null;
    try{ doc = await R.Store.get(STORE); }catch(e){ doc = null; }
    const items = (doc && Array.isArray(doc.items)) ? doc.items : [];
    R.S.istisnalar = items.filter(x => x && TURLER[x.tur] && U.isISO(x.from) && U.isISO(x.to));
    return R.S.istisnalar;
  }

  async function kaydet(){
    R.S.istisnalar = liste().slice(-MAX);
    await R.Store.set(STORE, { items:R.S.istisnalar });
  }

  /* ---------------------------------------------------------- dogrulama */

  function dogrula(ist){
    const x = ist || {};
    const tur = TURLER[x.tur];
    if(!tur) return fail('Bilinmeyen istisna türü.');
    if(!U.isISO(x.from) || !U.isISO(x.to)) return fail('Başlangıç ve bitiş tarihi anlaşılmadı.');
    if(x.to < x.from) return fail('Bitiş tarihi başlangıçtan önce olamaz.');
    if(x.from < U.todayISO()){
      return fail('Geçmiş günler değiştirilemez; istisna bugünden ya da sonrasından başlamalı.');
    }
    const gun = U.diffDays(x.from, x.to) + 1;
    if(gun > tur.maxGun){
      return fail(tur.ad + ' en fazla ' + tur.maxGun + ' gün sürebilir; daha uzunu '
        + 'temel planın değişmesi demektir.');
    }
    if(x.tur === 'sure'){
      const dk = Number(x.dakika);
      if(x.dakika == null || x.dakika === '' || !isFinite(dk)) return fail('Günlük süre yazılmamış.');
      if(dk < DAKIKA.min || dk > DAKIKA.max){
        return fail('Günlük süre ' + DAKIKA.min + '–' + DAKIKA.max + ' dakika arasında olmalı.');
      }
    }
    return { ok:true, gun };
  }

  function dakikaGecerli(dk){
    const n = Number(dk);
    return isFinite(n) && n >= DAKIKA.min && n <= DAKIKA.max;
  }

  /* ------------------------------------------------------------ hesaplar */

  function kendiIcin(iso){
    const l = liste().filter(x => x.from <= iso && iso <= x.to);
    return l.length ? l[l.length - 1] : null;
  }

  function takvimTuru(kind){
    const K = (R.Model && R.Model.CALENDAR_KINDS) || {};
    return K[kind] || K.tatil || { label:'Takvim' };
  }

  /* Takvim kaydini istisna bicimine cevirir. Gunluk dakika tarihe
     baglidir (kalici sure bir tarihten sonra baslamis olabilir), o yuzden
     `iso` verilince o gunun dakikasi hesaplanir. */
  function takvimKaydi(c, iso){
    const load = Number(c.load);
    const kayit = { id:c.id, from:c.from, to:c.to || c.from, kaynak:'takvim', kind:c.kind,
      neden:String(c.note || '').trim() || takvimTuru(c.kind).label };
    if(!(load > 0)) return Object.assign(kayit, { tur:'ara' });
    const temel = temelDakika(iso || c.from) || sablonDakikasi();
    const dk = Math.round(temel * load / 5) * 5;
    return Object.assign(kayit, { tur:'sure', carpan:load,
      dakika:Math.min(DAKIKA.max, Math.max(DAKIKA.min, dk)) });
  }

  /* Takvim sirali tutulur (baslangica gore); cakisan kayitlarda ilk
     baslayan gecerlidir — R.Model.dayLoad eskiden de boyle okuyordu. */
  function takvimIcin(iso){
    const c = ((R.S && R.S.calendar) || []).find(x => x && U.isISO(x.from)
      && x.from <= iso && iso <= (x.to || x.from));
    if(!c || Number(c.load) === 1) return null;
    return takvimKaydi(c, iso);
  }

  function gunIcin(iso){
    return kendiIcin(iso) || takvimIcin(iso);
  }

  /* Bugun ve sonrasini etkileyen takvim kayitlari — ekranda kendi
     istisnalarinin yaninda, «bitir» dugmesi OLMADAN gosterilir: onlar
     Rehber › Istisnalar'dan yonetilir. */
  function takvimde(){
    const bugun = U.todayISO();
    return ((R.S && R.S.calendar) || [])
      .filter(c => c && U.isISO(c.from) && (c.to || c.from) >= bugun && Number(c.load) !== 1)
      .map(c => takvimKaydi(c));
  }

  function aralik(from, to){
    const out = [];
    if(!U.isISO(from) || !U.isISO(to) || to < from) return out;
    let d = U.parse(from);
    const son = U.parse(to);
    while(d <= son && out.length < 400){
      out.push(U.iso(d));
      d = U.addDays(d, 1);
    }
    return out;
  }

  /* Sablondaki ders gunu toplami (Pzt–Cum). Kalici sure yoksa temel budur. */
  function sablonDakikasi(){
    const gun = (R.WEEKDAYS || []).find(w => SABIT_RITUEL.indexOf(w.ritual) < 0);
    return gun ? gun.blocks.filter(b => b.slot !== 'Dinlenme')
      .reduce((a, b) => a + (Number(b.min) || 0), 0) : 0;
  }

  function temelDakika(iso){
    const p = (R.S && R.S.profile) || {};
    if(!dakikaGecerli(p.gunlukDakika)) return null;
    if(p.gunlukDakikaFrom && iso && iso < p.gunlukDakikaFrom) return null;
    return Math.round(Number(p.gunlukDakika));
  }

  /* Ders gunu dakikalarindan haftalik kapasite (saat, yarimlik).
     Sabit gunler (deneme + kapanis) oldugu gibi eklenir. */
  function kapasiteSaati(gunlukDakika){
    const W = R.WEEKDAYS || [];
    const dersGunu = W.filter(w => SABIT_RITUEL.indexOf(w.ritual) < 0).length;
    const sabit = W.filter(w => SABIT_RITUEL.indexOf(w.ritual) >= 0)
      .reduce((a, w) => a + w.blocks.filter(b => b.slot !== 'Dinlenme')
        .reduce((x, b) => x + (Number(b.min) || 0), 0), 0);
    return Math.round((gunlukDakika * dersGunu + sabit) / 60 * 2) / 2;
  }

  /* Calisma bloklarini hedef toplam dakikaya orantili olcekler. Her blok
     5'in katina yuvarlanir, en az MIN_BLOK olur; artik son bloga yazilir
     ki toplam hedefi tutsun. */
  function olcekle(blocks, hedef){
    const out = (blocks || []).map(b => Object.assign({}, b));
    const is = out.map((b, i) => ({ b, i }))
      .filter(x => x.b.slot !== 'Dinlenme' && (Number(x.b.targetMin) || 0) > 0);
    const toplam = is.reduce((a, x) => a + Number(x.b.targetMin), 0);
    if(!toplam || !(hedef > 0)) return out;
    let kalan = Math.round(hedef);
    is.forEach((x, k) => {
      let dk;
      if(k === is.length - 1) dk = kalan;
      else dk = Math.round(Number(x.b.targetMin) * hedef / toplam / 5) * 5;
      dk = Math.max(MIN_BLOK, dk);
      out[x.i].targetMin = dk;
      kalan -= dk;
    });
    return out;
  }

  /* Yeni kurulmus (ya da yeniden kurulan) bir gune gecerli istisnayi ve
     temel sureyi uygular. Gunu yerinde degistirir ve dondurur. */
  function gunuBicimle(day, iso){
    if(!day) return day;
    const tarih = iso || day.date;
    const ist = gunIcin(tarih);
    delete day.ara; delete day.araNeden; delete day.istisnaId;
    if(ist && ist.tur === 'ara'){
      day.blocks = [];
      day.ara = true;
      day.araNeden = ist.neden || '';
      day.istisnaId = ist.id;
      day.paragraphTarget = 0;
      day.problemTarget = 0;
      return day;
    }
    const tmpl = (R.WEEKDAYS || [])[day.dow];
    const sabit = !!tmpl && SABIT_RITUEL.indexOf(tmpl.ritual) >= 0;
    if(sabit) return day;
    const hedef = (ist && ist.tur === 'sure') ? Number(ist.dakika) : temelDakika(tarih);
    if(hedef){
      day.blocks = olcekle(day.blocks, hedef);
      if(ist) day.istisnaId = ist.id;
    }
    return day;
  }

  /* Ilerleme baslamis mi? Uyku, not ve kontrol listesi ilerleme sayilmaz
     ama yeniden kurulurken KORUNUR (yalniz bloklar ve hedefler yenilenir). */
  function dokunulmamis(day){
    if(!day) return true;
    const bloklar = (day.blocks || []).every(b => (b.status || 'pending') === 'pending'
      && b.actualMin == null && b.actualQ == null && b.correctQ == null
      && !b.startedAt && !b.skipReason);
    return bloklar && !Number(day.paragraphActual) && !Number(day.problemActual)
      && !Number(day.freeQ);
  }

  async function kayitliGun(iso){
    if(R.S.days[iso]) return R.S.days[iso];
    let doc = null;
    try{ doc = await R.Store.get('days/' + iso); }catch(e){ doc = null; }
    return doc ? await R.Model.ensureDay(iso) : null;
  }

  /* Araliktaki KAYITLI gunleri yeniden kurar (bugun ve sonrasi). Kaydi
     olmayan gun dokunulmaz: acildiginda zaten dogru kurulur. */
  async function araligiYenile(from, to){
    const bugun = U.todayISO();
    const yenilenen = [], korunan = [];
    for(const iso of aralik(from < bugun ? bugun : from, to)){
      const day = await kayitliGun(iso);
      if(!day) continue;
      if(!dokunulmamis(day)){ korunan.push(iso); continue; }
      const d = U.parse(iso);
      const week = await R.Model.ensureWeek(R.Model.weekOf(d));
      const taze = R.Model.defaultDay(d, week);
      day.blocks = taze.blocks;
      day.paragraphTarget = taze.paragraphTarget;
      day.problemTarget = taze.problemTarget;
      gunuBicimle(day, iso);
      await R.Model.saveDay(iso);
      yenilenen.push(iso);
    }
    return { yenilenen, korunan };
  }

  /* Onizleme icin: kayitli gunlerden hangisi korunacak, hangisi yenilenecek.
     Hicbir sey yazmaz. */
  function etki(from, to){
    const bugun = U.todayISO();
    const gunler = aralik(from < bugun ? bugun : from, to);
    const korunan = gunler.filter(iso => R.S.days[iso] && !dokunulmamis(R.S.days[iso]));
    return { gun:gunler.length, korunan };
  }

  /* ------------------------------------------------------------- yazma */

  async function ekle(ist){
    const v = dogrula(ist);
    if(!v.ok) return v;
    const rec = {
      id:U.uid('ist'),
      tur:ist.tur,
      from:ist.from,
      to:ist.to,
      dakika:ist.tur === 'sure' ? Math.round(Number(ist.dakika)) : null,
      neden:String(ist.neden || '').trim().slice(0, 160),
      at:new Date().toISOString(),
    };
    R.S.istisnalar = liste().concat([rec]);
    await kaydet();
    const e = await araligiYenile(rec.from, rec.to);
    return { ok:true, id:rec.id, kayit:rec, yenilenen:e.yenilenen, korunan:e.korunan };
  }

  async function kaldir(id){
    const rec = liste().find(x => x.id === id);
    if(!rec) return fail('İstisna bulunamadı.');
    R.S.istisnalar = liste().filter(x => x.id !== id);
    await kaydet();
    const e = await araligiYenile(rec.from, rec.to);
    return { ok:true, yenilenen:e.yenilenen, korunan:e.korunan };
  }

  /* «Arayi bitir» — kaldir()dan FARKLIDIR. Kaldirmak istisnayi hic
     olmamis sayar: gecmisteki ara gunleri de «ara degil» olur ve o
     haftanin soru hedefi geriye donuk tam hedefe doner, yani hafta
     «tutmadi» gorunur. Bitirmek gecmisi korur: istisnanin sonu dune
     cekilir, bugun ve sonrasi plana doner. Henuz baslamamis bir istisna
     bitirilince tamamen kalkar. */
  async function bitir(id){
    const rec = liste().find(x => x.id === id);
    if(!rec) return fail('İstisna bulunamadı.');
    const bugun = U.todayISO();
    if(rec.from >= bugun) return await kaldir(id);
    if(rec.to < bugun) return { ok:true, yenilenen:[], korunan:[] };
    const eskiSon = rec.to;
    const dun = U.iso(U.addDays(U.parse(bugun), -1));
    R.S.istisnalar = liste().map(x => x.id === id ? Object.assign({}, x, { to:dun }) : x);
    await kaydet();
    const e = await araligiYenile(bugun, eskiSon);
    return { ok:true, yenilenen:e.yenilenen, korunan:e.korunan };
  }

  /* TEK GÜNÜ HAFİFLETMEK — HKM'nin `load.reduce` teklifi («yarın hafif»,
     tatil dönüşü). Ne kadar azalacağına AYS karar verir: oran gelmezse
     YARIM süre (tatil dönüşüyle aynı kural). Tek günlük «sure» istisnasıdır:
     Rehber › İstisnalar'da görünür, kaldırılınca gün temele döner.
     Deneme ve kapanış günü kısaltılmaz; ilerlemesi başlamış gün korunur. */
  async function hafiflet(iso, oran, neden){
    if(!U.isISO(String(iso || ''))) return fail('Tarih anlaşılmadı.');
    if(iso < U.todayISO()) return fail('Geçmiş bir gün hafifletilemez.');
    const w = (R.WEEKDAYS || [])[U.weekdayIndex(iso)] || {};
    if(SABIT_RITUEL.indexOf(w.ritual) >= 0){
      return fail((w.label || 'Bu gün') + ' deneme ya da kapanış günüdür; kısaltılmaz. '
        + 'İstersen o günü Rehber › İstisnalar\'dan ara yapabilirsin.');
    }
    if(etki(iso, iso).korunan.length){
      return fail('O günde girilmiş çalışma var; plan yeniden kurulmaz, girdiğin kaybolmasın.');
    }
    const temel = temelDakika(iso) || sablonDakikasi() || 120;
    const r = Number(oran);
    let dakika;
    if(oran != null && isFinite(r) && r > 0 && r <= 1){
      dakika = Math.round(temel * (1 - r));
      if(dakika < DAKIKA.min){
        return fail('Bu oran günü ' + dakika + ' dakikaya indirir; en az ' + DAKIKA.min
          + ' dakika. O günü ara yapmak istersen Rehber › İstisnalar.');
      }
    }else{
      dakika = Math.max(DAKIKA.min, Math.round(temel / 2));
    }
    const e = await ekle({ tur:'sure', from:iso, to:iso, dakika,
      neden:String(neden || 'HKM: yük azaltma').slice(0, 160) });
    if(!e.ok) return e;
    return { ok:true, id:e.id, temel, dakika };
  }

  /* Kalici sure degisince bugunden ileriye kayitli gunler yenilenir. */
  async function temeliYenile(){
    const bugun = U.todayISO();
    return await araligiYenile(bugun, U.iso(U.addDays(U.parse(bugun), YENILEME_UFKU)));
  }

  /* ------------------------------------------------------------- ozetler */

  /* Bir gunun calisma orani: ara 0, olceklenmis ders gunu temel sureye
     orani, dokunulmamis gun 1. Deneme ve kapanis gunleri olceklenmedigi
     icin sure istisnasinda da 1'dir — oran, gunun GERCEKTE ne kadar
     calisma icerdigini soyler. R.Model.dayLoad buradan okur; plan
     ureteci ve haftalik soru hedefi ayni sayiyi gorur. */
  function gunYuku(iso){
    const x = gunIcin(iso);
    if(!x) return 1;
    if(x.tur === 'ara') return 0;
    const tmpl = (R.WEEKDAYS || [])[U.weekdayIndex(iso)];
    if(tmpl && SABIT_RITUEL.indexOf(tmpl.ritual) >= 0) return 1;
    if(x.kaynak === 'takvim') return Number(x.carpan);
    const temel = temelDakika(iso) || sablonDakikasi();
    return temel ? U.round(Number(x.dakika) / temel, 2) : 1;
  }

  function haftaAraGunu(n){
    return R.Model.weekDates(n).map(d => U.iso(d))
      .filter(iso => { const x = gunIcin(iso); return x && x.tur === 'ara'; }).length;
  }

  /* Bugun ve sonrasini etkileyen istisnalar — ekranda listelenir. */
  function etkin(){
    const bugun = U.todayISO();
    return liste().filter(x => x.to >= bugun)
      .sort((a, b) => String(a.from).localeCompare(String(b.from)));
  }

  function tanim(x){
    if(!x) return '';
    const tarih = x.from === x.to ? U.fmtShort(x.from)
      : U.fmtShort(x.from) + ' – ' + U.fmtShort(x.to);
    if(x.kaynak === 'takvim'){
      return takvimTuru(x.kind).label + (x.tur === 'sure' ? ' · yük %' + Math.round(x.carpan * 100) : '')
        + ' · ' + tarih;
    }
    return x.tur === 'ara' ? 'Ara · ' + tarih
      : 'Günde ' + x.dakika + ' dk · ' + tarih;
  }

  return {
    TURLER, DAKIKA, STORE,
    liste, yukle, dogrula, dakikaGecerli, gunIcin, aralik, olcekle, gunuBicimle,
    dokunulmamis, etki, ekle, kaldir, bitir, hafiflet, temeliYenile, temelDakika, sablonDakikasi,
    kapasiteSaati, haftaAraGunu, gunYuku, etkin, takvimde, tanim,
    yenile:araligiYenile,
  };
})();
