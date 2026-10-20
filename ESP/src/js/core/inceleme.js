/* İNCELEME — Ofis › Toplantı'nın yerine geçen veri incelemesi (ESP).

   Kullanıcı (2026-10-20, SPİ için): «Ofis toplantısı yüzeysel ve uydurma.
   Ya kaldır ya da gerçekten sistemin kendi verisi üzerinde düşünüp fikir
   ürettiği profesyonel bir yere dönüştür.» ESP'nin toplantısı da aynı
   yapıdaydı (altı uzman sırayla konuşur, Patron kapatır); aynı karar burada
   da uygulandı (gerekçe SPI/src/js/core/inceleme.js başında).

   Altındaki sağlam parçalar korunur: kural motorunun puanladığı gündem
   (Office.agendaCandidates), disiplinler arası bulgular
   (Planner.crossFindings) ve tek karar (Planner.nextAction). Yeni olan,
   kullanıcının kendi oturum kaydından İKİ GRUP KARŞILAŞTIRMASI.

   Sözler:
     1. HER SAYI KAYITTAN. Girilmemiş gün sıfır sayılmaz; gruba hiç girmez.
        Her grubun gün sayısı yazılır. Etiket «hesaplandı».
     2. EŞİK. Her grupta en az ESIK gün yoksa karşılaştırma AÇILMAZ; kaç
        gün daha gerektiği söylenir. Az veriden fikir uydurulmaz.
     3. BİRLİKTELİK, NEDEN DEĞİL. Her fikir bunu söyler.
     4. KARAR KURAL MOTORUNDAN. Model yalnız istenirse özetler. */

window.ESP = window.ESP || {};

ESP.Inceleme = (function(){
  const ESIK = 4;            // grup başına en az gün — iş kuralı, düşük n'de fikir açılmaz
  const PENCERE = 60;
  const UZUN_GUN = 60;       // dk; «uzun gün» eşiği (ertesi gün sürüyor mu)

  const U = () => ESP.U;
  const gun = i => U().iso(U().addDays(U().parse(U().todayISO()), -i));
  const ertesi = d => U().iso(U().addDays(U().parse(d), 1));
  const ort = l => l.length ? l.reduce((a, b) => a + b, 0) / l.length : null;

  /* Günün toplam dakikası; oturum yoksa null (veri yok, sıfır değil). */
  const dakika = d => ESP.Model.minutesOf(d);
  const alanSayisi = d => {
    const s = new Set(ESP.Model.sessionsOf(d).filter(x => x.minutes != null && x.minutesCert !== 'missing').map(x => x.disc));
    return s.size;
  };
  const haftaSonu = d => { const g = U().parse(d).getDay(); return g === 0 || g === 6; };

  /* Dakika ve yüzde tam sayı. */
  function sayi(x){ return Math.round(x).toLocaleString('tr-TR'); }

  /* İki grup karşılaştırması: { a:{ad, l}, b:{ad, l}, birim } → fikir ya da eksik. */
  function karsilastir(o){
    const na = o.a.l.length, nb = o.b.l.length;
    if(na < ESIK || nb < ESIK){
      return { id:o.id, baslik:o.baslik, acik:false, eksik:Math.max(0, ESIK - na) + Math.max(0, ESIK - nb),
        neden:o.a.ad + ': ' + na + ' gün, ' + o.b.ad + ': ' + nb + ' gün; her birinde en az ' + ESIK + ' gün gerekir.' };
    }
    const ma = ort(o.a.l), mb = ort(o.b.l);
    const fark = ma - mb;
    const yaz = x => (o.birim === '%' ? '%' + sayi(x) : sayi(x) + ' ' + o.birim);
    return { id:o.id, baslik:o.baslik, acik:true, etiket:'hesaplandı',
      a:{ ad:o.a.ad, ort:ma, n:na }, b:{ ad:o.b.ad, ort:mb, n:nb }, fark, birim:o.birim,
      metin:o.a.ad + ' ' + yaz(ma) + ' (' + na + ' gün), ' + o.b.ad + ' ' + yaz(mb) + ' (' + nb + ' gün)'
        + '; fark ' + (fark >= 0 ? '+' : '−') + (o.birim === '%' ? sayi(Math.abs(fark)) + ' puan' : yaz(Math.abs(fark))) + '.',
      not:'Birliktelik, neden değil: başka şeyler de aynı günlerde değişmiş olabilir.' };
  }

  function fikirler(){
    const out = [];
    /* 1 — Birden çok alan açılan günler → günün toplam süresi */
    {
      const a = [], b = [];
      for(let i = 1; i <= PENCERE; i++){
        const d = gun(i), m = dakika(d);
        if(m == null) continue;
        (alanSayisi(d) >= 2 ? a : b).push(m);
      }
      out.push(karsilastir({ id:'cok-alan', baslik:'Birden çok alan açılan günler',
        a:{ ad:'iki ve daha çok alan', l:a }, b:{ ad:'tek alan', l:b }, birim:'dk' }));
    }
    /* 2 — Hafta içi / hafta sonu → günlük süre (yalnız kayıtlı günler) */
    {
      const a = [], b = [];
      for(let i = 1; i <= PENCERE; i++){
        const d = gun(i), m = dakika(d);
        if(m == null) continue;
        (haftaSonu(d) ? a : b).push(m);
      }
      out.push(karsilastir({ id:'hafta-sonu', baslik:'Hafta sonu ve hafta içi',
        a:{ ad:'hafta sonu', l:a }, b:{ ad:'hafta içi', l:b }, birim:'dk' }));
    }
    /* 3 — Uzun günden sonra ertesi gün sürüyor mu (kayıt var mı) */
    {
      const a = [], b = [];
      for(let i = 2; i <= PENCERE; i++){
        const d = gun(i), m = dakika(d);
        if(m == null) continue;
        (m >= UZUN_GUN ? a : b).push(dakika(ertesi(d)) != null ? 100 : 0);
      }
      out.push(karsilastir({ id:'ertesi-gun', baslik:'Uzun günün ertesi',
        a:{ ad:UZUN_GUN + ' dk ve üstü günlerin ertesi çalışılan', l:a },
        b:{ ad:'daha kısa günlerin ertesi çalışılan', l:b }, birim:'%' }));
    }
    return out;
  }

  /* Son yedi günün sayıları (kayıttan). Eksik olan «veri yok» kalır. */
  function hafta(){
    const gunler = []; for(let i = 0; i < 7; i++) gunler.push(gun(i));
    const dk = gunler.map(dakika).filter(v => v != null);
    const oturum = gunler.reduce((a, d) => a + ESP.Model.sessionsOf(d).length, 0);
    const r = ESP.SRS.retention();
    const tamam = r && r.cert !== 'missing' && r.value != null;
    return [
      { ad:'Toplam süre', deger:dk.length ? dk.reduce((a, b) => a + b, 0) : null, birim:'dk', n:dk.length, etiket:dk.length ? 'ölçüldü' : 'veri yok' },
      { ad:'Çalışılan gün', deger:dk.length, birim:'/7', n:null, etiket:'ölçüldü' },
      { ad:'Oturum', deger:oturum, birim:'oturum', n:null, etiket:'ölçüldü' },
      { ad:'Kart hatırlama', deger:tamam ? Math.round(r.value * 100) : null, birim:'%', n:tamam ? r.n : null, nBirim:'kart', etiket:tamam ? 'hesaplandı' : 'veri yok' },
      { ad:'Seri', deger:ESP.Model.streak(), birim:'gün', n:null, etiket:'hesaplandı' },
    ];
  }

  function bulgular(){
    const ad = id => { const a = ESP.AGENT_BY_ID && ESP.AGENT_BY_ID[id]; return a ? a.name : id; };
    return ESP.Planner.crossFindings().map(c => ({ id:c.id, kimden:ad(c.from), kime:ad(c.to), text:c.text, route:c.route }));
  }

  function rapor(){
    return { tarih:U().todayISO(), hafta:hafta(), gundem:ESP.Office.agendaCandidates(), fikirler:fikirler(),
      bulgular:bulgular(), karar:ESP.Planner.nextAction() };
  }

  return { ESIK, PENCERE, UZUN_GUN, sayi, karsilastir, fikirler, hafta, bulgular, rapor };
})();
