/* DEFTER — Obsidian benzeri notlar: bağlantı, resim, çizim, video, ses, dosya.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/defter.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `defter.css`.
   ==================================================================

   Depo sahibi (2026-10-17, belgeler/ekip/NOT-PLANI.md): «Notun içine resim
   koyabileyim, resim çizebileyim, video koyabileyim ve orada oynasın, ses
   koyabileyim; kendi dosyamı ekleyebileyim, dosya oluşturabileyim.»

   Sözler:
     1. METİN EŞİTLENİR, MEDYA CİHAZDA KALIR. Not metni modülün deposunda
        (`defter/<id>`): yedek ve hesapla öteki cihazlara gider. Resim,
        çizim, video, ses, dosya IndexedDB'de (`lifeos-defter`), yalnız bu
        cihazda (AGENTS §1.4, fotoğraflarla aynı kural); not bunu söyler.
     2. GÜVENLİ GÖRÜNTÜ. Metin önce kaçırılır, sonra biçimlenir; yalnız
        https bağlantısı açılır (yeni sekme, noopener).
     3. NOT ÖLÇÜM DEĞİLDİR. Hiçbir sayıyı, kararı değiştirmez.
     4. SIFIR BAĞIMLILIK. Tuval, MediaRecorder, IndexedDB tarayıcının kendisi.
     5. ESKİ NOTLAR KAYBOLMAZ. Bağlam notları (notum.js) «Ekran notları»
        bölümünde listelenir, kendi ekranında açılır.

   Biçim (Markdown'ın küçük bir alt kümesi):
     # Başlık · ## Alt başlık · ### · **kalın** · *italik* · `kod`
     - madde · 1. sıralı · - [ ] yapılacak · - [x] yapıldı · ---
     [[Not adı]] bağlantı · #etiket · https://… · ![[medya:ID]] gömülü */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.DEFTER = (function(){
  'use strict';
  const EN_UZUN_GOVDE = 60000;
  const EN_BUYUK_DOSYA = 300 * 1024 * 1024;
  const KOK = 'defter';

  let ayar = null;            // { modul, store:{ set, list, remove } }
  let notlar = [];            // [{ id, baslik, govde, at, guncel, sabit }]
  let secili = null, duzen = false, arama = '', kayitZaman = null;

  const kac = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const uid = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const simdi = () => new Date().toISOString();

  /* ------------------------------------------------------------- medya deposu */
  const ortam = {
    idb:() => (typeof indexedDB !== 'undefined' ? indexedDB : null),
    nesneUrl:b => { try{ return URL.createObjectURL(b); }catch(e){ return ''; } },
    indir:(ad, blob) => {
      try{ const u = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = u; a.download = ad; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 4000); return true; }catch(e){ return false; }
    },
  };
  let db = null;
  function dbAc(){
    if(db) return Promise.resolve(db);
    return new Promise((ok, red) => {
      const idb = ortam.idb();
      if(!idb){ red(new Error('Bu tarayıcıda medya deposu (IndexedDB) yok.')); return; }
      let r;
      try{ r = idb.open('lifeos-defter-' + ((ayar && ayar.modul) || 'x'), 1); }catch(e){ red(e); return; }
      r.onupgradeneeded = () => { r.result.createObjectStore('medya', { keyPath:'id' }); };
      r.onsuccess = () => { db = r.result; ok(db); };
      r.onerror = () => red(r.error || new Error('Medya deposu açılamadı.'));
    });
  }
  const medya = {
    async koy(k){ const d = await dbAc(); return new Promise((ok, red) => { const tx = d.transaction('medya', 'readwrite');
      tx.objectStore('medya').put(k); tx.oncomplete = () => ok(k); tx.onerror = () => red(tx.error); }); },
    async al(id){ const d = await dbAc(); return new Promise((ok, red) => { const tx = d.transaction('medya', 'readonly');
      const r = tx.objectStore('medya').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => red(r.error); }); },
    async sil(id){ const d = await dbAc(); return new Promise((ok, red) => { const tx = d.transaction('medya', 'readwrite');
      tx.objectStore('medya').delete(id); tx.oncomplete = () => ok(true); tx.onerror = () => red(tx.error); }); },
  };

  /* Dosya → medya kaydı; döner: gömme sözdizimi. */
  function turOf(mime, ad){
    if(/^image\//.test(mime)) return 'resim';
    if(/^video\//.test(mime)) return 'video';
    if(/^audio\//.test(mime)) return 'ses';
    if(/\.(png|jpe?g|gif|webp)$/i.test(ad || '')) return 'resim';
    return 'dosya';
  }
  async function medyaEkle(blob, o){
    const opt = o || {};
    if(!blob) throw new Error('Dosya yok.');
    if(blob.size > EN_BUYUK_DOSYA) throw new Error('Dosya çok büyük (en çok 300 MB).');
    const ad = String(opt.ad || blob.name || 'dosya').slice(0, 120);
    const k = { id:'m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), notId:opt.notId || null,
      tur:opt.tur || turOf(blob.type || '', ad), ad, mime:blob.type || 'application/octet-stream', boyut:blob.size, blob, at:simdi() };
    await medya.koy(k);
    return { kayit:k, gomme:'![[medya:' + k.id + ']]' };
  }

  /* ------------------------------------------------------------- biçim */
  function satirIci(s){
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/\[\[([^\]|]{1,120})\]\]/g, (m, t) => '<a href="#" class="defter__bag" data-defter-git="' + t.trim() + '">' + t.trim() + '</a>')
      .replace(/(^|\s)(https:\/\/[^\s<]+)/g, (m, b, u) => b + '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u + '</a>')
      .replace(/(^|\s)#([a-zçğıöşü0-9][a-zçğıöşü0-9_-]{1,30})/gi, (m, b, t) => b + '<span class="defter__etiket" data-defter-etiket="' + t.toLocaleLowerCase('tr') + '">#' + t + '</span>');
  }
  /* Metin → güvenli HTML. Gömülüler yer tutucu olur; `canlandir` doldurur. */
  function md(govde){
    const satirlar = kac(govde || '').split('\n');
    const out = [];
    let liste = null;
    const kapat = () => { if(liste){ out.push('</' + liste + '>'); liste = null; } };
    satirlar.forEach((h, i) => {
      const g = h.match(/^!\[\[medya:([a-z0-9]{4,40})\]\]\s*$/);
      if(g){ kapat(); out.push('<div class="defter__gomulu" data-defter-medya="' + g[1] + '"><span class="defter__yukleniyor">Medya yükleniyor…</span></div>'); return; }
      const bas = h.match(/^(#{1,3})\s+(.+)$/);
      if(bas){ kapat(); const n = bas[1].length + 1; out.push('<h' + n + '>' + satirIci(bas[2]) + '</h' + n + '>'); return; }
      if(/^-{3,}\s*$/.test(h)){ kapat(); out.push('<hr/>'); return; }
      const kutu = h.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
      if(kutu){ if(liste !== 'ul'){ kapat(); out.push('<ul class="defter__yapilacak">'); liste = 'ul'; }
        const ok = kutu[1] !== ' ';
        out.push('<li><label><input type="checkbox" data-defter-kutu="' + i + '"' + (ok ? ' checked' : '') + '/> <span' + (ok ? ' class="is-bitti"' : '') + '>' + satirIci(kutu[2]) + '</span></label></li>'); return; }
      const madde = h.match(/^[-*]\s+(.+)$/);
      if(madde){ if(liste !== 'ul'){ kapat(); out.push('<ul>'); liste = 'ul'; } out.push('<li>' + satirIci(madde[1]) + '</li>'); return; }
      const sira = h.match(/^\d+\.\s+(.+)$/);
      if(sira){ if(liste !== 'ol'){ kapat(); out.push('<ol>'); liste = 'ol'; } out.push('<li>' + satirIci(sira[1]) + '</li>'); return; }
      kapat();
      out.push(h.trim() ? '<p>' + satirIci(h) + '</p>' : '');
    });
    kapat();
    return out.join('');
  }
  function baglantilar(govde){
    const s = new Set(); const re = /\[\[([^\]|]{1,120})\]\]/g; let m;
    while((m = re.exec(govde || ''))) s.add(m[1].trim());
    return Array.from(s);
  }
  function etiketler(govde){
    const s = new Set(); const re = /(^|\s)#([a-zçğıöşü0-9][a-zçğıöşü0-9_-]{1,30})/gi; let m;
    while((m = re.exec(govde || ''))) s.add(m[2].toLocaleLowerCase('tr'));
    return Array.from(s);
  }
  const kucuk = s => String(s || '').toLocaleLowerCase('tr');
  function geriBaglantilar(liste, baslik){
    const b = kucuk(baslik);
    return (liste || []).filter(n => n.baslik && kucuk(n.baslik) !== b && baglantilar(n.govde).some(x => kucuk(x) === b));
  }
  function ara(liste, q){
    const t = kucuk(q).trim();
    const l = (liste || []).slice().sort((a, b) => (b.sabit ? 1 : 0) - (a.sabit ? 1 : 0) || String(b.guncel).localeCompare(String(a.guncel)));
    if(!t) return l;
    if(t.charAt(0) === '#') return l.filter(n => etiketler(n.govde).indexOf(t.slice(1)) >= 0);
    return l.filter(n => kucuk(n.baslik).indexOf(t) >= 0 || kucuk(n.govde).indexOf(t) >= 0);
  }
  /* Yapılacak kutusunu i. satırda çevir. */
  function kutuCevir(govde, i){
    const l = String(govde || '').split('\n');
    if(!l[i]) return govde;
    l[i] = l[i].replace(/^([-*]\s+\[)( |x|X)(\])/, (m, a, b, c) => a + (b === ' ' ? 'x' : ' ') + c);
    return l.join('\n');
  }
  /* Dışa aktarma: gömülüler dosya adıyla. */
  async function disaAktarMetni(n){
    let g = n.govde || '';
    const ids = []; const re = /!\[\[medya:([a-z0-9]{4,40})\]\]/g; let m;
    while((m = re.exec(g))) ids.push(m[1]);
    for(const id of ids){
      let k = null; try{ k = await medya.al(id); }catch(e){ k = null; }
      g = g.replace('![[medya:' + id + ']]', k ? '![' + k.ad + '](' + k.ad + ')' : '(bu cihazda olmayan medya)');
    }
    return '# ' + (n.baslik || 'Adsız not') + '\n\n' + g + '\n';
  }

  /* ------------------------------------------------------------- notlar */
  async function yukle(){
    if(!ayar || !ayar.store || !ayar.store.list) return notlar;
    let rows = [];
    try{ rows = (await ayar.store.list(KOK)) || []; }catch(e){ rows = []; }
    notlar = rows.filter(r => r && r.id).map(r => ({ id:r.id, baslik:String(r.baslik || ''), govde:String(r.govde || ''),
      at:r.at || simdi(), guncel:r.guncel || r.at || simdi(), sabit:!!r.sabit }));
    return notlar;
  }
  async function kaydet(n){
    n.guncel = simdi();
    n.govde = String(n.govde || '').slice(0, EN_UZUN_GOVDE);
    const i = notlar.findIndex(x => x.id === n.id);
    if(i >= 0) notlar[i] = n; else notlar.unshift(n);
    if(ayar && ayar.store && ayar.store.set) await ayar.store.set(KOK + '/' + n.id, n);
    return n;
  }
  async function yeni(baslik, govde){
    return kaydet({ id:uid(), baslik:String(baslik || '').slice(0, 120), govde:govde || '', at:simdi(), guncel:simdi(), sabit:false });
  }
  async function sil(id){
    const n = notlar.find(x => x.id === id);
    if(!n) return false;
    notlar = notlar.filter(x => x.id !== id);
    if(ayar && ayar.store && ayar.store.remove) await ayar.store.remove(KOK + '/' + id);
    const re = /!\[\[medya:([a-z0-9]{4,40})\]\]/g; let m;
    while((m = re.exec(n.govde))){ try{ await medya.sil(m[1]); }catch(e){ /* cihazda yok */ } }
    return n;
  }
  const notBul = id => notlar.find(x => x.id === id) || null;
  const baslikBul = b => notlar.find(x => kucuk(x.baslik) === kucuk(b)) || null;

  /* ------------------------------------------------------------- arayüz */
  const S = {
    resim:'<path d="M4 5h16v14H4z"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4"/>',
    ciz:'<path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M14 6l3 3"/>',
    video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
    ses:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    dosya:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
    bag:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    kutu:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
    yeni:'<path d="M12 5v14M5 12h14"/>', kapat:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', geri:'<path d="M15 5l-7 7 7 7"/>',
  };
  const svg = k => '<svg viewBox="0 0 24 24" aria-hidden="true">' + S[k] + '</svg>';
  const dugme = (is, ikon, ad, ek) => '<button type="button" class="defter__arac" data-defter="' + is + '"' + (ek || '') + ' title="' + ad + '" aria-label="' + ad + '">' + svg(ikon) + '<span>' + ad + '</span></button>';
  function tarihYaz(iso){ const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' }); }

  function listeHtml(){
    const l = ara(notlar, arama);
    const ekran = (window.LIFEOS.NOTUM && window.LIFEOS.NOTUM.kuruluMu && window.LIFEOS.NOTUM.kuruluMu()) ? window.LIFEOS.NOTUM.liste() : [];
    const ozet = g => kac(String(g || '').replace(/!\[\[medya:[^\]]+\]\]/g, '[medya]').replace(/[#*`\[\]]/g, '').trim().slice(0, 70));
    return (l.length ? l.map(n => '<button type="button" class="defter__oge' + (secili === n.id ? ' is-secili' : '') + '" data-defter-ac="' + n.id + '">'
        + '<b>' + (n.sabit ? '★ ' : '') + kac(n.baslik || 'Adsız not') + '</b><span>' + ozet(n.govde) + '</span><small>' + tarihYaz(n.guncel) + '</small></button>').join('')
      : '<p class="defter__bos">' + (arama ? 'Aramaya uyan not yok.' : 'Henüz not yok. «Yeni not» ile başla.') + '</p>')
      + (ekran.length && !arama ? '<p class="defter__bolum">Ekran notları</p>' + ekran.map(x => '<button type="button" class="defter__oge defter__oge--ekran" data-defter-ekran="'
        + kac(x.baglam) + '"><b>' + kac(x.ad || x.baglam) + '</b><span>' + kac((x.metin || '').slice(0, 70)) + '</span><small>' + kac(x.ust || '') + '</small></button>').join('') : '');
  }
  function duzenleyiciHtml(){
    const n = notBul(secili);
    if(!n) return '<div class="defter__karsila"><p>Bir not seç ya da yeni not başlat.</p>'
      + '<p class="defter__not">Resim, çizim, video, ses ve dosyalar bu cihazda saklanır; notun metni hesabınla öteki cihazlarına da gider.</p></div>';
    const geri = geriBaglantilar(notlar, n.baslik);
    return '<div class="defter__ust">'
      + '<button type="button" class="defter__arac defter__geri" data-defter="liste" title="Notlar">' + svg('geri') + '<span>Notlar</span></button>'
      + '<input class="defter__baslik" data-defter-baslik value="' + kac(n.baslik) + '" placeholder="Başlık" aria-label="Not başlığı" autocomplete="off"/>'
      + '<button type="button" class="defter__kip" data-defter="kip" aria-pressed="' + (duzen ? 'true' : 'false') + '">' + (duzen ? 'Bitti' : 'Düzenle') + '</button></div>'
      + (duzen ? '<div class="defter__araclar" role="toolbar" aria-label="Ekle">'
        + dugme('resim', 'resim', 'Resim') + dugme('ciz', 'ciz', 'Çiz') + dugme('video', 'video', 'Video')
        + dugme('ses', 'ses', 'Ses kaydı') + dugme('dosya', 'dosya', 'Dosya') + dugme('bag', 'bag', 'Bağlantı') + dugme('kutu', 'kutu', 'Yapılacak')
        + '<input type="file" class="sr-only" data-defter-dosya multiple/></div>'
        + '<textarea class="defter__govde" data-defter-govde aria-label="Not" placeholder="Yaz… # başlık, **kalın**, - madde, - [ ] yapılacak, [[başka not]], #etiket">' + kac(n.govde) + '</textarea>'
        : '<article class="defter__oku" data-defter-oku>' + (md(n.govde) || '<p class="defter__bos">Boş not. «Düzenle» ile yaz.</p>') + '</article>')
      + (geri.length ? '<div class="defter__geriler"><b>Bu nota bağlananlar</b>' + geri.map(g => '<a href="#" data-defter-ac="' + g.id + '">' + kac(g.baslik) + '</a>').join('') + '</div>' : '')
      + '<div class="defter__alt"><span>' + tarihYaz(n.guncel) + ' · ' + (etiketler(n.govde).map(t => '#' + t).join(' ') || 'etiket yok') + '</span>'
      + '<span class="defter__alt-is"><button type="button" class="defter__metin" data-defter="sabit">' + (n.sabit ? 'Sabitlemeyi kaldır' : 'Sabitle') + '</button>'
      + '<button type="button" class="defter__metin" data-defter="aktar">Dosya olarak indir</button>'
      + '<button type="button" class="defter__metin defter__metin--sil" data-defter="sil">Sil</button></span></div>';
  }
  function ciz(){
    const el = document.getElementById('defter');
    if(!el) return;
    el.querySelector('[data-defter-liste]').innerHTML = listeHtml();
    el.querySelector('[data-defter-sag]').innerHTML = duzenleyiciHtml();
    el.classList.toggle('is-not', !!secili);
    el.querySelector('[data-defter-say]').textContent = notlar.length + ' not';
    canlandir(el);
  }
  /* Gömülü medyayı IndexedDB'den doldurur. */
  async function canlandir(kok){
    const yerler = Array.from(kok.querySelectorAll('[data-defter-medya]'));
    for(const y of yerler){
      const id = y.getAttribute('data-defter-medya');
      let k = null; try{ k = await medya.al(id); }catch(e){ k = null; }
      if(!k){ y.innerHTML = '<span class="defter__eksik">Bu medya bu cihazda yok (medya cihazda saklanır).</span>'; continue; }
      const u = ortam.nesneUrl(k.blob);
      if(k.tur === 'resim' || k.tur === 'cizim') y.innerHTML = '<img src="' + u + '" alt="' + kac(k.ad) + '" loading="lazy"/>';
      else if(k.tur === 'video') y.innerHTML = '<video src="' + u + '" controls preload="metadata" playsinline></video>';
      else if(k.tur === 'ses') y.innerHTML = '<audio src="' + u + '" controls preload="metadata"></audio>';
      else y.innerHTML = '<button type="button" class="defter__dosya" data-defter-indir="' + k.id + '">' + svg('dosya') + '<span>' + kac(k.ad) + '</span><small>'
        + (k.boyut > 1048576 ? (Math.round(k.boyut / 104857.6) / 10) + ' MB' : Math.max(1, Math.round(k.boyut / 1024)) + ' KB') + ' · indir</small></button>';
    }
  }
  function ac(o){
    if(typeof document === 'undefined' || !ayar) return false;
    kapat();
    const el = document.createElement('div');
    el.id = 'defter';
    el.className = 'defter';
    el.innerHTML = '<div class="defter__perde" data-defter="kapat"></div><div class="defter__kutu" role="dialog" aria-modal="true" aria-label="Defter">'
      + '<div class="defter__bas"><b>Defter</b><span data-defter-say></span>'
      + '<input class="defter__ara" type="search" data-defter-ara placeholder="Ara ya da #etiket" aria-label="Notlarda ara" autocomplete="off"/>'
      + '<button type="button" class="defter__yeni" data-defter="yeni" aria-label="Yeni not">' + svg('yeni') + '<span>Yeni not</span></button>'
      + '<button type="button" class="defter__kapat" data-defter="kapat" aria-label="Kapat">' + svg('kapat') + '</button></div>'
      + '<div class="defter__govdeler"><nav class="defter__liste" data-defter-liste aria-label="Notlar"></nav><section class="defter__sag" data-defter-sag></section></div></div>';
    document.body.appendChild(el);
    bagla(el);
    if(o && o.id) secili = o.id;
    ciz();
    return true;
  }
  function kapat(){ const el = document.getElementById('defter'); if(el) el.remove(); }

  function govdeyeEkle(metin){
    const n = notBul(secili);
    if(!n) return;
    const ta = document.querySelector('[data-defter-govde]');
    if(ta){
      const bas = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
      const once = ta.value.slice(0, bas), sonra = ta.value.slice(bas);
      const ek = (once && !/\n$/.test(once) ? '\n' : '') + metin + '\n';
      ta.value = once + ek + sonra;
      n.govde = ta.value;
    }else n.govde = (n.govde ? n.govde.replace(/\n?$/, '\n') : '') + metin + '\n';
    kaydet(n);
  }
  async function dosyalariEkle(files){
    for(const f of Array.from(files || [])){
      try{ const r = await medyaEkle(f, { notId:secili }); govdeyeEkle(r.gomme); }
      catch(e){ uyar((e && e.message) || 'Eklenemedi.'); }
    }
    ciz();
  }
  function uyar(m){ const el = document.querySelector('.defter__alt span'); if(el) el.textContent = m; }

  /* ---------- çizim tuvali ---------- */
  function cizimAc(){
    const k = document.createElement('div');
    k.className = 'defter-ciz';
    const RENK = ['#111111', '#e5484d', '#2f7cf6', '#30a46c', '#f5a524'];
    k.innerHTML = '<div class="defter-ciz__kutu" role="dialog" aria-modal="true" aria-label="Çizim">'
      + '<div class="defter-ciz__arac">' + RENK.map((r, i) => '<button type="button" class="defter-ciz__renk' + (i ? '' : ' is-secili') + '" data-renk="' + r + '" style="background:' + r + '" aria-label="Renk ' + (i + 1) + '"></button>').join('')
      + '<button type="button" data-kalin="3" class="is-secili">İnce</button><button type="button" data-kalin="7">Orta</button><button type="button" data-kalin="14">Kalın</button>'
      + '<button type="button" data-ciz="silgi">Silgi</button><button type="button" data-ciz="geri">Geri al</button><button type="button" data-ciz="temizle">Temizle</button></div>'
      + '<canvas class="defter-ciz__tuval" width="1200" height="760" aria-label="Çizim alanı"></canvas>'
      + '<div class="defter-ciz__alt"><button type="button" data-ciz="vazgec">Vazgeç</button><button type="button" class="is-ana" data-ciz="kaydet">Nota ekle</button></div></div>';
    document.body.appendChild(k);
    const tv = k.querySelector('canvas'), c = tv.getContext('2d');
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, tv.width, tv.height);
    c.lineCap = 'round'; c.lineJoin = 'round';
    let renk = RENK[0], kalin = 3, silgi = false, cizer = false;
    const gecmis = [];
    const nokta = e => { const r = tv.getBoundingClientRect(); return [(e.clientX - r.left) * tv.width / r.width, (e.clientY - r.top) * tv.height / r.height]; };
    tv.addEventListener('pointerdown', e => { cizer = true; try{ tv.setPointerCapture(e.pointerId); }catch(er){}
      if(gecmis.length > 20) gecmis.shift(); gecmis.push(c.getImageData(0, 0, tv.width, tv.height));
      const [x, y] = nokta(e); c.beginPath(); c.moveTo(x, y); });
    tv.addEventListener('pointermove', e => { if(!cizer) return; const [x, y] = nokta(e);
      c.strokeStyle = silgi ? '#ffffff' : renk; c.lineWidth = silgi ? kalin * 3 : kalin * (e.pressure ? 0.6 + e.pressure : 1); c.lineTo(x, y); c.stroke(); });
    const bitir = () => { cizer = false; };
    tv.addEventListener('pointerup', bitir); tv.addEventListener('pointercancel', bitir);
    k.addEventListener('click', async e => {
      const t = e.target.closest('button'); if(!t) return;
      if(t.dataset.renk){ renk = t.dataset.renk; silgi = false; k.querySelectorAll('[data-renk]').forEach(b => b.classList.toggle('is-secili', b === t)); return; }
      if(t.dataset.kalin){ kalin = Number(t.dataset.kalin); k.querySelectorAll('[data-kalin]').forEach(b => b.classList.toggle('is-secili', b === t)); return; }
      const is = t.dataset.ciz;
      if(is === 'silgi'){ silgi = !silgi; t.classList.toggle('is-secili', silgi); }
      else if(is === 'geri'){ const g = gecmis.pop(); if(g) c.putImageData(g, 0, 0); }
      else if(is === 'temizle'){ gecmis.push(c.getImageData(0, 0, tv.width, tv.height)); c.fillStyle = '#ffffff'; c.fillRect(0, 0, tv.width, tv.height); }
      else if(is === 'vazgec') k.remove();
      else if(is === 'kaydet'){
        tv.toBlob(async b => {
          try{ const r = await medyaEkle(b, { notId:secili, tur:'cizim', ad:'cizim-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.png' });
            govdeyeEkle(r.gomme); }catch(er){ uyar((er && er.message) || 'Çizim eklenemedi.'); }
          k.remove(); ciz();
        }, 'image/png');
      }
    });
  }

  /* ---------- ses kaydı ---------- */
  let kayitci = null;
  async function sesKaydi(btn){
    if(kayitci){ kayitci.stop(); return; }
    if(!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || typeof MediaRecorder === 'undefined'){
      const f = document.querySelector('[data-defter-dosya]'); if(f){ f.accept = 'audio/*'; f.click(); } return;
    }
    let akim;
    try{ akim = await navigator.mediaDevices.getUserMedia({ audio:true }); }
    catch(e){ uyar('Mikrofon izni verilmedi; ses dosyası seçebilirsin.'); return; }
    const parca = [], bas = Date.now();
    kayitci = new MediaRecorder(akim);
    kayitci.ondataavailable = e => { if(e.data && e.data.size) parca.push(e.data); };
    kayitci.onstop = async () => {
      akim.getTracks().forEach(t => t.stop());
      kayitci = null;
      const b = new Blob(parca, { type:parca[0] ? parca[0].type : 'audio/webm' });
      try{ const r = await medyaEkle(b, { notId:secili, tur:'ses', ad:'ses-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.webm' }); govdeyeEkle(r.gomme); }
      catch(e){ uyar((e && e.message) || 'Ses eklenemedi.'); }
      ciz();
    };
    kayitci.start();
    if(btn){ btn.classList.add('is-kayit'); const s = btn.querySelector('span'); const tik = setInterval(() => { if(!kayitci){ clearInterval(tik); return; }
      s.textContent = 'Durdur · ' + Math.floor((Date.now() - bas) / 1000) + ' sn'; }, 500); }
  }

  function bagla(el){
    el.addEventListener('keydown', e => { if(e.key === 'Escape' && !document.querySelector('.defter-ciz')){ e.preventDefault(); kapat(); } });
    el.addEventListener('input', e => {
      const t = e.target;
      if(t.matches('[data-defter-ara]')){ arama = t.value; el.querySelector('[data-defter-liste]').innerHTML = listeHtml(); return; }
      const n = notBul(secili);
      if(!n) return;
      if(t.matches('[data-defter-baslik]')) n.baslik = t.value.slice(0, 120);
      if(t.matches('[data-defter-govde]')) n.govde = t.value;
      clearTimeout(kayitZaman);
      kayitZaman = setTimeout(() => { kaydet(n); const l = el.querySelector('[data-defter-liste]'); if(l) l.innerHTML = listeHtml(); }, 500);
    });
    el.addEventListener('change', e => {
      const t = e.target;
      if(t.matches('[data-defter-dosya]')){ dosyalariEkle(t.files); t.value = ''; t.removeAttribute('accept'); return; }
      if(t.matches('[data-defter-kutu]')){ const n = notBul(secili); if(n){ n.govde = kutuCevir(n.govde, Number(t.getAttribute('data-defter-kutu'))); kaydet(n).then(ciz); } }
    });
    el.addEventListener('paste', e => {
      if(!duzen || !e.target.matches('[data-defter-govde]')) return;
      const f = Array.from((e.clipboardData && e.clipboardData.files) || []);
      if(f.length){ e.preventDefault(); dosyalariEkle(f); }
    });
    el.addEventListener('dragover', e => { if(e.target.closest('[data-defter-sag]')) e.preventDefault(); });
    el.addEventListener('drop', e => {
      if(!e.target.closest('[data-defter-sag]') || !secili) return;
      const f = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
      if(f.length){ e.preventDefault(); duzen = true; dosyalariEkle(f); }
    });
    el.addEventListener('click', async e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const ac_ = t.closest('[data-defter-ac]');
      if(ac_){ e.preventDefault(); secili = ac_.getAttribute('data-defter-ac'); duzen = false; ciz(); return; }
      const git = t.closest('[data-defter-git]');
      if(git){ e.preventDefault(); const b = git.getAttribute('data-defter-git'); let n = baslikBul(b); if(!n) n = await yeni(b, ''); secili = n.id; duzen = !n.govde; ciz(); return; }
      const et = t.closest('[data-defter-etiket]');
      if(et){ arama = '#' + et.getAttribute('data-defter-etiket'); const a = el.querySelector('[data-defter-ara]'); if(a) a.value = arama; ciz(); return; }
      const ekr = t.closest('[data-defter-ekran]');
      if(ekr){ const b = ekr.getAttribute('data-defter-ekran'); const x = window.LIFEOS.NOTUM.liste().find(y => y.baglam === b); kapat();
        try{ if(x && typeof x.ac === 'function') x.ac(); else if(window.LIFEOS.NOTUM && ayar.ekranAc) ayar.ekranAc(b); }catch(er){ console.error(er); } return; }
      const ind = t.closest('[data-defter-indir]');
      if(ind){ const k = await medya.al(ind.getAttribute('data-defter-indir')); if(k) ortam.indir(k.ad, k.blob); return; }
      const d = t.closest('[data-defter]');
      if(!d) return;
      const is = d.getAttribute('data-defter'), n = notBul(secili);
      if(is === 'kapat'){ kapat(); return; }
      if(is === 'yeni'){ const x = await yeni('', ''); secili = x.id; duzen = true; ciz(); const b = el.querySelector('[data-defter-baslik]'); if(b) try{ b.focus(); }catch(er){} return; }
      if(is === 'liste'){ secili = null; ciz(); return; }
      if(!n) return;
      if(is === 'kip'){ if(duzen){ const ta = el.querySelector('[data-defter-govde]'); if(ta){ n.govde = ta.value; await kaydet(n); } } duzen = !duzen; ciz(); return; }
      if(is === 'sabit'){ n.sabit = !n.sabit; await kaydet(n); ciz(); return; }
      if(is === 'sil'){ if(d.dataset.onay !== '1'){ d.dataset.onay = '1'; d.textContent = 'Emin misin? Sil'; return; } await sil(n.id); secili = null; ciz(); return; }
      if(is === 'aktar'){ const m = await disaAktarMetni(n); ortam.indir((n.baslik || 'not').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60) + '.md', new Blob([m], { type:'text/markdown;charset=utf-8' })); return; }
      if(is === 'resim' || is === 'video' || is === 'dosya'){ const f = el.querySelector('[data-defter-dosya]'); if(f){ f.accept = is === 'resim' ? 'image/*' : is === 'video' ? 'video/*' : ''; f.click(); } return; }
      if(is === 'ciz'){ cizimAc(); return; }
      if(is === 'ses'){ sesKaydi(d); return; }
      if(is === 'bag'){ govdeyeEkle('[[' + 'Not adı' + ']]'); ciz(); return; }
      if(is === 'kutu'){ govdeyeEkle('- [ ] '); ciz(); return; }
    });
  }

  function kur(o){ ayar = Object.assign({ modul:'' }, o || {}); db = null; }
  function _sifirla(){ ayar = null; notlar = []; secili = null; duzen = false; arama = ''; db = null; kapat(); }

  return { kur, yukle, ac, kapat, yeni, kaydet, sil, md, baglantilar, etiketler, geriBaglantilar, ara, kutuCevir,
    medyaEkle, medya, disaAktarMetni, notlar:() => notlar.slice(), sec:id => { secili = id; }, duzenle:v => { duzen = !!v; },
    kuruluMu:() => !!ayar, _ortam:ortam, _sifirla, _db:v => { db = v; } };
})();
