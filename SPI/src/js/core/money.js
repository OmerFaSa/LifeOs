/* Modul 4'un kural motoru — fiyat, sepet ve esdeger ikame.

   Bu modulun tek etik kurali vardir: TAHMIN, OLCUM GIBI GOSTERILMEZ.
   Uygulama market taramaz; seed fiyatlari yalnizca sepetin bos kalmamasi
   icindir ve her ekranda "tahmin" olarak isaretlenir. Kullanicinin fisinden
   girdigi fiyat tahmini ezer ve "olculdu" olur.

   Ikinci kural: butce saglik hedefini indirmez. Sedef'in isi hedefi bozmadan
   en ucuz yolu bulmaktir — hedefi kucultmek degil. Bunun kod karsiligi
   costPerNutrient(): "bu ogeyi en ucuz hangi gidadan alirim" sorusudur. */

window.SP = window.SP || {};

SP.Money = (function(){
  const U = SP.U;

  /* ------------------------------------------------------------------ fiyat */

  function monthsSince(dateISO){
    if(!dateISO) return null;
    const d = String(dateISO).length === 7 ? dateISO + '-01' : dateISO;
    return Math.max(0, Math.round(U.diffDays(d, U.todayISO()) / 30));
  }

  function ageBand(months){
    if(months == null) return SP.PRICE_AGE[SP.PRICE_AGE.length - 1];
    return SP.PRICE_AGE.find(a => months <= a.maxMonths) || SP.PRICE_AGE[SP.PRICE_AGE.length - 1];
  }

  /* Bir gidanin kilogram fiyati. Kullanici degeri her zaman kazanir. */
  function priceOf(foodId){
    const own = SP.S.prices ? SP.S.prices[foodId] : null;
    if(own && own.tl){
      const months = monthsSince(own.at);
      return { tl:own.tl, source:'user', at:own.at, months, age:ageBand(months),
        cert:'measured', label:'kendi fişin' };
    }
    const seed = SP.PRICE_SEED.perKg[foodId];
    if(seed == null) return { tl:null, source:'none', cert:'missing', label:'fiyat yok' };
    const months = monthsSince(SP.PRICE_SEED.seededAt);
    return { tl:seed, source:'seed', at:SP.PRICE_SEED.seededAt, months, age:ageBand(months),
      cert:'estimated', label:'tahmin' };
  }

  function costOf(foodId, kg){
    const p = priceOf(foodId);
    if(p.tl == null) return null;
    return U.round(p.tl * (Number(kg) || 0), 2);
  }

  /* Sepetin ne kadari hala tahmine dayaniyor? Bu oran ekranda gorunur;
     yuksekse hesap "yaklasik" olarak sunulur. */
  function estimateShare(){
    const items = (SP.S.basket && SP.S.basket.items) || [];
    if(!items.length) return { pct:0, estimated:0, total:0 };
    let est = 0, tot = 0;
    items.forEach(it => {
      const c = costOf(it.foodId, it.kg);
      if(c == null) return;
      tot += c;
      if(priceOf(it.foodId).source !== 'user') est += c;
    });
    return { pct:U.pct(est, tot), estimated:U.round(est, 2), total:U.round(tot, 2) };
  }

  /* ------------------------------------------------------------------ sepet */

  function basketRows(){
    const items = (SP.S.basket && SP.S.basket.items) || [];
    return items.map(it => {
      const f = SP.FOOD_BY_ID[it.foodId];
      const p = priceOf(it.foodId);
      return { item:it, food:f, price:p, cost:costOf(it.foodId, it.kg) };
    }).filter(r => r.food).sort((a, b) => (b.cost || 0) - (a.cost || 0));
  }

  function basketTotal(){
    const rows = basketRows();
    const total = U.sum(rows.map(r => r.cost || 0));
    const limit = SP.S.basket ? SP.S.basket.weeklyLimit : null;
    const size = (SP.S.prefs && SP.S.prefs.householdSize) || 1;
    return {
      rows, total:U.round(total, 2), limit,
      perPerson:U.round(total / Math.max(1, size), 2), householdSize:size,
      over:limit != null && total > limit,
      pct:limit ? U.pct(total, limit) : null,
      estimate:estimateShare(),
      missing:rows.filter(r => r.cost == null).length,
    };
  }

  /* Sepetin haftalik besin kapsamasi — para ile saglik arasindaki kopru.
     Sepetteki gidalarin toplam besin degeri, hanenin haftalik hedefine
     bolunur. %100'un altinda kalan ogeler "sepet bunu karsilamiyor" demektir. */
  function basketCoverage(profile){
    const t = SP.Nutri.targets(profile);
    if(!t.ok) return { ok:false, note:'Kapsama hesabı için profilde kilo, boy ve doğum yılı gerekir.' };
    const size = (SP.S.prefs && SP.S.prefs.householdSize) || 1;
    const rows = basketRows();
    if(!rows.length) return { ok:false, note:'Sepet boş.' };

    const got = {};
    SP.Nutri.MICROS.forEach(id => { got[id] = 0; });
    let kcal = 0, protein = 0, fiber = 0;

    rows.forEach(r => {
      const c = SP.Nutri.contribution(r.item.foodId, (Number(r.item.kg) || 0) * 1000);
      if(!c) return;
      kcal += c.kcal; protein += c.protein; fiber += c.fiber;
      SP.Nutri.MICROS.forEach(id => { if(c.micro[id] != null) got[id] += c.micro[id]; });
    });

    const weekFactor = 7 * size;
    const out = { ok:true, kcal:{ got:Math.round(kcal), need:Math.round(t.kcal * weekFactor) },
      protein:{ got:Math.round(protein), need:Math.round(t.protein.min * weekFactor) },
      fiber:{ got:Math.round(fiber), need:Math.round(t.fiber * weekFactor) },
      micro:{}, weekFactor, householdSize:size };

    out.kcal.pct = U.pct(out.kcal.got, out.kcal.need);
    out.protein.pct = U.pct(out.protein.got, out.protein.need);
    out.fiber.pct = U.pct(out.fiber.got, out.fiber.need);

    Object.keys(t.micro).forEach(id => {
      const need = t.micro[id].target * weekFactor;
      out.micro[id] = { got:U.round(got[id], 1), need:U.round(need, 1), pct:U.pct(got[id], need),
        limit:t.micro[id].limit };
    });
    out.gaps = Object.keys(out.micro)
      .filter(id => !out.micro[id].limit && out.micro[id].pct < 80)
      .sort((a, b) => out.micro[a].pct - out.micro[b].pct);
    return out;
  }

  /* ------------------------------------------------------------------ ikame

     Oneri her zaman NEYI KORUDUGUNU ve NEYI KAYBETTIGINI birlikte soyler.
     Bu, "ucuz olan iyidir" tuzagina dusmemek icindir: sardalya somonun
     omega-3'unu korur ama D vitamini icerigi ucte biridir. */
  function substitutesFor(foodId){
    return SP.SUBSTITUTES.filter(s => s.forId === foodId).map(s => {
      const from = SP.FOOD_BY_ID[s.forId], to = SP.FOOD_BY_ID[s.withId];
      const pf = priceOf(s.forId), pt = priceOf(s.withId);
      const saveKg = (pf.tl != null && pt.tl != null) ? U.round(pf.tl - pt.tl, 2) : null;
      return {
        sub:s, from, to, priceFrom:pf, priceTo:pt, saveKg,
        savePct:(pf.tl && saveKg != null) ? U.pct(saveKg, pf.tl) : null,
        keeps:s.keeps.map(id => SP.NUTRI_BY_ID[id]).filter(Boolean),
        loses:(s.loses || []).map(id => SP.NUTRI_BY_ID[id]).filter(Boolean),
      };
    }).filter(r => r.from && r.to);
  }

  /* Sepetteki kalemler icin en buyuk tasarruf firsatlari. */
  function swapOpportunities(){
    const rows = basketRows();
    const out = [];
    rows.forEach(r => {
      substitutesFor(r.item.foodId).forEach(s => {
        if(s.saveKg == null || s.saveKg <= 0) return;
        out.push(Object.assign({}, s, {
          kg:r.item.kg,
          saveTotal:U.round(s.saveKg * r.item.kg, 2),
        }));
      });
    });
    return out.sort((a, b) => b.saveTotal - a.saveTotal);
  }

  /* --------------------------------------------------------- besin basina maliyet

     "Bu ogeyi en ucuz hangi gidadan alirim?" — butce ile saglik hedefini
     ayni tabloda bulusturur. Birim: bir birim besin ogesi basina TL. */
  function costPerNutrient(nutrientId, limit){
    const rows = SP.FOODS.map(f => {
      const per100 = f.micro ? f.micro[nutrientId] : null;
      if(per100 == null || per100 <= 0) return null;
      const p = priceOf(f.id);
      if(p.tl == null) return null;
      /* 1 kg gidada bulunan oge miktari = per100 x 10 */
      const perKg = per100 * 10;
      return { food:f, price:p, per100, perKg,
        tlPerUnit:U.round(p.tl / perKg, 3),
        cert:p.cert };
    }).filter(Boolean);
    rows.sort((a, b) => a.tlPerUnit - b.tlPerUnit);
    return rows.slice(0, limit || 8);
  }

  /* ------------------------------------------------------------- toplu alim

     Yalnizca bozulmadan saklanabilen ve hane genelinde tuketilen kalemler.
     Taze uründe toplu alim tasarruf degil israf uretir; bu yuzden liste
     data/prices.js icinde acikca sinirlidir. */
  function bulkOpportunities(){
    const size = (SP.S.prefs && SP.S.prefs.householdSize) || 1;
    const inBasket = {};
    ((SP.S.basket && SP.S.basket.items) || []).forEach(it => { inBasket[it.foodId] = it.kg; });

    return SP.BULK_ITEMS.map(b => {
      const f = SP.FOOD_BY_ID[b.id];
      const p = priceOf(b.id);
      if(!f || p.tl == null) return null;
      const weekly = inBasket[b.id] || 0;
      /* Hane ne kadar surede minimum alimi tuketir? */
      const weeksToUse = weekly > 0 ? U.round(b.minKg / weekly, 1) : null;
      return {
        item:b, food:f, price:p, weeklyKg:weekly, weeksToUse, householdSize:size,
        saveTl:U.round(p.tl * b.minKg * b.saving, 2),
        newTl:U.round(p.tl * (1 - b.saving), 2),
        worth:weekly > 0 && weeksToUse != null && weeksToUse <= 12,
      };
    }).filter(Boolean).sort((a, b) => (b.worth ? 1 : 0) - (a.worth ? 1 : 0) || b.saveTl - a.saveTl);
  }

  /* ---------------------------------------------------------------- durum */

  /* Modulun tek cumlelik ozeti — Bugun ekrani ve ofis brifingi icin. */
  function status(profile){
    const b = basketTotal();
    const stale = b.estimate.pct >= 50;
    const cov = basketCoverage(profile);

    let tone = 'ok', text;
    if(!b.rows.length){
      tone = 'muted';
      text = 'Sepet boş. Haftalık alışverişi girince maliyet ve besin kapsaması hesaplanır.';
    }else if(b.over){
      tone = 'warn';
      text = 'Haftalık sepet ' + U.fmtNum(Math.round(b.total)) + ' TL — sınırın '
        + U.fmtNum(Math.round(b.total - b.limit)) + ' TL üstünde.';
    }else if(cov.ok && cov.gaps.length){
      tone = 'warn';
      text = 'Sepet bütçeye uyuyor ama ' + cov.gaps.length + ' besin öğesini karşılamıyor.';
    }else{
      text = 'Sepet ' + U.fmtNum(Math.round(b.total)) + ' TL'
        + (b.limit ? ' · sınırın altında' : '') + '.';
    }
    if(stale && b.rows.length){
      text += ' Hesabın %' + b.estimate.pct + '\'i hâlâ tahmin fiyatıyla.';
    }
    return { tone, text, basket:b, coverage:cov, stale };
  }

  return {
    priceOf, costOf, monthsSince, ageBand, estimateShare,
    basketRows, basketTotal, basketCoverage,
    substitutesFor, swapOpportunities, costPerNutrient, bulkOpportunities,
    status,
  };
})();
