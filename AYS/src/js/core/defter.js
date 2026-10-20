/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/defter.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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
     [[Not adı]] bağlantı · #etiket · https://… · ![[medya:ID]] gömülü
     ==vurgu== · ~~üstü çizili~~ · > alıntı

   Faz 1b (2026-10-17, «temayla uyumlu, sade ama daha zengin; kalemle yazma,
   vurgulama»): dış kap King paneliyle aynı cam, yazı alanı opak kâğıt kartı;
   Oku | Yaz seçici; simge araç çubuğu (biçim + ekle) ve kısayollar;
   kalemle yazma tuvali (kalem, fosforlu kalem, silgi, çizgili/kareli kâğıt,
   geri al/ileri al, basınç); şablonlar; kelime sayısı.

   Faz 1c (2026-10-17, «soru çözümünde yazarak, çizerek not alma; saklanan
   verinin sistemini artır, daha kaliteli yap»):
     · TUVAL PAYLAŞILIR: `tuval({ baslik, ust, arka, kagit, dugme, kaydet })`
       — arkada soru fotoğrafı ya da üstte soru metni; AYS Soru çöz ve Öğren
       bunu kullanır.
     · HAZIR NOT: `notOlustur({ baslik, govde, ekler, ekle })` resimli notu
       tek çağrıyla kurar; aynı başlıklı not varsa `ekle` ile sonuna ekler.
     · YEDEK: Defter medyasıyla birlikte tek dosyaya (.json, medya base64)
       yedeklenir ve geri yüklenir (var olan not ezilmez).
     · KALICI DEPOLAMA: ilk medyada tarayıcıdan kalıcı depolama istenir
       (navigator.storage.persist): tarayıcı yer açarken medyayı silmesin.
       Kullanılan alan Defter'de yazar.

   Kütüphanem rafı (2026-10-17, «kütüphanenin içinde yeni not, belge
   oluşturma, dosya ekleme olsun; yazdıklarımızı oraya yazacağız»):
     · TÜR: her kayıt not | belge | dosya (eski ve bilinmeyen = not).
     · `rafHtml()` + `rafBagla(el)`: üç eylem (Yeni not, Yeni belge, Dosya
       ekle), en yeni beş kayıt, fazlası «Tümü». Satır Defter'i o kayıtta
       açar; yeni kayıt yazma kipinde açılır. Defter kapanınca raf tazelenir.
     · DOSYA: her dosya kendi kaydını açar; dosya cihazda kalır (söz 1),
       kaydın adı ve gömmesi eşitlenir.

   Klasör ve ağ (2026-10-20, kullanıcı: «notlar klasörlenebilir ve
   düzenlenebilir olsun; Obsidian mantığında şematik bir ağda görülebilsin;
   not sayısı artınca karmaşa olmasın»):
     · KLASÖR: her kaydın `klasor` alanı («Sağlık», «Sağlık/Uyku»); sol
       sütunda ağaç (sayılarıyla), seçilen klasör listeyi süzer, yeni not o
       klasörde açılır. Klasörü silmek notu silmez: notlar klasörsüze geçer.
       Boş klasör `defterklasor/liste` kaydında durur.
     · AĞ: notlar düğüm, [[bağlantı]] çizgi (isteğe bağlı ortak #etiket kesik
       çizgi). Yerleşim kuvvet yöntemiyle, kimlikten türeyen tohumla: aynı
       notlar her açılışta aynı yerde. Karmaşaya karşı: klasöre göre süz,
       bağsızları gizle, yalnız seçili notun çevresi (iki adım); ad yalnız
       çok bağlı düğümde ya da üstüne gelince yazılır; kaydır, yakınlaştır.
     · BOŞ NOT KALMAZ: başlığı ve metni boş not, başka nota geçince ya da
       Defter kapanınca silinir (iki «Adsız not» birikiyordu). */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.DEFTER = (function(){
  'use strict';
  const EN_UZUN_GOVDE = 60000;
  const EN_BUYUK_DOSYA = 300 * 1024 * 1024;
  const KOK = 'defter';

  let ayar = null;            // { modul, store:{ set, list, remove } }
  let notlar = [];            // [{ id, baslik, govde, at, guncel, sabit }]
  let secili = null, duzen = false, arama = '', kayitZaman = null;
  /* Klasör süzgeci: null = tüm notlar, '' = klasörsüz, 'Ad' = o klasör ve altı. */
  let klasor = null, gorunum = 'liste', klasorYeni = false, bosKlasorler = [];
  const agAyar = { etiket:false, bagsizGizle:false, cevre:false };

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
    kaliciIste();
    return { kayit:k, gomme:'![[medya:' + k.id + ']]' };
  }

  /* ------------------------------------------------------------- biçim */
  function satirIci(s){
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/==([^=]{1,200})==/g, '<mark>$1</mark>')
      .replace(/~~([^~]{1,200})~~/g, '<del>$1</del>')
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
      const al = h.match(/^&gt;\s?(.*)$/);
      if(al){ kapat(); out.push('<blockquote>' + satirIci(al[1]) + '</blockquote>'); return; }
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
  /* Şablonlar: boş nota tek dokunuşla. */
  const SABLONLAR = Object.freeze([
    { id:'ders', ad:'Ders notu', govde:'## Konu\n\n## Önemli noktalar\n- \n\n## Örnek\n\n## Sorularım\n- [ ] \n\n## Özet\n' },
    { id:'gunluk', ad:'Günlük', govde:'## Bugün nasıldım\n\n## Minnettar olduğum üç şey\n1. \n2. \n3. \n\n## Yarın için\n- [ ] \n' },
    { id:'kitap', ad:'Kitap notu', govde:'## Yazar\n\n## Alıntılar\n> \n\n## Düşüncem\n\n#kitap\n' },
    { id:'plan', ad:'Plan', govde:'## Amaç\n\n## Adımlar\n- [ ] \n- [ ] \n\n## Engeller\n\n## Tarih\n' },
  ]);
  /* Kelime sayısı ve okuma süresi (dakikada ~200 kelime). */
  function sayim(govde){
    const k = String(govde || '').replace(/!\[\[medya:[^\]]+\]\]/g, ' ').replace(/[#*`>=~\[\]-]/g, ' ').split(/\s+/).filter(Boolean).length;
    return { kelime:k, dakika:Math.max(1, Math.round(k / 200)) };
  }
  /* Seçili metni sar (araç çubuğu ve kısayol). Döner: yeni { metin, bas, son }. */
  function sar(metin, bas, son, on, ark, yerTut){
    const secim = metin.slice(bas, son) || yerTut || '';
    const yeni = metin.slice(0, bas) + on + secim + ark + metin.slice(son);
    return { metin:yeni, bas:bas + on.length, son:bas + on.length + secim.length };
  }
  /* Satır başına önek koy (başlık, alıntı, liste, yapılacak). */
  function satirOnek(metin, bas, son, onek){
    const ilk = metin.lastIndexOf('\n', bas - 1) + 1;
    const blok = metin.slice(ilk, son);
    const yeniBlok = blok.split('\n').map(s => s.indexOf(onek) === 0 ? s.slice(onek.length) : onek + s).join('\n');
    return { metin:metin.slice(0, ilk) + yeniBlok + metin.slice(son), bas:ilk, son:ilk + yeniBlok.length };
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

  /* ---------------------------------------------- kalıcı depolama ve alan */
  let kaliciIstendi = false;
  async function kaliciIste(){
    if(kaliciIstendi) return null;
    kaliciIstendi = true;
    try{ return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : null; }catch(e){ return null; }
  }
  async function alan(){
    const o = { kullanilan:null, kota:null, kalici:null };
    try{
      if(navigator.storage && navigator.storage.estimate){ const e = await navigator.storage.estimate(); o.kullanilan = e.usage; o.kota = e.quota; }
      if(navigator.storage && navigator.storage.persisted) o.kalici = await navigator.storage.persisted();
    }catch(e){ /* tarayıcı söylemiyor */ }
    return o;
  }
  const mbYaz = b => b == null ? '?' : b >= 1073741824 ? (Math.round(b / 107374182.4) / 10) + ' GB' : (Math.round(b / 104857.6) / 10) + ' MB';

  /* ------------------------------------------------------------- yedek */
  function blobBase64(b){ return new Promise((ok, red) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => red(r.error); r.readAsDataURL(b); }); }
  function base64Blob(s, mime){ const ikili = atob(s); const u = new Uint8Array(ikili.length); for(let i = 0; i < ikili.length; i++) u[i] = ikili.charCodeAt(i); return new Blob([u], { type:mime || 'application/octet-stream' }); }
  /* Döner: yedek nesnesi { app, surum, at, notlar, medya:[{…, veri}] }. */
  async function yedekNesnesi(){
    const ids = new Set();
    notlar.forEach(n => { const re = /!\[\[medya:([a-z0-9]{4,40})\]\]/g; let m; while((m = re.exec(n.govde))) ids.add(m[1]); });
    const md = [];
    for(const id of ids){
      let k = null; try{ k = await medya.al(id); }catch(e){ k = null; }
      if(k && k.blob) md.push({ id:k.id, notId:k.notId, tur:k.tur, ad:k.ad, mime:k.mime, boyut:k.boyut, at:k.at, veri:await blobBase64(k.blob) });
    }
    return { app:'lifeos-defter', modul:(ayar && ayar.modul) || '', surum:1, at:simdi(), notlar:notlar.map(n => Object.assign({}, n)), medya:md };
  }
  async function yedekAl(){
    const y = await yedekNesnesi();
    const ad = 'defter-' + y.modul + '-' + y.at.slice(0, 10) + '.json';
    ortam.indir(ad, new Blob([JSON.stringify(y)], { type:'application/json' }));
    return { ad, not:y.notlar.length, medya:y.medya.length };
  }
  /* Var olan not ve medya EZİLMEZ; yalnız eksikler eklenir. */
  async function yedekYukle(y){
    if(!y || y.app !== 'lifeos-defter' || !Array.isArray(y.notlar)) throw new Error('Bu dosya bir Defter yedeği değil.');
    let not = 0, md = 0;
    for(const m of (y.medya || [])){
      let var_ = null; try{ var_ = await medya.al(m.id); }catch(e){ var_ = null; }
      if(var_ || !m.veri) continue;
      await medya.koy({ id:m.id, notId:m.notId || null, tur:m.tur, ad:m.ad, mime:m.mime, boyut:m.boyut, at:m.at, blob:base64Blob(m.veri, m.mime) });
      md++;
    }
    for(const n of y.notlar){
      if(!n || !n.id || notBul(n.id)) continue;
      await kaydet({ id:n.id, baslik:String(n.baslik || ''), govde:String(n.govde || ''), at:n.at || simdi(), guncel:n.guncel || simdi(), sabit:!!n.sabit });
      not++;
    }
    return { not, medya:md };
  }

  /* ------------------------------------------------------------- notlar */
  async function yukle(){
    if(!ayar || !ayar.store || !ayar.store.list) return notlar;
    let rows = [];
    try{ rows = (await ayar.store.list(KOK)) || []; }catch(e){ rows = []; }
    notlar = rows.filter(r => r && r.id).map(r => ({ id:r.id, baslik:String(r.baslik || ''), govde:String(r.govde || ''),
      at:r.at || simdi(), guncel:r.guncel || r.at || simdi(), sabit:!!r.sabit, tur:turBul(r.tur), klasor:klasorAdi(r.klasor) }));
    try{ const k = (await ayar.store.list('defterklasor')) || []; bosKlasorler = ((k[0] && k[0].liste) || []).map(klasorAdi).filter(Boolean); }
    catch(e){ bosKlasorler = []; }
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
  const TURLER = ['not', 'belge', 'dosya'];
  const turBul = t => TURLER.indexOf(t) >= 0 ? t : 'not';
  async function yeni(baslik, govde, tur, kls){
    return kaydet({ id:uid(), baslik:String(baslik || '').slice(0, 120), govde:govde || '', at:simdi(), guncel:simdi(), sabit:false, tur:turBul(tur),
      klasor:klasorAdi(kls != null ? kls : (klasor || '')) });
  }

  /* ------------------------------------------------------------- klasör */
  /* «  Sağlık / uyku/ » → «Sağlık/uyku»; boş parça atılır, en çok 3 kat. */
  function klasorAdi(k){
    return String(k || '').split('/').map(x => x.replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean).slice(0, 3).join('/');
  }
  /* Bütün klasörler (üst klasörler de), sıralı. */
  function klasorler(){
    const s = new Set();
    notlar.map(n => n.klasor).concat(bosKlasorler).filter(Boolean).forEach(k => {
      const p = k.split('/');
      for(let i = 1; i <= p.length; i++) s.add(p.slice(0, i).join('/'));
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'tr'));
  }
  const icinde = (n, k) => k == null ? true : k === '' ? !n.klasor : (n.klasor === k || (n.klasor || '').indexOf(k + '/') === 0);
  function klasordeki(k){ return notlar.filter(n => icinde(n, k)); }
  async function bosKlasorYaz(){
    if(ayar && ayar.store && ayar.store.set) await ayar.store.set('defterklasor/liste', { id:'liste', liste:bosKlasorler.slice() });
  }
  async function klasorEkle(ad){
    const k = klasorAdi(ad);
    if(!k) return null;
    if(klasorler().indexOf(k) < 0){ bosKlasorler.push(k); await bosKlasorYaz(); }
    return k;
  }
  /* Yeniden adlandır: o klasördeki ve altındaki bütün notlar taşınır. */
  async function klasorTasi(eski, yeniAd){
    const y = klasorAdi(yeniAd);
    if(!eski || !y || eski === y) return 0;
    let n = 0;
    for(const x of notlar.slice()){
      if(icinde(x, eski)){ x.klasor = y + x.klasor.slice(eski.length); await kaydet(x); n++; }
    }
    bosKlasorler = bosKlasorler.map(b => b === eski || b.indexOf(eski + '/') === 0 ? y + b.slice(eski.length) : b);
    await bosKlasorYaz();
    return n;
  }
  /* Klasörü sil: notlar SİLİNMEZ, klasörsüze geçer. */
  async function klasorSil(k){
    let n = 0;
    for(const x of notlar.slice()){ if(k && icinde(x, k)){ x.klasor = ''; await kaydet(x); n++; } }
    bosKlasorler = bosKlasorler.filter(b => b !== k && b.indexOf(k + '/') !== 0);
    await bosKlasorYaz();
    return n;
  }
  /* Boş not (başlık ve metin boş) kalmaz. */
  async function bosSil(id){
    const n = notBul(id);
    if(n && !String(n.baslik || '').trim() && !String(n.govde || '').trim()){ await sil(n.id); return true; }
    return false;
  }

  /* ------------------------------------------------------------- ağ */
  const hashOf = s => { let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  /* Düğüm ve kenarlar. Süzgeçler karmaşayı keser (bkz. başlık yorumu). */
  function agVeri(o){
    const ay = Object.assign({}, agAyar, o || {});
    const kls = ay.klasor !== undefined ? ay.klasor : klasor;
    const l = notlar.filter(n => icinde(n, kls));
    const byBaslik = new Map();
    l.forEach(n => { if(n.baslik) byBaslik.set(kucuk(n.baslik), n); });
    const kenar = [], gor = new Set();
    const ekle = (a, b, tur) => { if(a === b) return; const k = [a, b].sort().join('|'); if(gor.has(k)) return; gor.add(k); kenar.push({ a, b, tur }); };
    l.forEach(n => baglantilar(n.govde).forEach(b => { const h = byBaslik.get(kucuk(b)); if(h) ekle(n.id, h.id, 'bag'); }));
    if(ay.etiket){
      const etk = new Map();
      l.forEach(n => etiketler(n.govde).forEach(t => { if(!etk.has(t)) etk.set(t, []); etk.get(t).push(n.id); }));
      /* Çok kalabalık etiket (12+ not) yumak yapar: zincir olarak bağlanır. */
      etk.forEach(ids => { if(ids.length > 12){ for(let i = 1; i < ids.length; i++) ekle(ids[i - 1], ids[i], 'etiket'); }
        else for(let i = 0; i < ids.length; i++) for(let j = i + 1; j < ids.length; j++) ekle(ids[i], ids[j], 'etiket'); });
    }
    let dugum = l.map(n => ({ id:n.id, ad:n.baslik || rafAdi(n), klasor:n.klasor || '', derece:0 }));
    const derece = {};
    kenar.forEach(e => { derece[e.a] = (derece[e.a] || 0) + 1; derece[e.b] = (derece[e.b] || 0) + 1; });
    dugum.forEach(d => { d.derece = derece[d.id] || 0; });
    if(ay.cevre && ay.merkez){
      const kom = new Map();
      kenar.forEach(e => { (kom.get(e.a) || kom.set(e.a, []).get(e.a)).push(e.b); (kom.get(e.b) || kom.set(e.b, []).get(e.b)).push(e.a); });
      const ic = new Set([ay.merkez]); let sinir = [ay.merkez];
      for(let adim = 0; adim < 2; adim++){ const yeni_ = []; sinir.forEach(x => (kom.get(x) || []).forEach(y => { if(!ic.has(y)){ ic.add(y); yeni_.push(y); } })); sinir = yeni_; }
      dugum = dugum.filter(d => ic.has(d.id));
    }
    if(ay.bagsizGizle) dugum = dugum.filter(d => d.derece > 0 || d.id === ay.merkez);
    const var_ = new Set(dugum.map(d => d.id));
    return { dugum, kenar:kenar.filter(e => var_.has(e.a) && var_.has(e.b)) };
  }
  /* Kuvvet yerleşimi (Fruchterman–Reingold), tohum kimlikten: aynı veri
     aynı resmi verir. Aynı klasör hafifçe birbirine çekilir: klasör küme olur. */
  function yerlesim(v, g, y){
    const W = g || 1000, H = y || 700, n = v.dugum.length;
    const p = {};
    v.dugum.forEach((d, i) => { const a = hashOf(d.id) * Math.PI * 2, r = 0.15 + 0.35 * hashOf(d.id + 'r');
      p[d.id] = { x:W / 2 + Math.cos(a) * r * W, y:H / 2 + Math.sin(a) * r * H }; });
    if(n < 2) { if(n === 1) p[v.dugum[0].id] = { x:W / 2, y:H / 2 }; return p; }
    const k = Math.sqrt((W * H) / n) * 0.45;
    const tur = n > 300 ? 60 : n > 120 ? 120 : 220;
    let sicak = W / 8;
    for(let t = 0; t < tur; t++){
      const dx = {}, dy = {};
      v.dugum.forEach(d => { dx[d.id] = 0; dy[d.id] = 0; });
      for(let i = 0; i < n; i++) for(let j = i + 1; j < n; j++){
        const a = v.dugum[i].id, b = v.dugum[j].id;
        let x = p[a].x - p[b].x, yy = p[a].y - p[b].y; let d2 = x * x + yy * yy;
        if(d2 < 0.01){ x = 0.1; yy = 0.1; d2 = 0.02; }
        const d = Math.sqrt(d2), f = (k * k) / d;
        dx[a] += x / d * f; dy[a] += yy / d * f; dx[b] -= x / d * f; dy[b] -= yy / d * f;
      }
      v.kenar.forEach(e => {
        const x = p[e.a].x - p[e.b].x, yy = p[e.a].y - p[e.b].y, d = Math.sqrt(x * x + yy * yy) || 0.1;
        const f = (d * d) / k * (e.tur === 'etiket' ? 0.4 : 1);
        dx[e.a] -= x / d * f; dy[e.a] -= yy / d * f; dx[e.b] += x / d * f; dy[e.b] += yy / d * f;
      });
      const merkez = {};
      v.dugum.forEach(d => { const m = merkez[d.klasor] || (merkez[d.klasor] = { x:0, y:0, n:0 }); m.x += p[d.id].x; m.y += p[d.id].y; m.n++; });
      v.dugum.forEach(d => {
        const m = merkez[d.klasor];
        dx[d.id] += (m.x / m.n - p[d.id].x) * 0.08 + (W / 2 - p[d.id].x) * 0.04;
        dy[d.id] += (m.y / m.n - p[d.id].y) * 0.08 + (H / 2 - p[d.id].y) * 0.04;
        const b = Math.sqrt(dx[d.id] * dx[d.id] + dy[d.id] * dy[d.id]) || 1;
        /* Çerçevenin içinde kalır (Fruchterman–Reingold sınırı): bağsız
           not sonsuza itilmez. */
        p[d.id].x = Math.min(W - 30, Math.max(30, p[d.id].x + dx[d.id] / b * Math.min(b, sicak)));
        p[d.id].y = Math.min(H - 30, Math.max(30, p[d.id].y + dy[d.id] / b * Math.min(b, sicak)));
      });
      sicak *= 0.97;
    }
    return p;
  }
  const RENKLER = ['var(--primary)', 'var(--ays)', 'var(--esp)', 'var(--mer)', 'var(--spi)', 'var(--text-2)'];
  function renkOf(k){
    if(!k) return 'var(--text-3)';
    const kok = k.split('/')[0];
    const l = klasorler().filter(x => x.indexOf('/') < 0);
    return RENKLER[Math.max(0, l.indexOf(kok)) % RENKLER.length];
  }
  function agHtml(){
    const v = agVeri({ merkez:secili });
    const dug = (is, ad, acik) => '<button type="button" class="defter-ag__dug' + (acik ? ' is-secili' : '') + '" data-defter-ag="' + is + '" aria-pressed="' + !!acik + '">' + ad + '</button>';
    const kok = klasorler().filter(x => x.indexOf('/') < 0);
    return '<div class="defter-ag" data-defter-ag-kok>'
      + '<div class="defter-ag__arac">'
      + dug('etiket', 'Etiket bağları', agAyar.etiket) + dug('bagsiz', 'Bağsızları gizle', agAyar.bagsizGizle)
      + (secili ? dug('cevre', 'Yalnız seçili notun çevresi', agAyar.cevre) : '')
      + '<span class="defter-ag__bosluk"></span>'
      + '<button type="button" class="defter__simge" data-defter-ag="kucult" aria-label="Uzaklaştır">−</button>'
      + '<button type="button" class="defter__simge" data-defter-ag="sigdir" aria-label="Sığdır">⤢</button>'
      + '<button type="button" class="defter__simge" data-defter-ag="buyut" aria-label="Yakınlaştır">+</button></div>'
      + (v.dugum.length ? '<svg class="defter-ag__tuval" data-defter-ag-svg role="img" aria-label="' + v.dugum.length + ' not, ' + v.kenar.length + ' bağ"></svg>'
        : '<p class="defter__bos">Bu görünümde not yok. [[Not adı]] yazarak notları birbirine bağla; bağlar burada çizgi olur.</p>')
      + '<div class="defter-ag__alt"><span>' + v.dugum.length + ' not · ' + v.kenar.length + ' bağ</span>'
      + (kok.length ? '<span class="defter-ag__lejant">' + kok.map(k => '<i style="background:' + renkOf(k) + '"></i>' + kac(k)).join('') + '<i style="background:var(--text-3)"></i>Klasörsüz</span>' : '')
      + '</div></div>';
  }
  /* SVG'yi çizer; kaydırma ve yakınlaştırma görüş kutusuyla. */
  function agCiz(kok){
    const svgEl = kok.querySelector('[data-defter-ag-svg]');
    if(!svgEl) return;
    const v = agVeri({ merkez:secili });
    /* Çerçeve not sayısıyla büyür: az notta düğümler okunur büyüklükte kalır. */
    const S = Math.max(420, 170 * Math.sqrt(v.dugum.length));
    const p = yerlesim(v, S, S * 0.68);
    const xs = v.dugum.map(d => p[d.id].x), ys = v.dugum.map(d => p[d.id].y);
    const pay = 60;
    const kutu = { x:Math.min.apply(null, xs) - pay, y:Math.min.apply(null, ys) - pay };
    kutu.w = Math.max(200, Math.max.apply(null, xs) - kutu.x + pay); kutu.h = Math.max(160, Math.max.apply(null, ys) - kutu.y + pay);
    const ilk = Object.assign({}, kutu);
    const az = v.dugum.length <= 30;
    const NS = 'http://www.w3.org/2000/svg';
    let h = '';
    v.kenar.forEach(e => { h += '<line class="defter-ag__kenar' + (e.tur === 'etiket' ? ' is-etiket' : '') + '" x1="' + p[e.a].x.toFixed(1) + '" y1="' + p[e.a].y.toFixed(1)
      + '" x2="' + p[e.b].x.toFixed(1) + '" y2="' + p[e.b].y.toFixed(1) + '"/>'; });
    v.dugum.forEach(d => {
      const r = 6 + Math.min(10, Math.sqrt(d.derece) * 3);
      const gorunur = az || d.derece >= 2 || d.id === secili;
      h += '<g class="defter-ag__dugum' + (d.id === secili ? ' is-secili' : '') + (gorunur ? ' is-adli' : '') + '" data-defter-ac="' + kac(d.id) + '" tabindex="0" role="button" aria-label="' + kac(d.ad) + '">'
        + '<title>' + kac(d.ad) + (d.klasor ? ' · ' + kac(d.klasor) : '') + ' · ' + d.derece + ' bağ</title>'
        + '<circle cx="' + p[d.id].x.toFixed(1) + '" cy="' + p[d.id].y.toFixed(1) + '" r="' + r.toFixed(1) + '" style="fill:' + renkOf(d.klasor) + '"/>'
        + '<text x="' + p[d.id].x.toFixed(1) + '" y="' + (p[d.id].y + r + 13).toFixed(1) + '">' + kac(d.ad.length > 28 ? d.ad.slice(0, 27) + '…' : d.ad) + '</text></g>';
    });
    svgEl.setAttribute('xmlns', NS);
    svgEl.innerHTML = h;
    const uygula = () => svgEl.setAttribute('viewBox', kutu.x.toFixed(1) + ' ' + kutu.y.toFixed(1) + ' ' + kutu.w.toFixed(1) + ' ' + kutu.h.toFixed(1));
    uygula();
    const olcek = (f, cx, cy) => { const nx = cx == null ? kutu.x + kutu.w / 2 : cx, ny = cy == null ? kutu.y + kutu.h / 2 : cy;
      kutu.x = nx - (nx - kutu.x) * f; kutu.y = ny - (ny - kutu.y) * f; kutu.w *= f; kutu.h *= f; uygula(); };
    svgEl.__ag = { olcek, sigdir:() => { Object.assign(kutu, ilk); uygula(); } };
    svgEl.addEventListener('wheel', e => { e.preventDefault(); const r = svgEl.getBoundingClientRect();
      olcek(e.deltaY > 0 ? 1.12 : 1 / 1.12, kutu.x + (e.clientX - r.left) / r.width * kutu.w, kutu.y + (e.clientY - r.top) / r.height * kutu.h); }, { passive:false });
    let surukle = null;
    svgEl.addEventListener('pointerdown', e => { if(e.target.closest('[data-defter-ac]')) return; surukle = { x:e.clientX, y:e.clientY, kx:kutu.x, ky:kutu.y };
      try{ svgEl.setPointerCapture(e.pointerId); }catch(er){} svgEl.classList.add('is-surukle'); });
    svgEl.addEventListener('pointermove', e => { if(!surukle) return; const r = svgEl.getBoundingClientRect();
      kutu.x = surukle.kx - (e.clientX - surukle.x) / r.width * kutu.w; kutu.y = surukle.ky - (e.clientY - surukle.y) / r.height * kutu.h; uygula(); });
    const birak = () => { surukle = null; svgEl.classList.remove('is-surukle'); };
    svgEl.addEventListener('pointerup', birak); svgEl.addEventListener('pointercancel', birak);
    svgEl.addEventListener('keydown', e => { const g = e.target.closest && e.target.closest('[data-defter-ac]');
      if(g && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles:true })); } });
  }
  /* Belge: başlıklı, bölümlü uzun yazı. Not hızlı ve serbesttir. */
  const BELGE = '## Amaç\n\n## İçerik\n\n## Kaynaklar\n- \n';
  async function belgeOlustur(baslik, kls){ return yeni(baslik || 'Yeni belge', BELGE, 'belge', kls); }
  /* Her dosya kendi kaydı: ad başlık olur, dosya gömülür (cihazda kalır). */
  async function dosyalarEkle(dosyalar, kls){
    const l = [];
    for(const f of Array.from(dosyalar || [])){
      if(!f) continue;
      const r = await medyaEkle(f, { ad:f.name });
      l.push(await yeni(String(f.name || 'Dosya').slice(0, 120), r.gomme, 'dosya', kls));
    }
    return l;
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
  /* Hazır not: ekler [{ blob, ad, tur }] gömülür. `ekle` true ve aynı başlıklı
     not varsa sonuna eklenir (soru notları biriksin). Döner: not. */
  async function notOlustur(o){
    const opt = o || {};
    const gomme = [];
    for(const e of (opt.ekler || [])){
      if(!e || !e.blob) continue;
      const r = await medyaEkle(e.blob, { ad:e.ad, tur:e.tur });
      gomme.push(r.gomme);
    }
    const parca = String(opt.govde || '').replace(/\{\{ekler\}\}/g, () => gomme.join('\n'));
    const tam = parca.indexOf('![[medya:') < 0 && gomme.length ? parca + (parca ? '\n' : '') + gomme.join('\n') : parca;
    const var_ = opt.ekle && opt.baslik ? baslikBul(opt.baslik) : null;
    if(var_){ var_.govde = (var_.govde ? var_.govde.replace(/\n*$/, '\n\n---\n') : '') + tam; return kaydet(var_); }
    return yeni(opt.baslik || 'Adsız not', tam);
  }

  /* ------------------------------------------------------------- arayüz */
  const S = {
    resim:'<path d="M4 5h16v14H4z"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4"/>',
    ciz:'<path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M14 6l3 3"/>',
    video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
    ses:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    dosya:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
    bag:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    kutu:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
    kalin:'<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>', italik:'<path d="M10 5h8M6 19h8M14 5l-4 14"/>',
    baslik:'<path d="M6 5v14M18 5v14M6 12h12"/>', vurgu:'<path d="M4 20h6"/><path d="M9 16l-2-2 9-9 4 4-9 9z"/>',
    alinti:'<path d="M7 7h4v4H8l-1 4M14 7h4v4h-3l-1 4"/>', liste:'<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/>',
    kod:'<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>', sablon:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>',
    klasor:'<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    yeni:'<path d="M12 5v14M5 12h14"/>', ag:'<circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="17" r="2.6"/><path d="M8 8l2.8 7M16.6 7.8l-3.4 7.2M8.2 6.8l7.6-.6"/>', kapat:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', geri:'<path d="M15 5l-7 7 7 7"/>',
  };
  const svg = k => '<svg viewBox="0 0 24 24" aria-hidden="true">' + S[k] + '</svg>';
  const dugme = (is, ikon, ad, ek) => '<button type="button" class="defter__arac" data-defter="' + is + '"' + (ek || '') + ' title="' + ad + '" aria-label="' + ad + '">' + svg(ikon) + '<span>' + ad + '</span></button>';
  const simge = (is, ikon, ad) => '<button type="button" class="defter__simge" data-defter="' + is + '" title="' + ad + '" aria-label="' + ad + '">' + svg(ikon) + '</button>';
  function tarihYaz(iso){ const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' }); }

  function klasorAgaciHtml(){
    const l = klasorler();
    const satir = (k, ad, sayi, derin) => '<button type="button" class="defter__klasor' + (klasor === k ? ' is-secili' : '') + '" data-defter-klasor="'
      + (k == null ? '*' : kac(k)) + '" style="--derin:' + (derin || 0) + '"><span>' + kac(ad) + '</span><small>' + sayi + '</small></button>';
    const klasorsuz = notlar.filter(n => !n.klasor).length;
    let h = '<div class="defter__klasorler" role="group" aria-label="Klasörler">'
      + satir(null, 'Tüm notlar', notlar.length, 0)
      + l.map(k => satir(k, k.split('/').pop(), klasordeki(k).length, k.split('/').length - 1)).join('')
      + (l.length ? satir('', 'Klasörsüz', klasorsuz, 0) : '');
    h += klasorYeni
      ? '<div class="defter__klasor-yeni"><input data-defter-klasor-ad placeholder="Klasör adı (Sağlık/Uyku)" aria-label="Yeni klasörün adı" maxlength="80"/>'
        + '<button type="button" class="defter__metin" data-defter="klasor-kaydet">Ekle</button></div>'
      : '<button type="button" class="defter__metin defter__klasor-ekle" data-defter="klasor-yeni">+ Klasör</button>';
    if(klasor){
      h += '<div class="defter__klasor-is"><button type="button" class="defter__metin" data-defter="klasor-ad">Yeniden adlandır</button>'
        + '<button type="button" class="defter__metin defter__metin--sil" data-defter="klasor-sil">Klasörü sil</button></div>';
    }
    return h + '</div>';
  }
  function listeHtml(){
    const l = ara(notlar, arama).filter(n => arama ? true : icinde(n, klasor));
    const ekran = (window.LIFEOS.NOTUM && window.LIFEOS.NOTUM.kuruluMu && window.LIFEOS.NOTUM.kuruluMu()) ? window.LIFEOS.NOTUM.liste() : [];
    const ozet = g => kac(String(g || '').replace(/!\[\[medya:[^\]]+\]\]/g, '[medya]').replace(/[#*`\[\]]/g, '').trim().slice(0, 70));
    return klasorAgaciHtml() + '<p class="defter__bolum">' + (arama ? 'Arama' : klasor == null ? 'Notlar' : klasor === '' ? 'Klasörsüz' : kac(klasor)) + '</p>'
      + (l.length ? l.map(n => '<button type="button" class="defter__oge' + (secili === n.id ? ' is-secili' : '') + '" data-defter-ac="' + n.id + '">'
        + '<b>' + (n.sabit ? '★ ' : '') + kac(n.baslik || 'Adsız not') + '</b><span>' + ozet(n.govde) + '</span><small>' + tarihYaz(n.guncel)
        + (n.klasor && klasor == null ? ' · ' + kac(n.klasor.split('/').pop()) : '') + '</small></button>').join('')
      : '<p class="defter__bos">' + (arama ? 'Aramaya uyan not yok.' : klasor != null && notlar.length ? 'Bu klasörde not yok.' : 'Henüz not yok. «Yeni not» ile başla.') + '</p>')
      + (ekran.length && !arama && klasor == null ? '<p class="defter__bolum">Ekran notları</p>' + ekran.map(x => '<button type="button" class="defter__oge defter__oge--ekran" data-defter-ekran="'
        + kac(x.baglam) + '"><b>' + kac(x.ad || x.baglam) + '</b><span>' + kac((x.metin || '').slice(0, 70)) + '</span><small>' + kac(x.ust || '') + '</small></button>').join('') : '');
  }
  function klasorSecici(n){
    const l = klasorler();
    return '<label class="defter__klasor-sec">Klasör <select data-defter-not-klasor aria-label="Notun klasörü">'
      + '<option value=""' + (!n.klasor ? ' selected' : '') + '>Klasörsüz</option>'
      + l.map(k => '<option value="' + kac(k) + '"' + (n.klasor === k ? ' selected' : '') + '>' + kac(k) + '</option>').join('')
      + '<option value="__yeni">Yeni klasör…</option></select></label>';
  }
  function duzenleyiciHtml(){
    if(gorunum === 'ag') return agHtml();
    const n = notBul(secili);
    if(!n) return '<div class="defter__karsila"><p>Bir not seç ya da yeni not başlat.</p>'
      + '<p class="defter__not">Resim, çizim, video, ses ve dosyalar bu cihazda saklanır; notun metni hesabınla öteki cihazlarına da gider.</p></div>';
    const geri = geriBaglantilar(notlar, n.baslik);
    const say = sayim(n.govde);
    const kip = '<div class="defter__kip" role="radiogroup" aria-label="Görünüm">'
      + '<button type="button" role="radio" aria-checked="' + (!duzen) + '" class="' + (duzen ? '' : 'is-secili') + '" data-defter="oku">Oku</button>'
      + '<button type="button" role="radio" aria-checked="' + duzen + '" class="' + (duzen ? 'is-secili' : '') + '" data-defter="yaz">Yaz</button></div>';
    const araclar = '<div class="defter__araclar" role="toolbar" aria-label="Biçim ve ekle">'
      + '<span class="defter__grup">' + simge('f-kalin', 'kalin', 'Kalın (Ctrl+B)') + simge('f-italik', 'italik', 'İtalik (Ctrl+I)')
      + simge('f-baslik', 'baslik', 'Başlık') + simge('f-vurgu', 'vurgu', 'Vurgu kalemi (Ctrl+Shift+H)') + simge('f-alinti', 'alinti', 'Alıntı')
      + simge('f-liste', 'liste', 'Liste') + simge('kutu', 'kutu', 'Yapılacak') + simge('f-kod', 'kod', 'Kod') + simge('bag', 'bag', 'Not bağlantısı (Ctrl+K)') + '</span>'
      + '<span class="defter__grup">' + simge('resim', 'resim', 'Resim') + simge('ciz', 'ciz', 'Kalemle yaz ve çiz') + simge('video', 'video', 'Video')
      + simge('ses', 'ses', 'Ses kaydı') + simge('dosya', 'dosya', 'Dosya') + '</span>'
      + '<input type="file" class="sr-only" data-defter-dosya multiple/></div>';
    const sablon = !n.govde ? '<div class="defter__sablonlar"><span>Şablonla başla:</span>'
      + SABLONLAR.map(t => '<button type="button" class="defter__sablon" data-defter-sablon="' + t.id + '">' + kac(t.ad) + '</button>').join('') + '</div>' : '';
    return '<div class="defter__ust">'
      + '<button type="button" class="defter__arac defter__geri" data-defter="liste" title="Notlar">' + svg('geri') + '<span>Notlar</span></button>'
      + '<input class="defter__baslik" data-defter-baslik value="' + kac(n.baslik) + '" placeholder="Başlık" aria-label="Not başlığı" autocomplete="off"/>'
      + kip + '</div>'
      + '<div class="defter__kagit">'
      + (duzen ? araclar + sablon
        + '<textarea class="defter__govde" data-defter-govde aria-label="Not" placeholder="Yaz… # başlık, **kalın**, ==vurgu==, - madde, - [ ] yapılacak, > alıntı, [[başka not]], #etiket">' + kac(n.govde) + '</textarea>'
        : '<article class="defter__oku" data-defter-oku>' + (md(n.govde) || '<p class="defter__bos">Boş not. «Yaz» ile başla.</p>') + '</article>')
      + '</div>'
      + (geri.length ? '<div class="defter__geriler"><b>Bu nota bağlananlar</b>' + geri.map(g => '<a href="#" data-defter-ac="' + g.id + '">' + kac(g.baslik) + '</a>').join('') + '</div>' : '')
      + '<div class="defter__alt"><span>' + tarihYaz(n.guncel) + ' · ' + say.kelime + ' kelime · ' + say.dakika + ' dk okuma'
      + (etiketler(n.govde).length ? ' · ' + etiketler(n.govde).map(t => '#' + t).join(' ') : '') + '</span>'
      + '<span class="defter__alt-is">' + klasorSecici(n) + '<button type="button" class="defter__metin" data-defter="sabit">' + (n.sabit ? 'Sabitlemeyi kaldır' : 'Sabitle') + '</button>'
      + '<button type="button" class="defter__metin" data-defter="aktar">Dosya olarak indir</button>'
      + '<button type="button" class="defter__metin defter__metin--sil" data-defter="sil">Sil</button></span></div>';
  }
  function ciz(){
    const el = document.getElementById('defter');
    if(!el) return;
    el.querySelector('[data-defter-liste]').innerHTML = listeHtml();
    el.querySelector('[data-defter-sag]').innerHTML = duzenleyiciHtml();
    el.classList.toggle('is-not', !!secili && gorunum !== 'ag');
    el.classList.toggle('is-ag', gorunum === 'ag');
    el.querySelector('[data-defter-say]').textContent = notlar.length + ' not';
    el.querySelectorAll('[data-defter="gorunum"]').forEach(b => { b.setAttribute('aria-pressed', String(gorunum === 'ag')); b.classList.toggle('is-secili', gorunum === 'ag'); });
    if(gorunum === 'ag') agCiz(el); else canlandir(el);
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
    /* Eskiden kalmış boş notlar açılışta temizlenir (açılan not hariç). */
    notlar.filter(n => !(o && o.id === n.id) && !String(n.baslik || '').trim() && !String(n.govde || '').trim()).forEach(n => { sil(n.id); });
    const el = document.createElement('div');
    el.id = 'defter';
    el.className = 'defter';
    el.innerHTML = '<div class="defter__perde" data-defter="kapat"></div><div class="defter__kutu" role="dialog" aria-modal="true" aria-label="Defter">'
      + '<div class="defter__bas"><b>Defter</b><span data-defter-say></span>'
      + '<input class="defter__ara" type="search" data-defter-ara placeholder="Ara ya da #etiket" aria-label="Notlarda ara" autocomplete="off"/>'
      + '<button type="button" class="defter__arac defter__gorunum" data-defter="gorunum" aria-pressed="false" title="Notların ağı">' + svg('ag') + '<span>Ağ</span></button>'
      + '<button type="button" class="defter__yeni" data-defter="yeni" aria-label="Yeni not">' + svg('yeni') + '<span>Yeni not</span></button>'
      + '<button type="button" class="defter__kapat" data-defter="kapat" aria-label="Kapat">' + svg('kapat') + '</button></div>'
      + '<div class="defter__govdeler"><div class="defter__sol"><nav class="defter__liste" data-defter-liste aria-label="Notlar"></nav>'
      + '<div class="defter__depo"><span data-defter-alan>Bu cihazda medya alanı ölçülüyor…</span>'
      + '<span><button type="button" class="defter__metin" data-defter="yedek-al">Yedekle</button>'
      + '<button type="button" class="defter__metin" data-defter="yedek-yukle">Yedekten yükle</button></span>'
      + '<input type="file" accept="application/json,.json" class="sr-only" data-defter-yedek/></div></div>'
      + '<section class="defter__sag" data-defter-sag></section></div></div>';
    document.body.appendChild(el);
    bagla(el);
    if(o && o.id) secili = o.id;
    if(o && o.duzen) duzen = true;
    ciz();
    alanYaz(el);
    return true;
  }
  function kapat(){
    const el = document.getElementById('defter');
    if(!el) return;
    if(secili) bosSil(secili);
    el.remove();
    try{ document.dispatchEvent(new CustomEvent('lifeos:defter-kapandi')); }catch(e){ /* eski tarayıcı */ }
  }

  /* ------------------------------------------------- Kütüphanem rafı */
  const RAF_EN_COK = 5;
  const TUR_AD = { not:'Not', belge:'Belge', dosya:'Dosya' };
  const TUR_SIMGE = { not:'ciz', belge:'sablon', dosya:'dosya' };
  /* Başlıksız kaydın adı ilk dolu satırıdır (biçim işaretleri ve gömme
     atılır); o da yoksa «Adsız». */
  function rafAdi(n){
    if(n.baslik) return n.baslik;
    const ilk = String(n.govde || '').replace(/!\[\[medya:[^\]]+\]\]/g, '').split('\n')
      .map(x => x.replace(/^(#{1,3}\s+|>\s*|[-*]\s+(\[[ x]\]\s+)?|\d+\.\s+)/i, '').replace(/[*=~`]/g, '').trim()).find(Boolean);
    return ilk ? ilk.slice(0, 80) : 'Adsız';
  }
  /* KLASÖRLÜ RAF (2026-10-20, kullanıcı: «bu kısma da klasörlü bir görüntü
     getir; klasör içine koyabileyim, çok fazla olduğunda taşmasın»).
     Raf bir klasörde durur (kökte: klasörsüz kayıtlar). Üstte o seviyenin
     klasörleri karo olarak (kaç kayıt), altta o klasörün en yeni beş kaydı;
     fazlası «Tümü» ile Defter'de o klasörde açılır. Yeni not, belge ve dosya
     rafın durduğu klasöre girer. Kayıt «Taşı» düğmesiyle ya da sürüklenip
     bir klasör karosuna / yol çubuğuna bırakılarak taşınır. */
  let rafKlasor = '', rafKlasorYeni = false, rafTasi = null;
  const ustKlasor = k => k.indexOf('/') < 0 ? '' : k.slice(0, k.lastIndexOf('/'));
  async function notTasi(id, k){
    const n = notBul(id);
    if(!n) return null;
    n.klasor = klasorAdi(k);
    return kaydet(n);
  }
  function rafHtml(){
    if(rafKlasor && klasorler().indexOf(rafKlasor) < 0) rafKlasor = '';
    const burada = notlar.filter(n => (n.klasor || '') === rafKlasor)
      .sort((a, b) => String(b.guncel || '').localeCompare(String(a.guncel || '')));
    const ilk = burada.slice(0, RAF_EN_COK);
    const altlar = klasorler().filter(k => ustKlasor(k) === rafKlasor);
    const derin = rafKlasor ? rafKlasor.split('/').length : 0;
    const eylem = (is, ikon, ad, cls_) => '<button type="button" class="defter-raf__eylem' + (cls_ ? ' ' + cls_ : '') + '" data-defter-raf="' + is + '">' + svg(ikon) + '<span>' + ad + '</span></button>';
    /* Yol çubuğu: Kütüphanem › Sağlık › Uyku (her parça bırakma hedefi). */
    let yol = '';
    if(rafKlasor){
      const p = rafKlasor.split('/');
      yol = '<nav class="defter-raf__yol" aria-label="Klasör yolu">'
        + '<button type="button" class="defter-raf__yol-geri" data-defter-raf-git="' + kac(ustKlasor(rafKlasor)) + '" aria-label="Üst klasöre dön">' + svg('geri') + '</button>'
        + '<button type="button" data-defter-raf-git="" data-defter-raf-hedef="">Kütüphanem</button>'
        + p.map((x, i) => {
          const k = p.slice(0, i + 1).join('/');
          return '<span aria-hidden="true">›</span>' + (i === p.length - 1
            ? '<b aria-current="location">' + kac(x) + '</b>'
            : '<button type="button" data-defter-raf-git="' + kac(k) + '" data-defter-raf-hedef="' + kac(k) + '">' + kac(x) + '</button>');
        }).join('') + '</nav>';
    }
    const yeniKlasor = rafKlasorYeni
      ? '<div class="defter-raf__klasor-yeni"><input data-defter-raf-klasor-ad placeholder="Klasör adı" aria-label="Yeni klasörün adı" maxlength="40"/>'
        + '<button type="button" class="defter-raf__eylem" data-defter-raf="klasor-kaydet"><span>Ekle</span></button>'
        + '<button type="button" class="defter-raf__tumu" data-defter-raf="klasor-vazgec">Vazgeç</button></div>' : '';
    const karolar = altlar.length ? '<div class="defter-raf__klasorler" role="list" aria-label="Klasörler">' + altlar.map(k => {
      const n = klasordeki(k).length;
      return '<button type="button" role="listitem" class="defter-raf__klasor" data-defter-raf-git="' + kac(k) + '" data-defter-raf-hedef="' + kac(k) + '">'
        + '<span class="defter-raf__klasor-simge" aria-hidden="true">' + svg('klasor') + '</span>'
        + '<b>' + kac(k.split('/').pop()) + '</b><small>' + (n ? n + ' kayıt' : 'boş') + '</small></button>';
    }).join('') + '</div>' : '';
    const hedefler = [''].concat(klasorler());
    const satir = n => {
      const t = turBul(n.tur);
      const tasiyor = rafTasi === n.id;
      return '<li><div class="defter-raf__satir">'
        + '<button type="button" class="defter-raf__oge" data-defter-ac="' + kac(n.id) + '" draggable="true">'
        + '<span class="defter-raf__simge defter-raf__simge--' + t + '" aria-hidden="true">' + svg(TUR_SIMGE[t]) + '</span>'
        + '<b>' + kac(rafAdi(n)) + '</b>'
        + '<small>' + TUR_AD[t] + ' · ' + kac(tarihYaz(n.guncel || n.at)) + '</small></button>'
        + '<button type="button" class="defter-raf__tasi' + (tasiyor ? ' is-acik' : '') + '" data-defter-raf-tasi="' + kac(n.id) + '" aria-expanded="' + (tasiyor ? 'true' : 'false')
        +   '" title="Klasöre taşı" aria-label="«' + kac(rafAdi(n)) + '» kaydını klasöre taşı">' + svg('klasor') + '</button></div>'
        + (tasiyor ? '<label class="defter-raf__tasi-sec">Taşınacak yer <select data-defter-raf-tasi-sec="' + kac(n.id) + '">'
          + hedefler.map(k => '<option value="' + kac(k) + '"' + ((n.klasor || '') === k ? ' selected' : '') + '>' + (k ? kac(k.split('/').join(' › ')) : 'Kütüphanem (klasörsüz)') + '</option>').join('')
          + '</select></label>' : '')
        + '</li>';
    };
    const bos = !ilk.length && !altlar.length
      ? (rafKlasor ? '<p class="defter-raf__bos">Bu klasör boş. Burada açtığın not, belge ve dosya bu klasöre girer; başka bir kaydı «Taşı» ile buraya alabilirsin.</p>'
        : '<p class="defter-raf__bos">Henüz not yok. Yazdıkların, belgelerin ve eklediğin dosyalar burada durur.</p>') : '';
    return '<div class="defter-raf">'
      + '<div class="defter-raf__eylemler" role="group" aria-label="Yeni">'
      +   eylem('not', 'yeni', 'Yeni not') + eylem('belge', 'sablon', 'Yeni belge') + eylem('dosya', 'dosya', 'Dosya ekle')
      +   (derin < 3 ? eylem('klasor-yeni', 'klasor', rafKlasor ? 'Alt klasör' : 'Klasör', 'defter-raf__eylem--klasor') : '')
      +   '<input type="file" multiple class="sr-only" data-defter-raf-dosya aria-label="Eklenecek dosyalar" tabindex="-1"/>'
      + '</div>'
      + yol + yeniKlasor + karolar
      + (ilk.length ? '<ul class="defter-raf__liste">' + ilk.map(satir).join('') + '</ul>' : '')
      + bos
      + (burada.length > RAF_EN_COK ? '<button type="button" class="defter-raf__tumu" data-defter-raf="tumu">Tümü (' + burada.length + ')</button>' : '')
      + '</div>';
  }
  function rafBagla(el){
    if(!el || el.__defterRaf) return;
    el.__defterRaf = true;
    const tazele = () => { if(document.contains(el)) el.innerHTML = rafHtml(); };
    const kapaninca = () => { if(!document.contains(el)){ document.removeEventListener('lifeos:defter-kapandi', kapaninca); return; } tazele(); };
    document.addEventListener('lifeos:defter-kapandi', kapaninca);
    const klasorKaydet = async () => {
      const i = el.querySelector('[data-defter-raf-klasor-ad]');
      const ad = klasorAdi(String(i ? i.value : '').replace(/\//g, ' '));
      rafKlasorYeni = false;
      if(ad){ const k = await klasorEkle(rafKlasor ? rafKlasor + '/' + ad : ad); if(k) rafKlasor = k; }
      tazele();
    };
    el.addEventListener('click', async e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const ac_ = t.closest('[data-defter-ac]');
      if(ac_){ ac({ id:ac_.getAttribute('data-defter-ac') }); return; }
      const git = t.closest('[data-defter-raf-git]');
      if(git){ rafKlasor = klasorAdi(git.getAttribute('data-defter-raf-git')); rafTasi = null; rafKlasorYeni = false; tazele(); return; }
      const ts = t.closest('[data-defter-raf-tasi]');
      if(ts){ const id = ts.getAttribute('data-defter-raf-tasi'); rafTasi = rafTasi === id ? null : id; tazele();
        const s = el.querySelector('[data-defter-raf-tasi-sec]'); if(s) try{ s.focus(); }catch(er){} return; }
      const b = t.closest('[data-defter-raf]');
      if(!b) return;
      const is = b.getAttribute('data-defter-raf');
      if(is === 'tumu'){ klasor = rafKlasor; ac(); return; }
      if(is === 'dosya'){ const g = el.querySelector('[data-defter-raf-dosya]'); if(g) g.click(); return; }
      if(is === 'klasor-yeni'){ rafKlasorYeni = true; tazele(); const i = el.querySelector('[data-defter-raf-klasor-ad]'); if(i) try{ i.focus(); }catch(er){} return; }
      if(is === 'klasor-vazgec'){ rafKlasorYeni = false; tazele(); return; }
      if(is === 'klasor-kaydet'){ await klasorKaydet(); return; }
      const n = is === 'belge' ? await belgeOlustur('', rafKlasor) : await yeni('', '', 'not', rafKlasor);
      ac({ id:n.id, duzen:true });
    });
    el.addEventListener('keydown', e => {
      if(e.target && e.target.matches && e.target.matches('[data-defter-raf-klasor-ad]')){
        if(e.key === 'Enter'){ e.preventDefault(); klasorKaydet(); }
        else if(e.key === 'Escape'){ e.preventDefault(); rafKlasorYeni = false; tazele(); }
      }
    });
    el.addEventListener('change', async e => {
      const sec = e.target && e.target.matches && e.target.matches('[data-defter-raf-tasi-sec]') ? e.target : null;
      if(sec){ await notTasi(sec.getAttribute('data-defter-raf-tasi-sec'), sec.value); rafTasi = null; tazele(); return; }
      const g = e.target && e.target.matches && e.target.matches('[data-defter-raf-dosya]') ? e.target : null;
      if(!g || !g.files || !g.files.length) return;
      try{
        const l = await dosyalarEkle(g.files, rafKlasor);
        tazele();
        if(l.length === 1) ac({ id:l[0].id });
      }catch(er){
        const p = document.createElement('p'); p.className = 'defter-raf__hata'; p.setAttribute('role', 'alert');
        p.textContent = (er && er.message) || 'Dosya eklenemedi.';
        el.appendChild(p);
      }
    });
    /* Sürükle-bırak: kayıt bir klasör karosuna ya da yol çubuğuna bırakılır. */
    const hedefi = e => e.target && e.target.closest ? e.target.closest('[data-defter-raf-hedef]') : null;
    el.addEventListener('dragstart', e => {
      const o = e.target && e.target.closest ? e.target.closest('[data-defter-ac]') : null;
      if(!o || !e.dataTransfer) return;
      e.dataTransfer.setData('text/x-defter-not', o.getAttribute('data-defter-ac'));
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', e => {
      const h = hedefi(e);
      if(!h || !e.dataTransfer || Array.from(e.dataTransfer.types || []).indexOf('text/x-defter-not') < 0) return;
      e.preventDefault(); e.dataTransfer.dropEffect = 'move'; h.classList.add('is-ustunde');
    });
    el.addEventListener('dragleave', e => { const h = hedefi(e); if(h) h.classList.remove('is-ustunde'); });
    el.addEventListener('drop', async e => {
      const h = hedefi(e);
      const id = e.dataTransfer ? e.dataTransfer.getData('text/x-defter-not') : '';
      if(!h || !id) return;
      e.preventDefault();
      await notTasi(id, h.getAttribute('data-defter-raf-hedef'));
      tazele();
    });
  }
  async function alanYaz(el){
    const a = await alan(), y = el.querySelector('[data-defter-alan]');
    if(!y) return;
    y.textContent = a.kullanilan == null ? 'Medya bu cihazda saklanır.'
      : 'Bu cihazda ' + mbYaz(a.kullanilan) + ' kullanılıyor' + (a.kalici === true ? ' · kalıcı depolama açık' : a.kalici === false ? ' · kalıcı değil: yedek al' : '');
  }

  /* Araç çubuğu ve kısayol: seçimi biçimle, imleci koru, kaydet. */
  function bicimle(tur){
    const ta = document.querySelector('[data-defter-govde]'), n = notBul(secili);
    if(!ta || !n) return;
    const a = ta.selectionStart || 0, b = ta.selectionEnd || 0, v = ta.value;
    const r = tur === 'kalin' ? sar(v, a, b, '**', '**', 'kalın')
      : tur === 'italik' ? sar(v, a, b, '*', '*', 'italik')
      : tur === 'vurgu' ? sar(v, a, b, '==', '==', 'vurgu')
      : tur === 'kod' ? sar(v, a, b, '`', '`', 'kod')
      : tur === 'bag' ? sar(v, a, b, '[[', ']]', 'Not adı')
      : tur === 'baslik' ? satirOnek(v, a, b, '## ')
      : tur === 'alinti' ? satirOnek(v, a, b, '> ')
      : tur === 'liste' ? satirOnek(v, a, b, '- ')
      : null;
    if(!r) return;
    ta.value = r.metin; n.govde = r.metin;
    try{ ta.focus(); ta.setSelectionRange(r.bas, r.son); }catch(e){ /* odak yok */ }
    kaydet(n);
  }

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

  /* ---------- kalemle yazma ve çizim tuvali ----------
     Kalem (basınçlı), fosforlu kalem (yarı saydam, alttakini örter gibi
     değil, üstüne boyar), silgi; temadan renkler; düz, çizgili ya da kareli
     kâğıt (el yazısı için); geri al ve ileri al. Çizgiler ayrı bir katmanda
     tutulur, kâğıt deseni kaydederken altına basılır: silgi kâğıdı silmez. */
  function cizimAc(){
    return tuval({ kaydet:async b => {
      const r = await medyaEkle(b, { notId:secili, tur:'cizim', ad:'kalem-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.png' });
      govdeyeEkle(r.gomme); ciz();
    } });
  }
  /* Paylaşılan tuval. o: { baslik, ust (güvenli HTML), arka (Blob|URL),
     kagit:'duz'|'cizgili'|'kareli', dugme, kaydet:async blob => {} }. */
  function tuval(o){
    const opt = o || {};
    const k = document.createElement('div');
    k.className = 'defter-ciz';
    const st = getComputedStyle(document.documentElement);
    const tok = (v, y) => (st.getPropertyValue(v) || '').trim() || y;
    const RENK = ['#1d1d1f', tok('--primary', '#2f7cf6'), '#e5484d', '#30a46c', '#f5a524', '#8e4ec6'];
    const ARAC = [['kalem', 'Kalem'], ['fosfor', 'Fosforlu'], ['silgi', 'Silgi']];
    const KAGIT = [['duz', 'Düz'], ['cizgili', 'Çizgili'], ['kareli', 'Kareli']];
    const ilkKagit = opt.kagit || (opt.arka ? 'duz' : 'cizgili');
    k.innerHTML = '<div class="defter-ciz__kutu" role="dialog" aria-modal="true" aria-label="' + kac(opt.baslik || 'Kalemle yaz ve çiz') + '">'
      + (opt.baslik || opt.ust ? '<div class="defter-ciz__ust">' + (opt.baslik ? '<b>' + kac(opt.baslik) + '</b>' : '') + (opt.ust ? '<div class="defter-ciz__soru">' + opt.ust + '</div>' : '') + '</div>' : '')
      + '<div class="defter-ciz__arac">'
      + '<span class="defter-ciz__grup" role="radiogroup" aria-label="Araç">' + ARAC.map((a, i) => '<button type="button" data-arac="' + a[0] + '" role="radio" aria-checked="' + (i ? 'false' : 'true') + '" class="' + (i ? '' : 'is-secili') + '">' + a[1] + '</button>').join('') + '</span>'
      + '<span class="defter-ciz__grup" aria-label="Renk">' + RENK.map((r, i) => '<button type="button" class="defter-ciz__renk' + (i ? '' : ' is-secili') + '" data-renk="' + r + '" style="background:' + r + '" aria-label="Renk ' + (i + 1) + '"></button>').join('') + '</span>'
      + '<span class="defter-ciz__grup" aria-label="Kalınlık">' + [[2, 'İnce'], [5, 'Orta'], [10, 'Kalın']].map((x, i) => '<button type="button" data-kalin="' + x[0] + '" class="' + (i ? '' : 'is-secili') + '">' + x[1] + '</button>').join('') + '</span>'
      + '<span class="defter-ciz__grup" aria-label="Kâğıt">' + KAGIT.map(x => '<button type="button" data-kagit="' + x[0] + '" class="' + (x[0] === ilkKagit ? 'is-secili' : '') + '">' + x[1] + '</button>').join('') + '</span>'
      + '<span class="defter-ciz__grup"><button type="button" data-ciz="geri" aria-label="Geri al">↶</button><button type="button" data-ciz="ileri" aria-label="İleri al">↷</button><button type="button" data-ciz="temizle">Temizle</button></span></div>'
      + '<div class="defter-ciz__alan"><canvas class="defter-ciz__kagit" width="1400" height="900" aria-hidden="true"></canvas>'
      + '<canvas class="defter-ciz__tuval" width="1400" height="900" aria-label="Yazı ve çizim alanı"></canvas></div>'
      + '<div class="defter-ciz__alt"><button type="button" data-ciz="vazgec">Vazgeç</button><button type="button" class="is-ana" data-ciz="kaydet">' + kac(opt.dugme || 'Nota ekle') + '</button></div></div>';
    document.body.appendChild(k);
    const kv = k.querySelector('.defter-ciz__kagit'), tv = k.querySelector('.defter-ciz__tuval');
    const kc = kv.getContext('2d'), c = tv.getContext('2d');
    let kagit = ilkKagit, renk = RENK[0], kalin = 2, arac = 'kalem', cizer = false, son = null;
    const geri = [], ileri = [];
    /* Arka resim (soru fotoğrafı): kâğıda sığdırılır, ortalanır; silgi silmez. */
    let arkaResim = null;
    if(opt.arka){
      const im = new Image();
      im.onload = () => { arkaResim = im; kagitCiz(kc); };
      im.src = typeof opt.arka === 'string' ? opt.arka : ortam.nesneUrl(opt.arka);
    }
    function kagitCiz(hedef){
      hedef.fillStyle = '#fffdf8'; hedef.fillRect(0, 0, kv.width, kv.height);
      if(arkaResim){
        const o2 = Math.min((kv.width - 40) / arkaResim.width, (kv.height - 40) / arkaResim.height);
        const w = arkaResim.width * o2, h = arkaResim.height * o2;
        hedef.drawImage(arkaResim, (kv.width - w) / 2, (kv.height - h) / 2, w, h);
      }
      hedef.strokeStyle = 'rgba(80,110,160,.18)'; hedef.lineWidth = 1.2;
      if(kagit === 'cizgili') for(let y = 72; y < kv.height; y += 44){ hedef.beginPath(); hedef.moveTo(0, y); hedef.lineTo(kv.width, y); hedef.stroke(); }
      if(kagit === 'kareli'){ for(let y = 40; y < kv.height; y += 40){ hedef.beginPath(); hedef.moveTo(0, y); hedef.lineTo(kv.width, y); hedef.stroke(); }
        for(let x = 40; x < kv.width; x += 40){ hedef.beginPath(); hedef.moveTo(x, 0); hedef.lineTo(x, kv.height); hedef.stroke(); } }
    }
    kagitCiz(kc);
    c.lineCap = 'round'; c.lineJoin = 'round';
    const anlik = () => c.getImageData(0, 0, tv.width, tv.height);
    const nokta = e => { const r = tv.getBoundingClientRect(); return [(e.clientX - r.left) * tv.width / r.width, (e.clientY - r.top) * tv.height / r.height]; };
    tv.addEventListener('pointerdown', e => {
      cizer = true; try{ tv.setPointerCapture(e.pointerId); }catch(er){}
      if(geri.length > 30) geri.shift(); geri.push(anlik()); ileri.length = 0;
      son = nokta(e);
      yol = [son];
    });
    /* Fosforlu çizgi TEK PARÇA çizilir: parça parça yarı saydam boyamak
       birleşim yerlerinde koyu düğüm bırakıyordu. Her harekette dokunuştan
       önceki görüntü geri konur, yolun tamamı bir kez boyanır. */
    let yol = [];
    tv.addEventListener('pointermove', e => {
      if(!cizer) return;
      const p = nokta(e), bas = e.pressure && e.pointerType === 'pen' ? 0.4 + e.pressure * 1.2 : 1;
      c.save();
      if(arac === 'fosfor'){
        yol.push(p);
        c.putImageData(geri[geri.length - 1], 0, 0);
        c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.35; c.lineWidth = kalin * 7; c.strokeStyle = renk;
        c.lineCap = 'butt'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(yol[0][0], yol[0][1]); yol.slice(1).forEach(q => c.lineTo(q[0], q[1])); c.stroke();
      }else{
        if(arac === 'silgi'){ c.globalCompositeOperation = 'destination-out'; c.lineWidth = kalin * 6; c.strokeStyle = '#000'; }
        else { c.lineWidth = kalin * bas; c.strokeStyle = renk; }
        c.beginPath(); c.moveTo(son[0], son[1]); c.lineTo(p[0], p[1]); c.stroke();
      }
      c.restore();
      son = p;
    });
    const bitir = () => { cizer = false; };
    tv.addEventListener('pointerup', bitir); tv.addEventListener('pointercancel', bitir);
    const sec = (sel, t) => k.querySelectorAll(sel).forEach(b => { b.classList.toggle('is-secili', b === t); if(b.hasAttribute('role')) b.setAttribute('aria-checked', b === t ? 'true' : 'false'); });
    k.addEventListener('click', e => {
      const t = e.target.closest('button'); if(!t) return;
      if(t.dataset.arac){ arac = t.dataset.arac; sec('[data-arac]', t); return; }
      if(t.dataset.renk){ renk = t.dataset.renk; if(arac === 'silgi'){ arac = 'kalem'; sec('[data-arac]', k.querySelector('[data-arac="kalem"]')); } sec('[data-renk]', t); return; }
      if(t.dataset.kalin){ kalin = Number(t.dataset.kalin); sec('[data-kalin]', t); return; }
      if(t.dataset.kagit){ kagit = t.dataset.kagit; sec('[data-kagit]', t); kagitCiz(kc); return; }
      const is = t.dataset.ciz;
      if(is === 'geri'){ const g = geri.pop(); if(g){ ileri.push(anlik()); c.putImageData(g, 0, 0); } }
      else if(is === 'ileri'){ const g = ileri.pop(); if(g){ geri.push(anlik()); c.putImageData(g, 0, 0); } }
      else if(is === 'temizle'){ geri.push(anlik()); c.clearRect(0, 0, tv.width, tv.height); }
      else if(is === 'vazgec') k.remove();
      else if(is === 'kaydet'){
        /* Kâğıt + yazı tek görüntüde. */
        const s = document.createElement('canvas'); s.width = tv.width; s.height = tv.height;
        const sc = s.getContext('2d'); kagitCiz(sc); sc.drawImage(tv, 0, 0);
        s.toBlob(async b => {
          try{ if(opt.kaydet) await opt.kaydet(b); }catch(er){ uyar((er && er.message) || 'Çizim eklenemedi.'); }
          k.remove();
        }, 'image/png');
      }
    });
    k.addEventListener('keydown', e => { if(e.key === 'Escape'){ e.stopPropagation(); k.remove(); } });
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
    el.addEventListener('keydown', e => {
      if(e.key === 'Enter' && e.target.matches && e.target.matches('[data-defter-klasor-ad]')){ e.preventDefault(); const b = el.querySelector('[data-defter="klasor-kaydet"]'); if(b) b.click(); return; }
      if(e.key === 'Escape' && !document.querySelector('.defter-ciz')){ e.preventDefault(); kapat(); return; }
      if(!(e.ctrlKey || e.metaKey) || !e.target.matches('[data-defter-govde]')) return;
      const k = e.key.toLowerCase();
      const komut = k === 'b' ? 'kalin' : k === 'i' ? 'italik' : k === 'k' ? 'bag' : (k === 'h' && e.shiftKey) ? 'vurgu' : null;
      if(komut){ e.preventDefault(); bicimle(komut); }
    });
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
    el.addEventListener('change', async e => {
      const t = e.target;
      if(t.matches('[data-defter-dosya]')){ dosyalariEkle(t.files); t.value = ''; t.removeAttribute('accept'); return; }
      if(t.matches('[data-defter-yedek]')){
        const f = t.files && t.files[0]; t.value = '';
        if(!f) return;
        f.text().then(m => yedekYukle(JSON.parse(m))).then(r => { ciz(); const y = el.querySelector('[data-defter-alan]'); if(y) y.textContent = r.not + ' not, ' + r.medya + ' medya geri yüklendi; var olanlar ezilmedi.'; })
          .catch(er => { const y = el.querySelector('[data-defter-alan]'); if(y) y.textContent = (er && er.message) || 'Yedek okunamadı.'; });
        return;
      }
      if(t.matches('[data-defter-not-klasor]')){
        const n = notBul(secili); if(!n) return;
        let v = t.value;
        if(v === '__yeni'){ const y = window.prompt('Yeni klasörün adı (alt klasör için «Sağlık/Uyku»)', ''); v = y == null ? n.klasor : klasorAdi(y); if(v) await klasorEkle(v); }
        n.klasor = klasorAdi(v); kaydet(n).then(ciz); return;
      }
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
      if(ac_){ e.preventDefault(); const id = ac_.getAttribute('data-defter-ac'); if(secili && secili !== id) await bosSil(secili);
        secili = id; duzen = false; gorunum = 'liste'; ciz(); return; }
      const kl = t.closest('[data-defter-klasor]');
      if(kl){ const v = kl.getAttribute('data-defter-klasor'); klasor = v === '*' ? null : v; arama = ''; const a = el.querySelector('[data-defter-ara]'); if(a) a.value = '';
        ciz(); return; }
      const agd = t.closest('[data-defter-ag]');
      if(agd){ const is = agd.getAttribute('data-defter-ag'), s = el.querySelector('[data-defter-ag-svg]');
        if(is === 'etiket') agAyar.etiket = !agAyar.etiket;
        else if(is === 'bagsiz') agAyar.bagsizGizle = !agAyar.bagsizGizle;
        else if(is === 'cevre') agAyar.cevre = !agAyar.cevre;
        else { if(s && s.__ag){ if(is === 'buyut') s.__ag.olcek(1 / 1.25); else if(is === 'kucult') s.__ag.olcek(1.25); else s.__ag.sigdir(); } return; }
        ciz(); return; }
      const git = t.closest('[data-defter-git]');
      if(git){ e.preventDefault(); const b = git.getAttribute('data-defter-git'); let n = baslikBul(b); if(!n) n = await yeni(b, ''); secili = n.id; duzen = !n.govde; ciz(); return; }
      const et = t.closest('[data-defter-etiket]');
      if(et){ arama = '#' + et.getAttribute('data-defter-etiket'); const a = el.querySelector('[data-defter-ara]'); if(a) a.value = arama; ciz(); return; }
      const ekr = t.closest('[data-defter-ekran]');
      if(ekr){ const b = ekr.getAttribute('data-defter-ekran'); const x = window.LIFEOS.NOTUM.liste().find(y => y.baglam === b); kapat();
        try{ if(x && typeof x.ac === 'function') x.ac(); else if(window.LIFEOS.NOTUM && ayar.ekranAc) ayar.ekranAc(b); }catch(er){ console.error(er); } return; }
      const sb = t.closest('[data-defter-sablon]');
      if(sb){ const n0 = notBul(secili), sab = SABLONLAR.find(x => x.id === sb.getAttribute('data-defter-sablon'));
        if(n0 && sab){ n0.govde = sab.govde; if(!n0.baslik) n0.baslik = sab.ad; await kaydet(n0); ciz(); } return; }
      const ind = t.closest('[data-defter-indir]');
      if(ind){ const k = await medya.al(ind.getAttribute('data-defter-indir')); if(k) ortam.indir(k.ad, k.blob); return; }
      const d = t.closest('[data-defter]');
      if(!d) return;
      const is = d.getAttribute('data-defter'), n = notBul(secili);
      if(is === 'kapat'){ kapat(); return; }
      if(is === 'yedek-al'){ const r = await yedekAl(); const y = el.querySelector('[data-defter-alan]'); if(y) y.textContent = r.not + ' not ve ' + r.medya + ' medya «' + r.ad + '» dosyasına yedeklendi.'; return; }
      if(is === 'yedek-yukle'){ const f = el.querySelector('[data-defter-yedek]'); if(f) f.click(); return; }
      if(is === 'gorunum'){ gorunum = gorunum === 'ag' ? 'liste' : 'ag'; ciz(); return; }
      if(is === 'klasor-yeni'){ klasorYeni = true; ciz(); const i = el.querySelector('[data-defter-klasor-ad]'); if(i) try{ i.focus(); }catch(er){} return; }
      if(is === 'klasor-kaydet'){ const i = el.querySelector('[data-defter-klasor-ad]'); const k = await klasorEkle(i ? i.value : ''); klasorYeni = false; if(k) klasor = k; ciz(); return; }
      if(is === 'klasor-ad' && klasor){ const y = window.prompt('Klasörün yeni adı', klasor); if(y != null && klasorAdi(y)){ await klasorTasi(klasor, y); klasor = klasorAdi(y); } ciz(); return; }
      if(is === 'klasor-sil' && klasor){ if(d.dataset.onay !== '1'){ d.dataset.onay = '1'; d.textContent = 'Emin misin? Notlar klasörsüze geçer'; return; }
        await klasorSil(klasor); klasor = null; ciz(); return; }
      if(is === 'yeni'){ if(secili) await bosSil(secili); const x = await yeni('', ''); secili = x.id; duzen = true; gorunum = 'liste'; ciz(); const b = el.querySelector('[data-defter-baslik]'); if(b) try{ b.focus(); }catch(er){} return; }
      if(is === 'liste'){ if(secili) await bosSil(secili); secili = null; ciz(); return; }
      if(!n) return;
      if(is === 'oku' || is === 'yaz' || is === 'kip'){
        const ta = el.querySelector('[data-defter-govde]'); if(ta){ n.govde = ta.value; await kaydet(n); }
        duzen = is === 'kip' ? !duzen : is === 'yaz'; ciz(); return; }
      if(/^f-/.test(is)){ bicimle(is.slice(2)); return; }
      if(is === 'sabit'){ n.sabit = !n.sabit; await kaydet(n); ciz(); return; }
      if(is === 'sil'){ if(d.dataset.onay !== '1'){ d.dataset.onay = '1'; d.textContent = 'Emin misin? Sil'; return; } await sil(n.id); secili = null; ciz(); return; }
      if(is === 'aktar'){ const m = await disaAktarMetni(n); ortam.indir((n.baslik || 'not').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60) + '.md', new Blob([m], { type:'text/markdown;charset=utf-8' })); return; }
      if(is === 'resim' || is === 'video' || is === 'dosya'){ const f = el.querySelector('[data-defter-dosya]'); if(f){ f.accept = is === 'resim' ? 'image/*' : is === 'video' ? 'video/*' : ''; f.click(); } return; }
      if(is === 'ciz'){ cizimAc(); return; }
      if(is === 'ses'){ sesKaydi(d); return; }
      if(is === 'bag'){ if(document.querySelector('[data-defter-govde]')) bicimle('bag'); else { govdeyeEkle('[[Not adı]]'); ciz(); } return; }
      if(is === 'kutu'){ govdeyeEkle('- [ ] '); ciz(); return; }
    });
  }

  function kur(o){ ayar = Object.assign({ modul:'' }, o || {}); db = null; }
  function _sifirla(){ ayar = null; notlar = []; secili = null; duzen = false; arama = ''; db = null; klasor = null; gorunum = 'liste';
    klasorYeni = false; bosKlasorler = []; agAyar.etiket = false; agAyar.bagsizGizle = false; agAyar.cevre = false; kapat(); }

  return { kur, yukle, ac, kapat, yeni, belgeOlustur, dosyalarEkle, rafHtml, rafBagla, kaydet, sil, md, baglantilar, etiketler, geriBaglantilar, ara, kutuCevir,
    medyaEkle, medya, disaAktarMetni, SABLONLAR, sayim, sar, satirOnek, tuval, notOlustur, yedekNesnesi, yedekYukle, yedekAl, alan, kac, notlar:() => notlar.slice(), sec:id => { secili = id; }, duzenle:v => { duzen = !!v; },
    kuruluMu:() => !!ayar, _ortam:ortam, _sifirla, _db:v => { db = v; },
    klasorAdi, klasorler, klasordeki, klasorEkle, klasorTasi, klasorSil, bosSil, agVeri, yerlesim, klasorSec:k => { klasor = k; },
    notTasi, rafKlasor:() => rafKlasor, rafKlasorSec:k => { rafKlasor = klasorAdi(k); rafTasi = null; rafKlasorYeni = false; } };
})();
