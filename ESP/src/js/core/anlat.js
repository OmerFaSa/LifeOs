/* ÖĞRENDİĞİNİ ANLAT (fikir 42) — bir kaynaktan öğrendiğini kendi
   sözünle (sesle ya da yazıyla) anlatmak; hangi kavramların geçtiğini
   KOD sayar.

   Sözler:
     1. MODEL NOTLAMAZ. Anlatımın «iyi» olup olmadığına hüküm yok (AGENTS
        §1.5 — yetenek yargısı kurulmaz). Yalnız ölçülür: o kaynağın
        notlarında etiketlenmiş kavramlardan kaçı anlatımda GEÇTİ.
     2. KAVRAM YOKSA ÖLÇÜ YOK. Kaynağın notlarında en az 3 kavram etiketi
        yoksa kapsama hesaplanmaz; «önce notlarına kavram ekle» denir.
     3. TÜRKÇE EK TOLERE EDİLİR, ANLAM DEĞİL. «demokrasinin» «demokrasi»yi
        karşılar (kelime başı eşleşme, kök en az 4 harf); eş anlamlı
        aranmaz — geçmeyen kavram «geçmedi»dir, «bilinmiyor» değil.
     4. SES CİHAZDA KALIR: dikte tarayıcının kendi tanımasıdır (core/voice),
        kaydedilen yalnız sayılar ve tarihtir, anlatımın metni değil. */

window.ESP = window.ESP || {};

ESP.Anlat = (function(){
  const U = () => ESP.U;
  const ANAHTAR = 'meta/anlatim';
  const EN_AZ_KAVRAM = 3;
  const SAKLA = 30;

  function kavramlar(bookId){
    const out = [], gor = {};
    (ESP.S.notes || []).filter(n => n.bookId === bookId).forEach(n => (n.concepts || []).forEach(k => {
      const t = String(k || '').trim();
      const a = U().norm(t);
      if(t && !gor[a]){ gor[a] = true; out.push(t); }
    }));
    return out;
  }

  /* Kavram anlatımda geçiyor mu: kelime başında, ek tolere edilir. Çok
     kelimeli kavramın her kelimesi (4+ harfliler) geçmeli. */
  function gecer(metinN, kavram){
    const kelimeler = U().norm(kavram).split(/\s+/).filter(Boolean);
    const onemli = kelimeler.filter(k => k.length >= 4);
    const aranan = onemli.length ? onemli : kelimeler;
    return aranan.every(k => {
      const kok = k.length > 5 ? k.slice(0, Math.max(4, k.length - 2)) : k;
      return new RegExp('(^|[^a-z0-9])' + kok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(metinN);
    });
  }

  function kapsam(metin, liste){
    const m = U().norm(metin || '');
    if(!liste || liste.length < EN_AZ_KAVRAM){
      return { ok:false, etiket:'veri yok', why:'Bu kaynağın notlarında en az ' + EN_AZ_KAVRAM
        + ' kavram etiketi olmalı; önce notlarına kavram ekle.' };
    }
    if(m.trim().split(/\s+/).length < 15){
      return { ok:false, etiket:'veri yok', why:'Anlatım çok kısa; en az birkaç cümle anlat.' };
    }
    const gecen = liste.filter(k => gecer(m, k));
    const gecmeyen = liste.filter(k => gecen.indexOf(k) < 0);
    return { ok:true, etiket:'hesaplandı', gecen, gecmeyen, toplam:liste.length,
      oran:Math.round(100 * gecen.length / liste.length) };
  }

  function kayitlar(){
    if(!Array.isArray(ESP.S.anlatim)) ESP.S.anlatim = [];
    return ESP.S.anlatim;
  }
  async function yukle(){
    const d = await ESP.Store.get(ANAHTAR);
    ESP.S.anlatim = d && Array.isArray(d.liste) ? d.liste : [];
  }

  /* Kaydedilen: kaynak, tarih, kaç kavram geçti. Metin kaydedilmez. */
  async function kaydet(bookId, k){
    if(!k || !k.ok) return { ok:false, why:(k && k.why) || 'Ölçü yok.' };
    kayitlar().push({ at:new Date().toISOString(), gun:U().todayISO(), bookId,
      gecen:k.gecen.length, toplam:k.toplam });
    ESP.S.anlatim = kayitlar().slice(-SAKLA);
    await ESP.Store.set(ANAHTAR, { liste:ESP.S.anlatim });
    return { ok:true };
  }

  function son(bookId){
    const l = kayitlar().filter(x => x.bookId === bookId);
    return l.length ? l[l.length - 1] : null;
  }

  return { EN_AZ_KAVRAM, kavramlar, kapsam, gecer, kaydet, son, yukle };
})();
