/* BİLİNÇ HARİTASI — Ana sayfa › Kişisel araçlar (2026-11-09, depo sahibinin isteği).

   Kişinin kendi düşünceleri: yazar, konuya göre gruplar, [[Başlık]] ile birbirine
   bağlar ([[!Başlık]] = «bununla çelişir»), harita olarak görür. Saf katman: depo,
   ağ, yerleşim, düşünce profili ve King'e gidecek satırlar. Hiçbir şey uydurmaz;
   profil yalnız kişinin yazdığından sayılır. Kabul testi: tools/bilinc_kabul_test.py

     temiz(v)            herhangi bir kayıt → { dusunceler:[…], izin:bool }
     yeni(d, o)          yeni düşünce ekler, döner: düşünce
     ag(d)               { dugum:[{id,derece}], kenar:[{a,b,tur:'bag'|'celiski'|'etiket'}] }
     yerlesim(d, g, w,h) id → {x,y}; aynı veri aynı resmi verir (rastgele yok)
     profil(d)           konular, türler, merkez düşünceler, kesin inançlar, açık sorular, çelişkiler
     kisiKayitlari(d)    King'in kişi modeline giden kayıtlar (alan gorus/deger: yalnız King görür)
     kingSatirlar(d,id,s) bir düşünce + komşuları + soru → King'in bağlamı (satır ≤160)
     haritaSvg(d,g,yer,o) haritanın SVG'si */
window.LIFEOS = window.LIFEOS || {};

LIFEOS.Bilinc = (function(){
  'use strict';
  const TURLER = Object.freeze([
    { id:'fikir', ad:'Fikir' }, { id:'inanc', ad:'İnanç' }, { id:'soru', ad:'Soru' },
    { id:'karar', ad:'Karar' }, { id:'his', ad:'His' },
  ]);
  const TUR_ID = TURLER.map(t => t.id);
  const SINIR = { dusunce:300, baslik:80, metin:2000, konu:40, etiket:8, sohbet:24, soz:1200 };
  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
  const tek = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
  const sayi = (n, a, b, v) => { n = Math.round(Number(n)); return isFinite(n) ? Math.max(a, Math.min(b, n)) : v; };

  function temizDusunce(x){
    if(!x || typeof x !== 'object') return null;
    const baslik = tek(x.baslik, SINIR.baslik);
    if(!baslik) return null;
    return {
      id:tek(x.id, 24) || ('d' + Date.now().toString(36)),
      baslik,
      metin:String(x.metin == null ? '' : x.metin).slice(0, SINIR.metin),
      konu:tek(x.konu, SINIR.konu),
      etiket:(Array.isArray(x.etiket) ? x.etiket : []).map(e => kucuk(e).replace(/^#/, '').slice(0, 30)).filter((e, i, l) => e && l.indexOf(e) === i).slice(0, SINIR.etiket),
      tur:TUR_ID.indexOf(x.tur) >= 0 ? x.tur : 'fikir',
      kesinlik:sayi(x.kesinlik, 1, 5, 3),
      zaman:sayi(x.zaman, 0, 1e14, 0),
      sohbet:(Array.isArray(x.sohbet) ? x.sohbet : []).filter(m => m && (m.kim === 'sen' || m.kim === 'king') && tek(m.metin, 1))
        .slice(-SINIR.sohbet).map(m => ({ kim:m.kim, metin:String(m.metin).slice(0, SINIR.soz), zaman:sayi(m.zaman, 0, 1e14, 0), model:m.kim === 'king' && m.model ? tek(m.model, 60) : undefined })),
    };
  }
  function temiz(v){
    const l = v && Array.isArray(v.dusunceler) ? v.dusunceler : [], gor = {}, out = [];
    l.forEach(x => { const d = temizDusunce(x); if(d && !gor[d.id] && out.length < SINIR.dusunce){ gor[d.id] = 1; out.push(d); } });
    return { dusunceler:out, izin:!(v && v.izin === false) };
  }
  function yeni(d, o){
    if(d.dusunceler.length >= SINIR.dusunce) return null;
    let id, n = 0;
    do { id = 'd' + Date.now().toString(36) + (n++ ? n.toString(36) : ''); } while(d.dusunceler.some(x => x.id === id));
    const x = temizDusunce(Object.assign({}, o, { id, zaman:Date.now(), sohbet:[] }));
    if(x) d.dusunceler.unshift(x);
    return x;
  }

  /* [[Başlık]] bağ, [[!Başlık]] çelişki. */
  function baglar(metin){
    const out = [], re = /\[\[(!?)([^\[\]\n]{1,80})\]\]/g;
    let m;
    while((m = re.exec(String(metin || '')))) out.push({ hedef:kucuk(m[2]), celiski:m[1] === '!' });
    return out;
  }
  function ag(d){
    const l = d.dusunceler, adla = {}, derece = {}, kenar = [], var_ = {};
    l.forEach(x => { adla[kucuk(x.baslik)] = x.id; derece[x.id] = 0; });
    const ekle = (a, b, tur) => {
      if(a === b) return;
      const k = a < b ? a + '|' + b : b + '|' + a;
      if(var_[k] && (var_[k].tur === 'celiski' || tur === 'etiket')) return;
      if(var_[k]){ var_[k].tur = tur; return; }
      const e = { a, b, tur }; var_[k] = e; kenar.push(e); derece[a]++; derece[b]++;
    };
    l.forEach(x => baglar(x.metin).forEach(b => { if(adla[b.hedef]) ekle(x.id, adla[b.hedef], b.celiski ? 'celiski' : 'bag'); }));
    const et = {};
    l.forEach(x => x.etiket.forEach(e => { (et[e] = et[e] || []).push(x.id); }));
    Object.keys(et).forEach(e => { const g = et[e]; if(g.length > 12) return; for(let i = 0; i < g.length; i++) for(let j = i + 1; j < g.length; j++) ekle(g[i], g[j], 'etiket'); });
    return { dugum:l.map(x => ({ id:x.id, derece:derece[x.id] })), kenar };
  }
  /* Bir düşünceye bağlananlar ve onun bağlandıkları. */
  function komsular(d, g, id){
    return g.kenar.filter(e => e.a === id || e.b === id).map(e => ({ id:e.a === id ? e.b : e.a, tur:e.tur }));
  }

  function karma(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function konular(d){
    const say = {};
    d.dusunceler.forEach(x => { const k = x.konu || 'Konusuz'; say[k] = (say[k] || 0) + 1; });
    return Object.keys(say).sort((a, b) => say[b] - say[a] || a.localeCompare(b, 'tr')).map(k => [k, say[k]]);
  }
  /* Kuvvet yerleşimi: konular çemberde öbek merkezi, bağ yay, düğümler birbirini iter. */
  function yerlesim(d, g, w, h){
    const l = d.dusunceler, n = l.length, yer = {}, kon = konular(d).map(k => k[0]), mer = {};
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * (kon.length > 1 ? 0.3 : 0);
    kon.forEach((k, i) => { const a = i / kon.length * Math.PI * 2 - Math.PI / 2; mer[k] = { x:cx + Math.cos(a) * R, y:cy + Math.sin(a) * R }; });
    l.forEach(x => { const m = mer[x.konu || 'Konusuz'], a = karma(x.id) * Math.PI * 2, r = 20 + karma(x.id + 'r') * 60; yer[x.id] = { x:m.x + Math.cos(a) * r, y:m.y + Math.sin(a) * r }; });
    if(n < 2) return yer;
    const ideal = Math.max(46, Math.min(110, Math.sqrt(w * h / n) * 0.62)), dur = Math.min(260, 60 + n * 2);
    for(let t = 0; t < dur; t++){
      const isi = 1 - t / dur, it = {};
      l.forEach(x => { it[x.id] = { x:0, y:0 }; });
      for(let i = 0; i < n; i++) for(let j = i + 1; j < n; j++){
        const a = yer[l[i].id], b = yer[l[j].id];
        let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if(d2 < 0.01){ dx = karma(l[i].id + l[j].id) - 0.5; dy = 0.5 - karma(l[j].id + l[i].id); d2 = 0.5; }
        if(d2 > ideal * ideal * 9) continue;
        const f = ideal * ideal / d2, ux = dx * f, uy = dy * f;
        it[l[i].id].x += ux; it[l[i].id].y += uy; it[l[j].id].x -= ux; it[l[j].id].y -= uy;
      }
      g.kenar.forEach(e => {
        const a = yer[e.a], b = yer[e.b], dx = b.x - a.x, dy = b.y - a.y, dd = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (dd - ideal) / dd * (e.tur === 'etiket' ? 0.06 : 0.14);
        it[e.a].x += dx * f; it[e.a].y += dy * f; it[e.b].x -= dx * f; it[e.b].y -= dy * f;
      });
      l.forEach(x => {
        const p = yer[x.id], m = mer[x.konu || 'Konusuz'], v = it[x.id];
        v.x += (m.x - p.x) * 0.04; v.y += (m.y - p.y) * 0.04;
        const s = Math.sqrt(v.x * v.x + v.y * v.y) || 1, lim = 14 * isi + 0.5;
        p.x = Math.max(64, Math.min(w - 64, p.x + v.x / s * Math.min(s, lim)));   // etiket ortalanir: yanda pay
        p.y = Math.max(24, Math.min(h - 36, p.y + v.y / s * Math.min(s, lim)));
      });
    }
    return yer;
  }

  function profil(d){
    const l = d.dusunceler, g = ag(d), der = {};
    g.dugum.forEach(x => { der[x.id] = x.derece; });
    const bul = id => l.filter(x => x.id === id)[0];
    const tur = {};
    TUR_ID.forEach(t => { tur[t] = 0; });
    l.forEach(x => { tur[x.tur]++; });
    return {
      toplam:l.length,
      bag:g.kenar.filter(e => e.tur !== 'etiket').length,
      konular:konular(d),
      turler:tur,
      merkez:l.filter(x => der[x.id] > 0).sort((a, b) => der[b.id] - der[a.id] || b.zaman - a.zaman).slice(0, 5).map(x => ({ id:x.id, baslik:x.baslik, derece:der[x.id] })),
      kesin:l.filter(x => x.kesinlik >= 4 && (x.tur === 'inanc' || x.tur === 'karar')).sort((a, b) => b.kesinlik - a.kesinlik || b.zaman - a.zaman).slice(0, 5),
      sorular:l.filter(x => x.tur === 'soru').sort((a, b) => b.zaman - a.zaman).slice(0, 5),
      celiski:g.kenar.filter(e => e.tur === 'celiski').map(e => [bul(e.a), bul(e.b)]).filter(c => c[0] && c[1]).slice(0, 5),
      yalniz:g.dugum.filter(x => !x.derece).length,
    };
  }

  const kisa = (s, n) => { s = tek(s, 10000); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
  /* King'in kişi modeline: kişinin kendi yazdığı (katman «soz»). Alanlar yalnız King'e açık. */
  function kisiKayitlari(d){
    if(!d.izin || !d.dusunceler.length) return [];
    const p = profil(d), out = [], ad = id => (TURLER.filter(t => t.id === id)[0] || {}).ad;
    const k = { katman:'soz', kaynak:'bilinc' };
    if(p.konular.length) out.push(Object.assign({ alan:'gorus', metin:kisa('Düşünce haritasında en çok düşündüğü konular: ' + p.konular.slice(0, 5).map(x => x[0]).join(', '), 200) }, k));
    const baskin = TUR_ID.slice().sort((a, b) => p.turler[b] - p.turler[a])[0];
    if(p.toplam >= 5) out.push(Object.assign({ alan:'gorus', metin:'Düşüncelerini çoğunlukla «' + ad(baskin) + '» olarak yazıyor' + (p.celiski.length ? '; kendi çelişkilerini işaretliyor' : '') + '.' }, k));
    p.merkez.slice(0, 3).forEach(x => { const t = l1(d, x.id); out.push(Object.assign({ alan:'gorus', metin:kisa('Merkez düşüncesi «' + x.baslik + '»' + (t ? ': ' + t : ''), 200) }, k)); });
    p.kesin.slice(0, 3).forEach(x => out.push(Object.assign({ alan:'deger', metin:kisa('Emin olduğu ' + ad(x.tur).toLocaleLowerCase('tr-TR') + ': «' + x.baslik + '»' + (x.metin ? ': ' + temizMetin(x.metin) : ''), 200) }, k)));
    p.sorular.slice(0, 2).forEach(x => out.push(Object.assign({ alan:'gorus', metin:kisa('Üzerinde düşündüğü açık soru: «' + x.baslik + '»', 200) }, k)));
    return out.slice(0, 10);
  }
  const temizMetin = s => String(s || '').replace(/\[\[!?([^\[\]\n]{1,80})\]\]/g, '$1').replace(/\s+/g, ' ').trim();
  function l1(d, id){ const x = d.dusunceler.filter(y => y.id === id)[0]; return x ? kisa(temizMetin(x.metin), 110) : ''; }

  /* King'e bir düşünce: kendisi, komşuları, önceki konuşma, soru. Satır ≤160, en çok 16. */
  function kingSatirlar(d, id, soru){
    const x = d.dusunceler.filter(y => y.id === id)[0];
    if(!x) return [];
    const ad = t => (TURLER.filter(z => z.id === t)[0] || {}).ad, g = ag(d), out = [];
    out.push(kisa('Düşünce (' + ad(x.tur) + ', kesinlik ' + x.kesinlik + '/5' + (x.konu ? ', konu ' + x.konu : '') + '): «' + x.baslik + '»', 160));
    const m = temizMetin(x.metin);
    for(let i = 0; i < m.length && out.length < 6; i += 150) out.push('Metin: ' + m.slice(i, i + 150));
    komsular(d, g, id).slice(0, 4).forEach(k => { const y = d.dusunceler.filter(z => z.id === k.id)[0];
      if(y) out.push(kisa((k.tur === 'celiski' ? 'Çelişkili bulduğu düşünce: «' : 'Bağlı düşünce: «') + y.baslik + '»' + (y.metin ? ': ' + temizMetin(y.metin) : ''), 160)); });
    x.sohbet.slice(-3).forEach(s => out.push(kisa((s.kim === 'king' ? 'King daha önce: ' : 'Kullanıcı daha önce: ') + s.metin, 160)));
    if(tek(soru, 1)) out.push(kisa('Kullanıcının sorusu: ' + tek(soru, 400), 160));
    return out.slice(0, 16);
  }

  /* Bu düşünceye [[bağ]] verenler (geri bağlar, Defter'deki gibi). */
  function geriBaglar(d, id){
    const x = d.dusunceler.filter(y => y.id === id)[0];
    if(!x) return [];
    const ad = kucuk(x.baslik);
    return d.dusunceler.filter(y => y.id !== id && baglar(y.metin).some(b => b.hedef === ad))
      .map(y => ({ id:y.id, baslik:y.baslik, celiski:baglar(y.metin).some(b => b.hedef === ad && b.celiski) }));
  }
  /* Metindeki çözülmemiş [[bağ]]lar: tıklanınca yeni düşünce olur. */
  function cozulmemis(d, metin){
    const var_ = {};
    d.dusunceler.forEach(x => { var_[kucuk(x.baslik)] = 1; });
    return baglar(metin).filter((b, i, l) => !var_[b.hedef] && l.findIndex(c => c.hedef === b.hedef) === i).map(b => b.hedef);
  }
  /* [[ yazarken öneri: baştan eşleşen önce, en çok n. */
  function oneriler(d, q, haric, n){
    q = kucuk(q);
    const l = d.dusunceler.filter(x => x.id !== haric && (!q || kucuk(x.baslik).indexOf(q) >= 0));
    l.sort((a, b) => (kucuk(a.baslik).indexOf(q) === 0 ? 0 : 1) - (kucuk(b.baslik).indexOf(q) === 0 ? 0 : 1) || b.zaman - a.zaman);
    return l.slice(0, n || 6).map(x => ({ id:x.id, baslik:x.baslik }));
  }
  /* Arama: başlık, metin, konu, etiket; boş sorgu = hepsi. */
  function ara(d, q){
    q = kucuk(q);
    if(!q) return null;
    return d.dusunceler.filter(x => [x.baslik, x.metin, x.konu, x.etiket.join(' ')].some(t => kucuk(t).indexOf(q) >= 0)).map(x => x.id);
  }
  /* King'e bütün harita: profilin kendisi (sayılar koddan). */
  function haritaSatirlar(d){
    const p = profil(d), out = [];
    if(!p.toplam) return out;
    out.push('Haritada ' + p.toplam + ' düşünce ve ' + p.bag + ' bağ var; ' + p.yalniz + ' düşünce hiçbir şeye bağlı değil.');
    out.push(kisa('Konular: ' + p.konular.slice(0, 6).map(k => k[0] + ' (' + k[1] + ')').join(', '), 160));
    out.push('Türler: ' + TURLER.filter(t => p.turler[t.id]).map(t => t.ad + ' ' + p.turler[t.id]).join(', '));
    p.merkez.slice(0, 3).forEach(x => out.push(kisa('Merkez düşünce: «' + x.baslik + '» (' + x.derece + ' bağ): ' + l1(d, x.id), 160)));
    p.kesin.slice(0, 3).forEach(x => out.push(kisa('Emin olduğu: «' + x.baslik + '»', 160)));
    p.sorular.slice(0, 3).forEach(x => out.push(kisa('Açık soru: «' + x.baslik + '»', 160)));
    p.celiski.slice(0, 3).forEach(c => out.push(kisa('Kendi işaretlediği çelişki: «' + c[0].baslik + '» ↔ «' + c[1].baslik + '»', 160)));
    return out.slice(0, 16);
  }

  const kac = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  /* Harita: renk konuyu ayırır (en çok 8 renk, sonrası nötr), büyüklük bağ sayısı. */
  function haritaSvg(d, g, yer, o){
    o = o || {};
    const w = o.w || 720, h = o.h || 460, kon = konular(d).map(k => k[0]), sec = o.secili, odak = o.odak || null, bulunan = o.bulunan || null;
    const renk = k => { const i = kon.indexOf(k || 'Konusuz'); return i >= 0 && i < 8 ? 'var(--bh-' + i + ')' : 'var(--text-3)'; };
    const yakin = {};
    if(sec){ yakin[sec] = 1; komsular(d, g, sec).forEach(k => { yakin[k.id] = 1; }); }
    const der = {};
    g.dugum.forEach(x => { der[x.id] = x.derece; });
    const sonuk = id => (sec && !yakin[id]) || (bulunan && bulunan.indexOf(id) < 0) || (odak && ((d.dusunceler.filter(x => x.id === id)[0] || {}).konu || 'Konusuz') !== odak);
    const cizgi = g.kenar.map(e => { const a = yer[e.a], b = yer[e.b]; if(!a || !b) return '';
      return '<line class="bh-k bh-k--' + e.tur + (sonuk(e.a) || sonuk(e.b) ? ' is-sonuk' : '') + '" x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }).join('');
    const nokta = d.dusunceler.map(x => { const p = yer[x.id]; if(!p) return '';
      const r = 6 + Math.min(10, (der[x.id] || 0) * 1.6);
      return '<g class="bh-d' + (x.id === sec ? ' is-secili' : '') + (sonuk(x.id) ? ' is-sonuk' : '') + '" data-bh-sec="' + kac(x.id) + '" tabindex="0" role="button" aria-label="' + kac(x.baslik + ', ' + (der[x.id] || 0) + ' bağ') + '" transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')">'
        + '<circle r="' + r.toFixed(1) + '" style="--r:' + renk(x.konu) + '"' + (x.tur === 'soru' ? ' class="is-soru"' : '') + '/>'
        + '<text y="' + (r + 13).toFixed(1) + '">' + kac(kisa(x.baslik, 22)) + '</text></g>'; }).join('');
    return '<svg class="bh-svg" viewBox="' + (o.vb || '0 0 ' + w + ' ' + h) + '" data-w="' + w + '" data-h="' + h + '" role="group" aria-label="Bilinç haritası: ' + d.dusunceler.length + ' düşünce, ' + g.kenar.length + ' bağ">' + cizgi + nokta + '</svg>';
  }

  return { TURLER, SINIR, temiz, yeni, baglar, ag, komsular, geriBaglar, cozulmemis, oneriler, ara, konular, yerlesim, profil, kisiKayitlari, kingSatirlar, haritaSatirlar, haritaSvg, temizMetin, kucuk };
})();
if(typeof module !== 'undefined' && module.exports) module.exports = LIFEOS.Bilinc;
