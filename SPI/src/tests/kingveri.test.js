/* King verisi (core/kingveri.js) birim testleri — görev 041.
   KING-4 §C olayları ve §H yardım sağlayıcıları sözleşmesini sınar. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const U = SP.U;

  function yerelTarih(saat, dakika){
    const d = new Date();
    d.setHours(saat || 10, dakika || 0, 0, 0);
    return d;
  }

  describe('King verisi — olaylar (uyku_dustu, plan_kacti)', () => {
    it('hiç veri yokken olay üretilmez', () => {
      resetState();
      SP.S.vitals = {};
      const eskiListe = SP.HaftaPlan ? SP.HaftaPlan.liste : null;
      if(SP.HaftaPlan) SP.HaftaPlan.liste = () => [];
      try{
        const simdi = yerelTarih(10, 0);
        const olaylar = SP.KingVeri.olaylar(simdi);
        expect(olaylar).toEqual([]);
      }finally{
        if(SP.HaftaPlan) SP.HaftaPlan.liste = eskiListe;
        resetState();
      }
    });

    it('uyku: tek gece veri varken 4 geceden az olduğu için olay üretilmez', () => {
      resetState();
      SP.S.vitals = {};
      const simdi = yerelTarih(10, 0);
      const bugun = U.iso(simdi);
      SP.S.vitals[bugun] = { date:bugun, sleep:4 }; // tek gece, 4 saat
      try{
        const olaylar = SP.KingVeri.olaylar(simdi);
        const uykuOlaylari = olaylar.filter(o => o.tur === 'uyku_dustu');
        expect(uykuOlaylari.length).toBe(0);
      }finally{
        resetState();
      }
    });

    it('uyku: 4 gece düşük uyku (ort7 < 6) ve ort28 için yetersiz veride olay ve veri yok etiketi', () => {
      resetState();
      SP.S.vitals = {};
      const simdi = yerelTarih(10, 0);
      for(let i = -3; i <= 0; i++){
        const g = U.iso(U.addDays(simdi, i));
        SP.S.vitals[g] = { date:g, sleep:5 };
      }
      try{
        const olaylar = SP.KingVeri.olaylar(simdi);
        const u = olaylar.filter(o => o.tur === 'uyku_dustu');
        expect(u.length).toBe(1);
        expect(u[0].sayilar.ort7).toEqual({ deger:5, birim:'saat', etiket:'hesaplandı' });
        expect(u[0].sayilar.ort28).toEqual({ deger:null, birim:'saat', etiket:'veri yok' });
      }finally{
        resetState();
      }
    });

    it('uyku: 28 gecede düşüş varsa ort7 ve ort28 hesaplanır', () => {
      resetState();
      SP.S.vitals = {};
      const simdi = yerelTarih(10, 0);
      for(let i = -27; i <= -7; i++){
        const g = U.iso(U.addDays(simdi, i));
        SP.S.vitals[g] = { date:g, sleep:8 };
      }
      for(let i = -6; i <= 0; i++){
        const g = U.iso(U.addDays(simdi, i));
        SP.S.vitals[g] = { date:g, sleep:6 };
      }
      try{
        const olaylar = SP.KingVeri.olaylar(simdi);
        const u = olaylar.filter(o => o.tur === 'uyku_dustu');
        expect(u.length).toBe(1);
        expect(u[0].sayilar.ort7.deger).toBe(6);
        expect(u[0].sayilar.ort28.deger).toBe(7.5);
      }finally{
        resetState();
      }
    });

    it('uyku: düşüş yoksa ve ort7 >= 6 ise uyku_dustu üretilmez', () => {
      resetState();
      SP.S.vitals = {};
      const simdi = yerelTarih(10, 0);
      for(let i = -27; i <= 0; i++){
        const g = U.iso(U.addDays(simdi, i));
        SP.S.vitals[g] = { date:g, sleep:7 };
      }
      try{
        const olaylar = SP.KingVeri.olaylar(simdi);
        const u = olaylar.filter(o => o.tur === 'uyku_dustu');
        expect(u.length).toBe(0);
      }finally{
        resetState();
      }
    });

    it('plan_kacti: saatli, tamamlanmamış ve gecikmiş maddeler olay üretir; dilim ve zamansız üretmez', () => {
      resetState();
      const simdi = yerelTarih(10, 0);
      const bugun = U.iso(simdi);
      const eskiListe = SP.HaftaPlan ? SP.HaftaPlan.liste : null;
      const eskiBugun = SP.HaftaPlan ? SP.HaftaPlan.bugunMaddeleri : null;
      const eskiSayim = SP.HaftaPlan ? SP.HaftaPlan.sayim : null;
      const eskiZamanAn = SP.HaftaPlan ? SP.HaftaPlan.zamanAn : null;
      const eskiZamanYaz = SP.HaftaPlan ? SP.HaftaPlan.zamanYaz : null;

      if(SP.HaftaPlan){
        SP.HaftaPlan.liste = () => [{ id:'p1' }];
        SP.HaftaPlan.bugunMaddeleri = () => [
          { id:'m1', metin:'Sabah koşusu', zaman:'08:00' },
          { id:'m2', metin:'29 dk geciken', zaman:'09:31' },
          { id:'m3', metin:'Tamamlanan', zaman:'07:00' },
          { id:'m4', metin:'Akşam yemeği', zaman:'aksam' },
          { id:'m5', metin:'Zamansız iş', zaman:null }
        ];
        SP.HaftaPlan.sayim = (p, m) => ({ tamam: m.id === 'm3' });
        SP.HaftaPlan.zamanAn = z => (z === '08:00' ? 8 * 60 : (z === '09:31' ? 9 * 60 + 31 : (z === '07:00' ? 7 * 60 : 18 * 60)));
        SP.HaftaPlan.zamanYaz = z => (/^\d\d:\d\d$/.test(z || '') ? z : (z === 'aksam' ? 'Akşam' : ''));
      }
      try{
        const olaylar = SP.KingVeri.olaylar(simdi);
        const p = olaylar.filter(o => o.tur === 'plan_kacti');
        expect(p.length).toBe(1);
        expect(p[0].konu).toBe('Sabah koşusu');
        expect(p[0].sayilar.gecikme_dk).toEqual({ deger:120, birim:'dk', etiket:'hesaplandı' });
        expect(p[0].kimlik).toBe('spi.plan_kacti.' + bugun + '.p1.m1');
      }finally{
        if(SP.HaftaPlan){
          SP.HaftaPlan.liste = eskiListe;
          SP.HaftaPlan.bugunMaddeleri = eskiBugun;
          SP.HaftaPlan.sayim = eskiSayim;
          SP.HaftaPlan.zamanAn = eskiZamanAn;
          SP.HaftaPlan.zamanYaz = eskiZamanYaz;
        }
        resetState();
      }
    });
  });

  describe('King verisi — hafta özeti', () => {
    it('kaydı olmayan boş haftada her satır {deger:null, etiket:\'veri yok\'} döner', () => {
      resetState();
      SP.S.vitals = {};
      SP.S.workouts = [];
      SP.S.meals = {};
      try{
        const bit = U.todayISO();
        const h = SP.KingVeri.hafta(bit);
        expect(h.bit).toBe(bit);
        expect(h.bas).toBe(U.iso(U.addDays(U.parse(bit), -6)));
        expect(h.satirlar.length).toBe(4);
        for(const s of h.satirlar){
          expect(s.deger).toBeNull();
          expect(s.etiket).toBe('veri yok');
          expect(s.onceki).toBeNull();
        }
      }finally{
        resetState();
      }
    });

    it('hafta: uyku, antrenman, hareket_dk ve ogun sayıları doğru hesaplanır', () => {
      resetState();
      SP.S.vitals = {};
      SP.S.workouts = [];
      SP.S.meals = {};
      try{
        const bitDate = yerelTarih(10, 0);
        const bit = U.iso(bitDate);
        const g0 = bit;
        const g1 = U.iso(U.addDays(bitDate, -1));
        const g2 = U.iso(U.addDays(bitDate, -2));
        const gPrev = U.iso(U.addDays(bitDate, -8));

        SP.S.vitals[g0] = { sleep:7 };
        SP.S.vitals[g1] = { sleep:8 };
        SP.S.vitals[gPrev] = { sleep:6 };

        SP.S.workouts = [
          { id:'w1', date:g0, minutes:30 },
          { id:'w2', date:g1, minutes:45 },
          { id:'w3', date:gPrev, minutes:60 }
        ];

        SP.S.meals[g0] = [{ id:'m1' }, { id:'m2' }];
        SP.S.meals[g2] = [{ id:'m3' }];

        const h = SP.KingVeri.hafta(bit);
        const sMap = {};
        h.satirlar.forEach(s => { sMap[s.id] = s; });

        expect(sMap.uyku.deger).toBe(7.5);
        expect(sMap.uyku.gun).toBe(2);
        expect(sMap.uyku.onceki).toBe(6);

        expect(sMap.antrenman.deger).toBe(2);
        expect(sMap.antrenman.onceki).toBe(1);

        expect(sMap.hareket_dk.deger).toBe(75);
        expect(sMap.hareket_dk.onceki).toBe(60);

        expect(sMap.ogun.deger).toBe(3);
        expect(sMap.ogun.onceki).toBeNull();
      }finally{
        resetState();
      }
    });
  });

  describe('King verisi — hatirlat', () => {
    it('hatırlatma listesi boşsa boş dizi döner', () => {
      resetState();
      SP.S.hatirlat = { liste:[], yapildi:{} };
      try{
        expect(SP.KingVeri.hatirlat(new Date())).toEqual([]);
      }finally{
        resetState();
      }
    });

    it('ilaç hatırlatması ilaç adını gizler ve işaret ortancası hesaplanır', () => {
      resetState();
      const simdi = yerelTarih(10, 0);
      const bugun = U.iso(simdi);
      const d1 = U.iso(U.addDays(simdi, -1));
      const d2 = U.iso(U.addDays(simdi, -2));
      const d3 = U.iso(U.addDays(simdi, -3));

      SP.S.meds = [{ id:'m1', name:'Aspirin Gizli', startDate:'2020-01-01' }];
      SP.S.hatirlat = {
        liste: [{ id:'h1', tur:'ilac', medId:'m1', saatler:['09:00'] }],
        yapildi: {}
      };

      const zaman = (dStr, h, m) => {
        const dt = U.parse(dStr);
        dt.setHours(h, m, 0, 0);
        return dt.toISOString();
      };

      SP.S.hatirlat.yapildi[d1] = { 'h1@09:00': zaman(d1, 9, 10) };
      SP.S.hatirlat.yapildi[d2] = { 'h1@09:00': zaman(d2, 9, 20) };
      SP.S.hatirlat.yapildi[d3] = { 'h1@09:00': zaman(d3, 9, 30) };

      try{
        const sonuclar = SP.KingVeri.hatirlat(simdi);
        expect(sonuclar.length).toBe(1);
        const h = sonuclar[0];
        expect(h.ad).toBe('İlaç / takviye');
        expect(h.ad.indexOf('Aspirin')).toBe(-1);
        expect(h.n).toBe(3);
        expect(h.gercek).toBe('09:20');
        expect(h.etiket).toBe('hesaplandı');
        expect(h.dun).toBe('yapildi');
      }finally{
        resetState();
      }
    });

    it('geçersiz ilaç hatırlatması (bırakılmış/silinmiş) listeye girmez', () => {
      resetState();
      SP.S.meds = [{ id:'m1', name:'Bırakılan İlaç', startDate:'2020-01-01', endDate:'2020-01-02' }];
      SP.S.hatirlat = {
        liste: [{ id:'h1', tur:'ilac', medId:'m1', saatler:['09:00'] }],
        yapildi: {}
      };
      try{
        const sonuclar = SP.KingVeri.hatirlat(new Date());
        expect(sonuclar.length).toBe(0);
      }finally{
        resetState();
      }
    });
  });

  describe('King verisi — sonKayit ve duzelt (sınırlar: 1–600 dk, 601 dk reddi)', () => {
    it('antrenman yokken sonKayit null döner', () => {
      resetState();
      SP.S.workouts = [];
      try{
        expect(SP.KingVeri.sonKayit()).toBeNull();
      }finally{
        resetState();
      }
    });

    it('sonKayit en yeni eklenen antrenmanı döner', () => {
      resetState();
      const simdi = yerelTarih(10, 0);
      const g = U.iso(simdi);
      SP.S.workouts = [
        { id:'w1', name:'Eski', minutes:20, createdAt:'2026-10-01T10:00:00Z', date:'2026-10-01' },
        { id:'w2', name:'Yeni', minutes:45, createdAt:'2026-10-02T10:00:00Z', date:g }
      ];
      try{
        const s = SP.KingVeri.sonKayit();
        expect(s.id).toBe('w2');
        expect(s.ad).toBe('Yeni');
        expect(s.alanlar[0]).toEqual({ ad:'dk', deger:45, birim:'dk' });
      }finally{
        resetState();
      }
    });

    it('duzelt: 600 dk kabul edilir, 601 dk ve 0 dk reddedilir, geriAl çalışır', async () => {
      resetState();
      SP.S.workouts = [
        { id:'w1', name:'Koşu', minutes:40, date:U.todayISO(), items:[] }
      ];

      try{
        // Sınır kontrolleri
        const sifirDk = await SP.KingVeri.duzelt('w1', 'dk', 0);
        expect(sifirDk.ok).toBe(false);

        const altiYuzBir = await SP.KingVeri.duzelt('w1', 'dk', 601);
        expect(altiYuzBir.ok).toBe(false);

        const gecersizAlan = await SP.KingVeri.duzelt('w1', 'kalori', 300);
        expect(gecersizAlan.ok).toBe(false);

        const olmayanKayit = await SP.KingVeri.duzelt('w_yok', 'dk', 50);
        expect(olmayanKayit.ok).toBe(false);

        // 600 dk tam sınır kabulü
        const altiYuz = await SP.KingVeri.duzelt('w1', 'dk', 600);
        expect(altiYuz.ok).toBe(true);
        expect(altiYuz.once).toBe(40);
        expect(altiYuz.sonra).toBe(600);
        expect(SP.S.workouts.find(w => w.id === 'w1').minutes).toBe(600);

        // Geri al işlemi
        await altiYuz.geriAl();
        expect(SP.S.workouts.find(w => w.id === 'w1').minutes).toBe(40);
      }finally{
        resetState();
      }
    });
  });
})();
