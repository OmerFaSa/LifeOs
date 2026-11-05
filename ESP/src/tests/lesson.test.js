/* Öğrenme ve pratik. En önemli iki kural: ilerleme SRS'ten OKUNUR ve
   pratik ayrı bir kayıt açmaz. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync,
    pushCard } = ESP.Test;
  const L = () => ESP.Lesson;

  describe('ders · uniteler', () => {

    it('dil ve tarih unitelerinin hepsinde hedef vardir', () => {
      ['lang', 'history'].forEach(disc => {
        L().units(disc).forEach(u => {
          expect(String(u.title || '').length > 0).toBeTruthy();
          expect(String(u.goal || '').length > 0).toBeTruthy();
        });
      });
    });

    it('tarih unitesi olaylarini tohumdan suzer, kendi listesini tasimaz', () => {
      resetState();
      const u = L().unitOf('history', 'ortacag');
      const ogeler = L().itemsOf(u);
      expect(ogeler.length > 0).toBeTruthy();
      ogeler.forEach(o => expect(o.era).toBe('ortacag'));
    });

    it('malzemesi olmayan dilde unite BOS goruntulenir, uydurulmaz', () => {
      resetState();
      const u = L().unitOf('lang', 'temel-fiil');
      expect(L().itemsOf(u, 'la').length).toBe(0);
      expect(L().progress(u, 'la').cert).toBe('missing');
    });

    it('unite eklenince kartlar «tohum» etiketi tasir', async () => {
      resetState();
      const u = L().unitOf('lang', 'temel-fiil');
      const res = await L().addUnit(u, 'en');
      expect(res.ok).toBeTruthy();
      expect(res.added).toBe(10);
      expect(ESP.S.cards[0].tags.indexOf('seed') >= 0).toBeTruthy();
    });

    it('unite iki kez eklenince kart iki kez girmez', async () => {
      resetState();
      const u = L().unitOf('lang', 'gundelik');
      await L().addUnit(u, 'en');
      const ikinci = await L().addUnit(u, 'en');
      expect(ikinci.added).toBe(0);
      expect(ikinci.skipped > 0).toBeTruthy();
    });

    it('malzemesiz unite eklenemez', async () => {
      resetState();
      expect((await L().addUnit(L().unitOf('lang', 'temel-fiil'), 'ru')).ok).toBeFalsy();
    });

    /* Ilerleme ayri bir bayraktan degil SRS'ten okunur. */
    it('bir kez dogru bilmek «bilinen» yapmaz, aralik uzayinca yapar', async () => {
      resetState();
      const u = L().unitOf('lang', 'temel-fiil');
      await L().addUnit(u, 'en');
      expect(L().progress(u, 'en').known).toBe(0);

      const kart = ESP.S.cards[0];
      kart.box = L().KNOWN_BOX;
      expect(L().progress(u, 'en').known).toBe(1);
    });

    it('kullanicinin kendi yazdigi ayni kart da uniteye sayilir', async () => {
      resetState();
      const u = L().unitOf('lang', 'temel-fiil');
      pushCard({ front:'to be', back:'olmak', lang:'en', box:4 });
      const p = L().progress(u, 'en');
      expect(p.added).toBe(1);
      expect(p.known).toBe(1);
    });
  });

  describe('ders · cevap denetimi', () => {

    it('buyuk harf ve noktalama yok sayilir', () => {
      expect(L().correct('Olmak.', 'olmak')).toBeTruthy();
      expect(L().correct('  OLMAK ', 'olmak')).toBeTruthy();
    });

    it('es anlamlilardan biri yeter', () => {
      expect(L().correct('buna rağmen', 'yine de, buna rağmen')).toBeTruthy();
      expect(L().correct('yine de', 'yine de, buna rağmen')).toBeTruthy();
    });

    it('bastaki isaretleyici yok sayilir', () => {
      expect(L().correct('to grasp', 'grasp')).toBeTruthy();
      expect(L().correct('bir kitap', 'kitap')).toBeTruthy();
    });

    /* Turkce buyuk-kucuk donusumu: «I» harfi Ingilizce'de «i», Turkce'de
       «ı»dir. Yanlis donusum sessizce yanlis cevap uretir. */
    it('Turkce buyuk harf donusumu dogru yapilir', () => {
      expect(L().norm('IŞIK')).toBe('ışık');
      expect(L().norm('İSTANBUL')).toBe('istanbul');
    });

    it('bos cevap dogru sayilmaz', () => {
      expect(L().correct('', 'olmak')).toBeFalsy();
      expect(L().correct('   ', 'olmak')).toBeFalsy();
    });

    it('yanlis kelime toleransa girmez', () => {
      expect(L().correct('gitmek', 'olmak')).toBeFalsy();
    });
  });

  describe('ders · pratik oturumu', () => {

    function deste(n){
      for(let i = 0; i < n; i++){
        pushCard({ front:'kelime' + i, back:'karsilik' + i, lang:'en' });
      }
    }

    it('bos destede oturum acilmaz', () => {
      resetState();
      expect(L().start('en').ok).toBeFalsy();
    });

    it('oturum sabit uzunluktadir', () => {
      resetState();
      deste(30);
      withToday('2026-09-12', () => {
        expect(L().start('en').questions.length).toBe(ESP.PRACTICE_LENGTH);
      });
    });

    it('az kartta secmeli soru hatirlamaya duser', () => {
      resetState();
      deste(2);
      withToday('2026-09-12', () => {
        const s = L().start('en');
        s.questions.forEach(q => expect(q.kind).toBe('recall'));
      });
    });

    it('celdiriciler AYNI desteden gelir', () => {
      resetState();
      deste(10);
      pushCard({ front:'olay', back:'1453', lang:ESP.HISTORY_DECK });
      withToday('2026-09-12', () => {
        const s = L().start('en', { kinds:['choice'] });
        const arkalar = ESP.S.cards.filter(c => c.lang === 'en').map(c => c.back);
        s.questions.forEach(q => q.options.forEach(o =>
          expect(arkalar.indexOf(o) >= 0).toBeTruthy()));
      });
    });

    /* Pratik ayri bir kayit ACMAZ: cevap dogrudan SRS'e yazilir. */
    it('dogru cevap SRS kutusunu ilerletir', async () => {
      resetState();
      deste(10);
      await withTodayAsync('2026-09-12', async () => {
        const s = L().start('en', { kinds:['recall'] });
        const q = s.questions[0];
        const once = ESP.S.cards.filter(c => c.id === q.cardId)[0].box;
        await L().answer(s, q.answer);
        const sonra = ESP.S.cards.filter(c => c.id === q.cardId)[0].box;
        expect(sonra > once).toBeTruthy();
      });
    });

    it('yanlis cevap karti basa dondurur', async () => {
      resetState();
      deste(10);
      await withTodayAsync('2026-09-12', async () => {
        const s = L().start('en', { kinds:['recall'] });
        const q = s.questions[0];
        ESP.S.cards.filter(c => c.id === q.cardId)[0].box = 4;
        await L().answer(s, 'kesinlikle yanlış');
        expect(ESP.S.cards.filter(c => c.id === q.cardId)[0].box).toBe(1);
      });
    });

    it('«bilmiyorum» bir atlama degildir: tekrar olarak islenir', async () => {
      resetState();
      deste(10);
      await withTodayAsync('2026-09-12', async () => {
        const s = L().start('en', { kinds:['recall'] });
        const res = await L().answer(s, '');
        expect(res.correct).toBeFalsy();
        expect(s.wrong).toBe(1);
      });
    });

    it('oturum bitince sonuc olculmus bir sayidir', async () => {
      resetState();
      deste(10);
      await withTodayAsync('2026-09-12', async () => {
        const s = L().start('en', { kinds:['recall'], length:3 });
        for(const q of s.questions.slice()) await L().answer(s, q.answer);
        expect(s.done).toBeTruthy();
        const r = L().result(s);
        expect(r.asked).toBe(3);
        expect(r.accuracy).toBe(1);
        expect(r.cert).toBe('measured');
      });
    });

    it('cevaplanmamis oturum gun kaydina yazilmaz', async () => {
      resetState();
      deste(10);
      await withTodayAsync('2026-09-12', async () => {
        const s = L().start('en');
        expect((await L().log(s)).ok).toBeFalsy();
      });
    });

    it('yazilan oturum dakika ve sayi uretir', async () => {
      resetState();
      deste(10);
      await withTodayAsync('2026-09-12', async () => {
        const s = L().start('en', { kinds:['recall'], length:4 });
        for(const q of s.questions.slice()) await L().answer(s, q.answer);
        await L().log(s, 12);
        expect(ESP.Model.minutesOf('2026-09-12', 'lang')).toBe(12);
      });
    });

    it('gercek sure verilince MEASURED, verilmeyince ESTIMATED yazilir', async () => {
      /* Sure verilmezse soru sayisindan (asked×0,5) bir TAHMIN uretilir.
         Once bu da 'measured' damgalaniyordu ve turetilmis sayi mufredat
         kademesine olculmus gibi giriyordu — dogrudan doktrin ihlali. */
      resetState();
      deste(10);
      await withTodayAsync('2026-09-12', async () => {
        const s1 = L().start('en', { kinds:['recall'], length:4 });
        for(const q of s1.questions.slice()) await L().answer(s1, q.answer);
        await L().log(s1, 12);
        const g1 = ESP.S.days['2026-09-12'].sessions[0];
        expect(g1.minutesCert).toBe('measured');

        resetState(); deste(10);
        const s2 = L().start('en', { kinds:['recall'], length:4 });
        for(const q of s2.questions.slice()) await L().answer(s2, q.answer);
        await L().log(s2);                    // sure VERILMEDI
        const g2 = ESP.S.days['2026-09-12'].sessions[0];
        expect(g2.minutesCert).toBe('estimated');
      });
    });

    it('vadesi gelen kart oturumda once gelir', () => {
      resetState();
      withToday('2026-09-12', () => {
        deste(20);
        const hedef = ESP.S.cards[7];
        hedef.due = '2026-09-01'; hedef.reps = 2; hedef.interval = 3;
        const s = L().start('en');
        expect(s.questions[0].cardId).toBe(hedef.id);
      });
    });
  });

  describe('ders · güven ve kalıcılık (brand/ortak/usta.js)', () => {
    const gecmis = (gun, grade, ek) => Object.assign({ at:gun + 'T09:00:00Z', grade }, ek || {});

    it('cevap güveni ve karışıklığı geçmişe yazar; işaretsiz güven boş kalır', async () => {
      resetState();
      for(let i = 0; i < 4; i++) pushCard({ front:'k' + i, back:'c' + i, lang:'en' });
      await withTodayAsync('2026-09-12', async () => {
        const s = L().start('en', { kinds:['recall'] });
        const ilk = s.questions.slice(0, 3);
        await L().answer(s, ilk[0].answer, 'emin');
        await L().answer(s, ilk[1].answer);
        await L().answer(s, ilk[2].answer, 'uydurma');
        const h = q => ESP.S.cards.find(c => c.id === q.cardId).history[0];
        expect(h(ilk[0]).guven).toBe('emin');
        expect(h(ilk[0]).karisik).toBe(true);
        expect(h(ilk[1]).guven).toBe(undefined);
        expect(h(ilk[2]).guven).toBe(undefined);
      });
    });
    it('ünite sınavı karışık sayılmaz', async () => {
      resetState();
      const c = pushCard({ front:'k', back:'c', lang:'en' });
      await withTodayAsync('2026-09-12', async () => {
        const s = L().start('en', { kartlar:[c], kinds:['recall'] });
        s.unitId = 'u1';
        await L().answer(s, 'c');
        expect(c.history[0].karisik).toBe(undefined);
      });
    });
    it('emin olup yanılınan kart oturumun başına geçer', () => {
      resetState();
      withToday('2026-09-12', () => {
        pushCard({ front:'once', back:'x', lang:'en', due:'2026-09-01' });
        const c = pushCard({ front:'kritik', back:'y', lang:'en', due:'2026-09-12' });
        c.history = [gecmis('2026-09-11', 'again', { guven:'emin' })];
        expect(L().start('en', { kinds:['recall'] }).questions[0].cardId).toBe(c.id);
      });
    });
    it('kalıcılık geçmişten okunur; sorulmamış kart ölçülmüş sayılmaz', () => {
      resetState();
      withToday('2026-09-12', () => {
        pushCard({ front:'yeni', back:'x', lang:'en' });
        const a = pushCard({ front:'a', back:'x', lang:'en' });
        a.history = [gecmis('2026-08-01', 'good'), gecmis('2026-08-10', 'hard')];
        const b = pushCard({ front:'b', back:'y', lang:'en' });
        b.history = [gecmis('2026-09-11', 'again', { guven:'emin' })];
        const k = L().kalicilik('en');
        expect(k.harita.toplam).toBe(3);
        expect(k.harita.olculen).toBe(2);
        expect(k.harita.sayi.kalici).toBe(1);
        expect(k.kritik[0].id).toBe(b.id);
        expect(k.guven.emin.oran).toBe(null);
      });
    });
    it('güven işareti görünür; yazılan cevap yeniden çizimde silinmez', () => {
      resetState();
      pushCard({ front:'k', back:'c', lang:'en' });
      withToday('2026-09-12', () => {
        ESP.S.ui.practice = L().start('en', { kinds:['recall'] });
        ESP.S.ui.practiceGuven = 'emin';
        ESP.S.ui.practiceYazi = 'yazdim';
        const d = document.createElement('div');
        d.innerHTML = String(ESP.Parts.practice('en'));
        expect(d.querySelector('[data-act="prac-guven"][data-value="emin"]').getAttribute('aria-pressed')).toBe('true');
        expect(d.querySelector('#prac-input').value).toBe('yazdim');
        ESP.S.ui.practice = ESP.S.ui.practiceGuven = ESP.S.ui.practiceYazi = null;
      });
    });
  });

  describe('ders · tarih pratigi', () => {

    function tarihDestesi(){
      [['Malazgirt', '1071'], ['Fetih', '1453'], ['Matbaa', '1455'],
       ['Devrim', '1789'], ['Cumhuriyet', '1923'], ['Duvar', '1989']]
        .forEach(x => pushCard({ front:x[0], back:x[1], lang:ESP.HISTORY_DECK }));
    }

    it('donem sorusu dogru donemi bekler', () => {
      resetState();
      tarihDestesi();
      withToday('2026-09-12', () => {
        const s = L().start(ESP.HISTORY_DECK, { kinds:['era'] });
        const q = s.questions.filter(x => x.kind === 'era')[0];
        expect(q != null).toBeTruthy();
        expect(ESP.ERAS.some(e => e.label === q.answer)).toBeTruthy();
      });
    });

    it('siralama sorusu eskiden yeniye bekler', () => {
      resetState();
      tarihDestesi();
      withToday('2026-09-12', () => {
        const s = L().start(ESP.HISTORY_DECK, { kinds:['order'] });
        const q = s.questions.filter(x => x.kind === 'order')[0];
        expect(q != null).toBeTruthy();
        expect(q.answer.split(' | ').length).toBe(4);
      });
    });

    it('dil destesinde tarih sorusu uretilmez', () => {
      resetState();
      for(let i = 0; i < 8; i++) pushCard({ front:'k' + i, back:'b' + i, lang:'en' });
      withToday('2026-09-12', () => {
        const s = L().start('en', { kinds:['order', 'era'] });
        s.questions.forEach(q => expect(['order', 'era'].indexOf(q.kind)).toBe(-1));
      });
    });

    it('tarih pratigi tarih disiplinine yazilir', async () => {
      resetState();
      tarihDestesi();
      await withTodayAsync('2026-09-12', async () => {
        const s = L().start(ESP.HISTORY_DECK, { kinds:['recall'], length:2 });
        for(const q of s.questions.slice()) await L().answer(s, q.answer);
        await L().log(s, 8);
        expect(ESP.Model.minutesOf('2026-09-12', 'history')).toBe(8);
      });
    });
  });

  describe('ders · ünite sonu mini sınavı (fikir 41)', () => {
    it('ünitenin destede en az dört kartı yoksa sınav açılmaz', async () => {
      resetState();
      const u = L().unitOf('lang', 'temel-fiil');
      pushCard({ front:'to be', back:'olmak', lang:'en' });
      const s = L().uniteSinavi(u, 'en');
      expect(s.ok).toBeFalsy();
      expect(s.error).toContain('en az 4');
    });

    it('sorular YALNIZ o ünitenin kartlarından gelir; bitince sonuç ünitede ölçüm olarak durur', async () => {
      await withTodayAsync('2026-09-20', async () => {
        resetState();
        const u = L().unitOf('lang', 'temel-fiil');
        await L().addUnit(u, 'en');
        pushCard({ front:'apple', back:'elma', lang:'en' });   // ünite dışı
        const s = L().uniteSinavi(u, 'en');
        expect(s.ok).toBeTruthy();
        expect(s.unitId).toBe('temel-fiil');
        const unite = L().cardsOf(u, 'en').map(c => c.id);
        s.questions.forEach(q => expect(unite.indexOf(q.cardId) >= 0).toBeTruthy());
        expect(L().sonSinav('temel-fiil')).toBeNull();
        while(!s.done){
          const q = s.questions[s.pos];
          await L().answer(s, s.pos === 0 ? 'yanlış' : q.answer);
        }
        const son = L().sonSinav('temel-fiil');
        expect([son.dogru, son.soru, son.gun, son.cert]).toEqual([s.questions.length - 1, s.questions.length, '2026-09-20', 'measured']);
        /* sınav cevabı da SRS'e yazılır: ayrı hafıza kaydı açılmaz */
        expect(ESP.S.cards.filter(c => (c.history || []).length > 0).length).toBe(s.questions.length);
      });
    });
  });
})();
