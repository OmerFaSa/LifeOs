/* KING VERISI — KING-4 §C olaylari ve §H yardim saglayicilari (gorev 040, belgeler/ekip/gorevler).
   Olay bicimi belgeler/ekip/KING-OLAY.md; tasiyici brand/ortak/olay.js. */
window.LIFEOS.PARCA.yazilar({
  'ays.core.kingveri.calisma-suresi':'Çalışma süresi',
  'ays.core.kingveri.soru-sayisi':'Soru sayısı',
  'ays.core.kingveri.tamamlanan-blok':'Tamamlanan blok',
  'ays.core.kingveri.gecersiz-kayit-kimligi':'Geçersiz kayıt kimliği.',
  'ays.core.kingveri.kayit-bulunamadi':'Kayıt bulunamadı.',
  'ays.core.kingveri.bilinmeyen-alan':'Bilinmeyen alan: ',
  'ays.core.kingveri.deger-tam-sayi-olmalidir':'Değer tam sayı olmalıdır.',
  'ays.core.kingveri.sure-1-ile-600-dakika':'Süre 1 ile 600 dakika arasında olmalıdır.',
  'ays.core.kingveri.soru-sayisi-0-ile-1000':'Soru sayısı 0 ile 1000 arasında olmalıdır.',
  'ays.core.kingveri.kaydedilemedi':'Kaydedilemedi: ',
});


window.R = window.R || {};

R.KingVeri = (function(){
  'use strict';

  function yerelIso(d){
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function gunAraligi(basDate, count){
    const U = R.U;
    const list = [];
    for(let i = 0; i < count; i++){
      list.push(U.iso(U.addDays(basDate, i)));
    }
    return list;
  }

  // 1) Olaylar (KING-4 §C)
  function olaylar(simdi){
    simdi = simdi || (R.U ? R.U.today() : new Date());
    const U = R.U;
    const gun = U.iso(simdi);
    const out = [];

    // sinav_yaklasti: R.PLAN.examTytISO gecerli ve kalan = R.U.diffDays(gun, examTytISO) >= 0
    const examISO = R.PLAN && R.PLAN.examTytISO;
    if(examISO && typeof examISO === 'string'){
      const kalan = U.diffDays(gun, examISO);
      if(kalan != null && kalan >= 0){
        out.push({
          modul: 'ays',
          tur: 'sinav_yaklasti',
          kimlik: 'ays.sinav_yaklasti.' + gun,
          at: yerelIso(simdi),
          sayilar: {
            kalan_gun: {
              deger: kalan,
              birim: 'gün',
              etiket: 'hesaplandı'
            }
          }
        });
      }
    }

    // tekrar_gunu: R.Calc.dueCards(gun).length >= 1
    const kartlar = (R.Calc && R.Calc.dueCards) ? R.Calc.dueCards(gun) : [];
    if(kartlar && kartlar.length >= 1){
      out.push({
        modul: 'ays',
        tur: 'tekrar_gunu',
        kimlik: 'ays.tekrar_gunu.' + gun,
        at: yerelIso(simdi),
        sayilar: {
          adet: {
            deger: kartlar.length,
            birim: 'kart',
            etiket: 'hesaplandı'
          }
        }
      });
    }

    return out;
  }

  // 2) Hafta raporu (KING-4 §H)
  function hafta(bitisISO){
    const U = R.U;
    if(!bitisISO || typeof bitisISO !== 'string' || !U || !U.isISO || !U.isISO(bitisISO)){
      return {
        bas: null,
        bit: null,
        satirlar: [
          {
            id: 'calisma_dk',
            ad: yz('ays.core.kingveri.calisma-suresi'),
            deger: null,
            birim: 'dk',
            etiket: 'veri yok',
            onceki: null
          },
          {
            id: 'soru',
            ad: yz('ays.core.kingveri.soru-sayisi'),
            deger: null,
            etiket: 'veri yok',
            onceki: null
          },
          {
            id: 'blok',
            ad: yz('ays.core.kingveri.tamamlanan-blok'),
            deger: null,
            etiket: 'veri yok',
            onceki: null
          }
        ]
      };
    }

    const bit = bitisISO;
    const bitDate = U.parse(bitisISO);
    const basDate = U.addDays(bitDate, -6);
    const bas = U.iso(basDate);

    const buGunler = gunAraligi(basDate, 7);
    const oncekiBasDate = U.addDays(bitDate, -13);
    const onceGunler = gunAraligi(oncekiBasDate, 7);

    function olc(gList){
      const days = (R.S && R.S.days) || {};
      let calisma = 0, calismaVar = false;
      let soru = 0, soruVar = false;
      let blok = 0, blokVar = false;

      for(const g of gList){
        const day = days[g];
        if(!day) continue;

        if(typeof day.freeQ === 'number'){
          soru += day.freeQ;
          soruVar = true;
        }

        const blocks = day.blocks || [];
        for(const b of blocks){
          if(typeof b.actualMin === 'number'){
            calisma += b.actualMin;
            calismaVar = true;
          }
          if(typeof b.actualQ === 'number'){
            soru += b.actualQ;
            soruVar = true;
          }
          if(b.status === 'done' || b.status === 'partial'){
            blok++;
            blokVar = true;
          }
        }
      }

      return {
        calisma: calismaVar ? calisma : null,
        soru: soruVar ? soru : null,
        blok: blokVar ? blok : null
      };
    }

    const bu = olc(buGunler);
    const once = olc(onceGunler);

    const satirlar = [
      {
        id: 'calisma_dk',
        ad: yz('ays.core.kingveri.calisma-suresi'),
        deger: bu.calisma,
        birim: 'dk',
        etiket: bu.calisma != null ? 'ölçüldü' : 'veri yok',
        onceki: once.calisma
      },
      {
        id: 'soru',
        ad: yz('ays.core.kingveri.soru-sayisi'),
        deger: bu.soru,
        etiket: bu.soru != null ? 'ölçüldü' : 'veri yok',
        onceki: once.soru
      },
      {
        id: 'blok',
        ad: yz('ays.core.kingveri.tamamlanan-blok'),
        deger: bu.blok,
        etiket: bu.blok != null ? 'ölçüldü' : 'veri yok',
        onceki: once.blok
      }
    ];

    return { bas, bit, satirlar };
  }

  // 3) Hatırlatma (KING-4 §H)
  function hatirlat(simdi){
    simdi = simdi || (R.U ? R.U.today() : new Date());
    const U = R.U;
    const days = (R.S && R.S.days) || {};

    const son14 = [];
    for(let i = 0; i < 14; i++){
      son14.push(U.iso(U.addDays(simdi, -i)));
    }

    const dunISO = U.iso(U.addDays(simdi, -1));
    const dunDay = days[dunISO];

    const slotMap = new Map();

    for(const g of son14){
      const day = days[g];
      if(!day) continue;
      const blocks = day.blocks || [];
      for(const b of blocks){
        const slot = b.slot;
        if(!slot) continue;
        if(!slotMap.has(slot)){
          slotMap.set(slot, { dakikalar: [] });
        }

        let bas = null;
        if(b.oturumlar && b.oturumlar[0] && b.oturumlar[0].bas){
          bas = b.oturumlar[0].bas;
        }else if(b.kayitAt != null){
          bas = b.kayitAt;
        }

        if(bas != null){
          const d = new Date(bas);
          if(!isNaN(d.getTime())){
            const mins = d.getHours() * 60 + d.getMinutes();
            slotMap.get(slot).dakikalar.push(mins);
          }
        }
      }
    }

    const out = [];

    for(const [slot, data] of slotMap.entries()){
      const n = data.dakikalar.length;
      let gercek = null;
      let etiket = 'veri yok';

      if(n >= 3){
        const sirali = data.dakikalar.slice().sort((a, b) => a - b);
        let medMin;
        if(n % 2 !== 0){
          medMin = sirali[Math.floor(n / 2)];
        }else{
          medMin = Math.round((sirali[n / 2 - 1] + sirali[n / 2]) / 2);
        }
        const pad = v => String(v).padStart(2, '0');
        const h = Math.floor(medMin / 60) % 24;
        const m = medMin % 60;
        gercek = pad(h) + ':' + pad(m);
        etiket = 'hesaplandı';
      }

      let dun = null;
      if(dunDay && dunDay.blocks){
        const dunBloklari = dunDay.blocks.filter(b => b.slot === slot);
        if(dunBloklari.length > 0){
          const yapildi = dunBloklari.some(b => b.status === 'done' || b.status === 'partial');
          dun = yapildi ? 'yapildi' : 'isaretlenmedi';
        }
      }

      const anahtar = 'ays.slot.' + (U.slug ? U.slug(slot) : encodeURIComponent(slot));

      out.push({
        anahtar,
        ad: slot,
        kurulu: null,
        gercek,
        n,
        etiket,
        dun
      });
    }

    return out;
  }

  // 4) Son kayit (KING-4 §H)
  function sonKayit(simdi){
    simdi = simdi || (R.U ? R.U.today() : new Date());
    const U = R.U;
    const days = (R.S && R.S.days) || {};

    const son14 = [];
    for(let i = 0; i < 14; i++){
      son14.push(U.iso(U.addDays(simdi, -i)));
    }

    let enYeniZaman = -Infinity;
    let enYeniBlok = null;
    let enYeniGun = null;

    for(const g of son14){
      const day = days[g];
      if(!day) continue;
      const blocks = day.blocks || [];
      for(const b of blocks){
        if(typeof b.actualMin !== 'number' || b.actualMin <= 0) continue;

        let t = null;
        if(b.oturumlar && b.oturumlar.length){
          const sonOturum = b.oturumlar[b.oturumlar.length - 1];
          if(sonOturum && sonOturum.bas){
            const d = new Date(sonOturum.bas);
            if(!isNaN(d.getTime())) t = d.getTime();
          }
        }
        if(t == null && b.kayitAt != null){
          const d = new Date(b.kayitAt);
          if(!isNaN(d.getTime())) t = d.getTime();
        }
        if(t == null){
          const d = U.parse(g);
          if(d) t = d.getTime();
        }

        if(t != null && t > enYeniZaman){
          enYeniZaman = t;
          enYeniBlok = b;
          enYeniGun = g;
        }
      }
    }

    if(!enYeniBlok || !enYeniGun) return null;

    const b = enYeniBlok;
    const ad = b.topic || b.subject || b.slot || 'Ders';
    const alanlar = [
      { ad: 'dk', deger: b.actualMin, birim: 'dk' }
    ];
    if(typeof b.actualQ === 'number'){
      alanlar.push({ ad: 'soru', deger: b.actualQ, birim: 'soru' });
    }

    return {
      id: enYeniGun + '/' + b.id,
      tur: 'blok',
      gun: enYeniGun,
      ad,
      alanlar
    };
  }

  // 5) Düzelt (KING-4 §H)
  async function duzelt(id, alan, deger){
    if(!id || typeof id !== 'string'){
      return { ok: false, why: yz('ays.core.kingveri.gecersiz-kayit-kimligi') };
    }

    const parcalar = id.includes('/') ? id.split('/') : id.split(':');
    if(parcalar.length !== 2){
      return { ok: false, why: yz('ays.core.kingveri.kayit-bulunamadi') };
    }
    const [gun, blokId] = parcalar;

    const days = (R.S && R.S.days) || {};
    const day = days[gun];
    if(!day || !day.blocks){
      return { ok: false, why: yz('ays.core.kingveri.kayit-bulunamadi') };
    }

    const block = day.blocks.find(b => b.id === blokId);
    if(!block){
      return { ok: false, why: yz('ays.core.kingveri.kayit-bulunamadi') };
    }

    if(alan !== 'dk' && alan !== 'soru'){
      return { ok: false, why: yz('ays.core.kingveri.bilinmeyen-alan') + alan };
    }

    if(typeof deger !== 'number' || !Number.isInteger(deger) || isNaN(deger)){
      return { ok: false, why: yz('ays.core.kingveri.deger-tam-sayi-olmalidir') };
    }

    if(alan === 'dk'){
      if(deger < 1 || deger > 600){
        return { ok: false, why: yz('ays.core.kingveri.sure-1-ile-600-dakika') };
      }
    }else if(alan === 'soru'){
      if(deger < 0 || deger > 1000){
        return { ok: false, why: yz('ays.core.kingveri.soru-sayisi-0-ile-1000') };
      }
    }

    const once = alan === 'dk' ? block.actualMin : block.actualQ;

    if(alan === 'dk'){
      block.actualMin = deger;
    }else if(alan === 'soru'){
      block.actualQ = deger;
    }

    if(R.Model && R.Model.saveDay){
      try{
        await R.Model.saveDay(gun);
      }catch(err){
        if(alan === 'dk'){
          block.actualMin = once;
        }else if(alan === 'soru'){
          block.actualQ = once;
        }
        const msg = (err && err.message) ? err.message : String(err);
        return { ok: false, why: yz('ays.core.kingveri.kaydedilemedi') + msg };
      }
    }

    async function geriAl(){
      if(alan === 'dk'){
        block.actualMin = once;
      }else if(alan === 'soru'){
        block.actualQ = once;
      }
      if(R.Model && R.Model.saveDay){
        try{
          await R.Model.saveDay(gun);
        }catch(err){
          if(alan === 'dk'){
            block.actualMin = deger;
          }else if(alan === 'soru'){
            block.actualQ = deger;
          }
          const msg = (err && err.message) ? err.message : String(err);
          return { ok: false, why: yz('ays.core.kingveri.kaydedilemedi') + msg };
        }
      }
      return { ok: true };
    }

    return {
      ok: true,
      once,
      sonra: deger,
      geriAl
    };
  }

  // 6) Sabah brifingi (KING-4 §H)
  function brifing(simdi){
    simdi = simdi || (R.U ? R.U.today() : new Date());
    const U = R.U;
    const gun = U.iso(simdi);
    const days = (R.S && R.S.days) || {};

    // 1) plan: bugünün maddeleri [{ ad, saat, tamam }], en çok 8
    const bugunDay = days[gun];
    const plan = [];
    if(bugunDay && Array.isArray(bugunDay.blocks)){
      for(let i = 0; i < bugunDay.blocks.length && plan.length < 8; i++){
        const b = bugunDay.blocks[i];
        if(!b) continue;
        const subj = String(b.subject || '').trim();
        const top = String(b.topic || '').trim();
        let ad = top ? (subj ? subj + ' · ' + top : top) : subj;
        if(!ad) ad = String(b.slot || 'Ders').trim();
        plan.push({
          ad: ad.slice(0, 80),
          saat: null,
          tamam: b.status === 'done'
        });
      }
    }

    // 2) bulgu: dünün tek ölçüsü
    const dunDate = U.addDays(simdi, -1);
    const dunISO = U.iso(dunDate);
    const dunDay = days[dunISO];
    let bulgu = null;

    if(dunDay && Array.isArray(dunDay.blocks)){
      let dunToplam = 0;
      let dunOlculenVar = false;
      for(const b of dunDay.blocks){
        if(b && typeof b.actualMin === 'number' && !isNaN(b.actualMin)){
          dunToplam += b.actualMin;
          dunOlculenVar = true;
        }
      }

      if(dunOlculenVar){
        // ort: dünden önceki 7 gün (dün-7 .. dün-1, yani simdi-8 .. simdi-2)
        const kayitliGunler = [];
        for(let i = 2; i <= 8; i++){
          const gISO = U.iso(U.addDays(simdi, -i));
          const day = days[gISO];
          if(!day || !Array.isArray(day.blocks)) continue;
          let gToplam = 0;
          let gVar = false;
          for(const b of day.blocks){
            if(b && typeof b.actualMin === 'number' && !isNaN(b.actualMin)){
              gToplam += b.actualMin;
              gVar = true;
            }
          }
          if(gVar){
            kayitliGunler.push(gToplam);
          }
        }

        let ort;
        if(kayitliGunler.length >= 3){
          const ortVal = Math.round(kayitliGunler.reduce((a, b) => a + b, 0) / kayitliGunler.length);
          ort = { deger: ortVal, etiket: 'hesaplandı' };
        }else{
          ort = { deger: null, etiket: 'veri yok' };
        }

        bulgu = {
          id: 'calisma_dk',
          ad: 'Çalışma',
          deger: dunToplam,
          birim: 'dk',
          etiket: 'ölçüldü',
          ort: ort
        };
      }
    }

    // 3) oneri: olaylar(simdi) içinden öncelikli ilk olay
    const tumOlaylar = olaylar(simdi);
    const ONCELIK = ['sinav_yaklasti', 'uyku_dustu', 'plan_kacti', 'tekrar_gunu'];
    let secilenOlay = null;
    for(const tur of ONCELIK){
      const f = tumOlaylar.find(o => o && o.tur === tur);
      if(f){
        secilenOlay = f;
        break;
      }
    }

    let oneri = null;
    if(secilenOlay){
      oneri = {
        id: secilenOlay.tur,
        sayilar: secilenOlay.sayilar || {}
      };
      if(secilenOlay.konu != null){
        oneri.konu = secilenOlay.konu;
      }
    }else{
      // Olay yoksa plan'daki ilk tamamlanmamış madde
      const ilkMadde = plan.find(m => !m.tamam);
      if(ilkMadde){
        oneri = {
          id: 'ilk_madde',
          konu: ilkMadde.ad,
          sayilar: {}
        };
      }
    }

    return {
      gun,
      plan,
      bulgu,
      oneri
    };
  }

  return {
    olaylar,
    hafta,
    hatirlat,
    sonKayit,
    duzelt,
    brifing
  };
})();
