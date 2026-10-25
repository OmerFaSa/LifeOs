/* Bugün — üç alan (katalog 03, belgeler/ekip/EKIP-PLANI.md §3; T-DEVIR §2.A-4).

   Kanıtladığı sözler: Bugün sekme taşımaz; Şimdi · Durum · (Öneri)
   alanlarından oluşur ve görünen düğme 14'ü aşmaz; sıkça yazılan dört
   ölçüm Bugün'de yazılır ve yalnız yazılanı değiştirir; geri kalan her
   kart «Bugün › Ayrıntı»dadır ve aynı şey iki yerde durmaz. */

(function(){
  const { describe, it, expect, resetState, pushVitals, pushMeal, withTodayAsync } = SP.Test;
  const GUN = '2026-03-10';

  function yerlestir(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    document.body.appendChild(d);
    return d;
  }
  function dolu(){
    resetState();
    pushVitals('2026-03-09', { sleep:6.5, rhr:60, hrv:48, weight:78.2 });
    pushVitals(GUN, { sleep:7, rhr:58, hrv:52, soreness:4, water:2100, weight:78 });
    pushMeal(GUN, 'kahvalti', [['yumurta', 110], ['beyaz-peynir', 40]]);
  }

  describe('Bugün (SPİ) — üç alan', () => {
    it('oz-003 sekme yok; Şimdi ve Durum alanları; düğme 14\'ü aşmaz', async () => {
      dolu();
      await withTodayAsync(GUN, async () => {
        const d = yerlestir(await SP.Screens.today.render());
        try{
          expect(d.querySelectorAll('[role="tab"], .subtabs').length).toBe(0);
          const alanlar = Array.from(d.querySelectorAll('.bugun__alan')).map(x => x.getAttribute('aria-label'));
          expect(alanlar.indexOf('Şimdi') >= 0).toBe(true);
          expect(alanlar.indexOf('Durum') >= 0).toBe(true);
          expect(d.querySelectorAll('button').length <= 14).toBe(true);
          /* Tek dolu düğme: günün ölçümünü kaydetmek. */
          expect(d.querySelectorAll('.btn--primary').length).toBe(1);
        }finally{ d.remove(); }
      });
    });

    it('dört ölçüm Bugün\'de yazılır; kaydetmek yalnız yazılanı değiştirir', async () => {
      dolu();
      await withTodayAsync(GUN, async () => {
        const d = yerlestir(await SP.Screens.today.render());
        try{
          ['sleep', 'rhr', 'hrv', 'weight'].forEach(k => expect(!!d.querySelector('#v-' + k)).toBe(true));
          expect(!!d.querySelector('#v-temp')).toBe(false);
          d.querySelector('#v-sleep').value = '8';
          const toast = SP.UI.toast;
          SP.UI.toast = () => {};
          try{ await SP.Screens.today.handle['save-vitals'](); }
          finally{ SP.UI.toast = toast; }
          const v = SP.Model.vitalsOf(GUN);
          expect(v.sleep).toBe(8);
          /* Bugün'de alanı olmayan ölçümler silinmez. */
          expect([v.water, v.soreness]).toEqual([2100, 4]);
        }finally{ d.remove(); }
      });
    });

    /* ÖTEKİ CİHAZIN DEĞERİ EZİLMEZ (hesap.js, 2026-10-05). Form çizildikten
       sonra telefondan kilo geldi; eşitleme modeli tazeledi ama kullanıcı
       uyku yazarken ekran yeniden çizilmez. «Kaydet» formdaki ESKİ kiloyu
       da yazıyordu: telefonun kilosu iki cihazda da kayboluyordu. Kaydet
       yalnız kullanıcının değiştirdiği alanı yazar. */
    it('kaydetmek dokunulmamış alanı yazmaz: arada öteki cihazdan gelen değer korunur', async () => {
      dolu();
      await withTodayAsync(GUN, async () => {
        const d = yerlestir(await SP.Screens.today.render());
        try{
          SP.S.vitals[GUN] = Object.assign({}, SP.S.vitals[GUN], { weight:79.4 });
          d.querySelector('#v-sleep').value = '8';
          const toast = SP.UI.toast;
          SP.UI.toast = () => {};
          try{ await SP.Screens.today.handle['save-vitals'](); }
          finally{ SP.UI.toast = toast; }
          const v = SP.Model.vitalsOf(GUN);
          expect(v.sleep).toBe(8);
          expect(v.weight).toBe(79.4);
          expect([v.rhr, v.hrv, v.water]).toEqual([58, 52, 2100]);
          /* Silmek de bir değişikliktir: boşaltılan alan boş yazılır. */
          d.querySelector('#v-rhr').value = '';
          SP.UI.toast = () => {};
          try{ await SP.Screens.today.handle['save-vitals'](); }
          finally{ SP.UI.toast = toast; }
          expect(SP.Model.vitalsOf(GUN).rhr).toBe(null);
        }finally{ d.remove(); }
      });
    });

    it('Bugün › Ayrıntı: sekme yok; form, şikâyet, geçmiş ve özet orada', async () => {
      dolu();
      await withTodayAsync(GUN, async () => {
        expect(SP.App.yolOf('gun').join(' › ')).toBe('Bugün › Günü düzenle');
        const d = yerlestir(await SP.Screens.gun.render());
        try{
          expect(d.querySelectorAll('[role="tab"], .subtabs').length).toBe(0);
          ['save-vitals', 'cycle-symptom', 'open-day', 'no-symptoms'].forEach(a =>
            expect(!!d.querySelector('[data-act="' + a + '"]')).toBe(true));
          const b = Array.from(d.querySelectorAll('.sayfabolum h2')).map(x => x.textContent.trim());
          expect(b.join(',')).toBe('Giriş,Özet,Geçmiş');
          /* Eski sekme eylemi bölüm çubuğunda kalır. */
          expect(!!d.querySelector('.bolumcubugu [data-act="day-tab"][data-tab="gecmis"]')).toBe(true);
          /* Aynı şey iki yerde durmaz: hızlı öğün Bugün'de, Ayrıntı'da değil. */
          expect(!!d.querySelector('#quick-meal')).toBe(false);
          expect(typeof SP.Screens.gun.handle['save-vitals']).toBe('function');
        }finally{ d.remove(); }
      });
    });

    it('en acil tek uyarı Bugün\'de, fazlası Ayrıntı\'da', async () => {
      dolu();
      SP.S.flags = [
        { id:'f1', label:'Birinci bayrak', detail:'a', at:GUN, ack:false },
        { id:'f2', label:'İkinci bayrak', detail:'b', at:GUN, ack:false },
      ];
      const eski = SP.Model.openFlags;
      SP.Model.openFlags = () => SP.S.flags;
      try{
        /* Bayrak KARTI sayılır: Ofis'in notu bayrağın adını anabilir. */
        const kartlar = d => Array.from(d.querySelectorAll('.flagcard__title')).map(x => x.textContent.trim());
        await withTodayAsync(GUN, async () => {
          const b = yerlestir(await SP.Screens.today.render());
          const a = yerlestir(await SP.Screens.gun.render());
          try{
            expect(kartlar(b)).toEqual(['Birinci bayrak']);
            expect(kartlar(a)).toEqual(['İkinci bayrak']);
          }finally{ b.remove(); a.remove(); }
        });
      }finally{ SP.Model.openFlags = eski; SP.S.flags = []; }
    });
  });
  /* AZ SÜRTÜNMELİ GİRİŞ (2026-10-25; kullanıcı: «spi için daha işlevli veri
     girişi, sürtünmeyi azaltacak teknikler ile daha güzel yap»). Su «n'e
     ayarla», su gösterilen güne yazılır, son değer yer tutucu, Kaydet geri
     alınır, dünkü şikâyetler tek dokunuş, kayıt vakti gelen hatırlatmayı
     kapatır. */
  describe('Bugün — az sürtünmeli giriş', () => {
    const DUN = '2026-03-09';
    async function sessiz(fn){
      const A = SP.App, r = A.render, t = SP.UI.toast;
      const toastlar = [];
      A.render = async () => {};
      SP.UI.toast = (m, o) => { toastlar.push({ m, o:o || {} }); };
      try{ await fn(toastlar); }finally{ A.render = r; SP.UI.toast = t; }
      return toastlar;
    }
    function bardakla(ml, fn){
      const Q = SP.Quick, eski = Q ? Q.BARDAK_ML : undefined;
      if(Q) Q.BARDAK_ML = ml;
      return Promise.resolve(fn()).finally(() => { if(Q){ if(eski === undefined) delete Q.BARDAK_ML; else Q.BARDAK_ML = eski; } });
    }
    const radyo = (d, n) => d.querySelector('[data-act="su-ayarla"][data-n="' + n + '"]');

    it('su: n\'inci bardak günü n bardak yapar; en üstteki yeniden dokunulunca bir azalır; geri alınır', async () => {
      resetState();
      await withTodayAsync(GUN, () => bardakla(250, async () => {
        let d = yerlestir(await SP.Screens.today.render());
        try{
          const g = d.querySelector('[role="radiogroup"][data-oz-su]');
          expect(!!g).toBe(true);
          expect(g.querySelectorAll('[role="radio"]').length).toBe(8);
          /* Dokunulmamış gün: hiçbir bardak seçili değil, sıfır yazılmaz. */
          expect(g.querySelectorAll('[aria-checked="true"]').length).toBe(0);
          expect(g.getAttribute('aria-label')).toContain('girilmedi');
          expect(SP.Model.vitalsOf(GUN)).toBe(null);
          const t = await sessiz(() => SP.Screens.today.handle['su-ayarla'](radyo(d, 5)));
          expect(SP.Model.vitalsOf(GUN).water).toBe(1250);
          d.remove(); d = yerlestir(await SP.Screens.today.render());
          const g2 = d.querySelector('[role="radiogroup"][data-oz-su]');
          expect(g2.getAttribute('aria-label')).toContain('5 / 8 bardak');
          expect(radyo(d, 5).getAttribute('aria-checked')).toBe('true');
          expect(radyo(d, 5).getAttribute('tabindex')).toBe('0');
          expect(g2.querySelectorAll('[tabindex="0"]').length).toBe(1);
          expect(d.querySelectorAll('[data-oz="073"] path[fill="var(--spi)"]').length).toBe(5);
          /* En üstteki dolu bardak: bir azalır. */
          await sessiz(() => SP.Screens.today.handle['su-ayarla'](radyo(d, 5)));
          expect(SP.Model.vitalsOf(GUN).water).toBe(1000);
          /* Geri al önceki değere döner (ilk dokunuşun geri alması: null). */
          await sessiz(() => t[0].o.undo());
          expect(SP.Model.vitalsOf(GUN).water).toBe(null);
          /* Bir bardaktan aşağı inmek «girilmedi»dir, 0 ml değil. */
          await sessiz(() => SP.Screens.today.handle['su-ayarla']({ dataset:{ n:'1' } }));
          expect(SP.Model.vitalsOf(GUN).water).toBe(250);
          await sessiz(() => SP.Screens.today.handle['su-ayarla']({ dataset:{ n:'1' } }));
          expect(SP.Model.vitalsOf(GUN).water).toBe(null);
        }finally{ d.remove(); }
      }));
    });

    it('su: bardak ölçüsü SP.Quick.BARDAK_ML\'den okunur; hedef dolunca bir bardak daha çizilir', async () => {
      resetState();
      await withTodayAsync(GUN, () => bardakla(200, async () => {
        await sessiz(() => SP.Screens.today.handle['su-ayarla']({ dataset:{ n:'10' } }));
        expect(SP.Model.vitalsOf(GUN).water).toBe(2000);
        const d = yerlestir(await SP.Screens.today.render());
        try{
          /* 2 000 ml / 200 ml = 10 bardak hedef; dolunca 11. bardak eklenebilir. */
          expect(d.querySelectorAll('[data-act="su-ayarla"]').length).toBe(11);
          expect(radyo(d, 11).getAttribute('aria-checked')).toBe('false');
          /* Radyolar düğme sayılmaz: Bugün'ün 14 düğme bütçesi korunur. */
          expect(d.querySelectorAll('button[data-act="su-ayarla"]').length).toBe(0);
        }finally{ d.remove(); }
      }));
    });

    it('su: klavyede sağ ok bir bardak ekler, sol ok bir bardak azaltır', async () => {
      resetState();
      pushVitals(GUN, { water:750 });
      await withTodayAsync(GUN, () => bardakla(250, async () => {
        const d = yerlestir(await SP.Screens.today.render());
        try{
          SP.Screens.today.afterRender();
          const tus = k => radyo(d, 3).dispatchEvent(new KeyboardEvent('keydown', { key:k, bubbles:true, cancelable:true }));
          await sessiz(async () => { tus('ArrowRight'); await new Promise(r => setTimeout(r, 0)); });
          expect(SP.Model.vitalsOf(GUN).water).toBe(1000);
          /* 4 bardaktan sol ok: 3 bardak; bir daha: 2. */
          await sessiz(async () => { tus('ArrowLeft'); await new Promise(r => setTimeout(r, 0)); });
          expect(SP.Model.vitalsOf(GUN).water).toBe(750);
          await sessiz(async () => { tus('ArrowLeft'); await new Promise(r => setTimeout(r, 0)); });
          expect(SP.Model.vitalsOf(GUN).water).toBe(500);
        }finally{ d.remove(); }
      }));
    });

    /* HATA (2026-10-25): bardağa denk gelmeyen mililitre atılıyordu. «su
       1100» ya da 100 ml eklemeyle 1 100 ml'de adet 4'tür; seçili 4. bardağa
       dokunmak («bir eksik») ya da sol ok 850 yerine 750 yazıyordu: ölçülmüş
       100 ml sessizce siliniyordu. ±1 bardak gerçek ml'nin üstünden işler. */
    it('su: bardağa denk gelmeyen ml atılmaz; bir eksik ve bir fazla gerçek ml\'den', async () => {
      resetState();
      await withTodayAsync(GUN, () => bardakla(250, async () => {
        const ayarla = n => sessiz(() => SP.Screens.today.handle['su-ayarla']({ dataset:{ n:String(n) } }));
        const su = ml => SP.Model.saveVitals(GUN, { water:ml });
        await su(1100);
        await ayarla(4);                                   // seçili bardak: bir eksik
        expect(SP.Model.vitalsOf(GUN).water).toBe(850);
        await su(1100);
        await ayarla(5);                                   // bir fazla
        expect(SP.Model.vitalsOf(GUN).water).toBe(1350);
        await su(1100);
        await ayarla(3);                                   // bir alttaki bardak da bir eksik
        expect(SP.Model.vitalsOf(GUN).water).toBe(850);
        /* Komşu olmayan bardak açık bir seçimdir: n bardak yazılır. */
        await su(1100);
        await ayarla(7);
        expect(SP.Model.vitalsOf(GUN).water).toBe(1750);
        /* Bir bardaktan aşağısı «girilmedi»dir, 0 ml değil. */
        await su(300);
        await ayarla(1);
        expect(SP.Model.vitalsOf(GUN).water).toBe(null);
        /* Klavye de aynı kuralla: oklar gerçek ml'ye bir bardak ekler/çıkarır. */
        await su(1100);
        const d = yerlestir(await SP.Screens.today.render());
        try{
          /* Seçili bardağın etiketi gerçek ml'yi söyler; komşular dokunuşun yazacağını. */
          expect(radyo(d, 4).getAttribute('aria-label')).toContain(SP.U.fmtNum(1100) + ' ml');
          expect(radyo(d, 5).getAttribute('aria-label')).toContain(SP.U.fmtNum(1350) + ' ml');
          SP.Screens.today.afterRender();
          const tus = k => radyo(d, 4).dispatchEvent(new KeyboardEvent('keydown', { key:k, bubbles:true, cancelable:true }));
          await sessiz(async () => { tus('ArrowLeft'); await new Promise(r => setTimeout(r, 0)); });
          expect(SP.Model.vitalsOf(GUN).water).toBe(850);
          await sessiz(async () => { tus('ArrowRight'); await new Promise(r => setTimeout(r, 0)); });
          expect(SP.Model.vitalsOf(GUN).water).toBe(1100);
          /* 300 ml'den sol ok: bir bardaktan aşağısı null. */
          await su(300);
          await sessiz(async () => { tus('ArrowLeft'); await new Promise(r => setTimeout(r, 0)); });
          expect(SP.Model.vitalsOf(GUN).water).toBe(null);
        }finally{ d.remove(); }
      }));
    });

    /* HATA (2026-10-25): seçili radyoda Boşluk/Enter bir bardak siliyordu.
       ARIA radyo deseninde seçili radyoda Boşluk hiçbir şey yapmaz; seçimini
       onaylayan klavye kullanıcısı bir bardak kaybediyordu. */
    it('su: seçili bardakta Boşluk/Enter hiçbir şey yazmaz; seçili olmayanda onu seçer', async () => {
      resetState();
      pushVitals(GUN, { water:750 });
      await withTodayAsync(GUN, () => bardakla(250, async () => {
        const d = yerlestir(await SP.Screens.today.render());
        try{
          SP.Screens.today.afterRender();
          const tus = (n, k) => radyo(d, n).dispatchEvent(new KeyboardEvent('keydown', { key:k, bubbles:true, cancelable:true }));
          const bas = (n, k) => sessiz(async () => { tus(n, k); await new Promise(r => setTimeout(r, 0)); });
          expect((await bas(3, ' ')).length).toBe(0);
          expect(SP.Model.vitalsOf(GUN).water).toBe(750);
          expect((await bas(3, 'Enter')).length).toBe(0);
          expect(SP.Model.vitalsOf(GUN).water).toBe(750);
          await bas(4, ' ');
          expect(SP.Model.vitalsOf(GUN).water).toBe(1000);
          await bas(6, 'Enter');
          expect(SP.Model.vitalsOf(GUN).water).toBe(1500);
          /* Artık 6 seçili: Boşluk yine hiçbir şey yapmaz. */
          expect((await bas(6, ' ')).length).toBe(0);
          expect(SP.Model.vitalsOf(GUN).water).toBe(1500);
        }finally{ d.remove(); }
      }));
    });

    /* HATA: su kutusu todayISO()'ya yazıyordu; ölçüm ve his kutuları
       gösterilen güne (shownDate). Geçmiş bir günü açıp su girmek bugünü
       değiştiriyordu. */
    it('su gösterilen güne yazılır, bugüne değil (ekle de ayarla da)', async () => {
      resetState();
      SP.S.ui.mealDate = DUN;
      try{
        await withTodayAsync(GUN, () => bardakla(250, async () => {
          await sessiz(() => SP.Screens.today.handle['su-ayarla']({ dataset:{ n:'3' } }));
          expect(SP.Model.vitalsOf(DUN).water).toBe(750);
          expect(SP.Model.vitalsOf(GUN)).toBe(null);
          await sessiz(() => SP.Screens.today.handle['su-ekle']());
          expect(SP.Model.vitalsOf(DUN).water).toBe(1000);
          expect(SP.Model.vitalsOf(GUN)).toBe(null);
          const d = yerlestir(await SP.Screens.today.render());
          try{ expect(radyo(d, 4).getAttribute('aria-checked')).toBe('true'); }
          finally{ d.remove(); }
        }));
      }finally{ SP.S.ui.mealDate = null; }
    });

    it('dört ölçümde son değer gri yer tutucudur ve hiçbir şey yazmaz', async () => {
      resetState();
      pushVitals('2026-03-01', { sleep:6, rhr:62 });
      pushVitals(DUN, { sleep:7.5, hrv:48, weight:78.2 });
      await withTodayAsync(GUN, async () => {
        const d = yerlestir(await SP.Screens.today.render());
        try{
          expect(d.querySelector('#v-weight').getAttribute('placeholder')).toContain('78,2');
          expect(d.querySelector('#v-sleep').getAttribute('placeholder')).toContain('7,5');
          expect(d.querySelector('#v-rhr').getAttribute('placeholder')).toContain('62');
          expect(d.querySelector('#v-hrv').getAttribute('placeholder')).toContain('48');
          expect(d.querySelector('#v-weight').value).toBe('');
          await sessiz(() => SP.Screens.today.handle['save-vitals']());
          const v = SP.Model.vitalsOf(GUN);
          expect([v && v.sleep, v && v.rhr, v && v.hrv, v && v.weight]).toEqual([null, null, null, null]);
        }finally{ d.remove(); }
      });
    });

    it('Kaydet geri alınır: yazılan alanlar önceki değerine döner', async () => {
      dolu();
      await withTodayAsync(GUN, async () => {
        const d = yerlestir(await SP.Screens.today.render());
        try{
          d.querySelector('#v-sleep').value = '8';
          d.querySelector('#v-hrv').value = '';
          const t = await sessiz(() => SP.Screens.today.handle['save-vitals']());
          expect([SP.Model.vitalsOf(GUN).sleep, SP.Model.vitalsOf(GUN).hrv]).toEqual([8, null]);
          expect(typeof t[0].o.undo).toBe('function');
          await sessiz(() => t[0].o.undo());
          const v = SP.Model.vitalsOf(GUN);
          expect([v.sleep, v.hrv, v.weight, v.water]).toEqual([7, 52, 78, 2100]);
        }finally{ d.remove(); }
      });
    });

    it('«Dünkü şikâyetler sürüyor»: yalnız dün şikâyet varken ve bugün girilmemişken; kopyalar, geri alınır', async () => {
      resetState();
      pushVitals(DUN, { symptoms:{ 'bas-agrisi':2, yorgunluk:1 }, symptomsLogged:true });
      await withTodayAsync(GUN, async () => {
        let d = yerlestir(await SP.Screens.gun.render());
        try{
          expect(!!d.querySelector('[data-act="dunku-sikayet"]')).toBe(true);
          const t = await sessiz(() => SP.Screens.gun.handle['dunku-sikayet']());
          const v = SP.Model.vitalsOf(GUN);
          expect(v.symptoms).toEqual({ 'bas-agrisi':2, yorgunluk:1 });
          expect(v.symptomsLogged).toBe(true);
          /* Dünün kaydı değişmez; kopya ayrı bir nesnedir. */
          expect(SP.Model.vitalsOf(DUN).symptoms === v.symptoms).toBe(false);
          d.remove(); d = yerlestir(await SP.Screens.gun.render());
          expect(!!d.querySelector('[data-act="dunku-sikayet"]')).toBe(false);
          await sessiz(() => t[0].o.undo());
          expect(SP.Model.vitalsOf(GUN).symptoms).toEqual({});
          expect(SP.Model.vitalsOf(GUN).symptomsLogged).toBe(false);
        }finally{ d.remove(); }
      });
      /* Dün şikâyet yoksa düğme yok; bugün «şikâyet yok» denmişse de yok. */
      resetState();
      pushVitals(DUN, { symptoms:{}, symptomsLogged:true });
      await withTodayAsync(GUN, async () => {
        const d = yerlestir(await SP.Screens.gun.render());
        try{ expect(!!d.querySelector('[data-act="dunku-sikayet"]')).toBe(false); }finally{ d.remove(); }
      });
      resetState();
      pushVitals(DUN, { symptoms:{ yorgunluk:1 }, symptomsLogged:true });
      pushVitals(GUN, { symptoms:{}, symptomsLogged:true });
      await withTodayAsync(GUN, async () => {
        const d = yerlestir(await SP.Screens.gun.render());
        try{ expect(!!d.querySelector('[data-act="dunku-sikayet"]')).toBe(false); }finally{ d.remove(); }
      });
    });

    it('kayıt vakti gelen hatırlatmayı kapatır: tartı «ölçüm»ü, su «su»yu; geri al işareti kaldırır', async () => {
      resetState();
      SP.S.hatirlat = { liste:[
        { id:'h-olcum', tur:'olcum', medId:null, saatler:['00:00'] },
        { id:'h-su', tur:'su', medId:null, saatler:['00:00', '23:59'] },
      ], yapildi:{}, bildirim:false };
      await withTodayAsync(GUN, () => bardakla(250, async () => {
        const yap = () => (SP.S.hatirlat.yapildi[GUN] || {});
        const d = yerlestir(await SP.Screens.today.render());
        try{
          d.querySelector('#v-weight').value = '77.4';
          const t = await sessiz(() => SP.Screens.today.handle['save-vitals']());
          expect(!!yap()['h-olcum@00:00']).toBe(true);
          expect(!!yap()['h-su@00:00']).toBe(false);
          await sessiz(() => t[0].o.undo());
          expect(!!yap()['h-olcum@00:00']).toBe(false);
          const s = await sessiz(() => SP.Screens.today.handle['su-ayarla']({ dataset:{ n:'2' } }));
          expect(!!yap()['h-su@00:00']).toBe(true);
          /* Saati gelmemiş hatırlatma kapanmaz. */
          expect(!!yap()['h-su@23:59']).toBe(false);
          await sessiz(() => s[0].o.undo());
          expect(!!yap()['h-su@00:00']).toBe(false);
        }finally{ d.remove(); }
      }));
    });

    /* HATA (2026-10-25): tek bardak vakti gelen BÜTÜN su hatırlatmalarını
       kapatıyordu. 10:00, 13:00, 16:00 ve 17:00'de bir bardak: kullanıcının
       yapmadığı üç «yapıldı» kaydı (hatirlat söz 4: «yapıldı» bir kayıttır).
       Her artış en çok bir işaret koyar: vakti gelmişlerin en sonuncusu. */
    it('su: her artış en çok bir hatırlatmayı kapatır (en son vakti gelen); geri al yalnız onu açar', async () => {
      resetState();
      SP.S.hatirlat = { liste:[{ id:'h-su', tur:'su', medId:null, saatler:['00:00', '00:01', '00:02', '23:59'] }],
        yapildi:{}, bildirim:false };
      await withTodayAsync(GUN, () => bardakla(250, async () => {
        const yap = () => Object.keys(SP.S.hatirlat.yapildi[GUN] || {}).sort();
        const ayarla = n => sessiz(() => SP.Screens.today.handle['su-ayarla']({ dataset:{ n:String(n) } }));
        const t1 = await ayarla(1);
        expect(yap()).toEqual(['h-su@00:02']);
        const t2 = await ayarla(2);
        expect(yap()).toEqual(['h-su@00:01', 'h-su@00:02']);
        /* Azalış işaret koymaz. */
        await ayarla(2);
        expect(yap()).toEqual(['h-su@00:01', 'h-su@00:02']);
        /* Geri al tam olarak kendi işaretini açar. */
        await sessiz(() => t2[0].o.undo());
        expect(yap()).toEqual(['h-su@00:02']);
        await sessiz(() => t1[0].o.undo());
        expect(yap()).toEqual([]);
        /* Atlama da tek artıştır: üç bardak birden bir işaret. */
        await ayarla(3);
        expect(yap()).toEqual(['h-su@00:02']);
      }));
    });
  });

  /* Seçim sayfasının minik özeti (hesap.js söz 16; kullanıcı, 2026-10-06):
     Bugün çizilince dönen kartlar özet olarak yazılır; örnek profilin
     verisi seçim sayfasına hiç gitmez. */
  describe('Bugün — seçim sayfası özeti', () => {
    it('Bugün çizilince özet yazılır; örnek profilde yazılmaz', async () => {
      const H = window.LIFEOS.HESAP;
      const sil = () => { document.cookie = 'lifeos_ozet_spi=; Path=/; Max-Age=0'; };
      const eski = SP.Ornek ? SP.Ornek.acik : null;
      sil();
      try{
        resetState();
        yerlestir(await SP.Screens.today.render()).remove();
        const o = H.ozetOku('spi');
        expect(!!o && o.satirlar.length > 0).toBe(true);
        expect(o.satirlar.every(x => typeof x.u === 'string' && x.u.length > 0)).toBe(true);
        sil();
        SP.Ornek.acik = () => true;
        yerlestir(await SP.Screens.today.render()).remove();
        expect(H.ozetOku('spi')).toBeNull();
      }finally{
        if(SP.Ornek) SP.Ornek.acik = eski;
        sil();
      }
    });
  });
})();
