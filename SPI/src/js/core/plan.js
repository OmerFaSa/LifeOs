/* SPİ PLAN MOTORU — aktif bir hedefi uygulanabilir bir plana çevirir.
   (ekip/PLAN.md §3.D; Tur 2)

   Plan KODDUR; model yok. Girdiler SPİ'nin kendi verisidir: son tartı,
   profil (boy, yaş, cinsiyet, aktivite), bazal metabolizma ve günlük
   ihtiyaç (core/nutri.js), hedefin tarihi, hekim kapısı ve hekim
   talimatları (core/hedefler.js).

   PLANIN İÇİ
     beslenme hedefi   kilo ver → «Yağ kaybetmek», al → «Kas kazanmak».
                       Protein bandı bu hedeften gelir (nutri.js).
     enerji hedefi     günlük ihtiyaç ± tempo × 7700 / 7. «1 kg ≈ 7700
                       kcal» yaygın bir yaklaşımdır, dayanağı henüz
                       bağlanmadı: sonuç «tahmin»dir. Bazal metabolizmanın
                       ALTINA inmez; taban bağlarsa ulaşılabilir tempo
                       yavaşlar ve bu SÖYLENİR.
     tartı günü        planın başladığı gün, haftada bir, sabah aç karnına.
     kontrol noktaları her hafta beklenen kilo. Başlangıç günü tartısı
                       TABANDIR, ilerleme değil.
     hekim             hekim kapısındaysa enerji ve beslenme hedefi
                       YAZILMAZ: enerji hekimle kurulur. Talimat proteini
                       kısıtlıyorsa protein bandı yükseltilmez; enerjiden
                       söz ediyorsa enerji kısmı üretilmez ve «hekiminle
                       konuş» denir. Talimatın metni yorumlanmaz, yalnız
                       çelişki aranır (PLAN §3.0: hekim talimatı >
                       kullanıcının kırmızı çizgisi > kılavuz > tahmin).

   UYGULAMA büyük aksiyondur (AGENTS.md §1.9): ayrıntılı önizleme + onay
   + geri dönüş noktası. Katalogda `plan-uygula` (core/proposals.js);
   model bu eylemi ÖNEREMEZ. */

window.SP = window.SP || {};

SP.Plan = (function(){
  const KCAL_KG = 7700;
  const STORE = 'planlar';
  const GUN_ADI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const GOAL_OF = { azalt:'cut', artir:'gain' };
  const PROTEIN_KISIT = /protein/;
  const KISIT = /(sınır|kısıt|azalt|düşük|fazla alma|en fazla|en çok|aşma|az al)/;
  const ENERJI_TALIMAT = /(kalori|kcal|enerji|diyet)/;

  const U = () => SP.U;
  const H = () => window.LIFEOS.Hedef;
  function kucuk(s){
    return String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  }
  function yuvarla(x, n){ const k = Math.pow(10, n == null ? 2 : n); return Math.round(x * k) / k; }
  function sayi(x, n){ return String(yuvarla(x, n == null ? 1 : n)).replace('.', ','); }
  function kcalYaz(x){ return x == null ? '—' : Number(Math.round(x)).toLocaleString('tr-TR') + ' kcal'; }
  function gunEkle(iso, n){ return U().iso(U().addDays(U().parse(iso), n)); }

  /* ------------------------------------------------------------ depo */

  function liste(){ return SP.S.planlar || (SP.S.planlar = []); }
  async function yukle(){
    SP.S.planlar = ((await SP.Store.list(STORE)) || []).filter(p => p && p.id && p.hedefId);
    return SP.S.planlar;
  }
  async function kaydet(p){
    SP.S.planlar = liste().filter(x => x.id !== p.id).concat([p]);
    await SP.Store.set(STORE + '/' + p.id, p);
    if(SP.Hedefler && SP.Hedefler.ag) SP.Hedefler.ag.planla();
    return p;
  }
  function aktif(hedefId){
    return liste().filter(p => p.hedefId === hedefId && p.durum === 'uygulandi')
      .sort((a, b) => String(b.olusturma).localeCompare(String(a.olusturma)))[0] || null;
  }

  /* ---------------------------------------------------- hekim talimatı */

  function talimatEtkisi(talimatlar){
    const out = { proteinKisitli:false, enerjiHekimle:false, notlar:[] };
    (talimatlar || []).forEach(t => {
      const k = kucuk(t.metin);
      if(PROTEIN_KISIT.test(k) && KISIT.test(k)){
        out.proteinKisitli = true;
        out.notlar.push('Hekim talimatın proteini sınırlıyor: protein bandı yükseltilmedi.');
      }
      if(ENERJI_TALIMAT.test(k)){
        out.enerjiHekimle = true;
        out.notlar.push('Hekim talimatın enerjiden söz ediyor: enerji hedefini ben kurmam, '
          + 'hekiminle konuş.');
      }
    });
    return out;
  }

  /* ------------------------------------------------------------ kur

     Hedeften plan. Model yok, yazma yok: yalnız hesap. Dönüş
     { ok:true, plan } ya da { ok:false, why }. */
  function kur(hedef, bugunISO){
    const bugun = bugunISO || U().todayISO();
    const h = hedef;
    if(!h) return { ok:false, why:'Hedef bulunamadı.' };
    if(h.paket !== 'kilo') return { ok:false, why:'Bu hedef için plan motoru henüz yok.' };
    if(h.durum !== 'aktif') return { ok:false, why:'Plan yalnız aktif bir hedef için kurulur.' };
    if(!h.son_tarih || !(h.son_tarih > bugun)) return { ok:false, why:'Hedefin son tarihi geçmiş ya da yok.' };
    const simdi = SP.Hedefler.sonKilo() || h.simdi;
    if(!simdi || simdi.deger == null) return { ok:false, why:'Şu anki kilon bilinmeden plan kurulamaz.' };
    const hedefKilo = h.hedefDeger != null ? h.hedefDeger
      : h.fark != null ? (h.yon === 'artir' || h.egilim === 'artir'
        ? simdi.deger + h.fark : simdi.deger - h.fark) : null;
    if(hedefKilo == null) return { ok:false, why:'Hedef kilo bilinmiyor.' };
    const yon = hedefKilo < simdi.deger ? 'azalt' : hedefKilo > simdi.deger ? 'artir' : null;
    if(!yon) return { ok:false, why:'Şu anki kilon zaten hedefte.' };

    const gun = U().diffDays(bugun, h.son_tarih);
    const hafta = Math.max(1, Math.floor(gun / 7));
    const fark = Math.abs(hedefKilo - simdi.deger);
    let tempo = yuvarla(fark / (gun / 7), 2);

    /* Güvenlik yeniden sınanır: hedef onaylandığından bu yana tarih
       daralmış olabilir (plan bugünden başlar). Paket reddederse plan
       KURULMAZ — güvenli tempoyla hedefi yeniden kurmak kullanıcının işi. */
    const g = SP.Hedefler.KILO.guvenlik(Object.assign({}, h, { simdi, hedefDeger:hedefKilo, yon }),
      {}, { gerekli:tempo, fark, hafta:gun / 7, simdi });
    if(g && g.red) return { ok:false, why:'Bu tempoyla plan kurulamaz: ' + g.neden };

    const p = SP.S.profile || {};
    const kisi = Object.assign({}, p, { weightKg:simdi.deger });
    const kapi = SP.Hedefler.hekimKapisi(h);
    const talimatlar = SP.Hedefler.talimatlar();
    const etki = talimatEtkisi(talimatlar);
    const uyarilar = [];

    /* Beslenme hedefi ve enerji: hekim kapısında ikisi de yazılmaz —
       beslenme hedefinin kendisi de enerjiyi değiştirir. */
    let goal = null, enerji = null, enerjiNeden = null;
    const onceGoal = p.goal || 'health';
    if(kapi.gerekli){
      enerjiNeden = 'Hekim kapısındasın (' + kapi.nedenler.join(', ') + '): enerji ve beslenme '
        + 'hedefi hekiminle kurulur. Plan yalnız tartı ve kontrol noktalarını kurar.';
    }else if(etki.enerjiHekimle){
      enerjiNeden = 'Hekim talimatın enerjiden söz ediyor; enerji hedefi hekiminle kurulur.';
    }else{
      const tdee = SP.Nutri.tdee(kisi), bmr = SP.Nutri.bmr(kisi);
      if(tdee == null || bmr == null){
        enerjiNeden = 'Boy, doğum yılı ya da cinsiyet eksik: enerji hesaplanamadı.';
      }else{
        const gunluk = tempo * KCAL_KG / 7;
        let kcal = Math.round(yon === 'azalt' ? tdee - gunluk : tdee + gunluk);
        let taban = false;
        if(kcal < bmr){
          kcal = bmr; taban = true;
          const ulasilir = yuvarla((tdee - bmr) * 7 / KCAL_KG, 2);
          uyarilar.push('Enerji bazal metabolizmanın (' + kcalYaz(bmr) + ') altına inmez; bu '
            + 'tabanla ulaşılabilir tempo haftada ' + sayi(ulasilir, 2) + ' kg. Hedef tarihi '
            + 'kaymış olabilir.');
          tempo = ulasilir;
        }
        enerji = { kcal, tdee, bmr, etiket:'tahmin', taban,
          dayanak:'günlük ihtiyaç (Mifflin-St Jeor × aktivite) ' + (yon === 'azalt' ? '−' : '+')
            + ' tempo × 7700 kcal/kg ÷ 7; 7700 yaygın bir yaklaşımdır, kaynağı bağlanmadı' };
      }
      goal = { once:onceGoal, sonra:etki.proteinKisitli ? onceGoal : GOAL_OF[yon] };
    }

    let protein = null, proteinNeden = null;
    if(!kapi.gerekli){
      const t = SP.Nutri.targets(Object.assign({}, kisi, { goal:goal ? goal.sonra : onceGoal,
        kcalHedef:null }));
      protein = t && t.protein ? { min:t.protein.min, max:t.protein.max } : null;
      if(etki.proteinKisitli) proteinNeden = 'Hekim talimatın proteini sınırlıyor; bant yükseltilmedi.';
    }

    const kontrol = [];
    for(let i = 1; i <= hafta; i++){
      const b = yon === 'azalt' ? Math.max(hedefKilo, simdi.deger - tempo * i)
        : Math.min(hedefKilo, simdi.deger + tempo * i);
      kontrol.push({ hafta:i, tarih:gunEkle(bugun, 7 * i), beklenen:yuvarla(b, 1) });
    }
    const wd = U().weekdayIndex(bugun);

    return { ok:true, plan:{
      id:U().uid('pl'), hedefId:h.id, paket:'kilo', durum:'taslak', surum:1,
      olusturma:bugun, baslangic:bugun, bitis:h.son_tarih, hafta, yon, tempo, birim:'kg/hafta',
      simdi:{ deger:simdi.deger, etiket:simdi.etiket, tarih:simdi.tarih || null },
      hedefKilo:yuvarla(hedefKilo, 1), goal, enerji, enerjiNeden, protein, proteinNeden,
      tartiGunu:{ gun:wd, ad:GUN_ADI[wd], not:'haftada bir, sabah aç karnına' },
      kontrol, kapasite:h.kapasite || null,
      hekim:{ kapi:kapi.gerekli, nedenler:kapi.nedenler,
        talimatlar:talimatlar.map(t => ({ id:t.id, metin:t.metin, tarih:t.tarih })),
        notlar:etki.notlar },
      uyarilar, program:null, emir:null,
    } };
  }

  /* ----------------------------------------------------- önizleme

     «Ne değişecek» satırları: önce / sonra. Hiçbir şey yazılmaz. */
  function goalAdi(id){ const g = (SP.GOALS || []).find(x => x.id === id); return g ? g.label : id; }

  function onizleme(plan){
    const p = SP.S.profile || {};
    const simdiki = SP.Nutri.targets(p);
    const rows = [];
    rows.push({ alan:'Beslenme hedefi', once:goalAdi(p.goal || 'health'),
      sonra:plan.goal ? goalAdi(plan.goal.sonra) + ': haftada ' + sayi(plan.tempo, 2) + ' kg'
        : 'değişmez — ' + (plan.enerjiNeden || 'hekimle kurulur') });
    rows.push({ alan:'Günlük enerji hedefi', once:simdiki && simdiki.ok ? kcalYaz(simdiki.kcal) : '—',
      sonra:plan.enerji ? kcalYaz(plan.enerji.kcal) + ' (tahmin)' : 'yazılmaz' });
    rows.push({ alan:'Günlük protein',
      once:simdiki && simdiki.protein ? simdiki.protein.min + '–' + simdiki.protein.max + ' g' : '—',
      sonra:plan.protein ? plan.protein.min + '–' + plan.protein.max + ' g'
        + (plan.proteinNeden ? ' (değişmedi: hekim talimatı)' : '') : 'yazılmaz' });
    rows.push({ alan:'Tartı günü', once:'—',
      sonra:plan.tartiGunu.ad + ', ' + plan.tartiGunu.not });
    const ilk = plan.kontrol[0];
    rows.push({ alan:'Kontrol noktaları', once:'yok',
      sonra:plan.hafta + ' hafta · ilk ' + U().fmtDate(ilk.tarih) + ': ' + sayi(ilk.beklenen)
        + ' kg (beklenen)' });
    if(plan.hekim.talimatlar.length){
      rows.push({ alan:'Hekim talimatları', once:'—',
        sonra:plan.hekim.talimatlar.length + ' talimata uyulur' });
    }
    return rows;
  }

  /* ------------------------------------------------ uygula / geri al

     Geri dönüş noktası UYGULAMADAN ÖNCE alınır: profilin iki alanı
     (beslenme hedefi, enerji hedefi) ve bu hedefin önceki planı. */
  async function uygula(plan){
    const p = SP.S.profile || {};
    const geri = { planId:plan.id, hedefId:plan.hedefId, goal:p.goal || 'health',
      kcalHedef:p.kcalHedef || null };
    const yeni = Object.assign({}, plan, { durum:'uygulandi', uygulanma:new Date().toISOString() });
    await kaydet(yeni);
    const patch = {};
    if(plan.goal) patch.goal = plan.goal.sonra;
    patch.kcalHedef = plan.enerji ? { kcal:plan.enerji.kcal, planId:plan.id, hedefId:plan.hedefId,
      etiket:'tahmin' } : null;
    await SP.Model.saveProfile(patch);
    return geri;
  }

  /* Geri alma yalnız PLANIN yazdığını geri alır: kullanıcı arada beslenme
     hedefini kendisi değiştirdiyse onun seçimi ezilmez. */
  async function geriAl(geri, durum){
    const plan = liste().find(x => x.id === geri.planId);
    const p = SP.S.profile || {};
    const patch = {};
    if(plan && plan.goal && p.goal === plan.goal.sonra) patch.goal = geri.goal;
    if(p.kcalHedef && p.kcalHedef.planId === geri.planId) patch.kcalHedef = geri.kcalHedef || null;
    if(Object.keys(patch).length) await SP.Model.saveProfile(patch);
    if(plan) await kaydet(Object.assign({}, plan, { durum:durum || 'geri_alindi',
      kapanis:new Date().toISOString() }));
  }

  function uygulamaOf(hedefId){
    return (SP.Proposals ? SP.Proposals.all() : []).find(x => x.action === 'plan-uygula'
      && x.status === 'applied' && x.params && x.params.hedefId === hedefId) || null;
  }

  /* Kullanıcının «Planı uygula» düğmesi: öneri olarak yazılır ve AYNI
     anda onaylanır — önizleme ekranı onayın kendisidir. */
  async function uygulaHedef(hedefId){
    const P = SP.Proposals;
    const c = P.check({ action:'plan-uygula', params:{ hedefId } });
    if(!c.ok) return { ok:false, why:c.why };
    const row = await P.propose({ action:'plan-uygula', params:{ hedefId }, source:'istek',
      metin:'Planı uygula' });
    if(!row) return { ok:false, why:'Plan önerisi yazılamadı.' };
    const r = await P.approve(row.id);
    return r.ok ? { ok:true, plan:aktif(hedefId) } : { ok:false, why:r.why };
  }

  async function geriAlHedef(hedefId){
    const u = uygulamaOf(hedefId);
    if(!u) return { ok:false, why:'Geri alınacak bir plan yok.' };
    return await SP.Proposals.undo(u.id);
  }

  /* Hedef kapanınca (tamam / bırakıldı) uygulanmış plan da kapanır ve
     beslenme hedefi plandan önceki haline döner. Sessiz değildir: dönen
     cümle ekranda gösterilir. */
  async function hedefKapandi(hedefId){
    const plan = aktif(hedefId);
    if(!plan) return null;
    const u = uygulamaOf(hedefId);
    if(u && u.undo) await geriAl(u.undo, 'kapandi');
    else await kaydet(Object.assign({}, plan, { durum:'kapandi', kapanis:new Date().toISOString() }));
    if(u){ u.status = 'undone'; await SP.Proposals.save(); }
    return 'Hedefin planı da kapandı; beslenme hedefin plandan önceki haline döndü.';
  }

  /* ------------------------------------------------------ ilerleme

     Başlangıç günündeki tartı TABANDIR: plan o sayıdan kuruldu. İlerleme
     yalnız başlangıçtan SONRAKİ tartılardan okunur; hiç yoksa «veri yok»
     denir, sıfır değil. */
  function beklenenAt(plan, tarih){
    const gun = U().diffDays(plan.baslangic, tarih);
    const adim = plan.tempo * Math.max(0, gun) / 7;
    const b = plan.yon === 'azalt' ? Math.max(plan.hedefKilo, plan.simdi.deger - adim)
      : Math.min(plan.hedefKilo, plan.simdi.deger + adim);
    return yuvarla(b, 1);
  }

  function ilerleme(plan, bugunISO){
    const bugun = bugunISO || U().todayISO();
    const sonraki = (plan.kontrol || []).find(k => k.tarih >= bugun) || null;
    const tartilar = Object.keys(SP.S.vitals || {}).sort()
      .filter(d => d > plan.baslangic && d <= bugun)
      .map(d => ({ tarih:d, deger:(SP.S.vitals[d] || {}).weight }))
      .filter(x => x.deger != null && isFinite(Number(x.deger)));
    if(!tartilar.length){
      return { durum:'veri_yok', sonraki, metin:'Plan başladığından beri tartı girilmedi; '
        + 'ilerleme ölçülemiyor.' };
    }
    const son = tartilar[tartilar.length - 1];
    const deger = Number(son.deger);
    const beklenen = beklenenAt(plan, son.tarih);
    const sapma = yuvarla(deger - beklenen, 1);
    const tol = Math.max(0.3, plan.tempo * 0.5);
    const iyi = plan.yon === 'azalt' ? -sapma : sapma;
    const durum = Math.abs(sapma) <= tol ? 'yolunda' : iyi > 0 ? 'onde' : 'geride';
    const degisim = yuvarla(deger - plan.simdi.deger, 1);
    const kalan = yuvarla(Math.abs(plan.hedefKilo - deger), 1);
    return { durum, sonraki, son:{ tarih:son.tarih, deger }, beklenen, sapma, degisim, kalan,
      metin:{ yolunda:'Plan yolunda', onde:'Planın önündesin', geride:'Planın gerisindesin' }[durum]
        + ': ' + U().fmtDate(son.tarih) + ' tartısı ' + sayi(deger) + ' kg, beklenen ' + sayi(beklenen)
        + ' kg. Başlangıçtan bu yana ' + (degisim > 0 ? '+' : '') + sayi(degisim) + ' kg; hedefe '
        + sayi(kalan) + ' kg kaldı.' };
  }

  /* ------------------------------------------------- King'e iş emri

     Modül yalnız KENDİ adına iş emri yazar; zinciri HKM kurar. Gönderilen
     planın ÖZETİDİR: tarih, tempo, kilo ve etiketi, enerji ve protein
     sayısı. Tahlil, ilaç ve hekim talimatının METNİ gitmez — yalnız sayısı.
     HKM kapalıyken plan yine çalışır; iş emri açılmaz ve bu söylenir. */
  function emirGovdesi(plan){
    const h = (SP.Hedefler.liste() || []).find(x => x.id === plan.hedefId) || {};
    const kap = plan.kapasite || {};
    const kapasite = {};
    if(Number.isInteger(kap.gunluk_dk)) kapasite.gunluk_dk = kap.gunluk_dk;
    if(Number.isInteger(kap.haftalik_gun)) kapasite.haftalik_gun = kap.haftalik_gun;
    return {
      modul:'spi', tur:'hedef.plan',
      konu:(h.cumle || ('Kilo planı: ' + sayi(plan.simdi.deger) + ' → ' + sayi(plan.hedefKilo) + ' kg'))
        .slice(0, 200),
      neden:'Hedefin planı SPİ’de uygulandı; haftalık program ve simülasyon isteniyor.',
      govde:{ plan:{
        paket:'kilo', yon:plan.yon, hedef_id:String(plan.hedefId).slice(0, 40),
        baslangic:plan.baslangic, bitis:plan.bitis, hafta:plan.hafta, tempo:plan.tempo,
        simdi:{ deger:plan.simdi.deger, etiket:plan.simdi.etiket || 'tahmin' },
        hedef_deger:plan.hedefKilo,
        enerji:plan.enerji ? { kcal:plan.enerji.kcal, taban:plan.enerji.bmr, etiket:'tahmin' } : null,
        protein:plan.protein ? { min:plan.protein.min, max:plan.protein.max } : null,
        kapasite:Object.keys(kapasite).length ? kapasite : null,
        hekim_kapisi:!!plan.hekim.kapi, talimat:plan.hekim.talimatlar.length,
      } },
    };
  }

  function hkm(){
    const b = SP.Beacon;
    const a = b && typeof b.settings === 'function' ? (b.settings() || {}) : {};
    if(!b || !a.enabled || !a.token || !b.urlOk(a.url)) return null;
    return { url:String(a.url).replace(/\/$/, ''), token:a.token };
  }

  async function istek(yol, govde){
    const k = hkm();
    if(!k) return { ok:false, bagli:false };
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const zaman = ctrl ? setTimeout(() => ctrl.abort(), 5000) : null;
    try{
      const res = await fetch(k.url + yol, {
        method:govde === undefined ? 'GET' : 'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:govde === undefined ? undefined : JSON.stringify(govde),
        signal:ctrl ? ctrl.signal : undefined,
      });
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      return { ok:res.status === 200, status:res.status, bagli:true, govde:g };
    }catch(e){
      return { ok:false, bagli:true, ag:true };
    }finally{
      if(zaman) clearTimeout(zaman);
    }
  }

  const KARAR_METNI = { onay:'King onayladı', kismi:'King kısmen onayladı', ret:'King reddetti' };

  async function kingeIlet(hedefId){
    const plan = aktif(hedefId);
    if(!plan) return { ok:false, metin:'Önce planı uygula; King’e uygulanmış plan iletilir.' };
    const r = await istek('/api/king/emir', emirGovdesi(plan));
    if(!r.bagli) return { ok:false, metin:'HKM bağlı değil; iş emri açılmadı. Plan SPİ’de '
      + 'çalışmaya devam ediyor. Rehber › HKM’den bağlanınca yeniden iletebilirsin.' };
    if(r.ag) return { ok:false, metin:'HKM’ye ulaşılamadı; iş emri açılmadı. HKM açıkken yeniden dene.' };
    const g = r.govde || {};
    if(!r.ok || !g.ok){
      return { ok:false, metin:'King iş emrini almadı: '
        + ((g.errors || []).join('; ') || g.note || ('HTTP ' + r.status)) };
    }
    const e = g.emir || {};
    await kaydet(Object.assign({}, plan, { emir:{ id:e.id, karar:g.karar || e.karar, durum:e.durum,
      tahmin:e.tahmin || null, tarih:new Date().toISOString() } }));
    const t = e.tahmin;
    const ret = (e.kontrol || []).filter(m => !m.ok).map(m => m.not).join('; ');
    return { ok:true, karar:g.karar, metin:(g.yeni === false ? 'Bu iş emri zaten açık (#' + e.id + ').'
      : (KARAR_METNI[g.karar] || 'King cevap verdi') + ' (iş emri #' + e.id + ').')
      + (t && t.metin ? ' Tahmini süre ' + t.metin + ' (tahmin).' : '')
      + (ret ? ' ' + ret : '') };
  }

  /* ------------------------------------------------------ bildirimler

     HKM'nin bildirim kuyruğu (onaylandı, başladı, bitti, reddedildi…).
     Açılışta ve sekmeye dönünce BİR KEZ sorulur; çizimde hiç sorulmaz. */
  async function bildirimleriCek(){
    const r = await istek('/api/bildirim/spi');
    if(!r.ok || !r.govde) return null;
    const l = Array.isArray(r.govde.bildirimler) ? r.govde.bildirimler : [];
    const temiz = l.filter(b => b && b.id != null && typeof b.metin === 'string')
      .map(b => ({ id:b.id, tur:String(b.tur || ''), metin:b.metin.slice(0, 600),
        tarih:String(b.created_at || '').slice(0, 16), emir:b.emir_id || null }));
    /* İş emrinin SON durumu plana yazılır: iş bitince özet hâlâ «onaylandı»
       demesin. Bildirimler yeniden eskiye gelir; ilk eşleşen en yenisidir. */
    for(const p of liste().filter(x => x.durum === 'uygulandi' && x.emir && x.emir.id != null)){
      const b = temiz.find(x => String(x.emir) === String(p.emir.id));
      if(b && b.tur !== p.emir.durum){
        await kaydet(Object.assign({}, p, { emir:Object.assign({}, p.emir, { durum:b.tur }) }));
      }
    }
    return temiz;
  }

  async function okundu(id){
    const r = await istek('/api/bildirim/' + encodeURIComponent(id) + '/okundu', {});
    return { ok:!!r.ok };
  }

  /* --------------------------------------------- Planlama programı

     HKM'nin `plan.apply` teklifi: Planlama Ofisi'nin haftalık programı.
     Program HKM'den ÇEKİLİR ve SPİ'nin kendi planıyla SINANIR: hafta
     sayısı, tarih ve beklenen kilolar kendi kontrol noktalarıyla
     tutmuyorsa program EKLENMEZ — başka bir planın programını bu plana
     yapıştırmak, yanlış bir yol haritası göstermek olurdu. */
  function programSina(plan, kayit){
    const g = kayit && kayit.govde;
    if(!g || kayit.tur !== 'plan' || !g.program || !Array.isArray(g.program.haftalar)){
      return { ok:false, why:'Kayıt bir program değil.' };
    }
    if(!g.gecti) return { ok:false, why:'Plan denetçisi bu programı geçirmemiş.' };
    const gi = g.girdi || {};
    if(gi.hedef_id !== plan.hedefId) return { ok:false, why:'Program başka bir hedefe ait.' };
    if(gi.baslangic !== plan.baslangic) return { ok:false, why:'Program bu planın başlangıcına göre kurulmamış.' };
    const hs = g.program.haftalar;
    if(hs.length !== plan.kontrol.length) return { ok:false, why:'Programın hafta sayısı planla tutmuyor.' };
    for(let i = 0; i < hs.length; i++){
      const k = plan.kontrol[i], x = hs[i] || {};
      if(x.bitis !== k.tarih || Math.abs(Number(x.beklenen) - k.beklenen) > 0.15){
        return { ok:false, why:(i + 1) + '. hafta planın kontrol noktasıyla tutmuyor.' };
      }
    }
    const temiz = hs.map(x => ({ no:x.no, baslangic:x.baslangic, bitis:x.bitis, beklenen:x.beklenen,
      gorevler:(Array.isArray(x.gorevler) ? x.gorevler : []).slice(0, 8)
        .filter(t => t && typeof t.metin === 'string')
        .map(t => ({ tur:String(t.tur || '').slice(0, 20), metin:t.metin.slice(0, 240) })) }));
    const simulasyon = (Array.isArray(g.simulasyon) ? g.simulasyon : []).slice(0, 5)
      .filter(s => s && typeof s.metin === 'string').map(s => ({ metin:s.metin.slice(0, 200) }));
    return { ok:true, program:{ kayitId:kayit.id, surum:kayit.surum || 1, haftalar:temiz,
      simulasyon, tartiGunu:String(g.program.tarti_gunu || '').slice(0, 20) } };
  }

  async function kayitCek(id){
    const r = await istek('/api/bam/kayit/' + encodeURIComponent(id));
    if(!r.bagli) return { ok:false, why:'HKM bağlı değil.' };
    if(!r.ok || !r.govde || !r.govde.kayit) return { ok:false, why:'Program HKM’den alınamadı.' };
    return { ok:true, kayit:r.govde.kayit };
  }

  /* HKM teklifini (plan.apply) uygular — beacon.resolveIntent'in tek
     kapısından çağrılır. Önce sınar, SONRA yazar. */
  async function programUygula(n){
    const pay = (n && n.payload) || {};
    const plan = aktif(String(pay.hedef_id || ''));
    if(!plan) return { ok:false, error:'Bu teklifin hedefinde uygulanmış bir plan yok; önce planı uygula.' };
    const k = await kayitCek(pay.kayit_id);
    if(!k.ok) return { ok:false, error:k.why };
    const s = programSina(plan, k.kayit);
    if(!s.ok) return { ok:false, error:'Program eklenmedi: ' + s.why };
    const P = SP.Proposals;
    const row = await P.propose({ action:'program-ekle', params:{ hedefId:plan.hedefId, program:s.program },
      source:'kural', anahtar:'hkm-program-' + n.id,
      iz:[{ tur:'niyet', id:n.id }, { tur:'kayit', id:pay.kayit_id }], metin:'Planlama Ofisi programı' });
    if(!row) return { ok:false, error:'Bu program daha önce işlendi.' };
    const r = await P.approve(row.id);
    return r.ok ? { ok:true, note:s.program.haftalar.length + ' haftalık program planına eklendi; '
      + 'Hedeflerim’de «Bu hafta» olarak görünür.' } : { ok:false, error:r.why };
  }

  function buHafta(plan, bugunISO){
    if(!plan || !plan.program) return null;
    const bugun = bugunISO || U().todayISO();
    return plan.program.haftalar.find(h => h.baslangic <= bugun && bugun <= h.bitis)
      || (bugun <= plan.baslangic ? plan.program.haftalar[0] : null);
  }

  return { KCAL_KG, GUN_ADI, kur, onizleme, uygula, geriAl, uygulaHedef, geriAlHedef,
    hedefKapandi, aktif, liste, yukle, kaydet, uygulamaOf, ilerleme, beklenenAt,
    talimatEtkisi, emirGovdesi, kingeIlet, bildirimleriCek, okundu, programSina, kayitCek,
    programUygula, buHafta, istek };
})();
