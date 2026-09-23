/* ESP HEDEF PLANI — aktif bir hedefi günlük düzene çevirir.
   (ekip/PLAN.md §3.D; Tur 3)

   Plan KODDUR; model yok. ESP'nin kendi araçlarını kullanır, yenisini
   icat etmez:

     odak          hedefin disiplini `profile.focus` olur: eşit iki iş
                   çıkarsa sıradaki iş bu disiplinden seçilir (planner.js).
     günlük taban  `profile.dailyMinutes` hedefin istediği vakitten
                   AZSA ona yükselir; fazlaysa dokunulmaz — taban bütün
                   disiplinlerin ortak vaktidir, plan onu küçültmez.
     bölüm         hedefin disiplini kapalıysa açılır (verisi hiç
                   silinmemişti; modules.js).
     tarihli hedef hedefin son tarihinde bir hedef kaydı (goals/): öncelik
                   sırasında ikinci sıraya girer.
     kontrol       dört haftada bir: o güne kadar BEKLENEN ile ÖLÇÜLEN
                   (dil: pratik saati · okuma: bitirilen kitap ·
                   enstrüman: temiz tempo).
     çalışma       merdivenin bir üst basamağının çalışma listesi
                   (data/curriculum.js) — plan yeni içerik uydurmaz.

   Uygulama BÜYÜK aksiyondur (AGENTS.md §1.9): ayrıntılı önizleme + onay +
   geri dönüş noktası. `ESP.Plans` içinde `hedefplan` türü; model bu türü
   öneremez. Geri alma yalnız planın yazdığını geri alır: kullanıcı arada
   odağı ya da tabanı kendisi değiştirdiyse ezilmez. */

window.ESP = window.ESP || {};

ESP.HedefPlan = (function(){
  const STORE = 'hedefplan';
  const KONTROL_HAFTA = 4;
  const U = () => ESP.U;
  const HD = () => ESP.Hedefler;

  function yuvarla(x, n){ const k = Math.pow(10, n == null ? 2 : n); return Math.round(x * k) / k; }
  function sayiYaz(x, n){ return String(yuvarla(x, n == null ? 1 : n)).replace('.', ','); }
  function gunEkle(iso, n){ return U().iso(U().addDays(U().parse(iso), n)); }
  function discAdi(id){ return ((ESP.DISCIPLINE_BY_ID || {})[id] || {}).label || id; }

  /* ------------------------------------------------------------ depo */

  function liste(){ return ESP.S.hedefPlanlar || (ESP.S.hedefPlanlar = []); }
  async function yukle(){
    ESP.S.hedefPlanlar = ((await ESP.Store.list(STORE)) || []).filter(p => p && p.id && p.hedefId);
  }
  async function kaydet(p){
    ESP.S.hedefPlanlar = liste().filter(x => x.id !== p.id).concat([p]);
    await ESP.Store.set(STORE + '/' + p.id, p);
    return p;
  }
  function aktif(hedefId){
    return liste().filter(p => p.hedefId === hedefId && p.durum === 'uygulandi')
      .sort((a, b) => String(b.olusturma).localeCompare(String(a.olusturma)))[0] || null;
  }

  /* ----------------------------------------------------------- ölçü

     Her paketin ölçtüğü şey ve planın başından bu yana ölçülen değer.
     «Veri yok» sıfır değildir: hiç ölçüm yoksa `null` döner. */
  function olculen(plan, bugun){
    if(plan.paket === 'dil'){
      let dk = 0, var_ = false;
      Object.keys(ESP.S.days || {}).forEach(d => {
        if(d < plan.baslangic || d > bugun) return;
        (ESP.S.days[d].sessions || []).forEach(s => {
          if(s && s.disc === 'lang' && s.minutesCert === 'measured' && s.minutes > 0){ dk += s.minutes; var_ = true; }
        });
      });
      return var_ ? { deger:yuvarla(dk / 60, 1), birim:'saat', etiket:'olculdu' } : null;
    }
    if(plan.paket === 'okuma'){
      const n = (ESP.S.books || []).filter(b => b && b.finishedAt && b.finishedAt >= plan.baslangic
        && b.finishedAt <= bugun).length;
      return { deger:n, birim:'kitap', etiket:'olculdu' };
    }
    if(plan.paket === 'enstruman'){
      const l = [];
      (ESP.S.pieces || []).forEach(p => (p.attempts || []).forEach(a => {
        if(a && a.clean && a.bpm > 0 && a.date && a.date > plan.baslangic && a.date <= bugun) l.push(a.bpm);
      }));
      return l.length ? { deger:Math.max.apply(null, l), birim:'BPM', etiket:'tahmin' } : null;
    }
    return null;
  }

  /* Beklenen değer: başlangıçtan hedefe doğrusal. Dil ve okumada toplam
     iş, enstrümanda tempo. */
  function beklenenAt(plan, tarih){
    const gun = Math.max(0, U().diffDays(plan.baslangic, tarih));
    const oran = Math.min(1, gun / Math.max(1, U().diffDays(plan.baslangic, plan.bitis)));
    if(plan.paket === 'enstruman') return yuvarla(plan.bas + (plan.hedef - plan.bas) * oran, 0);
    return yuvarla(plan.hedef * oran, 1);
  }

  /* ------------------------------------------------------------- kur */

  function kur(hedef, bugunISO){
    const bugun = bugunISO || U().todayISO();
    const h = hedef;
    if(!h) return { ok:false, why:'Hedef bulunamadı.' };
    const paket = HD().PAKET_BY_ID[h.paket];
    if(!paket) return { ok:false, why:'Bu hedef için plan motoru henüz yok.' };
    if(h.durum !== 'aktif') return { ok:false, why:'Plan yalnız aktif bir hedef için kurulur.' };
    if(!h.son_tarih || !(h.son_tarih > bugun)) return { ok:false, why:'Hedefin son tarihi geçmiş ya da yok.' };
    const dk = h.kapasite && h.kapasite.gunluk_dk;
    if(!(dk > 0)) return { ok:false, why:'Günde ne kadar vakit ayıracağın bilinmeden plan kurulamaz.' };
    const gunler = (h.kapasite && h.kapasite.haftalik_gun) || 7;
    const disc = paket.disc;

    let bas = 0, hedefDeger = null, birim = null, saat = null;
    if(h.paket === 'dil'){
      const g = paket.gerekenSaat(h, {});
      if(!(g.saat > 0)) return { ok:false, why:g.neden || 'Gereken süre hesaplanamadı.' };
      hedefDeger = g.saat; birim = 'saat'; saat = g.saat;
    }else if(h.paket === 'okuma'){
      hedefDeger = h.fark != null ? h.fark : h.hedefDeger; birim = 'kitap';
      if(!(hedefDeger > 0)) return { ok:false, why:'Kaç kitap okumak istediğin bilinmiyor.' };
      saat = paket.gerekenSaat(h, {}).saat;
    }else{
      const s = h.simdi && h.simdi.deger;
      if(!(s > 0)) return { ok:false, why:'Şu anki temiz tempon bilinmeden plan kurulamaz; '
        + 'Stüdyo’da metronomla ölç.' };
      if(!(h.hedefDeger > s)) return { ok:false, why:'Hedef tempo şu anki temiz tempondan yüksek olmalı.' };
      bas = s; hedefDeger = h.hedefDeger; birim = 'BPM';
    }

    const p = ESP.S.profile || {};
    const taban = p.dailyMinutes || 60;
    const toplamGun = U().diffDays(bugun, h.son_tarih);
    const kontrol = [];
    const plan0 = { paket:h.paket, baslangic:bugun, bitis:h.son_tarih, bas, hedef:hedefDeger };
    for(let hf = KONTROL_HAFTA; hf * 7 < toplamGun; hf += KONTROL_HAFTA){
      const t = gunEkle(bugun, hf * 7);
      kontrol.push({ tarih:t, hafta:hf, beklenen:beklenenAt(plan0, t) });
    }
    kontrol.push({ tarih:h.son_tarih, hafta:yuvarla(toplamGun / 7, 1), beklenen:hedefDeger });

    const seviye = ESP.Curriculum ? ESP.Curriculum.levelOf(disc) : null;
    const sonraki = seviye ? ESP.Curriculum.stepOf(disc, Math.min(5, seviye.rank + 1)) : null;
    const uyarilar = [];
    if(h.gerceklik && h.gerceklik.bant && h.gerceklik.bant !== 'gercekci'){
      uyarilar.push('Hedefin kararı «' + (window.LIFEOS.Hedef.BANT_ADI[h.gerceklik.bant] || h.gerceklik.bant)
        + '» idi; plan senin tarihinle kuruldu.');
    }
    if(dk * gunler / 7 > taban){
      uyarilar.push('Bu hedef günde ortalama ' + Math.round(dk * gunler / 7) + ' dakika istiyor; günlük '
        + 'taban ' + taban + ' dakikadan yükseltilir. Taban bütün disiplinlerin ortak vaktidir.');
    }

    return { ok:true, plan:{
      id:U().uid('hp'), hedefId:h.id, paket:h.paket, disc, durum:'taslak',
      olusturma:bugun, baslangic:bugun, bitis:h.son_tarih,
      gunlukDk:dk, haftalikGun:gunler, haftalikSaat:yuvarla(dk * gunler / 60, 1),
      bas, hedef:hedefDeger, birim, saat, ozet:HD().ozet(h),
      odak:{ once:p.focus || null, sonra:disc },
      taban:{ once:taban, sonra:Math.max(taban, Math.round(dk * gunler / 7)) },
      bolumAc:ESP.Mod ? !ESP.Mod.isOn(disc) : false,
      kontrol, calisma:sonraki ? { basamak:sonraki.title, rank:sonraki.rank,
        liste:(sonraki.study || []).slice(0, 5) } : null,
      uyarilar, etiket:h.gerceklik && h.gerceklik.etiket || 'tahmin', goalId:null,
    } };
  }

  /* -------------------------------------------------------- önizleme */

  function focusAdi(id){
    const f = (ESP.FOCUS || []).find(x => x.id === id);
    return f ? f.label : id ? discAdi(id) + ' ağırlıklı' : 'Dengeli';
  }

  function onizleme(plan){
    const rows = [
      { alan:'Hedef', once:'—', sonra:plan.ozet + ' · ' + U().fmtDate(plan.bitis) },
      { alan:'Günlük vakit', once:'—', sonra:plan.gunlukDk + ' dk'
        + (plan.haftalikGun < 7 ? ', haftada ' + plan.haftalikGun + ' gün' : ', her gün')
        + ' (haftada ' + sayiYaz(plan.haftalikSaat) + ' saat)' },
      { alan:'Odak', once:focusAdi(plan.odak.once), sonra:focusAdi(plan.odak.sonra) },
      { alan:'Günlük taban', once:plan.taban.once + ' dk', sonra:plan.taban.sonra + ' dk'
        + (plan.taban.sonra === plan.taban.once ? ' (değişmez)' : '') },
    ];
    if(plan.bolumAc) rows.push({ alan:discAdi(plan.disc) + ' bölümü', once:'kapalı', sonra:'açık' });
    const ilk = plan.kontrol[0];
    rows.push({ alan:'Kontrol noktaları', once:'yok', sonra:plan.kontrol.length + ' nokta · ilk '
      + U().fmtDate(ilk.tarih) + ': beklenen ' + sayiYaz(ilk.beklenen) + ' ' + plan.birim });
    rows.push({ alan:'Tarihli hedef', once:'—', sonra:U().fmtDate(plan.bitis) + ' (öncelik sırasına girer)' });
    return rows;
  }

  /* -------------------------------------------------- uygula / geri al

     Geri dönüş noktası UYGULAMADAN ÖNCE alınır. */
  async function uygula(plan){
    const p = ESP.S.profile || {};
    const geri = { kind:'hedefplan', planId:plan.id, hedefId:plan.hedefId,
      focus:p.focus == null ? null : p.focus, dailyMinutes:p.dailyMinutes == null ? null : p.dailyMinutes,
      bolumAcildi:false, goalId:null };
    if(plan.bolumAc && ESP.Mod){
      const r = await ESP.Mod.set(plan.disc, true);
      if(!r.ok) throw new Error(r.error || 'Bölüm açılamadı.');
      geri.bolumAcildi = true;
    }
    const patch = { focus:plan.odak.sonra };
    if(plan.taban.sonra !== plan.taban.once) patch.dailyMinutes = plan.taban.sonra;
    await ESP.Model.saveProfile(patch);
    const g = await ESP.Model.saveGoal(ESP.Model.newGoal({ label:plan.ozet, disc:plan.disc,
      date:plan.bitis, note:'Hedef motoru planı — kontrol noktaları Bugün › Özet › Hedeflerim’de.' }));
    geri.goalId = g.id;
    await kaydet(Object.assign({}, plan, { durum:'uygulandi', goalId:g.id,
      uygulanma:new Date().toISOString() }));
    return geri;
  }

  async function geriAl(a, durum){
    const plan = liste().find(x => x.id === a.planId);
    const p = ESP.S.profile || {};
    const patch = {};
    if(plan && p.focus === plan.odak.sonra) patch.focus = a.focus;
    if(plan && plan.taban.sonra !== plan.taban.once && p.dailyMinutes === plan.taban.sonra){
      patch.dailyMinutes = a.dailyMinutes;
    }
    if(Object.keys(patch).length) await ESP.Model.saveProfile(patch);
    if(a.goalId) await ESP.Model.deleteGoal(a.goalId);
    if(a.bolumAcildi && ESP.Mod && plan){
      const kalan = ESP.Mod.activeIds().filter(id => id !== plan.disc);
      if(kalan.length) await ESP.Mod.set(plan.disc, false);
    }
    if(plan) await kaydet(Object.assign({}, plan, { durum:durum || 'geri_alindi',
      kapanis:new Date().toISOString() }));
  }

  function uygulamaOf(hedefId){
    return (ESP.S.proposals || []).find(x => x.kind === 'hedefplan' && x.state === 'accepted'
      && x.payload && x.payload.hedefId === hedefId) || null;
  }

  /* «Planı uygula» düğmesi: teklif yazılır ve aynı anda kabul edilir —
     önizleme onayın kendisidir. Yetki Patron'undur (koç kapsamı). */
  async function uygulaHedef(hedefId){
    const h = HD().liste().find(x => x.id === hedefId);
    const r = kur(h, U().todayISO());
    if(!r.ok) return { ok:false, why:r.why };
    if(aktif(hedefId)) return { ok:false, why:'Bu hedefin uygulanmış bir planı var; önce onu geri al.' };
    const p = { id:'h:' + U().uid('hp'), agentId:'patron', kind:'hedefplan', disc:r.plan.disc,
      title:'Hedef planı: ' + r.plan.ozet, why:'Senin isteğin: Hedeflerim › Planı uygula.',
      payload:{ hedefId }, at:U().todayISO(), source:'istek', level:'buyuk' };
    const a = await ESP.Plans.accept(p);
    return a.ok ? { ok:true, plan:aktif(hedefId) } : { ok:false, why:a.error };
  }

  async function geriAlHedef(hedefId){
    const u = uygulamaOf(hedefId);
    if(!u) return { ok:false, why:'Geri alınacak bir plan yok.' };
    const r = await ESP.Plans.geriAl(u.id);
    return r.ok ? { ok:true } : { ok:false, why:r.error };
  }

  async function hedefKapandi(hedefId){
    const plan = aktif(hedefId);
    if(!plan) return null;
    const u = uygulamaOf(hedefId);
    if(u && u.applied) await geriAl(u.applied, 'kapandi');
    else await kaydet(Object.assign({}, plan, { durum:'kapandi', kapanis:new Date().toISOString() }));
    if(u){
      u.state = 'undone'; u.undoneAt = new Date().toISOString();
      await ESP.Store.set('proposals/' + encodeURIComponent(u.id), u);
    }
    return 'Hedefin planı da kapandı; odak ve günlük taban plandan önceki haline döndü.';
  }

  /* -------------------------------------------------------- ilerleme */

  function ilerleme(plan, bugunISO){
    const bugun = bugunISO || U().todayISO();
    const sonraki = (plan.kontrol || []).find(k => k.tarih >= bugun) || null;
    const o = olculen(plan, bugun);
    const gecen = U().diffDays(plan.baslangic, bugun);
    if(!o || (plan.paket === 'okuma' && gecen <= 0)){
      return { durum:'veri_yok', sonraki, metin:plan.paket === 'enstruman'
        ? 'Plan başladığından beri temiz tempo kaydı yok; ilerleme ölçülemiyor.'
        : 'Plan başladığından beri ölçülmüş çalışma yok; ilerleme ölçülemiyor.' };
    }
    const beklenen = beklenenAt(plan, bugun);
    const fark = yuvarla(o.deger - beklenen, 1);
    const tol = plan.paket === 'enstruman' ? 3 : plan.paket === 'okuma' ? 0.5 : Math.max(0.5, plan.haftalikSaat * 0.25);
    const durum = Math.abs(fark) <= tol ? 'yolunda' : fark > 0 ? 'onde' : 'geride';
    const ad = { yolunda:'Plan yolunda', onde:'Planın önündesin', geride:'Planın gerisindesin' }[durum];
    const ne = plan.paket === 'dil' ? 'ölçülen pratik ' + sayiYaz(o.deger) + ' saat'
      : plan.paket === 'okuma' ? 'bitirilen kitap ' + o.deger
        : 'en yüksek temiz tempo ' + o.deger + ' BPM (beyan)';
    return { durum, sonraki, olculen:o, beklenen, fark,
      metin:ad + ': ' + ne + ', bugüne kadar beklenen ' + sayiYaz(beklenen) + ' ' + plan.birim + '.' };
  }

  return { KONTROL_HAFTA, kur, onizleme, uygula, geriAl, uygulaHedef, geriAlHedef, hedefKapandi,
    aktif, liste, yukle, kaydet, uygulamaOf, ilerleme, olculen, beklenenAt };
})();
