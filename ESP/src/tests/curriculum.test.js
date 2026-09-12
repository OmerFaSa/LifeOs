/* Mufredat motoru — merdivenin kendisi kadar onemli olan kural:
   olculemeyen kapi ne gecilmis ne kalinmis sayilir. */

(function(){
  const { describe, it, expect, resetState, withToday,
    pushCard, pushSession, pushNote, pushBook, pushPiece } = ESP.Test;
  const C = () => ESP.Curriculum;

  describe('mufredat · veri butunlugu', () => {

    it('merdivendeki her metrik adinin bir olcusu vardir', () => {
      resetState();
      const bilinen = C().metricNames();
      const eksik = [];
      Object.keys(ESP.LADDERS).forEach(disc => {
        ESP.LADDERS[disc].levels.forEach(step => {
          step.gates.forEach(g => {
            if(bilinen.indexOf(g.metric) < 0) eksik.push(disc + ':' + g.metric);
          });
        });
      });
      expect(eksik.join(',')).toBe('');
    });

    it('her disiplinin bir merdiveni vardir', () => {
      const eksik = ESP.DISCIPLINES.filter(d => !ESP.LADDERS[d.id]).map(d => d.id);
      expect(eksik.join(',')).toBe('');
    });

    it('her merdivende bes kademe ve her kademede en az bir kapi vardir', () => {
      Object.keys(ESP.LADDERS).forEach(id => {
        const l = ESP.LADDERS[id];
        expect(l.levels.length).toBe(5);
        l.levels.forEach(s => expect(s.gates.length > 0).toBeTruthy());
      });
    });

    it('bilinmeyen metrik sessizce sifir dondurmez', () => {
      resetState();
      const o = C().measure('yok.boyle.bir.sey');
      expect(o.value).toBeNull();
      expect(o.unknown).toBeTruthy();
    });
  });

  describe('mufredat · kapi durumlari', () => {

    it('olculmemis kapi ne gecti ne kaldi: bilinmiyor', () => {
      resetState();
      const g = C().gateStatus({ metric:'lang.retention', min:0.7, label:'x' });
      expect(g.status).toBe('unknown');
    });

    it('bos deste sifir karttir: bu bir olcumdur', () => {
      resetState();
      const g = C().gateStatus({ metric:'lang.cards', min:100, label:'x' });
      expect(g.status).toBe('fail');
      expect(g.value).toBe(0);
    });

    it('esik gecilince kapi acilir', () => {
      resetState();
      for(let i = 0; i < 120; i++) pushCard({ front:'a' + i, back:'b' });
      const g = C().gateStatus({ metric:'lang.cards', min:100, label:'x' });
      expect(g.status).toBe('pass');
    });

    it('ust sinirli kapi ustune cikinca kapanir', () => {
      resetState();
      pushSource1();
      function pushSource1(){}
      const g = C().gateStatus({ metric:'lang.cards', max:10, label:'x' });
      expect(g.status).toBe('pass');        // 0 kart, ust sinirin altinda
      for(let i = 0; i < 20; i++) pushCard({ front:'a' + i, back:'b' });
      expect(C().gateStatus({ metric:'lang.cards', max:10, label:'x' }).status).toBe('fail');
    });
  });

  describe('mufredat · kademe', () => {

    it('hicbir sey olculmemisse kademe sifirdir ve etiketi «veri yok»', () => {
      resetState();
      const lv = C().levelOf('lang');
      expect(lv.rank).toBe(0);
      expect(lv.cert).toBe('missing');
    });

    it('birinci kademe kapilari gecilince kademe 1 olur', () => {
      resetState();
      withToday('2026-09-12', () => {
        for(let i = 0; i < 150; i++) pushCard({ front:'a' + i, back:'b' });
        ['2026-09-12', '2026-09-11', '2026-09-10', '2026-09-09', '2026-09-08']
          .forEach(d => pushSession(d, 'lang', 30));
        const lv = C().levelOf('lang');
        expect(lv.rank).toBe(1);
      });
    });

    /* Merdiven ardisiktir: ikinci kademenin kapilari gecilse de birinci
       kademe eksikse kademe 1'e cikmaz. Bu, sistemin en kolay bozulacak
       kuralidir — atlanan kapi sonra cokme uretir. */
    it('alttaki kapi atlanarak usttekine gecilmez', () => {
      resetState();
      withToday('2026-09-12', () => {
        for(let i = 0; i < 500; i++) pushCard({ front:'a' + i, back:'b' });
        /* 500 kart 2. kademenin kart kapisini gecer ama 1. kademedeki
           "son 14 gunun 5'inde calisildi" kapisi acilmadi. */
        const lv = C().levelOf('lang');
        expect(lv.rank).toBe(0);
      });
    });

    it('siradaki kapi olculemiyorsa istenen sey olcmektir', () => {
      resetState();
      withToday('2026-09-12', () => {
        for(let i = 0; i < 500; i++) pushCard({ front:'a' + i, back:'b' });
        ['2026-09-12', '2026-09-11', '2026-09-10', '2026-09-09', '2026-09-08']
          .forEach(d => pushSession(d, 'lang', 60));
        const g = C().nextGate('lang');
        expect(g.action).toBe('measure');   // retansiyon icin cevaplanmis kart yok
      });
    });

    it('kademe cumlesi kisiye degil uretime verilir', () => {
      resetState();
      withToday('2026-09-12', () => {
        for(let i = 0; i < 150; i++) pushCard({ front:'a' + i, back:'b' });
        ['2026-09-12', '2026-09-11', '2026-09-10', '2026-09-09', '2026-09-08']
          .forEach(d => pushSession(d, 'lang', 30));
        const c = C().sentence('lang');
        expect(c.indexOf('üretimi') > 0).toBeTruthy();
        expect(c.indexOf('sınav sonucu değildir') > 0).toBeTruthy();
      });
    });
  });

  describe('mufredat · genel kademe', () => {

    it('tek disiplinde ilerlemek genel kademeyi ustat yapmaz', () => {
      resetState();
      withToday('2026-09-12', () => {
        for(let i = 0; i < 5000; i++) pushCard({ front:'a' + i, back:'b' });
        const ov = C().overall();
        expect(ov.rank).toBe(0);
      });
    });

    it('merdiven yuzdesi bilinmeyen kapiyi ilerleme saymaz', () => {
      resetState();
      const lv = C().levelOf('music');
      expect(lv.mastery).toBe(0);
    });
  });

  describe('mufredat · seviye tespiti', () => {

    it('tespit bir kademe vermez, tahmin uretir', () => {
      resetState();
      const p = C().placement({ years:4, output:4, teach:3 });
      expect(p.cert).toBe('estimated');
      expect(p.rank > 0).toBeTruthy();
      /* Tahmin olculmus kademeyi degistirmez. */
      expect(C().levelOf('lang').rank).toBe(0);
    });

    it('cevapsiz sinav sifirinci kademeyi tahmin eder', () => {
      resetState();
      expect(C().placement({}).rank).toBe(0);
    });
  });

  describe('mufredat · tarih merdiveni', () => {

    it('tarih kartlari dil kapisini acmaz', () => {
      resetState();
      for(let i = 0; i < 200; i++){
        pushCard({ front:'olay' + i, back:'1071', lang:ESP.HISTORY_DECK });
      }
      expect(C().measure('lang.cards').value).toBe(0);
      expect(C().measure('history.events').value).toBe(0);
    });
  });
})();
