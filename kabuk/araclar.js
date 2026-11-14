/* LIFEOS.Kabuk araç ekranları — Not, Tekrar ve Yol haritası listesi (sadeleşme Faz 2/3).
 * Kural motorlardadır (motor/not.js, motor/tekrar.js, motor/yol.js); burası çizer ve kaydeder.
 * Sayfalar Kabuk.ek[yerId](yer, alt) ile kaydolur; kabuk.js rota() onları çağırır. Bu dosya kabuk.js'ten ÖNCE yüklenir.
 * shortcut: kayıtlar bu tarayıcının deposunda durur (lifeos.not.kayit, lifeos.not.araclar, lifeos.tekrar.kartlar, lifeos.kayit.kayitlar, lifeos.plan.durum, lifeos.plan.sablon, lifeos.soru.*), cihazlar arası eşitlenmez; tek depoya (sistem/veri.py) P6 göçünden sonra bağlanır.
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.Arac, Node'da module.exports (yalnız saf kısım). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var HARF = 'ABCDEFGH';

  /* ---------------- saf ---------------- */
  function kimlik(onek, simdi, rast) { return onek + simdi.toString(36) + Math.floor(rast * 1679616).toString(36); }
  function notSira(a, b) { return (b.sabit - a.sabit) || (b.guncelleme - a.guncelleme) || (a.id < b.id ? -1 : 1); }

  // Formdan kayıt: yeni not ya da var olanın güncellenmişi. Geçersizse motorun Türkçe cümlesiyle hata fırlatır; liste değişmez.
  function notKaydet(Not, notlar, id, form, simdi, yeniId) {
    var baslik = String(form.baslik || '').trim(), govde = String(form.govde || '');
    var eski = notlar.filter(function (n) { return n.id === id; })[0];
    if (!eski) {
      return { id: yeniId, notlar: notlar.concat([Not.yeni({ id: yeniId, baslik: baslik, govde: govde, ozel: !!form.ozel, sabit: !!form.sabit, klasor: form.klasor || '', olusturma: simdi })]) };
    }
    var l = notlar;
    if (baslik !== eski.baslik) l = Not.yenidenAdlandir(l, id, baslik, simdi).notlar; // bu nota verilen bağların görünen adı da tazelenir
    l = l.map(function (n) {
      if (n.id !== id) return n;
      var y = Object.assign({}, n, { govde: govde, ozel: !!form.ozel, sabit: !!form.sabit, guncelleme: Math.max(simdi, n.guncelleme) });
      var h = Not.dogrula(y);
      if (h) throw new Error(h);
      return y;
    });
    return { id: id, notlar: l };
  }

  // «Yeni araç» ve sisteme not (Not.yeniArac): yeni araç ya da var olanın güncellenmişi. Geçersizse motorun cümlesiyle hata fırlatır.
  // Klasör yalnız oluştururken seçilir: King'e kapalı bir aracın klasörü sonradan değişseydi eski klasördeki notlar King'e açılırdı.
  function aracKaydet(Not, araclar, id, form, simdi, yeniId) {
    var eski = araclar.filter(function (a) { return a.id === id; })[0];
    var sn = { kingOkur: !!form.kingOkur, anlam: String(form.anlam || ''), kullanim: String(form.kullanim || '') };
    var a = eski ? Not.yeniArac(Object.assign({}, eski, { ad: String(form.ad || '').trim(), gorunum: form.gorunum || eski.gorunum, sistemNotu: sn, guncelleme: Math.max(simdi, eski.guncelleme) }))
      : Not.yeniArac({ id: yeniId, ad: String(form.ad || '').trim(), klasor: String(form.klasor || '').trim(), gorunum: form.gorunum || 'liste', sistemNotu: sn, olusturma: simdi });
    var ayni = araclar.filter(function (x) { return x.id !== a.id && x.klasor === a.klasor; })[0];
    if (ayni) throw new Error('Bu klasörü «' + ayni.ad + '» aracı kullanıyor; başka bir klasör adı yaz.');
    return { id: a.id, araclar: eski ? araclar.map(function (x) { return x.id === a.id ? a : x; }) : araclar.concat([a]) };
  }
  function aracNotlari(Not, notlar, arac) { return notlar.filter(function (n) { return Not.klasorde(n, arac.klasor); }); }

  // Yol'un tekrar adayları için eksik kartları ekler (kimlikle tekil); var olan karta dokunmaz. Kapı adayı
  // (Yol.kapiTekrarAdaylari) kaynağını taşır: alan, aşama, ünite, kapı. Taslaksa Tekrar motoru planlamaz.
  function kartlariEsitle(Tekrar, kartlar, adaylar, y) {
    var varMi = {};
    kartlar.forEach(function (k) { varMi[k.id] = true; });
    var ek = adaylar.filter(function (a) { return !varMi[a.id]; }).map(function (a) {
      var o = y.oge[a.id], ek = { icerik: a.icerik, on: o.soru, arka: o.sec[HARF.indexOf(o.dogru)], kaynak: a.kapi ? 'kapi' : 'yol' };
      if (a.kapi) { ek.alan = y.veri.alan; ek.asama = a.asama; ek.unite = a.unite; ek.kapi = a.kapi; }
      return Tekrar.yeniKart(a.id, ek);
    });
    return ek.length ? kartlar.concat(ek) : kartlar;
  }
  // Not ağının yerleşimi (Not.ag düğüm+kenar verir, yeri ekran seçer): halkadan başlayan basit kuvvet yerleşimi.
  // Saf ve belirlenimci (rastgele yok). Adım sayısı kalabalıkta düşer: 300 düğüm ~60 adım (n² itme).
  function agYerlesim(ag, en, boy) {
    var n = ag.dugum.length, pay = 24, ix = {}, p = ag.dugum.map(function (d, i) {
      ix[d.id] = i;
      var a = 2 * Math.PI * i / Math.max(1, n);
      return { id: d.id, x: en / 2 + (en / 2 - pay) * Math.cos(a), y: boy / 2 + (boy / 2 - pay) * Math.sin(a), dx: 0, dy: 0 };
    });
    if (n < 2) return p.map(function (q) { return { id: q.id, x: en / 2, y: boy / 2 }; });
    var k = Math.sqrt(en * boy / n) * 0.6, adim = n > 150 ? 60 : n > 50 ? 120 : 200, sicak = en / 8;
    for (var t = 0; t < adim; t++) {
      for (var i = 0; i < n; i++) { p[i].dx = 0; p[i].dy = 0; }
      for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
        var x = p[i].x - p[j].x, y = p[i].y - p[j].y, d2 = x * x + y * y || 0.01, f = k * k / d2;
        p[i].dx += x * f; p[i].dy += y * f; p[j].dx -= x * f; p[j].dy -= y * f;
      }
      ag.kenar.forEach(function (e) {
        var a = p[ix[e.a]], b = p[ix[e.b]], x = a.x - b.x, y = a.y - b.y, d = Math.sqrt(x * x + y * y) || 0.01, f = d / k;
        a.dx -= x * f; a.dy -= y * f; b.dx += x * f; b.dy += y * f;
      });
      p.forEach(function (q) {
        q.dx += (en / 2 - q.x) * 0.05; q.dy += (boy / 2 - q.y) * 0.05; // bağsız düğümler uzağa kaçmasın
        var d = Math.sqrt(q.dx * q.dx + q.dy * q.dy) || 1, s = Math.min(d, sicak);
        q.x += q.dx / d * s; q.y += q.dy / d * s;
      });
      sicak = Math.max(1, sicak * 0.96);
    }
    // kenara yığılmasın diye adımlarda sınır yok; sonunda çerçeveye sığdırılır (eksen başına ölçek)
    var sig = function (a, bas, son) {
      var en_ = Math.min.apply(null, p.map(function (q) { return q[a]; })), bo = Math.max.apply(null, p.map(function (q) { return q[a]; })) - en_;
      p.forEach(function (q) { q[a] = Math.round(bo < 1 ? (bas + son) / 2 : bas + (q[a] - en_) / bo * (son - bas)); });
    };
    sig('x', pay, en - pay); sig('y', pay, boy - pay);
    return p.map(function (q) { return { id: q.id, x: q.x, y: q.y }; });
  }
  function gunSonu(simdi) { var d = new Date(simdi); d.setHours(23, 59, 59, 999); return d.getTime(); }
  function gunAdi(simdi) { var d = new Date(simdi), iki = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate()); }
  // Bugünün kuyruğu: önce vadesi gelen tekrarlar, sonra yeni kartlar; sıra ve tavanlar motorun planından.
  function kuyruk(Tekrar, kartlar, simdi, yapilan) {
    var p = Tekrar.plan(kartlar, simdi, { gunSonu: gunSonu(simdi), yapilan: yapilan });
    return { sira: p.tekrar.concat(p.yeni), plan: p };
  }
  // Bir cevap: kartı günceller, günün sayacını artırır. Motor reddederse (taslak içerik) hiçbir şey değişmez.
  function kartCevapla(Tekrar, kartlar, id, not, simdi, sayac) {
    var k = kartlar.filter(function (x) { return x.id === id; })[0], r = k && Tekrar.cevapla(k, not, simdi);
    if (!r || !r.ok) return { kartlar: kartlar, sayac: sayac, ok: false, neden: r ? r.neden : 'kart yok' };
    var s = sayac && sayac.gun === gunAdi(simdi) ? { gun: sayac.gun, yeni: sayac.yeni, tekrar: sayac.tekrar } : { gun: gunAdi(simdi), yeni: 0, tekrar: 0 };
    s[k.durum === 'yeni' ? 'yeni' : 'tekrar']++;
    return { kartlar: kartlar.map(function (x) { return x.id === id ? r.kart : x; }), sayac: s, ok: true, gun: r.gun };
  }
  function aralikAdi(gun) { return gun === 0 ? 'şimdi' : gun < 30 ? gun + ' gün' : gun < 365 ? Math.round(gun / 30) + ' ay' : (Math.round(gun / 36.5) / 10) + ' yıl'; }

  /* ---- Kayıt (motor/kayit.js) ---- */
  // Formdan kayıt: boş bırakılan alan yollanmaz; «tahmin» işaretliyse sayılar tahmin etiketiyle gider (AGENTS §1.2).
  // Geçersizse motorun Türkçe cümleleri döner, liste değişmez.
  // bugun verilirse motorun geriye yazma penceresi uygulanır (gelecek ve Kayit.GERI_GUN'den eskisi reddedilir).
  function kayitEkle(Kayit, kayitlar, tur, form, tahmin, gun, zaman, bugun) {
    var t = Kayit.TURLER[tur], girdi = {};
    if (!t) return { ok: false, hatalar: ['Bilinmeyen kayıt türü.'] };
    Object.keys(t.sayilar || {}).forEach(function (a) {
      var v = form[a] == null ? '' : String(form[a]).trim();
      if (v) girdi[a] = tahmin ? { v: v, k: 'estimated' } : v;
    });
    Object.keys(t.metinler || {}).forEach(function (a) {
      var v = form[a] == null ? '' : String(form[a]).trim();
      if (v) girdi[a] = v;
    });
    var bag = { gun: gun, zaman: zaman, mevcut: kayitlar };
    if (bugun) bag.bugun = bugun;
    var r = Kayit.kaydet(tur, girdi, bag);
    return r.ok ? { ok: true, kayit: r.kayit, kayitlar: kayitlar.concat([r.kayit]) } : { ok: false, hatalar: r.hatalar };
  }
  function sayiYaz(v) { return String(Math.round(v * 100) / 100).replace('.', ','); }
  // Günün özeti: yalnız verisi olan satırlar; her sayı kesinlik etiketiyle. Eksik veri sıfır diye gösterilmez.
  // Bir günün (Kayit.gunluk) satırları, verisi olsun olmasın: { id, ad, d: {v, k}, birim }. Ölçümler yalnız o gün kaydı varsa.
  function gunSatirlari(Kayit, g) {
    var l = [], s = function (id, ad, d, birim) { l.push({ id: id, ad: ad, d: d, birim: birim }); };
    s('su', 'Su', g.su, 'ml');
    s('gece', 'Gece uykusu', g.uyku.gece, 'saat');
    s('kestirme', 'Kısa uyku', g.uyku.kestirmeDk, 'dk');
    s('hareket', 'Hareket', g.hareket.dk, 'dk');
    s('calisma', 'Çalışma', g.calisma.dk, 'dk');
    s('ogun', 'Öğün', g.ogun.sayi, '');
    s('kcal', 'Enerji (öğünlerden)', g.ogun.kcal, 'kcal');
    s('enerji', 'Enerji ve ruh hâli', g.enerji, '/ 5');
    s('mola', 'Mola', g.mola, 'dk');
    Object.keys(g.olcum).forEach(function (t) {
      var tablo = Kayit.TURLER[t].sayilar;
      Object.keys(g.olcum[t]).forEach(function (a) { s(t + '.' + a, tablo[a].ad, g.olcum[t][a], tablo[a].birim); });
    });
    return l;
  }
  function birimli(v, birim) { return sayiYaz(v) + (birim ? ' ' + birim : ''); }
  // Günün özeti: yalnız verisi olan satırlar; her sayı kesinlik etiketiyle. Eksik veri sıfır diye gösterilmez.
  function gunOzeti(Kayit, kayitlar, gun) {
    return gunSatirlari(Kayit, Kayit.gunluk(kayitlar, gun)).filter(function (x) { return x.d && x.d.v != null; })
      .map(function (x) { return { ad: x.ad, metin: birimli(x.d.v, x.birim), etiket: Kayit.ETIKET[x.d.k] }; });
  }
  // Geriye yazılabilen günler: bugün ve motorun penceresi kadar geri (Kayit.GERI_GUN); gelecek yok.
  function kayitGunleri(Kayit, bugun) {
    var l = [];
    for (var i = 0; i <= Kayit.GERI_GUN; i++) l.push(Kayit.yardimci.gunEkle(bugun, -i));
    return l;
  }
  /* Haftalık özet (Kayit.haftalik): tür başına yedi günlük satır; veri olmayan gün null (ekranda nokta, sıfır değil).
     Satırın bütün sayıları aynı etiketi taşıyorsa etiket satırda bir kez (etiket), yoksa her hücrede. Yalnız en az bir günü dolu satırlar. */
  function haftaOzeti(Kayit, kayitlar, bitis) {
    var h = Kayit.haftalik(kayitlar, bitis), E = Kayit.ETIKET, sira = [], satir = {};
    h.gunler.forEach(function (g, i) {
      gunSatirlari(Kayit, g).forEach(function (x) {
        if (!x.d || x.d.v == null) return;
        if (!satir[x.id]) { satir[x.id] = { ad: x.ad, birim: x.birim, hucreler: [null, null, null, null, null, null, null] }; sira.push(x.id); }
        satir[x.id].hucreler[i] = { v: x.d.v, metin: sayiYaz(x.d.v), etiket: E[x.d.k] };
      });
    });
    var satirlar = sira.map(function (id) {
      var s = satir[id], et = {};
      s.hucreler.forEach(function (c) { if (c) et[c.etiket] = 1; });
      s.etiket = Object.keys(et).length === 1 ? Object.keys(et)[0] : null;
      return s;
    });
    var toplam = [], ekle = function (ad, d, birim, ort) {
      if (d && d.v != null) toplam.push({ ad: ad, metin: birimli(d.v, birim) + (ort ? ' · ' + d.gun + ' günün ortalaması' : d.gun ? ' · ' + d.gun + ' gün' : ''), etiket: E[d.k] });
    };
    ekle('Gece uykusu', h.uykuOrt, 'saat', true);
    ekle('Su', h.suOrt, 'ml', true);
    ekle('Enerji ve ruh hâli', h.enerjiOrt, '/ 5', true);
    ekle('Hareket', h.hareketDk, 'dk');
    ekle('Hareket yükü', h.yuk, '');
    ekle('Çalışma', h.calismaDk, 'dk');
    ekle('Son tartı', h.kilo, 'kg');
    return { bas: h.bas, bitis: h.bitis, gunler: h.gunler.map(function (g) { return g.gun; }), veriGunu: h.veriGunu, satirlar: satirlar, toplam: toplam };
  }
  /* Toparlanma ve yük (Kayit.Kural), motorun döndürdüğü gibi: sayılar etiketli, eksik girdi adıyla, veri yoksa motorun cümlesi.
     Teşhis ve doz dili yok (AGENTS §1.5): yalnız kuralın sonucu ve gerekçesi. */
  var BANT = { high: 'Yüksek', ok: 'İyi', mid: 'Orta', low: 'Düşük', rest: 'Dinlenme' }, BOLGE = { low: 'düşük', ok: 'dengeli', high: 'yüksek' };
  function yukOzeti(Kayit, kayitlar, gun) {
    var K = Kayit.Kural, E = Kayit.ETIKET, sat = [], not = [];
    var r = K.toparlanma(kayitlar, gun), a = K.akutKronik(kayitlar, gun), b = K.haftalikBuyume(kayitlar, gun), dl = K.indirmeHaftasi(kayitlar, gun);
    if (r.ok) {
      sat.push({ ad: 'Toparlanma puanı', metin: r.puan.v + ' / 100 · ' + BANT[r.bant.id].toLocaleLowerCase('tr'), etiket: E[r.puan.k] });
      if (r.eksik.length) not.push('Toparlanma ' + r.parcalar.filter(function (p) { return p.puan != null; }).map(function (p) { return p.ad; }).join(', ') + ' kaydından; eksik: ' + r.eksik.join(', ') + '.' + (r.ince ? ' Ölçüm ince: yük artırılmaz.' : ''));
    } else not.push('Bugün toparlanma için kayıt yok (uyku, nabız değişkenliği (HRV), istirahat nabzı ya da enerji); toparlanma puanı hesaplanmadı.');
    if (r.bayrak) not.push(r.bayrak === 'ates' ? 'Ateş kaydı ' + sayiYaz(K.ATES_ESIK) + ' °C ya da üstünde: kural bugünü dinlenme günü sayar.' : 'Oksijen kaydı %' + K.SPO2_ESIK + ' altında: kural bugünü dinlenme günü sayar.');
    if (a.ok) sat.push({ ad: 'Son hafta / son ' + a.kronikGun + ' gün yükü', metin: sayiYaz(a.oran.v) + ' · ' + BOLGE[a.bolge], etiket: E[a.oran.k] });
    else not.push(a.neden);
    if (b.ok) {
      sat.push({ ad: 'Haftalık yük değişimi', metin: (b.buyume.v >= 0 ? '+' : '') + '%' + Math.round(b.buyume.v * 100), etiket: E[b.buyume.k] });
      sat.push({ ad: 'Bu haftaya en çok yük', metin: sayiYaz(b.enCok.v), etiket: E[b.enCok.k] });
      if (b.asti) not.push('Bu haftanın yükü geçen haftadan %' + Math.round(K.YUK.buyume * 100) + '\'dan fazla arttı; kural sınırı aşıldı.');
    } else not.push('Geçen hafta yükü bilinen seans yok; haftalık yük tavanı hesaplanmaz.');
    if (b.dkEnCok.v != null) sat.push({ ad: 'Bu haftaya en çok hareket süresi', metin: sayiYaz(b.dkEnCok.v) + ' dk', etiket: E[b.dkEnCok.k] });
    if (dl.basladi) not.push(dl.due ? 'Bu hafta indirme haftası (' + K.YUK.indirmeHafta + ' haftada bir): yük en çok ' + sayiYaz(dl.carpan) + ' katına iner.'
      : 'Antrenman döngüsünün ' + dl.dongude + '. haftası; indirme ' + K.YUK.indirmeHafta + '. haftada.');
    return { satirlar: sat, notlar: not };
  }
  /* Kural satırları (Kayit.Kural, SPİ'nin güvenlik sınırlarıyla): enerji hedefi ve günün antrenman kararı.
     profil: Ayarlar › Beden (cinsiyet, boy, doğum yılı, hedef); kilo son tartıdan. Eksik girdi adıyla söylenir. */
  var EMIR = { full: 'Tam yük', reduced: 'Azaltılmış yük', light: 'Hafif', rest: 'Dinlenme' };
  function kuralOzeti(Kayit, kayitlar, gun, profil, yil) {
    var K = Kayit.Kural, E = Kayit.ETIKET, l = [], eksik = null;
    var e = K.enerjiHedefi(profil, kayitlar, gun, yil);
    if (e.deger && e.deger.v != null) {
      l.push({ ad: 'Enerji hedefi', metin: sayiYaz(e.deger.v) + ' kcal' + (e.bmrTaban ? ' (bazal tabanı)' : ''), etiket: E[e.deger.k] });
      l.push({ ad: 'Bazal metabolizma', metin: sayiYaz(e.bmr.v) + ' kcal', etiket: E[e.bmr.k] });
    } else eksik = e.eksik;
    var g = K.gununEmri(kayitlar, gun), veriYok = g.gerekce.indexOf('veri-yok') >= 0;
    if (!veriYok) l.push({ ad: 'Bugünkü antrenman', metin: EMIR[g.tur] + ' · yük oranı %' + Math.round(g.carpan.v * 100), etiket: E[g.carpan.k] });
    return { satirlar: l, eksik: eksik, emirVeriYok: veriYok };
  }
  // Bir kaydın tek satırlık okunuşu: «Su · 500 ml (ölçüldü)»
  function kayitMetni(Kayit, r) {
    var t = Kayit.TURLER[r.tur], p = [];
    Object.keys(r.deger || {}).forEach(function (a) { var f = t.sayilar[a]; p.push(sayiYaz(r.deger[a].v) + (f.birim && f.birim !== '1-5' ? ' ' + f.birim : '') + ' (' + Kayit.ETIKET[r.deger[a].k] + ')'); });
    Object.keys(r.ek || {}).forEach(function (a) { p.push(r.ek[a]); });
    return t.ad + ' · ' + p.join(' · ');
  }

  /* ---- Plan (motor/plan.js) ---- */
  // durum: { ayar: { musait: [{bas, bit}], gunlukDakika? }, isler: [{id, ad, dk, son?}], gunPlan: { gun, plan } | null }
  function planBos() { return { ayar: { musait: [] }, isler: [], gunPlan: null }; }
  // Günün planını kurar; aynı günün planı varsa ilerlemesi başlamış bloklar yerinde kalır (Plan.yenidenKur).
  // ek: { dersler: [{id, ad, dk}], tekrar: Tekrar.plan() çıktısı }. Sıra, mola ve sığmayanlar motorun kuralıdır.
  function planKur(Plan, durum, gun, ek) {
    var girdi = { gun: gun, bugun: gun, musait: durum.ayar.musait, isler: durum.isler, dersler: (ek && ek.dersler) || [], tekrar: ek && ek.tekrar,
      sabitler: sabitlerGunu(ek && ek.sablon, Plan.yardimci.haftaGunu(gun)) };
    if (durum.ayar.gunlukDakika) girdi.gunlukDakika = durum.ayar.gunlukDakika;
    var eski = durum.gunPlan && durum.gunPlan.gun === gun ? durum.gunPlan.plan : null;
    return eski ? Plan.yenidenKur(eski, girdi) : Plan.gunPlani(girdi);
  }
  // Gün değiştiyse: yapılan işler listeden çıkar, bitmeyenler motorun devir kuralıyla (kalan süre, devir sayısı) kalır, eski plan silinir.
  function planGunDevri(Plan, durum, gun) {
    if (!durum.gunPlan || durum.gunPlan.gun >= gun) return durum;
    var devir = {}, yapilan = {};
    Plan.devret(durum.gunPlan.plan).forEach(function (x) { devir[x.id] = x; });
    durum.gunPlan.plan.bloklar.forEach(function (b) { if (b.tur === 'is' && b.durum === 'yapildi') yapilan[b.kaynakId || b.id] = true; });
    return { ayar: durum.ayar, gunPlan: null, isler: durum.isler.filter(function (x) { return !yapilan[x.id] || devir[x.id]; }).map(function (x) {
      return devir[x.id] ? Object.assign({}, x, { dk: devir[x.id].dk, devir: devir[x.id].devir }) : x;
    }) };
  }
  // Yeni iş ya da boş zaman aralığı: geçerliliğe motor karar verir (aynı cümleler); geçersizse durum değişmez.
  function planEkle(Plan, durum, ne, veri, gun) {
    var aday = ne === 'is' ? { gun: gun, musait: [], isler: durum.isler.concat([veri]) } : { gun: gun, musait: durum.ayar.musait.concat([veri]) };
    var r = Plan.gunPlani(aday);
    if (!r.ok) return { ok: false, hatalar: r.hatalar };
    return { ok: true, durum: ne === 'is' ? { ayar: durum.ayar, gunPlan: durum.gunPlan, isler: aday.isler }
      : { ayar: Object.assign({}, durum.ayar, { musait: aday.musait.slice().sort(function (a, b) { return a.bas < b.bas ? -1 : 1; }) }), isler: durum.isler, gunPlan: durum.gunPlan } };
  }
  // Hafta şablonu: sahibin sabit blokları bir kez yazılır, her hafta kullanılır. sablon: { sabitler: [{id, ad, bas, bit, gunler: [0..6]}] }, 0 = Pazartesi.
  // Bir haftanın gününün sabitleri (motorun `sabitler` girdisi). Gece yarısını geçen blok (Uyku 23:00–07:00) ikiye bölünür:
  // akşamı o gün 23:59'a kadar, sabahı ertesi gün 00:00'dan (motor tek günde bit > bas ister).
  function sabitlerGunu(sablon, hg) {
    var l = [];
    ((sablon && sablon.sabitler) || []).forEach(function (s) {
      var gece = s.bit < s.bas;
      if (s.gunler.indexOf(hg) >= 0) l.push({ id: s.id + ':' + hg, ad: s.ad, bas: s.bas, bit: gece ? '23:59' : s.bit });
      if (gece && s.bit !== '00:00' && s.gunler.indexOf((hg + 6) % 7) >= 0) l.push({ id: s.id + ':' + hg + ':sabah', ad: s.ad, bas: '00:00', bit: s.bit });
    });
    return l.sort(function (a, b) { return a.bas < b.bas ? -1 : a.bas > b.bas ? 1 : 0; });
  }
  // Yeni sabit blok: ad ve en az bir gün kabukta, saatlerin geçerliliği motorda (aynı cümle). Geçersizse şablon değişmez.
  function sabitEkle(Plan, sablon, veri, gun) {
    var ad = String(veri.ad || '').trim(), s = { id: veri.id, ad: ad, bas: veri.bas, bit: veri.bit, gunler: (veri.gunler || []).slice().sort() };
    if (!ad) return { ok: false, hatalar: ['Sabit bloğun adı yazılmalı.'] };
    if (!s.gunler.length) return { ok: false, hatalar: ['En az bir gün seçilmeli.'] };
    for (var hg = 0; hg < 7; hg++) {
      var r = Plan.gunPlani({ gun: gun, musait: [], sabitler: sabitlerGunu({ sabitler: [s] }, hg) });
      if (!r.ok) return { ok: false, hatalar: r.hatalar };
    }
    return { ok: true, sablon: { sabitler: ((sablon && sablon.sabitler) || []).concat([s]) } };
  }
  // Bugünden başlayan yedi gün: her güne boş zaman ve o haftagününün sabitleri; işler, dersler ve devir motorun haftaPlani'nden.
  // Bugün yapılmış işler öngörüye girmez. Tekrar yalnız bugün bilinir (ertesi günlerin vadesi cevaplara bağlı).
  function haftaKur(Plan, durum, sablon, bugun, ek) {
    var Y = Plan.yardimci, gunler = [], bitti = {};
    if (durum.gunPlan && durum.gunPlan.gun === bugun) durum.gunPlan.plan.bloklar.forEach(function (b) { if (b.tur === 'is' && b.durum === 'yapildi') bitti[b.kaynakId || b.id] = true; });
    for (var i = 0; i < 7; i++) {
      var g = { musait: durum.ayar.musait, sabitler: sabitlerGunu(sablon, Y.haftaGunu(Y.gunEkle(bugun, i))) };
      if (durum.ayar.gunlukDakika) g.gunlukDakika = durum.ayar.gunlukDakika;
      if (i === 0 && ek && ek.tekrar) g.tekrar = ek.tekrar;
      gunler.push(g);
    }
    return Plan.haftaPlani({ bas: bugun, bugun: bugun, gunler: gunler, dersler: (ek && ek.dersler) || [],
      isler: durum.isler.filter(function (x) { return !bitti[x.id]; }) });
  }

  /* ---- Soru (motor/soru.js) ---- */
  // Bir alanın karma test havuzu: seçmeli alıştırmalar; konu = ders (aynı dersten iki soru ard arda gelmesin diye).
  // sozluk: { id: soru } (soruya `konu` ders adı olarak eklenir; içerik değişmez). Yalnız açık ünitelerin soruları girer.
  function soruHavuzu(Yol, y, kayit) {
    var havuz = [], sozluk = {};
    y.veri.uniteler.forEach(function (u) {
      if (!Yol.acikMi(y, kayit, u.id)) return;
      u.dersler.forEach(function (ders) {
        ders.alistirmalar.forEach(function (a) {
          if (a.tur !== 'secmeli') return;
          havuz.push({ id: a.id, konu: ders.id });
          sozluk[a.id] = Object.assign({}, a, { konu: ders.ad });
        });
      });
    });
    return { havuz: havuz, sozluk: sozluk };
  }
  // Oturumda sıradaki cevapsız sorunun sırası; hepsi cevaplandıysa -1.
  function soruSirasi(oturum) {
    for (var i = 0; i < oturum.sorular.length; i++) if (!oturum.cevaplar[i]) return i;
    return -1;
  }

  /* ---- Başlangıç paketi (tools/kabuk_baslangic.py): eski sistemdeki not, kayıt ve kartlar ---- */
  // Paketi var olan listelere kimlikle ekler: var olan kimliğe dokunmaz (iki kez getirmek zararsız), motorun
  // kabul etmediği kaydı almaz. Girdi değişmez; dönen: yeni listeler ve sayılar.
  function baslangicBirlestir(Not, Kayit, mevcut, paket) {
    var say = { not: 0, kayit: 0, kart: 0, atlanan: 0 };
    var ekle = function (liste, gelen, ad, gecerli) {
      var varMi = {}, yeni = liste.slice();
      liste.forEach(function (x) { varMi[x.id] = true; });
      (Array.isArray(gelen) ? gelen : []).forEach(function (x) {
        if (!x || typeof x.id !== 'string' || varMi[x.id] || !gecerli(x)) { say.atlanan++; return; }
        varMi[x.id] = true; yeni.push(x); say[ad]++;
      });
      return yeni;
    };
    return {
      notlar: ekle(mevcut.notlar || [], paket.notlar, 'not', function (n) { return !Not.dogrula(n); }),
      kayitlar: ekle(mevcut.kayitlar || [], paket.kayitlar, 'kayit', function (r) { return !!Kayit.TURLER[r.tur] && typeof r.gun === 'string' && r.deger && typeof r.deger === 'object'; }),
      kartlar: ekle(mevcut.kartlar || [], paket.kartlar, 'kart', function (k) { return typeof k.on === 'string' && !!k.on.trim() && typeof k.arka === 'string' && !!k.arka.trim(); }),
      say: say
    };
  }
  // Eski profil → Ayarlar › Beden: yalnız hâlâ varsayılanda duran ayar yazılır (kullanıcının girdiği kalır); değer şemadan geçer.
  function baslangicBeden(Ayar, depo, beden) {
    var n = 0;
    Object.keys(beden || {}).forEach(function (a) {
      var anahtar = 'lifeos.beden.' + a, t = Ayar.tanim(anahtar);
      if (!t || beden[a] == null || Ayar.oku(depo, anahtar) !== t.varsayilan) return;
      if (Ayar.yaz(depo, anahtar, beden[a])) n++;
    });
    return n;
  }
  function baslangicMetni(say) {
    var p = [];
    if (say.notlar || say.not) p.push((say.notlar || say.not) + ' not');
    if (say.kayitlar || say.kayit) p.push((say.kayitlar || say.kayit) + ' kayıt');
    if (say.kartlar || say.kart) p.push((say.kartlar || say.kart) + ' kart');
    return p.join(', ');
  }

  var Arac = { kimlik: kimlik, baslangicBirlestir: baslangicBirlestir, baslangicBeden: baslangicBeden, baslangicMetni: baslangicMetni, soruHavuzu: soruHavuzu, soruSirasi: soruSirasi, planBos: planBos, planKur: planKur, planGunDevri: planGunDevri, planEkle: planEkle, sabitlerGunu: sabitlerGunu, sabitEkle: sabitEkle, haftaKur: haftaKur, kayitEkle: kayitEkle, gunOzeti: gunOzeti, kayitGunleri: kayitGunleri, haftaOzeti: haftaOzeti, yukOzeti: yukOzeti, kuralOzeti: kuralOzeti, kayitMetni: kayitMetni, notSira: notSira, notKaydet: notKaydet, aracKaydet: aracKaydet, aracNotlari: aracNotlari, kartlariEsitle: kartlariEsitle, agYerlesim: agYerlesim, gunSonu: gunSonu, gunAdi: gunAdi,
    kuyruk: kuyruk, kartCevapla: kartCevapla, aralikAdi: aralikAdi };
  Kabuk.Arac = Arac;
  if (typeof module !== 'undefined' && module.exports) module.exports = Arac;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, Not = L.Motor && L.Motor.Not, Tekrar = L.Motor && L.Motor.Tekrar, B = Kabuk.Bilesen;
  var NOT_ANAHTAR = 'lifeos.not.kayit', KART_ANAHTAR = 'lifeos.tekrar.kartlar', SAYAC_ANAHTAR = 'lifeos.tekrar.bugun';
  var ic = function () { return Kabuk.ic; }; // kabuk.js sonra yüklenir; çizim anında hazırdır
  function oku(anahtar, bos) {
    try { var v = JSON.parse(ic().depo.getItem(anahtar)); if (v && typeof v === 'object' && Array.isArray(v) === Array.isArray(bos)) return v; } catch (e) { /* bozuk kayıt: boş başla */ }
    return bos;
  }
  function yaz(anahtar, v) { ic().depo.setItem(anahtar, JSON.stringify(v)); }
  function tarih(ms) { return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function eksik(ad) { return B.bos({ baslik: ad + ' aracı yüklenemedi.', metin: 'Sayfayı yenile; sürerse LifeOS sunucusundan aç.' }); }

  /* ---- Not ---- */
  var notDurum = null; // { id, metin, hata? }: son kaydın iletisi, yalnız hemen ardından gösterilir
  // not satırı (B.liste öğesi): ad, tarih ve etiketler ya da arama parçası; özel/sabit rozeti
  function notSatiri(n, parca) {
    var et = Not.etiketleri(n);
    return { ad: Not.ad(n) || 'Adsız not', href: '#/motor/not/' + n.id, not: parca || tarih(n.guncelleme) + (et.length ? ' · ' + et.map(function (e) { return '#' + e; }).join(' ') : ''),
      pul: n.ozel ? 'özel' : n.sabit ? { metin: 'sabit', tur: 'altin' } : null };
  }
  function notListesi(notlar, sorgu) {
    if (!notlar.length) return B.bos({ baslik: 'Henüz not yok.', metin: '«Yeni not» ile ilkini yaz; bir satır yeter, sonra büyütürsün.' });
    if (!sorgu.trim()) return B.liste({ ad: 'Notlar', ogeler: notlar.slice().sort(notSira).map(function (n) { return notSatiri(n); }) });
    var harita = {}; notlar.forEach(function (n) { harita[n.id] = n; });
    var s = Not.ara(notlar, sorgu, { sinir: 50 });
    return s.length ? B.liste({ ad: 'Arama sonuçları', ogeler: s.map(function (x) { return notSatiri(harita[x.id], x.parca); }) }) : B.bos({ baslik: 'Bu aramaya uyan not yok.', metin: 'Başka bir sözcük dene ya da aramayı silip bütün notlara dön.' });
  }
  // Not ağı: Not.ag verisi SVG'ye çizilir; düğüm bağlantıdır (Sekme ile gezilir, Enter notu açar). Renkler kabuk.css tokenlarından.
  var AG_EN = 640, AG_BOY = 400;
  var AG_TUR = { bag: 'duz', etiket: 'kesik', celiski: 'kalin' };
  function notAgi(notlar) {
    var ag = Not.ag(notlar), n = ag.dugum.length, yer = {};
    if (n < 2) return '';
    agYerlesim(ag, AG_EN, AG_BOY).forEach(function (q) { yer[q.id] = q; });
    var bagli = ag.dugum.filter(function (d) { return d.derece; }).length;
    return B.bolum({ baslik: 'Not ağı', id: 'ag-baslik', veri: { 'not-ag': '' }, govde: B.ag({ ad: 'Not ağı: ' + n + ' not, ' + ag.kenar.length + ' bağ', en: AG_EN, boy: AG_BOY,
      dugumler: ag.dugum.map(function (d) {
        return { id: d.id, ad: d.ad, x: yer[d.id].x, y: yer[d.id].y, r: Math.min(12, 6 + d.derece), href: '#/motor/not/' + d.id, etiket: d.ad + (d.derece ? ', ' + d.derece + ' bağ' : ', bağsız') };
      }),
      kenarlar: ag.kenar.map(function (e) { return { a: e.a, b: e.b, tur: AG_TUR[e.tur] || 'duz' }; }),
      ozet: n + ' not · ' + ag.kenar.length + ' bağ · ' + (n - bagli) + ' bağsız', aciklama: { duz: 'bağ', kesik: 'aynı etiket', kalin: 'çelişki' } }) });
  }
  /* ---- Araçlar ve sisteme not (Not.yeniArac, Not.kingAraclar) ---- */
  var ARAC_ANAHTAR = 'lifeos.not.araclar', aracDurum = null; // aracDurum: { id, metin, form? } son kaydın iletisi
  function kingPul(a) { return a.sistemNotu.kingOkur ? { metin: 'King okur', tur: 'altin' } : 'King okumaz'; }
  function aracSatiri(a, notlar) {
    return { ad: a.ad, href: '#/motor/not/arac/' + a.id, not: a.klasor + ' · ' + aracNotlari(Not, notlar, a).length + ' not · ' + (a.gorunum === 'ag' ? 'ağ' : 'liste'), pul: kingPul(a) };
  }
  function sayfaArac(yer, alt) {
    var I = ic(), k = I.kac, araclar = oku(ARAC_ANAHTAR, []), notlar = oku(NOT_ANAHTAR, []);
    var parca = alt.split('/'), id = parca[1], duzenle = id === 'yeni' || parca[2] === 'duzenle';
    var a = araclar.filter(function (x) { return x.id === id; })[0];
    var geri = function (son) {
      return '<a class="kirinti" href="#/motor/not"><span aria-hidden="true">‹ </span>Not</a><span class="kirinti__ayrac" aria-hidden="true">/</span>' +
        (a && duzenle ? '<a class="kirinti" href="#/motor/not/arac/' + k(a.id) + '">' + k(a.ad) + '</a><span class="kirinti__ayrac" aria-hidden="true">/</span>' : '') + '<span>' + k(son) + '</span>';
    };
    if (id !== 'yeni' && !a) return I.ust(geri('Araç')) + '<div class="govde">' + B.bos({ baslik: 'Bu araç bulunamadı.', metin: 'Başka bir cihazda oluşturulmuş olabilir.', eylem: { metin: 'Notlara dön', tur: 'ana', href: '#/motor/not' } }) + '</div>';
    if (!duzenle) {
      var sn = a.sistemNotu, l = aracNotlari(Not, notlar, a);
      var metin = function (x) { return x ? '<p>' + k(x) + '</p>' : '<p class="soluk">Yazılmadı.</p>'; };
      return I.ust(geri(a.ad)) + '<div class="govde" data-arac="not" data-arac-sayfa>' + B.baslik({ metin: a.ad }) +
        B.panel({ baslik: 'Sisteme not', id: 'sn-baslik', tur: 'guclu', veri: { sistemnot: '' }, govde: ['<p>' + B.pul(kingPul(a)) + '</p>',
          B.acilir({ baslik: 'King bundan ne anlamalı', duzey: 3, acik: true, govde: metin(sn.anlam) }), B.acilir({ baslik: 'King bunu nasıl kullanmalı', duzey: 3, acik: true, govde: metin(sn.kullanim) }),
          '<p class="soluk">' + (sn.kingOkur ? 'King bu aracın notlarını (özel olanlar hariç) ve bu notu okur.' : 'King bu aracın notlarını ve bu notu okumaz.') + '</p>'] }) +
        B.eylemler([{ metin: 'Bu araçta yeni not', tur: 'ana', href: '#/motor/not/yeni?arac=' + a.id }, { metin: 'Aracı düzenle', tur: 'sade', href: '#/motor/not/arac/' + a.id + '/duzenle' }]) +
        (l.length ? B.liste({ ad: a.ad + ' notları', ogeler: l.slice().sort(notSira).map(function (n) { return notSatiri(n); }) }) : B.bos({ baslik: 'Bu araçta henüz not yok.', metin: 'Yukarıdaki «Bu araçta yeni not» ile ekle; notları «' + a.klasor + '» klasöründe durur.' })) +
        (a.gorunum === 'ag' ? notAgi(l) : '') + '</div>';
    }
    var dr = aracDurum && aracDurum.id === id ? aracDurum : null; aracDurum = null;
    var f = dr && dr.form || (a ? { ad: a.ad, klasor: a.klasor, gorunum: a.gorunum, kingOkur: a.sistemNotu.kingOkur, anlam: a.sistemNotu.anlam, kullanim: a.sistemNotu.kullanim }
      : { ad: '', klasor: '', gorunum: 'liste', kingOkur: false, anlam: '', kullanim: '' }); // King okuma izni varsayılan kapalı (Not.yeniArac)
    return I.ust(geri(a ? 'Düzenle' : 'Yeni araç')) + '<div class="govde" data-arac="not">' + B.baslik({ metin: a ? 'Aracı düzenle' : 'Yeni araç' }) +
      '<form class="aracform" data-arac-id="' + k(id) + '" novalidate>' + (dr ? B.uyari({ tur: 'hata', metin: dr.metin }) : '') +
      B.alan({ ad: 'Ad', isim: 'ad', deger: f.ad, enCok: 60 }) +
      B.alan({ ad: 'Klasör' + (a ? ' · oluştururken seçilir, değişmez' : ' · boş bırakırsan adı'), isim: 'klasor', deger: f.klasor, enCok: 120, salt: !!a }) +
      B.alan({ ad: 'Görünüm', isim: 'gorunum', tur: 'radyo', secenekler: { liste: 'Liste', ag: 'Ağ' }, deger: f.gorunum === 'ag' ? 'ag' : 'liste' }) +
      B.panel({ baslik: 'Sisteme not', id: 'sn-form', tur: 'guclu', govde: ['<p class="soluk">King\'e bu araç hakkında bıraktığın not. King yalnız izin verirsen okur; özel notlar her durumda kapalı kalır.</p>',
        B.alan({ ad: 'King okuyabilsin', isim: 'kingOkur', tur: 'onay', deger: !!f.kingOkur }),
        B.alan({ ad: 'King bundan ne anlamalı?', isim: 'anlam', tur: 'cok', enCok: 1000, deger: f.anlam, yerTutucu: 'Aklıma gelen fikirleri buraya atıyorum.' }),
        B.alan({ ad: 'King bunu nasıl kullanmalı?', isim: 'kullanim', tur: 'cok', enCok: 1000, deger: f.kullanim, yerTutucu: 'Yalnız birbirine bağlamak için oku, hakkımda çıkarım yapma.' })] }) +
      B.eylemler([{ metin: a ? 'Kaydet' : 'Oluştur', tur: 'ana', tip: 'submit' }, { metin: 'Vazgeç', tur: 'sade', href: a ? '#/motor/not/arac/' + a.id : '#/motor/not' }]) + '</form></div>';
  }
  function aracFormKaydet(form) {
    var id = form.getAttribute('data-arac-id'), simdi = Date.now(), e = form.elements, g = form.querySelector('input[name=gorunum]:checked');
    var veri = { ad: e.ad.value, klasor: e.klasor.value, gorunum: g ? g.value : 'liste', kingOkur: e.kingOkur.checked, anlam: e.anlam.value, kullanim: e.kullanim.value };
    try {
      var r = aracKaydet(Not, oku(ARAC_ANAHTAR, []), id, veri, simdi, kimlik('a', simdi, Math.random()));
      yaz(ARAC_ANAHTAR, r.araclar);
      ic().git('#/motor/not/arac/' + r.id);
    } catch (x) {
      aracDurum = { id: id, metin: x.message, form: veri }; // yazılan kaybolmasın
      ic().rota();
      var il = d.querySelector('.aracform .b-uyari'); if (il) il.focus();
    }
  }
  function sayfaNot(yer, alt) {
    var I = ic(), k = I.kac;
    if (!Not) return I.ust(I.kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: 'Not' }) + eksik('Not') + '</div>';
    if (alt.indexOf('arac/') === 0) return sayfaArac(yer, alt);
    var notlar = oku(NOT_ANAHTAR, []);
    if (!alt) {
      var araclar = oku(ARAC_ANAHTAR, []);
      return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="not">' + B.baslik({ metin: 'Not', eylem: { metin: 'Yeni not', tur: 'ana', href: '#/motor/not/yeni' } }) +
        B.alan({ ad: 'Notlarda ara', isim: 'notAra', tur: 'arama', yerTutucu: '#etiket de olur', veri: { 'not-ara': '' } }) +
        '<div id="not-liste" aria-live="polite">' + notListesi(notlar, '') + '</div>' +
        '<p class="soluk">' + notlar.length + ' not · bu cihazda durur</p>' +
        B.bolum({ baslik: 'Araçlar', id: 'araclar-baslik', govde: ['<p class="soluk">Bir araç notlarını kendi klasöründe toplar ve King\'e bıraktığın notu taşır.</p>',
          araclar.length ? B.liste({ ad: 'Araçlar', ogeler: araclar.map(function (a) { return aracSatiri(a, notlar); }) }) : '',
          B.eylemler([{ metin: 'Yeni araç', href: '#/motor/not/arac/yeni' }])] }) + notAgi(notlar) + '</div>';
    }
    var aracY = alt === 'yeni' && (/[?&]arac=([\w-]+)/.exec(location.hash) || [])[1], aracA = aracY && oku(ARAC_ANAHTAR, []).filter(function (x) { return x.id === aracY; })[0];
    var n = alt === 'yeni' ? null : notlar.filter(function (x) { return x.id === alt; })[0];
    var geri = '<a class="kirinti" href="#/motor/not"><span aria-hidden="true">‹ </span>Not</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>' + k(n ? Not.ad(n) : 'Yeni not') + '</span>';
    if (alt !== 'yeni' && !n) {
      return I.ust(geri) + '<div class="govde">' + B.bos({ baslik: 'Bu not bulunamadı.', metin: 'Silinmiş ya da başka bir cihazda yazılmış olabilir.', eylem: { metin: 'Notlara dön', tur: 'ana', href: '#/motor/not' } }) + '</div>';
    }
    var durum = notDurum && notDurum.id === alt ? notDurum : null; notDurum = null;
    var f = durum && durum.form || n || { baslik: '', govde: '', ozel: false, sabit: false };
    var oteki = notlar.filter(function (x) { return !n || x.id !== n.id; }).sort(notSira);
    var adlar = {}; notlar.forEach(function (x) { adlar[x.id] = Not.ad(x); });
    var giden = n ? Not.baglar(n.govde) : [], gelen = n ? Not.geriBaglar(notlar, n.id) : [];
    var bagSatiri = function (b) { // var olan not bağlantı, silinmiş not düz satır
      var pul = b.celiski ? 'çelişki' : null;
      return adlar[b.id] != null ? { ad: b.ad || adlar[b.id] || 'Adsız not', href: '#/motor/not/' + b.id, pul: pul } : { ad: (b.ad || 'silinmiş not') + ' (silinmiş)', pul: pul };
    };
    return I.ust(geri) + '<div class="govde" data-arac="not">' + B.baslik({ metin: n ? 'Notu düzenle' : 'Yeni not' }) +
      '<form class="notform" data-not="' + k(alt) + '" novalidate>' +
      (durum ? B.uyari({ tur: durum.tamam ? 'tamam' : 'hata', metin: durum.metin }) : '') +
      (aracA ? '<input type="hidden" name="klasor" value="' + k(aracA.klasor) + '"><p class="soluk">Araç: ' + k(aracA.ad) + ' · ' + (aracA.sistemNotu.kingOkur ? 'King okur' : 'King okumaz') + '</p>' : '') +
      B.alan({ ad: 'Başlık', isim: 'baslik', deger: f.baslik, enCok: 120 }) + B.alan({ ad: 'Not', isim: 'govde', tur: 'cok', uzun: true, deger: f.govde }) +
      (oteki.length ? B.alan({ ad: 'Başka bir nota bağ ekle', isim: 'bagEkle', tur: 'secim', veri: { 'bag-ekle': '' },
        secenekler: oteki.reduce(function (o, x) { o[x.id] = Not.ad(x) || 'Adsız not'; return o; }, { '': 'Not seç…' }) }) : '') +
      B.alan({ ad: 'Özel (King görmez)', isim: 'ozel', tur: 'onay', deger: !!f.ozel }) + B.alan({ ad: 'Üstte tut', isim: 'sabit', tur: 'onay', deger: !!f.sabit }) +
      B.eylemler([{ metin: 'Kaydet', tur: 'ana', tip: 'submit' }, n ? { metin: 'Sil', tur: 'sade', veri: { 'arac-ac': 'not-sil', id: n.id } } : null, { metin: 'Notlara dön', tur: 'sade', href: '#/motor/not' }]) + '</form>' +
      (giden.length ? B.bolum({ baslik: 'Bu nottaki bağlar', govde: B.liste({ ad: 'Bu nottaki bağlar', ogeler: giden.map(bagSatiri) }) }) : '') +
      (gelen.length ? B.bolum({ baslik: 'Bu nota bağlananlar', govde: B.liste({ ad: 'Bu nota bağlananlar', ogeler: gelen.map(bagSatiri) }) }) : '') +
      (n ? '<p class="soluk">Son değişiklik ' + tarih(n.guncelleme) + '</p>' : '') + '</div>';
  }
  function notFormKaydet(form) {
    var id = form.getAttribute('data-not'), simdi = Date.now();
    var veri = { baslik: form.elements.baslik.value, govde: form.elements.govde.value, ozel: form.elements.ozel.checked, sabit: form.elements.sabit.checked,
      klasor: form.elements.klasor ? form.elements.klasor.value : '' };
    try {
      var r = notKaydet(Not, oku(NOT_ANAHTAR, []), id, veri, simdi, kimlik('n', simdi, Math.random()));
      yaz(NOT_ANAHTAR, r.notlar);
      notDurum = { id: r.id, metin: 'Kaydedildi.', tamam: true };
      ic().git('#/motor/not/' + r.id);
    } catch (e) {
      notDurum = { id: id, metin: e.message, form: veri }; // yazılan kaybolmasın
      ic().rota();
    }
    setTimeout(function () { var il = d.querySelector('.notform .b-uyari'); if (il) il.focus(); }, 0); // çizimden sonra: ileti ekran okuyucuya da ulaşsın
  }

  /* ---- Tekrar ---- */
  var gosterilen = null; // arkası açılmış kartın kimliği
  function kartlar() {
    var l = oku(KART_ANAHTAR, []), I = ic(), ilk = l;
    // yüklenmiş her alanın her aşamasının onaylı ders alıştırmaları kendiliğinden kart olur (taslak içerik aday çıkarmaz)
    I.tasinanlar().forEach(function (yer) {
      (I.asamalar(yer.id) || []).forEach(function (y, j) { l = kartlariEsitle(Tekrar, l, I.Yol.tekrarAdaylari(y, I.kayitOku(yer.id, j + 1)), y); });
    });
    if (l !== ilk) yaz(KART_ANAHTAR, l);
    return l;
  }
  // Kapıda yanlış ya da boş bırakılan sorular kart olur (kabuk.js kapiBitir çağırır); dönen: yanlış soru sayısı
  Kabuk.kapiTekrar = function (y, kapiId, cevaplar) {
    if (!Tekrar) return 0;
    var a = ic().Yol.kapiTekrarAdaylari(y, kapiId, cevaplar), l = oku(KART_ANAHTAR, []), l2 = kartlariEsitle(Tekrar, l, a, y);
    if (l2 !== l) yaz(KART_ANAHTAR, l2);
    return a.length;
  };
  function kapiKaynak(x) {
    var I = ic(), y = I.asamaY(x.alan, x.asama), alan = I.tasinanlar().filter(function (a) { return a.id === x.alan; })[0], u = x.unite && y && y.oge[x.unite];
    return (alan ? alan.ad : x.alan) + ' · ' + (x.unite ? (u ? u.ad : x.unite) + ' kapısı' : 'Aşama ' + String(x.asama).split('.')[1] + ' kapısı');
  }
  function sayac(simdi) { var s = oku(SAYAC_ANAHTAR, {}); return s.gun === gunAdi(simdi) ? s : { gun: gunAdi(simdi), yeni: 0, tekrar: 0 }; }
  // Tek kart (#/motor/tekrar/kart/<kimlik>; aramadan açılır): ön yüz, «Cevabı göster» ile arka yüz. Burada not verilmez: zamanlama yalnız
  // bugünün sırasında değişir (Tekrar sayfası); kart sıradaysa oraya bağlantı var.
  function sayfaKart(yer, id, hepsi, simdi) {
    var I = ic(), x = hepsi.filter(function (z) { return z.id === id; })[0];
    var geri = '<a class="kirinti" href="#/motor/tekrar"><span aria-hidden="true">‹ </span>Tekrar</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>Kart</span>';
    if (!x) return I.ust(geri) + '<div class="govde" data-arac="tekrar">' + B.bos({ baslik: 'Bu kart bulunamadı.', metin: 'Silinmiş olabilir.', eylem: { metin: 'Tekrar\'a dön', tur: 'ana', href: '#/motor/tekrar' } }) + '</div>';
    var taslak = x.kaynak === 'kapi' && x.icerik !== 'onayli', h = Tekrar.hatirlama(x, simdi), acik = gosterilen === x.id;
    var vade = taslak ? 'taslak: onaylanınca tekrara girer' : x.sonraki == null ? 'yeni kart' : x.sonraki <= gunSonu(simdi) ? 'bugün sırada' : 'sıradaki tekrar ' + tarih(x.sonraki);
    return I.ust(geri) + '<div class="govde" data-arac="tekrar" data-kart-sayfa>' + B.baslik({ metin: 'Kart', alt: (x.kaynak === 'kapi' ? kapiKaynak(x) : x.kaynak === 'yol' ? 'Ders alıştırmasından' : 'Elle eklediğin kart') +
      ' · hatırlama ' + (h.deger == null ? '—' : '%' + Math.round(h.deger * 100)) + ' (' + h.etiket + ')' }) +
      B.kart({ ust: vade, on: x.on, arka: acik ? x.arka : null, veri: { kart: x.id }, eylem: acik ? { metin: 'Tekrar\'a dön', href: '#/motor/tekrar' } : { metin: 'Cevabı göster', tur: 'ana', veri: { 'arac-ac': 'kart-goster' } } }) + '</div>';
  }
  function sayfaTekrar(yer, alt) {
    var I = ic(), k = I.kac;
    if (!Tekrar) return I.ust(I.kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: 'Tekrar' }) + eksik('Tekrar') + '</div>';
    var tek = /^kart\/(.+)$/.exec(alt || '');
    if (tek) { var idk; try { idk = decodeURIComponent(tek[1]); } catch (e) { idk = tek[1]; } return sayfaKart(yer, idk, kartlar(), Date.now()); }
    // taslak içerikten gelen kapı kartları tekrara girmez (AGENTS 0.1): ayrı listede durur, açılınca doğru cevabı gösterir
    var simdi = Date.now(), hepsi = kartlar(), kapiT = hepsi.filter(function (x) { return x.kaynak === 'kapi' && x.icerik !== 'onayli'; });
    var l = hepsi.filter(function (x) { return kapiT.indexOf(x) < 0; }), s = sayac(simdi), q = kuyruk(Tekrar, l, simdi, s), kart = q.sira[0], govde;
    if (!l.length) govde = B.bos({ baslik: 'Henüz kart yok.', metin: 'Aşağıdan ilk kartını ekle; onaylanmış derslerin alıştırmaları da buraya kendiliğinden gelir.' });
    else if (!kart) govde = B.panel({ tur: 'basari', durum: true, veri: { sonuc: 'gecti' }, govde: '<p><b>Bugünlük bitti.</b> ' + (s.yeni + s.tekrar) + ' cevap verdin.' +
      (q.plan.bekleyen.yeni + q.plan.bekleyen.tekrar ? ' <span class="soluk">Günlük tavan doldu; ' + (q.plan.bekleyen.yeni + q.plan.bekleyen.tekrar) + ' kart yarına kaldı.</span>' : '') + '</p>' });
    else {
      var acik = gosterilen === kart.id;
      govde = B.kart({ ust: 'Bugün ' + q.plan.tekrar.length + ' tekrar, ' + q.plan.yeni.length + ' yeni kart', on: kart.on, arka: acik ? kart.arka : null, veri: { kart: kart.id }, eylem: acik ? null : { metin: 'Cevabı göster', tur: 'ana', veri: { 'arac-ac': 'kart-goster' } },
          notlar: acik ? [[1, 'Yine'], [2, 'Zor'], [3, 'İyi'], [4, 'Kolay']].map(function (n) {
            var a = aralikAdi(Tekrar.cevapla(kart, n[0], simdi).gun);
            return { metin: n[1], sure: a === 'şimdi' ? a : a + ' sonra', veri: { 'arac-ac': 'kart-not', not: n[0] } };
          }) : null });
    }
    var liste = l.length ? B.acilir({ baslik: 'Bütün kartlar (' + l.length + ')', govde: B.liste({ ad: 'Kartlar', ogeler: l.map(function (x) {
      var h = Tekrar.hatirlama(x, simdi), vade = x.sonraki == null ? 'yeni' : x.sonraki <= gunSonu(simdi) ? 'bugün' : tarih(x.sonraki);
      return { ad: x.on, not: vade + ' · hatırlama ' + (h.deger == null ? '—' : '%' + Math.round(h.deger * 100)) + ' (' + h.etiket + ')' + (x.kaynak === 'kapi' ? ' · ' + kapiKaynak(x) : ''),
        eylemler: x.kaynak === 'yol' ? null : [{ metin: 'Sil', tur: 'sade', etiket: 'Kartı sil: ' + x.on, veri: { 'arac-ac': 'kart-sil', id: x.id } }] };
    }) }) }) : '';
    // kapı kartı açılınca doğru cevap; kaynak gövdede (üst sırada uzun not dar ekranı taşırırdı)
    liste += kapiT.length ? B.bolum({ baslik: 'Kapıda kalınan sorular (' + kapiT.length + ')', veri: { 'kapi-kartlari': '' }, govde: ['<p class="soluk">Sorular taslak: onaylanınca tekrara girer. Açınca doğru cevap görünür.</p>']
      .concat(kapiT.map(function (x) { return B.acilir({ baslik: x.on, duzey: 3, govde: '<p>' + k(x.arka) + '</p><p class="soluk">' + k(kapiKaynak(x)) + ' · taslak</p>' }); })) }) : '';
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="tekrar">' + B.baslik({ metin: 'Tekrar' }) + govde +
      '<form class="kartform" novalidate>' + B.baslik({ metin: 'Kart ekle', duzey: 2 }) +
      B.alan({ ad: 'Ön yüz (soru)', isim: 'on', enCok: 300 }) + B.alan({ ad: 'Arka yüz (cevap)', isim: 'arka', tur: 'cok', enCok: 2000 }) +
      B.eylemler([{ metin: 'Kartı ekle', tip: 'submit' }]) + '</form>' + liste + '</div>';
  }
  function kartEkle(form) {
    var on = form.elements.on.value.trim(), arka = form.elements.arka.value.trim(), simdi = Date.now();
    if (!on || !arka) { // yeniden çizilmez: yazılan yüz kaybolmasın
      if (!form.querySelector('.b-uyari')) form.querySelector('.b-baslik').insertAdjacentHTML('afterend', B.uyari({ tur: 'hata', metin: 'Kartın iki yüzü de dolu olmalı.' }));
      return form.querySelector('.b-uyari').focus();
    }
    yaz(KART_ANAHTAR, oku(KART_ANAHTAR, []).concat([Tekrar.yeniKart(kimlik('k', simdi, Math.random()), { on: on, arka: arka, kaynak: 'elle', olusturma: simdi })]));
    ic().rota();
  }

  /* ---- Yol haritası listesi ---- */
  function sayfaYol(yer) {
    var I = ic(), k = I.kac, alanlar = I.tasinanlar(), eksik_ = alanlar.filter(function (a) { return !I.al(a.id); });
    // ilerleme içerik yüklenince hesaplanır; eksik olanlar istenir, gelince sayfa bir kez daha çizilir
    if (eksik_.length) Promise.all(eksik_.map(function (a) { return I.alanYukle(a.id); })).then(function () { if (d.querySelector('[data-arac="yol"]')) I.rota(); });
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="yol">' + B.baslik({ metin: 'Yol haritası', alt: 'Her alanın aşama, ünite, ders ve kapıları. ' + alanlar.length + ' alan taşındı.' }) +
      B.liste({ ad: 'Alanlar', ogeler: alanlar.map(function (a) {
        var dr = I.fDurum(a.id), il = dr && dr.ilerleme;
        return { ad: a.ad, href: a.yol,
          not: il ? 'Aşama ' + I.al(a.id).n + ' · ' + dr.asama.ad + ' · ' + il.okunanDers.deger + '/' + il.okunanDers.toplam + ' ders okundu · ' + il.gecilenUnite.deger + '/' + il.gecilenUnite.toplam + ' kapı geçildi' : 'Aşama 1' };
      }) }) + '</div>';
  }

  /* ---- Kayıt ---- */
  var KAYIT_ANAHTAR = 'lifeos.kayit.kayitlar', Kayit = L.Motor && L.Motor.Kayit;
  var kayitTur = 'su', kayitGun = null, kayitIleti = null; // seçili tür ve gün (null = bugün); son gönderimin iletisi { hatalar?, tamam?, form?, tahmin? }
  function gunYazi(g, bugun) {
    if (g === bugun) return 'Bugün';
    if (Kayit.yardimci.gunFarki(g, bugun) === 1) return 'Dün';
    return new Date(g + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' });
  }
  function kayitAlanlari(t, f) {
    return Object.keys(t.sayilar || {}).map(function (a) {
      var x = t.sayilar[a], birim = x.birim && x.birim !== '1-5' ? ' (' + x.birim + ')' : '';
      return B.alan({ ad: x.ad + birim + (x.zorunlu ? '' : ' · isteğe bağlı'), isim: a, tur: 'sayi', deger: f[a] || '',
        yerTutucu: String(x.min).replace('.', ',') + ' – ' + String(x.max).replace('.', ',') });
    }).join('') + Object.keys(t.metinler || {}).map(function (a) {
      var x = t.metinler[a], ad = x.ad + (x.zorunlu ? '' : ' · isteğe bağlı');
      if (x.secim) return B.alan({ ad: ad, isim: a, tur: 'secim', deger: f[a] || '', secenekler: x.secim.reduce(function (o, v) { o[v] = v; return o; }, { '': 'Seç…' }) });
      return B.alan({ ad: ad, isim: a, deger: f[a] || '', yerTutucu: x.desenMetni ? '12:30' : '' });
    }).join('');
  }
  function sayfaKayit(yer, alt) {
    var I = ic(), k = I.kac;
    if (!Kayit) return I.ust(I.kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: 'Kayıt' }) + eksik('Kayıt') + '</div>';
    if (alt === 'hafta') return sayfaKayitHafta();
    var ag = /^gun\/(\d{4}-\d{2}-\d{2})$/.exec(alt || ''); if (ag) kayitGun = ag[1]; // Her şeyde arama bir kaydın gününü açar
    var simdi = Date.now(), gun = gunAdi(simdi), l = oku(KAYIT_ANAHTAR, []), T = Kayit.TURLER, t = T[kayitTur] || T.su;
    var gunler = kayitGunleri(Kayit, gun);
    if (kayitGun && kayitGun < gun && gunler.indexOf(kayitGun) < 0) gunler.push(kayitGun); // pencereden eski gün okunur; yazmayı motor reddeder
    var secili = gunler.indexOf(kayitGun) > 0 ? kayitGun : gun, sAd = gunYazi(secili, gun);
    var il = kayitIleti; kayitIleti = null;
    var f = il && il.form || {}, gruplar = {};
    Object.keys(T).forEach(function (id) { var a = T[id].alan === '*' ? 'Genel' : T[id].alan; (gruplar[a] = gruplar[a] || []).push(id); });
    var ozet = gunOzeti(Kayit, l, secili), bugun = l.filter(function (r) { return r.gun === secili; }).reverse();
    var Ay = L.Kabuk && L.Kabuk.Ayar, ay = function (a) { return Ay ? Ay.oku(I.depo, a) : null; };
    var cins = ay('lifeos.beden.cinsiyet');
    var kural = kuralOzeti(Kayit, l, gun, { cinsiyet: cins === 'belirtilmedi' ? null : cins, boy: ay('lifeos.beden.boy'),
      dogumYili: ay('lifeos.beden.dogumYili'), hedef: ay('lifeos.beden.hedef') }, new Date(simdi).getFullYear());
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="kayit">' + B.baslik({ metin: 'Kayıt' }) +
      '<form class="kayitform" novalidate>' +
      (il && (il.hatalar || il.tamam) ? B.uyari({ tur: il.hatalar ? 'hata' : 'tamam', metin: il.hatalar ? il.hatalar.join(' ') : il.tamam }) : '') +
      B.alan({ ad: 'Hangi gün?', isim: 'gun', tur: 'secim', deger: secili, veri: { 'kayit-gun': '' }, secenekler: gunler.reduce(function (o, g) { o[g] = gunYazi(g, gun); return o; }, {}) }) +
      B.alan({ ad: 'Ne kaydediyorsun?', isim: 'kayitTur', tur: 'secim', deger: T[kayitTur] ? kayitTur : 'su', veri: { 'kayit-tur': '' }, secenekler: Object.keys(gruplar).reduce(function (o, g) {
        o[g] = gruplar[g].reduce(function (q, id) { q[id] = T[id].ad; return q; }, {}); return o;
      }, {}) }) + kayitAlanlari(t, f) +
      (Object.keys(t.sayilar || {}).length ? B.alan({ ad: 'Sayılar tahmin (ölçmedim)', isim: 'tahmin', tur: 'onay', deger: !!(il && il.tahmin) }) : '') +
      B.eylemler([{ metin: 'Kaydet', tur: 'ana', tip: 'submit' }, { metin: 'Haftalık özet', tur: 'sade', href: '#/motor/kayit/hafta' }]) + '</form>' +
      B.bolum({ baslik: sAd, govde: ozet.length ? B.liste({ ad: 'Gün özeti', ogeler: ozet.map(ozetSatiri) })
        : B.bos({ baslik: sAd + ' için kayıt yok.', metin: 'Yukarıdan ilk kaydı gir, özet burada görünür. Boş, sıfır demek değildir.' }) }) +
      B.bolum({ baslik: 'Kurallar', veri: { kural: '' }, govde: [kural.satirlar.length ? B.liste({ ad: 'Kurallar', ogeler: kural.satirlar.map(ozetSatiri) }) : '',
        kural.eksik ? '<p class="soluk">Enerji hedefi için eksik: ' + k(kural.eksik.join(', ')) + '. <a href="#/ayarlar">Ayarlar › Beden</a>; kilo, Kayıt › Kilo kaydından gelir.</p>' : '',
        kural.emirVeriYok ? '<p class="soluk">Antrenman kararı için toparlanma verisi yok: uyku, nabız ya da enerji kaydı girince hesaplanır.</p>' : ''] }) +
      (bugun.length ? B.acilir({ baslik: sAd + ' kayıtları (' + bugun.length + ')', acik: true, govde: B.liste({ ad: 'Kayıtlar', ogeler: bugun.map(function (r) {
        return { ad: kayitMetni(Kayit, r), not: r.zaman && gunAdi(r.zaman) === r.gun ? new Date(r.zaman).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '',
          eylemler: [{ metin: 'Sil', tur: 'sade', etiket: 'Kaydı sil: ' + kayitMetni(Kayit, r), veri: { 'arac-ac': 'kayit-sil', id: r.id } }] };
      }) }) }) : '') +
      '<p class="soluk">' + l.length + ' kayıt · bu cihazda durur</p></div>';
  }
  // özet satırı (motorun {ad, metin, etiket}): metin yazılı, kesinlik etiketi rozet (AGENTS §1.2)
  function ozetSatiri(o) { return { ad: o.ad, not: o.metin, pul: o.etiket }; }
  // Kayıt haftası (#/motor/kayit/hafta): tür başına yedi gün (Kayit.haftalik), haftanın toplamları, toparlanma ve yük (Kayit.Kural).
  function sayfaKayitHafta() {
    var I = ic(), k = I.kac, bugun = gunAdi(Date.now()), l = oku(KAYIT_ANAHTAR, []), h = haftaOzeti(Kayit, l, bugun), y = yukOzeti(Kayit, l, bugun);
    var geri = '<a class="kirinti" href="#/motor/kayit"><span aria-hidden="true">‹ </span>Kayıt</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>Hafta</span>';
    var tarih_ = function (g, o) { return new Date(g + 'T12:00:00').toLocaleDateString('tr-TR', o); };
    var tablo = !h.satirlar.length ? B.bos({ baslik: 'Bu yedi günde kayıt yok.', metin: 'Kayıt girdikçe her tür bir satır olur, günler sütunlarda.' })
      : B.tablo({ etiket: 'kh-gunler', ilk: 'Tür', sutunlar: h.gunler.map(function (g) { return { metin: tarih_(g, { weekday: 'short' }), alt: tarih_(g, { day: 'numeric', month: 'short' }), bugun: g === bugun }; }),
        satirlar: h.satirlar.map(function (r) {
          return { ad: r.ad, alt: r.birim, pul: r.etiket || null, hucreler: r.hucreler.map(function (c) { return c && (r.etiket ? { metin: c.metin, okunur: c.etiket } : { metin: c.metin, alt: c.etiket }); }) };
        }) });
    return I.ust(geri) + '<div class="govde" data-arac="kayit" data-kayit-hafta>' + B.baslik({ metin: 'Kayıt haftası', alt: tarih_(h.bas, { day: 'numeric', month: 'short' }) + ' – ' +
      tarih_(h.bitis, { day: 'numeric', month: 'short' }) + ' · 7 günün ' + h.veriGunu + ' gününde kayıt var. Nokta: o gün kayıt yok; sıfır değildir.' }) +
      B.bolum({ baslik: 'Günler', id: 'kh-gunler', govde: tablo }) +
      (h.toplam.length ? B.bolum({ baslik: 'Haftanın toplamı', govde: ['<p class="soluk">Ortalamalar yalnız kaydı olan günlerden.</p>', B.liste({ ad: 'Haftanın toplamı', ogeler: h.toplam.map(ozetSatiri) })] }) : '') +
      B.bolum({ baslik: 'Toparlanma ve yük', veri: { yuk: '' }, govde: [y.satirlar.length ? B.liste({ ad: 'Toparlanma ve yük', ogeler: y.satirlar.map(ozetSatiri) }) : '']
        .concat(y.notlar.map(function (n) { return '<p class="soluk">' + k(n) + '</p>'; })) }) +
      B.eylemler([{ metin: 'Kayıt ekle', tur: 'ana', href: '#/motor/kayit' }]) + '</div>';
  }
  function kayitGonder(form) {
    var veri = {}, simdi = Date.now();
    [].forEach.call(form.elements, function (e) { if (e.name && e.name !== 'tahmin' && e.name !== 'gun' && e.name !== 'kayitTur') veri[e.name] = e.value; });
    var tahmin = !!(form.elements.tahmin && form.elements.tahmin.checked), bugun = gunAdi(simdi), gun = form.elements.gun.value || bugun;
    var r = kayitEkle(Kayit, oku(KAYIT_ANAHTAR, []), kayitTur, veri, tahmin, gun, simdi, bugun); // pencereye motor karar verir
    if (r.ok) { yaz(KAYIT_ANAHTAR, r.kayitlar); kayitIleti = { tamam: 'Kaydedildi' + (gun === bugun ? '' : ' (' + gunYazi(gun, bugun) + ')') + ': ' + kayitMetni(Kayit, r.kayit) }; }
    else kayitIleti = { hatalar: r.hatalar, form: veri, tahmin: tahmin }; // yazılan kaybolmasın
    ic().rota();
    var ileti = d.querySelector('.kayitform .b-uyari'); if (ileti) ileti.focus();
  }

  /* ---- Plan ---- */
  var PLAN_ANAHTAR = 'lifeos.plan.durum', PLAN_SABLON = 'lifeos.plan.sablon', Plan = L.Motor && L.Motor.Plan, planIleti = null;
  var GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  var DERS_DK = 20; // shortcut: içerik şemasında ders süresi yok, 20 dk varsayım; şemaya süre gelince oradan okunur
  var SINIF_AD = { temel: 'temel', sureli: 'süreli', vadeli: 'tekrar', sentez: 'sentez', yeni: 'yeni' };
  function planDurum(simdi) {
    var v = oku(PLAN_ANAHTAR, {}), dr = v && v.ayar && Array.isArray(v.ayar.musait) && Array.isArray(v.isler) ? v : planBos();
    var y = planGunDevri(Plan, dr, gunAdi(simdi));
    if (y !== dr) yaz(PLAN_ANAHTAR, y);
    return y;
  }
  function planEk(simdi) { // motorun girdileri: etkin alanın sıradaki dersi ve Tekrar'ın günlük planı
    var I = ic(), dersler = [];
    I.tasinanlar().filter(function (a) { return a.id === I.etkin(); }).forEach(function (a) { // yalnız üzerinde çalışılan alan: plan neyin yüklü olduğuna göre değişmesin
      var dr = I.fDurum(a.id), adim = dr && Kabuk.siradaki(dr);
      if (adim && adim.tur === 'ders') dersler.push({ id: adim.id, ad: a.ad + ': ' + adim.ad, dk: DERS_DK, alan: a.id });
    });
    return { dersler: dersler, tekrar: Tekrar ? kuyruk(Tekrar, kartlar(), simdi, sayac(simdi)).plan : null, sablon: planSablon() };
  }
  function planSablon() { // bozuk satır atlanır; şablon yoksa boş
    var v = oku(PLAN_SABLON, { sabitler: [] });
    return { sabitler: (Array.isArray(v.sabitler) ? v.sabitler : []).filter(function (s) { return s && s.id && Array.isArray(s.gunler); }) };
  }
  // plan bloğu (B.liste öğesi): saat ve ad bir satırda, süre ve etiketler notta; uzun satır (metin kısaltılmaz)
  function blokSatiri(b, salt) {
    var eylem = null, pul = null, dg = function (metin, durum) { return { metin: metin, tur: 'sade', veri: { 'arac-ac': 'plan-durum', id: b.id, durum: durum } }; };
    if (!salt && b.tur !== 'mola' && b.tur !== 'sabit') {
      if (b.durum === 'bekliyor') eylem = [dg('Yapıldı', 'yapildi'), dg('Atla', 'atlandi')];
      else { pul = b.durum === 'yapildi' ? { metin: 'yapıldı', tur: 'altin' } : b.durum === 'atlandi' ? 'atlandı' : 'kısmen'; eylem = [dg('Geri al', 'bekliyor')]; }
    }
    var sabit = b.tur === 'sabit'; // sabit blok: süre yazılmaz; gece bölünen bloğun 23:59'u 24:00 okunur
    return { ad: b.bas + '–' + (sabit && b.bit === '23:59' ? '24:00' : b.bit) + ' ' + b.ad + (b.neden ? ' (' + b.neden + ')' : ''), uzun: true, pul: pul, eylemler: eylem, veri: { blok: b.tur, 'blok-durum': b.durum },
      not: (sabit ? 'sabit' : b.dk + ' dk') + (b.dkEtiket === 'estimated' ? ' · tahmin' : '') + (b.sinif ? ' · ' + SINIF_AD[b.sinif] : '') + (b.devir ? ' · ' + b.devir + '. gün' : '') };
  }
  function planIletisi(il) { return il ? B.uyari({ tur: 'hata', metin: il.join(' ') }) : ''; }
  function silEylemi(etiket, veri) { return [{ metin: 'Sil', tur: 'sade', etiket: etiket, veri: veri }]; }
  function saatAraligi() { return '<div class="ikili">' + B.alan({ ad: 'Başlangıç', isim: 'bas', tur: 'saat' }) + B.alan({ ad: 'Bitiş', isim: 'bit', tur: 'saat' }) + '</div>'; }
  // Hafta planı (#/motor/plan/hafta): bugünden yedi gün, motorun haftaPlani öngörüsü; altta sabit bloklar şablonu.
  function sayfaPlanHafta() {
    var I = ic(), simdi = Date.now(), bugun = gunAdi(simdi), dr = planDurum(simdi), sab = planSablon(), il = planIleti; planIleti = null;
    var E = { computed: 'hesaplandı', estimated: 'tahmin', missing: 'veri yok' };
    // sıradaki ders üzerinde çalışılan alanın içeriğinden gelir; doğrudan açılışta içerik yüklenince bir kez daha çizilir
    if (!I.al(I.etkin())) I.alanYukle(I.etkin()).then(function () { if (d.querySelector('[data-hafta]') && I.al(I.etkin())) I.rota(); });
    var geri = '<a class="kirinti" href="#/motor/plan"><span aria-hidden="true">‹ </span>Plan</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>Hafta</span>';
    var gunAd = function (g) { return new Date(g + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }); };
    var isListe = function (ad, l) { return B.liste({ ad: ad, ogeler: l.map(function (x) { return { ad: x.ad, not: x.dk + ' dk' + (x.devir ? ' · ' + x.devir + ' kez devretti' : '') }; }) }); };
    var govde;
    if (!dr.ayar.musait.length) govde = B.bos({ baslik: 'Hafta, Plan sayfasındaki boş zamanına kurulur.', eylem: { metin: 'Önce boş zamanını yaz', href: '#/motor/plan' } });
    else {
      var r = haftaKur(Plan, dr, sab, bugun, planEk(simdi)), h = r.ok && r.hafta;
      govde = !r.ok ? B.uyari({ tur: 'dikkat', metin: r.hatalar.join(' ') })
        : '<p class="soluk">' + I.kac(gunAd(h.bas)) + ' – ' + I.kac(gunAd(h.bitis)) + ' · ' + (h.ozet.planlananDk.v ? 'planlanan ' + h.ozet.planlananDk.v + ' dk (' + E[h.ozet.planlananDk.k] + ')' : 'plana girecek iş yok') +
          (h.ozet.araGunu ? ' · ' + h.ozet.araGunu + ' ara günü' : '') + '. Öngörüdür: planlanan blok yapılacak sayılır.</p>' +
          '<div class="hafta">' + h.gunler.map(function (p) { // yalnız yerleşim: günler ızgarada yan yana
            return B.bolum({ baslik: gunAd(p.gun) + (p.gun === bugun ? ' · bugün' : ''), id: 'hg-' + p.gun, veri: { gun: p.gun }, govde: [
              p.bloklar.length ? B.liste({ ad: gunAd(p.gun) + ' blokları', ogeler: p.bloklar.map(function (b) { return blokSatiri(b, true); }) }) : '<p class="soluk">Bu günde blok yok.</p>',
              '<p class="soluk">' + (p.ozet.planlananDk.v ? p.ozet.planlananDk.v + ' dk (' + E[p.ozet.planlananDk.k] + ')' : 'Planlanan iş yok') + '</p>',
              p.sigmayan.length ? '<p class="soluk">Sığmayan: ' + I.kac(p.sigmayan.map(function (x) { return x.ad + ' (' + x.neden + ')'; }).join(', ')) + '</p>' : ''] });
          }).join('') + '</div>' +
          (h.devir.length ? B.bolum({ baslik: 'Gelecek haftaya devreder (' + h.devir.length + ')', govde: isListe('Gelecek haftaya devreder', h.devir) }) : '') +
          (h.bekleyen.length ? B.bolum({ baslik: 'Bekleyen (' + h.bekleyen.length + ')', govde: ['<p class="soluk">Haftaya sığmadı; devirden sonra sıradadır, kaybolmaz.</p>', isListe('Bekleyen', h.bekleyen)] }) : '');
    }
    return I.ust(geri) + '<div class="govde" data-arac="plan" data-hafta>' + B.baslik({ metin: 'Hafta planı' }) + planIletisi(il) + govde +
      B.bolum({ baslik: 'Sabit bloklar', id: 'sabit-baslik', govde: ['<p class="soluk">Uyku, okul, iş, antrenman: bir kez yaz, her hafta seçtiğin günlere girer. Plan bunların dışına kurulur.</p>',
        sab.sabitler.length ? B.liste({ ad: 'Sabit bloklar', ogeler: sab.sabitler.map(function (s) {
          var gunler = s.gunler.length === 7 ? 'her gün' : s.gunler.map(function (g) { return GUN_KISA[g]; }).join(', ');
          return { ad: s.ad + ' · ' + s.bas + '–' + s.bit, not: gunler + (s.bit < s.bas ? ' · gece yarısını geçer' : ''), eylemler: silEylemi('Sabit bloğu sil: ' + s.ad, { 'arac-ac': 'plan-sabit-sil', id: s.id }) };
        }) }) : '',
        '<form class="planform" data-plan="sabit" novalidate>' + B.alan({ ad: 'Ad', isim: 'ad', enCok: 60 }) + saatAraligi() +
        B.alan({ ad: 'Günler', isim: 'gun', tur: 'coklu', secenekler: Object.assign({}, GUN_KISA), deger: [0, 1, 2, 3, 4] }) + B.eylemler([{ metin: 'Sabit blok ekle', tip: 'submit' }]) + '</form>'] }) + '</div>';
  }
  function sayfaPlan(yer, alt) {
    var I = ic();
    if (!Plan) return I.ust(I.kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: 'Plan' }) + eksik('Plan') + '</div>';
    if (alt === 'hafta') return sayfaPlanHafta();
    var simdi = Date.now(), dr = planDurum(simdi), p = dr.gunPlan && dr.gunPlan.plan, il = planIleti; planIleti = null;
    var E = { computed: 'hesaplandı', estimated: 'tahmin', missing: 'veri yok' };
    var planHtml = !dr.ayar.musait.length ? '<p class="soluk">Önce aşağıya bugün çalışabileceğin saat aralığını yaz; plan o boşluğa kurulur.</p>'
      : !p ? '<p class="soluk">Bugün için plan kurulmadı.</p>'
      : (p.bloklar.length ? B.liste({ ad: 'Bugünün blokları', ogeler: p.bloklar.map(function (b) { return blokSatiri(b); }) }) : B.bos({ baslik: 'Plana girecek iş yok.', metin: 'Aşağıdan bir iş ekle ya da bir alanda derse başla; dersler ve tekrar kartları plana kendiliğinden girer.' })) +
        '<p class="soluk">Planlanan ' + (p.ozet.planlananDk.v || 0) + ' dk (' + E[p.ozet.planlananDk.k] + ') · boş kalan ' + p.ozet.bosDk.v + ' dk (' + E[p.ozet.bosDk.k] + ')' +
        (p.ozet.molaSayisi ? ' · ' + p.ozet.molaSayisi + ' mola' : '') + '</p>' +
        (p.sigmayan.length ? B.uyari({ tur: 'dikkat', metin: 'Sığmayanlar (' + p.sigmayan.length + '): ' + p.sigmayan.map(function (x) { return x.ad + ' · ' + x.dk + ' dk · ' + x.neden; }).join('; ') }) : '');
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="plan">' + B.baslik({ metin: 'Plan' }) + planIletisi(il) +
      B.bolum({ baslik: 'Bugünün planı', govde: [planHtml, B.eylemler([dr.ayar.musait.length ? { metin: p ? 'Yeniden kur' : 'Planı kur', tur: 'ana', veri: { 'arac-ac': 'plan-kur' } } : null,
        { metin: 'Hafta planı ve sabit bloklar', tur: 'sade', href: '#/motor/plan/hafta' }])] }) +
      B.bolum({ baslik: 'Boş zamanım', govde: [dr.ayar.musait.length ? B.liste({ ad: 'Boş zaman aralıkları', ogeler: dr.ayar.musait.map(function (m, i) {
          return { ad: m.bas + '–' + m.bit, eylemler: silEylemi('Aralığı sil: ' + m.bas + '–' + m.bit, { 'arac-ac': 'plan-aralik-sil', i: i }) };
        }) }) : '',
        '<form class="planform" data-plan="aralik" novalidate>' + saatAraligi() + B.eylemler([{ metin: 'Aralık ekle', tip: 'submit' }]) + '</form>'] }) +
      B.bolum({ baslik: 'İşler', govde: [dr.isler.length ? B.liste({ ad: 'İşler', ogeler: dr.isler.map(function (x) {
          return { ad: x.ad, not: x.dk + ' dk' + (x.son ? ' · son ' + x.son : '') + (x.devir ? ' · ' + x.devir + ' kez devretti' : ''), eylemler: silEylemi('İşi sil: ' + x.ad, { 'arac-ac': 'plan-is-sil', id: x.id }) };
        }) }) : '<p class="soluk">Eklediğin iş yok. Dersler ve tekrar kartları plana kendiliğinden girer.</p>',
        '<form class="planform" data-plan="is" novalidate>' + B.alan({ ad: 'İş', isim: 'ad', enCok: 120 }) +
        '<div class="ikili">' + B.alan({ ad: 'Süre (dk)', isim: 'dk', tur: 'sayi' }) + B.alan({ ad: 'Son tarih · isteğe bağlı', isim: 'son', tur: 'tarih' }) + '</div>' +
        B.eylemler([{ metin: 'İş ekle', tip: 'submit' }]) + '</form>'] }) + '</div>';
  }
  function planYaz(dr, ileti) { yaz(PLAN_ANAHTAR, dr); planIleti = ileti || null; ic().rota(); if (ileti) { var el = d.querySelector('[data-arac="plan"] .b-uyari--hata'); if (el) el.focus(); } }
  function planHata(hatalar) { planIleti = hatalar; ic().rota(); var el = d.querySelector('[data-arac="plan"] .b-uyari--hata'); if (el) el.focus(); }
  function planFormu(form) {
    var simdi = Date.now(), dr = planDurum(simdi), ne = form.getAttribute('data-plan'), e = form.elements, veri;
    if (ne === 'sabit') {
      var rs = sabitEkle(Plan, planSablon(), { id: kimlik('s', simdi, Math.random()), ad: e.ad.value, bas: e.bas.value, bit: e.bit.value,
        gunler: [].filter.call(form.querySelectorAll('input[name=gun]'), function (x) { return x.checked; }).map(function (x) { return +x.value; }) }, gunAdi(simdi));
      if (!rs.ok) return planHata(rs.hatalar);
      yaz(PLAN_SABLON, rs.sablon); return ic().rota();
    }
    if (ne === 'is') {
      if (!e.ad.value.trim()) return planHata(['İşin adı yazılmalı.']);
      veri = { id: kimlik('i', simdi, Math.random()), ad: e.ad.value.trim(), dk: Number(e.dk.value.trim()) };
      if (e.son.value) veri.son = e.son.value;
    } else veri = { bas: e.bas.value, bit: e.bit.value };
    var r = planEkle(Plan, dr, ne, veri, gunAdi(simdi));
    return r.ok ? planYaz(r.durum) : planHata(r.hatalar);
  }
  // Bugün sayfasının alt bağlantısı (karşılama taşının baglanti'sı): plan varsa sıradaki blok, yoksa plana davet
  Kabuk.bugunEk = function () {
    if (!Plan) return null;
    var simdi = Date.now(), dr = planDurum(simdi), p = dr.gunPlan && dr.gunPlan.plan;
    var sira = p && p.bloklar.filter(function (b) { return b.durum === 'bekliyor' && b.tur !== 'mola' && b.tur !== 'sabit'; });
    return { href: '#/motor/plan', metin: !p ? 'Günü planla' : sira.length ? 'Planda sırada: ' + sira[0].bas + ' ' + sira[0].ad + (sira.length > 1 ? ' · ' + (sira.length - 1) + ' blok daha' : '') : 'Bugünün planı bitti' };
  };

  /* ---- Soru: karma test ---- */
  var SORU_ANAHTAR = 'lifeos.soru.oturum', SORU_GECMIS = 'lifeos.soru.gecmis', Soru = L.Motor && L.Motor.Soru;
  var soruGoster = -1; // cevabı az önce verilen sorunun sırası: sonucu ekranda kalır, «Sonraki» ile geçilir
  function soruBaglam() { // etkin alanın içeriği ve havuzu; içerik yüklenmediyse null
    var I = ic(), id = I.etkin(), f = I.al(id);
    if (!f || !f.y) return null;
    var h = soruHavuzu(I.Yol, f.y, I.kayitOku(id));
    return { alan: I.tasinanlar().filter(function (a) { return a.id === id; })[0], havuz: h.havuz, sozluk: h.sozluk };
  }
  function sayfaSoru(yer) {
    var I = ic();
    if (!Soru) return I.ust(I.kirinti(yer)) + '<div class="govde">' + B.baslik({ metin: 'Soru' }) + eksik('Soru') + '</div>';
    var b = soruBaglam(), bas = I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="soru">' + B.baslik({ metin: 'Soru' });
    if (!b) {
      if (!I.al(I.etkin())) I.alanYukle(I.etkin()).then(function () { if (d.querySelector('[data-arac="soru"]')) I.rota(); });
      return bas + (I.al(I.etkin()) ? B.bos({ baslik: 'Sorular bu açılışta yüklenemedi.', metin: 'Sayfa dosyadan açıldıysa LifeOS sunucusundan aç.' })
        : '<p class="soluk" aria-busy="true">Yükleniyor…</p>') + '</div>';
    }
    var kayit = oku(SORU_ANAHTAR, {}), o = kayit.oturum && kayit.alan === b.alan.id ? kayit.oturum : null, gecmis = oku(SORU_GECMIS, []);
    if (!o) {
      var son = gecmis.slice(-5).reverse();
      return bas + '<p class="soluk">' + I.kac(b.alan.ad) + ' alanının açık ünitelerinden karma test. Havuzda ' + b.havuz.length + ' soru var. Alanı değiştirmek için o alanın sayfasını aç.</p>' +
        (b.havuz.length < Soru.EN_AZ ? B.bos({ baslik: 'Test için en az ' + Soru.EN_AZ + ' soru gerekir.' })
          : B.eylemler(Soru.BOYLAR.filter(function (n, i) { return !i || b.havuz.length > Soru.BOYLAR[i - 1]; }).map(function (n, i) { // havuz küçükse aynı boyda iki düğme çıkmasın
            return { metin: Math.min(n, b.havuz.length) + ' soruluk test', tur: i ? 'ikincil' : 'ana', veri: { 'arac-ac': 'soru-basla', boy: n } };
          }))) +
        B.eylemler([{ metin: 'Süreli deneme' + (oku('lifeos.soru.deneme', {}).oturum ? ' · sürüyor' : ''), href: '#/motor/soru/deneme' }]) +
        (son.length ? B.bolum({ baslik: 'Son testler', govde: B.liste({ ad: 'Son testler', ogeler: son.map(function (g) {
          var r = g.sayilar;
          return { ad: g.alanAd + ' · ' + tarih(g.bitti), not: r.dogru + ' doğru · ' + r.yanlis + ' yanlış · ' + (r.bos + r.bakildi) + ' boş', pul: 'ölçüldü', uzun: true };
        }) }) }) : '') + '</div>';
    }
    var sira = soruGoster >= 0 ? soruGoster : soruSirasi(o);
    if (sira < 0) sira = o.sorular.length - 1;
    var q = b.sozluk[o.sorular[sira]], cv = o.cevaplar[sira], bitti = soruSirasi(o) < 0;
    if (!q) return bas + B.bos({ baslik: 'Bu testin sorusu artık içerikte yok.', eylem: { metin: 'Testi kapat', tur: 'ana', veri: { 'arac-ac': 'soru-birak' } } }) + '</div>';
    return bas + B.soru({ soru: q.soru, ust: b.alan.ad + ' · soru ' + (sira + 1) + ' / ' + o.sorular.length + ' · ' + q.konu, secenekler: q.sec, secili: cv && cv.h || null,
        dogru: cv ? q.dogru : null, kilitli: !!cv, sikVeri: { 'arac-ac': 'soru-cevap' }, veri: { sira: sira },
        sonuc: cv ? { baslik: cv.bak ? 'Çözüme baktın; bu soru doğru sayılmaz.' : cv.h === q.dogru ? 'Doğru.' : 'Yanlış.', metin: q.cozum ? q.cozum.join(' ') : '' } : null }) +
      B.eylemler([cv ? { metin: bitti ? 'Sonucu gör' : 'Sonraki', tur: 'ana', veri: { 'arac-ac': bitti ? 'soru-bitir' : 'soru-sonraki' } } : { metin: 'Çözüme bak', tur: 'sade', veri: { 'arac-ac': 'soru-bak' } },
        { metin: 'Testi bitir', tur: 'sade', veri: { 'arac-ac': 'soru-bitir' } }]) + '</div>';
  }
  var soruSonuc = null; // biten testin özeti, yalnız hemen ardından gösterilir
  function sayfaSoruSonuc(yer) {
    var I = ic(), g = soruSonuc, r = g.sayilar;
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-arac="soru">' + B.baslik({ metin: 'Test bitti' }) +
      B.panel({ tur: 'guclu', durum: true, veri: { sonuc: 'soru' }, govde: '<p><b>' + r.dogru + ' / ' + r.toplam + ' doğru.</b> ' + r.yanlis + ' yanlış, ' + r.bos + ' boş, ' + r.bakildi + ' çözüme bakıldı. <span class="soluk">ölçüldü</span></p>' }) +
      (g.konular.length ? B.bolum({ baslik: 'Derslere göre', govde: B.liste({ ad: 'Derslere göre', ogeler: g.konular.map(function (x) { return { ad: x.konu, not: x.dogru + ' / ' + x.n, pul: 'ölçüldü' }; }) }) }) : '') +
      B.eylemler([{ metin: 'Yeni test', tur: 'ana', veri: { 'arac-ac': 'soru-yeni' } }, { metin: g.alanAd + ' sayfası', tur: 'sade', href: g.alanYol }]) + '</div>';
  }
  function soruEylem(ne, b) {
    var I = ic(), bg = soruBaglam(), simdi = Date.now();
    if (ne === 'soru-yeni') return I.rota(); // sonuç sayfası aynı adreste: bağlantı değil, yeniden çizim
    if (!bg) return;
    var kayit = oku(SORU_ANAHTAR, {}), o = kayit.oturum;
    if (ne === 'soru-basla') {
      var r = Soru.alistirmaKur(bg.havuz, +b.getAttribute('data-boy'), simdi, Math.random);
      if (r.ok) { yaz(SORU_ANAHTAR, { alan: bg.alan.id, oturum: r.oturum }); soruGoster = -1; }
      return I.rota();
    }
    if (!o) return I.rota();
    var sira = +(d.querySelector('.b-soru[data-sira]') || { getAttribute: function () { return -1; } }).getAttribute('data-sira');
    if (ne === 'soru-cevap' || ne === 'soru-bak') {
      var c = ne === 'soru-bak' ? Soru.bak(o, sira, simdi) : Soru.cevapla(o, sira, b.getAttribute('data-h'), bg.sozluk, simdi);
      if (c.ok) { yaz(SORU_ANAHTAR, { alan: kayit.alan, oturum: c.oturum }); soruGoster = sira; }
      I.rota();
      var s = d.querySelector('.b-soru__sonuc'); if (s) s.focus({ preventScroll: true });
      return;
    }
    if (ne === 'soru-sonraki') { soruGoster = -1; return I.rota(); }
    if (ne === 'soru-birak') { yaz(SORU_ANAHTAR, {}); soruGoster = -1; return I.rota(); }
    if (ne === 'soru-bitir') {
      var bit = Soru.oturumBitir(o, bg.sozluk, simdi);
      soruSonuc = { bitti: simdi, alan: bg.alan.id, alanAd: bg.alan.ad, alanYol: bg.alan.yol, sayilar: bit.ozet.sayilar, konular: bit.ozet.konular };
      yaz(SORU_GECMIS, oku(SORU_GECMIS, []).concat([{ bitti: simdi, alan: bg.alan.id, alanAd: bg.alan.ad, sayilar: bit.ozet.sayilar, sonuc: bit.sonuc }]).slice(-50));
      yaz(SORU_ANAHTAR, {}); soruGoster = -1;
      I.rota();
      var ks = d.querySelector('[data-sonuc="soru"]'); if (ks) ks.focus({ preventScroll: true });
    }
  }

  /* ---- Başlangıç paketi: Bugün'de tek satırlık teklif ---- */
  var BASLANGIC_IZ = 'lifeos.kabuk.baslangic', baslangic = null, baslangicSoruldu = false, baslangicBitti = '';
  function baslangicYokla() { // yalnız sunucudan açılınca; paket bu bilgisayardan okunur (sunucu başkasına vermez)
    baslangicSoruldu = true;
    if (location.protocol === 'file:' || !window.fetch) return;
    fetch('/api/kabuk/baslangic', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (v) {
      if (!v || v.lifeos_kabuk_baslangic !== 1 || !v.kimlik || !v.say || ic().depo.getItem(BASLANGIC_IZ) === v.kimlik) return;
      if (!(v.say.notlar + v.say.kayitlar + v.say.kartlar + Object.keys(v.beden || {}).length)) return;
      baslangic = v;
      if (d.querySelector('.b-karsilama')) ic().rota();
    }).catch(function () { /* sunucu yok ya da paket yok: teklif çıkmaz */ });
  }
  Kabuk.baslangicDavet = function () {
    var B = Kabuk.Bilesen;
    if (!baslangicSoruldu) baslangicYokla();
    if (baslangicBitti) { var m = baslangicBitti; baslangicBitti = ''; return B.uyari({ tur: 'tamam', metin: m, veri: { baslangic: 'bitti' } }); }
    if (!baslangic) return '';
    return B.uyari({ tur: 'bilgi', veri: { baslangic: 'teklif' },
      metin: 'Eski sistemdeki kayıtların hazır: ' + [baslangicMetni(baslangic.say), Object.keys(baslangic.beden || {}).length ? 'beden bilgilerin' : ''].filter(Boolean).join(', ') +
        '. Buraya getirilsin mi? Eski yerlerinde de durmaya devam eder.',
      eylem: [{ metin: 'Getir', tur: 'ana', veri: { 'arac-ac': 'baslangic-getir' } }, { metin: 'Sonra', tur: 'sade', veri: { 'arac-ac': 'baslangic-sonra' } }] });
  };
  function baslangicGetir() {
    if (!baslangic || !Not || !Kayit) return;
    var r = baslangicBirlestir(Not, Kayit, { notlar: oku(NOT_ANAHTAR, []), kayitlar: oku(KAYIT_ANAHTAR, []), kartlar: oku(KART_ANAHTAR, []) }, baslangic);
    if (r.say.not) yaz(NOT_ANAHTAR, r.notlar);
    if (r.say.kayit) yaz(KAYIT_ANAHTAR, r.kayitlar);
    if (r.say.kart) yaz(KART_ANAHTAR, r.kartlar);
    var bedenSay = baslangicBeden(Kabuk.Ayar, ic().depo, baslangic.beden);
    ic().depo.setItem(BASLANGIC_IZ, baslangic.kimlik);
    baslangicBitti = (r.say.not + r.say.kayit + r.say.kart + bedenSay) ? 'Getirildi: ' + [baslangicMetni(r.say), bedenSay ? bedenSay + ' beden bilgisi (Ayarlar › Beden)' : ''].filter(Boolean).join(', ') +
      '. Not ve Kayıt araçlarında görünür.' : 'Bu kayıtlar zaten buradaydı.';
    baslangic = null;
    ic().rota();
    var el = d.querySelector('[data-baslangic="bitti"]'); if (el) el.focus();
  }

  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.soru = function (yer) { if (soruSonuc) { var h = sayfaSoruSonuc(yer); soruSonuc = null; return h; } return sayfaSoru(yer); };
  Kabuk.ek.plan = sayfaPlan;
  Kabuk.ek.kayit = sayfaKayit;
  Kabuk.ek.not = sayfaNot; Kabuk.ek.tekrar = sayfaTekrar; Kabuk.ek.yol = sayfaYol;

  /* ---- olaylar (yalnız bu dosyanın çizdiği öğeler) ---- */
  d.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.matches('form.notform')) { e.preventDefault(); notFormKaydet(f); }
    else if (f.matches('form.aracform')) { e.preventDefault(); aracFormKaydet(f); }
    else if (f.matches('form.kartform')) { e.preventDefault(); kartEkle(f); }
    else if (f.matches('form.kayitform')) { e.preventDefault(); kayitGonder(f); }
    else if (f.matches('form.planform')) { e.preventDefault(); planFormu(f); }
  });
  d.addEventListener('input', function (e) {
    if (e.target.matches('[data-not-ara]')) d.getElementById('not-liste').innerHTML = notListesi(oku(NOT_ANAHTAR, []), e.target.value);
  });
  d.addEventListener('change', function (e) {
    var s = e.target;
    if (s.matches('select[data-kayit-gun]')) { // gün değişince yazılanlar kalır; özet seçili güne geçer
      var fv = {}; [].forEach.call(s.form.elements, function (e) { if (e.name && e.name !== 'tahmin' && e.name !== 'gun' && e.name !== 'kayitTur') fv[e.name] = e.value; });
      kayitIleti = { form: fv, tahmin: !!(s.form.elements.tahmin && s.form.elements.tahmin.checked) };
      kayitGun = s.value; ic().rota(); var yg = d.querySelector('select[data-kayit-gun]'); if (yg) yg.focus(); return; }
    if (s.matches('select[data-kayit-tur]')) { kayitTur = s.value; ic().rota(); var ys = d.querySelector('select[data-kayit-tur]'); if (ys) ys.focus(); return; }
    if (!s.matches('select[data-bag-ekle]') || !s.value) return;
    var n = oku(NOT_ANAHTAR, []).filter(function (x) { return x.id === s.value; })[0], t = s.form.elements.govde;
    if (n) { var bag = Not.bagYaz(n.id, Not.ad(n)), i = t.selectionStart == null ? t.value.length : t.selectionStart; t.value = t.value.slice(0, i) + bag + t.value.slice(t.selectionEnd == null ? i : t.selectionEnd); }
    s.value = ''; t.focus();
  });
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-arac-ac]:not([aria-disabled="true"])'); // kilitli soru şıkkı odakta kalır, tıklaması yok sayılır
    if (!b) return;
    var ne = b.getAttribute('data-arac-ac'), I = ic();
    if (ne === 'not-sil') {
      if (!confirm('Bu not silinsin mi? Geri alınamaz.')) return;
      yaz(NOT_ANAHTAR, oku(NOT_ANAHTAR, []).filter(function (n) { return n.id !== b.getAttribute('data-id'); }));
      return I.git('#/motor/not');
    }
    if (ne === 'baslangic-getir') return baslangicGetir();
    if (ne === 'baslangic-sonra') { baslangic = null; return ic().rota(); } // bu açılışta sorma; sonraki açılışta yine sorulur
    if (ne.indexOf('soru-') === 0) return soruEylem(ne, b);
    if (ne.indexOf('plan-') === 0) {
      var simdiP = Date.now(), dr = planDurum(simdiP), gunP = gunAdi(simdiP);
      if (ne === 'plan-kur') {
        var r = planKur(Plan, dr, gunP, planEk(simdiP));
        return r.ok ? planYaz({ ayar: dr.ayar, isler: dr.isler, gunPlan: { gun: gunP, plan: r.plan } }) : planHata(r.hatalar);
      }
      if (ne === 'plan-durum') {
        var hedef = b.getAttribute('data-durum'), veriD = { durum: hedef };
        if (hedef === 'atlandi') { veriD.neden = prompt('Neden atlıyorsun? (kısa bir not)'); if (veriD.neden == null) return; }
        var rd = Plan.durumYaz(dr.gunPlan.plan, b.getAttribute('data-id'), veriD);
        return rd.ok ? planYaz({ ayar: dr.ayar, isler: dr.isler, gunPlan: { gun: dr.gunPlan.gun, plan: rd.plan } }) : planHata([rd.neden]);
      }
      if (ne === 'plan-aralik-sil') return planYaz({ ayar: Object.assign({}, dr.ayar, { musait: dr.ayar.musait.filter(function (_, i) { return i !== +b.getAttribute('data-i'); }) }), isler: dr.isler, gunPlan: dr.gunPlan });
      if (ne === 'plan-sabit-sil') { yaz(PLAN_SABLON, { sabitler: planSablon().sabitler.filter(function (s) { return s.id !== b.getAttribute('data-id'); }) }); return I.rota(); }
      if (ne === 'plan-is-sil') return planYaz({ ayar: dr.ayar, gunPlan: dr.gunPlan, isler: dr.isler.filter(function (x) { return x.id !== b.getAttribute('data-id'); }) });
    }
    if (ne === 'kayit-sil') {
      if (!confirm('Bu kayıt silinsin mi?')) return;
      yaz(KAYIT_ANAHTAR, oku(KAYIT_ANAHTAR, []).filter(function (r) { return r.id !== b.getAttribute('data-id'); }));
      return I.rota();
    }
    if (ne === 'kart-goster') { gosterilen = b.closest('[data-kart]').getAttribute('data-kart'); I.rota(); var a = d.querySelector('.b-kart__arka'); if (a) a.focus({ preventScroll: true }); return; }
    if (ne === 'kart-not') {
      var simdi = Date.now(), r = kartCevapla(Tekrar, oku(KART_ANAHTAR, []), b.closest('[data-kart]').getAttribute('data-kart'), +b.getAttribute('data-not'), simdi, sayac(simdi));
      if (r.ok) { yaz(KART_ANAHTAR, r.kartlar); yaz(SAYAC_ANAHTAR, r.sayac); }
      gosterilen = null; return I.rota();
    }
    if (ne === 'kart-sil') {
      if (!confirm('Bu kart silinsin mi? Tekrar geçmişi de gider.')) return;
      yaz(KART_ANAHTAR, oku(KART_ANAHTAR, []).filter(function (x) { return x.id !== b.getAttribute('data-id'); }));
      return I.rota();
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
