/* SPİ Plan çekmecesi — haftalık planlar (core/haftaplan.js).

   Kullanıcı (2026-10-17): «Plan kısmına plan ekle gibi türlü türlü şeyler
   koy: yemek planı, …»; seçimi: beslenme, hareket, uyku, su ve alışkanlık
   planı + kendi adlandırdığı serbest plan.

   Kanıtlanan sözler:
     1. Plan türü KAPALI katalogdur; bozuk değer (saat, dakika, su) yazılmaz.
     2. Uyku süresi yatış–kalkıştan HESAPLANIR, gece yarısını geçer.
     3. Uyum yalnız KAYITTAN sayılır; kaydı olmayan gün «yapılmadı» değil
        «kayıt yok»tur (AGENTS §1.2). Bugün sayılmaz: gün bitmedi.
     4. Bugünün satırı planın bugüne düşen kısmıdır; su bugünkü kayıttan.
     5. İşaret kullanıcının kendi işaretidir; aynı gün ikinci dokunuş kaldırır.
     6. Plan kaydı geri alınabilir (önceki hâl döner); silinen plan gider. */

(function(){
  const { describe, it, expect, resetState, pushVitals, pushMeal, pushWorkout, withToday } = SP.Test;
  const HP = () => SP.HaftaPlan;
  const BUGUN = '2026-10-15';           // Perşembe

  describe('Haftalık planlar — katalog ve doğrulama', () => {
    it('beş tür; yerleşik dört tür tektir, serbest plan çoğalır', () => {
      expect(HP().TURLER.map(t => t.id)).toEqual(['beslenme', 'hareket', 'uyku', 'su', 'serbest']);
      expect(HP().TURLER.filter(t => t.tek).map(t => t.id)).toEqual(['beslenme', 'hareket', 'uyku', 'su']);
      expect(HP().gunNo('2026-10-12')).toBe(0);                 // Pazartesi
      expect(HP().gunNo('2026-10-18')).toBe(6);                 // Pazar
    });
    it('bozuk değer yazılmaz', () => {
      const u = HP().yeni('uyku');
      u.haftaici = { yat:'25:00', kalk:'07:00' };
      expect(HP().dogrula(u).length > 0).toBeTruthy();
      const h = HP().yeni('hareket');
      h.gunler[0] = { ne:'Yürüyüş', dk:-5 };
      expect(HP().dogrula(h).length > 0).toBeTruthy();
      const s = HP().yeni('su');
      s.suMl = 99999;
      expect(HP().dogrula(s).length > 0).toBeTruthy();
      expect(HP().dogrula(HP().yeni('bilinmez')).length > 0).toBeTruthy();
      expect(HP().dogrula(HP().yeni('beslenme'))).toEqual([]);
    });
    it('uyku süresi gece yarısını geçer (hesaplandı)', () => {
      expect(HP().uykuDakika('23:30', '07:00')).toBe(450);
      expect(HP().uykuDakika('01:00', '08:30')).toBe(450);
      expect(HP().uykuDakika('22:00', '22:00')).toBe(null);
      expect(HP().sureYaz(450)).toBe('7 sa 30 dk');
    });
  });

  describe('Haftalık planlar — bugün ve uyum', () => {
    it('hareket: kayıt yoksa «kayıt yok», eksikse «eksik»; bugün sayılmaz', () => withToday(BUGUN, () => {
      resetState();
      const p = HP().yeni('hareket');
      p.gunler[0] = { ne:'Yürüyüş', dk:30 };    // Pzt 12 Ekim
      p.gunler[1] = { ne:'Koşu', dk:40 };       // Sal 13 Ekim
      p.gunler[2] = { ne:'Esneme', dk:20 };     // Çar 14 Ekim
      p.gunler[3] = { ne:'Bisiklet', dk:45 };   // Per 15 Ekim = bugün
      pushWorkout('2026-10-12', { minutes:35 });
      pushWorkout('2026-10-13', { minutes:20 });
      const u = HP().uyum(p, BUGUN);
      /* Pencere 8–14 Ekim: önceki Perşembe (8 Ekim) de planlı ve kaydı yok. */
      expect([u.planli, u.tuttu, u.eksik, u.kayitYok]).toEqual([4, 1, 1, 2]);
      expect(u.etiket).toBe('ölçüldü');
      expect(u.metin).toContain('2 gün kayıt yok');
      expect(HP().bugun(p, BUGUN).metin).toBe('Bisiklet · 45 dk');
      p.gunler[3] = null;
      expect(HP().bugun(p, BUGUN).metin).toBe('Bugün dinlenme günü');
    }));
    it('uyku: hedefe en çok 30 dk eksik olan gece tutmuş sayılır; kayıt yoksa veri yok', () => withToday(BUGUN, () => {
      resetState();
      const p = HP().yeni('uyku');
      p.haftaici = { yat:'23:30', kalk:'07:00' };     // 7 sa 30 dk
      p.haftasonu = { yat:'00:30', kalk:'09:00' };
      expect(HP().uyum(p, BUGUN).etiket).toBe('veri yok');
      pushVitals('2026-10-13', { sleep:7 });
      pushVitals('2026-10-14', { sleep:6 });
      const u = HP().uyum(p, BUGUN);
      expect([u.kayitli, u.tuttu]).toEqual([2, 1]);
      expect(u.metin).toBe('Son 7 gün: 2 gece kayıtlı · 1 gece hedefte');
      expect(u.etiket).toBe('ölçüldü');
      expect(HP().bugun(p, BUGUN).metin).toBe('23:30 yat · 07:00 kalk (7 sa 30 dk)');
    }));
    it('su: bugünkü kayıt bugünün satırında; kayıt yoksa sıfır yazılmaz', () => withToday(BUGUN, () => {
      resetState();
      const p = HP().yeni('su');
      p.suMl = 2500;
      expect(HP().bugun(p, BUGUN).metin).toBe('Su: bugün kayıt yok · hedef 2.500 ml');
      pushVitals(BUGUN, { water:1200 });
      expect(HP().bugun(p, BUGUN).metin).toBe('Su 1.200 / 2.500 ml');
      pushVitals('2026-10-14', { water:2600 });
      pushVitals('2026-10-13', { water:1800 });
      const u = HP().uyum(p, BUGUN);
      expect([u.kayitli, u.tuttu]).toEqual([2, 1]);
    }));
    it('beslenme: bugünün öğünleri; uyum yalnız öğün kaydı olan günü sayar', () => withToday(BUGUN, () => {
      resetState();
      const p = HP().yeni('beslenme');
      p.gunler[3] = { kahvalti:'Yumurta, peynir', ogle:'', aksam:'Mercimek çorbası', ara:'' };
      expect(HP().bugun(p, BUGUN).metin).toBe('Kahvaltı: Yumurta, peynir · Akşam: Mercimek çorbası');
      pushMeal('2026-10-14', 'ogle', [['mercimek-corbasi', 250]]);
      const u = HP().uyum(p, BUGUN);
      expect(u.kayitli).toBe(1);
      expect(u.metin).toContain('1 günde öğün kaydı var');
    }));
    it('işaret kullanıcınındır: ikinci dokunuş kaldırır; serbest plan bugünün maddelerini sayar', () => withToday(BUGUN, () => {
      resetState();
      const p = HP().yeni('serbest', 'Sabah rutini');
      p.maddeler = [{ id:'a', metin:'Esneme', gunler:[] }, { id:'b', metin:'Vitamin', gunler:[3] }, { id:'c', metin:'Yüzme', gunler:[5] }];
      expect(HP().bugunMaddeleri(p, BUGUN).map(m => m.id)).toEqual(['a', 'b']);
      HP().isaretle(p, 'a', BUGUN);
      expect(HP().bugun(p, BUGUN).metin).toBe('Bugün 1 / 2 madde');
      HP().isaretle(p, 'a', BUGUN);
      expect(HP().bugun(p, BUGUN).metin).toBe('Bugün 0 / 2 madde');
      expect(HP().uyum(HP().yeni('hareket'), BUGUN).metin.indexOf('’') < 0).toBeTruthy();   // sayıya ek yok
    }));
  });

  describe('Haftalık planlar — kaydet, geri al, sil', () => {
    it('kaydet önceki hâli döndürür; geri al eski hâli yazar; sil kaldırır', async () => {
      resetState();
      SP.S.haftaplan = [];
      const p = HP().yeni('su');
      p.suMl = 2000;
      let r = await HP().kaydet(p);
      expect(r.ok).toBe(true);
      expect(r.onceki).toBe(null);
      const q = Object.assign({}, HP().bul('su'), { suMl:3000 });
      r = await HP().kaydet(q);
      expect(r.onceki.suMl).toBe(2000);
      await HP().geriAl(r);
      expect(HP().bul('su').suMl).toBe(2000);
      const bozuk = Object.assign({}, HP().bul('su'), { suMl:-1 });
      expect((await HP().kaydet(bozuk)).ok).toBe(false);
      expect(HP().bul('su').suMl).toBe(2000);
      await HP().sil(HP().bul('su').id);
      expect(HP().bul('su')).toBe(null);
    });
  });
  describe('Plan › Planlar ekranı', () => {
    const PS = () => SP.Screens.planlar;
    const dom = h => { const d = document.createElement('div'); d.innerHTML = String(h); return d; };
    it('boşken dört yerleşik plan «Kur» ister, altta «Plan ekle»', () => {
      resetState();
      SP.S.haftaplan = [];
      const d = dom(PS().render());
      expect(d.querySelectorAll('[data-act="hp-ac"]').length).toBe(5);
      expect(d.textContent).toContain('Plan ekle');
      expect(d.textContent).toContain('Beslenme planı');
    });
    it('madde işareti kalıcı yazılır; ikinci dokunuş kaldırır', async () => {
      resetState();
      SP.S.haftaplan = [];
      const p = HP().yeni('su');
      p.maddeler = [{ id:'a', metin:'Sabah esneme', gunler:[] }];
      await HP().kaydet(p);
      const id = HP().bul('su').id, bugun = SP.U.todayISO();
      await PS().handle['hp-isaret']({ dataset:{ id, madde:'a' } });
      expect(HP().isaretli(HP().bul('su'), bugun)).toEqual(['a']);
      expect((await SP.Store.list('haftaplan'))[0].isaret[bugun]).toEqual(['a']);
      await PS().handle['hp-isaret']({ dataset:{ id, madde:'a' } });
      expect(HP().isaretli(HP().bul('su'), bugun)).toEqual([]);
    });
    it('sayfada kaydet: doğru değer yazılır; bozuk değer yazılmaz ve sayfa nedeniyle açık kalır', async () => {
      resetState();
      SP.S.haftaplan = [];
      PS().handle['hp-ac']({ dataset:{ tur:'su' } });
      try{
        let g = document.querySelector('[data-hp="suMl"]');
        g.value = '-5';
        await PS().handle['hp-kaydet']();
        expect(HP().bul('su')).toBe(null);
        expect(document.querySelector('.hp-hata').textContent).toContain('Su hedefi');
        g = document.querySelector('[data-hp="suMl"]');
        g.value = '2500';
        await PS().handle['hp-kaydet']();
        expect(HP().bul('su').suMl).toBe(2500);
        expect(!!document.querySelector('[data-hp-kok]')).toBe(false);
      }finally{ SP.UI.closeSheet(); SP.S.ui.hpTaslak = null; }
    });
  });
})();
