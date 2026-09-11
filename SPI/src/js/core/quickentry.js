/* HIZLI GIRIS — komut paletine yazilan tek satirin veriye donusmesi.

   `ferritin 26`  ·  `45 dk yuruyus`  ·  `uyku 7,2`  ·  `2 yumurta 1 cay`

   Bu modul YENI BIR AYRISTIRICI DEGILDIR. Sistemin zaten yazilmis
   ayristiricilarini (parseLab, parseMeal) ve olcum sozlugunu kullanir;
   tek isi bir satirin HANGI ayristiriciya gidecegine karar vermek.

   Neden onemli: gunde bes kez birkac saniye, dokuz ay boyunca. Bir
   olcumu girmek icin bolume gitmek, sekme secmek, alan bulmak ve
   kaydetmek gerekiyordu. Simdi Ctrl+K ve bir satir.

   ─────────────────────────────────────────────────────────────────

   IKI DEGISMEZ:

   1. HICBIR SEY DOGRUDAN KAYDEDILMEZ. Palet bir ONIZLEME dondurur;
      kaydetme kullanicinin onayiyla olur. Yanlis anlasilmis bir satirin
      sessizce depoya yazilmasi, elle girmekten kotudur.

   2. ANLASILMAYAN SATIR UYDURULMAZ. Eslesme yoksa `null` doner ve palet
      o satiri komut olarak gostermez. Yaklasik bir eslesme «buldum»
      diye sunulmaz. */

window.SP = window.SP || {};

SP.Quick = (function(){
  const U = SP.U;

  /* Gunluk olcum alanlari — bunlar tahlil degil, gunun kaydidir ve
     ayri bir yere yazilir. */
  const VITAL_FIELDS = {
    sleep:{ id:'sleep', label:'Uyku', unit:'saat', min:0, max:20,
      aliases:['uyku', 'uyudum', 'sleep'] },
    rhr:{ id:'rhr', label:'İstirahat nabzı', unit:'atım/dk', min:25, max:200,
      aliases:['nabiz', 'istirahat nabzi', 'rhr'] },
    hrv:{ id:'hrv', label:'HRV', unit:'ms', min:1, max:300,
      aliases:['hrv', 'rmssd'] },
    weight:{ id:'weight', label:'Kilo', unit:'kg', min:20, max:300,
      aliases:['kilo', 'agirlik', 'weight'] },
    water:{ id:'water', label:'Su', unit:'ml', min:0, max:10000,
      aliases:['su', 'water'] },
    mood:{ id:'mood', label:'Enerji', unit:'/5', min:1, max:5,
      aliases:['enerji', 'mod', 'ruh hali'] },
  };

  /* Sure birimleri — «45 dk yuruyus» ve «1 saat kosu» ayni sey. */
  const SURE_RE = /(\d+(?:[.,]\d+)?)\s*(dk|dakika|dakka|sa|saat|s)\b/i;

  function sayi(x){
    if(x == null) return null;
    const n = Number(String(x).replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  /* ------------------------------------------------------------ gunluk */

  function parseVital(text){
    const n = U.norm(text);
    for(const key of Object.keys(VITAL_FIELDS)){
      const f = VITAL_FIELDS[key];
      for(const a of f.aliases){
        const at = n.indexOf(U.norm(a));
        if(at < 0) continue;
        /* Kelime siniri: «su» ararken «sut» eslesmemeli. */
        const once = at === 0 ? ' ' : n[at - 1];
        const sonra = n[at + a.length] || ' ';
        if(/[a-z0-9]/.test(once) || /[a-z0-9]/.test(sonra)) continue;
        const kuyruk = text.slice(Math.min(text.length, at + a.length));
        const m = kuyruk.match(/(\d+(?:[.,]\d+)?)/);
        if(!m) continue;
        const v = sayi(m[1]);
        if(v == null || v < f.min || v > f.max) continue;
        return { field:f, value:v };
      }
    }
    return null;
  }

  /* ------------------------------------------------------------ hareket */

  function parseMove(text){
    const m = String(text).match(SURE_RE);
    if(!m) return null;
    let dk = sayi(m[1]);
    if(dk == null) return null;
    if(/^s(a|aat)?$/i.test(m[2])) dk = dk * 60;
    if(dk <= 0 || dk > 600) return null;

    /* Hangi hareket?

       Once yalnizca TAM AD araniyordu ve bu sessiz bir kayiptı: tabloda
       «Tempolu yuruyus» diye duran hareket, «45 dakika yurudum» cumlesiyle
       eslesmiyordu. Sure dogru kaydediliyor, hareket «serbest seans»
       oluyordu — yani yuk hesabina giriyor ama kalip dengesine, MET
       degerine ve ilerleme merdivenine girmiyordu.

       Insanlar isim degil FIIL konusur. Artik takma ad indeksi kullanilir
       ve UZUNDAN KISAYA denenir: «tempolu yuruyus» once, «yuruyus» sonra.
       Kisa olan once denenseydi ozgul ad hic eslesmezdi.

       Ad gecmiyorsa yine serbest seans olur: sure kaybolmaz. */
    const n = U.norm(text);
    let ex = null;
    (SP.EX_ALIASES || []).some(x => {
      const a = U.norm(x.alias);
      if(a.length >= 3 && n.indexOf(a) >= 0){ ex = x.ex; return true; }
      return false;
    });
    return { minutes:Math.round(dk), exercise:ex };
  }

  /* ------------------------------------------------------------ tahlil */

  function parseLabLine(text){
    const r = SP.Parse.parseLab(text);
    if(!r.rows.length) return null;
    return { rows:r.rows };
  }

  /* ------------------------------------------------------------- ogun */

  function parseMealLine(text){
    const r = SP.Parse.parseMeal(text);
    if(!r.items.length) return null;
    return { items:r.items, unmatched:r.unmatched };
  }

  /* ============================================================ karar

     Sira onemlidir: en OZGUL olan once denenir. «uyku 7,2» hem gunluk
     alanidir hem de bir gidaya benzeyebilir; gunluk once bakilir.

     «45 dk yuruyus» once hareket olarak denenir cunku icinde sure
     birimi var; tahlil ve ogun ayristiricilari sure birimi tanimaz. */
  function parse(text){
    const t = String(text || '').trim();
    if(t.length < 2) return null;

    const v = parseVital(t);
    if(v) return { kind:'vital', data:v, label:v.field.label + ' ' + U.fmtNum(v.value)
      + ' ' + v.field.unit, hint:'Günlük ölçüm' };

    const mv = parseMove(t);
    if(mv) return { kind:'move', data:mv,
      label:(mv.exercise ? mv.exercise.name : 'Serbest seans') + ' · ' + mv.minutes + ' dk',
      hint:'Antrenman' };

    const lb = parseLabLine(t);
    if(lb) return { kind:'lab', data:lb,
      label:lb.rows.map(r => r.marker.name + ' ' + U.fmtNum(r.value)).join(', '),
      hint:lb.rows.length + ' ölçüm' };

    const ml = parseMealLine(t);
    if(ml) return { kind:'meal', data:ml,
      label:ml.items.map(i => i.food.name).join(', '),
      hint:ml.items.length + ' gıda' };

    return null;
  }

  /* ========================================================== uygulama

     Onaylanan bir onizlemeyi depoya yazar. Palet bunu DOGRUDAN
     cagirmaz: once kullaniciya gosterir. */
  async function apply(parsed, opts){
    const o = opts || {};
    const tarih = o.date || U.todayISO();

    if(parsed.kind === 'vital'){
      const patch = {};
      patch[parsed.data.field.id] = parsed.data.value;
      await SP.Model.saveVitals(tarih, patch);
      return { ok:true, text:parsed.data.field.label + ' kaydedildi', route:'today' };
    }

    if(parsed.kind === 'move'){
      const w = SP.Model.newWorkout(tarih);
      w.minutes = parsed.data.minutes;
      if(parsed.data.exercise){
        w.name = parsed.data.exercise.name;
        w.kind = parsed.data.exercise.kind || 'strength';
        w.items = [{ exId:parsed.data.exercise.id, levelId:null, sets:null,
          reps:null, minutes:parsed.data.minutes }];
      }
      await SP.Model.saveWorkout(w);
      return { ok:true, text:'Seans kaydedildi', route:'move' };
    }

    if(parsed.kind === 'lab'){
      /* Ayni gune ikinci bir oturum acilmaz; var olanin ustune yazilir. */
      const mevcut = (SP.S.labs || []).find(l => l.date === tarih);
      const rec = mevcut || SP.Model.newLab(tarih);
      parsed.data.rows.forEach(r => {
        rec.values[r.marker.id] = { v:r.value, cert:'measured', unit:r.marker.unit };
      });
      await SP.Model.saveLab(rec);
      return { ok:true, text:parsed.data.rows.length + ' ölçüm kaydedildi', route:'labs' };
    }

    if(parsed.kind === 'meal'){
      const meal = SP.Model.newMeal(o.slot || 'ara');
      /* Ayristirici gram degerini `g` alaninda uretir. Burada `i.grams`
         okunuyordu ve boyle bir alan yok: komut paletinden girilen HER
         ogun gramsiz kaydediliyordu. Sessiz bir kayipti — ogun listede
         gorunuyor ama kalorisi, makrosu ve mikro besini sifir. */
      meal.items = parsed.data.items.map(i => ({ foodId:i.food.id, g:i.g,
        cert:i.cert || 'estimated' }));
      await SP.Model.addMeal(tarih, meal);
      return { ok:true, text:'Öğün eklendi', route:'meals' };
    }

    return { ok:false, text:'Anlaşılmadı' };
  }

  return { parse, apply, parseVital, parseMove, VITAL_FIELDS };
})();
