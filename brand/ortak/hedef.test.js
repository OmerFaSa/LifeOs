/* Hedef motoru — genel çerçeve, paketten bağımsız.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hedef.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Motor örneklere göre değil, HERHANGİ bir hedefi alacak biçimde kurulur.
   Bu yüzden testler gerçek bir modül paketi değil, burada tanımlanan
   sahte paketlerle koşar: motor, paketin ne olduğunu bilmeden çalışmalı.

   Kanıtlanan sözler:
     1. Yaygın cümle kuralla tanınır; tanınmayan cümle «hedef» sayılmaz.
     2. Eksik alan SORULUR; soru kullanıcıya giden düzgün Türkçedir.
     3. Gerçekçilik kararını kod verir; eşiğin dayanağı yoksa karar «tahmin»dir.
     4. Kuralı olmayan alan reddedilmez: karar veremediği SÖYLENİR.
     5. Güvenlik reddi bandı ezer ama güvenli bir karşı teklif bırakır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const H = () => window.LIFEOS.Hedef;
  const BUGUN = '2026-09-23';

  /* Sahte paketler — motor bunların ne olduğunu bilmez. */
  const KILO = {
    id:'kilo', ad:'Kilo', olcut:{ ad:'kilo', birim:'kg' },
    anahtar:/\b(kilo|kg)\b/,
    yonler:['azalt', 'artir', 'ulas', 'koru'],
    simdi:() => ({ deger:80, birim:'kg', etiket:'olculdu', tarih:'2026-09-20' }),
    hiz:() => ({ tipik:0.5, ust:1, birim:'kg/hafta',
      dayanak:{ metin:'deneme bandı', durum:'kaynak_bekliyor' } }),
  };
  const SAYFA = {
    id:'okuma', ad:'Okuma', olcut:{ ad:'sayfa', birim:'sayfa' },
    anahtar:/\b(sayfa|kitap)\b/, yonler:['artir', 'aliskanlik'],
    kapasiteGerekir:true,
  };
  const PAKETLER = [KILO, SAYFA];

  describe('Hedef — cümleden tanıma', () => {
    it('yön, miktar ve birim tanınır', () => {
      const a = H().cumleden('3 kilo vermek istiyorum', PAKETLER, BUGUN);
      expect([a.paket, a.yon, a.fark, a.birim]).toEqual(['kilo', 'azalt', 3, 'kg']);
      const b = H().cumleden('10 kilo almak istiyorum', PAKETLER, BUGUN);
      expect([b.yon, b.fark]).toEqual(['artir', 10]);
      const c = H().cumleden('Yarım kilo vermek istiyorum', PAKETLER, BUGUN);
      expect(c.fark).toBe(0.5);
      const d = H().cumleden('3,5 kg vermek istiyorum', PAKETLER, BUGUN);
      expect(d.fark).toBe(3.5);
    });

    it('«…ya in» hedef değerdir, fark değil', () => {
      const a = H().cumleden('80 kiloya inmek istiyorum', PAKETLER, BUGUN);
      expect([a.yon, a.hedefDeger, a.fark]).toEqual(['ulas', 80, null]);
    });

    it('süre, tarih ve kapasite tanınır', () => {
      expect(H().cumleden('3 ayda 5 kilo vermek istiyorum', PAKETLER, BUGUN).son_tarih)
        .toBe('2026-12-23');
      expect(H().cumleden('6 hafta içinde 2 kilo vermek istiyorum', PAKETLER, BUGUN).son_tarih)
        .toBe('2026-11-04');
      expect(H().cumleden('yıl sonuna kadar 4 kilo almak istiyorum', PAKETLER, BUGUN).son_tarih)
        .toBe('2026-12-31');
      const k = H().cumleden('günde yarım saat okuyarak 300 sayfa okumak istiyorum', PAKETLER, BUGUN);
      expect([k.paket, k.kapasite.gunluk_dk]).toEqual(['okuma', 30]);
      expect(H().cumleden('haftada 4 gün, günde 1 saat kitap okumak istiyorum', PAKETLER, BUGUN)
        .kapasite).toEqual({ gunluk_dk:60, haftalik_gun:4 });
    });

    it('kelime ortasındaki yön kelimesi sayılmaz', () => {
      expect(H().cumleden('formda kalmak istiyorum, 80 kilo', PAKETLER, BUGUN).egilim).toBe(null);
    });

    it('hedef olmayan cümle tanınmaz', () => {
      ['bugün 80 kiloyum', 'dün 3 kilo verdim', 'kilo nedir', 'bugün hava güzel', '']
        .forEach(m => expect(H().cumleden(m, PAKETLER, BUGUN)).toBe(null));
    });
  });

  describe('Hedef — netleştirme', () => {
    it('eksik tarih ve kapasite sorulur; bilinen şimdiki değer sorulmaz', () => {
      const h = H().yeni(H().cumleden('3 kilo vermek istiyorum', PAKETLER, BUGUN), 'spi', BUGUN);
      const e = H().eksikler(h, KILO, {});
      expect(e.map(x => x.alan)).toEqual(['son_tarih']);
      expect(e[0].soru).toContain('Ne zamana kadar');
      const o = H().yeni(H().cumleden('300 sayfa okumak istiyorum', PAKETLER, BUGUN), 'esp', BUGUN);
      expect(H().eksikler(o, SAYFA, {}).map(x => x.alan)).toEqual(['son_tarih', 'simdi', 'kapasite']);
    });

    it('cevap aynı ayrıştırıcıyla işlenir; anlaşılmayan cevap yeniden sorulur', () => {
      let h = H().yeni(H().cumleden('3 kilo vermek istiyorum', PAKETLER, BUGUN), 'spi', BUGUN);
      const kotu = H().cevapla(h, 'son_tarih', 'bilmem ki', BUGUN);
      expect(kotu.ok).toBe(false);
      h = H().cevapla(h, 'son_tarih', '2 ay içinde', BUGUN).hedef;
      expect(h.son_tarih).toBe('2026-11-23');
      const k = H().cevapla(h, 'kapasite', 'günde 45 dakika', BUGUN);
      expect(k.hedef.kapasite.gunluk_dk).toBe(45);
    });

    it('paketin ek soruları eklenir', () => {
      const p = Object.assign({}, KILO, { ekSorular:() => [{ alan:'saglik', soru:'Hekim talimatı var mı?' }] });
      const h = H().yeni(Object.assign(H().cumleden('3 kilo vermek istiyorum', PAKETLER, BUGUN),
        { son_tarih:'2026-12-01' }), 'spi', BUGUN);
      expect(H().eksikler(h, p, {}).map(x => x.alan)).toEqual(['saglik']);
    });
  });

  describe('Hedef — gerçekçilik', () => {
    const hedef = (cumle, tarih) => {
      const h = H().yeni(H().cumleden(cumle, PAKETLER, BUGUN), 'spi', BUGUN);
      h.son_tarih = tarih;
      h.simdi = KILO.simdi();
      return h;
    };

    it('bant hıza göre verilir, karşı teklif hesaplanır', () => {
      expect(H().gerceklik(hedef('3 kilo vermek istiyorum', '2026-12-02'), KILO, {}, BUGUN).bant)
        .toBe('gercekci');                         // 10 hafta: 0,3 kg/hafta
      expect(H().gerceklik(hedef('3 kilo vermek istiyorum', '2026-10-21'), KILO, {}, BUGUN).bant)
        .toBe('zorlayici');                        // 4 hafta: 0,75 kg/hafta
      const r = H().gerceklik(hedef('3 kilo vermek istiyorum', '2026-10-07'), KILO, {}, BUGUN);
      expect(r.bant).toBe('gercekci_degil');       // 2 hafta: 1,5 kg/hafta
      expect(r.karsi.son_tarih).toBe('2026-11-04');  // 6 hafta, tipik hızla
      expect(r.karsi.ulasilabilir).toBe(1);        // 2 haftada tipik hızla
      expect(r.gerekli).toBe(1.5);
    });

    it('dayanağı olmayan eşiğin kararı «tahmin»dir', () => {
      const r = H().gerceklik(hedef('3 kilo vermek istiyorum', '2026-12-02'), KILO, {}, BUGUN);
      expect(r.etiket).toBe('tahmin');
      expect(r.dayanak.durum).toBe('kaynak_bekliyor');
      const kaynakli = Object.assign({}, KILO, { hiz:() => Object.assign(KILO.hiz(),
        { dayanak:{ metin:'kılavuz', durum:'kaynakli' } }) });
      expect(H().gerceklik(hedef('3 kilo vermek istiyorum', '2026-12-02'), kaynakli, {}, BUGUN)
        .etiket).toBe('hesaplandi');
    });

    it('kuralı olmayan alan reddedilmez, karar veremediği söylenir', () => {
      const h = H().yeni(H().cumleden('300 sayfa okumak istiyorum', PAKETLER, BUGUN), 'esp', BUGUN);
      const r = H().gerceklik(h, SAYFA, {}, BUGUN);
      expect(r.bant).toBe(null);
      expect(r.neden).toContain('kural');
    });

    it('yön ile değerler çelişirse hata söylenir', () => {
      const h = hedef('80 kiloya inmek istiyorum', '2026-12-02');
      h.hedefDeger = 85;
      expect(H().gerceklik(h, KILO, {}, BUGUN).hata).toContain('çelişiyor');
    });

    it('güvenlik reddi bandı ezer, güvenli karşı teklif kalır', () => {
      const p = Object.assign({}, KILO, { guvenlik:(h, durum, s) =>
        s.gerekli > 1.2 ? { red:true, neden:'Bu hız güvenli değil.' } : null });
      const r = H().gerceklik(hedef('3 kilo vermek istiyorum', '2026-10-07'), p, {}, BUGUN);
      expect(r.bant).toBe('guvensiz');
      expect(r.neden).toBe('Bu hız güvenli değil.');
      expect(r.karsi.son_tarih).toBe('2026-11-04');
    });

    it('senaryolar tipik ve üst hızla iki tarih verir', () => {
      const s = H().senaryolar(hedef('3 kilo vermek istiyorum', '2026-10-07'), KILO, {}, BUGUN);
      expect(s.map(x => x.son_tarih)).toEqual(['2026-11-04', '2026-10-14']);
      expect(s[1].ad).toContain('zorlayıcı');
    });
  });

  /* Sohbet akışı: hedef cümlesi → eksik soruları → karar ve tempo →
     onay. Model çağrılmaz; cevabı kural motoru yazar. */
  describe('Hedef — sohbet', () => {
    function kur(){
      const kayit = {};
      const s = H().sohbetKur({ paketler:PAKETLER, modul:'spi', durum:() => ({}),
        bugun:() => BUGUN, kaydet:async h => { kayit[h.id] = h; } });
      return { s, kayit };
    }

    it('eksik alanı sorar, cevapla ilerler, karar ve tempo verir, seçimle aktif eder', async () => {
      const { s, kayit } = kur();
      expect((await s.isle('3 kilo vermek istiyorum')).text).toContain('Ne zamana kadar');
      const b = await s.isle('2 hafta içinde');
      expect(b.text).toContain('gerçekçi değil');
      expect(b.text).toContain('1)');
      expect(b.text).toContain('tahmin');
      expect((await s.isle('1')).text).toContain('aktif');
      const h = Object.values(kayit)[0];
      expect([h.durum, h.son_tarih]).toEqual(['aktif', '2026-11-04']);
      expect([h.gerceklik.bant, h.ilkKarar]).toEqual(['gercekci', 'gercekci_degil']);
    });

    it('anlaşılmayan cevap yeniden sorulur; «vazgeç» hedefi bırakır', async () => {
      const { s, kayit } = kur();
      await s.isle('3 kilo vermek istiyorum');
      expect((await s.isle('bilmem')).text).toContain('anlayamadım');
      expect((await s.isle('vazgeç')).text).toContain('bıraktım');
      expect(Object.values(kayit)[0].durum).toBe('birakildi');
    });

    it('hedef olmayan cümleye karışmaz', async () => {
      const { s } = kur();
      expect(await s.isle('bugün nasılım')).toBe(null);
      expect(await s.isle('evet')).toBe(null);
    });

    it('kuralı olmayan alanda karar veremediğini söyler, istenirse yine kaydeder', async () => {
      const { s, kayit } = kur();
      await s.isle('günde 30 dakika ile 3 ayda 300 sayfa okumak istiyorum');
      const r = await s.isle('bilmiyorum');
      expect(r.text).toContain('kural');
      await s.isle('evet');
      expect(Object.values(kayit)[0].durum).toBe('aktif');
    });

    it('güvensiz hedef kendi tarihiyle onaylanamaz, yalnız güvenli tempo seçilir', async () => {
      const kayit = {};
      const p = Object.assign({}, KILO, { guvenlik:(h, d, x) =>
        x.gerekli > 1.2 ? { red:true, neden:'Bu hız güvenli değil.' } : null });
      const s = H().sohbetKur({ paketler:[p], modul:'spi', durum:() => ({}), bugun:() => BUGUN,
        kaydet:async h => { kayit[h.id] = h; } });
      await s.isle('2 hafta içinde 3 kilo vermek istiyorum');
      expect((await s.isle('evet')).text).toContain('güvenli');
      expect(Object.values(kayit)[0].durum).toBe('taslak');
      await s.isle('1');
      expect(Object.values(kayit)[0].durum).toBe('aktif');
    });
  });

  describe('Hedef — yaşam döngüsü', () => {
    it('izinli geçişler yapılır, yasak geçiş reddedilir', () => {
      const h = H().yeni(H().cumleden('3 kilo vermek istiyorum', PAKETLER, BUGUN), 'spi', BUGUN);
      expect(h.durum).toBe('taslak');
      const a = H().gecis(h, 'aktif', BUGUN);
      expect(a.ok).toBe(true);
      const t = H().gecis(a.hedef, 'tamam', BUGUN);
      expect(H().gecis(t.hedef, 'aktif', BUGUN).ok).toBe(false);
      expect(H().gecis(a.hedef, 'uydurma', BUGUN).ok).toBe(false);
    });
  });
})();
