/* Token sayacı — "hangi çağrı ne kadar yer tuttu".

   Kota yöneticisi (core/quota.js) İSTEK sayar; bu modül TOKEN sayar. İkisi
   ayrı şeydir ve ayrı işe yarar:

     istek   sağlayıcının rpm/rpd sınırına takılmamak için
     token   neyin şiştiğini görmek ve ücretli katmanda ne tutacağını bilmek

   Ölçüm mü tahmin mi. Sağlayıcı yanıtında token sayısı bildiriyorsa o
   kullanılır (`measured`). Bildirmiyorsa metin uzunluğundan tahmin edilir
   (`estimated`) ve ekranda bu ayrım saklanmaz — tahmini ölçüm gibi
   göstermek, hiç göstermemekten kötüdür.

   Fiyat. `data/providers.js` içindeki `price` alanı ÜCRETLİ katmanın birim
   fiyatıdır. Modellerin çoğu ücretsiz katmanda çalışır ve orada tutar
   sıfırdır; bu yüzden hesaplanan rakam "şu an ödediğin" değil, "ücretli
   katmana geçsen ne tutardı" sayısıdır. Ekran bunu böyle yazar.

   Saklama. Gün gün toplanır, çağrı çağrı değil: 40 haftalık bir programda
   çağrı kaydı tutmak yerel alanı boşuna yer. Son 60 gün saklanır. */

window.R = window.R || {};

R.Usage = (function(){
  const U = R.U;

  const STORE = 'office/usage';
  const KEEP_DAYS = 60;

  /* Türkçe, geniş alfabesi ve ekleriyle çoğu tokenleştiricide karakter
     başına daha çok token üretir. Bu oran kaba bir ortalamadır ve YALNIZCA
     sağlayıcı gerçek sayıyı bildirmediğinde kullanılır. */
  const CHARS_PER_TOKEN = 3.3;

  function estimate(text){
    const n = String(text || '').length;
    return n ? Math.max(1, Math.round(n / CHARS_PER_TOKEN)) : 0;
  }

  /* ---------- depo ---------- */

  function all(){ return (R.S.officeUsage && R.S.officeUsage.days) || {}; }

  function blankDay(date){
    return { date, calls:0, inTok:0, outTok:0, estimated:0, byAgent:{}, byModel:{} };
  }

  function dayOf(date){
    const days = all();
    return days[date] || blankDay(date);
  }

  async function save(){
    const days = all();
    /* Eski gunleri at: 60 gunden oteye bakan bir soru yok. */
    const keys = Object.keys(days).sort();
    while(keys.length > KEEP_DAYS) delete days[keys.shift()];
    R.S.officeUsage = { days };
    await R.Store.set(STORE, R.S.officeUsage);
  }

  async function load(){
    const doc = await R.Store.get(STORE);
    R.S.officeUsage = (doc && doc.days) ? doc : { days:{} };
    return R.S.officeUsage;
  }

  /* ---------- kayit ---------- */

  /* entry: { provider, model, agent, inTok, outTok, measured } */
  async function record(entry){
    if(!entry || (!entry.inTok && !entry.outTok)) return null;
    const date = U.todayISO();
    const days = all();
    const day = days[date] || blankDay(date);

    const inTok = Math.max(0, Math.round(Number(entry.inTok) || 0));
    const outTok = Math.max(0, Math.round(Number(entry.outTok) || 0));

    day.calls += 1;
    day.inTok += inTok;
    day.outTok += outTok;
    if(!entry.measured) day.estimated += 1;

    const agent = entry.agent || 'bilinmiyor';
    const a = day.byAgent[agent] || { calls:0, inTok:0, outTok:0 };
    a.calls += 1; a.inTok += inTok; a.outTok += outTok;
    day.byAgent[agent] = a;

    const modelKey = (entry.provider || '?') + '/' + (entry.model || '?');
    const m = day.byModel[modelKey] || { calls:0, inTok:0, outTok:0 };
    m.calls += 1; m.inTok += inTok; m.outTok += outTok;
    day.byModel[modelKey] = m;

    days[date] = day;
    R.S.officeUsage = { days };
    await save();
    return day;
  }

  /* ---------- okuma ---------- */

  function today(){ return dayOf(U.todayISO()); }

  /* Son n gunun toplami (bugun dahil). */
  function range(n){
    const days = all();
    const out = { calls:0, inTok:0, outTok:0, estimated:0, byAgent:{}, byModel:{}, days:0 };
    const today = U.todayISO();
    Object.keys(days).forEach(date => {
      if(U.diffDays(date, today) >= (n || 30)) return;
      const d = days[date];
      out.days += 1;
      out.calls += d.calls; out.inTok += d.inTok;
      out.outTok += d.outTok; out.estimated += d.estimated || 0;
      ['byAgent', 'byModel'].forEach(bucket => {
        Object.keys(d[bucket] || {}).forEach(k => {
          const src = d[bucket][k];
          const dst = out[bucket][k] || { calls:0, inTok:0, outTok:0 };
          dst.calls += src.calls; dst.inTok += src.inTok; dst.outTok += src.outTok;
          out[bucket][k] = dst;
        });
      });
    });
    return out;
  }

  /* ---------- fiyat ---------- */

  function priceOf(providerId, modelId){
    const p = R.PROVIDERS[providerId];
    if(!p) return null;
    const m = (p.models || []).find(x => x.id === modelId);
    return (m && m.price) ? m.price : null;
  }

  /* Bir model anahtarinin ("saglayici/model") ucretli katmandaki tutari. */
  function costOfModel(modelKey, row){
    const i = String(modelKey).indexOf('/');
    if(i < 0) return null;
    const price = priceOf(modelKey.slice(0, i), modelKey.slice(i + 1));
    if(!price) return null;
    return (row.inTok / 1e6) * price.in + (row.outTok / 1e6) * price.out;
  }

  /* Toplam tutar — fiyati BILINEN modeller uzerinden. Bilinmeyenler ayri
     sayilir ki "eksik hesap" tam hesap sanilmasin. */
  function cost(summary){
    let total = 0, unknown = 0;
    Object.keys(summary.byModel || {}).forEach(k => {
      const c = costOfModel(k, summary.byModel[k]);
      if(c == null) unknown += 1; else total += c;
    });
    return { total, unknown, known:Object.keys(summary.byModel || {}).length - unknown };
  }

  function fmtTokens(n){
    const v = Number(n) || 0;
    if(v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + 'M';
    if(v >= 1000) return (v / 1000).toFixed(1).replace('.', ',') + 'K';
    return String(v);
  }

  /* Kucuk tutarlar 2 basamakta sifir gorunur; 4 basamaga kadar acilir. */
  function fmtCost(usd){
    const v = Number(usd) || 0;
    if(v === 0) return '$0';
    if(v < 0.01) return '<$0,01';
    return '$' + v.toFixed(2).replace('.', ',');
  }

  async function clear(){
    R.S.officeUsage = { days:{} };
    await R.Store.set(STORE, R.S.officeUsage);
  }

  return {
    record, today, range, load, save, clear,
    priceOf, cost, costOfModel, estimate,
    fmtTokens, fmtCost, CHARS_PER_TOKEN, KEEP_DAYS,
  };
})();
