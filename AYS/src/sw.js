/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/sw.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* ÇEVRİMDIŞI KABUK — service worker (brand/ortak/pwa.js kaydeder).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sw.js`; `tools/ortak.py --yay` ile üç arayüzün
   `src/` köküne birebir kopyalanır, `build.py` de `dist/` yanına koyar.

   YALNIZ SUNUCUYLA. `file://` ile açılan tek dosyada service worker
   olmaz (tarayıcı izin vermez); o yol eskisi gibi çalışır.

   AĞ ÖNCE. Ağ cevap verirse o kullanılır ve kopyası saklanır; ağ yoksa
   saklanan kopya açılır. Sunucunun «önbellek yok» kuralı (sunucu.py)
   böyle bozulmaz: kaynak düzenlenince yeni sürüm hemen gelir, eski kopya
   YALNIZ ağ yokken görünür.

   AĞ YOK ÜÇ BİÇİMDE GELİR (her yerden erişim, 2026-11-06). Reddedilir; vekil
   LifeOS kapalıyken boş 502 döner (ölçüldü); bilgisayar kapalıyken özel ağ
   hiç cevap vermez, tarayıcı dakikalarca bekler. İkisinde de kopya açılır,
   AG_BEKLE'den uzun beklenmez; geç gelen cevap arkada saklanır (§1.4). Bir
   dosya geciktiyse sonrakiler AG_DINLEN boyunca hiç beklemez: açılış toplam
   AG_BEKLE sürer, dosya sayısıyla büyümez.

   Saklanmayanlar: başka kökenden gelen (HKM, yazı tipi), /api/ (hesap),
   GET olmayan,
   parça isteği (Range / 206) ve hatalı cevap. Kişisel veri buraya hiç
   girmez: veri tarayıcı deposunda durur, bu kasa yalnız uygulamanın
   dosyalarını (sayfa, kod, görsel) tutar. */

const KASA = 'lifeos-kabuk-v1';
const EN_COK = 400;
const AG_BEKLE = 3000;
const AG_DINLEN = 30000;
let agGec = 0;

function ayniKoken(adres){
  try{ return new URL(adres).origin === self.location.origin; }catch(e){ return false; }
}

/* /api/ (hesap ve eşitleme, brand/ortak/hesap.js) hiç karışılmaz: cevabı
   kişiseldir ve kasaya girmez; bayat bir «durum» çevrimdışıyken yanlış
   söylerdi. */
function apiMi(adres){
  try{ return new URL(adres).pathname.indexOf('/api/') === 0; }catch(e){ return false; }
}

function ilgili(istek){
  return istek.method === 'GET' && ayniKoken(istek.url) && !apiMi(istek.url);
}

function saklanir(istek, cevap){
  return ilgili(istek) && !istek.headers.has('range') && !!cevap && cevap.status === 200
    && (cevap.type === 'basic' || cevap.type === 'default');
}

async function sakla(anahtar, cevap){
  try{ await (await caches.open(KASA)).put(anahtar, cevap); }catch(e){ /* kota dolu: sessiz */ }
}

async function eskisi(istek){
  const k = await caches.open(KASA);
  const tam = await k.match(istek.url) || await k.match(istek.url, { ignoreSearch:true });
  if(tam) return tam;
  if(istek.mode === 'navigate'){
    const kok = self.registration.scope;
    return await k.match(kok) || await k.match(kok + 'index.html') || null;
  }
  return null;
}

/* Video parça parça istenir (Range → 206) ve parça saklanamaz. Parça
   ağdan gelince dosyanın TAMAMI bir kez arkada indirilip saklanır;
   böylece açılan video çevrimdışıyken de oynar. */
async function tamaminiSakla(adres){
  try{
    const k = await caches.open(KASA);
    if(await k.match(adres)) return;
    const cevap = await fetch(adres, { cache:'no-store' });
    if(cevap.ok && cevap.status === 200) await k.put(adres, cevap);
  }catch(e){ /* sonraki açılışta yine denenir */ }
}

async function agOnce(istek, olay){
  const ag = fetch(istek).then(cevap => {
    agGec = 0;
    if(saklanir(istek, cevap)) return sakla(istek.url, cevap.clone()).then(() => cevap);
    if(istek.headers.has('range') && cevap.ok) olay.waitUntil(tamaminiSakla(istek.url));
    return cevap;
  });
  olay.waitUntil(ag.catch(() => {}));
  const GEC = {};
  try{
    const bekle = Date.now() - agGec < AG_DINLEN ? 0 : AG_BEKLE;
    const cevap = await Promise.race([ag, new Promise(ok => setTimeout(() => ok(GEC), bekle))]);
    if(cevap !== GEC && (cevap.status < 502 || cevap.status > 504)) return cevap;
    if(cevap === GEC) agGec = Date.now();
    /* Parça isteği (video) çevrimdışıyken dosyanın tamamıyla karşılanır;
       tarayıcı 200 cevabını da oynatır. */
    return await eskisi(istek) || await ag;
  }catch(hata){
    const eski = await eskisi(istek);
    if(eski) return eski;
    throw hata;
  }
}

/* İlk açılışta sayfa, kabuk devreye girmeden yüklenir: o dosyalar
   kasaya hiç uğramaz. Sayfa yüklediklerinin adresini gönderir; kasada
   olmayanlar bir kez indirilip saklanır. */
async function doldur(adresler){
  const k = await caches.open(KASA);
  const liste = (Array.isArray(adresler) ? adresler : []).filter(ayniKoken).slice(0, EN_COK);
  for(const adres of liste){
    try{
      if(await k.match(adres)) continue;
      const cevap = await fetch(adres, { cache:'no-store' });
      if(cevap.ok && cevap.status === 200) await k.put(adres, cevap);
    }catch(e){ /* ağ yok ya da dosya yok: sonraki */ }
  }
}

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const adlar = await caches.keys();
    await Promise.all(adlar.filter(a => a.indexOf('lifeos-kabuk-') === 0 && a !== KASA)
      .map(a => caches.delete(a)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if(!ilgili(e.request)) return;
  e.respondWith(agOnce(e.request, e));
});

self.addEventListener('message', e => {
  const d = e.data || {};
  if(d.tur === 'onbellek') e.waitUntil(doldur(d.adresler));
});

/* BİLDİRİM KARTI (katalog 164, brand/ortak/pwa.js). Service worker eylemi
   UYGULAMAZ: açık bir pencere varsa ona iletir (uygulama `lifeos:bildirim`
   olayıyla kendi koduyla karar verir), yoksa uygulamayı bildirimin rotasıyla
   açar. iOS eylem düğmesi göstermez; orada dokunuş yalnız uygulamayı açar. */
self.addEventListener('notificationclick', e => {
  const n = e.notification;
  const d = (n && n.data) || {};
  if(n) n.close();
  const mesaj = { tur:'bildirim', eylem:e.action || 'ac', rota:d.rota || '', modul:d.modul || '' };
  const ad = e.action && d.adlar && d.adlar[e.action];
  if(ad) mesaj.ad = ad;
  e.waitUntil((async () => {
    const pencereler = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    const p = pencereler[0];
    if(p){
      p.postMessage(mesaj);
      if(typeof p.focus === 'function') await p.focus();
      return;
    }
    /* Pencere yok (T2-11): basılan eylem düşmesin diye ADRESE yazılır;
       uygulama açılınca pwa.js `bildirimDinle` onu olay olarak verir ve
       kullanıcıya sorar. Burada yine hiçbir şey uygulanmaz. */
    let adres = self.registration.scope;
    if(e.action){
      const q = new URLSearchParams({ bildirim:e.action });
      if(ad) q.set('ad', ad);
      if(mesaj.modul) q.set('modul', mesaj.modul);
      adres += '?' + q.toString();
    }
    if(self.clients.openWindow) await self.clients.openWindow(adres + (d.rota ? '#' + d.rota : ''));
  })());
});
