/* DÜNKÜNÜN AYNISI (fikir 5) — dünün öğünü ya da antrenmanı tek dokunuşla bugüne.

   Sözler:
     1. KULLANICI SEÇER. Hiçbir şey kendiliğinden kopyalanmaz; kart yalnız
        önerir, «Bugüne ekle» ile yazılır.
     2. KOPYA BUGÜNÜN KAYDIDIR: kullanıcı «aynısını yaptım» dedi. Gıdaların
        etiketi (ölçüldü / tahmin) aslındaki gibi kalır; antrenmanın
        ZORLANMA puanı (RPE) kopyalanmaz — o, o günün hissidir, sorulur.
     3. BUGÜN VARSA ÖNERİLMEZ. Bugün kahvaltı girilmişse dünün kahvaltısı
        önerilmez: iki kahvaltı uydurulmaz. Aynı antrenman da öyle.
     4. GERİ ALINIR: kopyanın kimliği döner, «Geri al» onu siler.
   İlaç kopyalanmaz: SPİ'de ilaç günlük doz değil, başlangıç–bitiş tarihli
   bir süreçtir (core/meds.js); zaten her gün etkindir. */

window.SP = window.SP || {};

SP.Dunku = (function(){
  const U = () => SP.U;
  function dun(bugun){ return U().iso(U().addDays(U().parse(bugun), -1)); }
  function slotAd(id){ const s = (SP.MEAL_SLOTS || []).find(x => x.id === id); return s ? s.label : id; }
  function kalemAd(it){
    const f = SP.FOOD_BY_ID && SP.FOOD_BY_ID[it.foodId];
    const g = it.g != null ? it.g : (it.kg != null ? Math.round(it.kg * 1000) : null);
    return (f ? f.name : it.foodId) + (g ? ' ' + g + ' g' : '');
  }

  function adaylar(bugun){
    const d = dun(bugun);
    const var_ = new Set(SP.Model.mealsOf(bugun).filter(m => m.items.length).map(m => m.slot));
    const ogunler = SP.Model.mealsOf(d).filter(m => m.items.length && !var_.has(m.slot))
      .map(m => ({ id:m.id, slot:m.slot, ad:slotAd(m.slot), ozet:m.items.map(kalemAd).join(', ') }));
    const bugunW = SP.Model.workoutsOf(bugun).map(w => w.templateId || w.name);
    const antrenmanlar = SP.Model.workoutsOf(d).filter(w => bugunW.indexOf(w.templateId || w.name) < 0)
      .map(w => ({ id:w.id, ad:w.name, dk:w.minutes }));
    return { dun:d, ogunler, antrenmanlar };
  }

  async function ogunKopyala(bugun, mealId){
    const m = SP.Model.mealsOf(dun(bugun)).find(x => x.id === mealId);
    if(!m) return { ok:false, why:'Dünün öğünü bulunamadı.' };
    if(!adaylar(bugun).ogunler.some(x => x.id === mealId)) return { ok:false, why:'Bugün bu öğün zaten girilmiş.' };
    const yeni = Object.assign(SP.Model.newMeal(m.slot), {
      items:m.items.map(it => Object.assign({}, it)), note:'Dünün aynısı' });
    await SP.Model.addMeal(bugun, yeni);
    return { ok:true, id:yeni.id, ad:slotAd(m.slot) };
  }

  async function antrenmanKopyala(bugun, wId){
    const w = SP.Model.workoutsOf(dun(bugun)).find(x => x.id === wId);
    if(!w) return { ok:false, why:'Dünün antrenmanı bulunamadı.' };
    if(!adaylar(bugun).antrenmanlar.some(x => x.id === wId)) return { ok:false, why:'Bugün bu antrenman zaten girilmiş.' };
    const yeni = JSON.parse(JSON.stringify(w));
    Object.assign(yeni, { id:U().uid('w'), date:bugun, rpe:null, note:'Dünün aynısı',
      createdAt:new Date().toISOString() });
    await SP.Model.saveWorkout(yeni);
    return { ok:true, id:yeni.id, ad:w.name };
  }

  async function geriAl(bugun, tur, id){
    if(tur === 'ogun') await SP.Model.deleteMeal(bugun, id);
    else await SP.Model.deleteWorkout(id);
    return { ok:true };
  }

  return { adaylar, ogunKopyala, antrenmanKopyala, geriAl };
})();
