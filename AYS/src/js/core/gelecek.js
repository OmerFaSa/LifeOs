/* GELECEK — sınav gününe kadar «bu gidişle» ve «ne olursa» (Gelecek simülatörü).

   Depo sahibi (2026-10-16): «çok daha devrimsel» → sistem yalnız kayıt
   tutmasın, geleceği SENİN verinden göstersin. Bugünkü tahmin (Calc.
   estimateScore) şimdiki düzeyi söyler; bu dosya o düzeyin sınav gününe
   nereye gittiğini ve senin elindeki bir değişkenin onu nasıl kaydırdığını.

   Sözler:
     1. KOD HESAPLAR, MODEL YOK (AGENTS §1.1). Gidiş Theil–Sen eğimidir:
        bütün deneme çiftlerinin eğimlerinin medyanı — tek kötü deneme
        çizgiyi sürüklemez. Aralık eğimlerin çeyreklerinden ve artıkların
        sağlam sapmasından gelir; ufka doğru genişler.
     2. TEK SAYI YOK, HEP ARALIK VE ETİKET. Sonuç «tahmin»dir; en olası
        değer aralığın içinde durur. Garanti verilmez (AGENTS §1.5).
     3. EKSİK VERİ SIFIR DEĞİLDİR (AGENTS §1.2). En az MIN_DENEME tam
        deneme ve MIN_GUN güne yayılmış ölçüm yoksa gidiş ÇİZİLMEZ; neden
        söylenir. Kaydı olmayan gün soru sayısına sıfır diye girmez.
     4. «NE OLURSA» YALNIZ ÖLÇÜLEN ETKİYLE. Haftalık soru sürgüsünün etkisi
        senin denemeleri arasındaki aralıklardan ölçülür (haftalık soru →
        haftalık net değişimi). Aralık sayısı azsa ya da bağ tutarsızsa
        (eğim aralığı sıfırın iki yanında) sürgü KAPALIDIR: genel bir
        «soru çöz net artar» katsayısı uydurulmaz. Uyku gibi öteki
        değişkenler, kişisel deney motoru ölçünce açılır.
     5. NET SINIR İÇİNDE. TYT 0–120, AYT 0–80; doğrusal gidiş sınırı aşmaz.
        Öğrenme yavaşlayabilir: üst uç bu yüzden iyimserdir ve ekran bunu
        söyler.
     6. KISA VERİ UZAK UFKA TAŞINMAZ. Gidiş ölçülen sürenin en çok UFUK_KAT
        katı kadar uzatılır: üç haftalık bir düşüş sekiz ay uzatılıp «0 net»
        denmez (ilk sürümde örnek veri tam bunu gösterdi). Sınav bu ufkun
        ötesindeyse sınav günü için sayı VERİLMEZ; ufuk tarihindeki aralık
        ve sınava ulaşmak için yaklaşık kaç gün daha ölçüm gerektiği söylenir.
     7. SIFIR GENİŞLİK YOK. Az denemede kusursuz bir doğru da belirsizdir:
        aralığın en dar hâli bugünkü sıra tahmininin bandıdır
        (R.SCORING.bandHalfWidth, puan; nete net başına puanla çevrilir).
        İki tahmin birbirini yalanlamaz. */

window.R = window.R || {};

R.Gelecek = (function(){
  const MIN_DENEME = 4;
  const MIN_GUN = 14;
  const MIN_ARALIK = 5;
  const MIN_ARALIK_GUN = 5;
  const MAX_NET = { TYT:120, AYT:80 };
  const UFUK_KAT = 3;
  const U = () => R.U;

  function gun(a, b){ return U().diffDays(a, b); }          // b - a, gün
  function ceyrek(l, q){
    const s = l.filter(v => isFinite(v)).sort((a, b) => a - b);
    if(!s.length) return null;
    const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
    return s[lo] + (s[hi] - s[lo]) * (i - lo);
  }
  function theilSen(nokta){
    const e = [];
    for(let i = 0; i < nokta.length; i++){
      for(let j = i + 1; j < nokta.length; j++){
        const dx = nokta[j].x - nokta[i].x;
        if(dx) e.push((nokta[j].y - nokta[i].y) / dx);
      }
    }
    if(!e.length) return null;
    return { egim:ceyrek(e, .5), alt:ceyrek(e, .25), ust:ceyrek(e, .75), n:e.length };
  }
  function sapma(l){
    const m = ceyrek(l, .5);
    return 1.4826 * ceyrek(l.map(v => Math.abs(v - m)), .5);
  }
  const yuvarla = (v, b) => U().round(v, b == null ? 1 : b);

  /* SAF. seri: [{ tarih:'YYYY-AA-GG', net }] tarihe göre. Söz 1, 3, 5. */
  function izdusum(seri, aile, bugunISO, sinavISO){
    const n = seri.length;
    if(n < MIN_DENEME){
      return { ok:false, aile, n, why:'Gidiş için en az ' + MIN_DENEME + ' tam ' + aile + ' denemesi gerekir (şu an ' + n + ').' };
    }
    const ilk = seri[0].tarih;
    const yayilim = gun(ilk, seri[n - 1].tarih);
    if(yayilim < MIN_GUN){
      return { ok:false, aile, n, why:aile + ' denemeleri en az ' + MIN_GUN + ' güne yayılmalı (şu an ' + yayilim + ' gün).' };
    }
    const kalan = gun(bugunISO, sinavISO);
    if(!(kalan > 0)) return { ok:false, aile, n, why:'Sınav tarihi geçmiş ya da bilinmiyor.' };
    const nokta = seri.map(s => ({ x:gun(ilk, s.tarih), y:Number(s.net) }));
    const ts = theilSen(nokta);
    /* Şimdiki düzey: son üç denemenin medyanı (Calc.estimateScore ile aynı
       ilke); gidiş o noktadan uzatılır. */
    const son = nokta.slice(-3);
    const duzey = ceyrek(son.map(p => p.y), .5);
    const tDuzey = ceyrek(son.map(p => p.x), .5);
    const hSinav = gun(ilk, sinavISO) - tDuzey;
    /* Söz 6: ufuk ölçülen sürenin en çok UFUK_KAT katı. */
    const h = Math.min(hSinav, UFUK_KAT * yayilim);
    const sinavaKadar = h >= hSinav;
    const ufukTarih = sinavaKadar ? sinavISO : U().iso(U().addDays(U().parse(ilk), Math.round(tDuzey + h)));
    const gerekGun = sinavaKadar ? 0 : Math.ceil((hSinav - UFUK_KAT * yayilim) / (UFUK_KAT + 1));
    const s = sapma(nokta.map(p => p.y - (duzey + ts.egim * (p.x - tDuzey)))) || 0;
    const max = MAX_NET[aile] || 120;
    const kis = v => Math.max(0, Math.min(max, v));
    /* Söz 7: en dar yarım genişlik (net). */
    const SC = R.SCORING || {}, bw = SC.bandHalfWidth || {};
    const yarim = (n >= 8 ? bw.many : n >= 5 ? bw.some : bw.few) || 0;
    /* Puanın bir nete duyarlılığı: TYT puanında 3,33; SAY'da AYT neti
       0,6 x 5 = 3,0 (data/scoring.js). */
    const ay = SC.ayt || {};
    const duyarlilik = aile === 'AYT' ? ((ay.perNet || 5) * (ay.aytWeight || 0.6)) : ((SC.tyt || {}).perNet || 3.33);
    const taban = yarim / duyarlilik;
    const olasi0 = duzey + ts.egim * h;
    const alt0 = Math.min(duzey + ts.alt * h - 1.5 * s, olasi0 - taban);
    const ust0 = Math.max(duzey + ts.ust * h + 1.5 * s, olasi0 + taban);
    return {
      ok:true, aile, n, yayilim, kalanGun:kalan, h, ufukGun:h, sinavaKadar, ufukTarih, gerekGun, etiket:'tahmin',
      duzey:yuvarla(duzey), egimHafta:yuvarla(ts.egim * 7, 2), sapma:yuvarla(s),
      egim:ts.egim, egimAlt:ts.alt, egimUst:ts.ust,
      alt:yuvarla(kis(alt0)), olasi:yuvarla(kis(olasi0)), ust:yuvarla(kis(ust0)),
      max,
      nokta:seri.map(x => ({ tarih:x.tarih, net:yuvarla(Number(x.net)) })),
    };
  }

  /* SAF. aralik: [{ haftaSoru, haftaNet }] — ardışık iki tam deneme arası:
     haftada çözülen soru ve haftada net değişimi. Söz 4. */
  function hacimEtkisi(aralik){
    const n = aralik.length;
    if(n < MIN_ARALIK){
      return { ok:false, n, why:'Soru sayısının nete etkisini senin verinden ölçmek için en az ' + MIN_ARALIK
        + ' deneme aralığı gerekir (şu an ' + n + '). Ölçülmeden etki uydurulmaz.' };
    }
    const ts = theilSen(aralik.map(a => ({ x:a.haftaSoru, y:a.haftaNet })));
    if(!ts) return { ok:false, n, why:'Aralıklarda haftalık soru sayısı hep aynı; etkisi ayırt edilemiyor.' };
    if(ts.alt <= 0 && ts.ust >= 0){
      return { ok:false, n, belirsiz:true, why:'Verinde haftalık soru ile net değişimi arasında tutarlı bir bağ yok '
        + '(ölçülen aralık sıfırın iki yanında); etkisi uydurulmaz.' };
    }
    return { ok:true, n, egim:ts.egim, alt:ts.alt, ust:ts.ust, etiket:'hesaplandı' };
  }

  /* SAF. «Ne olursa»: haftada ekSoru fazla (ya da eksik) soru. */
  function senaryo(iz, etki, ekSoru){
    if(!iz || !iz.ok || !etki || !etki.ok || !ekSoru) return iz;
    const hafta = iz.h / 7;
    const kis = v => Math.max(0, Math.min(iz.max, v));
    const kay = e => e * ekSoru * hafta;
    const uc = [kay(etki.alt), kay(etki.ust)].sort((a, b) => a - b);
    return Object.assign({}, iz, { ekSoru,
      olasi:yuvarla(kis(iz.olasi + kay(etki.egim))),
      alt:yuvarla(kis(iz.alt + uc[0])), ust:yuvarla(kis(iz.ust + uc[1])) });
  }

  /* Net aralığı → puan ve sıra (Calc'ın tablosu ve OBP'si). Yüksek puan
     küçük sıradır: iyi uç üst netten gelir. */
  function siraya(tyt, ayt){
    const C = R.Calc, o = C.obp();
    const a = ayt && ayt.ok ? ayt : null;
    const puan = (t, y) => yuvarla(C.rawScore(t, y).value + o.contribution);
    const p = { alt:puan(tyt.alt, a ? a.alt : null), olasi:puan(tyt.olasi, a ? a.olasi : null), ust:puan(tyt.ust, a ? a.ust : null) };
    return { puan:p, sira:{ iyi:C.rankForScore(p.ust), olasi:C.rankForScore(p.olasi), kotu:C.rankForScore(p.alt) }, yalnizTyt:!a };
  }

  /* ---------- defterden ---------- */

  function seri(aile){
    return R.Calc.fullExams(aile).map(e => ({ tarih:String(e.date).slice(0, 10), net:R.Model.examNet(e) }));
  }

  /* Ardışık tam TYT denemeleri arası: kayıtlı günlerin sorusu. Aralığın
     günlerinin yarısından azı kayıtlıysa aralık sayılmaz (söz 3). */
  function araliklar(){
    const S = R.S, C = R.Calc, l = seri('TYT'), out = [];
    for(let i = 1; i < l.length; i++){
      const a = l[i - 1], b = l[i], g = gun(a.tarih, b.tarih);
      if(g < MIN_ARALIK_GUN) continue;
      let soru = 0, kayitli = 0;
      for(let k = 1; k <= g; k++){
        const t = U().iso(U().addDays(U().parse(a.tarih), k));
        const d = S.days[t];
        const q = d ? C.gunSorusu(d) : 0;
        if(q > 0){ soru += q; kayitli++; }
      }
      if(kayitli < g / 2) continue;
      const hafta = g / 7;
      out.push({ haftaSoru:(soru / kayitli) * 7, haftaNet:(b.net - a.net) / hafta });
    }
    return out;
  }

  function hesapla(o){
    const x = o || {};
    const bugun = x.bugun || U().todayISO();
    /* R.PLAN profildeki sınav tarihini önceler (data/curriculum.js). */
    const P = R.PLAN || R.PROGRAM || {};
    const tyt0 = izdusum(seri('TYT'), 'TYT', bugun, P.examTytISO);
    const ayt = izdusum(seri('AYT'), 'AYT', bugun, P.examAytISO || P.examTytISO);
    const etki = hacimEtkisi(araliklar());
    const tyt = senaryo(tyt0, etki, Number(x.ekSoru) || 0);
    const sira = tyt.ok ? siraya(tyt, ayt) : null;
    const hedef = (R.S.profile && R.S.profile.targetRank) || (R.PROGRAM && R.PROGRAM.refRank) || null;
    let konum = null;
    if(sira && hedef && sira.sira.iyi != null && sira.sira.kotu != null){
      konum = sira.sira.kotu <= hedef ? 'icinde' : sira.sira.iyi <= hedef ? 'bantta' : 'disinda';
    }
    return { bugun, sinav:P.examTytISO, tyt, tyt0, ayt, etki, sira, hedef, konum };
  }

  return { MIN_DENEME, MIN_GUN, MIN_ARALIK, MAX_NET, UFUK_KAT, theilSen, izdusum, hacimEtkisi, senaryo, siraya, araliklar, hesapla };
})();
