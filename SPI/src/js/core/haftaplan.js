/* SPİ HAFTALIK PLANLAR — Plan çekmecesinin «Planlar» bölümü.

   Kullanıcı (2026-10-17): «Plan kısmına plan ekle gibi türlü türlü şeyler
   koy: yemek planı …; SPİ'yi profesyonelleştir, minimalistlikten kaçma».
   Seçimi: beslenme, hareket, uyku, su ve alışkanlık + kendi adlandırdığı
   serbest plan.

   Kullanıcı (2026-10-20, gerçek kullanımdan):
     · «günün saati, ya da sabah / öğle / akşam seçilebilsin» → hareket
       günü ve her madde bir ZAMAN taşır: { dilim, saat } (ikisi de isteğe
       bağlı; saat yazılırsa dilimin önüne geçer).
     · «beslenme planında kendi öğünlerim» → öğünler core/ogun.js'ten.
     · «uyku esnek olsun, öğlen 30 dakikalık kısa uyku da» → uyku planı üç
       kipte (her gün aynı · hafta içi/sonu · gün gün) ve planlı kısa uykular.
     · «aynı gün iki kez yürüyüş girilince sistem eksik kalıyor» → madde
       SAYILIDIR (hedef: günde kaç kez) ve bir kayda BAĞLANABİLİR (yürüyüş,
       koşu, seans, öğün, kısa uyku): bağlı madde kayıttan sayılır.

   Sözler:
     1. PLAN TERCİHTİR, ÖLÇÜM DEĞİL. Kullanıcı yazar; kod hiçbir sayıyı
        önermez (SPİ doz önermez, teşhis koymaz — AGENTS §1.5). Tür kapalı
        katalogdur; bozuk değer (saat, dakika, su, hedef) yazılmaz.
     2. UYUM KAYITTAN SAYILIR. Antrenman, uyku, su ve öğün SPİ'nin kendi
        kaydından okunur. Kaydı olmayan gün «yapılmadı» değil «kayıt yok»tur
        (§1.2). Pencere dünden geriye yedi gündür: bugün bitmedi.
     3. UYKU SÜRESİ HESAPLANIR. Yatış–kalkıştan; gece yarısını geçer. Bir
        gece hedefe en çok 30 dakika eksikse «tuttu» sayılır (iş kuralı).
     4. İŞARET KULLANICININDIR. Bağsız madde kullanıcının işaretiyle sayılır;
        hedefi 1 olan maddede ikinci dokunuş kaldırır, hedefi büyük olanda
        sayaç artar (−) ile azalır. İşaret ölçüm yazmaz. Bağlı madde yalnız
        kayıttan sayılır: işaretle kayıt iki kez sayılmasın.
     5. KAYIT GERİ ALINIR. kaydet() önceki hâli döndürür; «Geri al» onu yazar.

   Depo: `haftaplan/<id>`. Yerleşik dört tür tektir; serbest plan çoğalır. */

window.SP = window.SP || {};

SP.HaftaPlan = (function(){
  const STORE = 'haftaplan';
  const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const GUN_AD = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const TURLER = Object.freeze([
    { id:'beslenme', ad:'Beslenme planı', not:'Haftanın öğünleri', tek:true },
    { id:'hareket',  ad:'Hareket planı',  not:'Hangi gün ne kadar', tek:true },
    { id:'uyku',     ad:'Uyku planı',     not:'Yatış, kalkış ve kısa uykular', tek:true },
    { id:'su',       ad:'Su ve alışkanlık', not:'Günlük su ve küçük alışkanlıklar', tek:true },
    { id:'serbest',  ad:'Kendi planın',   not:'Adını sen koy', tek:false },
  ]);
  const TUR_BY_ID = {};
  TURLER.forEach(t => { TUR_BY_ID[t.id] = t; });
  const PENCERE = 7, UYKU_PAY = 30;
  const EN_COK_MADDE = 20, EN_UZUN_METIN = 80, EN_COK_HEDEF = 20;
  const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;

  /* Günün dilimi. Sıralama için kaba bir an taşır; ekranda yalnız adı yazılır. */
  const DILIMLER = Object.freeze([
    { id:'sabah', ad:'Sabah', an:8 * 60 }, { id:'ogle', ad:'Öğle', an:13 * 60 },
    { id:'aksam', ad:'Akşam', an:19 * 60 }, { id:'gece', ad:'Gece', an:22 * 60 },
  ]);
  const DILIM_BY_ID = {};
  DILIMLER.forEach(d => { DILIM_BY_ID[d.id] = d; });

  /* Uyku planının kipleri. */
  const UYKU_KIPLERI = Object.freeze([
    { id:'her',   ad:'Her gün aynı' },
    { id:'hafta', ad:'Hafta içi ve hafta sonu' },
    { id:'gun',   ad:'Gün gün' },
  ]);

  /* Maddenin simgesi — kapalı liste; çizimi ekrandadır (screens/planlar.js). */
  const SIMGELER = Object.freeze(['yildiz', 'su', 'yuruyus', 'kosu', 'esneme', 'kitap', 'ilac', 'meyve',
    'sebze', 'gunes', 'uyku', 'nefes', 'dis', 'ekran', 'kahve']);

  /* Maddenin bağlanabileceği kayıtlar: o gün kaç KEZ kayıt var. */
  const BAGLAR = Object.freeze([
    { id:'yuruyus', ad:'Yürüyüş kaydı' }, { id:'kosu', ad:'Koşu kaydı' },
    { id:'bisiklet', ad:'Bisiklet kaydı' }, { id:'yuzme', ad:'Yüzme kaydı' },
    { id:'hareket', ad:'Her hareket seansı' }, { id:'ogun', ad:'Öğün kaydı' },
    { id:'kestirme', ad:'Kısa uyku kaydı' },
  ]);
  const BAG_BY_ID = {};
  BAGLAR.forEach(b => { BAG_BY_ID[b.id] = b; });

  const U = () => SP.U;
  const S = () => SP.S;
  const binlik = n => Number(n).toLocaleString('tr-TR');
  function gunEkle(iso, n){ return U().iso(U().addDays(U().parse(iso), n)); }
  function gunNo(iso){ return (U().parse(iso).getDay() + 6) % 7; }
  function uid(){ return 'hp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function bugunISO(){ return U().todayISO(); }

  /* ------------------------------------------------------------ zaman */

  function zamanNorm(z){
    if(!z) return null;
    const dilim = DILIM_BY_ID[z.dilim] ? z.dilim : null;
    const saat = SAAT.test(z.saat || '') ? z.saat : null;
    return dilim || saat ? { dilim, saat } : null;
  }
  function zamanYaz(z){
    const n = zamanNorm(z);
    if(!n) return '';
    return n.saat || DILIM_BY_ID[n.dilim].ad;
  }
  /* Sıralama anı (dakika). Zamansız madde günün sonuna düşer. */
  function zamanAn(z){
    const n = zamanNorm(z);
    if(!n) return 24 * 60;
    if(n.saat) return Number(n.saat.slice(0, 2)) * 60 + Number(n.saat.slice(3, 5));
    return DILIM_BY_ID[n.dilim].an;
  }

  /* ------------------------------------------------------------ biçim */

  function ogunler(p){
    const l = SP.Ogun ? SP.Ogun.liste().map(s => [s.id, s.label]) : [['kahvalti', 'Kahvaltı'], ['ogle', 'Öğle'], ['aksam', 'Akşam']];
    /* Planda yazılı ama listede olmayan eski öğün (ör. «ara») kaybolmaz. */
    const ek = {};
    ((p && p.gunler) || []).forEach(g => Object.keys(g || {}).forEach(k => {
      if(String(g[k] || '').trim() && !l.some(x => x[0] === k)) ek[k] = SP.Ogun ? SP.Ogun.ad(k) : k;
    }));
    return l.concat(Object.keys(ek).map(k => [k, ek[k]]));
  }

  function yeni(tur, ad){
    const t = TUR_BY_ID[tur];
    const p = { id:uid(), tur:t ? tur : String(tur || ''), ad:String(ad || (t ? t.ad : '')).slice(0, EN_UZUN_METIN), at:null, guncel:null };
    if(tur === 'beslenme') p.gunler = GUN_KISA.map(() => ({}));
    if(tur === 'hareket') p.gunler = GUN_KISA.map(() => null);
    if(tur === 'uyku'){
      p.kip = 'hafta';
      p.her = { yat:'', kalk:'' };
      p.haftaici = { yat:'', kalk:'' }; p.haftasonu = { yat:'', kalk:'' };
      p.gunluk = GUN_KISA.map(() => ({ yat:'', kalk:'' }));
      p.kestirmeler = [];
    }
    if(tur === 'su'){ p.suMl = null; p.maddeler = []; p.isaret = {}; p.sayac = {}; }
    if(tur === 'serbest'){ p.maddeler = []; p.isaret = {}; p.sayac = {}; }
    return p;
  }
  function yeniMadde(metin){
    return { id:'m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4), metin:String(metin || ''),
      gunler:[], zaman:null, simge:null, hedef:1, bag:null };
  }
  function yeniKestirme(){
    return { id:'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4), ad:'Öğle uykusu', bas:'', dk:null, gunler:[] };
  }
  function kopya(p){ return JSON.parse(JSON.stringify(p)); }

  function uykuKip(p){ return UYKU_KIPLERI.some(k => k.id === p.kip) ? p.kip : 'hafta'; }

  function dogrula(p){
    const h = [];
    if(!p || !TUR_BY_ID[p.tur]) return ['Bilinmeyen plan türü.'];
    const metin = (x, ad) => { if(String(x || '').length > EN_UZUN_METIN) h.push(ad + ' en çok ' + EN_UZUN_METIN + ' harf olur.'); };
    const zamanDogru = (z, ad) => { if(z && z.saat && !SAAT.test(z.saat)) h.push(ad + ': saat 00:00–23:59 biçiminde olur.'); };
    if(p.tur === 'serbest' && !String(p.ad || '').trim()) h.push('Plana bir ad ver.');
    if(p.tur === 'beslenme'){
      if(!Array.isArray(p.gunler) || p.gunler.length !== 7) h.push('Haftanın yedi günü olmalı.');
      else p.gunler.forEach(g => Object.keys(g || {}).forEach(k => metin(g[k], 'Öğün')));
    }
    if(p.tur === 'hareket'){
      if(!Array.isArray(p.gunler) || p.gunler.length !== 7) h.push('Haftanın yedi günü olmalı.');
      else p.gunler.forEach((g, i) => {
        if(!g) return;
        metin(g.ne, 'Hareket');
        if(!String(g.ne || '').trim()) h.push(GUN_AD[i] + ': ne yapacağını yaz.');
        if(!(Number.isFinite(g.dk) && g.dk > 0 && g.dk <= 600)) h.push(GUN_AD[i] + ': süre 1 ile 600 dakika arası olur.');
        zamanDogru(g.zaman, GUN_AD[i]);
      });
    }
    if(p.tur === 'uyku'){
      const blok = (x, ad) => {
        x = x || {};
        if(!SAAT.test(x.yat || '') || !SAAT.test(x.kalk || '')) h.push(ad + ': saatler 00:00–23:59 biçiminde olur.');
        else if(uykuDakika(x.yat, x.kalk) == null) h.push(ad + ': yatış ile kalkış aynı olamaz.');
      };
      const kip = uykuKip(p);
      if(kip === 'her') blok(p.her, 'Her gün');
      if(kip === 'hafta'){ blok(p.haftaici, 'Hafta içi'); blok(p.haftasonu, 'Hafta sonu'); }
      if(kip === 'gun'){
        if(!Array.isArray(p.gunluk) || p.gunluk.length !== 7) h.push('Haftanın yedi günü olmalı.');
        else p.gunluk.forEach((x, i) => blok(x, GUN_AD[i]));
      }
      (p.kestirmeler || []).forEach(k => {
        metin(k.ad, 'Kısa uykunun adı');
        if(!(Number.isFinite(k.dk) && k.dk > 0 && k.dk <= 240)) h.push((k.ad || 'Kısa uyku') + ': süre 1 ile 240 dakika arası olur.');
        if(k.bas && !SAAT.test(k.bas)) h.push((k.ad || 'Kısa uyku') + ': saat 00:00–23:59 biçiminde olur.');
      });
    }
    if(p.tur === 'su' && p.suMl != null && !(Number.isFinite(p.suMl) && p.suMl > 0 && p.suMl <= 10000)) h.push('Su hedefi 1 ile 10.000 ml arası olur.');
    if(p.tur === 'su' || p.tur === 'serbest'){
      const l = p.maddeler || [];
      if(l.length > EN_COK_MADDE) h.push('En çok ' + EN_COK_MADDE + ' madde olur.');
      l.forEach(m => {
        metin(m && m.metin, 'Madde');
        if(!m || !String(m.metin || '').trim()) { h.push('Boş madde olmaz.'); return; }
        const hd = m.hedef == null ? 1 : m.hedef;
        if(!(Number.isInteger(hd) && hd >= 1 && hd <= EN_COK_HEDEF)) h.push(m.metin + ': günde 1 ile ' + EN_COK_HEDEF + ' kez arası olur.');
        if(m.bag && !BAG_BY_ID[m.bag]) h.push(m.metin + ': bilinmeyen kayıt bağı.');
        if(m.simge && SIMGELER.indexOf(m.simge) < 0) h.push(m.metin + ': bilinmeyen simge.');
        zamanDogru(m.zaman, m.metin);
      });
    }
    return h;
  }

  /* Yatış–kalkış → dakika (hesaplandı). Aynı saat: süre yok. */
  function uykuDakika(yat, kalk){
    if(!SAAT.test(yat || '') || !SAAT.test(kalk || '')) return null;
    const dk = s => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
    const f = (dk(kalk) - dk(yat) + 1440) % 1440;
    return f === 0 ? null : f;
  }
  function sureYaz(dk){
    if(dk == null) return '—';
    const s = Math.floor(dk / 60), d = dk % 60;
    return (s ? s + ' sa' : '') + (s && d ? ' ' : '') + (d ? d + ' dk' : '');
  }
  function uykuOf(p, iso){
    const kip = uykuKip(p), g = gunNo(iso);
    if(kip === 'her') return p.her;
    if(kip === 'gun') return (p.gunluk || [])[g];
    return g >= 5 ? p.haftasonu : p.haftaici;
  }
  function bugunKestirmeleri(p, iso){
    const g = gunNo(iso);
    return (p.kestirmeler || []).filter(k => !(k.gunler && k.gunler.length) || k.gunler.indexOf(g) >= 0);
  }

  /* ------------------------------------------------------------ maddeler */

  function bugunMaddeleri(p, iso){
    const g = gunNo(iso);
    return (p.maddeler || []).filter(m => !(m.gunler && m.gunler.length) || m.gunler.indexOf(g) >= 0)
      .map((m, i) => ({ m, i })).sort((a, b) => zamanAn(a.m.zaman) - zamanAn(b.m.zaman) || a.i - b.i).map(o => o.m);
  }
  const hedefOf = m => (m && Number.isInteger(m.hedef) && m.hedef >= 1) ? m.hedef : 1;

  /* Bağlı kaydın o günkü sayısı (ölçüldü). */
  function kayitSay(bag, iso){
    const w = (S().workouts || []).filter(x => x && x.date === iso);
    if(bag === 'hareket') return w.length;
    if(bag === 'ogun') return ((S().meals || {})[iso] || []).length;
    if(bag === 'kestirme') return SP.Uyku ? SP.Uyku.liste(iso).length : 0;
    return w.filter(x => (x.items || []).some(it => it && it.exId === bag)).length;
  }
  /* Maddenin o günkü sayısı: { n, hedef, tamam, kaynak }. */
  function sayim(p, m, iso){
    const hedef = hedefOf(m);
    let n, kaynak;
    if(m.bag && BAG_BY_ID[m.bag]){ n = kayitSay(m.bag, iso); kaynak = 'kayit'; }
    else if(hedef > 1){ n = Number((((p.sayac || {})[iso]) || {})[m.id]) || 0; kaynak = 'isaret'; }
    else { n = ((p.isaret || {})[iso] || []).indexOf(m.id) >= 0 ? 1 : 0; kaynak = 'isaret'; }
    return { n, hedef, tamam:n >= hedef, kaynak };
  }
  function isaretli(p, iso){
    return (p.maddeler || []).filter(m => sayim(p, m, iso).tamam).map(m => m.id);
  }
  function budama(p, iso){
    const sinir = gunEkle(iso, -60);
    ['isaret', 'sayac'].forEach(k => Object.keys(p[k] || {}).forEach(d => { if(d < sinir) delete p[k][d]; }));
  }
  /* Dokunuş: hedefi 1 olan madde aç/kapa; büyük hedefte +1 (fark −1 azaltır). */
  function isaretle(p, maddeId, iso, fark){
    const m = (p.maddeler || []).find(x => x.id === maddeId);
    if(m && m.bag) return p;                       // bağlı madde yalnız kayıttan (söz 4)
    if(m && hedefOf(m) > 1){
      p.sayac = p.sayac || {};
      const g = p.sayac[iso] || {};
      const n = Math.max(0, Math.min(99, (Number(g[maddeId]) || 0) + (fark == null ? 1 : fark)));
      if(n) g[maddeId] = n; else delete g[maddeId];
      p.sayac[iso] = g;
      if(!Object.keys(g).length) delete p.sayac[iso];
    }else{
      p.isaret = p.isaret || {};
      const l = p.isaret[iso] || [];
      p.isaret[iso] = l.indexOf(maddeId) >= 0 ? l.filter(x => x !== maddeId) : l.concat([maddeId]);
      if(!p.isaret[iso].length) delete p.isaret[iso];
    }
    /* Yalnız son 60 gün tutulur: işaret bir günlüktür, arşiv değil. */
    budama(p, iso);
    return p;
  }
  /* Bir maddenin son yedi günü (dünden geriye): [{ gun, durum:'tamam'|'eksik'|'yok'|'gun-degil' }]. */
  function maddeGecmisi(p, m, iso){
    return pencere(iso || bugunISO()).map(d => {
      const g = gunNo(d);
      if(m.gunler && m.gunler.length && m.gunler.indexOf(g) < 0) return { gun:d, durum:'gun-degil' };
      const s = sayim(p, m, d);
      return { gun:d, durum:s.tamam ? 'tamam' : s.n > 0 ? 'eksik' : 'yok', n:s.n };
    });
  }

  /* ------------------------------------------------------------ bugün */

  function bugun(p, iso){
    iso = iso || bugunISO();
    const g = gunNo(iso);
    if(p.tur === 'beslenme'){
      const d = (p.gunler || [])[g] || {};
      const l = ogunler(p).filter(([k]) => String(d[k] || '').trim()).map(([k, ad]) => ad + ': ' + d[k].trim());
      return { metin:l.length ? l.join(' · ') : 'Bugün için öğün yazılmamış', etiket:null };
    }
    if(p.tur === 'hareket'){
      const d = (p.gunler || [])[g];
      const z = d ? zamanYaz(d.zaman) : '';
      return { metin:d ? d.ne + ' · ' + d.dk + ' dk' + (z ? ' · ' + z : '') : 'Bugün dinlenme günü', etiket:null };
    }
    if(p.tur === 'uyku'){
      const x = uykuOf(p, iso) || {};
      const dk = uykuDakika(x.yat, x.kalk);
      const k = bugunKestirmeleri(p, iso).map(y => y.ad + (y.bas ? ' ' + y.bas : '') + ' · ' + y.dk + ' dk');
      const ana = dk == null ? 'Saatler yazılmamış' : x.yat + ' yat · ' + x.kalk + ' kalk (' + sureYaz(dk) + ')';
      return { metin:ana + (k.length ? ' · ' + k.join(' · ') : ''), etiket:dk == null ? null : 'hesaplandı' };
    }
    if(p.tur === 'su'){
      const v = S().vitals && S().vitals[iso];
      const ml = v && v.water != null ? Number(v.water) : null;
      const hedef = p.suMl;
      let metin;
      if(hedef == null) metin = ml == null ? 'Su hedefi yazılmamış' : 'Su ' + binlik(ml) + ' ml';
      else metin = ml == null ? 'Su: bugün kayıt yok · hedef ' + binlik(hedef) + ' ml' : 'Su ' + binlik(ml) + ' / ' + binlik(hedef) + ' ml';
      const m = bugunMaddeleri(p, iso);
      if(m.length) metin += ' · ' + isaretli(p, iso).filter(id => m.some(x => x.id === id)).length + ' / ' + m.length + ' alışkanlık';
      return { metin, etiket:ml == null ? 'veri yok' : 'ölçüldü' };
    }
    const m = bugunMaddeleri(p, iso);
    return { metin:m.length ? 'Bugün ' + isaretli(p, iso).filter(id => m.some(x => x.id === id)).length + ' / ' + m.length + ' madde' : 'Bugün madde yok', etiket:null };
  }

  /* ------------------------------------------------------------ uyum */

  function pencere(iso){
    const l = [];
    for(let i = PENCERE; i >= 1; i--) l.push(gunEkle(iso, -i));
    return l;
  }
  function uyum(p, iso){
    iso = iso || bugunISO();
    const gunler = pencere(iso);
    if(p.tur === 'hareket'){
      let planli = 0, tuttu = 0, eksik = 0, kayitYok = 0;
      gunler.forEach(d => {
        const plan = (p.gunler || [])[gunNo(d)];
        if(!plan) return;
        planli++;
        const w = (S().workouts || []).filter(x => x && x.date === d);
        if(!w.length){ kayitYok++; return; }
        const dk = w.reduce((a, x) => a + (Number(x.minutes) || 0), 0);
        if(dk >= plan.dk) tuttu++; else eksik++;
      });
      if(!planli) return { planli, tuttu, eksik, kayitYok, metin:'Son 7 günde planlı gün yok', etiket:'veri yok' };
      /* Sayıya ek getirilmez («0’ında», «4’ünde» sayıya göre değişir): parçalı yazılır. */
      const parca = [planli + ' planlı gün', tuttu + ' tuttu'];
      if(eksik) parca.push(eksik + ' gün eksik');
      if(kayitYok) parca.push(kayitYok + ' gün kayıt yok');
      return { planli, tuttu, eksik, kayitYok, metin:'Son 7 gün: ' + parca.join(' · '), etiket:planli > kayitYok ? 'ölçüldü' : 'veri yok' };
    }
    if(p.tur === 'uyku'){
      let kayitli = 0, tuttu = 0, kPlanli = 0, kTuttu = 0;
      gunler.forEach(d => {
        const v = S().vitals && S().vitals[d];
        const x = uykuOf(p, d) || {};
        const hedef = uykuDakika(x.yat, x.kalk);
        if(v && v.sleep != null && hedef != null){
          kayitli++;
          if(Number(v.sleep) * 60 >= hedef - UYKU_PAY) tuttu++;
        }
        const kp = bugunKestirmeleri(p, d);
        if(kp.length){
          kPlanli += kp.length;
          kTuttu += Math.min(kp.length, SP.Uyku ? SP.Uyku.liste(d).length : 0);
        }
      });
      const kMetin = kPlanli ? ' · kısa uyku ' + kTuttu + ' / ' + kPlanli + ' kayıtlı' : '';
      return kayitli ? { kayitli, tuttu, kPlanli, kTuttu, metin:'Son 7 gün: ' + kayitli + ' gece kayıtlı · ' + tuttu + ' gece hedefte' + kMetin, etiket:'ölçüldü' }
        : { kayitli, tuttu, kPlanli, kTuttu, metin:'Son 7 günde uyku kaydı yok' + kMetin, etiket:'veri yok' };
    }
    if(p.tur === 'su'){
      let kayitli = 0, tuttu = 0;
      gunler.forEach(d => {
        const v = S().vitals && S().vitals[d];
        if(!v || v.water == null) return;
        kayitli++;
        if(p.suMl != null && Number(v.water) >= p.suMl) tuttu++;
      });
      if(!kayitli) return { kayitli, tuttu, metin:'Son 7 günde su kaydı yok', etiket:'veri yok' };
      return { kayitli, tuttu, metin:p.suMl == null ? 'Son 7 gün: ' + kayitli + ' günde su kaydı var'
        : 'Son 7 gün: ' + kayitli + ' gün kayıtlı · ' + tuttu + ' gün hedefte', etiket:'ölçüldü' };
    }
    if(p.tur === 'beslenme'){
      /* Yemeğin adı kayıtla eşleştirilmez (tahmin olurdu); yalnız öğün kaydı olan gün sayılır. */
      const kayitli = gunler.filter(d => ((S().meals || {})[d] || []).length).length;
      return { kayitli, metin:kayitli ? 'Son 7 gün: ' + kayitli + ' günde öğün kaydı var' : 'Son 7 günde öğün kaydı yok', etiket:kayitli ? 'ölçüldü' : 'veri yok' };
    }
    let toplam = 0, yapilan = 0;
    gunler.forEach(d => {
      const m = bugunMaddeleri(p, d);
      toplam += m.length;
      yapilan += isaretli(p, d).filter(id => m.some(x => x.id === id)).length;
    });
    return { toplam, yapilan, metin:toplam ? 'Son 7 gün: ' + yapilan + ' / ' + toplam + ' işaretli' : 'Son 7 günde madde yok', etiket:toplam ? 'ölçüldü' : 'veri yok' };
  }

  /* ------------------------------------------------------------ depo */

  function liste(){ return S().haftaplan || (S().haftaplan = []); }
  function bul(tur){ return liste().find(p => p.tur === tur) || null; }
  function bulId(id){ return liste().find(p => p.id === id) || null; }
  async function yukle(){
    S().haftaplan = ((await SP.Store.list(STORE)) || []).filter(p => p && p.id && TUR_BY_ID[p.tur]);
    return S().haftaplan;
  }
  async function kaydet(p){
    const h = dogrula(p);
    if(h.length) return { ok:false, why:h[0], hatalar:h };
    const l = liste();
    const t = TUR_BY_ID[p.tur];
    /* Yerleşik tür tektir: aynı türün öteki kaydının yerine geçer. */
    const eski = t.tek ? l.find(x => x.tur === p.tur) || null : l.find(x => x.id === p.id) || null;
    const yeniP = kopya(p);
    if(eski) yeniP.id = eski.id;
    yeniP.at = (eski && eski.at) || new Date().toISOString();
    yeniP.guncel = new Date().toISOString();
    S().haftaplan = l.filter(x => x.id !== yeniP.id).concat([yeniP]);
    await SP.Store.set(STORE + '/' + yeniP.id, yeniP);
    return { ok:true, plan:yeniP, onceki:eski ? kopya(eski) : null };
  }
  /* Geri al: önceki hâl yazılır; önceki yoksa kayıt silinir. */
  async function geriAl(r){
    if(!r || !r.plan) return false;
    if(r.onceki){
      S().haftaplan = liste().filter(x => x.id !== r.onceki.id).concat([kopya(r.onceki)]);
      await SP.Store.set(STORE + '/' + r.onceki.id, r.onceki);
    }else await sil(r.plan.id);
    return true;
  }
  async function sil(id){
    const p = bulId(id);
    if(!p) return null;
    S().haftaplan = liste().filter(x => x.id !== id);
    if(SP.Store.remove) await SP.Store.remove(STORE + '/' + id);
    return p;
  }

  /* ------------------------------------------------ plandan seans

     2026-10-25 sürtünme turu: «Yürüyüş · 30 dk» satırından kayıt
     girilemiyordu; seans ayrıca, üç adımda yazılıyordu. «Yaptım» planın
     KENDİ hareketini ve süresini bugünün seansı olarak yazar. Hareket adı
     hızlı girişin ad sözlüğüyle tanınır (SP.Quick.parseMove); tanınmazsa
     plandaki adla serbest seans olur. Süre plandandır, uydurulmaz; zorlanma
     puanı (RPE) yazılmaz, o günün hissidir. Seans `planId` taşır: aynı gün
     ikinci kez yazılmaz, «Geri al» yalnız onu siler. */
  function planSeansi(p, iso){
    iso = iso || bugunISO();
    return p ? (S().workouts || []).find(w => w && w.date === iso && w.planId === p.id) || null : null;
  }
  async function hareketYaptim(p, iso){
    iso = iso || bugunISO();
    if(!p || p.tur !== 'hareket') return { ok:false, why:'Hareket planı bulunamadı.' };
    const d = (p.gunler || [])[gunNo(iso)];
    if(!d) return { ok:false, why:'Bugün planda hareket yok.' };
    if(planSeansi(p, iso)) return { ok:false, why:'Bugünün planı zaten kaydedildi.' };
    const ne = String(d.ne || '').trim();
    const q = SP.Quick && SP.Quick.parseMove ? SP.Quick.parseMove(ne + ' ' + d.dk + ' dk') : null;
    const ex = q && q.exercise;
    const w = SP.Model.newWorkout(iso);
    w.name = ne || 'Planlı hareket';
    w.minutes = d.dk;
    w.planId = p.id;
    if(ex){
      w.kind = ex.kind || w.kind;
      w.items = [{ exId:ex.id, levelId:null, sets:null, reps:null, minutes:d.dk }];
    }
    await SP.Model.saveWorkout(w);
    return { ok:true, id:w.id, ad:w.name + ' · ' + d.dk + ' dk',
      geriAl:async () => { await SP.Model.deleteWorkout(w.id); } };
  }
  async function hareketGeriAl(p, iso){
    const w = planSeansi(p, iso);
    if(!w) return { ok:false, why:'Bugün plandan yazılmış seans yok.' };
    await SP.Model.deleteWorkout(w.id);
    return { ok:true };
  }

  /* Eski ad: OGUNLER sabit diziydi; artık kullanıcının öğünleridir. */
  return { TURLER, TUR_BY_ID, GUN_KISA, GUN_AD, DILIMLER, DILIM_BY_ID, UYKU_KIPLERI, SIMGELER, BAGLAR, BAG_BY_ID, STORE,
    get OGUNLER(){ return ogunler(null); }, ogunler,
    yeni, yeniMadde, yeniKestirme, dogrula, uykuDakika, sureYaz, gunNo, uykuOf, uykuKip, bugunKestirmeleri,
    zamanNorm, zamanYaz, zamanAn, bugun, bugunMaddeleri, isaretle, isaretli, sayim, kayitSay, maddeGecmisi, hedefOf,
    uyum, liste, bul, bulId, yukle, kaydet, geriAl, sil, kopya, planSeansi, hareketYaptim, hareketGeriAl };
})();
