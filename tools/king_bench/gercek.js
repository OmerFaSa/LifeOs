// Gerçeklik denetimi (simülasyon kalitesi): her mesajdan önce ve sonra modül verisinin parmak izi.
// King «ekledim» deyip hiçbir şey değişmediyse, ya da cümledeki sayı önizlemede yoksa yakalanır.
// UI yolu: mesaj King kutusuna gerçekten yazılır, Enter'a basılır; onay da kutuya «evet» yazılarak verilir.

const IZ = () => {
  const m = LIFEOS.KING_IC.ayar.modul;
  const S = ({ ays:window.R, spi:window.SP, esp:window.ESP })[m].S;
  const out = {};
  const say = (ad, v) => { if(Array.isArray(v)) out[ad] = v.length; else if(v && typeof v === 'object') out[ad] = Object.keys(v).length; };
  Object.keys(S).forEach(k => { if(k !== 'ui' && k !== 'cache') say(k, S[k]); });
  // Günlük kayıtların içi: oturum, blok sorusu, ölçüm alanları
  const gunler = S.days || {};
  let oturum = 0, soru = 0, dk = 0;
  Object.values(gunler).forEach(d => {
    if(!d) return;
    oturum += (d.sessions || []).length;
    soru += (d.blocks || []).reduce((s, b) => s + (Number(b.actualQ) || 0), 0) + (Number(d.freeQ) || 0) + (Number(d.paragraphActual) || 0) + (Number(d.problemActual) || 0);
    dk += (d.blocks || []).reduce((s, b) => s + (b.minCert === 'measured' ? Number(b.actualMin) || 0 : 0), 0) + (Number(d.freeMin) || 0);
  });
  if(m === 'esp') out['gün.oturum'] = oturum;
  if(m === 'ays'){ out['gün.soru'] = soru; out['gün.dk'] = dk; }
  if(m === 'spi'){
    const v = S.vitals || {};
    ['sleep', 'weight', 'water', 'symptomsLogged'].forEach(f => { out['ölçüm.' + f] = Object.values(v).filter(x => x && x[f] != null && x[f] !== false).length; });
    out['öğün'] = Object.values(S.meals || {}).reduce((s, l) => s + (l || []).length, 0);
    out['ilaç.alım'] = Object.values(v).reduce((s, x) => s + ((x && x.medsTaken) || []).length, 0);
  }
  return out;
};

async function izAl(page){ return page.evaluate(`(${IZ.toString()})()`); }
function fark(a, b){ const d = {}; new Set(Object.keys(a).concat(Object.keys(b))).forEach(k => { if((a[k] || 0) !== (b[k] || 0)) d[k] = (b[k] || 0) - (a[k] || 0); }); return d; }

const IDDIA = /(ekledim|kaydettim|kaydedildi|eklendi|uygulandı|işaretlendi|güncelledim|sildim|kartı ekledim|yazdım|ekliyorum)/i;
function denetle(o, onceIz, sonraIz, metin){
  const d = fark(onceIz, sonraIz);
  o.degisim = d;
  const cevap = (o.cevapEvet || '') + ' ' + (o.cevap2 || '') + ' ' + (o.cevap || '');
  o.iddiaBos = IDDIA.test(cevap) && !Object.keys(d).length && !/hatırlat/i.test(cevap);
  const sayilar = (String(metin).match(/\d+(?:[.,]\d+)?/g) || []).filter(n => n.length < 6);
  if(o.onizleme && sayilar.length){
    const on = String(o.onizleme).replace(/\./g, '');
    o.onizlemeKusku = sayilar.filter(n => on.indexOf(n.replace('.', ',')) < 0 && on.indexOf(n) < 0);
    if(!o.onizlemeKusku.length) delete o.onizlemeKusku;
  }
  return o;
}

// UI yolu: kutuya yaz, Enter, cevap bitene kadar bekle.
async function kutuyaYaz(page, metin){
  // Sayfa ziyaretinden sonra King mini açılabiliyor: tam aç; kutu yine yoksa null (çağıran isle yoluna düşer).
  await page.evaluate(() => { try{ if(LIFEOS.KING.miniMi && LIFEOS.KING.miniMi()) LIFEOS.KING.buyut(); if(!LIFEOS.KING.acikMi()) LIFEOS.KING.ac(); }catch(e){} });
  const kutu = await page.waitForSelector('.king__girdi', { timeout:6000, state:'visible' }).catch(() => null);
  if(!kutu) return null;
  const once = await page.evaluate(() => LIFEOS.KING.akis().length);
  await page.fill('.king__girdi', metin);
  await page.press('.king__girdi', 'Enter');
  let son = '', sabit = 0;
  const t0 = Date.now();
  while(Date.now() - t0 < 90000){
    await page.waitForTimeout(250);
    const d = await page.evaluate(n => { const a = LIFEOS.KING.akis().slice(n); return { bek:a.some(x => x.bekliyor), m:a.filter(x => x.kim === 'king').map(x => String(x.metin || '')).join(' ¶ ') }; }, once);
    if(!d.bek && d.m && d.m === son){ if(++sabit >= 3) break; } else sabit = 0;
    son = d.m;
  }
  return son;
}

module.exports = { izAl, fark, denetle, kutuyaYaz, IDDIA };
