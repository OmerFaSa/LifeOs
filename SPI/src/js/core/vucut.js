/* VÜCUT ANALİZİ — vücut kompozisyonu, kaynaklı formüllerle (KISI-PLANI Faz 6).

   Depo sahibi (2026-10-17): «SPİ'de vücut kitle analizini daha donanımlı
   yap.» Önce SPİ'de kilo, bel ve yağ oranı ALANI vardı ama hiçbiri
   hesaba girmiyordu: BKİ, bel/boy oranı, yağsız kütle, kilo eğilimi yoktu.

   Formüller ve kaynakları:
     BKİ          kg / m²; bantlar DSÖ (WHO) yetişkin sınıflaması:
                  < 18,5 · 18,5–24,9 · 25–29,9 · ≥ 30
     Bel/boy      bel (cm) / boy (cm); ≥ 0,5 kardiyometabolik risk için
                  yaygın «dikkat» eşiği (Ashwell ve ark.; NICE 2022).
     Yağ oranı    ABD Donanması çevre yöntemi (Hodgdon ve Beckett, 1984),
                  santimetre ile:
                    erkek  495 / (1,0324 − 0,19077·log10(bel − boyun)
                                  + 0,15456·log10(boy)) − 450
                    kadın  495 / (1,29579 − 0,35004·log10(bel + kalça − boyun)
                                  + 0,22100·log10(boy)) − 450
                  Tipik hata ±3–4 puan: hep «tahmin».
     Yağsız kütle kg × (1 − yağ/100); FFMI = yağsız kütle / m²;
                  boya göre düzeltilmiş FFMI = FFMI + 6,1 × (1,8 − m)
                  (Kouri ve ark., 1995).
     Kilo eğilimi tartı günlük ±1–2 kg oynar (su, tuz, sindirim). Eğilim
                  son 28 günün tartılarından Theil–Sen eğimiyle (kg/hafta);
                  en az 6 tartı ve 14 günlük yayılım yoksa söylenmez.
     Enerji       ortalama girilen kalori − eğilim × 7700 kcal/kg / 7 →
                  harcamanın KABA tahmini; en az 14 öğün günü ve geçerli
                  eğilim gerekir; öğün eksik girildiyse yanıltır (yazılır).

   Sözler: eksik ölçü sıfır sayılmaz, o satır yazılmaz (AGENTS §1.2);
   her değer etiketlidir (hesaplandı / tahmin); teşhis yok, «obez» bir
   DSÖ bant adıdır ve bant olarak gösterilir, kişiye hüküm olarak değil
   (§1.5). */

window.SP = window.SP || {};

SP.Vucut = (function(){
  const yuvarla = (v, b) => { const k = Math.pow(10, b || 1); return Math.round(v * k) / k; };
  const sayi = v => (v == null || v === '' || !isFinite(Number(v)) ? null : Number(v));

  const BKI_BANT = [
    { ust:18.5, ad:'Zayıf (DSÖ)', ton:'warn' },
    { ust:25, ad:'Normal (DSÖ)', ton:'ok' },
    { ust:30, ad:'Fazla kilolu (DSÖ)', ton:'warn' },
    { ust:Infinity, ad:'Obez bandı (DSÖ)', ton:'warn' },
  ];
  function bki(kg, cm){
    kg = sayi(kg); cm = sayi(cm);
    if(!kg || !cm || cm < 100 || cm > 250) return null;
    const m = cm / 100, v = kg / (m * m);
    const b = BKI_BANT.find(x => v < x.ust);
    return { deger:yuvarla(v, 1), bant:b.ad, ton:b.ton, etiket:'hesaplandı',
      not:'BKİ kas ile yağı ayırmaz; kaslı bedende yüksek çıkabilir.' };
  }
  function belBoy(bel, cm){
    bel = sayi(bel); cm = sayi(cm);
    if(!bel || !cm) return null;
    const v = bel / cm;
    return { deger:yuvarla(v, 2), dikkat:v >= 0.5, etiket:'hesaplandı',
      not:v >= 0.5 ? 'Bel, boyun yarısını geçmiş: yaygın kullanılan dikkat eşiği (teşhis değil).' : 'Bel, boyun yarısının altında.' };
  }
  function navyYag(cins, cm, boyun, bel, kalca){
    cm = sayi(cm); boyun = sayi(boyun); bel = sayi(bel); kalca = sayi(kalca);
    if(!cm || !boyun || !bel) return null;
    let v;
    if(cins === 'female'){
      if(!kalca || bel + kalca - boyun <= 0) return null;
      v = 495 / (1.29579 - 0.35004 * Math.log10(bel + kalca - boyun) + 0.22100 * Math.log10(cm)) - 450;
    }else{
      if(bel - boyun <= 0) return null;
      v = 495 / (1.0324 - 0.19077 * Math.log10(bel - boyun) + 0.15456 * Math.log10(cm)) - 450;
    }
    if(!isFinite(v) || v < 2 || v > 70) return null;
    return { deger:yuvarla(v, 1), etiket:'tahmin', yontem:'ABD Donanması çevre yöntemi', not:'Tipik hata ±3–4 puan.' };
  }
  function yagsiz(kg, yagYuzde, cm){
    kg = sayi(kg); yagYuzde = sayi(yagYuzde); cm = sayi(cm);
    if(!kg || yagYuzde == null || !cm) return null;
    const m = cm / 100, ffm = kg * (1 - yagYuzde / 100), ffmi = ffm / (m * m);
    return { kutle:yuvarla(ffm, 1), ffmi:yuvarla(ffmi, 1), ffmiDuz:yuvarla(ffmi + 6.1 * (1.8 - m), 1), yagKg:yuvarla(kg - ffm, 1) };
  }

  /* Theil–Sen: ikili eğimlerin ortancası (tek aykırı tartıdan etkilenmez). */
  function theilSen(n){
    const e = [];
    for(let i = 0; i < n.length; i++) for(let j = i + 1; j < n.length; j++){
      if(n[j].x !== n[i].x) e.push((n[j].y - n[i].y) / (n[j].x - n[i].x));
    }
    e.sort((a, b) => a - b);
    return e.length ? (e.length % 2 ? e[(e.length - 1) / 2] : (e[e.length / 2 - 1] + e[e.length / 2]) / 2) : null;
  }
  /* seri: [{ tarih:'YYYY-AA-GG', kg }] (eski → yeni). */
  function egilim(seri){
    const l = (seri || []).filter(x => x && sayi(x.kg));
    if(l.length < 6) return { ok:false, why:'Eğilim için son 28 günde en az 6 tartı gerekir (şimdi ' + l.length + ').' };
    const t0 = Date.parse(l[0].tarih);
    const n = l.map(x => ({ x:(Date.parse(x.tarih) - t0) / 86400000, y:Number(x.kg) }));
    const yayilim = n[n.length - 1].x - n[0].x;
    if(yayilim < 14) return { ok:false, why:'Tartılar en az 14 güne yayılmalı (şimdi ' + Math.round(yayilim) + ' gün).' };
    const e = theilSen(n);
    const son7 = l.slice(-7).map(x => Number(x.kg));
    return { ok:true, haftalik:yuvarla(e * 7, 2), ortalama7:yuvarla(son7.reduce((a, b) => a + b, 0) / son7.length, 1),
      yon:Math.abs(e * 7) < 0.1 ? 'sabit' : e > 0 ? 'artıyor' : 'azalıyor', etiket:'hesaplandı', tarti:l.length };
  }
  function enerji(ortKcal, gunSayisi, eg){
    if(!eg || !eg.ok || !sayi(ortKcal) || (gunSayisi || 0) < 14) return null;
    const harcama = ortKcal - eg.haftalik * 7700 / 7;
    if(!isFinite(harcama) || harcama < 1000 || harcama > 6000) return null;
    return { harcama:Math.round(harcama / 10) * 10, etiket:'tahmin',
      not:'Girdiğin öğünler eksikse bu tahmin düşük çıkar.' };
  }

  /* Ekranın tek çağrısı: profil + son ölçüler + seriler → tablo satırları. */
  function analiz(o){
    const p = o.profil || {}, v = o.son || {};
    const kg = sayi(v.weight), cm = sayi(p.heightCm);
    const b = bki(kg, cm), bb = belBoy(v.waist, cm);
    const navy = navyYag(p.sex, cm, v.neck, v.waist, v.hip);
    const olculenYag = sayi(v.bodyfat);
    const yag = olculenYag != null ? { deger:olculenYag, etiket:'ölçüldü', yontem:'cihaz ya da senin girdiğin' } : navy;
    const ys = yag ? yagsiz(kg, yag.deger, cm) : null;
    const eg = egilim(o.kilolar);
    const en = enerji(o.ortKcal, o.ogunGun, eg);
    const eksik = [];
    if(!cm) eksik.push('boy (profil)');
    if(!kg) eksik.push('kilo');
    if(!sayi(v.waist)) eksik.push('bel');
    if(!yag) eksik.push(p.sex === 'female' ? 'boyun ve kalça (yağ oranı için)' : 'boyun (yağ oranı için)');
    return { bki:b, belBoy:bb, yag, navy, yagsiz:ys, egilim:eg, enerji:en, eksik };
  }

  return { bki, belBoy, navyYag, yagsiz, egilim, enerji, analiz, theilSen };
})();
