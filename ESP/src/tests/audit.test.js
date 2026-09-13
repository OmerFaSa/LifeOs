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
