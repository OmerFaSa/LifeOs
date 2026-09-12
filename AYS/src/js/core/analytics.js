/* Derin analiz katmanı.

   R.Calc karar verir (eşik, bant, kapı). Buradaki fonksiyonlar karar vermez;
   var olan kaydı sorgulayıp okunabilir hale getirir. Yeni veri istemezler.

   Hepsi saf okuma: hiçbiri state değiştirmez. */

window.R = window.R || {};

R.Analytics = (function(){
  const U = R.U, M = R.Model, S = R.S;
  const C = () => R.Calc;

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

    const dir = best.blank < avgBlank - 1 ? 'less'
      : best.blank > avgBlank + 1 ? 'more' : 'same';

    return {
      ok:true, points, avgBlank, best, worst, dir,
      sayilan:list.length, disarida,
      kapsam:disarida
        ? list.length + ' denemeden hesaplandı; ' + disarida
          + ' denemede boş alanı doldurulmadığı için dışarıda kaldı.'
        : list.length + ' denemeden hesaplandı.',
      note:dir === 'less'
        ? 'En iyi denemende ortalamadan az boş bıraktın. Daha çok soruya girmek sana net kazandırıyor.'
        : dir === 'more'
        ? 'En iyi denemende ortalamadan çok boş bıraktın. Emin olmadığını boş bırakmak sana yarıyor.'
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
    const byPub = {};
    list.forEach((e, i) => {
      const key = e.publisher || 'belirtilmedi';
      byPub[key] = byPub[key] || { publisher:key, nets:[] };
      byPub[key].nets.push(nets[i]);
    });

    const rows = Object.keys(byPub).map(k => {
      const med = U.median(byPub[k].nets);
      return {
        publisher:k, count:byPub[k].nets.length,
        median:U.round(med, 2), offset:U.round(med - overall, 2),
      };
    }).sort((a, b) => b.count - a.count);

    const spread = rows.length > 1
      ? U.round(Math.max.apply(null, rows.map(r => r.median)) - Math.min.apply(null, rows.map(r => r.median)), 2)
      : 0;

    return {
      ok:true, overall:U.round(overall, 2), rows, spread,
      note:spread >= 6
        ? 'Yayınlar arası fark ' + U.fmtNet(spread) + ' net. Trendi tek yayın içinde okumak daha güvenilir.'
        : 'Yayınlar arası fark küçük; netler karşılaştırılabilir.',
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
      const profile = acc >= 75 && sec <= 60 ? 'ideal'
        : acc < 65 && sec <= 45 ? 'fast-wrong'
        : acc >= 75 && sec > 75 ? 'slow-right'
        : 'mixed';
      return {
        test:k, secPerQ:U.round(sec, 1), accuracy:Math.round(acc), profile,
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
        const earned = st.state === 'closed' ? potential
          : practice.accuracy != null ? U.round(potential * practice.accuracy / 100, 2)
          : 0;
        out.push({
          subjectId:sub.id, subjectName:sub.name, topicId:t.id, topicName:t.name,
          freq:t.freq, state:st.state,
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
    }));
    const weak = rows.find(r => r.rate < 70);
    return {
      ok:rows.length > 0, rows,
      note:!rows.length
        ? 'Yeterli tekrar geçmişi yok; birkaç hafta sonra anlamlı olur.'
        : weak
        ? weak.gap + ' aralığında hatırlama %' + weak.rate + '. Bu aralıktaki kartlar yeniden yazılmalı olabilir.'
        : 'Tüm aralıklarda hatırlama %70 üzerinde; tekrar takvimi sana uyuyor.',
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
    if(!good.length || !bad.length){
      return { ok:false, why:'Karşılaştırma için hem yeterli hem yetersiz uyku günü gerekir.' };
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

  return {
    compareExams, blankStrategy, errorHeatmap, rankHistory, publisherAdjust,
    speedAccuracy, topicValue, forgettingCurve, sleepImpact, capacityReality,
    leechCards, warmup, distractionTrend,
  };
})();
