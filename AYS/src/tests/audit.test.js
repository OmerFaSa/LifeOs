/* Bakım borcu denetimi — beş alanda biriken bozukluk. */

(function(){
  const { describe, it, expect, resetState, withToday, makeExam } = R.Test;
  const A = () => R.Audit;
  const S = R.S, U = R.U;

  function bulgu(alan, id){ return A().of(alan).filter(f => f.id === id)[0]; }

  function deneme(tarih, opts){
    const e = makeExam(Object.assign({ date:tarih }, opts || {}));
    S.exams.push(e);
    return e;
  }
  function kart(patch){
    const c = Object.assign({ id:U.uid('c'), front:'ön', back:'arka',
      stage:1, history:[] }, patch || {});
    S.cards.push(c);
    return c;
  }
  function hata(patch){
    const e = Object.assign({ id:U.uid('er'), createdAt:U.todayISO() + 'T10:00:00.000Z' },
      patch || {});
    S.errors.push(e);
    return e;
  }
  function konu(sid, tid, patch){
    S.topics[sid] = S.topics[sid] || { subjectId:sid, states:{} };
    S.topics[sid].states[tid] = Object.assign({ state:'not_started' }, patch || {});
  }

  describe('denetim · veri esigi', () => {

    /* Olculmemis bir gecmis "temiz" degildir. */
    it('az veride bulgu degil "olculmedi" doner', () => {
      resetState();
      const f = A().of('exams');
      expect(f.length).toBe(1);
      expect(f[0].cert).toBe('missing');
      expect(f[0].severity).toBe('none');
    });

    it('bilinmeyen alanda bulgu yok', () => {
      resetState();
      expect(A().of('astroloji').length).toBe(0);
    });
  });

  describe('denetim · deneme', () => {

    /* Analiz edilmeyen deneme bir olcum degil bir yorgunluktur. */
    it('analiz borcu isaretlenir', () => {
      resetState();
      withToday('2026-04-10', () => {
        deneme('2026-04-01', { analysisCompletedAt:null });
        deneme('2026-04-03', { analysisCompletedAt:null });
        deneme('2026-04-05', { analysisCompletedAt:null });
        const f = bulgu('exams', 'exam-debt');
        expect(!!f).toBeTruthy();
        expect(f.items.length).toBe(3);
      });
    });

    it('analizi biten deneme borca girmez', () => {
      resetState();
      withToday('2026-04-10', () => {
        deneme('2026-04-01', { analysisCompletedAt:'2026-04-02T10:00:00.000Z' });
        deneme('2026-04-03', { analysisCompletedAt:'2026-04-04T10:00:00.000Z' });
        deneme('2026-04-05', { analysisCompletedAt:'2026-04-06T10:00:00.000Z' });
        expect(bulgu('exams', 'exam-debt')).toBeFalsy();
      });
    });

    /* Medyan AYNI zorluk ailesinden denemeler ister. */
    it('karisik yayin medyani uyarir', () => {
      resetState();
      withToday('2026-04-10', () => {
        ['345', 'Endemik', 'Bilgi Sarmal', 'Orijinal', '3D']
          .forEach((y, i) => deneme('2026-03-0' + (i + 1),
            { publisher:y, analysisCompletedAt:'x' }));
        const f = bulgu('exams', 'exam-mixed-TYT');
        expect(!!f).toBeTruthy();
      });
    });

    it('tek yayindan denemede uyari cikmaz', () => {
      resetState();
      withToday('2026-04-10', () => {
        for(let i = 1; i <= 5; i++){
          deneme('2026-03-0' + i, { publisher:'345', analysisCompletedAt:'x' });
        }
        expect(bulgu('exams', 'exam-mixed-TYT')).toBeFalsy();
      });
    });

    it('yayin hic yazilmamissa ayri uyari cikar', () => {
      resetState();
      withToday('2026-04-10', () => {
        for(let i = 1; i <= 5; i++){
          const e = deneme('2026-03-0' + i, { analysisCompletedAt:'x' });
          e.publisher = '';
        }
        expect(!!bulgu('exams', 'exam-no-publisher-TYT')).toBeTruthy();
      });
    });
  });

  describe('denetim · konular', () => {

    /* Kapanis kurali yedi gun sonra IKINCI bir olcum ister. */
    it('ikinci testi bekleyen konu isaretlenir', () => {
      resetState();
      withToday('2026-04-10', () => {
        konu('tyt-turkce', 'sozcukte-anlam',
          { state:'provisional', first:80, firstAt:'2026-03-10' });
        konu('tyt-turkce', 'cumlede-anlam',
          { state:'provisional', first:78, firstAt:'2026-03-12' });
        konu('tyt-turkce', 'paragraf', { state:'closed', first:90, second:85 });
        const f = bulgu('topics', 'topic-pending-second');
        expect(!!f).toBeTruthy();
        expect(f.items.length).toBe(2);
      });
    });

    it('yeni yapilmis ilk test hemen uyari uretmez', () => {
      resetState();
      withToday('2026-04-10', () => {
        konu('tyt-turkce', 'a', { state:'provisional', first:80, firstAt:'2026-04-08' });
        konu('tyt-turkce', 'b', { state:'closed', first:90, second:85 });
        konu('tyt-turkce', 'c', { state:'closed', first:90, second:85 });
        expect(bulgu('topics', 'topic-pending-second')).toBeFalsy();
      });
    });

    /* Yeniden acilan konu, yeni konudan ONCE gelir. */
    it('yeniden acilan konular ayri bulgudur', () => {
      resetState();
      withToday('2026-04-10', () => {
        konu('tyt-mat', 'a', { state:'reopened' });
        konu('tyt-mat', 'b', { state:'closed' });
        konu('tyt-mat', 'c', { state:'closed' });
        const f = bulgu('topics', 'topic-reopened');
        expect(!!f).toBeTruthy();
        expect(f.note.indexOf('ÖNCE') > 0).toBeTruthy();
      });
    });

    it('esigin hemen altinda kalmis konu en ucuz kazanc sayilir', () => {
      resetState();
      withToday('2026-04-10', () => {
        konu('tyt-mat', 'a', { state:'practicing', first:70, firstAt:'2026-03-01' });
        konu('tyt-mat', 'b', { state:'closed' });
        konu('tyt-mat', 'c', { state:'closed' });
        const f = bulgu('topics', 'topic-near-miss');
        expect(!!f).toBeTruthy();
      });
    });
  });

  describe('denetim · tekrar', () => {

    it('sulk kartlar isaretlenir ve sebep kartta aranir', () => {
      resetState();
      kart({ history:[{ result:'forgot' }, { result:'forgot' },
        { result:'forgot' }, { result:'forgot' }] });
      kart(); kart();
      const f = bulgu('cards', 'card-leech');
      expect(!!f).toBeTruthy();
      expect(f.note.indexOf('KARTIN') > 0).toBeTruthy();
    });

    it('arka yuzu bos kart bulunur', () => {
      resetState();
      kart({ back:'' });
      kart({ front:'aynı', back:'aynı' });
      kart();
      const f = bulgu('cards', 'card-broken');
      expect(!!f).toBeTruthy();
      expect(f.items.length).toBe(2);
    });
  });

  describe('denetim · yanlis defteri', () => {

    it('bir haftadir acik yanlislar isaretlenir', () => {
      resetState();
      withToday('2026-04-10', () => {
        for(let i = 0; i < 6; i++){
          hata({ createdAt:'2026-03-20T10:00:00.000Z', tag:'K' });
        }
        const f = bulgu('errors', 'error-open');
        expect(!!f).toBeTruthy();
      });
    });

    it('kapatilmis yanlislar sayilmaz', () => {
      resetState();
      withToday('2026-04-10', () => {
        for(let i = 0; i < 6; i++){
          hata({ createdAt:'2026-03-20T10:00:00.000Z', tag:'K',
            closedAt:'2026-03-21T10:00:00.000Z' });
        }
        expect(bulgu('errors', 'error-open')).toBeFalsy();
      });
    });

    it('etiketsiz yanlis hicbir receteye baglanmaz', () => {
      resetState();
      hata({}); hata({}); hata({});
      const f = bulgu('errors', 'error-untagged');
      expect(!!f).toBeTruthy();
    });

    /* Baskin etiket IYI haberdir: tek recete listenin cogunu kapatir. */
    it('baskin etiket recetesiyle birlikte gosterilir', () => {
      resetState();
      for(let i = 0; i < 6; i++) hata({ tag:'K' });
      for(let i = 0; i < 2; i++) hata({ tag:'S' });
      const f = bulgu('errors', 'error-dominant');
      expect(!!f).toBeTruthy();
      expect(f.note.indexOf(R.ERROR_TAGS.K.recipe) > 0).toBeTruthy();
    });
  });

  describe('denetim · plan', () => {

    function gun(tarih, bloklar, patch){
      S.days[tarih] = Object.assign({ date:tarih, blocks:bloklar || [],
        sleepHours:null }, patch || {});
    }

    /* Ayni saatte tekrarlayan bosluk PLAN hatasidir, irade hatasi degil. */
    it('surekli atlanan zaman dilimi isaretlenir', () => {
      resetState();
      withToday('2026-04-14', () => {
        for(let i = 0; i < 10; i++){
          const t = U.iso(U.addDays(U.parse('2026-04-14'), -i));
          gun(t, [
            { slot:'Sabah', status:'done', actualMin:60 },
            { slot:'Gece', status:'skipped', actualMin:null },
          ]);
        }
        const f = bulgu('plan', 'plan-dead-slot');
        expect(!!f).toBeTruthy();
        expect(f.items[0].label).toBe('Gece');
        expect(f.note.indexOf('irade hatası değil') > 0).toBeTruthy();
      });
    });

    it('gerceklesen sure girilmiyorsa soylenir', () => {
      resetState();
      withToday('2026-04-14', () => {
        for(let i = 0; i < 10; i++){
          const t = U.iso(U.addDays(U.parse('2026-04-14'), -i));
          gun(t, [{ slot:'Sabah', status:'done', actualMin:null }]);
        }
        const f = bulgu('plan', 'plan-no-minutes');
        expect(!!f).toBeTruthy();
        /* Hicbir sey sifir sayilmaz. */
        expect(f.note.indexOf('sıfır sayılmaz') > 0).toBeTruthy();
      });
    });

    it('uyku girilmiyorsa kendi verinle olculecegi soylenir', () => {
      resetState();
      withToday('2026-04-14', () => {
        for(let i = 0; i < 10; i++){
          const t = U.iso(U.addDays(U.parse('2026-04-14'), -i));
          gun(t, [{ slot:'Sabah', status:'done', actualMin:60 }]);
        }
        const f = bulgu('plan', 'plan-no-sleep');
        expect(!!f).toBeTruthy();
        expect(f.note.indexOf('SENDE') > 0).toBeTruthy();
      });
    });
  });

  describe('denetim · toplama', () => {

    it('ciddi bulgular once siralanir', () => {
      resetState();
      withToday('2026-04-10', () => {
        deneme('2026-04-01', { analysisCompletedAt:null });
        deneme('2026-04-03', { analysisCompletedAt:null });
        deneme('2026-04-05', { analysisCompletedAt:null });
        const hepsi = A().all();
        expect(hepsi[0].severity).toBe('warn');
      });
    });

    /* Bulgu SUCLAMAZ. */
    it('hicbir bulgu kisiyi suclamaz', () => {
      resetState();
      withToday('2026-04-10', () => {
        deneme('2026-04-01', { analysisCompletedAt:null });
        deneme('2026-04-03', { analysisCompletedAt:null });
        deneme('2026-04-05', { analysisCompletedAt:null });
        kart({ back:'' }); kart(); kart();
        hata({}); hata({}); hata({});
        A().all().forEach(f => {
          expect(/tembel|dağınık|başarısız|beceriksiz|disiplinsiz/i.test(f.note)).toBeFalsy();
        });
      });
    });

    it('sayac yalnizca ciddi bulgulari sayar', () => {
      resetState();
      expect(A().count()).toBe(0);
    });
  });
})();
