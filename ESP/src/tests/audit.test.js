/* Denetim testleri — didik didik geçişte bulunan gerçek hatalar.

   Her testin başında hangi hatayı kilitlediği yazar. Bir hatayı düzeltip
   testini yazmamak, aynı hatayı altı ay sonra yeniden yazmaktır. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync,
    pushNote, pushBook, pushCard, pushSession } = ESP.Test;

  describe('denetim · Turkce kelime siniri', () => {

    /* HATA: office.validate() kapsam denetimi `new RegExp('\\b'+kısa+'\\b')`
       kullanıyordu. JavaScript'te «ı» kelime karakteri DEĞİLDİR, bu yüzden
       /\bYazı\b/ hiçbir cümlede eşleşmiyor ve yazı alanı ihlali sessizce
       görünmez oluyordu. */
    it('«Yazı» alan ihlali artik yakalanir', () => {
      resetState();
      const r = ESP.Office.validate('Senin yazı üslubun şöyle olmalı.',
        { agentId:'maestro' });
      expect(r.scopeBreaches.some(x => x.id === 'scope:writing')).toBeTruthy();
    });

    it('kendi alaninin adi gecerse ihlal sayilmaz', () => {
      resetState();
      const r = ESP.Office.validate('Müzik tarafında tempo eşiğin duruyor.',
        { agentId:'maestro' });
      expect(r.scopeBreaches.length).toBe(0);
    });

    it('kelime icinde gecen ad ihlal saymaz', () => {
      resetState();
      /* «Diksiyon» kelimesi «diksiyonel» gibi bir kelimenin içinde geçseydi
         alt dize araması yanlış alarm verirdi. */
      const r = ESP.Office.validate('Bu tarihsel bir yorum.', { agentId:'maestro' });
      expect(r.scopeBreaches.some(x => x.id === 'scope:history')).toBeFalsy();
    });
  });

  describe('denetim · teklif tekrari', () => {

    /* HATA: onaylanan teklif yeniden üretiliyordu. Koşul (ölçülemeyen kapı)
       onaydan sonra da sürdüğü için sistem aynı hatırlatıcıyı her çizimde
       tekrar öneriyor, onaylayan kullanıcı kopya biriktiriyordu. */
    it('onaylanan teklif, uyguladigi sey dururken tekrar onerilmez', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = ESP.Plans.proposalsFor('polyglot')
          .filter(p => p.kind === 'reminder')[0];
        expect(t != null).toBeTruthy();
        await ESP.Plans.accept(t);
        ESP.Memo.bitir();
        const tekrar = ESP.Plans.proposalsFor('polyglot')
          .filter(p => p.id === t.id);
        expect(tekrar.length).toBe(0);
      });
    });

    it('uygulanan sey kapaninca teklif geri gelir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = ESP.Plans.proposalsFor('polyglot')
          .filter(p => p.kind === 'reminder')[0];
        await ESP.Plans.accept(t);
        ESP.Memo.bitir();

        /* Hatırlatıcı yapıldı: koşul hâlâ sürüyorsa teklif yeniden anlamlı. */
        await ESP.Model.completeReminder(ESP.S.reminders[0].id);
        ESP.Memo.bitir();
        expect(ESP.Plans.proposalsFor('polyglot').some(p => p.id === t.id)).toBeTruthy();
      });
    });

    it('bilinmeyen uygulama turu «duruyor» sayilmaz', () => {
      resetState();
      expect(ESP.Plans.stillApplied({ applied:{ kind:'boyle-bir-sey-yok' } })).toBeFalsy();
      expect(ESP.Plans.stillApplied({})).toBeFalsy();
    });
  });

  describe('denetim · bag onerisi dizini', () => {

    /* Eski surum butun not ciftlerini dolasiyordu (n²) ve her ciftte
       kavramlari yeniden normalize ediyordu. Yeni surum kavram dizini
       kullaniyor; DAVRANISI ayni kalmali. */
    it('ortak kavrami olan iki not onerilir', () => {
      resetState();
      const a = pushNote('ilk', null, ['zaman']);
      const b = pushNote('ikinci', null, ['zaman']);
      const o = ESP.Intellect.linkSuggestions(5);
      expect(o.length).toBe(1);
      expect(o[0].concepts[0]).toBe('zaman');
    });

    it('ortak kavrami olmayan notlar onerilmez', () => {
      resetState();
      pushNote('ilk', null, ['zaman']);
      pushNote('ikinci', null, ['adalet']);
      expect(ESP.Intellect.linkSuggestions(5).length).toBe(0);
    });

    it('zaten bagli iki not tekrar onerilmez', async () => {
      resetState();
      const a = pushNote('ilk', null, ['zaman']);
      const b = pushNote('ikinci', null, ['zaman']);
      await ESP.Model.linkNotes(a.id, b.id, 'gerekçe');
      expect(ESP.Intellect.linkSuggestions(5).length).toBe(0);
    });

    it('farkli kaynaktan gelen bag once onerilir', () => {
      resetState();
      const k1 = pushBook('Kitap A', 'Yazar A');
      const k2 = pushBook('Kitap B', 'Yazar B');
      pushNote('a', k1.id, ['zaman']);
      pushNote('b', k1.id, ['zaman']);
      pushNote('c', k2.id, ['zaman']);
      const o = ESP.Intellect.linkSuggestions(5);
      expect(o[0].cross).toBeTruthy();
    });

    it('iki kavram paylasan cift daha yuksek puan alir', () => {
      resetState();
      pushNote('a', null, ['zaman', 'adalet']);
      pushNote('b', null, ['zaman', 'adalet']);
      pushNote('c', null, ['zaman']);
      const o = ESP.Intellect.linkSuggestions(5);
      expect(o[0].concepts.length).toBe(2);
    });

    it('kavramsiz notlar hic dolasilmaz', () => {
      resetState();
      for(let i = 0; i < 50; i++) pushNote('n' + i, null, []);
      expect(ESP.Intellect.linkSuggestions(5).length).toBe(0);
    });
  });

  describe('denetim · kare onbellegi', () => {

    /* Onbellek YALNIZCA kare icinde yasamali: disarida eski sayi
       gostermek, bu sistemde yanlis sayi gostermektir. */
    it('kare disinda hesap her seferinde tazedir', () => {
      resetState();
      expect(ESP.Curriculum.measure('lang.cards').value).toBe(0);
      pushCard({ front:'a', back:'b' });
      expect(ESP.Curriculum.measure('lang.cards').value).toBe(1);
    });

    it('kare icinde ayni sayi iki kez hesaplanmaz ama kare bitince tazelenir', () => {
      resetState();
      ESP.Memo.baslat();
      const once = ESP.Curriculum.measure('lang.cards').value;
      pushCard({ front:'a', back:'b' });
      expect(ESP.Curriculum.measure('lang.cards').value).toBe(once);   // kare icinde sabit
      ESP.Memo.bitir();
      expect(ESP.Curriculum.measure('lang.cards').value).toBe(once + 1);
    });

    it('onbellege konan deger cagirana ait degildir: liste paylasilir', () => {
      resetState();
      pushCard({ front:'a', back:'b' });
      ESP.Memo.baslat();
      const a = ESP.SRS.dueCards();
      const b = ESP.SRS.dueCards();
      expect(a === b).toBeTruthy();
      ESP.Memo.bitir();
    });
  });

  describe('denetim · yedek butunlugu', () => {

    /* Yeni koleksiyonlar (ekler, hatirlaticilar, teklifler, plan, olaylar,
       kaynaklar, zincirler) yedege girmezse kullanici onlari sessizce
       kaybeder. */
    it('butun koleksiyonlar yedege girer ve geri yuklenir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await ESP.Model.saveAsset(ESP.Model.newAsset({ disc:'lang', kind:'note',
          title:'ek', text:'metin' }));
        await ESP.Model.saveReminder(ESP.Model.newReminder({ disc:'lang',
          text:'hatırlat', due:'2026-09-20' }));
        await ESP.Model.saveEvent(ESP.Model.newEvent({ title:'Olay', year:1453 }));
        await ESP.Model.saveSource(ESP.Model.newSource({ title:'Kaynak' }));
        await ESP.Model.saveChain(ESP.Model.newChain({ eventId:ESP.S.events[0].id,
          question:'neden?' }));
        await ESP.Plans.savePlan(ESP.Plans.weekPlan());

        const yedek = ESP.Store.exportAll();
        const anahtarlar = Object.keys(yedek.data).join(' ');
        ['assets/', 'reminders/', 'events/', 'sources/', 'chains/', 'weekplan']
          .forEach(k => expect(anahtarlar.indexOf(k) >= 0).toBeTruthy());

        /* Geri yükleme: depo temizlenip yedekten dolduruluyor. */
        await ESP.Store.importAll(yedek);
        await ESP.Model.loadAll();
        expect(ESP.S.assets.length).toBe(1);
        expect(ESP.S.reminders.length).toBe(1);
        expect(ESP.S.events.length).toBe(1);
        expect(ESP.S.sources.length).toBe(1);
        expect(ESP.S.chains.length).toBe(1);
        expect(ESP.S.weekPlan != null).toBeTruthy();
      });
    });
  });

  describe('denetim · bozuk belge', () => {

    /* HATA: depodan gelen belge temizlenmiyordu. `box:"abc"` olan bir kart
       SRS'e giriyor, schedule() `card.reps + 1` yapinca "iki1" uretiyordu.
       Hicbir yerde hata gorunmuyor — yalnizca sayilar yanlis. */
    it('bozuk SRS alanlari sinirda temizlenir', async () => {
      resetState();
      await ESP.Store.set('cards/x', { id:'x', front:'a', back:'b', lang:'en',
        box:'abc', ease:'çok', interval:null, due:'yarın', reps:'iki',
        lapses:-5, history:'yok' });
      await ESP.Model.loadAll();
      const c = ESP.S.cards[0];
      expect(typeof c.box).toBe('number');
      expect(typeof c.ease).toBe('number');
      expect(c.reps).toBe(0);
      expect(c.lapses).toBe(0);
      expect(Array.isArray(c.history)).toBeTruthy();
      /* Cozulemeyen tarih bugune cekilir: gorunmeyen bir kart, kullanicinin
         neden gormedigini anlayamayacagi bir karttir. */
      expect(c.due).toBe(ESP.U.todayISO());
    });

    it('temizlenmis kart SRS hesabini bozmaz', async () => {
      resetState();
      await ESP.Store.set('cards/x', { id:'x', front:'a', back:'b', lang:'en',
        box:'abc', ease:'çok', reps:'iki' });
      await ESP.Model.loadAll();
      const n = ESP.SRS.schedule(ESP.S.cards[0], 'good');
      expect(typeof n.reps).toBe('number');
      expect(typeof n.box).toBe('number');
      expect(isFinite(n.interval)).toBeTruthy();
    });

    /* Doktrin: degeri olmayan alan «olculdu» etiketi tasiyamaz. */
    it('etiket ile deger birlikte tutarli kalir', async () => {
      resetState();
      await ESP.Store.set('days/2026-09-12', { date:'2026-09-12', sessions:[
        { id:'s1', disc:'lang', minutes:'çok', minutesCert:'measured' },
        { id:'s2', disc:'lang', minutes:30, minutesCert:'missing' },
      ] });
      await ESP.Model.loadAll();
      const ss = ESP.S.days['2026-09-12'].sessions;
      expect(ss[0].minutesCert).toBe('missing');     // deger yok → etiket yok
      expect(ss[1].minutesCert).toBe('measured');    // deger var → etiket var
      expect(ss[1].minutes).toBe(30);
    });

    it('bilinmeyen disiplin varsayilana duser', async () => {
      resetState();
      await ESP.Store.set('days/2026-09-12', { date:'2026-09-12',
        sessions:[{ id:'s1', disc:'astroloji', minutes:20, minutesCert:'measured' }] });
      await ESP.Model.loadAll();
      expect(ESP.S.days['2026-09-12'].sessions[0].disc).toBe('lang');
    });

    it('bozuk tempo kaydi eleniyor, esik sayi kaliyor', async () => {
      resetState();
      await ESP.Store.set('pieces/p1', { id:'p1', name:'x', cleanBpm:'hizli',
        targetBpm:'140', kind:'sarki',
        attempts:[{ date:'2026-09-10', bpm:'yavas', clean:true },
                  { date:'2026-09-11', bpm:100, clean:true },
                  { bpm:120, clean:true }] });
      await ESP.Model.loadAll();
      const p = ESP.S.pieces[0];
      expect(p.cleanBpm).toBeNull();
      expect(p.targetBpm).toBe(140);
      expect(p.kind).toBe('technique');
      expect(p.attempts.length).toBe(1);      // sayisiz ve tarihsiz olan eleniyor
    });

    it('tarihi cozulemeyen hedef TARIHSIZ sayilir', async () => {
      resetState();
      await ESP.Store.set('goals/g1', { id:'g1', label:'x', disc:'lang',
        date:'bir ara' });
      await ESP.Model.loadAll();
      expect(ESP.S.goals[0].date).toBeNull();
      /* Tarihsiz hedef «yaklasan hedef» kuralina girmez. */
      expect(ESP.Planner.deadlines().length).toBe(0);
    });

    it('bozuk diksiyon olcumu etiketiyle birlikte duzelir', async () => {
      resetState();
      await ESP.Store.set('recordings/r1', { id:'r1', date:'2026-09-12',
        seconds:'kirk', secondsCert:'measured', words:120, wordsCert:'missing',
        errors:null, errorsCert:'measured' });
      await ESP.Model.loadAll();
      const r = ESP.S.recordings[0];
      expect(r.secondsCert).toBe('missing');
      expect(r.wordsCert).toBe('measured');
      expect(r.errorsCert).toBe('missing');
    });

    it('sayi() virgullu ondaligi okur, sacmaligi okumaz', () => {
      expect(ESP.Model.sayi('12,5')).toBe(12.5);
      expect(ESP.Model.sayi('abc')).toBeNull();
      expect(ESP.Model.sayi(undefined, 7)).toBe(7);
      expect(ESP.Model.sayi(Infinity)).toBeNull();
      expect(ESP.Model.sayi(NaN)).toBeNull();
    });
  });

  describe('denetim · gecersiz tarih', () => {

    /* HATA: `new Date('yarın')` GECERSIZ bir Date uretir ve gecersiz Date
       nesnesi TRUTHY'dir. `if(U.parse(x))` yazan her denetim bozuk bir
       tarihte de "gecerli" diyordu. */
    it('cozulemeyen tarih null doner, truthy bir nesne degil', () => {
      expect(ESP.U.parse('yarın')).toBeNull();
      expect(ESP.U.parse('')).toBeNull();
      expect(ESP.U.parse('2026-13-01')).toBeNull();
      expect(ESP.U.parse('2026-02-31')).toBeNull();      // takvimde yok
      expect(ESP.U.parse('2026-09-12') != null).toBeTruthy();
    });

    it('isISO takvimi bilir', () => {
      expect(ESP.U.isISO('2026-02-29')).toBeFalsy();     // 2026 artik yil degil
      expect(ESP.U.isISO('2024-02-29')).toBeTruthy();
      expect(ESP.U.isISO('20260912')).toBeFalsy();
      expect(ESP.U.isISO(null)).toBeFalsy();
    });

    /* NaN sessizce yayilir ve her karsilastirmayi false yapar; null
       cagirani durmaya zorlar. */
    it('cozulemeyen tarihte diffDays null doner, NaN degil', () => {
      expect(ESP.U.diffDays('yarın', '2026-09-12')).toBeNull();
      expect(ESP.U.diffDays('2026-09-10', '2026-09-12')).toBe(2);
    });

    it('bozuk esik tarihi olmamis bir kazanim yazmaz', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        ESP.S.pieces.push(ESP.Model.newPiece({ name:'Gam', cleanBpm:150,
          targetBpm:140, thresholdAt:'gecen hafta' }));
        ESP.Memo.bitir();
        const win = ESP.Office.notes('maestro').filter(n => n.kind === 'win');
        expect(win.length).toBe(0);
      });
    });

    it('bozuk hedef tarihi butun plani acil yapmaz', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        ESP.S.goals.push(ESP.Model.newGoal({ label:'x', disc:'lang', date:'bir ara' }));
        expect(ESP.Planner.deadlines().some(d => d.urgent)).toBeFalsy();
      });
    });
  });

  describe('denetim · pratikte silinen kart', () => {

    it('oturum sirasinda silinen kart isabet sayisina girmez', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        for(let i = 0; i < 6; i++) pushCard({ front:'k' + i, back:'b' + i, lang:'en' });
        const s = ESP.Lesson.start('en', { kinds:['recall'], length:3 });
        const q = s.questions[0];
        await ESP.Model.deleteCard(q.cardId);
        const res = await ESP.Lesson.answer(s, q.answer);
        expect(res.ok).toBeFalsy();
        expect(res.skipped).toBeTruthy();
        expect(s.right).toBe(0);
        expect(s.wrong).toBe(0);
        expect(s.pos).toBe(1);            // soru yine de gecilir, oturum kilitlenmez
      });
    });
  });

  describe('denetim · gorunum ayari', () => {

    /* HATA: Ayarlar ekrani gorunum tercihlerini `prefs`'e yaziyordu, kabuk
       ise `profile`'dan okuyor. Yani o ekrandan yapilan hicbir gorunum
       degisikligi UYGULANMIYORDU. Ayni ayarin iki kaydi, hangisinin dogru
       oldugu sorusunu dogurur — tek kaynak `profile`. */
    it('gorunum tercihleri profilde durur', async () => {
      resetState();
      await ESP.Model.saveProfile({ theme:'dark', palette:'indigo', design:'odak' });
      expect(ESP.S.profile.theme).toBe('dark');
      expect(ESP.S.profile.palette).toBe('indigo');
      /* prefs bu alanlari HIC tasimaz: varsayilanlarda yoklar. */
      const d = ESP.Model.defaultPrefs();
      expect(d.theme).toBeUndefined();
      expect(d.palette).toBeUndefined();
      expect(d.design).toBeUndefined();
    });

    /* HATA: secenekler `x.label` okuyordu; palet ve duzen verisinde o alan
       `name`. Etiket undefined kalinca ekranda «[object Object]» goruluyordu. */
    it('eski kayittaki gorunum tercihi profile tasinir ve prefs\'ten silinir', async () => {
      resetState();
      await ESP.Store.set('prefs', { reduceMotion:false, palette:'bordo', theme:'dark' });
      await ESP.Store.set('profile', { id:'test', name:'Test' });
      await ESP.Model.loadAll();
      expect(ESP.S.profile.palette).toBe('bordo');
      expect(ESP.S.prefs.palette).toBeUndefined();
    });

    it('profilde zaten deger varsa eski prefs onu ezmez', async () => {
      resetState();
      await ESP.Store.set('prefs', { palette:'bordo' });
      await ESP.Store.set('profile', { id:'test', name:'Test', palette:'indigo' });
      await ESP.Model.loadAll();
      expect(ESP.S.profile.palette).toBe('indigo');
    });

    it('palet ve duzen verisinde etiket alani `name`dir', () => {
      ESP.PALETTES.forEach(x => {
        expect(String(x.name || '').length > 0).toBeTruthy();
        expect(x.label).toBeUndefined();
      });
      ESP.DESIGNS.forEach(x => {
        expect(String(x.name || '').length > 0).toBeTruthy();
      });
    });

    /* HATA: localQuota() bir NESNE dondurur, sayi gibi bolununce «%NaN». */
    it('ayak izi yuzdesi NaN olamaz', () => {
      resetState();
      const a = ESP.Model.dataFootprint();
      expect(a.pct == null || isFinite(a.pct)).toBeTruthy();
      expect(typeof a.bytes).toBe('number');
    });

    it('olculemeyen kota yuzde olarak gosterilmez', () => {
      resetState();
      const gercek = ESP.Store.localQuota;
      ESP.Store.localQuota = () => ({ bytes:10, limit:0, pct:null });
      try{
        expect(ESP.Model.dataFootprint().pct).toBeNull();
      }finally{ ESP.Store.localQuota = gercek; }
    });
  });

  describe('denetim · depo hatasi', () => {

    /* HATA: model fonksiyonlari Store.set donusunu yok sayiyor, kota dolsa
       bile «Eklendi» diyordu. */
    it('depo yazamazsa islem basarili demez', async () => {
      resetState();
      const gercek = ESP.Store.set;
      ESP.Store.set = async () => false;
      try{
        const res = await ESP.Model.saveAsset(ESP.Model.newAsset({ disc:'lang',
          title:'ek' }));
        expect(res.ok).toBeFalsy();
        expect(res.error.indexOf('dolu') > 0).toBeTruthy();
      }finally{
        ESP.Store.set = gercek;
      }
    });

    it('hatirlatici da ayni sekilde davranir', async () => {
      resetState();
      const gercek = ESP.Store.set;
      ESP.Store.set = async () => false;
      try{
        const res = await ESP.Model.saveReminder(ESP.Model.newReminder({
          disc:'lang', text:'x' }));
        expect(res.ok).toBeFalsy();
      }finally{
        ESP.Store.set = gercek;
      }
    });
  });
})();
