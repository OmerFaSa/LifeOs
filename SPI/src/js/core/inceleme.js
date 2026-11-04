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
window.LIFEOS.PARCA.yazilar({
  'spi.core.inceleme.birliktelik-neden-degil-bask':'Birliktelik, neden değil: başka şeyler de aynı günlerde değişmiş olabilir.',
});

window.LIFEOS.PARCA.yazilar({
  'spi.core.inceleme.hesaplandi':'hesaplandı',
  'spi.core.inceleme.kisa-geceden-sonra-toparlanm':'Kısa geceden sonra toparlanma',
  'spi.core.inceleme.7-saatten-az-uyunan-geceleri':'7 saatten az uyunan gecelerin ertesi',
  'spi.core.inceleme.7-saat-ve-ustu':'7 saat ve üstü',
  'spi.core.inceleme.hareketli-gunun-gecesi':'Hareketli günün gecesi',
  'spi.core.inceleme.hareket-girilen-gunlerin-gec':'hareket girilen günlerin gecesi',
  'spi.core.inceleme.hareket-girilmeyen-gunlerin':'hareket girilmeyen günlerin gecesi',
  'spi.core.inceleme.gunduz-kisa-uykusu-ve-gece':'Gündüz kısa uykusu ve gece uykusu',
  'spi.core.inceleme.onceki-gun-kisa-uyku-olan':'önceki gün kısa uyku olan geceler',
  'spi.core.inceleme.kisa-uyku-olmayan':'kısa uyku olmayan',
  'spi.core.inceleme.protein-hedefi-ve-ertesi-gun':'Protein hedefi ve ertesi gün',
  'spi.core.inceleme.protein-hedefinin-tuttugu-gu':'protein hedefinin tuttuğu günlerin ertesi',
  'spi.core.inceleme.tutmadigi-gunlerin-ertesi':'tutmadığı günlerin ertesi',
  'spi.core.inceleme.toparlanma-ortalamasi':'Toparlanma ortalaması',
  'spi.core.inceleme.gece-uykusu-ortalamasi':'Gece uykusu ortalaması',
  'spi.core.inceleme.hareket-seansi':'Hareket seansı',
  'spi.core.inceleme.olculdu':'ölçüldü',
  'spi.core.inceleme.ogun-girilen-gun':'Öğün girilen gün',
  'spi.core.inceleme.asgari-gun':'Asgari gün',
});


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
    return { id:o.id, baslik:o.baslik, acik:true, etiket:yz('spi.core.inceleme.hesaplandi'),
      a:{ ad:o.a.ad, ort:ma, n:na }, b:{ ad:o.b.ad, ort:mb, n:nb }, fark, birim:o.birim,
      metin:o.a.ad + ' ' + yaz(ma) + ' ' + o.birim + ' (' + na + ' gün), ' + o.b.ad + ' ' + yaz(mb) + ' ' + o.birim + ' (' + nb + ' gün)'
        + '; fark ' + (fark >= 0 ? '+' : '−') + yaz(Math.abs(fark)) + ' ' + o.birim + '.',
      not:yz('spi.core.inceleme.birliktelik-neden-degil-bask') };
  }

  /* Fikirler: kullanıcının kendi kaydından karşılaştırmalar. */
  function fikirler(){
    const out = [];
    /* 1 — Kısa gece → ertesi gün toparlanma */
    {
      const a = [], b = [];
      seri(uyku).forEach(x => { const t = toparlanma(ertesi(x.d)); if(t == null) return; (x.v < 7 ? a : b).push(t); });
      out.push(karsilastir({ id:'uyku-toparlanma', baslik:yz('spi.core.inceleme.kisa-geceden-sonra-toparlanm'),
        a:{ ad:yz('spi.core.inceleme.7-saatten-az-uyunan-geceleri'), l:a }, b:{ ad:yz('spi.core.inceleme.7-saat-ve-ustu'), l:b }, birim:'puan', ondalik:0 }));
    }
    /* 2 — Hareketli gün → o gecenin uykusu */
    {
      const a = [], b = [];
      for(let i = 2; i <= PENCERE; i++){
        const d = gun(i), u = uyku(ertesi(d));
        if(u == null) continue;
        (hareketDk(d) ? a : b).push(u);
      }
      out.push(karsilastir({ id:'hareket-uyku', baslik:yz('spi.core.inceleme.hareketli-gunun-gecesi'),
        a:{ ad:yz('spi.core.inceleme.hareket-girilen-gunlerin-gec'), l:a }, b:{ ad:yz('spi.core.inceleme.hareket-girilmeyen-gunlerin'), l:b }, birim:'saat' }));
    }
    /* 3 — Kısa uyku → gece uykusu */
    {
      const a = [], b = [];
      seri(uyku).forEach(x => { const onceki = U().iso(U().addDays(U().parse(x.d), -1)); (kestirmeVar(onceki) ? a : b).push(x.v); });
      out.push(karsilastir({ id:'kestirme-gece', baslik:yz('spi.core.inceleme.gunduz-kisa-uykusu-ve-gece'),
        a:{ ad:yz('spi.core.inceleme.onceki-gun-kisa-uyku-olan'), l:a }, b:{ ad:yz('spi.core.inceleme.kisa-uyku-olmayan'), l:b }, birim:'saat' }));
    }
    /* 4 — Protein hedefi → ertesi gün toparlanma */
    {
      const a = [], b = [];
      for(let i = 2; i <= PENCERE; i++){
        const d = gun(i), p = proteinTuttu(d), t = toparlanma(ertesi(d));
        if(p == null || t == null) continue;
        (p ? a : b).push(t);
      }
      out.push(karsilastir({ id:'protein-toparlanma', baslik:yz('spi.core.inceleme.protein-hedefi-ve-ertesi-gun'),
        a:{ ad:yz('spi.core.inceleme.protein-hedefinin-tuttugu-gu'), l:a }, b:{ ad:yz('spi.core.inceleme.tutmadigi-gunlerin-ertesi'), l:b }, birim:'puan', ondalik:0 }));
    }
    return out;
  }

  /* Haftanın sayıları (kayıttan). Eksik olan «veri yok» kalır. */
  function hafta(){
    const r = SP.Calc.weeklyReport();
    const uykular = r.days.map(uyku).filter(v => v != null);
    return [
      { ad:yz('spi.core.inceleme.toparlanma-ortalamasi'), deger:r.readiness.avg, birim:'/100', n:r.readiness.n, etiket:r.readiness.avg == null ? 'veri yok' : 'hesaplandı' },
      { ad:yz('spi.core.inceleme.gece-uykusu-ortalamasi'), deger:uykular.length ? U().round(ort(uykular), 1) : null, birim:'sa', n:uykular.length, etiket:uykular.length ? 'hesaplandı' : 'veri yok' },
      { ad:yz('spi.core.inceleme.hareket-seansi'), deger:r.movement.sessions, birim:'seans', n:null, etiket:yz('spi.core.inceleme.olculdu') },
      { ad:yz('spi.core.inceleme.ogun-girilen-gun'), deger:r.nutrition.loggedDays, birim:'/7', n:null, etiket:yz('spi.core.inceleme.olculdu') },
      { ad:yz('spi.core.inceleme.asgari-gun'), deger:r.discipline.minDays, birim:'/7', n:null, etiket:yz('spi.core.inceleme.hesaplandi') },
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
