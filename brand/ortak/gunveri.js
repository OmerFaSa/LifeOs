/* GÜN VERİSİ — Gün sayfasının saf veri katmanı (Gün planı F3a).

   Hesap sunucusunun iki cevabını çizilecek biçime çevirir; hiçbir şey
   uydurmaz. Kabul testi: tools/gunveri_kabul_test.py
     serit(tekgun, simdi)    GET /api/hesap/tekgun → günün şeridi (07–23)
     siradaki(serit, simdi)  «Şimdi ne yapsam?» için sıradaki blok
     karne(gunluk, bugun)    GET /api/hesap/gunluk → haftanın hayat karnesi
   Sözler: saat uydurulmaz (tekgun.js söz 2); bayat plan çizilmez, söylenir;
   karnede «kayıt yok» (modül yayınladı, o gün iş yok) ile «veri yok» (modülden
   bilgi yok) ayrıdır; tarih yerel saatle. */
window.LIFEOS = window.LIFEOS || {};

LIFEOS.GunVeri = (function(){
  'use strict';

  const SIRA = ['ays', 'spi', 'esp'];
  const AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };
  const DILIM = ['sabah', 'ogle', 'aksam', 'gece', 'gun'];
  const DURUM = ['bekliyor', 'bitti', 'atlandi', 'vakti'];
  const SAAT_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const SATIRLAR = [['uyku', 'Uyku', 'spi'], ['beslenme', 'Beslenme', 'spi'], ['hareket', 'Hareket', 'spi'],
    ['calisma', 'Çalışma', 'ays'], ['gelisim', 'Gelişim', 'esp']];
  const dk = s => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const iki = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate());
  const tarih = s => { const p = String(s).slice(0, 10).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const simdiDk = s => { const m = String(s).match(/T(\d\d):(\d\d)/); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; };

  function blok(m, b){
    if(!b || typeof b !== 'object' || !b.ad) return null;
    const saat = SAAT_RE.test(b.saat || '') ? b.saat : null;
    return {
      modul:m, ad:String(b.ad).slice(0, 80), alt:b.alt ? String(b.alt).slice(0, 80) : '', saat,
      dilim:DILIM.indexOf(b.dilim) >= 0 && b.dilim !== 'gun' ? b.dilim : 'gun',
      durum:DURUM.indexOf(b.durum) >= 0 ? b.durum : 'bekliyor',
      rota:typeof b.rota === 'string' && /^[a-z]+$/.test(b.rota) ? b.rota : null,
      yuzde:saat ? Math.max(0, Math.min(100, (dk(saat) - 420) / 960 * 100)) : null,
    };
  }

  function serit(tekgun){
    if(!tekgun || typeof tekgun !== 'object') return { baglanti:false, bloklar:[], saatsiz:[], notlar:[], bos:true };
    const liste = Array.isArray(tekgun.moduller) ? tekgun.moduller : [];
    const hepsi = [], notlar = [];
    SIRA.forEach(m => {
      const x = liste.find(y => y && y.modul === m);
      if(!x){ notlar.push(AD[m] + ' henüz plan yayınlamadı.'); return; }
      if(x.bayat || x.gun !== tekgun.tarih){ notlar.push(AD[m] + ' bugün henüz açılmadı.'); return; }
      let v;
      try{ v = JSON.parse(x.icerik); }catch(e){ notlar.push(AD[m] + ' planı okunamadı.'); return; }
      (v && Array.isArray(v.bloklar) ? v.bloklar : []).forEach(b => { const t = blok(m, b); if(t) hepsi.push(t); });
    });
    const bloklar = hepsi.filter(b => b.saat).sort((a, b) => dk(a.saat) - dk(b.saat));
    const saatsiz = hepsi.filter(b => !b.saat).map((b, i) => ({ b, i }))
      .sort((a, b) => (DILIM.indexOf(a.b.dilim) - DILIM.indexOf(b.b.dilim)) || a.i - b.i).map(x => x.b);
    return { baglanti:true, bloklar, saatsiz, notlar, bos:!bloklar.length && !saatsiz.length };
  }

  function siradaki(s, simdi){
    if(!s) return null;
    const su = simdiDk(simdi), acik = b => b.durum === 'bekliyor' || b.durum === 'vakti';
    return s.bloklar.find(b => acik(b) && dk(b.saat) >= su)
      || s.saatsiz.find(b => b.durum === 'vakti')
      || s.bloklar.find(acik)
      || s.saatsiz.find(b => b.durum === 'bekliyor')
      || null;
  }

  function karne(gunluk, bugun){
    const b = tarih(bugun), pzt = new Date(b.getFullYear(), b.getMonth(), b.getDate() - ((b.getDay() + 6) % 7));
    const gunler = [0, 1, 2, 3, 4, 5, 6].map(i => iso(new Date(pzt.getFullYear(), pzt.getMonth(), pzt.getDate() + i)));
    const bugunIso = iso(b);
    const liste = gunluk && Array.isArray(gunluk.moduller) ? gunluk.moduller : [];
    const etkin = (m, g) => m === 'ays' ? (g.dakika > 0 || g.soru > 0) : g.toplam > 0;
    const deger = (m, g) => m === 'ays' ? (typeof g.dakika === 'number' ? g.dakika : null) : (typeof g.toplam === 'number' ? g.toplam : null);
    const satirlar = SATIRLAR.map(([alan, ad, modul]) => {
      const x = modul === 'spi' ? null : liste.find(y => y && y.modul === modul);
      const kadar = x && typeof x.zaman === 'number' ? iso(new Date(x.zaman)) : null;
      const kayit = x && x.gunler && typeof x.gunler === 'object' ? x.gunler : {};
      const hucreler = [], degerler = [];
      gunler.forEach(d => {
        const g = kayit[d];
        degerler.push(x && g && typeof g === 'object' ? deger(modul, g) : null);
        if(d > bugunIso) hucreler.push('gelecek');
        else if(!x) hucreler.push('veri-yok');
        else if(g && typeof g === 'object' && etkin(modul, g)) hucreler.push('yapildi');
        else if(kadar && d > kadar) hucreler.push('veri-yok');
        else hucreler.push('kayit-yok');
      });
      return { alan, ad, modul, hucreler, degerler };
    });
    const i = gunler.indexOf(bugunIso), bugunOzet = {};
    satirlar.forEach(s => { bugunOzet[s.alan] = s.degerler[i]; });
    return { gunler, bugun:i, satirlar, bugunOzet };
  }

  return { serit, siradaki, karne };
})();
