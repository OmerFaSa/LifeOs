/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/merkezayar.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* MERKEZ AYARI — Ayarlar › King ve bağlantılar'ın veri katmanı (Gün planı F1).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/merkezayar.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   HKM'nin /api/config ayarlarından yalnız GÖRÜNEN kısım: model paketi, aylık
   tavan, kanal aç-kapa ve modül başına bir eşik. Sözler:
   1. SIR YOK. Anahtar, jeton, sunucu burada okunmaz ve yazılmaz (Atölye'de).
   2. Yama yalnız izinli alanı taşır; aralık dışı değer HKM'ye hiç gitmez.
   3. Ölçülmemiş aylık tutar «veri yok»tur, sıfır değil.
   Kabul testi: tools/merkezayar_kabul_test.py */
window.LIFEOS = window.LIFEOS || {};

LIFEOS.MerkezAyar = (function(){
  'use strict';

  const PAKETLER = ['A', 'A+', 'S', 'S+'];
  const KANALLAR = [['whatsapp', 'WhatsApp'], ['telegram', 'Telegram']];
  const ESIKLER = [['bio', 'sleep_hours_min'], ['academic', 'study_minutes_min'], ['intellect', 'practice_minutes_min']];
  const TAVAN = { usd:[0, 5000], try:[0, 100000] };
  const sayi = v => typeof v === 'number' && isFinite(v);
  const nesne = v => v && typeof v === 'object' ? v : {};

  function gorunum(cfg, paketler){
    cfg = nesne(cfg);
    const p = nesne(paketler), b = nesne(cfg.budget), birim = b.ceiling_currency === 'try' ? 'try' : 'usd';
    const deger = birim === 'try' ? b.monthly_try : b.monthly_usd;
    const th = nesne(cfg.thresholds), ar = nesne(cfg.ranges), ad = nesne(cfg.threshold_names);
    return {
      paket:{ secili:p.aktif || null, liste:(Array.isArray(p.paketler) ? p.paketler : []).map(x => ({
        id:x.id, ad:x.ad, aylik:sayi(x.aylik) ? x.aylik : null, etiket:sayi(x.aylik) ? 'tahmin' : 'veri yok' })) },
      tavan:{ birim, deger:sayi(deger) ? deger : null },
      kanallar:KANALLAR.map(([k, baslik]) => { const c = nesne(nesne(cfg.channels)[k]);
        return { ad:k, baslik, acik:c.enabled === true, hazir:c.ready === true }; }),
      esikler:ESIKLER.filter(([g, a]) => sayi(nesne(th[g])[a]) && Array.isArray(nesne(ar[g])[a])).map(([g, a]) => ({
        grup:g, ad:a, etiket:nesne(ad[g])[a] || a, deger:th[g][a], min:ar[g][a][0], max:ar[g][a][1] })),
    };
  }

  /* AYARLAR › MERKEZ (Gün planı, 2026-11-03: «HKM'yi komple kaldır, ayarlara taşı»).
     HKM'nin eski Ayarlar ekranının bütün ayarları, açık bir şemayla: yalnız şemadaki
     alan yazılabilir; tür burada, aralık ve anlam HKM'de denetlenir (422 iletilir).
     Sır (jeton, anahtar) okunmaz: yalnız «kurulu» bilgisi; yazmak yeni değer yollar.
     Alan: [yol, ad, tür, not, ek] — tür: bool, sayi, metin, saat, secim, liste, sir. */
  const GUNLER = [['', 'Kapalı'], ['pazartesi', 'Pazartesi'], ['sali', 'Salı'], ['carsamba', 'Çarşamba'], ['persembe', 'Perşembe'],
    ['cuma', 'Cuma'], ['cumartesi', 'Cumartesi'], ['pazar', 'Pazar']];
  const SAGLAYICILAR = [['openrouter', 'OpenRouter'], ['anthropic', 'Anthropic (Claude)'], ['google', 'Google (Gemini)'], ['openai', 'OpenAI']];
  const SEKMELER = [
    { id:'genel', ad:'Genel', gruplar:[
      { ad:'King', alanlar:[
        ['king.kendiliginden', 'Kendiliğinden haber ver', 'bool', 'Kural motoru bir şey görünce King söyler'],
        ['king.sormadan_dusuk', 'Düşük riskli işi sormadan yap', 'bool', 'Orta ve üstü her zaman sorar'] ] },
      { ad:'Aktif kip', alanlar:[
        ['aktif.enabled', 'Merkez kendi turunu atsın', 'bool', 'Belli aralıkla verileri gözden geçirir'],
        ['aktif.aralik_dk', 'Tur aralığı', 'sayi', 'dakika', { min:5, max:1440 }] ] } ] },
    { id:'yz', ad:'Yapay zekâ', gruplar:[
      { ad:'Sağlayıcı anahtarları', not:'Anahtar okunmaz; yalnız kurulu olup olmadığı görünür. Yeni anahtar eskisinin yerine geçer.',
        alanlar:SAGLAYICILAR.map(([id, ad]) => ['models.keys.' + id, ad, 'sir']) },
      { ad:'Bütçe', alanlar:[
        ['budget.usd_try', 'Kur (1 USD kaç TL)', 'sayi', 'TL tavan için; elle girilir', { min:0, max:1000, adim:0.01 }],
        ['budget.stop_at_pct', 'Durdurma eşiği', 'sayi', 'tavanın yüzde kaçında ücretli çağrı durur', { min:10, max:100 }] ] },
      { ad:'Yerel model ve ses', alanlar:[
        ['ollama.kendiligi', 'Ollama bulununca bağlan', 'bool'],
        ['ollama.sicak', 'Yerel model hazır beklesin', 'bool', 'Bellekte sıcak tutar; 8 GB’ta dikkat'],
        ['ses.gemini_ses', 'Gemini sesi', 'metin', 'ör. Kore'] ] },
      { ad:'Web araması', alanlar:[
        ['web.acik', 'King web’de arayabilsin', 'bool'],
        ['web.gunluk_sinir', 'Günlük arama sınırı', 'sayi', '', { min:0, max:10000 }] ] } ] },
    { id:'kanallar', ad:'Kanallar', gruplar:[
      { ad:'WhatsApp', alanlar:[
        ['channels.whatsapp.enabled', 'Açık', 'bool'],
        ['channels.whatsapp.phone_number_id', 'Telefon numarası kimliği', 'metin'],
        ['channels.whatsapp.token', 'Erişim jetonu', 'sir'],
        ['channels.whatsapp.app_secret', 'Uygulama sırrı', 'sir'],
        ['channels.whatsapp.verify_token', 'Doğrulama jetonu', 'sir'],
        ['channels.whatsapp.allow_from', 'İzinli numaralar', 'liste', 'virgülle ayır'] ] },
      { ad:'Telegram', alanlar:[
        ['channels.telegram.enabled', 'Açık', 'bool'],
        ['channels.telegram.bot_token', 'Bot jetonu', 'sir'],
        ['channels.telegram.webhook_secret', 'Webhook sırrı', 'sir'],
        ['channels.telegram.polling', 'Yoklama (webhook yerine)', 'bool'],
        ['channels.telegram.allow_from', 'İzinli kullanıcılar', 'liste', 'virgülle ayır'] ] } ] },
    { id:'zaman', ad:'Zamanlama', gruplar:[
      { ad:'Mesajlar', alanlar:[
        ['schedule.enabled', 'Zamanlanmış mesajlar', 'bool'],
        ['schedule.channel', 'Kanal', 'secim', '', { secenek:[['', 'Açık olan'], ['whatsapp', 'WhatsApp'], ['telegram', 'Telegram']] }],
        ['schedule.morning', 'Sabah', 'saat'], ['schedule.evening', 'Akşam', 'saat'], ['schedule.checkin', 'Gün içi yoklama', 'saat'],
        ['schedule.weekly_day', 'Haftalık rapor günü', 'secim', '', { secenek:GUNLER }], ['schedule.weekly_time', 'Haftalık rapor saati', 'saat'],
        ['schedule.monthly', 'Aylık rapor', 'bool'], ['schedule.tolerance_minutes', 'Hoşgörü', 'sayi', 'dakika', { min:0, max:720 }] ] },
      { ad:'Bakım', alanlar:[
        ['schedule.maintenance', 'Gece bakımı', 'bool'], ['schedule.maintenance_time', 'Bakım saati', 'saat'],
        ['schedule.keep_days', 'Kayıt saklama', 'sayi', 'gün', { min:7, max:3650 }] ] } ] },
    { id:'bildirim', ad:'Bildirim', gruplar:[
      { ad:'Sessiz saatler ve sınırlar', alanlar:[
        ['bildirim.sessiz_bas', 'Sessiz başlangıç', 'saat'], ['bildirim.sessiz_bit', 'Sessiz bitiş', 'saat'],
        ['bildirim.gunluk_en_cok', 'Günde en çok', 'sayi', '0 = sınırsız', { min:0, max:100 }],
        ['bildirim.teklif_omru_gun', 'Önerinin ömrü', 'sayi', 'gün', { min:1, max:60 }],
        ['bildirim.yarin', 'Akşam «yarın şunlar var»', 'bool'] ] } ] },
  ];
  const SAAT_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const al = (o, yol) => yol.split('.').reduce((x, k) => (x && typeof x === 'object' ? x[k] : undefined), o);
  function alanBul(yol, cfg){
    for(const s of SEKMELER) for(const g of s.gruplar) for(const a of g.alanlar) if(a[0] === yol) return a;
    if(/^thresholds\.[a-z]+\.[a-z_]+$/.test(yol)){
      const p = yol.split('.'), r = nesne(nesne(nesne(cfg).ranges)[p[1]])[p[2]];
      if(Array.isArray(r)) return [yol, p[2], 'sayi', '', { min:r[0], max:r[1] }];
    }
    return null;
  }
  /* Saf: sekmeler ve şu anki değerler (sır yalnız «kurulu» ve son iki işaret). */
  function sekmeler(cfg){
    cfg = nesne(cfg);
    const deger = yol => {
      if(/^models\.keys\./.test(yol)){ const p = (nesne(cfg.models).providers || []).find(x => x && x.id === yol.split('.')[2]) || {};
        return { kurulu:!!p.key_set, ipucu:p.key_set ? String(p.key_hint || '').slice(-2) : '' }; }
      const v = al(cfg, yol);
      if(v && typeof v === 'object' && !Array.isArray(v) && 'set' in v) return { kurulu:!!v.set, ipucu:v.set ? String(v.value || '').slice(-2) : '' };
      return v === undefined ? null : v;
    };
    const ad = nesne(cfg.threshold_names), ar = nesne(cfg.ranges);
    const esik = { id:'esikler', ad:'Eşikler', gruplar:Object.keys(ar).map(g => ({ ad:{ bio:'Sağlık', academic:'Sınav', intellect:'Gelişim' }[g] || g,
      alanlar:Object.keys(nesne(ar[g])).map(a => ['thresholds.' + g + '.' + a, nesne(ad[g])[a] || a, 'sayi', '', { min:ar[g][a][0], max:ar[g][a][1] }]) })) };
    return SEKMELER.concat(Object.keys(ar).length ? [esik] : []).map(s => ({ id:s.id, ad:s.ad, gruplar:s.gruplar.map(g => ({ ad:g.ad, not:g.not || '',
      alanlar:g.alanlar.map(a => Object.assign({ yol:a[0], ad:a[1], tur:a[2], not:a[3] || '', deger:deger(a[0]) }, a[4] || {})) })) }));
  }
  /* Saf: bir alanın yaması. Şemada olmayan yol yazılmaz. */
  function alanYama(yol, deger, cfg){
    const a = alanBul(String(yol || ''), cfg);
    if(!a) return { ok:false, hata:'Bu ayar buradan değiştirilmez.' };
    const ad = a[1], tur = a[2], s = a[4] || {};
    let v = deger;
    if(tur === 'bool'){ if(typeof v !== 'boolean') return { ok:false, hata:ad + ': açık ya da kapalı olmalı.' }; }
    else if(tur === 'sayi'){ if(!sayi(v) || (s.min != null && v < s.min) || (s.max != null && v > s.max))
      return { ok:false, hata:ad + (s.min != null ? ' ' + s.min + '–' + s.max + ' arasında' : '') + ' bir sayı olmalı.' }; }
    else if(tur === 'saat'){ if(typeof v !== 'string' || (v && !SAAT_RE.test(v))) return { ok:false, hata:ad + ' SS:DD biçiminde olmalı.' }; }
    else if(tur === 'secim'){ if(!(s.secenek || []).some(x => x[0] === v)) return { ok:false, hata:ad + ': bilinmeyen seçim.' }; }
    else if(tur === 'liste'){ if(typeof v === 'string') v = v.split(',').map(x => x.trim()).filter(Boolean);
      if(!Array.isArray(v) || v.some(x => typeof x !== 'string')) return { ok:false, hata:ad + ': virgülle ayrılmış liste olmalı.' }; }
    else if(tur === 'sir'){ if(typeof v !== 'string' || !v.trim() || v.length > 400) return { ok:false, hata:ad + ': boş olamaz.' }; v = v.trim(); }
    else if(typeof v !== 'string' || v.length > 200) return { ok:false, hata:ad + ' bir metin olmalı.' };
    const p = {}; let o = p; const k = a[0].split('.');
    k.slice(0, -1).forEach(x => { o[x] = {}; o = o[x]; });
    o[k[k.length - 1]] = v;
    return { ok:true, yama:p };
  }

  function yama(d, cfg){
    d = nesne(d);
    const red = hata => ({ ok:false, hata });
    if(d.tur === 'paket') return PAKETLER.indexOf(d.deger) >= 0 ? { ok:true, yama:{ models:{ paket:d.deger } } } : red('Bilinmeyen model paketi.');
    if(d.tur === 'tavan'){
      const s = TAVAN[d.birim];
      if(!s) return red('Para birimi USD ya da TL olmalı.');
      if(!sayi(d.deger) || d.deger < s[0] || d.deger > s[1]) return red('Aylık tavan ' + s[0] + '–' + s[1] + ' arasında bir sayı olmalı.');
      return { ok:true, yama:{ budget:{ ceiling_currency:d.birim, [d.birim === 'try' ? 'monthly_try' : 'monthly_usd']:d.deger } } };
    }
    if(d.tur === 'kanal'){
      if(!KANALLAR.some(([k]) => k === d.ad)) return red('Bilinmeyen kanal.');
      if(typeof d.acik !== 'boolean') return red('Kanal açık ya da kapalı olmalı.');
      return { ok:true, yama:{ channels:{ [d.ad]:{ enabled:d.acik } } } };
    }
    if(d.tur === 'esik'){
      const r = nesne(nesne(nesne(cfg).ranges)[d.grup])[d.ad];
      if(!Array.isArray(r)) return red('Bilinmeyen eşik.');
      if(!sayi(d.deger) || d.deger < r[0] || d.deger > r[1]) return red('Eşik ' + r[0] + '–' + r[1] + ' arasında olmalı.');
      return { ok:true, yama:{ thresholds:{ [d.grup]:{ [d.ad]:d.deger } } } };
    }
    return red('Bu ayar buradan değiştirilmez.');
  }

  function kur(ortam){
    ortam = ortam || {};
    let son = null;
    function baglanti(){
      const b = ortam.hkm ? ortam.hkm() : null;
      if(!b || typeof b.settings !== 'function') return null;
      const a = b.settings() || {};
      if(!a.enabled || !a.token || !(b.urlOk ? b.urlOk(a.url) : a.url)) return null;
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      return f ? { url:String(a.url).replace(/\/$/, ''), token:a.token, f } : null;
    }
    async function istek(k, yol, govde){
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), 4000) : null;
      try{
        const f = k.f;                       // yöntem olarak çağrılmaz («Illegal invocation»)
        const res = await f(k.url + yol, {
          method:govde === undefined ? 'GET' : 'POST',
          headers:Object.assign({ 'Authorization':'Bearer ' + k.token }, govde === undefined ? {} : { 'Content-Type':'application/json' }),
          body:govde === undefined ? undefined : JSON.stringify(govde),
          signal:ctrl ? ctrl.signal : undefined,
        });
        let veri = null;
        try{ veri = await res.json(); }catch(e){ /* gövdesiz */ }
        return { durum:res.status, veri };
      }finally{
        if(t) clearTimeout(t);
      }
    }
    async function oku(){
      const k = baglanti();
      if(!k) return { ok:false, neden:'baglanti' };
      try{
        const [c, p] = await Promise.all([istek(k, '/api/config'), istek(k, '/api/models/paketler')]);
        if(c.durum !== 200 || p.durum !== 200) return { ok:false, neden:'hata' };
        son = c.veri;
        return { ok:true, cfg:c.veri, paketler:p.veri, gorunum:gorunum(c.veri, p.veri) };
      }catch(e){
        return { ok:false, neden:'hata' };
      }
    }
    async function yaz(d){
      const y = d && d.tur === 'alan' ? alanYama(d.yol, d.deger, son || {}) : yama(d, son || {});
      if(!y.ok) return y;
      const k = baglanti();
      if(!k) return { ok:false, neden:'baglanti' };
      try{
        const r = await istek(k, '/api/config', y.yama);
        if(r.durum === 200) return { ok:true };
        if(r.durum === 422) return { ok:false, hata:(nesne(r.veri).errors || []).join('; ') || 'Merkez değeri kabul etmedi.' };
        return { ok:false, neden:'hata' };
      }catch(e){
        return { ok:false, neden:'hata' };
      }
    }
    return { oku, yaz };
  }

  return { gorunum, yama, sekmeler, alanYama, kur };
})();
