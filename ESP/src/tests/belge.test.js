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

  /* Madde 11: tahmin tablolarının kaynaklı dayanağı. */
  describe('Tahmin tablolarının dayanağı', () => {
    function cefr(seviyeler){
      return { id:45, tur:'arastirma', baslik:'CEFR saat tablosu dayanağı', dogruluk:'kaynakli',
        created_at:'2026-09-24T10:00:00', govde:{ tur:'cefr', konu:'CEFR', kaynaklar:KAYNAK, seviyeler } };
    }
    it('CEFR: kaynaklı seviyeler tabloya girer, hesap kodda kalır; tutarsız tablo alınmaz; geri alınır', async () => {
      resetState();
      const H = ESP.Hedefler;
      expect(H.cefrTablo().B1).toBe(400);
      const bozuk = Be().sina(cefr([{ seviye:'B1', saat_alt:100, saat_ust:150, kaynak:2 }]), { kayit_id:45 });
      expect(bozuk.why).toContain('artmıyor');                     /* A2 200 > B1 150 */
      const k = cefr([{ seviye:'A2', saat_alt:180, saat_ust:200, kaynak:2 }, { seviye:'B1', saat_alt:350, saat_ust:420, kaynak:2 }]);
      const s = Be().sina(k, { kayit_id:45 });
      expect([s.ok, s.onizleme.baslik]).toEqual([true, 'CEFR saat tablosu — 2/6 seviye kaynaklı']);
      await withHkm({ 45:k }, async () => {
        const r = await Be().uygula({ kayit_id:45 });
        expect(r.ok).toBe(true);
        expect([H.cefrTablo().B1, H.cefrTablo().C1]).toEqual([420, 800]);
        const g = H.DIL.gerekenSaat({ hedefSeviye:'B1', simdi:{ deger:'A1' } });
        expect([g.saat, g.dayanak.durum]).toEqual([320, 'kaynakli']);
        expect(g.dayanak.metin).toContain('Stoacılık');           /* kaynağın başlığı */
        await Be().geriAl(r.geriAl);
        expect(H.cefrTablo().B1).toBe(400);
        expect(H.DIL.gerekenSaat({ hedefSeviye:'B1', simdi:{ deger:'A1' } }).dayanak.durum).toBe('kaynak_bekliyor');
      });
    });

    it('okuma hızı: kitap başına süre kaynaklı hızdan; kendi ölçümün yoksa', async () => {
      resetState();
      const k = { id:46, tur:'arastirma', baslik:'Okuma hızı dayanağı', dogruluk:'kaynakli', created_at:'2026-09-24T10:00:00',
        govde:{ tur:'okuma_hizi', konu:'okuma hızı', kaynaklar:KAYNAK, hizlar:[
          { ne:'sessiz okuma', kelime_dk:238, kaynak:2 }, { ne:'kurmaca', kelime_dk:260, kaynak:2 }, { kelime_dk:9000, kaynak:2 }] } };
      expect(ESP.Hedefler.kitapSaati('2026-09-24').dayanak.durum).toBe('kaynak_bekliyor');
      await withHkm({ 46:k }, async () => {
        const r = await Be().uygula({ kayit_id:46 });
        expect(r.ok).toBe(true);
        const ks = ESP.Hedefler.kitapSaati('2026-09-24');
        /* ortanca 249 kelime/dk → 80000 / 249 / 60 ≈ 5,35 → yarım saate yuvarlanır: 5,5 */
        expect([ks.saat, ks.etiket, ks.dayanak.durum]).toEqual([5.5, 'tahmin', 'kaynakli']);
        await Be().geriAl(r.geriAl);
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

  /* Diksiyon belgesi (kullanıcı 2026-09-24: «ikisi birden»): telaffuz kuralı
     Diksiyon ekranına kaynağıyla; okuma parçası çalışma metinlerine eklenir.
     Kısa ya da kaynaksız parça düşer; aynı parça ikinci kez girmez; geri alınır. */
  describe('BAM belgesi — diksiyon', () => {
    function diksiyon(){
      return { id:47, tur:'arastirma', baslik:'Diksiyon belgesi: vurgu', dogruluk:'kaynakli',
        govde:{ tur:'diksiyon', konu:'Türkçe vurgu', kaynaklar:KAYNAK,
          kurallar:[{ kural:'Türkçede vurgu çoğunlukla son hecededir.', ornek:'kalem', kaynak:2 },
            { kural:'Kaynaksız kural burada durur.', kaynak:9 }],
          parcalar:[{ metin:'Bir sabah uyandım ki pencerenin önünde kar yağıyor, sokaklar bembeyaz.', yazar:null, kaynak:2 },
            { metin:'Çok kısa.', kaynak:2 }] } };
    }
    it('kural ve parça sınanır, eklenir, çalışma metni olur; ikinci kez girmez; geri alınır', async () => {
      resetState();
      const s = Be().sina(diksiyon(), { kayit_id:47 });
      expect(s.ok).toBe(true);
      expect([s.kurallar.length, s.parcalar.length]).toEqual([1, 1]);
      expect(s.onizleme.uyari[0]).toContain('2');
      await withHkm({ 47:diksiyon() }, async () => {
        const r = await Be().uygula({ kayit_id:47 });
        expect(r.ok).toBe(true);
        const d = Be().diksiyon();
        expect(d.kurallar[0].kaynak.baslik).toBe('Stoacılık');
        expect(d.parcalar[0].words).toBe(10);
        expect(Be().calismaMetinleri().some(t => t.id === d.parcalar[0].id)).toBe(true);
        expect(Be().sina(diksiyon(), { kayit_id:47 }).ok).toBe(false);
        await Be().geriAl(r.geriAl);
        expect([Be().diksiyon().kurallar.length, Be().diksiyon().parcalar.length]).toEqual([0, 0]);
      });
    });
  });
})();
