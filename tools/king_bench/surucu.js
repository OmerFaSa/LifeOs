// sim.js'in özellik parçası: King'e söylenen cümlenin hangi yola gittiğini yakalar ve onaylar.
module.exports.soyle = async function soyle(page, x){
  return page.evaluate(async ([metin, yol, sonra, hayir]) => {
    const k = LIFEOS.KING, KI = LIFEOS.KING_IC, G = LIFEOS.GIRIS;
    if(!window.__izci){
      window.__izci = { arac:[], chat:0 };
      const ai = KI.aracIsle;
      KI.aracIsle = async (r, m) => { (r && r.arac || []).forEach(a => window.__izci.arac.push(a.ad)); return ai(r, m); };
      const f = window.fetch;
      window.fetch = (u, o) => { if(/\/api\/chat/.test(String(u))) window.__izci.chat++; return f(u, o); };
    }
    const Z = window.__izci; Z.arac = []; Z.chat = 0;
    const son = () => { const a = k.akis().filter(m => m.kim === 'king' && !m.bekliyor); const s = a[a.length - 1];
      return s ? String(s.metin || '') + (s.satirlar ? ' • ' + s.satirlar.slice(0, 4).join(' • ') : '') + (s.onizleme ? ' [' + s.onizleme.metin + ']' : '') : ''; };
    const t0 = performance.now();
    const o = { yol, metin };
    try{
      if(yol === 'giris' && G && G.kuruluMu()){
        const p = G.gonder(metin);
        o.onizleme = p ? String(p.metin || '') : null;
        if(p){ const r = await G.kaydet(); o.cevap = typeof r === 'string' ? r : (r && r.metin) || String(r); o.kaydedildi = true; }
        else o.cevap = (G.durum() || {}).mesaj || '';
      }else{
        o.yol = 'king';
        let r = await k.isle(metin);
        o.tur = r && r.tur;
        o.cevap = son();
        if(r && r.tur === 'sor' && sonra){ o.sonra = sonra; r = await k.isle(sonra); o.tur2 = r && r.tur; o.cevap2 = son(); }
        if(KI.bekleyen && hayir){ o.onizleme = String(KI.bekleyen.metin || ''); await k.isle('hayır'); o.cevapEvet = son(); o.reddetti = true; }
        else if(KI.bekleyen){ o.onizleme = String(KI.bekleyen.metin || ''); await k.isle('evet'); o.cevapEvet = son(); o.kaydedildi = !/kaydedilemedi|yazılamadı/i.test(o.cevapEvet); }
        else if(KI.bekleyenYetki){
          o.yetki = KI.bekleyenYetki.seviye || true;
          await k.isle(KI.bekleyenYetki.seviye === 'buyuk' ? 'onaylıyorum' : 'evet');
          o.cevapEvet = son();
          o.yapildi = !/olmadı|yapamadım|hata|kaydedilemedi/i.test(o.cevapEvet);
        }
        else if(KI.bekleyenGit){ o.gitSoruldu = true; await k.isle('hayır'); }
        else if(KI.bekleyenNiyet){ o.parametreSoruldu = true; await k.isle('vazgeç'); }
      }
    }catch(e){ o.hata = String(e && e.message || e); }
    o.secilen = Z.arac.slice(); o.chat = Z.chat;
    o.ms = Math.round(performance.now() - t0);
    return o;
  }, [x.metin, x.yol, x.sonra || null, !!x.hayir]);
};

// Beklenen yapıldı mı: araç adı seçildi mi, dönüş türü tuttu mu, veri önizlendi mi, Merkez'e mi gitti.
module.exports.uydu = function(o, beklenen){
  return beklenen.some(b => b === 'veri' ? !!o.onizleme
    : b === 'merkez' ? (o.chat > 0 && !o.secilen.length)
    : b.startsWith('tur:') ? (o.tur === b.slice(4) || o.tur2 === b.slice(4))
    : b === 'ayar' ? /^(yetki|ayar)/.test(o.tur || '')
    : o.secilen.includes(b) || o.tur === 'arac' && o.secilen.includes(b));
};

// Haftalık sayfa turu: modülün bütün sayfalarını açar, çizim süresini ve uzun görevleri ölçer.
module.exports.sayfaTuru = async function(page){
  return page.evaluate(async () => {
    const m = LIFEOS.KING_IC.ayar.modul;
    const rotalar = [...new Set((LIFEOS.PARCA_REHBER || []).filter(s => s.modul === m).map(s => s.route)
      .concat([...document.querySelectorAll('[data-act="go"][data-route]')].map(e => e.dataset.route)))];
    const out = [];
    for(const rota of rotalar){
      const uzun = [];
      const po = new PerformanceObserver(l => l.getEntries().forEach(e => uzun.push(Math.round(e.duration))));
      try{ po.observe({ type:'longtask' }); }catch(e){}
      const b = document.createElement('button'); b.dataset.act = 'go'; b.dataset.route = rota; b.style.display = 'none';
      (document.querySelector('.site') || document.body).appendChild(b);
      const hata0 = (window.__sayfaHata || []).length;
      const t0 = performance.now();
      try{ b.click(); }catch(e){ (window.__sayfaHata = window.__sayfaHata || []).push(String(e.message)); }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const ms = Math.round(performance.now() - t0);
      await new Promise(r => setTimeout(r, 250));
      po.disconnect(); b.remove();
      out.push({ rota, ms, uzun:uzun.reduce((a, c) => a + c, 0), dom:document.querySelectorAll('*').length });
    }
    return out;
  });
};
