/* Onaylar — gelen kutusunda sürtünme (2026-10-25; kullanıcı: «spi için
   daha işlevli veri girişi, sürtünmeyi azaltacak teknikler ile daha güzel yap»).

   Kanıtladığı sözler: Kısayollar'dan gelen küçük ölçümler, yazılacakları
   önceden GÖRÜNEN tek bir «Hepsini kaydet (N)» dokunuşuyla yazılır ve tek
   «Geri al» bütün grubu geri alır; tahlil (orta) toplanmaz, tek tek kalır;
   tek onayın bildiriminde de «Geri al» vardır; Bugün'ün öneri alanı en çok
   bir kart taşır ve 14 düğme bütçesini aşmaz; sürtünme ipucu bekleyen
   öneriler için Onaylar'a götürür. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = SP.Test;
  const GUN = '2026-03-02';
  const saat = (h, m) => new Date(2026, 2, 2, h, m).getTime();

  /* Bildirim ve çizim sahte: dönen «Geri al» işlevini test kendisi çağırır. */
  async function sessiz(fn){
    const UI = SP.UI, App = SP.App;
    const eski = { toast:UI.toast, muhur:UI.onayMuhru, render:App.render };
    const toastlar = [];
    UI.toast = (metin, o) => { toastlar.push({ metin, undo:o && o.undo }); };
    UI.onayMuhru = () => {};
    App.render = () => {};
    try{ return await fn(toastlar); }
    finally{ UI.toast = eski.toast; UI.onayMuhru = eski.muhur; App.render = eski.render; }
  }
  function temizle(){
    SP.S.ui.kingTeklifler = []; SP.S.ui.hkmIntents = []; SP.S.ui.hkmDoubts = [];
  }
  async function gelen(id, metin, zaman){
    return SP.Proposals.disaridan({ id, metin, kaynak:'iPhone Kısayollar', zaman:zaman || saat(8, id) });
  }
  function dom(h){ const d = document.createElement('div'); d.innerHTML = String(h); return d; }
  const toplu = d => d.querySelector('[data-act="hkm-toplu"][data-kaynak="gelen"]');

  describe('Onaylar — gelen kutusu toplu kayıt', () => {
    it('iki ve fazla küçük ölçümde görünür liste + «Hepsini kaydet (N)»; tek satırda yok', async () => {
      resetState(); temizle();
      await withTodayAsync(GUN, async () => {
        await gelen(1, 'su 250');
        let d = dom(await SP.Screens.onaylar.render());
        expect(toplu(d)).toBe(null);
        await gelen(2, 'kilo 72,4');
        await gelen(3, 'su 500', new Date(2026, 2, 1, 23, 50).getTime());
        d = dom(await SP.Screens.onaylar.render());
        const b = toplu(d);
        expect(!!b).toBe(true);
        expect(b.textContent).toContain('Hepsini kaydet (3)');
        /* Dokunuştan önce ne yazılacağı satır satır görünür; dünkü satır gününü söyler. */
        const satir = b.closest('.onay-satir');
        expect(satir.textContent).toContain('Su +250 ml · toplam 250 ml');
        expect(satir.textContent).toContain('72,4');
        expect(satir.textContent).toContain('Su +500 ml · toplam 500 ml (dün)');
      });
      temizle();
    });

    /* HATA (2026-10-25): bekleyen her su eklemesi toplamını yalnız kayıtlı
       değerden hesaplıyordu. 1000 ml varken üç «su 250» özeti üç kez
       «toplam 1.250 ml» diyor, dokunuş 1750 yazıyordu. Özetteki her toplam
       kendinden önceki satırları sayar; son toplam yazılanla aynıdır. */
    it('üç «su 250»: özetin toplamları sırayla artar, son toplam yazılan değerdir', async () => {
      resetState(); temizle();
      await withTodayAsync(GUN, async () => {
        SP.Test.pushVitals(GUN, { water:1000 });
        for(let i = 1; i <= 3; i++) await gelen(i, 'su 250', saat(8, i));
        const d = dom(await SP.Screens.onaylar.render());
        const metin = toplu(d).closest('.onay-satir').textContent;
        const f = n => 'toplam ' + SP.U.fmtNum(n) + ' ml';
        const kac = s => metin.split(s).length - 1;
        expect([kac(f(1250)), kac(f(1500)), kac(f(1750))]).toEqual([1, 1, 1]);
        expect(metin.indexOf(f(1250)) < metin.indexOf(f(1500))).toBe(true);
        expect(metin.indexOf(f(1500)) < metin.indexOf(f(1750))).toBe(true);
        /* Bugün'ün özet kartı da aynı sırayı söyler. */
        const alan = dom(SP.Screens.onaylar.oneriAlani()).textContent;
        expect(alan).toContain(f(1750));
        expect(alan.split(f(1250)).length - 1).toBe(1);
        await sessiz(async () => {
          await SP.Screens.onaylar.handle['hkm-toplu']({ dataset:{ kaynak:'gelen' } });
        });
        expect(SP.Model.vitalsOf(GUN).water).toBe(1750);
      });
      temizle();
    });

    it('tek dokunuş hepsini geliş sırasıyla yazar; tek «Geri al» hepsini geri alır', async () => {
      resetState(); temizle();
      await withTodayAsync(GUN, async () => {
        await gelen(1, 'kilo 73', saat(8, 0));
        await gelen(2, 'su 250', saat(8, 5));
        await gelen(3, 'kilo 72,4', saat(9, 0));
        await sessiz(async toastlar => {
          await SP.Screens.onaylar.handle['hkm-toplu']({ dataset:{ kaynak:'gelen' } });
          const v = SP.Model.vitalsOf(GUN);
          expect(v.weight).toBe(72.4);                    // aynı alanda son gelen satır kalır
          expect(v.water).toBe(250);
          expect(SP.Proposals.pending()).toHaveLength(0);
          expect(toastlar[0].metin).toContain('3 ölçüm kaydedildi');
          expect(typeof toastlar[0].undo).toBe('function');
          await toastlar[0].undo();
          const g = SP.Model.vitalsOf(GUN) || {};
          expect(g.water == null).toBe(true);
          expect(g.weight == null).toBe(true);
          expect(SP.Proposals.all().filter(p => p.status === 'undone')).toHaveLength(3);
          expect(toastlar[1].metin).toContain('3 ölçüm geri alındı');
        });
      });
      temizle();
    });

    it('tahlil (orta) toplanmaz: listede yok, toplu kayıttan sonra da tek başına bekler', async () => {
      resetState(); temizle();
      await withTodayAsync(GUN, async () => {
        await gelen(1, 'su 250');
        await gelen(2, 'kilo 72,4');
        await SP.Proposals.propose({ action:'olcum-gir', source:'istek', reason:'Kısayollar’dan: «ferritin 30»',
          params:{ date:GUN, rows:[{ markerId:'ferritin', value:30 }] }, iz:[{ tur:'gelen', id:'3' }] });
        const d = dom(await SP.Screens.onaylar.render());
        expect(toplu(d).textContent).toContain('Hepsini kaydet (2)');
        await sessiz(async () => {
          await SP.Screens.onaylar.handle['hkm-toplu']({ dataset:{ kaynak:'gelen' } });
        });
        const kalan = SP.Proposals.pending();
        expect(kalan).toHaveLength(1);
        expect(kalan[0].action).toBe('olcum-gir');
      });
      temizle();
    });

    it('tek onayın bildiriminde «Geri al» var ve kaydı geri alır', async () => {
      resetState(); temizle();
      await withTodayAsync(GUN, async () => {
        await gelen(1, 'su 250');
        const id = SP.Proposals.pending()[0].id;
        await sessiz(async toastlar => {
          await SP.Screens.onaylar.handle['bekleyen-onay']({ dataset:{ id } });
          expect(SP.Model.vitalsOf(GUN).water).toBe(250);
          expect(toastlar[0].metin).toBe('Kaydedildi');
          expect(typeof toastlar[0].undo).toBe('function');
          await toastlar[0].undo();
          expect((SP.Model.vitalsOf(GUN) || {}).water == null).toBe(true);
          expect(SP.Proposals.all()[0].status).toBe('undone');
          expect(toastlar[1].metin).toBe('Geri alındı.');
        });
      });
      temizle();
    });
  });

  describe('Bugün — öneri alanı sade kalır', () => {
    /* HATA: bekleyen kayıtların HEPSİ Bugün'de kart oluyordu (her biri iki
       düğme); Kısayollar'dan gelen beş satır 14 düğme bütçesini aşıyordu. */
    it('beş gelen ölçüm Bugün\'de tek özet kart; toplu kayıt oradan da tek dokunuş; düğme 14\'ü aşmaz', async () => {
      resetState(); temizle();
      await withTodayAsync(GUN, async () => {
        /* bugun.test.js'in dolu günü: ölçüm ve öğün girilmiş. */
        SP.Test.pushVitals(GUN, { sleep:7, rhr:58, hrv:52, weight:78 });
        SP.Test.pushMeal(GUN, 'kahvalti', [['yumurta', 110]]);
        for(let i = 1; i <= 5; i++) await gelen(i, 'su ' + (200 + i * 10));
        const alan = dom(SP.Screens.onaylar.oneriAlani());
        expect(alan.querySelectorAll('.okart').length).toBe(0);
        expect(toplu(alan).textContent).toContain('Hepsini kaydet (5)');
        expect(alan.textContent).toContain('250 ml');
        /* Tek düğme: liste görünür, tek tek bakmak Onaylar'da (menü sayacı). */
        expect(alan.querySelectorAll('button').length).toBe(1);
        /* Bugün'ün düğmesi Onaylar'ın işleyicisine gider (today.js ONAY_EYLEMLERI). */
        expect(typeof SP.Screens.today.handle['hkm-toplu']).toBe('function');
        const d = dom(await SP.Screens.today.render());
        document.body.appendChild(d);
        try{ expect(d.querySelectorAll('button').length <= 14).toBe(true); }
        finally{ d.remove(); }
      });
      temizle();
    });

    it('toplanamayan bekleyen kayıtlar Bugün\'de en çok bir kart; gerisi Onaylar\'da', async () => {
      resetState(); temizle();
      await withTodayAsync(GUN, async () => {
        const id = SP.SYMPTOMS[0].id, id2 = SP.SYMPTOMS[1].id;
        await SP.Proposals.propose({ action:'semptom-isaretle', source:'istek', params:{ date:GUN, symptomId:id, severity:1 } });
        await SP.Proposals.propose({ action:'semptom-isaretle', source:'istek', params:{ date:GUN, symptomId:id2, severity:2 } });
        await SP.Proposals.propose({ action:'semptom-isaretle', source:'istek', params:{ date:GUN, symptomId:id, severity:3 } });
        const alan = dom(SP.Screens.onaylar.oneriAlani());
        expect(alan.querySelectorAll('.okart').length).toBe(1);
        expect(alan.textContent).toContain('+2 öneri Onaylar');
      });
      temizle();
    });
  });

  describe('Sürtünme — bekleyen öneri ipucu', () => {
    it('bekleyen öneriler ipucu Onaylar\'a götürür (Ofis\'e değil)', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        SP.S.usage = { days:{ '2026-03-10':{ date:'2026-03-10', adminMs:40 * 60000, ticks:80 } } };
        for(let i = 0; i < 5; i++) SP.S.proposals.push({ id:'p' + i, status:'pending', action:'vital-yaz' });
        const r = SP.Friction.relief().find(x => x.id === 'proposals');
        expect(!!r).toBe(true);
        expect(r.route).toBe('onaylar');
        expect(SP.App.yolOf(r.route).join(' › ')).toBe('Onaylar');
      });
    });
  });
})();
