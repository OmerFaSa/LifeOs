/* King verisi (core/kingveri.js) birim testleri — gorev 040.
   Sözleşme: KING-4 §C olayları ve §H yardım sağlayıcıları (R.KingVeri). */

(function(){
  'use strict';

  const { describe, it, expect, resetState } = R.Test;

  function hazirla(){
    resetState();
    R.S.profile.setupDone = true;
    R.S.cards = [];
    R.S.days = {};
  }

  const G = n => R.U.iso(R.U.addDays(R.U.today(), n));

  describe('King verisi — AYS (R.KingVeri)', () => {
    it('olaylar: sınav ve tekrar olayları, geçmiş/yok kenarları', () => {
      hazirla();
      const eskiPlan = R.PLAN;
      try{
        const simdi = new Date();
        simdi.setHours(10, 0, 0, 0);
        const bugun = R.U.iso(simdi);

        // Sınav yok, kart yok -> olay yok
        R.PLAN = Object.assign({}, eskiPlan, { examTytISO:null });
        expect(R.KingVeri.olaylar(simdi)).toEqual([]);

        // Sınav geçmişte -> olay yok
        R.PLAN.examTytISO = G(-2);
        expect(R.KingVeri.olaylar(simdi)).toEqual([]);

        // Sınav bugün -> kalan_gun: 0
        R.PLAN.examTytISO = bugun;
        const oBugun = R.KingVeri.olaylar(simdi);
        expect(oBugun.length).toBe(1);
        expect(oBugun[0].tur).toBe('sinav_yaklasti');
        expect(oBugun[0].sayilar.kalan_gun.deger).toBe(0);

        // Sınav 30 gün sonra ve 2 kart vadeli
        R.PLAN.examTytISO = G(30);
        R.S.cards = [
          { id:'c1', dueAt:G(-1) },
          { id:'c2', dueAt:bugun },
          { id:'c3', dueAt:G(2) }
        ];
        const o = R.KingVeri.olaylar(simdi);
        expect(o.length).toBe(2);
        expect(o[0].kimlik).toBe('ays.sinav_yaklasti.' + bugun);
        expect(o[0].sayilar.kalan_gun.deger).toBe(30);
        expect(o[0].sayilar.kalan_gun.etiket).toBe('hesaplandı');
        expect(o[1].kimlik).toBe('ays.tekrar_gunu.' + bugun);
        expect(o[1].sayilar.adet.deger).toBe(2);
        expect(o[1].sayilar.adet.birim).toBe('kart');
      }finally{
        R.PLAN = eskiPlan;
        resetState();
      }
    });

    it('hafta: dolu hafta toplamları ve boş haftada «veri yok» kenarı', () => {
      hazirla();
      try{
        const bugun = G(0);

        // Boş haftada her ölçü { deger:null, etiket:'veri yok' } olmalı
        R.S.days[bugun] = { date:bugun, blocks:[{ id:'b0', slot:'Ders', status:'pending' }], freeQ:null };
        const hBos = R.KingVeri.hafta(bugun);
        expect(hBos.bas).toBe(G(-6));
        expect(hBos.bit).toBe(bugun);
        for(const s of hBos.satirlar){
          expect(s.deger).toBeNull();
          expect(s.etiket).toBe('veri yok');
        }

        // Dolu hafta ve önceki hafta
        R.S.days[bugun] = {
          date:bugun,
          blocks:[{ id:'b1', slot:'Ana ders', status:'done', actualMin:50, actualQ:20 }],
          freeQ:10
        };
        R.S.days[G(-3)] = {
          date:G(-3),
          blocks:[{ id:'b2', slot:'İkinci ders', status:'partial', actualMin:30, actualQ:15 }]
        };
        // Önceki hafta (G(-8))
        R.S.days[G(-8)] = {
          date:G(-8),
          blocks:[{ id:'b3', slot:'Ana ders', status:'done', actualMin:40, actualQ:25 }]
        };

        const hDolu = R.KingVeri.hafta(bugun);
        const m = {};
        hDolu.satirlar.forEach(s => { m[s.id] = s; });

        expect(m.calisma_dk.deger).toBe(80);
        expect(m.calisma_dk.onceki).toBe(40);
        expect(m.calisma_dk.etiket).toBe('ölçüldü');
        expect(m.soru.deger).toBe(45); // 20 + 10 + 15
        expect(m.soru.onceki).toBe(25);
        expect(m.blok.deger).toBe(2); // done + partial
        expect(m.blok.onceki).toBe(1);
      }finally{
        resetState();
      }
    });

    it('hatirlat: kayitAt ms sayısı, 3 altı «veri yok», ortanca ve dun durumu', () => {
      hazirla();
      try{
        const simdi = new Date();
        simdi.setHours(10, 0, 0, 0);

        // kayitAt ms sayısı olarak verilsin (kenar durum)
        const t1 = new Date(); t1.setHours(9, 0, 0, 0);
        const t2 = new Date(); t2.setHours(9, 30, 0, 0);
        const t3 = new Date(); t3.setHours(10, 0, 0, 0);

        R.S.days[G(-1)] = {
          date:G(-1),
          blocks:[
            { id:'b1', slot:'Matematik', status:'done', actualMin:60, kayitAt:t1.getTime() },
            { id:'b2', slot:'Fizik', status:'pending' }
          ]
        };
        R.S.days[G(-2)] = {
          date:G(-2),
          blocks:[
            { id:'b3', slot:'Matematik', status:'done', actualMin:60, oturumlar:[{ bas:t2.toISOString(), dk:60 }] },
            { id:'b4', slot:'Fizik', status:'done', actualMin:45, kayitAt:t1.getTime() }
          ]
        };
        R.S.days[G(-3)] = {
          date:G(-3),
          blocks:[
            { id:'b5', slot:'Matematik', status:'done', actualMin:60, kayitAt:t3.getTime() }
          ]
        };

        const hat = R.KingVeri.hatirlat(simdi);
        const sm = {};
        hat.forEach(h => { sm[h.ad] = h; });

        // Matematik: 3 kayıt (09:00, 09:30, 10:00) -> ortanca 09:30, hesaplandı, dün yapıldı
        expect(sm.Matematik.n).toBe(3);
        expect(sm.Matematik.gercek).toBe('09:30');
        expect(sm.Matematik.etiket).toBe('hesaplandı');
        expect(sm.Matematik.dun).toBe('yapildi');
        expect(sm.Matematik.kurulu).toBeNull();

        // Fizik: 1 kayıt -> n=1 (<3) -> veri yok, dün işaretlenmedi
        expect(sm.Fizik.n).toBe(1);
        expect(sm.Fizik.gercek).toBeNull();
        expect(sm.Fizik.etiket).toBe('veri yok');
        expect(sm.Fizik.dun).toBe('isaretlenmedi');
      }finally{
        resetState();
      }
    });

    it('sonKayit ve duzelt: 600 dk kabul, 601 dk ret, 0 ret, kayitAt ms sayısı, geri al', async () => {
      hazirla();
      try{
        expect(R.KingVeri.sonKayit()).toBeNull();

        const bugun = G(0);
        const msZaman = Date.now();
        R.S.days[bugun] = {
          date:bugun,
          blocks:[
            { id:'b10', slot:'Ana ders', subject:'Matematik', topic:'İntegral', status:'done', actualMin:50, actualQ:20, kayitAt:msZaman }
          ]
        };

        const son = R.KingVeri.sonKayit();
        expect(son).toBeTruthy();
        expect(son.id).toBe(bugun + '/b10');
        expect(son.ad).toBe('İntegral');
        expect(son.alanlar[0]).toEqual({ ad:'dk', deger:50, birim:'dk' });
        expect(son.alanlar[1]).toEqual({ ad:'soru', deger:20, birim:'soru' });

        // Sınır kontrolleri: 600 dk geçerli, 601 dk ret, 0 dk ret
        const r601 = await R.KingVeri.duzelt(son.id, 'dk', 601);
        expect(r601.ok).toBe(false);
        expect(r601.why).toBeTruthy();

        const r0 = await R.KingVeri.duzelt(son.id, 'dk', 0);
        expect(r0.ok).toBe(false);

        const rSoruNeg = await R.KingVeri.duzelt(son.id, 'soru', -1);
        expect(rSoruNeg.ok).toBe(false);

        const rSoru1001 = await R.KingVeri.duzelt(son.id, 'soru', 1001);
        expect(rSoru1001.ok).toBe(false);

        // 600 dk kabul edilir ve geri alınır
        const r600 = await R.KingVeri.duzelt(son.id, 'dk', 600);
        expect(r600.ok).toBe(true);
        expect(r600.once).toBe(50);
        expect(r600.sonra).toBe(600);
        expect(R.S.days[bugun].blocks[0].actualMin).toBe(600);

        await r600.geriAl();
        expect(R.S.days[bugun].blocks[0].actualMin).toBe(50);
      }finally{
        resetState();
      }
    });
  });
})();
