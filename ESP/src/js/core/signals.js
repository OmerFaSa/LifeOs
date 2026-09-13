/* Sinyal katmani — denetim mekanizmasi ile denetim EKRANI ayni sey degildir.

   Bu dosya bir elestiriden dogdu ve elestiri hakliydi:

     "Sisteme bir denetim katmani eklemek ile kullaniciya bir denetim
      ekrani eklemek ayni sey degildir. Yeni bir karar mekanizmasinin bir
      arayuz yuzeyi olmasi gerekmez."

   Nobetci (core/goodhart.js) ve surtunme olcer (core/friction.js) arka
   planda calisan mekanizmalardir. Kullanicinin "Nobetci → Nobetler →
   Cabalar → Pencereler" diye bir ekran agacini gezmesi gerekmez; gerekli
   olan tek sey, dogru anda MEVCUT is akisinin icine dusen TEK BIR SORUDUR.

   Dort karar bu dosyayi yonetir:

   1. AYNI ANDA EN FAZLA BIR ACIK SINYAL. Bu, butun dosyanin en onemli
      kurali. Uc soruyu ayni anda sormak, uc ekran acmakla ayni sey olur.
      Yeni bir ayrisma bulunsa bile, acik sinyal kapanmadan siraya girer.

   2. SINYAL BIR SORUDUR, BIR RAPOR DEGIL. Govdesi tek cumle, cevabi tek
      dokunus. Grafik yok, tablo yok, pencere karsilastirmasi yok — onlar
      isteyen icin ayrintida durur.

   3. HAYAT DONGUSU KAYDEDILIR: tespit → farkindalik → mudahale → sonuc.
      "Kac anomali yakaladi" bir fayda olcusu DEGILDIR. Faydayi olcen sey,
      sorudan SONRA davranisin degisip degismedigi ve sonraki pencerede
      ayrismanin kapanip kapanmadigidir.

   4. NEDENSELLIK IDDIA EDILMEZ. Zincir kaydedilir, "bu soru sayesinde
      duzeldi" denmez. Iki pencere arasinda bir suru sey degisir. Sistem
      yalnizca sirayi gosterir; yorumu kullaniciya birakir. */

window.ESP = window.ESP || {};

ESP.Signals = (function(){
  const U = ESP.U, S = ESP.S;

  /* Ayni sinyal kapandiktan sonra en az bu kadar gun gecmeden yeniden
     acilmaz. Ayni soruyu her hafta sormak, soru sormak degil dirtmektir. */
  const SOGUMA_GUN = 21;

  /* Bir sinyal bu kadar gun cevapsiz kalirsa kendiliginden kapanir:
     cevaplanmayan soru da bir cevaptir ve israr etmek yuk uretir. */
  const OMUR_GUN = 14;

  function list(){ return (S.signals || []).slice(); }
  function open(){ return list().filter(s => s.status === 'open'); }
  function closed(){ return list().filter(s => s.status !== 'open'); }

  function norm(x){
    const o = x || {};
    return {
      id:o.id || U.uid('sg'),
      kind:o.kind || 'goodhart',        // goodhart | friction
      ref:o.ref || null,                // hangi cift / hangi olcum
      title:String(o.title || ''),
      question:String(o.question || ''),
      /* tespit anindaki olcum — sonucu karsilastirmak icin saklanir */
      snapshot:o.snapshot || null,
      status:o.status || 'open',        // open | answered | expired | resolved
      openedAt:o.openedAt || new Date().toISOString(),
      seenAt:o.seenAt || null,          // kullaniciya GOSTERILDI
      answeredAt:o.answeredAt || null,  // kullanici CEVAPLADI
      answer:o.answer || null,
      closedAt:o.closedAt || null,
      /* kapanista olculen sonuc — iddia degil, kayit */
      outcome:o.outcome || null,        // 'realigned' | 'still-decoupled' | 'unmeasurable'
    };
  }

  async function save(sig){
    S.signals = list().map(x => x.id === sig.id ? sig : x);
    if(!S.signals.some(x => x.id === sig.id)) S.signals = S.signals.concat([sig]);
    await ESP.Store.set('signals/' + sig.id, sig);
    return sig;
  }

  async function load(){
    S.signals = ((await ESP.Store.list('signals')) || []).map(norm);
    return S.signals;
  }

  /* ------------------------------------------------------------ üretim */

  /* Bir çiftin son kapanmış sinyalinden bu yana kaç gün geçti? */
  function sonKapanis(ref){
    const g = closed().filter(s => s.ref === ref)
      .map(s => s.closedAt).filter(Boolean).sort();
    if(!g.length) return null;
    return U.diffDays(g[g.length - 1].slice(0, 10), U.todayISO());
  }

  /* Nöbetçiyi ve sürtünme ölçeri çalıştırır, gerekiyorsa TEK sinyal açar
     ve açık sinyalin kaderini günceller.

     Bu işlev her açılışta bir kez çağrılır; kendi başına hiçbir şey
     çizmez. Ekran yüzeyi yok — kural motoru ile iş akışı arasındaki
     köprü bu. */
  async function sync(){
    const bugun = U.todayISO();
    let degisti = false;

    /* 1 — Açık sinyalin kaderi. */
    for(const s of open()){
      const yas = U.diffDays(s.openedAt.slice(0, 10), bugun);

      /* Ayrışma kapandı mı? Kapandıysa sinyal de kapanır ve SONUÇ
         kaydedilir. Nedensellik iddia edilmez: yalnızca sıra kaydedilir. */
      if(s.kind === 'goodhart'){
        const cift = ESP.Goodhart.scan().filter(p => p.id === s.ref)[0];
        if(cift && cift.status !== 'decoupled'){
          s.status = s.answeredAt ? 'resolved' : 'expired';
          s.closedAt = new Date().toISOString();
          s.outcome = cift.status === 'unknown' ? 'unmeasurable' : 'realigned';
          await save(s); degisti = true;
          continue;
        }
      }
      if(yas != null && yas >= OMUR_GUN){
        s.status = s.answeredAt ? 'resolved' : 'expired';
        s.closedAt = new Date().toISOString();
        s.outcome = s.kind === 'goodhart' ? 'still-decoupled' : 'unmeasurable';
        await save(s); degisti = true;
      }
    }

    /* 2 — Açık sinyal varsa YENİSİ AÇILMAZ. Kuralın tamamı bu satırda. */
    if(open().length) return { changed:degisti, opened:null };

    /* 3 — Yeni sinyal: önce nöbetçi, sonra sürtünme. */
    const bayraklar = ESP.Goodhart.flags()
      .filter(p => { const g = sonKapanis(p.id); return g == null || g >= SOGUMA_GUN; });

    if(bayraklar.length){
      const p = bayraklar[0];
      const sig = norm({ kind:'goodhart', ref:p.id,
        title:p.effortLabel + ' → ' + p.outcomeLabel,
        question:p.question,
        snapshot:{ effort:p.effort, outcome:p.outcome,
          effortChange:p.effortChange, outcomeChange:p.outcomeChange } });
      await save(sig);
      return { changed:true, opened:sig };
    }

    const f = ESP.Friction.verdict();
    if(f.level === 'high' && (sonKapanis('friction') == null
        || sonKapanis('friction') >= SOGUMA_GUN)){
      const sig = norm({ kind:'friction', ref:'friction',
        title:'Sistemde geçen süre',
        question:'Son iki haftada günde ' + f.window.perDay + ' dakika sistemi '
          + 'yönetmekle geçti. Hangi kaydı bırakmak işini bozmaz?',
        snapshot:{ perDay:f.window.perDay, ratio:f.window.ratio } });
      await save(sig);
      return { changed:true, opened:sig };
    }

    return { changed:degisti, opened:null };
  }

  /* Şu an sorulacak tek soru. Yoksa null — ve sessizlik iyi haberdir. */
  function current(){ return open()[0] || null; }

  /* Kullanıcıya gösterildi. «Farkındalık» adımı budur ve gösterim
     anında damgalanır: sonradan "gördü mü" diye sormanın yolu yok. */
  async function markSeen(id){
    const s = open().filter(x => x.id === id)[0];
    if(!s || s.seenAt) return { ok:false };
    s.seenAt = new Date().toISOString();
    await save(s);
    return { ok:true };
  }

  /* Cevap. Sinyal kapanmaz — ayrışmanın gerçekten kapanıp kapanmadığı
     bir sonraki pencerede ölçülecek. Cevap yalnızca zincire yazılır. */
  async function answer(id, text){
    const s = open().filter(x => x.id === id)[0];
    if(!s) return { ok:false, error:'Açık sinyal bulunamadı.' };
    s.answeredAt = new Date().toISOString();
    s.answer = String(text || '').slice(0, 400);
    s.status = 'open';
    await save(s);
    return { ok:true, signal:s };
  }

  /* Kullanıcı soruyu reddedebilir: «bu bende bir sorun değil». Bu da bir
     cevaptır ve kaydedilir — sistemin her sorusunun haklı olması gerekmez. */
  async function dismiss(id, why){
    const s = open().filter(x => x.id === id)[0];
    if(!s) return { ok:false };
    s.status = 'resolved';
    s.answeredAt = s.answeredAt || new Date().toISOString();
    s.answer = String(why || 'Kullanıcı bu soruyu geçerli bulmadı.').slice(0, 400);
    s.closedAt = new Date().toISOString();
    s.outcome = 'dismissed';
    await save(s);
    return { ok:true };
  }

  /* ---------------------------------------------------------- fayda ölçüsü

     «Kaç anomali yakaladı» bir fayda ölçüsü değildir. Burada ölçülen şey
     ZİNCİRDİR: kaç soru soruldu, kaçı görüldü, kaçı cevaplandı, ve
     cevaplananların kaçında ayrışma sonraki pencerede kapandı.

     Son sütun nedensellik DEĞİLDİR ve öyle etiketlenmez. Cevaplanan ve
     cevaplanmayan sinyallerin kapanma oranını yan yana koymak, elde
     edilebilecek en dürüst karşılaştırmadır — deney değil, gözlem. */
  function efficacy(){
    const hepsi = list();
    const kapali = closed();
    const cevaplanan = kapali.filter(s => s.answeredAt && s.outcome !== 'dismissed');
    const cevapsiz = kapali.filter(s => !s.answeredAt);

    const duzelen = arr => arr.filter(s => s.outcome === 'realigned').length;

    const out = {
      opened:hepsi.length,
      seen:hepsi.filter(s => s.seenAt).length,
      answered:hepsi.filter(s => s.answeredAt).length,
      dismissed:kapali.filter(s => s.outcome === 'dismissed').length,
      closed:kapali.length,
      answeredClosed:cevaplanan.length,
      unansweredClosed:cevapsiz.length,
      realignedAfterAnswer:duzelen(cevaplanan),
      realignedWithoutAnswer:duzelen(cevapsiz),
      cert:'missing',
      note:'',
    };

    /* Az sayida kayit hukum vermez — kalibrasyon defterindeki kuralin
       aynisi. Uc sinyalle "nobetci ise yariyor" demek, uc soruyla sinav
       yapmaktir. */
    const ASGARI = 5;
    if(kapali.length < ASGARI){
      out.note = 'Kapanmış ' + kapali.length + ' sinyal var; karşılaştırma için '
        + ASGARI + ' gerekir. Nöbetçinin işe yarayıp yaramadığı henüz ölçülmedi '
        + '— ve ölçülmeden «yarıyor» denmez.';
      return out;
    }
    out.cert = 'observed';
    const oran = (a, n) => n ? Math.round(100 * a / n) : null;
    out.answeredRate = oran(out.realignedAfterAnswer, cevaplanan.length);
    out.unansweredRate = oran(out.realignedWithoutAnswer, cevapsiz.length);
    out.note = 'Cevaplanan ' + cevaplanan.length + ' sinyalin %'
      + (out.answeredRate == null ? '—' : out.answeredRate) + '\'inde ayrışma '
      + 'sonraki pencerede kapandı; cevaplanmayan ' + cevapsiz.length
      + ' sinyalde bu oran %' + (out.unansweredRate == null ? '—' : out.unansweredRate)
      + '. Bu bir NEDENSELLİK ölçüsü değildir: iki pencere arasında başka '
      + 'çok şey değişir. Yalnızca sıra kaydedilmiştir.';
    return out;
  }

  /* Ekranın kendini kanıtlaması için tek cümle.

     Eğer nöbetçi hiç görülmüyor ya da görülüp hiç cevaplanmıyorsa, bu
     ekranın varlığı savunulamaz ve sistem bunu KENDİSİ söyler. */
  function screenVerdict(){
    const e = efficacy();
    if(e.opened < 3){
      return { level:'unknown',
        text:'Henüz yeterli sinyal üretilmedi; bu sayfanın gerekliliği '
           + 'ölçülmemiş durumda.' };
    }
    if(e.seen === 0){
      return { level:'unused',
        text:'Üretilen ' + e.opened + ' sinyalin hiçbiri görülmemiş. '
           + 'Görülmeyen bir denetim, denetim değildir.' };
    }
    if(e.answered === 0){
      return { level:'ignored',
        text:'Sinyaller görülüyor ama hiçbiri cevaplanmıyor. Sorular '
           + 'yanlış soru olabilir ya da yanlış anda geliyor olabilir.' };
    }
    return { level:'used',
      text:e.answered + '/' + e.opened + ' sinyal cevaplanmış. ' + e.note };
  }

  return { load, sync, current, markSeen, answer, dismiss, efficacy,
    screenVerdict, list, open, closed, norm, SOGUMA_GUN, OMUR_GUN };
})();
