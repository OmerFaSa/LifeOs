/* KİŞİSEL TAHMİN AĞI — ruh hâlini (Günün hissi, 1–5) senin kendi verinden öğrenir.

   Depo sahibi (2026-10-17): «Ruh hâlimi şarkılardan, besinlerden,
   uykusundan, her şeyden tahmin edebilecek çok detaylı, çok parametreli
   bir nöral ağ; beni tanıyabilecek, bana göre şekillenebilecek bir sistem.»

   DÜRÜST ÖLÇÜ (AGENTS §1.7): tek bir kişinin birkaç yüz günü, binlerce
   parametreli bir ağı EZBERLETİR: geçmişi kusursuz «açıklar», yarını
   tahmin edemez. Bu yüzden GİRDİ zengin (otuzdan fazla özellik), model
   küçük ve düzenlidir:
     · doğrusal model (L2 düzenlemeli),
     · tek gizli katmanlı sinir ağı (tanh, L2, tohumlu başlangıç),
     · ikisinin ortalaması (topluluk).
   Hepsi tarayıcıda, sıfır bağımlılıkla eğitilir (AGENTS §1.3).

   Sözler:
     1. ZAMANA GÖRE SINANIR. Günler tarih sırasıyla ayrılır: ilk %75'te
        öğrenilir, son %25'te sınanır. Ölçü, «her gün senin ortanca hissin»
        diyen tabana göre ortalama mutlak hatadır (MAE).
     2. TABANI GEÇMEZSE TAHMİN YOK. Model tabandan en az %10 iyi değilse
        bugünün tahmini gösterilmez; «henüz öğrenemedim» denir.
     3. EN AZ 20 ETİKETLİ GÜN. Altında eğitilmez.
     4. ETKENLER BİRLİKTELİKTİR. Önem, bir özelliği karıştırınca hatanın
        ne kadar arttığıdır (permütasyon önemi); yönü doğrusal modelden.
        «Neden» değildir; King bunu sana SORAR (cikarim.js).
     5. TAHMİN ETİKETLİ. Her çıktı «tahmin»dir; ölçümün yerine geçmez,
        hiçbir kayda yazılmaz, hiçbir kararı vermez (§1.1). */

window.SP = window.SP || {};

SP.Tahmin = (function(){
  const ASGARI_GUN = 20;

  /* Tohumlu rastgele (mulberry32): aynı veri → aynı model (test edilebilir). */
  function rng(tohum){
    let a = tohum >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  /* ----------------------------------------------------------- özellikler */
  const OZELLIK_AD = {
    uyku:'Uyku süresi', uyku3:'Son üç gecenin uykusu', yatis:'Yatış saati', hrv:'HRV', rhr:'İstirahat nabzı',
    su:'Su', antrenman:'Antrenman', antrenmanDun:'Dünkü antrenman', kcal:'Kalori', protein:'Protein',
    tatli:'Tatlı', kahve:'Kahve', ogun:'Öğün sayısı', sebze:'Sebze ve meyve', kiloFark:'Kilo değişimi',
    aysSoru:'Çözülen soru (AYS)', aysDakika:'Çalışma süresi (AYS)', aysDogru:'Doğru oranı (AYS)',
    espToplam:'Gelişim süresi (ESP)', espMuzik:'Müzik (ESP)', espFelsefe:'Felsefe (ESP)', espDil:'Yabancı dil (ESP)',
    espOkuma:'Derin okuma (ESP)', espYazi:'Yazı (ESP)', espTarih:'Tarih (ESP)',
    haftasonu:'Hafta sonu', pzt:'Pazartesi', sali:'Salı', car:'Çarşamba', per:'Perşembe', cum:'Cuma', cmt:'Cumartesi', paz:'Pazar',
  };
  const GUN_KEY = ['paz', 'pzt', 'sali', 'car', 'per', 'cum', 'cmt'];

  /* ÖBÜR MODÜLLER (sunucu sözü 25): AYS ve ESP günlerini sunucuya yayınlar;
     SPİ okur. Sunucu kapalıysa ya da oturum yoksa bu özellikler hiç
     girmez (sütun tümden boşsa model onu kullanmaz; §1.2). */
  let dis = {};
  async function disYukle(){
    try{
      const H = window.LIFEOS && window.LIFEOS.HESAP;
      const r = H && typeof H.gunluk === 'function' ? await H.gunluk() : null;
      if(r && Array.isArray(r.moduller)){ const o = {}; r.moduller.forEach(m => { o[m.modul] = m.gunler || {}; }); dis = o; }
    }catch(e){ /* sunucu kapalı: SPİ verisiyle devam (AGENTS §1.4) */ }
    return dis;
  }
  function _dis(v){ dis = v || {}; }

  /* Bir günün özellik vektörü (eksik: null). Kaynak SPİ'nin kendi kaydı + öbür modüllerin yayını. */
  function gunOzellik(d){
    const U = SP.U, M = SP.Model;
    const v = SP.S.vitals[d] || {};
    const num = x => (x == null || x === '' || !isFinite(Number(x)) ? null : Number(x));
    const once = n => U.iso(U.addDays(U.parse(d), -n));
    const uykular = [0, 1, 2].map(n => num((SP.S.vitals[once(n)] || {}).sleep)).filter(x => x != null);
    let tatli = 0, kahve = 0, sebze = 0, ogun = 0;
    const meals = M.mealsOf(d) || [];
    meals.forEach(m => { if((m.items || []).length) ogun++; (m.items || []).forEach(it => {
      const f = SP.FOOD_BY_ID[it.foodId];
      if(f && f.cat === 'tatli') tatli++;
      if(f && (f.cat === 'sebze' || f.cat === 'meyve')) sebze++;
      if(/kahve|espresso|latte|americano|filtre/i.test(it.foodId)) kahve++;
    }); });
    const t = SP.Nutri && SP.Nutri.dayTotals ? SP.Nutri.dayTotals(d) : { empty:true };
    const w0 = num(v.weight), w1 = num((SP.S.vitals[once(1)] || {}).weight);
    const dow = U.parse(d).getDay();
    const o = {
      uyku:num(v.sleep), uyku3:uykular.length ? uykular.reduce((a, b) => a + b, 0) / uykular.length : null,
      yatis:num(v.yatis), hrv:num(v.hrv), rhr:num(v.rhr), su:num(v.water),
      antrenman:M.workoutsOf(d).length, antrenmanDun:M.workoutsOf(once(1)).length,
      kcal:t.empty ? null : t.kcal, protein:t.empty ? null : t.protein,
      tatli:meals.length ? tatli : null, kahve:meals.length ? kahve : null, sebze:meals.length ? sebze : null,
      ogun:meals.length ? ogun : null, kiloFark:w0 != null && w1 != null ? w0 - w1 : null,
      haftasonu:dow === 0 || dow === 6 ? 1 : 0,
    };
    GUN_KEY.forEach((k, i) => { o[k] = dow === i ? 1 : 0; });
    const a = (dis.ays || {})[d], e = (dis.esp || {})[d];
    /* Kaydı olmayan gün: modül yayın yapıyorsa o gün çalışılmamıştır (0);
       hiç yayın yoksa null (girmez). */
    const aysVar = !!dis.ays, espVar = !!dis.esp;
    o.aysSoru = a ? num(a.soru) : aysVar ? 0 : null;
    o.aysDakika = a ? num(a.dakika) : aysVar ? 0 : null;
    o.aysDogru = a ? num(a.dogru) : null;
    o.espToplam = e ? num(e.toplam) : espVar ? 0 : null;
    [['espMuzik', 'music'], ['espFelsefe', 'philo'], ['espDil', 'lang'], ['espOkuma', 'reading'], ['espYazi', 'writing'], ['espTarih', 'history']]
      .forEach(([k, id]) => { o[k] = e ? (num(e[id]) || 0) : espVar ? 0 : null; });
    return o;
  }
  /* Etiketli günler: Günün hissi (soreness 1–5, senin beyanın). */
  function etiketler(gunSayisi){
    const U = SP.U, out = [];
    for(let i = (gunSayisi || 365) - 1; i >= 0; i--){
      const d = U.iso(U.addDays(U.today(), -i));
      const v = SP.S.vitals[d];
      if(!v || v.soreness == null || !isFinite(Number(v.soreness))) continue;
      out.push({ tarih:d, y:Number(v.soreness) });
    }
    return out;
  }
  function veriSeti(gunSayisi){
    return etiketler(gunSayisi).map(r => ({ tarih:r.tarih, x:gunOzellik(r.tarih), y:r.y }));
  }

  /* ------------------------------------------------------------- modeller */
  function hazirla(egitim, adlar){
    /* Eksik: eğitimin ortalaması; ölçek: eğitimin ortalama ve sapması. */
    const ort = {}, sap = {};
    adlar.forEach(k => {
      const l = egitim.map(r => r.x[k]).filter(v => v != null);
      const m = l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0;
      const s = l.length > 1 ? Math.sqrt(l.reduce((a, b) => a + (b - m) * (b - m), 0) / (l.length - 1)) : 0;
      ort[k] = m; sap[k] = s > 1e-9 ? s : 1;
    });
    const vek = x => adlar.map(k => ((x[k] == null ? ort[k] : x[k]) - ort[k]) / sap[k]);
    return { vek, ort, sap };
  }

  function dogrusal(X, y, l2){
    const n = X.length, p = X[0].length;
    let w = new Array(p).fill(0), b = y.reduce((a, c) => a + c, 0) / n;
    const lr = 0.05;
    for(let ep = 0; ep < 400; ep++){
      const gw = new Array(p).fill(0); let gb = 0;
      for(let i = 0; i < n; i++){
        let t = b; for(let j = 0; j < p; j++) t += w[j] * X[i][j];
        const e = t - y[i]; gb += e;
        for(let j = 0; j < p; j++) gw[j] += e * X[i][j];
      }
      for(let j = 0; j < p; j++) w[j] -= lr * (gw[j] / n + l2 * w[j]);
      b -= lr * gb / n;
    }
    return { tahmin:x => { let t = b; for(let j = 0; j < p; j++) t += w[j] * x[j]; return t; }, w };
  }

  function sinirAgi(X, y, gizli, l2, tohum){
    const r = rng(tohum || 7), n = X.length, p = X[0].length, h = gizli || 12;
    const W1 = Array.from({ length:h }, () => Array.from({ length:p }, () => (r() - 0.5) * 2 / Math.sqrt(p)));
    const b1 = new Array(h).fill(0);
    const W2 = Array.from({ length:h }, () => (r() - 0.5) * 2 / Math.sqrt(h));
    let b2 = y.reduce((a, c) => a + c, 0) / n;
    const lr = 0.02, sira = Array.from({ length:n }, (_, i) => i);
    const ileri = x => {
      const a = new Array(h);
      for(let k = 0; k < h; k++){ let s = b1[k]; for(let j = 0; j < p; j++) s += W1[k][j] * x[j]; a[k] = Math.tanh(s); }
      let o = b2; for(let k = 0; k < h; k++) o += W2[k] * a[k];
      return { a, o };
    };
    /* Tur sayısı veri büyüdükçe azalır: çizim bütçesi korunur. */
    const turlar = Math.min(250, Math.max(40, Math.round(30000 / n)));
    for(let ep = 0; ep < turlar; ep++){
      for(let i = n - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); const t = sira[i]; sira[i] = sira[j]; sira[j] = t; }
      for(const i of sira){
        const { a, o } = ileri(X[i]);
        const e = o - y[i];
        for(let k = 0; k < h; k++){
          const g2 = e * a[k];
          const ga = e * W2[k] * (1 - a[k] * a[k]);
          W2[k] -= lr * (g2 + l2 * W2[k]);
          for(let j = 0; j < p; j++) W1[k][j] -= lr * (ga * X[i][j] + l2 * W1[k][j]);
          b1[k] -= lr * ga;
        }
        b2 -= lr * e;
      }
    }
    return { tahmin:x => ileri(x).o, parametre:h * p + h + h + 1 };
  }

  const sinirla = v => Math.max(1, Math.min(5, v));
  const mae = (f, X, y) => X.reduce((a, x, i) => a + Math.abs(sinirla(f(x)) - y[i]), 0) / X.length;
  const ortanca = l => { const s = l.slice().sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

  /* Eğit ve dürüstçe sına. veri: [{ tarih, x, y }] (eski → yeni). */
  function egit(veri, o){
    const opt = o || {};
    const l = (veri || []).filter(r => r && r.x && typeof r.y === 'number');
    if(l.length < ASGARI_GUN) return { ok:false, n:l.length, why:'Ruh hâli modelini eğitmek için en az ' + ASGARI_GUN + ' gün «Günün hissi» gerekir (şimdi ' + l.length + ').' };
    const adlar = Object.keys(l[0].x).filter(k => l.some(r => r.x[k] != null));
    const kes = Math.max(ASGARI_GUN - 5, Math.floor(l.length * 0.75));
    const egitim = l.slice(0, kes), sinav = l.slice(kes);
    if(sinav.length < 5) return { ok:false, n:l.length, why:'Sınamak için en az 5 gün ayrılamadı.' };
    const hz = hazirla(egitim, adlar);
    const X = egitim.map(r => hz.vek(r.x)), y = egitim.map(r => r.y);
    const Xs = sinav.map(r => hz.vek(r.x)), ys = sinav.map(r => r.y);
    const lin = dogrusal(X, y, 0.05);
    const ag = sinirAgi(X, y, opt.gizli || 12, 0.01, opt.tohum || 7);
    const topluluk = x => (lin.tahmin(x) + ag.tahmin(x)) / 2;
    const taban = ortanca(y);
    const maeTaban = ys.reduce((a, v) => a + Math.abs(taban - v), 0) / ys.length;
    const maeModel = mae(topluluk, Xs, ys);
    const iyi = maeModel <= maeTaban * 0.9;
    /* Permütasyon önemi (sınav kümesinde; döngüsel kaydırma = tohumsuz, tekrarlanabilir). */
    const onem = adlar.map((k, j) => {
      const Xp = Xs.map((x, i) => { const z = x.slice(); z[j] = Xs[(i + 1) % Xs.length][j]; return z; });
      return { ozellik:k, ad:OZELLIK_AD[k] || k, artis:mae(topluluk, Xp, ys) - maeModel, yon:Math.sign(lin.w[j]) };
    }).filter(x => x.artis > 0.01).sort((a, b) => b.artis - a.artis);
    /* NE DEĞİŞİRSE (tahmin, birliktelik): tipik bir günde (özelliklerin
       ortancası) değiştirilebilir bir özellik bir adım oynayınca modelin
       tahmini ne kadar değişiyor. «Neden» değildir; doz da değildir. */
    const ADIM = { uyku:[1, '1 saat daha uyku'], su:[500, '500 ml daha su'], antrenman:[1, 'bir antrenman'], tatli:[-1, 'bir kalem daha az tatlı'],
      kahve:[-1, 'bir fincan daha az kahve'], sebze:[1, 'bir kalem daha sebze/meyve'], yatis:[-1, '1 saat erken yatmak'],
      aysDakika:[60, '1 saat daha ders'], espMuzik:[30, '30 dk müzik'], espToplam:[30, '30 dk daha gelişim çalışması'], espOkuma:[30, '30 dk derin okuma'] };
    const tipik = {};
    adlar.forEach(k => { const v = l.map(r => r.x[k]).filter(x => x != null); tipik[k] = v.length ? ortanca(v) : null; });
    const ne = [];
    /* tam veriyle kurulan modeli kullanmak için aşağıda doldurulur */
    const neDegisirse = f => Object.keys(ADIM).filter(k => adlar.indexOf(k) >= 0 && tipik[k] != null).map(k => {
      const y0 = f(tipik), x1 = Object.assign({}, tipik); x1[k] = tipik[k] + ADIM[k][0];
      return { ozellik:k, ad:ADIM[k][1], fark:Math.round((f(x1) - y0) * 100) / 100 };
    }).filter(x => Math.abs(x.fark) >= 0.1).sort((a, b) => b.fark - a.fark);
    /* Son model tüm veriyle (tahmin için). */
    const hzT = hazirla(l, adlar);
    const XT = l.map(r => hzT.vek(r.x)), yT = l.map(r => r.y);
    const linT = dogrusal(XT, yT, 0.05), agT = sinirAgi(XT, yT, opt.gizli || 12, 0.01, opt.tohum || 7);
    const tamTahmin = x => sinirla((linT.tahmin(hzT.vek(x)) + agT.tahmin(hzT.vek(x))) / 2);
    ne.push.apply(ne, neDegisirse(tamTahmin));
    const kaynaklar = ['SPİ'].concat(adlar.some(k => /^ays/.test(k)) ? ['AYS'] : [], adlar.some(k => /^esp/.test(k)) ? ['ESP'] : []);
    return {
      ok:true, n:l.length, egitim:egitim.length, sinav:sinav.length, ozellikSayisi:adlar.length, parametre:ag.parametre + adlar.length + 1,
      neDegisirse:ne.filter(x => x.fark > 0).slice(0, 3), kaynaklar,
      maeModel:Math.round(maeModel * 100) / 100, maeTaban:Math.round(maeTaban * 100) / 100, iyi,
      kazanc:maeTaban ? Math.round(100 * (1 - maeModel / maeTaban)) : 0,
      onem:onem.slice(0, 6),
      tahminEt:x => { const v = sinirla((linT.tahmin(hzT.vek(x)) + agT.tahmin(hzT.vek(x))) / 2); return Math.round(v * 10) / 10; },
      etiket:'tahmin',
    };
  }

  /* Ekran ve King için: etiketli günler değişmedikçe yeniden eğitilmez.
     Anahtar yalnız etiketten (ucuz); özellik (öğün, besin toplamı) yalnız
     anahtar değişince hesaplanır — durum() her çizimde çağrılır. */
  let onbellek = null;
  function durum(){
    const veri = etiketler(365);
    const imza = SP.U.todayISO() + '|' + veri.length + '|' + veri.map(r => r.tarih + r.y).join(',').length
      + '|' + veri.reduce((a, r) => a + r.y, 0) + '|' + Object.keys(dis).map(k => k + Object.keys(dis[k]).length).join(',');
    if(onbellek && onbellek.imza === imza) return onbellek.sonuc;
    const m = egit(veri.map(r => ({ tarih:r.tarih, x:gunOzellik(r.tarih), y:r.y })));
    const sonuc = m.ok ? Object.assign({}, m, { bugun:m.iyi ? m.tahminEt(gunOzellik(SP.U.todayISO())) : null }) : m;
    onbellek = { imza, sonuc };
    return sonuc;
  }

  return { egit, durum, veriSeti, gunOzellik, sinirAgi, dogrusal, rng, OZELLIK_AD, ASGARI_GUN, disYukle, _dis };
})();
