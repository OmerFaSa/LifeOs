/* HATIRLATMALAR (fikir 34 + 35) — ilaç/takviye, su ve hareket.

   Sözler:
     1. YALNIZ KULLANICININ GİRDİĞİ. Hangi ilacı hangi saatte hatırlatacağını
        kullanıcı yazar; sistem saat, sıklık ya da doz ÖNERMEZ (AGENTS §1.5).
        Hatırlatmada yalnız ad ve saat görünür; doz notu bile gösterilmez.
     2. İLAÇ KAYDINA BAĞLIDIR. İlaç hatırlatması `meds` kaydının kimliğini
        taşır; kayıt bırakılınca (bitiş tarihi) hatırlatma da susar.
     3. SPİ'DE KALIR. İlaç adı HKM'ye hiçbir seviyede gitmez (core/beacon.js
        klinik sınır); bu yüzden hatırlatma Telegram'dan değil, SPİ açıkken
        Bugün ekranından ve — kullanıcı izin verdiyse — tarayıcı
        bildiriminden gelir. SPİ kapalıyken hatırlatma YOKTUR; ekran bunu
        söyler.
     4. «YAPILDI» BİR KAYITTIR, ÖLÇÜM DEĞİL. Su hatırlatmasına «İçtim» demek
        mililitre yazmaz: miktar uydurulmaz, su alanı ayrıca girilir.
        İşaretlenmemiş bir saat «alınmadı» sayılmaz — «işaretlenmedi»dir;
        bu yüzden uyum yüzdesi HESAPLANMAZ. */

window.SP = window.SP || {};

SP.Hatirlat = (function(){
  const U = () => SP.U;
  const KEY = 'hatirlat';
  const SAKLA_GUN = 14;
  const EN_COK_SAAT = 8;
  const BILDIRIM_PENCERE_DK = 15;

  const TUR = {
    ilac:{ ad:'İlaç / takviye', eylem:'Aldım' },
    su:{ ad:'Su', eylem:'İçtim', metin:'Su' },
    hareket:{ ad:'Hareket', eylem:'Yaptım', metin:'Hareket molası' },
    /* 088 ÖLÇÜM HATIRLATICISI: sabah tartısı. «Ölçtüm» bir işarettir;
       tartının kendisi ölçüm formundan girilir, işaret kilo yazmaz. */
    olcum:{ ad:'Sabah ölçümü', eylem:'Ölçtüm', metin:'Sabah tartısı' },
  };

  function bos(){ return { liste:[], yapildi:{}, bildirim:false }; }
  function durum(){
    if(!SP.S.hatirlat) SP.S.hatirlat = bos();
    return SP.S.hatirlat;
  }

  async function yukle(){
    const d = (await SP.Store.get(KEY)) || {};
    SP.S.hatirlat = Object.assign(bos(), d);
    if(!Array.isArray(SP.S.hatirlat.liste)) SP.S.hatirlat.liste = [];
    if(!SP.S.hatirlat.yapildi || typeof SP.S.hatirlat.yapildi !== 'object') SP.S.hatirlat.yapildi = {};
    return SP.S.hatirlat;
  }

  async function kaydet(){
    const d = durum();
    const sinir = U().iso(U().addDays(U().today(), -SAKLA_GUN));
    Object.keys(d.yapildi).forEach(g => { if(g < sinir) delete d.yapildi[g]; });
    await SP.Store.set(KEY, d);
    return d;
  }

  /* «8:00, 21.30 13:15» → ['08:00', '13:15', '21:30']. Anlaşılmayan bir
     parça TAHMİN EDİLMEZ, sorulur (AGENTS §1.7). */
  function saatOku(metin){
    const parca = String(metin || '').split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
    if(!parca.length) return { ok:false, why:'En az bir saat yaz (örn. 08:00).' };
    const out = [];
    for(const p of parca){
      const m = /^(\d{1,2})[:.](\d{2})$/.exec(p);
      const s = m ? Number(m[1]) : NaN, d = m ? Number(m[2]) : NaN;
      if(!m || s > 23 || d > 59) return { ok:false, why:'«' + p + '» bir saat değil; 08:00 biçiminde yaz.' };
      const hhmm = String(s).padStart(2, '0') + ':' + String(d).padStart(2, '0');
      if(out.indexOf(hhmm) < 0) out.push(hhmm);
    }
    if(out.length > EN_COK_SAAT) return { ok:false, why:'Bir hatırlatmaya en çok ' + EN_COK_SAAT + ' saat yazılır.' };
    return { ok:true, saatler:out.sort() };
  }

  function ilacOf(h){ return (SP.S.meds || []).find(m => m.id === h.medId) || null; }

  function adOf(h){
    if(h.tur === 'ilac'){
      const m = ilacOf(h);
      return m ? (m.name || SP.Meds.kindOf(m).name) : 'Silinmiş ilaç kaydı';
    }
    return TUR[h.tur].metin;
  }

  /* Bugün geçerli mi: ilaç hatırlatması yalnız ilaç o gün etkinse. */
  function gecerli(h, gun){
    if(h.tur !== 'ilac') return true;
    const m = ilacOf(h);
    return !!m && SP.Meds.activeOn(m, gun);
  }

  async function ekle(g){
    const x = g || {};
    if(!TUR[x.tur]) return { ok:false, why:'Hatırlatma türü seçilmedi.' };
    if(x.tur === 'ilac' && !(SP.S.meds || []).some(m => m.id === x.medId)){
      return { ok:false, why:'Hangi ilaç ya da takviye olduğu seçilmedi.' };
    }
    const s = saatOku(x.saatler);
    if(!s.ok) return s;
    const d = durum();
    const onceki = d.liste.find(h => h.tur === x.tur && (x.tur !== 'ilac' || h.medId === x.medId));
    if(onceki) onceki.saatler = s.saatler;
    else d.liste.push({ id:U().uid('ht'), tur:x.tur, medId:x.tur === 'ilac' ? x.medId : null,
      saatler:s.saatler, at:new Date().toISOString() });
    await kaydet();
    return { ok:true, saatler:s.saatler };
  }

  async function sil(id){
    const d = durum();
    const h = d.liste.find(x => x.id === id);
    if(!h) return { ok:false, why:'Hatırlatma bulunamadı.' };
    d.liste = d.liste.filter(x => x.id !== id);
    await kaydet();
    return { ok:true, geri:h };
  }

  async function geriKoy(h){
    const d = durum();
    if(h && !d.liste.some(x => x.id === h.id)) d.liste.push(h);
    await kaydet();
  }

  function dk(hhmm){ const p = String(hhmm).split(':'); return Number(p[0]) * 60 + Number(p[1]); }

  /* Bugünün satırları: her hatırlatmanın her saati. `durum`:
       yapildi   kullanıcı işaretledi
       vakti     saati geldi, işaretlenmedi
       sonra     saati gelmedi */
  function bugun(simdi){
    const now = simdi || new Date();
    const gun = U().iso(now);
    const n = now.getHours() * 60 + now.getMinutes();
    const d = durum();
    const yap = d.yapildi[gun] || {};
    const out = [];
    d.liste.forEach(h => {
      if(!gecerli(h, gun)) return;
      h.saatler.forEach(saat => {
        const anahtar = h.id + '@' + saat;
        out.push({ anahtar, id:h.id, tur:h.tur, saat, ad:adOf(h), eylem:TUR[h.tur].eylem,
          durum:yap[anahtar] ? 'yapildi' : (n >= dk(saat) ? 'vakti' : 'sonra') });
      });
    });
    return out.sort((a, b) => a.saat < b.saat ? -1 : a.saat > b.saat ? 1 : 0);
  }

  async function isaretle(anahtar, deger, gunISO){
    const d = durum();
    const gun = gunISO || U().todayISO();
    d.yapildi[gun] = d.yapildi[gun] || {};
    if(deger === false) delete d.yapildi[gun][anahtar];
    else d.yapildi[gun][anahtar] = new Date().toISOString();
    await kaydet();
  }

  /* ------------------------------------------------ tarayıcı bildirimi */

  function bildirimVar(){ return typeof window.Notification === 'function'; }
  function bildirimIzinli(){ return bildirimVar() && window.Notification.permission === 'granted'; }

  async function bildirimAc(){
    if(!bildirimVar()) return { ok:false, why:'Bu tarayıcı bildirim göstermiyor.' };
    let izin = window.Notification.permission;
    if(izin !== 'granted') izin = await window.Notification.requestPermission();
    if(izin !== 'granted') return { ok:false, why:'Bildirim izni verilmedi; hatırlatmalar yalnız Bugün ekranında görünür.' };
    durum().bildirim = true;
    await kaydet();
    return { ok:true };
  }
  async function bildirimKapat(){ durum().bildirim = false; await kaydet(); }

  /* Dakikada bir çağrılır. Saati son 15 dakikada gelmiş, işaretlenmemiş
     ve bu oturumda gösterilmemiş satır için bir bildirim. Kaçan saat
     KOVALANMAZ: iki saat önceki hatırlatma bildirim değil gürültüdür. */
  const gosterildi = {};
  function tik(simdi){
    if(!durum().bildirim || !bildirimIzinli()) return 0;
    const now = simdi || new Date();
    const gun = U().iso(now);
    const n = now.getHours() * 60 + now.getMinutes();
    let say = 0;
    bugun(now).forEach(r => {
      const k = gun + '|' + r.anahtar;
      if(r.durum !== 'vakti' || gosterildi[k] || n - dk(r.saat) > BILDIRIM_PENCERE_DK) return;
      gosterildi[k] = true;
      if(goster('SPİ · ' + r.saat, { body:r.ad, tag:'spi-' + r.anahtar })) say++;
    });
    return say;
  }

  /* Android Chrome sayfa içinden `new Notification` kurmaya izin vermez
     («Illegal constructor»); orada hizmet çalışanının showNotification'ı
     gerekir. Hata yutuluyor, izin verilmiş görünürken hiçbir hatırlatma
     gelmiyordu (ekip/HATALAR.md O-8). İkisi de olmazsa bu SÖYLENİR. */
  let sorun = null;
  const SORUN = 'Bu tarayıcı bildirimi gösteremedi (Android Chrome gibi). Hatırlatmalar '
    + 'yalnız Bugün ekranında görünür.';
  function goster(baslik, secenek){
    try{ new window.Notification(baslik, secenek); sorun = null; return true; }
    catch(e){
      const sw = navigator.serviceWorker;
      if(!sw || typeof sw.getRegistration !== 'function'){ sorun = SORUN; return false; }
      sw.getRegistration().then(function(reg){
        if(!reg || typeof reg.showNotification !== 'function') throw new Error('kayıt yok');
        return reg.showNotification(baslik, secenek);
      }).then(function(){ sorun = null; }, function(){ sorun = SORUN; });
      return true;
    }
  }
  function bildirimSorunu(){ return sorun; }

  return { TUR, yukle, kaydet, saatOku, ekle, sil, geriKoy, bugun, isaretle, adOf, durum,
    bildirimVar, bildirimIzinli, bildirimAc, bildirimKapat, bildirimSorunu, tik };
})();
