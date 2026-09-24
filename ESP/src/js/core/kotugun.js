/* KÖTÜ GÜN MODU (fikir 16, ESP) — tek dokunuşla günü asgari güne indirmek.

   Sözler:
     1. SIRAYI KIRMAZ, KISALTIR. Öncelik sırasının ilk üçü (tıkanmış temel,
        zamana bağlı hedef, vadesi gelen tekrar) kötü günde de geçerlidir:
        unutma eğrisi kötü günü beklemez. Dört ve beş (sentez, genişleme)
        yerine «asgari gün yeter» gelir (core/planner.js).
     2. GÜNÜN ÖLÇÜSÜ ASGARİ GÜNDÜR (data/rules.js `MINIMUM_DAY`). Seriyi
        DONDURMAZ; hasta gün için ayrı düğme var (brand/ortak/seri.js).
     3. KÜÇÜK AKSİYONDUR: tek gün, «Geri al» ile döner (AGENTS §1.9);
        geçmiş gün sonradan «kötüydü» diye yeniden yazılmaz. */

window.ESP = window.ESP || {};

ESP.KotuGun = (function(){
  const U = () => ESP.U;
  const KEY = 'meta/kotugun';
  const SAKLA_GUN = 60;

  function kayit(){
    if(!ESP.S.kotuGun || typeof ESP.S.kotuGun !== 'object') ESP.S.kotuGun = {};
    return ESP.S.kotuGun;
  }
  async function yukle(){
    const d = await ESP.Store.get(KEY);
    ESP.S.kotuGun = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
    return ESP.S.kotuGun;
  }
  async function kaydet(){
    const sinir = U().iso(U().addDays(U().today(), -SAKLA_GUN));
    const k = kayit();
    Object.keys(k).forEach(g => { if(g < sinir) delete k[g]; });
    await ESP.Store.set(KEY, k);
  }

  function aktif(gunISO){ return !!kayit()[gunISO || U().todayISO()]; }

  async function ac(gunISO){
    const g = gunISO || U().todayISO();
    if(g < U().todayISO()) return { ok:false, why:'Geçmiş bir gün sonradan kötü gün yapılmaz.' };
    if(aktif(g)) return { ok:false, why:'Bugün zaten kötü gün modunda.' };
    kayit()[g] = { at:new Date().toISOString() };
    await kaydet();
    return { ok:true, gun:g };
  }

  async function kapat(gunISO){
    const g = gunISO || U().todayISO();
    if(!aktif(g)) return { ok:false, why:'Bu gün kötü gün modunda değil.' };
    delete kayit()[g];
    await kaydet();
    return { ok:true, gun:g };
  }

  return { yukle, aktif, ac, kapat };
})();
