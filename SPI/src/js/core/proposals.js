/* ÖNERİ KUTUSU — ofisin sisteme dokunabildiği tek kapı.

   Ofis bugüne kadar yalnızca OKUYORDU. Artık yazabilir, ama tek bir
   yoldan:

     ajan önerir → kural motoru DOĞRULAR → sen ONAYLARSIN
                 → motor uygular → geri alınabilir

   SEVİYE (AGENTS.md §1.9): kullanıcının KENDİ cümlesinden kural
   motorunun çıkardığı KÜÇÜK eylem sormadan uygulanabilir ve geri
   alınabilir kalır — ama ÖLÇÜM yazan eylem (tek ölçüm, bir öğün, bir
   seans, şikâyet; katalogda `olcum:true`) hiçbir ayarda sormadan
   yazılmaz: «7 saat uyumadım» 420 dakikalık seans olarak sessizce
   yazılıyordu (belgeler/ekip/HATALAR.md KR-1). Tahlil değeri ve bölüm gizleme
   ORTA'dır, her zaman sorulur; modelin yorumladığı cümle de onay bekler. Sağlık verisinde yanlış bir kayıt, eksik bir kayıttan
   kötüdür — eksik kayıt kendini belli eder, yanlış kayıt etmez. Karar
   tek yerde verilir: otomatikMi().

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

  /* ==================== geri alma sırası ====================

     «uyku 7» sonra «uyku 7,5» girilip ilki geri alınınca uyku boşalıyordu:
     geri alma eski değeri MUTLAK yazıyordu (belgeler/ekip/HATALAR.md Y-6). Kural:
     aynı alana sonra yazan bir kayıt varsa değer onundur, dokunulmaz ve
     onun anlık görüntüsü bu kayıt hiç olmamış gibi düzeltilir; yoksa alan
     hâlâ bu kaydın değerindeyse eski hâline döner, elle değiştirilmişse
     dokunulmaz. */
  function ayniHedef(o, action, kosul){
    return ((o && o.sonraki) || []).filter(x => x.action === action && x.undo && kosul(x.undo))
      .map(x => x.undo);
  }

  /* Uygulama sırası. `appliedAt` aynı milisaniyeye düşebilir; `sira` tekdir.
     Sırası olmayan eski kayıt, sırası olandan önce uygulanmıştır. */
  function sonraMi(x, row){
    const a = Number(x.sira) || 0, b = Number(row.sira) || 0;
    if(a || b) return a > b;
    return String(x.appliedAt || '') > String(row.appliedAt || '');
  }

  function sonrakiler(row){
    return liste().filter(x => x !== row && x.status === 'applied' && sonraMi(x, row))
      .sort((x, y) => sonraMi(x, y) ? 1 : sonraMi(y, x) ? -1 : 0);
  }

  /* EKLEME GERİ ALINIR (2026-10-25): su toplanır; geri alma o kaydın
     EKLEDİĞİNİ çıkarır, sonraki eklemeleri korur. +250 sonra +500 girilip
     ilki geri alınınca toplam 500 kalır (750'de kalmaz). Zincirin arasına
     elle düzenleme girdiyse dokunulmaz; sonraki mutlak kayıt bu eklemeyi
     zaten ezmiştir.
     ZİNCİR TEK YOLDUR (2026-10-25): mutlak kaydın geri alınması da buradan
     geçer (`baslangic` = o kaydın yazdığı değer). Eskiden mutlak kayıt
     yalnız İLK eklemeyi yeniden hesaplıyordu: 1000, +250, +250 yazılıp
     ilki geri alınınca değer 1500'de kalıyordu (500 olmalıydı). Eksik
     değer (null) ile 0 ayrı kalır: boş günün zinciri boşa döner. */
  async function zincirGeriAl(geri, o, baslangic){
    const sonraki = ayniHedef(o, 'vital-yaz', x => x.date === geri.date && x.field === geri.field);
    let onceki = baslangic, yerine = geri.value;
    for(const x of sonraki){
      if(x.value !== onceki) return;
      x.value = yerine;
      if(x.ek == null) return;
      onceki = x.yeni;
      x.yeni = (yerine || 0) + x.ek;
      yerine = x.yeni;
    }
    const v = M.vitalsOf(geri.date);
    if(!v || v[geri.field] !== onceki) return;
    const patch = {};
    patch[geri.field] = yerine == null ? null : yerine;
    await M.saveVitals(geri.date, patch);
  }

  function yeniSira(){
    return liste().reduce((m, x) => Math.max(m, Number(x.sira) || 0), 0) + 1;
  }

  /* Günlük ölçümün o anki değeri: `sanal`da varsa öndeki önerinin
     yazacağı değer, yoksa kayıtlı değer; girilmemişse null (0 değil). */
  function sanalAnahtar(date, id){ return String(date) + '|' + id; }
  function tabanOf(date, id, sanal){
    const k = sanalAnahtar(date, id);
    if(sanal && Object.prototype.hasOwnProperty.call(sanal, k)) return sanal[k];
    const e = M.vitalsOf(date);
    return e && e[id] != null ? Number(e[id]) : null;
  }

  const KATALOG = {

    /* ---------------------------------------------------- vital yaz */
    'vital-yaz':{
      level:'kucuk',
      olcum:true,
      label:'Günlük ölçüm',
      /* `ekle` (2026-10-25; kullanıcı: «spi için daha işlevli veri girişi,
         sürtünmeyi azaltacak teknikler ile daha güzel yap»): değer günün
         toplamına EKLENİR (su). «2 bardak su içtim» 1000 ml'nin üstüne 400
         yazıyordu. Toplam her doğrulamada o anki kayıttan yeniden hesaplanır:
         bekleyen öneri arada eklenen suyu ezmez. `sanal` (2026-10-25):
         birlikte gösterilen öneriler için öndeki satırların yazacağı değer
         (sirali); verilmezse kayıtlı değer. */
      alanlar:['field', 'value', 'date', 'ekle'],
      check(p, sanal){
        const f = SP.Quick.VITAL_FIELDS[p.field];
        if(!f) return fail('Böyle bir günlük ölçüm alanı yok.');
        const v = Number(p.value);
        if(!isFinite(v)) return fail('Değer sayı değil.');
        const once = tabanOf(p.date, f.id, sanal);
        if(p.ekle === true && f.ekle){
          if(v <= 0) return fail(f.label + ' için eklenecek miktar yok.');
          const toplam = (once == null ? 0 : once) + v;
          if(f.max != null && toplam > f.max) return fail(f.label + ' için toplam ' + U.fmtNum(toplam) + ' ' + f.unit + ' çok yüksek.');
          return pass({ f, v:toplam, ek:v, once });
        }
        if(f.min != null && v < f.min) return fail(f.label + ' için ' + v + ' çok düşük.');
        if(f.max != null && v > f.max) return fail(f.label + ' için ' + v + ' çok yüksek.');
        return pass({ f, v, once });
      },
      preview(p, ctx){
        const oncekiDeger = ctx.once;
        return [{ alan:ctx.f.label,
          once:oncekiDeger == null ? 'girilmemiş' : U.fmtNum(oncekiDeger) + ' ' + ctx.f.unit,
          sonra:ctx.ek != null
            ? '+' + U.fmtNum(ctx.ek) + ' ' + ctx.f.unit + ' · toplam ' + U.fmtNum(ctx.v) + ' ' + ctx.f.unit
            : U.fmtNum(ctx.v) + ' ' + ctx.f.unit }];
      },
      async apply(p, ctx){
        const eski = M.vitalsOf(p.date);
        const geri = { date:p.date, field:ctx.f.id,
          value:eski ? eski[ctx.f.id] : null, yeni:ctx.v };
        if(ctx.ek != null) geri.ek = ctx.ek;
        const patch = {};
        patch[ctx.f.id] = ctx.v;
        await M.saveVitals(p.date, patch);
        return geri;
      },
      /* Sonraki kaydı ve elle düzenlemeyi ezmez (HATALAR Y-6). Ekleme de
         mutlak kayıt da aynı zincirden geri alınır (2026-10-25): sonraki
         eklemelerin HEPSİ bu kayıt hiç olmamış gibi yeniden hesaplanır. */
      async revert(geri, o){
        const yeni = geri.yeni != null ? geri.yeni : Number(((o && o.params) || {}).value);
        return zincirGeriAl(geri, o, yeni);
      },
    },

    /* ----------------------------------------------------- öğün ekle */
    'ogun-ekle':{
      level:'kucuk',
      olcum:true,
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
        const meal = M.newMeal(p.slot || (SP.Ogun ? SP.Ogun.simdiki() : 'ara1'));
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
      level:'kucuk',
      olcum:true,
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

    /* ------------------------------------------------ kısa uyku ekle */
    'kestirme-ekle':{
      level:'kucuk',
      olcum:true,
      label:'Kısa uyku',
      alanlar:['dk', 'bas', 'date'],
      check(p){
        const h = SP.Uyku.dogrula({ dk:p.dk, bas:p.bas });
        return h ? fail(h) : pass({ dk:Math.round(Number(p.dk)), bas:p.bas || null });
      },
      preview(p, ctx){
        return [{ alan:'Kısa uyku', once:'—', sonra:ctx.dk + ' dakika' + (ctx.bas ? ' · ' + ctx.bas : '') }];
      },
      async apply(p, ctx){
        const r = await SP.Uyku.ekle(p.date, { dk:ctx.dk, bas:ctx.bas });
        if(!r.ok) throw new Error(r.why);
        return { date:p.date, id:r.kayit.id };
      },
      async revert(geri){ await SP.Uyku.sil(geri.date, geri.id); },
    },

    /* --------------------------------------------------- ölçüm gir */
    'olcum-gir':{
      level:'orta',
      olcum:true,
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

    /* ---------------------------------------------- bölüm aç / gizle */
    'bolum-ac-kapa':{
      level:'orta',
      label:'Bölümü aç / gizle',
      alanlar:['bolum', 'acik'],
      check(p){
        const b = SP.Bolum && SP.Bolum.BY_ID[p.bolum];
        if(!b) return fail('Bu bölüm gizlenemez ya da sistemde yok.');
        const acik = Number(p.acik) === 1;
        if(acik === !SP.Bolum.gizli(p.bolum)) return fail(b.ad + ' zaten ' + (acik ? 'açık.' : 'gizli.'));
        return pass({ b, acik });
      },
      preview(p, ctx){
        return [
          { alan:ctx.b.ad, once:ctx.acik ? 'gizli' : 'açık', sonra:ctx.acik ? 'açık' : 'gizli' },
          { alan:'Verisi', once:'duruyor', sonra:'duruyor — silinmez' },
        ];
      },
      async apply(p, ctx){
        const r = await SP.Bolum.set(p.bolum, ctx.acik);
        if(!r.ok) throw new Error(r.error);
        return { bolum:p.bolum, acik:!ctx.acik };
      },
      async revert(geri){ await SP.Bolum.set(geri.bolum, geri.acik); },
    },

    /* ---------------------------------------------------- planı uygula

       BÜYÜK aksiyon (AGENTS.md §1.9): beslenme hedefini ve günlük enerji
       hedefini birlikte değiştirir, haftalar sürecek bir yol kurar.
       Ayrıntılı önizleme + onay + geri dönüş noktası. MODEL ÖNEREMEZ:
       katalog tarifinde yoktur ve modelden gelirse düşer. */
    'plan-uygula':{
      level:'buyuk',
      label:'Planı uygula',
      alanlar:['hedefId'],
      modelYok:true,
      check(p){
        if(!SP.Plan || !SP.Hedefler) return fail('Plan motoru yüklü değil.');
        const h = SP.Hedefler.liste().find(x => x.id === p.hedefId);
        if(!h) return fail('Hedef bulunamadı.');
        if(SP.Plan.aktif(h.id)) return fail('Bu hedefin uygulanmış bir planı var; önce onu geri al.');
        const r = SP.Plan.kur(h, U.todayISO());
        if(!r.ok) return fail(r.why);
        return pass({ plan:r.plan });
      },
      preview(p, ctx){ return SP.Plan.onizleme(ctx.plan); },
      async apply(p, ctx){ return await SP.Plan.uygula(ctx.plan); },
      async revert(geri){ await SP.Plan.geriAl(geri); },
    },

    /* ------------------------------------------------ programı ekle

       ORTA aksiyon: Planlama Ofisi'nin (HKM) haftalık programını
       uygulanmış plana ekler. Program önce SPİ'nin kendi kontrol
       noktalarıyla sınanır (SP.Plan.programSina); tutmuyorsa eklenmez.
       Beslenme ya da enerji hedefini DEĞİŞTİRMEZ — yalnız takvimi
       gösterir. Model öneremez. */
    'program-ekle':{
      level:'orta',
      label:'Haftalık programı ekle',
      alanlar:['hedefId', 'program'],
      modelYok:true,
      check(p){
        const plan = SP.Plan && SP.Plan.aktif(p.hedefId);
        if(!plan) return fail('Bu hedefin uygulanmış bir planı yok.');
        const pr = p.program;
        if(!pr || !Array.isArray(pr.haftalar) || pr.haftalar.length !== plan.kontrol.length){
          return fail('Program bu planla tutmuyor.');
        }
        return pass({ plan, pr });
      },
      preview(p, ctx){
        return [{ alan:'Haftalık program', once:ctx.plan.program ? 'sürüm ' + ctx.plan.program.surum : 'yok',
          sonra:ctx.pr.haftalar.length + ' hafta · tartı günü ' + (ctx.pr.tartiGunu || ctx.plan.tartiGunu.ad) }];
      },
      async apply(p, ctx){
        const geri = { planId:ctx.plan.id, program:ctx.plan.program || null };
        await SP.Plan.kaydet(Object.assign({}, ctx.plan, { program:ctx.pr }));
        return geri;
      },
      async revert(geri){
        const plan = SP.Plan.liste().find(x => x.id === geri.planId);
        if(plan) await SP.Plan.kaydet(Object.assign({}, plan, { program:geri.program }));
      },
    },

    /* ----------------------------------------------- semptom işaretle */
    'semptom-isaretle':{
      level:'kucuk',
      olcum:true,
      label:'Şikâyet',
      /* 2026-10-25: hızlı girişten de gelir («baş ağrısı orta»). Şiddet
         YALNIZ kullanıcının sözünden; söylenmediyse yazılmaz, «şiddet
         belirtilmedi» denir. `yok:true` = «şikâyetim yok» (Bugün'deki
         «Şikâyetim yok» düğmesiyle aynı kayıt). İşaretleme teşhis değildir. */
      alanlar:['symptomId', 'severity', 'date', 'yok'],
      check(p){
        if(p.yok === true) return pass({ yok:true });
        const s = SP.SYMPTOM_BY_ID[p.symptomId];
        if(!s) return fail('Böyle bir şikâyet sözlükte yok.');
        if(p.severity == null || p.severity === '') return fail(SP.Quick.SIDDET_YOK);
        const sd = Number(p.severity);
        if(!isFinite(sd) || sd < 1 || sd > 3) return fail('Şiddet 1 ile 3 arasında olmalı.');
        return pass({ s, sd:Math.round(sd) });
      },
      preview(p, ctx){
        if(ctx.yok){
          const v = M.vitalsOf(p.date);
          const adlar = Object.keys((v && v.symptoms) || {}).map(id => (SP.SYMPTOM_BY_ID[id] || {}).name).filter(Boolean);
          return [{ alan:'Şikâyet', once:adlar.length ? adlar.join(', ') : (v && v.symptomsLogged ? 'şikâyet yok' : 'işaretlenmemiş'),
            sonra:'şikâyet yok' }];
        }
        const onceki = SP.Symptom.ofDay(p.date)[ctx.s.id];
        return [{ alan:ctx.s.name,
          once:onceki ? 'şiddet ' + onceki : 'işaretlenmemiş',
          sonra:'şiddet ' + ctx.sd }];
      },
      async apply(p, ctx){
        const v = M.vitalsOf(p.date);
        const logged = !!(v && v.symptomsLogged);
        if(ctx.yok){
          const eski = Object.assign({}, (v && v.symptoms) || {});
          await M.saveVitals(p.date, { symptoms:{}, symptomsLogged:true });
          return { date:p.date, yok:true, eski, logged };
        }
        const onceki = SP.Symptom.ofDay(p.date)[ctx.s.id] || 0;
        await SP.Symptom.setSymptom(p.date, ctx.s.id, ctx.sd);
        if(!logged) await M.saveVitals(p.date, { symptomsLogged:true });
        return { date:p.date, symptomId:ctx.s.id, onceki, yeni:ctx.sd, logged };
      },
      async revert(geri, o){
        if(geri.yok){
          /* Arada şikâyet işaretlendiyse o işaret silinmez. */
          const v = M.vitalsOf(geri.date);
          if(v && Object.keys(v.symptoms || {}).length) return;
          await M.saveVitals(geri.date, { symptoms:geri.eski || {}, symptomsLogged:!!geri.logged });
          return;
        }
        await semptomGeriAl(geri, o);
        if(geri.logged === false){
          const v = M.vitalsOf(geri.date);
          if(v && v.symptomsLogged && !Object.keys(v.symptoms || {}).length) await M.saveVitals(geri.date, { symptomsLogged:false });
        }
      },
    },

    /* ------------------------------------------- hazır öğün / antrenman

       2026-10-25: «menemen tabağımı yedim», «bacak günümü yaptım» Bugün
       kutusunda bulunuyordu (core/hazir.js söz 5) ama paletten, King'in
       ofis sohbetinden ve iPhone gelen kutusundan bulunmuyordu. Kayıt
       kullanıcının kendi hazırından kopyalanır (söz 1–3); model öneremez:
       hazır kimliklerini görmez. */
    'hazir-ekle':{
      level:'kucuk',
      olcum:true,
      modelYok:true,
      label:'Hazır öğün ya da antrenman',
      alanlar:['tur', 'hazirId', 'date', 'slot'],
      check(p){
        if(!SP.Hazir) return fail('Hazır kayıtlar yüklü değil.');
        const l = p.tur === 'ogun' ? SP.Hazir.ogunler() : p.tur === 'antrenman' ? SP.Hazir.antrenmanlar() : null;
        if(!l) return fail('Bilinmeyen hazır kayıt türü.');
        const h = l.find(x => x.id === p.hazirId);
        if(!h) return fail('Hazır kayıt bulunamadı; silinmiş olabilir.');
        return pass({ h });
      },
      preview(p, ctx){
        if(p.tur === 'ogun'){
          const slot = p.slot || ctx.h.slot;
          return [{ alan:ctx.h.ad, once:'—', sonra:'hazır öğün' + (slot ? ' · ' + (SP.Ogun ? SP.Ogun.ad(slot) : slot) : '')
            + ' · ' + SP.Hazir.ogunOzet(ctx.h) }];
        }
        const oz = SP.Hazir.antrenmanOzet(ctx.h);
        return [{ alan:ctx.h.ad, once:'—', sonra:'hazır antrenman' + (oz ? ' · ' + oz : '') }];
      },
      async apply(p){
        const r = p.tur === 'ogun' ? await SP.Hazir.ogunEkle(p.hazirId, p.date, p.slot || undefined)
          : await SP.Hazir.antrenmanEkle(p.hazirId, p.date);
        if(!r.ok) throw new Error(r.why);
        return { tur:p.tur, date:p.date, id:r.id };
      },
      async revert(geri){
        if(geri.tur === 'ogun'){ if(M.deleteMeal) await M.deleteMeal(geri.date, geri.id); }
        else if(M.deleteWorkout) await M.deleteWorkout(geri.id);
      },
    },
  };

  /* Şikâyet şiddetinin geri alınması (HATALAR Y-6): sonraki kaydı ve elle
     düzenlemeyi ezmez. */
  async function semptomGeriAl(geri, o){
    const yeni = geri.yeni != null ? geri.yeni : Math.round(Number(((o && o.params) || {}).severity) || 0);
    const sonraki = ayniHedef(o, 'semptom-isaretle',
      x => x.date === geri.date && x.symptomId === geri.symptomId)[0];
    if(sonraki){ if(sonraki.onceki === yeni) sonraki.onceki = geri.onceki; return; }
    if((SP.Symptom.ofDay(geri.date)[geri.symptomId] || 0) !== yeni) return;
    await SP.Symptom.setSymptom(geri.date, geri.symptomId, geri.onceki);
  }

  function eylem(id){ return KATALOG[id] || null; }
  function katalogIdleri(){ return Object.keys(KATALOG); }

  /* ==================== doğrulama ve önizleme ==================== */

  function check(p, sanal){
    const e = eylem(p && p.action);
    if(!e) return fail('Bilinmeyen eylem: ' + (p && p.action));
    try{ return e.check(p.params || {}, sanal); }
    catch(err){ return fail('Doğrulanamadı: ' + (err && err.message || err)); }
  }

  function onizle(p, c){
    if(!c.ok) return { ok:false, why:c.why, rows:[] };
    try{ return { ok:true, rows:eylem(p.action).preview(p.params || {}, c.ctx) || [] }; }
    catch(err){ return { ok:false, why:'Önizlenemedi.', rows:[] }; }
  }

  function preview(p){ return onizle(p, check(p)); }

  /* SIRALI ÖNİZLEME (2026-10-25): birlikte gösterilen öneriler
     UYGULANACAKLARI sırayla önizlenir. Her biri ayrı ayrı önizlenince
     1000 ml varken üç «su 250» üç kez «toplam 1.250 ml» diyordu, onay 1750
     yazıyordu. Her satırın önceki ve sonraki değeri öndeki satırları sayar;
     geçmeyen satır sanal değeri değiştirmez, approve da onu yazmaz.
     Dönüş: [{ p, c, pv }] — c doğrulama, pv önizleme. */
  function sirali(l){
    const sanal = {};
    return (l || []).map(p => {
      const c = check(p, sanal);
      const pv = onizle(p, c);
      if(c.ok && p.action === 'vital-yaz') sanal[sanalAnahtar((p.params || {}).date, c.ctx.f.id)] = c.ctx.v;
      return { p, c, pv };
    });
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

  /* Hızlı giriş ayrıştırıcısının çıktısını katalog eylemlerine çevirir.

     2026-10-25: tek cümle İKİ eylem olabilir («tansiyon 120/80» → büyük ve
     küçük tansiyon); cümlenin gün sözü («dün») tarihi, öğün sözü
     («kahvaltıda») öğünü belirler; su günün toplamına eklenir (`ekle`) —
     iPhone gelen kutusundan gelen «su 250» de (beş satır 1250 ml'dir).
     Birimi uyuşmayan tahlil satırı eyleme dönmez (SP.Parse.rowsToSave). */
  function quickToActions(parsed, date, slot){
    if(!parsed) return [];
    const d = SP.Quick.tarih ? SP.Quick.tarih(parsed, date) : date;
    if(parsed.kind === 'vital'){
      const ilk = { action:'vital-yaz', params:{ field:parsed.data.field.id, value:parsed.data.value, date:d } };
      if(parsed.data.ekle) ilk.params.ekle = true;
      const l = [ilk];
      if(parsed.data.ikinci) l.push({ action:'vital-yaz',
        params:{ field:parsed.data.ikinci.field.id, value:parsed.data.ikinci.value, date:d } });
      return l;
    }
    if(parsed.kind === 'symptom') return [parsed.data.yok
      ? { action:'semptom-isaretle', params:{ yok:true, date:d } }
      : { action:'semptom-isaretle', params:{ symptomId:parsed.data.symptom.id, severity:parsed.data.severity, date:d } }];
    if(parsed.kind === 'nap') return [{ action:'kestirme-ekle',
      params:{ dk:parsed.data.dk, bas:parsed.data.bas || null, date:d } }];
    if(parsed.kind === 'move') return [{ action:'seans-ekle',
      params:{ minutes:parsed.data.minutes,
        exerciseId:parsed.data.exercise ? parsed.data.exercise.id : null, date:d } }];
    if(parsed.kind === 'lab'){
      const rows = SP.Parse.rowsToSave ? SP.Parse.rowsToSave(parsed.data) : parsed.data.rows;
      return rows.length ? [{ action:'olcum-gir',
        params:{ rows:rows.map(r => ({ markerId:r.marker.id, value:r.value })), date:d } }] : [];
    }
    if(parsed.kind === 'meal') return [{ action:'ogun-ekle',
      params:{ items:parsed.data.items.map(i => ({ foodId:i.food.id, g:i.g, cert:i.cert })),
        slot:parsed.data.slot || slot || (SP.Ogun ? SP.Ogun.simdiki() : 'ara1'), date:d } }];
    return [];
  }

  /* Tek eylem isteyen eski çağıranlar için: ilk eylem. */
  function quickToAction(parsed, date, slot){
    return quickToActions(parsed, date, slot)[0] || null;
  }

  function gunEkle(iso, g){ return g ? U.iso(U.addDays(U.parse(iso), g)) : iso; }

  /* Serbest cümleden öneri üretir — MODEL GEREKMEZ.

     Dönen her satır bir öneri adayıdır; `anlasilmayan` ise kural
     motorunun çözemediği yan cümleleri taşır. Bunlar sessizce
     düşmez: kullanıcıya gösterilir ve istenirse modele sorulur. */
  function fromText(text, opts){
    const o = opts || {};
    const date = o.date || U.todayISO();
    const parcalar = yanCumleler(text);
    const oneriler = [], anlasilmayan = [], engellenen = [];
    /* GÜN SÖZÜ SÜRER (2026-10-25): «dün 30 dakika yürüdüm ve 2 bardak su
       içtim» iki parçası da dünündür; parça kendi gün sözünü söylerse
       («bugün …») o geçer. «dün gece … uyudum» bugünün uykusudur ve
       sonraki parçaya «dün» taşımaz. */
    let sonGun = null;

    /* Sayısı bulunmuş ama ÖLÇÜM OLMAYAN parça («7 saat uyumadım», «yarın
       30 dakika yürüyeceğim») yazılmaz; nedeni ve sorulacak cümle
       `engellenen`de döner (belgeler/ekip/HATALAR.md KR-1). Anlaşılan ama
       eksik parça (şiddeti söylenmemiş şikâyet, birimi uyuşmayan tahlil)
       `eksik` notuyla anlaşılmayanlara gider: tahmin edilmez, söylenir. */
    function dene(p){
      const engelOf = parsed => {
        const e = SP.Quick.olcumEngeli ? SP.Quick.olcumEngeli(p, parsed) : LIFEOS.Olumsuz.olcumEngeli(p);
        return e ? { engel:Object.assign({ metin:String(p).trim() }, e) } : null;
      };
      const z = SP.Quick.gunSozu ? SP.Quick.gunSozu(p) : { gun:null };

      /* HAZIR ÖNCE (2026-10-25): Bugün kutusu gibi (app.js, core/hazir.js
         söz 5). Palet, ofis sohbeti ve iPhone gelen kutusu da bulur. */
      const hz = SP.Hazir && SP.Hazir.bul ? SP.Hazir.bul(p) : null;
      if(hz){
        const gun = z.gun != null ? z.gun : sonGun;
        if(z.gun != null) sonGun = z.gun;
        const params = { tur:hz.tur, hazirId:hz.hazir.id, date:gunEkle(date, gun) };
        const slot = hz.tur === 'ogun' && SP.Quick.ogunSozu ? SP.Quick.ogunSozu(p) : null;
        if(slot) params.slot = slot;
        return engelOf(null) || { a:[{ action:'hazir-ekle', params }] };
      }

      let parsed = null;
      try{ parsed = SP.Quick.parseHam(p); }catch(e){ parsed = null; }
      if(parsed){
        if(parsed.gunSozu == null && sonGun != null) parsed.gun = sonGun;
        else if(parsed.gunSozu != null && parsed.gunSurer !== false) sonGun = parsed.gun;
      }else if(z.gun != null) sonGun = z.gun;
      const a = quickToActions(parsed, date, o.slot);
      if(!a.length){
        if(parsed && parsed.kind === 'lab' && parsed.data.uyusmaz.length){
          return engelOf(parsed) || { eksik:String(p).trim() + ' — ' + SP.Quick.uyusmazNotu(parsed.data.uyusmaz) };
        }
        return null;
      }
      const e = engelOf(parsed);
      if(e) return e;
      if(parsed.kind === 'symptom' && !parsed.data.yok && !parsed.data.severity){
        return { eksik:String(p).trim() + ' — şiddet belirtilmedi («hafif», «orta» ya da «şiddetli» diye ekle)' };
      }
      return { a };
    }

    parcalar.forEach(p => {
      const r = dene(p);
      if(!r) anlasilmayan.push(p);
      else if(r.eksik) anlasilmayan.push(r.eksik);
      else if(r.engel) engellenen.push(r.engel);
      else r.a.forEach(x => oneriler.push(Object.assign(x, { kaynak:'rules', metin:p })));
    });

    /* Tek parça hiç anlaşılmadıysa cümlenin TAMAMINI bir kez dene:
       bölme yanlış yerden olmuş olabilir. */
    if(!oneriler.length && !engellenen.length && parcalar.length > 1){
      sonGun = null;
      const r = dene(text);
      if(r && r.engel) return { oneriler:[], anlasilmayan:[], engellenen:[r.engel] };
      if(r && r.a) return { oneriler:r.a.map(x => Object.assign(x, { kaynak:'rules', metin:String(text).trim() })),
        anlasilmayan:[], engellenen:[] };
    }

    return { oneriler, anlasilmayan, engellenen };
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
      if(eylem(x.action).modelYok){ dusen.push({ x, why:'Bu eylemi model öneremez.' }); return; }
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
    return Object.keys(KATALOG).filter(id => !KATALOG[id].modelYok).map(id => {
      const e = KATALOG[id];
      return '- ' + id + ' (' + e.label + '): ' + e.alanlar.join(', ');
    }).join('\n');
  }

  /* ==================== kayıt ve yaşam döngüsü ==================== */

  function liste(){ return SP.S.proposals || (SP.S.proposals = []); }
  function pending(){ return liste().filter(p => p.status === 'pending'); }
  function all(){ return liste(); }

  /* ------------------------------------------------ seviye ve kaynak

     SEVIYE KATALOGDAN yazilir (AGENTS.md §1.9); onerenin gonderdigi
     `level` okunmaz. KAYNAK: 'istek' = kullanicinin kendi cumlesinden
     kural motorunun cikardigi; 'model' = modelin yorumu; 'kural' =
     sistemin kendi bulgusu. */
  const SEVIYELER = ['kucuk', 'orta', 'buyuk'];
  const MODLAR = ['istek', 'hepsi', 'hicbiri'];
  const KAYNAKLAR = ['istek', 'model', 'kural'];
  const MAX_ANAHTAR = 500;

  function kaynakOf(p){
    if(KAYNAKLAR.indexOf(p && p.source) >= 0) return p.source;
    return p && p.kaynak === 'model' ? 'model' : 'kural';
  }

  function izOf(p){
    const ham = Array.isArray(p && p.iz) ? p.iz : [];
    return ham.filter(x => x && typeof x === 'object')
      .map(x => ({ tur:String(x.tur || '').trim().slice(0, 24),
                   id:String(x.id == null ? '' : x.id).trim().slice(0, 60) }))
      .filter(x => x.tur && x.id)
      .slice(0, 8);
  }

  function anahtarlar(){ return SP.S.proposalKeys || (SP.S.proposalKeys = []); }

  /* Tek uygulama anahtari: disaridan (HKM) gelen ayni teklif hicbir
     durumda ikinci kez kuyruga girmez. Anahtarsiz kayit tekrar edilebilir:
     iki ayri «uyku 7 saat» iki ayri gunun kaydi olabilir. */
  async function propose(p){
    const anahtar = String((p && p.anahtar) || '').trim().slice(0, 120) || null;
    if(anahtar && anahtarlar().indexOf(anahtar) >= 0) return null;
    const e = eylem(p && p.action);
    /* Modelin öneremeyeceği eylem (büyük aksiyon) model kaynağıyla hiç
       kuyruğa girmez — onayı beklerken bile. */
    if(e && e.modelYok && kaynakOf(p) === 'model') return null;
    const kayit = Object.assign({
      id:U.uid('pr'), at:new Date().toISOString(), status:'pending',
    }, p, {
      level:e && SEVIYELER.indexOf(e.level) >= 0 ? e.level : 'orta',
      source:kaynakOf(p),
      anahtar,
      iz:izOf(p),
      otomatik:false,
    });
    liste().unshift(kayit);
    if(liste().length > MAX) liste().length = MAX;
    if(anahtar){
      anahtarlar().push(anahtar);
      if(anahtarlar().length > MAX_ANAHTAR) SP.S.proposalKeys = anahtarlar().slice(-MAX_ANAHTAR);
    }
    await save();
    return kayit;
  }

  /* Tek karar noktasi. Kucuk degilse asla; bilinmeyen ayar varsayilan
     gibi davranir — bozuk bir ayar kendiliginden «hepsi»ne donmemeli.
     Olcum yazan eylem (katalogda `olcum:true`) hicbir ayarda sormadan
     yazilmaz (belgeler/ekip/HATALAR.md KR-1). */
  function otomatikMi(row, mod){
    if(!row || row.level !== 'kucuk') return false;
    if((eylem(row.action) || {}).olcum) return false;
    /* Vitrin 116 — TÜR AYARI moddan önce gelir: kullanıcı bir küçük türü
       açık ya da kapalı işaretlediyse o geçerlidir (AGENTS §1.9: «hangi
       küçük türlerin sormadan uygulanacağını kullanıcı ayarlar»). */
    const tur = turAyari()[row.action || row.kind];
    if(tur === true || tur === false) return tur;
    const m = MODLAR.indexOf(mod) >= 0 ? mod : 'istek';
    if(m === 'hicbiri') return false;
    if(m === 'hepsi') return true;
    return row.source === 'istek';
  }

  function turAyari(){
    try{
      const st = SP.Office && typeof SP.Office.settings === 'function' ? SP.Office.settings() : null;
      return (st && st.otomatikTurler && typeof st.otomatikTurler === 'object') ? st.otomatikTurler : {};
    }catch(e){ return {}; }
  }

  function ayar(){
    try{
      const st = SP.Office && typeof SP.Office.settings === 'function' ? SP.Office.settings() : null;
      return (st && st.otomatikUygula) || 'istek';
    }catch(e){ return 'istek'; }
  }

  /* Oneriyi kuyruga alir; seviye ve ayar izin veriyorsa hemen uygular.
     Donus: { row, otomatik, why }. row null ise hicbir sey yazilmadi. */
  async function talep(p){
    const c = check(p);
    if(!c.ok) return { row:null, otomatik:false, why:c.why };
    const row = await propose(p);
    if(!row) return { row:null, otomatik:false, why:'Bu öneri daha önce işlendi.' };
    if(!otomatikMi(row, ayar())) return { row, otomatik:false, why:null };
    const r = await approve(row.id);
    if(!r.ok) return { row, otomatik:false, why:r.why };
    row.otomatik = true;
    await save();
    return { row, otomatik:true, why:null };
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
      p.sira = yeniSira();
      await save();
      return { ok:true, proposal:p };
    }catch(err){
      p.status = 'failed'; p.why = String(err && err.message || err);
      await save();
      return { ok:false, why:p.why };
    }
  }

  /* `gecme`: vitrin 123 — kullanıcının söylediği neden (isteğe bağlı). */
  async function reject(id, gecme){
    const p = liste().find(x => x.id === id);
    if(!p) return { ok:false };
    p.status = 'rejected';
    if(gecme) p.gecme = gecme;
    await save();
    return { ok:true };
  }

  async function undo(id){
    const p = liste().find(x => x.id === id);
    if(!p || p.status !== 'applied' || !p.undo) return { ok:false, why:'Geri alınacak bir şey yok.' };
    try{
      await eylem(p.action).revert(p.undo, { params:p.params || {}, sonraki:sonrakiler(p) });
      p.status = 'undone';
      await save();
      return { ok:true };
    }catch(err){
      return { ok:false, why:String(err && err.message || err) };
    }
  }

  /* DIŞARIDAN GELEN SATIR (hesap gelen kutusu; sistem/hesap.py söz 16,
     brand/ortak/hesap.js söz 20). iPhone Kısayollar, Apple Sağlık
     otomasyonu ya da Home Assistant «su 250» gönderir; sunucu satırı
     ANLAMAZ, burada kural motoru okur (fromText) ve her parça Onaylar'a
     ÖNERİ olur. SU EKLENİR (2026-10-25, Onaylar ajanından devir): beş
     «su 250» satırı onaylanınca gün 1250 ml olur, 250 değil; önizleme
     «+250 ml · toplam …» der. Kilo ve öteki ölçümler değer olarak yazılır.
     Ölçüm olduğu için hiçbir ayarda sormadan yazılmaz
     (otomatikMi); kullanıcı «Kaydet»e basınca approve yazar, geri alınır.

     GÜN, satırın GÖNDERİLDİĞİ andır: 23:50'de gönderilip sabah işlenen su
     dünün suyudur. Aynı satır iki kez öneri olmaz (anahtar): sunucu sonucu
     alamayıp satırı yeniden verirse «zaten Onaylar'da» sayılır.
     Dönüş hesap.js'e: { durum:'onayda'|'anlasilmadi', sonuc }. */
  async function disaridan(oge){
    const metin = String((oge && oge.metin) || '').trim();
    if(!metin) return { durum:'anlasilmadi', sonuc:'Boş satır' };
    const z = Number(oge.zaman), bugun = U.todayISO();
    const gonderilen = isFinite(z) && z > 0 ? U.iso(new Date(z)) : bugun;
    const v = fromText(metin, { date:gonderilen > bugun ? bugun : gonderilen });
    let n = 0;
    const neden = [];
    for(let i = 0; i < v.oneriler.length; i++){
      const x = v.oneriler[i], c = check(x);
      if(!c.ok){ neden.push(c.why); continue; }
      const anahtar = 'gelen:' + oge.id + ':' + i;
      if(anahtarlar().indexOf(anahtar) >= 0){ n++; continue; }
      const row = await propose({ action:x.action, params:x.params, source:'istek', kaynak:'rules', metin:x.metin,
        reason:'Kısayollar’dan' + (oge.kaynak ? ' (' + oge.kaynak + ')' : '') + ': «' + metin + '»',
        gelenKaynak:String(oge.kaynak || '').slice(0, 40),
        anahtar, iz:[{ tur:'gelen', id:String(oge.id) }] });
      if(row) n++;
    }
    if(n) return { durum:'onayda', sonuc:n === 1 ? 'SPİ › Onaylar’da bekliyor' : n + ' kayıt SPİ › Onaylar’da' };
    const e = (v.engellenen || [])[0];
    return { durum:'anlasilmadi', sonuc:neden[0] || (e && e.soru) || 'SPİ bu satırı anlamadı' };
  }

  async function clearResolved(){
    SP.S.proposals = liste().filter(p => p.status === 'pending');
    await save();
  }

  async function save(){
    await SP.Store.set(STORE, liste());
    await SP.Store.set(STORE + '-anahtar', { items:anahtarlar() });
  }
  async function load(){
    SP.S.proposals = (await SP.Store.get(STORE)) || [];
    const k = await SP.Store.get(STORE + '-anahtar');
    SP.S.proposalKeys = (k && Array.isArray(k.items)) ? k.items : [];
    return SP.S.proposals;
  }

  return {
    KATALOG, eylem, katalogIdleri, catalogPrompt,
    check, preview, sirali,
    fromText, fromModel, yanCumleler, quickToAction, quickToActions,
    propose, approve, reject, undo, clearResolved, disaridan,
    talep, otomatikMi, ayar, turAyari, SEVIYELER, MODLAR,
    pending, all, load, save, MAX,
  };
})();
