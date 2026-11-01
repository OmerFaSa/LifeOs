/* KING VERISI — KING-4 §C olayları ve §H yardım sağlayıcıları (görev 041).
   Olay biçimi belgeler/ekip/KING-OLAY.md; taşıyıcı brand/ortak/olay.js. */

window.SP = window.SP || {};

SP.KingVeri = (function(){
  const U = () => SP.U;

  function pad2(n){
    return String(n).padStart(2, '0');
  }

  function yerelZaman(d){
    const dt = d instanceof Date ? d : new Date(d || Date.now());
    return U().iso(dt) + 'T' + pad2(dt.getHours()) + ':' + pad2(dt.getMinutes()) + ':' + pad2(dt.getSeconds());
  }

  function parseZaman(val){
    if(!val) return 0;
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  }

  /* ------------------------------------------------------------- 1. olaylar */
  function olaylar(simdi){
    const now = simdi instanceof Date ? simdi : new Date(simdi || Date.now());
    const gun = U().iso(now);
    const at = yerelZaman(now);
    const out = [];

    /* a) uyku_dustu */
    const vitals = (SP.S && SP.S.vitals) || {};
    const son7 = U().lastDays(7, gun);
    let n7 = 0, sum7 = 0;
    for(const d of son7){
      const v = vitals[d];
      if(v && typeof v.sleep === 'number' && !isNaN(v.sleep)){
        n7++;
        sum7 += v.sleep;
      }
    }

    if(n7 >= 4){
      const ort7 = Math.round((sum7 / n7) * 10) / 10;
      const son28 = U().lastDays(28, gun);
      let n28 = 0, sum28 = 0;
      for(const d of son28){
        const v = vitals[d];
        if(v && typeof v.sleep === 'number' && !isNaN(v.sleep)){
          n28++;
          sum28 += v.sleep;
        }
      }

      let ort28 = null;
      let ort28Sayi = { deger:null, birim:'saat', etiket:'veri yok' };
      if(n28 >= 14){
        ort28 = Math.round((sum28 / n28) * 10) / 10;
        ort28Sayi = { deger:ort28, birim:'saat', etiket:'hesaplandı' };
      }

      if((ort28 !== null && ort7 < ort28) || ort7 < 6){
        out.push({
          modul: 'spi',
          tur: 'uyku_dustu',
          kimlik: 'spi.uyku_dustu.' + gun,
          at: at,
          sayilar: {
            ort7: { deger:ort7, birim:'saat', etiket:'hesaplandı' },
            ort28: ort28Sayi
          }
        });
      }
    }

    /* b) plan_kacti */
    if(SP.HaftaPlan && typeof SP.HaftaPlan.liste === 'function'){
      const planlar = SP.HaftaPlan.liste() || [];
      const simdiDk = now.getHours() * 60 + now.getMinutes();

      for(const p of planlar){
        const maddeler = (typeof SP.HaftaPlan.bugunMaddeleri === 'function' ? SP.HaftaPlan.bugunMaddeleri(p, gun) : []) || [];
        for(const m of maddeler){
          if(!m) continue;
          const zy = (typeof SP.HaftaPlan.zamanYaz === 'function' ? SP.HaftaPlan.zamanYaz(m.zaman) : m.zaman) || '';
          if(!/^\d{2}:\d{2}$/.test(zy)) continue;

          const say = (typeof SP.HaftaPlan.sayim === 'function' ? SP.HaftaPlan.sayim(p, m, gun) : {}) || {};
          if(say.tamam) continue;

          const mDk = typeof SP.HaftaPlan.zamanAn === 'function' ? SP.HaftaPlan.zamanAn(m.zaman) : (Number(zy.slice(0, 2)) * 60 + Number(zy.slice(3)));
          const gecikme = simdiDk - mDk;
          if(gecikme >= 30){
            const pId = p && p.id ? p.id : '';
            const mId = m && m.id ? m.id : '';
            const pmKimlik = (pId ? pId + '.' : '') + mId;
            const kimlik = ('spi.plan_kacti.' + gun + '.' + pmKimlik).slice(0, 80);

            out.push({
              modul: 'spi',
              tur: 'plan_kacti',
              kimlik: kimlik,
              at: at,
              sayilar: {
                gecikme_dk: { deger:gecikme, birim:'dk', etiket:'hesaplandı' }
              },
              konu: String(m.metin || '').slice(0, 80)
            });
          }
        }
      }
    }

    return out;
  }

  /* --------------------------------------------------------------- 2. hafta */
  function hafta(bitisISO){
    const bit = bitisISO || U().todayISO();
    const bitDate = U().parse(bit);
    const basDate = U().addDays(bitDate, -6);
    const bas = U().iso(basDate);

    const gunlerBu = U().lastDays(7, bit);
    const oncekiBitis = U().iso(U().addDays(basDate, -1));
    const gunlerOnce = U().lastDays(7, oncekiBitis);

    const vitals = (SP.S && SP.S.vitals) || {};
    const workouts = (SP.S && SP.S.workouts) || [];
    const meals = (SP.S && SP.S.meals) || {};

    /* a) uyku */
    let uykuSayisi = 0, uykuTop = 0;
    for(const d of gunlerBu){
      const v = vitals[d];
      if(v && typeof v.sleep === 'number' && !isNaN(v.sleep)){
        uykuSayisi++;
        uykuTop += v.sleep;
      }
    }
    let uykuSayisiOnce = 0, uykuTopOnce = 0;
    for(const d of gunlerOnce){
      const v = vitals[d];
      if(v && typeof v.sleep === 'number' && !isNaN(v.sleep)){
        uykuSayisiOnce++;
        uykuTopOnce += v.sleep;
      }
    }
    const uykuOnceki = uykuSayisiOnce > 0 ? Math.round((uykuTopOnce / uykuSayisiOnce) * 10) / 10 : null;
    const uykuSatir = {
      id: 'uyku',
      ad: 'Uyku',
      deger: uykuSayisi > 0 ? Math.round((uykuTop / uykuSayisi) * 10) / 10 : null,
      birim: 'saat',
      etiket: uykuSayisi > 0 ? 'hesaplandı' : 'veri yok',
      gun: uykuSayisi > 0 ? uykuSayisi : null,
      onceki: uykuOnceki
    };

    /* b) antrenman */
    const wBu = workouts.filter(w => w && w.date && gunlerBu.indexOf(w.date) >= 0);
    const wOnce = workouts.filter(w => w && w.date && gunlerOnce.indexOf(w.date) >= 0);
    const antrenmanOnceki = wOnce.length > 0 ? wOnce.length : null;
    const antrenmanSatir = {
      id: 'antrenman',
      ad: 'Antrenman',
      deger: wBu.length > 0 ? wBu.length : null,
      etiket: wBu.length > 0 ? 'ölçüldü' : 'veri yok',
      onceki: antrenmanOnceki
    };

    /* c) hareket_dk */
    let dkTop = 0, hasDk = false;
    for(const w of wBu){
      if(typeof w.minutes === 'number' && !isNaN(w.minutes)){
        dkTop += w.minutes;
        hasDk = true;
      }
    }
    let dkTopOnce = 0, hasDkOnce = false;
    for(const w of wOnce){
      if(typeof w.minutes === 'number' && !isNaN(w.minutes)){
        dkTopOnce += w.minutes;
        hasDkOnce = true;
      }
    }
    const hareketOnceki = hasDkOnce ? dkTopOnce : null;
    const hareketSatir = {
      id: 'hareket_dk',
      ad: 'Hareket süresi',
      deger: wBu.length > 0 ? dkTop : null,
      birim: 'dk',
      etiket: wBu.length > 0 ? 'ölçüldü' : 'veri yok',
      onceki: hareketOnceki
    };

    /* d) ogun */
    let ogunSayisi = 0, hasOgun = false;
    for(const d of gunlerBu){
      const l = meals[d];
      if(Array.isArray(l)){
        ogunSayisi += l.length;
        if(l.length > 0) hasOgun = true;
      }
    }
    let ogunSayisiOnce = 0, hasOgunOnce = false;
    for(const d of gunlerOnce){
      const l = meals[d];
      if(Array.isArray(l)){
        ogunSayisiOnce += l.length;
        if(l.length > 0) hasOgunOnce = true;
      }
    }
    const ogunOnceki = hasOgunOnce ? ogunSayisiOnce : null;
    const ogunSatir = {
      id: 'ogun',
      ad: 'Öğün',
      deger: hasOgun ? ogunSayisi : null,
      etiket: hasOgun ? 'ölçüldü' : 'veri yok',
      onceki: ogunOnceki
    };

    return {
      bas: bas,
      bit: bit,
      satirlar: [uykuSatir, antrenmanSatir, hareketSatir, ogunSatir]
    };
  }

  /* ------------------------------------------------------------ 3. hatirlat */
  function gecerliMi(h, gun){
    if(!h) return false;
    if(h.tur !== 'ilac') return true;
    const m = ((SP.S && SP.S.meds) || []).find(x => x && x.id === h.medId);
    if(!m) return false;
    if(SP.Meds && typeof SP.Meds.activeOn === 'function'){
      return !!SP.Meds.activeOn(m, gun);
    }
    return true;
  }

  function hatirlat(simdi){
    const now = simdi instanceof Date ? simdi : new Date(simdi || Date.now());
    const bugun = U().iso(now);
    const dunISO = U().iso(U().addDays(now, -1));
    const gunler14 = U().lastDays(14, bugun);

    const hDurum = (SP.S && SP.S.hatirlat) || {};
    const liste = Array.isArray(hDurum.liste) ? hDurum.liste : [];
    const yapildi = hDurum.yapildi || {};

    const out = [];

    for(const h of liste){
      if(!gecerliMi(h, bugun)) continue;

      const saatler = Array.isArray(h.saatler) ? h.saatler : [];
      const ad = h.tur === 'ilac' ? 'İlaç / takviye' : ((SP.Hatirlat && SP.Hatirlat.TUR && SP.Hatirlat.TUR[h.tur] && SP.Hatirlat.TUR[h.tur].ad) || h.tur || 'Hatırlatma');

      for(const saat of saatler){
        const anahtar = h.id + '@' + saat;

        const dakikalar = [];
        for(const g of gunler14){
          const ts = yapildi[g] && yapildi[g][anahtar];
          if(ts){
            const dt = new Date(ts);
            if(!isNaN(dt.getTime())){
              dakikalar.push(dt.getHours() * 60 + dt.getMinutes());
            }
          }
        }

        const n = dakikalar.length;
        let gercek = null;
        let etiket = 'veri yok';

        if(n >= 3){
          dakikalar.sort((a, b) => a - b);
          let ortDk;
          if(n % 2 === 1){
            ortDk = dakikalar[Math.floor(n / 2)];
          } else {
            ortDk = Math.round((dakikalar[n / 2 - 1] + dakikalar[n / 2]) / 2);
          }
          const s = Math.floor(ortDk / 60) % 24;
          const d = ortDk % 60;
          gercek = pad2(s) + ':' + pad2(d);
          etiket = 'hesaplandı';
        }

        const dunYapildi = !!(yapildi[dunISO] && yapildi[dunISO][anahtar]);
        const dun = dunYapildi ? 'yapildi' : 'isaretlenmedi';

        out.push({
          anahtar: anahtar,
          ad: ad,
          kurulu: saat,
          gercek: gercek,
          n: n,
          etiket: etiket,
          dun: dun
        });
      }
    }

    return out;
  }

  /* ------------------------------------------------------------ 4. sonKayit */
  function sonKayit(){
    const list = ((SP.S && SP.S.workouts) || []).filter(w => w && w.id);
    if(!list.length) return null;

    const sirali = list.slice().sort((a, b) => {
      const ta = parseZaman(a.createdAt || a.date);
      const tb = parseZaman(b.createdAt || b.date);
      return tb - ta;
    });

    const enYeni = sirali[0];
    if(!enYeni) return null;

    return {
      id: enYeni.id,
      tur: 'antrenman',
      gun: enYeni.date,
      ad: enYeni.name || 'Antrenman',
      alanlar: [
        { ad:'dk', deger:typeof enYeni.minutes === 'number' ? enYeni.minutes : 0, birim:'dk' }
      ]
    };
  }

  /* -------------------------------------------------------------- 5. duzelt */
  async function duzelt(id, alan, deger){
    if(alan !== 'dk'){
      return { ok:false, why:'Bilinmeyen alan; yalnızca «dk» düzeltilebilir.' };
    }
    if(typeof deger !== 'number' || !Number.isInteger(deger) || deger < 1 || deger > 600){
      return { ok:false, why:'Süre 1 ile 600 dakika arasında bir tam sayı olmalıdır.' };
    }
    const workouts = (SP.S && SP.S.workouts) || [];
    const w = workouts.find(x => x && x.id === id);
    if(!w){
      return { ok:false, why:'Antrenman kaydı bulunamadı.' };
    }

    const once = typeof w.minutes === 'number' ? w.minutes : 0;
    const guncel = Object.assign({}, w, { minutes:deger });

    if(SP.Model && typeof SP.Model.saveWorkout === 'function'){
      await SP.Model.saveWorkout(guncel);
    } else {
      const idx = workouts.findIndex(x => x.id === id);
      if(idx >= 0) workouts[idx] = guncel;
      if(SP.Store && typeof SP.Store.set === 'function'){
        await SP.Store.set('workouts/' + id, guncel);
      }
    }

    return {
      ok: true,
      once: once,
      sonra: deger,
      geriAl: async () => {
        const eski = Object.assign({}, guncel, { minutes:once });
        if(SP.Model && typeof SP.Model.saveWorkout === 'function'){
          await SP.Model.saveWorkout(eski);
        } else {
          const idx = workouts.findIndex(x => x.id === id);
          if(idx >= 0) workouts[idx] = eski;
          if(SP.Store && typeof SP.Store.set === 'function'){
            await SP.Store.set('workouts/' + id, eski);
          }
        }
        return { ok:true, once:deger, sonra:once };
      }
    };
  }

  return {
    olaylar,
    hafta,
    hatirlat,
    sonKayit,
    duzelt
  };
})();
