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

   Saklanmayanlar: başka kökenden gelen (HKM, yazı tipi), GET olmayan,
   parça isteği (Range / 206) ve hatalı cevap. Kişisel veri buraya hiç
   girmez: veri tarayıcı deposunda durur, bu kasa yalnız uygulamanın
   dosyalarını (sayfa, kod, görsel) tutar. */

const KASA = 'lifeos-kabuk-v1';
const EN_COK = 400;

function ayniKoken(adres){
  try{ return new URL(adres).origin === self.location.origin; }catch(e){ return false; }
}

function ilgili(istek){
  return istek.method === 'GET' && ayniKoken(istek.url);
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
  try{
    const cevap = await fetch(istek);
    if(saklanir(istek, cevap)) sakla(istek.url, cevap.clone());
    else if(istek.headers.has('range') && cevap.ok) olay.waitUntil(tamaminiSakla(istek.url));
    return cevap;
  }catch(hata){
    /* Parça isteği (video) çevrimdışıyken dosyanın tamamıyla karşılanır;
       tarayıcı 200 cevabını da oynatır. */
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
