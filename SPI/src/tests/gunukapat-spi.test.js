/* Günü kapat — SPİ satırları (KOLAY-PLANI Faz 1; çekirdek brand/ortak/gunukapat.js).

   Kanıtlanan sözler:
     1. Satırlar dürüst kurulur: su hedefin altındaysa «Hedef: 2.000 ml»
        (plan); öğün «her zamanki» yalnız son 7 günün en az 4'ünde aynı
        öğünden (3/7'de öneri yok); vakti gelmiş hatırlatmalar tek satır;
        dört ölçüm yalnız «son: …» ipucuyla, yazma işlevi yok.
     2. Su hedefi suYaz yolundan yazılır; geri al önceki değeri (ya da
        «girilmedi»yi) geri koyar.
     3. Dokunulmayan ya da işareti kaldırılan satır yazılmaz; ölçüm satırı
        tek satır yazılmadan asla yazılmaz.
     4. Tek satır + «Hepsi doğru» ölçümleri ve beyanları yazar; tek «Geri al»
        hepsini kaldırır.
     5. Kapaktaki «Günü kaydet» «Günü kapat» alt sayfasını açar; «Günü
        düzenle» yolu sayfada kalır; Bugün'ün 14 düğme bütçesi korunur.
     6. P2: kapatılan gün SP.App.girildi() ile «girildi» olur. */

(function(){
  const { describe, it, expect, resetState, pushVitals, pushMeal, pushWorkout, withTodayAsync } = SP.Test;
  const GUN = '2026-03-10';
  const GK = () => window.LIFEOS.GUNUKAPAT;
  const T = () => SP.Screens.today;
  const once = n => SP.U.iso(SP.U.addDays(SP.U.parse(GUN), -n));
  const KAHVALTI = [['yumurta', 110], ['beyaz-peynir', 40]];

  /* Testlerde boot koşmaz: iki ortak kutu her testten sonra sıfırlanır
     (kurulu kalırsa sonraki Bugün testleri fazladan düğme sayar). */
  async function kurulu(fn){
    const toast = SP.UI.toast;
    const bildirilen = [];
    SP.UI.toast = (m, o) => { bildirilen.push([m, o && o.undo]); };
    try{
      SP.App.gunuKapatKur();
      SP.App.girisKur();
      return await withTodayAsync(GUN, () => fn(bildirilen));
    }finally{
      SP.UI.toast = toast;
      if(SP.UI.isSheetOpen()) SP.UI.closeSheet();
      GK()._sifirla();
      window.LIFEOS.GIRIS._sifirla();
    }
  }
  const satir = id => GK().satirlar(GUN).find(s => s.id === id);
  function kalipGunleri(n){
    for(let i = 1; i <= n; i++) pushMeal(once(i), 'kahvalti', i % 2 ? KAHVALTI : KAHVALTI.slice().reverse());
  }
  function hatirlatmalar(){
    SP.S.hatirlat = { liste:[
      { id:'h-su', tur:'su', medId:null, saatler:['00:00'] },
      { id:'h-har', tur:'hareket', medId:null, saatler:['00:00'] },
    ], yapildi:{}, seans:{}, bildirim:false };
  }
  const isaretli = () => Object.keys((SP.S.hatirlat.yapildi || {})[GUN] || {}).sort();
  const kahvaltilar = () => SP.Model.mealsOf(GUN).filter(m => m.slot === 'kahvalti' && m.items.length);
  async function bekle(kosul){
    for(let i = 0; i < 100 && !kosul(); i++) await new Promise(r => setTimeout(r, 10));
    return kosul();
  }

  describe('Günü kapat — SPİ satırları', () => {
    it('öğün «her zamanki» yalnız 7 günün 4\'ünde; 3/7\'de öneri yok, öğün uydurulmaz', async () => {
      resetState();
      kalipGunleri(4);
      await kurulu(async () => {
        const k = satir('ogun-kahvalti');
        expect(k.tur).toBe('beyan');
        expect(k.oneri.kaynak).toBe('kalip');
        expect(k.oneri.metin).toContain('110 g');
        expect(typeof k.yaz).toBe('function');
        /* Kalıbı olmayan öğün: satır var, öneri yok. */
        const o = satir('ogun-ogle');
        expect(!!o).toBe(true);
        expect(!o.oneri && !o.yaz).toBe(true);
      });
      resetState();
      kalipGunleri(3);
      pushMeal(once(9), 'kahvalti', KAHVALTI);           // pencerenin dışı sayılmaz
      await kurulu(async () => {
        const k = satir('ogun-kahvalti');
        expect(!k.oneri && !k.yaz).toBe(true);
        const d = document.createElement('div');
        d.innerHTML = GK().cizim(GUN);
        expect(d.textContent).toContain('öneri yok');
      });
    });

    it('bugün girilmiş öğün ve hedefe ulaşmış su «kaydedildi»; ölçüm satırı yazılmaz, yalnız ipucu', async () => {
      resetState();
      kalipGunleri(5);
      pushVitals(once(2), { sleep:6.5, rhr:60, weight:78.2 });
      pushVitals(GUN, { water:2100, hrv:52 });
      pushMeal(GUN, 'kahvalti', KAHVALTI);
      await kurulu(async () => {
        expect(satir('su').yazildi).toBe(true);
        expect(satir('ogun-kahvalti').yazildi).toBe(true);
        const u = satir('uyku');
        expect(u.tur).toBe('olcum');
        expect(!u.yaz && !u.oneri).toBe(true);
        expect(u.ipucu).toContain('son: 6,5');
        expect(satir('hrv').yazildi).toBe(true);
        expect(satir('kilo').ipucu).toContain('78,2');
        expect(satir('nabiz').yazildi).toBe(false);
        /* Hiç kaydı olmayan ölçüm «veri yok» der, sıfır değil. */
        resetState();
        expect(satir('kilo').ipucu).toContain('veri yok');
      });
    });

    it('su hedefi yazılır; geri al «girilmedi»yi ya da önceki değeri geri koyar', async () => {
      resetState();
      await kurulu(async () => {
        const s = satir('su');
        expect(s.oneri).toEqual({ metin:'Hedef: 2.000 ml', kaynak:'plan' });
        const r = await s.yaz(GUN);
        expect(SP.Model.vitalsOf(GUN).water).toBe(2000);
        /* Hedefin yazılması bir beyandır, ölçüm değil. */
        expect(SP.Model.vitalsOf(GUN).waterSrc).toBe('beyan');
        await r.geriAl();
        expect(SP.Model.vitalsOf(GUN).water == null).toBe(true);
        expect(SP.Model.vitalsOf(GUN).waterSrc == null).toBe(true);
        pushVitals(GUN, { water:1500, waterSrc:'beyan' });
        const r2 = await satir('su').yaz(GUN);
        expect(SP.Model.vitalsOf(GUN).water).toBe(2000);
        await r2.geriAl();
        expect(SP.Model.vitalsOf(GUN).water).toBe(1500);
        expect(SP.Model.vitalsOf(GUN).waterSrc).toBe('beyan');
      });
    });

    /* Kapak karoları hepsini «ölçüldü» diye çiziyordu. */
    it('kapak karoları kesinliği kaynağından alır', async () => {
      resetState();
      pushVitals(GUN, { sleep:7, water:2000, waterSrc:'beyan' });
      pushMeal(GUN, 'kahvalti', KAHVALTI);
      pushWorkout(GUN, { minutes:30 });
      await kurulu(async () => {
        const d = document.createElement('div');
        const k = ad => Array.from(d.querySelectorAll('.kapak__sayi'))
          .find(x => x.querySelector('.kapak__ad').textContent.indexOf(ad) === 0).getAttribute('data-kesinlik');
        d.innerHTML = T().kapak();
        expect(k('Uyku')).toBe('measured');
        expect(k('Su')).toBe('estimated');
        expect(k('Öğün')).toBe('computed');
        expect(k('Hareket')).toBe('estimated');
        SP.S.vitals[GUN].waterSrc = null;
        d.innerHTML = T().kapak();
        expect(k('Su')).toBe('measured');
      });
    });

    it('işareti kaldırılan ve önerisi olmayan satır yazılmaz; satırsız ölçüm yazılmaz', async () => {
      resetState();
      kalipGunleri(4);
      hatirlatmalar();
      await kurulu(async () => {
        const d = document.createElement('div');
        d.innerHTML = GK().cizim(GUN);
        document.body.appendChild(d);
        try{
          const c = d.querySelector('[data-gk-sec="su"]');
          c.checked = false;
          c.dispatchEvent(new Event('change', { bubbles:true }));
          expect(GK().yazilacaklar(GUN).map(s => s.id)).toEqual(['ogun-kahvalti', 'hatirlatma']);
          const r = await GK().kapat(GUN, { olcumMetni:'' });
          expect(r.ok).toBe(true);
          const v = SP.Model.vitalsOf(GUN) || {};
          expect(v.water == null).toBe(true);                       // işareti kaldırıldı
          ['sleep', 'rhr', 'hrv', 'weight'].forEach(k => expect(v[k] == null).toBe(true));
          expect(kahvaltilar()).toHaveLength(1);
          expect(SP.Model.mealsOf(GUN).filter(m => m.slot !== 'kahvalti')).toHaveLength(0);
        }finally{ d.remove(); }
      });
    });

    it('tek satır + «Hepsi doğru»: ölçümler ve beyanlar yazılır, tek «Geri al» hepsini kaldırır; P2 girildi', async () => {
      resetState();
      kalipGunleri(4);
      hatirlatmalar();
      await kurulu(async bildirilen => {
        expect(SP.App.girildi(GUN)).toBe(false);
        const r = await GK().kapat(GUN, { olcumMetni:'uyku 7.5, nabız 56, hrv 55, kilo 72' });
        expect(r.ok).toBe(true);
        const v = SP.Model.vitalsOf(GUN);
        expect([v.sleep, v.rhr, v.hrv, v.weight, v.water]).toEqual([7.5, 56, 55, 72, 2000]);
        expect(kahvaltilar()).toHaveLength(1);
        expect(isaretli()).toEqual(['h-har@00:00', 'h-su@00:00']);
        expect(SP.App.girildi(GUN)).toBe(true);
        /* Tek bildirim, tek «Geri al». */
        expect(bildirilen).toHaveLength(1);
        expect(typeof bildirilen[0][1]).toBe('function');
        await bildirilen[0][1]();
        const g = SP.Model.vitalsOf(GUN) || {};
        expect([g.sleep, g.rhr, g.hrv, g.weight, g.water].every(x => x == null)).toBe(true);
        expect(kahvaltilar()).toHaveLength(0);
        expect(isaretli()).toEqual([]);
        expect(SP.App.girildi(GUN)).toBe(false);
      });
    });

    it('anlaşılmayan ölçüm parçası varken hiçbir şey yazılmaz', async () => {
      resetState();
      await kurulu(async () => {
        const r = await GK().kapat(GUN, { olcumMetni:'uyku 7.5, falan filan' });
        expect(r.ok).toBe(false);
        const v = SP.Model.vitalsOf(GUN) || {};
        expect(v.sleep == null && v.water == null).toBe(true);
      });
    });

    it('kapaktaki «Günü kaydet» alt sayfayı açar; satır ve «Hepsi doğru» oradan yazar; «Günü düzenle» kalır', async () => {
      resetState();
      await kurulu(async () => {
        const d = document.createElement('div');
        d.innerHTML = T().kapak();
        document.body.appendChild(d);
        try{
          const b = d.querySelectorAll('.btn--primary');
          expect(b.length).toBe(1);
          expect(b[0].textContent).toContain('Günü kaydet');
          expect(b[0].getAttribute('data-act')).toBe('gunu-kapat');
          await T().handle['gunu-kapat'](b[0]);
          const s = document.getElementById('sheet');
          expect(!!s).toBe(true);
          expect(s.querySelector('h3').textContent).toBe('Günü kapat');
          expect(s.querySelector('[data-gunukapat]').getAttribute('data-gun')).toBe(GUN);
          expect(!!s.querySelector('[data-act="go"][data-route="gun"]')).toBe(true);
          /* Pusula yolu: satıra yaz, «Hepsi doğru». */
          s.querySelector('#gk-olcum').value = 'uyku 7.5, nabız 56, hrv 55, kilo 72';
          s.querySelector('[data-gk-form]').requestSubmit(s.querySelector('.gk__kapat'));
          expect(await bekle(() => (SP.Model.vitalsOf(GUN) || {}).weight === 72)).toBe(true);
          expect(SP.Model.vitalsOf(GUN).water).toBe(2000);
          expect(await bekle(() => /Gün kapatıldı/.test(s.textContent))).toBe(true);
        }finally{ d.remove(); }
      });
    });

    /* İnceleme (2026-10-25) 1: modül yazamadığında («su» toplamı sınırı
       aşar) düz metin dönüyordu; çekirdek bunu başarı sayıp beyanları
       yazıyordu. Tahlil satırı geri alınamaz: sonuç bunu söyler. */
    it('yazılamayan ölçüm başarı sayılmaz: beyan da yazılmaz; kutu «Kaydedilemedi» der; tahlil «geri alınamaz»', async () => {
      resetState();
      kalipGunleri(4);
      pushVitals(GUN, { water:9900 });
      await kurulu(async bildirilen => {
        const r = await GK().kapat(GUN, { olcumMetni:'su 500 ml' });
        expect(r.ok).toBe(false);
        expect(r.neden).toContain('çok yüksek');
        expect(SP.Model.vitalsOf(GUN).water).toBe(9900);
        expect(kahvaltilar()).toHaveLength(0);
        expect(bildirilen).toHaveLength(0);
        const Gi = window.LIFEOS.GIRIS;
        Gi.gonder('su 500 ml');
        const m = await Gi.kaydet();
        expect(m).toContain('Kaydedilemedi');
        expect(m).toContain('çok yüksek');
        const t = await GK().kapat(GUN, { olcumMetni:'ferritin 26' });
        expect(t.ok).toBe(true);
        expect(t.metin).toContain('geri alınamaz');
      });
    });

    /* İnceleme 2: kapak bugünü gösterir; gizli «görünen gün» (S.ui.mealDate)
       geçmişteyken sayfa o günü açıyor, ölçüm satırı ise bugüne yazıyordu. */
    it('geçmiş gün gösterilirken de «Günü kaydet» bugünü açar; ölçüm ve beyan aynı güne yazılır', async () => {
      resetState();
      await kurulu(async () => {
        SP.S.ui.mealDate = once(1);
        try{
          await T().handle['gunu-kapat']();
          const s = document.getElementById('sheet');
          expect(s.querySelector('[data-gunukapat]').getAttribute('data-gun')).toBe(GUN);
          s.querySelector('#gk-olcum').value = 'uyku 7.5';
          s.querySelector('[data-gk-form]').requestSubmit(s.querySelector('.gk__kapat'));
          expect(await bekle(() => (SP.Model.vitalsOf(GUN) || {}).water === 2000)).toBe(true);
          expect(SP.Model.vitalsOf(GUN).sleep).toBe(7.5);
          expect(SP.Model.vitalsOf(once(1)) == null).toBe(true);
        }finally{ SP.S.ui.mealDate = null; }
      });
    });

    /* İnceleme 3: tek satır suyu yazdıysa hedef (tahmin) üstüne yazmıyor. */
    it('tek satır suyu yazdıysa su hedefi atlanır, sayılmaz', async () => {
      resetState();
      await kurulu(async () => {
        const r = await GK().kapat(GUN, { olcumMetni:'su 2 bardak' });
        expect(r.ok).toBe(true);
        expect(SP.Model.vitalsOf(GUN).water).toBe(500);
        expect(r.yazilan).toHaveLength(1);
      });
    });

    /* İnceleme 4: virgülsüz cümlede yalnız ilk ölçüm yazılıyor, başarı deniyordu. */
    it('virgülsüz «uyku 7.5 nabız 56 kilo 72» de, virgüllüsü de üç ölçümü yazar; gün sözü her ölçüme geçer', async () => {
      for(const metin of ['uyku 7.5 nabız 56 kilo 72', 'uyku 7.5, nabız 56, kilo 72']){
        resetState();
        await kurulu(async () => {
          const r = await GK().kapat(GUN, { olcumMetni:metin });
          expect(r.ok).toBe(true);
          const v = SP.Model.vitalsOf(GUN);
          expect([v.sleep, v.rhr, v.weight]).toEqual([7.5, 56, 72]);
        });
      }
      resetState();
      await kurulu(async () => {
        expect((await GK().kapat(GUN, { olcumMetni:'dün kilo 72 nabız 56' })).ok).toBe(true);
        const d = SP.Model.vitalsOf(once(1));
        expect([d.weight, d.rhr]).toEqual([72, 56]);
      });
    });

    /* İnceleme 5: Günü kapat'ın kendi yazdığı «Her zamanki» öğün kalıbı besliyordu. */
    it('«her zamanki» kalıbı Günü kapat\'ın yazdığı öğünü saymaz', async () => {
      resetState();
      kalipGunleri(3);
      pushMeal(once(4), 'kahvalti', KAHVALTI).note = 'Her zamanki';
      await kurulu(async () => {
        const k = satir('ogun-kahvalti');
        expect(!k.oneri && !k.yaz).toBe(true);
      });
    });

    /* bugun.test.js ile aynı gün ve aynı kurulum (tek satır kutusu kurulu
       değil): Günü kapat Bugün'e düğme eklemez; giriş noktası kapaktaki
       var olan tek dolu düğmedir. */
    it('Günü kapat kuruluyken Bugün düğme bütçesi (≤ 14) ve tek dolu düğme korunur', async () => {
      resetState();
      pushVitals('2026-03-09', { sleep:6.5, rhr:60, hrv:48, weight:78.2 });
      pushVitals(GUN, { sleep:7, rhr:58, hrv:52, soreness:4, water:2100, weight:78 });
      pushMeal(GUN, 'kahvalti', KAHVALTI);
      const say = async () => {
        const d = document.createElement('div');
        d.innerHTML = String(await T().render());
        return [d.querySelectorAll('button').length, d.querySelectorAll('.btn--primary').length];
      };
      const once_ = await withTodayAsync(GUN, say);
      SP.App.gunuKapatKur();
      try{
        const sonra = await withTodayAsync(GUN, say);
        expect(sonra).toEqual(once_);
        expect(sonra[0] <= 14).toBe(true);
        expect(sonra[1]).toBe(1);
        const k = document.createElement('div');
        k.innerHTML = await withTodayAsync(GUN, () => T().kapak());
        expect(k.querySelectorAll('.btn--primary').length).toBe(1);   // yalnız «Günü kaydet»
      }finally{ GK()._sifirla(); }
    });
  });
})();
