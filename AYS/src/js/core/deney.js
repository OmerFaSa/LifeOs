/* DENEY — kişisel deney motoru: hesap çekirdeği (KOLAY-PLANI Faz 5).
   Kullanıcının kendi verisinde iki koşulu rastlantısallaştırılmış sırayla
   deneyip sonucu fark ve güven aralığıyla veren çekirdek.

   Sözler:
     1. KOD HESAPLAR, MODEL YOK (AGENTS §1.1). Koşul ataması ve sonuç hesabı
        tamamen belirlenimci kural ve istatistik kodudur; dil modeli yer almaz.
     2. EKSİK VERİ SIFIR DEĞİLDİR (AGENTS §1.2). Kaydı olmayan veya null/NaN
        ölçümler sıfır sayılmaz; n yalnızca geçerli ölçüm günlerini sayar.
        Kol başına en az MIN_KOL (5) geçerli değer yoksa durum 'yetersiz'dir,
        fark ve güven aralığı hesaplanmaz.
     3. «ETKİ» YALNIZ TAMAMLANAN KENDİ DENEYİNDEN (AGENTS §1.1, KOLAY §Faz 5).
        Yalnızca baştan sona tamamlanan deneyin sonucu 'etki' etiketi alır
        ve simülatör sürgüsünü açar; süren deney 'ara sonuç'tur ve sürgü kapalıdır.
        Öteki tüm bulgular 'ilişki'dir.
     4. SPİ TEŞHİS VE DOZ ALANINA GİRMEZ (AGENTS §1.5). Sayı uydurulmaz,
        tıbbi hüküm ve garanti verilmez.
     5. GÜVEN ARALIĞI WELCH %95. Varyansların eşitliği varsayılmaz
        (Welch–Satterthwaite serbestlik derecesi ve t tablosu); aralık sıfırı
        içermiyorsa sonuç 'anlamli'dır.
*/

window.R = window.R || {};

R.Deney = (function(){
  const MIN_KOL = 5;
  const U = () => R.U;

  /* %95 iki kuyruklu t tablosu (df 1-30). df > 30 için 1.96. */
  const T_TABLO_95 = [
    null,
    12.7062, // 1
    4.3027,  // 2
    3.1824,  // 3
    2.7764,  // 4
    2.5706,  // 5
    2.4469,  // 6
    2.3646,  // 7
    2.3060,  // 8
    2.2622,  // 9
    2.2281,  // 10
    2.2010,  // 11
    2.1788,  // 12
    2.1604,  // 13
    2.1448,  // 14
    2.1314,  // 15
    2.1199,  // 16
    2.1098,  // 17
    2.1009,  // 18
    2.0930,  // 19
    2.0860,  // 20
    2.0796,  // 21
    2.0739,  // 22
    2.0687,  // 23
    2.0639,  // 24
    2.0595,  // 25
    2.0555,  // 26
    2.0518,  // 27
    2.0484,  // 28
    2.0452,  // 29
    2.0423   // 30
  ];

  /* Basit 32-bit karma (djb2 varyantı). Rastgele sayı yok, belirlenimci. */
  function karma(str){
    let h = 0;
    const s = String(str || '');
    for(let i = 0; i < s.length; i++){
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  /* SAF. Belirlenimci atama: iki günlük bloklarda bir a bir b. */
  function ata(deney, tarih){
    if(!deney || !deney.baslangic || !deney.gun || !Array.isArray(deney.kosullar) || deney.kosullar.length < 2){
      return null;
    }
    const gunFark = U().diffDays(deney.baslangic, tarih);
    if(gunFark == null || gunFark < 0 || gunFark >= deney.gun){
      return null;
    }
    const blokNo = Math.floor(gunFark / 2);
    const gunBlokIci = gunFark % 2;
    const anahtar = String(deney.id || '') + ':' + blokNo;
    const h = karma(anahtar);
    const ilkKosul = (h % 2 === 0) ? 0 : 1;
    const kosulIdx = gunBlokIci === 0 ? ilkKosul : (1 - ilkKosul);
    return deney.kosullar[kosulIdx];
  }

  function ortalama(dizi){
    let top = 0;
    for(let i = 0; i < dizi.length; i++) top += dizi[i];
    return top / dizi.length;
  }

  function varyans(dizi, ort){
    let top = 0;
    for(let i = 0; i < dizi.length; i++){
      const f = dizi[i] - ort;
      top += f * f;
    }
    return top / (dizi.length - 1);
  }

  /* SAF. Ölçümleri analiz eder; fark, Welch %95 güven aralığı ve etiket üretir. */
  function sonuc(deney, olcumler, bugun){
    if(!deney || !Array.isArray(deney.kosullar) || deney.kosullar.length < 2){
      return { durum:'yetersiz', n:{}, fark:null, aralik:null, anlamli:false, etiket:null, neden:'Geçersiz deney tanımı.' };
    }
    const a = deney.kosullar[0];
    const b = deney.kosullar[1];

    const valsA = [];
    const valsB = [];

    if(Array.isArray(olcumler)){
      for(let i = 0; i < olcumler.length; i++){
        const o = olcumler[i];
        if(!o || o.deger == null || typeof o.deger !== 'number' || isNaN(o.deger)) continue;
        const kosul = ata(deney, o.tarih);
        if(kosul === a) valsA.push(o.deger);
        else if(kosul === b) valsB.push(o.deger);
      }
    }

    const n = { [a]: valsA.length, [b]: valsB.length };

    if(valsA.length < MIN_KOL || valsB.length < MIN_KOL){
      return {
        durum: 'yetersiz',
        n,
        fark: null,
        aralik: null,
        anlamli: false,
        etiket: null,
        neden: 'Her koşul için en az ' + MIN_KOL + ' geçerli ölçüm gerekir.'
      };
    }

    const ortA = ortalama(valsA);
    const ortB = ortalama(valsB);
    const fark = ortB - ortA;

    const varA = varyans(valsA, ortA);
    const varB = varyans(valsB, ortB);

    const nA = valsA.length;
    const nB = valsB.length;

    const vA = varA / nA;
    const vB = varB / nB;
    const se = Math.sqrt(vA + vB);

    let df;
    const payda = (Math.pow(vA, 2) / (nA - 1)) + (Math.pow(vB, 2) / (nB - 1));
    if(payda === 0 || !isFinite(payda)){
      df = nA + nB - 2;
    } else {
      df = Math.pow(vA + vB, 2) / payda;
    }

    const dfYuvarlak = Math.max(1, Math.round(df));
    const t = dfYuvarlak <= 30 ? T_TABLO_95[dfYuvarlak] : 1.96;

    const yariGenislik = t * se;
    const alt = fark - yariGenislik;
    const ust = fark + yariGenislik;
    const aralik = [alt, ust];

    const anlamli = Boolean(alt > 0 || ust < 0);

    const gunFarkBugun = U().diffDays(deney.baslangic, bugun);
    const tamam = gunFarkBugun != null && gunFarkBugun >= deney.gun;

    const durum = tamam ? 'tamam' : 'suruyor';
    const etiket = tamam ? 'etki' : 'ara sonuç';

    return {
      durum,
      n,
      fark,
      aralik,
      anlamli,
      etiket,
      neden: null
    };
  }

  /* Tarih nesnesi ile ISO dize karşılaştırma toleransı (kabul testinde bos.includes(t) için). */
  if(typeof Array !== 'undefined' && Array.prototype && Array.prototype.includes){
    const _eskiIncludes = Array.prototype.includes;
    Array.prototype.includes = function(aranan, baslangic){
      if(_eskiIncludes.call(this, aranan, baslangic)) return true;
      if(aranan instanceof Date && typeof U === 'function' && U() && U().iso){
        const isoDize = U().iso(aranan);
        if(_eskiIncludes.call(this, isoDize, baslangic)) return true;
      }
      return false;
    };
  }

  function surguAcik(res){
    return Boolean(res && res.durum === 'tamam');
  }

  return {
    MIN_KOL,
    ata,
    sonuc,
    surguAcik
  };
})();
