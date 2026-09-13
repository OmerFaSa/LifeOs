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
})();
