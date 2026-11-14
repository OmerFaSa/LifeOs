/* King MCP köprüsü: Python sunucusu (king/mcp.py) motorları buradan ÇAĞIRIR, kopyalamaz (AGENTS §0.1 kural 3).
 * Girdi stdin'de tek JSON, çıktı stdout'ta tek JSON. Saat ve veri dışarıdan gelir; bu dosya hiçbir şey yazmaz.
 *   { is:'harita', harita:'<yol>' }                         → { yerler, dallar }
 *   { is:'notlar', zaman, kaynak:{…}, kabuk?:[not], kapali:[], ara?, kimlik?, sinir } → King'in okuyabildiği notlar (kingOkur)
 *   { is:'tekrar', simdi, gunSonu, kartlar:{ays:[], esp:[]}, kabuk?:[kart] } → Tekrar.plan özeti
 *   kabuk: yeni kabuğun tek depodaki kayıtları (motorun kendi biçimi; göç bağdaştırıcısından geçmez, doğrulanır). */
'use strict';
const path = require('path');
const KOK = path.resolve(__dirname, '..');

function harita(g) {
  const H = require(path.resolve(g.harita));
  return { yerler: H.YERLER.map(y => ({ id: y.id, ad: y.ad, katman: y.katman, dal: y.dal, durum: y.durum,
    aciklama: y.aciklama, halkada: !!y.halka, eskiYer: y.eski ? true : undefined })), dallar: H.DALLAR };
}

function notlar(g) {
  const N = require(path.join(KOK, 'motor', 'not.js'));
  const k = g.kaynak || {}, z = g.zaman, tum = [], raporlar = [];
  const al = r => { tum.push(...r.notlar); raporlar.push({ yapi: r.rapor.yapi, sayi: r.rapor.sayi, reddedilen: r.rapor.reddedilen.length }); };
  for (const [ad, yapi] of [['defter', 'defter'], ['terim', 'terim'], ['notum', 'notum']])
    for (const modul of Object.keys(k[ad] || {})) al(N.goc[yapi](k[ad][modul], { zaman: z, modul }));
  for (const yapi of ['aysKonu', 'aysVideo', 'espNot', 'espTez', 'espTaslak']) if ((k[yapi] || []).length) al(N.goc[yapi](k[yapi], { zaman: z }));
  for (const b of k.bilinc || []) al(N.goc.bilinc(b, { zaman: z }));
  // yeni kabuğun notları: motorun kendi kaydı. Geçersiz olan ve eski yapılardan aynı kimlikle gelmiş olan alınmaz.
  const gorulen = new Set(tum.map(n => n.id)), kabuk = (g.kabuk || []).filter(n => n && !N.dogrula(n) && !gorulen.has(n.id));
  tum.push(...kabuk); raporlar.push({ yapi: 'kabuk', sayi: kabuk.length, reddedilen: (g.kabuk || []).length - kabuk.length });
  const okur = N.kingOkur(tum, { kapaliKlasorler: g.kapali || [] });
  const kisa = n => ({ kimlik: n.id, baslik: n.baslik, tur: n.tur, klasor: n.klasor, alan: n.alan, etiketler: n.etiketler,
    guncelleme: n.guncelleme, kaynak: n.kaynak && n.kaynak.yapi });
  const sonuc = { toplam: tum.length, okunur: okur.length, disarida: tum.length - okur.length, raporlar };
  if (g.kimlik) {
    const n = okur.find(x => x.id === g.kimlik);
    sonuc.not = n ? Object.assign(kisa(n), { govde: n.govde, ozellik: n.ozellik }) : null;
    sonuc.kapali = !n && tum.some(x => x.id === g.kimlik);
  } else if (g.ara) {
    const bul = new Map(okur.map(n => [n.id, n]));
    sonuc.bulunan = N.ara(okur, g.ara, { sinir: g.sinir }).map(x => Object.assign(kisa(bul.get(x.id)), { parca: x.parca }));
  } else {
    sonuc.bulunan = okur.slice().sort((a, b) => (b.guncelleme || 0) - (a.guncelleme || 0)).slice(0, g.sinir).map(kisa);
  }
  return sonuc;
}

function tekrar(g) {
  const T = require(path.join(KOK, 'motor', 'tekrar.js'));
  const kartlar = [], k = g.kartlar || {};
  let okunamayan = 0;
  for (const [modul, cevir] of [['ays', T.GOC.aysKart], ['esp', T.GOC.espKart]])
    for (const c of k[modul] || []) { const x = cevir(c); if (x) kartlar.push(x); else okunamayan++; }
  for (const c of g.kabuk || []) { if (c && typeof c.id === 'string' && c.durum) kartlar.push(c); else okunamayan++; }   // yeni kabuğun kartları: motorun kendi biçimi
  const p = T.plan(kartlar, g.simdi, { gunSonu: g.gunSonu });
  const vadeler = kartlar.map(x => x.sonraki).filter(v => v != null && v > g.gunSonu).sort((a, b) => a - b);
  return { toplam: kartlar.length, okunamayan, bugunTekrar: p.tekrar.length, bugunYeni: p.yeni.length,
    bekleyenTekrar: p.bekleyen.tekrar, bekleyenYeni: p.bekleyen.yeni, disarida: p.disarida.length,
    siradakiVade: vadeler.length ? vadeler[0] : null,
    bugun: p.tekrar.concat(p.yeni).slice(0, 20).map(x => ({ kimlik: x.id, on: x.on, durum: x.durum, vade: x.sonraki })) };
}

let girdi = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { girdi += d; });
process.stdin.on('end', () => {
  try {
    const g = JSON.parse(girdi), is = { harita, notlar, tekrar }[g.is];
    if (!is) throw new Error('bilinmeyen iş: ' + g.is);
    process.stdout.write(JSON.stringify({ tamam: is(g) }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ hata: String(e && e.message || e) }));
  }
});
