/* Arka plan işleri yazılanı silmez (app.js arkaPlan, 2026-10-05).

   Kullanıcı bir şey yapmadan gelen işler — HKM'nin teklifleri (açılışta ve
   sekmeye dönünce), ofis ve günün brifingi, günün otomatik işleri,
   sinyaller, hedef ağı, tarayıcının kurulum teklifi — ekranı doğrudan
   render() ile baştan çiziyordu: #app yeniden kuruluyor, yazılıp
   kaydedilmemiş değer siliniyordu (gerçek AYS'de «Soru çöz» notu: bekleyen
   bir teklifle sekmeye dönünce ve brifing gelince boşaldı).

   Kanıtlanan sözler:
     1. Veri hemen konur; çizim kullanıcı yazmıyorken (brand/ortak/hesap.js
        cizIste). Alan gidince bir kez çizilir.
     2. Hesap dosyası yoksa çizim hemen yapılır (modül ona bağımlı değil).
     3. Sekmeye dönüş 30 sn dolmadan HKM'ye sormaz.

   Kalıp kingteklif.test.js «yoklama yazılanı silmez»: zamanlayıcı
   yakalanır, kirli alan input olayıyla kurulur, önce kontrol adımı. */

(function(){
  const { describe, it, expect } = R.Test;
  const S = R.S;
  const A = () => R.App.arkaPlan;
  const HESAP = () => window.LIFEOS.HESAP;

  const T1 = { id:'t1', kind:'focus.set', note:'Bu hafta paragrafa odaklan', payload:{} };
  const D1 = { id:'d1', state:'applying', kind:'kayit.add' };

  function kirliAlan(){
    const el = document.createElement('input');
    el.type = 'text';
    el.style.cssText = 'display:block;width:40px;height:20px';
    document.body.appendChild(el);
    el.value = 'yazdım';                                   // kullanıcı yazdı…
    el.dispatchEvent(new Event('input', { bubbles:true }));
    el.blur();                                             // …ve alandan çıktı
    return el;
  }

  /* Zamanlayıcı yakalanır, saplar konur; sonunda hepsi geri alınır.
     saplar: [[nesne, ad, değer], …] */
  async function ortamda(saplar, fn){
    const h = HESAP(), eski = h._ortam.zamanla, sonra = [];
    h._ortam.zamanla = f => { sonra.push(f); return 0; };
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const geri = saplar.map(([o, ad, v]) => { const e = o[ad]; o[ad] = v; return () => { o[ad] = e; }; });
    const ui = { i:S.ui.hkmIntents, d:S.ui.hkmDoubts };
    const alanlar = [];
    try{
      await fn({
        kirli:() => { const el = kirliAlan(); alanlar.push(el); return el; },
        bosalt:() => sonra.splice(0).forEach(f => f()),
      });
    }finally{
      alanlar.forEach(el => el.remove());
      geri.reverse().forEach(g => g());
      S.ui.hkmIntents = ui.i; S.ui.hkmDoubts = ui.d;
      h._ortam.zamanla = eski;
      h._sifirla();
    }
  }
  const kopya = l => l.map(x => Object.assign({}, x));
  const tik = () => new Promise(r => setTimeout(r, 0));

  describe('Arka plan — sekmeye dönüş yazılanı silmez', () => {
    it('HKM bağlı, teklif yok: dönüş ekranı çizmez', async () => {
      await ortamda([[R.Beacon, 'intents', async () => []]], async o => {
        let an = 1e12, cizim = 0;
        const hkm = A().hkm({ ciz:() => { cizim++; }, simdi:() => an });
        o.kirli();
        an += 31000;
        await hkm.donus();
        o.bosalt();
        expect(cizim).toBe(0);
      });
    });

    it('dönüşte gelen teklif hemen konur; kirli alan varken çizim bekler, alan gidince bir kez', async () => {
      await ortamda([[R.Beacon, 'intents', async () => kopya([T1])]], async o => {
        S.ui.hkmIntents = [];
        let an = 1e12, cizim = 0;
        const hkm = A().hkm({ ciz:() => { cizim++; }, simdi:() => an });
        an += 31000;
        await hkm.donus();
        expect(cizim).toBe(1);                                   // kimse yazmıyor: hemen
        const el = o.kirli();
        S.ui.hkmIntents = [];
        an += 31000;
        await hkm.donus();
        expect(S.ui.hkmIntents.map(n => n.id)).toEqual(['t1']);  // veri hemen…
        expect(cizim).toBe(1);                                   // …çizim bekler
        el.remove();                                             // kaydetti, form yeniden çizildi
        o.bosalt();
        expect(cizim).toBe(2);
      });
    });

    it('dönüş 30 sn dolmadan HKM\'ye sormaz', async () => {
      let soru = 0;
      await ortamda([[R.Beacon, 'intents', async () => { soru++; return []; }]], async () => {
        let an = 1e12;
        const hkm = A().hkm({ ciz:() => {}, simdi:() => an });
        an += 10000;
        await hkm.donus();
        expect(soru).toBe(0);
        an += 21000;
        await hkm.donus();
        expect(soru).toBe(1);
        an += 5000;
        await hkm.donus();
        expect(soru).toBe(1);
      });
    });
  });

  describe('Arka plan — açılıştaki işler yazılanı silmez', () => {
    it('teklif ve yarıda kalan iş hemen konur; ikisi tek çizim, yazı bitince', async () => {
      await ortamda([[R.Beacon, 'intents', async () => kopya([T1])],
        [R.Beacon, 'intentDoubts', async () => kopya([D1])]], async o => {
        S.ui.hkmIntents = []; S.ui.hkmDoubts = [];
        let cizim = 0;
        const el = o.kirli();
        await A().hkm({ ciz:() => { cizim++; } }).acilis();
        expect(S.ui.hkmIntents.map(n => n.id)).toEqual(['t1']);  // veri hemen…
        expect(S.ui.hkmDoubts.map(d => d.id)).toEqual(['d1']);
        expect(cizim).toBe(0);                                   // …çizim bekler
        el.remove();
        o.bosalt();
        expect(cizim).toBe(1);
      });
    });

    it('ofis yüklenince hemen; brifing yazarken gelirse çizim yazı bitince', async () => {
      let bitir = null;
      const brifing = new Promise(r => { bitir = r; });
      await ortamda([[R.Office, 'load', async () => ({})],
        [R.Office, 'settings', () => ({ autoBriefing:true })],
        [R.Office, 'dailyBriefing', () => brifing]], async o => {
        let cizim = 0;
        const is = A().ofis(() => { cizim++; });
        await tik();
        expect(cizim).toBe(1);                                   // kimse yazmıyor: hemen
        const el = o.kirli();
        bitir({ text:'Günün brifingi' });                        // dil modeli saniyeler sonra döndü
        await is;
        expect(cizim).toBe(1);                                   // çizim bekler
        el.remove();
        o.bosalt();
        expect(cizim).toBe(2);
      });
    });

    it('sinyaller, hedef ağı ve günün otomatik işleri de yazı bitince çizer; üçü tek çizim', async () => {
      await ortamda([[R.Signals, 'sync', async () => ({ changed:true })],
        [R.Hedefler, 'ag', { gonder:async () => ({ butce:{ dk:60 } }) }],
        [R.Auto, 'onDayOpen', async () => ['plan']]], async o => {
        let cizim = 0;
        const ciz = () => { cizim++; };
        await A().sinyaller(ciz);
        expect(cizim).toBe(1);                                   // kimse yazmıyor: hemen
        const el = o.kirli();
        await A().sinyaller(ciz);
        await A().hedefAg(ciz);
        await A().gunAcilisi(ciz);
        expect(cizim).toBe(1);
        el.remove();
        o.bosalt();
        expect(cizim).toBe(2);
      });
    });

    it('tarayıcının kurulum teklifi hemen saklanır; çizim yazı bitince', async () => {
      const olay = () => ({ engel:false, preventDefault(){ this.engel = true; }, prompt(){},
        userChoice:Promise.resolve({ outcome:'dismissed' }) });
      await ortamda([], async o => {
        let cizim = 0;
        const ciz = () => { cizim++; };
        try{
          A().kurulum(olay(), ciz);
          expect(cizim).toBe(1);                                 // kimse yazmıyor: hemen
          const el = o.kirli();
          const e = olay();
          A().kurulum(e, ciz);
          expect(e.engel).toBe(true);                            // tarayıcının kendi çubuğu açılmaz
          expect(R.App.canInstall()).toBe(true);                 // teklif hemen saklanır…
          expect(cizim).toBe(1);                                 // …çizim bekler
          el.remove();
          o.bosalt();
          expect(cizim).toBe(2);
        }finally{
          await R.App.promptInstall();                           // teklif bırakılır
        }
      });
    });

    it('hesap dosyası yoksa çizim hemen yapılır', async () => {
      const L = window.LIFEOS, H = L.HESAP;
      await ortamda([[R.Signals, 'sync', async () => ({ changed:true })]], async o => {
        let cizim = 0;
        o.kirli();
        L.HESAP = undefined;
        try{ await A().sinyaller(() => { cizim++; }); }
        finally{ L.HESAP = H; }
        expect(cizim).toBe(1);
      });
    });
  });
})();
