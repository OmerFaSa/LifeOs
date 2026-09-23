/* Test kitabı — BAM'ın bölümlü kitabını AYS'de çözmek (core/testkitabi.js).

   Kanıtlanan sözler:
     1. Her soru AYS'nin kendi koduyla yeniden sınanır; tutmayan düşer,
        sorusu kalmayan bölüm kitaba girmez. Aynı kitap iki kez eklenmez.
     2. İstek profilden kurulur: en çok 6 bölüm, bitmemiş konular önce.
     3. Sınav biçimi: cevap bölüm bitince görünür; sonuç «ölçüldü»dür,
        net/puan hesaplanmaz. Vazgeçilen bölüm sonuç yazmaz.
     4. Hatalı işaretlenen soru sonuca sayılmaz. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const T = () => R.TestKitabi;
  const B = () => R.Beacon;

  async function withFetch(fn, cevap){
    const eski = window.fetch;
    const cagri = [];
    window.fetch = function(url, opt){ cagri.push({ url, opt }); return Promise.resolve(cevap); };
    try{ await fn(cagri); }
    finally{ window.fetch = eski; }
  }
  async function ayarla(){
    await B().save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200',
      lastAt:null, lastOkAt:null, lastStatus:null, lastNote:'' });
  }
  const soru = (metin, dogru, zorluk, sec) => ({ soru:metin, dogru, zorluk,
    secenekler:sec || ['1071', '1299', '1453', '1517', '1923'], cozum:'Kuruluş 1299.' });
  function kayit(govde, ek){
    return Object.assign({ id:77, tur:'materyal', baslik:'KPSS Genel Kültür test kitabı',
      dogruluk:'dogrulanmadi', govde:Object.assign({ tur:'kitap', baslik:'KPSS Genel Kültür test kitabı',
        bolumler:[
          { ad:'Tarih', sorular:[soru('Osmanlı ne zaman kuruldu?', 'B', 'kolay'),
            soru('İstanbul ne zaman fethedildi?', 'C', 'çok zor'),
            soru('Dört şıklı', 'A', 'orta', ['a', 'b', 'c', 'd']),
            soru('Aynı şıklı', 'A', 'orta', ['a', 'a', 'b', 'c', 'd']),
            soru('Anahtarsız', 'F', 'orta')] },
          { ad:'Coğrafya', sorular:[soru('Bozuk', 'Z', 'zor')] },
        ] }, govde || {}) }, ek || {});
  }

  describe('Test kitabı — içe alma', () => {
    it('her soru AYS’nin kendi koduyla sınanır; sorusuz bölüm düşer', () => {
      const r = T().kayittan(kayit());
      expect(r.ok).toBe(true);
      const k = r.kitap;
      expect(k.bolumler.map(b => b.ad)).toEqual(['Tarih']);
      expect(k.bolumler[0].sorular.map(s => [s.dogru, s.zorluk])).toEqual([[1, 'kolay'], [2, 'belirsiz']]);
      expect([k.id, k.dogruluk, k.dusen]).toEqual(['kitap-77', 'dogrulanmadi', 4]);
      expect(T().kayittan(kayit({ tur:'soru' })).ok).toBe(false);
      expect(T().kayittan(kayit({ bolumler:[{ ad:'Tarih', sorular:[soru('x', 'Z', 'kolay')] }] })).ok).toBe(false);
    });

    it('kitap.add teklifi HKM’den çekilip eklenir; aynısı iki kez eklenmez', async () => {
      resetState();
      await ayarla();
      const n = { id:5, kind:'kitap.add', payload:{ kayit_id:77, bolum:1, soru:2 } };
      expect(B().canApply(n)).toBe(true);
      await withFetch(async (cagri) => {
        const r = await B().applyIntent(n);
        expect(r.ok).toBe(true);
        expect(cagri[0].url).toBe('http://127.0.0.1:4200/api/bam/kayit/77');
        expect((await R.Store.get('testkitabi/kitap-77')).bolumler).toHaveLength(1);
        expect((await B().applyIntent(n)).ok).toBe(false);
      }, { status:200, json:async () => ({ kayit:kayit() }) });
    });
  });

  describe('Test kitabı — istek', () => {
    it('profilden kurulur: en çok 6 bölüm, bitmemiş konular önce', async () => {
      resetState();
      const p = { id:'bam-1', ad:'KPSS', bitenler:['d1-k1'], dersler:[1, 2, 3, 4, 5, 6, 7].map(n => ({
        id:'d' + n, ad:'Ders ' + n, konular:[{ id:'d' + n + '-k1', ad:'Konu bir' }, { id:'d' + n + '-k2', ad:'Konu iki' }] })) };
      const g = T().istekGovdesi(p);
      expect(g.bolumler).toHaveLength(6);
      expect(g.bolumler[0].konular).toEqual(['Konu iki', 'Konu bir']);
      expect(g.bolumler.every(b => b.adet === 10)).toBe(true);
      expect(g.zorluk).toEqual({ kolay:30, orta:50, zor:20 });
    });

    it('sohbette adı geçen profil için King’e test.kitabi iş emri gider', async () => {
      resetState();
      await ayarla();
      await R.SinavProfil.teklifUygula({ kayit_id:41 }, async () => ({ id:41, tur:'arastirma',
        dogruluk:'dogrulanmadi', govde:{ tur:'mufredat', sinav:'KPSS Genel Kültür',
          dersler:[{ ad:'Tarih', konular:['Osmanlı Kuruluş Dönemi'] }] } }));
      await withFetch(async (cagri) => {
        const r = await T().sohbet('KPSS genel kültür test kitabı hazırla');
        const g = JSON.parse(cagri[0].opt.body);
        expect([g.tur, g.govde.kitap.bolumler.length]).toEqual(['test.kitabi', 1]);
        expect(r.text).toContain('King onayladı');
      }, { status:200, json:async () => ({ ok:true, yeni:true, karar:'onay',
        emir:{ id:4, durum:'onaylandi', tahmin:{ metin:'yaklaşık 3 dakika' }, kontrol:[] } }) });
      expect((await T().sohbet('DGS test kitabı')).text).toContain('Kayıtlı profiller');
      expect(await T().sohbet('bugün 40 soru çözdüm')).toBe(null);
    });
  });

  describe('Test kitabı — çözme', () => {
    async function kur(){
      resetState();
      T().vazgec(); T().ozetKapat();
      await T().teklifUygula({ kayit_id:77 }, async () => kayit({ bolumler:[{ ad:'Tarih', sorular:[
        soru('Bir', 'B', 'kolay'), soru('İki', 'C', 'orta'), soru('Üç', 'A', 'zor')] }] }));
    }

    it('cevaplar bölüm sonunda sayılır; sonuç ölçümdür', async () => {
      await kur();
      expect(T().baslat('kitap-77', 1).toplam).toBe(3);
      T().sec(1);                        /* 1. soru: B — doğru */
      T().git(1); T().sec(0); T().sec(0);/* 2. soru: seçip bıraktı — boş */
      T().git(1); T().sec(4);            /* 3. soru: E — yanlış */
      expect(T().mevcut().cevapli).toBe(2);
      const s = await T().bitir();
      expect([s.dogru, s.yanlis, s.bos, s.etiket]).toEqual([1, 1, 1, 'olculdu']);
      expect(s.zorluk.kolay).toEqual({ dogru:1, toplam:1 });
      expect(T().aktif()).toBe(null);
      expect(T().sonOzet().bolum.ad).toBe('Tarih');
      const k = await R.Store.get('testkitabi/kitap-77');
      expect(k.sonuclar[1].dogru).toBe(1);
    });

    it('vazgeçilen bölüm sonuç yazmaz; hatalı soru sayılmaz', async () => {
      await kur();
      T().baslat('kitap-77', 1); T().sec(1);
      T().vazgec();
      expect(T().bul('kitap-77').sonuclar).toEqual({});
      T().baslat('kitap-77', 1); T().git(2); T().sec(4);
      await T().bitir();
      expect(T().bul('kitap-77').sonuclar[1].yanlis).toBe(1);
      const h = await T().hataliIsaretle('kitap-77', 1, 2);
      expect(h.hatali).toBe(true);
      const s = T().bul('kitap-77').sonuclar[1];
      expect([s.yanlis, s.bos, s.sayilmayan]).toEqual([0, 2, 1]);
      await T().hataliIsaretle('kitap-77', 1, 2);
      expect(T().bul('kitap-77').sonuclar[1].yanlis).toBe(1);
    });
  });
})();
