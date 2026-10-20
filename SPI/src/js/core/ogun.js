/* ÖĞÜNLERİM — kullanıcının kendi öğün adları ve saatleri.

   Kullanıcı (2026-10-20): «hazır öğün saatleri yerine kendi öğün saatimi
   ve adımı vereyim; ör. Kahvaltı değil Gün başlangıcı».

   Sözler:
     1. ÖĞÜN KİMLİĞİ DEĞİŞMEZ, ADI DEĞİŞİR. Eski kayıtlar `slot` kimliğiyle
        durur; kullanıcı adı ya da saati değiştirince geçmiş kayıt yeni adla
        okunur. Yerleşik altı kimlik (kahvalti, ara1, ogle, ara2, aksam, gece)
        korunur; yeni öğün `o…` kimliği alır.
     2. SİLMEK GEÇMİŞİ SİLMEZ. Silinen öğün seçicilerden kalkar ama `gizli`
        olarak saklanır: o öğünle girilmiş eski kayıt adını kaybetmez.
     3. SAAT KULLANICININDIR. Saat yazılmadıysa kod saat uydurmaz; öğün
        seçimi yazılı saatlere göre yapılır, hiç saat yoksa eski kural
        (günün saatine göre sıra) çalışır.
     4. KAYIT GERİ ALINIR. kaydet() önceki listeyi döndürür.

   Depo: `prefs.ogunler`. SP.MEAL_SLOTS aynı dizi olarak tazelenir: onu
   okuyan bütün ekranlar (öğün kartı, şablon, dünkü) değişmeden yeni adı görür. */

window.SP = window.SP || {};

SP.Ogun = (function(){
  const YERLESIK = [
    { id:'kahvalti', label:'Kahvaltı', icon:'today' },
    { id:'ara1',     label:'Ara öğün', icon:'meal' },
    { id:'ogle',     label:'Öğle',     icon:'meal' },
    { id:'ara2',     label:'İkindi',   icon:'meal' },
    { id:'aksam',    label:'Akşam',    icon:'meal' },
    { id:'gece',     label:'Gece',     icon:'moon' },
  ];
  const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;
  const EN_COK = 10, EN_UZUN = 30;

  const kopya = x => JSON.parse(JSON.stringify(x));
  const dk = s => SAAT.test(s || '') ? Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5)) : null;

  function kayitli(){
    const p = SP.S && SP.S.prefs;
    const l = p && Array.isArray(p.ogunler) && p.ogunler.length ? p.ogunler : null;
    return l ? l : YERLESIK.map(x => Object.assign({ saat:null, gizli:false }, x));
  }
  /* Saati olanlar saate göre; olmayanlar kendi sırasında, saatlilerin arasına
     yerleşik sırasıyla değil liste sırasıyla girer (kullanıcının dizdiği sıra). */
  function sirala(l){
    return l.map((x, i) => ({ x, i })).sort((a, b) => {
      const da = dk(a.x.saat), db = dk(b.x.saat);
      if(da != null && db != null) return da - db || a.i - b.i;
      return a.i - b.i;
    }).map(o => o.x);
  }
  function hepsi(){ return sirala(kayitli()); }
  function liste(){ return hepsi().filter(x => !x.gizli); }
  function bul(id){ return kayitli().find(x => x.id === id) || null; }
  /* «ara» hiçbir zaman bir öğün kimliği olmadı ama hızlı giriş ve öneriler
     onu yazıyordu (kartta «ara» görünüyordu): eski kayıt «Ara öğün» okunur. */
  const ESKI = { ara:'Ara öğün' };
  function ad(id){ const s = bul(id); return s ? s.label : ESKI[id] || (YERLESIK.find(x => x.id === id) || { label:id }).label; }

  /* SP.MEAL_SLOTS'u yerinde tazeler (aynı dizi nesnesi). */
  function yay(){
    if(!Array.isArray(SP.MEAL_SLOTS)) SP.MEAL_SLOTS = [];
    const l = hepsi().map(x => ({ id:x.id, label:x.label, icon:x.icon || 'meal', saat:x.saat || null, gizli:!!x.gizli }));
    SP.MEAL_SLOTS.length = 0;
    l.forEach(x => SP.MEAL_SLOTS.push(x));
    return SP.MEAL_SLOTS;
  }

  /* Şimdiki saate göre öğün: saati yazılı öğünlerden, saatine en yakın
     geçmiş olan (yarım saat önceden de sayılır). Saat yoksa null. */
  function tahmin(simdi){
    const n = simdi || new Date();
    const an = n.getHours() * 60 + n.getMinutes();
    const saatli = liste().filter(x => dk(x.saat) != null);
    if(!saatli.length) return null;
    let sec = null;
    saatli.forEach(x => { if(dk(x.saat) - 30 <= an) sec = x; });
    return (sec || saatli[saatli.length - 1]).id;
  }

  /* Saat yoksa eski kural: günün saatine göre yerleşik sıra (yalnız açık
     öğünlerden; kapatılmışsa ilk açık öğün). */
  function saatKurali(simdi){
    const h = (simdi || new Date()).getHours();
    const id = h < 10 ? 'kahvalti' : h < 12 ? 'ara1' : h < 15 ? 'ogle' : h < 18 ? 'ara2' : h < 22 ? 'aksam' : 'gece';
    const l = liste();
    return l.some(x => x.id === id) ? id : (l[0] ? l[0].id : 'kahvalti');
  }
  /* Şu an girilen öğün hangi dilime yazılır: önce kullanıcının saatleri. */
  function simdiki(simdi){ return tahmin(simdi) || saatKurali(simdi); }

  function dogrula(l){
    const h = [];
    if(!Array.isArray(l)) return ['Öğün listesi bozuk.'];
    const acik = l.filter(x => !x.gizli);
    if(!acik.length) h.push('En az bir öğün kalmalı.');
    if(acik.length > EN_COK) h.push('En çok ' + EN_COK + ' öğün olur.');
    const adlar = {};
    acik.forEach(x => {
      const a = String(x.label || '').trim();
      if(!a) h.push('Öğünün adı boş olamaz.');
      else if(a.length > EN_UZUN) h.push('«' + a.slice(0, 12) + '…» en çok ' + EN_UZUN + ' harf olur.');
      const k = a.toLocaleLowerCase('tr');
      if(a && adlar[k]) h.push('«' + a + '» iki kez yazılmış.');
      adlar[k] = 1;
      if(x.saat && !SAAT.test(x.saat)) h.push('«' + a + '» için saat 00:00–23:59 biçiminde olur.');
    });
    return h;
  }

  function yeni(label, saat){
    return { id:'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      label:String(label || '').trim(), saat:saat || null, icon:'meal', gizli:false };
  }

  /* Kaydet: silinen yerleşik ya da kayıtlı öğün `gizli` kalır (söz 2). */
  async function kaydet(l){
    const once = kopya(kayitli());
    const yeniL = (l || []).map(x => ({ id:String(x.id || yeni().id), label:String(x.label || '').trim(),
      saat:x.saat ? String(x.saat) : null, icon:x.icon || 'meal', gizli:!!x.gizli }));
    once.forEach(x => { if(!yeniL.some(y => y.id === x.id)) yeniL.push(Object.assign({}, x, { gizli:true })); });
    const h = dogrula(yeniL);
    if(h.length) return { ok:false, why:h[0], hatalar:h };
    await SP.Model.savePrefs({ ogunler:yeniL });
    yay();
    return { ok:true, liste:liste(), once };
  }
  async function geriAl(r){
    if(!r || !r.once) return false;
    await SP.Model.savePrefs({ ogunler:r.once });
    yay();
    return true;
  }

  return { YERLESIK, SAAT, liste, hepsi, bul, ad, yay, tahmin, simdiki, saatKurali, dogrula, yeni, kaydet, geriAl, _dk:dk };
})();
