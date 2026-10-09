/* BİLDİRİM — telefon uygulamasında yerel bildirim (iOS kabuğu, 2026-10-09).

   Depo sahibinin isteği: «iPhone: Apple Sağlık ve bildirim». Tarayıcı
   bildirimi yalnız sayfa açıkken gelir; WKWebView'da hiç yoktur (SPİ
   hatırlatmaları uygulamada «bu tarayıcı bildirim göstermiyor» diyordu).
   Uygulamanın kabuğu (uygulama/ios/LifeOS/BildirimKoprusu.swift) iOS'un
   YEREL bildirimini açar: saati gelince uygulama kapalıyken de gelir.

   Sözler:
     1. YALNIZ UYGULAMADA. Köprü yoksa (tarayıcı, PC) `var()` false döner,
        hiçbir şey yapılmaz, hiçbir şey beklenmez.
     2. NE ZAMAN NE GELECEĞİNİ MODÜL SÖYLER. Kabuk içeriği anlamaz; modül
        kendi kuralıyla listeyi üretir (SPİ hatırlatma saatleri, ESP
        hatırlatıcılar, AYS günün planı) ve her değişiklikte LİSTENİN TAMAMINI yollar: kabuk
        o modülün eskilerini siler, yenilerini kurar. Bir modül ötekinin
        bildirimine dokunamaz (kabuk modülü sayfanın kapısından bilir).
     3. SINIRLI VE YAKIN. iOS bir uygulamaya en çok 64 bekleyen bildirim
        verir; modül başına üst sınır (SINIR) ve en yakın olanlar önce.
        Geçmiş zaman kurulmaz.
     4. İZİN KULLANICININ. İzin yalnız kullanıcı bir düğmeye bastığında
        sorulur; reddedilirse bu söylenir (Ayarlar › LifeOS › Bildirimler).
   Model hiçbir aşamada yoktur; metin modülün kural metnidir. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.BILDIRIM = (function(){
  'use strict';

  const AD = 'lifeosBildirim';
  const SINIR = { spi:30, esp:16, ays:16 };         // toplam 62 < 64 (iOS); Swift ile aynı
  const ZAMAN_ASIMI = 8000;
  let son = null;                                    // son bilinen izin durumu

  function kopru(){
    try{ return window.webkit.messageHandlers[AD] || null; }catch(e){ return null; }
  }
  function var_(){ return !!kopru(); }

  /* Kabuk cevabı konum köprüsündeki gibi JS çağrısıyla döner:
     `_cevap(istek, {...})`. Cevap gelmezse (eski kabuk) zaman aşımıyla düşer. */
  let sira = 0;
  const bekleyen = {};
  function gonder(mesaj){
    const k = kopru();
    if(!k) return Promise.resolve({ ok:false, why:'Bildirim yalnız telefon uygulamasında kurulur.' });
    return new Promise(res => {
      const no = ++sira;
      const bitir = v => { if(bekleyen[no]){ delete bekleyen[no]; clearTimeout(sure); res(v); } };
      const sure = setTimeout(() => bitir({ ok:false, why:'Telefon cevap vermedi.' }), ZAMAN_ASIMI);
      bekleyen[no] = bitir;
      try{ k.postMessage(Object.assign({}, mesaj, { istek:no })); }
      catch(e){ bitir({ ok:false, why:'Telefon cevap vermedi.' }); }
    });
  }
  function _cevap(no, v){
    const f = bekleyen[no];
    if(!f) return;
    const x = v && typeof v === 'object' ? v : {};
    f(x.hata ? { ok:false, why:String(x.hata) } : Object.assign({ ok:true }, x));
  }

  /* İzin durumu: 'izin' | 'red' | 'sorulmadi' (ya da null: bilinmiyor). */
  async function durum(){
    const r = await gonder({ tur:'durum' });
    if(r.ok && typeof r.durum === 'string') son = r.durum;
    return r.ok ? r.durum : null;
  }
  async function izin(){
    const r = await gonder({ tur:'izin' });
    if(r.ok && typeof r.durum === 'string') son = r.durum;
    return r.ok ? r.durum : null;
  }
  function sonDurum(){ return son; }

  /* liste: [{ anahtar, baslik, govde, zaman (ms) }] — bu modülün bütün
     bildirimleri. Geçmiş atılır, en yakın SINIR kadarı gider. Boş liste
     bu modülün bekleyenlerini siler. Dönüş: { ok, kurulan }. */
  function temizle(modul, liste, simdi){
    const n = typeof simdi === 'number' ? simdi : Date.now();
    const gor = {};
    return (Array.isArray(liste) ? liste : [])
      .filter(x => x && typeof x.anahtar === 'string' && x.anahtar && typeof x.baslik === 'string'
        && typeof x.zaman === 'number' && isFinite(x.zaman) && x.zaman > n)
      .filter(x => (gor[x.anahtar] ? false : (gor[x.anahtar] = true)))
      .sort((a, b) => a.zaman - b.zaman)
      .slice(0, SINIR[modul] || 6)
      .map(x => ({ anahtar:x.anahtar.slice(0, 120), baslik:x.baslik.slice(0, 80),
        govde:String(x.govde || '').slice(0, 160), zaman:Math.round(x.zaman) }));
  }
  async function kur(modul, liste){
    if(!var_()) return { ok:false, kurulan:0 };
    const t = temizle(modul, liste);
    const r = await gonder({ tur:'kur', modul, liste:t });
    return { ok:!!r.ok, kurulan:r.ok ? Number(r.kurulan) || 0 : 0, why:r.why };
  }

  /* Bir günün «HH:MM»i → ms (yerel saat). */
  function anOf(gunISO, hhmm){
    const g = String(gunISO).split('-').map(Number), s = String(hhmm).split(':').map(Number);
    return new Date(g[0], g[1] - 1, g[2], s[0] || 0, s[1] || 0, 0, 0).getTime();
  }

  return { var:var_, durum, izin, sonDurum, kur, temizle, anOf, SINIR, AD, _cevap };
})();
