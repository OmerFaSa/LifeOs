/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/sahtesaat.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* SAHTE SAAT — testler zamanlayıcıyı gerçek zamanda beklemez (test yardımcısı).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sahtesaat.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne kopyalanır; test sayfasında harness'tan
   hemen sonra yüklenir.

     await LIFEOS.SahteSaat.saatle(async ilerlet => {
       el.click(); await ilerlet(450); expect(...);
     });

   Yalnız setTimeout/setInterval, Date.now ve performance.now sahtedir;
   CSS geçişi, requestAnimationFrame ve olay döngüsü gerçek kalır. Zamanlayıcıyı
   yükleme anında kendine kopyalayan kod sahte saati görmez. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.SahteSaat = (function(){
  /* KING-4 Ölçüm 1c/2c: testler gerçek zamanı beklemez.
     Test süresince setTimeout/clearTimeout, setInterval/clearInterval, Date.now ve
     performance.now'u yönetir; ilerlet(ms) ile zamanlayıcıları sırayla çalıştırır;
     finally içinde gerçeklerini mutlaka geri koyar. */
  let saatAktif = false;
  let sahteSimdi = 0;
  let sayac = 1;
  const zamanlayicilar = new Map();
  const gercek = {
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    setInterval: window.setInterval.bind(window),
    clearInterval: window.clearInterval.bind(window),
    DateNow: Date.now.bind(Date),
    perfNow: window.performance && window.performance.now ? window.performance.now.bind(window.performance) : null
  };

  function saatKur(){
    sahteSimdi = gercek.DateNow();
    sayac = 1;
    zamanlayicilar.clear();
    if(saatAktif) return;
    saatAktif = true;

    window.setTimeout = function(fn, ms){
      if(!saatAktif) return gercek.setTimeout.apply(window, arguments);
      const id = sayac++;
      const gecikme = Math.max(0, Number(ms) || 0);
      const args = Array.prototype.slice.call(arguments, 2);
      zamanlayicilar.set(id, {
        id,
        fn,
        args,
        zaman: sahteSimdi + gecikme,
        tekrar: null
      });
      return id;
    };

    window.clearTimeout = function(id){
      if(!saatAktif) return gercek.clearTimeout.apply(window, arguments);
      if(zamanlayicilar.has(id)) zamanlayicilar.delete(id);
      else gercek.clearTimeout(id);
    };

    window.setInterval = function(fn, ms){
      if(!saatAktif) return gercek.setInterval.apply(window, arguments);
      const id = sayac++;
      const aralik = Math.max(1, Number(ms) || 0);
      const args = Array.prototype.slice.call(arguments, 2);
      zamanlayicilar.set(id, {
        id,
        fn,
        args,
        zaman: sahteSimdi + aralik,
        tekrar: aralik
      });
      return id;
    };

    window.clearInterval = function(id){
      if(!saatAktif) return gercek.clearInterval.apply(window, arguments);
      if(zamanlayicilar.has(id)) zamanlayicilar.delete(id);
      else gercek.clearInterval(id);
    };

    Date.now = function(){
      if(!saatAktif) return gercek.DateNow();
      return sahteSimdi;
    };

    if(gercek.perfNow && window.performance){
      const baslangicPerf = gercek.perfNow();
      const baslangicSahte = sahteSimdi;
      window.performance.now = function(){
        if(!saatAktif) return gercek.perfNow();
        return baslangicPerf + (sahteSimdi - baslangicSahte);
      };
    }
  }

  function saatKaldir(){
    saatAktif = false;
    zamanlayicilar.clear();
    window.setTimeout = gercek.setTimeout;
    window.clearTimeout = gercek.clearTimeout;
    window.setInterval = gercek.setInterval;
    window.clearInterval = gercek.clearInterval;
    Date.now = gercek.DateNow;
    if(gercek.perfNow && window.performance){
      window.performance.now = gercek.perfNow;
    }
  }

  async function ilerlet(ms){
    const hedefZaman = sahteSimdi + Math.max(0, Number(ms) || 0);
    let adim = 0;
    while(adim++ < 10000){
      let aday = null;
      for(const z of zamanlayicilar.values()){
        if(z.zaman <= hedefZaman){
          if(!aday || z.zaman < aday.zaman || (z.zaman === aday.zaman && z.id < aday.id)){
            aday = z;
          }
        }
      }
      if(!aday) break;

      sahteSimdi = aday.zaman;
      if(aday.tekrar != null){
        aday.zaman += aday.tekrar;
      }else{
        zamanlayicilar.delete(aday.id);
      }

      try{
        if(typeof aday.fn === 'function') aday.fn.apply(window, aday.args || []);
        else if(typeof aday.fn === 'string') (new Function(aday.fn))();
      }catch(e){
        console.error('Sahte saat zamanlayici hatasi:', e);
      }
      await Promise.resolve();
    }
    sahteSimdi = hedefZaman;
    await Promise.resolve();
  }

  async function saatle(fn){
    saatKur();
    try{
      await fn(ilerlet);
    }finally{
      saatKaldir();
    }
  }

  return Object.freeze({ saatle });
})();
