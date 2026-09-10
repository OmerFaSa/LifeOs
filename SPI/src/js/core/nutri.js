/* Modul 2'nin kural motoru — hedef, ogun hesabi ve biyoyararlanim.

   Bu dosyanin ayirt edici iddiasi sudur: ne kadar aldigin kadar ne kadarini
   EMEBILDIGIN de sayilir. Ayni 5 mg demir, yaninda limon varken ve yaninda
   cay varken ayni sey degildir; sistem ikisini ayri hesaplar.

   Ikinci iddia: laboratuvar beslenmeyi degistirir. Ferritin dusukse demir
   hedefi kendiliginden yukselir ve C vitamini eslesmesi zorunlu hale gelir.
   Bu, Modul 1 ile Modul 2 arasindaki tek yonlu bagdir (labAdjust). */

window.SP = window.SP || {};

SP.Nutri = (function(){
  const U = SP.U;

  /* Mikro besin anahtarlari — gida tablosundaki `micro` ile ayni. */
  const MICROS = ['iron', 'calcium', 'magnesium', 'zinc', 'potassium', 'sodium',
    'b12', 'folate', 'vitc', 'vitd', 'omega3', 'selenium', 'iodine'];

  /* ------------------------------------------------------------- enerji */

  /* Mifflin-St Jeor — bazal metabolizma. Formul erkek ve kadin icin
     ayni katsayilari, farkli sabiti kullanir. */
  function bmr(profile){
    const p = profile || SP.S.profile;
    if(!p || !p.weightKg || !p.heightCm) return null;
    const age = SP.Model.ageOf(p);
    if(age == null) return null;
    const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * age;
    return Math.round(p.sex === 'female' ? base - 161 : base + 5);
  }

  function activityFactor(profile){
    const p = profile || SP.S.profile;
    const lvl = SP.ACTIVITY_LEVELS.find(a => a.id === (p && p.activity));
    return lvl ? lvl.factor : 1.4;
  }

  function tdee(profile){
    const b = bmr(profile);
    if(b == null) return null;
    return Math.round(b * activityFactor(profile));
  }

  /* ------------------------------------------------------------- hedefler */

  /* Laboratuvar bulgusuna gore hedef duzeltmesi.
     Tablo deklaratiftir: kosul, hangi ogeyi ne kadar buyuttugu ve GEREKCESI
     birlikte durur. Gerekce ekranda gorunur; carpanin nedenini kullanicidan
     saklamayiz. */
  const LAB_LINKS = [
    { when:['ferritin', 'low'],    nutrient:'iron',      mult:1.6,
      why:'Ferritin referans aralığının altında — demir deposu boşalmış.' },
    { when:['ferritin', 'belowOpt'], nutrient:'iron',    mult:1.3,
      why:'Ferritin hedef bandın altında.' },
    { when:['hgb', 'low'],         nutrient:'iron',      mult:1.5,
      why:'Hemoglobin düşük.' },
    { when:['vitd', 'low'],        nutrient:'vitd',      mult:2.0,
      why:'D vitamini referans altında — yağlı öğünle eşleştirme gerekir.' },
    { when:['vitd', 'belowOpt'],   nutrient:'vitd',      mult:1.5,
      why:'D vitamini hedef bandın altında.' },
    { when:['b12', 'low'],         nutrient:'b12',       mult:2.0,
      why:'B12 referans altında.' },
    { when:['b12', 'belowOpt'],    nutrient:'b12',       mult:1.4,
      why:'B12 hedef bandın altında (400 pg/mL altı belirti verebilir).' },
    { when:['folate', 'low'],      nutrient:'folate',    mult:1.5,
      why:'Folat referans altında.' },
    { when:['ldl', 'high'],        nutrient:'fiber',     mult:1.25,
      why:'LDL referans üstünde — çözünür lif doğrudan etkiler.' },
    { when:['ldl', 'aboveOpt'],    nutrient:'fiber',     mult:1.15,
      why:'LDL hedef bandın üstünde.' },
    { when:['trig', 'high'],       nutrient:'omega3',    mult:1.6,
      why:'Trigliserit referans üstünde.' },
    { when:['crp', 'high'],        nutrient:'omega3',    mult:1.3,
      why:'hs-CRP yüksek — sistemik yangı.' },
    { when:['hba1c', 'aboveOpt'],  nutrient:'fiber',     mult:1.2,
      why:'HbA1c hedef bandın üstünde.' },
    { when:['glucose', 'high'],    nutrient:'fiber',     mult:1.25,
      why:'Açlık glukozu referans üstünde.' },
    { when:['k', 'low'],           nutrient:'potassium', mult:1.25,
      why:'Potasyum referans altında.' },
    { when:['ca', 'low'],          nutrient:'calcium',   mult:1.2,
      why:'Kalsiyum referans altında.' },
    { when:['mg', 'low'],          nutrient:'magnesium', mult:1.3,
      why:'Magnezyum referans altında.' },
    { when:['zinc', 'low'],        nutrient:'zinc',      mult:1.3,
      why:'Çinko referans altında.' },
    { when:['tsh', 'high'],        nutrient:'iodine',    mult:1.2,
      why:'TSH yüksek — iyot ve selenyum tiroid için gerekli.' },
    { when:['tsh', 'high'],        nutrient:'selenium',  mult:1.2,
      why:'TSH yüksek.' },
    { when:['sbp', 'high'],        nutrient:'sodium',    mult:0.8,
      why:'Sistolik tansiyon referans üstünde — sodyum sınırı daralır.' },
    { when:['alb', 'low'],         nutrient:'protein',   mult:1.15,
      why:'Albümin düşük — uzun vadeli protein durumu zayıf.' },
  ];

  function labAdjust(profile){
    const out = {};
    LAB_LINKS.forEach(link => {
      const [markerId, wanted] = link.when;
      const last = SP.Model.latestOf(markerId);
      if(!last) return;
      const st = SP.Bio.statusOf(markerId, last.v, profile);
      if(st.id !== wanted) return;
      const cur = out[link.nutrient];
      /* Ayni oge icin birden fazla kural tetiklenirse en guclusu gecerlidir;
         carpanlar carpilmaz — ust uste binerek asiri hedef uretmesin. */
      const stronger = !cur || Math.abs(link.mult - 1) > Math.abs(cur.mult - 1);
      if(stronger) out[link.nutrient] = { mult:link.mult, why:link.why, marker:markerId };
    });
    return out;
  }

  /* Mikro besin taban hedefi — yasa ve cinsiyete gore. */
  function baseRda(nutrientId, profile){
    const n = SP.NUTRI_BY_ID[nutrientId];
    if(!n || !n.rda) return null;
    const p = profile || SP.S.profile || {};
    const sex = p.sex === 'female' ? 'female' : 'male';
    const age = SP.Model.ageOf(p);
    const r = n.rda;
    if(age != null && age >= 50 && sex === 'female' && r.female50 != null) return r.female50;
    if(age != null && age >= 50 && r.over50 != null) return r.over50;
    if(age != null && age >= 70 && r.over70 != null) return r.over70;
    if(age != null && age < 19 && r[sex === 'male' ? 'teenM' : 'teenF'] != null){
      return r[sex === 'male' ? 'teenM' : 'teenF'];
    }
    return r[sex] != null ? r[sex] : null;
  }

  /* Gunun tam hedefi: enerji, makrolar ve laboratuvara gore duzeltilmis
     mikro besinler. Profil eksikse hesap yapilmaz — tahmin uretilmez. */
  function targets(profile){
    const p = profile || SP.S.profile;
    const energy = tdee(p);
    const adj = labAdjust(p);

    const out = {
      ok:energy != null,
      bmr:bmr(p), tdee:energy, adjustments:adj,
      missing:[],
    };
    if(!p || !p.weightKg) out.missing.push('kilo');
    if(!p || !p.heightCm) out.missing.push('boy');
    if(!p || !p.birthYear) out.missing.push('doğum yılı');
    if(!out.ok) return out;

    const goal = SP.GOALS.find(g => g.id === (p.goal || 'health')) || SP.GOALS[0];
    out.goal = goal;
    out.kcal = Math.round(energy * (1 + goal.deficit));

    /* protein: g/kg araligi, hedefe gore */
    const pr = SP.MACRO_RULES.protein.byGoal[goal.id] || SP.MACRO_RULES.protein.byGoal.health;
    const pMult = (adj.protein && adj.protein.mult) || 1;
    out.protein = { min:Math.round(pr[0] * p.weightKg * pMult), max:Math.round(pr[1] * p.weightKg * pMult) };

    /* yag: kalorinin yuzdesi, alt sinir kg basina */
    const fLo = Math.max(Math.round(out.kcal * SP.MACRO_RULES.fat.pctRange[0] / 100 / 9),
                         Math.round(SP.MACRO_RULES.fat.minPerKg * p.weightKg));
    const fHi = Math.round(out.kcal * SP.MACRO_RULES.fat.pctRange[1] / 100 / 9);
    out.fat = { min:fLo, max:Math.max(fHi, fLo) };

    /* karbonhidrat: kalandan */
    const usedLo = out.protein.max * 4 + out.fat.max * 9;
    const usedHi = out.protein.min * 4 + out.fat.min * 9;
    out.carb = { min:Math.max(0, Math.round((out.kcal - usedLo) / 4)),
                 max:Math.max(0, Math.round((out.kcal - usedHi) / 4)) };

    /* lif */
    const fibBase = U.clamp(Math.round(out.kcal * SP.MACRO_RULES.fiber.perKcal),
      SP.MACRO_RULES.fiber.min, SP.MACRO_RULES.fiber.max);
    out.fiber = Math.round(fibBase * ((adj.fiber && adj.fiber.mult) || 1));

    /* mikro besinler */
    out.micro = {};
    MICROS.forEach(id => {
      const base = baseRda(id, p);
      if(base == null) return;
      const m = (adj[id] && adj[id].mult) || 1;
      const n = SP.NUTRI_BY_ID[id];
      out.micro[id] = {
        target:U.round(base * m, id === 'omega3' ? 2 : 0),
        base:base, mult:m, limit:!!(n && n.limit),
        ul:n ? n.ul : null,
        why:adj[id] ? adj[id].why : null,
      };
    });

    return out;
  }

  /* -------------------------------------------------------------- porsiyon */

  /* Bir gidanin verilen gramdaki katkisi. */
  function contribution(foodId, grams){
    const f = SP.FOOD_BY_ID[foodId];
    if(!f) return null;
    const k = (Number(grams) || 0) / 100;
    const out = {
      food:f, grams:Number(grams) || 0,
      kcal:f.kcal * k, protein:f.p * k, fat:f.f * k, sat:(f.sat || 0) * k,
      carb:f.c * k, fiber:(f.fib || 0) * k,
      micro:{}, flags:f.flags || [], ironType:f.ironType || 'nonheme',
    };
    MICROS.forEach(id => {
      const v = f.micro ? f.micro[id] : undefined;
      out.micro[id] = v === undefined ? null : v * k;
    });
    return out;
  }

  /* Ev olcusunu grama cevirir: "1 tabak" -> 250 g. */
  function portionGrams(foodId, label){
    const f = SP.FOOD_BY_ID[foodId];
    if(!f || !f.portions) return null;
    const p = f.portions.find(x => U.norm(x.label) === U.norm(label));
    return p ? p.g : null;
  }

  /* -------------------------------------------------------- biyoyararlanim

     Emilim ogun duzeyinde hesaplanir, gun duzeyinde degil: cay demirin
     emilimini yalnizca AYNI ogunde bozar. Bu yuzden toplama girmeden once
     her ogun kendi icinde degerlendirilir. */

  const ABSORB_BASE = { iron:0.05, calcium:0.30, zinc:0.30, vitd:0.60, folate:0.60,
    b12:0.50, magnesium:0.40, omega3:0.80 };

  function absorbMeal(items){
    /* once ham toplam */
    const raw = { kcal:0, protein:0, fat:0, sat:0, carb:0, fiber:0, micro:{} };
    MICROS.forEach(id => { raw.micro[id] = 0; });
    const unknown = {};
    let hemeIron = 0, nonHemeIron = 0;
    const flags = {};

    items.forEach(it => {
      const c = contribution(it.foodId, it.g);
      if(!c) return;
      raw.kcal += c.kcal; raw.protein += c.protein; raw.fat += c.fat;
      raw.sat += c.sat; raw.carb += c.carb; raw.fiber += c.fiber;
      MICROS.forEach(id => {
        if(c.micro[id] == null){ unknown[id] = (unknown[id] || 0) + 1; return; }
        raw.micro[id] += c.micro[id];
      });
      const fe = c.micro.iron || 0;
      if(c.ironType === 'heme') hemeIron += fe; else nonHemeIron += fe;
      (c.flags || []).forEach(fl => { flags[fl] = true; });
    });

    /* --- demir: kaynak tipine ve ogun icerigine gore --- */
    let nonHemeFactor = ABSORB_BASE.iron;
    const notes = [];
    if(raw.micro.vitc >= 25){
      nonHemeFactor *= 3;
      notes.push({ kind:'boost', key:'vitc',
        text:'Öğünde ' + Math.round(raw.micro.vitc) + ' mg C vitamini var — bitkisel demir emilimi 3 katına çıktı.' });
    }
    if(flags.tannin){
      nonHemeFactor *= 0.5;
      notes.push({ kind:'block', key:'tannin',
        text:'Öğünde çay ya da kahve var — demir emilimi yarıya indi. Bir saat sonraya bırakmak farkı geri getirir.' });
    }
    if(raw.micro.calcium >= 300){
      nonHemeFactor *= 0.7;
      notes.push({ kind:'block', key:'calcium',
        text:'Öğünde ' + Math.round(raw.micro.calcium) + ' mg kalsiyum var — demir ve çinko emilimini düşürüyor.' });
    }
    if(flags.phytate){
      nonHemeFactor *= 0.85;
      notes.push({ kind:'block', key:'phytate',
        text:'Tam tahıl ve bakliyattaki fitat mineral emilimini düşürüyor. Islatmak ve mayalamak kaybı azaltır.' });
    }
    nonHemeFactor = U.clamp(nonHemeFactor, 0.01, 0.20);

    /* --- kalsiyum ve D vitamini --- */
    let caFactor = ABSORB_BASE.calcium;
    if(raw.micro.vitd >= 2){
      caFactor *= 1.4;
      notes.push({ kind:'boost', key:'vitd',
        text:'Öğünde D vitamini var — kalsiyum emilimi arttı.' });
    }
    let vitdFactor = ABSORB_BASE.vitd;
    if(raw.fat >= 10){
      vitdFactor *= 1.4;
      notes.push({ kind:'boost', key:'fat',
        text:'Öğün yağ içeriyor — D vitamini yağda çözünür, taşınabiliyor.' });
    }else if(raw.micro.vitd > 0){
      vitdFactor *= 0.6;
      notes.push({ kind:'block', key:'fat',
        text:'Öğünde neredeyse hiç yağ yok — D vitamini yeterince emilemiyor.' });
    }

    /* --- cinko --- */
    let znFactor = ABSORB_BASE.zinc;
    if(flags.phytate) znFactor *= 0.75;
    if(hemeIron > 0) znFactor *= 1.2;

    const absorbed = {};
    MICROS.forEach(id => { absorbed[id] = (raw.micro[id] || 0) * (ABSORB_BASE[id] != null ? ABSORB_BASE[id] : 1); });
    absorbed.iron = hemeIron * 0.25 + nonHemeIron * nonHemeFactor;
    absorbed.calcium = raw.micro.calcium * caFactor;
    absorbed.vitd = raw.micro.vitd * vitdFactor;
    absorbed.zinc = raw.micro.zinc * znFactor;
    absorbed.vitc = raw.micro.vitc * 0.8;
    absorbed.potassium = raw.micro.potassium * 0.9;
    absorbed.sodium = raw.micro.sodium;    /* sinir olcusu; emilim carpani uygulanmaz */
    absorbed.selenium = raw.micro.selenium * 0.8;
    absorbed.iodine = raw.micro.iodine * 0.9;

    return {
      raw, absorbed, notes, unknown,
      iron:{ heme:hemeIron, nonHeme:nonHemeIron, nonHemeFactor:U.round(nonHemeFactor, 3) },
    };
  }

  /* Bir gunun butun ogunleri — her ogun kendi icinde emilim hesaplanip
     sonra toplanir. */
  function dayTotals(dateISO){
    const rows = SP.Model.mealsOf(dateISO);
    const total = { kcal:0, protein:0, fat:0, sat:0, carb:0, fiber:0, micro:{}, absorbed:{} };
    MICROS.forEach(id => { total.micro[id] = 0; total.absorbed[id] = 0; });
    const notes = [];
    const unknown = {};

    rows.forEach(meal => {
      const a = absorbMeal(meal.items || []);
      total.kcal += a.raw.kcal; total.protein += a.raw.protein; total.fat += a.raw.fat;
      total.sat += a.raw.sat; total.carb += a.raw.carb; total.fiber += a.raw.fiber;
      MICROS.forEach(id => {
        total.micro[id] += a.raw.micro[id] || 0;
        total.absorbed[id] += a.absorbed[id] || 0;
      });
      a.notes.forEach(n => notes.push(Object.assign({ slot:meal.slot }, n)));
      Object.keys(a.unknown).forEach(k => { unknown[k] = (unknown[k] || 0) + a.unknown[k]; });
    });

    total.meals = rows.length;
    total.notes = notes;
    total.unknown = unknown;
    total.empty = rows.length === 0;
    return total;
  }

  /* ------------------------------------------------------------------ acik

     Acik tek gunden degil son 7 gunun ortalamasindan okunur: bir gunun
     eksigi "acik" degildir, sureklilesen eksiklik aciktir.

     Hic ogun girilmemis gunler ortalamaya KATILMAZ. Girilmemis gunu sifir
     saymak, kullaniciyi hic yemediğine inandirmak olur. */
  function windowAverage(days){
    const n = days || 7;
    const out = { kcal:0, protein:0, fat:0, carb:0, fiber:0, micro:{}, absorbed:{}, days:0 };
    MICROS.forEach(id => { out.micro[id] = 0; out.absorbed[id] = 0; });

    for(let i = 0; i < n; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      const t = dayTotals(d);
      if(t.empty) continue;
      out.days++;
      out.kcal += t.kcal; out.protein += t.protein; out.fat += t.fat;
      out.carb += t.carb; out.fiber += t.fiber;
      MICROS.forEach(id => { out.micro[id] += t.micro[id]; out.absorbed[id] += t.absorbed[id]; });
    }
    if(!out.days) return Object.assign(out, { empty:true });
    ['kcal', 'protein', 'fat', 'carb', 'fiber'].forEach(k => { out[k] = out[k] / out.days; });
    MICROS.forEach(id => { out.micro[id] = out.micro[id] / out.days; out.absorbed[id] = out.absorbed[id] / out.days; });
    out.empty = false;
    return out;
  }

  /* Hedefin altinda kalan ogeler, en buyuk aciktan baslayarak.
     Sinir tipindeki ogeler (sodyum) ters yonde degerlendirilir. */
  function gaps(days, profile){
    const t = targets(profile);
    const avg = windowAverage(days);
    if(!t.ok || avg.empty) return { ok:false, avg, targets:t, rows:[] };

    const rows = [];
    Object.keys(t.micro).forEach(id => {
      const tg = t.micro[id];
      const got = avg.micro[id];
      const abs = avg.absorbed[id];
      if(tg.limit){
        /* sinir: asilmasi kotu */
        const pct = U.pct(got, tg.target);
        if(pct > 100){
          rows.push({ id, kind:'over', nutrient:SP.NUTRI_BY_ID[id], target:tg.target,
            got, absorbed:abs, pct, gap:got - tg.target, why:tg.why });
        }
        return;
      }
      const pct = U.pct(got, tg.target);
      if(pct < 100){
        rows.push({ id, kind:'under', nutrient:SP.NUTRI_BY_ID[id], target:tg.target,
          got, absorbed:abs, pct, gap:tg.target - got, why:tg.why });
      }
    });

    /* lif ve protein makro tarafinda */
    if(avg.fiber < t.fiber){
      rows.push({ id:'fiber', kind:'under', nutrient:SP.NUTRI_BY_ID.fiber, target:t.fiber,
        got:avg.fiber, absorbed:avg.fiber, pct:U.pct(avg.fiber, t.fiber), gap:t.fiber - avg.fiber,
        why:t.adjustments.fiber ? t.adjustments.fiber.why : null });
    }
    if(avg.protein < t.protein.min){
      rows.push({ id:'protein', kind:'under', nutrient:SP.NUTRI_BY_ID.protein, target:t.protein.min,
        got:avg.protein, absorbed:avg.protein, pct:U.pct(avg.protein, t.protein.min),
        gap:t.protein.min - avg.protein,
        why:t.adjustments.protein ? t.adjustments.protein.why : null });
    }

    rows.sort((a, b) => a.pct - b.pct);
    return { ok:true, avg, targets:t, rows };
  }

  /* Bir acigi kapatmak icin en verimli gidalar — 100 gramda en cok o ogeyi
     tasiyanlar. Emilim tipi de dikkate alinir: demir icin hayvansal kaynak
     one gecer. */
  function sourcesFor(nutrientId, limit){
    const rows = SP.FOODS.map(f => {
      const v = f.micro ? f.micro[nutrientId] : null;
      if(v == null || v <= 0) return null;
      const bonus = nutrientId === 'iron' && f.ironType === 'heme' ? 2.5 : 1;
      return { food:f, per100:v, score:v * bonus };
    }).filter(Boolean);
    rows.sort((a, b) => b.score - a.score);
    return rows.slice(0, limit || 6);
  }

  /* ------------------------------------------------------------ hane mutfagi

     Tek tencere yemek pistiginde her bireyin hedefine gore porsiyon
     carpani hesaplanir. Cikan sayi "kac gram al" demektir; herkese ayri
     yemek pisirme zorunlulugu boylece kalkar. */
  function householdSplit(foodId, totalGrams, members){
    const f = SP.FOOD_BY_ID[foodId];
    if(!f) return { ok:false, error:'Yemek bulunamadı.' };
    const list = (members || []).filter(m => m.weightKg && m.heightCm && m.birthYear);
    if(!list.length) return { ok:false, error:'Porsiyon hesabı için en az bir profilde kilo, boy ve doğum yılı gerekir.' };

    /* Her uye icin gunluk kalori hedefi; bu ogunun payi hedefin %35'i sayilir
       (ana ogun varsayimi). Oran acikca yazilir, gizli sabit degildir. */
    const MEAL_SHARE = 0.35;
    const rows = list.map(m => {
      const t = targets(m);
      const kcalNeed = (t.ok ? t.kcal : 2000) * MEAL_SHARE;
      const gramsFor = f.kcal > 0 ? (kcalNeed / f.kcal) * 100 : 0;
      return { member:m, kcalNeed:Math.round(kcalNeed), grams:Math.round(gramsFor), targets:t };
    });

    const wanted = U.sum(rows.map(r => r.grams));
    const scale = wanted > 0 ? (Number(totalGrams) || 0) / wanted : 0;

    rows.forEach(r => {
      r.share = Math.round(r.grams * scale);
      r.mult = U.round(r.grams / (wanted / rows.length), 2);
      const c = contribution(foodId, r.share);
      r.gets = c;
      /* Ogunun kendi basina kapatamadigi ogeler yan gida ile tamamlanir. */
      r.addons = [];
      if(r.targets.ok){
        const pShare = r.targets.protein.min * MEAL_SHARE;
        if(c && c.protein < pShare * 0.8){
          r.addons.push({ need:'protein',
            text:'Bu porsiyon ' + Math.round(pShare) + ' g protein hedefinin altında kalıyor — '
               + 'yanına yoğurt ya da bir yumurta.' });
        }
      }
    });

    return { ok:true, food:f, totalGrams:Number(totalGrams) || 0, wanted, scale:U.round(scale, 2),
      rows, mealShare:MEAL_SHARE,
      short:scale < 0.9 ? Math.round(wanted - (Number(totalGrams) || 0)) : 0 };
  }

  return {
    MICROS, LAB_LINKS, ABSORB_BASE,
    bmr, tdee, activityFactor, baseRda, labAdjust, targets,
    contribution, portionGrams, absorbMeal, dayTotals, windowAverage,
    gaps, sourcesFor, householdSplit,
  };
})();
