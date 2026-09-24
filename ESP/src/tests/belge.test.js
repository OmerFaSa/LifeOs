/* BAM belgesi — tarih ve felsefe (core/belge.js, Part 8f). Kanıtladığı sözler:
   kayıt ESP'nin KENDİ koduyla sınanır (yıl, tür ve bölge sözlükten, kaynak
   bağı, tekrar); kaynaksız belge eklenmez; olay kaynağıyla Kronoloji'ye,
   tez açık argüman olarak Sempozyum'a, eser «başlanmadı» olarak girer;
   geri almada kullanıcının üzerinde çalıştığı kayıt kalır. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const Be = () => ESP.Belge;
  const KAYNAK = [{ n:1, baslik:'Osmanlı Beyliği — Vikipedi', url:'https://tr.wikipedia.org/wiki/Osmanl%C4%B1', tur:'ansiklopedi' },
    { n:2, baslik:'Stoacılık', url:'https://ornek.edu.tr/stoa', tur:'akademik' }];

  function tarih(patch){
    return Object.assign({ id:41, tur:'arastirma', baslik:'Tarih belgesi: Osmanlı', dogruluk:'kaynakli',
      govde:{ tur:'tarih', konu:'Osmanlı Beyliği', kaynaklar:KAYNAK, olaylar:[
        { baslik:'Osmanlı Beyliği’nin kuruluşu', yil:1299, tur:'siyasi', bolge:'anadolu', neden:'Başlangıç.', kaynak:1 },
        { baslik:'Bursa’nın fethi', yil:1326, tur:'siyasi', bolge:'anadolu', kaynak:1 },
        { baslik:'Sözlük dışı', yil:1300, tur:'askeri', bolge:'anadolu', kaynak:1 },
        { baslik:'Kaynaksız', yil:1301, tur:'siyasi', bolge:'anadolu', kaynak:9 } ] } }, patch || {});
  }
  function felsefe(){
    return { id:42, tur:'arastirma', baslik:'Felsefe belgesi: Stoacılık', dogruluk:'kaynakli',
      govde:{ tur:'felsefe', konu:'Stoacılık', kaynaklar:KAYNAK, dusunurler:[
        { ad:'Epiktetos', eser:'Encheiridion', yil:null, tez:'İnsan yalnız kendi yargılarını denetleyebilir.',
          kavramlar:['yargı', 'erdem'], kaynak:2 },
        { ad:'Marcus Aurelius', eser:'Kendime Düşünceler', yil:180, tez:'Evrenin düzenine uyum erdemdir.', kaynak:2 } ] } };
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
        return Promise.resolve({ status:200, json:async () => ({ ok:true, yeni:true, emir:{ id:44 } }) });
      }
      if(/\/take$/.test(url)){
        return Promise.resolve({ status:200, json:async () => ({ intents:kayitlar.__kuyruk || [] }) });
      }
      return Promise.resolve({ status:200, json:async () => ({}) });
    };
    await ESP.Beacon.save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' });
    try{ await fn(cagri); }
    finally{
      window.fetch = eski;
      await ESP.Beacon.save({ enabled:false, token:'' });
    }
  }

  describe('BAM belgesi — sınama', () => {
    it('tarih: sözlük dışı ve kaynaksız olay düşer; kaynak türünü kod verir', () => {
      resetState();
      const s = Be().sina(tarih(), { kayit_id:41 });
      expect(s.ok).toBe(true);
      expect(s.events.map(e => [e.title, e.year, e.era != null])).toEqual([
        ['Osmanlı Beyliği’nin kuruluşu', 1299, true], ['Bursa’nın fethi', 1326, true]]);
      expect(s.sources.length).toBe(1);
      expect([s.sources[0].kind, s.events[0].sourceIds[0]]).toEqual(['tertiary', s.sources[0].id]);
      expect(s.onizleme.uyari.join(' ')).toContain('2 olay ESP’nin denetimini geçmedi');
      expect(Be().sina(tarih({ dogruluk:'dogrulanmadi' }), { kayit_id:41 }).why).toContain('Kaynaksız');
      expect(Be().sina(tarih(), { kayit_id:40 }).ok).toBe(false);
    });

    it('felsefe: tez açık argüman, eser başlanmamış kitap', () => {
      resetState();
      const s = Be().sina(felsefe(), { kayit_id:42 });
      expect(s.ok).toBe(true);
      expect(s.args.map(a => a.thesis)).toEqual(['Epiktetos: İnsan yalnız kendi yargılarını denetleyebilir.',
        'Marcus Aurelius: Evrenin düzenine uyum erdemdir.']);
      expect([s.args[0].status, s.args[0].sourceId === s.books[0].id, s.args[0].concepts]).toEqual(['open', true, ['yargı', 'erdem']]);
      expect([s.books[0].kind, s.books[0].startedAt, s.books[0].author]).toEqual(['primary', null, 'Epiktetos']);
      expect(Be().istekTemizle({ alan:'astroloji', konu:'burçlar' }).ok).toBe(false);
    });
  });

  describe('BAM belgesi — okuma ve yazı', () => {
    function okuma(tur){
      return { id:43, tur:'arastirma', baslik:'Okuma listesi: Stoacılık', dogruluk:'kaynakli',
        govde:{ tur:tur || 'okuma', konu:'Stoacılık', kaynaklar:KAYNAK, eserler:[
          { yazar:'Epiktetos', eser:'Encheiridion', yil:null, not:'Temel el kitabı.', kaynak:2 },
          { yazar:'Seneca', eser:'Lucilius’a Mektuplar', yil:65, kaynak:2 },
          { yazar:'', eser:'Adsız', kaynak:2 } ] } };
    }
    it('eserler başlanmadı olarak Kütüphane’ye; not kitabın üstünde, notlara yazılmaz', async () => {
      resetState();
      await ESP.Model.saveBook(ESP.Model.newBook({ title:'Lucilius’a Mektuplar', author:'Seneca' }));
      const s = Be().sina(okuma(), { kayit_id:43 });
      expect(s.ok).toBe(true);
      expect(s.books.map(b => [b.author, b.startedAt, b.bam.not])).toEqual([['Epiktetos', null, 'Temel el kitabı.']]);
      expect(s.onizleme.uyari.join(' ')).toContain('1 eser Kütüphane’de zaten var');
      expect(Be().sina(okuma('yazi'), { kayit_id:43 }).onizleme.baslik).toContain('yazı örnekleri');
      await withHkm({ 43:okuma() }, async () => {
        const r = await Be().uygula({ kayit_id:43 });
        expect(r.ok).toBe(true);
        expect((ESP.S.notes || []).length).toBe(0);
        const g = await Be().geriAl(r.geriAl);
        expect([g.silinen, ESP.S.books.filter(b => b.bam).length]).toEqual([1, 0]);
      });
    });
  });

  /* Hata: başlanmamış kitap Okuma › Kaynaklar'da «okunuyor» görünüyordu. */
  describe('Kütüphane durumu', () => {
    it('başlanmamış kitap «başlanmadı» görünür, düğmesi «Başla»dır', async () => {
      resetState();
      const M = ESP.Model;
      const b = M.newBook({ title:'Encheiridion', author:'Epiktetos', startedAt:null });
      expect([M.bookStatus(b).label, M.bookStatus(b).action]).toEqual(['başlanmadı', 'Başla']);
      expect(M.bookStatus(Object.assign({}, b, { startedAt:'2026-09-01' })).label).toBe('okunuyor');
      expect(M.bookStatus(Object.assign({}, b, { startedAt:'2026-09-01', finishedAt:'2026-09-20' })).label).toBe('bitti');
    });
  });

  describe('BAM belgesi — HKM ile', () => {
    it('onayla eklenir, tekrar eklenmez; geri almada üzerinde çalışılan kalır', async () => {
      resetState();
      await withHkm({ 41:tarih(), 42:felsefe() }, async cagri => {
        const t = await Be().uygula({ kayit_id:41 });
        expect(t.ok).toBe(true);
        expect(ESP.S.events.filter(e => e.bam).length).toBe(2);
        expect((await Be().uygula({ kayit_id:41 })).error).toContain('zaten');
        const f = await Be().uygula({ kayit_id:42 });
        expect(f.ok).toBe(true);
        /* Kullanıcı bir teze itiraz yazdı: o tez ve eseri geri almada kalır. */
        const a = ESP.S.args.find(x => x.thesis.indexOf('Epiktetos') === 0);
        a.objections = [{ id:'o1', text:'Duygular da yargıdır mı?', answered:false, answer:'' }];
        const g = await Be().geriAl(f.geriAl);
        expect(g.kalan).toBe(2);
        expect(ESP.S.args.filter(x => x.bam).map(x => x.thesis.split(':')[0])).toEqual(['Epiktetos']);
        expect(ESP.S.books.filter(x => x.bam).map(x => x.author)).toEqual(['Epiktetos']);
        const g2 = await Be().geriAl(t.geriAl);
        expect([g2.silinen, ESP.S.events.filter(e => e.bam).length, ESP.S.sources.filter(s => s.bam).length]).toEqual([3, 0, 0]);
        const ist = await Be().iste({ alan:'tarih', konu:'Fransız Devrimi' });
        expect(ist.ok).toBe(true);
        const b = JSON.parse(cagri.find(c => /king\/emir$/.test(c.url)).opt.body);
        expect([b.tur, b.govde]).toEqual(['esp.belge', { belge:{ alan:'tarih', konu:'Fransız Devrimi' } }]);
      });
    });

    it('teklif kartı onaydan önce önizler', async () => {
      resetState();
      const kuyruk = [{ id:9301, kind:'belge.add', note:'not', payload:{ kayit_id:42, baslik:'Stoa', alan:'felsefe', adet:2 } }];
      await withHkm({ 42:felsefe(), __kuyruk:kuyruk }, async () => {
        await ESP.Beacon.load();
        const n = (await ESP.Beacon.intents()).find(x => x.id === 9301);
        expect([n.belge.ok, ESP.Beacon.canApply(n)]).toEqual([true, true]);
        const r = await ESP.Beacon.resolveIntent(n, 'apply');
        expect([r.ok, r.state, !!r.geriAl]).toEqual([true, 'applied', true]);
        await Be().geriAl(r.geriAl);
      });
    });
  });
})();
