/* KÖTÜ GÜN MODU (fikir 16, SPİ) — tek dokunuşla günü asgari güne indirmek.

   Sözler:
     1. YALNIZ HAFİFLETİR. Kötü gün antrenman yükünü en çok «hafif»e
        indirir (core/move.js `prescription`); dinlenme günü dinlenme
        kalır. Hiçbir hedefi, tahlili ya da ölçümü değiştirmez.
     2. GÜNÜN ÖLÇÜSÜ ASGARİ GÜNDÜR. Asgari gün (protein tabanı, su,
        15 dakika yürüyüş, 7 saat yatak) zaten «kötü günün alt sınırı»;
        mod bunu öne çıkarır. Seriyi DONDURMAZ: asgari günü tutturan kötü
        gün seriyi zaten korur; hasta gün için ayrı düğme var (core/seri).
     3. KÜÇÜK AKSİYONDUR: tek gün, tek kayıt, «Geri al» ile döner
        (AGENTS §1.9). Yalnız bugüne ve geleceğe konur; geçmiş gün
        sonradan «kötüydü» diye yeniden yazılmaz. */

window.SP = window.SP || {};

SP.KotuGun = (function(){
  const U = () => SP.U;
  const KEY = 'kotugun';
  const SAKLA_GUN = 60;
  const CARPAN = 0.6;

  function kayit(){
    if(!SP.S.kotuGun || typeof SP.S.kotuGun !== 'object') SP.S.kotuGun = {};
    return SP.S.kotuGun;
  }
  async function yukle(){
    const d = await SP.Store.get(KEY);
    SP.S.kotuGun = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
    return SP.S.kotuGun;
  }
  async function kaydet(){
    const sinir = U().iso(U().addDays(U().today(), -SAKLA_GUN));
    const k = kayit();
    Object.keys(k).forEach(g => { if(g < sinir) delete k[g]; });
    await SP.Store.set(KEY, k);
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

  return { CARPAN, yukle, aktif, ac, kapat };
})();
