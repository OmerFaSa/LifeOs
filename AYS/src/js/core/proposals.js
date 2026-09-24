/* Öneri kutusu — ofisin sisteme dokunabildiği tek kapı.

   Ofis bugüne kadar yalnizca okuyordu. Artik yazabilir, ama tek bir yoldan:

     ajan onerir → kural motoru DOGRULAR → kullanici ONAYLAR → motor uygular
                                                            → geri alinabilir

   SEVIYE (AGENTS.md §1.9). Her eylemin seviyesi katalogdadir
   (data/actions.js `level`), onerenin elinde degil:

     kucuk   kullanici ISTEDIYSE sormadan uygulanir, «Geri al» kalir.
             Ajanin kendi buldugu kucuk oneri yalniz kullanici izin
             verdiyse (ayar 'hepsi') uygulanir.
     orta    her zaman onizleme + tek onay.
     buyuk   her zaman ayrintili onizleme + onay.

   Yani "otomatik uygula" artik VAR, ama yalniz kucuk, geri alinabilir
   ve kullanicinin actigi durumda. Karar tek yerde verilir: otomatikMi().
   Uygulama yine ayni kapidan gecer — dogrulama atlanmaz, geri alma
   kaydi yine once alinir.

   Uc kaynak vardir ve ucu de ayni kapidan gecer:

     talep              KULLANICININ istegi (sohbet, palet): source 'istek'

     suggest()          kural motoru: veriden kendisi cikarir, model gerekmez,
                        cevrimdisi calisir, kota harcamaz
     fromModel(...)     ajanin onerisi: KAPALI katalogdan bir eylem + yapisal
                        parametre. Serbest metin eyleme donusmez; parametreler
                        gercek veriye karsi dogrulanir, uydurulan duser.

   Dogrulama (check) her zaman calisir — onerinin kaynagi ne olursa olsun.
   Model "kapanmis konuyu tekrara al" derken var olmayan bir konu kimligi
   uydurursa oneri kullaniciya hic gosterilmez.

   Uygulama sirasi kasitlidir: once anlik goruntu alinir (undo), sonra
   degisiklik yazilir. Boylece geri alma her zaman mumkundur. */

window.R = window.R || {};

R.Proposals = (function(){
  const U = R.U, M = R.Model, S = R.S;

  const MAX = 40;             // saklanan oneri (uygulanan + reddedilen dahil)
  const MAX_ANAHTAR = 500;    // tek-uygulama anahtarlari: oneriden uzun yasar
  const STORE = 'office/proposals';

  const SEVIYELER = ['kucuk', 'orta', 'buyuk'];
  const MODLAR = ['istek', 'hepsi', 'hicbiri'];
  const KAYNAKLAR = ['istek', 'llm', 'kural'];

  /* ==================== eylem uygulamalari ====================

     Her eylemin dort islevi vardir ve dordu de ayrilir:
       check   : uygulanabilir mi — hayirsa NEDEN (kullaniciya gosterilir)
       preview : ne degisecek — once/sonra satirlari
       apply   : degisikligi yazar, geri alma anlik goruntusunu DONDURUR
       revert  : o anlik goruntuden geri alir

     check her cagrida yeniden calisir: bekleyen bir oneri, arada veri
     degistigi icin gecersizlesmis olabilir. */

  function subjectOf(id){ return (R.SUBJECTS || []).find(s => s.id === id) || null; }
  function topicOf(subject, id){
    return subject ? (subject.topics || []).find(t => t.id === id) || null : null;
  }
  function stateLabel(id){
    const st = R.TOPIC_STATES[id];
    return st ? st.label : String(id || '—');
  }
  function fail(why){ return { ok:false, why }; }
  function pass(ctx){ return { ok:true, ctx:ctx || {} }; }

  /* ==================== geri alma: fark tabanli ====================

     «Geri al» eski degeri MUTLAK yaziyordu: ayni gun iki kayit girilip
     ilki geri alininca ikincisi de siliniyor, sonra ikincisi geri alininca
     geri alinmis ilki diriliyordu; blok «tamamlandi» kaliyordu
     (ekip/HATALAR.md Y-6). Kural: geri alma yalniz O KAYDIN yaptigini geri
     cevirir.

       toplamali alan  bu kaydin ekledigi cikarilir; geriye yalniz bu kaydin
                       payi kalmissa alan eski haline doner (girilmemis alan
                       yine girilmemis olur, sifir degil). Elle azaltilmis
                       ve cikarma eksiye dusuyorsa dokunulmaz.
       deger yazan     sonra ayni alana yazan bir kayit varsa deger ONUN
                       degeridir, dokunulmaz; yoksa alan hala bu kaydin
                       degerindeyse eski haline doner (elle degistirilmisse
                       dokunulmaz).
       zincir          sonraki kayitlarin anlik goruntusu bu kayit hic
                       olmamis gibi duzeltilir; boylece onlar da dogru
                       geri alinir.
       blok durumu     bu kayit blogu «bekliyor»dan «tamamlandi»ya cektiyse
                       ve blokta baska is kalmadiysa geri doner; kaldiysa
                       sorumluluk sonraki kayda devredilir. */
  function farkGeri(cur, n, eski){
    const kalan = (Number(cur) || 0) - n;
    if(kalan < 0) return cur;
    return kalan === (Number(eski) || 0) ? eski : kalan;
  }

  function farkZincir(sonrakiEski, n, eski){
    const v = Math.max(0, (Number(sonrakiEski) || 0) - n);
    return v === (Number(eski) || 0) ? eski : v;
  }

  /* Bu kayittan SONRA uygulanmis, ayni hedefe dokunan kayitlarin anlik
     goruntuleri — uygulama sirasina gore. */
  function ayniHedef(o, action, kosul){
    return ((o && o.sonraki) || []).filter(x => x.action === action && x.undo && kosul(x.undo))
      .map(x => x.undo);
  }

  function durumGeri(b, s, o){
    if(!s.durum || b.status !== 'done') return;
    const is = (Number(b.actualQ) || 0) > 0 || (Number(b.actualMin) || 0) > 0;
    if(!is){ b.status = s.durum; return; }
    const devr = ((o && o.sonraki) || []).find(x => (x.action === 'soru-yaz' || x.action === 'sure-yaz')
      && x.undo && x.undo.date === s.date && x.undo.blockId === b.id && !x.undo.durum);
    if(devr) devr.undo.durum = s.durum;
  }

  /* Uygulama sirasi. `appliedAt` ayni milisaniyeye dusebilir; `sira`
     tekdir. Sirasi olmayan eski kayit, sirasi olandan once uygulanmistir. */
  function sonraMi(x, row){
    const a = Number(x.sira) || 0, b = Number(row.sira) || 0;
    if(a || b) return a > b;
    return String(x.appliedAt || '') > String(row.appliedAt || '');
  }

  function sonrakiler(row){
    return (S.officeProposals || [])
      .filter(x => x !== row && x.status === 'applied' && sonraMi(x, row))
      .sort((x, y) => sonraMi(x, y) ? 1 : sonraMi(y, x) ? -1 : 0);
  }

  function yeniSira(){
    return (S.officeProposals || []).reduce((m, x) => Math.max(m, Number(x.sira) || 0), 0) + 1;
  }

  const IMPL = {

    'topic-review':{
      check(p){
        const subject = subjectOf(p.subjectId);
        if(!subject) return fail('Bu ders sistemde yok.');
        const topic = topicOf(subject, p.topicId);
        if(!topic) return fail('Bu konu bu derste yok.');
        const st = M.topicState(p.subjectId, p.topicId);
        if(st.state !== 'closed' && st.state !== 'provisional'){
          return fail('Konu zaten kapalı sayılmıyor; tekrara almanın etkisi olmaz.');
        }
        return pass({ subject, topic, from:st.state });
      },
      preview(p, ctx){
        return [
          { label:'Konu', before:ctx.subject.name, after:ctx.topic.name },
          { label:'Durum', before:stateLabel(ctx.from), after:stateLabel('reopened') },
        ];
      },
      async apply(p, ctx){
        await M.setTopicState(p.subjectId, p.topicId, { state:'reopened' });
        return { subjectId:p.subjectId, topicId:p.topicId, state:ctx.from };
      },
      async revert(s){
        await M.setTopicState(s.subjectId, s.topicId, { state:s.state });
      },
    },

    'block-add':{
      check(p){
        const subject = subjectOf(p.subjectId);
        if(!subject) return fail('Bu ders sistemde yok.');
        const topic = topicOf(subject, p.topicId);
        if(!topic) return fail('Bu konu bu derste yok.');
        const min = Math.round(Number(p.minutes) || 0);
        if(!(min >= 15 && min <= 120)) return fail('Blok süresi 15–120 dakika arasında olmalı.');
        const day = M.dayOf(U.todayISO());
        if(!day) return fail('Bugünün planı henüz açılmadı.');
        return pass({ subject, topic, min, day });
      },
      preview(p, ctx){
        const blocks = ctx.day.blocks || [];
        const sum = blocks.reduce((a, b) => a + (Number(b.targetMin) || 0), 0);
        return [
          { label:'Eklenecek blok', before:'—', after:ctx.subject.name + ' · ' + ctx.topic.name },
          { label:'Bugünkü blok sayısı', before:String(blocks.length), after:String(blocks.length + 1) },
          { label:'Bugünkü hedef süre', before:sum + ' dk', after:(sum + ctx.min) + ' dk' },
        ];
      },
      async apply(p, ctx){
        const date = U.todayISO();
        const day = await M.ensureDay(date);
        const id = U.uid('b');
        day.blocks.push({
          id, slot:'Ek tekrar',
          subject:ctx.subject.name, topic:ctx.topic.name,
          targetMin:ctx.min, targetQ:0, status:'pending',
          subjectId:p.subjectId, topicId:p.topicId,
          actualMin:null, actualQ:null, correctQ:null,
          skipReason:null, startedAt:null,
        });
        await M.saveDay(date);
        return { date, blockId:id };
      },
      async revert(s){
        const day = M.dayOf(s.date);
        if(!day) return;
        day.blocks = (day.blocks || []).filter(b => b.id !== s.blockId);
        await M.saveDay(s.date);
      },
    },

    'cards-due-today':{
      check(p){
        const limit = Math.round(Number(p.limit) || 0);
        if(!(limit >= 1 && limit <= 50)) return fail('Kart sayısı 1–50 arasında olmalı.');
        const today = U.todayISO();
        const late = (S.cards || [])
          .filter(c => c.dueAt && c.dueAt < today)
          .sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))
          .slice(0, limit);
        if(!late.length) return fail('Geciken tekrar kartı yok.');
        return pass({ late, today });
      },
      preview(p, ctx){
        const oldest = ctx.late[0];
        return [
          { label:'Bugüne çekilecek kart', before:'—', after:ctx.late.length + ' kart' },
          { label:'En eski gecikme', before:U.fmtShort(oldest.dueAt), after:'bugün' },
        ];
      },
      async apply(p, ctx){
        const before = [];
        for(const c of ctx.late){
          before.push({ id:c.id, dueAt:c.dueAt });
          c.dueAt = ctx.today;
          await M.saveCard(c);
        }
        return { cards:before };
      },
      async revert(s){
        for(const row of (s.cards || [])){
          const c = (S.cards || []).find(x => x.id === row.id);
          if(!c) continue;
          c.dueAt = row.dueAt;
          await M.saveCard(c);
        }
      },
    },

    'card-from-error':{
      check(p){
        const err = (S.errors || []).find(e => e.id === p.errorId);
        if(!err) return fail('Bu yanlış kaydı bulunamadı.');
        if(err.closedAt) return fail('Bu yanlış zaten kapanmış.');
        const back = String(err.principle || err.recipe || '').trim();
        if(!back) return fail('Kayıtta ilke ya da reçete yazılmamış; karta dönüştürülemez.');
        const already = (S.cards || []).some(c => c.sourceRef === err.id);
        if(already) return fail('Bu yanlıştan zaten kart üretilmiş.');
        return pass({ err, back });
      },
      preview(p, ctx){
        const front = cardFront(ctx.err);
        return [
          { label:'Kartın ön yüzü', before:'—', after:front },
          { label:'Kartın arkası', before:'—', after:ctx.back.slice(0, 90) },
          { label:'İlk tekrar', before:'—', after:'yarın' },
        ];
      },
      async apply(p, ctx){
        const card = M.newCard({
          front:cardFront(ctx.err),
          back:ctx.back,
          topic:ctx.err.topic || ctx.err.testName || '',
          subjectId:ctx.err.subjectId || null,
          source:'office', sourceRef:ctx.err.id,
        });
        await M.saveCard(card);
        return { cardId:card.id };
      },
      async revert(s){ await M.deleteCard(s.cardId); },
    },

    /* Hedef planı: plan HER doğrulamada yeniden kurulur (kural motoru,
       bugünün verisiyle); önizleme onu gösterir, apply onu yazar. */
    'hedef-plan':{
      check(p){
        if(!R.Hedefler || !R.HedefPlan) return fail('Hedef motoru yüklenmedi.');
        const h = R.Hedefler.liste().find(x => x.id === p.hedefId);
        if(!h) return fail('Hedef bulunamadı.');
        if(R.HedefPlan.aktif(h.id)) return fail('Bu hedefin uygulanmış bir planı var; önce onu geri al.');
        const r = R.HedefPlan.kur(h, U.todayISO());
        if(!r.ok) return fail(r.why);
        return pass({ hedef:h, plan:r.plan });
      },
      preview(p, ctx){
        return R.HedefPlan.onizleme(ctx.plan).map(x => ({ label:x.alan, before:x.once, after:x.sonra }));
      },
      async apply(p, ctx){
        const plan = await R.HedefPlan.uygula(ctx.plan);
        return { planId:plan.id };
      },
      async revert(s){
        if(s && s.planId) await R.HedefPlan.geriAl(s.planId);
      },
    },

    'week-target':{
      check(p){
        const n = Math.round(Number(p.weekN) || 0);
        const q = Math.round(Number(p.questionTarget) || 0);
        if(!(n >= 1 && n <= R.PLAN.totalWeeks)) return fail('Hafta numarası plan dışında.');
        if(!(q >= 100 && q <= 3000)) return fail('Haftalık hedef 100–3000 soru arasında olmalı.');
        const week = S.weeks[M.weekId(n)];
        if(!week) return fail(n + '. hafta henüz açılmadı.');
        if(Number(week.questionTarget) === q) return fail('Hedef zaten bu değerde.');
        return pass({ week, n, q });
      },
      preview(p, ctx){
        /* «Önce» ekranda görülen hedeftir: ara ya da tatil varsa küçülmüş hali. */
        const r = R.Calc ? R.Calc.questionRealization(ctx.n) : null;
        return [
          { label:'Hafta', before:'—', after:ctx.n + '. hafta' },
          { label:'Soru hedefi', before:(r ? r.target : ctx.week.questionTarget) + ' soru',
            after:ctx.q + ' soru' },
        ];
      },
      /* Kullanicinin yazdigi hedef, haftanin O ANKI haliyle soylenmistir
         («2 gun ara varken 300 soru»). Yuk de o anki yuk olarak yazilir ki
         gerceklesme hedefi ayni arayi bir kez daha dusmesin (calc.js). */
      async apply(p, ctx){
        const before = { questionTarget:ctx.week.questionTarget, planLoad:ctx.week.planLoad };
        ctx.week.questionTarget = ctx.q;
        ctx.week.planLoad = U.sum(M.weekDates(ctx.n).map(d => M.dayLoad(U.iso(d)).load)) / 7;
        await M.saveWeek(ctx.n);
        return Object.assign({ n:ctx.n, yeni:ctx.q }, before);
      },
      async revert(s, o){
        const week = S.weeks[M.weekId(s.n)];
        if(!week) return;
        /* Sonraki bir hedef degisikligi varsa o kalir; onun anlik goruntusu
           bu kayit hic olmamis gibi duzeltilir (HATALAR Y-6). */
        const yeni = s.yeni != null ? s.yeni : Math.round(Number(((o && o.params) || {}).questionTarget) || 0);
        const sonraki = ayniHedef(o, 'week-target', x => x.n === s.n)[0];
        if(sonraki){
          if(sonraki.questionTarget === yeni){
            sonraki.questionTarget = s.questionTarget;
            sonraki.planLoad = s.planLoad;
          }
          return;
        }
        if(Number(week.questionTarget) !== yeni) return;
        week.questionTarget = s.questionTarget;
        if(s.planLoad == null) delete week.planLoad; else week.planLoad = s.planLoad;
        await M.saveWeek(s.n);
      },
    },

    'decision-close':{
      check(p){
        const state = p.state === 'carried' ? 'carried' : 'done';
        const d = R.Office.openDecisions().find(x => x.id === p.decisionId);
        if(!d) return fail('Bu karar açık değil ya da bulunamadı.');
        return pass({ d, state });
      },
      preview(p, ctx){
        return [
          { label:'Karar', before:'—', after:ctx.d.title },
          { label:'Durum', before:'açık', after:ctx.state === 'done' ? 'yapıldı' : 'devredildi' },
        ];
      },
      async apply(p, ctx){
        await R.Office.closeDecision(p.decisionId, ctx.state);
        return { id:p.decisionId };
      },
      async revert(s){ await R.Office.closeDecision(s.id, 'open'); },
    },

    /* ==================== PLANIN ŞEKLİ ====================
       Temel plan + tarihli istisna — core/istisna.js. */

    'ara-ver':{
      check(p){
        const v = R.Istisna.dogrula({ tur:'ara', from:p.from, to:p.to });
        if(!v.ok) return v;
        return pass({ gun:v.gun, etki:R.Istisna.etki(p.from, p.to) });
      },
      preview(p, ctx){
        const rows = [
          { label:'Ara', before:'plan', after:tarihAraligi(p.from, p.to) + ' · ' + ctx.gun + ' gün' },
          { label:'Günün blokları', before:'plana göre', after:'boş' },
          { label:'Haftalık soru hedefi', before:'tam', after:'ara günleri oranında küçülür' },
        ];
        if(ctx.etki.korunan.length){
          rows.push({ label:'İlerlemesi başlamış gün', before:'—',
            after:ctx.etki.korunan.length + ' gün, dokunulmaz' });
        }
        return rows;
      },
      async apply(p){
        const r = await R.Istisna.ekle({ tur:'ara', from:p.from, to:p.to });
        if(!r.ok) throw new Error(r.why);
        return { id:r.id };
      },
      async revert(s){ if(s && s.id) await R.Istisna.kaldir(s.id); },
    },

    'gecici-sure':{
      check(p){
        const v = R.Istisna.dogrula({ tur:'sure', from:p.from, to:p.to, dakika:p.dakika });
        if(!v.ok) return v;
        return pass({ gun:v.gun, dk:Math.round(Number(p.dakika)), etki:R.Istisna.etki(p.from, p.to) });
      },
      preview(p, ctx){
        const temel = R.Istisna.temelDakika(p.from) || R.Istisna.sablonDakikasi();
        const rows = [
          { label:'Ders günü süresi', before:temel + ' dk', after:ctx.dk + ' dk' },
          { label:'Tarih', before:'—', after:tarihAraligi(p.from, p.to) + ' · ' + ctx.gun + ' gün' },
          { label:'Deneme ve kapanış günleri', before:'olduğu gibi', after:'değişmez' },
          { label:'Tarih bitince', before:'—', after:'temel plana döner' },
        ];
        if(ctx.etki.korunan.length){
          rows.push({ label:'İlerlemesi başlamış gün', before:'—',
            after:ctx.etki.korunan.length + ' gün, dokunulmaz' });
        }
        return rows;
      },
      async apply(p){
        const r = await R.Istisna.ekle({ tur:'sure', from:p.from, to:p.to, dakika:p.dakika });
        if(!r.ok) throw new Error(r.why);
        return { id:r.id };
      },
      async revert(s){ if(s && s.id) await R.Istisna.kaldir(s.id); },
    },

    'gunluk-sure':{
      check(p){
        const dk = Math.round(Number(p.dakika));
        if(!R.Istisna.dakikaGecerli(dk)){
          return fail('Günlük süre ' + R.Istisna.DAKIKA.min + '–' + R.Istisna.DAKIKA.max
            + ' dakika arasında olmalı.');
        }
        const simdi = R.Istisna.temelDakika() || R.Istisna.sablonDakikasi();
        if(simdi === dk) return fail('Günlük süre zaten ' + dk + ' dakika.');
        return pass({ dk, simdi, eskiKapasite:S.profile.capacityHoursPerWeek,
          yeniKapasite:R.Istisna.kapasiteSaati(dk) });
      },
      preview(p, ctx){
        return [
          { label:'Ders günü süresi', before:ctx.simdi + ' dk', after:ctx.dk + ' dk' },
          { label:'Haftalık kapasite', before:ctx.eskiKapasite + ' sa', after:ctx.yeniKapasite + ' sa' },
          { label:'Plan', before:'eski kapasiteye göre', after:'bu haftadan itibaren yeniden dağıtılır' },
          { label:'Geçmiş haftalar', before:'—', after:'değişmez' },
        ];
      },
      async apply(p, ctx){
        const pr = S.profile;
        const geri = {
          gunlukDakika:pr.gunlukDakika == null ? null : pr.gunlukDakika,
          gunlukDakikaFrom:pr.gunlukDakikaFrom == null ? null : pr.gunlukDakikaFrom,
          kapasite:pr.capacityHoursPerWeek,
          plan:S.plan ? JSON.parse(JSON.stringify(S.plan)) : null,
        };
        pr.gunlukDakika = ctx.dk;
        pr.gunlukDakikaFrom = U.todayISO();
        pr.capacityHoursPerWeek = ctx.yeniKapasite;
        await M.saveProfile();
        if(pr.setupDone || S.plan) await M.replanFrom(M.currentWeek());
        await R.Istisna.temeliYenile();
        return geri;
      },
      async revert(s){
        const pr = S.profile;
        if(s.gunlukDakika == null) delete pr.gunlukDakika; else pr.gunlukDakika = s.gunlukDakika;
        if(s.gunlukDakikaFrom == null) delete pr.gunlukDakikaFrom; else pr.gunlukDakikaFrom = s.gunlukDakikaFrom;
        pr.capacityHoursPerWeek = s.kapasite;
        await M.saveProfile();
        S.plan = s.plan;
        if(s.plan) await R.Store.set('plan/main', s.plan);
        else await R.Store.remove('plan/main');
        await R.Istisna.temeliYenile();
      },
    },

    'bolum-ac-kapa':{
      check(p){
        const b = R.Bolum && R.Bolum.BY_ID[p.bolum];
        if(!b) return fail('Bu bölüm gizlenemez ya da sistemde yok.');
        const acik = Number(p.acik) === 1;
        if(acik === !R.Bolum.gizli(p.bolum)) return fail(b.ad + ' zaten ' + (acik ? 'açık.' : 'gizli.'));
        return pass({ b, acik });
      },
      preview(p, ctx){
        return [
          { label:ctx.b.ad, before:ctx.acik ? 'gizli' : 'açık', after:ctx.acik ? 'açık' : 'gizli' },
          { label:'Verisi', before:'duruyor', after:'duruyor — silinmez' },
        ];
      },
      async apply(p, ctx){
        const r = await R.Bolum.set(p.bolum, ctx.acik);
        if(!r.ok) throw new Error(r.error);
        return { bolum:p.bolum, acik:!ctx.acik };
      },
      async revert(s){ await R.Bolum.set(s.bolum, s.acik); },
    },

    /* ==================== KONUŞARAK VERİ GİRİŞİ ====================

       Yukarıdaki eylemler PLAN eylemleridir: konuyu tekrara al, blok
       ekle, hedefi değiştir. Aşağıdakiler ise HAM VERİ girişidir —
       «bugün matematikten 40 soru çözdüm» cümlesinin karşılığı.

       İkisi aynı kapıdan geçer ve geçmelidir: öneri → doğrulama →
       onay → uygulama → geri alma. Veri girişine ayrı ve daha gevşek
       bir yol açmak, sistemin en çok kullanılan yolunu en az
       korunan yol yapardı. */

    'soru-yaz':{
      check(p){
        const n = Number(p.count);
        if(!isFinite(n) || n <= 0) return fail('Soru sayısı yok.');
        if(n > 1000) return fail(n + ' soru bir gün için fazla; yanlış anlaşılmış olabilir.');
        let dogru = p.correct == null ? null : Number(p.correct);
        if(dogru != null && (!isFinite(dogru) || dogru < 0)) dogru = null;
        if(dogru != null && dogru > n) return fail('Doğru sayısı çözülenden fazla olamaz.');
        const subject = p.subjectId ? (R.SUBJECTS || []).find(x => x.id === p.subjectId) : null;
        if(p.subjectId && !subject) return fail('Bu ders sistemde yok.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        /* Derse bagli bir blok varsa oraya yazilir; yoksa gunun
           serbest sorusuna eklenir. Uydurma blok ACILMAZ. */
        const blok = subject
          ? (day.blocks || []).find(b => b.subjectId === subject.id
              || (b.subject && R.U.norm(b.subject) === R.U.norm(subject.name)))
          : null;
        return pass({ n:Math.round(n), dogru:dogru == null ? null : Math.round(dogru),
          subject, blok, day });
      },
      preview(p, ctx){
        const nereye = ctx.blok ? ctx.blok.topic || ctx.blok.subject : 'Plan dışı (günün toplamı)';
        const once = ctx.blok ? (ctx.blok.actualQ == null ? 'girilmemiş' : String(ctx.blok.actualQ))
          : String(ctx.day.freeQ || 0);
        const sonra = ctx.blok ? String((Number(ctx.blok.actualQ) || 0) + ctx.n)
          : String((ctx.day.freeQ || 0) + ctx.n);
        const rows = [{ label:nereye + ' · soru', before:once, after:sonra }];
        if(ctx.dogru != null){
          const varOlan = ctx.blok ? ctx.blok.correctQ : ctx.day.freeCorrect;
          rows.push({ label:'Doğru',
            before:varOlan == null ? 'girilmemiş' : String(varOlan),
            after:String((Number(varOlan) || 0) + ctx.dogru) });
        }
        return rows;
      },
      async apply(p, ctx){
        const geri = { date:p.date, blockId:ctx.blok ? ctx.blok.id : null,
          eskiQ:ctx.blok ? ctx.blok.actualQ : (ctx.day.freeQ || 0),
          eskiC:ctx.blok ? ctx.blok.correctQ : (ctx.day.freeCorrect || 0),
          n:ctx.n, dogru:ctx.dogru,
          durum:ctx.blok && ctx.blok.status === 'pending' ? 'pending' : null };
        if(ctx.blok){
          ctx.blok.actualQ = (Number(ctx.blok.actualQ) || 0) + ctx.n;
          if(ctx.dogru != null) ctx.blok.correctQ = (Number(ctx.blok.correctQ) || 0) + ctx.dogru;
          if(ctx.blok.status === 'pending') ctx.blok.status = 'done';
        }else{
          ctx.day.freeQ = (ctx.day.freeQ || 0) + ctx.n;
          /* Blok yoksa dogru sayisi da gunun toplamina yazilir. Onceden
             DUSUYORDU: onizleme «dogru: 32 yazilacak» diyor ama kayit
             yalniz bloga gidiyordu. Onizlemenin verdigi soz tutulmali. */
          if(ctx.dogru != null) ctx.day.freeCorrect = (ctx.day.freeCorrect || 0) + ctx.dogru;
        }
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s, o){
        const day = R.S.days[s.date];
        if(!day) return;
        const pr = (o && o.params) || {};
        const n = s.n != null ? s.n : Math.round(Number(pr.count) || 0);
        const d = s.n != null ? s.dogru
          : (pr.correct == null || !isFinite(Number(pr.correct)) ? null : Math.round(Number(pr.correct)));
        if(s.blockId){
          const b = (day.blocks || []).find(x => x.id === s.blockId);
          if(b){
            b.actualQ = farkGeri(b.actualQ, n, s.eskiQ);
            if(d != null) b.correctQ = farkGeri(b.correctQ, d, s.eskiC);
            durumGeri(b, s, o);
          }
        }else{
          day.freeQ = farkGeri(day.freeQ, n, s.eskiQ);
          if(d != null) day.freeCorrect = farkGeri(day.freeCorrect, d, s.eskiC);
        }
        ayniHedef(o, 'soru-yaz', x => x.date === s.date && (x.blockId || null) === (s.blockId || null))
          .forEach(x => {
            x.eskiQ = farkZincir(x.eskiQ, n, s.eskiQ);
            if(d != null) x.eskiC = farkZincir(x.eskiC, d, s.eskiC);
          });
        await R.Model.saveDay(s.date);
      },
    },

    'paragraf-yaz':{
      check(p){
        const n = Number(p.count);
        if(!isFinite(n) || n <= 0 || n > 500) return fail('Paragraf sayısı anlaşılmadı.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        return pass({ n:Math.round(n), day });
      },
      preview(p, ctx){
        return [{ label:'Paragraf', before:String(ctx.day.paragraphActual || 0),
          after:String((ctx.day.paragraphActual || 0) + ctx.n) }];
      },
      async apply(p, ctx){
        const geri = { date:p.date, eski:ctx.day.paragraphActual || 0, n:ctx.n };
        ctx.day.paragraphActual = (ctx.day.paragraphActual || 0) + ctx.n;
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s, o){
        const day = R.S.days[s.date];
        if(!day) return;
        const n = s.n != null ? s.n : Math.round(Number(((o && o.params) || {}).count) || 0);
        day.paragraphActual = farkGeri(day.paragraphActual, n, s.eski);
        ayniHedef(o, 'paragraf-yaz', x => x.date === s.date).forEach(x => { x.eski = farkZincir(x.eski, n, s.eski); });
        await R.Model.saveDay(s.date);
      },
    },

    'problem-yaz':{
      check(p){
        const n = Number(p.count);
        if(!isFinite(n) || n <= 0 || n > 500) return fail('Problem sayısı anlaşılmadı.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        return pass({ n:Math.round(n), day });
      },
      preview(p, ctx){
        return [{ label:'Problem', before:String(ctx.day.problemActual || 0),
          after:String((ctx.day.problemActual || 0) + ctx.n) }];
      },
      async apply(p, ctx){
        const geri = { date:p.date, eski:ctx.day.problemActual || 0, n:ctx.n };
        ctx.day.problemActual = (ctx.day.problemActual || 0) + ctx.n;
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s, o){
        const day = R.S.days[s.date];
        if(!day) return;
        const n = s.n != null ? s.n : Math.round(Number(((o && o.params) || {}).count) || 0);
        day.problemActual = farkGeri(day.problemActual, n, s.eski);
        ayniHedef(o, 'problem-yaz', x => x.date === s.date).forEach(x => { x.eski = farkZincir(x.eski, n, s.eski); });
        await R.Model.saveDay(s.date);
      },
    },

    'uyku-yaz':{
      check(p){
        const h = Number(p.hours);
        if(!isFinite(h) || h <= 0 || h > 24) return fail('Uyku süresi anlaşılmadı.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        return pass({ h, day });
      },
      preview(p, ctx){
        return [{ label:'Uyku',
          before:ctx.day.sleepHours == null ? 'girilmemiş' : ctx.day.sleepHours + ' saat',
          after:ctx.h + ' saat' }];
      },
      async apply(p, ctx){
        const geri = { date:p.date, eski:ctx.day.sleepHours, yeni:ctx.h };
        ctx.day.sleepHours = ctx.h;
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s, o){
        const day = R.S.days[s.date];
        if(!day) return;
        const yeni = s.yeni != null ? s.yeni : Number(((o && o.params) || {}).hours);
        const sonraki = ayniHedef(o, 'uyku-yaz', x => x.date === s.date)[0];
        if(sonraki){ if(sonraki.eski === yeni) sonraki.eski = s.eski; }
        else if(day.sleepHours === yeni) day.sleepHours = s.eski;
        await R.Model.saveDay(s.date);
      },
    },

    'sure-yaz':{
      check(p){
        const dk = Number(p.minutes);
        if(!isFinite(dk) || dk <= 0) return fail('Süre yok.');
        if(dk > 960) return fail(dk + ' dakika bir blok için fazla.');
        const subject = (R.SUBJECTS || []).find(x => x.id === p.subjectId);
        if(!subject) return fail('Bu ders sistemde yok.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        const blok = (day.blocks || []).find(b => b.subjectId === subject.id
          || (b.subject && R.U.norm(b.subject) === R.U.norm(subject.name)));
        if(!blok) return fail(subject.name + ' için bugün planlanmış bir blok yok.');
        return pass({ dk:Math.round(dk), subject, blok });
      },
      preview(p, ctx){
        return [{ label:(ctx.blok.topic || ctx.subject.name) + ' · süre',
          before:ctx.blok.actualMin == null ? 'girilmemiş' : ctx.blok.actualMin + ' dk',
          after:((Number(ctx.blok.actualMin) || 0) + ctx.dk) + ' dk' }];
      },
      async apply(p, ctx){
        const geri = { date:p.date, blockId:ctx.blok.id, eski:ctx.blok.actualMin, dk:ctx.dk,
          durum:ctx.blok.status === 'pending' ? 'pending' : null };
        ctx.blok.actualMin = (Number(ctx.blok.actualMin) || 0) + ctx.dk;
        if(ctx.blok.status === 'pending') ctx.blok.status = 'done';
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s, o){
        const day = R.S.days[s.date];
        if(!day) return;
        const dk = s.dk != null ? s.dk : Math.round(Number(((o && o.params) || {}).minutes) || 0);
        const b = (day.blocks || []).find(x => x.id === s.blockId);
        if(b){
          b.actualMin = farkGeri(b.actualMin, dk, s.eski);
          durumGeri(b, s, o);
        }
        ayniHedef(o, 'sure-yaz', x => x.date === s.date && x.blockId === s.blockId)
          .forEach(x => { x.eski = farkZincir(x.eski, dk, s.eski); });
        await R.Model.saveDay(s.date);
      },
    },
  };

  function tarihAraligi(from, to){
    return from === to ? U.fmtShort(from) : U.fmtShort(from) + ' – ' + U.fmtShort(to);
  }

  function cardFront(err){
    const head = err.topic || err.testName || 'Yanlış';
    const root = String(err.rootCause || '').trim();
    return root ? head + ' — ' + root : head;
  }

  /* ==================== dogrulama ==================== */

  /* Bir onerinin su anda uygulanabilir olup olmadigi. Bekleyen oneri de
     her cizimde yeniden gecer: arada veri degismis olabilir. */
  function check(p){
    const def = R.ACTION_BY_ID[p && p.action];
    if(!def) return fail('Bilinmeyen eylem.');
    if(def.agents.indexOf(p.agent) < 0){
      return fail(agentName(p.agent) + ' bu eylemi öneremez; alanı dışında.');
    }
    const impl = IMPL[def.id];
    if(!impl) return fail('Bu eylemin uygulaması yok.');
    try{ return impl.check(p.params || {}); }
    catch(e){ return fail('Öneri doğrulanamadı.'); }
  }

  /* Ne degisecek — onaydan ONCE gosterilir. */
  function preview(p){
    const res = check(p);
    if(!res.ok) return { ok:false, why:res.why, rows:[] };
    const impl = IMPL[p.action];
    try{ return { ok:true, rows:impl.preview(p.params || {}, res.ctx) || [] }; }
    catch(e){ return { ok:false, why:'Önizleme üretilemedi.', rows:[] }; }
  }

  function agentName(id){
    const a = R.AGENT_BY_ID[id];
    return a ? a.name : 'Bu ajan';
  }

  /* ==================== depo ==================== */

  function all(){ return (S.officeProposals || []).slice(); }
  function pending(){ return all().filter(p => p.status === 'pending'); }
  function applied(){ return all().filter(p => p.status === 'applied'); }

  /* Gecerliligini yitirmis bekleyen oneriler kullaniciya gosterilmez:
     veri degistiyse oneri de gecersizdir. */
  function actionable(){
    return pending().map(p => Object.assign({}, p, { preview:preview(p) }))
      .filter(p => p.preview.ok);
  }

  async function save(){
    S.officeProposals = (S.officeProposals || []).slice(-MAX);
    S.officeProposalKeys = (S.officeProposalKeys || []).slice(-MAX_ANAHTAR);
    await R.Store.set(STORE, { items:S.officeProposals, anahtarlar:S.officeProposalKeys });
    return S.officeProposals;
  }

  async function load(){
    const doc = await R.Store.get(STORE);
    S.officeProposals = (doc && Array.isArray(doc.items)) ? doc.items : [];
    S.officeProposalKeys = (doc && Array.isArray(doc.anahtarlar)) ? doc.anahtarlar : [];
    return S.officeProposals;
  }

  /* Ayni eylem+parametre ikinci kez kuyruga girmez. */
  function fingerprint(p){
    return p.action + '|' + JSON.stringify(p.params || {});
  }

  /* TEK UYGULAMA ANAHTARI. Disaridan (HKM, BAM) gelen bir teklif ag
     yuzunden iki kez gelebilir; ayni anahtar HICBIR durumda ikinci kez
     kuyruga girmez — uygulanmis, geri alinmis ya da reddedilmis olsa
     bile. Anahtarsiz oneri (ornegin «10 paragraf yaptim») tekrar
     edilebilir: iki ayri oturum iki ayri kayittir. */
  function anahtarOf(p){
    const a = String((p && p.anahtar) || '').trim().slice(0, 120);
    return a || null;
  }

  /* IZ — «bu degisiklik nereden geldi?» Yalniz {tur, id} ciftleri
     tasinir, ikisi de kisa metne indirilir; gerisi atilir. */
  function izOf(p){
    const ham = Array.isArray(p && p.iz) ? p.iz : [];
    return ham.filter(x => x && typeof x === 'object')
      .map(x => ({ tur:String(x.tur || '').trim().slice(0, 24),
                   id:String(x.id == null ? '' : x.id).trim().slice(0, 60) }))
      .filter(x => x.tur && x.id)
      .slice(0, 8);
  }

  async function propose(p){
    const res = check(p);
    if(!res.ok) return null;
    S.officeProposals = S.officeProposals || [];
    S.officeProposalKeys = S.officeProposalKeys || [];
    const fp = fingerprint(p);
    if(S.officeProposals.some(x => x.status === 'pending' && fingerprint(x) === fp)) return null;
    const anahtar = anahtarOf(p);
    if(anahtar && S.officeProposalKeys.indexOf(anahtar) >= 0) return null;

    const def = R.ACTION_BY_ID[p.action];
    const row = {
      id:U.uid('p'),
      action:p.action,
      agent:p.agent,
      params:p.params || {},
      reason:String(p.reason || '').slice(0, 240),
      source:KAYNAKLAR.indexOf(p.source) >= 0 ? p.source : 'kural',
      /* Seviye KATALOGDAN yazilir; onerenin gonderdigi deger okunmaz. */
      level:SEVIYELER.indexOf(def.level) >= 0 ? def.level : 'orta',
      anahtar,
      iz:izOf(p),
      at:new Date().toISOString(),
      status:'pending',
      appliedAt:null,
      undo:null,
      otomatik:false,
    };
    S.officeProposals.push(row);
    if(anahtar) S.officeProposalKeys.push(anahtar);
    await save();
    return row;
  }

  /* ==================== otomatik uygulama ====================

     Tek karar noktasi. Kucuk degilse asla; ayar bilinmiyorsa varsayilan
     ('istek') gibi davranir — bozuk bir ayar kendiliginden «hepsi»ne
     donmemeli. Olcum yazan eylem (katalogda `olcum:true`) hicbir ayarda
     sormadan uygulanmaz (ekip/HATALAR.md KR-1). */
  function otomatikMi(row, mod){
    if(!row || row.level !== 'kucuk') return false;
    if((R.ACTION_BY_ID[row.action] || {}).olcum) return false;
    const m = MODLAR.indexOf(mod) >= 0 ? mod : 'istek';
    if(m === 'hicbiri') return false;
    if(m === 'hepsi') return true;
    return row.source === 'istek';
  }

  function ayar(){
    try{
      const st = R.Office && typeof R.Office.settings === 'function' ? R.Office.settings() : null;
      return (st && st.otomatikUygula) || 'istek';
    }catch(e){ return 'istek'; }
  }

  /* Oneriyi kuyruga alir; seviye ve ayar izin veriyorsa hemen uygular.
     Donus: { row, otomatik, why }. row null ise hicbir sey yazilmadi. */
  async function talep(p){
    const res = check(p);
    if(!res.ok) return { row:null, otomatik:false, why:res.why };
    const row = await propose(p);
    if(!row){
      return { row:null, otomatik:false,
        why:'Bu öneri zaten bekliyor ya da daha önce işlendi.' };
    }
    if(!otomatikMi(row, ayar())) return { row, otomatik:false, why:null };
    const r = await approve(row.id);
    if(!r || !r.ok) return { row, otomatik:false, why:(r && r.why) || null };
    r.row.otomatik = true;
    await save();
    return { row:r.row, otomatik:true, why:null };
  }

  /* ==================== onay ==================== */

  async function approve(id){
    const row = (S.officeProposals || []).find(p => p.id === id);
    if(!row || row.status !== 'pending') return null;
    /* Onay anında yeniden dogrula: kullanici oneriyi gordukten sonra
       veri degismis olabilir, eski dogrulamaya guvenilmez. */
    const res = check(row);
    if(!res.ok){
      row.status = 'stale';
      row.why = res.why;
      await save();
      return { ok:false, why:res.why };
    }
    const impl = IMPL[row.action];
    /* Once anlik goruntu, sonra yazma: geri alma her zaman mumkun olmali. */
    row.undo = await impl.apply(row.params || {}, res.ctx);
    row.status = 'applied';
    row.appliedAt = new Date().toISOString();
    row.sira = yeniSira();
    await save();
    return { ok:true, row };
  }

  /* TEK DOKUNUŞ (fikir 22): kullanıcının ekranda AÇIKÇA istediği eylem öneri
     kuyruğunu beklemez; ama AYNI katalogdan geçer — doğrulama, anlık görüntü,
     geri alma. Aynı eylemin bekleyen önerisi varsa ikinci satır açılmaz, o
     onaylanır. */
  async function hemen(p){
    /* Eylemi kim önerebiliyorsa onun adına: kullanıcının kendi isteği bir
       ajanın alanını genişletmez, katalogdaki ilk yetkili ajan yazılır. */
    const def = R.ACTION_BY_ID[p && p.action];
    const istek = Object.assign({ agent:def && def.agents[0], source:'istek' }, p);
    let row = await propose(istek);
    if(!row){
      const fp = fingerprint(istek);
      row = (S.officeProposals || []).find(x => x.status === 'pending' && fingerprint(x) === fp) || null;
    }
    if(!row){
      const c = check(istek);
      return { ok:false, why:c.ok ? 'Öneri kurulamadı.' : c.why };
    }
    const r = await approve(row.id);
    return r && r.ok ? { ok:true, row:r.row } : { ok:false, why:(r && r.why) || 'Uygulanamadı.' };
  }

  async function reject(id){
    const row = (S.officeProposals || []).find(p => p.id === id);
    if(!row || row.status !== 'pending') return null;
    row.status = 'rejected';
    await save();
    return row;
  }

  async function undo(id){
    const row = (S.officeProposals || []).find(p => p.id === id);
    if(!row || row.status !== 'applied') return null;
    const impl = IMPL[row.action];
    await impl.revert(row.undo || {}, { params:row.params || {}, sonraki:sonrakiler(row) });
    row.status = 'undone';
    row.undoneAt = new Date().toISOString();
    await save();
    return row;
  }

  async function clearResolved(){
    S.officeProposals = (S.officeProposals || []).filter(p => p.status === 'pending');
    await save();
  }

  /* ==================== kural motoru onerileri ====================

     Model gerekmez, kota harcanmaz, cevrimdisi calisir. Masa notlariyla
     ayni doktrin: esik asilirsa oneri dogar, asilmazsa dogmaz. */

  function suggest(){
    const out = [];
    const today = U.todayISO();

    /* 1. Geciken tekrar borcu — analistin alani. */
    const late = (S.cards || []).filter(c => c.dueAt && c.dueAt < today);
    if(late.length >= 5){
      out.push({
        action:'cards-due-today', agent:'analist', source:'kural',
        params:{ limit:Math.min(late.length, 30) },
        reason:late.length + ' kartın tekrar tarihi geçmiş; borç ertelendikçe büyüyor.',
      });
    }

    /* 2. Kok nedeni yazilmis ama karta donmemis yanlis. */
    const orphan = (S.errors || []).find(e => !e.closedAt
      && String(e.principle || e.recipe || '').trim()
      && !(S.cards || []).some(c => c.sourceRef === e.id));
    if(orphan){
      out.push({
        action:'card-from-error', agent:'analist', source:'kural',
        params:{ errorId:orphan.id },
        reason:'Kök nedeni yazılmış bu yanlış karta dönmemiş; tekrar edilmezse yine yapılır.',
      });
    }

    /* 3. Kapali gorunen ama acik yanlisi olan konu — brans uzmaninin alani. */
    (R.SUBJECTS || []).forEach(subject => {
      const owner = subject.exam === 'TYT' ? 'tyt' : 'ayt';
      (subject.topics || []).forEach(topic => {
        const st = M.topicState(subject.id, topic.id);
        if(st.state !== 'closed' && st.state !== 'provisional') return;
        const openErrors = (S.errors || []).filter(e => !e.closedAt
          && e.subjectId === subject.id && e.topicId === topic.id).length;
        if(openErrors < 2) return;
        out.push({
          action:'topic-review', agent:owner, source:'kural',
          params:{ subjectId:subject.id, topicId:topic.id },
          reason:topic.name + ' kapalı görünüyor ama üzerinde ' + openErrors
            + ' açık yanlış var; kapanış gerçek değil.',
        });
      });
    });

    /* Dogrulanmayan oneri hic dogmaz. */
    return out.filter(p => check(p).ok);
  }

  /* Kural motorunun buldugu onerileri kuyruga alir; var olanlar tekrarlanmaz. */
  async function refresh(){
    const found = suggest();
    const added = [];
    for(const p of found){
      const row = await propose(p);
      if(row) added.push(row);
    }
    return added;
  }

  /* ==================== modelin onerisi ====================

     Ajan yaniti bir JSON nesnesi tasiyabilir. Nesne kapali kataloga ve
     yapisal parametreye uymuyorsa sessizce dusurulur — model bir eylem
     UYDURAMAZ, yalnizca var olanlardan birini secebilir. */

  function fromModel(agentId, obj){
    if(!obj || typeof obj !== 'object') return null;
    const def = R.ACTION_BY_ID[obj.eylem || obj.action];
    if(!def) return null;
    /* Büyük aksiyonların bir kısmını YALNIZ kullanıcı başlatır. */
    if(def.modelYok) return null;
    if(def.agents.indexOf(agentId) < 0) return null;

    /* Parametreler semadan okunur: fazladan alan tasinmaz. */
    const raw = obj.parametreler || obj.params || {};
    const params = {};
    let missing = false;
    Object.keys(def.params).forEach(key => {
      const want = def.params[key];
      const v = raw[key];
      if(v == null || v === ''){ missing = true; return; }
      if(want === 'number'){
        const n = Number(v);
        if(!Number.isFinite(n)){ missing = true; return; }
        params[key] = n;
      }else{
        params[key] = String(v).slice(0, 120);
      }
    });
    if(missing) return null;

    const p = {
      action:def.id, agent:agentId, params, source:'llm',
      reason:String(obj.gerekce || obj.reason || '').slice(0, 240),
    };
    return check(p).ok ? p : null;
  }

  /* Ajana katalogu anlatan istem parcasi. Ekran degil motor kurar:
     katalog degisirse istem kendiliginden degisir. */
  function catalogPrompt(agentId){
    const list = R.actionsFor(agentId).filter(a => !a.modelYok);
    if(!list.length) return '';
    return 'SİSTEME MÜDAHALE (isteğe bağlı):\n'
      + 'Aşağıdaki eylemlerden biri durumu düzeltecekse yanıtının SONUNA tek bir '
      + 'JSON nesnesi ekleyebilirsin. Eylem uydurma, listede olmayanı yazma; '
      + 'yazdığın şey doğrudan uygulanmaz, kullanıcının onayına düşer.\n'
      + list.map(a => '- ' + a.id + ' (' + a.title + ') · parametreler: '
          + Object.keys(a.params).join(', ')).join('\n') + '\n'
      + 'Biçim: {"eylem":"<id>","parametreler":{…},"gerekce":"tek cümle"}\n'
      + 'Gerek yoksa JSON yazma.';
  }

  /* Akis sirasinda yarim kalmis JSON kullaniciya gorunmesin. Yalniz eylem
     nesnesine benzeyen kuyruk gizlenir; duz metindeki suslu parantez
     (nadir de olsa) kirpilmaz. */
  function stripTrailingJson(text){
    const s = String(text || '');
    const i = s.lastIndexOf('{');
    if(i < 0) return s;
    if(!/"(eylem|action)"/.test(s.slice(i))) return s;
    return s.slice(0, i).replace(/```(?:json)?\s*$/, '').trimEnd();
  }

  /* Ajan yanitinin sonundaki JSON'u ayirir: kullaniciya gosterilen metin
     JSON tasimaz, oneri ayri durur. */
  function splitAction(text){
    const s = String(text || '');
    const end = s.lastIndexOf('}');
    if(end < 0) return { text:s.trim(), obj:null };
    /* Nesne ic ice oldugunda SON '{' dis nesnenin basi degildir
       ("parametreler":{…} icerideki paranteze denk gelir). Bu yuzden
       gecerli ayrisan EN ERKEN baslangic aranir. */
    for(let i = s.indexOf('{'); i >= 0 && i <= end; i = s.indexOf('{', i + 1)){
      let obj = null;
      try{ obj = JSON.parse(s.slice(i, end + 1)); }catch(e){ continue; }
      if(!obj || (!obj.eylem && !obj.action)) continue;
      /* JSON'dan once kod cercevesi kalmis olabilir. */
      const head = s.slice(0, i).replace(/```(?:json)?\s*$/, '').trim();
      return { text:head, obj };
    }
    return { text:s.trim(), obj:null };
  }

  return {
    all, pending, applied, actionable, check, preview,
    propose, approve, hemen, reject, undo, clearResolved,
    talep, otomatikMi, ayar, SEVIYELER, MODLAR,
    suggest, refresh, fromModel, catalogPrompt, splitAction, stripTrailingJson,
    load, save, MAX,
  };
})();
