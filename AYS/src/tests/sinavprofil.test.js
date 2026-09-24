/* Sınav profilleri — AYS'nin tek sınava bağlı kalmaması (core/sinavprofil.js).

   Kanıtlanan sözler:
     1. Yerleşik profil YKS SAY'dır ve kaldırılamaz.
     2. BAM'ın müfredat raporu AYS'nin KENDİ sınırlarıyla süzülür; kaynaksız
        profil «doğrulanmadı»dır. Aynı rapor iki kez eklenmez.
     3. HKM yoksa profil KURULMAZ: müfredat uydurulmaz.
     4. Sohbetten sınav adı çıkarılır ve King'e `sinav.mufredat` iş emri gider. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const P = () => R.SinavProfil;
  const B = () => R.Beacon;

  async function withFetch(fn, cevap){
    const eski = window.fetch;
    const cagri = [];
    window.fetch = function(url, opt){
      cagri.push({ url, opt });
      if(cevap instanceof Error) return Promise.reject(cevap);
      return Promise.resolve(cevap);
    };
    try{ await fn(cagri); }
    finally{ window.fetch = eski; }
  }
  async function ayarla(){
    await B().save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200',
      lastAt:null, lastOkAt:null, lastStatus:null, lastNote:'' });
  }
  function kayit(govde, ek){
    return Object.assign({ id:41, tur:'arastirma', baslik:'KPSS Genel Kültür müfredatı',
      dogruluk:'dogrulanmadi', govde:Object.assign({ tur:'mufredat', sinav:'KPSS Genel Kültür',
        dersler:[
          { ad:'Tarih', soru_sayisi:27, konular:['Osmanlı Kuruluş Dönemi', 'osmanlı  kuruluş dönemi', 'x'] },
          { ad:'Coğrafya', soru_sayisi:500, konular:['Türkiye’nin İklimi', 'Nüfus'] },
          { ad:'tarih', konular:['Tekrar eden ders'] },
          { ad:'Vatandaşlık', konular:[] },
        ], acik_kalanlar:['Kılavuz yılı bilinmiyor.'] }, govde || {}) }, ek || {});
  }
  const cevap = (k) => ({ status:200, json:async () => ({ kayit:k }) });

  describe('Sınav profili — liste ve süzme', () => {
    it('yerleşik profil YKS SAY’dır; müfredatı data/subjects.js’ten gelir', () => {
      resetState();
      const y = P().liste()[0];
      expect([y.id, y.kaynak]).toEqual(['yks-say', 'yerlesik']);
      expect(P().sayilar(y).ders).toBe(R.SUBJECTS.length);
      expect(P().sayilar(y).konu).toBe(R.SUBJECTS.reduce((a, s) => a + s.topics.length, 0));
    });

    it('rapor AYS’nin kendi sınırlarıyla süzülür; kaynaksız rapor doğrulanmadı kalır', () => {
      const r = P().kayittan(kayit());
      expect(r.ok).toBe(true);
      const p = r.profil;
      expect(p.dersler.map(d => d.ad)).toEqual(['Tarih', 'Coğrafya']);
      expect(p.dersler[0].konular).toEqual([{ id:'d1-k1', ad:'Osmanlı Kuruluş Dönemi' }]);
      expect(p.dersler.map(d => d.soru)).toEqual([27, null]);
      expect([p.id, p.dogruluk, p.puanlama, p.dusen]).toEqual(['bam-41', 'dogrulanmadi', null, 4]);
      expect(P().kayittan(kayit({ tur:'soru' })).ok).toBe(false);
      expect(P().kayittan(kayit({ dersler:[{ ad:'T', konular:['a'] }] })).ok).toBe(false);
      expect(P().kayittan(kayit({}, { tur:'materyal' })).ok).toBe(false);
    });
  });

  describe('Sınav profili — teklif, takip, kaldırma', () => {
    it('mufredat.add teklifi HKM’den çekilip eklenir; aynısı iki kez eklenmez', async () => {
      resetState();
      await ayarla();
      const n = { id:9, kind:'mufredat.add', payload:{ kayit_id:41, ders:2, konu:3, baslik:'KPSS Genel Kültür' } };
      expect(B().canApply(n)).toBe(true);
      await withFetch(async (cagri) => {
        const r = await B().applyIntent(n);
        expect(r.ok).toBe(true);
        expect(r.note).toContain('Kaynaksız');
        expect(cagri[0].url).toBe('http://127.0.0.1:4200/api/bam/kayit/41');
        expect(P().ekler()).toHaveLength(1);
        const kayitli = await R.Store.get('sinavprofil/bam-41');
        expect(kayitli.ad).toBe('KPSS Genel Kültür');
        expect((await B().applyIntent(n)).ok).toBe(false);
      }, cevap(kayit()));
    });

    it('HKM yoksa ya da kayıt müfredat değilse profil kurulmaz', async () => {
      resetState();
      const r = await P().teklifUygula({ kayit_id:41 }, async () => null);
      expect(r.ok).toBe(false);
      const m = await P().teklifUygula({ kayit_id:41 }, async () => kayit({ tur:'soru' }));
      expect(m.ok).toBe(false);
      expect(P().ekler()).toHaveLength(0);
    });

    it('ek profilde konu işaretlenir; yerleşik profil kaldırılamaz', async () => {
      resetState();
      await P().teklifUygula({ kayit_id:41 }, async () => kayit());
      expect((await P().konuIsaretle('bam-41', 'd1-k1')).bitti).toBe(true);
      expect(P().sayilar(P().bul('bam-41')).biten).toBe(1);
      expect((await P().konuIsaretle('bam-41', 'd1-k1')).bitti).toBe(false);
      expect((await P().konuIsaretle('bam-41', 'yok')).ok).toBe(false);
      expect((await P().sil('yks-say')).ok).toBe(false);
      expect((await P().sil('bam-41')).ok).toBe(true);
      expect(await R.Store.get('sinavprofil/bam-41')).toBe(null);
    });
  });

  describe('Sınav profili — King’e iş emri', () => {
    it('sohbetten sınav adı çıkarılır', () => {
      expect(P().sinavAdi('KPSS genel kültür müfredatını çıkar')).toBe('KPSS genel kültür');
      expect(P().sinavAdi('DGS için müfredat hazırla')).toBe('DGS');
      expect(P().sinavAdi('YDS’nin müfredatını istiyorum')).toBe('YDS');
      expect(P().sinavAdi('müfredat çıkar')).toBe('');
    });

    it('HKM bağlı değilse müfredat uydurulmaz', async () => {
      resetState();
      await B().save({ enabled:false, token:'', url:'' });
      const r = await P().sohbet('ALES müfredatını çıkar');
      expect(r.text).toContain('uydurmam');
      expect(await P().sohbet('bugün 40 soru çözdüm')).toBe(null);
    });

    it('King’e sinav.mufredat iş emri gider; karar ve tahmin söylenir', async () => {
      resetState();
      await ayarla();
      await withFetch(async (cagri) => {
        const r = await P().sohbet('KPSS genel kültür müfredatını çıkar');
        expect(cagri[0].url).toBe('http://127.0.0.1:4200/api/king/emir');
        const g = JSON.parse(cagri[0].opt.body);
        expect([g.modul, g.tur, g.govde.mufredat.sinav]).toEqual(['ays', 'sinav.mufredat', 'KPSS genel kültür']);
        expect(r.text).toContain('King onayladı');
        expect(r.text).toContain('(tahmin)');
      }, { status:200, json:async () => ({ ok:true, yeni:true, karar:'onay',
        emir:{ id:3, durum:'onaylandi', tahmin:{ metin:'yaklaşık 2 dakika' }, kontrol:[] } }) });
    });
  });
  /* Madde 10 (ilk yarı): üniversite ya da başka bir sınavın müfredatını
     kullanıcı kendisi yükler; AYS kendi sınırlarıyla süzer, ek profil olur. */
  describe('Sınav profili — müfredatı kendin yükle', () => {
    it('iki biçim okunur; tekrar ve boş ders düşer; kullanıcı beyanı etiketlidir', async () => {
      resetState();
      const metin = 'Matematik I: Limit, Türev; İntegral\n'
        + 'Fizik I:\n- Kinematik\n• Dinamik\n2. Enerji\n- dinamik\n'
        + 'Boş ders:\n';
      const r = R.SinavProfil.metindenProfil('Mühendislik 1. sınıf', metin);
      expect(r.ok).toBe(true);
      const p = r.profil;
      expect([p.kaynak, p.dogruluk, p.ad]).toEqual(['kullanici', 'kullanici', 'Mühendislik 1. sınıf']);
      expect(p.dersler.map(d => [d.ad, d.konular.map(k => k.ad)])).toEqual([
        ['Matematik I', ['Limit', 'Türev', 'İntegral']], ['Fizik I', ['Kinematik', 'Dinamik', 'Enerji']]]);
      expect(r.dusen >= 2).toBe(true);                          /* tekrar eden konu + boş ders */
      await R.SinavProfil.kaydet(p);
      expect(R.SinavProfil.liste().some(x => x.id === p.id)).toBe(true);
      expect((await R.SinavProfil.konuIsaretle(p.id, p.dersler[0].konular[0].id)).bitti).toBe(true);
      expect(R.SinavProfil.metindenProfil('x', metin).ok).toBe(false);      /* ad kısa */
      expect(R.SinavProfil.metindenProfil('Boş', 'hiçbir ders yok').ok).toBe(false);
    });
  });
})();
