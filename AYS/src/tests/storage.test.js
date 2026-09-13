/* Depo sağlığı — dokuz aylık kullanım için. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const St = () => R.Storage;
  const S = R.S, U = R.U;

  function ornek(tarih, bytes){
    S.storage = S.storage || { samples:[] };
    S.storage.samples.push({ date:tarih, bytes });
  }

  describe('depo · buyume', () => {

    /* Olculmemis hiz, sifir hiz degildir. */
    it('iki ornekten az ise hiz bilinmiyor', () => {
      resetState();
      ornek('2026-03-01', 100000);
      const g = St().growth();
      expect(g.cert).toBe('missing');
      expect(g.perDay).toBe(null);
    });

    /* Ayni gun icinde iki olcum bir "gunluk hiz" vermez. */
    it('cok kisa aralikta hiz hesaplanmaz', () => {
      resetState();
      ornek('2026-03-01', 100000);
      ornek('2026-03-02', 110000);
      expect(St().growth().cert).toBe('missing');
    });

    it('yeterli aralikta gunluk hiz hesaplanir', () => {
      resetState();
      ornek('2026-03-01', 100000);
      ornek('2026-03-11', 200000);
      const g = St().growth();
      expect(g.perDay).toBe(10000);
      expect(g.spanDays).toBe(10);
    });

    /* On ornekten az varsa kesinlik 'tahmin' kalir. */
    it('az ornekte kesinlik tahmin, cok ornekte olculdu', () => {
      resetState();
      ornek('2026-03-01', 100000);
      ornek('2026-03-11', 200000);
      expect(St().growth().cert).toBe('estimated');
      resetState();
      for(let i = 0; i < 12; i++){
        ornek(U.iso(U.addDays(U.parse('2026-03-01'), i)), 100000 + i * 1000);
      }
      expect(St().growth().cert).toBe('measured');
    });

    it('buyumeyen depo icin dolma suresi verilmez', () => {
      resetState();
      ornek('2026-03-01', 200000);
      ornek('2026-03-11', 200000);
      const g = St().growth();
      expect(g.perDay).toBe(0);
      expect(g.daysLeft).toBe(null);
    });

    it('ayni gun icinde ikinci ornek yeni satir acmaz', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        await St().sample();
        await St().sample();
        expect(S.storage.samples.length).toBe(1);
      });
    });
  });

  describe('depo · dokuz aylik ufuk', () => {

    it('hiz bilinmiyorsa ufuk da bilinmez', () => {
      resetState();
      expect(St().horizon().cert).toBe('missing');
      expect(St().horizon().willFit).toBe(null);
    });

    it('yavas buyumede dokuz ay sigar', () => {
      resetState();
      ornek('2026-03-01', 100000);
      ornek('2026-03-11', 101000);      /* gunde 100 B */
      const h = St().horizon();
      expect(h.days).toBe(270);
      expect(h.willFit).toBeTruthy();
    });

    it('hizli buyumede dokuz ay sigmaz ve ne yapilacagi yazar', () => {
      resetState();
      ornek('2026-03-01', 100000);
      ornek('2026-03-11', 400000);      /* gunde 30 KB */
      const h = St().horizon();
      expect(h.willFit).toBeFalsy();
      expect(/[Yy]edek/.test(h.note)).toBeTruthy();
    });
  });

  describe('depo · budama', () => {

    /* Bu bir savunma degil bir SOZDUR. */
    it('kullanicinin girdigi veri budanamaz', async () => {
      resetState();
      const r = await St().prune(['exams', 'cards']);
      expect(r.ok).toBeFalsy();
      expect(r.refused.length).toBe(2);
      expect(r.error.indexOf('silinmez') > 0).toBeTruthy();
    });

    it('bos secim reddedilir', async () => {
      resetState();
      expect((await St().prune([])).ok).toBeFalsy();
    });

    it('budanabilir listede hicbir icerik koleksiyonu yok', () => {
      const izinli = St().BUDANABILIR.map(b => b.collection);
      St().ICERIK.forEach(c => {
        expect(izinli.indexOf(c) < 0).toBeTruthy();
      });
    });

    it('budanabilir kayitlar yalnizca dolu olanlari listeler', async () => {
      resetState();
      expect(St().prunable().length).toBe(0);
      S.usage = { days:{ '2026-03-01':{ date:'2026-03-01', adminMs:60000, ticks:2 } } };
      await R.Friction.save();
      const p = St().prunable();
      expect(p.length >= 1).toBeTruthy();
      expect(p[0].collection).toBe('usage');
    });

    it('budama sonrasi bellek kopyasi da temizlenir', async () => {
      resetState();
      S.usage = { days:{ '2026-03-01':{ date:'2026-03-01', adminMs:60000, ticks:2 } } };
      await R.Friction.save();
      const r = await St().prune(['usage']);
      expect(r.ok).toBeTruthy();
      expect(Object.keys(S.usage.days).length).toBe(0);
    });
  });

  describe('depo · hukum', () => {

    it('olcum yoksa hukum de yumusak', () => {
      resetState();
      const v = St().verdict();
      expect(v.level).toBe('ok');
      expect(v.note.length > 10).toBeTruthy();
    });

    it('dokuz ay sigmayacaksa izlenir', () => {
      resetState();
      ornek('2026-03-01', 100000);
      ornek('2026-03-11', 400000);
      expect(St().verdict().level).toBe('watch');
    });
  });

  describe('depo · dagilim', () => {

    it('koleksiyon basina boyut cikar ve icerik isaretlenir', async () => {
      resetState();
      await R.Store.set('days/2026-03-01', { date:'2026-03-01', blocks:[] });
      const b = St().breakdown();
      const gun = b.filter(x => x.collection === 'days')[0];
      expect(!!gun).toBeTruthy();
      expect(gun.content).toBeTruthy();
      expect(gun.prunable).toBeFalsy();
    });
  });
})();

/* İkinci açılış — dokuz ayın her günü bir "ikinci açılış"tır.

   Bu paket tek bir hatadan doğdu: depo sağlığı modülü U.isISO'yu
   çağırıyordu ama o işlev yalnızca ESP'de vardı. Boş depoda filtre hiç
   çalışmadığı için ilk açılışta hata görünmüyordu; veri yazıldıktan
   SONRAKİ açılışta uygulama hiç çizilmiyordu.

   Ders: boş durumla test etmek yetmez. Dolu durumla açılış ayrı bir
   senaryodur ve asıl kullanım odur. */
(function(){
  const { describe, it, expect, resetState } = R.Test;
  const U = R.U;

  describe('ikinci acilis · tarih dogrulama', () => {

    it('isISO gecerli tarihi kabul eder', () => {
      expect(U.isISO('2026-03-10')).toBeTruthy();
      expect(U.isISO('2024-02-29')).toBeTruthy();
    });

    /* new Date('2026-02-31') bazi tarayicilarda KAYAR, bazilarinda
       Invalid Date doner; ikisi de sessizdir. */
    it('var olmayan gunu reddeder', () => {
      expect(U.isISO('2026-02-31')).toBeFalsy();
      expect(U.isISO('2026-13-01')).toBeFalsy();
    });

    it('bicimsiz girdiyi reddeder', () => {
      expect(U.isISO('')).toBeFalsy();
      expect(U.isISO(null)).toBeFalsy();
      expect(U.isISO('2026-3-1')).toBeFalsy();
      expect(U.isISO(20260310)).toBeFalsy();
    });
  });

  describe('ikinci acilis · dolu depodan yukleme', () => {

    /* Asil senaryo: depoda zaten veri varken acilis. */
    it('depoda ornek varken yukleme patlamaz', async () => {
      resetState();
      await R.Store.set('storage', { samples:[
        { date:'2026-03-01', bytes:1000 },
        { date:'2026-03-05', bytes:2000 },
      ] });
      await R.Storage.load();
      expect(R.S.storage.samples.length).toBe(2);
    });

    /* Bozuk tek bir kayit butun pencereyi kaydirmamali. */
    it('bozuk ornekler sessizce atilir', async () => {
      resetState();
      await R.Store.set('storage', { samples:[
        { date:'2026-03-01', bytes:1000 },
        { date:'bozuk', bytes:2000 },
        { date:'2026-02-31', bytes:3000 },
        { date:'2026-03-05', bytes:'abc' },
        null,
      ] });
      await R.Storage.load();
      expect(R.S.storage.samples.length).toBe(1);
    });

    it('bozuk depo kaydi hiz hesabini bozmaz', async () => {
      resetState();
      await R.Store.set('storage', { samples:'bu bir dizi degil' });
      await R.Storage.load();
      expect(R.Storage.growth().cert).toBe('missing');
    });
  });
})();
