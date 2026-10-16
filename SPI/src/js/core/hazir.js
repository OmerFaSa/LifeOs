/* HAZIR ÖĞÜN ve HAZIR ANTRENMAN — kullanıcının kendi adını koyduğu kayıtlar,
   tek dokunuşla bugüne.

   Depo sahibinin isteği (2026-10-17): «Bir öğün hazırlayacağız; o öğünden
   yediğimi kolay bir tıkla hemen güne aktaracağım. Sporda da belirli
   antrenmanları ‹bugün onu yaptım› diye tuşlarla ekleyeyim. Bunlar King'de
   değil, alanla ilgili yerde olsun.»

   Sözler:
     1. KULLANICININ KENDİ KAYDINDAN. Hazır öğün, girilmiş bir öğünün
        kopyasıdır (Öğün › öğün kartı › «Hazır öğün yap»); hazır antrenman,
        kaydedilmiş bir seansın kopyasıdır (Hareket › Bugünün seansları).
        Uydurulmuş içerik, varsayılan gram ya da set yoktur.
     2. EKLEMEK BUGÜNÜN KAYDIDIR: kullanıcı «bunu yedim / yaptım» dedi.
        Gıdanın etiketi (ölçüldü / tahmin) aslındaki gibi kalır; antrenmanın
        ZORLANMA puanı (RPE) ve notu kopyalanmaz — o günün hissidir
        (core/dunku.js ile aynı kural).
     3. GERİ ALINIR. Ekleme yeni kaydın kimliğini döner; «Geri al» onu siler.
     4. PROFİLDE DURUR. Liste profilin parçasıdır: hesapla öteki cihazlara
        gider, yedeğe girer. En çok 24 öğün, 24 antrenman. Aynı ad ikinci
        kez saklanırsa eskisinin yerine geçer.
     5. ADIYLA BULUNUR. «menemen tabağımı yedim» gibi bir cümle hazır öğünün
        adını içeriyorsa `bul` onu döner; ekleme yine önizleme ve onayla
        (Bugün kutusu ve King, giris.js). */

window.SP = window.SP || {};

SP.Hazir = (function(){
  const EN_COK = 24;
  const M = () => SP.Model;
  const U = () => SP.U;
  const P = () => SP.S.profile || {};

  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

  function ogunler(){ return Array.isArray(P().hazirOgunler) ? P().hazirOgunler.filter(x => x && x.id && Array.isArray(x.items)) : []; }
  function antrenmanlar(){ return Array.isArray(P().hazirAntrenmanlar) ? P().hazirAntrenmanlar.filter(x => x && x.id && x.kayit) : []; }

  function slotAd(id){ const s = (SP.MEAL_SLOTS || []).find(x => x.id === id); return s ? s.label : id; }
  function kalemAd(it){
    const f = SP.FOOD_BY_ID && SP.FOOD_BY_ID[it.foodId];
    return (f ? f.name : it.foodId) + (Number(it.g) > 0 ? ' ' + it.g + ' g' : '');
  }
  function ogunOzet(h){ return h.items.map(kalemAd).join(', '); }
  function ogunVarsayilanAd(meal){
    const ilk = (meal.items || []).map(it => SP.FOOD_BY_ID && SP.FOOD_BY_ID[it.foodId]).filter(Boolean)[0];
    return ilk ? ilk.name + ((meal.items || []).length > 1 ? ' tabağı' : '') : slotAd(meal.slot);
  }

  function temizAd(ad){ return String(ad || '').replace(/\s+/g, ' ').trim().slice(0, 40); }

  /* ------------------------------------------------------------- öğün */

  async function ogunSakla(meal, ad){
    if(!meal || !(meal.items || []).length) return { ok:false, why:'Boş öğün saklanmaz.' };
    const isim = temizAd(ad) || ogunVarsayilanAd(meal);
    const kayit = { id:U().uid('ho'), ad:isim, slot:meal.slot,
      items:meal.items.map(it => Object.assign({}, it)), at:new Date().toISOString() };
    const l = [kayit].concat(ogunler().filter(x => kucuk(x.ad) !== kucuk(isim))).slice(0, EN_COK);
    await M().saveProfile({ hazirOgunler:l });
    return { ok:true, kayit };
  }
  async function ogunSil(id){
    const l = ogunler();
    if(!l.some(x => x.id === id)) return { ok:false, why:'Hazır öğün bulunamadı.' };
    await M().saveProfile({ hazirOgunler:l.filter(x => x.id !== id) });
    return { ok:true };
  }
  /* `slot` verilmezse hazır öğünün kendi öğün yeri. */
  async function ogunEkle(id, gun, slot){
    const h = ogunler().find(x => x.id === id);
    if(!h) return { ok:false, why:'Hazır öğün bulunamadı.' };
    const yeni = Object.assign(M().newMeal(slot || h.slot), { items:h.items.map(it => Object.assign({}, it)), note:h.ad });
    await M().addMeal(gun, yeni);
    return { ok:true, id:yeni.id, ad:h.ad, geriAl:async () => { await M().deleteMeal(gun, yeni.id); } };
  }

  /* -------------------------------------------------------- antrenman */

  const KOPYALANMAZ = ['id', 'date', 'rpe', 'note', 'createdAt', 'updatedAt', 'rota', 'route', 'gps'];
  async function antrenmanSakla(w, ad){
    if(!w) return { ok:false, why:'Seans bulunamadı.' };
    const kayit = JSON.parse(JSON.stringify(w));
    KOPYALANMAZ.forEach(k => { delete kayit[k]; });
    const isim = temizAd(ad) || w.name || 'Antrenman';
    const h = { id:U().uid('ha'), ad:isim, kayit, at:new Date().toISOString() };
    const l = [h].concat(antrenmanlar().filter(x => kucuk(x.ad) !== kucuk(isim))).slice(0, EN_COK);
    await M().saveProfile({ hazirAntrenmanlar:l });
    return { ok:true, kayit:h };
  }
  async function antrenmanSil(id){
    const l = antrenmanlar();
    if(!l.some(x => x.id === id)) return { ok:false, why:'Hazır antrenman bulunamadı.' };
    await M().saveProfile({ hazirAntrenmanlar:l.filter(x => x.id !== id) });
    return { ok:true };
  }
  async function antrenmanEkle(id, gun){
    const h = antrenmanlar().find(x => x.id === id);
    if(!h) return { ok:false, why:'Hazır antrenman bulunamadı.' };
    const yeni = Object.assign(JSON.parse(JSON.stringify(h.kayit)), { id:U().uid('w'), date:gun, rpe:null,
      note:'', createdAt:new Date().toISOString() });
    await M().saveWorkout(yeni);
    return { ok:true, id:yeni.id, ad:h.ad, geriAl:async () => { await M().deleteWorkout(yeni.id); } };
  }
  function antrenmanOzet(h){
    const k = h.kayit || {};
    return [k.minutes ? k.minutes + ' dk' : null, (k.items || []).length ? (k.items || []).length + ' hareket' : null].filter(Boolean).join(' · ');
  }
  function bugunVar(h, gun){ return M().workoutsOf(gun).some(w => (w.name || '') === (h.kayit.name || '') && (w.minutes || 0) === (h.kayit.minutes || 0)); }

  /* ----------------------------------------------------- cümleden bul */

  const YEDIM = /(yedim|yedik|içtim|yiyorum|yiyeceğim|yemek yedim|atıştırdım|kahvaltı ettim)/;
  const YAPTIM = /(yaptım|yaptık|bitirdim|tamamladım|çalıştım|antrenman ettim|koştum)/;
  /* En uzun ad kazanır: «menemen» ve «menemen tabağı» varsa ikincisi. */
  function bul(metin){
    const t = kucuk(metin);
    if(!t) return null;
    const ad = (l, tur) => l.map(h => ({ h, tur, a:kucuk(h.ad) })).filter(x => x.a.length >= 3 && t.indexOf(x.a) >= 0);
    const adaylar = (YEDIM.test(t) ? ad(ogunler(), 'ogun') : []).concat(YAPTIM.test(t) ? ad(antrenmanlar(), 'antrenman') : []);
    if(!adaylar.length) return null;
    adaylar.sort((x, y) => y.a.length - x.a.length);
    return { tur:adaylar[0].tur, hazir:adaylar[0].h };
  }

  return { ogunler, antrenmanlar, ogunSakla, ogunSil, ogunEkle, ogunOzet, ogunVarsayilanAd,
    antrenmanSakla, antrenmanSil, antrenmanEkle, antrenmanOzet, bugunVar, bul, EN_COK };
})();
