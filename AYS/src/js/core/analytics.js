/* Derin analiz katmanı.

   R.Calc karar verir (eşik, bant, kapı). Buradaki fonksiyonlar karar vermez;
   var olan kaydı sorgulayıp okunabilir hale getirir. Yeni veri istemezler.

   Hepsi saf okuma: hiçbiri state değiştirmez. */

window.R = window.R || {};

R.Analytics = (function(){
  const U = R.U, M = R.Model, S = R.S;
  const C = () => R.Calc;

  /* Theil–Sen eğimi (ikili eğimlerin ortancası); tek aykırı deneme sürüklemez. */
  function ts(n){
    const e = [];
    for(let i = 0; i < n.length; i++) for(let j = i + 1; j < n.length; j++){
      if(n[j].x !== n[i].x) e.push((n[j].y - n[i].y) / (n[j].x - n[i].x));
    }
    return e.length ? U.median(e) : 0;
  }

  /* Teste özgü hedef süre (sn/soru): sistemin KENDİ branş şablonlarından
     (data/reference.js: Türkçe 40 soru / 40 dk, AYT Matematik 40 / 75 dk…);
     branşı olmayan test (Sosyal) tam denemenin soru başı ortalamasını alır.
     Analiz denetimi (2026-10-17): önce her test için aynı eşik (60 sn)
     vardı; Matematik'te 80 sn «yavaş», Sosyal'de 40 sn «ideal» sayılıyordu. */
  function hedefSure(test, family){
    const T = R.EXAM_TEMPLATES || [];
    const br = T.find(t => t.kind === 'branch' && t.family === family && (t.tests || []).length === 1 && t.tests[0].name === test);
    if(br && br.duration && br.tests[0].q) return br.duration * 60 / br.tests[0].q;
    const tam = T.find(t => t.kind === 'full' && t.family === family && (t.tests || []).some(x => x.name === test));
    const q = tam ? U.sum(tam.tests.map(x => x.q || 0)) : 0;
    return tam && tam.duration && q ? tam.duration * 60 / q : 75;
  }

  /* ---------- deneme karşılaştırma ---------- */
  function compareExams(idA, idB){
    const a = S.exams.find(e => e.id === idA);
    const b = S.exams.find(e => e.id === idB);
    if(!a || !b) return null;

    const names = {};
    (a.tests || []).forEach(t => { names[t.name] = true; });
    (b.tests || []).forEach(t => { names[t.name] = true; });

    const acc = t => (t && (t.correct + t.wrong)) ? U.pct(t.correct, t.correct + t.wrong) : null;
    const rows = Object.keys(names).map(name => {
      const ta = (a.tests || []).find(t => t.name === name);
      const tb = (b.tests || []).find(t => t.name === name);
      const na = ta ? U.round(M.testNet(ta), 2) : null;
      const nb = tb ? U.round(M.testNet(tb), 2) : null;
      return {
        name, netA:na, netB:nb,
        delta:(na != null && nb != null) ? U.round(nb - na, 2) : null,
        blankA:ta ? ta.blank : null, blankB:tb ? tb.blank : null,
        accA:acc(ta), accB:acc(tb),
        minA:ta ? ta.minutes : null, minB:tb ? tb.minutes : null,
      };
    });

    const totalA = U.round(M.examNet(a), 2);
    const totalB = U.round(M.examNet(b), 2);
    const moved = rows.filter(r => r.delta != null)
      .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));

    return {
      a:{ id:a.id, date:a.date, type:a.type, publisher:a.publisher, net:totalA },
      b:{ id:b.id, date:b.date, type:b.type, publisher:b.publisher, net:totalB },
      rows, delta:U.round(totalB - totalA, 2),
      biggest:moved[0] || null,
      note:moved.length
        ? 'En büyük değişim ' + moved[0].name + ': '
          + (moved[0].delta > 0 ? '+' : '') + U.fmtNet(moved[0].delta) + ' net.'
        : 'Karşılaştırılabilir test yok.',
    };
  }

  /* ---------- boş bırakma stratejisi ----------

     BOŞ SAYISI BİLİNMEYEN DENEME ORTALAMAYA GİRMEZ. Eskiden girerdi:
     `t.blank || 0` yazılmamış her alanı sıfır sayıyor, ortalama
     olduğundan küçük çıkıyor ve tavsiye tersine dönebiliyordu —
     "ortalamadan az boş bıraktın, daha çok soruya gir" cümlesi
     kullanıcının hiç vermediği bir sayıdan üretiliyordu.

     Kaç denemenin dışarıda kaldığı sonuçta YAZILIR: bir ortalamanın
     kaç ölçümden geldiğini bilmeden ona güvenilmez. */
  function blankStrategy(family){
    const hepsi = C().fullExams(family || 'TYT');
    const list = hepsi.filter(M.blankKnown);
    const disarida = hepsi.length - list.length;
    if(list.length < 3){
      return { ok:false, disarida,
        why:disarida
          ? 'Boş sayısı bilinen en az 3 tam deneme gerekir; '
            + disarida + ' denemede boş alanı doldurulmamış.'
          : 'En az 3 tam deneme gerekir.' };
    }

    const points = list.map(e => ({
      date:e.date,
      blank:U.sum((e.tests || []).map(t => Number(t.blank) || 0)),
      wrong:U.sum((e.tests || []).map(t => t.wrong || 0)),
      net:U.round(M.examNet(e), 2),
    }));
    const avgBlank = U.round(U.sum(points.map(p => p.blank)) / points.length, 1);
    const sorted = points.slice().sort((a, b) => b.net - a.net);
    const best = sorted[0], worst = sorted[sorted.length-1];

    /* YÖN TEK DENEMEDEN ÇIKMAZ (analiz denetimi, 2026-10-17). Önce yalnız
       EN İYİ denemenin boşu ortalamayla karşılaştırılıyordu: üç denemeden
       biri yüksek netle çok boş bıraktıysa «boş bırakmak sana yarıyor»
       deniyordu, öteki ikisi ne derse desin. Şimdi denemeler boş sayısına
       göre ikiye bölünür (az boş / çok boş); her grupta en az iki deneme
       ve medyan netler arasında en az 2 net fark yoksa yön söylenmez. */
    const bosSira = points.slice().sort((a, b) => a.blank - b.blank);
    const yari = Math.floor(bosSira.length / 2);
    const az = bosSira.slice(0, yari), cok = bosSira.slice(bosSira.length - yari);
    const yeterli = az.length >= 2 && cok.length >= 2 && cok[0].blank > az[az.length - 1].blank;
    const fark = yeterli ? U.round(U.median(az.map(p => p.net)) - U.median(cok.map(p => p.net)), 2) : null;
    const dir = !yeterli ? 'az-veri' : fark >= 2 ? 'less' : fark <= -2 ? 'more' : 'same';

    return {
      ok:true, points, avgBlank, best, worst, dir,
      sayilan:list.length, disarida,
      kapsam:disarida
        ? list.length + ' denemeden hesaplandı; ' + disarida
          + ' denemede boş alanı doldurulmadığı için dışarıda kaldı.'
        : list.length + ' denemeden hesaplandı.',
      fark,
      note:dir === 'less'
        ? 'Az boş bıraktığın denemelerde medyan netin ' + U.fmtNet(fark) + ' net yüksek. Daha çok soruya girmek sana net kazandırıyor olabilir.'
        : dir === 'more'
        ? 'Çok boş bıraktığın denemelerde medyan netin ' + U.fmtNet(-fark) + ' net yüksek. Emin olmadığını boş bırakmak sana yarıyor olabilir.'
        : dir === 'az-veri'
        ? 'Yön söylemek için boş sayısı farklı en az dört deneme gerekir; şimdilik yalnız ortalama.'
        : 'Boş sayısı ile net arasında belirgin ilişki yok; sorun hızda ya da isabette olabilir.',
    };
  }

  /* ---------- konu × hata tipi ısı haritası ---------- */
  function errorHeatmap(limit){
    const tags = Object.keys(R.ERROR_TAGS);
    const byTopic = {};
    S.errors.forEach(e => {
      const key = e.topic || e.testName || 'Etiketsiz';
      if(!byTopic[key]){
        byTopic[key] = { topic:key, total:0, cells:{} };
        tags.forEach(t => { byTopic[key].cells[t] = 0; });
      }
      if(byTopic[key].cells[e.tag] != null){
        byTopic[key].cells[e.tag]++;
        byTopic[key].total++;
      }
    });
    const rows = Object.keys(byTopic).map(k => byTopic[k])
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total);
    const max = rows.length
      ? Math.max.apply(null, rows.map(r => Math.max.apply(null, tags.map(t => r.cells[t]))))
      : 0;
    return { tags, rows:limit ? rows.slice(0, limit) : rows, max };
  }

  /* ---------- tahmini sıra geçmişi ---------- */
  function rankHistory(){
    const calc = C();
    const list = calc.fullExams('TYT');
    if(list.length < 3) return [];
    const nets = list.map(M.examNet);
    const o = calc.obp();
    const out = [];
    for(let i = 2; i < nets.length; i++){
      const med = U.median(nets.slice(Math.max(0, i-2), i+1));
      const raw = calc.rawScore(med, null);
      const score = U.round(raw.value + o.contribution, 1);
      const half = i + 1 >= 8 ? R.SCORING.bandHalfWidth.many
        : i + 1 >= 5 ? R.SCORING.bandHalfWidth.some
        : R.SCORING.bandHalfWidth.few;
      out.push({
        date:list[i].date, score,
        rank:calc.rankForScore(score),
        rankBest:calc.rankForScore(score + half),
        rankWorst:calc.rankForScore(score - half),
      });
    }
    return out;
  }

  /* ---------- yayın zorluk düzeltmesi ---------- */
  function publisherAdjust(family){
    const list = C().fullExams(family || 'TYT');
    if(list.length < 4) return { ok:false, why:'En az 4 tam deneme gerekir.' };

    const nets = list.map(M.examNet);
    const overall = U.median(nets);
    /* ZAMANDAN ARINDIRILIR (analiz denetimi, 2026-10-17): önce A yayınını,
       sonra B'yi çözüp ilerleyen adayda A «zor yayın» görünüyordu. Gidiş
       (Theil–Sen, deneme sırasına göre) çıkarılır; yayının sapması kalanın
       ortancasıdır. */
    const egim = ts(nets.map((y, i) => ({ x:i, y })));
    const kesit = U.median(nets.map((y, i) => y - egim * i));
    const kalan = nets.map((y, i) => y - (kesit + egim * i));
    const byPub = {};
    list.forEach((e, i) => {
      const key = e.publisher || 'belirtilmedi';
      byPub[key] = byPub[key] || { publisher:key, nets:[], kalan:[] };
      byPub[key].nets.push(nets[i]);
      byPub[key].kalan.push(kalan[i]);
    });

    const rows = Object.keys(byPub).map(k => {
      const med = U.median(byPub[k].nets);
      return {
        publisher:k, count:byPub[k].nets.length,
        median:U.round(med, 2), offset:U.round(U.median(byPub[k].kalan), 2), hamOffset:U.round(med - overall, 2),
      };
    }).sort((a, b) => b.count - a.count);

    const spread = rows.length > 1
      ? U.round(Math.max.apply(null, rows.map(r => r.offset)) - Math.min.apply(null, rows.map(r => r.offset)), 2)
      : 0;

    return {
      ok:true, overall:U.round(overall, 2), rows, spread,
      note:spread >= 6
        ? 'Gidişten arındırınca yayınlar arası fark ' + U.fmtNet(spread) + ' net. Trendi tek yayın içinde okumak daha güvenilir.'
        : 'Gidişten arındırınca yayınlar arası fark küçük; netler karşılaştırılabilir.',
      egimDeneme:U.round(egim, 2),
    };
  }

  /* ---------- hız–isabet dengesi ---------- */
  function speedAccuracy(family){
    const list = C().fullExams(family || 'TYT').filter(e => (e.tests || []).some(t => t.minutes != null));
    if(!list.length) return { ok:false, why:'Süre kaydı olan tam deneme gerekir.' };

    const byTest = {};
    list.slice(-4).forEach(e => {
      (e.tests || []).forEach(t => {
        if(t.minutes == null) return;
        const answered = t.correct + t.wrong;
        if(!answered) return;
        byTest[t.name] = byTest[t.name] || { test:t.name, sec:[], acc:[] };
        byTest[t.name].sec.push(t.minutes * 60 / answered);
        byTest[t.name].acc.push(U.pct(t.correct, answered));
      });
    });

    const keys = Object.keys(byTest);
    if(!keys.length) return { ok:false, why:'Süre kaydı olan test yok.' };

    const rows = keys.map(k => {
      const sec = U.median(byTest[k].sec);
      const acc = U.median(byTest[k].acc);
      const hedef = hedefSure(k, family || 'TYT');
      const oran = sec / hedef;
      const profile = acc >= 75 && oran <= 1.05 ? 'ideal'
        : acc < 65 && oran <= 0.8 ? 'fast-wrong'
        : acc >= 75 && oran > 1.2 ? 'slow-right'
        : 'mixed';
      return {
        test:k, secPerQ:U.round(sec, 1), hedefSn:Math.round(hedef), accuracy:Math.round(acc), profile,
        note:profile === 'fast-wrong' ? 'Hızlı ama isabetsiz — okuma ve kontrol adımı ekle.'
          : profile === 'slow-right' ? 'Doğru ama yavaş — süre baskısı altında çalış.'
          : profile === 'ideal' ? 'Hız ve isabet dengede.'
          : 'Karışık; daha çok süre kaydı gerek.',
      };
    }).sort((a, b) => a.accuracy - b.accuracy);

    return { ok:true, rows };
  }

  /* ---------- konu net katkısı ---------- */
  function topicValue(limit){
    const calc = C();
    const out = [];
    const W = { high:1, mid:0.55, low:0.25 };
    R.SUBJECTS.forEach(sub => {
      const weightSum = sub.topics.reduce((a, x) => a + (W[x.freq] || 0.55), 0) || 1;
      sub.topics.forEach(t => {
        const st = M.topicState(sub.id, t.id);
        const potential = U.round((sub.questions || 0) * ((W[t.freq] || 0.55) / weightSum), 2);
        const practice = calc.topicPractice(sub.id, t.id);
        /* Hic calisilmamis konu (`practice.accuracy == null`) "kazanilan
           sifir" SAYILMAZ — bu, olculmus %0 dogrulukla HICBIR ZAMAN
           denenmemis olmayi ayni etikete koyardi. `earned` siralama icin
           yine 0'dan turer (hic dokunulmamis konu, en cok boslugu olan
           konudur ve bu SIRALAMADA dogru bir varsayimdir) ama satir
           `cert:'missing'` tasir; ekran bunu TOPLAMA KATMADAN once
           gorebilsin. */
        const dokunuldu = st.state === 'closed' || practice.accuracy != null;
        const earned = st.state === 'closed' ? potential
          : practice.accuracy != null ? U.round(potential * practice.accuracy / 100, 2)
          : 0;
        out.push({
          subjectId:sub.id, subjectName:sub.name, topicId:t.id, topicName:t.name,
          /* Kazanılan, frekans payı ve pratik doğruluğundan HESAPLANIR (ölçülmez). */
          freq:t.freq, state:st.state, cert:dokunuldu ? 'derived' : 'missing',
          potential, earned, gap:U.round(potential - earned, 2),
        });
      });
    });
    out.sort((a, b) => b.gap - a.gap);
    return limit ? out.slice(0, limit) : out;
  }

  /* ---------- unutma eğrisi ---------- */
  function forgettingCurve(){
    const buckets = {};
    S.cards.forEach(c => {
      (c.history || []).forEach(h => {
        if(h.gapDays == null || !h.result) return;
        const b = h.gapDays <= 1 ? '1g'
          : h.gapDays <= 3 ? '3g'
          : h.gapDays <= 7 ? '1h'
          : h.gapDays <= 30 ? '1a' : '1a+';
        buckets[b] = buckets[b] || { gap:b, total:0, remembered:0 };
        buckets[b].total++;
        if(h.result === 'remembered') buckets[b].remembered++;
      });
    });
    const order = ['1g', '3g', '1h', '1a', '1a+'];
    const rows = order.filter(k => buckets[k]).map(k => ({
      gap:k, total:buckets[k].total, rate:U.pct(buckets[k].remembered, buckets[k].total),
      az:buckets[k].total < 5,
    }));
    /* Beşten az tekrarlı aralık hüküm vermez (analiz denetimi): tek bir
       unutuş «%0, kartlar yeniden yazılmalı» cümlesi kuruyordu. */
    const weak = rows.find(r => !r.az && r.rate < 70);
    return {
      ok:rows.length > 0, rows,
      note:!rows.length
        ? 'Yeterli tekrar geçmişi yok; birkaç hafta sonra anlamlı olur.'
        : weak
        ? weak.gap + ' aralığında hatırlama %' + weak.rate + ' (' + weak.total + ' tekrar). Bu aralıktaki kartlar yeniden yazılmalı olabilir.'
        : rows.every(r => r.az)
        ? 'Her aralıkta beşten az tekrar var; hüküm için birkaç hafta daha gerek.'
        : 'Yeterli tekrarı olan aralıklarda hatırlama %70 üzerinde; tekrar takvimi sana uyuyor.',
    };
  }

  /* ---------- uyku ile net ilişkisi ---------- */
  function sleepImpact(){
    const list = C().fullExams('TYT');
    if(list.length < 4) return { ok:false, why:'En az 4 tam deneme gerekir.' };

    const points = [];
    list.forEach(e => {
      const prev = S.days[U.iso(U.addDays(U.parse(e.date), -1))];
      if(!prev || prev.sleepHours == null) return;
      points.push({ date:e.date, sleep:Number(prev.sleepHours), net:U.round(M.examNet(e), 2) });
    });
    if(points.length < 4) return { ok:false, why:'Deneme öncesi uyku kaydı yetersiz.' };

    const target = (S.profile && S.profile.sleepTarget) || 7.5;
    const good = points.filter(p => p.sleep >= target - 0.5);
    const bad = points.filter(p => p.sleep < target - 0.5);
    /* Her grupta en az iki deneme (analiz denetimi): tek denemelik grubun
       «medyanı» o denemenin kendisidir; 3'e 1'lik bir karşılaştırma
       «bu senin verin» diye sunuluyordu. */
    if(good.length < 2 || bad.length < 2){
      return { ok:false, why:'Karşılaştırma için en az iki yeterli ve iki yetersiz uykulu deneme gerekir.' };
    }

    const gm = U.median(good.map(p => p.net));
    const bm = U.median(bad.map(p => p.net));
    const diff = U.round(gm - bm, 2);
    return {
      ok:true, points, goodMedian:U.round(gm, 2), badMedian:U.round(bm, 2), diff,
      goodCount:good.length, badCount:bad.length,
      note:diff >= 2
        ? 'Yeterli uyuduğun denemelerde medyanın ' + U.fmtNet(diff) + ' net yüksek. Bu senin verin.'
        : diff <= -2
        ? 'Bu veri setinde beklenen ilişki görünmüyor; örnek sayısı az olabilir.'
        : 'Fark ' + U.fmtNet(diff) + ' net — belirgin değil. Daha çok kayıt gerek.',
    };
  }

  /* ---------- kapasite gerçeklik kontrolü ---------- */
  function capacityReality(weeks){
    const calc = C();
    const n = weeks || 4;
    const cur = M.currentWeek();
    const rows = [];
    for(let w = Math.max(1, cur - n); w < cur; w++){
      const t = calc.timeRealization(w);
      if(!t.target) continue;
      rows.push({ week:w, planned:t.target, actual:t.actual, pct:t.pct });
    }
    if(!rows.length) return { ok:false, why:'Henüz tamamlanmış hafta yok.' };

    const claimed = (S.profile && S.profile.capacityHoursPerWeek) || 21;
    const actualAvg = U.round(U.sum(rows.map(r => r.actual)) / rows.length / 60, 1);
    const ratio = claimed ? U.pct(actualAvg, claimed) : 0;
    return {
      ok:true, rows, claimed, actualAvg, ratio,
      status:ratio >= 85 ? 'gercekci' : ratio >= 60 ? 'iyimser' : 'hayali',
      note:ratio >= 85
        ? 'Girdiğin kapasite gerçeğe uyuyor.'
        : 'Kapasiteyi haftada ' + claimed + ' saat yazdın, fiilen ' + actualAvg + ' saat çalışıyorsun (%'
          + ratio + '). Planı gerçek sayıya göre kurmak tamamlama oranını anlamlı kılar.',
    };
  }

  /* ---------- leech kartlar ---------- */
  function leechCards(threshold){
    const min = threshold || 4;
    return S.cards
      .map(c => ({
        id:c.id, front:c.front, topic:c.topic, subjectId:c.subjectId, stage:c.stage,
        forgot:(c.history || []).filter(h => h.result === 'forgot').length,
      }))
      .filter(c => c.forgot >= min)
      .sort((a, b) => b.forgot - a.forgot);
  }

  /* ---------- ilk 20 dakika / ısınma ---------- */
  function warmup(){
    const rows = S.sessions.filter(s => s.earlyRate != null && s.lateRate != null);
    if(!rows.length) return { ok:false, why:'Süreli deneme oturumu gerekir.' };
    const early = U.round(U.sum(rows.map(r => r.earlyRate)) / rows.length, 0);
    const late = U.round(U.sum(rows.map(r => r.lateRate)) / rows.length, 0);
    return {
      ok:true, sessions:rows.length, early, late, diff:late - early,
      note:late - early >= 15
        ? 'İlk 20 dakikada isabet %' + early + ', sonrasında %' + late + '. Isınma sorunu var: '
          + 'denemeye başlamadan 5 dakikalık kolay set çöz.'
        : 'Isınma sorunu görünmüyor; deneme boyunca isabet dengeli.',
    };
  }

  /* ---------- dikkat dağılması ----------

     SAYAÇ AÇILMAMIŞ GÜN ORTALAMAYA GİRMEZ.

     `distractions` gün kaydı doğduğunda 0 olarak başlar, yani "bugün hiç
     bölünmedim" ile "bugün sayacı hiç açmadım" aynı sayıya bakıyordu.
     Ortalama bütün günler üzerinden alınınca sayacın kullanılmadığı her
     gün ortalamayı aşağı çekiyor ve sonuç hep aynı cümleye varıyordu:
     «Bölünme düşük; odak sorunu görünmüyor.» Kullanıcının vermediği bir
     veriden üretilmiş bir teselli.

     Artık yalnızca sayacın kullanıldığı günler sayılır. Bir gün iki yolla
     sayılabilir: bayrağı varsa (v5 sonrası) ya da sayısı sıfırdan
     büyükse (eski kayıtlar — sıfırdan büyük bir sayı elle üretilmiştir).

     Üç günden az kapsamda ortalama üretilmez: iki günlük bir örnekten
     «günde ortalama 6 bölünme» cümlesi kurmak, ölçmeden konuşmaktır. */
  function distractionTrend(days){
    const n = days || 14;
    const rows = [];
    let gunKaydi = 0;
    for(let i = n - 1; i >= 0; i--){
      const iso = U.iso(U.addDays(U.today(), -i));
      const d = S.days[iso];
      if(!d) continue;
      gunKaydi++;
      const sayildi = d.distractionsTracked === true || Number(d.distractions) > 0;
      if(!sayildi) continue;
      rows.push({ date:iso, count:Number(d.distractions) || 0 });
    }
    if(!gunKaydi) return { ok:false, why:'Gün kaydı yok.' };
    if(rows.length < 3){
      return { ok:false, sayilan:rows.length, gunKaydi,
        why:'Bölünme sayacı son ' + n + ' günde yalnızca ' + rows.length
          + ' gün kullanıldı. Ortalama üretmek için en az 3 gün gerekir.' };
    }

    const avg = U.round(U.sum(rows.map(r => r.count)) / rows.length, 1);
    return {
      ok:true, rows, avg, sayilan:rows.length, gunKaydi,
      kapsam:rows.length + '/' + gunKaydi + ' günde sayaç kullanıldı; '
        + 'ortalama yalnızca o günlerden hesaplandı.',
      note:avg >= 5
        ? 'Sayacın açık olduğu günlerde ortalama ' + avg + ' bölünme. '
          + 'Telefonu başka odaya koymak tek en etkili müdahale.'
        : avg >= 2
        ? 'Sayacın açık olduğu günlerde ortalama ' + avg + ' bölünme. '
          + 'Blok başında bildirimleri kapatmak yeterli olabilir.'
        : 'Sayacın açık olduğu günlerde bölünme düşük.',
    };
  }

  /* ---------- ders ders deneme (Kişi planı Faz 7) ----------

     Her testte: son üç denemenin ortanca neti, gidiş (Theil–Sen, net /
     deneme), soru sayısına göre bıraktığın net (soru − ortanca net),
     doğru oranı ve boş oranı (boşu bilinen denemelerden). En az üç tam
     deneme gerekir; bir testte üçten az kayıt varsa o test «az veri». */
  function dersAnalizi(family){
    const fam = family || 'TYT';
    const list = C().fullExams(fam);
    if(list.length < 3) return { ok:false, why:'Ders ders okuma için en az 3 tam ' + fam + ' denemesi gerekir.' };
    const tpl = (R.EXAM_TEMPLATES || []).find(t => t.kind === 'full' && t.family === fam);
    const soruSay = ad => { const x = tpl && (tpl.tests || []).find(t => t.name === ad); return x ? x.q : null; };
    const by = {};
    list.forEach((e, i) => (e.tests || []).forEach(t => {
      const r = by[t.name] = by[t.name] || { test:t.name, net:[], dogru:0, yanlis:0, bos:0, bosBilinen:0, soruBos:0 };
      r.net.push({ x:i, y:M.testNet(t) });
      r.dogru += Number(t.correct) || 0;
      r.yanlis += Number(t.wrong) || 0;
      if(t.blank != null && t.blankCert !== 'missing'){
        r.bos += Number(t.blank) || 0;
        r.bosBilinen++;
        r.soruBos += (Number(t.correct) || 0) + (Number(t.wrong) || 0) + (Number(t.blank) || 0);
      }
    }));
    const rows = Object.keys(by).map(k => {
      const r = by[k];
      const az = r.net.length < 3;
      const son = U.median(r.net.slice(-3).map(p => p.y));
      const q = soruSay(k);
      return {
        test:k, deneme:r.net.length, az,
        sonMedyan:U.round(son, 2),
        egim:az ? null : U.round(ts(r.net), 2),
        kayip:q != null ? U.round(q - son, 2) : null, soru:q,
        dogruOrani:r.dogru + r.yanlis ? U.pct(r.dogru, r.dogru + r.yanlis) : null,
        bosOrani:r.bosBilinen && r.soruBos ? U.pct(r.bos, r.soruBos) : null,
      };
    }).sort((a, b) => (b.kayip == null ? -1 : b.kayip) - (a.kayip == null ? -1 : a.kayip));
    const en = rows.find(r => r.kayip != null);
    const yukselen = rows.filter(r => r.egim != null && r.egim >= 0.5).map(r => r.test);
    const dusen = rows.filter(r => r.egim != null && r.egim <= -0.5).map(r => r.test);
    return {
      ok:true, rows, deneme:list.length,
      note:(en ? 'En çok net bıraktığın ders ' + en.test + ' (son denemelerde ~' + U.fmtNet(en.kayip) + ' net).' : '')
        + (yukselen.length ? ' Yükselen: ' + yukselen.join(', ') + '.' : '')
        + (dusen.length ? ' Düşen: ' + dusen.join(', ') + '.' : ''),
    };
  }

  return {
    dersAnalizi, hedefSure,
    compareExams, blankStrategy, errorHeatmap, rankHistory, publisherAdjust,
    speedAccuracy, topicValue, forgettingCurve, sleepImpact, capacityReality,
    leechCards, warmup, distractionTrend,
  };
})();
