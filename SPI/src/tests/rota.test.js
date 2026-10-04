/* Rotalar — GPX okuma, iz hesabı, saklama ve çizim (core/rota.js,
   core/harita.js) ile Hareket › Kardiyo'daki rota kartı ve kağıtları. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const R = SP.Rota, H = SP.Harita;

  /* Meridyen boyunca bir derece, metre (rota.js'deki yer yarıçapıyla). */
  const M_DERECE = Math.PI * 6371008.8 / 180;
  /* Yerel 09:00: test sayfası Europe/Istanbul saat diliminde açılır. */
  const T0 = new Date(2026, 8, 20, 9, 0, 0).getTime();

  /* Kuzeye giden düz iz: n nokta, her adım `adimM` metre ve `adimSn` saniye. */
  function hat(n, adimM, adimSn, o){
    o = o || {};
    const lat0 = o.lat0 == null ? 41 : o.lat0, lon0 = o.lon0 == null ? 29 : o.lon0;
    const t0 = o.t0 == null ? T0 : o.t0;
    const out = [];
    for(let i = 0; i < n; i++){
      out.push({ lat:lat0 + i * adimM / M_DERECE, lon:lon0,
        ele:o.ele ? o.ele(i) : null, t:t0 + i * adimSn * 1000, parca:i === 0 });
    }
    return out;
  }

  const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* Parçalar → GPX metni. o: { ns:false (ad alanı yok), ad, tur } */
  function gpx(parcalar, o){
    o = o || {};
    const ns = o.ns === false ? '' : ' xmlns="http://www.topografix.com/GPX/1/1"';
    const pt = p => '<trkpt lat="' + p.lat + '" lon="' + p.lon + '">'
      + (p.ele != null ? '<ele>' + p.ele + '</ele>' : '')
      + (p.t != null ? '<time>' + new Date(p.t).toISOString() + '</time>' : '')
      + '</trkpt>';
    return '<?xml version="1.0" encoding="UTF-8"?>'
      + '<gpx version="1.1" creator="test"' + ns + '><trk>'
      + (o.ad ? '<name>' + xml(o.ad) + '</name>' : '')
      + (o.tur ? '<type>' + xml(o.tur) + '</type>' : '')
      + parcalar.map(s => '<trkseg>' + s.map(pt).join('') + '</trkseg>').join('')
      + '</trk></gpx>';
  }

  /* 5 km, 5:00 dk/km, hafif yokuşlu koşu. */
  const besKm = o => gpx([hat(1001, 5, 1.5, { ele:i => 100 + 10 * Math.sin(i / 80) })], o);

  /* Rotalı seansı doğrudan duruma yazar (depo çağrısı yapmadan). */
  function pushRota(metin, exId){
    const r = R.oku(metin, 'test.gpx');
    const w = R.seans(r.rota, exId || 'kosu');
    SP.S.workouts.push(w);
    return w;
  }

  /* --------------------------------------------------------------- GPX */

  describe('Rota — GPX okuma', () => {
    it('ad alanlı ve ad alansız dosya aynı okunur', () => {
      const p = hat(5, 10, 3, { ele:i => 100 + i });
      const a = R.gpxOku(gpx([p], { ad:'Sabah koşusu', tur:'running' }));
      const b = R.gpxOku(gpx([p], { ns:false, ad:'Sabah koşusu', tur:'running' }));
      expect(a.ok).toBe(true);
      expect(b.ok).toBe(true);
      expect(a.noktalar).toHaveLength(5);
      expect(b.noktalar).toHaveLength(5);
      expect(a.ad).toBe('Sabah koşusu');
      expect(a.tur).toBe('kosu');
      expect(a.noktalar[2].ele).toBe(102);
      expect(a.noktalar[2].t).toBe(p[2].t);
      expect(b.noktalar[4].lat).toBe(p[4].lat);
    });

    it('bozuk noktalar atlanır ve sayılır', () => {
      const metin = gpx([hat(3, 10, 3)]).replace('<trkseg>',
        '<trkseg><trkpt lat="abc" lon="29"></trkpt><trkpt lat="95" lon="29"></trkpt>');
      const g = R.gpxOku(metin);
      expect(g.ok).toBe(true);
      expect(g.noktalar).toHaveLength(3);
      expect(g.atlanan).toBe(2);
    });

    it('planlanmış rota (rtept) kaydedilmiş aktivite sayılmaz', () => {
      const g = R.gpxOku('<gpx xmlns="http://www.topografix.com/GPX/1/1"><rte>'
        + '<rtept lat="41" lon="29"/><rtept lat="41.01" lon="29"/></rte></gpx>');
      expect(g.ok).toBe(false);
      expect(g.why).toContain('planlanmış');
    });

    it('GPX olmayan, boş ya da noktasız dosya reddedilir', () => {
      expect(R.gpxOku('merhaba').why).toBe('Bu bir GPX dosyası değil.');
      expect(R.gpxOku('<kml></kml>').why).toBe('Bu bir GPX dosyası değil.');
      expect(R.gpxOku('<gpx><trk>').ok).toBe(false);
      expect(R.gpxOku('').why).toBe('Dosya boş.');
      expect(R.gpxOku(null).why).toBe('Dosya boş.');
      expect(R.gpxOku('<gpx><trk><trkseg></trkseg></trk></gpx>').why).toBe('Dosyada GPS noktası yok.');
    });

    /* iPhone (2026-10-04): ekran kapalıyken rotayı başka bir uygulama
       kaydeder (ör. Open GPX Tracker), GPX SPİ'ye aktarılır. Böyle dosyalar
       metadata, işaret noktası (wpt), extensions taşır; bazıları baştaki
       boş satır ya da BOM ile başlar — XML bildirimi o zaman ilk karakter
       değildir ve ayrıştırıcı dosyayı reddederdi. */
    it('iPhone kayıt uygulamasının dosyası okunur: metadata, wpt, extensions, BOM ve baştaki boşluk', () => {
      const p = hat(4, 10, 3, { ele:i => 50 + i });
      const nokta = q => '\n\t\t\t<trkpt lat="' + q.lat + '" lon="' + q.lon + '">\n\t\t\t\t<ele>' + q.ele
        + '</ele>\n\t\t\t\t<time>' + new Date(q.t).toISOString() + '</time>\n\t\t\t\t<extensions><speed>2.8</speed></extensions>\n\t\t\t</trkpt>';
      const metin = '﻿\n  <?xml version="1.0" encoding="UTF-8"?>\n'
        + '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
        + ' version="1.1" creator="Open GPX Tracker for iOS">\n'
        + '\t<metadata><name>Sabah</name><time>' + new Date(p[0].t).toISOString() + '</time></metadata>\n'
        + '\t<wpt lat="41" lon="29"><name>Başlangıç</name></wpt>\n'
        + '\t<trk>\n\t\t<trkseg>' + p.map(nokta).join('') + '\n\t\t</trkseg>\n\t</trk>\n</gpx>\n';
      const g = R.gpxOku(metin);
      expect(g.ok).toBe(true);
      expect(g.noktalar).toHaveLength(4);
      expect(g.noktalar[3].ele).toBe(53);
      expect(g.noktalar[3].t).toBe(p[3].t);
    });

    it('tür yazısı tanınır; sayı kodu tahmin edilmez', () => {
      expect(R.turOf('Running')).toBe('kosu');
      expect(R.turOf('trail running')).toBe('kosu');
      expect(R.turOf('Hiking')).toBe('yuruyus');
      expect(R.turOf('road-biking')).toBe('bisiklet');
      expect(R.turOf('9')).toBeNull();
      expect(R.turOf('')).toBeNull();
      const g = R.gpxOku(gpx([hat(3, 10, 3)], { tur:'9' }));
      expect(g.tur).toBeNull();
      expect(g.turYazi).toBe('9');
    });
  });

  /* -------------------------------------------------------------- hesap */

  describe('Rota — iz hesabı', () => {
    it('zamanı olmayan iz reddedilir — süre uydurulmaz', () => {
      const p = hat(50, 10, 3).map(x => Object.assign(x, { t:null }));
      const a = R.analiz(p);
      expect(a.ok).toBe(false);
      expect(a.why).toContain('zaman');
      expect(R.oku(gpx([p])).ok).toBe(false);
    });

    it('düz koşu: mesafe, hareket süresi ve tempo izden hesaplanır', () => {
      const a = R.analiz(hat(201, 10, 3));
      expect(a.ok).toBe(true);
      expect(a.mesafe).toBe(2000);
      expect(a.hareket).toBe(600);
      expect(a.sure).toBe(600);
      expect(R.sureMetni(R.tempo(a.hareket, a.mesafe))).toBe('5:00');
      expect(R.hiz(a.hareket, a.mesafe)).toBeCloseTo(12, 6);
    });

    it('durakta GPS titremesi mesafe üretmez, duraklama hareket süresine girmez', () => {
      const ilk = hat(101, 10, 3), son = ilk[100];
      const p = ilk.slice();
      for(let k = 1; k <= 100; k++){
        p.push({ lat:son.lat + (k % 2 ? 1.5 : -1.5) / M_DERECE, lon:29, ele:null,
          t:son.t + 3000 * k, parca:false });
      }
      for(let j = 1; j <= 100; j++){
        p.push({ lat:son.lat + 10 * j / M_DERECE, lon:29, ele:null,
          t:son.t + 300000 + 3000 * j, parca:false });
      }
      const a = R.analiz(p);
      expect(a.mesafe).toBe(2000);
      expect(a.sure).toBe(900);
      /* Duraktan sonraki ilk adım (303 sn'de 10 m) da duraklamadır. */
      expect(a.hareket).toBe(597);
    });

    it('yerinde titreşen iz «hareket yok» der', () => {
      const p = [];
      for(let k = 0; k < 50; k++) p.push({ lat:41 + (k % 2) / M_DERECE, lon:29, ele:null, t:T0 + k * 3000 });
      const a = R.analiz(p);
      expect(a.ok).toBe(false);
      expect(a.why).toContain('hareket yok');
    });

    /* Hata (2026-10-03): tek noktalı iz «Dosyada zaman bilgisi yok,
       planlanmış rota» diyordu; noktanın zamanı vardı. */
    it('tek noktalı iz «hareket yok» der, «zaman yok» demez', () => {
      const a = R.analiz(hat(1, 10, 3));
      expect(a.ok).toBe(false);
      expect(a.why).toContain('hareket yok');
      expect(R.analiz([]).why).toContain('hareket yok');
    });

    it('GPS sıçraması mesafeye de süreye de girmez', () => {
      const p = hat(201, 10, 3);
      p[100] = Object.assign({}, p[100], { lat:p[100].lat + 5000 / M_DERECE });
      const a = R.analiz(p);
      /* Sıçramanın iki yanındaki iki adım (20 m, 6 sn) düşer. */
      expect(a.mesafe).toBe(1980);
      expect(a.hareket).toBe(594);
    });

    it('iki parça (trkseg) arasındaki boşluk mesafe sayılmaz', () => {
      const s1 = hat(101, 10, 3);
      const s2 = hat(101, 10, 3, { lat0:41 + 3000 / M_DERECE, t0:T0 + 1800e3 });
      const g = R.gpxOku(gpx([s1, s2]));
      expect(g.noktalar[101].parca).toBe(true);
      const a = R.analiz(g.noktalar);
      expect(a.mesafe).toBe(2000);
      expect(a.hareket).toBe(600);
      expect(a.sure).toBe(2100);
    });

    it('km dilimleri: son dilim 50 metreden kısaysa düşer', () => {
      const a = R.analiz(hat(204, 10, 3));
      expect(a.mesafe).toBe(2030);
      expect(a.dilimler).toEqual([{ m:1000, sn:300, dy:null }, { m:1000, sn:300, dy:null }]);
      const b = R.analiz(hat(251, 10, 3));
      expect(b.dilimler).toHaveLength(3);
      expect(b.dilimler[2]).toEqual({ m:500, sn:150, dy:null });
    });

    it('tırmanış 3 metre eşikle sayılır', () => {
      expect(R.tirmanisOf([0, 1, 2, 1, 2, 1, 2, 1])).toBe(0);
      expect(R.tirmanisOf([0, 5, 10, 8, 12])).toBe(10);
      expect(R.tirmanisOf([10, 4, 9])).toBe(5);
    });

    it('yükselen rotada tırmanış, profil ve dilim farkı hesaplanır', () => {
      const a = R.analiz(hat(201, 10, 3, { ele:i => 100 + i * 0.25 }));
      expect(a.tirmanis >= 46 && a.tirmanis <= 50).toBe(true);
      expect(a.enAlcak).toBe(100);
      expect(a.enYuksek).toBe(150);
      expect(a.profil).toHaveLength(100);
      expect(a.profil[0] < a.profil[99]).toBe(true);
      expect(a.dilimler[0].dy).toBe(25);
    });

    it('yükseklik yoksa tırmanış «veri yok» — sıfır değil', () => {
      const a = R.analiz(hat(101, 10, 3));
      expect(a.tirmanis).toBeNull();
      expect(a.profil).toBeNull();
      expect(a.enAlcak).toBeNull();
      expect(a.dilimler[0].dy).toBeNull();
      /* Noktaların yarısından azında yükseklik: yine hesaplanmaz. */
      const b = R.analiz(hat(101, 10, 3, { ele:i => i < 30 ? 100 : null }));
      expect(b.tirmanis).toBeNull();
    });
  });

  /* ------------------------------------------------------------ saklama */

  describe('Rota — saklama', () => {
    it('kodlanmış çizgi yaygın biçimin bilinen örneğiyle aynı', () => {
      const p = [{ lat:38.5, lon:-120.2 }, { lat:40.7, lon:-120.95 }, { lat:43.252, lon:-126.453 }];
      const kod = R.kodla(p);
      expect(kod).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
      expect(R.coz(kod)).toEqual(p);
    });

    it('kodla → çöz gidiş-dönüşü 1e-5 derece duyarlıkta', () => {
      const p = hat(50, 37, 11, { lat0:-33.86, lon0:151.2 });
      const c = R.coz(R.kodla(p));
      expect(c).toHaveLength(50);
      c.forEach((x, i) => {
        expect(x.lat).toBeCloseTo(p[i].lat, 4);
        expect(x.lon).toBeCloseTo(p[i].lon, 4);
      });
    });

    it('yarım kalmış çizgi hata atmaz', () => {
      expect(R.coz('_p~iF~ps|U_ulL')).toHaveLength(1);
      expect(R.coz('')).toEqual([]);
      expect(R.coz(null)).toEqual([]);
    });

    it('düz iz iki noktaya iner; ilk ve son nokta korunur', () => {
      const p = hat(500, 10, 3);
      const s = R.sadelestir(p, 4);
      expect(s).toHaveLength(2);
      expect(s[0]).toBe(p[0]);
      expect(s[1]).toBe(p[499]);
    });

    it('saklanan iz 600 noktayı hiçbir izde aşmaz', () => {
      /* Kötü durum: her adımda 300 m sağa sola giden zikzak. Hiçbir
         tolerans bunu sadeleştiremez; tavan yine tutmalı. */
      const lonM = M_DERECE * Math.cos(41 * Math.PI / 180);
      const p = [];
      for(let i = 0; i < 3000; i++){
        p.push({ lat:41 + i * 10 / M_DERECE, lon:29 + (i % 2 ? 300 : -300) / lonM });
      }
      const s = R.sakla(p);
      expect(s.length <= 600).toBe(true);
      expect(s[0]).toBe(p[0]);
      expect(s[s.length - 1]).toBe(p[2999]);
    });

    it('kaydedilecek rota küçük kalır ve özet taşır', () => {
      const r = R.oku(besKm(), 'kosu.gpx');
      expect(r.ok).toBe(true);
      expect(r.rota.v).toBe(1);
      expect(r.rota.kaynak).toBe('gpx');
      expect(r.rota.dosya).toBe('kosu.gpx');
      expect(r.rota.mesafe).toBe(5000);
      expect(r.rota.nokta).toBe(1001);
      expect(R.coz(r.rota.iz).length >= 2).toBe(true);
      expect(JSON.stringify(r.rota).length < 4000).toBe(true);
    });

    it('aynı başlangıç anı ikinci kez eklenmez', () => {
      const r = R.oku(besKm()).rota;
      const w = { id:'w1', rota:Object.assign({}, r) };
      expect(R.kayitli(r, [w])).toBe(w);
      expect(R.kayitli(Object.assign({}, r, { bas:'2026-01-01T00:00:00.000Z' }), [w])).toBeNull();
      expect(R.kayitli(r, null)).toBeNull();
    });
  });

  /* -------------------------------------------------------------- seans */

  describe('Rota — seans', () => {
    it('seans tarihi yerel gündür (UTC günü değil)', () => {
      resetState();
      const bas = new Date(2026, 8, 21, 0, 30).toISOString();   /* UTC'de 20 Eylül */
      const w = R.seans({ bas, hareket:1800 }, 'kosu');
      expect(w.date).toBe('2026-09-21');
    });

    it('yük MET × hareket süresidir; zorluk uydurulmaz', () => {
      resetState();
      const w = R.seans({ bas:new Date(T0).toISOString(), hareket:1800 }, 'kosu');
      expect(w.kind).toBe('cardio');
      expect(w.minutes).toBe(30);
      expect(w.rpe).toBeNull();
      expect(w.items[0].exId).toBe('kosu');
      expect(w.items[0].minutes).toBe(30);
      expect(SP.Move.sessionLoad(w)).toBe(Math.round(30 * SP.EX_BY_ID.kosu.met));
    });

    it('rota alamayan hareketle seans kurulmaz', () => {
      resetState();
      const r = { bas:new Date(T0).toISOString(), hareket:600 };
      expect(R.seans(r, 'squat')).toBeNull();
      expect(R.seans(r, 'yok-boyle-hareket')).toBeNull();
    });

    it('liste en yeniyi başa koyar, izsiz seansı almaz', () => {
      const eski = { id:'a', rota:{ bas:'2026-09-01T06:00:00.000Z', iz:'??' } };
      const yeni = { id:'b', rota:{ bas:'2026-09-10T06:00:00.000Z', iz:'??' } };
      const izsiz = { id:'c', rota:{ bas:'2026-09-20T06:00:00.000Z', iz:'' } };
      expect(R.liste([eski, izsiz, yeni, { id:'d' }]).map(w => w.id)).toEqual(['b', 'a']);
    });
  });

  /* ------------------------------------------------------------- harita */

  describe('Harita — çizim', () => {
    const iz = () => hat(100, 10, 3);
    const yerlestir = html => { const d = document.createElement('div'); d.innerHTML = html; return d; };

    it('boş ya da tek noktalı iz çizilmez', () => {
      expect(H.ciz([]).html).toBe('');
      expect(H.ciz(null).html).toBe('');
      expect(H.ciz([[{ lat:41, lon:29 }]]).html).toBe('');
    });

    it('zemin OSM karolarıdır ve künye yazılır', () => {
      const o = H.ciz([iz()], { gen:640, yuk:300 });
      expect(o.html).toContain(H.KARO_ADRES + o.z + '/');
      expect(o.html).toContain('© OpenStreetMap katkıcıları');
      expect(o.z >= 2 && o.z <= 17).toBe(true);
    });

    it('zeminsiz haritada ne karo ne künye var', () => {
      const o = H.ciz([iz()], { zemin:false });
      expect(o.html.indexOf('<image') < 0).toBe(true);
      expect(o.html.indexOf('OpenStreetMap') < 0).toBe(true);
    });

    it('koordinatlar pencereye göre yerel yazılır', () => {
      const d = yerlestir(H.ciz([iz()], { gen:640, yuk:300 }).html);
      const pts = d.querySelector('.harita__iz').getAttribute('points').split(' ')
        .map(s => s.split(',').map(Number));
      pts.forEach(([x, y]) => {
        expect(x >= 0 && x <= 640).toBe(true);
        expect(y >= 0 && y <= 300).toBe(true);
      });
    });

    it('düğmeli haritada künye bağlantısı düğmenin dışındadır', () => {
      const d = yerlestir(H.ciz([iz()], { dugme:{ act:'rota-ac', id:'w1', aria:'Rotayı aç' } }).html);
      const b = d.querySelector('button.harita__dugme');
      expect(b.getAttribute('data-act')).toBe('rota-ac');
      expect(b.getAttribute('aria-label')).toBe('Rotayı aç');
      expect(b.querySelector('a')).toBeNull();
      expect(b.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
      expect(d.querySelector('.harita__kunye a').closest('button')).toBeNull();
    });

    it('etiket kaçışlanır', () => {
      const d = yerlestir(H.ciz([iz()], { etiket:'<b>"x"</b>' }).html);
      expect(d.querySelector('b')).toBeNull();
      expect(d.querySelector('svg').getAttribute('aria-label')).toBe('<b>"x"</b>');
    });

    it('ısı haritası her rotayı tek soluk çizgiyle çizer', () => {
      const d = yerlestir(H.ciz([iz(), hat(80, 12, 3, { lon0:29.01 }), hat(60, 9, 3, { lat0:41.005 })],
        { isi:true }).html);
      expect(d.querySelectorAll('polyline.harita__isi')).toHaveLength(3);
      expect(d.querySelectorAll('circle')).toHaveLength(0);
    });

    it('ısı haritası bölgesi: başka şehirdeki rota dışarıda sayılır', () => {
      const ist1 = hat(20, 10, 3), ist2 = hat(20, 10, 3, { lat0:41.05, lon0:29.02 });
      const ank = hat(20, 10, 3, { lat0:39.93, lon0:32.85 });
      const b = H.bolge([ist1, ank, ist2]);
      expect(b.secilen).toHaveLength(2);
      expect(b.disarida).toBe(1);
      expect(H.bolge([ank]).disarida).toBe(0);
    });

    it('yükseklik profili: düz rotada iki etiket üst üste binmez', () => {
      const duz = H.profilSvg(new Array(100).fill(100), 5000);
      expect(duz.split(' m</text>').length - 1).toBe(1);
      const inisli = H.profilSvg([100, 140, 120], 5000);
      expect(inisli.split(' m</text>').length - 1).toBe(2);
      expect(H.profilSvg([100], 5000)).toBe('');
      expect(H.profilSvg(null, 5000)).toBe('');
    });
  });

  /* -------------------------------------------------- Kardiyo ekranı */

  describe('Rota — Kardiyo ekranı', () => {
    const scr = SP.Screens.move;
    const dosya = (metin, ad) => ({ name:ad || 'kosu.gpx', size:metin.length, text:async () => metin });
    const kagit = () => document.getElementById('sheet');
    const kaydetDugmesi = () => kagit().querySelector('[data-act="rota-kaydet"]');

    /* Ekranı çizmeden, bildirimleri toplayarak eylem koşar. */
    async function sessiz(fn){
      const ciz = SP.App.render, bil = SP.UI.toast, toastlar = [];
      SP.App.render = () => {}; SP.UI.toast = t => toastlar.push(t);
      try{ await fn(); }
      finally{ SP.App.render = ciz; SP.UI.toast = bil; }
      return toastlar;
    }
    const sec = (metin, ad) => scr.change['rota-dosya']({ files:[dosya(metin, ad)], value:'' });

    it('kart son rotanın haritasını çizer; tek rotada ısı haritası düğmesi yok', async () => {
      resetState();
      const w = pushRota(besKm());
      const d = document.createElement('div');
      d.innerHTML = await scr.render();
      expect(d.querySelector('.rota .harita svg')).toBeTruthy();
      expect(d.querySelector('.rota [data-act="rota-ac"]').getAttribute('data-id')).toBe(w.id);
      expect(d.querySelector('[data-act="rota-isi"]')).toBeNull();
      /* Sade kart: rota varken tek bağlantı «Tümü»; GPX ekle onun kağıdında. */
      expect(d.querySelector('.rota [data-act="rota-tumu"]')).toBeTruthy();
      expect(d.querySelector('.rota input[data-change="rota-dosya"]')).toBeNull();
    });

    it('rota yokken kart haritasız, ne yapılacağını söyler', async () => {
      resetState();
      const d = document.createElement('div');
      d.innerHTML = await scr.render();
      expect(d.querySelector('.rota .harita')).toBeNull();
      expect(d.querySelector('.rota').textContent).toContain('Hareket ettikçe rota haritada çizilir');
      expect(d.querySelector('.rota input[data-change="rota-dosya"]')).toBeTruthy();
    });

    /* iPhone'un dosya seçicisi `accept`'i türlere çevirir; tanımadığı
       `.gpx` uzantısında dosya soluk görünür, seçilemez. Genel XML ve veri
       türleri de verilir; GPX olmayan dosyayı okuyucu zaten reddeder. */
    it('GPX seçicisi iPhone\'da dosyayı soluk bırakmaz: genel XML ve veri türlerini de kabul eder', async () => {
      resetState();
      const d = document.createElement('div');
      d.innerHTML = await scr.render();
      const kabul = d.querySelector('.rota input[data-change="rota-dosya"]').getAttribute('accept').split(',');
      ['.gpx', 'application/gpx+xml', 'application/xml', 'text/xml', 'application/octet-stream']
        .forEach(t => expect(kabul).toContain(t));
    });

    it('türü bilinmeyen rota tür seçilmeden kaydedilmez', async () => {
      resetState();
      const t = await sessiz(async () => {
        await sec(besKm());
        expect(kagit()).toBeTruthy();
        expect(kaydetDugmesi().disabled).toBe(true);
        await scr.handle['rota-kaydet']();
        expect(SP.S.workouts).toHaveLength(0);
        await scr.handle['rota-tur']({ dataset:{ value:'yuzme' } });
        expect(kaydetDugmesi().disabled).toBe(true);
        await scr.handle['rota-tur']({ dataset:{ value:'kosu' } });
        expect(kaydetDugmesi().disabled).toBe(false);
        await scr.handle['rota-kaydet']();
      });
      expect(SP.S.workouts).toHaveLength(1);
      expect(SP.S.workouts[0].items[0].exId).toBe('kosu');
      expect(SP.S.workouts[0].rota.mesafe).toBe(5000);
      expect(kagit()).toBeNull();
      expect(t).toContain('Rota eklendi');
    });

    it('tanınan tür seçili gelir', async () => {
      resetState();
      await sessiz(async () => { await sec(besKm({ tur:'cycling' })); });
      expect(kaydetDugmesi().disabled).toBe(false);
      expect(kagit().querySelector('[data-act="rota-tur"][data-value="bisiklet"]')
        .getAttribute('aria-pressed')).toBe('true');
      SP.UI.closeSheet();
    });

    it('aynı rota ikinci kez eklenmez', async () => {
      resetState();
      pushRota(besKm());
      const t = await sessiz(async () => { await sec(besKm()); });
      expect(kagit()).toBeNull();
      expect(t[0]).toContain('zaten kayıtlı');
      expect(SP.S.workouts).toHaveLength(1);
    });

    it('önizleme açıkken rota başka yoldan eklendiyse Kaydet ikinci kez eklemez', async () => {
      resetState();
      await sessiz(async () => {
        await sec(besKm({ tur:'running' }));
        pushRota(besKm());
        await scr.handle['rota-kaydet']();
      });
      expect(SP.S.workouts).toHaveLength(1);
      expect(kagit()).toBeNull();
    });

    it('bozuk ya da çok büyük dosya söylenir, kağıt açılmaz', async () => {
      resetState();
      const t = await sessiz(async () => {
        await sec('merhaba');
        await scr.change['rota-dosya']({ value:'', files:[{ name:'dev.gpx', size:26 * 1024 * 1024,
          text:async () => { throw new Error('okunmamalıydı'); } }] });
      });
      expect(kagit()).toBeNull();
      expect(t[0]).toBe('Bu bir GPX dosyası değil.');
      expect(t[1]).toContain('25 MB');
    });

    it('GPX adındaki işaretleme kaçışlanır', async () => {
      resetState();
      const w = pushRota(besKm({ ad:'<img src=x onerror=alert(1)>' }));
      await sessiz(async () => { await scr.handle['rota-ac']({ dataset:{ id:w.id } }); });
      expect(kagit().querySelector('.sheet__head img')).toBeNull();
      expect(kagit().querySelector('.sheet__head p').textContent).toContain('<img src=x');
      SP.UI.closeSheet();
    });

    /* Hata (2026-10-03): kağıdın gövdesi esnek sütundur; içerik taşınca
       kaydırma kabı olan tablo sarmalı (.tablewrap) 0 piksele büzülüyor,
       Dilimler başlığı görünüp tablo görünmüyordu. */
    it('ayrıntı kağıdında Dilimler tablosu büzülmez', async () => {
      resetState();
      const w = pushRota(besKm());
      await sessiz(async () => { await scr.handle['rota-ac']({ dataset:{ id:w.id } }); });
      const sheet = kagit().querySelector('.sheet');
      sheet.style.maxHeight = '420px';             /* gövde kesin taşsın */
      const tw = sheet.querySelector('.tablewrap');
      expect(tw).toBeTruthy();
      expect(tw.querySelectorAll('tbody tr')).toHaveLength(5);
      expect(tw.offsetHeight >= tw.scrollHeight - 1).toBe(true);
      expect(tw.offsetHeight > 100).toBe(true);
      const harita = sheet.querySelector('.harita'), profil = sheet.querySelector('.harita__profil');
      expect(harita.offsetHeight > 100).toBe(true);
      expect(profil.getBoundingClientRect().height > 40).toBe(true);
      /* Gövde kendi içinde kayar; içerik kırpılmaz. */
      const body = sheet.querySelector('.sheet__body');
      expect(body.scrollHeight > body.clientHeight).toBe(true);
      SP.UI.closeSheet();
    });

    it('Tümü listesi ve ısı haritası kağıtları açılır', async () => {
      resetState();
      pushRota(besKm());
      pushRota(gpx([hat(300, 10, 3, { t0:T0 + 86400e3 })]));
      pushRota(gpx([hat(300, 10, 3, { lat0:39.93, lon0:32.85, t0:T0 + 2 * 86400e3 })]));
      const d = document.createElement('div');
      d.innerHTML = await scr.render();
      expect(d.querySelector('[data-act="rota-isi"]')).toBeNull();
      await sessiz(async () => { await scr.handle['rota-tumu'](); });
      expect(kagit().querySelectorAll('[data-act="rota-ac"]')).toHaveLength(3);
      expect(kagit().querySelector('[data-act="rota-isi"]')).toBeTruthy();
      expect(kagit().querySelector('input[data-change="rota-dosya"]')).toBeTruthy();
      await sessiz(async () => { await scr.handle['rota-isi'](); });
      expect(kagit().querySelectorAll('polyline.harita__isi')).toHaveLength(2);
      expect(kagit().textContent).toContain('1 rota başka bir');
      SP.UI.closeSheet();
    });

    it('kağıttaki Sil seansı siler', async () => {
      resetState();
      const w = pushRota(besKm());
      const eski = SP.UI.confirmSheet;
      let onay = null;
      SP.UI.confirmSheet = (b, m, f) => { onay = f(); };
      try{
        await sessiz(async () => {
          await scr.handle['rota-ac']({ dataset:{ id:w.id } });
          const sil = kagit().querySelector('[data-act="del-session"]');
          await scr.handle['del-session'](sil);
          await onay;
        });
      }finally{ SP.UI.confirmSheet = eski; }
      expect(SP.S.workouts).toHaveLength(0);
      expect(kagit()).toBeNull();
    });
  });
})();
