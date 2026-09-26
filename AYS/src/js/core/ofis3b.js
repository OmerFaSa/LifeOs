/* 3B OFIS — yukleyici ve olay baglayicisi (sahne: src/ofis3d/sahne.js).

   Sahne AYS'nin gorsel bir katmanidir; hicbir karari yoktur (AGENTS.md
   §1.3 istisnasi). Buradaki sozler:

     1. ISTEGE BAGLI. Three.js ve sahne tek dosyaya GOMULMEZ: rota.html'in
        yanindaki ofis3d/ klasorunden yalniz Ofis'te 3B acilinca yuklenir.
        Dosya yoksa, WebGL yoksa ya da yukleme hata verirse ekran bugunku
        CSS odasina doner ve bunu soyler. Uygulamanin hicbir parcasi bu
        katmana bagli degildir.
     2. GERCEK OLAY GERCEK, TEMSILI TEMSILI. Sahnede dolasan belge bir AYS
        olayina karsilik gelir: «Masalari tara»da gelen oneri, uzmanin
        masasindaki not, dolan model hakki. Olaysiz dolasma («Canli ofis»,
        elle verilen gorev) ekranda «Temsili:» diye yazilir.
     3. KALICI KOK. AYS her cizimde #app'i yeniden yazar; WebGL baglami bunu
        kaldiramaz. Sahnenin koku bir kez kurulur ve her cizimden sonra
        yuvasina TASINIR. Ekran degisince cizim dongusu kendiliginden durur.
     4. OTOMASYONDA KENDILIGINDEN ACILMAZ. Tarayici otomasyonunda WebGL
        yazilimla cizilir (saniyede ~2 kare) ve oteki olcumleri bozar;
        orada sahne yalniz acikca istenince acilir (tools/smoke.js akisi). */

window.R = window.R || {};

R.Ofis3B = (function(){
  const DEPO = 'rota.ofis3b';
  const KUYRUK_EN_COK = 3;
  /* Sahnedeki masa sirasi -> AYS ajani. 4 patron masasidir (sahnede sabit). */
  const SIRA = ['tyt', 'ayt', 'rehber', 'analist', 'patron', 'koc'];

  const durum = { kok:null, api:null, yukleniyor:null, hata:null, istendi:false,
    kuyruk:[], gorulen:{}, gun:null, sayac:null, toplantiyaGit:null, bekliyor:false };

  /* Dosya koku: dist/ ve src/ icin «ofis3d/», test sayfasi «../ofis3d/». */
  let KOK = 'ofis3d/';

  function sira(agentId){ return SIRA.indexOf(agentId); }
  function ajan(i){ return R.AGENT_BY_ID && R.AGENT_BY_ID[SIRA[i]]; }
  function adlar(){ return SIRA.map(id => (R.AGENT_BY_ID[id] || {}).name || id); }

  let webgl = null;
  function destek(){
    if(webgl !== null) return webgl;
    try{
      const c = document.createElement('canvas');
      webgl = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    }catch(e){ webgl = false; }
    return webgl;
  }
  function otomasyon(){ return !!(navigator && navigator.webdriver); }

  /* Ofis ekrani bunu sorar: canli sahne mi, CSS odasi mi. */
  function kullanilir(){
    const O = R.Office;
    if(O && O.settings().sahne3b === 'hafif') return false;
    if(durum.hata || !destek()) return false;
    return !otomasyon() || durum.istendi;
  }

  function okuDepo(){
    try{ return JSON.parse(localStorage.getItem(DEPO) || 'null'); }catch(e){ return null; }
  }
  function yazDepo(v){
    try{ localStorage.setItem(DEPO, JSON.stringify(v)); }catch(e){ /* depo kapali: sahne yine calisir */ }
  }

  function betik(src){
    return new Promise((ok, ret) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => ok();
      s.onerror = () => ret(new Error(src + ' yüklenemedi'));
      document.head.appendChild(s);
    });
  }

  function yukle(){
    if(window.RotaOfis3B) return Promise.resolve();
    if(durum.yukleniyor) return durum.yukleniyor;
    durum.yukleniyor = (window.THREE ? Promise.resolve() : betik(KOK + 'three-0.160.1.min.js'))
      .then(() => betik(KOK + 'sahne.js'))
      .catch(e => { durum.hata = 'Canlı 3B ofis dosyaları bulunamadı (ofis3d/); hafif görünüm gösteriliyor.'; throw e; });
    return durum.yukleniyor;
  }

  /* ---------- kalici kok ---------- */

  function kokHtml(){
    const K = R.C, { html, raw } = R.h;
    const b = (label, data, extra) => K.Button(Object.assign({ label, size:'sm', data }, extra || {}));
    const ib = (icon, aria, data) => K.IconButton({ icon, size:'sm', aria, title:aria, data });
    const ad = adlar();
    const secenek = (sec) => ad.map((a, i) => html`<option value="${i}" ${i === sec ? raw('selected') : ''}>${a}</option>`);
    return String(html`
      <div class="ofis3b__arac">
        <div class="row wrap gap-6">
          ${b('Çapraz', { 'data-view':'angle', 'aria-pressed':'true' })}
          ${b('Üstten', { 'data-view':'top', 'aria-pressed':'false' })}
          ${b('Gece görünümü', { 'data-night':'', 'aria-pressed':'false' })}
        </div>
        <div class="row wrap gap-6">
          ${ib('minus', 'Uzaklaş', { 'data-zoom':'out' })}
          ${ib('plus', 'Yakınlaş', { 'data-zoom':'in' })}
          ${ib('left', 'Kamerayı sola döndür', { 'data-turn':'left' })}
          ${ib('right', 'Kamerayı sağa döndür', { 'data-turn':'right' })}
        </div>
      </div>
      <div class="office-view ofis3b__sahne" role="img"
        aria-label="Döndürülebilen üç boyutlu ofis: Patron ve beş uzmanın masaları, arşiv odası, dinlenme salonu ve toplantı odası. Masalara aşağıdaki düğmelerle de ulaşılır."></div>
      <p class="small ofis3b__olay" data-olay aria-live="polite"></p>
      <p class="tiny dim ofis3b__durum" data-status aria-live="polite">Ekip masasında.</p>
      <button type="button" hidden data-meeting>Toplantıyı başlat</button>
      <details class="ofis3b__detay">
        <summary class="small">Sahne ayarları</summary>
        <div class="row wrap gap-6 mt-8">
          ${b('Patron’un odası', { 'data-boss':'', 'aria-pressed':'false' })}
          ${b('Arşiv odası', { 'data-area':'archive', 'aria-pressed':'false' })}
          ${b('Dinlenme salonu', { 'data-area':'phone', 'aria-pressed':'false' })}
          ${b('Toplantı odası', { 'data-area':'meeting', 'aria-pressed':'false' })}
          ${b('Hareketi durdur', { 'data-motion':'', 'aria-pressed':'true' })}
        </div>
        <div class="row wrap gap-10 mt-8">
          <label class="check"><input type="checkbox" data-walls checked/><span>Duvarları göster</span></label>
          <label class="check"><input type="checkbox" data-follow/><span>Yürüyeni takip et</span></label>
          <label class="check"><input type="checkbox" data-call/><span>Telefon görüşmesi</span></label>
          <label class="check"><input type="checkbox" data-auto/><span>Canlı ofis (temsili görevler)</span></label>
        </div>
        <p class="tiny dim mt-8">Temsili görev bir AYS olayına karşılık gelmez; ekranda «Temsili:» diye yazılır.</p>
        <div class="ofis3b__gorev mt-8">
          <label class="small">Kim<select class="select input--sm" data-actor>${secenek(0)}</select></label>
          <label class="small">Ne<select class="select input--sm" data-job>
            <option value="deliver">Belge götür</option>
            <option value="archive">Arşivden dosya al</option>
            <option value="break">Mola ver</option></select></label>
          <label class="small">Kime<select class="select input--sm" data-recipient>${secenek(4)}</select></label>
          <label class="small">Hız<select class="select input--sm" data-speed>
            <option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
          ${b('Temsili görevi başlat', { 'data-run':'' })}
        </div>
        <div class="row wrap gap-6 mt-10">
          ${K.Button({ label:'Hafif görünüme geç', size:'sm', tone:'ghost', act:'office-sahne', data:{ 'data-mod':'hafif' } })}
        </div>
      </details>`);
  }

  function olayYaz(metin){
    const el = durum.kok && durum.kok.querySelector('[data-olay]');
    if(el) el.textContent = metin || '';
  }

  function kur(){
    if(durum.api || durum.hata) return;
    const kok = document.createElement('div');
    kok.className = 'ofis3b';
    kok.innerHTML = kokHtml();
    durum.kok = kok;
    const kayit = okuDepo();
    const saat = new Date().getHours();
    const api = window.RotaOfis3B.kur(kok, {
      adlar:adlar(),
      durum:kayit,
      gece:saat >= 20 || saat < 7,
      kaydet:v => yazDepo(v),
      secildi:i => {
        const a = ajan(i);
        if(!a) return;
        R.S.ui.officeDesk = R.S.ui.officeDesk === a.id ? null : a.id;
        R.App.render();
      },
      bitti:b => bitti(b),
    });
    if(!api || !api.ok){
      durum.hata = (api && api.why) || 'Canlı 3B ofis açılamadı; hafif görünüm gösteriliyor.';
      durum.kok = null;
      return;
    }
    durum.api = api;
    api.koyu(koyuMu());
  }

  function koyuMu(){
    const t = document.documentElement.getAttribute('data-theme');
    if(t) return t === 'dark';
    try{ return matchMedia('(prefers-color-scheme: dark)').matches; }catch(e){ return false; }
  }

  /* ---------- olaylar ---------- */

  function bugun(){ return R.U.todayISO(); }
  function gunuYenile(){
    if(durum.gun !== bugun()){ durum.gun = bugun(); durum.gorulen = {}; }
  }

  /* {tur:'deliver'|'break'|'archive', kim, kime, metin} — tekrarlar ve
     tasma reddedilir; kuyruk kisadir, cunku eski bir olayi dakikalar sonra
     canlandirmak onu simdiki gibi gostermek olurdu. */
  function ekle(o){
    gunuYenile();
    if(o.anahtar && durum.gorulen[o.anahtar]) return false;
    if(durum.kuyruk.length >= KUYRUK_EN_COK) return false;
    if(o.kim < 0 || (o.tur === 'deliver' && (o.kime < 0 || o.kime === o.kim))) return false;
    if(o.anahtar) durum.gorulen[o.anahtar] = true;
    durum.kuyruk.push(o);
    return true;
  }

  function isle(){
    const api = durum.api;
    if(!api || !durum.kok || !durum.kok.isConnected){ durdur(); return; }
    if(api.mesgul() || !durum.kuyruk.length) return;
    const o = durum.kuyruk.shift();
    if(api.gorev(o.tur, o.kim, o.kime)) olayYaz(o.metin);
    else durum.kuyruk.unshift(o);
  }

  function baslat(){
    if(durum.sayac) return;
    durum.sayac = setInterval(isle, 700);
  }
  function durdur(){
    if(durum.sayac){ clearInterval(durum.sayac); durum.sayac = null; }
  }

  function bitti(b){
    if(b.tur === 'toplanti' && b.durum === 'seated' && durum.toplantiyaGit){
      const git = durum.toplantiyaGit; durum.toplantiyaGit = null;
      git();
      return;
    }
    if(!durum.kuyruk.length && !(b && b.temsili)) setTimeout(() => {
      if(durum.api && !durum.api.mesgul() && !durum.kuyruk.length) olayYaz('');
    }, 4000);
  }

  /* Masalardaki notlar: her not gunde bir kez, uzman -> Patron. */
  function notlariTara(){
    const O = R.Office;
    if(!O || !O.notes) return 0;
    let n = 0;
    for(const not of O.notes()){
      if(not.agent === 'patron') continue;
      const i = sira(not.agent);
      if(ekle({ tur:'deliver', kim:i, kime:sira('patron'), anahtar:'not:' + not.id,
        metin:not.name + ' masasındaki notu Patron’a götürüyor: ' + kisalt(not.text) })) n++;
    }
    return n;
  }

  /* Gunluk model hakki dolan uzman dinlenme salonuna gider (gunde bir kez). */
  function hakTara(){
    const O = R.Office;
    if(!O || O.mode() !== 'llm' || !O.agentQuota) return;
    for(const a of R.AGENTS){
      if(a.lead) continue;
      const q = O.agentQuota(a.id);
      if(q && q.full) ekle({ tur:'break', kim:sira(a.id), anahtar:'hak:' + a.id,
        metin:a.name + ' bugünkü model hakkını doldurdu; yarına kadar kural motoruyla çalışıyor.' });
    }
  }

  function kisalt(t){
    const s = String(t || '').replace(/\s+/g, ' ').trim();
    return s.length > 90 ? s.slice(0, 89) + '…' : s;
  }

  /* «Masaları tara» sonucu: gelen her öneri, onu yazan uzmanın Patron'a
     götürdüğü bir belgedir. */
  function oneriler(eklenen){
    let n = 0;
    for(const p of eklenen || []){
      const i = sira(p.agent);
      if(i < 0 || p.agent === 'patron') continue;
      const a = R.AGENT_BY_ID[p.agent];
      if(ekle({ tur:'deliver', kim:i, kime:sira('patron'), anahtar:'oneri:' + (p.id || i),
        metin:(a ? a.name : 'Bir uzman') + ' önerisini Patron’a götürüyor; onayın Ofis’te bekliyor.' })) n++;
    }
    return n;
  }

  /* Toplanti: ekip toplanti odasina yurur, oturunca gercek toplanti ekrani
     acilir. Hareket azaltilmissa ya da sahne mesgulse beklemeden gidilir. */
  function toplantiyaGotur(git){
    const api = durum.api;
    let azHareket = false;
    try{ azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    if(!api || !durum.kok || !durum.kok.isConnected || azHareket || api.mesgul()){ git(); return false; }
    durum.kuyruk.length = 0;
    api.hiz(4);
    if(!api.toplanti(true)){ git(); return false; }
    olayYaz('Ekip toplantı odasına geçiyor…');
    let gitti = false;
    const bir = () => { if(gitti) return; gitti = true; durum.toplantiyaGit = null; api.hiz(1); git(); };
    durum.toplantiyaGit = bir;
    setTimeout(bir, 9000);
    return true;
  }

  /* ---------- ekrana yerlestirme ---------- */

  /* Ofis ekrani her cizimden sonra cagirir. `yuva` yoksa bir sey yapmaz. */
  function yerlestir(yuva){
    if(!yuva) { durdur(); return; }
    if(!window.RotaOfis3B){
      yuva.innerHTML = '<p class="small muted ofis3b__bekle">Canlı 3B ofis yükleniyor…</p>';
      if(!durum.bekliyor){
        durum.bekliyor = true;
        const sonra = () => {
          durum.bekliyor = false;
          /* Dosya geldi ama sahne tanimlanmadiysa bir daha denenmez. */
          if(!window.RotaOfis3B && !durum.hata) durum.hata = 'Canlı 3B ofis açılamadı; hafif görünüm gösteriliyor.';
          R.App.render();
        };
        yukle().then(sonra, sonra);
      }
      return;
    }
    if(!durum.api && !durum.hata) kur();
    if(!durum.api){ R.App.render(); return; }
    yuva.replaceChildren(durum.kok);
    durum.api.koyu(koyuMu());
    durum.api.surdur();
    /* Toplantidan donuldu: ekip masasina yurur. */
    if(durum.api.durum().toplanti === 'seated') durum.api.toplanti(false);
    notlariTara();
    hakTara();
    baslat();
  }

  function ac(){ durum.istendi = true; durum.hata = null; }

  return { kullanilir, destek, yukle, yerlestir, oneriler, toplantiyaGotur, ac,
    hata:() => durum.hata, SIRA,
    /* test kancalari */
    _durum:durum, _kok:k => { KOK = k; }, _ekle:ekle, _isle:isle };
})();
