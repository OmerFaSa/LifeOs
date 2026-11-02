/* KING VERISI — KING-4 §C olaylari ve §H yardim saglayicilari (gorev 042, belgeler/ekip/gorevler).
   Olay bicimi belgeler/ekip/KING-OLAY.md; tasiyici brand/ortak/olay.js. */

window.ESP = window.ESP || {};

ESP.KingVeri = (function(){
  'use strict';

  function yerelISO(d){
    if(!d || isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' +
      pad(d.getMonth() + 1) + '-' +
      pad(d.getDate()) + 'T' +
      pad(d.getHours()) + ':' +
      pad(d.getMinutes()) + ':' +
      pad(d.getSeconds());
  }

  function sessionsOf(iso){
    if(ESP.Model && typeof ESP.Model.sessionsOf === 'function'){
      return ESP.Model.sessionsOf(iso);
    }
    const days = (ESP.S && ESP.S.days) || {};
    return (days[iso] && Array.isArray(days[iso].sessions)) ? days[iso].sessions : [];
  }

  /* ------------------------------------------------------------ 1. olaylar */
  function olaylar(simdi){
    simdi = simdi || new Date();
    const U = ESP.U;
    const gun = U ? U.iso(simdi) : yerelISO(simdi).slice(0, 10);
    const sonuc = [];

    // tekrar_gunu: ESP.SRS.dueCards(gun).length >= 1
    const dueCards = (ESP.SRS && typeof ESP.SRS.dueCards === 'function')
      ? ESP.SRS.dueCards(gun)
      : [];

    if(dueCards && dueCards.length >= 1){
      sonuc.push({
        modul: 'esp',
        tur: 'tekrar_gunu',
        kimlik: 'esp.tekrar_gunu.' + gun,
        at: yerelISO(simdi),
        sayilar: {
          adet: {
            deger: dueCards.length,
            birim: 'kart',
            etiket: 'hesaplandı'
          }
        }
      });
    }

    return sonuc;
  }

  /* -------------------------------------------------------------- 2. hafta */
  function hafta(bitisISO){
    const U = ESP.U;
    const bitDate = U ? U.parse(bitisISO) : new Date(bitisISO);
    const basDate = U ? U.addDays(bitDate, -6) : new Date(bitDate.getTime() - 6 * 86400000);
    const bas = U ? U.iso(basDate) : yerelISO(basDate).slice(0, 10);
    const bit = bitisISO;

    const gunlerBu = [];
    for(let i = 0; i < 7; i++){
      gunlerBu.push(U ? U.iso(U.addDays(basDate, i)) : '');
    }

    const gunlerOnce = [];
    for(let i = -7; i < 0; i++){
      gunlerOnce.push(U ? U.iso(U.addDays(basDate, i)) : '');
    }

    function hesapla(gunler){
      let dkTop = 0;
      let hasDk = false;
      let oturumSayisi = 0;
      const gunSet = new Set();
      let hasEstimated = false;

      for(const g of gunler){
        const list = sessionsOf(g);
        for(const s of list){
          if(!s) continue;
          if(s.minutesCert === 'missing') continue;
          if(s.minutes == null) continue;
          if(typeof s.minutes !== 'number' || isNaN(s.minutes)) continue;

          dkTop += s.minutes;
          hasDk = true;
          oturumSayisi++;
          gunSet.add(g);
          if(s.minutesCert === 'estimated'){
            hasEstimated = true;
          }
        }
      }

      return {
        degerDk: hasDk ? dkTop : null,
        oturum: oturumSayisi > 0 ? oturumSayisi : null,
        gun: gunSet.size > 0 ? gunSet.size : null,
        hasEstimated: hasEstimated
      };
    }

    const bu = hesapla(gunlerBu);
    const once = hesapla(gunlerOnce);

    const calismaSatir = {
      id: 'calisma_dk',
      ad: 'Çalışma süresi',
      deger: bu.degerDk,
      birim: 'dk',
      etiket: bu.degerDk !== null ? (bu.hasEstimated ? 'tahmin' : 'ölçüldü') : 'veri yok',
      onceki: once.degerDk
    };

    const oturumSatir = {
      id: 'oturum',
      ad: 'Oturum',
      deger: bu.oturum,
      etiket: bu.oturum !== null ? 'ölçüldü' : 'veri yok',
      onceki: once.oturum
    };

    const gunSatir = {
      id: 'gun',
      ad: 'Çalışılan gün',
      deger: bu.gun,
      etiket: bu.gun !== null ? 'ölçüldü' : 'veri yok',
      onceki: once.gun
    };

    return {
      bas: bas,
      bit: bit,
      satirlar: [calismaSatir, oturumSatir, gunSatir]
    };
  }

  /* ------------------------------------------------------------ 3. hatirlat */
  function hatirlat(simdi){
    simdi = simdi || new Date();
    const U = ESP.U;
    const bugun = U ? U.iso(simdi) : yerelISO(simdi).slice(0, 10);
    const dun = U ? U.iso(U.addDays(simdi, -1)) : '';

    const son14 = [];
    for(let i = 0; i < 14; i++){
      son14.push(U ? U.iso(U.addDays(simdi, -i)) : '');
    }

    const dunOturumlari = sessionsOf(dun);
    const dunDiscler = new Set();
    for(const s of dunOturumlari){
      if(s && s.disc && s.minutes != null && s.minutesCert !== 'missing' && typeof s.minutes === 'number' && !isNaN(s.minutes)){
        dunDiscler.add(s.disc);
      }
    }

    const discDakikalar = {}; // disc -> array of minute numbers
    for(const g of son14){
      const list = sessionsOf(g);
      for(const s of list){
        if(!s || !s.disc) continue;
        if(s.minutesCert === 'missing') continue;
        if(s.minutes == null) continue;
        if(typeof s.minutes !== 'number' || isNaN(s.minutes)) continue;
        if(!s.at) continue;

        const dt = new Date(s.at);
        if(isNaN(dt.getTime())) continue;

        const dk = dt.getHours() * 60 + dt.getMinutes();
        if(!discDakikalar[s.disc]) discDakikalar[s.disc] = [];
        discDakikalar[s.disc].push(dk);
      }
    }

    const gorulenDiscler = [];
    if(Array.isArray(ESP.DISCIPLINES)){
      for(const d of ESP.DISCIPLINES){
        if(discDakikalar[d.id]) gorulenDiscler.push(d.id);
      }
    }
    for(const id of Object.keys(discDakikalar)){
      if(!gorulenDiscler.includes(id)) gorulenDiscler.push(id);
    }

    const sonuclar = [];
    for(const id of gorulenDiscler){
      const arr = discDakikalar[id] || [];
      const n = arr.length;
      if(n === 0) continue; // Son 14 günde hiç oturumu olmayan disiplin satır vermez

      const dObj = ESP.DISCIPLINE_BY_ID && ESP.DISCIPLINE_BY_ID[id];
      const ad = (dObj && (dObj.label || dObj.short)) || id;
      const dunDurum = dunDiscler.has(id) ? 'yapildi' : 'isaretlenmedi';

      let gercek = null;
      let etiket = 'veri yok';
      if(n >= 3){
        etiket = 'hesaplandı';
        const sirali = arr.slice().sort((a, b) => a - b);
        let med;
        if(n % 2 === 1){
          med = sirali[Math.floor(n / 2)];
        } else {
          med = Math.round((sirali[n / 2 - 1] + sirali[n / 2]) / 2);
        }
        const h = Math.floor(med / 60) % 24;
        const m = med % 60;
        gercek = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      }

      sonuclar.push({
        anahtar: 'disc:' + id,
        ad: ad,
        kurulu: null,
        gercek: gercek,
        n: n,
        etiket: etiket,
        dun: dunDurum
      });
    }

    return sonuclar;
  }

  /* ----------------------------------------------------------- 4. sonKayit */
  function sonKayit(){
    const U = ESP.U;
    const simdi = (U && typeof U.today === 'function') ? U.today() : new Date();

    const son14 = [];
    for(let i = 0; i < 14; i++){
      son14.push(U ? U.iso(U.addDays(simdi, -i)) : '');
    }

    let enYeniSession = null;
    let enYeniGun = null;
    let enYeniZaman = -Infinity;

    for(const g of son14){
      const list = sessionsOf(g);
      for(const s of list){
        if(!s) continue;
        if(s.minutesCert === 'missing') continue;
        if(s.minutes == null) continue;
        if(typeof s.minutes !== 'number' || isNaN(s.minutes)) continue;
        if(!s.at) continue;

        const dt = new Date(s.at);
        const t = dt.getTime();
        if(isNaN(t)) continue;

        if(t > enYeniZaman){
          enYeniZaman = t;
          enYeniSession = s;
          enYeniGun = g;
        }
      }
    }

    if(!enYeniSession || !enYeniGun) return null;

    const dObj = ESP.DISCIPLINE_BY_ID && ESP.DISCIPLINE_BY_ID[enYeniSession.disc];
    const ad = (dObj && (dObj.label || dObj.short)) || enYeniSession.disc || 'Oturum';

    return {
      id: enYeniGun + '/' + enYeniSession.id,
      tur: 'oturum',
      gun: enYeniGun,
      ad: ad,
      alanlar: [
        {
          ad: 'dk',
          deger: typeof enYeniSession.minutes === 'number' && !isNaN(enYeniSession.minutes) ? enYeniSession.minutes : null,
          birim: 'dk'
        }
      ]
    };
  }

  /* ------------------------------------------------------------- 5. duzelt */
  async function duzelt(id, alan, deger){
    if(alan !== 'dk'){
      return { ok: false, why: 'Bilinmeyen alan; yalnızca «dk» düzeltilebilir.' };
    }
    if(typeof deger !== 'number' || !Number.isInteger(deger) || isNaN(deger) || deger < 1 || deger > 600){
      return { ok: false, why: 'Süre 1 ile 600 dakika arasında bir tam sayı olmalıdır.' };
    }
    if(!id || typeof id !== 'string'){
      return { ok: false, why: 'Geçersiz oturum kimliği.' };
    }

    let gun = null, sessId = id;
    if(id.includes('/') || id.includes(':')){
      const parts = id.includes('/') ? id.split('/') : id.split(':');
      gun = parts[0];
      sessId = parts[1];
    } else {
      const days = (ESP.S && ESP.S.days) || {};
      for(const g of Object.keys(days)){
        if(days[g] && Array.isArray(days[g].sessions) && days[g].sessions.some(s => s && s.id === id)){
          gun = g;
          sessId = id;
          break;
        }
      }
    }

    if(!gun || !sessId){
      return { ok: false, why: 'Oturum kaydı bulunamadı.' };
    }

    const days = (ESP.S && ESP.S.days) || {};
    const day = days[gun];
    const sess = day && Array.isArray(day.sessions) && day.sessions.find(s => s && s.id === sessId);
    if(!day || !sess){
      return { ok: false, why: 'Oturum kaydı bulunamadı.' };
    }

    const once = typeof sess.minutes === 'number' && !isNaN(sess.minutes) ? sess.minutes : null;
    const onceCert = sess.minutesCert || 'missing';

    if(ESP.Model && typeof ESP.Model.updateSession === 'function'){
      await ESP.Model.updateSession(gun, sessId, { minutes: deger });
    } else {
      sess.minutes = deger;
      sess.minutesCert = 'measured';
      if(ESP.Store && typeof ESP.Store.set === 'function'){
        await ESP.Store.set('days/' + gun, day);
      }
    }

    return {
      ok: true,
      once: once,
      sonra: deger,
      geriAl: async () => {
        if(ESP.Model && typeof ESP.Model.updateSession === 'function'){
          await ESP.Model.updateSession(gun, sessId, { minutes: once });
          const d = ESP.S && ESP.S.days && ESP.S.days[gun];
          const s = d && Array.isArray(d.sessions) && d.sessions.find(x => x && x.id === sessId);
          if(s){
            s.minutes = once;
            s.minutesCert = onceCert;
            if(typeof ESP.Model.saveDay === 'function'){
              await ESP.Model.saveDay(gun);
            } else if(ESP.Store && typeof ESP.Store.set === 'function'){
              await ESP.Store.set('days/' + gun, d);
            }
          }
        } else {
          const d = ESP.S && ESP.S.days && ESP.S.days[gun];
          const s = d && Array.isArray(d.sessions) && d.sessions.find(x => x && x.id === sessId);
          if(s){
            s.minutes = once;
            s.minutesCert = onceCert;
            if(ESP.Store && typeof ESP.Store.set === 'function'){
              await ESP.Store.set('days/' + gun, d);
            }
          }
        }
        return { ok: true, once: deger, sonra: once };
      }
    };
  }

  /* ------------------------------------------------------------ 6. brifing */
  function brifing(simdi){
    const now = (simdi instanceof Date && !isNaN(simdi.getTime()))
      ? simdi
      : (simdi ? new Date(simdi) : new Date());
    const validNow = isNaN(now.getTime()) ? new Date() : now;
    const U = ESP.U;
    const pad = n => String(n).padStart(2, '0');
    const toISO = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const addDays = (d, n) => {
      if(U && typeof U.addDays === 'function'){
        return U.addDays(d, n);
      }
      const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      r.setDate(r.getDate() + n);
      return r;
    };
    const isoStr = d => (U && typeof U.iso === 'function') ? U.iso(d) : toISO(d);

    const gun = isoStr(validNow);

    // 1. Plan: ESP'nin günlük planı yok: her zaman [] (uydurma madde yok)
    const plan = [];

    // 2. Bulgu: Dünün tek ölçüsü
    function gunOlcumu(isoGun){
      const list = sessionsOf(isoGun);
      let toplamDk = 0;
      let sayilanAdet = 0;
      let hepsiOlculdu = true;

      for(const s of list){
        if(!s) continue;
        if(s.minutesCert === 'missing') continue;
        if(s.minutes == null) continue;
        if(typeof s.minutes !== 'number' || isNaN(s.minutes)) continue;

        toplamDk += s.minutes;
        sayilanAdet++;
        if(s.minutesCert !== 'measured'){
          hepsiOlculdu = false;
        }
      }

      if(sayilanAdet === 0){
        return null;
      }

      return {
        deger: toplamDk,
        etiket: hepsiOlculdu ? 'ölçüldü' : 'tahmin'
      };
    }

    const dunDate = addDays(validNow, -1);
    const dunGun = isoStr(dunDate);
    const dunOlcum = gunOlcumu(dunGun);

    let bulgu = null;
    if(dunOlcum !== null){
      let ortToplam = 0;
      let ortGunSayisi = 0;

      for(let offset = -2; offset >= -8; offset--){
        const gDate = addDays(validNow, offset);
        const gISO = isoStr(gDate);
        const olcum = gunOlcumu(gISO);
        if(olcum !== null){
          ortToplam += olcum.deger;
          ortGunSayisi++;
        }
      }

      let ort;
      if(ortGunSayisi >= 3){
        ort = {
          deger: Math.round(ortToplam / ortGunSayisi),
          etiket: 'hesaplandı'
        };
      } else {
        ort = {
          deger: null,
          etiket: 'veri yok'
        };
      }

      bulgu = {
        id: 'calisma_dk',
        ad: 'Çalışma',
        deger: dunOlcum.deger,
        birim: 'dk',
        etiket: dunOlcum.etiket,
        ort: ort
      };
    }

    // 3. Öneri: olaylar(simdi) içinden öncelikli ilk olay
    const ONCELIK = ['sinav_yaklasti', 'uyku_dustu', 'plan_kacti', 'tekrar_gunu'];
    const tumOlaylar = olaylar(validNow) || [];
    let secilenOlay = null;
    for(const tur of ONCELIK){
      const bul = tumOlaylar.find(o => o && o.tur === tur);
      if(bul){
        secilenOlay = bul;
        break;
      }
    }
    if(!secilenOlay && tumOlaylar.length > 0){
      secilenOlay = tumOlaylar[0];
    }

    let oneri = null;
    if(secilenOlay){
      oneri = {
        id: secilenOlay.tur,
        sayilar: secilenOlay.sayilar
      };
      if(secilenOlay.konu !== undefined && secilenOlay.konu !== null){
        oneri.konu = secilenOlay.konu;
      }
    } else {
      const ilk = (plan || []).find(m => m && !m.tamam);
      if(ilk){
        oneri = {
          id: 'ilk_madde',
          konu: ilk.ad,
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
