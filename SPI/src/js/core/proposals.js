/* ÖNERİ KUTUSU — ofisin sisteme dokunabildiği tek kapı.

   Ofis bugüne kadar yalnızca OKUYORDU. Artık yazabilir, ama tek bir
   yoldan:

     ajan önerir → kural motoru DOĞRULAR → sen ONAYLARSIN
                 → motor uygular → geri alınabilir

   Onaysız hiçbir şey değişmez. Bu dosyada «otomatik uygula» diye bir
   yol YOKTUR ve olmamalıdır: ofisin değeri önerisinde, yetkisinde
   değil. Sağlık verisinde yanlış bir kayıt, eksik bir kayıttan
   kötüdür — çünkü eksik kayıt kendini belli eder, yanlış kayıt etmez.

   ─────────────────────────────────────────────────────────────────

   İKİ KAYNAK, TEK KAPI

   `fromText()`   Kural motoru. Cümleyi kendisi çözer; model gerekmez,
                  çevrimdışı çalışır, kota harcamaz. ÖNCE bu denenir.

   `fromModel()`  Ajanın önerisi. KAPALI katalogdan bir eylem ve yapısal
                  parametre. Serbest metin eyleme dönüşmez; parametreler
                  gerçek veriye karşı doğrulanır, uydurulan düşer.

   Doğrulama (`check`) kaynağı ne olursa olsun her zaman çalışır ve HER
   ÇAĞRIDA yeniden çalışır: bekleyen bir öneri, arada veri değiştiği
   için geçersizleşmiş olabilir.

   ─────────────────────────────────────────────────────────────────

   BİLEŞİK CÜMLE

   «İki yumurta yedim ve kırk beş dakika yürüdüm» tek bir olgu değil
   ikidir. Eski hızlı giriş cümlede tek şey anlıyordu ve ikincisi
   sessizce düşüyordu — sessizce düşen veri, alınmamış veriden kötüdür.
   Cümle önce yan cümlelere bölünür, her biri ayrı önerilir.

   Uygulama sırası kasıtlıdır: önce anlık görüntü alınır (geri alma),
   sonra değişiklik yazılır. Böylece geri alma her zaman mümkündür. */

window.SP = window.SP || {};

SP.Proposals = (function(){
  const U = SP.U, M = SP.Model;

  const MAX = 40;                    /* saklanan öneri */
  const STORE = 'office/proposals';

  function fail(why){ return { ok:false, why }; }
  function pass(ctx){ return { ok:true, ctx:ctx || {} }; }

  /* ==================== eylem kataloğu ====================

     Her eylemin dört işlevi vardır ve dördü de ayrılır:
       check   : uygulanabilir mi — hayırsa NEDEN (kullanıcıya gösterilir)
       preview : ne değişecek — önce/sonra satırları
       apply   : değişikliği yazar, geri alma anlık görüntüsünü DÖNDÜRÜR
       revert  : o anlık görüntüden geri alır */

  const KATALOG = {

    /* ---------------------------------------------------- vital yaz */
    'vital-yaz':{
      label:'Günlük ölçüm',
      alanlar:['field', 'value', 'date'],
      check(p){
        const f = SP.Quick.VITAL_FIELDS[p.field];
        if(!f) return fail('Böyle bir günlük ölçüm alanı yok.');
        const v = Number(p.value);
        if(!isFinite(v)) return fail('Değer sayı değil.');
        if(f.min != null && v < f.min) return fail(f.label + ' için ' + v + ' çok düşük.');
        if(f.max != null && v > f.max) return fail(f.label + ' için ' + v + ' çok yüksek.');
        return pass({ f, v });
      },
      preview(p, ctx){
        const eski = M.vitalsOf(p.date);
        const oncekiDeger = eski ? eski[ctx.f.id] : null;
        return [{ alan:ctx.f.label,
          once:oncekiDeger == null ? 'girilmemiş' : U.fmtNum(oncekiDeger) + ' ' + ctx.f.unit,
          sonra:U.fmtNum(ctx.v) + ' ' + ctx.f.unit }];
      },
      async apply(p, ctx){
        const eski = M.vitalsOf(p.date);
        const geri = { date:p.date, field:ctx.f.id,
          value:eski ? eski[ctx.f.id] : null };
        const patch = {};
        patch[ctx.f.id] = ctx.v;
        await M.saveVitals(p.date, patch);
        return geri;
      },
      async revert(geri){
        const patch = {};
        patch[geri.field] = geri.value;
        await M.saveVitals(geri.date, patch);
      },
    },

    /* ----------------------------------------------------- öğün ekle */
    'ogun-ekle':{
      label:'Öğün',
      alanlar:['items', 'slot', 'date'],
      check(p){
        if(!Array.isArray(p.items) || !p.items.length) return fail('Gıda yok.');
        const cozulen = [], eksik = [];
        p.items.forEach(it => {
          const f = SP.FOOD_BY_ID[it.foodId];
          if(!f){ eksik.push(it.foodId); return; }
          const g = Number(it.g);
          if(!isFinite(g) || g <= 0){ eksik.push(f.name + ' (miktar yok)'); return; }
          cozulen.push({ food:f, g:Math.round(g), cert:it.cert || 'estimated' });
        });
        if(!cozulen.length) return fail('Hiçbir gıda tanınmadı: ' + eksik.join(', '));
        return pass({ cozulen, eksik });
      },
      preview(p, ctx){
        return ctx.cozulen.map(x => ({
          alan:x.food.name, once:'—', sonra:U.fmtNum(x.g) + ' g' }));
      },
      async apply(p, ctx){
        const meal = M.newMeal(p.slot || 'ara');
        meal.items = ctx.cozulen.map(x => ({ foodId:x.food.id, g:x.g, cert:x.cert }));
        await M.addMeal(p.date, meal);
        return { date:p.date, mealId:meal.id };
      },
      async revert(geri){
        if(M.deleteMeal) await M.deleteMeal(geri.date, geri.mealId);
      },
    },

    /* ---------------------------------------------------- seans ekle */
    'seans-ekle':{
      label:'Antrenman',
      alanlar:['minutes', 'exerciseId', 'date'],
      check(p){
        const dk = Number(p.minutes);
        if(!isFinite(dk) || dk <= 0) return fail('Süre yok.');
        if(dk > 600) return fail(dk + ' dakika bir seans için fazla; yanlış anlaşılmış olabilir.');
        const ex = p.exerciseId ? SP.EX_BY_ID[p.exerciseId] : null;
        if(p.exerciseId && !ex) return fail('Bu hareket sistemde yok.');
        return pass({ dk:Math.round(dk), ex });
      },
      preview(p, ctx){
        return [{ alan:ctx.ex ? ctx.ex.name : 'Serbest seans',
          once:'—', sonra:ctx.dk + ' dakika' }];
      },
      async apply(p, ctx){
        const w = M.newWorkout(p.date);
        w.minutes = ctx.dk;
        if(ctx.ex){
          w.name = ctx.ex.name;
          w.kind = ctx.ex.kind || 'strength';
          w.items = [{ exId:ctx.ex.id, levelId:null, sets:null, reps:null, minutes:ctx.dk }];
        }
        await M.saveWorkout(w);
        return { workoutId:w.id };
      },
      async revert(geri){
        if(M.deleteWorkout) await M.deleteWorkout(geri.workoutId);
      },
    },

    /* --------------------------------------------------- ölçüm gir */
    'olcum-gir':{
      label:'Tahlil ölçümü',
      alanlar:['rows', 'date'],
      check(p){
        if(!Array.isArray(p.rows) || !p.rows.length) return fail('Ölçüm yok.');
        const cozulen = [], eksik = [];
        p.rows.forEach(r => {
          const b = SP.BIO_BY_ID[r.markerId];
          if(!b){ eksik.push(r.markerId); return; }
          const v = Number(r.value);
          if(!isFinite(v)){ eksik.push(b.name); return; }
          cozulen.push({ b, v });
        });
        if(!cozulen.length) return fail('Hiçbir ölçüm tanınmadı: ' + eksik.join(', '));
        return pass({ cozulen, eksik });
      },
      preview(p, ctx){
        return ctx.cozulen.map(x => {
          const son = M.latestOf(x.b.id);
          return { alan:x.b.name,
            once:son ? U.fmtNum(son.v) + ' ' + x.b.unit + ' · ' + U.fmtDate(son.date) : 'ölçülmemiş',
            sonra:U.fmtNum(x.v) + ' ' + x.b.unit };
        });
      },
      async apply(p, ctx){
        const mevcut = (SP.S.labs || []).find(l => l.date === p.date);
        const rec = mevcut || M.newLab(p.date);
        /* Geri alma icin YALNIZ dokundugumuz alanlarin eski hali. */
        const geri = { labId:rec.id, yeniMi:!mevcut, eski:{} };
        ctx.cozulen.forEach(x => {
          geri.eski[x.b.id] = rec.values[x.b.id] ? Object.assign({}, rec.values[x.b.id]) : null;
          rec.values[x.b.id] = { v:x.v, cert:'measured', unit:x.b.unit };
        });
        await M.saveLab(rec);
        return geri;
      },
      async revert(geri){
        const rec = (SP.S.labs || []).find(l => l.id === geri.labId);
        if(!rec) return;
        if(geri.yeniMi && M.deleteLab){ await M.deleteLab(rec.id); return; }
        Object.keys(geri.eski).forEach(id => {
          if(geri.eski[id]) rec.values[id] = geri.eski[id];
          else delete rec.values[id];
        });
        await M.saveLab(rec);
      },
    },

    /* ----------------------------------------------- semptom işaretle */
    'semptom-isaretle':{
      label:'Şikâyet',
      alanlar:['symptomId', 'severity', 'date'],
      check(p){
        const s = SP.SYMPTOM_BY_ID[p.symptomId];
        if(!s) return fail('Böyle bir şikâyet sözlükte yok.');
        const sd = Number(p.severity);
        if(!isFinite(sd) || sd < 1 || sd > 3) return fail('Şiddet 1 ile 3 arasında olmalı.');
        return pass({ s, sd:Math.round(sd) });
      },
      preview(p, ctx){
        const onceki = SP.Symptom.ofDay(p.date)[ctx.s.id];
        return [{ alan:ctx.s.name,
          once:onceki ? 'şiddet ' + onceki : 'işaretlenmemiş',
          sonra:'şiddet ' + ctx.sd }];
      },
      async apply(p, ctx){
        const onceki = SP.Symptom.ofDay(p.date)[ctx.s.id] || 0;
        await SP.Symptom.setSymptom(p.date, ctx.s.id, ctx.sd);
        return { date:p.date, symptomId:ctx.s.id, onceki };
      },
      async revert(geri){
        await SP.Symptom.setSymptom(geri.date, geri.symptomId, geri.onceki);
      },
    },
  };

  function eylem(id){ return KATALOG[id] || null; }
  function katalogIdleri(){ return Object.keys(KATALOG); }

  /* ==================== doğrulama ve önizleme ==================== */

  function check(p){
    const e = eylem(p && p.action);
    if(!e) return fail('Bilinmeyen eylem: ' + (p && p.action));
    try{ return e.check(p.params || {}); }
    catch(err){ return fail('Doğrulanamadı: ' + (err && err.message || err)); }
  }

  function preview(p){
    const c = check(p);
    if(!c.ok) return { ok:false, why:c.why, rows:[] };
    try{ return { ok:true, rows:eylem(p.action).preview(p.params || {}, c.ctx) || [] }; }
    catch(err){ return { ok:false, why:'Önizlenemedi.', rows:[] }; }
  }

  /* ==================== kural motoru kaynağı ====================

     Bileşik cümle yan cümlelere bölünür. Ayraçlar dilin kendi
     bağlaçlarıdır; virgül de ayraçtır ama SAYININ İÇİNDEKİ virgül
     değildir — «7,2 saat uyudum» tek parçadır. */
  const AYRAC = /\s+(?:ve|ayrıca|bir de|sonra|artı)\s+|[;]|,(?!\d)/gi;

  function yanCumleler(text){
    return String(text || '')
      .split(AYRAC)
      .map(x => String(x || '').trim())
      .filter(x => x.length > 1);
  }

  /* Hızlı giriş ayrıştırıcısının çıktısını katalog eylemine çevirir. */
  function quickToAction(parsed, date, slot){
    if(!parsed) return null;
    if(parsed.kind === 'vital') return { action:'vital-yaz',
      params:{ field:parsed.data.field.id, value:parsed.data.value, date } };
    if(parsed.kind === 'move') return { action:'seans-ekle',
      params:{ minutes:parsed.data.minutes,
        exerciseId:parsed.data.exercise ? parsed.data.exercise.id : null, date } };
    if(parsed.kind === 'lab') return { action:'olcum-gir',
      params:{ rows:parsed.data.rows.map(r => ({ markerId:r.marker.id, value:r.value })), date } };
    if(parsed.kind === 'meal') return { action:'ogun-ekle',
      params:{ items:parsed.data.items.map(i => ({ foodId:i.food.id, g:i.g, cert:i.cert })),
        slot:slot || 'ara', date } };
    return null;
  }

  /* Serbest cümleden öneri üretir — MODEL GEREKMEZ.

     Dönen her satır bir öneri adayıdır; `anlasilmayan` ise kural
     motorunun çözemediği yan cümleleri taşır. Bunlar sessizce
     düşmez: kullanıcıya gösterilir ve istenirse modele sorulur. */
  function fromText(text, opts){
    const o = opts || {};
    const date = o.date || U.todayISO();
    const parcalar = yanCumleler(text);
    const oneriler = [], anlasilmayan = [];

    parcalar.forEach(p => {
      let parsed = null;
      try{ parsed = SP.Quick.parse(p); }catch(e){ parsed = null; }
      const a = quickToAction(parsed, date, o.slot);
      if(a) oneriler.push(Object.assign(a, { kaynak:'rules', metin:p }));
      else anlasilmayan.push(p);
    });

    /* Tek parça hiç anlaşılmadıysa cümlenin TAMAMINI bir kez dene:
       bölme yanlış yerden olmuş olabilir. */
    if(!oneriler.length && parcalar.length > 1){
      let parsed = null;
      try{ parsed = SP.Quick.parse(text); }catch(e){ parsed = null; }
      const a = quickToAction(parsed, date, o.slot);
      if(a) return { oneriler:[Object.assign(a, { kaynak:'rules', metin:String(text).trim() })],
        anlasilmayan:[] };
    }

    return { oneriler, anlasilmayan };
  }

  /* ==================== model kaynağı ====================

     Model SERBEST METİN değil, kapalı katalogdan bir eylem döndürür.
     Katalog dışı bir eylem, var olmayan bir gıda kimliği ya da
     uydurulmuş bir ölçüm `check` tarafından düşürülür ve kullanıcıya
     hiç gösterilmez. */
  function fromModel(raw, opts){
    const o = opts || {};
    const date = o.date || U.todayISO();
    let veri = raw;
    if(typeof raw === 'string'){
      try{ veri = JSON.parse(raw); }catch(e){ return { oneriler:[], hata:'JSON çözülemedi.' }; }
    }
    const liste = Array.isArray(veri) ? veri : (veri && veri.actions) || [];
    const oneriler = [], dusen = [];

    liste.forEach(x => {
      if(!x || !eylem(x.action)){ dusen.push({ x, why:'Katalog dışı eylem.' }); return; }
      const p = { action:x.action,
        params:Object.assign({ date }, x.params || {}),
        kaynak:'model', metin:x.metin || '' };
      const c = check(p);
      if(!c.ok){ dusen.push({ x, why:c.why }); return; }
      oneriler.push(p);
    });
    return { oneriler, dusen };
  }

  /* Modele verilecek katalog tarifi. Eylem adları ve alanları
     buradan çıkar — elle yazılmaz, katalog değişirse tarif de değişir. */
  function catalogPrompt(){
    return Object.keys(KATALOG).map(id => {
      const e = KATALOG[id];
      return '- ' + id + ' (' + e.label + '): ' + e.alanlar.join(', ');
    }).join('\n');
  }

  /* ==================== kayıt ve yaşam döngüsü ==================== */

  function liste(){ return SP.S.proposals || (SP.S.proposals = []); }
  function pending(){ return liste().filter(p => p.status === 'pending'); }
  function all(){ return liste(); }

  async function propose(p){
    const kayit = Object.assign({
      id:U.uid('pr'), at:new Date().toISOString(), status:'pending',
    }, p);
    liste().unshift(kayit);
    if(liste().length > MAX) liste().length = MAX;
    await save();
    return kayit;
  }

  async function approve(id){
    const p = liste().find(x => x.id === id);
    if(!p || p.status !== 'pending') return { ok:false, why:'Öneri bulunamadı.' };
    const c = check(p);
    /* Bekleyen bir oneri arada gecersizlesmis olabilir: veri degismistir. */
    if(!c.ok){
      p.status = 'stale'; p.why = c.why;
      await save();
      return { ok:false, why:c.why };
    }
    try{
      p.undo = await eylem(p.action).apply(p.params, c.ctx);
      p.status = 'applied';
      p.appliedAt = new Date().toISOString();
      await save();
      return { ok:true, proposal:p };
    }catch(err){
      p.status = 'failed'; p.why = String(err && err.message || err);
      await save();
      return { ok:false, why:p.why };
    }
  }

  async function reject(id){
    const p = liste().find(x => x.id === id);
    if(!p) return { ok:false };
    p.status = 'rejected';
    await save();
    return { ok:true };
  }

  async function undo(id){
    const p = liste().find(x => x.id === id);
    if(!p || p.status !== 'applied' || !p.undo) return { ok:false, why:'Geri alınacak bir şey yok.' };
    try{
      await eylem(p.action).revert(p.undo);
      p.status = 'undone';
      await save();
      return { ok:true };
    }catch(err){
      return { ok:false, why:String(err && err.message || err) };
    }
  }

  async function clearResolved(){
    SP.S.proposals = liste().filter(p => p.status === 'pending');
    await save();
  }

  async function save(){ await SP.Store.set(STORE, liste()); }
  async function load(){
    SP.S.proposals = (await SP.Store.get(STORE)) || [];
    return SP.S.proposals;
  }

  return {
    KATALOG, eylem, katalogIdleri, catalogPrompt,
    check, preview,
    fromText, fromModel, yanCumleler, quickToAction,
    propose, approve, reject, undo, clearResolved,
    pending, all, load, save, MAX,
  };
})();
