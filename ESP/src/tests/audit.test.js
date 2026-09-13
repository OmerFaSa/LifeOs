/* Bölüm denetimi — birikmiş bakım borcu. */

(function(){
  const { describe, it, expect, resetState, withToday, pushCard, pushNote,
    pushBook, pushPiece, pushArgument } = ESP.Test;
  const A = () => ESP.Audit;
  const S = ESP.S, U = ESP.U;

  function bulgu(disc, id){ return A().of(disc).filter(f => f.id === id)[0]; }

  describe('denetim · veri esigi', () => {

    /* Olculmemis bir deste "temiz" degildir, yalnizca olculmemistir. */
    it('az veride bulgu degil "veri yok" doner', () => {
      resetState();
      const f = A().of('lang');
      expect(f.length).toBe(1);
      expect(f[0].cert).toBe('missing');
      expect(f[0].severity).toBe('none');
    });

    it('bilinmeyen disiplinde bulgu yok', () => {
      resetState();
      expect(A().of('astroloji').length).toBe(0);
    });
  });

  describe('denetim · dil', () => {

    function deste(n, patch){
      for(let i = 0; i < n; i++) pushCard(Object.assign({ front:'ön' + i, back:'arka' + i }, patch || {}));
    }

    it('sulk kartlar isaretlenir ve sebebi kartta aranir', () => {
      resetState();
      deste(6);
      S.cards[0].lapses = 5;
      S.cards[1].lapses = 4;
      const f = bulgu('lang', 'lang-leech');
      expect(!!f).toBeTruthy();
      expect(f.items.length).toBe(2);
      /* Hafizayi degil KARTI suclamali. */
      expect(f.note.indexOf('KARTIN') > 0).toBeTruthy();
    });

    it('esik altindaki unutma sulk sayilmaz', () => {
      resetState();
      deste(6);
      S.cards[0].lapses = 3;
      expect(bulgu('lang', 'lang-leech')).toBeFalsy();
    });

    it('arka yuzu bos ya da on yuzle ayni kartlar bulunur', () => {
      resetState();
      deste(6);
      S.cards[0].back = '';
      S.cards[1].back = S.cards[1].front;
      const f = bulgu('lang', 'lang-broken');
      expect(!!f).toBeTruthy();
      expect(f.items.length).toBe(2);
    });

    /* Bir gunde biriken kuyruk cogu zaman hic calisilmaz. */
    it('tekrar zirvesi onceden gorunur', () => {
      resetState();
      withToday('2026-04-10', () => {
        for(let i = 0; i < 40; i++) pushCard({ front:'a' + i, back:'b' + i, due:'2026-04-15' });
        for(let i = 0; i < 6; i++) pushCard({ front:'c' + i, back:'d' + i, due:'2026-04-20' });
        const f = bulgu('lang', 'lang-spike');
        expect(!!f).toBeTruthy();
        expect(f.items[0].meta.indexOf('40') >= 0).toBeTruthy();
      });
    });

    it('duz dagilimda zirve uyarisi cikmaz', () => {
      resetState();
      withToday('2026-04-10', () => {
        for(let i = 0; i < 14; i++){
          for(let j = 0; j < 5; j++){
            pushCard({ front:'a' + i + j, back:'b',
              due:U.iso(U.addDays(U.parse('2026-04-10'), i)) });
          }
        }
        expect(bulgu('lang', 'lang-spike')).toBeFalsy();
      });
    });

    it('tekrar kuyrugu tahmini gunleri siraliyor', () => {
      resetState();
      withToday('2026-04-10', () => {
        const t = A().dueForecast(7);
        expect(t.length).toBe(7);
        expect(t[0].date).toBe('2026-04-10');
        expect(t[6].date).toBe('2026-04-16');
      });
    });
  });

  describe('denetim · felsefe', () => {

    it('itirazsiz arguman isaretlenir', () => {
      resetState();
      pushArgument('t1');
      pushArgument('t2', ['karşı görüş']);
      pushArgument('t3');
      const f = bulgu('philo', 'philo-no-objection');
      expect(!!f).toBeTruthy();
      expect(f.items.length).toBe(2);
    });

    it('kapali arguman itiraz denetimine girmez', () => {
      resetState();
      pushArgument('t1'); pushArgument('t2'); pushArgument('t3');
      S.args.forEach(a => { a.status = 'closed'; });
      expect(bulgu('philo', 'philo-no-objection')).toBeFalsy();
    });
  });

  describe('denetim · okuma', () => {

    it('iki haftadir bagsiz notlar yetim sayilir', () => {
      resetState();
      withToday('2026-04-10', () => {
        for(let i = 0; i < 5; i++){
          const n = pushNote('not' + i);
          n.createdAt = '2026-03-01T10:00:00.000Z';
        }
        const f = bulgu('reading', 'reading-orphan');
        expect(!!f).toBeTruthy();
        expect(f.note.indexOf('ağdır') > 0).toBeTruthy();
      });
    });

    it('yeni notlar yetim sayilmaz', () => {
      resetState();
      withToday('2026-04-10', () => {
        for(let i = 0; i < 5; i++){
          const n = pushNote('not' + i);
          n.createdAt = '2026-04-09T10:00:00.000Z';
        }
        expect(bulgu('reading', 'reading-orphan')).toBeFalsy();
      });
    });

    it('tek kavram notlarin yarisindan fazlasini kaplarsa uyarir', () => {
      resetState();
      withToday('2026-04-10', () => {
        const kur = (t, c) => {
          const n = pushNote(t, null, [c]);
          n.links = [{ to:'x', why:'' }];
          n.createdAt = '2026-04-09T10:00:00.000Z';
        };
        for(let i = 0; i < 8; i++) kur('n' + i, 'özgürlük');
        kur('n9', 'adalet');
        kur('n10', 'erdem');
        const f = bulgu('reading', 'reading-monopoly');
        expect(!!f).toBeTruthy();
      });
    });
  });

  describe('denetim · yazi', () => {

    it('hic elden gecmemis uzun taslak isaretlenir', () => {
      resetState();
      const uzun = 'kelime '.repeat(60);
      S.drafts.push({ id:'d1', title:'A', text:uzun, revisions:0,
        createdAt:'2026-04-01T10:00:00.000Z', updatedAt:'2026-04-01T10:00:00.000Z' });
      S.drafts.push({ id:'d2', title:'B', text:uzun, revisions:2,
        createdAt:'2026-04-01T10:00:00.000Z', updatedAt:'2026-04-01T10:00:00.000Z' });
      const f = bulgu('writing', 'writing-unrevised');
      expect(!!f).toBeTruthy();
      expect(f.items.length).toBe(1);
    });

    /* Islevsel kelimeler elenir: "ve" yuz kez gecebilir. */
    it('tekrar dedektoru islevsel kelimeleri saymaz', () => {
      const metin = ('ve ' .repeat(200)) + 'kelime '.repeat(100);
      const r = A().repeatedWords(metin);
      expect(r.filter(x => x.word === 've').length).toBe(0);
      expect(r.filter(x => x.word === 'kelime').length).toBe(1);
    });

    it('kisa metinde tekrar aranmaz', () => {
      expect(A().repeatedWords('kelime kelime kelime').length).toBe(0);
    });
  });

  describe('denetim · muzik', () => {

    it('hedef temposu olmayan parcalar isaretlenir', () => {
      resetState();
      pushPiece('P1', { targetBpm:null,
        attempts:[{ date:'2026-04-01', bpm:80, clean:true },
          { date:'2026-04-02', bpm:80, clean:true },
          { date:'2026-04-03', bpm:84, clean:false }] });
      pushPiece('P2', { targetBpm:120, attempts:[] });
      const f = bulgu('music', 'music-no-target');
      expect(!!f).toBeTruthy();
      expect(f.items.length).toBe(1);
    });

    it('bir aydir denenmemis parca isaretlenir', () => {
      resetState();
      withToday('2026-05-20', () => {
        pushPiece('Eski', { attempts:[{ date:'2026-03-01', bpm:80, clean:true }] });
        pushPiece('Yeni', { attempts:[{ date:'2026-05-19', bpm:80, clean:true }] });
        const f = bulgu('music', 'music-abandoned');
        expect(!!f).toBeTruthy();
        expect(f.items.length).toBe(1);
      });
    });
  });

  describe('denetim · toplama', () => {

    it('kapali bolumun bulgusu toplanmaz', async () => {
      resetState();
      for(let i = 0; i < 6; i++) pushCard({ front:'a' + i, back:'b' + i });
      S.cards[0].lapses = 5;
      expect(A().all().filter(f => f.disc === 'lang').length > 0).toBeTruthy();
      await ESP.Mod.set('lang', false);
      ESP.Memo.bitir();
      expect(A().all().filter(f => f.disc === 'lang').length).toBe(0);
    });

    /* DIKKAT — bu test bilerek KARISIK siddette bulgu uretir.

       Once yalnizca 'lang' bulgulariyla yaziliydi ve hepsi 'warn'
       oldugu icin siralamayi hic sinamiyordu. O halde bir hatayi
       kacirdi: siralama tablosunda warn degeri SIFIR ve `0 || 9`
       dokuz doner — butun uyarilar listenin SONUNA dusuyordu. */
    it('ciddi bulgular once siralanir', () => {
      resetState();
      /* lang: uyari uretir (sulk + bozuk kart) */
      for(let i = 0; i < 6; i++) pushCard({ front:'a' + i, back:'b' + i });
      S.cards[0].lapses = 5;
      S.cards[1].back = '';
      /* felsefe, okuma, yazi: veri esigi altinda → 'none' uretir */
      ESP.Memo.bitir();
      const hepsi = A().all();
      expect(hepsi.length > 3).toBeTruthy();
      expect(hepsi[0].severity).toBe('warn');
      /* 'none' olanlarin hicbiri bir 'warn'dan once gelmemeli. */
      let ilkNone = hepsi.findIndex(f => f.severity === 'none');
      let sonWarn = -1;
      hepsi.forEach((f, i) => { if(f.severity === 'warn') sonWarn = i; });
      if(ilkNone >= 0) expect(sonWarn < ilkNone).toBeTruthy();
    });

    /* Bulgu SUCLAMAZ. */
    it('hicbir bulgu kisiyi suclamaz', () => {
      resetState();
      for(let i = 0; i < 6; i++) pushCard({ front:'a' + i, back:'b' + i });
      S.cards[0].lapses = 5;
      A().all().forEach(f => {
        expect(/tembel|dağınık|başarısız|beceriksiz/i.test(f.note)).toBeFalsy();
      });
    });
  });
})();
