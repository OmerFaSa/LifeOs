/* Arka plan işleri yazılanı silmez (app.js arkaPlan, 2026-10-05).

   Kullanıcı bir şey yapmadan gelen işler — HKM'nin teklifleri ve King'in
   bildirimleri (açılışta ve sekmeye dönünce), ofis ve günün brifingi,
   sinyaller, hedef ağı — ekranı doğrudan render() ile baştan çiziyordu:
   #app yeniden kuruluyor, Bugün'de yazılıp kaydedilmemiş değer (#v-sleep)
   siliniyor, sonra basılan «Kaydet» hiçbir şey yazmıyordu. En sık yol:
   uykuyu yaz, başka uygulamaya geç, 30 sn sonra dön — HKM bağlıyken boş
   bildirim listesi de ekranı çiziyordu.

   Kanıtlanan sözler:
     1. Veri (S.ui.*) hemen konur; çizim kullanıcı yazmıyorken
        (brand/ortak/hesap.js cizIste). Alan gidince bir kez çizilir.
     2. Değişmeyen bildirim listesi ekranı çizmez; boşalan liste (başka
        yerde okundu) veriden hemen düşer.
     3. Hesap dosyası yoksa çizim hemen yapılır (modül ona bağımlı değil).
     4. Sekmeye dönüş 30 sn dolmadan HKM'ye sormaz.

   Kalıp kingteklif.test.js «yoklama yazılanı silmez»: zamanlayıcı
   yakalanır, kirli alan input olayıyla kurulur, önce kontrol adımı. */

(function(){
  const { describe, it, expect } = SP.Test;
  const S = SP.S;
  const A = () => SP.App.arkaPlan;
  const HESAP = () => window.LIFEOS.HESAP;

  const T1 = { id:'t1', kind:'focus.set', note:'Bu hafta uykuya odaklan', payload:{} };
  const B1 = { id:1, tur:'bitti', metin:'İş emri #1 bitti.', tarih:'2026-10-05T10:00', emir:null };
  const B2 = { id:2, tur:'hazir', metin:'İş emri #2 hazır.', tarih:'2026-10-05T10:05', emir:null };
  const D1 = { id:'d1', state:'applying', kind:'kayit.add' };

  function kirliAlan(){
    const el = document.createElement('input');
    el.type = 'number';
    el.style.cssText = 'display:block;width:40px;height:20px';
    document.body.appendChild(el);
    el.value = '7.5';                                      // kullanıcı yazdı…
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
    const ui = { i:S.ui.hkmIntents, b:S.ui.hkmBildirim, d:S.ui.hkmDoubts };
    const alanlar = [];
    try{
      await fn({
        kirli:() => { const el = kirliAlan(); alanlar.push(el); return el; },
        bosalt:() => sonra.splice(0).forEach(f => f()),
      });
    }finally{
      alanlar.forEach(el => el.remove());
      geri.reverse().forEach(g => g());
      S.ui.hkmIntents = ui.i; S.ui.hkmBildirim = ui.b; S.ui.hkmDoubts = ui.d;
      h._ortam.zamanla = eski;
      h._sifirla();
    }
  }
  const kopya = l => l.map(x => Object.assign({}, x));
  const tik = () => new Promise(r => setTimeout(r, 0));

  describe('Arka plan — sekmeye dönüş yazılanı silmez', () => {
    it('HKM bağlı, bildirim yok: dönüş ekranı çizmez, yazılan durur', async () => {
      await ortamda([[SP.Beacon, 'intents', async () => []],
        [SP.Plan, 'bildirimleriCek', async () => []]], async o => {
        S.ui.hkmBildirim = [];
        let an = 1e12, cizim = 0;
        const hkm = A().hkm({ ciz:() => { cizim++; }, simdi:() => an });
        const el = o.kirli();
        an += 31000;                                             // başka uygulamadan döndü
        await hkm.donus();
        expect(cizim).toBe(0);
        el.remove();                                             // kaydetti, form yeniden çizildi
        o.bosalt();
        expect(cizim).toBe(0);                                   // değişen yok: hiç çizilmez
        expect(S.ui.hkmBildirim).toEqual([]);
      });
    });

    it('yeni bildirim hemen konur; kirli alan varken çizim bekler, alan gidince bir kez', async () => {
      let cevap = [B1];
      await ortamda([[SP.Beacon, 'intents', async () => []],
        [SP.Plan, 'bildirimleriCek', async () => kopya(cevap)]], async o => {
        S.ui.hkmBildirim = [];
        let an = 1e12, cizim = 0;
        const hkm = A().hkm({ ciz:() => { cizim++; }, simdi:() => an });
        an += 31000;
        await hkm.donus();
        expect(cizim).toBe(1);                                   // kimse yazmıyor: hemen
        const el = o.kirli();
        cevap = [B1, B2];
        an += 31000;
        await hkm.donus();
        expect(S.ui.hkmBildirim.map(b => b.id)).toEqual([1, 2]); // veri hemen…
        expect(cizim).toBe(1);                                   // …çizim bekler
        el.remove();
        o.bosalt();
        expect(cizim).toBe(2);
        cevap = [];                                              // başka yerde okundu
        an += 31000;
        await hkm.donus();
        expect(S.ui.hkmBildirim).toEqual([]);                    // listeden hemen düşer
        expect(cizim).toBe(3);
      });
    });

    it('dönüşte gelen teklif hemen konur; çizim yazı bitince', async () => {
      await ortamda([[SP.Beacon, 'intents', async () => kopya([T1])],
        [SP.Plan, 'bildirimleriCek', async () => null]], async o => {
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
        el.remove();
        o.bosalt();
        expect(cizim).toBe(2);
      });
    });

    it('dönüş 30 sn dolmadan HKM\'ye sormaz', async () => {
      let soru = 0;
      await ortamda([[SP.Beacon, 'intents', async () => { soru++; return []; }],
        [SP.Plan, 'bildirimleriCek', async () => { soru++; return []; }]], async () => {
        let an = 1e12;
        const hkm = A().hkm({ ciz:() => {}, simdi:() => an });
        an += 10000;
        await hkm.donus();
        expect(soru).toBe(0);
        an += 21000;
        await hkm.donus();
        expect(soru).toBe(2);
        an += 5000;
        await hkm.donus();
        expect(soru).toBe(2);
      });
    });
  });

  describe('Arka plan — açılıştaki işler yazılanı silmez', () => {
    it('teklif, bildirim ve yarıda kalan iş hemen konur; üçü tek çizim, yazı bitince', async () => {
      await ortamda([[SP.Beacon, 'intents', async () => kopya([T1])],
        [SP.Plan, 'bildirimleriCek', async () => kopya([B1])],
        [SP.Beacon, 'intentDoubts', async () => kopya([D1])]], async o => {
        S.ui.hkmIntents = []; S.ui.hkmBildirim = []; S.ui.hkmDoubts = [];
        let cizim = 0;
        const el = o.kirli();
        await A().hkm({ ciz:() => { cizim++; } }).acilis();
        expect(S.ui.hkmIntents.map(n => n.id)).toEqual(['t1']);  // veri hemen…
        expect(S.ui.hkmBildirim.map(b => b.id)).toEqual([1]);
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
      await ortamda([[SP.Office, 'load', async () => ({})],
        [SP.Office, 'settings', () => ({ autoBriefing:true })],
        [SP.Office, 'dailyBriefing', () => brifing]], async o => {
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

    it('sinyaller ve hedef ağı da yazı bitince çizer; ikisi tek çizim', async () => {
      await ortamda([[SP.Signals, 'sync', async () => ({ changed:true })],
        [SP.Hedefler, 'ag', { gonder:async () => ({ butce:{ dk:60 } }) }]], async o => {
        let cizim = 0;
        const ciz = () => { cizim++; };
        await A().sinyaller(ciz);
        expect(cizim).toBe(1);                                   // kimse yazmıyor: hemen
        const el = o.kirli();
        await A().sinyaller(ciz);
        await A().hedefAg(ciz);
        expect(cizim).toBe(1);
        el.remove();
        o.bosalt();
        expect(cizim).toBe(2);
      });
    });

    it('hesap dosyası yoksa çizim hemen yapılır', async () => {
      const L = window.LIFEOS, H = L.HESAP;
      await ortamda([[SP.Signals, 'sync', async () => ({ changed:true })]], async o => {
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
