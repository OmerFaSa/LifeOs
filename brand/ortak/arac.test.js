/* Araç kataloğu — tek kaynak `brand/ortak/arac.test.js`.

   Kanıtlanan sözler (brand/ortak/arac.js):
     1. Tek tip: bozuk tanım katalogdan düşer; King'in aracı modülünkünden önce.
     2. Doğrulama: bilinmeyen araç, tanımsız/eksik parametre, yanlış tip, enum
        ve sınır dışı değer reddedilir; tahminle düzeltilmez.
     3. Yazan araç önce önizlenir; model seçtiği için seviye en az «orta».
     5. Harita ve arama: işler, sayfalar ve araçlar kodun cümlesiyle.
     +  Sayı kullanıcınındır: modelin cümlesindeki sayı kullanıcınınkinde geçmeli. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const A = () => window.LIFEOS.ARAC;

  function sahne(modulAraclari, ortak){
    const a = A();
    a._sifirla();
    a.kur({ modul:'ays', araclar:modulAraclari || [] });
    a.ortakKur(ortak || []);
    return a;
  }
  function birak(){ A()._sifirla(); }
  async function sahneyle(fn){ try{ await fn(); } finally{ birak(); } }

  const DENEME = { ad:'ays_denemeler', tur:'oku', aciklama:'Deneme kayıtları.', ornek:'denemelerim', es:/denemelerim/,
    parametreler:{ type:'object', properties:{ aile:{ type:'string', enum:['TYT', 'AYT'] }, limit:{ type:'integer', minimum:1, maximum:20 } } },
    calistir:p => ({ sonuc:[{ tarih:'2026-10-12', net:63.25, aile:p.aile || 'TYT' }], satirlar:['2026-10-12 · 63,25 net'] }) };
  const yazilan = [];
  const HEDEF = { ad:'ays_week_target', tur:'yaz', seviye:'kucuk', aciklama:'Haftalık soru hedefini güncelle.',
    parametreler:{ type:'object', properties:{ hedef:{ type:'integer', minimum:50, maximum:5000 } }, required:['hedef'] },
    onizle:p => ({ metin:'Haftalık hedef ' + p.hedef + ' olacak.' }),
    uygula:async p => { yazilan.push(p.hedef); return { metin:'Hedef ' + p.hedef + '.', geriAl:async () => { yazilan.pop(); } }; } };

  describe('Araç kataloğu — tek tip', () => {
    it('bozuk tanım düşer; ad çakışırsa King’in aracı kazanır', () => sahneyle(async () => {
      const a = sahne([DENEME, HEDEF,
        { ad:'Kotu Ad', tur:'oku', aciklama:'x', calistir:() => 1 },
        { ad:'tursuz', tur:'sil', aciklama:'x', calistir:() => 1 },
        { ad:'fonksiyonsuz', tur:'yaz', aciklama:'x', onizle:() => ({}) },
        { ad:'gizli', tur:'oku', aciklama:'x', calistir:() => 1, kullanilir:() => false },
        { ad:'sema', tur:'oku', aciklama:'x', calistir:() => 1, parametreler:{ type:'object', properties:{ l:{ type:'array' } } } }],
        [{ ad:'ays_denemeler', tur:'oku', aciklama:'King’in kopyası.', calistir:() => ({ cevap:'king' }) }]);
      expect(a.liste().map(x => x.ad)).toEqual(['ays_denemeler', 'ays_week_target']);
      expect(a.bul('ays_denemeler').aciklama).toBe('King’in kopyası.');
      const m = a.modelIcin();
      expect(m[1]).toEqual({ ad:'ays_week_target', aciklama:'Haftalık soru hedefini güncelle.', tur:'yaz', parametreler:HEDEF.parametreler });
      expect(typeof m[1].uygula).toBe('undefined');
    }));
  });

  describe('Araç kataloğu — doğrulama', () => {
    it('bilinmeyen araç ve geçersiz parametre reddedilir', () => sahneyle(async () => {
      const a = sahne([DENEME, HEDEF]);
      expect(a.dogrula('ays_denemeler', '{"aile":"AYT","limit":3}')).toEqual({ ok:true, arac:a.bul('ays_denemeler'), param:{ aile:'AYT', limit:3 } });
      const neden = (ad, p) => a.dogrula(ad, p).hata;
      expect(neden('verileri_sil', {})).toBe('katalogda böyle bir araç yok');
      expect(neden('ays_denemeler', { aile:'LGS' })).toBe('aile izinli değerlerden biri olmalı');
      expect(neden('ays_denemeler', { limit:2.5 })).toBe('limit integer olmalı');
      expect(neden('ays_denemeler', { limit:'3' })).toBe('limit integer olmalı');
      expect(neden('ays_denemeler', { limit:50 })).toBe('limit en çok 20 olmalı');
      expect(neden('ays_denemeler', { gizli:true })).toBe('tanımsız parametre: gizli');
      expect(neden('ays_week_target', {})).toBe('eksik parametre: hedef');
      expect(neden('ays_week_target', '{bozuk')).toBe('parametreler JSON değil');
    }));

    it('okuma çalışır; yazma önizlenir, seviye en az orta, onayla uygulanır', () => sahneyle(async () => {
      yazilan.length = 0;
      const a = sahne([DENEME, HEDEF]);
      const r = await a.calistir('ays_denemeler', { aile:'AYT' });
      expect(r.ok).toBe(true);
      expect(r.sonuc[0].aile).toBe('AYT');
      expect(r.satirlar).toEqual(['2026-10-12 · 63,25 net']);
      expect((await a.calistir('ays_week_target', { hedef:900 })).ok).toBe(false);
      const o = await a.onizle('ays_week_target', { hedef:900 });
      expect(o.ok).toBe(true);
      expect(o.seviye).toBe('orta');
      expect(o.onizle.metin).toBe('Haftalık hedef 900 olacak.');
      expect(yazilan).toEqual([]);
      const u = await a.uygula({ arac:true, ad:'ays_week_target', param:{ hedef:900 } });
      expect(u.ok).toBe(true);
      expect(yazilan).toEqual([900]);
      await u.geriAl();
      expect(yazilan).toEqual([]);
      /* Onaydan sonra da doğrulanır: parametre bozulduysa uygulanmaz. */
      expect((await a.uygula({ arac:true, ad:'ays_week_target', param:{ hedef:1 } })).ok).toBe(false);
      expect(yazilan).toEqual([]);
    }));

    it('modelsiz: es taşıyan okuma aracı kuralla bulunur', () => sahneyle(async () => {
      const a = sahne([DENEME, HEDEF]);
      expect(a.kuralla('son denemelerim nasıl')).toEqual({ ad:'ays_denemeler', param:{} });
      expect(a.kuralla('hedefimi değiştir')).toBeNull();
    }));
  });

  describe('Araç kataloğu — harita ve sayı', () => {
    it('harita modülleri, sayfaları ve araçları kodun cümlesiyle verir', () => sahneyle(async () => {
      const a = sahne([DENEME, HEDEF]);
      const h = a.harita([{ modul:'ays', route:'exams', ad:'Deneme' }, { modul:'spi', route:'meals', ad:'Öğün' }]);
      expect(h.modul).toBe('AYS');
      expect(h.moduller.map(m => m.ad)).toEqual(['AYS', 'SPİ', 'ESP', 'HKM (Merkez)']);
      expect(h.moduller[0].sayfalar).toEqual(['Deneme']);
      expect(h.okuma).toEqual([{ ad:'ays_denemeler', ne:'Deneme kayıtları.', ornek:'denemelerim' }]);
      expect(h.yazma.length).toBe(1);
      expect(a.ara('deneme kayıtlarımı nereden görürüm').map(x => x.ad)).toEqual(['ays_denemeler']);
    }));

    /* Söz 6 (King 3.0 K5): tek alan — üç modülün işleri modüle göre, bulunulan önce. */
    it('işler modüle göre gruplanır; fotoğraf işleri modüllerin foto kimlikleriyle aynı', () => sahneyle(async () => {
      const a = sahne([DENEME]);
      expect(a.isler().map(g => g.modul)).toEqual(['ays', 'spi', 'esp', 'king']);
      a.kur({ modul:'esp', araclar:[] });
      expect(a.isler().map(g => [g.modul, g.burada])).toEqual([['esp', true], ['ays', false], ['spi', false], ['king', true]]);
      expect(a.ISLER.filter(x => x.tur === 'foto').map(x => x.modul + ':' + x.id)).toEqual(['ays:soru', 'spi:barkod', 'spi:ogun', 'esp:sayfa']);
      expect(a.ISLER.every(x => x.tur === 'foto' ? x.id && x.route && x.ne : x.ornek)).toBe(true);
      expect(a.isAra('barkod okutma').map(x => x.id)).toEqual(['barkod']);
      expect(a.harita([]).isler.length).toBe(4);
    }));

    it('modelin cümlesindeki sayı kullanıcının cümlesinde geçmeli (rakam ya da yazı)', () => {
      const a = A();
      expect(a.sayilar('kırk beş dakika, 7,5 saat, iki yüz yirmi ml')).toEqual([7.5, 45, 220]);
      expect(a.sayiKorunur('bugün matematik kırk soru bitti', 'matematikten 40 soru çözdüm')).toBe(true);
      expect(a.sayiKorunur('bugün matematik kırk soru bitti', 'matematikten 45 soru çözdüm')).toBe(false);
      expect(a.sayiKorunur('yedi buçuk saat uyudum', '7.5 saat uyudum')).toBe(true);
      expect(a.sayiKorunur('biraz uyudum', '7 saat uyudum')).toBe(false);
    });
  });
})();
