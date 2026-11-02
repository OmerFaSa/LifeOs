/* King verisi (core/kingveri.js) birim testleri — görev 042.
   KING-4 §C olayları ve §H yardım sağlayıcıları sözleşmesini sınar. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const U = ESP.U;

  function yerelTarih(saat, dakika){
    const d = new Date();
    d.setHours(saat || 10, dakika || 0, 0, 0);
    return d;
  }

  function zamanStr(simdi, gunFarki, saat, dakika){
    const dt = U.addDays(simdi, gunFarki);
    dt.setHours(saat, dakika, 0, 0);
    return dt.toISOString();
  }

  describe('King verisi — olaylar (tekrar_gunu)', () => {
    it('kart yokken veya vadeli kart yokken tekrar_gunu olayı üretilmez', () => {
      resetState();
      ESP.S.cards = [];
      try{
        const simdi = yerelTarih(10, 0);
        const olaylar = ESP.KingVeri.olaylar(simdi);
        expect(olaylar).toEqual([]);

        // Yarın vadesi gelecek kart bugünün tekrarına girmez
        const yarin = U.iso(U.addDays(simdi, 1));
        ESP.S.cards = [{ id:'c1', front:'f', back:'b', due:yarin, box:2 }];
        expect(ESP.KingVeri.olaylar(simdi)).toEqual([]);
      }finally{
        resetState();
      }
    });

    it('vadesi geçmiş, bugün veya vadesiz kartlar sayılır ve aynı kimlik üretilir', () => {
      resetState();
      const simdi = yerelTarih(10, 0);
      const bugun = U.iso(simdi);
      const gecmis = U.iso(U.addDays(simdi, -2));
      const gelecek = U.iso(U.addDays(simdi, 2));

      ESP.S.cards = [
        { id:'c1', front:'1', back:'1', due:gecmis, box:1 },
        { id:'c2', front:'2', back:'2', due:bugun, box:2 },
        { id:'c3', front:'3', back:'3', box:1 }, // vadesiz = bugün
        { id:'c4', front:'4', back:'4', due:gelecek, box:3 }
      ];

      try{
        const o1 = ESP.KingVeri.olaylar(simdi);
        const o2 = ESP.KingVeri.olaylar(simdi);
        expect(o1.length).toBe(1);
        expect(o2.length).toBe(1);

        const ev = o1[0];
        expect(ev.modul).toBe('esp');
        expect(ev.tur).toBe('tekrar_gunu');
        expect(ev.kimlik).toBe('esp.tekrar_gunu.' + bugun);
        expect(ev.sayilar.adet).toEqual({ deger:3, birim:'kart', etiket:'hesaplandı' });

        // İki çağrı aynı kimliği verir
        expect(o1[0].kimlik).toBe(o2[0].kimlik);
      }finally{
        resetState();
      }
    });
  });

  describe('King verisi — hafta özeti (calisma_dk, oturum, gun)', () => {
    it('hiç oturum yokken tüm satırlar null ve veri yok etiketli döner', () => {
      resetState();
      ESP.S.days = {};
      try{
        const bit = U.todayISO();
        const h = ESP.KingVeri.hafta(bit);
        expect(h.bit).toBe(bit);
        expect(h.bas).toBe(U.iso(U.addDays(U.parse(bit), -6)));
        expect(h.satirlar.length).toBe(3);

        const map = {};
        h.satirlar.forEach(s => { map[s.id] = s; });

        expect(map.calisma_dk.deger).toBeNull();
        expect(map.calisma_dk.etiket).toBe('veri yok');
        expect(map.calisma_dk.onceki).toBeNull();

        expect(map.oturum.deger).toBeNull();
        expect(map.oturum.etiket).toBe('veri yok');
        expect(map.oturum.onceki).toBeNull();

        expect(map.gun.deger).toBeNull();
        expect(map.gun.etiket).toBe('veri yok');
        expect(map.gun.onceki).toBeNull();
      }finally{
        resetState();
      }
    });

    it('dakikasız oturumlar (missing / null) çalışma süresine ve gün sayısına katılmaz', () => {
      resetState();
      ESP.S.days = {};
      const simdi = yerelTarih(10, 0);
      const bugun = U.iso(simdi);

      ESP.S.days[bugun] = {
        date: bugun,
        sessions: [
          { id:'s1', disc:'lang', minutes:null, minutesCert:'missing', at:zamanStr(simdi, 0, 9, 0) },
          { id:'s2', disc:'philo', minutes:undefined, minutesCert:'missing', at:zamanStr(simdi, 0, 11, 0) }
        ]
      };

      try{
        const h = ESP.KingVeri.hafta(bugun);
        const map = {};
        h.satirlar.forEach(s => { map[s.id] = s; });

        expect(map.calisma_dk.deger).toBeNull();
        expect(map.calisma_dk.etiket).toBe('veri yok');

        expect(map.oturum.deger).toBeNull();
        expect(map.oturum.etiket).toBe('veri yok');

        expect(map.gun.deger).toBeNull();
        expect(map.gun.etiket).toBe('veri yok');
      }finally{
        resetState();
      }
    });

    it('tahmin dakika varsa calisma_dk etiketi tahmin olur, yalnız measured varsa ölçüldü olur', () => {
      resetState();
      ESP.S.days = {};
      const simdi = yerelTarih(10, 0);
      const bit = U.iso(simdi);
      const d1 = U.iso(U.addDays(simdi, -1));
      const d2 = U.iso(U.addDays(simdi, -2));
      const prev = U.iso(U.addDays(simdi, -8));

      // Bu hafta: 25 dk ölçüldü, 35 dk tahmin
      ESP.S.days[bit] = {
        date: bit,
        sessions: [
          { id:'s1', disc:'lang', minutes:25, minutesCert:'measured', at:zamanStr(simdi, 0, 9, 0) }
        ]
      };
      ESP.S.days[d1] = {
        date: d1,
        sessions: [
          { id:'s2', disc:'music', minutes:35, minutesCert:'estimated', at:zamanStr(simdi, -1, 14, 0) }
        ]
      };
      // Önceki hafta: 40 dk ölçüldü
      ESP.S.days[prev] = {
        date: prev,
        sessions: [
          { id:'s3', disc:'philo', minutes:40, minutesCert:'measured', at:zamanStr(simdi, -8, 10, 0) }
        ]
      };

      try{
        const h = ESP.KingVeri.hafta(bit);
        const map = {};
        h.satirlar.forEach(s => { map[s.id] = s; });

        expect(map.calisma_dk.deger).toBe(60);
        expect(map.calisma_dk.etiket).toBe('tahmin');
        expect(map.calisma_dk.onceki).toBe(40);

        expect(map.oturum.deger).toBe(2);
        expect(map.oturum.etiket).toBe('ölçüldü');
        expect(map.oturum.onceki).toBe(1);

        expect(map.gun.deger).toBe(2);
        expect(map.gun.etiket).toBe('ölçüldü');
        expect(map.gun.onceki).toBe(1);
      }finally{
        resetState();
      }
    });
  });

  describe('King verisi — hatirlat', () => {
    it('son 14 günde oturumu olmayan disiplin listeye girmez', () => {
      resetState();
      ESP.S.days = {};
      const simdi = yerelTarih(10, 0);
      const eskiGun = U.iso(U.addDays(simdi, -20));

      ESP.S.days[eskiGun] = {
        date: eskiGun,
        sessions: [
          { id:'s1', disc:'lang', minutes:30, minutesCert:'measured', at:zamanStr(simdi, -20, 10, 0) }
        ]
      };

      try{
        const list = ESP.KingVeri.hatirlat(simdi);
        expect(list).toEqual([]);
      }finally{
        resetState();
      }
    });

    it('3 ten az oturumda gercek null ve veri yok olur; 3 ve üstünde medyan hesaplanır', () => {
      resetState();
      ESP.S.days = {};
      const simdi = yerelTarih(10, 0);

      const d1 = U.iso(U.addDays(simdi, -1));
      const d2 = U.iso(U.addDays(simdi, -2));
      const d3 = U.iso(U.addDays(simdi, -3));

      // philo: 2 oturum -> n=2, gercek:null, etiket:'veri yok'
      // lang: 3 oturum -> 08:00, 08:30, 09:00 -> medyan 08:30
      ESP.S.days[d1] = {
        date: d1,
        sessions: [
          { id:'p1', disc:'philo', minutes:30, minutesCert:'measured', at:zamanStr(simdi, -1, 10, 0) },
          { id:'l1', disc:'lang', minutes:20, minutesCert:'measured', at:zamanStr(simdi, -1, 8, 30) }
        ]
      };
      ESP.S.days[d2] = {
        date: d2,
        sessions: [
          { id:'p2', disc:'philo', minutes:30, minutesCert:'measured', at:zamanStr(simdi, -2, 11, 0) },
          { id:'l2', disc:'lang', minutes:20, minutesCert:'measured', at:zamanStr(simdi, -2, 8, 0) }
        ]
      };
      ESP.S.days[d3] = {
        date: d3,
        sessions: [
          { id:'l3', disc:'lang', minutes:20, minutesCert:'measured', at:zamanStr(simdi, -3, 9, 0) }
        ]
      };

      try{
        const sonuclar = ESP.KingVeri.hatirlat(simdi);
        const map = {};
        sonuclar.forEach(x => { map[x.anahtar] = x; });

        const philo = map['disc:philo'];
        expect(philo).toBeDefined();
        expect(philo.n).toBe(2);
        expect(philo.gercek).toBeNull();
        expect(philo.etiket).toBe('veri yok');
        expect(philo.dun).toBe('yapildi'); // d1 dündür

        const lang = map['disc:lang'];
        expect(lang).toBeDefined();
        expect(lang.n).toBe(3);
        expect(lang.gercek).toBe('08:30');
        expect(lang.etiket).toBe('hesaplandı');
        expect(lang.dun).toBe('yapildi');
      }finally{
        resetState();
      }
    });
  });

  describe('King verisi — sonKayit ve duzelt', () => {
    it('oturum yokken sonKayit null döner', () => {
      resetState();
      ESP.S.days = {};
      try{
        expect(ESP.KingVeri.sonKayit()).toBeNull();
      }finally{
        resetState();
      }
    });

    it('sonKayit en yeni dakikalı oturumu seçer; dakikasız olanları atlar', () => {
      resetState();
      ESP.S.days = {};
      const simdi = yerelTarih(10, 0);
      const bugun = U.iso(simdi);
      const dun = U.iso(U.addDays(simdi, -1));

      ESP.S.days[dun] = {
        date: dun,
        sessions: [
          { id:'s_dun', disc:'philo', minutes:50, minutesCert:'measured', at:zamanStr(simdi, -1, 15, 0) }
        ]
      };
      ESP.S.days[bugun] = {
        date: bugun,
        sessions: [
          { id:'s_bugun_gecersiz', disc:'lang', minutes:null, minutesCert:'missing', at:zamanStr(simdi, 0, 12, 0) },
          { id:'s_bugun_dakikali', disc:'lang', minutes:35, minutesCert:'measured', at:zamanStr(simdi, 0, 9, 0) }
        ]
      };

      try{
        const son = ESP.KingVeri.sonKayit();
        expect(son).toBeDefined();
        expect(son.id).toBe(bugun + '/s_bugun_dakikali');
        expect(son.tur).toBe('oturum');
        expect(son.gun).toBe(bugun);
        expect(son.ad).toBe('Yabancı Dil');
        expect(son.alanlar).toEqual([{ ad:'dk', deger:35, birim:'dk' }]);
      }finally{
        resetState();
      }
    });

    it('duzelt: 1 ve 600 dk kabul edilir; 0, 601 ve bilinmeyen alan reddedilir', async () => {
      resetState();
      ESP.S.days = {};
      const simdi = yerelTarih(10, 0);
      const bugun = U.iso(simdi);

      ESP.S.days[bugun] = {
        date: bugun,
        sessions: [
          { id:'sess1', disc:'lang', minutes:30, minutesCert:'measured', at:zamanStr(simdi, 0, 9, 0) }
        ]
      };

      try{
        // 0 ret
        const r0 = await ESP.KingVeri.duzelt(bugun + '/sess1', 'dk', 0);
        expect(r0.ok).toBe(false);

        // 601 ret
        const r601 = await ESP.KingVeri.duzelt(bugun + '/sess1', 'dk', 601);
        expect(r601.ok).toBe(false);

        // bilinmeyen alan ret
        const rAlan = await ESP.KingVeri.duzelt(bugun + '/sess1', 'soru', 50);
        expect(rAlan.ok).toBe(false);

        // olmayan oturum ret
        const rYok = await ESP.KingVeri.duzelt(bugun + '/sess_yok', 'dk', 30);
        expect(rYok.ok).toBe(false);

        // 600 tam sınır kabul
        const r600 = await ESP.KingVeri.duzelt(bugun + '/sess1', 'dk', 600);
        expect(r600.ok).toBe(true);
        expect(r600.once).toBe(30);
        expect(r600.sonra).toBe(600);
        expect(ESP.S.days[bugun].sessions[0].minutes).toBe(600);
        expect(ESP.S.days[bugun].sessions[0].minutesCert).toBe('measured');

        // Geri al: 30'a döner
        await r600.geriAl();
        expect(ESP.S.days[bugun].sessions[0].minutes).toBe(30);
      }finally{
        resetState();
      }
    });

    it('duzelt: geriAl() eski dakikayı ve eski kesinliği (estimated) eksiksiz geri yükler', async () => {
      resetState();
      ESP.S.days = {};
      const simdi = yerelTarih(10, 0);
      const bugun = U.iso(simdi);

      // Başlangıçta estimated bir oturum
      ESP.S.days[bugun] = {
        date: bugun,
        sessions: [
          { id:'sess_est', disc:'philo', minutes:45, minutesCert:'estimated', at:zamanStr(simdi, 0, 10, 0) }
        ]
      };

      try{
        const duz = await ESP.KingVeri.duzelt('sess_est', 'dk', 20); // yalın id ile de bulabilmeli
        expect(duz.ok).toBe(true);
        expect(duz.once).toBe(45);
        expect(duz.sonra).toBe(20);

        const sess = ESP.S.days[bugun].sessions[0];
        expect(sess.minutes).toBe(20);
        expect(sess.minutesCert).toBe('measured');

        // Geri al: eski dakika 45 ve eski kesinlik 'estimated' olmalıdır
        await duz.geriAl();
        const sessEski = ESP.S.days[bugun].sessions[0];
        expect(sessEski.minutes).toBe(45);
        expect(sessEski.minutesCert).toBe('estimated');
      }finally{
        resetState();
      }
    });
  });

  describe('King verisi — brifing', () => {
    it('boş depoda plan:[], bulgu:null, oneri:null döner ve iki çağrı aynı sonucu verir', () => {
      resetState();
      ESP.S.days = {};
      ESP.S.cards = [];
      try{
        const simdi = yerelTarih(10, 0);
        const b1 = ESP.KingVeri.brifing(simdi);
        const b2 = ESP.KingVeri.brifing(simdi);
        expect(b1.gun).toBe(U.iso(simdi));
        expect(b1.plan).toEqual([]);
        expect(b1.bulgu).toBeNull();
        expect(b1.oneri).toBeNull();
        expect(b1).toEqual(b2);
      }finally{
        resetState();
      }
    });

    it('kenar: dün ölçüsü olup önceki 7 gün boşken bulgu döner ve ort «veri yok» olur', () => {
      resetState();
      ESP.S.days = {};
      const simdi = yerelTarih(8, 0);
      const dun = U.iso(U.addDays(simdi, -1));

      ESP.S.days[dun] = {
        date: dun,
        sessions: [
          { id:'s1', disc:'lang', minutes:40, minutesCert:'measured', at:zamanStr(simdi, -1, 14, 0) }
        ]
      };

      try{
        const b = ESP.KingVeri.brifing(simdi);
        expect(b.bulgu).toEqual({
          id: 'calisma_dk',
          ad: 'Çalışma',
          deger: 40,
          birim: 'dk',
          etiket: 'ölçüldü',
          ort: { deger: null, etiket: 'veri yok' }
        });
      }finally{
        resetState();
      }
    });

    it('kenar: simdi gece yarısına yakın (23:59) iken dünün doğru günü seçilir', () => {
      resetState();
      ESP.S.days = {};
      // 23:59 yerel zamanı
      const simdi = new Date(2026, 4, 15, 23, 59, 30);
      const bugun = U.iso(simdi); // '2026-05-15'
      const dun = U.iso(U.addDays(simdi, -1)); // '2026-05-14'

      ESP.S.days[dun] = {
        date: dun,
        sessions: [
          { id:'s_dun', disc:'philo', minutes:60, minutesCert:'measured', at:'2026-05-14T15:00:00' }
        ]
      };
      ESP.S.days[bugun] = {
        date: bugun,
        sessions: [
          { id:'s_bugun', disc:'philo', minutes:30, minutesCert:'measured', at:'2026-05-15T10:00:00' }
        ]
      };

      try{
        const b = ESP.KingVeri.brifing(simdi);
        expect(b.gun).toBe('2026-05-15');
        expect(b.bulgu).toBeDefined();
        expect(b.bulgu.deger).toBe(60); // Bugünü değil, dünü (2026-05-14) okumalı
        expect(b.bulgu.etiket).toBe('ölçüldü');
      }finally{
        resetState();
      }
    });

    it('tahmin dakikası olan dünün oturumları etiket:tahmin üretir ve ort >= 3 günde hesaplanır', () => {
      resetState();
      ESP.S.days = {};
      const simdi = yerelTarih(9, 30);
      const dun = U.iso(U.addDays(simdi, -1));
      const g2 = U.iso(U.addDays(simdi, -2));
      const g4 = U.iso(U.addDays(simdi, -4));
      const g6 = U.iso(U.addDays(simdi, -6));
      const g9 = U.iso(U.addDays(simdi, -9)); // 7 gün dışı

      ESP.S.days[dun] = {
        date: dun,
        sessions: [
          { id:'s1', disc:'lang', minutes:25, minutesCert:'measured', at:zamanStr(simdi, -1, 10, 0) },
          { id:'s2', disc:'music', minutes:20, minutesCert:'estimated', at:zamanStr(simdi, -1, 15, 0) },
          { id:'s3', disc:'philo', minutes:null, minutesCert:'missing', at:zamanStr(simdi, -1, 16, 0) }
        ]
      };
      ESP.S.days[g2] = { date: g2, sessions: [{ id:'x', disc:'lang', minutes:30, minutesCert:'measured' }] };
      ESP.S.days[g4] = { date: g4, sessions: [{ id:'y', disc:'lang', minutes:45, minutesCert:'measured' }] };
      ESP.S.days[g6] = { date: g6, sessions: [{ id:'z', disc:'lang', minutes:50, minutesCert:'measured' }] };
      ESP.S.days[g9] = { date: g9, sessions: [{ id:'w', disc:'lang', minutes:200, minutesCert:'measured' }] };

      try{
        const b = ESP.KingVeri.brifing(simdi);
        expect(b.bulgu).toEqual({
          id: 'calisma_dk',
          ad: 'Çalışma',
          deger: 45,
          birim: 'dk',
          etiket: 'tahmin',
          ort: {
            deger: 42, // (30 + 45 + 50) / 3 = 41.666 -> Math.round = 42
            etiket: 'hesaplandı'
          }
        });
      }finally{
        resetState();
      }
    });

    it('öneri önceliği: olaylar içinden öncelikli olay seçilir', () => {
      resetState();
      ESP.S.cards = [];
      const simdi = yerelTarih(10, 0);
      const bugun = U.iso(simdi);

      // Tekrar günü kartı
      ESP.S.cards = [
        { id:'c1', front:'1', back:'1', due:bugun, box:1 }
      ];

      try{
        const b = ESP.KingVeri.brifing(simdi);
        expect(b.oneri).toEqual({
          id: 'tekrar_gunu',
          sayilar: {
            adet: { deger:1, birim:'kart', etiket:'hesaplandı' }
          }
        });
      }finally{
        resetState();
      }
    });
  });
})();
