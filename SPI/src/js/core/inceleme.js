/* İNCELEME — Ofis › Toplantı'nın yerine geçen veri incelemesi.

   Kullanıcı (2026-10-20): «Ofis toplantısı yüzeysel ve uydurma. Ya kaldır
   ya da gerçekten sistemin kendi verisi üzerinde düşünüp fikir ürettiği
   profesyonel bir yere dönüştür.»

   KARAR: dönüştürüldü. Eski toplantıda dört ajan sırayla konuşuyordu; model
   yokken her biri kendi rapor cümlesini gündemden bağımsız tekrarlıyordu,
   modelle de veride olmayanı tartışma gibi sunabiliyordu. Oysa altında iki
   sağlam parça vardı: kural motorunun puanladığı gündem (Office.agendaCandidates)
   ve gün sayısına göre eşikli korelasyon bulguları (Calc.crossFindings).
   İnceleme yalnız bunları ve kayıttan yapılan KARŞILAŞTIRMALARI gösterir.

   Sözler:
     1. HER SAYI KAYITTAN. Fikir iki grubun ortalamasıdır (ör. 7 saatten
        az uyunan gecelerin ertesi toparlanması ile öteki geceler); her
        grubun gün sayısı yazılır. Etiket «hesaplandı».
     2. EŞİK. Her grupta en az ESIK gün yoksa fikir AÇILMAZ; kaç gün daha
        gerektiği söylenir («veri yetmiyor»). Az veriden fikir uydurulmaz.
     3. BİRLİKTELİK, NEDEN DEĞİL. Her fikir bunu söyler; teşhis yok,
        doz yok (AGENTS §1.5).
     4. KARAR KURAL MOTORUNDAN. Tek karar Calc.nextAction'dır; model
        yalnız istenirse özetler. */

window.SP = window.SP || {};

SP.Inceleme = (function(){
  const ESIK = 4;            // grup başına en az gün — iş kuralı, düşük n'de fikir açılmaz
  const PENCERE = 60;

  const U = () => SP.U;
  const gun = i => U().iso(U().addDays(U().today(), -i));
  const ort = l => l.length ? l.reduce((a, b) => a + b, 0) / l.length : null;

  function seri(fn){
    const out = [];
    for(let i = 1; i <= PENCERE; i++){ const d = gun(i); const v = fn(d); if(v != null) out.push({ d, v }); }
    return out;
  }
  const uyku = d => { const v = SP.S.vitals[d]; return v && v.sleep != null ? Number(v.sleep) : null; };
  const toparlanma = d => { const r = SP.Move.readiness(d); return r.ok ? r.score : null; };
  const hareketDk = d => { const l = SP.Model.workoutsOf(d); return l.length ? l.reduce((a, w) => a + (Number(w.minutes) || 0), 0) : null; };
  const ertesi = d => U().iso(U().addDays(U().parse(d), 1));
  const kestirmeVar = d => SP.Uyku ? SP.Uyku.liste(d).length > 0 : false;
  const proteinTuttu = d => {
    const t = SP.Nutri.dayTotals(d);
    const h = SP.Nutri.targets();
    return t.empty || !h.ok ? null : t.protein >= h.protein.min;
  };

  /* Puan tam sayı, saat tek ondalık (Türkçe virgül). */
  function sayi(x, birim){
    const n = birim === 'puan' ? Math.round(x) : Math.round(x * 10) / 10;
    return n.toLocaleString('tr-TR', { maximumFractionDigits:1 });
  }

  /* İki grup karşılaştırması: { a:{ad, l}, b:{ad, l}, birim } → fikir ya da eksik. */
  function karsilastir(o){
    const na = o.a.l.length, nb = o.b.l.length;
    if(na < ESIK || nb < ESIK){
      return { id:o.id, baslik:o.baslik, acik:false, eksik:Math.max(0, ESIK - na) + Math.max(0, ESIK - nb),
        neden:o.a.ad + ': ' + na + ' gün, ' + o.b.ad + ': ' + nb + ' gün; her birinde en az ' + ESIK + ' gün gerekir.' };
    }
    const ma = ort(o.a.l), mb = ort(o.b.l);
    const fark = ma - mb;
    const yaz = x => sayi(x, o.birim);
    return { id:o.id, baslik:o.baslik, acik:true, etiket:'hesaplandı',
      a:{ ad:o.a.ad, ort:ma, n:na }, b:{ ad:o.b.ad, ort:mb, n:nb }, fark, birim:o.birim,
      metin:o.a.ad + ' ' + yaz(ma) + ' ' + o.birim + ' (' + na + ' gün), ' + o.b.ad + ' ' + yaz(mb) + ' ' + o.birim + ' (' + nb + ' gün)'
        + '; fark ' + (fark >= 0 ? '+' : '−') + yaz(Math.abs(fark)) + ' ' + o.birim + '.',
      not:'Birliktelik, neden değil: başka şeyler de aynı günlerde değişmiş olabilir.' };
  }

  /* Fikirler: kullanıcının kendi kaydından karşılaştırmalar. */
  function fikirler(){
    const out = [];
    /* 1 — Kısa gece → ertesi gün toparlanma */
    {
      const a = [], b = [];
      seri(uyku).forEach(x => { const t = toparlanma(ertesi(x.d)); if(t == null) return; (x.v < 7 ? a : b).push(t); });
      out.push(karsilastir({ id:'uyku-toparlanma', baslik:'Kısa geceden sonra toparlanma',
        a:{ ad:'7 saatten az uyunan gecelerin ertesi', l:a }, b:{ ad:'7 saat ve üstü', l:b }, birim:'puan', ondalik:0 }));
    }
    /* 2 — Hareketli gün → o gecenin uykusu */
    {
      const a = [], b = [];
      for(let i = 2; i <= PENCERE; i++){
        const d = gun(i), u = uyku(ertesi(d));
        if(u == null) continue;
        (hareketDk(d) ? a : b).push(u);
      }
      out.push(karsilastir({ id:'hareket-uyku', baslik:'Hareketli günün gecesi',
        a:{ ad:'hareket girilen günlerin gecesi', l:a }, b:{ ad:'hareket girilmeyen günlerin gecesi', l:b }, birim:'saat' }));
    }
    /* 3 — Kısa uyku → gece uykusu */
    {
      const a = [], b = [];
      seri(uyku).forEach(x => { const onceki = U().iso(U().addDays(U().parse(x.d), -1)); (kestirmeVar(onceki) ? a : b).push(x.v); });
      out.push(karsilastir({ id:'kestirme-gece', baslik:'Gündüz kısa uykusu ve gece uykusu',
        a:{ ad:'önceki gün kısa uyku olan geceler', l:a }, b:{ ad:'kısa uyku olmayan', l:b }, birim:'saat' }));
    }
    /* 4 — Protein hedefi → ertesi gün toparlanma */
    {
      const a = [], b = [];
      for(let i = 2; i <= PENCERE; i++){
        const d = gun(i), p = proteinTuttu(d), t = toparlanma(ertesi(d));
        if(p == null || t == null) continue;
        (p ? a : b).push(t);
      }
      out.push(karsilastir({ id:'protein-toparlanma', baslik:'Protein hedefi ve ertesi gün',
        a:{ ad:'protein hedefinin tuttuğu günlerin ertesi', l:a }, b:{ ad:'tutmadığı günlerin ertesi', l:b }, birim:'puan', ondalik:0 }));
    }
    return out;
  }

  /* Haftanın sayıları (kayıttan). Eksik olan «veri yok» kalır. */
  function hafta(){
    const r = SP.Calc.weeklyReport();
    const uykular = r.days.map(uyku).filter(v => v != null);
    return [
      { ad:'Toparlanma ortalaması', deger:r.readiness.avg, birim:'/100', n:r.readiness.n, etiket:r.readiness.avg == null ? 'veri yok' : 'hesaplandı' },
      { ad:'Gece uykusu ortalaması', deger:uykular.length ? U().round(ort(uykular), 1) : null, birim:'sa', n:uykular.length, etiket:uykular.length ? 'hesaplandı' : 'veri yok' },
      { ad:'Hareket seansı', deger:r.movement.sessions, birim:'seans', n:null, etiket:'ölçüldü' },
      { ad:'Öğün girilen gün', deger:r.nutrition.loggedDays, birim:'/7', n:null, etiket:'ölçüldü' },
      { ad:'Asgari gün', deger:r.discipline.minDays, birim:'/7', n:null, etiket:'hesaplandı' },
    ];
  }

  /* Planların uyumu (core/haftaplan.js). */
  function planlar(){
    const HP = SP.HaftaPlan;
    if(!HP) return [];
    return HP.liste().map(p => ({ ad:p.ad || HP.TUR_BY_ID[p.tur].ad, uyum:HP.uyum(p) }));
  }

  /* Bulgular: belirgin olanlar ayrı, veri bekleyenler sayılır. */
  function bulgular(){
    const l = SP.Calc.crossFindings();
    return { belirgin:l.filter(f => f.ok && !f.weak), zayif:l.filter(f => f.ok && f.weak), bekleyen:l.filter(f => !f.ok) };
  }

  function rapor(){
    return { tarih:U().todayISO(), hafta:hafta(), gundem:SP.Office.agendaCandidates(), fikirler:fikirler(),
      bulgular:bulgular(), planlar:planlar(), karar:SP.Calc.nextAction() };
  }

  return { ESIK, PENCERE, sayi, karsilastir, fikirler, hafta, planlar, bulgular, rapor };
})();
