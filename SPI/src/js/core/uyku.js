/* UYKU — gece uykusu ve gün içindeki kısa uykular (kestirme).

   Kullanıcı (2026-10-20): «uyku daha esnek ve kişiselleştirilebilir olsun;
   öğlen 30 dakikalık kısa uyku gibi birden çok uyku girilebilsin».

   Sözler:
     1. GECE UYKUSU AYRI KALIR. `vitals.sleep` gecenin uykusudur (saat);
        toparlanma, asgari gün ve analiz onu okur. Kestirme ona EKLENMEZ:
        30 dakikalık öğle uykusu «7 saat uyudum» gecesini 7,5 yapmaz.
     2. KESTİRME BİRDEN ÇOKTUR. `vitals.kestirmeler = [{ id, dk, bas, at }]`;
        her biri ayrı kayıttır, ikinci kayıt birinciyi ezmez.
     3. SÜRE ÖLÇÜMDÜR, SAAT İSTEĞE BAĞLI. Başlangıç saati yazılmadıysa
        uydurulmaz (null).
     4. GÜNÜN TOPLAMI HESAPLANIR. gece + kestirmeler; gece girilmediyse
        toplam «veri yok» kalır, kestirmeler ayrıca söylenir. */

window.SP = window.SP || {};

SP.Uyku = (function(){
  const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;
  const EN_COK_DK = 240, EN_COK_ADET = 6;

  function liste(iso){
    const v = SP.S.vitals && SP.S.vitals[iso];
    return v && Array.isArray(v.kestirmeler) ? v.kestirmeler.slice() : [];
  }

  function dogrula(k){
    const dk = Number(k && k.dk);
    if(!isFinite(dk) || dk <= 0) return 'Kısa uykunun süresini dakika olarak yaz.';
    if(dk > EN_COK_DK) return dk + ' dakika kısa uyku için fazla; gece uykusuysa «Uyku (saat)» alanına yaz.';
    if(k.bas && !SAAT.test(k.bas)) return 'Saat 00:00–23:59 biçiminde olur.';
    return null;
  }

  async function ekle(iso, k){
    const hata = dogrula(k);
    if(hata) return { ok:false, why:hata };
    const l = liste(iso);
    if(l.length >= EN_COK_ADET) return { ok:false, why:'Bir günde en çok ' + EN_COK_ADET + ' kısa uyku yazılır.' };
    const yeni = { id:'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      dk:Math.round(Number(k.dk)), bas:k.bas || null, at:new Date().toISOString() };
    await SP.Model.saveVitals(iso, { kestirmeler:l.concat([yeni]) });
    return { ok:true, kayit:yeni };
  }

  async function sil(iso, id){
    const l = liste(iso);
    const eski = l.find(x => x.id === id);
    if(!eski) return null;
    await SP.Model.saveVitals(iso, { kestirmeler:l.filter(x => x.id !== id) });
    return eski;
  }

  function gun(iso){
    const v = SP.S.vitals && SP.S.vitals[iso];
    const gece = v && v.sleep != null ? Number(v.sleep) : null;
    const k = liste(iso);
    const kDk = k.reduce((a, x) => a + (Number(x.dk) || 0), 0);
    return { gece, kestirme:k, kestirmeDk:kDk,
      toplamDk:gece == null ? null : Math.round(gece * 60 + kDk),
      etiket:gece == null && !k.length ? 'veri yok' : 'ölçüldü' };
  }

  function sureYaz(dk){
    if(dk == null) return '—';
    const s = Math.floor(dk / 60), d = Math.round(dk % 60);
    return (s ? s + ' sa' : '') + (s && d ? ' ' : '') + (d || !s ? d + ' dk' : '');
  }

  return { liste, ekle, sil, gun, dogrula, sureYaz, SAAT, EN_COK_DK };
})();
