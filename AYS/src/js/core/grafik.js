/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/grafik.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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
    let min = sayiMi(o.min) ? o.min : Math.min.apply(null, vs);
    let max = sayiMi(o.max) ? o.max : Math.max.apply(null, vs);
    if(max === min){ max = max + 1; min = min - 1; }
    const x = i => n <= 1 ? gen / 2 : pay + (i / (n - 1)) * (gen - 2 * pay);
    const y = v => pay + (1 - (v - min) / (max - min)) * (yuk - 2 * pay);
    const nk = q => yuvarla(x(q.i)) + ',' + yuvarla(y(q.deger));

    let govde = '';
    p.parcalar.forEach(par => {
      if(par.length === 1){
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
    return '<svg class="grafik" data-oz="027" viewBox="0 0 ' + gen + ' ' + yuk + '"'
      + ' preserveAspectRatio="none" role="img" aria-label="' + kac(ozet) + '">' + govde + '</svg>';
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
  };
})();
