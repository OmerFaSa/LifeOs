/* ROTA — GPS izinden (GPX) mesafe, süre, tempo, kilometre dilimleri ve
   yükseklik. Modül 3'ün (Hareket) parçası; Strava'daki rota haritasının
   SPİ karşılığı. Çizim `core/harita.js`'tedir, canlı kayıt
   `core/canli.js`'te; burada hesap var ve İKİ KAYNAK DA ondan geçer.

   Sözler:
     1. SAYIYI KOD ÜRETİR. Mesafe, süre, tempo ve tırmanış GPS
        noktalarından hesaplanır («hesaplandı»); dosyada yazan bir özet
        varsa bile okunmaz.
     2. ZAMANI OLMAYAN İZ KAYDEDİLMEZ. Planlanmış bir rota (yalnız konum)
        bir antrenman değildir: süre uydurulmaz, dosya reddedilir ve bu
        söylenir.
     3. TÜRÜ BİLİNMEYEN İZ SORULUR. GPX'teki tür yazısı tanınmazsa koşu mu
        yürüyüş mü bisiklet mi tahmin edilmez (AGENTS §1.7).
     4. YÜKSEKLİK YOKSA «VERİ YOK». Noktaların yarısından azında yükseklik
        varsa tırmanış hesaplanmaz; sıfır yazılmaz.
     5. İZ SIKIŞTIRILIR. Yerel depo ~5 MB'tir: hesap TAM izle yapılır,
        saklanan yalnız çizim için sadeleştirilmiş iz (kodlanmış çizgi) ve
        100 noktalık yükseklik profilidir.

   Hesabın kuralları (eşikler tek yerde, aşağıda):
     · Son kabul edilen noktaya 3 metreden yakın nokta atlanır: durakta GPS
       titremesi mesafe üretmez.
     · İki nokta arası hız 0,5 m/sn'nin altındaysa o aralık «hareket
       süresi»ne girmez (duraklama). Tempo hareket süresinden hesaplanır.
     · 50 m/sn'yi aşan sıçrama GPS hatasıdır: mesafeye de süreye de girmez.
     · Tırmanış, beş noktalık ortalamayla yumuşatılmış yükseklikte 3 metre
       eşikle sayılır. */

window.SP = window.SP || {};

SP.Rota = (function(){
  const DUNYA = 6371008.8;          /* ortalama yer yarıçapı, metre */
  const TITREME_M = 3;
  const HAREKET_MS = 0.5;
  const SICRAMA_MS = 50;
  const TIRMANIS_ESIK = 3;
  const YUMUSAT = 5;
  const PROFIL_NOKTA = 100;
  const EN_COK_IZ = 600;            /* saklanan izin nokta tavanı */
  const SON_DILIM_M = 50;           /* bundan kısa son dilim gösterilmez */
  const HAREKET_YOK = 'İzde hareket yok: kayıt başladığı yerde kalmış.';

  /* GPX tür yazısı → SPİ hareketi. Yalnız YAZIYLA gelen türler; sayı
     kodları (bazı servisler «9» yazar) burada doğrulanmadığı için
     tanınmaz ve kullanıcıya sorulur. */
  const TUR = {
    running:'kosu', run:'kosu', trail_running:'kosu', treadmill_running:'kosu',
    walking:'yuruyus', walk:'yuruyus', hiking:'yuruyus', hike:'yuruyus',
    cycling:'bisiklet', biking:'bisiklet', ride:'bisiklet', road_biking:'bisiklet',
    mountain_biking:'bisiklet', gravel_cycling:'bisiklet',
  };
  /* Rota alabilen hareketler — sırası seçicideki sıradır. */
  const HAREKETLER = ['kosu', 'yuruyus', 'bisiklet'];

  const rad = d => d * Math.PI / 180;

  function mesafe(a, b){
    const f1 = rad(a.lat), f2 = rad(b.lat);
    const df = f2 - f1, dl = rad(b.lon - a.lon);
    const h = Math.sin(df / 2) * Math.sin(df / 2)
      + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * DUNYA * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /* ------------------------------------------------------------ GPX okuma */

  function metinOf(el, ad){
    const n = el.getElementsByTagNameNS('*', ad)[0];
    return n ? String(n.textContent || '').trim() : '';
  }

  function turOf(yazi){
    const k = String(yazi || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    return TUR[k] || null;
  }

  /* GPX metni → { ok, ad, tur, noktalar:[{lat, lon, ele, t, parca}], atlanan }
     ya da { ok:false, why }. `parca` yeni bir izin (trkseg) ilk noktasıdır:
     iki parça arasındaki boşluk mesafe sayılmaz. */
  function gpxOku(metin){
    if(typeof metin !== 'string' || !metin.trim()) return { ok:false, why:'Dosya boş.' };
    /* BOM ve baştaki boşluk: XML bildirimi ilk karakter olmalı, yoksa
       ayrıştırıcı dosyayı reddeder (bazı kayıt uygulamalarının dışa aktarımı). */
    metin = metin.replace(/^[﻿\s]+/, '');
    let doc;
    try{ doc = new DOMParser().parseFromString(metin, 'application/xml'); }
    catch(e){ return { ok:false, why:'Dosya okunamadı.' }; }
    if(!doc || doc.getElementsByTagName('parsererror').length
      || !doc.documentElement || doc.documentElement.localName !== 'gpx'){
      return { ok:false, why:'Bu bir GPX dosyası değil.' };
    }
    const trk = doc.getElementsByTagNameNS('*', 'trk')[0];
    const ad = trk ? metinOf(trk, 'name') : '';
    const turYazi = trk ? metinOf(trk, 'type') : '';

    const noktalar = [];
    let atlanan = 0;
    const parcalar = doc.getElementsByTagNameNS('*', 'trkseg');
    for(let s = 0; s < parcalar.length; s++){
      const pts = parcalar[s].getElementsByTagNameNS('*', 'trkpt');
      let ilk = true;
      for(let i = 0; i < pts.length; i++){
        const p = pts[i];
        const lat = parseFloat(p.getAttribute('lat'));
        const lon = parseFloat(p.getAttribute('lon'));
        if(!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180){
          atlanan++; continue;
        }
        const eleY = metinOf(p, 'ele');
        const ele = eleY === '' ? null : parseFloat(eleY);
        const tY = metinOf(p, 'time');
        const t = tY ? Date.parse(tY) : NaN;
        noktalar.push({ lat, lon, ele:isFinite(ele) ? ele : null, t:isFinite(t) ? t : null, parca:ilk });
        ilk = false;
      }
    }
    if(!noktalar.length){
      const plan = doc.getElementsByTagNameNS('*', 'rtept').length;
      return { ok:false, why:plan
        ? 'Bu dosya planlanmış bir rota: içinde kaydedilmiş bir aktivite yok.'
        : 'Dosyada GPS noktası yok.' };
    }
    return { ok:true, ad:ad || null, turYazi:turYazi || null, tur:turOf(turYazi), noktalar, atlanan };
  }

  /* ------------------------------------------------------------- hesap */

  function yumusak(degerler, pencere){
    const yari = Math.floor(pencere / 2);
    return degerler.map((_, i) => {
      let top = 0, n = 0;
      for(let k = i - yari; k <= i + yari; k++){
        if(k >= 0 && k < degerler.length){ top += degerler[k]; n++; }
      }
      return top / n;
    });
  }

  function tirmanisOf(yukseklik){
    if(yukseklik.length < 2) return 0;
    let ref = yukseklik[0], top = 0;
    for(let i = 1; i < yukseklik.length; i++){
      const e = yukseklik[i];
      if(e - ref >= TIRMANIS_ESIK){ top += e - ref; ref = e; }
      else if(ref - e >= TIRMANIS_ESIK){ ref = e; }
    }
    return top;
  }

  /* Noktalar → özet. Zaman sırası bozuk (geri giden) nokta atlanır.
     Dönen `iz` kabul edilen noktalardır; her biri birikmiş mesafe (d),
     birikmiş hareket süresi (m) ve varsa yumuşatılmış yükseklik (e) taşır. */
  function analiz(noktalar){
    const tum = noktalar || [];
    const zamanli = tum.filter(p => p.t != null);
    /* Zamansız iz ile tek noktalı iz ayrı şeydir: tek nokta «zaman yok»
       değil «hareket yok»tur. */
    if(zamanli.length < tum.length / 2 || (tum.length >= 2 && zamanli.length < 2)){
      return { ok:false, why:'Dosyada zaman bilgisi yok; süre ve tempo hesaplanamaz. '
        + 'Planlanmış bir rota değil, kaydedilmiş bir aktivite seç.' };
    }
    if(zamanli.length < 2) return { ok:false, why:HAREKET_YOK };
    const iz = [];
    let son = null, d = 0, m = 0, yeniParca = false;
    zamanli.forEach(p => {
      if(p.parca) yeniParca = true;
      if(!son){ son = p; iz.push(Object.assign({}, p, { d:0, m:0 })); yeniParca = false; return; }
      if(p.t < son.t) return;
      const ds = mesafe(son, p);
      if(yeniParca){
        /* Parça boşluğu: konum ilerler, mesafe ve süre ilerlemez. */
        yeniParca = false;
        son = p; iz.push(Object.assign({}, p, { d, m })); return;
      }
      if(ds < TITREME_M) return;
      const dt = (p.t - son.t) / 1000;
      const hiz = dt > 0 ? ds / dt : Infinity;
      if(hiz > SICRAMA_MS){ son = p; iz.push(Object.assign({}, p, { d, m })); return; }
      d += ds;
      if(hiz >= HAREKET_MS) m += dt;
      son = p;
      iz.push(Object.assign({}, p, { d, m }));
    });
    if(iz.length < 2 || d < 10) return { ok:false, why:HAREKET_YOK };

    const yuksekli = iz.filter(p => p.ele != null).length;
    const yukVar = yuksekli >= iz.length / 2;
    if(yukVar){
      /* Eksik yükseklik bir önceki bilinen değerle doldurulur (yalnız
         yumuşatma için; profilde ve tırmanışta yine o değer). */
      let onceki = (iz.find(p => p.ele != null) || {}).ele;
      const ham = iz.map(p => { if(p.ele != null) onceki = p.ele; return onceki; });
      yumusak(ham, YUMUSAT).forEach((e, i) => { iz[i].e = e; });
    }

    const ilk = iz[0], sonN = iz[iz.length - 1];
    const sure = Math.round((sonN.t - ilk.t) / 1000);
    const hareket = Math.round(m);
    const ozet = {
      ok:true,
      bas:new Date(ilk.t).toISOString(),
      mesafe:Math.round(d),
      sure, hareket,
      tirmanis:yukVar ? Math.round(tirmanisOf(iz.map(p => p.e))) : null,
      enAlcak:yukVar ? Math.round(Math.min.apply(null, iz.map(p => p.e))) : null,
      enYuksek:yukVar ? Math.round(Math.max.apply(null, iz.map(p => p.e))) : null,
      dilimler:dilimler(iz, yukVar),
      profil:yukVar ? profil(iz) : null,
      nokta:noktalar.length,
      iz,
    };
    return ozet;
  }

  /* Birikmiş mesafede `hedef` metreye karşılık gelen değer (doğrusal ara
     değer). `alan` 'm' (hareket süresi) ya da 'e' (yükseklik). */
  function araDeger(iz, hedef, alan){
    let lo = 0, hi = iz.length - 1;
    if(hedef <= iz[0].d) return iz[0][alan];
    if(hedef >= iz[hi].d) return iz[hi][alan];
    while(hi - lo > 1){
      const mid = (lo + hi) >> 1;
      if(iz[mid].d < hedef) lo = mid; else hi = mid;
    }
    const a = iz[lo], b = iz[hi];
    const k = b.d === a.d ? 0 : (hedef - a.d) / (b.d - a.d);
    return a[alan] + (b[alan] - a[alan]) * k;
  }

  /* Kilometre dilimleri: her dilimin HAREKET süresi (sn) ve yükseklik
     farkı (m; yükseklik yoksa null). Son dilim kısaysa uzunluğuyla gelir. */
  function dilimler(iz, yukVar){
    const top = iz[iz.length - 1].d;
    const out = [];
    for(let bas = 0; bas < top; bas += 1000){
      const bit = Math.min(top, bas + 1000);
      const uzunluk = bit - bas;
      if(uzunluk < 1000 && uzunluk < SON_DILIM_M) break;
      out.push({
        m:Math.round(uzunluk),
        sn:Math.round(araDeger(iz, bit, 'm') - araDeger(iz, bas, 'm')),
        dy:yukVar ? Math.round(araDeger(iz, bit, 'e') - araDeger(iz, bas, 'e')) : null,
      });
    }
    return out;
  }

  /* Eşit aralıklı yükseklik profili (PROFIL_NOKTA nokta, metre). */
  function profil(iz){
    const top = iz[iz.length - 1].d;
    const out = [];
    for(let i = 0; i < PROFIL_NOKTA; i++){
      out.push(Math.round(araDeger(iz, top * i / (PROFIL_NOKTA - 1), 'e')));
    }
    return out;
  }

  /* --------------------------------------------------------- sadeleştirme */

  /* Douglas–Peucker, yerel düzlemde metreyle. Yinelemeli (yığınla): uzun
     izde özyineleme yığını taşırmaz. */
  function sadelestir(iz, tolerans){
    if(iz.length <= 2) return iz.slice();
    const lat0 = rad(iz[0].lat);
    const xy = iz.map(p => [rad(p.lon) * Math.cos(lat0) * DUNYA, rad(p.lat) * DUNYA]);
    const tut = new Uint8Array(iz.length);
    tut[0] = tut[iz.length - 1] = 1;
    const yigin = [[0, iz.length - 1]];
    const t2 = tolerans * tolerans;
    while(yigin.length){
      const [a, b] = yigin.pop();
      const [ax, ay] = xy[a], [bx, by] = xy[b];
      const dx = bx - ax, dy = by - ay, uz = dx * dx + dy * dy;
      let enUzak = -1, enD = 0;
      for(let i = a + 1; i < b; i++){
        const [px, py] = xy[i];
        let k = uz ? ((px - ax) * dx + (py - ay) * dy) / uz : 0;
        k = Math.max(0, Math.min(1, k));
        const qx = ax + k * dx - px, qy = ay + k * dy - py;
        const d2 = qx * qx + qy * qy;
        if(d2 > enD){ enD = d2; enUzak = i; }
      }
      if(enUzak > 0 && enD > t2){
        tut[enUzak] = 1;
        yigin.push([a, enUzak], [enUzak, b]);
      }
    }
    return iz.filter((_, i) => tut[i]);
  }

  /* Tavanı aşmayana dek toleransı büyüterek sadeleştirir. Çok kıvrımlı
     bir izde ~200 m tolerans bile yetmezse eşit aralıkla seyreltilir:
     tavan her izde tutar, ilk ve son nokta korunur. */
  function sakla(iz){
    let tol = 4, s = sadelestir(iz, tol);
    while(s.length > EN_COK_IZ && tol < 200){ tol *= 1.6; s = sadelestir(iz, tol); }
    if(s.length > EN_COK_IZ){
      const adim = (s.length - 1) / (EN_COK_IZ - 1);
      s = Array.from({ length:EN_COK_IZ }, (_, i) => s[Math.round(i * adim)]);
    }
    return s;
  }

  /* ------------------------------------------------- kodlanmış çizgi
     Yaygın «encoded polyline» biçimi (1e-5 derece ≈ 1 m): nokta başına
     birkaç bayt. Sıfır bağımlılık: kodlayıcı ve çözücü burada. */
  function kodla(noktalar){
    let out = '', plat = 0, plon = 0;
    const sayi = v => {
      v = v < 0 ? ~(v << 1) : (v << 1);
      while(v >= 0x20){ out += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; }
      out += String.fromCharCode(v + 63);
    };
    noktalar.forEach(p => {
      const lat = Math.round(p.lat * 1e5), lon = Math.round(p.lon * 1e5);
      sayi(lat - plat); sayi(lon - plon);
      plat = lat; plon = lon;
    });
    return out;
  }

  function coz(metin){
    const out = [];
    let i = 0, lat = 0, lon = 0;
    const s = String(metin || '');
    const oku = () => {
      let sonuc = 0, kay = 0, b;
      do{
        if(i >= s.length) return null;
        b = s.charCodeAt(i++) - 63;
        sonuc |= (b & 0x1f) << kay;
        kay += 5;
      }while(b >= 0x20);
      return (sonuc & 1) ? ~(sonuc >> 1) : (sonuc >> 1);
    };
    while(i < s.length){
      const a = oku(), b = oku();
      if(a == null || b == null) break;
      lat += a; lon += b;
      out.push({ lat:lat / 1e5, lon:lon / 1e5 });
    }
    return out;
  }

  /* ------------------------------------------------------- kayıt */

  /* Analiz → kaydedilecek rota. `ek` kaynağa özgü alanları ekler. */
  function rotaOf(a, ek){
    return Object.assign({
      v:1, kaynak:'gpx', dosya:null, ad:null,
      bas:a.bas, mesafe:a.mesafe, sure:a.sure, hareket:a.hareket,
      tirmanis:a.tirmanis, enAlcak:a.enAlcak, enYuksek:a.enYuksek,
      dilimler:a.dilimler, profil:a.profil,
      iz:kodla(sakla(a.iz)), nokta:a.nokta, atlanan:0,
    }, ek || {});
  }

  /* GPX metni → { ok, rota, tur, ad } (kaydedilecek biçim) ya da { ok:false, why }. */
  function oku(metin, dosyaAdi){
    const g = gpxOku(metin);
    if(!g.ok) return g;
    const a = analiz(g.noktalar);
    if(!a.ok) return a;
    const rota = rotaOf(a, {
      dosya:dosyaAdi ? String(dosyaAdi).slice(0, 120) : null,
      ad:g.ad ? String(g.ad).slice(0, 120) : null,
      atlanan:g.atlanan,
    });
    return { ok:true, rota, tur:g.tur, turYazi:g.turYazi };
  }

  /* Canlı kayıttan gelen noktalar → { ok, rota } ya da { ok:false, why }.
     GPX ile aynı analizden geçer: canlı kayıt için ayrı kural yoktur. */
  function noktalardan(noktalar, ek){
    const a = analiz(noktalar);
    if(!a.ok) return a;
    return { ok:true, rota:rotaOf(a, ek) };
  }

  /* Aynı aktivite ikinci kez eklenmez: başlangıç anı aynı olan rota. */
  function kayitli(rota, seanslar){
    return (seanslar || []).find(w => w && w.rota && w.rota.bas === rota.bas) || null;
  }

  /* Rotadan antrenman kaydı. Yük, hareketin MET değeri × hareket süresi
     ile hesaplanır (Move.sessionLoad): zorluk yazılmadıkça uydurulmaz. */
  function seans(rota, exId){
    const U = SP.U, M = SP.Model;
    const ex = SP.EX_BY_ID[exId];
    if(!ex || HAREKETLER.indexOf(exId) < 0) return null;
    const dk = Math.max(1, Math.round(rota.hareket / 60));
    return {
      id:U.uid('w'), date:U.iso(new Date(rota.bas)), templateId:null,
      name:ex.name, kind:'cardio',
      items:[{ exId, levelId:M.currentLevel(exId), sets:null, reps:null, minutes:dk }],
      minutes:dk, rpe:null, note:'',
      createdAt:new Date().toISOString(),
      rota,
    };
  }

  function exOf(w){
    const it = w && (w.items || []).find(x => HAREKETLER.indexOf(x.exId) >= 0);
    return it ? it.exId : null;
  }

  /* Rotalı seanslar, en yenisi başta. */
  function liste(seanslar){
    return (seanslar || []).filter(w => w && w.rota && w.rota.iz)
      .slice().sort((a, b) => a.rota.bas < b.rota.bas ? 1 : a.rota.bas > b.rota.bas ? -1 : 0);
  }

  /* ----------------------------------------------------- metin biçimi */

  function km(m){
    return (m / 1000).toLocaleString('tr-TR', { minimumFractionDigits:2, maximumFractionDigits:2 });
  }
  function sureMetni(sn){
    if(sn == null || !isFinite(sn)) return '—';
    sn = Math.round(sn);
    const s = Math.floor(sn / 3600), d = Math.floor(sn % 3600 / 60), n = sn % 60;
    const iki = x => (x < 10 ? '0' : '') + x;
    return s ? s + ':' + iki(d) + ':' + iki(n) : d + ':' + iki(n);
  }
  /* Tempo (sn/km). Mesafe ya da süre yoksa null. */
  function tempo(sn, m){ return sn > 0 && m > 0 ? sn / (m / 1000) : null; }
  function hiz(sn, m){ return sn > 0 && m > 0 ? (m / sn) * 3.6 : null; }
  /* Bisiklette hız (km/sa), koşu ve yürüyüşte tempo (dk/km). */
  function hizMi(exId){ return exId === 'bisiklet'; }

  return {
    gpxOku, analiz, oku, noktalardan, kayitli, seans, exOf, liste, mesafe, sadelestir, sakla,
    kodla, coz, km, sureMetni, tempo, hiz, hizMi, turOf, tirmanisOf,
    HAREKETLER, TITREME_M, HAREKET_MS, SICRAMA_MS, TIRMANIS_ESIK,
  };
})();
