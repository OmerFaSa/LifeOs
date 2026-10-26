/* Günü kapat — ESP bağlantısı (KOLAY-PLANI Faz 1; çekirdek brand/ortak/gunukapat.js).

   Depo sahibi (2026-10-25): ölçüm satırları toplu onaylanmaz, ekrandaki tek
   satıra yazılır; planlanan dakika «tahmin» etiketiyle yazılır
   (`minutesCert:'estimated'`), düzeltilen değer ölçümdür.

   Kanıtlanan sözler:
     1. Satırlar: plandaki disiplin «<disiplin> · N dk» (kaynak plan); plan
        yoksa yedek öneri yok («öneri yok»); sırası gelen kart ölçüm satırıdır,
        toplu yazılmaz.
     2. «Hepsi doğru» planlı oturumu TAHMİN olarak yazar; tek «Geri al» siler.
     3. Dokunulmayan ya da işareti kaldırılan satır yazılmaz; gün boş kalır.
     4. Tek satır (ölçüm) + «Hepsi doğru» birlikte, tek geri al; satırda aynı
        disiplin ölçüldüyse plan tahmini ikinci kez yazılmaz.
     5. «Her zamanki» yalnız son 7 günün en az 4'ünde.
     6. Bugün'den açılır; «Günü düzenle» erişilebilir kalır.
     7. Bugün'ün düğme sayısı artmaz. */

(function(){
  const { describe, it, expect, resetState, pushSession, pushCard, withTodayAsync } = ESP.Test;
  const K = () => window.LIFEOS.GUNUKAPAT;
  const G = () => window.LIFEOS.GIRIS;
  const T = () => ESP.Screens.today;
  const bugun = () => ESP.U.todayISO();
  const gunOnce = n => ESP.U.iso(ESP.U.addDays(ESP.U.parse(bugun()), -n));

  function planKur(disc, dk){
    const d = ESP.DISCIPLINE_BY_ID[disc];
    ESP.S.weekPlan = { from:bugun(), cert:'derived', days:[{ date:bugun(), disc, label:d.label, route:d.route,
      minutes:dk, items:[] }] };
  }
  /* Kurulum: bildirim ve yenileme sahte (test sayfasında kabuk yok). */
  function kur(){
    const bildirilen = [];
    K()._sifirla();
    ESP.App.gunuKapatKur({ bildir:(m, g) => bildirilen.push([m, typeof g]), yenile:() => {} });
    return bildirilen;
  }
  /* Çekirdek testindeki gibi: kutular kurulmamış bırakılır (kurulu kalırsa
     sonraki Bugün testleri fazladan düğme sayar). */
  function bitir(){ K()._sifirla(); G()._sifirla(); }
  const satir = (id) => T().gunuKapatSatirlari(bugun()).find(s => s.id === id);
  const oturumlar = () => ESP.Model.sessionsOf(bugun()).map(s => [s.disc, s.minutes, s.minutesCert]);

  describe('Günü kapat — ESP satırları', () => {
    it('plan satırı «disiplin · N dk» (plan); plan yoksa öneri yok; kart satırı ölçümdür', () => {
      resetState();
      planKur('lang', 30);
      pushCard({ front:'a', back:'b' }); pushCard({ front:'c', back:'d' }); pushCard({ front:'e', back:'f', due:'2999-01-01' });
      const p = satir('plan');
      expect(p.tur).toBe('beyan');
      expect(p.oneri).toEqual({ metin:'Yabancı Dil · 30 dk', kaynak:'plan' });
      expect(typeof p.yaz).toBe('function');
      const k = satir('kart');
      expect(k.tur).toBe('olcum');
      expect(k.ipucu).toBe('2 kart sırada · tekrar ekranında');
      expect(k.yaz === undefined && k.oneri === undefined).toBe(true);

      /* Plan yok: yedek öneri yok (koçun reçetesi plan sayılmaz). */
      ESP.S.weekPlan = null;
      const l = T().gunuKapatSatirlari(bugun());
      expect(l.filter(s => s.oneri).length).toBe(0);
      expect(satir('plan').yaz === undefined).toBe(true);
      kur();
      try{ expect(K().cizim(bugun())).toContain('Önerisi yok'); }finally{ bitir(); }

      /* Plandaki disipline bugün oturum girildiyse satır «kaydedildi». */
      planKur('lang', 30);
      pushSession(bugun(), 'lang', 20);
      expect(satir('plan').yazildi).toBe(true);
      expect(T().gunuKapatSatirlari(bugun()).filter(s => s.tur === 'beyan' && !s.yazildi && s.oneri).length).toBe(0);
    });

    it('«Hepsi doğru» planlı oturumu tahmin olarak yazar; tek geri al siler', async () => {
      resetState();
      planKur('music', 25);
      const bildirilen = kur();
      try{
        expect(K().yazilacaklar(bugun()).map(s => s.id)).toEqual(['plan']);
        const r = await K().kapat(bugun(), {});
        expect(r.ok).toBe(true);
        expect(oturumlar()).toEqual([['music', 25, 'estimated']]);
        expect(bildirilen[0][1]).toBe('function');
        expect(satir('plan').yazildi).toBe(true);
        await r.geriAl();
        expect(oturumlar()).toEqual([]);
        expect(ESP.Model.dayHasEntry(ESP.S.days[bugun()])).toBe(false);
      }finally{ bitir(); }
    });

    it('dokunulmayan ya da işareti kaldırılan satır yazılmaz; ölçüm satırı hiç yazılmaz', async () => {
      resetState();
      planKur('lang', 30);
      [1, 2, 3, 4].forEach(n => pushSession(gunOnce(n), 'music', 20));
      pushCard({ front:'a', back:'b' });
      kur();
      const kap = document.createElement('div');
      try{
        kap.innerHTML = K().cizim(bugun());
        document.body.appendChild(kap);
        expect(kap.querySelector('[data-gk-sec="kart"]')).toBe(null);
        const c = kap.querySelector('[data-gk-sec="plan"]');
        c.checked = false;
        c.dispatchEvent(new Event('change', { bubbles:true }));
        expect(K().yazilacaklar(bugun()).map(s => s.id)).toEqual(['kalip-music']);
        const r = await K().kapat(bugun(), {});
        expect(r.ok).toBe(true);
        expect(oturumlar()).toEqual([['music', 20, 'estimated']]);
        expect(ESP.S.cards[0].reps).toBe(0);
        await r.geriAl();
      }finally{ kap.remove(); bitir(); }

      /* Önerisi olmayan gün: hiçbir şey yazılmaz, gün «girilmedi» kalır. */
      resetState();
      kur();
      try{
        const r = await K().kapat(bugun(), {});
        expect(r.ok).toBe(false);
        expect(ESP.Model.dayHasEntry(ESP.S.days[bugun()])).toBe(false);
      }finally{ bitir(); }
    });

    it('tek satır + «Hepsi doğru» birlikte yazılır, tek geri al; satırdaki ölçüm planın tahmininin yerine geçer', async () => {
      resetState();
      planKur('lang', 30);
      kur();
      ESP.App.girisKur({ yenile:() => {} });
      try{
        const r = await K().kapat(bugun(), { olcumMetni:'20 dk gitar' });
        expect(r.ok).toBe(true);
        expect(oturumlar()).toEqual([['music', 20, 'measured'], ['lang', 30, 'estimated']]);
        await r.geriAl();
        expect(oturumlar()).toEqual([]);

        /* Aynı disiplin satırda ölçüldü: plan tahmini ikinci kez yazılmaz. */
        const r2 = await K().kapat(bugun(), { olcumMetni:'45 dk ingilizce' });
        expect(r2.ok).toBe(true);
        expect(oturumlar()).toEqual([['lang', 45, 'measured']]);
        await r2.geriAl();
        expect(oturumlar()).toEqual([]);

        /* Anlaşılmayan parça: hiçbir şey yazılmaz (plan satırı da). */
        const r3 = await K().kapat(bugun(), { olcumMetni:'20 dk gitar, falan filan' });
        expect(r3.ok).toBe(false);
        expect(oturumlar()).toEqual([]);
      }finally{ bitir(); }
    });

    it('«her zamanki» yalnız son 7 günün en az 4\'ünde; plandaki disiplin için ayrı satır yok', () => {
      resetState();
      [1, 3, 5].forEach(n => pushSession(gunOnce(n), 'reading', 30));
      pushSession(gunOnce(9), 'reading', 30);                 // pencerenin dışında
      expect(satir('kalip-reading')).toBe(undefined);
      pushSession(gunOnce(6), 'reading', 15);
      pushSession(gunOnce(6), 'reading', 30);                 // aynı gün bir kez sayılır
      const k = satir('kalip-reading');
      expect(k.oneri).toEqual({ metin:ESP.DISCIPLINE_BY_ID.reading.label + ' · 30 dk', kaynak:'kalip' });
      planKur('reading', 40);
      expect(satir('kalip-reading')).toBe(undefined);
      expect(satir('plan').oneri.metin).toBe(ESP.DISCIPLINE_BY_ID.reading.label + ' · 40 dk');
    });

    it('«her zamanki» kendi tahmininden beslenmez: yalnız ölçülmüş dakika', () => {
      resetState();
      [1, 2, 3, 4].forEach(n => pushSession(gunOnce(n), 'reading', 30, { minutesCert:'estimated' }));
      expect(satir('kalip-reading')).toBe(undefined);
      [1, 2, 3].forEach(n => pushSession(gunOnce(n), 'music', 20));
      pushSession(gunOnce(4), 'music', 40, { minutesCert:'estimated' });
      expect(satir('kalip-music')).toBe(undefined);
      pushSession(gunOnce(5), 'music', 20);
      expect(satir('kalip-music').oneri.metin).toBe(ESP.DISCIPLINE_BY_ID.music.label + ' · 20 dk');
    });

    it('planlı disiplinin boş «dk» kutusu: yazılan dakika ölçümdür, plan tahmini atlanır; boş kutu yazmaz', async () => {
      resetState();
      planKur('lang', 30);
      pushCard({ front:'a', back:'b' });
      const o = satir('olcum-lang');
      expect([o.tur, o.alanlar.length, o.alanlar[0].birim, o.metin(['45'])]).toEqual(['olcum', 1, 'dk', '45 dk dil']);
      kur();
      ESP.App.girisKur({ yenile:() => {} });
      const kap = document.createElement('div');
      try{
        kap.innerHTML = K().cizim(bugun());
        const kutu = kap.querySelector('[data-gk-alan="olcum-lang:0"]');
        expect(!!kutu && kutu.value === '' && kutu.getAttribute('placeholder') === '').toBe(true);   // önceden doldurulmaz
        expect(kutu.closest('.gk__satir').querySelector('.gk__birim').textContent).toBe('dk');
        expect(kap.querySelector('[data-gk-alan^="kart"]')).toBe(null);                          // kart tekrarı kutusuz

        /* Kutu 45 → tek ölçülmüş oturum; plan tahmini atlanır (satır beyanlardan ÖNCE yazılır). */
        const r = await K().kapat(bugun(), { alanlar:{ 'olcum-lang:0':'45' } });
        expect(r.ok).toBe(true);
        expect(oturumlar()).toEqual([['lang', 45, 'measured']]);
        expect(satir('olcum-lang')).toBe(undefined);
        await r.geriAl();
        expect(oturumlar()).toEqual([]);

        /* Boş kutu yazılmaz: yalnız işaretli tahmin yazılır. */
        const r2 = await K().kapat(bugun(), { alanlar:{ 'olcum-lang:0':'' } });
        expect(oturumlar()).toEqual([['lang', 30, 'estimated']]);
        await r2.geriAl();

        /* Planda süre yok: tahmin yok, kutu var; boş kutu hiçbir şey yazmaz. */
        planKur('lang', 0);
        expect(!!satir('olcum-lang')).toBe(true);
        const r3 = await K().kapat(bugun(), { alanlar:{ 'olcum-lang:0':' ' } });
        expect(r3.ok).toBe(false);
        expect(ESP.Model.dayHasEntry(ESP.S.days[bugun()])).toBe(false);
      }finally{ bitir(); }
    });

    it('her disiplinin kutu sözcüğü ayrıştırıcıdan o disipline döner; sözcüğü olmayan kutu almaz', () => {
      resetState();
      Object.keys(ESP.DISCIPLINE_BY_ID).forEach(d => {
        planKur(d, 20);
        const o = satir('olcum-' + d);
        if(!o) return;
        const r = ESP.Parse.parseSession(o.metin(['20']));
        expect(d + ':' + r.rows.map(x => x.disc + '/' + x.minutes).join(',') + ':' + r.unmatched.length).toBe(d + ':' + d + '/20:0');
      });
      planKur('lang', 20);
      expect(!!satir('olcum-lang')).toBe(true);
    });

    it('gece yarısını geçen sayfa eski güne yazmaz; ölçüm satırı da geri alınır', async () => {
      resetState();
      const dun = gunOnce(1);
      await withTodayAsync(dun, async () => { planKur('music', 25); });
      kur();
      ESP.App.girisKur({ yenile:() => {} });
      try{
        expect(K().yazilacaklar(dun).map(s => s.id)).toEqual(['plan']);
        const r = await K().kapat(dun, {});
        expect(r.ok).toBe(false);
        expect(r.neden).toContain('gün değişti');
        expect(ESP.Model.sessionsOf(dun)).toEqual([]);
        const r2 = await K().kapat(dun, { olcumMetni:'20 dk ingilizce' });
        expect(r2.ok).toBe(false);
        expect(ESP.Model.sessionsOf(dun)).toEqual([]);
        expect(oturumlar()).toEqual([]);
      }finally{ bitir(); }
    });

    it('ölçüm satırı hepsi ya da hiçbiri: ikinci oturum yazılamazsa birincisi de silinir', async () => {
      resetState();
      kur();
      ESP.App.girisKur({ yenile:() => {} });
      const asil = ESP.Model.addSession;
      let n = 0;
      /* İkinci yazım kaydedilemez: oturum belleğe girer, kayıt patlar (addSession'ın saveDay hatası gibi). */
      ESP.Model.addSession = async (g, p) => {
        if(++n === 2){ ESP.Model.ensureDay(g).sessions.push({ id:'yarim', disc:p.disc, minutes:p.minutes, minutesCert:'measured' }); throw new Error('disk dolu'); }
        return asil(g, p);
      };
      try{
        const r = await K().kapat(bugun(), { olcumMetni:'45 dk gitar, 20 dakika kelime' });
        expect(r.ok).toBe(false);
        expect(r.neden).toContain('disk dolu');
        expect(oturumlar()).toEqual([]);
        n = 0;
        let hata = null;
        try{ await G().onizle('45 dk gitar, 20 dakika kelime').kaydet(); }catch(e){ hata = e; }
        expect(hata instanceof Error).toBe(true);
        expect(oturumlar()).toEqual([]);
      }finally{ ESP.Model.addSession = asil; bitir(); }
    });
  });

  describe('Günü kapat — tahmin ölçüm diye gösterilmez', () => {
    const dom = h => { const d = document.createElement('div'); d.innerHTML = String(h); return d; };
    const karisik = () => { resetState(); pushSession(bugun(), 'lang', 30); pushSession(bugun(), 'music', 20, { minutesCert:'estimated' }); };

    /* KOLAY Faz 2: karolar, dönen kart ve pano kartı Bugün'den Analiz'in başına taşındı. */
    it('Analiz’deki «Süre» karosu, dönen «Günün dakikası», pano kartı ve Bugün’ün taban rakamı tahmini söyler', async () => {
      karisik();
      const d = dom(await ESP.Screens.analytics.render());
      expect(Array.from(d.querySelectorAll('.kapak__sayi[data-kesinlik="estimated"]')).map(x => x.getAttribute('data-simge'))).toEqual(['sure']);
      expect(Array.from(d.querySelectorAll('.pk__yuva')).map(x => x.textContent)).toContain('tahmin içerir');
      expect(d.querySelectorAll('.donen [data-kesinlik="estimated"]').length > 0).toBe(true);
      expect(String(await T().render())).toContain('tahmin içerir');

      /* Yalnız ölçülmüş gün: hiçbir yerde tahmin yok. */
      resetState();
      pushSession(bugun(), 'lang', 30);
      expect(String(await T().render()).indexOf('tahmin içerir') < 0).toBe(true);
      const d2 = dom(await ESP.Screens.analytics.render());
      expect(Array.from(d2.querySelectorAll('.pk__yuva')).map(x => x.textContent)).toContain('ölçüldü');
      expect(d2.querySelectorAll('[data-kesinlik="estimated"]').length).toBe(0);
    });

    it('İnceleme «Toplam süre» tahmin içeren haftada «tahmin»dir', () => {
      karisik();
      expect(ESP.Inceleme.rapor().hafta.find(s => s.ad === 'Toplam süre').etiket).toBe('tahmin');
      resetState();
      pushSession(bugun(), 'lang', 30);
      expect(ESP.Inceleme.rapor().hafta.find(s => s.ad === 'Toplam süre').etiket).toBe('ölçüldü');
    });
  });

  describe('Günü kapat — Bugün', () => {
    const dugmeler = h => { const d = document.createElement('div'); d.innerHTML = String(h); return d; };

    it('Bugün’deki «Günü kapat» alt sayfayı açar; «Günü düzenle» erişilebilir kalır', async () => {
      resetState();
      planKur('lang', 30);
      kur();
      ESP.App.girisKur({ yenile:() => {} });
      const d = dugmeler(await T().render());
      document.body.appendChild(d);
      try{
        const ac = d.querySelector('[data-act="gunu-kapat"]');
        expect(!!ac).toBe(true);
        expect(!!ac.closest('.ledger')).toBe(true);
        expect(!!d.querySelector('[data-act="go"][data-route="gun"]')).toBe(true);
        await T().handle['gunu-kapat'](ac);
        const sh = document.getElementById('sheet');
        expect(!!sh).toBe(true);
        expect(sh.querySelector('[role="dialog"]').getAttribute('aria-label')).toBe('Günü kapat');
        expect(!!sh.querySelector('[data-gunukapat] #gk-olcum')).toBe(true);
        expect(!!sh.querySelector('.gk__kapat')).toBe(true);
        expect(sh.querySelector('.gk__girdi').getAttribute('placeholder')).toBe('Örneğin: 45 dk ingilizce');
        expect(!!sh.querySelector('[data-route="gun"]')).toBe(true);
      }finally{ ESP.UI.closeSheet(); d.remove(); bitir(); }
    });

    /* KOLAY Faz 2: eskiden dönen kartın bağı düşerek denkleşiyordu; dönen
       kartlar Analiz'e taşındı. Söz: eklenen tek düğme «Günü kapat», Bugün
       bütçenin (14) altında. */
    it('düğme bütçesi: «Günü kapat» tek ek düğmedir; Bugün bütçenin altında', async () => {
      resetState();
      for(const oturum of [false, true]){
        if(oturum) pushSession(bugun(), 'lang', 30);
        bitir();
        const once = dugmeler(await T().render()).querySelectorAll('button, a.btn').length;
        kur();
        try{
          const d = dugmeler(await T().render());
          expect(!!d.querySelector('[data-act="gunu-kapat"]')).toBe(true);
          expect(d.querySelectorAll('button, a.btn').length).toBe(once + 1);
          expect(d.querySelectorAll('button, a.btn').length + dugmeler(T().kapak()).querySelectorAll('button, a.btn').length <= 14).toBe(true);
        }finally{ bitir(); }
      }
    });

    it('Bugün üç blok: Şimdi (kapak, tek birincil eylem), Ne yaptın?, Gün; özet kartları Analiz’in başında', async () => {
      resetState();
      planKur('lang', 30);
      pushSession(bugun(), 'music', 20);
      kur();
      try{
        const k = dugmeler(T().kapak());
        expect(k.querySelectorAll('.kapak__sayi').length).toBe(0);
        const n = ESP.Planner.nextAction();
        const birincil = Array.from(k.querySelectorAll('.btn--primary'));
        expect(birincil.length).toBe(n.rank && n.route && n.route !== 'today' ? 1 : 0);
        if(birincil.length) expect(birincil[0].textContent.trim()).toBe(String(n.title).split(' — ')[0]);
        const d = dugmeler(await T().render());
        expect(Array.from(d.querySelectorAll('.bugun__alan')).map(x => x.getAttribute('aria-label'))).toEqual(['Ne yaptın?', 'Gün']);
        expect(!!d.querySelector('[aria-label="Gün"] .ledger [data-act="gunu-kapat"]')).toBe(true);
        ['.kahraman', '.pk-ust', '.donen', '.kapak__sayi', '[aria-label="Özet"]', '[aria-label="Öneri"]'].forEach(s => expect(s + ':' + !!d.querySelector(s)).toBe(s + ':false'));
        expect(d.textContent.indexOf('Sıradaki işi aç')).toBe(-1);
        expect(d.textContent.indexOf('Planda bugün')).toBe(-1);
        expect(String(await ESP.Screens.gun.render())).toContain('Planda bugün');
        const a = dugmeler(await ESP.Screens.analytics.render());
        expect(a.querySelectorAll('.kapak__sayi').length).toBe(3);
        expect(!!a.querySelector('.pk-ust') && !!a.querySelector('[aria-label="Özet"] .donen')).toBe(true);
        expect(a.querySelector('h1')).toBe(null);
      }finally{ bitir(); }

      /* Boş profil: cümle, giriş kutusu ve boş gün kartı «Günü kapat»la. */
      resetState();
      kur();
      try{
        const d = dugmeler(await T().render());
        expect(d.textContent).toContain('henüz oturum girilmedi');
        expect(!!d.querySelector('[data-act="gunu-kapat"]')).toBe(true);
      }finally{ bitir(); }
    });
  });
  /* 2026-10-25 depo sahibi: XP, rozet ve müfredat sayaçları yalnız ölçülmüş
     dakikayı sayar; Günü kapat'ın tahmini oturumu sayaca girmez. Kral'ın
     «Toplam süre» kartı tahmin içeriyorsa «tahmin» der. */
  describe('Sayaçlar yalnız ölçülmüş dakikayı sayar', () => {
    it('ölçülmüş dakika: rozet, XP, müfredat tahmini saymaz; Kral kartı tahmini söyler', async () => {
      await withTodayAsync('2026-03-10', async () => {
        resetState();
        const t = ESP.U.todayISO();
        pushSession(t, 'lang', 30);
        pushSession(t, 'lang', 45, { minutesCert:'estimated' });
        expect(ESP.Model.minutesOf(t, 'lang')).toBe(75);
        expect(ESP.Model.olculenDakika(t, 'lang')).toBe(30);
        expect(ESP.Model.olculenDakika(t)).toBe(30);
        expect(ESP.BasarimSayim.gunluk(t).dakika).toBe(30);
        expect(ESP.XPSayim.gunluk(t)['esp.oturum']).toBe(30);
        expect(ESP.Curriculum.measure('lang.minutes30').value).toBe(30);
        const k = ESP.App.kralIstatistik().find(x => x.ad === 'Toplam süre · 30 gün');
        expect([k.deger, k.etiket]).toEqual([75, 'tahmin']);
        resetState();
        pushSession(t, 'lang', 45, { minutesCert:'estimated' });
        expect(ESP.Model.olculenDakika(t, 'lang')).toBe(null);
        expect(ESP.Curriculum.measure('lang.minutes30').cert).toBe('missing');
        pushSession(t, 'lang', 20);
        expect(ESP.App.kralIstatistik().find(x => x.ad === 'Toplam süre · 30 gün').etiket).toBe('tahmin');
        resetState();
        pushSession(t, 'lang', 20);
        expect(ESP.App.kralIstatistik().find(x => x.ad === 'Toplam süre · 30 gün').etiket).toBe('ölçüldü');
      });
    });
  });
})();
