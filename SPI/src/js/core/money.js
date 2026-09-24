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
    /* BAM araştırması (core/bilgi.js): kaynaklı ama yine TAHMİN — fişin
       altında, tohum tablosunun üstünde durur; tarihi kendi araştırmasıdır. */
    const bam = SP.S.bamPrices ? SP.S.bamPrices[foodId] : null;
    if(bam && bam.tl){
      const months = monthsSince(bam.at);
      return { tl:bam.tl, source:'bam', at:bam.at, months, age:ageBand(months),
        cert:'estimated', label:'BAM araştırması (tahmin)' };
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
      kcal += c.kcal; protein += c.protein; if(c.fiber != null) fiber += c.fiber;
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
      const per100 = SP.Nutri.per100Of(f, nutrientId);
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

  /* ------------------------------------------------------------- butce

     Sedef tek basina butce yapmaz: diger uc kocun TALEBINI toplar. Talep
     kural motorlarindan gelir, tahminden degil —

       Nesrin  haftalik sepet maliyeti (gida fiyatlarindan)
       Kerem   vadesi gecmis panellerin test ucreti
       Baris   eksik ekipman

     Fiyati bilinmeyen kalem SIFIR sayilmaz. "veri yok" olarak durur ve
     toplama girmez; toplamin yaninda kac kalemin disarida kaldigi yazar.
     Bilinmeyeni sifir sayan bir butce, gercek butceden hep kucuk cikar. */

  function budget(profile){
    const rows = [];
    const b = basketTotal();

    /* --- Nesrin: gida --- */
    rows.push({
      id:'gida', agent:'nutri', label:'Gıda',
      detail:b.rows.length
        ? b.rows.length + ' kalem haftalık sepet'
        : 'Sepet boş — haftalık alışveriş girilmedi',
      monthly:b.rows.length ? U.round(b.total * 4.33, 0) : null,
      cert:!b.rows.length ? 'missing' : (b.estimate.pct >= 50 ? 'estimated' : 'measured'),
      note:b.rows.length && b.estimate.pct
        ? 'Hesabın %' + b.estimate.pct + '\'i tahmin fiyatıyla.' : null,
      route:'basket',
    });

    /* --- Kerem: test --- */
    const overdue = SP.Bio.overdue();
    const testFee = SP.S.basket && SP.S.basket.testFee != null ? Number(SP.S.basket.testFee) : null;
    rows.push({
      id:'test', agent:'lab', label:'Test',
      detail:overdue.length
        ? overdue.length + ' panelin ölçüm borcu var'
        : 'Vadesi geçmiş panel yok',
      monthly:overdue.length && testFee != null ? U.round(overdue.length * testFee / 6, 0) : null,
      cert:!overdue.length ? 'measured' : (testFee == null ? 'missing' : 'estimated'),
      note:overdue.length && testFee == null
        ? 'Panel ücreti girilmedi; bu kalem toplama katılmadı.'
        : (overdue.length ? 'Altı ayda bir tekrarlanacak varsayımıyla aylığa bölündü.' : null),
      route:'labs',
    });

    /* --- Baris: ekipman --- */
    const owned = (SP.S.basket && SP.S.basket.equipment) || [];
    const needed = [];
    SP.EXERCISES.forEach(e => {
      if(!e.equip || e.equip === 'yok') return;
      if(needed.indexOf(e.equip) < 0 && owned.indexOf(e.equip) < 0) needed.push(e.equip);
    });
    rows.push({
      id:'ekipman', agent:'move', label:'Ekipman',
      detail:needed.length ? 'Eksik: ' + needed.join(', ') : 'Ek ekipman gerekmiyor',
      monthly:needed.length ? null : 0,
      cert:needed.length ? 'missing' : 'measured',
      note:needed.length
        ? 'Ekipman fiyatı sistemde tutulmaz. Vücut ağırlığı hareketleri ekipmansız çalışır.'
        : null,
      route:'move',
    });

    const known = rows.filter(r => r.monthly != null);
    const unknown = rows.filter(r => r.monthly == null);
    const total = U.round(U.sum(known.map(r => r.monthly)), 0);
    const limit = SP.S.basket && SP.S.basket.monthlyLimit != null
      ? Number(SP.S.basket.monthlyLimit) : null;

    return {
      rows, total, unknown:unknown.length,
      limit, over:limit != null && total > limit,
      pct:limit ? U.pct(total, limit) : null,
      coverage:basketCoverage(profile),
    };
  }

  /* Fikir 30: ogunlerden alisveris listesi. SPI'de ileriye donuk ogun
     plani yok; buradaki "plan" kullanicinin SON YEDI GUNDE gercekte
     yedigidir (olculmus ogun kayitlari). Kayitsiz gun sifir sayilmaz:
     kayitli gunlerin ortalamasi yedi gune olceklenir ve bu TAHMINdir;
     yedi gunun hepsi kayitliysa HESAPLANDI. Liste yalniz kullanicinin kendi
     ogunlerinden gelir; hanenin diger uyelerinin payi eklenmez (ekran bunu
     soyler). Sepete yazmak orta aksiyondur: onizleme + tek onay + geri al
     (screens/basket.js). */
  const LISTE_GUN = 7, LISTE_EN_AZ = 3;
  function ogundenListe(){
    const bugun = U.today();
    const gram = {};
    const bilinmeyen = {};
    let kayitli = 0;
    for(let i = 0; i < LISTE_GUN; i++){
      const d = U.iso(U.addDays(bugun, -i));
      const items = [].concat.apply([], ((SP.S.meals && SP.S.meals[d]) || []).map(m => m.items || []));
      if(!items.length) continue;
      kayitli++;
      items.forEach(it => {
        if(!SP.FOOD_BY_ID[it.foodId]){ bilinmeyen[it.foodId] = true; return; }
        const g = Number(it.g) || 0;
        if(g > 0) gram[it.foodId] = (gram[it.foodId] || 0) + g;
      });
    }
    const nBilinmeyen = Object.keys(bilinmeyen).length;
    if(kayitli < LISTE_EN_AZ){
      return { ok:false, kayitliGun:kayitli, bilinmeyen:nBilinmeyen,
        note:'Liste için son yedi günde en az ' + LISTE_EN_AZ + ' günlük öğün kaydı gerekir; '
          + 'şu an ' + kayitli + ' gün var. Kaydı olmayan gün sıfır sayılmaz.' };
    }
    const olcek = LISTE_GUN / kayitli;
    const sepet = {};
    ((SP.S.basket && SP.S.basket.items) || []).forEach(x => { sepet[x.foodId] = Number(x.kg) || 0; });
    const tum = Object.keys(gram).map(id => {
      const kg = Math.max(0.05, U.round(gram[id] * olcek / 1000, 2));
      const sepette = sepet[id] || 0;
      const eksik = U.round(Math.max(0, kg - sepette), 2);
      return { food:SP.FOOD_BY_ID[id], kg, sepette, eksik,
        cost:eksik > 0 ? costOf(id, eksik) : 0, price:priceOf(id) };
    });
    const satirlar = tum.filter(r => r.eksik >= 0.05)
      .sort((a, b) => (b.cost || 0) - (a.cost || 0));
    return { ok:true, kayitliGun:kayitli, bilinmeyen:nBilinmeyen,
      cert:kayitli === LISTE_GUN ? 'derived' : 'estimated',
      satirlar, yeterli:tum.length - satirlar.length,
      toplam:U.round(U.sum(satirlar.map(r => r.cost || 0)), 2),
      fiyatsiz:satirlar.filter(r => r.cost == null).length };
  }

  return {
    priceOf, costOf, monthsSince, ageBand, estimateShare, budget,
    basketRows, basketTotal, basketCoverage, ogundenListe,
    substitutesFor, swapOpportunities, costPerNutrient, bulkOpportunities,
    status,
  };
})();
