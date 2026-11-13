/* KAYIT MOTORU — tipli günlük kayıt; öğün, uyku, hareket, ölçüm, çalışma, enerji, su, mola
   (sadeleşme Faz 3, plan A6). Rapor: belgeler/ekip/sadelesme/faz3-kayit-plan.md.
   Test: node motor/kayit.test.js (eski kural motorlarını Node'da yükleyip aynı girdide karşılaştırır).

   Sözler:
   1. TEK TABLO. Her tür TURLER'de bir satırdır: alanlar, birimler, sınırlar, Türkçe hata cümlesi.
      Sınırlar eski giriş ekranından (SPI/src/js/screens/today.js:299-309, :1152, core/uyku.js:30).
   2. ETİKET (AGENTS §1.2). Kullanıcının yazdığı sayı `measured`; kendisi «tahmin» derse `estimated`.
      Motorun ürettiği sayı `computed`, tahmin içeren türev `estimated`, yok `missing`; göçte
      etiketsiz eski sayı `eski` (karar 11, sistem/goc.py ile aynı kod). Toplam, parçalarının en
      zayıf etiketini alır (ESP core/state.js:430-441 kuralı); ölçülmüş parçaların toplamı da
      `computed` olur, çünkü başka sayılardan türemiştir. Eksik veri sıfır değildir.
   3. SAF. Saat okunmaz: gün ('YYYY-AA-GG') ve zaman (ms) dışarıdan gelir; yıl da (yaş için).
   4. KURAL MOTORU OTORİTEDİR. Enerji hedefi, toparlanma, yük ve uyku kuralları eski
      kodlardan (SPI core/nutri.js, core/move.js, core/uyku.js, AYS core/calc.js) aynen
      taşındı; sabitleri test eski dosyadan okuyup karşılaştırır. Güvenlik sınırları: enerji
      hedefi bazalın altına inmez; haftalık yük %10'dan fazla artmaz; sistem yükü yalnız
      azaltır; teşhis ve doz yok (katalogda ilaç ve doz alanı yoktur).

   Kayıt: { id, tur, gun, zaman (ms|null), kaynak, deger:{ alan:{v, k} }, ek:{ alan:metin }, kalemler? } */
(function(kok){
  'use strict';

  const ETIKET = Object.freeze({ measured:'ölçüldü', estimated:'tahmin', computed:'hesaplandı', missing:'veri yok', eski:'eski kayıt' });
  const KULLANICI = ['measured', 'estimated'];
  const GOC_IZNI = ['measured', 'estimated', 'computed', 'eski'];
  const GUN_RE = /^\d{4}-\d{2}-\d{2}$/;
  const SAAT_RE = /^([01]\d|2[0-3]):[0-5]\d$/;              // SPI core/uyku.js:29

  const S = (ad, birim, min, max, ek) => Object.assign({ ad, birim, min, max }, ek);
  const Z = { zorunlu:true }, ZT = { zorunlu:true, tam:true };

  /* ------------------------------------------------------------- tür tablosu */
  const TURLER = Object.freeze({
    ogun:    { ad:'Öğün', alan:'Beslenme', sayilar:{ kcal:S('Enerji', 'kcal', 0, 5000), protein:S('Protein', 'g', 0, 500) },
               metinler:{ icerik:{ ad:'Ne yediğin', zorunlu:true }, ogun:{ ad:'Öğün', secim:['kahvalti', 'ogle', 'aksam', 'ara'] } } },
    su:      { ad:'Su', alan:'Beslenme', sayilar:{ ml:S('Su', 'ml', 1, 8000, ZT) } },          // 0 ml ölçüm değil: SPI state.js:624-629
    uyku:    { ad:'Gece uykusu', alan:'Uyku', sayilar:{ saat:S('Gece uykusu', 'saat', 0, 16, Z) } },
    kestirme:{ ad:'Kısa uyku', alan:'Uyku', gunTavani:6,
               sayilar:{ dk:S('Kısa uyku', 'dakika', 1, 240, Object.assign({ fazla:'dakika kısa uyku için fazla; gece uykusuysa «Gece uykusu» kaydını kullan.' }, ZT)) },
               metinler:{ bas:{ ad:'Başlangıç saati', desen:SAAT_RE, desenMetni:'Saat 00:00–23:59 biçiminde olur.' } } },
    hareket: { ad:'Hareket', alan:'Hareket', sayilar:{ dk:S('Süre', 'dakika', 1, 600, ZT), rpe:S('Zorluk (RPE)', '', 1, 10), met:S('MET', '', 1, 25) },
               metinler:{ ad:{ ad:'Etkinlik' }, tur:{ ad:'Tür', secim:['kuvvet', 'kardiyo', 'mobilite'] } } },
    kilo:    { ad:'Kilo', alan:'Hareket', sayilar:{ kg:S('Kilo', 'kg', 20, 250, Z) } },
    bel:     { ad:'Bel çevresi', alan:'Hareket', sayilar:{ cm:S('Bel çevresi', 'cm', 40, 200, Z) } },
    yagOrani:{ ad:'Yağ oranı', alan:'Hareket', sayilar:{ yuzde:S('Yağ oranı', '%', 3, 60, Z) } },
    nabiz:   { ad:'İstirahat nabzı', alan:'Uyku', sayilar:{ atim:S('İstirahat nabzı', 'atım/dk', 30, 140, ZT) } },
    hrv:     { ad:'HRV', alan:'Uyku', sayilar:{ ms:S('HRV', 'ms', 5, 250, Z) } },
    tansiyon:{ ad:'Tansiyon', alan:'Tahlil', sayilar:{ buyuk:S('Büyük tansiyon', 'mmHg', 60, 250, ZT), kucuk:S('Küçük tansiyon', 'mmHg', 30, 160, { tam:true }) } },
    spo2:    { ad:'Oksijen', alan:'Tahlil', sayilar:{ yuzde:S('Oksijen', '%', 70, 100, Z) } },
    ates:    { ad:'Ateş', alan:'Tahlil', sayilar:{ derece:S('Ateş', '°C', 33, 43, Z) } },
    /* SPİ «ağrı ve enerji» (move.js:90-92, 1 çok yorgun … 5 zinde) ile AYS ruh hâli enerjisi
       (AYS state.js:929, 1-5) aynı beyandır: tek tür. */
    enerji:  { ad:'Enerji ve ruh hâli', alan:'Uyku', sayilar:{ puan:S('Enerji', '1-5', 1, 5, ZT) }, metinler:{ not:{ ad:'Not' } } },
    calisma: { ad:'Çalışma süresi', alan:'*', sayilar:{ dk:S('Süre', 'dakika', 1, 720, ZT), sayi:S('Sayı', '', 0, 100000, { tam:true }), kalite:S('Kalite', '', 0, 10) },
               metinler:{ alan:{ ad:'Alan', zorunlu:true }, konu:{ ad:'Konu' } } },
    mola:    { ad:'Mola', alan:'*', sayilar:{ dk:S('Mola', 'dakika', 1, 120, ZT) } },
  });

  /* ------------------------------------------------------------- yardımcılar */
  const GUN = 864e5;
  const gunMs = g => Date.UTC(+g.slice(0, 4), +g.slice(5, 7) - 1, +g.slice(8, 10));
  const gunEkle = (g, n) => new Date(gunMs(g) + n * GUN).toISOString().slice(0, 10);
  const gunFarki = (a, b) => Math.round((gunMs(b) - gunMs(a)) / GUN);
  const yuvarla = (x, b) => { const f = Math.pow(10, b == null ? 1 : b); return isFinite(x) ? Math.round(x * f) / f : 0; }; // brand/ortak/bicim.js:28-31
  const sikistir = (x, a, b) => Math.max(a, Math.min(b, x));
  const yok = () => ({ v:null, k:'missing' });
  const bicim = n => String(n).replace('.', ',');

  /* Toplamın etiketi: tahmin varsa tahmin, eski varsa eski, yoksa hesaplandı. */
  function birlesik(ks){
    if(!ks.length) return 'missing';
    if(ks.includes('estimated')) return 'estimated';
    if(ks.includes('eski')) return 'eski';
    return 'computed';
  }
  function cozSayi(ham){
    const c = ham !== null && typeof ham === 'object' ? ham : { v:ham, k:'measured' };
    let v = c.v;
    if(typeof v === 'string') v = v.trim().replace(',', '.');
    return { v:v === '' || v == null ? null : Number(v), k:c.k || 'measured' };
  }

  /* ------------------------------------------------------------- kayıt kurma */
  function kur(tur, girdi, bag, izin){
    const t = TURLER[tur];
    if(!t) return { ok:false, hatalar:['Bilinmeyen kayıt türü: ' + tur + '.'] };
    const b = bag || {}, g = girdi || {}, hatalar = [], deger = {}, ek = {};
    const sayilar = t.sayilar || {}, metinler = t.metinler || {};
    if(!GUN_RE.test(b.gun || '')) hatalar.push('Gün YYYY-AA-GG biçiminde olmalı.');
    if(b.zaman != null && !(typeof b.zaman === 'number' && isFinite(b.zaman))) hatalar.push('Zaman milisaniye olmalı.');
    Object.keys(g).forEach(a => { if(!sayilar[a] && !metinler[a]) hatalar.push(t.ad + ' kaydında «' + a + '» alanı yok.'); });
    Object.keys(sayilar).forEach(a => {
      const f = sayilar[a], c = cozSayi(g[a]);
      if(c.v == null){ if(f.zorunlu) hatalar.push(f.ad + ' yazılmalı.'); return; }
      const birim = f.birim && f.birim !== '1-5' && f.birim !== '%' ? ' ' + f.birim : '', yz = f.birim === '%' ? '%' : '';
      if(!isFinite(c.v)) return hatalar.push(f.ad + ' sayı olmalı.');
      if(!izin.includes(c.k)) return hatalar.push(f.ad + ' için etiket «ölçüldü» ya da «tahmin» olabilir.');
      if(f.tam && !Number.isInteger(c.v)) return hatalar.push(f.ad + ' tam sayı olmalı.');
      if(c.v > f.max && f.fazla) return hatalar.push(bicim(c.v) + ' ' + f.fazla);
      if(c.v < f.min || c.v > f.max) return hatalar.push(f.ad + ' ' + yz + bicim(f.min) + ' ile ' + yz + bicim(f.max) + birim + ' arasında olmalı.');
      deger[a] = { v:c.v, k:c.k };
    });
    Object.keys(metinler).forEach(a => {
      const f = metinler[a], m = g[a] == null ? '' : String(g[a]).trim();
      if(!m){ if(f.zorunlu) hatalar.push(f.ad + ' yazılmalı.'); return; }
      if(f.secim && !f.secim.includes(m)) return hatalar.push(f.ad + ' şunlardan biri olmalı: ' + f.secim.join(', ') + '.');
      if(f.desen && !f.desen.test(m)) return hatalar.push(f.desenMetni);
      ek[a] = m;
    });
    if(t.gunTavani && (b.mevcut || []).filter(r => r.tur === tur && r.gun === b.gun).length >= t.gunTavani){
      hatalar.push('Bir günde en çok ' + t.gunTavani + ' ' + t.ad.toLocaleLowerCase('tr') + ' yazılır.');   // SPI core/uyku.js:51
    }
    if(hatalar.length) return { ok:false, hatalar };
    const kayit = { id:b.id || tur + ':' + b.gun + ':' + (b.zaman == null ? 0 : b.zaman), tur, gun:b.gun,
      zaman:b.zaman == null ? null : b.zaman, kaynak:b.kaynak || 'kullanici', deger, ek };
    if(b.kalemler) kayit.kalemler = b.kalemler;
    return { ok:true, kayit };
  }
  /* Kullanıcı girişi: çıplak sayı «ölçüldü»; { v, k:'estimated' } «tahmin». bag: { gun, zaman, id, mevcut } */
  const kaydet = (tur, girdi, bag) => kur(tur, girdi, bag, KULLANICI);
  const deger = (r, a) => (r && r.deger && r.deger[a]) || yok();

  /* ------------------------------------------------------------- toplamlar */
  const sirali = l => l.map((r, i) => [r, i])
    .sort((x, y) => (x[0].gun < y[0].gun ? -1 : x[0].gun > y[0].gun ? 1 : 0)
      || ((x[0].zaman == null ? -Infinity : x[0].zaman) - (y[0].zaman == null ? -Infinity : y[0].zaman)) || x[1] - y[1])
    .map(x => x[0]);
  const turde = (kayitlar, tur, gun) => sirali((kayitlar || []).filter(r => r.tur === tur && (gun == null || r.gun === gun)));
  function topla(liste, a){
    const var_ = liste.filter(r => deger(r, a).v != null);
    if(!var_.length) return Object.assign(yok(), liste.length ? { eksik:liste.length } : {});
    const o = { v:yuvarla(var_.reduce((s, r) => s + deger(r, a).v, 0), 2), k:birlesik(var_.map(r => deger(r, a).k)) };
    if(var_.length < liste.length) o.eksik = liste.length - var_.length;
    return o;
  }
  const son = (liste, a) => { const l = liste.filter(r => deger(r, a).v != null); return l.length ? Object.assign({}, deger(l[l.length - 1], a)) : yok(); };
  const gunDegeri = (kayitlar, tur, a, gun) => son(turde(kayitlar, tur, gun), a).v;

  /* Uyku günü (SPI core/uyku.js:13-15, :71-77): gece + kestirmeler; gece yoksa toplam «veri yok». */
  function uykuGunu(kayitlar, gun){
    const gece = son(turde(kayitlar, 'uyku', gun), 'saat'), kl = turde(kayitlar, 'kestirme', gun);
    const kDk = topla(kl, 'dk');
    const toplam = gece.v == null ? yok()
      : { v:Math.round(gece.v * 60 + (kDk.v || 0)), k:birlesik([gece.k].concat(kl.map(r => deger(r, 'dk').k))) };
    return { gece, kestirmeSayisi:kl.length, kestirmeDk:kDk, toplamDk:toplam };
  }

  function gunluk(kayitlar, gun){
    const h = turde(kayitlar, 'hareket', gun), c = turde(kayitlar, 'calisma', gun);
    let yuk = 0, bilinmeyen = 0;
    h.forEach(r => { const y = seansYuku(r); if(y == null) bilinmeyen++; else yuk += y; });
    const alanlar = {};
    c.forEach(r => { (alanlar[r.ek.alan] = alanlar[r.ek.alan] || []).push(r); });
    Object.keys(alanlar).forEach(a => { alanlar[a] = topla(alanlar[a], 'dk'); });
    const olcum = {};
    ['kilo', 'bel', 'yagOrani', 'nabiz', 'hrv', 'tansiyon', 'spo2', 'ates'].forEach(t => {
      const l = turde(kayitlar, t, gun);
      if(l.length) olcum[t] = Object.keys(TURLER[t].sayilar).reduce((o, a) => (o[a] = son(l, a), o), {});
    });
    const og = turde(kayitlar, 'ogun', gun);
    return {
      gun,
      su:topla(turde(kayitlar, 'su', gun), 'ml'),
      uyku:uykuGunu(kayitlar, gun),
      hareket:{ seans:h.length, dk:topla(h, 'dk'),
        yuk:h.length && bilinmeyen < h.length ? { v:yuk, k:'computed', bilinmeyen } : Object.assign(yok(), { bilinmeyen }) },
      calisma:{ dk:topla(c, 'dk'), alanlar },
      ogun:{ sayi:og.length ? { v:og.length, k:'computed' } : yok(), kcal:topla(og, 'kcal') },
      enerji:son(turde(kayitlar, 'enerji', gun), 'puan'),
      mola:topla(turde(kayitlar, 'mola', gun), 'dk'),
      olcum,
    };
  }

  /* Ortalama yalnız verisi olan günlerden (eksik gün sıfır değil; AYS core/calc.js:330-339). */
  function ortalama(degerler){
    const l = degerler.filter(d => d.v != null);
    return l.length ? { v:yuvarla(l.reduce((s, d) => s + d.v, 0) / l.length, 1), k:birlesik(l.map(d => d.k)), gun:l.length } : yok();
  }
  function haftalik(kayitlar, bitis){
    const gunler = [];
    for(let i = 6; i >= 0; i--) gunler.push(gunluk(kayitlar, gunEkle(bitis, -i)));
    const toplam = sec => { const l = gunler.map(sec).filter(d => d.v != null);
      return l.length ? { v:yuvarla(l.reduce((s, d) => s + d.v, 0), 2), k:birlesik(l.map(d => d.k)), gun:l.length } : yok(); };
    const veriGunu = gunler.filter(g => (kayitlar || []).some(r => r.gun === g.gun)).length;
    return {
      bas:gunEkle(bitis, -6), bitis, veriGunu, gunler,
      uykuOrt:ortalama(gunler.map(g => g.uyku.gece.v ? g.uyku.gece : yok())),   // AYS: 0 saatlik gece ortalamaya girmez
      suOrt:ortalama(gunler.map(g => g.su)),
      enerjiOrt:ortalama(gunler.map(g => g.enerji)),
      hareketDk:toplam(g => g.hareket.dk), yuk:toplam(g => g.hareket.yuk),
      calismaDk:toplam(g => g.calisma.dk),
      kilo:son(turde((kayitlar || []).filter(r => r.gun <= bitis), 'kilo'), 'kg'),
    };
  }

  /* ============================================================= KURALLAR
     Eski kural motorlarının sadık taşıması. Her sabit eski kaynağından; test karşılaştırır. */

  /* ---- Beslenme: SPI core/nutri.js ---- */
  const HEDEF_ORANI = Object.freeze({ saglik:0, koru:0, ver:-0.18, al:0.12 });   // SPI data/nutrients.js:55-60 GOALS.deficit

  /* Güncel kilo: son ölçülen kilo, yoksa profildeki (SPI core/state.js:588-594 kiloOf). */
  function guncelKilo(kayitlar, profil, gun){
    const l = turde((kayitlar || []).filter(r => gun == null || r.gun <= gun), 'kilo');
    const s = son(l, 'kg');
    if(s.v > 0) return { kg:s.v, k:s.k, gun:l.filter(r => deger(r, 'kg').v != null).pop().gun };
    return profil && Number(profil.kilo) > 0 ? { kg:Number(profil.kilo), k:'measured', gun:null } : null;
  }

  /* Mifflin-St Jeor (nutri.js:63-73). Cinsiyet yoksa erkek varsayılmaz; yaş = yıl − doğum yılı
     (eski kod yılı saatten okuyordu, state.js:202-206; burada dışarıdan gelir). */
  function bmr(profil, yil){
    const p = profil || {};
    if(!(Number(p.kilo) > 0) || !p.boy || (p.cinsiyet !== 'erkek' && p.cinsiyet !== 'kadin') || !p.dogumYili) return null;
    if(typeof yil !== 'number') throw new TypeError('yil verilmeli: motor saati kendisi okumaz');
    const taban = 10 * Number(p.kilo) + 6.25 * p.boy - 5 * (yil - Number(p.dogumYili));
    return Math.round(p.cinsiyet === 'kadin' ? taban - 161 : taban + 5);
  }

  /* Seansın kalemleri: göçle gelen antrenmanda hareket başına MET ve dakika; yeni kayıtta tek kalem. */
  const kalemleri = r => r.kalemler && r.kalemler.length ? r.kalemler : [{ met:deger(r, 'met').v, dk:null }];
  const metSayisi = m => Number(m) > 0 ? Number(m) : null;

  /* Günün hareket enerjisi (nutri.js:84-133): (MET − 1) × kg × saat; türü bilinmeyen ya da
     süresiz seans «0» sayılmaz, eksik listesine düşer. */
  function hareketEnerjisi(hareketler, kg){
    const out = { seanslar:[], kcal:0, dakika:0, eksik:[] };
    if(!kg){ out.kcal = null; out.neden = 'Profilde kilo yok'; return out; }
    hareketler.forEach(r => {
      const items = kalemleri(r), dkToplam = deger(r, 'dk').v > 0 ? deger(r, 'dk').v : null;
      const ad = r.ek && r.ek.ad || 'Seans';
      let kcal = 0, dk = 0, bilinmeyen = false;
      const dkli = items.filter(it => Number(it.dk) > 0);
      if(dkli.length){
        dkli.forEach(it => {
          const met = metSayisi(it.met);
          if(met == null){ bilinmeyen = true; return; }
          kcal += Math.max(0, met - 1) * kg * Number(it.dk) / 60; dk += Number(it.dk);
        });
      }else if(dkToplam){
        const m = items.map(it => metSayisi(it.met)).filter(x => x != null);
        if(!m.length) bilinmeyen = true;
        else { kcal = Math.max(0, m.reduce((a, x) => a + x, 0) / m.length - 1) * kg * dkToplam / 60; dk = dkToplam; }
      }
      if(!dk){ out.eksik.push(ad + (bilinmeyen ? ': türü bilinmiyor' : ': süresi yazılmamış')); return; }
      out.seanslar.push({ id:r.id, ad, dakika:dk, kcal:Math.round(kcal) });
      out.kcal += kcal; out.dakika += dk;
    });
    out.kcal = Math.round(out.kcal);
    return out;
  }

  /* Enerji hedefi (nutri.js:135-143 dayNeed, :276-310 targets): ihtiyaç = BMR + o günün GİRİLEN
     hareketi (etkinlik çarpanıyla tahmin yok); hedef oranı ya da uygulanmış planın farkı;
     GÜVENLİK: hedef bazal metabolizmanın altına inmez (nutri.js:309-310). */
  function enerjiHedefi(profil, kayitlar, gun, yil){
    const p = Object.assign({}, profil);
    const kilo = guncelKilo(kayitlar, p, gun);
    p.kilo = kilo ? kilo.kg : null;
    const eksik = [];
    if(!p.kilo) eksik.push('kilo');
    if(!p.boy) eksik.push('boy');
    if(!p.dogumYili) eksik.push('doğum yılı');
    if(p.cinsiyet !== 'erkek' && p.cinsiyet !== 'kadin') eksik.push('cinsiyet');
    const b = bmr(p, yil);
    if(b == null) return { deger:yok(), bmr:yok(), eksik };
    const h = hareketEnerjisi(turde(kayitlar, 'hareket', gun), p.kilo);
    const ihtiyac = Math.round(b + (h.kcal || 0));
    let kcal = Math.round(ihtiyac * (1 + (HEDEF_ORANI[p.hedef] || 0))), kaynak = 'kural';
    const kh = p.kcalHedef;
    if(kh && isFinite(Number(kh.fark)) && kh.fark !== null){ kcal = Math.round(ihtiyac + Number(kh.fark)); kaynak = 'plan'; }
    else if(kh && isFinite(Number(kh.kcal)) && Number(kh.kcal) > 0){ kcal = Math.round(Number(kh.kcal)); kaynak = 'plan'; }
    const bmrTaban = kcal < b;
    if(bmrTaban) kcal = b;
    return { deger:{ v:kcal, k:'computed' }, bmr:{ v:b, k:'computed' }, ihtiyac:{ v:ihtiyac, k:'computed' },
      hareket:h, kaynak, bmrTaban, eksik };
  }

  /* ---- Hareket: SPI core/move.js + data/movement.js ---- */
  const TOPARLANMA = Object.freeze({                                              // movement.js:292-301
    uyku:{ tur:'uyku', alan:'saat', agirlik:0.35, ad:'Uyku' }, hrv:{ tur:'hrv', alan:'ms', agirlik:0.30, ad:'HRV' },
    nabiz:{ tur:'nabiz', alan:'atim', agirlik:0.20, ad:'İstirahat nabzı' }, enerji:{ tur:'enerji', alan:'puan', agirlik:0.15, ad:'Ağrı ve enerji' } });
  const BANTLAR = Object.freeze([                                                 // movement.js:305-316
    { id:'high', min:80, carpan:1.1 }, { id:'ok', min:65, carpan:1.0 }, { id:'mid', min:50, carpan:0.8 },
    { id:'low', min:35, carpan:0.5 }, { id:'rest', min:0, carpan:0 }]);
  const YUK = Object.freeze({ acwrAlt:0.8, acwrUst:1.5, buyume:0.10, indirmeHafta:5, indirmeCarpan:0.6, asgariDk:15 }); // movement.js:323-349
  const UYKU_IDEAL = Object.freeze([7, 8.5]);                                     // data/biomarkers.js:87 sleep.optimal
  const INCE_ESIK = 0.5;                                                          // move.js:88
  const ACWR_UST_CARPAN = 0.7;                                                    // move.js:336
  const KOTU_GUN_CARPAN = 0.6;                                                    // core/kotugun.js:28
  const ATES_ESIK = 38.5, SPO2_ESIK = 92;                                         // move.js:124, :129

  /* Kişisel taban (move.js:44-55): o gün hariç geriye 30 gün, en az 3 değer. */
  function taban(kayitlar, tur, a, gun){
    const l = [];
    for(let i = 1; i <= 30; i++){ const v = gunDegeri(kayitlar, tur, a, gunEkle(gun, -i)); if(v != null) l.push(v); }
    return l.length < 3 ? null : { ort:yuvarla(l.reduce((s, x) => s + x, 0) / l.length, 1), n:l.length };
  }
  const PUANLAR = {                                                               // move.js:61-94
    uyku:h => h >= UYKU_IDEAL[0] && h <= UYKU_IDEAL[1] ? 100
      : h > UYKU_IDEAL[1] ? sikistir(100 - (h - UYKU_IDEAL[1]) * 12, 55, 100) : sikistir(100 - (UYKU_IDEAL[0] - h) * 22, 0, 100),
    hrv:(v, t) => t ? sikistir(70 + 100 * (v - t.ort) / t.ort * 2.2, 0, 100) : null,
    nabiz:(v, t) => t ? sikistir(80 - (v - t.ort) * 7, 0, 100) : null,
    enerji:v => sikistir((v - 1) * 25, 0, 100),
  };

  /* Toparlanma (move.js:96-160): eksik girdinin ağırlığı kalanlara dağılır; ateş ≥ 38,5 ya da
     oksijen < %92 günü toparlanma gününe çevirir. SAPMA (bilerek): eski kod bu bayrağı hiç girdi
     yokken uygulamıyordu (move.js:116-122 erken dönüş) ve yalnız ateş girilen gün tam yük
     çıkıyordu; burada bayrak her zaman geçerlidir. Bayrak yalnız azaltır. */
  function toparlanma(kayitlar, gun){
    const parcalar = Object.keys(TOPARLANMA).map(id => {
      const d = TOPARLANMA[id], v = gunDegeri(kayitlar, d.tur, d.alan, gun);
      const p = v == null ? null : PUANLAR[id](v, id === 'hrv' || id === 'nabiz' ? taban(kayitlar, d.tur, d.alan, gun) : null);
      return { id, ad:d.ad, agirlik:d.agirlik, deger:v, puan:p };
    });
    const ates = gunDegeri(kayitlar, 'ates', 'derece', gun), spo2 = gunDegeri(kayitlar, 'spo2', 'yuzde', gun);
    const bayrak = spo2 != null && spo2 < SPO2_ESIK ? 'spo2' : ates != null && ates >= ATES_ESIK ? 'ates' : null;
    const var_ = parcalar.filter(p => p.puan != null);
    if(!var_.length) return { ok:false, puan:yok(), bant:bayrak ? BANTLAR[BANTLAR.length - 1] : null, bayrak, parcalar, kapsam:0, ince:true };
    const ws = var_.reduce((s, p) => s + p.agirlik, 0);
    const puan = Math.round(var_.reduce((s, p) => s + p.puan * p.agirlik, 0) / ws);
    const bant = bayrak ? BANTLAR[BANTLAR.length - 1] : BANTLAR.find(b => puan >= b.min) || BANTLAR[BANTLAR.length - 1];
    return { ok:true, puan:{ v:puan, k:'computed' }, bant, bayrak, parcalar,
      eksik:parcalar.filter(p => p.puan == null).map(p => p.ad), kapsam:yuvarla(ws, 2), ince:ws < INCE_ESIK };
  }

  /* Seans yükü (move.js:170-180): süre × RPE, yoksa süre × ortalama MET; ikisi de yoksa
     BİLİNMİYOR (null; sıfır güvenli yön değil). Tek sapma: MET'i kalemin kendisinden de okunur
     (eski kod enerji hesabında okuyup yükte okumuyordu, move.js:174 ile nutri.js:89-93). */
  function seansYuku(r){
    const dk = deger(r, 'dk').v;
    if(!dk) return null;
    const rpe = deger(r, 'rpe').v;
    if(rpe != null) return Math.round(dk * rpe);
    const m = kalemleri(r).map(it => metSayisi(it.met)).filter(x => x != null);
    return m.length ? Math.round(dk * m.reduce((a, x) => a + x, 0) / m.length) : null;
  }
  function yukBilgisi(kayitlar, bitis, gunSay){
    let yuk = 0, bilinmeyen = 0;
    for(let i = 0; i < gunSay; i++) turde(kayitlar, 'hareket', gunEkle(bitis, -i)).forEach(r => {
      const y = seansYuku(r); if(y == null) bilinmeyen++; else yuk += y;
    });
    return { yuk, bilinmeyen };
  }
  const ilkHareket = kayitlar => turde(kayitlar, 'hareket').reduce((m, r) => m == null || r.gun < m ? r.gun : m, null);

  /* Akut/kronik oran (move.js:217-266): 21 günden kısa geçmişte yok; kronik pencere geçmiş
     kadar; yükü bilinmeyen seans «yük az» hükmünü düşürür. */
  function akutKronik(kayitlar, gun){
    const ilk = ilkHareket(kayitlar);
    if(!ilk) return { ok:false, neden:'Henüz antrenman kaydı yok.' };
    const span = gunFarki(ilk, gun);
    if(span < 21) return { ok:false, span, neden:'Son haftayı son aya kıyaslamak için en az 3 haftalık geçmiş gerekir; şu an ' + (span + 1) + ' gün var.' };
    const kronikGun = Math.min(28, span + 1);
    const akut = yukBilgisi(kayitlar, gun, 7).yuk / 7, kb = yukBilgisi(kayitlar, gun, kronikGun), kronik = kb.yuk / kronikGun;
    if(!kronik) return { ok:false, neden:'Son dört haftada yeterli yük kaydı yok.' };
    const oran = yuvarla(akut / kronik, 2);
    let bolge = oran < YUK.acwrAlt ? 'low' : oran > YUK.acwrUst ? 'high' : 'ok';
    if(kb.bilinmeyen && bolge === 'low') bolge = 'ok';
    return { ok:true, oran:{ v:oran, k:'computed' }, akut:Math.round(akut), kronik:Math.round(kronik), bolge, kronikGun, bilinmeyen:kb.bilinmeyen };
  }

  /* Beş haftada bir indirme haftası (move.js:268-290); sayaç ilk seanstan başlar. */
  function indirmeHaftasi(kayitlar, gun){
    const ilk = ilkHareket(kayitlar);
    if(!ilk) return { due:false, basladi:false, hafta:0 };
    const h = Math.floor(gunFarki(ilk, gun) / 7), dongu = h % YUK.indirmeHafta;
    return { due:dongu === YUK.indirmeHafta - 1, basladi:true, hafta:h + 1, dongude:dongu + 1, carpan:YUK.indirmeCarpan };
  }

  /* GÜVENLİK: haftalık yük geçen haftadan %10'dan fazla artmaz (move.js:292-306, movement.js:337-341).
     `enCok` bu haftaya izin verilen en yüksek yüktür; `dkEnCok` aynı kural süre için
     (movement.js:339 «koşu mesafesi, set sayısı ve toplam süre için ayrı ayrı»). */
  function haftalikBuyume(kayitlar, gun){
    const bu = yukBilgisi(kayitlar, gun, 7).yuk, gecen = yukBilgisi(kayitlar, gunEkle(gun, -7), 7).yuk;
    const dk = b => { let t = 0; for(let i = 0; i < 7; i++) t += topla(turde(kayitlar, 'hareket', gunEkle(b, -i)), 'dk').v || 0; return t; };
    const gecenDk = dk(gunEkle(gun, -7));
    const dkEnCok = gecenDk ? { v:Math.floor(gecenDk * (1 + YUK.buyume)), k:'computed' } : yok();
    if(!gecen) return { ok:false, buHafta:bu, gecenHafta:gecen, enCok:yok(), dkEnCok };
    const buyume = yuvarla((bu - gecen) / gecen, 2);
    return { ok:true, buHafta:bu, gecenHafta:gecen, buyume:{ v:buyume, k:'computed' }, asti:buyume > YUK.buyume,
      enCok:{ v:Math.floor(gecen * (1 + YUK.buyume)), k:'computed' }, dkEnCok };
  }

  /* Günün emri (move.js:310-383): toparlanma bandı taban çarpanı verir; ince ölçüm artıramaz,
     ACWR yüksekse ≤ 0,7, indirme haftası ≤ 0,6, kötü gün ≤ 0,6. Sistem yükü YALNIZ AZALTIR. */
  function gununEmri(kayitlar, gun, secenek){
    const r = toparlanma(kayitlar, gun), a = akutKronik(kayitlar, gun), dl = indirmeHaftasi(kayitlar, gun);
    let carpan = r.bant ? r.bant.carpan : 1;
    const gerekce = [];
    if(r.ok && r.ince && carpan > 1){ carpan = 1; gerekce.push('ince'); }
    gerekce.push(r.ok ? 'toparlanma' : 'veri-yok');
    if(r.bayrak) gerekce.push(r.bayrak);
    if(a.ok && a.bolge === 'high'){ carpan = Math.min(carpan, ACWR_UST_CARPAN); gerekce.push('acwr'); }
    if(dl.due){ carpan = Math.min(carpan, YUK.indirmeCarpan); gerekce.push('indirme'); }
    if(secenek && secenek.kotuGun){ carpan = Math.min(carpan, KOTU_GUN_CARPAN); gerekce.push('kotu-gun'); }
    const tur = carpan === 0 ? 'rest' : carpan <= 0.6 ? 'light' : carpan < 1 ? 'reduced' : 'full';
    return { gun, carpan:{ v:yuvarla(carpan, 2), k:'computed' }, tur, gerekce, toparlanma:r, acwr:a, indirme:dl, asgariDk:YUK.asgariDk };
  }

  const Kural = Object.freeze({ HEDEF_ORANI, TOPARLANMA, BANTLAR, YUK, UYKU_IDEAL, INCE_ESIK, ACWR_UST_CARPAN, KOTU_GUN_CARPAN,
    ATES_ESIK, SPO2_ESIK, bmr, guncelKilo, hareketEnerjisi, enerjiHedefi, toparlanma, seansYuku, akutKronik,
    indirmeHaftasi, haftalikBuyume, gununEmri, uykuGunu });

  /* ============================================================= GÖÇ
     Eski kayıt → tipli kayıt. Eski gövde birleşik depoda aynen kalır (faz1.md, sistem/goc.py);
     bu bağdaştırıcılar onu türlere ayırır. Sınırı aşan değer sessizce atılmaz: `reddedilen`e
     nedeniyle düşer. Etiketsiz sayı «eski» (karar 11); kendi etiketi olan etiketini korur. */
  const ETIKET_CEVIR = { measured:'measured', estimated:'estimated', derived:'computed', computed:'computed' };
  function toplu(isler){
    const out = { kayitlar:[], reddedilen:[] };
    isler.forEach(([tur, girdi, bag]) => {
      const r = kur(tur, girdi, bag, GOC_IZNI);
      if(r.ok) out.kayitlar.push(r.kayit); else out.reddedilen.push({ tur, id:bag.id, hatalar:r.hatalar });
    });
    return out;
  }
  const eski = v => v == null || v === '' ? null : { v, k:'eski' };
  const msOf = s => { const t = Date.parse(s || ''); return isFinite(t) ? t : null; };

  const GOC = Object.freeze({
    /* SPİ vitals/<gün> (SPI core/state.js:608-631): bir gün, birçok ölçü. */
    spiVitals(doc){
      const d = doc || {}, gun = d.date, isler = [], id = t => 'spi:vitals:' + gun + ':' + t, kay = 'goc:spi';
      const tek = (alan, tur, a) => { if(d[alan] != null && d[alan] !== '') isler.push([tur, { [a]:eski(d[alan]) }, { gun, id:id(tur), kaynak:kay }]); };
      tek('weight', 'kilo', 'kg'); tek('waist', 'bel', 'cm'); tek('bodyfat', 'yagOrani', 'yuzde');
      tek('rhr', 'nabiz', 'atim'); tek('hrv', 'hrv', 'ms'); tek('spo2', 'spo2', 'yuzde'); tek('temp', 'ates', 'derece');
      tek('soreness', 'enerji', 'puan'); tek('sleep', 'uyku', 'saat');
      if(d.sbp != null || d.dbp != null) isler.push(['tansiyon', { buyuk:eski(d.sbp), kucuk:eski(d.dbp) }, { gun, id:id('tansiyon'), kaynak:kay }]);
      /* 0 ml su eski varsayılandır, ölçüm değil (state.js:624-629); «beyan» tahmindir (screens/today.js:1657). */
      if(d.water != null && Number(d.water) !== 0) isler.push(['su', { ml:{ v:d.water, k:d.waterSrc === 'beyan' ? 'estimated' : 'eski' } }, { gun, id:id('su'), kaynak:kay }]);
      (Array.isArray(d.kestirmeler) ? d.kestirmeler : []).forEach(k => isler.push(['kestirme',
        Object.assign({ dk:eski(k.dk) }, k.bas ? { bas:k.bas } : {}), { gun, id:'spi:kestirme:' + k.id, zaman:msOf(k.at), kaynak:kay }]));
      return toplu(isler);
    },
    /* SPİ meals/<gün> {date, rows:[{id, slot, items[{foodId, g, cert, portion}], note, at}]} (state.js:160-166, :661-668). */
    spiOgun(doc){
      const d = doc || {};
      return toplu((d.rows || []).map(m => ['ogun',
        { icerik:m.note || (m.items || []).map(it => it.foodId).filter(Boolean).join(', ') || m.slot || 'öğün',
          ogun:['kahvalti', 'ogle', 'aksam', 'ara'].includes(m.slot) ? m.slot : null },
        { gun:d.date, id:'spi:ogun:' + m.id, zaman:msOf(m.at), kaynak:'goc:spi',
          kalemler:(m.items || []).map(it => ({ foodId:it.foodId, g:it.g == null ? null : { v:it.g, k:ETIKET_CEVIR[it.cert] || 'estimated' }, portion:it.portion || null })) }]));
    },
    /* SPİ workouts/<id> (state.js:684-700, move.js:444-450 metSeans). metOf(exId): katalogdaki MET (data/movement.js EX_BY_ID). */
    spiAntrenman(w, metOf){
      const x = w || {}, tur = { strength:'kuvvet', cardio:'kardiyo', mobility:'mobilite' }[x.kind] || null;
      const kalemler = (x.items || []).filter(Boolean).map(it => ({ exId:it.exId || null,
        met:metSayisi(it.met) != null ? metSayisi(it.met) : metOf ? metSayisi(metOf(it.exId)) : null,
        dk:Number(it.minutes) > 0 ? Number(it.minutes) : null, set:it.sets == null ? null : it.sets, tekrar:it.reps == null ? null : it.reps }));
      return toplu([['hareket', { dk:eski(x.minutes), rpe:eski(x.rpe), ad:x.name || null, tur },
        { gun:x.date, id:'spi:hareket:' + x.id, zaman:msOf(x.createdAt), kaynak:'goc:spi', kalemler }]]);
    },
    /* SPİ profile (state.js:178-200) → kural motorunun profili. */
    spiProfil(p){
      const x = p || {}, hedef = { health:'saglik', maintain:'koru', cut:'ver', gain:'al' }[x.goal] || 'saglik';
      return { kilo:Number(x.weightKg) > 0 ? Number(x.weightKg) : null, boy:x.heightCm || null, dogumYili:x.birthYear || null,
        cinsiyet:x.sex === 'male' ? 'erkek' : x.sex === 'female' ? 'kadin' : null, hedef, kcalHedef:x.kcalHedef || null };
    },
    /* AYS mood/<gün> (state.js:187-191, :926-933): boş enerji 3 yazılıyordu; ayırt edilemez → «eski». */
    aysMood(doc){
      const d = doc || {};
      return toplu([['enerji', Object.assign({ puan:eski(d.energy) }, d.note ? { not:d.note } : {}),
        { gun:d.date, id:'ays:enerji:' + d.date, zaman:msOf(d.at), kaynak:'goc:ays' }]]);
    },
    /* AYS breaks/<id> (state.js:948-958): süre boşsa 5 dk varsayılan yazılıyordu → «eski». */
    aysMola(doc){
      const d = doc || {};
      return toplu([['mola', { dk:eski(d.minutes) }, { gun:d.dayISO, id:'ays:mola:' + d.id, zaman:msOf(d.at), kaynak:'goc:ays' }]]);
    },
    /* AYS days/<gün> (state.js:118-136, :379-412): yapılan blokların süresi çalışma, sleepHours gece uykusu. */
    aysGun(day){
      const d = day || {}, isler = [];
      (d.blocks || []).forEach(b => {
        if(b.slot === 'Dinlenme' || (b.status !== 'done' && b.status !== 'partial') || b.actualMin == null) return;
        isler.push(['calisma', { dk:eski(b.actualMin), sayi:eski(b.actualQ), alan:'akademik', konu:b.topic || b.subject || null },
          { gun:d.date, id:'ays:calisma:' + d.date + ':' + b.id, zaman:msOf(b.startedAt), kaynak:'goc:ays' }]);
      });
      if(d.sleepHours) isler.push(['uyku', { saat:eski(d.sleepHours) }, { gun:d.date, id:'ays:uyku:' + d.date, kaynak:'goc:ays' }]);
      return toplu(isler);
    },
    /* ESP days/<gün>.sessions[] (ESP core/state.js:358-445): etiketler kardeş alanda, korunur. */
    espGun(day){
      const d = day || {}, et = (v, c) => v == null || c === 'missing' ? null : { v, k:ETIKET_CEVIR[c] || 'eski' };
      return toplu((d.sessions || []).map(s => ['calisma',
        { dk:et(s.minutes, s.minutesCert), sayi:et(s.count, s.countCert), kalite:et(s.quality, s.qualityCert || 'estimated'), alan:'esp', konu:s.disc || null },   // disiplin (lang, …) konudur; alan AYS'deki gibi modül düzeyi
        { gun:d.date, id:'esp:calisma:' + d.date + ':' + s.id, kaynak:'goc:esp' }]));
    },
  });
  const EKSIK = Object.freeze({
    spiVitals:['semptomlar (symptoms, symptomsLogged) ve adet günü (period): Tahlil alanının türü, bu motorda yok',
      'günün notu (note): Not motoruna', 'vitals sayıları etiketsiz: hepsi «eski kayıt» (karar 11)'],
    spiOgun:['kcal ve besin değerleri besin tablosundan hesaplanır: tablo bu motorda yok, Beslenme alanı taşınınca yeniden hesaplanır (türetilmiş)',
      'kalemlerin besin adı: yalnız foodId taşınır', 'öğün saati (at) kayıt zamanıdır, yemek saati değil: göremedim'],
    spiAntrenman:['templateId ve basamak (levelId): Hareket yol haritasının kaydı', 'seans notu: Not motoruna',
      'süre ve RPE etiketsiz: «eski kayıt»; boş süre 40 dk varsayılanla doluyordu (state.js:690), ayırt edilemez'],
    spiProfil:['hedef dışı alanlar (koşullar, tema, sabitler): Çekirdek profil', 'etkinlik düzeyi: hiçbir hedefe girmiyordu (nutri.js:74-82), taşınmaz'],
    aysMood:['enerji 3 gerçek mi varsayılan mı: göremedim (state.js:189), «eski kayıt»'],
    aysMola:['etkinlik (activityId): göremedim, taşınmaz', 'boş süre 5 dk varsayılanla doluyordu (activities.js:103), ayırt edilemez'],
    aysGun:['blok hedefleri, durum, atlama nedeni: Plan motorunun bağdaştırıcısı (Plan.GOC.aysGun)', 'paragraf/problem sayıları ve serbest soru: Soru motoru',
      'doğru sayısı (correctQ): Soru motoru', 'dikkat dağılması sayısı (distractions): göremedim, taşınmaz'],
    espGun:['kalite aralığı: göremedim (0-10 kabul edildi)', 'günün notu: Not motoruna'],
  });

  const Kayit = Object.freeze({ ETIKET, TURLER, kaydet, deger, birlesik, gunluk, haftalik, Kural, GOC, EKSIK,
    yardimci:Object.freeze({ gunEkle, gunFarki, turde }) });
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Motor = kok.LIFEOS.Motor || {};
  kok.LIFEOS.Motor.Kayit = Kayit;
  if(typeof module !== 'undefined' && module.exports) module.exports = Kayit;
})(typeof window !== 'undefined' ? window : globalThis);
