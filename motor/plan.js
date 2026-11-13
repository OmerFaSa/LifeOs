/* PLAN MOTORU — gün ve hafta planı: bloklar, öncelik, boş zamana yerleştirme, devir
   (sadeleşme Faz 3, plan A6). Rapor: belgeler/ekip/sadelesme/faz3-kayit-plan.md.
   Test: node motor/plan.test.js (AYS istisna.js ve curriculum.js gerçek kaynağını yükler).

   Sözler:
   1. SAF. Saat okunmaz: gün ('YYYY-AA-GG'), bugün ve saatler ('SS:DD') dışarıdan gelir.
      Girdi değiştirilmez, yeni plan döner.
   2. TEK SIRA (ESP core/planner.js:8-14 PRECEDENCE, tartışılmaz): tıkanmış temel > zamana
      bağlı (son tarih ≤ 14 gün, planner.js:76) > vadesi gelmiş tekrar > sentez > yeni içerik.
      Aynı sınıfta önce devreden (AYS auto.js:71), sonra yakın son tarih, sonra veriliş sırası.
   3. GİRDİ ALIR, ÇAĞIRMAZ. Yol dersleri (`dersler`, Yol'un sırasıyla) ve Tekrar'ın günlük planı
      (`tekrar` = Tekrar.plan() çıktısı) girdi olarak gelir; motor onları yeniden hesaplamaz.
      Hareket bloklarını Kayit.Kural.gununEmri çarpanı (`hareketCarpani`) YALNIZ KISALTIR.
   4. ESKİ KURALLAR (AYS core/istisna.js, data/activities.js): ölçekleme 5'in katı, blok en az
      10 dk, artık son bloğa (istisna.js:224-240); deneme ve kapanış günü ölçeklenmez (:80);
      günlük süre 30–720 dk (:78); ara günü boş ve «kaçırılmış» değildir (:10-12); ilerlemesi
      başlamış blok yeniden kurulmaz, geçmiş gün yeniden yazılmaz (:21-27); hafifletme yarıya,
      en az 30 dk (:453-488); mola blok 50 dk altıysa 5, değilse 15 dk, günde en çok 6
      (activities.js:101-106); haftadan haftaya en çok 2 iş devreder (auto.js:311-316).
   5. ETİKET. Plan dakikaları `computed`; tekrar bloğunun süresi kart başı süreden `estimated`.

   Blok: { id, tur:'is'|'ders'|'tekrar'|'yeni-kart'|'sabit'|'mola', ad, bas, bit, dk, sinif,
           kaynakId, alan?, durum:'bekliyor'|'yapildi'|'kismen'|'atlandi', devir, yapilanDk?, neden? } */
(function(kok){
  'use strict';

  const SIRA = Object.freeze(['temel', 'sureli', 'vadeli', 'sentez', 'yeni']);
  const SABIT = Object.freeze({
    MIN_BLOK:10, ONE_ALMA_MIN:30, DAKIKA:Object.freeze({ min:30, max:720 }),     // istisna.js:78-84
    MOLA:Object.freeze({ kisaSinir:50, kisa:5, uzun:15, gunTavani:6 }),            // activities.js:101-106
    SON_TARIH_GUN:14,                                                              // ESP planner.js:76
    HAFTA_DEVIR:2,                                                                 // AYS auto.js:315
    TEKRAR_KART_SN:12,       // karar: kart başı tahmini süre; ölçülmedi, raporda açık konu
    SABIT_RITUEL:Object.freeze(['exam', 'review']),                                 // istisna.js:80
  });
  const DURUM = Object.freeze(['bekliyor', 'yapildi', 'kismen', 'atlandi']);
  const GUN_RE = /^\d{4}-\d{2}-\d{2}$/, SAAT_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

  /* ------------------------------------------------------------- yardımcılar */
  const GUN = 864e5;
  const gunMs = g => Date.UTC(+g.slice(0, 4), +g.slice(5, 7) - 1, +g.slice(8, 10));
  const gunEkle = (g, n) => new Date(gunMs(g) + n * GUN).toISOString().slice(0, 10);
  const gunFarki = (a, b) => Math.round((gunMs(b) - gunMs(a)) / GUN);
  const haftaGunu = g => (new Date(gunMs(g)).getUTCDay() + 6) % 7;            // 0 = Pazartesi (AYS R.WEEKDAYS sırası)
  const dakika = s => +s.slice(0, 2) * 60 + +s.slice(3, 5);
  const saat = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const kopya = o => JSON.parse(JSON.stringify(o));

  /* ------------------------------------------------------------- eski kurallar */
  /* istisna.js:224-240 olcekle: çalışma bloklarını hedef toplama orantılı ölçekler. */
  function olcekle(bloklar, hedef){
    const out = (bloklar || []).map(b => Object.assign({}, b));
    const is = out.map((b, i) => ({ b, i })).filter(x => x.b.slot !== 'Dinlenme' && (Number(x.b.dk) || 0) > 0);
    const toplam = is.reduce((a, x) => a + Number(x.b.dk), 0);
    if(!toplam || !(hedef > 0)) return out;
    let kalan = Math.round(hedef);
    is.forEach((x, k) => {
      let dk = k === is.length - 1 ? kalan : Math.round(Number(x.b.dk) * hedef / toplam / 5) * 5;
      dk = Math.max(SABIT.MIN_BLOK, dk);
      out[x.i].dk = dk;
      kalan -= dk;
    });
    return out;
  }
  const molaDk = dk => dk < SABIT.MOLA.kisaSinir ? SABIT.MOLA.kisa : SABIT.MOLA.uzun;

  /* istisna.js:453-488 hafiflet: oran verilirse temel × (1 − oran), en az 30; yoksa yarısı. */
  function hafiflet(temel, oran, ritual){
    if(SABIT.SABIT_RITUEL.includes(ritual)) return { ok:false, neden:'Deneme ya da kapanış günü kısaltılmaz; istersen o günü ara yap.' };
    if(!(temel > 0)) return { ok:false, neden:'Günün temel süresi yok.' };
    const r = Number(oran);
    if(oran != null && isFinite(r) && r > 0 && r <= 1){
      const dk = Math.round(temel * (1 - r));
      if(dk < SABIT.DAKIKA.min) return { ok:false, neden:'Bu oran günü ' + dk + ' dakikaya indirir; en az ' + SABIT.DAKIKA.min + ' dakika. O günü ara yapabilirsin.' };
      return { ok:true, dakika:dk };
    }
    return { ok:true, dakika:Math.max(SABIT.DAKIKA.min, Math.round(temel / 2)) };
  }

  /* ------------------------------------------------------------- doğrulama */
  function dogrula(g){
    const h = [];
    if(!GUN_RE.test(g.gun || '')) h.push('Gün YYYY-AA-GG biçiminde olmalı.');
    if(g.bugun != null && !GUN_RE.test(g.bugun)) h.push('Bugün YYYY-AA-GG biçiminde olmalı.');
    (g.musait || []).forEach((m, i) => {
      if(!SAAT_RE.test(m.bas || '') || !SAAT_RE.test(m.bit || '')) h.push((i + 1) + '. boş zaman aralığının saatleri SS:DD biçiminde olmalı.');
      else if(dakika(m.bit) <= dakika(m.bas)) h.push((i + 1) + '. boş zaman aralığı başlamadan bitiyor.');
    });
    (g.sabitler || []).forEach(s => {
      if(!SAAT_RE.test(s.bas || '') || !SAAT_RE.test(s.bit || '') || dakika(s.bit) <= dakika(s.bas)) h.push('«' + (s.ad || s.id) + '» sabit bloğunun saatleri geçersiz.');
    });
    if(g.gunlukDakika != null && !(Number(g.gunlukDakika) >= SABIT.DAKIKA.min && Number(g.gunlukDakika) <= SABIT.DAKIKA.max))
      h.push('Günlük süre ' + SABIT.DAKIKA.min + '–' + SABIT.DAKIKA.max + ' dakika arasında olmalı.');
    if(g.hareketCarpani != null && !(g.hareketCarpani >= 0 && g.hareketCarpani <= 1.1)) h.push('Hareket çarpanı 0 ile 1,1 arasında olmalı.');
    const idler = {};
    (g.isler || []).concat(g.dersler || []).forEach(x => {
      const ad = '«' + (x.ad || x.id) + '»';
      if(!x.id) h.push(ad + ' işinin kimliği yok.');
      else if(idler[x.id]) h.push(ad + ' iki kez verildi.');
      idler[x.id] = 1;
      if(!(Number.isInteger(x.dk) && x.dk > 0 && x.dk <= SABIT.DAKIKA.max)) h.push(ad + ' süresi 1–' + SABIT.DAKIKA.max + ' dakika arası tam sayı olmalı.');
      if(x.sinif != null && !SIRA.includes(x.sinif)) h.push(ad + ' sınıfı şunlardan biri olmalı: ' + SIRA.join(', ') + '.');
      if(x.son != null && !GUN_RE.test(x.son)) h.push(ad + ' son tarihi YYYY-AA-GG biçiminde olmalı.');
    });
    return h;
  }

  /* ------------------------------------------------------------- sıra */
  /* Son tarihi 14 gün içinde (ya da geçmiş) olan iş «zamana bağlı»dır; daha üst sınıftaysa orada kalır. */
  function sinifi(x, gun){
    const s = SIRA.includes(x.sinif) ? x.sinif : 'yeni';
    if(x.son && gunFarki(gun, x.son) <= SABIT.SON_TARIH_GUN && SIRA.indexOf(s) > SIRA.indexOf('sureli')) return 'sureli';
    return s;
  }
  function sirala(adaylar, gun){
    return adaylar.map((x, i) => ({ x, i, s:SIRA.indexOf(x.sinif = sinifi(x, gun)) }))
      .sort((a, b) => a.s - b.s || (b.x.devir || 0) - (a.x.devir || 0)
        || (a.x.son || '9999') .localeCompare(b.x.son || '9999') || a.i - b.i)
      .map(o => o.x);
  }

  /* ------------------------------------------------------------- boş zaman */
  function bosluklar(musait, dolu){
    let l = (musait || []).map(m => [dakika(m.bas), dakika(m.bit)]).sort((a, b) => a[0] - b[0]);
    dolu.forEach(([b, e]) => {
      l = l.flatMap(([x, y]) => e <= x || b >= y ? [[x, y]] : [[x, b], [e, y]].filter(([p, q]) => q - p > 0));
    });
    return l.map(([b, e]) => ({ t:b, bit:e, mola:0 }));
  }

  /* ------------------------------------------------------------- gün planı */
  /* girdi: { gun, bugun?, musait:[{bas,bit}], sabitler?:[{id,ad,bas,bit}], gunlukDakika?, ara?, araNeden?,
              sablon?:{ ritual, bloklar:[{slot, ad, dk, alan?}] }, isler?:[{id, ad, dk, sinif?, son?, alan?, bolunebilir?, devir?}],
              dersler?:[{id, ad, dk}], tekrar?:{ tekrar:[], yeni:[] }, kartSn?, hareketCarpani?, mola? (vars. true),
              korunan?:[blok] } */
  function gunPlani(girdi){
    const g = girdi || {}, hatalar = dogrula(g);
    if(hatalar.length) return { ok:false, hatalar };
    if(g.bugun && g.gun < g.bugun) return { ok:false, hatalar:['Geçmiş gün yeniden planlanmaz.'] };

    /* Adaylar: şablon blokları (ölçeklenmiş), işler, tekrar, Yol dersleri — veriliş sırası bu. */
    const adaylar = [];
    const sab = g.sablon;
    if(sab && !g.ara){
      const olceklenir = g.gunlukDakika && !SABIT.SABIT_RITUEL.includes(sab.ritual);
      (olceklenir ? olcekle(sab.bloklar, Number(g.gunlukDakika)) : sab.bloklar).forEach((b, i) => {
        if(b.slot === 'Dinlenme' || !(b.dk > 0)) return;                          // dinlenme doldurulmaz
        adaylar.push({ id:'sablon:' + g.gun + ':' + i, ad:b.ad, dk:b.dk, sinif:b.sinif || 'yeni', alan:b.alan, tur:'is', kaynak:'sablon', slot:b.slot });
      });
    }
    (g.isler || []).forEach(x => adaylar.push(Object.assign({ tur:'is' }, x)));
    const kartSn = g.kartSn > 0 ? g.kartSn : SABIT.TEKRAR_KART_SN;
    const kartBlok = (l, tur, sinif, ad) => {
      if(!l || !l.length) return;
      const dk = Math.max(SABIT.MIN_BLOK, Math.ceil(l.length * kartSn / 60 / 5) * 5);
      adaylar.push({ id:tur + ':' + g.gun, ad, dk, sinif, tur, kartlar:l.map(k => k.id), bolunebilir:true, dkEtiket:'estimated' });
    };
    if(g.tekrar){ kartBlok(g.tekrar.tekrar, 'tekrar', 'vadeli', 'Tekrar kartları'); kartBlok(g.tekrar.yeni, 'yeni-kart', 'yeni', 'Yeni kartlar'); }
    (g.dersler || []).forEach(d => adaylar.push(Object.assign({ tur:'ders', sinif:'yeni' }, d)));

    const plan = { gun:g.gun, ara:!!g.ara, bloklar:[], sigmayan:[] };
    const sig = (a, neden, ek) => {
      const o = Object.assign({ id:a.id, tur:a.tur, ad:a.ad, dk:a.dk, sinif:sinifi(a, g.gun), devir:a.devir || 0, neden }, ek);
      ['alan', 'son', 'kaynak'].forEach(k => { if(a[k] != null) o[k] = a[k]; });
      plan.sigmayan.push(o);
    };
    if(g.ara){                                                                   // istisna.js:10-12, :323-331
      plan.araNeden = g.araNeden || '';
      adaylar.filter(a => a.tur === 'is').forEach(a => sig(a, 'ara günü'));
      return { ok:true, plan:ozetle(plan, g) };
    }

    /* Sabitler ve ilerlemesi başlamış bloklar yerinde kalır (istisna.js:21-23). */
    const dolu = [];
    (g.sabitler || []).forEach(s => { plan.bloklar.push({ id:s.id, tur:'sabit', ad:s.ad, bas:s.bas, bit:s.bit, dk:dakika(s.bit) - dakika(s.bas), durum:'bekliyor', devir:0 }); dolu.push([dakika(s.bas), dakika(s.bit)]); });
    const korunanId = {};
    (g.korunan || []).forEach(b => { plan.bloklar.push(kopya(b)); korunanId[b.kaynakId || b.id] = 1; if(b.bas) dolu.push([dakika(b.bas), dakika(b.bit)]); });
    const bos = bosluklar(g.musait, dolu);
    /* Deneme ve kapanış günü günlük süreyle sınırlanmaz: olduğu gibi eklenir (istisna.js:208-215). */
    let butce = g.gunlukDakika && !(sab && SABIT.SABIT_RITUEL.includes(sab.ritual)) ? Number(g.gunlukDakika) - (g.korunan || []).filter(b => b.tur !== 'mola').reduce((s, b) => s + (b.dk || 0), 0) : Infinity;
    let molaSay = 0;
    const molaVar = g.mola !== false;

    const yerlestir = (a, dk, parca) => {
      for(const b of bos){
        const mola = b.mola && molaSay < SABIT.MOLA.gunTavani ? b.mola : 0;
        if(b.t + mola + dk > b.bit) continue;
        if(mola){ plan.bloklar.push({ id:'mola:' + g.gun + ':' + b.t, tur:'mola', ad:'Mola', bas:saat(b.t), bit:saat(b.t + mola), dk:mola, durum:'bekliyor', devir:0 }); molaSay++; b.t += mola; }
        const blok = { id:a.id + (parca ? '#' + parca : ''), kaynakId:a.id, tur:a.tur, ad:a.ad, bas:saat(b.t), bit:saat(b.t + dk), dk, sinif:a.sinif, durum:'bekliyor', devir:a.devir || 0 };
        ['alan', 'son', 'kartlar', 'slot', 'kaynak', 'dkEtiket'].forEach(k => { if(a[k] != null) blok[k] = a[k]; });
        if(parca) blok.parca = parca;
        plan.bloklar.push(blok);
        b.t += dk; b.mola = molaVar ? molaDk(dk) : 0;
        return true;
      }
      return false;
    };
    const enUzun = () => bos.reduce((m, b) => Math.max(m, b.bit - b.t - (b.mola && molaSay < SABIT.MOLA.gunTavani ? b.mola : 0)), 0);

    sirala(adaylar.filter(a => !korunanId[a.id]), g.gun).forEach(a => {
      let dk = a.dk;
      /* Hareket bloğu toparlanmaya göre yalnız kısalır (Kayit.Kural.gununEmri; 1'in üstü uygulanmaz). */
      if(a.alan === 'hareket' && g.hareketCarpani != null && g.hareketCarpani < 1){
        dk = Math.min(dk, Math.round(dk * g.hareketCarpani / 5) * 5);
        if(dk < SABIT.MIN_BLOK) return sig(a, 'toparlanma günü');
      }
      if(dk > butce){
        if(!(a.bolunebilir && butce >= SABIT.MIN_BLOK)) return sig(a, 'günlük süre doldu');
      }
      if(dk <= butce && yerlestir(a, dk)){ butce -= dk; return; }
      if(!a.bolunebilir) return sig(a, 'boş zaman yetmedi');
      /* Bölünebilir iş: bütçe ve boş zaman kadar, en az 10 dakikalık parçalarla. */
      let kalan = dk, parca = 0;
      while(kalan >= SABIT.MIN_BLOK){
        const p = Math.min(kalan, butce, enUzun());
        if(p < SABIT.MIN_BLOK || !yerlestir(a, p, ++parca)) break;
        kalan -= p; butce -= p;
      }
      if(kalan > 0) sig(a, parca ? 'kısmen sığdı' : butce < SABIT.MIN_BLOK ? 'günlük süre doldu' : 'boş zaman yetmedi', { kalanDk:kalan });
    });
    plan.bloklar.sort((x, y) => (x.bas || '99') < (y.bas || '99') ? -1 : (x.bas || '99') > (y.bas || '99') ? 1 : 0);
    return { ok:true, plan:ozetle(plan, g) };
  }

  function ozetle(plan, g){
    const calisma = plan.bloklar.filter(b => b.tur !== 'mola' && b.tur !== 'sabit');
    const musaitDk = (g.musait || []).reduce((s, m) => s + dakika(m.bit) - dakika(m.bas), 0);
    const doluDk = plan.bloklar.filter(b => b.bas).reduce((s, b) => s + b.dk, 0);
    const tahmin = calisma.some(b => b.dkEtiket === 'estimated');
    plan.ozet = {
      planlananDk:{ v:calisma.reduce((s, b) => s + b.dk, 0), k:calisma.length ? (tahmin ? 'estimated' : 'computed') : 'missing' },
      bosDk:{ v:Math.max(0, musaitDk - doluDk), k:'computed' },
      molaSayisi:plan.bloklar.filter(b => b.tur === 'mola').length,
      sigmayanSayisi:plan.sigmayan.length,
      gunlukDakika:g.gunlukDakika ? Number(g.gunlukDakika) : null,
    };
    return plan;
  }

  /* ------------------------------------------------------------- durum ve devir */
  /* Blok durumu: yapıldı, kısmen (yapılan dk), atlandı (neden şart), bekliyor. Yeni plan döner. */
  function durumYaz(plan, blokId, d){
    const p = kopya(plan), b = p.bloklar.find(x => x.id === blokId), x = d || {};
    if(!b) return { ok:false, neden:'Blok bulunamadı: ' + blokId + '.' };
    if(b.tur === 'mola' || b.tur === 'sabit') return { ok:false, neden:'Mola ve sabit blokların durumu yazılmaz.' };
    if(!DURUM.includes(x.durum)) return { ok:false, neden:'Durum şunlardan biri olmalı: ' + DURUM.join(', ') + '.' };
    if(x.durum === 'kismen' && !(Number.isInteger(x.dk) && x.dk > 0 && x.dk < b.dk)) return { ok:false, neden:'Kısmen yapılan süre 1 ile ' + (b.dk - 1) + ' dakika arasında olmalı.' };
    if(x.durum === 'atlandi' && !String(x.neden || '').trim()) return { ok:false, neden:'Atlanan blok için neden yazılmalı.' };
    b.durum = x.durum;
    delete b.yapilanDk; delete b.neden; delete b.birak;
    if(x.durum === 'yapildi') b.yapilanDk = x.dk > 0 ? x.dk : b.dk;
    if(x.durum === 'kismen') b.yapilanDk = x.dk;
    if(x.durum === 'atlandi'){ b.neden = String(x.neden).trim(); if(x.birak) b.birak = true; }
    return { ok:true, plan:p };
  }

  /* Ertesi güne devreden işler. Tekrar ve Yol blokları DEVRETMEZ: ertesi gün Tekrar vadeli kartları,
     Yol sıradaki dersi yeniden verir (devretmek iki kez saymak olurdu). Bırakılan (birak) atlanmış iş
     ve şablon blokları da devretmez: şablon her gün kendi bloklarını yeniden kurar. */
  function devret(plan){
    const out = {}, sira = [];
    const ekle = (id, o) => { if(out[id]){ out[id].dk += o.dk; return; } out[id] = o; sira.push(id); };
    (plan.bloklar || []).forEach(b => {
      if(b.tur !== 'is' || b.kaynak === 'sablon' || b.durum === 'yapildi' || b.birak) return;
      const dk = b.durum === 'kismen' ? b.dk - b.yapilanDk : b.dk;
      ekle(b.kaynakId || b.id, { id:b.kaynakId || b.id, ad:b.ad, dk, sinif:b.sinif, son:b.son, alan:b.alan, devir:(b.devir || 0) + 1 });
    });
    (plan.sigmayan || []).forEach(s => {
      if(s.tur !== 'is' || s.kaynak === 'sablon' || s.neden === 'toparlanma günü') return;
      ekle(s.id, { id:s.id, ad:s.ad, dk:s.kalanDk || s.dk, sinif:s.sinif, son:s.son, alan:s.alan, devir:1 + (s.devir || 0) });
    });
    return sira.map(id => { const o = out[id]; o.dk = Math.max(SABIT.MIN_BLOK, Math.round(o.dk)); Object.keys(o).forEach(k => o[k] == null && delete o[k]); return o; });
  }

  /* Bir planı yeniden kurmak: ilerlemesi başlamış bloklar yerinde kalır, bekleyenler yeniden yerleşir. */
  function yenidenKur(eski, girdi){
    if(girdi && girdi.bugun && eski.gun < girdi.bugun) return { ok:false, hatalar:['Geçmiş gün yeniden planlanmaz.'] };
    const korunan = (eski.bloklar || []).filter(b => b.tur !== 'mola' && b.tur !== 'sabit' && b.durum !== 'bekliyor');
    return gunPlani(Object.assign({}, girdi, { gun:eski.gun, korunan }));
  }

  /* ------------------------------------------------------------- hafta */
  /* girdi: { bas, gunler:[7 × gün girdisi (musait, sabitler, sablon, gunlukDakika, ara, tekrar)], isler:[{…, gun?}], dersler, bugun? }
     Her gün kendinden önce verilmiş işleri ve önceki günün devrini alır; Yol dersleri sırayla tükenir.
     Haftanın sonunda sığmayanların en öncelikli 2'si gelecek haftaya devreder, gerisi bekler. */
  function haftaPlani(girdi){
    const g = girdi || {};
    if(!GUN_RE.test(g.bas || '')) return { ok:false, hatalar:['Hafta başı YYYY-AA-GG biçiminde olmalı.'] };
    let devir = [], dersler = (g.dersler || []).slice();
    const gunler = [], hatalar = [];
    for(let i = 0; i < 7; i++){
      const gun = gunEkle(g.bas, i), gg = (g.gunler || [])[i] || {};
      const yeni = (g.isler || []).filter(x => (x.gun || g.bas) === gun).map(x => { const o = Object.assign({}, x); delete o.gun; return o; });
      const devirId = {}; devir.forEach(x => { devirId[x.id] = 1; });
      const r = gunPlani(Object.assign({}, gg, { gun, bugun:g.bugun, isler:devir.concat(yeni.filter(x => !devirId[x.id])), dersler }));
      if(!r.ok){ hatalar.push(gun + ': ' + r.hatalar.join(' ')); continue; }
      gunler.push(r.plan);
      const konan = {}; r.plan.bloklar.forEach(b => { if(b.tur === 'ders') konan[b.kaynakId] = 1; });
      dersler = dersler.filter(d => !konan[d.id]);
      devir = devret({ bloklar:[], sigmayan:r.plan.sigmayan });   // öngörü: planlanan blok yapılacak sayılır, yalnız sığmayan devreder
    }
    if(hatalar.length) return { ok:false, hatalar };
    const kalan = sirala(devir, gunEkle(g.bas, 7));
    const toplam = gunler.reduce((s, p) => s + p.ozet.planlananDk.v, 0);
    return { ok:true, hafta:{ bas:g.bas, bitis:gunEkle(g.bas, 6), gunler,
      devir:kalan.slice(0, SABIT.HAFTA_DEVIR), bekleyen:kalan.slice(SABIT.HAFTA_DEVIR), kalanDersler:dersler,
      ozet:{ planlananDk:{ v:toplam, k:'computed' }, araGunu:gunler.filter(p => p.ara).length } } };
  }

  /* ============================================================= GÖÇ
     AYS gün kaydı → plan; AYS haftalık şablon → gün şablonu. Saatleri yoktu: bas/bit null. */
  const DURUM_CEVIR = { pending:'bekliyor', done:'yapildi', partial:'kismen', skipped:'atlandi' };
  const GOC = Object.freeze({
    /* AYS days/<gün> (AYS state.js:379-412 defaultDay, istisna.js:280-294 öne alınan blok). */
    aysGun(day){
      const d = day || {};
      return { gun:d.date, ara:!!d.ara, araNeden:d.araNeden || undefined, kaynak:'goc:ays', sigmayan:[],
        bloklar:(d.blocks || []).filter(b => b.slot !== 'Dinlenme').map(b => {
          const o = { id:'ays:' + d.date + ':' + b.id, kaynakId:'ays:' + d.date + ':' + b.id, tur:'is', ad:b.topic || b.subject || b.slot,
            bas:null, bit:null, dk:Number(b.targetMin) || 0, sinif:'yeni', alan:'akademik', slot:b.slot,
            durum:DURUM_CEVIR[b.status] || 'bekliyor', devir:0 };
          if(b.actualMin != null) o.yapilanDk = b.actualMin;
          if(b.skipReason) o.neden = b.skipReason;
          if(b.oneAlindi) o.oneAlindi = true;
          if(b.subject && b.topic && b.subject !== b.topic) o.konu = b.subject;
          return o;
        }) };
    },
    /* AYS R.WEEKDAYS (data/curriculum.js:113-128) → 7 gün şablonu (Pazartesi başta). */
    aysSablon(weekdays){
      return (weekdays || []).map(w => ({ ad:w.label, ritual:w.ritual || null,
        bloklar:(w.blocks || []).map(b => ({ slot:b.slot, ad:b.subject, dk:Number(b.min) || 0, alan:'akademik' })) }));
    },
  });
  const EKSIK = Object.freeze({
    aysGun:['blok soru hedefi (targetQ), çözülen ve doğru soru: Soru motoru', 'paragraf/problem hedefleri ve serbest soru: Soru motoru',
      'kontrol listesi (checklist): Akademik alanın günlük ritüeli; göremedim', 'günün notu: Not motoruna', 'uyku saati: Kayıt motoru (Kayit.GOC.aysGun)',
      'blok saatleri: AYS bloklarının saati yoktu; bas/bit null', 'konu kimlikleri (subjectId, topicId): Akademik alanın müfredat bağı'],
    aysSablon:['ritüel türleri (contract, exam, review) korunur; ritüelin içeriği Akademik alanda'],
    espPlanner:['ESP «sıradaki tek iş» kaydedilmiyordu, her açılışta hesaplanıyordu: taşınacak kayıt yok; sıra kuralı SIRA olarak taşındı'],
  });

  const Plan = Object.freeze({ SIRA, SABIT, DURUM, gunPlani, yenidenKur, durumYaz, devret, haftaPlani, sirala, olcekle, hafiflet,
    GOC, EKSIK, yardimci:Object.freeze({ gunEkle, gunFarki, haftaGunu, dakika, saat }) });
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Motor = kok.LIFEOS.Motor || {};
  kok.LIFEOS.Motor.Plan = Plan;
  if(typeof module !== 'undefined' && module.exports) module.exports = Plan;
})(typeof window !== 'undefined' ? window : globalThis);
