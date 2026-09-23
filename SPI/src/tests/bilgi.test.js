/* SPİ bilgisi (core/bilgi.js, Part 8c-2). Kanıtladığı sözler: kayıt SPİ'nin
   KENDİ koduyla sınanır (enerji tutarlılığı, aralık, eşleşme); eksik mikro
   besin sıfır yazılmaz; fiyatın TL/kg'sini ve ortancasını SPİ hesaplar, fiş
   önce gelir; yer listesi eklenir; hepsi geri alınır; isteğe sağlık verisi
   gitmez; teklif onaydan önce önizlenir. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const Bi = () => SP.Bilgi;

  function besinKaydi(patch){
    return Object.assign({ id:7, tur:'arastirma', baslik:'Kinoa besin değerleri', dogruluk:'kaynakli',
      created_at:'2026-09-20T10:00:00',
      govde:{ tur:'besin', ad:'Kinoa (çiğ)', istenen:'kinoa',
        deger:{ kcal:368, p:14.1, f:6.1, c:64.2, sat:9.9, fib:7, sugar:null },
        micro:{ iron:4.6, magnesium:197, uydurma:5, calcium:-3 },
        porsiyonlar:[{ ad:'1 su bardağı', g:170 }, { ad:'x', g:10 }],
        kaynaklar:[{ n:1, url:'https://ornek.org' }] } }, patch || {});
  }
  function fiyatKaydi(){
    return { id:8, tur:'arastirma', baslik:'Tavuk göğsü fiyatı', dogruluk:'kaynakli',
      created_at:'2026-09-21T10:00:00',
      govde:{ tur:'fiyat', ad:'tavuk göğsü', tl_kg:1,
        fiyatlar:[{ market:'A', tl:289.9, miktar_g:1000, tl_kg:1, tarih:'2026-09' },
          { market:'B', tl:150, miktar_g:500, tarih:'2026-09-15' },
          { market:'C', tl:99, miktar_g:0 }] } };
  }
  function yerKaydi(){
    return { id:9, tur:'arastirma', baslik:'Spor salonu listesi', dogruluk:'kaynakli',
      created_at:'2026-09-22T10:00:00',
      govde:{ tur:'yer', ad:'spor salonu', semt:'Kadıköy', sehir:'İstanbul',
        yerler:[{ ad:'Salon A', semt:'Moda', fiyat_tl:1500, donem:'aylık' },
          { ad:'Salon B', fiyat_tl:null, donem:'aylık' }, { ad:'salon a' }] } };
  }

  async function withHkm(kayitlar, fn){
    const eski = window.fetch;
    const cagri = [];
    window.fetch = function(url, opt){
      cagri.push({ url, opt });
      const m = /\/api\/bam\/kayit\/(\d+)$/.exec(url);
      const k = m && kayitlar[m[1]];
      if(m) return Promise.resolve({ status:k ? 200 : 404, json:async () => (k ? { kayit:k } : {}) });
      if(/\/api\/king\/emir$/.test(url)){
        return Promise.resolve({ status:200, json:async () => ({ ok:true, yeni:true, emir:{ id:42 } }) });
      }
      if(/\/take$/.test(url)){
        return Promise.resolve({ status:200, json:async () => ({ intents:kayitlar.__kuyruk || [] }) });
      }
      return Promise.resolve({ status:200, json:async () => ({}) });
    };
    await SP.Beacon.save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' });
    try{ await fn(cagri); }
    finally{
      window.fetch = eski;
      await SP.Beacon.save({ enabled:false, token:'' });
    }
  }

  describe('SPİ bilgisi — sınama', () => {
    it('besin: SPİ kendi koduyla sınar; eksik mikro sıfır yazılmaz', () => {
      resetState();
      const s = Bi().sina('besin.add', besinKaydi(), { kayit_id:7 });
      expect(s.ok).toBe(true);
      const f = s.yazilacak.food;
      expect([f.name, f.kcal, f.p, f.f, f.c]).toEqual(['Kinoa (çiğ)', 368, 14.1, 6.1, 64.2]);
      expect(f.sat).toBe(null);                         /* doymuş yağ > yağ: boş */
      expect(f.micro).toEqual({ iron:4.6, magnesium:197 });
      expect('calcium' in f.micro).toBe(false);
      expect(f.portions).toEqual([{ label:'1 su bardağı', g:170 }]);
      expect([f.bam.kayitId, f.bam.dogruluk, f.id.slice(0, 2)]).toEqual([7, 'kaynakli', 'u-']);
      expect(s.onizleme.satirlar[1]).toContain('11 tanesi bilinmiyor');
    });

    it('besin: tutmayan enerji, yanlış kimlik ve yanlış tür reddedilir', () => {
      resetState();
      const k = besinKaydi();
      k.govde.deger.kcal = 900;
      expect(Bi().sina('besin.add', k, { kayit_id:7 }).why).toContain('Enerji');
      expect(Bi().sina('besin.add', besinKaydi(), { kayit_id:8 }).ok).toBe(false);
      expect(Bi().sina('fiyat.add', besinKaydi(), { kayit_id:7 }).why).toContain('market fiyatı');
      expect(Bi().sina('kalori.sil', besinKaydi(), { kayit_id:7 }).ok).toBe(false);
    });

    it('fiyat: TL/kg ve ortancayı SPİ hesaplar; tabloda olmayan gıdaya yazılmaz', () => {
      resetState();
      const s = Bi().sina('fiyat.add', fiyatKaydi(), { kayit_id:8 });
      expect(s.ok).toBe(true);
      expect(s.yazilacak.foodId).toBe('tavuk-gogsu');
      /* Kayıttaki tl_kg:1 yok sayılır: 289,9/kg ve 300/kg → ortanca 294,95. */
      expect(s.yazilacak.fiyat.tl).toBe(294.95);
      expect([s.yazilacak.fiyat.n, s.yazilacak.fiyat.at]).toEqual([2, '2026-09-15']);
      const k = fiyatKaydi();
      k.govde.ad = 'ejderha meyvesi';
      expect(Bi().sina('fiyat.add', k, { kayit_id:8 }).why).toContain('tablosunda yok');
    });

    it('fiyat: fiş önce gelir, BAM tohumun üstünde ve «tahmin»', async () => {
      resetState();
      const P = () => SP.Money.priceOf('tavuk-gogsu');
      expect(P().source).toBe('seed');
      SP.S.bamPrices = { 'tavuk-gogsu':{ tl:294.95, at:'2026-09-15', kayitId:8, n:2 } };
      expect([P().source, P().tl, P().cert]).toEqual(['bam', 294.95, 'estimated']);
      SP.S.prices = { 'tavuk-gogsu':{ tl:310, at:SP.U.todayISO(), source:'user' } };
      expect([P().source, P().cert]).toEqual(['user', 'measured']);
      expect(Bi().sina('fiyat.add', fiyatKaydi(), { kayit_id:8 }).onizleme.uyari[0]).toContain('Kendi fişin');
    });

    it('yer: tekrar eden ad düşer, fiyatsız yerin dönemi yazılmaz', () => {
      resetState();
      const s = Bi().sina('yer.add', yerKaydi(), { kayit_id:9 });
      expect(s.ok).toBe(true);
      const y = s.yazilacak.yer;
      expect([y.baslik, y.konum, y.etiket, y.yerler.length]).toEqual(['spor salonu', 'Kadıköy, İstanbul', 'tahmin', 2]);
      expect(y.yerler[1]).toEqual({ ad:'Salon B', semt:null, adres:null, tl:null, donem:null });
    });

    it('istek kapalıdır: yer semt/şehir ister, besine konum gitmez', () => {
      expect(Bi().istekTemizle({ tur:'yer', ad:'spor salonu' }).ok).toBe(false);
      expect(Bi().istekTemizle({ tur:'besin', ad:'kinoa', sehir:'Adana' }).bilgi).toEqual({ tur:'besin', ad:'kinoa' });
      expect(Bi().istekTemizle({ tur:'ilac', ad:'x y' }).ok).toBe(false);
    });
  });

  describe('SPİ bilgisi — HKM ile', () => {
    it('istek King’e yalnız tür, ad ve konumla gider', async () => {
      resetState();
      await withHkm({}, async cagri => {
        const r = await Bi().iste({ tur:'fiyat', ad:'tavuk göğsü', sehir:'Adana' });
        expect(r.ok).toBe(true);
        const g = JSON.parse(cagri.find(c => /king\/emir$/.test(c.url)).opt.body);
        expect([g.modul, g.tur]).toEqual(['spi', 'spi.bilgi']);
        expect(g.govde).toEqual({ bilgi:{ tur:'fiyat', ad:'tavuk göğsü', sehir:'Adana' } });
      });
      /* HKM kapalıyken hiçbir şey olmaz; söylenir. */
      expect((await Bi().iste({ tur:'besin', ad:'kinoa' })).metin).toContain('bağlı değil');
    });

    it('onayda yeniden çekilir, yazılır, geri alınır; ikinci kez eklenmez', async () => {
      resetState();
      await withHkm({ 7:besinKaydi(), 8:fiyatKaydi(), 9:yerKaydi() }, async () => {
        const b = await Bi().uygula('besin.add', { kayit_id:7 });
        expect(b.ok).toBe(true);
        const f = SP.S.foods.find(x => x.bam && x.bam.kayitId === 7);
        expect(!!SP.FOOD_BY_ID[f.id]).toBe(true);           /* hesaplara katıldı */
        expect((await Bi().uygula('besin.add', { kayit_id:7 })).error).toContain('zaten');
        await Bi().geriAl(b.geriAl);
        expect(SP.S.foods.some(x => x.bam && x.bam.kayitId === 7)).toBe(false);

        const p = await Bi().uygula('fiyat.add', { kayit_id:8 });
        expect(SP.Money.priceOf('tavuk-gogsu').source).toBe('bam');
        await Bi().geriAl(p.geriAl);
        expect(SP.Money.priceOf('tavuk-gogsu').source).toBe('seed');

        const y = await Bi().uygula('yer.add', { kayit_id:9 });
        expect(Bi().yerler().length).toBe(1);
        await Bi().geriAl(y.geriAl);
        expect(Bi().yerler().length).toBe(0);
        expect((await Bi().uygula('besin.add', { kayit_id:99 })).error).toContain('alınamadı');
      });
    });

    it('teklif kartı onaydan önce önizler; eklenemeyen teklif uygulanamaz', async () => {
      resetState();
      const k = fiyatKaydi();
      k.govde.ad = 'ejderha meyvesi';
      const kuyruk = [
        { id:9101, kind:'besin.add', note:'not', payload:{ kayit_id:7, ad:'kinoa' } },
        { id:9102, kind:'fiyat.add', note:'not', payload:{ kayit_id:8, ad:'ejderha meyvesi' } }];
      await withHkm({ 7:besinKaydi(), 8:k, __kuyruk:kuyruk }, async () => {
        await SP.Beacon.load();
        const l = await SP.Beacon.intents();
        const b = l.find(n => n.id === 9101), f = l.find(n => n.id === 9102);
        expect([b.bilgi.ok, SP.Beacon.canApply(b)]).toEqual([true, true]);
        expect(b.bilgi.onizleme.baslik).toContain('Kinoa');
        expect([f.bilgi.ok, SP.Beacon.canApply(f)]).toEqual([false, false]);
        const r = await SP.Beacon.resolveIntent(b, 'apply');
        expect([r.ok, r.state, r.geriAl.tur]).toEqual([true, 'applied', 'besin']);
        await Bi().geriAl(r.geriAl);
      });
    });
  });
})();
