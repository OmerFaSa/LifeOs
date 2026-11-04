/* Bölüm denetimi — her alanda "bir şey ters gidiyor mu?"

   Plan NEREDE olunacağını, sıradaki iş NE yapılacağını söyler. İkisi de
   bir şeyi göremez: alanın İÇİNDE biriken bozukluk. Analiz edilmemiş on
   deneme, ikinci testi hiç yapılmamış yirmi konu, kapatılmamış yüz
   yanlış — hepsi tabloda "hacim" gibi görünür ve hiçbiri ilerleme
   değildir.

   Dört kural (ESP'deki denetimle aynı, alan farklı):

   1. BULGU EYLEME BAĞLI OLMAK ZORUNDADIR. "Yanlışlarının %60'ı açık"
      cümlesi tek başına kaygı üretir; yanında hangi kayıtlar olduğu
      yazmıyorsa o bulgu yazılmaz.

   2. VERİ YOKSA BULGU DA YOKTUR. Hiç deneme girilmemişken "analiz borcu
      yok" demek, ölçülmemiş bir şeyi temiz göstermektir.

   3. BULGU SUÇLAMAZ. "Tembellik ediyorsun" denmez, "şu kayıtlar şu
      durumda" denir.

   4. NÖBETÇİYLE AYNI ŞEY SÖYLENMEZ. O çaba–sonuç ayrışmasını arar;
      bu, birikmiş BAKIM borcunu arar. */
window.LIFEOS.PARCA.yazilar({
  'ays.core.audit.ayni-zorluk-ailesinden-denem':'AYNI zorluk ailesinden denemeler ister; farklı yayınların ',
  'ays.core.audit.kapanis-kurali-yedi-gun-sonr':'Kapanış kuralı yedi gün sonra ikinci bir ölçüm ister; o ölçüm ',
  'ays.core.audit.once-gelir-ustune-kurulan-he':'ÖNCE gelir: üstüne kurulan her şey aynı yerden çöker.',
  'ays.core.audit.bu-esik-bir-bulgu-degil':'Bu eşik bir bulgu değil sistemin seçimidir (Rehber → Eşiklerin ',
  'ays.core.audit.sende-ne-kadar-oldugu-ancak':'SENDE ne kadar olduğu ancak senin verinle ölçülür. İki hafta ',
});

window.LIFEOS.PARCA.yazilar({
  'ays.core.audit.deneme-az':'Deneme az',
  'ays.core.audit.denetim-icin-en-az':'Denetim için en az ',
  'ays.core.audit.analiz-edilmeyen-deneme-bir':'Analiz edilmeyen deneme bir ölçüm değil bir yorgunluktur: ',
  'ays.core.audit.son-denemeler':'Son denemeler ',
  'ays.core.audit.yayin-adi-olmadan-hangi-dene':'Yayın adı olmadan hangi denemelerin karşılaştırılabilir ',
  'ays.core.audit.medyan-yerinde-ya-da-yukseli':'Medyan yerinde ya da yükseliyor ama taban (son dört denemenin ',
  'ays.core.audit.taban':'Taban',
  'ays.core.audit.konu-kaydi-az':'Konu kaydı az',
  'ays.core.audit.i-lk-testi-gecmis-ama-tekrar':'İlk testi geçmiş ama tekrar testi hiç yapılmamış konular. ',
  'ays.core.audit.kapanmis-sayilip-sonradan-bo':'Kapanmış sayılıp sonradan bozulan konular. Bunlar yeni konudan ',
  'ays.core.audit.kapanis-esigine-az-kalmis-am':'Kapanış eşiğine az kalmış ama üç haftadır tekrar edilmemiş ',
  'ays.core.audit.kart-az':'Kart az',
  'ays.core.audit.bu-kartlar':'Bu kartlar ',
  'ays.core.audit.tekrar-borcu':'Tekrar borcu %',
  'ays.core.audit.due-kartlarin':'Due kartların %',
  'ays.core.audit.arka-yuzu-bos-ya-da':'Arka yüzü boş ya da ön yüzüyle aynı olan kartlar her tekrarda ',
  'ays.core.audit.yanlis-kaydi-az':'Yanlış kaydı az',
  'ays.core.audit.i-ncelenmeyen-hata-tekrar-ed':'İncelenmeyen hata, tekrar edeceğin hatadır. Hepsini kapatmak ',
  'ays.core.audit.etiketi-k-i-y-s-d-olmayan-ha':'Etiketi (K/İ/Y/S/D) olmayan hata hiçbir reçeteye bağlanmaz ve ',
  'ays.core.audit.hatalarin':'Hataların %',
  'ays.core.audit.gun-kaydi-az':'Gün kaydı az',
  'ays.core.audit.denetim-icin-en-az-yedi':'Denetim için en az yedi gün kaydı gerekir.',
  'ays.core.audit.ayni-saatte-tekrarlayan-bosl':'Aynı saatte tekrarlayan boşluk, plan hatasıdır — irade hatası ',
  'ays.core.audit.gerceklesen-sure-cogu-gun-gi':'Gerçekleşen süre çoğu gün girilmemiş',
  'ays.core.audit.son':'Son ',
  'ays.core.audit.uyku-neredeyse-hic-girilmemi':'Uyku neredeyse hiç girilmemiş',
  'ays.core.audit.uykunun-netine-etkisi-genel':'Uykunun netine etkisi genel bir bulgu olarak biliniyor ama ',
  'ays.core.audit.deneme':'Deneme',
  'ays.core.audit.konular':'Konular',
  'ays.core.audit.tekrar':'Tekrar',
  'ays.core.audit.yanlis-defteri':'Yanlış defteri',
  'ays.core.audit.plan':'Plan',
  'ays.core.audit.bu-alanin-denetimi-bir-hatay':'Bu alanın denetimi bir hatayla durdu: ',
});


window.R = window.R || {};

R.Audit = (function(){
  const U = R.U, S = R.S, M = R.Model, C = R.Calc;

  /* Bir bulgunun degerlendirilmesi icin gereken en az kayit. */
  const ASGARI = 3;

  /* Sülük kart: bu kadar kez "hatirlamadim" alan kart. */
  const SULUK = 4;

  /* Gecici kapali bir konunun ikinci testi bu kadar gun gecikirse,
     kapanis kuralinin yedi gunluk penceresi kacirilmis demektir. */
  const IKINCI_TEST_GECIKME = 14;

  function bul(id, o){
    return Object.assign({ id, severity:'info', cert:'measured', items:[] }, o);
  }
  function gunFark(iso){
    const d = U.diffDays(String(iso || '').slice(0, 10), U.todayISO());
    return d == null ? null : d;
  }

  /* ------------------------------------------------------------ deneme */

  function examFindings(){
    const out = [];
    const denemeler = (S.exams || []);
    if(denemeler.length < ASGARI){
      return [bul('exam-veri', { severity:'none', cert:'missing', route:'exams',
        title:yz('ays.core.audit.deneme-az'),
        note:yz('ays.core.audit.denetim-icin-en-az') + ASGARI + ' deneme gerekir. Ölçülmemiş '
           + 'bir deneme geçmişi "temiz" değildir, yalnızca ölçülmemiştir.' })];
    }

    /* 1 — Analiz borcu. Analiz edilmemis deneme bir olcum degil bir
       yorgunluktur: sayiyi buyutur, bilgiyi buyutmez. */
    const borc = denemeler.filter(e => !e.analysisCompletedAt
      && (gunFark(e.date) || 0) >= 1)
      .sort((a, b) => a.date < b.date ? -1 : 1);
    if(borc.length >= 2){
      out.push(bul('exam-debt', { severity:'warn', route:'exams',
        title:borc.length + ' deneme analiz edilmemiş',
        note:yz('ays.core.audit.analiz-edilmeyen-deneme-bir')
           + 'sayıyı büyütür, bilgiyi büyütmez. En eski ikisini kapatmadan '
           + 'yenisini çözmemek hem yükü hem sonucu düzeltir.',
        items:borc.slice(0, 5).map(e => ({ id:e.id,
          label:(e.type || 'Deneme') + ' · ' + U.fmtShort(e.date),
          meta:gunFark(e.date) + ' gün önce' })) }));
    }

    /* 2 — Karsilastirilamaz medyan: medyan AYNI zorluk ailesinden
       denemeler ister. Farkli yayinlarin medyani bir sey olcmez. */
    ['TYT', 'AYT'].forEach(function(fam){
      const tam = denemeler.filter(e => e.family === fam && e.kind === 'full');
      if(tam.length < 3) return;
      const yayinlar = {};
      tam.slice(-6).forEach(e => {
        const y = U.norm(e.publisher || '');
        if(y) yayinlar[y] = (yayinlar[y] || 0) + 1;
      });
      const adlar = Object.keys(yayinlar);
      if(adlar.length >= 4){
        out.push(bul('exam-mixed-' + fam, { severity:'warn', route:'exams',
          title:fam + ' medyanı karışık yayınlardan',
          note:yz('ays.core.audit.son-denemeler') + adlar.length + ' farklı yayından. Medyan '
             + yz('ays.core.audit.ayni-zorluk-ailesinden-denem')
             + 'medyanı net değil yayın zorluğu ölçer. Trend okurken bu '
             + 'sayı yanıltır.',
          items:adlar.slice(0, 5).map(y => ({ id:y, label:y,
            meta:yayinlar[y] + ' deneme' })) }));
      }
      if(adlar.length === 0){
        out.push(bul('exam-no-publisher-' + fam, { severity:'info', route:'exams',
          title:fam + ' denemelerinde yayın yazılmamış',
          note:yz('ays.core.audit.yayin-adi-olmadan-hangi-dene')
             + 'olduğu bilinemez. Tek kelime, bütün trend okumasını '
             + 'anlamlı kılar.' }));
      }
    });

    /* 3 — Taban dusuyor mu? Medyan yukselirken taban dusuyorsa istikrar
       bozuluyor demektir: kotu gun dayanikliligi azaliyor. */
    ['TYT', 'AYT'].forEach(function(fam){
      const tr = C.medianTrend(fam);
      if(!tr || tr.count < 6 || tr.delta == null) return;
      const taban = C.examBase(fam);
      const seri = tr.series || [];
      if(seri.length < 6) return;
      const oncekiTaban = Math.min.apply(null, seri.slice(-8, -4));
      if(taban != null && tr.delta >= 0 && taban < oncekiTaban){
        out.push(bul('exam-base-drop-' + fam, { severity:'warn', route:'progress',
          title:fam + ' tabanı düşüyor',
          note:yz('ays.core.audit.medyan-yerinde-ya-da-yukseli')
             + 'en düşüğü) düştü: ' + U.fmtNet(oncekiTaban) + ' → '
             + U.fmtNet(taban) + '. Taban kötü gün dayanıklılığıdır; '
             + 'sınav bir kötü güne denk gelebilir.',
          items:[{ id:fam, label:yz('ays.core.audit.taban'), meta:U.fmtNet(taban) + ' net' }] }));
      }
    });

    return out;
  }

  /* ------------------------------------------------------------- konu */

  function topicFindings(){
    const out = [];
    const durumlar = [];
    Object.keys(S.topics || {}).forEach(function(sid){
      const st = (S.topics[sid] || {}).states || {};
      Object.keys(st).forEach(function(tid){
        durumlar.push(Object.assign({ subjectId:sid, topicId:tid }, st[tid]));
      });
    });
    if(durumlar.length < ASGARI){
      return [bul('topic-veri', { severity:'none', cert:'missing', route:'subjects',
        title:yz('ays.core.audit.konu-kaydi-az'),
        note:yz('ays.core.audit.denetim-icin-en-az') + ASGARI + ' konu kaydı gerekir.' })];
    }

    /* 1 — Gecici kapali kalmis konu: ilk test gecmis, ikincisi hic
       yapilmamis. Kapanis kuralinin yedi gunluk penceresi kaciriliyor. */
    const asili = durumlar.filter(t => t.state === 'provisional'
      && t.first != null && t.second == null
      && (gunFark(t.firstAt) || 0) >= IKINCI_TEST_GECIKME)
      .sort((a, b) => (gunFark(b.firstAt) || 0) - (gunFark(a.firstAt) || 0));
    if(asili.length){
      out.push(bul('topic-pending-second', { severity:'warn', route:'subjects',
        title:asili.length + ' konu ikinci testi bekliyor',
        note:yz('ays.core.audit.i-lk-testi-gecmis-ama-tekrar')
           + yz('ays.core.audit.kapanis-kurali-yedi-gun-sonr')
           + 'yapılmadıkça konu kapanmaz ve «öğrendim» duygusu ölçülmemiş '
           + 'kalır.',
        items:asili.slice(0, 5).map(t => ({ id:t.topicId,
          label:t.topicId, meta:gunFark(t.firstAt) + ' gün önce ilk test' })) }));
    }

    /* 2 — Yeniden acilmis konular: kapanmis ama sonradan bozulmus. */
    const acilan = durumlar.filter(t => t.state === 'reopened');
    if(acilan.length){
      out.push(bul('topic-reopened', { severity:'warn', route:'subjects',
        title:acilan.length + ' konu yeniden açıldı',
        note:yz('ays.core.audit.kapanmis-sayilip-sonradan-bo')
           + yz('ays.core.audit.once-gelir-ustune-kurulan-he'),
        items:acilan.slice(0, 5).map(t => ({ id:t.topicId,
          label:t.topicId, meta:'yeniden açık' })) }));
    }

    /* 3 — Sinira takilmis konu: ilk test esigin hemen altinda kalmis
       ve uzun suredir tekrar edilmemis. */
    const takili = durumlar.filter(t => t.state === 'practicing'
      && t.first != null && t.first >= R.CLOSURE_RULE.first - 15
      && t.first < R.CLOSURE_RULE.first
      && (gunFark(t.firstAt) || 0) >= 21);
    if(takili.length){
      out.push(bul('topic-near-miss', { severity:'info', route:'subjects',
        title:takili.length + ' konu eşiğin hemen altında kaldı',
        note:yz('ays.core.audit.kapanis-esigine-az-kalmis-am')
           + 'konular. Bunlar en ucuz kazançtır: sıfırdan çalışılacak bir '
           + 'konudan çok daha az iş ister.',
        items:takili.slice(0, 5).map(t => ({ id:t.topicId,
          label:t.topicId, meta:'%' + t.first })) }));
    }

    return out;
  }

  /* ----------------------------------------------------------- tekrar */

  function cardFindings(){
    const out = [];
    const kartlar = (S.cards || []);
    if(kartlar.length < ASGARI){
      return [bul('card-veri', { severity:'none', cert:'missing', route:'cards',
        title:yz('ays.core.audit.kart-az'),
        note:yz('ays.core.audit.denetim-icin-en-az') + ASGARI + ' kart gerekir.' })];
    }

    /* 1 — Sülük kart: tekrar eden unutma, kartin kendisini sorgulatir. */
    const suluk = kartlar.map(function(c){
      const unut = (c.history || []).filter(h => h.result === 'forgot').length;
      return { c:c, unut:unut };
    }).filter(x => x.unut >= SULUK).sort((a, b) => b.unut - a.unut);
    if(suluk.length){
      out.push(bul('card-leech', { severity:'warn', route:'cards',
        title:suluk.length + ' sülük kart',
        note:yz('ays.core.audit.bu-kartlar') + SULUK + ' kez ya da daha fazla unutuldu. Bu '
           + 'kadar tekrar eden unutma genelde hafızanın değil KARTIN '
           + 'sorunudur: çok uzun, belirsiz ya da tek kartta iki şey soruyor.',
        items:suluk.slice(0, 5).map(x => ({ id:x.c.id,
          label:String(x.c.front || x.c.question || '(boş)').slice(0, 40),
          meta:x.unut + ' kez unutuldu' })) }));
    }

    /* 2 — Tekrar borcu: gecikmis kart orani. Kural motoru zaten
       hesapliyor; burada esige baglaniyor. */
    const borc = C.cardDebt();
    if(borc > 10){
      out.push(bul('card-debt', { severity:'warn', route:'cards',
        title:yz('ays.core.audit.tekrar-borcu') + borc,
        note:yz('ays.core.audit.due-kartlarin') + borc + '\'i gecikmiş. Borç %10\'u geçtiğinde '
           + 'yeni kart üretmek, hatırlanmayanın üstüne yenisini koymaktır. '
           + yz('ays.core.audit.bu-esik-bir-bulgu-degil')
           + 'dayanağı).' }));
    }

    /* 3 — Arka yuzu eksik kart: her tekrarda cikar, hicbir sey ogretmez. */
    const bozuk = kartlar.filter(function(c){
      const on = String(c.front || c.question || '').trim();
      const arka = String(c.back || c.answer || '').trim();
      return !arka || U.norm(on) === U.norm(arka);
    });
    if(bozuk.length){
      out.push(bul('card-broken', { severity:'warn', route:'cards',
        title:bozuk.length + ' kart eksik',
        note:yz('ays.core.audit.arka-yuzu-bos-ya-da')
           + 'karşına çıkar ve hiçbir şey öğretmez.',
        items:bozuk.slice(0, 5).map(c => ({ id:c.id,
          label:String(c.front || c.question || '(boş)').slice(0, 40),
          meta:'arka yüz eksik' })) }));
    }

    return out;
  }

  /* ----------------------------------------------------- yanlış defteri */

  function errorFindings(){
    const out = [];
    const hatalar = (S.errors || []);
    if(hatalar.length < ASGARI){
      return [bul('error-veri', { severity:'none', cert:'missing', route:'cards',
        title:yz('ays.core.audit.yanlis-kaydi-az'),
        note:yz('ays.core.audit.denetim-icin-en-az') + ASGARI + ' yanlış kaydı gerekir.' })];
    }

    /* 1 — Kapatilmamis yanlislar: incelenmeyen hata, tekrar edecek hata. */
    const acik = hatalar.filter(e => !e.closedAt
      && (gunFark(e.createdAt) || 0) >= 7)
      .sort((a, b) => (gunFark(b.createdAt) || 0) - (gunFark(a.createdAt) || 0));
    if(acik.length >= 5){
      out.push(bul('error-open', { severity:'warn', route:'cards',
        title:acik.length + ' yanlış bir haftadır açık',
        note:yz('ays.core.audit.i-ncelenmeyen-hata-tekrar-ed')
           + 'gerekmez: en çok tekrar eden etiketten başlamak, listeyi '
           + 'baştan sona gitmekten hızlıdır.',
        items:acik.slice(0, 5).map(e => ({ id:e.id,
          label:String(e.topic || e.subject || e.note || '(etiketsiz)').slice(0, 40),
          meta:gunFark(e.createdAt) + ' gün' })) }));
    }

    /* 2 — Etiketsiz yanlis: etiketi olmayan hata hicbir receteye baglanmaz. */
    const etiketsiz = hatalar.filter(e => !e.tag && !e.label);
    if(etiketsiz.length >= 3){
      out.push(bul('error-untagged', { severity:'info', route:'cards',
        title:etiketsiz.length + ' yanlış etiketsiz',
        note:yz('ays.core.audit.etiketi-k-i-y-s-d-olmayan-ha')
           + 'hata haritasında görünmez. Etiket bir sınıflandırma değil, '
           + 'ne yapılacağının adıdır.',
        items:etiketsiz.slice(0, 5).map(e => ({ id:e.id,
          label:String(e.topic || e.note || '(not yok)').slice(0, 40),
          meta:'etiket yok' })) }));
    }

    /* 3 — Baskin etiket: tek bir hata turu listeyi yutmussa, recete de
       tektir ve onceliklidir. */
    const say = {};
    hatalar.forEach(e => { const t = e.tag || e.label; if(t) say[t] = (say[t] || 0) + 1; });
    const etiketler = Object.keys(say);
    if(etiketler.length >= 2){
      const toplam = etiketler.reduce((a, k) => a + say[k], 0);
      const enCok = etiketler.reduce((m, k) => say[k] > say[m] ? k : m, etiketler[0]);
      const pay = say[enCok] / toplam;
      if(pay >= 0.4){
        const tanim = R.ERROR_TAGS[enCok];
        out.push(bul('error-dominant', { severity:'info', route:'analytics',
          title:yz('ays.core.audit.hatalarin') + Math.round(pay * 100) + '\'i tek türde',
          note:(tanim ? tanim.name : enCok) + ' baskın. Bu iyi haberdir: tek '
             + 'bir reçete listenin büyük kısmını kapatır'
             + (tanim ? ' — ' + tanim.recipe + '.' : '.'),
          items:[{ id:enCok, label:tanim ? tanim.name : enCok,
            meta:say[enCok] + '/' + toplam }] }));
      }
    }

    return out;
  }

  /* ------------------------------------------------------------- plan */

  function planFindings(){
    const out = [];
    const gunler = Object.keys(S.days || {}).sort();
    if(gunler.length < 7){
      return [bul('plan-veri', { severity:'none', cert:'missing', route:'week',
        title:yz('ays.core.audit.gun-kaydi-az'),
        note:yz('ays.core.audit.denetim-icin-en-az-yedi') })];
    }

    const son14 = gunler.slice(-14);

    /* 1 — Surekli atlanan blok: ayni saat diliminde tekrarlayan bosluk,
       plan hatasidir, irade hatasi degil. */
    const slotSay = {}, slotAtlanan = {};
    son14.forEach(function(d){
      (S.days[d].blocks || []).forEach(function(b){
        if(b.slot === 'Dinlenme') return;
        slotSay[b.slot] = (slotSay[b.slot] || 0) + 1;
        if(b.status !== 'done') slotAtlanan[b.slot] = (slotAtlanan[b.slot] || 0) + 1;
      });
    });
    const kotu = Object.keys(slotSay).filter(function(s){
      return slotSay[s] >= 5 && (slotAtlanan[s] || 0) / slotSay[s] >= 0.6;
    });
    if(kotu.length){
      out.push(bul('plan-dead-slot', { severity:'warn', route:'plan',
        title:kotu.length + ' zaman dilimi sürekli atlanıyor',
        note:yz('ays.core.audit.ayni-saatte-tekrarlayan-bosl')
           + 'değil. O saatte gerçekten müsait olmayabilirsin; planı '
           + 'gerçeğe uydurmak, gerçeği plana uydurmaya çalışmaktan kolaydır.',
        items:kotu.slice(0, 5).map(s => ({ id:s, label:s,
          meta:'%' + Math.round(100 * (slotAtlanan[s] || 0) / slotSay[s]) + ' atlandı' })) }));
    }

    /* 2 — Gerceklesen sure hic yazilmamis: plan tamamlandi isaretleniyor
       ama sure girilmiyorsa hicbir olcum yapilamaz. */
    const sureli = son14.filter(function(d){
      return (S.days[d].blocks || []).some(b => b.actualMin != null);
    });
    if(sureli.length <= son14.length / 3){
      out.push(bul('plan-no-minutes', { severity:'info', route:'today',
        title:yz('ays.core.audit.gerceklesen-sure-cogu-gun-gi'),
        note:yz('ays.core.audit.son') + son14.length + ' günün yalnızca ' + sureli.length
           + '\'inde gerçekleşen süre var. Süre olmadan sürtünme, verim ve '
           + 'kapasite ölçülemez — hiçbiri sıfır sayılmaz, ölçülmemiş kalır.' }));
    }

    /* 3 — Uyku hic girilmemis: uyku–net iliskisi SENIN verinden olculur. */
    const uykulu = son14.filter(d => S.days[d].sleepHours != null);
    if(uykulu.length <= 2){
      out.push(bul('plan-no-sleep', { severity:'info', route:'today',
        title:yz('ays.core.audit.uyku-neredeyse-hic-girilmemi'),
        note:yz('ays.core.audit.uykunun-netine-etkisi-genel')
           + yz('ays.core.audit.sende-ne-kadar-oldugu-ancak')
           + 'girmek, bu ilişkiyi görünür kılmaya yeter.' }));
    }

    return out;
  }

  /* ---------------------------------------------------------- toplama */

  const AREAS = [
    { id:'exams', label:yz('ays.core.audit.deneme'), fn:examFindings },
    { id:'topics', label:yz('ays.core.audit.konular'), fn:topicFindings },
    { id:'cards', label:yz('ays.core.audit.tekrar'), fn:cardFindings },
    { id:'errors', label:yz('ays.core.audit.yanlis-defteri'), fn:errorFindings },
    { id:'plan', label:yz('ays.core.audit.plan'), fn:planFindings },
  ];

  /* Bir alanin taramasi patlarsa SESSIZCE bos donmez.

     Once boyleydi ve bir hatayi tam olarak sakladi: denetim hic bulgu
     uretmiyordu ama ekran "temiz" diyordu. Denetim motorunun kendi
     hatasini gizlemesi, denetimin amacina aykiridir. Artik hata bir
     BULGU olarak doner ve gorunur. */
  function of(areaId){
    const a = AREAS.filter(function(x){ return x.id === areaId; })[0];
    if(!a) return [];
    try{ return a.fn(); }
    catch(e){
      return [bul('audit-error-' + areaId, { severity:'warn', cert:'missing',
        title:a.label + ' taraması çalışmadı',
        note:yz('ays.core.audit.bu-alanin-denetimi-bir-hatay')
           + String((e && e.message) || e)
           + '. Bu bir veri sorunu değil bir yazılım hatasıdır; '
           + 'kayıtların etkilenmez.' })];
    }
  }

  function all(){
    const siralama = { warn:0, info:1, none:2 };
    const out = [];
    AREAS.forEach(function(a){
      of(a.id).forEach(function(f){
        out.push(Object.assign({ area:a.id, areaLabel:a.label }, f));
      });
    });
    /* DIKKAT — `||` burada kullanilamaz: siralama.warn degeri SIFIRDIR ve
       `0 || 9` dokuz doner. Bu hata butun uyarilari listenin SONUNA
       atiyordu; ekran "bulgu var" diyordu ama once veri yok satirlarini
       gosteriyordu. Sifir gecerli bir sira degeridir. */
    const sira = function(s){
      return siralama[s] == null ? 9 : siralama[s];
    };
    return out.sort(function(x, y){ return sira(x.severity) - sira(y.severity); });
  }

  function count(){
    return all().filter(f => f.severity !== 'none').length;
  }

  return { of, all, count, AREAS, ASGARI, SULUK, IKINCI_TEST_GECIKME };
})();
