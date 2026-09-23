/* TATİL MODU — AYS tarafı (fikir 56).

   Seri dondurma ortaktır (brand/ortak/seri.js): tatil günleri seriyi
   bozmaz ve HKM tatildeyken soru sormaz. Burada yalnız PLANIN karşılığı:

     tatil günleri   ARA günüdür (istisna «ara»): blok yok, hedef yok,
                     «kaçırılmış gün» sayılmaz.
     dönüş           ilk DONUS_GUN gün YARIM süre (istisna «sure»):
                     bir haftalık aradan sonra tam yükle başlamak,
                     ilk günü kırılmaya çevirmektir.

   İkisi de sıradan istisnadır: Rehber › İstisnalar'da görünür, «Bitir»
   ile geri döner, geçmişe yazılmaz (core/istisna.js). Tatil erken
   bitirilirse ara dünde biter, dönüş bugüne kayar. */

window.R = window.R || {};

R.Tatil = (function(){
  const DONUS_GUN = 2;
  const NEDEN_TATIL = 'Tatil modu';
  const NEDEN_DONUS = 'Tatil dönüşü: kademeli';
  const U = () => R.U;
  function gun(iso, n){ return U().iso(U().addDays(U().parse(iso), n)); }

  function donusDakikasi(iso){
    const I = R.Istisna;
    const temel = I.temelDakika(iso) || I.sablonDakikasi() || 120;
    return Math.max(I.DAKIKA.min, Math.round(temel / 2));
  }

  async function donusKur(from){
    return await R.Istisna.ekle({ tur:'sure', from, to:gun(from, DONUS_GUN - 1),
      dakika:donusDakikasi(from), neden:NEDEN_DONUS });
  }

  async function baslat(n){
    if(!R.Seri || !R.Istisna) return { ok:false, why:'Tatil modu yüklenmedi.' };
    const gunSayisi = Math.round(Number(n));
    if(!(gunSayisi >= 1 && gunSayisi <= 21)) return { ok:false, why:'Tatil 1–21 gün olabilir.' };
    const bugun = U().todayISO();
    const bit = gun(bugun, gunSayisi - 1);
    const s = await R.Seri.dondur(bugun, bit, 'tatil');
    if(!s.ok) return s;
    const a = await R.Istisna.ekle({ tur:'ara', from:bugun, to:bit, neden:NEDEN_TATIL });
    const d = await donusKur(gun(bit, 1));
    return { ok:true, bas:bugun, bit, ara:!!a.ok, donus:d.ok ? { from:gun(bit, 1),
      dakika:d.kayit.dakika } : null };
  }

  async function bitir(){
    if(!R.Seri || !R.Istisna) return { ok:false, why:'Tatil modu yüklenmedi.' };
    const bugun = U().todayISO();
    const r = await R.Seri.tatiliBitir();
    if(!r.ok) return r;
    for(const x of R.Istisna.liste().filter(x => x.neden === NEDEN_TATIL && x.to >= bugun)){
      await R.Istisna.bitir(x.id);
    }
    for(const x of R.Istisna.liste().filter(x => x.neden === NEDEN_DONUS && x.from > bugun)){
      await R.Istisna.kaldir(x.id);
    }
    const d = await donusKur(bugun);
    return { ok:true, donus:d.ok ? { from:bugun, dakika:d.kayit.dakika } : null };
  }

  return { baslat, bitir, donusDakikasi, DONUS_GUN, NEDEN_TATIL, NEDEN_DONUS };
})();
