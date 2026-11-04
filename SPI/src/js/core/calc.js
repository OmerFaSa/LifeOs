/* Orkestratorun kural motoru — capraz cikarim ve siradaki hamle.

   Dort uzman kendi alanini hesaplar; bu dosya onlari BIR ARAYA getirir.
   Patron ajan buradan beslenir ve buradaki karari degistiremez, yalnizca
   gerekcelendirir.

   Iki temel cikti vardir:

     nextAction()     Tek bir oncelik. Sira SP.PRECEDENCE ile aynidir ve
                      tartisilmaz: kirmizi bayrak → guvenlik → olcum borcu →
                      besin acigi → antrenman → butce.

     crossFindings()  Alanlar arasi baglar. PDF'teki ornek burada yasar:
                      "Butceyi %10 astik fakat protein tutarliligi ve
                      toparlanma skoru son iki ayin zirvesinde."

   Korelasyon nedensellik degildir ve oyle sunulmaz: bulgu daima "birlikte
   hareket ediyor" diliyle yazilir, "sebep oldu" diliyle degil. */
window.LIFEOS.PARCA.yazilar({
  'spi.core.calc.profilde-kilo-yok':'Profilde kilo yok',
  'spi.core.calc.kirmizi-bayrak':'Kırmızı bayrak',
  'spi.core.calc.hekime-basvur-ve-bayragi-gor':'Hekime başvur ve bayrağı gördüğünü işaretle.',
  'spi.core.calc.bugun-antrenman-yok':'Bugün antrenman yok',
  'spi.core.calc.yuku-sifirla-dinlen':'Yükü sıfırla, dinlen.',
  'spi.core.calc.yuk-alistiginin-ustunde':'Yük alıştığının üstünde',
  'spi.core.calc.bu-hafta-yuku-indir':'Bu hafta yükü indir.',
  'spi.core.calc.bugunun-olcumu-girilmedi':'Bugünün ölçümü girilmedi',
  'spi.core.calc.toparlanma-skoru-en-az-uyku':'Toparlanma skoru en az uyku süresiyle hesaplanır; onsuz günün yükü körlemesine verilir.',
  'spi.core.calc.uyku-ve-nabzi-gir':'Uyku ve nabzı gir.',
  'spi.core.calc.tahlil-sonucunu-gir':'Tahlil sonucunu gir.',
  'spi.core.calc.son-7-gunun-ortalamasi-hedef':'Son 7 günün ortalaması hedefin altında.',
  'spi.core.calc.kaynaklari-gor-ve-ogune-ekle':'Kaynakları gör ve öğüne ekle.',
  'spi.core.calc.bugun-hic-ogun-girilmedi':'Bugün hiç öğün girilmedi',
  'spi.core.calc.girilmemis-gun-ortalamaya-ka':'Girilmemiş gün ortalamaya katılmaz; kayıt olmadan açık da görülmez.',
  'spi.core.calc.ogunu-sesli-ya-da-yazarak':'Öğünü sesli ya da yazarak ekle.',
  'spi.core.calc.bugunun-antrenmani':'Bugünün antrenmanı',
  'spi.core.calc.toparlanma-uygun':'Toparlanma uygun.',
  'spi.core.calc.seansi-baslat':'Seansı başlat.',
  'spi.core.calc.sepet-gozden-gecirilmeli':'Sepet gözden geçirilmeli',
  'spi.core.calc.i-kame-onerilerine-bak':'İkame önerilerine bak.',
  'spi.core.calc.siradaki-hamle-yok':'Sıradaki hamle yok',
  'spi.core.calc.bayrak-yok-olcum-guncel-acik':'Bayrak yok, ölçüm güncel, açık yok ve günün yükü tamam.',
  'spi.core.calc.serilerden-biri-hic-degismiy':'Serilerden biri hiç değişmiyor.',
  'spi.core.calc.uyku-ve-toparlanma':'Uyku ve toparlanma',
  'spi.core.calc.uzun-uyudugun-gunlerde-hrv-y':'Uzun uyuduğun günlerde HRV yükseliyor.',
  'spi.core.calc.uyku-suresiyle-hrv-ters-hare':'Uyku süresiyle HRV ters hareket ediyor; ölçüm saatini kontrol et.',
  'spi.core.calc.yuk-ve-ertesi-gun-toparlanma':'Yük ve ertesi gün toparlanması',
  'spi.core.calc.agir-yuklenilen-gunlerde-top':'Ağır yüklenilen günlerde toparlanma skoru da yüksek — yük taşınıyor.',
  'spi.core.calc.agir-gunlerde-toparlanma-bel':'Ağır günlerde toparlanma belirgin düşüyor; yük bandın üstünde.',
  'spi.core.calc.protein-ve-toparlanma':'Protein ve toparlanma',
  'spi.core.calc.protein-aldigin-gunlerde-top':'Protein aldığın günlerde toparlanma daha iyi.',
  'spi.core.calc.protein-ile-toparlanma-arasi':'Protein ile toparlanma arasında ters bir hareket var.',
  'spi.core.calc.sodyum-ve-tansiyon':'Sodyum ve tansiyon',
  'spi.core.calc.tuz-aliminin-yuksek-oldugu-g':'Tuz alımının yüksek olduğu günlerde sistolik tansiyon da yükseliyor.',
  'spi.core.calc.sodyum-ile-tansiyon-arasinda':'Sodyum ile tansiyon arasında beklenen yönde bir hareket görünmüyor.',
  'spi.core.calc.kalori-ve-kilo':'Kalori ve kilo',
  'spi.core.calc.kalori-alimi-ile-kilo-ayni':'Kalori alımı ile kilo aynı yönde hareket ediyor.',
  'spi.core.calc.kalori-ile-kilo-ters-hareket':'Kalori ile kilo ters hareket ediyor; tartım koşulları değişiyor olabilir.',
  'spi.core.calc.uyku-ve-istah':'Uyku ve iştah',
  'spi.core.calc.az-uyudugun-gunlerde-kalori':'Az uyuduğun günlerde kalori alımı artıyor.',
  'spi.core.calc.uyku-ile-kalori-arasinda-bel':'Uyku ile kalori arasında belirgin bir bağ yok.',
  'spi.core.calc.ortak-gun-sayisi-yetersiz':'Ortak gün sayısı yetersiz (',
  'spi.core.calc.i-ki-olcum-de-ayni-gunlerde':'İki ölçüm de aynı günlerde girilmeli.',
  'spi.core.calc.belirgin-bir-birliktelik-yok':'Belirgin bir birliktelik yok (r=',
  'spi.core.calc.hafta-icin-yeterli-kayit-yok':'Hafta için yeterli kayıt yok.',
  'spi.core.calc.hafta-temiz':'Hafta temiz: ',
  'spi.core.calc.hafta-zorlandi':'Hafta zorlandı: ',
});


window.SP = window.SP || {};

SP.Calc = (function(){
  const U = SP.U;

  /* --------------------------------------------------------------- gunluk */

  /* Asgari gun standardi — kotu gunun alt siniri.
     Dordunu tutturan gun kayipsiz sayilir. */
  function minimumDay(dateISO){
    const d = dateISO || U.todayISO();
    const v = SP.S.vitals[d] || {};
    const totals = SP.Nutri.dayTotals(d);
    const kilo = SP.Model.kiloOf();
    const proteinFloor = kilo ? Math.round(1.2 * kilo.kg) : null;
    const moveMin = U.sum(SP.Model.workoutsOf(d).map(w => w.minutes || 0));

    const rows = [
      { id:'protein', label:SP.MINIMUM_DAY.protein,
        ok:proteinFloor != null && totals.protein >= proteinFloor,
        known:proteinFloor != null && !totals.empty,
        detail:proteinFloor == null ? yz('spi.core.calc.profilde-kilo-yok')
          : Math.round(totals.protein) + ' / ' + proteinFloor + ' g' },
      { id:'water', label:SP.MINIMUM_DAY.water,
        ok:(v.water || 0) >= 2000, known:v.water != null,
        detail:v.water != null ? U.fmtNum(v.water) + ' / 2.000 ml' : 'girilmedi' },
      { id:'move', label:SP.MINIMUM_DAY.move,
        ok:moveMin >= SP.LOAD_RULES.minDay.minutes, known:true,
        detail:moveMin + ' / ' + SP.LOAD_RULES.minDay.minutes + ' dk' },
      { id:'sleep', label:SP.MINIMUM_DAY.sleep,
        ok:v.sleep != null && v.sleep >= 7, known:v.sleep != null,
        detail:v.sleep != null ? U.fmtNet(v.sleep) + ' / 7 sa' : 'girilmedi' },
    ];
    const done = rows.filter(r => r.ok).length;
    return { rows, done, total:rows.length, complete:done === rows.length, note:SP.MINIMUM_DAY.note };
  }

  /* Davranis serisi — asgari gunu ust uste kac gun tutturdun.
     Odul olcume degil DAVRANISA baglidir: tek gunun iyi tahlili degil,
     surdurulen duzen odullendirilir. */
  function streak(){
    let n = 0;
    for(let i = 0; i < 365; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      /* Bugun henuz bitmedi: tamamlanmamis olmasi seriyi kirmaz. */
      if(i === 0 && !minimumDay(d).complete) continue;
      if(minimumDay(d).complete) n++;
      /* Dondurulmus gun (hasta, izin, tatil — brand/ortak/seri.js) bozmaz. */
      else if(SP.Seri && SP.Seri.donmusMu(d)) continue;
      else break;
    }
    return n;
  }

  /* Gunun butun modullerden ozeti. */
  function dayStatus(dateISO){
    const d = dateISO || U.todayISO();
    return {
      date:d,
      vitals:SP.S.vitals[d] || null,
      nutrition:SP.Nutri.dayTotals(d),
      targets:SP.Nutri.targets(),
      prescription:SP.Move.prescription(d),
      minimum:minimumDay(d),
      flags:SP.Model.openFlags(),
      money:SP.Money.status(),
    };
  }

  /* ---------------------------------------------------------- siradaki hamle

     Sira SP.PRECEDENCE'tir. Ilk eslesen doner; digerleri beklemeye gecer.
     Her hamle nereye gidecegini (route) ve NEDEN geldigini (why) tasir —
     gerekcesiz bir emir sistemin isi degildir. */
  function nextAction(){
    const d = U.todayISO();

    /* 1 — kirmizi bayrak */
    const flags = SP.Model.openFlags().filter(f => !f.ack);
    if(flags.length){
      return { id:'flag', rank:1, tone:'danger', icon:'warn',
        label:yz('spi.core.calc.kirmizi-bayrak'), title:flags[0].label,
        why:flags[0].detail, route:'labs',
        action:yz('spi.core.calc.hekime-basvur-ve-bayragi-gor') };
    }

    /* 2 — guvenlik: asiri yuklenme ve ates */
    const rx = SP.Move.prescription(d);
    if(rx.readiness.ok && rx.readiness.override){
      return { id:'override', rank:2, tone:'danger', icon:'heart',
        label:'Güvenlik', title:yz('spi.core.calc.bugun-antrenman-yok'),
        why:rx.readiness.override.why, route:'move',
        action:yz('spi.core.calc.yuku-sifirla-dinlen') };
    }
    if(rx.acwr.ok && rx.acwr.zone === 'high'){
      return { id:'overreach', rank:2, tone:'warn', icon:'dumbbell',
        label:'Güvenlik', title:yz('spi.core.calc.yuk-alistiginin-ustunde'),
        why:rx.acwr.note + ' Oran ' + U.fmtNet(rx.acwr.ratio) + '.', route:'move',
        action:yz('spi.core.calc.bu-hafta-yuku-indir') };
    }

    /* 3 — olcum borcu */
    const v = SP.S.vitals[d];
    if(!v || v.sleep == null){
      return { id:'vitals', rank:3, tone:'info', icon:'pulse',
        label:'Ölçüm', title:yz('spi.core.calc.bugunun-olcumu-girilmedi'),
        why:yz('spi.core.calc.toparlanma-skoru-en-az-uyku'),
        route:'today', action:yz('spi.core.calc.uyku-ve-nabzi-gir') };
    }
    const due = SP.Bio.overdue();
    if(due.length){
      return { id:'panel', rank:3, tone:'info', icon:'flask',
        label:'Ölçüm', title:(/paneli$/i.test(due[0].panel.name)
          ? due[0].panel.name : due[0].panel.name + ' paneli') + ' bekliyor',
        why:due[0].note + ' Eğilim okumak için düzenli aralık gerekir.',
        route:'labs', action:yz('spi.core.calc.tahlil-sonucunu-gir') };
    }

    /* 4 — besin acigi */
    const g = SP.Nutri.gaps(7);
    if(g.ok && g.rows.length){
      const worst = g.rows[0];
      return { id:'gap', rank:4, tone:'warn', icon:'leaf',
        label:'Beslenme', title:worst.nutrient.name + ' hedefin %' + worst.pct + '\'inde',
        why:(worst.why ? worst.why + ' ' : '') + yz('spi.core.calc.son-7-gunun-ortalamasi-hedef'),
        route:'meals', action:yz('spi.core.calc.kaynaklari-gor-ve-ogune-ekle') };
    }
    if(!SP.Model.mealsOf(d).length){
      return { id:'meal', rank:4, tone:'info', icon:'meal',
        label:'Beslenme', title:yz('spi.core.calc.bugun-hic-ogun-girilmedi'),
        why:yz('spi.core.calc.girilmemis-gun-ortalamaya-ka'),
        route:'meals', action:yz('spi.core.calc.ogunu-sesli-ya-da-yazarak') };
    }

    /* 5 — antrenman */
    if(rx.kind !== 'rest' && !rx.done){
      const t = rx.suggest[0];
      return { id:'workout', rank:5, tone:'ok', icon:'dumbbell',
        label:'Hareket', title:t ? t.name : yz('spi.core.calc.bugunun-antrenmani'),
        why:rx.reasons.length ? rx.reasons[0].text : yz('spi.core.calc.toparlanma-uygun'),
        route:'move', action:yz('spi.core.calc.seansi-baslat') };
    }

    /* 6 — butce */
    const m = SP.Money.status();
    if(m.tone === 'warn'){
      return { id:'budget', rank:6, tone:'warn', icon:'wallet',
        label:'Bütçe', title:yz('spi.core.calc.sepet-gozden-gecirilmeli'),
        why:m.text, route:'basket', action:yz('spi.core.calc.i-kame-onerilerine-bak') };
    }

    return { id:'calm', rank:99, tone:'ok', icon:'check', calm:true,
      label:'Bugün', title:yz('spi.core.calc.siradaki-hamle-yok'),
      why:yz('spi.core.calc.bayrak-yok-olcum-guncel-acik'),
      route:'today', action:'' };
  }

  /* ------------------------------------------------------------- korelasyon

     Pearson katsayisi. Iki seri ayni gunlerde olculmus olmali; eslesmeyen
     gunler atilir. En az 10 ortak gun sarti vardir — daha azindan cikan
     katsayi rastlantiyi olcer. */
  const MIN_PAIRS = 10;

  function correlate(pairs){
    const xs = pairs.map(p => p[0]), ys = pairs.map(p => p[1]);
    const n = xs.length;
    if(n < MIN_PAIRS) return { ok:false, n };
    const mx = U.sum(xs) / n, my = U.sum(ys) / n;
    let num = 0, dx = 0, dy = 0;
    for(let i = 0; i < n; i++){
      const a = xs[i] - mx, b = ys[i] - my;
      num += a * b; dx += a * a; dy += b * b;
    }
    if(!dx || !dy) return { ok:false, n, note:yz('spi.core.calc.serilerden-biri-hic-degismiy') };
    const r = num / Math.sqrt(dx * dy);
    /* BELİRGİNLİK GÜN SAYISINA BAĞLI (analiz denetimi, 2026-10-17). Eşik
       sabit 0,3 idi: birbirinden bağımsız iki ölçümde |r| ≥ 0,3, 10 günde
       %39, 20 günde %20 olasılıkla rastlantıyla çıkar (simülasyon). Eşik
       artık max(0,3; 2/√n): yaklaşık %5 yanılma (10 gün 0,63 · 20 gün 0,45
       · 30 gün 0,37 · 45+ gün 0,3). */
    const esik = Math.max(0.3, 2 / Math.sqrt(n));
    return { ok:true, n, r:U.round(r, 2), strength:Math.abs(r), esik:U.round(esik, 2), belirgin:Math.abs(r) >= esik };
  }

  /* Toparlanma skoru bu ölçümlerden HESAPLANIR (core/move.js readiness):
     ikisinin bağı hesabın kendisidir, bulgu değil. */
  const TURETEN = { readiness:['sleep', 'hrv', 'rhr'] };
  function turetilmis(a, b){
    return (TURETEN[a] || []).indexOf(b) >= 0 || (TURETEN[b] || []).indexOf(a) >= 0;
  }

  /* Gunluk seri ureticiler — korelasyon icin ortak arayuz. */
  const SERIES = {
    sleep:d => { const v = SP.S.vitals[d]; return v ? v.sleep : null; },
    hrv:d => { const v = SP.S.vitals[d]; return v ? v.hrv : null; },
    rhr:d => { const v = SP.S.vitals[d]; return v ? v.rhr : null; },
    weight:d => { const v = SP.S.vitals[d]; return v ? v.weight : null; },
    sbp:d => { const v = SP.S.vitals[d]; return v ? v.sbp : null; },
    readiness:d => { const r = SP.Move.readiness(d); return r.ok ? r.score : null; },
    load:d => { const n = SP.Model.workoutsOf(d).length; return n ? SP.Move.loadOn(d) : null; },
    protein:d => { const t = SP.Nutri.dayTotals(d); return t.empty ? null : t.protein; },
    kcal:d => { const t = SP.Nutri.dayTotals(d); return t.empty ? null : t.kcal; },
    fiber:d => { const t = SP.Nutri.dayTotals(d); return t.empty ? null : t.fiber; },
    sodium:d => { const t = SP.Nutri.dayTotals(d); return t.empty ? null : t.micro.sodium; },
  };

  /* `gecikme`: ikinci ölçüm kaç gün SONRA okunur (yük → ertesi gün toparlanma). */
  function pairsFor(aKey, bKey, days, gecikme){
    const n = days || 60;
    const g = gecikme || 0;
    const out = [];
    for(let i = g; i < n; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      const a = SERIES[aKey] ? SERIES[aKey](d) : null;
      const b = SERIES[bKey] ? SERIES[bKey](g ? U.iso(U.addDays(U.parse(d), g)) : d) : null;
      if(a != null && b != null) out.push([Number(a), Number(b)]);
    }
    return out;
  }

  /* Aranan baglar. Her biri hangi iki seriyi karsilastirdigini, beklenen
     yonu ve bulgunun nasil yazilacagini tasir. */
  const LINKS = [
    { id:'sleep-hrv', a:'sleep', b:'hrv', expect:'+',
      title:yz('spi.core.calc.uyku-ve-toparlanma'),
      pos:yz('spi.core.calc.uzun-uyudugun-gunlerde-hrv-y'),
      neg:yz('spi.core.calc.uyku-suresiyle-hrv-ters-hare') },
    /* gecikme 1: başlık «ertesi gün» diyor; önce aynı günün toparlanması
       (sabah, yükten ÖNCE ölçülen) ile o günün yükü karşılaştırılıyordu. */
    { id:'load-readiness', a:'load', b:'readiness', expect:'-', gecikme:1,
      title:yz('spi.core.calc.yuk-ve-ertesi-gun-toparlanma'),
      pos:yz('spi.core.calc.agir-yuklenilen-gunlerde-top'),
      neg:yz('spi.core.calc.agir-gunlerde-toparlanma-bel') },
    { id:'protein-readiness', a:'protein', b:'readiness', expect:'+',
      title:yz('spi.core.calc.protein-ve-toparlanma'),
      pos:yz('spi.core.calc.protein-aldigin-gunlerde-top'),
      neg:yz('spi.core.calc.protein-ile-toparlanma-arasi') },
    { id:'sodium-bp', a:'sodium', b:'sbp', expect:'+',
      title:yz('spi.core.calc.sodyum-ve-tansiyon'),
      pos:yz('spi.core.calc.tuz-aliminin-yuksek-oldugu-g'),
      neg:yz('spi.core.calc.sodyum-ile-tansiyon-arasinda') },
    { id:'kcal-weight', a:'kcal', b:'weight', expect:'+',
      title:yz('spi.core.calc.kalori-ve-kilo'),
      pos:yz('spi.core.calc.kalori-alimi-ile-kilo-ayni'),
      neg:yz('spi.core.calc.kalori-ile-kilo-ters-hareket') },
    { id:'sleep-kcal', a:'sleep', b:'kcal', expect:'-',
      title:yz('spi.core.calc.uyku-ve-istah'),
      pos:yz('spi.core.calc.az-uyudugun-gunlerde-kalori'),
      neg:yz('spi.core.calc.uyku-ile-kalori-arasinda-bel') },
  ];

  function crossFindings(days){
    const n = days || 60;
    return SP.Memo.of('calc.cross:' + n, () => crossFindingsHam(n));
  }

  function crossFindingsHam(days){
    return LINKS.map(link => {
      const pairs = pairsFor(link.a, link.b, days || 60, link.gecikme);
      const c = correlate(pairs);
      if(!c.ok){
        return { link, ok:false, n:c.n,
          note:yz('spi.core.calc.ortak-gun-sayisi-yetersiz') + c.n + '/' + MIN_PAIRS + '). '
             + yz('spi.core.calc.i-ki-olcum-de-ayni-gunlerde') };
      }
      /* Zayif ya da gun sayisina gore rastlanti duzeyindeki katsayi bulgu sayilmaz. */
      if(!c.belirgin){
        return { link, ok:true, weak:true, r:c.r, n:c.n,
          tone:'muted', text:yz('spi.core.calc.belirgin-bir-birliktelik-yok') + U.fmtNet(c.r) + ', ' + c.n + ' gün; '
            + c.n + ' günde rastlantıdan ayırmak için |r| ≥ ' + U.fmtNet(c.esik) + ' gerekir).' };
      }
      const matches = link.expect === '+' ? c.r > 0 : c.r < 0;
      return {
        link, ok:true, weak:false, r:c.r, n:c.n,
        tone:matches ? 'ok' : 'warn',
        text:(matches ? link.pos : link.neg)
          + ' (r=' + U.fmtNet(c.r) + ', ' + c.n + ' gün — birliktelik, nedensellik değil.)',
      };
    });
  }

  /* --------------------------------------------------------- haftalik rapor

     PDF'teki konsolide raporun kural motoru tarafi. Patron bunu cumleye
     cevirir; sayilar buradan cikar. */
  function weeklyReport(endISO){
    const end = endISO || U.todayISO();
    const start = U.iso(U.addDays(U.parse(end), -6));

    const days = [];
    for(let i = 6; i >= 0; i--) days.push(U.iso(U.addDays(U.parse(end), -i)));

    const readiness = days.map(d => SP.Move.readiness(d)).filter(r => r.ok).map(r => r.score);
    const nutri = SP.Nutri.windowAverage(7);
    const t = SP.Nutri.targets();
    const money = SP.Money.basketTotal();
    const load = SP.Move.loadWindow(7, end);
    const growth = SP.Move.weeklyGrowth(end);
    const minDays = days.filter(d => minimumDay(d).complete).length;

    return {
      start, end, days,
      readiness:{ avg:readiness.length ? Math.round(U.sum(readiness) / readiness.length) : null,
        n:readiness.length, min:readiness.length ? Math.min.apply(null, readiness) : null },
      nutrition:{ avg:nutri, targets:t, loggedDays:nutri.days,
        proteinPct:t.ok && !nutri.empty ? U.pct(nutri.protein, t.protein.min) : null,
        fiberPct:t.ok && !nutri.empty ? U.pct(nutri.fiber, t.fiber) : null },
      movement:{ load, growth, sessions:SP.S.workouts.filter(w => w.date >= start && w.date <= end).length,
        balance:SP.Move.patternBalance(end) },
      money,
      discipline:{ minDays, of:7, streak:streak() },
      flags:SP.Model.openFlags(),
      gaps:SP.Nutri.gaps(7).rows.slice(0, 3),
      attention:SP.Bio.attention().slice(0, 3),
    };
  }

  /* Raporun tek cumlelik basligi — celiskiyi de tasir.
     PDF'teki ornek cumle bicimi burada uretilir. */
  function headline(report){
    const r = report || weeklyReport();
    const wins = [], losses = [];

    if(r.readiness.avg != null){
      (r.readiness.avg >= 70 ? wins : losses).push('toparlanma ortalaması ' + r.readiness.avg);
    }
    if(r.nutrition.proteinPct != null){
      (r.nutrition.proteinPct >= 95 ? wins : losses).push('protein hedefin %' + r.nutrition.proteinPct + '\'i');
    }
    if(r.money.limit != null){
      (r.money.over ? losses : wins).push(r.money.over
        ? 'bütçe %' + Math.max(0, r.money.pct - 100) + ' aşıldı'
        : 'bütçe sınırın altında');
    }
    (r.discipline.minDays >= 5 ? wins : losses).push('asgari gün ' + r.discipline.minDays + '/7');

    if(!wins.length && !losses.length) return yz('spi.core.calc.hafta-icin-yeterli-kayit-yok');
    if(wins.length && losses.length){
      /* Celiskiyi tek cumlede tut: once kaybedilen, sonra "fakat" ile kazanilan.
         Rapor iyi haberi kotu haberin arkasina saklamaz. */
      const lead = losses[0].charAt(0).toLocaleUpperCase('tr-TR') + losses[0].slice(1);
      return lead + ' fakat ' + wins.join(' ve ') + '.';
    }
    if(wins.length) return yz('spi.core.calc.hafta-temiz') + wins.join(' · ') + '.';
    return yz('spi.core.calc.hafta-zorlandi') + losses.join(' · ') + '.';
  }

  return {
    minimumDay, streak, dayStatus, nextAction,
    correlate, pairsFor, crossFindings, SERIES, LINKS, MIN_PAIRS, turetilmis,
    weeklyReport, headline,
  };
})();
