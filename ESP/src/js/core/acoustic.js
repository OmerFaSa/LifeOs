/* Akustik katman — metronom, temiz BPM esigi ve artikulasyon olcumu.

   Iki ajan bu dosyayi PAYLASIR: Maestro (muzik) ve Demosthenes (diksiyon).
   Kasitlidir — ikisi de ayni ham girdiyi (zamanlama ve tekrar) farkli
   esiklerle okur. Kod tekrari yerine tek bir sinyal isleme katmani.

   Ortak olan sey su fikirdir: HIZ BIR SONUCTUR, HEDEF DEGIL. Temiz calinan
   BPM hizli calinan BPM'den once gelir; temiz konusulan hiz hizli
   konusulandan once gelir. Ikisinde de olcut "hatasiz tekrar"dir.

   Dikkat: bu dosya SES DINLEMEZ. Tarayicinin mikrofonunu acmaz, konusma
   tanima modeli kullanmaz, kayit tutmaz. Olctugu sey kullanicinin kendi
   isaretledigi tekrarlar ve zamanlayicinin verdigi suredir. Bu bir eksiklik
   degil bir karardir: olmayan ses dosyasi sizamaz. */

window.ESP = window.ESP || {};

ESP.Acoustic = (function(){
  const U = ESP.U;
  const S = ESP.S;

  /* Esigin acilmasi icin gereken temiz tekrar sayisi.

     Ucu birden ayni BPM'de olmali ve son 14 gun icinde gelmis olmali:
     uc ay once yapilmis bir temiz tekrar bugunun esigini acmaz. */
  const CLEAN_STREAK = 3;
  const CLEAN_WINDOW_DAYS = 14;

  /* Plato esigi — ESP.PRECEDENCE'daki "tikanmis temel" ile ayni sayi. */
  const PLATEAU_DAYS = 14;

  /* BPM merdiveni: esik acildiginda bir sonraki basamak. Kucuk adim
     kasitlidir — %10'luk siçramalar temizligi bozar ve kullaniciyi geri
     dondurur. */
  const BPM_STEP = 4;

  /* ------------------------------------------------------------ metronom

     Zamanlama hesabi burada, ses uretimi ekranda. Boylece metronom
     matematigi test edilebilir: bir tarayici olmadan "80 BPM'de 4/4 olcude
     ilk vurus nereye duser" sorusu cevaplanir. */
  function beatMs(bpm){
    const b = Number(bpm);
    if(!isFinite(b) || b <= 0) return null;
    return 60000 / b;
  }

  /* Bir olcudeki vurus zamanlari (ms). `accent` ilk vurusu isaretler:
     metronomun isini yapan sey vurusun kendisi degil, olcunun NEREDE
     basladigini duyurmasidir. */
  function beatsOfBar(bpm, beatsPerBar){
    const ms = beatMs(bpm);
    if(ms == null) return [];
    const n = Math.max(1, Math.min(16, beatsPerBar || 4));
    const out = [];
    for(let i = 0; i < n; i++) out.push({ index:i, at:Math.round(i * ms), accent:i === 0 });
    return out;
  }

  /* --------------------------------------------------------- temiz esik

     Kural: esik KENDILIGINDEN ARTAR, KENDILIGINDEN DUSMEZ.

     Bir kotu gun kazanilmis esigi geri almaz — yoksa hastalikli bir hafta
     aylarin kazanimini siler ve kullanici sisteme guvenmeyi birakir. Esigin
     dusmesi yalnizca kullanicinin kendi elindedir (parcayi sifirlamak). */
  function cleanThreshold(piece, todayISO){
    const p = piece || {};
    const today = todayISO || U.todayISO();
    const sinir = U.iso(U.addDays(U.parse(today), -CLEAN_WINDOW_DAYS));
    const temiz = (p.attempts || [])
      .filter(a => a.clean && a.date >= sinir && typeof a.bpm === 'number');

    if(!temiz.length){
      /* Pencerede temiz tekrar yok: kayitli esik varsa o durur (dusmez),
         yoksa "veri yok". */
      return p.cleanBpm != null
        ? { value:p.cleanBpm, cert:'measured', fresh:false, n:0 }
        : { value:null, cert:'missing', fresh:false, n:0 };
    }

    /* Hangi BPM'de en az CLEAN_STREAK temiz tekrar var? En yuksegi esiktir. */
    const sayac = {};
    temiz.forEach(a => { sayac[a.bpm] = (sayac[a.bpm] || 0) + 1; });
    const acilan = Object.keys(sayac)
      .map(Number)
      .filter(bpm => sayac[bpm] >= CLEAN_STREAK)
      .sort((a, b) => b - a);

    if(!acilan.length){
      return p.cleanBpm != null
        ? { value:p.cleanBpm, cert:'measured', fresh:false, n:temiz.length,
            why:'Bu pencerede hiçbir tempoda ' + CLEAN_STREAK + ' temiz tekrar yok.' }
        : { value:null, cert:'missing', fresh:false, n:temiz.length,
            why:CLEAN_STREAK + ' temiz tekrar gerekir; ' + temiz.length + ' var.' };
    }

    const yeni = acilan[0];
    const onceki = p.cleanBpm != null ? p.cleanBpm : 0;
    return {
      value:Math.max(yeni, onceki),       // dusmez
      cert:'measured', fresh:yeni > onceki, n:sayac[yeni],
    };
  }

  /* Bir tekrari kaydeder ve esigi yeniden hesaplar.

     `clean` kullanicinin isaretidir: sistem duymaz. Bu yuzden tekrarin
     kendisi "olculdu" (BPM ve tarih makineden), temizlik yargisi ise
     kullanicinindir — ikisi ayri alanlarda durur ve karistirilmaz. */
  async function logAttempt(pieceId, bpm, clean, note){
    const p = (S.pieces || []).find(x => x.id === pieceId);
    if(!p) return { ok:false, error:'Parça bulunamadı.' };
    const n = Number(bpm);
    if(!isFinite(n) || n <= 0) return { ok:false, error:'Tempo girilmedi.' };

    p.attempts = (p.attempts || []).concat([{
      date:U.todayISO(), bpm:Math.round(n), clean:!!clean, note:note || '',
      at:new Date().toISOString(),
    }]);

    const onceki = p.cleanBpm;
    const esik = cleanThreshold(p);
    if(esik.cert === 'measured' && (p.cleanBpm == null || esik.value > p.cleanBpm)){
      p.cleanBpm = esik.value;
      p.thresholdAt = U.todayISO();
    }
    await ESP.Model.savePiece(p);
    return { ok:true, piece:p, threshold:esik, raised:p.cleanBpm !== onceki };
  }

  /* Bir sonraki basamak. Esik yoksa oneri de yoktur: olculmemis bir seyin
     ustune basamak konmaz. */
  function nextStep(piece){
    const t = cleanThreshold(piece);
    if(t.cert === 'missing') return { value:null, cert:'missing' };
    return { value:t.value + BPM_STEP, cert:'derived', from:t.value };
  }

  /* --------------------------------------------------------------- plato

     Bir teknikte PLATEAU_DAYS gundur esigin artmamasi. Plato bir
     basarisizlik degil bir sinyaldir: ayni calisma ayni sonucu veriyorsa
     degismesi gereken sey calismanin kendisidir.

     Hic calisilmamis parca PLATO SAYILMAZ — plato calisan bir seyin
     durmasidir, hic baslamamis bir seyin degil. */
  function plateaus(todayISO){
    return ESP.Memo.of('ac.plateau:' + (todayISO || ''), function(){
      return plateausRaw(todayISO);
    });
  }

  function plateausRaw(todayISO){
    const today = todayISO || U.todayISO();
    return (S.pieces || []).filter(p => {
      if(p.cleanBpm == null) return false;                 // henuz esik yok
      const sonDeneme = (p.attempts || []).reduce((m, a) => a.date > m ? a.date : m, '');
      if(!sonDeneme) return false;
      if(U.diffDays(sonDeneme, today) > PLATEAU_DAYS) return false;  // calisilmiyor, plato degil
      const esikTarihi = p.thresholdAt || sonDeneme;
      return U.diffDays(esikTarihi, today) >= PLATEAU_DAYS;
    }).map(p => ({
      piece:p,
      days:U.diffDays(p.thresholdAt || '', today),
      bpm:p.cleanBpm,
    }));
  }

  /* Hedefe ulasmis parca orani — EHS'nin muzik kalite katsayisi buradan gelir.
     Hedefi girilmemis parca paydaya GIRMEZ: hedefsiz parca basarisiz degildir. */
  function progressRatio(){
    const hedefli = (S.pieces || []).filter(p => p.targetBpm != null && p.cleanBpm != null);
    if(!hedefli.length) return { value:null, cert:'missing', n:0 };
    const ulasan = hedefli.filter(p => p.cleanBpm >= p.targetBpm).length;
    return { value:ulasan / hedefli.length, cert:'derived', n:hedefli.length, reached:ulasan };
  }

  /* ==================================================== artikulasyon (diksiyon)

     WPM = kelime / dakika. Iki girdinin de OLCULMUS olmasi sarttir; biri
     eksikse hesap yapilmaz — "tahmini WPM" diye bir sey yoktur.

     Yuksek WPM iyi degildir; hedef banda yakin WPM iyidir. Bant bir kural
     degil bir baslangic cizgisidir ve kullanicinin kendi kayitlari onu
     yerine oturtur. */
  const WPM_BAND = { min:120, max:150,
    note:'Türkçe sunumda rahat izlenen bant. Kendi kayıtların bu bandı kaydırabilir.' };

  function wpmOf(rec){
    const r = rec || {};
    if(r.secondsCert === 'missing' || r.wordsCert === 'missing') {
      return { value:null, cert:'missing',
        why:'WPM için hem süre hem kelime sayısı ölçülmüş olmalı.' };
    }
    if(!r.seconds || r.seconds <= 0) return { value:null, cert:'missing' };
    return { value:Math.round(r.words / (r.seconds / 60)), cert:'derived' };
  }

  /* Hata orani — kullanicinin kendi isaretledigi hata sayisindan.
     DAIMA "tahmin" etiketi tasir: sistem sesini dinlemedi. */
  function errorRateOf(rec){
    const r = rec || {};
    if(r.errorsCert === 'missing' || r.wordsCert === 'missing' || !r.words){
      return { value:null, cert:'missing' };
    }
    return { value:r.errors / r.words, cert:'estimated' };
  }

  /* Son N kaydin ozeti. Karsilastirma DAIMA kendi gecmisiyle yapilir;
     baskasinin WPM'i ile karsilastirma yapilmaz. */
  function dictionStatus(days, todayISO){
    return ESP.Memo.of('ac.diction:' + (days || '') + ':' + (todayISO || ''), function(){
      return dictionStatusRaw(days, todayISO);
    });
  }

  function dictionStatusRaw(days, todayISO){
    const n = days || 30;
    const today = todayISO || U.todayISO();
    const sinir = U.iso(U.addDays(U.parse(today), -n));
    const kayitlar = (S.recordings || []).filter(r => r.date >= sinir);
    if(!kayitlar.length){
      return { cert:'missing', n:0, windowDays:n,
        why:'Son ' + n + ' günde diksiyon kaydı yok.' };
    }
    const wpmler = kayitlar.map(wpmOf).filter(x => x.cert !== 'missing').map(x => x.value);
    const hatalar = kayitlar.map(errorRateOf).filter(x => x.cert !== 'missing').map(x => x.value);
    const son = kayitlar[0];

    return {
      cert:'derived', n:kayitlar.length, windowDays:n,
      wpm:wpmler.length
        ? { value:Math.round(U.median(wpmler)), cert:'derived', n:wpmler.length }
        : { value:null, cert:'missing' },
      errorRate:hatalar.length
        ? { value:U.median(hatalar), cert:'estimated', n:hatalar.length }
        : { value:null, cert:'missing' },
      inBand:wpmler.length
        ? wpmler.filter(w => w >= WPM_BAND.min && w <= WPM_BAND.max).length / wpmler.length
        : null,
      last:son,
      lastWpm:wpmOf(son),
    };
  }

  /* Diksiyonda "plato": son 30 gunde hata orani medyaninin iyilesmemesi.
     Iki pencere karsilastirilir; ikisinde de olcum yoksa bulgu URETILMEZ. */
  function dictionTrend(todayISO){
    const today = todayISO || U.todayISO();
    const yeni = dictionStatus(14, today);
    const eski = (function(){
      const sinir1 = U.iso(U.addDays(U.parse(today), -28));
      const sinir2 = U.iso(U.addDays(U.parse(today), -14));
      const rows = (S.recordings || []).filter(r => r.date >= sinir1 && r.date < sinir2);
      const h = rows.map(errorRateOf).filter(x => x.cert !== 'missing').map(x => x.value);
      return h.length ? U.median(h) : null;
    })();

    if(yeni.cert === 'missing' || !yeni.errorRate || yeni.errorRate.cert === 'missing'
       || eski == null){
      return { cert:'missing', why:'İki pencerede de ölçüm gerekir; karşılaştırma yapılamadı.' };
    }
    const fark = yeni.errorRate.value - eski;
    return {
      cert:'estimated',
      delta:fark,
      direction:fark < -0.01 ? 'iyi' : fark > 0.01 ? 'kotu' : 'sabit',
      now:yeni.errorRate.value, before:eski,
    };
  }

  /* ------------------------------------------------------------------ ozet */

  /* Muzik masasinin brifing girdisi. */
  function musicStatus(todayISO){
    return ESP.Memo.of('ac.music:' + (todayISO || ''), function(){
      return musicStatusRaw(todayISO);
    });
  }

  function musicStatusRaw(todayISO){
    const today = todayISO || U.todayISO();
    const parcalar = S.pieces || [];
    if(!parcalar.length){
      return { cert:'missing', n:0, why:'Henüz parça ya da teknik girilmemiş.' };
    }
    const esikler = parcalar.map(p => ({ piece:p, t:cleanThreshold(p, today) }));
    const olculen = esikler.filter(x => x.t.cert !== 'missing');
    return {
      cert:olculen.length ? 'measured' : 'missing',
      n:parcalar.length,
      measured:olculen.length,
      plateaus:plateaus(today),
      progress:progressRatio(),
      rows:esikler,
    };
  }

  return {
    CLEAN_STREAK, CLEAN_WINDOW_DAYS, PLATEAU_DAYS, BPM_STEP, WPM_BAND,
    beatMs, beatsOfBar,
    cleanThreshold, logAttempt, nextStep, plateaus, progressRatio, musicStatus,
    wpmOf, errorRateOf, dictionStatus, dictionTrend,
  };
})();
