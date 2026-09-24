/* GRAFİK PARÇALARI — eksik veriyi sıfır çizmeyen tek kalıp.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/grafik.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   Biçimi `brand/ortak/kart.css` içindedir.
   ==================================================================

   NE YAPAR (katalog, ekip/TASARIM-OZELLIKLERI.md §B)

     027  Eksik gün boşluğu   verisi olmayan gün çizgide BOŞLUK kalır;
                              iki yanı kesik bir köprüyle bağlanır, çizgi
                              asla sıfıra düşmez.
     035  Aralık çubuğu       tahmin tek sayı değil aralıktır: en olası
                              değer çizgiyle, dayanağı (kaç veri) altta.
     037  Güvenli eğilim      ok yalnız EN AZ BEŞ veri varsa çizilir; yoksa
                              kaç ölçüm daha gerektiği yazar.
     041  Veri doluluğu       her modülün son yedi günü: verisi olan gün
                              dolu, olmayan İÇİ BOŞ kare — 0 değil.

     P2: 029 eşik çizgili çubuk · 030 tik sayacı · 031 hedef bandı
         (cizgiSvg bant) · 033 gelecek yük · 034 grafiğin cümlesi ·
         038 satır içi çubuk · 039 hız tahmini (aralık, koni)
     P3: 032 geçen dönem gölgesi (cizgiSvg onceki) · 036 dağılım şeridi ·
         040 birikim eğrisi (kayıtsız gün 0 eklenmez)

   NEDEN

   Bir grafik kütüphanesinde eksik değer çoğu zaman 0'a düşer, çünkü
   dizi sayı ister. Burada dizi `null` taşır ve `null` hiçbir yerde
   sayıya çevrilmez: düşen bir çizgi, olmayan bir kötüleşmeyi gösterir
   (AGENTS.md §1.2). Bu dosyanın her işlevi o tek kuralı taşır.

   Çizim SVG'dir ve dize olarak üretilir: çerçeve yok, tuval yok,
   bağımlılık yok (AGENTS.md §1.3). Renk yazılmaz; sınıf yazılır. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;

  /* 037 — eğilim için en az veri. Bir KARARDIR: dört noktadan çizilen
     bir eğim, tek bir sapan günle yön değiştirir; beşte bir gün hâlâ
     yön değiştirebilir ama artık tek başına değil. */
  const EGILIM_EN_AZ = 5;

  /* 037 — bu kadarın altındaki toplam değişim «yatay» sayılır (ortalamaya
     oranla). Yüzde beşten küçük bir kayma, ölçü gürültüsünden ayırt
     edilemez; ona ok çizmek yön uydurmaktır. */
  const DUZ_ORAN = 0.05;

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  const sayiMi = v => typeof v === 'number' && isFinite(v);
  const bicim = (n, od) => (L.SAYI && L.SAYI.bicim) ? L.SAYI.bicim(n, od)
    : (sayiMi(n) ? String(n) : '—');
  const yuvarla = n => Math.round(n * 100) / 100;

  /* ------------------------------------------------------- tarih */

  /* Gün YEREL takvimden alınır (ekip/HATALAR.md T2-03). Yalnız tarih
     («2026-09-25») olduğu gibi okunur; saat taşıyan damga
     («…T22:30:00Z») yerel güne çevrilir — ilk on karakteri UTC günüdür
     ve İstanbul'da 00:00–03:00 kaydını düne yazar. Tarih olmayan dize
     («dün») reddedilir. */
  function gunParca(z){
    if(z instanceof Date) return isNaN(z) ? null : [z.getFullYear(), z.getMonth(), z.getDate()];
    const s = String(z == null ? '' : z);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if(m){
      /* Bozuk tarih (2026-02-31) sessizce kaymasın: geri çevirip aynı
         günü gösterdiğini doğrula (`yedek.js` ile aynı sınama). */
      const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? [+m[1], +m[2] - 1, +m[3]] : null;
    }
    if(!/^\d{4}-\d{2}-\d{2}T/.test(s)) return null;
    const d = new Date(s);
    return isNaN(d) ? null : [d.getFullYear(), d.getMonth(), d.getDate()];
  }
  const iki = n => ('0' + n).slice(-2);
  function gunISO(z){
    const p = gunParca(z);
    return p ? p[0] + '-' + iki(p[1] + 1) + '-' + iki(p[2]) : null;
  }
  /* Gün ekleme UTC'ye sabitlenerek: yaz saati geçişinde gün kaymaz. */
  function gunEkle(iso, n){
    const p = gunParca(iso);
    if(!p) return null;
    const d = new Date(Date.UTC(p[0], p[1], p[2] + n));
    return d.toISOString().slice(0, 10);
  }
  /* Yerel bugün: UTC'nin bugünü gece yarısından sonra dünü gösterir. */
  function bugunISO(){ return gunISO(new Date()); }
  function gunFarki(a, b){
    const x = gunParca(a), y = gunParca(b);
    if(!x || !y) return null;
    return Math.round((Date.UTC(y[0], y[1], y[2]) - Date.UTC(x[0], x[1], x[2])) / 864e5);
  }

  /* ---------------------------------------------- 027 eksik gün */

  /* Günlük seri: [baslangic, bitis] aralığındaki HER gün bir öğe.
     Kaydı olmayan gün `deger:null` taşır — asla 0. Aynı güne iki kayıt
     gelirse sonuncusu geçerlidir (düzeltme sonradan yazılır).

       noktalar: [{ tarih:'2026-09-20', deger:7.2 }, …]  */
  function seri(noktalar, o){
    o = o || {};
    const harita = {};
    let ilk = null, son = null;
    (noktalar || []).forEach(n => {
      const t = n ? gunISO(n.tarih) : null;
      if(!t) return;
      harita[t] = sayiMi(n.deger) ? n.deger : null;
      if(ilk == null || t < ilk) ilk = t;
      if(son == null || t > son) son = t;
    });
    const bas = gunISO(o.baslangic) || ilk, bit = gunISO(o.bitis) || son;
    if(!bas || !bit) return [];
    const n = gunFarki(bas, bit);
    if(n == null || n < 0) return [];
    const out = [];
    for(let i = 0; i <= n; i++){
      const t = gunEkle(bas, i);
      out.push({ tarih:t, deger:Object.prototype.hasOwnProperty.call(harita, t) ? harita[t] : null });
    }
    return out;
  }

  /* Seriyi kesintisiz parçalara böler. Köprü, bir boşluğun iki yanını
     bağlar: çizgi orada KESİK geçer ve boşluğun kaç gün olduğu bilinir. */
  function parcalar(s){
    const par = [];
    let cur = null;
    (s || []).forEach((p, i) => {
      if(sayiMi(p.deger)){
        if(!cur){ cur = []; par.push(cur); }
        cur.push({ i:i, tarih:p.tarih, deger:p.deger });
      }else{
        cur = null;
      }
    });
    const kopruler = [];
    for(let k = 1; k < par.length; k++){
      const a = par[k - 1][par[k - 1].length - 1], b = par[k][0];
      kopruler.push({ a:a, b:b, bosGun:b.i - a.i - 1 });
    }
    return { parcalar:par, kopruler:kopruler,
      bosGun:(s || []).filter(p => !sayiMi(p.deger)).length };
  }

  /* Çizgi grafiği. Dönen SVG'de eksik günün x'inde HİÇBİR nokta yoktur.
       o = { gen, yuk, min, max, etiket, birim } — min/max verilmezse
       veriden alınır; eksik gün min/max'a da girmez. */
  function cizgiSvg(s, o){
    o = o || {};
    const gen = o.gen || 320, yuk = o.yuk || 96, pay = o.pay == null ? 6 : o.pay;
    const p = parcalar(s);
    const vs = [];
    p.parcalar.forEach(par => par.forEach(n => vs.push(n.deger)));
    const n = (s || []).length;
    const etiket = o.etiket || 'Grafik';
    const ozet = etiket + ': ' + n + ' gün, ' + (n - p.bosGun) + ' gün veri'
      + (p.bosGun ? ', ' + p.bosGun + ' gün veri yok' : '');
    if(!vs.length){
      return '<svg class="grafik grafik--bos" data-oz="027" viewBox="0 0 ' + gen + ' ' + yuk + '"'
        + ' role="img" aria-label="' + kac(etiket + ': veri yok') + '"></svg>';
    }
    /* 031 — hedef bandı: [alt, ust]. Bant ölçeğe girer (dışarıda kalmaz). */
    const bant = Array.isArray(o.bant) && sayiMi(o.bant[0]) && sayiMi(o.bant[1]) && o.bant[1] >= o.bant[0]
      ? o.bant : null;
    /* 032 — geçen dönem: aynı uzunlukta bir seri, GÜN SIRASIYLA hizalanır
       (dönemin 1. günü ↔ bu dönemin 1. günü). Fazlası kesilir; eksik gün
       orada da boşluktur. Ölçeğe girer ki gölge grafikten taşmasın. */
    const onceki = Array.isArray(o.onceki) ? o.onceki.slice(0, n) : null;
    const op = onceki ? parcalar(onceki) : null;
    const ovs = [];
    if(op) op.parcalar.forEach(par => par.forEach(q => ovs.push(q.deger)));
    const olcekler = (bant ? vs.concat(bant) : vs).concat(ovs);
    let min = sayiMi(o.min) ? o.min : Math.min.apply(null, olcekler);
    let max = sayiMi(o.max) ? o.max : Math.max.apply(null, olcekler);
    if(max === min){ max = max + 1; min = min - 1; }
    const x = i => n <= 1 ? gen / 2 : pay + (i / (n - 1)) * (gen - 2 * pay);
    const y = v => pay + (1 - (v - min) / (max - min)) * (yuk - 2 * pay);
    const nk = q => yuvarla(x(q.i)) + ',' + yuvarla(y(q.deger));

    let govde = '';
    if(op && ovs.length){
      govde += '<g class="grafik__onceki" data-oz="032">' + op.parcalar.map(par => par.length === 1
        ? '<circle cx="' + yuvarla(x(par[0].i)) + '" cy="' + yuvarla(y(par[0].deger)) + '" r="1.5"/>'
        : '<polyline points="' + par.map(nk).join(' ') + '"/>').join('') + '</g>';
    }
    if(bant){
      const y1 = yuvarla(y(bant[1])), y2 = yuvarla(y(bant[0]));
      govde += '<rect class="grafik__bant" data-oz="031" x="0" y="' + y1 + '" width="' + gen
        + '" height="' + yuvarla(Math.max(0, y2 - y1)) + '"/>';
    }
    p.parcalar.forEach(par => {
      if(par.length === 1 && bant){
        /* bantlı grafikte tek gün de «nokta» olarak aşağıda çizilir */
      }else if(par.length === 1){
        govde += '<circle class="grafik__tek" cx="' + yuvarla(x(par[0].i)) + '" cy="'
          + yuvarla(y(par[0].deger)) + '" r="2.5" data-tarih="' + par[0].tarih + '"/>';
      }else{
        govde += '<polyline class="grafik__cizgi" points="' + par.map(nk).join(' ') + '"/>';
      }
    });
    p.kopruler.forEach(k => {
      govde += '<line class="grafik__kopru" x1="' + yuvarla(x(k.a.i)) + '" y1="' + yuvarla(y(k.a.deger))
        + '" x2="' + yuvarla(x(k.b.i)) + '" y2="' + yuvarla(y(k.b.deger)) + '" data-bos="' + k.bosGun + '"/>';
    });
    /* Bantlı grafikte her gün bir nokta: bant İÇİNDEKİ dolu, DIŞINDAKİ
       içi boş (031). Her sapma alarm değildir; boş nokta yalnız «bandın
       dışında» der, renk vermez. */
    let disarida = 0;
    if(bant){
      p.parcalar.forEach(par => par.forEach(q => {
        const dis = q.deger < bant[0] || q.deger > bant[1];
        if(dis) disarida++;
        govde += '<circle class="grafik__nokta' + (dis ? ' grafik__nokta--dis' : '') + '" cx="' + yuvarla(x(q.i))
          + '" cy="' + yuvarla(y(q.deger)) + '" r="3" data-tarih="' + q.tarih + '"/>';
      }));
    }
    const oort = ovs.length ? ovs.reduce((a2, v) => a2 + v, 0) / ovs.length : null;
    const etiketler = ozet + (bant ? ', ' + disarida + ' gün hedef bandının dışında' : '')
      + (oort != null ? ', geçen dönem ortalaması ' + bicim(oort, 1) + ' (gölgede)' : '')
      + (o.cumle ? '. ' + cumle(s, o) : '');
    return '<svg class="grafik' + (bant ? ' grafik--bantli' : '') + '" data-oz="027" viewBox="0 0 ' + gen + ' ' + yuk + '"'
      + ' preserveAspectRatio="none" role="img" aria-label="' + kac(etiketler) + '">' + govde + '</svg>';
  }

  /* --------------------------------------------- 035 aralık çubuğu */

  /* a = { alt, ust, olasi, min, max, dayanak, dayanakBirim:'deneme',
           birim, ondalik, ters (küçük daha iyi: sıralama), etiket }

     Aralık yoksa çubuk ÇİZİLMEZ: tek sayıyı aralık gibi göstermek
     belirsizliği saklamaktır. Dayanak yazılmamışsa uydurulmaz. */
  function aralik(a){
    a = a || {};
    if(!sayiMi(a.alt) || !sayiMi(a.ust) || a.ust < a.alt){
      return { var:false, metin:'—', dayanak:dayanakMetni(a) };
    }
    const min = sayiMi(a.min) ? a.min : a.alt, max = sayiMi(a.max) ? a.max : a.ust;
    const oran = v => max === min ? 50 : Math.max(0, Math.min(100, (v - min) / (max - min) * 100));
    const yer = v => a.ters ? 100 - oran(v) : oran(v);
    const sol = Math.min(yer(a.alt), yer(a.ust)), sag = Math.max(yer(a.alt), yer(a.ust));
    const b = t => (L.SAYI && L.SAYI.birimli) ? L.SAYI.birimli(t, a.birim) : t + (a.birim ? ' ' + a.birim : '');
    return {
      var:true,
      sol:yuvarla(sol),
      gen:yuvarla(Math.max(sag - sol, 1)),
      olasi:sayiMi(a.olasi) ? yuvarla(yer(a.olasi)) : null,
      metin:b(bicim(a.alt, a.ondalik) + '–' + bicim(a.ust, a.ondalik)),
      olasiMetin:sayiMi(a.olasi) ? 'en olası ' + b(bicim(a.olasi, a.ondalik)) : '',
      dayanak:dayanakMetni(a),
    };
  }

  function dayanakMetni(a){
    if(!sayiMi(a.dayanak)) return 'dayanak kayıtlı değil';
    return a.dayanak + ' ' + (a.dayanakBirim || 'veri') + ' üzerinden';
  }

  function aralikHtml(a){
    const r = aralik(a);
    const et = a && a.etiket ? '<span class="aralik__et">' + kac(a.etiket) + '</span>' : '';
    if(!r.var){
      return '<div class="aralik aralik--yok" data-oz="035">' + et
        + '<span class="aralik__deger">—</span>'
        + '<span class="aralik__dayanak">' + kac(r.dayanak) + '</span></div>';
    }
    const sr = (a.etiket ? a.etiket + ': ' : '') + 'tahmin ' + r.metin
      + (r.olasiMetin ? ', ' + r.olasiMetin : '') + ', ' + r.dayanak;
    return '<div class="aralik" data-oz="035" role="img" aria-label="' + kac(sr) + '">' + et
      + '<span class="aralik__deger" aria-hidden="true">' + kac(r.metin)
      + (r.olasiMetin ? ' <span class="aralik__olasi">· ' + kac(r.olasiMetin) + '</span>' : '') + '</span>'
      + '<span class="aralik__ray" aria-hidden="true">'
      + '<span class="aralik__bant" style="left:' + r.sol + '%;width:' + r.gen + '%"></span>'
      + (r.olasi != null ? '<span class="aralik__en" style="left:' + r.olasi + '%"></span>' : '')
      + '</span>'
      + '<span class="aralik__dayanak" aria-hidden="true">' + kac(r.dayanak) + '</span></div>';
  }

  /* --------------------------------------------- 037 güvenli eğilim */

  /* Eksik değer ATLANIR, sıfır sayılmaz. x ekseni sıra değil gündür:
     iki ölçüm arasında üç gün boşluk varsa eğim onu bilir.

       degerler: [sayı|null, …] (günlük seri) ya da seri() çıktısı
       o = { yon:'artis-iyi'|'azalis-iyi', enAz, duzOran }  */
  function egilim(degerler, o){
    o = o || {};
    const enAz = o.enAz || EGILIM_EN_AZ;
    const nk = [];
    (degerler || []).forEach((v, i) => {
      const d = v && typeof v === 'object' ? v.deger : v;
      if(sayiMi(d)) nk.push([i, d]);
    });
    if(nk.length < enAz){
      const eksik = enAz - nk.length;
      return { yeterli:false, n:nk.length, eksik:eksik,
        metin:'Eğilim için ' + eksik + ' ölçüm daha gerekli' };
    }
    const ort = a => a.reduce((t, v) => t + v, 0) / a.length;
    const mx = ort(nk.map(p => p[0])), my = ort(nk.map(p => p[1]));
    let pay = 0, payda = 0;
    nk.forEach(p => { pay += (p[0] - mx) * (p[1] - my); payda += (p[0] - mx) * (p[0] - mx); });
    const egim = payda ? pay / payda : 0;
    const toplam = egim * (nk[nk.length - 1][0] - nk[0][0]);
    const esik = (o.duzOran == null ? DUZ_ORAN : o.duzOran) * Math.abs(my);
    let yonu = 'duz';
    if(Math.abs(toplam) > esik && toplam !== 0) yonu = toplam > 0 ? 'artis' : 'azalis';
    let anlam = 'notr';
    if(yonu !== 'duz' && (o.yon === 'artis-iyi' || o.yon === 'azalis-iyi')){
      anlam = (o.yon === 'artis-iyi') === (yonu === 'artis') ? 'iyi' : 'kotu';
    }
    return { yeterli:true, n:nk.length, egim:egim, toplam:toplam, yonu:yonu, anlam:anlam,
      metin:yonu === 'artis' ? 'artıyor' : yonu === 'azalis' ? 'azalıyor' : 'yatay' };
  }

  /* Ok: yazı tipine güvenilmez (↗ glifi her yazı tipinde yok), SVG. */
  const OK = {
    artis:'<path d="M3 11 L11 3 M5 3 H11 V9"/>',
    azalis:'<path d="M3 3 L11 11 M11 5 V11 H5"/>',
    duz:'<path d="M2 7 H12 M8 3 L12 7 L8 11"/>',
  };

  function egilimHtml(degerler, o){
    const e = egilim(degerler, o);
    if(!e.yeterli){
      return '<span class="egilim egilim--yetersiz" data-oz="037">' + kac(e.metin) + '</span>';
    }
    return '<span class="egilim egilim--' + e.anlam + '" data-oz="037" data-yon="' + e.yonu + '">'
      + '<svg class="egilim__ok" viewBox="0 0 14 14" aria-hidden="true">' + OK[e.yonu] + '</svg>'
      + '<span>' + kac(e.metin) + '</span>'
      + '<span class="sr-only"> (' + e.n + ' ölçüm)</span></span>';
  }

  /* --------------------------------------------- 041 veri doluluğu */

  /* satir = { modul:'ays'|'spi'|'esp', ad:'AYS', gunler:['2026-09-20', …] }
     `gunler` VERİSİ OLAN günlerdir; listede olmayan gün boştur — 0 değil.
     o = { bitis:'2026-09-24' (bugün), gun:7 } */
  function doluluk(satir, o){
    o = o || {};
    const gun = o.gun || 7;
    const bitis = gunISO(o.bitis) || bugunISO();
    const var_ = {};
    (satir && satir.gunler || []).forEach(t => { const g = gunISO(t); if(g) var_[g] = 1; });
    const kutular = [];
    for(let i = gun - 1; i >= 0; i--){
      const t = gunEkle(bitis, -i);
      kutular.push({ tarih:t, dolu:!!var_[t] });
    }
    const dolu = kutular.filter(k => k.dolu).length;
    return { modul:satir && satir.modul, ad:satir && satir.ad, kutular:kutular, dolu:dolu, gun:gun };
  }

  function dolulukHtml(satirlar, o){
    o = Object.assign({}, o);
    o.bitis = gunISO(o.bitis) || bugunISO();
    const gun = o.gun || 7;
    const sat = (satirlar || []).map(s => {
      const d = doluluk(s, o);
      const sr = (d.ad || d.modul) + ': son ' + d.gun + ' günde ' + d.dolu + ' gün veri var'
        + (d.gun - d.dolu ? ', ' + (d.gun - d.dolu) + ' gün veri yok' : '');
      return '<div class="doluluk__s doluluk--' + kac(d.modul || '') + '" role="img" aria-label="' + kac(sr) + '">'
        + '<span class="doluluk__ad" aria-hidden="true">' + kac(d.ad || d.modul) + '</span>'
        + '<span class="doluluk__kutular" aria-hidden="true">'
        + d.kutular.map(k => '<i class="doluluk__k' + (k.dolu ? ' doluluk__k--dolu' : '')
          + '" data-tarih="' + k.tarih + '"></i>').join('')
        + '</span>'
        + '<span class="doluluk__n" aria-hidden="true">' + d.dolu + '/' + d.gun + '</span></div>';
    }).join('');
    return '<div class="doluluk" data-oz="041" data-gun="' + gun + '">' + sat + '</div>';
  }


  /* --------------------------------------------- 034 grafiğin cümlesi */

  /* Grafiğin altındaki TEK okuma cümlesi; kod üretir, model değil.
       o = { etiket, birim, ondalik, yon (037), gunMetni:'son 7 günde' }
     Veri olmayan gün ortalamaya girmez (0 sayılmaz). */
  function cumle(s, o){
    o = o || {};
    const liste = s || [];
    const vs = liste.map(p => p && typeof p === 'object' ? p.deger : p).filter(sayiMi);
    const bas = (o.etiket ? o.etiket + ': ' : '') + (o.gunMetni || ('son ' + liste.length + ' günde'));
    if(!vs.length) return bas + ' veri yok.';
    const ort = vs.reduce((a, v) => a + v, 0) / vs.length;
    const b = x => (L.SAYI && L.SAYI.birimli) ? L.SAYI.birimli(bicim(x, o.ondalik == null ? 1 : o.ondalik), o.birim)
      : bicim(x, 1) + (o.birim ? ' ' + o.birim : '');
    const e = egilim(liste, { yon:o.yon });
    return bas + ' ' + vs.length + ' gün veri; ortalama ' + b(ort) + '; '
      + (e.yeterli ? 'eğilim ' + e.metin : e.metin.charAt(0).toLocaleLowerCase('tr-TR') + e.metin.slice(1)) + '.';
  }

  function cumleHtml(s, o){
    return '<p class="grafik__cumle" data-oz="034">' + kac(cumle(s, o)) + '</p>';
  }

  /* --------------------------------------------- 029 eşik çizgili çubuk */

  /* e = { deger, esik, olcek, birim, ondalik, etiket, yon:'artis-iyi'|'azalis-iyi' }
     Aşım payı çubukta ayrı parçadır ve yönün anlamıyla renklenir: borç
     eşiği aşmak kötü, hedefi aşmak iyi. Yön yoksa aşım nötr. */
  function esikCubuk(e){
    e = e || {};
    if(!sayiMi(e.deger) || !sayiMi(e.esik)) return { var:false };
    const ust = sayiMi(e.olcek) && e.olcek > 0 ? e.olcek : Math.max(e.deger, e.esik) * 1.25 || 1;
    const yuz = v => Math.max(0, Math.min(100, Math.round(v / ust * 1000) / 10));
    const fark = e.deger - e.esik;
    let anlam = 'notr';
    if(fark > 0 && (e.yon === 'artis-iyi' || e.yon === 'azalis-iyi')) anlam = e.yon === 'artis-iyi' ? 'iyi' : 'kotu';
    const b = x => (L.SAYI && L.SAYI.birimli) ? L.SAYI.birimli(bicim(x, e.ondalik), e.birim) : bicim(x, e.ondalik);
    /* Yüzdenin farkı «puan»dır: %34 ile %10 arası 24 puan, %24 değil. */
    const farkB = x => e.birim === '%' ? bicim(x, e.ondalik) + ' puan' : b(x);
    return {
      var:true, anlam:anlam,
      dolu:yuz(Math.min(e.deger, e.esik)), asim:fark > 0 ? yuz(e.deger) - yuz(e.esik) : 0, esikYer:yuz(e.esik),
      metin:b(e.deger) + ' · eşik ' + b(e.esik),
      farkMetni:fark > 0 ? 'eşiğin ' + farkB(fark) + ' üstünde' : fark < 0 ? 'eşiğin ' + farkB(-fark) + ' altında' : 'eşikte',
    };
  }

  function esikCubukHtml(e){
    e = e || {};
    const r = esikCubuk(e);
    const et = e.etiket ? '<span class="esikcubuk__et">' + kac(e.etiket) + '</span>' : '';
    if(!r.var){
      return '<div class="esikcubuk esikcubuk--yok" data-oz="029">' + et + '<span class="esikcubuk__deger">—</span></div>';
    }
    const sr = (e.etiket ? e.etiket + ': ' : '') + r.metin + ', ' + r.farkMetni;
    return '<div class="esikcubuk esikcubuk--' + r.anlam + '" data-oz="029" role="img" aria-label="' + kac(sr) + '">' + et
      + '<span class="esikcubuk__deger" aria-hidden="true">' + kac(r.metin) + ' <span class="esikcubuk__fark">· '
      + kac(r.farkMetni) + '</span></span>'
      + '<span class="esikcubuk__ray" aria-hidden="true"><span class="esikcubuk__dolu" style="width:' + r.dolu + '%"></span>'
      + (r.asim > 0 ? '<span class="esikcubuk__asim" style="left:' + r.esikYer + '%;width:' + yuvarla(r.asim) + '%"></span>' : '')
      + '<span class="esikcubuk__esik" style="left:' + r.esikYer + '%"></span></span></div>';
  }

  /* --------------------------------------------- 030 tik sayacı */

  /* Küçük hedefte yüzde yerine kutucuk: kalan 3 kutu sayılır, %83 soyut
     kalır. Kutu sayısı TIK_EN_COK'u aşarsa kutu okunmaz; çağıran çubuk
     kullanır (`tik` → { kutu:false }). Yapılan bilinmiyorsa (null) kutular
     KESİK çizilir: boş kutu «0 yapıldı» demek olurdu. */
  const TIK_EN_COK = 30;

  function tik(t){
    t = t || {};
    if(!sayiMi(t.hedef) || t.hedef <= 0 || !Number.isInteger(t.hedef)) return { kutu:false, neden:'hedef-yok' };
    if(t.hedef > TIK_EN_COK) return { kutu:false, neden:'buyuk-hedef' };
    const bilinmiyor = !sayiMi(t.yapilan);
    const y = bilinmiyor ? 0 : Math.max(0, Math.floor(t.yapilan));
    return { kutu:true, bilinmiyor:bilinmiyor, hedef:t.hedef, yapilan:bilinmiyor ? null : y,
      dolu:Math.min(y, t.hedef), fazla:Math.max(0, y - t.hedef), kalan:bilinmiyor ? null : Math.max(0, t.hedef - y) };
  }

  function tikHtml(t){
    t = t || {};
    const r = tik(t);
    if(!r.kutu) return '';
    const et = t.etiket ? '<span class="tik__et">' + kac(t.etiket) + '</span>' : '';
    const sayi = r.bilinmiyor ? '— / ' + r.hedef : r.yapilan + ' / ' + r.hedef + (r.fazla ? ' (+' + r.fazla + ')' : '');
    const sr = (t.etiket ? t.etiket + ': ' : '') + (r.bilinmiyor ? 'veri yok, hedef ' + r.hedef
      : r.yapilan + ' / ' + r.hedef + (r.kalan ? ', ' + r.kalan + ' kaldı' : ', hedef tamam'));
    let kutu = '';
    for(let i = 0; i < r.hedef; i++) kutu += '<i class="tik__k' + (i < r.dolu ? ' tik__k--dolu' : '') + '"></i>';
    return '<div class="tik' + (r.bilinmiyor ? ' tik--yok' : '') + '" data-oz="030" role="img" aria-label="' + kac(sr) + '">'
      + et + '<span class="tik__sayi" aria-hidden="true">' + kac(sayi) + '</span>'
      + '<span class="tik__kutular" aria-hidden="true">' + kutu + '</span></div>';
  }

  /* --------------------------------------------- 033 gelecek yük */

  const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  /* y = { gunler:[{ tarih, deger }], bugun, birim, etiket }
     Bugünün sütunu DOLU, gelecek günler KESİK çerçeve: gelecek henüz
     olmadı. Değeri null olan gün «—» (bilinmiyor); 0 gerçek sıfırdır. */
  function yukHtml(y){
    y = y || {};
    const bugun = gunISO(y.bugun) || bugunISO();
    const liste = (y.gunler || []).map(g => ({ tarih:gunISO(g.tarih), deger:g.deger })).filter(g => g.tarih);
    const vs = liste.map(g => g.deger).filter(sayiMi);
    const max = vs.length ? Math.max.apply(null, vs.concat([1])) : 1;
    const top = vs.reduce((a, v) => a + v, 0);
    const sr = (y.etiket ? y.etiket + ': ' : '') + liste.length + ' gün, toplam ' + bicim(top)
      + (y.birim ? ' ' + y.birim : '') + (liste.length - vs.length ? ', ' + (liste.length - vs.length) + ' gün bilinmiyor' : '');
    return '<div class="yuk" data-oz="033" role="img" aria-label="' + kac(sr) + '">' + liste.map(g => {
      const p = gunParca(g.tarih);
      const gd = new Date(Date.UTC(p[0], p[1], p[2])).getUTCDay();
      const tur = g.tarih < bugun ? 'gecmis' : g.tarih === bugun ? 'bugun' : 'gelecek';
      const var_ = sayiMi(g.deger);
      return '<div class="yuk__g yuk__g--' + tur + (var_ ? '' : ' yuk__g--yok') + '" data-tarih="' + g.tarih + '">'
        + '<span class="yuk__deger" aria-hidden="true">' + (var_ ? kac(bicim(g.deger)) : '—') + '</span>'
        + '<span class="yuk__ray" aria-hidden="true"><span class="yuk__sutun" style="height:'
        + (var_ ? yuvarla(g.deger / max * 100) : 0) + '%"></span></span>'
        + '<span class="yuk__gun" aria-hidden="true">' + (tur === 'bugun' ? 'Bugün' : GUN_KISA[gd]) + '</span></div>';
    }).join('') + '</div>';
  }

  /* --------------------------------------------- 038 satır içi çubuk */

  /* Tablo hücresi: sayı ile boyut aynı yerde. Değer yoksa çubuk yok, «—». */
  function hucreHtml(h){
    h = h || {};
    const olcek = sayiMi(h.olcek) && h.olcek > 0 ? h.olcek : 100;
    const var_ = sayiMi(h.deger) && h.kesinlik !== 'missing';
    const oran = var_ ? Math.max(0, Math.min(100, yuvarla(h.deger / olcek * 100))) : 0;
    /* Kesinlik kaynaktan gelir, bileşen uydurmaz (T2-10): verilmemişse sayı
       yine yazılır ama SAYI.html onu `data-etiketsiz` ile işaretler. */
    const sayi = L.SAYI ? L.SAYI.html({ deger:var_ ? h.deger : null, birim:h.birim, kesinlik:var_ ? h.kesinlik : 'missing',
      ondalik:h.ondalik }, { koken:false }) : kac(var_ ? h.deger : '—');
    return '<span class="hucre' + (var_ ? '' : ' hucre--yok') + '" data-oz="038" style="--hucre-oran:' + oran + '%">'
      + sayi + '</span>';
  }

  /* --------------------------------------------- 039 hız tahmini */

  /* Bu hızla hedefe ne zaman varılır? noktalar: [{ tarih, deger }], hedef.
     En küçük kareler eğimi ± iki standart hata: tahmin tek tarih değil
     ARALIKTIR. Hızın alt sınırı hedefe yaklaşmıyorsa geç sınır YOKTUR
     (null) ve bu söylenir; bir tarih uydurulmaz. En az EGILIM_EN_AZ veri. */
  function hizTahmini(noktalar, hedef, o){
    o = o || {};
    const nk = (noktalar || []).map(n => ({ t:gunISO(n && n.tarih), v:n && n.deger }))
      .filter(n => n.t && sayiMi(n.v)).sort((a, b) => a.t < b.t ? -1 : 1);
    if(!sayiMi(hedef)) return { yeterli:false, neden:'hedef-yok', metin:'Hedef yazılmamış' };
    if(nk.length < EGILIM_EN_AZ){
      return { yeterli:false, eksik:EGILIM_EN_AZ - nk.length, metin:'Tahmin için ' + (EGILIM_EN_AZ - nk.length) + ' ölçüm daha gerekli' };
    }
    const t0 = nk[0].t;
    const xs = nk.map(n => gunFarki(t0, n.t)), ys = nk.map(n => n.v);
    const ort = a => a.reduce((s, v) => s + v, 0) / a.length;
    const mx = ort(xs), my = ort(ys);
    let sxx = 0, sxy = 0;
    xs.forEach((x, i) => { sxx += (x - mx) * (x - mx); sxy += (x - mx) * (ys[i] - my); });
    if(!sxx) return { yeterli:false, neden:'tek-gun', metin:'Ölçümler tek güne düşüyor; hız hesaplanamaz' };
    const egim = sxy / sxx, kesen = my - egim * mx;
    let sse = 0;
    xs.forEach((x, i) => { const r = ys[i] - (kesen + egim * x); sse += r * r; });
    const se = Math.sqrt(sse / Math.max(1, xs.length - 2) / sxx);
    const son = nk[nk.length - 1];
    /* Kalan mesafe son GERÇEK ölçümden (T2-09): doğrunun son noktadaki
       değerinden ölçülseydi, son ölçüm hedefin altında ama doğru üstündeyken
       kalan eksi çıkar, «en olası» tarih son ölçümden önceye düşerdi. */
    const kalan = hedef - son.v;
    /* Yön İLK ölçümden: hedef başlangıcın üstündeyse yukarı gidilir.
       Son ölçüme göre kurulsaydı hedefi geçmiş bir seri «ulaşılmadı»
       görünürdü. */
    const yukari = hedef >= nk[0].v;
    const ulasti = yukari ? son.v >= hedef : son.v <= hedef;
    if(ulasti) return { yeterli:true, ulasti:true, metin:'Hedefe ulaşıldı' };
    const yaklasan = h => yukari ? h > 0 : h < 0;
    const gunSay = h => yaklasan(h) ? Math.ceil(kalan / h) : null;
    const eh = egim, hizli = yukari ? egim + 2 * se : egim - 2 * se, yavas = yukari ? egim - 2 * se : egim + 2 * se;
    const olasi = gunSay(eh), erken = gunSay(hizli), gec = gunSay(yavas);
    const tarih = g => g == null ? null : gunEkle(son.t, g);
    return {
      yeterli:true, ulasti:false, n:nk.length, egim:egim, se:se, son:son.t,
      olasi:tarih(olasi), erken:tarih(erken), gec:tarih(gec),
      yaklasmiyor:olasi == null,
      metin:olasi == null ? 'Bu hızla hedefe yaklaşılmıyor'
        : erken === gec
          ? 'Bu hızla ' + tarihMetni(tarih(olasi)) + ' (tahmin, ' + nk.length + ' ölçüm)'
          : 'Bu hızla ' + (gec != null ? aralikMetni(tarih(erken), tarih(gec)) : tarihMetni(tarih(erken)) + ' ya da daha geç')
            + '; en olası ' + tarihMetni(tarih(olasi)) + ' (tahmin, ' + nk.length + ' ölçüm)',
    };
  }

  const AY_KISA = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function tarihMetni(iso, yilsiz){
    const p = gunParca(iso);
    return p ? p[2] + ' ' + AY_KISA[p[1]] + (!yilsiz && p[0] !== new Date().getFullYear() ? ' ' + p[0] : '') : '—';
  }

  /* «7–16 Kasım», «28 Ekim–4 Kasım», «9 Şubat–8 Mart 2027»: aynı ay ve
     aynı yıl ikinci kez yazılmaz. */
  function aralikMetni(a, b){
    const x = gunParca(a), y = gunParca(b);
    if(!x || !y) return tarihMetni(a) + '–' + tarihMetni(b);
    if(x[0] === y[0] && x[1] === y[1]) return x[2] + '–' + tarihMetni(b);
    if(x[0] === y[0]) return tarihMetni(a, true) + '–' + tarihMetni(b);
    return tarihMetni(a) + '–' + tarihMetni(b);
  }

  /* Koni: geçmiş noktalar çizgi, gelecek son noktadan açılan üçgen
     (hızlı ve yavaş eğim), hedef yatay çizgi. Gelecek KESİK kenarlıdır. */
  function hizKoniSvg(noktalar, hedef, o){
    o = o || {};
    const r = hizTahmini(noktalar, hedef, o);
    const gen = o.gen || 320, yuk = o.yuk || 120, pay = 8;
    if(!r.yeterli || r.ulasti || r.yaklasmiyor){
      return '<p class="hiz hiz--yok" data-oz="039">' + kac(r.metin) + '</p>';
    }
    const nk = (noktalar || []).map(n => ({ t:gunISO(n.tarih), v:n.deger })).filter(n => n.t && sayiMi(n.v))
      .sort((a, b) => a.t < b.t ? -1 : 1);
    const t0 = nk[0].t;
    const sonX = gunFarki(t0, r.son);
    const bitisX = gunFarki(t0, r.gec || r.olasi) * (r.gec ? 1 : 1.5);
    const vs = nk.map(n => n.v).concat([hedef]);
    const min = Math.min.apply(null, vs), max = Math.max.apply(null, vs);
    const X = d => pay + d / Math.max(1, bitisX) * (gen - 2 * pay);
    const Y = v => pay + (1 - (v - min) / ((max - min) || 1)) * (yuk - 2 * pay);
    const son = nk[nk.length - 1];
    const ucX = d => X(gunFarki(t0, d));
    const hedefY = yuvarla(Y(hedef));
    const koni = [yuvarla(X(sonX)) + ',' + yuvarla(Y(son.v)), yuvarla(ucX(r.erken)) + ',' + hedefY,
      yuvarla(r.gec ? ucX(r.gec) : X(bitisX)) + ',' + hedefY].join(' ');
    return '<figure class="hiz" data-oz="039"><svg class="grafik hiz__svg" viewBox="0 0 ' + gen + ' ' + yuk
      + '" preserveAspectRatio="none" role="img" aria-label="' + kac(r.metin) + '">'
      + '<line class="hiz__hedef" x1="0" x2="' + gen + '" y1="' + hedefY + '" y2="' + hedefY + '"/>'
      + '<polygon class="hiz__koni" points="' + koni + '"/>'
      + '<polyline class="grafik__cizgi" points="' + nk.map(n => yuvarla(X(gunFarki(t0, n.t))) + ',' + yuvarla(Y(n.v))).join(' ') + '"/>'
      + '</svg><figcaption class="grafik__cumle">' + kac(r.metin) + '</figcaption></figure>';
  }


  /* --------------------------------------------- 032 geçen dönem anahtarı */

  /* Katman D: gölge grafik başındaki anahtarla açılır (EKIP-PLANI Ek A 32). */
  function gecenDonemDugmesi(acik){
    return '<button type="button" class="chip chip--tap' + (acik ? ' chip--on' : '') + '" data-oz="032"'
      + ' data-act="grafik-gecen-donem" aria-pressed="' + (acik ? 'true' : 'false') + '">Geçen dönem</button>';
  }

  /* --------------------------------------------- 036 dağılım şeridi */

  const DAGILIM_EN_AZ = 5;

  function medyan(a){
    const s = a.slice().sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  /* d = { degerler:[sayı|null…] ya da seri(), etiket, birim, ondalik, gece:'gece' }
     Kayıt olmayan gece NOKTA DEĞİLDİR (0'a konmaz) ve sayısı söylenir.
     En az beş kayıt: daha azından dağılım okunmaz. */
  function dagilim(d){
    d = d || {};
    const hepsi = (d.degerler || []).map(v => v && typeof v === 'object' ? v.deger : v);
    const vs = hepsi.filter(sayiMi);
    const birim = d.birim;
    const b = x => (L.SAYI && L.SAYI.birimli) ? L.SAYI.birimli(bicim(x, d.ondalik == null ? 1 : d.ondalik), birim) : bicim(x, 1);
    const gece = d.gece || 'gece';
    if(vs.length < DAGILIM_EN_AZ){
      return { yeterli:false, n:vs.length, toplam:hepsi.length,
        metin:'Dağılım için ' + (DAGILIM_EN_AZ - vs.length) + ' ' + gece + ' daha gerekli' };
    }
    const md = medyan(vs);
    return {
      yeterli:true, n:vs.length, toplam:hepsi.length, eksik:hepsi.length - vs.length,
      medyan:md, min:Math.min.apply(null, vs), max:Math.max.apply(null, vs), degerler:vs,
      /* «14 gecenin 12'si» eki sayının okunuşuna bağlıdır; ek istemeyen biçim. */
      metin:vs.length + '/' + hepsi.length + ' ' + gece + ' kayıtlı; medyan ' + b(md)
        + '; en düşük ' + b(Math.min.apply(null, vs)) + ', en yüksek ' + b(Math.max.apply(null, vs)),
    };
  }

  function dagilimSvg(d, o){
    o = o || {};
    const r = dagilim(d);
    if(!r.yeterli) return '<p class="dagilim dagilim--yok" data-oz="036">' + kac(r.metin) + '</p>';
    const gen = o.gen || 320, yuk = o.yuk || 56, pay = 8, cap = 3.5;
    const min = r.min, max = r.max === r.min ? r.min + 1 : r.max;
    const X = v => pay + (v - min) / (max - min) * (gen - 2 * pay);
    /* Üst üste binen noktalar dikey yayılır: aynı yere düşen her yeni
       nokta sırayla üste ve alta kayar (değerler sıralı, belirlenimci). */
    const orta = yuk / 2, dolu = [];
    const nokta = r.degerler.slice().sort((a, b2) => a - b2).map(v => {
      const cx = X(v);
      let k = 0;
      while(dolu.some(p => Math.abs(p.x - cx) < cap * 2 && p.k === k)) k = k <= 0 ? -k + 1 : -k;
      dolu.push({ x:cx, k:k });
      return '<circle class="dagilim__n" cx="' + yuvarla(cx) + '" cy="' + yuvarla(orta + k * cap * 2) + '" r="' + cap + '"/>';
    }).join('');
    const mx = yuvarla(X(r.medyan));
    return '<figure class="dagilim" data-oz="036"><svg class="dagilim__svg" viewBox="0 0 ' + gen + ' ' + yuk + '"'
      + ' role="img" aria-label="' + kac((d.etiket ? d.etiket + ': ' : '') + r.metin) + '">'
      + nokta + '<line class="dagilim__medyan" x1="' + mx + '" x2="' + mx + '" y1="2" y2="' + (yuk - 2) + '"/></svg>'
      + '<figcaption class="grafik__cumle">' + kac(r.metin) + '</figcaption></figure>';
  }

  /* --------------------------------------------- 040 birikim eğrisi */

  /* gunluk: [{ tarih, deger }] gerçekleşen; plan: [{ tarih, deger }] günlük
     plan; o = { bugun, birim:'soru', etiket }. Plan bütün dönemi çizer,
     gerçek bugüne kadar. KAYDI OLMAYAN GÜN 0 EKLENMİŞ GİBİ GÖSTERİLMEZ:
     birikim orada kesik geçer ve toplamın adı «kayıtlı toplam»dır.
     Bugünkü fark çizgisi yönün anlamıyla renklenir: geride kötü, önde iyi. */
  function birikim(gunluk, plan, o){
    o = o || {};
    const bugun = gunISO(o.bugun) || bugunISO();
    const G = {}, P = {};
    (gunluk || []).forEach(g => { const t2 = gunISO(g && g.tarih); if(t2 && sayiMi(g.deger)) G[t2] = g.deger; });
    (plan || []).forEach(g => { const t2 = gunISO(g && g.tarih); if(t2 && sayiMi(g.deger)) P[t2] = g.deger; });
    const tar = Object.keys(G).concat(Object.keys(P)).sort();
    if(!tar.length) return { var:false, metin:'Plan da kayıt da yok' };
    const bas = tar[0], bit = tar[tar.length - 1] > bugun ? tar[tar.length - 1] : bugun;
    const gun = [];
    let g = 0, pl = 0, kayitsiz = 0;
    for(let i = 0, n = gunFarki(bas, bit); i <= n; i++){
      const t2 = gunEkle(bas, i);
      if(Object.prototype.hasOwnProperty.call(P, t2)) pl += P[t2];
      const gecmisMi = t2 <= bugun;
      const kayit = Object.prototype.hasOwnProperty.call(G, t2);
      if(gecmisMi && kayit) g += G[t2];
      if(gecmisMi && !kayit) kayitsiz++;
      gun.push({ tarih:t2, plan:pl, gercek:gecmisMi ? g : null, kayit:gecmisMi ? kayit : null });
    }
    const bu = gun.filter(x => x.tarih === bugun)[0];
    const fark = bu.gercek - bu.plan;
    const b = x => (L.SAYI && L.SAYI.birimli) ? L.SAYI.birimli(bicim(x), o.birim) : bicim(x);
    return {
      var:true, gunler:gun, bugun:bugun, kayitsiz:kayitsiz, gercek:bu.gercek, plan:bu.plan, fark:fark,
      anlam:fark < 0 ? 'kotu' : fark > 0 ? 'iyi' : 'notr',
      metin:'Kayıtlı toplam ' + b(bu.gercek) + '; plan ' + b(bu.plan) + '; '
        + (fark === 0 ? 'planla aynı' : b(Math.abs(fark)) + (fark < 0 ? ' geride' : ' önde'))
        + (kayitsiz ? ' (' + kayitsiz + ' gün kayıtsız)' : ''),
    };
  }

  function birikimSvg(gunluk, plan, o){
    o = o || {};
    const r = birikim(gunluk, plan, o);
    if(!r.var) return '<p class="birikim birikim--yok" data-oz="040">' + kac(r.metin) + '</p>';
    const gen = o.gen || 320, yuk = o.yuk || 120, pay = 6;
    const n = r.gunler.length;
    const max = Math.max(1, Math.max.apply(null, r.gunler.map(x => Math.max(x.plan, x.gercek || 0))));
    const X = i => n <= 1 ? gen / 2 : pay + i / (n - 1) * (gen - 2 * pay);
    const Y = v => pay + (1 - v / max) * (yuk - 2 * pay);
    const planP = r.gunler.map((x, i) => yuvarla(X(i)) + ',' + yuvarla(Y(x.plan))).join(' ');
    /* Gerçek eğri: kayıtlı günler düz, kayıtsız günlere giden parça kesik. */
    let duz = '', kesik = '', onceki = null;
    r.gunler.forEach((x, i) => {
      if(x.gercek == null) return;
      const p2 = { x:yuvarla(X(i)), y:yuvarla(Y(x.gercek)) };
      if(onceki){
        const s = '<line x1="' + onceki.x + '" y1="' + onceki.y + '" x2="' + p2.x + '" y2="' + p2.y + '"/>';
        if(x.kayit) duz += s; else kesik += s;
      }
      onceki = p2;
    });
    const bi = r.gunler.map(x => x.tarih).indexOf(r.bugun);
    const fx = yuvarla(X(bi));
    return '<figure class="birikim" data-oz="040"><svg class="grafik birikim__svg" viewBox="0 0 ' + gen + ' ' + yuk + '"'
      + ' preserveAspectRatio="none" role="img" aria-label="' + kac((o.etiket ? o.etiket + ': ' : '') + r.metin) + '">'
      + '<polyline class="birikim__plan" points="' + planP + '"/>'
      + '<g class="birikim__gercek">' + duz + '</g><g class="birikim__kayitsiz">' + kesik + '</g>'
      + '<line class="birikim__fark birikim__fark--' + r.anlam + '" x1="' + fx + '" x2="' + fx + '" y1="'
      + yuvarla(Y(r.gercek)) + '" y2="' + yuvarla(Y(r.plan)) + '"/>'
      + '</svg><figcaption class="grafik__cumle">' + kac(r.metin) + '</figcaption></figure>';
  }

  L.GRAFIK = {
    EGILIM_EN_AZ:EGILIM_EN_AZ,
    DUZ_ORAN:DUZ_ORAN,
    gunISO:gunISO,
    gunEkle:gunEkle,
    gunFarki:gunFarki,
    seri:seri,
    parcalar:parcalar,
    cizgiSvg:cizgiSvg,
    aralik:aralik,
    aralikHtml:aralikHtml,
    egilim:egilim,
    egilimHtml:egilimHtml,
    doluluk:doluluk,
    dolulukHtml:dolulukHtml,
    TIK_EN_COK:TIK_EN_COK,
    cumle:cumle,
    cumleHtml:cumleHtml,
    esikCubuk:esikCubuk,
    esikCubukHtml:esikCubukHtml,
    tik:tik,
    tikHtml:tikHtml,
    yukHtml:yukHtml,
    hucreHtml:hucreHtml,
    hizTahmini:hizTahmini,
    hizKoniSvg:hizKoniSvg,
    DAGILIM_EN_AZ:DAGILIM_EN_AZ,
    gecenDonemDugmesi:gecenDonemDugmesi,
    medyan:medyan,
    dagilim:dagilim,
    dagilimSvg:dagilimSvg,
    birikim:birikim,
    birikimSvg:birikimSvg,
  };
})();
