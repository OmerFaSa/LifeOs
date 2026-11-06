/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/gunveri.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* GÜN VERİSİ — Gün sayfasının saf veri katmanı (Gün planı F3a).

   Hesap sunucusunun iki cevabını çizilecek biçime çevirir; hiçbir şey
   uydurmaz. Kabul testi: tools/gunveri_kabul_test.py
     serit(tekgun, simdi)    GET /api/hesap/tekgun → günün şeridi (07–23)
     siradaki(serit, simdi)  «Şimdi ne yapsam?» için sıradaki blok
     karne(gunluk, bugun)    GET /api/hesap/gunluk → haftanın hayat karnesi
   Sözler: saat uydurulmaz (tekgun.js söz 2); bayat plan çizilmez, söylenir;
   karnede «kayıt yok» (modül yayınladı, o gün iş yok) ile «veri yok» (modülden
   bilgi yok) ayrıdır; tarih yerel saatle. */
window.LIFEOS.PARCA.yazilar({
  'ortak.gunveri.on-dakika-yuru':'On dakika yürü',
  'ortak.gunveri.bir-bardak-su-ic':'Bir bardak su iç',
  'ortak.gunveri.pencereyi-ac-bes-derin-nefes':'Pencereyi aç, beş derin nefes',
  'ortak.gunveri.masani-topla':'Masanı topla',
  'ortak.gunveri.birine-iyi-bir-mesaj-yaz':'Birine iyi bir mesaj yaz',
  'ortak.gunveri.yirmi-dakika-kitap-oku':'Yirmi dakika kitap oku',
  'ortak.gunveri.yarim-saat-odakli-calis':'Yarım saat odaklı çalış',
  'ortak.gunveri.kisa-bir-antrenman-yap':'Kısa bir antrenman yap',
  'ortak.gunveri.sik-yaptigin-bir-kart':'Sık yaptığın bir kart',
  'ortak.gunveri.bir-kez-daha-denemeye-deger':'Bir kez daha denemeye değer',
  'ortak.gunveri.henuz-denemedigin-bir-kart':'Henüz denemediğin bir kart',
  'ortak.gunveri.enerjin-dusuk-az-enerji-iste':'Enerjin düşük; az enerji isteyen bir kart',
  'ortak.gunveri.enerjin-yuksek-hareketli-bir':'Enerjin yüksek; hareketli bir kart',
});

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

  /* Serit yerlesimi: saat sirali bloklar sabit genislikte; sagdan tasan sola dayanir,
     cakisan alt siraya iner. Sira modulu degil yeri soyler (modulu renk soyler). */
  function seritYeri(bloklar, gen){
    const g = gen || 20, son = [];
    const yerler = (bloklar || []).map(b => {
      const x = Math.min(b.yuzde == null ? 0 : b.yuzde, 100 - g);
      let serit = 0;
      while(son[serit] > x) serit++;
      son[serit] = x + g;
      return { x, serit, gen:g };
    });
    return { yerler, seritler:Math.max(1, son.length) };
  }

  /* Karne ve donemin ortak cekirdegi: gun listesi icin bes satir, uc hal. */
  function satirKur(gunluk, gunler, bugunIso){
    const liste = gunluk && Array.isArray(gunluk.moduller) ? gunluk.moduller : [];
    const etkin = (m, g) => m === 'ays' ? (g.dakika > 0 || g.soru > 0) : g.toplam > 0;
    const deger = (m, g) => m === 'ays' ? (typeof g.dakika === 'number' ? g.dakika : null) : (typeof g.toplam === 'number' ? g.toplam : null);
    return SATIRLAR.map(([alan, ad, modul]) => {
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
  }

  function karne(gunluk, bugun){
    const b = tarih(bugun), pzt = new Date(b.getFullYear(), b.getMonth(), b.getDate() - ((b.getDay() + 6) % 7));
    const gunler = [0, 1, 2, 3, 4, 5, 6].map(i => iso(new Date(pzt.getFullYear(), pzt.getMonth(), pzt.getDate() + i)));
    const bugunIso = iso(b), satirlar = satirKur(gunluk, gunler, bugunIso);
    const i = gunler.indexOf(bugunIso), bugunOzet = {};
    satirlar.forEach(s => { bugunOzet[s.alan] = s.degerler[i]; });
    return { gunler, bugun:i, satirlar, bugunOzet };
  }

  const sonGunler = (bugun, n) => { const b = tarih(bugun);
    return Array.from({ length:n }, (_, i) => iso(new Date(b.getFullYear(), b.getMonth(), b.getDate() - (n - 1 - i)))); };

  /* Gecmis: son n gun. «kayit yok» bilinen sifirdir; «veri yok» toplama da ortalamaya da girmez.
     sekil: haftanin gunlerine gore ortalama (Pzt..Paz), bilinen gun yoksa null. */
  function donem(gunluk, bugun, n){
    const gunler = sonGunler(bugun, n);
    const satirlar = satirKur(gunluk, gunler, iso(tarih(bugun))).map(s => {
      const bil = s.hucreler.map(h => h === 'yapildi' || h === 'kayit-yok');
      const olcu = s.degerler.map((v, i) => bil[i] ? (v == null ? 0 : v) : null);
      const top = [0, 0, 0, 0, 0, 0, 0], say = [0, 0, 0, 0, 0, 0, 0];
      olcu.forEach((v, i) => { if(v == null) return; const g = (tarih(gunler[i]).getDay() + 6) % 7; top[g] += v; say[g]++; });
      const bilinen = bil.filter(Boolean).length;
      return Object.assign(s, { bilinen, etkin:s.hucreler.filter(h => h === 'yapildi').length,
        toplam:bilinen ? olcu.reduce((a, v) => a + (v || 0), 0) : null,
        sekil:top.map((t, g) => say[g] ? Math.round(t / say[g]) : null) });
    });
    return { gunler, satirlar };
  }

  /* Bugunun plani ve gercegi: modul basina plan, bitti, atlandi, acik. */
  function planGercek(s){
    if(!s) return [];
    const hep = (s.bloklar || []).concat(s.saatsiz || []);
    return SIRA.concat(['gun']).map(m => {
      const l = hep.filter(b => b.modul === m), bitti = l.filter(b => b.durum === 'bitti').length, atlandi = l.filter(b => b.durum === 'atlandi').length;
      return { modul:m, plan:l.length, bitti, atlandi, acik:l.length - bitti - atlandi };
    }).filter(x => x.plan);
  }

  /* Senin girdigin enerji ve ic hava, gun gun; girilmemis gun null. */
  function izDizi(iz, bugun, n){
    const z = iz && typeof iz === 'object' ? iz : {};
    const gunler = sonGunler(bugun, n).map(g => {
      const x = z[g] || {};
      return { gun:g, enerji:Number.isInteger(x.enerji) && x.enerji >= 1 && x.enerji <= 5 ? x.enerji : null, hava:x.hava || null };
    });
    const e = gunler.map(g => g.enerji).filter(v => v != null);
    return { gunler, girilen:e.length, ortalama:e.length ? Math.round(e.reduce((a, v) => a + v, 0) / e.length * 10) / 10 : null };
  }

  /* «Ne yapsam?» destesi. Kural secer (rastgele degil): Laplace orani (evet+1)/(evet+gec+2);
     enerji 1-2 ise az enerjili kart 1,5 kat, cok enerjili yari; 4-5 ise tersi. Esitlikte destedeki sira. */
  const BASLANGIC = [[yz('ortak.gunveri.on-dakika-yuru'), 'az'], [yz('ortak.gunveri.bir-bardak-su-ic'), 'az'], [yz('ortak.gunveri.pencereyi-ac-bes-derin-nefes'), 'az'],
    [yz('ortak.gunveri.masani-topla'), 'az'], [yz('ortak.gunveri.birine-iyi-bir-mesaj-yaz'), 'az'], [yz('ortak.gunveri.yirmi-dakika-kitap-oku'), null],
    [yz('ortak.gunveri.yarim-saat-odakli-calis'), 'cok'], [yz('ortak.gunveri.kisa-bir-antrenman-yap'), 'cok']].map(([ad, enerji]) => ({ ad, enerji, evet:0, gec:0 }));
  function kartCek(deste, enerji, haric){
    const h = haric || [];
    let en = null;
    (Array.isArray(deste) ? deste : []).forEach((k, i) => {
      if(!k || !k.ad || h.indexOf(k.ad) >= 0) return;
      const ev = k.evet || 0, ge = k.gec || 0;
      let p = (ev + 1) / (ev + ge + 2), neden = ev ? yz('ortak.gunveri.sik-yaptigin-bir-kart') : ge ? yz('ortak.gunveri.bir-kez-daha-denemeye-deger') : yz('ortak.gunveri.henuz-denemedigin-bir-kart');
      if(enerji && enerji <= 2 && k.enerji){ p *= k.enerji === 'az' ? 1.5 : 0.5; if(k.enerji === 'az') neden = yz('ortak.gunveri.enerjin-dusuk-az-enerji-iste'); }
      if(enerji && enerji >= 4 && k.enerji){ p *= k.enerji === 'cok' ? 1.5 : 0.5; if(k.enerji === 'cok') neden = yz('ortak.gunveri.enerjin-yuksek-hareketli-bir'); }
      if(!en || p > en.puan) en = { kart:k, sira:i, puan:Math.round(p * 1000) / 1000, neden };
    });
    return en;
  }

  return { serit, seritYeri, siradaki, karne, donem, planGercek, izDizi, kartCek, BASLANGIC };
})();
