/* Canlı kayıt — rota hareket ederken (core/canli.js) ve Kardiyo
   ekranındaki kayıt akışı. Konum kaynağı, saat, depo ve ekran kilidi
   sahtedir: gerçek GPS'e, gerçek localStorage'a dokunulmaz. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const C = SP.Canli;

  const M_DERECE = Math.PI * 6371008.8 / 180;
  const T0 = new Date(2026, 8, 20, 9, 0, 0).getTime();

  /* Sahte dünya: kaynak.ver(...) bir konum gönderir. */
  let eski = null, kaynak = null, depo = {}, saat = T0, guvenli = true;
  /* Sahte telefon köprüsü (uygulama/ios KonumKoprusu): her konumu, sayfa
     «yazdım» diyene dek diskte tutar. `arkada` iken konum sayfaya gitmez
     (ekran kapalı, web süreci uyuyor ya da ölü). */
  let telefon = null, arkada = false;
  function telefonKur(suruyor){
    telefon = { noktalar:[], yazildiT:[], kurtarIstek:[], suruyor,
      kurtar(devam, cb){
        telefon.kurtarIstek.push(devam);
        const c = { noktalar:telefon.noktalar.slice(), suruyor:!!(devam && telefon.suruyor) };
        setTimeout(() => cb(c), 0);
      },
      yazildi(t){ telefon.yazildiT.push(t); telefon.noktalar = telefon.noktalar.filter(p => p.timestamp > t); },
    };
    C._ortam.kopru = () => telefon;
    C._ortam.arkaPlan = () => true;
  }
  function kur(){
    const o = C._ortam;
    eski = Object.assign({}, o);
    depo = {}; saat = T0; guvenli = true; telefon = null; arkada = false;
    o.kopru = () => null;
    o.cihaz = () => null;
    kaynak = {
      izleniyor:false, kapandi:0,
      watchPosition(ok, hata){ kaynak.ok = ok; kaynak.hataFn = hata; kaynak.izleniyor = true; return 7; },
      clearWatch(){ kaynak.kapandi++; kaynak.izleniyor = false; },
    };
    o.kaynak = () => kaynak;
    o.guvenli = () => guvenli;
    o.saat = () => saat;
    o.kilit = () => null;
    o.arkaPlan = () => false;
    o.depo = {
      oku:k => depo[k] ? JSON.parse(depo[k]) : null,
      yaz:(k, v) => { depo[k] = JSON.stringify(v); return true; },
      sil:k => { delete depo[k]; },
    };
    C._sifirla();
  }
  function birak(){ C._sifirla(); Object.assign(C._ortam, eski); }
  async function sahneyle(fn){ kur(); try{ await fn(); } finally{ birak(); } }

  /* `sn` saniyede (T0'dan) konum; doğruluk ve yükseklik isteğe bağlı. */
  function ver(lat, lon, sn, dogruluk, ele){
    saat = T0 + sn * 1000;
    const p = { coords:{ latitude:lat, longitude:lon,
      accuracy:dogruluk == null ? 5 : dogruluk, altitude:ele == null ? null : ele }, timestamp:saat };
    if(telefon) telefon.noktalar.push(p);
    if(kaynak.ok && !arkada) kaynak.ok(p);
  }
  /* Kuzeye düz koşu: n nokta, adım 10 m / 3 sn, `basSn`'den ve `lat0`'dan. */
  function kos(n, basSn, lat0){
    for(let i = 0; i < n; i++) ver((lat0 == null ? 41 : lat0) + i * 10 / M_DERECE, 29, basSn + i * 3);
  }
  const taslak = () => { const k = Object.keys(depo)[0]; return k ? JSON.parse(depo[k]) : null; };
  const bekle = () => new Promise(r => setTimeout(r, 0));

  describe('Canlı kayıt — başlatma', () => {
    it('güvensiz bağlantıda kayıt başlamaz ve nedeni söylenir', () => sahneyle(async () => {
      guvenli = false;
      const r = C.baslat('kosu');
      expect(r.ok).toBe(false);
      expect(r.why).toContain('https');
      expect(C.durum()).toBeNull();
      expect(kaynak.izleniyor).toBe(false);
    }));

    it('konum servisi yoksa söylenir', () => sahneyle(async () => {
      C._ortam.kaynak = () => null;
      expect(C.baslat('kosu').why).toBe('Bu tarayıcı konum vermiyor.');
    }));

    it('ikinci kayıt başlamaz', () => sahneyle(async () => {
      expect(C.baslat('kosu').ok).toBe(true);
      expect(C.baslat('kosu').ok).toBe(false);
    }));

    it('tanınmayan tür kaydedilmez — sonra sorulur', () => sahneyle(async () => {
      C.baslat('yuzme');
      expect(C.durum().tur).toBeNull();
    }));
  });

  describe('Canlı kayıt — konum', () => {
    it('konumlar ize girer; zayıf konum alınmaz, sayılır ve söylenir', () => sahneyle(async () => {
      C.baslat('kosu');
      expect(kaynak.izleniyor).toBe(true);
      kos(101, 0);
      ver(41.02, 29, 305, 50);
      const d = C.durum();
      expect(d.hal).toBe('kayitta');
      expect(d.nokta).toBe(101);
      expect(d.kotu).toBe(1);
      expect(d.hata).toContain('zayıf');
      expect(C.ozet().mesafe).toBe(1000);
      expect(d.sure).toBe(305);
    }));

    it('durakta titreşen konum birikmez; seyrek nokta yine tutulur', () => sahneyle(async () => {
      C.baslat('kosu');
      for(let k = 0; k < 10; k++) ver(41 + (k % 2) / M_DERECE, 29, k * 2);
      expect(C.durum().nokta).toBe(1);
      ver(41, 29, 40);
      expect(C.durum().nokta).toBe(2);
    }));

    it('duraklatma yeni parça açar; aradaki yol ve süre sayılmaz', () => sahneyle(async () => {
      C.baslat('kosu');
      kos(101, 0);                                  /* 0–300 sn, 1000 m */
      saat = T0 + 300e3;
      C.duraklat();
      expect(kaynak.izleniyor).toBe(false);
      ver(41.5, 29, 600);                           /* duraklatılmışken gelen konum */
      saat = T0 + 1800e3;
      expect(C.surdur().ok).toBe(true);
      kos(101, 1800, 41 + 3000 / M_DERECE);         /* 2 km ötede, 1000 m daha */
      expect(C.noktalar()[101].parca).toBe(true);
      expect(C.noktalar()).toHaveLength(202);
      const r = C.bitir();
      expect(r.ok).toBe(true);
      expect(r.rota.mesafe).toBe(2000);
      expect(C.durum().sure).toBe(600);
    }));

    it('ekran kapalıyken gelmeyen konum boşluk olarak toplanır ve söylenir', () => sahneyle(async () => {
      C.baslat('kosu');
      kos(10, 0);                                   /* son nokta 27. sn */
      ver(41 + 400 / M_DERECE, 29, 147);            /* 120 sn sessizlik */
      kos(20, 150, 41 + 410 / M_DERECE);
      expect(C.durum().bosluk).toBe(120);
      expect(C.bitir().rota.bosluk).toBe(120);
    }));
  });

  describe('Canlı kayıt — kayıp ve bitiş', () => {
    it('sayfa yenilenince kayıt duraklatılmış geri gelir; son yazıma kadar süre sayılır', () => sahneyle(async () => {
      C.baslat('kosu');
      kos(50, 0);                                   /* taslak 15 sn'de bir yazılır */
      const t = taslak();
      expect(t.hal).toBe('kayitta');
      C._sifirla();                                 /* sayfa kapandı, depo kaldı */
      const d = C.durum();
      expect(d.hal).toBe('duraklat');
      expect(d.geriGeldi).toBe(true);
      expect(d.nokta).toBe(t.n.length);
      expect(d.nokta >= 45).toBe(true);
      expect(d.sure).toBe(Math.round((t.yazildi - t.aktifBas) / 1000));
      expect(kaynak.izleniyor).toBe(false);
    }));

    it('bozuk taslak yok sayılır (null başlangıç sayı geçmez)', () => sahneyle(async () => {
      const k = 'spi.canli.' + (localStorage.getItem('spi.activeProfile') || 'ben');
      depo[k] = JSON.stringify({ v:1, hal:'kayitta', bas:null, aktifBas:null, n:[] });
      expect(C.durum()).toBeNull();
    }));

    it('bitir rotayı kurar; kaydedilene dek taslak silinmez', () => sahneyle(async () => {
      C.baslat('kosu');
      kos(101, 0);
      const r = C.bitir();
      expect(r.ok).toBe(true);
      expect(r.rota.kaynak).toBe('canli');
      expect(r.rota.mesafe).toBe(1000);
      expect(r.rota.zayif).toBe(0);
      expect(C.durum().hal).toBe('bitti');
      expect(kaynak.izleniyor).toBe(false);
      expect(taslak().hal).toBe('bitti');
      C.sil();
      expect(C.durum()).toBeNull();
      expect(taslak()).toBeNull();
    }));

    it('hareketsiz kayıt bitirilemez ama silinmez de', () => sahneyle(async () => {
      C.baslat('kosu');
      ver(41, 29, 0);
      const r = C.bitir();
      expect(r.ok).toBe(false);
      expect(r.why).toContain('hareket yok');
      expect(C.durum().hal).toBe('duraklat');
    }));

    it('hiç konum gelmeden bitirilen kayıt bunu söyler', () => sahneyle(async () => {
      C.baslat('kosu');
      const r = C.bitir();
      expect(r.ok).toBe(false);
      expect(r.why).toContain('hiç konum gelmedi');
      expect(C.durum().hal).toBe('duraklat');
    }));

    it('izin reddi: nokta yoksa kayıt hiç başlamamış sayılır ve söylenir', () => sahneyle(async () => {
      const olaylar = [];
      const kes = C.dinle(o => olaylar.push(o));
      try{
        C.baslat('kosu');
        kaynak.hataFn({ code:1, message:'denied' });
      }finally{ kes(); }
      expect(C.durum()).toBeNull();
      expect(olaylar.some(o => o.tip === 'hata' && o.why === C.IZIN_YOK)).toBe(true);
    }));

    it('izin noktalar varken giderse kayıt duraklatılır, noktalar korunur', () => sahneyle(async () => {
      C.baslat('kosu');
      kos(20, 0);
      kaynak.hataFn({ code:1 });
      expect(C.durum().hal).toBe('duraklat');
      expect(C.durum().nokta).toBe(20);
    }));

    it('ekran kilidi istenir, duraklatınca bırakılır; yoksa söylenir', () => sahneyle(async () => {
      const kilit = { birakildi:false, release(){ this.birakildi = true; }, addEventListener(){} };
      C._ortam.kilit = () => ({ request:async () => kilit });
      C.baslat('kosu');
      await bekle();
      expect(C.durum().ekran).toBe('acik');
      C.duraklat();
      expect(kilit.birakildi).toBe(true);
      C.sil();
      C._ortam.kilit = () => null;
      C.baslat('kosu');
      await bekle();
      expect(C.durum().ekran).toBe('yok');
    }));

    /* iPhone uygulaması (uygulama/ios, 2026-10-04): konumu iPhone'un kendi
       servisi verir ve ekran kapalıyken de gelir. Orada ekran kilidi
       istenmez; ekran durumu «arka-plan»dır. */
    it('uygulamada (arka planda konum) ekran kilidi istenmez', () => sahneyle(async () => {
      let istek = 0;
      C._ortam.kilit = () => ({ request:async () => { istek++; return { release(){}, addEventListener(){} }; } });
      C._ortam.arkaPlan = () => true;
      C.baslat('kosu');
      await bekle();
      expect(C.durum().ekran).toBe('arka-plan');
      expect(istek).toBe(0);
      kos(20, 0);
      expect(C.durum().nokta).toBe(20);
    }));

    /* Uygulamada tarayıcı yok: «site ayarları» diye bir yer gösterilemez.
       2026-10-04 telefon denemesi: izin kalkınca ekranda «Tarayıcının site
       ayarlarından konuma izin ver.» yazıyordu. */
    it('uygulamada izin reddi telefonun Ayarlar\'ını gösterir, tarayıcıyı değil', () => sahneyle(async () => {
      C._ortam.arkaPlan = () => true;
      const olaylar = [];
      const kes = C.dinle(o => olaylar.push(o));
      try{
        C.baslat('kosu');
        kos(20, 0);
        kaynak.hataFn({ code:1, message:'Konum izni verilmedi.' });
        expect(C.durum().hal).toBe('duraklat');
        expect(C.durum().hata).toBe(C.IZIN_YOK_UYGULAMA);
        C.sil();
        C.baslat('kosu');
        kaynak.hataFn({ code:1 });
      }finally{ kes(); }
      expect(C.durum()).toBeNull();
      const metinler = olaylar.filter(o => o.tip === 'hata').map(o => o.why);
      expect(metinler.length).toBe(2);
      expect(metinler.every(m => m === C.IZIN_YOK_UYGULAMA)).toBe(true);
      expect(C.IZIN_YOK_UYGULAMA).toContain('Ayarlar');
      expect(/[Tt]arayıcı/.test(C.IZIN_YOK_UYGULAMA)).toBe(false);
    }));
  });

  /* ------------------------------------- uygulamada kurtarma (aşama 2b)
     iPhone uygulamasında ekran kapalıyken noktalar telefonda birikir.
     iOS web sürecini öldürürse ya da uygulamayı kapatırsa o noktalar
     yalnız bellekteydi: koşunun ekran kapalı kısmı kayboluyordu ve
     sayfa yeniden açılınca GPS duruyordu. Artık telefon, sayfanın
     «yazdım» demediği her noktayı diskte tutar; sayfa açılınca ister. */

  describe('Canlı kayıt — uygulamada kurtarma', () => {
    it('yazılan nokta telefona bildirilir; depo yazılamazsa bildirilmez', () => sahneyle(async () => {
      telefonKur(true);
      C.baslat('kosu');
      kos(10, 0);                                   /* 0–27 sn; 15. sn'de yazılır */
      expect(telefon.yazildiT.length > 0).toBe(true);
      const son = telefon.yazildiT[telefon.yazildiT.length - 1];
      expect(son).toBe(taslak().sg);
      expect(telefon.noktalar.every(p => p.timestamp > son)).toBe(true);
      const once = telefon.yazildiT.length;
      C._ortam.depo.yaz = () => false;               /* depo dolu */
      kos(10, 60, 41 + 200 / M_DERECE);
      C.duraklat();
      expect(telefon.yazildiT.length).toBe(once);
    }));

    it('web süreci ölür, GPS durmazsa: kayıt kaldığı yerden sürer, ekran kapalı kısım ize girer', () => sahneyle(async () => {
      telefonKur(true);
      C.baslat('kosu');
      kos(20, 0);                                   /* ekran açık: 0–57 sn, ~190 m */
      arkada = true;                                 /* ekran kapandı */
      kos(80, 60, 41 + 200 / M_DERECE);             /* 60–297 sn yalnız telefonda */
      C._sifirla();                                  /* web süreci öldü, sayfa yeniden açıldı */
      expect(C.durum().hal).toBe('duraklat');        /* telefon cevap verene dek */
      expect(telefon.kurtarIstek).toEqual([false, true]);   /* ilk sayfa (taslak yoktu), yeniden açılan */
      await bekle();
      arkada = false;
      const d = C.durum();
      expect(d.hal).toBe('kayitta');
      expect(d.geriGeldi).toBe(false);
      expect(d.nokta).toBe(100);
      expect(d.sure).toBe(297);                      /* süre hiç durmadı */
      expect(d.ekran).toBe('arka-plan');
      expect(kaynak.izleniyor).toBe(true);
      expect(C.noktalar().filter(n => n.parca)).toHaveLength(1);   /* tek parça: yol kesilmedi */
      expect(taslak().n).toHaveLength(100);
      expect(telefon.noktalar).toHaveLength(0);      /* yazıldı, telefon sildi */
      kos(10, 300, 41 + 1000 / M_DERECE);
      expect(C.durum().nokta).toBe(110);
    }));

    it('uygulama kapanmışsa (GPS durdu): noktalar eklenir, kayıt duraklatılmış gelir, süre son noktaya dek', () => sahneyle(async () => {
      telefonKur(false);
      C.baslat('kosu');
      kos(20, 0);
      arkada = true;
      kos(80, 60, 41 + 200 / M_DERECE);              /* son nokta 297. sn */
      C._sifirla();
      saat = T0 + 3600e3;                            /* bir saat sonra açıldı */
      C.durum();
      await bekle();
      const d = C.durum();
      expect(d.hal).toBe('duraklat');
      expect(d.geriGeldi).toBe(true);
      expect(d.nokta).toBe(100);
      expect(d.sure).toBe(297);
      expect(kaynak.izleniyor).toBe(false);
      expect(taslak().n).toHaveLength(100);
      expect(telefon.noktalar).toHaveLength(0);
      expect(C.surdur().ok).toBe(true);              /* sürdürünce yeni parça */
      arkada = false;
      kos(5, 3700, 41 + 2000 / M_DERECE);
      expect(C.noktalar()[100].parca).toBe(true);
    }));

    it('telefonun yeniden verdiği nokta ikinci kez işlenmez', () => sahneyle(async () => {
      telefonKur(true);
      telefon.yazildi = t => { telefon.yazildiT.push(t); };   /* bildirim telefona ulaşmadı: hepsi elinde */
      C.baslat('kosu');
      kos(20, 0);                                    /* taslakta 0–45 sn */
      ver(41.5, 29, 70, 80);                         /* zayıf konum: taslakta yok, bir kez sayılır */
      expect(telefon.noktalar).toHaveLength(21);
      C._sifirla();
      C.durum();
      await bekle();
      expect(C.durum().nokta).toBe(20);
      expect(C.durum().kotu).toBe(1);
      expect(C.noktalar().every((n, i, a) => i === 0 || n.t > a[i - 1].t)).toBe(true);
    }));

    it('taslak yoksa telefonun noktaları hiçbir kayda eklenmez', () => sahneyle(async () => {
      telefonKur(true);
      telefon.noktalar.push({ coords:{ latitude:41, longitude:29, accuracy:5, altitude:null }, timestamp:T0 });
      expect(C.durum()).toBeNull();
      await bekle();
      expect(telefon.kurtarIstek).toEqual([false]);
      expect(C.durum()).toBeNull();
      expect(telefon.yazildiT).toHaveLength(0);
    }));

    it('kayıttan önceki (eski kayda ait) nokta eklenmez', () => sahneyle(async () => {
      telefonKur(true);
      saat = T0 + 600e3;
      C.baslat('kosu');
      kos(5, 600);
      const eskiler = [];
      for(let i = 0; i < 5; i++) eskiler.push({ coords:{ latitude:40, longitude:29 + i * 0.001, accuracy:5, altitude:null }, timestamp:T0 + i * 1000 });
      C._sifirla();
      telefon.noktalar = eskiler.concat(telefon.noktalar);
      C.durum();
      await bekle();
      expect(C.durum().nokta).toBe(5);
      expect(C.noktalar().every(n => n.lat === 41 || n.lat > 41)).toBe(true);
    }));

    /* Kullanıcı (2026-10-05, telefondan): «direk konum gelmiyor»; ekranda
       yalnız «Konum bekleniyor…» vardı ve Ayarlar › LifeOS'ta Konum satırı
       hiç yoktu — yani telefon izin bile sormamıştı. Ekran nedenini
       söylemiyordu. Artık telefonun bildirdiği duruma göre söyler. */
    it('uygulamada konum beklenirken nedeni söylenir (telefonun bildirdiği duruma göre)', () => sahneyle(async () => {
      telefonKur(true);
      let cihaz = null;
      C._ortam.cihaz = () => cihaz;
      C.baslat('kosu');
      const metin = () => C.durum().bekleme;
      expect(metin()).toBe(null);                              /* ilk saniyeler: sıradan bekleme */
      saat = T0 + 5000;
      expect(metin()).toContain('cevap vermedi');              /* köprü hiç durum bildirmedi */
      cihaz = { izin:'soruluyor', kesin:true, servis:true, gps:false, gelen:0 };
      expect(metin()).toContain('«Uygulamayı Kullanırken»');
      cihaz = { izin:'izinli', kesin:true, servis:false, gps:false, gelen:0 };
      expect(metin()).toContain('Konum Servisleri');
      cihaz = { izin:'izinli', kesin:false, servis:true, gps:true, gelen:0 };
      expect(metin()).toContain('Kesin Konum');
      cihaz = { izin:'izinli', kesin:true, servis:true, gps:true, gelen:0 };
      expect(metin()).toContain('ilk konum bekleniyor');
      cihaz = { izin:'reddedildi', kesin:true, servis:true, gps:false, gelen:0 };
      expect(metin()).toBe(C.IZIN_YOK_UYGULAMA);
      kos(3, 10);
      expect(metin()).toBe(null);                              /* nokta geldi: söylenecek bir şey yok */
    }));

    it('telefon durum bildirince ekran yenilenir; tarayıcıda neden söylenmez', () => sahneyle(async () => {
      telefonKur(true);
      C.baslat('kosu');
      let olay = 0;
      const kes = C.dinle(() => olay++);
      try{ window.dispatchEvent(new CustomEvent('lifeos-konum-durum', { detail:{ izin:'izinli' } })); }
      finally{ kes(); }
      expect(olay).toBe(1);
      C.sil();
      C._ortam.kopru = () => null;
      C._ortam.arkaPlan = () => false;
      C.baslat('kosu');
      saat = T0 + 60000;
      expect(C.durum().bekleme).toBe(null);
    }));

    it('tarayıcıda (köprü yok) telefona hiçbir şey sorulmaz', () => sahneyle(async () => {
      C.baslat('kosu');
      kos(20, 0);
      C._sifirla();
      expect(C.durum().hal).toBe('duraklat');
      await bekle();
      expect(C.durum().hal).toBe('duraklat');
    }));
  });

  /* -------------------------------------------------- Kardiyo ekranı */

  describe('Canlı kayıt — Kardiyo ekranı', () => {
    const scr = SP.Screens.move;
    const kagit = () => document.getElementById('sheet');
    async function sessiz(fn){
      const ciz = SP.App.render, bil = SP.UI.toast, toastlar = [];
      SP.App.render = () => {}; SP.UI.toast = t => toastlar.push(t);
      try{ await fn(); }
      finally{ SP.App.render = ciz; SP.UI.toast = bil; }
      return toastlar;
    }
    const kart = async () => {
      const d = document.createElement('div');
      d.innerHTML = await scr.render();
      return d.querySelector('.rota');
    };

    it('kayıt yokken kartta «Kayda başla» ve «GPX ekle» var', () => sahneyle(async () => {
      resetState();
      const d = document.createElement('div');
      d.innerHTML = await scr.render();
      expect(d.querySelector('[data-act="canli-ac"]')).toBeTruthy();
      expect(d.querySelector('input[data-change="rota-dosya"]')).toBeTruthy();
      expect(d.querySelector('#canli-kart')).toBeNull();
    }));

    it('başlatma kağıdı türü sorar; Başlat kaydı açar', () => sahneyle(async () => {
      resetState();
      await sessiz(async () => {
        await scr.handle['canli-ac']();
        expect(kagit().querySelector('[data-act="canli-tur"][data-value="kosu"]')).toBeTruthy();
        await scr.handle['canli-tur']({ dataset:{ value:'bisiklet' } });
        await scr.handle['canli-basla']();
      });
      expect(C.durum().hal).toBe('kayitta');
      expect(C.durum().tur).toBe('bisiklet');
      expect(kagit().querySelector('#canli-ekran')).toBeTruthy();
      SP.UI.closeSheet();
    }));

    it('güvensiz bağlantıda Başlat nedeni söyler, kayıt açılmaz', () => sahneyle(async () => {
      resetState();
      guvenli = false;
      const t = await sessiz(async () => {
        await scr.handle['canli-ac']();
        await scr.handle['canli-basla']();
      });
      expect(C.durum()).toBeNull();
      expect(t[0]).toContain('https');
      SP.UI.closeSheet();
    }));

    it('tarayıcıda «ekranı açık tut» denir; uygulamada denmez, ekran kapalıyken de kaydettiği söylenir', () => sahneyle(async () => {
      resetState();
      await sessiz(async () => { await scr.handle['canli-ac'](); });
      expect(kagit().textContent).toContain('kilitli ekranda konum gelmez');
      SP.UI.closeSheet();
      const durumSatiri = async () => {
        await sessiz(async () => { await scr.handle['canli-ekran'](); });
        const s = document.getElementById('canli-durum');
        const metin = s ? s.textContent : null;
        SP.UI.closeSheet();
        return metin;
      };
      C.baslat('kosu');
      await bekle();
      kos(20, 0);
      expect(await durumSatiri()).toContain('Ekranı açık tut');
      C.sil();

      C._ortam.arkaPlan = () => true;
      await sessiz(async () => { await scr.handle['canli-ac'](); });
      expect(kagit().textContent.indexOf('kilitli ekranda') < 0).toBe(true);
      expect(kagit().textContent).toContain('Ekran kapalıyken de kaydeder');
      SP.UI.closeSheet();
      C.baslat('kosu');
      await bekle();
      kos(20, 0);
      const uygulamada = await durumSatiri();
      expect(uygulamada !== null && uygulamada.indexOf('Ekranı açık tut') < 0).toBe(true);
    }));

    it('kayıt sürerken kart durumu ve süreyi gösterir', () => sahneyle(async () => {
      resetState();
      C.baslat('kosu');
      kos(101, 0);
      const k = await kart();
      const s = k.querySelector('#canli-kart');
      expect(s.textContent).toContain('Kayıt sürüyor');
      expect(s.textContent).toContain('1,00 km');
      expect(s.textContent).toContain('5:00');
    }));

    it('bitir → önizleme → Kaydet: seans kaydedilir, taslak silinir', () => sahneyle(async () => {
      resetState();
      C.baslat('kosu');
      kos(101, 0);
      const t = await sessiz(async () => {
        await scr.handle['canli-bitir']();
        expect(kagit().querySelector('[data-act="rota-kaydet"]').disabled).toBe(false);
        await scr.handle['rota-kaydet']();
      });
      expect(SP.S.workouts).toHaveLength(1);
      expect(SP.S.workouts[0].rota.kaynak).toBe('canli');
      expect(SP.S.workouts[0].items[0].exId).toBe('kosu');
      expect(C.durum()).toBeNull();
      expect(taslak()).toBeNull();
      expect(t).toContain('Rota eklendi');
    }));

    it('önizlemeden «Sonra» ile çıkılırsa kayıt kaybolmaz', () => sahneyle(async () => {
      resetState();
      C.baslat(null);
      kos(101, 0);
      await sessiz(async () => { await scr.handle['canli-bitir'](); });
      expect(kagit().querySelector('[data-act="rota-kaydet"]').disabled).toBe(true);
      SP.UI.closeSheet();
      expect(C.durum().hal).toBe('bitti');
      const k = await kart();
      expect(k.querySelector('#canli-kart').textContent).toContain('Kaydedilmemiş rota');
      expect(k.querySelector('[data-act="canli-gozden"]')).toBeTruthy();
    }));

    it('kart «Sil» kaydı onayla siler', () => sahneyle(async () => {
      resetState();
      C.baslat('kosu');
      kos(30, 0);
      C.duraklat();
      const eskiOnay = SP.UI.confirmSheet;
      let onay = null;
      SP.UI.confirmSheet = (b, m, f) => { onay = f(); };
      try{ await sessiz(async () => { await scr.handle['canli-sil'](); await onay; }); }
      finally{ SP.UI.confirmSheet = eskiOnay; }
      expect(C.durum()).toBeNull();
    }));

    it('hareketsiz kaydı bitirmek söylenir, kayıt kalır', () => sahneyle(async () => {
      resetState();
      C.baslat('kosu');
      ver(41, 29, 0);
      const t = await sessiz(async () => { await scr.handle['canli-bitir'](); });
      expect(t[0]).toContain('hareket yok');
      expect(C.durum().hal).toBe('duraklat');
      SP.UI.closeSheet();
    }));
  });
})();
