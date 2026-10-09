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
     5. AÇILINCA TEMİZLENİR (2026-10-09). Modül açıldığında ve öne her
        gelişinde o modülün iPhone bildirim ekranında duran (gelmiş)
        bildirimleri kalkar: kullanıcı zaten oradadır. Kurulu (bekleyen)
        bildirimlere dokunulmaz; öteki modülünkilere de.
     6. ROZET. Uygulama simgesindeki sayı Onaylar'ın bekleyenidir (karar
        167, brand/ortak/pwa.js rozet). Kabuk tarayıcının Badging API'sini
        (navigator.setAppBadge) burada sağlar, modül kodu değişmez; üç
        modülün sayısını kabuk toplar.
     7. BİLDİRİMDEKİ DÜĞME (2026-10-09). Liste satırı `eylem` taşırsa
        («Aldım», «İçtim», «Yaptım», «Ölçtüm», «Yapıldı») bildirimde o düğme
        ve «15 dk ertele» çıkar. Düğmeye basılınca kabuk işareti telefonda
        SIRAYA koyar, hiçbir kayda yazmaz. Modül açılınca sırayı alır,
        KENDİ koduyla yazar (`isaretci`) ve ancak yazdıktan sonra sıradan
        siler: işaret kaybolmaz. İşleyici doğruysa (yazıldı ya da artık
        uygulanamaz: «yok») silinir; yanlışsa ya da hata verirse sırada
        kalır. Ertelenen bildirim kurulumda silinmez; modül işi işaretleyince
        (`yapildi`) kalkar. İşaret bir kayıttır, ölçüm değil.
     8. NE KURULU, GÖRÜLÜR (2026-10-09). `listeAc` bu modülün telefonda
        kurulu bildirimlerini saatiyle gösterir. «Bunu sil» o tek bildirimi
        siler ve modülün sonraki kurulumunda da kurmaz (bu cihazda, o
        bildirimin zamanı geçene dek); «Hepsini sil» şu an kurulu olanların
        hepsini siler — yeni günlerinki yine kurulur, tamamen kapatmak
        modülün kendi anahtarıdır (ekran bunu söyler). «Geri al» silineni
        geri kurar. Silmek işi yapılmış saymaz; hiçbir kayda yazılmaz.
   Model hiçbir aşamada yoktur; metin modülün kural metnidir. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.BILDIRIM = (function(){
  'use strict';

  const AD = 'lifeosBildirim';
  const SINIR = { spi:30, esp:16, ays:16 };         // toplam 62 < 64 (iOS); Swift ile aynı
  const ZAMAN_ASIMI = 8000;
  const ATLA = 'lifeos.telbildirim.atla';           // söz 8: { anahtar: bitiş ms } (pwa.js lifeos.bildirim.<modül> değil)
  const GUN_MS = 86400000;
  let son = null;                                    // son bilinen izin durumu
  let sonKur = null;                                 // { modul, liste } — geri almada yeniden kurulur

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
  /* Söz 8: silinen (atlanan) bildirimler; süresi geçen düşer. */
  function atlaOku(simdi){
    const n = typeof simdi === 'number' ? simdi : Date.now();
    let v = null;
    try{ v = JSON.parse(localStorage.getItem(ATLA) || 'null'); }catch(e){ v = null; }
    const out = {};
    if(v && typeof v === 'object') Object.keys(v).forEach(k => { if(typeof v[k] === 'number' && v[k] > n) out[k] = v[k]; });
    return out;
  }
  function atlaYaz(v){ try{ localStorage.setItem(ATLA, JSON.stringify(v)); }catch(e){ /* depo yok: yalnız bu açılış */ } }

  function temizle(modul, liste, simdi){
    const n = typeof simdi === 'number' ? simdi : Date.now();
    const gor = {}, atla = atlaOku(n);
    return (Array.isArray(liste) ? liste : [])
      .filter(x => x && typeof x.anahtar === 'string' && x.anahtar && typeof x.baslik === 'string'
        && typeof x.zaman === 'number' && isFinite(x.zaman) && x.zaman > n && !atla[x.anahtar])
      .filter(x => (gor[x.anahtar] ? false : (gor[x.anahtar] = true)))
      .sort((a, b) => a.zaman - b.zaman)
      .slice(0, SINIR[modul] || 6)
      .map(x => ({ anahtar:x.anahtar.slice(0, 120), baslik:x.baslik.slice(0, 80),
        govde:String(x.govde || '').slice(0, 160), zaman:Math.round(x.zaman) }));
  }
  async function kur(modul, liste){
    if(!var_()) return { ok:false, kurulan:0 };
    sonKur = { modul, liste:Array.isArray(liste) ? liste : [] };
    const t = temizle(modul, liste);
    const r = await gonder({ tur:'kur', modul, liste:t });
    return { ok:!!r.ok, kurulan:r.ok ? Number(r.kurulan) || 0 : 0, why:r.why };
  }

  /* Gelmiş bildirimleri kaldır (söz 5). anahtarlar yoksa bu modülün
     hepsi; kabuk modülü kapıdan bilir. Dönüş: { ok, kaldirilan }. */
  async function kaldir(anahtarlar){
    if(!var_()) return { ok:false, kaldirilan:0 };
    const m = { tur:'kaldir' };
    if(Array.isArray(anahtarlar)){
      m.anahtarlar = anahtarlar.filter(x => typeof x === 'string' && x).map(x => x.slice(0, 120));
    }
    const r = await gonder(m);
    return { ok:!!r.ok, kaldirilan:r.ok ? Number(r.kaldirilan) || 0 : 0 };
  }

  /* Bu modülün rozet sayısı (söz 6); kabuk üç modülünkini toplar. */
  async function rozet(sayi){
    if(!var_()) return { ok:false, toplam:0 };
    const n = Math.max(0, Math.min(999, Math.floor(Number(sayi) || 0)));
    const r = await gonder({ tur:'rozet', sayi:n });
    return { ok:!!r.ok, toplam:r.ok ? Number(r.toplam) || 0 : 0 };
  }

  /* Bildirimdeki düğmenin işareti (söz 7). Modül bir kez işleyici verir;
     sıra hemen ve öne her gelişte alınır. */
  let isaretci = null, aliniyor = false;
  function isaretciKur(fn){
    isaretci = typeof fn === 'function' ? fn : null;
    return isaretleriAl();
  }
  async function isaretleriAl(){
    if(!var_() || !isaretci || aliniyor) return 0;
    aliniyor = true;
    try{
      const r = await gonder({ tur:'isaretler' });
      const l = r.ok && Array.isArray(r.isaretler) ? r.isaretler : [];
      const biten = [];
      for(const o of l){
        if(!o || typeof o.anahtar !== 'string' || !o.anahtar) continue;
        let sonuc = false;
        try{ sonuc = await isaretci({ anahtar:o.anahtar, zaman:Number(o.zaman) || Date.now() }); }
        catch(e){ sonuc = false; }
        if(sonuc) biten.push(o.anahtar);
      }
      if(biten.length) await gonder({ tur:'isaretSil', anahtarlar:biten });
      return biten.length;
    }finally{ aliniyor = false; }
  }
  /* Modül işi işaretledi: o anahtarın ertelenmişi ve gelmişleri kalkar. */
  function yapildi(anahtar){
    if(!var_() || typeof anahtar !== 'string' || !anahtar) return Promise.resolve({ ok:false });
    return gonder({ tur:'yapildi', anahtar:anahtar.slice(0, 120) });
  }

  /* Söz 8: bu modülün telefonda kurulu bildirimleri, saat sırasıyla. */
  async function liste(){
    if(!var_()) return { ok:false, liste:[] };
    const r = await gonder({ tur:'liste' });
    const l = r.ok && Array.isArray(r.liste) ? r.liste : [];
    return { ok:!!r.ok, liste:l.filter(x => x && typeof x.anahtar === 'string' && x.anahtar)
      .map(x => ({ anahtar:x.anahtar, baslik:String(x.baslik || ''), govde:String(x.govde || ''),
        zaman:Number(x.zaman) || 0, ertelendi:!!x.ertelendi }))
      .sort((a, b) => a.zaman - b.zaman) };
  }
  /* ogeler: [{ anahtar, zaman }] — silinir ve zamanı geçene dek yeniden kurulmaz. */
  async function atla(ogeler){
    const v = atlaOku();
    const l = (Array.isArray(ogeler) ? ogeler : []).filter(o => o && typeof o.anahtar === 'string' && o.anahtar);
    l.forEach(o => { v[o.anahtar] = Math.max(Number(o.zaman) || 0, Date.now()) + GUN_MS; });
    atlaYaz(v);
    if(!var_() || !l.length) return { ok:false, silinen:0 };
    const r = await gonder({ tur:'sil', anahtarlar:l.map(o => o.anahtar.slice(0, 120)) });
    return { ok:!!r.ok, silinen:r.ok ? Number(r.silinen) || 0 : 0 };
  }
  /* Silineni geri koy: atlananlar unutulur, son liste yeniden kurulur. */
  async function geriAl(){
    atlaYaz({});
    if(!var_() || !sonKur) return { ok:false, kurulan:0 };
    return kur(sonKur.modul, sonKur.liste);
  }

  /* Liste paneli (zil panelinin kalıbı: brand/ortak/kabuk.css). */
  const GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  function zamanYaz(ms, simdi){
    const d = new Date(ms), n = simdi ? new Date(simdi) : new Date();
    const gun = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const fark = Math.round((gun(d) - gun(n)) / GUN_MS);
    const saat = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if(fark === 0) return 'Bugün ' + saat;
    if(fark === 1) return 'Yarın ' + saat;
    return GUNLER[d.getDay()] + ' ' + d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + saat;
  }
  const PANEL = 'tel-bildirim';
  let panelNot = '';
  function panelHtml(l, simdi){
    const K = (window.LIFEOS || {}).KABUK, s = ad => (K && K.simge ? K.simge(ad) : '');
    const silinen = Object.keys(atlaOku()).length;
    const govde = l.length ? l.map(x => '<div class="bildirim__satir">'
        + '<div class="kmenu__bildirim tb__oge"><span class="bildirim__metin"><b>' + kac(zamanYaz(x.zaman, simdi))
        + (x.ertelendi ? ' · ertelendi' : '') + '</b> ' + kac(x.baslik)
        + (x.govde ? '<small>' + kac(x.govde) + '</small>' : '') + '</span></div>'
        + '<button type="button" class="bildirim__ertele" data-tb="atla" data-tb-a="' + kac(x.anahtar) + '" data-tb-z="' + kac(x.zaman) + '"'
        + ' aria-label="' + kac(zamanYaz(x.zaman, simdi) + ', ' + x.baslik + ': bunu sil') + '" title="Bunu sil">' + s('kapat') + '</button></div>').join('')
      : '<div class="kmenu__bos bildirim__bos"><span class="bildirim__bos-simge" aria-hidden="true">' + s('zil') + '</span>'
        + '<b>Kurulu bildirim yok.</b><small>Bu modül telefonda şu an hiçbir şey hatırlatmayacak.</small></div>';
    return '<div class="katman kmenu kmenu--bildirim kmenu--yan" role="dialog" aria-label="Telefonda kurulu bildirimler">'
      + '<header class="bildirim__bas"><b>Kurulu bildirimler</b>'
      +   (l.length ? '<span class="bildirim__sayi bildirim__sayi--notr" aria-label="' + l.length + ' bildirim">' + l.length + '</span>'
          + '<button type="button" class="bildirim__gordu" data-tb="hepsi">Hepsini sil</button>' : '')
      +   '<button type="button" class="bildirim__kapat" data-katman-kapat aria-label="Kapat">' + s('kapat') + '</button>'
      + '</header>'
      + '<div class="bildirim__liste">' + govde + '</div>'
      + (silinen ? '<p class="bildirim__ertelenen">' + silinen + ' bildirim silindi.<button type="button" data-tb="geri">Geri al</button></p>' : '')
      + '<p class="tb__not">Yeni günlerin bildirimleri yine kurulur.' + (panelNot ? ' ' + kac(panelNot) : '') + '</p>'
      + '</div>';
  }
  async function listeAc(capa, not){
    const K = (window.LIFEOS || {}).KABUK;
    if(!K || !var_()) return false;
    panelNot = typeof not === 'string' ? not : '';
    const r = await liste();
    K.katmanAc(PANEL, panelHtml(r.liste), capa);
    return true;
  }
  /* Paneldeki eylem: atla (tek) | hepsi | geri. Sonra panel yerinde tazelenir. */
  async function panelEylem(t, anahtar, zaman){
    if(t === 'atla' && anahtar) await atla([{ anahtar, zaman }]);
    else if(t === 'hepsi') await atla((await liste()).liste);
    else if(t === 'geri') await geriAl();
    else return false;
    const K = (window.LIFEOS || {}).KABUK;
    if(K && K.katmanAcik && K.katmanAcik(PANEL)){
      const r = await liste();
      K.katmanTazele(PANEL, panelHtml(r.liste));
      const p = document.getElementById(PANEL);
      const ilk = p && (p.querySelector('[data-tb]') || p.querySelector('button'));
      if(ilk){ try{ ilk.focus({ preventScroll:true }); }catch(e){} }
    }
    return true;
  }

  /* Uygulamada kurulum: Badging API köprüye bağlanır, açılışta ve öne her
     gelişte gelmiş bildirimler kalkar. Tarayıcıda hiçbir şey yapmaz. */
  function kurulum(doc, nav){
    if(!var_()) return false;
    const d = doc || document, n = nav || navigator;
    /* Uygulamada simge kabuğundur: WKWebView'ın kendi setAppBadge'i (varsa)
       simgeye ulaşmayabilir, köprü her zaman bağlanır. */
    try{
      n.setAppBadge = s => rozet(s == null ? 0 : s).then(() => undefined);
      n.clearAppBadge = () => rozet(0).then(() => undefined);
    }catch(e){ /* salt okunur gezgin: rozet yok, temizlik sürer */ }
    kaldir();
    d.addEventListener('visibilitychange', () => { if(!d.hidden){ kaldir(); isaretleriAl(); } });
    /* Söz 8: «Kurulu bildirimler» düğmesi (modül çizer) ve panelin eylemleri. */
    d.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const ac = t.closest('[data-tb-ac]');
      if(ac){ e.preventDefault(); listeAc(ac, ac.getAttribute('data-tb-not') || ''); return; }
      const b = t.closest('[data-tb]');
      if(b){ e.preventDefault(); panelEylem(b.getAttribute('data-tb'), b.getAttribute('data-tb-a'), Number(b.getAttribute('data-tb-z'))); }
    });
    return true;
  }

  /* Bir günün «HH:MM»i → ms (yerel saat). */
  function anOf(gunISO, hhmm){
    const g = String(gunISO).split('-').map(Number), s = String(hhmm).split(':').map(Number);
    return new Date(g[0], g[1] - 1, g[2], s[0] || 0, s[1] || 0, 0, 0).getTime();
  }

  const api = { var:var_, durum, izin, sonDurum, kur, temizle, kaldir, rozet, anOf, SINIR, AD, _cevap,
    isaretci:isaretciKur, yapildi, _isaretVar:isaretleriAl, liste, atla, geriAl, listeAc, zamanYaz,
    _panelHtml:panelHtml, _panelEylem:panelEylem, _kurulum:kurulum };
  kurulum();
  return api;
})();
